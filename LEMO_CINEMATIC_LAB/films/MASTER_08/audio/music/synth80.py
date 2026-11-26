# Synth voices adapted from Lemo-Opuscar styles/cel-anime-80s/demo/music/score.py (MIT, (c) 2026 Lemomo / LemoLab):
# epiano (DX7-style FM), bass (additive slap), kick, gated snare, toms, hats, crash, brass, pad, Karplus-Strong guitar, FM bell, riser.
# The composition in score.py is original to LEMO_CINEMATIC_LAB MASTER 08.
import os, json, numpy as np, soundfile as sf
from numba import njit
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.ndimage import maximum_filter1d, minimum_filter1d, uniform_filter1d
from numba import njit
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.ndimage import maximum_filter1d, minimum_filter1d, uniform_filter1d


SR = 48000
rng = np.random.default_rng(1987)






def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def ts(n): return np.arange(n) / SR
def noise(n): return rng.standard_normal(n)


def _sos(kind, f, o): return butter(o, f, kind, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(_sos('low', f, o), x, axis=0)
def hp(x, f, o=2): return sosfilt(_sos('high', f, o), x, axis=0)
def bp(x, lo, hi, o=2): return sosfilt(_sos('band', [lo, hi], o), x, axis=0)


# ───────────────────────── DSP kernels (numba) ─────────────────────────
@njit(cache=True)
def svf(x, fc, res, mode):
    """TPT state-variable filter, per-sample cutoff. mode 0=low-pass 1=band-pass 2=high-pass"""
    n = x.shape[0]; y = np.empty(n); ic1 = 0.0; ic2 = 0.0; k = 1.0 / res
    for i in range(n):
        f = fc[i]
        if f > 20000.0: f = 20000.0
        if f < 20.0: f = 20.0
        g = np.tan(np.pi * f / 48000.0)
        a1 = 1.0 / (1.0 + g * (g + k)); a2 = g * a1; a3 = g * a2
        v3 = x[i] - ic2; v1 = a1 * ic1 + a2 * v3; v2 = ic2 + a2 * ic1 + a3 * v3
        ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2
        if mode == 0: y[i] = v2
        elif mode == 1: y[i] = v1
        else: y[i] = x[i] - k * v1 - v2
    return y


@njit(cache=True)
def ks_loop(exc, L, P, damp, bright):
    """Karplus-Strong: loop of delay P + averaging filter with adjustable brightness"""
    y = np.zeros(L)
    for i in range(L):
        v = exc[i] if i < exc.shape[0] else 0.0
        if i > P:
            v += damp * (bright * y[i - P] + (1 - bright) * 0.5 * (y[i - P] + y[i - P - 1]))
        elif i == P:
            v += damp * y[0]
        y[i] = v
    return y


@njit(cache=True)
def env_follow(x, att, rel):
    n = x.shape[0]; e = np.empty(n); s = 0.0
    a = np.exp(-1.0 / (att * 48000.0)); r = np.exp(-1.0 / (rel * 48000.0))
    for i in range(n):
        v = x[i]
        if v > s: s = a * s + (1 - a) * v
        else: s = r * s + (1 - r) * v
        e[i] = s
    return e


def saw(freq, phase0=0.0):
    """PolyBLEP band-limited sawtooth; freq may be a per-sample array"""
    dt = np.asarray(freq, dtype=float) / SR
    ph = (phase0 + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    m = ph < dt; x = ph[m] / dt[m]; y[m] -= x + x - x * x - 1
    m = ph > 1 - dt; x = (ph[m] - 1) / dt[m]; y[m] -= x * x + x + x + 1
    return y


def adsr(dur, a, d, s, r):
    n = int((dur + r) * SR); t = ts(n)
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    ig = min(int(dur * SR), n - 1); v = e[ig]
    return np.where(t < dur, e, v * np.exp(-(t - dur) / (r / 4.6)))


def make_ir(dur, rt60, predelay=0.02, damp=3500, seed=1, early=True):
    n = int(dur * SR); t = ts(n); r = np.random.default_rng(seed)
    dec = np.exp(-6.9 * t / rt60); out = []
    for c in range(2):
        x = r.standard_normal(n) * dec
        dark = lp(x, damp, 1); w = np.clip(t / (rt60 * .45), 0, 1)
        x = x * (1 - w) * .6 + dark * w
        x[:int(.003 * SR)] *= np.linspace(0, 1, int(.003 * SR))
        if early:
            for k in range(6):
                d = int((0.007 + 0.011 * k + r.random() * .006) * SR); x[d] += (0.5 - k * .06) * (1 if r.random() > .5 else -1) * 8
        out.append(np.concatenate([np.zeros(int(predelay * SR)), x]))
    ir = np.stack(out, 1); return ir / np.sqrt((ir ** 2).sum(0).mean())


IR_HALL = make_ir(2.6, 1.9, .024, 3800, 11)
IR_PLATE = make_ir(1.1, 0.9, .006, 6500, 12, early=False)

# ───────────────────────── instruments ─────────────────────────


def epiano(m, dur, vel=0.7):
    """DX7-style FM electric piano: 1:1 carrier pair (body of the tone, modulation index decays over time) + 14:1 bell transient"""
    f = mtof(m); rel = 0.22; n = int((dur + rel) * SR); t = ts(n)
    tau = 1.2 * (262 / f) ** .5 + .35
    rel_env = np.where(t < dur, 1.0, np.exp(-(t - dur) / .06))
    amp = np.exp(-t / tau) * rel_env * np.minimum(1, t / .0015)
    I1 = vel * 1.5 * np.exp(-t / .5) + .3 * vel
    ph = 2 * np.pi * f * t; ph2 = 2 * np.pi * f * 1.0015 * t
    body = .62 * np.sin(ph + I1 * np.sin(ph)) + .38 * np.sin(ph2 + .7 * I1 * np.sin(ph2))
    tine = np.sin(ph + 2.2 * vel * np.exp(-t / .016) * np.sin(14 * ph)) * np.exp(-t / .11) * .3 * vel * rel_env
    return (body * amp + tine) * vel


def bass(m, dur, vel=.8, kind='T'):
    """Additive slap bass: higher harmonics decay faster (the natural filtering of a plucked string) + pitch drop on attack + string-slap noise"""
    f0 = mtof(m); rel = .025; n = int((dur + rel) * SR); t = ts(n)
    P = dict(T=(1.1, .30, 1.0, .03, .5), P=(.8, .12, .8, .045, .9), D=(.045, .9, 1.5, 0, .7), F=(1.8, .7, 1.5, .01, .1))[kind]
    base_tau, kk, tilt, drop, click = P
    ph = 2 * np.pi * np.cumsum(f0 * (1 + drop * np.exp(-t / .009))) / SR
    y = np.zeros(n); nh = int(min(46, 9000 / f0))
    for k in range(1, nh + 1):
        y += np.sin(k * ph + .37 * k) / k ** tilt * np.exp(-t / (base_tau / (1 + kk * k ** 1.15)))
    y /= 2.2
    cl = hp(noise(n), 2500) * np.exp(-t / .0022) * click
    env = np.minimum(1, t / .0012) * np.where(t < dur, 1, np.exp(-(t - dur) / .01))
    return np.tanh(1.5 * (y + cl) * env) * vel


def kick(vel=1.0):
    n = int(.42 * SR); t = ts(n)
    f = 50 + 85 * np.exp(-t / .028) + 380 * np.exp(-t / .0025)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .15) + hp(noise(n), 3000) * np.exp(-t / .004) * .22
    return np.tanh(1.4 * y) * vel


def _gate(n, hold, fall=.018):
    t = ts(n); return np.where(t < hold, 1.0, np.clip(1 - (t - hold) / fall, 0, 1))


def snare(vel=1.0, gate=.26):
    """Gated-reverb snare: dry + plate reverb, the reverb tail is cut by a hard gate at ~260 ms"""
    n = int(.6 * SR); t = ts(n)
    tone = np.sin(2 * np.pi * np.cumsum(190 * (1 + .12 * np.exp(-t / .01))) / SR) * np.exp(-t / .05) * .6 \
        + np.sin(2 * np.pi * 335 * t) * np.exp(-t / .03) * .3
    nz = bp(noise(n), 1200, 9000) * np.exp(-t / .1) * .9 + hp(noise(n), 5500) * np.exp(-t / .03) * .3
    dry = tone + nz
    wet = np.stack([fftconvolve(dry, IR_PLATE[:, c])[:n] for c in range(2)], 1)
    g = _gate(n, gate)[:, None]
    return (dry[:, None] * .8 + wet * 1.1 * g) * vel


def tom(f, vel=1.0):
    n = int(.55 * SR); t = ts(n)
    dry = np.sin(2 * np.pi * np.cumsum(f * (1 + .6 * np.exp(-t / .018))) / SR) * np.exp(-t / .22) + bp(noise(n), 300, 4000) * np.exp(-t / .03) * .3
    wet = np.stack([fftconvolve(dry, IR_PLATE[:, c])[:n] for c in range(2)], 1)
    return (dry[:, None] * .9 + wet * .9 * _gate(n, .24)[:, None]) * vel


HAT_F = np.array([205.3, 304.4, 369.6, 522.7, 540.0, 800.0]) * 2.1


def hat(vel=1.0, open_=False):
    n = int((.5 if open_ else .09) * SR); t = ts(n)
    x = sum(np.sign(np.sin(2 * np.pi * f * t + i)) for i, f in enumerate(HAT_F)) / 6
    x = hp(bp(x, 6000, 16000) + hp(noise(n), 8000) * .5, 6000)
    return x * np.exp(-t / (.13 if open_ else .017)) * vel


def crash(vel=1.0, dur=2.6):
    n = int(dur * SR); t = ts(n); out = []
    for c in range(2):
        x = hp(noise(n), 3500) + .5 * bp(sum(np.sign(np.sin(2 * np.pi * f * 1.37 * t + c)) for f in HAT_F), 3000, 12000)
        out.append(x * np.exp(-t / 1.1) * np.minimum(1, t / .002))
    return np.stack(out, 1) * vel * .5


def clap(vel=1.0):
    n = int(.3 * SR); t = ts(n); e = np.zeros(n)
    for k, d in enumerate([0, .009, .018, .03]):
        s = int(d * SR); e[s:] += np.exp(-(t[:n - s]) / (.006 if k < 3 else .09))
    return bp(noise(n), 900, 3500) * e * vel * .6


def tamb(vel=1.0):
    n = int(.12 * SR); t = ts(n)
    x = hp(noise(n), 7000) + .4 * sum(np.sin(2 * np.pi * f * t) for f in (5200, 6900, 8300))
    return x * np.exp(-t / .045) * vel


def boom(vel=1.0):
    n = int(.9 * SR); t = ts(n)
    return np.sin(2 * np.pi * np.cumsum(38 + 45 * np.exp(-t / .12)) / SR) * np.exp(-t / .35) * np.minimum(1, t / .004) * vel


def brass(m, dur, vel=.8, bright=1.0, att=.012):
    """Synth brass: 3 detuned PolyBLEP saws + pitch drop on attack (scoop) + filter-envelope swell + delayed vibrato"""
    f = mtof(m); rel = .14; n = int((dur + rel) * SR); t = ts(n)
    scoop = 2 ** ((-.3 * np.exp(-t / .035)) / 12)
    vib = 1 + .0035 * np.sin(2 * np.pi * 5.3 * t) * np.clip((t - .35) / .3, 0, 1)
    y = sum(saw(f * 2 ** (d / 1200) * scoop * vib, rng.random()) for d in (-8, 0, 7)) / 3
    fe = np.where(t < att + .03, np.minimum(1, t / (att + .03)), .5 + .5 * np.exp(-(t - att - .03) / .25))
    fe = np.where(t < dur, fe, fe[min(int(dur * SR), n - 1)] * np.exp(-(t - dur) / .05))
    fc = f * 1.3 + (1200 + 5.5 * f) * bright * (.35 + .65 * vel) * fe
    y = svf(y, fc, .85, 0)
    return y * adsr(dur, att, .3, .78, rel)[:n] * vel


def pad(m, dur, vel=.5):
    f = mtof(m); rel = .9; n = int((dur + rel) * SR); t = ts(n)
    y = sum(saw(f * 2 ** (d / 1200) * (1 + .0015 * np.sin(2 * np.pi * .31 * t + d)), rng.random()) for d in (-12, -4, 4, 12)) / 4
    y = lp(y, 2400, 2)
    return y * adsr(dur, .45, .6, .85, rel)[:n] * vel


def gtr(m, dur, vel=.7, mute=False):
    """Karplus-Strong electric guitar: pick-noise excitation, high damping for muted strums"""
    f = mtof(m); P = int(round(SR / f - .5)); L = int((dur + .06) * SR)
    exc = lp(noise(P), 2500 + 3500 * vel, 1) * vel
    y = ks_loop(exc, L, P, .975 if mute else .9965, .15 if mute else .35)
    t = ts(L); env = np.where(t < dur, 1, np.exp(-(t - dur) / .012))
    if mute: y = lp(y, 2200, 1)
    return y * env


def bell(m, dur=2.8, vel=.5):
    f = mtof(m); n = int(dur * SR); t = ts(n)
    I = 2.6 * vel * np.exp(-t / .3) + .25
    y = np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * 3.5 * f * t)) * np.exp(-t / .95) \
        + .25 * np.sin(2 * np.pi * 2.001 * f * t) * np.exp(-t / .4)
    return y * np.minimum(1, t / .002) * vel


def riser(dur, vel=1.0, f0=250, f1=7000):
    n = int(dur * SR); t = ts(n); u = t / dur
    fc = f0 * (f1 / f0) ** (u ** 1.6)
    y = svf(noise(n), fc, 2.2, 1) * (u ** 2.2)
    return y * vel


