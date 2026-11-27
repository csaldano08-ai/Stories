// 044 · Woodcut Print — the first 10 s of "Last Train Home" as four printed plates of a wordless woodcut novel (lemo-opuscar
// styles/woodcut). Every frame is a black wood block; light exists only where the knife cut it away (white = cut), cuts
// follow the form and widen with the light; printed by the engine's compositor onto laid paper inside a paper margin, with
// letterpress captions in the bottom margin. One colour plate, burnt copper, reserved for time: the watch and the station
// clock, showing only through carved white.
//   PLATE I    0–2.5    the café's puddle: the lit window carved in wide cuts, its sign cut out of the black, the same
//                      sign carved mirrored in the water; rain re-cut every 2 frames; AKI's legs (black wood, a white knife
//                      halo, grazing cuts on the lit edge, moving with each limb); on the splash (0.9375 s) a burst of rays
//                      and stab cuts is carved from the impact.
//   ─ a hard cut: a new impression (two frames out of register) ─
//   PLATE II   2.5–7.5  the camera moves over a long plate: shops as black blocks with carved windows and signs, lamps as
//                      carved light, stab-cut stars; AKI runs (on twos); 6.05–7.15 the watch, a speck of copper.
//   ─ the paper is pulled: the sheet peels off on a cylinder (7.22–7.66) ─
//   PLATE III  7.5–9.4  a slow macro push on a sculpted close-up (a height field through woodcutFilter): the sleeve, the
//                      hand, the watch; its dial carved white with copper in it, hands at 23:58, the second hand re-inked
//                      at each tick (8.4, 9.4).
//   ─ a new impression ─
//   PLATE IV   9.4–10   the station tower against a sky of fine cuts; on the chime (9.575) light is carved: rays burst
//                      from the clock and the copper spreads along them.
// AKI's parts are carved once in their own space and moved rigidly (no boil), placed by the shared run rig.
// Page contract: window.render(t), DUR, READY, RIGQA.
import * as WC from './engine/index.js';
import { curl, peelState } from './engine/trans.js';
import { Sculpt } from './engine/sculpt.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, back, ss, eo, ei, hash, mulberry, TAU } from './shared/lib/util.js';

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
const PH = EV.splash - Math.floor(EV.splash * 12) / 12;
const twos = t => Math.floor((t - PH) * 12 + 1e-6) / 12 + PH;

const W = 1920, H = 1080;
const cv = document.getElementById('cv'), G = cv.getContext('2d');
await document.fonts.load('600 40px "Cormorant Garamond"'); await document.fonts.load('italic 600 40px "Cormorant Garamond"');
const [mask, m] = WC.canvas(), [plateC, c] = WC.canvas(), PR = WC.makePrinter();
const [A1, a1] = WC.canvas(), [A2, a2] = WC.canvas(), [A3, a3] = WC.canvas();
const RECT = [70, 56, 1780, 838];                                     // the printed image area; the margin is paper
const LIGHT = WC.light(.62, -.62, .22);                                // grazing light: flat areas stay black
const COPPER = '#C8502A';

// ───────── AKI: parts carved once in their own space (px units at scale k), then moved rigidly
function capsule(L, w0, w1, n = 14) { const P = []; for (let i = 0; i <= n; i++) { const a = Math.PI + i / n * Math.PI; P.push([Math.cos(a) * w0, Math.sin(a) * w0]); } for (let i = 0; i <= n; i++) { const a = i / n * Math.PI; P.push([Math.cos(a) * w1, L + Math.sin(a) * w1]); } return P; }
function buildAki(k) {
  const J0 = solveProfile(RUN.pose(3)), dWP = Math.hypot(J0.pelvis[0] - J0.waist[0], J0.pelvis[1] - J0.waist[1]) * k, dWN = Math.hypot(J0.neckBase[0] - J0.waist[0], J0.neckBase[1] - J0.waist[1]) * k;
  const sc = p => p.map(([x, y]) => [x * k, y * k]);
  const o = (extra = {}) => ({ light: LIGHT, sp: Math.max(5, 9 * k), halo: Math.max(3, 7 * k), R: 30 * k, seed: 3, ...extra });
  const S = { k, dWP, dWN };
  S.thigh = WC.shape([sc(capsule(150, 25, 19))], o({ dir: 0 }));
  S.shin = WC.shape([sc(capsule(144, 19, 14))], o({ dir: 0 }));
  S.upper = WC.shape([sc(capsule(108, 16, 13))], o({ dir: 0 }));
  S.fore = WC.shape([sc(capsule(92, 13, 11))], o({ dir: 0 }));
  S.boot = WC.shape([sc([[-16, -36], [16, -36], [18, -8], [44, -2], [70, 6], [72, 16], [22, 18], [-24, 16], [-28, 0]])], o({ dir: Math.PI / 2 }));
  S.hand = WC.shape([sc([[-10, -2], [11, -2], [14, 18], [7, 33], [-4, 35], [-13, 20]])], o({ white: true, halo: 0 }));
  S.coatLo = WC.shape([[[-34 * k, 0], [30 * k, 0], [40 * k, dWP], [52 * k, dWP + 94 * k], [12 * k, dWP + 106 * k], [-30 * k, dWP + 108 * k], [-70 * k, dWP + 90 * k], [-46 * k, dWP]]], o({ dir: Math.PI / 2 - .2 }));
  S.coatUp = WC.shape([[[-36 * k, 6 * k], [34 * k, 6 * k], [40 * k, -dWN * .5], [30 * k, -dWN + 8 * k], [10 * k, -dWN - 6 * k], [-26 * k, -dWN - 4 * k], [-42 * k, -dWN * .5]]], o({ dir: Math.PI / 2 }));
  const face = sc([[16, -46], [36, -20], [46, -2], [39, 9], [41, 17], [35, 24], [33, 36], [12, 48], [-4, 46], [-4, 0], [2, -30]].map(([x, y]) => [x * 1.12, y * 1.12]));
  S.face = WC.shape([face], o({ white: true, halo: Math.max(3, 5 * k) }));
  S.hair = WC.shape([sc([[22, -46], [0, -60], [-34, -54], [-58, -22], [-58, 14], [-44, 40], [-22, 44], [-8, 20], [-2, -12], [8, -32]].map(([x, y]) => [x * 1.12, y * 1.12]))], o({ dir: 'contour' }));
  S.tail = WC.shape([sc([[0, -10], [36, -12], [74, -2], [36, 10], [0, 9]])], o({ dir: 0 }));
  return S;
}
const bone = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2;
const boneUp = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;
function drawAki(g, S, base, tq, o = {}) {
  const P_ = poseAt(tq), J = solveProfile(P_), k = S.k;
  const W2 = p => base.transformPoint(new DOMPoint(p[0] * k, p[1] * k));
  const at = (p, a) => { const q = W2(p); return new DOMMatrix([base.a, base.b, base.c, base.d, q.x, q.y]).rotate(a * 180 / Math.PI); };
  const put = (Mx, part) => { g.save(); g.setTransform(Mx); part.draw(g, 1e9); g.restore(); };
  const hc = J.headC, MH = at(hc, J.headA);
  put(MH.multiply(new DOMMatrix().translate(-60 * k, -12 * k).rotate((Math.PI - .25 + .14 * Math.sin(tq * TAU * CADENCE * .5)) * 180 / Math.PI)), S.tail);
  const arm = kk => { const a = J.arm[kk], h = [a.wr[0] + (a.wr[0] - a.el[0]) * .02, a.wr[1] + (a.wr[1] - a.el[1]) * .02]; put(at(a.sh, bone(a.sh, a.el)), S.upper); put(at(a.el, bone(a.el, a.wr)), S.fore); put(at(h, bone(a.el, a.wr)), S.hand); };
  const leg = kk => { const l = J.leg[kk]; put(at(l.hip, bone(l.hip, l.knee)), S.thigh); put(at(l.knee, bone(l.knee, l.ankle)), S.shin); put(at(l.ankle, l.pitch), S.boot); };
  arm('f'); leg('f'); put(at(J.waist, bone(J.waist, J.pelvis)), S.coatLo); leg('n'); put(at(J.waist, boneUp(J.waist, J.neckBase)), S.coatUp);
  put(MH, S.face);
  g.save(); g.setTransform(MH); g.fillStyle = '#000'; g.beginPath(); g.ellipse(26 * k, -11 * k, 5.5 * k, 3.2 * k, 0, 0, TAU); g.fill(); g.lineWidth = 3 * k; g.strokeStyle = '#000'; g.beginPath(); g.moveTo(13 * k, -21 * k); g.quadraticCurveTo(24 * k, -25 * k, 35 * k, -20 * k); g.stroke(); g.beginPath(); g.moveTo(37 * k, 22 * k); g.lineTo(44 * k, 21 * k); g.stroke(); g.restore();
  put(MH, S.hair);
  arm('n');
  if (o.watch && P_.watch > .3) { const a = J.arm.n, q = W2([a.wr[0] - (a.wr[0] - a.el[0]) * .15, a.wr[1] - (a.wr[1] - a.el[1]) * .15]); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#fff'; g.beginPath(); g.arc(q.x, q.y, 11 * k * base.a, 0, TAU); g.fill(); g.restore(); WC.plate(c, cc => cc.arc(q.x, q.y, 11 * k * base.a, 0, TAU), 1); }
  return J;
}

// ───────── PLATE I: the puddle
const K1 = .95, GY1 = 760, PX1 = 900;
const P1 = {};
function buildPlate1() {
  P1.aki = buildAki(K1);
  P1.win = WC.hatch(new WC.Region([WC.rect(330, 160, 760, 420)], { res: 2 }), { dir: WC.dirAngle(0), tone: (x, y) => .82 + .14 * Math.sin(x * .01), sp: 9, wmax: 8, lo: .2, hi: .98, kind: 'v', seed: 5 });
  P1.door = WC.cutAlong(WC.rect(1240, 230, 190, 530), { closed: true, w: 3, kind: 'k', seed: 6 });
  P1.cobble = WC.hatch(new WC.Region([WC.rect(70, GY1 + 6, 1780, 190)], { res: 2 }), { dir: (x, y) => Math.PI / 2 * .1 + Math.sin(x * .02) * .3, tone: (x, y) => .38 + .3 * clamp(1 - Math.abs(x - 900) / 900), sp: 11, wmax: 6, lo: .2, hi: .9, kind: 'v', seed: 7 });
  const pud = WC.ellipse(940, GY1 + 70, 380, 52);
  P1.pud = pud;
  P1.pudCuts = WC.hatch(new WC.Region([pud], { res: 2 }), { dir: WC.dirAngle(0), tone: (x, y) => .72 + .25 * Math.cos((x - 940) / 380 * 1.4), sp: 8, wmax: 6.5, lo: .25, hi: .98, kind: 'v', seed: 8 });
  P1.ground = WC.cutAlong([[70, GY1], [1850, GY1 + 4]], { w: 4, kind: 'k', seed: 9 });
  P1.rays = WC.rays(PX1 + 30, GY1 + 4, { n: 30, r0: 30, r1: [120, 260], w: 9, a0: Math.PI, a1: TAU, seed: 4, reveal: { t0: EV.splash, t1: EV.splash + .2, jit: .3 } });
  const R = mulberry(12); P1.drops = WC.flecks(Array.from({ length: 22 }, () => { const a = Math.PI + R() * Math.PI, r = 160 + R() * 160; return [PX1 + 30 + Math.cos(a) * r, GY1 - 20 + Math.sin(a) * r * .8, 3 + R() * 4]; }), { seed: 13 });
}
function rain(g, t, box, n, seed) {
  const f = Math.floor(t * 12), R = mulberry(seed + f * 31), pts = [];
  for (let i = 0; i < n; i++) { const x = box[0] + R() * box[2], y = box[1] + R() * box[3], l = 30 + R() * 50; pts.push(WC.mkStroke([[x, y], [x + l * .2, y + l]], [2.6, .6], { kind: 'v', seed: R() * 999 })); }
  WC.drawStrokes(g, pts, { color: '#fff' });
}
function plate1(t) {
  m.setTransform(1, 0, 0, 1, 0, 0); m.fillStyle = '#000'; m.fillRect(RECT[0], RECT[1], RECT[2], RECT[3]);
  WC.drawStrokes(m, P1.win, { color: '#fff' });
  m.fillStyle = '#000'; for (let x = 330 + 190; x < 1090; x += 190) m.fillRect(x - 5, 160, 10, 420); m.fillRect(330, 360, 760, 10);
  m.fillStyle = '#fff'; m.font = '600 120px "Cormorant Garamond"'; m.textAlign = 'center'; m.fillText('CAFE', 710, 132);
  m.font = '600 84px "Cormorant Garamond"'; m.fillText('24H', 1560, 132);
  WC.drawStrokes(m, P1.door, { color: '#fff' });
  WC.drawStrokes(m, P1.ground, { color: '#fff' }); WC.drawStrokes(m, P1.cobble, { color: '#fff' });
  m.fillStyle = '#000'; m.beginPath(); WC.pathOf(m, P1.pud); m.fill();
  // the water: horizontal cuts, the sign carved in it mirrored; after the splash the cuts shake
  const u = t - EV.splash, sh = u > 0 ? Math.sin(u * 40) * 7 * Math.exp(-u * 2.2) : 0;
  m.save(); m.beginPath(); WC.pathOf(m, P1.pud); m.clip(); m.translate(sh, 0); WC.drawStrokes(m, P1.pudCuts, { color: '#fff' });
  m.fillStyle = '#000'; m.translate(940, GY1 + 68); m.scale(1, -1); m.font = '600 64px "Cormorant Garamond"'; m.fillText('24H  CAFE', 0, 0); m.restore();
  rain(m, t, [RECT[0], RECT[1], RECT[2], GY1 - RECT[1]], 46, 21);
  drawAki(m, P1.aki, new DOMMatrix([1, 0, 0, 1, PX1 - SPL.x * K1, GY1]), twos(t));
  if (u > 0) { WC.drawStrokes(m, P1.rays, { t }); if (u < .7) WC.drawStrokes(m, P1.drops.map(s => ({ ...s })), { color: '#fff' }); }
}

// ───────── PLATE II: the street (a long plate under a moving camera)
const K2 = .62, GY2 = 760, PX2 = 600;
const P2 = {};
const xs2 = t => PX2 + (X(t) - X(2.5)) * K2;
function buildPlate2() {
  P2.aki = buildAki(K2);
  P2.shops = []; const R = mulberry(5); let x = 0; const N = ['BAKERY', 'BOOKS', 'NOODLES', 'BAR', 'FLOWERS', 'HOTEL', 'RECORDS', 'LAUNDRY', 'NEWS'];
  for (let i = 0; i < 9; i++) {
    const w = 380 + R() * 160, h = 300 + R() * 180, top = GY2 - h;
    const wins = WC.hatch(new WC.Region([WC.rect(x + 40, top + 110, w - 80, h - 180)], { res: 2 }), { dir: WC.dirAngle(0), tone: () => .86, sp: 8, wmax: 7, lo: .2, hi: .98, kind: 'v', seed: 30 + i });
    const edge = WC.cutAlong(WC.rect(x + 8, top, w - 16, h), { closed: true, w: 3, kind: 'k', seed: 40 + i });
    P2.shops.push({ x, w, h, top, wins, edge, name: N[i] }); x += w + 50;
  }
  P2.cobble = WC.hatch(new WC.Region([WC.rect(-200, GY2 + 6, 5200, 160)], { res: 2 }), { dir: (x, y) => Math.sin(x * .013) * .3, tone: () => .4, sp: 12, wmax: 5, lo: .2, hi: .9, kind: 'v', seed: 50 });
  P2.lamps = []; for (let lx = 420; lx < 5000; lx += 760) P2.lamps.push({ x: lx, rays: WC.rays(lx, GY2 - 230, { n: 24, r0: 18, r1: [50, 110], w: 6, seed: lx | 0 }), post: WC.cutAlong([[lx, GY2], [lx, GY2 - 220]], { w: 4, kind: 'k', seed: lx | 0 }) });
  const Rs = mulberry(61); P2.stars = WC.flecks(Array.from({ length: 70 }, () => [-200 + Rs() * 5400, 80 + Rs() * 260, 2 + Rs() * 2.5]), { seed: 62 });
}
function plate2(t) {
  const cx = Math.max(960, xs2(t) + 200), CM = new DOMMatrix([1, 0, 0, 1, 960 - cx, 0]);
  m.setTransform(1, 0, 0, 1, 0, 0); m.fillStyle = '#000'; m.fillRect(RECT[0], RECT[1], RECT[2], RECT[3]);
  m.save(); m.beginPath(); m.rect(...RECT); m.clip(); m.setTransform(CM);
  WC.drawStrokes(m, P2.stars, { color: '#fff' });
  for (const s of P2.shops) {
    WC.drawStrokes(m, s.edge, { color: '#fff' }); WC.drawStrokes(m, s.wins, { color: '#fff' });
    m.fillStyle = '#000'; for (let x = s.x + 40 + (s.w - 80) / 3; x < s.x + s.w - 50; x += (s.w - 80) / 3) m.fillRect(x - 4, s.top + 110, 8, s.h - 180);
    m.fillStyle = '#fff'; m.font = '600 54px "Cormorant Garamond"'; m.textAlign = 'center'; m.fillText(s.name, s.x + s.w / 2, s.top + 78);
  }
  for (const L of P2.lamps) { WC.drawStrokes(m, L.rays, { color: '#fff' }); WC.drawStrokes(m, L.post, { color: '#fff' }); }
  WC.drawStrokes(m, P2.cobble, { color: '#fff' });
  m.restore(); m.save(); m.beginPath(); m.rect(...RECT); m.clip();
  drawAki(m, P2.aki, new DOMMatrix([1, 0, 0, 1, PX2 - X(2.5) * K2 + 960 - cx, GY2]), twos(t), { watch: true });
  m.restore();
}

// ───────── PLATE III: the watch (a sculpted height field through woodcutFilter)
const P3 = {};
const AH = -Math.PI / 2 + (11 + 58 / 60) / 12 * TAU, AM = -Math.PI / 2 + 58 / 60 * TAU, WC0 = [1020, 450], WRR = 190;
function buildPlate3() {
  const S = new Sculpt(1780, 838), o = [70, 56];
  S.capsule([-200, 470 - o[1]], [700, 420 - o[1]], 190, 160, { zs: .9, mat: 0 });
  S.blob(1330 - o[0], 440 - o[1], 330, 150, -.05, { zs: .7, mat: 1 });
  S.capsule([1020 - o[0], -60], [1020 - o[0], 900], 110, 110, { zs: .5, z0: 20, mat: 2, smooth: 4 });
  S.blob(WC0[0] - o[0], WC0[1] - o[1], WRR + 30, WRR + 30, 0, { zs: .55, z0: 60, mat: 3, smooth: 3 });
  S.creases(1460 - o[0], 440 - o[1], 0, 80, 4, 2, 8);
  S.noise(1.2, 3);
  const img = S.shade([.55, -.6, .58], { amb: .04, spec: .3 });
  const F = WC.woodcutFilter(img, { rect: [o[0], o[1], 1780, 838], sp: 6, black: .12, white: .92, gamma: 1.1, seed: 7 });
  P3.cuts = F.strokes;
  P3.ticks = []; for (let k = 0; k < 12; k++) { const a = -Math.PI / 2 + k / 12 * TAU, r0 = k % 3 ? 150 : 130; P3.ticks.push([[WC0[0] + Math.cos(a) * r0, WC0[1] + Math.sin(a) * r0], [WC0[0] + Math.cos(a) * 176, WC0[1] + Math.sin(a) * 176], k % 3 ? 6 : 12]); }
}
function plate3(t) {
  const z = lerp(1.0, 1.06, ss(seg(t, 7.4, 9.4))), bob = 8 * Math.sin(TAU * CADENCE * (t - 7.5));
  const CM = new DOMMatrix().translate(960, 470 + bob).scale(z).translate(-960, -470);
  m.setTransform(1, 0, 0, 1, 0, 0); m.fillStyle = '#000'; m.fillRect(RECT[0], RECT[1], RECT[2], RECT[3]);
  m.save(); m.beginPath(); m.rect(...RECT); m.clip(); m.setTransform(CM);
  WC.drawStrokes(m, P3.cuts, { color: '#fff' });
  // the dial: carved white, the copper plate in it; ticks and hands left as wood (re-inked)
  m.fillStyle = '#fff'; m.beginPath(); m.arc(WC0[0], WC0[1], WRR - 10, 0, TAU); m.fill();
  m.strokeStyle = '#000'; m.lineCap = 'round';
  for (const [a, b, w] of P3.ticks) { m.lineWidth = w; m.beginPath(); m.moveTo(...a); m.lineTo(...b); m.stroke(); }
  m.lineWidth = 16; m.beginPath(); m.moveTo(...WC0); m.lineTo(WC0[0] + Math.cos(AH) * 92, WC0[1] + Math.sin(AH) * 92); m.stroke();
  m.lineWidth = 11; m.beginPath(); m.moveTo(...WC0); m.lineTo(WC0[0] + Math.cos(AM) * 150, WC0[1] + Math.sin(AM) * 150); m.stroke();
  const tq = twos(t), s = tq < 8.4 ? 47 : tq < 9.4 ? 48 : 49, as = -Math.PI / 2 + s / 60 * TAU;
  m.lineWidth = 5; m.beginPath(); m.moveTo(WC0[0] - Math.cos(as) * 30, WC0[1] - Math.sin(as) * 30); m.lineTo(WC0[0] + Math.cos(as) * 168, WC0[1] + Math.sin(as) * 168); m.stroke();
  m.fillStyle = '#000'; m.beginPath(); m.arc(...WC0, 12, 0, TAU); m.fill();
  m.restore();
  c.save(); c.setTransform(CM); WC.plate(c, cc => cc.arc(WC0[0], WC0[1], WRR - 10, 0, TAU), .9); c.restore();
}

// ───────── PLATE IV: the station clock
const P4 = {}, CL = [1100, 360];
function buildPlate4() {
  P4.sky = WC.hatch(new WC.Region([WC.rect(70, 56, 1780, 600)], { res: 2 }), { dir: WC.dirAngle(0), tone: (x, y) => .55 - .4 * clamp((y - 56) / 600), sp: 10, wmax: 5, lo: .2, hi: .9, kind: 'v', seed: 70 });
  P4.tower = WC.shape([[[CL[0] - 150, 900], [CL[0] - 150, CL[1] - 130], [CL[0], CL[1] - 330], [CL[0] + 150, CL[1] - 130], [CL[0] + 150, 900]]], { light: LIGHT, sp: 9, halo: 8, R: 40, seed: 71, dir: Math.PI / 2 });
  P4.roofs = WC.shape([[[70, 900], [70, 640], [260, 600], [420, 660], [600, 580], [800, 640], [920, 620], [920, 900]], [[1290, 900], [1290, 600], [1480, 640], [1650, 570], [1850, 630], [1850, 900]]], { light: LIGHT, sp: 10, halo: 6, R: 30, seed: 72, dir: 0 });
  P4.rays = WC.rays(CL[0], CL[1], { n: 44, r0: 110, r1: [380, 900], w: 14, seed: 73, reveal: { t0: EV.chime, t1: EV.chime + .3, jit: .4 } });
  P4.ticks = []; for (let k = 0; k < 12; k++) { const a = -Math.PI / 2 + k / 12 * TAU; P4.ticks.push([CL[0] + Math.cos(a) * 80, CL[1] + Math.sin(a) * 80, k % 3 ? 4 : 7]); }
}
function plate4(t) {
  m.setTransform(1, 0, 0, 1, 0, 0); m.fillStyle = '#000'; m.fillRect(RECT[0], RECT[1], RECT[2], RECT[3]);
  m.save(); m.beginPath(); m.rect(...RECT); m.clip();
  WC.drawStrokes(m, P4.sky, { color: '#fff' });
  if (t >= EV.chime) WC.drawStrokes(m, P4.rays, { t });
  P4.roofs.draw(m); P4.tower.draw(m);
  m.fillStyle = '#fff'; m.beginPath(); m.arc(...CL, 100, 0, TAU); m.fill();
  m.fillStyle = '#000'; for (const [x, y, r] of P4.ticks) { m.beginPath(); m.arc(x, y, r, 0, TAU); m.fill(); }
  m.strokeStyle = '#000'; m.lineCap = 'round'; m.lineWidth = 12; m.beginPath(); m.moveTo(...CL); m.lineTo(CL[0] + Math.cos(AH) * 48, CL[1] + Math.sin(AH) * 48); m.stroke();
  m.lineWidth = 8; m.beginPath(); m.moveTo(...CL); m.lineTo(CL[0] + Math.cos(AM) * 74, CL[1] + Math.sin(AM) * 74); m.stroke();
  m.restore();
  const spread = t >= EV.chime ? eo(seg(t, EV.chime, EV.chime + .35)) : 0;
  c.save(); c.beginPath(); c.rect(...RECT); c.clip(); WC.plate(c, cc => { cc.arc(CL[0], CL[1], 100 + 520 * spread, 0, TAU); }, .85); c.restore();
}

// ───────── captions (letterpress in the margin) and the print
const CAPS = [[0, 2.5, 'I · the puddle'], [2.5, 7.5, 'II · the street'], [7.5, 9.375, 'III · twenty-three fifty-eight'], [9.375, 10.1, 'IV · the last train']];
function caption(t) {
  const cp = CAPS.find(q => t >= q[0] && t < q[1]); if (!cp) return;
  const a = clamp((t - cp[0]) / .1) * (1 - clamp((t - (cp[1] - .15)) / .15));
  m.setTransform(1, 0, 0, 1, 0, 0); m.fillStyle = `rgba(0,0,0,${a})`; m.font = 'italic 600 42px "Cormorant Garamond"'; m.textAlign = 'center'; m.fillText(cp[2], 960, 1000);
}
function printPlate(t, which, out) {
  m.setTransform(1, 0, 0, 1, 0, 0); m.fillStyle = '#fff'; m.fillRect(0, 0, W, H);
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
  if (which === 1) plate1(t); else if (which === 2) plate2(t); else if (which === 3) plate3(t); else plate4(t);
  caption(t);
  const cut = [2.5, 9.375].find(b => t >= b && t < b + 2 / 30), reg = cut ? [4, -3] : [0, 0];
  const r = PR.render(mask, plateC, { mode: 'print', seed: 4, inkSeed: which * 13 + 1, plate: COPPER, reg });
  out.setTransform(1, 0, 0, 1, 0, 0); out.drawImage(r, 0, 0);
}
const PEEL = [7.22, 7.66];
function render(t) {
  if (t < 2.5) return printPlate(t, 1, G);
  if (t < PEEL[0]) return printPlate(t, 2, G);
  if (t < PEEL[1]) {
    // the sheet is pulled: plate III lies beneath; plate II curls off on a cylinder, its back showing the mirrored show-through
    printPlate(Math.max(t, 7.5), 3, a3); printPlate(PEEL[0], 2, a1);
    a2.setTransform(-1, 0, 0, 1, W, 0); a2.drawImage(A1, 0, 0); a2.setTransform(1, 0, 0, 1, 0, 0); a2.fillStyle = 'rgba(239,232,216,.78)'; a2.fillRect(0, 0, W, H);
    G.setTransform(1, 0, 0, 1, 0, 0); G.drawImage(A3, 0, 0);
    const { xf, r } = peelState((t - PEEL[0]) / (PEEL[1] - PEEL[0]));
    curl(G, A1, A2, xf, r);
    return;
  }
  if (t < 9.375) return printPlate(t, 3, G);
  return printPlate(t, 4, G);
}

buildPlate1(); buildPlate2(); buildPlate3(); buildPlate4();
window.render = render;
window.DUR = DUR;
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(twos(t))); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
render(0);
window.READY = true;
