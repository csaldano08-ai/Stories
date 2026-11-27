# 004_scifi-toon — Sci-Fi Sitcom Toon (Cartoons) — QA report

Style construction: Canvas 2D. Narrative adaptation: no.

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
 "size_mb": 5.6
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
 "slideMaxU": 3.907985046680551e-14,
 "slideFrames": 0,
 "belowGround": 0,
 "adjustments": 21,
 "lifted": 0,
 "pass": true
}
```
bone = [min, max] measured length in u over all frames (constant ⇒ no stretching); slide = planted-foot drift between frames.
## Visual review (done by the agent on stills / strips — not full-speed playback)
Line: engine strokes after transforming to screen, so close-ups keep 7 px; 3 boil drawings on twos (15 fps for this 30 fps clip). Flat-band skies, nothing glows (the genre reserves glow for a travel device; none in this clip). S1 legs on twos; a non-verbal puddle creature (style §2: one disgusting-and-adorable creature per world) peeks, does a take at 0.55 s, ducks with anticipation before the boot lands at 0.9375 s, resurfaces with a decaying squash and gives the deadpan reaction (style §6: every absurd image is followed by a reaction). S2 run on ones because the camera tracks (foot lock); face acting on twos: lidded deadpan, the take at 6.5 s (eyes pop, pupils shrink and tremble, grimace, sweat drop, nervous head jitter growing with panic); the sleeve slides back to uncover the gadget watch. S3 extreme close-up insert with a short decaying shake on the hit, 11:58, second hand ticking, her panic reflected faintly in the crystal. S4 flat-band sky with lumpy clouds, tilt starts, the clock face squashes on the 9.575 s chime. Adaptation: big-headed genre proportions (head x1.35); AKI's identity markers kept. Rig QA PASS.

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild: constant 7 px boiling outlines, flat fills + hard shadow shapes, big white eyes with tiny pupils, ultraviolet+gold world, a puddle creature's take and deadpan reaction, the watch as junk hardware.
