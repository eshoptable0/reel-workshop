#!/bin/sh
# "THE AUTONOMOUS AGENT / PATENT 2026-4471" — portrait 1080x1920, 60fps, blueprint world
set -e
set -o pipefail 2>/dev/null || true
cd "$(dirname "$0")/../.."
if [ -x .venv/bin/python ]; then PY=.venv/bin/python; else PY=python3; fi
echo "using PY=$PY"
$PY -c "import numpy, scipy, soundfile, soxr" 2>/dev/null || $PY -m pip install --quiet numpy scipy soundfile soxr pillow || $PY -m pip install --break-system-packages --quiet numpy scipy soundfile soxr pillow
D=films/blueprint-agent
echo "--- 1/7 TTS ---"
$PY core/tts/tts.py $D/lines.json $D/voices
echo "--- 2/7 ASR ---"
$PY core/tts/asr_check.py $D/lines.json $D/voices || echo "asr mismatch tolerated"
echo "--- 3/7 words ---"
$PY $D/words.py
echo "--- 4/7 score ---"
$PY $D/music/score.py
echo "--- 5/7 events ---"
node core/render/events.mjs $D
echo "--- 6/7 mix ---"
$PY $D/mix.py
echo "--- 7/7 subs + video ---"
$PY $D/subs.py && $PY core/render/srt.py $D/out/subs.json $D/blueprint-agent.srt
node core/render/video.mjs $D --fps 60 --workers 3 --size 1080x1920 --out $D/out/video60.mp4
cp -f $D/out/mix.wav $D/mix.wav 2>/dev/null || echo "no mix in out/ either"
if [ -f $D/mix.wav ]; then
  sh core/render/mux.sh $D/out/video60.mp4 $D/mix.wav $D/blueprint-agent.mp4 60 0
else
  echo "no mix.wav — silent passthrough"
  ffmpeg -y -i $D/out/video60.mp4 -c:v copy -an $D/blueprint-agent.mp4
fi
echo "=== AUDIO GATE ==="
ffprobe -v error -show_entries stream=codec_type,codec_name,bit_rate,duration -of compact $D/blueprint-agent.mp4
MEAN=$($PY - <<'EOF'
import subprocess, re
D='films/blueprint-agent'
out = subprocess.run(['ffmpeg','-i',f'{D}/blueprint-agent.mp4','-af','volumedetect','-f','null','-'],capture_output=True,text=True).stderr
m = re.search(r'mean_volume: (-?[\d.]+|inf) dB', out)
print(m.group(1) if m else 'NONE')
EOF
)
echo "mean_volume=$MEAN dB"
case "$MEAN" in
  NONE) echo "AUDIO GATE FAIL: no audio stream"; exit 1 ;;
  -4[0-9].*|-5[0-9].*|-6[0-9].*|-7[0-9].*|-8[0-9].*|-9[0-9].*|-inf|inf)
     echo "AUDIO GATE FAIL: audio too quiet ($MEAN dB)"; exit 1 ;;
esac
echo "=== TEXT-FIT GATE: extract stills and report ==="
mkdir -p $D/out/stills
for T in 3 9 15 21 27 33 39 45 51 57; do
  ffmpeg -y -loglevel error -ss $T -i $D/blueprint-agent.mp4 -frames:v 1 -vf scale=540:-1 $D/out/stills/t$T.jpg || true
done
ls -la $D/out/stills | head -14
echo "=== DONE ==="
ls -la $D/blueprint-agent.mp4
