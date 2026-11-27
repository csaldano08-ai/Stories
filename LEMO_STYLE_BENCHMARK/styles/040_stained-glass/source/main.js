// 040 · Stained Glass — the first 10 s of "Last Train Home" told in a long clerestory window of twelve lights, seen from
// inside a dark stone hall (lemo-opuscar styles/stained-glass). Cut pieces of pot-metal glass in lead cames, faces and folds
// in brown grisaille; glass has no light of its own: it glows only where light is behind it (engine/comp.js: backlight ×
// transmittance × glass texture, room light on stone and lead, flagstone floor with the projected colour patch, bloom).
// Secular and original: a night street, its shops, a girl running for the last train; no religious imagery.
//   Light is the clock and the camera: the café's lamp (a point light) wakes the puddle light; a band of warm lamplight
//   runs along the window WITH AKI, so the pane she is in is alive and the ones she has left fall dark and milky.
//   S1 0–2.5    locked close on the puddle light: the café sign painted upside down on the pale-blue water glass;
//               the boot lands at 0.9375 s: white splash pieces appear by being lit, ripples painted in grisaille.
//   S2 2.5–7.5  truck sideways with the band of light along the lights (24H, CAFE, BAKERY, BOOKS, NOODLES, BAR, FLOWERS,
//               HOTEL, RECORDS, LAUNDRY); figures step at 8 fps, light and camera move on ones; 6.05–7.15 the watch.
//   S3 7.5–9.4  tilt up to the rose: the rose IS the watch (a dial window: gold rim, white glass face with painted numerals,
//               murrey hands at 23:58); it is lit on the 7.5 hit; the second hand piece steps at 8.4 and 9.4.
//   S4 9.4–10   pull back to the whole window and the floor: on the chime (9.575) the last light — the station clock —
//               is lit from behind (a source no glass colour uses) and throws its patch on the flagstones.
// AKI is a figure of rigid glass pieces on a 2D FK rig placed by the shared run rig (constant lengths, foot lock).
// Engine: engine/glass.js and engine/comp.js copied unchanged; engine/window_kit.js an excerpt of window.js.
// Page contract: window.render(t), DUR, READY, RIGQA.
import { makeComp } from './engine/comp.js';
import { COL, Pass, smooth, circle, ellipse, brush, line as gline, INK, softPoly } from './engine/glass.js';
import { lozenges, vineCurl, stonePattern } from './engine/window_kit.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, back, ss, eo, ei, eio, hash, mulberry, TAU } from './shared/lib/util.js';

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
const PH8 = EV.splash - Math.floor(EV.splash * 8) / 8;               // the 8 fps grid's phase: a step lands on the splash
const step8 = t => Math.floor((t - PH8) * 8 + 1e-6) / 8 + PH8;

const cv = document.getElementById('gl'), comp = makeComp(cv);
const mk = (w = 1920, h = 1080) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const L = { G: mk(), S: mk(), R: mk(), O: mk(), P: mk(1024, 768) };
const Lc = {}; for (const k in L) Lc[k] = L[k].getContext('2d');
await document.fonts.load('600 40px "Cormorant Garamond"');

// ───────── the window (world units, y down)
const FLOOR = 900, LW = 560, PITCH = 640, SPR = -300, BOT = 440, NL = 12, BORDER = 30, RUBY = 18;
const LXc = i => (i - 1) * PITCH;                                     // light 1 holds the puddle (x = 0)
const GG = 372;                                                       // street level painted inside the lights
const K = .62;
const Wp = p => [(p[0] - SPL.x) * K, GG + p[1] * K];
const Xw = t => Wp([X(t), 0])[0];
const RLIGHT = Math.round(Xw(7.5) / PITCH) + 1, ROSE = { x: LXc(RLIGHT), y: -790, r: 250 };
const STATION = NL - 1;
function lightPath(cx, ins = 0) {
  const x0 = cx - LW / 2 + ins, x1 = cx + LW / 2 - ins, top = SPR - 190 + ins * 1.2, p = new Path2D();
  p.moveTo(x0, BOT - ins); p.lineTo(x0, SPR); p.quadraticCurveTo(x0, SPR - 150, cx, top); p.quadraticCurveTo(x1, SPR - 150, x1, SPR); p.lineTo(x1, BOT - ins); p.closePath(); return p;
}
function samples(cx, ins, step) {
  const c = document.createElement('canvas').getContext('2d'), out = [], x0 = cx - LW / 2 + ins, x1 = cx + LW / 2 - ins;
  for (let y = BOT - ins - step * .6; y > SPR; y -= step) out.push([x0, y]);
  for (let u = 0; u <= 1; u += step / 420) { const q = 1 - u; out.push([q * q * x0 + 2 * q * u * x0 + u * u * cx, q * q * SPR + 2 * q * u * (SPR - 150) + u * u * (SPR - 190 + ins * 1.2)]); }
  for (let u = 0; u <= 1; u += step / 420) { const q = 1 - u; out.push([q * q * cx + 2 * q * u * x1 + u * u * x1, q * q * (SPR - 190 + ins * 1.2) + 2 * q * u * (SPR - 150) + u * u * SPR]); }
  for (let y = SPR + step * .4; y < BOT - ins - step * .3; y += step) out.push([x1, y]);
  return out;
}
const SIGNS = ['24H', 'CAFE', 'BAKERY', 'BOOKS', 'NOODLES', 'BAR', 'FLOWERS', 'HOTEL', 'RECORDS', 'LAUNDRY', 'NEWS', ''];
const LIGHTS = Array.from({ length: NL }, (_, i) => {
  const cx = LXc(i), box = [cx - LW / 2 + BORDER - 4, SPR - 200, cx + LW / 2 - BORDER + 4, BOT - BORDER + 4];
  return { i, cx, cells: lozenges(box, 34, 11 + i * 7).filter(c => c.c[1] < GG - 250), pearls: samples(cx, RUBY / 2, 24), band: samples(cx, (RUBY + BORDER) / 2, 3.4),
    outer: lightPath(cx, 0), mid: lightPath(cx, RUBY), inner: lightPath(cx, BORDER), sign: SIGNS[i] };
});

// ───────── light contents
function border(P, Lt) {
  P.piece(Lt.outer, COL.ruby, { id: 900 + Lt.i, lead: 6, mat: false, edge: 5 });
  P.piece(Lt.mid, COL.white, { id: 920 + Lt.i, lead: 5, mat: false, edge: 4, paint: g => {
    const b = Lt.band; g.lineCap = 'round';
    for (let k = 2; k < b.length - 2; k++) { const p = b[k], q = b[k + 1], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, ph = k * .9;
      g.strokeStyle = 'rgba(44,26,12,.75)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(p[0] + nx * Math.sin(ph) * 3, p[1] + ny * Math.sin(ph) * 3); g.lineTo(q[0] + nx * Math.sin(ph + .9) * 3, q[1] + ny * Math.sin(ph + .9) * 3); g.stroke(); }
  } });
}
const scroll = (P, cx, y, w, text, id) => {
  const pts = [[cx - w / 2 - 26, y - 8], [cx - w / 2, y - 34, 1], [cx + w / 2, y - 34, 1], [cx + w / 2 + 26, y - 8], [cx + w / 2, y + 30, 1], [cx - w / 2, y + 30, 1]];
  P.piece(smooth(pts), COL.white, { id, lead: 5, matW: 6, paint: g => { g.fillStyle = 'rgba(44,26,12,.9)'; g.font = '600 46px "Cormorant Garamond"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '4px'; g.fillText(text, cx, y - 2); } });
};
function shopfront(P, Lt) {
  const cx = Lt.cx, id = 3000 + Lt.i * 40, top = GG - 300;
  P.piece(smooth([[cx - 260, GG + 6, 1], [cx - 260, top, 1], [cx + 260, top, 1], [cx + 260, GG + 6, 1]]), Lt.i % 2 ? COL.purple : COL.purple2, { id, lead: 5.5, matW: 14, paint: g => {
    g.strokeStyle = 'rgba(30,14,30,.5)'; g.lineWidth = 1.6; g.beginPath(); for (let y = top + 30; y < GG; y += 34) { g.moveTo(cx - 260, y); g.lineTo(cx + 260, y); } g.stroke(); } });
  P.piece(smooth([[cx - 274, top + 8, 1], [cx - 240, top - 46, 1], [cx + 240, top - 46, 1], [cx + 274, top + 8, 1]]), Lt.i % 3 === 0 ? COL.green : Lt.i % 3 === 1 ? COL.teal : COL.olive, { id: id + 1, lead: 5, matW: 8, paint: g => {
    for (let x = cx - 230; x < cx + 240; x += 46) brush(g, [[x, top - 40], [x + 10, top - 16], [x + 4, top + 2]], 2, { color: 'rgba(20,30,14,.55)' }); } });
  // lit shop window (gold) with painted glazing bars, and a door
  P.piece(smooth([[cx - 210, GG - 30, 1], [cx - 210, top + 70, 1], [cx + 70, top + 70, 1], [cx + 70, GG - 30, 1]]), COL.gold2, { id: id + 2, lead: 6, matW: 10, paint: g => {
    g.fillStyle = 'rgba(60,34,10,.55)'; for (let x = cx - 140; x < cx + 70; x += 70) g.fillRect(x - 3, top + 70, 6, GG - 100 - top); g.fillRect(cx - 210, (GG - 30 + top + 70) / 2 - 3, 280, 6); } });
  P.piece(smooth([[cx + 120, GG + 4, 1], [cx + 120, top + 90], [cx + 165, top + 70], [cx + 210, top + 90], [cx + 210, GG + 4, 1]]), COL.brown, { id: id + 3, lead: 5, matW: 8, paint: g => { g.fillStyle = INK; g.beginPath(); g.arc(cx + 196, GG - 90, 4, 0, TAU); g.fill(); } });
  if (Lt.sign) scroll(P, cx - 20, top - 96, Math.max(150, Lt.sign.length * 30), Lt.sign, id + 4);
}
function ground(P, Lt) {
  const cx = Lt.cx;
  P.piece(smooth([[cx - 290, BOT + 10, 1], [cx - 290, GG + 4, 1], [cx + 290, GG + 4, 1], [cx + 290, BOT + 10, 1]]), COL.brown, { id: 5000 + Lt.i, lead: 6, matW: 10, paint: g => {
    g.strokeStyle = 'rgba(40,22,8,.5)'; g.lineWidth = 1.8; g.beginPath(); for (let y = GG + 22; y < BOT; y += 22) { g.moveTo(cx - 290, y); g.lineTo(cx + 290, y); } g.stroke();
    g.strokeStyle = 'rgba(255,236,200,.35)'; g.lineWidth = 2; g.beginPath(); for (let x = cx - 270; x < cx + 270; x += 70) { g.moveTo(x, GG + 30); g.lineTo(x + 36, GG + 30); } g.stroke(); } });
}
function puddle(P, t) {
  const cx = 30, y = GG + 26;
  P.piece(smooth([[cx - 240, y], [cx - 120, y - 22], [cx + 60, y - 26], [cx + 230, y - 10], [cx + 200, y + 22], [cx - 40, y + 30], [cx - 220, y + 20]]), COL.blue2, { id: 5100, lead: 6, matW: 8, paint: g => {
    g.save(); g.translate(cx - 10, y + 2); g.scale(1, -1); g.fillStyle = 'rgba(30,18,8,.92)'; g.font = '600 34px "Cormorant Garamond"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '6px';
    const rip = t > SPL.t0 ? Math.sin((step8(t) - SPL.t0) * 22) * 4 * Math.exp(-(t - SPL.t0) * 1.6) : 0; g.transform(1, 0, rip * .03, 1, rip, 0); g.fillText('24H  CAFE', 0, 0); g.restore();
    if (t > SPL.t0) { const u = step8(t) - SPL.t0; g.strokeStyle = 'rgba(44,26,12,.55)'; g.lineWidth = 2.2; for (let k = 0; k < 3; k++) { const r = 30 + (u * 260 + k * 46) % 180; g.beginPath(); g.ellipse(cx + 26, y + 6, r, r * .18, 0, 0, TAU); g.stroke(); } }
  } });
}
function splash(P, t) {
  const u = step8(t) - SPL.t0; if (u < 0 || u > .62) return;
  const fx = Wp([SPL.x, 0])[0] + 26, s = u < .13 ? .6 : u < .26 ? 1 : u < .38 ? 1.1 : u < .5 ? .8 : .5;
  for (let k = -3; k <= 3; k++) { const h = (70 + 26 * Math.cos(k * .8)) * s, a = k * .3, bx = fx + k * 20;
    P.piece(smooth([[bx - 8, GG + 6, 1], [bx + Math.sin(a) * h * .5 - 6, GG - h * .55], [bx + Math.sin(a) * h, GG - h, 1], [bx + Math.sin(a) * h * .5 + 6, GG - h * .55], [bx + 8, GG + 6, 1]]), COL.white, { id: 5200 + k, lead: 3.5, mat: false }); }
  if (u > .2) for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k / 6 - .5) * 2.4, r = 120 + 50 * hash(k), x = fx + Math.cos(a) * r * (u * 1.6), y = GG - 20 + Math.sin(a) * r * u * 1.4 + 500 * u * u; P.piece(ellipse(x, y, 7, 10, a), COL.white, { id: 5220 + k, lead: 2.6, mat: false }); }
}
function station(P, cx) {
  const id = 6000;
  P.piece(smooth([[cx - 90, GG + 6, 1], [cx - 90, -60, 1], [cx + 90, -60, 1], [cx + 90, GG + 6, 1]]), COL.gold, { id, lead: 6, matW: 14, paint: g => {
    g.strokeStyle = 'rgba(60,34,10,.55)'; g.lineWidth = 1.6; g.beginPath(); for (let y = -40; y < GG; y += 30) { g.moveTo(cx - 90, y); g.lineTo(cx + 90, y); for (let x = cx - 90 + ((y / 30) % 2 ? 22 : 0); x < cx + 90; x += 44) { g.moveTo(x, y); g.lineTo(x, y + 30); } } g.stroke(); } });
  P.piece(smooth([[cx - 110, -50, 1], [cx, -250, 1], [cx + 110, -50, 1]]), COL.ruby, { id: id + 1, lead: 6, matW: 10 });
  P.piece(circle(cx, 70, 66), COL.gold2, { id: id + 2, lead: 6, mat: false });
  P.piece(circle(cx, 70, 54), COL.white, { id: id + 3, lead: 5, matW: 10, paint: g => {
    g.fillStyle = 'rgba(44,26,12,.85)'; for (let k = 0; k < 12; k++) { const a = -Math.PI / 2 + k / 12 * TAU; g.beginPath(); g.arc(cx + Math.cos(a) * 44, 70 + Math.sin(a) * 44, k % 3 ? 2.2 : 4, 0, TAU); g.fill(); } } });
  const hand = (a, r, w, k) => P.piece(smooth([[cx - Math.cos(a) * 6 - Math.sin(a) * w, 70 - Math.sin(a) * 6 + Math.cos(a) * w, 1], [cx + Math.cos(a) * r, 70 + Math.sin(a) * r, 1], [cx - Math.cos(a) * 6 + Math.sin(a) * w, 70 - Math.sin(a) * 6 - Math.cos(a) * w, 1]]), COL.purple2, { id: id + 10 + k, lead: 2.6, mat: false });
  hand(AH, 28, 5, 0); hand(AM, 42, 4, 1);
  P.solder(cx, 70, 5);
}
const AH = -Math.PI / 2 + (11 + 58 / 60) / 12 * TAU, AM = -Math.PI / 2 + 58 / 60 * TAU;

// ───────── AKI in glass: rigid pieces on the FK rig (local units = rig units; P transform = world · K)
const bone = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2;
const boneUp = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;
let SHAPES = null;
function buildShapes() {
  const J0 = solveProfile(RUN.pose(3)), dWP = Math.hypot(J0.pelvis[0] - J0.waist[0], J0.pelvis[1] - J0.waist[1]), dWN = Math.hypot(J0.neckBase[0] - J0.waist[0], J0.neckBase[1] - J0.waist[1]);
  const limb = (L, w0, w1) => smooth([[-w0, 0], [-w0 * .7, -w0 * .8], [0, -w0], [w0 * .7, -w0 * .8], [w0, 0], [w1, L], [w1 * .6, L + w1 * .8], [0, L + w1], [-w1 * .6, L + w1 * .8], [-w1, L]]);
  SHAPES = {
    dWP, dWN, thigh: limb(150, 24, 18), shin: limb(144, 18, 13), upper: limb(108, 16, 13), fore: limb(92, 13, 11),
    boot: smooth([[-14, -36, 1], [14, -36, 1], [16, -8], [42, -2], [68, 4], [72, 14, 1], [22, 18], [-22, 16, 1], [-26, 0]]),
    hand: smooth([[-9, -2], [10, -2], [13, 18], [7, 32], [-4, 34], [-12, 20]]),
    coatLo: smooth([[-34, 0, 1], [30, 0, 1], [40, dWP], [50, dWP + 92, 1], [12, dWP + 104], [-30, dWP + 106], [-66, dWP + 88, 1], [-46, dWP]]),
    coatUp: smooth([[-36, 6, 1], [34, 6, 1], [40, -dWN * .5], [30, -dWN + 8], [10, -dWN - 6], [-26, -dWN - 4], [-42, -dWN * .5]]),
    face: smooth([[14, -40], [32, -18], [42, -2], [36, 7, 1], [38, 15], [33, 21], [31, 33], [12, 42], [-4, 40], [-2, 0]].map(([x, y]) => [x * 1.15, y * 1.15])),
    hair: smooth([[18, -40], [0, -54], [-30, -48], [-52, -20], [-54, 10], [-42, 34], [-22, 40], [-6, 22], [-4, -8], [6, -26]].map(([x, y]) => [x * 1.15, y * 1.15])),
    tail: smooth([[0, -10], [34, -12], [70, -2, 1], [34, 10], [0, 9]]),
  };
}
function drawAki(P, M, tq) {
  const S_ = poseAt(tq), J = solveProfile(S_), sh = SHAPES;
  const base = M.multiply(new DOMMatrix([K, 0, 0, K, -SPL.x * K, GG]));
  const at = (p, a) => base.multiply(new DOMMatrix().translate(p[0], p[1]).rotate(a * 180 / Math.PI));
  const pc = (Mx, path, col, id, o = {}) => { P.setTransform(Mx); P.piece(path, col, { id, lead: 6 / K, matW: 10, ...o }); };
  P.leadScale = 1;
  const leg = (kk, d) => { const l = J.leg[kk]; pc(at(l.hip, bone(l.hip, l.knee)), sh.thigh, d ? COL.purple2 : COL.purple, 7000 + d, { shade: [-24, 0, 24, 0, .5] }); pc(at(l.knee, bone(l.knee, l.ankle)), sh.shin, d ? COL.purple2 : COL.purple, 7002 + d); pc(at(l.ankle, l.pitch), sh.boot, COL.brown, 7004 + d, { matW: 6 }); };
  const arm = (kk, d) => { const a = J.arm[kk], h = [a.wr[0] + (a.wr[0] - a.el[0]) * .02, a.wr[1] + (a.wr[1] - a.el[1]) * .02];
    pc(at(a.sh, bone(a.sh, a.el)), sh.upper, d ? COL.ruby2 : COL.ruby, 7010 + d, { shade: [-16, 0, 16, 0, .45] }); const Mf = at(a.el, bone(a.el, a.wr)); pc(Mf, sh.fore, d ? COL.ruby2 : COL.ruby, 7012 + d);
    pc(at(h, bone(a.el, a.wr)), sh.hand, COL.flesh, 7014 + d, { matW: 5 });
    if (!d) pc(Mf, circle(12, 62, 11), COL.gold2, 7016, { mat: false }); };
  const ta = Math.sin(tq * TAU * CADENCE * .5) * .12;
  pc(at(J.headC, J.headA).multiply(new DOMMatrix().translate(-58, -10).rotate((Math.PI - .25 + ta) * 180 / Math.PI)), sh.tail, COL.brown, 7020, { matW: 5, paint: g => brush(g, [[6, -2], [36, -3], [62, -1]], 2, { color: 'rgba(30,14,6,.6)' }) });
  arm('f', 1); leg('f', 1);
  const MLo = at(J.waist, bone(J.waist, J.pelvis));
  pc(MLo, sh.coatLo, COL.ruby, 7030, { shade: [-66, 0, 50, 0, .55], paint: g => { g.strokeStyle = 'rgba(44,14,10,.6)'; g.lineWidth = 2.4; for (const x of [-30, -6, 18]) { g.beginPath(); g.moveTo(x, 10); g.quadraticCurveTo(x - 6, sh.dWP * .6, x - 12, sh.dWP + 90); g.stroke(); } } });
  leg('n', 0);
  pc(at(J.waist, boneUp(J.waist, J.neckBase)), sh.coatUp, COL.ruby, 7032, { shade: [-42, 0, 40, 0, .5], paint: g => { g.fillStyle = 'rgba(44,14,10,.7)'; for (const y of [-.3, -.55, -.8]) { g.beginPath(); g.arc(22, y * sh.dWN, 3, 0, TAU); g.fill(); } } });
  const MH = at(J.headC, J.headA);
  pc(MH, sh.face, COL.flesh, 7040, { matW: 6, paint: g => {
    brush(g, [[12, -16], [22, -19], [32, -16]], 2.6, { color: INK }); g.fillStyle = INK; g.beginPath(); g.ellipse(24, -10, 5.5, 2.6, -.1, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,240,220,.6)'; g.beginPath(); g.arc(25.5, -10.5, 1.2, 0, TAU); g.fill();
    brush(g, [[36, 18], [40, 19], [43, 17]], 2.2, { color: 'rgba(90,20,14,.8)' }); brush(g, [[40, -4], [44, 2], [40, 7]], 1.6, { color: 'rgba(44,26,12,.6)' }); } });
  pc(MH, sh.hair, COL.brown, 7042, { matW: 6, paint: g => { for (const s of [[[-6, -46], [-30, -38], [-48, -14]], [[4, -40], [-18, -40], [-40, -22], [-46, 6]], [[-12, -24], [-30, -2], [-30, 24]]]) brush(g, s, 2.4, { color: 'rgba(30,14,6,.75)' }); } });
  arm('n', 0);
  P.setTransform(base);
  return J;
}

// ───────── the stone wall and its openings (surface canvas)
function drawWall(S, M, view) {
  S.setTransform(M);
  const [vx0, vy0, vx1, vy1] = view, rnd = mulberry(4);
  S.fillStyle = '#403a33'; S.fillRect(vx0 - 20, vy0 - 20, vx1 - vx0 + 40, Math.min(FLOOR, vy1 + 20) - vy0 + 20);
  for (let row = 0; row < 40; row++) {
    const CH = 86, y0 = FLOOR - (row + 1) * CH; if (y0 + CH < vy0 - 10 || y0 > vy1 + 10) continue;
    let x = -1400 + hash(row * 7.3) * 160;
    while (x < 8200) { const w = 140 + hash(row * 13.1 + x * .01) * 130; if (x + w > vx0 - 10 && x < vx1 + 10) { const k = .78 + hash(row * 3.7 + x * .13) * .3; S.fillStyle = `rgb(${128 * k | 0},${118 * k | 0},${104 * k | 0})`; S.fillRect(x + 2, y0 + 2, w - 4, CH - 4); } x += w; }
  }
  // splays round each light, mullion shafts between them, the sill and a string course
  for (const Lt of LIGHTS) { if (Lt.cx + 400 < vx0 || Lt.cx - 400 > vx1) continue; S.fillStyle = '#857b69'; S.fill(lightPath(Lt.cx, -34)); S.fillStyle = '#a79c86'; S.fill(lightPath(Lt.cx, -16)); }
  for (let i = 0; i < NL - 1; i++) { const mx = (LXc(i) + LXc(i + 1)) / 2; if (mx < vx0 - 60 || mx > vx1 + 60) continue; S.fillStyle = '#b3a892'; S.fillRect(mx - 24, SPR - 40, 48, BOT - SPR + 40); S.fillStyle = 'rgba(40,34,28,.35)'; S.fillRect(mx + 10, SPR - 40, 14, BOT - SPR + 40); }
  S.fillStyle = '#9d927d'; S.fillRect(vx0 - 20, BOT + 14, vx1 - vx0 + 40, 36); S.fillStyle = '#6e6556'; S.fillRect(vx0 - 20, BOT + 50, vx1 - vx0 + 40, 8);
  S.fillStyle = '#8c826f'; S.beginPath(); S.arc(ROSE.x, ROSE.y, ROSE.r + 34, 0, TAU); S.fill(); S.fillStyle = '#b0a58f'; S.beginPath(); S.arc(ROSE.x, ROSE.y, ROSE.r + 16, 0, TAU); S.fill();
  const pat = stonePattern(S); pat.setTransform(new DOMMatrix().scale(.55));
  S.globalCompositeOperation = 'multiply'; S.globalAlpha = .55; S.fillStyle = pat; S.fillRect(vx0, vy0, vx1 - vx0, Math.min(FLOOR, vy1) - vy0); S.globalAlpha = 1;
  S.globalCompositeOperation = 'destination-out'; S.fillStyle = '#000';
  for (const Lt of LIGHTS) S.fill(Lt.outer);
  S.beginPath(); S.arc(ROSE.x, ROSE.y, ROSE.r, 0, TAU); S.fill();
  S.globalCompositeOperation = 'source-over';
  // iron saddle bars across the lights
  S.fillStyle = '#26282d'; for (const Lt of LIGHTS) for (const y of [SPR + 40, 60]) S.fillRect(Lt.cx - LW / 2 - 6, y - 4, LW + 12, 8);
}
// ───────── the rose = the watch
function drawRose(P, t) {
  const { x, y, r } = ROSE;
  P.piece(circle(x, y, r), COL.gold, { id: 8000, lead: 7, mat: false });
  for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; P.piece(circle(x + Math.cos(a) * (r - 14), y + Math.sin(a) * (r - 14), 7), COL.white, { id: 8001 + k, lead: 2.6, mat: false }); }
  for (let k = 0; k < 12; k++) {                               // twelve hour cells of white glass, numerals and ticks painted
    const a0 = -Math.PI / 2 + (k - .5) / 12 * TAU, a1 = -Math.PI / 2 + (k + .5) / 12 * TAU, r0 = 46, r1 = r - 30;
    const pts = [[x + Math.cos(a0) * r0, y + Math.sin(a0) * r0, 1], [x + Math.cos(a0) * r1, y + Math.sin(a0) * r1, 1], [x + Math.cos((a0 + a1) / 2) * (r1 + 4), y + Math.sin((a0 + a1) / 2) * (r1 + 4)], [x + Math.cos(a1) * r1, y + Math.sin(a1) * r1, 1], [x + Math.cos(a1) * r0, y + Math.sin(a1) * r0, 1]];
    P.piece(smooth(pts), k % 2 ? COL.white : '#d8e2cf', { id: 8100 + k, lead: 4.5, matW: 10, paint: g => {
      const am = -Math.PI / 2 + k / 12 * TAU; g.strokeStyle = INK; g.lineWidth = k % 3 ? 4 : 7; g.beginPath(); g.moveTo(x + Math.cos(am) * (r1 - 34), y + Math.sin(am) * (r1 - 34)); g.lineTo(x + Math.cos(am) * (r1 - 6), y + Math.sin(am) * (r1 - 6)); g.stroke();
      if (k % 3 === 0) { g.fillStyle = INK; g.font = '600 44px "Cormorant Garamond"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(k || 12), x + Math.cos(am) * (r1 - 70), y + Math.sin(am) * (r1 - 70)); } } });
  }
  P.piece(circle(x, y, 46), COL.ruby, { id: 8200, lead: 5, matW: 8 });
  const hand = (a, len, w, col, id) => P.piece(smooth([[x - Math.cos(a) * 30 - Math.sin(a) * w, y - Math.sin(a) * 30 + Math.cos(a) * w, 1], [x + Math.cos(a) * len * .7 - Math.sin(a) * w * 1.3, y + Math.sin(a) * len * .7 + Math.cos(a) * w * 1.3], [x + Math.cos(a) * len, y + Math.sin(a) * len, 1], [x + Math.cos(a) * len * .7 + Math.sin(a) * w * 1.3, y + Math.sin(a) * len * .7 - Math.cos(a) * w * 1.3], [x - Math.cos(a) * 30 + Math.sin(a) * w, y - Math.sin(a) * 30 - Math.cos(a) * w, 1]]), col, { id, lead: 4, mat: false, erase: true });
  hand(AH, 120, 12, COL.purple2, 8210); hand(AM, 186, 9, COL.purple2, 8211);
  const ts = step8(t), s = ts < 8.4 ? 47 : ts < 9.4 ? 48 : 49;
  hand(-Math.PI / 2 + s / 60 * TAU, 200, 3.5, COL.ruby2, 8212);
  P.solder(x, y, 9);
}

// ───────── one frame
const PMW = 1024, PMH = 768;
const camMatrix = cam => new DOMMatrix().translate(960, 540).scale(cam[2]).translate(-cam[0], -cam[1]);
function camAt(t) {
  if (t < 2.5) return [40 + 6 * t, 250, 2.3];
  const tr = t => [Xw(t) + 90, 96, 1.3];
  if (t < 7.5) return tr(t);
  if (t < 9.375) { const u = eo(seg(t, 7.5, 7.92)), a = tr(7.5); return [lerp(a[0], ROSE.x, u), lerp(a[1], ROSE.y + 40, u) + 6 * Math.sin(TAU * CADENCE * (t - 7.5)) * u, Math.exp(lerp(Math.log(1.3), Math.log(1.6), u))]; }
  const u = eo(seg(t, 9.375, 9.85)); return [lerp(ROSE.x, LXc(9) + 200, u), lerp(ROSE.y + 40, 120, u), Math.exp(lerp(Math.log(1.6), Math.log(.46), u))];
}
const sunU = t => t < 7.5 ? Xw(Math.max(t, 0)) + 40 : Xw(7.5) + 40;
const CH = t => t < EV.chime ? 0 : (t - EV.chime < .25 ? lerp(0, 1, eo((t - EV.chime) / .25)) + .6 * Math.sin((t - EV.chime) / .25 * Math.PI) : 1);
function render(t) {
  const { G, S, R, O, P: PM } = Lc;
  for (const c of [G, S, R, O]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 1920, 1080); }
  const cam = camAt(t), M = camMatrix(cam), hw = 960 / cam[2], hh = 540 / cam[2], view = [cam[0] - hw, cam[1] - hh, cam[0] + hw, cam[1] + hh];
  const tq = step8(t);
  drawWall(S, M, view);
  const P = new Pass(G, S);
  const ax = Xw(tq);
  const drawLight = (Pz, Lt, proj = false) => {
    Pz.setTransform(M0(Pz)); border(Pz, Lt);
    Pz.save(); Pz.g.clip(Lt.inner); if (Pz.s !== Pz.g) Pz.s.clip(Lt.inner);
    for (const c of Lt.cells) Pz.piece(c.path, c.col, { id: c.id, lead: 4.2, mat: false, edge: 6, paint: g => vineCurl(g, c.c, 60, c.curl) });
    if (Lt.i === STATION) station(Pz, Lt.cx); else shopfront(Pz, Lt);
    ground(Pz, Lt);
    if (Lt.i === 1) { puddle(Pz, t); splash(Pz, t); }
    if (Math.abs(ax - Lt.cx) < LW && t < 7.6) drawAki(Pz, M0(Pz), tq);
    Pz.restore(); Pz.setTransform(M0(Pz)); Pz.lead(Lt.inner, 6);
    for (const [x, y] of Lt.pearls) Pz.piece(circle(x, y, 6), COL.gold, { id: 700 + x * 3 + y, lead: 3, mat: false });
  };
  let M0 = () => M;
  for (const Lt of LIGHTS) { if (Lt.cx + LW / 2 + 60 < view[0] || Lt.cx - LW / 2 - 60 > view[2]) continue; drawLight(P, Lt); }
  if (view[1] < ROSE.y + ROSE.r) { P.setTransform(M); drawRose(P, t); }
  // floor patch map (the pull-back): the lit lights projected by the lamplight onto the flagstones
  let pmRect = null; const floorMode = t >= 9.4 ? 1 : 0, sx = .25, sz = .55;
  if (floorMode) {
    const rx = LXc(7), rz = 0, rw = 4200, rh = 3000; pmRect = [rx, rz, rw, rh];
    PM.setTransform(1, 0, 0, 1, 0, 0); PM.fillStyle = '#000'; PM.fillRect(0, 0, PMW, PMH);
    const kx = PMW / rw, ky = PMH / rh, PMx = new DOMMatrix([kx, 0, -sx * kx, -sz * ky, (FLOOR * sx - rx) * kx, (FLOOR * sz - rz) * ky]);
    const Pp = new Pass(PM, PM, 'proj'); M0 = () => PMx;
    for (const Lt of [LIGHTS[RLIGHT], LIGHTS[STATION]]) { PM.save(); PM.globalAlpha = Lt.i === STATION ? Math.min(1, CH(t)) : .8; drawLight(Pp, Lt, true); PM.restore(); }
    PM.setTransform(1, 0, 0, 1, 0, 0); PM.filter = 'blur(3px)'; PM.globalCompositeOperation = 'copy'; PM.drawImage(L.P, 0, 0); PM.filter = 'none'; PM.globalCompositeOperation = 'source-over';
  }
  const lit = i => Math.max(0, 1 - Math.abs(LXc(i) - sunU(t)) / (LW * .9));
  const lancets = [Math.max(0, RLIGHT - 1), RLIGHT, STATION].map(i => ({ rect: [LXc(i) - LW / 2, SPR - 190, LXc(i) + LW / 2, BOT], I: i === STATION ? CH(t) * 1.4 : lit(i) * 2.2 }));
  lancets.push({ rect: [LXc(1) - LW / 2, SPR - 190, LXc(1) + LW / 2, BOT], I: .6 });
  lancets.push({ rect: [ROSE.x - ROSE.r, ROSE.y - ROSE.r, ROSE.x + ROSE.r, ROSE.y + ROSE.r], I: 0 });
  const roseI = t < 7.45 ? 0 : (t - 7.45 < .2 ? lerp(0, 2.6, eo((t - 7.45) / .2)) : 2.0);
  const pts = [[30, GG - 60, 420, 1.3, [1, .72, .4]]];                          // the café's lamp behind the puddle light
  if (CH(t) > 0) pts.push([LXc(STATION), 70, 380, 1.6 * CH(t), [1, .96, .86]]);  // the station clock, lit on the chime
  comp.render(L, {
    cam, sunU: sunU(t), bandW: LW * .95, bandSoft: 90, skew: .06, sunI: t < 7.5 ? 2.1 : lerp(2.1, .7, ss((t - 7.5) / .6)), sunCol: [1, .78, .48],
    skyI: .12, skyCol: [.42, .52, .95], roseI, roseCol: [1, .92, .74], roseC: [ROSE.x, ROSE.y], roseR: ROSE.r,
    amb: .14, ambCol: [.72, .74, .9], haze: .5, lancets, pts, floorMode, floorY: FLOOR, camD: 2600, eyeH: 300, patchK: 2.4, pmRect: pmRect || [0, 0, 1, 1],
    expo: 1.05, bloom: .55, thr: .5, vign: .45, sat: 1.12, contrast: .12, time: t,
  });
}

buildShapes();
window.render = render;
window.DUR = DUR;
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(step8(t))); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
render(0);
window.READY = true;
