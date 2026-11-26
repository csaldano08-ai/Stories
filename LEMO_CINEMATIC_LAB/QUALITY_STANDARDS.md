# Quality standards — LEMO_CINEMATIC_LAB

These are the acceptance rules every film is checked against. "Measured" = an automated tool reports it; "Human" = needs
a person watching/listening (the agent cannot hear audio and only sees still frames / strips).

## Delivery specs
| item | MASTER | concept | how checked |
|---|---|---|---|
| Resolution / AR | 1920×1080, 16:9 | same | measured (`qa_film.py`) |
| Frame rate | 30 fps (24 only with a written artistic reason) | same | measured |
| Duration | 30–60 s (≤ 75 s if the story needs it) | 20–40 s | measured |
| Video | H.264 High, yuv420p (full range, Lemo `mux.sh`), CRF ≈ 16–23 | same | measured |
| Audio | AAC stereo 48 kHz in the MP4 + 48 kHz WAV master + separate stems | same | measured |
| Loudness | −14 LUFS integrated (±1 LU), true peak ≤ −1.0 dBTP, no clipped samples | same | measured on the exported MP4 |
| No studio intro, no CTA, no ad watermark, no auto-publishing | ✓ | ✓ | grep + human |

## Story & direction (DIRECTOR.md + brief §5, §10, §11)
Hook ≤ 3 s · one subject, one goal, one turn · show don't tell · every shot has a reason (TREATMENT shot list) · ≥ 4 camera
moves · axis of action and eyelines respected · 2 real silences · sound used as a transition ≥ 2× · one native move of the style.

## Animation & rig (brief §8–§9) — defects, never "limitations"
Foot locking on planted feet (world-space ball of foot never moves) · IK knees/elbows bend the right way · no stretching bones
(IK clamps reach) · held props between the palms · contact before control transfer · cycles and blends with easing, no pose pops
(except deliberate one-frame smears) · same construction for a character in every shot (no redraws).
Measured: planted-foot drift (rig), unreachable IK targets (rig). Human/visual: interpenetrations, hand placement, expressions.

## Rendering
Deterministic `render(t)` (any frame alone) · no NaN/black frames (measured) · anti-aliasing (canvas AA; supersampling for 3D)
· no flicker (camera/light on ones; drawings on 2s/3s only where the camera is locked) · grain/CRT added in post, consistent.

## Audio (brief §12–§13)
Separate stems (dialogue, music, foley, ambience, sfx) · every line Whisper-verified on the take AND in the final mix ·
speaker-identity check per line (embedding cosine) · no white-noise beds: ambience must be motivated and textured
(rain drops, gutters, rail joints) · voice ≈ 10 dB over ducked music (duck ≈ 9 dB) · no denoise artefacts (prefer regenerating).

## Scoring (0–10 per category, MASTER target ≥ 9 where applicable)
Story · Originality · Character design · Environments · Visual coherence · Animation · Rig & interactions · Cinematography ·
Editing · VFX · Voice · Sound design · Audio cleanliness · Style fidelity · Emotional impact. A critical unresolved defect blocks
approval regardless of the scores. Every defect is logged with timecode, description, severity, cause, fix, re-test result.
