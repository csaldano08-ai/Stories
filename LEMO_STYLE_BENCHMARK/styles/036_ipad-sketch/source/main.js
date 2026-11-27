// 036 · Tablet Sketch — the first 10 s of "Last Train Home" drawn on one cream canvas on a tablet (lemo-opuscar
// styles/ipad-sketch): a stamped graphite pencil thresholded by the paper grain, light construction lines left in, flat
// colour blocks laid after the line, shifted down-right off it with ragged edges and multiplied under the pencil (one of
// them left half done), a clean stylus riding the mark being made, and the canvas itself panned, pinched and turned by two
// fingers. Four drawings on one page: the puddle (a boot lands in it at 0.9375 s, coral burst ticks for the splash), the
// street with AKI drawn as a motion study (light skeleton → graphite figure → colour), the watch (23:58 with a mustard
// highlight block and a coral tick per second), the station clock (coral ticks on the chime). Transitions are gestures
// (2.5, 7.5 s) and the pinch out to the whole page (9.375 s), as the style asks; no cuts.
// Subject colours: AKI's red coat, plum hair, slate trousers, brown boots; a pale rain-blue for water; a chalky gold.
// Engine: engine/tablet.js, the demo's code copied unchanged (two marked edits: page size and palette come from the film).
// Page contract: window.render(t), DUR, READY, RIGQA.
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { seg, back, hash, ss } from './shared/lib/util.js';

const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const X = t => RUN.pelvisAt(t)[0];
function poseAt(t) {
  const S_ = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  const w = clamp(up, 0, 1.1) * (1 - dn); S_.watch = w;
  if (w > 0) { const J0 = solveProfile(S_), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S_.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S_.arms.f.sh *= 1 - .45 * wm; S_.head += .26 * wm; S_.neck += .08 * wm; }
  return S_;
}

// ——— page layout (canvas units) ———
const GY1 = 330, K1 = .62, M1 = p => [330 + (p[0] - SPL.x) * K1, GY1 + p[1] * K1];          // the puddle drawing
const GY2 = 900, K2 = .22, T2 = 2.55, M2 = p => [120 + (p[0] - X(T2)) * K2, GY2 + p[1] * K2];  // the street drawing
const WCX = 1620, WCY = 250, WR = 150, CLX = 1990, CLY = 800, CLR = 50;

function figure(J, M, k, t0, o = {}) {
  const T = (b, u, f) => M([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
  const w = o.w ?? 2.6, hc = J.headC, HR = p => { const c = Math.cos(J.headA), s = Math.sin(J.headA); return M([hc[0] + p[0] * c - p[1] * s, hc[1] + p[0] * s + p[1] * c]); };
  let t = t0;
  // construction: a light stick skeleton first
  t = PEN([M(J.neckTop), M(J.neckBase), M(J.waist), M(J.pelvis)], { layer: 'light', w: 1.6, wob: .3 }, t, .05);
  for (const kk of ['f', 'n']) { const l = J.leg[kk]; t = PEN([M(l.hip), M(l.knee), M(l.ankle)], { layer: 'light', w: 1.5, wob: .3, smooth: false }, t, .03); }
  t = circleStroke(...HR([4, 0]), 44 * k, { layer: 'light', w: 1.4 }, t, .04);
  // graphite: legs, boots, coat, arms, head, hair
  const legs = [], boots = [];
  for (const kk of ['f', 'n']) { const l = J.leg[kk], c = Math.cos(l.pitch), s = Math.sin(l.pitch), F = ([u, v]) => M([l.ankle[0] + u * c - v * s, l.ankle[1] + u * s + v * c]);
    const sh = (u, v) => { const d = [l.knee[0] - l.ankle[0], l.knee[1] - l.ankle[1]], L = Math.hypot(...d) || 1; return M([l.ankle[0] + d[0] / L * u - d[1] / L * v, l.ankle[1] + d[1] / L * u + d[0] / L * v]); };
    const leg = [M(l.hip), M(l.knee), M(l.ankle)]; legs.push({ leg, kk });
    t = PEN(leg, { w, wob: .4 }, t, .06);
    const boot = [sh(46, 22), sh(0, 22), F([-20, 16]), F([62, 16]), F([64, 2]), F([20, -6]), sh(46, -20)]; boots.push(boot);
    t = PEN(boot.concat([boot[0]]), { w: w * .9, wob: .3, smooth: false }, t, .06); }
  const coat = [T(J.neckBase, 6, -24), T(J.waist, 0, -40), T(J.pelvis, -88, -48), T(J.pelvis, -92, 42), T(J.waist, 0, 34), T(J.neckBase, -6, 26)];
  t = PEN(coat.concat([coat[0]]), { w, wob: .4 }, t, .1);
  const arms = []; for (const kk of ['f', 'n']) { const a = J.arm[kk], hand = M([a.wr[0] + (a.wr[0] - a.el[0]) * .16, a.wr[1] + (a.wr[1] - a.el[1]) * .16]); arms.push([M(a.sh), M(a.el), M(a.wr)]); t = PEN([M(a.sh), M(a.el), M(a.wr)], { w: w * .95, wob: .3 }, t, .05); t = circleStroke(hand[0], hand[1], 11 * k, { w: w * .8 }, t, .02); }
  const head = ell(...HR([4, 0]), 40 * k, 44 * k, J.headA, 0, Math.PI * 2, 24);
  t = circleStroke(...HR([4, 0]), 42 * k, { w }, t, .05);
  const hair = [HR([32, -30]), HR([8, -50]), HR([-28, -42]), HR([-50, -10]), HR([-52, 30]), HR([-38, 58]), HR([-18, 40]), HR([-12, 4]), HR([12, -24])];
  t = PEN(hair.concat([hair[0]]), { w, wob: .3 }, t, .05);
  t = PEN([HR([24, -6]), HR([30, -6])], { w: w * 1.1, wob: 0, smooth: false }, t, .015);
  if (o.watch) t = circleStroke(...M(J.arm.n.wr), 9 * k, { w: w * .8 }, t, .02);
  // colour pass: coat red (darker shadow block), hair plum, boots brown, trousers slate
  const half = o.half;
  t = BLOB(coat, C.red, { dx: 6 * k / .3, dy: 4 * k / .3, a: .9, sp: 6, stop: half ? .55 : 1 }, t, .12);
  if (!half) BLOB([coat[0], coat[1], coat[2], T(J.pelvis, -88, -8), T(J.waist, 0, -8)], C.redDk, { dx: 6 * k / .3, dy: 4 * k / .3, a: .4, sp: 6 }, t - .04, .05);
  t = BLOB(hair, C.plum, { dx: 5 * k / .3, dy: 3 * k / .3, a: .9, sp: 5 }, t, .05);
  for (const b of boots) t = BLOB(b, C.boot, { dx: 4 * k / .3, dy: 3 * k / .3, sp: 5 }, t, .03);
  return t;
}

function buildPage() {
  // ——— 1 · the puddle (S1): the ground, the puddle, the signs upside down in it; the boot lands; coral burst ticks ———
  PEN([[40, GY1], [700, GY1 + 3]], { layer: 'light', w: 2, wob: .6 }, .0, .2);
  PEN([[40, GY1 + 2], [700, GY1 + 4]], { w: 3, wob: .8 }, .15, .25);
  const pud = ell(345, GY1 + 40, 230, 40, 0, 0, Math.PI * 2, 48);
  circleStroke(345, GY1 + 40, 230, { ry: 40, layer: 'light', w: 1.6 }, .3, .12);
  PEN(pud.concat([pud[0], pud[1]]), { w: 2.8, wob: .4 }, .4, .2);
  const r24 = [[230, GY1 + 26], [292, GY1 + 26], [292, GY1 + 64], [230, GY1 + 64]], rCF = [[372, GY1 + 26], [470, GY1 + 26], [470, GY1 + 64], [372, GY1 + 64]];
  BLOB(pud, C.water, { dx: 6, dy: 5, a: .85, holes: [r24, rCF] }, .55, .2);
  TXT('24H', 292, GY1 + 24, 40, { f: 'CM', rot: Math.PI, k: .7 }, .62, .14);
  TXT('CAFE', 472, GY1 + 24, 40, { f: 'CM', rot: Math.PI, k: .7 }, .76, .16);
  for (const c of RUN.contacts.filter(c => c.t0 > .5 && c.t0 < 1.5)) figure(solveProfile(poseAt(c.t0)), M1, K1, c.t0 - .28, { w: 3.2, half: c.t0 > 1.2 });
  { const sx = M1([SPL.x + 12, 0])[0]; for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i / 6 - .5) * 2.2; PEN([[sx + Math.cos(a) * 26, GY1 - 6 + Math.sin(a) * 18], [sx + Math.cos(a) * 64, GY1 - 6 + Math.sin(a) * 50]], { layer: 'coral', w: 4.2, ta: .3, tb: .2, wob: .2, smooth: false }, EV.splash + i * .025, .04); }
    for (let i = 0; i < 3; i++) circleStroke(sx, GY1 + 40, 50 + i * 55, { ry: 9 + i * 9, w: 2, turn: .9 }, EV.splash + .25 + i * .14, .12); }
  for (let i = 0; i < 12; i++) { const x = 60 + hash(i * 3.3) * 600, y = 40 + hash(i * 5.1) * 220; PEN([[x, y], [x - 6, y + 22]], { layer: 'light', w: 1.6, wob: 0, smooth: false }, 1.3 + i * .08, .03); }
  // ——— 2 · the street (S2): construction rule, shops outlined and named ahead of her, a motion study of the run ———
  PEN([[40, GY2], [2120, GY2 + 4]], { layer: 'light', w: 2, wob: .7 }, 2.55, .3);
  PEN([[40, GY2 + 2], [1720, GY2 + 6]], { w: 3, wob: .9 }, 2.7, .5);
  const WORDS = ['BAKERY', 'BAR', 'BOOKS', '24H', 'PHARMACY', 'NOODLES', 'CAFE', 'LAUNDRY'];
  const xAt = px => T2 + (px - 120) / (1450 * K2);
  let x = 60; for (let i = 0; i < WORDS.length; i++) { const sw = 190, top = GY2 - 230 - hash(i * 3.1) * 40, t0 = Math.max(2.75, xAt(x + 60) - .9);
    PEN([[x, GY2], [x, top], [x + sw, top], [x + sw, GY2]], { w: 2.4, wob: .5, smooth: false }, t0, .14);
    PEN([[x + 16, GY2 - 30], [x + 16, top + 70], [x + 16 + sw * .55, top + 70], [x + 16 + sw * .55, GY2 - 30]], { layer: 'light', w: 1.6, wob: .4, smooth: false }, t0 + .15, .06);
    TXT(WORDS[i], x + 8, top + 46, 34, { f: 'CB', k: .8 }, t0 + .22, .22);
    if (i % 3 === 1) BLOB([[x + 16, top + 70], [x + 16 + sw * .55, top + 70], [x + 16 + sw * .55, GY2 - 30], [x + 16, GY2 - 30]], C.window, { dx: 5, dy: 4, a: .7, stop: i === 4 ? .5 : 1 }, t0 + .44, .08);
    x += sw + 10; }
  const study = RUN.contacts.filter(c => c.t0 > 2.62 && c.t0 < 7.45).filter((c, i) => i % 2 === 0);
  study.forEach((c, i) => figure(solveProfile(poseAt(c.t0)), M2, K2, c.t0 - .32, { w: 2.4, half: i === study.length - 1, watch: c.t0 > 6 && c.t0 < 7.2 }));
  // ——— 3 · the watch (S3): construction circle, case, ticks, hands, gold block, 23:58 with a mustard block and a coral underline ———
  circleStroke(WCX, WCY, WR + 6, { layer: 'light', w: 1.6 }, 7.5, .1);
  PEN([[WCX - 470, WCY - 60], [WCX - WR - 20, WCY - 54], [WCX - WR - 12, WCY + 56], [WCX - 470, WCY + 66]], { w: 3, wob: .4, smooth: false }, 7.55, .14);
  circleStroke(WCX, WCY, WR, { w: 3.6 }, 7.6, .16);
  circleStroke(WCX, WCY, WR - 22, { w: 2, turn: 1.02 }, 7.74, .1);
  for (let kk = 0; kk < 12; kk++) { const a = -Math.PI / 2 + kk / 12 * Math.PI * 2, r0 = kk % 3 ? WR - 52 : WR - 66; PEN([[WCX + Math.cos(a) * r0, WCY + Math.sin(a) * r0], [WCX + Math.cos(a) * (WR - 32), WCY + Math.sin(a) * (WR - 32)]], { w: kk % 3 ? 2.6 : 4, wob: 0, smooth: false, ta: .1, tb: .1 }, 7.86 + kk * .02, .02); }
  const hh = -Math.PI / 2 + (11 + 58 / 60) / 12 * Math.PI * 2, mm = -Math.PI / 2 + 58 / 60 * Math.PI * 2;
  PEN([[WCX, WCY], [WCX + Math.cos(hh) * 72, WCY + Math.sin(hh) * 72]], { w: 5.2, wob: 0, smooth: false }, 8.12, .05);
  PEN([[WCX, WCY], [WCX + Math.cos(mm) * 110, WCY + Math.sin(mm) * 110]], { w: 3.6, wob: 0, smooth: false }, 8.18, .05);
  const ring = ell(WCX, WCY, WR, WR, 0, 0, Math.PI * 2, 48);
  BLOB(ring, C.gold, { dx: 7, dy: 6, a: .85, holes: [ell(WCX, WCY, WR - 22, WR - 22, 0, 0, Math.PI * 2, 40)] }, 8.24, .12);
  BLOB([[WCX - 470, WCY - 60], [WCX - WR - 20, WCY - 54], [WCX - WR - 12, WCY + 56], [WCX - 470, WCY + 66]], C.red, { dx: 7, dy: 5, a: .9 }, 8.3, .1);
  BLOB([[1800, 316], [2010, 316], [2010, 352], [1800, 352]], C.mustard, { dx: 0, dy: 0, a: .9, amp: 2.5 }, 8.4, .08);
  TXT('23:58', 1806, 340, 64, { f: 'CB', k: .85 }, 8.48, .3);
  PEN([[1800, 366], [1900, 370], [2012, 362]], { layer: 'coral', w: 4.4, wob: .5 }, 8.8, .1);
  for (const [s, t0] of [[47, 7.9], [48, 8.4], [49, 9.4]]) { const a = -Math.PI / 2 + s / 60 * Math.PI * 2; PEN([[WCX + Math.cos(a) * (WR + 12), WCY + Math.sin(a) * (WR + 12)], [WCX + Math.cos(a) * (WR + 44), WCY + Math.sin(a) * (WR + 44)]], { layer: 'coral', w: 4.6, wob: 0, smooth: false, ta: .2, tb: .3 }, t0, .05); }
  // ——— 4 · the station clock (S4): drawn while the canvas is pinched out; coral ticks on the chime ———
  PEN([[CLX - 70, GY2], [CLX - 70, CLY - 70], [CLX, CLY - 130], [CLX + 70, CLY - 70], [CLX + 70, GY2]], { w: 2.8, wob: .4, smooth: false }, 9.38, .14);
  circleStroke(CLX, CLY, CLR, { w: 3 }, 9.48, .07);
  PEN([[CLX + Math.cos(hh) * 26, CLY + Math.sin(hh) * 26], [CLX, CLY], [CLX + Math.cos(mm) * 40, CLY + Math.sin(mm) * 40]], { w: 3, wob: 0, smooth: false }, 9.55, .03);
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i / 5 - .5) * 2.4; PEN([[CLX + Math.cos(a) * (CLR + 12), CLY + Math.sin(a) * (CLR + 12)], [CLX + Math.cos(a) * (CLR + 42), CLY + Math.sin(a) * (CLR + 42)]], { layer: 'coral', w: 4.2, wob: 0, smooth: false }, EV.chime + i * .03, .04); }
  TXT('STATION', 1760, GY2 - 30, 36, { f: 'CM', k: .75 }, 9.6, .25);
}

// ——— camera: gestures over the canvas (quick start, settles with momentum), 1–4° off level, back to 0° for the page ———
const Xp = t => M2([X(t), 0])[0];
function buildCam() {
  CAM.push({ t: 0, x: 350, y: 250, z: 2.3, r: -2, k: 'g' }, { t: 2.5, x: 360, y: 255, z: 2.3, r: -2.4, k: 'g' },
    { t: 2.95, x: Xp(2.95) + 120, y: GY2 - 140, z: 2.3, r: 1.5, k: 'g' },
    { t: 7.5, x: Xp(7.5) + 120, y: GY2 - 140, z: 2.3, r: 1.8, k: 'f', fn: t => [Xp(t) + 120, GY2 - 140] },
    { t: 7.9, x: WCX + 140, y: WCY + 40, z: 2.1, r: -3, k: 'g' }, { t: 9.375, x: WCX + 150, y: WCY + 44, z: 2.12, r: -3.2, k: 'g' },
    { t: 9.95, x: 1020, y: 540, z: .85, r: 0, k: 'g' }, { t: 10, x: 1020, y: 540, z: .85, r: 0, k: 'g' });
}
function render(t) {
  const c = cam(t);
  renderMarks(t);
  const [x0, y0, w, h] = composite(c);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(1, 0, 0, 1, W / 2, H / 2); ctx.rotate(c.r); ctx.scale(c.z / S, c.z / S); ctx.translate(-(c.x - X0) * S, -(c.y - Y0) * S);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(WC, x0, y0, w, h, x0, y0, w, h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.15); g.addColorStop(0, 'rgba(120,100,80,0)'); g.addColorStop(1, 'rgba(120,100,80,0.10)');
  ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
  drawStylus(t);
}

(async () => {
  GLY = await (await fetch('glyphs.json')).json();
  await Promise.all([['CB', 'Ag'], ['CM', 'Ag']].map(([f, s]) => document.fonts.load(`40px ${f}`, s)));
  buildGrain(); CACHE = mkTarget(); WORK = mkTarget(); TG = CACHE;
  buildPage(); EL.sort((a, b) => a.t0 - b.t0); buildCam();
  NIBS = EL.filter(e => e.nib);
  window.render = render;
  window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const c = RUN.contacts.filter(c => c.t0 - .32 <= t).pop(); if (!c) return null; const J = solveProfile(poseAt(c.t0)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
  window.READY = true;
})();
window.DUR = DUR;
