// S1–S5: puddle insert → side-tracking run → watch insert → station wide (crane down) → profile close-up with the first line.
import { W, H, canvas, rgba, mix, path } from './lib/cel.js';
import { clamp, lerp, seg, ss, eio, hash, mulberry, onN, TAU } from './lib/util.js';
import { solveProfile, drawProfile, scaleL } from './chars/aki.js';
import { PAL } from './chars/palette.js';
import { runner, secondary } from './chars/motion.js';
import { rain, groundRain, flare } from './fx.js';
import { hands as clockHands } from './bg/plates1.js';
import { T, b, SHOTS } from './timeline.js';
import { visemeAt } from './lipsync.js';
import { celGroup } from './lib/celgroup.js';

const [rc, rg] = canvas(W, H);                // scratch for the character's wet reflection
const shotT = id => SHOTS.find(s => s[2] === id);

// one continuous run used by S1, S2 (world: ground y = 0, facing +x)
export const RUN = runner({ t0: b(1.5) - 3 / 2.9, t1: 20, x0: -1400, v: 1450, cadence: 2.9, duty: .62, lean: .15 });
const secRun = (t, t0) => secondary(tq => { const p = RUN.pelvisAt(tq); return [p[0], p[1] - 250]; }, t0, t);

const LST = { sh: [9, 1], hi: [3, .5], rim: { c: '#ff5fb3', d: [-3.2, 0] } };       // street: key from the shop windows (front-right), magenta rim behind
const faceRun = (t) => ({ open: .82, lid: .22, mouth: 'pant', brow: [-3, 3, 1.4], sweat: .8, look: [.4, 0] });

// helper: draw the profile figure with world→screen transform
function figure(g, S, o, ox, oy, s, mirror = false) {
  g.save(); g.translate(ox, oy); g.scale(mirror ? -s : s, s);
  const J = solveProfile(S); drawProfile(g, J, o); g.restore(); return J;
}
// a wet-ground reflection of the figure: draw it to scratch, flip about the ground line, fade
function reflect(g, drawFn, groundY, alpha, clipFn) {
  rg.setTransform(1, 0, 0, 1, 0, 0); rg.clearRect(0, 0, W, H);
  drawFn(rg);
  g.save(); if (clipFn) clipFn(g);
  g.globalAlpha = alpha; g.translate(0, groundY * 2); g.scale(1, -1); g.filter = 'blur(1.5px)';
  g.drawImage(rc, 0, 0); g.restore(); g.filter = 'none';
}

// ——————————————————— S1 puddle insert ———————————————————
export function S1_puddle({ t, lt, g, e, A }) {
  const cam = 340 + lt * 22;                                  // slow handheld-like drift (on ones)
  g.drawImage(A.puddle.c, -cam, 0); e.drawImage(A.puddle.ec, -cam, 0);
  // puddle: reflective ellipse on the ground
  const px = 1040 - cam * .2, py = 880, prx = 520, pry = 120;
  const clipP = c => { c.beginPath(); c.ellipse(px, py, prx, pry, 0, 0, TAU); c.clip(); };
  g.save(); clipP(g);
  g.fillStyle = '#0a0816'; g.fillRect(0, 0, W, H);
  // reflected neon (upside down) with ripple wobble
  const wob = y => Math.sin(y * .09 + t * 9) * (3 + 10 * Math.exp(-Math.max(0, t - T.splash1) * 2) * (t > T.splash1 ? 1 : 0));
  g.save(); g.translate(px, py - 20); g.scale(1, -1);
  for (let yy = -90; yy < 140; yy += 4) { g.save(); g.beginPath(); g.rect(-prx, yy, prx * 2, 4); g.clip(); g.translate(wob(yy), 0); drawReflSign(g, e, false); g.restore(); }
  g.restore();
  g.restore();
  e.save(); clipP(e); e.translate(px, py - 20); e.scale(1, -1); drawReflSign(e, null, true); e.restore();
  g.save(); g.filter = 'blur(6px)'; g.strokeStyle = rgba('#05040a', .55); g.lineWidth = 14; g.beginPath(); g.ellipse(px, py, prx + 4, pry + 2, 0, 0, TAU); g.stroke(); g.restore(); g.filter = 'none';
  // runner: lower body enters from the left, a boot lands in the puddle at T.splash1
  const s = 2.35, groundY = 905;
  const xw = RUN.contacts.find(c => Math.abs(c.t0 - T.splash1) < .2) || RUN.contacts[0];
  const tt = t;   // on ones: camera locked, feet locked to the ground
  const camX = xw.x - (px - 40) / s;
  const S = RUN.pose(tt), sec = secRun(tt, 0);
  const o = { P: PAL.street, L: LST, jacket: 1, ...sec, face: faceRun(tt), lw: 2.2 };
  reflect(g, c => figure(c, S, o, -camX * s, groundY, s), groundY, .45, clipP);
  figure(g, S, o, -camX * s, groundY, s);
  // splash bursts at the real touch-downs (the first one lands in the puddle)
  for (const c of RUN.contacts) if (t >= c.t0 && t < c.t0 + 1.2) {
    const x = -camX * s + c.x * s + 40, inP = Math.abs(c.t0 - T.splash1) < .02;
    if (x > -200 && x < W + 200) splash(g, e, t - c.t0, x, groundY - 4, inP ? 1.3 : .8, Math.round(c.t0 * 100));
  }
  rain(g, e, t, { camX: cam, density: 1.1, alpha: .9 });
  groundRain(g, t, { band: [760, 1080], n: 60, camX: cam });
  return { bloom: .9 };
}
function drawReflSign(c, e, isE) {
  c.save(); c.font = '700 120px "Barlow SC"'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.strokeStyle = isE ? rgba('#59e6ff', .8) : mix('#59e6ff', '#000000', .3); c.lineWidth = 14; c.strokeText('24H', -120, 40);
  c.fillStyle = isE ? rgba('#cffaff', .9) : '#bdf6ff'; c.fillText('24H', -120, 40);
  c.strokeStyle = isE ? rgba('#ff5fb3', .8) : mix('#ff5fb3', '#000000', .3); c.font = '700 90px "Barlow SC"'; c.strokeText('CAFE', 230, -10);
  c.fillStyle = isE ? rgba('#ffd0ec', .9) : '#ffc4e6'; c.fillText('CAFE', 230, -10);
  c.restore();
}
// crown splash: droplets on ballistic arcs + a sheet ring; deterministic per (seed)
export function splash(g, e, u, x, y, s = 1, seed = 1) {
  g.save();
  const r = mulberry(seed * 977 + 3);
  for (let i = 0; i < 26; i++) {
    const a = -Math.PI / 2 + (r() - .5) * 2.4, sp = (380 + r() * 520) * s, vx = Math.cos(a) * sp, vy = Math.sin(a) * sp;
    const tt = u, px = x + vx * tt, py = y + vy * tt + 1400 * tt * tt;
    if (py > y + 6) continue;
    const rad = (2 + r() * 3.5) * s;
    g.fillStyle = rgba('#e6f0ff', .85); g.beginPath(); g.ellipse(px, py, rad, rad * 1.3, a, 0, TAU); g.fill();
  }
  if (u < .25) { const v = u / .25; g.strokeStyle = rgba('#dfeaff', .7 * (1 - v)); g.lineWidth = 3 * s; g.beginPath(); g.ellipse(x, y, (20 + 120 * v) * s, (6 + 22 * v) * s, 0, Math.PI, TAU); g.stroke(); }
  g.strokeStyle = rgba('#cfe0ff', .45 * (1 - clamp(u / 1.2))); g.lineWidth = 2 * s; g.beginPath(); g.ellipse(x, y + 4, (30 + 260 * u) * s, (8 + 50 * u) * s, 0, 0, TAU); g.stroke();
  g.restore();
}

// ——————————————————— S2 side tracking run ———————————————————
const S2_SCALE = .9, S2_GROUND = 1004;
export function S2_run({ t, lt, g, e, A }) {
  const tt = t;   // camera tracks on ones; drawings on ones while the camera moves (no foot slip, see research notes)
  const pel = RUN.pelvisAt(tt);
  const camX = pel[0] - 40 / S2_SCALE;                           // keep her a little left of centre, lead room ahead
  const sx = -camX * S2_SCALE + 900;
  // far skyline (parallax .32), mid shopfronts (.82), ground reflections (.82), figure (1), foreground posts (1.6)
  const far = A.far, mid = A.midS, gr = A.ground;
  const fx = camX * S2_SCALE * .32 - 600, mx = camX * S2_SCALE * .82 - 1500;
  g.drawImage(far.c, -fx, -120); e.drawImage(far.ec, -fx, -120);
  g.drawImage(mid, -mx, 0, A.mid.w, 1080); e.drawImage(A.midSE, -mx, 0, A.mid.w, 1080);
  g.drawImage(gr.c, -mx, 864); e.globalAlpha = .55; e.drawImage(gr.reflE, -mx, 864); e.globalAlpha = 1;
  groundRain(g, t, { band: [880, 1080], n: 90, camX: camX * S2_SCALE, par: 1 });
  // the figure: + watch glance (near arm comes up, head dips) around T.watchLook
  const S = RUN.pose(tt);
  const w = ss(seg(tt, T.watchLook - .25, T.watchLook + .1)) * (1 - ss(seg(tt, T.watchLook + .95, T.watchLook + 1.3)));
  if (w > 0) {
    S.arms.n = { sh: lerp(S.arms.n.sh, .55, w), el: lerp(S.arms.n.el, 1.95, w), wr: lerp(S.arms.n.wr, -.5, w), hand: w > .5 ? 'relax' : 'fist' };
    S.head += .22 * w; S.neck += .08 * w;
  }
  const sec = secRun(tt, 0);
  const face = { ...faceRun(tt), look: [.2, w * .9], brow: [-3 - 2 * w, 3, 1.4] };
  const o = { P: PAL.street, L: LST, jacket: 1, ...sec, face, watch: 1 };
  reflect(g, c => figure(c, S, o, sx, S2_GROUND, S2_SCALE), S2_GROUND, .32);
  figure(g, S, o, sx, S2_GROUND, S2_SCALE);
  // her own splashes at every touch-down
  for (const c of RUN.contacts) if (tt >= c.t0 && tt < c.t0 + .9) splash(g, e, tt - c.t0, sx + c.x * S2_SCALE + 30, S2_GROUND - 2, .55, Math.round(c.t0 * 100));
  // foreground posts (very fast, dark, blurred) — street lamps / sign poles
  for (let k = 0; k < 6; k++) {
    const px = ((k * 1150 + 300 - camX * S2_SCALE * 1.6) % 6900 + 6900) % 6900 - 400;
    if (px > -200 && px < W + 200) { g.save(); g.filter = 'blur(6px)'; g.fillStyle = '#07060e'; g.fillRect(px, 0, 46, H); g.fillStyle = rgba('#ff5fb3', .5); g.fillRect(px + 40, 0, 6, H); g.restore(); }
  }
  rain(g, e, t, { camX: camX * S2_SCALE, density: 1, wind: .22 });
  return {};
}

// ——————————————————— S3 watch insert ———————————————————
export function S3_watch({ t, lt, g, e, A }) {
  const bob = Math.sin(t * 2 * Math.PI * 2.9) * 10, drift = lt * 40;
  // background: smeared street lights streaming past (out of focus)
  g.fillStyle = '#120d22'; g.fillRect(0, 0, W, H);
  const r = mulberry(5);
  for (let k = 0; k < 40; k++) {
    const col = ['#ff5fb3', '#59e6ff', '#ffd36a', '#ffb36a', '#9b7bff'][k % 5], y = r() * H, x = ((r() * 3000 - t * 1800 * (.6 + r())) % 3000 + 3000) % 3000 - 500;
    g.fillStyle = rgba(col, .35); g.fillRect(x, y, 260 + r() * 300, 18 + r() * 40); e.fillStyle = rgba(col, .4); e.fillRect(x, y, 260 + r() * 300, 18 + r() * 40);
  }
  g.save(); g.filter = 'blur(18px)'; g.drawImage(g.canvas, 0, 0); g.restore();
  // forearm (sleeve + cuff) across the frame, wrist with the watch, hand at the right
  g.save(); g.translate(960 + drift * .3, 560 + bob); g.rotate(-.12);
  const P = PAL.street, L = { sh: [0, 14], hi: [0, 5], rim: { c: '#ff5fb3', d: [0, -4] } };
  celGroup(g, [path([[-1100, -95], [-300, -88], [-190, -82], [-190, 92], [-300, 96], [-1100, 110]])], P.jacket, L, { lw: 3 });
  celGroup(g, [path([[-205, -70], [60, -58], [170, -66], [300, -40], [340, 10], [300, 52], [170, 64], [60, 60], [-205, 74]])], P.skin, L, { lw: 3 });
  celGroup(g, [path([[-30, -78], [70, -78], [70, 80], [-30, 80]])], P.strap, L, { lw: 3 });
  // watch head
  const cx = 20, cy = 0, R = 92;
  celGroup(g, [(() => { const p = new Path2D(); p.arc(cx, cy, R + 14, 0, TAU); p.bb = [cx - R - 14, cy - R - 14, cx + R + 14, cy + R + 14]; return p; })()], P.gold, L, { lw: 3 });
  g.fillStyle = '#f2eee0'; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
  e.save(); e.translate(960 + drift * .3, 560 + bob); e.rotate(-.12); e.fillStyle = rgba('#f2eee0', .25); e.beginPath(); e.arc(cx, cy, R, 0, TAU); e.fill(); e.restore();
  g.strokeStyle = '#2a2630';
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; g.lineWidth = k % 3 ? 3 : 6; g.beginPath(); g.moveTo(cx + Math.sin(a) * R * .78, cy - Math.cos(a) * R * .78); g.lineTo(cx + Math.sin(a) * R * .92, cy - Math.cos(a) * R * .92); g.stroke(); }
  const sec = 41 + Math.floor((t - b(12)) * 1) + 0;                  // the second hand ticks once a second
  clockHands(g, cx, cy, R, 23, 58 + sec / 60, sec);
  // crystal highlight + raindrops on the glass
  g.fillStyle = rgba('#ffffff', .35); g.beginPath(); g.ellipse(cx - 30, cy - 40, 40, 16, -.6, 0, TAU); g.fill();
  const rr = mulberry(8); for (let k = 0; k < 7; k++) { const a = rr() * TAU, d = rr() * R * .8; g.fillStyle = rgba('#e8f2ff', .7); g.beginPath(); g.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 5 + rr() * 6, 6 + rr() * 7, 0, 0, TAU); g.fill(); g.fillStyle = rgba('#ffffff', .9); g.beginPath(); g.arc(cx + Math.cos(a) * d - 2, cy + Math.sin(a) * d - 3, 2, 0, TAU); g.fill(); }
  g.restore();
  rain(g, e, t, { density: .7, layers: [0, 1, 1] });
  return {};
}

// ——————————————————— S4 station wide (crane down) ———————————————————
export function S4_wide({ t, lt, u, g, e, A }) {
  const P0 = A.station, k = eio(seg(lt, 0, 3.3));
  const y = lerp(0, 1240, k);
  g.drawImage(P0.c, 0, -y); e.drawImage(P0.ec, 0, -y);
  // tiny Aki crossing the plaza toward the entrance (same run, small scale) — enters once the crane settles
  const s = .19, gy = 2210 - y;
  const tRef = b(15) + 1.2, S = RUN.pose(t), x0 = RUN.pelvisAt(tRef)[0];
  if (lt > 1.2) figure(g, S, { P: PAL.street, L: { sh: [10, 2] }, jacket: 1, ...secRun(t, t - 2), face: faceRun(t), lw: 7 }, 300 - x0 * s, gy, s);
  groundRain(g, t, { band: [Math.max(0, 2050 - y), 1080], n: 80 });
  rain(g, e, t, { camY: -y, density: 1.2 });
  return {};
}

// ——————————————————— S5 profile close-up, running, first line ———————————————————
export function S5_face({ t, lt, g, e, A }) {
  const tt = t;
  const s = 2.9;
  const pel = RUN.pelvisAt(tt);
  const bobFollow = Math.sin(2 * Math.PI * 2.9 * tt) * 6;          // camera dampens the bob
  // out-of-focus background: the station entrance lights sliding past
  const bx = (tt * 700) % (A.blurMid.width - W);
  g.drawImage(A.blurMid, -bx, -260, A.blurMid.width, 1080 * 1.35); e.globalAlpha = .7; e.drawImage(A.blurMidE, -bx, -260, A.blurMid.width, 1080 * 1.35); e.globalAlpha = 1;
  const S = RUN.pose(tt);
  // performance: she looks up toward the platform (off right), worry → dismay on the line
  const lookUp = ss(seg(lt, .1, .5));
  S.head -= .16 * lookUp; S.neck -= .04 * lookUp;
  const vis = visemeAt('A1', t);
  const face = { open: .9, lid: .12, brow: [-6 * lookUp, 4 * lookUp, 2.2], look: [.6, -.7 * lookUp], mouth: vis || 'pant', sweat: .8, blush: .5 };
  if (t > T.mew1) { face.look = [-.4, .3]; face.open = 1.05; face.brow = [-7, -3, 3]; }   // the mew: eyes flick back
  const o = { P: PAL.canopy, L: { sh: [8, 2], hi: [3, 1], rim: { c: '#59e6ff', d: [-3, 0] } }, jacket: 1, ...secRun(tt, 0), face, lw: 1.6 };
  const J = solveProfile(S);
  const hx = J.headC[0], hy = J.headC[1];
  g.save(); g.translate(760 - (hx - pel[0]) * s - pel[0] * s, 470 - hy * s + bobFollow); g.scale(s, s); drawProfile(g, J, o); g.restore();
  rain(g, e, t, { density: .8, camX: tt * 900 });
  return {};
}
