// 057 · Silhouette Rhythm — the first 10 s of "Last Train Home" as black silhouettes against one warm light
// (lemo-opuscar styles/silhouette-rhythm). The light behind everything is the station clock, low at the end of the street like a
// setting sun; the wet street is the water, the second canvas (reflections, ripples, back-lit drops of rain). AKI is one black
// shape driven by the shared rig, her feet planted on the water. The sky sinks from gold to violet as midnight comes.
// S1 tracks low at water level: her legs cross the disc, the splash throws back-lit beads and rings. A near pillar crossing the
// lens is the black wipe into S2, where she runs across the disc in telephoto with the street's posts and roofs passing; a
// second black wipe opens on her wrist held up against the light, the watch's hands black on the glow (S3). S4 is the tower
// with the clock as the disc; on the chime everything freezes (rain hangs in the air, rings stop) while the sky keeps sinking
// and the camera starts down. Her footfalls are her own rhythm, a little off the city's 96 bpm: she is running late.
// Engine: engine/sky.js copied unchanged (the sky, water, rays and silhouette shader). Page contract: window.render(t), DUR, READY, RIGQA.
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash, mulberry } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080, TAU = Math.PI * 2;
const layer = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
const LF = layer(), LR = layer(), LX = layer(), fctx = LF.getContext('2d'), rctx = LR.getContext('2d'), xctx = LX.getContext('2d');
const draw = window.SKY.make(document.getElementById('g'));

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
  const dt = 1 / 240, n = Math.ceil(11 / dt), flap = new Float32Array(n), tail = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  let a = .3, va = 0; const th = [-.2, -.1, 0], vt = [0, 0, 0];
  const py = t => RUN.pelvisAt(t)[1], ay = t => (py(t + dt) - 2 * py(t) + py(t - dt)) / (dt * dt);
  for (let i = 0; i < n; i++) {
    const t = -.5 + i * dt, A = ay(t), wv = clamp((t - EV.watchUp) / .3) * (1 - clamp((t - EV.watchDown) / .3));
    va += (-46 * (a - (.34 + .06 * wv)) - 5.5 * va + .011 * A) * dt; a += va * dt; flap[i] = a;
    for (let k = 0; k < 3; k++) { const par = k ? th[k - 1] : -.1, rest = .16 + .05 * k; vt[k] += (-60 * (th[k] - (par + rest)) - 6 * vt[k] + .014 * A * (k + 1) * .6) * dt; th[k] += vt[k] * dt; tail[k][i] = th[k]; }
  }
  const at = (arr, t) => arr[clamp(Math.round((t + .5) / dt), 0, n - 1)];
  return { flap: t => at(flap, t), tail: t => tail.map(a => at(a, t)) };
})();

// ═════════ camera: a level pinhole over flat water (metres; x along the street, y up, z away from the lens)
let cam = { f: 3, hor: .66, ch: .9, cx: 0 };
function project(x, y, z) { const zz = Math.max(.05, z), fpx = cam.f * H; return [W / 2 + (x - cam.cx) / zz * fpx, cam.hor * H + (cam.ch - y) / zz * fpx, fpx / zz]; }
// a shape drawn in world metres at depth z: into the silhouettes, and mirrored about the waterline into the reflections
function both(z, fn, noRefl = false) {
  const wl = cam.hor * H + cam.ch / z * cam.f * H;
  for (const [ctx, refl] of [[fctx, false], [rctx, true]]) {
    if (refl && noRefl) continue;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath();
    if (refl) ctx.rect(-10, wl, W + 20, H); else ctx.rect(-10, -10, W + 20, wl + 10); ctx.clip();
    fn(ctx, (x, y) => project(x, refl ? -y : y, z));
    ctx.restore();
  }
}
const M_ = .0028;
function capP(ctx, a, b, r0, r1) { ctx.beginPath(); const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  for (let i = 0; i <= 8; i++) { const t = Math.PI / 2 + i / 8 * Math.PI; const x = a[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * r0, y = a[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * r0; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  for (let i = 0; i <= 8; i++) { const t = -Math.PI / 2 + i / 8 * Math.PI; ctx.lineTo(b[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * r1, b[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * r1); } ctx.closePath(); ctx.fill(); }
// AKI as one black shape: every part in one path, filled once (no inner detail; the contour is everything)
function aki(t, x0, z) {
  const J = solveProfile(poseAt(t));
  both(z, (ctx, P0) => {
    const P = p => P0((p[0] - X(t)) * M_ + x0(t), -p[1] * M_), k = P([X(t), 0])[2] * M_;
    ctx.beginPath();
    for (const kk of ['f', 'n']) { const l = J.leg[kk]; capP(ctx, P(l.hip), P(l.knee), 24 * k, 18 * k); capP(ctx, P(l.knee), P(l.ankle), 18 * k, 12 * k);
      const c = Math.cos(l.pitch), s = Math.sin(l.pitch), F = ([u, v]) => P([l.ankle[0] + u * c - v * s, l.ankle[1] + u * s + v * c]);
      [[-15, -34], [16, -34], [18, -8], [46, -2], [72, 6], [72, 16], [-24, 16], [-28, 0]].map(F).forEach((q, i) => i ? ctx.lineTo(...q) : (ctx.beginPath(), ctx.moveTo(...q))); ctx.closePath(); ctx.fill();
      const a = J.arm[kk], h = [a.wr[0] + (a.wr[0] - a.el[0]) * .24, a.wr[1] + (a.wr[1] - a.el[1]) * .24]; capP(ctx, P(a.sh), P(a.el), 16 * k, 13 * k); capP(ctx, P(a.el), P(a.wr), 13 * k, 10 * k); capP(ctx, P(a.wr), P(h), 9 * k, 5 * k); }
    const TT = (b, u, f) => P([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
    [TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)].forEach((q, i) => i ? ctx.lineTo(...q) : (ctx.beginPath(), ctx.moveTo(...q))); ctx.closePath(); ctx.fill();
    const fa = SIM.flap(t), hb = J.pelvis, ha = fa + 1.75, hp = [hb[0] - 60 * J.uL[0] - 56 * J.fL[0], hb[1] - 60 * J.uL[1] - 56 * J.fL[1]];
    [TT(J.pelvis, -40, -50), TT(J.pelvis, -96, -58), P([hp[0] + Math.cos(ha) * 72, hp[1] + Math.sin(ha) * 72]), P([hp[0] + Math.cos(ha) * 64 + 12, hp[1] + Math.sin(ha) * 64])].forEach((q, i) => i ? ctx.lineTo(...q) : (ctx.beginPath(), ctx.moveTo(...q))); ctx.closePath(); ctx.fill();
    capP(ctx, P(J.neckBase), P(J.neckTop), 12 * k, 11 * k);
    const hc = J.headC, HR = q => { const c = Math.cos(J.headA), s = Math.sin(J.headA); return P([hc[0] + q[0] * c - q[1] * s, hc[1] + q[0] * s + q[1] * c]); };
    [[16, -44], [34, -20], [44, -3], [37, 8], [39, 16], [34, 23], [32, 35], [12, 46], [-10, 48], [-36, 38], [-50, 8], [-46, -26], [-22, -48], [0, -60], [-36, -56]].map(HR).forEach((q, i) => i ? ctx.lineTo(...q) : (ctx.beginPath(), ctx.moveTo(...q))); ctx.closePath(); ctx.fill();
    const ta = SIM.tail(t); let ang = Math.PI - .25 + ta[0] + J.headA, p = [hc[0] - Math.cos(J.headA) * 50, hc[1] - Math.sin(J.headA) * 50 - 10];
    for (let i = 0; i < 3; i++) { const L = [46, 42, 36][i], q = [p[0] + Math.cos(ang) * L, p[1] + Math.sin(ang) * L]; capP(ctx, P(p), P(q), [14, 11, 8][i] * k, [11, 8, 3][i] * k); p = q; ang += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
  });
  return J;
}
// water light: rings on the water (bright crest here, dark trough in the reflections) and back-lit beads
function ring(x, z, r, al, lw) {
  if (al <= .003 || r <= 0) return;
  const p = project(x, 0, z), rx = r * p[2], ry = Math.max(.5, rx * cam.ch / z);
  xctx.globalAlpha = clamp(al); xctx.lineWidth = lw; xctx.beginPath(); xctx.ellipse(p[0], p[1], rx, ry, 0, 0, TAU); xctx.stroke(); xctx.globalAlpha = 1;
  rctx.save(); rctx.globalAlpha = clamp(al * .55); rctx.lineWidth = lw * 1.1; rctx.strokeStyle = '#000'; rctx.beginPath(); rctx.ellipse(p[0], p[1] + 1, Math.max(.5, rx - lw), Math.max(.4, ry - lw * .3), 0, 0, TAU); rctx.stroke(); rctx.restore();
}
function ripple(x, z, age, big) { if (age < 0 || age > 1.8) return; for (let j = 0; j < (big ? 3 : 2); j++) { const a = age - j * .16; if (a <= 0) continue; ring(x, z, .04 + (big ? .6 : .32) * Math.pow(a, .6), Math.pow(1 - a / 1.8, 2) * (big ? .95 : .7) * (j ? .6 : 1), big ? 3.2 : 2.2); } }
function droplets(x, z, age, seed, n, big) {
  if (age < 0 || age > 1.0) return;
  for (let i = 0; i < n; i++) { const vx = (hash(seed * 31 + i) - .5) * (big ? 2.4 : 1.4), vy = 1.1 + hash(seed * 17 + i * 3) * (big ? 2.2 : 1.2), vz = (hash(seed * 7 + i) - .5) * .4;
    const y = vy * age - 4.9 * age * age; if (y < 0) continue; const p = project(x + vx * age, y, z + vz * age), r = Math.max(1.2, (.006 + hash(i + seed) * .008) * p[2]);
    xctx.beginPath(); xctx.arc(p[0], p[1], r, 0, TAU); xctx.fill(); }
}
// rain: back-lit streaks (in the light layer), held still in the freeze
function rain(tr, n, seed = 1, near = 1) {
  const R = mulberry(seed); xctx.lineCap = 'round';
  for (let i = 0; i < n; i++) { const x = R() * W, L = (14 + R() * 30) * near, y = ((R() * (H + 80) + tr * 1300 * near) % (H + 80)) - 40; xctx.globalAlpha = .35 + R() * .35; xctx.lineWidth = 1.4 * near; xctx.beginPath(); xctx.moveTo(x, y); xctx.lineTo(x - L * .16, y + L); xctx.stroke(); }
  xctx.globalAlpha = 1;
}
function clearLayers() {
  for (const c of [fctx, rctx, xctx]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.fillStyle = '#000'; c.strokeStyle = '#000'; }
  xctx.fillStyle = '#fff'; xctx.strokeStyle = '#fff';
}
// city silhouettes: roofs and posts as flat black shapes at their depth (with reflections)
function city(z, x0, x1, seed, hMin, hMax, wMin, wMax) {
  const R = mulberry(seed); let x = x0;
  both(z, (ctx, P) => { ctx.beginPath(); while (x < x1) { const w = wMin + R() * (wMax - wMin), h = hMin + R() * (hMax - hMin), a = P(x, h), b = P(x + w, 0); ctx.rect(a[0], a[1], b[0] - a[0], b[1] - a[1]); if (R() < .3) { const c = P(x + w * .4, h + 2 + R() * 3); ctx.rect(c[0], c[1], (b[0] - a[0]) * .12, a[1] - c[1]); } x += w + R() * .6; } ctx.fill(); });
}
function post(x, z, h = 4.2) { both(z, (ctx, P) => { const a = P(x - .06, h), b = P(x + .06, 0), l = P(x + .45, h); ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); ctx.fillRect(a[0], a[1], l[0] - a[0], (b[0] - a[0]) * .8); const lb = P(x + .45, h - .2); ctx.beginPath(); ctx.arc(lb[0], lb[1], (b[0] - a[0]) * 1.6, 0, TAU); ctx.fill(); }); }
// the black wipe: a pillar crossing the lens
function wipe(t, t0, x1, z = .7) { const u = (t - (t0 - .14)) / .28; if (u < 0 || u > 1) return; const xc = cam.cx + lerp(1.4, -1.4, u) * z; both(z, (ctx, P) => { const a = P(xc - .55, 6), b = P(xc + .55, -1); ctx.fillRect(a[0], -10, b[0] - a[0], H + 20); }, true); }
const skyPh = t => lerp(.05, .95, clamp(t / 10));

// ═════════ shots
function S1(t) {
  cam = { f: 2.2, hor: .5, ch: .28, cx: .04 * t };
  clearLayers();
  city(500, -260, 260, 3, 6, 20, 6, 18);
  for (const c of RUN.contacts) { if (c.t0 > t) continue; const x = (c.x - SPL.x) * M_, big = Math.abs(c.t0 - EV.splash) < .02; ripple(x, 4.5, t - c.t0, big); droplets(x, 4.5, t - c.t0, Math.round(c.t0 * 100), big ? 26 : 6, big); }
  if (t > .3 && t < 1.95) aki(t, tt => (X(tt) - SPL.x) * M_, 4.5);
  rain(t, 110, 2, 1);
  wipe(t, 2.5);
  draw({ T: t, hor: cam.hor * H, fpx: cam.f * H, yaw: 0, cx: cam.cx, ch: cam.ch, sun: [.02, .045], sunR: .09, ph: skyPh(t), pulse: 0, flash: 0, rays: 1, vs: 1.4 }, [LF, LR, LX]);
}
const xA = t => (X(t) - X(2.5)) * M_;
function S2(t) {
  cam = { f: 3, hor: .66, ch: .9, cx: xA(t) + .3 };
  clearLayers();
  city(900, -320, 360, 7, 4, 13, 10, 26);
  for (let x = -10; x < 40; x += 7.5) post(x, 19);
  for (const c of RUN.contacts) { if (c.t0 > t || c.t0 < 2.2) continue; ripple(xA(c.t0) + (c.x - X(c.t0)) * M_, 14, t - c.t0, false); droplets(xA(c.t0) + (c.x - X(c.t0)) * M_, 14, t - c.t0, Math.round(c.t0 * 100), 5, false); }
  aki(t, xA, 14);
  rain(t, 120, 4, 1);
  wipe(t, 2.5); wipe(t, 7.5);
  draw({ T: t, hor: cam.hor * H, fpx: cam.f * H, yaw: 0, cx: cam.cx, ch: cam.ch, sun: [0, .06], sunR: .12, ph: skyPh(t), pulse: 0, flash: 0, rays: 1, vs: 1.8 }, [LF, LR, LX]);
}
// S3: the wrist held against the light; the watch's glass shows the glow through it, the hands black on it
const AH = (11 + 58 / 60) / 12 * TAU, AM = 58 / 60 * TAU;
function S3(t) {
  cam = { f: 2.6, hor: 1.15, ch: 1, cx: 0 };
  clearLayers();
  const bob = 10 * Math.sin((t - EV.splash) * TAU * CADENCE / 2), cx = 960, cy = 470 + bob, r = 150;
  const c = fctx; c.save(); c.beginPath();
  c.moveTo(-60, 980 + bob); c.lineTo(cx - 140, cy + 90); c.lineTo(cx + 40, cy + 120); c.lineTo(cx - 40, 1140); c.closePath();       // the forearm
  c.moveTo(cx + 100, cy + 40); c.quadraticCurveTo(cx + 260, cy - 10, cx + 330, cy + 60); c.quadraticCurveTo(cx + 380, cy + 150, cx + 300, cy + 230); c.lineTo(cx + 120, cy + 250); c.closePath();   // the hand
  c.moveTo(cx + 290, cy + 70); c.quadraticCurveTo(cx + 360, cy + 40, cx + 400, cy + 70); c.lineTo(cx + 330, cy + 110); c.closePath();   // the thumb
  c.rect(cx - 70, cy - 360, 140, 720);                                                                                                  // the strap
  c.fill();
  c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over';
  c.lineWidth = 22; c.beginPath(); c.arc(cx, cy, r + 4, 0, TAU); c.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.lineWidth = i % 3 ? 5 : 10; c.beginPath(); c.moveTo(cx + Math.sin(a) * r * .8, cy - Math.cos(a) * r * .8); c.lineTo(cx + Math.sin(a) * r * .95, cy - Math.cos(a) * r * .95); c.stroke(); }
  const hand = (a, L, w) => { c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.sin(a) * L, cy - Math.cos(a) * L); c.stroke(); };
  const sec = 47 + (t >= 8.4 ? 1 : 0) + (t >= 9.4 ? 1 : 0); hand(AH, r * .5, 11); hand(AM, r * .74, 7); hand(sec / 60 * TAU, r * .82, 2.5);
  c.beginPath(); c.arc(cx, cy, 9, 0, TAU); c.fill(); c.restore();
  rain(t, 90, 6, 1.4);
  wipe(t, 7.5);
  // the clock's glow sits right behind the watch's glass (in angle space: u = (px − W/2)/fpx, v = (hor − py)/fpx)
  const fpx = cam.f * H;
  draw({ T: t, hor: cam.hor * H, fpx, yaw: 0, cx: 0, ch: cam.ch, sun: [(cx - W / 2) / fpx, (cam.hor * H - cy) / fpx], sunR: (r - 4) / fpx, ph: skyPh(t), pulse: 0, flash: 0, rays: 1, vs: 1.2 }, [LF, LR, LX]);
}
// S4: the tower with the clock as the disc; the freeze on the chime (subject time and the water's noise stop; the sky goes on)
function S4(t) {
  const frozen = t >= EV.chime, tf = frozen ? EV.chime : t, dn = eio(seg(t, EV.chime, 10.6)) * .12;
  cam = { f: 2.4, hor: .82 - dn, ch: 1.4, cx: 0 };
  clearLayers();
  city(600, -260, 260, 11, 6, 24, 8, 20); city(260, -120, 120, 13, 4, 10, 4, 9);
  const TZ = 150, CYm = 34, R = 7;                                      // the clock: 7 m radius, 34 m up the tower, 150 m away
  both(TZ, (ctx, P) => { const a = P(-10, CYm - 8), b = P(10, 0); ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); const s1 = P(-8.5, CYm + R + 4), s2 = P(8.5, CYm - 8); ctx.fillRect(s1[0], s1[1], s2[0] - s1[0], s2[1] - s1[1]);
    const top = P(0, CYm + R + 16), l = P(-9.5, CYm + R + 4), rr = P(9.5, CYm + R + 4); ctx.beginPath(); ctx.moveTo(...top); ctx.lineTo(...l); ctx.lineTo(...rr); ctx.closePath(); ctx.fill();
    // a round hole for the clock: the light shows through; the hands stay black
    const c = P(0, CYm), rp = R * c[2]; ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(c[0], c[1], rp, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = rp * .08; ctx.beginPath(); ctx.arc(c[0], c[1], rp, 0, TAU); ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.lineWidth = rp * (i % 3 ? .03 : .06); ctx.beginPath(); ctx.moveTo(c[0] + Math.sin(a) * rp * .8, c[1] - Math.cos(a) * rp * .8); ctx.lineTo(c[0] + Math.sin(a) * rp * .95, c[1] - Math.cos(a) * rp * .95); ctx.stroke(); }
    ctx.lineCap = 'round'; for (const [a, L, w] of [[AH, .5, .07], [AM, .74, .045]]) { ctx.lineWidth = rp * w; ctx.beginPath(); ctx.moveTo(...c); ctx.lineTo(c[0] + Math.sin(a) * rp * L, c[1] - Math.cos(a) * rp * L); ctx.stroke(); } });
  for (let x = -16; x <= 16; x += 8) post(x, 24);
  rain(tf, 140, 8, 1);                                                  // held in the air from the chime
  const c = project(0, CYm, TZ), fpx = cam.f * H;
  draw({ T: tf, hor: cam.hor * H, fpx, yaw: 0, cx: 0, ch: cam.ch, sun: [(c[0] - W / 2) / fpx, (cam.hor * H - c[1]) / fpx], sunR: R * c[2] / fpx * .98, ph: skyPh(t), pulse: frozen ? 0 : 0, flash: frozen ? Math.exp(-(t - EV.chime) * 8) : 0, rays: 1, vs: 1.3 }, [LF, LR, LX]);
}

window.render = t => { if (t < 2.5) S1(t); else if (t < 7.5) S2(t); else if (t < 9.375) S3(t); else S4(t); };
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0);
window.READY = true;
