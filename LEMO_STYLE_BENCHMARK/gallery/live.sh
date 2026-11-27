#!/bin/sh
# LEMO STYLE LAB, live: serves the gallery on your computer and, every 5 minutes, pulls the new renders from GitHub
# and rebuilds the gallery data, so the videos appear one by one as they are rendered (reload the page to see them).
# Run from anywhere inside the repository checkout:   sh LEMO_STYLE_BENCHMARK/gallery/live.sh
# Needs: git, python3. Stop with Ctrl+C.
B="$(cd "$(dirname "$0")/.." && pwd)"; R="$(cd "$B/.." && pwd)"; BR="claude/compassionate-allen-ifg3v5"
cd "$B" && python3 tools/build_gallery_data.py >/dev/null 2>&1
( while sleep 300; do (cd "$R" && git pull -q --ff-only origin "$BR" 2>&1 | tail -1); (cd "$B" && python3 tools/build_gallery_data.py >/dev/null 2>&1); echo "$(date +%H:%M) updated: $(ls "$B"/styles/*/final.mp4 2>/dev/null | wc -l) videos"; done ) &
LOOP=$!; trap 'kill $LOOP 2>/dev/null' EXIT INT TERM
echo "open  http://127.0.0.1:8099/gallery/   ($(ls "$B"/styles/*/final.mp4 2>/dev/null | wc -l) videos now; new ones are added every 5 min)"
cd "$B" && python3 -m http.server 8099 --bind 127.0.0.1
