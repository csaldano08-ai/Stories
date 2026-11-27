# MASTER 13 — *The Little Repair Robot*
Style: **Brick Toy** (`brick-toy`) · 1920×1080 · 30 fps (bricks & characters stepped on twos = 15 drawings/s; camera, focus, light on ones) · ≈ 70 s · no dialogue

Written before opening `DEMO.md` / demo code (AGENTS.md). Production is gated by a CPU-only 3D benchmark (see §9).

## 1. Three candidate structures
1. **One day, linear** — dawn in the dusty lab → the daily build → the broken bird → repair → flight → the gift.
2. **The rule of three** — three repair attempts: the wing too heavy (bird tips over), the wing too stiff (flaps once, drops), the
   third built from a different idea (a lighter, hinged wing) — flies.
3. **Bookend** — open on the glowing piece on the window sill, flash back to how it got there.
**Chosen: 1 with 2 inside it.** The bookend spoils the flight. Three attempts give the repair real acting (frustration, a new idea,
care) and make the success earned. Native moves: *break without harm* (failed parts become the next attempt) and *hand-made stop-motion light* (the glowing piece).

**Not the demo again** (checked after reading `DEMO.md`): the demo is a build → collapse → rebuild → launch → scale-reveal arc. Ours is a
repair of someone else's broken thing; failures are small (a tip-over, one flap), the climax is a bird's free flight, and the ending is
NOT a pull-back scale reveal but a dusk close-up on the gift (opening, signature shot, score shape and ending all differ).

## 2. Logline and arc
*In a lab nobody uses any more, a robot made of spare bricks rebuilds a broken mechanical bird — and the bird comes back with something to give.*
Setup (0–15 s): the robot's routine on a real dusty workbench. Turn (15–45 s): a broken bird; three attempts. Ending (45–70 s):
the bird flies out of the window; the robot waits; the bird returns with a small glowing transparent piece.

## 3. Benchmark (grammar only)
Brick-film stop-motion on real tables (stepped characters, smooth camera), macro toy photography (softboxes on glossy ABS, shallow
focus), silent-film pantomime for a wordless robot. Not taken: any brand, minifigure silhouette, character, set or music.

## 4. Characters (built from bricks; full bible before animation)
- **Robot "Bolt"** (no name on screen): 1×1 round-brick legs, 2×2 brick torso (light grey + one yellow trim plate), round 2×2 head
  with two transparent-blue 1×1 round "eyes" behind a visor plate, arms of round bricks with clip hands; joints rotate only.
  Rig: hips, knees, shoulders, elbows, wrists, clip "fingers" (open/close), head pan/tilt; arm IK to targets with joint limits; feet locked on studs.
- **The bird**: transparent-orange + white plates, hinge-plate wings (2 per side), 1×2 slope beak, round eyes. Wing rig: hinge angle + flap cycle.

## 5. Shot list (headline)
| # | t | framing | camera | why |
|---|---|---|---|---|
| 1 | 0 | macro: dust on a real screwdriver handle, rack focus to the robot waking (eyes light) | rack focus on ones | two scales in one frame |
| 2 | 4 | low angle: the robot walks across the bench between real tools | track | small maker, big world |
| 3 | 10 | top-down: the day's build — a bin of parts, it sorts by colour | plan view | routine, order |
| 4 | 15 | wide: a thump; something falls behind a spool | static, then whip | the inciting moment |
| 5 | 18 | close: the bird on its side, one wing snapped | push | the problem |
| 6 | 22 | medium: the robot lifts the bird (two-hand IK grasp), carries it to the bench | track | contact & care |
| 7 | 28 | frontal close-up: removes the broken wing (clip opens, part pulled along its axis) | locked | intimacy, decision |
| 8 | 32 | attempt 1: a heavy wing; the bird tips over (rigid-body pre-sim) | locked | failure 1 |
| 9 | 37 | attempt 2: flaps once, drops; parts scatter (break without harm) | locked + shake | failure 2 |
| 10 | 42 | the robot sits; looks at the scattered hinge plates — idea (eyes brighten) | close | the turn of thought |
| 11 | 46 | snap-together build of the hinged wing (pieces fly in on arcs, click home, tool used) | top-down → orbit | native move |
| 12 | 52 | the flight: the bird lifts off the bench, loops the lamp | track on ones | joy |
| 13 | 58 | through the window: the bird flies off into daylight; the robot watches | rack focus | the letting-go |
| 14 | 62 | wide, lonely: the robot alone by the window | static | waiting |
| 15 | 65 | the bird returns, drops a transparent glowing 1×1 round piece into the robot's hands | close | the gift |
| 16 | 68 | close: dusk falls in the room, the desk lamp clicks off; only the gift glows between the robot's hands, its eyes answering | locked, slow light change | bookend: eyes lighting at dawn ↔ the gift glowing at dusk |

## 6. Sound
Toy-scale foley (brick clicks ≈ 2.9 / 4.6 kHz, plastic steps, clacks on wood), room tone with a distant clock; music: glockenspiel, toy piano,
pizzicato, a melodica theme; music drops dead at both failures; one silence before the flight; a bell "ding" at the idea.

## 7. Hard actions to test first (Phase C)
Walk with foot locking on studs · two-hand grasp of the bird (contact before control transfer) · clip hand closing on a plate ·
removing a wing along its hinge axis · rigid-body fall of the bird (pre-simulated) · wing flap cycle · tool use (a brick separator
lever touching the part) · DOF and GTAO stability · **s/frame on CPU** (decides render budget).

## 8. Status
Treatment only. Next: CPU 3D benchmark with the library's three.js post (`core/three/post.js`), then character bible + rig tests.

## 9. Production gate
No GPU in this environment (SwiftShader). If a supersampled PBR+GTAO+DOF frame costs > 30 s, the plan is: render at 1080p without
2× SSAA, SMAA in post, GTAO at half resolution, DOF only on macro shots, and shorten the film to its strongest 50–60 s.
