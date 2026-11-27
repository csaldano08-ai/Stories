// 013 · Stick-figure Explainer — the first 10 s of "Last Train Home" told with stick people on warm paper
// (lemo-opuscar styles/stick-explainer): round heads, one curve per limb (the joint is the control point, k ≈ .8), one
// weight per figure, no faces/hands/props, ONE accent (AKI, the change), a ground "system line" that carries a ripple,
// type left-aligned on a 124 px margin (one big number, one line saying what it means), a world camera (centre + log zoom).
// Page contract: window.render(t), DUR, READY, RIGQA, TEXTS.
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash } from './shared/lib/util.js';

const W = 1920, H = 1080, cv = document.getElementById('c'), g = cv.getContext('2d');
await Promise.all(['600 80px Jost', '500 40px Jost'].map(f => document.fonts.load(f)));
const PAL = { paper: '#F3F0EA', ink: '#24242C', mute: '#9C978C', tint: '#E2DDD2', accent: '#EB4A2A' };
const TAU = Math.PI * 2;
// paper: one flat warm off-white with a very fine matte grain, drawn once
const PAPER = (() => { const c = new OffscreenCanvas(W, H), x = c.getContext('2d'); x.fillStyle = PAL.paper; x.fillRect(0, 0, W, H); const im = x.getImageData(0, 0, W, H);
  for (let i = 0; i < im.data.length; i += 4) { const n = (hash(i * .37) - .5) * 6; im.data[i] += n; im.data[i + 1] += n; im.data[i + 2] += n; } x.putImageData(im, 0, 0); return c; })();

// ——— the run (shared rig); world units = rig units (600 tall), ground at y = 0 ———
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02), XP = SPL.x;
function poseAt(t) {
  const S = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  const w = clamp(up, 0, 1.1) * (1 - dn); S.watch = w;
  if (w > 0) { const J0 = solveProfile(S), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S.arms.f.sh *= 1 - .45 * wm; S.head += .3 * wm; S.neck += .1 * wm; }
  return S;
}
// ——— world camera (centre + zoom, zoom interpolated in log space) ———
let CAM = { x: 0, y: -300, z: .6 };
const sx = x => (x - CAM.x) * CAM.z + W * .5, sy = y => (y - CAM.y) * CAM.z + H * .52;
const lw = base => Math.max(1.2, base * CAM.z / .633);           // proportional weight: the figure reads the same at every zoom
// one curve per limb: quadratic from root to tip with the joint pulled in as control point (k ≈ .8)
function limb(a, j, b) { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], c = [m[0] + (j[0] - m[0]) * 1.6, m[1] + (j[1] - m[1]) * 1.6]; g.beginPath(); g.moveTo(sx(a[0]), sy(a[1])); g.quadraticCurveTo(sx(c[0]), sy(c[1]), sx(b[0]), sy(b[1])); g.stroke(); }
function stick(J, col, accent) {
  g.save(); g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = lw(12.6);
  const L = J.leg, A = J.arm;
  limb(A.f.sh, A.f.el, A.f.wr); limb(L.f.hip, L.f.knee, L.f.ankle); limb(L.n.hip, L.n.knee, L.n.ankle);
  limb(J.pelvis, J.waist, J.neckBase);                            // the spine: one curve
  g.beginPath(); g.moveTo(sx(J.neckBase[0]), sy(J.neckBase[1])); g.lineTo(sx(J.neckTop[0]), sy(J.neckTop[1])); g.stroke();
  limb(A.n.sh, A.n.el, A.n.wr);
  // head on the neck (it only rotates about the neck: never floats off)
  const hc = [J.neckTop[0] + Math.sin(J.headA) * 48, J.neckTop[1] - Math.cos(J.headA) * 48], r = 46 * CAM.z;
  g.beginPath(); g.arc(sx(hc[0]), sy(hc[1]), r, 0, TAU); g.fillStyle = accent ? PAL.accent : PAL.paper; g.fill(); g.lineWidth = lw(11); g.stroke();
  g.restore();
}
// a standing figure (commuter) built on the same skeleton with a standing pose; breathing and sway are analytic, one phase each
function standPose(x, ph, t, react = 0, look = 0) {
  const br = Math.sin(t * 1.6 + ph) * 3, sw = Math.sin(t * .7 + ph * 2) * .02;
  return { pelvis: [x, -334 + br * .3 + react * 6], tL: sw - react * .1, tU: sw - react * .16, neck: -react * .1, head: look * .25 - react * .2,
    legs: { n: { ankle: [x + 18, -56] }, f: { ankle: [x - 14, -56] } }, arms: { n: { sh: .32 + react * .5, el: .25, wr: 0 }, f: { sh: -.3 - react * .4, el: .3, wr: 0 } } };
}
// the ground line ("system line") with the ripple: a bump that travels both ways from a source, the accent front ahead of it
function groundLine(x0, x1, src, t0, t) {
  g.save(); g.strokeStyle = PAL.tint; g.lineWidth = lw(6); g.lineCap = 'round';
  const u = t - t0, R = u > 0 ? u * 2600 : -1, amp = u > 0 ? 26 * Math.exp(-u * 1.6) : 0;
  g.beginPath(); for (let x = x0; x <= x1; x += 20) { const d = Math.abs(x - src), b = R > 0 ? amp * Math.exp(-Math.pow((d - R) / 90, 2)) : 0; const y = -b; x === x0 ? g.moveTo(sx(x), sy(y)) : g.lineTo(sx(x), sy(y)); } g.stroke();
  if (R > 0 && amp > 2) { g.strokeStyle = PAL.accent; g.lineWidth = lw(7); for (const dir of [-1, 1]) { const xr = src + dir * R; g.beginPath(); for (let k = -60; k <= 60; k += 10) { const x = xr + k, b = amp * Math.exp(-Math.pow(k / 90, 2)); k === -60 ? g.moveTo(sx(x), sy(-b)) : g.lineTo(sx(x), sy(-b)); } g.stroke(); } }
  g.restore();
}
function rippleAt(x, t) { const u = t - EV.splash; if (u <= 0) return 0; const R = u * 2600, d = Math.abs(x - XP); return Math.exp(-Math.pow((d - R) / 160, 2)) * Math.exp(-u * 1.2); }
// the puddle: two short grey strokes under the line, and the splash: rings drawn as arcs, drops as small ink dots
function puddle(t) {
  g.save(); g.strokeStyle = PAL.mute; g.lineCap = 'round'; g.lineWidth = lw(5);
  for (const [dy, w] of [[14, 170], [30, 110]]) { g.beginPath(); g.moveTo(sx(XP - w), sy(dy)); g.lineTo(sx(XP + w), sy(dy)); g.stroke(); }
  for (const c of RUN.contacts) { const u = t - c.t0; if (u < 0 || u > .55) continue; const hero = c === SPL;
    for (let j = 0; j < (hero ? 7 : 3); j++) { const a = -Math.PI / 2 + (hash(j * 7 + c.t0) - .5) * 2.2, sp = (hero ? 900 : 500) * (.6 + hash(j * 3 + c.t0) * .6), x = c.x + Math.cos(a) * sp * u, y = Math.sin(a) * sp * u * 1.2 + 2600 * u * u; if (y > 0) continue;
      g.fillStyle = hero ? PAL.ink : PAL.mute; g.beginPath(); g.arc(sx(x), sy(y), Math.max(2, 9 * CAM.z), 0, TAU); g.fill(); } }
  g.restore();
}
const COMMUTERS = [...Array(24)].map((_, i) => ({ x: XP + 900 + i * 760 + hash(i) * 160, ph: hash(i * 3.3) * TAU }));
const STATION = XP + 900 + 24 * 760 + 400;
// type: one big number + one line saying what it means, left on the 124 px margin; slides up while fading in
function hud(t) {
  const tin = (t0, d = .4) => eo(seg(t, t0, t0 + d));
  if (t >= 7.5 && t < 9.375) {
    const a = tin(7.52, .45), sec = 41 + Math.floor(t - EV.watchHit);
    g.save(); g.globalAlpha = a; g.fillStyle = PAL.ink; g.font = '600 150px Jost'; g.letterSpacing = '-2px'; g.textBaseline = 'alphabetic';
    const y = 300 + (1 - a) * 22; g.fillText('23:58:', 124, y); const w = g.measureText('23:58:').width; g.fillStyle = PAL.accent; g.fillText(String(sec).padStart(2, '0'), 124 + w, y);
    const b = tin(7.75, .45); g.globalAlpha = b; g.fillStyle = PAL.ink; g.font = '500 44px Jost'; g.letterSpacing = '0px'; g.fillText('The last train leaves at 23:59.', 124, 372 + (1 - b) * 16);
    g.restore();
  }
}
function render(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.drawImage(PAPER, 0, 0);
  const [t0, , id] = shotAt(t), lt = t - t0, px = RUN.pelvisAt(t)[0];
  if (id === 'S1') CAM = { x: XP + 260, y: -220, z: lerp(.95, 1.0, eio(lt / 2.5)) };
  else if (id === 'S2') CAM = { x: px + 420, y: -330, z: .5 };
  else if (id === 'S3') { const u = eio(seg(lt, 0, 1.875)); CAM = { x: px + lerp(420, -380, u), y: lerp(-330, -540, u), z: Math.exp(lerp(Math.log(.5), Math.log(.72), u)) }; }
  else { const u = eio(seg(lt, 0, .625)); CAM = { x: lerp(px - 380, px + 3600, u), y: lerp(-540, -280, u), z: Math.exp(lerp(Math.log(.72), Math.log(.16), u)) }; }
  const x0 = CAM.x - W * .5 / CAM.z - 200, x1 = CAM.x + W * .5 / CAM.z + 200;
  groundLine(x0, x1, XP, EV.splash, t);
  puddle(t);
  // the station: a node on the line that fills on the chime
  if (STATION > x0 && STATION < x1) { const u = t - EV.chime, f = u > 0 ? back(clamp(u / .3), 2) : 0; g.save(); g.lineWidth = lw(8); g.strokeStyle = PAL.ink; g.beginPath(); g.arc(sx(STATION), sy(0), 60 * CAM.z / .633 * .7, 0, TAU); g.fillStyle = f > 0 ? PAL.accent : PAL.paper; g.fill(); g.stroke(); g.restore(); }
  // the commuters react as the ripple reaches them, then turn to look at her as she passes (one phase each, never in unison)
  for (const c of COMMUTERS) { if (c.x < x0 || c.x > x1) continue; const rr = rippleAt(c.x, t), look = clamp((c.x - px) / 900) > 0 ? -.4 : .4 * ss(clamp((px - c.x) / 600));
    const J = solveProfile(standPose(c.x, c.ph, t, rr, look)); stick(J, PAL.mute, false); }   // a step behind the line, in the supporting grey: she passes in front of them
  if (!(id === 'S1' && (t < .3 || t > 1.9))) stick(solveProfile(poseAt(t)), PAL.ink, true);
  hud(t);
}
window.DUR = DUR; window.render = render;
window.TEXTS = t => (t >= 7.52 && t < 9.375 ? [{ text: '23:58:' + (41 + Math.floor(t - EV.watchHit)), box: { x0: 124, y0: 170, x1: 900, y1: 320 } }, { text: 'The last train leaves at 23:59.', box: { x0: 124, y0: 330, x1: 820, y1: 384 } }] : []);
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
