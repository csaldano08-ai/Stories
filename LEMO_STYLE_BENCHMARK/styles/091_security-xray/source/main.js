// 091 · Security X-ray — the first 10 s of "Last Train Home" through the screening console of a station's night lane
// (lemo-opuscar styles/security-xray). Objects are never shown, only their dual-energy X-ray image; the operator exists only
// as actions on the screen. AKI is outside the screen: through the booth glass, 2D and out of focus, as the style allows.
//   S1  wide booth: through the glass the wet street; AKI runs past the lamp and splashes through the puddle at 0.94 s
//   S2  push into the screen; her tray crosses the scan curtain (grey preview → colour); at 6.05 s the operator boxes the watch
//       she put in it and zooms: the steel hands read 11:58 (box, zoom, read); at 7.15 the reading closes, the CT key lights
//   S3  into CT (a dim digital tear): the watch as a turning volume; the second hand moves 47 → 48 at 8.4 s (something moves)
//   S4  scan sweep back to the console; the verdict CLEAR stamps on the chime (9.58 s) with the clear tone
// No rule is quoted because nothing is flagged: the only verdict is the routine CLEAR. Engine: the library's demo xr.js (unchanged).
import { THREE, V, makeEngine, clamp, lerp, seg, eio, eo, ss, back } from './xr.js';
import { akiTray } from './props.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { hash, mulberry } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080, TAU = Math.PI * 2;
await Promise.all(['400 20px PM', '500 20px PM', '500 40px OS', '700 40px OS'].map(f => document.fonts.load(f, 'A0')));
const E = makeEngine(W, H);
const out = document.getElementById('out'); out.width = W; out.height = H; const g = out.getContext('2d');
const winC = document.createElement('canvas'); winC.width = W / 2; winC.height = H / 2; const wg = winC.getContext('2d');

// ═════════ the run (shared by every style)
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const X = t => RUN.pelvisAt(t)[0];
const poseAt = t => RUN.pose(t);   // through the glass she never raises the watch: it is in the tray
const W_T = t => 11 * 3600 + 58 * 60 + 48 + (t - 8.4);
const clk = t => { const s = Math.floor(W_T(t) + 12 * 3600 + 1e-6) % 86400; return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(v => String(v).padStart(2, '0')).join(':'); };

// ═════════ the tray and the main (top) view
const TR = akiTray(); E.scene.add(TR.it);
const MON = [30, 22, 1860, 1004], SCR = [58, 48, 1804, 952];
const MAIN = [82, 112, 1380, 690], RC = 1492, RW = 344;
const HALFW = .42, HALFH = HALFW * MAIN[3] / MAIN[2], CD = 3.1, YREF = .07, CURT = .86;
const mainV = E.makeView(10, 1.3), ctV = E.makeView(28, 1.0);
function setTop(v, fx, fz, Z) { const hh = HALFH / Z; v.cam.position.set(fx, YREF + CD, fz + 1e-4); v.look.set(fx, YREF, fz); v.up.set(0, 0, -1); v.fov = 2 * Math.atan(hh / CD) * 180 / Math.PI; }
function topToU(Zs, x, y, z) { const k = CD / (CD + YREF - y); return [.5 + (x - Zs.fx) * k * Zs.Z / (2 * HALFW), .5 + (z - Zs.fz) * k * Zs.Z / (2 * HALFH)]; }
function topToD(Zs, x, y, z) { const [u, v] = topToU(Zs, x, y, z); return [MAIN[0] + u * MAIN[2], MAIN[1] + v * MAIN[3]]; }
// the belt: the tray enters from the right at 0.36 m/s, crosses the curtain and brakes to rest (a real belt has inertia)
const T_IN = 2.75, T_BRAKE = 4.25, X_REST = 0, VB = .36, DB = .32;
function trayX(t) { if (t < T_BRAKE) return X_REST + VB * DB / 2 + VB * (T_BRAKE - t); const u = Math.min(t - T_BRAKE, DB); return X_REST + VB * DB / 2 - VB * (u - u * u / (2 * DB)); }
const beltSpeed = t => t < T_BRAKE ? VB : Math.max(0, VB * (1 - (t - T_BRAKE) / DB));
const beltPhase = t => t < T_BRAKE ? VB * t : VB * T_BRAKE + VB * (Math.min(t - T_BRAKE, DB) - Math.min(t - T_BRAKE, DB) ** 2 / (2 * DB));
const WATCHP = () => TR.watch.g.getWorldPosition(new THREE.Vector3());
// operator events
const OP = { mark: EV.watchUp, zoom0: EV.watchUp + .08, zoom1: EV.watchUp + .5, label: EV.watchUp + .32, close: EV.watchDown, ctKey: EV.watchDown + .12, tear: 7.42, ctOn: 7.5, out0: 9.3, out1: 9.52, verdict: EV.chime };
function zoomAt(t) {
  if (t < OP.zoom0) return { Z: 1, fx: 0, fz: 0 };
  const p = (TR.it.position.x = trayX(t), TR.it.updateMatrixWorld(true), WATCHP());
  const k = eio(seg(t, OP.zoom0, OP.zoom1)) * (t < OP.out0 ? 1 : 1 - eio(seg(t, OP.out0, OP.out1)));
  return { Z: lerp(1, 5.4, k), fx: lerp(0, p.x + .016, k), fz: lerp(0, p.z - .002, k) };
}
function setHands(t) {
  const s = W_T(t), sec = Math.floor(s + 1e-6) % 60, mn = 58 + (s % 60) / 60, H = TR.watch.H;
  H.s.rotation.y = -sec / 60 * TAU; H.m.rotation.y = -mn / 60 * TAU; H.h.rotation.y = -(11 + mn / 60) / 12 * TAU;
}

// ═════════ 2D camera outside the screen (design px), and helpers
let CAM = { x: 960, y: 540, z: 1 };
const camT = () => g.setTransform(CAM.z, 0, 0, CAM.z, 960 - CAM.x * CAM.z, 540 - CAM.y * CAM.z), idT = () => g.setTransform(1, 0, 0, 1, 0, 0);
const rectScr = r => [(r[0] - CAM.x) * CAM.z + 960, (r[1] - CAM.y) * CAM.z + 540, r[2] * CAM.z, r[3] * CAM.z];
function camAt(t) {
  const K = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k) });
  const A = { x: 960, y: -40, z: .5 }, A2 = { x: 950, y: -10, z: .54 }, B = { x: 960, y: 540, z: 1 }, B2 = { x: 940, y: 520, z: 1.04 };
  if (t < 2.5) return K(A, A2, ss(t / 2.5));
  if (t < 7.5) return t < 3.35 ? K(A2, B, eio(seg(t, 2.5, 3.35))) : K(B, B2, ss(seg(t, 3.35, 7.5)));
  return K(B2, { x: 960, y: 540, z: 1 }, eio(seg(t, 9.375, 9.7)));
}
const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
function txt(s, x, y, size, col, align = 'left', w = 400, fam = 'PM') { g.font = `${w} ${size}px ${fam}`; g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(s, x, y); }
const C = { org: 'rgb(255,133,26)', mix: 'rgb(115,235,51)', met: 'rgb(46,122,255)', amber: 'rgba(255,178,58,.98)', green: 'rgba(96,232,140,.98)', state: 'rgba(150,205,255,.95)', ui: 'rgba(175,200,240,.82)', uiDim: 'rgba(140,165,210,.55)' };

// ═════════ through the glass: the street at night, 2D, parallaxed and out of focus (half-resolution layer)
const R0 = mulberry(91), BLD = Array.from({ length: 9 }, (_, i) => ({ x: -200 + i * 330 + R0() * 80, w: 220 + R0() * 120, h: 170 + R0() * 150, win: Array.from({ length: 14 }, () => [R0(), R0(), R0() < .45]) }));
const RAIN = Array.from({ length: 160 }, () => [R0() * 2400 - 200, R0() * 1400, .6 + R0() * .8]);
const sx = xr => 240 + (xr - X(0)) * .26, GROUND = 360, LAMPX = sx(SPL.x + 44) + 70;   // 0.26 px per rig unit through the glass
function drawStreet(t) {
  const q = .5; wg.setTransform(q, 0, 0, q, 0, 0);
  const sky = wg.createLinearGradient(0, 0, 0, GROUND); sky.addColorStop(0, '#04070f'); sky.addColorStop(1, '#0d1424'); wg.fillStyle = sky; wg.fillRect(0, 0, W, H);
  for (const b of BLD) { wg.fillStyle = '#070a12'; wg.fillRect(b.x, GROUND - 40 - b.h, b.w, b.h + 40);
    b.win.forEach(([u, v, on], i) => { if (!on) return; wg.fillStyle = i % 3 ? 'rgba(255,196,120,.55)' : 'rgba(170,200,255,.4)'; wg.fillRect(b.x + 18 + u * (b.w - 60), GROUND - 60 - b.h + 20 + v * (b.h - 90), 26, 34); }); }
  // wet road and pavement, the lamp's long reflection
  const rd = wg.createLinearGradient(0, GROUND, 0, H); rd.addColorStop(0, '#141a26'); rd.addColorStop(1, '#06080d'); wg.fillStyle = rd; wg.fillRect(0, GROUND, W, H - GROUND);
  wg.fillStyle = '#1a2130'; wg.fillRect(0, GROUND - 6, W, 10);
  const refl = wg.createLinearGradient(0, GROUND, 0, H); refl.addColorStop(0, 'rgba(255,190,110,.5)'); refl.addColorStop(1, 'rgba(255,190,110,0)'); wg.fillStyle = refl; wg.fillRect(LAMPX - 30, GROUND, 60, H - GROUND);
  // lamp post and head with its halo and pool
  wg.fillStyle = '#0b0e15'; wg.fillRect(LAMPX - 6, GROUND - 300, 12, 300); wg.fillRect(LAMPX - 6, GROUND - 300, 70, 10);
  const halo = wg.createRadialGradient(LAMPX + 58, GROUND - 285, 0, LAMPX + 58, GROUND - 285, 240); halo.addColorStop(0, 'rgba(255,214,150,.95)'); halo.addColorStop(.12, 'rgba(255,190,110,.5)'); halo.addColorStop(1, 'rgba(255,170,90,0)'); wg.fillStyle = halo; wg.fillRect(LAMPX - 200, GROUND - 540, 520, 520);
  const pool = wg.createRadialGradient(LAMPX + 40, GROUND + 30, 0, LAMPX + 40, GROUND + 30, 300); pool.addColorStop(0, 'rgba(255,190,110,.32)'); pool.addColorStop(1, 'rgba(255,190,110,0)'); wg.fillStyle = pool; wg.fillRect(LAMPX - 300, GROUND - 40, 680, 200);
  // the puddle (a bright smear of the lamp) and, after 0.94 s, its rings
  const px = sx(SPL.x + 44); wg.fillStyle = 'rgba(255,200,130,.42)'; wg.beginPath(); wg.ellipse(px, GROUND + 8, 70, 9, 0, 0, TAU); wg.fill();
  const a = t - SPL.t0;
  if (a > 0) { for (let k = 0; k < 3; k++) { const u = (a - k * .12) / .9; if (u <= 0 || u >= 1) continue; wg.strokeStyle = `rgba(255,232,195,${.95 * (1 - u)})`; wg.lineWidth = 6; wg.beginPath(); wg.ellipse(px, GROUND + 8, 20 + 110 * eo(u), 3 + 14 * eo(u), 0, 0, TAU); wg.stroke(); }
    if (a < .75) for (let i = 0; i < 18; i++) { const th = Math.PI * (.08 + .84 * hash(i)), sp = 300 + 420 * hash(i * 3), y = GROUND - (Math.sin(th) * sp * a - 900 * a * a); if (y > GROUND + 6) continue;
      const x = px + Math.cos(th) * sp * .7 * a; const dg = wg.createRadialGradient(x, y, 0, x, y, 22); dg.addColorStop(0, 'rgba(255,244,215,1)'); dg.addColorStop(.35, 'rgba(255,230,185,.8)'); dg.addColorStop(1, 'rgba(255,220,170,0)'); wg.fillStyle = dg; wg.fillRect(x - 22, y - 22, 44, 44); } }
  // AKI: a running figure from the rig (2D, out of focus: simple filled limbs in her colours)
  const J = solveProfile(poseAt(t)), U = .26, P = p => [sx(p[0]), GROUND + p[1] * U];
  const limb = (a2, b2, w, c) => { const [x0, y0] = P(a2), [x1, y1] = P(b2); wg.strokeStyle = c; wg.lineWidth = w; wg.lineCap = 'round'; wg.beginPath(); wg.moveTo(x0, y0); wg.lineTo(x1, y1); wg.stroke(); };
  const shade = k => k === 'f' ? .62 : 1, mix = (c, k) => `rgb(${c.map(v => Math.round(v * k)).join(',')})`;
  for (const k of ['f', 'n']) { const l = J.leg[k], s = shade(k); limb(l.hip, l.knee, 32, mix([112, 106, 138], s)); limb(l.knee, l.ankle, 24, mix([112, 106, 138], s)); limb(l.ankle, [l.ankle[0] + 38 * Math.cos(l.pitch), l.ankle[1] + 38 * Math.sin(l.pitch)], 20, mix([150, 98, 70], s));
    if (k === 'f') { const am = J.arm.f; limb(am.sh, am.el, 26, mix([228, 71, 45], .62)); limb(am.el, am.wr, 20, mix([228, 71, 45], .62)); } }
  const TT = (b, u, f) => [b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f];
  { const cp = [TT(J.neckBase, 6, -24), TT(J.waist, 0, -38), TT(J.pelvis, -86, -46), TT(J.pelvis, -90, 40), TT(J.waist, 0, 32), TT(J.neckBase, -6, 26)].map(P); wg.fillStyle = 'rgb(228,71,45)'; wg.beginPath(); cp.forEach(([x, y], i) => i ? wg.lineTo(x, y) : wg.moveTo(x, y)); wg.closePath(); wg.fill();
    wg.strokeStyle = 'rgba(255,200,140,.55)'; wg.lineWidth = 5; wg.beginPath(); wg.moveTo(...cp[3]); wg.lineTo(...cp[4]); wg.lineTo(...cp[5]); wg.stroke(); }   // warm rim from the lamp ahead of her
  { const am = J.arm.n; limb(am.sh, am.el, 26, 'rgb(240,96,64)'); limb(am.el, am.wr, 20, 'rgb(240,96,64)'); const [hx, hy] = P(am.wr); wg.fillStyle = '#e8c3b0'; wg.beginPath(); wg.arc(hx, hy, 10, 0, TAU); wg.fill(); }
  { const [hx, hy] = P(J.headC); wg.fillStyle = '#e8c3b0'; wg.beginPath(); wg.arc(hx, hy, 30, 0, TAU); wg.fill(); wg.fillStyle = '#2a1830'; wg.beginPath(); wg.arc(hx - 6, hy - 6, 30, Math.PI * .75, Math.PI * 2.1); wg.fill(); limb([J.headC[0] - 60, J.headC[1] - 10], [J.headC[0] - 150, J.headC[1] + 20], 18, '#2a1830'); }
  // her reflection on the wet road (faint)
  // rain: soft streaks
  wg.strokeStyle = 'rgba(170,195,235,.16)'; wg.lineWidth = 2; for (const [x, y, s] of RAIN) { const yy = (y + t * 900 * s) % 1400 - 100; wg.beginPath(); wg.moveTo(x, yy); wg.lineTo(x - 6, yy + 40 * s); wg.stroke(); }
}
function drawGlass(t) {
  // the window fills the booth wall above the desk; parallax 0.35 of the camera, blur from depth of field
  drawStreet(t);
  const bz = .62 + CAM.z * .38, bx = 960 + (CAM.x - 960) * .35, by = 540 + (CAM.y - 540) * .35;
  idT(); g.save(); g.filter = `blur(${(3.5 + 6 * (CAM.z - .5)).toFixed(1)}px)`;
  g.setTransform(bz, 0, 0, bz, 960 - bx * bz, 540 - by * bz); g.drawImage(winC, -192, -108, W * 1.2, H * 1.2);
  g.restore();
  // window frame: mullions and transom (sharp-ish, nearer), a faint reflection of the monitor in the glass
  camT(); g.fillStyle = '#05070b';
  for (const x of [-640, 2040]) g.fillRect(x - 14, -1200, 28, 2300); g.fillRect(-1400, -820, 4800, 26); g.fillRect(-1400, 1005, 4800, 1000);
  const rf = g.createLinearGradient(0, -900, 0, 1000); rf.addColorStop(0, 'rgba(120,160,230,0)'); rf.addColorStop(1, 'rgba(120,160,230,.05)'); g.fillStyle = rf; g.fillRect(-1400, -900, 4800, 1900);
}
// the booth: desk, keyboard, monitor bezel
const KEYS = ['STOP', '◀', '▶', 'OS', 'MS', 'HI', 'Z+', 'Z−', 'MARK', 'CT', 'CLR', 'INV'];
const keyLit = (k, t) => (k === 'MARK' && t > OP.mark && t < OP.mark + .35) || (k === 'Z+' && t > OP.zoom0 && t < OP.zoom1) || (k === 'CT' && t > OP.ctKey && t < OP.tear + .1) || (k === 'CLR' && t > OP.verdict - .12 && t < OP.verdict + .3);
function drawBooth(t) {
  camT();
  let gr = g.createLinearGradient(0, 1020, 0, 1700); gr.addColorStop(0, '#15171b'); gr.addColorStop(1, '#050607'); g.fillStyle = gr; g.fillRect(-1600, 1018, 5200, 900);
  const sg = g.createRadialGradient(960, 1030, 0, 960, 1030, 900); sg.addColorStop(0, 'rgba(110,140,210,.2)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.fillRect(-100, 1020, 2100, 900);
  g.fillStyle = '#0f1114'; g.beginPath(); g.moveTo(440, 1088); g.lineTo(1480, 1088); g.lineTo(1580, 1330); g.lineTo(340, 1330); g.closePath(); g.fill();
  KEYS.forEach((k, i) => { const row = Math.floor(i / 6), col = i % 6, y = 1118 + row * 92, sc = 1 + row * .08, x0 = 960 - 6 * 140 * sc / 2 + col * 140 * sc, lit = keyLit(k, t);
    g.fillStyle = lit ? '#3c4654' : '#1e2126'; rr(x0 + 10, y, 120 * sc, 66, 8); g.fill();
    g.fillStyle = lit ? 'rgba(120,220,255,1)' : 'rgba(70,80,90,.7)'; g.beginPath(); g.arc(x0 + 26, y + 14, 5, 0, TAU); g.fill();
    txt(k, x0 + 10 + 60 * sc, y + 38, 24, lit ? 'rgba(220,240,255,.95)' : 'rgba(150,160,175,.6)', 'center', 500); });
  const [mx, my, mw, mh] = MON; g.save(); g.shadowColor = 'rgba(0,0,0,.85)'; g.shadowBlur = 40; rr(mx, my, mw, mh, 16);
  const bz = g.createLinearGradient(0, my, 0, my + mh); bz.addColorStop(0, '#1b1e23'); bz.addColorStop(1, '#0c0d10'); g.fillStyle = bz; g.fill(); g.restore();
  rr(SCR[0], SCR[1], SCR[2], SCR[3], 4); g.fillStyle = '#03070c'; g.fill();
  g.fillStyle = '#0c0d10'; g.fillRect(860, 1026, 200, 60);
}
// ═════════ console chrome (machine voice: monospace, English, upper case)
function panel(x, y, w, h, title) { rr(x, y, w, h, 4); g.fillStyle = 'rgba(12,22,38,.6)'; g.fill(); g.strokeStyle = 'rgba(110,160,255,.26)'; g.lineWidth = 1.2; g.stroke(); if (title) txt(title, x + 12, y + 17, 16, 'rgba(160,190,240,.7)', 'left', 500); }
function statusAt(t) {
  if (t >= OP.verdict) return ['CLEAR', C.green];
  if (t >= OP.ctKey && t < OP.out0) return ['CT', C.state];
  if (t >= OP.mark) return ['REVIEW', C.state];
  if (t >= T_IN && t < T_BRAKE + DB) return ['SCANNING', C.state];
  return t < T_IN ? ['READY', C.uiDim] : ['IMAGE', C.state];
}
function chrome(t, Zs) {
  camT();
  txt('LANE 1', 96, 82, 22, 'rgba(210,228,255,.95)', 'left', 500); txt('STATION ENTRANCE · NIGHT SERVICE', 196, 82, 20, C.ui, 'left', 500);
  txt(`BELT ${beltSpeed(t).toFixed(2)} m/s`, 720, 82, 20, C.uiDim); txt(`ZOOM ×${Zs.Z.toFixed(1)}`, 960, 82, 20, Zs.Z > 1.01 ? C.state : C.uiDim);
  txt('DUAL-ENERGY COLOUR', MAIN[0] + MAIN[2] - 8, 82, 20, C.ui, 'right', 500);
  rr(MAIN[0], MAIN[1], MAIN[2], MAIN[3], 2); g.strokeStyle = 'rgba(120,170,255,.35)'; g.lineWidth = 1.2; g.stroke();
  txt('TOP', MAIN[0] + 10, MAIN[1] + 18, 16, C.uiDim, 'left', 500);
  if (t > T_IN) txt(`TRAY 0047  ${clk(t)}`, MAIN[0] + MAIN[2] - 12, MAIN[1] + 20, 18, 'rgba(200,220,255,.75)', 'right', 500);   // the image stamp
  // the curtain mark on the frame edge
  const cx = MAIN[0] + CURT * MAIN[2]; g.strokeStyle = 'rgba(150,205,255,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, MAIN[1] - 10); g.lineTo(cx, MAIN[1]); g.moveTo(cx, MAIN[1] + MAIN[3]); g.lineTo(cx, MAIN[1] + MAIN[3] + 10); g.stroke();
  // right column: clock, tray counter, status, legend
  const x = RC, w = RW;
  panel(x, MAIN[1], w, 124, 'TIME'); txt(clk(t), x + w / 2, MAIN[1] + 76, 58, 'rgba(225,238,255,.97)', 'center', 500);
  panel(x, MAIN[1] + 140, w, 124, 'TRAYS TONIGHT'); txt(t > T_IN + .6 ? '0047' : '0046', x + w / 2, MAIN[1] + 216, 58, 'rgba(225,238,255,.97)', 'center', 500);
  const [sw, sc] = statusAt(t); panel(x, MAIN[1] + 280, w, 104, 'STATUS');
  if (sw === 'CLEAR') { rr(x + 1, MAIN[1] + 281, w - 2, 102, 4); g.fillStyle = 'rgba(40,140,80,.18)'; g.fill(); }
  txt(sw, x + w / 2, MAIN[1] + 342, 34, sc, 'center', 500);
  panel(x, MAIN[1] + 400, w, 190, 'MATERIAL');
  [['ORGANIC', C.org], ['MIXED', C.mix], ['METAL', C.met], ['OPAQUE', '#000']].forEach(([n, c], i) => { const yy = MAIN[1] + 448 + i * 36; rr(x + 16, yy - 11, 40, 22, 3); g.fillStyle = c; g.fill(); g.strokeStyle = 'rgba(160,190,240,.4)'; g.stroke(); txt(n, x + 70, yy + 1, 18, C.ui, 'left', 500); });
  // bottom strip under the image: what the machine is doing
  panel(MAIN[0], MAIN[1] + MAIN[3] + 16, MAIN[2], 92, null);
  txt('CURTAIN', MAIN[0] + 18, MAIN[1] + MAIN[3] + 46, 16, C.uiDim, 'left', 500); txt(t >= T_IN && t < T_BRAKE + .1 ? 'X-RAY ON · 160 kV' : 'X-RAY STANDBY', MAIN[0] + 18, MAIN[1] + MAIN[3] + 76, 20, t >= T_IN && t < T_BRAKE + .1 ? C.amber : C.ui, 'left', 500);
  txt('VIEW', MAIN[0] + 420, MAIN[1] + MAIN[3] + 46, 16, C.uiDim, 'left', 500); txt(t > OP.ctKey && t < OP.out0 ? 'CT RECON' : 'TOP · DUAL-ENERGY', MAIN[0] + 420, MAIN[1] + MAIN[3] + 76, 20, C.ui, 'left', 500);
  txt('OPERATOR', MAIN[0] + 840, MAIN[1] + MAIN[3] + 46, 16, C.uiDim, 'left', 500); txt('LOCAL · LANE 1', MAIN[0] + 840, MAIN[1] + MAIN[3] + 76, 20, C.ui, 'left', 500);
}
// operator's box: dragged open from the top-left corner in 0.25 s
function markBox(x0, y0, x1, y1, k, col, lw = 3) { if (k <= 0) return; const e = eo(k), w = (x1 - x0) * e, h = (y1 - y0) * e; g.strokeStyle = col; g.lineWidth = lw; g.strokeRect(x0, y0, w, h); }
function opLabel(head, sub, x, y, col, a = 1) {   // operator voice: a bold sans over a monospace line
  g.save(); g.globalAlpha = a; g.font = '700 42px OS'; const w1 = g.measureText(head).width; g.font = '400 20px PM'; const w2 = g.measureText(sub).width; const w = Math.max(w1, w2) + 44;
  rr(x, y, w, 104, 6); g.fillStyle = 'rgba(5,12,24,.88)'; g.fill(); g.strokeStyle = 'rgba(120,170,255,.45)'; g.lineWidth = 1.5; g.stroke();
  g.fillStyle = col; g.fillRect(x, y + 10, 3, 84);
  txt(head, x + 22, y + 40, 42, col, 'left', 700, 'OS'); txt(sub, x + 22, y + 78, 20, 'rgba(200,220,250,.85)', 'left', 400); g.restore();
}
function stampClear(x, y, k) {
  if (k <= 0) return; const s = back(k, 2.2), a = clamp(k * 3);
  g.save(); g.translate(x, y); g.scale(1.5 - .5 * s, 1.5 - .5 * s); g.globalAlpha = a;
  rr(-230, -64, 460, 128, 8); g.fillStyle = 'rgba(8,30,18,.9)'; g.fill(); g.strokeStyle = C.green; g.lineWidth = 4; g.stroke();
  g.strokeStyle = C.green; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-188, -4); g.lineTo(-160, 24); g.lineTo(-112, -30); g.stroke();
  txt('CLEAR', -84, -8, 54, 'rgba(160,250,190,.99)', 'left', 700, 'OS'); txt(`TRAY 0047 · ${clk(OP.verdict)}`, -84, 38, 20, 'rgba(160,250,190,.85)', 'left', 500);
  g.restore();
}

// ═════════ frames
function consoleFrame(t) {
  CAM = camAt(t); TR.it.position.set(trayX(t), 0, 0); setHands(t); TR.it.updateMatrixWorld(true);
  const Zs = zoomAt(t); TR.it.position.x = trayX(t); TR.it.updateMatrixWorld(true);
  E.renderer.setRenderTarget(null); E.renderer.setClearColor(0x000000, 1); E.renderer.clear();
  setTop(mainV, Zs.fx, Zs.fz, Zs.Z);
  const ms = rectScr(MAIN);
  const scanning = t < T_BRAKE + DB + .1, visible = t > T_IN - .3;
  let hot = null;
  const wp = WATCHP();
  if (t > OP.mark && t < OP.out1) { const [u0, v0] = topToU(Zs, wp.x - .027, .012, wp.z - .03), [u1, v1] = topToU(Zs, wp.x + .027, .012, wp.z + .03); hot = [u0, v0, (u1 - u0) * seg(t, OP.mark, OP.mark + .25), v1 - v0]; }
  if (visible && E.renderView(mainV, ms, [TR.it])) E.drawView(mainV, { split: scanning ? CURT : 2, belt: beltPhase(t) / (2 * HALFW) * Zs.Z, beltK: 32 / Zs.Z, hot });
  else if (E.renderView(mainV, ms, [])) E.drawView(mainV, { split: 2, belt: beltPhase(t) / (2 * HALFW), beltK: 32 });
  // 2D
  idT(); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none'; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  drawGlass(t); drawBooth(t);
  idT(); if (mainV.vis) { const [x, y, w, h] = mainV.vis; g.drawImage(E.glc, x, y, w, h, x, y, w, h);
    g.save(); g.globalCompositeOperation = 'lighter'; g.beginPath(); g.rect(x, y, w, h); g.clip(); g.filter = `blur(${(8 * CAM.z).toFixed(1)}px)`; g.globalAlpha = .3; g.drawImage(E.glc, x, y, w, h, x, y, w, h); g.restore(); }
  chrome(t, Zs);
  // the operator: box, zoom, read
  camT(); g.save(); rr(MAIN[0], MAIN[1], MAIN[2], MAIN[3], 2); g.clip();
  if (t > OP.mark && t < OP.out1) {
    const a = topToD(Zs, wp.x - .027, .012, wp.z - .03), b = topToD(Zs, wp.x + .027, .012, wp.z + .03);
    g.globalAlpha = 1 - seg(t, OP.out0, OP.out1); markBox(a[0], a[1], b[0], b[1], seg(t, OP.mark, OP.mark + .25), 'rgba(235,245,255,.95)', 3); g.globalAlpha = 1;
    const la = seg(t, OP.label, OP.label + .2) * (1 - seg(t, OP.close, OP.close + .2));
    if (la > 0) { const lx = Math.min(b[0] + 40, MAIN[0] + MAIN[2] - 420), ly = MAIN[1] + 60; g.strokeStyle = 'rgba(235,245,255,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(b[0], a[1] + 30); g.lineTo(lx, ly + 52); g.stroke();
      opLabel('WATCH · 11:58', 'STEEL HANDS, READ IN THE IMAGE', lx, ly, 'rgba(235,245,255,.99)', la); }
    if (t > OP.ctKey && t < OP.tear + .1) txt('CT  ▸  RECONSTRUCT TRAY 0047', MAIN[0] + 24, MAIN[1] + MAIN[3] - 34, 22, C.state, 'left', 500);
  }
  g.restore();
  if (t > OP.verdict - .02) { camT(); stampClear(MAIN[0] + MAIN[2] - 250, MAIN[1] + MAIN[3] + 62, seg(t, OP.verdict, OP.verdict + .3)); }
  // glass of the screen: scanlines, a sheen; vignette
  camT(); g.save(); rr(SCR[0], SCR[1], SCR[2], SCR[3], 4); g.clip(); g.fillStyle = 'rgba(0,0,0,.13)'; for (let y = SCR[1]; y < SCR[1] + SCR[3]; y += 3) g.fillRect(SCR[0], y, SCR[2], 1);
  const sh = g.createLinearGradient(SCR[0], SCR[1], SCR[0] + SCR[2] * .6, SCR[1] + SCR[3]); sh.addColorStop(0, 'rgba(255,255,255,.045)'); sh.addColorStop(.4, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(SCR[0], SCR[1], SCR[2], SCR[3]); g.restore();
  // the scan sweep back from CT (S4): the console image comes in behind a line moving right to left (the belt's way)
  if (t > OP.out0 && t < OP.out0 + .25) { idT(); const u = 1 - eio(seg(t, OP.out0, OP.out0 + .25)), xl = u * W; if (xl > 1) g.drawImage(ctSnap, 0, 0, xl, H, 0, 0, xl, H);   // old CT left of the line, the console behind it
    const lg = g.createLinearGradient(xl - 30, 0, xl + 30, 0); lg.addColorStop(0, 'rgba(150,210,255,0)'); lg.addColorStop(.5, 'rgba(180,225,255,.85)'); lg.addColorStop(1, 'rgba(150,210,255,0)'); g.fillStyle = lg; g.fillRect(xl - 30, 0, 60, H); }
  vignette(.38);
}
const ctSnap = document.createElement('canvas'); ctSnap.width = W; ctSnap.height = H; const ctG = ctSnap.getContext('2d');
function vignette(k) { idT(); const vg = g.createRadialGradient(W / 2, H / 2, H * .33, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${k})`); g.fillStyle = vg; g.fillRect(0, 0, W, H); }
function ctFrame(t, toSnap = false) {
  setHands(t); TR.it.position.set(0, 0, 0); TR.it.updateMatrixWorld(true);
  const c = TR.watch.g.getWorldPosition(new THREE.Vector3()).add(V(0, .001, 0));
  const u = seg(t, OP.ctOn, OP.out0), az = lerp(-1.15, .55, eio(u)), el = lerp(1.25, .78, eio(u)), r = lerp(.17, .118, ss(u));
  ctV.cam.position.set(c.x + r * Math.sin(az) * Math.cos(el), c.y + r * Math.sin(el), c.z + r * Math.cos(az) * Math.cos(el)); ctV.look.copy(c); ctV.up.set(0, 1, 0); ctV.fov = 28;
  // only the watch is reconstructed (the rest of the tray is cropped out of the volume)
  const vis = []; TR.it.children.forEach(o => { vis.push([o, o.visible]); o.visible = o === TR.watch.g; });
  E.renderer.setRenderTarget(null); E.renderer.setClearColor(0x000000, 1); E.renderer.clear();
  const noise = .5 * Math.pow(Math.max(0, 1 - seg(t, OP.ctOn - .08, OP.ctOn + .45)), 1.5);
  E.renderView(ctV, [0, 0, W, H], [TR.it]); E.colMat.uniforms.uTime.value = t; E.drawView(ctV, { mode: 1, gain: 1.9, noise });
  vis.forEach(([o, v]) => o.visible = v);
  const G = toSnap ? ctG : g; const g0 = g;
  G.setTransform(1, 0, 0, 1, 0, 0); G.globalCompositeOperation = 'source-over'; G.globalAlpha = 1; G.filter = 'none';
  const bgr = G.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * .7); bgr.addColorStop(0, '#08142a'); bgr.addColorStop(1, '#02050a'); G.fillStyle = bgr; G.fillRect(0, 0, W, H);
  G.strokeStyle = 'rgba(90,140,230,.09)'; G.lineWidth = 1; for (let i = 1; i < 10; i++) { G.beginPath(); G.arc(960, 540, i * 95, 0, TAU); G.stroke(); }
  for (let i = 0; i < 36; i++) { const a = i / 36 * TAU + az * .5; G.strokeStyle = 'rgba(90,140,230,.045)'; G.beginPath(); G.moveTo(960 + Math.cos(a) * 150, 540 + Math.sin(a) * 150); G.lineTo(960 + Math.cos(a) * 1000, 540 + Math.sin(a) * 1000); G.stroke(); }
  G.globalCompositeOperation = 'lighter'; G.drawImage(E.glc, 0, 0); G.save(); G.filter = 'blur(10px)'; G.globalAlpha = .42; G.drawImage(E.glc, 0, 0); G.filter = 'blur(34px)'; G.globalAlpha = .24; G.drawImage(E.glc, 0, 0); G.restore(); G.globalCompositeOperation = 'source-over';
  // HUD (machine voice)
  const Mg = 56, tx = (s, x, y, sz, col, al = 'left', w = 500) => { G.font = `${w} ${sz}px PM`; G.textAlign = al; G.textBaseline = 'middle'; G.fillStyle = col; G.fillText(s, x, y); };
  G.strokeStyle = 'rgba(150,200,255,.55)'; G.lineWidth = 2; G.beginPath(); for (const [x, y, sx2, sy2] of [[Mg, Mg, 1, 1], [W - Mg, Mg, -1, 1], [Mg, H - Mg, 1, -1], [W - Mg, H - Mg, -1, -1]]) { G.moveTo(x, y + 44 * sy2); G.lineTo(x, y); G.lineTo(x + 44 * sx2, y); } G.stroke();
  tx(`CT RECONSTRUCTION · TRAY 0047 · ${clk(t)}`, Mg + 26, Mg + 33, 22, 'rgba(205,228,255,.92)');
  tx(`ANGLE ${String(Math.round(((az + 1.15) * 180 / Math.PI + 360) % 360)).padStart(3, '0')}°   SLICE ${String(96 + Math.floor((t - OP.ctOn) * 31)).padStart(3, '0')}/512`, W - Mg - 26, Mg + 33, 22, 'rgba(175,205,245,.88)', 'right');
  tx('VOLUME · WATCH ONLY', W - Mg - 26, Mg + 66, 18, 'rgba(150,180,230,.7)', 'right');
  // the second hand moves 47 → 48: the machine marks the moving part (pale blue, machine state, not a verdict)
  const H_ = TR.watch.H.s, tip = new THREE.Vector3(0, .0040, -.0146); H_.updateMatrixWorld(true); const tw = H_.localToWorld(tip.clone());
  const pr = p => { const q = p.clone().project(ctV.cam); return [(q.x * .5 + .5) * W, (.5 - q.y * .5) * H]; };
  if (t > 8.4 - .02) { const [x, y] = pr(tw), k = seg(t, 8.42, 8.62), bw = 120 * eo(k);
    G.strokeStyle = 'rgba(150,205,255,.95)'; G.lineWidth = 3; G.strokeRect(x - bw / 2, y - bw / 2, bw, bw);
    if (k > .5) { G.globalAlpha = seg(t, 8.5, 8.7); G.beginPath(); G.moveTo(x + 60, y - 60); G.lineTo(x + 170, y - 150); G.stroke();
      G.fillStyle = 'rgba(5,12,24,.88)'; G.beginPath(); G.roundRect(x + 170, y - 206, 430, 100, 6); G.fill(); G.stroke();
      tx('MOTION · 1 PART', x + 192, y - 174, 24, 'rgba(150,205,255,.97)'); tx('SECOND HAND  47 → 48 s', x + 192, y - 136, 22, 'rgba(205,228,255,.9)', 'left', 400); G.globalAlpha = 1; } }
  // vignette and scanlines
  const vg = G.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); G.fillStyle = vg; G.fillRect(0, 0, W, H);
  G.fillStyle = 'rgba(0,0,0,.1)'; for (let y = 0; y < H; y += 3) G.fillRect(0, y, W, 1);
}
// into CT: a short dim digital tear (no frame brighter than the CT that follows)
function tear(t) {
  const d = t - OP.tear; if (d < 0 || d > .16) return; const amt = 1 - Math.abs(d - .08) / .08, r = mulberry(Math.floor(t * 30) + 7);
  ctG.setTransform(1, 0, 0, 1, 0, 0); ctG.globalCompositeOperation = 'copy'; ctG.drawImage(out, 0, 0); ctG.globalCompositeOperation = 'source-over'; idT();
  for (let i = 0; i < 16; i++) { const y = r() * H, h = 6 + r() * 60, dx = (r() - .5) * 180 * amt; g.drawImage(ctSnap, 0, y, W, h, dx, y, W, h); }
  g.fillStyle = `rgba(0,0,0,${.35 * amt})`; g.fillRect(0, 0, W, H);
}

window.render = t => {
  t = clamp(+t || 0, 0, DUR);
  if (t >= OP.ctOn && t < OP.out0) ctFrame(t);
  else { if (t >= OP.out0 && t < OP.out0 + .25) ctFrame(Math.min(t, OP.out0 - .001), true); consoleFrame(t); tear(t); }
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0); window.READY = true;
