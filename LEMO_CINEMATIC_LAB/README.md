# LEMO_CINEMATIC_LAB — cinematic animation research studio

An independent lab for producing original short films entirely in code with the **Lemo-Opuscar** style library
(installed as the Claude Code plugin `lemo-opuscar@lemolab`, library commit `439b98a`, package 2.0.0) and voicing them with
**Chatterbox Nano** (+ Turbo / Multilingual V3). Goal: find the highest quality reachable with this technology, one style at a time,
and turn what we learn into reusable techniques.

| file | what |
|---|---|
| `PRODUCTION_TRACKER.md` | status of all 99 films (15 MASTER + 84 concepts) and the exact resume point |
| `STYLE_CATALOG.md` / `.json` | the 99 installed styles mapped to our film IDs, titles, folders, ✦ blockers |
| `QUALITY_STANDARDS.md` | delivery specs, acceptance rules, scoring |
| `CHANGELOG.md` | what changed, when |
| `tools/` | `env.sh` (toolchain), `setup_lab.sh` (rebuild from scratch), `audio/` (Chatterbox multi-take tool, voice clean-up), `quality_assurance/` (film QA), `rendering/` (page profiler) |
| `shared/audio_references/` | authorised voice prompts (synthetic Kokoro clips; the user's own narrator reference) |
| `films/MASTER_xx/`, `films/STYLE_xxx/` | one self-contained project per film: treatment, bibles, source, audio, build, QA |
| `delivery/` | finished MP4s, posters, stems, reports, showreel |
| `research/` | techniques, limits, measurements |

## Rebuild the toolchain in a fresh container
```bash
sh LEMO_CINEMATIC_LAB/tools/setup_lab.sh
```
Network needed: github.com, pypi.org, huggingface.co (+ CDN hosts), download.pytorch.org, download-r2.pytorch.org.

## Render a film
```bash
. LEMO_CINEMATIC_LAB/tools/env.sh && sh LEMO_CINEMATIC_LAB/films/MASTER_08/build.sh
```

## Environment facts (measured)
4 vCPU, 15 GB RAM, **no GPU** (WebGL via SwiftShader). Canvas-2D cel styles: ≈ 1–2 s/frame/worker. 3D styles will be far slower
(see `research/limitations/`). ffmpeg 9.0.2 from the `imageio-ffmpeg` wheel is put first on PATH (system ffmpeg 6.1 under-reports
audio length through loudnorm; the library requires 7+).

Films made here are the user's: no LemoLab credit or sign-off appears in them. Third-party material is listed in each film's `CREDITS`.
