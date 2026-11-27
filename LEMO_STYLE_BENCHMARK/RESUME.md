- **Done:** lab created; reference 10 s extracted and analysed (`reference/`); inventory generated (`STYLE_INVENTORY.json`); gallery (`gallery/`).
- **Now:** first series (001–020) in order.
  - Done: 001, 002, 003, 004, 006, 007, 010, 011, 013, 014.
  - Rendered, in QA: 015 Crayon Picture Book.
  - Rendering: 008 Brick Toy (render_long, 3 workers), 016 Chinese Ink Wash (2 workers).
  - Built, stills reviewed, waiting for a render slot: 017 Ukiyo-e, 009 Low-poly Island.
  - Blocked (image generator ✦, `BLOCKED.md` in each folder): 005, 056, 066.
  - Still to build in the first series: 012 Tilt-shift (heavy 3D), 018 Paper-cut Lightbox, 019 Liminal Found Footage (3D), 020 Neon Tubes.
- **Then:** 021–099; native sound-design versions; interaction tests (jacket, kitten); optional Chatterbox voice test; showreels A/B/C; final report.
- **Tools:** `tools/render_long.mjs` (renderer with a 15 min screenshot timeout for heavy WebGL pages), `shared/qa/still_long.mjs`,
  `shared/qa/rig_check.mjs`, `shared/qa/finish_style.py` (caps the video bitrate when a final would exceed 90 MB: GitHub's 100 MB limit).
- **Rule kept everywhere:** in a shot whose camera follows AKI she is drawn on ones (a held drawing under a moving camera slides its
  planted foot); styles that step their figures do so only on still/locked framings, and each manual says where.
