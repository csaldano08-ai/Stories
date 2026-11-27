// 048 · Pop Art — the first 10 s of "Last Train Home" as four whole-frame screen prints (lemo-opuscar styles/pop-art):
// red, yellow and blue plates screened in Ben-Day dots fixed to the paper, a black key plate, plates a hair off register.
// S1 opens with the style's dot pull (from coin-sized dots in the puddle out to the whole print) and her boot lands as a
// stamped splash; S2 is a lateral track along one long print of the night street, every footfall stamping a splash that stays
// on the sheet; it pushes into the round record of the RECORDS sign and match-cuts to the round dial of her watch (S3, a print
// with a paper label "23:58"); the watch print turns like a card (scale X through zero) onto the station tower print (S4),
// whose dial is stamped yellow on the chime while rings print outward and the camera starts down the sheet.
// No panels, balloons or sound words. Engine: engine/pop.js copied unchanged. Page contract: window.render(t), DUR, READY, RIGQA.
// Fonts: Barlow Semi Condensed Bold (headlines, OFL) and Inter Black (signs, OFL) stand in for the demo's Anton and Archivo Black.
import { createPop, T, rectPts, ellipsePts } from './engine/pop.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, hash, mulberry, TAU } from './shared/lib/util.js';

window.DUR = DUR;
const pop = createPop(document.getElementById('c'));
await Promise.all(['700 60px BarlowSC', '900 60px InterBlack'].map(f => document.fonts.load(f)));
const HEAD = 'BarlowSC', SIGN = 'InterBlack';
const W = 1920, H = 1080;

// ═════════ the run (shared by every style)
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const X = t => RUN.pelvisAt(t)[0];
function poseAt(t) {
  const S_ = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  const w = clamp(up, 0, 1.1) * (1 - dn); S_.watch = w;
  if (w > 0) { const J0 = solveProfile(S_), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S_.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S_.arms.f.sh *= 1 - .45 * wm; S_.head += .26 * wm; S_.neck += .08 * wm; }
  return S_;
}
// loose parts, pre-simulated at 240 Hz for determinism: the jacket hem and the ponytail chain
const SIM = (() => {
  const dt = 1 / 240, n = Math.ceil(11 / dt), flap = new Float32Array(n), tail = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  let a = .3, va = 0; const th = [-.2, -.1, 0], vt = [0, 0, 0];
  const py = t => RUN.pelvisAt(t)[1], ay = t => (py(t + dt) - 2 * py(t) + py(t - dt)) / (dt * dt);
  for (let i = 0; i < n; i++) {
    const t = -.5 + i * dt, A = ay(t), wv = clamp((t - EV.watchUp) / .3) * (1 - clamp((t - EV.watchDown) / .3));
    va += (-46 * (a - (.34 + .06 * wv)) - 5.5 * va + .011 * A) * dt; a += va * dt; flap[i] = a;
    for (let k = 0; k < 3; k++) { const par = k ? th[k - 1] : -.1, rest = .16 + .05 * k; vt[k] += (-60 * (th[k] - (par + rest)) - 6 * vt[k] + .014 * A * (k + 1) * .6) * dt; th[k] += vt[k] * dt; tail[k][i] = th[k]; }
  }
  const at = (arr, t) => arr[clamp(Math.round((t + .5) / dt), 0, n - 1)];
  return { flap: t => at(flap, t), tail: t => tail.map(a => at(a, t)) };
})();

// ═════════ inks and shapes
const I = {
  paper: T.white, red: T.red, yellow: T.yellow, blue: T.blue,
  night: { b: 1, r: .18 }, pave: { b: .62, r: .3 }, wall: { b: .42 }, dark: { r: .62, b: 1 }, trousers: { r: .55, b: 1 }, boots: { r: .85, b: 1, y: .25 },
  skin: T.skin, skinShade: T.skinShade, hair: { b: 1, r: .25 }, gold: { y: 1, r: .28 }, orange: T.orange, sleeveFar: { r: 1, b: .3 },
};
const cap = (a, b, r0, r1, n = 8) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, o = [];
  for (let i = 0; i <= n; i++) { const t = Math.PI / 2 + i / n * Math.PI; o.push([a[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * r0, a[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * r0]); }
  for (let i = 0; i <= n; i++) { const t = -Math.PI / 2 + i / n * Math.PI; o.push([b[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * r1, b[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * r1]); }
  o.push(o[0]); return o;
};
const closeP = p => [...p, p[0]];
const part = (pts, ink, lw) => { pop.fill(pts, ink); if (lw) pop.outline(pts, lw, { closed: true }); };
const E = (t, a, b) => ss(seg(t, a, b));
// a stamp: scale from 1.12 to 1 about a point, in the first 0.12 s
const stampK = (t, t0) => t < t0 ? 0 : 1 + .12 * (1 - eo(seg(t, t0, t0 + .12)));
function about(x, y, k, fn) { pop.save(); pop.translate(x, y); pop.scale(k, k); pop.translate(-x, -y); fn(); pop.restore(); }

// ═════════ AKI, printed: purple trousers, the red jacket (the subject colour), skin in red dots, blue hair; key lines over all
function drawAki(t, Wp, K, lw = 4.4) {
  const S_ = poseAt(t), J = solveProfile(S_), Wm = p => Wp(p), k = K;
  const legParts = kk => { const l = J.leg[kk], c = Math.cos(l.pitch), s = Math.sin(l.pitch), F = ([u, v]) => Wm([l.ankle[0] + u * c - v * s, l.ankle[1] + u * s + v * c]);
    return { thigh: cap(Wm(l.hip), Wm(l.knee), 25 * k, 19 * k), shin: cap(Wm(l.knee), Wm(l.ankle), 19 * k, 14 * k),
      boot: closeP([F([-16, -36]), F([17, -36]), F([19, -8]), F([46, -2]), F([72, 6]), F([74, 17]), F([-25, 17]), F([-29, 0])]), sole: [F([-26, 11]), F([73, 11])], lace: [F([2, -22]), F([20, -10])] }; };
  const armParts = kk => { const a = J.arm[kk], h = [a.wr[0] + (a.wr[0] - a.el[0]) * .2, a.wr[1] + (a.wr[1] - a.el[1]) * .2];
    return { up: cap(Wm(a.sh), Wm(a.el), 17 * k, 14 * k), fore: cap(Wm(a.el), Wm(a.wr), 14 * k, 12 * k), hand: cap(Wm(a.wr), Wm(h), 12 * k, 13 * k), a }; };
  const TT = (b, u, f) => Wm([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
  const hc = J.headC, HR = q => { const c = Math.cos(J.headA), s = Math.sin(J.headA); return Wm([hc[0] + q[0] * c - q[1] * s, hc[1] + q[0] * s + q[1] * c]); };
  // far side
  const af = armParts('f'); part(af.up, I.sleeveFar, lw); part(af.fore, I.sleeveFar, lw); part(af.hand, I.skinShade, lw * .8);
  const lf = legParts('f'); part(lf.thigh, I.dark, lw); part(lf.shin, I.dark, lw); part(lf.boot, I.boots, lw); pop.line(lf.sole, lw * .7, { taper: 0 });
  // ponytail behind the head
  const ta = SIM.tail(t); let ang = Math.PI - .25 + ta[0] + J.headA, p = HR([-50, -14]); const tp = [p];
  for (let i = 0; i < 3; i++) { const L = [46, 42, 36][i] * k; p = [p[0] + Math.cos(ang) * L, p[1] + Math.sin(ang) * L]; tp.push(p); ang += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
  for (let i = 2; i >= 0; i--) part(cap(tp[i], tp[i + 1], [15, 12, 9][i] * k, [12, 9, 4][i] * k), I.hair, lw * .85);
  // jacket and its hem
  const fa = SIM.flap(t), hb = TT(J.pelvis, -60, -56), hcs = Math.cos(fa + 1.75), hsn = Math.sin(fa + 1.75);
  const hem = closeP([TT(J.pelvis, -40, -50), TT(J.pelvis, -96, -58), [hb[0] + (hcs * 70 - hsn * 14) * k, hb[1] + (hsn * 70 + hcs * 14) * k], [hb[0] + (hcs * 64 + hsn * 10) * k, hb[1] + (hsn * 64 - hcs * 10) * k]]);
  part(hem, I.red, lw);
  const torso = closeP([TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)]);
  part(cap(Wm(J.neckBase), Wm(J.neckTop), 13 * k, 12 * k), I.skinShade, lw);
  part(torso, I.red, lw);
  pop.line([TT(J.neckBase, -4, 24), TT(J.waist, 0, 34), TT(J.pelvis, -92, 44)], lw * .6, { taper: .3 });             // the zip
  pop.line([TT(J.waist, -8, -40), TT(J.waist, -8, 34)], lw * .55, { taper: .4 });                                    // the belt seam
  // near leg
  const ln = legParts('n'); part(ln.thigh, I.trousers, lw); part(ln.shin, I.trousers, lw); part(ln.boot, I.boots, lw); pop.line(ln.sole, lw * .7, { taper: 0 }); pop.line(ln.lace, lw * .5, { taper: .3 });
  // head: skin in red dots, blue hair with key strands, the profile drawn by the key
  const head = closeP([[16, -44], [34, -20], [44, -3], [37, 8], [39, 16], [34, 23], [32, 35], [12, 46], [-10, 48], [-36, 38], [-50, 8], [-46, -26], [-22, -48]].map(HR));
  part(head, I.skin, lw);
  const hair = closeP([[22, -44], [0, -60], [-36, -54], [-58, -22], [-60, 12], [-46, 40], [-22, 44], [-10, 18], [-2, -14], [8, -32]].map(HR));
  part(hair, I.hair, lw);
  for (const [a, b] of [[[-4, -50], [-40, -30]], [[-14, -36], [-46, 6]], [[-18, -4], [-36, 30]]]) pop.line([HR(a), HR(b)], lw * .5, { taper: .4 });
  pop.fill(ellipsePts(...HR([25, -8]), 4.6 * k, 3.4 * k, 16), T.white); pop.black(ellipsePts(...HR([27, -8]), 2.6 * k, 2.6 * k, 12));
  pop.line([HR([16, -18]), HR([32, -18])], lw * .45, { taper: .4 });                                                 // brow
  pop.line([HR([30, 26]), HR([37, 25])], lw * .4, { taper: .4 });                                                    // mouth
  pop.over(ellipsePts(...HR([22, 12]), 9 * k, 6 * k, 16), I.skinShade);                                              // cheek: denser red dots
  // near arm, the watch on its wrist
  const an = armParts('n'); part(an.up, I.red, lw); part(an.fore, I.red, lw); part(an.hand, I.skin, lw * .8);
  const a = an.a, u = .82, wq = Wm([a.el[0] + (a.wr[0] - a.el[0]) * u, a.el[1] + (a.wr[1] - a.el[1]) * u]), d = Math.atan2(a.wr[1] - a.el[1], a.wr[0] - a.el[0]);
  pop.save(); pop.translate(wq[0], wq[1]); pop.rotate(d); part(rectPts(-7 * k, -15 * k, 14 * k, 30 * k), I.gold, lw * .6); pop.restore();
  return J;
}

// ═════════ S1 — the puddle (0–2.5): the dot pull, legs crossing, a stamped splash, rain on the print
const GY1 = 300, K1 = 2.2;
const W1 = p => [(p[0] - SPL.x) * K1, GY1 + p[1] * K1];
const PUD = (() => { const o = [], R = mulberry(4); for (let i = 0; i <= 64; i++) { const a = i / 64 * TAU, r = 1 + (Math.sin(a * 3 + 1) * .07 + Math.sin(a * 5 + 2) * .05); o.push([-60 + Math.cos(a) * 700 * r, GY1 + 40 + Math.sin(a) * 175 * r]); } return o; })();
const HZ = -40;                                                    // the foot of the shop front: the line the reflection hangs from
function cafeFront(refl) {
  const k = refl ? .6 : 1, lw = refl ? 3 : 5;
  const win = refl ? { y: .72, b: .25 } : I.yellow, wallI = refl ? { b: .7 } : I.wall, red = refl ? { r: .85, b: .3 } : I.red;
  part(rectPts(-1400, -900, 2800, 860), wallI, 0);
  part(rectPts(-880, -760, 1180, 690), win, lw);                                                 // the window
  pop.line([[-290, -760], [-290, -70]], lw * .9, { taper: 0 });
  part(rectPts(-920, -70, 1260, 30), refl ? { b: .9 } : I.blue, lw);                            // the sill
  // cups and a hanging lamp, in dots behind the glass
  for (let i = 0; i < 7; i++) part(rectPts(-820 + i * 150, -330, 70, 70), { r: .55, b: .5 }, lw * .7);
  part(rectPts(-880, -258, 1180, 16), { r: .6, b: .6 }, 0);
  pop.text('CAFE', -290, -170, { size: 150, font: HEAD, fill: red, outline: lw * 1.1, letter: 16 });
  // the door and its lightbox
  part(rectPts(380, -820, 420, 780), refl ? { b: .9, r: .3 } : I.dark, lw);
  part(rectPts(430, -360, 320, 170), red, lw);
  pop.text('24H', 590, -272, { size: 118, font: SIGN, fill: refl ? { y: .8, b: .2 } : I.yellow, outline: lw * .9 });
}
function shotS1(t) {
  // the dot pull: from inside the puddle's dots out to the whole print, then a slow lateral drift
  const zp = eio(seg(t, 0, .85)), zoom = Math.exp(lerp(Math.log(14), 0, zp));
  const cx = lerp(-240, -40 + 22 * t, ss(seg(t, 0, .85))), cy = lerp(300, 40, ss(seg(t, 0, .85)));
  pop.begin({ x: cx, y: cy, zoom });
  // pavement: wet asphalt in red and blue dots
  part(rectPts(-1600, HZ, 3200, 1200), I.pave, 0);
  cafeFront(false);
  // bokeh of the shop lights: big discs of yellow dots over the upper print
  for (const [x, y, r, d] of [[-700, -500, 120, .3], [-360, -620, 90, .25], [220, -560, 140, .22], [880, -460, 110, .3]]) pop.over(ellipsePts(x, y, r, r, 40), { y: d });
  pop.outline(rectPts(-1400, HZ, 2800, 1), 6);                                                     // the foot of the wall
  // the puddle: blue at 0.8 (round holes of paper), the shop front hanging upside down in it, cut into rippling bands
  const age = t - EV.splash;
  pop.save(); pop.clip(PUD);
  part(rectPts(-900, GY1 - 200, 1800, 500), { b: .82 }, 0);
  for (let b = 0; b < 18; b++) {
    const y0 = GY1 - 160 + b * 22, amp = 5 + (age > 0 ? 34 * Math.exp(-age * 2.4) * Math.max(0, Math.sin(b * .9 - age * 14)) : 0);
    pop.save(); pop.clip(rectPts(-1000, y0, 2000, 22)); pop.translate(Math.sin(b * 1.7 + t * 5) * amp, 0);
    pop.translate(0, 2 * (GY1 - 150) - HZ * .0); pop.scale(1, -.62); cafeFront(true); pop.restore();
  }
  // rain rings and, after the splash, its ripples
  for (let i = 0; i < 9; i++) { const R = mulberry(70 + i), per = .7 + R() * .4, a = (t + R() * per) % per, x = -560 + R() * 1000, y = GY1 - 40 + R() * 150;
    pop.outline(ellipsePts(x, y, 14 + a * 110, (14 + a * 110) * .28, 32), 3.2 * (1 - a / per) + .6, { closed: true }); }
  if (age > 0) for (let r = 0; r < 3; r++) { const rr = 40 + (age - r * .09) * 520; if (rr > 40 && rr < 900) pop.outline(ellipsePts(0, GY1 + 6, rr, rr * .27, 64), 6 * Math.exp(-age * 1.5), { closed: true }); }
  pop.restore();
  pop.outline(PUD, 6, { closed: true });
  // her legs (the frame holds her from the hips down)
  if (t > .35 && t < 1.95) drawAki(t, W1, K1, 7);
  // the splash, stamped on the beat: a paper crown with a key line, drops thrown in arcs
  if (age > 0 && age < 1.2) {
    const k = stampK(t, EV.splash), R = mulberry(9);
    about(0, GY1, k, () => {
      const h = 230 * Math.sin(Math.min(1, age / .32) * Math.PI / 2) * (1 - E(age, .45, .9) * .7);
      const crown = [[-200, GY1 + 20]]; for (let i = 0; i <= 10; i++) { const x = -190 + i * 38, tip = i % 2 ? h * (.55 + R() * .5) : h * .28; crown.push([x, GY1 - tip]); } crown.push([200, GY1 + 20], [-200, GY1 + 20]);
      if (h > 20) { part(crown, T.white, 6); pop.over(rectPts(-200, GY1 - 60, 400, 80), { b: .35 }); }
      for (let i = 0; i < 16; i++) { const vx = (R() - .5) * 900, vy = -500 - R() * 700, x = vx * age, y = GY1 - 80 + vy * age + 1800 * age * age, r = 9 + R() * 11; if (y < GY1 + 30) part(ellipsePts(x, y, r, r * 1.15, 14), T.white, 4); }
    });
  }
  // rain at three depths: key strokes falling across the print
  rain(t, -1500, 1500, -1000, 700, [[50, 2.2, 40], [40, 3.6, 70], [16, 6, 120]]);
  pop.present({ cell: 5.6, off: age > 0 && age < .14 ? [[0, 0], [6 * (1 - age / .14), -4 * (1 - age / .14)], [-5 * (1 - age / .14), 4 * (1 - age / .14)]] : undefined, offMax: 9 });
}
function rain(t, x0, x1, y0, y1, layers) {
  layers.forEach(([n, w, L], li) => { const R = mulberry(300 + li); for (let i = 0; i < n; i++) { const x = lerp(x0, x1, R()), ph = R(), sp = 1400 + li * 500, y = y0 + ((ph * (y1 - y0) + t * sp) % (y1 - y0));
    pop.line([[x, y], [x - L * .18, y + L]], w, { taper: .45 }); } });
}

// ═════════ S2 — the long street print (2.5–7.5): a lateral track along one sheet, every footfall stamped
const K2 = .9, GY2 = 900, X0 = X(2.5);
const W2 = p => [(p[0] - X0) * K2, GY2 + p[1] * K2];
const ax2 = t => W2([X(t), 0])[0];
const SHOPS = (() => {
  const words = ['NOODLES', 'BOOKS', 'BAR', 'PHARMACY', 'BAKERY', 'LAUNDRY', 'HOTEL', 'FLOWERS', 'RECORDS', 'CAFE', '24H'], o = []; let x = -1400; const R = mulberry(12);
  for (let i = 0; i < 12; i++) { const w = 760 + R() * 320; o.push({ x, w, word: words[(i + 10) % words.length], top: 170 + R() * 90, kind: i % 3 }); x += w; }
  return o;
})();
const REC = (() => { const S = SHOPS.find(s => s.word === 'RECORDS'); return { x: S.x + S.w * .5, y: 330, r: 80 }; })();
function streetPrint(t) {
  // night sky, a far skyline in dark dots, the moon kept out (the street lamps are the light)
  part(rectPts(-2000, -900, 14000, 1300), I.night, 0);
  const R = mulberry(40); let x = -2000; while (x < 12000) { const w = 220 + R() * 260, h = 120 + R() * 170; part(rectPts(x, 260 - h, w, h + 40), I.dark, 0); if (R() < .6) for (let j = 0; j < 3; j++) part(rectPts(x + 30 + j * 60, 290 - h, 22, 30), I.yellow, 0); x += w; }
  for (const S of SHOPS) {
    const { x, w, top } = S;
    part(rectPts(x, top, w, GY2 - top), T.white, 0);                                                // the facade: paper
    for (let yy = top + 46; yy < GY2 - 20; yy += 46) pop.line([[x + 8, yy], [x + w - 8, yy]], 1.6, { taper: 0 });   // courses, in the key
    // fascia board, its word printed in yellow on blue, key outlined
    part(rectPts(x + 40, top + 40, w - 80, 120), I.blue, 5);
    pop.text(S.word, x + w / 2, top + 101, { size: S.word.length > 6 ? 78 : 92, font: SIGN, fill: I.yellow, outline: 4, letter: 6 });
    // awning stripes
    for (let i = 0; i < Math.floor((w - 80) / 60); i++) part(closeP([[x + 40 + i * 60, top + 180], [x + 100 + i * 60, top + 180], [x + 92 + i * 60, top + 236], [x + 48 + i * 60, top + 236]]), i % 2 ? T.white : I.red, 3);
    // the lit window (yellow, flat) with its goods in dots, and the door
    const wx0 = x + 60, wx1 = x + w - 300, wy0 = top + 280, wy1 = GY2 - 110;
    part(rectPts(wx0, wy0, wx1 - wx0, wy1 - wy0), I.yellow, 6);
    const RR = mulberry(Math.round(x));
    if (S.kind === 0) for (let i = 0; i < 6; i++) part(ellipsePts(wx0 + 50 + i * (wx1 - wx0 - 100) / 5, wy1 - 70, 34, 24, 18), I.orange, 3);
    else if (S.kind === 1) for (let i = 0; i < 9; i++) part(rectPts(wx0 + 30 + i * (wx1 - wx0 - 60) / 9, wy1 - 150 - RR() * 60, 26, 150 + RR() * 60), i % 2 ? { r: .6 } : { b: .6 }, 3);
    else for (let i = 0; i < 4; i++) part(ellipsePts(wx0 + 70 + i * (wx1 - wx0 - 140) / 3, wy0 + 120, 40, 40, 20), { r: .45, b: .2 }, 3);
    pop.line([[(wx0 + wx1) / 2, wy0], [(wx0 + wx1) / 2, wy1]], 5, { taper: 0 });
    part(rectPts(x + w - 230, wy0 - 40, 170, GY2 - wy0 + 40), I.dark, 5);
    part(rectPts(x + w - 205, wy0, 120, 200), { b: .3 }, 3);
    pop.outline(rectPts(x, top, w, GY2 - top), 6, { closed: true });
  }
  // the record that hangs from the RECORDS shop: a blue disc with grooves, a red label (the push ends inside it)
  pop.line([[REC.x, SHOPS.find(s => s.word === 'RECORDS').top + 170], [REC.x, REC.y - REC.r]], 5, { taper: 0 });
  part(ellipsePts(REC.x, REC.y, REC.r, REC.r, 48), I.blue, 6);
  for (let i = 1; i < 6; i++) pop.outline(ellipsePts(REC.x, REC.y, REC.r * (.42 + i * .1), REC.r * (.42 + i * .1), 48), 1.4, { closed: true });
  part(ellipsePts(REC.x, REC.y, REC.r * .34, REC.r * .34, 32), I.red, 3); part(ellipsePts(REC.x, REC.y, 5, 5, 12), T.white, 2);
  // the pavement: wet blue dots with the windows' light falling into it as yellow dot columns
  part(rectPts(-2000, GY2, 14000, 500), I.pave, 0);
  for (const S of SHOPS) pop.over(rectPts(S.x + 70, GY2 + 10, S.w - 380, 360), { y: .48 });
  pop.outline(rectPts(-2000, GY2, 14000, 0), 6);
  for (let x = -1200; x < 11000; x += 1500) {                                                       // lamp posts
    part(rectPts(x - 12, 260, 24, GY2 - 260), I.blue, 4); part(ellipsePts(x, 236, 40, 40, 24), I.yellow, 5); part(rectPts(x - 30, GY2 - 30, 60, 30), I.blue, 4);
  }
}
function shotS2(t) {
  // track with her; from 7.15 push into the record (logarithmic), so its disc fills the watch's place at the cut
  const base = { x: ax2(t) + 140, y: 470, zoom: 1 };
  const pu = eio(seg(t, 7.15, 7.5)), zEnd = 340 / REC.r;
  const cam = pu > 0 ? { x: lerp(base.x, REC.x, pu), y: lerp(base.y, REC.y, pu), zoom: Math.exp(lerp(0, Math.log(zEnd), pu)) } : base;
  pop.begin(cam);
  streetPrint(t);
  // every footfall after 2.5 s stamps a splash that stays on the sheet
  for (const c of RUN.contacts) { if (c.t0 < 2.45 || c.t0 > t) continue; const x = (c.x - X0) * K2 + 20, k = stampK(t, c.t0), R = mulberry(Math.round(c.t0 * 100));
    about(x, GY2, k, () => { const cr = [[-70, GY2 + 6]]; for (let i = 0; i <= 6; i++) cr.push([-64 + i * 21, GY2 - (i % 2 ? 40 + R() * 26 : 12)]); cr.push([70, GY2 + 6], [-70, GY2 + 6]); part(cr, T.white, 3.5);
      for (let i = 0; i < 4; i++) part(ellipsePts(x + (R() - .5) * 150, GY2 - 60 - R() * 50, 7, 8, 10), T.white, 2.5); }); }
  drawAki(t, W2, K2, 4.6);
  rain(t, cam.x - 1400, cam.x + 1400, -200, 1100, [[40, 1.6, 34], [30, 2.6, 56]]);
  pop.present({ cell: 5.6 });
}

// ═════════ S3 — the watch print (7.5–9.375): forearm and gold watch, the street streaming behind, a paper label "23:58"
const AH = -Math.PI / 2 + (11 + 58 / 60) / 12 * TAU, AMN = -Math.PI / 2 + 58 / 60 * TAU;
function watchPrint(t) {
  // ground: blue; the lights of the street run past as long bars of yellow and orange dots
  part(rectPts(-1400, -900, 2800, 1800), I.blue, 0);
  const R = mulberry(5);
  for (let i = 0; i < 16; i++) { const y = -560 + i * 74 + R() * 20, h = 16 + R() * 22, L = 300 + R() * 700, sp = 1800 + R() * 900, x = 1300 - ((R() * 3000 + (t - 7.5) * sp) % 3200);
    pop.fill(rectPts(x, y, L, h), R() < .7 ? { y: .75 } : { y: .85, r: .45 }); pop.outline(rectPts(x, y, L, h), 2.4, { closed: true }); }
  // the forearm, rising from the lower left; the red sleeve big and flat (the subject colour), skin in red dots
  const ang = -.31, ax = [Math.cos(ang), Math.sin(ang)], nr = [-ax[1], ax[0]], at = (s, o) => [ax[0] * s + nr[0] * o, ax[1] * s + nr[1] * o];
  const hw = s => s < 0 ? lerp(205, 230, clamp(-s / 1000)) : 205;
  const top = [], bot = []; for (let s = -1300; s <= 440; s += 40) { top.push(at(s, -hw(s))); bot.push(at(s, hw(s))); }
  const arm = closeP([...top, at(470, -150), at(480, -40), at(470, 80), at(440, 170), ...bot.reverse()]);
  part(arm, I.skin, 7);
  pop.over(closeP([at(-1300, 90), at(420, 90), at(420, 205), at(-1300, 230)]), I.skinShade);                       // shade under the arm
  // the hand's curled fingers and thumb
  [[-120, 34], [-40, 36], [40, 36], [120, 33]].forEach(([o, r]) => { const k0 = at(430, o), k1 = at(530, o + 40), k2 = at(500, o + 120); part(cap(k0, k1, r, r * .92), I.skin, 6); part(cap(k1, k2, r * .9, r * .82), I.skin, 6); });
  part(cap(at(230, -215), at(380, -235), 40, 36), I.skin, 6);
  const cuff = closeP([at(-1400, -260), at(-560, -250), at(-540, -80), at(-560, 110), at(-590, 260), at(-1400, 270)]);
  part(cuff, I.red, 7); pop.line([at(-600, -230), at(-580, 230)], 4, { taper: .3 });
  // the strap: blue with key stitches
  const strap = closeP([at(-110, -235), at(110, -235), at(110, 235), at(-110, 235)]);
  part(strap, I.dark, 6); for (let i = -4; i <= 4; i++) for (const e of [-86, 86]) pop.line([at(e, i * 50), at(e, i * 50 + 22)], 3, { taper: 0 });
  // the case: gold (yellow with red dots), lugs, crown; the dial: paper, condensed numerals in the key
  pop.save(); pop.rotate(ang);                                                         // 12 o'clock along the strap, the crown toward the hand
  for (const sy of [-1, 1]) part(rectPts(-110, sy > 0 ? 240 : -310, 220, 70), I.gold, 6);
  part(rectPts(330, -36, 46, 72), I.gold, 5);
  part(ellipsePts(0, 0, 340, 340, 72), I.gold, 8);
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU; pop.line([[Math.cos(a) * 318, Math.sin(a) * 318], [Math.cos(a) * 338, Math.sin(a) * 338]], 3.2, { taper: 0 }); }
  part(ellipsePts(0, 0, 298, 298, 72), T.white, 6);
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, r0 = i % 5 ? 262 : 236; pop.line([[Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a) * 286, Math.sin(a) * 286]], i % 5 ? 3 : 9, { taper: 0 }); }
  [['12', -Math.PI / 2], ['3', 0], ['6', Math.PI / 2], ['9', Math.PI]].forEach(([s, a]) => pop.text(s, Math.cos(a) * 180, Math.sin(a) * 180 + 6, { size: 104, font: HEAD }));
  // hands: 23:58; the second hand ticks once a second (47 → 48 at 8.4 s)
  const sec = 47 + (t >= 8.4 ? 1 : 0) + (t >= 9.4 ? 1 : 0), kick = t >= 8.4 ? Math.exp(-(t - 8.4) * 30) * .06 : 0;
  const hand = (a, L, w, tail) => { const c = Math.cos(a), s = Math.sin(a), n = [-s, c]; pop.black(closeP([[-c * tail + n[0] * w, -s * tail + n[1] * w], [c * L + n[0] * w * .3, s * L + n[1] * w * .3], [c * L - n[0] * w * .3, s * L - n[1] * w * .3], [-c * tail - n[0] * w, -s * tail - n[1] * w]])); };
  hand(AH, 150, 15, 30); hand(AMN, 236, 10, 30); hand(-Math.PI / 2 + sec / 60 * TAU + kick, 262, 3.5, 60);
  part(ellipsePts(0, 0, 18, 18, 16), I.red, 4);
  // rain on the crystal: paper drops with a key line and blue dots in their shade
  for (const [x, y, r] of [[-140, 90, 26], [120, -150, 18], [60, 170, 15], [190, 40, 22], [-200, -110, 13]]) { part(ellipsePts(x, y, r, r * 1.1, 20), T.white, 3.4); pop.over(ellipsePts(x + r * .25, y + r * .3, r * .6, r * .5, 14), { b: .4 }); }
  if (t >= 8.1) { const k = stampK(t, 8.1); about(-40, -60, k, () => { part(ellipsePts(-40, -60, 30, 33, 20), T.white, 3.6); pop.over(ellipsePts(-32, -50, 18, 15, 14), { b: .4 }); }); }
  pop.restore();
}
function label(t, t0, t1, text) {
  if (t < t0 || t > t1 + .36) return;
  const p = seg(t, t0, t0 + .5), e = eo(seg(p, 0, .55)), ex = t > t1 ? -ei(seg(t, t1, t1 + .35)) * 1400 : 0;
  const x = -860 + ex, y = -470, w = 360, h = 150;
  pop.save(); pop.translate(x + w / 2, y + h / 2); pop.rotate(-.035); pop.translate(-(x + w / 2), -(y + h / 2));
  pop.fill(rectPts(x + 14 + (1 - e) * -70, y + 14 + (1 - e) * 30, w, h), I.red);
  pop.fill(rectPts(x + (1 - e) * 50, y - (1 - e) * 26, w, h), T.white);
  if (p > .3) pop.outline(rectPts(x, y, w, h), 5, { closed: true });
  if (p > .35) { const ke = eo(seg(p, .35, .85)); pop.text(text, x + 34 + (1 - ke) * 26, y + h / 2 + 2, { size: 120, font: HEAD, align: 'left', letter: 4 }); }
  pop.restore();
}

// ═════════ S4 — the station tower (9.375–10): turned onto like a card; the dial stamped yellow on the chime, rings printed out
function towerPrint(t) {
  part(rectPts(-1000, -1000, 2000, 2000), I.night, 0);
  // clouds: paper, key-lined, blue dots under them, yellow dots where the city lights them
  for (const [x, y, s] of [[-560, -760, 1.1], [520, -820, .9], [-120, -560, .7], [700, -480, .8]]) {
    const c = [[x - 300 * s, y]], nb = 5; for (let b = 0; b < nb; b++) { const bx = x - 300 * s + (b + .5) * 600 * s / nb, br = 60 * s * (1 + .5 * Math.sin(b * 2.1 + x)) + (b === 2 ? 40 * s : 0);
      for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI; c.push([bx + Math.cos(a) * 600 * s / nb * .62, y - br * .4 + Math.sin(a) * br]); } } c.push([x + 300 * s, y], [x - 300 * s, y]);
    part(c, T.white, 6); pop.over(rectPts(x - 300 * s, y - 40 * s, 600 * s, 40 * s), { b: .35 }); pop.over(rectPts(x - 300 * s, y - 14 * s, 600 * s, 14 * s), { y: .5 }); }
  // stars in yellow dots
  const R = mulberry(77); for (let i = 0; i < 26; i++) { const x = -950 + R() * 1900, y = -980 + R() * 520, r = 4 + R() * 6; part(ellipsePts(x, y, r, r, 10), I.yellow, 0); }
  // the tower: paper with courses in the key, a red roof, the dial
  const TX = 140;
  part(closeP([[TX - 170, -660], [TX + 170, -660], [TX, -900]]), I.red, 7);
  part(rectPts(TX - 190, -660, 380, 1700), T.white, 7);
  for (let y = -620; y < 900; y += 52) pop.line([[TX - 182, y], [TX + 182, y]], 1.8, { taper: 0 });
  for (let y = -200; y < 900; y += 220) for (const dx of [-90, 90]) part(rectPts(TX + dx - 32, y, 64, 110), I.dark, 4);
  const ch = t - EV.chime, k = stampK(t, EV.chime);
  about(TX, -420, ch >= 0 ? k : 1, () => {
    part(ellipsePts(TX, -420, 150, 150, 60), ch >= 0 ? I.yellow : T.white, 8);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; pop.line([[TX + Math.cos(a) * 118, -420 + Math.sin(a) * 118], [TX + Math.cos(a) * 140, -420 + Math.sin(a) * 140]], i % 3 ? 5 : 11, { taper: 0 }); }
    const hand = (a, L, w) => { const c = Math.cos(a), s = Math.sin(a), n = [-s, c]; pop.black(closeP([[TX + n[0] * w, -420 + n[1] * w], [TX + c * L + n[0] * w * .3, -420 + s * L + n[1] * w * .3], [TX + c * L - n[0] * w * .3, -420 + s * L - n[1] * w * .3], [TX - n[0] * w, -420 - n[1] * w]])); };
    hand(AH, 80, 10); hand(AMN, 120, 7); part(ellipsePts(TX, -420, 12, 12, 12), I.red, 3);
  });
  // rings printed out from the dial on the chime: key circles, each with a band of yellow dots
  for (let r = 0; r < 3; r++) { const a = ch - r * .09; if (a < 0) continue; const rr = 190 + a * 900; if (rr > 1400) continue;
    pop.over(closeP([...ellipsePts(TX, -420, rr + 18, rr + 18, 80), ...ellipsePts(TX, -420, rr, rr, 80).reverse()]), { y: .55 });
    pop.outline(ellipsePts(TX, -420, rr, rr, 80), 6, { closed: true }); }
  // the city's roofs below: the same block printed again and again, each a little off
  for (let i = 0; i < 9; i++) { const x = -1000 + i * 230, RR = mulberry(500 + i), y = -60 + (i % 2) * 60 + RR() * 20;
    if (Math.abs(x + 115 - TX) < 260) continue;
    pop.save(); pop.translate((RR() - .5) * 6, 0);
    part(rectPts(x + 10, y, 210, 1000), { r: .5, b: .95 }, 6);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) part(rectPts(x + 38 + c * 60, y + 40 + r * 90, 34, 50), (r + c + i) % 3 ? I.yellow : I.dark, 3);
    pop.restore(); }
}
function shotS3S4(t) {
  // the card turn: 9.30–9.375 the watch print narrows to nothing, 9.375–9.45 the tower print opens; the desk shows around it
  const turn = t < 9.375 ? 1 - eo(seg(t, 9.3, 9.375)) : eo(seg(t, 9.375, 9.45));
  const S3 = t < 9.375;
  const bob = S3 ? 10 * Math.sin((t - EV.splash) * TAU * CADENCE / 2) : 0;
  const cam = S3 ? { x: -20 * (t - 7.5), y: bob, zoom: lerp(1, 1.06, seg(t, 7.5, 9.375)) } : { x: 0, y: lerp(-380, -250, eio(seg(t, 9.375, 10.6))), zoom: 1 };
  pop.begin(cam, { desk: '#1d2330' });
  const cx = cam.x, cy = cam.y;
  pop.save(); pop.translate(cx, 0); pop.scale(Math.max(.002, turn), 1); pop.translate(-cx, 0);
  const sheet = S3 ? rectPts(cx - 980, cy - 560, 1960, 1120) : rectPts(-980, -1000, 1960, 2000);
  pop.clip(sheet);
  if (S3) { watchPrint(t); label(t, 7.62, 9.2, '23:58'); } else towerPrint(t);
  pop.restore();
  if (turn < .999) pop.save(), pop.translate(cx, 0), pop.scale(Math.max(.002, turn), 1), pop.translate(-cx, 0), pop.outline(sheet, 6, { closed: true }), pop.restore();
  rain(t, cx - 1100, cx + 1100, cy - 700, cy + 700, S3 ? [[24, 2.4, 50]] : [[40, 1.8, 40], [20, 3, 70]]);
  const ch = t - EV.chime;
  pop.present({ cell: 5.6, off: !S3 && ch > 0 && ch < .14 ? [[0, 0], [7 * (1 - ch / .14), -5 * (1 - ch / .14)], [-6 * (1 - ch / .14), 5 * (1 - ch / .14)]] : undefined, offMax: 10 });
}

window.render = t => {
  if (t < 2.5) shotS1(t);
  else if (t < 7.5) shotS2(t);
  else shotS3S4(t);
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0);
window.READY = true;
