#!/usr/bin/env python3
"""Native sound design for one style: a 10 s stereo track synthesised from scratch (numpy), cued to the film's own events
(shared/audio/events.json: 29 footfalls, the splash in the puddle at 0.94 s, the watch 6.05–7.15 s, the clock's tick at 8.4 s,
the chime at 9.58 s, the cuts). Original music only: chord progressions and motifs are generated here; nothing is sampled or quoted.
Each style gets a recipe (instrument family, tempo, key, foley timbre, ambience) from its STYLE.md sound palette (§7).

Usage: $LEMO_PY shared/audio/native.py <style dir>   → <style>/audio/native.wav (48 kHz stereo, peak ≤ −1 dBFS before mastering)
The muxer (core/render/mux.sh) then masters it to −14 LUFS.
"""
import json, os, sys, numpy as np
from scipy.signal import butter, sosfilt

SR = 48000; DUR = 10.0; N = int(SR * DUR)
B = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EV = json.load(open(os.path.join(B, 'shared/audio/events.json')))
t_ = np.arange(N) / SR

# ─────────── building blocks
def lp(x, f, o=2): return sosfilt(butter(o, min(f, SR * .45) / (SR / 2), 'low', output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f / (SR / 2), 'high', output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo / (SR / 2), min(hi, SR * .45) / (SR / 2)], 'band', output='sos'), x)
def env(n, a=.005, d=.3, s=0., r=.05, hold=0.):
    t = np.arange(n) / SR; e = np.where(t < a, t / max(a, 1e-6), np.exp(-(t - a) / max(d, 1e-4)) * (1 - s) + s)
    if hold: e = e * np.clip(1 - (t - hold) / max(r, 1e-4), 0, 1)
    return e
def noise(n, seed=0): return np.random.default_rng(seed).standard_normal(n)
def soft(x):
    """a 1 ms fade-in and a fade-out of up to 25 ms on every event: a truncated tail or a first sample off zero is a broadband click"""
    n = len(x); fi = min(int(SR * .001), n // 2); fo = min(int(SR * .025), n // 3)
    w = np.ones(n)
    if fi > 1: w[:fi] = np.linspace(0, 1, fi)
    if fo > 1: w[-fo:] = np.cos(np.linspace(0, np.pi / 2, fo)) ** 2
    return x * w
def place(buf, x, t, pan=0., gain=1.):
    x = soft(x)
    i = int(t * SR);
    if i >= N or i + len(x) <= 0: return
    x = x[max(0, -i):N - i] if i < 0 else x[:N - i]; i = max(i, 0)
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); buf[0, i:i + len(x)] += x * gain * l; buf[1, i:i + len(x)] += x * gain * r
midi = lambda m: 440 * 2 ** ((m - 69) / 12)
def osc(f, n, kind='sine', det=0.):
    t = np.arange(n) / SR; ph = 2 * np.pi * f * t
    if kind == 'sine': return np.sin(ph)
    if kind == 'tri': return 2 / np.pi * np.arcsin(np.sin(ph))
    if kind == 'saw': return sum(np.sin(ph * k) / k * (-1) ** (k + 1) for k in range(1, max(2, int(9000 / max(f, 1))))) * .6
    if kind == 'square': return sum(np.sin(ph * k) / k for k in range(1, max(2, int(9000 / max(f, 1))), 2)) * .8
    if kind == 'pulse': return np.sign(np.sin(ph) + .4) * .5
def fm(f, n, ratio=2., index=2., idecay=.4):
    t = np.arange(n) / SR; I = index * np.exp(-t / idecay); return np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * f * ratio * t))
def ks(f, n, damp=.996, seed=1, bright=.5):
    # Karplus–Strong pluck
    p = max(2, int(SR / f)); buf = noise(p, seed) * .8; buf = lp(buf, 2000 + 8000 * bright) if p > 20 else buf; out = np.zeros(n)
    for i in range(n): out[i] = buf[i % p]; buf[i % p] = damp * .5 * (buf[i % p] + buf[(i + 1) % p])
    return out
def reverb(x, size=1.2, mix=.25, seed=3):
    L = int(SR * size); ir = noise(L, seed) * np.exp(-np.arange(L) / (SR * size / 5)); ir = lp(ir, 6000); ir /= np.sqrt((ir ** 2).sum())
    from scipy.signal import fftconvolve
    w = np.stack([fftconvolve(x[c], ir if c == 0 else np.roll(ir, 37), mode='full')[:N] for c in range(2)])
    return x * (1 - mix) + w * mix * 3

# ─────────── instruments (each returns a mono signal)
def I_epiano(m, d): n = int(SR * (d + .6)); return fm(midi(m), n, 1., 1.6, .25) * env(n, .003, .7, 0, .3, d) * .5
def I_pluck(m, d, seed=1): n = int(SR * (d + .8)); return ks(midi(m), n, .997, seed, .6) * env(n, .001, 1.2, 0, .2, d + .6)
def I_bell(m, d=1.5): n = int(SR * (d + 1.2)); return (fm(midi(m), n, 3.51, 3., .6) * .6 + np.sin(2 * np.pi * midi(m) * 2.01 * t_[:n]) * .2) * env(n, .002, 1.4)
def I_marimba(m, d=.3): n = int(SR * .9); f = midi(m); return (np.sin(2 * np.pi * f * t_[:n]) + .3 * np.sin(2 * np.pi * f * 4 * t_[:n]) * np.exp(-t_[:n] / .05)) * env(n, .001, .28)
def I_glock(m, d=.3): n = int(SR * 1.2); f = midi(m); return (np.sin(2 * np.pi * f * t_[:n]) + .25 * np.sin(2 * np.pi * f * 2.76 * t_[:n])) * env(n, .001, .6) * .6
def I_pad(ms, d, kind='saw', cut=1400): n = int(SR * (d + .8)); x = sum(osc(midi(m) * (1 + det), n, kind) for m in ms for det in (-.004, .004)) / (2 * len(ms)); return lp(x, cut) * env(n, .35, 9, 1, .7, d)
def I_bass(m, d, kind='saw', cut=500): n = int(SR * (d + .15)); return lp(osc(midi(m), n, kind), cut) * env(n, .004, .6, .5, .08, d) * .8
def I_lead(m, d, kind='saw', vib=.0):
    n = int(SR * (d + .2)); f = midi(m) * (1 + vib * np.sin(2 * np.pi * 5.5 * t_[:n]) * np.clip(t_[:n] / .25, 0, 1)); ph = 2 * np.pi * np.cumsum(f) / SR
    return lp(np.sin(ph) + (.5 * np.sin(2 * ph) + .3 * np.sin(3 * ph) if kind == 'saw' else 0), 3000) * env(n, .02, 4, .7, .1, d) * .4
def I_chip(m, d, kind='square'): n = int(SR * d); return osc(midi(m), n, kind) * env(n, .001, d, .6, .02, d * .9) * .25
def I_kick(): n = int(SR * .35); f = 120 * np.exp(-t_[:n] / .05) + 42; return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .001, .25)
def I_snare(seed=4): n = int(SR * .25); return (hp(noise(n, seed), 1200) * .7 + np.sin(2 * np.pi * 190 * t_[:n]) * .4) * env(n, .001, .09)
def I_hat(seed=5, open_=False): n = int(SR * (.25 if open_ else .06)); return hp(noise(n, seed), 7000) * env(n, .001, .12 if open_ else .02) * .5
def I_tick(f=3200, seed=6): n = int(SR * .03); return bp(noise(n, seed), f * .7, f * 1.4) * env(n, .0005, .006) * 1.6
def I_beep(f, d=.12): n = int(SR * d); return np.sin(2 * np.pi * f * t_[:n]) * (1 + .15 * np.sin(2 * np.pi * f * 2 * t_[:n])) * env(n, .003, d, .8, .02, d * .8) * .5
def I_ping(f=1400): n = int(SR * 1.6); return np.sin(2 * np.pi * f * t_[:n]) * env(n, .002, .45) * .6
def I_drone(m, d, cut=300): n = int(SR * d); return lp(osc(midi(m), n, 'saw') + osc(midi(m) * 1.498, n, 'saw') * .5, cut) * env(n, 1.2, 99, 1, 1., d - .2) * .4
def I_thud(f=70, seed=7): n = int(SR * .2); return (np.sin(2 * np.pi * f * t_[:n]) * env(n, .001, .05) + lp(noise(n, seed), 900) * env(n, .001, .02) * .5)
def I_splash(seed=8, bright=1.):
    n = int(SR * 1.1); x = bp(noise(n, seed), 500, 6000 * bright) * env(n, .004, .18) * 1.2
    for k in range(9): x += place1(I_drop(500 + 900 * np.random.default_rng(seed + k).random()), int(SR * (.05 + .08 * k)), n) * .5
    return x
def place1(x, i, n):
    y = np.zeros(n); x = soft(x[:max(0, n - i)]); y[i:i + len(x)] += x; return y
def I_drop(f): n = int(SR * .08); fr = f * (1 + 1.5 * t_[:n] / .08); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(n, .001, .02) * .5
def I_rain(level=.1, seed=9, cut=5000):
    x = bp(noise(N, seed), 400, cut) * level * .25
    rng = np.random.default_rng(seed + 1)
    for tt in rng.random(220) * DUR: x += place1(I_drop(1500 + 3000 * rng.random()) * level * .6, int(tt * SR), N)
    return np.stack([x, np.roll(x, 911)])
def I_whoosh(seed=10, d=.5): n = int(SR * d); return bp(noise(n, seed), 300, 4000) * np.sin(np.pi * np.clip(t_[:n] / d, 0, 1)) ** 2 * .6
def I_boing(f=300): n = int(SR * .5); fr = f * (1 + .6 * np.sin(2 * np.pi * 9 * t_[:n]) * np.exp(-t_[:n] / .15)); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(n, .002, .25) * .6
def I_slide(f0, f1, d=.4): n = int(SR * d); fr = np.geomspace(f0, f1, n); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(n, .01, d, .8, .05, d * .9) * .4
def I_crackle(level=.02, seed=11):
    x = np.zeros(N); rng = np.random.default_rng(seed)
    for tt in rng.random(160) * DUR: i = int(tt * SR); x[i:i + 30] += rng.standard_normal(30) * np.exp(-np.arange(30) / 6) * level * 8
    return np.stack([x, x])

# ─────────── harmony (original: progressions are generic functional harmony; the motifs are generated)
KEYS = {'C': 60, 'D': 62, 'Eb': 63, 'E': 64, 'F': 65, 'G': 67, 'A': 69, 'Bb': 70}
PROG = {'pop': [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]], 'minor': [[0, 3, 7, 10], [8, 12, 15, 19], [5, 8, 12, 15], [7, 10, 14, 17]],
        'modal': [[0, 7, 14], [5, 12, 19], [3, 10, 17], [7, 14, 19]], 'bright': [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], 'tense': [[0, 3, 6], [1, 5, 8], [0, 3, 6], [11, 14, 17]]}

def music(R, buf, seed):
    """the cue: four bars over 10 s (one per shot roughly), tempo from the recipe; the bar lines snap to the cuts where possible"""
    rng = np.random.default_rng(seed); root = KEYS[R.get('key', 'C')]; prog = PROG[R.get('prog', 'pop')]; bpm = R.get('bpm', 96); beat = 60 / bpm
    fam = R['family']; start = .1
    nbars = int((DUR - start) / (4 * beat)) + 1
    scale = [0, 2, 4, 7, 9] if R.get('prog') in ('pop', 'bright', 'modal') else [0, 3, 5, 7, 10]
    for b in range(nbars):
        t0 = start + b * 4 * beat; ch = prog[b % len(prog)]
        if t0 > DUR: break
        if fam in ('anime', 'neon', 'graphic', 'explainer'):
            place(buf, I_pad([root - 12 + c for c in ch], 4 * beat, 'saw', R.get('padcut', 1600)), t0, 0, .22 * R.get('pad', 1))
            for k in range(8): place(buf, I_bass(root - 24 + ch[0] + (7 if k % 4 == 3 else 0), beat * .45, 'saw', 420), t0 + k * beat / 2, 0, .5 * R.get('bassg', 1))
        if fam in ('painterly', 'craft', 'documentary', 'film', 'dark', 'realistic'):
            place(buf, I_pad([root - 12 + c for c in ch], 4 * beat, R.get('padkind', 'tri'), R.get('padcut', 900)), t0, 0, .3 * R.get('pad', 1))
        if fam == 'retro':
            for k in range(16): place(buf, I_chip(root + ch[k % len(ch)] + 12 * (k // 8 % 2), beat / 4 * .9, 'square'), t0 + k * beat / 4, -.2, .35)
            for k in range(4): place(buf, I_chip(root - 24 + ch[0], beat * .9, 'tri'), t0 + k * beat, .2, .6)
        if fam == 'cartoon':
            for k in range(4): place(buf, I_pluck(root - 24 + ch[0] + (7 if k % 2 else 0), beat * .4, 31 + k), t0 + k * beat, -.1, .55)
            for k in range(4): place(buf, sum(I_pluck(root - 12 + c, beat * .3, 40 + k + c) for c in ch[1:]) * .35, t0 + k * beat + beat / 2, .1, .5)
        if fam in ('anime', 'explainer', 'graphic'):
            for k in range(4):
                place(buf, I_kick(), t0 + k * beat, 0, .55 * R.get('drums', 1))
                if k % 2: place(buf, I_snare(), t0 + k * beat, 0, .32 * R.get('drums', 1))
                for h in range(2): place(buf, I_hat(5 + h), t0 + k * beat + h * beat / 2, .3, .25 * R.get('drums', 1))
        if fam == 'neon':
            for k in range(16): place(buf, I_lead(root + ch[k % len(ch)] + 12, beat / 4 * .8, 'saw') * .7, t0 + k * beat / 4, .25, .3)
            for k in range(4): place(buf, I_kick(), t0 + k * beat, 0, .6); place(buf, I_hat(7, True), t0 + k * beat + beat / 2, .3, .18)
        # a melody: a lead line on the recipe's instrument, a few notes per bar, generated from the scale
        lead = R.get('lead')
        if lead and b < 3:
            notes = [scale[int(rng.integers(0, len(scale)))] for _ in range(4)]
            for k, n_ in enumerate(notes):
                m = root + 12 + n_; tt = t0 + k * beat + (beat / 2 if k % 2 and fam == 'cartoon' else 0)
                x = {'epiano': lambda: I_epiano(m, beat * .9), 'pluck': lambda: I_pluck(m, beat * .9, 60 + k), 'marimba': lambda: I_marimba(m),
                     'glock': lambda: I_glock(m + 12), 'lead': lambda: I_lead(m, beat * .9, 'saw', .01), 'flute': lambda: I_lead(m, beat * 1.6, 'sine', .012), 'chip': lambda: I_chip(m + 12, beat * .7)}[lead]()
                place(buf, x, tt, .15 * (-1) ** k, .32 * R.get('leadg', 1))

def build(slug, R):
    buf = np.zeros((2, N)); seed = sum(map(ord, slug))
    # ambience: intentional rain (not a hiss under everything), level per style
    if R.get('rain', .6) > 0: buf += I_rain(R.get('rain', .6), seed, R.get('raincut', 5000))
    if R.get('crackle'): buf += I_crackle(R['crackle'], seed)
    if R.get('drone'): place(buf, I_drone(KEYS[R.get('key', 'C')] - 24, DUR), 0, 0, R['drone'])
    music(R, buf, seed)
    # foley on the film's events
    step = R.get('step', 'wet')
    for s in EV['steps']:
        if s['puddle']: continue
        pan = -.2 if s['foot'] == 'f' else .2
        x = {'wet': lambda: I_thud(80, seed) + place1(hp(noise(int(SR * .05), seed + 1), 2500) * env(int(SR * .05), .001, .015) * .3, 0, int(SR * .2)), 'tap': lambda: I_tick(1800, seed) * .7, 'wood': lambda: I_marimba(36, .1) * .6,
             'chip': lambda: I_chip(40, .05, 'pulse') * 1.2, 'soft': lambda: lp(I_thud(60, seed), 400), 'none': lambda: np.zeros(10)}[step]()
        place(buf, x, s['t'], pan, R.get('stepg', .5))
    place(buf, {'chip': lambda: I_slide(900, 200, .3) * 1.3, 'cartoon': lambda: I_boing(260) + I_splash(seed, .6) * .5}.get(R.get('splash'), lambda: I_splash(seed, R.get('splashb', 1.)))(), EV['splash'], 0, R.get('splashg', .9))
    # the watch: a small tick sequence at its glance, or the style's own signal
    w = R.get('watch', 'tick')
    for k in range(int((EV['watchDown'] - EV['watchUp']) / .5) + 1):
        tt = EV['watchUp'] + .1 + k * .5
        place(buf, {'tick': lambda: I_tick(4200, seed + k), 'beep': lambda: I_beep(1760, .08), 'chip': lambda: I_chip(84, .06), 'ping': lambda: I_beep(2400, .05) * .6}[w](), tt, .3, .45)
    # the station clock's second (one clear tick, a little reverb) and the chime
    place(buf, place1(I_tick(2600, seed + 50) * 1.4, 0, int(SR * .2)) + I_thud(160, seed) * .3, EV['clockTick'], 0, .7)
    ch = R.get('chime', 'bell'); root = KEYS[R.get('key', 'C')]
    chx = {'bell': lambda: I_bell(root + 12) + I_bell(root + 19) * .6, 'glock': lambda: I_glock(root + 24) + I_glock(root + 31) * .7, 'chip': lambda: I_chip(root + 24, .3) + I_chip(root + 31, .4),
           'ping': lambda: I_ping(1320) + I_ping(1980) * .3, 'beep': lambda: I_beep(1047, .4) + I_beep(1568, .4) * .6, 'gong': lambda: lp(I_bell(root - 12, 2.5), 2500) * 1.3}[ch]()
    place(buf, chx, EV['chime'], 0, R.get('chimeg', .8))
    buf = reverb(buf, R.get('room', 1.1), R.get('wet', .22), seed)
    buf = hp(buf, 35)
    if R.get('lofi'): buf = lp(np.round(buf * 48) / 48, 9000)                                  # 8-bit/lo-fi: coarse quantise and a band-limit
    if R.get('radio'): buf = bp(buf, 300, 3400) * 1.6
    pk = np.abs(buf).max(); buf = buf / pk * 10 ** (-1.5 / 20)
    return buf

if __name__ == '__main__':
    d = sys.argv[1].rstrip('/'); slug = os.path.basename(d)[4:]
    from recipes import recipe_for
    R = recipe_for(slug)
    y = build(slug, R); os.makedirs(os.path.join(d, 'audio'), exist_ok=True)
    import wave
    w = wave.open(os.path.join(d, 'audio', 'native.wav'), 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y.T, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
    json.dump({'slug': slug, 'recipe': R}, open(os.path.join(d, 'audio', 'native_recipe.json'), 'w'), indent=1)
    print(slug, R['family'], 'peak', round(20 * np.log10(np.abs(y).max()), 2), 'dBFS')
