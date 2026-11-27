# 016_ink-wash — Chinese Ink Wash (Traditional Crafts) — QA report

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
 "size_mb": 16.3
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
 "slideMaxU": 4.263256414560601e-14,
 "slideFrames": 0,
 "belowGround": 0,
 "adjustments": 17,
 "lifted": 0,
 "pass": true
}
```
bone = [min, max] measured length in u over all frames (constant ⇒ no stretching); slide = planted-foot drift between frames.
## Visual review (done by the agent on stills / strips — not full-speed playback)
Engine copied unchanged from the demo (ink.js brush engine with bristles and loaded strokes; comp.js rice-paper compositor: wet layer bleeds and pools, dry layer bitten by the tooth, ink-bloom transitions). Ink only; the style allows one vermilion accent, so AKI's red coat becomes a pale ink mass with two loaded strokes (dark edge = contour) and the vermilion goes to the object she carries: the watch (a dot on her left wrist, the second hand in the close-up) — documented adaptation of an identity marker. Lit windows, sign letters and the puddle are paper left blank (letters reserved out of dark boards; signs mirrored in the puddle, wobbling after the splash). AKI: burnt-ink trouser strokes, nail-stroke boots, a wet mass of hair with a loaded back stroke and curved bangs, face in clear ink with a profile line and an almond eye. In the locked puddle shot she is held on twos (15/s); in the follow she is painted on ones (a held drawing would slide her planted foot) — the style's figures-on-twos rule is kept where the camera is still. Transitions are the style's own: ink bloom from her waist (2.5 s, 0.45 s), the one hard cut it allows (to an extreme close-up, 7.5 s), a bloom out of the watch dial into the tower clock (9.375 s). Rig QA PASS. Review fixes: shop walls rebuilt as washes fading downward with loaded side strokes (first pass read as flat grey boxes), one soft wipe per window instead of a barcode of stripes, darker night washes, pointed tower roof.

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild: a xieyi ink painting on procedural rice paper — five ink tones, loaded strokes, pale masses, flying white, light as unpainted paper; one vermilion accent (her watch's second hand and the dot on her wrist); ink bloom S1→S2, a hard cut to the extreme close-up, a bloom from the dial into the clock.
