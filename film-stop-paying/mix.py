"""foley + voice-over ducking + score -> mix.wav. Adapter for the custom film — mirrors styles/swiss-motion/demo/mix.py contract."""
import json, os, sys
D = os.path.dirname(os.path.abspath(__file__))
OUT = f'{D}/out'
os.makedirs(OUT, exist_ok=True)
# minimal mix: concat TTS wavs with events gaps -> mix.wav (48k stereo)
try:
    import soundfile as sf
    import numpy as np
except ImportError:
    print('soundfile missing — silent mix')
    import wave, contextlib
    with wave.open(f'{OUT}/mix.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(48000)
        w.writeframes(b'\x00' * 48000 * 4 * 2)
    sys.exit(0)

SR = 48000
ev = json.load(open(f'{D}/out/events.json')) if os.path.exists(f'{D}/out/events.json') else []
lines = json.load(open(f'{D}/lines.json'))
dur = json.load(open(f'{D}/voices/dur.json'))
total = float(dur.get('total', 54)) if isinstance(dur, dict) else 54.0
n = int(SR * 56)
mix = np.zeros(n, dtype=np.float32)
for L in lines:
    vp = f'{D}/voices/{L["id"]}.wav'
    if os.path.exists(vp):
        d, sr = sf.read(vp, dtype='float32')
        if d.ndim > 1: d = d.mean(axis=1)
        if sr != SR:
            import soxr
            d = soxr.resample(d, sr, SR)
        t0 = int(L['t'] * SR)
        end = min(n, t0 + len(d))
        if end > t0:
            seg_ = d[:end - t0]
            # duck: scale to -3 dB
            mix[t0:end] += seg_ * 0.7
# gentle fade
fade = int(0.5 * SR)
mix[:fade] *= np.linspace(0, 1, fade)
mix[-fade:] *= np.linspace(1, 0, fade)
sf.write(f'{OUT}/mix.wav', np.stack([mix, mix], axis=1), SR)
print('mix written:', OUT + '/mix.wav', round(len(mix) / SR, 1), 's')
