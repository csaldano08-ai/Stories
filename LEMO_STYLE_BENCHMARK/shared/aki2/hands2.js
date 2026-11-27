// Five-fingered hand, dorsal view (back of the hand toward the camera), for close-ups and the character sheet.
// x,y = wrist centre; ang = direction the fingers point (rad, 0 = +x); side = +1 right hand / -1 left hand (thumb side flips);
// pose: 'open' | 'relaxed' | 'fist' | 'grip' | 'point' or curl:[thumb, index, middle, ring, little] (0 straight … 1 fully curled); s = scale.
import { path } from '../lib/cel.js';
import { celGroup, iline } from '../lib/celgroup.js';
import { limbSeg } from './aki_profile.js';
const POSES = { open: [0, 0, 0, 0, 0], relaxed: [.25, .3, .35, .4, .45], fist: [.7, 1, 1, 1, 1], grip: [.45, .7, .75, .78, .8], point: [.6, 0, 1, 1, 1] };
const FING = [[-9.5, 13, 8, 7, 3.3], [-3.2, 14, 9, 7.5, 3.4], [3, 13, 8.5, 7, 3.2], [8.8, 10, 6.5, 6, 2.8]];   // [x at knuckle, 3 phalanges, half-width]
export function hand2(g, P, L, x, y, o = {}) {
  const s = o.s ?? 1, ang = o.ang ?? Math.PI / 2, side = o.side ?? 1, curl = o.curl || POSES[o.pose || 'relaxed'], spread = o.spread ?? .3;
  const c = Math.cos(ang), sn = Math.sin(ang);
  const T = (u, v) => [x + (u * c - v * side * sn) * s, y + (u * sn + v * side * c) * s];   // u along the fingers, v across (+v = little-finger side)
  const shapes = [path([T(0, -11), T(10, -13.5), T(25, -13), T(28, -6), T(28.5, 4), T(26, 11.5), T(10, 11), T(0, 9)])];
  const tips = [];
  FING.forEach(([v, l1, l2, l3, hw], i) => {
    const cu = curl[i + 1], fan = (i - 1.5) * .07 * (1 + spread);
    let p = T(26, v), a = fan; const pts = [p];
    for (const [len, bend] of [[l1, .85], [l2, 1.15], [l3, .9]]) {
      a += cu * bend;                                             // curl rotates each phalanx toward the palm (foreshortened in dorsal view)
      const vis = len * Math.max(.18, Math.cos(Math.min(a - fan, 1.45)));
      const d = [Math.cos(ang + a * side * 0 + fan * side), Math.sin(ang + fan * side)];
      p = [p[0] + d[0] * vis * s, p[1] + d[1] * vis * s]; pts.push(p);
    }
    for (let j = 0; j < 3; j++) shapes.push(limbSeg(pts[j], pts[j + 1], [hw * s, hw * .95 * s, hw * .9 * s, .5], [hw * s, hw * .95 * s, hw * .9 * s, .5], .6, j === 2 ? .95 : .6));
    tips.push(pts);
  });
  // thumb: from the wrist side, rotates across with curl
  const tc = curl[0], t0 = T(6, -10), ta = ang - side * (.5 - tc * .7);
  const t1 = [t0[0] + Math.cos(ta) * 13 * s, t0[1] + Math.sin(ta) * 13 * s], t2 = [t1[0] + Math.cos(ta + side * tc * .4) * 10 * s, t1[1] + Math.sin(ta + side * tc * .4) * 10 * s];
  shapes.push(limbSeg(t0, t1, [4.6 * s, 4.3 * s, 4 * s, .5], [4.6 * s, 4.3 * s, 4 * s, .5], .6, .5), limbSeg(t1, t2, [4 * s, 3.8 * s, 3.4 * s, .5], [4 * s, 3.8 * s, 3.4 * s, .5], .5, .95));
  celGroup(g, shapes, P.skin, L, { lw: o.lw ?? 1.0 });
  // knuckles, creases, nails
  for (const pts of tips) {
    for (const j of [1, 2]) { const a = pts[j - 1], b = pts[j], d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d) || 1, n = [-d[1] / l, d[0] / l], w = 2.2 * s;
      iline(g, path([[b[0] + n[0] * w, b[1] + n[1] * w], [b[0] - n[0] * w, b[1] - n[1] * w]], false), P.skin.l, .6); }
    const a = pts[2], b = pts[3], d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d);
    if (l > 3 * s) { g.fillStyle = P.skin.h; g.beginPath(); g.ellipse(b[0] - d[0] / l * 2.6 * s, b[1] - d[1] / l * 2.6 * s, 2.2 * s, 1.6 * s, Math.atan2(d[1], d[0]), 0, Math.PI * 2); g.fill(); }
  }
  for (const v of [-9.5, -3.2, 3, 8.8]) { const k = T(25.5, v); g.fillStyle = P.skin.s; g.beginPath(); g.arc(k[0], k[1], 1.1 * s, 0, Math.PI * 2); g.fill(); }
}
