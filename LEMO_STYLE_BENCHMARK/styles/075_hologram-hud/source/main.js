// 075 · Sci-fi Hologram HUD — the first 10 s of "Last Train Home" as a hologram scan (lemo-opuscar styles/hologram-hud).
// A narrative adaptation: the subject on the projector pad is AKI herself, a wireframe of light rebuilt every frame from the shared rig
// (tubes of rings + longitudinal lines along the rig's bones: constant lengths, joint limits; the pad is a treadmill whose floor lines move
// with her planted foot). One cold hue (ice cyan) and one warm accent (her coat's red-orange), spent only on values the frame they become true.
//   S1  scan plane grows her from the pad; low 3/4 on the feet; at 0.94 s the far foot strikes the wet floor: ripples and a crown of
//       hot droplets, TGT 01 locks on the foot, a leader pulls out to FOOT STRIKE 0.94 s (locks in the accent), then docks into the rail
//   S2  crane to eye level, slow orbit: chips roll in on the beat (pace, cadence, stride, height: facts of our model); at 6.05 s the
//       wrist rises: TGT 02 locks on the watch
//   S3  a loupe irises open on the watch: a local explode, the crystal slides off along its own axis, the hands glow; the value rolls
//       and locks to 11:58:48 at 8.4 s, in the accent
//   S4  the scan plane erases her and scans in the clock tower; on the chime (9.58 s) it lights, once, into a solid hologram with a beam
// Page contract: window.render(t), DUR, READY, RIGQA.
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash } from './shared/lib/util.js';
import { Holo, prepModel, makeCamera, drawPad, drawScanPlane } from './engine/holo.js';
import * as U from './engine/hud.js';

window.DUR = DUR;
const W = 1920, H = 1080, TAU = Math.PI * 2, BEAT = .625;
const cv = document.getElementById('c'), g = cv.getContext('2d');
await Promise.all(['300 40px Rajdhani', '500 40px Rajdhani', '600 40px Rajdhani', '20px ShareTechMono'].map(f => document.fonts.load(f, 'AB09')));
const T = U.theme(192, 14);                       // ice cyan + the coat's warm red-orange (accent: locked values only)
const HO = new Holo(W, H), LW = 600, HL = new Holo(LW, LW), LC = document.createElement('canvas'); LC.width = LC.height = LW; const lc = LC.getContext('2d');

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
const hms = s => { s = Math.floor(s + 1e-6); return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

// ═════════ wireframe geometry: tubes are rings + longitudinal lines, every piece touches its neighbour
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const len = a => Math.hypot(a[0], a[1], a[2]), nrm = a => mul(a, 1 / (len(a) || 1)), cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
class Geo { constructor() { this.v = []; this.e = []; this.q = []; }
  p(x) { this.v.push(x[0], x[1], x[2]); return this.v.length / 3 - 1; } l(a, b) { this.e.push(a, b); }
  piece(id, o = {}) { return { id, v: this.v, e: this.e, q: this.q, explode: o.explode || [0, 0, 0], ...o }; } }
const basis = d => { let b1 = cross([0, 0, 1], d); if (len(b1) < 1e-4) b1 = [1, 0, 0]; b1 = nrm(b1); return [b1, nrm(cross(d, b1))]; };
function ring(G, c, d, r1, r2, n, close = true) { const [b1, b2] = basis(nrm(d)), ids = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU; ids.push(G.p(add(c, add(mul(b1, Math.cos(a) * r1), mul(b2, Math.sin(a) * r2))))); }
  for (let i = 0; i < n; i++) if (close || i < n - 1) G.l(ids[i], ids[(i + 1) % n]); return ids; }
function loft(G, rings, quads = true) { for (let k = 1; k < rings.length; k++) { const A = rings[k - 1], B = rings[k];
  for (let i = 0; i < A.length; i++) { G.l(A[i], B[i]); if (quads) G.q.push(A[i], A[(i + 1) % A.length], B[(i + 1) % A.length], B[i]); } } }
function tube(G, P, R, n = 8, sub_ = 2) { const rings = [];
  for (let s = 0; s < P.length - 1; s++) { const d = sub(P[s + 1], P[s]); for (let k = (s ? 1 : 0); k <= sub_; k++) { const u = k / sub_; rings.push(ring(G, add(P[s], mul(d, u)), d, lerp(R[s], R[s + 1], u), lerp(R[s], R[s + 1], u), n)); } }
  loft(G, rings); return rings; }
function sphere(G, c, r, up, nLat = 5, nLon = 10) { const rings = [];
  for (let i = 1; i <= nLat; i++) { const a = i / (nLat + 1) * Math.PI, y = Math.cos(a), s = Math.sin(a); rings.push(ring(G, add(c, mul(up, y * r)), up, s * r, s * r, nLon)); }
  const top = G.p(add(c, mul(up, r))), bot = G.p(add(c, mul(up, -r))); loft(G, rings, false); for (let i = 0; i < nLon; i++) { G.l(top, rings[0][i]); G.l(bot, rings[nLat - 1][i]); } }
function boxRings(G, x0, x1, y0, y1, z0, z1, ny) { const rings = []; for (let k = 0; k <= ny; k++) { const y = lerp(y0, y1, k / ny), ids = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => G.p([x, y, z])); for (let i = 0; i < 4; i++) G.l(ids[i], ids[(i + 1) % 4]); rings.push(ids); } loft(G, rings); return rings; }

// ═════════ AKI, rebuilt from the rig every frame (rig units → metres: 2.8 mm; y up; near side +z)
const UM = .0028;
function akiModel(t) {
  const J = solveProfile(poseAt(t)), xc = X(t), P3 = (p, z = 0) => [(p[0] - xc) * UM, -p[1] * UM, z], parts = [];
  const part = (id, anchor, pieces) => parts.push({ id, anchor, pieces });
  for (const k of ['f', 'n']) { const z = k === 'n' ? .085 : -.085, l = J.leg[k], c = Math.cos(l.pitch), s = Math.sin(l.pitch);
    const G = new Geo(); tube(G, [P3(l.hip, z), P3(l.knee, z), P3(l.ankle, z)], [.068, .05, .038], 8, 2);
    const F = new Geo(), toe = [l.ankle[0] + 72 * c, l.ankle[1] + 72 * s]; tube(F, [P3(l.ankle, z), P3(l.ball, z), P3(toe, z)], [.036, .032, .02], 6, 1);
    part('leg' + k, P3(l.knee, z), [G.piece('leg' + k + '-p')]); part('foot' + k, P3(l.ankle, z), [F.piece('foot' + k + '-p')]); }
  // the coat: a loft of elliptic rings between the rig's own coat outline (neck, chest, waist, hip, hem)
  const TT = (b, u, f) => [b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f];
  const lv = [[TT(J.neckBase, 6, -26), TT(J.neckBase, -6, 28), .085], [TT(J.waist, 0, -44), TT(J.waist, 0, 38), .145], [TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), .19]];
  const lvl = u => { const i = Math.min(1, Math.floor(u)), f = u - i, A = lv[i], B = lv[i + 1]; return [[lerp(A[0][0], B[0][0], f), lerp(A[0][1], B[0][1], f)], [lerp(A[1][0], B[1][0], f), lerp(A[1][1], B[1][1], f)], lerp(A[2], B[2], f) * (i === 0 ? 1 + .25 * Math.sin(f * Math.PI) : 1)]; };
  { const G = new Geo(), rs = [], us = [0, .35, .7, 1, 1.5, 2], cs = us.map(u => { const [a, b] = lvl(u); return P3([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); });
    us.forEach((u, i) => { const [a, b, rz] = lvl(u), d = sub(cs[Math.min(i + 1, cs.length - 1)], cs[Math.max(i - 1, 0)]); rs.push(ring(G, cs[i], d, Math.hypot(a[0] - b[0], a[1] - b[1]) * UM / 2, rz, 14)); });
    loft(G, rs); const N = new Geo(); tube(N, [P3(J.neckBase), P3(J.neckTop)], [.045, .042], 8, 1);
    part('torso', P3(J.waist), [G.piece('coat'), N.piece('neck')]); }
  { const G = new Geo(), up = [Math.sin(J.headA), Math.cos(J.headA), 0]; sphere(G, P3(J.headC), 46 * UM * 1.02, up, 5, 12);
    const ta = SIM.tail(t); let an = Math.PI - .25 + ta[0] + J.headA, p = [J.headC[0] - Math.cos(J.headA) * 50, J.headC[1] - Math.sin(J.headA) * 50 - 10]; const tl = [P3(p)];
    for (let i = 0; i < 3; i++) { const Lk = [46, 42, 36][i]; p = [p[0] + Math.cos(an) * Lk, p[1] + Math.sin(an) * Lk]; tl.push(P3(p)); an += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
    const Tl = new Geo(); tube(Tl, tl, [.04, .036, .028, .014], 6, 1); part('head', P3(J.headC), [G.piece('skull'), Tl.piece('tail')]); }
  for (const k of ['f', 'n']) { const z = k === 'n' ? .17 : -.17, a = J.arm[k], hand = [a.wr[0] + (a.wr[0] - a.el[0]) * .25, a.wr[1] + (a.wr[1] - a.el[1]) * .25];
    const G = new Geo(); tube(G, [P3(a.sh, z), P3(a.el, z), P3(a.wr, z), P3(hand, z)], [.046, .036, .029, .02], 8, 2); part('arm' + k, P3(a.el, z), [G.piece('arm' + k + '-p')]); }
  { const a = J.arm.n, wp = [a.el[0] + (a.wr[0] - a.el[0]) * .84, a.el[1] + (a.wr[1] - a.el[1]) * .84], d = sub(P3(a.wr), P3(a.el)), G = new Geo();
    const r1 = ring(G, P3(wp, .17), d, .038, .038, 10), r2 = ring(G, add(P3(wp, .17), mul(nrm(d), .025)), d, .038, .038, 10); loft(G, [r1, r2]);
    part('watch', P3(wp, .17 + .03), [G.piece('watch-p')]); }
  // the wet floor (it scrolls with the treadmill) and, from 0.94 s, ripples and a crown of droplets
  { const px = (SPL.x + 44 - xc) * UM, G = new Geo(), a = t - SPL.t0, sf = 1 - seg(Math.abs(px), .8, 1.3);   // it leaves the projection field at the pad's edge
    if (sf > 0) ring(G, [px, .002, -.085], [0, 1, 0], .34 * sf, .2 * sf, 36);
    for (let k = 0; k < 3; k++) { const u = clamp((a - k * .12) / .8); if (a > 0 && u > 0 && u < 1 && sf > 0) ring(G, [px, .003, -.085], [0, 1, 0], (.06 + .42 * eo(u)) * sf, (.04 + .26 * eo(u)) * sf, 32); }
    const D = new Geo();
    if (a > 0 && a < .9) for (let i = 0; i < 16; i++) { const th = i / 16 * TAU + hash(i) * .3, sp = .55 + hash(i * 3.3) * .7, vy = 1.3 + hash(i * 7.1) * 1.1, y = vy * a - 4.9 * a * a;
      if (y < 0) continue; const c = [px + Math.cos(th) * sp * a, y, -.085 + Math.sin(th) * sp * .7 * a], r = .012 + .008 * hash(i * 5.1);
      const ids = [[r, 0, 0], [0, r, 0], [-r, 0, 0], [0, -r, 0]].map(o => D.p(add(c, o))); for (let j = 0; j < 4; j++) D.l(ids[j], ids[(j + 1) % 4]); const tl = D.p(add(c, [0, -r * 3.5, 0])); D.l(ids[3], tl); }
    part('puddle', [px, 0, -.085], [G.piece('puddle-p'), D.piece('drops', { hot: true })]);
    const Sk = new Geo(); if (sf > 0) ring(Sk, [px + .06, .004, -.085], [0, 1, 0], .13 * sf, .09 * sf, 20); part('strike', [px + .06, 0, -.085], [Sk.piece('strike-p')]); }   // the strike point: TGT 01 locks here, on the floor
  return prepModel({ name: 'AKI', parts });
}

// ═════════ the watch (loupe model, case radius 1, face toward +z) and the clock tower: static wireframes; hands spin about their axes
function watchModel() {
  const parts = [], C = new Geo(); const a0 = ring(C, [0, 0, 0], [0, 0, 1], 1, 1, 48), a1 = ring(C, [0, 0, -.16], [0, 0, 1], 1, 1, 48); for (let i = 0; i < 48; i += 2) C.l(a0[i], a1[i]); ring(C, [0, 0, .02], [0, 0, 1], .9, .9, 48);
  for (const sy of [1, -1]) for (const sx of [1, -1]) boxRings(C, sx * .32, sx * .52, sy * .9, sy * 1.32, -.12, .02, 1);
  const S = new Geo(); for (const sy of [1, -1]) { let prev = null; for (let k = 0; k <= 7; k++) { const y = sy * (1.32 + k * .18), ids = [S.p([-.42, y, -.08 - k * .02]), S.p([.42, y, -.08 - k * .02])]; S.l(ids[0], ids[1]); if (prev) { S.l(prev[0], ids[0]); S.l(prev[1], ids[1]); } prev = ids; } }
  const K = new Geo(); tube(K, [[1, 0, -.06], [1.2, 0, -.06]], [.09, .09], 8, 1);
  parts.push({ id: 'case', anchor: [0, 1, 0], pieces: [C.piece('case-p'), S.piece('strap'), K.piece('crown')] });
  const D = new Geo(); for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, r0 = i % 5 ? .76 : .64; D.l(D.p([Math.sin(a) * r0, Math.cos(a) * r0, 0]), D.p([Math.sin(a) * .84, Math.cos(a) * .84, 0])); } ring(D, [0, 0, 0], [0, 0, 1], .86, .86, 60);
  parts.push({ id: 'dial', anchor: [0, 0, 0], pieces: [D.piece('dial-p')] });
  const Cr = new Geo(), cr = [ring(Cr, [0, 0, .06], [0, 0, 1], .9, .9, 32), ring(Cr, [0, 0, .13], [0, 0, 1], .72, .72, 32), ring(Cr, [0, 0, .17], [0, 0, 1], .42, .42, 32)]; for (let i = 0; i < 32; i += 4) { Cr.l(cr[0][i], cr[1][i]); Cr.l(cr[1][i], cr[2][i]); }
  parts.push({ id: 'crystal', anchor: [0, 0, .17], pieces: [Cr.piece('crystal-p', { explode: [0, 0, .7] })] });
  const hand = (id, L, w, tl, z) => { const G = new Geo(), ids = [[-w, -tl], [w, -tl], [w * .6, L], [0, L + w * 2], [-w * .6, L]].map(([x, y]) => G.p([x, y, z])); for (let i = 0; i < 5; i++) G.l(ids[i], ids[(i + 1) % 5]); return G.piece(id, { axis: { c: [0, 0, 0], d: [0, 0, 1] } }); };
  parts.push({ id: 'hands', anchor: [0, 0, .04], pieces: [hand('hH', .44, .055, .1, .03), hand('hM', .66, .04, .12, .04), hand('hS', .78, .014, .2, .05)] });
  return prepModel({ name: 'WATCH', parts });
}
const FACE = [0, 1.725, .372];
function towerModel() {
  const parts = [], A = new Geo(); boxRings(A, -.32, .32, 0, 1.5, -.32, .32, 6);
  for (const x of [-.11, .11]) for (const z of [-.32, .32]) A.l(A.p([x, 0, z]), A.p([x, 1.5, z]));
  for (const z of [-.11, .11]) for (const x of [-.32, .32]) A.l(A.p([x, 0, z]), A.p([x, 1.5, z]));
  const B = new Geo(); boxRings(B, -.37, .37, 1.5, 1.95, -.37, .37, 2);
  const Cb = new Geo(); boxRings(Cb, -.31, .31, 1.95, 2.3, -.31, .31, 1);
  for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) for (const o of [-.12, .12]) { const pts = []; for (let i = 0; i <= 8; i++) { const a = Math.PI - i / 8 * Math.PI, u = o + Math.cos(a) * .07, y = 2.18 + Math.sin(a) * .07; pts.push(i ? [u, y] : [u, 1.99]); } pts.push([o + .07, 1.99]);
    const ids = pts.map(([u, y]) => Cb.p(nx ? [nx * .312, y, u] : [u, y, nz * .312])); for (let i = 1; i < ids.length; i++) Cb.l(ids[i - 1], ids[i]); }
  const R = new Geo(), base = [[-.36, -.36], [.36, -.36], [.36, .36], [-.36, .36]].map(([x, z]) => R.p([x, 2.3, z])), apex = R.p([0, 2.8, 0]); for (let i = 0; i < 4; i++) { R.l(base[i], base[(i + 1) % 4]); R.l(base[i], apex); }
  const mid = [[-.18, -.18], [.18, -.18], [.18, .18], [-.18, .18]].map(([x, z]) => R.p([x, 2.55, z])); for (let i = 0; i < 4; i++) R.l(mid[i], mid[(i + 1) % 4]); R.l(apex, R.p([0, 3.02, 0]));
  R.q.push(base[0], base[1], apex, apex, base[1], base[2], apex, apex, base[2], base[3], apex, apex, base[3], base[0], apex, apex);
  parts.push({ id: 'tower', anchor: [0, 1, .32], pieces: [A.piece('shaft'), B.piece('stage'), Cb.piece('belfry'), R.piece('roof')] });
  const Bl = new Geo(), br = [[.05, 2.22], [.08, 2.16], [.12, 2.06], [.15, 2.0]].map(([r, y]) => ring(Bl, [0, y, 0], [0, 1, 0], r, r, 16)); loft(Bl, br);
  parts.push({ id: 'bell', anchor: [0, 2.1, 0], pieces: [Bl.piece('bell-p')] });
  const F = new Geo(); ring(F, FACE, [0, 0, 1], .2, .2, 40); ring(F, FACE, [0, 0, 1], .185, .185, 40);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; F.l(F.p(add(FACE, [Math.sin(a) * .15, Math.cos(a) * .15, 0])), F.p(add(FACE, [Math.sin(a) * .18, Math.cos(a) * .18, 0]))); }
  const hand = (id, L, w) => { const G = new Geo(), ids = [[-w, -.03], [w, -.03], [0, L]].map(([x, y]) => G.p(add(FACE, [x, y, .006]))); for (let i = 0; i < 3; i++) G.l(ids[i], ids[(i + 1) % 3]); return G.piece(id, { axis: { c: FACE, d: [0, 0, 1] } }); };
  parts.push({ id: 'clock', anchor: FACE, pieces: [F.piece('face'), hand('tH', .1, .014), hand('tM', .15, .01)] });
  return prepModel({ name: 'TOWER', parts });
}
const WATCH = watchModel(), TOWER = towerModel();
const handAng = s => { const sec = Math.floor(s + 1e-6) % 60, mn = 58 + (s % 60) / 60, hr = 11 + mn / 60; return { hH: -hr / 12 * TAU, hM: -mn / 60 * TAU, hS: -sec / 60 * TAU, tH: -hr / 12 * TAU, tM: -mn / 60 * TAU }; };

// ═════════ camera: an orbit camera, one continuous take; the target sits right of centre so the rail and cards have the left side
const K = (target, yaw, pitch, dist, cx, cy) => ({ target, yaw, pitch, dist, fov: .6, cx, cy });
const mixC = (a, b, u) => K(a.target.map((v, i) => lerp(v, b.target[i], u)), lerp(a.yaw, b.yaw, u), lerp(a.pitch, b.pitch, u), Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), u)), lerp(a.cx, b.cx, u), lerp(a.cy, b.cy, u));
const C1 = t => K([.1, .3, 0], lerp(.62, .5, seg(t, 0, 2.5)), .17, lerp(2.3, 2.12, seg(t, 0, 2.5)), 1210, 600);
const C2 = t => K([0, .86, 0], lerp(.5, .16, ss(seg(t, 3.0, 7.5))), .07, 4.6, 1250, 560);
const C3 = t => K([0, .86, 0], lerp(.16, .06, seg(t, 7.5, 9.375)), .07, 4.9, 1440, 560);
const C4 = t => K([0, 1.42, 0], lerp(.45, .36, seg(t, 9.5, 10)), .11, 6.3, 1250, 560);
function camAt(t) {
  if (t < 2.5) return C1(t);
  if (t < 7.5) return mixC(C1(2.5), C2(t), eio(seg(t, 2.5, 3.2)));
  if (t < 9.375) return mixC(C2(7.5), C3(t), eio(seg(t, 7.5, 7.85)));
  return mixC(C3(9.375), C4(t), eio(seg(t, 9.375, 9.52)));
}

// ═════════ HUD pieces built on the engine's kit
const RAIL = { x: 96, y: 200, dy: 104, w: 330 };
function chipR(x, y, c, a, roll, frame, flash) {   // a rail chip whose value rolls; the accent appears only once locked
  if (a <= 0) return; const locked = roll >= 1, w = RAIL.w;
  U.plate(g, T, x - 16, y - 16, w + 32, 72, a);
  g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = T.line(.5 * a); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y); g.stroke();
  g.fillStyle = T.line(.9 * a); g.fillRect(x, y - 2, 14, 4); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  g.font = '18px ShareTechMono'; g.fillStyle = T.dim(.9 * a); g.fillText(c.index, x, y + 32);
  g.letterSpacing = '2px'; g.font = '600 21px Rajdhani'; g.fillStyle = T.line(.95 * a); g.fillText(c.label.toUpperCase(), x + 40, y + 32); g.letterSpacing = '0px';
  g.textAlign = 'right'; g.font = '500 18px Rajdhani'; const uw = g.measureText(c.unit).width; g.fillStyle = locked ? T.acc(.95 * a) : T.line(.55 * a); g.fillText(c.unit, x + w, y + 34);
  g.font = '400 40px Rajdhani'; g.fillStyle = locked ? (flash ? T.hi(a) : T.acc(a)) : T.line(.85 * a); const s = U.rollText(c.value, roll, frame, c.index.length * 7), adv = g.measureText('0').width * 1.02;
  let vw = 0; for (const ch of s) vw += /[.:]/.test(ch) ? g.measureText(ch).width * 1.1 : adv; g.textAlign = 'left'; U.monoText(g, s, x + w - uw - 8 - vw, y + 36, adv);
  g.restore(); }
const CHIPS = [
  { index: '01', label: 'Foot strike', value: '0.94', unit: 's', t: 2.3, roll: null },
  { index: '02', label: 'Pace', value: '4.06', unit: 'm/s', t: 2.9, lock: 3.125 },
  { index: '03', label: 'Cadence', value: '174', unit: '/min', t: 3.525, lock: 3.75 },
  { index: '04', label: 'Stride', value: '1.40', unit: 'm', t: 4.15, lock: 4.375 },
  { index: '05', label: 'Height', value: '1.62', unit: 'm', t: 4.775, lock: 5.0 },
  { index: '06', label: 'Watch', value: '11:58:48', unit: '', t: 9.15, roll: null },
  { index: '07', label: 'Chime', value: '11:58:49', unit: '', t: EV.chime, lock: EV.chime + .001 }];
function floorLines(cam, a) {   // the treadmill: lines across the pad, moving with her planted foot
  const P = makeCamera(cam, W, H).project, o = new Float32Array(3), q = new Float32Array(3), off = ((X(0) - X(Math.min(cam.__t, 9.4))) * UM) % .25;
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineWidth = 1;
  for (let k = -5; k <= 5; k++) { const x = k * .25 + off; if (Math.abs(x) >= 1) continue; const zz = Math.sqrt(1 - x * x) * .98;
    P(x, 0, -zz, o); P(x, 0, zz, q); g.strokeStyle = T.line(.13 * a * (1 - Math.abs(x))); g.beginPath(); g.moveTo(o[0], o[1]); g.lineTo(q[0], q[1]); g.stroke(); }
  g.restore(); }

function frame(t) {
  const fr = Math.floor(t * 30 + 1e-6), cam = camAt(t); cam.__t = t;
  g.setTransform(1, 0, 0, 1, 0, 0); U.background(g, W, H, T, { cx: cam.cx, cy: cam.cy, px: -cam.yaw * 700, py: 0 });
  const s4 = t >= 9.375, padA = 1;
  drawPad(g, cam, W, H, { hue: T.hue, rot: t * .06, alpha: padA });
  if (!s4 || t < 9.47) floorLines(cam, s4 ? 1 - seg(t, 9.375, 9.47) : 1);
  // —— the subject
  let info = null;
  if (t < 9.47) {
    const scanY = t < .6 ? lerp(.02, 1.95, eo(seg(t, 0, .6))) : null, down = s4 ? { y: lerp(1.95, 0, seg(t, 9.375, 9.47)) } : null;
    const focus = t >= 7.6 && t < 9.375 ? 'watch' : null, flash = {};
    if (t >= 1.25 && t < 1.25 + 3 / 30) { flash.footf = 1; flash.strike = 1; } if (t >= 6.25 && t < 6.25 + 3 / 30) flash.watch = 1;
    info = HO.draw(g, akiModel(t), cam, { hue: T.hue, scan: scanY != null ? { y: scanY, band: .06 } : null, scanDown: down, explode: { drops: 1 }, focus, dim: .35, flash });
    if (scanY != null) drawScanPlane(g, cam, W, H, scanY, { hue: T.hue, r: 1.05, rot: t * .4, alpha: 1 - seg(t, .5, .6) });
    if (down) drawScanPlane(g, cam, W, H, down.y, { hue: T.hue, r: 1.05, rot: t * .4 });
  }
  if (s4) {
    const ty = lerp(0, 3.1, eo(seg(t, 9.4, 9.56))), ch = t >= EV.chime, k = seg(t, EV.chime, EV.chime + .12);
    const ti = HO.draw(g, TOWER, cam, { hue: T.hue, scan: ty < 3.1 ? { y: ty, band: .08 } : null, angle: handAng(W_T(t)), solid: ch ? .85 * eo(k) : 0, wave: ch ? { y: lerp(0, 3.1, seg(t, EV.chime, EV.chime + .4)), w: .14 } : null,
      flash: ch && t < EV.chime + 3 / 30 ? { bell: 1, clock: 1 } : {}, gain: 1 + (ch ? .25 : 0) });
    if (ty < 3.1) drawScanPlane(g, cam, W, H, ty, { hue: T.hue, r: 1.05, rot: t * .4 });
    if (ch) U.beam(g, T, ti.project, .9 * eo(k), t, { y1: 3.1, r1: .55 });
    info = { ...ti, akiGone: true };
    // the marker on the clock face: its value locks in the accent at the chime
    if (ch) { const p = ti.anchor.clock; U.marker(g, T, [p[0], p[1]], 'CHIME', clamp(k * 3), seg(t, EV.chime, EV.chime + .35), -1); }
  }
  // —— target boxes, leaders, the S1 card (docks into the rail), the rail
  if (info && !info.akiGone) {
    const kF = seg(t, EV.splash, EV.splash + .2), outF = 1 - seg(t, 2.15, 2.35), onPad = 1 - seg(Math.abs((SPL.x + 44 - X(t)) * UM), .6, .95);   // the strike point rides the treadmill off the pad
    if (kF > 0 && outF * onPad > 0) U.targetBox(g, T, info.bbox.strike, kF, { tag: 'TGT 01 · FOOT STRIKE', flash: t >= 1.25 && t < 1.25 + 3 / 30, alpha: outF * onPad });
    const kW = seg(t, EV.watchUp, EV.watchUp + .2), outW = 1 - seg(t, 7.5, 7.7);
    if (kW > 0 && outW > 0 && info.bbox.watch) U.targetBox(g, T, info.bbox.watch, kW, { tag: 'TGT 02 · WATCH', flash: t >= 6.25 && t < 6.25 + 3 / 30, alpha: outW, pad: 30 });
    // S1: leader → spec card, value rolls and locks on the downbeat (1.25 s)
    if (t > 1.0 && t < 2.4) { const a = outF, an = info.anchor.strike, card = [130, 330];
      if (onPad > 0 && an) U.leader(g, T, [an[0], an[1]], [card[0] + 560, card[1] + 70], [card[0] + 470, card[1] + 70], seg(t, 1.0, 1.4), { alpha: a * onPad, pulse: seg(t, 1.25, 1.7) });
      U.specCard(g, T, card[0], card[1], { label: 'Foot strike', value: '0.94', unit: 's', detail: 'Far foot · wet floor · 11:58:40' },
        { reveal: seg(t, 1.05, 1.35), roll: seg(t, 1.1, 1.25), detail: seg(t, 1.3, 1.7), frame: fr, flash: t >= 1.25 && t < 1.25 + 3 / 30 }, { w: 440, index: '01', alpha: a, big: 120 }); }
  }
  for (let i = 0; i < CHIPS.length; i++) { const c = CHIPS[i], a = clamp((t - c.t) / .2); if (a <= 0) continue;
    const roll = c.lock ? seg(t, c.t, c.lock) : 1, locked = roll >= 1, lockT = c.lock ?? c.t, flash = locked && t < lockT + 3 / 30 + (c.lock ? 0 : .1) && t >= lockT;
    chipR(RAIL.x, RAIL.y + i * RAIL.dy + (1 - eo(a)) * 14, c, a, roll, fr, flash); }
  // —— S3: the loupe (frame in frame): the watch in a local explode, its value rolling to the true time
  if (t >= 7.5 && t < 9.375) {
    const r = 290 * eo(seg(t, 7.5, 7.75)) * (1 - eio(seg(t, 9.2, 9.375))), L = [760, 450];
    if (info && info.anchor.watch && r > 4) { const an = info.anchor.watch, d = Math.hypot(an[0] - L[0], an[1] - L[1]);
      U.leader(g, T, [an[0], an[1]], [L[0] + (an[0] - L[0]) / d * r, L[1] + (an[1] - L[1]) / d * r], [L[0] + (an[0] - L[0]) / d * r, L[1] + (an[1] - L[1]) / d * r], seg(t, 7.5, 7.7)); }
    if (r > 2) {
      lc.setTransform(1, 0, 0, 1, 0, 0); lc.fillStyle = T.bg0; lc.fillRect(0, 0, LW, LW); const gr = lc.createRadialGradient(LW / 2, LW / 2, 0, LW / 2, LW / 2, LW / 2); gr.addColorStop(0, T.bg1); gr.addColorStop(1, 'rgba(0,0,0,0)'); lc.fillStyle = gr; lc.fillRect(0, 0, LW, LW);
      const camL = { target: [0, 0, 0], yaw: lerp(.42, .3, seg(t, 7.5, 9.375)), pitch: lerp(.32, .26, seg(t, 7.5, 9.375)), dist: lerp(5.2, 4.5, eio(seg(t, 7.5, 9.375))), fov: .6, cx: LW / 2, cy: LW / 2 + 10 };
      const ex = eio(seg(t, 7.75, 8.1)) * (1 - eio(seg(t, 9.05, 9.3)));
      HL.draw(lc, WATCH, camL, { hue: T.hue, explode: { crystal: ex, hands: ex > .02 ? 1 : 0 }, angle: handAng(W_T(t)), flash: t >= 8.4 && t < 8.4 + 3 / 30 ? { hands: 1 } : {} });
      g.save(); g.beginPath(); g.arc(L[0], L[1], r, 0, TAU); g.clip(); g.drawImage(LC, L[0] - LW / 2, L[1] - LW / 2); g.restore();
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = T.line(.85); g.lineWidth = 2; g.beginPath(); g.arc(L[0], L[1], r, 0, TAU); g.stroke();
      g.strokeStyle = T.line(.5); g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 72; i++) { const a = i / 72 * TAU, r2 = r + (i % 6 ? 6 : 13); g.moveTo(L[0] + Math.cos(a) * r, L[1] + Math.sin(a) * r); g.lineTo(L[0] + Math.cos(a) * r2, L[1] + Math.sin(a) * r2); } g.stroke(); g.restore();
      g.save(); g.font = '18px ShareTechMono'; g.fillStyle = T.line(.75 * clamp(r / 290)); g.textAlign = 'left'; g.fillText(`LOUPE ×${(4.6 / lerp(5.2, 4.5, eio(seg(t, 7.5, 9.375))) * 9).toFixed(1)} · WRIST`, L[0] - r * .7, L[1] - r - 22); g.restore();
      // the value card under the loupe: rolls in, the seconds read 47 until 8.4 s, then lock to 48 in the accent
      const ca = (1 - seg(t, 9.05, 9.25)) * clamp((t - 7.75) * 5), str = t < 8.4 ? '11:58:47' : '11:58:48';
      U.specCard(g, T, L[0] - 230, L[1] + 330, { label: 'Watch', value: str, unit: '' }, { reveal: seg(t, 7.75, 8.0), roll: t >= 8.4 ? 1 : seg(t, 7.8, 8.4) * .999, frame: fr, flash: t >= 8.4 && t < 8.4 + 3 / 30 }, { w: 460, index: '06', alpha: ca, big: 96 });
    }
  }
  U.vignette(g, W, H, .62);
  U.chrome(g, W, H, T, { tl: s4 ? 'SUBJECT // STATION CLOCK · TOWER' : 'SUBJECT // AKI · RUN SCAN', tr: `LIVE ${hms(W_T(t))}`, bl: `FRAME ${String(fr).padStart(4, '0')} · 30 FPS`, br: s4 ? 'PAD 01 · SOLID' : 'PAD 01 · TREAD 4.06 M/S', px: -cam.yaw * 900 });
}
window.render = t => frame(t);
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
