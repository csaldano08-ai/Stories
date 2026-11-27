// 069 · CRT ASCII Terminal — the first 10 s of "Last Train Home" on one amber monochrome terminal (lemo-opuscar styles/ascii-crt).
// Every image is real glyphs on a character grid, chosen by ink density from a grayscale "negative" painted exactly on the grid;
// the only camera is the grid scale. AKI is painted from the shared rig (bright dense coat, dimmer limbs, a dark sparse ponytail,
// a thin bright rim between planes); rain falls cell by cell; the splash at 0.94 s throws glyph drops that jump from cell to cell;
// the shop names are typed into their signs as text. At 6.05 s her watch is one bold 'o' at her wrist; the grid pushes in until that
// one character fills the screen, and inside its counter the dial is drawn in smaller text, the seconds rolling 47 → 48 at 8.4 s.
// A clear screen redraws the station clock tower, pulled out cell by cell; at the chime (9.58 s) its face takes the film's one soft
// second colour, an ice blue-white, and keeps it. A LOG strip types the system's record of the run. Engine: engine/term.js and
// engine/crt.js copied unchanged. Page contract: window.render(t), DUR, READY, RIGQA.
import { initTerm, ATLAS, glyph, text, inverse, cursor, makeRamp, pick, cellsFromImage } from './engine/term.js';
import { makeCRT } from './engine/crt.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, mulberry, hash } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080, TAU = Math.PI * 2;
const sceneCv = document.getElementById('scene'), sg = sceneCv.getContext('2d');
await initTerm();
const CRT = makeCRT(document.getElementById('c'));
const RAMP = makeRamp(" .`',:;-~=+*ox%#&@");

// ═════════ the run (shared by every style)
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
const SIM = (() => {
  const dt = 1 / 240, n = Math.ceil(11 / dt), tail = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  const th = [-.2, -.1, 0], vt = [0, 0, 0], py = t => RUN.pelvisAt(t)[1], ay = t => (py(t + dt) - 2 * py(t) + py(t - dt)) / (dt * dt);
  for (let i = 0; i < n; i++) { const t = -.5 + i * dt, A = ay(t);
    for (let k = 0; k < 3; k++) { const par = k ? th[k - 1] : -.1, rest = .16 + .05 * k; vt[k] += (-60 * (th[k] - (par + rest)) - 6 * vt[k] + .014 * A * (k + 1) * .6) * dt; th[k] += vt[k] * dt; tail[k][i] = th[k]; } }
  return { tail: t => tail.map(a => a[clamp(Math.round((t + .5) / dt), 0, n - 1)]) };
})();

// ═════════ the picture grid: the screen above the LOG strip; a camera = world point at the screen centre + px per world unit
const LOGH = 150, PH = H - LOGH, SX = 4, SY = 8;
const NEG = document.createElement('canvas'), ng = NEG.getContext('2d', { willReadFrequently: true });
// world: rig units, x along the street, y down, ground at y = 0. Shop signs carry real text, placed on the grid as characters
const SHOPS = (() => { const n = ['BAR', 'BOOKS', '24H', 'PHARMACY', 'NOODLES', 'CAFE', 'LAUNDRY', 'RECORDS', 'HOTEL', 'FLOWERS', 'BAKERY', 'TAILOR'], o = []; let x = SPL.x - 2600; n.forEach((nm, i) => { const w = 1500 + (i % 3) * 300; o.push({ x, w, nm }); x += w; }); return o; })();
function paintStreet(c, t, M, k, o = {}) {
  // far rooftops (dim), shopfronts (dim) with lit windows, signs (bright frames; their names are typed separately)
  c.fillStyle = 'rgb(0,0,0)'; c.fillRect(0, 0, NEG.width, NEG.height);
  const R = (x0, y0, x1, y1, v, g = 0) => { const a = M([x0, y0]), b = M([x1, y1]); c.fillStyle = `rgb(${Math.round(v * 255)},${Math.round(g * 255)},0)`; c.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); };
  for (const s of SHOPS) {
    R(s.x, -1500, s.x + s.w - 30, -1050, .1);
    R(s.x + 40, -1010, s.x + s.w - 70, -850, .12); R(s.x + 70, -985, s.x + s.w - 100, -875, .02);
    R(s.x + 60, -800, s.x + s.w - 520, -260, .2); R(s.x + 140, -720, s.x + s.w - 600, -340, .07);
    R(s.x + s.w - 440, -760, s.x + s.w - 180, 0, .14);
    for (let k2 = 0; k2 < 3; k2++) R(s.x + 120 + k2 * (s.w - 300) / 3, -1420, s.x + 220 + k2 * (s.w - 300) / 3, -1280, hash(k2 + s.x) > .4 ? .55 : .1);
  }
  R(SPL.x - 9000, 0, SPL.x + 40000, 6, .7); R(SPL.x - 9000, 6, SPL.x + 40000, 400, .07);
  // the puddle: a pale lens, with rings after the splash
  const pc = M([SPL.x + 44, 4]); c.fillStyle = 'rgb(110,0,0)'; c.beginPath(); c.ellipse(pc[0], pc[1], 250 * k, 26 * k, 0, 0, TAU); c.fill();
  const a = t - EV.splash;
  if (a > 0 && a < 1.5) { c.strokeStyle = 'rgb(230,0,0)'; c.lineWidth = Math.max(1, 8 * k); for (let j = 0; j < 3; j++) { const u = a - j * .14; if (u <= 0 || u > 1.2) continue; c.beginPath(); c.ellipse(pc[0], pc[1], (40 + 300 * Math.pow(u / 1.2, .6)) * k, (6 + 30 * Math.pow(u / 1.2, .6)) * k, 0, 0, TAU); c.stroke(); } }
  // AKI
  akiNeg(c, t, M, k);
}
function akiNeg(c, t, M, k) {
  const J = solveProfile(poseAt(t)), line = (pts, w, v) => { c.strokeStyle = `rgb(${Math.round(v * 255)},0,0)`; c.lineWidth = w * k; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach((p, i) => { const q = M(p); i ? c.lineTo(...q) : c.moveTo(...q); }); c.stroke(); };
  const fig = (rim) => { const add = rim ? 22 : 0, v = s => rim ? 1 : s;
    for (const kk of ['f', 'n']) { const a = J.arm[kk], l = J.leg[kk], cc = Math.cos(l.pitch), sn = Math.sin(l.pitch);
      if (kk === 'n' && !rim) { const TT = (b, u, f) => [b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]; const coat = [TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)]; c.fillStyle = 'rgb(245,0,0)'; c.beginPath(); coat.forEach((p, i) => i ? c.lineTo(...M(p)) : c.moveTo(...M(p))); c.closePath(); c.fill(); }
      line([l.hip, l.knee, l.ankle], 40 + add, v(kk === 'n' ? .62 : .42)); line([l.ankle, [l.ankle[0] + 60 * cc, l.ankle[1] + 60 * sn]], 30 + add, v(.75));
      line([a.sh, a.el, a.wr], 28 + add, v(kk === 'n' ? .88 : .55)); }
    line([J.neckBase, J.neckTop], 22 + add, v(.8)); const hc = M(J.headC); c.fillStyle = rim ? 'rgb(255,0,0)' : 'rgb(215,0,0)'; c.beginPath(); c.arc(hc[0], hc[1], (52 + add / 2) * k, 0, TAU); c.fill();
    if (!rim) { c.fillStyle = 'rgb(70,0,0)'; c.beginPath(); c.arc(hc[0], hc[1], 54 * k, Math.PI * .6 + J.headA, Math.PI * 1.9 + J.headA); c.fill();
      const ta = SIM.tail(t); let an = Math.PI - .25 + ta[0] + J.headA, p = [J.headC[0] - Math.cos(J.headA) * 50, J.headC[1] - Math.sin(J.headA) * 50 - 10]; const tail = [p];
      for (let i = 0; i < 3; i++) { const Lk = [46, 42, 36][i]; p = [p[0] + Math.cos(an) * Lk, p[1] + Math.sin(an) * Lk]; tail.push(p); an += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
      line(tail, 26, .3); } };
  // a thin bright rim behind the figure separates it from the street, then the figure's own values
  c.globalAlpha = .9; fig(true); c.globalAlpha = 1; fig(false);
  return J;
}
// turn the negative into glyph cells and stamp them; o.skip(i, j) leaves a cell for text written over it
function stampCells(view, cols, rows, o = {}) {
  NEG.width = cols * SX; NEG.height = rows * SY;
  o.paint(ng);
  const d = ng.getImageData(0, 0, NEG.width, NEG.height).data, C = cellsFromImage(d, NEG.width, cols, rows, SX, SY);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    if (o.skip && o.skip(i, j)) continue;
    const L = Math.pow(C.A[j * cols + i], 1.25), Gc = C.E[j * cols + i];
    if (Gc > .08) { const lv = pick(RAMP, Math.min(1, Gc * 1.1), i, j); glyph(sg, lv.ch, view.ox + i * view.cw, view.oy + j * view.cw * 2, view.cw, lv.a * 1.3, 1); continue; }
    if (L < .05) continue;
    const lv = pick(RAMP, L, i, j); glyph(sg, lv.ch, view.ox + i * view.cw, view.oy + j * view.cw * 2, view.cw, lv.a * (o.dim ?? 1));
  }
}
// a picture shot: the camera (centre in world units, px per unit) becomes a grid of whole cells
function pictureShot(t, cam, cw, extra) {
  const cols = Math.ceil(W / cw) + 1, rows = Math.ceil(PH / (2 * cw)) + 1;
  const ox = W / 2 - (Math.floor(cols / 2) + .5) * cw + ((cam.x * cam.k) % cw + cw) % cw * 0, oy = 0, view = { ox, oy, cw };
  const M = p => [((p[0] - cam.x) * cam.k + W / 2 - ox) * SX / cw, ((p[1] - cam.y) * cam.k + PH / 2 - oy) * SX / cw];
  const toCell = p => [Math.floor(((p[0] - cam.x) * cam.k + W / 2 - ox) / cw), Math.floor(((p[1] - cam.y) * cam.k + PH / 2 - oy) / (2 * cw))];
  const texts = [];   // [col, row, string, brightness, chan]
  extra?.(texts, toCell);
  const taken = new Set(); for (const [c0, r0, s] of texts) for (let q = 0; q < s.length; q++) taken.add((c0 + q) + ',' + r0);
  stampCells(view, cols, rows, { paint: c => paintStreet(c, t, M, cam.k * SX / cw), skip: (i, j) => taken.has(i + ',' + j) });
  for (const [c0, r0, s, a, ch] of texts) text(sg, s, c0, r0, view, a, ch || 0);
  // rain: characters that fall cell by cell
  for (let i = 0; i < cols; i += 3) { const ph = hash(i * 1.7), sp = 14 + hash(i) * 10, r = Math.floor((ph * rows + t * sp) % rows); if (hash(i + Math.floor(t * sp / rows)) < .45) glyph(sg, hash(i * 3) > .5 ? "'" : '|', ox + i * cw, oy + r * 2 * cw, cw, .3); }
  return { view, toCell, cols, rows };
}
// shop names on their signs, the splash drops, the watch glyph
function streetTexts(t, k) {
  return (texts, toCell) => {
    for (const s of SHOPS) { const a = toCell([s.x + 80, -905]), b = toCell([s.x + s.w - 110, -905]); const n = s.nm, free = b[0] - a[0]; if (free >= n.length) texts.push([a[0] + Math.floor((free - n.length) / 2), a[1], n, 1.25]); }
    const a = t - EV.splash;
    if (a > 0 && a < 1) { const r = mulberry(69); for (let i = 0; i < 16; i++) { const an = (200 + r() * 140) * Math.PI / 180, v = 900 + r() * 1300, x = SPL.x + 44 + Math.cos(an) * v * a, y = Math.sin(an) * v * a + 2600 * a * a; if (y > 0) continue; const c = toCell([x, y]); texts.push([c[0], c[1], i % 3 ? 'o' : '*', 1.4]); } }
  };
}

// ═════════ S3: inside the 'o' — the dial drawn in smaller text in the glyph's counter
let O_BOX = null;
function oBox() { if (O_BOX) return O_BOX; const b = ATLAS.thin['o'], GW = ATLAS.GW, GH = ATLAS.GH; let x0 = GW, x1 = 0, y0 = GH, y1 = 0;
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) if (b[j * GW + i] > 128) { x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
  // the counter: scan the middle row for the inner gap
  const my = Math.round((y0 + y1) / 2); let ix0 = x0, ix1 = x1; while (ix0 < x1 && b[my * GW + ix0] > 128) ix0++; while (ix1 > x0 && b[my * GW + ix1] > 128) ix1--;
  let iy0 = y0, iy1 = y1; const mx = Math.round((x0 + x1) / 2); while (iy0 < y1 && b[iy0 * GW + mx] > 128) iy0++; while (iy1 > y0 && b[iy1 * GW + mx] > 128) iy1--;
  return (O_BOX = { cx: (x0 + x1) / 2 / GW, cy: (y0 + y1) / 2 / GH * 2, hx: (ix1 - ix0) / 2 / GW, hy: (iy1 - iy0) / 2 / GH * 2 }); }   // in cell units (x: cw, y: cw)
function dialInside(t, cx, cy, rx, ry, a) {
  // a sub-grid of small cells: indices, the three hands as lines of characters, the readout typed under the centre
  const cw = Math.max(10, Math.round(Math.min(rx, ry) / 14)), view = { ox: Math.round(cx / cw) * cw - Math.round(cx / cw) * cw, oy: 0, cw };
  const cell = (x, y) => [Math.round(x / cw), Math.round(y / (2 * cw))];
  const put = (x, y, s, b = 1) => { const c = cell(x, y); text(sg, s, c[0] - Math.floor(s.length / 2), c[1], view, b * a); };
  const R = Math.min(rx, ry * 1.0) * .86;
  for (let m = 0; m < 60; m++) { const an = m / 60 * TAU; put(cx + Math.sin(an) * R, cy - Math.cos(an) * R * .92, m % 5 ? '.' : ':', m % 5 ? .55 : .9); }
  for (const [n, an] of [['12', 0], ['3', .25], ['6', .5], ['9', .75]]) put(cx + Math.sin(an * TAU) * R * .78, cy - Math.cos(an * TAU) * R * .72, n, 1.3);
  const s = 47 + (t >= 8.4 ? 1 : 0), hand = (fr, L, ch, b) => { const an = fr * TAU, n = Math.round(L * R / cw); for (let q = 1; q <= n; q++) put(cx + Math.sin(an) * q * cw, cy - Math.cos(an) * q * cw * .92, ch, b); };
  hand((11 + 58 / 60) / 12, .45, '#', 1.2); hand(58 / 60, .7, '=', 1); hand(s / 60, .8, '.', 1.3); put(cx, cy, '@', 1.5);
  const rd = `11:58:${s}`, c0 = cell(cx, cy + R * .45); text(sg, rd.slice(0, 6), c0[0] - 4, c0[1], view, 1.2 * a);
  const flash = s === 48 && t < 8.55; if (flash) inverse(sg, String(s), c0[0] + 2, c0[1], view, a); else text(sg, String(s), c0[0] + 2, c0[1], view, 1.4 * a);
}
// ═════════ S4: the station clock tower, pulled out cell by cell; its face takes the second colour on the chime
function paintTower(c, t, M, k) {
  c.fillStyle = 'rgb(0,0,0)'; c.fillRect(0, 0, NEG.width, NEG.height);
  const R = (x0, y0, x1, y1, v) => { const a = M([x0, y0]), b = M([x1, y1]); c.fillStyle = `rgb(${Math.round(v * 255)},0,0)`; c.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); };
  R(-4000, 0, 4000, 300, .08); R(-900, -9000, 900, 0, .3); R(-1000, -9150, 1000, -9000, .55); R(-760, -8700, 760, -7300, .05);
  const tip = M([0, -10600]), l = M([-1000, -9150]), r = M([1000, -9150]); c.fillStyle = 'rgb(110,0,0)'; c.beginPath(); c.moveTo(...l); c.lineTo(...tip); c.lineTo(...r); c.fill();
  for (let y = -6000; y < -200; y += 1400) R(-650, y, 650, y + 700, .12);
  const on = t >= EV.chime, cc = M([0, -5600]); c.fillStyle = on ? 'rgb(30,255,0)' : 'rgb(235,0,0)'; c.beginPath(); c.arc(cc[0], cc[1], 720 * k, 0, TAU); c.fill();
  c.fillStyle = 'rgb(0,0,0)'; c.beginPath(); c.arc(cc[0], cc[1], 600 * k, 0, TAU); c.fill();
  c.fillStyle = on ? 'rgb(20,170,0)' : 'rgb(120,0,0)'; c.beginPath(); c.arc(cc[0], cc[1], 560 * k, 0, TAU); c.fill();
  c.strokeStyle = 'rgb(255,0,0)'; c.lineCap = 'round'; for (const [fr, L, w] of [[(11 + 58 / 60) / 12, 300, 60], [58 / 60, 470, 40]]) { c.lineWidth = w * k; c.beginPath(); c.moveTo(...cc); c.lineTo(cc[0] + Math.sin(fr * TAU) * L * k, cc[1] - Math.cos(fr * TAU) * L * k); c.stroke(); }
  // the bell lines on the chime
  if (on) { const u = seg(t, EV.chime, EV.chime + .4); c.strokeStyle = `rgb(${Math.round(255 * (1 - u * .6))},0,0)`; c.lineWidth = 50 * k; for (const sgn of [-1, 1]) for (let i = 0; i < 3; i++) { const a0 = M([sgn * (1200 + i * 450 + u * 600), -8100 - i * 200]), a1 = M([sgn * (1500 + i * 450 + u * 600), -8500 - i * 200]); c.beginPath(); c.moveTo(...a0); c.lineTo(...a1); c.stroke(); } }
}

// ═════════ the LOG strip: the system's record of the run, typed at machine speed (outside the zooming grid)
const LOG = [[0, '> TRACK AKI  4.06 M/S  2.9 STEPS/S'], [EV.splash, '> 00:00.94  CONTACT: PUDDLE'], [2.5, '> STREET SCAN  160 COLS'], [EV.watchUp, '> 00:06.05  ARM RAISED: WATCH'], [7.5, '> READ WATCH'], [8.4, '> 11:58:48'], [EV.chime, '> 00:09.58  STATION CHIME']];
function logStrip(t) {
  const cw = 22.5, view = { ox: 60, oy: PH + 18, cw };
  for (let i = 0; i < 76; i++) glyph(sg, '-', 60 + i * cw, PH - 6, cw, .25);
  inverse(sg, ' LOG ', 0, 1, view, .9);
  const cur = LOG.filter(l => l[0] <= t).pop(); if (!cur) return;
  const n = Math.min(cur[1].length, Math.floor((t - cur[0]) / .022)); text(sg, cur[1].slice(0, n), 6, 1, view, 1);
  if (n >= cur[1].length && Math.floor(t * 2.4) % 2 === 0) cursor(sg, 6 + n + 1, 1, view, .9);
}

// ═════════ frame
function frame(t) {
  sg.globalCompositeOperation = 'source-over'; sg.globalAlpha = 1; sg.fillStyle = '#000'; sg.fillRect(0, 0, W, H); sg.globalCompositeOperation = 'lighter';
  sg.save(); sg.beginPath(); sg.rect(0, 0, W, PH - 14); sg.clip();
  if (t < 7.5) {
    // S1 (200 cols, low on the puddle and her legs) → S2 (160 cols, tracking her); at the watch raise the grid pushes in to her
    // wrist, and from 7.15 s it pushes into the one 'o' that is her watch
    const xh = X(t), J = solveProfile(poseAt(t)), a = J.arm.n, wr = [a.el[0] + (a.wr[0] - a.el[0]) * .84, a.el[1] + (a.wr[1] - a.el[1]) * .84];
    let cw, cam;
    if (t < 2.5) { cw = 9.6; cam = { x: lerp(SPL.x - 150, xh, .25), y: -330, k: .9 }; }
    else { const pu = ss(seg(t, 6.05, 6.9)), push = ei(seg(t, 7.15, 7.5));
      cw = lerp(12, 24, pu); cam = { x: lerp(xh + 120, wr[0], pu), y: lerp(-620, wr[1], pu), k: lerp(.6, 1.2, pu) };
      if (push > 0) { cw = cw * Math.pow(1800 / cw, push); cam.k = cam.k * cw / lerp(12, 24, pu); } }
    const shot = pictureShot(t, cam, cw, (texts, toCell) => {
      streetTexts(t, cam.k)(texts, toCell);
      if (J.S.watch > .3 || t > 7.0) { const c = toCell(wr); texts.push([c[0], c[1], 'o', 1.6]); }
    });
    // inside the growing 'o': the dial appears once its counter is large enough to read
    if (t > 7.3) { const c = shot.toCell(wr), b = oBox(), x = shot.view.ox + (c[0] + b.cx) * cw, y = shot.view.oy + (c[1] * 2 + b.cy) * cw; const vis = seg(cw, 500, 1500); if (vis > 0) dialInside(t, x, y, b.hx * cw * .92, b.hy * cw * .92, vis); }
  } else if (t < 9.375) {
    // S3: held inside the 'o': the ring of the glyph is the case, the dial inside it in smaller text
    const cw = 1800, b = oBox(), x = W / 2, y = PH / 2, gx = x - b.cx * cw, gy = y - b.cy * cw;
    glyph(sg, 'o', gx, gy, cw, .62);
    dialInside(t, x, y, b.hx * cw * .92, b.hy * cw * .92, 1);
  } else {
    // S4: a clear screen and a redraw: the station clock fills the frame, then the grid pulls out to the tower
    const u = eo(seg(t, 9.375, 10)), cw = lerp(26, 9, u), k = lerp(.62, .085, u), cam = { x: 0, y: lerp(-5600, -5000, u), k };
    const cols = Math.ceil(W / cw) + 1, rows = Math.ceil(PH / (2 * cw)) + 1, view = { ox: 0, oy: 0, cw };
    const M = p => [((p[0] - cam.x) * k + W / 2) * SX / cw, ((p[1] - cam.y) * k + PH / 2) * SX / cw];
    stampCells(view, cols, rows, { paint: c => paintTower(c, t, M, k * SX / cw) });
    if (t - 9.375 < .05) { sg.globalCompositeOperation = 'source-over'; sg.fillStyle = `rgba(0,0,0,${1 - (t - 9.375) / .05})`; sg.fillRect(0, 0, W, PH); sg.globalCompositeOperation = 'lighter'; }
  }
  sg.restore(); sg.globalCompositeOperation = 'lighter';
  logStrip(t);
  sg.globalAlpha = 1; sg.globalCompositeOperation = 'source-over';
  CRT.render(sceneCv, Math.round(t * 30));
}
window.render = t => frame(t);
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
