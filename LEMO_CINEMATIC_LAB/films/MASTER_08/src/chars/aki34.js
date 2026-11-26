// Aki 3/4 bust, jacket off (cream knit, getting wet), cradling the kitten wrapped in her vermilion jacket.
// Local frame: origin at the sternum notch, +x toward screen right (she faces 3/4 right), y down; same units as the profile rig.
// p = { head (tilt rad), lean (whole bust), breathe (phase), face{…}, wet, lift (bundle height offset), kit{…} kitten,
//       hair lags, look }
import { path } from '../lib/cel.js';
import { celGroup, iline } from '../lib/celgroup.js';
import { rot } from '../lib/rig.js';
import { head34 } from './head.js';
import { hairUnder, hairOver } from './hair.js';
import { drawKitten } from './kitten.js';

const T = (p, a, o) => { const r = rot(p, a); return [r[0] + o[0], r[1] + o[1]]; };

export function drawBust34(g, P, p, L) {
  const lw = p.lw ?? 2.1, br = Math.sin(p.breathe || 0) * 2.2, lean = p.lean || 0, wet = p.wet ?? 0;
  const sw = wet ? P.wet('sweater', wet) : P.sweater;
  const LS = { sh: L.sh && [L.sh[0] * .45, L.sh[1] * .45], hi: L.hi && [L.hi[0] * .45, L.hi[1] * .45], rim: L.rim };
  g.save(); g.rotate(lean);
  const sh = -br;                                     // shoulders rise on the in-breath
  const headC = [6 + (p.headX || 0), -60 + sh * .6], headA = p.head || 0;
  const J = { headC, headA };
  const o = { P, L, hair: p.hair || {}, lw, wetHair: wet > .3 };
  hairUnder(g, P, J, o, '34');
  // torso (sweater) — near shoulder on the left, broad and sloping
  const torso = path([[-16, -4], [-46, 6], [-74, 22 + sh], [-80, 70], [-70, 150], [-60, 240], [50, 242], [54, 150], [58, 70], [56, 18 + sh], [30, 4], [16, -4]]);
  celGroup(g, [torso], sw, L, { lw, xs: [path([[-80, 70], [-70, 150], [-60, 240], [-40, 240], [-50, 150], [-60, 70]])] });
  // neck + roll neck
  celGroup(g, [path([[-12, -36 + sh * .5], [14, -36 + sh * .5], [15, -6], [-13, -6]])], P.skin, LS, { lw: lw * .8, xs: [path([[-12, -30], [14, -22], [14, -8], [-12, -8]])] });
  celGroup(g, [path([[-26, -12], [-10, -18], [12, -18], [28, -10], [30, 6], [10, 12], [-10, 12], [-28, 6]])], sw, LS, { lw });
  iline(g, path([[-22, -2], [0, 4], [24, -2]], false), sw.l, 1);
  head34(g, P, headC, headA, p.face || {}, L, o);
  hairOver(g, P, J, o, '34');
  const lift = p.lift || 0;
  // far arm: upper arm on the right edge, going behind the bundle
  celGroup(g, [path([[44, 18 + sh], [62, 26], [66, 96], [58, 132], [40, 126], [40, 64]])], P.far('sweater'), LS, { lw });
  // the bundle: back half of the wrapped jacket, the kitten, then the front lip over the kitten's shoulders
  const bx = -4, by = 128 - lift;
  const back = path([[bx - 74, by], [bx - 60, by - 44], [bx - 24, by - 64], [bx + 22, by - 66], [bx + 62, by - 46], [bx + 78, by - 6], [bx + 66, by + 34], [bx + 20, by + 52], [bx - 36, by + 50], [bx - 68, by + 30]]);
  celGroup(g, [back], P.jacket, L, { lw, xs: [path([[bx - 68, by + 30], [bx - 36, by + 50], [bx + 20, by + 52], [bx + 66, by + 34], [bx + 40, by + 30], [bx - 30, by + 32]])] });
  celGroup(g, [path([[bx - 40, by - 46], [bx - 14, by - 60], [bx + 24, by - 62], [bx + 52, by - 42], [bx + 36, by - 30], [bx - 24, by - 30]])], P.lining, LS, { lw: lw * .8 });
  if (p.kit) { g.save(); g.translate(bx + 6, by - 22); g.scale(p.kitS ?? 1, p.kitS ?? 1); drawKitten(g, P, { ...p.kit, body: false }, L); g.restore(); }
  const lip = path([[bx - 70, by - 10], [bx - 42, by - 34], [bx - 10, by - 22], [bx + 26, by - 26], [bx + 58, by - 36], [bx + 76, by - 10], [bx + 56, by + 6], [bx, by + 4], [bx - 52, by + 6]]);
  celGroup(g, [lip], P.jacket, L, { lw, xh: [path([[bx - 42, by - 34], [bx - 10, by - 22], [bx + 26, by - 26], [bx + 22, by - 20], [bx - 10, by - 16], [bx - 40, by - 28]])] });
  if (p.kit && p.kit.paw !== false) celGroup(g, [path([[bx + 14, by - 28], [bx + 28, by - 30], [bx + 30, by - 20], [bx + 16, by - 19]])], P.furWhite, LS, { lw: lw * .7, noRim: true });
  iline(g, path([[bx - 50, by + 18], [bx - 6, by + 28], [bx + 50, by + 20]], false), P.jacket.l, 1.2);
  // near arm: sleeve down the side, forearm under the bundle, hand cupping its far side
  celGroup(g, [path([[-80, 26 + sh], [-58, 18 + sh], [-50, 70], [-46, 126], [-66, 140], [-86, 124], [-90, 66]]),
    path([[-80, 118], [-30, 152 - lift * .6], [40, 156 - lift], [48, 176 - lift], [-24, 182 - lift * .6], [-74, 150]])], sw, L, { lw });
  iline(g, path([[-64, 132], [-56, 150]], false), sw.l, 1);
  celGroup(g, [path([[40, 152 - lift], [58, 140 - lift], [72, 140 - lift], [74, 152 - lift], [62, 168 - lift], [44, 174 - lift]])], P.skin, LS, { lw: lw * .8 });
  iline(g, path([[58, 146 - lift], [66, 156 - lift]], false), P.skin.l, .9);
  // far hand resting on the top of the bundle
  celGroup(g, [path([[44, by - 40], [60, by - 48], [72, by - 40], [72, by - 26], [54, by - 22]])], P.skin, LS, { lw: lw * .8 });
  g.restore();
}
