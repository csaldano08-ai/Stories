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
  const b = off(H.back, A), lw = (o.lw ?? 2.1) * .62;
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
  const s = off(H.side, A), bg = off(H.bang, A, .6), lw = (o.lw ?? 2.1) * .62;
  g.save(); g.translate(C[0], C[1]); g.rotate(A);
  const st = hairStyle(P, o), L = o.L;
  if (view === 'side') {
    const cap = path([[25, -30], [9, -45.5], [-16, -46.5], [-37, -33], [-44, -8], [-42, 14], [-30, 30], [-18, 33],
      [-11, 14], P2([-13, 44], s, .7), [...P2([-6, 57], s), 1], P2([1, 41], s, .7), [3, 18], [6, -2], [12, -14], [18, -24]]);
    const bangs = [
      lock(12, -36, 22, -32, ...P2([30.5, -10], bg), 5),
      lock(4, -38.5, 15, -35, ...P2([23.5, -9], bg), 6),
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
      lock(-11, -40, -3, -41, ...P2([-19, -14], bg), -5),
      lock(-4, -41, 8, -39.5, ...P2([5, -13], bg), 7),
      lock(6, -39.5, 18, -35, ...P2([22, -12.5], bg), 6),
    ];
    celGroup(g, [cap, ...bangs], st, L, { lw });
    ring(g, P, [[-32, -27], [-18, -39], [0, -42], [16, -37], [14, -33], [9, -31.5], [5, -34], [0, -31], [-5, -34.5], [-10, -31], [-15, -34], [-20, -30], [-26, -30.5]]);
    iline(g, path([[-8, -40], [-4, -30]], false), st.l, .9);   // parting
  }
  g.restore();
}

// ——— v2 additions: FRONT and BACK views (same hair: side part on her right = screen-left in front view) ———
export function hairFront(g, P, C, A, o, layer) {
  const H = o.hair || {}, b = off(H.back, A), s = off(H.side, A), bg = off(H.bang, A, .6), lw = (o.lw ?? 2.1) * .62, st = hairStyle(P, o), L = o.L;
  g.save(); g.translate(C[0], C[1]); g.rotate(A);
  if (layer === 'under') {
    const sh = path([[-34, -36], [-40, -10], [-41, 22], P2([-43, 44], b, .5), [...P2([-51, 58], b), 1], P2([-41, 56], b, .9), [...P2([-35, 64], b), 1], P2([-28, 54], b, .8),
      [-22, 40], [22, 40], P2([28, 54], b, .8), [...P2([35, 64], b), 1], P2([41, 56], b, .9), [...P2([51, 58], b), 1], P2([43, 44], b, .5), [41, 22], [40, -10], [34, -36], [0, -49]]);
    celGroup(g, [sh], st, L, { lw });
  } else {
    const cap = path([[-37, -16], [-35, -32], [-24, -44.5], [-6, -49.5], [14, -48], [30, -40], [37, -26], [37.5, -10], [33, -6], [30, -17], [25, -28], [15, -35], [5, -38.2],
      [-9, -38.6], [-17, -34], [-25, -26], [-30.5, -14], [-35, -5]]);
    const sideL = path([[-36.5, -14], [-31.5, -17], [-28.8, 2], P2([-29.4, 22], s, .6), [...P2([-30, 35], s), 1], P2([-33.5, 21], s, .6), [-35.8, 0]]);
    const sideR = path([[36.5, -14], [32, -18], [29.4, 2], P2([29.8, 26], s, .6), [...P2([30.6, 41], s), 1], P2([34.4, 25], s, .6), [36.2, 2]]);
    const bangs = [                                                     // long, curved, side-swept locks; tips stay above the brows
      lock(-11, -38, -4, -40, ...P2([-21, -19], bg), -5), lock(-5, -40, 7, -40.5, ...P2([5, -17], bg), 7), lock(5, -40, 17, -37.5, ...P2([19, -16.5], bg), 7),
      lock(15, -37.5, 27, -31, ...P2([30, -9], bg), 5),
    ];
    celGroup(g, [cap, sideL, sideR, ...bangs], st, L, { lw, xs: [path([[-31, -14], [-29, 0], [-27, 14], [-26, 0]]), path([[29.5, 2], [30, 24], [28, 10]])] });
    ring(g, P, [[-30, -31], [-16, -42.5], [2, -45.5], [19, -42], [31, -32], [27, -30], [22, -33], [16, -30], [10, -34], [4, -31], [-2, -35], [-8, -31], [-14, -34], [-20, -30], [-26, -32]]);
    iline(g, path([[-9, -38], [-6, -46]], false), st.l, .9);                                    // the part
    for (const [x0, y0, x1, y1] of [[2, -36, 4, -24], [14, -34, 18, -22], [-22, -28, -25, -12], [33, -20, 34, -6]]) iline(g, path([[x0, y0], [x1, y1]], false), st.l, .7);
  }
  g.restore();
}
export function hairBack(g, P, C, A, o) {
  const H = o.hair || {}, b = off(H.back, A), lw = (o.lw ?? 2.1) * .62, st = hairStyle(P, o), L = o.L;
  g.save(); g.translate(C[0], C[1]); g.rotate(A);
  const sh = path([[-35, -32], [-40, -6], [-41, 24], P2([-43, 44], b, .5), [...P2([-51, 58], b), 1], P2([-40, 56], b, .9), [...P2([-32, 65], b), 1], P2([-23, 56], b, .8),
    [...P2([-12, 64], b, .9), 1], [-3, 56], [...P2([7, 65], b, .9), 1], [14, 56], [...P2([25, 64], b, .9), 1], P2([33, 56], b, .8), [...P2([42, 64], b), 1], P2([44, 50], b, .6),
    [41, 24], [40, -6], [35, -32], [20, -46], [0, -49.5], [-20, -46]]);
  celGroup(g, [sh], st, L, { lw, xs: [path([[-41, 28], [-36, 50], [36, 50], [41, 28], [0, 40]])] });
  ring(g, P, [[-30, -32], [-14, -44], [8, -45], [26, -36], [22, -32], [16, -36], [10, -32], [3, -37], [-4, -32], [-11, -36], [-18, -31], [-25, -33]]);
  for (const x of [-30, -16, -2, 12, 26]) iline(g, path([[x * .6, -30], [x * .9, 10], [x, 48]], false), st.l, .8);
  iline(g, path([[-9, -46], [-3, -36]], false), st.l, .9);
  g.restore();
}
