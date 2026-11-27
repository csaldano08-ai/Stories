# 006_hd-2d — 2.5D Pixel Art (Games) — QA report

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
 "black": [],
 "frozen_ge_0.7s": [],
 "lufs": -14.2,
 "true_peak_dbtp": -1.0,
 "size_mb": 8.9
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
 "slideMaxU": 6.039613253960852e-14,
 "slideFrames": 0,
 "belowGround": 0,
 "adjustments": 32,
 "lifted": 0,
 "pass": true
}
```
bone = [min, max] measured length in u over all frames (constant ⇒ no stretching); slide = planted-foot drift between frames.
## Visual review (done by the agent on stills / strips — not full-speed playback)
three.js diorama with pixel textures (24 px/m), Bayer-dithered ramps, emissive windows and lightbox signs (pixel font), spot lamps casting the sprite's shadow, puddles catching the practicals, rain, blue fog, physical DOF with a tilt-shift band on the sprite, bloom, vignette. The sprite is rastered from the shared rig (ramps + selout outline): S1 (locked camera) holds 3 drawings per footfall so the boot lands on the 0.9375 s tick; in the S2 tracking shot the sprite is drawn every frame because a held drawing would judder against the gliding camera or slide its planted foot. Cool front fill before the hero (style pitfall: billboards lit from behind go black). The take is an RPG emote balloon '!!' over her head (6.45-7.4 s). S3: her forearm and watch as one big pixel billboard looking down, the street melted into bokeh; second hand steps each second. S4: very high wide of the night town, the crane down begins, the clock face light pulses on the 9.575 s chime. Fix during QA: S3 lights are now set by the shot itself (a frame never depends on the previous frame); S3 re-rendered and spliced. Render ~4.5 s/frame on CPU (SwiftShader). Rig QA PASS.

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild: pixel-textured 3D diorama, pixel sprite from the rig, lamps throwing her shadow, rain + blue fog, physical DOF + tilt-shift band, bloom, RPG emote, pixel watch close-up.
