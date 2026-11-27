// 016 · Chinese Ink Wash — the first 10 s of "Last Train Home" as a xieyi ink painting on rice paper (lemo-opuscar
// styles/ink-wash): ink only, in five tones, multiplied onto procedural paper by the style's compositor (wet layer bleeds
// and pools at its edges, dry layer is bitten by the paper's tooth); loaded strokes whose dark side is the contour, pale
// masses, flying-white dry strokes; light is paper left blank (lit windows, sign letters, the puddle, the clock face);
// one vermilion accent, the second hand of AKI's watch. Transitions are the style's own: an ink bloom (S1→S2), a hard cut
// to an extreme close-up (S2→S3, the only cut the style allows), a bloom out of the watch dial into the clock (S3→S4).
// Engine copied unchanged from the style's demo (ink.js brush engine, comp.js rice-paper compositor).
// Page contract: window.render(t), DUR, READY, RIGQA.
import { makeComp, layerSet } from './engine/comp.js';
import { mk, draw, mass, blot, TONE } from './engine/ink.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { lerp, seg, ss, eio, eo, back, hash, clamp, mulberry, vnoise } from './shared/lib/util.js';

const W = 1920, H = 1080, VERM = [176, 46, 34], TAU = Math.PI * 2;
const comp = makeComp(document.getElementById('c'));
const PA = layerSet(), PB = layerSet();

// ——— brushed lettering: skeletons only (centrelines in stroke order), written with the brush or reserved as blank paper ———
const C_ = [[.55, .15], [.38, .03], [.18, .06], [.05, .3], [.04, .6], [.15, .9], [.35, .98], [.56, .85]];
const GL = {
  '2': [[[.05, .25], [.15, .06], [.35, .02], [.52, .14], [.5, .35], [.05, .95], [.58, .95]]], '4': [[[.42, .95], [.42, .05], [.02, .7], [.6, .7]]],
  '1': [[[.12, .2], [.32, .03], [.32, .98]]], '3': [[[.06, .12], [.25, .02], [.48, .08], [.5, .3], [.3, .46]], [[.3, .46], [.52, .58], [.54, .82], [.32, .98], [.05, .9]]],
  '6': [[[.5, .06], [.3, .02], [.1, .2], [.04, .6], [.12, .9], [.32, .98], [.5, .86], [.52, .62], [.35, .5], [.12, .55], [.05, .68]]],
  '9': [[[.5, .42], [.32, .52], [.1, .45], [.05, .22], [.2, .04], [.4, .03], [.54, .2], [.54, .5], [.45, .85], [.25, .98], [.08, .92]]],
  H: [[[.05, .02], [.05, .98]], [[.55, .02], [.55, .98]], [[.05, .5], [.55, .5]]], C: [C_], A: [[[.02, .98], [.3, .02], [.58, .98]], [[.13, .62], [.47, .62]]],
  F: [[[.08, .02], [.08, .98]], [[.08, .04], [.55, .04]], [[.08, .48], [.45, .48]]], E: [[[.08, .02], [.08, .98]], [[.08, .04], [.55, .04]], [[.08, .48], [.45, .48]], [[.08, .96], [.56, .96]]],
  B: [[[.08, .02], [.08, .98]], [[.08, .04], [.4, .04], [.52, .15], [.5, .38], [.38, .48], [.08, .48]], [[.38, .48], [.55, .6], [.56, .82], [.42, .96], [.08, .96]]],
  K: [[[.08, .02], [.08, .98]], [[.55, .02], [.1, .55]], [[.25, .42], [.56, .98]]], R: [[[.08, .98], [.08, .02], [.4, .04], [.52, .16], [.5, .38], [.38, .48], [.08, .48]], [[.3, .48], [.56, .98]]],
  Y: [[[.02, .02], [.3, .5], [.58, .02]], [[.3, .5], [.3, .98]]], O: [[[.3, .02], [.1, .12], [.03, .5], [.1, .88], [.3, .98], [.5, .88], [.57, .5], [.5, .12], [.3, .02]]],
  S: [[[.54, .14], [.36, .02], [.14, .06], [.06, .25], [.2, .44], [.42, .54], [.55, .74], [.46, .94], [.22, .98], [.04, .85]]], N: [[[.06, .98], [.06, .02], [.54, .98], [.54, .02]]],
  D: [[[.08, .02], [.08, .98]], [[.08, .03], [.3, .04], [.5, .18], [.57, .5], [.5, .82], [.3, .96], [.08, .97]]], L: [[[.08, .02], [.08, .96], [.55, .96]]], T: [[[.02, .04], [.58, .04]], [[.3, .04], [.3, .98]]],
  P: [[[.08, .98], [.08, .02], [.4, .04], [.52, .16], [.5, .38], [.38, .48], [.08, .48]]], M: [[[.04, .98], [.06, .02], [.3, .6], [.54, .02], [.56, .98]]],
  U: [[[.06, .02], [.06, .7], [.18, .94], [.3, .98], [.44, .94], [.54, .7], [.54, .02]]], W: [[[.02, .02], [.15, .98], [.3, .35], [.45, .98], [.58, .02]]],
};
const wordW = (str, h) => str.length * h * .78 - h * .18;
function wordStrokes(str, x, y, h) {   // → list of point lists (world), the word centred on x, top at y
  const out = []; let cx = x - wordW(str, h) / 2;
  for (const ch of str) { for (const s of GL[ch] || []) out.push(s.map(([u, v]) => [cx + u * h, y + v * h])); cx += h * .78; }
  return out;
}
function reserve(c, strokes, lw) {   // letters left as blank paper inside a dark board (light is unpainted paper)
  c.save(); c.globalCompositeOperation = 'destination-out'; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#000';
  for (const s of strokes) { c.beginPath(); s.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); } c.restore();
}

// ——— the run (shared rig); ground at y = 0 ———
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

// ——— the street, built once ———
const R = mulberry(16016);
const WORDS = ['BAKERY', 'BAR', 'BOOKS', 'PHARMACY', 'NOODLES', 'LAUNDRY', 'RECORDS', 'HOTEL', 'FLOWERS'];
const SHOPS = []; { let x = -3200, i = 0; while (x < 14000) { const w = 640 + R() * 240, h = 600 + R() * 160; SHOPS.push({ x0: x, x1: x + w, top: -40 - h, ww: w * (.44 + R() * .1), up: R() < .7, lit: [R() < .7, R() < .45, R() < .7], awn: R() < .5, sd: 300 + i * 41, i }); x += w + 40 + R() * 80; i++; } }
{ const PF = .85, sx0 = SPL.x / PF; const j = SHOPS.findIndex(s => s.x0 <= sx0 - 260 && s.x1 > sx0 - 260); let k = 0; SHOPS.forEach((s, i) => { s.word = i === j ? '24H' : i === j + 1 ? 'CAFE' : WORDS[k++ % WORDS.length]; }); }
const FAR = []; { const r = mulberry(99); let x = -4000; while (x < 9000) { const w = 220 + r() * 360; FAR.push({ x0: x, x1: x + w, top: -1180 - r() * 520, sd: 800 + Math.round(x) }); x += w * (.7 + r() * .6); } }
const POSTS = []; for (let x = -2400; x < 16000; x += 2300) POSTS.push(x);
const PUD = [{ x: SPL.x + 30, y: 34, rx: 270, ry: 46, hero: true }, { x: 3400, y: 60, rx: 220, ry: 32 }, { x: 6200, y: 44, rx: 250, ry: 36 }];
const XT = 12600;   // the clock tower

// ——— one ink stroke with a fixed seed (stable flying white on every drawing) ———
let L = PA.ink, BOIL = 0;
const S = (pts, o, sd) => draw(L, mk(pts, { seed: 1000 + sd, gapLen: o.gapLen ?? 400, boil: BOIL, ...o }));
const LOAD = (w, tone, dark, x = {}) => ({ w, tone, darkDir: dark, side: x.side ?? .85, brWet: true, body: x.body ?? .18, dry: x.dry ?? .38, wet: .9, prof: x.prof || 'robe', nb: x.nb, rough: .12 });
const set = (Ly, s, cx, cy, f = 1) => Ly.xf(s, W / 2 - cx * f * s, H / 2 - cy * s);   // world → screen with a parallax factor on x

// ——— the world painting ———
function sky(Ly, cam) {   // a night wash, heavier at the top, fading to blank mist above the roofs
  const c = Ly.cw; c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const yS = y => H / 2 + (y - cam[1]) * cam[2], g = c.createLinearGradient(0, yS(-2400), 0, yS(-640));
  g.addColorStop(0, 'rgba(0,0,0,.62)'); g.addColorStop(.6, 'rgba(0,0,0,.42)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, Math.max(0, Math.min(H, yS(-640)))); c.restore();
}
function farCity(Ly, cam, sd0 = 0) {   // far towers in clear ink, dissolving into mist downward (slow parallax)
  set(Ly, cam[2], cam[0], cam[1], .32);
  for (const f of FAR) { const x0 = f.x0, x1 = f.x1; if ((x1 - cam[0] * .32) * cam[2] < -W || (x0 - cam[0] * .32) * cam[2] > W) continue;
    mass(Ly.cw, [[x0, f.top], [x1, f.top], [x1, -700], [x0, -700]], .17, 12, f.sd, [0, f.top, 0, -700, 1, 0]);
    if (hash(f.sd) < .5) { Ly.cw.save(); Ly.cw.globalCompositeOperation = 'destination-out'; Ly.cw.fillStyle = '#000'; Ly.cw.fillRect(lerp(x0, x1, .3 + .3 * hash(f.sd * 3)), f.top + 80 + 120 * hash(f.sd * 5), 24, 34); Ly.cw.restore(); } }
}
function shops(Ly, cam, tD) {
  const PF = .85; set(Ly, cam[2], cam[0], cam[1], PF); L = Ly.ink;
  const vx0 = cam[0] * PF - W / 2 / cam[2] - 200, vx1 = cam[0] * PF + W / 2 / cam[2] + 200;
  for (const s of SHOPS) { if (s.x1 < vx0 || s.x0 > vx1) continue; const { x0, x1, top, sd } = s, w = x1 - x0;
    // wall: one pale mass, darker under the eaves (night), the shop window and upper windows left as paper
    const tn = .44 + .14 * hash(sd * 1.3);
    mass(Ly.cw, [[x0 + 6, top], [x1 - 6, top], [x1 - 14, -300], [x0 + 14, -300]], tn, 14, sd, [0, top, 0, -300, 1, .18]);   // the facade wash, dissolving downward
    mass(Ly.cw, [[x0 + 20, -360], [x1 - 20, -360], [x1 - 30, -50], [x0 + 30, -50]], .24, 16, sd + 9, [0, -360, 0, -50, 1, .35]);   // a clear-ink storefront
    S([[x0 + 2, top + 10], [x0 - 2, lerp(top, -40, .5)], [x0 + 4, -44]], LOAD(24, .55, [-1, 0], { dry: .5, prof: 'brush' }), sd + 11);
    S([[x1 - 2, top + 14], [x1 + 2, lerp(top, -40, .55)], [x1 - 4, -50]], LOAD(20, .45, [1, 0], { dry: .55, prof: 'brush' }), sd + 12);
    const c = Ly.cw; c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000';
    c.fillRect(x0 + 50, -330, s.ww, 270);                                                       // the lit shop window: blank paper
    if (s.up) for (let k = 0; k < 3; k++) if (s.lit[k] && top + 70 < -560) c.fillRect(x0 + 60 + k * (w - 120) / 3, top + 70, 80, 100);
    c.restore();
    for (let k = 0; k < 3; k++) if (s.up && !s.lit[k] && top + 70 < -560) mass(Ly.cw, [[x0 + 60 + k * (w - 120) / 3, top + 70], [x0 + 140 + k * (w - 120) / 3, top + 70], [x0 + 140 + k * (w - 120) / 3, top + 170], [x0 + 60 + k * (w - 120) / 3, top + 170]], .5, 3, sd + k);
    // the window frame: two thin dry strokes; the door: a dark wet mass
    S([[x0 + 50 + s.ww / 2, -328], [x0 + 50 + s.ww / 2, -62]], { w: 5, tone: TONE.zhong, dry: .5, prof: 'even' }, sd + 1);
    S([[x0 + 46, -60], [x0 + 54 + s.ww, -58]], { w: 9, tone: TONE.nong, dry: .45, prof: 'even' }, sd + 2);
    mass(Ly.cw, [[x1 - 170, -330], [x1 - 70, -330], [x1 - 70, -40], [x1 - 170, -40]], .62, 3, sd + 3);
    // the cornice / awning: one loaded stroke, dark side up; two posts as dry strokes (no closed outlines)
    S([[x0 - 20, top + 6], [lerp(x0, x1, .5), top - 4], [x1 + 20, top + 8]], LOAD(30, .82, [0, -1], { dry: .3 }), sd + 4);
    if (s.awn) S([[x0 + 30, -372], [lerp(x0, x1, .5), -360], [x1 - 30, -374]], LOAD(26, .7, [0, -1], { dry: .35 }), sd + 5);
    S([[x0 + 4, top + 20], [x0 + 2, -200], [x0 + 6, -42]], { w: 7, tone: TONE.zhong, dry: .65, prof: 'tip' }, sd + 6);
    // the sign: a dark board, its letters reserved as blank paper (the lightbox glows because it is unpainted)
    const bw = Math.min(w - 80, wordW(s.word, 62) + 90);
    mass(Ly.cd, [[x0 + w / 2 - bw / 2, -470], [x0 + w / 2 + bw / 2, -472], [x0 + w / 2 + bw / 2 - 4, -385], [x0 + w / 2 - bw / 2 + 3, -383]], .84, 7, sd + 7);
    reserve(Ly.cd, wordStrokes(s.word, x0 + w / 2, -458, 62), 11);
  }
}
function ground(Ly, cam, tD, heroWob = 0) {
  set(Ly, cam[2], cam[0], cam[1], 1); L = Ly.ink;
  const vx0 = cam[0] - W / 2 / cam[2] - 300, vx1 = cam[0] + W / 2 / cam[2] + 300, c = Ly.cw;
  mass(c, [[vx0, -40], [vx1, -40], [vx1, 900], [vx0, 900]], .32, 0, 5, [0, -40, 0, 600, .55, 1]);
  // water is blank paper: the puddles and the windows' reflections are wiped out of the wet ground wash
  c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000';
  for (const p of PUD) { if (p.x + p.rx < vx0 || p.x - p.rx > vx1) continue; c.beginPath(); for (let k = 0; k <= 40; k++) { const a = k / 40 * TAU, b = 1 + .08 * Math.sin(a * 2 + p.x) + .05 * Math.sin(a * 5 + p.x * .3); const X_ = p.x + Math.cos(a) * p.rx * b, Y_ = p.y + Math.sin(a) * p.ry * b; k ? c.lineTo(X_, Y_) : c.moveTo(X_, Y_); } c.fill(); }
  c.restore();
  // window reflections (they belong to the shops' plane: parallax .85), long vertical wipes in the wet ground
  set(Ly, cam[2], cam[0], cam[1], .85);
  c.save(); c.globalCompositeOperation = 'destination-out';
  for (const s of SHOPS) { const x = s.x0 + 50; if (x + s.ww < cam[0] * .85 - W / 1.6 / cam[2] || x > cam[0] * .85 + W / 1.6 / cam[2]) continue;
    const L_ = 170 + 80 * hash(s.sd), g = c.createLinearGradient(0, -40, 0, -40 + L_); g.addColorStop(0, 'rgba(0,0,0,.8)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g;
    c.beginPath(); c.moveTo(x + 6, -38); for (let k = 0; k <= 10; k++) c.lineTo(x + 6 + s.ww * k / 10, -38 + 6 * Math.sin(k * 2.1 + s.sd)); for (let k = 10; k >= 0; k--) c.lineTo(x + 6 + s.ww * k / 10 + 14 * Math.sin(k * 1.7 + s.sd), -40 + L_ * (.75 + .25 * hash(s.sd + k))); c.closePath(); c.fill(); }
  c.restore();
  set(Ly, cam[2], cam[0], cam[1], 1);
  // the hero puddle holds the two signs upside down (pale, reserved letters), wobbling after the splash
  const p = PUD[0]; if (p.x + p.rx > vx0 && p.x - p.rx < vx1) {
    const cl = Ly.cd; cl.save(); cl.beginPath(); for (let k = 0; k <= 40; k++) { const a = k / 40 * TAU, b = 1 + .08 * Math.sin(a * 2 + p.x) + .05 * Math.sin(a * 5 + p.x * .3); const X_ = p.x + Math.cos(a) * p.rx * b, Y_ = p.y + Math.sin(a) * p.ry * b; k ? cl.lineTo(X_, Y_) : cl.moveTo(X_, Y_); } cl.clip();
    [['24H', -120], ['CAFE', 110]].forEach(([wd, dx], i) => { const wob = heroWob * Math.sin(tD * 29 + i * 2), bx = p.x + dx + wob, bw = wordW(wd, 38) + 50;
      cl.save(); cl.translate(0, 2 * (p.y - 14)); cl.scale(1, -1);     // mirrored about the water line
      mass(cl, [[bx - bw / 2, p.y - 70], [bx + bw / 2, p.y - 70], [bx + bw / 2, p.y - 14], [bx - bw / 2, p.y - 14]], .42, 3, 60 + i);
      reserve(cl, wordStrokes(wd, bx, p.y - 62, 38), 7); cl.restore(); });
    cl.restore();
  }
  // faint dry streaks on the water
  for (const q of PUD) { if (q.x + q.rx < vx0 || q.x - q.rx > vx1) continue; for (let k = 0; k < 3; k++) S([[q.x - q.rx * .6 + k * 40, q.y - q.ry * .3 + k * 22], [q.x + q.rx * .2 + k * 50, q.y - q.ry * .25 + k * 22]], { w: 4, tone: TONE.dan, dry: .85, prof: 'tip' }, 90 + k + q.x); }
  // kerb: one long dry stroke
  S([[vx0, 300], [vx1, 304]], { w: 12, tone: TONE.zhong, dry: .6, prof: 'even', gapLen: 2000 }, 7);
}
function posts(Ly, cam) {   // foreground lamp posts (parallax 1.5): one dark loaded stroke each, the lamp a blank disc with a pale halo
  const PF = 1.5; set(Ly, cam[2], cam[0], cam[1], PF); L = Ly.ink;
  for (const x of POSTS) { const sxp = (x - cam[0] * PF) * cam[2] + W / 2; if (sxp < -200 || sxp > W + 200) continue;
    S([[x, 700], [x + 4, -400], [x + 10, -980], [x + 60, -1040]], LOAD(34, .9, [-1, 0], { dry: .3, prof: 'even' }), 200 + x);
    const c = Ly.cw; const g = c.createRadialGradient(x + 84, -1010, 10, x + 84, -1010, 120); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.35, 'rgba(0,0,0,.0)'); g.addColorStop(.36, 'rgba(0,0,0,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x - 60, -1150, 300, 280); }
}
function rain(Ly, cam, t, n = 70, tone = TONE.zhong * .8) {   // fine slanted dry strokes, on ones
  Ly.xf(1, 0, 0); L = Ly.ink;
  for (let i = 0; i < n; i++) { const z = hash(i * 9.7), sp = 1700 + z * 900, y = ((hash(i * 2.1) * 1300 + t * sp) % 1300) - 120, x = ((hash(i * 3.7) * 2240 - y * .26) % 2240 + 2240) % 2240 - 160, len = 50 + z * 70;
    S([[x, y], [x - len * .26, y + len]], { w: 1.6 + z * 1.6, tone: tone * (.6 + z * .5), dry: .55, prof: 'tip', nb: 4, gapLen: 120 }, 3000 + i); }
}
function rings(Ly, cam, cx, cy, tD, n, rx, ry, sd) {   // open ink rings on the water
  for (let k = 0; k < n; k++) { const per = .55, ph = hash(k * 4.3 + sd) * per, age = ((tD + ph) % per) / per, cyc = Math.floor((tD + ph) / per);
    const x = cx + (hash(k * 7.1 + cyc + sd) - .5) * 1.5 * rx, y = cy + (hash(k * 5.3 + cyc + sd) - .5) * .8 * ry, r = 10 + 50 * age, a0 = hash(k + cyc) * TAU;
    const pts = []; for (let j = 0; j <= 12; j++) { const a = a0 + j / 12 * TAU * .8; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * .26]); }
    S(pts, { w: 2.6, tone: TONE.zhong * (1 - age * .6), dry: .5, prof: 'tip', nb: 4 }, 4000 + k * 31 + cyc); }
}
function splash(Ly, tD, filter) {
  for (const c of RUN.contacts) { const u = tD - c.t0, hero = c === SPL; if (u < 0 || u > (hero ? .75 : .4) || !filter(c)) continue; const p0 = [c.x + 24, -4];
    for (let j = 0; j < (hero ? 18 : 7); j++) { const a = Math.PI * (.12 + .76 * hash(j * 7.1 + c.t0)), sp = (hero ? 560 : 300) * (.5 + .6 * hash(j * 3.3 + c.t0)), sg = hash(j) < .5 ? -1 : 1;
      const x = p0[0] + Math.cos(a) * sp * u * sg * .9, y = p0[1] - Math.sin(a) * sp * u * 1.5 + 1800 * u * u; if (y > p0[1] + 4) continue;
      blot(Ly.cw, x, y, (hero ? 7 : 5) * (.6 + .6 * hash(j * 1.9)), .8, a, .8, j); }
    if (hero && u < .3) for (let j = 0; j < 7; j++) { const a = Math.PI * (.14 + .72 * j / 6), r1 = 40 + 170 * eo(u / .3);
      S([[p0[0] + Math.cos(a) * 34, p0[1] - Math.sin(a) * 26], [p0[0] + Math.cos(a) * r1, p0[1] - Math.sin(a) * r1 * .8]], { w: 5, tone: TONE.nong, dry: .7, prof: 'tip' }, 4500 + j); }
    for (let k = 0; k < (hero ? 2 : 1); k++) { const v = u - k * .15; if (v <= 0) continue; const r = 40 + (hero ? 320 : 150) * v, pts = []; for (let j = 0; j <= 14; j++) { const a = -.3 + j / 14 * (TAU - .6); pts.push([p0[0] + Math.cos(a) * r, p0[1] + 8 + Math.sin(a) * r * .2]); }
      S(pts, { w: 3, tone: TONE.zhong * (1 - v), dry: .55, prof: 'tip' }, 4600 + k + c.t0 * 10); } }
}

// ——— AKI in xieyi: a pale coat mass + two loaded strokes, burnt-ink limbs, a wet mass of hair, a face in clear ink ———
function inkAki(Ly, J, o = {}) {
  L = Ly.ink; const sd = 6000;
  const hc = [J.headC[0], J.headC[1] - 6], HR = (p) => { const c = Math.cos(J.headA), s = Math.sin(J.headA); return [hc[0] + p[0] * c - p[1] * s, hc[1] + p[0] * s + p[1] * c]; }, Hp = pts => pts.map(HR);
  const lag = o.hairLag || [0, 0], lx = clamp(lag[0] * .35, -26, 6), ly = clamp(lag[1] * .3, -12, 12);
  // far arm (palest, behind)
  const af = J.arm.f; S([af.sh, af.el, af.wr], LOAD(30, .42, [0, 1], { dry: .5 }), sd + 1);
  // legs below the coat: burnt-ink trouser strokes, boots as nail strokes
  for (const [k, tn, i] of [['f', .62, 2], ['n', .86, 3]]) { const l = J.leg[k], a = [lerp(l.hip[0], l.knee[0], .5), lerp(l.hip[1], l.knee[1], .5)];
    S([a, l.knee, l.ankle], { w: 34, tone: tn, dry: .3, wet: .15, prof: 'even' }, sd + 10 * i);
    const c = Math.cos(l.pitch), s = Math.sin(l.pitch), P_ = ([u, v]) => [l.ankle[0] + u * c - v * s, l.ankle[1] + u * s + v * c];
    S([P_([-16, -2]), P_([22, 10]), P_([58, 12])], { w: 26, tone: TONE.jiao, dry: .2, wet: .2, prof: 'nail' }, sd + 10 * i + 1); }
  // the coat: one pale mass, a loaded stroke down the back (dark edge = the contour) and one down the front
  const nb = J.neckBase, pv = J.pelvis, uL = J.uL, fL = J.fL, hb = o.hemB || [0, 0], T = (b, up, fw) => [b[0] + uL[0] * up + fL[0] * fw, b[1] + uL[1] * up + fL[1] * fw];
  const bk = T(pv, -80, -44); bk[0] += hb[0] * .6; bk[1] += hb[1] * .6;
  mass(Ly.cw, [T(nb, -2, 16), T(nb, -4, -18), T(nb, -18, -32), T(J.waist, 0, -34), bk, T(pv, -84, 42), T(J.waist, 0, 28), T(nb, -40, 30)], .34, 4, sd + 40, [...T(nb, 0, 0), ...T(pv, -80, 0), .8, 1.15]);
  S([T(nb, -6, -14), T(nb, -30, -30), T(J.waist, 0, -36), T(pv, -40, -42), bk], LOAD(32, .9, [-fL[0], -fL[1]], { dry: .32 }), sd + 41);
  S([T(nb, -16, 26), T(J.waist, 0, 30), T(pv, -84, 42)], LOAD(22, .66, fL, { dry: .4 }), sd + 42);
  S([T(J.waist, 2, -34), T(J.waist, 2, 28)], { w: 8, tone: TONE.jiao, dry: .3, prof: 'even' }, sd + 43);                       // belt
  S([T(nb, 6, -18), T(nb, 10, 16)], { w: 14, tone: TONE.zhong, dry: .7, prof: 'even', nb: 10 }, sd + 44);                        // the knit roll-neck, dry
  // head: face in clear ink, profile line, almond eye, hair as one wet mass with a loaded back stroke and bangs
  S(Hp([[-4, -30], [12, 0], [4, 32]]), { w: 72, tone: .1, wet: 1, dry: 0, prof: 'lens' }, sd + 50);
  S(Hp([[20, -38], [38, -18], [44, -4], [51, 5], [44, 12], [45, 22], [40, 28], [30, 40], [14, 45]]), { w: 4.5, tone: TONE.nong, dry: .3, prof: 'tip' }, sd + 51);
  if (o.blink) S(Hp([[18, -4], [31, -4]]), { w: 3, tone: TONE.nong, dry: .3, prof: 'tip' }, sd + 52);
  else if (o.take) blot(Ly.cd, ...HR([26, -5]), 5.5, .95, 0, 1, 3);
  else S(Hp([[18, -6], [26, -8], [32, -4]]), { w: 5.5, tone: TONE.jiao, dry: .15, prof: 'tip' }, sd + 52);
  S(Hp(o.take ? [[14, -24], [24, -28], [34, -24]] : [[14, -16], [24, -19], [33, -16]]), { w: 3.6, tone: TONE.nong, dry: .4, prof: 'tip' }, sd + 53);
  mass(Ly.cw, Hp([[12, -46], [-14, -50], [-38, -38], [-52, -10], [-54 + lx * .5, 22 + ly * .5], [-50 + lx, 54 + ly], [-34 + lx, 62 + ly], [-18 + lx * .6, 56 + ly * .6], [-12, 30], [-6, 8], [-10, -14], [8, -26]]), .66, 3, sd + 54);
  S(Hp([[8, -50], [-30, -46], [-50, -14], [-52 + lx * .6, 30 + ly * .5], [-42 + lx, 62 + ly]]), LOAD(20, .92, [-1, 0], { dry: .4, prof: 'brush' }), sd + 55);
  S(Hp([[-10, -50], [20, -48], [40, -30], [46, -14]]), { w: 16, tone: TONE.jiao, dry: .3, wet: .3, prof: 'nail' }, sd + 56);   // curved bangs
  // near arm, the hand in clear ink, the watch: the one vermilion accent
  const an = J.arm.n; S([an.sh, an.el, an.wr], LOAD(32, .74, [0, 1], { dry: .38 }), sd + 60);
  const d = Math.hypot(an.wr[0] - an.el[0], an.wr[1] - an.el[1]) || 1, ux = (an.wr[0] - an.el[0]) / d, uy = (an.wr[1] - an.el[1]) / d;
  S([[an.wr[0] - ux * 4, an.wr[1] - uy * 4], [an.wr[0] + ux * 30, an.wr[1] + uy * 30]], { w: 30, tone: .14, wet: 1, dry: 0, prof: 'lens' }, sd + 61);
  S([[an.wr[0] + ux * 8 - uy * 12, an.wr[1] + uy * 8 + ux * 12], [an.wr[0] + ux * 30, an.wr[1] + uy * 30]], { w: 3.5, tone: TONE.nong, dry: .4, prof: 'tip' }, sd + 62);
  const wc = [an.wr[0] - ux * 8, an.wr[1] - uy * 8], cc = Ly.cc; cc.fillStyle = `rgba(${VERM},.95)`; cc.beginPath(); cc.arc(wc[0], wc[1], (o.watch || 0) > .3 ? 11 : 8.5, 0, TAU); cc.fill();
}

// ——— the extreme close-up: wrist and watch, painted in screen space ———
function closeUp(Ly, t, tD) {
  const kk = Math.floor((t - FIRST_STEP) * CADENCE), by = 10 * Math.sin((t - FIRST_STEP) * CADENCE * Math.PI);   // handheld bob on her steps (on ones)
  Ly.xf(1, 0, by); L = Ly.ink; BOIL = Math.floor(tD * 15);
  // the street lights streaking past: fast flying-white strokes across the frame (on ones)
  Ly.xf(1, 0, 0);
  for (let k = 0; k < 9; k++) { const y = 110 + k * 108 + (hash(k * 3.3) - .5) * 50, len = 380 + hash(k * 5.1) * 700, per = W + len + 400, x1 = W + 200 - ((t * 2600 + hash(k * 7.7) * per) % per);
    S([[x1 + len, y], [x1, y + 10]], { w: 10 + hash(k) * 14, tone: k % 3 ? TONE.dan : TONE.zhong, dry: .88, prof: 'tip', nb: 14, gapLen: 900 }, 7000 + k); }
  Ly.xf(1, 0, by);
  // the forearm: a pale gradient mass and two loaded strokes along its edges; the knit cuff in short dry strokes
  mass(Ly.cw, [[-200, 640], [740, 470], [770, 640], [-200, 900]], .26, 8, 71, [0, 470, 0, 900, .7, 1.1]);
  S([[-200, 650], [300, 560], [742, 474]], LOAD(46, .8, [0, -1], { dry: .32 }), 72);
  S([[-200, 898], [320, 770], [768, 646]], LOAD(40, .7, [0, 1], { dry: .4 }), 73);
  for (let k = 0; k < 7; k++) S([[742 + k * 9, 476 + k * 2], [764 + k * 8, 642 - k * 2]], { w: 7, tone: TONE.zhong, dry: .75, prof: 'tip', nb: 5 }, 74 + k);
  // the hand (clear ink, a few strokes)
  mass(Ly.cw, [[1080, 430], [1280, 400], [1420, 470], [1440, 600], [1340, 690], [1120, 680]], .12, 10, 82);
  S([[1110, 430], [1260, 398], [1390, 440], [1436, 520]], { w: 6, tone: TONE.nong, dry: .35, prof: 'tip' }, 83);
  S([[1430, 560], [1380, 650], [1250, 690], [1120, 676]], { w: 5, tone: TONE.nong, dry: .45, prof: 'tip' }, 84);
  for (let k = 0; k < 3; k++) S([[1350 - k * 8, 480 + k * 60], [1430 - k * 10, 500 + k * 58]], { w: 4, tone: TONE.zhong, dry: .5, prof: 'tip' }, 85 + k);
  // strap above and below the case (dark wet strokes), the case as two loaded half-rings, the dial left blank
  const cx = 930, cy = 552, r = 168;
  S([[900, 260], [930, 330], [960, 392]], { w: 110, tone: .7, dry: .2, wet: .7, prof: 'even' }, 90);
  S([[960, 712], [935, 790], [905, 860]], { w: 110, tone: .7, dry: .2, wet: .7, prof: 'even' }, 91);
  const arc = (a0, a1, rr) => { const o = []; for (let j = 0; j <= 16; j++) { const a = lerp(a0, a1, j / 16); o.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return o; };
  S(arc(-2.2, 1.05, r), LOAD(34, .86, [1, 0], { dry: .3, side: .9 }), 92); S(arc(.95, 4.15, r), LOAD(30, .8, [-1, 0], { dry: .34, side: .9 }), 93);
  const c = Ly.cw; c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(cx, cy, r - 18, 0, TAU); c.fill(); c.restore();
  const cd = Ly.cd; cd.save(); cd.globalCompositeOperation = 'destination-out'; cd.beginPath(); cd.arc(cx, cy, r - 22, 0, TAU); cd.fill(); cd.restore();
  for (let k = 0; k < 12; k++) { if (k % 3 === 0) continue; const a = k / 12 * TAU; blot(Ly.cd, cx + Math.sin(a) * r * .8, cy - Math.cos(a) * r * .8, 4.5, .9, a, 1, k); }
  [['12', 0], ['3', 1], ['6', 2], ['9', 3]].forEach(([n, i]) => { const a = i / 4 * TAU, q = [cx + Math.sin(a) * r * .7, cy - Math.cos(a) * r * .7], h = 34;
    wordStrokes(n, q[0], q[1] - h / 2, h).forEach((pts, j) => S(pts, { w: 5.5, tone: TONE.jiao, dry: .2, prof: 'tip', nb: 6 }, 100 + i * 7 + j)); });
  const sec = 41 + Math.floor(t - EV.watchHit), mm = 58 + sec / 60, hand = (a, l, w, sd, o = {}) => S([[cx - Math.sin(a) * (o.tail || 0), cy + Math.cos(a) * (o.tail || 0)], [cx + Math.sin(a) * l, cy - Math.cos(a) * l]], { w, tone: TONE.jiao, dry: .15, prof: 'nail', ...o }, sd);
  hand((11 + mm / 60) / 12 * TAU, r * .42, 14, 120); hand(mm / 60 * TAU, r * .64, 10, 121);
  hand(sec / 60 * TAU, r * .72, 4, 122, { color: VERM, tone: .95, prof: 'tip', tail: 26 });                                        // the vermilion second hand
  blot(Ly.cd, cx, cy, 8, .95, 0, 1, 5);
  for (const [u, v, s] of [[-60, -40, 13], [44, 64, 9], [70, -70, 7]]) { const pts = []; for (let j = 0; j <= 10; j++) { const a = .5 + j / 10 * TAU * .78; pts.push([cx + u + Math.cos(a) * s, cy + v + Math.sin(a) * s]); } S(pts, { w: 2.4, tone: TONE.zhong, dry: .4, prof: 'tip', nb: 4 }, 130 + u); }
  rain(Ly, null, t, 26, TONE.dan * .8);
  BOIL = 0;
  return [cx, cy + by];
}

// ——— the tower picture (S4): high wide, tilting down; night wash, clear-ink towers into mist, the clock face left blank ———
function towerPic(Ly, t, tD) {
  const cam = [XT - 300, lerp(-1640, -1520, eio(seg(t, 9.5, 10.4))), .42];
  sky(Ly, cam); farCity(Ly, cam);
  set(Ly, cam[2], cam[0], cam[1], 1); L = Ly.ink;
  mass(Ly.cw, [[XT - 150, -2000], [XT + 150, -2000], [XT + 150, -600], [XT - 150, -600]], .5, 6, 51, [0, -2000, 0, -700, 1, .1]);
  S([[XT - 220, -1984], [XT - 100, -2100], [XT, -2250]], LOAD(34, .9, [-1, -1], { dry: .32, prof: 'rise' }), 52); S([[XT, -2250], [XT + 110, -2096], [XT + 224, -1980]], LOAD(30, .82, [1, -1], { dry: .36, prof: 'nail' }), 58);
  S([[XT - 150, -1990], [XT - 154, -1500], [XT - 146, -900]], { w: 10, tone: TONE.nong, dry: .6, prof: 'tip' }, 53);
  S([[XT + 150, -1990], [XT + 154, -1400], [XT + 148, -800]], { w: 8, tone: TONE.zhong, dry: .65, prof: 'tip' }, 54);
  const cy = -1780, r = 112, c = Ly.cw; c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(XT, cy, r, 0, TAU); c.fill(); c.restore();
  const ring = []; for (let j = 0; j <= 20; j++) { const a = -.4 + j / 20 * TAU * .95; ring.push([XT + Math.cos(a) * (r + 6), cy + Math.sin(a) * (r + 6)]); }
  S(ring, { w: 12, tone: TONE.jiao, dry: .35, prof: 'brush' }, 55);
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; blot(Ly.cd, XT + Math.sin(a) * r * .8, cy - Math.cos(a) * r * .8, k % 3 ? 3.5 : 6, .9, a, 1, k); }
  S([[XT, cy], [XT + Math.sin((11 + 58 / 60) / 12 * TAU) * 52, cy - Math.cos((11 + 58 / 60) / 12 * TAU) * 52]], { w: 11, tone: TONE.jiao, dry: .15, prof: 'nail' }, 56);
  S([[XT, cy], [XT + Math.sin(58 / 60 * TAU) * 80, cy - Math.cos(58 / 60 * TAU) * 80]], { w: 8, tone: TONE.jiao, dry: .15, prof: 'nail' }, 57);
  // the chime: open rings of ink leave the clock, one after another
  const u = tD - EV.chime; if (u > 0) for (let k = 0; k < 3; k++) { const v = u - k * .1; if (v <= 0 || v > .5) continue; const rr = r + 40 + 700 * v, pts = []; for (let j = 0; j <= 24; j++) { const a = -2.6 + j / 24 * 2.0; pts.push([XT + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    S(pts, { w: 7, tone: TONE.zhong * (1 - v * 1.4), dry: .55, prof: 'tip' }, 60 + k); const p2 = pts.map(([x, y]) => [2 * XT - x, y]); S(p2, { w: 7, tone: TONE.zhong * (1 - v * 1.4), dry: .55, prof: 'tip' }, 64 + k); }
  shops(Ly, cam, tD);
  rain(Ly, cam, t, 80);
}

// ——— the street pictures ———
const camS1 = t => [SPL.x + 40 + 8 * t, -170, 1.7];
const camS2 = t => [X(t) + 360, -340, .72];
function streetPic(Ly, t, tD, cam, id) {
  L = Ly.ink; sky(Ly, cam); farCity(Ly, cam); shops(Ly, cam, tD);
  const wob = tD > EV.splash ? 34 * Math.exp(-(tD - EV.splash) / .5) : 0;
  ground(Ly, cam, tD, wob);
  set(Ly, cam[2], cam[0], cam[1], 1);
  if (id === 'S1') { const p = PUD[0]; rings(Ly, cam, p.x, p.y, t, 8, p.rx, p.ry, 1); }
  else for (const p of PUD.slice(1)) rings(Ly, cam, p.x, p.y, t, 4, p.rx, p.ry, p.x);
  // AKI: in the locked puddle shot the drawing is held on twos (15 a second); in the follow she is painted on ones (a held
  // drawing under a moving camera would slide its planted foot)
  const tq = id === 'S1' ? tD : t;
  if (id !== 'S1' || (tq > .3 && tq < 1.9)) { const S_ = poseAt(tq), J = solveProfile(S_), sc = secondary(q => { const p = RUN.pelvisAt(q); return [p[0], p[1] - 250]; }, 0, tq);
    set(Ly, cam[2], cam[0], cam[1], 1); BOIL = id === 'S1' ? Math.floor(tD * 15) : Math.floor(t * 15);
    inkAki(Ly, J, { hemB: sc.hemB, hairLag: sc.hair.back, watch: S_.watch, take: t >= 6.45 && t < 7.4, blink: [3.6, 5.2].some(b => t >= b && t < b + .1) }); BOIL = 0; }
  set(Ly, cam[2], cam[0], cam[1], 1); L = Ly.ink;
  splash(Ly, id === 'S1' ? tD : t, c => id === 'S1' ? (c === SPL || Math.abs(c.t0 - SPL.t0) < .5) : c !== SPL);
  if (id === 'S2') posts(Ly, cam);
  rain(Ly, cam, t, id === 'S1' ? 60 : 80);
}
const paperOf = cam => [cam[0] * cam[2], cam[1] * cam[2], 1];

function frame(t) {
  const tD = Math.floor(t * 15 + 1e-6) / 15 + 1 / 30, id = shotAt(t)[2];
  PA.clear(); PB.clear();
  if (id === 'S1') { streetPic(PA, t, tD, camS1(t), 'S1'); comp(PA, null, { paper: paperOf(camS1(t)), bleed: 7 }); return; }
  if (id === 'S2') {
    const c2 = camS2(t);
    if (t < 2.95) {   // ink bloom: the street grows out of a spreading drop around her
      streetPic(PA, t, tD, camS1(t), 'S1'); streetPic(PB, t, tD, c2, 'S2');
      const J = solveProfile(poseAt(t)), ch = [(J.waist[0] - c2[0]) * c2[2] + W / 2, (J.waist[1] - c2[1]) * c2[2] + H / 2];
      comp(PA, PB, { paper: paperOf(camS1(t)), paperB: paperOf(c2), trans: [ch[0], ch[1], 2400 * eio(seg(t, 2.5, 2.95)), 1], bleed: 7, bleedB: 6 }); return; }
    streetPic(PA, t, tD, c2, 'S2'); comp(PA, null, { paper: paperOf(c2), bleed: 6 }); return; }
  if (id === 'S3') { closeUp(PA, t, tD); comp(PA, null, { paper: [0, 0, 1], bleed: 8 }); return; }
  // S4: the clock grows out of the watch dial
  if (t < 9.7) { const dc = closeUp(PA, t, tD); towerPic(PB, t, tD); comp(PA, PB, { paper: [0, 0, 1], paperB: [0, 0, 1], trans: [dc[0], dc[1], 2300 * eio(seg(t, 9.375, 9.7)), 1], bleed: 8, bleedB: 6 }); return; }
  towerPic(PA, t, tD); comp(PA, null, { paper: [0, 0, 1], bleed: 6 });
}

window.DUR = DUR; window.render = t => frame(t);
window.RIGQA = t => { const id = shotAt(t)[2]; if (id === 'S1') { const tD = Math.floor(t * 15 + 1e-6) / 15 + 1 / 30; if (tD <= .3 || tD >= 1.9) return null; const J = solveProfile(poseAt(tD)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; }
  if (id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
