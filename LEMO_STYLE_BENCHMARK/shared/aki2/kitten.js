// The kitten: ≈8 weeks, grey tabby, white bib and front paws, amber-green eyes, pink nose (bible/KITTEN.md).
// 3/4-front construction, local units (≈ 1 u = 2.7 mm, same scale as Aki), origin on the ground under the chest.
// k = { headTilt, headTurn (-1..1), earL, earR, eyes (0..1), pupil (0..1 dilation), mouth (0..1), shiver, rise, paw (0..1),
//       tail (phase), wet (0..1), look:[x,y], body:false (head only, for the bundle), yawn (0..1) }
import { path, rgba, mix, TAU } from '../lib/cel.js';
import { celGroup, iline } from '../lib/celgroup.js';
import { hash } from '../lib/util.js';

const jag = (pts, amt, seed) => {   // wet fur: spiky outline
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length]; out.push(a);
    if (amt > 0) { const n = [b[1] - a[1], a[0] - b[0]], L = Math.hypot(...n) || 1; const m = [(a[0] + b[0]) / 2 + n[0] / L * amt * (.6 + hash(i * 3.1 + seed)), (a[1] + b[1]) / 2 + n[1] / L * amt * (.6 + hash(i * 3.1 + seed))]; out.push([...m, 1]); }
  }
  return out;
};
const ell = (cx, cy, rx, ry, n = 14, a0 = 0) => Array.from({ length: n }, (_, i) => { const a = a0 + i / n * TAU; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });

export function drawKitten(g, P, k, L) {
  const wet = k.wet ?? 0, sh = (k.shiver || 0) * Math.sin((k.time || 0) * 2 * Math.PI * 11) * 1.2;
  const rise = k.rise || 0, lw = k.lw ?? 1.6;
  const LS = { sh: L.sh && [L.sh[0] * .5, L.sh[1] * .5], hi: L.hi && [L.hi[0] * .5, L.hi[1] * .5], rim: L.rim };
  g.save(); g.translate(sh, 0);
  if (k.body !== false) {
    // tail curls round the right side, its tip flicks
    const tp = k.tail || 0, tip = [38 + Math.sin(tp) * 6, -10 + Math.cos(tp * 1.3) * 4];
    celGroup(g, [path([[-16, -8], [14, -4], [32, -6], tip, [tip[0] + 5, tip[1] + 6, 1], [30, 2], [10, 3], [-16, 1]])], P.fur, LS, { lw });
    // body (crouched loaf; rises on a step)
    const body = jag(ell(-4, -20 - rise * 8, 24, 19 + rise * 5, 14, .2), wet * 2.2, 1);
    celGroup(g, [path(body)], P.fur, LS, { lw, xs: [path(ell(-14, -9 - rise * 6, 18, 9, 10))] });
    for (let s = 0; s < 3; s++) iline(g, path([[-25 + s * 9, -34 - rise * 8], [-21 + s * 9, -25 - rise * 6], [-22 + s * 9, -16]], false), P.furStripe.f, 2);
    // front paws (white), the right one steps forward with k.paw
    const pw = k.paw || 0;
    celGroup(g, [path(ell(-6, -3, 7.5, 5, 10)), path(ell(13 + pw * 4, -3 - Math.sin(pw * Math.PI) * 9 + pw * 3, 7.5, 5, 10))], P.furWhite, LS, { lw, noRim: true });
    // white bib
    celGroup(g, [path(jag([[-8, -34], [16, -34], [17, -14], [4, -6], [-9, -14]], wet * 2.2, 5))], P.furWhite, LS, { lw: lw * .9, noRim: true });
  }
  // head
  const ht = k.headTilt || 0, turn = k.headTurn || 0, hx = 5 + turn * 3, hy = -47 - rise * 9;
  g.save(); g.translate(hx, hy); g.rotate(ht);
  const earL = k.earL || 0, earR = k.earR || 0;
  const ear = (bx, by, tx, ty, cx, cy, rot2) => { const R = (x, y) => { const c = Math.cos(rot2), s = Math.sin(rot2); return [bx + (x - bx) * c - (y - by) * s, by + (x - bx) * s + (y - by) * c]; }; return [R(bx, by), [...R(tx, ty), 1], R(cx, cy)]; };
  const eL = ear(-15, -12, -21, -36, -2, -17, earL), eR = ear(8, -17, 20, -36, 21, -10, earR);
  celGroup(g, [path(eL), path(eR)], P.fur, LS, { lw });
  g.fillStyle = P.catNose.f;
  for (const [a, b2, c] of [eL, eR]) { g.beginPath(); g.moveTo(a[0] * .7 + c[0] * .3, a[1] * .7 + c[1] * .3); g.lineTo(b2[0] * .85 + (a[0] + c[0]) * .075, b2[1] * .85 + (a[1] + c[1]) * .075); g.lineTo(a[0] * .3 + c[0] * .7, a[1] * .3 + c[1] * .7); g.closePath(); g.fill(); }
  const headPts = jag([[-20, -4], [-18, -14], [-8, -20], [8, -20], [19, -12], [22, 0], [19, 10], [8, 16], [-8, 16], [-19, 9]], wet * 2.6, 9);
  celGroup(g, [path(headPts)], P.fur, LS, { lw, xs: [path([[-20, 2], [-14, 13], [-2, 17], [-12, 8]])] });
  // muzzle (white) + forehead M stripes
  celGroup(g, [path([[-6, 2], [2, -1], [11, 2], [12, 10], [3, 14], [-6, 10]])], P.furWhite, LS, { lw: lw * .7, noLine: true, noRim: true });
  for (const [x0, y0, x1, y1] of [[-2, -19, -1, -11], [3, -19, 3, -11], [8, -19, 7, -11], [-11, -15, -7, -9], [15, -14, 12, -8]]) iline(g, path([[x0, y0], [x1, y1]], false), P.furStripe.f, 2);
  // eyes
  const eo = k.eyes ?? 1, pu = k.pupil ?? .7, lk = k.look || [0, 0];
  for (const [ex, ey, r] of [[-8 + turn * 2, -3, 6.6], [12 + turn * 2, -3, 6.1]]) {
    if (eo > .15) {
      const EP = new Path2D(); EP.ellipse(ex, ey, r, r * eo, 0, 0, TAU);
      g.save(); g.clip(EP);
      g.fillStyle = P.catEye.f; g.fill(EP);
      g.fillStyle = P.catEye.s; g.fillRect(ex - r, ey - r, r * 2, r * .7);
      g.fillStyle = '#0b0a10'; g.beginPath(); g.ellipse(ex + lk[0] * 2, ey + lk[1] * 1.5, r * (.3 + .5 * pu), r * .85, 0, 0, TAU); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(ex - r * .3 + lk[0], ey - r * .35, r * .3, 0, TAU); g.fill(); g.beginPath(); g.arc(ex + r * .35, ey + r * .3, r * .12, 0, TAU); g.fill();
      g.restore();
      g.strokeStyle = P.fur.l; g.lineWidth = 1.4; g.stroke(EP);
    } else iline(g, path([[ex - r, ey + 1], [ex, ey + 3], [ex + r, ey + 1]], false), P.fur.l, 1.6);
  }
  // nose + mouth (mew / yawn)
  g.fillStyle = P.catNose.f; g.beginPath(); g.moveTo(1, 4); g.lineTo(7, 4); g.lineTo(4, 7.5); g.closePath(); g.fill();
  const mo = Math.max(k.mouth || 0, (k.yawn || 0) * 1.6);
  if (mo > .05) {
    const MP = new Path2D(); MP.ellipse(4, 11 + mo * 2.5, 3.2 + mo * 2.2, 1.6 + mo * 4.2, 0, 0, TAU);
    g.fillStyle = '#4a1a26'; g.fill(MP); g.save(); g.clip(MP); g.fillStyle = '#e98a98'; g.beginPath(); g.ellipse(4, 14 + mo * 5, 3 + mo, 2 + mo * 1.5, 0, 0, TAU); g.fill();
    if (k.yawn) { g.fillStyle = '#fff'; g.fillRect(-1, 8.5, 1.4, 2.2); g.fillRect(8, 8.5, 1.4, 2.2); }
    g.restore();
  } else iline(g, path([[0, 10], [2, 11], [4, 9.5], [6, 11], [8, 10]], false), P.fur.l, 1.1);
  // whiskers
  g.strokeStyle = rgba(mix(P.furWhite.f, '#ffffff', .3), .8); g.lineWidth = .8;
  for (const s of [-1, 1]) for (let w = 0; w < 3; w++) { const x0 = 4 + s * 7; g.beginPath(); g.moveTo(x0, 7 + w * 2); g.lineTo(x0 + s * 20, 3 + w * 5); g.stroke(); }
  g.restore();
  g.restore();
}
