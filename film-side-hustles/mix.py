"""foley + narration -> mix.wav. FOLEY OPTIONAL (core.audio may be missing)."""
import json, os, sys
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
    import wave
    with wave.open(f'{OUT}/mix.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(48000)
        w.writeframes(b'\x00' * 48000 * 4 * 2)
    sys.exit(0)

sys.path.insert(0, os.getcwd())
SR = 48000
DUR = 50.0
N = int(DUR * SR)
mix = np.zeros((N, 2), np.float32)

try:
    from core.audio import sfx as S
    FOLEY = True
except Exception as e:
    print('foley unavailable:', e)
    FOLEY = False

lines = json.load(open(f'{D}/lines.json'))

def add16(mono, at, gain=1.0):
    i0 = int(at * SR)
    if i0 >= N: return
    seg = mono[:min(len(mono), N - i0)]
    mix[i0:i0+len(seg), 0] += seg * gain
    mix[i0:i0+len(seg), 1] += seg * gain

# 1. narration (always)
for L in lines:
    vp = f'{D}/voices/{L["id"]}.wav'
    if os.path.exists(vp):
        x, sr = sf.read(vp, dtype='float32')
        if x.ndim > 1: x = x.mean(axis=1)
        if sr != SR: x = soxr.resample(x, sr, SR)
        add16(x * .85, L['t'])
        print(f'voice {L["id"]}: {len(x)/SR:.1f}s at {L["t"]}')
    else:
        print(f'MISSING voice: {vp}')

# 2. foley (optional)
if FOLEY:
    def at(name, t, gain=1.0):
        if name == 'thump': x = S.thump(f=62)
        elif name == 'clack': x = S.clack()
        elif name == 'whoosh': x = S.whoosh(.5)
        elif name == 'ding': x = S.ding()
        elif name == 'heartbeat': x = S.heartbeat()
        else: x = S.clack()
        add16(x, t, gain)
    at('thump', 1.0, 1.0)
    at('heartbeat', 2.6, .8)
    for i in range(3):
        at('clack', 9.2 + i * 4.7, .7)
        at('whoosh', 11.5 + i * 4.7, .4)
    at('ding', 36.6, .8)
    at('thump', 45.0, .9)
else:
    print('SKIPPING foley')

fi = int(.4 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
mix[-fi:] *= np.linspace(1, 0, fi)[:, None]
try:
    if FOLEY: mix = S.limit(mix, .9)
except: pass
sf.write(f'{OUT}/mix.wav', mix, SR)
print('mix.wav:', round(DUR, 1), 's, foley =', FOLEY)
