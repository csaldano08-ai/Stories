# 001_cel-anime-80s — 80s Cel Anime (Cartoons) — QA report

Style construction: Canvas 2D, WebGL shader pass. Narrative adaptation: no.

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
 "size_mb": 16.6
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
 "slideMaxU": 4.973799150320701e-14,
 "slideFrames": 0,
 "belowGround": 0,
 "adjustments": 31,
 "lifted": 0,
 "pass": true
}
```
bone = [min, max] measured length in u over all frames (constant ⇒ no stretching); slide = planted-foot drift between frames.
## Visual review (done by the agent on stills / strips — not full-speed playback)
- Contact sheet & enlarged stills checked: S1 boot lands in the puddle on 0.9375 s; S2 run reads, no foot slip, watch raise 6.05–7.15 s with head/eye drop; S3 five-fingered hand + watch 23:58; S4 crane start.
- Fixed during review: black strip at the left edge at 2.5 s (parallax plate offsets) → re-rendered.
- Character matches the v2 sheet in profile (head, eyes, hair, jacket, watch on the left wrist).

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Same style as the original: rebuilt on AKI v2 (refined head/eyes), v2 run rig (constant bones, foot lock verified), real watch-check arm action with cuff slide, five-fingered hand in the watch insert.
