#!/bin/sh
# One heavy render at a time, in order: processes the style folders listed in tools/queue.txt (one per line, relative to the
# repo root; lines can be appended while it runs). Waits while a chunked queue or any other render is running, renders the
# next style without final.mp4 (rig QA → render → finish_style --status qa), marks failures with build/.failed and moves on.
# Stops when the list is exhausted and tools/queue.stop exists (otherwise it polls for new lines every minute).
#   cd <repo> && sh LEMO_STYLE_BENCHMARK/tools/render_daemon.sh
B="$(cd "$(dirname "$0")/.." && pwd)"; Q="$B/tools/queue.txt"; R="$(cd "$B/.." && pwd)"
while :; do
  while pgrep -f "render_queue_chunks|render_long.mjs" >/dev/null; do sleep 30; done
  NEXT=""; while read -r d; do [ -z "$d" ] && continue; [ -f "$R/$d/final.mp4" ] || [ -f "$R/$d/build/.failed" ] || { NEXT="$d"; break; }; done < "$Q"
  if [ -z "$NEXT" ]; then [ -f "$B/tools/queue.stop" ] && break; sleep 60; continue; fi
  (cd "$R" && sh "$B/tools/render_queue.sh" "$NEXT")
  [ -f "$R/$NEXT/final.mp4" ] || { mkdir -p "$R/$NEXT/build"; touch "$R/$NEXT/build/.failed"; echo "   FAILED $NEXT"; }
done
echo "== daemon done $(date +%H:%M:%S)"
