// 001 · 80s Cel Anime (improved) — the first 10 s of Last Train Home rebuilt on AKI v2 and the v2 run rig.
import { W, H, canvas, rgba, mix, path } from './shared/lib/cel.js';
import { clamp, lerp, seg, ss, eio, hash, mulberry, TAU } from './shared/lib/util.js';
import { solveProfile, drawProfile } from './shared/aki2/aki_profile.js';
import { PAL } from './shared/aki2/palette.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { hand2 } from './shared/aki2/hands2.js';
import { celGroup, iline } from './shared/lib/celgroup.js';
import { rain, groundRain } from './fx.js';
import { hands as clockHands } from './bg/plates1.js';
import { T, CADENCE, FIRST_STEP } from './shared/clip10.js';

const [rc, rg] = canvas(W, H);
// the run: touch-downs exactly on the shared footfalls (FIRST_STEP + k·STEP); stance 42 % of a step (v1: 62 % → unreachable feet)
export const RUN = runner({ t0: FIRST_STEP + 1 / CADENCE, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const sec = (t, t0) => secondary(tq => { const p = RUN.pelvisAt(tq); return [p[0], p[1] - 250]; }, t0, t);
const LST = { sh: [9, 1], hi: [3, .5], rim: { c: '#ff5fb3', d: [-3.2, 0] } };
const faceRun = { open: .82, lid: .2, mouth: 'pant', brow: [-3, 3, 1.2], sweat: .7, look: [.45, 0] };

// the watch check, as a real arm action: the LEFT (near) arm comes up across the chest, the forearm turns the watch face toward
// her eyes, the sleeve cuff slides back to uncover it, the head and eyes drop; the other arm keeps the run rhythm (damped)
export function poseAt(t) {
  const S = RUN.pose(t);
  const w = ss(seg(t, T.watchUp - .2, T.watchUp + .15)) * (1 - ss(seg(t, T.watchDown - .05, T.watchDown + .3)));
  S.watch = w;
  if (w > 0) {
    const J0 = solveProfile(S), sh = J0.sh.n;
    const tgt = [sh[0] + lerp(70, 92, w), sh[1] + lerp(150, 52, w)];          // wrist target in front of the chest, below the eyes
    const runArm = J0.arm.n;
    S.arms.n = { tgt: [lerp(runArm.wr[0], tgt[0], w), lerp(runArm.wr[1], tgt[1], w)], bend: -1, hand: 'grip', wr: -.25 * w };
    S.arms.f.sh *= 1 - .45 * w; S.arms.f.el = lerp(S.arms.f.el, 1.4, w * .5);
    S.head += .26 * w; S.neck += .08 * w;
  }
  return S;
}
function figure(g, S, o, ox, oy, s) { g.save(); g.translate(ox, oy); g.scale(s, s); const J = solveProfile(S); drawProfile(g, J, o); g.restore(); return J; }
function reflect(g, draw, gy, a, clip) {
  rg.setTransform(1, 0, 0, 1, 0, 0); rg.clearRect(0, 0, W, H); draw(rg);
  g.save(); if (clip) clip(g); g.globalAlpha = a; g.translate(0, gy * 2); g.scale(1, -1); g.filter = 'blur(1.5px)'; g.drawImage(rc, 0, 0); g.restore(); g.filter = 'none';
}
export function splash(g, u, x, y, s = 1, seed = 1) {
  g.save(); const r = mulberry(seed * 977 + 3);
  for (let i = 0; i < 26; i++) {
    const a = -Math.PI / 2 + (r() - .5) * 2.4, sp = (380 + r() * 520) * s, px = x + Math.cos(a) * sp * u, py = y + Math.sin(a) * sp * u + 1400 * u * u;
    if (py > y + 6) continue; const rad = (2 + r() * 3.5) * s;
    g.fillStyle = rgba('#e6f0ff', .85); g.beginPath(); g.ellipse(px, py, rad, rad * 1.3, a, 0, TAU); g.fill();
  }
  if (u < .25) { const v = u / .25; g.strokeStyle = rgba('#dfeaff', .7 * (1 - v)); g.lineWidth = 3 * s; g.beginPath(); g.ellipse(x, y, (20 + 120 * v) * s, (6 + 22 * v) * s, 0, Math.PI, TAU); g.stroke(); }
  g.strokeStyle = rgba('#cfe0ff', .45 * (1 - clamp(u / 1.2))); g.lineWidth = 2 * s; g.beginPath(); g.ellipse(x, y + 4, (30 + 260 * u) * s, (8 + 50 * u) * s, 0, 0, TAU); g.stroke();
  g.restore();
}
const drawO = (t, extra = {}) => ({ P: PAL.street, L: LST, jacket: 1, ...sec(t, 0), face: faceRun, watch: 1, ...extra });

// ——— S1 · 0–2.5 · puddle insert: the boot lands IN the puddle on the shared footfall 0.9375 s ———
export function S1({ t, lt, g, e, A }) {
  const cam = 340 + lt * 22;
  g.drawImage(A.puddle.c, -cam, 0); e.drawImage(A.puddle.ec, -cam, 0);
  const px = 1040 - cam * .2, py = 880, prx = 520, pry = 120;
  const clipP = c => { c.beginPath(); c.ellipse(px, py, prx, pry, 0, 0, TAU); c.clip(); };
  g.save(); clipP(g); g.fillStyle = '#0a0816'; g.fillRect(0, 0, W, H);
  const wob = y => Math.sin(y * .09 + t * 9) * (3 + (t > T.splash ? 12 * Math.exp(-(t - T.splash) * 2) : 0));
  g.save(); g.translate(px, py - 20); g.scale(1, -1);
  for (let yy = -90; yy < 140; yy += 4) { g.save(); g.beginPath(); g.rect(-prx, yy, prx * 2, 4); g.clip(); g.translate(wob(yy), 0); reflSign(g, false); g.restore(); }
  g.restore(); g.restore();
  e.save(); clipP(e); e.translate(px, py - 20); e.scale(1, -1); reflSign(e, true); e.restore();
  g.save(); g.filter = 'blur(6px)'; g.strokeStyle = rgba('#05040a', .55); g.lineWidth = 14; g.beginPath(); g.ellipse(px, py, prx + 4, pry + 2, 0, 0, TAU); g.stroke(); g.restore(); g.filter = 'none';
  const s = 2.35, gy = 905, c = RUN.contacts.find(c => Math.abs(c.t0 - T.splash) < .02);
  const camX = c.x - (px - 40) / s;
  const S = poseAt(t), o = drawO(t);
  reflect(g, cc => figure(cc, S, o, -camX * s, gy, s), gy, .45, clipP);
  figure(g, S, o, -camX * s, gy, s);
  for (const k of RUN.contacts) if (t >= k.t0 && t < k.t0 + 1.2) { const x = -camX * s + k.x * s + 40; if (x > -200 && x < W + 200) splash(g, t - k.t0, x, gy - 4, Math.abs(k.t0 - T.splash) < .02 ? 1.3 : .8, Math.round(k.t0 * 100)); }
  rain(g, e, t, { camX: cam, density: 1.1, alpha: .9 }); groundRain(g, t, { band: [760, 1080], n: 60, camX: cam });
  return { bloom: .9 };
}
function reflSign(c, isE) {
  c.save(); c.font = '700 120px "Barlow SC"'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.strokeStyle = isE ? rgba('#59e6ff', .8) : mix('#59e6ff', '#000000', .3); c.lineWidth = 14; c.strokeText('24H', -120, 40); c.fillStyle = isE ? rgba('#cffaff', .9) : '#bdf6ff'; c.fillText('24H', -120, 40);
  c.strokeStyle = isE ? rgba('#ff5fb3', .8) : mix('#ff5fb3', '#000000', .3); c.font = '700 90px "Barlow SC"'; c.strokeText('CAFE', 230, -10); c.fillStyle = isE ? rgba('#ffd0ec', .9) : '#ffc4e6'; c.fillText('CAFE', 230, -10);
  c.restore();
}

// ——— S2 · 2.5–7.5 · side tracking run on ones (4 parallax layers); the watch check 6.05–7.15 ———
const S2S = .9, S2G = 1004;
export function S2({ t, lt, g, e, A }) {
  const camX = RUN.pelvisAt(t)[0] - 40 / S2S, sx = -camX * S2S + 900;
  const fx = camX * S2S * .32 - 300, mx = camX * S2S * .82 - 500;   // plates cover the frame for the whole run (checked at 2.5 s and 7.5 s)
  g.drawImage(A.far.c, -fx, -120); e.drawImage(A.far.ec, -fx, -120);
  g.drawImage(A.midS, -mx, 0, A.mid.w, 1080); e.drawImage(A.midSE, -mx, 0, A.mid.w, 1080);
  g.drawImage(A.ground.c, -mx, 864); e.globalAlpha = .55; e.drawImage(A.ground.reflE, -mx, 864); e.globalAlpha = 1;
  groundRain(g, t, { band: [880, 1080], n: 90, camX: camX * S2S });
  const S = poseAt(t), w = S.watch;
  const o = drawO(t, { face: { ...faceRun, look: [.25, .9 * w], brow: [-3 - 2 * w, 3, 1.2], mouth: w > .5 ? 'X' : 'pant' }, cuffBack: w });
  reflect(g, c => figure(c, S, o, sx, S2G, S2S), S2G, .32);
  figure(g, S, o, sx, S2G, S2S);
  for (const k of RUN.contacts) if (t >= k.t0 && t < k.t0 + .9) splash(g, t - k.t0, sx + k.x * S2S + 30, S2G - 2, .55, Math.round(k.t0 * 100));
  for (let k = 0; k < 6; k++) { const px = ((k * 1150 + 300 - camX * S2S * 1.6) % 6900 + 6900) % 6900 - 400;
    if (px > -200 && px < W + 200) { g.save(); g.filter = 'blur(6px)'; g.fillStyle = '#07060e'; g.fillRect(px, 0, 46, H); g.fillStyle = rgba('#ff5fb3', .5); g.fillRect(px + 40, 0, 6, H); g.restore(); } }
  rain(g, e, t, { camX: camX * S2S, density: 1, wind: .22 });
  return {};
}

// ——— S3 · 7.5–9.375 · the watch: forearm, cuff, five-fingered hand, gold case, 23:58 and ticking ———
export function S3({ t, lt, g, e, A }) {
  const ph = 2 * Math.PI * CADENCE / 2 * t, bob = Math.sin(ph * 2) * 9, roll = Math.sin(ph) * .025, drift = lt * 36;
  g.fillStyle = '#120d22'; g.fillRect(0, 0, W, H);
  const r = mulberry(5);
  for (let k = 0; k < 40; k++) { const col = ['#ff5fb3', '#59e6ff', '#ffd36a', '#ffb36a', '#9b7bff'][k % 5], y = r() * H, x = ((r() * 3000 - t * 1800 * (.6 + r())) % 3000 + 3000) % 3000 - 500, w = 260 + r() * 300, h = 18 + r() * 40;
    g.fillStyle = rgba(col, .35); g.fillRect(x, y, w, h); e.fillStyle = rgba(col, .4); e.fillRect(x, y, w, h); }
  g.save(); g.filter = 'blur(18px)'; g.drawImage(g.canvas, 0, 0); g.restore(); g.filter = 'none';
  const P = PAL.street, L = { sh: [0, 9], hi: [0, 3.5], rim: { c: '#ff5fb3', d: [0, -2.4] } };
  g.save(); g.translate(1000 + drift * .3, 560 + bob); g.rotate(-.1 + roll); g.scale(4.2, 4.2);
  // sleeve (with two folds) and its cuff, pushed back to show the watch
  celGroup(g, [path([[-260, -27], [-90, -25], [-58, -23], [-54, -10], [-55, 13], [-58, 26], [-90, 28], [-260, 31]])], P.jacket, L, { lw: .9 });
  iline(g, path([[-150, -24], [-128, -8], [-140, 10]], false), P.jacket.l, .7); iline(g, path([[-100, -24], [-86, -2], [-96, 22]], false), P.jacket.l, .7);
  celGroup(g, [path([[-64, -24], [-54, -23], [-50, 0], [-54, 25], [-64, 26]])], P.jacket, L, { lw: .9, xh: [path([[-64, -24], [-56, -23], [-56, 25], [-64, 26]])] });
  // wrist + forearm skin
  celGroup(g, [path([[-56, -16], [-10, -14], [4, -12.5], [4, 12.5], [-10, 14], [-56, 18]])], P.skin, L, { lw: .8 });
  hand2(g, P, { sh: [0, 3], hi: [0, 1] }, 2, 0, { ang: 0, side: 1, pose: 'relaxed', s: 1.05, lw: .7 });
  // strap + case + dial
  celGroup(g, [path([[-38, -17], [-24, -17], [-24, 17], [-38, 17]])], P.strap, L, { lw: .7 });
  const cx = -31, cy = 0, R = 12;
  celGroup(g, [(() => { const p = new Path2D(); p.arc(cx, cy, R + 2.2, 0, TAU); p.bb = [cx - R - 3, cy - R - 3, cx + R + 3, cy + R + 3]; return p; })()], P.gold, L, { lw: .7 });
  g.fillStyle = '#f2eee0'; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
  g.strokeStyle = '#2a2630';
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; g.lineWidth = k % 3 ? .4 : .8; g.beginPath(); g.moveTo(cx + Math.sin(a) * R * .78, cy - Math.cos(a) * R * .78); g.lineTo(cx + Math.sin(a) * R * .92, cy - Math.cos(a) * R * .92); g.stroke(); }
  const secs = 41 + Math.floor(t - T.watchHit);
  clockHands(g, cx, cy, R, 23, 58 + secs / 60, secs);
  g.fillStyle = rgba('#ffffff', .35); g.beginPath(); g.ellipse(cx - 4, cy - 5, 5, 2, -.6, 0, TAU); g.fill();
  const rr = mulberry(8); for (let k = 0; k < 6; k++) { const a = rr() * TAU, d = rr() * R * .8, sl = ((t * (.6 + rr())) % 2) * 2;
    g.fillStyle = rgba('#e8f2ff', .7); g.beginPath(); g.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d + sl, .9 + rr() * .7, 1 + rr() * .8, 0, 0, TAU); g.fill(); }
  g.restore();
  e.save(); e.translate(1000 + drift * .3, 560 + bob); e.rotate(-.1 + roll); e.scale(4.2, 4.2); e.fillStyle = rgba('#f2eee0', .22); e.beginPath(); e.arc(-31, 0, 12, 0, TAU); e.fill(); e.restore();
  rain(g, e, t, { density: .7, layers: [0, 1, 1] });
  return {};
}

// ——— S4 · 9.375–10 · the crane begins over the rainy sky toward the station ———
export function S4({ t, lt, g, e, A }) {
  const y = lt * 160 * (1 + lt);
  g.drawImage(A.station.c, 0, -y); e.drawImage(A.station.ec, 0, -y);
  rain(g, e, t, { camY: -y, density: 1.2 });
  return {};
}
