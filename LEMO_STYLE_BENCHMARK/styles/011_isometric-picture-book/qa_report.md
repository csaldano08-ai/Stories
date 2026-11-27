# 011_isometric-picture-book — Isometric People Scene (3D & Miniature) — QA report

Style construction: Canvas 2D. Narrative adaptation: no.

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
 "size_mb": 2.2
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
 "adjustments": 12,
 "lifted": 0,
 "pass": true
}
```
bone = [min, max] measured length in u over all frames (constant ⇒ no stretching); slide = planted-foot drift between frames.
## Visual review (done by the agent on stills / strips — not full-speed playback)
Style kit copied as the style instructs (engine.js, kit.js). One continuous place at one scale: shops on the far side, kerb, road with ginger markings and a crossing, lamps, puddles, the station at the end of the street. People are slim back-view billboards in the four muted tops, waiting (the queue at the station, two at a window) or walking slowly; AKI is the only figure in the accent (she is the rule). Her limbs are placed in 3D from the shared rig joints and projected, so planted feet stay put (rig QA PASS); pace reduced to 2.9 m/s (style: nobody faster than ~3 m/s). S1 slow push on the puddle; the boot lands at 0.9375 s: flat rings + flat drops (no glints). S2 travel at her pace; the accent arrow grows ahead of her; '23:58' lands on the floor one character every 0.14 s from 5.62 s (accent on '58'), held > 1.8 s (reading-time rule). S3 locked on her raised wrist from behind: the gold watch, 11:58, the accent second hand ticking. S4 the camera rises and pulls back to the station: 'LAST TRAIN 23:59' on the façade at the iso angle, the queue, and on the 9.575 s chime an accent outline traces the spot that matters in front of the entrance. Adaptations: no rain streaks (style: clean, always; no textures); her face is not drawn (style: no faces, no hands) — she stays recognisable by the accent coat, the plum bob and the gold watch.

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild: true isometric full-bleed street, flat three-tone solids, faceless hand-less billboard people, AKI as the one accent (the rule), accent arrow ahead of her, floor type 23:58, stand-here outline at the station on the chime.
