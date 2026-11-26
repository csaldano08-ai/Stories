# Chatterbox in LEMO_CINEMATIC_LAB — installation findings, API, benchmarks

## Versions actually installed (2026-11-26)
- `chatterbox-tts` **git ab55923** (2026-11-04, "Update README #581"), package version string 0.1.7, installed `--no-deps` over the
  PyPI 0.1.7 dependency set. **PyPI 0.1.7 does NOT accept `nano=True`** (`ChatterboxTurboTTS.from_pretrained(device)` only);
  Nano support (`NANO_REPO_ID = "ResembleAI/chatterbox-nano"`, `t3_nano_v1.safetensors`, GPT2_small) exists only on GitHub main.
- `resemble-perth` **git ff1c8ac** (1.1.0). With PyPI 1.0.1 the import of `pkg_resources` fails inside a uv venv (no setuptools),
  `perth.PerthImplicitWatermarker` silently becomes `None` and Chatterbox crashes (`'NoneType' object is not callable`).
  Fixing the dependency keeps the native watermark (we never bypass it).
- torch 2.6.0+cpu, torchaudio 2.6.0+cpu (index download.pytorch.org → redirects to download-r2.pytorch.org: both hosts must be
  allowed), transformers 5.2.0, faster-whisper 1.2.1, Python 3.11 (uv venv `tools/venvs/tts`).
- Weights (HF): `ResembleAI/chatterbox-nano` (snapshot 71ccd1d), `ResembleAI/chatterbox-turbo`, `ResembleAI/chatterbox`
  (Multilingual: `t3_mtl23ls_v3.safetensors` = **V3**, `s3gen.pt`, `ve.pt`, tokenizer). V3 loads with
  `ChatterboxMultilingualTTS.from_pretrained("cpu", t3_model="v3")`.

## API notes
- Turbo/Nano `generate(text, temperature=.8, top_p=.95, top_k=1000, repetition_penalty=1.2, audio_prompt_path=…)`; `cfg_weight`,
  `exaggeration`, `min_p` are ignored by Turbo/Nano (warning). Reference must be > 5 s.
- Nano/Turbo understand paralinguistic tags: `[gasp] [sigh] [chuckle] [laugh] [cough] [sniff] [groan] [shush] [clear throat]`
  and style tags `[whispering] [angry] [fear] [surprised] [happy] [sarcastic] [crying] [dramatic] [narration] [advertisement]`.
  `[gasp]`/`[sigh]` before a line gave natural breaths (used in A1/A3).
- Multilingual: `generate(text, language_id='it'|'es'|…, exaggeration, cfg_weight, temperature…)`.
- Output 24 kHz mono, watermarked.

## Benchmarks (this container: 4 vCPU, no GPU — GPU benchmark impossible here)
| model | load | RTF (gen time / audio time), warm | notes |
|---|---|---|---|
| Nano | 5.3–5.5 s | **0.94–1.06** | first call after load ≈ 7× slower (warm-up) |
| Turbo | 7.9 s | 1.74 | |
| Multilingual V3 | 13.9 s | 4.48 | |

## Failure modes seen (and the fix that worked)
| symptom | example | detection | fix |
|---|---|---|---|
| early end-of-speech after a full stop | "Come on." (line stops) | Whisper word match 0.33 | new seed, or comma instead of full stop, or two utterances |
| dropped first word | "No, I'm going to miss it" | word match 0.86 | new seed |
| contraction lost | "I got a minute" | word match 0.83 | new seed |
| sub-second clips score low speaker similarity | "Come on." sim ≈ 0.66 | — | threshold relaxed by 0.18 for < 1.2 s speech |

## Voice references (authorised, synthetic)
Kokoro v1.0 voices (Apache-2.0) rendered to 9–15 s clips of original text, used only as Chatterbox speaker prompts
(`shared/audio_references/kokoro_src/`). Measured cloned pitch: af_heart ≈ 175–242 Hz, af_bella ≈ 186–228 Hz, af_nicole ≈ 150–172 Hz,
bf_emma ≈ 157–195 Hz; am_michael ≈ 99–133 Hz, am_fenrir ≈ 90–112 Hz, bm_george ≈ 124–146 Hz. Speaker-similarity of af_heart was the
most consistent (0.83–0.91) → chosen for Aki.
User reference `LUCASPESORA.mp3`: Italian, male, median F0 ≈ 96 Hz, 27.6 s, 24 kHz mono — kept for Italian narration with
Multilingual V3; with Nano (English) it only produced the first word in tests → not suitable for English lines as is.
