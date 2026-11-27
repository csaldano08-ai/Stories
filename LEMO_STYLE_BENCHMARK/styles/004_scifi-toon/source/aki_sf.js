// AKI as an adult-swim-era sci-fi sitcom lead (profile, facing +x).
// Skeleton = the shared rig (solveProfile): bone lengths, IK, reach limits and foot lock are unchanged. The drawing is this
// style's: thick near-black outline at a constant 7 px in screen space (the engine strokes after transforming), boiling;
// flat fills with hard-edged shadow shapes; one big white eye with a tiny pupil, a heavy lid and an eye bag; an elastic
// parametric mouth; noodle limbs. Her one absurd costume idea: the watch is a chunky gold gadget with a stubby antenna.
import { INK, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, quad, dot, S } from './toon.js';
import { lerp, clamp, hash } from './shared/lib/util.js';

export const P = {
  coat: '#E5482E', coatS: '#B23222', coatF: '#C23B27', knit: '#F1E6CF', knitS: '#CDBB98',
  trou: '#3A3346', trouS: '#2A2434', boot: '#7B4A2E', bootS: '#56321D',
  hair: '#4A2A4F', hairS: '#331B38', hairH: '#6E4A78',
  skin: '#F6CBA8', skinS: '#DDA27E', white: '#FFFFFF', mouthIn: '#4A1A2A', tongue: '#E8637A',
  gold: '#F2B33D', goldS: '#C98A22', dial: '#FFF7E2', strap: '#5A3B2A', sweat: '#BFE9FF', led: '#FF4A3A',
};
const add = (p, v, s = 1) => [p[0] + v[0] * s, p[1] + v[1] * s];
const nrm = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

// a limb outline around a smoothed polyline (one closed shape → one union outline, no seam at the knee/elbow)
export function limb(pts, w0, w1) {
  const Pp = spline(pts, false, 5), n = Pp.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = Pp[Math.max(0, i - 1)], b = Pp[Math.min(n - 1, i + 1)], d = nrm([b[0] - a[0], b[1] - a[1]]), w = lerp(w0, w1, i / (n - 1)) / 2;
    L.push([Pp[i][0] - d[1] * w, Pp[i][1] + d[0] * w]); R.push([Pp[i][0] + d[1] * w, Pp[i][1] - d[0] * w]);
  }
  const e = Pp[n - 1], e0 = Pp[n - 2], s0 = Pp[0], s1 = Pp[1];
  const ae = Math.atan2(e[1] - e0[1], e[0] - e0[0]), as = Math.atan2(s1[1] - s0[1], s1[0] - s0[0]);
  return [...L, ...arc(e[0], e[1], w1 / 2, w1 / 2, ae + Math.PI / 2, ae - Math.PI / 2, 8), ...R.reverse(), ...arc(s0[0], s0[1], w0 / 2, w0 / 2, as - Math.PI / 2, as - Math.PI * 1.5, 8)];
}
// cartoon hand (from the style's demo grammar): mitten fist or open, thumb crease
export function hand(x, y, ang, r = 20, col = P.skin, { fist = true, lw = 6 } = {}) {
  push(); translate(x, y); rotate(ang);
  const pts = fist ? spline([[-r * .6, -r * .8], [r * .7, -r * .9], [r * 1.1, -r * .1], [r * .8, r * .8], [-r * .5, r * .9], [-r * .9, 0]])
    : spline([[-r * .5, -r * .85], [r * .5, -r * 1.05], [r * 1.35, -r * .75], [r * 1.05, -r * .3], [r * 1.5, -r * .1], [r * 1.1, r * .3], [r * 1.35, r * .7], [r * .6, r * .95], [-r * .6, r * .8], [-r * .95, 0]]);
  shape(pts, { fill: col, lw });
  stroke([[r * .2, -r * .15], [r * .75, -r * .45]], lw * .6);
  pop();
}
// parametric mouth (open o, width w, corners sm, skew) with interior, teeth, tongue
export function mouth(cx, cy, mw, { o = 0, w = 1, sm = 0, skew = 0, lw = 5, teeth = true } = {}) {
  const hw = mw * w / 2, k = mw * .22, lc = [cx - hw, cy - sm * k + skew * k], rc = [cx + hw, cy - sm * k - skew * k];
  if (o < .07) { stroke(quad(lc, [cx, cy + sm * k * 1.2], rc, 12), lw); return; }
  const h = o * mw * .62;
  shape([...quad(lc, [cx, cy - h * .25 + sm * k * .4], rc, 12), ...quad(rc, [cx, cy + h + sm * k * .6], lc, 14)], {
    fill: P.mouthIn, lw, shade: () => {
      if (teeth && o > .22) fillOnly(rect(cx - hw * 1.2, cy - h, hw * 2.4, h * .3 + 4), P.white, { boil: .3 });
      fillOnly(ell(cx + hw * .15, cy + h * .95, hw * .6, h * .45, 20), P.tongue, { boil: .3 });
    } });
}
const BOOT = [[-15, -38], [15, -38], [18, -10], [38, 2], [60, 6], [68, 12], [64, 18], [44, 18], [-20, 18], [-25, 6], [-19, -14]];
function boot(L, far) {
  push(); translate(L.ankle[0], L.ankle[1]); rotate(L.pitch);
  shape(spline(BOOT, true, 3), { fill: far ? P.bootS : P.boot, lw: 7, shade: () => fillOnly(rect(-40, 8, 120, 20), far ? '#3E2414' : P.bootS, { boil: .3 }) });
  pop();
}
function leg(J, k, far) {
  const L = J.leg[k];
  boot(L, far);
  const d = nrm([L.ankle[0] - L.knee[0], L.ankle[1] - L.knee[1]]);
  shape(limb([L.hip, L.knee, add(L.ankle, d, -4)], 42, 31), { fill: far ? P.trouS : P.trou, lw: 7,
    shade: () => fillOnly(limb([add(L.hip, [-14, 0]), add(L.knee, [-12, 4]), add(L.ankle, [-12, 0])], 18, 12), far ? '#1E1928' : P.trouS, { boil: .3 }) });
}
// the watch gadget on the LEFT (near) wrist: strap, chunky gold case, stubby antenna with a flat red ball
function watchGadget(c, d, face) {
  const n = [-d[1], d[0]], a = Math.atan2(d[1], d[0]);
  push(); translate(c[0], c[1]); rotate(a);
  shape(rr(-7, -15, 14, 30, 3), { fill: P.strap, lw: 5 });
  shape(rr(-11, -12, 22, 24, 6), { fill: P.gold, lw: 6, shade: () => fillOnly(rect(2, -16, 14, 34), P.goldS, { boil: .3 }) });
  if (face > .3) shape(ell(0, 0, 6.5, 6.5, 16), { fill: P.dial, lw: 3 });
  stroke([[-6, -12], [-9, -22]], 4); dot(-9.5, -24, 3.4, P.led);
  pop();
}
function arm(J, k, o) {
  const A = J.arm[k], far = k === 'f', d = nrm([A.wr[0] - A.el[0], A.wr[1] - A.el[1]]);
  const cb = far ? 0 : clamp(o.cuffBack || 0), cuff = add(A.wr, d, -(12 + 16 * cb));
  if (!far && cb > .02) shape(limb([add(A.wr, d, -36), A.wr], 22, 20), { fill: P.skin, lw: 6 });
  if (!far) watchGadget(add(A.wr, d, -10), d, cb);
  shape(limb([A.sh, A.el, cuff], 33, 27), { fill: far ? P.coatF : P.coat, lw: 7,
    shade: () => fillOnly(limb([add(A.sh, [8, 6]), add(A.el, [8, 4]), add(cuff, [8, 2])], 14, 10), P.coatS, { boil: .3 }) });
  const n = [-d[1], d[0]];
  stroke([add(add(cuff, d, -9), n, 13), add(add(cuff, d, -9), n, -13)], 5);
  hand(A.wr[0] + d[0] * 6, A.wr[1] + d[1] * 6, Math.atan2(d[1], d[0]) + (A.wrA || 0), 15, far ? P.skinS : P.skin, { fist: true, lw: 6 });
}
// head in its frame (centre J.headC, angle J.headA), ×1.35 the realistic head: the genre's big-headed proportions
function head(J, o) {
  const c = J.headC, jit = o.jitter || [0, 0];
  push(); translate(c[0] + jit[0], c[1] - 2 + jit[1]); rotate(J.headA); scale(1.35);
  const lag = o.hairLag || [0, 0], lx = clamp(lag[0], -26, 8) / 1.35, ly = clamp(lag[1], -10, 10) / 1.35;
  // hair (back mass) behind the face
  shape(spline([[10, -60], [-24, -62], [-50, -40], [-58, -6], [-56 + lx * .4, 26 + ly * .4], [-50 + lx, 44 + ly], [-30 + lx * .6, 46 + ly * .6], [-16, 30], [-6, 6], [16, -30]]), { fill: P.hair, lw: 7,
    shade: () => fillOnly(spline([[-70, 10], [-34, 14], [-26, 40], [-60, 60]]), P.hairS, { boil: .3 }) });
  // face: rounded skull, bump nose, small chin (one outline)
  const face = spline([[-16, -54], [12, -58], [34, -48], [44, -28], [46, -16], [58, -8], [62, 2], [54, 10], [46, 11], [46, 20], [43, 30], [36, 38], [18, 44], [-4, 40], [-18, 24], [-22, 0]]);
  shape(face, { fill: P.skin, lw: 7, shade: () => fillOnly(spline([[-30, 10], [10, 30], [40, 34], [30, 60], [-30, 60]]), P.skinS, { boil: .3 }) });
  // ear peeks under the bob, then the bangs: a heavy side-swept fringe over the forehead, ending above the brow
  shape(spline([[46, -36], [30, -58], [0, -66], [-30, -56], [-20, -40], [0, -42], [22, -34], [40, -26]]), { fill: P.hair, lw: 7,
    shade: () => fillOnly(spline([[-10, -58], [20, -60], [10, -52], [-12, -50]]), P.hairH, { boil: .3 }) });
  // the big white eye (bulges past the face line a little), tiny pupil, lid, eye bag
  const ex = 31, ey = -14, rx = 12, ry = 15 * (o.eyeOpen ?? 1);
  const lid = o.blink ? 1 : clamp(o.lid ?? .34), look = o.look || [.6, 0], pr = o.pupil ?? 3.2, tr = o.tremble || [0, 0];
  if (lid >= .98) stroke(quad([ex - rx, ey + 2], [ex, ey + 6], [ex + rx, ey + 2], 8), 6);
  else shape(ell(ex, ey, rx, ry, 30), { fill: P.white, lw: 6, shade: () => {
    dot(ex + look[0] * rx * .5 + tr[0], ey + look[1] * ry * .5 + tr[1], pr);
    if (lid > 0) { const yl = ey - ry + lid * 2 * ry; fillOnly([[ex - rx * 1.4, ey - ry * 1.5], [ex + rx * 1.4, ey - ry * 1.5], [ex + rx * 1.4, yl - 1], [ex - rx * 1.4, yl + 1.5]], P.skin, { boil: .5 }); stroke([[ex - rx * 1.2, yl + 1.5], [ex + rx * 1.2, yl - 1]], 6); }
  } });
  stroke(arc(ex - 1, ey + ry * .35, rx * .95, ry * .7, Math.PI * .2, Math.PI * .75, 10), 4);              // eye bag
  const br = o.brow ?? 0;                                                                                  // brow: + raised (panic)
  stroke(quad([ex - 14, ey - ry - 6 - br * 6], [ex - 2, ey - ry - 11 - br * 9], [ex + 12, ey - ry - 6 - br * 4]), 7);
  const m = o.mouth || { o: .35, w: .8, sm: -.1 };
  mouth(42, 26, 18, { ...m, lw: 5 });
  pop();
}
export function drawAkiSF(J, o = {}) {
  arm(J, 'f', o);
  leg(J, 'f', true);
  leg(J, 'n', false);
  const uL = J.uL, uU = J.uU, fL = J.fL, fU = J.fU, Pv = J.pelvis, W = J.waist, N = J.neckBase;
  const T = (b, up, fw, f = fU, u = uU) => add(add(b, u, up), f, fw);
  const hb = o.hemB || [0, 0], hf = o.hemF || [0, 0];
  const coat = spline([T(N, -2, 15), T(N, 0, -15), T(N, -16, -31), T(W, 0, -32, fL, uL), add(T(Pv, -76, -40, fL, uL), hb), add(T(Pv, -80, -4, fL, uL), [hb[0] * .5, hb[1] * .5]), add(T(Pv, -74, 36, fL, uL), hf), T(W, 0, 27, fL, uL), T(N, -46, 33), T(N, -18, 26)]);
  shape(coat, { fill: P.coat, lw: 7, shade: () => fillOnly([T(N, 20, -80), T(N, 20, -12), T(W, 0, -10, fL, uL), add(T(Pv, -100, -14, fL, uL), hb), add(T(Pv, -100, -90, fL, uL), hb)], P.coatS, { boil: .3 }) });
  stroke([T(W, 3, -30, fL, uL), T(W, 3, 26, fL, uL)], 6);
  shape(rr(-7, -8, 14, 16, 3).map(p => add(T(W, 3, 12, fL, uL), p)), { fill: P.gold, lw: 5 });
  stroke([T(N, -2, 15), T(N, -20, 26), T(N, -40, 24)], 5);
  dot(...T(W, 38, 20, fL, uL), 3.5); dot(...T(W, 14, 22, fL, uL), 3.5);
  // neck + cream roll-neck
  shape(limb([N, J.neckTop], 26, 24), { fill: P.skin, lw: 6 });
  shape(rr(-17, -12, 34, 22, 9).map(p => add(N, [p[0] + uU[0] * 2, p[1] + uU[1] * 2])), { fill: P.knit, lw: 6, shade: () => fillOnly(rect(N[0] - 30, N[1] + 2, 60, 20), P.knitS, { boil: .3 }) });
  head(J, o);
  arm(J, 'n', o);
  if (o.sweat != null && o.sweat >= 0 && o.sweat < 1) { const u = o.sweat, c = add(J.headC, [-40 - 60 * u, -60 - 50 * u + 160 * u * u]);
    shape(spline([[c[0], c[1] - 16], [c[0] + 9, c[1] + 4], [c[0], c[1] + 12], [c[0] - 9, c[1] + 4]]), { fill: P.sweat, lw: 5 }); }
}
