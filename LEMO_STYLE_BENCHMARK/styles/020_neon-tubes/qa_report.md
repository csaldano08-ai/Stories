# 020_neon-tubes — Neon Tubes (Light & Lines) — QA report

Style construction: Canvas 2D, WebGL shader pass. Narrative adaptation: no.

## Automated checks (measured on final.mp4)
```
{
 "frames": 300,
 "fps": "30/1",
 "size": "1920x1080",
 "codec": "h264",
 "pix_fmt": "yuvj420p",
 "duration_s": 10.0,
 "audio": "aac 48000 Hz 2 ch",
 "black": [],
 "frozen_ge_0.7s": [],
 "lufs": -14.2,
 "true_peak_dbtp": -1.0,
 "size_mb": 7.4
}
```
## Rig QA (all 300 frames, `shared/qa/rig_check.mjs`)
```
{
 "bone": {
  "thigh": [
   150,
   150
  ],
  "shin": [
   144,
   144
  ],
  "upper": [
   108,
   108
  ],
  "fore": [
   92,
   92
  ]
 },
 "kneeBackward": 0,
 "slideMaxU": 0,
 "slideFrames": 0,
 "belowGround": 0,
 "adjustments": 18,
 "lifted": 0,
 "pass": true
}
```
bone = [min, max] measured length in u over all frames (constant ⇒ no stretching); slide = planted-foot drift between frames.
## Visual review (done by the agent on stills / strips — not full-speed playback)
Engine copied unchanged from the demo (gl.js tube renderer + lib.js). Original monoline glyphs for every sign; signs strike in sequence on the 8th-note grid. AKI is a single neon outline traced from her rig silhouette each key (Moore trace with backtrack, RDP + Chaikin), purple hair tube, white eye, yellow watch ring. Native adaptation (documented): neon does not move continuously — her pose switches on the 16th-note grid like an animated sign (held through the watch insert), the camera tracks on ones. Shots: S1 puddle at ground level (reflected tubes, splash as a burst of short tubes at 0.9375 s), S2 truck along the shop row (BOOKS, NOODLES, HOTEL, BAR, LAUNDRY …), S3 macro of the tube arm and the watch dial (ticks + hands), S4 wide of the facades with the clock tube that strikes on the chime (9.575 s). Review fixes: empty silhouette before the run starts guarded, Moore trace rewritten (it returned 4 points), one transient WebGL context loss re-rendered. Rig QA PASS.

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild: the whole 10 s told in neon tubes on a dark wet street — glass tubes with glow, struck signs, a figure traced as one neon outline, switched poses on the 16th-note grid, reflections in the wet ground
