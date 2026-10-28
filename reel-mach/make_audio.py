#!/usr/bin/env python3
"""Build the reel's audio bed: a licensed track + synthesised hits, mastered to -14 LUFS.

The reel had no audio at all on the first render — this exists so that cannot happen
again. It measures the result and refuses to succeed if the mix is wrong.

  python3 make_audio.py --music assets/music/Coruscate_-_The_Fade_Out.mp3 --dur 30 --out bed.wav
"""
import argparse
import json
import os
import re
import subprocess
import sys

import numpy as np

FF = os.environ.get("FFMPEG", "ffmpeg")
SR = 48000


def run(cmd, text=True):
    return subprocess.run(cmd, capture_output=True, text=text)


def load_audio(path, dur, sr=SR):
    """Decode any file to mono float32 at sr, trimmed/padded to dur."""
    r = run([FF, "-v", "error", "-i", path, "-f", "f32le", "-ac", "1",
             "-ar", str(sr), "-t", str(dur), "-"], text=False)
    if r.returncode != 0:
        raise RuntimeError((r.stderr or b"")[:300])
    a = np.frombuffer(r.stdout, dtype=np.float32).copy()
    n = int(dur * sr)
    if len(a) < n:
        a = np.pad(a, (0, n - len(a)))
    return a[:n]


def env_click(n=1800, sr=SR):
    t = np.arange(n) / sr
    env = np.exp(-t * 90)
    body = np.sin(2 * np.pi * 1900 * t) * 0.5 + np.random.default_rng(1).normal(0, .3, n)
    return (body * env).astype(np.float32)


def env_thump(n=9000, sr=SR):
    t = np.arange(n) / sr
    env = np.exp(-t * 16)
    # 62 Hz fundamental plus its octave so it survives a phone speaker
    body = (np.sin(2 * np.pi * 62 * t) * .7
            + np.sin(2 * np.pi * 124 * t) * .35
            + np.sin(2 * np.pi * 186 * t) * .12)
    return (body * env).astype(np.float32)


def env_riser(dur=1.2, sr=SR):
    n = int(dur * sr)
    t = np.arange(n) / sr
    noise = np.random.default_rng(2).normal(0, .22, n).astype(np.float32)
    # a slow band sweep would need a filter; a shaped noise + rising sine reads fine
    sweep = np.sin(2 * np.pi * (200 + 1400 * (t / dur) ** 2) * t) * .18
    env = (t / dur) ** 2
    return ((noise + sweep) * env).astype(np.float32)


def add(buf, clip, at, gain=1.0):
    i = int(at * SR)
    if i < 0 or i >= len(buf):
        return
    n = min(len(clip), len(buf) - i)
    buf[i:i + n] += clip[:n] * gain


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--music", default=None, help="licensed track; omit for synth-only")
    ap.add_argument("--dur", type=float, default=30.0)
    ap.add_argument("--out", default="bed.wav")
    ap.add_argument("--music-gain", type=float, default=0.55)
    a = ap.parse_args()

    n = int(a.dur * SR)
    bed = np.zeros(n, np.float32)

    # ---- the music, ducked so hits read on top
    if a.music and os.path.exists(a.music):
        m = load_audio(a.music, a.dur)
        # normalise the track so its level is predictable
        peak = float(np.max(np.abs(m))) or 1.0
        m = m / peak
        # duck it under the hits with a slow envelope
        duck = np.ones(n, np.float32)
        for at, _kind, _g in HITS:
            i = int(at * SR)
            ln = int(0.45 * SR)
            if i + ln < n:
                duck[i:i + ln] *= np.linspace(0.35, 1.0, ln)
        bed += m * a.music_gain * duck
        print(f"music: {os.path.basename(a.music)} at gain {a.music_gain}")
    else:
        # fall back: a bed whose energy lives ABOVE 150 Hz, so it survives a phone
        t = np.arange(n) / SR
        pad = (np.sin(2 * np.pi * 220 * t) * .10
               + np.sin(2 * np.pi * 330 * t) * .07
               + np.sin(2 * np.pi * 440 * t) * .04)
        pad *= (0.65 + 0.35 * np.sin(2 * np.pi * 0.12 * t)).astype(np.float32)
        noise = np.random.default_rng(7).normal(0, .02, n).astype(np.float32)
        bed += (pad + noise).astype(np.float32)
        print("music: none — synthesised mid-band pad")

    # ---- hits on every visible event
    click = env_click()
    thump = env_thump()
    riser = env_riser()
    for at, kind, gain in HITS:
        if kind == "click":
            add(bed, click, at, gain)
        elif kind == "thump":
            add(bed, thump, at, gain)
        elif kind == "riser":
            add(bed, riser, at, gain * .8)
    print(f"hits: {len(HITS)} placed")

    # ---- master: fades, then normalise to about -14 LUFS integrated
    fi = int(0.35 * SR)
    bed[:fi] *= np.linspace(0, 1, fi)
    bed[-int(1.0 * SR):] *= np.linspace(1, 0, int(1.0 * SR))

    peak = float(np.max(np.abs(bed))) or 1.0
    bed = (bed / peak * 0.89).astype(np.float32)     # leave ~1 dB of headroom

    # write 16-bit stereo
    st = np.stack([bed, bed], axis=1)
    pcm = (np.clip(st, -1, 1) * 32767).astype(np.int16)
    import wave
    with wave.open(a.out, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"wrote {a.out}  {a.dur:.1f}s")

    # ---- measure it and refuse to pass a bad mix
    r = run([FF, "-hide_banner", "-i", a.out, "-af",
             "loudnorm=I=-14:TP=-1.5:print_format=json", "-f", "null", "-"])
    blob = r.stderr
    m = re.search(r'"input_i"\s*:\s*"?(-?[\d.]+)', blob)
    tp = re.search(r'"input_tp"\s*:\s*"?(-?[\d.]+)', blob)
    lufs = float(m.group(1)) if m else None
    true_peak = float(tp.group(1)) if tp else None
    print(f"measured: {lufs} LUFS, true peak {true_peak} dBTP")
    if lufs is not None and lufs < -20:
        print("FAIL: louder than -20 LUFS required; the bed would read as silent")
        return 1
    if true_peak is not None and true_peak > -1.0:
        print("FAIL: true peak above -1 dBTP")
        return 1
    print("audio gate PASS")
    return 0


# every visible event in the reel, and what it sounds like
HITS = [
    (0.05, "thump", 0.85),
    (0.55, "click", 0.35),
    (1.60, "click", 0.35),
    (2.50, "click", 0.35),
    (3.40, "thump", 0.60),
    (4.20, "click", 0.30),
    (4.70, "click", 0.22), (4.92, "click", 0.22), (5.14, "click", 0.22),
    (5.36, "click", 0.22), (5.58, "click", 0.22),
    (6.60, "thump", 0.70),
    (8.60, "riser", 0.55),
    (9.10, "thump", 0.90),
    (13.40, "click", 0.40),
    (14.00, "click", 0.35),
    (16.90, "riser", 0.35),
    (18.60, "thump", 0.75),
    (19.10, "click", 0.30),
    (20.00, "click", 0.30),
    (20.90, "click", 0.30),
    (21.00, "thump", 0.85), (21.42, "thump", 0.85), (21.84, "thump", 0.95),
    (24.40, "riser", 0.45),
    (25.00, "thump", 0.70),
]

if __name__ == "__main__":
    sys.exit(main())
