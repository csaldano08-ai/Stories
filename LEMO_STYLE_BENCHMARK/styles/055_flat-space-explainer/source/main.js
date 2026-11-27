// 055 · Scale Zoom Explainer — the first 10 s of "Last Train Home" as one continuous change of scale in flat, opaque shapes on a
// night-blue ground (lemo-opuscar styles/flat-space-explainer): every object one base colour and one shade step (the base copy
// shifted toward the upper-left light and clipped to the shape), glows as two hard rings, true scale inside each frame, and a
// corner instrument (field of view and a log ribbon of the stops) read from the same camera.
// The guide here is AKI and her lens is her watch: the next-stop ring locks on it, the camera dives through the ring into the
// watch at true size, and the watch's lens fires the dotted sight line toward the station; a shape match turns the dial into
// the station clock and the camera pulls back to the tower, whose halo rings lock on the chime.
// S1 opens on a pull back from a single raindrop (2 cm) to the puddle (2.2 m); S2 tracks her while pulling out (4.5 → 9 m).
// Canvas 2D drawing of the style's flat model (the demo builds SVG); palette values from the demo's flat.js.
// Page contract: window.render(t), DUR, READY, RIGQA.
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, mulberry } from './shared/lib/util.js';

window.DUR = DUR;
const cv = document.getElementById('c'), g = cv.getContext('2d');
await Promise.all(['700 60px Jost', '600 30px Jost'].map(f => document.fonts.load(f)));
const W = 1920, H = 1080, TAU = Math.PI * 2;
const C = { night: '#1D2052', n2: '#252A63', n3: '#30367C', mist: '#9298D4', blue: '#4D7CFE', blueD: '#3A5FD9', mint: '#3FD8AE', mintD: '#22B38C',
  coral: '#FF6B5E', coralD: '#E14B45', sun: '#FFC84A', sunD: '#F2A12F', cream: '#FFF4E2', creamD: '#F0DCC0', hair: '#171A45' };

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

// ═════════ the flat model: one shade step per shape, glow as two hard rings
const path = pts => { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); return p; };
const circ = (x, y, r) => { const p = new Path2D(); p.arc(x, y, Math.max(0, r), 0, TAU); return p; };
const ell = (x, y, rx, ry) => { const p = new Path2D(); p.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, TAU); return p; };
const rrect = (x, y, w, h, r) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
// shade everywhere, base on the copy shifted toward the upper-left light, clipped to the shape: a crescent of shade at the lower right
function shaded(P, base, shade, d = 6) { g.fillStyle = shade; g.fill(P); g.save(); g.clip(P); g.translate(-d, -d); g.fillStyle = base; g.fill(P); g.restore(); }
function halo(x, y, r) { g.fillStyle = C.n2; g.fill(circ(x, y, r * 2.1)); g.fillStyle = C.n3; g.fill(circ(x, y, r * 1.5)); }
const cap = (a, b, r0, r1, n = 8) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, o = [];
  for (let i = 0; i <= n; i++) { const t = Math.PI / 2 + i / n * Math.PI; o.push([a[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * r0, a[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * r0]); }
  for (let i = 0; i <= n; i++) { const t = -Math.PI / 2 + i / n * Math.PI; o.push([b[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * r1, b[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * r1]); }
  return path(o);
};

// ═════════ one camera: screen = (p − C)·z + S0 in metres (y up), with parallax layers taking a fraction of the zoom
const M_ = .0028;                                                    // metres per rig unit: AKI ≈ 1.62 m
const xw = rx => (rx - SPL.x) * M_;
let CAM = { x: 0, y: 0, z: 1 };
const S = (x, y, f = 1) => { const z = CAM.z * f; return [W / 2 + (x - CAM.x) * z, H / 2 - (y - CAM.y) * z]; };
const px = (m, f = 1) => m * CAM.z * f;

// ═════════ AKI, flat: a coral jacket, blue trousers, cream skin, a dark ponytail; one shade step on every part
function aki(t) {
  const J = solveProfile(poseAt(t)), P = p => S(xw(p[0]), -p[1] * M_), k = CAM.z * M_, d = Math.max(1.5, 7 * k / .9 * .3);
  const leg = (kk, base, shade) => { const l = J.leg[kk]; shaded(cap(P(l.hip), P(l.knee), 25 * k, 19 * k), base, shade, d); shaded(cap(P(l.knee), P(l.ankle), 19 * k, 14 * k), base, shade, d);
    const c = Math.cos(l.pitch), s = Math.sin(l.pitch), F = ([u, v]) => P([l.ankle[0] + u * c - v * s, l.ankle[1] + u * s + v * c]);
    shaded(path([F([-16, -34]), F([17, -34]), F([19, -8]), F([46, -2]), F([72, 6]), F([74, 17]), F([-25, 17]), F([-29, 0])]), C.n3, C.night, d); };
  const arm = (kk, base, shade) => { const a = J.arm[kk], h = [a.wr[0] + (a.wr[0] - a.el[0]) * .2, a.wr[1] + (a.wr[1] - a.el[1]) * .2];
    shaded(cap(P(a.sh), P(a.el), 17 * k, 14 * k), base, shade, d); shaded(cap(P(a.el), P(a.wr), 14 * k, 12 * k), base, shade, d); shaded(cap(P(a.wr), P(h), 11 * k, 12 * k), C.cream, C.creamD, d * .6); return a; };
  arm('f', C.coralD, C.coralD); leg('f', C.blueD, C.blueD);
  const ta = SIM.tail(t), hc = J.headC, HR = q => { const c = Math.cos(J.headA), s = Math.sin(J.headA); return P([hc[0] + q[0] * c - q[1] * s, hc[1] + q[0] * s + q[1] * c]); };
  let ang = Math.PI - .25 + ta[0] + J.headA, p = [hc[0] + Math.cos(J.headA + Math.PI) * 50, hc[1] + Math.sin(J.headA + Math.PI) * 50 - 10];
  for (let i = 0; i < 3; i++) { const L = [46, 42, 36][i], q = [p[0] + Math.cos(ang) * L, p[1] + Math.sin(ang) * L]; shaded(cap(P(p), P(q), [15, 12, 9][i] * k, [12, 9, 4][i] * k), C.hair, '#0f1132', d * .5); p = q; ang += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
  const TT = (b, u, f) => P([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
  const fa = SIM.flap(t), hb = TT(J.pelvis, -60, -56), hcs = Math.cos(fa + 1.75), hsn = Math.sin(fa + 1.75), kk = k;
  shaded(path([TT(J.pelvis, -40, -50), TT(J.pelvis, -96, -58), [hb[0] + (hcs * 70 - hsn * 14) * kk, hb[1] + (hsn * 70 + hcs * 14) * kk], [hb[0] + (hcs * 64 + hsn * 10) * kk, hb[1] + (hsn * 64 - hcs * 10) * kk]]), C.coralD, C.coralD, d);
  shaded(cap(P(J.neckBase), P(J.neckTop), 12 * k, 11 * k), C.creamD, C.creamD, 0);
  shaded(path([TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)]), C.coral, C.coralD, d);
  leg('n', C.blue, C.blueD);
  shaded(path([[16, -44], [34, -20], [44, -3], [37, 8], [39, 16], [34, 23], [32, 35], [12, 46], [-10, 48], [-36, 38], [-50, 8], [-46, -26], [-22, -48]].map(HR)), C.cream, C.creamD, d);
  shaded(path([[22, -44], [0, -60], [-36, -54], [-58, -22], [-60, 12], [-46, 40], [-22, 44], [-10, 18], [-2, -14], [8, -32]].map(HR)), C.hair, '#0f1132', d * .6);
  const e = HR([24, -8]); g.fillStyle = C.night; g.fill(circ(e[0], e[1], 4.2 * k));
  const a = arm('n', C.coral, C.coralD);
  const wq = P([a.el[0] + (a.wr[0] - a.el[0]) * .8, a.el[1] + (a.wr[1] - a.el[1]) * .8]);
  shaded(circ(wq[0], wq[1], 13 * k), C.sun, C.sunD, d * .4); g.fillStyle = C.cream; g.fill(circ(wq[0], wq[1], 8.5 * k));
  return { watch: wq, J };
}

// ═════════ the set at street scale (metres)
const STARS = (() => { const R = mulberry(7), o = []; for (let i = 0; i < 260; i++) o.push([R() * 120 - 20, R() * 40 + 3, R(), R() < .1]); return o; })();
function stars(f = .18) {
  for (const [x, y, c, big] of STARS) { const p = S(x, y, f); if (p[0] < -10 || p[0] > W + 10 || p[1] < -10 || p[1] > H) continue;
    g.fillStyle = c < .5 ? C.mist : c < .85 ? C.cream : C.sun; g.fill(circ(p[0], p[1], big ? 3.4 : 2)); }
}
const SHOPS = (() => { const n = ['CAFE', 'NOODLES', 'BOOKS', 'BAKERY', 'LAUNDRY', 'HOTEL', 'RECORDS', 'FLOWERS', 'BAR'], o = []; let x = -3.2; for (let i = 0; i < 12; i++) { o.push({ x, w: 4.4, h: 4.2 + (i % 3) * .5, name: n[i % n.length], col: i % 2 ? [C.mint, C.mintD] : [C.blue, C.blueD] }); x += 4.4; } return o; })();
const ZF = 1.8;                                                     // the shop fronts sit a little behind her plane (parallax .9)
function street(t) {
  const f = .9;
  // far blocks (parallax .5)
  for (let i = -4; i < 30; i++) { const x = i * 6, h = 9 + (i * 7 % 5) * 2.2, a = S(x, h, .5), b = S(x + 5, 0, .5); if (b[0] < -50 || a[0] > W + 50) continue; g.fillStyle = C.n2; g.fill(rrect(a[0], a[1], b[0] - a[0], b[1] - a[1], 6)); }
  for (const s of SHOPS) {
    const a = S(s.x, s.h, f), b = S(s.x + s.w, 0, f); if (b[0] < -100 || a[0] > W + 100) continue;
    shaded(rrect(a[0] + 4, a[1], b[0] - a[0] - 8, b[1] - a[1] + 40, 10), C.n3, C.n2, 8);
    // windows: cream, a lamp's sun dot inside each (look here), a door in the shade colour
    const w0 = S(s.x + .35, 2.4, f), w1 = S(s.x + s.w - 1.5, .5, f);
    shaded(rrect(w0[0], w0[1], w1[0] - w0[0], w1[1] - w0[1], 8), C.cream, C.creamD, 6);
    const d0 = S(s.x + s.w - 1.25, 2.3, f), d1 = S(s.x + s.w - .35, 0, f); shaded(rrect(d0[0], d0[1], d1[0] - d0[0], d1[1] - d0[1], 6), C.n2, C.night, 4);
    // the sign: a coloured board with a cream word
    const s0 = S(s.x + .35, 3.4, f), s1 = S(s.x + s.w - .35, 2.7, f); shaded(rrect(s0[0], s0[1], s1[0] - s0[0], s1[1] - s0[1], 8), s.col[0], s.col[1], 6);
    g.save(); g.font = `700 ${Math.max(10, (s1[1] - s0[1]) * .62)}px Jost`; g.fillStyle = C.cream; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '2px';
    g.fillText(s.name, (s0[0] + s1[0]) / 2, (s0[1] + s1[1]) / 2 + 2); g.restore();
  }
  // the pavement
  const p0 = S(-40, 0); g.fillStyle = C.n2; g.fillRect(0, p0[1], W, H - p0[1]); g.fillStyle = C.n3; g.fillRect(0, p0[1], W, Math.max(2, px(.04)));
  // lamp posts in front, each lamp glowing as two hard rings
  for (let i = -2; i < 14; i++) { const x = i * 6.6 + 2.2, b = S(x, 0), tp = S(x, 4.2); if (b[0] < -100 || b[0] > W + 100) continue;
    halo(tp[0], tp[1], px(.22)); g.fillStyle = C.mist; g.fillRect(b[0] - px(.05), tp[1], px(.1), b[1] - tp[1]); shaded(circ(tp[0], tp[1], px(.16)), C.cream, C.creamD, 3); }
}
function puddle(t) {
  const c = S(0, 0), rx = px(.72), ry = px(.13), age = t - EV.splash;
  shaded(ell(c[0], c[1] + px(.02), rx, ry), C.blue, C.blueD, 0);
  // reflections of the café window: cream strips in the water
  g.save(); g.clip(ell(c[0], c[1] + px(.02), rx, ry)); const w0 = S(-2.85, 0); g.fillStyle = C.creamD; g.fillRect(w0[0], c[1] - ry, px(2.55), ry * .8); g.restore();
  // rings: thin cream ellipses, rain and the splash
  g.strokeStyle = C.cream; g.lineCap = 'round';
  for (let i = 0; i < 4; i++) { const R = mulberry(20 + i), per = .8 + R() * .3, a = (t + R() * per) % per, x = c[0] + (R() - .5) * rx * 1.4; g.lineWidth = 2.5 * (1 - a / per); g.beginPath(); g.ellipse(x, c[1] + px(.02), px(.04 + a * .2), px(.01 + a * .04), 0, 0, TAU); g.stroke(); }
  if (age > 0) for (let r = 0; r < 3; r++) { const a = age - r * .1; if (a > 0 && a < 1) { g.lineWidth = 4 * (1 - a); g.beginPath(); g.ellipse(c[0], c[1] + px(.02), px(.1 + a * .9), px(.02 + a * .17), 0, 0, TAU); g.stroke(); } }
  // the splash: flat drops on arcs, each a blue disc with a cream highlight
  if (age > 0 && age < .75) { const R = mulberry(5); for (let i = 0; i < 12; i++) { const vx = (R() - .5) * 2.4, vy = 1.2 + R() * 1.6, x = vx * age, y = vy * age - 4.9 * age * age; if (y < 0) continue; const p = S(x, y), r = px(.025 + R() * .02); shaded(circ(p[0], p[1], r), C.blue, C.blueD, r * .3); g.fillStyle = C.cream; g.fill(circ(p[0] - r * .3, p[1] - r * .3, r * .3)); } }
}
function rain(t, n = 70) {
  const R = mulberry(31); g.strokeStyle = C.mist; g.lineCap = 'round'; g.lineWidth = 2.5;
  for (let i = 0; i < n; i++) { const x = R() * W, L = 18 + R() * 26, y = ((R() * H + t * 900) % (H + 60)) - 30; g.beginPath(); g.moveTo(x, y); g.lineTo(x - L * .15, y + L); g.stroke(); }
}

// ═════════ labels and the corner instrument
function label(tag, line_, x, y, p, big = false) {
  if (p <= 0) return;
  { g.save(); g.font = big ? '700 120px Jost' : '600 34px Jost'; const lw = g.measureText(line_).width; g.restore(); g.fillStyle = C.night; g.fill(rrect(x - 26, y - 44, (lw + 60) * clamp(p * 1.4), (big ? 196 : 104), 18)); }
  g.save(); g.font = '600 18px Jost'; g.letterSpacing = '3px'; g.fillStyle = C.mist; const tw = g.measureText(tag).width;
  g.beginPath(); g.rect(x, y - 24, (tw + 6) * clamp(p * 1.6), 32); g.clip(); g.fillText(tag, x, y); g.restore();
  g.save(); g.font = big ? '700 120px Jost' : '600 34px Jost'; g.letterSpacing = big ? '-2px' : '0px'; const lh = big ? 120 : 34, yy = y + (big ? 118 : 46);
  const e = back(clamp((p - .2) / .8), 1.6); g.beginPath(); g.rect(x - 4, yy - lh, 1400, lh * 1.22); g.clip(); g.fillStyle = C.cream; g.fillText(line_, x, yy + (1 - e) * lh * 1.1); g.restore();
}
const STOPS = [['drop', .02], ['puddle', 2.2], ['street', 9], ['watch', .06], ['station', 60]];
function instrument(fov, cur) {
  const x0 = W - 640, y0 = H - 120;
  g.fillStyle = C.night; g.fill(rrect(x0 - 30, y0 - 92, 650, 150, 18));
  g.font = '600 16px Jost'; g.letterSpacing = '3px'; g.fillStyle = C.mist; g.fillText('FIELD OF VIEW', x0, y0 - 56);
  g.font = '700 46px Jost'; g.letterSpacing = '0px'; g.fillStyle = C.cream; g.fillText(fov < 1 ? `${(fov * 100).toFixed(fov < .1 ? 1 : 0)} cm` : `${fov.toFixed(fov < 10 ? 1 : 0)} m`, x0, y0 - 6);
  // the log ribbon: 1 cm … 100 m, the stops as dots, the current field of view a sun dot
  const L = v => x0 + 250 + (Math.log10(v) + 2) / 4 * 340;
  g.fillStyle = C.n3; g.fillRect(L(.01), y0 - 22, 340, 6);
  STOPS.forEach(([n, v], i) => { const on = i <= cur; g.fillStyle = on ? C.cream : C.mist; g.fill(circ(L(v), y0 - 19, on ? 7 : 5)); g.font = '600 13px Jost'; g.letterSpacing = '2px'; g.fillStyle = C.mist; g.textAlign = 'center'; g.fillText(n.toUpperCase(), L(v), y0 + (i % 2 ? 26 : 8)); g.textAlign = 'left'; });
  g.fillStyle = C.sun; g.fill(circ(L(clamp(fov, .01, 100)), y0 - 19, 9));
}
// the next-stop ring: a sun circle, a dashed outer ring, a leader and a two-line label; locks with one overshoot
function nextStop(x, y, r, p, tag, line_) {
  if (p <= 0) return;
  const s = back(clamp(p), 2.2);
  g.strokeStyle = C.sun; g.lineWidth = 4; g.beginPath(); g.arc(x, y, r * s, 0, TAU); g.stroke();
  g.setLineDash([10, 10]); g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, r * s * 1.45, 0, TAU); g.stroke(); g.setLineDash([]);
  const lx = x + r * 1.45 * .7, ly = y - r * 1.45 * .7; g.lineWidth = 2.5; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + 60, ly - 60); g.lineTo(lx + 120, ly - 60); g.stroke();
  label(tag, line_, lx + 130, ly - 66, clamp((p - .3) / .7));
}

// ═════════ S1 (0–2.5): pull back from one raindrop to the puddle; her legs cross; the splash
function shotS1(t) {
  const zp = eio(seg(t, 0, .8)), fov = Math.exp(lerp(Math.log(.02), Math.log(2.2), zp));
  const D0 = [.18, .09], CF = { x: .02 * t, y: .45, z: W / 2.2 }, offF = [(D0[0] - CF.x) * CF.z, (D0[1] - CF.y) * CF.z], k = ss(zp), z = W / fov;
  CAM = { x: D0[0] - offF[0] * k / z, y: D0[1] - offF[1] * k / z, z };
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = C.night; g.fillRect(0, 0, W, H);
  street(t); puddle(t);
  // the opening drop on the water: a big blue drop with a cream highlight, landing at 0.1 s
  const dp = S(.18, .09 - Math.max(0, .1 - t) * 2), dr = px(.0045);
  if (t < 1.2) { const dP = new Path2D(); dP.moveTo(dp[0], dp[1] - 1.7 * dr); dP.quadraticCurveTo(dp[0] + .55 * dr, dp[1] - .75 * dr, dp[0] + .9 * dr, dp[1] + .1 * dr); dP.arc(dp[0], dp[1] + .1 * dr, .9 * dr, 0, Math.PI); dP.quadraticCurveTo(dp[0] - .55 * dr, dp[1] - .75 * dr, dp[0], dp[1] - 1.7 * dr); shaded(dP, C.blue, C.blueD, dr * .15); g.fillStyle = C.cream; g.fill(circ(dp[0] - dr * .3, dp[1] - dr * .1, dr * .22)); }
  if (t > .3 && t < 1.95) aki(t);
  rain(t, 50);
  label('AT GROUND LEVEL', 'a puddle, 1.4 m across', 96, 150, seg(t, .85, 1.25) * (1 - seg(t, 2.2, 2.45)));
  instrument(fov, zp < .5 ? 0 : 1);
}

// ═════════ S2 (2.5–7.5): track with her while pulling out; the next-stop ring locks on her watch; dive through it
const xA = t => xw(X(t));
function camS2(t) { const fov = Math.exp(lerp(Math.log(4.5), Math.log(9), eio(seg(t, 2.5, 7.0)))); return { x: xA(t) + fov * .08, y: fov * .26 + .2, z: W / fov }; }
function shotS2(t, inner = false) {
  CAM = camS2(t);
  // the dive (7.15–7.5): the camera dollies in log space into the ring around her watch
  const dv = seg(t, 7.15, 7.5);
  let A;
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = C.night; g.fillRect(0, 0, W, H);
  if (dv > 0) { const w = watchWorld(t); const z1 = W / .06; CAM = { x: lerp(CAM.x, w[0], eio(dv)), y: lerp(CAM.y, w[1], eio(dv)), z: Math.exp(lerp(Math.log(CAM.z), Math.log(z1), Math.pow(dv, 1.6))) }; }
  stars(); street(t);
  A = aki(t);
  rain(t, 60);
  const fov = W / CAM.z;
  const lp = seg(t, 6.2, 6.55);
  if (lp > 0) nextStop(A.watch[0], A.watch[1], Math.max(34, px(.06)), lp, 'NEXT STOP', 'her watch');
  else label('TRACKING', 'four metres a second', 96, 150, seg(t, 2.75, 3.2) * (1 - seg(t, 5.6, 5.9)));
  instrument(fov, 2);
  // inside the ring, the watch at true size grows from a point
  if (dv > .35) { const rr = Math.max(34, px(.06)) * lerp(1, 40, Math.pow((dv - .35) / .65, 2)); g.save(); g.beginPath(); g.arc(A.watch[0], A.watch[1], rr, 0, TAU); g.clip(); g.translate(A.watch[0] - W / 2, A.watch[1] - H / 2); watchScene(t, true); g.restore();
    g.strokeStyle = C.sun; g.lineWidth = 4; g.beginPath(); g.arc(A.watch[0], A.watch[1], rr, 0, TAU); g.stroke(); }
}
function watchWorld(t) { const J = solveProfile(poseAt(t)), a = J.arm.n; return [xw(a.el[0] + (a.wr[0] - a.el[0]) * .8), -(a.el[1] + (a.wr[1] - a.el[1]) * .8) * M_]; }

// ═════════ S3 (7.5–9.375): the watch at true size (field of view 6 cm); the lens fires the sight line toward the station
const WR = 470, AH = (11 + 58 / 60) / 12 * TAU, AM = 58 / 60 * TAU;
function dial(x, y, r, sec, faceBase = C.cream) {
  halo(x, y, r * 1.02);
  shaded(circ(x, y, r * 1.08), C.sun, C.sunD, r * .04);
  shaded(circ(x, y, r * .9), faceBase, C.creamD, r * .03);
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, big = i % 5 === 0; g.fillStyle = C.night; g.fill(circ(x + Math.sin(a) * r * .8, y - Math.cos(a) * r * .8, big ? r * .03 : r * .012)); }
  const hand = (a, L, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * L, y - Math.cos(a) * L); g.stroke(); };
  hand(AH, r * .45, r * .06, C.night); hand(AM, r * .66, r * .04, C.night);
  if (sec != null) hand(sec / 60 * TAU, r * .72, r * .012, C.coral);
  g.fillStyle = C.coral; g.fill(circ(x, y, r * .035));
}
function watchScene(t, inner = false) {
  g.fillStyle = C.night; g.fillRect(-W, -H, 3 * W, 3 * H);
  // the wrist at true size: the coral sleeve, the cream hand, the strap
  shaded(rrect(-200, 600, 1400, 520, 220), C.coral, C.coralD, 14);
  shaded(rrect(1480, 560, 700, 500, 200), C.cream, C.creamD, 12);
  shaded(rrect(W / 2 - 170, -120, 340, 1320, 60), C.n3, C.n2, 10);
  const sec = 47 + (t >= 8.4 ? 1 : 0) + (t >= 9.4 ? 1 : 0);
  dial(W / 2, H / 2, WR, sec);
  // rain on the crystal: flat blue drops with a cream spot
  for (const [dx, dy, r] of [[-150, 120, 26], [120, -160, 18], [190, 90, 15], [-60, -110, 12]]) { shaded(circ(W / 2 + dx, H / 2 + dy, r), C.blue, C.blueD, r * .25); g.fillStyle = C.cream; g.fill(circ(W / 2 + dx - r * .3, H / 2 + dy - r * .3, r * .28)); }
  if (inner) return;
  label('TRUE SIZE', '23:58', 96, 150, seg(t, 7.62, 8.1), true);
  // the sight line: dots pop out of the watch's lens one by one (0 → 1.3 → 1) and stream toward the next stop
  const sl = seg(t, 8.85, 9.375);
  if (sl > 0) { const x0 = W / 2 + WR * .7, y0 = H / 2 - WR * .7, x1 = W + 80, y1 = -60, n = 9;
    for (let i = 0; i < n; i++) { const pi = clamp(sl * 1.6 - i * .07); if (pi <= 0) continue; const s = pi < .5 ? pi * 2.6 : lerp(1.3, 1, (pi - .5) * 2); const u = (i + .5) / n + (sl - .6) * .1;
      g.fillStyle = C.sun; g.fill(circ(lerp(x0, x1, u), lerp(y0, y1, u), 9 * s)); } }
  instrument(.06, 3);
}
function shotS3(t) { g.setTransform(1, 0, 0, 1, 0, 0); watchScene(t); rain(t, 30); }

// ═════════ S4 (9.375–10): shape match: the dial becomes the station clock, the camera pulls back to the tower; halo locks on the chime
function shotS4(t) {
  const TX = 0, TY = 40, TR = .5;                                    // the clock: radius 0.5 m, centred 40 m up the tower
  const pb = eio(seg(t, 9.375, 9.85)), fov = Math.exp(lerp(Math.log(TR * W / WR), Math.log(30), pb)), dn = eio(seg(t, 9.75, 10.6)) * 4;
  CAM = { x: TX + fov * .12 * pb, y: TY - fov * .1 * pb - dn, z: W / fov };
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = C.night; g.fillRect(0, 0, W, H);
  stars(.6);
  // the city: blocks at parallax, the tower to true scale
  for (let i = -8; i < 9; i++) { const x = i * 8 - 4, h = 12 + (i * 5 % 4) * 5, a = S(x, h, .85), b = S(x + 6, 0, .85); if (Math.abs(i) < 1) continue; g.fillStyle = C.n2; g.fill(rrect(a[0], a[1], b[0] - a[0], b[1] - a[1], 8)); for (let r = 0; r < 4; r++) { const wy = S(0, h - 2 - r * 2.6, .85)[1]; g.fillStyle = (i + r) % 3 ? C.n3 : C.cream; g.fillRect(a[0] + (b[0] - a[0]) * .3, wy, (b[0] - a[0]) * .14, px(1.2, .85)); g.fillRect(a[0] + (b[0] - a[0]) * .6, wy, (b[0] - a[0]) * .14, px(1.2, .85)); } }
  const t0 = S(TX - 3, TY + 4), t1 = S(TX + 3, 0); shaded(rrect(t0[0], t0[1], t1[0] - t0[0], t1[1] - t0[1], px(.6)), C.n3, C.n2, px(.25));
  const roof = [S(TX - 3.4, TY + 4), S(TX, TY + 9), S(TX + 3.4, TY + 4)]; shaded(path(roof), C.mint, C.mintD, px(.2));
  const c = S(TX, TY), ch = t - EV.chime;
  const lock = ch > 0 ? back(clamp(ch / .18), 2.4) : 0;
  const rS = Math.max(px(TR), 34);
  if (lock > 0) { g.fillStyle = C.n2; g.fill(circ(c[0], c[1], rS * (1.05 + 1.6 * lock))); g.fillStyle = C.n3; g.fill(circ(c[0], c[1], rS * (1.05 + .8 * lock))); }
  // the dial keeps the watch's place and size at the cut
  const r = Math.max(px(TR), 4);
  dial(c[0], c[1], r, null);
  if (ch > 0) { g.strokeStyle = C.sun; g.lineWidth = 4; for (let k = 0; k < 2; k++) { const a = ch - k * .1; if (a > 0) { g.beginPath(); g.arc(c[0], c[1], rS * (1.4 + a * 6), 0, TAU); g.stroke(); } } }
  rain(t, 40);
  label('NEXT STOP', 'the station clock', 96, 150, seg(t, 9.5, 9.9));
  instrument(fov, 4);
}

window.render = t => {
  if (t < 2.5) shotS1(t);
  else if (t < 7.5) shotS2(t);
  else if (t < 9.375) shotS3(t);
  else shotS4(t);
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0);
window.READY = true;
