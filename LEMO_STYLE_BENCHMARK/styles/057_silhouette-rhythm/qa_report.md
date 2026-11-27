# 057_silhouette-rhythm — Silhouette Rhythm (Graphic & Type) — QA report

Style construction: Canvas 2D, real data / imagery, WebGL shader pass. Narrative adaptation: no.

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
 "black": [
  [
   "2.466667",
   "2.566667"
  ],
  [
   "7.466667",
   "7.566667"
  ]
 ],
 "frozen_ge_0.7s": [],
 "lufs": -14.2,
 "true_peak_dbtp": -1.0,
 "size_mb": 10.6
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
QA review 2026-11-27: contact sheet viewed; black frames checked against the source (intended wipe)

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

**Accepted as intended:** black frames [('2.466667', '2.566667'), ('7.466667', '7.566667')]: intended — the style's black wipe at the cuts (a pillar crossing the lens), 3 frames at 2.5 s and 7.5 s

Native silhouette rhythm: AKI as one black shape against a single warm light over wet water, the splash back-lit at 0.94 s, the run in telephoto across the disc, the wrist and watch against the glow, the tower on the chime. Weakness: the warm disc reads as a setting sun, at odds with the 11:58 pm setting.
