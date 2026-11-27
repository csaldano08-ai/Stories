# 018_paper-lantern — Paper-cut Lightbox (Traditional Crafts) — QA report

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
 "size_mb": 5.0
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
Re-rendered after a fix: the watch's hour and minute hands now pivot on the dial centre (they were offset by half their length). Reviewed from the contact sheet: S1 the puddle under the café windows with the sign reflected, the boot and splash at 0.9375 s; S2 she runs past the lit paper shopfronts (LAUNDRY, RECORDS, HOTEL, FLOWERS, 24H, CAFE, BAKERY, BAR, BOOKS, PHARMACY, NOODLES) and raises the wrist at 6.05–7.15; S3 the watch at 23:58 with the red second hand; S4 the clock tower over the city tops on the chime. Rig QA clean. Rendered in chunks and joined.

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild: the 10 s as a backlit paper-cut shadow box — flat cut sheets in a night ladder (pale far city, darker shopfronts, near-black front), warm light through cut windows and signs, layer shadows, shallow depth of field; AKI a jointed paper silhouette with the vermilion coat as the one accent.
