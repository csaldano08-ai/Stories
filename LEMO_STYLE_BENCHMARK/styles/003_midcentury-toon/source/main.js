// 003 · Mid-century Cartoon — the first 10 s of "Last Train Home" rebuilt in the 1950s limited-animation grammar
// (lemo-opuscar styles/midcentury-toon): off-register colour cels re-rolled on twos, breathing broken ink line, flat
// colour planes instead of drawn rooms, geometric figure, ornaments (atomic sparkles, starbursts, sunburst rays), iris
// transitions through round objects, stand camera (never handheld). Page contract: window.render(t), DUR, READY, RIGQA.
import { PAL, setClock, shape, plane, ink, ellipse, spline, xform, move, rrect, rect, TAU, reg, path, rays, sparkle, star, text, paperFinish, textures, twos, hash, clamp, lerp, seg, ss, eo, eio, back } from './engine/toon.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { DUR, FPS, shotAt, T, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { drawAki50, hand50, C } from './aki50.js';

const W = 1920, H = 1080;
const Q = new URLSearchParams(location.search);
const cv = document.getElementById('c'), g = cv.getContext('2d', { willReadFrequently: true });
await Promise.all(['80px Slab', '600 40px Jost', '500 40px Jost', '700 80px Oleo'].map(f => document.fonts.load(f)));
textures();

// night in the atomic-age palette: soft complements, nothing pure or neon; the coat's vermilion is never used as a ground
const N = { sky: '#283152', skyD: '#222A46', wall: '#2C3454', far: ['#34405F', '#3C4A6A', '#2F3A57'], win: '#F3D37F', winB: '#E8B43A', winD: '#252B42',
  pave: '#3B4563', paveL: '#4A5577', puddle: '#262F4C', paper: '#F4EAD5', glow: '#E8B43A' };
const FAC = ['#5B3F5D', '#2F6B68', '#6B6E43', '#4E5C80', '#8A6A3A'];
const SIGNS = [['24H', PAL.tealL], ['CAFE', PAL.pink], ['BAKERY', PAL.mustardL], ['BAR', PAL.pink], ['BOOKS', PAL.blueL], ['PHARMACY', PAL.avocadoL], ['NOODLES', PAL.mustardL],
  ['LAUNDRY', PAL.tealL], ['RECORDS', PAL.pink], ['HOTEL', PAL.mustardL], ['FLOWERS', PAL.pink], ['DINER', PAL.tealL]];
const BEAT = 60 / 96;

// ——— the run (shared rig: planGait contacts on the shared footfall grid, reach-limited IK, foot lock) ———
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const sec = (t, t0) => secondary(tq => { const p = RUN.pelvisAt(tq); return [p[0], p[1] - 250]; }, t0, t);
// the watch check as a hand action: anticipation (the arm pulls back), a fast raise eased out that lands on the beat (6.25 s),
// a hold while she reads it, then the arm drops back into the swing with a follow-through.
function poseAt(t) {
  const S = RUN.pose(t);
  const up = back(seg(t, T.watchUp, T.watchUp + .2), 1.3), dn = ss(seg(t, T.watchDown - .14, T.watchDown + .2));
  const w = clamp(up, 0, 1.1) * (1 - dn), ant = Math.sin(Math.PI * seg(t, T.watchUp - .16, T.watchUp)) * .3;
  S.arms.n.sh -= ant;
  S.watch = w;
  if (w > 0) {
    const J0 = solveProfile(S), sh = J0.sh.n, runArm = J0.arm.n;
    const tgt = [sh[0] + lerp(70, 90, Math.min(1, w)), sh[1] + lerp(150, 54, Math.min(1, w)) + (w > 1 ? (w - 1) * -40 : 0)];
    S.arms.n = { tgt: [lerp(runArm.wr[0], tgt[0], Math.min(1, w)), lerp(runArm.wr[1], tgt[1], Math.min(1, w))], bend: -1, hand: 'grip' };
    S.arms.f.sh *= 1 - .45 * Math.min(1, w); S.arms.f.el = lerp(S.arms.f.el, 1.4, Math.min(1, w) * .5);
    S.head += .28 * Math.min(1, w); S.neck += .08 * Math.min(1, w);
  }
  return S;
}
function aki(t, ox, oy, s, extra = {}) {
  const S = poseAt(t), J = solveProfile(S), sc = sec(t, 0), w = Math.min(1, S.watch || 0);
  const blink = [3.62, 5.18, 8.9].some(b => t >= b && t < b + 2 / 15) ? 1 : 0;
  g.save(); g.translate(ox, oy); g.scale(s, s);
  const r = drawAki50(g, J, { k: 1 / s, hairLag: sc.hair.back, hemB: sc.hemB, hemF: sc.hemF, cuffBack: w, mouth: w > .5 ? 'o' : 'pant', lookDown: w, look: w > .5 ? .2 : .5, blink, ...extra });
  g.restore();
  return { J, S, watch: r.watch && [ox + r.watch[0] * s, oy + r.watch[1] * s] };
}

// ——— rain (ink strokes in paper colour, on twos) ———
function rain(t, o = {}) {
  const tq = twos(t), n = o.n ?? 150, camX = o.camX || 0, a = o.alpha ?? .42;
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const z = .45 + hash(i, 3) * .9, len = 26 + 40 * z, sp = 1500 + 900 * z;
    const y = ((hash(i, 1) * 1300 + tq * sp) % 1300) - 110, x = ((hash(i, 2) * 2400 - camX * z * .9 - y * .2) % 2400 + 2400) % 2400 - 240;
    g.strokeStyle = `rgba(244,234,213,${(a * (.5 + z * .5)).toFixed(3)})`; g.lineWidth = 1.4 + z * 1.6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - len * .2, y + len); g.stroke();
  }
  g.restore();
}
// a footfall splash: an 8-point paper starburst that pops and fades + inked droplets (on twos)
function splash(u, x, y, s = 1, seed = 1) {
  if (u < 0 || u > .7) return;
  u = twos(u);
  if (u < .28) star(g, x, y - 10 * s, (30 + 120 * eo(u / .28)) * s, { n: 8, inner: .38, fill: N.paper, alpha: .85 * (1 - u / .28), rot: hash(seed) * .4, seed });
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (hash(seed, i) - .5) * 2.2, sp = (260 + hash(seed, i + 9) * 280) * s, px = x + Math.cos(a) * sp * u, py = y + Math.sin(a) * sp * u + 1300 * u * u * s;
    if (py > y + 4) continue;
    shape(g, ellipse(px, py, 5.5 * s, 8 * s, 10, 0, TAU, a + Math.PI / 2), { fill: N.paper, line: 2.4, seed: seed + i, grain: 0, breaks: 0 });
  }
  if (u > .05) ink(g, ellipse(x, y + 4, (40 + 220 * u) * s, (8 + 30 * u) * s, 40), 3, { closed: true, breaks: .35, color: N.paper, alpha: .7 * (1 - u / .7), seed: seed + 3 });
}
// a shop sign: board with two-plate lettering (ink over an off-register colour plate)
function sign(x, y, word, col, o = {}) {
  const px = o.px || 54, font = o.slab ? `${px}px Slab` : `600 ${px}px Jost`;
  g.save(); g.font = font; g.letterSpacing = (o.track ?? 6) + 'px'; const tw = g.measureText(word).width; g.restore();
  const bw = tw + px * 1.1, bh = px * 1.45;
  shape(g, rrect(x - bw / 2, y - bh / 2, bw, bh, 10), { fill: o.board || N.paper, line: 4, seed: o.seed || 5, grain: .25, breaks: .2 });
  text(g, word, x, y + px * .36, { font, fill: o.ink || PAL.ink, plate: col, align: 'center', track: o.track ?? 6, seed: (o.seed || 5) + 1 });
  return bw;
}

// ——— S2 street layout (mid layer, px at parallax .82) ———
const FACADES = (() => { const out = []; let x = -1100, i = 0; while (x < 7600) { const w = 560 + hash(i, 7) * 220; out.push({ x, w, top: 150 + hash(i, 8) * 170, col: FAC[i % FAC.length], sign: SIGNS[i % SIGNS.length], blade: i % 3 === 2, i }); x += w + 14; i++; } return out; })();
const TOWERS = (() => { const out = []; let x = -600, i = 0; while (x < 4200) { const w = 150 + hash(i, 21) * 170; out.push({ x, w, top: 70 + hash(i, 22) * 260, col: N.far[i % 3], dome: hash(i, 23) < .25, ant: hash(i, 24) < .4, i }); x += w + 30 + hash(i, 25) * 60; i++; } return out; })();
const HOR = 792;
function facade(F, ox) {
  const x = F.x - ox, w = F.w; if (x > W + 40 || x + w < -40) return;
  const top = F.top, s = 100 + F.i * 17;
  shape(g, rect(x, top, w, HOR - top + 6), { fill: F.col, line: 4.5, seed: s, grain: .3, breaks: .22, shade: [{ pts: rect(x - 10, top - 10, 34, HOR - top + 20), color: '#1E2238', alpha: .35 }] });
  shape(g, rect(x - 12, top - 22, w + 24, 26), { fill: '#2B2D44', line: 3.5, seed: s + 1, grain: .2, breaks: .3 });
  for (let yy = top + 44, r = 0; yy < 400; yy += 112, r++) for (let xx = x + 56, c = 0; xx < x + w - 100; xx += 118, c++) {
    const lit = hash(F.i, r * 7 + c) < .52;
    shape(g, rect(xx, yy, 62, 78), { fill: lit ? N.win : N.winD, line: 3.2, seed: s + 10 + r * 9 + c, grain: .2, breaks: .25, shade: lit ? [{ pts: rect(xx, yy + 44, 62, 40), color: N.winB, alpha: .75 }] : null });
  }
  // awning (alternating stripes, scalloped edge) and the lit shop window with a few geometric displays
  const ay = 500, aw = w - 70, ax = x + 35, n = Math.max(6, Math.round(aw / 70)), sw = aw / n;
  for (let k = 0; k < n; k++) shape(g, [[ax + k * sw, ay], [ax + (k + 1) * sw, ay], [ax + (k + 1) * sw + 10, ay + 46], [ax + k * sw + 10, ay + 46]], { fill: k % 2 ? N.paper : F.sign[1], line: 0, seed: s + 40 + k, grain: .2 });
  for (let k = 0; k < n; k++) shape(g, ellipse(ax + 10 + (k + .5) * sw, ay + 46, sw / 2, 12, 12, 0, Math.PI), { fill: k % 2 ? N.paper : F.sign[1], line: 0, seed: s + 60 + k, grain: .1 });
  ink(g, [[ax, ay], [ax + aw, ay], [ax + aw + 10, ay + 46]], 3.5, { seed: s + 70, breaks: .2 });
  const wy = 572, ww = w - 220;
  shape(g, rect(x + 40, wy, ww, 196), { fill: hash(F.i, 3) < .5 ? N.win : '#F0C9A8', line: 4, seed: s + 80, grain: .25, breaks: .2, shade: [{ pts: rect(x + 40, wy + 140, ww, 60), color: N.winB, alpha: .5 }] });
  for (let k = 0; k < 4; k++) { const cx = x + 90 + k * (ww - 80) / 3, kind = (F.i + k) % 3;
    if (kind === 0) shape(g, ellipse(cx, wy + 130, 30, 22, 16), { fill: F.sign[1], line: 3, seed: s + 90 + k });
    else if (kind === 1) shape(g, rect(cx - 16, wy + 84, 32, 70), { fill: FAC[(F.i + k + 2) % 5], line: 3, seed: s + 90 + k });
    else star(g, cx, wy + 110, 26, { n: 4, inner: .3, fill: N.paper, seed: s + 90 + k }); }
  ink(g, [[x + 40, wy + 160], [x + 40 + ww, wy + 160]], 3, { seed: s + 99, breaks: .3 });
  shape(g, rect(x + w - 150, wy - 10, 96, HOR - wy + 10), { fill: '#262B43', line: 4, seed: s + 100, grain: .2, breaks: .15 });
  shape(g, ellipse(x + w - 70, wy + 120, 5, 5, 10), { fill: N.glow, line: 0, seed: s + 101, grain: 0 });
  // sign: a board over the awning, or a vertical blade sign at the corner
  if (F.blade) {
    const bx = x + w - 30, word = F.sign[0];
    shape(g, rrect(bx - 30, 180, 60, 60 + word.length * 46, 10), { fill: '#2B2D44', line: 4, seed: s + 110, grain: .2, breaks: .2 });
    [...word].forEach((ch, k) => text(g, ch, bx, 236 + k * 46, { font: '42px Slab', fill: N.paper, plate: F.sign[1], align: 'center', seed: s + 111 + k }));
  } else sign(x + w / 2 - 20, 446, F.sign[0], F.sign[1], { seed: s + 120, px: F.sign[0].length > 6 ? 40 : 50, slab: F.i % 2 === 0 });
}
function tower(Tw, ox) {
  const x = Tw.x - ox, w = Tw.w; if (x > W + 40 || x + w < -40) return;
  const top = Tw.top;
  plane(g, rect(x, top, w, HOR - top), Tw.col);
  plane(g, rect(x + w * .72, top, w * .28, HOR - top), '#283350', { alpha: .55 });
  if (Tw.dome) plane(g, ellipse(x + w / 2, top, w / 2, w * .32, 24, Math.PI, TAU), Tw.col);
  if (Tw.ant) ink(g, [[x + w * .5, top - (Tw.dome ? w * .32 : 0)], [x + w * .5, top - 70 - (Tw.dome ? w * .32 : 0)]], 3.5, { seed: 200 + Tw.i, color: '#1E2238' });
  for (let yy = top + 30, r = 0; yy < HOR - 40; yy += 34, r++) for (let xx = x + 22, c = 0; xx < x + w - 16; xx += 30, c++)
    if (hash(Tw.i * 31 + r, c) < .34) { g.fillStyle = hash(Tw.i, r * 5 + c) < .7 ? N.win : PAL.pink; g.globalAlpha = .85; g.beginPath(); g.arc(xx, yy, 5, 0, TAU); g.fill(); g.globalAlpha = 1; }
}
function skySparkles(t, ox = 0, n = 26) {
  const f = Math.floor(t * 15);
  for (let i = 0; i < n; i++) { const x = ((hash(i, 41) * 2200 - ox) % 2200 + 2200) % 2200 - 140, y = 30 + hash(i, 42) * 260, tw = .55 + .45 * Math.sin(f * .9 + i * 2.1);
    sparkle(g, x, y, (8 + hash(i, 43) * 12) * tw, { fill: N.paper, alpha: .8, rot: hash(i, 44) * .3 }); }
}

// ——— S1 · 0–2.5 · ground-level insert: the puddle, the shop signs upside down in it, the boot lands at 0.9375 ———
const PX = 760, PY = 858, S1S = 2.2, S1G = 905;
const PUD = xform(spline([[-1, -.1], [-.6, -.62], [.05, -.52], [.38, -.24], [.82, -.58], [1.06, .04], [.62, .56], [-.42, .52]], true, 10), PX, PY, 0, 520, 190);
function S1(t, lt) {
  const tq = twos(t), push = 1 + .035 * eio(lt / 2.5);
  g.save(); g.translate(PX, 640); g.scale(push, push); g.translate(-PX, -640);
  plane(g, rect(-200, -200, W + 400, 820), N.wall);
  // the shopfronts behind: flat lit windows, a door, the 24H and CAFE boards (what the puddle reflects)
  shape(g, rect(-120, 60, 980, 560), { fill: FAC[1], line: 4.5, seed: 11, grain: .3, breaks: .2 });
  shape(g, rect(880, 30, 1200, 590), { fill: FAC[0], line: 4.5, seed: 12, grain: .3, breaks: .2 });
  shape(g, rect(-40, 300, 640, 300), { fill: N.win, line: 4, seed: 13, shade: [{ pts: rect(-40, 470, 640, 140), color: N.winB, alpha: .6 }] });
  shape(g, rect(980, 310, 560, 290), { fill: '#F0C9A8', line: 4, seed: 14, shade: [{ pts: rect(980, 470, 560, 140), color: N.winB, alpha: .5 }] });
  shape(g, rect(640, 280, 150, 340), { fill: '#262B43', line: 4, seed: 15 });
  shape(g, rect(1620, 270, 150, 350), { fill: '#262B43', line: 4, seed: 16 });
  rays(g, 330, 180, 30, 260, N.glow, { alpha: .10, rot: t * .25, r0: 60 });
  sign(330, 180, '24H', PAL.tealL, { px: 90, slab: true, seed: 17 });
  sign(1250, 200, 'CAFE', PAL.pink, { px: 86, seed: 18, track: 10 });
  ink(g, [[-200, 620], [W + 200, 620]], 4.5, { seed: 19, breaks: .4 });                       // horizon line with gaps
  plane(g, rect(-200, 620, W + 400, 700), N.pave);
  for (let k = 0; k < 7; k++) ink(g, [[-200 + k * 400 + 120, 1010], [-200 + k * 400 + 360, 1010]], 3, { seed: 20 + k, color: N.paveL, taper: true });
  // the puddle: a kidney plane; inside it the boards upside down, wobbling in strips (on twos), stirred by the splash
  shape(g, PUD, { fill: N.puddle, line: 3.5, seed: 21, grain: .2, breaks: .45 });
  const stir = t > T.splash ? 14 * Math.exp(-(t - T.splash) * 2.2) : 0;
  g.save(); path(g, PUD); g.clip();
  for (let yy = 730; yy < 980; yy += 18) {
    g.save(); g.beginPath(); g.rect(0, yy, W, 18); g.clip(); g.translate(Math.sin(yy * .05 + tq * 6) * (1.6 + stir), 0);
    for (let k = 0; k < 4; k++) { plane(g, rrect(260 + k * 40, 760 + k * 34, 300 - k * 30, 12, 6), N.win, { alpha: .45 }); plane(g, rrect(960 + k * 30, 770 + k * 36, 260 - k * 40, 12, 6), '#F0C9A8', { alpha: .4 }); }
    g.save(); g.translate(470, 870); g.scale(1, -1); g.globalAlpha = .5; sign(0, 0, '24H', PAL.tealL, { px: 70, slab: true, seed: 17 }); g.restore();
    g.save(); g.translate(1110, 846); g.scale(1, -1); g.globalAlpha = .5; sign(0, 0, 'CAFE', PAL.pink, { px: 66, seed: 18, track: 10 }); g.restore();
    g.restore();
  }
  for (let k = 0; k < 6; k++) { const y = 770 + k * 34, ph = tq * 40 + k * 70; ink(g, [[PX - 470 + (ph % 60), y], [PX + 480, y + 6]], 2, { color: N.paper, alpha: .35, breaks: .55, seed: 30 + k, taper: false }); }
  // rain rings on the water (broken ink ellipses, on twos)
  for (let i = 0; i < 9; i++) { const per = .7 + hash(i, 51) * .5, u = ((tq + hash(i, 52) * per) % per) / per, x = PX - 380 + hash(i, 53) * 760 + Math.floor((tq + hash(i, 52) * per) / per) * 97 % 300 - 150, y = PY - 90 + hash(i, 54) * 170;
    ink(g, ellipse(x, y, 6 + 50 * u, 2 + 12 * u, 24), 2.2, { closed: true, breaks: .3, color: N.paper, alpha: .6 * (1 - u), seed: i }); }
  g.restore();
  // the runner's legs, drawn on twos (camera on the stand: planted feet hold, the held drawings never slide)
  const c = RUN.contacts.find(c => Math.abs(c.t0 - T.splash) < .02), ox = PX - 20 - c.x * S1S;
  if (tq > .3 && tq < 1.75) { const r = aki(tq, ox, S1G, S1S); if (tq > .9 && tq < 1.6) { /* reflection of the boots: flat dark plane, clipped */ } }
  for (const k of RUN.contacts) splash(t - k.t0, ox + k.x * S1S + 10, S1G - 2, Math.abs(k.t0 - T.splash) < .02 ? 2.3 : 1.1, Math.round(k.t0 * 100));
  if (t >= T.splash) { const u = t - T.splash; for (let j = 0; j < 3; j++) { const v = u - j * .18; if (v > 0 && v < 1.4) ink(g, ellipse(PX + 10, PY + 30, 30 + 330 * eo(v / 1.4), 8 + 80 * eo(v / 1.4), 48), 3.2, { closed: true, breaks: .3, color: N.paper, alpha: .75 * (1 - v / 1.4), seed: 60 + j }); } }
  rain(t, { n: 170, alpha: .45 });
  g.restore();
}

// ——— S2 · 2.5–7.5 · side tracking run (camera and the run on ones; cels, hands and blinks re-roll on twos) ———
const S2S = .78, S2G = 962, POST = 3600;
const POST_OFF = (() => { let best = 0, bd = -1; for (let off = 0; off < POST; off += 20) { let md = 1e9; for (let t = 5.85; t <= 7.5; t += 1 / 30) { const fg = (RUN.pelvisAt(t)[0] - 40 / S2S) * S2S * 1.6; for (let k = 0; k < 6; k++) md = Math.min(md, Math.abs(k * POST + off - fg - 900)); } if (md > bd) { bd = md; best = off; } } return best; })();
function S2(t, lt) {
  const camX = RUN.pelvisAt(t)[0] - 40 / S2S, sx = -camX * S2S + 860;
  const mid = camX * S2S * .82 - 1000, far = camX * S2S * .32 - 700, fg = camX * S2S * 1.6;
  plane(g, rect(0, 0, W, H), N.sky);
  skySparkles(t, camX * S2S * .05);
  for (const Tw of TOWERS) tower(Tw, far);
  for (const F of FACADES) facade(F, mid);
  plane(g, rect(0, HOR, W, H - HOR), N.pave);
  ink(g, [[-20, HOR], [W + 20, HOR]], 4.5, { seed: 301, breaks: .35 });
  // reflections: flat streaks under each lit shop window, and kidney puddles
  for (const F of FACADES) { const x = F.x - mid; if (x > W || x + F.w < 0) continue;
    plane(g, rect(x + 60, HOR + 14, F.w - 260, 10), N.win, { alpha: .35 }); plane(g, rect(x + 90, HOR + 34, F.w - 320, 8), N.win, { alpha: .22 });
    if (F.i % 2) shape(g, xform(spline([[-1, -.1], [-.5, -.5], [.4, -.3], [1, .05], [.5, .5], [-.5, .45]], true, 8), x + F.w * .4, 1010, 0, 150, 30), { fill: N.puddle, line: 2.6, seed: 320 + F.i, grain: .1, breaks: .5 }); }
  const fig = aki(t, sx, S2G, S2S);
  for (const k of RUN.contacts) splash(t - k.t0, sx + k.x * S2S + 10, S2G - 1, .7, Math.round(k.t0 * 100));
  // foreground lamp posts (parallax 1.6): a stick with a round lamp and a sunburst
  for (let k = 0; k < 5; k++) { const x = k * POST + POST_OFF - fg; if (x < -300 || x > W + 300) continue;
    rays(g, x, 250, 28, 230, N.glow, { alpha: .12, rot: t * .2 + k, r0: 40 });
    ink(g, [[x, H + 20], [x, 262]], 16, { seed: 340 + k, taper: false, wob: .05, color: '#1A1D30' });
    shape(g, ellipse(x, 250, 34, 30, 20), { fill: N.paper, line: 4, seed: 350 + k, grain: .1 }); }
  rain(t, { camX: camX * S2S, n: 150 });
  // iris into the watch: the circle closes on the near wrist, landing on the watch hit (7.5 s)
  if (t > 7.27 && fig.watch) irisMask(fig.watch[0], fig.watch[1], lerp(1300, 34, eio(seg(t, 7.27, 7.5))));
}
function irisMask(x, y, r) {
  g.save(); g.beginPath(); g.rect(0, 0, W, H); g.arc(x, y, Math.max(1, r), 0, TAU, true); g.fillStyle = PAL.ink; g.fill('evenodd');
  ink(g, ellipse(x, y, r + 3, r + 3, 64), 5, { closed: true, color: N.paper, breaks: .25, seed: 399, alpha: .8 }); g.restore();
}

// ——— S3 · 7.5–9.375 · the watch, drawn at native scale (STYLE §9: zooming the world triples the ink) ———
function S3(t, lt) {
  const tq = twos(t), ph = 2 * Math.PI * CADENCE * (tq - FIRST_STEP), bob = Math.sin(ph) * 9, roll = Math.sin(ph * .5) * .015;
  plane(g, rect(0, 0, W, H), N.skyD);
  rays(g, 1000, 520, 30, 1500, N.glow, { alpha: .09, rot: t * .18, r0: 0 });
  // the street lights as flat colour dashes streaming past (graphic motion on ones)
  const cols = [N.win, PAL.pink, PAL.tealL, PAL.mustard, PAL.blueL];
  for (let k = 0; k < 34; k++) { const y = 40 + hash(k, 61) * 1000, sp = 900 + hash(k, 62) * 1300, w = 140 + hash(k, 63) * 260, x = ((hash(k, 64) * 2600 - t * sp) % 2600 + 2600) % 2600 - 400;
    shape(g, rrect(x, y, w, 16 + hash(k, 65) * 18, 9), { fill: cols[k % 5], line: 0, alpha: .55, seed: 600 + k, grain: .1 }); }
  g.save(); g.translate(1000, 560 + bob); g.rotate(-.11 + roll);
  // sleeve (fat ink ribbon + off-register vermilion ribbon), cuff pushed back, skin forearm, four-finger fist
  const slv = [[-1500, 40], [-900, 24], [-330, 6]];
  ink(g, slv, 300, { taper: false, wob: .03, seed: 610 }); { const o = reg(611); ink(g, move(slv, o[0], o[1]), 286, { taper: false, wob: .02, color: C.coat, seed: 612 }); }
  { const o = reg(613); plane(g, move([[-1500, 120], [-330, 80], [-330, 150], [-1500, 190]], o[0], o[1]), C.coatD, { alpha: .6 }); }
  ink(g, [[-1100, -90], [-1000, 30], [-1080, 140]], 5, { seed: 614, color: C.coatD }); ink(g, [[-700, -100], [-620, 10], [-690, 130]], 5, { seed: 615, color: C.coatD });
  const arm2 = [[-340, 4], [80, -4], [330, -8]];
  ink(g, arm2, 208, { taper: false, wob: .03, seed: 620 }); { const o = reg(621); ink(g, move(arm2, o[0], o[1]), 196, { taper: false, wob: .02, color: C.skin, seed: 622 }); }
  { const o = reg(623); plane(g, move([[-330, 50], [330, 40], [330, 96], [-330, 104]], o[0], o[1]), C.skinD, { alpha: .55 }); }
  shape(g, rrect(-372, -158, 70, 316, 22), { fill: C.coatD, line: 5, seed: 625, grain: .3, breaks: .15 });
  hand50(g, 318, 4, -.05, 'grip', 1, 7.4, 6.5);
  // strap, case, dial with two-plate numerals, hands at 11:58, the second hand ticking once a second
  shape(g, rect(-96, -112, 192, 224), { fill: C.strap, line: 5, seed: 630, grain: .35, breaks: .15 });
  for (let k = -1; k <= 1; k += 2) ink(g, [[-80, k * 72], [80, k * 72]], 3, { seed: 631 + k, color: '#3A2418', taper: false });
  shape(g, ellipse(0, 0, 176, 176, 72), { fill: C.gold, line: 6, seed: 633, grain: .2, breaks: .12, shade: [{ pts: ellipse(30, 30, 176, 176, 72), color: C.goldD, alpha: .55 }] });
  shape(g, ellipse(0, 0, 140, 140, 64), { fill: C.dial, line: 4, seed: 634, grain: .15, breaks: .2 });
  for (let k = 0; k < 60; k++) { const a = k / 60 * TAU, r0 = k % 5 ? 122 : 108; ink(g, [[Math.sin(a) * r0, -Math.cos(a) * r0], [Math.sin(a) * 132, -Math.cos(a) * 132]], k % 5 ? 2.4 : 5, { seed: 640 + k, taper: false }); }
  [['12', 0, -84], ['3', 86, 0], ['6', 0, 86], ['9', -86, 0]].forEach(([s, x, y], i) => text(g, s, x, y + 14, { font: '40px Slab', fill: PAL.ink, plate: PAL.mustard, align: 'center', seed: 700 + i }));
  const secs = 41 + Math.floor(t - T.watchHit), mm = 58 + secs / 60, ha = (11 + mm / 60) / 12 * TAU, ma = mm / 60 * TAU, sa = secs / 60 * TAU;
  shape(g, xform([[-8, 14], [0, -72], [8, 14]], 0, 0, ha), { fill: PAL.ink, line: 0, off: [0, 0], grain: 0 });
  shape(g, xform([[-6, 16], [0, -112], [6, 16]], 0, 0, ma), { fill: PAL.ink, line: 0, off: [0, 0], grain: 0 });
  ink(g, [[-Math.sin(sa) * 24, Math.cos(sa) * 24], [Math.sin(sa) * 120, -Math.cos(sa) * 120]], 4, { color: PAL.coral, taper: false, seed: 710 });
  shape(g, ellipse(0, 0, 12, 12, 14), { fill: PAL.coral, line: 3, seed: 711, grain: 0, breaks: 0 });
  // raindrops on the crystal (inked, sliding slowly), a 4-point glint
  for (let k = 0; k < 6; k++) { const a = hash(k, 81) * TAU, d = hash(k, 82) * 100, sl = ((tq * (12 + hash(k, 83) * 20)) % 40);
    shape(g, ellipse(Math.cos(a) * d, Math.sin(a) * d + sl, 7 + hash(k, 84) * 5, 9 + hash(k, 84) * 6, 14), { fill: '#FFFFFF', line: 2.2, seed: 720 + k, grain: 0, breaks: .3, alpha: .8 }); }
  sparkle(g, -70, -78, 34 + 8 * Math.sin(Math.floor(t * 15) * 1.3), { fill: '#FFFFFF', alpha: .9 });
  g.restore();
  rain(t, { n: 110, alpha: .35 });
  if (lt < .24) irisMask(1000 + Math.cos(-.11) * 0, 560 + bob, lerp(178, 1400, eio(lt / .24)));
}

// ——— S4 · 9.375–10 · the sky over the city; the stand begins to tilt down, the station's starburst clock chimes ———
function S4(t, lt) {
  const tilt = 240 * Math.pow(seg(lt, 0, .625), 2);
  plane(g, rect(0, 0, W, H), N.sky);
  skySparkles(t, 0, 34);
  g.save(); g.translate(0, -tilt);
  for (let k = 0; k < 7; k++) { const x = ((hash(k, 91) * 2600 + t * 30 * (1 + hash(k, 92))) % 2600) - 340, y = 120 + hash(k, 93) * 420, s = 180 + hash(k, 94) * 200;
    const P = xform(spline([[-1, -.1], [-.6, -.55], [.1, -.45], [.35, -.15], [.8, -.45], [1.05, .05], [.6, .5], [-.4, .5]], true, 10), x, y, 0, s, s * .55);
    shape(g, P, { fill: '#343E62', line: 0, seed: 900 + k, grain: .25, shade: [{ pts: move(P, 0, s * .22), color: '#4A4468', alpha: .7 }] }); }
  for (let i = 0; i < 9; i++) { const x = -60 + i * 240 + hash(i, 95) * 60, w = 150 + hash(i, 96) * 120, top = 860 + hash(i, 97) * 200;
    plane(g, rect(x, top, w, 600), N.far[i % 3]); plane(g, rect(x + w * .7, top, w * .3, 600), '#283350', { alpha: .55 });
    for (let yy = top + 26, r = 0; yy < 1500; yy += 34, r++) for (let xx = x + 20, c = 0; xx < x + w - 14; xx += 30, c++) if (hash(i * 31 + r, c) < .36) { g.fillStyle = N.win; g.beginPath(); g.arc(xx, yy, 5, 0, TAU); g.fill(); } }
  // the station tower top with an atomic starburst clock
  const cx = 1330, cy = 1010;
  shape(g, [[cx - 90, 1500], [cx - 90, cy + 60], [cx, cy - 110], [cx + 90, cy + 60], [cx + 90, 1500]], { fill: '#3A3550', line: 4.5, seed: 950, breaks: .2 });
  star(g, cx, cy + 40, 92, { n: 12, inner: .62, fill: N.glow, line: 3.5, seed: 951 });
  shape(g, ellipse(cx, cy + 40, 52, 52, 40), { fill: N.paper, line: 4, seed: 952 });
  ink(g, [[cx, cy + 40], [cx - 14, cy + 6]], 5, { seed: 953, taper: false }); ink(g, [[cx, cy + 40], [cx - 4, cy - 2]], 3.5, { seed: 954, taper: false });
  if (t >= T.chime) { const u = t - T.chime; for (let j = 0; j < 3; j++) { const v = twos(u) - j * .1; if (v > 0) ink(g, ellipse(cx, cy + 40, 110 + 260 * v, 110 + 260 * v, 60, -2.6, -.55), 5, { color: N.paper, breaks: .35, alpha: Math.max(0, .8 - v * 1.4), seed: 960 + j }); } }
  g.restore();
  rain(t, { n: 160, alpha: .42 });
}

const SH = { S1, S2, S3, S4 };
function sheet() {   // ?test=sheet — model check: the run at 6 phases + the watch check, large
  plane(g, rect(0, 0, W, H), PAL.paper);
  [3.0, 3.06, 3.12, 3.18, 3.24, 6.5].forEach((tt, i) => { setClock(i * .5); aki(tt, 160 + i * 300 - (RUN.pelvisAt(tt)[0]) * .52, 900, .52); });
  setClock(0);
  const tt = 6.5, s = 1.35; aki(tt, 1700 - RUN.pelvisAt(tt)[0] * s, 1150, s);
}
function render(t) {
  setClock(t); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  if (Q.get('test') === 'sheet') { sheet(); return; }
  const [t0, , id] = shotAt(t); SH[id](t, t - t0);
  paperFinish(g, W, H, .9);
}
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const tt = id === 'S1' ? twos(t) : t; if (id === 'S1' && (tt <= .3 || tt >= 1.75)) return null;
  const J = solveProfile(poseAt(tt)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render = render; window.DUR = DUR; window.EV = []; render(0); window.READY = true;
