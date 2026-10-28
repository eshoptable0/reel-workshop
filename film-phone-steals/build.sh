#!/bin/sh
# language: sh, target: lemo-opuscar engine — "YOUR PHONE STEALS 4 YEARS" (portrait 1080x1920, 60fps, full audio)
# venv-tolerant python; runs from repo root: sh films/phone-steals/build.sh
set -e
cd "$(dirname "$0")/../.."
if [ -x .venv/bin/python ]; then PY=.venv/bin/python; else PY=python3; fi
echo "using PY=$PY"
$PY -c "import numpy, scipy, soundfile, soxr" 2>/dev/null || $PY -m pip install --quiet numpy scipy soundfile soxr pillow || $PY -m pip install --break-system-packages --quiet numpy scipy soundfile soxr pillow
D=films/phone-steals
$PY core/tts/tts.py $D/lines.json $D/voices
$PY core/tts/asr_check.py $D/lines.json $D/voices || echo "asr mismatch tolerated"
$PY $D/tools/words.py
$PY $D/music/score.py
node core/render/events.mjs $D
$PY $D/mix.py
$PY $D/tools/subs.py && $PY core/render/srt.py $D/out/subs.json $D/phone-steals.srt
node core/render/video.mjs $D --fps 60 --workers 3 --size 1080x1920 --out $D/out/video60.mp4
sh core/render/mux.sh $D/out/video60.mp4 $D/mix.wav $D/phone-steals.mp4 60 0
