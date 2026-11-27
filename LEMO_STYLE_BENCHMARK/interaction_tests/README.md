# Interaction tests

Separate from the 10 s benchmark clips. One 7 s action in five treatments, with the same rig poses and the same precomputed cloth record:
AKI walks in with her jacket over her arm, kneels by the kitten, takes the jacket, opens it, lays it over the kitten, tucks the ends
under it and lifts it to her chest, her hands keeping contact all through.

| Folder | Treatment |
|---|---|
| `jacket_kitten_anime/` | 80s cel anime (the shared AKI profile drawing, cel shading) |
| `jacket_kitten_cartoon/` | flat cartoon, bold outlines |
| `jacket_kitten_stickman/` | stickman on marker paper |
| `jacket_kitten_pixel/` | native pixel art (320×180 grid, 16 colours, 6× nearest) |
| `jacket_kitten_3d/` | three.js, capsule rig, cloth sheet |

The jacket is never replaced or popped in: it is one cloth (a Verlet chain plus a sleeve chain) pinned only where a hand holds it, colliding
with her forearm, her legs, the kitten and the ground. Each folder's README gives an honest assessment. The common weakness is the jacket's
shape: it is simulated in profile as a strip, so it reads as a band of cloth rather than a jacket with collar and sleeves.
