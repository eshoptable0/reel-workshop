"""silent score adapter — score.json sits next to music/ (i.e. ../score.json from here)."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))          # films/stop-paying/music
D = os.path.abspath(os.path.join(HERE, '..'))               # films/stop-paying
OUT = f'{D}/out'
os.makedirs(OUT, exist_ok=True)
meta = json.load(open(os.path.join(D, 'music', 'score.json')))
if meta.get('silent_score'):
    import wave
    with wave.open(f'{OUT}/score.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(48000)
        w.writeframes(b'\x00' * 48000 * 4 * int(meta.get('bars', 32) * 2))
    print('silent score written:', f'{OUT}/score.wav')
    sys.exit(0)
# non-silent scores need core.audio — not wired for this film yet
print('non-silent score not implemented')
sys.exit(1)
