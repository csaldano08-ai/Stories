# 015_crayon-book — Crayon Picture Book (Painting & Illustration) — QA report

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
 "size_mb": 67.0
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
 "slideMaxU": 4.263256414560601e-14,
 "slideFrames": 0,
 "belowGround": 0,
 "adjustments": 17,
 "lifted": 0,
 "pass": true
}
```
bone = [min, max] measured length in u over all frames (constant ⇒ no stretching); slide = planted-foot drift between frames.
## Visual review (done by the agent on stills / strips — not full-speed playback)
Engine copied unchanged from the demo (gl.js compositor: paper tooth anchored to the page, wax adhesion by pressure, knock-out, watercolour wash with wax resist; crayon.js; rig.js parts with occlusion). Box of 12 crayons (indigo outline, never black) + one watercolour (ultramarine, for the night). Drawings boil on twos (15/s at 30 fps); the camera runs on ones. S1: the page already drawn, the night wash's wet front crosses the frame in the first 0.36 s and reveals the white-wax rain; the puddle holds the two signs upside down in heavy wax; the boot lands in it at 0.9375 s (white-wax drops, splash lines, rings), the reflection wobbles and settles. Cuts keep their times and are fast moves over the page (pan, lift, pan up), never dissolves. S2 tight follow: shops, lamps and paving draw themselves as they reach the right edge (lines first, colouring row by row); AKI is drawn on ones in the follow (stepping her on twos under a moving camera would slide her planted foot) — documented deviation from the style's 12 fps figures. Child logic: the watch close-up is a round inset drawn on the page in the sky ahead of her; the camera lifts into it at 7.5 s; inside, the arm alternates two key drawings on her steps; dial left as paper, vermilion second hand ticking once a second. S4: the clock tower at the end of the street; the chime is drawn as yellow/white wax arcs. AKI is composited after the wash (style rule) so she keeps the paper white behind her. Review fixes before the render: closed few-point polygons (diagonals in outlines), straight reflection patches (wiggles read as steam), seamless page-anchored ground strip (tile seams), mitten hand with the thumb along the top (a raised thumb read as thumbs-up), the roof fill erased under the inset.

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild: one picture-book page drawn in wax crayon on toothy paper (12-crayon box, indigo outlines, zig-zag hatching that overshoots), boiling on twos; an ultramarine night wash resisted by the wax (white-wax rain, lit windows, lamp rays); the camera moves over the page; the street draws itself ahead of AKI; the watch is a round inset drawn on the page.
