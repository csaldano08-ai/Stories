# 017_ukiyoe — Ukiyo-e (Traditional Crafts) — QA report

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
 "size_mb": 8.5
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
 "adjustments": 15,
 "lifted": 0,
 "pass": true
}
```
bone = [min, max] measured length in u over all frames (constant ⇒ no stretching); slide = planted-foot drift between frames.
## Visual review (done by the agent on stills / strips — not full-speed playback)
Engine copied unchanged from the demo (print.js: paper, woodgrain, baren, specks, carved lines, bokashi, kasumi, reveal); added an unclamped bokashi for the long and tall sheets and scroll-anchored textures (they slide with the print). Pigment set: Prussian blue family, pale blue, sumi, beni (AKI's coat: the print's one rare red), ochre, wood, plum-sumi hair, skin. Prints: I the puddle (signs upside down in the water, key-line ripples, paper-white spray in clusters), II the shop street as one long print the view slides over, III a close crop of her sleeve and watch (dial left as paper, beni second hand), IV a tall print of the clock tower, its seal stamped on the chime (9.575 s). Cuts keep their times as 0.22–0.3 s slides across the mount (style: shorter slides = urgency). Figures step at 7.5/s on the still sheet (I); in the slide that follows her (II) she is printed on ones — documented deviation (a held figure under a moving print would slide). Cartouche text and seals are original (an abstract rain-and-clock seal drawn in code). Rig QA PASS. Review fixes: key lines of hidden limbs erased under front parts (they showed through the coat), smoothed shapes, warm bokashi reflections instead of white bars, softer baren on the dark sky.

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild: four woodblock prints on one mounting scroll — washi, flat colour blocks out of register with woodgrain, baren and goma-zuri, carved sumi key line, bokashi skies, rain as two sets of fine lines, paper as the white; each print with border, cartouche and seal; the cuts are short handscroll slides.
