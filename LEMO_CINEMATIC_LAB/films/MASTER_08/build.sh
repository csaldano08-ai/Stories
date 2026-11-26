#!/bin/sh
# Rebuild "Last Train Home" from source: events → score → sound design/mix → picture → master (−14 LUFS, −1 dBTP) → QA.
# Voices are already rendered (audio/voice/final). To regenerate them: see bible/VOICE_BIBLE.md and audio/voice/*.json.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
. "$HERE/../../tools/env.sh"          # LAB, LIB (=~/lemo-opuscar), ffmpeg 9 on PATH, TTS_PY, LEMO_PY
[ -f "$LIB/core/render/video.mjs" ] || { echo "Lemo-Opuscar library not found at $LIB (run tools/setup_lab.sh)"; exit 1; }
cd "$LIB"
node core/render/events.mjs "$HERE/src"
"$LEMO_PY" "$HERE/audio/music/score.py"
"$LEMO_PY" "$HERE/audio/mix.py"
node core/render/video.mjs "$HERE/src" --fps 30 --workers ${WORKERS:-4} --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/audio/mix.wav" "$HERE/last-train-home.mp4" 30 2
"$TTS_PY" "$LAB/tools/quality_assurance/qa_film.py" "$HERE/last-train-home.mp4" --lines "$HERE/audio/lines_final.json" --out "$HERE/qa" \
  --quiet "16.4:18.6,42.0:43.1"
