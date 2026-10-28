"""whisper word timings -> per-word appearance offsets (relative to line start). flattened: lives in film root."""
import json, os, re
D = os.path.dirname(os.path.abspath(__file__))
lines = json.load(open(f'{D}/lines.json'))
words = json.load(open(f'{D}/voices/words.json'))
norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
num = {'one': '1', 'two': '2', 'four': '4', 'zero': '0'}
out = {}
for L in lines:
    sub = L['text'].split()
    ws = words.get(L['id'], [])
    res = []
    j = 0
    for w in sub:
        target = norm(w)
        target2 = num.get(target, target)
        acc = ''
        t0 = None
        while j < len(ws) and acc not in (target, target2):
            if t0 is None:
                t0 = max(0.0, ws[j][1])
            acc += norm(ws[j][0])
            j += 1
        res.append(round(t0 if t0 is not None else 0.0, 3))
    out[L['id']] = res
json.dump(out, open(f'{D}/voices/words_rel.json', 'w'), indent=0)
print('words_rel ok')
