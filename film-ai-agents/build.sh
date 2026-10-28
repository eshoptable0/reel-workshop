#!/bin/sh
# "AI AGENTS: HYPE VS REALITY" — portrait 1080x1920, 60fps, full audio (drone bed + TTS + foley)
set -e
set -o pipefail 2>/dev/null || true
cd "$(dirname "$0")/../.."
if [ -x .venv/bin/python ]; then PY=.venv/bin/python; else PY=python3; fi
echo "using PY=$PY"
$PY -c "import numpy, scipy, soundfile, soxr" 2>/dev/null || $PY -m pip install --quiet numpy scipy soundfile soxr pillow || $PY -m pip install --break-system-packages --quiet numpy scipy soundfile soxr pillow
D=films/ai-agents
echo "--- 1/6 TTS ---"
$PY core/tts/tts.py $D/lines.json $D/voices
echo "--- 2/6 ASR ---"
$PY core/tts/asr_check.py $D/lines.json $D/voices || echo "asr mismatch tolerated"
echo "--- 3/6 words ---"
$PY $D/words.py
echo "--- 4/6 score ---"
$PY $D/music/score.py
echo "--- 5/6 events+mix ---"
node core/render/events.mjs $D
$PY $D/mix.py
echo "--- 6/6 subs + video ---"
$PY $D/subs.py && $PY core/render/srt.py $D/out/subs.json $D/ai-agents.srt
node core/render/video.mjs $D --fps 60 --workers 3 --size 1080x1920 --out $D/out/video60.mp4
cp -f $D/out/mix.wav $D/mix.wav 2>/dev/null || echo "no mix in out/ either"
if [ -f $D/mix.wav ]; then
  sh core/render/mux.sh $D/out/video60.mp4 $D/mix.wav $D/ai-agents.mp4 60 0
else
  echo "no mix.wav — silent passthrough"
  ffmpeg -y -i $D/out/video60.mp4 -c:v copy -an $D/ai-agents.mp4
fi
echo "=== AUDIO GATE ==="
ffprobe -v error -show_entries stream=codec_type,codec_name,bit_rate,duration -of compact $D/ai-agents.mp4
MEAN=$($PY - <<'EOF'
import subprocess, re
D='films/ai-agents'
out = subprocess.run(['ffmpeg','-i',f'{D}/ai-agents.mp4','-af','volumedetect','-f','null','-'],capture_output=True,text=True).stderr
m = re.search(r'mean_volume: (-?[\d.]+) dB', out)
print(m.group(1) if m else 'NONE')
EOF
)
echo "mean_volume=$MEAN dB"
echo "=== AUDIO GATE: mean_volume must be above -40 dB ==="
case "$MEAN" in
  NONE) echo "AUDIO GATE FAIL: no audio stream"; exit 1 ;;
  -4[0-9].*|-5[0-9].*|-6[0-9].*|-7[0-9].*|-8[0-9].*|-9[0-9].*|-inf)
     echo "AUDIO GATE FAIL: audio too quiet ($MEAN dB) — dj rejects silent reels"; exit 1 ;;
esac
echo "=== VIDEO GATE: bitrate ==="
$PY - <<'EOF'
import subprocess, json, sys
D='films/ai-agents'
out = subprocess.run(['ffprobe','-v','error','-show_entries','format=bit_rate','-of','json',f'{D}/ai-agents.mp4'],capture_output=True,text=True).stdout
br = int(json.loads(out)['format']['bit_rate'])
print('total bitrate:', br)
EOF
ls -la $D/ai-agents.mp4
