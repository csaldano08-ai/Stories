# Quality standards — LEMO STYLE BENCHMARK

Every style clip is accepted against these rules. **Measured** means an automated tool reports it (`shared/qa/finish_style.py`,
`shared/qa/rig_check.mjs`). **Visual** means the agent reviewed stills, contact sheets and enlarged strips. **Human** means
somebody has to watch it at full speed or listen to it. The agent can't hear audio and only sees still frames, so nothing
in that column is ever reported as checked.

## 1 · Export (identical for all 99 clips)
| item | rule | check |
|---|---|---|
| Duration | exactly 10.000 s, **300 frames** | measured (`nb_read_frames`) |
| Picture | 1920×1080, 30 fps, H.264, yuv420p family (Lemo `mux.sh` default: full range, tagged) | measured |
| Audio | AAC stereo 48 kHz | measured |
| Loudness | −14 LUFS integrated (±1 LU), true peak ≤ −1.0 dBTP | measured on the exported MP4 |
| Content | no logo, no CTA, no intro or outro card, no publishing | grep + visual |
| Files | `final.mp4` (common audio), optional `final_native.mp4` (style sound design), `preview.mp4` (960×540), `thumbnail.png`, `qa_report.md`, `status.json` | measured |

## 2 · Fidelity to the reference (same events, same intervals)
The shared timeline lives in `shared/clip10.js` and is analysed from `reference/original_clip.mp4`.
- Shots: S1 0–2.5 s · S2 2.5–7.5 s · S3 7.5–9.375 s · S4 9.375–10 s. Cuts land on these exact frames.
- Footfalls on `FIRST_STEP + k/2.9` s; the puddle splash at 0.9375 s.
- Watch check from 6.05 to 7.15 s; watch close-up hit at 7.5 s; chime at 9.575 s.
- The common audio (`reference/original_audio_48k.wav`) has to stay in sync with these events. Visual check: footfall and
  splash frames on the strip.
- An event can be *adapted* to the style (a watch can become an object character), but it can't be moved or dropped.

## 3 · Native construction (no filters)
- Each clip is built with the techniques in its style's `STYLE.md` and the demo code: its own drawing, layout, camera grammar
  and timing (on ones, twos or threes, or stop-motion holds, as the style dictates).
- **Forbidden:** filtering the original, or reusing another style's animation with only colour, shader, grain or VHS changes. The
  shared parts are just the timeline, the gait clock and the character bible. Every style draws the character its own way.
- A style that needs an external image generator (✦) is marked **blocked** with its reason and is never replaced by a
  generic version.

## 4 · Character (AKI v2 bible — `reference/character_bible/`)
- AKI has to stay recognisable in every style, through the fixed identity markers in `AKI_v2.md`:
  - dark plum shoulder-length hair with a side part and curved bangs
  - vermilion short trench over a cream roll-neck knit
  - charcoal trousers and brown ankle boots
  - gold watch on the **left** wrist
  - slim, 7.5 heads tall
  - warm brown, refined almond eyes (not generic anime)
- Proportions follow the bible, scaled to the style's own construction (a stick figure keeps the head-to-body ratio and the
  silhouette, not the details).
- Visual check against the turnaround sheet on contact sheets.

## 5 · Anatomy and rigging
| defect | rule | check |
|---|---|---|
| Bone length | constant per bone (thigh, shin, upper arm, forearm). Change is allowed only in styles that intend squash or stretch (rubber hose, some cartoons), and is documented in `animation/rig_qa_note.json` | measured (`rig_check.mjs`, rigged styles) |
| Joint limits | knees never hyper-extend backwards, elbows bend the right way | measured (knee direction) + visual |
| Unreachable IK | the target is clamped: raise the heel about the ball first, otherwise lift the foot. The foot is drawn from the solved ankle, never at the target | measured (`legAdjust` counts) |
| Foot lock | a planted foot doesn't slide in world space (ball-of-foot drift 0 px) | measured (slide) |
| Ground | no foot below the ground line | measured |
| Centre of mass | it moves with the stride: vertical bob, lean in the run | visual |
| Secondary motion | hair, bag and coat hem follow with lag springs that are deterministic and re-simulated from the shot start | visual |
| Hands | 5 fingers where the style draws fingers, and the watch stays on the left wrist | visual |

## 6 · Collisions and physical interactions
- No popping: an object that changes owner or state goes through visible contact first (hand meets sleeve, sleeve slides
  back, watch is revealed). In the 10 s clip this applies to the arm, hand and watch.
- No interpenetration of limbs through the body, bag or ground. Held props sit between the palm and fingers.
- Splash and particles start at the contact frame, not before.
- The jacket and kitten interaction test (`interaction_tests/`, 5–8 s) applies the same rules to a cloth handover and a
  small animal.

## 7 · Animation
- Spacing with easing, no linear pose-to-pose moves. Anticipation before the watch raise, overshoot and settle after it.
- No unmotivated pose pops (the only exception is a deliberate one-frame smear).
- Drawings on twos or threes only when the camera is locked, or as the style dictates. Camera moves are on ones.
- Loops and cycles have no visible seam inside the 10 s.

## 8 · Rendering
- Deterministic `render(t)`: any frame can be rendered alone and gives the same picture.
- No black, empty or NaN frames, and no frozen picture ≥ 0.7 s unless the style intends it. Measured with `blackdetect` and
  `freezedetect`.
- No unintended edge strips, seams or gaps between plates. Visual check: first and last frame of every shot.
- Anti-aliased lines; supersampling for 3D where the CPU budget allows. Grain, film damage and CRT effects belong to the
  style's own post, never shared.

## 9 · Audio
- **Common base:** the original clip's audio is muxed under every style, so the comparison is about pictures.
- **Native version (`final_native.mp4`):** the style's own sound design on the same event grid (same splash, footfalls,
  watch hit and chime). No white-noise beds: ambience has to be motivated and textured. Loudness rules as in §1.
- **Voice test (optional):** "Oh, no... I'm going to miss the last train." Chatterbox Nano with the same cloned identity
  (authorised reference), native watermark kept, checked with Whisper and speaker embeddings.
- Listening is **Human**.

## 10 · Scoring (for the final report)
Each style gets a 0–10 score for:
- style fidelity
- character recognisability
- animation and rig
- environment
- lighting and colour
- readability of the action
- render cost (seconds per frame on this CPU-only machine)
- production complexity
- emotional tone

Rankings per use case (narrative shorts, explainers, music videos, social loops) are derived from these. A critical
unresolved defect blocks a style's **done** status whatever its scores.

## 11 · Status values (`status.json`)
| value | meaning |
|---|---|
| `queued` | not started |
| `wip` | being built |
| `qa` | rendered, defects open |
| `done` | every measured check passes and the visual review found no open defect |
| `blocked` | can't be produced here (a reason is written, nothing faked) |
