#!/usr/bin/env python3
"""Gentle, logged clean-up of TTS dialogue (LEMO_CINEMATIC_LAB). No aggressive denoising — if a take is noisy, regenerate it.

    python voice_clean.py in.wav out.wav [--pre 0.12] [--post 0.30] [--hp 75] [--report out.json]

Steps: measure → DC removal → 2nd-order high-pass (75 Hz) → isolated-click repair (samples > 8× the local RMS, < 1.5 ms wide,
interpolated) → trim silence keeping a natural pre-roll and tail (breaths and decays kept) → 8 ms fade-in / 60 ms fade-out
→ resample to 48 kHz (soxr VHQ) → measure again. The Perth watermark applied by Chatterbox is left in place.
"""
import argparse, json, numpy as np, soundfile as sf, soxr
from scipy.signal import butter, sosfiltfilt

def metrics(y, sr):
    hop = int(sr * .01); fr = int(sr * .03)
    rms = np.array([np.sqrt(np.mean(y[i:i + fr] ** 2) + 1e-12) for i in range(0, max(1, len(y) - fr), hop)])
    db = 20 * np.log10(rms + 1e-12); sp = np.percentile(db, 90)
    pause = db[db < sp - 35]
    S = np.abs(np.fft.rfft(y * np.hanning(len(y)))) ** 2; f = np.fft.rfftfreq(len(y), 1 / sr)
    return {"dur": round(len(y) / sr, 3), "peak_dbfs": round(float(20 * np.log10(np.abs(y).max() + 1e-12)), 2), "dc": float(np.mean(y)),
            "speech_db": round(float(sp), 1), "pause_floor_db": round(float(np.median(pause)), 1) if len(pause) else None,
            "clip_samples": int(np.sum(np.abs(y) >= .999)), "hf_above_10k_pct": round(float(S[f > 10000].sum() / S.sum() * 100), 3)}

def declick(y, sr):
    w = int(sr * .0015); fixed = 0
    loc = np.sqrt(np.convolve(y ** 2, np.ones(int(sr * .01)) / int(sr * .01), 'same')) + 1e-6
    bad = np.where(np.abs(y) > 8 * loc)[0]
    i = 0
    while i < len(bad):
        j = i
        while j + 1 < len(bad) and bad[j + 1] - bad[j] < 3: j += 1
        a, z = bad[i], bad[j]
        if z - a < w and a > 2 and z < len(y) - 3:
            y[a - 1:z + 2] = np.linspace(y[a - 2], y[z + 2], z - a + 3); fixed += 1
        i = j + 1
    return y, fixed

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('inp'); ap.add_argument('out')
    ap.add_argument('--pre', type=float, default=.12); ap.add_argument('--post', type=float, default=.30)
    ap.add_argument('--hp', type=float, default=75); ap.add_argument('--report')
    a = ap.parse_args()
    y, sr = sf.read(a.inp, dtype='float64');
    if y.ndim > 1: y = y.mean(1)
    before = metrics(y, sr)
    y = y - np.mean(y)
    y = sosfiltfilt(butter(2, a.hp, 'high', fs=sr, output='sos'), y)
    y, clicks = declick(y, sr)
    # trim: first/last frame above (speech level − 40 dB), keep pre-roll and tail
    hop = int(sr * .005); env = np.array([np.sqrt(np.mean(y[i:i + hop] ** 2) + 1e-12) for i in range(0, len(y) - hop, hop)])
    thr = np.percentile(env, 90) * 10 ** (-40 / 20); on = np.where(env > thr)[0]
    s0 = max(0, on[0] * hop - int(a.pre * sr)); s1 = min(len(y), on[-1] * hop + hop + int(a.post * sr))
    y = y[s0:s1]
    fi, fo = int(sr * .008), int(sr * .06)
    y[:fi] *= np.linspace(0, 1, fi); y[-fo:] *= np.linspace(1, 0, fo) ** 2
    y48 = soxr.resample(y, sr, 48000, quality='VHQ')
    after = metrics(y48, 48000)
    sf.write(a.out, y48.astype(np.float32), 48000, subtype='PCM_24')
    rep = {"in": a.inp, "out": a.out, "trim_s": [round(s0 / sr, 3), round(s1 / sr, 3)], "clicks_repaired": clicks, "before": before, "after": after,
           "chain": f"DC removal; HP {a.hp} Hz (Butterworth 2, zero-phase); click repair; trim pre {a.pre}s / post {a.post}s; fades 8/60 ms; soxr VHQ → 48 kHz"}
    if a.report: json.dump(rep, open(a.report, 'w'), indent=1)
    print(json.dumps(rep))

if __name__ == '__main__':
    main()
