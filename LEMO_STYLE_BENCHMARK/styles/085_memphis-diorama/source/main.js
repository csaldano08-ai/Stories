// 085 · Memphis Diorama — the first 10 s of "Last Train Home" as a tabletop model of a place (lemo-opuscar styles/memphis-diorama).
// The style looks at a place, never at a person: Station Road at night, built as a model (flat Memphis colour, ink outlines, hard
// violet shadows, halftone in the shade, patterns in world space), the grainy frame growing open. AKI is distant decoration: a small
// runner on the near pavement, her body placed from the shared rig every frame (constant bone lengths, a planted foot), never close.
//   S1  high 3/4 near a lamp: the frame grows open; she runs through the puddle in the lamp's pool at 0.94 s: rings and droplets
//   S2  following her along the road, past houses and lamps; at 6.05 s a callout pops from her wrist: 11:58
//   S3  a slow push to one detail: the station clock on its tower, 11:58:47 → 48 at 8.4 s (line 3 of the type changes with it)
//   S4  squash and spring: the tower squats and springs back on the chime (9.58 s) and a wave lights the windows street by street
// Engine: the library's demo memphis.js (EDIT 085: supersampling 2 → 1.5 for the CPU renderer). Page contract: render(t), DUR, READY, RIGQA.
import * as THREE from 'three';
import { Diorama, flat, mesh, box, setNight, setWave, setLamps, setHalftone, FRAME, INK } from './src/memphis.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash, mulberry } from './shared/lib/util.js';

window.DUR = DUR;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z), TAU = Math.PI * 2;
await Promise.all(['600 25px IT', '400 18px IT', '400 15px PM'].map(f => document.fonts.load(f, 'Aa0')));
const ctx = document.getElementById('c').getContext('2d'), dio = new Diorama(document.getElementById('gl'), ctx), W = dio.scene;
setHalftone(1);

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
const W_T = t => 11 * 3600 + 58 * 60 + 48 + (t - 8.4);
const UM = .0028, X0 = X(0), XS = -22, ZRUN = 4.2, herX = t => XS + (X(t) - X0) * UM, P3 = (p, z) => V3(XS + (p[0] - X0) * UM, -p[1] * UM + .15, z);
const SX = XS + (SPL.x + 44 - X0) * UM, ST = { x: 46, z: -9 };
const R = mulberry(85), rr = (a, b) => a + (b - a) * R();
const cache = new Map(), M = (hex, o = {}) => { const k = hex + JSON.stringify(o); if (!cache.has(k)) cache.set(k, flat(hex, o)); return cache.get(k); };
const lt = (hex, k) => '#' + new THREE.Color(hex).lerp(new THREE.Color(k > 0 ? '#FFFFFF' : '#3A2F66'), Math.abs(k)).getHexString();

// ═════════ the place: ground, Station Road, pavements, houses, trees, lamps, the station with its clock tower
mesh(new THREE.PlaneGeometry(600, 400).rotateX(-Math.PI / 2), M('#B9E8C8', { pat: 1, patCol: '#A3DDB6', patScale: 1.2 }), 10, 0, 0, W).castShadow = false;
mesh(box(90, .12, 6.4), M('#C9C2E8', { pat: 6, patCol: '#BDB5E0', patScale: .9 }), 10, 0, 0, W).castShadow = false;                    // the road
for (let x = -32; x < 54; x += 4) mesh(box(2, .02, .22), M('#FFFFFF'), x, .12, 0, W).castShadow = false;                                // lane marks
for (const z of [4.4, -4.4]) mesh(box(90, .18, 2.4), M('#FFE6BD', { pat: 1, patCol: '#FFD39A', patScale: .7 }), 10, 0, z, W).castShadow = false;   // pavements
// the puddle in a lamp's pool, layered: bank, shallows, deeper water, foam line, white squiggles
mesh(new THREE.CylinderGeometry(1, 1, .03, 36), M('#7FB2FF'), SX, .19, ZRUN, W).scale.set(1.25, 1, .6);
mesh(new THREE.CylinderGeometry(1, 1, .035, 36), M('#5CC8FF', { pat: 2, patCol: '#8FDBFF', patScale: .3 }), SX, .19, ZRUN, W).scale.set(1.0, 1, .44);
const foam = mesh(new THREE.TorusGeometry(1, .035, 6, 40).rotateX(Math.PI / 2), M('#FFFFFF', { lit: true }), SX, .22, ZRUN, W); foam.scale.set(1.25, 1, .6); foam.userData.noOutline = true;
const SQUIG = []; for (let i = 0; i < 3; i++) { const m = mesh(new THREE.TorusGeometry(.18, .025, 4, 12, Math.PI).rotateX(Math.PI / 2), M('#FFFFFF', { lit: true }), SX - .4 + i * .4, .23, ZRUN - .1 + (i % 2) * .15, W); m.userData.noOutline = true; m.castShadow = false; SQUIG.push(m); }
// houses (far side): plinth, plank walls, corner trims, roof slopes and ridge, facade windows that light with the wave, door with awning
const WALLS = ['#FFEFA8', '#FFB8D9', '#5EDFB0', '#B9A0FF', '#FF9C6B', '#FFFFFF', '#5CC8FF'], ROOFS = ['#FF5A5F', '#2F5BFF', '#14B8A0', '#FFD234', '#4A4468'];
function house(x, z, w, d, i) {
  const g = new THREE.Group(); g.position.set(x, 0, z); W.add(g);
  const wc = WALLS[i % WALLS.length], two = i % 3 !== 1, h = two ? 6.4 : 4.2, B = .45, F = d / 2;
  mesh(box(w + .5, B, d + .5), M('#DCD4EE', { pat: 1, patCol: '#C9C0E3', patScale: .32 }), 0, 0, 0, g);
  mesh(box(w, h, d), M(wc, { pat: 6, patCol: lt(wc, -.07), patScale: .5, win: true, y0: B + .6, y1: B + h - .3, seed: i * 3.1 }), 0, B, 0, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(box(.24, h, .24), M('#FFFFFF'), sx * (w / 2 - .04), B, sz * (d / 2 - .04), g);
  const rc = ROOFS[(i * 3 + 1) % ROOFS.length], run = d / 2 + .7, rise = 2.4, Ls = Math.hypot(run, rise), th = Math.atan2(rise, run);
  for (const sd of [-1, 1]) { const sl = mesh(new THREE.BoxGeometry(w + 1.1, .3, Ls), M(rc, { pat: 6, patCol: lt(rc, .35), patScale: .55 }), 0, B + h + rise / 2 + .05, sd * run / 2, g); sl.rotation.x = sd * th; }
  mesh(new THREE.CylinderGeometry(.2, .2, w + 1.25, 10).rotateZ(Math.PI / 2), M(lt(rc, -.15)), 0, B + h + rise + .12, 0, g);
  const gs = new THREE.Shape(); gs.moveTo(-d / 2, 0); gs.lineTo(d / 2, 0); gs.lineTo(0, rise - .15); gs.closePath();
  mesh(new THREE.ExtrudeGeometry(gs, { depth: w - .02, bevelEnabled: false }).translate(0, 0, -(w - .02) / 2).rotateY(Math.PI / 2), M(wc), 0, B + h, 0, g);
  const dc = ['#2F5BFF', '#FF5A5F', '#14B8A0'][i % 3]; mesh(box(1.25, 2.15, .1), M('#FFFFFF'), 0, B, F + .03, g); mesh(box(.95, 1.95, .16), M(dc, { pat: 6, patCol: lt(dc, -.18), patScale: .3 }), 0, B, F + .05, g);
  const aw = mesh(box(1.7, .1, .8), M(['#FF5A5F', '#2F5BFF', '#FFD234'][(i + 1) % 3], { pat: 4, patCol: '#FFFFFF', patScale: .28 }), 0, B + 2.3, F + .42, g); aw.rotation.x = .3;
  mesh(new THREE.SphereGeometry(.16, 10, 8), M('#FFD36E', { emit: true }), .85, B + 2.0, F + .12, g);
  if (two) mesh(box(.7, 1.6, .7), M('#FF7EB3', { pat: 6, patCol: '#E8679C', patScale: .3 }), w / 2 - 1.1, B + h + .9, -.7, g);
  return g;
}
let hi = 0; for (let x = -28; x < 36; x += 9.2) house(x, -10.2, rr(7, 8.2), 6, hi++);
for (let x = -24; x < 42; x += 9.6) house(x, -31, rr(6.8, 8), 6, hi++);                                                     // the next street back (the wave reaches it last)
// trees: five crown shapes, lighter lobes on the sun side
const TREES = [];
function tree(x, z, kind, col, hiCol, s = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); W.add(g); const trunk = M('#B07A5A');
  mesh(new THREE.CylinderGeometry(.16, .3, 2, 8).translate(0, 1, 0), trunk, 0, 0, 0, g); const c = new THREE.Group(); c.position.y = 2; g.add(c);
  const main = M(col, { pat: 1, patCol: lt(col, .25), patScale: .5 }), hiM = M(hiCol);
  if (kind === 'round') { mesh(new THREE.SphereGeometry(1.6, 20, 14), main, 0, 1.4, 0, c); mesh(new THREE.SphereGeometry(.7, 12, 10), hiM, -.7, 2.1, .7, c); }
  if (kind === 'egg') { mesh(new THREE.SphereGeometry(1.3, 18, 12).scale(.85, 1.35, .85), main, 0, 1.7, 0, c); mesh(new THREE.SphereGeometry(.55, 12, 10).scale(.85, 1.25, .85), hiM, -.5, 2.4, .45, c); }
  if (kind === 'cone') { for (const [r, h, y] of [[1.7, 1.8, .9], [1.3, 1.6, 1.9], [.9, 1.4, 2.8]]) mesh(new THREE.ConeGeometry(r, h, 16), main, 0, y, 0, c); }
  if (kind === 'column') { mesh(new THREE.CapsuleGeometry(.8, 2.4, 6, 12), main, 0, 1.9, 0, c); mesh(new THREE.CapsuleGeometry(.34, 1.2, 6, 10), hiM, -.5, 2.5, .4, c); }
  if (kind === 'cloud') { for (const [dx, dy, dz, r] of [[0, 1.5, 0, 1.3], [1, .9, .3, 1], [-.95, 1, -.3, 1], [.2, 2.2, -.3, .9]]) mesh(new THREE.SphereGeometry(r, 16, 12), main, dx, dy, dz, c); mesh(new THREE.SphereGeometry(.55, 12, 10), hiM, -.7, 2.1, .55, c); }
  TREES.push({ c, ph: R() * TAU }); }
const KINDS = ['round', 'egg', 'cone', 'column', 'cloud'], CROWNS = [['#2FCB7A', '#9BF0C0'], ['#5EDFB0', '#C8F7E4'], ['#B9A0FF', '#E2D6FF'], ['#FF7EB3', '#FFD0E2'], ['#14B8A0', '#8EE8D8']];
for (let x = -32, i = 0; x < 38; x += 9.2, i++) tree(x + 4.6, -6.4, KINDS[i % 5], ...CROWNS[i % 5], .8);
// lamp posts on the near pavement, warm heads and hard pools of light
// (on the kerb side of the near pavement, so from the camera's side they stand behind her, never across her)
const LAMPS = [], lampPost = (x, z) => { mesh(new THREE.CylinderGeometry(.07, .09, 4.1, 8).translate(0, 2.05, 0), M('#4A4468'), x, 0, z, W); mesh(new THREE.SphereGeometry(.2, 12, 10), M('#FFD36E', { emit: true, lit: true }), x, 4.25, z, W); mesh(new THREE.ConeGeometry(.28, .2, 12), M('#4A4468'), x, 4.5, z, W); };
for (let x = -26; x < 42; x += 8) if (Math.abs(x - SX) > 3) { lampPost(x, 3.35); LAMPS.push([x, 4.3, 3.9, 3.4]); }
lampPost(SX + 1.2, 3.35); LAMPS.push([SX + 1.0, 4.3, ZRUN - .2, 3.8]);
// the night sky over the model: flat indigo with a moon and small stars (all self-lit, outside the night tint)
W.background = new THREE.Color('#3B3482');
mesh(new THREE.CircleGeometry(5, 40), M('#FFF1BF', { emit: true, lit: true }), 72, 30, -150, W).lookAt(0, 10, 40);
for (const [dx, dy, r] of [[-1.4, 1.1, 1.1], [1.6, -1.2, .8], [.6, 2.4, .5]]) mesh(new THREE.CircleGeometry(r, 24), M('#F4DFA0', { emit: true, lit: true }), 72 + dx, 30 + dy, -149.6, W).lookAt(0, 10, 40);
for (let i = 0; i < 46; i++) { const m = mesh(new THREE.OctahedronGeometry(rr(.35, .8), 0), M(i % 5 ? '#FFFFFF' : '#FFD234', { emit: true, lit: true }), rr(-110, 160), rr(18, 70), rr(-170, -130), W); m.castShadow = false; m.scale.y = 1.6; }
// the model's backdrop: soft hills along the back edge of the board (they fill the horizon behind the tower)
for (let i = 0; i < 9; i++) { const c = ['#8FD3B5', '#B9A0FF', '#5EDFB0', '#9FC4FF'][i % 4], h = mesh(new THREE.SphereGeometry(1, 28, 14, 0, TAU, 0, Math.PI / 2), M(c, { pat: i % 2 ? 1 : 6, patCol: lt(c, .2), patScale: 1.4 }), -60 + i * 22 + rr(-4, 4), 0, -78 - (i % 3) * 9, W); h.scale.set(rr(24, 34), rr(15, 22), rr(14, 20)); h.castShadow = false; }
// the railway behind the station: ballast, sleepers, two rails, the platform, and the last train waiting (its windows light with the wave)
mesh(box(130, .16, 3.4), M('#CFC6E6', { pat: 1, patCol: '#BDB3DB', patScale: .3 }), 12, 0, -17.5, W).castShadow = false;
for (let x = -52; x < 77; x += 1.5) mesh(box(.32, .1, 2.8), M('#B07A5A'), x, .16, -17.5, W).castShadow = false;
for (const z of [-18.2, -16.8]) mesh(box(130, .14, .12), M('#6F6A8E'), 12, .26, z, W).castShadow = false;
mesh(box(30, 1.0, 3.2), M('#FFE6BD', { pat: 1, patCol: '#FFD39A', patScale: .6 }), ST.x, 0, -14.4, W);
mesh(box(30, .12, .3), M('#FFD234'), ST.x, 1.0, -15.85, W).castShadow = false;
for (let k = 0; k < 3; k++) { const x = ST.x - 11 + k * 9.6, car = mesh(box(9.2, 2.8, 2.9), M('#FFEFA8', { win: true, y0: .5, y1: 3.2, seed: 11 + k }), x, .55, -17.5, W);
  mesh(box(9.24, .38, 2.94), M('#2F5BFF', { pat: 4, patCol: '#7FA0FF', patScale: .3 }), x, .9, -17.5, W);
  mesh(box(9.0, .3, 2.7), M('#FF5A5F'), x, 3.35, -17.5, W); }
// the station at the end of the road: a hall, a platform canopy, and the clock tower (with a squash and spring on the chime)
{ const g = new THREE.Group(); g.position.set(ST.x, 0, ST.z); W.add(g); mesh(box(16, .5, 9), M('#DCD4EE', { pat: 1, patCol: '#C9C0E3', patScale: .32 }), 0, 0, 0, g);
  mesh(box(15, 5.2, 8), M('#FF9C6B', { pat: 6, patCol: lt('#FF9C6B', -.08), patScale: .5, win: true, y0: 1.2, y1: 4.8, seed: 7 }), 0, .5, 0, g);
  const rf = mesh(box(16.5, .4, 9.5), M('#2F5BFF', { pat: 4, patCol: '#7FA0FF', patScale: .4 }), 0, 5.7, 0, g);
  const sign = mesh(box(6, 1.1, .2), M('#FFD234'), 0, 6.3, 4.4, g); }
const tower = new THREE.Group(); tower.position.set(ST.x - 10.5, 0, ST.z + 1); W.add(tower);
const TW = new THREE.Group(); tower.add(TW);
mesh(box(3.6, .5, 3.6), M('#DCD4EE'), 0, 0, 0, TW); mesh(box(3, 11, 3), M('#B9A0FF', { pat: 6, patCol: lt('#B9A0FF', -.08), patScale: .5 }), 0, .5, 0, TW);
for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(box(.24, 11, .24), M('#FFFFFF'), sx * 1.46, .5, sz * 1.46, TW);
mesh(box(3.6, 3.2, 3.6), M('#FFEFA8', { pat: 1, patCol: '#FFE08A', patScale: .4 }), 0, 11.5, 0, TW);
const roofT = mesh(new THREE.ConeGeometry(2.9, 3.2, 4).rotateY(Math.PI / 4), M('#FF5A5F', { pat: 6, patCol: '#FFC4C6', patScale: .5 }), 0, 16.3, 0, TW);
const FACE = V3(0, 13.1, 1.82); mesh(new THREE.CylinderGeometry(1.15, 1.15, .14, 36).rotateX(Math.PI / 2), M('#FFFBEA', { emit: true, lit: true }), FACE.x, FACE.y, FACE.z, TW);   // a lit station clock
const ring = mesh(new THREE.TorusGeometry(1.15, .1, 8, 36), M('#2F5BFF', { emit: true, lit: true }), FACE.x, FACE.y, FACE.z + .05, TW);
for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; mesh(box(.08, .22, .06), M('#25214A'), Math.sin(a) * .92, FACE.y + Math.cos(a) * .92 - .11, FACE.z + .1, TW).rotation.z = -a; }
const hand = (L, w, col) => { const p = new THREE.Group(); p.position.set(FACE.x, FACE.y, FACE.z + .12); TW.add(p); const m = mesh(box(w, L, .05), M(col), 0, -.12, 0, p); m.castShadow = false; return p; };
const hH = hand(.6, .14, '#25214A'), hM = hand(.9, .09, '#25214A'), hS = hand(1.0, .045, '#FF5A5F');
// AKI: distant decoration, flat colours, placed from the rig every frame
const AM = { coat: M('#FF5A5F'), coatF: M('#D9454A'), leg: M('#4A4468'), legF: M('#3A3458'), skin: M('#FFD9B8'), hair: M('#3A2F66'), shoe: M('#2F5BFF') };
const akiG = new THREE.Group(); W.add(akiG);
const uCyl = new THREE.CylinderGeometry(1, 1, 1, 8), uSph = new THREE.SphereGeometry(1, 12, 10), coatGeo = new THREE.CylinderGeometry(.6, 1, 1, 12);
const pool = []; let pi = 0;
const pm = (geo, mat) => { let m = pool[pi]; if (!m) { m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = false; akiG.add(m); pool.push(m); } m.geometry = geo; m.material = mat; m.visible = true; pi++; return m; };
const bone = (a, b, r, mat) => { const d = new THREE.Vector3().subVectors(b, a), L = d.length(), m = pm(uCyl, mat); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); m.scale.set(r, L, r); };
const ball = (p, r, mat) => { const m = pm(uSph, mat); m.position.copy(p); m.scale.setScalar(r); m.quaternion.identity(); };
function buildAki(t) {
  pool.forEach(m => m.visible = false); pi = 0; const J = solveProfile(poseAt(t));
  for (const [k, z, mt] of [['f', ZRUN - .09, AM.legF], ['n', ZRUN + .09, AM.leg]]) { const l = J.leg[k], c = Math.cos(l.pitch), s = Math.sin(l.pitch);
    bone(P3(l.hip, z), P3(l.knee, z), .085, mt); bone(P3(l.knee, z), P3(l.ankle, z), .07, mt); ball(P3(l.knee, z), .08, mt); bone(P3(l.ankle, z), P3([l.ankle[0] + 70 * c, l.ankle[1] + 70 * s], z), .06, AM.shoe); }
  for (const [k, z, mt] of [['f', ZRUN - .17, AM.coatF], ['n', ZRUN + .17, AM.coat]]) { const a = J.arm[k]; bone(P3(a.sh, z), P3(a.el, z), .06, mt); bone(P3(a.el, z), P3(a.wr, z), .05, mt); ball(P3(a.wr, z), .055, AM.skin); }
  const TT = (b, u, f) => [b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f], hem = P3(TT(J.pelvis, -98, -4), ZRUN), neck = P3(J.neckBase, ZRUN);
  { const d = new THREE.Vector3().subVectors(neck, hem), L = d.length(), m = pm(coatGeo, AM.coat); m.position.copy(hem).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); m.scale.set(.2, L, .16); }
  const hc = P3(J.headC, ZRUN); ball(hc, .14, AM.skin); { const m = pm(uSph, AM.hair); m.position.copy(hc).add(V3(-.035, .03, 0)); m.scale.setScalar(.145); }
  const tl = P3([J.headC[0] - Math.cos(J.headA) * 90, J.headC[1] - 20], ZRUN); bone(hc.clone().add(V3(-.1, .02, 0)), tl, .045, AM.hair);
  const a = J.arm.n; return { wrist: P3([a.el[0] + (a.wr[0] - a.el[0]) * .84, a.el[1] + (a.wr[1] - a.el[1]) * .84], ZRUN + .17), J };
}
// splash: white rings on the puddle and droplets (no outline)
const SR = [0, 1, 2].map(() => { const m = mesh(new THREE.TorusGeometry(1, .03, 6, 40).rotateX(Math.PI / 2), M('#FFFFFF', { lit: true }), SX, .24, ZRUN, W); m.userData.noOutline = true; m.castShadow = false; m.visible = false; return m; });
const DROPS = Array.from({ length: 14 }, () => { const m = mesh(new THREE.SphereGeometry(.05, 6, 4), M('#FFFFFF', { lit: true }), 0, -5, 0, W); m.userData.noOutline = true; m.castShadow = false; return m; });

// ═════════ one continuous take (eased; never through geometry)
const K = (tg, off) => ({ tg, off });
const mixK = (a, b, u) => K(a.tg.clone().lerp(b.tg, u), a.off.clone().lerp(b.off, u));
const C1 = t => K(V3(SX + 1.5 + .6 * seg(t, 0, 2.5), .8, ZRUN - .5), V3(6, 8, 15));
const C2 = t => K(V3(herX(t) + 3.5, 1.5, ZRUN - 3.6), V3(4, 12, 24));
const C3 = t => K(tower.position.clone().add(V3(0, 13.1 + .15 * seg(t, 7.8, 9.375), 1.8)), V3(3.4, 1.6, lerp(15.5, 13.5, eio(seg(t, 7.8, 9.375)))));
const C4 = t => K(tower.position.clone().add(V3(-8, 4, 5)), V3(lerp(9, 11, seg(t, 9.6, 10)), 24, 40));
function camAt(t) {
  if (t < 2.5) return C1(t);
  if (t < 7.5) return mixK(C1(2.5), C2(t), eio(seg(t, 2.5, 3.8)));
  if (t < 9.375) return mixK(C2(7.5), C3(t), eio(seg(t, 7.35, 8.0)));
  return mixK(C3(9.375), C4(t), eio(seg(t, 9.375, 9.95)));
}
// ═════════ the bottom type: three lines under three marks; line 1 stays, lines 2–3 cross-fade
const LINES = [[0, 'A puddle on Station Road', 'night · one lamp · 0.94 s'], [2.5, 'Running for the last train', '4.06 m/s · 174 steps/min'], [7.5, 'The station clock', null], [9.375, 'The chime wakes the street', '11:58:49 · midnight soon']];
function bottomType(t, a) {
  const g = ctx, y0 = FRAME.cy + FRAME.hh + 64; g.save(); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const mx = 960, my = y0; g.globalAlpha = a; g.fillStyle = '#FFC93C'; g.beginPath(); g.arc(mx - 24, my, 5, 0, 7); g.fill(); g.fillStyle = '#FF7FAA'; g.beginPath(); g.moveTo(mx - 5.5, my + 4.5); g.lineTo(mx, my - 5.5); g.lineTo(mx + 5.5, my + 4.5); g.closePath(); g.fill();
  g.strokeStyle = '#2E5BE6'; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(mx + 16, my); g.lineTo(mx + 20, my - 3.5); g.lineTo(mx + 24.5, my + 3.5); g.lineTo(mx + 29, my); g.stroke();
  g.fillStyle = '#2B2840'; g.font = '600 25px IT'; g.fillText('Last Train Home', 960, y0 + 34);
  const i = LINES.reduce((k, L, j) => t >= L[0] ? j : k, 0), L = LINES[i], f = i ? clamp((t - L[0]) / .4) : 1, P = i ? LINES[i - 1] : null;
  const l3 = L_ => L_[2] ?? `11:58:${String(Math.floor(W_T(t) + 1e-6) % 60).padStart(2, '0')} · the tower`;
  const line = (L_, al) => { g.globalAlpha = a * al; g.fillStyle = '#8D8AA0'; g.font = '400 18px IT'; g.fillText(L_[1], 960, y0 + 64); g.fillStyle = '#9D9AB2'; g.font = '400 15px PM'; g.fillText(l3(L_), 960, y0 + 91); };
  if (P && f < .5) line(P, 1 - 2 * f); else line(L, i ? 2 * f - 1 : 1); g.restore();   // out, then in (never two lines on top of each other)
}
window.render = t => {
  t = clamp(+t || 0, 0, DUR);
  setNight(.82); setLamps(LAMPS);
  // the chime: the tower squats and springs back, then a wave lights the windows street by street
  const c = t - EV.chime; TW.scale.y = c > 0 ? 1 - .08 * Math.sin(c * 14) * Math.exp(-c * 4) * (c < .08 ? c / .08 : 1) : 1; TW.scale.x = TW.scale.z = 1 / Math.sqrt(TW.scale.y);
  setWave(c > 0 ? Math.max(0, (c - .08) * 140) : 0, tower.position.x, tower.position.z);
  const s = W_T(t), sec = Math.floor(s + 1e-6) % 60, mn = 58 + (s % 60) / 60; hS.rotation.z = -sec / 60 * TAU; hM.rotation.z = -mn / 60 * TAU; hH.rotation.z = -(11 + mn / 60) / 12 * TAU;
  for (const T of TREES) T.c.rotation.z = Math.sin(t * .9 + T.ph) * .035;
  SQUIG.forEach((m, i) => { m.position.x = SX - .5 + ((t * .15 + i * .4) % 1.2); });
  const A = buildAki(t);
  const a = t - SPL.t0; SR.forEach((m, k) => { const u = (a - k * .12) / .9; m.visible = a > 0 && u > 0 && u < 1; if (m.visible) m.scale.set(.15 + 1.3 * eo(u), 1, .1 + .75 * eo(u)); });
  DROPS.forEach((m, i) => { if (a < 0 || a > .7) { m.position.y = -5; return; } const th = hash(i) * TAU, sp = .6 + hash(i * 3) * .8, vy = 2.2 + hash(i * 7) * 1.8, y = vy * a - 4.9 * a * a; m.position.set(SX + Math.cos(th) * sp * a, y > 0 ? y + .2 : -5, ZRUN + Math.sin(th) * sp * .6 * a); });
  const C = camAt(t); dio.cam.position.copy(C.tg).add(C.off); dio.cam.lookAt(C.tg); dio.cam.fov = 30; dio.cam.updateProjectionMatrix(); dio.fitShadow(C.tg, Math.max(14, C.off.length() * .9));
  const grow = t < .8 ? lerp(0, 1400, eo(seg(t, 0, .8))) : 1e9;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#FFFCF6'; ctx.fillRect(0, 0, 1920, 1080);
  dio.render(t, Math.round(t * 60), { grow });
  // the callout at the watch: a pill with a leader and a dot, popping out with a back-ease
  const ca = t >= EV.watchUp ? back(seg(t, EV.watchUp, EV.watchUp + .25), 1.8) * (1 - seg(t, EV.watchDown + .1, EV.watchDown + .35)) : 0;
  if (ca > .01) { const p = A.wrist.clone().project(dio.cam), x = (p.x + 1) / 2 * 1920, y = (1 - p.y) / 2 * 1080, bx = x + 70, by = y - 120; ctx.save(); ctx.globalAlpha = clamp(ca);
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(bx, by + 22); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
    ctx.translate(bx, by); ctx.scale(ca, ca); ctx.fillStyle = '#FFFCF6'; ctx.beginPath(); ctx.roundRect(-10, -6, 214, 56, 28); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2B2840'; ctx.font = '600 25px IT'; ctx.textAlign = 'left'; ctx.fillText('11:58', 20, 30); ctx.fillStyle = '#8D8AA0'; ctx.font = '400 15px PM'; ctx.fillText('her watch', 98, 29); ctx.restore(); }
  bottomType(t, clamp((t - .5) / .5));
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0); window.READY = true;
