# 003_midcentury-toon — Mid-century Cartoon (Cartoons) — QA report

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
 "size_mb": 12.4
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
S1 legs drawn on twos (stand camera, push 3.5%); the boot lands in the kidney puddle at 0.9375 s with a paper starburst, inked droplets and broken ring ripples; 24H / CAFE boards upside down in the water. S2 run on ones because the camera tracks (foot lock beats the held-drawing rule; cels, blinks and hand shapes still change on twos); lamp posts phased so none crosses AKI during the watch check; watch raise lands on the 6.25 s beat with anticipation and follow-through; the sleeve slides back to uncover the watch (no pop). S2→S3 iris closes on the near wrist and reopens on the watch exactly at 7.5 s. S3 watch at native scale, two-plate numerals, 11:58, second hand ticks each second. S4 cut on the beat, tilt begins, chime rings from the starburst clock at 9.575 s. Adaptation: four-finger cartoon hands (style convention) and a larger egg head; AKI's identity markers kept (plum bob, vermilion trench, cream roll-neck, charcoal trousers, brown boots, gold watch on the left wrist). Rig QA PASS (bones constant, slide 0).

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild: off-register colour cels re-rolled on twos, broken breathing ink, flat colour-plane street, geometric AKI on the shared rig, starburst splashes, iris through the watch, starburst station clock.
