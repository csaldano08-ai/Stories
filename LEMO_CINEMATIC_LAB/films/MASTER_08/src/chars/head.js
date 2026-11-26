// Aki's head: one construction (cranium + egg jaw, head = 80 u: top −40, eye line +2, nose base +19, mouth +26, chin +40)
// drawn in two angles: full profile and 3/4, both facing +x. Expressions and visemes are parameters, never separate drawings,
// so the identity stays fixed across shots. Eye construction follows the 80s rules of STYLE §2 (almond eye, thick flicked
// upper lash line, layered tall iris, two highlights) — technique learnt from the Lemo-Opuscar demo head (MIT), redrawn.
import { path, mix, rgba, TAU } from '../lib/cel.js';
import { celGroup, iline } from '../lib/celgroup.js';
import { rot } from '../lib/rig.js';
import { clamp } from '../lib/util.js';

// visemes → mouth parameters. open: jaw/lips 0..1, wide: horizontal stretch, round: rounding, teeth, tongue
export const VIS = {
  X: { open: 0, wide: 1, round: 0 }, M: { open: 0, wide: .95, round: 0, press: 1 },
  A: { open: .85, wide: 1.05, round: .1, teeth: 1, tongue: 1 }, E: { open: .4, wide: 1.2, round: 0, teeth: 1 },
  I: { open: .28, wide: 1.15, round: 0, teeth: 1 }, O: { open: .62, wide: .72, round: 1 }, U: { open: .28, wide: .6, round: 1 },
  F: { open: .12, wide: 1, round: 0, teeth: 1, fv: 1 }, L: { open: .45, wide: 1, round: 0, teeth: 1, tongue: 1 },
  pant: { open: .55, wide: 1.05, round: .2, teeth: 1, tongue: 1 }, smile: { open: 0, wide: 1.1, smile: 1 },
  smileopen: { open: .35, wide: 1.15, smile: 1, teeth: 1 }, soft: { open: .03, wide: .95, smile: .3 },
};
const mouthOf = f => (typeof f.mouth === 'string' ? VIS[f.mouth] : f.mouth) || VIS.X;

// ———————————————————————————————— PROFILE ————————————————————————————————
const PROF = [
  [-36, -4], [-33, 16], [-22, 31], [-7, 30], [8, 36.5],         // back of skull → jaw angle → under-jaw
  [23, 40], [30, 35.5], [29.4, 31.2], [32.1, 28.2],             // 5 chin bottom, 6 chin front, 7 chin dip, 8 lower lip
  [31.5, 25.9, 1],                                                // 9 lip corner (sharp)
  [32.8, 23.3], [31.2, 19.7, 1], [33.4, 18.3], [37.4, 15.4, 1], // 10 upper lip, 11 subnasal, 12 nostril, 13 nose tip
  [32.6, 9.5], [29.5, 3.2], [30.7, -3.6], [30, -13], [24, -28], [10, -38], [-12, -38.5], [-30, -25],
];
const JAW_PIVOT = [-6, 10];
export function headProfile(g, P, C, A, f, L, o = {}) {
  const m = mouthOf(f);
  const jaw = (m.open || 0) * 0.17;
  const pts = PROF.map((p, i) => {
    let q = [p[0], p[1]];
    if (i >= 4 && i <= 8) { const v = rot([q[0] - JAW_PIVOT[0], q[1] - JAW_PIVOT[1]], jaw); q = [JAW_PIVOT[0] + v[0], JAW_PIVOT[1] + v[1]]; }
    if (m.round && (i === 8 || i === 10)) q[0] += 1.6 * m.round;         // lips push forward on O/U
    if (m.smile && i === 9) { q[0] -= 1.2; q[1] -= 1.4; }
    return p[2] ? [...q, 1] : q;
  });
  g.save(); g.translate(C[0], C[1]); g.rotate(A);
  const lw = (o.lw ?? 2.1) * .75;
  const skin = P.skin;
  // ear (mostly under the hair lock)
  celGroup(g, [path([[-10, 2], [-4, -1], [-1, 8], [-4, 18], [-10, 19], [-12, 10]])], skin, L, { lw });
  celGroup(g, [path(pts)], skin, L, { lw, xs: [path([[8, 36.5], [23, 40], [26, 46], [6, 46]])] });   // under-jaw cast shadow
  // mouth opening
  if ((m.open || 0) > 0.05) {
    const lo = pts[8], co = [26.5, 26.6];
    const MP = path([[31.4, 25.4], [32.4, 24.8], [lo[0] - .4, lo[1] - 1.2], co], true);
    g.fillStyle = P.mouth; g.fill(MP);
    if (m.teeth) { g.save(); g.clip(MP); g.fillStyle = P.teeth || '#fff'; g.fillRect(27, 24.4, 6, 2.6 * clamp(m.open * 2)); g.restore(); }
    iline(g, MP, skin.l, .9);
  } else iline(g, path([[31.5, 25.9], [28.6, 26.4], [27, 25.6]], false), skin.l, 1);
  // nostril + cheek blush
  iline(g, path([[31.8, 17.6], [33.6, 16.4]], false), skin.l, .8);
  if (f.blush) { g.fillStyle = rgba(P.blush, .35 * f.blush); g.beginPath(); g.ellipse(18, 15, 7, 3, 0, 0, TAU); g.fill(); }
  if (f.sweat) { g.fillStyle = rgba('#ffffff', .8); g.beginPath(); g.ellipse(14, -16, 1.6, 2.6, .3, 0, TAU); g.fill(); }
  eyeSide(g, P, 20.5, 3, 12, 11, f);
  brow(g, P, [14.5, -8 + (f.brow?.[0] || 0)], [27.5, -8.6 + (f.brow?.[1] || 0)], f.brow?.[2] ?? 1.6, .9);
  if (f.tear) { g.fillStyle = rgba('#dff4ff', .9); g.beginPath(); g.ellipse(25, 8 + f.tear * 6, 1.2, 1.8, 0, 0, TAU); g.fill(); }
  g.restore();
}

function eyeSide(g, P, cx, cy, w, h, f) {
  const open = clamp(f.open ?? 1, 0, 1.2), lid = f.lid || 0, lash = P.lash;
  const topY = cy - h * .5 * open + lid * h * .32, front = cx + w * .5, back = cx - w * .5;
  const botY = cy + h * .42 - (f.smileEyes ? h * .24 : 0);
  if (open > .1) {
    const WP = path([[back, cy - h * .1, 1], [cx - w * .05, topY], [front, cy + h * .08, 1], [cx + w * .05, botY]], true);
    g.save(); g.clip(WP); g.fillStyle = P.white_eye; g.fill(WP);
    const lx = (f.look?.[0] || 0) * w * .12, ly = (f.look?.[1] || 0) * h * .14;
    const ix = cx + w * .2 + lx, iy = cy + h * .12 + ly, iw = w * .22, ih = h * .44;
    g.fillStyle = P.eye.f; g.beginPath(); g.ellipse(ix, iy, iw, ih, 0, 0, TAU); g.fill();
    g.fillStyle = P.eye.s; g.fillRect(ix - iw, iy - ih, iw * 2, ih);
    g.fillStyle = mix(P.eye.s, lash, .5); g.fillRect(ix - iw, iy - ih, iw * 2, ih * .4);
    g.fillStyle = P.eye.h; g.beginPath(); g.ellipse(ix, iy + ih * .92, iw, ih * .5, 0, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ix - iw * .2, iy - ih * .3, iw * .42, ih * .22, 0, 0, TAU); g.fill();
    if (f.glint) { g.fillStyle = rgba('#ffffff', f.glint); g.beginPath(); g.arc(ix + iw * .3, iy + ih * .3, iw * .25, 0, TAU); g.fill(); }
    g.fillStyle = rgba(P.skin.s, .5); g.fillRect(back - 2, topY - 2, w + 4, h * .18);   // lid shadow on the eyeball
    g.restore();
    const t = h * .2;
    celGroup(g, [path([[back - w * .3, cy - h * .32 - t, 1], [cx - w * .1, topY - t * .7], [front + w * .06, cy + h * .04, 1], [cx - w * .08, topY + t * .45], [back, cy - h * .05, 1]])], { f: lash }, {}, { noLine: true });
    celGroup(g, [path([[back - w * .05, cy - h * .22, 1], [back - w * .55, cy - h * .5, 1], [back - w * .02, cy - h * .1, 1]])], { f: lash }, {}, { noLine: true });
    iline(g, path([[cx - w * .15, botY + .4], [front - w * .12, cy + h * .28]], false), mix(P.skin.l, P.skin.f, .3), .8);
    iline(g, path([[back + w * .05, topY - h * .16], [cx + w * .2, topY - h * .24]], false), mix(P.skin.l, P.skin.f, .35), .7);
  } else {
    celGroup(g, [path([[back - w * .3, cy - h * .1, 1], [cx, cy + h * .2], [front, cy + h * .1, 1], [cx, cy + h * .3], [back, cy + h * .05, 1]])], { f: lash }, {}, { noLine: true });
  }
}

function brow(g, P, a, c, arch, th = 1) {
  const m = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2 - arch];
  celGroup(g, [path([[a[0], a[1] - .9 * th, 1], [m[0], m[1] - 1.1 * th], [c[0], c[1] - .1, 1], [m[0], m[1] + .8 * th], [a[0], a[1] + .9 * th, 1]])], { f: P.lash }, {}, { noLine: true });
}

// ———————————————————————————————— 3/4 VIEW ————————————————————————————————
const Q34 = [
  [-33, -8], [-33, 9], [-27, 22], [-13, 33], [2, 39.5],          // near side: temple → near jaw → near chin side
  [10, 42, 1],                                                     // 5 chin
  [19, 36.5], [25, 25], [27.2, 14.5], [30.2, 4.2],                // 6..9 far jaw → far cheek → cheekbone turn
  [29, -9], [25, -26], [9, -38.5], [-14, -38.5], [-30, -24],
];
export function head34(g, P, C, A, f, L, o = {}) {
  const m = mouthOf(f), jaw = (m.open || 0);
  const pts = Q34.map((p, i) => {
    let q = [p[0], p[1]];
    if (i >= 3 && i <= 7) { const k = i === 5 ? 1 : i === 4 || i === 6 ? .8 : .35; q[1] += jaw * 4.2 * k; }
    return p[2] ? [...q, 1] : q;
  });
  g.save(); g.translate(C[0], C[1]); g.rotate(A);
  const lw = (o.lw ?? 2.1) * .75, skin = P.skin;
  celGroup(g, [path(pts)], skin, L, { lw, xs: f.noseShadow === false ? [] : [path([[14.5, 3], [17.6, 15.6], [15, 16.8], [13.2, 10]])] });
  // nose: shadow plane on the near side of the bridge + one stroke + tip
  iline(g, path([[17.6, 15.8], [20.6, 17.2], [21.6, 16.2]], false), skin.l, .95);
  // blush (one faint layer)
  if (f.blush) {
    g.fillStyle = rgba(P.blush, .32 * f.blush);
    g.beginPath(); g.ellipse(-8, 15, 8, 3.4, -.05, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(23.5, 14, 3.6, 2.8, 0, 0, TAU); g.fill();
  }
  mouth34(g, P, 14.2, 27 + jaw * 1.2, 13, m, skin);
  const E = { ...f };
  eye34(g, P, -4.5, 2, 22, 15.5, -1, 1, E);                 // near eye (outer corner toward the near ear)
  eye34(g, P, 19.6, 1.5, 13.5, 14.5, 1, .62, E);            // far eye, foreshortened
  const bd = f.brow || [0, 0, 1.6];
  brow(g, P, [3.5, -9 + bd[0]], [-14.5, -8.4 + bd[1]], bd[2], 1.05);   // near brow: inner end near the nose
  brow(g, P, [13.5, -9.3 + bd[0]], [24.5, -7.2 + bd[1] * .8], bd[2] * .7, .85);
  if (f.sweat) { g.fillStyle = rgba('#ffffff', .85); g.beginPath(); g.ellipse(-20, -14, 1.6, 2.8, .3, 0, TAU); g.fill(); }
  if (f.tear) { g.fillStyle = rgba('#dff4ff', .9); g.beginPath(); g.ellipse(-2, 10 + f.tear * 8, 1.3, 2, 0, 0, TAU); g.fill(); }
  g.restore();
}

function mouth34(g, P, cx, cy, w, m, skin) {
  const ww = w * (m.wide || 1), L = cx - ww * .55, R = cx + ww * .45;
  const open = m.open || 0;
  if (open < .06) {
    const up = m.smile ? -2.2 * m.smile : 0;
    iline(g, path([[L, cy + up * .6], [cx - ww * .1, cy + .4], [cx + ww * .12, cy + .2], [R, cy + up]], false), skin.l, m.press ? 1.35 : 1.05);
    iline(g, path([[cx - ww * .14, cy + 4.6], [cx + ww * .14, cy + 4.6]], false), mix(skin.l, skin.f, .55), .75);
    return;
  }
  const h = 2 + open * 10, rd = m.round || 0;
  const l2 = L + rd * ww * .18, r2 = R - rd * ww * .16;
  const top = m.smile ? -1.5 : -1;
  const MP = path([[l2, cy, 1], [cx - ww * .05, cy + top], [r2, cy, 1], [cx + ww * .12 * (1 - rd * .4), cy + h * .85], [cx - ww * .04, cy + h], [cx - ww * .2 * (1 - rd * .4), cy + h * .8]], true);
  g.save(); g.clip(MP); g.fillStyle = P.mouth; g.fill(MP);
  if (m.tongue) { g.fillStyle = P.tongue; g.beginPath(); g.ellipse(cx, cy + h + 1, ww * .3, 3.4, 0, 0, TAU); g.fill(); }
  if (m.teeth) { g.fillStyle = P.teeth || '#fff'; g.fillRect(cx - ww, cy - 4, ww * 2, 3.6 + (m.fv ? 2 : 0)); }
  g.restore();
  iline(g, MP, skin.l, 1.05);
  iline(g, path([[cx - ww * .12, cy + h + 4], [cx + ww * .12, cy + h + 4]], false), mix(skin.l, skin.f, .55), .75);
}

// dir: -1 = outer corner to the left (near eye of a face looking right), +1 = to the right. fs = foreshortening (width scale)
function eye34(g, P, cx, cy, w, h, dir, fs, f) {
  const open = clamp(f.open ?? 1, 0, 1.25), lid = f.lid || 0, W2 = w / 2, lash = P.lash;
  const X = u => cx + dir * u * W2;
  const inY = cy + h * .12, outY = cy - h * .06 - (f.smileEyes ? h * .05 : 0);
  const topY = cy - h * .5 * open + lid * h * .32;
  const botY = cy + h * .46 * Math.min(1, open + .3) - (f.smileEyes ? h * .28 : 0);
  if (open > .1) {
    const WP = path([[X(-1), inY, 1], [X(-.4), topY + h * .06], [X(.3), topY], [X(1), outY, 1], [X(.45), botY], [X(-.4), botY - h * .02]], true);
    g.save(); g.clip(WP); g.fillStyle = P.white_eye; g.fill(WP);
    g.fillStyle = mix(P.white_eye, P.skin.s, .55); g.fillRect(cx - w, topY - 6, w * 2, h * .24 + 6);
    const sc = f.iris || 1, iw = w * .27 * sc * (fs < 1 ? .95 : 1), ih = h * .47 * sc;
    const ix = cx + dir * W2 * .02 * (fs < 1 ? -3 : 1) + (f.look?.[0] || 0) * w * .16, iy = cy + h * .1 + (f.look?.[1] || 0) * h * .16;
    const IR = new Path2D(); IR.ellipse(ix, iy, iw, ih, 0, 0, TAU);
    g.fillStyle = P.eye.f; g.fill(IR);
    g.save(); g.clip(IR);
    g.fillStyle = P.eye.s; g.fillRect(ix - iw, iy - ih, iw * 2, ih * .95);
    g.fillStyle = mix(P.eye.s, lash, .5); g.fillRect(ix - iw, iy - ih, iw * 2, ih * .38);
    g.fillStyle = mix(P.eye.l, lash, .3); g.beginPath(); g.ellipse(ix, iy - ih * .02, iw * .44, ih * .5, 0, 0, TAU); g.fill();
    g.fillStyle = P.eye.h; g.beginPath(); g.ellipse(ix, iy + ih * .9, iw * 1.05, ih * .5, 0, 0, TAU); g.fill();
    g.fillStyle = mix(P.eye.h, '#ffffff', .4); g.beginPath(); g.ellipse(ix, iy + ih * 1.05, iw * .7, ih * .3, 0, 0, TAU); g.fill();
    if (f.reflect) { g.strokeStyle = rgba(f.reflect, .8); g.lineWidth = iw * .2; g.beginPath(); g.arc(ix, iy, ih * .7, .3, 1.4); g.stroke(); }
    g.restore();
    g.strokeStyle = mix(P.eye.l, lash, .5); g.lineWidth = .9; g.stroke(IR);
    g.fillStyle = '#ffffff';
    g.beginPath(); g.ellipse(ix + iw * .32, iy - ih * .34, iw * .4, ih * .26, -.5, 0, TAU); g.fill();
    g.beginPath(); g.arc(ix - iw * .4, iy + ih * .36, iw * .18, 0, TAU); g.fill();
    if (f.glint) { g.globalAlpha = f.glint; g.beginPath(); g.moveTo(ix + iw * .3, iy - ih * .9); g.lineTo(ix + iw * .38, iy - ih * .4); g.lineTo(ix + iw * .3, iy + ih * .1); g.lineTo(ix + iw * .22, iy - ih * .4); g.fill(); g.globalAlpha = 1; }
    g.restore();
    iline(g, path([[X(.95), outY + h * .14], [X(.5), botY + 1], [X(.05), botY + 1.4]], false), mix(P.skin.l, P.skin.f, .35), .75);
  }
  const t = h * .2;
  if (open > .1) {
    celGroup(g, [path([[X(-1.03), inY + 1, 1], [X(-.4), topY + h * .06 - t * .55], [X(.3), topY - t * .75], [X(.95), outY - t], [X(1.28), outY - t * 2.1, 1],
      [X(1.03), outY + t * .5], [X(.3), topY + t * .45], [X(-.4), topY + h * .06 + t * .35], [X(-.98), inY + t * .6, 1]])], { f: lash }, {}, { noLine: true });
    for (let k = 0; k < 3; k++) {
      const u = .58 + k * .19, bx = X(u), by = topY + (outY - topY) * ((u - .3) / .7) - t * .5;
      celGroup(g, [path([[bx - dir * 1.6, by, 1], [bx + dir * (3.4 + k * 2.6), by - h * (.15 + k * .05), 1], [bx + dir * 2.4, by + .8, 1]])], { f: lash }, {}, { noLine: true });
    }
    iline(g, path([[X(-.25), topY - h * .2], [X(.45), topY - h * .24], [X(1), outY - h * .3]], false), mix(P.skin.l, P.skin.f, .3), .8);
  } else {
    celGroup(g, [path([[X(-1), inY, 1], [X(0), cy + h * .22], [X(1.05), outY + h * .05], [X(1.24), outY - t, 1], [X(1), outY + t * .8], [X(0), cy + h * .22 + t * .8], [X(-.98), inY + t * .5, 1]])], { f: lash }, {}, { noLine: true });
  }
}
