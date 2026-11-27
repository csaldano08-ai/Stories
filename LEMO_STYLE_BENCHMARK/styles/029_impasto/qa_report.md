# 029_impasto — Impasto Oil Painting (Painting & Illustration) — QA report

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
 "size_mb": 22.0
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
Contact sheet reviewed: S1 puddle splash at 0.94 s with painted droplets, S2 tracking run past painted shop fronts, S3 watch insert (11:58, second hand 47→49) in impasto, S4 clock tower at the chime. Rig QA passes (constant bone lengths, no knee/elbow inversion, foot lock). No black or frozen spans.

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild in thick oil paint: impasto strokes laid along form, palette-knife highlights on wet stone, the protagonist painted with the same loaded brush as the street; all four shots and events kept.
