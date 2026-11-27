// 076 · Tabletop App Flythrough — the first 10 s of "Last Train Home" on a sunlit desk (lemo-opuscar styles/desktop-flythrough).
// A narrative adaptation in one take. Four printed paper cards lie along a violet route on a dotted mat: STREET (with its printed puddle),
// a phone running a route app, WATCH, STATION. AKI is a voxel toy re-voxelised every frame from the shared rig (constant bone lengths, joint
// limits, a planted foot: the toy's lattice is anchored so a planted foot stays on its spot of paper), running the route at her own pace.
//   S1  macro glide, low: she runs on the street card; at 0.94 s her far foot lands in the printed puddle: sky-blue voxel droplets burst
//       and roll, a flat ring spreads, the card's print changes to a splash and a red WET pill pops (red only for trouble)
//   S2  ride along beside her across the mat; the phone card counts her real footfalls; at 6.05 s she raises her wrist: a TIME pill
//   S3  whip and rise to 62° over the WATCH card: the numerals type in on 32nds and the seconds step to 48 at 8.4 s
//   S4  whip to the station card as she arrives: the clock-tower sticker pops into a toy on the 16th, it chimes at 9.58 s (accent ring,
//       its face lights, a shake), and the camera pulls back over the whole desk
import * as THREE from 'three';
import { card, pill, rbox } from './world.js';
import { makeMonster } from './voxel.js';
import { makeAkiVox } from './akivox.js';
import * as K from './cards.js';
import { clamp, lerp, seg, ss, eo, ei, eio, back, hash, V, arc, pop } from './anim.js';
import { solveProfile } from '../shared/aki2/aki_profile.js';
import { runner } from '../shared/aki2/motion.js';
import { DUR as D10, T as EV, CADENCE, FIRST_STEP, STEP } from '../shared/clip10.js';

export const DUR = D10, MAT = [4.8, 2.4];
const COL = K.COL, TAU = Math.PI * 2;

// ═════════ the run (shared by every style)
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const X = t => RUN.pelvisAt(t)[0];
export function poseAt(t) {
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
function figure(t, M) {
  const J = solveProfile(poseAt(t));
  const limb = (k, part) => { const a = J.arm[k], l = J.leg[k];
    if (part === 'arm') { const h = [a.wr[0] + (a.wr[0] - a.el[0]) * .25, a.wr[1] + (a.wr[1] - a.el[1]) * .25]; return [M(a.sh), M(a.el), M(a.wr), M(h)]; }
    const c = Math.cos(l.pitch), s = Math.sin(l.pitch); return [M(l.hip), M(l.knee), M(l.ankle), M([l.ankle[0] + 62 * c, l.ankle[1] + 62 * s])]; };
  const TT = (b, u, f) => M([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
  const coat = [TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)];
  const ta = SIM.tail(t); let an = Math.PI - .25 + ta[0] + J.headA, p = [J.headC[0] - Math.cos(J.headA) * 50, J.headC[1] - Math.sin(J.headA) * 50 - 10]; const tail = [M(p)];
  for (let i = 0; i < 3; i++) { const Lk = [46, 42, 36][i]; p = [p[0] + Math.cos(an) * Lk, p[1] + Math.sin(an) * Lk]; tail.push(M(p)); an += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
  const a = J.arm.n, watch = M([a.el[0] + (a.wr[0] - a.el[0]) * .84, a.el[1] + (a.wr[1] - a.el[1]) * .84]);
  return { armF: limb('f', 'arm'), legF: limb('f', 'leg'), coat, legN: limb('n', 'leg'), armN: limb('n', 'arm'), headC: M(J.headC), headA: J.headA, tail, neck: [M(J.neckBase), M(J.neckTop)], watch };
}
const W_T = t => 11 * 3600 + 58 * 60 + 48 + (t - 8.4);

// ═════════ scale: the toy's pixel grid and the desk share one lattice (rig units → voxel pixels → world units)
const KPX = .062, CELL = .0042, U = KPX * CELL, XS = -2.05, X0 = X(0), THICK = .005;
const Xq = t => X0 + Math.round((X(t) - X0) * KPX) / KPX;
const herX = t => XS + (Xq(t) - X0) * U;
const CARDS = { A: { c: [-1.7, 0], w: .9, h: .5 }, B: { c: [-.55, -.52], w: .3, h: .56 }, C: { c: [.55, .47], w: .5, h: .5 }, D: { c: [1.75, 0], w: .6, h: .5 } };
const onCard = x => (x > -2.15 && x < -1.25) || (x > 1.45 && x < 2.05), gY = x => onCard(x) ? THICK : 0;
const SX = XS + (SPL.x + 44 - X0) * U;   // the splash point (the far foot's ball at the contact)
const at = (n, u, v) => { const d = CARDS[n]; return V(d.c[0] - d.w / 2 + u / 1000, THICK, d.c[1] - d.h / 2 + v / 1000); };
const STEPS = RUN.contacts.filter(c => c.t0 >= 0);

// ═════════ card prints (1000 px per unit, drawn at 3×, redrawn only when their state changes)
const SK = 3;
function printStreet(c, splashed) {
  const w = 900, h = 500; K.cardBase(c, w, h, 'Street', 'Strada');
  c.strokeStyle = COL.ink; c.lineWidth = 3; c.lineJoin = 'round';
  const shops = [['HOTEL', 30], ['BAR', 200], ['PHARMACY', 340], ['BOOKS', 540], ['NOODLES', 700]];
  for (const [nm, x] of shops) { const sw = 150; c.strokeRect(x, 108, sw, 92); c.fillStyle = COL.faint; c.fillRect(x + 12, 140, sw * .42, 50); c.strokeRect(x + 12, 140, sw * .42, 50);
    c.strokeRect(x + sw * .6, 140, sw * .28, 60); K.txt(c, nm, x + sw / 2, 124, { size: 13, wt: 600, ls: 2.5, align: 'center', col: COL.ink }); }
  c.fillStyle = COL.line; c.fillRect(20, 212, w - 40, 3);
  for (let x = 40; x < w; x += 70) { c.fillStyle = COL.faint; c.fillRect(x, 300, 40, 3); c.fillRect(x + 30, 400, 40, 3); }
  // the puddle on her lane (v = 250), sky blue; WET in red (trouble)
  const u = (SX - (CARDS.A.c[0] - CARDS.A.w / 2)) * 1000, v = 250;
  c.fillStyle = 'rgba(95,180,232,.55)'; c.beginPath(); c.ellipse(u, v + 6, 70, 30, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(u + 40, v + 18, 34, 15, .2, 0, TAU); c.fill();
  c.strokeStyle = COL.sky; c.lineWidth = 3; c.beginPath(); c.ellipse(u, v + 6, 70, 30, 0, 0, TAU); c.stroke();
  if (splashed) { c.fillStyle = COL.sky; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + hash(i) * .4, r = 90 + hash(i * 3.1) * 60; c.beginPath(); c.arc(u + Math.cos(a) * r, v + 6 + Math.sin(a) * r * .45, 4 + hash(i * 5.3) * 5, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(95,180,232,.7)'; c.lineWidth = 2; for (const r of [96, 128]) { c.beginPath(); c.ellipse(u, v + 6, r, r * .44, 0, 0, TAU); c.stroke(); } }
  c.fillStyle = COL.red; c.fillRect(u - 70, v + 62, 12, 12); K.txt(c, splashed ? 'WET · SPLASH 0.94 s' : 'WET FLOOR', u - 50, v + 68, { size: 15, wt: 600, ls: 2.5, col: COL.red });
  K.txt(c, 'LANE →', 34, 470, { size: 14, wt: 600, ls: 3, col: COL.mute });
}
function printPhone(c, steps, frac) {
  const w = 300, h = 560; c.clearRect(0, 0, w, h);
  c.fillStyle = COL.ink; K.rr(c, 0, 0, w, h, 34); c.fill();
  c.fillStyle = COL.card; K.rr(c, 12, 12, w - 24, h - 24, 24); c.fill();
  K.txt(c, '11:58', 34, 34, { size: 13, wt: 600, col: COL.ink }); K.txt(c, '● ● ●', w - 34, 34, { size: 9, wt: 600, col: COL.mute, align: 'right' });
  K.txt(c, 'Home route', 30, 72, { size: 22, wt: 700, font: K.SANS }); K.txt(c, 'PERCORSO · LIVE', 30, 98, { size: 11, wt: 600, ls: 2, col: COL.mute });
  // map: a faint street grid, the route in the accent, its four stops, her live dot
  c.fillStyle = COL.faint; K.rr(c, 26, 116, w - 52, 210, 14); c.fill(); c.strokeStyle = COL.line; c.lineWidth = 2;
  for (let x = 50; x < w - 30; x += 38) { c.beginPath(); c.moveTo(x, 120); c.lineTo(x, 322); c.stroke(); } for (let y = 140; y < 322; y += 38) { c.beginPath(); c.moveTo(30, y); c.lineTo(w - 30, y); c.stroke(); }
  const R = [[48, 290], [110, 250], [170, 200], [252, 150]]; c.strokeStyle = COL.accent; c.lineWidth = 6; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); R.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.stroke();
  R.forEach(p => { c.fillStyle = COL.card; c.beginPath(); c.arc(...p, 8, 0, TAU); c.fill(); c.strokeStyle = COL.accent; c.lineWidth = 4; c.stroke(); });
  const seg_ = Math.min(2, Math.floor(frac * 3)), f = frac * 3 - seg_, P = [lerp(R[seg_][0], R[seg_ + 1][0], f), lerp(R[seg_][1], R[seg_ + 1][1], f)];
  c.fillStyle = COL.coat; c.beginPath(); c.arc(...P, 11, 0, TAU); c.fill(); c.strokeStyle = COL.card; c.lineWidth = 4; c.stroke();
  // stats
  const row = (y, l, v, u) => { K.txt(c, l, 30, y, { size: 12, wt: 600, ls: 2, col: COL.mute }); K.txt(c, v, w - 64, y, { size: 24, wt: 700, font: K.SANS, align: 'right' }); K.txt(c, u, w - 58, y + 2, { size: 12, wt: 500, col: COL.mute }); c.fillStyle = COL.line; c.fillRect(26, y + 22, w - 52, 2); };
  row(360, 'PACE', '4.06', 'm/s'); row(410, 'CADENCE', '174', '/min'); row(460, 'STEPS', String(steps), '');
  c.fillStyle = COL.accent; K.rr(c, 30, 492, w - 60, 40, 20); c.fill(); K.txt(c, 'FOLLOWING AKI', w / 2, 513, { size: 13, wt: 600, ls: 2.5, col: '#fff', align: 'center' });
}
function printWatch(c, typed, sec) {
  const w = 500, h = 500; K.cardBase(c, w, h, 'Watch', 'Orologio');
  // the dial (printed): hands at 11:58:sec
  const cx = 140, cy = 300, r = 104; c.strokeStyle = COL.ink; c.lineWidth = 5; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, r0 = i % 5 ? r - 12 : r - 22; c.lineWidth = i % 5 ? 2 : 4; c.beginPath(); c.moveTo(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0); c.lineTo(cx + Math.sin(a) * (r - 6), cy - Math.cos(a) * (r - 6)); c.stroke(); }
  const mn = 58 + sec / 60, hand = (fr, L, lw, col) => { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.sin(fr * TAU) * L, cy - Math.cos(fr * TAU) * L); c.stroke(); };
  hand((11 + mn / 60) / 12, 54, 9, COL.ink); hand(mn / 60, 82, 6, COL.ink); hand(sec / 60, 90, 3, COL.accent); c.fillStyle = COL.accent; c.beginPath(); c.arc(cx, cy, 7, 0, TAU); c.fill();
  // the numerals, typed in; the seconds in the accent
  const s = `11:58:${String(sec).padStart(2, '0')}`;
  K.txt(c, s.slice(0, Math.min(typed, 5)), 268, 262, { size: 76, wt: 700, font: K.SANS });
  if (typed > 5) K.txt(c, s.slice(5, typed), 268, 346, { size: 76, wt: 700, font: K.SANS, col: COL.accent });
  K.txt(c, `${120 - sec} s TO 12:00:00`, 272, 420, { size: 14, wt: 600, ls: 2.5, col: COL.mute });
}
function printStation(c) {
  const w = 600, h = 500; K.cardBase(c, w, h, 'Station', 'Stazione');
  c.fillStyle = COL.faint; c.fillRect(20, 300, w - 40, 150); c.fillStyle = COL.lemon; c.fillRect(20, 292, w - 40, 8);
  c.strokeStyle = COL.ink; c.lineWidth = 3; for (const y of [372, 420]) { c.beginPath(); c.moveTo(20, y); c.lineTo(w - 20, y); c.stroke(); }
  for (let x = 30; x < w - 20; x += 26) { c.fillStyle = COL.mute; c.fillRect(x, 366, 8, 60); }
  K.txt(c, 'PLATFORM', 34, 270, { size: 14, wt: 600, ls: 3, col: COL.mute }); K.txt(c, 'LAST TRAIN', w - 34, 270, { size: 14, wt: 600, ls: 3, col: COL.ink, align: 'right' });
}

// ═════════ the clock tower: a pixel sprite made solid (a sticker on the station card until it pops)
const TOWER_ROWS = ['.....pp.....', '.....pp.....', '....pppp....', '...pppppp...', '..pppppppp..', '.pppppppppp.', 'ssssssssssss', 'sSaasSSsaaSs', 'sSaasSSsaaSs', 'ssssssssssss',
  'sssffffffsss', 'ssffffhfffss', 'ssfffhhfffss', 'ssffffkfffss', 'ssffffffffss', 'sssffffffsss', 'ssssssssssss', 'sSssSSSSssSs', 'sSwwsSSswwSs', 'sSwwsSSswwSs',
  'sSssSSSSssSs', 'sSwwsSSswwSs', 'sSwwsSSswwSs', 'sSssSSSSssSs', 'sSwwsSSswwSs', 'sSwwsSSswwSs', 'sSssSSSSssSs', 'sSssddddssSs', 'sSssddddssSs', 'SSSSSSSSSSSS'];
const TPAL = { p: '#4a3f6b', s: '#ddd7f0', S: '#bdb4dc', a: '#2e2848', f: '#fffdf5', h: '#3a3352', k: '#6b4ce6', w: '#f2c94c', d: '#6b5a9a' };

export function build(ctx) {
  const { world } = ctx, scene = world.scene; ctx.fx = { flash: 0 };
  // —— cards
  const mk = (n, draw, thick = THICK) => { const d = CARDS[n], [cv, c] = K.canvas(d.w * 1000, d.h * 1000, SK); draw(c); const g = card(world, cv, d.w, d.h, thick); g.position.set(d.c[0], 0, d.c[1]); scene.add(g); return { g, c, cv }; };
  const cA = mk('A', c => printStreet(c, false)), cB = mk('B', c => printPhone(c, 0, 0), .008), cC = mk('C', c => printWatch(c, 0, 47)), cD = mk('D', c => printStation(c));
  // —— the route printed on the mat between the cards (accent dashes) and a soft window-light patch
  { const [cv, c] = K.canvas(2700, 40, 1); c.fillStyle = COL.accent; for (let x = 10; x < 2690; x += 44) { c.beginPath(); c.roundRect(x, 14, 26, 12, 6); c.fill(); }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.7, .04), new THREE.MeshStandardMaterial({ map: world.tex(cv), transparent: true, roughness: .9 })); m.rotation.x = -Math.PI / 2; m.position.set(.1, .0004, 0); m.receiveShadow = true; scene.add(m); }
  { const [cv, c] = K.canvas(800, 500, 1); c.filter = 'blur(28px)'; c.fillStyle = 'rgba(255,236,205,1)'; for (const [x, y] of [[90, 70], [420, 70], [90, 270], [420, 270]]) c.fillRect(x, y, 290, 170); c.filter = 'none';
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicMaterial({ map: world.tex(cv), transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = .35; m.position.set(-.3, .009, -.15); scene.add(m); }
  // —— props at the edges (foreground / background layers): a mug, a pen, sticky notes
  { const mug = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: '#cdbff0', roughness: .35 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.11, .1, .17, 40, 1, true), mat); body.position.y = .085; const bot = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .01, 40), mat); bot.position.y = .005;
    const hd = new THREE.Mesh(new THREE.TorusGeometry(.05, .012, 12, 24), mat); hd.position.set(.115, .09, 0); hd.rotation.y = Math.PI / 2; mug.add(body, bot, hd);
    const cof = new THREE.Mesh(new THREE.CircleGeometry(.1, 40), new THREE.MeshStandardMaterial({ color: '#5a3a26', roughness: .2 })); cof.rotation.x = -Math.PI / 2; cof.position.y = .14; mug.add(cof);
    mug.traverse(o => { o.castShadow = o.receiveShadow = true; }); mug.position.set(-1.05, 0, -.8); scene.add(mug);
    const pen = new THREE.Mesh(new THREE.CapsuleGeometry(.011, .46, 6, 16), new THREE.MeshStandardMaterial({ color: COL.accent, roughness: .3 })); pen.rotation.z = Math.PI / 2; pen.rotation.y = .35; pen.position.set(.05, .011, .95); pen.castShadow = true; scene.add(pen);
    for (const [x, z, r, cl] of [[-.2, .62, .25, '#f6d77a'], [1.05, -.7, -.18, '#f6d77a'], [2.35, .55, .4, '#f7b38a']]) { const n = new THREE.Mesh(rbox(.15, .002, .15, .0008), new THREE.MeshStandardMaterial({ color: cl, roughness: .85 })); n.position.set(x, .001, z); n.rotation.y = r; n.receiveShadow = n.castShadow = true; scene.add(n); } }
  // —— the cast: AKI (re-voxelised each frame), the tower toy, the splash droplets, rings, pills
  const aki = makeAkiVox(scene, { cell: CELL });
  const cells = []; TOWER_ROWS.forEach((row, j) => [...row].forEach((ch, i) => { if (TPAL[ch]) cells.push([i, j, TPAL[ch]]); }));
  const tower = makeMonster({ w: 12, h: 30, cells }, .0095, 'tower', .9); scene.add(tower.root);
  const faceIdx = cells.map((c, k) => c[2] === TPAL.f ? k : -1).filter(k => k >= 0), faceCol = new THREE.Color(TPAL.f), litCol = new THREE.Color(COL.lemon);
  const TPOS = at('D', 330, 190);
  const NDROP = 22, drops = new THREE.InstancedMesh(rbox(1, 1, 1, .18), new THREE.MeshStandardMaterial({ roughness: .25 }), NDROP); drops.castShadow = true; drops.frustumCulled = false; scene.add(drops);
  for (let i = 0; i < NDROP; i++) drops.setColorAt(i, new THREE.Color(i % 4 ? COL.sky : '#e8f6ff'));
  const ringM = col => { const m = new THREE.Mesh(new THREE.RingGeometry(.92, 1, 72), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false })); m.rotation.x = -Math.PI / 2; scene.add(m); return m; };
  const ring1 = ringM(COL.sky), ring2 = ringM(COL.accent);
  const pills = { wet: pill(world, 'WET  0.94 s', { bg: COL.red, h: .03 }), time: pill(world, 'TIME', { bg: COL.accent, h: .03 }), chime: pill(world, 'CHIME', { bg: COL.accent, h: .036 }) };
  for (const p of Object.values(pills)) { p.castShadow = false; p.visible = false; }
  const m4 = new THREE.Matrix4(), qd = new THREE.Quaternion(), pd = new THREE.Vector3(), sd = new THREE.Vector3();
  ctx.subj = { aki: t => V(herX(t), gY(herX(t)) + .085, 0), C: () => V(CARDS.C.c[0] + .02, 0, CARDS.C.c[1] + .02), D: () => V(TPOS.x - .05, .08, TPOS.z + .08), wide: () => V(-.05, 0, .02) };
  let stA = -1, stB = '', stC = '';
  const pillAnim = (p, t0, t1, pos) => { const k = t < t0 || t > t1 ? 0 : back(seg(t, t0, t0 + .2), 2) * (1 - seg(t, t1 - .15, t1)); p.visible = k > .01; if (!p.visible) return; p.scale.setScalar(k); p.position.copy(pos); p.face(ctx.camera); };
  let t = 0;
  return tt => {
    t = tt;
    // —— card states (redrawn only on change)
    const sA = t >= SPL.t0 ? 1 : 0; if (sA !== stA) { stA = sA; printStreet(cA.c, !!sA); cA.g.userData.redraw(); }
    const n = STEPS.filter(c => c.t0 <= t).length, frac = clamp((herX(t) + 2.05) / 4.0), qB = `${n}|${Math.round(frac * 60)}`; if (qB !== stB) { stB = qB; printPhone(cB.c, n, frac); cB.g.userData.redraw(); }
    const typed = t < 7.6 ? 8 : clamp(Math.floor((t - 7.6) / (.625 / 8)) + 1, 0, 8), sec = Math.floor(W_T(t) + 1e-6) % 60, qC = `${typed}|${sec}`; if (qC !== stC) { stC = qC; printWatch(cC.c, typed, sec); cC.g.userData.redraw(); }
    // —— AKI
    const hx = herX(t); aki.root.position.set(hx, gY(hx), 0);
    aki.update(api => { const xq = Xq(t), M = p => [aki.CX + (p[0] - xq) * KPX, aki.GY + p[1] * KPX], F = figure(t, M);
      const chain = (pts, r, cl) => { for (let i = 1; i < pts.length; i++) api.capsule(pts[i - 1], pts[i], r, cl); };
      chain(F.armF.slice(0, 3), .95, '#b94a30'); api.capsule(F.armF[2], F.armF[3], .8, '#f3c7a5');
      chain(F.legF.slice(0, 3), 1.15, '#2a2d4a'); api.capsule(F.legF[2], F.legF[3], .9, '#6b4430');
      api.poly(F.coat, COL.coat);
      chain(F.legN.slice(0, 3), 1.2, '#3b3f66'); api.capsule(F.legN[2], F.legN[3], .95, '#6b4430');
      api.capsule(F.neck[0], F.neck[1], .8, '#f3c7a5'); chain(F.tail, 1.0, '#2a2340');
      const hc = F.headC, hr = 46 * KPX * 1.38, ca = Math.cos(F.headA), sa = Math.sin(F.headA);
      api.capsule(hc, hc, hr, '#f3c7a5'); api.capsule([hc[0] - ca * .9, hc[1] - sa * .9 - .9], [hc[0] - ca * 1.3, hc[1] - sa * 1.3 - 1.2], hr * .9, '#2a2340');
      chain(F.armN.slice(0, 3), 1.0, COL.coat); api.capsule(F.armN[2], F.armN[3], .8, '#f3c7a5');
      api.dot(F.watch[0] - .5, F.watch[1] - .5, COL.lemon);
      api.dot(hc[0] + ca * hr * .55 - .5, hc[1] + sa * hr * .55 - hr * .1 - .5, '#000000'); });
    // —— the splash: droplets burst, land on the card and roll away; a flat ring spreads
    const a = t - SPL.t0;
    for (let i = 0; i < NDROP; i++) { let s = 0;
      if (a > 0 && a < 1.5) { const th = hash(i * 1.7) * TAU, sp = .12 + hash(i * 3.3) * .2, vy = .32 + hash(i * 7.1) * .3, g = 3.2, tl = 2 * vy / g;
        let x = SX + Math.cos(th) * sp * Math.min(a, tl), z = Math.sin(th) * sp * .8 * Math.min(a, tl), y = THICK + Math.max(0, vy * a - .5 * g * a * a);
        if (a > tl) { const r = (a - tl), roll = sp * .5 * (1 - Math.exp(-r * 3)) / 3; x += Math.cos(th) * roll; z += Math.sin(th) * roll * .8; }
        s = .0062 * (1 - seg(a, 1.1, 1.5)) * (.7 + hash(i * 9.1) * .6); pd.set(x, y + s / 2, z); }
      sd.set(s, s, s); qd.setFromEuler(new THREE.Euler(a * 7 + i, a * 5, 0)); m4.compose(pd, qd, sd); drops.setMatrixAt(i, m4); }
    drops.instanceMatrix.needsUpdate = true;
    const rr = (m, t0, x, z, R, col) => { const u = seg(t, t0, t0 + 1); m.visible = t > t0 && u < 1; if (!m.visible) return; m.position.set(x, THICK + .0008, z); m.scale.setScalar(.01 + R * eo(u)); m.material.opacity = .85 * (1 - u); };
    rr(ring1, SPL.t0, SX, 0, .2); rr(ring2, EV.chime, TPOS.x, TPOS.z, .34);
    // —— the tower: a sticker until 9.375 s, pops on the 16th, chimes at 9.575 s
    const P = pop(t, 9.375, .3, .05), d = t - EV.chime; let sq = P.sq; if (d > 0 && d < .24) sq *= 1 - .2 * Math.sin(Math.PI * d / .24) * (1 - d / .24);
    tower.set({ pos: V(TPOS.x, THICK + P.y, TPOS.z), e: Math.max(.02, P.e), hinge: P.hinge, sq, yaw: -.25 });
    const lit = d > 0 && d < .5; faceIdx.forEach(k => tower.mesh.setColorAt(k, lit && Math.floor(d * 12) % 2 === 0 ? litCol : faceCol)); tower.mesh.instanceColor.needsUpdate = true;
    // —— pills (camera-facing, no shadow)
    pillAnim(pills.wet, 1.1, 2.4, V(SX + .02, .16, -.02));
    pillAnim(pills.time, EV.watchUp + .05, EV.watchDown + .2, V(hx + .02, gY(hx) + .205, 0));
    pillAnim(pills.chime, EV.chime, 10.2, V(TPOS.x, .36, TPOS.z));
    ctx.fx.flash = 0;
  };
}
