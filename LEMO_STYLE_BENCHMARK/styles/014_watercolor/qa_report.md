# 014_watercolor — Watercolor Brush (Painting & Illustration) — QA report

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
 "size_mb": 11.1
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
 "adjustments": 19,
 "lifted": 0,
 "pass": true
}
```
bone = [min, max] measured length in u over all frames (constant ⇒ no stretching); slide = planted-foot drift between frames.
## Visual review (done by the agent on stills / strips — not full-speed playback)
Engine globals from the style's demo (mk/drawS stroke ribbons with bristle tracks = flying white; drawList painting-in). Washes: graded (pigment settles low), 3 jittered passes, pooled wet edge, granulation in the tooth, rare soft backruns; the paper is the white (lit windows are unpainted paper under a warm glaze) and is multiplied over the finished picture so its fibres show through every transparent layer. AKI is painted from the shared rig with fixed-seed strokes (vermilion accent coat, plum hair strokes, skin wash, trousers, boots; rig QA PASS). S1 paints itself in during the first 0.6 s; the boot lands in the pool at 0.9375 s: brush flicks and a ring; the windows' glow pulled down in the water ripples after it. S2 lateral dolly: shops paint themselves in stroke by stroke as they enter from the right; the hand note '23:58' writes itself left to right with a pen leader to her wrist at the watch beat. S3 slow push into the watch as a specimen: gold wash ring, the dial left as paper, ink hands, vermilion second hand on the second, note '23:58' + mono label 'LAST TRAIN 23:59'. S4 night sky washes with lifted-pigment stars, the clock tower paints in, a warm glaze blooms on the 9.575 s chime. No hard cuts (style rule): each cut is a brush-edge wipe that starts exactly on the reference cut time and takes 0.35 s.

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild: wet graded washes with pooled edges and granulation, brush-stroke figure, paper as white and multiplied through, hand notes with pen leaders, brush-edge wipes at the cuts, vermilion accent.
