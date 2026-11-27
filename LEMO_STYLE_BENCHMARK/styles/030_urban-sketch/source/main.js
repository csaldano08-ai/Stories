// 030 · Urban Sketch (pen & wash) — the first 10 s of "Last Train Home" as one page of an accordion sketchbook, drawn on
// location (lemo-opuscar styles/urban-sketch): a sepia fineliner line that wobbles, overshoots and breaks, transparent washes
// misregistered from the line with dried edges and granulation, cream cold-press paper that shows everywhere, the page
// fraying into dabs at its edges. The page holds the long street as a panorama band and three vignettes below it (the
// puddle, the wrist and the watch, the sky over the station). The cuts are the style's own transitions: quick camera
// travels across the page (whip-tilts) that start exactly on the cut times. Colour arrives with a cause: the splash
// (0.9375 s) blooms the reflected colours across the wet pavement; the chime (9.575 s) blooms the clock dial.
// AKI is a sketched figure (knock + wash + shade wash + ink), moving on ones, her line and wash seeds boiling at 12 fps
// (the style's figure rule); the static page never boils. A page has no parallax: the far city is drawn on the same plane.
// Engine copied unchanged from the style's demo (engine.js). Page contract: window.render(t), DUR, READY, RIGQA.
import { INK, PAPER, clamp, lerp, ss, TAU, rng, n2, fbm, hex, mix3, rgba, rough, ellipse, spline, penStroke, drawPen, rasterPen, wash, reserve, dab, arrivalField, compositor, drawPrims, handwrite } from './engine.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { seg, eio, eo, ei, back, hash, mulberry } from './shared/lib/util.js';

const W = 8000, H = 2800, VW = 1920, VH = 1080;
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
const boilOf = t => Math.floor(t * 12);

// ——— page layout: world (rig units) → page pixels ———
const C25 = X(2.5) + 330, C75 = X(7.5) + 330, SX0 = C25 - 1400, KS = .72;
const SP = ([x, y]) => [(x - SX0) * KS, (y + 1180) * KS];                       // the street band (top of the page)
const V1 = [1150, 2000], K1 = 2.0, SP1 = ([x, y]) => [(x - SPL.x) * K1 + V1[0], (y + 90) * K1 + V1[1]];   // the puddle vignette
const V3 = [4700, 2000], V4 = [6950, 2080];                                    // the watch vignette, the sky vignette
const camS1 = t => ({ cx: V1[0] + 60 + 24 * t, cy: V1[1], z: 1, rot: 0 });
const camS2 = t => ({ cx: (X(t) + 330 - SX0) * KS, cy: (-400 + 1180) * KS, z: 1, rot: 0 });
const camS3 = t => { const a = t - 7.5; return { cx: V3[0] - 20 + 16 * a + 4 * Math.sin(TAU * CADENCE * a * .5), cy: V3[1] + 9 * Math.sin(TAU * CADENCE * a), z: 1, rot: 0 }; };
const camS4 = t => { const a = t - 9.375; return { cx: V4[0], cy: V4[1] - 100 + 110 * ei(a / .625) * .85 + 30 * a, z: 1, rot: 0 }; };
// the cut travels: a whip across the page, 0.24 s, starting on the cut
const TRAV = .24;
function camera(t) {
  const id = shotAt(t)[2];
  const leg = (A, B, t0) => { const u = eio(seg(t, t0, t0 + TRAV)), a = A(t0), b = B(t0 + TRAV); return { cx: lerp(a.cx, b.cx, u), cy: lerp(a.cy, b.cy, u), z: 1 - .12 * Math.sin(Math.PI * u), rot: .035 * Math.sin(Math.PI * u) }; };
  if (id === 'S1') return camS1(t);
  if (id === 'S2') return t < 2.5 + TRAV ? leg(camS1, camS2, 2.5) : camS2(t);
  if (id === 'S3') return t < 7.5 + TRAV ? leg(camS2, camS3, 7.5) : camS3(t);
  return t < 9.375 + TRAV ? leg(camS3, camS4, 9.375) : camS4(t);
}

// ——— colours ———
const C = { indigo: hex('#4a4f86'), indigoD: hex('#363a6c'), haze: hex('#9aa0c0'), violet: hex('#6e6aa0'), win: hex('#e8b04a'), winL: hex('#f2d27a'), warm: hex('#e0904a'),
  wall: [hex('#b89a88'), hex('#a8909c'), hex('#c4a084'), hex('#9c8ea8'), hex('#b49478'), hex('#a0a0b0')], pave: hex('#8e88a8'), road: hex('#5c5a86'),
  pink: hex('#e0709a'), teal: hex('#58a8a4'), amber: hex('#e2a84a'), cream: hex('#efe2c4'), awn: [hex('#4f8a86'), hex('#b07a4a'), hex('#7a6aa8'), hex('#5a7aa8')],
  jacket: hex('#d4483a'), trousers: hex('#4c4a70'), boots: hex('#8a5a3a'), hair: hex('#4c2e58'), skin: hex('#e8b89a'), sweater: hex('#ece0c8'), gold: hex('#d8a84a'), strap: hex('#7a5038') };
const shadeCol = c => mix3(c, [70, 72, 115], .4);

// ——— the static page ———
let colC, cx, ia, ta, SEED = 1;
const WIN = [0, 5];
function cv(w, h, fill) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); if (fill) { x.fillStyle = fill; x.fillRect(0, 0, w, h); } return [c, x]; }
const pen = (pts, o = {}) => { const st = penStroke(pts, { w: o.w ?? 2, wob: o.wob ?? 1, over: o.over ?? 5, gap: o.gap ?? .35, seed: o.seed ?? SEED++, smooth: o.smooth, alpha: o.alpha }); if (st.P.length > 1) rasterPen(ia, ta, st, -1, .01, WIN); return st; };
const ln = (a, b, o = {}) => pen([a, b], { smooth: false, ...o });
const wsh = (poly, col, o = {}) => wash(cx, poly, col, { seed: SEED++, ...o });
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const inkText = (str, x, y, size, o = {}) => { for (const [q, st] of [[ia, '#000'], [ta, 'rgb(1,1,1)']]) { q.save(); q.font = `${o.weight ?? 700} ${size}px Caveat`; q.textAlign = o.align ?? 'center'; q.fillStyle = st; if (o.flip) { q.translate(x, y); q.scale(1, -1); q.fillText(str, 0, 0); } else q.fillText(str, x, y); q.restore(); } };

// the street (world coords mapped by SP): the same shop row the run passes, drawn as a sketch panorama
const SX1 = C75 + 1400, FAC = -70;
const WORDS = ['BAKERY', 'BAR', 'BOOKS', '24H', 'PHARMACY', 'NOODLES', 'CAFE', 'LAUNDRY', 'RECORDS', 'HOTEL', 'FLOWERS'];
const SIGNC = [C.amber, C.pink, null, C.teal, C.cream, C.pink, C.amber, C.teal];
const SHOPS = []; { const r = mulberry(30030); let x = SX0 - 300, i = 0;
  while (x < SX1 + 300) { const w = 860 + r() * 240; SHOPS.push({ x0: x, x1: x + w, top: -(900 + r() * 200), lit: r() < .85, ups: [r() < .55, r() < .4, r() < .6], awn: r() < .5, vbox: r() < .45, wall: C.wall[i % C.wall.length], sign: SIGNC[i % SIGNC.length], word: WORDS[i % WORDS.length], i, r }); x += w + 44; i++; } }
const PUD2 = []; for (let x = SX0 + 600; x < SX1; x += 1700 + hash(x) * 900) PUD2.push({ x, y: 60 + hash(x * 3) * 60, rx: 150 + hash(x * 7) * 120, ry: 20 + hash(x * 9) * 10 });
function drawStreet() {
  const P = pts => pts.map(SP), R = mulberry(77), lw = 2.1;
  const skyClip = (fn) => { for (const q of [cx, ia, ta]) { q.save(); q.beginPath(); for (const s of SHOPS) { const a = SP([s.x0 - 1, -1400]), b = SP([s.x1 + 1, s.top]); q.rect(a[0], a[1], b[0] - a[0], b[1] - a[1]); const c = SP([s.x1, -1400]), d = SP([s.x1 + 44, -420]); q.rect(c[0], c[1], d[0] - c[0], d[1] - c[1]); } q.clip(); } fn(); for (const q of [cx, ia, ta]) q.restore(); };
  skyClip(() => {
  // night sky over the roofs: a few big soft indigo washes, paler toward the bottom where the city glows; far towers in haze
  for (let i = 0; i < 46; i++) { const x = SX0 + R() * (SX1 - SX0), y = -1180 + R() * 360, rx = 300 + R() * 500;
    wsh(ellipse(...SP([x, y]), rx * KS, rx * KS * (.3 + R() * .2), 22, R()), R() < .5 ? C.indigoD : C.indigo, { a: .2 + R() * .12, j: rx * .1, layers: 3, edge: .1, freq: .006 }); }
  let fx = SX0; while (fx < SX1) { const w = 160 + R() * 280, top = -1000 - R() * 220;
    wsh(P([[fx, top], [fx + w, top], [fx + w, -420], [fx, -420]]), mix3(C.violet, C.haze, .5), { a: .32, j: 3, layers: 2, edge: .2 });
    if (R() < .6) pen(P([[fx, -430], [fx, top], [fx + w, top], [fx + w, -430]]), { w: 1.2, wob: .7, over: 4, gap: .5, smooth: false, alpha: .7 });
    fx += w * (.7 + R() * .5); }
  });
  for (const s of SHOPS) {
    const { x0, x1, top } = s, w = x1 - x0, ww = (w - 280) * .74, wx0 = x0 + 52, wx1 = wx0 + ww, dx0 = wx1 + 50, dx1 = dx0 + 136, r = mulberry(500 + s.i);
    // facade: local colour, night glaze from the top, shop light warming the bottom
    wsh(P(rect(x0, top, x1, FAC)), s.wall, { a: .5, j: 4, layers: 3, edge: .25 });
    wsh(P(rect(x0, top, x1, top + (FAC - top) * .55)), C.indigo, { a: .32, j: 6, layers: 2, edge: .1 });
    wsh(P(rect(x1 - 60, top, x1, FAC)), shadeCol(s.wall), { a: .35, j: 3, layers: 2, edge: .2 });
    pen(P([[x0, FAC + 6], [x0, top], [x1, top], [x1, FAC + 4]]), { w: lw, smooth: false, gap: .5 });
    ln(...P([[x0 - 10, top + 22], [x1 + 12, top + 22]]), { w: 1.5 });
    // upper windows: a few marks, lit ones warm with paper in the middle
    const nu = w > 980 ? 3 : 2;
    for (let k = 0; k < nu; k++) { const ux = x0 + w * (k + .5) / nu - 62, uy = top + 90, uh = Math.min(180, -738 - uy); if (uh < 70) continue;
      if (s.ups[k]) { wsh(P(rect(ux, uy, ux + 124, uy + uh)), C.win, { a: .55, j: 3, layers: 2, edge: .35 }); reserve(cx, P(rect(ux + 24, uy + 16, ux + 90, uy + uh * .66)), .5, 6, SEED++); }
      else wsh(P(rect(ux, uy, ux + 124, uy + uh)), C.indigoD, { a: .5, j: 3, layers: 2, edge: .3 });
      pen(P([[ux, uy + uh + 4], [ux, uy], [ux + 124, uy], [ux + 124, uy + uh - 10]]), { w: 1.6, smooth: false, gap: .4 });
      if (k === nu - 1 && r() < .7 && uy + uh + 72 < -722) { const b0 = uy + uh + 8; ln(...P([[ux - 24, b0], [ux + 150, b0]]), { w: 1.6 }); for (let b = 0; b < 8; b++) ln(...P([[ux - 18 + b * 22, b0], [ux - 18 + b * 22, b0 + 64]]), { w: 1, alpha: .8, gap: 0 }); ln(...P([[ux - 24, b0 + 64], [ux + 150, b0 + 64]]), { w: 1.5 }); } }
    // projecting lightbox sign
    if (s.vbox) { const vx = x1 - 96, vy0 = Math.max(top + 60, -990), col = s.sign || C.teal; wsh(P(rect(vx, vy0, vx + 62, -730)), col, { a: .6, j: 2, layers: 2, edge: .4 }); pen(P([[vx, -730], [vx, vy0], [vx + 62, vy0], [vx + 62, -730], [vx - 4, -730]]), { w: 1.6, smooth: false }); }
    // sign board, the shop name lettered by hand
    const by0 = -712, by1 = -608;
    if (s.sign) { wsh(P(rect(x0 + 36, by0, x1 - 36, by1)), hex('#3a3050'), { a: .55, j: 2, layers: 2, edge: .3 }); wsh(P(rect((x0 + x1) / 2 - 220, by0 + 12, (x0 + x1) / 2 + 220, by1 - 12)), s.sign, { a: .45, j: 6, layers: 2, edge: 0 }); }
    else wsh(P(rect(x0 + 36, by0, x1 - 36, by1)), C.cream, { a: .35, j: 2, layers: 2, edge: .3 });
    pen(P([[x0 + 36, by1], [x0 + 36, by0], [x1 - 36, by0], [x1 - 36, by1], [x0 + 30, by1]]), { w: 1.8, smooth: false, gap: .3 });
    inkText(s.word, ...SP([(x0 + x1) / 2, by1 - 22]), 64 * KS * 1.25);
    // awning
    if (s.awn) { const ac = C.awn[s.i % 4]; wsh(P([[wx0 - 24, -598], [wx1 + 24, -598], [wx1 + 34, -540], [wx0 - 34, -540]]), ac, { a: .55, j: 3, layers: 2, edge: .35 });
      const sc = []; for (let x = wx0 - 34; x <= wx1 + 34; x += 32) sc.push(SP([x, -540 + ((x - wx0) / 32 % 2 ? 0 : 12)])); pen(sc, { w: 1.6 }); ln(...P([[wx0 - 24, -598], [wx1 + 24, -598]]), { w: 1.8 }); }
    // shop window: warm light (paper left in the middle), shelves and goods as quick marks
    const wy0 = -520, wy1 = -112;
    if (s.lit) { wsh(P(rect(wx0, wy0, wx1, wy1)), s.word === '24H' || s.word === 'PHARMACY' || s.word === 'LAUNDRY' ? hex('#c8dcd0') : C.win, { a: .6, j: 4, layers: 3, edge: .4 });
      wsh(P(rect(wx0, wy1 - 120, wx1, wy1)), C.warm, { a: .35, j: 6, layers: 2, edge: .2 }); reserve(cx, P(rect(wx0 + ww * .2, wy0 + 50, wx0 + ww * .7, wy0 + 200)), .45, 10, SEED++);
      for (const y of [-400, -280, -180]) { ln(...P([[wx0 + 8, y], [wx1 - 8, y]]), { w: 1.3, alpha: .85 }); for (let x = wx0 + 20; x < wx1 - 20; x += 22 + r() * 30) if (r() < .6) dab(cx, ...SP([x, y - 18]), 7 + r() * 6, r() * 3, [C.pink, C.teal, C.amber, C.violet][(r() * 4) | 0], .45, SEED++); } }
    else wsh(P(rect(wx0, wy0, wx1, wy1)), C.indigoD, { a: .55, j: 3, layers: 2, edge: .3 });
    pen(P([[wx0, wy1 + 6], [wx0, wy0], [wx1, wy0], [wx1, wy1 + 4]]), { w: lw, smooth: false, gap: .3 }); ln(...P([[wx0 - 10, wy1], [wx1 + 10, wy1]]), { w: lw });
    for (const u of [.34, .67]) ln(...P([[wx0 + ww * u, wy0], [wx0 + ww * u, wy1]]), { w: 1.4, gap: .5 });
    // door
    wsh(P(rect(dx0, -470, dx1, FAC)), s.lit ? C.warm : hex('#6a5070'), { a: .45, j: 3, layers: 2, edge: .3 }); pen(P([[dx0, FAC], [dx0, -470], [dx1, -470], [dx1, FAC]]), { w: 1.8, smooth: false });
    ln(...P([[s.x1 + 2, -420], [s.x1 + 2, FAC]]), { w: 1.2, alpha: .7 }); wsh(P(rect(s.x1, -420, s.x1 + 44, FAC)), C.indigoD, { a: .6, j: 2, layers: 2, edge: .2 });
    // reflections of the lights in the wet pavement: vertical rough washes, broken, dried edges
    const refl = (x, wdt, col, a) => { for (let k = 0; k < 9; k++) { if (R() < k * .07) continue; const y = FAC + 18 + k * 38 + R() * 16, hw = wdt * (.42 - k * .03) * (.6 + R() * .5), xx = x + (R() - .5) * wdt * .25;
      wsh(ellipse(...SP([xx, y]), hw * KS, (8 + R() * 6) * KS, 14, 0), col, { a: a * (1 - k * .09), j: 4, layers: 2, edge: .45 }); } };
    if (s.lit) refl((wx0 + wx1) / 2, ww * .7, C.win, .5);
    if (s.sign) refl((x0 + x1) / 2, 260, s.sign, .4);
  }
  // pavement, kerb, road; puddles as indigo pools with an ink edge
  wsh(P(rect(SX0, FAC, SX1, 150)), C.pave, { a: .3, j: 8, layers: 3, edge: .1, freq: .004 });
  wsh(P(rect(SX0, 174, SX1, 520)), C.road, { a: .45, j: 8, layers: 3, edge: .1, freq: .004 });
  pen(P([[SX0, FAC], [SX1, FAC]]), { w: lw, gap: .2 }); pen(P([[SX0, 150], [SX1, 150]]), { w: 1.8, gap: .25 }); pen(P([[SX0, 174], [SX1, 176]]), { w: 1.4, gap: .3, alpha: .8 });
  for (let x = SX0; x < SX1; x += 160 + R() * 60) ln(...P([[x, 152], [x + 6, 172]]), { w: 1.1, alpha: .6, gap: 0 });
  for (const p of PUD2) { const e = ellipse(...SP([p.x, p.y]), p.rx * KS, p.ry * KS, 26); wsh(e, C.indigoD, { a: .5, j: 3, layers: 2, edge: .4 }); pen(e.slice(2, 18), { w: 1.3, gap: .5 }); }
}

// the puddle vignette (S1), world coords mapped by SP1
const PX = SPL.x + 20, PY = 52, PRX = 320, PRY = 60;
const inPudW = (x, y, k = 1) => ((x - PX) / PRX) ** 2 + ((y - PY) / PRY) ** 2 < k;
function drawPuddle() {
  const P = pts => pts.map(SP1), R = mulberry(111), X0 = SPL.x - 560, X1 = SPL.x + 640;
  // the shop front behind, windows warm with paper left in them, the shop base; the signs are above the frame (seen in the water)
  wsh(P(rect(X0, -400, X1, -30)), hex('#8a7a9a'), { a: .5, j: 10, layers: 3, edge: .15 });
  for (const [wx, ww] of [[SPL.x - 560, 360], [SPL.x - 120, 300], [SPL.x + 250, 140], [SPL.x + 430, 300]]) {
    reserve(cx, P(rect(wx, -400, wx + ww, -50)), .9, 6, SEED++); wsh(P(rect(wx, -400, wx + ww, -50)), C.win, { a: .5, j: 5, layers: 3, edge: .4 }); wsh(P(rect(wx, -400, wx + ww, -260)), C.warm, { a: .25, j: 12, layers: 2, edge: 0 }); reserve(cx, P(rect(wx + ww * .2, -360, wx + ww * .6, -200)), .6, 12, SEED++);
    pen(P([[wx, -40], [wx, -400]]), { w: 3, smooth: false }); pen(P([[wx + ww, -400], [wx + ww, -40]]), { w: 3, smooth: false });
    for (const y of [-300, -190]) ln(...P([[wx + 6, y], [wx + ww - 6, y]]), { w: 2.2, gap: .4 });
    for (let x = wx + 20; x < wx + ww - 20; x += 30 + R() * 26) if (R() < .55) dab(cx, ...SP1([x, -320]), 9 + R() * 8, R() * 3, [C.pink, C.teal, C.amber][(R() * 3) | 0], .45, SEED++); }
  for (const [wx, ww] of [[SPL.x - 120 - 220, 200], [SPL.x + 160, 90], [SPL.x + 390, 40]]) wsh(P(rect(wx, -400, wx + ww, -40)), C.indigo, { a: .35, j: 5, layers: 2, edge: .2 });   // night on the pillars
  wsh(P(rect(X0, -400, X1, -330)), C.indigoD, { a: .3, j: 10, layers: 2, edge: .1 });
  wsh(P(rect(X0, -40, X1, -22)), hex('#4a4060'), { a: .6, j: 3, layers: 2, edge: .3 }); pen(P([[X0, -22], [X1, -22]]), { w: 3.2 });
  // wet pavement + puddle
  wsh(P(rect(X0, -22, X1, 214)), C.pave, { a: .42, j: 10, layers: 3, edge: .1, freq: .004 });
  for (let i = 0; i < 26; i++) { const x = X0 + R() * (X1 - X0), y = -10 + R() * 210; if (inPudW(x, y, 1.2)) continue; wsh(ellipse(...SP1([x, y]), 30 + R() * 50, 6 + R() * 6, 12, 0), C.win, { a: .25, j: 4, layers: 2, edge: .3 }); }
  const pud = ellipse(...SP1([PX, PY]), PRX * K1, PRY * K1, 40);
  wsh(pud, C.indigoD, { a: .55, j: 4, layers: 3, edge: .45 });
  pen(pud.slice(0, 18), { w: 2.6, gap: .5, over: 10 }); pen(pud.slice(22, 38), { w: 2.2, gap: .5, over: 10 });
}
function eraseInk(poly) { ia.save(); ia.globalCompositeOperation = 'destination-out'; ia.beginPath(); poly.forEach((p, i) => i ? ia.lineTo(...p) : ia.moveTo(...p)); ia.closePath(); ia.fill(); ia.restore();
  ta.save(); ta.globalCompositeOperation = 'source-over'; ta.fillStyle = '#fff'; ta.beginPath(); poly.forEach((p, i) => i ? ta.lineTo(...p) : ta.moveTo(...p)); ta.closePath(); ta.fill(); ta.restore(); }
// the watch vignette (S3), page px
const A0 = [V3[0] - 1120, V3[1] + 420], A1 = [V3[0] + 900, V3[1] - 160], AU = (() => { const d = Math.hypot(A1[0] - A0[0], A1[1] - A0[1]); return [(A1[0] - A0[0]) / d, (A1[1] - A0[1]) / d]; })(), AN = [-AU[1], AU[0]];
const AP = (s, q) => [A0[0] + AU[0] * s + AN[0] * q, A0[1] + AU[1] * s + AN[1] * q];
const WC = AP(1170, -10), WR = 300, ARM = [[-60, -300], [1000, -270], [1080, -268], [1080, -220], [1500, -200], [1640, -250], [1990, -250], [1990, 240], [1500, 220], [1080, 226], [1080, 262], [1020, 270], [-60, 300]].map(([s_, q]) => AP(s_, q)), ANG3 = Math.atan2(AU[1], AU[0]);
const handDir = f => [Math.cos(ANG3 - Math.PI / 2 + f * TAU), Math.sin(ANG3 - Math.PI / 2 + f * TAU)];
function drawWatch() {
  const poly = pts => pts.map(([s, q]) => AP(s, q)), R = mulberry(333);
  // the night behind, a few soft washes (the moving lights are drawn live)
  for (let i = 0; i < 16; i++) wsh(ellipse(V3[0] - 900 + R() * 1800, V3[1] - 500 + R() * 1000, 260 + R() * 240, 90 + R() * 80, 20, 0), R() < .5 ? C.indigoD : C.indigo, { a: .22, j: 30, layers: 3, edge: .1, freq: .006 });
  // sleeve: red wash, cool shadow underneath, folds as ink curves, the cuff
  const sl = poly([[-60, -300], [1000, -270], [1020, 270], [-60, 300]]);
  reserve(cx, sl, 1, 0); wsh(sl, C.jacket, { a: .62, j: 3, layers: 3, edge: .35, dx: 4, dy: 3 }); wsh(poly([[-60, 80], [1000, 80], [1020, 270], [-60, 300]]), shadeCol(C.jacket), { a: .4, j: 4, layers: 2, edge: .2 });
  pen(poly([[-60, -300], [400, -290], [1000, -270]]), { w: 3.4, gap: .3 }); pen(poly([[-60, 300], [500, 290], [1020, 270]]), { w: 3.8, gap: .2 });
  for (const [s, d] of [[260, 1], [520, -1], [780, 1]]) { pen(poly([[s - 30, -290], [s + 10, -120 * d], [s - 10, 60], [s + 30, 280]]), { w: 2.4, gap: .5 }); pen(poly([[s + 20, -282], [s + 60, -150]]), { w: 1.8 }); }
  const cf = poly([[970, -280], [1080, -268], [1080, 262], [990, 272]]); wsh(cf, shadeCol(C.jacket), { a: .55, j: 2, layers: 2, edge: .4 }); pen(poly([[970, -282], [990, 0], [990, 272]]), { w: 3 }); pen(poly([[1080, -270], [1080, 262]]), { w: 3 });
  // wrist + back of the hand leaving the frame
  const sk = poly([[1080, -220], [1500, -200], [1640, -250], [1900, -250], [1960, 240], [1500, 220], [1080, 226]]);
  reserve(cx, sk, 1, 0); wsh(sk, C.skin, { a: .5, j: 3, layers: 3, edge: .3, dx: 3, dy: 2 }); wsh(poly([[1080, 90], [1960, 90], [1960, 240], [1080, 226]]), shadeCol(C.skin), { a: .3, j: 4, layers: 2, edge: .2 });
  pen(poly([[1080, -222], [1500, -202], [1640, -252], [1960, -252]]), { w: 3.2, gap: .3 }); pen(poly([[1080, 228], [1500, 222], [1960, 242]]), { w: 3.6 });
  pen(poly([[1560, -190], [1700, -150], [1900, -160]]), { w: 2, gap: .5, alpha: .8 });
  // strap, case, dial (left as paper), indices, crown
  const stp = poly([[1080, -250], [1260, -250], [1260, 250], [1080, 250]]); wsh(stp, C.strap, { a: .62, j: 2, layers: 2, edge: .4 }); pen(poly([[1080, -250], [1080, 250]]), { w: 2.6 }); pen(poly([[1260, -250], [1260, 250]]), { w: 2.6 });
  for (const q of [-200, 180]) ln(AP(1140, q), AP(1200, q), { w: 2 });
  const cs = ellipse(WC[0], WC[1], WR, WR, 48); eraseInk(ellipse(WC[0], WC[1], WR + 4, WR + 4, 48)); reserve(cx, cs, 1, 0); wsh(cs, C.gold, { a: .65, j: 2, layers: 3, edge: .45, dx: 3, dy: 3 });
  const dl = ellipse(WC[0], WC[1], WR - 34, WR - 34, 48); reserve(cx, dl, 1, 0); wsh(dl, C.cream, { a: .3, j: 2, layers: 2, edge: .3 });
  wsh(ellipse(WC[0] + 60, WC[1] + 70, WR * .7, WR * .5, 24, .4), hex('#c8b090'), { a: .2, j: 10, layers: 2, edge: 0 });
  pen(ellipse(WC[0], WC[1], WR, WR, 48).concat([ellipse(WC[0], WC[1], WR, WR, 48)[0]]), { w: 3.6, gap: .4, over: 10 }); pen(ellipse(WC[0], WC[1], WR - 34, WR - 34, 44).slice(0, 40), { w: 2.4, gap: .4, over: 8 });
  for (let k = 0; k < 12; k++) { const d = handDir(k / 12), r0 = k % 3 ? 216 : 196, r1 = 244; ln([WC[0] + d[0] * r0, WC[1] + d[1] * r0], [WC[0] + d[0] * r1, WC[1] + d[1] * r1], { w: k % 3 ? 3 : 5, over: 1, gap: 0 }); }
  const cr = [WC[0] + AU[0] * (WR + 20), WC[1] + AU[1] * (WR + 20)]; const crp = ellipse(cr[0], cr[1], 22, 30, 12, ANG3); wsh(crp, C.gold, { a: .6, j: 1, layers: 2, edge: .4 }); pen(crp.concat([crp[0]]), { w: 2.2, smooth: true });
  // raindrops on the crystal: an ink ring, a shadow on the dial, a reserved highlight
  for (const [dx, dy, r] of [[-120, 90, 22], [100, -150, 16], [150, 100, 28], [-40, -60, 12], [30, 180, 15]]) { const c = [WC[0] + dx, WC[1] + dy];
    wsh(ellipse(c[0] + 4, c[1] + 6, r, r * .9, 14), hex('#a89878'), { a: .35, j: 1, layers: 1, edge: .5 }); pen(ellipse(c[0], c[1], r, r * .9, 14).slice(3, 13), { w: 1.6, over: 1, gap: 0 }); reserve(cx, ellipse(c[0] - r * .35, c[1] - r * .35, r * .3, r * .22, 8), .95, 0); }
}
// the sky vignette (S4), page px
const CLK = [V4[0] + 290, V4[1] + 40, 70];
function drawSky() {
  const R = mulberry(444), x0 = V4[0] - 1000, x1 = V4[0] + 1000, yT = V4[1] - 660, base = V4[1] + 440;
  for (let i = 0; i < 70; i++) { const x = x0 + R() * (x1 - x0), y = yT + R() * (base - yT - 100), rx = 220 + R() * 320;
    wsh(ellipse(x, y, rx, rx * (.3 + R() * .25), 22, R()), y < V4[1] - 200 ? C.indigoD : C.indigo, { a: .2 + R() * .1, j: rx * .14, layers: 3, edge: .12, freq: .006 }); }
  for (let i = 0; i < 12; i++) wsh(ellipse(x0 + R() * (x1 - x0), base - 120 - R() * 200, 300 + R() * 200, 70 + R() * 40, 20, 0), hex('#c8789a'), { a: .18, j: 40, layers: 2, edge: .1, freq: .006 });   // city glow
  // clouds: reserved paper with a tinted belly, a light ink edge on top
  for (const [x, y, rx, ry] of [[x0 + 300, yT + 190, 250, 60], [x0 + 950, yT + 120, 300, 70], [x0 + 1580, yT + 300, 260, 60], [x0 + 620, yT + 470, 280, 55], [x0 + 1700, yT + 560, 220, 48]]) {
    const puff = []; for (let k = 0; k < 9; k++) { const a = Math.PI + k / 8 * Math.PI; puff.push([x + Math.cos(a) * rx * (.85 + .3 * R()), y + Math.sin(a) * ry * (1.2 + .6 * R())]); } puff.push([x + rx * .9, y + ry * .35], [x - rx * .9, y + ry * .35]);
    const cl = spline(puff, 4, true); reserve(cx, cl, .55, 8, SEED++); wsh(cl.filter(p => p[1] > y - ry * .2), hex('#b07aa0'), { a: .34, j: 8, layers: 2, edge: .25 }); pen(cl.slice(0, (cl.length * .55) | 0), { w: 1.6, gap: .5, alpha: .75 }); }
  // city tops: ink outlines, haze-mixed washes, lit windows as warm dabs
  let x = x0; while (x < x1) { const w = 140 + R() * 220, top = base - 60 - R() * 200, kind = R();
    if (Math.abs(x + w / 2 - CLK[0]) < 120) { x += w; continue; }
    wsh(rect(x, top, x + w, base + 200), mix3(C.violet, C.indigoD, .5), { a: .5, j: 3, layers: 2, edge: .3 });
    pen(kind < .3 ? [[x, base + 60], [x, top], [x + w / 2, top - w * .3], [x + w, top], [x + w, base + 60]] : [[x, base + 60], [x, top], [x + w, top], [x + w, base + 60]], { w: 2, smooth: false, gap: .4 });
    if (kind > .7) pen([[x + w * .6, top], [x + w * .6, top - 80]], { w: 1.4, smooth: false });
    for (let yy = top + 30; yy < base + 180; yy += 46) for (let xx = x + 16; xx < x + w - 24; xx += 34) if (R() < .3) wsh(rect(xx, yy, xx + 14, yy + 20), C.win, { a: .7, j: 1.5, layers: 1, edge: .3 });
    x += w + R() * 30; }
  // the station clock tower
  const [cx_, cy_, cr] = CLK, tw = rect(cx_ - 110, cy_ - 100, cx_ + 110, base + 200);
  reserve(cx, tw, 1, 0); wsh(tw, mix3(C.violet, C.indigoD, .4), { a: .55, j: 3, layers: 2, edge: .3 }); wsh(rect(cx_ + 30, cy_ - 100, cx_ + 110, base + 200), C.indigoD, { a: .3, j: 3, layers: 2, edge: .2 });
  pen([[cx_ - 110, base + 100], [cx_ - 110, cy_ - 100], [cx_ + 110, cy_ - 100], [cx_ + 110, base + 100]], { w: 2.4, smooth: false });
  reserve(cx, [[cx_ - 130, cy_ - 100], [cx_, cy_ - 260], [cx_ + 130, cy_ - 100]], 1, 0); pen([[cx_ - 130, cy_ - 100], [cx_, cy_ - 260], [cx_ + 130, cy_ - 100]], { w: 2.4, smooth: false }); wsh([[cx_ - 130, cy_ - 100], [cx_, cy_ - 260], [cx_ + 130, cy_ - 100]], C.indigoD, { a: .45, j: 2, layers: 2, edge: .3 });
  const dial = ellipse(cx_, cy_, cr, cr, 32); reserve(cx, dial, 1, 0); wsh(dial, hex('#f0c870'), { a: .55, j: 2, layers: 2, edge: .3 });   // revealed on the chime
  pen(dial.concat([dial[0]]), { w: 2.4, over: 4, gap: .2 });
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; ln([cx_ + Math.cos(a) * (cr - 14), cy_ + Math.sin(a) * (cr - 14)], [cx_ + Math.cos(a) * (cr - 5), cy_ + Math.sin(a) * (cr - 5)], { w: 2, over: 0, gap: 0 }); }
  const hd = (f, L, w) => { const a = f * TAU - Math.PI / 2; ln([cx_, cy_], [cx_ + Math.cos(a) * L, cy_ + Math.sin(a) * L], { w, over: 1, gap: 0 }); };
  hd((11 + 58 / 60) / 12, cr * .5, 3.4); hd(58 / 60, cr * .78, 2.4);
  // a corner note in the margin, as urban sketchers write it
  for (const [q, st] of [[ia, '#000'], [ta, 'rgb(1,1,1)']]) { q.save(); q.font = '500 46px Caveat'; q.textAlign = 'left'; q.fillStyle = st; q.fillText('23:58 · rain · the last train', V4[0] - 920, V4[1] + 640); q.restore(); }
}
// the page's edges: each drawing frays into dabs and white holes
function fray(x0, y0, x1, y1, cols, n = 300) {
  const R = mulberry(Math.round(x0 + y0));
  for (let i = 0; i < n; i++) { const side = (R() * 4) | 0, u = R(), d = (R() - .3) * 90;
    const [x, y] = side === 0 ? [lerp(x0, x1, u), y0 - d] : side === 1 ? [lerp(x0, x1, u), y1 + d] : side === 2 ? [x0 - d, lerp(y0, y1, u)] : [x1 + d, lerp(y0, y1, u)];
    if (d < 0) reserve(cx, ellipse(x, y, 8 + R() * 18, 6 + R() * 12, 9, R()), .9, 3, SEED++); else dab(cx, x, y, 4 + R() * 10, R() * 3, cols[(R() * cols.length) | 0], .25 + R() * .25, SEED++); }
}

// ——— the arrival field: colour already on the page, except what an event brings ———
const SPLP = SP1([SPL.x + 12, 10]);
const inRing = (x, y) => { const [wx, wy] = [(x - V1[0]) / K1 + SPL.x, (y - V1[1]) / K1 - 90]; return !inPudW(wx, wy, 1.02) && inPudW(wx, wy, 3.4) && wy > -16; };
const inDial = (x, y) => Math.hypot(x - CLK[0], y - CLK[1]) < CLK[2] + 6;

// ——— AKI, sketched ———
function tube(pts, rad) {
  const n = pts.length, L = [], Rt = [];
  for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; L.push([pts[i][0] + nx * rad[i], pts[i][1] + ny * rad[i]]); Rt.push([pts[i][0] - nx * rad[i], pts[i][1] - ny * rad[i]]); }
  const cap = (c, r, a0) => [...Array(7)].map((_, k) => { const a = a0 - Math.PI * (k + 1) / 8; return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]; });
  const e = pts[n - 1], e2 = pts[n - 2], s0 = pts[0], s1 = pts[1];
  const poly = [...L, ...cap(e, rad[n - 1], Math.atan2(e[1] - e2[1], e[0] - e2[0]) + Math.PI / 2), ...Rt.slice().reverse(), ...cap(s0, rad[0], Math.atan2(s0[1] - s1[1], s0[0] - s1[0]) + Math.PI / 2)];
  return { poly, L, R: Rt };
}
function akiPrims(J, M, k, o = {}) {
  const lw = o.lw ?? 2.2, sd0 = 900 + (o.boil ?? 0) * 101, prims = []; let si = 0;
  const uL = J.uL, fL = J.fL, T = (b, u, f) => [b[0] + uL[0] * u + fL[0] * f, b[1] + uL[1] * u + fL[1] * f];
  const part = (pts, radii, col, dark = 1) => { const sd = sd0 + (si++) * 17, Pm = pts.map(M), t = tube(Pm, radii.map(r => r * k)), lit = t.L, dk = t.R;
    prims.push({ k: 'knock', poly: t.poly }, { k: 'wash', poly: t.poly, col: mix3(col, [60, 60, 90], 1 - dark), a: .62, seed: sd, dx: lw * .7, dy: lw * .4 });
    prims.push({ k: 'wash', poly: [...Pm, ...dk.slice().reverse()], col: shadeCol(col), a: .3, seed: sd + 2, j: 1.2 });
    prims.push({ k: 'ink', st: penStroke(lit, { w: lw * .9, wob: lw * .35, seed: sd, gap: .4, over: lw * 2 }) }, { k: 'ink', st: penStroke(dk, { w: lw * 1.1, wob: lw * .35, seed: sd + 1, over: lw * 2 }) }); };
  const limbArm = (a, dark) => { const u = [(a.wr[0] - a.el[0]), (a.wr[1] - a.el[1])], d = Math.hypot(...u) || 1, ue = [u[0] / d, u[1] / d];
    part([a.sh, a.el, [a.wr[0] - ue[0] * 6, a.wr[1] - ue[1] * 6]], [18, 16, 15], C.jacket, dark);
    const hc = M([a.wr[0] + ue[0] * 16, a.wr[1] + ue[1] * 16]), hr = 15 * k, h = ellipse(hc[0], hc[1], hr * 1.2, hr * .9, 10, Math.atan2(ue[1], ue[0]));
    prims.push({ k: 'knock', poly: h }, { k: 'wash', poly: h, col: C.skin, a: .5, seed: sd0 + 400 + si }, { k: 'ink', st: penStroke(h.slice(0, 7), { w: lw * .8, wob: lw * .2, seed: sd0 + 401 + si, smooth: false, over: 1 }) }); return ue; };
  const limbLeg = (l, dark) => { part([l.hip, l.knee, l.ankle], [27, 21, 17], C.trousers, dark);
    const c = Math.cos(l.pitch), s = Math.sin(l.pitch), F = ([u, v]) => [l.ankle[0] + u * c - v * s, l.ankle[1] + u * s + v * c];
    const kn = [(l.knee[0] - l.ankle[0]), (l.knee[1] - l.ankle[1])], kd = Math.hypot(...kn) || 1;
    part([[l.ankle[0] + kn[0] / kd * 46, l.ankle[1] + kn[1] / kd * 46], l.ankle, F([30, 12]), F([62, 12])], [19, 18, 15, 12], C.boots, dark); };
  limbArm(J.arm.f, .72); limbLeg(J.leg.f, .72);
  // hair hanging behind (streams back with the run)
  const lag = o.hair || [0, 0], lx = clamp(lag[0] * .45, -30, 8), ly = clamp(lag[1] * .35, -12, 14), hc = J.headC, HR = p => { const q = [p[0] * Math.cos(J.headA) - p[1] * Math.sin(J.headA), p[0] * Math.sin(J.headA) + p[1] * Math.cos(J.headA)]; return [hc[0] + q[0], hc[1] + q[1]]; };
  const hb = spline([HR([-6, -46]), HR([-40, -30]), HR([-54 + lx * .5, 10 + ly * .4]), HR([-58 + lx, 52 + ly]), HR([-40 + lx * .8, 60 + ly]), HR([-20, 40]), HR([-14, 0])].map(M), 4, true);
  const sdh = sd0 + 600; prims.push({ k: 'knock', poly: hb }, { k: 'wash', poly: hb, col: C.hair, a: .78, seed: sdh, j: 2 }, { k: 'ink', st: penStroke(hb.slice(2, (hb.length * .7) | 0), { w: lw, wob: lw * .5, seed: sdh + 1, over: lw * 2 }) });
  limbLeg(J.leg.n, 1);
  // the jacket: one torso shape, the hem trailing, a shadow band in front, the zip line
  const hm = o.hemB || [0, 0], tp = [T(J.neckBase, 6, -28), T(J.neckBase, -30, -44), T(J.waist, 0, -46), T(J.pelvis, -40, -48), [T(J.pelvis, -86, -52)[0] + hm[0], T(J.pelvis, -86, -52)[1] + hm[1]], T(J.pelvis, -90, 0), T(J.pelvis, -84, 44), T(J.waist, 0, 40), T(J.neckBase, -30, 36), T(J.neckBase, 6, 24)].map(M);
  const torso = spline(tp, 4, true), sdt = sd0 + 700;
  prims.push({ k: 'knock', poly: torso }, { k: 'wash', poly: torso, col: C.jacket, a: .64, seed: sdt, dx: lw * .8, dy: lw * .4 });
  prims.push({ k: 'wash', poly: spline([T(J.neckBase, -24, 18), T(J.pelvis, -80, 24), T(J.pelvis, -84, 44), T(J.neckBase, -30, 36)].map(M), 3, true), col: shadeCol(C.jacket), a: .32, seed: sdt + 1 });
  prims.push({ k: 'ink', st: penStroke(torso.slice(0, (torso.length * .5) | 0), { w: lw, wob: lw * .4, seed: sdt + 2, gap: .3, over: lw * 2 }) }, { k: 'ink', st: penStroke(torso.slice((torso.length * .45) | 0), { w: lw * 1.1, wob: lw * .4, seed: sdt + 3, over: lw * 2 }) });
  prims.push({ k: 'ink', st: penStroke([T(J.neckBase, -26, 30), T(J.waist, 0, 32), T(J.pelvis, -76, 34)].map(M), { w: lw * .6, wob: lw * .3, seed: sdt + 4, gap: .5, over: 0 }), alpha: .7 });
  const col = ellipse(...M(T(J.neckBase, 8, 4)), 22 * k, 14 * k, 10, Math.atan2(fL[1], fL[0])); prims.push({ k: 'knock', poly: col }, { k: 'wash', poly: col, col: C.sweater, a: .4, seed: sdt + 5 }, { k: 'ink', st: penStroke(col.slice(0, 7), { w: lw * .7, seed: sdt + 6, over: 1 }) });
  // head: paper-coloured face, skin wash, hair cap + bangs, one nose tick in profile (the style leaves the face blank)
  const hcP = M(HR([2, -2])), r = 42 * k, circ = ellipse(hcP[0], hcP[1], r * .93, r, 20), sd = sd0 + 800;
  prims.push({ k: 'knock', poly: circ }, { k: 'wash', poly: circ, col: C.skin, a: .5, seed: sd, dx: lw * .5 });
  const cap = spline([HR([-44, 10]), HR([-46, -24]), HR([-20, -48]), HR([14, -48]), HR([38, -30]), HR([34, -20]), HR([6, -30]), HR([-14, -8]), HR([-24, 18])].map(M), 4, true);
  prims.push({ k: 'knock', poly: cap, a: .5 }, { k: 'wash', poly: cap, col: C.hair, a: .8, seed: sd + 1, j: 1.2 });
  prims.push({ k: 'ink', st: penStroke(cap.slice(0, (cap.length * .65) | 0), { w: lw, wob: lw * .35, seed: sd + 4, smooth: false, over: lw * 2 }) });
  prims.push({ k: 'ink', st: penStroke(circ.slice(2, 12), { w: lw * .9, wob: lw * .3, seed: sd + 5, smooth: false, over: lw }) });
  prims.push({ k: 'ink', st: penStroke([HR([38, -10]), HR([46, 2]), HR([38, 8])].map(M), { w: lw * .8, wob: lw * .2, seed: sd + 3, over: 1 }) });
  const ue = limbArm(J.arm.n, 1);
  if (o.watch !== false) { const wp = M([J.arm.n.wr[0] + ue[0] * 2, J.arm.n.wr[1] + ue[1] * 2]), we = ellipse(wp[0], wp[1], 7 * k, 7 * k, 10); prims.push({ k: 'wash', poly: we, col: C.gold, a: .8, seed: sd + 9 }, { k: 'ink', st: penStroke(we.concat([we[0]]), { w: lw * .6, seed: sd + 10, over: 0 }) }); }
  return prims;
}

// ——— live marks ———
let ctx, comp, glc, toothPat;
function rainLines(t, x0, y0, x1, y1, n, ang, seed, w = 1.3, a = .55) {   // rain: short ink dashes falling (new marks each frame, fixed per-drop seeds)
  ctx.save(); ctx.strokeStyle = rgba(INK, a); ctx.lineCap = 'round';
  const dx = Math.cos(ang), dy = Math.sin(ang), span = (y1 - y0) * 1.3;
  for (let i = 0; i < n; i++) { const r1 = hash(i * 1.37 + seed), r2 = hash(i * 7.11 + seed), v = 1500 + r2 * 900, L = 26 + r1 * 40, d = ((r2 * span + v * t) % span), x = x0 + r1 * (x1 - x0) * 1.2 - (x1 - x0) * .1 + dx * d, y = y0 - (y1 - y0) * .15 + dy * d;
    if (x < x0 || x > x1 || y > y1) continue; ctx.lineWidth = w * (.7 + r2 * .6); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx * L, y + dy * L); ctx.stroke(); }
  ctx.restore();
}
function inkRing(x, y, rx, ry, a, seed, w = 1.4, part = 1) { const e = ellipse(x, y, rx, ry, 24, hash(seed) * TAU).slice(0, Math.max(3, Math.round(24 * part))); drawPen(ctx, penStroke(e, { w, wob: .5, seed, over: 2, gap: .3 }), 1, INK, a); }
function splashS1(t) {
  const a = t - EV.splash; if (a < 0) return; const [sx, sy] = SPLP;
  for (let i = 0; i < 3; i++) { const ai = a - i * .14; if (ai < 0 || ai > 1.5) continue; inkRing(sx, sy + 30, (40 + ai * 520), (40 + ai * 520) * .2, .75 * (1 - ai / 1.5), 40 + i, 2.2, .85); }
  if (a < .45) for (let j = 0; j < 11; j++) { const th = (j / 11 - .5) * Math.PI * .9, k = eo(a / .18), fall = clamp((a - .2) / .25), L = (60 + 90 * hash(j)) * k * (1 - fall); if (L < 6) continue;
    const bx = sx + Math.sin(th) * (50 + 120 * k), by = sy + 8, ang = -Math.PI / 2 + Math.sin(th) * .9, p = [[bx, by], [bx + Math.cos(ang) * L * .6 + Math.sin(th) * 10, by + Math.sin(ang) * L * .6], [bx + Math.cos(ang) * L, by + Math.sin(ang) * L + L * .15]];
    drawPen(ctx, penStroke(p, { w: 2.2, wob: .6, seed: 700 + j, over: 2 }), 1, INK, .85); }
  if (a < .8) for (let j = 0; j < 22; j++) { const th = -Math.PI / 2 + (hash(j * 1.7) - .5) * 2.4, v = (420 + hash(j * 3.1) * 620) * K1, a2 = a + .025, px = sx + Math.cos(th) * v * a2, py = sy + Math.sin(th) * v * a2 + 1700 * K1 * a2 * a2; if (py > sy + 30) continue;
    const r = 4 + hash(j * 5) * 6; ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = rgba(mix3(C.indigo, [255, 255, 255], .5), .5); ctx.beginPath(); ctx.ellipse(px + 2, py + 2, r, r * .9, 0, 0, TAU); ctx.fill(); ctx.restore(); inkRing(px, py, r, r * .9, .8, 800 + j, 1.4, .75); }
}
function smallSplash(x, y, a, s, seed) { if (a < 0 || a > .45) return; inkRing(x, y + 6 * s, (14 + a * 120) * s, (14 + a * 120) * s * .22, .7 * (1 - a / .45), seed, 1.3 * s, .8);
  for (let j = 0; j < 6; j++) { const th = -Math.PI / 2 + (hash(j + seed) - .5) * 2.2, v = (150 + hash(j * 3 + seed) * 200) * s, px = x + Math.cos(th) * v * a, py = y + Math.sin(th) * v * a + 1400 * s * a * a; if (py > y + 4) continue; inkRing(px, py, 3 * s, 2.6 * s, .8, seed * 9 + j, 1.1, .8); } }
// the mirrored signs in the puddle, sliced and shifted by the ripples (a live wash: water moves)
let mirror;
let splashC, SPO;
function buildSplashColour() {   // the colour thrown out by the splash: reflected light on the wet stone, blooming from the boot
  SPO = [V1[0] - 1100, V1[1] - 120]; const [c, q] = cv(2300, 760, '#fff'), R = mulberry(4242);
  q.translate(-SPO[0], -SPO[1]);
  for (let i = 0; i < 220; i++) { const a = R() * TAU, k = 1.05 + R() * .75, x = PX + Math.cos(a) * PRX * k, y = PY + Math.sin(a) * PRY * k * 1.4; if (y < -16) continue;
    dab(q, ...SP1([x, y]), 6 + R() * 14, R() * 3, [C.pink, C.amber, C.pink, C.teal, C.win][(R() * 5) | 0], .3 + R() * .32, 7000 + i); }
  splashC = c;
}
function splashBloom(t) {
  const a = t - EV.splash - .03; if (a <= 0) return; const R = 1100 * eo(a / 1.1), [sx, sy] = SPLP;
  const path = q => { q.beginPath(); for (let i = 0; i <= 40; i++) { const th = i / 40 * TAU, r = R * (.8 + .4 * n2(Math.cos(th) * 2 + 3, Math.sin(th) * 2, 3)); const x = sx + Math.cos(th) * r, y = sy + Math.sin(th) * r * .42; i ? q.lineTo(x, y) : q.moveTo(x, y); } q.closePath(); };
  ctx.save(); path(ctx); ctx.clip(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(splashC, SPO[0], SPO[1]); ctx.restore();
  if (a < 1.1) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.strokeStyle = rgba(mix3(C.pink, C.indigo, .5), .22 * (1 - a / 1.1)); ctx.lineWidth = 7; path(ctx); ctx.stroke(); ctx.restore(); }   // the wet front
}
function buildMirror() {
  const [c, q] = cv(1400, 260); q.translate(0, 0); q.scale(1, -1); q.textAlign = 'center'; q.font = '700 150px Caveat';
  q.fillStyle = rgba(C.pink, .8); q.fillText('24H', 330, -40); q.fillStyle = rgba(C.amber, .8); q.fillText('CAFE', 1000, -40);
  q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'destination-out'; q.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i < 40; i++) q.fillRect(hash(i) * 1400, hash(i * 3) * 260, 60 + hash(i * 7) * 120, 6);
  mirror = c;
  const [k2, q2] = cv(1400, 260); q2.drawImage(c, 0, 0); q2.globalCompositeOperation = 'source-in'; q2.fillStyle = rgba(PAPER, 1); q2.fillRect(0, 0, 1400, 260); knockM = k2;
}
let knockM;
function puddleLive(t) {
  const pud = ellipse(...SP1([PX, PY]), PRX * K1 * .96, PRY * K1 * .9, 40), [mx, my] = SP1([PX - 340, 6]);
  ctx.save(); ctx.beginPath(); pud.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.clip(); ctx.globalCompositeOperation = 'multiply';
  for (let y = 0; y < 260; y += 9) { let dx = 5 * Math.sin(y * .2 + t * 6.5) + 2 * Math.sin(y * .55 - t * 9.2);
    if (t > EV.splash) { const a = t - EV.splash, rr = Math.abs((y - 40) * 3.2), front = a * 430 * K1; dx += 46 * Math.exp(-a * 1.5) * Math.sin(rr * .025 - a * 13) * clamp((front + 60 - rr) / 120); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = .7; ctx.drawImage(knockM, 0, y, 1400, 9, mx + dx, my + y, 1400, 9);
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 1; ctx.drawImage(mirror, 0, y, 1400, 9, mx + dx, my + y, 1400, 9); }
  ctx.restore();
  for (let i = 0; i < 14; i++) { const per = .55 + hash(i * 1.3 + 3) * .4, off = hash(i * 7.7 + 3) * per, cyc = Math.floor((t + off) / per), ph = ((t + off) % per) / per;
    const wx = PX + (hash(i * 3.3 + cyc * 1.91) - .5) * PRX * 1.6, wy = PY + (hash(i * 5.1 + cyc * .77) - .5) * PRY * 1.4; if (!inPudW(wx, wy, .8)) continue;
    const [x, y] = SP1([wx, wy]), rr = (6 + ph * 50) * K1; inkRing(x, y, rr, rr * .26, .5 * (1 - ph), i * 31 + cyc, 1.4, .9); }
}
let sk, skx;
function streaks(t, cam) {   // the street rushing past behind the wrist: wash smears and ink speed lines moving left, kept behind the arm
  const a = t - 7.5, cols = [C.amber, C.pink, C.teal, C.win, C.violet], main = ctx;
  if (!sk) { [sk, skx] = cv(VW, VH); }
  skx.setTransform(1, 0, 0, 1, 0, 0); skx.globalCompositeOperation = 'source-over'; skx.fillStyle = '#fff'; skx.fillRect(0, 0, VW, VH);
  const c = Math.cos(cam.rot), s = Math.sin(cam.rot); skx.setTransform(cam.z * c, cam.z * s, -cam.z * s, cam.z * c, 960 - cam.z * (c * cam.cx - s * cam.cy), 540 - cam.z * (s * cam.cx + c * cam.cy));
  ctx = skx; ctx.save(); ctx.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 18; i++) { const v = 900 + hash(i * 1.3) * 900, x = V3[0] - 1300 + ((hash(i * 4.4) * 3200 - v * a) % 3200 + 3200) % 3200, y = V3[1] - 520 + hash(i * 6.6) * 1040, L = 200 + v * .3;
    wash(ctx, [[x, y - 14], [x + L, y - 8], [x + L, y + 8], [x, y + 14]], cols[i % 5], { a: .45, j: 4, layers: 2, edge: .3, seed: 50 + i + boilOf(t) * 3 }); }
  ctx.restore();
  for (let i = 0; i < 30; i++) { const v = 1800 + hash(i * 2.9) * 1600, x = V3[0] - 1300 + ((hash(i * 7.7) * 3400 - v * a) % 3400 + 3400) % 3400, y = V3[1] - 530 + hash(i * 3.3) * 1060, L = 120 + v * .12;
    drawPen(ctx, penStroke([[x, y], [x + L, y + (hash(i) - .5) * 6]], { w: 1.4, wob: .5, seed: 900 + i + boilOf(t), over: 2, smooth: false }), 1, INK, .55); }
  skx.save(); skx.globalCompositeOperation = 'source-over'; skx.fillStyle = '#fff'; skx.beginPath(); ARM.forEach((p, i) => i ? skx.lineTo(...p) : skx.moveTo(...p)); skx.closePath(); skx.fill(); skx.beginPath(); skx.arc(WC[0], WC[1], WR + 2, 0, TAU); skx.fill(); skx.restore();
  ctx = main; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(sk, 0, 0); ctx.restore();
}
const secAt = t => { const k = t < 7.9 ? 47 : t < 8.9 ? 48 : 49, t0 = t < 7.9 ? 6.9 : t < 8.9 ? 7.9 : 8.9, a = t - t0; return k - 1 + (a < .14 ? back(a / .14, 2.4) : 1); };
function watchHands(t) {
  const hand = (f, r0, r1, w) => { const d = handDir(f); drawPen(ctx, penStroke([[WC[0] - d[0] * r0, WC[1] - d[1] * r0], [WC[0] + d[0] * r1, WC[1] + d[1] * r1]], { w, wob: .3, seed: 3 + w, over: 0, smooth: false }), 1, INK, 1); };
  hand((11 + 58 / 60) / 12, 26, 140, 7); hand(58 / 60, 30, 216, 5);
  const s = secAt(t) / 60, d = handDir(s); drawPen(ctx, penStroke([[WC[0] - d[0] * 56, WC[1] - d[1] * 56], [WC[0] + d[0] * 232, WC[1] + d[1] * 232]], { w: 2, wob: .2, seed: 5, over: 0, smooth: false }), 1, [150, 40, 34], 1);
  ctx.save(); ctx.fillStyle = rgba(C.gold, .9); ctx.beginPath(); ctx.arc(WC[0], WC[1], 12, 0, TAU); ctx.fill(); ctx.restore(); inkRing(WC[0], WC[1], 12, 12, 1, 9, 1.6, 1);
}

// ——— frame ———
function figureAt(t) { const S = poseAt(t), J = solveProfile(S), sc = secondary(q => { const p = RUN.pelvisAt(q); return [p[0], p[1] - 250]; }, 0, t); return { S, J, sc }; }
function render(t) {
  const cam = camera(t), id = shotAt(t)[2];
  comp(cam, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(glc, 0, 0);
  const c = Math.cos(cam.rot), s = Math.sin(cam.rot); ctx.setTransform(cam.z * c, cam.z * s, -cam.z * s, cam.z * c, 960 - cam.z * (c * cam.cx - s * cam.cy), 540 - cam.z * (s * cam.cx + c * cam.cy));
  const boil = boilOf(t);
  const near = (v) => Math.abs(v.cx - cam.cx) < 2400 && Math.abs(v.cy - cam.cy) < 1500;
  // S1 puddle vignette
  if (near({ cx: V1[0], cy: V1[1] })) {
    splashBloom(t); puddleLive(t);
    if (t > .45 && t < 1.75) { const { J, sc } = figureAt(t);
      ctx.save(); const pud = ellipse(...SP1([PX, PY]), PRX * K1 * .96, PRY * K1 * .9, 40); ctx.beginPath(); pud.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.clip();
      const g = SP1([0, 4])[1]; ctx.transform(1, 0, 0, -.62, 0, g * 1.62); drawPrims(ctx, akiPrims(J, SP1, K1, { lw: 3.4, boil, hemB: sc.hemB, hair: sc.hair.back, watch: false }), { color: .45, ink: 0, noKnock: true }); ctx.restore();
      drawPrims(ctx, akiPrims(J, SP1, K1, { lw: 3.6, boil, hemB: sc.hemB, hair: sc.hair.back }), {}); }
    splashS1(t);
    for (const cn of RUN.contacts) if (cn !== SPL && t >= cn.t0 && t < cn.t0 + .45) { const [x, y] = SP1([cn.x, 0]); if (Math.abs(x - V1[0]) < 1200) smallSplash(x, y, t - cn.t0, 2, (cn.t0 * 10) | 0); }
    rainLines(t, V1[0] - 1050, V1[1] - 600, V1[0] + 1150, V1[1] + 600, 120, 1.68, 1, 1.8, .45);
  }
  // S2 street band
  if (cam.cy < 1500) {
    const { J, sc } = figureAt(t), blink = 0;
    const refl = SP([J.pelvis[0], 30]); ctx.save(); ctx.globalCompositeOperation = 'multiply';
    for (let k = 0; k < 6; k++) wash(ctx, ellipse(refl[0] + (hash(k * 3.3) - .5) * 14, refl[1] + 8 + k * 28, 26 - k * 2, 7, 12, 0), k < 2 ? C.boots : k < 4 ? C.trousers : C.jacket, { a: .3 - k * .03, j: 3, layers: 2, edge: .3, seed: 60 + k + boil }); ctx.restore();
    drawPrims(ctx, akiPrims(J, SP, KS, { lw: 2.2, boil, hemB: sc.hemB, hair: sc.hair.back }), {});
    for (const cn of RUN.contacts) if (t >= cn.t0 && t < cn.t0 + .45) { const [x, y] = SP([cn.x, 0]); smallSplash(x, y, t - cn.t0, 1, (cn.t0 * 10) | 0); }
    for (const p of PUD2) { const [x, y] = SP([p.x, p.y]); if (Math.abs(x - cam.cx) > 1100) continue; for (let i = 0; i < 3; i++) { const per = .7, ph = ((t + hash(p.x + i) * per) % per) / per, cyc = Math.floor((t + hash(p.x + i) * per) / per); inkRing(x + (hash(p.x * 3 + i + cyc) - .5) * p.rx * KS, y + (hash(p.x * 5 + i + cyc) - .5) * p.ry * KS * .8, (4 + ph * 30), (4 + ph * 30) * .26, .5 * (1 - ph), (p.x | 0) + i + cyc * 7, 1.1, .9); } }
    rainLines(t, cam.cx - 1000, 0, cam.cx + 1000, 1130, 220, 1.95, 3, 1.2, .5);
  }
  // S3 watch vignette
  if (t > 7.5 && t < 9.375 + TRAV) { streaks(t, cam); watchHands(t); rainLines(t, V3[0] - 1000, V3[1] - 560, V3[0] + 1000, V3[1] + 560, 70, 2.2, 5, 1.3, .4); }
  // S4 sky vignette
  if (t > 9.375) { rainLines(t, V4[0] - 1000, V4[1] - 900, V4[0] + 1000, V4[1] + 700, 200, 1.72, 7, 1.2, .5);
    const ch = t - EV.chime; if (ch > 0 && ch < .5) for (let i = 0; i < 3; i++) { const rr = CLK[2] + 20 + (ch - i * .08) * 260; if (ch - i * .08 > 0) inkRing(CLK[0], CLK[1], rr, rr, .55 * (1 - ch / .5), 970 + i, 1.6, .8); } }
  // paper tooth over everything, figures included
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = toothPat; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillRect(0, 0, VW, VH); ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

async function setup() {
  await document.fonts.load('700 80px Caveat'); await document.fonts.load('500 40px Caveat');
  let colC_; [colC_, cx] = cv(W, H, '#fff'); colC = colC_;
  const [inkC, iax] = cv(W, H), [timeC, tax] = cv(W, H, '#fff'); ia = iax; ta = tax; ta.globalCompositeOperation = 'darken';
  drawStreet(); drawPuddle(); drawWatch(); drawSky();
  fray(-40, -40, W + 40, 1215, [C.indigo, C.win, C.pink], 160);
  fray(V1[0] - 1060, V1[1] - 630, V1[0] + 1160, V1[1] + 630, [C.win, C.pink, C.pave], 140);
  fray(V3[0] - 1060, V3[1] - 640, V3[0] + 1060, V3[1] + 640, [C.jacket, C.indigo, C.amber], 140);
  fray(V4[0] - 1010, V4[1] - 670, V4[0] + 1010, V4[1] + 600, [C.indigo, C.win, hex('#c8789a')], 140);
  // pack ink + time (one ink layer: layer B unused)
  const ink = new Uint8Array(W * H * 4), time = new Uint8Array(W * H * 4), A = ia.getImageData(0, 0, W, H).data, Tm = ta.getImageData(0, 0, W, H).data;
  for (let i = 0, n = W * H; i < n; i++) { ink[i * 4] = A[i * 4 + 3]; ink[i * 4 + 3] = 255; time[i * 4] = Tm[i * 4]; time[i * 4 + 1] = 255; time[i * 4 + 3] = 255; }
  const GW = 1000, GH = 325;
  const arr = arrivalField(W, H, GW, GH, [
    { x: W / 2, y: H / 2, t: -10, v: 1e7, R: 1e6, hard: true, noise: 0, mask: (x, y) => !inDial(x, y) },
    { x: CLK[0], y: CLK[1], t: EV.chime, v: 360, R: 90, mask: inDial, noise: .2 }], { amp: 120 });
  glc = document.createElement('canvas'); glc.width = VW; glc.height = VH;
  comp = compositor(glc, { W, H, color: colC, ink, time, winA: WIN, winB: [0, 5], arr, gw: GW, gh: GH });
  ctx = document.getElementById('c').getContext('2d');
  const tooth = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); const im = x.createImageData(512, 512); const R = rng(77);
    for (let j = 0; j < 512; j++) for (let i = 0; i < 512; i++) { const v = n2(i * .35, j * .35, 3) * .6 + n2(i * .09, j * .09, 5) * .4; const g = 255 - Math.max(0, (v - .55)) * 55 - (R() < .004 ? 25 : 0); const k = (j * 512 + i) * 4; im.data[k] = g; im.data[k + 1] = g * .995; im.data[k + 2] = g * .985; im.data[k + 3] = 255; }
    x.putImageData(im, 0, 0); return c; })();
  toothPat = ctx.createPattern(tooth, 'repeat');
  buildMirror(); buildSplashColour();
  window.render = render;
  window.RIGQA = t => { const id = shotAt(t)[2]; if (id === 'S1' && !(t > .45 && t < 1.75)) return null; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
  window.READY = true;
}
window.DUR = DUR;
setup();
