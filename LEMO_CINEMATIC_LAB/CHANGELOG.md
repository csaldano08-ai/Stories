# Changelog — LEMO_CINEMATIC_LAB

## 2026-11-26
- Created the lab (independent folder inside the `Stories` repository; no other project touched).
- Installed `lemo-opuscar@lemolab` (Claude Code plugin; library sparse clone `~/lemo-opuscar`, commit 439b98a, package 2.0.0) and its
  core / voice / music tiers. ffmpeg 9.0.2 (imageio-ffmpeg wheel) on PATH ahead of the system ffmpeg 6.1 (library needs ≥ 7).
- Environment: new personal cloud environment "Stories" with HuggingFace + PyTorch CPU wheel hosts allowed (the Default environment blocked them).
- Chatterbox: git ab55923 (Nano support), Perth watermark fixed (git ff1c8ac). Nano/Turbo/Multilingual V3 weights downloaded; CPU benchmarks in `research/audio_techniques/CHATTERBOX_NOTES.md`.
- Tools: `tools/audio/cbx_tts.py` (multi-take TTS + Whisper/speaker/noise checks), `tools/audio/voice_clean.py`, `tools/quality_assurance/qa_film.py`, `tools/rendering/profile_page.mjs`, `tools/setup_lab.sh`, `tools/env.sh`.
- STYLE_CATALOG: 99 styles verified against the installed `style.json` files; 3 ✦ styles (Text Flash Cuts, Comic History Cartoon, Manga Panels) blocked: no image generator.
- MASTER 08 *Last Train Home*: treatment, bibles, original 2D rig (IK, foot locking, deterministic secondary motion), union-cel renderer, 20 shots, original score, synthesised sound design, mix.
  Engine base adapted from the Lemo-Opuscar 80s Cel Anime demo (MIT): `cel.js` (+ path bounding boxes), `post.js` (unchanged CRT/tape pass), synth voices (`audio/music/synth80.py`).
  Canvases switched to CPU raster (`willReadFrequently`) and all mask work bounded to each group's box: 24 s → ~1 s per character frame.

## 2026-11-27
- MASTER 08 delivered: render v1 (preview) → QA (contact sheets, 0.2 s strips, loudness, Whisper on the final mix) → fix round v2
  (hands insert rebuilt with a fingered top-view hand rig, reach distance, street depth, doorway, seat, audio low end and rain level) →
  S15 patched frame-exact (`tools/rendering/patch_range.mjs`, new: re-render a time range and splice it, the lab's checkpoint mechanism).
- Delivery: `delivery/master_films/MASTER_08_last-train-home.mp4` (+ burned-in subtitles .srt), poster, 24-bit FLAC stems + 48 kHz/24-bit WAV master, reports.
- MASTER 13 treatment written (ending changed after reading the demo notes to stay clear of its scale-reveal ending).
