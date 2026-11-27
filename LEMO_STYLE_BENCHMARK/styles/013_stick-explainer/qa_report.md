# 013_stick-explainer — Stick-figure Explainer (Sketch & Board) — QA report

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
 "size_mb": 2.3
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
 "adjustments": 22,
 "lifted": 0,
 "pass": true
}
```
bone = [min, max] measured length in u over all frames (constant ⇒ no stretching); slide = planted-foot drift between frames.
## Visual review (done by the agent on stills / strips — not full-speed playback)
Paper drawn once (fine matte grain). Figures from the shared rig: one quadratic curve per limb with the joint as control point (k=.8), the spine one curve, the head a disc on the neck (only rotates about it), one weight per figure, proportional weight under zoom. AKI is the only accent (solid accent head): she is the change. S1: the boot lands in the puddle at 0.9375 s; the drops fly as ink dots and a ripple runs both ways along the system line with an accent front; the waiting figure dips and leans as it reaches him. S2: a row of commuters a step behind the line in the supporting grey (so she passes in front, no interpenetration), breathing and swaying on their own phases; they turn to her as she passes; the watch read is the arm raise and the head turn (no props in this style). S3: push in, 'one big number + one line': 23:58:41 → :42 (the seconds tick on the second, the accent on the seconds) and 'The last train leaves at 23:59.', left on the 124 px margin above the figures. S4: pull back (log zoom) along the line to the station node, which fills with the accent on the 9.575 s chime. Adaptations: no rain (paper and ink only), no face/hair/coat (style forbids character design): AKI is recognisable by the accent and the action. Rig QA PASS.

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild: stick people on warm paper, one curve per limb, one accent (AKI), the ground line carrying a ripple from the splash, commuters reacting, big number 23:58:SS + one meaning line, push in then pull back to the station node.
