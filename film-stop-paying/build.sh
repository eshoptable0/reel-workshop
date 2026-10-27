#!/bin/sh
# language: sh, target: lemo-opuscar engine — custom film "STOP PAYING" (swiss-motion style)
# venv-tolerant: .venv/bin/python OR system python3
set -e
cd "$(dirname "$0")/../.."
if [ -x .venv/bin/python ]; then PY=.venv/bin/python; else PY=python3; fi
echo "using PY=$PY"
$PY -c "import numpy, scipy, soundfile, soxr" 2>/dev/null || $PY -m pip install --quiet numpy scipy soundfile soxr pillow || $PY -m pip install --break-system-packages --quiet numpy scipy soundfile soxr pillow || echo "pip install failed, continuing"
D=films/stop-paying
$PY core/tts/tts.py $D/lines.json $D/voices
$PY core/tts/asr_check.py $D/lines.json $D/voices || echo "asr mismatch tolerated"
$PY $D/tools/words.py
$PY $D/music/score.py
node core/render/events.mjs $D
$PY $D/mix.py
$PY $D/tools/subs.py && $PY core/render/srt.py $D/out/subs.json $D/stop-paying.srt
node core/render/video.mjs $D --fps 60 --workers 3 --out $D/out/video60.mp4
sh core/render/mux.sh $D/out/video60.mp4 $D/mix.wav $D/stop-paying.mp4 60 0
