# 036_ipad-sketch — Tablet Sketch Explainer (Sketch & Board) — QA report

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
 "size_mb": 7.1
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
 "adjustments": 225,
 "lifted": 0,
 "pass": true
}
```
bone = [min, max] measured length in u over all frames (constant ⇒ no stretching); slide = planted-foot drift between frames.
## Visual review (done by the agent on stills / strips — not full-speed playback)
Contact sheet reviewed: events on time (splash 0.94 s, watch up 6.05 s, cuts at 2.5 / 7.5 / 9.375 s, chime 9.58 s); no black or frozen frames; rig QA passed.

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild as a tablet sketch on one cream canvas: pencil construction, brush ink, flat fills dropped in; the watch and the street map are drawn live.
