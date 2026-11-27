# 008_brick-toy — Brick Toy (3D & Miniature) — QA report

Style construction: three.js 3D (WebGL). Narrative adaptation: no.

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
 "size_mb": 8.0
}
```
## Rig QA (all 300 frames, `shared/qa/rig_check.mjs`)
```
{
 "bone": {
  "thigh": [
   140,
   140
  ],
  "shin": [
   140,
   140
  ],
  "upper": [
   170,
   170
  ],
  "fore": [
   170,
   170
  ]
 },
 "kneeBackward": 0,
 "slideMaxU": 3.637978807091713e-12,
 "slideFrames": 0,
 "belowGround": 0,
 "adjustments": 0,
 "lifted": 0,
 "pass": true
}
```
bone = [min, max] measured length in u over all frames (constant ⇒ no stretching); slide = planted-foot drift between frames.
## Visual review (done by the agent on stills / strips — not full-speed playback)
Reviewed the contact sheet (20 frames): S1 legs land in the brick puddle at 0.94 s, S2 tracking run with lamp posts passing and the watch raise 6.05–7.15 s, S3 the printed watch tile 23:58, S4 the street set on the desk with the tower. Rendered in six resumable 50-frame chunks (about 15 min each on CPU WebGL).

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild: the 10 s as a stop-motion brick film on a walnut desk at night: glossy ABS with clearcoat and studs, AO in the seams, physical depth of field per shot; the brick figure steps on twos while the camera glides on ones; rain, puddle and splash built from translucent bricks per drawing; the watch a printed tile swapped once a second; S4 pulls back to the whole street set on the desk.
