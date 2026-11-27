# 019_backrooms — Liminal Found Footage (Film & Tape) — QA report

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
 "size_mb": 26.2
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
Reviewed from the contact sheet. Adaptation: found-footage POV, so AKI is the operator — S1 the camera looks down at the wet floor as her boot hits the puddle at 0.9375 s; S2 she runs down the arcade between the shop notices (CAFE, BAKERY, BOOKS, NOODLES…); at 6.05–7.15 she brings the wrist into frame; S3 the watch 23:58 with the second hand ticking (autofocus hunts, as camcorders do); S4 the LAST TRAIN board and the station clock on the chime. Run timing and the watch raise come from the shared rig (rig QA clean); her body is mostly out of frame by the style's grammar. Nothing in it claims to be real footage (no date stamp).

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild: the 10 s as a 1990s consumer camcorder tape shot by AKI herself in an empty fluorescent station arcade; the style's VHS shader and OSD; cuts at tape tears; one saturated hue (the departure board red).
