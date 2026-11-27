// 071 · Scratch Film — the first 10 s of "Last Train Home" scratched through black emulsion (lemo-opuscar styles/scratch-film).
// Black is the ground, everything bright is a cut in one cream, colour is transparent dye in the grooves, every drawing redrawn
// 15 times a second so the lines boil. One dye, one kind of thing for the whole film: red = AKI (her coat), blue = water (the
// puddle, the splash, the rain), yellow = time (her watch, the station clock).
//   S1  a cut across the horizon: the pavement line cut live behind the hot point; lit windows as scratched light; AKI cut from the
//       shared rig runs in and her foot goes into the blue puddle (0.94 s): dye drops and chips fly
//   S2  tracking alongside her, specks streaming in parallax; at the raise (6.05 s) a yellow point lights on her wrist with a bloom
//   S3  a push into that point of light: the dial cut live in the dark, the hands, the time cut as words; the seconds hand is re-cut
//       at 48 on the tick (8.4 s)
//   S4  a pull out to the station tower; on the chime its clock face lights yellow with a bloom
// Engine: engine/base.js copied unchanged (scratch, dye, hatch, glow, emulsion / dust / grain plates). Page contract:
// window.render(t), DUR, READY, RIGQA.
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { back as backE, mulberry } from './shared/lib/util.js';

window.DUR = DUR;
const TAU = Math.PI * 2;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const SC = mk(W, H), sctx = SC.getContext('2d');
{ const f = new FontFace('MONO', "url('fonts/ibm-plex-mono-latin-500-normal.woff')"); await f.load(); document.fonts.add(f); }
const EMs = [], DUSTs = [], GRAINs = [];
for (let i = 0; i < 4; i++) { EMs.push(makeEmulsion(9 + i * 17)); DUSTs.push(makeDust(55 + i * 13)); }
for (let i = 0; i < 3; i++) GRAINs.push(makeGrain(7 + i));

// ═════════ the run (shared by every style)
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const X = t => RUN.pelvisAt(t)[0];
function poseAt(t) {
  const S_ = RUN.pose(t);
  const up = backE(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  const w = clamp(up, 0, 1.1) * (1 - dn); S_.watch = w;
  if (w > 0) { const J0 = solveProfile(S_), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S_.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S_.arms.f.sh *= 1 - .45 * wm; S_.head += .26 * wm; S_.neck += .08 * wm; }
  return S_;
}
const SIM = (() => {
  const dt = 1 / 240, n = Math.ceil(11 / dt), flap = new Float32Array(n), tail = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  let a = .3, va = 0; const th = [-.2, -.1, 0], vt = [0, 0, 0];
  const py = t => RUN.pelvisAt(t)[1], ay = t => (py(t + dt) - 2 * py(t) + py(t - dt)) / (dt * dt);
  for (let i = 0; i < n; i++) { const t = -.5 + i * dt, A = ay(t), wv = clamp((t - EV.watchUp) / .3, 0, 1) * (1 - clamp((t - EV.watchDown) / .3, 0, 1));
    va += (-46 * (a - (.34 + .06 * wv)) - 5.5 * va + .011 * A) * dt; a += va * dt; flap[i] = a;
    for (let k = 0; k < 3; k++) { const par = k ? th[k - 1] : -.1, rest = .16 + .05 * k; vt[k] += (-60 * (th[k] - (par + rest)) - 6 * vt[k] + .014 * A * (k + 1) * .6) * dt; th[k] += vt[k] * dt; tail[k][i] = th[k]; } }
  const at = (arr, t) => arr[clamp(Math.round((t + .5) / dt), 0, n - 1)];
  return { flap: t => at(flap, t), tail: t => tail.map(a => at(a, t)) };
})();

// ═════════ marks
const ring = (cx, cy, rx, ry, n = 40, a0 = 0, a1 = TAU) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
// a polyline densified along its edges, so the needle's spline keeps the corners square instead of rounding them into ovals
const dense = (P, step = 14) => { const o = []; for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let k = 0; k < n; k++) o.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]); } o.push(P[P.length - 1]); return o; };
// the hot point: a white core, a glow and a few chips flying off where the needle is cutting
function hotPoint(x, y, dn, s = 1) { glow(x, y, 46 * s, 'rgba(255,244,220,.85)', 1); disc(x, y, 5 * s, '#ffffff'); rs(dn * 31 + 7);
  for (let i = 0; i < 6; i++) { const a = rr(0, TAU), l = rr(6, 26) * s; G.strokeStyle = CREAM; G.globalAlpha = .7; G.lineWidth = 1.2; G.beginPath(); G.moveTo(x, y); G.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); G.stroke(); } G.globalAlpha = 1; }
// a path cut progressively behind the hot point (p = 0..1)
function cutIn(P, p, o, dn) { if (p <= 0) return; const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const tot = L[L.length - 1], d = tot * clamp(p, 0, 1), Q = [P[0]]; for (let i = 1; i < P.length; i++) { if (L[i] <= d) Q.push(P[i]); else { const f = (d - L[i - 1]) / (L[i] - L[i - 1]); Q.push([lerp(P[i - 1][0], P[i][0], f), lerp(P[i - 1][1], P[i][1], f)]); break; } }
  scratch(Q, o); if (p < 1) hotPoint(...Q[Q.length - 1], dn, o.spark ?? 1); }
// AKI, cut from the rig: limbs as pairs of needle lines, the coat outlined and dyed red, a cut face, a black (uncut) head of hair
function aki(t, M, k, dn) {
  const J = solveProfile(poseAt(t)), w = Math.max(1.6, 4.2 * k);
  const side = (a, b, ra, rb) => { const A = M(a), B = M(b), dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    scratch([[A[0] + nx * ra * k, A[1] + ny * ra * k], [B[0] + nx * rb * k, B[1] + ny * rb * k]], { w, tail: false }); scratch([[A[0] - nx * ra * k, A[1] - ny * ra * k], [B[0] - nx * rb * k, B[1] - ny * rb * k]], { w: w * .8, tail: false }); };
  const leg = kk => { const l = J.leg[kk], c = Math.cos(l.pitch), s = Math.sin(l.pitch), F = ([u, v]) => M([l.ankle[0] + u * c - v * s, l.ankle[1] + u * s + v * c]);
    side(l.hip, l.knee, 22, 17); side(l.knee, l.ankle, 17, 12); const sh = [[-15, -30], [18, -8], [46, -2], [72, 6], [72, 15], [-24, 15], [-28, 0]].map(F); scratch(sh.concat([sh[0]]), { w, tail: false }); hatch(sh, CREAM, { gap: 5 * k + 2, a: .5, lw: [1, 2] }); };
  const arm = kk => { const a = J.arm[kk], h = [a.wr[0] + (a.wr[0] - a.el[0]) * .25, a.wr[1] + (a.wr[1] - a.el[1]) * .25]; side(a.sh, a.el, 15, 12); side(a.el, a.wr, 12, 10); scratch([M(a.wr), M(h)], { w: w * 2.2 }); };
  arm('f'); leg('f');
  const TT = (b, u, f) => M([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
  const fa = SIM.flap(t), ha = fa + 1.75, hp = [J.pelvis[0] - 60 * J.uL[0] - 56 * J.fL[0], J.pelvis[1] - 60 * J.uL[1] - 56 * J.fL[1]];
  const coat = [TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), M([hp[0] + Math.cos(ha) * 70, hp[1] + Math.sin(ha) * 70]), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)];
  hatch(coat, RED, { gap: 5 * k + 2, a: .85, ang: .7, lw: [2, 4.4 * k + 1] }); scratch(coat.concat([coat[0]]), { w: w * 1.1, tail: false });
  leg('n');
  const hc = M(J.headC), hr = 46 * k, HR = q => { const c = Math.cos(J.headA), s = Math.sin(J.headA); return M([J.headC[0] + q[0] * c - q[1] * s, J.headC[1] + q[0] * s + q[1] * c]); };
  const face = [[16, -44], [34, -20], [44, -3], [37, 8], [39, 16], [34, 23], [32, 35], [12, 46], [-10, 48], [-36, 38], [-50, 8], [-46, -26], [-22, -48], [0, -60]].map(HR);
  const facePart = [[22, -40], [34, -20], [44, -3], [37, 8], [39, 16], [34, 23], [32, 35], [12, 46], [-6, 46], [-4, 10], [4, -20]].map(HR);
  hatch(facePart, CREAM, { gap: 4 * k + 2, a: .6, lw: [1, 2.2] }); scratch(face.concat([face[0]]), { w, tail: false });
  { const ta = SIM.tail(t); let an = Math.PI - .25 + ta[0] + J.headA, p = [J.headC[0] - Math.cos(J.headA) * 50, J.headC[1] - Math.sin(J.headA) * 50 - 10]; const tail = [M(p)];
    for (let i = 0; i < 3; i++) { const Lk = [46, 42, 36][i]; p = [p[0] + Math.cos(an) * Lk, p[1] + Math.sin(an) * Lk]; tail.push(M(p)); an += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
    scratch(tail, { w: w * 2.4 }); scratch(tail.map(q => [q[0], q[1] + 4 * k]), { w: w * 1.2 }); }
  arm('n');
  const a = J.arm.n, wp = M([a.el[0] + (a.wr[0] - a.el[0]) * .84, a.el[1] + (a.wr[1] - a.el[1]) * .84]);
  return { J, wp };
}
// the street: the pavement line, lit windows as scratched light (no flat fills), the puddle in blue dye, its splash
function street(t, M, k, dn, o = {}) {
  const gy = M([0, 0])[1];
  for (let i = -3; i < 24; i++) { const x0 = SPL.x - 2400 + i * 1700, A = M([x0 + 140, -900]), B = M([x0 + 1060, -260]); if (B[0] < -80 || A[0] > W + 80) continue;
    hatch(rect(A[0], A[1], B[0] - A[0], B[1] - A[1]), CREAM, { gap: 9, a: .32, ang: 1.2, lw: [1, 2] });
    scratch(dense([[A[0], A[1]], [B[0], A[1]], [B[0], B[1]], [A[0], B[1]], [A[0], A[1]]]), { w: 2.2, tail: false });
    for (let q = 1; q < 3; q++) { const x = lerp(A[0], B[0], q / 3); scratch([[x, A[1]], [x, B[1]]], { w: 1.6, tail: false }); }
    const S0 = M([x0 + 40, -1100]), S1 = M([x0 + 1600, -980]); scratch([[S0[0], S1[1]], [S1[0], S1[1]]], { w: 2, tail: false });
    const D0 = M([x0 + 1200, -760]); scratch(dense([[D0[0], gy], [D0[0], D0[1]], [D0[0] + 300 * k, D0[1]], [D0[0] + 300 * k, gy]]), { w: 1.8, tail: false }); }
  const pc = M([SPL.x + 44, 6]);
  dye(ring(pc[0], pc[1], 300 * k, 32 * k, 30), { col: BLUE, w: 40 * k + 6, n: 7, a: .7 });
  hatch(ring(pc[0], pc[1], 280 * k, 26 * k, 30), BLUE, { gap: 5, a: .7, ang: .1, lw: [1.4, 3] });
  const a = t - EV.splash;
  if (a > 0 && a < 1.4) { for (let j = 0; j < 3; j++) { const u = a - j * .15; if (u <= 0 || u > 1.2) continue; scratch(ring(pc[0], pc[1], (40 + 280 * Math.pow(u / 1.2, .6)) * k, (5 + 30 * Math.pow(u / 1.2, .6)) * k, 34), { w: 2.4 * (1 - u / 1.2) + .8 }); }
    const r = mulberry(711); for (let i = 0; i < 18; i++) { const an = (200 + r() * 140) * Math.PI / 180, v = 900 + r() * 1300, x = SPL.x + 44 + Math.cos(an) * v * a, y = Math.sin(an) * v * a + 2600 * a * a; if (y > 0 || a > 1) continue; const q = M([x, y]); dye([[q[0] - 6, q[1] - 10], [q[0] + 6, q[1] + 10]], { col: BLUE, w: 14 * k + 4, n: 4, a: .85 }); scratch(ring(q[0], q[1], 6 * k + 3, 8 * k + 3, 10), { w: 1.6, tail: false }); } }
  if (o.cut != null) cutIn([[-30, gy], [W + 30, gy]], o.cut, { w: 4, tail: false, spark: 1.2 }, dn); else scratch([[-30, gy], [W + 30, gy]], { w: 4, tail: false });
  // rain, as short blue dye strokes falling on twos
  for (let i = 0; i < 46; i++) { const x = (h1(i) * (W + 300) + t * 80) % (W + 300) - 150, y = (h1(i + 9) * H + t * 1500) % H; dye([[x, y], [x - 8, y + 40]], { col: BLUE, w: 3, n: 2, a: .55 }); }
}

// ═════════ the shots (each draws on the black emulsion, in screen space)
function S1(t, dn) { const k = .82, cx = SPL.x + 260, M = p => [W / 2 + (p[0] - cx) * k, 820 + p[1] * k];
  street(t, M, k, dn, { cut: eo(seg(t, 0, .5)) }); if (t > .3) aki(t, p => M([p[0] + (X(t) - X(t)), p[1]]), k, dn); }
function S2(t, dn) { const k = .95, xh = X(t), cx = xh + 140, M = p => [W / 2 + (p[0] - cx) * k, 860 + p[1] * k];
  street(t, M, k, dn); for (let i = 0; i < 26; i++) { const x = ((h1(i * 3) * W * 2 - (xh - X(2.5)) * k * 1.6) % (W + 200) + W + 200) % (W + 200) - 100, y = 900 + h1(i) * 160; scratch([[x, y], [x + 30, y]], { w: 2, a: .6, tail: false }); }
  const A = aki(t, M, k, dn);
  // the watch: a yellow point of light on her wrist, switched on with a bloom
  const on = seg(t, EV.watchUp, EV.watchUp + .15); if (on > 0) { glow(A.wp[0], A.wp[1], 90 * (1 + .6 * Math.exp(-(t - EV.watchUp) * 5)), 'rgba(255,200,28,.8)', on); hatch(ring(A.wp[0], A.wp[1], 13, 13, 16), YEL, { gap: 3, a: .95, lw: [1.4, 3] }); scratch(ring(A.wp[0], A.wp[1], 15, 15, 16), { w: 2.4, tail: false }); }
  return A; }
function S3(t, dn) {
  // the push into the point of light ends here: the dial is cut live in the dark, then the hands; the time cut beside it as words
  const C = [1120, 520], R = 330, u = seg(t, 7.5, 7.85);
  glow(C[0], C[1], 520, 'rgba(255,200,28,.22)', 1);
  dye(ring(C[0], C[1], R + 30, R + 30, 60), { col: YEL, w: 46, n: 8, a: .75 });
  cutIn(ring(C[0], C[1], R, R, 70, -Math.PI / 2, Math.PI * 1.5), u, { w: 6, tail: false }, dn);
  cutIn(ring(C[0], C[1], R + 44, R + 44, 70, -Math.PI / 2, Math.PI * 1.5), seg(t, 7.55, 7.9), { w: 3, tail: false }, dn);
  for (let i = 0; i < 60; i++) { if (seg(t, 7.8 + i * .004, 7.84 + i * .004) <= 0) continue; const a = i / 60 * TAU, L = i % 5 ? 16 : 46; scratch([[C[0] + Math.sin(a) * (R - 18), C[1] - Math.cos(a) * (R - 18)], [C[0] + Math.sin(a) * (R - 18 - L), C[1] - Math.cos(a) * (R - 18 - L)]], { w: i % 5 ? 2.2 : 5, tail: false }); }
  const hand = (fr, L, w, col) => { const a = fr * TAU, P = [C, [C[0] + Math.sin(a) * L, C[1] - Math.cos(a) * L]]; if (col) dye(P, { col, w: w * 3, n: 4, a: .9 }); scratch(P, { w }); };
  if (t > 7.9) { hand((11 + 58 / 60) / 12, 170, 9); hand(58 / 60, 260, 6); }
  const s = 47 + (t >= 8.4 ? 1 : 0); if (t > 8.0) { hand(s / 60, 290, 3, YEL); if (t >= 8.4 && t < 8.55) { const a = 48 / 60 * TAU; hotPoint(C[0] + Math.sin(a) * 290, C[1] - Math.cos(a) * 290, dn); } }
  disc(C[0], C[1], 9, CREAM);
  // the time, cut into the dark as words (rendered once, revealed left to right behind the hot point)
  const img = lettering(`11:58:${s}`, { col: CREAM, font: 'mono', var: s, bold: 3, texture: true }), p = seg(t, 8.0, 8.35);
  if (p > 0) { const sc = .62, w = img.width * sc; G.save(); G.beginPath(); G.rect(120, 380, w * p, 220); G.clip(); G.drawImage(img, 120, 400, w, img.height * sc); G.restore(); if (p < 1) hotPoint(120 + w * p, 470, dn, .8); }
}
function S4(t, dn) {
  const u = eo(seg(t, 9.375, 10)), k = lerp(1.25, .7, u), C0 = [960, 380];
  const T = (x, y) => [C0[0] + x * k, C0[1] + y * k];
  // the tower: scratched outline, its storeys, the belfry; the town's roofline below; the clock face lights yellow on the chime
  const tw = [T(-150, 900), T(-150, -180), T(-180, -200), T(0, -420), T(180, -200), T(150, -180), T(150, 900)]; scratch(dense(tw), { w: 4, tail: false });
  for (const y of [-40, 260, 560]) scratch([T(-150, y), T(150, y)], { w: 2, tail: false });
  scratch(ring(...T(0, -110), 50 * k, 56 * k, 24, Math.PI, TAU), { w: 2.4, tail: false });
  for (let i = 0; i < 18; i++) { const x = -1100 + i * 130, hh = 60 + h1(i) * 120; if (Math.abs(x) < 220) continue; scratch(dense([T(x, 900), T(x, 900 - hh), T(x + 120, 900 - hh), T(x + 120, 900)]), { w: 2, tail: false }); if (h1(i + 3) > .4) hatch(rect(...T(x + 30, 900 - hh + 24), 30 * k, 26 * k), CREAM, { gap: 4, a: .5 }); }
  const cc = T(0, 110), on = t >= EV.chime;
  if (on) { const b = Math.exp(-(t - EV.chime) * 4); glow(cc[0], cc[1], 260 * k * (1 + b), 'rgba(255,200,28,.85)', 1); hatch(ring(cc[0], cc[1], 96 * k, 96 * k, 30), YEL, { gap: 4, a: .9, lw: [1.6, 3.6] }); }
  scratch(ring(cc[0], cc[1], 100 * k, 100 * k, 40), { w: 3.4, tail: false });
  for (const [fr, L, w] of [[(11 + 58 / 60) / 12, 48, 6], [58 / 60, 78, 4]]) scratch([cc, [cc[0] + Math.sin(fr * TAU) * L * k, cc[1] - Math.cos(fr * TAU) * L * k]], { w });
  for (let i = 0; i < 46; i++) { const x = (h1(i) * (W + 300) + t * 80) % (W + 300) - 150, y = (h1(i + 9) * H + t * 1500) % H; dye([[x, y], [x - 8, y + 40]], { col: BLUE, w: 3, n: 2, a: .5 }); }
}

// ═════════ one frame: emulsion → marks (on twos) → the light pass (halation, dust, vignette, flicker, weave, grain)
window.render = t => {
  const dn = Math.floor(t * 15 + 1e-6), tq = dn / 15;
  setG(sctx); rs(dn * 977 + 13);
  sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.globalAlpha = 1; sctx.globalCompositeOperation = 'source-over'; sctx.filter = 'none';
  sctx.drawImage(EMs[dn % 4], 0, 0);
  if (tq < 2.5) S1(tq, dn);
  else if (tq < 7.5) {
    const A = S2(tq, dn);
    // the push into the yellow point (from 7.2 s): everything else falls away into the black
    const pu = ei(seg(t, 7.2, 7.5)); if (pu > 0 && A) { sctx.save(); sctx.fillStyle = `rgba(5,4,3,${pu})`; sctx.fillRect(0, 0, W, H); sctx.restore(); glow(A.wp[0], A.wp[1], lerp(60, 900, pu), 'rgba(255,200,28,.9)', 1); }
  }
  else if (tq < 9.375) S3(tq, dn);
  else S4(tq, dn);
  setG(sctx); sctx.globalAlpha = 1;
  const wx = Math.sin(dn * 1.7) * .9, wy = Math.cos(dn * 1.3) * 1.1;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.drawImage(SC, wx, wy);
  ctx.save(); ctx.filter = 'blur(9px)'; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .4; ctx.drawImage(SC, wx, wy); ctx.restore();
  ctx.save(); ctx.filter = 'blur(28px)'; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .2; ctx.drawImage(SC, wx, wy); ctx.restore();
  ctx.drawImage(DUSTs[dn % DUSTs.length], 0, 0);
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.42)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = `rgba(0,0,0,${.05 * h1(dn * 3.3)})`; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(GRAINs[Math.floor(t * 30) % GRAINs.length], 0, 0);
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
