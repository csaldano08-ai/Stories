// 014 · Watercolor — the first 10 s of "Last Train Home" painted on one sheet of warm fibrous paper (lemo-opuscar
// styles/watercolor): everything is brush strokes (ribbons at partial opacity + bristle tracks breaking into dry-brush
// dashes), washes painted in 3 jittered passes, paper as the white (lit windows are unpainted paper under a warm glaze),
// things paint themselves in, a hand-written annotation layer, brush-edge wipes instead of cuts, one accent (vermilion:
// AKI's coat). Uses the demo engine's globals (mk, drawS, drawList, withSeed, qcurve, rgba, mixc, rnd, sprite).
// Page contract: window.render(t), DUR, READY, RIGQA, TEXTS.
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { lerp, seg, ss, eio, eo, back, hash, clamp } from './shared/lib/util.js';

const W = 1920, H = 1080, cv = document.getElementById('c'), ctx = cv.getContext('2d', { willReadFrequently: true });
const PAP = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'paper.jpg'; });
await Promise.all(['500 40px Caveat', '400 20px "IBM Plex Mono"'].map(f => document.fonts.load(f)));
const C = { ink: '#2b2520', indigo: '#2f4f7f', deep: '#22385e', grey: '#56708c', rain: '#7f98b8', glaze: '#eaa848', ochre: '#c8913a', coat: '#c8442a', coatD: '#9a3020', plum: '#5a3a5c', skin: '#e8b89a', trou: '#3d3a48', boot: '#6b4430', brick: '#9a6a58', sage: '#7f8a6a' };
const TAU = Math.PI * 2;
const GRAN = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(20,16,30,${(.08 + hash(i * 1.7) * .25).toFixed(3)})`; x.beginPath(); x.arc(hash(i * 3.1) * 256, hash(i * 5.3) * 256, .5 + hash(i * 7.7) * 1.4, 0, TAU); x.fill(); } return c; })();
function blob(cx, cy, r, seed, ry = r) { const pts = []; for (let i = 0; i < 36; i++) { const a = i / 36 * TAU, k = .78 + .34 * (Math.sin(a * 2 + seed) * .5 + Math.sin(a * 5 + seed * 1.7) * .3 + Math.sin(a * 9 + seed * 2.3) * .2); pts.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * ry * k]); } return pts; }
const OFF = [0, 1].map(() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; });

// ——— the run (shared rig) ———
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
function poseAt(t, raise = false) {
  const S = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  let w = clamp(up, 0, 1.1) * (1 - dn); if (raise) w = 1; S.watch = w;
  if (w > 0) { const J0 = solveProfile(S), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S.arms.f.sh *= 1 - .45 * wm; S.head += .26 * wm; S.neck += .08 * wm; }
  return S;
}
function washPoly(c, pts, fill, a, passes = 3, jit = 5, seed = 1) {
  withSeed(seed, () => { for (let p = 0; p < passes; p++) { c.beginPath(); pts.forEach(([x, y], i) => { const yy = y + (i % 3 === 0 ? rnd(-jit, jit) : 0), xx = x + (i % 4 === 1 ? rnd(-jit, jit) : 0); i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }); c.closePath(); c.globalAlpha = a / passes * 1.6; c.fillStyle = fill; c.fill(); } });
  c.globalAlpha = 1;
}
function strokeWash(c, x, y, w, h, col, a, seed, p = 1, o = {}) {   // a wet wash: graded (pigment settles low), 3 jittered passes, soft backrun blooms, one pooled edge
  if (p <= 0) return;
  withSeed(seed, () => {
    c.save();
    if (p < 1) { c.beginPath(); c.moveTo(x - 20, y - 20); const ex = x - 20 + (w + 40) * eo(p); for (let yy = y - 20; yy <= y + h + 20; yy += 16) c.lineTo(ex + Math.sin(yy * .05 + seed) * 14, yy); c.lineTo(x - 20, y + h + 20); c.closePath(); c.clip(); }
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, mixc(col, PAPER, o.top ?? .3)); g.addColorStop(1, col);
    for (let pass = 0; pass < 3; pass++) { c.beginPath(); const n = 6; for (let i = 0; i <= n; i++) c.lineTo(x + w * i / n + rnd(-3, 3), y + rnd(-4, 4)); for (let i = 0; i <= n; i++) c.lineTo(x + w + rnd(-4, 4), y + h * i / n); for (let i = n; i >= 0; i--) c.lineTo(x + w * i / n + rnd(-3, 3), y + h + rnd(-3, 3)); for (let i = n; i >= 0; i--) c.lineTo(x + rnd(-4, 4), y + h * i / n); c.closePath(); c.globalAlpha = a / 3 * 1.5; c.fillStyle = g; c.fill(); }
    // pooled wet edge: pigment collects where the wash dried
    c.globalAlpha = Math.min(1, a * .55); c.strokeStyle = mixc(col, '#2b2520', .25); c.lineWidth = 2.2; c.stroke();
    // granulation inside the wash, and backruns: irregular paper-coloured blooms with a darker rim
    c.save(); c.clip(); c.globalAlpha = a * .5; c.fillStyle = c.createPattern(GRAN, 'repeat'); c.fillRect(x - 20, y - 20, w + 40, h + 40);
    for (let k = 0; k < (w * h > 400000 ? 1 : 0); k++) { const bp = blob(x + rnd(.15, .85) * w, y + rnd(.2, .9) * h, Math.min(w, h) * rnd(.12, .3), seed * 7 + k);
      c.beginPath(); bp.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); c.closePath(); c.globalAlpha = .1; c.fillStyle = PAPER; c.fill(); c.globalAlpha = a * .22; c.strokeStyle = mixc(col, '#2b2520', .2); c.lineWidth = 1.6; c.stroke(); }
    c.restore();
    c.globalAlpha = 1;
    if (o.edge !== false) { drawS(c, mk(qcurve(x + 2, y + h - 1, x + w - 2, y + h + 1, rnd(-3, 3), 10), 4.5, mixc(col, '#2b2520', .45), { prof: 'even', nb: 0, a: a * .8, rough: .4 }), 1); drawS(c, mk(qcurve(x + w - 1, y + 2, x + w + 1, y + h - 2, rnd(-3, 3), 8), 3.5, mixc(col, '#2b2520', .35), { prof: 'even', nb: 0, a: a * .55, rough: .4 }), 1); }
    c.restore();
  });
}
const rectP = (x, y, w, h) => [[x, y], [x + w * .5, y - 2], [x + w, y], [x + w + 2, y + h * .5], [x + w, y + h], [x + w * .5, y + h + 2], [x, y + h], [x - 2, y + h * .5]];
function hand(c, txt, x, y, p, o = {}) {   // hand note revealed left to right like writing, drawn twice over a paper halo
  if (p <= 0) return; c.save(); c.font = `${o.w || 500} ${o.size || 40}px Caveat`; c.textBaseline = 'middle'; const w = c.measureText(txt).width;
  c.beginPath(); c.rect(x - 6, y - 50, (w + 12) * eo(p), 100); c.clip(); c.shadowColor = rgba(PAPER, .95); c.shadowBlur = 12; c.fillStyle = rgba(o.col || C.ink, o.a ?? .9); c.fillText(txt, x, y); c.fillText(txt, x, y); c.restore();
}
function leader(c, x0, y0, x1, y1, p, bend = 20) { if (p <= 0) return; const pts = qcurve(x0, y0, x1, y1, bend, 16), m = Math.max(1, Math.round(16 * clamp(p))); c.beginPath(); for (let i = 0; i <= m; i++) i ? c.lineTo(...pts[i]) : c.moveTo(...pts[i]); c.strokeStyle = rgba(C.ink, .75); c.lineWidth = 1.8; c.lineCap = 'round'; c.stroke(); if (p >= 1) { c.beginPath(); c.arc(x1, y1, 3.5, 0, TAU); c.fillStyle = rgba(C.ink, .75); c.fill(); } }
function mono(c, txt, x, y, a) { c.save(); c.globalAlpha = a; c.font = '400 20px "IBM Plex Mono"'; c.letterSpacing = '4px'; c.fillStyle = C.ink; c.fillText(txt, x, y); c.restore(); }

// ——— AKI painted from the rig: limb strokes (fixed seeds, so the bristles keep their pattern), a coat wash, a head wash, hair strokes ———
function paintAki(c, J, ox, oy, s, o = {}) {
  const P = p => [ox + p[0] * s, oy + p[1] * s], k = s / .8;
  withSeed(4100, () => {
    const L = (a, b, w, col, seed, prof = 'even') => withSeed(seed, () => drawS(c, mk(qcurve(...P(a), ...P(b), 0, 6), w * k, col, { prof, a: .9, rough: .18 }), 1));
    const A = J.arm.f; L(A.sh, A.el, 26, mixc(C.coatD, C.indigo, .3), 11); L(A.el, A.wr, 22, mixc(C.coatD, C.indigo, .3), 12);
    for (const [kk, col, sd] of [['f', mixc(C.trou, C.indigo, .4), 20], ['n', C.trou, 30]]) { const l = J.leg[kk]; L(l.hip, l.knee, 34, col, sd); L(l.knee, l.ankle, 28, col, sd + 1);
      const an = P(l.ankle), bl = P(l.ball); withSeed(sd + 2, () => drawS(c, mk(qcurve(an[0] - 6 * k, an[1], bl[0] + 14 * k, bl[1] + 4 * k, -4, 5), 18 * k, C.boot, { prof: 'even', a: .95 }), 1)); }
    // coat: a wash shape between shoulders and the flared hem, then two vermilion strokes for the folds, the dark side edge
    const uL = J.uL, fL = J.fL, nb = J.neckBase, pv = J.pelvis, hb = o.hemB || [0, 0];
    const T = (b, up, fw) => P([b[0] + uL[0] * up + fL[0] * fw, b[1] + uL[1] * up + fL[1] * fw]);
    const coat = [T(nb, -2, 14), T(nb, 0, -14), T(nb, -16, -30), T(J.waist, 0, -32), [...T(pv, -74, -40)].map((v, i) => v + hb[i] * s * .6), T(pv, -78, 38), T(J.waist, 0, 26), T(nb, -42, 30)];
    washPoly(c, coat, C.coat, .9, 3, 3 * k, 4200);
    withSeed(4210, () => { drawS(c, mk([T(nb, -10, -24), T(J.waist, 0, -28), T(pv, -60, -34)], 14 * k, C.coatD, { prof: 'tip', a: .75 }), 1); drawS(c, mk([T(J.waist, 4, -30), T(J.waist, 4, 24)], 7 * k, C.coatD, { prof: 'even', a: .8, nb: 0 }), 1); });
    // neck, cream collar, head wash, hair
    const nt = P(J.neckTop), nbp = P(nb); L(nb, J.neckTop, 18, C.skin, 40);
    withSeed(41, () => drawS(c, mk(qcurve(nbp[0] - 16 * k, nbp[1], nbp[0] + 16 * k, nbp[1], -3, 5), 12 * k, '#efe2c8', { prof: 'even', a: .9 }), 1));
    const hc = P(J.headC); c.save(); c.translate(hc[0], hc[1] - 6 * k); c.rotate(J.headA);
    washPoly(c, [[-34 * k, -36 * k], [10 * k, -46 * k], [40 * k, -24 * k], [46 * k, 2 * k], [34 * k, 32 * k], [6 * k, 40 * k], [-24 * k, 30 * k], [-38 * k, 0]], C.skin, .9, 3, 2 * k, 4300);
    withSeed(4310, () => { for (let i = 0; i < 7; i++) { const a = -2.6 + i * .32; drawS(c, mk(qcurve(Math.cos(a) * 44 * k + 6 * k, Math.sin(a) * 44 * k, -40 * k + i * 3 * k + (o.hairLag?.[0] || 0) * .08 * k, 30 * k + i * 2 * k, -14 * k, 6), 16 * k, C.plum, { prof: 'leaf', a: .85 }), 1); }
      drawS(c, mk(qcurve(10 * k, -44 * k, 44 * k, -22 * k, 6 * k, 5), 14 * k, C.plum, { prof: 'tip', a: .9 }), 1); });
    c.fillStyle = rgba(C.ink, .85); c.beginPath(); c.ellipse(26 * k, -6 * k, 3.4 * k, (o.blink ? .8 : 4.2) * k, 0, 0, TAU); c.fill();
    c.strokeStyle = rgba(C.ink, .7); c.lineWidth = 2.2 * k; c.beginPath(); c.moveTo(20 * k, -18 * k); c.quadraticCurveTo(28 * k, -22 * k, 36 * k, -17 * k); c.stroke();
    c.fillStyle = rgba('#d98a7a', .45); c.beginPath(); c.ellipse(20 * k, 10 * k, 8 * k, 5 * k, 0, 0, TAU); c.fill();
    c.restore();
    const An = J.arm.n; L(An.sh, An.el, 28, C.coat, 50); L(An.el, An.wr, 24, C.coat, 51);
    const wr = P(An.wr); c.fillStyle = rgba(C.skin, .92); c.beginPath(); c.arc(wr[0] + 4 * k, wr[1] + 4 * k, 11 * k, 0, TAU); c.fill();
    if ((o.watch || 0) > .3) { c.fillStyle = rgba(C.ochre, .95); c.beginPath(); c.arc(wr[0] - 6 * k, wr[1] - 2 * k, 6 * k, 0, TAU); c.fill(); }
  });
  return P(J.arm.n.wr);
}
function rain(c, t, n = 70, dx = 0) {
  for (let i = 0; i < n; i++) { const sp = 1200 + hash(i * 1.3) * 500, y = ((hash(i * 2.1) * 1300 + t * sp) % 1300) - 110, x = ((hash(i * 3.7) * 2300 - dx * (.6 + hash(i) * .5) - y * .2) % 2300 + 2300) % 2300 - 190, L = 34 + hash(i * 4.4) * 34;
    withSeed(9000 + i, () => drawS(c, mk([[x, y], [x - L * .2, y + L]], 2.4, C.rain, { prof: 'tip', nb: 0, a: .55 }), 1)); }
}
// ——— the street (built once as stroke lists, cached as sprites; buildings paint in stroke by stroke as they enter) ———
const SHOPS = []; withSeed(77, () => { let x = -300, i = 0; const words = ['24H', 'CAFE', 'BAKERY', 'BAR', 'BOOKS', 'PHARMACY', 'NOODLES', 'LAUNDRY', 'RECORDS', 'HOTEL'];
  while (x < 7600) { const w = 560 + rnd(0, 200), h = 520 + rnd(0, 240), top = 820 - h, L = [];
    const wall = [C.brick, C.indigo, C.sage, C.grey][i % 4];
    L.push({ sw: [x, top, w, h], col: mixc(wall, C.deep, .25), a: .5, seed: 100 + i, row: 70 });
    L.push({ sw: [x + 30, top + h - 250, w - 160, 170], col: C.glaze, a: .3, seed: 200 + i, row: 50 });                 // the lit shop window: paper under a warm glaze
    for (let r = 0; r < 3; r++) for (let q = 0; q < Math.floor((w - 80) / 130); q++) if (top + 40 + r * 120 < top + h - 300) L.push({ sw: [x + 50 + q * 130, top + 40 + r * 120, 60, 80], col: rnd() < .55 ? C.glaze : C.deep, a: .5, seed: 300 + i * 20 + r * 5 + q, row: 40 });
    L.push({ s: mk(qcurve(x + 20, top + h - 260, x + w - 120, top + h - 262, 2, 8), 34, C.coatD === 0 ? 0 : mixc(C.ochre, C.brick, .5), { prof: 'even', a: .8 }) });   // awning stroke
    L.push({ sw: [x + w - 140, top + h - 240, 64, 820 - (top + h - 240)], col: C.deep, a: .6, seed: 400 + i, row: 60, vert: 1 });   // door
    L.push({ s: mk(qcurve(x, 822, x + w, 822, -2, 10), 5, C.ink, { prof: 'even', nb: 0, a: .6 }) });                                       // ground edge, the only line
    SHOPS.push({ x, w, top, h, L, word: words[i % words.length], i }); x += w + 20; i++; } });
function paintShop(c, S, p, ox) {
  c.save(); c.translate(-ox, 0);
  const N = S.L.length;
  S.L.forEach((e, j) => { const q = clamp((p - j / N * .7) / .3); if (q <= 0) return; if (e.sw) strokeWash(c, ...e.sw, e.col, e.a, e.seed, q, { row: e.row, vert: e.vert }); else drawS(c, e.s, q); });
  if (p > .85) { c.save(); c.globalAlpha = clamp((p - .85) / .15); c.font = '600 46px Caveat'; c.fillStyle = rgba(C.ink, .85); c.fillText(S.word, S.x + 40, S.top + S.h - 280); c.restore(); }
  c.restore();
}

// ——— shots, each painted into a canvas ———
const XP = SPL.x;
function S1(c, t, lt) {
  c.drawImage(PAP, 0, 0);
  const push = 1 + .03 * eio(lt / 2.5), ap = clamp(t / .6);       // the sheet paints itself in over the first 0.6 s
  c.save(); c.translate(960, 600); c.scale(push, push); c.translate(-960, -600);
  strokeWash(c, -60, -60, 2040, 680, C.indigo, .62, 1, ap, { edge: false });
  strokeWash(c, 40, 300, 680, 280, C.glaze, .32, 2, ap, { row: 56 }); strokeWash(c, 1020, 290, 640, 290, C.glaze, .28, 3, ap, { row: 56 });
  strokeWash(c, 780, 250, 160, 360, C.deep, .55, 4, ap, { row: 60, vert: 1 });
  if (ap > .5) { c.save(); c.globalAlpha = clamp((ap - .5) * 2); c.font = '600 96px Caveat'; c.fillStyle = rgba(C.ink, .9); c.fillText('24H', 220, 220); c.fillText('CAFE', 1180, 220); c.restore(); }
  strokeWash(c, -60, 600, 2040, 540, C.grey, .42, 5, ap, { row: 80, edge: false });
  withSeed(6, () => drawS(c, mk(qcurve(-40, 604, 1960, 600, -4, 16), 6, C.ink, { prof: 'even', nb: 0, a: .55 }), ap));
  // the puddle: a dark wash pool with the windows' glow pulled down in vertical strokes, rippling after the splash
  const stir = t > EV.splash ? Math.exp(-(t - EV.splash) * 2) : 0;
  washPoly(c, blob(860, 845, 430, 7, 72), C.deep, .7 * ap, 3, 5, 7);
  for (let i = 0; i < 9; i++) { const x = 520 + i * 80 + Math.sin(t * 6 + i) * (3 + 14 * stir); withSeed(700 + i, () => drawS(c, mk(qcurve(x, 790, x + 4, 900, 4, 6), 16, i % 3 ? C.glaze : mixc(C.coat, C.glaze, .5), { prof: 'tip', a: .45 }), ap)); }
  const c0 = RUN.contacts.find(cc => cc === SPL), s = 2.0, ox = 860 - XP * s, oy = 860;
  if (t > .3 && t < 1.85) { const S = poseAt(t), J = solveProfile(S); paintAki(c, J, ox, oy, s, { hemB: secondary(q => { const p = RUN.pelvisAt(q); return [p[0], p[1] - 250]; }, 0, t).hemB }); }
  for (const cc of RUN.contacts) { const u = t - cc.t0; if (u < 0 || u > .7) continue; const x = ox + cc.x * s + 20, hero = cc === SPL;
    for (let j = 0; j < (hero ? 12 : 5); j++) { const a = -Math.PI / 2 + (hash(j * 7 + cc.t0) - .5) * 2.3, sp = (hero ? 900 : 500) * (.5 + hash(j * 3 + cc.t0) * .6), px = x + Math.cos(a) * sp * u, py = oy + Math.sin(a) * sp * u * 1.2 + 2000 * u * u; if (py > oy) continue;
      withSeed(800 + j + cc.t0 * 10, () => drawS(c, mk(polar(px, py, a, 26, 3, 4), 9, C.grey, { prof: 'leaf', a: .7 }), 1)); }
    if (hero) for (let k = 0; k < 2; k++) { const v = u - k * .15; if (v > 0) { const r = 40 + 380 * eo(v / .7); c.save(); c.globalAlpha = .7 * (1 - v / .7); c.strokeStyle = rgba(C.ink, .5); c.lineWidth = 3; c.beginPath(); c.ellipse(x, oy + 10, r, r * .16, 0, 0, TAU); c.stroke(); c.restore(); } } }
  rain(c, t, 80);
  c.restore();
}
const S2S = .74, S2G = 900;
function S2(c, t, lt) {
  c.drawImage(PAP, 0, 0);
  const px = RUN.pelvisAt(t)[0], camX = px * S2S - 840;
  strokeWash(c, -60, -60, 2040, 330, C.indigo, .6, 21, 1, { edge: false });
  // far rooftops (parallax .4)
  withSeed(22, () => { const fx = camX * .4; for (let i = 0; i < 26; i++) { const x = i * 190 - (fx % 190) - 190 + 0 * rnd(), h = 160 + hash(i + Math.floor(fx / 190)) * 200; strokeWash(c, x, 260 + (360 - h) * .5, 150, h, C.deep, .3, 30 + i + Math.floor(fx / 190), 1, { row: 60, vert: 1, edge: false }); } });
  for (const S of SHOPS) { const x = S.x - camX; if (x > W + 50 || x + S.w < -50) continue; const p = lt < .05 && x < W ? 1 : clamp((W + 120 - x) / 520); paintShop(c, S, x < W - 400 ? 1 : p, camX); }
  strokeWash(c, -60, 822, 2040, 300, C.grey, .42, 23, 1, { row: 70, edge: false });
  for (let i = 0; i < 6; i++) { const x = ((i * 520 - camX * .98) % 3120 + 3120) % 3120 - 200; washPoly(c, blob(x + 130, 934, 140, 40 + i, 16), C.deep, .45, 3, 3, 40 + i); }
  const S = poseAt(t), J = solveProfile(S), sx = -camX, sc = secondary(q => { const p = RUN.pelvisAt(q); return [p[0], p[1] - 250]; }, 0, t);
  const wr = paintAki(c, J, sx, S2G, S2S, { watch: S.watch, hemB: sc.hemB, hairLag: sc.hair.back, blink: [3.6, 5.2].some(b => t >= b && t < b + .1) });
  for (const cc of RUN.contacts) { const u = t - cc.t0; if (u < 0 || u > .5) continue; const x = sx + cc.x * S2S + 14; for (let j = 0; j < 4; j++) { const a = -Math.PI / 2 + (hash(j * 5 + cc.t0) - .5) * 2, px2 = x + Math.cos(a) * 380 * u, py = S2G + Math.sin(a) * 420 * u + 1600 * u * u; if (py > S2G) continue; withSeed(860 + j, () => drawS(c, mk(polar(px2, py, a, 16, 2, 4), 6, C.grey, { prof: 'leaf', a: .6 }), 1)); } }
  // lamps (foreground parallax 1.4): a painted post and a glaze halo
  for (let k = 0; k < 4; k++) { const x = k * 2600 + 1500 - camX * 1.4 % 99999; const xx = ((k * 2600 + 1500 - camX * 1.4) % 10400 + 10400) % 10400 - 400; if (xx < -200 || xx > W + 200) continue;
    washPoly(c, [[xx - 70, 200], [xx + 70, 200], [xx + 90, 280], [xx - 90, 280]], C.glaze, .35, 3, 6, 60 + k); withSeed(61 + k, () => drawS(c, mk(qcurve(xx, 1100, xx, 240, 0, 8), 16, C.deep, { prof: 'even', a: .85 }), 1)); }
  rain(c, t, 70, camX);
  // the note: the time, written as she reads her watch, with a pen leader to her wrist
  if (t > 6.2 && t < 7.5) { const f = 1 - ss(seg(t, 7.2, 7.5)); c.save(); c.globalAlpha = f; leader(c, wr[0] + 170, wr[1] - 130, wr[0] + 8, wr[1] - 6, seg(t, 6.2, 6.6), 16); hand(c, '23:58', wr[0] + 120, wr[1] - 160, seg(t, 6.45, 6.95), { size: 54, w: 600 }); c.restore(); }
}
function S3(c, t, lt) {   // slow push into the detail: the watch as a specimen, with its note
  c.drawImage(PAP, 0, 0);
  const z = 1 + .06 * eio(lt / 1.875), bob = Math.sin(TAU * CADENCE * .5 * (t - FIRST_STEP)) * 5;
  strokeWash(c, -60, -60, 2040, 1200, mixc(C.indigo, C.deep, .3), .28, 70, 1, { row: 110, edge: false });
  for (let k = 0; k < 18; k++) { const y = 80 + hash(k * 1.7) * 900, x = ((hash(k * 4.3) * 2600 - t * (500 + hash(k) * 600)) % 2600 + 2600) % 2600 - 300; withSeed(71 + k, () => drawS(c, mk(qcurve(x, y, x + 220, y + 6, 4, 6), 22, k % 3 ? C.glaze : mixc(C.coat, C.glaze, .4), { prof: 'tip', a: .35 }), 1)); }
  c.save(); c.translate(960, 560 + bob); c.scale(z, z); c.rotate(-.08);
  withSeed(80, () => { drawS(c, mk(qcurve(-1100, 40, -280, 10, -10, 10), 230, C.coat, { prof: 'even', a: .9 }), 1); drawS(c, mk(qcurve(-1000, 90, -300, 70, -6, 10), 60, C.coatD, { prof: 'tip', a: .6 }), 1); });
  washPoly(c, [[-300, -78], [260, -64], [300, 0], [260, 70], [-300, 84]], C.skin, .9, 3, 4, 81);
  washPoly(c, [[250, -80], [380, -96], [430, -20], [410, 70], [290, 90]], C.skin, .9, 3, 4, 82);
  withSeed(83, () => drawS(c, mk(qcurve(-330, -110, -330, 120, 0, 6), 70, C.coatD, { prof: 'even', a: .9 }), 1));
  washPoly(c, rectP(-80, -110, 160, 220), '#5a3b2a', .8, 3, 3, 84);
  // the case: a gold wash ring, the dial left as paper, ink ticks and hands, the vermilion second hand on the second
  c.save(); c.beginPath(); c.arc(0, 0, 150, 0, TAU); c.arc(0, 0, 118, 0, TAU, true); c.fillStyle = rgba(C.ochre, .85); c.fill('evenodd'); c.restore();
  c.save(); c.beginPath(); c.arc(0, 0, 118, 0, TAU); c.clip(); c.drawImage(PAP, 900, 420, 236, 236, -118, -118, 236, 236); c.restore();
  withSeed(85, () => { drawS(c, mk(qcurve(-150, 20, 150, 30, 60, 14), 10, mixc(C.ochre, C.brick, .5), { prof: 'tip', a: .5 }), 1); });
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, r0 = k % 3 ? 96 : 84; withSeed(90 + k, () => drawS(c, mk([[Math.sin(a) * r0, -Math.cos(a) * r0], [Math.sin(a) * 110, -Math.cos(a) * 110]], k % 3 ? 4 : 7, C.ink, { prof: 'even', nb: 0, a: .85 }), 1)); }
  const sec = 41 + Math.floor(t - EV.watchHit), mm = 58 + sec / 60;
  const handS = (a, l, w, col, sd) => withSeed(sd, () => drawS(c, mk([[0, 0], [Math.sin(a) * l, -Math.cos(a) * l]], w, col, { prof: 'tip', nb: 0, a: .9 }), 1));
  handS((11 + mm / 60) / 12 * TAU, 60, 12, C.ink, 101); handS(mm / 60 * TAU, 92, 8, C.ink, 102); handS(sec / 60 * TAU, 104, 4, C.coat, 103);
  c.fillStyle = rgba(C.coat, .95); c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.fill();
  c.restore();
  rain(c, t, 40);
  const ax = 960 + 120 * z, ay = 560 - 100 * z;
  leader(c, ax + 300, ay - 170, ax, ay, seg(t, 7.7, 8.2), 20); hand(c, '23:58', ax + 250, ay - 205, seg(t, 7.9, 8.5), { size: 64, w: 600 });
  mono(c, 'LAST TRAIN  23:59', ax + 254, ay - 140, ss(seg(t, 8.5, 8.9)) * .8);
}
function S4(c, t, lt) {   // the night sky over the town; the stand tilts down; the clock tower paints itself in; the chime blooms
  c.drawImage(PAP, 0, 0);
  const tilt = 230 * Math.pow(seg(lt, 0, .625), 2);
  strokeWash(c, -60, -60, 2040, 1200, C.indigo, .66, 120, 1, { edge: false });
  strokeWash(c, -60, 700 - tilt, 2040, 600, C.deep, .26, 121, 1, { row: 90, edge: false });
  for (let i = 0; i < 6; i++) washPoly(c, blob(i * 360 + 110, 260 + hash(i) * 200 - tilt * .4, 220, 130 + i, 50), mixc(C.grey, PAPER, .2), .4, 3, 6, 130 + i);
  for (let i = 0; i < 50; i++) { const x = hash(i * 5.1) * W, y = hash(i * 6.3) * 600 - tilt * .3; c.fillStyle = rgba(PAPER, .9); c.beginPath(); c.arc(x, y, 1.5 + hash(i) * 2, 0, TAU); c.fill(); }   // lifted pigment: the stars are paper
  for (let i = 0; i < 12; i++) strokeWash(c, -40 + i * 170, 860 + hash(i * 3) * 120 - tilt, 150, 400, C.deep, .55, 140 + i, 1, { row: 60, vert: 1 });
  const tx = 1260, ty = 640 - tilt, p = clamp(lt / .5);
  washPoly(c, [[tx - 80, 1300], [tx - 80, ty + 60], [tx, ty - 70], [tx + 80, ty + 60], [tx + 80, 1300]], mixc(C.grey, C.deep, .3), .7 * p, 3, 4, 160);
  c.save(); c.beginPath(); c.arc(tx, ty + 120, 52, 0, TAU); c.clip(); c.drawImage(PAP, tx - 52, ty + 68, 104, 104, tx - 52, ty + 68, 104, 104); washPoly(c, rectP(tx - 52, ty + 68, 104, 104), C.glaze, .35 * p, 2, 3, 161); c.restore();
  withSeed(162, () => { drawS(c, mk([[tx, ty + 120], [tx - 14, ty + 90]], 7, C.ink, { prof: 'tip', nb: 0 }), p); drawS(c, mk([[tx, ty + 120], [tx - 2, ty + 78]], 5, C.ink, { prof: 'tip', nb: 0 }), p); });
  const u = t - EV.chime; if (u > 0) { const r = 60 + 340 * eo(u / .45); c.save(); c.globalAlpha = .4 * (1 - u / .5); const g = c.createRadialGradient(tx, ty + 120, r * .6, tx, ty + 120, r); g.addColorStop(0, rgba(C.glaze, 0)); g.addColorStop(.7, rgba(C.glaze, .7)); g.addColorStop(1, rgba(C.glaze, 0)); c.fillStyle = g; c.fillRect(tx - r, ty + 120 - r, 2 * r, 2 * r); c.restore(); }
  rain(c, t, 70);
}
const SH = { S1, S2, S3, S4 }, IDX = { S1: 0, S2: 1, S3: 2, S4: 3 }, LIST = [S1, S2, S3, S4], STARTS = [0, 2.5, 7.5, 9.375];
// brush-edge wipe at every cut: the new picture is revealed behind a wavy vertical edge in .35 s (no hard video cuts)
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  const [t0, , id] = shotAt(t), i = IDX[id], lt = t - t0, w = clamp(lt / .35);
  if (i > 0 && w < 1) {
    const prev = OFF[0].getContext('2d'); prev.setTransform(1, 0, 0, 1, 0, 0); LIST[i - 1](prev, t, t - STARTS[i - 1]); ctx.drawImage(OFF[0], 0, 0);
    const cur = OFF[1].getContext('2d'); cur.setTransform(1, 0, 0, 1, 0, 0); SH[id](cur, t, lt);
    const ex = eio(w) * (W + 300) - 150; ctx.save(); ctx.beginPath(); ctx.moveTo(-10, -10);
    for (let y = -10; y <= H + 10; y += 20) ctx.lineTo(ex + Math.sin(y * .02 + 1.3) * 40 + (hash(Math.floor(y / 20) + i * 50) - .5) * 30, y);
    ctx.lineTo(-10, H + 10); ctx.closePath(); ctx.clip(); ctx.drawImage(OFF[1], 0, 0); ctx.restore();
  } else SH[id](ctx, t, lt);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .55; ctx.drawImage(PAP, 0, 0); ctx.restore();
}
window.DUR = DUR; window.render = render;
window.TEXTS = t => (t > 6.45 && t < 7.4 ? [{ text: '23:58' }] : t > 7.9 && t < 9.375 ? [{ text: '23:58' }, { text: 'LAST TRAIN 23:59' }] : []);
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; if (id === 'S1' && (t <= .3 || t >= 1.85)) return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
