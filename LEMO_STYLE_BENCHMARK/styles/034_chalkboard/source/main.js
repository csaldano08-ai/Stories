// 034 · Chalkboard — the first 10 s of "Last Train Home" told on a classroom blackboard (lemo-opuscar styles/chalkboard):
// a clean deep-green slate in its wooden frame, a chalk tray, the wall and its clock; chalk that writes itself in stroke
// order with pressure (pressed landings, tapered lifts, skips over the grain), no hand, no stick, nothing that fades in.
// White chalk for every structure, one accent chalk (red) for the one thing the lesson tracks: AKI. The street was
// prepared on the board before class; what happens is written while we watch: the run as one red figure per footfall
// (the chalk's way to show time), the splash and its rings, the watch written large with a tick per second, and, on the
// wide shot of the wall, three rings around the station clock on the chime (9.575 s). The room's own clock reads 11:58.
// Camera faces the board flat on; close shot on the puddle, a lateral pan along the line of figures, hard cuts to the watch
// and to the wide shot of the wall (the style's transitions). Night: the room is lit by a warm lamp, no window light.
// Engine copied from the style's demo (chalk.js, hand.js, hz.js, r2d.js, post.js; stage.js with the clock at 11:58; props.js
// without the glow at the chalk's front, as the style asks). Page contract: window.render(t), DUR, READY, RIGQA.
import { clamp, lerp, ss, eio } from '/core/lib.js';
import { bake, drawStroke, line, curve, arc, poly, rng, Stroke } from './js/chalk.js';
import { installDeposit, grainTile } from './js/r2d.js';
import { Post } from './js/post.js';
import { loadSvgFont, writeLatin, latinWidth } from './js/hand.js';
import { bakeWall, bakeSlate, WALL, PW, BW, BH } from './js/stage.js';
import { drawFront } from './js/props.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { seg, back, hash } from './shared/lib/util.js';

const W = 1920, H = 1080, TAU = Math.PI * 2;
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

// ——— the board (6400 × 1700 units): rig → board ———
const GY = 1460, KR = .5, BX = x => 560 + (x - SPL.x) * KR, BP = p => [BX(p[0]), GY + p[1] * KR];
const WC = [5000, 470], WR = 300;                  // the watch, written large on the right panel above the street
const TWX = 6080, CLK = [TWX, 900, 95];            // the station's clock tower at the end of the street
const S = [];                                      // every chalk stroke
const add = (arr, t0, t1, color) => { const list = [].concat(arr); const L = list.reduce((a, s) => a + s.len, 0); let t = t0;
  for (const s of list) { if (color) s.color = color; const d = (t1 - t0) * s.len / L; s.t0 = t; s.t1 = t + d; t += d; S.push(s); } return list; };
const pre = (arr, color) => add(arr, -20, -19, color);   // written before class

function build() {
  const w = 6.5, chalk = o => ({ w, kind: 'line', ...o });
  // the prepared drawing: the ground line, the puddle with the signs upside down in it, rain, the shops with their names,
  // the station and its tower at the end of the street
  pre(line(150, GY, 5800, GY + 4, chalk({ w: 7 })));
  const PX = BX(SPL.x + 20), PY = GY + 32;
  pre(arc(PX, PY, 240, -2.8, -2.8 + TAU + .25, chalk({ ry: 40, w: 6 })));
  const mirror = (txt, cx) => { const ws = writeLatin(txt, cx - latinWidth(txt, 30) / 2, 0, 30, 0, { seed: 7 }); return ws.map(s => new Stroke(s.pts.map(([x, y]) => [x, GY + 14 - y]), { ...s.o, w: 3.4 })); };
  pre(mirror('24H', PX - 120)); pre(mirror('CAFE', PX + 105));
  const R = rng(34);
  for (let i = 0; i < 70; i++) { const x = 120 + R() * 5800, y = 120 + R() * 560, L = 26 + R() * 22; if (Math.hypot(x - WC[0], y - WC[1]) < WR + 90) continue; pre(line(x, y, x - 8, y + L, chalk({ w: 3.2, taper: .5 }))); }
  let x = 250, i = 0; const WORDS = ['24H', 'CAFE', 'BAKERY', 'BAR', 'BOOKS', 'PHARMACY', 'NOODLES', 'LAUNDRY', 'RECORDS', 'HOTEL', 'FLOWERS'];
  while (x < 5450) { const sw = 460 + hash(i * 3.7) * 120, top = GY - 560 - hash(i * 5.3) * 90, ww = sw * .5;
    pre([poly([[x, GY - 2], [x, top], [x + sw, top], [x + sw, GY - 2]], chalk()), line(x + 16, top + 64, x + sw - 16, top + 66, chalk({ w: 5 })),
      poly([[x + 30, GY - 140], [x + 30, top + 100], [x + 30 + ww, top + 100], [x + 30 + ww, GY - 140], [x + 26, GY - 140]], chalk({ w: 5 })),
      poly([[x + sw - 110, GY - 2], [x + sw - 110, GY - 250], [x + sw - 40, GY - 250], [x + sw - 40, GY - 2]], chalk({ w: 5 }))]);
    const word = WORDS[i % WORDS.length], cap = 30; pre(writeLatin(word, x + sw / 2 - latinWidth(word, cap) / 2, top + 48, cap, 0, { seed: 11 + i }));
    x += sw + 26; i++; }
  pre([poly([[5560, GY], [5560, GY - 420], [5980, GY - 420]], chalk()), poly([[TWX - 100, GY - 420], [TWX - 100, 760], [TWX, 640], [TWX + 100, 760], [TWX + 100, GY], [5560, GY]], chalk()),
    arc(CLK[0], CLK[1], CLK[2], -1.7, -1.7 + TAU + .2, chalk({ w: 6 })), line(CLK[0], CLK[1], CLK[0] - 8, CLK[1] - 58, chalk({ w: 7 })), line(CLK[0], CLK[1], CLK[0] - 14, CLK[1] - 78, chalk({ w: 5 }))]);
  pre(writeLatin('STATION', 5600, GY - 330, 30, 0, { seed: 99 }));

  // the run, written while we watch: one red figure per footfall, drawn in the third of a second before the foot lands
  const T = (J, b, u, f) => [b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f];
  for (const c of RUN.contacts.filter(c => c.t0 > .25 && c.t0 < 7.45)) {
    const J = solveProfile(poseAt(c.t0)), hc = J.headC, HR = p => { const cs = Math.cos(J.headA), sn = Math.sin(J.headA); return BP([hc[0] + p[0] * cs - p[1] * sn, hc[1] + p[0] * sn + p[1] * cs]); };
    const st = [];
    for (const k of ['f', 'n']) { const l = J.leg[k], cs = Math.cos(l.pitch), sn = Math.sin(l.pitch), F = ([u, v]) => BP([l.ankle[0] + u * cs - v * sn, l.ankle[1] + u * sn + v * cs]);
      st.push(curve([BP(l.hip), BP(l.knee), BP(l.ankle), F([20, 14]), F([62, 12])], { w: 5.6, kind: 'write', taper: .3 })); }
    st.push(poly([BP(T(J, J.neckBase, 4, -20)), BP(T(J, J.pelvis, -84, -46)), BP(T(J, J.pelvis, -88, 40)), BP(T(J, J.neckBase, -6, 26)), BP(T(J, J.neckBase, 4, -18))], { w: 5.6, kind: 'write' }));
    for (const k of ['f', 'n']) { const a = J.arm[k]; st.push(curve([BP(a.sh), BP(a.el), BP(a.wr)], { w: 5, kind: 'write', taper: .35 })); }
    st.push(arc(...HR([4, 0]), 21, -1.3, -1.3 + TAU + .15, { w: 5, kind: 'write' }));
    st.push(curve([HR([30, -24]), HR([0, -30]), HR([-24, -16]), HR([-28, 12]), HR([-22, 30])], { w: 5.4, kind: 'write', taper: .4 }));
    add(st, c.t0 - .3, c.t0 - .01, 'red');
  }
  // the splash and its rings (white chalk)
  { const sx = BX(SPL.x + 12), spl = []; for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k / 6 - .5) * 2.1, L = 34 + hash(k * 3.1) * 30; spl.push(line(sx + Math.cos(a) * 14, GY - 4 + Math.sin(a) * 6, sx + Math.cos(a) * (14 + L), GY - 4 + Math.sin(a) * L * .9, chalk({ w: 4.4, taper: .6 }))); }
    add(spl, EV.splash, EV.splash + .16);
    add([arc(sx, PY - 6, 46, Math.PI * .1, Math.PI * 2.05, chalk({ ry: 9, w: 4 })), arc(sx, PY - 4, 92, Math.PI * .12, Math.PI * 2.0, chalk({ ry: 17, w: 4 })), arc(sx, PY - 2, 140, Math.PI * .15, Math.PI * 1.95, chalk({ ry: 25, w: 3.6 }))], EV.splash + .18, EV.splash + .7); }
  // the watch, written large on the right panel: the sleeve (red), the wrist, the case, the ticks, the hands at 23:58,
  // then one short red tick at the rim for every second that passes
  const [wx, wy] = WC;
  add([poly([[wx - 760, wy - 150], [wx - 380, wy - 140], [wx - 370, wy + 150], [wx - 760, wy + 160]], chalk({ w: 7 })), ...[0, 1, 2, 3].map(k => line(wx - 720 + k * 90, wy - 140, wx - 690 + k * 90, wy + 150, chalk({ w: 4.4 })))], 7.5, 7.82, 'red');
  add([line(wx - 370, wy - 110, wx - WR + 6, wy - 100, chalk()), line(wx - 370, wy + 110, wx - WR + 6, wy + 100, chalk()), arc(wx, wy, WR, -2.2, -2.2 + TAU + .2, chalk({ w: 8 })), arc(wx, wy, WR - 26, -2.1, -2.1 + TAU, chalk({ w: 4.4 }))], 7.55, 7.98);
  const tk = []; for (let k = 0; k < 12; k++) { const a = -Math.PI / 2 + k / 12 * TAU, r0 = k % 3 ? WR - 70 : WR - 96; tk.push(line(wx + Math.cos(a) * r0, wy + Math.sin(a) * r0, wx + Math.cos(a) * (WR - 44), wy + Math.sin(a) * (WR - 44), chalk({ w: k % 3 ? 5 : 8 }))); }
  add(tk, 7.98, 8.34);
  const hh = -Math.PI / 2 + (11 + 58 / 60) / 12 * TAU, mm = -Math.PI / 2 + 58 / 60 * TAU;
  add([line(wx, wy, wx + Math.cos(hh) * 140, wy + Math.sin(hh) * 140, chalk({ w: 10 })), line(wx, wy, wx + Math.cos(mm) * 220, wy + Math.sin(mm) * 220, chalk({ w: 7 }))], 8.34, 8.56);
  add(writeLatin('23:58', wx + WR + 50, wy + 22, 46, 0, { seed: 58 }), 8.56, 8.9);
  for (const [sec, t0] of [[47, 7.9], [48, 8.4], [49, 9.4]]) { const a = -Math.PI / 2 + sec / 60 * TAU; add(line(wx + Math.cos(a) * (WR - 150), wy + Math.sin(a) * (WR - 150), wx + Math.cos(a) * (WR - 82), wy + Math.sin(a) * (WR - 82), chalk({ w: 6 })), t0, t0 + .08, 'red'); }   // one red mark per second, where the second hand points
  // the chime: three rings written around the station clock
  add([arc(CLK[0], CLK[1], CLK[2] + 40, -2.6, -.5, chalk({ w: 5 })), arc(CLK[0], CLK[1], CLK[2] + 80, -2.5, -.6, chalk({ w: 5 })), arc(CLK[0], CLK[1], CLK[2] + 40, .5, 2.6, chalk({ w: 5 }))], EV.chime, EV.chime + .3);
  for (const s of S) bake(s, s.o.R || 2);
}

// ——— cameras: flat on; close on the puddle, a lateral pan along the figures, close on the watch, the whole wall ———
const camAt = t => {
  const id = shotAt(t)[2];
  if (id === 'S1') return { cx: BX(SPL.x + 40) + 10 * t, cy: GY - 120, s: 1.55, shot: 0 };
  if (id === 'S2') return { cx: BX(X(t)) + 260, cy: GY - 330, s: .95, shot: 1 };
  if (id === 'S3') { const a = t - 7.5; return { cx: WC[0] - 60 + 14 * a, cy: WC[1] + 30, s: 1.35, shot: 2 }; }
  const u = eio(seg(t, 9.375, 10)); return { cx: lerp(3200, 3240, u), cy: lerp(700, 720, u), s: lerp(.25, .258, u), shot: 3 };
};

// ——— frame ———
let post, main, mx, WALLI, FR, FL, PAT;
const view = c => ({ ...c, m: [c.s, 0, 0, c.s, W / 2 - c.cx * c.s, H / 2 - c.cy * c.s], toScreen: (x, y) => [W / 2 + (x - c.cx) * c.s, H / 2 + (y - c.cy) * c.s] });
function frame(t) {
  const c = camAt(t), v = view(c);
  mx.setTransform(1, 0, 0, 1, 0, 0); mx.globalCompositeOperation = 'source-over'; mx.globalAlpha = 1; mx.filter = 'none';
  mx.fillStyle = '#000'; mx.fillRect(0, 0, W, H);
  mx.setTransform(...v.m); mx.imageSmoothingQuality = 'high';
  mx.drawImage(WALLI.cv, WALL[0], WALL[1], WALL[2], WALL[3]);
  mx.drawImage(FL.cv, -FL.m, 0, FL.cv.width, BH); mx.drawImage(FR.cv, PW - FR.m, 0, FR.cv.width, BH);
  for (const s of S) if (t > s.t0) drawStroke(mx, s, t);
  if (c.s > .6) { mx.save(); mx.beginPath(); mx.rect(0, 0, BW, BH); mx.clip(); PAT.setTransform(new DOMMatrix([.25, 0, 0, .25, 0, 0])); mx.globalCompositeOperation = 'soft-light'; mx.globalAlpha = Math.min(.2, (c.s - .6) * .3); mx.fillStyle = PAT; mx.fillRect(0, 0, BW, BH); mx.restore(); }
  // night: one warm lamp above the room's centre, falling off toward the corners (no window light)
  mx.save(); mx.setTransform(...v.m);
  const lg = mx.createRadialGradient(3200, -200, 300, 3200, 600, 6200); lg.addColorStop(0, 'rgb(255,246,226)'); lg.addColorStop(.5, 'rgb(226,220,206)'); lg.addColorStop(1, 'rgb(150,146,140)');
  mx.globalCompositeOperation = 'multiply'; mx.fillStyle = lg; mx.fillRect(-1500, -1500, 9400, 4900); mx.restore();
  for (const s of S) { if (t <= s.t0 || t >= s.t1) continue; const p = s.at(s.prog(t) * s.len); drawFront(mx, t, v, p[0], p[1], s.color, Math.min(s.w, 9), .5); }
  return c;
}
function render(t) {
  const c = frame(t), tp = t - .25 / 30, pc = camAt(tp).shot === c.shot ? camAt(tp) : c, k = pc.s / c.s;
  const bl = [k, 0, 0, 0, k, 0, W / 2 - k * W / 2 + pc.s * (c.cx - pc.cx), H / 2 - k * H / 2 + pc.s * (c.cy - pc.cy), 1];
  post.draw(main, bl, t, .3);
}

(async () => {
  const cv = document.getElementById('c'); cv.width = W; cv.height = H;
  await loadSvgFont('fonts/EMSDelight.svg'); await loadSvgFont('fonts/EMSCasualHand.svg', 'child');
  installDeposit();
  build();
  WALLI = bakeWall(); FR = bakeSlate(PW, BH, 71, true); FL = bakeSlate(PW, BH, 81, true);
  post = new Post(cv, W, H); main = new OffscreenCanvas(W, H); mx = main.getContext('2d'); PAT = mx.createPattern(grainTile(), 'repeat');
  window.render = render;
  window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const c = RUN.contacts.filter(c => c.t0 - .3 <= t).pop(); if (!c) return null; const J = solveProfile(poseAt(c.t0)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
  window.READY = true;
})();
window.DUR = DUR;
