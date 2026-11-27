// 081 · Flow-field Wind Lines — the first 10 s of "Last Train Home" as the air streaming past a runner, engraved on paper (lemo-opuscar styles/flow-field).
// A narrative adaptation with a real field. The chart is a side elevation of the street, printed in ink on warm paper, and the camera follows
// her, so the lines show the air relative to AKI: a uniform head wind of her own speed (4.06 m/s) parting round her body. Model, stated:
// 2D potential flow, a doublet per body part (circles sampled along the shared rig's bones every frame: head, trunk, coat, thighs, shins,
// feet, arms; radii from the rig's widths) on a uniform stream, the street as a wall (mirror images below y = 0). Approximations: superposed
// doublets (no exact boundary), no viscous wake, no 3D. Events add terms: at the splash (0.94 s) a decaying point source at the far foot
// (spray thrown up from the puddle), and on the chime (9.58 s) an outgoing pressure pulse from the tower clock (a radial velocity ring at
// the speed of sound, scaled). Lines: world-fixed jittered seeds per level of detail, fixed-step RK2 both ways, time-of-flight strokes.
// Ramp (m/s): ink < 1.5 · slate < 3 · grey-blue < 4 · umber < 4.6 · ochre < 5.5 · orange < 7 · vermilion ≥ 7 (the extreme band).
//   S1  low and close: the stagnation at her shins, the lines parting round the feet; the puddle, printed; the spray at the splash
//   S2  pull up: the whole figure in the stream, the fastest (orange, vermilion) over head and shoulders; at 6.05 s the raised arm reshapes it
//   S3  near lock on the wrist: the reading cartouche on a leader, 11:58:47 rolling to 48 at 8.4 s
//   S4  long pull-back: the street ahead, the clock tower printed far off; on the chime its pulse rings outward through the lines
// Page contract: window.render(t), DUR, READY, RIGQA.
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash, mulberry } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080, TAU = Math.PI * 2, g = document.getElementById('c').getContext('2d');
await Promise.all(['400 20px OldStd', 'italic 400 20px OldStd', '700 20px OldStd', '500 20px PMono'].map(f => document.fonts.load(f, 'AB09')));
const PAPER = '#ECE0C4', INK = '#262C38', VERM = '#C83A24';
const RAMP = [[1.5, '#262C38'], [3, '#2C3A4A'], [4, '#3E525C'], [4.6, '#705C3A'], [5.5, '#9E6828'], [7, '#C46C26'], [1e9, '#C83A24']];
const rampI = ms => { for (let i = 0; i < RAMP.length; i++) if (ms < RAMP[i][0]) return i; return RAMP.length - 1; };

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
const W_T = t => 11 * 3600 + 58 * 60 + 48 + (t - 8.4), MS = .0028;   // rig units → metres
const hms = s => { s = Math.floor(s + 1e-6); return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

// ═════════ the field, in her frame (origin at her pelvis x, ground y = 0, y down): u − iv = −U (1 − Σ a²/(z − c)²) + sources + pulse
const U = 1450;
function bodyAt(t) {
  const J = solveProfile(poseAt(t)), x0 = X(t), C = [], P = p => [p[0] - x0, p[1]];
  const along = (a, b, n, r0, r1) => { for (let i = 0; i < n; i++) { const u = (i + .5) / n; C.push([lerp(a[0], b[0], u) - x0, lerp(a[1], b[1], u), lerp(r0, r1, u)]); } };
  for (const k of ['f', 'n']) { const l = J.leg[k], a = J.arm[k], c = Math.cos(l.pitch), s = Math.sin(l.pitch);
    along(l.hip, l.knee, 2, 36, 30); along(l.knee, l.ankle, 2, 26, 21); along(l.ankle, [l.ankle[0] + 66 * c, l.ankle[1] + 66 * s], 1, 19, 19);
    along(a.sh, a.el, 1, 24, 24); along(a.el, a.wr, 1, 20, 20); }
  along(J.neckBase, J.pelvis, 3, 52, 58); const TT = (b, u, f) => [b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f];
  along(TT(J.pelvis, -40, -4), TT(J.pelvis, -96, -4), 1, 64, 64); C.push([J.headC[0] - x0, J.headC[1], 56]);
  return { J, C, x0 };
}
function makeField(t) {
  const { J, C, x0 } = bodyAt(t), sp = t - SPL.t0, src = sp > 0 && sp < 1.4 ? { x: SPL.x + 44 - x0, y: -6, m: 2.6e6 * Math.exp(-sp / .3) } : null;
  const pulse = t > EV.chime ? { x: TOWER.x - x0, y: TOWER.clockY, R: (t - EV.chime) * 34000, A: 3600 * Math.exp(-(t - EV.chime) * 1.2), w: 900 } : null;
  const f = (x, y) => {
    let re = -U, im = 0;                                  // w = u − i v
    for (const [cx, cy, a] of C) for (const yy of [cy, -cy]) { const dx = x - cx, dy = y - yy, r2 = dx * dx + dy * dy + 1e-3; const a2 = a * a, d2r = (dx * dx - dy * dy) / (r2 * r2), d2i = -2 * dx * dy / (r2 * r2);   // 1/(z−c)²
      re += U * a2 * d2r; im += U * a2 * d2i; }
    let u = re, v = -im;
    if (src) for (const yy of [src.y, -src.y]) { const dx = x - src.x, dy = y - yy, r2 = dx * dx + dy * dy + 400; u += src.m / TAU * dx / r2; v += src.m / TAU * dy / r2; }
    if (pulse) { const dx = x - pulse.x, dy = y - pulse.y, r = Math.hypot(dx, dy) + 1e-3, k = pulse.A * Math.exp(-Math.pow((r - pulse.R) / pulse.w, 2)); u += k * dx / r; v += k * dy / r; }
    return [u, v];
  };
  return { f, J, C, x0 };
}

// ═════════ the printed world (side elevation, world units = rig units, anchored to the street)
const TOWER = { x: X(9.6) + 10200, clockY: -5200, w: 1500, h: 6400 };
const SHOPS = ['Hotel', 'Bar', 'Pharmacy', 'Books', 'Noodles', 'Records', 'Bakery', 'Laundry', 'Flowers', 'Tailor', 'Kiosk', 'Café'];
// ═════════ camera: world point (her frame offset fx, fy) at the screen centre, zoom z (px per rig unit)
const K = (fx, fy, z) => ({ fx, fy, z }), mixK = (a, b, u) => K(lerp(a.fx, b.fx, u), lerp(a.fy, b.fy, u), Math.exp(lerp(Math.log(a.z), Math.log(b.z), u)));
const C1 = t => K(120, -150, lerp(1.25, 1.32, seg(t, 0, 2.5))), C2 = t => K(160, -330, lerp(.6, .64, seg(t, 3.4, 7.5)));
const C3 = t => { const J = solveProfile(poseAt(Math.min(t, EV.watchDown))), a = J.arm.n; return K(a.wr[0] - X(Math.min(t, EV.watchDown)) + 260, a.wr[1] + 30, lerp(2.0, 2.1, seg(t, 7.8, 9.375))); };
const C4 = t => K(5200, -2600, lerp(.098, .092, seg(t, 9.6, 10)));
function camAt(t) {
  if (t < 2.5) return C1(t); if (t < 7.5) return mixK(C1(2.5), C2(t), eio(seg(t, 2.5, 3.4)));
  if (t < 9.375) { const c3 = C3(7.85); return mixK(C2(7.5), K(c3.fx, c3.fy, c3.z), eio(seg(t, 7.5, 7.85))); }
  return mixK(C3(9.375), C4(t), eio(seg(t, 9.375, 9.7)));
}

// ═════════ streamlines: world-fixed jittered seeds per level (in her frame), fixed-step RK2 both ways, LOD weights, time-of-flight strokes
function drawLines(t, F, cam, x0) {
  const sx = x => W / 2 + (x - cam.fx) * cam.z, sy = y => H / 2 + (y - cam.fy) * cam.z;
  const kf = Math.log2(36 / (40 * cam.z)), k0 = Math.floor(kf), levels = [[k0, 1 - (kf - k0)], [k0 + 1, kf - k0]];
  const Phi = t * 3.2, buckets = new Map(), bk = (key, mk) => { let b = buckets.get(key); if (!b) { b = { p: new Path2D(), ...mk }; buckets.set(key, b); } return b.p; };
  const vx0 = cam.fx - W / 2 / cam.z - 200 / cam.z, vx1 = cam.fx + W / 2 / cam.z + 200 / cam.z, vy0 = cam.fy - H / 2 / cam.z - 200 / cam.z, vy1 = Math.min(-2, cam.fy + H / 2 / cam.z + 100 / cam.z);
  for (const [k, wk] of levels) { if (wk < .02) continue; const s = 40 * Math.pow(2, k), h = s / 7, N = 26;
    for (let gx = Math.floor(vx0 / s); gx <= Math.ceil(vx1 / s); gx++) for (let gy = Math.floor(vy0 / s); gy <= Math.ceil(vy1 / s); gy++) {
      const px = (gx + .5 + (hash(gx * 7.1 + gy * 13.3 + k) - .5) * .7) * s, py = (gy + .5 + (hash(gx * 3.7 + gy * 5.9 + k * 2) - .5) * .7) * s; if (py > -4) continue;
      let inside = 0; for (const [cx, cy, a] of F.C) { const d = Math.hypot(px - cx, py - cy) / a; if (d < 1.15) inside = Math.max(inside, 1 - clamp((d - .8) / .35)); } if (inside > .98) continue;
      const pts = [[px, py]], spd = [];
      for (const dir of [1, -1]) { let x = px, y = py; const seq = [];
        for (let i = 0; i < N; i++) { const [u1, v1] = F.f(x, y), m1 = Math.hypot(u1, v1) + 1e-6, hh = h * Math.min(1, m1 / (.25 * U)) * dir, xm = x + u1 / m1 * hh / 2, ym = y + v1 / m1 * hh / 2, [u2, v2] = F.f(xm, ym), m2 = Math.hypot(u2, v2) + 1e-6;
          x += u2 / m2 * hh; y += v2 / m2 * hh; if (y > -1) y = -1; seq.push([x, y, m2]); }
        if (dir === 1) { pts.push(...seq.map(p => [p[0], p[1]])); spd.push(...seq.map(p => p[2])); } else { pts.unshift(...seq.map(p => [p[0], p[1]]).reverse()); spd.unshift(...seq.map(p => p[2]).reverse()); } }
      spd.splice(N, 0, Math.hypot(...F.f(px, py)));
      // time of flight along the line (compressive speed), strokes where the phase passes the flow clock
      let tau = 0; const n = pts.length, al = wk * (1 - inside);
      for (let i = 1; i < n; i++) { const a = pts[i - 1], b = pts[i], ds = Math.hypot(b[0] - a[0], b[1] - a[1]), ms = spd[i] * MS; tau += ds * cam.z / Math.pow(Math.max(.3, ms) * 60, .6);
        const taper = Math.pow(Math.sin(Math.PI * i / n), .8), ci = rampI(ms), ph = ((tau / 14 - Phi) % 1 + 1) % 1, base = Math.round(clamp(al * taper * .5) * 40) / 40;
        if (base > .02) bk(`b${ci}|${base}`, { c: RAMP[ci][1], a: base, w: 1.05 }).moveTo(sx(a[0]), sy(a[1])), bk(`b${ci}|${base}`).lineTo(sx(b[0]), sy(b[1]));
        if (ph < .2) { const sa = Math.round(clamp(al * taper * (1 - ph / .2) * .95) * 40) / 40; if (sa > .02) { const key = `s${ci}|${sa}`; bk(key, { c: RAMP[ci][1], a: sa, w: 2.3 }).moveTo(sx(a[0]), sy(a[1])); bk(key).lineTo(sx(b[0]), sy(b[1])); } } } } }
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const b of buckets.values()) { g.globalAlpha = b.a; g.strokeStyle = b.c; g.lineWidth = b.w; g.stroke(b.p); } g.globalAlpha = 1;
}

// ═════════ the engraving: paper, the street elevation, the tower, AKI hatched
const FIB = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 512; const q = c.getContext('2d'), r = mulberry(5); for (let i = 0; i < 9000; i++) { q.fillStyle = r() < .5 ? 'rgba(120,96,60,.05)' : 'rgba(255,250,235,.10)'; q.fillRect(r() * 512, r() * 512, 1 + r() * 3, .7 + r() * .6); } return c; })();
function hatch(path, sx, sy, spacing, ang, col, lw = 1) { g.save(); g.clip(path); g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); const L = 2600, c = Math.cos(ang), s = Math.sin(ang);
  for (let d = -L; d < L; d += spacing) { g.moveTo(sx + c * -L - s * d, sy + s * -L + c * d); g.lineTo(sx + c * L - s * d, sy + s * L + c * d); } g.stroke(); g.restore(); }
function world(t, cam, x0, F) {
  const sx = x => W / 2 + (x - x0 - cam.fx) * cam.z, sy = y => H / 2 + (y - cam.fy) * cam.z, z = cam.z;
  g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
  // ground: a double line, a kerb band hatched, the road below
  const gy = sy(0); g.fillStyle = 'rgba(112,92,58,.10)'; g.fillRect(0, gy, W, H - gy); hatch(new Path2D(`M0 ${gy}H${W}V${gy + Math.max(6, 120 * z)}H0Z`), W / 2, gy, Math.max(4, 22 * z), .8, 'rgba(38,44,56,.35)');
  g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(0, gy); g.lineTo(W, gy); g.stroke(); g.lineWidth = 1; g.beginPath(); g.moveTo(0, gy + 5); g.lineTo(W, gy + 5); g.stroke();
  // shopfronts (behind her, printed lighter) with italic names
  for (let i = -2; i < 40; i++) { const x = -1600 + i * 1150, w_ = 1080, h_ = 1250; if (sx(x + w_) < -50 || sx(x) > W + 50) continue;
    g.strokeStyle = 'rgba(38,44,56,.45)'; g.lineWidth = 1.2; g.strokeRect(sx(x), sy(-h_), w_ * z, h_ * z); g.strokeRect(sx(x + 90), sy(-h_ + 380), 520 * z, 560 * z); g.strokeRect(sx(x + 720), sy(-760), 260 * z, 760 * z);
    hatch(new Path2D(`M${sx(x + 90)} ${sy(-h_ + 380)}h${520 * z}v${560 * z}h${-520 * z}Z`), sx(x), sy(-h_), Math.max(3, 16 * z), -.9, 'rgba(38,44,56,.22)');
    if (z > .2) { g.font = `italic 400 ${Math.max(14, 70 * z)}px OldStd`; g.fillStyle = 'rgba(38,44,56,.7)'; g.textAlign = 'center'; g.letterSpacing = `${6 * z}px`; g.fillText(SHOPS[(i + 24) % SHOPS.length], sx(x + 540), sy(-h_ + 200)); g.letterSpacing = '0px'; } }
  // the puddle: a printed water shape, hatched horizontally, named in italic like water on a chart
  { const px = SPL.x + 44, P = new Path2D(); P.ellipse(sx(px), gy + 2, 300 * z, 26 * z + 2, 0, 0, TAU);
    g.fillStyle = 'rgba(120,140,150,.25)'; g.fill(P); hatch(P, sx(px), gy, Math.max(2.5, 7 * z), 0, 'rgba(38,44,56,.45)');
    if (z > .3) { g.font = `italic 400 ${Math.max(15, 30 * z)}px OldStd`; g.fillStyle = INK; g.textAlign = 'center'; g.letterSpacing = `${4 * z}px`; g.fillText('the puddle', sx(px), gy + 80 * z); g.letterSpacing = '0px'; } }
  // the clock tower, far ahead (S4)
  { const T = TOWER, x = sx(T.x - T.w / 2), w_ = T.w * z; if (x < W + 100 && x + w_ > -100) { g.strokeStyle = INK; g.lineWidth = 1.6; const P = new Path2D(`M${x} ${gy}V${sy(-T.h)}H${x + w_}V${gy}Z`); g.fillStyle = PAPER; g.fill(P); g.stroke(P);
    hatch(P, x, gy, Math.max(3, 60 * z), -.85, 'rgba(38,44,56,.3)'); const top = sy(-T.h); g.beginPath(); g.moveTo(x - 60 * z, top); g.lineTo(x + w_ / 2, top - 1700 * z); g.lineTo(x + w_ + 60 * z, top); g.closePath(); g.fillStyle = PAPER; g.fill(); g.stroke();
    const cx = sx(T.x), cy = sy(T.clockY); g.beginPath(); g.arc(cx, cy, 420 * z, 0, TAU); g.fillStyle = PAPER; g.fill(); g.lineWidth = 2; g.stroke(); g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, 380 * z, 0, TAU); g.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(cx + Math.sin(a) * 330 * z, cy - Math.cos(a) * 330 * z); g.lineTo(cx + Math.sin(a) * 380 * z, cy - Math.cos(a) * 380 * z); g.stroke(); }
    const mn = 58.8, hr = 11 + mn / 60; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(mn / 60 * TAU) * 330 * z, cy - Math.cos(mn / 60 * TAU) * 330 * z); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(hr / 12 * TAU) * 220 * z, cy - Math.cos(hr / 12 * TAU) * 220 * z); g.stroke();
    if (z < .3) { g.font = 'italic 400 24px OldStd'; g.fillStyle = INK; g.textAlign = 'center'; g.fillText('the station clock', cx, sy(-T.h) - 1700 * z - 26); } } }
  // AKI, engraved: paper fill, an ink contour, a diagonal hatch for the shaded far side (drawn after the lines: the air parts round her)
  const drawAki = () => { const J = F.J, P = p => [sx(p[0]), sy(p[1])], R = z;
  const capsule = (a, b, r0, r1) => { const A = P(a), B = P(b), dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, p = new Path2D();
    p.moveTo(A[0] + nx * r0 * R, A[1] + ny * r0 * R); p.lineTo(B[0] + nx * r1 * R, B[1] + ny * r1 * R); p.arc(B[0], B[1], r1 * R, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI); p.lineTo(A[0] - nx * r0 * R, A[1] - ny * r0 * R); p.arc(A[0], A[1], r0 * R, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI); p.closePath(); return p; };
  const part = (p, shade) => { g.fillStyle = PAPER; g.fill(p); if (shade) hatch(p, W / 2, H / 2, Math.max(2.5, 6 * z), -.8, 'rgba(38,44,56,.55)', .9); g.strokeStyle = INK; g.lineWidth = Math.max(1.1, 2.2 * z); g.stroke(p); };
  const limb = (k, shade) => { const l = J.leg[k], a = J.arm[k], c = Math.cos(l.pitch), s = Math.sin(l.pitch);
    return [() => { part(capsule(l.hip, l.knee, 32, 26), shade); part(capsule(l.knee, l.ankle, 24, 19), shade); part(capsule(l.ankle, [l.ankle[0] + 66 * c, l.ankle[1] + 66 * s], 18, 14), true); },
      () => { part(capsule(a.sh, a.el, 22, 19), shade); part(capsule(a.el, [a.wr[0] + (a.wr[0] - a.el[0]) * .25, a.wr[1] + (a.wr[1] - a.el[1]) * .25], 18, 15), shade); }]; };
  const [lf, af] = limb('f', true), [ln, an] = limb('n', false);
  af(); lf();
  const TT = (b, u, f_) => P([b[0] + J.uL[0] * u + J.fL[0] * f_, b[1] + J.uL[1] * u + J.fL[1] * f_]), co = [TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)];
  const coat = new Path2D(); co.forEach((p, i) => i ? coat.lineTo(...p) : coat.moveTo(...p)); coat.closePath(); part(coat, false); hatch(coat, W / 2, H / 2, Math.max(3, 9 * z), .9, 'rgba(38,44,56,.3)', .8);
  ln(); part(capsule(J.neckBase, J.neckTop, 18, 17), false);
  const ta = SIM.tail(t); let ang = Math.PI - .25 + ta[0] + J.headA, p = [J.headC[0] - Math.cos(J.headA) * 50, J.headC[1] - Math.sin(J.headA) * 50 - 10];
  for (let i = 0; i < 3; i++) { const Lk = [46, 42, 36][i], q = [p[0] + Math.cos(ang) * Lk, p[1] + Math.sin(ang) * Lk]; part(capsule(p, q, [16, 13, 9][i], [13, 9, 5][i]), true); p = q; ang += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
  const hc = P(J.headC), hp = new Path2D(); hp.arc(hc[0], hc[1], 50 * R, 0, TAU); part(hp, false); const hair = new Path2D(); hair.arc(hc[0], hc[1], 50 * R, J.headA + Math.PI * .55, J.headA + Math.PI * 1.65); hair.closePath(); hatch(hair, hc[0], hc[1], Math.max(2, 4 * z), .3, 'rgba(38,44,56,.8)', .9);
  an(); };
  return { sx, sy, drawAki };
}
function cartouche(x, y, w, h, draw) { g.fillStyle = PAPER; g.fillRect(x, y, w, h); g.strokeStyle = INK; g.lineWidth = 1.6; g.strokeRect(x + .5, y + .5, w, h); g.lineWidth = .8; g.strokeRect(x + 5.5, y + 5.5, w - 10, h - 10); draw(); }
function overlay(t, cam, M) {
  // the title block and the legend (the lines are their own key: the same ramp)
  const la = 1 - seg(t, 7.4, 7.6) + seg(t, 9.5, 9.7);
  if (la > .01) { g.globalAlpha = clamp(la); cartouche(64, 64, 430, 184, () => { g.fillStyle = INK; g.textAlign = 'left'; g.font = '700 26px OldStd'; g.fillText('Air past a runner', 86, 104); g.font = 'italic 400 19px OldStd'; g.fillText('relative wind in her frame, metres per second', 86, 132);
    const ed = [0, 1.5, 3, 4, 4.6, 5.5, 7]; RAMP.forEach(([, c], i) => { g.fillStyle = c; g.fillRect(86 + i * 54, 152, 50, 14); g.fillStyle = INK; g.font = '500 13px PMono'; g.fillText(ed[i] === 0 ? '0' : String(ed[i]), 86 + i * 54, 188); });
    g.font = '500 13px PMono'; g.fillText('free stream 4.06', 86, 228); }); g.globalAlpha = 1; }
  // the reading on a leader from the wrist (S3)
  if (t >= 7.6 && t < 9.4) { const J = solveProfile(poseAt(t)), a = J.arm.n, wp = [a.el[0] + (a.wr[0] - a.el[0]) * .84, a.el[1] + (a.wr[1] - a.el[1]) * .84], x0 = X(t);
    const px = W / 2 + (wp[0] - x0 - cam.fx) * cam.z, py = H / 2 + (wp[1] - cam.fy) * cam.z, ca = clamp((t - 7.6) / .2) * (1 - clamp((t - 9.25) / .12));
    g.globalAlpha = ca; g.strokeStyle = INK; g.lineWidth = 1.4; g.beginPath(); g.arc(px, py, 12, 0, TAU); g.moveTo(px + 9, py - 9); g.lineTo(1190, 300); g.lineTo(1260, 300); g.stroke();
    cartouche(1260, 210, 560, 190, () => { g.fillStyle = INK; g.textAlign = 'left'; g.font = 'italic 400 24px OldStd'; g.fillText('her watch', 1290, 256);
      const roll = t < 8.4 ? clamp((t - 7.7) / .35) : 1, s = hms(W_T(t)), shown = roll < 1 ? s.slice(0, 6) + String(Math.floor(hash(Math.floor(t * 30)) * 60)).padStart(2, '0') : s;
      g.font = '500 76px PMono'; g.fillStyle = INK; g.fillText(shown, 1290, 350); g.font = '500 14px PMono'; g.fillStyle = INK; g.fillText(`${120 - Math.floor(W_T(t) + 1e-6) % 60} s to 12:00:00`, 1290, 384); }); g.globalAlpha = 1; }
  // the verdict: the chime, in vermilion (the single event)
  if (t >= EV.chime) { const a = clamp((t - EV.chime) / .12), T = TOWER, cx = M.sx(T.x), cy = M.sy(T.clockY); g.globalAlpha = a; g.strokeStyle = VERM; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx - 60, cy); g.lineTo(cx - 280, cy - 120); g.lineTo(cx - 330, cy - 120); g.stroke();
    cartouche(cx - 700, cy - 190, 370, 120, () => { g.fillStyle = VERM; g.textAlign = 'left'; g.font = '700 30px OldStd'; g.fillText('Chime', cx - 675, cy - 142); g.font = '500 34px PMono'; g.fillText('11:58:49', cx - 675, cy - 96); }); g.globalAlpha = 1; }
}
function frame(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); const cam = camAt(t), F = makeField(t), x0 = F.x0;
  const M = world(t, cam, x0, F);
  drawLines(t, F, cam, x0);
  M.drawAki();
  overlay(t, cam, M);
  g.globalCompositeOperation = 'multiply'; g.globalAlpha = .5; g.fillStyle = g.createPattern(FIB, 'repeat'); g.fillRect(0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  const vg = g.createRadialGradient(W / 2, H / 2, H * .4, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(90,70,40,0)'); vg.addColorStop(1, 'rgba(90,70,40,.22)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
}
window.render = t => frame(clamp(+t || 0, 0, DUR));
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
