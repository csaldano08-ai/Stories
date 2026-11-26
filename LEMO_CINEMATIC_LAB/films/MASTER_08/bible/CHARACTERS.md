# Character bible — *Last Train Home* (MASTER 08)

All characters are drawn by ONE construction each (code in `src/chars/`); every shot calls the same functions with pose /
expression parameters, so height, build, head shape, eye colour, hair, clothes, limb lengths and finger count cannot drift.
Model sheets rendered with the real drawing code: `bible/model_sheet_aki.jpg`, `bible/model_sheet_kitten_bust.jpg`.

## AKI (protagonist)
| | |
|---|---|
| Age / role | 24, junior draughtsperson, leaving the office at 23:52 |
| Proportions | 600 u tall = 7.5 heads (head 80 u). Hip joint 312 u, shoulder 492 u. Thigh 150, shin 144, upper arm 108, forearm 92, hand 62 (u) |
| Views | Profile (`head.js headProfile`, `aki.js drawProfile` full body), 3/4 (`head34`, `aki34.js drawBust34`), rear-3/4 avoided by staging (door leaves, cuts on action). Front view deliberately avoided (STYLE §9) |
| Head | egg jaw on a cranium; eye line at the vertical middle; almond eyes with a thick, outward-flicked upper lash line, 3 separate lashes, double-lid crease; tall layered iris (dark top band → dark upper half → warm brown → bright amber crescent), two highlights; long thin brows; nose = shadow plane + one stroke (3/4), small upturned tip (profile) |
| Eyes | warm dark brown `#7a4a2e` / amber crescent `#d9a06a` |
| Hair | dark plum `#3d2547`, shoulder length, side part on her right, bangs kept OFF the eyes, locks over the ears, flipped-out 80s ends, angel-ring highlight with a zig-zag lower edge. Lag-simulated tips: back ends, side locks, bangs |
| Costume | vermilion short trench `#e4472d` (her ONE accent colour, readable in every lighting set), cream knit roll-neck `#eee2cc` (darkens when wet: `palette.wet`), charcoal tapered trousers, brown ankle boots, gold watch on a brown strap (left wrist) |
| Hands | 5 fingers implied by silhouette + crease lines; shapes `fist`, `relax`, `open`, `cup`, `grip`. Held props sit between the palms |
| Rig | pelvis root; lower/upper spine (absolute angles from vertical), neck, head; 2-bone IK legs from the *ball of the foot* + pitch (foot locking: planted balls never move, heel pivots on the ball); arms FK (shoulder, elbow, wrist) or 2-bone IK to a target (elbow points back). Secondary motion: deterministic spring-lag re-simulated from each shot's start (`rig.lagOffset`) for hair & jacket hem |
| Colour models | `palette.js`: street (neon rain), canopy (station forecourt), platform (cool + warm rim), interior (amber), window (seen through glass), backlit. Skin hand-tuned per set |
| Personality | quick, a little shy, decisive in the moment; kindness shown by doing, not saying. Acts with the whole body: braking with weight back, crouching low to not frighten the kitten, curling round the bundle when she hurries |
| Voice | see `VOICE_BIBLE.md` |

## THE KITTEN
| | |
|---|---|
| Age | ≈ 8 weeks; body ≈ 20 cm (74 u) |
| Design | grey tabby `#9a9aa6` with darker stripes (forehead "M", back arcs), white bib and front paws, amber-green eyes `#a8c86a` with large night pupils, pink nose & inner ears, whiskers. Wet = spiky outline (`jag()`), dry later in the car |
| Construction | 3/4-front: loaf body, head, ears (rotatable), eyes (open/pupil/look), mouth (mew/yawn), paws (step), tail (phase), shiver |
| Behaviour | shivers, listens (ears), answers her with a mew, takes one step toward her hand, purrs once held, yawns and sleeps in the warmth |

## THE DRIVER
| | |
|---|---|
| Age | late 50s |
| Design | square kind face, grey temples and moustache, crow's feet, broad nose; navy uniform `#2b3a66`, cap with a small gold badge, white shirt & maroon tie, white gloves |
| Construction | 3/4 bust (`driver.js`), always mirrored to face screen-left (he looks back down the platform; Aki looks screen-right → the axis is respected) |
| Acting | leans out of the cab window, beckons with a gloved hand, smiles after the line |
