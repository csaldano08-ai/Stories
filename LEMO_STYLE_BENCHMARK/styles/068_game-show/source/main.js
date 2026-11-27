// 068 · Rhythm Game Show — the first 10 s of "Last Train Home" as a rhythm variety show on a candy-stripe stage
// (lemo-opuscar styles/game-show). A narrative adaptation: the run is played as rounds on a fixed tempo grid (96 bpm: a bar is
// exactly 2.5 s, so the film's cuts at 2.5, 7.5 and 9.375 s fall on bar lines and a beat). Original cast: AKI as a toy contestant
// (bean coat in her red, a dark ponytail as her head accessory, a name tag; her legs and arms driven by the shared rig, feet planted),
// an original host mascot with a station-clock belly and a cap, and a crowd of small beans that hop on the beat.
//   ROUND 1 · PUDDLE  (sky stripes) the host calls JUMP! on beat 1; she lands in the puddle on the half-beat after (0.94 s): SPLASH!
//   ROUND 2 · RUN!    (tangerine stripes) a treadmill, cardboard shops slide past, a step counter counts her own footfalls (her
//                     2.9 steps a second run against the show's 96 bpm); she raises her watch at 6.05 s: a snap zoom onto it
//   ROUND 3 · TIME?   (navy sunburst) the host asks, the scoreboard answers 11:58:47, the seconds flip to 48 at 8.4 s: HURRY!
//   FINAL             (pink dots) the host strikes the station bell on the chime (9.58 s)
// Page contract: window.render(t), DUR, READY, RIGQA.
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, mulberry, hash } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080, TAU = Math.PI * 2, INK = '#1d1a24', CREAM = '#fff4dc';
const g = document.getElementById('c').getContext('2d');
await document.fonts.load('700 80px Fredoka', 'AB09');
const BEAT = .625, at = (bar, beat = 0) => (bar * 4 + beat) * BEAT;

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
const SIM = (() => {
  const dt = 1 / 240, n = Math.ceil(11 / dt), tail = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  const th = [-.2, -.1, 0], vt = [0, 0, 0], py = t => RUN.pelvisAt(t)[1], ay = t => (py(t + dt) - 2 * py(t) + py(t - dt)) / (dt * dt);
  for (let i = 0; i < n; i++) { const t = -.5 + i * dt, A = ay(t);
    for (let k = 0; k < 3; k++) { const par = k ? th[k - 1] : -.1, rest = .16 + .05 * k; vt[k] += (-60 * (th[k] - (par + rest)) - 6 * vt[k] + .014 * A * (k + 1) * .6) * dt; th[k] += vt[k] * dt; tail[k][i] = th[k]; } }
  return { tail: t => tail.map(a => a[clamp(Math.round((t + .5) / dt), 0, n - 1)]) };
})();

// ═════════ the drawing kit: flat fill, one heavy ink outline, a hard offset shadow; telops stroked under their fill
function ink(path, fill, o = {}) { const sh = o.sh ?? 10, lw = o.lw ?? 8;
  if (sh) { g.save(); g.translate(sh, sh); path(); g.fillStyle = INK; g.fill(); g.restore(); }
  path(); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } }
const rr = (x, y, w, h, r) => () => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const circ = (x, y, r) => () => { g.beginPath(); g.arc(x, y, r, 0, TAU); };
function telop(s, x, y, size, fill = '#fff', o = {}) { g.save(); g.translate(x, y); g.rotate(o.rot || 0); g.scale(o.k ?? 1, o.k ?? 1); g.font = `700 ${size}px Fredoka`; g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  if (o.sh !== 0) { g.fillStyle = INK; g.fillText(s, size * .07, size * .08); }
  g.lineWidth = size * .28; g.strokeStyle = INK; g.strokeText(s, 0, 0); g.fillStyle = fill; g.fillText(s, 0, 0); g.restore(); }
const pop = (t, t0, d = .18) => t < t0 ? 0 : back(seg(t, t0, t0 + d), 2.4);
function burst(x, y, r, t, t0, col = '#FFE14A') { const u = seg(t, t0, t0 + .35); if (u <= 0 || u >= 1) return; const k = back(seg(t, t0, t0 + .12), 2);
  g.save(); g.translate(x, y); g.scale(k, k); g.globalAlpha = 1 - ss(seg(u, .6, 1));
  ink(() => { g.beginPath(); for (let i = 0; i < 20; i++) { const a = i / 20 * TAU, R = i % 2 ? r * .55 : r; g.lineTo(Math.cos(a) * R, Math.sin(a) * R); } g.closePath(); }, col, { sh: 0, lw: 7 });
  g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.arc(0, 0, r * (1.1 + u * .6), 0, TAU); g.stroke();
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + .3, R0 = r * (1.3 + u * .7); g.beginPath(); g.moveTo(Math.cos(a) * R0, Math.sin(a) * R0); g.lineTo(Math.cos(a) * (R0 + 40), Math.sin(a) * (R0 + 40)); g.stroke(); }
  g.restore(); }
// sets: one saturated ground + its pattern one step lighter; a darker floor band with an ink line on top
const FLOOR = 870;
function set(kind, t) {
  const S = { sky: ['#5DB8F5', '#79C7FA', '#2E7FC0'], tang: ['#FFB870', '#FFA85A', '#D9783A'], navy: ['#22306B', '#F4C542', '#141C45'], pink: ['#FF7FB0', '#FFFFFF', '#D94F86'] }[kind];
  g.fillStyle = S[0]; g.fillRect(0, 0, W, H);
  if (kind === 'navy') { g.save(); g.translate(W / 2, 520); g.rotate(t * .3); g.fillStyle = 'rgba(244,197,66,.35)'; for (let i = 0; i < 18; i++) { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 1800, i / 18 * TAU, (i + .5) / 18 * TAU); g.fill(); } g.restore(); }
  else if (kind === 'pink') { g.fillStyle = 'rgba(255,255,255,.22)'; for (let y = 0; y < FLOOR; y += 90) for (let x = (y / 90) % 2 ? 45 : 0; x < W; x += 90) { g.beginPath(); g.arc(x, y, 18, 0, TAU); g.fill(); } }
  else { const off = kind === 'tang' ? (t * 300) % 160 : (t * 40) % 160; g.fillStyle = S[1]; for (let x = -H - 160; x < W + 160; x += 160) { g.beginPath(); g.moveTo(x - off, 0); g.lineTo(x - off + 80, 0); g.lineTo(x - off + 80 + FLOOR, FLOOR); g.lineTo(x - off + FLOOR, FLOOR); g.fill(); } }
  g.fillStyle = S[2]; g.fillRect(0, FLOOR, W, H - FLOOR); g.fillStyle = INK; g.fillRect(0, FLOOR - 5, W, 10);
}
// ═════════ the cast
// AKI the contestant: a bean coat, a round head with her dark ponytail, stubby mitten arms; limbs posed by the shared rig
function aki(t, cx, groundY, k = .95, o = {}) {
  const J = solveProfile(poseAt(t)), x0 = X(t), M = p => [cx + (p[0] - x0) * k, groundY + p[1] * k];
  const limb = (pts, w, col) => { for (const [ww, cc] of [[w + 16, INK], [w, col]]) { g.lineWidth = ww; g.strokeStyle = cc; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke(); } };
  const leg = kk => { const l = J.leg[kk], c = Math.cos(l.pitch), s = Math.sin(l.pitch); limb([M(l.hip), M(l.knee), M(l.ankle)], 30, kk === 'n' ? '#3B4FA0' : '#2C3B7C');
    const toe = M([l.ankle[0] + 40 * c, l.ankle[1] + 40 * s]), a = M(l.ankle); ink(() => { g.beginPath(); g.ellipse((a[0] + toe[0]) / 2, (a[1] + toe[1]) / 2 + 4, 40 * k, 22 * k, Math.atan2(toe[1] - a[1], toe[0] - a[0]), 0, TAU); }, '#E8E2D6', { sh: 0, lw: 7 }); };
  const arm = kk => { const a = J.arm[kk]; limb([M(a.sh), M(a.el), M(a.wr)], 22, kk === 'n' ? '#F0513D' : '#C93A2B'); ink(circ(...M(a.wr), 17 * k + 4), '#FFD9B8', { sh: 0, lw: 7 });
    if (kk === 'n' && o.watch) { const w = M([a.el[0] + (a.wr[0] - a.el[0]) * .8, a.el[1] + (a.wr[1] - a.el[1]) * .8]); ink(circ(...w, 15 * k + 6), '#FFE14A', { sh: 0, lw: 6 }); } };
  arm('f'); leg('f');
  // the bean coat between the neck and below the hips, leaning with the spine
  const nb = M(J.neckBase), pv = M([J.pelvis[0] - J.uL[0] * 60, J.pelvis[1] - J.uL[1] * 60]), ang = Math.atan2(nb[1] - pv[1], nb[0] - pv[0]), L = Math.hypot(nb[0] - pv[0], nb[1] - pv[1]);
  ink(() => { g.save(); g.translate((nb[0] + pv[0]) / 2, (nb[1] + pv[1]) / 2); g.rotate(ang + Math.PI / 2); g.beginPath(); g.ellipse(0, 0, 66 * k, L / 2 + 34 * k, 0, 0, TAU); g.restore(); }, '#E23E2E', { sh: 0 });
  // name tag (belly patch)
  { const c = [(nb[0] + pv[0]) / 2, (nb[1] + pv[1]) / 2]; ink(rr(c[0] - 40 * k, c[1] - 14 * k, 80 * k, 30 * k, 8), CREAM, { sh: 0, lw: 5 }); g.save(); g.font = `700 ${22 * k}px Fredoka`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK; g.fillText('AKI', c[0], c[1] + 2); g.restore(); }
  leg('n');
  // head: ponytail (secondary motion), skin, the hair cap, oval eyes with a catch-light, a mouth that opens on a shout
  const hc = M(J.headC), hr = 58 * k, ta = SIM.tail(t); let an = Math.PI - .25 + ta[0] + J.headA, p = [J.headC[0] - Math.cos(J.headA) * 50, J.headC[1] - Math.sin(J.headA) * 50 - 10]; const tail = [M(p)];
  for (let i = 0; i < 3; i++) { const Lk = [46, 42, 36][i]; p = [p[0] + Math.cos(an) * Lk, p[1] + Math.sin(an) * Lk]; tail.push(M(p)); an += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
  limb(tail, 26 * k, '#2A2230');
  ink(circ(hc[0], hc[1], hr), '#FFD9B8', { sh: 0 });
  ink(() => { g.beginPath(); g.arc(hc[0], hc[1], hr, Math.PI * .62 + J.headA, Math.PI * 1.9 + J.headA); g.closePath(); }, '#2A2230', { sh: 0, lw: 7 });
  const ex = hc[0] + hr * .38, ey = hc[1] - hr * .05; g.fillStyle = INK; g.beginPath(); g.ellipse(ex, ey, 7 * k + 2, 12 * k + 2, 0, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + 2, ey - 4, 3, 0, TAU); g.fill();
  g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); if (o.shout) { g.fillStyle = '#7A1E2A'; g.ellipse(hc[0] + hr * .45, hc[1] + hr * .45, 10, 14, 0, 0, TAU); g.fill(); g.stroke(); } else { g.arc(hc[0] + hr * .42, hc[1] + hr * .32, 12, .2, 1.6); g.stroke(); }
  arm('n');
  return { J, M };
}
// the host: an original mascot — a cream bean with a station-clock belly, a navy cap, stubby arms; hops on every beat
function hostBean(t, x, y, o = {}) {
  const hop = o.still ? 0 : Math.abs(Math.sin(t / BEAT * Math.PI)) * 22, sq = o.sq ? 1 - .08 * Math.sin(o.sq * 30) * Math.exp(-o.sq * 8) : 1, yy = y - hop;
  const armsUp = o.shout ? 1 : 0;
  for (const s of [-1, 1]) { const a = armsUp ? -2.3 * s : .5 * s; g.save(); g.translate(x + s * 100, yy - 200); g.rotate(armsUp ? s * -.9 : s * .4); ink(rr(-16, 0, 32, 110, 16), '#F4E9D2', { sh: 0 }); ink(circ(0, 110, 24), '#F4E9D2', { sh: 0, lw: 7 }); g.restore(); void a; }
  ink(() => { g.beginPath(); g.ellipse(x, yy - 170 * sq, 120, 170 * sq, 0, 0, TAU); }, '#F4E9D2');
  ink(circ(x, yy - 130, 66), '#fff', { sh: 0, lw: 7 });
  g.strokeStyle = INK; g.lineCap = 'round'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.lineWidth = i % 3 ? 4 : 7; g.beginPath(); g.moveTo(x + Math.sin(a) * 52, yy - 130 - Math.cos(a) * 52); g.lineTo(x + Math.sin(a) * 60, yy - 130 - Math.cos(a) * 60); g.stroke(); }
  const w = o.time ?? (11 * 3600 + 58 * 60 + 47); for (const [fr, L, lw] of [[(w / 3600 % 12) / 12, 30, 9], [(w / 60 % 60) / 60, 46, 6]]) { g.lineWidth = lw; g.beginPath(); g.moveTo(x, yy - 130); g.lineTo(x + Math.sin(fr * TAU) * L, yy - 130 - Math.cos(fr * TAU) * L); g.stroke(); }
  ink(rr(x - 95, yy - 372 * sq, 190, 50, 18), '#24306B', { sh: 0 }); ink(rr(x - 120, yy - 330 * sq, 210, 18, 9), '#1A2350', { sh: 0, lw: 6 });
  for (const s of [-1, 1]) { g.fillStyle = INK; g.beginPath(); g.ellipse(x + s * 34, yy - 262 * sq, 11, 17, 0, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + s * 34 + 3, yy - 268 * sq, 4, 0, TAU); g.fill(); }
  g.lineWidth = 7; g.strokeStyle = INK; g.beginPath(); if (o.shout) { g.fillStyle = '#7A1E2A'; g.ellipse(x, yy - 222 * sq, 22, 18, 0, 0, TAU); g.fill(); g.stroke(); } else { g.arc(x, yy - 236 * sq, 20, .3, Math.PI - .3); g.stroke(); }
  ink(rr(x - 46, yy - 70, 92, 34, 10), CREAM, { sh: 0, lw: 5 }); g.save(); g.font = '700 24px Fredoka'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK; g.fillText('HOST', x, yy - 52); g.restore();
}
// the crowd: small beans at the edges, neighbours hopping on the off-beat so the crowd ripples
const CROWD = ['#7BD389', '#FFD23F', '#6EC6FF', '#C38DF0', '#FF8A5B', '#B8E15B'];
function crowd(t, side, o = {}) {
  CROWD.forEach((c, i) => { const x = side < 0 ? 60 + i * 70 : W - 60 - i * 70, off = i % 2 ? .5 : 0, hop = Math.abs(Math.sin((t / BEAT + off) * Math.PI)) * (o.cheer ? 34 : 14), y = H - 40 - hop;
    ink(() => { g.beginPath(); g.ellipse(x, y - 60, 34, 60, 0, 0, TAU); }, c, { sh: 6, lw: 6 });
    g.fillStyle = INK; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * 11, y - 80, 5, 8, 0, 0, TAU); g.fill(); }
    if (o.cheer) { g.lineWidth = 9; g.strokeStyle = INK; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x + s * 28, y - 80); g.lineTo(x + s * 46, y - 136); g.stroke(); } } });
}
// corner sticker banner (round card) and the judgement word
function banner(t, t0, s1, s2, col) { const k = pop(t, t0, .2); if (k <= 0) return; g.save(); g.translate(60, 60); g.scale(k, k); g.rotate(-.04);
  g.font = '700 54px Fredoka'; const w = g.measureText(s1).width + 70; ink(rr(0, 0, w, 84, 30), col); telop(s1, w / 2, 44, 54, '#fff', { sh: 0 });
  if (s2) { g.font = '700 34px Fredoka'; const w2 = g.measureText(s2).width + 44; ink(rr(w - 20, 56, w2, 58, 22), CREAM, { sh: 7, lw: 6 }); g.fillStyle = INK; g.font = '700 34px Fredoka'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s2, w - 20 + w2 / 2, 87); }
  g.restore(); }
function judge(t, t0, s, col, dur = 9) { const k = pop(t, t0, .2) * (1 - ei(seg(t, t0 + dur, t0 + dur + .15))); if (k <= 0) return; telop(s, W / 2, 210, 150, col, { rot: -.1, k }); }
// beat punches: a small zoom around the centre on chosen hits, decaying in ~0.16 s
const PUNCH = [[0, .03], [at(0, 1), .02], [EV.splash, .05], [at(1), .04], [at(1, 2), .02], [at(2), .04], [at(2, 2), .02], [at(3), .05], [at(3, 1), .02], [8.4, .03], [at(3, 2), .03], [EV.chime, .06]];
const punchAt = t => Math.min(.06, PUNCH.reduce((s, [t0, a]) => s + (t >= t0 ? a * Math.exp(-(t - t0) / .055) : 0), 0));

// ═════════ the rounds
function round1(t) {
  set('sky', t); crowd(t, -1, { cheer: t > EV.splash && t < 2 }); crowd(t, 1, { cheer: t > EV.splash && t < 2 });
  // the puddle prop, a splash on the half-beat
  const PX = 900;
  ink(() => { g.beginPath(); g.ellipse(PX, FLOOR + 30, 210, 34, 0, 0, TAU); }, '#3FA7F0', { sh: 0, lw: 8 });
  const a = t - EV.splash;
  if (a > 0 && a < 1) { const r = mulberry(68); for (let i = 0; i < 12; i++) { const an = (200 + r() * 140) * Math.PI / 180, v = 700 + r() * 800, x = PX + Math.cos(an) * v * a, y = FLOOR + 20 + Math.sin(an) * v * a + 1800 * a * a; if (y > FLOOR + 30) continue; ink(circ(x, y, 14 + r() * 10), '#7CC8FF', { sh: 0, lw: 6 }); } }
  burst(PX, FLOOR - 80, 120, t, EV.splash, '#7CC8FF');
  hostBean(t, 1560, FLOOR + 10, { shout: t > at(0, 1) - .03 && t < at(0, 1) + .3 });
  if (t > at(0, 1) - .03 && t < 1.6) { const k = pop(t, at(0, 1) - .03); ink(rr(1300, 380, 300, 120, 50), '#fff', { sh: 8 }); g.save(); g.translate(1450, 440); g.scale(k, k); telop('JUMP!', 0, 0, 80, '#FFE14A', { sh: 0 }); g.restore(); }
  // AKI runs through the stage; her far foot lands in the puddle on the splash
  const cx = PX + (X(t) - SPL.x) * .95 - 40;
  if (cx > -300 && cx < W + 300) aki(t, cx, FLOOR, .95, { shout: a > 0 && a < .4 });
  banner(t, 0, 'ROUND 1', 'PUDDLE', '#2E7FC0');
  judge(t, at(0, 3), 'SPLASH!', '#FF7FB0');
}
const SHOPS = ['BAR', 'BOOKS', '24H', 'PHARMACY', 'NOODLES', 'CAFE', 'LAUNDRY', 'RECORDS', 'HOTEL', 'FLOWERS'];
const COLS = ['#FFD23F', '#7BD389', '#6EC6FF', '#C38DF0', '#FF8A5B', '#B8E15B'];
function round2(t, zoom) {
  set('tang', t);
  // cardboard shopfronts on sticks sliding past at her speed (the treadmill keeps her in place)
  const sx = (X(t) - X(2.5)) * .95;
  SHOPS.forEach((n, i) => { const x = 1500 + i * 520 - sx; if (x < -400 || x > W + 400) return; g.lineWidth = 10; g.strokeStyle = INK; g.beginPath(); g.moveTo(x, FLOOR); g.lineTo(x, 640); g.stroke();
    ink(rr(x - 190, 320, 380, 320, 18), COLS[i % 6]); ink(rr(x - 150, 440, 300, 170, 10), '#FFF6E5', { sh: 0, lw: 6 }); ink(rr(x - 170, 340, 340, 80, 14), CREAM, { sh: 0, lw: 6 }); g.save(); g.font = `700 ${n.length > 6 ? 46 : 58}px Fredoka`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK; g.fillText(n, x, 382); g.restore(); });
  // the treadmill belt
  ink(rr(500, FLOOR - 20, 920, 46, 23), '#4B4F63', { sh: 8 }); g.fillStyle = '#6B7088'; for (let k = 0; k < 14; k++) { const x = 520 + ((k * 70 - (X(t) * .95) % 70) + 980) % 980 - 20; if (x > 500 && x < 1400) g.fillRect(x, FLOOR - 12, 30, 30); }
  const { J, M } = aki(t, 900, FLOOR - 20, .95, { watch: true });
  crowd(t, -1); crowd(t, 1, { cheer: t > at(2, 1) && t < at(2, 3) });
  // the step counter: her own footfalls, off the show's grid
  const n = RUN.contacts.filter(c => c.t0 > 2.5 && c.t0 <= t).length, kk = 1 + .12 * Math.exp(-Math.max(0, t - (RUN.contacts.filter(c => c.t0 <= t).pop()?.t0 ?? 0)) / .06);
  ink(rr(1440, 40, 420, 150, 30), '#24306B'); telop('STEPS', 1560, 115, 46, '#FFE14A', { sh: 0 }); telop(String(n).padStart(2, '0'), 1755, 115, 84 * kk, '#fff', { sh: 0 });
  banner(t, at(1), 'ROUND 2', 'RUN!', '#D9783A');
  judge(t, at(2), 'GREAT!', '#FFE14A', .9);
  return { J, M };
}
function round3(t) {
  set('navy', t); crowd(t, -1); crowd(t, 1, { cheer: t > at(3, 2) });
  const w = 11 * 3600 + 58 * 60 + 48 + (t - 8.4);
  hostBean(t, 1560, FLOOR + 10, { shout: t < at(3) + .3, time: w });
  if (t < at(3, 2.5)) { const k = pop(t, at(3)); ink(rr(1380, 250, 340, 130, 54), '#fff', { sh: 8 }); g.save(); g.translate(1550, 315); g.scale(k, k); telop('TIME?', 0, 0, 80, '#FFE14A', { sh: 0 }); g.restore(); }
  aki(t, 430, FLOOR, .9, { watch: true });
  // the scoreboard answers on the half-beat, typed; the seconds flip on the watch's tick
  const k = pop(t, at(3, .5), .2); g.save(); g.translate(960, 470); g.scale(k, k); ink(rr(-330, -120, 660, 240, 40), '#141C45', { sh: 14 });
  const s = 47 + (t >= 8.4 ? 1 : 0), typed = Math.floor(clamp((t - at(3, .5)) / (BEAT * .5)) * 6), str = '11:58:'.slice(0, typed);
  g.font = '700 150px Fredoka'; g.textAlign = 'left'; g.textBaseline = 'middle';
  const w0 = g.measureText('11:58:').width, full = w0 + g.measureText('48').width;
  telop(str, -full / 2, 0, 150, '#fff', { sh: 0, align: 'left' });
  if (typed >= 6) { const f = s === 48 ? seg(t, 8.4, 8.5) : 1, sc = Math.abs(Math.cos(f * Math.PI)); g.save(); g.translate(-full / 2 + w0, 0); g.scale(1, f < .5 && s === 48 ? sc : (s === 48 ? sc : 1)); telop(f < .5 && s === 48 ? '47' : String(s), 0, 0, 150, '#FFE14A', { sh: 0, align: 'left' }); g.restore(); }
  g.restore();
  banner(t, at(3), 'ROUND 3', 'TIME?', '#C99A1E');
  judge(t, at(3, 2), 'HURRY!', '#FFE14A');
}
function final(t) {
  set('pink', t); crowd(t, -1, { cheer: true }); crowd(t, 1, { cheer: true });
  // the station bell, struck by the host on the chime
  const sw = t > EV.chime ? Math.sin((t - EV.chime) * 26) * Math.exp(-(t - EV.chime) * 4) * .35 : 0;
  g.lineWidth = 12; g.strokeStyle = INK; g.beginPath(); g.moveTo(760, 0); g.lineTo(760, 170); g.stroke();
  g.save(); g.translate(760, 170); g.rotate(sw); ink(() => { g.beginPath(); g.moveTo(-150, 260); g.quadraticCurveTo(-150, 20, 0, 0); g.quadraticCurveTo(150, 20, 150, 260); g.closePath(); }, '#FFD23F'); ink(rr(-170, 250, 340, 30, 15), '#E8B21F', { sh: 6 }); ink(circ(0, 300, 26), INK, { sh: 0, lw: 0 }); g.restore();
  burst(760, 330, 170, t, EV.chime, '#FFE14A');
  if (t > EV.chime) telop('DING!', 760, 640, 120, '#fff', { rot: -.12, k: pop(t, EV.chime) });
  const hitA = t < EV.chime ? lerp(.2, -1.3, ss(seg(t, 9.38, EV.chime - .02))) : -.4;
  hostBean(t, 1380, FLOOR + 10, { shout: t > EV.chime, still: true, sq: t > EV.chime ? t - EV.chime : 0 });
  g.save(); g.translate(1260, FLOOR - 230); g.rotate(hitA); ink(rr(-12, -260, 24, 260, 12), '#B5651D', { sh: 6 }); ink(rr(-40, -300, 80, 60, 20), '#E8E2D6', { sh: 6 }); g.restore();
  banner(t, at(3, 3), 'FINAL', 'LAST TRAIN', '#D94F86');
}
function frame(t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const p = punchAt(t), zoom = t >= 6.25 && t < 7.5 ? 1 : 0;
  g.save(); g.translate(W / 2, H / 2); g.scale(1 + p, 1 + p); g.translate(-W / 2, -H / 2);
  if (t < 2.5) round1(t);
  else if (t < 7.5) {
    if (zoom) { // snap zoom onto the raised watch (a hard cut to 2×, back on the next bar)
      const J = solveProfile(poseAt(t)), a = J.arm.n, x0 = X(t), wx = 900 + ((a.el[0] + (a.wr[0] - a.el[0]) * .8) - x0) * .95, wy = FLOOR - 20 + (a.el[1] + (a.wr[1] - a.el[1]) * .8) * .95;
      g.translate(W / 2, H / 2); g.scale(2, 2); g.translate(-wx, -wy + 60); round2(t); g.setTransform(1, 0, 0, 1, 0, 0);
      telop('11:58', W / 2 + 330, 250, 120, '#FFE14A', { rot: -.08, k: pop(t, 6.25) });
    } else round2(t);
  }
  else if (t < 9.375) round3(t);
  else final(t);
  g.restore();
  // hard cuts on bar lines (and the final beat) with a very short flash
  for (const c of [2.5, 6.25, 7.5, 9.375]) { const u = (t - c) / (2 / 30); if (u >= 0 && u < 1) { g.fillStyle = `rgba(255,255,255,${.55 * (1 - u)})`; g.fillRect(0, 0, W, H); } }
}
window.render = t => frame(t);
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
