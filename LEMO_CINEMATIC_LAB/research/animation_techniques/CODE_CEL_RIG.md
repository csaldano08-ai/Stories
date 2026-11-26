# Code-drawn cel characters with a real rig (learnt on MASTER 08, 80s Cel Anime)

## What worked
1. **One construction per character, poses as parameters.** Head = two hand-designed outlines (profile, 3/4) + features placed in
   head space; expressions/visemes change parameters only. Identity cannot drift between shots.
2. **Union cel renderer** (`src/lib/celgroup.js`): stroke-band − eroded-union outline gives ONE coloured line around overlapping
   parts (thigh+shin+boot; sleeve+forearm) → no puppet seams at knees/elbows, while still drawing each part as a simple tapered
   capsule. Shadow/highlight/rim crescents = union − shifted union, computed with offscreen masks (no evenodd artefacts).
3. **Light offsets must scale with part size**: a 9 u shadow offset swallows a 20 u hand → hands went lilac. Use ~0.4× for hands/small parts.
4. **Feet are IK'd from the ball of the foot** with a pitch. Planted contacts keep the ball fixed in world space; heel rise rotates
   the rear foot about the ball while the toe box stays flat. This alone removes foot sliding in walks, runs, braking, crouching,
   stepping up, sitting.
5. **Gait = explicit contact list** (`planGait`) + pelvis trajectory; swing feet follow a pelvis-relative spline. Braking,
   stopping and stepping onto a raised threshold are just different contact lists. Bug to avoid: the contact list and the pelvis
   must share the same time origin (an offset of 1 s made the boots fly away from the body in v0).
6. **Secondary motion without state**: spring-lag of hair tips / jacket hem re-simulated at 240 Hz from the shot start every frame
   (`lagOffset`), soft-limited (`tanh`) so hair can stream but not stretch. Fully deterministic, any frame renders alone.
7. **Drawings on twos only when the camera is locked.** In tracking shots the figure must be on ones, otherwise the planted foot
   jumps against the background (twos + moving camera = foot slip). Documented choice for MASTER 08 (30 fps; 15/10 drawings/s
   for acting in locked shots).
8. **Cut on action** to hide the hardest drawing (taking a jacket off): she grabs the lapels, the jacket starts to slide back
   (shrug parameter), cut to the kitten; she re-enters with the jacket already off. Same for front views (avoided) and entering a
   door (door leaves close in front of her).
9. **Light bands only on the character**: render bands into a scratch canvas, `destination-in` with the accumulated character
   silhouette (`silC`), add with `lighter`.

## Performance (no GPU, SwiftShader)
- 2D canvas on the GPU path in SwiftShader: 24 s/frame. Switching every canvas to CPU raster (`getContext('2d',{willReadFrequently:true})`)
  plus bounding-box-limited mask work → ~1 s/frame for one full character; 4 workers ≈ 2 s/frame each (CPU-bound).
- Blur filters (`ctx.filter='blur()'`) on full-frame canvases are the next most expensive operation; pre-blur plates at load.

## Limits observed
- Full-front body views and rear 3/4 full bodies were avoided; a 3/4 bust (MCU) is the most reliable "front-ish" view.
- Hands in close-up (S11) are the weakest drawings: shapes are generic mittens with crease lines; a real finger rig (3 phalanges ×
  4 fingers + thumb, FK) would be the next investment.
- No automatic interpenetration test for 2D cels yet (only staging + visual review).

## Reusable for
anime retro, cartoon 2D, explainer characters, vertical recomposition (the rig is resolution-independent; plates must be re-composed).
