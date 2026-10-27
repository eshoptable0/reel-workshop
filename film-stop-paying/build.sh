#!/bin/sh
# language: sh, target: lemo-opuscar engine — custom film "STOP PAYING" (swiss-motion style)
# runs from repo root: sh films/stop-paying/build.sh
set -e
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=films/stop-paying
$PY core/tts/tts.py $D/lines.json $D/voices
$PY core/tts/asr_check.py $D/lines.json $D/voices || echo "asr mismatch tolerated"
$PY $D/tools/words.py
$PY $D/music/score.py
node core/render/events.mjs $D
$PY $D/mix.py
$PY $D/tools/subs.py && $PY core/render/srt.py $D/out/subs.json $D/stop-paying.srt
node core/render/video.mjs $D --fps 24 --workers 2 --out $D/out/video24.mp4
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav $D/stop-paying.mp4 24 0
