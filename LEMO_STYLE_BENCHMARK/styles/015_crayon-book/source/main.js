// 015 · Crayon Picture Book — the first 10 s of "Last Train Home" as one picture-book page drawn in wax crayon on toothy
// paper (lemo-opuscar styles/crayon-book): a box of 12 crayons (indigo outlines, never black), wax that sticks only to the
// paper's tooth, zig-zag hatching that overshoots the outline, one ultramarine watercolour wash for the night that the
// wax resists (white-wax rain, lit windows, lamp glow and the clock face stay bright), every drawing boiling on twos.
// The camera moves over one big page: a slow drift on the puddle, a tight follow where the street draws itself ahead of
// AKI, a lift to a round inset drawn on the page (her watch, big — child logic), a pan up to the clock tower.
// Engine copied unchanged from the style's demo (gl.js compositor, crayon.js strokes, rig.js parts/occlusion).
// Page contract: window.render(t), DUR, READY, RIGQA.
import { makeComp } from './engine/gl.js';
import { layer, clear, line, fill, dab, ellipse, handCircle, smooth, xf, text, CAM, BOIL, W, H, sx, sy } from './engine/crayon.js';
import { group, clearGroup, part, tube, curve, erase } from './engine/rig.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { lerp, seg, ss, eio, eo, back, hash, clamp, mulberry } from './shared/lib/util.js';

// ——— the crayon box (12 sticks) + one tube of watercolour ———
const K = { ink: '#2d3263', coat: '#d9432f', plum: '#6b3a6e', peach: '#f4c7a4', cream: '#f1e3c2', trou: '#44465e', brown: '#7a4b31', yellow: '#f5c63c', orange: '#ec8a3c', slate: '#7d8fb0', rose: '#ee8ea4', white: '#fbfaf4' };
const PAPER = [0.957, 0.937, 0.890], WASHC = [0.15, 0.19, 0.44];
const W2 = W / 2, H2 = H / 2;

// ——— the page (world units = rig units: AKI is ~600 tall) ———
const GB = 1500, FY = 1640, KERB = 1775, ROADB = 2400;      // shop base, her ground line, kerb, bottom of the road

// ——— the run (shared rig) ———
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const X = t => RUN.pelvisAt(t)[0];
function poseAt(t) {
  const S = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  const w = clamp(up, 0, 1.1) * (1 - dn); S.watch = w;
  if (w > 0) { const J0 = solveProfile(S), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S.arms.f.sh *= 1 - .45 * wm; S.head += .26 * wm; S.neck += .08 * wm; }
  return S;
}

// ——— camera over the page (runs on ones) ———
const XI = X(7.5) + 150, YI = 520, RI = 280;               // the round inset (her watch, big) drawn in the sky ahead of her
const XT = 12400;                                            // the clock tower at the end of the street
const camS1 = t => [SPL.x + 40 + 10 * t, FY - 150, 2.1];
const camS2 = t => [X(t) + 330, 1240, .75];
const camS3 = () => [XI, YI, 1.85];
const camS4 = t => [XT - 380, 420 + 100 * eio(seg(t, 9.575, 10.3)), .55];
const mixCam = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), Math.exp(lerp(Math.log(a[2]), Math.log(b[2]), u))];
function camAt(t) {     // the cuts keep their times; each one is a fast move over the page (pan / lift / pan up), never a dissolve
  if (t < 2.5) return camS1(t);
  if (t < 7.5) return t < 2.8 ? mixCam(camS1(2.5), camS2(t), eio(seg(t, 2.5, 2.8))) : camS2(t);
  if (t < 9.375) return t < 7.75 ? mixCam(camS2(t), camS3(), eio(seg(t, 7.5, 7.75))) : camS3();
  return t < 9.575 ? mixCam(camS3(), camS4(t), eio(seg(t, 9.375, 9.575))) : camS4(t);
}
const view = (m = 0) => [CAM.x - W2 / CAM.s - m, CAM.x + W2 / CAM.s + m, CAM.y - H2 / CAM.s - m, CAM.y + H2 / CAM.s + m];
const inView = (x0, x1, y0, y1, m = 120) => { const [a, b, c, d] = view(m); return x1 > a && x0 < b && y1 > c && y0 < d; };
const toW = (x, y) => [(x - W2) / CAM.s + CAM.x, (y - H2) / CAM.s + CAM.y];

// "The world draws itself ahead of the subject": in the follow, everything is drawn as it reaches the right edge of the frame
// (lines first, colouring row by row after). What the follow never reaches (the end of the street) is already on the page.
const tIn = x => .5925 + (x - 1690 + 1400) / 1450;
function prog(x, tD) { if (x > X(7.5) + 1700) return [1, 1]; const ti = tIn(x); if (ti < 2.8) return [1, 1]; return [seg(tD, ti - .15, ti + .4), seg(tD, ti + .1, ti + .65)]; }

// ——— the street, built once (fixed seeds: each drawing of it boils, the colouring itself stays put) ———
const R = mulberry(15015);
const WORDS = ['BAKERY', 'BAR', 'BOOKS', 'PHARMACY', 'NOODLES', 'LAUNDRY', 'RECORDS', 'HOTEL', 'FLOWERS'];
const WALLS = [K.plum, K.brown, K.slate, K.rose, K.plum, K.orange, K.brown, K.slate];
const SIGNS = [K.rose, K.orange, K.yellow, K.cream];
const SHOPS = []; { let x = -3000, i = 0;
  while (x < 14200) { const w = 560 + R() * 220, top = GB - (600 + R() * 150), gable = R() < .62;
    SHOPS.push({ x0: x, x1: x + w, top, gable, gh: 130 + R() * 90, pk: (R() - .5) * 80, wall: WALLS[i % WALLS.length], roof: R() < .5 ? K.brown : K.ink, sign: SIGNS[i % 4], nu: 2 + (R() < .5 ? 1 : 0), lit: [R() < .7, R() < .5, R() < .7], sd: 100 + i * 37, i });
    x += w + (R() < .25 ? 110 : 0); i++; } }
{ const j = SHOPS.findIndex(s => s.x0 <= SPL.x - 150 && s.x1 > SPL.x - 150); let k = 0;   // the two shops whose signs the puddle reflects
  SHOPS.forEach((s, i) => { s.word = i === j ? '24H' : i === j + 1 ? 'CAFE' : WORDS[k++ % WORDS.length]; }); }
const LAMPS = SHOPS.filter((s, i) => i % 2 === 1).map(s => s.x1 + 10);
const BACK = []; { let x = 9800; const r = mulberry(77); while (x < 14600) { const w = 380 + r() * 300; BACK.push({ x0: x, x1: x + w, top: 380 + r() * 260, col: r() < .5 ? K.slate : K.plum, sd: 3000 + Math.round(x) }); x += w - 30; } }
const CLOUDS = []; { const r = mulberry(31); for (let x = -3400; x < 14800; x += 1100 + r() * 700) CLOUDS.push({ x, y: 180 + r() * 330, rx: 260 + r() * 200, ry: 70 + r() * 40, sd: 5000 + Math.round(x) }); }
const PUDDLES = [{ x: SPL.x + 30, y: FY + 12, rx: 250, ry: 46, hero: true }, { x: 3200, y: FY + 40, rx: 200, ry: 34 }, { x: 5900, y: FY + 20, rx: 230, ry: 38 }, { x: 8300, y: FY + 50, rx: 190, ry: 32 }];
const puddlePoly = (p) => { const out = []; for (let k = 0; k <= 48; k++) { const a = k / 48 * Math.PI * 2, b = 1 + .1 * Math.sin(a * 2 + p.x) + .06 * Math.sin(a * 5 + p.x * .3); out.push([p.x + Math.cos(a) * p.rx * b, p.y + Math.sin(a) * p.ry * b]); } return out; };
const cloudPoly = (c) => { const out = []; for (let k = 0; k <= 40; k++) { const a = k / 40 * Math.PI * 2, top = Math.sin(a) < 0; const b = top ? 1 + .22 * Math.abs(Math.sin(a * 3 + c.sd)) : .9; out.push([c.x + Math.cos(a) * c.rx * (top ? 1 : 1.02), c.y + Math.sin(a) * c.ry * b * (top ? 1.6 : .7)]); } return out; };

// ——— layers ———
const BG = group(), AK = group(), INS = group(), RAIN = layer(), WASH = layer(), FX = layer(), REFL = layer();
const cl = poly => [...poly, poly[0]];   // close a few-point polygon (the outline is drawn as poly + its 2nd point)
const lo = (sd, o = {}) => ({ col: K.ink, w: 8, seed: sd, boil: .6, ...o });
const fo = (col, sd, o = {}) => ({ col, p: .9, ang: .62, gap: 10, w: 11, over: 6, seed: sd, boil: 0, ...o });

function drawShop(s, tD) {
  const [lp, fp] = prog(s.x0, tD); if (lp <= 0) return;
  const { x0, x1, top, sd } = s, w = x1 - x0, mid = (x0 + x1) / 2, ww = w * .5;
  const Lp = k => clamp(lp * 5 - k), Fp = k => clamp(fp * 5 - k);
  const F = (k, o) => (fp > 0 ? { ...o, draw: Fp(k) } : null);
  part(BG, cl([[x0, top], [x1, top], [x1, GB], [x0, GB]]), F(0, fo(s.wall, sd, { ang: 1.35, gap: 14, w: 11 })), lo(sd + 1, { draw: Lp(0) }));
  if (s.gable) part(BG, cl([[x0 - 26, top + 6], [mid + s.pk, top - s.gh], [x1 + 26, top + 6]]), F(1, fo(s.roof, sd + 2, { ang: .35, gap: 9 })), lo(sd + 3, { draw: Lp(1) }));
  else part(BG, cl([[x0 - 18, top - 30], [x1 + 18, top - 30], [x1 + 18, top + 6], [x0 - 18, top + 6]]), F(1, fo(K.brown, sd + 2, { ang: .2, gap: 8 })), lo(sd + 3, { draw: Lp(1) }));
  for (let k = 0; k < s.nu; k++) { const wx = x0 + 70 + k * (w - 140) / s.nu, wy = top + 60; if (wy + 110 > GB - 450) break;
    part(BG, cl([[wx, wy], [wx + 90, wy], [wx + 90, wy + 110], [wx, wy + 110]]), F(4, s.lit[k] ? fo(K.yellow, sd + 10 + k, { p: 1, ang: .8, gap: 7, w: 9 }) : fo(K.ink, sd + 10 + k, { p: .75, ang: .9, gap: 9 })), lo(sd + 13 + k, { w: 6, draw: Lp(4) })); }
  part(BG, cl([[x0 + 34, GB - 440], [x1 - 34, GB - 440], [x1 - 34, GB - 345], [x0 + 34, GB - 345]]), F(2, fo(s.sign, sd + 20, { p: .95, ang: .15, gap: 8, w: 10 })), lo(sd + 21, { draw: Lp(2) }));
  part(BG, cl([[x0 + 40, GB - 300], [x0 + 40 + ww, GB - 300], [x0 + 40 + ww, GB - 50], [x0 + 40, GB - 50]]), F(2, fo(K.yellow, sd + 22, { p: 1, ang: .8, gap: 8, w: 10 })), lo(sd + 23, { draw: Lp(2) }));
  line(BG.l, [[x0 + 40 + ww / 2, GB - 296], [x0 + 40 + ww / 2, GB - 54]], lo(sd + 24, { w: 6, draw: Lp(3) }));
  part(BG, cl([[x1 - 175, GB - 320], [x1 - 70, GB - 320], [x1 - 70, GB], [x1 - 175, GB]]), F(3, fo(K.brown, sd + 25, { p: .95, ang: 1.45, gap: 8 })), lo(sd + 26, { draw: Lp(3) }));
  if (Lp(3) > .5) dab(BG.l, x1 - 94, GB - 160, 9, { col: K.yellow, p: 1, seed: sd + 27, boil: .6 });
  if (lp > .6) text(BG.l, s.word, sx(mid), sy(GB - 368), { size: 70 * CAM.s, font: 'Gaegu', weight: 700, col: K.ink, seed: sd + 28, reveal: seg(lp, .6, .95), boil: .6, stroke: 2 });
  // wet pavement: the lit window pulled down into the paving as wobbly yellow streaks (heavy wax, so the night wash slides off them)
  if (fp > 0) fill(BG.f, cl([[x0 + 44, GB + 10], [x0 + 36 + ww, GB + 10], [x0 + 20 + ww, GB + 150], [x0 + 60, GB + 150]]), fo(K.yellow, sd + 30, { p: .62, ang: 1.52, gap: 13, w: 12, over: 3, draw: Fp(4) }));   // the lit window, pulled down into the wet paving
}
function drawLamp(x, tD) {
  const [lp, fp] = prog(x, tD); if (lp <= 0) return; const sd = 900 + Math.round(x);
  part(BG, tube([[x, FY - 34], [x, GB - 640], [x + 12, GB - 700], [x + 54, GB - 714]], 20, 15), fp > 0 ? fo(K.ink, sd, { p: 1, ang: 1.5, gap: 6, w: 8, draw: fp }) : null, lo(sd + 1, { w: 6, draw: lp }));
  part(BG, handCircle(x + 56, GB - 682, 30, sd + 2, .1, 30), fp > 0 ? fo(K.yellow, sd + 3, { p: 1, gap: 5, w: 8, draw: fp }) : null, lo(sd + 4, { w: 6, draw: lp }));
  if (fp > .5) for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2 + .2, r0 = 46, r1 = 82 + 20 * hash(sd + k);   // white-wax rays: invisible on paper, they glow once the wash goes over
    line(BG.l, [[x + 56 + Math.cos(a) * r0, GB - 682 + Math.sin(a) * r0], [x + 56 + Math.cos(a) * r1, GB - 682 + Math.sin(a) * r1]], { col: K.white, w: 8, p: 1, seed: sd + 10 + k, boil: .6, taper: .3 }); }
}
function drawTower() {
  const sd = 7700;
  part(BG, cl([[XT - 130, 70], [XT + 130, 70], [XT + 130, GB], [XT - 130, GB]]), fo(K.slate, sd, { ang: 1.4, cross: true, crossP: .6 }), lo(sd + 1));
  part(BG, cl([[XT - 165, 76], [XT, -190], [XT + 165, 76]]), fo(K.brown, sd + 2, { ang: .4 }), lo(sd + 3));
  part(BG, handCircle(XT, 240, 94, sd + 4, .08, 48), fo(K.yellow, sd + 5, { p: 1, gap: 7, w: 10 }), lo(sd + 6, { w: 9 }));
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; line(BG.l, [[XT + Math.sin(a) * 70, 240 - Math.cos(a) * 70], [XT + Math.sin(a) * 84, 240 - Math.cos(a) * 84]], lo(sd + 10 + k, { w: k % 3 ? 4 : 7 })); }
  const hh = (11 + 58 / 60) / 12 * Math.PI * 2, mm = 58 / 60 * Math.PI * 2;
  line(BG.l, [[XT, 240], [XT + Math.sin(hh) * 44, 240 - Math.cos(hh) * 44]], lo(sd + 30, { w: 11 })); line(BG.l, [[XT, 240], [XT + Math.sin(mm) * 66, 240 - Math.cos(mm) * 66]], lo(sd + 31, { w: 8 }));
  for (let k = 0; k < 3; k++) part(BG, cl([[XT - 50 + k * 40, 420], [XT - 26 + k * 40, 420], [XT - 26 + k * 40, 520], [XT - 50 + k * 40, 520]]), fo(K.yellow, sd + 40 + k, { p: 1, gap: 6, w: 8 }), lo(sd + 44 + k, { w: 5 }));
}
function chime(tD) {   // the chime, the way a child draws a sound: arcs that leave the clock on both sides, in yellow wax
  const u = tD - EV.chime; if (u <= 0 || u > .55) return;
  for (let k = 0; k < 3; k++) { const v = u - k * .09; if (v <= 0) continue; const r = 120 + 520 * v;
    for (const side of [-1, 1]) line(BG.l, ellipse(XT, 240, r, r, 20, side > 0 ? -.7 : Math.PI - .7, side > 0 ? .7 : Math.PI + .7), { col: k === 1 ? K.white : K.yellow, w: 12, p: 1, seed: 7800 + k * 7 + (side > 0 ? 0 : 3), boil: 1, draw: eo(v / .2) }); }
}
const PAVE = cl([[-3600, GB], [15200, GB], [15200, KERB], [-3600, KERB]]), ROAD = cl([[-3600, KERB], [15200, KERB], [15200, ROADB], [-3600, ROADB]]);
function drawGround(tD, x0, x1) {   // one strip for the whole page, so the hatching never seams; coloured up to the draw-on front
  const xb = X(7.5) + 1700, xa = Math.max(tInX(2.8), tInX(tD - .35)), xl = Math.max(tInX(2.8), tInX(tD + .1));
  const clipX = (Lr, xr, f) => { const g = Lr.g; g.save(); g.beginPath(); g.moveTo(-9e4, -9e4); g.lineTo(sx(xr) + 60 * CAM.s, -9e4); g.lineTo(sx(xr) + 60 * CAM.s, sy(GB)); g.lineTo(sx(xr) - 60 * CAM.s, sy(ROADB)); g.lineTo(-9e4, 9e4); g.closePath(); g.rect(sx(xb), -9e4, 9e5, 18e4); g.clip(); f(); g.restore(); };
  clipX(BG.f, xa, () => { fill(BG.f, PAVE, fo(K.slate, 4000, { p: .9, ang: .12, gap: 15, w: 13 })); fill(BG.f, ROAD, fo(K.ink, 4001, { p: .85, ang: .1, gap: 15, w: 14, over: 2 })); });
  clipX(BG.l, xl, () => { line(BG.l, [[-3600, GB], [Math.min(15200, x1 + 200), GB]], lo(4002, { w: 7 })); line(BG.l, [[-3600, KERB], [Math.min(15200, x1 + 200), KERB]], lo(4003, { w: 9 }));
    for (let cx = Math.floor(x0 / 230) * 230; cx < x1; cx += 230) line(BG.l, [[cx, GB + 6], [cx - 30, KERB - 6]], lo(4004 + cx / 23, { w: 5, p: .6 })); });   // paving joints
}
const tInX = t => 290 + (t - .5925) * 1450;   // inverse of tIn
function drawPuddle(p, tD) {
  const [lp, fp] = prog(p.x - p.rx, tD); if (lp <= 0) return; const poly = puddlePoly(p), sd = 6000 + Math.round(p.x);
  part(BG, poly, fp > 0 ? fo(K.ink, sd, { p: .85, ang: .05, gap: 8, w: 10, draw: fp }) : null, lo(sd + 1, { w: 6, draw: lp }));
  if (fp < 1) return;
  // the reflection: the signs above it, upside down, in heavy wax (the wash slides off them); a splash makes it wobble
  clear(REFL); const g = REFL.g, A = p.hero && tD > EV.splash ? 30 * Math.exp(-(tD - EV.splash) / .5) : 0;
  const yc = sy(p.y + 4);
  if (p.hero) [['24H', -110, K.orange], ['CAFE', 90, K.yellow]].forEach(([wd, dx, col], i) => {
    const wob = A * Math.sin(tD * 31 + i * 2);
    g.setTransform(1, 0, 0, -(1 - .25 * A / 30), 0, yc * (2 - .25 * A / 30));
    text(REFL, wd, sx(p.x + dx + wob), yc + 16 * CAM.s, { size: 84 * CAM.s, font: 'Gaegu', weight: 700, col, seed: sd + 5 + i, boil: 1, p: 1, stroke: 4 });
    g.setTransform(1, 0, 0, 1, 0, 0); });
  for (let k = 0; k < 5; k++) { const x = p.x - p.rx * .7 + k * p.rx * .35 + (p.hero ? A * Math.sin(tD * 27 + k) * .6 : 0);
    line(REFL, [[x, p.y - p.ry], [x + 3, p.y + p.ry]], { col: k % 2 ? K.yellow : K.orange, w: 16, p: .7, seed: sd + 10 + k, boil: .8, taper: .5, wob: .3 }); }
  g.save(); g.globalCompositeOperation = 'destination-in'; g.beginPath(); poly.forEach(([x, y], i) => i ? g.lineTo(sx(x), sy(y)) : g.moveTo(sx(x), sy(y))); g.closePath(); g.fill(); g.restore();
  BG.l.g.drawImage(REFL.c, 0, 0);
}

// ——— AKI in the picture-book hand: tube limbs on the rig's joints, a flared vermilion coat, a round head with a dot eye ———
function drawAki(C, J, o = {}) {
  const P = p => [p[0], FY + p[1]], sd = 8000;
  const lf = (s, x = {}) => ({ col: K.ink, w: 7, seed: sd + s, boil: 1, ...x }), ff = (col, s, x = {}) => ({ col, p: .9, ang: .7, gap: 8, w: 10, over: 4, seed: sd + s, boil: 1, ...x });
  const limb = (a, b, c, w0, w1, col, s, x = {}) => part(C, tube(curve([P(a), P(b), P(c)], 4), w0, w1), ff(col, s, x), lf(s + 1));
  const mitt = (wr, el, s) => { const [w, e] = [P(wr), P(el)], d = Math.hypot(w[0] - e[0], w[1] - e[1]) || 1, c = [w[0] + (w[0] - e[0]) / d * 14, w[1] + (w[1] - e[1]) / d * 14];
    part(C, handCircle(c[0], c[1], 17, sd + s, 0, 20), ff(K.peach, s, { p: .8, gap: 6, w: 8 }), lf(s + 1, { w: 6 })); return c; };
  const boot = (l, s) => { const a = P(l.ankle), pts = xf([[-16, -30], [-20, 0], [-16, 16], [40, 18], [58, 14], [60, 4], [48, -4], [20, -10], [16, -30]], { x: a[0], y: a[1], r: l.pitch });
    part(C, pts, ff(K.brown, s, { p: .95, gap: 6, w: 8, ang: .3 }), lf(s + 1)); };
  // far side first, then the near side over it (each part erases what it covers, as a child draws round the front one)
  const af = J.arm.f; limb(af.sh, af.el, af.wr, 40, 32, K.coat, 10, { p: 1 }); mitt(af.wr, af.el, 14);
  for (const [k, s] of [['f', 20], ['n', 40]]) { const l = J.leg[k]; boot(l, s + 6); limb(l.hip, l.knee, l.ankle, 52, 40, K.trou, s, { p: k === 'f' ? 1 : .88, ang: .4 }); }
  const nb = J.neckBase, pv = J.pelvis, uL = J.uL, fL = J.fL, hb = o.hemB || [0, 0];
  const T = (b, up, fw) => P([b[0] + uL[0] * up + fL[0] * fw, b[1] + uL[1] * up + fL[1] * fw]);
  part(C, tube([P(nb), P(J.neckTop)], 24, 22), ff(K.peach, 60, { p: .8, gap: 6, w: 8 }), lf(61));
  const back = T(pv, -78, -42); back[0] += hb[0] * .6; back[1] += hb[1] * .6;
  const coat = smooth([T(nb, -2, 16), T(nb, -4, -16), T(nb, -18, -32), T(J.waist, 0, -34), back, T(pv, -82, 40), T(J.waist, 0, 28), T(nb, -40, 30)], 3);
  part(C, coat, ff(K.coat, 70, { ang: .8, gap: 8, cross: true, crossP: .45 }), lf(71, { w: 8 }));
  line(C.l, [T(J.waist, 2, -32), T(J.waist, 2, 26)], lf(72, { w: 6 }));                        // belt
  for (const u of [-20, -48]) dab(C.l, ...T(J.waist, u + 26, 18), 4.5, { col: K.ink, p: .95, seed: sd + 73 + u, gap: 3, w: 4 });
  part(C, smooth([T(nb, 6, -20), T(nb, 8, 14), T(nb, -8, 22), T(nb, -10, -22)], 3), ff(K.cream, 74, { p: .85, gap: 5, w: 7 }), lf(75, { w: 6 }));   // roll-neck
  // head (profile, facing right): face, then the hair over the back of the head, the curved bangs, a warm-brown dot eye
  const hc = P(J.headC); hc[1] -= 6; const Hd = pts => xf(pts, { x: hc[0], y: hc[1], r: J.headA }), lag = o.hairLag || [0, 0];
  const face = smooth([[0, -40], [26, -35], [40, -18], [44, -4], [51, 5], [44, 12], [42, 24], [30, 38], [10, 45], [-14, 41], [-30, 27], [-37, 4], [-30, -22], [-16, -36]], 4);
  part(C, Hd(face), ff(K.peach, 80, { p: .62, gap: 7, w: 9 }), null);
  line(C.l, Hd(face.slice(Math.floor(face.length * 3 / 14), Math.floor(face.length * 10 / 14))), lf(81));
  const lx = clamp(lag[0] * .35, -26, 6), ly = clamp(lag[1] * .3, -12, 12);
  const hair = Hd([[12, -46], [-14, -50], [-38, -38], [-52, -10], [-54 + lx * .5, 22 + ly * .5], [-50 + lx, 54 + ly], [-34 + lx, 62 + ly], [-18 + lx * .6, 56 + ly * .6], [-12, 30], [-6, 8], [-10, -14], [8, -26]]);
  const hs = smooth(hair, 4);
  part(C, hs, ff(K.plum, 82, { p: .95, ang: 1.25, gap: 6, w: 9 }), null);
  line(C.l, hs.slice(0, Math.floor(hs.length * .62)), lf(83));                                   // outer edge only (an outline across the hair reads as a band)
  const bangs = smooth(Hd([[-14, -50], [14, -50], [36, -40], [47, -22], [44, -10], [33, -20], [22, -15], [12, -25], [-2, -18], [-10, -30]]), 3);
  part(C, bangs, ff(K.plum, 84, { p: .95, ang: 1.0, gap: 6, w: 8 }), null);
  line(C.l, bangs.slice(Math.floor(bangs.length * .3)), lf(85, { w: 6 }));
  const take = o.take, E = Hd([[25, -4]])[0];
  if (o.blink) line(C.l, Hd([[19, -3], [31, -3]]), lf(86, { w: 5 }));
  else if (take) { line(C.l, Hd(ellipse(25, -4, 8, 9, 16)), lf(86, { w: 4.5, closed: true })); dab(C.l, E[0], E[1], 4, { col: K.brown, p: 1, seed: sd + 87, gap: 3, w: 4 }); }
  else { dab(C.l, E[0], E[1], 6, { col: K.brown, p: 1, seed: sd + 87, gap: 3, w: 4 }); dab(C.l, ...Hd([[26.6, -6.4]])[0], 1.8, { col: K.white, p: 1, seed: sd + 88, gap: 2, w: 3 }); }
  line(C.l, Hd(take ? [[15, -22], [24, -27], [33, -24]] : [[16, -15], [24, -18], [33, -16]]), lf(89, { w: 5, col: K.plum }));
  dab(C.l, ...Hd([[19, 14]])[0], 7, { col: K.rose, p: .55, seed: sd + 90, sq: .7 });
  if (take) dab(C.l, ...Hd([[39, 24]])[0], 4.5, { col: K.ink, p: .9, seed: sd + 91, gap: 3, w: 4 }); else line(C.l, Hd([[34, 23], [41, 22]]), lf(91, { w: 4.5 }));
  if (take) for (let k = 0; k < 3; k++) line(C.l, Hd([[44 + k * 10, -52 - k * 4], [52 + k * 13, -66 - k * 6]]), lf(92 + k, { w: 5 }));   // three little "oh no" lines
  // near arm over the coat, with the gold watch on the (left) wrist
  const an = J.arm.n; limb(an.sh, an.el, an.wr, 42, 34, K.coat, 100, { p: .92 });
  const h = mitt(an.wr, an.el, 104), w = P(an.wr), e = P(an.el), d = Math.hypot(w[0] - e[0], w[1] - e[1]) || 1, wc = [w[0] - (w[0] - e[0]) / d * 6, w[1] - (w[1] - e[1]) / d * 6];
  const R0 = (o.watch || 0) > .3 ? 13 : 10;
  part(C, handCircle(wc[0], wc[1], R0, sd + 106, 0, 18), ff(K.yellow, 106, { p: 1, gap: 4, w: 6 }), lf(107, { w: 4, col: K.orange }));
  dab(C.l, wc[0], wc[1], R0 * .45, { col: K.white, p: 1, seed: sd + 108, gap: 2, w: 3 });
  return { hand: h, watch: wc };
}

// ——— the inset: a round picture on the page of what she looks at — her wrist and the watch, big ———
function drawInsetFrame(tD) {
  const lp = seg(tD, 6.72, 7.12), fp = seg(tD, 6.95, 7.35); if (lp <= 0) return;
  const circ = handCircle(XI, YI, RI, 9100, .06, 64);
  part(BG, circ, null, { col: K.ink, w: 11, seed: 9101, boil: .6, draw: lp });
  line(BG.l, handCircle(XI, YI, RI - 16, 9102, .04, 64), { col: K.white, w: 14, p: 1, seed: 9103, boil: .6, draw: lp });   // white-wax rim: the frame glows once the wash is over it
  if (fp <= 0) return;
  erase(BG.f, circ);   // the round picture covers the roofs it is drawn over (lines were already erased by part)
  // the street lights streaking past behind her arm (she is running): heavy yellow / orange / rose wax, redrawn each step
  for (let k = 0; k < 9; k++) { const yy = YI - 230 + k * 56 + (hash(k * 3.3) - .5) * 20, ch = Math.sqrt(Math.max(0, RI * RI - (yy - YI) ** 2)) - 28; if (ch < 40) continue;
    const len = 140 + hash(k * 5.1) * 240, per = 2 * ch + len, x1 = XI + ch - ((tD * 1300 + hash(k * 7.7) * per) % per) + len, a = Math.max(x1 - len, XI - ch), b = Math.min(x1, XI + ch);
    if (b - a > 30) line(BG.l, [[a, yy], [b, yy + 4]], { col: [K.yellow, K.orange, K.rose][k % 3], w: 16 + hash(k) * 8, p: 1, seed: 9110 + k, boil: 1, draw: fp, taper: .3 }); }
}
function drawInsetArm(C, tD) {
  const fp = seg(tD, 7.0, 7.45); if (fp <= 0) return;
  const kk = Math.floor((tD - FIRST_STEP) * CADENCE) % 2, dy = kk ? -10 : 10, rr = kk ? -.03 : .025;   // two key drawings alternate on her steps
  const L = pts => xf(pts, { x: XI, y: YI + dy, r: rr }), sd = 9200;
  const lf = (s, x = {}) => ({ col: K.ink, w: 9, seed: sd + s, boil: 1, draw: fp, ...x }), ff = (col, s, x = {}) => ({ col, p: .92, ang: .9, gap: 9, w: 11, over: 5, seed: sd + s, boil: 1, draw: fp, ...x });
  part(C, tube(L([[-520, 120], [-260, 76], [-70, 34]]), 160, 132), ff(K.coat, 0, { ang: .75, gap: 10 }), lf(1));                    // sleeve, coming in from outside the frame
  line(C.l, L([[-300, 40], [-170, 30]]), lf(12, { w: 6, p: .7 })); line(C.l, L([[-330, 128], [-200, 104]]), lf(14, { w: 6, p: .7 }));   // two folds
  part(C, cl(L([[-80, -36], [-38, -42], [-34, 92], [-76, 102]])), ff(K.cream, 2, { p: .85, ang: 1.4, gap: 6, w: 8 }), lf(3));        // knit cuff (a band)
  for (let k = 0; k < 4; k++) line(C.l, L([[-66 + k * 8, -24 + k * 1.5], [-62 + k * 8, 84 - k * 1.5]]), lf(18 + k, { w: 4, p: .6 }));   // its ribs
  part(C, tube(L([[-30, 24], [92, 6]]), 104, 96), ff(K.peach, 15, { p: .75, gap: 7, w: 9 }), lf(16));                                  // wrist
  part(C, smooth(L([[84, -46], [150, -54], [214, -40], [246, -6], [240, 30], [206, 52], [150, 56], [100, 50], [84, 36]]), 4), ff(K.peach, 4, { p: .8, gap: 7, w: 9 }), lf(5));   // a mitten hand…
  part(C, tube(L([[112, -38], [158, -56], [204, -52]]), 40, 32), ff(K.peach, 6, { p: .8, gap: 6, w: 8 }), lf(7));                    // …the thumb wrapped along the top
  for (let k = 0; k < 3; k++) line(C.l, L([[200 + k * 3, -24 + k * 22], [238 - k * 4, -16 + k * 22]]), lf(22 + k, { w: 5, p: .8 }));   // curled fingers
  part(C, cl(L([[4, -88], [52, -92], [56, 86], [8, 90]])), ff(K.brown, 8, { p: .95, ang: 1.5, gap: 7, w: 9 }), lf(9));                  // strap
  const c = L([[30, 0]])[0], r = 66;
  part(C, handCircle(c[0], c[1], r, sd + 10, .05, 40), ff(K.yellow, 10, { p: 1, gap: 6, w: 9 }), lf(11, { w: 10, col: K.orange }));    // gold case
  const dial = handCircle(c[0], c[1], r * .76, sd + 12, 0, 40); erase(C.f, dial); erase(C.l, dial); part(C, dial, null, lf(13, { w: 5 }));   // the dial is bare paper
  if (fp < 1) return;
  [['12', 0], ['3', 1], ['6', 2], ['9', 3]].forEach(([n, i]) => { const a = i / 4 * Math.PI * 2, q = [c[0] + Math.sin(a) * r * .55, c[1] - Math.cos(a) * r * .55];
    text(C.l, n, sx(q[0]), sy(q[1]) + 9 * CAM.s, { size: 25 * CAM.s, font: 'Patrick Hand', col: K.ink, seed: sd + 20 + i, boil: 1, stroke: 1 }); });
  const sec = 41 + Math.floor(tD - EV.watchHit), mm = 58 + sec / 60;
  const hand = (a, l, w, col, s, tail = 0) => line(C.l, [[c[0] - Math.sin(a) * tail, c[1] + Math.cos(a) * tail], [c[0] + Math.sin(a) * l, c[1] - Math.cos(a) * l]], { col, w, p: 1, seed: sd + s, boil: 1, taper: .15 });
  hand((11 + mm / 60) / 12 * Math.PI * 2, r * .36, 9, K.ink, 30); hand(mm / 60 * Math.PI * 2, r * .58, 7, K.ink, 31); hand(sec / 60 * Math.PI * 2, r * .64, 4, K.coat, 32, 12);
  dab(C.l, c[0], c[1], 5, { col: K.ink, p: 1, seed: sd + 33, gap: 2, w: 3 });
  for (const [u, v, s] of [[-30, -22, 8], [22, 30, 6], [34, -38, 5]]) { line(C.l, handCircle(c[0] + u, c[1] + v, s, sd + 40 + u, 0, 14), { col: K.slate, w: 3, p: 1, seed: sd + 41 + u, boil: 1, closed: true }); dab(C.l, c[0] + u - s * .3, c[1] + v - s * .3, s * .3, { col: K.white, p: 1, seed: sd + 42 + u, gap: 2, w: 2 }); }   // raindrops on the crystal
}

// ——— rain, splashes ———
function rain(L, tD, n, o = {}) {   // white wax (invisible on paper until the wash goes over it); a fresh drawing on every step
  const st = Math.floor(tD * 15 + 1e-6), s0 = o.seed || 0;
  for (let i = 0; i < n; i++) { const z = hash(i * 9.7 + s0), sp = 1500 + z * 900, y = ((hash(i * 2.1 + s0) * 1300 + tD * sp) % 1300) - 110, x = ((hash(i * 3.7 + s0) * 2240 - y * .22) % 2240 + 2240) % 2240 - 160, len = (o.len || 46) * (.6 + z * .9);
    line(L, [toW(x, y), toW(x - len * .22, y + len)], { col: K.white, w: (o.w || 4.5) * (.7 + z * .6), p: 1, seed: i * 3.1 + st + s0, wob: .2, taper: .2, streak: 0 }); }
}
function puddleRings(L, p, tD) {
  for (let k = 0; k < 8; k++) { const per = .5, ph = hash(k * 4.3) * per, age = ((tD + ph) % per) / per, cyc = Math.floor((tD + ph) / per);
    const cx = p.x + (hash(k * 7.1 + cyc) - .5) * 1.5 * p.rx, cy = p.y + (hash(k * 5.3 + cyc) - .5) * .9 * p.ry;
    line(L, ellipse(cx, cy, 10 + 46 * age, 3 + 11 * age, 22), { col: K.white, w: 4, p: 1, seed: 6100 + k + cyc * 13, closed: true, wob: .2 }); }
}
function splash(L, tD, ids) {
  for (const c of RUN.contacts) { const u = tD - c.t0, hero = c === SPL; if (u < 0 || u > (hero ? .7 : .38) || !ids(c)) continue; const p0 = [c.x + 24, FY - 4];
    const n = hero ? 16 : 6;
    for (let j = 0; j < n; j++) { const a = Math.PI * (.15 + .7 * hash(j * 7.1 + c.t0)), sp = (hero ? 520 : 300) * (.55 + .6 * hash(j * 3.3 + c.t0)), x = p0[0] + Math.cos(a) * sp * u * (hash(j) < .5 ? -1 : 1) * .9, y = p0[1] - Math.sin(a) * sp * u * 1.6 + 1700 * u * u;
      if (y > p0[1] + 6) continue; dab(L, x, y, (hero ? 9 : 6) * (.7 + .5 * hash(j * 1.9)), { col: j % 3 ? K.white : K.slate, p: 1, seed: 6200 + j + c.t0 * 10, gap: 3, w: 4 }); }
    if (hero && u < .28) for (let j = 0; j < 7; j++) { const a = Math.PI * (.12 + .76 * j / 6), r0 = 40, r1 = 40 + 150 * eo(u / .28);   // splash lines
      line(L, [[p0[0] + Math.cos(a) * r0, p0[1] - Math.sin(a) * r0 * .8], [p0[0] + Math.cos(a) * r1, p0[1] - Math.sin(a) * r1 * .8]], { col: K.white, w: 7, p: 1, seed: 6300 + j, taper: .4 }); }
    for (let k = 0; k < (hero ? 2 : 1); k++) { const v = u - k * .14; if (v > 0) line(L, ellipse(p0[0], p0[1] + 10, 40 + (hero ? 330 : 160) * v, 10 + (hero ? 60 : 28) * v, 30), { col: K.white, w: 5, p: 1, seed: 6400 + k, closed: true, wob: .3 }); } }
}

// ——— one frame ———
let comp;
function frame(t) {
  const step = Math.floor(t * 15 + 1e-6), tD = step / 15 + 1 / 30;   // the drawing is replaced 15 times a second (on twos at 30 fps)
  BOIL.step = step; BOIL.amp = 1;
  [CAM.x, CAM.y, CAM.s] = camAt(t);
  const id = shotAt(t)[2];
  clearGroup(BG); clearGroup(AK); [RAIN, WASH, FX].forEach(clear);
  const [vx0, vx1, vy0, vy1] = view(150);
  // the page, back to front
  for (const c of CLOUDS) if (inView(c.x - c.rx, c.x + c.rx, c.y - c.ry * 2, c.y + c.ry)) { const [lp, fp] = prog(c.x - c.rx, tD); if (lp <= 0) continue; const poly = cloudPoly(c);
    part(BG, poly, fp > 0 ? fo(K.slate, c.sd, { p: .85, ang: .2, gap: 11, draw: fp, cross: true, crossP: .5 }) : null, lo(c.sd + 1, { w: 7, draw: lp }));
    if (fp > .5) line(BG.l, poly.slice(21, 39), { col: K.white, w: 12, p: 1, seed: c.sd + 2, boil: .6 }); }       // lit edge in white wax
  for (const b of BACK) if (inView(b.x0, b.x1, b.top, GB)) { part(BG, cl([[b.x0, b.top], [b.x1, b.top], [b.x1, GB], [b.x0, GB]]), fo(b.col, b.sd, { ang: 1.4, cross: true, crossP: .5 }), lo(b.sd + 1));
    for (let yy = b.top + 50; yy < GB - 700; yy += 110) for (let xx = b.x0 + 40; xx < b.x1 - 80; xx += 110) if (hash(xx * .13 + yy) < .6) part(BG, cl([[xx, yy], [xx + 54, yy], [xx + 54, yy + 64], [xx, yy + 64]]), fo(K.yellow, b.sd + xx + yy, { p: 1, gap: 6, w: 8 }), lo(b.sd + xx + yy + 1, { w: 4 })); }
  if (inView(XT - 170, XT + 170, -200, GB)) drawTower();
  for (const s of SHOPS) if (inView(s.x0 - 30, s.x1 + 30, s.top - s.gh, GB + 300)) drawShop(s, tD);
  drawGround(tD, vx0, vx1);
  for (const p of PUDDLES) if (inView(p.x - p.rx, p.x + p.rx, p.y - p.ry, p.y + p.ry)) drawPuddle(p, tD);
  for (const x of LAMPS) if (inView(x - 40, x + 140, GB - 760, FY)) drawLamp(x, tD);
  if (inView(XI - RI, XI + RI, YI - RI, YI + RI)) drawInsetFrame(tD);
  if (id === 'S4' || t > 9.3) chime(tD);
  // white wax under the wash: the rain, the rings on the puddle
  rain(RAIN, tD, id === 'S1' ? 120 : 110);
  if (id === 'S1') puddleRings(RAIN, PUDDLES[0], tD);
  drawWash(t);
  // AKI (after the wash: the figure keeps the paper white behind her)
  if (id === 'S1' && tD > .3 && tD < 1.9) { const S = poseAt(tD), J = solveProfile(S), sc = secondary(q => { const p = RUN.pelvisAt(q); return [p[0], p[1] - 250]; }, 0, tD); drawAki(AK, J, { hemB: sc.hemB, hairLag: sc.hair.back }); }
  if (id === 'S2' || (id === 'S3' && t < 7.75)) { const S = poseAt(t), J = solveProfile(S), sc = secondary(q => { const p = RUN.pelvisAt(q); return [p[0], p[1] - 250]; }, 0, t);
    drawAki(AK, J, { hemB: sc.hemB, hairLag: sc.hair.back, watch: S.watch, take: t >= 6.45 && t < 7.4, blink: [3.6, 5.2].some(b => t >= b && t < b + .1) }); }
  if (inView(XI - RI, XI + RI, YI - RI, YI + RI)) { clearGroup(INS); drawInsetArm(INS, tD);      // the inset's picture stays inside its round frame
    const circ = handCircle(XI, YI, RI - 6, 9100, 0, 64); for (const Lr of [INS.k, INS.f, INS.l]) { const g = Lr.g; g.save(); g.globalCompositeOperation = 'destination-in'; g.beginPath(); circ.forEach(([x, y], i) => i ? g.lineTo(sx(x), sy(y)) : g.moveTo(sx(x), sy(y))); g.closePath(); g.fill(); g.restore(); } }
  // front rain and the splashes, over her
  rain(FX, tD, 26, { seed: 50, w: 6, len: 70 });
  if (id === 'S1') splash(FX, tD, c => c === SPL || Math.abs(c.t0 - SPL.t0) < .5);
  if (id === 'S2') splash(FX, tD, c => c !== SPL);
  // composite: paper → page crayon → white wax → the wash (resisted by the wax) → AKI → front rain and drops
  comp.paperCam(CAM.x * .6, CAM.y * .6, CAM.s / .6);
  comp.begin(PAPER);
  comp.group(BG, { goff: [0, 0] });
  comp.crayon(RAIN.c, { goff: [0, 0] });
  comp.wash(WASH.c, { color: WASHC });
  const go = [hash(step) * 300, hash(step + 7) * 300];
  comp.group(AK, { goff: go });
  if (inView(XI - RI, XI + RI, YI - RI, YI + RI)) comp.group(INS, { goff: go });
  comp.crayon(FX.c, { goff: go });
  comp.finish({ vig: .3, emb: .55 });
}

// the night wash: two broad ultramarine bands over the whole page (sky darker), bristle streaks, pigment pooled at the edges.
// It is anchored to the page; in the first 0.36 s its wet leading edge is still crossing the puddle shot, revealing the rain.
const BANDS = [{ y0: -1400, y1: 945, d: .86, seed: 3 }, { y0: 870, y1: 2600, d: .7, seed: 7 }];
function drawWash(t) {
  const g = WASH.g; g.save(); g.setTransform(CAM.s, 0, 0, CAM.s, W2 - CAM.x * CAM.s, H2 - CAM.y * CAM.s);
  const [vx0, vx1, vy0, vy1] = view(260), sweep = t < .36, front = lerp(vx0 + (vx1 - vx0) * .3, vx1 + 400, eo(t / .36)), FX_ = y => front + 60 * Math.sin(y * .006) + 14 * Math.sin(y * .05);
  if (sweep) { g.beginPath(); g.moveTo(vx0 - 100, vy0 - 300); for (let y = vy0 - 300; y <= vy1 + 300; y += 20) g.lineTo(FX_(y), y); g.lineTo(vx0 - 100, vy1 + 300); g.closePath(); g.clip(); }
  const gx0 = Math.floor(vx0 / 40) * 40;
  for (const b of BANDS) { if (b.y1 < vy0 || b.y0 > vy1) continue;
    const sh = new Path2D(); for (let x = gx0; x <= vx1 + 40; x += 40) { const y = b.y0 + 12 * (Math.sin(x * .006 + b.seed) + .6 * Math.sin(x * .017 + b.seed * 3)) + 12 * hash(x * .37 + b.seed); x === gx0 ? sh.moveTo(x, y) : sh.lineTo(x, y); }
    for (let x = Math.floor((vx1 + 40) / 40) * 40; x >= gx0; x -= 40) sh.lineTo(x, b.y1 + 14 * (Math.sin(x * .005 + b.seed * 2) + .5 * Math.sin(x * .019 + b.seed)) + 14 * hash(x * .71 + b.seed));
    sh.closePath(); g.fillStyle = '#000'; g.globalAlpha = b.d; g.fill(sh);
    g.save(); g.clip(sh); const gs = Math.floor(vx0 / 60) * 60;
    for (let i = 0; i < 30; i++) { const yy = lerp(b.y0, b.y1, hash(b.seed * 97 + i * 1.7)), wdt = 6 + hash(i * 2.3 + b.seed) * 30, dark = hash(i * 4.1 + b.seed) < .55;
      if (yy < vy0 - 60 || yy > vy1 + 60) continue;
      g.beginPath(); for (let x = gs; x <= vx1 + 60; x += 60) { const y = yy + 14 * Math.sin(x * .002 + i) + 6 * Math.sin(x * .01 + i * 2); x === gs ? g.moveTo(x, y) : g.lineTo(x, y); }
      g.lineWidth = dark ? wdt : wdt * .5; g.globalCompositeOperation = dark ? 'source-over' : 'destination-out'; g.globalAlpha = dark ? .14 + hash(i * 5.9) * .12 : .05 + hash(i * 6.7) * .07; g.strokeStyle = '#000'; g.stroke(); }
    g.globalCompositeOperation = 'source-over'; g.restore(); }
  if (sweep) { g.beginPath(); for (let y = vy0 - 100; y <= vy1 + 100; y += 16) { const x = FX_(y) - 16; y === vy0 - 100 ? g.moveTo(x, y) : g.lineTo(x, y); } g.lineWidth = 34; g.globalAlpha = .3; g.strokeStyle = '#000'; g.stroke(); }   // the wet front
  g.restore(); g.globalAlpha = 1;
}

comp = makeComp(document.getElementById('gl'));
await Promise.all(['700 40px Gaegu', '400 40px "Patrick Hand"'].map(f => document.fonts.load(f)));
window.DUR = DUR; window.render = t => frame(t);
window.RIGQA = t => { const id = shotAt(t)[2]; if (id === 'S1') { const tD = Math.floor(t * 15 + 1e-6) / 15 + 1 / 30; if (tD <= .3 || tD >= 1.9) return null; const J = solveProfile(poseAt(tD)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; }
  if (id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
