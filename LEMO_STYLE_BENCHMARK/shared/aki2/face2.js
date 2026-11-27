// AKI v2 — refined head construction (LEMO_STYLE_BENCHMARK character bible). One set of proportions, four views.
// Head = 80 u (crown −42, eye line ±0, nose tip +16, mouth +25.5, chin +38.5). Faces +x in 3/4 and profile.
// Design intent: an elegant late-80s cinematic OVA face — narrower almond eyes (not "big anime eyes"), an upper lid that
// thickens to the outer corner and covers the top of the iris, a layered iris with a limbal ring, tapered arched brows,
// a nose drawn as planes, lips with a light cupid's bow, a visible hairline with a side part.
import { path, mix, rgba, TAU } from '../lib/cel.js';
import { celGroup, iline } from '../lib/celgroup.js';
import { clamp, lerp } from '../lib/util.js';

export const VIS = {
  X: { open: 0, wide: 1 }, M: { open: 0, wide: .94, press: 1 }, A: { open: .8, wide: 1.02, teeth: 1, tongue: 1 }, E: { open: .38, wide: 1.16, teeth: 1 },
  I: { open: .26, wide: 1.12, teeth: 1 }, O: { open: .6, wide: .72, round: 1 }, U: { open: .26, wide: .6, round: 1 }, F: { open: .1, wide: 1, teeth: 1, fv: 1 },
  L: { open: .42, wide: 1, teeth: 1, tongue: 1 }, pant: { open: .5, wide: 1.02, teeth: 1, tongue: 1 }, smile: { open: 0, wide: 1.08, smile: 1 },
  smileopen: { open: .32, wide: 1.12, smile: 1, teeth: 1 }, soft: { open: 0, wide: .96, smile: .25 }, sad: { open: 0, wide: .9, smile: -.6 },
};
const mo = f => (typeof f.mouth === 'string' ? VIS[f.mouth] : f.mouth) || VIS.X;
const L0 = (P) => mix(P.skin.l, P.skin.f, .35);           // soft skin detail line

// ————————————————— the eye —————————————————
// o: cx, cy, w (corner to corner), h (max opening), dir (+1 outer corner toward +x), sq (foreshortening 0.4…1),
//    open, lid, look:[x,y], iris (scale), smile (lower lid up), glint, lx (light from −1 left … +1 right), k (line scale)
export function eye2(g, P, o) {
  const { cx, cy, w, h } = o, dir = o.dir ?? 1, sq = o.sq ?? 1, k = o.k ?? 1;
  const open = clamp(o.open ?? 1, 0, 1.25), lid = o.lid || 0, sm = o.smile || 0;
  const W2 = w / 2 * sq, X = u => cx + dir * u * W2;
  const tilt = h * .14;                                                     // outer corner slightly higher: an elegant up-sweep
  const inY = cy + h * .1, outY = cy - tilt;
  const topPk = cy - h * .55 * open + lid * h * .4, botPk = cy + h * .42 * Math.min(1, open + .35) - sm * h * .3;
  const lash = P.lash;
  if (open > .12) {
    const WP = path([[X(-1), inY, 1], [X(-.55), lerp(inY, topPk, .85)], [X(-.1), topPk], [X(.5), lerp(topPk, outY, .45)], [X(1), outY, 1],
      [X(.6), lerp(botPk, outY, .55)], [X(.05), botPk], [X(-.6), lerp(botPk, inY, .5)]], true);
    g.save(); g.clip(WP);
    g.fillStyle = P.white_eye; g.fill(WP);
    g.fillStyle = mix(P.white_eye, P.skin.s, .5); g.fillRect(cx - w, topPk - 4, w * 2, h * .32 + 4);          // the lid casts a shadow on the eyeball
    g.fillStyle = rgba(P.skin.s, .25); g.beginPath(); g.ellipse(X(-1), cy, W2 * .35, h, 0, 0, TAU); g.fill();   // inner corner shade
    const sc = o.iris ?? 1, ir = w * .2 * sc * (.75 + .25 * sq), iv = h * .62 * sc;
    const lk = o.look || [0, 0], ix = cx + dir * W2 * (sq < .9 ? -.06 : .02) + lk[0] * W2 * .42, iy = cy + h * .06 + lk[1] * h * .22;
    const IR = new Path2D(); IR.ellipse(ix, iy, ir, iv, 0, 0, TAU);
    g.fillStyle = P.eye.f; g.fill(IR);
    g.save(); g.clip(IR);
    g.fillStyle = P.eye.s; g.fillRect(ix - ir, iy - iv, ir * 2, iv * .95);                                         // upper half in shade
    g.fillStyle = mix(P.eye.s, lash, .55); g.fillRect(ix - ir, iy - iv, ir * 2, iv * .42);                         // darkest band under the lid
    g.fillStyle = mix(P.eye.l, lash, .35); g.beginPath(); g.ellipse(ix, iy + iv * .02, ir * .42, iv * .44, 0, 0, TAU); g.fill();   // pupil
    g.fillStyle = P.eye.h; g.beginPath(); g.ellipse(ix, iy + iv * .86, ir * 1.02, iv * .46, 0, 0, TAU); g.fill();             // lower crescent
    g.strokeStyle = rgba(mix(P.eye.h, '#ffffff', .3), .55); g.lineWidth = .55 * k;                                 // fine radial flecks
    for (let a = .2; a < Math.PI - .2; a += .42) { g.beginPath(); g.moveTo(ix + Math.cos(a) * ir * .5, iy + Math.sin(a) * iv * .5); g.lineTo(ix + Math.cos(a) * ir * .86, iy + Math.sin(a) * iv * .86); g.stroke(); }
    if (o.reflect) { g.strokeStyle = rgba(o.reflect, .75); g.lineWidth = ir * .16; g.beginPath(); g.arc(ix, iy, iv * .7, .25, 1.35); g.stroke(); }
    g.restore();
    g.strokeStyle = mix(P.eye.l, lash, .5); g.lineWidth = .9 * k; g.stroke(IR);                                    // limbal ring
    const lx = o.lx ?? .6;
    g.fillStyle = '#ffffff';
    g.beginPath(); g.ellipse(ix + lx * ir * .38, iy - iv * .32, ir * .36, iv * .2, -.45 * Math.sign(lx || 1), 0, TAU); g.fill();
    g.beginPath(); g.arc(ix - lx * ir * .42, iy + iv * .3, ir * .13, 0, TAU); g.fill();
    if (o.glint) { g.globalAlpha = o.glint; g.beginPath(); g.moveTo(ix + ir * .25, iy - iv * .95); g.lineTo(ix + ir * .33, iy - iv * .45); g.lineTo(ix + ir * .25, iy + iv * .05); g.lineTo(ix + ir * .17, iy - iv * .45); g.fill(); g.globalAlpha = 1; }
    g.restore();
    // lower lid: a fine partial line on the outer half + two short lashes
    iline(g, path([[X(.95), outY + h * .16], [X(.55), lerp(botPk, outY, .45) + .4], [X(.05), botPk + .4]], false), L0(P), .7 * k);
    for (const u of [.55, .8]) iline(g, path([[X(u), lerp(botPk, outY, u * .7) + 1], [X(u + .06), lerp(botPk, outY, u * .7) + 2.6]], false), mix(lash, P.skin.f, .3), .55 * k);
    // upper lid: a tapered dark line, thin at the inner corner, thickest at the outer third, ending in a short flick
    const t0 = .5 * k, t1 = h * .24;
    const up = [[X(-1.02), inY, 1], [X(-.55), lerp(inY, topPk, .85) - t0], [X(-.1), topPk - t1 * .55], [X(.5), lerp(topPk, outY, .45) - t1], [X(1.02), outY - t1 * .8], [X(1.15), outY - t1 * 1.2, 1],
      [X(1.06), outY + t1 * .2], [X(.5), lerp(topPk, outY, .45) + t1 * .15], [X(-.1), topPk + t1 * .1], [X(-.55), lerp(inY, topPk, .85) + t0 * .6], [X(-.98), inY + t0, 1]];
    celGroup(g, [path(up)], { f: lash }, {}, { noLine: true });
    for (let i = 0; i < 2; i++) {                                                       // two fine lashes at the outer end
      const u = .7 + i * .2, bx = X(u), by = lerp(topPk, outY, (u + .1) / 1.1) - t1 * .9;
      celGroup(g, [path([[bx - dir * .7, by + .5, 1], [bx + dir * (2.2 + i * 1.5), by - h * (.15 + i * .05), 1], [bx + dir * 1.0, by + .7, 1]])], { f: lash }, {}, { noLine: true });
    }
    iline(g, path([[X(-.45), topPk - h * .3 - lid * h * .1], [X(.25), topPk - h * .36], [X(.95), outY - h * .42]], false), L0(P), .65 * k);   // lid crease
  } else {                                                                              // closed eye: one curved lash line with a tiny flick
    const yb = cy + h * .12 + (o.smileClosed ? -h * .12 : 0), dy = o.smileClosed ? -h * .25 : h * .14;
    celGroup(g, [path([[X(-1), yb, 1], [X(0), yb + dy], [X(1.02), outY + h * .05, 1], [X(1.2), outY - h * .2, 1], [X(.98), outY + h * .2], [X(0), yb + dy + .9 * k], [X(-.98), yb + .6 * k, 1]])], { f: lash }, {}, { noLine: true });
    for (const u of [.5, .78]) iline(g, path([[X(u), yb + dy * (1 - u) + .6], [X(u + .05), yb + dy * (1 - u) + 2.4]], false), lash, .5 * k);
  }
}
export function brow2(g, P, x0, y0, x1, y1, arch, th = 1, k = 1) {   // inner end (x0,y0) thicker, tapering outward, arch peak at 2/3
  const mx = lerp(x0, x1, .62), my = lerp(y0, y1, .62) - arch;
  celGroup(g, [path([[x0, y0 - 1.1 * th, 1], [mx, my - .9 * th], [x1, y1, 1], [mx, my + .55 * th], [x0, y0 + 1.1 * th, 1]])], { f: mix(P.lash, P.hair.f, .35) }, {}, { noLine: true });
}
export function mouth2(g, P, cx, cy, w, f, sq = 1, k = 1) {
  const m = mo(f), open = m.open || 0, ww = w * (m.wide || 1) * sq, sm = m.smile || 0;
  const Lx = cx - ww * .55, Rx = cx + ww * .45, lip = mix(P.mouth, P.skin.f, .55);
  if (open < .06) {
    const up = -2.2 * sm;
    g.fillStyle = rgba(lip, .35); g.beginPath(); g.ellipse(cx, cy + 3.2, ww * .22, 1.6, 0, 0, TAU); g.fill();       // lower-lip tint
    iline(g, path([[Lx, cy + up * .7], [cx - ww * .14, cy + .5], [cx - ww * .02, cy + .1], [cx + ww * .08, cy + .55], [Rx, cy + up]], false), P.skin.l, (m.press ? 1.25 : .95) * k);
    iline(g, path([[cx - ww * .1, cy + 4.6], [cx + ww * .12, cy + 4.6]], false), L0(P), .6 * k);
    for (const [x, s] of [[Lx, -1], [Rx, 1]]) iline(g, path([[x, cy + up * (s < 0 ? .7 : 1)], [x + s * .8, cy + up * (s < 0 ? .7 : 1) - .8 - sm]], false), P.skin.l, .7 * k);
    return;
  }
  const h = 2 + open * 9.5, rd = m.round || 0, l2 = Lx + rd * ww * .16, r2 = Rx - rd * ww * .15;
  const MP = path([[l2, cy, 1], [cx - ww * .12, cy - .9 - sm * .4], [cx, cy - .4], [cx + ww * .1, cy - .9 - sm * .4], [r2, cy, 1], [cx + ww * .14 * (1 - rd * .4), cy + h * .85], [cx, cy + h], [cx - ww * .16 * (1 - rd * .4), cy + h * .82]], true);
  g.save(); g.clip(MP); g.fillStyle = P.mouth; g.fill(MP);
  if (m.tongue) { g.fillStyle = P.tongue; g.beginPath(); g.ellipse(cx, cy + h + .8, ww * .28, 3.1, 0, 0, TAU); g.fill(); }
  if (m.teeth) { g.fillStyle = P.teeth || '#fff'; g.fillRect(cx - ww, cy - 4, ww * 2, 3.2 + (m.fv ? 2 : 0)); }
  g.restore(); iline(g, MP, P.skin.l, .9 * k);
  iline(g, path([[cx - ww * .1, cy + h + 3.6], [cx + ww * .12, cy + h + 3.6]], false), L0(P), .6 * k);
}

// ————————————————— FRONT —————————————————
const FRONT = s => [[s * 27, -30], [s * 31, -12], [s * 31.6, 2], [s * 29.6, 14], [s * 25, 24.5], [s * 14.5, 33.5], [s * 5, 37.8]];
export function headFront(g, P, C, A, f, L, o = {}) {
  const m = mo(f), jaw = (m.open || 0) * 3.4, k = o.k ?? 1;
  const J = ([x, y]) => [x, y + (y > 20 ? jaw * (y - 20) / 18 : 0)];
  const face = path([...FRONT(-1).map(J), [0, 38.6 + jaw], ...FRONT(1).reverse().map(J), [0, -42]]);
  g.save(); g.translate(C[0], C[1]); g.rotate(A);
  const lx = Math.sign((L.sh || [1])[0]) * -1;                                           // light comes from the side opposite the shadow offset
  celGroup(g, [face], P.skin, L, { lw: (o.lw ?? 2.1) * .75, xs: [path([[-12 * lx, 31], [0, 38 + jaw], [14 * lx, 31], [0, 46]])] });
  // nose: shadow plane on the shaded side + under-tip line + nostrils
  const sd = lx > 0 ? -1 : 1;
  g.fillStyle = rgba(P.skin.s, .7); g.beginPath(); g.moveTo(sd * 1.2, 2); g.quadraticCurveTo(sd * 3.6, 10, sd * 3.2, 15.5); g.lineTo(sd * .6, 16.3); g.quadraticCurveTo(sd * 1.6, 9, sd * .2, 2.5); g.fill();
  iline(g, path([[-2.4, 17], [0, 17.8], [2.6, 17]], false), P.skin.l, .8 * k);
  g.fillStyle = mix(P.skin.l, P.skin.s, .4); for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 2.4, 16.6, .9, .55, s * .4, 0, TAU); g.fill(); }
  if (f.blush) { g.fillStyle = rgba(P.blush, .28 * f.blush); for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 19, 12.5, 6.5, 2.6, 0, 0, TAU); g.fill(); } }
  mouth2(g, P, 0, 25.5 + jaw * .5, 13, f, 1, k);
  const E = f, b = f.brow || [0, 0, 1.6];
  eye2(g, P, { cx: -17.5, cy: 1, w: 19, h: 9.5, dir: -1, open: E.open, lid: E.lid, look: E.look, iris: E.iris, smile: E.smileEyes ? 1 : 0, smileClosed: E.smileClosed, glint: E.glint, lx, reflect: E.reflect, k });
  eye2(g, P, { cx: 17.5, cy: 1, w: 19, h: 9.5, dir: 1, open: E.open, lid: E.lid, look: E.look, iris: E.iris, smile: E.smileEyes ? 1 : 0, smileClosed: E.smileClosed, glint: E.glint, lx, reflect: E.reflect, k });
  brow2(g, P, -8.5, -9.8 + b[0], -28, -10.5 + b[1], b[2] + 1.2, 1, k); brow2(g, P, 8.5, -9.8 + b[0], 28, -10.5 + b[1], b[2] + 1.2, 1, k);
  if (f.sweat) { g.fillStyle = rgba('#ffffff', .85); g.beginPath(); g.ellipse(24, -18, 1.4, 2.4, .3, 0, TAU); g.fill(); }
  if (f.tear) { g.fillStyle = rgba('#dff4ff', .9); g.beginPath(); g.ellipse(-12, 8 + f.tear * 7, 1.2, 1.9, 0, 0, TAU); g.fill(); }
  g.restore();
}

// ————————————————— 3/4 (facing +x) —————————————————
const Q34 = [[-33, -8], [-33.5, 8], [-28, 21], [-15, 32.5], [1, 38.6], [9, 39.8, 1], [17.5, 35], [23.5, 25], [26.4, 14.5], [29.6, 4.5], [28.4, -9], [25, -26], [9, -38.5], [-14, -38.5], [-30, -24]];
export function head34v2(g, P, C, A, f, L, o = {}) {
  const m = mo(f), jaw = (m.open || 0), k = o.k ?? 1;
  const pts = Q34.map((p, i) => { const q = [p[0], p[1]]; if (i >= 3 && i <= 7) q[1] += jaw * 3.8 * (i === 5 ? 1 : i === 4 || i === 6 ? .8 : .35); return p[2] ? [...q, 1] : q; });
  g.save(); g.translate(C[0], C[1]); g.rotate(A);
  celGroup(g, [path(pts)], P.skin, L, { lw: (o.lw ?? 2.1) * .75, xs: [path([[-28, 21], [-15, 32.5], [1, 38.6], [-8, 44], [-30, 34]])] });
  // nose: far-side bridge line, tip, under-tip, nostril, and the shadow plane on the near side
  g.fillStyle = rgba(P.skin.s, .55); g.beginPath(); g.moveTo(13, 2); g.quadraticCurveTo(15.2, 10, 15.6, 15.8); g.lineTo(13.6, 16.6); g.quadraticCurveTo(13.8, 9, 12, 3); g.fill();
  iline(g, path([[17.2, 3], [19.6, 11], [21.4, 15.4]], false), L0(P), .7 * k);
  iline(g, path([[16.2, 17.4], [19.6, 18.2], [21.6, 16.6]], false), P.skin.l, .85 * k);
  g.fillStyle = mix(P.skin.l, P.skin.s, .4); g.beginPath(); g.ellipse(17.6, 17.2, .9, .5, .3, 0, TAU); g.fill();
  if (f.blush) { g.fillStyle = rgba(P.blush, .28 * f.blush); g.beginPath(); g.ellipse(-8, 14, 7.5, 3, -.05, 0, TAU); g.fill(); g.beginPath(); g.ellipse(23.5, 13.5, 3.2, 2.4, 0, 0, TAU); g.fill(); }
  mouth2(g, P, 14.6, 26.6 + jaw * 1.1, 12.5, f, .92, k);
  const E = f, b = f.brow || [0, 0, 1.6], lx = .6;
  eye2(g, P, { cx: -4.2, cy: 1.6, w: 19.5, h: 9.8, dir: -1, sq: 1, open: E.open, lid: E.lid, look: E.look, iris: E.iris, smile: E.smileEyes ? 1 : 0, smileClosed: E.smileClosed, glint: E.glint, lx, reflect: E.reflect, k });
  eye2(g, P, { cx: 20, cy: 1.2, w: 15, h: 9.3, dir: 1, sq: .66, open: E.open, lid: E.lid, look: E.look, iris: E.iris, smile: E.smileEyes ? 1 : 0, smileClosed: E.smileClosed, glint: E.glint, lx, reflect: E.reflect, k });
  brow2(g, P, 4.2, -8.8 + b[0], -15, -9.6 + b[1], b[2] + 1.2, 1.05, k);
  brow2(g, P, 14.2, -9.4 + b[0], 25.6, -7.8 + b[1] * .8, (b[2] + 1.2) * .7, .85, k);
  if (f.sweat) { g.fillStyle = rgba('#ffffff', .85); g.beginPath(); g.ellipse(-20, -15, 1.5, 2.6, .3, 0, TAU); g.fill(); }
  if (f.tear) { g.fillStyle = rgba('#dff4ff', .9); g.beginPath(); g.ellipse(-1, 9 + f.tear * 8, 1.2, 1.9, 0, 0, TAU); g.fill(); }
  g.restore();
}

// ————————————————— PROFILE (facing +x) —————————————————
const PROF = [[-36, -4], [-33, 16], [-22, 31], [-7, 30], [8, 36.5], [22.5, 40.2], [29.8, 35.4], [29.2, 31.4], [31.8, 28.3], [31.2, 26, 1],
  [32.6, 23.4], [30.9, 19.8, 1], [33.2, 18.3], [36.6, 15.2, 1], [32.4, 9.6], [29.6, 3.4], [30.6, -3.4], [30, -13], [24, -28], [10, -38], [-12, -38.5], [-30, -25]];
const JAW_PIVOT = [-6, 10];
export function headProfile2(g, P, C, A, f, L, o = {}) {
  const m = mo(f), jaw = (m.open || 0) * .16, k = o.k ?? 1;
  const pts = PROF.map((p, i) => {
    let q = [p[0], p[1]];
    if (i >= 4 && i <= 8) { const c = Math.cos(jaw), s = Math.sin(jaw), dx = q[0] - JAW_PIVOT[0], dy = q[1] - JAW_PIVOT[1]; q = [JAW_PIVOT[0] + dx * c - dy * s, JAW_PIVOT[1] + dx * s + dy * c]; }
    if (m.round && (i === 8 || i === 10)) q[0] += 1.5 * m.round;
    if (m.smile && i === 9) { q[0] -= 1; q[1] -= 1.2 * m.smile; }
    return p[2] ? [...q, 1] : q;
  });
  g.save(); g.translate(C[0], C[1]); g.rotate(A);
  const lw = (o.lw ?? 2.1) * .75;
  celGroup(g, [path([[-10, 2], [-4, -1], [-1, 8], [-4, 18], [-10, 19], [-12, 10]])], P.skin, L, { lw });
  celGroup(g, [path(pts)], P.skin, L, { lw, xs: [path([[8, 36.5], [22.5, 40.2], [25, 46], [6, 46]])] });
  if ((m.open || 0) > .05) {
    const lo = pts[8], MP = path([[31.1, 25.4], [32.2, 24.8], [lo[0] - .4, lo[1] - 1.2], [26.6, 26.6]], true);
    g.fillStyle = P.mouth; g.fill(MP); if (m.teeth) { g.save(); g.clip(MP); g.fillStyle = '#fff'; g.fillRect(27, 24.4, 6, 2.6 * clamp(m.open * 2)); g.restore(); }
    iline(g, MP, P.skin.l, .85 * k);
  } else iline(g, path([[31.2, 26], [28.6, 26.5], [27.2, 25.8]], false), P.skin.l, .9 * k);
  g.fillStyle = rgba(mix(P.mouth, P.skin.f, .55), .4); g.beginPath(); g.ellipse(31, 27.8, 1.6, 1.1, 0, 0, TAU); g.fill();   // lower-lip tint
  iline(g, path([[31.6, 17.6], [33.4, 16.4]], false), P.skin.l, .75 * k);
  if (f.blush) { g.fillStyle = rgba(P.blush, .32 * f.blush); g.beginPath(); g.ellipse(18, 14.5, 7, 3, 0, 0, TAU); g.fill(); }
  if (f.sweat) { g.fillStyle = rgba('#ffffff', .8); g.beginPath(); g.ellipse(14, -16, 1.5, 2.5, .3, 0, TAU); g.fill(); }
  // profile eye: an almond wedge with the iris at the front, the lash line sweeping back
  const E = f, open = clamp(E.open ?? 1, 0, 1.2), ex = 20.5, ey = 2.6, ew = 11.5, eh = 9.5;
  if (open > .12) {
    const top = ey - eh * .5 * open + (E.lid || 0) * eh * .32, bot = ey + eh * .4 - (E.smileEyes ? eh * .22 : 0);
    const WP = path([[ex - ew * .55, ey - eh * .08, 1], [ex - ew * .05, top], [ex + ew * .5, ey + eh * .05, 1], [ex + ew * .02, bot]], true);
    g.save(); g.clip(WP); g.fillStyle = P.white_eye; g.fill(WP);
    const lk = E.look || [0, 0], ix = ex + ew * .22 + lk[0] * ew * .1, iy = ey + eh * .1 + lk[1] * eh * .14;
    g.fillStyle = P.eye.f; g.beginPath(); g.ellipse(ix, iy, ew * .18, eh * .48, 0, 0, TAU); g.fill();
    g.fillStyle = P.eye.s; g.fillRect(ix - 4, iy - eh, 8, eh * .9); g.fillStyle = P.eye.h; g.beginPath(); g.ellipse(ix, iy + eh * .44, ew * .18, eh * .22, 0, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ix - 1, iy - eh * .25, ew * .08, eh * .12, 0, 0, TAU); g.fill();
    g.fillStyle = rgba(P.skin.s, .5); g.fillRect(ex - ew, top - 2, ew * 2, eh * .16);
    g.restore();
    const t = eh * .22;
    celGroup(g, [path([[ex - ew * .9, ey - eh * .38 - t, 1], [ex - ew * .1, top - t * .65], [ex + ew * .54, ey + eh * .02, 1], [ex - ew * .08, top + t * .4], [ex - ew * .55, ey - eh * .04, 1]])], { f: P.lash }, {}, { noLine: true });
    for (let i = 0; i < 2; i++) celGroup(g, [path([[ex - ew * (.5 + i * .18), ey - eh * (.28 + i * .05), 1], [ex - ew * (1.05 + i * .2), ey - eh * (.62 + i * .1), 1], [ex - ew * (.46 + i * .18), ey - eh * (.16 + i * .05), 1]])], { f: P.lash }, {}, { noLine: true });
    iline(g, path([[ex - ew * .2, bot + .3], [ex + ew * .38, ey + eh * .26]], false), L0(P), .65 * k);
    iline(g, path([[ex - ew * .45, top - eh * .2], [ex + ew * .15, top - eh * .3]], false), L0(P), .6 * k);
  } else celGroup(g, [path([[ex - ew * .8, ey - eh * .12, 1], [ex, ey + eh * .22], [ex + ew * .5, ey + eh * .1, 1], [ex, ey + eh * .3], [ex - ew * .55, ey + eh * .05, 1]])], { f: P.lash }, {}, { noLine: true });
  const b = f.brow || [0, 0, 1.6];
  brow2(g, P, 26.5, -8.4 + b[0], 13.5, -8.2 + b[1], b[2] + .8, .95, k);
  g.restore();
}

// ————————————————— BACK (the back of the head is hair; only the nape and the ears' edges show) —————————————————
export function headBack(g, P, C, A, L, o = {}) {
  g.save(); g.translate(C[0], C[1]); g.rotate(A);
  celGroup(g, [path([[-30, -6], [-32, 10], [-24, 30], [24, 30], [32, 10], [30, -6]])], P.skin, L, { lw: (o.lw ?? 2.1) * .75 });
  g.restore();
}
