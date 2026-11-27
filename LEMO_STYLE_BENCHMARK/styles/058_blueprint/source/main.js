// 058 · Blueprint — the first 10 s of "Last Train Home" as one cyanotype drawing sheet that draws itself
// (lemo-opuscar styles/blueprint): white technical line work on Prussian blue, drafting order (centre lines → outlines → detail →
// hatching → dimensions → balloons → labels), a glowing nib at every line being drawn, live dimensions. A narrative adaptation:
// AKI is drawn as an anthropometric figure (limb outlines on the shared rig with dashed centre lines and joint circles), the way
// a design drawing shows the body it is made for. FIG. 1: the foot striking the puddle, in section; the splash wets the sheet
// (cyanotype and water: blooms of deeper blue). FIG. 2: the run along a ground line, every footfall marked, the stride dimensioned.
// DETAIL A (×4): the watch, its second hand stepping like an escapement. FIG. 4: the station tower; on the chime the sheet's one
// non-blue colour lands once, a red rubber stamp, and the camera starts down the tower. Cuts on downbeats (2.5, 7.5, 9.375 s).
// Engine: engine/draw.js and engine/paper.js copied unchanged. Page contract: window.render(t), DUR, READY, RIGQA.
import { W, H, g, f, ov, inkC, fxC, ovC, setCam, clear, proj, nibs, line, text, dim, balloon, hatch, knock, LW, FONT, rect, circ, S, cam, fxWet, TAU, lw } from './engine/draw.js';
import { makePaper } from './engine/paper.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash, mulberry } from './shared/lib/util.js';

window.DUR = DUR;
const comp = makePaper(document.getElementById('c'), W, H);
await Promise.all(['400 40px Architects', '400 40px B612', '700 40px B612'].map(s => document.fonts.load(s)));
const SW = 3200, SH = 2200;

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
const cap = (a, b, r0, r1, n = 10) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, o = [];
  for (let i = 0; i <= n; i++) { const t = Math.PI / 2 + i / n * Math.PI; o.push([a[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * r0, a[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * r0]); }
  for (let i = 0; i <= n; i++) { const t = -Math.PI / 2 + i / n * Math.PI; o.push([b[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * r1, b[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * r1]); }
  return o;
};
// the anthropometric figure: each part filled with paper (hidden lines removed), outlined, a dashed centre line on every bone
function figure(t, M, k, o = {}) {
  const J = solveProfile(poseAt(t)), u = o.u ?? 1, parts = [];
  const add = (pts, cl) => parts.push([pts, cl]);
  const limb = (a, b, r0, r1) => add(cap(M(a), M(b), r0 * k, r1 * k), [M(a), M(b)]);
  const legs = kk => { const l = J.leg[kk]; limb(l.hip, l.knee, 24, 18); limb(l.knee, l.ankle, 18, 13);
    const c = Math.cos(l.pitch), s = Math.sin(l.pitch), F = ([u_, v]) => M([l.ankle[0] + u_ * c - v * s, l.ankle[1] + u_ * s + v * c]);
    add([[-15, -34], [16, -34], [18, -8], [46, -2], [72, 6], [72, 16], [-24, 16], [-28, 0]].map(F), null); };
  const arms = kk => { const a = J.arm[kk], h = [a.wr[0] + (a.wr[0] - a.el[0]) * .24, a.wr[1] + (a.wr[1] - a.el[1]) * .24]; limb(a.sh, a.el, 16, 13); limb(a.el, a.wr, 13, 10); add(cap(M(a.wr), M(h), 10 * k, 6 * k), null); };
  if (!o.legsOnly) arms('f');
  legs('f');
  if (!o.legsOnly) {
    const TT = (b, uu, ff) => M([b[0] + J.uL[0] * uu + J.fL[0] * ff, b[1] + J.uL[1] * uu + J.fL[1] * ff]);
    add([TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)], [M(J.pelvis), M(J.neckBase)]);
    const hc = J.headC, HR = q => { const c = Math.cos(J.headA), s = Math.sin(J.headA); return M([hc[0] + q[0] * c - q[1] * s, hc[1] + q[0] * s + q[1] * c]); };
    add([[16, -44], [34, -20], [44, -3], [37, 8], [39, 16], [34, 23], [32, 35], [12, 46], [-10, 48], [-36, 38], [-50, 8], [-46, -26], [-22, -48], [0, -60], [-36, -56]].map(HR), null);
  } else {
    const TT = (b, uu, ff) => M([b[0] + J.uL[0] * uu + J.fL[0] * ff, b[1] + J.uL[1] * uu + J.fL[1] * ff]);
    add([TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38)], null);
  }
  legs('n'); if (!o.legsOnly) arms('n');
  parts.forEach(([pts, cl]) => { knock(pts); line(pts, { w: LW.det, closed: true, u }); if (cl) line(cl, { w: LW.hair, dash: 'center', u, nib: false }); });
  // joints: small circles at knee, ankle, elbow
  for (const kk of ['f', 'n']) { const l = J.leg[kk]; for (const p of [l.knee]) line(circ(...M(p), 7 * k / .27 * .27, 20), { w: LW.hair, closed: true, u, nib: false }); }
  return J;
}

// ═════════ the sheet furniture: border, header, title block, notes, the stamp
const stag = (P, i, n, span = .4) => clamp((P - (i / Math.max(1, n)) * (1 - span)) / span);
function border() { line(rect(46, 46, SW - 46, SH - 46), { w: LW.hair, closed: true, nib: false }); line(rect(80, 80, SW - 80, SH - 80), { w: LW.out * 1.3, closed: true, nib: false }); }
function header() {
  text('THE LAST TRAIN', 170, 250, { size: 132, font: FONT.hand, ls: 14 });
  line([[170, 290], [1340, 290]], { w: LW.out, nib: false });
  text('A STUDY OF ONE RUN THROUGH THE RAIN, FROM A PUDDLE TO THE STATION CLOCK', 172, 350, { size: 25, font: FONT.tech, ls: 2, v: .9 });
}
const TB = { x0: 2300, y0: SH - 480, x1: SW - 80, y1: SH - 80 };
function titleBlock(t) {
  line(rect(TB.x0, TB.y0, TB.x1, TB.y1), { w: LW.out, closed: true, nib: false });
  for (const y of [TB.y0 + 110, TB.y0 + 200, TB.y0 + 290]) line([[TB.x0, y], [TB.x1, y]], { w: LW.thin, nib: false });
  line([[TB.x0 + 420, TB.y0 + 110], [TB.x0 + 420, TB.y1]], { w: LW.thin, nib: false });
  text('LAST TRAIN HOME', TB.x0 + 20, TB.y0 + 80, { size: 54, font: FONT.hand, ls: 4 });
  const F = (k, v, x, y) => { text(k, x, y - 40, { size: 16, font: FONT.tech, ls: 2, v: .75 }); text(v, x, y, { size: 26, font: FONT.tech, ls: 1 }); };
  F('SHEET', '1 OF 1', TB.x0 + 20, TB.y0 + 180); F('SCALE', 'AS SHOWN', TB.x0 + 440, TB.y0 + 180);
  F('TIME', '23:58', TB.x0 + 20, TB.y0 + 270); F('DRAWN', 'LEMO STYLE LAB', TB.x0 + 440, TB.y0 + 270);
  F('STATUS', t >= EV.chime ? 'SEE STAMP' : 'IN PROGRESS', TB.x0 + 20, TB.y0 + 370);
}
function notes(t) {
  const x = 170, y0 = 480;
  text('GENERAL NOTES', x, y0, { size: 30, font: FONT.tech, ls: 3, weight: 700 });
  const L = [['1. ALL TIMES ARE THE SAME NIGHT.', 0], ['2. STRIDE MEASURED FOOT TO FOOT.', 2.6], ['3. WATCH SHOWN AT DETAIL A, ×4.', 6.3], ['4. THE CLOCK SETS THE DEADLINE.', 9.4]];
  L.forEach(([s, t0], i) => text(s, x, y0 + 60 + i * 46, { size: 24, font: FONT.hand, u: clamp((t - t0) / .5) }));
}
// rain on the sheet: wet blooms (deeper blue with a tide line), appearing through the film
const BLOOMS = (() => { const R = mulberry(4), o = []; for (let i = 0; i < 14; i++) o.push([200 + R() * 2800, 450 + R() * 1600, 10 + R() * 18, R() * 9.5]); return o; })();
function blooms(t) { for (const [x, y, r, t0] of BLOOMS) if (t >= t0) fxWet(x, y, r * (1 + .3 * clamp((t - t0) / .5)), .4); }

// ═════════ FIG. 1 — the foot strikes the puddle (section)
const G1 = 1200, PX1 = 620, K1 = 1.05;
function fig1(t) {
  const P = (u0, u1) => clamp((t - u0) / (u1 - u0));
  // drafting order: ground and centre line, the puddle's section with water hatch, its dimension, the label
  line([[220, G1], [1020, G1]], { w: LW.out, u: P(0, .35) });
  line([[PX1, G1 - 360], [PX1, G1 + 90]], { w: LW.hair, dash: 'center', u: P(.05, .4), nib: false });
  const pud = [[PX1 - 230, G1], [PX1 - 170, G1 + 26], [PX1, G1 + 34], [PX1 + 170, G1 + 26], [PX1 + 230, G1]];
  line(pud, { w: LW.det, u: P(.2, .5) });
  if (t > .5) hatch([...pud, [PX1 + 230, G1]], { sp: 9, ang: 0, v: .55, u: 1 });
  hatch([[220, G1], [1020, G1], [1020, G1 + 80], [220, G1 + 80]], { sp: 14, u: P(.35, .6) });
  dim([PX1 - 230, G1 + 40], [PX1 + 230, G1 + 40], 70, 'PUDDLE 460', { u: P(.5, .85), size: 22 });
  // her legs, drawn at FIG. 1's scale; the footfall marks on the ground line
  if (t > .3 && t < 1.95) figure(t, p => [PX1 + (p[0] - SPL.x) * K1, G1 + p[1] * K1], K1, { legsOnly: true, u: 1 });
  // the splash: arcs and drops in white line, rings in the water
  const a = t - EV.splash;
  if (a > 0 && a < .9) {
    for (let i = 0; i < 7; i++) { const ang = -Math.PI / 2 + (i - 3) * .32, L = (60 + i % 3 * 20) * Math.sin(Math.min(1, a / .3) * Math.PI / 2) * (1 - clamp((a - .4) / .5));
      line([[PX1 + Math.cos(ang) * 30, G1 - 4], [PX1 + Math.cos(ang) * (30 + L * .6), G1 - 4 + Math.sin(ang) * L]], { w: LW.thin, nib: false }); }
    const R = mulberry(9); for (let i = 0; i < 9; i++) { const vx = (R() - .5) * 700, vy = -450 - R() * 450, x = PX1 + vx * a, y = G1 - 20 + vy * a + 1600 * a * a; if (y < G1) line(circ(x, y, 7, 14), { w: LW.thin, closed: true, nib: false }); }
  }
  if (a > 0) for (let r = 0; r < 3; r++) { const aa = a - r * .12; if (aa > 0 && aa < 1.2) line([[PX1 - 20 - aa * 180, G1 + 2], [PX1 - 10 - aa * 160, G1 + 6]], { w: LW.hair, nib: false }) , line([[PX1 + 20 + aa * 180, G1 + 2], [PX1 + 10 + aa * 160, G1 + 6]], { w: LW.hair, nib: false }); }
  // the splash wets the sheet: blooms where the drops land
  if (a > .2) { const R = mulberry(3); for (let i = 0; i < 6; i++) fxWet(PX1 + (R() - .5) * 380, G1 - 40 - R() * 180, 22 + R() * 20, .8 * clamp((a - .2) / .3)); }
  text('FIG. 1', 900, G1 + 150, { size: 54, font: FONT.hand, ls: 6, align: 'center', u: P(.6, 1) });
  text('FOOT STRIKE, IN SECTION', 900, G1 + 196, { size: 20, font: FONT.tech, ls: 2, align: 'center', u: P(.8, 1.2), v: .85 });
}

// ═════════ FIG. 2 — the run along a ground line; every footfall marked, the stride dimensioned
const G2 = 1900, K2 = .27, X2 = 300, R0 = X(2.5) - 400;
const M2 = p => [X2 + (p[0] - R0) * K2, G2 + p[1] * K2];
function fig2(t) {
  line([[X2 - 60, G2], [2240, G2]], { w: LW.out, nib: false });
  hatch([[X2 - 60, G2], [2240, G2], [2240, G2 + 40], [X2 - 60, G2 + 40]], { sp: 12 });
  text('FIG. 2', 1300, G2 + 120, { size: 54, font: FONT.hand, ls: 6, align: 'center' });
  text('THE RUN, SIDE ELEVATION', 1300, G2 + 164, { size: 20, font: FONT.tech, ls: 2, align: 'center', v: .85 });
  // footfalls: a small triangle on the line for every contact so far, and the last stride's dimension
  const cs = RUN.contacts.filter(c => c.t0 <= t && c.t0 > 2.2);
  cs.forEach(c => { const x = M2([c.x, 0])[0]; line([[x - 8, G2 + 2], [x + 8, G2 + 2], [x, G2 + 16], [x - 8, G2 + 2]], { w: LW.thin, nib: false }); });
  if (cs.length > 1) { const a = M2([cs[cs.length - 2].x, 0]), b = M2([cs[cs.length - 1].x, 0]); dim([a[0], G2 + 20], [b[0], G2 + 20], 46, `STRIDE ${((cs[cs.length - 1].x - cs[cs.length - 2].x) * .0028).toFixed(2)} m`, { size: 18, u: clamp((t - cs[cs.length - 1].t0) / .25) }); }
  const J = figure(t, M2, K2, { u: 1 });
  // her speed, an arrow above her; at the watch raise, detail circle A around her wrist with a leader and a balloon
  const hd = M2(J.headC);
  line([[hd[0] - 40, hd[1] - 70], [hd[0] + 60, hd[1] - 70]], { w: LW.thin, nib: false }); line([[hd[0] + 60, hd[1] - 70], [hd[0] + 48, hd[1] - 76], [hd[0] + 48, hd[1] - 64], [hd[0] + 60, hd[1] - 70]], { w: LW.thin, nib: false });
  text('4.1 m/s', hd[0] - 40, hd[1] - 82, { size: 18, font: FONT.tech, ls: 1 });
  const dp = seg(t, 6.25, 6.6);
  if (dp > 0) { const a = J.arm.n, w = M2([a.el[0] + (a.wr[0] - a.el[0]) * .8, a.el[1] + (a.wr[1] - a.el[1]) * .8]);
    line(circ(w[0], w[1], 26, 40, -Math.PI / 2, -Math.PI / 2 + TAU), { w: LW.thin, dash: 'phantom', u: dp });
    balloon([w[0] + 18, w[1] - 18], [w[0] + 120, w[1] - 120], 'A', { u: clamp((t - 6.5) / .4), r: 22 }); }
}

// ═════════ DETAIL A (×4) — the watch; the second hand steps like an escapement
const DA = { x: 1600, y: 900, r: 220 };
const AH = (11 + 58 / 60) / 12 * TAU, AM = 58 / 60 * TAU;
function detailA(t) {
  const P = (u0, u1) => clamp((t - u0) / (u1 - u0)), x = DA.x, y = DA.y, r = DA.r;
  // centre lines, the case, the bezel, the lugs and the strap (hatched in section)
  line([[x - r - 80, y], [x + r + 80, y]], { w: LW.hair, dash: 'center', u: P(7.5, 7.75), nib: false }); line([[x, y - r - 200], [x, y + r + 200]], { w: LW.hair, dash: 'center', u: P(7.5, 7.75), nib: false });
  for (const s of [-1, 1]) { const st = [[x - 90, y + s * (r + 10)], [x + 90, y + s * (r + 10)], [x + 90, y + s * (r + 190)], [x - 90, y + s * (r + 190)]]; knock(st); line(st, { w: LW.det, closed: true, u: P(7.62, 7.9) }); if (t > 7.95) hatch(st, { sp: 12 }); }
  knock(circ(x, y, r + 26, 72)); line(circ(x, y, r + 26, 80, -Math.PI / 2, -Math.PI / 2 + TAU), { w: LW.out, u: P(7.55, 7.85) });
  line(circ(x, y, r, 80, -Math.PI / 2, -Math.PI / 2 + TAU), { w: LW.det, u: P(7.6, 7.9) });
  line([[x + r + 26, y - 20], [x + r + 50, y - 20], [x + r + 50, y + 20], [x + r + 26, y + 20]], { w: LW.det, u: P(7.7, 7.9) });
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, big = i % 5 === 0; line([[x + Math.sin(a) * r * (big ? .8 : .88), y - Math.cos(a) * r * (big ? .8 : .88)], [x + Math.sin(a) * r * .95, y - Math.cos(a) * r * .95]], { w: big ? LW.det : LW.hair, u: P(7.8 + i * .004, 7.85 + i * .004), nib: false }); }
  if (t > 8.0) { for (const [s, a] of [['12', 0], ['3', .25], ['6', .5], ['9', .75]]) text(s, x + Math.sin(a * TAU) * r * .64, y - Math.cos(a * TAU) * r * .64 + 12, { size: 34, font: FONT.hand, align: 'center' }); }
  // hands: hour and minute at 23:58; the second hand advances one step with a short ease-out at 8.4 s (47 → 48)
  const hand = (a, L, w, u) => line([[x - Math.sin(a) * L * .15, y + Math.cos(a) * L * .15], [x + Math.sin(a) * L, y - Math.cos(a) * L]], { w, u, nib: false });
  hand(AH, r * .5, LW.out, P(7.95, 8.1)); hand(AM, r * .72, LW.det, P(8.0, 8.15));
  const sec = 47 + eo(seg(t, 8.4, 8.5)) + eo(seg(t, 9.4, 9.5)); hand(sec / 60 * TAU, r * .82, LW.thin, P(8.05, 8.2));
  line(circ(x, y, 8, 20), { w: LW.det, closed: true, nib: false });
  dim([x - r - 26, y + r + 230], [x + r + 26, y + r + 230], 40, 'Ø 36', { u: P(8.3, 8.7), size: 24 });
  text('DETAIL A', x, y - r - 240, { size: 50, font: FONT.hand, ls: 6, align: 'center', u: P(8.4, 8.8) });
  text('WATCH, SCALE 4:1 — 23:58', x, y - r - 200, { size: 20, font: FONT.tech, ls: 2, align: 'center', u: P(8.6, 9.0), v: .85 });
}

// ═════════ FIG. 4 — the station tower (elevation); the stamp on the chime
const TX = 2560, TG = 1500;
function fig4(t) {
  const P = (u0, u1) => clamp((t - u0) / (u1 - u0));
  line([[TX, TG - 1180], [TX, TG + 40]], { w: LW.hair, dash: 'center', nib: false });
  const body = [[TX - 150, TG], [TX - 150, TG - 760], [TX - 110, TG - 760], [TX - 110, TG - 950], [TX + 110, TG - 950], [TX + 110, TG - 760], [TX + 150, TG - 760], [TX + 150, TG]];
  knock(body); line(body, { w: LW.out, closed: true });
  const roof = [[TX - 130, TG - 950], [TX, TG - 1120], [TX + 130, TG - 950]]; knock(roof); line(roof, { w: LW.out, closed: true });
  for (let i = 0; i < 4; i++) { const y = TG - 120 - i * 160; line(rect(TX - 50, y - 90, TX + 50, y), { w: LW.det, closed: true }); }
  hatch([[TX - 150, TG], [TX - 150, TG - 760], [TX - 110, TG - 760], [TX - 110, TG]], { sp: 10 });
  const c = [TX, TG - 860], r = 80; knock(circ(...c, r + 8)); line(circ(...c, r + 8, 48), { w: LW.det, closed: true }); line(circ(...c, r, 48), { w: LW.thin, closed: true });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; line([[c[0] + Math.sin(a) * r * .78, c[1] - Math.cos(a) * r * .78], [c[0] + Math.sin(a) * r * .94, c[1] - Math.cos(a) * r * .94]], { w: LW.hair, nib: false }); }
  line([c, [c[0] + Math.sin(AH) * r * .5, c[1] - Math.cos(AH) * r * .5]], { w: LW.det, nib: false }); line([c, [c[0] + Math.sin(AM) * r * .74, c[1] - Math.cos(AM) * r * .74]], { w: LW.thin, nib: false });
  line([[TX - 400, TG], [TX + 400, TG]], { w: LW.out, nib: false }); hatch([[TX - 400, TG], [TX + 400, TG], [TX + 400, TG + 40], [TX - 400, TG + 40]], { sp: 12 });
  dim([TX + 150, TG], [TX + 150, TG - 950], -90, 'H 38 m', { size: 22 });
  balloon([c[0] + r, c[1] - 20], [c[0] + 260, c[1] - 140], 'B', { r: 22 });
  text('FIG. 4', TX, TG + 120, { size: 54, font: FONT.hand, ls: 6, align: 'center' });
  text('THE STATION CLOCK, ELEVATION', TX, TG + 164, { size: 20, font: FONT.tech, ls: 2, align: 'center', v: .85 });
  // the chime: rings drawn out from the clock as phantom lines, and the stamp (blue channel = red ink), once
  const a = t - EV.chime;
  if (a > 0) for (let i = 0; i < 3; i++) { const aa = a - i * .08; if (aa > 0) line(circ(...c, r + 40 + aa * 600, 72), { w: LW.thin, dash: 'phantom', closed: true, nib: false }); }
  if (a > 0) stamp(TX - 380, TG - 520, a);
}
function stamp(x, y, a) {
  const k = 1 + .25 * (1 - eo(clamp(a / .12)));
  f.save(); const [sx, sy] = S(x, y); f.setTransform(cam.z * k, 0, 0, cam.z * k, sx, sy); f.rotate(-.12); f.globalCompositeOperation = 'lighter';
  f.strokeStyle = 'rgb(0,0,255)'; f.fillStyle = 'rgb(0,0,255)'; f.lineWidth = 10; f.strokeRect(-260, -80, 520, 160); f.lineWidth = 4; f.strokeRect(-244, -64, 488, 128);
  f.font = '700 72px B612'; f.textAlign = 'center'; f.textBaseline = 'middle'; f.letterSpacing = '8px'; f.fillText('LAST CALL', 0, 4); f.restore();
}

// ═════════ the cameras (cuts on downbeats)
function camAt(t) {
  if (t < 2.5) return { x: 640, y: 1080, z: 1.55 };
  if (t < 7.5) { const xs = M2([X(t), 0])[0]; return { x: xs + 120, y: G2 - 220, z: 2.3 }; }
  if (t < 9.375) return { x: DA.x + 30 * (t - 7.5), y: DA.y + 30, z: 1.25 + .04 * (t - 7.5) };
  const dn = eio(seg(t, 9.6, 10.6)) * 160, bump = t > EV.chime && t < EV.chime + .1 ? 4 : 0;
  return { x: 2310, y: TG - 700 + dn + bump, z: 1.15 };
}
window.render = t => {
  const c = camAt(t); setCam(c); proj.k = 0; clear();
  border(); header(); titleBlock(t); notes(t); blooms(t);
  fig1(t < 2.5 ? t : 9);
  if (t >= 2.5) fig2(Math.min(t, 7.5 - 1e-3)); else fig2(2.5);
  if (t >= 7.5) detailA(t);
  fig4(t);
  nibs(1);
  comp(inkC, fxC, ovC, { sheet: [SW, SH], cam: c, seed: 3 });
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0);
window.READY = true;
