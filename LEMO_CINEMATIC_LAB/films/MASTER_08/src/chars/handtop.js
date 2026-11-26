// A hand seen from above (for the S11 insert): palm + 4 two-segment fingers + thumb, one union cel (no seams between fingers
// and palm), knuckle creases and nails as interior lines. Local units ≈ the 600-u body scale (hand length ≈ 62 u).
// o = { side: -1 (left hand) | 1 (right hand), ang (rad, direction the fingers point), curl (0 flat … 1 fingers under / hidden),
//       spread (0..1), thumb (0 alongside … 1 opposed over the top) }
import { path } from '../lib/cel.js';
import { celGroup, iline } from '../lib/celgroup.js';
import { limbSeg } from './aki.js';

const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
export function handTop(g, P, L, x, y, o = {}) {
  const side = o.side ?? 1, a = o.ang ?? 0, curl = o.curl ?? 0, spread = o.spread ?? .4, th = o.thumb ?? .3;
  const T = p => { const r = rot([p[0], p[1] * side], a); return [x + r[0], y + r[1]]; };   // local: +x along the fingers
  const shapes = [];
  // palm: knuckle line at x = 34
  shapes.push(path([T([-6, -17]), T([14, -20]), T([34, -19]), T([38, 0]), T([34, 19]), T([12, 18]), T([-6, 14]), T([-10, 0])]));
  // fingers: index (top, y=-14) … little (y=+15). Lengths shrink and fold under with curl (foreshortened as they slide beneath)
  const F = [[-14, 30, 6.2], [-4.5, 33, 6.4], [5, 31, 6.1], [14, 25, 5.4]];
  const tips = [];
  F.forEach(([fy, len, w], i) => {
    const fan = (i - 1.5) * .09 * (1 + spread);
    const vis = 1 - .82 * curl;                                   // visible length from above
    const k0 = T([34, fy]);
    const d = rot([Math.cos(fan), Math.sin(fan) * side], a);
    const k1 = [k0[0] + d[0] * len * .55 * vis, k0[1] + d[1] * len * .55 * vis];
    const k2 = [k1[0] + d[0] * len * .45 * vis, k1[1] + d[1] * len * .45 * vis];
    shapes.push(limbSeg(k0, k1, [w, w, w * .95, .5], [w, w, w * .95, .5], .5, .5), limbSeg(k1, k2, [w * .95, w * .9, w * .8, .5], [w * .95, w * .9, w * .8, .5], .5, .9));
    tips.push([k0, k1, k2, w]);
  });
  // thumb from the base of the palm
  const t0 = T([4, -16]), tdir = rot([Math.cos(-.9 + th * .7), Math.sin(-.9 + th * .7) * side], a);
  const t1 = [t0[0] + tdir[0] * 16, t0[1] + tdir[1] * 16], t2 = [t1[0] + tdir[0] * 15, t1[1] + tdir[1] * 15];
  shapes.push(limbSeg(t0, t1, [7.5, 7, 6.5, .5], [7.5, 7, 6.5, .5], .6, .5), limbSeg(t1, t2, [6.5, 6.2, 5.6, .5], [6.5, 6.2, 5.6, .5], .5, .9));
  celGroup(g, shapes, P.skin, L, { lw: o.lw ?? 1.7 });
  // knuckle creases + nails
  for (const [k0, k1, k2, w] of tips) {
    if (curl < .7) {
      const n = [k2[0] - k1[0], k2[1] - k1[1]], l = Math.hypot(...n) || 1, u = [n[0] / l, n[1] / l], p = [-u[1], u[0]];
      iline(g, path([[k1[0] + p[0] * w * .6, k1[1] + p[1] * w * .6], [k1[0] - p[0] * w * .6, k1[1] - p[1] * w * .6]], false), P.skin.l, .9);
      const nb = [k2[0] - u[0] * w * .9, k2[1] - u[1] * w * .9];
      g.fillStyle = P.skin.h; g.beginPath(); g.ellipse(nb[0], nb[1], w * .55, w * .42, Math.atan2(u[1], u[0]), 0, Math.PI * 2); g.fill();
    }
  }
  iline(g, path([T([30, -16]), T([33, 0]), T([30, 16])], false), P.skin.l, .8);   // knuckle row
  return { tips };
}
