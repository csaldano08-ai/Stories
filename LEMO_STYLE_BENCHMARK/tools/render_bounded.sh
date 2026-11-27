#!/bin/sh
# Bounded, resumable render runner (replaces the open-ended render_daemon.sh for time-limited background jobs): renders the
# styles listed in tools/queue.txt in order, one heavy render at a time, each in resumable 50-frame chunks (render_chunks.sh),
# then finish_style.py --status qa. It starts no new chunk once BUDGET seconds (default 5400) have passed and exits, so a
# job with a time limit never loses work: run it again and it continues at the first missing chunk of the first unfinished style.
# Styles with final.mp4 + build/video.mp4 are finished; build/.failed marks a style whose render failed (skipped).
#   cd <repo> && BUDGET=5400 sh LEMO_STYLE_BENCHMARK/tools/render_bounded.sh
. "$(dirname "$0")/../../LEMO_CINEMATIC_LAB/tools/env.sh"
B="$(cd "$(dirname "$0")/.." && pwd)"; Q="$B/tools/queue.txt"; R="$(cd "$B/.." && pwd)"
END=$(( $(date +%s) + ${BUDGET:-5400} )); export DEADLINE=$END
waitfree() { while pgrep -f "render_queue_chunks|render_long.mjs" >/dev/null; do
  [ "$(date +%s)" -ge $END ] && { echo "== $(date +%H:%M:%S) budget spent while waiting for another render"; exit 0; }; sleep 30; done; }
# EDIT: iterate over a word list, not `while read` on a redirected file: the render tools inside the loop (ffmpeg) read stdin
# and swallowed queue lines. Every inner command also gets </dev/null.
for d in $(grep -v '^$' "$Q"); do
  ST="$R/$d"; [ -d "$ST/source" ] || { echo "   skip (no source): $d"; continue; }
  { [ -f "$ST/final.mp4" ] && [ -s "$ST/build/video.mp4" ]; } && continue; [ -f "$ST/build/.failed" ] && continue
  waitfree
  [ "$(date +%s)" -ge $END ] && { echo "== $(date +%H:%M:%S) budget spent; next: $d"; exit 0; }
  echo "== $(date +%H:%M:%S) $d"
  [ -s "$ST/animation/rig_qa.json" ] || node "$B/shared/qa/rig_check.mjs" "$ST/source" "$ST/animation/rig_qa.json" </dev/null 2>&1 | grep -v "GL Driver\|^\[note\]" | tail -1 | cut -c1-160
  if [ ! -s "$ST/build/video.mp4" ]; then
    sh "$B/tools/render_chunks.sh" "$ST" 50 </dev/null; rc=$?
    [ $rc -eq 2 ] && { echo "== $(date +%H:%M:%S) budget spent inside $d (chunks kept)"; exit 0; }
    [ -s "$ST/build/video.mp4" ] || { mkdir -p "$ST/build"; touch "$ST/build/.failed"; echo "   FAILED $d"; continue; }
  fi
  $LEMO_PY "$B/shared/qa/finish_style.py" "$ST" --grain 0 --status qa </dev/null 2>&1 | tail -1
done
echo "== $(date +%H:%M:%S) queue exhausted"
