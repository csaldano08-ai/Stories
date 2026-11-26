# -*- coding: utf-8 -*-
"""Last Train Home — original score (LEMO_CINEMATIC_LAB MASTER 08). 96 BPM, one grid with src/timeline.js.
Run: $LEMO_PY audio/music/score.py → audio/music/score.wav (48 kHz stereo), stems/*.wav, cues.json
  §A  b0–b26   F minor city-pop groove (run). Intro pad + riser → brass stab on the splash (b1.5) → tom fill → groove at b4.
               Brass hit on the watch (b12). The music BRAKES with her: tape-stop over b25.4–b26, then silence #1.
  §B  b38–b64  "kitten theme": D♭ major FM electric piano, fretless bass from b42, string pad; ends under the clock (b64).
               silence #2 b66.6–b69.2; one EP chord with the train's hum at b69.2.
  §C  b70–b90  soft return groove (brushy hats, soft kick, walking bass, EP comping), thin under the dialogue.
  §D  b90–b119 A♭ ballad chorus: sax-like lead (original melody), half-time gated snare, bass, EP, pad; AbM9 on the city wide
               (b110) and a bell arpeggio ringing out. No key change.
Voices (epiano, bass, drums, brass, pad, guitar, bell, riser) adapted from the Lemo-Opuscar 80s Cel Anime demo (MIT): synth80.py.
"""
import os, sys, json, numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from synth80 import *   # noqa

HERE = os.path.dirname(os.path.abspath(__file__))
BPM = 96; BEAT = 60 / BPM
def b(n): return n * BEAT
DUR = b(119) + 1.5
N = int(round(DUR * SR))
STEMS = ['drums', 'bass', 'keys', 'guitar', 'pad', 'lead', 'fx']
BUS = {k: np.zeros((N, 2)) for k in STEMS}
SEND = {k: np.zeros(N) for k in STEMS}
SEND_AMT = dict(drums=.04, bass=0, keys=.25, guitar=.12, pad=.35, lead=.3, fx=.4)
IR = make_ir(2.4, 1.8, .03, 4200, 21)

def place(bus, sig, t, gain=1.0, pan=0.0, send=None):
    i = int(round(t * SR))
    if i >= N or i < 0: return
    s = sig if sig.ndim == 2 else np.stack([sig * np.cos((pan + 1) * np.pi / 4), sig * np.sin((pan + 1) * np.pi / 4)], 1) * 1.414
    n = min(len(s), N - i)
    BUS[bus][i:i + n] += s[:n] * gain
    SEND[bus][i:i + n] += s[:n].mean(1) * gain * (SEND_AMT[bus] if send is None else send)

Q = {'M7': [0, 4, 7, 11], 'M9': [0, 4, 7, 11, 14], 'm7': [0, 3, 7, 10], 'm9': [0, 3, 7, 10, 14], '7': [0, 4, 7, 10], '6': [0, 4, 7, 9],
     '13': [0, 4, 10, 14, 21], 'sus13': [0, 5, 10, 14, 21], 'm11': [0, 3, 7, 10, 17]}
PCS = dict(C=0, Db=1, D=2, Eb=3, E=4, F=5, Gb=6, G=7, Ab=8, A=9, Bb=10, B=11)
def chord(root, q, center=62, n=4):
    r = PCS[root]; notes = []
    for iv in Q[q][1:] + [Q[q][0] + 12]:
        m = 48 + r + iv
        while m < center - 7: m += 12
        while m > center + 7: m -= 12
        notes.append(m)
    return sorted(set(notes))[:n]
def broot(root, low=31): r = PCS[root]; m = low + ((r - (low % 12)) % 12); return m
hum = lambda ms=4: rng.normal(0, ms / 1000)
jv = lambda v, j=.08: v * (1 + rng.uniform(-j, j))

SN = [snare(1, .24) for _ in range(3)]; KK = [kick(1) for _ in range(2)]

# ———————————————— §A: run (F minor) ————————————————
A_CH = [(4, 'F', 'm9'), (8, 'Db', 'M7'), (12, 'Eb', '6'), (16, 'C', 'm7'), (18, 'F', '7'), (20, 'F', 'm9'), (24, 'Db', 'M7')]
def a_chord(beat):
    cur = A_CH[0]
    for c in A_CH:
        if beat >= c[0]: cur = c
    return cur
# intro: pad swell, hats ticking, reverse swell into the splash, brass stab + crash on the splash (b1.5), tom fill b2.5–b4
place('pad', sum(pad(m, b(4), .35) for m in chord('F', 'm9', 60)), 0, .5)
for k in range(6): place('drums', hat(.35), b(k * .5), .5, .3)
place('fx', riser(b(1.5), .5, 300, 6000), 0, .45)
for m in chord('F', 'm9', 67): place('lead', brass(m, .32, .9, 1.1), b(1.5) + hum(), .3, (m - 67) * .05)
place('drums', crash(.9), b(1.5), .5)
for k, f in enumerate([180, 150, 120, 95]): place('drums', tom(f, .8), b(2.5 + k * .375), .55, -.3 + k * .2)
# groove b4–b26 (16th hats, kick 1 & the "and" of 2, gated snare 2 & 4, slap bass, EP stabs, guitar chanks)
for bar in range(4, 26, 4):
    for q in range(16):
        bt = bar + q * .25
        if bt >= 26: break
        place('drums', hat(jv(.55 if q % 2 == 0 else .32)), b(bt) + hum(2), .45, .25)
    for kbt in (0, 1.5, 2, 3.5):
        if bar + kbt < 26: place('drums', KK[int(kbt) % 2], b(bar + kbt), .95)
    for sbt in (1, 3):
        if bar + sbt < 26: place('drums', SN[sbt % 3], b(bar + sbt) + hum(3), .55)
for bt8 in range(4 * 2, 26 * 2):   # bass in 8ths with octave pops
    bt = bt8 / 2; r, q = a_chord(bt)[1:]
    m = broot(r) + (12 if bt8 % 4 == 3 else 0); kind = 'P' if bt8 % 4 == 3 else 'T'
    if bt8 % 8 in (0, 3, 4, 6, 7): place('bass', bass(m, b(.45), jv(.8), kind), b(bt), .55)
for bt in np.arange(4, 26, 1.0):
    r, q = a_chord(bt)[1:]
    if (bt % 4) in (1.0, 2.5 - .5, 3.0) or bt % 2 == 1.5:
        pass
    if bt % 4 in (0.0,): continue
    for m in chord(r, q, 66): place('keys', epiano(m, b(.35), .5), b(bt + .5) + hum(), .26, -.25 + (m % 5) * .1)
for bt in np.arange(4, 26, .5):    # chorus-y muted guitar chanks on the off-beats
    if (bt * 2) % 2 == 1:
        r, q = a_chord(bt)[1:]
        for m in chord(r, q, 58, 3): place('guitar', gtr(m, b(.2), .55, mute=True), b(bt) + hum(), .22, .45)
for bar in range(4, 26, 4):
    r, q = a_chord(bar)[1:]
    place('pad', sum(pad(m, b(4), .22) for m in chord(r, q, 62)), b(bar), .35)
# watch insert (b12): brass hit
for m in chord('Eb', '6', 70): place('lead', brass(m, .28, .85, 1.0), b(12) + hum(), .26, (m - 70) * .05)
# station wide (b15→b21): drums thin out to toms + rising pad (the world opens), groove back for S5 (b21)
# (handled by gain automation below)

# ———————————————— §B: kitten theme (D♭ major) ————————————————
B_CH = [(38, 'Db', 'M9'), (42, 'C', 'm7'), (46, 'Bb', 'm9'), (50, 'Eb', 'sus13'), (54, 'Ab', 'M9'), (58, 'Db', 'M9'), (62, 'Eb', 'sus13')]
for (bt, r, q), nx in zip(B_CH, B_CH[1:] + [(64, None, None)]):
    dur = b(nx[0] - bt)
    for i, m in enumerate(chord(r, q, 63, 5)): place('keys', epiano(m, dur * .9, .38), b(bt) + i * .025 + hum(), .32, -.3 + i * .15)
    if bt >= 42: place('bass', bass(broot(r, 33), dur * .8, .55, 'F'), b(bt), .45)
    if bt >= 46: place('pad', sum(pad(m, dur, .2) for m in chord(r, q, 66)), b(bt), .3)
MOTIF = [(40, 77, 1), (41, 75, 1), (42, 73, .5), (42.5, 72, .5), (43, 68, 2), (48, 75, 1), (49, 73, 1), (50, 72, 1), (51, 70, 2),
         (56, 77, 1), (57, 80, 1), (58, 77, 1), (59, 75, 1), (60, 73, 3)]
for bt, m, d in MOTIF: place('keys', epiano(m, b(d) * .95, .55), b(bt) + hum(), .3, .15)
place('keys', bell(85, 2.6, .25), b(63), .25, .3)   # under the clock jump (b64 is the clunk itself — sfx)
# the hum: one soft chord when the train is still there (b69.2)
for i, m in enumerate(chord('Ab', 'M9', 64, 5)): place('keys', epiano(m, 2.4, .42), b(69) + .2 + i * .03, .32, -.3 + i * .15)

# ———————————————— §C: return groove (A♭ major, soft) ————————————————
C_CH = [(70, 'Db', 'M9'), (74, 'Cm', None), (76, 'Bb', 'm9'), (80, 'Eb', '13'), (82, 'Ab', 'M9'), (86, 'Db', 'M9'), (88, 'Eb', 'sus13')]
C_CH = [(70, 'Db', 'M9'), (74, 'C', 'm7'), (78, 'Bb', 'm9'), (82, 'Eb', '13'), (86, 'Db', 'M9'), (88, 'Eb', 'sus13')]
def c_chord(bt):
    cur = C_CH[0]
    for c in C_CH:
        if bt >= c[0]: cur = c
    return cur
for q in np.arange(70, 90, .5):
    place('drums', hat(jv(.28 if q % 1 else .4)) * .8, b(q) + hum(3), .35, .3)
    if q % 2 == 0: place('drums', kick(.55), b(q), .6)
for bt in np.arange(70, 90, 1.0):
    r, qq = c_chord(bt)[1:]
    walk = [0, 7, 12, 10][int(bt) % 4]
    place('bass', bass(broot(r, 33) + (walk if walk < 12 else 12), b(.85), .55, 'F'), b(bt), .42)
    if bt % 2 == 1: [place('keys', epiano(m, b(.8), .36), b(bt) + .02 * i + hum(), .27, -.2 + i * .12) for i, m in enumerate(chord(r, qq, 64, 4))]
for bt in (70, 74, 78, 82, 86):
    r, qq = c_chord(bt)[1:]; place('pad', sum(pad(m, b(4), .18) for m in chord(r, qq, 64)), b(bt), .3)

# ———————————————— §D: chorus (A♭ major ballad) ————————————————
D_CH = [(90, 'Db', 'M9'), (94, 'C', 'm7'), (98, 'F', 'm9'), (102, 'Bb', 'm9'), (106, 'Eb', 'sus13'), (108, 'Eb', '13'), (110, 'Ab', 'M9')]
def d_chord(bt):
    cur = D_CH[0]
    for c in D_CH:
        if bt >= c[0]: cur = c
    return cur
for bar in range(90, 110, 4):
    for q in range(8):
        place('drums', hat(jv(.4 if q % 2 == 0 else .25)), b(bar + q * .5) + hum(2), .38, .25)
    place('drums', KK[0], b(bar), .85); place('drums', KK[1], b(bar + 2.5), .6)
    place('drums', SN[bar % 3], b(bar + 2) + hum(3), .6)          # half-time gated snare on beat 3
for bt in np.arange(90, 110, 1.0):
    r, qq = d_chord(bt)[1:]
    place('bass', bass(broot(r, 33) + (7 if bt % 4 == 3 else 0), b(.9), .7, 'T'), b(bt), .5)
    if bt % 2 == 0: [place('keys', epiano(m, b(1.8), .42), b(bt) + .02 * i + hum(), .28, -.25 + i * .12) for i, m in enumerate(chord(r, qq, 65, 5))]
for (bt, r, qq), nx in zip(D_CH, D_CH[1:] + [(119, None, None)]):
    place('pad', sum(pad(m, b(nx[0] - bt), .24) for m in chord(r, qq, 64)), b(bt), .38)
MEL = [(90, 75, 1.5), (91.5, 77, .5), (92, 80, 2), (94, 79, 1), (95, 77, .5), (95.5, 75, .5), (96, 72, 2),
       (98, 68, .5), (98.5, 72, .5), (99, 75, 1), (100, 79, 1.5), (101.5, 77, .5), (102, 73, 2), (104, 72, 1), (105, 70, 1),
       (106, 70, 1), (107, 72, 1), (108, 75, 1), (109, 79, 1), (110, 80, 4)]
for bt, m, d in MEL:   # sax-like lead: soft synth brass with breathy attack and late vibrato
    place('lead', brass(m, b(d) * .96, .62, .55, att=.05), b(bt) + hum(5), .34, .1)
    place('lead', lp(noise(int(.06 * SR)), 2500) * np.exp(-ts(int(.06 * SR)) / .02) * .08, b(bt), .3, .1)
# outro: AbM9 rings; bell arpeggio; final EP chord
for i, m in enumerate(chord('Ab', 'M9', 66, 5)): place('keys', epiano(m, b(8), .45), b(110) + i * .04, .32, -.3 + i * .15)
for k, m in enumerate([80, 75, 72, 79, 84, 87]): place('keys', bell(m, 3.0, .3), b(112 + k * .75), .3, -.4 + k * .16)
place('bass', bass(broot('Ab', 33), b(8), .6, 'F'), b(110), .5)

# ———————————————— mix the stems ————————————————
wet = np.stack([fftconvolve(sum(SEND.values()), IR[:, c])[:N] for c in range(2)], 1)
mix = sum(BUS.values()) + wet * .55
# section dynamics: §A thinner on the station wide (b15–b21), tape-stop brake at b25.4–b26, then silence until b38
def gain_curve(pts):
    tt = np.arange(N) / SR; return np.interp(tt, [p[0] for p in pts], [p[1] for p in pts])
g = gain_curve([(0, .8), (b(14.5), 1), (b(15), .78), (b(20.5), .78), (b(21), 1), (b(25.4), 1), (b(26), 0), (b(37.5), 0), (b(37.6), 1), (DUR, 1)])
mix *= g[:, None]
for k in BUS: BUS[k] *= g[:, None]
# tape-stop: re-read the last 0.6 s before b26 at a falling rate (pitch & speed drop to zero)
i0, i1 = int(b(25.4) * SR), int(b(26) * SR)
seg_src = (sum(BUS.values()) + wet * .55)[int(b(25.4) * SR) - 1:int(b(26.6) * SR)]
pos, out = 0.0, []
for i in range(i1 - i0):
    rate = max(0.0, 1 - (i / (i1 - i0)) ** .8)
    j = int(pos)
    out.append(seg_src[min(j, len(seg_src) - 1)] * (1 - i / (i1 - i0)) ** .3); pos += rate
mix[i0:i1] = np.array(out)
mix[i1:int(b(37.6) * SR)] *= 0
# silence #2 (b66.6–b69.2): everything except the EP chord that enters at b69.2
z0, z1 = int(b(66.6) * SR), int((b(69) + .18) * SR)
mix[z0:z1] *= np.linspace(1, 0, z1 - z0)[:, None] ** 3
peak = np.abs(mix).max(); mix = mix / peak * .89
os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
for k in BUS: sf.write(os.path.join(HERE, 'stems', f'{k}.wav'), (BUS[k] / peak * .89).astype(np.float32), SR, subtype='FLOAT')
json.dump({'bpm': BPM, 'cuts': {'splash_stab': b(1.5), 'groove': b(4), 'watch_hit': b(12), 'tape_stop': [b(25.4), b(26)], 'ep_in': b(38),
           'clock': b(64), 'hum_chord': b(69) + .2, 'return': b(70), 'chorus': b(90), 'resolve': b(110)}}, open(os.path.join(HERE, 'cues.json'), 'w'), indent=1)
print('score', DUR, 's, peak', peak)
