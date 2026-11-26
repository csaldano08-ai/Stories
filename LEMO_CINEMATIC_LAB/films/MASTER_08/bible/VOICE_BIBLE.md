# Voice bible — *Last Train Home*

Engine: **Chatterbox Nano** (ResembleAI/chatterbox-nano, 110 M, MIT), loaded with `ChatterboxTurboTTS.from_pretrained("cpu", nano=True)`
from chatterbox-tts git `ab55923` (PyPI 0.1.7 has no `nano=`). The model's native **Perth watermark is kept** (resemble-perth
git `ff1c8ac`; the PyPI 1.0.1 build silently disabled it — see `research/audio_techniques/CHATTERBOX_NOTES.md`).
Tool: `tools/audio/cbx_tts.py` (multi-take generation + objective checks). Takes and reports: `audio/voice/takes_cast/`.

**Authorised references.** No real person's voice is cloned. Timbre prompts are 9–15 s clips generated with Kokoro v1.0
(Apache-2.0, synthetic voices) from original text — used ONLY as speaker prompts for Chatterbox; every spoken line in the film
is Chatterbox Nano output. (The user's own reference `LUCASPESORA.mp3` — Italian male narrator — is archived in
`shared/audio_references/user/` for future narrator roles; this film has no narrator.)

| | Aki | Driver |
|---|---|---|
| Timbre | light, warm, slightly breathy young woman | warm baritone, relaxed, a little gravel |
| Vocal age | ≈ 24 | ≈ 55–60 |
| Accent | General American (English-dub feel of 80s OVAs) | General American |
| Pace | fast & breathless when running; slow & soft with the kitten | unhurried |
| Intensity | A1 urgent → A2 tender → A3 relieved | kind, matter-of-fact |
| Reference | `shared/audio_references/kokoro_src/kref_af_heart.wav` | `…/kref_am_michael.wav` |
| Model / params | Nano, temperature 0.75, top_p 0.95, repetition_penalty 1.2 | Nano, temperature 0.7, top_p 0.95, rep. 1.2 |
| Pitch (measured) | median 175–242 Hz | median ≈ 131 Hz |
| Identity check | speaker-embedding cosine to the reference 0.70–0.88 (short clips score lower) | 0.87 |

## Lines (chosen takes — `audio/voice/final/selection.json`)
| id | text (as spoken) | take | why this take |
|---|---|---|---|
| A1 | `[gasp] Oh, no... I'm going to miss it.` | aki_heart gasp, seed 1 | the paralinguistic gasp gives a real intake of breath while running; "no" sustained 0.72 s naturally (no repeated letters) |
| A2 | `Hey... little one. Are you all alone?` | aki_heart soft, seed 1 | slower, with a pause after "Hey" and "one" — tender, not chirpy |
| D1 | `Come on, I've got a minute.` | drv_michael full, seed 3 | one breath, relaxed delivery; segmenting into two utterances was tested (both clean) but the single take keeps the warmth. Subtitle keeps the script's punctuation |
| A3 | `[sigh] Thank you.` | aki_heart thanks_breath, seed 2 | a relieved out-breath before the words |

Rejected: takes that dropped "Oh" ("No, I'm going…"), that said "I got" for "I've got", or that stopped after "Come on." (early end-of-speech);
these were caught by the Whisper word-match check and regenerated with a new seed/segmentation.

## Cleaning (`tools/audio/voice_clean.py`, reports `audio/voice/final/*_clean.json`)
DC removal → 75 Hz high-pass (zero-phase) → click repair (0 found) → keep pre-roll/tail → 8/60 ms fades → 48 kHz (soxr VHQ).
No noise reduction was needed: pause floors −72 … −93 dBFS before mixing, no clipping, no DC.
