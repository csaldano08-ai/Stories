# 040_stained-glass — Stained Glass (Traditional Crafts) — QA report

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
 "size_mb": 9.8
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
 "slideMaxU": 2.6645352591003757e-14,
 "slideFrames": 0,
 "belowGround": 0,
 "adjustments": 18,
 "lifted": 0,
 "pass": true
}
```
bone = [min, max] measured length in u over all frames (constant ⇒ no stretching); slide = planted-foot drift between frames.
## Visual review (done by the agent on stills / strips — not full-speed playback)
QA review 2026-11-27: final.mp4 contact sheet viewed (events at 0.94 / 6.05 / 8.4 / 9.58 s present; framing and legibility OK)

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native stained glass: leaded panes with jewel colours, the café window and the splash in glass shards, the run seen through tall leaded windows with light shafts, the station clock as a rose window ticking; the lit station arcade on the chime.
