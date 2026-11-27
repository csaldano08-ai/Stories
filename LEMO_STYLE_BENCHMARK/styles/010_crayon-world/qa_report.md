# 010_crayon-world — Crayon World 3D (3D & Miniature) — QA report

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
 "size_mb": 74.7
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
 "slideMaxU": 3.375077994860476e-14,
 "slideFrames": 0,
 "belowGround": 0,
 "adjustments": 24,
 "lifted": 0,
 "pass": true
}
```
bone = [min, max] measured length in u over all frames (constant ⇒ no stretching); slide = planted-foot drift between frames.
## Visual review (done by the agent on stills / strips — not full-speed playback)
Style engine copied unchanged from the demo (npr.js analysis render + marching squares, crayon.js, gl.js compositor). A box of 12 crayons, one indigo outline colour, no wash (style rule). Every drawing — pose and camera included — is re-made 15 times a second (twos at 30 fps), so a held drawing never slides under a moving camera. Night: unlit regions get a second, indigo scribble pass (value from pressure and an extra pass, not from new hues); lit windows, lamps and signs keep their colour. Rain is white wax (shows over the dark hatching) plus a light-blue stick. AKI is built from the shared rig (tube limbs on the joints, rig QA PASS), red coat, plum hair cap (fixed: the cap's opening now faces forward, it read as bald in the first render), lemon watch on the left wrist. Review notes: first render read as daytime (pale walls, invisible rain) and was re-rendered after the night pass.

Encoding note: final.mp4 re-encoded with the video bitrate capped at 55 Mb/s (CRF 19 otherwise; the muxed file was over 90 MB).

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild: a real 3D night street traced and recoloured in crayon 15 times a second (region ids, marching squares, scribbled hatching, outlines), wax on paper tooth; night as a second indigo scribble over everything unlit; white-wax rain; face, splash, lettering and the watch dial drawn in 2D at projected positions.
