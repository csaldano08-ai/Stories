// 017 · Ukiyo-e — the first 10 s of "Last Train Home" as four woodblock prints on one mounting scroll (lemo-opuscar
// styles/ukiyoe): washi paper, flat colour blocks printed slightly out of register, woodgrain, baren rubbing and goma-zuri
// specks on every block, a carved sumi key line, bokashi skies, rain as two sets of fine straight lines, paper as the white.
// Each shot is a complete print (double border, cartouche, seal); the cuts keep their times and are short handscroll slides
// across the mount (urgency). AKI's vermilion coat is the print's one rare red. Figures step at 7.5 drawings a second on a
// still sheet; in the slide that follows her she is printed on ones (a held figure under a moving sheet would slide).
// Engine copied unchanged from the style's demo (print.js). Page contract: window.render(t), DUR, READY, RIGQA.
import { W, H, PAL, mk, buildTextures, TX, carve, line, fillPath, bokashi, kasumi, smooth, poly, rgba, mix, dense } from './engine/print.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { lerp, seg, ss, eio, eo, back, hash, clamp, mulberry, vnoise } from './shared/lib/util.js';

const TAU = Math.PI * 2, cv = document.getElementById('c'), ctx = cv.getContext('2d');
await document.fonts.load('500 40px Shippori');
buildTextures();
// this film's pigment set (8 hues + paper): Prussian blue family, pale blue, sumi, beni (her coat: the one rare red), ochre, wood, plum-sumi hair, skin
const C = { prus: PAL.prus, prusD: PAL.prusD, prusL: PAL.prusL, ai: PAL.ai, sky: PAL.sky, skyL: PAL.skyL, sumi: PAL.sumi, sumiL: '#4a4540', beni: PAL.beni, beniL: PAL.beniL, ochre: PAL.ochre, ochreL: PAL.ochreL, wood: PAL.wood, woodD: PAL.woodD, hair: '#3a2836', skin: PAL.skin, cream: '#f3e7c6', plaster: '#b9b8ab' };

// ——— the run (shared rig) ———
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const X = t => RUN.pelvisAt(t)[0];
function poseAt(t) {
  const S = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  const w = clamp(up, 0, 1.1) * (1 - dn); S.watch = w;
  if (w > 0) { const J0 = solveProfile(S), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S.arms.f.sh *= 1 - .45 * wm; S.head += .26 * wm; S.neck += .08 * wm; }
  return S;
}

// ——— the scroll: four sheets on a tan mount, 260 px gaps ———
const K2 = .5, GAP = 260, S2X0 = X(2.8);
const W2 = Math.ceil((X(7.5) - S2X0) * K2) + 1920 + 60;
const SH = [{ x: 0, w: 1920, h: 1080 }, { x: 1920 + GAP, w: W2, h: 1080 }, { x: 1920 + GAP + W2 + GAP, w: 1920, h: 1080 }, { x: 1920 * 2 + GAP * 3 + W2, w: 1920, h: 1500 }];
const camS2 = t => SH[1].x + (X(t) - S2X0) * K2;
function camAt(t) {   // [x, y] of the view's top-left on the scroll; moves on ones
  if (t < 2.5) return [0, 0];
  if (t < 2.8) return [lerp(0, camS2(2.8), eio(seg(t, 2.5, 2.8))), 0];
  if (t < 7.5) return [camS2(t), 0];
  if (t < 7.78) return [lerp(camS2(7.5), SH[2].x, eio(seg(t, 7.5, 7.78))), 0];
  if (t < 9.375) return [SH[2].x, 0];
  if (t < 9.6) return [lerp(SH[2].x, SH[3].x, eio(seg(t, 9.375, 9.6))), 0];
  return [SH[3].x, 130 * eio(seg(t, 9.6, 10.4))];   // the tall last print: the view starts to tilt down it
}

// ——— blocks: 0 key (sumi), 1 blues, 2 secondary (ochre, wood, plaster), 3 reds / figure; each printed with its own registration ———
const BK = [mk(), mk(), mk(), mk()], BX = BK.map(c => c.getContext('2d')), REG = [[0, 0], [2.2, -1.3], [-1.8, 1.9], [1.5, 2.2]];
const tile = (x, img, ox, oy, a = 1, op = 'source-over') => { x.save(); x.globalAlpha = a; x.globalCompositeOperation = op; const gx = ((ox % W) + W) % W - W; for (let k = 0; k < 3; k++) x.drawImage(img, gx + k * W, oy, W, H); x.restore(); };
function inkifyAnchored(i, camX, camY) {   // woodgrain, baren and goma-zuri anchored to the scroll (they slide with the print)
  const x = BX[i], ox = -camX, oy = -camY;
  if (i > 0) { tile(x, TX.grain, ox, oy, i === 1 ? .15 : .11, 'source-atop'); tile(x, TX.baren, ox * 1.0, oy, i === 1 ? .24 : .3, 'destination-out'); }
  tile(x, TX.speck, ox, oy, i === 0 ? .12 : .3, 'destination-out');
}

// bokashi built per pixel like the engine's, but in the sheet's own coordinates (the engine's clamps to one screen; these sheets are longer/taller)
function bok(x, x0, y0, x1, y1, col, a0, a1, { rough = 22, seed = 3 } = {}) {
  const X0 = Math.floor(Math.min(x0, x1)), X1 = Math.ceil(Math.max(x0, x1)), Y0 = Math.floor(Math.min(y0, y1) - rough * 1.4), Y1 = Math.ceil(Math.max(y0, y1) + rough * 1.4);
  const w = Math.min(2200, X1 - X0), h = Math.min(1700, Y1 - Y0); if (w <= 0 || h <= 0) return;
  const c = mk(w, h), cx = c.getContext('2d'), id = cx.createImageData(w, h), d = id.data, A = [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)];
  for (let i = 0; i < w; i++) { const XX = X0 + i, off = (vnoise(XX * .006 + seed) - .5) * 2 * rough + (vnoise(XX * .03 + seed * 5) - .5) * rough * .35;
    for (let j = 0; j < h; j++) { let u = (Y0 + j - (y0 + off)) / (y1 - y0); u = u < 0 ? 0 : u > 1 ? 1 : u; const k = (j * w + i) * 4; d[k] = A[0]; d[k + 1] = A[1]; d[k + 2] = A[2]; d[k + 3] = (a0 + (a1 - a0) * u) * 255; } }
  cx.putImageData(id, 0, 0); x.drawImage(c, X0, Y0);
}
// ——— shapes ———
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const fillPoly = (x, p, col) => { x.fillStyle = col; x.beginPath(); poly(x, p); x.fill(); };
const keyRect = (x, x0, y0, x1, y1, w = 2.6, sd = 1) => { carve(x, [[x0, y0], [x1, y0]], w, { taper: [0, 0], seed: sd, jit: .2 }); carve(x, [[x1, y0], [x1, y1]], w, { taper: [0, 0], seed: sd + 1, jit: .2 }); carve(x, [[x1, y1], [x0, y1]], w, { taper: [0, 0], seed: sd + 2, jit: .2 }); carve(x, [[x0, y1], [x0, y0]], w, { taper: [0, 0], seed: sd + 3, jit: .2 }); };
function tube(pts, w0, w1) { const n = pts.length, L = [], R = []; for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d; const w = lerp(w0, w1, i / (n - 1)) / 2; L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]); } return [...L, ...R.reverse()]; }
function word(x, str, cx, cy, size, col = C.sumi, track = 4) { x.save(); x.font = `500 ${size}px Shippori`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.letterSpacing = `${track}px`; x.fillStyle = col; x.fillText(str, cx, cy); x.restore(); }
function rainLines(x, x0, y0, x1, y1, tD, n = 70, a = .5, len = 120) {   // two sets of fine straight lines at slightly different angles, redrawn 15 times a second
  const st = Math.floor(tD * 15 + 1e-6);
  for (const [ang, k0] of [[.16, 0], [.24, 500]]) { x.strokeStyle = rgba(C.sumi, a); x.lineWidth = 1.4; x.beginPath();
    for (let i = 0; i < n; i++) { const hx = hash(i * 3.7 + k0 + st * 1.31), hy = hash(i * 5.9 + k0 + st * .77), px = lerp(x0 - 200, x1, hx), py = lerp(y0 - len, y1, hy), L = len * (.6 + .8 * hash(i + k0));
      x.moveTo(px, py); x.lineTo(px - L * ang, py + L); } x.stroke(); }
}
function seal(x, cx, cy, size, p, seed = 3) {   // an original seal: a beni square with three rain strokes and a ring (a clock) left white
  if (p <= 0) return; const s = p < 1 ? lerp(1.35, 1, ss(clamp(p / .55))) : 1, R = mulberry(seed);
  x.save(); x.translate(cx, cy); x.scale(s, s); x.globalAlpha = clamp(p / .35) * .93;
  const t = mk(size + 12, size + 12), tx = t.getContext('2d'); tx.translate(6, 6); tx.fillStyle = C.beni; tx.beginPath(); poly(tx, [[R() * 2, R() * 2], [size - R() * 2, R() * 2.5], [size - R() * 2, size - R() * 2], [R() * 2.5, size - R() * 2]]); tx.fill();
  tx.globalCompositeOperation = 'destination-out'; tx.strokeStyle = '#000'; tx.lineCap = 'round'; tx.lineWidth = size * .08;
  tx.beginPath(); tx.arc(size * .62, size * .4, size * .2, 0, TAU); tx.stroke(); tx.beginPath(); tx.moveTo(size * .62, size * .4); tx.lineTo(size * .62, size * .26); tx.moveTo(size * .62, size * .4); tx.lineTo(size * .72, size * .44); tx.stroke();
  for (let k = 0; k < 3; k++) { tx.beginPath(); tx.moveTo(size * (.16 + k * .14), size * .58); tx.lineTo(size * (.1 + k * .14), size * .86); tx.stroke(); }
  for (let i = 0; i < size * 2; i++) { tx.globalAlpha = .15 + R() * .4; tx.beginPath(); tx.arc(R() * size, R() * size, .4 + R() * 1.2, 0, TAU); tx.fill(); }
  x.drawImage(t, -t.width / 2, -t.height / 2); x.restore();
}
function cartouche(x, x1, y0, series, title) {   // a horizontal cream slip with a pale beni tab (the print's caption), top right
  x.save(); x.font = '500 34px Shippori'; x.letterSpacing = '3px'; const tw = x.measureText(title).width; x.font = '500 22px Shippori'; const sw = x.measureText(series).width;
  const w = Math.max(tw, sw) + 56, h = 102, x0 = x1 - w;
  x.fillStyle = C.cream; x.fillRect(x0, y0, w, h); x.fillStyle = C.beniL; x.fillRect(x0, y0, w, 36);
  x.strokeStyle = C.sumi; x.lineWidth = 3; x.strokeRect(x0, y0, w, h); x.lineWidth = 1.2; x.strokeRect(x0 + 5, y0 + 5, w - 10, h - 10); x.beginPath(); x.moveTo(x0 + 5, y0 + 36); x.lineTo(x0 + w - 5, y0 + 36); x.stroke();
  x.restore(); word(x, series, x0 + w / 2, y0 + 19, 22, C.sumi, 5); word(x, title, x0 + w / 2, y0 + 70, 34, C.sumi, 3);
  return x0;
}

// ——— AKI as a flat printed figure: flat colour shapes (figure block) + a carved key line (key block) ———
function akiPrint(B, J, k, gx, gy, o = {}) {
  const P = p => [gx + p[0] * k, gy + p[1] * k], F = B[3], Kx = B[0], lw = 2.4 + 1.2 * k;
  // a front part hides the key lines of what is behind it (the key block is printed on top of every colour block)
  const hide = pts => { Kx.save(); Kx.globalCompositeOperation = 'destination-out'; Kx.fillStyle = '#000'; Kx.beginPath(); poly(Kx, pts); Kx.fill(); Kx.restore(); Kx.fillStyle = C.sumi; };
  const shape = (pts, col, sd, smoothK = 0) => { const q = smoothK ? dense(pts, smoothK, true) : pts; fillPoly(F, q, col); hide(q); carve(Kx, [...q, q[0]], lw, { taper: [0, 0], seed: sd, jit: .18, per: 1 }); };
  const limb = (a, b, c, w0, w1, col, sd) => shape(tube(dense([P(a), P(b), P(c)], 6), w0 * k, w1 * k), col, sd);
  // far arm, far leg, near leg (boots first: the trouser covers the boot's top)
  const af = J.arm.f; limb(af.sh, af.el, af.wr, 34, 28, mix(C.beni, C.sumi, .25), 10);
  for (const [kk, col, sd] of [['f', mix(C.sumiL, C.sumi, .4), 20], ['n', C.sumiL, 40]]) { const l = J.leg[kk], a = P(l.ankle), c = Math.cos(l.pitch), s = Math.sin(l.pitch);
    shape([[-16, -26], [-18, 14], [56, 18], [60, 6], [46, -4], [16, -10], [14, -26]].map(([u, v]) => [a[0] + (u * c - v * s) * k, a[1] + (u * s + v * c) * k]), C.woodD, sd + 5);
    limb(l.hip, l.knee, l.ankle, 46, 36, col, sd); }
  // the coat: one flat beni shape (no shading), the belt and two buttons in the key block
  const nb = J.neckBase, pv = J.pelvis, uL = J.uL, fL = J.fL, hb = o.hemB || [0, 0], T = (b, up, fw) => P([b[0] + uL[0] * up + fL[0] * fw, b[1] + uL[1] * up + fL[1] * fw]);
  const bk = T(pv, -80, -44); bk[0] += hb[0] * .6 * k; bk[1] += hb[1] * .6 * k;
  shape([T(nb, -2, 16), T(nb, -4, -18), T(nb, -18, -32), T(J.waist, 0, -34), bk, T(pv, -84, 42), T(J.waist, 0, 28), T(nb, -40, 30)], C.beni, 60, 3);
  carve(Kx, [T(J.waist, 2, -34), T(J.waist, 2, 28)], lw * 1.6, { taper: [0, 0], seed: 61 });
  shape([T(nb, 6, -18), T(nb, 10, 16), T(nb, -8, 22), T(nb, -10, -22)], C.cream, 62, 3);
  // neck, face (profile), hair (one flat plum-sumi shape with two strand lines), the eye in one stroke
  shape(tube([P(nb), P(J.neckTop)], 22 * k, 20 * k), C.skin, 63);
  const hc = [J.headC[0], J.headC[1] - 6], HR = ([u, v]) => { const c = Math.cos(J.headA), s = Math.sin(J.headA); return P([hc[0] + u * c - v * s, hc[1] + u * s + v * c]); }, Hp = pts => pts.map(HR);
  const lag = o.hairLag || [0, 0], lx = clamp(lag[0] * .35, -26, 6), ly = clamp(lag[1] * .3, -12, 12);
  shape(Hp([[0, -40], [26, -35], [40, -18], [44, -4], [51, 5], [44, 12], [42, 24], [30, 38], [10, 45], [-14, 41], [-30, 27], [-37, 4], [-30, -22], [-16, -36]]), C.skin, 64, 2);
  const hair = Hp([[12, -46], [-14, -50], [-38, -38], [-52, -10], [-54 + lx * .5, 22 + ly * .5], [-50 + lx, 54 + ly], [-34 + lx, 62 + ly], [-18 + lx * .6, 56 + ly * .6], [-12, 30], [-6, 8], [-10, -14], [8, -26], [26, -36], [44, -22], [46, -12], [30, -20], [12, -22]]);
  const hq = dense(hair, 2, true); fillPoly(F, hq, C.hair); hide(hq); carve(Kx, [...hq, hq[0]], lw, { taper: [0, 0], seed: 65, jit: .2, per: 1 });
  carve(Kx, Hp([[-20, -40], [-40, -4], [-38 + lx, 44 + ly]]), lw * .8, { seed: 66 }); carve(Kx, Hp([[0, -44], [-26, -10], [-22 + lx * .6, 40 + ly * .6]]), lw * .7, { seed: 67 });
  if (o.blink) carve(Kx, Hp([[19, -4], [31, -4]]), lw * 1.1, { seed: 68 });
  else if (o.take) { Kx.fillStyle = C.sumi; const e = HR([26, -5]); Kx.beginPath(); Kx.arc(e[0], e[1], 4.2 * k, 0, TAU); Kx.fill(); }
  else carve(Kx, Hp([[18, -7], [26, -8], [32, -4]]), lw * 1.5, { seed: 68, taper: [.2, .6] });
  carve(Kx, Hp(o.take ? [[14, -25], [24, -29], [34, -25]] : [[14, -16], [24, -19], [33, -16]]), lw * .9, { seed: 69 });
  // near arm over the coat, the mitten hand, the watch (ochre) on the left wrist
  const an = J.arm.n; limb(an.sh, an.el, an.wr, 36, 30, C.beni, 70);
  const d = Math.hypot(an.wr[0] - an.el[0], an.wr[1] - an.el[1]) || 1, ux = (an.wr[0] - an.el[0]) / d, uy = (an.wr[1] - an.el[1]) / d, hp = P([an.wr[0] + ux * 14, an.wr[1] + uy * 14]);
  const hand = []; for (let j = 0; j < 14; j++) { const a = j / 14 * TAU; hand.push([hp[0] + Math.cos(a) * 16 * k, hp[1] + Math.sin(a) * 15 * k]); } shape(hand, C.skin, 71);
  const wc = P([an.wr[0] - ux * 6, an.wr[1] - uy * 6]), wr = ((o.watch || 0) > .3 ? 12 : 9) * k, wpts = []; for (let j = 0; j < 12; j++) { const a = j / 12 * TAU; wpts.push([wc[0] + Math.cos(a) * wr, wc[1] + Math.sin(a) * wr]); }
  fillPoly(B[2], wpts, C.ochre); hide(wpts); carve(Kx, [...wpts, wpts[0]], lw * .8, { taper: [0, 0], seed: 72, per: 1 });
}

// ——— the four prints (each draws into the blocks, already offset to the sheet and clipped to its frame) ———
const FR = { x0: 44, y0: 38, x1: 1876, y1: 1042 };
function sheet1(B, t, tD) {   // I · the puddle: shop bases, wet paving, the puddle holding the two signs upside down, her legs
  const td = Math.floor(t * 7.5 + 1e-6) / 7.5 + 3 / 30;   // figures on fours (7.5 drawings a second)
  // the shopfronts behind (a dark night wall in Prussian, lit windows as ochre bokashi into paper)
  fillPoly(B[1], rect(0, 0, 1920, 640), C.ai);
  for (const [x0, w, wd, col] of [[90, 760, '24H', C.beniL], [960, 820, 'CAFE', C.ochre]]) {
    fillPoly(B[2], rect(x0, 60, x0 + w, 600), C.plaster);
    fillPoly(B[2], rect(x0 + 40, 220, x0 + w - 210, 600), C.ochreL); bok(B[2], x0 + 40, 600, x0 + w - 210, 330, C.cream, 1, 0, { rough: 18, seed: x0 });
    fillPoly(B[2], rect(x0 + w - 170, 250, x0 + w - 50, 640), C.woodD);
    fillPoly(B[3], rect(x0 + 60, 80, x0 + 380, 180), col); word(B[0], wd, x0 + 220, 132, 76, C.sumi, 6);
    keyRect(B[0], x0, 60, x0 + w, 640, 3, x0); keyRect(B[0], x0 + 40, 220, x0 + w - 210, 600, 2.6, x0 + 9); keyRect(B[0], x0 + 60, 80, x0 + 380, 180, 2.4, x0 + 17);
    carve(B[0], [[x0 + 40 + (w - 250) / 2, 222], [x0 + 40 + (w - 250) / 2, 598]], 2.4, { seed: x0 + 5 }); keyRect(B[0], x0 + w - 170, 250, x0 + w - 50, 640, 2.4, x0 + 25); }
  // the paving: flat wet bands of pale blue, joints as parallel slanted lines (never converging)
  fillPoly(B[1], rect(0, 640, 1920, 1080), C.skyL); bok(B[1], 0, 640, 1920, 900, C.sky, .9, 0, { rough: 20, seed: 7 });
  for (let k = 0; k < 10; k++) carve(B[0], [[60 + k * 200, 648], [-40 + k * 200, 1040]], 2, { seed: 30 + k, taper: [.1, .1] });
  carve(B[0], [[0, 642], [1920, 642]], 3.2, { taper: [0, 0], seed: 40 });
  // the puddle: paper-white water, the two signs upside down in pale pigment, ripples as key-line rings
  const px = 900 + 30 * 1.8, py = 905, pts = []; for (let k = 0; k < 40; k++) { const a = k / 40 * TAU, b = 1 + .08 * Math.sin(a * 2 + 1) + .05 * Math.sin(a * 5); pts.push([px + Math.cos(a) * 430 * b, py + Math.sin(a) * 82 * b]); }
  B[1].save(); B[1].globalCompositeOperation = 'destination-out'; B[1].beginPath(); poly(B[1], pts); B[1].fill(); B[1].restore();
  const wob = tD > EV.splash ? 26 * Math.exp(-(tD - EV.splash) / .5) * Math.sin(tD * 31) : 0;
  for (const B_ of [B[2], B[3]]) { B_.save(); B_.beginPath(); poly(B_, pts); B_.clip(); }
  B[3].save(); B[3].translate(0, 2 * 862); B[3].scale(1, -1); fillPoly(B[3], rect(px - 360 + wob, 790, px - 60 + wob, 846), rgba(C.beniL, .75)); word(B[3], '24H', px - 210 + wob, 818, 46, rgba(C.sumi, .55), 5); B[3].restore();
  B[2].save(); B[2].translate(0, 2 * 862); B[2].scale(1, -1); fillPoly(B[2], rect(px + 40 - wob, 790, px + 360 - wob, 846), rgba(C.ochre, .7)); word(B[2], 'CAFE', px + 200 - wob, 818, 46, rgba(C.sumi, .55), 5); B[2].restore();
  B[2].restore(); B[3].restore();
  carve(B[0], [...pts, pts[0]], 2.6, { taper: [0, 0], seed: 50, per: 2 });
  const st = Math.floor(tD * 15 + 1e-6);
  for (let k = 0; k < 7; k++) { const per = .5, ph = hash(k * 4.3) * per, age = ((tD + ph) % per) / per, cyc = Math.floor((tD + ph) / per), cx = px + (hash(k * 7.1 + cyc) - .5) * 680, cy = py + (hash(k * 5.3 + cyc) - .5) * 90, r = 12 + 60 * age;
    B[0].strokeStyle = rgba(C.sumi, .8 - .5 * age); B[0].lineWidth = 2; B[0].beginPath(); B[0].ellipse(cx, cy, r, r * .24, 0, 0, TAU); B[0].stroke(); }
  // her legs (the figure block on fours)
  if (td > .3 && td < 1.9) { const S = poseAt(td), J = solveProfile(S), sc = secondary(q => { const p = RUN.pelvisAt(q); return [p[0], p[1] - 250]; }, 0, td);
    akiPrint(B, J, 1.8, 900 - SPL.x * 1.8, 880, { hemB: sc.hemB, hairLag: sc.hair.back }); }
  // the splash: paper-white spray in clusters (one big drop, a few medium, many small), key-line rings
  const u = td - SPL.t0; if (u > 0 && u < .8) { const p0 = [900 + 24 * 1.8, 874];
    for (let j = 0; j < 22; j++) { const a = Math.PI * (.14 + .72 * hash(j * 7.1)), sp = 900 * (.45 + .7 * hash(j * 3.3)), sg = hash(j) < .5 ? -1 : 1, x = p0[0] + Math.cos(a) * sp * u * sg * .8, y = p0[1] - Math.sin(a) * sp * u * 1.2 + 2400 * u * u; if (y > p0[1] + 4) continue;
      const r = j === 0 ? 16 : j < 5 ? 9 : 5; B[1].save(); B[1].globalCompositeOperation = 'destination-out'; B[1].beginPath(); B[1].arc(x, y, r, 0, TAU); B[1].fill(); B[1].restore(); B[0].strokeStyle = C.sumi; B[0].lineWidth = 2; B[0].beginPath(); B[0].arc(x, y, r, 0, TAU); B[0].stroke(); }
    for (let k = 0; k < 2; k++) { const v = u - k * .16; if (v > 0) { B[0].strokeStyle = C.sumi; B[0].lineWidth = 2.6; B[0].beginPath(); B[0].ellipse(p0[0], p0[1] + 18, 60 + 560 * v, 12 + 90 * v, 0, 0, TAU); B[0].stroke(); } } }
  rainLines(B[0], 0, 0, 1920, 1080, tD, 60, .42, 140);
  return { series: 'LAST TRAIN', title: 'I  Rain on the puddle', seal: 1 };
}
// II · the shop street, one long print (the handscroll)
const R2 = mulberry(1717), WORDS = ['24H', 'CAFE', 'BAKERY', 'BAR', 'BOOKS', 'PHARMACY', 'NOODLES', 'LAUNDRY', 'RECORDS', 'HOTEL', 'FLOWERS'];
const SHOPS2 = []; { let x = -300, i = 0; while (x < W2 + 400) { const w = 380 + R2() * 160; SHOPS2.push({ x0: x, x1: x + w, top: 430 + R2() * 70, word: WORDS[(i + 2) % WORDS.length], board: [C.beniL, C.ochre, C.cream][i % 3], lit: R2() < .8, sd: 200 + i * 13 }); x += w; i++; } }
const ROOFS2 = []; { let x = -200; while (x < W2 + 400) { const w = 160 + R2() * 260; ROOFS2.push({ x0: x, x1: x + w, top: 250 + R2() * 110 }); x += w * (.8 + R2() * .4); } }
function sheet2(B, t, tD, vx) {   // vx = sheet-local x of the view's left edge (for culling)
  const G = 860;
  // night sky: Prussian bokashi, far roofs in pale blue (no key line), a mist band
  fillPoly(B[1], rect(vx - 50, 0, vx + 1970, 460), C.prusD); bok(B[1], vx - 50, 120, vx + 1970, 460, C.prusL, 0, 1, { rough: 26, seed: 5 });
  for (const r of ROOFS2) { if (r.x1 < vx - 100 || r.x0 > vx + 2000) continue; fillPoly(B[1], [[r.x0, 470], [r.x0, r.top + 20], [r.x0 + 20, r.top], [r.x1 - 20, r.top], [r.x1, r.top + 20], [r.x1, 470]], C.prusL); }
  kasumi(B[2], vx + 960, 400, 2600, 70, C.cream, .9);
  // shopfronts: plaster, wood frames, lit windows in ochre bokashi, sign boards with their words, awnings
  for (const s of SHOPS2) { if (s.x1 < vx - 100 || s.x0 > vx + 2000) continue; const { x0, x1, top, sd } = s, w = x1 - x0;
    fillPoly(B[2], rect(x0, top, x1, G - 20), C.plaster); fillPoly(B[2], rect(x0, top - 22, x1, top + 8), C.woodD);
    if (s.lit) { fillPoly(B[2], rect(x0 + 30, 630, x0 + w * .62, G - 40), C.ochreL); bok(B[2], x0 + 30, G - 40, x0 + w * .62, 680, C.cream, 1, 0, { rough: 12, seed: sd }); }
    else fillPoly(B[1], rect(x0 + 30, 630, x0 + w * .62, G - 40), C.ai);
    fillPoly(B[2], rect(x1 - 110, 640, x1 - 36, G - 20), C.woodD);
    fillPoly(B[3], rect(x0 + 24, 540, x1 - 24, 600), s.board); word(B[0], s.word, (x0 + x1) / 2, 571, 34, C.sumi, 4);
    fillPoly(B[1], [[x0 + 10, 604], [x1 - 10, 604], [x1 + 6, 626], [x0 - 6, 626]], C.prus);
    keyRect(B[0], x0, top - 22, x1, G - 20, 2.6, sd); keyRect(B[0], x0 + 24, 540, x1 - 24, 600, 2.2, sd + 7); carve(B[0], [[x0 - 6, 626], [x1 + 6, 626]], 2.4, { taper: [0, 0], seed: sd + 11 });
    keyRect(B[0], x0 + 30, 630, x0 + w * .62, G - 40, 2.2, sd + 13); carve(B[0], [[x0 + 30 + (w * .62 - 30) / 2, 632], [x0 + 30 + (w * .62 - 30) / 2, G - 42]], 2, { seed: sd + 17 });
    for (let k = 0; k < 2; k++) { const wx = x0 + 40 + k * (w - 110) / 2; if (top + 30 + 60 < 530) { fillPoly(B[2], rect(wx, top + 30, wx + 52, top + 90), hash(sd + k) < .6 ? C.ochreL : C.ai); keyRect(B[0], wx, top + 30, wx + 52, top + 90, 2, sd + 20 + k); } } }
  // wet paving: pale-blue bands, the lit windows reflected as long paper-white streaks
  fillPoly(B[1], rect(vx - 50, G - 20, vx + 1970, 1080), C.sky); bok(B[1], vx - 50, G - 20, vx + 1970, 1060, C.prusL, 0, .8, { rough: 14, seed: 9 });
  for (const s of SHOPS2) { if (!s.lit || s.x1 < vx - 100 || s.x0 > vx + 2000) continue; bok(B[2], s.x0 + 30, G - 16, s.x0 + (s.x1 - s.x0) * .62, G + 120, C.ochreL, .85, 0, { rough: 10, seed: s.sd }); }
  carve(B[0], [[vx - 50, G - 20], [vx + 1970, G - 20]], 3, { taper: [0, 0], seed: 3 });
  // AKI (on ones: the sheet slides under the view)
  const S = poseAt(t), J = solveProfile(S), sc = secondary(q => { const p = RUN.pelvisAt(q); return [p[0], p[1] - 250]; }, 0, t);
  akiPrint(B, J, K2, 700 - S2X0 * K2, G, { hemB: sc.hemB, hairLag: sc.hair.back, watch: S.watch, take: t >= 6.45 && t < 7.4, blink: [3.6, 5.2].some(b => t >= b && t < b + .1) });
  // footfall splashes: small paper-white clusters
  for (const c of RUN.contacts) { const u = t - c.t0; if (u < 0 || u > .35 || c === SPL) continue; const p0 = [700 + (c.x + 24 - S2X0) * K2, G - 2];
    for (let j = 0; j < 7; j++) { const a = Math.PI * (.2 + .6 * hash(j * 7.1 + c.t0)), sp = 380 * (.5 + .6 * hash(j * 3.3)), sg = hash(j + c.t0) < .5 ? -1 : 1, x = p0[0] + Math.cos(a) * sp * u * sg, y = p0[1] - Math.sin(a) * sp * u + 1500 * u * u; if (y > p0[1]) continue;
      B[0].strokeStyle = C.sumi; B[0].lineWidth = 1.6; B[0].beginPath(); B[0].arc(x, y, j ? 3 : 6, 0, TAU); B[0].stroke(); } }
  // extreme foreground: lamp posts crossing the whole sheet, sliding faster (stacked flat layers)
  for (let x = 900; x < W2 + 2000; x += 1500) { const fx = x - (vx - (camS2(2.8) - SH[1].x)) * .6; if (fx < vx - 100 || fx > vx + 2020) continue;
    fillPoly(B[2], rect(fx, -10, fx + 34, 1090), C.woodD); keyRect(B[0], fx, -10, fx + 34, 1090, 2.6, x); fillPoly(B[2], rect(fx - 40, 150, fx + 74, 230), C.ochreL); keyRect(B[0], fx - 40, 150, fx + 74, 230, 2.4, x + 3); }
  rainLines(B[0], vx, 0, vx + 1920, 1080, tD, 70, .42, 130);
  return { series: 'LAST TRAIN', title: 'II  The shop street', seal: 1, cx: vx + 1876 };
}
function sheet3(B, t, tD) {   // III · a close crop: her sleeve, the hand and the watch fill the print
  fillPoly(B[1], rect(0, 0, 1920, 1080), C.prusD); bok(B[1], 0, 300, 1920, 1080, C.prusL, 0, 1, { rough: 30, seed: 11 });
  // the street lights streaking past: flat paper-white and ochre bands, redrawn 15 times a second
  const st = Math.floor(tD * 15 + 1e-6);
  for (let k = 0; k < 8; k++) { const y = 120 + k * 112 + (hash(k * 3.3) - .5) * 40, len = 260 + hash(k * 5.1) * 520, per = 1920 + len + 300, x1 = 1920 + 150 - ((tD * 2400 + hash(k * 7.7) * per) % per);
    if (k % 2) { B[1].save(); B[1].globalCompositeOperation = 'destination-out'; B[1].fillRect(x1, y, len, 7 + 6 * hash(k)); B[1].restore(); } else fillPoly(B[2], rect(x1, y, x1 + len, y + 8 + 5 * hash(k)), C.ochreL); }
  const kk = Math.floor((t - FIRST_STEP) * CADENCE) % 2, dy = kk ? -9 : 9;   // two key drawings alternate on her steps
  const T_ = ([x, y]) => [x, y + dy];
  const sleeve = [[-60, 640], [760, 470], [790, 700], [-60, 960]].map(T_);
  fillPoly(B[3], sleeve, C.beni); carve(B[0], [T_([-60, 640]), T_([760, 470])], 4, { seed: 3, taper: [0, .1] }); carve(B[0], [T_([-60, 960]), T_([790, 700])], 4, { seed: 4, taper: [0, .1] });
  carve(B[0], [T_([200, 700]), T_([520, 630])], 2.6, { seed: 5 }); carve(B[0], [T_([160, 850]), T_([560, 720])], 2.6, { seed: 6 });
  const cuff = [[760, 466], [830, 452], [858, 690], [790, 704]].map(T_); fillPoly(B[2], cuff, C.cream); carve(B[0], [...cuff, cuff[0]], 3, { taper: [0, 0], seed: 7, per: 2 });
  for (let k = 0; k < 4; k++) carve(B[0], [T_([776 + k * 16, 470]), T_([800 + k * 14, 692])], 1.8, { seed: 8 + k });
  const handP = dense([[1060, 440], [1260, 400], [1400, 450], [1440, 560], [1400, 660], [1260, 700], [1100, 680]].map(T_), 6, true); fillPoly(B[3], handP, C.skin); carve(B[0], [...handP, handP[0]], 3.2, { taper: [0, 0], seed: 12, per: 1 });
  const thumb = dense([[1100, 450], [1230, 395], [1330, 380], [1350, 420], [1240, 460]].map(T_), 6, true); fillPoly(B[3], thumb, C.skin); carve(B[0], [...thumb, thumb[0]], 2.8, { taper: [0, 0], seed: 13, per: 1 });
  for (let k = 0; k < 3; k++) carve(B[0], [T_([1330 - k * 6, 520 + k * 50]), T_([1430 - k * 10, 540 + k * 48])], 2.4, { seed: 14 + k });
  // the watch: a wood-dark strap, an ochre case, the dial left as paper, numerals, hands, the second hand in beni, raindrops as key rings
  const cx = 930, cy = 570 + dy, r = 180;
  fillPoly(B[2], rect(860, 250 + dy, 1000, 420 + dy), C.woodD); fillPoly(B[2], rect(860, 720 + dy, 1000, 900 + dy), C.woodD);
  keyRect(B[0], 860, 250 + dy, 1000, 420 + dy, 2.6, 20); keyRect(B[0], 860, 720 + dy, 1000, 900 + dy, 2.6, 24);
  B[2].fillStyle = C.ochre; B[2].beginPath(); B[2].arc(cx, cy, r, 0, TAU); B[2].fill();
  for (const L of [B[1], B[2], B[3]]) { L.save(); L.globalCompositeOperation = 'destination-out'; L.beginPath(); L.arc(cx, cy, r - 30, 0, TAU); L.fill(); L.restore(); }
  B[0].strokeStyle = C.sumi; B[0].lineWidth = 4; B[0].beginPath(); B[0].arc(cx, cy, r, 0, TAU); B[0].stroke(); B[0].lineWidth = 2.4; B[0].beginPath(); B[0].arc(cx, cy, r - 30, 0, TAU); B[0].stroke();
  for (let k = 0; k < 12; k++) { if (k % 3 === 0) continue; const a = k / 12 * TAU; carve(B[0], [[cx + Math.sin(a) * (r - 46), cy - Math.cos(a) * (r - 46)], [cx + Math.sin(a) * (r - 60), cy - Math.cos(a) * (r - 60)]], 4, { seed: 30 + k }); }
  [['12', 0], ['3', 1], ['6', 2], ['9', 3]].forEach(([n, i]) => { const a = i / 4 * TAU; word(B[0], n, cx + Math.sin(a) * (r - 66), cy - Math.cos(a) * (r - 66) + 2, 34, C.sumi, 0); });
  const sec = 41 + Math.floor(t - EV.watchHit), mm = 58 + sec / 60, hand = (a, l, w, col, sd, tail = 0) => carve(B[col === C.beni ? 3 : 0], [[cx - Math.sin(a) * tail, cy + Math.cos(a) * tail], [cx + Math.sin(a) * l, cy - Math.cos(a) * l]], w, { seed: sd, taper: [.05, .5], col });
  hand((11 + mm / 60) / 12 * TAU, r * .42, 13, C.sumi, 40); hand(mm / 60 * TAU, r * .62, 9, C.sumi, 41); hand(sec / 60 * TAU, r * .68, 4.5, C.beni, 42, 28);
  B[0].fillStyle = C.sumi; B[0].beginPath(); B[0].arc(cx, cy, 8, 0, TAU); B[0].fill();
  for (const [u, v, s] of [[-62, -48, 13], [40, 66, 9], [74, -76, 7]]) { B[0].lineWidth = 2; B[0].beginPath(); B[0].arc(cx + u, cy + v, s, 0, TAU); B[0].stroke(); }
  rainLines(B[0], 0, 0, 1920, 1080, tD, 40, .4, 150);
  return { series: 'LAST TRAIN', title: 'III  23:58', seal: 1 };
}
function sheet4(B, t, tD) {   // IV · the clock: a tall print, night sky, mist, roofs stacked in flat layers, the tower
  const Hh = 1500;
  fillPoly(B[1], rect(0, 0, 1920, Hh), C.prusD); bok(B[1], 0, 200, 1920, 1100, C.prusL, 0, 1, { rough: 30, seed: 13 }); bok(B[0], 0, -20, 1920, 260, C.sumi, .55, 0, { rough: 24, seed: 14 });
  // the tower (plaster, wood, a lit ochre clock face with key-line hands at 11:58)
  const tx = 1180; fillPoly(B[2], rect(tx - 120, 300, tx + 120, Hh), C.plaster); fillPoly(B[2], [[tx - 160, 304], [tx, 120], [tx + 160, 304]], C.woodD);
  keyRect(B[0], tx - 120, 300, tx + 120, Hh, 3, 50); carve(B[0], [[tx - 160, 304], [tx, 120], [tx + 160, 304], [tx - 160, 304]], 3, { taper: [0, 0], seed: 51, per: 2 });
  const cy = 430, r = 86; B[2].fillStyle = C.ochreL; B[2].beginPath(); B[2].arc(tx, cy, r, 0, TAU); B[2].fill(); B[0].lineWidth = 3.2; B[0].strokeStyle = C.sumi; B[0].beginPath(); B[0].arc(tx, cy, r, 0, TAU); B[0].stroke();
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; carve(B[0], [[tx + Math.sin(a) * (r - 12), cy - Math.cos(a) * (r - 12)], [tx + Math.sin(a) * (r - 24), cy - Math.cos(a) * (r - 24)]], k % 3 ? 2.4 : 4, { seed: 60 + k }); }
  carve(B[0], [[tx, cy], [tx + Math.sin((11 + 58 / 60) / 12 * TAU) * 40, cy - Math.cos((11 + 58 / 60) / 12 * TAU) * 40]], 8, { seed: 72, taper: [.05, .5] });
  carve(B[0], [[tx, cy], [tx + Math.sin(58 / 60 * TAU) * 64, cy - Math.cos(58 / 60 * TAU) * 64]], 6, { seed: 73, taper: [.05, .5] });
  for (let k = 0; k < 3; k++) { fillPoly(B[2], rect(tx - 50 + k * 40, 600, tx - 30 + k * 40, 690), C.ochreL); keyRect(B[0], tx - 50 + k * 40, 600, tx - 30 + k * 40, 690, 2, 80 + k); }
  // the chime: the sound drawn as carved arcs leaving the clock, one after another
  const u = tD - EV.chime; if (u > 0) for (let k = 0; k < 3; k++) { const v = u - k * .12; if (v <= 0 || v > .45) continue; const rr = r + 30 + 520 * v;
    for (const sd of [-1, 1]) { const pts = []; for (let j = 0; j <= 10; j++) { const a = (sd > 0 ? -.55 : Math.PI - .55) + j / 10 * 1.1; pts.push([tx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } carve(B[0], pts, 4, { seed: 90 + k * 3 + sd }); } }
  // mist band, far roofs (pale blue, no key line), near roofs (wood) with ochre windows, all flat and stacked
  kasumi(B[2], 900, 780, 2300, 90, C.cream, .92);
  const R = mulberry(41); for (let x = -40; x < 1960; x += 140 + R() * 120) { const w = 120 + R() * 160, top = 860 + R() * 90; fillPoly(B[1], rect(x, top, x + w, Hh), C.prusL); }
  for (let x = -60, i = 0; x < 1980; i++) { const w = 220 + R() * 180, top = 1040 + R() * 80; if (Math.abs(x + w / 2 - tx) < 150) { x += w; continue; } fillPoly(B[2], rect(x, top, x + w, Hh), C.woodD); keyRect(B[0], x, top, x + w, Hh, 2.6, 100 + i);
    for (let yy = top + 30; yy < Hh - 60; yy += 70) for (let xx = x + 24; xx < x + w - 40; xx += 56) if (R() < .55) { fillPoly(B[2], rect(xx, yy, xx + 26, yy + 34), C.ochreL); } x += w; }
  rainLines(B[0], 0, 0, 1920, Hh, tD, 90, .42, 150);
  return { series: 'LAST TRAIN', title: 'IV  The clock', seal: EV.chime };
}

// ——— frame ———
function frame(t) {
  const tD = Math.floor(t * 15 + 1e-6) / 15 + 1 / 30, [camX, camY] = camAt(t);
  BX.forEach(x => { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H); });
  // the mount, then each visible sheet's paper
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = PAL.mount; ctx.fillRect(0, 0, W, H);
  tile(ctx, TX.grain, -camX * .5, 0, .06);
  const caps = [];
  SH.forEach((s, i) => {
    const ox = s.x - camX, oy = -camY; if (ox > W || ox + s.w < 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, s.w, s.h); ctx.clip(); tile(ctx, TX.paper, ox, oy); if (s.h > H) tile(ctx, TX.paper, ox, oy + H); ctx.restore();
    ctx.fillStyle = 'rgba(60,40,20,.25)'; ctx.fillRect(ox + s.w, oy + 8, 8, s.h);   // the sheet's edge on the mount
    const fr = { x0: ox + FR.x0, y0: oy + FR.y0, x1: ox + s.w - (1920 - FR.x1), y1: oy + s.h - (1080 - FR.y1) };
    BX.forEach(x => { x.save(); x.beginPath(); x.rect(fr.x0, fr.y0, fr.x1 - fr.x0, fr.y1 - fr.y0); x.clip(); x.translate(ox, oy); }); BX[0].fillStyle = C.sumi;
    const vx = camX - s.x;
    const info = i === 0 ? sheet1(BX, t, tD) : i === 1 ? sheet2(BX, t, tD, vx) : i === 2 ? sheet3(BX, t, tD) : sheet4(BX, t, tD);
    BX.forEach(x => x.restore());
    caps.push({ i, ox, oy, s, fr, info });
  });
  // print the blocks, each with its registration offset, then the key block; then fibres over everything
  for (const i of [1, 2, 3, 0]) { inkifyAnchored(i, camX, camY); ctx.drawImage(BK[i], REG[i][0], REG[i][1]); }
  ctx.save(); ctx.beginPath(); for (const c of caps) ctx.rect(c.ox, c.oy, c.s.w, c.s.h); ctx.clip(); tile(ctx, TX.fiber, -camX, -camY, 1); ctx.restore();
  // borders, cartouche and seal: part of each print
  for (const c of caps) { const { fr, info } = c; ctx.strokeStyle = PAL.sumi; ctx.lineWidth = 3.4; ctx.strokeRect(fr.x0, fr.y0, fr.x1 - fr.x0, fr.y1 - fr.y0); ctx.lineWidth = 1; ctx.strokeRect(fr.x0 - 9, fr.y0 - 9, fr.x1 - fr.x0 + 18, fr.y1 - fr.y0 + 18);
    const right = c.i === 1 ? fr.x0 + 760 : fr.x1 - 40, x0 = cartouche(ctx, right, fr.y0 + 34, info.series, info.title);   // the long print carries its title at its start
    const sp = info.seal === 1 ? 1 : (t - info.seal) / .2 + .0001; seal(ctx, x0 - 52, fr.y0 + 86, 66, sp, 7 + c.i); }
}

window.DUR = DUR; window.render = t => frame(t);
window.RIGQA = t => { const id = shotAt(t)[2]; if (id === 'S1') { const td = Math.floor(t * 7.5 + 1e-6) / 7.5 + 3 / 30; if (td <= .3 || td >= 1.9) return null; const J = solveProfile(poseAt(td)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; }
  if (id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
