# 030_urban-sketch — Urban Sketch · Pen & Wash (Painting & Illustration) — QA report

Style construction: WebGL shader pass. Narrative adaptation: no.

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
 "size_mb": 22.7
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
Contact sheet reviewed: S1 splash at 0.94 s with ink ripple marks and wash spatter, S2 tracking past the sketched shopfronts (BAR, BOOKS, 24H, PHARMACY, NOODLES, CAFE, LAUNDRY, RECORDS, HOTEL), S3 watch insert at 11:58 with seconds 47→49, S4 clock tower at the chime. Rig QA passes. No black or frozen spans.

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild as an urban sketch: ink lines over loose watercolour washes, the street drawn on location with its shop names hand-lettered, AKI in the same pen and wash; all four shots and events kept.
