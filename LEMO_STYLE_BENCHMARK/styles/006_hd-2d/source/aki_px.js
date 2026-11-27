// AKI as a 2.5D pixel sprite (~50 px tall, side view facing +x), rastered from the shared rig.
// The rig (solveProfile) gives the joints; each drawing is painted pixel by pixel from colour ramps with a narrow Bayer
// dither (.22) and a 1 px selout outline (style §2). The sprite steps (3 drawings per footfall ≈ 8.7 fps) while the
// camera, lights and particles glide; because every held drawing is the rig's pose at its own tick, a planted foot keeps
// its world position from drawing to drawing (no slide).
import * as THREE from 'three';
import { PX, ramp, hex, texOf, billboard } from './px.js';

export const FW = 48, FH = 64, KPX = 50 / 600;            // sprite frame (px); rig units → pixels (AKI 600 u ≈ 50 px)
export const SPX = 1.65 / 50;                              // metres per sprite pixel (AKI 1.65 m)
const C = {
  coat: ramp(['#5c140d', '#a82b22', '#e4472d', '#ff8f62'], .22), coatF: ramp(['#3a0c08', '#6e1c16', '#a82b22', '#c8402c'], .22),
  trou: ramp(['#101018', '#24242f', '#3b3b4a', '#55556a'], .22), trouF: ramp(['#08080e', '#16161e', '#262632', '#363646'], .22),
  boot: ramp(['#1d0f08', '#45291a', '#6b4430', '#8a5a40'], .22),
  skin: ramp(['#b87a62', '#dea282', '#f3c9a6', '#ffe2c8'], .22),
  hair: ramp(['#1d0e24', '#3d2547', '#5e3d6e', '#7d5c93'], .22),
  knit: ramp(['#8a7c66', '#c0ad92', '#eee2cc'], .22),
  gold: ramp(['#4a3210', '#97702c', '#d8b25c', '#fff0b0'], .22),
};
const EYE = hex('#1e0c06'), BLUSH = hex('#e8907a');
const add = (p, v, s = 1) => [p[0] + v[0] * s, p[1] + v[1] * s];

// capsule a→b of radius r (px); shading by the side of the axis (light from the front/top) + length
function capsule(P, a, b, r, R, base = .55) {
  const x0 = Math.floor(Math.min(a[0], b[0]) - r - 1), x1 = Math.ceil(Math.max(a[0], b[0]) + r + 1), y0 = Math.floor(Math.min(a[1], b[1]) - r - 1), y1 = Math.ceil(Math.max(a[1], b[1]) + r + 1);
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1, L = Math.sqrt(L2), nx = -dy / L, ny = dx / L;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const px = x + .5, py = y + .5, u = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / L2)), cx = a[0] + dx * u, cy = a[1] + dy * u, d = Math.hypot(px - cx, py - cy);
    if (d > r) continue;
    const side = ((px - cx) * nx + (py - cy) * ny) / r;            // −1..1 across the limb
    const lightSide = (px - cx) * .7 - (py - cy) * .7;            // toward upper-front
    P.set(x, y, R(base + lightSide / r * .28 - Math.abs(side) * .06, x, y));
  }
}
function poly(P, pts, R, f) { P.poly(pts, (x, y) => R(f(x, y), x, y)); }

// p: { J (solveProfile), blink, watch (0..1), look (−1..1), mouth }
export function drawAkiPx(P, J, p = {}) {
  const ox = J.pelvis[0], S = ([x, y]) => [FW / 2 + (x - ox) * KPX, FH - 2 + y * KPX];
  // far arm
  { const A = J.arm.f, sh = S(A.sh), el = S(A.el), wr = S(A.wr); capsule(P, sh, el, 1.7, C.coatF, .5); capsule(P, el, wr, 1.5, C.coatF, .45); P.rect(Math.round(wr[0]) - 1, Math.round(wr[1]) - 1, 2, 2, C.skin(.3, 0, 0)); }
  // legs: far first, boots from the solved ankle + pitch
  for (const k of ['f', 'n']) {
    const L = J.leg[k], far = k === 'f', hip = S(L.hip), kn = S(L.knee), an = S(L.ankle);
    const c = Math.cos(L.pitch), s = Math.sin(L.pitch), F = ([u, v]) => [an[0] + (u * c - v * s) * KPX, an[1] + (u * s + v * c) * KPX];
    poly(P, [[-14, -30], [12, -30], [16, -6], [38, 4], [60, 8], [62, 18], [-20, 18], [-22, 4]].map(F), C.boot, (x, y) => (far ? .3 : .55) - (y > an[1] + 1 ? .25 : 0));
    capsule(P, hip, kn, 2.3, far ? C.trouF : C.trou, far ? .4 : .55); capsule(P, kn, an, 1.9, far ? C.trouF : C.trou, far ? .4 : .55);
  }
  // coat: short trench, A-line, belted; hem lag from the shared spring sim
  const uL = J.uL, uU = J.uU, fL = J.fL, fU = J.fU, Pv = J.pelvis, Wst = J.waist, N = J.neckBase;
  const T = (b, up, fw, f = fU, u = uU) => add(add(b, u, up), f, fw), hb = p.hemB || [0, 0];
  const coat = [T(N, -2, 14), T(N, 0, -14), T(N, -16, -30), T(Wst, 0, -31, fL, uL), add(T(Pv, -74, -40, fL, uL), hb), add(T(Pv, -74, 36, fL, uL), [hb[0] * .4, hb[1] * .4]), T(Wst, 0, 26, fL, uL), T(N, -40, 30)].map(S);
  const nb = S(N);
  poly(P, coat, C.coat, (x, y) => .62 + (x - nb[0]) * .035 - (y - nb[1]) * .004 + ((x + y) % 7 === 0 ? -.1 : 0));
  const b0 = S(T(Wst, 2, -30, fL, uL)), b1 = S(T(Wst, 2, 25, fL, uL));                   // belt
  for (let x = Math.round(b0[0]); x <= Math.round(b1[0]); x++) P.set(x, Math.round(b0[1] + (b1[1] - b0[1]) * (x - b0[0]) / Math.max(1, b1[0] - b0[0])), C.coat(.12, x, 0));
  P.set(Math.round(b1[0]) - 2, Math.round(b1[1]), C.gold(.8, 0, 0));
  // cream roll-neck + neck
  const nt = S(J.neckTop); P.rect(Math.round(nb[0]) - 2, Math.round(nb[1]) - 2, 4, 2, C.knit(.7, 0, 0)); capsule(P, nb, nt, 1.2, C.skin, .55);
  // head: ~9 px; dark plum bob over the back and top, side-swept bangs, one eye, blush, nose tip
  const hc = S(J.headC), a = J.headA, ca = Math.cos(a), sa = Math.sin(a), H = (u, v) => [hc[0] + (u * ca - v * sa), hc[1] - 1 + (u * sa + v * ca)];
  const lag = p.hairLag || [0, 0], lx = Math.max(-2.5, Math.min(.5, lag[0] * KPX));
  P.ellipse(...H(.6, .3), 4.3, 4.6, (x, y, dx, dy) => C.skin(.66 - dy * .25 - (dx < -.2 ? .15 : 0), x, y));
  P.ellipse(...H(-1.4 + lx * .3, -1.2), 4.4, 4.2, (x, y, dx, dy) => C.hair(.55 - dy * .3 + dx * .1, x, y));                                        // crown + back
  poly(P, [H(-5.6, -1), H(-2, -1), H(-1.5, 3.6), H(-4 + lx, 4.6), H(-6 + lx, 3)], C.hair, (x, y) => .38);                                            // bob down to the jaw
  poly(P, [H(-2, -4.8), H(3.5, -4.4), H(4.8, -2.2), H(1.5, -2.6), H(-1, -1.8)], C.hair, (x, y) => .7);                                              // bangs
  const e = H(2.6 + (p.look || 0) * .4, -.4).map(Math.round);
  if (p.blink) P.set(e[0], e[1], C.skin(.2, 0, 0));
  else { P.set(e[0], e[1], EYE); P.set(e[0], e[1] - 1, EYE); if (p.wide) { P.set(e[0] - 1, e[1] - 1, hex('#fbf7f4')); P.set(e[0] - 1, e[1], hex('#fbf7f4')); } }
  const bl = H(2.2, 1.8).map(Math.round); P.set(bl[0], bl[1], BLUSH);
  const no = H(5.1, .4).map(Math.round); P.set(no[0], no[1], C.skin(.5, 0, 0));
  if (p.mouth === 'o') { const m = H(3.8, 2.6).map(Math.round); P.set(m[0], m[1], hex('#5a1a2a')); }
  // near arm: sleeve, fist, the gold watch on the LEFT wrist (visible when the sleeve slides back)
  { const A = J.arm.n, sh = S(A.sh), el = S(A.el), wr = S(A.wr), d = [wr[0] - el[0], wr[1] - el[1]], l = Math.hypot(...d) || 1, u = [d[0] / l, d[1] / l];
    const cb = p.watch || 0, cuff = add(wr, u, -(1.2 + 1.4 * cb));
    if (cb > .1) capsule(P, add(wr, u, -3), wr, 1.2, C.skin, .6);
    capsule(P, sh, el, 1.8, C.coat, .62); capsule(P, el, cuff, 1.6, C.coat, .62);
    P.rect(Math.round(wr[0] + u[0] * 1.2) - 1, Math.round(wr[1] + u[1] * 1.2) - 1, 2, 2, C.skin(.7, 0, 0));
    const w = add(wr, u, -1.2).map(Math.round); P.set(w[0], w[1], C.gold(cb > .1 ? .95 : .7, 0, 0)); if (cb > .1) P.set(w[0], w[1] - 1, C.gold(.6, 0, 0)); }
  P.outline(.35, [22, 14, 30]);
}

// a billboard whose texture is redrawn when the pose tick changes
export function makeAkiSprite() {
  const P = new PX(FW, FH), tex = texOf(P.done());
  const mesh = billboard(tex, FW * SPX, FH * SPX, { ax: .5, ay: 2 / FH, shadow: true, receive: false });
  mesh.userData.char = 'aki';
  let last = null;
  function draw(key, J, p) {
    if (key === last) return; last = key;
    P.d.data.fill(0); drawAkiPx(P, J, p); P.done(); tex.needsUpdate = true;
  }
  return { mesh, draw, P };
}
// the RPG emote balloon ("!!" — the sprite's take), a tiny pixel billboard
export function emote() {
  const P = new PX(15, 13), INK = hex('#1a1016'), WH = hex('#fbf7f4'), RD = hex('#e8392b');
  P.fill((x, y) => { const inB = x >= 1 && x <= 13 && y >= 1 && y <= 9 && !((x === 1 || x === 13) && (y === 1 || y === 9)); const tail = y >= 10 && y <= 11 && x >= 5 && x <= 7 - (y - 10); return inB || tail ? WH : null; });
  for (const x of [5, 9]) { for (let y = 2; y <= 6; y++) { P.set(x, y, RD); P.set(x + 1, y, RD); } P.set(x, 8, RD); P.set(x + 1, 8, RD); }
  P.outline(.0, [26, 16, 22]);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(15 * SPX * 1.2, 13 * SPX * 1.2).translate(0, 13 * SPX * .6, 0), new THREE.MeshBasicMaterial({ map: texOf(P.done()), transparent: true, alphaTest: .5, fog: false, color: new THREE.Color(1.35, 1.35, 1.35) }));
  m.renderOrder = 4; return m;
}
