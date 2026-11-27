# LEMO STYLE BENCHMARK — where things stand

Updated 2026-11-27 19:45 (cloud session). Read this first when resuming.

## Status of the 99 styles

| State | Count | Styles |
|---|---|---|
| **Done** (rendered, QA-reviewed from the final contact sheet) | 44 | 001–004, 006–020, 029–038 (not 039/040), 041–045, 047, 048, 050–055, 058, 059 |
| **Built, waiting for a render slot** (stills reviewed, queued in `tools/queue.txt`) | 33 | 039, 040, 046 (re-render after a QA fix), 057, 061 (4/6 chunks done), 062–065, 067–071, 073–085, 091–094, 096, 099 |
| **Blocked** (`BLOCKED.md` + `status.json` in each folder, with the steps to unblock) | 22 | 005, 021–028, 049, 056, 060, 066, 072, 086–090, 095, 097, 098 |

The blocked styles are never replaced by a generic version. Reasons, in short:
- **Image generator required** (the library marks them ✦): 005, 056, 066 and others listed in their `BLOCKED.md`.
- **Real archive or photo material** whose hosts this environment's network refuses (Wikimedia, LOC, Smithsonian, Rijksmuseum, IDR): 049, 072, 087, 089, 090.
- **Real data of a real place** for a story set in an invented street (satellite, lidar, white model, transit, 3D map): 086, 088, 095, 097, 098. Some data hosts answer (USGS lidar, Copernicus DEM and Sentinel-2 on AWS), so for these the user's decision is needed first: a real stand-in place, and the run shown as a labelled reconstruction.
- **CAD or product files** (060).

## The render runner

- Start (one at a time, in the background): `cd /home/user/Stories && BUDGET=5000 sh LEMO_STYLE_BENCHMARK/tools/render_bounded.sh`
- It walks `tools/queue.txt`, skips styles that already have `final.mp4` + `build/video.mp4` or a `build/.failed` mark, and renders in resumable 50-frame chunks.
  It starts no new chunk after BUDGET seconds and exits; start it again for the next stretch.
- Heavy three.js pages on this CPU renderer take 10–15 min per 50-frame chunk (061 took about 14 min per chunk). 2D canvas styles take seconds.
- After a style renders, its status is `qa`. Review `qa/contact_sheet.png` (or a montage of several), then:
  `$LEMO_PY shared/qa/finish_style.py styles/<dir> --meta-only --status done --note "…" --manual "…"`, then
  `$LEMO_PY tools/build_tracker.py` and `$LEMO_PY tools/build_gallery_data.py`, and commit.
  Only mark a style done after its contact sheet has actually been looked at.

## Still to do, in order

1. Keep the runner going until the 33 queued styles are rendered; review each and mark it done (or fix and re-queue).
2. Native sound design per style (the renders currently carry the common original audio, mastered to −14 LUFS).
3. Interaction tests: the jacket and the kitten (`interaction_tests/` is empty).
4. Optional Chatterbox voice test of the line "Oh, no... I'm going to miss the last train." with an authorised reference voice only.
5. Showreels A/B/C and the final report with scores and rankings (`reports/`, `comparison/` are empty).

## Tools

- `. /home/user/Stories/LEMO_CINEMATIC_LAB/tools/env.sh` sets `$LIB` (the library) and `$LEMO_PY`.
- Stills: `node shared/qa/still_long.mjs styles/<dir>/source <out> t1 t2 … [--q "k=v"]`; contact sheet of a still folder: `$LEMO_PY <scratch>/sheet.py <dir> <out.png> <cols>`.
- `shared/qa/rig_check.mjs` (the rig QA every render runs), `shared/qa/finish_style.py` (mux, previews, sheets, report, status).
- The data styles (094, 096) read `data/footfalls.csv`, exported from the shared run rig by `data/make_footfalls.mjs`.

## Rules kept everywhere

- AKI v2 from the shared rig: constant limb lengths, joint limits, foot lock; the same events in every style (splash 0.94 s, watch 6.05–7.15 s, the station clock 11:58:47 → 48 at 8.4 s, the chime at 9.58 s).
- In a shot whose camera follows AKI she is drawn on ones (a held drawing under a moving camera slides its planted foot).
- No logos, no CTA, no studio intro, no publishing; numbers on screen are the film's own (the rig's 4.06 m/s, 174 steps/min, the clock) or computed by the style's own simulation, and labelled as such.
