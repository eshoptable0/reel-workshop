"""silent score (music/) — build contract. Real bed lives in mix.py."""
import json, os, wave
HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.abspath(os.path.join(HERE, '..'))
OUT = f'{D}/out'
os.makedirs(OUT, exist_ok=True)
meta = json.load(open(os.path.join(D, 'music', 'score.json')))
with wave.open(f'{OUT}/score.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(48000)
    w.writeframes(b'\x00' * 48000 * 4 * int(meta.get('bars', 30) * 2))
print('silent score written')
