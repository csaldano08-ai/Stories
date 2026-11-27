# Interaction test — the jacket and the kitten (3D)

The same 7 s action as `../jacket_kitten_anime/` (same rig poses, same precomputed cloth record) in three.js: AKI built from rig capsules
(constant bone lengths, planted feet), the jacket as a cloth sheet (the simulated chain extruded 42 cm across her body, edges sagging,
double-sided, casting and receiving shadows), our kitten built from simple forms, a wet pavement with a lamp behind her and warm shop
light from the front right. The camera's height and distance follow how low she is, so she is never cropped. `final.mp4` (1920×1080,
30 fps, 210 frames, silent stereo); contact sheet in `qa/contact_sheet.png`.

Honest assessment: the action reads (take, open, spread, lay over, tuck, lift) and the hands keep contact. But the figure is a capsule
mannequin rather than a modelled character, and the cloth is a 2D simulation extruded in depth: it cannot fold across her body or wrap
round the kitten in depth, so from the side it reads as a band. A real 3D version needs a cloth mesh simulated in 3D (or a rigged
jacket with constraints) and a modelled AKI.
