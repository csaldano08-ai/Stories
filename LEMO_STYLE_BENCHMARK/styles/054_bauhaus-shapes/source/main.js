// 054 · Bauhaus Shapes — the first 10 s of "Last Train Home" told with circles, squares, arcs and straight lines on matte card
// (lemo-opuscar styles/bauhaus-shapes). Six colours by role: paper, the protagonist red (AKI alone), one blue field per frame,
// a yellow pivot (light and the watch), a pale secondary, ink for line and type only. AKI is built from shapes (bars and discs,
// faceless) driven by the shared rig; the spine is point → line → plane: the splash is a point in a hole cut out of the pavement,
// her run draws a line (a dot per step, the path of her head), the watch is a swept area (the seconds gone are a wedge), and the
// station clock gains rings on the chime, the last one running out of the frame. Entries differ per scene: the grid builds (S1),
// a grid match cut (2.5 s), through a shape (the watch's yellow, 7.5 s), a whip with long construction lines (9.375 s).
// Engine: engine/kit.js, an excerpt of the demo's drawing kit and paper finish. Page contract: window.render(t), DUR, READY, RIGQA.
import { g, P, W, H, TAU, SANS, disc, poly, rect, line, arc, cross, text, measure, finish } from './engine/kit.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back } from './shared/lib/util.js';

window.DUR = DUR;
await Promise.all(['800 60px "BH Sans"', '300 60px "BH Sans"', '600 30px "BH Sans"'].map(f => document.fonts.load(f)));
const io3 = t => eio(t), oBack = (t, s = 1.4) => back(t, s);

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

// ═════════ AKI built from shapes: a bar per bone (butt ends), a disc per joint, a disc head set apart, one colour
const bar = (a, b, w) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * w / 2, ny = dx / L * w / 2; return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]; };
function aki(t, k, ox, oy, xr) {
  const J = solveProfile(poseAt(t)), M = p => [ox + (p[0] - xr) * k, oy + p[1] * k], w = 34 * k, col = P.red;
  const limb = (pts, ws, gap) => { // a chain of bars with discs at the joints; gap = a paper hair around it (it separates near from far)
    if (gap) { for (let i = 0; i < pts.length - 1; i++) poly(bar(pts[i], pts[i + 1], ws[i] + 5), P.paper); for (let i = 1; i < pts.length - 1; i++) disc(...pts[i], ws[i] / 2 + 2.5, P.paper); }
    for (let i = 0; i < pts.length - 1; i++) poly(bar(pts[i], pts[i + 1], ws[i]), col);
    for (let i = 1; i < pts.length - 1; i++) disc(...pts[i], ws[i] / 2, col); };
  const legPts = kk => { const l = J.leg[kk], c = Math.cos(l.pitch), s = Math.sin(l.pitch); return [M(l.hip), M(l.knee), M(l.ankle), M([l.ankle[0] + 58 * c - 6 * s, l.ankle[1] + 58 * s + 6 * c])]; };
  const armPts = kk => { const a = J.arm[kk]; return [M(a.sh), M(a.el), M(a.wr)]; };
  limb(armPts('f'), [w * .8, w * .72]); limb(legPts('f'), [w * 1.05, w * .9, w * .7]);
  // torso: one bar from the hip to the neck; the head a disc with a paper gap; a short bar for the ponytail
  poly(bar(M(J.pelvis), M(J.neckBase), w * 1.7), col);
  const hc = M(J.headC), hr = 44 * k, ha = J.headA;
  disc(hc[0], hc[1], hr + 4, P.paper); disc(hc[0], hc[1], hr, col);
  const pb = [hc[0] - Math.cos(ha) * hr * 1.05, hc[1] - Math.sin(ha) * hr * 1.05 + hr * .1];
  poly(bar(pb, [pb[0] - Math.cos(ha - .45) * hr * 1.1, pb[1] - Math.sin(ha - .45) * hr * 1.1 + hr * .5], hr * .45), col);
  limb(legPts('n'), [w * 1.05, w * .9, w * .7], true); limb(armPts('n'), [w * .8, w * .72], true);
  const a = J.arm.n, wq = M([a.el[0] + (a.wr[0] - a.el[0]) * .8, a.el[1] + (a.wr[1] - a.el[1]) * .8]);
  disc(wq[0], wq[1], w * .55, P.yel);                                           // the watch: the pivot's yellow
  return { J, M, watch: wq, head: hc };
}
const view = (s, cx, cy) => g.setTransform(s, 0, 0, s, W / 2 - cx * s, H / 2 - cy * s);

// ═════════ S1 (0–2.5): the point — the grid builds, a hole is cut in the pavement, her foot lands in it
const GY = 760, K1 = 2.2;
const HOLE = { x: 1000, r: 210 };
const GRID1 = { h: [GY, 330, 210], v: [180, 520, 1000, 1480, 1760] };
function shotS1(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); rect(0, 0, W, H, P.paper);
  const fall = ei(seg(t, 2.1, 2.5)) * 900;                                       // the pieces fall out of frame for the grid match cut
  // the field: the wet pavement, a blue slab; the puddle: a half-disc cut out of it (paper), its compass centre left on show
  const cut = eo(seg(t, .3, .7));
  rect(0, GY + fall, W, H - GY, P.blue);
  if (cut > 0) { g.save(); g.beginPath(); g.rect(0, GY + fall, W, H); g.clip(); disc(HOLE.x, GY + fall, HOLE.r * cut, P.paper); g.restore(); cross(HOLE.x, GY + fall + 40, P.ink); }
  // the café's word and number land on the cap line and the baseline
  const s1 = oBack(seg(t, .45, .8)), s2 = oBack(seg(t, .6, .95));
  g.save(); g.beginPath(); g.rect(170, 0, 1300, 330); g.clip(); text('24H', 180, 330 + (1 - s1) * 220 - fall, { size: 220, weight: 800, track: -6 }); g.restore();
  g.save(); g.beginPath(); g.rect(170, 330, 900, 70); g.clip(); text('CAFE · OPEN ALL NIGHT', 186, 380 - (1 - s2) * 60 - fall * 1.2, { size: 30, weight: 600, track: 5 }); g.restore();
  // the splash: a drop rises out of the hole and squashes once; arcs open from the impact like a compass swinging
  const a = t - EV.splash;
  if (a > 0) {
    for (let i = 0; i < 3; i++) { const aa = a - i * .14; if (aa > 0 && aa < .9) arc(HOLE.x, GY + fall, 60 + aa * 420, Math.PI, TAU, P.ink, 2); }
    const up = Math.sin(Math.min(1, a / .55) * Math.PI), dy = up * 230, sq = a > .5 && a < .62 ? 1 - (a - .5) * 3 : 1;
    if (a < .75) { g.save(); g.translate(HOLE.x + 60, GY - 30 - dy + fall); g.scale(1 / sq, sq); disc(0, 0, 26, P.tint); g.restore(); }
  }
  // AKI from the hips down: bars and discs; her foot lands in the hole on the splash
  if (t > .35 && t < 2.0) { g.save(); aki(t, K1, HOLE.x, GY + fall, SPL.x); g.restore(); }
  grid(t, GRID1, t < 2.4 ? 1 : 0);
}
// construction lines: drawn from one end (ink, 2 px), retracting from the other end when done
function grid(t, G0, show = 1, G1 = null, m = 0) {
  const p = clamp(t / .45);
  const L = (a, b) => line([a, b], P.ink, 2);
  G0.h.forEach((y, i) => { const yy = G1 ? lerp(y, G1.h[i] ?? y, m) : y, q = clamp(p * 1.4 - i * .15); if (q > 0 && show) L([0, yy], [W * q, yy]); });
  G0.v.forEach((x, i) => { const xx = G1 ? lerp(x, G1.v[i] ?? x, m) : x, q = clamp(p * 1.4 - i * .1); if (q > 0 && show) L([xx, 0], [xx, H * q]); });
}

// ═════════ S2 (2.5–7.5): the line — she runs in place, the street slides under her (the group moves, not the camera);
// each step leaves a dot on the ground, her head leaves a path; the count of steps rises on its baseline
const K2 = .9, GY2 = 820, AX2 = 760;
const GRID2 = { h: [GY2, 300, 150], v: [180, 520, 1000, 1480, 1760] };
const SHOPS = ['CAFE', 'NOODLES', 'BOOKS', 'BAKERY', 'LAUNDRY', 'HOTEL', 'RECORDS', 'FLOWERS'];
function shotS2(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); rect(0, 0, W, H, P.paper);
  const sx = (X(t) - X(2.5)) * K2, xOf = rx => AX2 + (rx - X(t)) * K2;
  // the one field: the night, a blue band across the top
  rect(0, 0, W, 300, P.blue);
  // shops: yellow squares (what stays: lit windows), equal, with their names in small caps on a leader
  for (let i = 0; i < SHOPS.length; i++) {
    const x = 300 + i * 620 - sx; if (x < -500 || x > W + 100) continue;
    rect(x, GY2 - 400, 360, 360, P.yel);
    text(SHOPS[i], x, GY2 - 430, { size: 30, weight: 600, track: 5 });
    line([[x, GY2 - 418], [x, GY2 - 400]], P.ink, 2);
  }
  // lamps: ink posts, a yellow disc each
  for (let i = 0; i < 12; i++) { const x = 600 + i * 620 - sx; if (x < -50 || x > W + 50) continue; line([[x, GY2], [x, 330]], P.ink, 5); disc(x, 330, 22, P.yel); }
  line([[0, GY2], [W, GY2]], P.ink, 5);                                              // the ground: the path's baseline
  // her path: a dot for each step on the ground; the head's path, a red line behind her (it stays)
  let n = 0;
  for (const c of RUN.contacts) { if (c.t0 > t || c.t0 < 2.3) continue; n++; disc(xOf(c.x), GY2 + 26, 10, P.red); }
  const hp = []; for (let tt = 2.5; tt <= t; tt += 1 / 30) { const J = solveProfile(poseAt(tt)); hp.push([xOf(J.headC[0]), GY2 + J.headC[1] * K2]); }
  if (hp.length > 1) line(hp, P.red, 5);
  const A = aki(t, K2, AX2, GY2, X(t));
  // the number of steps rises out of a slot on its baseline
  const steps = RUN.contacts.filter(c => c.t0 <= t).length;
  g.save(); g.beginPath(); g.rect(1420, 820, 420, 200); g.clip();
  text(String(steps).padStart(2, '0'), 1430, 990, { size: 190, weight: 800, track: -6 });
  g.restore();
  text('STEPS', 1436, 1040, { size: 26, weight: 600, track: 6 });
  return A;
}

// ═════════ S3 (7.5–9.375): the swept area — the watch, the seconds gone a wedge; entered through the watch's own yellow
const WC = { x: 1220, y: 520, r: 330 };
const AH = (11 + 58 / 60) / 12 * TAU, AM = 58 / 60 * TAU;
function watchScene(t) {
  rect(0, 0, W, H, P.paper);
  // her forearm: a red bar from the left to the watch
  poly(bar([-100, 900], [WC.x - 120, WC.y + 80], 150), P.red);
  // the watch: a yellow disc, its compass centre marked; the wedge of seconds gone (secondary), the second hand an ink line
  disc(WC.x, WC.y, WC.r, P.yel);
  const sec = 47 + (t >= 8.4 ? 1 : 0) + (t >= 9.4 ? 1 : 0), kick = t >= 8.4 ? oBack(seg(t, 8.4, 8.55)) : 1;
  const sweep = sec >= 48 ? (47 + kick) / 60 : 47 / 60;
  g.fillStyle = P.tint; g.beginPath(); g.moveTo(WC.x, WC.y); g.arc(WC.x, WC.y, WC.r * .86, -Math.PI / 2, -Math.PI / 2 + sweep * TAU); g.closePath(); g.fill();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; line([[WC.x + Math.sin(a) * WC.r * .88, WC.y - Math.cos(a) * WC.r * .88], [WC.x + Math.sin(a) * WC.r * .98, WC.y - Math.cos(a) * WC.r * .98]], P.ink, i % 3 ? 3 : 6); }
  const hand = (a, L, w) => line([[WC.x, WC.y], [WC.x + Math.sin(a) * L, WC.y - Math.cos(a) * L]], P.ink, w);
  hand(AH, WC.r * .5, 12); hand(AM, WC.r * .74, 8); hand(-Math.PI / 2 * 0 + sweep * TAU, WC.r * .86, 3);
  cross(WC.x, WC.y, P.ink);
  // the number and its caption
  const r1 = oBack(seg(t, 7.62, 7.95)), r2 = oBack(seg(t, 7.78, 8.1));
  g.save(); g.beginPath(); g.rect(150, 200, 760, 300); g.clip(); text('23:58', 160, 470 + (1 - r1) * 300, { size: 230, weight: 800, track: -6 }); g.restore();
  g.save(); g.beginPath(); g.rect(150, 480, 760, 60); g.clip(); text(`SECONDS GONE · ${sec} / 60`, 168, 530 - (1 - r2) * 60, { size: 30, weight: 600, track: 5 }); g.restore();
  text('the last train', 168, 600, { size: 44, weight: 300, track: 14 });
}
function shotS3(t) {
  // pull out of the watch's yellow: at the cut the disc fills the frame, then the composition opens
  const p = io3(seg(t, 7.5, 8.05)), s = Math.exp(lerp(Math.log(6), 0, p));
  g.setTransform(1, 0, 0, 1, 0, 0); rect(0, 0, W, H, P.paper);
  view(s, lerp(WC.x, W / 2, p), lerp(WC.y, H / 2, p));
  watchScene(t);
}

// ═════════ S4 (9.375–10): the plane — the station: a blue tower (the field), the clock a disc; rings land on the chime
function stationScene(t) {
  rect(-400, -400, W + 800, H + 800, P.paper);
  const CX = 1180, CY = 330, R = 230;
  rect(CX - 170, CY, 340, 1200, P.blue);
  for (let i = 0; i < 7; i++) { const x = 160 + i * 150; if (x > CX - 320) break; rect(x, 700 - (i % 3) * 90, 110, 600, P.tint); }
  for (let i = 0; i < 3; i++) rect(CX + 260 + i * 160, 760 - (i % 2) * 80, 120, 600, P.tint);
  const ch = t - EV.chime;
  // rings land outside the clock on the chime, newest outermost, each tangent at the top; the last runs out of the frame
  for (let i = 0; i < 3; i++) { const a = ch - i * .1; if (a < 0) continue; const rr = R + 60 + i * 70 + (i === 2 ? eo(seg(a, 0, .4)) * 1400 : 0), land = oBack(seg(a, 0, .12));
    g.strokeStyle = i === 2 ? P.tint : P.yel; g.lineWidth = 22 * land; g.beginPath(); g.arc(CX, CY - R + rr * 0 + (R - rr) * 0, rr, 0, TAU); g.stroke(); }
  disc(CX, CY, R, P.yel);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; line([[CX + Math.sin(a) * R * .8, CY - Math.cos(a) * R * .8], [CX + Math.sin(a) * R * .94, CY - Math.cos(a) * R * .94]], P.ink, i % 3 ? 3 : 6); }
  line([[CX, CY], [CX + Math.sin(AH) * R * .5, CY - Math.cos(AH) * R * .5]], P.ink, 12); line([[CX, CY], [CX + Math.sin(AM) * R * .74, CY - Math.cos(AM) * R * .74]], P.ink, 8);
  cross(CX, CY, P.ink);
  const r1 = oBack(seg(t, 9.45, 9.75));
  g.save(); g.beginPath(); g.rect(150, 160, 860, 160); g.clip(); text('STATION', 160, 300 + (1 - r1) * 160, { size: 150, weight: 800, track: -4 }); g.restore();
  text('the clock strikes', 168, 360, { size: 40, weight: 300, track: 14 });
}
function shotS4(t) {
  // the whip: S3 leaves left, S4 arrives from the right, long construction lines carry the speed
  const wp = io3(seg(t, 9.29, 9.46)), dn = io3(seg(t, 9.62, 10.6)) * 160;
  g.setTransform(1, 0, 0, 1, 0, 0); rect(0, 0, W, H, P.paper);
  if (wp < 1) { g.setTransform(1, 0, 0, 1, -wp * W * 1.1, 0); watchScene(9.374); }
  g.setTransform(1, 0, 0, 1, (1 - wp) * W * 1.1, -dn); stationScene(t);
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (wp > 0 && wp < 1) for (let i = 0; i < 9; i++) { const y = 120 + i * 105, L = 700 + (i * 37 % 5) * 160, x = W - wp * (W + L * 2) + (i % 3) * 120; line([[x, y], [x + L, y]], P.ink, 2); }
}

window.render = t => {
  if (t < 2.5) shotS1(t);
  else if (t < 7.5) {
    shotS2(t);
    // grid match cut: the construction lines stay through the cut and re-form as this scene's grid, then retract
    g.setTransform(1, 0, 0, 1, 0, 0);
    const m = io3(seg(t, 2.5, 2.8)), rt = seg(t, 2.8, 3.1);
    if (rt < 1) { GRID1.h.forEach((y, i) => { const yy = lerp(y, GRID2.h[i], m); line([[W * rt, yy], [W, yy]], P.ink, 2); }); GRID1.v.forEach((x, i) => { const xx = lerp(x, GRID2.v[i], m); line([[xx, H * rt], [xx, H]], P.ink, 2); }); }
    // through a shape: push into the yellow of her watch until it fills the frame
    const pp = io3(seg(t, 7.18, 7.5));
    if (pp > 0) { const A = aki(t, K2, AX2, GY2, X(t)); const r = lerp(18, 1300, pp); disc(A.watch[0], A.watch[1], r, P.yel); }
  }
  else if (t < 9.29) shotS3(t);
  else shotS4(t);
  g.setTransform(1, 0, 0, 1, 0, 0);
  finish();
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0);
window.READY = true;
