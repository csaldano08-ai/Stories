// The driver (late 50s): navy uniform & cap with a small gold badge, grey hair and moustache, square kind face, crow's feet,
// white gloves. 3/4 bust drawn facing +x (mirror to face left). Local: head centre (0,0), head 84 u tall (a broader head than Aki's).
// d = { mouth (viseme), eyes (0..1), smile (0..1), brow, look:[x,y], wave (0..1 phase of the beckoning hand), lean }
import { path, rgba, mix, TAU } from '../lib/cel.js';
import { celGroup, iline } from '../lib/celgroup.js';
import { VIS } from './head.js';

export function drawDriver(g, P, d, L) {
  const lw = d.lw ?? 2.2, m = (typeof d.mouth === 'string' ? VIS[d.mouth] : d.mouth) || VIS.X, sm = d.smile || 0;
  const LS = { sh: L.sh && [L.sh[0] * .5, L.sh[1] * .5], hi: L.hi && [L.hi[0] * .5, L.hi[1] * .5], rim: L.rim };
  // shoulders / uniform (behind the head)
  celGroup(g, [path([[-130, 60], [-60, 40], [10, 44], [80, 56], [120, 140], [130, 260], [-150, 260], [-150, 140]])], P.uniform, L, { lw, xs: [path([[-150, 140], [-130, 60], [-90, 52], [-110, 260], [-150, 260]])] });
  celGroup(g, [path([[-26, 34], [24, 34], [30, 70], [0, 96], [-30, 70]])], { f: '#eef0f6', s: '#b8bccc', l: '#3a3e50' }, LS, { lw });    // shirt collar
  celGroup(g, [path([[-6, 58], [6, 58], [10, 120], [0, 132], [-10, 120]])], { f: '#6a1f2a', s: '#4a1018', l: '#1e0408' }, LS, { lw: lw * .8 }); // tie
  // neck + head (square jaw)
  celGroup(g, [path([[-24, 20], [22, 20], [24, 50], [-24, 50]])], P.dskin, LS, { lw });
  const jaw = (m.open || 0) * 4;
  const head = path([[-38, -10], [-36, -36], [-20, -44], [14, -44], [36, -34], [42, -12], [43, 4], [40, 16], [36, 30 + jaw], [20, 42 + jaw], [-4, 44 + jaw], [-24, 36 + jaw * .6], [-36, 20]]);
  celGroup(g, [head], P.dskin, L, { lw, xs: [path([[-36, 20], [-24, 36], [-4, 44], [-14, 30], [-30, 10]])] });
  // ear (near side, left)
  celGroup(g, [path([[-40, -2], [-48, -6], [-50, 8], [-42, 16]])], P.dskin, LS, { lw: lw * .8 });
  // grey hair at the temples
  celGroup(g, [path([[-38, -24], [-30, -34], [-22, -30], [-30, 2], [-38, 0]]), path([[34, -30], [40, -22], [41, -8], [36, -14]])], P.dhair, LS, { lw: lw * .8 });
  // eyes (narrow, kind), crow's feet, brows
  const eo = d.eyes ?? 1, lk = d.look || [0, 0];
  for (const [ex, ey, w] of [[-8, -6, 13], [22, -6, 9]]) {
    const h = 5 * eo * (1 - sm * .35);
    if (h > .8) {
      const EP = new Path2D(); EP.ellipse(ex, ey, w / 2, h, 0, 0, TAU);
      g.fillStyle = '#f6f2ec'; g.fill(EP); g.save(); g.clip(EP);
      g.fillStyle = '#3a2a22'; g.beginPath(); g.arc(ex + lk[0] * 2.5, ey + lk[1] * 1.5, 3.4, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + lk[0] * 2.5 + 1, ey - 1.2, 1, 0, TAU); g.fill(); g.restore();
    }
    iline(g, path([[ex - w / 2 - 1, ey - 1], [ex, ey - h - 1.4], [ex + w / 2 + 1, ey - .5]], false), P.dskin.l, 1.6);
  }
  for (const k of [0, 1, 2]) iline(g, path([[-17, -6 + k * 3.5 - 3], [-23, -8 + k * 4.5 - 3]], false), mix(P.dskin.l, P.dskin.f, .4), .8);
  const br = d.brow || [0, 0];
  celGroup(g, [path([[-16, -15 + br[0]], [-1, -18 + br[0]], [0, -15 + br[0]], [-15, -12 + br[0]]]), path([[16, -17 + br[1]], [28, -16 + br[1]], [28, -14 + br[1]], [16, -14 + br[1]]])], { f: P.dhair.s }, {}, { noLine: true });
  // nose (broad), smile lines
  iline(g, path([[10, -4], [16, 12], [12, 15], [6, 14]], false), P.dskin.l, 1.3);
  iline(g, path([[0, 14], [-4, 26 + sm * 2]], false), mix(P.dskin.l, P.dskin.f, .4), .9);
  // mouth + grey moustache over it
  const mo = m.open || 0, my = 28 + jaw * .6;
  if (mo > .06) { const MP = new Path2D(); MP.ellipse(10, my + 2 + mo * 3, 9 * (m.wide || 1) * (1 - (m.round || 0) * .3), 2 + mo * 6, 0, 0, TAU); g.fillStyle = '#4a1a20'; g.fill(MP); g.strokeStyle = P.dskin.l; g.lineWidth = 1.1; g.stroke(MP); }
  else iline(g, path([[0, my + 1 - sm * 2], [10, my + 2], [20, my + 1 - sm * 2]], false), P.dskin.l, 1.2);
  celGroup(g, [path([[-4, my - 6], [10, my - 9], [25, my - 6], [24, my - 1], [10, my - 3], [-3, my - 1]])], P.dhair, LS, { lw: lw * .7 });
  // cap
  celGroup(g, [path([[-42, -26], [-36, -58], [0, -68], [38, -58], [46, -30], [0, -34]])], P.uniform, L, { lw });
  celGroup(g, [path([[-44, -28], [6, -36], [56, -26], [50, -16], [4, -24], [-40, -20]])], { f: '#141a30', s: '#0a0e1c', h: '#3a4468', l: '#04060c' }, L, { lw });   // peak
  celGroup(g, [path([[-2, -54], [10, -56], [12, -44], [0, -42]])], P.capBadge, LS, { lw: lw * .7 });
  // the beckoning hand (white glove), raised beside the face
  if (d.wave != null) {
    const a = Math.sin(d.wave * TAU) * .35;
    g.save(); g.translate(96, 70); g.rotate(-.9 + a);
    celGroup(g, [path([[-14, 30], [-16, 0], [-12, -30], [-4, -46], [6, -46], [10, -30], [16, -14], [20, 4], [14, 30]])], P.glove, LS, { lw });
    for (const k of [0, 1, 2]) iline(g, path([[-8 + k * 7, -40], [-6 + k * 7, -18]], false), P.glove.l, .9);
    g.restore();
    celGroup(g, [path([[40, 100], [84, 84], [110, 120], [70, 160]])], P.uniform, L, { lw });   // sleeve
  }
}
