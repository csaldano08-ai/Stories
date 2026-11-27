# 012_tilt-shift — Tilt-Shift Miniature (3D & Miniature) — QA report

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
 "size_mb": 9.4
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
Reviewed from the contact sheet. S1 a low miniature view of the puddle with AKI's run crossing it (splash 0.9375 s); S2 a high oblique view down the model street (RECORDS, HOTEL, FLOWERS, 24H signs, lamp posts with pools of light), the focus band tracking her as she runs and raises her wrist at 6.05–7.15; S3 the watch on her red sleeve in close-up (23:58); S4 the station clock tower above the rainy model town on the chime. Rig QA clean. Rendered in chunks (heavy page) and joined.

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild: the 10 s as a real miniature street seen through a tilt-shift lens — a narrow plane of focus, toy-scale props, saturated shopfronts and neon; AKI as a small figure.
