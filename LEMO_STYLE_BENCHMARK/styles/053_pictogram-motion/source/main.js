// 053 · Pictogram Motion — the first 10 s of "Last Train Home" told in four beat-locked cards (lemo-opuscar styles/pictogram-motion):
// a square-grid pattern of discs and motif cells in five tones of one hue per card, whole rows sliding; geometric pictograms made of
// round-capped bars and discs; a huge English title with an Italian line under it; a mono HUD with a progress bar of four ticks.
// AKI is the film's one figure: faceless, a disc head, rounded bars from the shared rig, the far limbs mixed toward the ground,
// her jacket the coral tone. The clip's cuts fall on beats of the soundtrack's 96 bpm (0, 4, 12 and 15), and the transitions are
// the grid's own: sliding rows (2.5 s), quarter-discs from the cell corners (7.5 s), an iris from the watch's disc (9.375 s).
// Engine: engine/engine.js copied unchanged (window.G). Original pictograms and palette use only; no event marks.
// Page contract: window.render(t), DUR, READY, RIGQA.
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { back, ss, mulberry } from './shared/lib/util.js';

const G = window.G, { W, H, E, PAL, CREAM, INK, clamp, lerp, inv, mix, rgba } = G, F = G.F;
window.DUR = DUR;
await Promise.all(['900 60px "Inter Tight"', '800 60px "Inter Tight"', '500 20px "DM Mono"'].map(f => document.fonts.load(f)));
const out = document.getElementById('c').getContext('2d');
const BEAT = .625, TAU = Math.PI * 2;

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
function seg(t, a, b) { return clamp((t - a) / (b - a)); }

// ═════════ the figure: AKI as a pictogram (round-capped bars, a disc head set apart from the body)
// map: rig units → px through (k, ox, oy, xr)
function figure(ctx, t, k, ox, oy, xr, fg, bg, jacket) {
  const J = solveProfile(poseAt(t)), M = p => [ox + (p[0] - xr) * k, oy + p[1] * k], far = mix(fg, bg, .42), farJ = mix(jacket, bg, .42);
  const w = 34 * k;                                                       // one stroke weight for the whole figure
  const leg = (kk, col) => { const l = J.leg[kk]; G.seg(ctx, M(l.hip), M(l.knee), w * 1.08, col); G.seg(ctx, M(l.knee), M(l.ankle), w, col);
    const c = Math.cos(l.pitch), s = Math.sin(l.pitch), toe = M([l.ankle[0] + 52 * c - 8 * s, l.ankle[1] + 52 * s + 8 * c]); G.seg(ctx, M(l.ankle), toe, w * .8, col); };
  const arm = (kk, col, hand) => { const a = J.arm[kk]; G.seg(ctx, M(a.sh), M(a.el), w * .86, col); G.seg(ctx, M(a.el), M(a.wr), w * .8, col); G.disc(ctx, ...M([a.wr[0] + (a.wr[0] - a.el[0]) * .18, a.wr[1] + (a.wr[1] - a.el[1]) * .18]), w * .45, hand); return a; };
  arm('f', farJ, far); leg('f', far);
  // torso: one capsule from the hip to the neck, the jacket's tone; head: a disc with a gap, the ponytail a short capsule
  const nb = J.neckBase, hipC = [J.pelvis[0], J.pelvis[1] - 4];
  G.seg(ctx, M(hipC), M(nb), w * 1.55, jacket);
  const hc = M(J.headC), ha = J.headA, back_ = [hc[0] - Math.cos(ha) * 46 * k, hc[1] - Math.sin(ha) * 46 * k];
  G.seg(ctx, back_, [back_[0] - Math.cos(ha - .5) * 40 * k, back_[1] - Math.sin(ha - .5) * 40 * k + 14 * k], w * .62, fg);
  G.disc(ctx, hc[0], hc[1], 44 * k, fg);
  leg('n', fg);
  const a = arm('n', jacket, fg);
  // the watch: a small disc on the near wrist in the ground's tone, a ring of the figure's
  const wq = M([a.el[0] + (a.wr[0] - a.el[0]) * .8, a.el[1] + (a.wr[1] - a.el[1]) * .8]); G.disc(ctx, wq[0], wq[1], w * .42, PAL.yellow.t[3]);
  return J;
}

// ═════════ shared card parts
const pats = {};
const pat = (key, seed, o) => G.pattern(key, seed, o);
const rowDrift = (lt, sp = 1) => j => (j % 2 ? 1 : -1) * lt * 22 * sp;
function stageDisc(ctx, x, y, r, col, lt) {
  G.disc(ctx, x, y, r, col);
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  const sx = x - r * 1.6 + E.o3(inv(.1, 2.6, lt)) * r * 3.2, g = ctx.createLinearGradient(sx - r * .5, y - r, sx + r * .5, y + r);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,0.09)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
function chip(ctx, x, y, text, fg, bg, p) {
  if (p <= 0) return;
  ctx.save(); ctx.font = F.mono(22); ctx.letterSpacing = '4px'; const w = ctx.measureText(text).width + 36;
  ctx.beginPath(); ctx.rect(x, y - 30, w * E.oExp(p), 44); ctx.clip();
  G.rrect(ctx, x, y - 30, w, 44, 22, bg); ctx.fillStyle = fg; ctx.fillText(text, x + 18, y + 1); ctx.restore();
}
// title + Italian line + tag, each sliding up out of its mask, on the card's own clock (lt = seconds since the card began)
function textBlock(ctx, lt, x, y, o) {
  const k = o.k || 1, fg = o.fg; let px = o.px;
  ctx.save(); ctx.font = F.en(900, px); ctx.letterSpacing = -.02 * px + 'px'; const wm = ctx.measureText(o.title).width; ctx.restore();
  if (o.maxW && wm > o.maxW) px = Math.floor(px * o.maxW / wm);
  G.typeText(ctx, o.meta, x + 4, y - px * .74 - 34, F.mono(22), rgba(fg, .75), inv(0, .35 * k, lt), { ls: '3px' });
  G.maskText(ctx, o.title, x - px * .03, y, F.en(900, px), fg, inv(0, .5 * k, lt), { ls: -.02 * px + 'px' });
  G.maskText(ctx, o.it, x, y + o.ipx + 28, F.en(800, o.ipx), fg, inv(.08 * k, .58 * k, lt), { ls: '1px' });
  if (o.tag) chip(ctx, x, y + o.ipx + 100, o.tag, o.tagFg, o.tagBg, inv(.25 * k, .6 * k, lt));
}
function hud(ctx, t, fg, i) {
  ctx.save(); ctx.font = F.mono(17); ctx.letterSpacing = '3px'; ctx.fillStyle = rgba(fg, .8);
  ctx.textAlign = 'left'; ctx.fillText('LAST TRAIN HOME', 64, 70); ctx.fillText('23:58', 64, 96);
  ctx.textAlign = 'right'; ctx.fillText(`CH.0${i + 1}   ${['RAIN', 'STREET', 'TIME', 'STATION'][i]}`, W - 64, 70); ctx.fillText('NIGHT · RAIN', W - 64, 96);
  G.cloud(ctx, W - 64 - ctx.measureText('NIGHT · RAIN').width - 30, 100, 16, rgba(fg, .8));
  // progress: four ticks, the current one tall, done dimmed, the rest faint
  for (let k = 0; k < 4; k++) { const x = 64 + k * 40, cur = k === i; ctx.fillStyle = rgba(fg, cur ? .95 : k < i ? .45 : .18); ctx.fillRect(x, cur ? 990 : 1004, 26, cur ? 34 : 20); }
  ctx.textAlign = 'left'; ctx.fillStyle = rgba(fg, .8); ctx.fillText(`0${i + 1} / 04`, 64 + 4 * 40 + 18, 1024);
  ctx.restore();
}
function rain(ctx, t, x0, x1, y0, y1, n, col, seed = 1, r = 7) {
  const R = mulberry(seed);
  for (let i = 0; i < n; i++) { const x = lerp(x0, x1, R()), y = y0 + ((R() * (y1 - y0) + t * 760) % (y1 - y0)); G.drop(ctx, x, y, r, col); }
}

// ═════════ card 1 (0–2.5): SPLASH — rain navy; the figure crosses the stage disc and lands in the puddle on the half beat
const S1 = { x: 1290, y: 540, r: 370 };
function card1(ctx, t) {
  const P = PAL.navy, lt = t;
  ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
  G.drawPattern(ctx, pat('navy', 3, { spread: .45, set: 'rain' }), rowDrift(lt, 1));
  stageDisc(ctx, S1.x, S1.y, S1.r, P.t[4], lt);
  ctx.save(); ctx.beginPath(); ctx.arc(S1.x, S1.y, S1.r, 0, TAU); ctx.clip();
  // the ground: a capsule across the disc; the puddle: a flat capsule of the sky's tone
  const gy = S1.y + 150, k = .5, age = t - EV.splash;
  G.seg(ctx, [S1.x - S1.r, gy + 22], [S1.x + S1.r, gy + 22], 26, P.t[2]);
  G.rrect(ctx, S1.x - 170, gy + 6, 340, 34, 17, PAL.sky.t[2]);
  if (age > 0) for (let r = 0; r < 3; r++) { const a = age - r * .12; if (a > 0 && a < 1) { ctx.save(); ctx.translate(S1.x, gy + 22); ctx.scale(1, .22); G.ring(ctx, 0, 0, 40 + a * 300, 10 * (1 - a), CREAM); ctx.restore(); } }
  rain(ctx, t, S1.x - S1.r, S1.x + S1.r, S1.y - S1.r, gy, 18, PAL.sky.t[3], 4, 8);
  if (t > .3 && t < 2.1) figure(ctx, t, k, S1.x, gy + 8, SPL.x, CREAM, P.t[4], PAL.coral.t[2]);
  // the splash: drop pictograms thrown up from the puddle and falling back
  if (age > 0 && age < .8) { const R = mulberry(5); for (let i = 0; i < 10; i++) { const vx = (R() - .5) * 700, vy = -380 - R() * 420, x = S1.x + vx * age, y = gy + vy * age + 1500 * age * age; if (y < gy + 20) G.drop(ctx, x, y, 11 + R() * 6, CREAM); } }
  ctx.restore();
  textBlock(ctx, lt, 130, 560, { title: 'SPLASH', px: 250, it: 'la pozzanghera', ipx: 72, fg: CREAM, meta: '01 · 23:58:40', tag: 'CAFE · 24H', tagFg: P.t[0], tagBg: CREAM, maxW: 900 });
  hud(ctx, t, CREAM, 0);
}

// ═════════ card 2 (2.5–7.5): CORRI — storm ink with lamp yellow; she runs in place on the disc while the street's pictograms pass
const S2 = { x: 1290, y: 540, r: 390 }, K2 = .52;
const STATIONS = [['cup', 'CAFE'], ['book', 'BOOKS'], ['bowl', 'NOODLES'], ['bread', 'BAKERY'], ['bed', 'HOTEL'], ['record', 'RECORDS'], ['flower', 'FLOWERS']];
function station(ctx, kind, x, y, s, col, col2) {
  if (kind === 'cup') { G.rrect(ctx, x - s * .5, y - s * .7, s, s * .7, s * .18, col); G.ring(ctx, x + s * .55, y - s * .4, s * .18, s * .1, col); G.seg(ctx, [x - s * .2, y - s * 1.1], [x - s * .1, y - s * .85], s * .08, col2); G.seg(ctx, [x + s * .1, y - s * 1.15], [x + s * .2, y - s * .9], s * .08, col2); }
  else if (kind === 'book') { G.rrect(ctx, x - s * .55, y - s * .9, s * .5, s * .9, s * .06, col); G.rrect(ctx, x + s * .05, y - s * .9, s * .5, s * .9, s * .06, col2); }
  else if (kind === 'bowl') { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y - s * .45, s * .6, 0, Math.PI); ctx.fill(); G.seg(ctx, [x + s * .1, y - s * 1.2], [x + s * .45, y - s * .55], s * .07, col2); G.seg(ctx, [x + s * .25, y - s * 1.2], [x + s * .55, y - s * .6], s * .07, col2); }
  else if (kind === 'bread') { G.rrect(ctx, x - s * .65, y - s * .55, s * 1.3, s * .55, s * .27, col); for (let i = -1; i <= 1; i++) G.seg(ctx, [x + i * s * .3 - s * .08, y - s * .45], [x + i * s * .3 + s * .08, y - s * .2], s * .06, col2); }
  else if (kind === 'bed') { G.rrect(ctx, x - s * .7, y - s * .45, s * 1.4, s * .3, s * .08, col); G.rrect(ctx, x - s * .7, y - s * .8, s * .12, s * .8, s * .05, col); G.disc(ctx, x - s * .4, y - s * .58, s * .13, col2); }
  else if (kind === 'record') { G.disc(ctx, x, y - s * .55, s * .55, col); G.disc(ctx, x, y - s * .55, s * .18, col2); G.disc(ctx, x, y - s * .55, s * .04, col); }
  else { G.seg(ctx, [x, y], [x, y - s * .7], s * .07, col2); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; G.disc(ctx, x + Math.cos(a) * s * .16, y - s * .85 + Math.sin(a) * s * .16, s * .14, col); } G.disc(ctx, x, y - s * .85, s * .1, col2); }
}
function card2(ctx, t) {
  const P = PAL.ink, lt = t - 2.5, td = t;
  ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
  G.drawPattern(ctx, pat('ink', 8, { spread: .5, set: 'rain' }), rowDrift(lt, 1.6));
  stageDisc(ctx, S2.x, S2.y, S2.r, P.t[4], lt);
  ctx.save(); ctx.beginPath(); ctx.arc(S2.x, S2.y, S2.r, 0, TAU); ctx.clip();
  // the street slides under her at her own speed, so the planted foot stays planted on it
  const gy = S2.y + 190, sx = (X(t) - X(2.5)) * K2;
  G.seg(ctx, [S2.x - S2.r, gy + 22], [S2.x + S2.r, gy + 22], 26, P.t[2]);
  STATIONS.forEach(([kind], i) => { const x = S2.x + 280 + i * 520 - sx; if (x < S2.x - S2.r - 200 || x > S2.x + S2.r + 200) return; station(ctx, kind, x, gy - 30, 150, P.t[2], P.accent); });
  for (let i = 0; i < 9; i++) { const x = S2.x + 20 + i * 520 - sx; if (Math.abs(x - S2.x) > S2.r + 60) continue; G.seg(ctx, [x, gy + 10], [x, gy - 320], 16, P.t[2]); G.disc(ctx, x, gy - 336, 24, P.accent); }
  rain(ctx, t, S2.x - S2.r, S2.x + S2.r, S2.y - S2.r, gy, 20, mix(P.t[4], CREAM, .35), 9, 7);
  figure(ctx, td, K2, S2.x - 40, gy + 8, X(t), CREAM, P.t[4], PAL.coral.t[2]);
  ctx.restore();
  // the tag names the station passing behind her; "23:58" slides in on the beat after she lifts her wrist
  const cur = STATIONS[clamp(Math.round((sx - 320) / 520), 0, STATIONS.length - 1)][1];
  textBlock(ctx, lt, 130, 560, { title: 'CORRI', px: 250, it: 'run for the last train', ipx: 56, fg: CREAM, meta: '02 · 23:58:43', tag: cur, tagFg: P.t[0], tagBg: P.accent, maxW: 900 });
  if (t >= 6.25 - .2) chip(ctx, 130, 860, 'WATCH  23:58', P.t[0], CREAM, inv(6.25 - .2, 6.25 + .1, t));
  hud(ctx, t, CREAM, 1);
}

// ═════════ card 3 (7.5–9.375): 23:58 — signal yellow (a light hue: dark type, dark pictogram); the stage disc is the watch
const S3 = { x: 1290, y: 540, r: 330 };
const AH = (11 + 58 / 60) / 12 * TAU, AM = 58 / 60 * TAU;
function watch(ctx, t, P, sec) {
  // forearm: a coral capsule from the lower left, the strap above and below the disc
  G.seg(ctx, [S3.x - 900, S3.y + 420], [S3.x - 40, S3.y + 40], 220, PAL.coral.t[2]);
  G.seg(ctx, [S3.x, S3.y - S3.r - 120], [S3.x, S3.y + S3.r + 120], 170, P.fg);
  G.disc(ctx, S3.x, S3.y, S3.r + 22, P.fg);
  stageDisc(ctx, S3.x, S3.y, S3.r, P.t[4], t - 7.5);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; G.disc(ctx, S3.x + Math.sin(a) * S3.r * .82, S3.y - Math.cos(a) * S3.r * .82, i % 3 ? 10 : 18, P.fg); }
  const hand = (a, L, w) => G.seg(ctx, [S3.x, S3.y], [S3.x + Math.sin(a) * L, S3.y - Math.cos(a) * L], w, P.fg);
  hand(AH, S3.r * .48, 30); hand(AM, S3.r * .7, 20);
  const sa = sec / 60 * TAU; G.seg(ctx, [S3.x - Math.sin(sa) * 50, S3.y + Math.cos(sa) * 50], [S3.x + Math.sin(sa) * S3.r * .76, S3.y - Math.cos(sa) * S3.r * .76], 8, PAL.coral.t[1]);
  G.disc(ctx, S3.x, S3.y, 22, PAL.coral.t[1]);
}
function card3(ctx, t) {
  const P = PAL.yellow, lt = t - 7.5, sec = 47 + (t >= 8.4 ? 1 : 0) + (t >= 9.4 ? 1 : 0);
  ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
  G.drawPattern(ctx, pat('yellow', 12, { spread: .22, density: .3, set: 'sun' }), rowDrift(lt, 1));
  watch(ctx, t, P, sec);
  rain(ctx, t, 0, W, 0, H, 10, rgba(P.fg, .35), 13, 6);
  textBlock(ctx, lt, 130, 560, { title: '23:58', px: 270, it: 'ultimo treno', ipx: 72, fg: P.fg, meta: `03 · 23:58:${sec}`, tag: `SEC ${sec}`, tagFg: P.t[4], tagBg: P.fg, maxW: 820 });
  hud(ctx, t, P.fg, 2);
}

// ═════════ card 4 (9.375–10): STAZIONE — brick coral; the clock on its tower, rings on the chime (a short card: timings compressed)
function card4(ctx, t) {
  const P = PAL.coral, lt = t - 9.375;
  ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
  G.drawPattern(ctx, pat('coral', 21, { spread: .45, set: 'sun' }), j => (j % 2 ? 1 : -1) * (Math.floor((t - 9.375) / (BEAT / 4)) * 45));
  // the tower: capsules under the clock; the city: a row of round-capped blocks
  G.seg(ctx, [S3.x, S3.y + 200], [S3.x, H + 200], 300, P.t[0]);
  for (let i = 0; i < 5; i++) G.seg(ctx, [S3.x - 300 - i * 150, H + 60], [S3.x - 300 - i * 150, 760 + (i % 2) * 80], 110, P.t[0]);
  for (let i = 0; i < 3; i++) G.seg(ctx, [S3.x + 300 + i * 150, H + 60], [S3.x + 300 + i * 150, 780 + (i % 2) * 70], 110, P.t[0]);
  G.disc(ctx, S3.x, S3.y, S3.r + 22, P.t[0]);
  stageDisc(ctx, S3.x, S3.y, S3.r, P.t[4], lt);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; G.disc(ctx, S3.x + Math.sin(a) * S3.r * .82, S3.y - Math.cos(a) * S3.r * .82, i % 3 ? 10 : 18, P.t[0]); }
  G.seg(ctx, [S3.x, S3.y], [S3.x + Math.sin(AH) * S3.r * .48, S3.y - Math.cos(AH) * S3.r * .48], 30, P.t[0]);
  G.seg(ctx, [S3.x, S3.y], [S3.x + Math.sin(AM) * S3.r * .7, S3.y - Math.cos(AM) * S3.r * .7], 20, P.t[0]);
  const ch = t - EV.chime;
  if (ch > 0) for (let r = 0; r < 3; r++) { const a = ch - r * .09; if (a > 0) G.ring(ctx, S3.x, S3.y, S3.r + 50 + a * 900, 22 * (1 - Math.min(1, a / .5)) + 4, CREAM); }
  textBlock(ctx, lt, 130, 560, { title: 'STATION', px: 230, it: 'la stazione', ipx: 72, fg: CREAM, meta: '04 · 23:58:49', k: .4, maxW: 740 });
  hud(ctx, t, CREAM, 3);
}

// ═════════ grid transitions, composed from two offscreen cards
const A = G.canvas(), B = G.canvas(), a = A.getContext('2d'), b = B.getContext('2d');
const CARDS = [[0, card1], [2.5, card2], [7.5, card3], [9.375, card4]];
const cardAt = t => CARDS.filter(c => t >= c[0]).pop()[1];
function draw(ctx, t, fn) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.save(); fn(ctx, t); ctx.restore(); }
window.render = t => {
  out.setTransform(1, 0, 0, 1, 0, 0);
  if (t >= 2.34 && t < 2.68) {                                          // sliding rows: alternate rows travel opposite ways
    draw(a, t, card1); draw(b, Math.max(t, 2.5), card2);
    const S = G.CELL;
    for (let j = 0; j * S < H; j++) { const d = j % 2 ? 1 : -1, e = E.ioExp(inv(2.34 + j * .012, 2.62 + j * .012, t)), off = d * W * e;
      out.drawImage(A, 0, j * S, W, S, off, j * S, W, S); out.drawImage(B, 0, j * S, W, S, off - d * W, j * S, W, S); }
    return;
  }
  if (t >= 7.38 && t < 7.64) {                                          // quarter-discs grow from the cell corners
    draw(a, t, card2); draw(b, Math.max(t, 7.5), card3); out.drawImage(A, 0, 0);
    const S = G.CELL, p = E.io3(inv(7.38, 7.62, t));
    out.save(); out.beginPath();
    for (let j = 0; j * S < H; j++) for (let i = 0; i * S < W; i++) { const c = (i + j) % 4, cx = i * S + (c === 1 || c === 2 ? S : 0), cy = j * S + (c >= 2 ? S : 0), r = p * S * 1.45 * (1 + ((i * 7 + j * 3) % 5) * .04);
      out.moveTo(cx, cy); out.arc(cx, cy, r, 0, TAU); }
    out.clip(); out.drawImage(B, 0, 0); out.restore();
    return;
  }
  if (t >= 9.375 && t < 9.5) {                                          // an iris from the watch's disc: the station clock is the same circle
    draw(a, 9.374, card3); draw(b, t, card4); out.drawImage(A, 0, 0);
    const r = S3.r + 22 + E.io3(inv(9.375, 9.49, t)) * 2000;
    out.save(); out.beginPath(); out.arc(S3.x, S3.y, r, 0, TAU); out.clip(); out.drawImage(B, 0, 0); out.restore();
    return;
  }
  draw(out, t, cardAt(t));
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0);
window.READY = true;
