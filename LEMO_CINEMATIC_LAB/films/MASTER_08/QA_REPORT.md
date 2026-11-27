# MASTER 08 — *Last Train Home* — quality report

Automated checks: `qa_final/qa_report.md` (delivered file: render v2 + S15 patch = v3) and `qa_v1/` (preview).

**Final measurements (exported MP4):** 1920×1080 · 30 fps · 2231 frames · 74.37 s · H.264 High · AAC 48 kHz stereo · −14.3 LUFS integrated · LRA 6.4 LU · true peak −1.1 dBTP · 0 clipped samples · no black or frozen segments · A/V difference 7 ms · all 4 lines recognised by Whisper in the final mix. Master WAV: −14.2 LUFS, −1.4 dBTP. Visual review: contact sheets + 0.2 s strips
(`qa_v1/strips/`). The agent cannot hear and cannot watch motion at full speed: **a human full-speed viewing with sound is still
required** before approval (listed as open below).

## Defect log
| # | timecode | defect | severity | cause | fix | re-test |
|---|---|---|---|---|---|---|
| 1 | all | 24 s per frame render | blocker | canvas-2D on SwiftShader GPU path + full-frame mask ops per cel group | CPU raster canvases (`willReadFrequently`) + bounding-box-limited mask work | ≈ 1 s/frame single, ≈ 2–3 s/frame with 4 workers ✅ |
| 2 | 0:43–0:47, 0:53–0:54 | boots detached from the legs ("flying boot") | critical | gait contact list built with a 1 s time-origin offset vs the pelvis track | same origin for contacts and pelvis | strips v1 ✅ |
| 3 | 0:12 | crane ends with the train cut off | major | crane end y = plate bottom | end at y = 1240, figure ground 2210 | still ✅ |
| 4 | 0:40 | clock face blown to white | major | emissive fill of the whole dial | emissive dial at 0.10, hands repainted | still ✅ |
| 5 | 0:19 | "ECU" showed the whole face, thick rim | minor | scale 9 / rim 1.5 u | scale 15, rim 0.45 u | still ✅ |
| 6 | 0:33–0:39 | hands insert: paddle hands, spiky jacket flaps | major | placeholder hand shapes | new top-view hand rig (palm + 4 two-segment fingers + thumb, curl = slide under), sleeves to frame edge, fabric flaps with folds | stills ✅ (v2) |
| 7 | 0:27 | her reach stops ≈ 250 px short of the kitten | major | crouch too far: IK clamps an unreachable target | walk speed 420 → 505 u/s so the stance ends within reach | still ✅ (v2) |
| 8 | 0:47–0:50 | driver not leaning out of the window | major | window drawn beside him | cab wall with opening; body masked below the sill; he leans past the wall edge | still ✅ |
| 9 | 0:56–1:03 | interior too wide; seat read as a "surfboard" | minor | framing / seat shape | scale 1.45; upright cross-seat | still ✅ |
| 10 | 1:08–1:14 | train not in frame on the city wide | major | start x off-screen | start x 380 px | still ✅ |
| 11 | 0:02–0:08 | street plate flat (upper floors = skyline) | minor | same window grids, no silhouette detail | darker upper floors, balcony rails, AC units, vertical sign boxes | still ✅ (v2) |
| 12 | mix | rain at −22 dBFS RMS in silence #1; low end 30 % of energy | minor | rain bed level; brown-noise body | rain −4 dB (exterior & platform), 150 Hz HP on rain body, 55–60 Hz HP on rumbles | measured in v2 ⏳ |
| 13 | 0:16–0:18 | figure must face the bench after the turn | check | — | mirrored drawing verified on an enlarged still | ✅ |
| 14 | 0:47.5–0:50.6 | driver beside the window instead of leaning out of it (v2 contact sheet) | major | wrong x placement | placed inside the opening, clipped above the sill, pupils turned to her; re-rendered only these 94 frames with `tools/rendering/patch_range.mjs` and spliced frame-exact | splice frames 47.4/47.5/50.6/50.65 checked ✅ |
| 15 | mix | rain in silence #1 still −22.6 dBFS RMS after the −4 dB change | note | loudnorm raises the whole programme | accepted: motivated heavy rain, music absent; silence #2 is −33 dBFS | measured |

## Open items (need a person, or a further round)
- Human listening: naturalness of the 4 lines, the kitten mews and purr (synthesised), rain texture vs. "hiss", train sounds.
- Human full-speed viewing: overall rhythm, the turn smear (0:17.9), the cut-on-action jacket removal (0:31.2 → 0:33.8).
- Known simplifications (not defects of physics, but below the MASTER 9/10 bar): no front / rear full-body views (avoided by staging);
  3/4 bust arms are drawn shapes, not rigged; hands in full-body shots are simple silhouettes; the train exterior/interior plates
  are less detailed than the street.

## Scores (0–10) — v2, provisional until the human pass
| category | score | note |
|---|---|---|
| Story | 8 | clear want/turn/consequence; the clock makes the ending earned; no explaining dialogue |
| Originality | 8 | own characters, livery, places, score; differs from the demo on all six DIRECTOR §11 points |
| Character design | 7 | appealing 80s heads and consistent identity; bodies and hands simpler than the faces |
| Environments | 7 | street, station and forecourt rich; train side & interior simpler |
| Visual coherence | 8 | one colour-model system per lighting, one CRT/tape pass |
| Animation | 7 | run/brake/walk/crouch/step-up/sit with locked feet; bust acting is limited |
| Rigging & interactions | 7 | IK legs, bundle held between the arms, two-hand lift with contact first; jacket removal hidden by a cut |
| Cinematography | 8 | 20 motivated shots, axis respected, crane, tracking, rack focus, ECU |
| Editing | 8 | cuts on the 96 BPM grid, tape-stop brake, two real silences, L-cut mew, the hum as first sound after silence |
| VFX | 8 | rain at three depths, splashes/ripples, wet reflections incl. the character, light bands masked to her, bloom/halation |
| Voice | 7 | clean, Whisper-verified, consistent speaker identity — naturalness needs a human |
| Sound design | 7 | every action has a synthesised sound; plausibility needs a human |
| Audio cleanliness | 8 | measured: no clipping, −14 LUFS, ≤ −1 dBTP, quiet floors in the silences |
| Style fidelity | 8 | flat cels + airbrushed plates + backlit light + tape/CRT |
| Emotional impact | 7 | needs a human viewing |

**Verdict:** delivered as the lab's first MASTER, technically clean (all automated checks pass), **not yet at the 9/10 MASTER bar** in
character drawing, animation breadth and sound realism. The next round (if requested) is listed in `NOTES.md`.
