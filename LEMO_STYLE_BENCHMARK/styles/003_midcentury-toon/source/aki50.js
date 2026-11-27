// AKI in the 1950s mid-century construction (profile, facing +x).
// The skeleton is the shared rig (shared/aki2/aki_profile.js → solveProfile): bone lengths, two-bone IK, reach limits and
// foot lock come from there. Only the drawing is this style's: geometric egg head with the nose inside the face outline,
// flat lineless hair, limbs as an ink ribbon with an off-register colour ribbon on top, four-finger cartoon hands, flat
// darker planes for shade (no gradients). Units = rig units (600 u tall); k = 1/scale keeps ink widths in screen px.
import { PAL, shape, ink, ellipse, spline, xform, move, rrect, TAU, reg, path } from './engine/toon.js';

export const C = {
  coat: '#D65A3C', coatD: '#A8402C', coatL: '#EC8A6C', coatF: '#B94A33',
  knit: '#EFE3C8', knitD: '#D5C4A2',
  trou: '#2F2E3B', trouF: '#24232E',
  boot: '#7A4A2F', bootF: '#57341F',
  hair: '#4B2B46', hairL: '#6C4566',
  skin: '#F2C7A0', skinD: '#D9A27C',
  gold: '#D9B256', goldD: '#A8822E', dial: '#FBF6EA', strap: '#5A3B2A',
  iris: '#6B3F22', eyeW: '#FBF6EA', cheek: '#EE9C8C', mouth: '#6A2834',
  ink: PAL.ink,
};
const add = (p, v, s = 1) => [p[0] + v[0] * s, p[1] + v[1] * s];
const nrm = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const lerpP = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// limb = ink ribbon + colour ribbon printed off-register (the colour cel never sits exactly in its line)
function limbInk(g, P, w, k, seed, edge = 8.4) { ink(g, P, w + edge * k, { seed, taper: false, wob: .07 }); }
function limbCol(g, P, w, col, k, seed) { const o = reg(seed, k); ink(g, move(P, o[0] * .55, o[1] * .55), w, { seed: seed + 1, taper: false, wob: .04, color: col }); }

// four-finger hand (three fingers + thumb), union outline then fill (STYLE §9: stroke every part first, fill second)
export function hand50(g, x, y, a, kind = 'grip', side = 1, s = 1, lw = 6, skin = C.skin) {
  const parts = [], seps = [];
  const E = (cx, cy, rx, ry, rot = 0) => parts.push(ellipse(cx, cy, rx, ry, 18, 0, TAU, rot));
  E(12, 0, 15, 13.5);
  if (kind === 'open') { [-0.55, 0, 0.55].forEach(r => E(12 + Math.cos(r) * 25, Math.sin(r) * 25, 12, 5, r)); E(4, -15 * side, 10, 5, -1.35 * side); }
  else if (kind === 'relax') { [-8, 1, 9].forEach((dy, i) => E(30 + (i === 1 ? 2 : 0), dy, 11, 4.8, .35)); E(10, -14 * side, 9, 5, -.8 * side); seps.push([[22, -4], [36, -1]], [[22, 5], [35, 8]]); }
  else { E(26, -8, 6.5, 6.5); E(28, 1, 6.5, 6.5); E(25, 10, 6, 6); E(12, -14 * side, 9, 5.5, -0.4 * side); seps.push([[22, -3.5], [30, -3.5]], [[22, 5.5], [29, 5.5]]); }
  const P = parts.map(p => xform(p, x, y, a, s));
  g.save(); g.strokeStyle = C.ink; g.lineWidth = lw; g.lineJoin = 'round';
  for (const p of P) { path(g, p); g.stroke(); }
  const o = reg(77, lw / 6); g.fillStyle = skin;
  for (const p of P) { path(g, move(p, o[0] * .5, o[1] * .5)); g.fill(); }
  g.lineWidth = lw * .4; g.lineCap = 'round';
  for (const s2 of seps) { const q = xform(s2, x, y, a, s); g.beginPath(); g.moveTo(...q[0]); g.lineTo(...q[1]); g.stroke(); }
  g.restore();
}

// boot in the foot frame (ankle at origin, +x toward the toe, sole on y = +17), rotated by the foot pitch
const BOOT = [[-13, -36], [13, -36], [16, -9], [34, 3], [56, 7], [63, 12], [60, 17], [44, 17], [-19, 17], [-23, 7], [-17, -12]];
function boot(g, J, kk, col, k, seed) {
  const L = J.leg[kk], pts = xform(BOOT, L.ankle[0], L.ankle[1], L.pitch);
  shape(g, pts, { fill: col, line: 4.2 * k, seed, regK: k, grain: .25, breaks: .1, shade: [{ pts: xform([[-24, 9], [64, 9], [64, 20], [-24, 20]], L.ankle[0], L.ankle[1], L.pitch), color: '#2B2420', alpha: .55 }] });
}
function leg(g, J, kk, col, bootCol, k, seed) {
  const L = J.leg[kk];
  boot(g, J, kk, bootCol, k, seed + 5);
  const th = [L.hip, lerpP(L.hip, L.knee, .5), L.knee], sh = [L.knee, lerpP(L.knee, L.ankle, .5), add(L.ankle, nrm([L.ankle[0] - L.knee[0], L.ankle[1] - L.knee[1]]), -6)];
  limbInk(g, th, 36, k, seed); limbInk(g, sh, 29, k, seed + 2);
  limbCol(g, th, 36, col, k, seed); limbCol(g, sh, 29, col, k, seed + 2);
  // trouser hem: one short ink tick across the shin just above the boot
  const d = nrm([L.ankle[0] - L.knee[0], L.ankle[1] - L.knee[1]]), n = [-d[1], d[0]], hm = add(L.ankle, d, -16);
  ink(g, [add(hm, n, 13), add(hm, n, -13)], 2.6 * k, { seed: seed + 9, taper: false, color: '#2B2420' });
}

// arm: skin forearm under a sleeve that can slide back (cuffBack 0..1 = the sleeve pushed 14 u up the forearm)
function arm(g, J, kk, o, k, seed) {
  const A = J.arm[kk], far = kk === 'f';
  const d = nrm([A.wr[0] - A.el[0], A.wr[1] - A.el[1]]), cb = far ? 0 : (o.cuffBack || 0);
  const cuffAt = add(A.wr, d, -(14 + 14 * cb));
  // forearm skin (visible only where the sleeve has slid back)
  if (cb > .02) { const P = [add(A.wr, d, -34), A.wr]; limbInk(g, P, 20, k, seed + 20); limbCol(g, P, 20, C.skin, k, seed + 20); }
  // watch on the LEFT (near) wrist: strap + gold case, drawn before the sleeve so the cuff overlaps the strap edge
  let watch = null;
  if (!far) {
    const wc = add(A.wr, d, -10), n = [-d[1], d[0]];
    if (cb > .02 || o.watchAlways) {
      ink(g, [add(wc, n, 12), add(wc, n, -12)], 9 * (1 + 0 * k), { seed: seed + 31, taper: false, color: C.strap });
      shape(g, ellipse(wc[0], wc[1], 8.2, 8.2, 20), { fill: C.gold, line: 3.2 * k, seed: seed + 32, regK: k, grain: .1, breaks: 0 });
      if (cb > .4) shape(g, ellipse(wc[0], wc[1], 5.4, 5.4, 16), { fill: C.dial, line: 0, off: [0, 0], grain: 0 });
    }
    watch = wc;
  }
  const sleeve = [A.sh, lerpP(A.sh, A.el, .5), A.el, lerpP(A.el, cuffAt, .5), cuffAt];
  limbInk(g, sleeve, 27, k, seed, far ? 5 : 8.4); limbCol(g, sleeve, 27, far ? C.coatF : C.coat, k, seed);
  // cuff band (a flat darker plane across the sleeve end)
  const n = [-d[1], d[0]], c0 = add(cuffAt, d, -9);
  ink(g, [add(c0, n, 11.5), add(c0, n, -11.5)], 5 * Math.max(1, k * .75), { seed: seed + 3, taper: false, color: far ? '#8E3524' : C.coatD });
  // hand
  const aStd = Math.atan2(d[1], d[0]) + (A.wrA || 0);
  hand50(g, A.wr[0] + d[0] * 2, A.wr[1] + d[1] * 2, aStd, A.hand === 'grip' ? 'grip' : A.hand || 'grip', 1, .92, 5.2 * k, far ? C.skinD : C.skin);
  return watch;
}

// head in its own frame (centre, angle), facing +x
function head(g, J, o, k) {
  const c = add(J.headC, [Math.sin(J.headA) * -10, -Math.cos(J.headA) * 10]), a = J.headA;
  const X = pts => xform(pts, c[0], c[1], a);
  const lag = o.hairLag || [0, 0], lx = Math.max(-30, Math.min(8, lag[0])), ly = Math.max(-10, Math.min(12, lag[1]));
  // skin: ONE outline from the bridge round the skull, down the face, closed at the nose tip (STYLE §9)
  const chain = [[35, -12], [34, -34], [20, -54], [-10, -61], [-40, -47], [-50, -12], [-44, 22], [-24, 44], [2, 54], [22, 49], [31, 38], [33, 30], [36, 21], [37, 10]];
  const face = [...spline(chain, false, 6), [50, 2]];
  shape(g, X(face), { fill: C.skin, line: 4 * k, seed: 61, regK: k, grain: .12, breaks: .14, shade: [{ pts: [[-60, 8], [10, 30], [30, 70], [-60, 70]], color: C.skinD, alpha: .55 }].map(s => ({ ...s, pts: X(s.pts) })) });
  // cheek
  shape(g, X(ellipse(12, 18, 8, 4.6, 16)), { fill: C.cheek, line: 0, off: reg(64, k * .5), grain: 0, alpha: .6 });
  // eye — refined almond: lid covers the top of the iris, lash line thickest at the outer third with a short flick
  const look = o.look || 0, blink = o.blink || 0;
  if (blink < .5) {
    const al = X(spline([[31, -5], [23, -10.5], [13, -6.5], [22, -2]], true, 6));
    g.save(); path(g, al); g.fillStyle = C.eyeW; g.fill(); g.clip();
    const ic = X([[26.5 + look * 2.5, -6.2 + (o.lookDown || 0) * 2.4]])[0];
    g.fillStyle = C.iris; g.beginPath(); g.arc(ic[0], ic[1], 4.4, 0, TAU); g.fill();
    g.fillStyle = '#24140C'; g.beginPath(); g.arc(ic[0] + .4, ic[1], 2.2, 0, TAU); g.fill();
    g.fillStyle = C.eyeW; g.beginPath(); g.arc(ic[0] + 1.4, ic[1] - 1.4, 1.1, 0, TAU); g.fill();
    g.restore();
    ink(g, X([[31.5, -6], [26, -10.2], [19, -10], [13, -7.5], [9.5, -10.5]]), 3.4 * Math.min(1.6, k * .9), { seed: 71, taper: true, wob: .2 });
    ink(g, X([[19, -2.6], [13.5, -5]]), 1.3 * k, { seed: 72, taper: true });
    ink(g, X([[28, -13], [18, -13.4]]), 1.1 * k, { seed: 73, taper: true });
  } else ink(g, X([[31, -6], [22, -4], [13, -6.5]]), 3 * k, { seed: 74, taper: true });
  ink(g, X([[33, -19.5], [25, -22.5], [14, -20.5]]), 3.4 * k, { seed: 75, taper: true, wob: .25 });     // brow, tapered, arch at 2/3
  // mouth
  if (o.mouth === 'pant') { shape(g, X(ellipse(31.5, 28, 3.4, 4.6, 14)), { fill: C.mouth, line: 2.2 * k, seed: 76, regK: k, grain: 0, breaks: 0 }); }
  else if (o.mouth === 'o') { shape(g, X(ellipse(32, 28, 3, 3.6, 14)), { fill: C.mouth, line: 2.2 * k, seed: 76, regK: k, grain: 0, breaks: 0 }); }
  else ink(g, X([[34, 27.5], [28.5, 28.8]]), 2.4 * k, { seed: 77, taper: true });
  // hair: flat, lineless; shoulder-length bob with side-swept bangs above the brows, streaming with the run
  const H = [[33, -32], [22, -56], [0, -66], [-28, -63], [-50, -46], [-58, -12], [-58 + lx * .3, 26 + ly * .3], [-55 + lx * .8, 56 + ly * .8], [-45 + lx, 68 + ly], [-33 + lx * .6, 62 + ly * .6], [-28, 38], [-22, 14], [-14, -4], [0, -16], [16, -23], [29, -25], [37, -28]];
  shape(g, X(spline(H, true, 6)), { fill: C.hair, line: 0, seed: 66, regK: k, grain: .3,
    shade: [{ pts: X([[-46, -36], [-22, -56], [10, -60], [12, -54], [-18, -50], [-40, -30]]), color: C.hairL, alpha: .9 }, { pts: X([[-70, 18], [-30, 18], [-30, 90], [-70, 90]]), color: '#36203A', alpha: .7 }] });
  // the side part: one short ink stroke at the crown
  ink(g, X([[6, -64], [-8, -50]]), 2 * k, { seed: 68, taper: true, color: '#2A1428' });
}

export function drawAki50(g, J, o = {}) {
  const k = o.k ?? 1;
  arm(g, J, 'f', o, k, 90);
  leg(g, J, 'f', C.trouF, C.bootF, k, 40);
  leg(g, J, 'n', C.trou, C.boot, k, 50);
  // coat: short vermilion trench, A-line, belted; hem trails with the run (secondary motion from the shared spring sim)
  const uL = J.uL, uU = J.uU, fL = J.fL, fU = J.fU, P = J.pelvis, Wst = J.waist, N = J.neckBase;
  const T = (b, up, fw, f = fU, u = uU) => add(add(b, u, up), f, fw);
  const hb = o.hemB || [0, 0], hf = o.hemF || [0, 0];
  const coat = [T(N, -4, 13), T(N, -2, -14), T(N, -16, -28), T(Wst, 0, -30, fL, uL), add(T(P, -72, -38, fL, uL), hb), add(T(P, -76, -6, fL, uL), [hb[0] * .5, hb[1] * .5]), add(T(P, -70, 34, fL, uL), hf), T(Wst, 0, 25, fL, uL), T(N, -44, 31), T(N, -18, 24)];
  const cP = spline(coat, true, 6);
  shape(g, cP, { fill: C.coat, line: 4.4 * k, seed: 52, regK: k, grain: .32, breaks: .16,
    shade: [{ pts: [T(N, 10, -60), T(N, 10, -4), T(Wst, 0, -6, fL, uL), add(T(P, -90, -8, fL, uL), hb), add(T(P, -90, -70, fL, uL), hb)], color: C.coatD, alpha: .6 }] });
  // belt + buckle, lapel notch, a seam
  ink(g, [T(Wst, 2, -28, fL, uL), T(Wst, 2, 24, fL, uL)], 9 * Math.max(1, k * .8), { seed: 53, taper: false, color: C.coatD });
  shape(g, xform(rrect(-6, -7, 12, 14, 2), ...T(Wst, 2, 10, fL, uL), Math.atan2(fL[1], fL[0])), { fill: C.gold, line: 2.2 * k, seed: 54, regK: k, grain: 0, breaks: 0 });
  shape(g, [T(N, -4, 13), T(N, -18, 24), T(N, -40, 22), T(N, -14, 6)], { fill: C.coatL, line: 2.8 * k, seed: 55, regK: k, grain: .2, breaks: .3 });
  ink(g, [T(Wst, -6, 6, fL, uL), add(T(P, -66, 10, fL, uL), [hf[0] * .5, hf[1] * .5])], 2 * k, { seed: 56, taper: true, color: '#8E3524' });
  // neck + cream roll-neck
  const nt = J.neckTop;
  limbInk(g, [N, nt], 18, k, 57); limbCol(g, [N, nt], 18, C.skin, k, 57);
  shape(g, xform(rrect(-16, -13, 32, 20, 8), ...add(N, uU, 2), Math.atan2(fU[1], fU[0])), { fill: C.knit, line: 3.2 * k, seed: 58, regK: k, grain: .2, breaks: .25 });
  head(g, J, o, k);
  const watch = arm(g, J, 'n', o, k, 80);
  return { watch };
}
