// AKI v2 — front and back full figures (character sheet / turnaround). Same proportions as the profile rig:
// 600 u, head 80, hip 312, shoulder 492; ground at y = 0, figure centred on x = 0, facing the camera (front) or away (back).
import { path, mix } from '../lib/cel.js';
import { celGroup, iline } from '../lib/celgroup.js';
import { limbSeg } from './aki_profile.js';
import { headFront, headBack } from './face2.js';
import { hairFront, hairBack } from './hair2.js';
import { hand2 } from './hands2.js';

const legs = (P, L, g, lw, back) => {
  for (const s of [-1, 1]) {
    const hip = [s * 21, -312], knee = [s * 16.5, -162], ank = [s * 13.5, -22];
    // boot (front: rounded toe; back: heel)
    celGroup(g, [path(back ? [[s * 13.5 - 13, -64], [s * 13.5 + 13, -64], [s * 13.5 + 14, -2], [s * 13.5 - 14, -2]] :
      [[s * 13.5 - 12, -62], [s * 13.5 + 12, -62], [s * 13.5 + 14, -14], [s * 13.5 + 16, -3], [s * 13.5 + 8, 2], [s * 13.5 - 8, 2], [s * 13.5 - 16, -3], [s * 13.5 - 14, -14]])], P.boots, L, { lw });
    celGroup(g, [limbSeg(hip, knee, [24, 21, 15, .4], [20, 18, 15, .5], .4, .6), limbSeg(knee, ank, [16, 15.5, 11.5, .3], [15, 16, 11.5, .35], .5, .2)], P.trousers, L, { lw });
    iline(g, path([[s * 13.5 - 12, -50], [s * 13.5, -46], [s * 13.5 + 12, -50]], false), P.trousers.l, 1.2);          // hem over the boot
  }
};
const arms = (P, L, g, lw, top, watchSide) => {
  for (const s of [-1, 1]) {
    const sh = [s * 60, -486], el = [s * 72, -378], wr = [s * 70, -294];
    celGroup(g, [limbSeg(sh, el, [16, 15, 13, .5], [16, 15, 13, .5], .9, .6), limbSeg(el, wr, [13, 12.5, 12, .5], [13, 12, 11.5, .5], .5, .3)], top, L, { lw });
    iline(g, path([[wr[0] - 12, wr[1] - 12], [wr[0], wr[1] - 10], [wr[0] + 12, wr[1] - 12]], false), top.l, 1.2);                // cuff
    if (s === watchSide) { celGroup(g, [path([[wr[0] - 11, wr[1] - 5], [wr[0] + 11, wr[1] - 5], [wr[0] + 11, wr[1] + 3], [wr[0] - 11, wr[1] + 3]])], P.strap, L, { lw: 1.2 });
      celGroup(g, [path([[wr[0] - 6, wr[1] - 7], [wr[0] + 6, wr[1] - 7], [wr[0] + 6, wr[1] + 5], [wr[0] - 6, wr[1] + 5]])], P.gold, L, { lw: 1.1 }); }
    hand2(g, P, { sh: L.sh && [L.sh[0] * .3, L.sh[1] * .3] }, wr[0], wr[1] - 2, { ang: Math.PI / 2 + s * .08, side: -s, pose: 'relaxed', s: .95 });
  }
};
export function figureFront(g, P, L, o = {}) {
  const lw = o.lw ?? 2.1, sw = P.sweater, jk = P.jacket;
  const J = { headC: [0, -556], headA: 0 }, ho = { P, L, hair: o.hair || {}, lw };
  hairFront(g, P, J.headC, 0, ho, 'under');
  legs(P, L, g, lw, false);
  // sweater torso + roll neck
  celGroup(g, [path([[-58, -490], [-50, -440], [-34, -386], [-40, -330], [-42, -300], [42, -300], [40, -330], [34, -386], [50, -440], [58, -490], [18, -522], [-18, -522]])], sw, L, { lw });
  iline(g, path([[-8, -470], [-6, -400], [-8, -320]], false), sw.l, .9); iline(g, path([[8, -470], [6, -400], [8, -320]], false), sw.l, .9);
  // jacket: two open front panels with lapels, standing collar behind the neck, pocket flaps
  for (const s of [-1, 1]) {
    celGroup(g, [path([[s * 22, -522], [s * 46, -508], [s * 63, -492], [s * 66, -440], [s * 58, -360], [s * 60, -282], [s * 22, -282], [s * 26, -360], [s * 30, -430], [s * 17, -506]])], jk, L, { lw,
      xs: [path([[s * 30, -430], [s * 26, -360], [s * 22, -282], [s * 32, -282], [s * 36, -360], [s * 40, -430]])] });
    celGroup(g, [path([[s * 17, -506], [s * 30, -430], [s * 40, -462], [s * 26, -516]])], jk, L, { lw: lw * .8, xh: [path([[s * 26, -516], [s * 40, -462], [s * 37, -461], [s * 24, -510]])] });   // lapel, lying flat
    iline(g, path([[s * 36, -340], [s * 56, -342]], false), jk.l, 1.3);                                                                  // pocket flap
    iline(g, path([[s * 28, -392], [s * 60, -392]], false), jk.l, 1);                                                                    // waist seam
  }
  celGroup(g, [path([[-24, -540], [24, -540], [26, -518], [-26, -518]])], sw, L, { lw });                                                // roll neck
  arms(P, L, g, lw, jk, 1);
  celGroup(g, [limbSeg([0, -548], [0, -518], [10, 10, 11, .5], [10, 10, 11, .5], .2, .2)], P.skin, L, { lw: lw * .8 });                 // neck
  headFront(g, P, J.headC, 0, o.face || {}, L, ho);
  hairFront(g, P, J.headC, 0, ho, 'over');
}
export function figureBack(g, P, L, o = {}) {
  const lw = o.lw ?? 2.1, jk = P.jacket;
  legs(P, L, g, lw, true);
  arms(P, L, g, lw, jk, -1);
  // jacket back: storm flap across the shoulders, centre seam, back belt
  celGroup(g, [path([[-62, -492], [-60, -440], [-50, -360], [-58, -282], [58, -282], [50, -360], [60, -440], [62, -492], [20, -526], [-20, -526]])], jk, L, { lw,
    xs: [path([[-58, -282], [-50, -360], [-44, -360], [-50, -282]])] });
  iline(g, path([[-60, -462], [-20, -456], [20, -456], [60, -462]], false), jk.l, 1.3);                                             // storm-flap yoke seam
  iline(g, path([[0, -452], [0, -282]], false), jk.l, 1.3);
  celGroup(g, [path([[-52, -396], [52, -396], [52, -384], [-52, -384]])], jk, L, { lw: lw * .9 });                                      // back belt
  const J = { headC: [0, -556], headA: 0 }, ho = { P, L, hair: o.hair || {}, lw };
  celGroup(g, [limbSeg([0, -548], [0, -518], [10, 10, 11, .5], [10, 10, 11, .5], .2, .2)], P.skin, L, { lw: lw * .8 });
  headBack(g, P, J.headC, 0, L, ho);
  hairBack(g, P, J.headC, 0, ho);
}
