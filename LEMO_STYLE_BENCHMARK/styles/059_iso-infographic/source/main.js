// 059 · Isometric Infographic — the first 10 s of "Last Train Home" as a living system diagram (lemo-opuscar styles/iso-infographic):
// a true-isometric diorama of flat three-tone blocks on a floating board, ink only for the infographic furniture (route line, label
// pins, an inset, an Isotype count). A narrative adaptation: AKI is a minimal two-tone figure (round head, tapered body, no face)
// whose limbs follow the shared rig on the street's own vertical plane, so the projection is never broken.
// S1: close on the puddle, a label pin grows before her foot lands; the splash pops drops with a back-ease, and every footfall adds an
// icon to the STEPS count. S2: the camera follows her along the street, a dashed route line drawn ahead of her to the station; the
// shops' names on pins as she reaches them; at the watch raise a leader grows from her wrist. S3: the watch as a faceted solid, and the
// time left drawn not stated: 73 clock icons, one per second to midnight, one going out on the tick. S4: a fast log pull-out to the
// whole board, the strata and the tunnel under the street with the last train in the cut; a tracking ring on the clock at the chime.
// Engine: engine/engine.js copied unchanged. Page contract: window.render(t), DUR, READY, RIGQA.
import { Iso, PAL, tri, pin, inset, ring, cutLine, hatch, haloText, iconGrid, C30, S30, TAU, back, eo } from './engine/engine.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, mulberry } from './shared/lib/util.js';

window.DUR = DUR;
const g = document.getElementById('c').getContext('2d');
await Promise.all(['600 30px Jost', '400 44px Jost', '700 60px Jost'].map(f => document.fonts.load(f)));
const W = 1920, H = 1080, iso = new Iso(g, W, H);
const HUE = { aki: ['#E4664F', '#C9462F', '#97321F'], water: PAL.blue, stone: PAL.stone, shop: ['#E7D8BD', '#CDBB98', '#A8966F'], roof: ['#7E6F86', '#5F5168', '#463A4E'],
  lamp: PAL.mustard, train: ['#76B3A8', '#4E918A', '#386E69'], soil: PAL.soil, tower: ['#D9CBB0', '#B9A887', '#8F7F62'] };

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
const M_ = .0028, xw = rx => (rx - SPL.x) * M_;
// figures step at 12 drawings a second (phased so one lands on the splash); camera and lines on ones
const PH = EV.splash - Math.floor(EV.splash * 12) / 12, d12 = t => Math.floor((t - PH) * 12 + 1e-6) / 12 + PH;

// ═════════ AKI on the street's plane (y = 0): her rig points become world points (x along the street, z up)
function aki(t) {
  const J = solveProfile(poseAt(t)), Wp = p => [xw(p[0]), 0, -p[1] * M_];
  const P = p => iso.P(...Wp(p)), k = iso.cam.k, depth = xw(J.pelvis[0]) + .9;
  iso.add(depth, () => {
    const cap = (a, b, w, col) => { g.strokeStyle = iso.col(col); g.lineWidth = w * k; g.lineCap = 'round'; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); };
    const leg = (kk, col) => { const l = J.leg[kk]; cap(P(l.hip), P(l.knee), .1, col); cap(P(l.knee), P(l.ankle), .085, col); const c = Math.cos(l.pitch), s = Math.sin(l.pitch); cap(P(l.ankle), P([l.ankle[0] + 60 * c, l.ankle[1] + 60 * s]), .07, '#3A2E2C'); };
    const arm = (kk, col) => { const a = J.arm[kk]; cap(P(a.sh), P(a.el), .07, col); cap(P(a.el), P(a.wr), .065, col); const h = P([a.wr[0] + (a.wr[0] - a.el[0]) * .2, a.wr[1] + (a.wr[1] - a.el[1]) * .2]); g.fillStyle = iso.col('#C98B62'); g.beginPath(); g.arc(...h, .045 * k, 0, TAU); g.fill(); };
    arm('f', HUE.aki[2]); leg('f', '#3E3230');
    // the jacket: a tapered body, mid tone with the dark tone on its far side
    const TT = (b, u, f) => P([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
    const body = [TT(J.neckBase, 4, -24), TT(J.pelvis, -96, -56), TT(J.pelvis, -100, 48), TT(J.neckBase, -4, 26)];
    g.fillStyle = iso.col(HUE.aki[1]); g.beginPath(); body.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.fill();
    const half = [TT(J.neckBase, 4, -24), TT(J.pelvis, -96, -56), TT(J.pelvis, -98, -4), TT(J.neckBase, 0, 0)];
    g.fillStyle = iso.col(HUE.aki[2]); g.beginPath(); half.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.fill();
    leg('n', '#4A3A36');
    // head: a round head, skin with its shade, a dark hair cap and the ponytail
    const hc = P(J.headC), hr = .115 * k;
    g.fillStyle = iso.col('#C98B62'); g.beginPath(); g.arc(...hc, hr, 0, TAU); g.fill();
    g.fillStyle = iso.col('#2E2522'); g.beginPath(); g.arc(hc[0], hc[1], hr * 1.04, Math.PI * .6, Math.PI * 1.85); g.fill();
    const pt = P([J.headC[0] - 70, J.headC[1] + 10]); cap([hc[0] - hr * .8, hc[1] - hr * .1], pt, .06, '#2E2522');
    arm('n', HUE.aki[0]);
    const a = J.arm.n, wq = P([a.el[0] + (a.wr[0] - a.el[0]) * .8, a.el[1] + (a.wr[1] - a.el[1]) * .8]); g.fillStyle = iso.col(PAL.mustard[0]); g.beginPath(); g.arc(...wq, .035 * k, 0, TAU); g.fill();
  });
  return J;
}

// ═════════ the board: the street on a floating plinth (metres)
const SH = [['CAFE', 3.8], ['NOODLES', 3.2], ['BOOKS', 4.6], ['BAKERY', 3.4], ['LAUNDRY', 3.8], ['HOTEL', 6.4], ['RECORDS', 3.6], ['FLOWERS', 3.2], ['BAR', 4.2]];
const X0B = -6, X1B = 42, Y0B = -4.4, Y1B = 5;
function board(t, detail = 1) {
  // the plinth and its strata at the front faces (soil, a pipe, the tunnel with the last train), seen in the cut
  iso.box(X0B, Y0B, -3, X1B - X0B, Y1B - Y0B, 2.6, HUE.soil, { layer: 0, cull: false });
  iso.box(X0B, Y0B, -.4, X1B - X0B, Y1B - Y0B, .4, HUE.stone, { layer: 0, cull: false });
  // the road and the pavement, the puddle, the kerb line
  iso.flat([[X0B, 1.6], [X1B, 1.6], [X1B, Y1B], [X0B, Y1B]], 0, iso.col('#9F9AA6'), { layer: .5 });
  iso.flat(Array.from({ length: 40 }, (_, i) => { const a = i / 40 * TAU, r = 1 + .12 * Math.sin(a * 3 + 1) + .07 * Math.sin(a * 5); return [Math.cos(a) * .75 * r, Math.sin(a) * .55 * r]; }), .002, iso.col(HUE.water[0]), { layer: .6 });
  for (let i = 0; i < 12; i++) iso.flat([[X0B + i * 4, 3.2], [X0B + i * 4 + 2, 3.2], [X0B + i * 4 + 2, 3.4], [X0B + i * 4, 3.4]], .002, iso.col('#F2E6D0'), { layer: .6 });
  // shops: three-tone blocks with a roof slab, a window strip and the name standing on the front (facing +y)
  let x = X0B + .5;
  SH.forEach(([name, h], i) => {
    const w = 4.6;
    iso.box(x, Y0B, 0, w - .2, 2.6, h, HUE.shop);
    iso.box(x - .05, Y0B - .05, h, w - .1, 2.7, .25, HUE.roof);
    iso.box(x + .4, Y0B + 2.6, .5, w - 1.6, .06, 1.6, ['#FBE6A8', '#F0CF72', '#C9A24C'], { bias: .1 });
    iso.box(x + w - 1.1, Y0B + 2.6, 0, .7, .06, 2.1, HUE.roof, { bias: .1 });
    if (detail) iso.text3(name, x + .35, Y0B + 2.68, 2.55, { plane: 'xz', size: .55, tri: ['#2E2522', '#2E2522', '#2E2522'], bias: .2 });
    x += w;
  });
  // lamps along the kerb (a post and a mustard globe)
  for (let lx = -2; lx < 40; lx += 6) { iso.cyl(lx, 1.4, 0, .07, 3.6, HUE.roof); iso.sphere(lx, 1.4, 3.75, .22, HUE.lamp); }
  // the station tower at the end of the street, the clock on its front
  iso.box(36, -4.2, 0, 3.4, 3.4, 13, HUE.tower); iso.box(35.8, -4.4, 13, 3.8, 3.8, .4, HUE.roof);

  iso.bill(37.7, -.79, 10.5, (gg, I, k) => { gg.fillStyle = I.col('#FBF4E6'); gg.beginPath(); gg.ellipse(0, 0, 1.05, 1.2, -.52, 0, TAU); gg.fill(); gg.strokeStyle = I.col('#2E2522'); gg.lineWidth = .12; gg.stroke();
    gg.lineWidth = .1; gg.lineCap = 'round'; gg.beginPath(); gg.moveTo(0, 0); gg.lineTo(-.06, -.62); gg.stroke(); gg.beginPath(); gg.moveTo(0, 0); gg.lineTo(-.15, -.82); gg.stroke(); }, { bias: 2, r: 2 });
}
// the front face of the plinth: hatched section with a pipe and the tunnel holding the last train (screen-space furniture)
function section(t) {
  const P = (x, z) => iso.P(x, Y1B, z), A = [P(X0B, 0), P(X1B, 0), P(X1B, -3), P(X0B, -3)];
  hatch(g, A, { fill: HUE.soil[1], color: 'rgba(46,37,34,.45)', sp: 9 });
  const tun = [P(8, -.9), P(34, -.9), P(34, -2.6), P(8, -2.6)];
  g.save(); g.beginPath(); tun.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.fillStyle = '#3B3240'; g.fill(); g.restore();
  // the train: a box in the tunnel, lit windows
  const tr = [P(14, -1.1), P(30, -1.1), P(30, -2.45), P(14, -2.45)];
  g.save(); g.beginPath(); tr.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.fillStyle = HUE.train[1]; g.fill();
  for (let i = 0; i < 8; i++) { const a = P(14.6 + i * 1.9, -1.35), b = P(15.6 + i * 1.9, -1.85); g.fillStyle = '#FBE6A8'; g.beginPath(); g.moveTo(...a); g.lineTo(b[0], a[1] + (b[0] - a[0]) * .577); g.lineTo(b[0], b[1] + (b[0] - a[0]) * .577); g.lineTo(a[0], b[1]); g.closePath(); g.fill(); }
  g.restore();
  const pp = [P(X0B, -.55), P(X1B, -.55)]; g.save(); g.strokeStyle = '#6D8FB0'; g.lineWidth = Math.max(2, .18 * iso.cam.k); g.beginPath(); g.moveTo(...pp[0]); g.lineTo(...pp[1]); g.stroke(); g.restore();
  return P(22, -1.1);
}
function rain(t, n, near = 1) {
  const R = mulberry(5); g.save(); g.strokeStyle = 'rgba(90,155,203,.55)'; g.lineWidth = 1.6 * near; g.lineCap = 'round';
  for (let i = 0; i < n; i++) { const x = R() * W, L = (10 + R() * 18) * near, y = ((R() * (H + 60) + t * 700 * near) % (H + 60)) - 30; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + L); g.stroke(); }
  g.restore();
}
function ground() {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = PAL.bg; g.fillRect(0, 0, W, H);
  // the faint isometric dot lattice on the pale ground
  g.fillStyle = 'rgba(46,37,34,.12)'; const k = Math.max(14, iso.cam.k * 1.2);
  for (let y = -k; y < H + k; y += k * S30) for (let x = ((y / (k * S30)) % 2) * k * C30 * .5 - k; x < W + k; x += k * C30) { g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); }
}
// the Isotype count of steps: one footprint icon per footfall, popping with a back-ease
function stepsCount(t) {
  const n = RUN.contacts.filter(c => c.t0 <= t).length, x0 = 96, y0 = 980;
  haloText(g, 'STEPS', x0, y0 - 34, { font: '600 24px Jost', track: 3.5 });
  haloText(g, String(n), x0 + 120, y0 - 30, { font: '400 44px Jost' });
  RUN.contacts.forEach((c, i) => { if (i > 28) return; const a = t - c.t0; if (a < 0) return; const s = back(clamp(a / .2), 2.2), x = x0 + i * 26, y = y0 + (i % 2 ? 10 : 0);
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = PAL.ink; g.beginPath(); g.ellipse(0, 0, 6, 10, .2, 0, TAU); g.fill(); g.beginPath(); g.arc(1, -14, 4.5, 0, TAU); g.fill(); g.restore(); });
}

// ═════════ shots
function shotS1(t) {
  iso.cam = { x: .1, y: .1, z: .45, k: 520 }; ground();
  board(t, 0); aki(d12(t)); iso.flush();
  // the splash: drops pop and arc; rings on the water as ink ellipses
  const a = t - EV.splash;
  if (a > 0 && a < .8) { const R = mulberry(7); for (let i = 0; i < 12; i++) { const vx = (R() - .5) * 1.6, vy = (R() - .5) * 1.2, vz = 1.4 + R() * 1.6, z = vz * a - 4.9 * a * a; if (z < 0) continue;
    const p = iso.P(vx * a, vy * a, z), s = back(clamp(a / .1), 2.4) * (8 + R() * 8); g.fillStyle = HUE.water[0]; g.beginPath(); g.arc(p[0], p[1], s, 0, TAU); g.fill(); g.fillStyle = '#FBF4E6'; g.beginPath(); g.arc(p[0] - s * .3, p[1] - s * .3, s * .3, 0, TAU); g.fill(); } }
  if (a > 0) for (let r = 0; r < 3; r++) { const aa = a - r * .12; if (aa > 0 && aa < 1.3) { const rr = (.1 + aa * .7) * iso.cam.k, c = iso.P(0, 0, 0); g.save(); g.strokeStyle = `rgba(46,37,34,${.8 * (1 - aa / 1.3)})`; g.lineWidth = 2; g.beginPath(); g.ellipse(c[0], c[1], rr * C30 * 1.414, rr * S30 * 1.414, 0, 0, TAU); g.stroke(); g.restore(); } }
  // the label pin grows before her foot lands
  pin(iso, -.6, .2, 0, { a: seg(t, .1, .9), title: 'PUDDLE', num: '1.4', unit: 'M ACROSS', up: 300, dir: -1, len: 70 });
  rain(t, 70, 1.4);
  stepsCount(t);
}
const xA = t => xw(X(t));
function shotS2(t) {
  iso.cam = { x: xA(t) + 1.3, y: .3, z: 1.1, k: 165 }; ground();
  board(t); const J = aki(d12(t)); iso.flush();
  // the route line, drawn ahead of her to the station
  const ahead = clamp((t - 2.6) / 1.2), x0 = xA(t) + .6, x1 = lerp(x0, 37, ahead);
  cutLine(g, [iso.P(x0, .4, 0), iso.P(x1, .4, 0)], 1, { color: '#2E2522', lw: 2.5 });
  if (ahead > .2) { const s = iso.P(37, .4, 0); g.save(); g.strokeStyle = PAL.ink; g.lineWidth = 2.5; g.beginPath(); g.arc(s[0], s[1], 14, 0, TAU); g.stroke(); g.restore(); }
  // the shops' names on pins as she reaches each one
  let x = X0B + .5; SH.forEach(([name, h], i) => { const cx = x + 2.3, ta = 2.5 + (cx - 2 - xA(2.5)) / 4.06; x += 4.6;
    const a = seg(t, ta - .3, ta + .5) * (1 - seg(t, ta + 1.4, ta + 1.7)); if (a > 0) pin(iso, cx, -1.8, h + .3, { a, title: name, up: 90, dir: 1, len: 40 }); });
  // the watch raise: a leader grows from her wrist (the inset opens in the next shot)
  if (t > 6.3) { const a = J.arm.n, wq = iso.P(xw(a.el[0] + (a.wr[0] - a.el[0]) * .8), 0, -(a.el[1] + (a.wr[1] - a.el[1]) * .8) * M_);
    inset(iso, wq[0], wq[1], wq[0] + 260, wq[1] - 300, 150, seg(t, 6.35, 7.2), (gg, cx, cy, r) => watchFace(gg, cx, cy, r * .78, t)); }
  rain(t, 80, 1);
  stepsCount(t);
}
// S3: the watch as a faceted solid (an isometric cylinder), and the seconds to midnight as Isotype icons
const AH = (11 + 58 / 60) / 12 * TAU, AM = 58 / 60 * TAU;
function watchFace(gg, cx, cy, r, t) {
  gg.save(); gg.fillStyle = '#FBF4E6'; gg.beginPath(); gg.arc(cx, cy, r, 0, TAU); gg.fill(); gg.strokeStyle = PAL.ink; gg.lineWidth = Math.max(2, r * .04); gg.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; gg.lineWidth = i % 3 ? 2 : 4; gg.beginPath(); gg.moveTo(cx + Math.sin(a) * r * .78, cy - Math.cos(a) * r * .78); gg.lineTo(cx + Math.sin(a) * r * .92, cy - Math.cos(a) * r * .92); gg.stroke(); }
  const sec = 47 + (t >= 8.4 ? 1 : 0) + (t >= 9.4 ? 1 : 0), hand = (a, L, w, c = PAL.ink) => { gg.strokeStyle = c; gg.lineWidth = w; gg.lineCap = 'round'; gg.beginPath(); gg.moveTo(cx, cy); gg.lineTo(cx + Math.sin(a) * L, cy - Math.cos(a) * L); gg.stroke(); };
  hand(AH, r * .48, Math.max(3, r * .07)); hand(AM, r * .7, Math.max(2, r * .045)); hand(sec / 60 * TAU, r * .78, 2, HUE.aki[1]);
  gg.restore();
}
function shotS3(t) {
  iso.cam = { x: 0, y: 0, z: 0, k: 300 }; ground();
  // the watch: a short three-tone cylinder lying on a strap block, the dial on its top face
  const wy = 0;
  iso.box(-1.6, -.42, -.12, 3.2, .84, .12, ['#4A3A36', '#3A2E2C', '#2A2120']);
  iso.cyl(0, wy, 0, .62, .16, PAL.mustard);
  iso.flush();
  const c = iso.P(0, 0, .16), k = iso.cam.k, r = .55 * k;
  g.save(); g.translate(c[0], c[1]); g.scale(1, S30 / C30); g.rotate(0); watchFace(g, 0, 0, r * C30 * 1.414 * .8, t); g.restore();
  // the time left, drawn: one clock icon per second to midnight (73 at 23:58:47), one going out on the tick
  const left = 73 - (t >= 8.4 ? 1 : 0) - (t >= 9.4 ? 1 : 0), x0 = 1260, y0 = 250, gap = 54, cols = 10;
  haloText(g, 'SECONDS TO MIDNIGHT', x0, y0 - 54, { font: '600 25px Jost', track: 3.5 });
  haloText(g, String(left), x0 + 380, y0 - 50, { font: '400 44px Jost' });
  for (let i = 0; i < 73; i++) { const on = i < left, cx = x0 + (i % cols) * gap + gap / 2, cy = y0 + Math.floor(i / cols) * gap + gap / 2, pop = back(clamp((t - 7.6 - i * .006) / .18), 2.2);
    if (pop <= 0) continue; g.save(); g.translate(cx, cy); g.scale(pop, pop); g.fillStyle = on ? HUE.aki[1] : '#D8CCB6'; g.beginPath(); g.arc(0, 0, 18, 0, TAU); g.fill();
    g.strokeStyle = '#FBF4E6'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -11); g.moveTo(0, 0); g.lineTo(8, 0); g.stroke(); g.restore(); }
  haloText(g, '1 ICON = 1 SECOND', x0, y0 + 8 * gap + 20, { font: '500 20px Jost', track: 3 });
  pin(iso, .3, -.3, .16, { a: seg(t, 7.7, 8.4), title: 'HER WATCH', num: '23:58', up: 220, dir: -1, len: 80 });
  rain(t, 60, 1.4);
}
function shotS4(t) {
  const p = eio(seg(t, 9.375, 9.95)), k = Math.exp(lerp(Math.log(60), Math.log(20), p));
  iso.cam = { x: lerp(30, 18, p), y: 0, z: lerp(4, -1, p), k }; ground();
  // the board's shadow on the pale ground
  board(t, k > 30 ? 1 : 0); iso.flush();
  const tp = section(t);
  pin(iso, 22, Y1B, -1.1, { a: seg(t, 9.5, 9.95), title: 'THE LAST TRAIN', up: -90, dir: 1, len: 60 });
  const c = iso.P(37.7, -.79, 10.5); ring(g, c[0], c[1], 1.8 * k + 10, seg(t, EV.chime, EV.chime + .25), t, null);
  rain(t, 40, .8);
}

window.render = t => { g.setTransform(1, 0, 0, 1, 0, 0); if (t < 2.5) shotS1(t); else if (t < 7.5) shotS2(t); else if (t < 9.375) shotS3(t); else shotS4(t); };
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(d12(t))); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0);
window.READY = true;
