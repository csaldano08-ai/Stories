# 009_lowpoly-island — Low-poly Isometric Island (3D & Miniature) — QA report

Style construction: three.js 3D (WebGL), real data / imagery. Narrative adaptation: no.

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
Island, sea, post and AKI builder are the style's engine pieces (island.js, sea.js, post.js) with an original island: a hex-tile shopping street with lit windows and signs, lamp posts, puddles, a clock-tower at the end. Orthographic isometric camera with no horizon (night gradient + stars). AKI rebuilt in the medium: faceted cylinders, icosahedron head and hands, box bob, red coat, a 10-sided gold watch whose hands read 23:58 (the dial turns with the wrist). S1 low iso close on the puddle (splash ring arrives with an arrival curve at 0.9375 s), S2 iso follow along the street on ones, S3 macro of the faceted sleeve and watch (second hand ticks on the second), S4 pull-out to the whole island with the clock popping its light on the chime (9.575 s). Rendered in 50-frame resumable chunks (heavy SwiftShader WebGL). Rig QA PASS.

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild: a flat-shaded low-poly hex-tile island at night under an isometric orthographic camera — warm emissive windows, faceted sea, AKI as faceted low-poly forms
