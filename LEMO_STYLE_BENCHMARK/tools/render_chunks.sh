#!/bin/sh
# Resumable render of one style in chunks of N frames (default 50): each chunk is its own render_long run (3 workers) into
# build/chunks/c_<a>.mp4; chunks already on disk are skipped, so a render stopped by a time limit continues where it was.
# When every chunk exists they are joined losslessly into build/video.mp4.
#   sh LEMO_STYLE_BENCHMARK/tools/render_chunks.sh LEMO_STYLE_BENCHMARK/styles/008_brick-toy [50]
. "$(dirname "$0")/../../LEMO_CINEMATIC_LAB/tools/env.sh"
B="$(cd "$(dirname "$0")/.." && pwd)"; ST="$1"; N="${2:-50}"; C="$ST/build/chunks"; mkdir -p "$C"
a=0; : > "$C/list.txt"
while [ $a -lt 300 ]; do b=$((a + N)); [ $b -gt 300 ] && b=300
  f="c_$(printf %03d $a).mp4"
  if [ ! -s "$C/$f" ]; then
    start=$(date +%s)
    node "$B/tools/render_long.mjs" "$ST/source" --fps 30 --workers 3 --frames $a:$b --out "$C/$f" 2>&1 | grep -v "^\[note\]\|GL Driver\|^\[page\]\|^w[0-9]" | tail -1
    echo "   chunk $a:$b $(( $(date +%s) - start )) s"
  fi
  [ -s "$C/$f" ] || { echo "chunk $a:$b missing"; exit 1; }
  echo "file '$f'" >> "$C/list.txt"; a=$b
done
( cd "$C" && ffmpeg -y -loglevel error -f concat -safe 0 -i list.txt -c copy ../video.mp4 ) && echo "joined $ST/build/video.mp4"
