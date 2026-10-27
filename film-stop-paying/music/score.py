"""placeholder score adapter — silent (score.json has silent_score: true). Keeps build.sh contract."""
import json, os, sys
D = os.path.dirname(os.path.abspath(__file__))
OUT = f'{D}/out'
os.makedirs(OUT, exist_ok=True)
meta = json.load(open(f'{D}/music/score.json'))
if meta.get('silent_score'):
    import wave
    with wave.open(f'{OUT}/score.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(48000)
        w.writeframes(b'\x00' * 48000 * 4 * int(meta.get('bars', 32) * 2))
    print('silent score written')
    sys.exit(0)
