# 074_living-screencast — Mascot Screencast (Screens & Interfaces) — QA report

Style construction: Canvas 2D. Narrative adaptation: yes.

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
 "size_mb": 2.5
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
QA review 2026-11-27: final.mp4 contact sheet viewed (events at 0.94 / 6.05 / 8.4 / 9.58 s present)

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native living screencast: an original route app; AKI as a sprite over the route with a wet-surface tag and the splash time, the live clock and step count, a spotlight on 11:58:47 to 48, the station clock card on the chime.
