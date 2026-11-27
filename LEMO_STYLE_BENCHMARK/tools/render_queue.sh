#!/bin/sh
# One heavy render at a time (this machine has 4 cores): waits until no other render_long.mjs is running, then for each style
# directory given: rig QA → render (3 workers, long screenshot timeout) → finish_style.py --status qa (contact sheet, strip,
# measured QA). Styles are marked done only after a visual review (finish_style.py --meta-only --status done --manual …).
#   sh LEMO_STYLE_BENCHMARK/tools/render_queue.sh LEMO_STYLE_BENCHMARK/styles/017_ukiyoe LEMO_STYLE_BENCHMARK/styles/018_paper-lantern …
. "$(dirname "$0")/../../LEMO_CINEMATIC_LAB/tools/env.sh"
B="$(cd "$(dirname "$0")/.." && pwd)"
while pgrep -f "render_long.mjs" >/dev/null; do sleep 30; done
for ST in "$@"; do
  echo "== $(date +%H:%M:%S) $ST"
  node "$B/shared/qa/rig_check.mjs" "$ST/source" "$ST/animation/rig_qa.json" 2>&1 | grep -v "GL Driver\|^\[note\]" | tail -1 | cut -c1-160
  start=$(date +%s)
  node "$B/tools/render_long.mjs" "$ST/source" --fps 30 --workers 3 --out "$ST/build/video.mp4" 2>&1 | grep -v "^\[note\]\|GL Driver\|^\[page\]" | tail -2
  echo "   render $(( $(date +%s) - start )) s"
  [ -f "$ST/build/video.mp4" ] || { echo "   NO VIDEO for $ST"; continue; }
  $LEMO_PY "$B/shared/qa/finish_style.py" "$ST" --grain 0 --status qa 2>&1 | tail -1
done
echo "== queue done $(date +%H:%M:%S)"
