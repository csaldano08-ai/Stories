# -*- coding: utf-8 -*-
"""Last Train Home — sound design + mix (LEMO_CINEMATIC_LAB MASTER 08).
Inputs: src/events.json (window.EV via core/render/events.mjs), audio/voice/final/{A1,A2,D1,A3}.wav (cleaned), audio/music/score.wav.
Outputs (48 kHz stereo float WAV): audio/stems/{dialogue,music,foley,ambience,sfx}.wav and audio/mix.wav (pre-master, peak −3 dBFS;
mux.sh does the two-pass loudnorm to −14 LUFS / −1 dBTP).
All foley/ambience is synthesised here (numpy/scipy), placed on the frame of the action that causes it.
Ambience is rain/train/city — motivated, textured (drops, gutters, joints), never a flat hiss bed.
"""
import os, json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
SR = 48000; BEAT = .625
def b(n): return n * BEAT
EV = json.load(open(os.path.join(ROOT, 'src', 'events.json')))
DUR = EV['dur']; N = int(round(DUR * SR)) + SR
rng = np.random.default_rng(808)
def ts(n): return np.arange(n) / SR
def sos(kind, f, o=2): return butter(o, f, kind, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(sos('low', f, o), x, axis=0)
def hp(x, f, o=2): return sosfilt(sos('high', f, o), x, axis=0)
def bp(x, lo, hi, o=2): return sosfilt(sos('band', [lo, hi], o), x, axis=0)
def noise(n): return rng.standard_normal(n)
def env_exp(n, tau): return np.exp(-ts(n) / tau)
def st(x, pan=0.0, w=0.0):
    """mono → stereo with constant-power pan; w adds a decorrelated copy for width"""
    L, R = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    if w: d = int(.011 * SR); y2 = np.concatenate([np.zeros(d), x[:-d]]); return np.stack([x * L * 1.41, (x * (1 - w) + y2 * w) * R * 1.41], 1)
    return np.stack([x * L, x * R], 1) * 1.41

STEM = {k: np.zeros((N, 2)) for k in ['dialogue', 'music', 'foley', 'ambience', 'sfx']}
def put(stem, sig, t, g=1.0, pan=0.0):
    i = int(round(t * SR)); s = sig if sig.ndim == 2 else st(sig, pan)
    if i < 0: s = s[-i:]; i = 0
    n = min(len(s), N - i)
    if n > 0: STEM[stem][i:i + n] += s[:n] * g
def make_ir(dur, rt60, damp=5000, seed=3):
    r = np.random.default_rng(seed); n = int(dur * SR); t = ts(n)
    ir = np.stack([r.standard_normal(n), r.standard_normal(n)], 1) * np.exp(-6.9 * t / rt60)[:, None]
    ir = lp(ir, damp); ir[:int(.004 * SR)] = 0; return ir / np.abs(ir).sum(0).max() * 6
IR_ST = make_ir(1.6, 1.4, 4500, 4)       # open station forecourt
IR_CAR = make_ir(.5, .35, 6000, 5)       # train car interior
def verb(x, ir, wet=.25):
    x2 = x if x.ndim == 2 else st(x)
    return x2 + np.stack([fftconvolve(x2[:, c], ir[:, c])[:len(x2)] for c in range(2)], 1) * wet

# ——————————————————— ambience ———————————————————
def rain_bed(d, heavy=1.0, under=0.0, seed=1):
    """textured rain: soft low body + thousands of tiny drop transients + gutter trickle; 'under' = heard under a roof/glass"""
    r = np.random.default_rng(seed); n = int(d * SR)
    body = lp(np.cumsum(r.standard_normal(n)) * .02, 1800) * .25
    body = hp(body, 150, 3)
    drops = np.zeros(n)
    k = int(d * 900 * heavy)
    pos = r.integers(0, n - 400, k); amp = r.uniform(.05, 1, k) ** 2
    blip = hp(r.standard_normal(260), 1800) * np.exp(-np.arange(260) / 40)
    for p, a in zip(pos, amp): drops[p:p + 260] += blip * a
    drops = bp(drops, 1200, 9000) * .5
    trickle = bp(r.standard_normal(n), 600, 2600) * (.5 + .5 * np.sin(2 * np.pi * .37 * ts(n) + r.random() * 6)) * .06
    x = body + drops + trickle
    if under: x = lp(x, 2400 - 1600 * under) * (1 - .4 * under)
    y = np.stack([x, np.roll(x, int(.017 * SR)) * .9 + bp(r.standard_normal(n), 1500, 8000) * .01], 1)
    return y / (np.abs(y).max() + 1e-9)
def train_idle(d):
    n = int(d * SR); t = ts(n)
    hum = sum(np.sin(2 * np.pi * f * t + i) / (i + 1) for i, f in enumerate([120, 240, 360, 600]))
    comp = (1 + .5 * np.sign(np.sin(2 * np.pi * 2.1 * t))) * bp(noise(n), 200, 900) * .3
    return lp(hum * .3 + comp * .6, 3000)
def train_run(d, v_of_t):
    """inverter whine (stepped harmonic tones rising with speed) + motor hum + wheel/rail rumble + rail-joint clacks"""
    n = int(d * SR); t = ts(n); v = v_of_t(t)       # m/s
    f0 = 180 + 55 * v
    steps = 1 + np.floor(v / 4) * .0                  # smooth whine (period-true VVVF sound kept subtle)
    ph = 2 * np.pi * np.cumsum(f0) / SR
    whine = (np.sin(ph) + .5 * np.sin(2 * ph + .3) + .25 * np.sin(3 * ph)) * np.clip(v / 6, 0, 1) * np.clip(1.4 - v / 25, .25, 1)
    rumble = hp(lp(noise(n), 160) * (1 - np.clip(v / 14, 0, 1)) + lp(noise(n), 420) * np.clip(v / 14, 0, 1), 55) * np.clip(v / 10, 0, 1) * 1.2
    clack = np.zeros(n); dist = np.cumsum(v) / SR; joint = 25.0
    last = 0
    for i in range(1, n, 240):
        if int(dist[i] / joint) > last:
            last = int(dist[i] / joint)
            for off in (0, 2.4 / max(v[i], .5)):      # two axles of a bogie
                j = i + int(off * SR)
                if j < n - 3000: clack[j:j + 3000] += bp(noise(3000), 300, 3000) * np.exp(-np.arange(3000) / 300) * min(1, v[i] / 8)
    return whine * .18 + rumble * .5 + clack * .9

# ——————————————————— foley synths ———————————————————
def step_wet(v=1.0, seed=0):
    r = np.random.default_rng(seed); n = int(.25 * SR); t = ts(n)
    thud = np.sin(2 * np.pi * (90 + 60 * np.exp(-t / .01)) * t) * np.exp(-t / .03)
    splash = bp(r.standard_normal(n), 1500, 9000) * np.exp(-t / .045) * (1 - np.exp(-t / .004))
    return (thud * .6 + splash * .7) * v
def splash_big():
    n = int(1.2 * SR); t = ts(n)
    s = bp(noise(n), 700, 9000) * (np.exp(-t / .09) + .25 * np.exp(-t / .35))
    drops = np.zeros(n)
    for k in range(40):
        p = int(rng.uniform(.05, .9) * SR); drops[p:p + 900] += np.sin(2 * np.pi * rng.uniform(1500, 3500) * ts(900)) * np.exp(-ts(900) / .01) * rng.uniform(.1, .4)
    return s + drops * .6
def scuff(v=1.0): n = int(.35 * SR); t = ts(n); return bp(noise(n), 500, 5000) * np.exp(-t / .1) * (1 - np.exp(-t / .02)) * v
def cloth(v=1.0, d=.45):
    n = int(d * SR); t = ts(n); e = np.sin(np.pi * t / d) ** 1.5 * (1 + .6 * np.sin(2 * np.pi * 7 * t))
    return bp(noise(n), 900, 5500) * e * .35 * v
def zip_(v=1.0):
    n = int(.4 * SR); x = np.zeros(n)
    for k in range(26): p = int(k * .014 * SR); x[p:p + 120] += hp(noise(120), 3000) * np.exp(-np.arange(120) / 20)
    return x * .5 * v
def mew(kind=1, v=1.0):
    """kitten mew: harmonic source with f0 contour + two moving formants + breath"""
    d = {1: .42, 2: .55, 3: .5}[kind]; n = int(d * SR); t = ts(n); u = t / d
    f0 = (620 + 520 * np.sin(np.pi * np.clip(u * 1.2, 0, 1)) ** 1.2 - 120 * u) * (1.0 if kind != 1 else 1.08)
    ph = 2 * np.pi * np.cumsum(f0 * (1 + .012 * np.sin(2 * np.pi * 22 * t))) / SR
    src = sum(np.sin(k * ph) / k ** 1.1 for k in range(1, 14))
    F1 = 900 + 700 * np.sin(np.pi * u); y = np.zeros(n)
    for a, z in ((0, n // 2), (n // 2, n)):
        fm = float(F1[(a + z) // 2]); y[a:z] = bp(src, fm * .7, fm * 1.5, 2)[a:z] + bp(src, 2600, 4200, 2)[a:z] * .4
    y = lp(src, 5000) * .25 + y
    env = np.clip(u / .08, 0, 1) * np.clip((1 - u) / .25, 0, 1) ** 1.3
    return (y * env + bp(noise(n), 2000, 7000) * env * .04) * v / (np.abs(y * env).max() + 1e-9)
def yawn_kitten(v=1.0):
    n = int(.9 * SR); t = ts(n); u = t / .9
    f0 = 500 + 500 * np.sin(np.pi * u) ** 2
    ph = 2 * np.pi * np.cumsum(f0) / SR; src = sum(np.sin(k * ph) / k ** 1.3 for k in range(1, 10))
    env = np.sin(np.pi * u) ** 1.5
    return (lp(src, 2500) * .6 + bp(noise(n), 800, 3500) * .5) * env * v * .5
def purr(d=5.0, v=1.0):
    n = int(d * SR); t = ts(n)
    pulses = (np.sin(2 * np.pi * 26 * t) > .6).astype(float)
    breath = .55 + .45 * np.sin(2 * np.pi * t / 1.4)
    x = lp(bp(noise(n), 60, 600) * pulses, 700) * breath
    return x * np.clip(t / .6, 0, 1) * np.clip((d - t) / .8, 0, 1) * v
def clunk(v=1.0):
    n = int(.6 * SR); t = ts(n)
    return (np.sin(2 * np.pi * 110 * t) * np.exp(-t / .07) + bp(noise(n), 2000, 7000) * np.exp(-t / .006) * .6 + np.sin(2 * np.pi * 1870 * t) * np.exp(-t / .05) * .2) * v
def chime_melody():
    """departure melody on the platform PA (original 6-note phrase, FM bells through a band-limited speaker)"""
    notes = [(0, 76), (.32, 79), (.64, 84), (.96, 83), (1.28, 79), (1.6, 81)]
    n = int(3.6 * SR); y = np.zeros(n)
    for dt, m in notes:
        f = 440 * 2 ** ((m - 69) / 12); k = int(dt * SR); tt = ts(n - k)
        y[k:] += np.sin(2 * np.pi * f * tt + 1.6 * np.exp(-tt / .25) * np.sin(2 * np.pi * 3.5 * f * tt)) * np.exp(-tt / .7) * .5
    return bp(y, 350, 4200)
def door_chime(): n = int(1.2 * SR); t = ts(n); return (np.sin(2 * np.pi * 659 * t) * np.exp(-t / .4) * (t < .5) + np.sin(2 * np.pi * 523 * t) * np.exp(-np.clip(t - .45, 0, None) / .5) * (t >= .45)) * .4
def door_close(): n = int(1.0 * SR); t = ts(n); return bp(noise(n), 300, 6000) * np.exp(-t / .25) * .5 + np.sin(2 * np.pi * 70 * t) * np.exp(-np.clip(t - .55, 0, None) / .05) * (t > .55) * .9
def seat(): n = int(.5 * SR); t = ts(n); return lp(noise(n), 400) * np.exp(-t / .08) * .8 + bp(noise(n), 600, 2500) * np.exp(-t / .2) * .1
def window_slide(): n = int(.7 * SR); t = ts(n); return bp(noise(n), 400, 3000) * np.sin(np.pi * t / .7) * .3 + np.sin(2 * np.pi * 60 * t) * np.exp(-np.clip(t - .6, 0, None) / .03) * (t > .6) * .4
def whoosh(v=1.0): n = int(.5 * SR); t = ts(n); return bp(noise(n), 300, 3000) * np.sin(np.pi * t / .5) ** 2 * .3 * v

# ——————————————————— build ———————————————————
T = {e['type']: e['t'] for e in EV['ev']}
evs = EV['ev']
# ambience by section (crossfaded beds)
def bed(sig, t0, t1, g, fi=.4, fo=.6):
    n0, n1 = int(t0 * SR), int(t1 * SR); s = sig[:n1 - n0].copy(); L = len(s)
    ramp = np.ones(L); a, z = int(fi * SR), int(fo * SR); ramp[:a] = np.linspace(0, 1, a); ramp[L - z:] = np.linspace(1, 0, z)
    put('ambience', s * ramp[:, None], t0, g)
heavy = rain_bed(b(66) + 2, 1.2, 0, 1)
bed(heavy, 0, b(66) + 1.5, .36, .02, .6)                                    # S1–S13 exterior rain
bed(rain_bed(10, .8, .55, 2), b(70) - .5, b(90) + .3, .28)                  # platform: rain on the canopy roof (muffled)
bed(rain_bed(13, .7, .85, 3), b(90), b(102) + .3, .32)                     # inside: rain on the glass, muffled
put('ambience', st(hp(lp(noise(int((b(110) - b(90)) * SR)), 220), 60, 2) * .3, 0, .3), b(90), .35)   # car interior rumble
cityd = b(119) + 1 - b(110)
put('ambience', st(bp(noise(int(cityd * SR)), 200, 1200) * .06 * np.clip(ts(int(cityd * SR)) / 1.5, 0, 1), 0, .8), b(110), .6)   # distant city
# train: idle from the hum (first sound after silence #2) to departure; running from departure to the end
idle_t0 = b(69) + .2; dep = next(e['t'] for e in evs if e['type'] == 'train_depart')
idl = train_idle(dep - idle_t0 + 1); idl *= np.clip(ts(len(idl)) / .25, 0, 1); idl[-SR // 2:] *= np.linspace(1, 0, SR // 2)
put('sfx', idl, idle_t0, .35, .3)
v_of = lambda t: np.clip(t / 6, 0, 1) ** 1.3 * 14
run = train_run(DUR - dep + .5, v_of)
inside = np.ones(len(run)); s19 = int((b(102) - dep) * SR); s20 = int((b(110) - dep) * SR)
run_in = lp(run, 1400) * 1.1                                                # heard from inside the car
mixrun = np.concatenate([run_in[:s19], run[s19:s20] * 1.0, lp(run[s20:], 900) * .35])   # outside the window, then far away
put('sfx', st(mixrun, 0, .4), dep, .45)
# events
stepk = 0
for e in evs:
    ty, t, v = e['type'], e['t'], e.get('v', 1.0)
    if ty == 'step_wet': put('foley', step_wet(v, stepk), t, .5, e.get('pan', 0)); stepk += 1
    elif ty in ('step_soft', 'step_hurry'): put('foley', step_wet(v * .6, stepk) , t, .35); stepk += 1
    elif ty == 'step_up': put('foley', step_wet(v * .7, 99), t, .45)
    elif ty == 'splash_big': put('foley', splash_big(), t, .8, -.1)
    elif ty == 'scuff': put('foley', scuff(v), t, .5)
    elif ty == 'cloth': put('foley', cloth(v), t, .45)
    elif ty == 'knee': put('foley', step_wet(v * .5, 7), t, .3)
    elif ty == 'zip': put('foley', zip_(v), t, .3)
    elif ty == 'fur': put('foley', cloth(v * .6, .6), t, .3)
    elif ty == 'purr': put('foley', purr(e.get('d', 5), v), t, .45)
    elif ty == 'clunk': put('sfx', clunk(v), t, .6)
    elif ty == 'mew':
        m = mew(e.get('k', 1), v); put('foley', verb(m, IR_ST, .18 if e.get('k') == 1 else .1), t, .42 if e.get('k') == 1 else .55)
    elif ty == 'chime': put('sfx', verb(chime_melody(), IR_ST, .5), t, .28, .2)
    elif ty == 'door_chime': put('sfx', door_chime(), t, .35, .1)
    elif ty == 'door_close': put('sfx', door_close(), t, .45)
    elif ty == 'seat': put('foley', seat(), t, .55)
    elif ty == 'window_slide': put('sfx', window_slide(), t, .25, -.3)
    elif ty == 'whoosh_soft': put('foley', whoosh(v), t, .3)
    elif ty == 'yawn_kitten': put('foley', yawn_kitten(v), t, .5)
# dialogue: placed at the timeline's line starts (events 'voice'); the driver outdoors (a touch of station verb), Aki close
VOICE = os.path.join(HERE, 'voice', 'final')
for e in evs:
    if e['type'] != 'voice': continue
    y, sr = sf.read(os.path.join(VOICE, e['id'] + '.wav'), dtype='float64'); assert sr == SR
    # gentle compression (RMS-follower, ratio ~2.5:1 above −24 dBFS), then level by RMS
    envr = np.sqrt(np.convolve(y ** 2, np.ones(480) / 480, 'same')) + 1e-9; lvl = 20 * np.log10(envr)
    gr = np.where(lvl > -24, (lvl + 24) * (1 - 1 / 2.5), 0); y = y * 10 ** (-gr / 20)
    y = y / (np.sqrt(np.mean(y[np.abs(y) > 1e-3] ** 2)) + 1e-9) * .1
    if e['who'] == 'driver': s = verb(y, IR_ST, .12); put('dialogue', s, e['t'] - .12, 1.0, .1)
    else: put('dialogue', st(y, -.05), e['t'] - .12, 1.0)
# music
mus, sr = sf.read(os.path.join(HERE, 'music', 'score.wav'), dtype='float64'); put('music', mus, 0, 1.0)
# ducking: music −9 dB and ambience −3 dB under dialogue (look-ahead 120 ms, release 350 ms)
dl = np.abs(STEM['dialogue']).mean(1); dk = np.convolve((dl > 1e-3).astype(float), np.ones(int(.12 * SR)), 'same') > 0
duck = np.zeros(N); a = 0.0
for i in range(0, N, 48):
    tgt = 1.0 if dk[i] else 0.0; a += (tgt - a) * (.25 if tgt > a else .014); duck[i:i + 48] = a
STEM['music'] *= (1 - duck * (1 - 10 ** (-9 / 20)))[:, None]
STEM['ambience'] *= (1 - duck * (1 - 10 ** (-3 / 20)))[:, None]
# balance & write (stems kept separate)
G = dict(dialogue=1.0, music=.42, foley=.8, ambience=.55, sfx=.75)
mix = sum(STEM[k] * G[k] for k in STEM)
L = int(round(DUR * SR)); mix = mix[:L]
pk = np.abs(mix).max(); sc = 10 ** (-3 / 20) / pk
os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
for k in STEM: sf.write(os.path.join(HERE, 'stems', f'{k}.wav'), (STEM[k][:L] * G[k] * sc).astype(np.float32), SR, subtype='FLOAT')
sf.write(os.path.join(HERE, 'mix.wav'), (mix * sc).astype(np.float32), SR, subtype='FLOAT')
print('mix', round(L / SR, 3), 's; pre-master peak scaled by', round(sc, 3))
