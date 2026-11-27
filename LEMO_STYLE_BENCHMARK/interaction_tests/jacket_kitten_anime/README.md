# Interaction test — the jacket and the kitten (80s cel anime look)

A separate 7 s test (not part of the 10 s benchmark clip): `final.mp4` (1920×1080, 30 fps, 210 frames, H.264, silent stereo track), source in `source/`, contact sheet in `qa/contact_sheet.png`.

## What happens, and how it is built

| Time | Action | How |
|---|---|---|
| 0.0–1.6 s | AKI walks in, the jacket folded over her far forearm | shared rig (`shared/aki2`), walking gait from `runner()`; the fold is the cloth chain laid over the forearm |
| 1.6–2.45 s | a gathering step (rear foot comes up beside the front one), then she kneels | feet stay planted (IK on the rig), the pelvis drops, the spine bends, the head turns down to the kitten |
| 2.45–3.05 s | the near hand takes the collar; the far arm comes away; the far hand takes the hem | the collar point is pinned to the near hand; the jacket slides off the forearm (forearm collider) and hangs; the far hand pins the nearest hem point |
| 3.05–3.5 s | she holds the jacket open and spreads it in front of her | both ends pinned, the rest simulated (gravity, length constraints) |
| 3.5–4.4 s | she lowers it over the kitten and puts the ends down on both sides | the cloth collides with the kitten's body (ellipse), her legs (capsules) and the ground |
| 4.4–4.85 s | both hands slide under the kitten, taking the cloth ends with them | the pinned ends move under the kitten |
| 4.85–6.2 s | she stands up holding the bundle | the kitten rides on her hands from 4.75 s; the cloth stays round it by collision |
| 6.2–7.0 s | she holds the wrapped kitten at her chest and looks down at it | breathing on the body; the kitten shivers less |

The jacket is one simulated cloth (a 240-unit Verlet chain for the body of the jacket, plus a 160-unit chain for a sleeve), precomputed at 240 Hz from t = 0 with no randomness. It is never replaced, never appears or disappears; it is pinned only where a hand holds it.

## Honest assessment

Works:
- Every step the brief asks for is a real action with continuous contact: approach, kneel, grab, open, lay over, tuck, lift.
- No mesh pops; the cloth hangs, slides off the forearm, falls open and drapes by itself.
- Feet stay planted through the step and the kneel, limb lengths are constant (rig QA in `window.RIGQA`), and she looks at the kitten.

Weak:
- The jacket reads as a thick red ribbon (a profile strip with a sleeve strip), not as a recognisable jacket shape with collar and sleeves.
- At 4.5 s the far side of the drape is short, so the kitten's back is covered only partly while it is on the ground.
- At the end, about a third of the jacket hangs below the bundle as a strip.
- The kitten is drawn in its own ¾-front construction while AKI is in profile.

Next improvements: a 2D cloth mesh (a quad strip with width and fold lines) instead of a chain; a fold-up of the hanging tail with the far hand after the lift; and the same action in the other priority styles (cartoon, stickman, pixel art, 3D).
