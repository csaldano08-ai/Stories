# 031_colored-pencil — Colored-Pencil Science Illustration (Painting & Illustration) — QA report

Style construction: Canvas 2D, three.js 3D (WebGL). Narrative adaptation: no.

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
 "size_mb": 37.8
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
Contact sheet reviewed: events on time (splash 0.94 s, watch up 6.05 s, cut 7.5 s, tower at the chime); pencil grain consistent across shots; no frozen or black frames; render took 93 min.

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild in colored pencil: layered directional pencil strokes on toothed paper, the street, puddle and AKI built up stroke by stroke, the watch close-up and the clock tower drawn in the same hand.
