# Environment limits (measured, not assumed)

| resource | value | consequence |
|---|---|---|
| CPU | 4 vCPU | 4 render workers saturate the machine; ≈ 2 s/frame/worker for a 2D cel frame with one full character + CRT pass |
| GPU | none (WebGL → ANGLE → SwiftShader, software) | every WebGL pass runs on the CPU. The 2D styles' WebGL post passes (CRT/tape, ≈ 40 ms) are fine; **three.js 3D styles with PBR + GTAO + DOF + 2× supersampling (Brick Toy, Paper Pop-up, Tilt-Shift, Glass Product, Memphis, Crayon World, Low-poly, LiDAR…) are expected to cost seconds to tens of seconds per frame** — to be benchmarked on MASTER 13 before committing to its shot list |
| RAM | 15 GB | fine (4 Chromium workers ≈ 3 GB) |
| Disk | ~60 GB free | fine; float32 audio intermediates are git-ignored and rebuilt by `build.sh` |
| Network | limited (allow-list) | HuggingFace + PyTorch CPU hosts added to the session environment "Stories"; github.io gallery reachable |
| Image generator | none | the 3 ✦ styles (Text Flash Cuts, Comic History Cartoon, Manga Panels) cannot be produced: the library forbids code-drawn stand-ins. Blocked, documented, not faked |
| Listening | the agent cannot hear | audio is verified by measurements (Whisper transcripts on takes and on the final mix, speaker-embedding similarity, loudness/true-peak, noise floors, spectra); a human listening pass is still required and is listed as such in every QA report |
| Watching | the agent sees stills, not motion | motion is checked with 0.2 s strips and contact sheets; a human full-speed viewing is still required |

## Mitigations planned for 3D on CPU
1. Render at 1920×1080 without 2× supersampling but with FXAA/SMAA-style AA in the post pass, and temporal accumulation only where the camera is static.
2. Characters stepped on twos (style rule) → reuse the static-scene accumulation between drawings where the camera holds.
3. Lower GTAO sample count; DOF only on shots that need it.
4. Measure s/frame per shot class and budget the film length accordingly — quality before quantity (brief §21).

## Measured: three.js on CPU (SwiftShader), Brick-Toy-class frame (2026-11-27)
Scene: 120 bevelled bricks (`RoundedBoxGeometry`) + 240 studs, `MeshPhysicalMaterial` clearcoat 0.85, PCF-soft shadow map 2048²,
2 RectAreaLights, hemisphere light, the library's `core/three/post.js` (DOF gather 96 taps + bloom + vignette + output). Timed with a
forced `readPixels` sync (WebGL is asynchronous: un-synced JS timings are meaningless, and the first frames include shader compiles
that can exceed Playwright's 30 s screenshot timeout). Test page: `research/rendering_techniques/bench3d/`.

| setting | ms / frame | 70 s at 30 fps (2100 frames), 1 worker |
|---|---|---|
| 1080p, SSAA 1×, no GTAO | ≈ 3 700 | ≈ 2.2 h |
| 1080p, SSAA 1×, GTAO | ≈ 5 300 | ≈ 3.1 h |
| 1080p, SSAA 2× (3840×2160 internal), GTAO | ≈ 20 200 | ≈ 11.8 h |

SwiftShader already spreads work over the 4 vCPUs, so extra render workers give much less than linear speed-up.
**Decision for MASTER 13:** SSAA 1× + GTAO + an SMAA/FXAA pass, DOF only on macro shots, characters on twos so static-camera holds can
reuse frames; previews at 960×540 (≈ ¼ cost). Budget ≈ 3 h per final render → at most one fix render. A machine with a GPU would make
2× SSAA affordable (minutes, not hours).
