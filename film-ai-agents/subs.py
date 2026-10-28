"""Subtitle intervals -> out/subs.json. Lives in film root."""
import json, os
D = os.path.dirname(os.path.abspath(__file__))
LINES = json.load(open(f'{D}/lines.json'))
dur = json.load(open(f'{D}/voices/dur.json'))
cues = []
for L in LINES:
    t1 = L['t'] + max(2.0, dur[L['id']] + 0.7)
    cues.append({'t0': L['t'], 't1': min(t1, L['t'] + 4.8), 'text': L['text']})
os.makedirs(f'{D}/out', exist_ok=True)
json.dump(cues, open(f'{D}/out/subs.json', 'w'), indent=1)
print(len(cues), 'cues ok')
