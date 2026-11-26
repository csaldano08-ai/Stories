# MASTER 08 — working notes / resume point

## State (update as work progresses)
- Treatment: `TREATMENT.md` (final). Timeline authority: `src/timeline.js` (96 BPM, 20 shots, DUR 74.375 s).
- Voices chosen (`audio/voice/final/selection.json`, raw takes `*_raw.wav`): A1 aki_heart gasp s1, A2 aki_heart soft s1,
  D1 drv_michael full s3, A3 aki_heart thanks_breath s2. Lip-sync words: `src/data/lipsync.json`. Not yet cleaned/mixed.
- Engine: `src/lib/{cel,post}.js` (adapted MIT from the demo), `src/lib/celgroup.js` (union cel, bbox-limited masks),
  `src/lib/rig.js` (IK, gait, lag sim), `src/chars/{aki,head,hair,palette,motion}.js`.
- Shots done (first pass): S1–S5 in `src/shots_a.js`. To do: S6–S13 (`shots_b.js`), S14–S20 (`shots_c.js`).
- Perf: ~1 s per character frame (CPU canvas, willReadFrequently) + 0.6 s capture.

## Known issues to fix in the fix round
- S1: puddle rim ellipse too visible; S2: street plate lacks depth (darken upper floors, add vertical signs, balconies);
- S3: hand blob shape; S4: crane must end with platform+train in the top third (end y≈1250) and figure ground ≈ y 2200;
- Station plate entrance too plain (doors, frames). S5 good.

## Render commands
```
. LEMO_CINEMATIC_LAB/tools/env.sh; cd $LIB
node core/render/still.mjs $LAB/films/MASTER_08/src <t…> --out <dir>      # stills
node core/render/video.mjs $LAB/films/MASTER_08/src --fps 30 --workers 4 --out $LAB/films/MASTER_08/out/video.mp4
```
