// 041 · Gilded Illumination — the first 10 s of "Last Train Home" as one gilded miniature painting (lemo-opuscar
// styles/gilded-illumination). Flat mineral pigments inside firm ink outlines, a darker band inside each outline, white-lead
// strokes and dots, and gold leaf laid in squares that lies dark at night and shines only where a light inside the picture
// reaches it (engine/lib.js + the demo's glint pass, per leaf square). Night is deep ultramarine, never black.
// One painted world: a night street of gothic houses (CAFE, BAKERY, BOOKS, NOODLES, FLOWERS, HOTEL), gold stars, scalloped
// clouds, far towers paler and smaller, street lamps whose light wakes the gold near them, and the station clock tower.
// Continuous narration: AKI runs through the picture (on ones), and at five stations she is painted into it in layers
// (colour, inner rim, ink, white lead), so the closing pull back shows her several times along the street.
//   S1 0–2.5    close on the puddle under the café: the gold sign reflected upside down in the ultramarine water; the
//               boot lands at 0.9375 s: white-lead drops spring up, wave strokes ring out, the reflected gold shivers.
//   S2 2.5–7.5  follow along the path of the narration (a lamp every ~800 units lights the gold near it); 6.05–7.15 the watch.
//   S3 7.5–9.4  a hard cut on the beat into a quatrefoil roundel set in the sky of the painting: her sleeve and the watch
//               (gold-leaf dial, ink hands at 23:58, a vermilion second hand ticking at 8.4 and 9.4); locked frame while
//               a band of light rakes across the dial, square by square.
//   S4 9.4–10   hard cut on circles, centre to centre (the watch dial → the station clock dial), then the big pull back to
//               the whole painting; on the chime (9.575) "the touch": two rings of gold light spread from the clock.
// Page contract: window.render(t), DUR, READY, RIGQA.
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp as cl, lerp as lp, seg as sg, back, ss as sm, eo as eout, ei as ein, mulberry as mb, TAU as T2 } from './shared/lib/util.js';

const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const X = t => RUN.pelvisAt(t)[0];
function poseAt(t) {
  const S_ = RUN.pose(t);
  const up = back(sg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = sm(sg(t, EV.watchDown - .14, EV.watchDown + .2));
  const w = cl(up, 0, 1.1) * (1 - dn); S_.watch = w;
  if (w > 0) { const J0 = solveProfile(S_), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lp(70, 92, wm), sh[1] + lp(150, 50, wm)];
    S_.arms.n = { tgt: [lp(ra.wr[0], tgt[0], wm), lp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S_.arms.f.sh *= 1 - .45 * wm; S_.head += .26 * wm; S_.neck += .08 * wm; }
  return S_;
}

// ───────── the painted world (world units, y down)
const GY = 900, K = .6, PX = 900;
const Wp = p => [PX + (p[0] - SPL.x) * K, GY + p[1] * K];
const Xw = t => Wp([X(t), 0])[0];
const WX0 = -300, WX1 = 7500, WY0 = -2900, WY1 = 1500;
const TOWER = { x: 7000, clock: [7000, 180], r: 120 };
const ROUND = { x: Xw(7.5) - 700, y: -1500, r: 620 };                // the quatrefoil roundel in the sky (the watch)
const LAMPS = []; for (let x = 520; x < 6900; x += 820) LAMPS.push([x, GY - 520]);
const HOUSES = [['CAFE', 760, VERDI], ['24H', 1390, ROSE], ['BAKERY', 2050, AZUR], ['BOOKS', 2760, LILAC], ['NOODLES', 3480, VERDI], ['BAR', 4180, ROSE], ['FLOWERS', 4880, AZUR], ['HOTEL', 5620, LILAC], ['RECORDS', 6330, ROSE]];
const STATIONS = [EV.splash, 3.05, 4.7, 6.45, 7.35];
const R0 = mb(7);
const STARS = Array.from({ length: 70 }, () => ({ x: WX0 + R0() * (WX1 - WX0), y: WY0 + 120 + R0() * 2650, r: 16 + R0() * 26, rot: R0() * T2, n: R0() < .3 ? 6 : 8 })).filter(s => Math.hypot(s.x - ROUND.x, s.y - ROUND.y) > ROUND.r + 80);
const TRI = Array.from({ length: 160 }, () => [WX0 + R0() * (WX1 - WX0), WY0 + R0() * 2900, 3 + R0() * 3, R0()]);
const FAR = []; { const R = mb(19); let x = WX0; while (x < WX1) { const w = 90 + R() * 160, h = 380 + R() * 520; FAR.push({ x, w, h, roof: R() < .6 }); x += w + R() * 40; } }
const CLOUDS = [[600, -900, 520], [2400, -620, 680], [4300, -1050, 560], [5900, -700, 620], [3400, -2200, 600], [1200, -2100, 480], [6500, -2300, 520]];

const B = { paint: null };
const pth = fn => { const p = new Path2D(); fn(p); return p; };
const poly = pts => polyPath(pts, true);
function scallop(x, y, w) { const p = new Path2D(), n = Math.max(4, Math.round(w / 110)), r = w / n / 2, h = 110; p.moveTo(x, y + h); for (let i = 0; i < n; i++) { const cx = x + r + i * 2 * r; p.arc(cx, y + (i % 2 ? 10 : 0), r, Math.PI, 0); } p.lineTo(x + w, y + h); for (let i = n - 1; i >= 0; i--) { const cx = x + r + i * 2 * r; p.arc(cx, y + h, r * .7, 0, Math.PI); } p.closePath(); return p; }

function drawSkyAndCity(g) {
  if (!g.__paint) { g.__paint = g.createPattern(PAINTC, 'repeat'); g.__paint.setTransform(new DOMMatrix().scale(1.1)); }
  g.fillStyle = g.__paint; g.fillRect(WX0 - 200, WY0 - 200, WX1 - WX0 + 400, WY1 - WY0 + 400);
  const gr = g.createLinearGradient(0, WY0, 0, GY); gr.addColorStop(0, 'rgba(8,10,48,.42)'); gr.addColorStop(1, 'rgba(60,90,190,.14)'); g.fillStyle = gr; g.fillRect(WX0 - 200, WY0 - 200, WX1 - WX0 + 400, GY - WY0 + 200);
  for (const [x, y, r, rot] of TRI) triad(g, x, y, r, .42, rot * T2);
  for (const s of STARS) { const p = pth(q => star8(q, s.x, s.y, s.r, s.n === 6 ? .5 : .42, s.rot, s.n)); g.save(); g.translate(3, 4); g.fillStyle = 'rgba(6,10,40,.55)'; g.fill(p); g.restore(); leaf(g, p, [s.x - s.r, s.y - s.r, s.r * 2, s.r * 2], { lw: 1.8, rimW: 3 }); gpush(s.x, s.y, s.r * 2.2, .8); }
  for (const [x, y, w] of CLOUDS) { const p = scallop(x - w / 2, y, w); paint(g, p, LILAC_L, LILAC, 12, 2.2); hiLine(g, [[x - w / 2 + 20, y - 30], [x, y - 44], [x + w / 2 - 20, y - 30]], 2, .6); }
  // far towers: paler, smaller, behind the street
  for (const f of FAR) {
    const base = GY - 300, p = poly([[f.x, base], [f.x, base - f.h], [f.x + f.w, base - f.h], [f.x + f.w, base]]);
    paint(g, p, ASH, ASH_D, 8, 1.8);
    if (f.roof) paint(g, poly([[f.x - 8, base - f.h], [f.x + f.w / 2, base - f.h - f.w * 1.1], [f.x + f.w + 8, base - f.h]]), ROSE_D, '#7a3240', 6, 1.8);
    for (let y = base - f.h + 50; y < base - 40; y += 80) { const wp = poly([[f.x + f.w / 2 - 9, y + 30], [f.x + f.w / 2 - 9, y + 6], [f.x + f.w / 2, y - 6], [f.x + f.w / 2 + 9, y + 6], [f.x + f.w / 2 + 9, y + 30]]); leaf(g, wp, [f.x + f.w / 2 - 10, y - 8, 20, 40], { lw: 1.4, rimW: 2 }); }
  }
}
function house(g, h, i) {
  const [word, x, col] = h, w = 560, top = GY - 600, roofT = top - 200;
  const body = poly([[x - w / 2, GY + 2], [x - w / 2, top], [x + w / 2, top], [x + w / 2, GY + 2]]);
  paint(g, body, col, mixHex(col, '#000000', .3), 16, 2.6);
  // pearls along the cornice, a vermilion roof with tile scallops
  const roof = poly([[x - w / 2 - 30, top + 4], [x - w / 2 + 40, roofT], [x + w / 2 - 40, roofT], [x + w / 2 + 30, top + 4]]);
  paint(g, roof, VERM, VERM_D, 14, 2.6);
  for (let yy = roofT + 30; yy < top; yy += 40) for (let xx = x - w / 2 + 40; xx < x + w / 2 - 30; xx += 46) { g.strokeStyle = 'rgba(80,16,8,.55)'; g.lineWidth = 2.2; g.beginPath(); g.arc(xx, yy, 20, .15 * Math.PI, .85 * Math.PI); g.stroke(); }
  hiLine(g, [[x - w / 2 + 44, roofT + 8], [x + w / 2 - 44, roofT + 8]], 2.2, .7);
  pearlLine(g, [[x - w / 2 + 10, top + 14], [x + w / 2 - 10, top + 14]], 22, 3.6);
  // two gold-leaf arched windows, a wooden door, a vellum sign with brown ink letters
  for (const wx of [x - 150, x + 150]) { const wp = pth(q => { q.moveTo(wx - 70, top + 300); q.lineTo(wx - 70, top + 140); q.quadraticCurveTo(wx - 70, top + 70, wx, top + 66); q.quadraticCurveTo(wx + 70, top + 70, wx + 70, top + 140); q.lineTo(wx + 70, top + 300); q.closePath(); });
    leaf(g, wp, [wx - 72, top + 64, 144, 240], { lw: 2.4, rimW: 5 }); gpush(wx, top + 180, 120, .9); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(wx, top + 70); g.lineTo(wx, top + 300); g.moveTo(wx - 70, top + 190); g.lineTo(wx + 70, top + 190); g.stroke(); }
  const door = pth(q => { q.moveTo(x - 60, GY + 2); q.lineTo(x - 60, GY - 170); q.quadraticCurveTo(x, GY - 230, x + 60, GY - 170); q.lineTo(x + 60, GY + 2); q.closePath(); });
  paint(g, door, WOOD, WOOD_D, 10, 2.4); g.fillStyle = OCHRE_L; g.beginPath(); g.arc(x + 40, GY - 80, 5, 0, T2); g.fill();
  const sw = Math.max(190, word.length * 34 + 70), sy = top + 380, sign = pth(q => { q.moveTo(x - sw / 2, sy - 34); q.quadraticCurveTo(x, sy - 46, x + sw / 2, sy - 34); q.lineTo(x + sw / 2 + 18, sy); q.lineTo(x + sw / 2, sy + 34); q.quadraticCurveTo(x, sy + 22, x - sw / 2, sy + 34); q.lineTo(x - sw / 2 - 18, sy); q.closePath(); });
  paint(g, sign, VELL, '#d8c79f', 8, 2.2);
  g.fillStyle = GALL; g.font = '600 50px "Cormorant Garamond"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(word, x, sy);
}
function lamp(g, x, y) {
  const post = poly([[x - 7, GY + 2], [x - 7, y + 40], [x + 7, y + 40], [x + 7, GY + 2]]); paint(g, post, INK, null, 0, 1.6);
  const cage = poly([[x - 26, y + 40], [x - 34, y - 30], [x, y - 60], [x + 34, y - 30], [x + 26, y + 40]]); leaf(g, cage, [x - 36, y - 62, 72, 104], { lw: 2.6, rimW: 4 }); gpush(x, y, 70, 1.2);
  g.fillStyle = 'rgba(255,236,170,.9)'; g.beginPath(); g.ellipse(x, y, 11, 20, 0, 0, T2); g.fill();
}
function street(g) {
  const p = poly([[WX0 - 100, GY], [WX1 + 100, GY], [WX1 + 100, WY1 + 100], [WX0 - 100, WY1 + 100]]);
  paint(g, p, ASH_D, '#4c5058', 18, 2.6);
  const R = mb(23);
  for (let y = GY + 40; y < WY1; y += 70) for (let x = WX0 + (y / 70 % 2) * 60; x < WX1; x += 120) { g.strokeStyle = 'rgba(30,26,30,.45)'; g.lineWidth = 2.4; g.beginPath(); g.ellipse(x, y, 52, 24, 0, 0, T2); g.stroke(); if (R() < .3) triad(g, x - 10, y - 6, 2.6, .5, R()); }
}
function puddle(g, t) {
  const cx = PX + 40, cy = GY + 80, p = pth(q => q.ellipse(cx, cy, 330, 64, 0, 0, T2));
  paint(g, p, ULTRA, ULTRA_D, 14, 2.6);
  // the café's gold sign, reflected upside down in the water; it shivers after the splash
  const sh = t > SPL.t0 ? Math.sin((t - SPL.t0) * 34) * 6 * Math.exp(-(t - SPL.t0) * 1.8) : 0;
  g.save(); g.clip(p); g.translate(cx - 40 + sh, cy - 4); g.scale(1, -1); g.transform(1, 0, sh * .01, 1, 0, 0);
  const plate = pth(q => q.rect(-170, -30, 340, 52)); leaf(g, plate, [-170, -30, 340, 52], { lw: 2, rimW: 3 }); gpush(cx - 40, cy, 140, 1);
  g.fillStyle = GALL; g.font = '600 40px "Cormorant Garamond"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('24H CAFE', 0, -4);
  g.restore();
  // white-lead wave strokes; rings spread after the splash
  for (let k = 0; k < 5; k++) hiLine(g, [[cx - 260 + k * 110, cy + 30], [cx - 220 + k * 110, cy + 24], [cx - 180 + k * 110, cy + 30]], 2, .55);
  if (t > SPL.t0) { const u = t - SPL.t0; for (let k = 0; k < 3; k++) { const r = 40 + ((u * 300 + k * 70) % 260), a = .75 * (1 - r / 300); g.strokeStyle = `rgba(255,252,238,${a})`; g.lineWidth = 2.6 * LWH; g.beginPath(); g.ellipse(cx + 30, cy, r, r * .19, 0, 0, T2); g.stroke(); } }
}
function splash(g, t) {
  const u = t - SPL.t0; if (u < 0 || u > .7) return;
  const fx = Wp([SPL.x, 0])[0] + 26, k = popS(u, .6);
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i / 8 - .5) * 2.4, r = (60 + 50 * Math.abs(Math.cos(i))) * k, x = fx + Math.cos(a) * r, y = GY + 60 + Math.sin(a) * r * .9 + 260 * u * u; triad(g, x, y, 4 + 2 * (i % 2), .9 * (1 - u / .7), a); }
  const crown = pth(q => { for (let i = -3; i <= 3; i++) { const bx = fx + i * 18, h = (50 + 22 * Math.cos(i)) * Math.min(1, k) * (1 - u / .9); q.moveTo(bx - 8, GY + 70); q.quadraticCurveTo(bx + i * 4, GY + 70 - h * .6, bx + i * 8, GY + 70 - h); q.quadraticCurveTo(bx + i * 2 + 6, GY + 70 - h * .5, bx + 8, GY + 70); } });
  g.fillStyle = 'rgba(232,240,255,.92)'; g.fill(crown); ink(g, crown, 1.6);
}
function station(g) {
  const { x } = TOWER, base = GY + 2, top = -380;
  const body = poly([[x - 180, base], [x - 180, top], [x + 180, top], [x + 180, base]]); paint(g, body, LILAC, LILAC_D, 18, 3);
  pearlLine(g, [[x - 170, top + 16], [x + 170, top + 16]], 24, 4);
  const roof = poly([[x - 220, top + 4], [x, top - 520], [x + 220, top + 4]]); paint(g, roof, VERM, VERM_D, 16, 3);
  hiLine(g, [[x - 160, top - 20], [x - 20, top - 470]], 2.4, .7);
  const door = pth(q => { q.moveTo(x - 90, base); q.lineTo(x - 90, GY - 240); q.quadraticCurveTo(x, GY - 330, x + 90, GY - 240); q.lineTo(x + 90, base); q.closePath(); }); leaf(g, door, [x - 92, GY - 332, 184, 334], { lw: 2.6, rimW: 5 }); gpush(x, GY - 160, 140, 1);
  clockFace(g, TOWER.clock[0], TOWER.clock[1], TOWER.r, 0);
}
function clockFace(g, cx, cy, r, t) {
  const ring = pth(q => { q.arc(cx, cy, r + 26, 0, T2); q.arc(cx, cy, r, 0, T2, true); }); paint(g, ring, VERM, VERM_D, 8, 2.6); pearls(g, cx, cy, r + 13, 28, 4.2);
  const face = pth(q => q.arc(cx, cy, r, 0, T2)); leaf(g, face, [cx - r, cy - r, 2 * r, 2 * r], { lw: 3, rimW: 7 }); gpush(cx, cy, r * 1.6, 1.3);
  for (let k = 0; k < 12; k++) { const a = -Math.PI / 2 + k / 12 * T2; g.fillStyle = 'rgba(110,60,5,.7)'; g.beginPath(); g.arc(cx + Math.cos(a) * r * .82, cy + Math.sin(a) * r * .82, k % 3 ? r * .03 : r * .055, 0, T2); g.fill(); }
  const hand = (a, len, w, col) => { const p = tubePath([[cx - Math.cos(a) * len * .15, cy - Math.sin(a) * len * .15], [cx + Math.cos(a) * len, cy + Math.sin(a) * len]], [w, w * .35]); g.fillStyle = col; g.fill(p); ink(g, p, 1.4); };
  hand(AH, r * .52, r * .09, GALL); hand(AM, r * .78, r * .065, GALL);
  if (t) { const s = t < 8.4 ? 47 : t < 9.4 ? 48 : 49, t0 = t < 8.4 ? -9 : t < 9.4 ? 8.4 : 9.4, wob = t - t0 < .25 ? Math.sin((t - t0) * 40) * .05 * (1 - (t - t0) / .25) : 0; hand(-Math.PI / 2 + s / 60 * T2 + wob, r * .86, r * .03, VERM); }
  g.fillStyle = INK; g.beginPath(); g.arc(cx, cy, r * .06, 0, T2); g.fill();
}
const AH = -Math.PI / 2 + (11 + 58 / 60) / 12 * T2, AM = -Math.PI / 2 + 58 / 60 * T2;
// the quatrefoil roundel in the sky: her sleeve and the watch, held at the run's cadence
function roundel(g, t) {
  const { x, y, r } = ROUND, qf = pth(q => { for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, cx = x + Math.cos(a) * r * .42, cy = y + Math.sin(a) * r * .42; q.moveTo(cx + r * .62, cy); q.arc(cx, cy, r * .62, 0, T2); } });
  g.save(); g.fillStyle = 'rgba(6,10,40,.5)'; g.translate(6, 8); g.fill(qf); g.restore();
  leaf(g, qf, [x - r * 1.1, y - r * 1.1, r * 2.2, r * 2.2], { lw: 3.4, rimW: 10 }); gpush(x, y, r * 1.6, .7);
  const inner = pth(q => q.arc(x, y, r * .86, 0, T2));
  paint(g, inner, ULTRA, ULTRA_D, 20, 3);
  g.save(); g.clip(inner);
  for (let k = 0; k < 18; k++) { const a = k * 2.4, rr = r * (.3 + (k % 5) * .12); triad(g, x + Math.cos(a) * rr, y + Math.sin(a) * rr, 4, .5, k); }
  const bob = t ? 8 * Math.sin(T2 * CADENCE * (t - 7.5)) : 0;
  g.translate(0, bob);
  const sleeve = tubePath([[x - r * 1.1, y + 60], [x - r * .45, y + 20], [x - 90, y + 4]], [250, 230, 214]); paint(g, sleeve, VERM, VERM_D, 22, 3.2);
  for (let k = 0; k < 4; k++) hiLine(g, [[x - r * .95 + k * 80, y - 60], [x - r * .9 + k * 80, y - 76]], 2.6, .55);
  pearlLine(g, [[x - 150, y - 100], [x - 140, y + 110]], 22, 4.4);
  const hand = pth(q => { q.moveTo(x + 150, y - 96); q.quadraticCurveTo(x + 420, y - 130, x + 520, y - 20); q.quadraticCurveTo(x + 430, y + 120, x + 150, y + 104); q.closePath(); }); paint(g, hand, '#f0d2bd', '#c99c84', 14, 3);
  for (const yy of [-50, 0, 50]) { g.strokeStyle = 'rgba(120,70,50,.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 360, y + yy); g.lineTo(x + 470, y + yy * .8); g.stroke(); }
  const strap = poly([[x - 110, y - 300], [x + 110, y - 300], [x + 110, y + 300], [x - 110, y + 300]]); paint(g, strap, WOOD, WOOD_D, 14, 3);
  clockFace(g, x, y, 210, t || 8);
  g.restore();
}

// ───────── AKI painted (pigment shapes on the rig; drawn through K)
const bone = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2;
const boneUp = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;
let SH = null;
function shapes() {
  const J0 = solveProfile(RUN.pose(3)), dWP = Math.hypot(J0.pelvis[0] - J0.waist[0], J0.pelvis[1] - J0.waist[1]), dWN = Math.hypot(J0.neckBase[0] - J0.waist[0], J0.neckBase[1] - J0.waist[1]);
  const limb = (L, w0, w1) => pth(q => { q.moveTo(-w0, 0); q.arc(0, 0, w0, Math.PI, 0); q.lineTo(w1, L); q.arc(0, L, w1, 0, Math.PI); q.closePath(); });
  SH = { dWP, dWN, thigh: limb(150, 23, 18), shin: limb(144, 18, 13), upper: limb(108, 15, 12), fore: limb(92, 12, 10),
    boot: polyPath(catmull([[-14, -34], [14, -34], [16, -8], [44, -2], [68, 6], [70, 14], [20, 18], [-22, 16], [-26, 0], [-14, -34]], 4), true),
    hand: pth(q => { q.moveTo(-9, -2); q.lineTo(10, -2); q.quadraticCurveTo(15, 18, 6, 32); q.quadraticCurveTo(-6, 34, -12, 20); q.closePath(); }),
    coatLo: polyPath(catmull([[-34, 0], [30, 0], [40, dWP], [52, dWP + 94], [12, dWP + 104], [-30, dWP + 106], [-68, dWP + 88], [-46, dWP], [-34, 0]], 4), true),
    coatUp: polyPath(catmull([[-36, 6], [34, 6], [40, -dWN * .5], [30, -dWN + 8], [10, -dWN - 6], [-26, -dWN - 4], [-42, -dWN * .5], [-36, 6]], 4), true),
    face: polyPath(catmull([[16, -44], [34, -20], [44, -3], [37, 8], [39, 16], [34, 23], [32, 35], [12, 46], [-10, 48], [-36, 38], [-50, 8], [-46, -26], [-22, -48], [16, -44]].map(([a, b]) => [a * 1.1, b * 1.1]), 4), true),
    hair: polyPath(catmull([[22, -42], [0, -56], [-32, -50], [-54, -22], [-56, 10], [-44, 36], [-24, 42], [-12, 18], [-4, -16], [8, -32], [22, -42]].map(([a, b]) => [a * 1.1, b * 1.1]), 4), true),
    tail: polyPath(catmull([[0, -10], [34, -12], [72, -2], [34, 10], [0, 9], [0, -10]], 4), true) };
}
function aki(g, tq, prog = 1) {
  const S_ = poseAt(tq), J = solveProfile(S_);
  const base = g.getTransform().multiply(new DOMMatrix([K, 0, 0, K, PX - SPL.x * K, GY]));
  const at = (p, a) => base.multiply(new DOMMatrix().translate(p[0], p[1]).rotate(a * 180 / Math.PI));
  // painted in layers: colour, then the inner rim, then ink, then white lead
  const pc = (M, path, fill, rim, rimW, hi) => {
    g.setTransform(M);
    if (prog > 0) { g.globalAlpha = cl(prog / .3); g.fillStyle = fill; g.fill(path); g.globalAlpha = 1; maskErase(g, path); }
    if (prog > .3 && rim) { g.globalAlpha = cl((prog - .3) / .25); rimShade(g, path, rim, rimW); g.globalAlpha = 1; }
    if (prog > .55) { g.globalAlpha = cl((prog - .55) / .25); ink(g, path, 2.6 / K); g.globalAlpha = 1; }
    if (prog > .8 && hi) { hiLine(g, hi, 2.2 / K, .8 * cl((prog - .8) / .2)); }
  };
  const leg = (kk, far) => { const l = J.leg[kk];
    pc(at(l.hip, bone(l.hip, l.knee)), SH.thigh, far ? LILAC_D : LILAC, far ? '#4c3f6e' : LILAC_D, 9, [[-16, 20], [-13, 120]]);
    pc(at(l.knee, bone(l.knee, l.ankle)), SH.shin, far ? LILAC_D : LILAC, far ? '#4c3f6e' : LILAC_D, 8, [[-12, 18], [-10, 110]]);
    pc(at(l.ankle, l.pitch), SH.boot, WOOD_D, '#2d1a0c', 6, [[0, -28], [40, -4]]); };
  const arm = (kk, far) => { const a = J.arm[kk], h = [a.wr[0] + (a.wr[0] - a.el[0]) * .02, a.wr[1] + (a.wr[1] - a.el[1]) * .02];
    pc(at(a.sh, bone(a.sh, a.el)), SH.upper, far ? VERM_D : VERM, far ? '#5e140b' : VERM_D, 8, [[-10, 16], [-8, 90]]);
    const Mf = at(a.el, bone(a.el, a.wr)); pc(Mf, SH.fore, far ? VERM_D : VERM, far ? '#5e140b' : VERM_D, 7, [[-8, 14], [-7, 74]]);
    pc(at(h, bone(a.el, a.wr)), SH.hand, '#f0d2bd', '#c99c84', 5);
    if (!far && prog > .55) { g.setTransform(Mf); const wpth = pth(q => q.arc(12, 62, 11, 0, T2)); leaf(g, wpth, [1, 51, 22, 22], { lw: 1.6 / K, rimW: 2 }); } };
  const MH = at(J.headC, J.headA);
  pc(MH.multiply(new DOMMatrix().translate(-60, -12).rotate((Math.PI - .25 + .12 * Math.sin(tq * T2 * CADENCE * .5)) * 180 / Math.PI)), SH.tail, OCHRE_D, '#6a4418', 5, [[8, -4], [56, -2]]);
  arm('f', 1); leg('f', 1);
  const MLo = at(J.waist, bone(J.waist, J.pelvis));
  pc(MLo, SH.coatLo, VERM, VERM_D, 14, [[-30, 14], [-56, SH.dWP + 80]]);
  leg('n', 0);
  pc(at(J.waist, boneUp(J.waist, J.neckBase)), SH.coatUp, VERM, VERM_D, 14, [[-30, -10], [-36, -SH.dWN * .7]]);
  if (prog > .8) { g.setTransform(at(J.waist, boneUp(J.waist, J.neckBase))); pearlLine(g, [[-30, 2], [30, 2]], 12 / K * .5, 2.4 / Math.sqrt(K)); }
  pc(MH, SH.face, '#f3dcc8', '#cfa58c', 7, [[34, -22], [42, -6]]);
  if (prog > .55) { g.setTransform(MH); g.fillStyle = INK; g.beginPath(); g.ellipse(26, -11, 5, 3, 0, 0, T2); g.fill(); g.strokeStyle = INK; g.lineWidth = 2.2; g.beginPath(); g.moveTo(14, -20); g.quadraticCurveTo(24, -24, 34, -19); g.stroke(); g.strokeStyle = VERM_D; g.beginPath(); g.moveTo(36, 21); g.lineTo(43, 20); g.stroke(); }
  pc(MH, SH.hair, OCHRE_D, '#6a4418', 8, [[-6, -52], [-40, -34]]);
  arm('n', 0);
  g.setTransform(base); return J;
}

// ───────── frame
function camAt(t) {
  if (t < 2.5) return { x: PX + 80 + 10 * t, y: GY - 80, z: 2.2, r: 0 };
  if (t < 7.5) return { x: Xw(t) + 160, y: GY - 300, z: 1.15, r: 0 };
  if (t < 9.375) return { x: ROUND.x, y: ROUND.y, z: 1.72 + .03 * (t - 7.5), r: 0 };
  // hard cut on circles (the dial lands where the watch dial was, the same size), a short hold, then the pull back anchored on it
  const u = eout(sg(t, 9.45, 9.97)), z0 = 1.72 * 210 / TOWER.r, zEnd = 1920 / (WX1 - WX0) * 1.02, z = Math.exp(lp(Math.log(z0), Math.log(zEnd), u));
  const k = (1 / z - 1 / z0) / (1 / zEnd - 1 / z0), C = TOWER.clock;
  return { x: C[0] + ((WX0 + WX1) / 2 - C[0]) * k, y: C[1] + ((WY0 + WY1) / 2 - C[1]) * k, z, r: 0 };
}
function lightsAt(t) {
  const L = LAMPS.map(([x, y]) => ({ type: 'r', x, y, r: 420, a: .95 }));
  L.push({ type: 'r', x: PX + 20, y: GY - 120, r: 560, a: t > SPL.t0 ? .9 + .5 * Math.exp(-(t - SPL.t0) * 2) : .9 });    // the café's light over the puddle
  if (t >= 7.5 && t < 9.375) { const u = sm(sg(t, 7.6, 9.2)), d = [Math.cos(-.5), Math.sin(-.5)]; L.push({ type: 'b', x: lp(ROUND.x - 700, ROUND.x + 700, u), y: ROUND.y, nx: d[0], ny: d[1], w: 230, a: 1.7 }); }
  if (t >= EV.chime) { const u = t - EV.chime; for (const k of [0, .14]) if (u > k) L.push({ type: 'o', x: TOWER.clock[0], y: TOWER.clock[1], rad: (u - k) * 900, w: 60, a: 1.3 * Math.exp(-(u - k) * 1.2) }); L.push({ type: 'r', x: TOWER.clock[0], y: TOWER.clock[1], r: 260, a: 1.1 * cl(u / .15) }); }
  return L;
}
function render(t) {
  GP = [];
  resetCtx(FRg); MCg.setTransform(1, 0, 0, 1, 0, 0); MCg.clearRect(0, 0, 1920, 1080);
  MK = { g: MCg, pre: new DOMMatrix(), col: '#fff' };
  DIM = .85;
  const c = camAt(t), M = camMatrix(c); setZoom(c.z); FRg.setTransform(M);
  drawSkyAndCity(FRg);
  roundel(FRg, t >= 7.5 && t < 9.375 ? t : 0);
  for (let i = 0; i < HOUSES.length; i++) house(FRg, HOUSES[i], i);
  station(FRg);
  for (const [x, y] of LAMPS) lamp(FRg, x, y);
  street(FRg); puddle(FRg, t);
  // the stations already painted (continuous narration), then AKI herself
  for (const ts of STATIONS) { if (t < ts) continue; FRg.save(); aki(FRg, ts, cl((t - ts) / .45)); FRg.restore(); FRg.setTransform(M); }
  if (t < 7.5) { FRg.save(); aki(FRg, t, 1); FRg.restore(); FRg.setTransform(M); }
  splash(FRg, t);
  // painted border, seen in the pull back
  FRg.setTransform(M); const brd = pth(q => { q.rect(WX0 - 200, WY0 - 200, WX1 - WX0 + 400, WY1 - WY0 + 400); q.rect(WX0, WY0, WX1 - WX0, WY1 - WY0); });
  FRg.fillStyle = VERM_D; FRg.fill(brd, 'evenodd'); const brd2 = pth(q => q.rect(WX0 - 60, WY0 - 60, WX1 - WX0 + 120, WY1 - WY0 + 120)); goldStroke(FRg, brd2, 40); ink(FRg, pth(q => q.rect(WX0, WY0, WX1 - WX0, WY1 - WY0)), 4);
  FRg.setTransform(1, 0, 0, 1, 0, 0); FRg.save(); FRg.globalCompositeOperation = 'multiply'; FRg.globalAlpha = .14; FRg.fillStyle = FRg.createPattern(GRAINC, 'repeat'); FRg.fillRect(0, 0, 1920, 1080); FRg.restore();
  MK = null;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(FR, 0, 0);
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .42; ctx.fillStyle = 'rgb(150,158,206)'; ctx.fillRect(0, 0, 1920, 1080); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.setTransform(M); ctx.globalCompositeOperation = 'screen';
  for (const [x, y] of LAMPS) { const rg = ctx.createRadialGradient(x, y, 0, x, y, 420); rg.addColorStop(0, 'rgba(255,190,110,.3)'); rg.addColorStop(.4, 'rgba(220,150,80,.1)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = rg; ctx.fillRect(x - 420, y - 420, 840, 840); }
  ctx.globalCompositeOperation = 'source-over'; ctx.setTransform(1, 0, 0, 1, 0, 0);
  const lights = lightsAt(t);
  glintPass(M, lights, .05); glowPass(.6); flashes(M, lights);
  ctx.setTransform(M); ctx.globalCompositeOperation = 'lighter';
  for (const [x, y] of LAMPS) { const rg = ctx.createRadialGradient(x, y, 0, x, y, 90); rg.addColorStop(0, 'rgba(255,220,150,.5)'); rg.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = rg; ctx.fillRect(x - 90, y - 90, 180, 180); }
  ctx.globalCompositeOperation = 'source-over'; ctx.setTransform(1, 0, 0, 1, 0, 0);
  const v = ctx.createRadialGradient(960, 486, 454, 960, 540, 1134); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,12,40,.4)'); ctx.fillStyle = v; ctx.fillRect(0, 0, 1920, 1080);
}

await document.fonts.load('600 50px "Cormorant Garamond"');
GOLDC = makeGold(); GOLDF = makeGoldFine(512, 3, 1); GOLDFF = makeGoldFine(1024, 9, 1.6); SPKC = makeSpk(); GRAINC = makeGrain(); PAINTC = makePaint();
FR = cnv(1920, 1080); FRg = FR.getContext('2d'); OCC = cnv(1920, 1080); OCCg = OCC.getContext('2d', { willReadFrequently: true }); MC = cnv(1920, 1080); MCg = MC.getContext('2d', { willReadFrequently: true });
shapes();
window.render = render;
window.DUR = DUR;
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
render(0);
window.READY = true;
