"""foley + narration -> mix.wav for the phone-steals film (48k stereo, -14 LUFS target handled by mux)."""
import json, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.abspath(os.path.join(HERE, '..'))
OUT = f'{D}/out'
os.makedirs(OUT, exist_ok=True)

try:
    import soundfile as sf
    import soxr
except ImportError:
    print('soundfile missing — 2s silent mix')
    import wave
    with wave.open(f'{OUT}/mix.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(48000)
        w.writeframes(b'\x00' * 48000 * 4 * 2)
    sys.exit(0)

sys.path.insert(0, os.getcwd())           # lemo repo root — core.audio
SR = 48000
DUR = 54.0
N = int(DUR * SR)
mix = np.zeros((N, 2), np.float32)

from core.audio import sfx as S

lines = json.load(open(f'{D}/lines.json'))
dur = json.load(open(f'{D}/voices/dur.json'))

def add16(mono, at, gain=1.0, pan=0.0):
    i0 = int(at * SR)
    seg = mono[:max(0, min(len(mono), N - i0))]
    if len(seg) <= 0: return
    l = gain * (1 - max(0, pan)) ** .5
    r = gain * (1 + min(0, pan)) ** .5
    mix[i0:i0+len(seg), 0] += seg * gain
    mix[i0:i0+len(seg), 1] += seg * gain

# narration
for L in lines:
    vp = f'{D}/voices/{L["id"]}.wav'
    if os.path.exists(vp):
        x, sr = sf.read(vp, dtype='float32')
        if x.ndim > 1: x = x.mean(axis=1)
        if sr != SR: x = soxr.resample(x, sr, SR)
        add16(x * .8, L['t'])

# foley — timeline events
def at(name, t, gain=1.0):
    if name == 'heartbeat': x = S.heartbeat()
    elif name == 'thump': x = S.thump(f=62)
    elif name == 'clack': x = S.clack()
    elif name == 'whoosh': x = S.whoosh(.5)
    elif name == 'ding': x = S.ding()
    else: x = S.clack()
    add16(x, t, gain)

at('thump', 3.0, 1.0)
for i in range(6):
    at('clack', 10.0 + i * 4.6, .6)
at('whoosh', 37.6, .8)
at('ding', 43.0, .7)
at('thump', 47.2, .9)

# 60fps tick underlay — soft metronome during apps section
for i in range(6):
    for b in range(4):
        t_ = 10.0 + i * 4.6 + b * 1.15
        add16(S.click(pitch=1 + .05 * b), t_, .12)

# fade in/out
fi = int(.4 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
mix[-fi:] *= np.linspace(1, 0, fi)[:, None]
# limit
mix = S.limit(mix, .9)
sf.write(f'{OUT}/mix.wav', mix, SR)
print('mix.wav:', round(DUR, 1), 's written')
