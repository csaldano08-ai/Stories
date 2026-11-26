// Aki's hair: shoulder-length dark plum, side part, bangs off the eyes, flipped-out 80s ends, locks over the ears.
// Three layers: UNDER (the mass hanging behind the neck), OVER (cap over the skull + side locks), BANGS.
// Lock tips follow lag offsets (rig.lagOffset) given in world units: o.hair = {back:[dx,dy], side:[dx,dy], bang:[dx,dy]}.
import { path, mix } from '../lib/cel.js';
import { celGroup, iline } from '../lib/celgroup.js';
import { rot } from '../lib/rig.js';

const off = (v, A, k = 1) => { const r = rot(v || [0, 0], -A); return [r[0] * k, r[1] * k]; };
const P2 = (p, d, k = 1) => [p[0] + d[0] * k, p[1] + d[1] * k];
const lock = (x0, y0, x1, y1, tx, ty, bend = 0) => {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = tx - mx, dy = ty - my, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  return path([[x0, y0], [x0 + dx * .55 + nx * bend, y0 + dy * .55 + ny * bend], [tx, ty, 1], [x1 + dx * .5 + nx * bend * .7, y1 + dy * .5 + ny * bend * .7], [x1, y1]]);
};
function ring(g, P, pts) {   // angel ring: smooth upper edge, zigzag lower edge
  g.fillStyle = mix(P.hair.h, '#ffffff', .25);
  g.beginPath(); pts.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); g.closePath(); g.fill();
}
const hairStyle = (P, o) => o.wetHair ? { ...P.hair, h: mix(P.hair.h, P.hair.f, .35) } : P.hair;

export function hairUnder(g, P, J, o, view) {
  const C = J.headC, A = J.headA, H = o.hair || {};
  const b = off(H.back, A), lw = (o.lw ?? 2.1) * .85;
  g.save(); g.translate(C[0], C[1]); g.rotate(A);
  const st = hairStyle(P, o), L = o.L;
  if (view === 'side') {
    const sh = path([[21, -31], [6, -46], [-16, -47], [-38, -34], [-46, -10], [-47, 18], P2([-47, 44], b, .55), [...P2([-56, 64], b), 1], P2([-47, 61], b, .95),
      [...P2([-45, 72], b), 1], P2([-38, 63], b, .9), [...P2([-31, 71], b), 1], P2([-27, 60], b, .8), [...P2([-19, 66], b, .9), 1], P2([-17, 52], b, .5), [-14, 38], [-13, 14], [2, -10], [16, -22]]);
    celGroup(g, [sh], st, L, { lw });
  } else {
    const b2 = off(H.back2 || H.back, A);
    const sh = path([[-2, -47], [-27, -42], [-41, -20], [-44, 10], P2([-44, 42], b, .55), [...P2([-52, 60], b), 1], P2([-43, 58], b, .95), [...P2([-40, 69], b), 1], P2([-33, 60], b, .9),
      [...P2([-27, 66], b, .9), 1], [-25, 44], [-20, 32], [10, 46], P2([26, 50], b2, .8), [...P2([34, 47], b2), 1], [33.5, 22], [33.5, 0], [31, -24], [18, -42]]);
    celGroup(g, [sh], st, L, { lw });
  }
  g.restore();
}

export function hairOver(g, P, J, o, view) {
  const C = J.headC, A = J.headA, H = o.hair || {};
  const s = off(H.side, A), bg = off(H.bang, A, .6), lw = (o.lw ?? 2.1) * .85;
  g.save(); g.translate(C[0], C[1]); g.rotate(A);
  const st = hairStyle(P, o), L = o.L;
  if (view === 'side') {
    const cap = path([[25, -30], [9, -45.5], [-16, -46.5], [-37, -33], [-44, -8], [-42, 14], [-30, 30], [-18, 33],
      [-11, 14], P2([-13, 44], s, .7), [...P2([-6, 57], s), 1], P2([1, 41], s, .7), [3, 18], [6, -2], [12, -14], [18, -24]]);
    const bangs = [
      lock(12, -36, 22, -32, ...P2([31.5, -8], bg), 3),
      lock(17, -35, 26, -30, ...P2([33.5, -12], bg), 2),
      lock(6, -38, 15, -34, ...P2([24, -7], bg), 4),
    ];
    celGroup(g, [cap, ...bangs], st, L, { lw, xs: [path([[-11, 14], [-6, 36], [-2, 40], [-4, 14]])] });
    ring(g, P, [[-31, -27], [-16, -38.5], [2, -40.5], [15, -36], [13, -32], [8, -30.5], [4, -33], [-1, -30], [-6, -33], [-11, -30], [-16, -33], [-21, -29], [-26, -30]]);
    iline(g, path([[-20, -18], [-28, 6], [-30, 24]], false), st.l, 1);
    iline(g, path([[-6, 18], P2([-6, 44], s, .8)], false), st.l, .9);
  } else {
    const s2 = off(H.side2 || H.side, A);
    const cap = path([[-4, -46.5], [-33, -36], [-37, -12], [-33, 2], P2([-31, 30], s, .7), [...P2([-27, 49], s), 1], P2([-24, 34], s, .7), [-27, 12], [-25, -6],
      [-15, -25], [4, -32], [20, -28], [27.5, -17], [30.5, -5], P2([31.5, 16], s2, .7), [...P2([30.5, 32], s2), 1], P2([29, 14], s2, .6), [28.5, -4], [24, -20], [10, -36]]);
    const bangs = [
      lock(-10, -40, -2, -40, ...P2([-17, -10], bg), -3),
      lock(-6, -41, 6, -38, ...P2([-3, -6], bg), -2),
      lock(2, -40, 14, -36, ...P2([11, -9], bg), 2),
      lock(10, -38, 22, -33, ...P2([24, -12], bg), 3),
    ];
    celGroup(g, [cap, ...bangs], st, L, { lw });
    ring(g, P, [[-32, -27], [-18, -39], [0, -42], [16, -37], [14, -33], [9, -31.5], [5, -34], [0, -31], [-5, -34.5], [-10, -31], [-15, -34], [-20, -30], [-26, -30.5]]);
    iline(g, path([[-8, -40], [-4, -30]], false), st.l, .9);   // parting
  }
  g.restore();
}
