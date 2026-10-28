"""narration + drafting-room bed -> mix.wav. FOLEY OPTIONAL (core.audio may be missing)."""
import json, os, sys, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
D = HERE
OUT = f'{D}/out'
os.makedirs(OUT, exist_ok=True)

try:
    import soundfile as sf
    import soxr
except ImportError:
    print('soundfile missing — 2s silent mix')
    with wave.open(f'{OUT}/mix.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(48000)
        w.writeframes(b'\x00' * 48000 * 4 * 2)
    sys.exit(0)

sys.path.insert(0, os.getcwd())
SR = 48000
DUR = 60.0
N = int(DUR * SR)
mix = np.zeros((N, 2), np.float32)

try:
    from core.audio import sfx as S
    FOLEY = True
except Exception as e:
    print('foley unavailable:', e)
    FOLEY = False

lines = json.load(open(f'{D}/lines.json'))
rng = np.random.default_rng(11)
t_all = np.arange(N, dtype=np.float32) / SR

def add16(mono, at, gain=1.0):
    i0 = int(at * SR)
    if i0 >= N or i0 < 0: return
    seg = mono[:min(len(mono), N - i0)]
    mix[i0:i0+len(seg), 0] += seg * gain
    mix[i0:i0+len(seg), 1] += seg * gain

# ---------- 1. bed: low mechanical hum + paper hiss (drafting room) ----------
hum = (np.sin(2 * np.pi * 48.0 * t_all) * .30
       + np.sin(2 * np.pi * 48.35 * t_all) * .24
       + np.sin(2 * np.pi * 96.0 * t_all) * .09)
hum *= (0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t_all - 0.8)).astype(np.float32)
hiss = rng.standard_normal(N).astype(np.float32) * 0.05
k = 900                                     # heavier low-pass = paper room tone
hiss = np.convolve(hiss, np.ones(k, dtype=np.float32) / k, mode='same').astype(np.float32)
# a faint ticking clock — marks the "hours passing" motif
tick = np.zeros(N, dtype=np.float32)
beat = int(SR * 0.5)
for i in range(0, N - 4000, beat):
    env = np.exp(-np.arange(2000) / 220.0).astype(np.float32)
    tick[i:i + 2000] += (rng.standard_normal(2000).astype(np.float32) * env) * 0.16
bed = (hum * 0.13 + hiss * 0.6 + tick * 0.11).astype(np.float32)

# duck under narration
duck = np.ones(N, dtype=np.float32)
for L in lines:
    i0 = int(max(0, L['t'] - 0.15) * SR)
    i1 = int(min(DUR, L['t'] + 4.0) * SR)
    duck[i0:i1] *= 0.44
duck = np.convolve(duck, np.ones(int(.35 * SR), dtype=np.float32) / int(.35 * SR), mode='same').astype(np.float32)
mix[:, 0] += bed * duck
mix[:, 1] += bed * duck

# ---------- 2. narration ----------
for L in lines:
    vp = f'{D}/voices/{L["id"]}.wav'
    if os.path.exists(vp):
        x, sr = sf.read(vp, dtype='float32')
        if x.ndim > 1: x = x.mean(axis=1)
        if sr != SR: x = soxr.resample(x, sr, SR)
        add16(x * 0.95, L['t'])
        print(f'voice {L["id"]}: {len(x)/SR:.1f}s at {L["t"]}')
    else:
        print(f'MISSING voice: {vp}')

# ---------- 3. foley ----------
if FOLEY:
    def at(name, t, gain=1.0):
        if name == 'thump': x = S.thump(f=54)
        elif name == 'clack': x = S.clack()
        elif name == 'whoosh': x = S.whoosh(.5)
        elif name == 'ding': x = S.ding()
        elif name == 'heartbeat': x = S.heartbeat()
        else: x = S.clack()
        add16(x, t, gain)
    ev = json.load(open(f'{D}/out/events.json')) if os.path.exists(f'{D}/out/events.json') else None
    if ev:
        # honour the film's own event track so audio and motion stay locked
        for e in ev:
            at(e.get('type', 'clack'), float(e['t']), float(e.get('gain', .7)))
        print(f'foley from events.json: {len(ev)} hits')
    else:
        at('whoosh', .3, .5); at('clack', 1.2, .6); at('clack', 6.4, .7)
        for ft in (12.0, 18.4, 24.4):
            at('clack', ft, .8); at('whoosh', ft + .55, .35)
        at('heartbeat', 30.6, .8); at('thump', 42.4, 1.0)
        at('ding', 48.6, .8); at('thump', 54.4, .9)
else:
    print('SKIPPING foley')

fi = int(.5 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
mix[-fi:] *= np.linspace(1, 0, fi)[:, None]
peak = float(np.max(np.abs(mix))) or 1.0
mix = (mix / peak * 0.92).astype(np.float32)
sf.write(f'{OUT}/mix.wav', mix, SR)
rms = float(np.sqrt(np.mean(mix.astype(np.float64) ** 2)))
print('mix.wav:', round(DUR, 1), 's, foley =', FOLEY, '| peak-normalized, rms =', round(rms, 4))
