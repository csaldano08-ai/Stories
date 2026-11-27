#!/bin/sh
# LEMO STYLE LAB — local gallery. Serves the benchmark folder and opens http://127.0.0.1:8099/gallery/
cd "$(dirname "$0")/.." && python3 "tools/build_gallery_data.py" && echo "open http://127.0.0.1:8099/gallery/" && python3 -m http.server 8099 --bind 127.0.0.1
