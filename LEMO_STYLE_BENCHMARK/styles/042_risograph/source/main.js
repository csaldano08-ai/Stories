// 042 · Risograph Print — the first 10 s of "Last Train Home" printed frame by frame with three translucent spot inks on
// warm paper (lemo-opuscar styles/risograph): night blue (carries every silhouette alone), red, sunflower; every other colour
// is an overprint or a stepped halftone tint; plates misregister (fixed offsets per shot, kicks on accents, a drift through
// the held moment that snaps back on the downbeat); grain and pinholes from the print shader (engine/riso.js, unchanged).
// One drawing canvas per frame where each channel is one plate's density (engine/draw.js, unchanged): source-over knocks out,
// 'lighter' overprints. AKI acts on twos (12 fps) with a paper-white knockout halo; camera moves on ones.
//   S1 0–2.5    low on the café and its puddle: only the blue and sunflower plates are on the machine; AKI's coat and the
//               CAFE sign are blank paper (+ a blue tint) until the RED PLATE rolls in on the splash (0.9375 s, a
//               registration kick). The puddle is the engine's reflection with each plate wobbling on its own phase.
//   S2 2.5–7.5  wide lateral tracking, a small figure, a big sky in stepped blue tints and one flat sunflower disc (the moon);
//               shopfronts as blue silhouettes, sunflower windows, red signs; lamps throw sunflower tints that overprint.
//               6.05–7.15 she lifts the wrist to her watch.
//   S3 7.5–9.4  match cut on a flat shape: the moon disc becomes the watch face (same place, same size), the composition
//               settles: the red sleeve, the disc, blue hands at 23:58, the red second hand stepping at 8.4 and 9.4; the
//               plates drift apart through the held moment …
//   S4 9.4–10   … match cut to the station clock disc and a pull back to the skyline; on the chime (9.575) the plates
//               snap back into register with a kick.
// Page contract: window.render(t), DUR, READY, RIGQA.
import { makeRiso } from './engine/riso.js';
import { W, H, plate, g, clear, text, layer, over, circle, ellipse, rect, rrect, poly, blob, line, curve, ring, limb } from './engine/draw.js';
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

const out = document.getElementById('c');
const print = makeRiso(out, W, H);
await Promise.all(['500 40px Jost', '700 40px Jost', '800 40px Jost'].map(f => document.fonts.load(f)));
const INKS = [[61, 85, 136], [255, 102, 94], [255, 181, 17]];        // night blue, red, sunflower
// recipes (densities on [blue, red, sunflower]); every main colour holds some blue so a one-ink print still reads
const C = {
  sky0: [1, 0, 0], sky1: [.62, 0, 0], sky2: [.42, 0, 0], sky3: [.24, 0, 0], night: [1, 0, 0], wall: [.86, 0, 0], wall2: [.72, .18, 0],
  win: [0, 0, 1], winD: [.3, 0, 1], sign: [.15, 1, 0], coat: [.22, 1, 0], coatD: [.5, 1, 0], trou: [1, .22, 0], boot: [1, .9, 0],
  skin: [0, .12, .2], hair: [.9, .55, 0], watch: [0, 0, 1], pave: [.55, 0, 0], pave2: [.38, 0, 0], moon: [0, 0, 1],
};
const SET = (M) => g.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
const cam = (cx, cy, z) => [z, 0, 0, z, 960 - cx * z, 540 - cy * z];

// ───────── AKI: capsules and flat shapes from the run rig (screen = M · rig)
function aki(M, tq, k, o = {}) {
  const S_ = poseAt(tq), J = solveProfile(S_), red = o.red ?? 1;
  const P = p => [M[0] * p[0] + M[2] * p[1] + M[4], M[1] * p[0] + M[3] * p[1] + M[5]];
  const s = Math.hypot(M[0], M[1]);
  const coat = red ? C.coat : [.22, 0, 0], coatD = red ? C.coatD : [.5, 0, 0], sk = red ? C.skin : [0, 0, .2];
  g.setTransform(1, 0, 0, 1, 0, 0);
  const leg = (kk, far) => { const l = J.leg[kk];
    limb(P(l.hip), P(l.knee), 46 * s, far ? [1, .5, 0] : C.trou); limb(P(l.knee), P(l.ankle), 36 * s, far ? [1, .5, 0] : C.trou);
    const c = Math.cos(l.pitch), sn = Math.sin(l.pitch), F = ([u, v]) => P([l.ankle[0] + u * c - v * sn, l.ankle[1] + u * sn + v * c]);
    poly([F([-20, -30]), F([14, -30]), F([18, -6]), F([66, 4]), F([68, 16]), F([-22, 16])], C.boot); };
  const arm = (kk, far) => { const a = J.arm[kk];
    limb(P(a.sh), P(a.el), 30 * s, far ? coatD : coat); limb(P(a.el), P(a.wr), 26 * s, far ? coatD : coat);
    circle(...P([a.wr[0] + (a.wr[0] - a.el[0]) * .18, a.wr[1] + (a.wr[1] - a.el[1]) * .18]), 13 * s, sk);
    if (!far && S_.watch > .3) circle(...P([a.wr[0] - (a.wr[0] - a.el[0]) * .12, a.wr[1] - (a.wr[1] - a.el[1]) * .12]), 11 * s, C.watch); };
  const TT = (b, u, f) => P([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
  const hc = J.headC, HR = q => { const c = Math.cos(J.headA), sn = Math.sin(J.headA); return P([hc[0] + q[0] * c - q[1] * sn, hc[1] + q[0] * sn + q[1] * c]); };
  // ponytail (a travelling sine wave), far arm, far leg, coat, near leg, head, near arm
  const wv = Math.sin(tq * TAU * CADENCE * .5);
  curve([HR([-40, -12]), HR([-80, -6 + 8 * wv]), HR([-118, 4 - 10 * wv]), HR([-150, 10 + 8 * wv])], 22 * s, C.hair);
  arm('f', 1); leg('f', 1);
  blob([TT(J.neckBase, 6, -26), TT(J.waist, 0, -42), TT(J.pelvis, -104, -60), TT(J.pelvis, -110, 54), TT(J.waist, 0, 36), TT(J.neckBase, -6, 28)], coat);
  leg('n', 0);
  blob([HR([18, -42]), HR([36, -18]), HR([44, -2]), HR([38, 10]), HR([34, 34]), HR([10, 46]), HR([-30, 40]), HR([-50, 8]), HR([-44, -26]), HR([-20, -48])], sk);
  blob([HR([22, -44]), HR([0, -56]), HR([-32, -50]), HR([-54, -20]), HR([-54, 14]), HR([-38, 36]), HR([-20, 30]), HR([-12, 0]), HR([2, -26])], C.hair);
  circle(...HR([24, -10]), 4.5 * s, C.night);
  arm('n', 0);
  return J;
}

// ───────── S1: the café and its puddle (close, low)
const K1 = 1.0, GY1 = 840, PX1 = 900;
const M1 = (camM) => { const B = [K1, 0, 0, K1, PX1 - SPL.x * K1, GY1]; return [camM[0] * B[0], 0, 0, camM[3] * B[3], camM[0] * B[4] + camM[4], camM[3] * B[5] + camM[5]]; };
function shotPuddle(t) {
  const CM = cam(PX1 + 120 + 9 * t, 560, 1.2), red = t >= SPL.t0 ? 1 : 0;
  clear(); SET(CM);
  rect(-400, -600, 3000, 1500, C.wall);                                         // the café wall
  rect(380, 330, 760, 400, C.win);                                               // its window (sunflower)
  over(() => { for (let x = 380; x < 1140; x += 190) rect(x, 330, 10, 400, [.6, 0, 0]); rect(380, 520, 760, 10, [.6, 0, 0]); });
  rect(1260, 360, 200, 480, C.night);                                            // the door
  rrect(500, 150, 520, 140, 12, red ? C.sign : [.2, 0, 0]);                      // the sign: paper until the red plate arrives
  text('CAFE', 760, 254, '800 118px Jost', [0, 0, 0], 'center', 'alphabetic', 14);
  rect(1520, 190, 240, 110, red ? [.1, .9, 0] : [.18, 0, 0]); text('24H', 1640, 278, '800 88px Jost', [0, 0, 0], 'center', 'alphabetic', 6);
  rect(-400, GY1, 3000, 600, C.pave);                                            // the pavement edge
  // lamp light from the café window, overprinted on the pavement
  g.beginPath(); g.moveTo(380, GY1); g.lineTo(1140, GY1); g.lineTo(1300, GY1 + 300); g.lineTo(260, GY1 + 300); g.closePath(); g.fillStyle = 'rgb(56,0,64)'; g.fill();   // the window's light on the pavement: less blue, a sunflower tint
  // AKI's legs (on twos) with a paper halo; the splash
  layer(() => aki(M1(CM), twos(t), K1, { red }), 6);
  SET(CM);
  const u = t - SPL.t0;
  if (u > 0 && u < .55) { const fx = PX1 + 40, k = Math.min(1, u * 8); for (let i = -3; i <= 3; i++) { const h = (90 + 40 * Math.cos(i)) * k * (1 - u * 1.4); poly([[fx + i * 26 - 12, GY1 + 4], [fx + i * 34, GY1 - h], [fx + i * 26 + 12, GY1 + 4]], [0, 0, 0]); }
    for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i / 7 - .5) * 2.4, r = 140 * u * 2.4, x = fx + Math.cos(a) * r, y = GY1 - 40 + Math.sin(a) * r * .8 + 900 * u * u; circle(x, y, 9, [0, 0, 0]); ring(x, y, 9, 3, [.6, 0, 0]); } }
  const wy = (GY1 + 6 - 560) * 1.2 + 540, amp = 5 + 14 * (u > 0 ? Math.exp(-u * 2) : 0);
  const kick = u > 0 && u < .3 ? 12 * Math.exp(-u * 14) * Math.cos(u * 60) : 0;
  return { seed: 3, sheet: 1, off: [[0, 0], [3 + kick, -2], [-3, 2 - kick * .6]], inks: INKS, gate: [1, 1, 1], sweep: [1e5, red ? lerp(0, 2400, clamp(u / .3)) : -200, 1e5],
    water: { y: wy, b: 1080, amp, t, sep: .3 + .4 * (u > 0 ? Math.exp(-u * 2) : 0), refl: .62 } };
}

// ───────── S2: the street (wide lateral tracking, small figure, a big sky)
const K2 = .4, GY2 = 790, PX2 = 300;
const Xs = t => PX2 + (X(t) - X(2.5)) * K2;
const SHOPS = []; { const R = mulberry(4); let x = -200; const N = ['BAKERY', 'BOOKS', 'NOODLES', 'BAR', 'FLOWERS', 'HOTEL', 'RECORDS', 'LAUNDRY', 'NEWS', 'TOYS', 'PHARMACY']; let i = 0; while (x < 4200) { const w = 300 + R() * 160, h = 230 + R() * 160; SHOPS.push({ x, w, h, name: N[i++ % N.length], wins: 1 + (R() * 3 | 0) }); x += w + 26; } }
const FAR = []; { const R = mulberry(9); let x = -400; while (x < 3200) { const w = 80 + R() * 140, h = 120 + R() * 220; FAR.push({ x, w, h }); x += w + 4; } }
const MOON = { x: 1300, y: 260, r: 150 };
function shotStreet(t) {
  const cx = Xs(t) + 200, CM = cam(cx, 540, 1);
  clear(); g.setTransform(1, 0, 0, 1, 0, 0);
  // sky in stepped blue tints, a flat sunflower moon knocked out of it
  rect(0, 0, W, 170, C.sky0); rect(0, 170, W, 140, C.sky1); rect(0, 310, W, 140, C.sky2); rect(0, 450, W, 400, C.sky3);
  circle(MOON.x - (cx - Xs(2.5)) * .02, MOON.y, MOON.r, C.moon);
  // far skyline (parallax 0.4)
  g.setTransform(1, 0, 0, 1, 960 - cx * .4, 0);
  for (const f of FAR) rect(f.x, GY2 - 40 - f.h, f.w, f.h + 40, [.62, 0, 0]);
  SET(CM);
  for (const s of SHOPS) {
    rect(s.x, GY2 - s.h, s.w, s.h, C.wall);
    for (let k = 0; k < s.wins; k++) { const ww = (s.w - 60) / s.wins - 20; rect(s.x + 30 + k * (ww + 20), GY2 - s.h + 110, ww, s.h - 180, C.win); }
    rect(s.x + 16, GY2 - s.h + 30, s.w - 32, 56, C.sign); text(s.name, s.x + s.w / 2, GY2 - s.h + 74, '800 40px Jost', [0, 0, 0], 'center', 'alphabetic', 4);
  }
  rect(-600, GY2, 6000, 400, C.pave); rect(-600, GY2 + 120, 6000, 300, C.pave2);
  // lamps: blue posts, sunflower heads, a sunflower tint overprinted below each
  for (let x = 120; x < 4400; x += 640) {
    g.beginPath(); g.moveTo(x - 60, GY2); g.lineTo(x + 60, GY2); g.lineTo(x + 170, GY2 + 120); g.lineTo(x - 170, GY2 + 120); g.closePath(); g.fillStyle = 'rgb(40,0,56)'; g.fill();   // a pool of lamplight knocked out of the pavement
    rect(x - 5, GY2 - 320, 10, 320, C.night); circle(x, GY2 - 330, 18, C.win);
  }
  const Mk = [K2, 0, 0, K2, Xs(2.5) - X(2.5) * K2 - (cx - 960), GY2];
  layer(() => aki(Mk, twos(t), K2), 5);
  // footfall splashes: small paper crowns
  SET(CM);
  for (const c of RUN.contacts) { const u = t - c.t0; if (u < 0 || u > .2 || c.t0 < 2.5) continue; const fx = PX2 + (c.x - X(2.5)) * K2 + 12; for (let i = -2; i <= 2; i++) poly([[fx + i * 10 - 5, GY2 + 2], [fx + i * 14, GY2 - 30 * (1 - u * 4)], [fx + i * 10 + 5, GY2 + 2]], [0, 0, 0]); }
  return { seed: 7, sheet: 2, off: [[0, 0], [4, -3], [-3, 3]], inks: INKS };
}

// ───────── S3: the watch (match cut from the moon disc); S4: the station clock
const AH = -Math.PI / 2 + (11 + 58 / 60) / 12 * TAU, AM = -Math.PI / 2 + 58 / 60 * TAU;
function dial(x, y, r, t, sec = true) {
  circle(x, y, r + r * .09, C.night); circle(x, y, r, C.watch);
  for (let k = 0; k < 12; k++) { const a = -Math.PI / 2 + k / 12 * TAU; line([[x + Math.cos(a) * r * .78, y + Math.sin(a) * r * .78], [x + Math.cos(a) * r * .92, y + Math.sin(a) * r * .92]], k % 3 ? r * .03 : r * .06, C.night, 'butt'); }
  line([[x, y], [x + Math.cos(AH) * r * .5, y + Math.sin(AH) * r * .5]], r * .085, C.night); line([[x, y], [x + Math.cos(AM) * r * .78, y + Math.sin(AM) * r * .78]], r * .06, C.night);
  if (sec) { const tq = twos(t), s = tq < 8.4 ? 47 : tq < 9.4 ? 48 : 49, a = -Math.PI / 2 + s / 60 * TAU; over(() => line([[x - Math.cos(a) * r * .15, y - Math.sin(a) * r * .15], [x + Math.cos(a) * r * .86, y + Math.sin(a) * r * .86]], r * .02, [0, 1, 0])); }
  circle(x, y, r * .05, C.night);
}
function shotWatch(t) {
  const u = eo(seg(t, 7.5, 7.92)), bob = 10 * Math.sin(TAU * CADENCE * (t - 7.5)) * u;
  const x = lerp(MOON.x, 1080, u), y = lerp(MOON.y, 540, u) + bob, r = lerp(MOON.r, 300, u);
  clear(); g.setTransform(1, 0, 0, 1, 0, 0);
  rect(0, 0, W, 360, C.sky0); rect(0, 360, W, 360, C.sky1); rect(0, 720, W, 360, C.sky2);
  // sleeve and hand, then the strap and the disc
  g.save(); g.translate(x, y);
  blob([[-1300, -150], [-200, -170], [-60, -150], [-40, 150], [-200, 170], [-1300, 190]].map(([a, b]) => [a * r / 300, b * r / 300]), C.coat);
  over(() => { for (let k = 0; k < 6; k++) rect((-1200 + k * 170) * r / 300, -150 * r / 300, 50 * r / 300, 320 * r / 300, [0, 0, .25]); });
  blob([[150, -120], [420, -140], [560, -40], [540, 40], [420, 110], [150, 110]].map(([a, b]) => [a * r / 300, b * r / 300]), C.skin);
  rect(-150 * r / 300, -440 * r / 300, 300 * r / 300, 880 * r / 300, [1, .6, 0]);
  g.restore();
  layer(() => dial(x, y, r, t), 6);
  // the plates drift apart through the hold
  const d = 26 * ss(seg(t, 7.9, 9.3));
  return { seed: 11, sheet: 3, off: [[0, 0], [4 + d, -3 - d * .4], [-3 - d * .7, 3 + d * .5]], inks: INKS };
}
function shotStation(t) {
  const u = eo(seg(t, 9.42, 9.95)), z = Math.exp(lerp(Math.log(300 / 90), 0, u)), CLK = [1340, 300];
  const CM = cam(lerp(CLK[0], 960, u), lerp(CLK[1], 540, u), z);
  clear(); g.setTransform(1, 0, 0, 1, 0, 0);
  rect(0, 0, W, 300, C.sky0); rect(0, 300, W, 200, C.sky1); rect(0, 500, W, 600, C.sky2);
  SET(CM);
  circle(420, 190, 110, C.moon);
  for (const f of FAR) rect(f.x * .9 - 200, 820 - f.h * 1.2, f.w * .9, f.h * 1.2 + 300, [.62, 0, 0]);
  rect(CLK[0] - 150, CLK[1] - 160, 300, 900, C.wall); poly([[CLK[0] - 180, CLK[1] - 150], [CLK[0], CLK[1] - 380], [CLK[0] + 180, CLK[1] - 150]], C.coatD);
  rect(-200, 820, 2400, 400, C.pave);
  for (let x = 40; x < 1900; x += 320) rect(x, 700, 180, 120, C.wall2);
  layer(() => dial(CLK[0], CLK[1], 90, t, false), 5);
  const c = t - EV.chime, snapped = c >= 0, kick = snapped && c < .3 ? 12 * Math.exp(-c * 14) * Math.cos(c * 60) : 0, d = snapped ? 0 : 26;
  return { seed: 13, sheet: 4, off: [[0, 0], [4 + d + kick, -3 - d * .4], [-3 - d * .7 - kick, 3 + d * .5]], inks: INKS };
}
function render(t) {
  let o;
  if (t < 2.5) o = shotPuddle(t);
  else if (t < 7.5) o = shotStreet(t);
  else if (t < 9.375) o = shotWatch(t);
  else o = shotStation(t);
  print(plate, o);
}
window.render = render;
window.DUR = DUR;
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(twos(t))); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
render(0);
window.READY = true;
