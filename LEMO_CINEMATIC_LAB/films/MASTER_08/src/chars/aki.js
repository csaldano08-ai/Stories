// AKI — protagonist of "Last Train Home". Profile rig + body drawing (see bible/AKI.md for the model sheet & rules).
// Units: 600 u tall (7.5 heads, head = 80 u). Profile faces +x; mirror the whole group with scale(-1,1) to face left.
import { path } from '../lib/cel.js';
import { celGroup, iline } from '../lib/celgroup.js';
import { dirDown, dirUp, add, sub, rot, ik2, ankleFromBall } from '../lib/rig.js';
import { headProfile } from './head.js';
import { hairUnder, hairOver } from './hair.js';
import { drawKitten } from './kitten.js';

export const B = { thigh: 150, shin: 144, upper: 108, fore: 92, spineL: 72, spineU: 108, neck: 30 };

// ——— skeleton ———
// S.pelvis, S.tL, S.tU, S.neck, S.head (radians), S.legs.{n,f}: {ball, pitch} | {ankle}, S.arms.{n,f}: {sh, el, wr} | {tgt, bend}
export function solveProfile(S) {
  const J = { S };
  const P = J.pelvis = S.pelvis;
  const uL = dirUp(S.tL), uU = dirUp(S.tU);
  J.fL = [Math.cos(S.tL), Math.sin(S.tL)]; J.uL = uL; J.uU = uU; J.fU = [Math.cos(S.tU), Math.sin(S.tU)];
  J.waist = add(P, uL, B.spineL);
  J.neckBase = add(J.waist, uU, B.spineU);
  J.sh = { n: add(add(J.neckBase, uU, -15), J.fU, -3) };
  J.sh.f = add(J.sh.n, [-4, -3]);
  J.neckTop = add(J.neckBase, dirUp(S.neck), B.neck);
  J.headA = S.head;
  J.headC = sub(J.neckTop, rot([-8, 30], S.head));
  J.hip = { n: P, f: add(P, [-3, -2]) };
  J.leg = {}; J.arm = {};
  for (const k of ['n', 'f']) {
    const L = S.legs[k];
    const ankle = L.ankle || ankleFromBall(L.ball, L.pitch || 0);
    const r = ik2(J.hip[k], ankle, B.thigh, B.shin, +1);
    J.leg[k] = { hip: J.hip[k], knee: r.mid, ankle: r.end, ball: L.ball || add(r.end, rot([44, 16], L.pitch || 0)), pitch: L.pitch || 0, planted: L.planted };
    const A = S.arms[k], s0 = J.sh[k];
    let el, wr, foreA;
    if (A.tgt) { const q = ik2(s0, A.tgt, B.upper, B.fore, A.bend ?? -1); el = q.mid; wr = q.end; foreA = Math.atan2(wr[0] - el[0], wr[1] - el[1]); }
    else { el = add(s0, dirDown(A.sh), B.upper); foreA = A.sh + A.el; wr = add(el, dirDown(foreA), B.fore); }
    J.arm[k] = { sh: s0, el, wr, handA: foreA + (A.wr || 0), hand: A.hand || 'relax' };
  }
  return J;
}

// ——— shape builders ———
// limb segment from A to B; f = [w0, wMid, w1, midPos] on the front (+x for a limb pointing down), b = same on the back
export function limbSeg(A, Bp, f, b, capA = .7, capB = .7) {
  const d = sub(Bp, A), L = Math.hypot(d[0], d[1]) || 1, u = [d[0] / L, d[1] / L], n = [u[1], -u[0]];
  const at = (s, w) => [A[0] + u[0] * s * L + n[0] * w, A[1] + u[1] * s * L + n[1] * w];
  const pts = [
    at(0, f[0]), at(f[3], f[1]), at(1, f[2]),
    [Bp[0] + u[0] * capB * (f[2] + b[2]) / 2 + n[0] * (f[2] - b[2]) / 2, Bp[1] + u[1] * capB * (f[2] + b[2]) / 2 + n[1] * (f[2] - b[2]) / 2],
    at(1, -b[2]), at(b[3], -b[1]), at(0, -b[0]),
    [A[0] - u[0] * capA * (f[0] + b[0]) / 2 + n[0] * (f[0] - b[0]) / 2, A[1] - u[1] * capA * (f[0] + b[0]) / 2 + n[1] * (f[0] - b[0]) / 2],
  ];
  return path(pts, true);
}
// point in a body frame: origin o, up u, forward f; s along up, n along forward
const F = (o, u, f) => (s, n) => [o[0] + u[0] * s + f[0] * n, o[1] + u[1] * s + f[1] * n];

// ——— foot / boot (profile) ———
// foot-local: ankle at (0,0), ball at (44,16); toes stay flat on the ground while planted with the heel up
function bootPath(J, k) {
  const L = J.leg[k], p = L.pitch, ball = L.ball;
  const ballL = [44, 16];
  const W = (x, y, rigid) => {   // foot-local → world
    const toeFlat = L.planted && p > 0 && x > ballL[0];
    const v = rot([x - ballL[0], y - ballL[1]], toeFlat ? 0 : p);
    return [ball[0] + v[0], ball[1] + v[1]];
  };
  const pts = [
    W(-13, -20), W(-17, -6), W(-21, 8), [...W(-19, 17), 1], W(4, 18), W(30, 18), W(50, 17), W(62, 15.5), W(67, 11), W(62, 5),
    W(44, 1), W(26, -4), W(12, -11), W(9, -20),
  ];
  return path(pts, true);
}

// ——— hands (profile) ——— hand-local: wrist (0,0), +y along the hand, +x the thumb/front side
const HANDS = {
  fist: [[-8, 0], [-11, 12], [-12, 26], [-8, 35], [2, 38], [11, 33], [13, 22], [14, 12], [9, 3]],
  relax: [[-7, 0], [-9, 18], [-9, 36], [-4, 52], [3, 55], [8, 49], [9, 36], [14, 24], [13, 14], [8, 3]],
  open: [[-7, 0], [-8, 26], [-6, 50], [-1, 60], [5, 60], [8, 50], [9, 30], [17, 20], [15, 11], [8, 2]],
  cup: [[-7, 0], [-10, 16], [-8, 34], [0, 48], [10, 52], [16, 46], [10, 40], [8, 30], [12, 18], [8, 4]],
  grip: [[-8, 0], [-11, 14], [-11, 30], [-6, 40], [4, 42], [12, 36], [10, 26], [14, 14], [9, 3]],
};
export function handPath(wr, a, kind, flip = 1, scale = 1) {
  const u = dirDown(a), n = [u[1], -u[0]];
  const pts = (HANDS[kind] || HANDS.relax).map(([x, y]) => [wr[0] + (n[0] * x * flip + u[0] * y) * scale, wr[1] + (n[1] * x * flip + u[1] * y) * scale]);
  return path(pts, true);
}
function handLines(g, wr, a, kind, col) {
  const u = dirDown(a), n = [u[1], -u[0]], T = (x, y) => [wr[0] + n[0] * x + u[0] * y, wr[1] + n[1] * x + u[1] * y];
  if (kind === 'fist' || kind === 'grip') { iline(g, path([T(-6, 26), T(2, 30), T(9, 26)], false), col, 1.1); iline(g, path([T(5, 12), T(10, 20)], false), col, 1.1); }
  else if (kind === 'relax' || kind === 'cup') iline(g, path([T(2, 30), T(6, 44)], false), col, 1);
}

// ——— the whole figure (profile) ———
// o: { P (palette set), L (light: {sh, hi, rim}), jacket:1|0, wet:0..1, hair:{...lags}, hemB:[dx,dy], hemF, face:{…} }
const scaleL = (L, k) => ({ sh: L.sh && [L.sh[0] * k, L.sh[1] * k], hi: L.hi && [L.hi[0] * k, L.hi[1] * k], rim: L.rim && { c: L.rim.c, d: [L.rim.d[0] * Math.max(.6, k), L.rim.d[1] * Math.max(.6, k)] } });
export { scaleL };
// IK targets for cradling the bundle (world coords): near hand under its front, far hand on its top
export function bundleHands(J) { const UL = F(J.waist, J.uU, J.fU); return { n: UL(26, 98), f: UL(78, 70) }; }
export function drawProfile(g, J, o) {
  const P = o.P, L = o.L, S = J.S, LS = scaleL(L, .38);
  const far = k => P.far(k);
  const lw = o.lw ?? 2.1;
  const wetK = o.wet || 0;
  const sweater = wetK ? P.wet('sweater', wetK) : P.sweater;
  const top = o.jacket ? P.jacket : sweater;
  const UL = F(J.waist, J.uU, J.fU), LL = F(J.pelvis, J.uL, J.fL);
  // —— hair underlayer (behind everything)
  hairUnder(g, P, J, o, 'side');
  // —— far arm
  const sleeveSeg = (a, k) => [
    limbSeg(a.sh, a.el, [15, 15, 12, .5], [15, 15, 12, .5], .9, .6),
    limbSeg(a.el, a.wr, [12, 12, 11, .5], [12, 11.5, 10.5, .5], .5, .3),
  ];
  {
    const a = J.arm.f;
    celGroup(g, sleeveSeg(a), o.jacket ? far('jacket') : far('sweater'), L, { lw });
    celGroup(g, [handPath(a.wr, a.handA, a.hand)], far('skin'), LS, { lw: lw * .8 });
  }
  // —— far leg (trousers + boot)
  const legShapes = (Lg) => [
    limbSeg(Lg.hip, Lg.knee, [29, 25, 19, .35], [33, 25, 19, .5], .5, .6),
    limbSeg(Lg.knee, Lg.ankle, [18, 16, 12, .3], [19, 22, 12, .32], .5, .3),
  ];
  {
    const Lg = J.leg.f;
    celGroup(g, [bootPath(J, 'f'), limbSeg(Lg.ankle, add(Lg.ankle, sub(Lg.knee, Lg.ankle), .36), [13, 13, 14, .5], [13, 14, 15, .5], .2, .2)], far('boots'), L, { lw });
    celGroup(g, legShapes(Lg), far('trousers'), L, { lw });
  }
  // —— torso (sweater) + trouser seat
  const torso = path([
    UL(B.spineU, 11), UL(99, 21), UL(84, 33), UL(66, 43), UL(52, 41), UL(40, 31), UL(24, 26), UL(0, 25),
    LL(44, 27), LL(20, 30), LL(10, 31),
    LL(10, -38), LL(36, -31),
    UL(0, -27), UL(28, -29), UL(60, -34), UL(88, -29), UL(B.spineU - 4, -14),
  ]);
  celGroup(g, [torso], sweater, L, { lw, xs: o.jacket ? [] : [path([UL(60, 43), UL(52, 41), UL(40, 31), UL(30, 28), UL(44, 36)])] });
  // —— near leg + seat
  {
    const Lg = J.leg.n;
    celGroup(g, [bootPath(J, 'n'), limbSeg(Lg.ankle, add(Lg.ankle, sub(Lg.knee, Lg.ankle), .36), [13, 13, 14, .5], [13, 14, 15, .5], .2, .2)], P.boots, L, { lw });
    const seat = path([LL(14, 30), LL(-8, 24), LL(-22, 10), LL(-24, -12), LL(-14, -35), LL(8, -40), LL(14, -38)]);
    celGroup(g, [seat, ...legShapes(Lg)], P.trousers, L, { lw, xs: o.jacket ? [path([LL(-30, 50), LL(-30, -60), LL(-50, -60), LL(-50, 50)])] : [] });
    // trouser hem over the boot + knee crease
    const sh = sub(Lg.ankle, Lg.knee), sl = Math.hypot(...sh), su = [sh[0] / sl, sh[1] / sl], sn = [su[1], -su[0]];
    const hem = add(Lg.ankle, su, -34);
    iline(g, path([add(hem, sn, 15), add(add(hem, su, 3), sn, 0), add(hem, sn, -17)], false), P.trousers.l, 1.4);
  }
  // —— jacket
  if (o.jacket) {
    const hb = o.hemB || [0, 0], hf = o.hemF || [0, 0];
    // shrug: the jacket slides back off the shoulders (upper part only)
    const sk = o.shrug || 0, dsh = [-J.uU[0] * 46 * sk - J.fU[0] * 18 * sk, -J.uU[1] * 46 * sk - J.fU[1] * 18 * sk];
    const UL0 = UL; const ULj = (s, n) => { const p = UL0(s, n), w = Math.max(0, Math.min(1, (s - 30) / 80)); return [p[0] + dsh[0] * w, p[1] + dsh[1] * w]; };
    const hemB = add(LL(-34, -46), hb), hemF = add(LL(-30, 33), hf), hemM = add(LL(-38, -6), [(hb[0] + hf[0]) * .5, (hb[1] + hf[1]) * .5]);
    const body = path([
      ULj(B.spineU + 14, -8), ULj(B.spineU + 8, 4), ULj(B.spineU - 4, 12), [...ULj(84, 28), 1], ULj(70, 40), ULj(52, 40), ULj(22, 32), LL(52, 33), LL(20, 35), [...hemF, 1],
      hemM, [...hemB, 1], LL(0, -47), LL(34, -37), ULj(10, -33), ULj(50, -38), ULj(84, -33), ULj(B.spineU - 2, -22), ULj(B.spineU + 10, -17),
    ]);
    const shadowUnderLapel = path([UL(84, 28), UL(70, 40), UL(56, 33), UL(76, 22)]);
    celGroup(g, [body], P.jacket, L, { lw, xs: [shadowUnderLapel] });
    // lapel / collar fold, front edge, seams, pocket, belt loops
    const J2 = P.jacket.l;
    iline(g, path([UL(B.spineU + 8, 4), UL(B.spineU - 6, -6), UL(90, 6), [...UL(84, 28), 1]], false), J2, 1.5);
    iline(g, path([UL(B.spineU - 4, -20), UL(B.spineU - 14, -10), UL(B.spineU - 22, 0)], false), J2, 1.3);
    iline(g, path([LL(40, 22), LL(30, 22), LL(30, 6)], false), J2, 1.2);   // pocket flap
    iline(g, path([UL(-2, -31), UL(-2, 30)], false), J2, 1.1);              // waist seam
  }
  // —— the bundle (jacket wrapped round the kitten) held against the chest
  if (o.bundle) {
    const c = UL(50, 66);
    g.save(); g.translate(c[0], c[1]); g.rotate(S.tU);
    celGroup(g, [path([[-40, -6], [-28, -32], [4, -40], [38, -30], [52, -2], [42, 28], [8, 40], [-28, 34]])], P.jacket, L, { lw, xs: [path([[-28, 34], [8, 40], [42, 28], [30, 18], [-20, 22]])] });
    g.save(); g.translate(16, -26); g.scale(.82, .82); drawKitten(g, P, { ...o.bundle, body: false }, L); g.restore();
    celGroup(g, [path([[-38, -6], [-8, -20], [26, -22], [50, -6], [34, 6], [-26, 6]])], P.jacket, L, { lw });
    iline(g, path([[-24, 14], [6, 22], [36, 14]], false), P.jacket.l, 1.1);
    g.restore();
  }
  // —— neck + head
  const neckA = J.neckBase, neckB = J.neckTop;
  celGroup(g, [limbSeg(add(neckA, J.uU, -8), add(neckB, dirUp(S.neck), 14), [11, 10, 10, .5], [10, 10, 10, .5], .2, .2)], P.skin, L, { lw: lw * .8,
    xs: [path([add(neckB, [-14, -6]), add(neckB, [16, -2]), add(neckB, [14, 14]), add(neckB, [-14, 14])])] });
  if (!o.jacket) {   // sweater roll neck
    celGroup(g, [limbSeg(add(neckA, J.uU, -4), add(neckA, J.uU, 16), [15, 15, 13, .5], [15, 15, 13, .5], .4, .4)], sweater, L, { lw });
    iline(g, path([add(add(neckA, J.uU, 6), J.fU, -14), add(add(neckA, J.uU, 7), J.fU, 0), add(add(neckA, J.uU, 6), J.fU, 14)], false), sweater.l, 1.1);
  }
  headProfile(g, P, J.headC, J.headA, o.face || {}, L, o);
  hairOver(g, P, J, o, 'side');
  // —— near arm
  {
    const a = J.arm.n;
    celGroup(g, sleeveSeg(a), top, L, { lw });
    const cu = sub(a.wr, a.el), cl = Math.hypot(...cu), cuu = [cu[0] / cl, cu[1] / cl], cn = [cuu[1], -cuu[0]];
    const c0 = add(a.wr, cuu, -14);
    iline(g, path([add(c0, cn, 12), add(add(c0, cuu, 2), cn, 0), add(c0, cn, -11.5)], false), top.l, 1.3);
    if (o.watch) watchSide(g, P, a.wr, a.handA, L);
    celGroup(g, [handPath(a.wr, a.handA, a.hand)], P.skin, LS, { lw: lw * .8 });
    handLines(g, a.wr, a.handA, a.hand, P.skin.l);
  }
}

function watchSide(g, P, wr, a, L) {
  const u = dirDown(a), n = [u[1], -u[0]], c = add(wr, u, -6);
  celGroup(g, [path([add(c, n, 13), add(add(c, n, 13), u, -7), add(add(c, n, -12), u, -7), add(c, n, -12)])], P.strap, L, { lw: 1.4 });
  celGroup(g, [path([add(add(c, n, 15), u, 1), add(add(c, n, 15), u, -8), add(add(c, n, 9), u, -9), add(add(c, n, 9), u, 2)])], P.gold, L, { lw: 1.2 });
}
