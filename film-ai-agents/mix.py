"""foley + narration + bed -> mix.wav. FOLEY OPTIONAL (core.audio may be missing)."""
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
DUR = 56.0
N = int(DUR * SR)
mix = np.zeros((N, 2), np.float32)

try:
    from core.audio import sfx as S
    FOLEY = True
except Exception as e:
    print('foley unavailable:', e)
    FOLEY = False

lines = json.load(open(f'{D}/lines.json'))
rng = np.random.default_rng(7)

def add16(mono, at, gain=1.0):
    i0 = int(at * SR)
    if i0 >= N or i0 < 0: return
    seg = mono[:min(len(mono), N - i0)]
    mix[i0:i0+len(seg), 0] += seg * gain
    mix[i0:i0+len(seg), 1] += seg * gain

# ---------- 1. low drone bed (own synthesis — always available) ----------
# two detuned sines + filtered noise, slow bloom, keeps the reel audible & tense
t_all = np.arange(N, dtype=np.float32) / SR
drone = (np.sin(2 * np.pi * 55.0 * t_all) * .34
         + np.sin(2 * np.pi * 55.4 * t_all) * .28
         + np.sin(2 * np.pi * 82.5 * t_all) * .12)
# slow amplitude breathing at 0.25 Hz
drone *= (0.55 + 0.45 * np.sin(2 * np.pi * 0.25 * t_all - 1.4)).astype(np.float32)
# noise wash, low-passed by simple moving average
noise = rng.standard_normal(N).astype(np.float32) * 0.05
k = 400
kernel = np.ones(k, dtype=np.float32) / k
noise = np.convolve(noise, kernel, mode='same').astype(np.float32)
bed = (drone * 0.16 + noise * 0.55).astype(np.float32)

# duck the bed under narration (simple envelope follower)
duck = np.ones(N, dtype=np.float32)
for L in lines:
    i0 = int(max(0, L['t'] - 0.15) * SR)
    i1 = int(min(DUR, L['t'] + 3.6) * SR)
    duck[i0:i1] *= 0.42
# smooth duck transitions
smooth = np.ones(int(0.35 * SR), dtype=np.float32) / int(0.35 * SR)
duck = np.convolve(duck, smooth, mode='same').astype(np.float32)
mix[:, 0] += bed * duck
mix[:, 1] += bed * duck

# ---------- 2. narration ----------
for L in lines:
    vp = f'{D}/voices/{L["id"]}.wav'
    if os.path.exists(vp):
        x, sr = sf.read(vp, dtype='float32')
        if x.ndim > 1: x = x.mean(axis=1)
        if sr != SR: x = soxr.resample(x, sr, SR)
        add16(x * 0.92, L['t'])
        print(f'voice {L["id"]}: {len(x)/SR:.1f}s at {L["t"]}')
    else:
        print(f'MISSING voice: {vp}')

# ---------- 3. foley (optional) ----------
if FOLEY:
    def at(name, t, gain=1.0):
        if name == 'thump': x = S.thump(f=58)
        elif name == 'clack': x = S.clack()
        elif name == 'whoosh': x = S.whoosh(.55)
        elif name == 'ding': x = S.ding()
        elif name == 'heartbeat': x = S.heartbeat()
        else: x = S.clack()
        add16(x, t, gain)
    at('thump', 1.0, 1.0)
    at('heartbeat', 5.8, .7)
    for i in range(3):
        at('clack', 10.2 + i * 4.8, .85)
        at('whoosh', 12.3 + i * 4.8, .6)
    at('ding', 40.6, .9)
    at('thump', 50.4, .95)
else:
    print('SKIPPING foley')

# ---------- 4. master ----------
fi = int(.5 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
mix[-fi:] *= np.linspace(1, 0, fi)[:, None]
peak = float(np.max(np.abs(mix))) or 1.0
mix = (mix / peak * 0.92).astype(np.float32)
sf.write(f'{OUT}/mix.wav', mix, SR)
rms = float(np.sqrt(np.mean(mix.astype(np.float64) ** 2)))
print('mix.wav:', round(DUR, 1), 's, foley =', FOLEY, '| peak-normalized, rms =', round(rms, 4))
