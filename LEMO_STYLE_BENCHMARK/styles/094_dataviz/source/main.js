// 094 · Data Storytelling — the first 10 s of "Last Train Home" as one chart drawn in real time (lemo-opuscar styles/dataviz).
// The data is the run itself: every foot contact of the shared run rig, exported to data/footfalls.csv (make_footfalls.mjs) and
// read here by column name. Each footfall lands as a dot at the moment it happens (the chart's rhythm is the run's rhythm: 2.9
// steps a second); the red–blue pencil taps them. Notes in blue pencil (memories and human notes) are pinned in data space; on the
// chime the pencil flips to red (a turn), the time axis rescales in ratchet steps out to midnight, and the next 71 s stay an empty,
// dashed cell: nothing is extrapolated.
//   S1  the origin, close: the first taps; the third footfall is in the puddle (0.94 s): a blue ring and the note "puddle"
//   S2  tracking the pencil, the newest mark at ~60 % of the width; a ruler line "4.06 m every second"; at 6.05 s "11:58 on her watch"
//   S3  down to the time axis: the tick 23:58:48 lands at 8.4 s; "the station clock"
//   S4  the chime: the red lead, the rescale to 00:00, the empty next cell "71 s, not yet run"
import { DUR, shotAt, T as EV } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash, mulberry } from './shared/lib/util.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';

window.DUR = DUR;
const W = 1920, H = 1080, TAU = Math.PI * 2;
await Promise.all(['500 34px CV', '400 30px NR', '500 52px NR', '400 18px PM'].map(f => document.fonts.load(f, 'Aa0')));
const g = document.getElementById('c').getContext('2d');
// ═════════ the data, by column name
const csv = await (await fetch('data/footfalls.csv')).text();
const [head, ...lines] = csv.trim().split('\n'), cols = head.split(','), col = n => cols.indexOf(n);
const DATA = lines.map(l => l.split(',')).map(r => ({ step: +r[col('step')], t: +r[col('t_s')], clock: r[col('clock')], d: +r[col('distance_m')], wet: r[col('in_puddle')] === '1' }));
const SPEED = (DATA[DATA.length - 1].d - DATA[0].d) / (DATA[DATA.length - 1].t - DATA[0].t);   // 4.06 m/s, measured from the file
const T_MID = 8.4 + 72;   // film time of 00:00:00 (the clock reads 23:58:48 at 8.4 s)
const C = { paper: '#F4EEDF', ink: '#2B2520', grid: '#D8CDB8', blue: '#2C5BA0', red: '#C7352C', pale: '#9A8F80' };
// value ramp (one sequential ramp, distance run): pale sand → deep umber
const RAMP = ['#F1DDA8', '#E6B872', '#CF8B48', '#A8602E', '#74391B'];
const ramp = u => { u = clamp(u) * (RAMP.length - 1); const i = Math.min(RAMP.length - 2, Math.floor(u)), f = u - i, a = RAMP[i].match(/\w\w/g).map(h => parseInt(h, 16)), b = RAMP[i + 1].match(/\w\w/g).map(h => parseInt(h, 16)); return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(',')})`; };

// ═════════ the sheet (world = chart pixels at zoom 1): plot box, axes, scale
const PB = { x: 280, y: 230, w: 1400, h: 560 };
const D_MAX = 44;
// the time domain grows out to midnight on the chime, in four ratchet steps (each eased)
function xMax(t) { if (t < EV.chime + .01) return 10.5; const steps = [10.5, 30, 55, 84]; let v = 10.5; for (let i = 0; i < 3; i++) { const t0 = EV.chime + .01 + i * .055; v = lerp(v, steps[i + 1], eo(seg(t, t0, t0 + .045))); } return v; }   // three ratchet clicks
const X = (s, t) => PB.x + s / xMax(t) * PB.w, Y = d => PB.y + PB.h - d / D_MAX * PB.h;
// camera {x, y, z} over the sheet
let CAM = { x: 960, y: 540, z: 1 };
const toS = (x, y) => [(x - CAM.x) * CAM.z + 960, (y - CAM.y) * CAM.z + 540];
const camT = () => g.setTransform(CAM.z, 0, 0, CAM.z, 960 - CAM.x * CAM.z, 540 - CAM.y * CAM.z), idT = () => g.setTransform(1, 0, 0, 1, 0, 0);
// paper: warm cream, fixed-seed fibres, a faint dot grid in world space
const paper = document.createElement('canvas'); paper.width = 2400; paper.height = 1500; { const p = paper.getContext('2d'), r = mulberry(94);
  p.fillStyle = C.paper; p.fillRect(0, 0, 2400, 1500);
  for (let i = 0; i < 9000; i++) { const x = r() * 2400, y = r() * 1500, l = 4 + r() * 18, a = r() * TAU; p.strokeStyle = `rgba(${r() < .5 ? '120,100,70' : '255,255,250'},${.04 + r() * .06})`; p.lineWidth = .6 + r() * .6; p.beginPath(); p.moveTo(x, y); p.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke(); }
  p.fillStyle = 'rgba(150,130,100,.16)'; for (let y = 10; y < 1500; y += 20) for (let x = 10; x < 2400; x += 20) p.fillRect(x - .9, y - .9, 1.8, 1.8); }
const SH0 = { x: -240, y: -210 };   // the paper's origin in world coordinates

// ═════════ the pencil: only the tip end shows, from the lower right; the shadow drifts with lift
function pencil(x, y, lift, lead) {   // x,y = tip in screen px
  const ang = -2.35, L = 520, wd = 30, dir = [Math.cos(ang), Math.sin(ang)], nx = -dir[1], ny = dir[0];
  const sx = x + 10 + lift * 26, sy = y + 6 + lift * 34, sb = 4 + lift * 16;
  g.save(); g.filter = `blur(${sb.toFixed(1)}px)`; g.fillStyle = `rgba(60,45,30,${.22 - lift * .08})`; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx - dir[0] * 60 + nx * 14, sy - dir[1] * 60 + ny * 14); g.lineTo(sx - dir[0] * L + nx * 16, sy - dir[1] * L + ny * 16); g.lineTo(sx - dir[0] * L - nx * 16, sy - dir[1] * L - ny * 16); g.lineTo(sx - dir[0] * 60 - nx * 14, sy - dir[1] * 60 - ny * 14); g.closePath(); g.fill(); g.restore();
  const P = (a, n) => [x - dir[0] * a + nx * n, y - dir[1] * a + ny * n];
  // graphite tip and the sharpened wood cone
  g.fillStyle = lead === 'red' ? '#B8322A' : '#2A4F8E'; g.beginPath(); g.moveTo(x, y); g.lineTo(...P(16, 4)); g.lineTo(...P(16, -4)); g.closePath(); g.fill();
  const cone = g.createLinearGradient(...P(16, -wd / 2), ...P(16, wd / 2)); cone.addColorStop(0, '#E8C9A0'); cone.addColorStop(.5, '#F3DCB8'); cone.addColorStop(1, '#C9A47A');
  g.fillStyle = cone; g.beginPath(); g.moveTo(...P(16, 4)); g.lineTo(...P(70, wd / 2)); g.lineTo(...P(70, -wd / 2)); g.lineTo(...P(16, -4)); g.closePath(); g.fill();
  // the hex body: the half nearest the tip carries the lead's colour; three facets
  const body = lead === 'red' ? ['#9E2620', '#C7352C', '#E0574C'] : ['#1F3F72', '#2C5BA0', '#4E7CC0'];
  [[-wd / 2, -wd / 6], [-wd / 6, wd / 6], [wd / 6, wd / 2]].forEach(([a, b], i) => { g.fillStyle = body[i]; g.beginPath(); g.moveTo(...P(70, a)); g.lineTo(...P(L, a)); g.lineTo(...P(L, b)); g.lineTo(...P(70, b)); g.closePath(); g.fill(); });
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(...P(70, -wd / 2)); g.lineTo(...P(70, wd / 2)); g.stroke();
}
// ═════════ handwriting (Caveat): per-glyph jitter, graphite grain, written on left to right
function hand(s, x, y, size, col, k = 1, seed = 1, al = 'left') {
  if (k <= 0) return null; g.save(); g.font = `500 ${size}px CV`; g.textBaseline = 'alphabetic'; const w = g.measureText(s).width; if (al === 'right') x -= w; if (al === 'center') x -= w / 2;
  let cx = x; const n = s.length, shown = k * n; let tip = [x, y];
  for (let i = 0; i < n; i++) { const ch = s[i], cw = g.measureText(ch).width; if (i >= shown) break; const part = Math.min(1, shown - i);
    g.save(); g.translate(cx + cw / 2, y + (hash(seed * 31 + i) - .5) * 2); g.rotate((hash(seed * 17 + i) - .5) * .06); g.beginPath(); g.rect(-cw / 2 - 2, -size, (cw + 4) * part, size * 1.4); g.clip();
    g.fillStyle = col; g.globalAlpha *= .9; g.fillText(ch, -cw / 2, 0); g.globalAlpha *= .35; g.fillText(ch, -cw / 2 + .6, .5); g.restore();
    tip = [cx + cw * part, y - size * .3 * (.5 + .5 * Math.sin(i * 2.3 + part * 6))]; cx += cw; }
  g.restore(); return { w, tip };
}
// a wobbly leader that ends in an un-closed ring around the mark
function leaderRing(x0, y0, mx, my, r, col, k = 1, seed = 1) {
  if (k <= 0) return; g.save(); g.strokeStyle = col; g.lineWidth = 2; g.lineCap = 'round'; const a0 = Math.atan2(y0 - my, x0 - mx), ex = mx + Math.cos(a0) * r, ey = my + Math.sin(a0) * r;
  const n = 18, kk = Math.min(1, k * 1.6); g.beginPath(); for (let i = 0; i <= n * kk; i++) { const u = i / n, px = lerp(x0, ex, u) + Math.sin(u * 7 + seed) * 3 * (1 - u), py = lerp(y0, ey, u) + Math.cos(u * 5 + seed) * 3 * (1 - u); i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
  if (k > .6) { const kr = (k - .6) / .4; g.beginPath(); for (let i = 0; i <= 40 * kr; i++) { const a = a0 + i / 40 * TAU * .86, rr = r * (1 + .06 * Math.sin(i * .9 + seed)); const px = mx + Math.cos(a) * rr, py = my + Math.sin(a) * rr; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); }
  g.restore();
}
const mono = (s, x, y, size = 18, col = C.ink, al = 'left') => { g.font = `400 ${size}px PM`; g.textAlign = al; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(s, x, y); g.textAlign = 'left'; };
function pencilLine(x0, y0, x1, y1, col, k = 1, w = 1.6, seed = 1) { if (k <= 0) return; g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); const n = 30; for (let i = 0; i <= n * k; i++) { const u = i / n, px = lerp(x0, x1, u) + (hash(seed + i) - .5) * .8, py = lerp(y0, y1, u) + (hash(seed * 3 + i) - .5) * .8; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); g.restore(); }

// ═════════ the story's beats on the chart
const SPL = DATA.find(d => d.wet);
const dAt = s => { const i = DATA.findIndex(d => d.t > s); if (i <= 0) return i === 0 ? DATA[0].d : DATA[DATA.length - 1].d; const a = DATA[i - 1], b = DATA[i]; return lerp(a.d, b.d, (s - a.t) / (b.t - a.t)); };
const NOTES = [   // [start, end of writing, text, lead, pinned at (t, d), offset px]
  { t0: EV.splash + .08, t1: EV.splash + .32, s: 'puddle', lead: 'blue', at: () => [SPL.t, SPL.d], off: [-130, -86] },
  { t0: 3.35, t1: 3.85, s: '4.06 m every second', lead: 'blue', at: () => [3.0, dAt(3.0)], off: [-60, -110] },
  { t0: EV.watchUp + .05, t1: EV.watchUp + .45, s: '11:58 on her watch', lead: 'blue', at: () => [EV.watchUp, dAt(EV.watchUp)], off: [-300, -96] },
  { t0: 8.45, t1: 8.95, s: 'the station clock', lead: 'blue', at: () => [8.4, 0], off: [-80, -86], axis: true },
  { t0: EV.chime + .2, t1: EV.chime + .32, s: 'last train 00:00', lead: 'red', at: () => [T_MID, D_MAX * .55], off: [-250, -40], line: true },
];
function camAt(t) {
  const K = (x, y, z) => ({ x, y, z }), mix = (a, b, k) => K(lerp(a.x, b.x, k), lerp(a.y, b.y, k), lerp(a.z, b.z, k));
  const last = DATA.filter(d => d.t <= t).pop() || DATA[0], nx = X(Math.max(t, .3), t), ny = Y(dAt(Math.max(t, .3)));
  const C1 = K(X(1.1, 0) + 40, Y(3.2) - 40, 2.1);
  const C2 = t => K(X(Math.max(t, 2.5), t) - .1 * 1920 / 1.55, Y(dAt(Math.max(t, 2.5))) - 20, 1.55);
  const C3 = t => K(X(8.4, t) - 140, 600, lerp(1.3, 1.42, seg(t, 7.8, 9.3)));
  const C4 = K(980, 520, .93);
  if (t < 2.5) return mix(K(X(.5, 0) + 60, Y(1.5) - 20, 2.4), C1, ss(t / 2.5));
  if (t < 7.5) return t < 3.1 ? mix(C1, C2(3.1), eio(seg(t, 2.5, 3.1))) : C2(t);
  if (t < 9.375) return t < 7.85 ? mix(C2(7.5), C3(7.85), eio(seg(t, 7.5, 7.85))) : C3(t);
  return mix(C3(9.375), C4, eio(seg(t, 9.375, 9.7)));
}
// pencil target: taps each footfall as it lands; writes the notes; hops between with a lift
function pencilAt(t) {
  const note = NOTES.find(n => t >= n.t0 - .06 && t < n.t1 + .06);
  if (note) return { note };
  const i = DATA.findIndex(d => d.t > t), a = DATA[Math.max(0, i - 1)], b = DATA[i < 0 ? DATA.length - 1 : i];
  if (i === 0) { const k = seg(t, 0, b.t); return { x: X(b.t, t) + 90 * (1 - k), y: Y(b.d) - 40 * (1 - k), lift: (1 - eo(k)) * .8 }; }
  const u = clamp((t - a.t) / Math.max(.05, b.t - a.t)); const x = lerp(X(a.t, t), X(b.t, t), eio(u)), y = lerp(Y(a.d), Y(b.d), eio(u));
  return { x, y, lift: Math.sin(Math.PI * u) * .55 + Math.max(0, .12 - (t - a.t)) * 1.5 };
}

window.render = t => {
  t = clamp(+t || 0, 0, DUR); CAM = camAt(t);
  idT(); g.fillStyle = C.paper; g.fillRect(0, 0, W, H); camT(); g.drawImage(paper, SH0.x, SH0.y);
  // the chart's own headline (world space), fading when the camera is close
  g.globalAlpha = clamp((1.5 - CAM.z) / .5); g.font = '500 52px NR'; g.fillStyle = C.ink; g.textBaseline = 'alphabetic'; g.fillText('Last train home: every footfall of the run', PB.x, PB.y - 92);
  g.font = '400 24px NR'; g.fillStyle = C.pale; g.fillText('distance run against the clock, one dot per foot contact', PB.x, PB.y - 54); g.globalAlpha = 1;
  // axes grow with the data: x to the newest footfall (and beyond on the chime), y arrives with its unit at 1.6 s
  const xNow = Math.min(xMax(t), Math.max(.6, t + .2)), xEnd = t > EV.chime ? xMax(t) : xNow;
  pencilLine(PB.x, PB.y + PB.h, X(xEnd, t), PB.y + PB.h, C.ink, 1, 2.2, 3);
  for (let s = 0; s <= Math.floor(Math.min(xEnd, 84)); s++) { const sec = 40 + s, big = s % 10 === 0 || t < EV.chime, tx = X(s, t); if (xMax(t) > 11 && s % 10 && s !== 8) continue;
    const kk = t > EV.chime ? 1 : seg(t, s - .2, s); if (kk <= 0) continue; g.strokeStyle = C.ink; g.lineWidth = 1.4; g.beginPath(); g.moveTo(tx, PB.y + PB.h); g.lineTo(tx, PB.y + PB.h + (big ? 12 : 7)); g.stroke();
    const S = 23 * 3600 + 58 * 60 + 40 + s, lab = [Math.floor(S / 3600) % 24, Math.floor(S / 60) % 60, S % 60].map(v => String(v).padStart(2, '0')).join(':');
    g.globalAlpha = kk; mono(lab, tx, PB.y + PB.h + 30, s === 8 && t >= 8.4 && t < EV.chime + .1 ? 20 : 15, s === 8 && t >= 8.4 ? C.ink : C.pale, 'center'); g.globalAlpha = 1; }
  // the 23:58:48 tick lands at 8.4 s (the station clock's second)
  if (t >= 8.4 && t < EV.chime + .2) { const tx = X(8.4, t), k = seg(t, 8.4, 8.5); g.save(); g.globalAlpha = 1 - seg(t, EV.chime, EV.chime + .2); g.fillStyle = C.blue; g.beginPath(); g.arc(tx, PB.y + PB.h, 7 * back(k, 2), 0, TAU); g.fill(); g.restore(); }
  { const k = seg(t, 1.55, 1.95); if (k > 0) { pencilLine(PB.x, PB.y + PB.h, PB.x, lerp(PB.y + PB.h, PB.y, eo(k)), C.ink, 1, 2.2, 5);
      for (let d = 10; d <= 40; d += 10) { const yy = Y(d); if (yy < lerp(PB.y + PB.h, PB.y, eo(k))) continue; g.strokeStyle = C.grid; g.lineWidth = 1; g.setLineDash([3, 6]); g.beginPath(); g.moveTo(PB.x, yy); g.lineTo(PB.x + PB.w, yy); g.stroke(); g.setLineDash([]); mono(`${d}`, PB.x - 16, yy, 16, C.pale, 'right'); }
      g.globalAlpha = seg(t, 1.8, 2.1); mono('metres run', PB.x - 16, PB.y - 22, 16, C.ink, 'left'); g.globalAlpha = 1; } }
  // the ruler line through the run (4.06 m every second), drawn in pencil at 3.2 s
  { const k = seg(t, 3.1, 3.4); if (k > 0) { const a = DATA[0], s1 = Math.min(t, 9.9); g.globalAlpha = .55; pencilLine(X(a.t, t), Y(a.d), X(lerp(a.t, s1, k), t), Y(a.d + SPEED * (lerp(a.t, s1, k) - a.t)), C.blue, 1, 1.2, 9); g.globalAlpha = 1; } }
  // the empty next cell: a dashed slot from the newest footfall to midnight (nobody knows these 71 s yet)
  if (t > EV.chime + .2) { const k = seg(t, EV.chime + .2, EV.chime + .28), x0 = X(9.6, t) + 10, x1 = X(T_MID, t); g.save(); g.strokeStyle = C.red; g.lineWidth = 1.6; g.setLineDash([8, 7]); g.strokeRect(x0, PB.y + 30, (x1 - x0) * eo(k), PB.h - 30); g.setLineDash([]);
    g.restore(); if (k >= 1) hand('71 s, not yet run', (x0 + x1) / 2, PB.y + PB.h * .6, 52, C.red, seg(t, EV.chime + .27, EV.chime + .37), 9, 'center'); }
  // the dots: one per footfall, landing with a pop and a thin ripple; the one in the puddle wears a blue ring
  for (const d of DATA) { if (d.t > t) break; const a = t - d.t, x = X(d.t, t), y = Y(d.d), r = 6.5 * (a < .12 ? back(a / .12, 2.4) : 1);
    if (a < .35 && a > 0) { g.strokeStyle = `rgba(43,37,32,${.35 * (1 - a / .35)})`; g.lineWidth = 1; g.beginPath(); g.arc(x, y, 7 + 30 * eo(a / .35), 0, TAU); g.stroke(); }
    g.fillStyle = ramp(d.d / D_MAX); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1.3; g.stroke();
    if (d.wet) { g.strokeStyle = C.blue; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r + 5, 0, TAU); g.stroke(); } }
  // the red line at 00:00 on the chime
  if (t > EV.chime + .17) { const x = X(T_MID, t); pencilLine(x, PB.y + PB.h, x, PB.y - 10, C.red, seg(t, EV.chime + .17, EV.chime + .23), 2.4, 13); }
  // notes, pinned in data space, written on by the pencil
  let pen = null;
  for (const [i, n] of NOTES.entries()) { if (t < n.t0) continue; const [s, dd] = n.at(), mx = X(s, t), my = n.axis ? PB.y + PB.h : Y(dd), k = seg(t, n.t0, n.t1), col = n.lead === 'red' ? C.red : C.blue;
    const fade = n.s === '11:58 on her watch' ? 1 - seg(t, 9.3, 9.45) : n.axis ? 1 - seg(t, EV.chime, EV.chime + .15) : 1; if (fade <= 0) continue; g.save(); g.globalAlpha = fade;
    const nx = mx + n.off[0], ny = my + n.off[1], hw = hand(n.s, nx, ny, n.line ? 40 : 34, col, k, i + 1);
    if (!n.line) leaderRing(nx + (hw ? Math.min(hw.w * .3, 60) : 20), ny + 8, mx, my, n.axis ? 16 : 14, col, seg(t, n.t1 - .05, n.t1 + .2), i + 3);
    if (n.s === '11:58 on her watch') { const k2 = seg(t, n.t0, n.t0 + .15); g.strokeStyle = col; g.lineWidth = 1.2; g.setLineDash([4, 5]); g.beginPath(); g.moveTo(mx, my); g.lineTo(mx, lerp(my, PB.y + PB.h, k2)); g.stroke(); g.setLineDash([]); }
    g.restore(); if (t < n.t1 + .06 && hw) pen = { x: hw.tip[0], y: hw.tip[1], lift: .1, lead: n.lead }; }
  // the pencil: blue until the chime, then a wooden flip to red; it exits after the last note
  const lead = t < EV.chime + .02 ? 'blue' : 'red';
  let P = pen || pencilAt(t); if (P.note) P = { x: X(t, t), y: Y(dAt(t)), lift: .5 };
  if (t > EV.chime - .02 && t < EV.chime + .2 && !pen) P = { x: X(T_MID, t), y: PB.y + PB.h, lift: .5 * Math.sin(seg(t, EV.chime, EV.chime + .2) * Math.PI) };
  const exit = seg(t, 9.93, 10.05); const [px, py] = toS(P.x, P.y - P.lift * 22);
  idT(); if (exit < 1) pencil(px + 700 * ei2(exit), py + 500 * ei2(exit), P.lift, lead);
  // the figure caption (screen space): a hairline rule, a mono kicker for the range drawn so far, Newsreader text
  idT(); const capY = 968; g.fillStyle = 'rgba(244,238,223,.92)'; g.fillRect(0, capY - 56, W, H - capY + 56);
  g.strokeStyle = 'rgba(43,37,32,.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(96, capY - 40); g.lineTo(1824, capY - 40); g.stroke();
  const shown = DATA.filter(d => d.t <= t).length; mono(`FIG. 1 · FOOTFALLS 1–${Math.max(1, shown)} · 0.0–${Math.min(t, 9.9).toFixed(1)} S · SOURCE: THE ANIMATION RIG (data/footfalls.csv)`, 96, capY - 18, 16, C.pale);
  const CAPS = [[0, 'Every dot is one footfall, measured by the animation rig, plotted the moment it lands.'], [2.5, 'Her pace never changes: 4.06 metres every second, 174 steps a minute.'], [7.5, 'The station clock reaches 11:58:48.'], [EV.chime, 'The chime. Midnight, and the last train, are 71 seconds away.']];
  const cap = CAPS.filter(c => t >= c[0]).pop(), words = cap[1].split(' '), kw = seg(t, cap[0] + .05, cap[0] + .05 + words.length * (cap[0] >= EV.chime ? .028 : .07));
  g.font = '400 30px NR'; g.fillStyle = C.ink; g.textBaseline = 'alphabetic'; let cx = 96; words.forEach((w, i) => { if (i / words.length >= kw && kw < 1) return; g.fillText(w, cx, capY + 26); cx += g.measureText(w + ' ').width; });
};
const ei2 = k => k * k * k;
// RIGQA: the chart's data comes from the same rig (no figure drawn in this style)
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(RUN.pose(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0); window.READY = true;
