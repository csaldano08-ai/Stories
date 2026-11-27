// 045 · Copperplate Engraving — the first 10 s of "Last Train Home" as one intaglio plate that engraves itself (lemo-opuscar
// styles/engraving): swelling burin lines on cream laid paper inside a pressed plate mark, tone made only of line families
// (hatching, crossing, a third family in the darks), roman lettering cut glyph by glyph, magnification roundels with
// leaders, and colour only as a hand-laid wash after printing, reserved for time.
//   Fig. 1 · THE PUDDLE (0–2.5)   a vignette cut under the loupe: the pavement, the puddle with the café sign reflected in
//                                  it, her legs cut at each footfall (.593, .9375, 1.282 s); the splash cut as radiating lines.
//   THE RUN (2.5–7.5)             the loupe pans along a locomotion plate: AKI engraved once per footfall (15 figures, one
//                                  every 0.345 s, outline first, then hatching), true to the run rig; 6.05–7.15 the watch.
//   Fig. 2 · THE WATCH (7.5–9.4)  a roundel scribed in the margin and the loupe rides into it: the watch, 23:58; the second
//                                  hand is burnished out and re-cut at each tick (8.4, 9.4); the first wash blooms on the dial.
//   THE PLATE (9.4–10)            a log-zoom pull-out to the whole plate; on the chime (9.575) Fig. 3, the station clock, is
//                                  scribed and washed: the plate is finished.
// Fonts: the engine's roman (Bodoni Moda) and script (Pinyon Script) faces are not installed here; Cormorant Garamond (OFL)
// is served under both names (index.html). Engine: engine/{burin,plate,wash}.js unchanged, engine/index.js one marked edit.
// Page contract: window.render(t), DUR, READY, RIGQA.
import { B, engraveShape, Wash, drawSheet, engraveText, writeScript, roundelFrame, leader } from './engine/index.js';
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

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
await document.fonts.load('600 40px "Bodoni Moda"'); await document.fonts.load('italic 500 40px "Bodoni Moda"'); await document.fonts.load('400 40px "Pinyon Script"');
const LIGHT = [-.6, -.7];
const ink = new B.Ink();
const wash = new Wash({ scale: 1.4 });

// ───────── AKI engraved: each part an SVG path placed by the rig (outline, then hatching), one figure per footfall
// the engine's SVG parser has no arc command: parts are given as polygons (local points), placed here and passed as { polys }
const cap = (L, w0, w1, n = 10) => { const P = []; for (let i = 0; i <= n; i++) { const a = Math.PI + i / n * Math.PI; P.push([Math.cos(a) * w0, Math.sin(a) * w0]); } for (let i = 0; i <= n; i++) { const a = i / n * Math.PI; P.push([Math.cos(a) * w1, L + Math.sin(a) * w1]); } return P; };
const polyD = pts => pts;
const bone = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2;
const boneUp = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;
const J0 = solveProfile(RUN.pose(3)), dWP = Math.hypot(J0.pelvis[0] - J0.waist[0], J0.pelvis[1] - J0.waist[1]), dWN = Math.hypot(J0.neckBase[0] - J0.waist[0], J0.neckBase[1] - J0.waist[1]);
const FIGS = [];
function engraveFigure(id, tq, M, k, t0, t1) {
  const J = solveProfile(poseAt(tq)), W = p => M(p);
  const at = (p, a) => { const q = W(p); return B.xf(q[0], q[1], k, a); };
  const SEED = [...String(id)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 9973, 7);   // a numeric seed from the figure id
  const sp = Math.max(1.6, 3.2 * k / .3), wMax = Math.max(.7, 1.3 * k / .3), oW = Math.max(.9, 1.6 * k / .3), g = `f${id}`;
  const part = (pts, xfm, n, style = 'hatch', angle = -.6) => engraveShape(B.ring(pts.map(p => xfm(p))), { light: LIGHT, spacing: sp, wMax, outlineW: oW, style, angle, ink, g: `${g}${n}`, seed: SEED + n.length });
  const parts = [];
  const leg = (kk, n) => { const l = J.leg[kk]; parts.push(part(cap(150, 24, 18), at(l.hip, bone(l.hip, l.knee)), n + 't'), part(cap(144, 18, 13), at(l.knee, bone(l.knee, l.ankle)), n + 's'), part(polyD([[-15, -34], [15, -34], [18, -8], [44, -2], [70, 6], [72, 16], [22, 18], [-24, 16], [-28, 0]]), at(l.ankle, l.pitch), n + 'b', 'hatch', .4)); };
  const arm = (kk, n) => { const a = J.arm[kk]; parts.push(part(cap(108, 16, 13), at(a.sh, bone(a.sh, a.el)), n + 'u'), part(cap(92, 13, 11), at(a.el, bone(a.el, a.wr)), n + 'f'), part(polyD([[-9, -2], [10, -2], [13, 18], [7, 32], [-4, 34], [-12, 20]]), at(a.wr, bone(a.el, a.wr)), n + 'h', 'contour')); };
  arm('f', 'af'); leg('f', 'lf');
  parts.push(part(polyD([[-34, 0], [30, 0], [40, dWP], [52, dWP + 94], [12, dWP + 106], [-30, dWP + 108], [-70, dWP + 90], [-46, dWP]]), at(J.waist, bone(J.waist, J.pelvis)), 'cl', 'hatch', .2));
  leg('n', 'ln');
  parts.push(part(polyD([[-36, 6], [34, 6], [40, -dWN * .5], [30, -dWN + 8], [10, -dWN - 6], [-26, -dWN - 4], [-42, -dWN * .5]]), at(J.waist, boneUp(J.waist, J.neckBase)), 'cu', 'hatch', .2));
  const hd = at(J.headC, J.headA);
  parts.push(part(polyD([[16, -44], [34, -20], [44, -3], [37, 8], [39, 16], [34, 23], [32, 35], [12, 46], [-10, 48], [-36, 38], [-50, 8], [-46, -26], [-22, -48]]), hd, 'hd', 'hatch', -.9));
  parts.push(part(polyD([[22, -44], [0, -58], [-34, -52], [-56, -22], [-58, 12], [-44, 38], [-22, 42], [-10, 18], [-2, -14], [8, -32]]), hd, 'hr', 'hatch', 1.2));
  arm('n', 'an');
  const ol = parts.flatMap(p => [`${g}${p.__n || ''}`]);
  const groups = n => ink.groups().filter(x => x.startsWith(g) && x.endsWith(n));
  ink.schedule(groups('ol'), t0, t0 + (t1 - t0) * .45, { conc: 3 });
  ink.schedule(groups('h1'), t0 + (t1 - t0) * .3, t0 + (t1 - t0) * .8, { conc: 30 });
  ink.schedule([...groups('h2'), ...groups('h3')], t0 + (t1 - t0) * .6, t1, { conc: 30 });
  FIGS.push({ id, J, tq });
  return J;
}

// ───────── the plate
const PLATE = [70, 44, 1850, 1036];
const ROW = { y: 720, x0: 300, k: .17 };                                 // the locomotion row (true scale along the run)
const C2 = RUN.contacts.filter(c => c.t0 > 2.5 && c.t0 < 7.6);
const rowM = p => [ROW.x0 + (p[0] - C2[0].x) * ROW.k, ROW.y + p[1] * ROW.k];
const VIG = { x: 520, y: 380, k: .32 };                                   // Fig. 1 vignette (the puddle), upper left
const vigM = p => [VIG.x + (p[0] - SPL.x) * VIG.k, VIG.y + p[1] * VIG.k];
const R2 = { x: 1560, y: 300, r: 190 };                                   // Fig. 2 roundel (the watch)
const R3 = { x: 1690, y: 850, r: 130 };                                   // Fig. 3 roundel (the station clock)
const AH = -Math.PI / 2 + (11 + 58 / 60) / 12 * TAU, AM = -Math.PI / 2 + 58 / 60 * TAU;
let dialShape = null, clockShape = null;
function buildPlate() {
  // Fig. 1: pavement and puddle, then the legs at each footfall near the puddle, the splash as radiating cuts
  ink.group('pave'); for (let i = 0; i < 14; i++) { const y = VIG.y + 8 + i * 6; B.stroke(ink, [[VIG.x - 300 + i * 6, y], [VIG.x + 320 - i * 4, y + 1]], .5 + i * .06); }
  const pud = B.shape(`M${VIG.x - 170} ${VIG.y + 30} C${VIG.x - 120} ${VIG.y + 12} ${VIG.x + 160} ${VIG.y + 12} ${VIG.x + 190} ${VIG.y + 30} C${VIG.x + 150} ${VIG.y + 52} ${VIG.x - 140} ${VIG.y + 52} ${VIG.x - 170} ${VIG.y + 30} Z`);
  ink.group('pudol'); for (const p of pud.polys) B.outline(ink, p, { w: 1.4, light: LIGHT });
  ink.group('pudh'); B.hatch(ink, pud.polys, { angle: 0, spacing: 3.2, tone: B.linTone(VIG.x - 170, 0, VIG.x + 190, 0, .7, .3), thr: .12, wMax: 1.1 });
  ink.schedule('pave', 0, .5, { conc: 6 }); ink.schedule('pudol', .1, .5, { conc: 2 }); ink.schedule('pudh', .3, .9, { conc: 20 });
  for (const c of RUN.contacts.filter(c => c.t0 > .4 && c.t0 < 1.5)) engraveFigure('v' + c.t0.toFixed(2), c.t0, vigM, VIG.k, c.t0 - .3, c.t0 + .02);
  ink.group('spl'); { const R = mulberry(4), fx = vigM([SPL.x, 0])[0] + 10; for (let i = 0; i < 22; i++) { const a = Math.PI + .2 + R() * (Math.PI - .4), r0 = 10 + R() * 8, r1 = r0 + 26 + R() * 40; B.stroke(ink, [[fx + Math.cos(a) * r0, VIG.y + Math.sin(a) * r0], [fx + Math.cos(a) * r1, VIG.y + Math.sin(a) * r1]], .9 + R() * .5); } }
  ink.schedule('spl', EV.splash, EV.splash + .25, { conc: 22 });
  // the locomotion row: one figure per footfall, cut as she lands
  for (const c of C2) engraveFigure('r' + c.t0.toFixed(2), c.t0, rowM, ROW.k, c.t0 - .3, c.t0 + .01);
  ink.group('ground'); B.stroke(ink, [[ROW.x0 - 120, ROW.y + 1], [1500, ROW.y + 2]], 1.3); ink.schedule('ground', 2.5, 3.2, { conc: 1 });
  // Fig. 2: the watch inside its roundel (dial, ticks, hands; the second hand is its own group, burnished and re-cut)
  dialShape = B.ellipse(R2.x, R2.y, 120, 120);
  const strap = B.shape(`M${R2.x - 60} ${R2.y - 180} L${R2.x + 60} ${R2.y - 180} L${R2.x + 60} ${R2.y + 180} L${R2.x - 60} ${R2.y + 180} Z`);
  ink.group('w_strap_ol'); for (const p of strap.polys) B.outline(ink, p, { w: 1.6, light: LIGHT, excl: dialShape.polys });
  ink.group('w_strap_h'); B.hatch(ink, strap.polys, { angle: 0, spacing: 3.4, tone: () => .6, thr: .1, wMax: 1.2, excl: dialShape.polys });
  ink.group('w_case'); for (const p of dialShape.polys) B.outline(ink, p, { w: 2.6, light: LIGHT }); B.outline(ink, B.ellipsePts(R2.x, R2.y, 108, 108), { w: 1.2, light: LIGHT });
  ink.group('w_ticks'); for (let k = 0; k < 12; k++) { const a = -Math.PI / 2 + k / 12 * TAU, r0 = k % 3 ? 88 : 76; B.stroke(ink, [[R2.x + Math.cos(a) * r0, R2.y + Math.sin(a) * r0], [R2.x + Math.cos(a) * 102, R2.y + Math.sin(a) * 102]], k % 3 ? 1.2 : 2.2); }
  ink.group('w_hands'); B.stroke(ink, [[R2.x, R2.y], [R2.x + Math.cos(AH) * 56, R2.y + Math.sin(AH) * 56]], 4.2); B.stroke(ink, [[R2.x, R2.y], [R2.x + Math.cos(AM) * 88, R2.y + Math.sin(AM) * 88]], 3);
  for (const s of [47, 48, 49]) { ink.group('w_sec' + s); const a = -Math.PI / 2 + s / 60 * TAU; B.stroke(ink, [[R2.x - Math.cos(a) * 18, R2.y - Math.sin(a) * 18], [R2.x + Math.cos(a) * 98, R2.y + Math.sin(a) * 98]], 1.1); }
  ink.schedule('w_strap_ol', 7.55, 7.8, { conc: 2 }); ink.schedule('w_strap_h', 7.7, 8.2, { conc: 24 }); ink.schedule('w_case', 7.6, 7.9, { conc: 2 }); ink.schedule('w_ticks', 7.85, 8.05, { conc: 12 }); ink.schedule('w_hands', 8.0, 8.15, { conc: 2 });
  ink.schedule('w_sec47', 8.1, 8.2, { conc: 1 }); ink.schedule('w_sec48', 8.42, 8.48, { conc: 1 }); ink.schedule('w_sec49', 9.42, 9.48, { conc: 1 });
  // Fig. 3: the station clock (tower, face, hands), cut fast as the plate is pulled back
  clockShape = B.ellipse(R3.x, R3.y, 60, 60);
  const tower = B.shape(`M${R3.x - 80} ${R3.y + 150} L${R3.x - 80} ${R3.y - 70} L${R3.x} ${R3.y - 140} L${R3.x + 80} ${R3.y - 70} L${R3.x + 80} ${R3.y + 150} Z`);
  ink.group('c_tw_ol'); for (const p of tower.polys) B.outline(ink, p, { w: 1.6, light: LIGHT, excl: clockShape.polys });
  ink.group('c_tw_h'); B.engraveTone(ink, tower.polys, { angle: -.6, spacing: 3, tone: B.formTone(tower.polys, { light: LIGHT }), wMax: 1.1, excl: clockShape.polys });
  ink.group('c_face'); for (const p of clockShape.polys) B.outline(ink, p, { w: 2, light: LIGHT }); for (let k = 0; k < 12; k++) { const a = -Math.PI / 2 + k / 12 * TAU; B.stroke(ink, [[R3.x + Math.cos(a) * 46, R3.y + Math.sin(a) * 46], [R3.x + Math.cos(a) * 54, R3.y + Math.sin(a) * 54]], 1.1); }
  B.stroke(ink, [[R3.x, R3.y], [R3.x + Math.cos(AH) * 28, R3.y + Math.sin(AH) * 28]], 2.6); B.stroke(ink, [[R3.x, R3.y], [R3.x + Math.cos(AM) * 44, R3.y + Math.sin(AM) * 44]], 1.8);
  ink.schedule('c_tw_ol', 9.4, 9.52, { conc: 2 }); ink.schedule(ink.groups().filter(g => g.startsWith('c_tw_h')), 9.45, 9.62, { conc: 40 }); ink.schedule('c_face', 9.52, 9.6, { conc: 6 });
  ink.build();
  // the washes: the watch dial (amber, the first colour), then the station clock face on the chime
  wash.add({ path: dialShape.path, polys: dialShape.polys, color: '#c98a2a', origin: [R2.x - 60, R2.y - 50], t0: 8.25, dur: 1.0, alpha: .78 });
  wash.add({ path: clockShape.path, polys: clockShape.polys, color: '#c98a2a', origin: [R3.x, R3.y], t0: EV.chime, dur: .35, alpha: .8 });
}

// ───────── camera: a loupe over the sheet
function camAt(t) {
  if (t < 2.5) return [VIG.x + 20 + 8 * t, VIG.y - 40, 2.6];
  const xr = c => rowM([X(c), 0])[0];
  if (t < 7.5) { const u = ss(seg(t, 2.5, 2.9)); return [lerp(VIG.x + 40, Math.max(560, xr(t) + 60), u), lerp(VIG.y - 40, ROW.y - 90, u), lerp(2.6, 2.3, u)]; }
  if (t < 9.375) { const u = eo(seg(t, 7.5, 7.95)), a = [Math.max(560, xr(7.5) + 60), ROW.y - 90, 2.3]; return [lerp(a[0], R2.x, u), lerp(a[1], R2.y, u), Math.exp(lerp(Math.log(2.3), Math.log(2.7), u)) * (1 + .02 * (t - 7.5))]; }
  const u = eo(seg(t, 9.375, 9.9)); return [lerp(R2.x, 960, u), lerp(R2.y, 540, u), Math.exp(lerp(Math.log(2.75), 0, u))];
}
function render(t) {
  const [cx, cy, z] = camAt(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#efe6cf'; ctx.fillRect(0, 0, 1920, 1080);
  ctx.setTransform(z, 0, 0, z, 960 - cx * z, 540 - cy * z);
  drawSheet(ctx, { plate: PLATE });
  wash.draw(ctx, t);
  // burnished out: an old second hand disappears just before the new one is cut
  const hide = [];
  if (t >= 8.42) hide.push('w_sec47'); if (t >= 9.42) hide.push('w_sec48');
  for (const gname of hide) for (const s of ink.S) if (s.g === gname) { s.s0 = 1e9; s.s1 = 1e9 + 1; }
  if (hide.length) ink.built = false;
  ink.draw(ctx, t);
  for (const gname of ['w_sec47', 'w_sec48']) { const tt = gname === 'w_sec47' ? [8.1, 8.2] : [8.42, 8.48]; if (!hide.includes(gname)) for (const s of ink.S) if (s.g === gname && s.s0 > 1e8) { s.s0 = tt[0]; s.s1 = tt[1]; ink.built = false; } }
  // roundels, leaders and lettering (cut glyph by glyph)
  roundelFrame(ctx, R2.x, R2.y, R2.r, { p: seg(t, 7.3, 7.7), w: 2.4 });
  leader(ctx, rowM([X(6.8), -330])[0] > 0 ? rowM([X(6.8), -300]) : [1400, 600], [R2.x - R2.r * .8, R2.y + R2.r * .6], { p: seg(t, 7.2, 7.5), num: '2', numP: seg(t, 7.4, 7.6) });
  roundelFrame(ctx, R3.x, R3.y, R3.r, { p: seg(t, EV.chime - .15, EV.chime + .05), w: 2.4 });
  engraveText(ctx, 'THE LAST TRAIN.', 960, 116, { size: 46, weight: 600, track: .16, p: seg(t, .2, 1.4) });
  engraveText(ctx, 'a runner at twenty-three fifty-eight', 960, 152, { size: 22, italic: true, weight: 500, p: seg(t, 1.0, 2.0) });
  engraveText(ctx, 'Fig. 1.', VIG.x - 280, VIG.y - 150, { size: 20, italic: true, align: 'left', p: seg(t, 1.2, 1.6) });
  engraveText(ctx, 'Fig. 2.', R2.x, R2.y + R2.r + 34, { size: 20, italic: true, p: seg(t, 7.7, 8.0) });
  engraveText(ctx, 'Fig. 3.', R3.x, R3.y + R3.r + 34, { size: 20, italic: true, p: seg(t, EV.chime, EV.chime + .2) });
  engraveText(ctx, 'THE RUN, ONE FIGURE AT EACH FOOTFALL', ROW.x0 + 560, ROW.y + 70, { size: 17, weight: 600, track: .14, p: seg(t, 3.2, 4.2) });
  writeScript(ctx, 'the last minutes of the day', 960, 990, { size: 30, p: seg(t, .6, 2.2) });
}

buildPlate();
window.render = render;
window.DUR = DUR;
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
render(0);
window.READY = true;
