// 033 · Whiteboard — the first 10 s of "Last Train Home" drawn live on one glossy dry-erase board (lemo-opuscar
// styles/whiteboard): real marker strokes in writing order (pressure ramp, overshoot, pooled start, dry speckle, multiply),
// floating markers with no hand, a pin magnet that moves, ghosts of an old lesson, the window sheen drifting slower than the
// board, and a camera that travels across the board instead of cutting (whips at 2.5, 7.5 and 9.375 s).
// The run is drawn the way a board can show motion: one pose per footfall, drawn by two pairs of markers (black + red) in
// the third of a second before each foot lands, while the camera rides along her at her speed — the trail of poses is time.
// Colours hold their meaning: black = things, blue = water and time, red = AKI (the one accent). The watch's second hand
// is the red pin magnet, hopping once a second. Text is the single-line EMS Tech hand, written stroke by stroke.
// Engine copied unchanged from the style's demo (wb.js). Page contract: window.render(t), DUR, READY, RIGQA.
import * as Wb from './engine/wb.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { lerp, seg, ss, eio, back, hash, clamp } from './shared/lib/util.js';

const TAU = Math.PI * 2, BLK = Wb.INK.black, BLU = Wb.INK.blue, RED = Wb.INK.red;
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

// ——— the board: rig units → board px (one board, every shot is a region of it) ———
const KB = .72, GY = 4000, BX = x => 2100 + (x - X(2.5)) * KB, BP = p => [BX(p[0]), GY + p[1] * KB];
const WC = [7350, 1650], WR = 330;                 // the watch drawing (region 3)
const TOWER = [2700, 1450];                         // the clock tower (region 4): centre of its clock face
const BW = 9600, BH = 5200;

// ——— a pose in marker: black for her outline (head, bob, trousers, boots), red for the jacket ———
function figure(J, o = {}) {
  const P = BP, w = o.w ?? 8, T = (b, u, f) => [b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f];
  const hc = J.headC, HR = p => { const c = Math.cos(J.headA), s = Math.sin(J.headA); return P([hc[0] + p[0] * c - p[1] * s, hc[1] + p[0] * s + p[1] * c]); };
  const blk = [], red = [];
  const legs = o.legsOnly ? ['f', 'n'] : ['f', 'n'];
  for (const k of legs) { const l = J.leg[k], c = Math.cos(l.pitch), s = Math.sin(l.pitch), F = ([u, v]) => P([l.ankle[0] + u * c - v * s, l.ankle[1] + u * s + v * c]);
    blk.push(Wb.curve([P(l.hip), P(l.knee), P(l.ankle)], { w, over: 4 }));
    blk.push(Wb.poly([F([-8, -30]), F([-18, 14]), F([60, 16]), F([62, 4]), F([20, -4])], { w: w * 1.1, over: 2 })); }
  if (!o.legsOnly) {
    const hb = o.hemB || [0, 0];
    red.push(Wb.poly([P(T(J.neckBase, 6, -26)), P([T(J.pelvis, -84, -50)[0] + hb[0] * .6, T(J.pelvis, -84, -50)[1] + hb[1] * .6]), P(T(J.pelvis, -88, 42)), P(T(J.neckBase, -8, 28)), P(T(J.neckBase, 6, -26))], { w, over: 3 }));
    red.push(Wb.hatch([P(T(J.neckBase, -4, -20)), P(T(J.pelvis, -76, -40)), P(T(J.pelvis, -80, 34)), P(T(J.neckBase, -14, 22))], { w: w * .7, spacing: 15 }));
    for (const k of ['f', 'n']) { const a = J.arm[k]; red.push(Wb.curve([P(a.sh), P(a.el), P(a.wr)], { w: w * 1.05, over: 2 })); blk.push(Wb.circle(...P([a.wr[0] + (a.wr[0] - a.el[0]) * .18, a.wr[1] + (a.wr[1] - a.el[1]) * .18]), 15 * KB, { w: w * .8, lap: .1 })); }
    blk.push(Wb.circle(...HR([4, 0]), 42 * KB, { w, a0: -1.2 }));
    const lag = o.hair || [0, 0], lx = clamp(lag[0] * .45, -30, 8), ly = clamp(lag[1] * .35, -12, 14);
    blk.push(Wb.curve([HR([34, -30]), HR([10, -50]), HR([-26, -44]), HR([-50, -12]), HR([-54 + lx * .5, 24 + ly * .5]), HR([-44 + lx, 56 + ly])], { w: w * 1.05, over: 4 }));
    blk.push(Wb.line(...HR([26, -6]), ...HR([33, -6]), { w: w * .8, jitter: 0 }));
    if ((o.watch || 0) > .2) blk.push(Wb.circle(...P(J.arm.n.wr), 14 * KB, { w: w * .8, color: BLU, lap: .1 }));
  }
  return { blk, red };
}

// ——— the timeline: what each marker draws, and when ———
const tl = new Wb.Timeline();
const PK = { B1: new Wb.Pen('black1', BLK, { park: [2100, 1250] }), B2: new Wb.Pen('black2', BLK, { park: [2150, -200] }), R1: new Wb.Pen('red1', RED, { park: [2200, 1150] }), R2: new Wb.Pen('red2', RED, { park: [2150, -150] }),
  BL: new Wb.Pen('blue', BLU, { park: [-250, 1250] }), BK: new Wb.Pen('black3', BLK, { park: [-250, -150] }) };
const GHOSTS = [];
function build() {
  // what was already on the board before we arrived (drawn at t < 0): the street, the puddle and its reflections, the skyline
  const pre = (pen, shapes, t0, t1) => tl.draw(pen, shapes, t0, { by: t1 });
  const ground = Wb.line(BX(SPL.x - 900), GY, BX(X(7.5) + 1600), GY, { w: 10, over: 8 });
  pre(PK.BK, ground, -40, -39);
  const PX = BX(SPL.x + 20), PY = GY + 22;
  { // the puddle as a flat ellipse + the signs upside down in it
    const e = []; for (let i = 0; i <= 64; i++) { const a = -2.6 + i / 64 * (TAU + .3); e.push([PX + Math.cos(a) * 250, PY + Math.sin(a) * 46]); }
    pre(PK.BL, Wb.curve(e, { w: 9 }), -38.8, -38.6);
    const mirror = strokes => strokes.map(s => { const p = s.pts.slice(); for (let i = 1; i < p.length; i += 2) p[i] = 2 * (GY + 12) - p[i]; return new Wb.Stroke(p, { w: s.w, kind: 'text', jitter: 0, color: BLU }); });
    pre(PK.BL, mirror(Wb.text('24H', PX - 110, GY + 4, { h: 40, align: 'center' })), -38.6, -38.2);
    pre(PK.BL, mirror(Wb.text('CAFE', PX + 110, GY + 4, { h: 40, align: 'center' })), -38.2, -37.8);
    for (const dx of [-60, 40, 150]) pre(PK.BL, Wb.curve([[PX + dx - 30, PY + 26], [PX + dx, PY + 32], [PX + dx + 30, PY + 26]], { w: 5 }), -37.7, -37.6);
  }
  // shopfronts along the street (black), names written in the single-line hand, the windows lit with a little blue
  const WORDS = ['24H', 'CAFE', 'BAKERY', 'BAR', 'BOOKS', 'PHARMACY', 'NOODLES', 'LAUNDRY', 'RECORDS', 'HOTEL', 'FLOWERS', 'BAR', 'BOOKS'];
  let x = BX(SPL.x - 700), i = 0, tt = -37;
  while (x < BX(X(7.5) + 1400)) { const w = 640 + hash(i * 3.3) * 160, top = GY - 700 - hash(i * 5.1) * 140, ww = w * .52;
    pre(PK.BK, [Wb.poly([[x, GY], [x, top], [x + w, top], [x + w, GY]], { w: 9, over: 6 }), Wb.rect(x + 40, top + 120, ww, 280, { w: 8 }), Wb.rect(x + w - 150, GY - 330, 100, 330, { w: 8 }),
      Wb.line(x + 20, top + 92, x + w - 20, top + 92, { w: 7 })], tt, tt + .4);
    pre(PK.BK, Wb.text(WORDS[i % WORDS.length], x + w / 2, top + 72, { h: 46, align: 'center' }), tt + .4, tt + .8);
    pre(PK.BL, Wb.hatch([[x + 50, top + 130], [x + 30 + ww, top + 130], [x + 30 + ww, top + 390], [x + 50, top + 390]], { w: 5, spacing: 34, alpha: .5 }), tt + .8, tt + 1.1);
    x += w + 30; i++; tt += 1.2; }
  // the skyline and the clock tower's body (region 4) — the clock face itself is drawn live at the end
  const [cx, cy] = TOWER;
  pre(PK.BK, Wb.poly([[cx - 1500, cy + 1250], [cx - 1500, cy + 700], [cx - 1100, cy + 700], [cx - 1100, cy + 480], [cx - 700, cy + 480], [cx - 700, cy + 820], [cx - 260, cy + 820], [cx - 260, cy - 320], [cx, cy - 640], [cx + 260, cy - 320], [cx + 260, cy + 760], [cx + 700, cy + 760], [cx + 700, cy + 560], [cx + 1150, cy + 560], [cx + 1150, cy + 900], [cx + 1500, cy + 900], [cx + 1500, cy + 1250]], { w: 10, over: 6 }), -12, -11);
  for (let k = 0; k < 14; k++) pre(PK.BK, Wb.rect(cx - 1400 + (k % 7) * 380 + (k > 6 ? 1500 : 0) - (k > 6 ? 200 : 0), cy + 600 + (k % 3) * 120, 50, 70, { w: 6 }), -11 + k * .05, -10.96 + k * .05);
  // ghosts of an old lesson (5–10 %), so the board has lived
  for (let k = 0; k < 22; k++) { const gx = 300 + hash(k * 7.1) * (BW - 600), gy = 200 + hash(k * 3.3) * (BH - 400);
    const s = k % 3 === 0 ? Wb.text(['v = d / t', 'x2', 'ratio', 'k = 1/2', 'step', 'f(t)'][k % 6], gx, gy, { h: 60 }) : k % 3 === 1 ? [Wb.circle(gx, gy, 60 + hash(k) * 60, { w: 9 })] : [Wb.arrow(gx, gy, gx + 160, gy - 60, { w: 9 })];
    for (const st of [s].flat(3)) { st.alpha = .06 + hash(k * 5) * .04; st.color = k % 4 ? '#9aa0a8' : '#8fa6c8'; GHOSTS.push(st); } }

  // S1 — rain begins on the puddle (blue dashes), the steps arrive (legs only in this close view), the splash
  for (let k = 0; k < 18; k++) { const t0 = .05 + k * .12, rx = PX - 420 + hash(k * 9.1) * 840, ry = GY - 380 + hash(k * 4.4) * 300; tl.draw(PK.BL, Wb.line(rx, ry, rx - 10, ry + 40, { w: 6, jitter: 0, kind: 'dash' }), t0, { by: t0 + .05 }); }
  const steps = RUN.contacts.filter(c => c.t0 > .2 && c.t0 < 7.45);
  steps.forEach((c, n) => {
    const tc = c.t0, S = poseAt(tc), J = solveProfile(S), sc = secondary(q => { const p = RUN.pelvisAt(q); return [p[0], p[1] - 250]; }, 0, tc);
    const close = tc < 2.5, f = figure(J, { legsOnly: close, hemB: sc.hemB, hair: sc.hair.back, watch: S.watch, w: close ? 7 : 8 });
    const pb = n % 2 ? PK.B2 : PK.B1, pr = n % 2 ? PK.R2 : PK.R1, t0 = tc - .33;
    tl.draw(pb, f.blk, t0, { by: tc, tag: 'pose' });
    if (f.red.length) tl.draw(pr, f.red, t0 + .03, { by: tc + .02, tag: 'jacket' });
  });
  { const sx = BX(SPL.x + 12), spl = [];   // the splash: blue blades thrown up and out, then rings on the water
    for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k / 8 - .5) * 2.2, L = 70 + hash(k * 3.1) * 60; spl.push(Wb.line(sx + Math.cos(a) * 26, GY - 6 + Math.sin(a) * 10, sx + Math.cos(a) * (26 + L), GY - 6 + Math.sin(a) * L * .9, { w: 7, over: 3 })); }
    tl.draw(PK.BL, spl, EV.splash, { by: EV.splash + .2 });
    const ring = r => { const e = []; for (let i = 0; i <= 40; i++) { const a = -2.4 + i / 40 * (TAU + .2); e.push([sx + Math.cos(a) * r, PY + Math.sin(a) * r * .18]); } return Wb.curve(e, { w: 6 }); };
    tl.draw(PK.BL, [ring(60), ring(130), ring(200)], EV.splash + .24, { by: EV.splash + .62 }); }
  // S3 — the watch, drawn while we arrive: sleeve (red), wrist, dial, ticks, hands at 23:58, a raindrop or two (blue)
  const [wx, wy] = WC;
  tl.draw(PK.R1, [Wb.poly([[wx - 1050, wy - 230], [wx - 460, wy - 220], [wx - 440, wy + 230], [wx - 1050, wy + 250]], { w: 11, over: 6 }), Wb.hatch([[wx - 1020, wy - 200], [wx - 480, wy - 190], [wx - 470, wy + 200], [wx - 1020, wy + 220]], { w: 8, spacing: 26 })], 7.48, { by: 7.86 });
  tl.draw(PK.B1, [Wb.curve([[wx - 440, wy - 170], [wx - WR, wy - 150]], { w: 10 }), Wb.curve([[wx - 440, wy + 170], [wx - WR, wy + 150]], { w: 10 }), Wb.circle(wx, wy, WR, { w: 12, lap: .3 }), Wb.circle(wx, wy, WR - 26, { w: 7, lap: .1 }),
    Wb.curve([[wx + WR, wy - 150], [wx + 700, wy - 170], [wx + 1000, wy - 120]], { w: 10 }), Wb.curve([[wx + WR, wy + 150], [wx + 700, wy + 170], [wx + 1000, wy + 160]], { w: 10 })], 7.5, { by: 7.95 });
  const ticks = []; for (let k = 0; k < 12; k++) { const a = -Math.PI / 2 + k / 12 * TAU, r0 = k % 3 ? WR - 70 : WR - 100; ticks.push(Wb.line(wx + Math.cos(a) * r0, wy + Math.sin(a) * r0, wx + Math.cos(a) * (WR - 44), wy + Math.sin(a) * (WR - 44), { w: k % 3 ? 7 : 11, jitter: .3 })); }
  tl.draw(PK.B2, ticks, 7.7, { by: 8.1 });
  const hh = -Math.PI / 2 + (11 + 58 / 60) / 12 * TAU, mm = -Math.PI / 2 + 58 / 60 * TAU;
  tl.draw(PK.B1, [Wb.line(wx, wy, wx + Math.cos(hh) * 150, wy + Math.sin(hh) * 150, { w: 14 }), Wb.line(wx, wy, wx + Math.cos(mm) * 235, wy + Math.sin(mm) * 235, { w: 10 })], 8.0, { by: 8.25 });
  tl.draw(PK.BL, [Wb.text('23:58', wx, wy + WR + 110, { h: 70, align: 'center' }), Wb.circle(wx + 120, wy - 150, 18, { w: 6 }), Wb.circle(wx + 150, wy + 90, 24, { w: 6 })], 8.3, { by: 8.9 });
  // S4 — the clock face on the tower, drawn as we arrive; the chime as three blue pings (9.575 s)
  const [kx, ky] = TOWER;
  tl.draw(PK.BK, [Wb.circle(kx, ky, 170, { w: 11, lap: .25 })], 9.36, { by: 9.56 });
  tl.draw(PK.B2, [Wb.line(kx, ky, kx + Math.cos(hh) * 80, ky + Math.sin(hh) * 80, { w: 12 }), Wb.line(kx, ky, kx + Math.cos(mm) * 125, ky + Math.sin(mm) * 125, { w: 9 })], 9.4, { by: 9.56 });
  const ping = r => Wb.arc(kx, ky, r, -2.4, -.75, { w: 8 }), ping2 = r => Wb.arc(kx, ky, r, -2.4 + Math.PI, -.75 + Math.PI, { w: 8 });
  tl.draw(PK.BL, [ping(230), ping2(230), ping(300), ping2(300)], EV.chime, { by: EV.chime + .3 });
  for (let k = 0; k < 10; k++) { const t0 = 9.4 + k * .055, rx = kx - 900 + hash(k * 2.7) * 1800, ry = ky - 700 + hash(k * 6.1) * 900; tl.draw(PK.BL, Wb.line(rx, ry, rx - 12, ry + 46, { w: 6, jitter: 0, kind: 'dash' }), t0, { by: t0 + .04 }); }
  tl.end();
}

// ——— camera: rides the board; whips at the shot changes ———
const camKeys = () => [
  [0, BX(SPL.x + 60), GY - 150, 2.15, 0, 'l'], [2.5, BX(SPL.x + 110), GY - 150, 2.15, 0, 'l'],
  [2.82, BX(X(2.82)) + 260, GY - 330, .95, -.02, 'io'], [7.5, BX(X(7.5)) + 260, GY - 330, .95, 0, 'l'],
  [7.86, WC[0] + 20, WC[1] + 40, 1.32, .02, 'io'], [9.375, WC[0] + 50, WC[1] + 46, 1.36, 0, 'l'],
  [9.64, TOWER[0], TOWER[1] + 60, .82, -.015, 'io'], [10, TOWER[0], TOWER[1] + 150, .8, 0, 'i'] ];
let cam, board, ctx, acc, actx;
// the pin magnet: the watch's second hand, hopping once a second with a little follow-through
function magnet(c, t) {
  if (t < 8.15 || t > 9.6) return;
  const k = t < 8.4 ? 47 : t < 9.4 ? 48 : 49, t0 = t < 8.4 ? 7.4 : t < 9.4 ? 8.4 : 9.4, a = t - t0, s = k - 1 + (a < .18 ? back(a / .18, 2.2) : 1);
  const drop = clamp((t - 8.15) / .18), lift = a < .18 ? Math.sin(Math.PI * a / .18) * .5 : 0, ang = -Math.PI / 2 + s / 60 * TAU, r = WR - 66;
  const tip = [WC[0] + Math.cos(ang) * r, WC[1] + Math.sin(ang) * r], a0 = Wb.toScreen(c, WC[0], WC[1]), a1 = Wb.toScreen(c, tip[0], tip[1]);
  if (drop > .6) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.strokeStyle = 'rgba(150,40,36,.9)'; ctx.lineWidth = 2.4 * c.z; ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1] - 4 * c.z); ctx.stroke();
    ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.arc(a0[0], a0[1], 14 * c.z, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(a0[0] - 4 * c.z, a0[1] - 4 * c.z, 4 * c.z, 0, TAU); ctx.fill(); ctx.restore(); }
  Wb.drawPinMagnet(ctx, tip[0], tip[1], c, { color: RED, size: 120, lift: Math.max(lift, 1 - drop) });
}
function frameAt(t) {
  board.render(ctx, t, cam);
}
function render(t) {
  // motion blur when the camera travels fast: average sub-frames (the style's rule)
  // only on the whips: the tracking shot stays crisp (it is the run, on ones); sub-frames ≤ ~4 px apart over a half-frame shutter
  const whip = [[2.5, 2.82], [7.5, 7.86], [9.375, 9.64]].some(([a, b]) => t > a && t < b);
  const c0 = cam.at(t - 1 / 120), c1 = cam.at(t + 1 / 120), v = Math.hypot((c1.x - c0.x) * c1.z, (c1.y - c0.y) * c1.z);
  if (!whip || v < 14) { frameAt(t); return; }
  const n = clamp(Math.ceil(v / 4), 4, 16); actx.setTransform(1, 0, 0, 1, 0, 0); actx.clearRect(0, 0, 1920, 1080);
  for (let i = 0; i < n; i++) { frameAt(t + (i - (n - 1) / 2) / (60 * n)); actx.globalAlpha = 1 / (i + 1); actx.drawImage(ctx.canvas, 0, 0); }
  actx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(acc, 0, 0);
}

(async () => {
  await Wb.loadFont('tech', 'fonts/EMSTech.json');
  build();
  board = new Wb.Board(tl, { W: BW, H: BH, ghosts: GHOSTS });
  cam = new Wb.Camera(camKeys());
  ctx = document.getElementById('c').getContext('2d');
  acc = document.createElement('canvas'); acc.width = 1920; acc.height = 1080; actx = acc.getContext('2d');
  for (const p of Object.values(PK)) board.objs.push({ draw: (g, t, c) => { const pose = Wb.penPose(p, t, cam); if (pose) Wb.drawMarker(g, p, pose, c, t); } });
  board.objs.push({ draw: (g, t, c) => magnet(c, t) });
  window.render = render;
  window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const c = RUN.contacts.filter(c => c.t0 <= t + 1e-6).pop(); if (!c) return null; const J = solveProfile(poseAt(c.t0)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
  window.READY = true;
})();
window.DUR = DUR;
