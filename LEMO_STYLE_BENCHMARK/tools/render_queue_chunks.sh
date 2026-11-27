#!/bin/sh
# Like render_queue.sh, for heavy pages: waits until no other render runs, then for each style: rig QA → chunked resumable
# render (render_chunks.sh) → finish_style.py --status qa. A queue stopped by a time limit is simply started again:
# finished chunks and finished styles (build/video.mp4 + final.mp4 present) are skipped.
. "$(dirname "$0")/../../LEMO_CINEMATIC_LAB/tools/env.sh"
B="$(cd "$(dirname "$0")/.." && pwd)"
while pgrep -f "render_long.mjs" >/dev/null; do sleep 30; done
for ST in "$@"; do
  echo "== $(date +%H:%M:%S) $ST"
  if [ -s "$ST/final.mp4" ] && [ -s "$ST/build/video.mp4" ]; then echo "   already finished"; continue; fi
  [ -s "$ST/animation/rig_qa.json" ] || node "$B/shared/qa/rig_check.mjs" "$ST/source" "$ST/animation/rig_qa.json" 2>&1 | grep -v "GL Driver\|^\[note\]" | tail -1 | cut -c1-160
  [ -s "$ST/build/video.mp4" ] || sh "$B/tools/render_chunks.sh" "$ST" 50 || { echo "   render incomplete for $ST"; exit 1; }
  $LEMO_PY "$B/shared/qa/finish_style.py" "$ST" --grain 0 --status qa 2>&1 | tail -1
done
echo "== queue done $(date +%H:%M:%S)"
