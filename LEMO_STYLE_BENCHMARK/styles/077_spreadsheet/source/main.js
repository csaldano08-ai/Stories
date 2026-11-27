// 077 · Spreadsheet Film — the first 10 s of "Last Train Home" inside one spreadsheet window (lemo-opuscar styles/spreadsheet).
// A narrative adaptation: the picture is computed. AKI is a block of wide cells (2.9 : 1) whose code letters (C coat, H hair, S skin, L leg,
// B shoe…) are sampled every frame from the shared rig in rig space (constant bone lengths, joint limits); conditional formats paint them.
// The grid never moves: she runs in place on a fixed column while the lane's data hops left cell by cell under her at her real speed,
// so a planted foot stays on its cell. The shell is generic and hand-drawn (no product, name or brand). Three formulas carry the film:
//   S1  =IF(foot="W","SPLASH","dry") typed into B30; Enter on the splash (0.94 s): the wet cells flash, droplet cells hop, B30 = SPLASH
//   S2  pull out to the whole sheet; =COUNT(steps) counts the footfall cells (each contact writes its time in the steps row, in lime);
//       =NOW() entered as she raises her wrist (6.05 s)
//   S3  push into the NOW cell: 11:58:47 → 48 at 8.4 s (the cell flashes when it recalculates)
//   S4  the selection jumps to the station tower drawn in cells; pull out; on the chime (9.58 s) a banded colour scale floods from its clock
// Page contract: window.render(t), DUR, READY, RIGQA.
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080, g = document.getElementById('c').getContext('2d'), UI = 'Inter';
await Promise.all(['400 13px Inter', '500 13px Inter', '600 13px Inter', '700 26px Inter'].map(f => document.fonts.load(f, 'AB09')));
const INK = '#17120a', LIME = '#b8f25a', RED = '#e8382d', INDIGO = '#2a2f6c', AMBER = '#ffb21f', SKY = '#5ab4f0';
const FILL = { C: RED, H: INDIGO, L: INDIGO, l: '#6a6fb0', S: AMBER, B: INK, E: INK, w: LIME, G: '#c9cbe6', W: SKY, D: SKY, n: LIME, P: INDIGO, T: '#c9cbe6', y: AMBER, F: '#ffffff', h: INK };

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
const W_T = t => 11 * 3600 + 58 * 60 + 48 + (t - 8.4);
const hms = s => { s = Math.floor(s + 1e-6); return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

// ═════════ the sheet: column widths (A labels, B values, C spacer, then 64 px), rows 22 px; world px at 100 %
const NC = 60, NR = 110, CW = i => i === 0 ? 96 : i === 1 ? 150 : i === 2 ? 20 : 64, RH = 22;
const CX_ = [0]; for (let i = 0; i < NC; i++) CX_.push(CX_[i] + CW(i));
const colX = i => CX_[i], rowY = j => j * RH;
const colName = i => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
// the lane: she stands on the top edge of row 38 (index 37), pelvis on column M (index 12); 56 rig units per column, 19.3 per row (2.9 : 1)
const PC = 12, PCc = PC + .5, GRD = 37, STEPROW = 38, UC = 56, UR = 19.3, LANE0 = 3, LANE1 = 44;
const TOW = 46;                                  // the tower: columns AU…BA (46…52)
const TOWER = ['...P...', '...P...', '..PPP..', '.PPPPP.', 'PPPPPPP', 'TTTTTTT', 'T.T.T.T', 'T.T.T.T', 'TTTTTTT', 'TFFFFFT', 'TFFhFFT', 'TFFhFFT', 'TFhhFFT', 'TFFFFFT', 'TFFFFFT', 'TTTTTTT',
  'TyTyTyT', 'TTTTTTT', 'TyTyTyT', 'TTTTTTT', 'TyTyTyT', 'TTTTTTT', 'TyTyTyT', 'TTTTTTT', 'TyTyTyT', 'TTTTTTT', 'TyTyTyT', 'TTTTTTT', 'TTyyyTT', 'TTyyyTT', 'TTyyyTT', 'TTTTTTT'];
const TOW_R0 = GRD - TOWER.length, CLOCK = [TOW + 3, TOW_R0 + 11];

// ═════════ rig → cell codes, sampled in rig space (isotropic shapes on an anisotropic grid)
function segD(px, py, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1, u = clamp(((px - a[0]) * dx + (py - a[1]) * dy) / L2), qx = a[0] + dx * u - px, qy = a[1] + dy * u - py; return Math.sqrt(qx * qx + qy * qy); }
function inPoly(px, py, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > py) !== (b[1] > py) && px < (b[0] - a[0]) * (py - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function figureShapes(t) {
  const J = solveProfile(poseAt(t)), S = [];
  const chain = (pts, r, code) => { for (let i = 1; i < pts.length; i++) S.push({ k: 'cap', a: pts[i - 1], b: pts[i], r, code }); };
  const legPts = l => { const c = Math.cos(l.pitch), s = Math.sin(l.pitch); return [l.hip, l.knee, l.ankle, [l.ankle[0] + 66 * c, l.ankle[1] + 66 * s]]; };
  const a = J.arm.n, hand = [a.wr[0] + (a.wr[0] - a.el[0]) * .25, a.wr[1] + (a.wr[1] - a.el[1]) * .25], watch = [a.el[0] + (a.wr[0] - a.el[0]) * .84, a.el[1] + (a.wr[1] - a.el[1]) * .84];
  const ca = Math.cos(J.headA), sa = Math.sin(J.headA), hc = J.headC;
  S.push({ k: 'cap', a: [hc[0] + ca * 30, hc[1] + sa * 30 - 6], b: [hc[0] + ca * 30, hc[1] + sa * 30 - 6], r: 9, code: 'E' });     // the eye
  if (J.S.watch > .3) S.push({ k: 'cap', a: watch, b: watch, r: 22, code: 'w' });
  chain([a.sh, a.el, a.wr], 25, 'C'); S.push({ k: 'cap', a: a.wr, b: hand, r: 18, code: 'S' });
  S.push({ k: 'cap', a: [hc[0] - ca * 12, hc[1] - sa * 12 - 14], b: [hc[0] - ca * 18, hc[1] - sa * 18 - 18], r: 44, code: 'H' });
  S.push({ k: 'cap', a: hc, b: hc, r: 52, code: 'S' });
  const ta = SIM.tail(t); let an = Math.PI - .25 + ta[0] + J.headA, p = [hc[0] - ca * 50, hc[1] - sa * 50 - 10]; const tail = [p];
  for (let i = 0; i < 3; i++) { const Lk = [46, 42, 36][i]; p = [p[0] + Math.cos(an) * Lk, p[1] + Math.sin(an) * Lk]; tail.push(p); an += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
  chain(tail, 20, 'H');
  S.push({ k: 'cap', a: J.neckBase, b: J.neckTop, r: 20, code: 'S' });
  const ln = legPts(J.leg.n); chain(ln.slice(0, 3), 32, 'L'); S.push({ k: 'cap', a: ln[2], b: ln[3], r: 20, code: 'B' });
  const TT = (b, u, f) => [b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f];
  S.push({ k: 'poly', P: [TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)], code: 'C' });
  const lf = legPts(J.leg.f); chain(lf.slice(0, 3), 30, 'l'); S.push({ k: 'cap', a: lf[2], b: lf[3], r: 19, code: 'B' });
  const af = J.arm.f; chain([af.sh, af.el, af.wr], 23, 'C');
  return { J, S };
}
const codeAt = (S, x, y) => { for (const s of S) { if (s.k === 'cap' ? segD(x, y, s.a, s.b) <= s.r : inPoly(x, y, s.P)) return s.code; } return null; };
const STEPS = RUN.contacts.filter(c => c.t0 >= 0);
function laneCells(t) {   // Map 'i,j' → {code, v, flash}
  const M = new Map(), Xp = X(t), rx = i => Xp + (i + .5 - PCc) * UC, { S } = figureShapes(t);
  for (let i = PC - 9; i <= PC + 9; i++) for (let j = GRD - 34; j < GRD; j++) { const c = codeAt(S, rx(i), (j + .5 - GRD) * UR); if (c) M.set(i + ',' + j, { code: c, v: c }); }
  const wx = SPL.x + 44, hit = t >= SPL.t0;
  for (let i = LANE0; i <= LANE1; i++) { const x = rx(i), wet = Math.abs(x - wx) < 300; M.set(i + ',' + GRD, { code: wet ? 'W' : 'G', v: wet ? 'W' : '0', flash: wet && hit && t - SPL.t0 < .12 ? 1 : 0 }); }
  for (const c of STEPS) { if (c.t0 > t) continue; const i = Math.floor((c.x + 44 - Xp) / UC + PCc); if (i >= LANE0 && i <= LANE1) M.set(i + ',' + STEPROW, { code: 'n', v: c.t0.toFixed(2), flash: t - c.t0 < .12 ? 1 : 0 }); }
  // the splash: droplet cells hop on the grid above the wet cells (and ride the lane with them)
  const a = t - SPL.t0; if (a > 0 && a < .85) { const i0 = (wx - Xp) / UC + PCc;
    for (let k = 0; k < 9; k++) { const di = (k - 4) * .8 + (hash(k) - .5) * .6, vy = 9 + hash(k * 3.1) * 9, h = Math.round(vy * a - 26 * a * a); if (h < 0) continue; const i = Math.floor(i0 + di * (1 + a * 1.5)), j = GRD - 1 - h;
      if (!M.has(i + ',' + j)) M.set(i + ',' + j, { code: 'D', v: 'd' }); } }
  return M;
}
const TOWERCELLS = new Map(); TOWER.forEach((row, r) => [...row].forEach((ch, i) => { if (ch !== '.') TOWERCELLS.set((TOW + i) + ',' + (TOW_R0 + r), { code: ch, v: ch === 'F' ? '0' : ch }); }));

// ═════════ the formulas: typed letter by letter; Enter drops the result and moves the selection down
const F1 = { cell: [1, 29], t0: -.15, t1: .84, enter: EV.splash, parts: [['=IF(', INK], ['foot', RED], ['="W","SPLASH","dry")', INK]] };
const F2 = { cell: [1, 31], t0: 2.62, t1: 3.08, enter: 3.125, parts: [['=COUNT(', INK], ['steps', '#3f8a10'], [')', INK]] };
const F3 = { cell: [1, 33], t0: 5.66, t1: 5.98, enter: EV.watchUp, parts: [['=NOW()', INK]] };
const FS = [F1, F2, F3];
const typed = (F, t) => { const s = F.parts.map(p => p[0]).join(''), n = Math.floor(clamp((t - F.t0) / (F.t1 - F.t0)) * s.length + 1e-6); let left = n; return F.parts.map(([str, col]) => { const k = Math.max(0, Math.min(str.length, left)); left -= k; return [str.slice(0, k), col]; }); };
const FOOTCOL = Math.floor((SPL.x + 44 - X(SPL.t0)) / UC + PCc);

// ═════════ camera: the sheet's zoom and scroll (the shell never zooms); keyed as (zoom, scrollX, scrollY) in world px
const TITLE_H = 32, TOOL_H = 44, FBAR_H = 52, SY0 = TITLE_H + TOOL_H + FBAR_H, TABS_H = 30, STAT_H = 26, SB = H - TABS_H - STAT_H, RHW = 50;
const hdrH = z => clamp(26 * Math.pow(z, .35), 22, 38);
const camK = (z, sx, sy) => ({ z, sx, sy });
const mixK = (a, b, u) => camK(Math.exp(lerp(Math.log(a.z), Math.log(b.z), u)), lerp(a.sx, b.sx, u), lerp(a.sy, b.sy, u));
const C1 = t => camK(lerp(1.3, 1.36, seg(t, 0, 2.5)), 0, rowY(10) + 10 * seg(t, 0, 2.5));
const C2 = t => camK(lerp(.97, 1.0, seg(t, 3.3, 7.5)), 0, 0);
const C3 = t => { const z = lerp(3.1, 3.35, seg(t, 7.8, 9.375)), avail = SB - SY0 - hdrH(z); return camK(z, 0, rowY(33) + RH - avail / 2 / z); };
const C4 = t => { const z = lerp(.5, .485, seg(t, 9.6, 10)), avail = SB - SY0 - hdrH(z); return camK(z, 0, Math.max(0, rowY(21) - avail / 2 / z)); };
function camAt(t) {
  if (t < 2.5) return C1(t);
  if (t < 7.5) return mixK(C1(2.5), C2(t), eio(seg(t, 2.5, 3.2)));
  if (t < 9.375) return mixK(C2(7.5), C3(t), eio(seg(t, 7.5, 7.85)));
  return mixK(C3(9.375), C4(t), eio(seg(t, 9.375, 9.62)));
}

// ═════════ drawing helpers
const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const line = (x0, y0, x1, y1, c, w = 1) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
const text = (s, x, y, font, col, al = 'left', bl = 'middle') => { g.font = font; g.fillStyle = col; g.textAlign = al; g.textBaseline = bl; g.fillText(s, x, y); };
const tri = (x, y, s, c, dir = 'down') => { g.fillStyle = c; g.beginPath(); if (dir === 'down') { g.moveTo(x - s, y - s / 2); g.lineTo(x + s, y - s / 2); g.lineTo(x, y + s / 2); } else if (dir === 'left') { g.moveTo(x + s / 2, y - s); g.lineTo(x + s / 2, y + s); g.lineTo(x - s / 2, y); } else { g.moveTo(x - s / 2, y - s); g.lineTo(x - s / 2, y + s); g.lineTo(x + s / 2, y); } g.fill(); };
const lum = hex => { const n = parseInt(hex.slice(1), 16); return (.2126 * (n >> 16) + .7152 * (n >> 8 & 255) + .0722 * (n & 255)) / 255; };

// merged ranges (the layout): [c0, r0, c1, r1, content(t) → {text, font size (world px), weight, col, fill, align}]
function merged(t) {
  const M = [];
  M.push([0, 27, 1, 27, () => ({ s: 'last train · run log', size: 15, wt: 700, col: INK, fill: '#f1f0eb', al: 'left' })]);
  M.push([0, 29, 0, 29, () => ({ s: 'splash', size: 13, wt: 500, col: '#555', al: 'left' })]);
  M.push([0, 31, 0, 31, () => ({ s: 'steps', size: 13, wt: 500, col: '#555', al: 'left' })]);
  M.push([0, 33, 0, 34, () => ({ s: 'now', size: 13, wt: 500, col: '#555', al: 'left' })]);
  const pop = t0 => 1 + .3 * Math.sin(Math.PI * seg(t, t0, t0 + .18));
  if (t >= F1.enter) M.push([1, 29, 1, 29, () => ({ s: 'SPLASH', size: 15 * pop(F1.enter), wt: 700, col: '#fff', fill: SKY, flash: t - F1.enter < .12, al: 'center' })]);
  if (t >= F2.enter) { const n = STEPS.filter(c => c.t0 <= t).length, last = STEPS.filter(c => c.t0 <= t).pop(); M.push([1, 31, 1, 31, () => ({ s: String(n), size: 15 * (t - last.t0 < .18 ? pop(last.t0) : pop(F2.enter)), wt: 700, col: INK, fill: LIME, flash: t - F2.enter < .12, al: 'center' })]); }
  if (t >= F3.enter) { const s0 = Math.floor(W_T(t) + 1e-6), tick = t - (Math.floor(t - .4) + .4); M.push([1, 33, 1, 34, () => ({ s: hms(W_T(t)), size: 26 * (tick < .18 ? 1 + .12 * Math.sin(Math.PI * tick / .18) : 1), wt: 700, col: INK, fill: '#fff6dc', flash: tick < .12, al: 'center' })]); }
  M.push([TOW - 2, GRD + 1, TOW + 8, GRD + 2, () => t >= EV.chime ? ({ s: 'CHIME · 11:58:49', size: 26 * (1 + .3 * Math.sin(Math.PI * seg(t, EV.chime, EV.chime + .18))), wt: 700, col: INK, fill: LIME, flash: t - EV.chime < .12, al: 'center' }) : ({ s: 'station clock', size: 22, wt: 600, col: '#555', fill: '#f1f0eb', al: 'center' })]);
  return M;
}
// the banded colour scale (S4 payoff): 6 steps from the clock cell, alternating light / dark, painting only empty cells
const SCALE = ['#fff4cc', '#ffd36b', '#f4f8d0', '#c9ef7e', '#fff4cc', '#ffbf47'];
const bloomAt = (i, j, t) => { if (t < EV.chime) return null; const d = Math.max(Math.abs(i - CLOCK[0]) * 2.9, Math.abs(j - CLOCK[1])), R = (t - EV.chime) * 120; if (d > R) return null; return { fill: SCALE[Math.floor(d / 5) % 6], flash: R - d < 6 }; };

function drawSheet(t, cam) {
  const { z, sx, sy } = cam, HD = hdrH(z), top = SY0 + HD, X0s = RHW, wx = x => X0s + (x - sx) * z, wy = y => top + (y - sy) * z;
  g.save(); g.beginPath(); g.rect(X0s, top, W - X0s, SB - top); g.clip();
  rect(X0s, top, W - X0s, SB - top, '#ffffff');
  const lane = laneCells(t), merges = merged(t), inMerge = new Set(); for (const [c0, r0, c1, r1] of merges) for (let i = c0; i <= c1; i++) for (let j = r0; j <= r1; j++) inMerge.add(i + ',' + j);
  let i0 = 0; while (i0 < NC - 1 && wx(colX(i0 + 1)) < X0s) i0++; let i1 = i0; while (i1 < NC && wx(colX(i1)) < W) i1++;
  const j0 = Math.max(0, Math.floor(sy / RH)), j1 = Math.min(NR, Math.ceil((sy + (SB - top) / z) / RH));
  const showV = 11 * z >= 6.5, painted = new Path2D(), white = new Path2D();
  g.font = `500 ${11 * z}px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) {
    const k = i + ',' + j, x = wx(colX(i)), y = wy(rowY(j)), w = CW(i) * z, h = RH * z;
    if (inMerge.has(k)) continue;
    const L = lane.get(k) || TOWERCELLS.get(k);
    if (L) { const f = FILL[L.code]; rect(x, y, w, h, L.flash ? '#ffffff' : f); painted.rect(x + .5, y + .5, w, h);
      if (showV && !L.flash) { g.fillStyle = lum(f) < .45 ? 'rgba(255,255,255,.55)' : 'rgba(23,18,10,.38)'; g.fillText(L.v, x + w / 2, y + h / 2 + .5); } continue; }
    const B = bloomAt(i, j, t); if (B) { rect(x, y, w, h, B.flash ? '#ffffff' : B.fill); painted.rect(x + .5, y + .5, w, h); continue; }
    white.rect(x + .5, y + .5, w, h);
  }
  g.strokeStyle = '#dad9d3'; g.lineWidth = 1; g.stroke(white); g.strokeStyle = 'rgba(6,4,18,.42)'; g.stroke(painted);
  // merged ranges
  for (const [c0, r0, c1, r1, fn] of merges) { const x = wx(colX(c0)), y = wy(rowY(r0)), w = (colX(c1 + 1) - colX(c0)) * z, h = (r1 - r0 + 1) * RH * z; if (x > W || x + w < X0s || y > SB || y + h < top) continue; const m = fn();
    rect(x, y, w, h, m.flash ? '#ffffff' : (m.fill || '#ffffff')); g.strokeStyle = m.fill ? 'rgba(6,4,18,.42)' : '#c9c8c2'; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, w, h);
    text(m.s, m.al === 'left' ? x + 8 * z : x + w / 2, y + h / 2 + 1, `${m.wt} ${m.size * z}px ${UI}`, m.col, m.al === 'left' ? 'left' : 'center'); }
  // in-cell editing: the formula shows in its cell while it is typed
  for (const F of FS) if (t >= F.t0 && t < F.enter) { const [c, r] = F.cell, x = wx(colX(c)), y = wy(rowY(r)); rect(x, y, CW(c) * z, RH * z, '#ffffff');
    let xx = x + 4 * z; for (const [s, col] of typed(F, t)) { text(s, xx, y + RH * z / 2 + 1, `500 ${11.5 * z}px ${UI}`, col); xx += g.measureText(s).width; } }
  // reference boxes while a formula names a range
  const ref = (c0, r0, c1, r1, col) => { const x = wx(colX(c0)), y = wy(rowY(r0)), w = (colX(c1 + 1) - colX(c0)) * z, h = (r1 - r0 + 1) * RH * z; g.strokeStyle = col; g.lineWidth = 2.5; g.setLineDash([]); g.strokeRect(x, y, w, h); rect(x + w - 3, y + h - 3, 6, 6, col); };
  if (t >= F1.t0 + .3 && t < F1.enter + .25) ref(FOOTCOL, GRD, FOOTCOL, GRD, RED);
  if (t >= F2.t0 + .3 && t < F2.enter + .3) ref(LANE0, STEPROW, LANE1, STEPROW, '#3f8a10');
  // the hero: the selected cell (thick ink border, marching ants while editing, fill handle)
  const sel = selAt(t); if (sel) { const [c0, r0, c1, r1] = sel.r, x = wx(colX(c0)), y = wy(rowY(r0)), w = (colX(c1 + 1) - colX(c0)) * z, h = (r1 - r0 + 1) * RH * z;
    g.strokeStyle = INK; g.lineWidth = Math.max(2.5, 2.2 * Math.sqrt(z)); g.strokeRect(x - 1, y - 1, w + 2, h + 2);
    if (sel.ants) { g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; g.setLineDash([5, 4]); g.lineDashOffset = -t * 40; g.strokeRect(x - 1, y - 1, w + 2, h + 2); g.setLineDash([]); }
    rect(x + w - 3, y + h - 3, 7, 7, INK); rect(x + w - 2, y + h - 2, 5, 5, '#ffffff'); rect(x + w - 1, y + h - 1, 3, 3, INK); }
  g.restore();
  // headers (column letters, row numbers): the selected column / row highlighted
  rect(0, SY0, W, HD, '#efeee9'); rect(0, SY0, RHW, SB - SY0, '#efeee9');
  g.save(); g.beginPath(); g.rect(RHW, SY0, W - RHW, HD); g.clip();
  for (let i = i0; i < i1; i++) { const x = wx(colX(i)), w = CW(i) * z, on = sel && i >= sel.r[0] && i <= sel.r[2]; if (on) rect(x, SY0, w, HD, '#dedcd2');
    line(x + w + .5, SY0 + 4, x + w + .5, SY0 + HD, '#c8c7c1'); if (w > 14) text(colName(i), x + w / 2, SY0 + HD / 2 + 1, `${on ? 700 : 500} ${Math.min(13, 9 + 2 * z)}px ${UI}`, on ? INK : '#55544e', 'center'); }
  g.restore(); g.save(); g.beginPath(); g.rect(0, top, RHW, SB - top); g.clip();
  for (let j = j0; j < j1; j++) { const y = wy(rowY(j)), h = RH * z, on = sel && j >= sel.r[1] && j <= sel.r[3]; if (on) rect(0, y, RHW, h, '#dedcd2'); line(4, y + h + .5, RHW, y + h + .5, '#c8c7c1');
    if (h > 8) text(String(j + 1), RHW / 2, y + h / 2 + 1, `${on ? 700 : 500} ${Math.min(12.5, 6 + 3 * z)}px ${UI}`, on ? INK : '#55544e', 'center'); }
  g.restore(); line(RHW - .5, SY0, RHW - .5, SB, '#b5b4ae'); line(0, SY0 + HD - .5, W, SY0 + HD - .5, '#b5b4ae');
  return { wx, wy };
}
function selAt(t) {
  if (t < F1.enter) return { r: [1, 29, 1, 29], ants: true, name: 'B30', f: F1 };
  if (t < 2.55) return { r: [1, 30, 1, 30], name: 'B31' };
  if (t < F2.enter) return { r: [1, 31, 1, 31], ants: t >= F2.t0, name: 'B32', f: F2 };
  if (t < 5.5) return { r: [1, 32, 1, 32], name: 'B33' };
  if (t < F3.enter) return { r: [1, 33, 1, 34], ants: t >= F3.t0, name: 'B34', f: F3 };
  if (t < 9.375) return { r: [1, 33, 1, 34], name: 'B34', show: '=NOW()' };
  return { r: [CLOCK[0] - 2, CLOCK[1] - 1, CLOCK[0] + 2, CLOCK[1] + 2], name: 'clock', show: '=NOW()' };
}
function drawChrome(t) {
  rect(0, 0, W, TITLE_H, '#dcdbd5'); for (let n = 0; n < 3; n++) { g.fillStyle = '#c6c5bf'; g.beginPath(); g.arc(20 + n * 20, TITLE_H / 2, 6, 0, 7); g.fill(); }
  g.fillStyle = '#4b7a2a'; g.fillRect(84, 9, 14, 14); g.fillStyle = '#fff'; g.fillRect(87, 12, 3, 3); g.fillRect(91, 12, 3, 3); g.fillRect(87, 16, 3, 3); g.fillRect(91, 16, 3, 3);
  text('last_train.sheet', 106, TITLE_H / 2 + 1, `500 13px ${UI}`, '#333'); text('night of the last train  ·  one runner', W / 2, TITLE_H / 2 + 1, `500 12px ${UI}`, '#77766f', 'center');
  text(FS.some(F => t >= F.enter && t < F.enter + .6) ? 'Saving…' : 'Saved', W - 16, TITLE_H / 2 + 1, `12px ${UI}`, '#7a7a74', 'right'); line(0, TITLE_H - .5, W, TITLE_H - .5, '#b5b4ae');
  const ty = TITLE_H; rect(0, ty, W, TOOL_H, '#f1f0eb'); let x = 14; const m = ty + TOOL_H / 2;
  const btn = (w, draw, on) => { if (on) { rect(x, ty + 6, w, TOOL_H - 12, '#ffe2a3'); g.strokeStyle = '#c9a24f'; g.lineWidth = 1; g.strokeRect(x + .5, ty + 6.5, w - 1, TOOL_H - 13); } draw(x); x += w + 4; };
  const sep = () => { line(x + 2.5, ty + 9, x + 2.5, ty + TOOL_H - 9, '#c8c7c1'); x += 10; };
  btn(26, a => { g.strokeStyle = '#444'; g.lineWidth = 1.6; g.beginPath(); g.arc(a + 14, m + 2, 6, Math.PI * 1.1, Math.PI * 2.2); g.stroke(); tri(a + 8, m - 2, 3, '#444', 'left'); });
  btn(26, a => { g.strokeStyle = '#444'; g.lineWidth = 1.6; g.beginPath(); g.arc(a + 12, m + 2, 6, Math.PI * .8, Math.PI * 1.9, false); g.stroke(); tri(a + 18, m - 2, 3, '#444', 'right'); }); sep();
  btn(116, a => { rect(a, m - 12, 116, 24, '#fff'); g.strokeStyle = '#bbbab4'; g.lineWidth = 1; g.strokeRect(a + .5, m - 11.5, 115, 23); text('Inter', a + 8, m + 1, `13px ${UI}`, '#222'); tri(a + 104, m, 4, '#666'); });
  btn(46, a => { rect(a, m - 12, 46, 24, '#fff'); g.strokeStyle = '#bbbab4'; g.strokeRect(a + .5, m - 11.5, 45, 23); text('11', a + 8, m + 1, `13px ${UI}`, '#222'); tri(a + 36, m, 4, '#666'); }); sep();
  btn(26, a => text('B', a + 13, m + 1, `700 15px ${UI}`, '#222', 'center')); btn(26, a => text('I', a + 13, m + 1, `500 15px ${UI}`, '#222', 'center')); btn(26, a => { text('U', a + 13, m, `500 15px ${UI}`, '#222', 'center'); line(a + 8, m + 9, a + 18, m + 9, '#222'); }); sep();
  btn(30, a => { g.strokeStyle = '#333'; g.lineWidth = 1.2; g.strokeRect(a + 8.5, m - 8.5, 13, 11); line(a + 6, m + 7, a + 24, m + 7, AMBER, 4); });
  btn(26, a => text('Σ', a + 13, m + 1, `500 16px ${UI}`, '#222', 'center'), t >= F2.t0 && t < F2.enter); sep();
  const cfOn = (t >= SPL.t0 - .05 && t < SPL.t0 + .5) || (t >= EV.chime - .05 && t < 10);
  btn(170, a => { [INK, LIME, RED, INDIGO, AMBER].forEach((c, n) => rect(a + 8 + n * 5, m - 7, 5, 14, c)); text('Conditional format', a + 40, m + 1, `500 13px ${UI}`, '#222'); tri(a + 158, m, 4, '#666'); }, cfOn);
  const rule = t < EV.chime ? 'Rules: C → red · H L → indigo · S → amber · W → sky · steps → lime' : 'Rule: colour scale, 6 steps, from clock';
  btn(560, a => text(rule, a + 10, m + 1, `500 13px ${UI}`, '#444')); line(0, ty + TOOL_H - .5, W, ty + TOOL_H - .5, '#c8c7c1');
  // formula bar: the line of the film
  const fy = TITLE_H + TOOL_H, fm = fy + FBAR_H / 2 + 1, sel = selAt(t); rect(0, fy, W, FBAR_H, '#f8f7f3');
  rect(10, fy + 9, 150, FBAR_H - 18, '#fff'); g.strokeStyle = '#b3b2ac'; g.lineWidth = 1; g.strokeRect(10.5, fy + 9.5, 149, FBAR_H - 19);
  text(sel.name, 22, fm, `700 16px ${UI}`, INK); tri(148, fm, 4, '#777');
  const editing = sel.f && t >= sel.f.t0 && t < sel.f.enter;
  g.strokeStyle = editing ? '#b03030' : '#c9c8c2'; g.lineWidth = 2; g.beginPath(); g.moveTo(176, fm - 6); g.lineTo(188, fm + 6); g.moveTo(188, fm - 6); g.lineTo(176, fm + 6); g.stroke();
  g.strokeStyle = editing ? '#2a7a3a' : '#c9c8c2'; g.beginPath(); g.moveTo(203, fm); g.lineTo(208, fm + 5); g.lineTo(218, fm - 6); g.stroke();
  text('fx', 240, fm, `italic 700 17px ${UI}`, '#333', 'center');
  rect(262, fy + 6, W - 272, FBAR_H - 12, '#fff'); g.strokeStyle = '#b3b2ac'; g.strokeRect(262.5, fy + 6.5, W - 273, FBAR_H - 13);
  let fx = 278; const parts = sel.f ? (t < sel.f.enter ? typed(sel.f, t) : sel.f.parts) : sel.show ? [[sel.show, INK]] : [];
  for (const [s, col] of parts) { text(s, fx, fm, `700 26px ${UI}`, col); fx += g.measureText(s).width; }
  if (editing && Math.floor(t * 8) % 2 === 0) rect(fx + 3, fy + 13, 2.5, FBAR_H - 26, INK);
  line(0, fy + FBAR_H - .5, W, fy + FBAR_H - .5, '#b5b4ae');
  // sheet tabs + status bar
  const by = SB; rect(0, by, W, TABS_H, '#e5e4de'); line(0, by + .5, W, by + .5, '#9a9a94'); tri(18, by + TABS_H / 2, 5, '#888', 'left'); tri(36, by + TABS_H / 2, 5, '#888', 'right');
  let tx = 56; for (const [name, on] of [['run', true], ['watch', false], ['station', false], ['+', false]]) { g.font = `${on ? 700 : 500} 13px ${UI}`; const w = g.measureText(name).width + 28;
    if (on) { rect(tx, by, w, TABS_H - 3, '#fff'); line(tx, by + TABS_H - 3, tx + w, by + TABS_H - 3, AMBER, 3); } text(name, tx + w / 2, by + TABS_H / 2, `${on ? 700 : 500} 13px ${UI}`, on ? INK : '#555', 'center'); line(tx + w + .5, by + 5, tx + w + .5, by + TABS_H - 5, '#b5b4ae'); tx += w; }
  const sy = by + TABS_H, sm = sy + STAT_H / 2 + 1; rect(0, sy, W, STAT_H, INK);
  const n = STEPS.filter(c => c.t0 <= t).length; let mode = editing ? 'Edit' : 'Ready', msg = `Steps row  ·  Count  ${n}`;
  if (t >= SPL.t0 && t < SPL.t0 + .5) { mode = 'Recalc'; msg = 'Rule fired: W → sky  ·  9 droplet cells'; }
  if (t >= F3.enter && t < 9.375) msg = `NOW()  ${hms(W_T(t))}  ·  recalculates every second`;
  if (t >= EV.chime) { mode = 'Recalc'; msg = `Applying colour scale  ${Math.min(5400, Math.round((t - EV.chime) * 120 * 40))} cells`; }
  text(mode, 14, sm, `600 12.5px ${UI}`, '#f1f0eb'); text(msg, 110, sm, `500 12.5px ${UI}`, '#cfcdc4');
  const z = camAt(t).z; text(`${Math.round(z * 100)} %`, W - 18, sm, `600 12.5px ${UI}`, '#f1f0eb', 'right');
  rect(W - 220, sm - 2, 140, 3, '#5a574e'); rect(W - 220 + 140 * clamp((Math.log(z) - Math.log(.25)) / (Math.log(4) - Math.log(.25))) - 3, sm - 6, 6, 11, '#f1f0eb');
}
function frame(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); rect(0, 0, W, H, '#dcdbd5');
  drawSheet(t, camAt(t)); drawChrome(t);
}
window.render = t => frame(t);
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
