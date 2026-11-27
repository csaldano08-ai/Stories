// 082 · Oscilloscope Math — the first 10 s of "Last Train Home" drawn by an electron beam on a phosphor screen (lemo-opuscar styles/oscilloscope-math).
// The maths is real and comes from the shared rig. The screen is a side view in metres (x along the street, y up), so the traces the beam
// leaves are the true paths of her joints through space: both ankles (cycloid-like loops that touch y = 0 at every footfall), the pelvis
// (a wave at her stride frequency), the wrist. Her figure is drawn by the beam from the rig at the writing point, with afterglow ghosts.
// Every readout is computed from the same numbers: f from the rig's contact times, L from contact spacing, v = f·L; positions at the
// cursors; θ of the second hand. Beam green is the signal; amber is the second channel (cursors and measured values) only.
//   S1  follow the writing point, close on the feet: the ground axis; at 0.94 s the far foot lands at the puddle: the water line rings as
//       a damped travelling ripple, an amber cursor measures t and x of the contact
//   S2  pull back over the whole stride: pelvis wave and foot loops, v = f · L live; at 6.05 s the wrist trace jumps: a cursor marks it
//   S3  STOP freezes the run and the camera dives ×50 into the wrist: the watch, its second hand a phasor stepping 47 → 48 at 8.4 s
//   S4  RUN: pull back over the whole 40 m of traces with every event marked; the chime (9.58 s) rings as a damped wave
// Page contract: window.render(t), DUR, READY, RIGQA.
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash, mulberry } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080, TAU = Math.PI * 2, out = document.getElementById('c').getContext('2d');
await Promise.all(['400 40px STIX', 'italic 400 40px STIX', '500 20px JBMono'].map(f => document.fonts.load(f, 'AB09θπ')));
const BEAM = [77, 255, 136], TEXT = [141, 255, 176], HOT = [230, 255, 236], AMBER = [255, 181, 71];
const col = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

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
const W_T = t => 11 * 3600 + 58 * 60 + 48 + (t - 8.4), M = .0028, X0 = X(0);
const toM = p => [(p[0] - X0) * M, -p[1] * M];
// sampled paths of the joints (240 Hz), the measured quantities
const DT = 1 / 240, T0 = -.25, NS = Math.ceil((10.2 - T0) / DT), PATH = { an: [], af: [], pel: [], wr: [], head: [] };
for (let i = 0; i < NS; i++) { const t = T0 + i * DT, J = solveProfile(poseAt(t)), a = J.arm.n;
  PATH.an.push(toM(J.leg.n.ankle)); PATH.af.push(toM(J.leg.f.ankle)); PATH.pel.push(toM(J.pelvis)); PATH.wr.push(toM([a.el[0] + (a.wr[0] - a.el[0]) * .84, a.el[1] + (a.wr[1] - a.el[1]) * .84])); PATH.head.push(toM(J.headC)); }
const CON = RUN.contacts.filter(c => c.t0 > 0 && c.t0 < 10), F_HZ = (CON.length - 1) / (CON[CON.length - 1].t0 - CON[0].t0), L_M = (CON[CON.length - 1].x - CON[0].x) * M / (CON.length - 1), V_MS = F_HZ * L_M;
const SX = (SPL.x + 44 - X0) * M, idx = t => clamp(Math.round((t - T0) / DT), 0, NS - 1);
const herX = t => (X(t) - X0) * M;

// ═════════ the camera: centre (m) and zoom (px per m), logarithmic; STOP at 7.5 s, RUN at 9.375 s
const STOP0 = 7.5, RUN1 = 9.375, runT = t => t < STOP0 ? t : t < RUN1 ? STOP0 : STOP0 + (t - RUN1) * ((10 - STOP0) / (10 - RUN1));   // the run's own clock: frozen, then it catches up
const K = (x, y, z) => ({ x, y, z }), mixK = (a, b, u) => K(lerp(a.x, b.x, u), lerp(a.y, b.y, u), Math.exp(lerp(Math.log(a.z), Math.log(b.z), u)));
const WR75 = PATH.wr[idx(STOP0)];
const C1 = t => K(herX(t) + .65, .74, 390), C2 = t => K(herX(t) + 1.0, .95, 230), C3 = t => K(WR75[0], WR75[1], lerp(11500, 12500, seg(t, 8, 9.375))), C4 = t => K(20.2, 2.0, lerp(46, 44, seg(t, 9.7, 10)));
function camAt(t) {
  if (t < 2.5) return C1(t); if (t < 7.5) return mixK(C1(2.5), C2(t), eio(seg(t, 2.5, 3.5)));
  if (t < 9.375) { const a = C2(7.5), b = C3(t), u = eio(seg(t, 7.5, 8.05)), z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), u)), f = (1 / z - 1 / a.z) / (1 / b.z - 1 / a.z);   // fly to the point: it stays put on screen
    return K(lerp(a.x, b.x, f), lerp(a.y, b.y, f), z); }
  const a = C3(9.375), b = C4(t), u = eio(seg(t, 9.375, 9.72)), z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), u)), f = (1 / z - 1 / a.z) / (1 / b.z - 1 / a.z); return K(lerp(a.x, b.x, f), lerp(a.y, b.y, f), z);
}

// ═════════ light channels → phosphor (bloom by blurred, down-scaled copies added back)
const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const [CB, gb] = mk(), [CT, gt] = mk(), [CA, ga] = mk(), [B2, b2] = mk(W / 2, H / 2), [B4, b4] = mk(W / 4, H / 4), [B8, b8] = mk(W / 8, H / 8), [B16, b16] = mk(W / 16, H / 16);
function bloom(src, k) { for (const [c, g_, s, bl] of [[B2, b2, 2, 2], [B4, b4, 4, 3], [B8, b8, 8, 4], [B16, b16, 16, 5]]) { g_.clearRect(0, 0, c.width, c.height); g_.filter = `blur(${bl}px)`; g_.drawImage(src, 0, 0, c.width, c.height); g_.filter = 'none';
  out.globalAlpha = k * [.55, .5, .45, .4][Math.log2(s) - 1]; out.drawImage(c, 0, 0, W, H); } out.globalAlpha = 1; }

// ═════════ drawing helpers in world space
let CAM = K(0, 0, 1); const sx = x => W / 2 + (x - CAM.x) * CAM.z, sy = y => H / 2 - (y - CAM.y) * CAM.z;
function trace(g, P, i0, i1, c, w, fade) {   // a path from sample i0 to i1; steep (fast) segments dimmer; older parts fade with age
  g.lineCap = 'round'; g.lineWidth = w;
  for (let i = Math.max(1, i0); i <= i1; i++) { const a = P[i - 1], b = P[i], dx = (b[0] - a[0]) * CAM.z, dy = (b[1] - a[1]) * CAM.z, L = Math.hypot(dx, dy); if (L < .01) continue;
    const steep = Math.abs(dy) / L, age = (i1 - i) * DT, al = (1 - .42 * steep) * (fade ? Math.pow(clamp(1 - age / fade), 1.6) : 1); if (al < .02) continue;
    g.strokeStyle = col(c, al); g.beginPath(); g.moveTo(sx(a[0]), sy(a[1])); g.lineTo(sx(b[0]), sy(b[1])); g.stroke(); } }
function figure(g, t, a, wcol) {   // her figure, drawn by the beam from the rig at the writing point
  const J = solveProfile(poseAt(t)), P = p => { const m = toM(p); return [sx(m[0]), sy(m[1])]; };
  g.strokeStyle = col(wcol, a); g.lineWidth = 2.2; g.lineCap = 'round'; g.lineJoin = 'round';
  const pl = pts => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...P(p)) : g.moveTo(...P(p))); g.stroke(); };
  for (const k of ['f', 'n']) { const l = J.leg[k], A = J.arm[k], c = Math.cos(l.pitch), s = Math.sin(l.pitch); pl([l.hip, l.knee, l.ankle, [l.ankle[0] + 66 * c, l.ankle[1] + 66 * s]]); pl([A.sh, A.el, A.wr]); }
  pl([J.pelvis, J.waist, J.neckBase, J.neckTop]); const hc = P(J.headC); g.beginPath(); g.arc(hc[0], hc[1], 46 * M * CAM.z, 0, TAU); g.stroke();
  return J;
}
function text(g, s, x, y, size, c, o = {}) { g.font = `${o.it ? 'italic ' : ''}${o.f === 'm' ? 500 : 400} ${size}px ${o.f === 'm' ? 'JBMono' : 'STIX'}`; g.fillStyle = col(c, o.a ?? 1); g.textAlign = o.al || 'left'; g.textBaseline = 'alphabetic'; g.fillText(s, x, y); return g.measureText(s).width; }
// a formula set in TeX manner: italic variables, upright numbers and units; [string, italic?] runs
function formula(g, runs, x, y, size, a, flashIdx = -1, flash = 0) { let xx = x; runs.forEach(([s, it], i) => { const c = i === flashIdx && flash > 0 ? HOT : TEXT; xx += text(g, s, xx, y, size, c, { it, a }) + size * .12; }); }

function frame(t) {
  const rt = runT(t); CAM = camAt(t);
  for (const g of [gb, gt, ga]) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); }
  // the graticule: dotted minor lines, a solid centre axis with 0.2-division ticks; levels of 5 refine as the camera zooms
  const target = 120 / CAM.z, lv = Math.log(target) / Math.log(5), l0 = Math.floor(lv), frac = lv - l0, div = Math.pow(5, l0), fine = div / 5;
  for (const [d, a] of [[div, .55], [fine, .55 * (1 - frac)]]) { if (d * CAM.z < 10) continue; gt.fillStyle = col(TEXT, a * .35);
    const x0 = Math.floor((CAM.x - W / 2 / CAM.z) / d) * d, y0 = Math.floor((CAM.y - H / 2 / CAM.z) / d) * d;
    for (let x = x0; x < CAM.x + W / 2 / CAM.z; x += d) for (let py = 0; py < H; py += 6) gt.fillRect(sx(x), py, 1.2, 1.2);
    for (let y = y0; y < CAM.y + H / 2 / CAM.z; y += d) for (let px = 0; px < W; px += 6) gt.fillRect(px, sy(y), 1.2, 1.2); }
  // the ground axis y = 0 (solid), with 0.2-division ticks; around the splash it is the water line, ringing
  { const g = gb, a0 = t - SPL.t0; g.strokeStyle = col(TEXT, .55); g.lineWidth = 1.5; g.beginPath();
    const xa = CAM.x - W / 2 / CAM.z, xb = CAM.x + W / 2 / CAM.z, n = 900;
    for (let i = 0; i <= n; i++) { const x = lerp(xa, xb, i / n), r = Math.abs(x - SX); let y = 0;
      if (a0 > 0 && r < 1.6) y = .055 * Math.exp(-a0 / .7) * Math.exp(-r / .55) * Math.cos(TAU * (r - .55 * a0) / .14) * clamp((.55 * a0 + .05 - r) * 20);   // a damped travelling ripple
      i ? g.lineTo(sx(x), sy(y)) : g.moveTo(sx(x), sy(y)); }
    g.stroke(); gt.fillStyle = col(TEXT, .45); for (let x = Math.ceil(xa / (div / 5)) * (div / 5); x < xb; x += div / 5) gt.fillRect(sx(x) - .6, sy(0) - 4, 1.2, 8); }
  // the traces: where her joints have been (the run's clock: frozen during STOP)
  const i1 = idx(rt), fadeAge = t >= RUN1 ? 0 : 2.2, allWide = t >= RUN1, dive = clamp(1 - (Math.log(CAM.z) - Math.log(600)) / (Math.log(3000) - Math.log(600)), .0, 1);
  gb.globalAlpha = dive > 0 ? Math.max(dive, 0) : 0;
  trace(gb, PATH.af, idx(-.2), i1, BEAM, 2.0, fadeAge ? fadeAge : 0); trace(gb, PATH.an, idx(-.2), i1, BEAM, 2.4, fadeAge ? fadeAge : 0);
  trace(gb, PATH.pel, idx(-.2), i1, TEXT, 1.6, fadeAge ? fadeAge * 1.4 : 0); trace(gb, PATH.wr, idx(-.2), i1, TEXT, 1.3, fadeAge ? fadeAge : 0);
  // her figure at the writing point, with afterglow ghosts (earlier instants, fading by a power curve)
  if (t < 9.5 || true) { const fa = t < STOP0 ? 1 : t < RUN1 ? .55 : 1;
    for (let k = 9; k >= 1; k--) figure(gb, rt - k * .009 * (t < STOP0 || t >= RUN1 ? 1 : 0), fa * .5 * Math.pow(1 - k / 10, 2.2), BEAM);
    const J = figure(gb, rt, fa, BEAM); const wn = PATH.an[i1], wf = PATH.af[i1]; for (const p of [wn, wf, PATH.pel[i1]]) { ga.fillStyle = col(HOT, .9); }
    gb.fillStyle = col(HOT, 1); for (const p of [PATH.an[i1], PATH.af[i1], PATH.pel[i1], PATH.wr[i1]]) { gb.beginPath(); gb.arc(sx(p[0]), sy(p[1]), 3.2, 0, TAU); gb.fill(); } }
  gb.globalAlpha = 1;
  // amber channel: cursors and measured values
  const cursor = (x, label, val, t0, yl = 0) => { if (t < t0) return; const a = clamp((t - t0) / .15); ga.strokeStyle = col(AMBER, .8 * a); ga.lineWidth = 1.4; ga.setLineDash([8, 6]); ga.beginPath(); ga.moveTo(sx(x), 0); ga.lineTo(sx(x), H); ga.stroke(); ga.setLineDash([]);
    if (sx(x) < 10 || sx(x) > W - 10) return; const px = Math.min(W - 330, sx(x) + 14); text(ga, label, px, 320 + yl, 22, AMBER, { f: 'm', a }); text(ga, val, px, 350 + yl, 22, AMBER, { f: 'm', a }); };
  if (t < STOP0 || t >= RUN1) { cursor(SX, 'CONTACT  t = 0.94 s', `x = ${SX.toFixed(2)} m   y = 0`, SPL.t0);
    const wi = idx(EV.watchUp); cursor(PATH.wr[wi][0], 'WRIST UP  t = 6.05 s', `y = ${PATH.wr[idx(EV.watchUp + .2)][1].toFixed(2)} m`, EV.watchUp, 70);
    if (t >= EV.chime) cursor(herX(rt), 'CHIME  t = 9.58 s', '11:58:49', EV.chime, 140); }
  // S3: inside the watch: a circle of 18 mm, its second hand a phasor stepping once a second
  if (t >= STOP0 && t < RUN1 + .3) { const wa = clamp((t - 7.7) / .3) * (1 - clamp((t - RUN1) / .25)), c = WR75, R = .018, s = Math.floor(W_T(t) + 1e-6) % 60, step = t - (Math.floor(t - .4) + .4), flash = step < .12 ? 1 - step / .12 : 0;
    const g = gb; g.strokeStyle = col(BEAM, wa); g.lineWidth = 2.4; g.beginPath(); g.arc(sx(c[0]), sy(c[1]), R * CAM.z, 0, TAU); g.stroke();
    for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, r0 = R * (i % 5 ? .9 : .82); g.lineWidth = i % 5 ? 1.4 : 2.4; g.beginPath(); g.moveTo(sx(c[0] + Math.sin(a) * r0), sy(c[1] + Math.cos(a) * r0)); g.lineTo(sx(c[0] + Math.sin(a) * R * .97), sy(c[1] + Math.cos(a) * R * .97)); g.stroke(); }
    const th = s / 60 * TAU, mn = (58 + (W_T(t) % 60) / 60) / 60 * TAU, hr = (11 + (58 + (W_T(t) % 60) / 60) / 60) / 12 * TAU;
    for (const [ang, L, w, c_] of [[hr, .5, 4, TEXT], [mn, .75, 3, TEXT], [th, .86, 2.2, flash > 0 ? HOT : BEAM]]) { g.strokeStyle = col(c_, wa); g.lineWidth = w; g.beginPath(); g.moveTo(sx(c[0]), sy(c[1])); g.lineTo(sx(c[0] + Math.sin(ang) * R * L), sy(c[1] + Math.cos(ang) * R * L)); g.stroke(); }
    gb.fillStyle = col(HOT, wa); gb.beginPath(); gb.arc(sx(c[0] + Math.sin(th) * R * .86), sy(c[1] + Math.cos(th) * R * .86), 5, 0, TAU); gb.fill();
    // the angle, measured on the second channel: an arc from 12 to the hand
    ga.strokeStyle = col(AMBER, .8 * wa); ga.lineWidth = 1.6; ga.beginPath(); ga.arc(sx(c[0]), sy(c[1]), R * .4 * CAM.z, -Math.PI / 2, -Math.PI / 2 + th); ga.stroke();
    text(ga, `θ = ${(th).toFixed(3)} rad`, sx(c[0]) + R * CAM.z + 40, sy(c[1]) - 20, 26, AMBER, { f: 'm', a: wa }); text(ga, `s = ${s}`, sx(c[0]) + R * CAM.z + 40, sy(c[1]) + 18, 26, AMBER, { f: 'm', a: wa }); }
  // S4: the chime rings as a damped wave written by the beam from the chime point
  if (t >= EV.chime) { const x0 = herX(rt), a = t - EV.chime, g = gb; g.strokeStyle = col(BEAM, .95); g.lineWidth = 2; g.beginPath();
    const L = Math.min(9, a * 60); for (let i = 0; i <= 400; i++) { const d = i / 400 * L, y = 3.4 + .9 * Math.exp(-d / 3) * Math.sin(TAU * d / .6); i ? g.lineTo(sx(x0 + d), sy(y)) : g.moveTo(sx(x0 + d), sy(y)); } g.stroke(); }
  // HUD on the glass: the formula top left (values live), the instrument readouts bottom right
  { const g = gt; let a = 1;
    if (t < STOP0) { formula(g, [['v', 1], ['=', 0], ['f', 1], ['·', 0], ['L', 1]], 80, 110, 44, 1);
      text(g, `f = ${F_HZ.toFixed(2)} Hz`, 84, 160, 24, TEXT, { f: 'm' }); text(g, `L = ${L_M.toFixed(2)} m`, 84, 192, 24, TEXT, { f: 'm' }); text(g, `v = ${V_MS.toFixed(2)} m/s`, 84, 224, 24, TEXT, { f: 'm' }); }
    else if (t < RUN1) { a = clamp((t - 7.75) / .3); formula(g, [['θ', 1], ['=', 0], ['2', 0], ['π', 1], ['·', 0], ['⌊', 0], ['s', 1], ['⌋', 0], ['/', 0], ['60', 0]], 80, 110, 44, a, 6, t >= 8.4 && t < 8.55 ? 1 : 0);
      text(g, `watch  ${String(11).padStart(2, '0')}:58:${String(Math.floor(W_T(t) + 1e-6) % 60).padStart(2, '0')}`, 84, 160, 24, TEXT, { f: 'm', a }); }
    else { formula(g, [['t', 1], ['=', 0], ['0', 0], ['…', 0], ['10', 0], ['s', 0]], 80, 110, 44, 1); text(g, `x = ${herX(rt).toFixed(1)} m`, 84, 160, 24, TEXT, { f: 'm' }); }
    const xd = 120 / CAM.z, unit = v => v >= 1 ? `${v.toPrecision(2)} m` : v >= .01 ? `${(v * 100).toPrecision(2)} cm` : `${(v * 1000).toPrecision(2)} mm`;
    text(g, `x/DIV ${unit(div)}`, W - 330, H - 112, 22, TEXT, { f: 'm' }); text(g, `y/DIV ${unit(div)}`, W - 330, H - 82, 22, TEXT, { f: 'm' });
    text(g, `t ${rt.toFixed(3)} s`, W - 330, H - 52, 22, TEXT, { f: 'm' }); text(g, t >= STOP0 && t < RUN1 ? 'STOP' : 'RUN', W - 120, H - 52, 22, t >= STOP0 && t < RUN1 ? AMBER : TEXT, { f: 'm' }); }
  // composite: screen, ambient, bloom (beam strongly, text faintly), sharp layers, vignette, dither
  out.setTransform(1, 0, 0, 1, 0, 0); out.globalCompositeOperation = 'source-over'; out.fillStyle = '#010402'; out.fillRect(0, 0, W, H);
  const amb = out.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * .65); amb.addColorStop(0, 'rgba(11,36,18,.9)'); amb.addColorStop(1, 'rgba(11,36,18,0)'); out.fillStyle = amb; out.fillRect(0, 0, W, H);
  out.globalCompositeOperation = 'lighter'; bloom(CB, 1.25); bloom(CA, .8); bloom(CT, .3); out.drawImage(CB, 0, 0); out.drawImage(CA, 0, 0); out.drawImage(CT, 0, 0);
  out.globalCompositeOperation = 'source-over'; const vg = out.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.1); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)'); out.fillStyle = vg; out.fillRect(0, 0, W, H);
}
window.render = t => frame(clamp(+t || 0, 0, DUR));
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
