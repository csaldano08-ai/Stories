// 047 · Scratchboard Long Take — the first 10 s of "Last Train Home" as a three-dimensional night street printed in ink and
// paper with one red (AKI's jacket) and a warm yellow kept for light and one material (her gold watch), crossed by one camera
// move (lemo-opuscar styles/printed-long-take). The clip's three cuts keep their times and become the medium's own joins:
// through the steam of a noodle shop (2.5 s), behind a poster column that passes the lens (7.5 s), and a sheet peeled from the
// corner onto the city printed again from above (9.375 s). Every surface is a shader that decides ink or paper; cuts are fixed in
// world space (in direction space for the sky); the wet pavement and the puddle reflect the shop lights and AKI herself by
// tracing the mirrored ray to the facade and to her figure plane.
// Engine: engine/look.js copied unchanged; print.js, world_kit.js, textures.js and props.js are excerpts of the demo (their
// headers say what was taken). Page contract: window.render(t), DUR, READY, RIGQA.
import * as THREE from 'three';
import { C, U, GLSL_HASH, skyMat, billboardMat, carveMat, inkMat } from './engine/look.js';
import { renderer, rtA, rtB, scene, camera, printMat, postScene, postCam, draw } from './engine/print.js';
import { canvasTex, billboards, fillBoards } from './engine/world_kit.js';
import { cut, mistAtlas, INK, PAPER, RED, YELLOW } from './engine/textures.js';
import { carvedText } from './engine/props.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash, mulberry, vnoise, TAU } from './shared/lib/util.js';

window.DUR = DUR;
await document.fonts.load('700 60px "Newsreader"');

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
// loose parts, pre-simulated at 240 Hz for determinism: the jacket hem (damped pendulum driven by the pelvis bob) and the ponytail chain
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

// ═════════ world units: metres. x along the street (she runs +x), y up, z toward the camera; her figure plane is z = 0
const M = .0028;                                            // metres per rig unit: AKI ≈ 1.62 m, the run ≈ 4.1 m/s
const wx = rx => (rx - SPL.x) * M;
const xA = t => wx(X(t));
const ZF = -2.4, ZC = 3.2;                                  // the shop fronts, the edge of the pavement (lamps and bollards)
const XA = -20, XB = 76, EMH = 12, EMK = 32;                // extent of the facade light map, px per metre
const PH = EV.splash - Math.floor(EV.splash * 12) / 12;
const step12 = t => Math.floor((t - PH) * 12 + 1e-6) / 12 + PH;
U.uL.value.set(-.32, .82, -.48).normalize();                // one light: moon and city glow from above, a little from the left

// ═════════ AKI: an ink silhouette cut on canvas from the rig every frame, the jacket the one red, the watch the gold
const AKC = document.createElement('canvas'); AKC.width = AKC.height = 2048;
const ag = AKC.getContext('2d');
const akTex = canvasTex(AKC, true);
const capPath = (P, a, b, r0, r1, n = 8) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  for (let i = 0; i <= n; i++) { const t = Math.PI / 2 + i / n * Math.PI; const x = a[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * r0, y = a[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * r0; i ? P.lineTo(x, y) : P.moveTo(x, y); }
  for (let i = 0; i <= n; i++) { const t = -Math.PI / 2 + i / n * Math.PI; P.lineTo(b[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * r1, b[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * r1); }
  P.closePath(); return P;
};
const polyP = (P, pts) => { pts.forEach((p, i) => i ? P.lineTo(p[0], p[1]) : P.moveTo(p[0], p[1])); P.closePath(); return P; };
function akiParts(t) {
  const S_ = poseAt(t), J = solveProfile(S_);
  const legs = {}, arms = {}, hands = {}, cuts = [];
  for (const kk of ['f', 'n']) {
    const l = J.leg[kk], P = new Path2D();
    capPath(P, l.hip, l.knee, 25, 19); capPath(P, l.knee, l.ankle, 19, 14);
    const c = Math.cos(l.pitch), s = Math.sin(l.pitch), F = ([u, v]) => [l.ankle[0] + u * c - v * s, l.ankle[1] + u * s + v * c];
    polyP(P, [F([-16, -36]), F([17, -36]), F([19, -8]), F([46, -2]), F([72, 6]), F([74, 17]), F([-25, 17]), F([-29, 0])]);
    legs[kk] = P;
    // knife cuts that ride the bones: a fold line on the thigh, the shin's edge, the boot's welt
    const along = (a, b, u0, u1, off) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L; return [a[0] + dx * u0 + nx * off, a[1] + dy * u0 + ny * off, a[0] + dx * u1 + nx * off, a[1] + dy * u1 + ny * off]; };
    cuts.push([kk, ...along(l.hip, l.knee, .18, .7, 9), 4.2], [kk, ...along(l.knee, l.ankle, .12, .78, -6), 3.6], [kk, ...F([-22, 11]), ...F([66, 11]), 3]);
    const a = J.arm[kk], A = new Path2D();
    capPath(A, a.sh, a.el, 17, 14); capPath(A, a.el, a.wr, 14, 12);
    arms[kk] = A;
    const h = [a.wr[0] + (a.wr[0] - a.el[0]) * .2, a.wr[1] + (a.wr[1] - a.el[1]) * .2];
    hands[kk] = { h, wr: a.wr, el: a.el };
  }
  const TT = (b, u, f) => [b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f];
  const torso = polyP(new Path2D(), [TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)]);
  // the hem: a flap hinged at the back of the hip, swinging with the run
  const fa = SIM.flap(t), hb = TT(J.pelvis, -60, -56), hc = Math.cos(fa + 1.75), hs = Math.sin(fa + 1.75);
  const hem = polyP(new Path2D(), [TT(J.pelvis, -40, -50), TT(J.pelvis, -96, -58), [hb[0] + hc * 70 - hs * 14, hb[1] + hs * 70 + hc * 14], [hb[0] + hc * 64 + hs * 10, hb[1] + hs * 64 - hc * 10]]);
  const hcen = J.headC, HR = q => { const c = Math.cos(J.headA), s = Math.sin(J.headA); return [hcen[0] + q[0] * c - q[1] * s, hcen[1] + q[0] * s + q[1] * c]; };
  const head = polyP(new Path2D(), [[16, -44], [34, -20], [44, -3], [37, 8], [39, 16], [34, 23], [32, 35], [12, 46], [-10, 48], [-36, 38], [-50, 8], [-46, -26], [-22, -48]].map(HR));
  const hair = polyP(new Path2D(), [[22, -44], [0, -60], [-36, -54], [-58, -22], [-60, 12], [-46, 40], [-22, 44], [-10, 18], [-2, -14], [8, -32]].map(HR));
  // ponytail: a three-link chain from the back of the head
  const ta = SIM.tail(t), base = HR([-50, -14]); let ang = Math.PI - .25 + ta[0] + J.headA, p = base; const tail = new Path2D(); const tp = [p];
  for (let k = 0; k < 3; k++) { const L = [46, 42, 36][k]; p = [p[0] + Math.cos(ang) * L, p[1] + Math.sin(ang) * L]; tp.push(p); ang += ta[(k + 1) % 3] * .6 - ta[k] * .3; }
  for (let k = 0; k < 3; k++) capPath(tail, tp[k], tp[k + 1], [15, 12, 9][k], [12, 9, 4][k]);
  const neck = capPath(new Path2D(), J.neckBase, J.neckTop, 13, 12);
  return { J, S_, legs, arms, hands, cuts, torso, hem, head, hair, tail, neck, HR, tp };
}
// box: rig-unit square that the canvas covers (x0, y0, side)
function drawAki(t, box) {
  const A = akiParts(t), k = 2048 / box.s, lw = px => px / k;
  ag.setTransform(1, 0, 0, 1, 0, 0); ag.clearRect(0, 0, 2048, 2048);
  ag.setTransform(k, 0, 0, k, -box.x0 * k, -box.y0 * k);
  const fill = (P, col) => { ag.fillStyle = col; ag.fill(P); };
  const contour = (P, px) => { ag.save(); ag.globalCompositeOperation = 'source-atop'; ag.strokeStyle = PAPER; ag.lineWidth = lw(px); ag.lineJoin = 'round'; ag.stroke(P); ag.restore(); };
  const hand = (kk) => { const H = A.hands[kk], P = new Path2D(); capPath(P, H.wr, H.h, 12, 13); fill(P, INK); return P; };
  // far arm, far leg (ink and red, behind)
  fill(A.arms.f, RED); hand('f');
  fill(A.legs.f, INK);
  // the jacket and its hem, then the near leg cut free from what lies behind it by a hair of paper
  contour(A.torso, 3); fill(A.torso, RED); fill(A.hem, RED);
  contour(A.legs.n, 3.2); fill(A.legs.n, INK);
  // head, hair, ponytail: ink; the profile read by its paper cuts (ear, eye, the hairline)
  fill(A.neck, INK); fill(A.tail, INK); fill(A.head, INK); contour(A.hair, 2.4); fill(A.hair, INK);
  // near arm: a paper gap where the sleeve crosses the jacket, the gold band of the watch at the wrist
  contour(A.arms.n, 3); fill(A.arms.n, RED); const hn = hand('n');
  { const H = A.hands.n, u = .82, wq = [H.el[0] + (H.wr[0] - H.el[0]) * u, H.el[1] + (H.wr[1] - H.el[1]) * u], d = Math.atan2(H.wr[1] - H.el[1], H.wr[0] - H.el[0]);
    ag.save(); ag.translate(wq[0], wq[1]); ag.rotate(d); ag.fillStyle = YELLOW; ag.fillRect(-7, -14.5, 14, 29);
    ag.fillStyle = INK; ag.fillRect(-1.2, -14.5, 2.4, 29); ag.restore(); }
  // knife cuts (seeded per cut so they never boil)
  A.cuts.forEach((c, i) => { if (c[0] === 'f' && i % 3 === 1) return; cut(ag, c[1], c[2], c[3], c[4], c[5], mulberry(31 + i), PAPER, .85); });
  const R = mulberry(9);
  const e0 = A.HR([22, -8]), e1 = A.HR([31, -9]); cut(ag, e0[0], e0[1], e1[0], e1[1], 3.4, R, PAPER, .6);            // the eye
  const ea = A.HR([-6, -2]); ag.strokeStyle = PAPER; ag.lineWidth = lw(2.4); ag.beginPath(); ag.arc(ea[0], ea[1], 9, A.J.headA - .9, A.J.headA + 1.6); ag.stroke();   // the ear
  const hl = [A.HR([10, -36]), A.HR([-4, -12]), A.HR([-14, 20])]; ag.beginPath(); ag.moveTo(...hl[0]); ag.quadraticCurveTo(...hl[1], ...hl[2]); ag.lineWidth = lw(2); ag.stroke();
  for (let i = 0; i < 2; i++) { const a = A.tp[i], b = A.tp[i + 1]; cut(ag, lerp(a[0], b[0], .2), lerp(a[1], b[1], .2) - 2, lerp(a[0], b[0], .9), lerp(a[1], b[1], .9) - 2, 3, mulberry(70 + i), PAPER, .9); }
  akTex.needsUpdate = true;
  return A;
}

// ═════════ canvases: the shopfronts, their boards, the light they throw (one layout drives the 3D and the reflections)
const SHOPS = [
  { x: -16.0, w: 4.0, h: 3.8, word: 'BAR', kind: 'bar', lit: .6 },
  { x: -12.0, w: 3.6, h: 7.4, word: 'FLOWERS', kind: 'flowers', lit: .9, floors: 2 },
  { x: -8.4, w: 3.4, h: 3.7, word: 'BAKERY', kind: 'bakery', lit: .95 },
  { x: -5.0, w: 2.6, h: 7.8, word: '', kind: 'door', lit: .25, floors: 2 },
  { x: -2.4, w: 4.8, h: 3.8, word: 'CAFE', kind: 'cafe', lit: 1 },
  { x: 2.4, w: 4.2, h: 3.6, word: 'NOODLES', kind: 'noodles', lit: 1 },
  { x: 6.6, w: 4.0, h: 7.6, word: 'BOOKS', kind: 'books', lit: .9, floors: 2 },
  { x: 10.6, w: 4.0, h: 3.7, word: 'PHARMACY', kind: 'pharmacy', lit: .95 },
  { x: 14.6, w: 3.8, h: 3.6, word: 'BAKERY', kind: 'bakery', lit: .9 },
  { x: 18.4, w: 4.2, h: 7.4, word: 'LAUNDRY', kind: 'laundry', lit: .85, floors: 2 },
  { x: 22.6, w: 6.0, h: 11.0, word: 'HOTEL', kind: 'hotel', lit: .9, floors: 3, blade: 'HOTEL' },
  { x: 28.6, w: 4.2, h: 3.8, word: 'RECORDS', kind: 'records', lit: .9 },
  { x: 32.8, w: 4.4, h: 7.6, word: 'FLOWERS', kind: 'flowers', lit: .9, floors: 2 },
  { x: 37.2, w: 4.6, h: 3.8, word: '24H', kind: 'market', lit: 1 },
  { x: 41.8, w: 6.0, h: 8.0, word: '', kind: 'door', lit: .25, floors: 2 },
];
const FRONT_H = 2.5, SPX = 128;                                   // the ground floor canvas: 0..2.5 m at 128 px per metre
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h); return [c, c.getContext('2d')]; }
// interior silhouettes, in ink on the lit (paper) window; a few warm cuts for the lamps inside
function interior(g, kind, x, y, w, h, R) {
  g.fillStyle = INK;
  const shelf = (yy) => g.fillRect(x, yy, w, 5);
  if (kind === 'cafe') {
    for (let i = 0; i < 3; i++) { const lx = x + w * (.2 + i * .3); g.fillRect(lx - 1, y, 2, h * .22); g.beginPath(); g.moveTo(lx - 22, y + h * .3); g.lineTo(lx + 22, y + h * .3); g.lineTo(lx + 9, y + h * .22); g.lineTo(lx - 9, y + h * .22); g.fill();
      g.fillStyle = YELLOW; g.fillRect(lx - 14, y + h * .3, 28, 4); g.fillStyle = INK; }
    g.fillRect(x, y + h * .5, w, 6);                                                // a shelf of cups
    for (let i = 0; i < 9; i++) { const cx = x + 24 + i * (w - 48) / 8; g.fillRect(cx - 8, y + h * .5 - 16, 16, 16); g.fillRect(cx + 8, y + h * .5 - 12, 5, 7); }
    g.fillRect(x, y + h * .9, w, h * .1);                                           // the counter's edge
  } else if (kind === 'noodles') {
    for (let i = 0; i < 5; i++) { const sx = x + i * w / 5 + 3; g.fillRect(sx, y, w / 5 - 6, h * .34); }            // the curtain
    g.fillStyle = PAPER; for (let i = 0; i < 5; i++) cut(g, x + i * w / 5 + 10, y + h * .08, x + i * w / 5 + w / 5 - 14, y + h * .09, 4, R, PAPER, .8);
    g.fillStyle = INK; g.fillRect(x, y + h * .74, w, h * .26);
    for (let i = 0; i < 3; i++) { const bx = x + w * (.25 + i * .25); g.beginPath(); g.ellipse(bx, y + h * .72, 26, 16, 0, 0, Math.PI); g.fill(); }
  } else if (kind === 'books') {
    for (const fy of [.3, .62, .94]) { shelf(y + h * fy); let bx = x + 4; while (bx < x + w - 6) { const bw = 6 + R() * 9, bh = h * (.18 + R() * .1); g.fillRect(bx, y + h * fy - bh, bw, bh); bx += bw + 2 + R() * 3; } }
  } else if (kind === 'pharmacy') {
    const cx = x + w * .5, cy = y + h * .3, s = h * .12; g.fillRect(cx - s * .35, cy - s, s * .7, s * 2); g.fillRect(cx - s, cy - s * .35, s * 2, s * .7);
    for (const fy of [.62, .94]) { shelf(y + h * fy); for (let bx = x + 8; bx < x + w - 10; bx += 18) g.fillRect(bx, y + h * fy - 22 - R() * 10, 10, 22); }
  } else if (kind === 'bakery') {
    for (const fy of [.5, .9]) { shelf(y + h * fy); for (let bx = x + 26; bx < x + w - 20; bx += 44 + R() * 8) { g.beginPath(); g.ellipse(bx, y + h * fy - 13, 19, 12, 0, 0, TAU); g.fill(); g.save(); g.fillStyle = PAPER; cut(g, bx - 9, y + h * fy - 17, bx + 7, y + h * fy - 12, 3, R, PAPER, .7); g.restore(); } }
    g.fillStyle = YELLOW; g.fillRect(x + w * .45, y + 6, 26, 5);
  } else if (kind === 'laundry') {
    for (let i = 0; i < 3; i++) { const cx = x + w * (.2 + i * .3), cy = y + h * .58; g.fillStyle = INK; g.fillRect(cx - 34, cy - 40, 68, 90); g.fillStyle = PAPER; g.beginPath(); g.arc(cx, cy, 24, 0, TAU); g.fill(); g.fillStyle = INK; g.beginPath(); g.arc(cx, cy, 17, 0, TAU); g.fill(); }
  } else if (kind === 'records') {
    for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) { const sx = x + 10 + i * (w - 20) / 5, sy = y + h * (.18 + r * .38), s = (w - 20) / 5 - 8; g.fillStyle = INK; g.fillRect(sx, sy, s, s); g.fillStyle = PAPER; g.beginPath(); g.arc(sx + s / 2, sy + s / 2, s * .18, 0, TAU); g.fill(); }
  } else if (kind === 'hotel') {
    g.fillRect(x + w * .1, y + h * .7, w * .5, h * .3); g.fillStyle = YELLOW; g.beginPath(); g.arc(x + w * .78, y + h * .46, 16, 0, TAU); g.fill(); g.fillStyle = INK; g.fillRect(x + w * .78 - 2, y + h * .5, 4, h * .5);
  } else if (kind === 'flowers') {
    for (let i = 0; i < 6; i++) { const bx = x + 16 + i * (w - 32) / 5; g.fillRect(bx - 12, y + h * .78, 24, h * .22); for (let s = 0; s < 4; s++) { const fx = bx + (R() - .5) * 30, fy = y + h * (.42 + R() * .25); g.fillRect(fx - 1, fy, 2, y + h * .78 - fy); g.beginPath(); g.arc(fx, fy, 6 + R() * 5, 0, TAU); g.fill(); } }
  } else if (kind === 'market') {
    for (const fy of [.28, .55, .82]) { shelf(y + h * fy); for (let bx = x + 6; bx < x + w - 8; bx += 12 + R() * 6) g.fillRect(bx, y + h * fy - 14 - R() * 16, 8, 30); }
  } else if (kind === 'bar') {
    g.fillRect(x, y, w, h); g.fillStyle = PAPER; for (let bx = x + 14; bx < x + w - 10; bx += 16) { const bh = 30 + R() * 14; g.fillRect(bx, y + h * .5 - bh, 7, bh); g.fillRect(bx + 2, y + h * .5 - bh - 10, 3, 10); }
    g.fillRect(x, y + h * .52, w, 4); g.fillStyle = YELLOW; g.beginPath(); g.arc(x + w * .5, y + h * .2, 12, 0, TAU); g.fill();
  }
}
// the ground floor of a shop: window(s) and a door, transparent where the wall is (the wall is the 3D facade's own shader)
function frontCanvas(S) {
  const [c, g] = mkCanvas(S.w * SPX, FRONT_H * SPX), R = mulberry(Math.round(S.x * 10 + 99)), H = FRONT_H * SPX, P = v => v * SPX;
  const Y = y => H - P(y);                                                     // metres above the pavement → canvas y
  if (S.kind === 'door') {
    g.fillStyle = INK; g.fillRect(P(.5), Y(2.3), P(1.2), P(2.3)); g.strokeStyle = PAPER; g.lineWidth = 3; g.strokeRect(P(.56), Y(2.24), P(1.08), P(2.2));
    for (let i = 0; i < 6; i++) cut(g, P(.66), Y(.4 + i * .3), P(1.5), Y(.42 + i * .3), 3, R, PAPER, .9);
    return c;
  }
  const dw = 1.0, wx0 = .3, wx1 = S.w - dw - .5, y0 = .32, y1 = 2.42;
  // window: paper (lit), a frame and a mullion of ink, the interior in ink
  g.fillStyle = PAPER; g.fillRect(P(wx0), Y(y1), P(wx1 - wx0), P(y1 - y0));
  interior(g, S.kind, P(wx0) + 6, Y(y1) + 6, P(wx1 - wx0) - 12, P(y1 - y0) - 12, R);
  g.strokeStyle = INK; g.lineWidth = 9; g.strokeRect(P(wx0), Y(y1), P(wx1 - wx0), P(y1 - y0));
  if (S.w > 4) { g.fillStyle = INK; g.fillRect(P((wx0 + wx1) / 2) - 4, Y(y1), 8, P(y1 - y0)); }
  // sill: a band of ink with one paper cut
  g.fillStyle = INK; g.fillRect(P(wx0 - .1), Y(y0), P(wx1 - wx0 + .2), P(.12)); cut(g, P(wx0), Y(y0) + 6, P(wx1), Y(y0) + 7, 3, R, PAPER, .9);
  // the door: ink frame, a paper glass panel
  const dx0 = S.w - dw - .25; g.fillStyle = INK; g.fillRect(P(dx0), Y(2.36), P(dw), P(2.36));
  g.fillStyle = PAPER; g.fillRect(P(dx0 + .12), Y(2.2), P(dw - .24), P(1.5));
  if (S.kind === 'cafe') {
    // lettering on the glass (ink) and a lightbox in the door (ink box, paper letters): both low, so the puddle can show them
    g.fillStyle = INK; g.font = `800 ${P(.42)}px "Newsreader"`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.letterSpacing = '10px';
    g.fillText('CAFE', P((wx0 + wx1) / 2), Y(.82)); g.letterSpacing = '0px';
    g.fillStyle = INK; g.fillRect(P(dx0 + .14), Y(1.12), P(dw - .28), P(.48));
    g.fillStyle = PAPER; g.font = `800 ${P(.34)}px "Newsreader"`; g.fillText('24H', P(dx0 + dw / 2), Y(.74));
  } else {
    g.fillStyle = INK; g.fillRect(P(dx0 + dw / 2) - 3, Y(2.2), 6, P(1.5));
  }
  if (S.kind === 'noodles') { g.fillStyle = INK; for (let i = 0; i < 3; i++) g.fillRect(P(dx0 + .12 + i * (dw - .24) / 3) + 2, Y(2.2), P((dw - .24) / 3) - 4, P(.55)); }
  return c;
}
function boardCanvas(S, word, wM, hM, vertical = false) {
  const k = 256, [c, g] = mkCanvas(wM * k, hM * k), R = mulberry(word.length * 31 + Math.round(S.x * 7));
  g.fillStyle = INK; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = PAPER; g.lineWidth = 5; g.strokeRect(10, 10, c.width - 20, c.height - 20);
  if (!vertical) {
    const px = Math.min(c.height * .62, c.width * .9 / Math.max(3, word.length * .78));
    g.save(); g.letterSpacing = `${Math.round(px * .14)}px`; g.font = `700 ${px}px "Newsreader"`; const w = g.measureText(word).width; g.restore();
    g.save(); g.letterSpacing = `${Math.round(px * .14)}px`; carvedText(g, word, (c.width - w) / 2, c.height * .5 + px * .36, px, R, { nicks: true }); g.restore();
  } else {
    const px = Math.min(c.width * .64, c.height * .9 / word.length);
    [...word].forEach((ch, i) => carvedText(g, ch, c.width / 2, c.height * .08 + (i + .86) * px * 1.02, px, R, { align: 'center' }));
  }
  return c;
}
// upper windows: an atlas of four tiles (dark, lit, dark with a rail, lit with a curtain)
const WIN = (() => {
  const [c, g] = mkCanvas(1024, 256), R = mulberry(5);
  for (let i = 0; i < 4; i++) {
    const x = i * 256, lit = i % 2 === 1;
    g.fillStyle = INK; g.fillRect(x, 0, 256, 256);
    g.fillStyle = lit ? YELLOW : INK; g.fillRect(x + 28, 20, 200, 216);
    g.strokeStyle = PAPER; g.lineWidth = 6; g.strokeRect(x + 28, 20, 200, 216);
    g.fillStyle = lit ? INK : PAPER; g.fillRect(x + 125, 20, 6, 216); g.fillRect(x + 28, 110, 200, 5);
    if (!lit) for (let k = 0; k < 3; k++) cut(g, x + 44, 140 + k * 26, x + 110, 141 + k * 26, 3, R, PAPER, .9);
    if (i === 3) { g.fillStyle = INK; g.beginPath(); g.moveTo(x + 28, 20); g.quadraticCurveTo(x + 70, 120, x + 52, 236); g.lineTo(x + 28, 236); g.fill(); }
    if (i === 2) { g.fillStyle = INK; g.fillRect(x + 10, 170, 236, 8); for (let b = x + 18; b < x + 240; b += 20) g.fillRect(b, 170, 4, 70); g.strokeStyle = PAPER; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 10, 168); g.lineTo(x + 246, 168); g.stroke(); }
  }
  return canvasTex(c);
})();
const UPPER = [];                                                 // [x, y, z, w, h, tile]
SHOPS.forEach((S, si) => {
  const R = mulberry(400 + si);
  for (let f = 1; f < (S.floors || 1); f++) {
    const n = Math.max(1, Math.floor(S.w / 1.5)), y = 3.9 + (f - 1) * 3.3 + .3;
    for (let i = 0; i < n; i++) { const x = S.x + (i + .5) * S.w / n; UPPER.push([x, y + .75, ZF + .012, 1.0, 1.4, R() < .32 ? (R() < .5 ? 1 : 3) : (f === 1 && R() < .4 ? 2 : 0)]); }
  }
});

// the light map of the shop fronts as the wet ground sees it (paper and yellow on ink): the same canvases, at 32 px/m
const EM = (() => {
  const [c, g] = mkCanvas((XB - XA) * EMK, EMH * EMK); g.fillStyle = INK; g.fillRect(0, 0, c.width, c.height);
  const PX = x => (x - XA) * EMK, PY = y => (EMH - y) * EMK;
  SHOPS.forEach(S => {
    g.drawImage(S.front, PX(S.x), PY(FRONT_H), S.w * EMK, FRONT_H * EMK);
    if (S.board) g.drawImage(S.board, PX(S.x + .2), PY(3.22), (S.w - .4) * EMK, .6 * EMK);
    // the lit wall around the window: a soft band of paper above the shop (spill of its light)
    g.fillStyle = `rgba(237,229,205,${.22 * S.lit})`; g.fillRect(PX(S.x), PY(3.6), S.w * EMK, (3.6 - 2.5) * EMK);
  });
  for (const [x, y, , w, h, tile] of UPPER) if (tile === 1 || tile === 3) { g.fillStyle = YELLOW; g.fillRect(PX(x - w * .4), PY(y + h * .42), w * .8 * EMK, h * .84 * EMK); }
  return c;
});
SHOPS.forEach(S => { S.front = frontCanvas(S); if (S.word) S.board = boardCanvas(S, S.word, S.w - .4, .6); if (S.blade) S.bladeC = boardCanvas(S, S.blade, .62, 2.3, true); });
const emC = EM();
// the rough reflection: the same map smeared vertically (a wet pavement stretches each light into a column)
const emB = (() => { const [c, g] = mkCanvas(emC.width, emC.height), [s, sg] = mkCanvas(emC.width, 12); sg.drawImage(emC, 0, 0, s.width, 12); g.imageSmoothingEnabled = true; g.drawImage(s, 0, 0, c.width, c.height); return c; })();
const emTex = canvasTex(emC, false), embTex = canvasTex(emB, false);

// sprites: rain streaks, splash marks, lamp glow, clouds, steam
function rainAtlas() {
  const [c, g] = mkCanvas(1024, 256), R = mulberry(17);
  for (let i = 0; i < 8; i++) { const x = i * 128 + 64; cut(g, x + (R() - .5) * 10, 12, x + (R() - .5) * 18 - 10, 244, 6 + R() * 3, R, PAPER, .92); }
  return canvasTex(c);
}
function dropAtlas() {
  const [c, g] = mkCanvas(512, 128), R = mulberry(23);
  g.fillStyle = PAPER; g.fillRect(40, 40, 48, 48);                                      // 0: a square stab
  g.strokeStyle = PAPER; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.arc(192, 110, 70, -2.4, -.75); g.stroke();   // 1: a short arc
  cut(g, 276, 64, 372, 60, 16, R, PAPER, .9);                                             // 2: a dash
  g.lineWidth = 9; g.beginPath(); g.arc(448, 64, 30, 0, TAU); g.stroke();                 // 3: a ring
  return canvasTex(c);
}
function lampAtlas() {
  const S = 512, [c, g] = mkCanvas(S, S), R = mulberry(41), m = S / 2;
  for (let i = 0; i < 30; i++) { const a = (i + .5) / 30 * TAU + (R() - .5) * .05, r0 = 74 + R() * 12, r1 = 120 + R() * 110; cut(g, m + Math.cos(a) * r0, m + Math.sin(a) * r0, m + Math.cos(a) * r1, m + Math.sin(a) * r1, 6 + R() * 4, R, i % 3 ? YELLOW : PAPER, .9); }
  g.strokeStyle = PAPER; g.lineWidth = 5; g.beginPath(); g.arc(m, m, 58, 0, TAU); g.stroke();
  g.fillStyle = YELLOW; g.beginPath(); g.arc(m, m, 44, 0, TAU); g.fill();
  return canvasTex(c);
}
function cloudAtlas() {
  const W = 1024, H = 256, [c, g] = mkCanvas(W, H * 4);
  for (let v = 0; v < 4; v++) {
    const R = mulberry(300 + v * 13), oy = v * H, P = new Path2D();
    const n = 7 + Math.floor(R() * 4);
    for (let i = 0; i < n; i++) { const cx = 120 + (i + R() * .5) / n * (W - 240), cy = oy + H * .62 - Math.sin((i + .5) / n * Math.PI) * (40 + R() * 70), r = 50 + R() * 60; P.ellipse(cx, cy, r * 1.5, r, 0, 0, TAU); }
    P.rect(110, oy + H * .58, W - 220, H * .2);
    g.fillStyle = PAPER; g.fill(P);
    // ink cuts on the underside, a few up into the body
    g.save(); g.clip(P);
    for (let y = oy + H * .45; y < oy + H * .8; y += 9 + R() * 5) { let x = 100; while (x < W - 100) { const len = 30 + R() * 160; if (R() < .35 + (y - oy - H * .45) / (H * .35) * .5) cut(g, x, y, x + len, y + (R() - .5) * 2, 4 + R() * 5, R, INK, .9); x += len + 10 + R() * 60; } }
    g.restore();
  }
  return canvasTex(c);
}
const rainTex = rainAtlas(), dropTex = dropAtlas(), lampTex = lampAtlas(), cloudTex = cloudAtlas(), mistTex = canvasTex(mistAtlas());

// ═════════ materials of the street
const VSW = `varying vec3 vW; varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
// the shop walls: courses of brick in the light of the windows; the paper courses narrow with height until the wall is ink cut with paper
function facadeMat(lit, seed) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uLit: { value: lit }, uSeed: { value: seed } },
    vertexShader: VSW,
    fragmentShader: GLSL_HASH + `
      uniform vec3 uInk, uPaper; uniform float uLit, uSeed; varying vec3 vW; varying vec3 vN;
      void main(){
        vec3 n = normalize(vN);
        if (n.y > .7) {   // the roof, wet under the sky: paper with a few ink cuts along it
          float v = vW.z*5.; float r = floor(v), f = abs(fract(v)-.5); float on = step(.55, h11(r + floor(vW.x*.7)*3.1 + uSeed));
          gl_FragColor = vec4(mix(uPaper, uInk, on*(1.-smoothstep(.08, .12, f))), 1.); return; }
        if (n.y < -.7 || abs(n.z) < .5) { gl_FragColor = vec4(uInk, 1.); return; }
        float lite = uLit * (1. - smoothstep(1.9, 4.3, vW.y));
        float v = vW.y/.17 + sin(vW.x*.9 + uSeed)*.08, row = floor(v), f = fract(v);
        float aa = fwidth(v);
        float pw = mix(.07, .84, lite) * (.8 + .4*h11(row*1.3 + uSeed));
        float k = 1. - smoothstep(pw*.5 - aa, pw*.5 + aa, abs(f - .5));
        float bx = vW.x/.36 + mod(row, 2.)*.5 + uSeed; float fx = min(fract(bx), 1.-fract(bx)), ab = fwidth(bx);
        k *= 1. - (1. - smoothstep(.035 - ab, .035 + ab, fx)) * step(.35, lite);           // the joints, where the wall is lit
        float segL = .5 + h11(row*2.7 + uSeed)*1.4, sx = vW.x/segL + h11(row*5.1)*9.;
        k *= step(.25*(1. - lite), h11(floor(sx) + row*7.3 + uSeed));                          // in the dark the courses break into cuts
        k = mix(k, step(.5, lite), smoothstep(.3, .8, aa));
        gl_FragColor = vec4(mix(uInk, uPaper, k), 1.);
      }`,
  });
}
// the pavement: wet ink, cut open by the lights it reflects (rows of horizontal cuts whose width is the light), and the puddles: mirrors
const LAMPS = [-12, -4, 4, 12, 20, 28, 36, 44].map(x => [x + .6, 4.05, ZC - .3]);
const PUDDLES = [[0, .06, 1.05, .5, 0], [5.2, -1.3, .55, .22, 1], [9.6, .7, .7, .26, 2], [14.4, -.6, .5, .2, 3], [19.6, 1.1, .8, .3, 4], [24.4, -1.5, .6, .24, 5], [29.8, .4, .7, .26, 6]];
const groundMat = new THREE.ShaderMaterial({
  uniforms: { ...U, uT: { value: 0 }, tEM: { value: emTex }, tEMB: { value: embTex }, tAK: { value: akTex }, uAK: { value: new THREE.Vector4() }, uAKon: { value: 0 },
    uSpl: { value: new THREE.Vector4(0, 0, EV.splash, 1) }, uLamps: { value: LAMPS.map(l => new THREE.Vector3(...l)) } },
  vertexShader: VSW,
  fragmentShader: GLSL_HASH + `
    uniform vec3 uInk, uPaper, uYellow, uCam; uniform float uT, uAKon; uniform sampler2D tEM, tEMB, tAK; uniform vec4 uAK, uSpl; uniform vec3 uLamps[${LAMPS.length}];
    varying vec3 vW; varying vec3 vN;
    const float ZF = ${ZF.toFixed(2)}, XA = ${XA.toFixed(1)}, XB = ${XB.toFixed(1)}, EMH = ${EMH.toFixed(1)};
    vec3 em(sampler2D T, vec2 p){ vec2 uv = vec2((p.x - XA)/(XB - XA), p.y/EMH); if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) return uInk; return texture2D(T, uv).rgb; }
    float puddleD(vec2 p, vec4 P, float s){ vec2 q = (p - P.xy)/P.zw; float n = vn(p*3.3 + s*7.)*.32 + vn(p*8.1 + s)*.12; return (length(q) - 1. + n*.6) * min(P.z, P.w); }
    void main(){
      vec2 p = vW.xz;
      // puddles
      float pd = 1e3; ${PUDDLES.map(P => `pd = min(pd, puddleD(p, vec4(${P.slice(0, 4).map(v => v.toFixed(3)).join(',')}), ${P[4].toFixed(1)}));`).join(' ')}
      float inP = 1. - smoothstep(-.004, .004, pd);
      vec3 V = normalize(vW - uCam); vec3 R = vec3(V.x, -V.y, V.z);
      // the splash: rings out of the puddle, the mirror shaken
      float age = uT - uSpl.z, dS = length(p - uSpl.xy);
      if (age > 0. && uSpl.w > .5) { float a = exp(-age*2.2); R.xz += normalize(p - uSpl.xy + 1e-4)*sin(dS*70. - age*26.)*.022*a*smoothstep(age*.55 + .05, age*.55 - .1, dS); }
      // rain rings in the puddles
      vec2 cg = p/.32; vec2 ci = floor(cg), cf = fract(cg) - .5; float rr = 0.;
      for (int k = 0; k < 2; k++) { float hh = h21(ci + float(k)*17.); float per = .55 + hh*.4, a2 = mod(uT + hh*per*3., per); vec2 c0 = vec2(h21(ci+3.1+float(k)), h21(ci+7.7+float(k))) - .5;
        float d = length(cf - c0*.6)*.32, r = a2*.32; rr = max(rr, (1. - smoothstep(.0035, .0065, abs(d - r))) * (1. - a2/per) * step(.55, hh)); R.xz += (cf - c0*.6)*.006*sin(d*120. - a2*30.)*(1.-a2/per); }
      vec3 Rm = normalize(vec3(R.x, R.y*1.6, R.z));                 // the puddles' mirror, steepened (a printmaker's licence) so they hold the signs
      float lit = 0.; vec3 lcol = uPaper; float ink = 0.;
      // the mirror (puddles): AKI first (her plane z = 0, seen in the near half), then the shop fronts
      if (Rm.z < -1e-3) {
        bool hitA = false;
        if (uAKon > .5 && vW.z > 0.) { float s = -vW.z/Rm.z; vec3 H = vW + Rm*s; vec2 uv = (H.xy - uAK.xy)/(uAK.zw - uAK.xy);
          if (uv.x > 0. && uv.x < 1. && uv.y > 0. && uv.y < 1.) { vec4 a = texture2D(tAK, uv); if (a.a > .5) { hitA = true; lcol = a.rgb; lit = (a.r - a.g > .25) ? 1. : step(.6, dot(a.rgb, vec3(.33))); if (lit < .5) ink = 1.; } } }
        if (!hitA) { float s = (ZF - vW.z)/Rm.z; vec3 H = vW + Rm*s; vec3 e = em(tEM, H.xy); float l = dot(e, vec3(.33)); lit = smoothstep(.42, .62, l); lcol = (e.r - e.b > .3) ? uYellow : uPaper; }
      }
      // broken into strips: the mirror is never whole
      float vb = vW.z*34. + vn(p*4.)*1.5, rb = floor(vb);
      float strip = step(.16, abs(fract(vb) - .5)*2.) * step(.14, h11(rb*3.7 + floor(vW.x*3.)));
      vec3 mirror = mix(uInk, lcol, lit*strip);
      mirror = mix(mirror, uPaper, rr);
      // the rough wet pavement: rows of cuts, each as wide as the light it catches
      float v = vW.z*17. + vn(p*vec2(.7, 2.))*.9, row = floor(v), f = fract(v) - .5;
      vec3 Hs = vW + R*((ZF - vW.z)/min(R.z, -1e-3));
      vec3 eb = em(tEMB, vec2(Hs.x + (h11(row) - .5)*.08, clamp(Hs.y, .2, EMH)));
      float tone = smoothstep(.1, .55, dot(eb, vec3(.33))) * step(R.z, -1e-3);
      float yel = step(.12, eb.r - eb.b);
      // the spill of the windows onto the pavement close to the wall
      vec3 sp = em(tEMB, vec2(vW.x, 1.4)); float spill = smoothstep(.15, .5, dot(sp, vec3(.33))) * (1. - smoothstep(.0, 2.1, vW.z - ZF));
      // lamps: a column of light under each, toward the camera
      float lamp = 0.;
      for (int i = 0; i < ${LAMPS.length}; i++) { vec3 L = uLamps[i]; vec3 Lm = vec3(L.x, 2.*vW.y - L.y, L.z); vec3 dL = Lm - uCam; float s = (vW.y - uCam.y)/dL.y; vec2 P = (uCam + dL*s).xz;
        vec2 toC = normalize(uCam.xz - P); vec2 d = p - P; float al = dot(d, toC), ac = abs(d.x*toC.y - d.y*toC.x); float dist = length(P - uCam.xz);
        lamp = max(lamp, (1. - smoothstep(.04, .12 + .02*dist, ac)) * smoothstep(-1.8 - .2*dist, -.2, al) * (1. - smoothstep(.5, 3. + .3*dist, al))); }
      float t2 = max(max(tone*.62, spill*.55), lamp*.9);
      float segL = .22 + h11(row*2.3)*.55, sx = vW.x/segL + h11(row*7.1)*9.; float j = floor(sx), sf = fract(sx);
      float on = step(.22, h11(j*3.1 + row*.7));
      float taper = smoothstep(0., .06, sf)*(1. - smoothstep(.55, .98, sf));
      float w = t2*.5*on*mix(.6, 1., taper), aa = fwidth(v);
      float kc = 1. - smoothstep(w - aa, w + aa, abs(f));
      kc *= 1. - smoothstep(.3, .75, aa);
      // sparse joints of the paving (broken, never a grid)
      float jz = abs(fract(vW.z/.62) - .5), jx = abs(fract(vW.x/1.05 + floor(vW.z/.62)*.5) - .5);
      float joint = (1. - smoothstep(.006, .012, min(jz*.62, jx*1.05))) * step(.72, h21(floor(vec2(vW.x/1.05, vW.z/.62)))) * (1. - smoothstep(.15, .5, fwidth(vW.z/.62)));
      vec3 rough = mix(uInk, (lamp > tone*.62 && lamp > spill*.55) ? mix(uPaper, uYellow, .8) : uPaper, max(kc, joint*.8));
      vec3 col = mix(rough, mirror, inP);
      // a narrow broken paper lip at each puddle's edge
      float lip = (1. - smoothstep(.0, .006, abs(pd + .004))) * step(.45, h11(floor(atan(p.y - .06, p.x)*14.) + floor(pd*30.)));
      col = mix(col, uPaper, lip*.9);
      gl_FragColor = vec4(col, 1.);
    }`,
});
const akMat = new THREE.ShaderMaterial({
  uniforms: { tMap: { value: akTex } }, side: THREE.DoubleSide,
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tMap; varying vec2 vUv; void main(){ vec4 c = texture2D(tMap, vUv, -.5); if (c.a < .5) discard; gl_FragColor = vec4(c.rgb, 1.); }`,
});
const cutoutMat = (tex, opts = {}) => new THREE.ShaderMaterial({
  uniforms: { tMap: { value: tex } }, side: THREE.DoubleSide, ...(opts.po ? { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 } : {}),
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tMap; varying vec2 vUv; void main(){ vec4 c = texture2D(tMap, vUv, -1.); if (c.a < .5) discard; gl_FragColor = vec4(c.rgb, 1.); }`,
});
// iron and stone for the posts: ink with paper cuts along their length
const postMat = new THREE.ShaderMaterial({
  uniforms: { ...U }, vertexShader: VSW,
  fragmentShader: GLSL_HASH + `uniform vec3 uInk, uPaper, uL; varying vec3 vW; varying vec3 vN;
    void main(){ vec3 n = normalize(vN); float a = atan(n.z, n.x); float lit = dot(n, uL) + .35*n.x*-1.;
      float u = a*4.; float f = abs(fract(u) - .5); float aa = fwidth(u);
      float k = (1. - smoothstep(.06 - aa, .06 + aa, f)) * step(.0, lit) * step(.3, h11(floor(vW.y*1.7) + floor(u)*3.));
      gl_FragColor = vec4(mix(uInk, uPaper, k*.9), 1.); }`,
});

// ═════════ build the street
const street = new THREE.Group(); scene.add(street);
const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 48, 24), skyMat); sky.renderOrder = -1; scene.add(sky);
skyMat.uniforms.uStars.value = 0; skyMat.uniforms.uDense.value = 0; skyMat.uniforms.uFront.value = -1;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(XB - XA, 40), groundMat); ground.rotation.x = -Math.PI / 2; ground.position.set((XA + XB) / 2, 0, ZF + 20); street.add(ground);
const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); street.add(m); return m; };
SHOPS.forEach((S, i) => {
  box(S.w, S.h, 6, facadeMat(S.lit, i * 1.7 + .3), S.x + S.w / 2, S.h / 2, ZF - 3);
  const fr = new THREE.Mesh(new THREE.PlaneGeometry(S.w, FRONT_H), cutoutMat(canvasTex(S.front), { po: true })); fr.position.set(S.x + S.w / 2, FRONT_H / 2, ZF + .01); street.add(fr);
  if (S.board) { const b = new THREE.Mesh(new THREE.BoxGeometry(S.w - .4, .6, .09), [inkMat, inkMat, inkMat, inkMat, new THREE.MeshBasicMaterial({ map: canvasTex(S.board) }), inkMat]); b.position.set(S.x + S.w / 2, 2.92, ZF + .06); street.add(b); }
  if (S.bladeC) { const b = new THREE.Mesh(new THREE.BoxGeometry(.62, 2.3, .1), [inkMat, inkMat, inkMat, inkMat, new THREE.MeshBasicMaterial({ map: canvasTex(S.bladeC) }), new THREE.MeshBasicMaterial({ map: canvasTex(S.bladeC) })]);
    b.position.set(S.x + .8, 5.6, ZF + .55); b.rotation.y = -.75; street.add(b); box(.06, .06, .5, inkMat, S.x + .8, 6.6, ZF + .25); box(.06, .06, .5, inkMat, S.x + .8, 4.6, ZF + .25); }
  // a cornice: a thin ink ledge with a paper edge on top of each shop
  box(S.w + .1, .16, .3, inkMat, S.x + S.w / 2, S.h + .08, ZF + .1);
});
// quads on the facades (upper windows): one geometry, uvs into the window atlas
function quadGeo(list, cols) {
  const pos = [], uv = [], idx = [];
  list.forEach(([x, y, z, w, h, tile], i) => {
    const u0 = tile / cols, u1 = (tile + 1) / cols;
    pos.push(x - w / 2, y - h / 2, z, x + w / 2, y - h / 2, z, x + w / 2, y + h / 2, z, x - w / 2, y + h / 2, z);
    uv.push(u0, 0, u1, 0, u1, 1, u0, 1); idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}
street.add(new THREE.Mesh(quadGeo(UPPER, 4), cutoutMat(WIN, { po: true })));
// lamps and bollards at the edge of the pavement: the foreground that rushes past
const lampGlow = billboards(LAMPS.length, billboardMat(lampTex, 1), false);
fillBoards(lampGlow, LAMPS.map(([x, y, z]) => [x, y, z, 1.25, 1.25, 0, 0]), 1, 1); street.add(lampGlow);
for (const [x, y, z] of LAMPS) {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.055, .085, y + .2, 10), postMat); post.position.set(x - .6, (y + .2) / 2, z); street.add(post);
  box(.62, .05, .05, inkMat, x - .3, y + .2, z); box(.3, .1, .22, inkMat, x, y + .12, z);
}
for (let x = -14; x < 50; x += 4) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.08, .09, .82, 10), postMat); b.position.set(x + 2.6, .41, ZC - .3); street.add(b); box(.2, .06, .2, inkMat, x + 2.6, .85, ZC - .3); }
// the column the take passes behind at 7.5 s: ink with broken paper grooves
const COLX = xA(7.5) + .4, COLZ = 3.9 - .5;
{ const col = new THREE.Mesh(new THREE.CylinderGeometry(.44, .44, 3.2, 28), postMat); col.position.set(COLX, 1.6, COLZ); street.add(col); }
// the back row and the far city: faceted blocks under carveMat, sparse lit windows (yellow is light)
const city = new THREE.Group(); scene.add(city);
const cmat = carveMat(.8), fmat = carveMat(.36), litWins = [];
{
  const R = mulberry(77);
  let x = -30; while (x < 80) { const w = 5 + R() * 7, h = 6.5 + R() * 5.5, z = -13 - R() * 4; const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 6), cmat); m.position.set(x + w / 2, h / 2, z - 3); city.add(m);
    for (let fy = 4; fy < h - 1.5; fy += 3) for (let fx = x + 1; fx < x + w - .8; fx += 1.8) if (R() < .16) litWins.push([fx + .4, fy, z + .03, .8, 1.1, 1]);
    x += w + (R() < .4 ? 3 + R() * 6 : 0); }
  x = -60; while (x < 140) { const w = 10 + R() * 16, h = 22 + R() * 34, z = -70 - R() * 50; const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 10), fmat); m.position.set(x + w / 2, h / 2, z - 5); city.add(m);
    for (let fy = 5; fy < h - 2; fy += 4) for (let fx = x + 1.5; fx < x + w - 1; fx += 2.6) if (R() < .1) litWins.push([fx + .6, fy, z + .05, 1.2, 1.6, 1]);
    x += w + R() * 6; }
}
city.add(new THREE.Mesh(quadGeo(litWins, 4), cutoutMat(WIN, { po: true })));
// the station's clock tower at the end of the street: stone, a pyramid roof, a dial that lights on the chime
const TOWER = { x: 54, z: -104, w: 11, h: 52, cy: 44, r: 4.2 };
{
  const m = new THREE.Mesh(new THREE.BoxGeometry(TOWER.w, TOWER.h, TOWER.w), fmat); m.position.set(TOWER.x, TOWER.h / 2, TOWER.z); city.add(m);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(TOWER.w * .78, 10, 4), fmat); roof.rotation.y = Math.PI / 4; roof.position.set(TOWER.x, TOWER.h + 5, TOWER.z); city.add(roof);
  const sp = new THREE.Mesh(new THREE.CylinderGeometry(.08, .12, 6, 6), inkMat); sp.position.set(TOWER.x, TOWER.h + 12, TOWER.z); city.add(sp);
}
const AH = -Math.PI / 2 + (11 + 58 / 60) / 12 * TAU, AMN = -Math.PI / 2 + 58 / 60 * TAU;
function dialCanvas(lit) {
  const S = 1024, [c, g] = mkCanvas(S, S), m = S / 2, R = mulberry(lit ? 5 : 6);
  g.fillStyle = INK; g.beginPath(); g.arc(m, m, m, 0, TAU); g.fill();
  g.fillStyle = lit ? YELLOW : INK; g.beginPath(); g.arc(m, m, m * .9, 0, TAU); g.fill();
  g.strokeStyle = PAPER; g.lineWidth = 10; g.beginPath(); g.arc(m, m, m * .9, 0, TAU); g.stroke();
  const fg = lit ? INK : PAPER;
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, r0 = m * (i % 5 ? .8 : .72), r1 = m * .86; g.strokeStyle = fg; g.lineWidth = i % 5 ? 6 : 16; g.beginPath(); g.moveTo(m + Math.cos(a) * r0, m + Math.sin(a) * r0); g.lineTo(m + Math.cos(a) * r1, m + Math.sin(a) * r1); g.stroke(); }
  const hand = (a, L, w) => { g.save(); g.translate(m, m); g.rotate(a); g.fillStyle = fg; g.beginPath(); g.moveTo(-L * .16, -w); g.lineTo(L, -w * .4); g.lineTo(L, w * .4); g.lineTo(-L * .16, w); g.fill(); g.restore(); };
  hand(AH, m * .48, 22); hand(AMN, m * .7, 15); g.fillStyle = fg; g.beginPath(); g.arc(m, m, 26, 0, TAU); g.fill();
  if (!lit) for (let i = 0; i < 9; i++) { const y = m - m * .5 + i * m * .12, w = Math.sqrt(Math.max(0, (m * .66) ** 2 - (y - m) ** 2)); cut(g, m - w, y, m + w * .3, y + 2, 5, R, PAPER, .9); }
  return canvasTex(c);
}
const dialMat = new THREE.MeshBasicMaterial({ map: dialCanvas(false) }), dialLit = dialCanvas(true), dialDark = dialMat.map;
const dial = new THREE.Mesh(new THREE.CircleGeometry(TOWER.r, 48), dialMat); dial.position.set(TOWER.x, TOWER.cy, TOWER.z + TOWER.w / 2 + .05); city.add(dial);
// the chime: rings of carved light leaving the tower
function ringCanvas() { const S = 1024, [c, g] = mkCanvas(S, S), m = S / 2, R = mulberry(88); for (let k = 0; k < 3; k++) { const r = m * (.55 + k * .15); for (let i = 0; i < 40; i++) { const a0 = i / 40 * TAU + R() * .05, a1 = a0 + TAU / 40 * (.45 + R() * .3); cut(g, m + Math.cos(a0) * r, m + Math.sin(a0) * r, m + Math.cos(a1) * r, m + Math.sin(a1) * r, 24 - k * 5, R, k ? PAPER : YELLOW, .7); } } return canvasTex(c); }
const rings = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), cutoutMat(ringCanvas())); rings.position.set(TOWER.x, TOWER.cy, TOWER.z + TOWER.w / 2 + .3); city.add(rings);
// clouds lit by the city: paper, cut on the underside
const clouds = billboards(14, billboardMat(cloudTex, 0), true); city.add(clouds);
{ const R = mulberry(91), L = []; for (let i = 0; i < 14; i++) { const w = 120 + R() * 160; L.push([-120 + i * 34 + R() * 20, 70 + R() * 90, -380 - R() * 260, w, w * .25, i % 4]); } fillBoards(clouds, L, 1, 4); }
// a rooftop mast and tank: the near ink of the high view
{ const MX = 33, MZ = -33; const mast = new THREE.Mesh(new THREE.CylinderGeometry(.1, .18, 40, 6), inkMat); mast.position.set(MX, 20, MZ); city.add(mast);
  for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(2.8 - k * .45, .09, .09), inkMat); b.position.set(MX, 27 + k * 1.9, MZ); city.add(b);
    for (const dx of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(.05, .5, .05), inkMat); w.position.set(MX + dx * (1.3 - k * .22), 27 + k * 1.9 - .25, MZ); city.add(w); } }
  const lamp = billboards(1, billboardMat(lampTex, 1), false); fillBoards(lamp, [[MX, 40.2, MZ, .9, .9, 0, 0]], 1, 1); city.add(lamp); }

// AKI's plane, her splashes, the rain, the steam
const aki = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), akMat); street.add(aki);
const drops = billboards(220, billboardMat(dropTex, 1), false); street.add(drops);
const rain = billboards(2600, billboardMat(rainTex, 0), false); scene.add(rain);
const RAIN = (() => {
  const R = mulberry(123), L = [];
  const vol = (n, x0, x1, z0, z1, h, w, len) => { for (let i = 0; i < n; i++) L.push({ x: lerp(x0, x1, R()), z: lerp(z0, z1, R()), h, ph: R() * h, w: w * (.7 + R() * .6), len: len * (.7 + R() * .6), tile: Math.floor(R() * 8) }); };
  vol(520, -2.6, 2.8, -2.2, 1.9, 3, .007, .1);           // at the puddle
  vol(1300, 1, 34, -2.3, 3.0, 6, .014, .24);             // along the street
  vol(620, -10, 90, -70, 2, 42, .05, 1.1);               // the high view
  return L;
})();
function placeRain(t) {
  const L = RAIN.map(d => { const y = d.h - ((t * 7.5 + d.ph) % d.h); return [d.x - (t * .6 + d.ph) % .6 * .2, y, d.z, d.w, d.len, d.tile, .08]; });
  fillBoards(rain, L, 8, 1);
}
const steam = billboards(24, billboardMat(mistTex, 1), false); street.add(steam);
function placeSteam(t) {
  const L = [];
  for (let i = 0; i < 16; i++) { const R = mulberry(500 + i), t0 = 1.45 + R() * .6, a = t - t0; if (a < 0) continue;
    const x = 2.3 - a * (1.6 + R() * 1.2) - R() * .5, y = .25 + R() * .9 + a * .35, z = -1.2 + R() * 1.4 + a * (.9 + R() * .8), w = 1.4 + a * 1.6 + R() * .8;
    L.push([x, y, z, w, w * .25, i % 4, (R() - .5) * .2]); }
  // wisps rushing past the lens on the far side of the steam
  if (t > 2.5 && t < 3.0) for (let i = 0; i < 6; i++) { const R = mulberry(600 + i); L.push([xA(t) + 1.2 - (t - 2.5) * 6 + R() * 2.4, .4 + R() * 2.2, 2.4 + R() * .9, 2.6, .7, i % 4, 0]); }
  fillBoards(steam, L, 1, 4);
}
// splash: a crown of short arcs, square stabs thrown in arcs, a ring; small ones at every later footfall on the wet stone
function placeDrops(t) {
  const L = [];
  for (const c of RUN.contacts) {
    const a = t - c.t0; if (a < 0 || a > .7) continue;
    const big = Math.abs(c.t0 - EV.splash) < .02, x0 = wx(c.x) + (big ? 0 : .08), z0 = c.foot === 'n' ? .06 : -.06, R = mulberry(Math.round(c.t0 * 1000));
    const n = big ? 26 : 7, g = 9.8;
    for (let i = 0; i < n; i++) { const vx = (R() - .35) * (big ? 1.7 : .9), vy = (big ? 1.1 : .6) + R() * (big ? 1.7 : .7), vz = (R() - .5) * .8, y = vy * a - .5 * g * a * a; if (y < 0) continue;
      const s = (big ? .028 : .02) * (.6 + R() * .8); L.push([x0 + vx * a, y, z0 + vz * a, s, s, R() < .6 ? 0 : 2, Math.atan2(vy - g * a, vx)]); }
    if (big && a < .26) for (let i = 0; i < 12; i++) { const ang = i / 12 * TAU + R() * .3, r = .07 + a * .65, h = .11 * Math.sin(Math.min(1, a / .26) * Math.PI);
      L.push([x0 + Math.cos(ang) * r, .02 + h * (.6 + R() * .5), z0 + Math.sin(ang) * r * .6, .09, .045, 1, -ang * .2]); }
  }
  fillBoards(drops, L.slice(0, 220), 4, 1);
}

// ═════════ the insert (7.5–9.375): her wrist and the gold watch, printed big, the street streaming behind (set far below the street)
const INS = new THREE.Group(); INS.position.set(0, -300, 0); scene.add(INS);
const VS3 = 4.1;                                                   // the insert travels with her at the running speed
const x3 = t => (t - 7.5) * VS3;
// background: an ink plate cut by long horizontal lines that run past (paper; a few yellow for the lamps)
const streakMat = new THREE.ShaderMaterial({
  uniforms: { ...U }, vertexShader: VSW,
  fragmentShader: GLSL_HASH + `uniform vec3 uInk, uPaper, uYellow; varying vec3 vW;
    void main(){ float y = vW.y + 300.; float v = y*15., row = floor(v), f = abs(fract(v) - .5);
      float segL = .8 + h11(row*1.9)*3.2, s = vW.x/segL + h11(row*3.3)*7., j = floor(s), sf = fract(s);
      float band = 1. - smoothstep(.12, .62, abs(y - .05)) ;
      float on = step(1. - .55*band, h11(j*2.1 + row*.73));
      float w = (.08 + .26*h11(j + row*5.1))*on*smoothstep(0., .1, sf)*(1. - smoothstep(.6, 1., sf));
      float aa = fwidth(v), k = 1. - smoothstep(w - aa, w + aa, f);
      vec3 lc = h11(j*7.7 + row) > .8 ? uYellow : uPaper;
      gl_FragColor = vec4(mix(uInk, lc, k), 1.); }`,
});
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(60, 6), streakMat); bg.position.set(10, 0, -2.2); INS.add(bg); }
// the forearm, diagonal from the lower left: paper skin cut by its contour and shadow lines, the red cuff only in the corner, the strap
const ARM = (() => {
  const K = 1250, W = 2000, H = 1250, OX = 1000, OY = 640, [c, g] = mkCanvas(W, H), R = mulberry(202);
  g.setTransform(K, 0, 0, -K, OX, OY);                                         // metres, y up, the watch at the origin
  const ang = .31, ax = [Math.cos(ang), Math.sin(ang)], nr = [-ax[1], ax[0]];
  const at = (s, o) => [ax[0] * s + nr[0] * o, ax[1] * s + nr[1] * o];
  const hw = s => s < 0 ? lerp(.2, .232, clamp(-s / 1.1)) : s < .17 ? .2 - .01 * Math.sin(s / .17 * Math.PI) : .2 + .012 * Math.sin(clamp((s - .17) / .3) * Math.PI);
  const top = [], bot = [];
  for (let s = -1.25; s <= .44; s += .03) { top.push(at(s, hw(s) + (s > .2 && s < .38 ? .028 * Math.sin((s - .2) / .18 * Math.PI) : 0))); bot.push(at(s, -hw(s))); }
  const front = [at(.44, .17), at(.46, .08), at(.46, -.06), at(.43, -.17)];
  const P = polyP(new Path2D(), [...top.filter(p => p[0] * ax[0] + p[1] * ax[1] < .42), ...front, ...bot.filter(p => p[0] * ax[0] + p[1] * ax[1] < .42).reverse()]);
  g.fillStyle = PAPER; g.fill(P);
  g.save(); g.clip(P);
  // shadow side: cuts along the arm, widest at the lower edge (the tone is in their width)
  for (let k = 0; k < 16; k++) { const o = -hw(0) + .012 + k * .011; const s0 = -1.3 + R() * .3, s1 = .1 + R() * .25 - k * .01; const a = at(s0, o), b = at(s1, o + (R() - .5) * .004);
    cut(g, a[0], a[1], b[0], b[1], Math.max(.0016, .012 - k * .0008), R, INK, .9); }
  // the fingers' separations, the knuckles, a crease at the wrist
  for (const [s, o0, o1] of [[.49, .05, -.02], [.46, -.05, -.13], [.42, -.13, -.19]]) { const a = at(s, o0), b = at(s - .03, o1); cut(g, a[0], a[1], b[0], b[1], .006, R, INK, .7); }
  for (const o of [.12, .05, -.02]) { const a = at(.4, o), b = at(.43, o - .03); cut(g, a[0], a[1], b[0], b[1], .005, R, INK, .8); }
  { const a = at(.3, .2), b = at(.38, .14); cut(g, a[0], a[1], b[0], b[1], .006, R, INK, .8); }               // the thumb's edge
  g.restore();
  g.strokeStyle = INK; g.lineWidth = .007; g.lineJoin = 'round'; g.stroke(P);
  // fingers, little finger first, each a pair of segments curling down and back; the thumb along the top
  const seg2 = (a, b, r) => { const Q = capPath(new Path2D(), a, b, r, r * .92); g.fillStyle = PAPER; g.fill(Q); g.strokeStyle = INK; g.lineWidth = .0065; g.stroke(Q);
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = dy / L, ny = -dx / L; cut(g, a[0] + nx * r * .55 + dx * .1, a[1] + ny * r * .55 + dy * .1, b[0] + nx * r * .5 - dx * .05, b[1] + ny * r * .5 - dy * .05, r * .32, R, INK, .9); };
  [[-.13, .028], [-.05, .031], [.03, .032], [.11, .03]].forEach(([o, r]) => { const k0 = at(.43, o), k1 = at(.515, o - .035), k2 = at(.5, o - .11); seg2(k0, k1, r); seg2(k1, k2, r * .9);
    const n0 = at(.49, o - .02), n1 = at(.5, o - .05); cut(g, n0[0], n0[1], n1[0], n1[1], .004, R, INK, .6); });
  seg2(at(.24, .205), at(.37, .215), .034); seg2(at(.37, .215), at(.43, .19), .028);
  // the strap: an ink band around the wrist, paper stitches along its edges
  const sp = polyP(new Path2D(), [at(-.085, .25), at(.085, .25), at(.085, -.25), at(-.085, -.25)]);
  g.save(); g.clip(P); g.fillStyle = INK; g.fill(sp);
  for (let i = -5; i <= 5; i++) { for (const e of [-.068, .068]) { const a = at(e, i * .04), b = at(e, i * .04 + .018); cut(g, a[0], a[1], b[0], b[1], .004, R, PAPER, .4); } }
  g.restore();
  // the red cuff, only where the arm leaves the frame (a flat stab, a hair of paper at its edge)
  const cuff = polyP(new Path2D(), [at(-1.3, .3), at(-.66, .29), at(-.63, .1), at(-.65, -.12), at(-.68, -.3), at(-1.3, -.31)]);
  g.save(); g.clip(new Path2D(P)); g.restore();
  g.fillStyle = RED; g.fill(cuff); g.strokeStyle = PAPER; g.lineWidth = .006; g.stroke(cuff);
  return { tex: canvasTex(c), w: W / K, h: H / K, o: [OX / K - W / K / 2, H / K / 2 - OY / K] };
})();
const arm = new THREE.Mesh(new THREE.PlaneGeometry(ARM.w, ARM.h), cutoutMat(ARM.tex)); INS.add(arm);
// the watch: a gold case (the film's one yellow material, ink cut on its bezel), a paper dial with ink numerals, three ink hands
const goldMat = new THREE.ShaderMaterial({
  uniforms: { ...U }, vertexShader: `varying vec3 vP; varying vec3 vN; void main(){ vP = position; vN = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: GLSL_HASH + `uniform vec3 uInk, uPaper, uYellow; varying vec3 vP; varying vec3 vN;
    void main(){ float a = atan(vP.z, vP.x), r = length(vP.xz); vec3 col = uYellow;
      float u = a*48./6.2832; float f = abs(fract(u) - .5), aa = fwidth(u);
      float knurl = (1. - smoothstep(.18 - aa, .18 + aa, f)) * step(r, .19) * step(.163, r);
      float ring = 1. - smoothstep(.002, .004, abs(r - .168));
      col = mix(col, uInk, max(knurl*.9, ring));
      gl_FragColor = vec4(col, 1.); }`,
});
const watch = new THREE.Group(); INS.add(watch);
{ const caseM = new THREE.Mesh(new THREE.CylinderGeometry(.19, .195, .05, 64), goldMat); caseM.rotation.x = Math.PI / 2; watch.add(caseM);
  for (const s of [-1, 1]) for (const d of [-1, 1]) { const lug = new THREE.Mesh(new THREE.BoxGeometry(.05, .07, .03), goldMat); lug.position.set(d * .085, s * .205, -.005); watch.add(lug); } }
const WD = (() => {
  const S = 1024, [c, g] = mkCanvas(S, S), m = S / 2, R = mulberry(61);
  g.fillStyle = PAPER; g.beginPath(); g.arc(m, m, m, 0, TAU); g.fill();
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, r0 = m * (i % 5 ? .86 : .78), r1 = m * .94; g.strokeStyle = INK; g.lineWidth = i % 5 ? 5 : 14; g.beginPath(); g.moveTo(m + Math.cos(a) * r0, m + Math.sin(a) * r0); g.lineTo(m + Math.cos(a) * r1, m + Math.sin(a) * r1); g.stroke(); }
  g.fillStyle = INK; g.font = `700 ${m * .26}px "Newsreader"`; g.textAlign = 'center'; g.textBaseline = 'middle';
  [['12', -Math.PI / 2], ['3', 0], ['6', Math.PI / 2], ['9', Math.PI]].forEach(([s, a]) => g.fillText(s, m + Math.cos(a) * m * .6, m + Math.sin(a) * m * .6 + 6));
  // a fine engraved ring and a few knife nicks in the paper
  g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.arc(m, m, m * .72, 0, TAU); g.stroke();
  return canvasTex(c);
})();
{ const d = new THREE.Mesh(new THREE.CircleGeometry(.165, 64), new THREE.MeshBasicMaterial({ map: WD })); d.position.z = .026; watch.add(d); }
const handMesh = (L, w, tail) => { const s = new THREE.Shape(); s.moveTo(-tail, -w); s.lineTo(L, -w * .35); s.lineTo(L, w * .35); s.lineTo(-tail, w); s.closePath(); const m = new THREE.Mesh(new THREE.ShapeGeometry(s), inkMat); return m; };
const hH = handMesh(.09, .011, .02), hM = handMesh(.128, .008, .02), hS = handMesh(.142, .0035, .04);
hH.position.z = .028; hM.position.z = .029; hS.position.z = .03; watch.add(hH, hM, hS);
{ const pin = new THREE.Mesh(new THREE.CircleGeometry(.012, 20), inkMat); pin.position.z = .031; watch.add(pin); }
// rain on the crystal: drops drawn as ink crescents with a paper glint; one new drop lands at 8.1 s
const DROPC = (() => { const S = 512, [c, g] = mkCanvas(S, S); const R = mulberry(71);
  const drop = (x, y, r) => { g.fillStyle = INK; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = PAPER; g.beginPath(); g.arc(x - r * .18, y - r * .16, r * .78, 0, TAU); g.fill(); g.fillStyle = INK; g.beginPath(); g.arc(x + r * .1, y + r * .12, r * .5, 0, TAU); g.globalCompositeOperation = 'destination-out'; g.fill(); g.globalCompositeOperation = 'source-over'; };
  for (const [x, y, r] of [[150, 330, 16], [360, 180, 11], [300, 390, 9], [410, 300, 13], [120, 190, 8]]) drop(x, y, r);
  return c; })();
const dropsTex = canvasTex(DROPC);
const crystal = new THREE.Mesh(new THREE.CircleGeometry(.165, 48), cutoutMat(dropsTex)); crystal.position.z = .033; watch.add(crystal);
const newDrop = new THREE.Mesh(new THREE.CircleGeometry(.024, 24), new THREE.MeshBasicMaterial({ color: C.ink })); newDrop.position.set(.06, .07, .034); watch.add(newDrop);
const newDropIn = new THREE.Mesh(new THREE.CircleGeometry(.017, 24), new THREE.MeshBasicMaterial({ color: C.paper })); newDropIn.position.set(.056, .074, .035); watch.add(newDropIn);
// the near column in the insert: the other half of the pass at 7.5 s
const col3 = new THREE.Mesh(new THREE.CylinderGeometry(.44, .44, 4, 28), postMat); INS.add(col3);
const rain3 = billboards(140, billboardMat(rainTex, 0), false); INS.add(rain3);

// ═════════ the camera: one move, three joins
function aim(eye, tgt, fov, shift = 0, near = .05) {
  camera.fov = fov; camera.near = near; camera.far = 4000;
  camera.position.set(...eye); camera.up.set(0, 1, 0); camera.lookAt(...tgt);
  camera.updateProjectionMatrix();
  if (shift) { camera.projectionMatrix.elements[9] = 2 * shift; camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert(); }
}
const camS1 = t => { const d = .04 * t; aim([-.12 + d, .62, 3.05], [.02 + d, .3, 0], 24); };
const camS2 = t => { const x = xA(t) + .4; aim([x, 1.1, 3.9], [x, 1.1, 0], 52, .13, .03); };
const camS3 = t => { const x = x3(t) + .02 * (t - 7.5), b = .007 * Math.sin((t - EV.splash) * TAU * CADENCE / 2), b2 = .004 * Math.sin((t - EV.splash) * TAU * CADENCE); aim([x + .14, -300 + .03 + b, 1.9 + b2], [x + .1, -300 + .0 + b, 0], 25, 0, .02); };
const camS4 = t => { const sh = lerp(.38, .25, eio(seg(t, 9.26, 10.6))), y = 28 - 2.5 * seg(t, 9.26, 10.4); const e = [36, y, -18]; aim(e, [e[0] + Math.sin(.14) * 100, e[1], e[2] - Math.cos(.14) * 100], 38, sh, .5); };

// state for each picture
function setStreet(t, k) {
  street.visible = k !== 'S3'; city.visible = k !== 'S3'; INS.visible = k === 'S3';
  groundMat.uniforms.uT.value = t; placeRain(t); placeSteam(t); placeDrops(t);
  // AKI's canvas box: tighter (sharper) for the ground-level insert
  if (k === 'S1' || k === 'S2') {
    const px = X(t), bx = k === 'S1' ? { x0: px - 380, y0: -640, s: 760 } : { x0: px - 560, y0: -860, s: 1120 };
    drawAki(t, bx);
    const x0 = wx(bx.x0), x1 = wx(bx.x0 + bx.s), y1 = -bx.y0 * M, y0 = -(bx.y0 + bx.s) * M;
    aki.scale.set(x1 - x0, y1 - y0, 1); aki.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); aki.visible = true;
    groundMat.uniforms.uAK.value.set(x0, y0, x1, y1); groundMat.uniforms.uAKon.value = 1;
  } else { aki.visible = false; groundMat.uniforms.uAKon.value = 0; }
  // the clock and its chime
  const on = t >= EV.chime; dialMat.map = on ? dialLit : dialDark;
  const ra = t - EV.chime; rings.visible = ra > 0 && ra < .5; if (rings.visible) { const s = TOWER.r * 2 * (1.2 + ra * 5); rings.scale.set(s, s, 1); }
}
function setInsert(t) {
  INS.visible = true; street.visible = false; city.visible = false;
  const x = x3(t);
  arm.position.set(x + .02 - ARM.o[0], .0 - ARM.o[1], -.04);
  watch.position.set(x + .02, 0, 0); watch.scale.setScalar(.8); watch.rotation.set(-.22, .16, .31);
  // the hands: 23:58, the second hand ticking once a second (47 → 48 at 8.4 s → 49 at 9.4 s)
  const sec = 47 + (t >= 8.4 ? 1 : 0) + (t >= 9.4 ? 1 : 0), kick = t >= 8.4 ? Math.exp(-(t - (t >= 9.4 ? 9.4 : 8.4)) * 30) * .05 : 0;
  hH.rotation.z = -(AH + Math.PI / 2) + Math.PI / 2; hM.rotation.z = -(AMN + Math.PI / 2) + Math.PI / 2; hS.rotation.z = Math.PI / 2 - (sec / 60) * TAU + kick;
  const nd = t >= 8.1; newDrop.visible = newDropIn.visible = nd;
  col3.position.set(x3(7.5) + .14 - .14, -.5, 1.9 - .52);
  // its own rain in front of the arm
  const R = mulberry(9), L = []; for (let i = 0; i < 140; i++) { const h = 2.6, ph = R() * h, y = h / 2 - ((t * 7.5 + ph) % h); L.push([x3(7.5) - 2 + R() * 14, y, .25 + R() * .9, .005, .07, Math.floor(R() * 8), .08]); } fillBoards(rain3, L, 8, 1);
}
function picture(t, k) {
  if (k === 'S3') { setInsert(t); camS3(t); }
  else { setStreet(t, k); (k === 'S1' ? camS1 : k === 'S2' ? camS2 : camS4)(t); }
  U.uCam.value.copy(camera.position); sky.position.copy(camera.position);
}
const subC = document.createElement('canvas'); subC.width = 4; subC.height = 4; const subTex = canvasTex(subC, false);
const PEEL = [9.26, 9.49];
const kindAt = t => t < 2.5 ? 'S1' : t < 7.5 ? 'S2' : t < PEEL[0] ? 'S3' : 'S4';
window.render = (t) => {
  printMat.uniforms.uPeel.value = -1; printMat.uniforms.uFresh.value = 0; printMat.uniforms.tSub.value = subTex;
  const k = kindAt(t);
  if (t >= PEEL[0] && t < PEEL[1]) {                          // the insert's sheet peels from the corner onto the city printed again
    picture(t, 'S4'); draw(rtB); picture(t, 'S3'); draw(rtA);
    printMat.uniforms.uPeel.value = eio((t - PEEL[0]) / (PEEL[1] - PEEL[0])); printMat.uniforms.uFresh.value = .35;
  } else {
    picture(t, k); draw(rtA);
    if (t >= PEEL[1]) printMat.uniforms.uFresh.value = .35 * (1 - ss(seg(t, PEEL[1], PEEL[1] + .4)));
  }
  printMat.uniforms.uT.value = t;
  printMat.uniforms.uWhite.value = t < 2.5 ? ss(seg(t, 2.28, 2.5)) : 1 - ss(seg(t, 2.5, 2.74));
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
};

window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0);
window.READY = true;
