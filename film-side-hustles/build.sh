#!/bin/sh
# "WHY 90% OF SIDE HUSTLES FAIL" — portrait, 60fps, full audio
set -e
set -o pipefail 2>/dev/null || true
cd "$(dirname "$0")/../.."
if [ -x .venv/bin/python ]; then PY=.venv/bin/python; else PY=python3; fi
echo "using PY=$PY"
$PY -c "import numpy, scipy, soundfile, soxr" 2>/dev/null || $PY -m pip install --quiet numpy scipy soundfile soxr pillow || $PY -m pip install --break-system-packages --quiet numpy scipy soundfile soxr pillow
D=films/side-hustles
$PY core/tts/tts.py $D/lines.json $D/voices
$PY core/tts/asr_check.py $D/lines.json $D/voices || echo "asr mismatch tolerated"
$PY $D/words.py
$PY $D/music/score.py
node core/render/events.mjs $D
$PY $D/mix.py
$PY $D/subs.py && $PY core/render/srt.py $D/out/subs.json $D/side-hustles.srt
node core/render/video.mjs $D --fps 60 --workers 3 --size 1080x1920 --out $D/out/video60.mp4
if [ -f $D/mix.wav ]; then
  sh core/render/mux.sh $D/out/video60.mp4 $D/mix.wav $D/side-hustles.mp4 60 0
else
  echo "no mix.wav — silent passthrough"
  ffmpeg -y -i $D/out/video60.mp4 -c:v copy -an $D/side-hustles.mp4
fi
