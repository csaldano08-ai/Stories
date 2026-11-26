#!/usr/bin/env python3
"""Chatterbox voice-acting tool for LEMO_CINEMATIC_LAB.

    $TTS_PY tools/audio/cbx_tts.py <voices.json> <lines.json> <out_dir> [--only id,id] [--takes N]

voices.json  {"<character>": {"model": "nano|turbo|mtl3", "ref": "<wav path, relative to voices.json>" | "builtin",
                              "lang": "en", "params": {temperature, top_p, top_k, repetition_penalty,
                              exaggeration, cfg_weight}}}
lines.json   [{"id", "character", "text", "takes"?, "seed"?, "params"? (overrides), "asr"? (expected text if it
               differs from what is spoken, e.g. tags removed)}]

For every take it writes <out>/takes/<id>_s<seed>.wav (model-native 24 kHz, Perth watermark applied by the model,
untouched) and measures it.  The best passing take is copied to <out>/<id>.wav and everything is logged in
<out>/report.json + report.md.  Nothing is "fixed" here: cleaning is a separate, logged step (voice_clean.py).

Checks per take (all objective, nothing is listened to here — a human listen is still required):
  asr      faster-whisper transcript vs the script, word-level (numbers spelled out), must be 1.0 to pass
  sim      cosine similarity of the take's speaker embedding to the character's reference (Chatterbox VoiceEncoder);
           catches accidental speaker changes
  f0       median pitch and spread in semitones (monotony indicator)
  noise    RMS of the pauses (dBFS) and the share of >8 kHz energy in them (hiss indicator)
  clip     samples at |x| >= 0.999; dc offset; truncation (speech energy in the last 25 ms)
"""
import argparse, json, os, re, shutil, sys, time
from pathlib import Path
import numpy as np, soundfile as sf, librosa, torch

torch.set_num_threads(max(1, os.cpu_count() or 4))
_MODELS = {}

def load_model(kind):
    if kind in _MODELS: return _MODELS[kind]
    if kind in ("nano", "turbo"):
        from chatterbox.tts_turbo import ChatterboxTurboTTS
        m = ChatterboxTurboTTS.from_pretrained("cpu", nano=(kind == "nano"))
    elif kind == "mtl3":
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS
        m = ChatterboxMultilingualTTS.from_pretrained("cpu", t3_model="v3")
    else:
        raise SystemExit(f"unknown model {kind}")
    _MODELS[kind] = m
    return m

_ENC = None
def speaker_embed(wav, sr):
    global _ENC
    if _ENC is None:
        from chatterbox.models.voice_encoder import VoiceEncoder
        from safetensors.torch import load_file
        from huggingface_hub import snapshot_download
        p = Path(snapshot_download("ResembleAI/chatterbox-nano", allow_patterns=["ve.safetensors"]))
        _ENC = VoiceEncoder(); _ENC.load_state_dict(load_file(p / "ve.safetensors")); _ENC.eval()
    y = librosa.resample(wav.astype(np.float32), orig_sr=sr, target_sr=16000) if sr != 16000 else wav
    e = _ENC.embeds_from_wavs([y], sample_rate=16000)
    e = e.mean(0); return e / (np.linalg.norm(e) + 1e-9)

_ASR = None
def transcribe(path, lang):
    global _ASR
    if _ASR is None:
        from faster_whisper import WhisperModel
        _ASR = WhisperModel(os.environ.get("WHISPER_MODEL", "small.en" if lang == "en" else "small"), device="cpu", compute_type="int8")
    segs, _ = _ASR.transcribe(str(path), language=lang, word_timestamps=True, beam_size=5)
    segs = list(segs)
    words = [(w.word, w.start, w.end) for s in segs for w in s.words]
    lp = float(np.mean([s.avg_logprob for s in segs])) if segs else -9.0
    return "".join(w for w, _, _ in words).strip(), words, lp

NUM = {"0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten"}
def norm_words(s):
    s = re.sub(r"\[[^\]]+\]", " ", s.lower())          # paralinguistic tags are not words
    s = s.replace("’", "'")
    s = re.sub(r"[^a-z0-9' ]+", " ", s)
    return [NUM.get(w, w) for w in s.split() if w]

def word_match(ref, hyp):
    a, b = norm_words(ref), norm_words(hyp)
    # Levenshtein on words
    d = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        p, d[0] = d[0], i
        for j, y in enumerate(b, 1):
            p, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, p + (x != y))
    return 1 - d[len(b)] / max(1, len(a)), a, b

def measure(y, sr, f0_range=(65, 600)):
    """Objective audio checks on a mono float take."""
    out = {}
    out["dur"] = len(y) / sr
    out["peak_db"] = float(20 * np.log10(np.max(np.abs(y)) + 1e-12))
    out["clip_samples"] = int(np.sum(np.abs(y) >= 0.999))
    out["dc"] = float(np.mean(y))
    hop = int(sr * 0.010); frame = int(sr * 0.030)
    rms = librosa.feature.rms(y=y, frame_length=frame, hop_length=hop)[0]
    db = 20 * np.log10(rms + 1e-9)
    speech_lvl = np.percentile(db, 90)
    is_pause = db < speech_lvl - 35
    out["speech_db"] = float(speech_lvl)
    # pauses: interior + edges.  Noise floor = median of pause frames
    out["pause_floor_db"] = float(np.median(db[is_pause])) if is_pause.any() else None
    # hiss indicator: fraction of energy above 8 kHz inside pause frames
    S = np.abs(librosa.stft(y, n_fft=1024, hop_length=hop)) ** 2
    freqs = librosa.fft_frequencies(sr=sr, n_fft=1024)
    n = min(S.shape[1], len(is_pause)); P = S[:, :n][:, is_pause[:n]]
    out["pause_hf_ratio"] = float(P[freqs > 8000].sum() / (P.sum() + 1e-12)) if P.size else None
    # voiced region and truncation
    voiced = np.where(db > speech_lvl - 30)[0]
    if len(voiced):
        out["speech_t0"], out["speech_t1"] = voiced[0] * hop / sr, voiced[-1] * hop / sr
        tail = y[-int(sr * 0.025):]
        out["tail_db"] = float(20 * np.log10(np.sqrt(np.mean(tail ** 2)) + 1e-9))
        out["truncated"] = bool(out["tail_db"] > speech_lvl - 20)
    # pitch: YIN on frames that are clearly voiced by energy (pyin mis-tracks clips under ~1 s)
    f0 = librosa.yin(y, fmin=f0_range[0], fmax=f0_range[1], sr=sr, frame_length=2048, hop_length=hop)
    n2 = min(len(f0), len(db)); keep = db[:n2] > speech_lvl - 12
    f = f0[:n2][keep]
    if len(f) > 5:
        st = 12 * np.log2(f / np.median(f))
        out["f0_median"] = float(np.median(f)); out["f0_spread_st"] = float(np.percentile(st, 90) - np.percentile(st, 10))
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("voices"); ap.add_argument("lines"); ap.add_argument("out")
    ap.add_argument("--only", default=""); ap.add_argument("--takes", type=int, default=0)
    ap.add_argument("--min-sim", type=float, default=0.80)
    a = ap.parse_args()
    vroot = Path(a.voices).resolve().parent
    voices = json.load(open(a.voices)); lines = json.load(open(a.lines))
    out = Path(a.out); (out / "takes").mkdir(parents=True, exist_ok=True)
    rep_path = out / "report.json"
    report = json.load(open(rep_path)) if rep_path.exists() else {}
    only = set(x for x in a.only.split(",") if x)
    ref_emb = {}
    for L in lines:
        if only and L["id"] not in only: continue
        V = voices[L["character"]]; kind = V["model"]; lang = V.get("lang", "en")
        m = load_model(kind)
        ref = V.get("ref", "builtin")
        refp = None if ref == "builtin" else str((vroot / ref).resolve())
        params = {**V.get("params", {}), **L.get("params", {})}
        if refp:
            m.prepare_conditionals(refp, **({"exaggeration": params.get("exaggeration", 0.5)} if kind == "mtl3" else {}))
        if L["character"] not in ref_emb:
            if refp:
                ry, rsr = librosa.load(refp, sr=16000)
            else:  # builtin voice: embed a neutral sentence in that voice
                torch.manual_seed(0)
                w = m.generate("This is the reference sentence for this voice.", **({"language_id": lang} if kind == "mtl3" else {}))
                ry, rsr = w.squeeze().numpy(), m.sr
            ref_emb[L["character"]] = speaker_embed(ry, rsr)
        takes = a.takes or L.get("takes", 3); seed0 = L.get("seed", 1)
        gen_kw = {}
        for k in ("temperature", "top_p", "top_k", "repetition_penalty"):
            if k in params: gen_kw[k] = params[k]
        if kind == "mtl3":
            gen_kw["language_id"] = lang
            for k in ("exaggeration", "cfg_weight", "min_p"):
                if k in params: gen_kw[k] = params[k]
        rows = []
        for k in range(takes):
            seed = seed0 + k
            torch.manual_seed(seed); np.random.seed(seed)
            t = time.time()
            w = m.generate(L["text"], **gen_kw)
            gen_s = time.time() - t
            y = w.squeeze().numpy().astype(np.float32); sr = m.sr
            p = out / "takes" / f"{L['id']}_s{seed}.wav"
            sf.write(p, y, sr, subtype="PCM_24")
            hyp, words, asr_lp = transcribe(p, lang)
            wm, ref_w, hyp_w = word_match(L.get("asr", L["text"]), hyp)
            meas = measure(y, sr, tuple(V.get("f0_range", (65, 600))))
            sim = float(np.dot(speaker_embed(y, sr), ref_emb[L["character"]]))
            speech_len = meas.get("speech_t1", 0) - meas.get("speech_t0", 0)
            min_sim = a.min_sim - (0.18 if speech_len < 1.2 else 0.0)   # embeddings of sub-second clips are noisy
            ok = wm >= 1.0 and sim >= min_sim and meas["clip_samples"] == 0 and not meas.get("truncated", False)
            score = (wm >= 1.0) * 10 + sim * 3 + asr_lp + min(meas.get("f0_spread_st", 0), 8) / 8 \
                    - max(0.0, (meas["pause_floor_db"] or -90) + 60) / 10
            rows.append({"seed": seed, "file": str(p.relative_to(out)), "gen_s": round(gen_s, 2), "rtf": round(gen_s / meas["dur"], 2),
                         "asr": hyp, "asr_logprob": round(asr_lp, 3), "word_match": round(wm, 3), "sim": round(sim, 3), "pass": ok, "score": round(float(score), 3),
                         "words": [(w_, round(s, 2), round(e, 2)) for w_, s, e in words],
                         **{k2: (round(v, 3) if isinstance(v, float) else v) for k2, v in meas.items()}})
            print(f"{L['id']} s{seed}: match {wm:.2f} sim {sim:.3f} f0 {meas.get('f0_median',0):.0f}Hz±{meas.get('f0_spread_st',0):.1f}st "
                  f"floor {meas['pause_floor_db'] if meas['pause_floor_db'] is None else round(meas['pause_floor_db'],1)} dB "
                  f"{'PASS' if ok else 'fail'}  '{hyp}'", flush=True)
        best = max(rows, key=lambda r: (r["pass"], r["score"]))
        shutil.copy(out / best["file"], out / f"{L['id']}.wav")
        report[L["id"]] = {"character": L["character"], "text": L["text"], "model": kind, "ref": ref, "params": params,
                           "chosen": best["seed"], "chosen_pass": best["pass"], "takes": rows}
        json.dump(report, open(rep_path, "w"), indent=1)
    md = ["| line | character | model | chosen seed | pass | match | sim | f0 | spread st | pause floor dB | dur s |", "|---|---|---|---|---|---|---|---|---|---|---|"]
    for i, R in report.items():
        b = next(t for t in R["takes"] if t["seed"] == R["chosen"])
        md.append(f"| {i} | {R['character']} | {R['model']} | {R['chosen']} | {'✓' if b['pass'] else '✗'} | {b['word_match']} | {b['sim']} | {b.get('f0_median','')} | {b.get('f0_spread_st','')} | {b['pause_floor_db']} | {b['dur']} |")
    open(out / "report.md", "w").write("\n".join(md) + "\n")
    bad = [i for i, R in report.items() if not R["chosen_pass"]]
    if bad: print("NO PASSING TAKE:", ", ".join(bad)); sys.exit(1)

if __name__ == "__main__":
    main()
