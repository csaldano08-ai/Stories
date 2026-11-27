// 080 · Firefly Pointillism — the first 10 s of "Last Train Home" as soft points of light on black (lemo-opuscar styles/firefly-pointillism).
// One fixed pool of points for the whole film (none created, none destroyed). AKI is a dotted silhouette bound to the parts of the shared
// rig (dense outline, sparse fill, outline points hidden where a nearer part covers them): her pose, bone lengths and planted foot are the
// rig's. Everything else is the same kind of point: the kerb, the shop windows, the lamps (bokeh), the fireflies, a few cold stars, the
// puddle (weather colour). Every point splats a Gaussian whose size is its focus (σ 1 … 23 px, bigger = fainter), into linear light,
// tone-mapped 1 − exp(−x); a 180° shutter draws each point as samples along its path.
//   S1  lateral tracking, close and low: she runs over the kerb of light; the puddle's points burst into a crown at 0.94 s and fall back
//   S2  pull back: the whole figure running past windows and lamps; at 6.05 s her watch becomes the guiding light (the brightest point)
//   S3  identity swap: the windows and fireflies swirl into her watch face and the time, 11:58:47, while she falls back into bokeh;
//       at 8.4 s the points of the 7 fly to make an 8
//   S4  a gust: the watch re-gathers as the clock tower; on the chime (9.58 s) a synchronous flash ripples out from its face
// Page contract: window.render(t), DUR, READY, RIGQA.
import * as THREE from 'three';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, hash, mulberry } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080, TAU = Math.PI * 2;
await document.fonts.load('700 200px OldStd', '0123456789:');

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
const SIM = (() => {
  const dt = 1 / 240, n = Math.ceil(11 / dt), tail = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  const th = [-.2, -.1, 0], vt = [0, 0, 0], py = t => RUN.pelvisAt(t)[1], ay = t => (py(t + dt) - 2 * py(t) + py(t - dt)) / (dt * dt);
  for (let i = 0; i < n; i++) { const t = -.5 + i * dt, A = ay(t);
    for (let k = 0; k < 3; k++) { const par = k ? th[k - 1] : -.1, rest = .16 + .05 * k; vt[k] += (-60 * (th[k] - (par + rest)) - 6 * vt[k] + .014 * A * (k + 1) * .6) * dt; th[k] += vt[k] * dt; tail[k][i] = th[k]; } }
  return { tail: t => tail.map(a => a[clamp(Math.round((t + .5) / dt), 0, n - 1)]) };
})();
const W_T = t => 11 * 3600 + 58 * 60 + 48 + (t - 8.4);

// ═════════ colours (linear) — each character owns its colour through every transformation
const PROT = [1, .74, .34], AMB = [.86, 1, .40], LAND = [.42, .72, .26], WEA = [.62, .80, .72], STAR = [.86, .9, 1], TITLE = [1, .9, .58];

// ═════════ AKI: points bound to normalised local coordinates on each rig part (outline dense, fill sparse)
const R = mulberry(80);
const PARTS = [   // [id, kind, layer, radius a, radius b, outline points, fill points]
  ['thighF', 'cap', 0, 34, 27, 70, 18], ['shinF', 'cap', 0, 26, 19, 66, 14], ['footF', 'cap', 0, 17, 13, 34, 6], ['upperF', 'cap', 0, 22, 19, 50, 10], ['foreF', 'cap', 0, 18, 15, 44, 8],
  ['coat', 'poly', 1, 0, 0, 260, 150], ['neck', 'cap', 1, 18, 17, 20, 4], ['head', 'circ', 1, 50, 50, 150, 70], ['tail', 'chain', 1, 17, 7, 70, 10],
  ['thighN', 'cap', 2, 35, 28, 74, 20], ['shinN', 'cap', 2, 27, 20, 70, 16], ['footN', 'cap', 2, 18, 13, 36, 6], ['upperN', 'cap', 2, 23, 19, 52, 12], ['foreN', 'cap', 2, 19, 15, 46, 10], ['watch', 'circ', 2, 13, 13, 16, 2]];
const AP = []; PARTS.forEach(([id, kind, layer, ra, rb, no, nf], pi) => {
  for (let k = 0; k < no; k++) AP.push({ pi, out: 1, u: (k + R() * .6) / no, v: k % 2 ? 1 : -1, ph: R() * TAU, sp: R() < .05 ? 3 : 1 });
  for (let k = 0; k < nf; k++) AP.push({ pi, out: 0, u: R(), v: R() * 2 - 1, w2: R(), ph: R() * TAU, sp: R() < .04 ? 3 : 1 }); });
const NA = AP.length;
function akiParts(t) {
  const J = solveProfile(poseAt(t)), P = {}, legs = k => { const l = J.leg[k], c = Math.cos(l.pitch), s = Math.sin(l.pitch); return [l.hip, l.knee, l.ankle, [l.ankle[0] + 66 * c, l.ankle[1] + 66 * s]]; };
  for (const [k, s] of [['f', 'F'], ['n', 'N']]) { const L = legs(k), A = J.arm[k]; P['thigh' + s] = [L[0], L[1]]; P['shin' + s] = [L[1], L[2]]; P['foot' + s] = [L[2], L[3]]; P['upper' + s] = [A.sh, A.el]; P['fore' + s] = [A.el, [A.wr[0] + (A.wr[0] - A.el[0]) * .25, A.wr[1] + (A.wr[1] - A.el[1]) * .25]]; }
  const TT = (b, u, f) => [b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f];
  P.coat = [TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)];
  P.neck = [J.neckBase, J.neckTop]; P.head = J.headC;
  const ta = SIM.tail(t); let an = Math.PI - .25 + ta[0] + J.headA, p = [J.headC[0] - Math.cos(J.headA) * 50, J.headC[1] - Math.sin(J.headA) * 50 - 10]; const tl = [p];
  for (let i = 0; i < 3; i++) { const Lk = [46, 42, 36][i]; p = [p[0] + Math.cos(an) * Lk, p[1] + Math.sin(an) * Lk]; tl.push(p); an += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
  P.tail = tl; const a = J.arm.n; P.watch = [a.el[0] + (a.wr[0] - a.el[0]) * .84, a.el[1] + (a.wr[1] - a.el[1]) * .84]; P.watchOn = J.S.watch;
  return P;
}
const segD = (px, py, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1, u = clamp(((px - a[0]) * dx + (py - a[1]) * dy) / L2); return [Math.hypot(a[0] + dx * u - px, a[1] + dy * u - py), u]; };
const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
function akiWorld(t, out) {   // out: Float32Array NA*3 (x, y, visibility) in rig space
  const P = akiParts(t);
  const inside = (pi, x, y) => { const [id, kind, , ra, rb] = PARTS[pi], g = P[id];
    if (kind === 'cap') { const [d, u] = segD(x, y, g[0], g[1]); return d < lerp(ra, rb, u) - 2; }
    if (kind === 'poly') return inPoly(x, y, g); if (kind === 'circ') return Math.hypot(x - g[0], y - g[1]) < ra - 2;
    for (let i = 1; i < g.length; i++) { const [d, u] = segD(x, y, g[i - 1], g[i]); if (d < lerp(ra, rb, (i - 1 + u) / (g.length - 1)) - 2) return true; } return false; };
  for (let i = 0; i < NA; i++) { const q = AP[i], [id, kind, layer, ra, rb] = PARTS[q.pi], g = P[id]; let x, y;
    if (kind === 'cap' || kind === 'chain') { const pts = kind === 'cap' ? g : g, nseg = pts.length - 1, f = q.u * nseg, s = Math.min(nseg - 1, Math.floor(f)), u = f - s, a = pts[s], b = pts[s + 1];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, r = lerp(ra, rb, q.u); x = a[0] + dx * u - dy / L * r * q.v; y = a[1] + dy * u + dx / L * r * q.v; }
    else if (kind === 'circ') { const th = q.u * TAU, r = q.out ? ra : ra * Math.sqrt(q.w2 ?? .5); x = g[0] + Math.cos(th) * r; y = g[1] + Math.sin(th) * r; }
    else { if (q.out) { const n = g.length, f = q.u * n, s = Math.floor(f) % n, u = f - Math.floor(f), a = g[s], b = g[(s + 1) % n]; x = lerp(a[0], b[0], u); y = lerp(a[1], b[1], u); }
      else { const c = [g.reduce((s, p) => s + p[0], 0) / g.length, g.reduce((s, p) => s + p[1], 0) / g.length], n = g.length, s = Math.floor(q.u * n) % n, a = g[s], b = g[(s + 1) % n], w1 = q.w2, w2 = (1 - w1) * Math.abs(q.v);
        x = c[0] + (a[0] - c[0]) * w1 + (b[0] - c[0]) * w2; y = c[1] + (a[1] - c[1]) * w1 + (b[1] - c[1]) * w2; } }
    let vis = id === 'watch' ? (P.watchOn > .2 ? 1 : 0) : 1;
    if (q.out && vis) for (let pj = 0; pj < PARTS.length; pj++) { if (pj === q.pi || PARTS[pj][2] < layer || PARTS[pj][0] === 'watch') continue; if (PARTS[pj][2] === layer && pj < q.pi && layer !== 1) continue; if (inside(pj, x, y)) { vis = .04; break; } }
    out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = vis; }
  return P;
}

// ═════════ the rest of the pool: kerb, pavement glints, windows, lamps, fireflies, stars, puddle
const ENV = [];   // {g, x0, y0, d (depth: <0 far, >0 near), s (σ), w, c, ph}
const add = (g, n, f) => { for (let i = 0; i < n; i++) ENV.push({ g, ph: R() * TAU, ...f(i) }); };
const PER = 2600;                                                       // the street repeats every PER world units (the run is long)
add('kerb', 620, i => ({ x0: (i + R() * .5) / 620 * PER, y0: 6 + R() * 10, d: (R() - .5) * .12, s: 1.1, w: .55 + R() * .3, c: LAND }));
add('pave', 200, i => ({ x0: R() * PER, y0: 30 + Math.pow(R(), 2) * 220, d: .25 + R() * .8, s: 1.6 + R() * 2, w: .06 + R() * .08, c: LAND }));
for (let k = 0; k < 8; k++) { const x = k * 325, w0 = 180, h0 = 110 + (k % 3) * 20, y = -290 - (k % 2) * 40;
  add('win', 150, i => { const per = 2 * (w0 + h0), s = (i + R() * .4) / 150 * per; let px, py; if (s < w0) { px = s; py = 0; } else if (s < w0 + h0) { px = w0; py = s - w0; } else if (s < 2 * w0 + h0) { px = 2 * w0 + h0 - s; py = h0; } else { px = 0; py = per - s; }
    return { x0: x + px, y0: y + py, d: -.6, s: 2.1, w: .3 + R() * .2, c: AMB }; }); }
add('lamp', 60, i => ({ x0: (i % 6) * 433 + R() * 30, y0: i < 30 ? -520 - R() * 30 : -120 + R() * 260, d: i < 30 ? -.4 : 1.3, s: i < 30 ? 7 + R() * 5 : 14 + R() * 9, w: i < 30 ? .35 : .22, c: AMB }));
add('fly', 600, i => ({ x0: R() * W, y0: H * (.08 + .8 * Math.pow(R(), .8)), d: 0, s: 1.4 + R() * 1.4, w: .9, c: AMB, f1: .3 + R() * 1.1, f2: .3 + R() * 1.1 }));
add('star', 150, i => ({ x0: R() * W, y0: H * .26 * Math.pow(R(), 1.6), d: -1, s: 1.0, w: .2 + R() * .35, c: STAR }));
add('pud', 300, i => { const th = R() * TAU, out = i < 200, r = out ? 1 : Math.sqrt(R()); return { x0: Math.cos(th) * r, y0: Math.sin(th) * r, d: 0, s: 1.3, w: out ? .5 : .22, c: WEA, crown: i % 3 === 0 && i < 200 }; });
const NE = ENV.length;
// the watch face and the time, sampled as layouts (jittered grid on a mask); fixed slots for the 7 → 8 swap
function maskPts(draw, w, h, n, seed) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = '#fff'; draw(g); const d = g.getImageData(0, 0, w, h).data, r = mulberry(seed);
  let sp = 5, out = []; for (let it = 0; it < 30; it++) { out = []; for (let y = 0; y < h; y += sp) for (let x = 0; x < w; x += sp) { const px = x + (r() - .5) * .6 * sp, py = y + (r() - .5) * .6 * sp; if (d[(Math.floor(py) * w + Math.floor(px)) * 4] > 128) out.push([px, py]); } if (out.length >= n) break; sp *= .94; }
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out.slice(0, n); }
const DIGW = 680, DIGH = 200, digitsMask = s => g => { g.font = '700 170px OldStd'; g.textBaseline = 'middle'; g.fillText(s, 8, DIGH / 2 + 6); };
const DPRE = maskPts(digitsMask('11:58:4'), DIGW, DIGH, 920, 3), LASTX = (() => { const c = document.createElement('canvas').getContext('2d'); c.font = '700 170px OldStd'; return 8 + c.measureText('11:58:4').width; })();
const lastMask = ch => g => { g.font = '700 170px OldStd'; g.textBaseline = 'middle'; g.fillText(ch, LASTX, DIGH / 2 + 6); };
const D7 = maskPts(lastMask('7'), DIGW, DIGH, 200, 5), D8 = maskPts(lastMask('8'), DIGW, DIGH, 230, 6);
const D47 = [...DPRE, ...Array.from({ length: 230 }, (_, i) => D7[i % D7.length])], D48 = [...DPRE, ...Array.from({ length: 230 }, (_, i) => D8[i % D8.length])];
// watch layout targets for the swapped groups (screen space), tower layout targets (screen space)
const WC = [700, 470], WR = 300, DX = 1080, DY = 430;
const watchT = [], towerT = [];
(() => { const r = mulberry(9);
  for (let i = 0; i < 520; i++) { const a = i / 520 * TAU; watchT.push({ x: WC[0] + Math.cos(a) * WR, y: WC[1] + Math.sin(a) * WR, w: .55, c: TITLE, s: 1.1, kind: 'ring' }); }
  for (let k = 0; k < 60; k++) { const a = k / 60 * TAU, big = k % 5 === 0, n = big ? 8 : 3; for (let j = 0; j < n; j++) { const rr = WR - 18 - j * (big ? 5 : 4); watchT.push({ x: WC[0] + Math.sin(a) * rr, y: WC[1] - Math.cos(a) * rr, w: .6, c: TITLE, s: 1.1, kind: 'tick' }); } }
  for (const [kind, L, n] of [['hH', 150, 50], ['hM', 230, 70], ['hS', 260, 46]]) for (let j = 0; j < n; j++) watchT.push({ hand: kind, f: (j + .5) / n * L, w: kind === 'hS' ? .9 : .7, c: kind === 'hS' ? PROT : TITLE, s: 1.1, kind: 'hand' });
  for (let i = 0; i < D47.length; i++) watchT.push({ x: DX + D47[i][0], y: DY + D47[i][1], x8: DX + D48[i][0], y8: DY + D48[i][1], w: i >= DPRE.length && i - DPRE.length >= D7.length ? 0 : .5, w8: .5, c: TITLE, s: 1.05, kind: 'digit' });
  // the tower: outline of shaft, stage, belfry, roof, its clock face (the dial's points), windows
  const TX = 1240, TB = 1000, edge = (a, b, n) => { for (let j = 0; j < n; j++) { const u = (j + r() * .5) / n; towerT.push({ x: lerp(a[0], b[0], u), y: lerp(a[1], b[1], u), w: .5, c: TITLE, s: 1.1 }); } };
  edge([TX - 95, TB], [TX - 95, 420], 170); edge([TX + 95, TB], [TX + 95, 420], 170); edge([TX - 120, 420], [TX + 120, 420], 60); edge([TX - 120, 420], [TX - 120, 260], 50); edge([TX + 120, 420], [TX + 120, 260], 50);
  edge([TX - 120, 260], [TX + 120, 260], 60); edge([TX - 100, 260], [TX - 100, 170], 30); edge([TX + 100, 260], [TX + 100, 170], 30); edge([TX - 120, 170], [TX, 40], 70); edge([TX + 120, 170], [TX, 40], 70); edge([TX, 40], [TX, -10], 16);
  edge([TX - 60, 250], [TX - 60, 190], 14); edge([TX + 60, 250], [TX + 60, 190], 14); edge([TX - 95, TB], [TX + 95, TB], 50);
  for (let k = 0; k < 6; k++) for (const sx of [-1, 1]) for (let j = 0; j < 10; j++) towerT.push({ x: TX + sx * 45 + (r() - .5) * 24, y: 500 + k * 80 + (r() - .5) * 40, w: .35, c: AMB, s: 1.6 });
})();
const TFACE = [1240, 340], TFR = 66;
// which environment points take part in the swap (the windows, the fireflies, and some kerb): in pool order
const SWAP = ENV.map((e, i) => i).filter(i => ENV[i].g === 'win' || ENV[i].g === 'fly' || (ENV[i].g === 'kerb' && i % 2 === 0));
const NW = watchT.length;

// ═════════ cameras per shot: AKI's transform (rig space → screen), the street's scroll
const camAki = t => {   // {z, sx, sy, fx, fy}: rig point (fx, fy) relative to her pelvis lands at screen (sx, sy)
  const A = { z: 1.55, sx: W * .42, sy: H * .46, fy: -150 }, B = { z: .92, sx: W * .47, sy: H * .55, fy: -300 }, C = { z: .8, sx: W * .86, sy: H * .66, fy: -300 }, D = { z: .38, sx: W * .27, sy: H * .9, fy: -300 };
  const mix = (P, Q, u) => ({ z: Math.exp(lerp(Math.log(P.z), Math.log(Q.z), u)), sx: lerp(P.sx, Q.sx, u), sy: lerp(P.sy, Q.sy, u), fy: lerp(P.fy, Q.fy, u) });
  if (t < 2.5) return A; if (t < 7.5) return mix(A, B, eio(seg(t, 2.5, 3.4))); if (t < 9.375) return mix(B, C, eio(seg(t, 7.5, 8.0))); return mix(C, D, eio(seg(t, 9.375, 9.6)));
};
const wrap = (x, a, b) => a + ((x - a) % (b - a) + (b - a)) % (b - a);

// ═════════ state of every point at t → arrays (x, y, σ, w, r, g, b)
const NT = NA + NE, AW = new Float32Array(NA * 3);
function state(t, O) {   // O: Float32Array NT*7
  const ca = camAki(t), xP = X(t), P = akiWorld(t, AW);
  const S3 = seg(t, 7.5, 7.95), S4 = seg(t, 9.375, 9.6), focusOut = eio(seg(t, 7.5, 7.9)) * (1 - eio(seg(t, 9.375, 9.62)));
  const chime = t - EV.chime;
  let k = 0;
  const put = (x, y, s, w, c) => { O[k++] = x; O[k++] = y; O[k++] = s; O[k++] = w; O[k++] = c[0]; O[k++] = c[1]; O[k++] = c[2]; };
  // AKI
  for (let i = 0; i < NA; i++) { const q = AP[i], x = ca.sx + (AW[i * 3] - xP) * ca.z, y = ca.sy + (AW[i * 3 + 1] - ca.fy) * ca.z, vis = AW[i * 3 + 2];
    const br = (q.out ? .85 : .32) * (1 + .22 * Math.sin(t * 2.1 + q.ph)) * q.sp * vis;
    const isW = PARTS[q.pi][0] === 'watch', guide = isW ? 3.2 * clamp((t - EV.watchUp) / .15) * (1 - seg(t, EV.watchDown, EV.watchDown + .3)) + (isW ? 0 : 0) : 0;
    put(x, y, lerp(1.0, 8.5, focusOut) * (isW ? 1.3 : 1), br * lerp(1, .2, focusOut) + guide, isW ? AMB : PROT); }
  // the street (scrolls with her; depth parallax), and the swap into the watch and the tower
  const zS = ca.z, swapIdx = new Map(SWAP.map((e, j) => [e, j]));
  const hands = { hH: -((11 + (58 + (W_T(t) % 60) / 60) / 60) / 12) * TAU, hM: -((58 + (W_T(t) % 60) / 60) / 60) * TAU, hS: -(Math.floor(W_T(t) + 1e-6) % 60) / 60 * TAU };
  for (let i = 0; i < NE; i++) { const e = ENV[i]; let x, y, s = e.s, w = e.w, c = e.c;
    if (e.g === 'fly') { x = e.x0 + 40 * Math.sin(t * e.f1 + e.ph) + 25 * Math.sin(t * e.f2 * 1.7 + e.ph * 2); y = e.y0 + 30 * Math.sin(t * e.f2 + e.ph * 3); const p = Math.max(0, Math.sin(t * 2.2 * e.f1 + e.ph)); w = .008 + 1.1 * Math.pow(p, 16); }
    else if (e.g === 'star') { x = e.x0 - (xP - X(0)) * .004; y = e.y0; w = e.w * (.8 + .2 * Math.sin(t * 3 + e.ph)); }
    else if (e.g === 'pud') { const px = SPL.x + 44, sk = 1 + .38 * e.d, a = t - SPL.t0; let wx = px + e.x0 * 300, wy = e.y0 * 34 + 8;
      if (a > 0 && a < 1.6) { if (e.crown && a < .9) { const vy = 520 + hash(i) * 380, th = Math.atan2(e.y0, e.x0); wx += Math.cos(th) * 260 * a; wy = Math.min(wy, wy - vy * a + 980 * a * a); w = e.w * 2.6 + 1.2 * (1 - a); s = 1.2 + a * 1.5; }
        else { const rr = 1 + .9 * eo(clamp(a / 1.4)); wx = px + e.x0 * 300 * rr; wy = e.y0 * 34 * rr + 8; w = e.w * (1 + 1.6 * Math.exp(-a * 3)); } }
      x = ca.sx + (wx - xP) * zS * sk; y = ca.sy + (wy - ca.fy) * zS * sk; }
    else { const sk = 1 + .38 * e.d; x = wrap(ca.sx + (e.x0 - xP) * zS * sk, -260, W + 260 + (e.g === 'win' || e.g === 'lamp' ? 0 : 0)); y = ca.sy + (e.y0 - ca.fy) * zS * sk; if (e.g === 'win') w *= .8 + .2 * Math.sin(t * .9 + e.ph); }
    // the swap: windows, fireflies and kerb points gather as the watch (S3), then as the tower (S4)
    const j = swapIdx.get(i);
    if (j !== undefined && t > 7.45) { const T = watchT[j % NW], dl = (j % 97) / 97 * .22, u3 = eio(clamp((t - 7.5 - dl) / .42));
      let wx, wy; if (T.kind === 'hand') { const a = hands[T.hand]; wx = WC[0] + Math.sin(-a) * T.f; wy = WC[1] - Math.cos(-a) * T.f; } else if (T.kind === 'digit') { const u8 = eio(seg(t, 8.4 + (j % 13) * .006, 8.62)); wx = lerp(T.x, T.x8, u8); wy = lerp(T.y, T.y8, u8); } else { wx = T.x; wy = T.y; }
      const sw = (1 - u3) * 2.2, cx = WC[0] + 200, cy = WC[1], dx = x - cx, dy = y - cy, rx = cx + dx * Math.cos(sw) - dy * Math.sin(sw), ry = cy + dx * Math.sin(sw) + dy * Math.cos(sw);   // swirl in
      let xx = lerp(rx, wx, u3), yy = lerp(ry, wy, u3), ss_ = lerp(s, T.s, u3), ww = lerp(w, T.w * (1 + .2 * Math.sin(t * 2 + j)), u3), cc = u3 > .5 ? T.c : c;
      if (T.kind === 'digit') { ww = lerp(w, lerp(T.w, T.w8, seg(t, 8.4, 8.62)) * (1 + .2 * Math.sin(t * 2 + j)), u3); if (t > 8.4 && t < 8.7 && T.x !== T.x8) ww *= 1 + 1.4 * Math.exp(-(t - 8.6) * (t - 8.6) / .003); }
      if (t > 9.3) { const U = towerT.length, Tt = j % NW < 520 ? { x: TFACE[0] + Math.cos(j / 520 * TAU) * TFR, y: TFACE[1] + Math.sin(j / 520 * TAU) * TFR, w: .6, c: TITLE, s: 1.1 } : towerT[j % U], d4 = ((j * 7) % 101) / 101 * .1, u4 = eio(clamp((t - 9.375 - d4) / .2));
        const gx = xx + 260 * Math.sin(j) * (1 - u4) * u4, gy = yy - 160 * u4 * (1 - u4);   // the gust: a curved flight
        xx = lerp(gx, Tt.x, u4); yy = lerp(gy, Tt.y, u4); ss_ = lerp(ss_, Tt.s, u4); ww = lerp(ww, Tt.w, u4); cc = u4 > .5 ? Tt.c : cc;
        if (chime > 0) { const dd = Math.hypot(xx - TFACE[0], yy - TFACE[1]); ww *= 1 + 2.6 * Math.exp(-Math.pow((chime - dd / 2600) / .08, 2)); } }
      x = xx; y = yy; s = ss_; w = ww; c = cc; }
    else if (j !== undefined && t > 9.3 && chime > 0) { /* not reached */ }
    if (chime > 0 && j === undefined) { const dd = Math.hypot(x - TFACE[0], y - TFACE[1]); w *= 1 + 2.6 * Math.exp(-Math.pow((chime - dd / 2600) / .08, 2)); }
    put(x, y, s, w, c); }
}

// ═════════ the renderer: Gaussian splats into linear light (half float), tone mapped 1 − exp(−x), gamma 2.2
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, canvas: document.getElementById('c') });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const SAMP = 3, HALO = 1, NP = NT * (SAMP + HALO), geo = new THREE.BufferGeometry(), aP = new Float32Array(NP * 4), aC = new Float32Array(NP * 3);
geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP * 3), 3)); geo.setAttribute('a', new THREE.BufferAttribute(aP, 4)); geo.setAttribute('col', new THREE.BufferAttribute(aC, 3));
const pmat = new THREE.ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `attribute vec4 a; attribute vec3 col; varying vec3 vC; varying float vS, vW;
    void main(){ vC = col; vS = a.z; float gs = a.z; vW = a.w;
      gl_PointSize = clamp(gs * 6.0 + 2.0, 2.0, 160.0);
      gl_Position = vec4(a.x / 960.0 - 1.0, 1.0 - a.y / 540.0, 0.0, 1.0); }`,
  fragmentShader: `varying vec3 vC; varying float vS, vW;
    void main(){ vec2 p = (gl_PointCoord - 0.5) * (vS * 6.0 + 2.0); float r2 = dot(p, p);
      float s = vS; float gain = pow(s, 0.73);                       // energy grows ~ like the library's level gains [1 … 10] over σ 1 … 23
      float v = vW * gain * exp(-r2 / (2.0 * s * s)) / (6.2832 * s * s);
      gl_FragColor = vec4(vC * v, 1.0); }` });
const pts = new THREE.Points(geo, pmat); pts.frustumCulled = false; const scene = new THREE.Scene(); scene.add(pts);
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const tone = new THREE.ShaderMaterial({ uniforms: { tA: { value: rt.texture }, uT: { value: 0 } }, vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: `uniform sampler2D tA; uniform float uT; varying vec2 vU;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uT * 0.0) * 43758.5453); }
    void main(){ vec3 x = texture2D(tA, vU).rgb; float v = 1.0 - vU.y;
      vec3 bg = mix(vec3(.00016,.00034,.00052), vec3(.0003,.00062,.0004), v); float r = length((vU - vec2(.5,.48)) / vec2(.62,.7)); bg *= 1.25 - .55 * clamp(r, 0., 1.4);
      vec3 c = 1.0 - exp(-11.0 * (x + bg)); c = pow(c, vec3(1.0/2.2));
      float n = h(gl_FragCoord.xy + floor(uT * 30.0) * 17.0) - 0.5; c += n * (1.5/255.0 + 0.006 * (1.0 - c));
      gl_FragColor = vec4(c, 1.0); }` });
const fsq = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), tone), fscene = new THREE.Scene(); fscene.add(fsq);
const S0 = new Float32Array(NT * 7), S1 = new Float32Array(NT * 7), S2 = new Float32Array(NT * 7);
window.render = t => {
  t = clamp(+t || 0, 0, DUR); const sh = .5 / 30;
  state(t - sh / 2, S0); state(t, S1); state(t + sh / 2, S2);
  let n = 0; const put = (x, y, s, w, c0, c1, c2) => { aP[n * 4] = x; aP[n * 4 + 1] = y; aP[n * 4 + 2] = s; aP[n * 4 + 3] = w; aC[n * 3] = c0; aC[n * 3 + 1] = c1; aC[n * 3 + 2] = c2; n++; };
  for (let i = 0; i < NT; i++) { const o = i * 7, wrapJump = Math.abs(S0[o] - S2[o]) > 600;
    for (const [S, f] of [[S0, 0], [S1, 1], [S2, 2]]) { if (wrapJump && f !== 1) { put(0, -999, 1, 0, 0, 0, 0); continue; } put(S[o], S[o + 1], S[o + 2], S[o + 3] / (wrapJump ? 1 : 3), S[o + 4], S[o + 5], S[o + 6]); }
    put(S1[o], S1[o + 1], S1[o + 2] * 4.6, S1[o + 3] * .16, S1[o + 4], S1[o + 5], S1[o + 6]); }   // the halo: 16 % of the energy, two levels up
  geo.attributes.a.needsUpdate = true; geo.attributes.col.needsUpdate = true; geo.setDrawRange(0, n);
  renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, cam);
  tone.uniforms.uT.value = t; renderer.setRenderTarget(null); renderer.render(fscene, cam);
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0);
window.READY = true;
