# LEMO_STYLE_BENCHMARK — the first 10 seconds of *Last Train Home* in every Lemo-Opuscar style

**Question:** how far does each of the 99 installed styles change character design, modelling, animation, rig, materials, textures,
environments, light, atmosphere, direction, editing, transitions, rendering, depth, expressiveness and sound — when it tells the same 10 s?

**Baseline:** `reference/original_clip.mp4` = frames 0–299 of the delivered MASTER 08 (cuts at 2.5 / 7.5 / 9.375 s), with its audio,
stems, contact sheet and an exact shot list (`reference/shot_list.json`: actions, camera, 29 footfall times, hit points, palettes).

**Rules (from the brief):** no filters over the original; every style rebuilt with its own native construction; same events and the
same intervals; the protagonist recognisable but adapted; all clips 1920×1080, 30 fps, exactly 300 frames, H.264 + stereo AAC;
two audio versions per clip — `common` (the original 10 s mix, so only the picture differs) and `native` (style sound design).
Styles that need an image generator are marked blocked, never faked.

| path | what |
|---|---|
| `STYLE_INVENTORY.json` | 99 styles from the installed library (principles, construction, engine, camera grammar, motion, native moves, limits, deps, tools) — `tools/build_inventory.py` |
| `PRODUCTION_TRACKER.md` | status of every style — `tools/build_tracker.py` from each `styles/*/status.json` |
| `QUALITY_STANDARDS.md` | the acceptance checks (rig, collisions, animation, rendering, audio) |
| `reference/` | baseline clip, audio, stems, contact sheet, shot list, `character_bible/` (the improved protagonist) |
| `shared/` | code shared where it does not flatten a style's identity (timeline, rig maths, QA) |
| `styles/NNN_slug/` | one reproducible project per style: `source/` (page), `assets/`, `animation/`, `audio/`, `preview.mp4`, `final.mp4`, `thumbnail.png`, `qa_report.md`, `status.json` |
| `interaction_tests/` | 5–8 s jacket-and-kitten tests for character styles |
| `gallery/` | LEMO STYLE LAB — local comparison gallery (`sh gallery/serve.sh`) |
| `reports/`, `showreels/` | comparative report, showreels A/B/C |
