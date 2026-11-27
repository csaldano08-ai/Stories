# MASTER 08 — working notes / resume point

## State
- v1 rendered, muxed, QA'd (`qa_v1/`), strips reviewed. v2 = fix round (see `QA_REPORT.md` defect log) → final deliverable.
- Timeline authority: `src/timeline.js` (96 BPM, 20 shots, 74.375 s). Build: `sh build.sh` (≈ 30 min on 4 vCPU).
- Voices final: `audio/voice/final/{A1,A2,D1,A3}.wav` (+ `_raw`, `_clean.json`, `selection.json`).
- Score: `audio/music/score.py` (+ `synth80.py`). Sound design & mix: `audio/mix.py`. Master WAV: `audio/last-train-home_master_48k.wav`.

## Next round (to reach the 9/10 MASTER bar)
1. Rig the 3/4 bust arms (IK to the bundle) and add hand poses with fingers to the full-body profile hands.
2. Build a rear-3/4 body view for the boarding (replace the door-occlusion trick) and a front-3/4 running bust for S5.
3. Richer train exterior/interior plates (seat fabric pattern, ads with generic words, ceiling vents, reflections in the window glass).
4. Sound: record-quality textures are impossible without samples; consider CC0 field recordings (rain, station, train) from Freesound
   (CC0 only) after the user agrees; keep synthesis for foley that must sync to frames.
5. Human pass: listen to every line, mew, purr; watch at full speed.
6. Vertical 1080×1920 re-composition: every shot function takes `innerWidth/innerHeight`; add per-shot vertical cameras (the rig and
   plates are resolution-independent; the S2 tracking shot becomes a tighter vertical track, S4 crane already vertical-friendly).
