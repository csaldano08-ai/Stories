// AKI as a 16-bit RPG sprite, rastered from the shared rig into an indexed framebuffer (style §2 "sprites from a rig"):
// capsule limbs with 3-tone shading from an upper-left light, a per-part inner line in the material's darkest tone,
// a global 1-px ink outline, and a hand-placed ASCII head (her silhouette mark: the shoulder-length bob with side bangs).
// The coat uses the PROTECTED red indices (32–34): no palette effect ever touches her colour.
import { FB, C, T, sprFromRows } from './px.js';

// material ramps: [dark line, shadow, mid, highlight]
export const MAT = {
  coat: [C.crimson, C.scarfD, C.scarf, C.scarfL], coatF: [C.umber, C.crimson, C.scarfD, C.scarf],
  trou: [C.ink, C.night, C.dslate, C.slate], trouF: [C.ink, C.ink, C.night, C.dslate],
  boot: [C.ink, C.umber, C.dbrown, C.brown], skin: [C.skinS, C.skinS, C.skin, C.sand], skinF: [C.brown, C.skinS, C.skinS, C.skin],
  knit: [C.steel, C.tan, C.sand, C.white],
};
const add = (p, v, s = 1) => [p[0] + v[0] * s, p[1] + v[1] * s];

function capsule(fb, a, b, r, M) {
  const x0 = Math.floor(Math.min(a[0], b[0]) - r - 1), x1 = Math.ceil(Math.max(a[0], b[0]) + r + 1), y0 = Math.floor(Math.min(a[1], b[1]) - r - 1), y1 = Math.ceil(Math.max(a[1], b[1]) + r + 1);
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const px = x + .5, py = y + .5, u = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / L2)), cx = a[0] + dx * u, cy = a[1] + dy * u, ex = px - cx, ey = py - cy, d = Math.hypot(ex, ey);
    if (d > r) continue;
    const l = (-ex * .7 - ey * .7) / Math.max(.6, r);
    const tone = d > r - .85 && r > 1.6 ? 0 : l > .3 ? 3 : l < -.25 ? 1 : 2;
    fb.px(x, y, M[tone]);
  }
}
function poly(fb, pts, M, light = .5) {
  const ys = pts.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys)), xs0 = Math.min(...pts.map(p => p[0])), xs1 = Math.max(...pts.map(p => p[0]));
  for (let y = y0; y <= y1; y++) {
    const xs = [], yc = y + .5;
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax)); }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) {
      const u = (x - xs0) / Math.max(1, xs1 - xs0), edge = x === Math.round(xs[k]) || x === Math.round(xs[k + 1]) - 1;
      fb.px(x, y, edge ? M[0] : u > .62 + light * .1 ? M[3] : u < .3 ? M[1] : M[2]);
    }
  }
}
function outline(fb) {   // global 1-px ink outline around everything opaque
  const src = fb.d.slice(), w = fb.w, h = fb.h;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (src[y * w + x] !== T) continue;
    if ((x > 0 && src[y * w + x - 1] !== T) || (x < w - 1 && src[y * w + x + 1] !== T) || (y > 0 && src[(y - 1) * w + x] !== T) || (y < h - 1 && src[(y + 1) * w + x] !== T)) fb.d[y * w + x] = C.ink;
  }
}
// hand-placed heads (side view, facing right): h hair, H hair light, d hair dark, f skin, s skin shadow, e eye, w eye white, b blush, m mouth
const HMAP = { h: C.plum, H: C.rose, d: C.umber, f: C.skin, s: C.skinS, e: C.ink, w: C.white, b: C.pink, m: C.crimson };
const HEAD = {
  run: ['...hhhh....', '..hHHhhh...', '.hHhhhhhh..', '.hhhhhhhhh.', 'hhhhhdffhh.', 'hhhhdfffff.', 'hhhhffeffs.', 'hhhdffffffs', 'hhhdffbffs.', 'dhhd.fffs..', 'dd...sss...'],
  look: ['...hhhh....', '..hHHhhh...', '.hHhhhhhh..', '.hhhhhhhhh.', 'hhhhhdffhh.', 'hhhhdfffff.', 'hhhhfffffs.', 'hhhdffeffffs', 'hhhdffbffs.', 'dhhd.fffs..', 'dd...sss...'],
  take: ['...hhhh....', '..hHHhhh...', '.hHhhhhhh..', '.hhhhhhhhh.', 'hhhhhdffhh.', 'hhhhdfwwff.', 'hhhhffwefs.', 'hhhdffffffs', 'hhhdffbfms.', 'dhhd.fffs..', 'dd...sss...'],
  blink: ['...hhhh....', '..hHHhhh...', '.hHhhhhhh..', '.hhhhhhhhh.', 'hhhhhdffhh.', 'hhhhdfffff.', 'hhhhffssfs.', 'hhhdffffffs', 'hhhdffbffs.', 'dhhd.fffs..', 'dd...sss...'],
};
export const HEADS = Object.fromEntries(Object.entries(HEAD).map(([k, rows]) => [k, sprFromRows(rows, HMAP)]));

// draw AKI into fb. J = solveProfile(...); k = px per rig unit; (ox, oy) = screen position of the pelvis x / ground.
// o: { head: 'run'|'look'|'take'|'blink', watch 0..1, legsOnly, hemB, hairLag }
const TMP = new FB(200, 200);
export function drawAki16(fb, J, ox, oy, k, o = {}) {
  const tb = TMP; tb.d.fill(T);
  const cx = 100, by = o.legsOnly ? 196 : 150, P0 = J.pelvis[0], S = ([x, y]) => [cx + (x - P0) * k, by + y * k], R = u => Math.max(.9, u * k);
  // far arm, legs (far then near), coat, neck, head, near arm
  if (!o.legsOnly) { const A = J.arm.f; capsule(tb, S(A.sh), S(A.el), R(15), MAT.coatF); capsule(tb, S(A.el), S(A.wr), R(13), MAT.coatF); capsule(tb, add(S(A.wr), [0, 0]), S(A.wr), R(11), MAT.skinF); }
  for (const kk of ['f', 'n']) {
    const L = J.leg[kk], far = kk === 'f', an = S(L.ankle), c = Math.cos(L.pitch), s = Math.sin(L.pitch), F = ([u, v]) => [an[0] + (u * c - v * s) * k, an[1] + (u * s + v * c) * k];
    poly(tb, [[-14, -30], [12, -30], [16, -6], [38, 4], [60, 8], [62, 18], [-20, 18], [-22, 4]].map(F), MAT.boot);
    capsule(tb, S(L.hip), S(L.knee), R(21), far ? MAT.trouF : MAT.trou); capsule(tb, S(L.knee), add(S(L.ankle), [0, -1]), R(17), far ? MAT.trouF : MAT.trou);
  }
  const uL = J.uL, uU = J.uU, fL = J.fL, fU = J.fU, Pv = J.pelvis, Wst = J.waist, N = J.neckBase;
  const Tt = (b, up, fw, f = fU, u = uU) => add(add(b, u, up), f, fw), hb = o.hemB || [0, 0];
  poly(tb, [Tt(N, -2, 14), Tt(N, 0, -14), Tt(N, -16, -30), Tt(Wst, 0, -31, fL, uL), add(Tt(Pv, -74, -40, fL, uL), hb), add(Tt(Pv, -74, 36, fL, uL), [hb[0] * .4, hb[1] * .4]), Tt(Wst, 0, 26, fL, uL), Tt(N, -40, 30)].map(S), MAT.coat);
  { const a = S(Tt(Wst, 2, -30, fL, uL)), b = S(Tt(Wst, 2, 25, fL, uL)); tb.line(a[0], a[1], b[0], b[1], C.scarfD); tb.px(b[0] - 1, b[1], C.amber); }
  if (!o.legsOnly) {
    const nb = S(N), nt = S(J.neckTop); capsule(tb, nb, nt, R(9), MAT.skin); tb.rect(nb[0] - 2, nb[1] - 1, 4, 2, C.sand);
    const hd = HEADS[o.head || 'run'], hc = S(J.headC); tb.blit(hd, Math.round(hc[0] - 5 + (o.hairLag ? Math.max(-1, Math.min(0, o.hairLag[0] * .02)) : 0)), Math.round(hc[1] - 6));
    const A = J.arm.n, sh = S(A.sh), el = S(A.el), wr = S(A.wr), d = [wr[0] - el[0], wr[1] - el[1]], l = Math.hypot(...d) || 1, u = [d[0] / l, d[1] / l];
    const cb = o.watch || 0, cuff = add(wr, u, -(1 + 1.6 * cb));
    if (cb > .1) capsule(tb, add(wr, u, -2.6), wr, R(10), MAT.skin);
    capsule(tb, sh, el, R(15), MAT.coat); capsule(tb, el, cuff, R(14), MAT.coat);
    capsule(tb, add(wr, u, 1), add(wr, u, 1.6), R(12), MAT.skin);
    tb.px(Math.round(wr[0] - u[0]), Math.round(wr[1] - u[1]), cb > .1 ? C.yellow : C.amber);
  }
  outline(tb);
  fb.blit(tb, Math.round(ox - cx), Math.round(oy - by));
}
