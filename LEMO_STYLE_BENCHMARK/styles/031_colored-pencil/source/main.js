// 031 · Colored-Pencil Science Plate — the first 10 s of "Last Train Home" as a night plate in coloured pencil on toothed
// paper (lemo-opuscar styles/colored-pencil): a real 3D world redrawn every frame by the style's post shader as four pencil
// layers (side-of-the-lead fill, local-colour hatching, cool cross-hatching in shadow, sepia/indigo accents) with a wobbling
// graphite contour; strokes are anchored through a fixed reference camera per shot (the camera only translates inside a
// shot), only the contour boils. The signature cutaway: the street above, the cut face of the pavement below (asphalt,
// sub-base, sand, soil, the storm drain). Palette: the style's night variation (indigo, same paper). Focus is how fully
// something is drawn: AKI and the puddle get all four layers, the shopfront behind a light wash. The scale changes are the
// style's magnifier: a pencilled circle opens on her wrist into the watch (7.5 s) and closes onto the station clock (9.375 s).
// AKI is 3D tubes from the shared rig; her strokes are anchored to her own reference (no hatching sliding over her). Motion:
// on twos in the locked puddle insert (the style's rule), on ones under the tracking camera (a figure on twos under a moving
// camera would slide its planted foot — documented deviation). Text: shop names in graphite on the overlay (Caveat; the
// demo's handwriting face is not shipped with the library, so another OFL hand is used).
// Engine: engine/pencil.js, an unchanged excerpt of the demo's main.js. Page contract: window.render(t), DUR, READY, RIGQA.
import { THREE, W, H, renderer, scene, add, Builder, tube, append, V, UP, mat, SHARED, camera, refCam, setCamera, proj, CQ,
  tg, ik, cl, tagT, inkT, colT, postMat, compMat, downMat, quad, qScene, qCam, rtP1, rtP2, rtC, renderView, labelTooth, mulberry, clamp, lerp, ss } from './engine/pencil.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { seg, eio, eo, back, hash } from './shared/lib/util.js';

const K = 1.65 / 600, TAU = Math.PI * 2;                       // rig units → metres
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
const W3 = (p, z = 0) => V(p[0] * K, -p[1] * K, z);
const hexc = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const box = (b, x0, y0, z0, x1, y1, z1, col, tan = UP) => append(b, new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), new THREE.Matrix4().makeTranslation((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), () => col, tan);
const meshOf = (b, m, set) => { const o = add(b.geo(), m); o.userData.set = set; return o; };

// ——— ids (focus table has 32 slots) ———
const ID = { sky: 1, pave: 2, wall: 4, win: 5, asph: 6, base: 7, sand: 8, soil: 9, deep: 10, pipe: 11, water: 12, door: 13, sign: 14, awn: 15, box: 16, pud: 17,
  jacket: 18, trousers: 19, boots: 20, skin: 21, hair: 22, gold: 23, dial: 24, hands: 25, drops: 26, cloud: 27, city: 28, tower: 29, clock: 30, streak: 31 };
const STREET_IDS = [2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 26], AKI_IDS = [18, 19, 20, 21, 22, 23], WATCH_IDS = [24, 25, 31], SKY_IDS = [1, 27, 28, 29, 30];

// ——— the street, the cut face ———
const ZF = -2.2, ZC = .9;                                     // facade plane, cut edge
const WORDS = ['BAKERY', 'BAR', 'BOOKS', '24H', 'PHARMACY', 'NOODLES', 'CAFE', 'LAUNDRY', 'RECORDS', 'HOTEL', 'FLOWERS'];
const SHOPS = []; { const r = mulberry(31031); let x = SPL.x * K - 3.9, i = 0;
  // the two shops behind the puddle are the 24H and the CAFE (seen upside down in the water)
  while (x < 30) { const w = 2.5 + r() * .8; SHOPS.push({ x0: x, x1: x + w, top: 4.0 + r() * .7, lit: r() < .85, ups: [r() < .5, r() < .5], awn: r() < .5, vbox: r() < .4, word: i === 1 ? '24H' : i === 2 ? 'CAFE' : WORDS[(i * 3) % WORDS.length], i, cool: r() < .25 }); x += w + .12; i++; } }
const PUDS = [{ x: SPL.x * K + .06, z: .02, rx: .62, rz: .36, hero: true }]; for (let x = SPL.x * K + 6; x < 30; x += 4 + hash(x) * 3) PUDS.push({ x, z: -.4 + hash(x * 3) * .9, rx: .45 + hash(x * 7) * .3, rz: .22 });
const PAL = { wall: ['#4a3e5c', '#56445e', '#3e4660', '#5a4a52', '#44405a'].map(hexc), win: hexc('#f8d488'), winC: hexc('#d6eae2'), dark: hexc('#2c2a48'), door: hexc('#5a3a40'),
  sign: hexc('#2e2640'), awn: ['#4f8a86', '#a07a4a', '#7a6aa8', '#5a7aa8'].map(hexc), boxc: ['#f08cb8', '#7cd8d0', '#f6c46a'].map(hexc), pave: hexc('#6a6488'), asph: hexc('#3a3850'),
  base: hexc('#8a8490'), sand: hexc('#b38c5c'), soil: hexc('#66402a'), deep: hexc('#4d3018'), pipe: hexc('#9aa0a8'), water: hexc('#bcd8ec'), pud: hexc('#a9c0e2') };
function buildStreet() {
  const by = {}; const B = k => by[k] || (by[k] = new Builder());
  for (const s of SHOPS) {
    const { x0, x1, top } = s, w = x1 - x0, ww = (w - .9) * .72, wx0 = x0 + .16, wx1 = wx0 + ww, dx0 = wx1 + .18, dx1 = dx0 + .5;
    box(B('wall'), x0, 0, ZF - .4, x1, top, ZF, PAL.wall[s.i % 5]);
    box(B('wall'), x0 - .03, top - .12, ZF - .4, x1 + .03, top, ZF + .06, PAL.wall[(s.i + 2) % 5].map(v => v * 1.15));
    box(B(s.lit ? 'win' : 'wall'), wx0, .36, ZF, wx1, 1.8, ZF + .02, s.lit ? (s.cool ? PAL.winC : PAL.win) : PAL.dark);
    for (const u of [0, .34, .67, 1]) box(B('door'), wx0 + ww * u - .03, .34, ZF, wx0 + ww * u + .03, 1.82, ZF + .05, PAL.door);
    box(B('door'), wx0 - .04, .3, ZF, wx1 + .04, .36, ZF + .06, PAL.door); box(B('door'), wx0 - .04, 1.8, ZF, wx1 + .04, 1.85, ZF + .06, PAL.door);
    box(B('door'), dx0, 0, ZF, dx1, 1.78, ZF + .03, s.lit ? PAL.door.map(v => v * 1.4) : PAL.door);
    box(B(s.lit ? 'win' : 'wall'), dx0 + .08, .9, ZF + .03, dx1 - .08, 1.62, ZF + .04, s.lit ? PAL.win : PAL.dark);
    box(B('sign'), x0 + .1, 1.96, ZF, x1 - .1, 2.3, ZF + .08, PAL.sign);
    if (s.awn) { const c = PAL.awn[s.i % 4], g = new THREE.BoxGeometry(ww + .3, .04, .55), m = new THREE.Matrix4().makeRotationX(.42).premultiply(new THREE.Matrix4().makeTranslation((wx0 + wx1) / 2, 1.9, ZF + .26)); append(B('awn'), g, m, () => c, V(0, 0, 1)); }
    if (s.vbox) box(B('box'), x1 - .34, 2.45, ZF, x1 - .2, 3.25, ZF + .34, PAL.boxc[s.i % 3]);
    for (let k = 0; k < 2; k++) { const ux = x0 + w * (k + .5) / 2 - .35; box(B(s.ups[k] ? 'win' : 'wall'), ux, 2.55, ZF, ux + .7, 3.4, ZF + .02, s.ups[k] ? PAL.win : PAL.dark); }
  }
  box(B('sky'), -20, -6, -40, 60, 30, -39.9, hexc('#2a2c5a'));                                                  // the night behind everything
  box(B('pave'), -20, -.03, ZF, 60, 0, ZC, PAL.pave, V(1, 0, 0));
  for (const p of PUDS) { const g = new THREE.CircleGeometry(1, 40), m = new THREE.Matrix4().makeScale(p.rx, 1, p.rz).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)).premultiply(new THREE.Matrix4().makeTranslation(p.x, .004, p.z)); append(B('pud'), g, m, () => PAL.pud, V(1, 0, 0)); }
  // the cut face: horizons in section, the storm drain cut lengthwise with rainwater in it, stones
  const PY = -.58, PR = .15;
  box(B('asph'), -20, -.14, ZF, 60, -.03, ZC, PAL.asph); box(B('base'), -20, PY + PR, ZF, 60, -.14, ZC, PAL.base);
  box(B('sand'), -20, PY - PR, ZF, 60, PY + PR, ZC - PR, PAL.sand); box(B('sand'), -20, -.98, ZF, 60, PY - PR, ZC, PAL.sand);
  box(B('soil'), -20, -1.7, ZF, 60, -.98, ZC, PAL.soil); box(B('deep'), -20, -3, ZF, 60, -1.7, ZC, PAL.deep);
  { const pts = [], rad = []; for (let x = -20; x <= 60; x += 2) { pts.push(V(x, PY, ZC)); rad.push(PR); } const b = B('pipe'), base = b.vc;
    tube(b, pts, rad, 16, (i, k) => PAL.pipe, (i, a) => 1, null); }
  box(B('water'), -20, PY - PR + .01, ZC - PR * .8, 60, PY - PR + .05, ZC - .01, PAL.water, V(1, 0, 0));
  const r = mulberry(55); for (let i = 0; i < 160; i++) { const x = -6 + r() * 36, y = -.2 - r() * 1.6, s = .015 + r() * .035; if (Math.abs(y - PY) < PR + .06) continue; const g = new THREE.SphereGeometry(1, 10, 8), m = new THREE.Matrix4().makeScale(s * 1.3, s, s * .25).premultiply(new THREE.Matrix4().makeTranslation(x, y, ZC)); append(B('base'), g, m, () => hexc('#7a7688').map(v => v * (.8 + r() * .3))); }
  const M = {
    sky: mat({ id: ID.sky, kind: 6, dens: .9, outline: 0, angle: .3 }), pave: mat({ id: ID.pave, kind: 4, angle: .1 }), wall: mat({ id: ID.wall, kind: 0, angle: 1.45 }),
    win: mat({ id: ID.win, kind: 6, dens: .8, angle: 1.5 }), door: mat({ id: ID.door, kind: 0, angle: 1.5 }), sign: mat({ id: ID.sign, kind: 0, angle: .1 }),
    awn: mat({ id: ID.awn, kind: 0, angle: 1.3 }), box: mat({ id: ID.box, kind: 6, dens: .8, angle: 1.5 }), pud: mat({ id: ID.pud, kind: 6, dens: .8, angle: .05, side: THREE.DoubleSide }),
    asph: mat({ id: ID.asph, kind: 1, angle: .8 }), base: mat({ id: ID.base, kind: 5, angle: .8 }), sand: mat({ id: ID.sand, kind: 1, angle: .8 }), soil: mat({ id: ID.soil, kind: 1, angle: .8 }),
    deep: mat({ id: ID.deep, kind: 1, angle: .8 }), pipe: mat({ id: ID.pipe, kind: 0, dir: 1, side: THREE.DoubleSide }), water: mat({ id: ID.water, kind: 6, dens: .6, angle: .05 }),
  };
  for (const [k, b] of Object.entries(by)) meshOf(b, M[k], 'street');
}

// ——— the watch (S3 set, far away from the street) and the sky over the station (S4 set) ———
const WX = 300, WY = 10;                                        // the watch set origin
const ARM = { a: V(WX - .9, WY - .26, 0), b: V(WX + .55, WY + .1, 0) };
function buildWatch() {
  const by = {}; const B = k => by[k] || (by[k] = new Builder());
  box(B('sky'), WX - 8, WY - 6, -6, WX + 8, WY + 6, -5.9, hexc('#262850'));
  const d = ARM.b.clone().sub(ARM.a), L = d.length(), u = d.clone().normalize(), at = s => ARM.a.clone().add(u.clone().multiplyScalar(s));
  const sl = [], sr = []; for (let s = 0; s <= .8; s += .1) { sl.push(at(s)); sr.push(.155 - s * .01); } tube(B('jacket'), sl, sr, 18, () => hexc('#d94c3a'));
  const cf = [at(.78), at(.88)]; tube(B('jacket'), cf, [.14, .14], 18, () => hexc('#a8302a'));
  const sk = [], skr = []; for (let s = .86; s <= 1.56; s += .06) { sk.push(at(s)); skr.push(s < 1.25 ? .1 : .1 + (s - 1.25) * .06); } tube(B('skin'), sk, skr, 16, () => hexc('#f0c4a8'));
  append(B('skin'), new THREE.SphereGeometry(.125, 18, 14), new THREE.Matrix4().makeScale(1.15, 1, .9).premultiply(new THREE.Matrix4().makeTranslation(at(1.6).x, at(1.6).y, 0)), () => hexc('#f0c4a8'));
  const wc = at(1.06).add(V(0, 0, .1)); WATCH.c = wc; WATCH.u = u;
  const rot = new THREE.Matrix4().makeRotationX(Math.PI / 2);
  append(B('gold'), new THREE.CylinderGeometry(.13, .13, .06, 40), rot.clone().premultiply(new THREE.Matrix4().makeTranslation(wc.x, wc.y, wc.z)), () => hexc('#d8a84a'));
  append(B('strap'), new THREE.CylinderGeometry(.106, .106, .1, 24, 1, true), new THREE.Matrix4().makeRotationZ(Math.atan2(u.y, u.x) + Math.PI / 2).premultiply(new THREE.Matrix4().makeTranslation(wc.x, wc.y, 0)), () => hexc('#6a4632'));
  append(B('dial'), new THREE.CircleGeometry(.112, 48), new THREE.Matrix4().makeTranslation(wc.x, wc.y, wc.z + .031), () => hexc('#fbf2dc'), V(1, 0, 0));
  for (let k = 0; k < 12; k++) { const a = Math.PI / 2 - k / 12 * TAU + Math.atan2(u.y, u.x), r0 = k % 3 ? .088 : .08; const g = new THREE.BoxGeometry(k % 3 ? .006 : .01, .104 - r0 - .002 + .012, .004);
    append(B('hands'), g, new THREE.Matrix4().makeRotationZ(a - Math.PI / 2).premultiply(new THREE.Matrix4().makeTranslation(wc.x + Math.cos(a) * (r0 + .104) / 2, wc.y + Math.sin(a) * (r0 + .104) / 2, wc.z + .034)), () => hexc('#3a2a20')); }
  const M = { sky: mat({ id: ID.sky, kind: 6, dens: .9, outline: 0, angle: .2 }), jacket: mat({ id: ID.jacket, kind: 0, dir: 1 }), skin: mat({ id: ID.skin, kind: 0, dir: 1 }), gold: mat({ id: ID.gold, kind: 0, dir: 2 }),
    strap: mat({ id: ID.boots, kind: 0, dir: 0, angle: 1.4, side: THREE.DoubleSide }), dial: mat({ id: ID.dial, kind: 6, dens: .35, angle: .5 }), hands: mat({ id: ID.hands, kind: 6, dens: 1, outline: .4 }) };
  for (const [k, b] of Object.entries(by)) meshOf(b, M[k], 'watch');
  WATCH.handMesh = meshOf(new Builder(), mat({ id: ID.hands, kind: 6, dens: 1, outline: .5 }), 'watchdyn');
  WATCH.streakMesh = meshOf(new Builder(), mat({ id: ID.streak, kind: 6, dens: .9, outline: .25, angle: 0 }), 'watchdyn');
}
const WATCH = {};
const SX = -300, SY = 10;                                       // the sky set origin
const CLOCK = { c: V(SX + 1.1, SY + 1.05, -6), r: .42 };
function buildSky() {
  const by = {}; const B = k => by[k] || (by[k] = new Builder()); const r = mulberry(4040);
  box(B('sky'), SX - 40, SY - 40, -40, SX + 40, SY + 30, -39.9, hexc('#363c78'));
  for (let i = 0; i < 7; i++) { const cx = SX - 9 + i * 3 + r(), cy = SY + 2.6 + r() * 3.6, g = new THREE.SphereGeometry(1, 16, 10);
    for (let k = 0; k < 4; k++) append(B('cloud'), g, new THREE.Matrix4().makeScale(1.3 + r(), .45 + r() * .2, .4).premultiply(new THREE.Matrix4().makeTranslation(cx + (k - 1.5) * 1.1, cy + Math.sin(k * 1.7) * .2, -30)), () => hexc('#5e5a86')); }
  let x = SX - 8; while (x < SX + 8) { const w = .9 + r() * 1.3, h = .4 + r() * 1.4; if (Math.abs(x + w / 2 - CLOCK.c.x) < 1.1) { x += w; continue; }
    box(B('city'), x, SY - 9, -8, x + w, SY + h - .4, -7.4, hexc('#3c3a62'));
    for (let yy = SY - 1.8; yy < SY + h - .6; yy += .3) for (let xx = x + .1; xx < x + w - .15; xx += .24) if (r() < .3) box(B('win'), xx, yy, -7.39, xx + .1, yy + .14, -7.38, hexc('#fbe3a4'));
    x += w + .05; }
  const c = CLOCK.c; box(B('tower'), c.x - .62, SY - 9, c.z - .5, c.x + .62, c.y + .62, c.z - .02, hexc('#4a4670'));
  append(B('tower'), new THREE.ConeGeometry(.9, 1.0, 4), new THREE.Matrix4().makeRotationY(Math.PI / 4).premultiply(new THREE.Matrix4().makeTranslation(c.x, c.y + 1.12, c.z - .26)), () => hexc('#38345a'));
  append(B('clock'), new THREE.CircleGeometry(CLOCK.r, 40), new THREE.Matrix4().makeTranslation(c.x, c.y, c.z), () => [1, 1, 1], V(1, 0, 0));
  for (let k = 0; k < 12; k++) { const a = Math.PI / 2 - k / 12 * TAU; box(B('hands'), c.x + Math.cos(a) * .34 - .015, c.y + Math.sin(a) * .34 - .015, c.z, c.x + Math.cos(a) * .34 + .015, c.y + Math.sin(a) * .34 + .015, c.z + .01, hexc('#2a2028')); }
  const hand = (f, L, w) => { const a = Math.PI / 2 - f * TAU, g = new THREE.BoxGeometry(w, L, .01); append(B('hands'), g, new THREE.Matrix4().makeRotationZ(a - Math.PI / 2).premultiply(new THREE.Matrix4().makeTranslation(c.x + Math.cos(a) * L / 2, c.y + Math.sin(a) * L / 2, c.z + .012)), () => hexc('#2a2028')); };
  hand((11 + 58 / 60) / 12, .2, .04); hand(58 / 60, .3, .03);
  CLOCK.mat = mat({ id: ID.clock, kind: 6, dens: .5, angle: .4, color: [.98, .95, .88] });
  const M = { sky: mat({ id: ID.sky, kind: 6, dens: .72, outline: 0, angle: .3 }), cloud: mat({ id: ID.cloud, kind: 0, dir: 2 }), city: mat({ id: ID.city, kind: 0, angle: 1.5 }), win: mat({ id: ID.win, kind: 6, dens: .6 }),
    tower: mat({ id: ID.tower, kind: 0, angle: 1.4 }), clock: CLOCK.mat, hands: mat({ id: ID.hands, kind: 6, dens: 1, outline: .5 }) };
  for (const [k, b] of Object.entries(by)) meshOf(b, M[k], 'sky');
}

// ——— AKI, rebuilt each drawing: tubes from the shared rig, own reference for her strokes ———
const AKI = {}, AKC = { jacket: hexc('#d94c3a'), trousers: hexc('#3e3e5e'), boots: hexc('#7a4e34'), skin: hexc('#f0c4a8'), hair: hexc('#4a2c56'), sweater: hexc('#eee2cc'), gold: hexc('#d8a84a') };
function initAki() {
  for (const k of ['jacket', 'trousers', 'boots', 'skin', 'hair', 'gold']) { const m = mat({ id: ID[k], kind: 0, dir: k === 'hair' ? 2 : 1, angle: .9 }); m.uniforms.uRefVP = { value: new THREE.Matrix4() }; AKI[k] = meshOf(new Builder(), m, 'aki'); }
}
function buildAki(J, o = {}) {
  const by = { jacket: new Builder(), trousers: new Builder(), boots: new Builder(), skin: new Builder(), hair: new Builder(), gold: new Builder() };
  const col = k => () => AKC[k];
  const leg = (l, z, dark) => { tube(by.trousers, [W3(l.hip, z), W3(l.knee, z), W3(l.ankle, z)], [.075, .058, .046], 12, () => AKC.trousers.map(v => v * dark));
    const c = Math.cos(l.pitch), s = Math.sin(l.pitch), F = ([u, v]) => [l.ankle[0] + u * c - v * s, l.ankle[1] + u * s + v * c];
    const kn = [l.knee[0] - l.ankle[0], l.knee[1] - l.ankle[1]], kd = Math.hypot(...kn) || 1;
    tube(by.boots, [W3([l.ankle[0] + kn[0] / kd * 46, l.ankle[1] + kn[1] / kd * 46], z), W3(l.ankle, z), W3(F([30, 12]), z), W3(F([60, 12]), z), W3(F([68, 10]), z)], [.052, .05, .042, .034, .02], 12, () => AKC.boots.map(v => v * dark)); };
  const arm = (a, z, dark, watch) => { const ue = [a.wr[0] - a.el[0], a.wr[1] - a.el[1]], d = Math.hypot(...ue) || 1, u = [ue[0] / d, ue[1] / d];
    tube(by.jacket, [W3(a.sh, z), W3(a.el, z), W3([a.wr[0] - u[0] * 4, a.wr[1] - u[1] * 4], z)], [.052, .046, .046], 12, () => AKC.jacket.map(v => v * dark));
    append(by.skin, new THREE.SphereGeometry(.045, 12, 8), new THREE.Matrix4().makeScale(1.25, 1, 1).premultiply(new THREE.Matrix4().makeRotationZ(-Math.atan2(u[1], u[0]))).premultiply(new THREE.Matrix4().makeTranslation(...W3([a.wr[0] + u[0] * 16, a.wr[1] + u[1] * 16], z).toArray())), () => AKC.skin.map(v => v * dark));
    if (watch) append(by.gold, new THREE.CylinderGeometry(.03, .03, .05, 14), new THREE.Matrix4().makeRotationX(Math.PI / 2).premultiply(new THREE.Matrix4().makeTranslation(...W3([a.wr[0] + u[0] * 2, a.wr[1] + u[1] * 2], z + .03).toArray())), col('gold')); };
  arm(J.arm.f, -.1, .7, false); leg(J.leg.f, -.07, .7); leg(J.leg.n, .07, 1);
  const uL = J.uL, fL = J.fL, T = (b, u, f) => [b[0] + uL[0] * u + fL[0] * f, b[1] + uL[1] * u + fL[1] * f], hb = o.hemB || [0, 0];
  tube(by.jacket, [W3([T(J.pelvis, -86, -6)[0] + hb[0] * .5, T(J.pelvis, -86, -6)[1] + hb[1] * .5]), W3(T(J.pelvis, -30, 0)), W3(J.waist), W3(T(J.neckBase, -24, 0)), W3(T(J.neckBase, 2, 2))], [.2, .175, .16, .17, .1], 16, col('jacket'));
  tube(by.skin, [W3(J.neckBase), W3(J.neckTop)], [.045, .042], 10, col('skin'));
  const hc = J.headC, HR = p => { const c = Math.cos(J.headA), s = Math.sin(J.headA); return [hc[0] + p[0] * c - p[1] * s, hc[1] + p[0] * s + p[1] * c]; };
  append(by.skin, new THREE.SphereGeometry(.112, 18, 14), new THREE.Matrix4().makeScale(.95, 1.05, .9).premultiply(new THREE.Matrix4().makeTranslation(...W3(HR([4, 0])).toArray())), col('skin'));
  append(by.skin, new THREE.SphereGeometry(.03, 8, 6), new THREE.Matrix4().makeTranslation(...W3(HR([44, -2]), .0).toArray()), col('skin'));
  const lag = o.hair || [0, 0], lx = clamp(lag[0] * .45, -30, 8), ly = clamp(lag[1] * .35, -12, 14);
  append(by.hair, new THREE.SphereGeometry(.122, 18, 14), new THREE.Matrix4().makeScale(.98, .92, .96).premultiply(new THREE.Matrix4().makeTranslation(...W3(HR([-10, -14])).toArray())), col('hair'));
  tube(by.hair, [W3(HR([-14, -36])), W3(HR([-40, 0])), W3([HR([-48, 40])[0] + lx, HR([-48, 40])[1] + ly]), W3([HR([-40, 58])[0] + lx, HR([-40, 58])[1] + ly])], [.1, .1, .085, .05], 12, col('hair'));
  tube(by.hair, [W3(HR([0, -50]), .02), W3(HR([30, -32]), .03), W3(HR([40, -20]), .03)], [.05, .035, .015], 10, col('hair'));
  append(by.jacket, new THREE.TorusGeometry(.07, .025, 8, 16), new THREE.Matrix4().makeRotationX(Math.PI / 2).premultiply(new THREE.Matrix4().makeTranslation(...W3(T(J.neckBase, 6, 4)).toArray())), () => AKC.sweater);
  arm(J.arm.n, .1, 1, true);
  for (const [k, b] of Object.entries(by)) { AKI[k].geometry.dispose(); AKI[k].geometry = b.p.length ? b.geo() : new THREE.BufferGeometry(); }
}
const setAkiRef = (dx) => { const m = new THREE.Matrix4().multiplyMatrices(refCam.projectionMatrix, refCam.matrixWorldInverse).multiply(new THREE.Matrix4().makeTranslation(-dx, 0, 0)); for (const k in AKI) AKI[k].material.uniforms.uRefVP.value.copy(m); };

// ——— cameras (fixed orientation per shot; the camera only translates inside a shot) ———
const P1 = -.16, P2 = -.06, P3 = 0, P4 = .02;
const s1Cam = t => V(SPL.x * K + .12 + .035 * t, .32, 1.55);
const s2Cam = t => V(X(t) * K + .95, .58 + 6 * Math.tan(-P2), 6);
const s3Cam = t => { const a = t - 7.5; return V(WATCH.c.x + .02 + .03 * a + .006 * Math.sin(TAU * CADENCE * a * .5), WATCH.c.y + .012 * Math.sin(TAU * CADENCE * a), 1.05); };
const s4Cam = t => { const a = clamp(t - 9.375, 0, 1); return V(SX + .2, SY + 1.0 - .35 * a * a - .1 * a, 9); };
const hideFor = keep => { const all = [...STREET_IDS, ...AKI_IDS, ...WATCH_IDS, ...SKY_IDS, ID.boots]; return [...new Set(all)].filter(i => !keep.includes(i)); };
const VIEW = {
  S1: t => ({ pos: s1Cam(t), ref: s1Cam(0), pitch: P1, focus: { [ID.wall]: .35, [ID.win]: .4, [ID.door]: .35, [ID.sign]: .35, [ID.awn]: .35, [ID.box]: .4 }, hide: hideFor([...STREET_IDS, ...AKI_IDS]) }),
  S2: t => ({ pos: s2Cam(t), ref: s2Cam(2.5), pitch: P2, focus: { [ID.wall]: .8, [ID.win]: .7 }, hide: hideFor([...STREET_IDS, ...AKI_IDS, ID.sky]) }),
  S3: t => ({ pos: s3Cam(t), ref: s3Cam(7.5), pitch: P3, focus: {}, hide: hideFor([ID.sky, ID.jacket, ID.skin, ID.gold, ID.boots, ...WATCH_IDS]) }),
  S4: t => ({ pos: s4Cam(t), ref: s4Cam(9.375), pitch: P4, focus: { [ID.cloud]: .5, [ID.city]: .7 }, hide: hideFor([...SKY_IDS, ID.win, ID.hands]) }),
};
function useView(v) { CQ.setFromEuler(new THREE.Euler(v.pitch, 0, 0, 'YXZ')); setCamera(v); }

// ——— overlays: shop names in graphite, rain in white pencil, the puddle's reflections in coloured pencil, the magnifier ring ———
const pencilText = (c, str, x, y, size, col = '#000', alpha = 1) => { c.save(); c.font = `600 ${size}px Caveat`; c.textAlign = 'center'; c.fillStyle = col; c.globalAlpha = alpha; c.fillText(str, x, y); c.restore(); };
function pline(c, pts, w, seed, alpha = 1, col = '#000') {
  c.save(); c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  for (let pass = 0; pass < 2; pass++) { c.globalAlpha = alpha * (pass ? .75 : 1); c.lineWidth = w * (pass ? .6 : 1); c.beginPath();
    pts.forEach(([x, y], i) => { const jx = (hash(seed + i * 1.7 + pass * 9) - .5) * 1.4 + (hash(seed + i * 3.1 + BOILV * 5 + pass) - .5) * .7, jy = (hash(seed * 1.3 + i * 2.3 + pass * 7) - .5) * 1.4; i ? c.lineTo(x + jx, y + jy) : c.moveTo(x + jx, y + jy); }); c.stroke(); }
  c.restore();
}
let BOILV = 0;
function signWords() {
  for (const s of SHOPS) { const c = V((s.x0 + s.x1) / 2, 2.13, ZF + .085), p = proj(c), q = proj(c.clone().add(V(0, .28, 0))); if (p[0] < -300 || p[0] > W + 300 || p[1] < -80 || p[1] > H + 80) continue;
    const sz = Math.abs(q[1] - p[1]) * .95; pencilText(ik, s.word, p[0], p[1] + sz * .34, sz); }
}
function windowNeon(alphaW) {   // the little neon signs hanging in the 24H and CAFE windows (what the puddle reflects)
  const out = []; for (const s of SHOPS.slice(1, 3)) { const c = V(s.x0 + .16 + (s.x1 - s.x0 - .9) * .36, .5, ZF + .03); out.push({ s, c, col: s.word === '24H' ? '#e8609a' : '#e8a040' }); }
  for (const n of out) { const p = proj(n.c), q = proj(n.c.clone().add(V(0, .22, 0))), sz = Math.abs(q[1] - p[1]); pencilText(cl, n.s.word, p[0], p[1] + sz * .35, sz, n.col, alphaW); }
  return out;
}
function rainLines(c, t, n, ang, seed, w = 1.4, a = .55) {
  c.save(); c.strokeStyle = '#000'; c.lineCap = 'round'; const dx = Math.cos(ang), dy = Math.sin(ang);
  for (let i = 0; i < n; i++) { const r1 = hash(i * 1.37 + seed), r2 = hash(i * 7.11 + seed), v = 1500 + r2 * 900, L = 26 + r1 * 44, span = H * 1.3, d = ((r2 * span + v * t) % span) - H * .15, x = r1 * W * 1.25 - W * .1 + dx * d, y = d * dy;
    c.globalAlpha = a * (.6 + r2 * .4); c.lineWidth = w * (.7 + r2 * .6); c.beginPath(); c.moveTo(x, y); c.lineTo(x + dx * L, y + dy * L); c.stroke(); }
  c.restore();
}
function puddleRim(p, n = 40) { const out = []; for (let i = 0; i <= n; i++) { const a = i / n * TAU; out.push(proj(V(p.x + Math.cos(a) * p.rx, .005, p.z + Math.sin(a) * p.rz))); } return out; }
function ringPts(cx, cz, r, rz, y = .006, n = 24) { const o = []; for (let i = 0; i <= n; i++) { const a = i / n * TAU; o.push(proj(V(cx + Math.cos(a) * r, y, cz + Math.sin(a) * rz))); } return o; }
function overlayS1(t) {
  const neon = windowNeon(.75);
  // reflections: the neon words mirrored in the water, sliced by the ripples; clipped to the puddle
  const P = PUDS[0], rim = puddleRim(P);
  cl.save(); cl.beginPath(); rim.forEach((p, i) => i ? cl.lineTo(...p) : cl.moveTo(...p)); cl.closePath(); cl.clip();
  for (const n of neon) { const m = n.c.clone(); m.y = -m.y; const p = proj(m), q = proj(m.clone().add(V(0, -.22, 0))), sz = Math.abs(q[1] - p[1]);
    const off = document.createElement('canvas'); off.width = Math.ceil(sz * 4); off.height = Math.ceil(sz * 1.4); const o = off.getContext('2d'); o.translate(off.width / 2, off.height * .2); o.scale(1, -1); o.font = `600 ${sz}px Caveat`; o.textAlign = 'center'; o.fillStyle = n.col; o.fillText(n.s.word, 0, -sz * .05);
    for (let y = 0; y < off.height; y += 4) { let dx = 4 * Math.sin(y * .3 + t * 6.5) + 2 * Math.sin(y * .8 - t * 9);
      if (t > EV.splash) { const a = t - EV.splash, sp = proj(V(SPL.x * K, 0, 0)), d = Math.hypot(p[0] - sp[0], (p[1] + y - sp[1]) * 3); dx += 26 * Math.exp(-a * 1.6) * Math.sin(d * .03 - a * 12) * clamp((a * 900 - d) / 200 + 1, 0, 1); }
      cl.globalAlpha = .85; cl.drawImage(off, 0, y, off.width, 4, p[0] - off.width / 2 + dx, p[1] - off.height * .2 + y, off.width, 4); } }
  cl.restore();
  // the lit windows' lower edges, mirrored in the water: warm pencil hatching
  cl.save(); cl.beginPath(); rim.forEach((p, i) => i ? cl.lineTo(...p) : cl.moveTo(...p)); cl.closePath(); cl.clip(); cl.strokeStyle = '#e8a850'; cl.lineWidth = 2.2;
  for (const s of SHOPS.slice(0, 4)) { if (!s.lit) continue; const ww = (s.x1 - s.x0 - .9) * .72, a = proj(V(s.x0 + .16, -.36, ZF)), b = proj(V(s.x0 + .16 + ww, -.9, ZF));
    for (let y = a[1]; y < b[1]; y += 5) { const dx = 4 * Math.sin(y * .2 + t * 6); cl.globalAlpha = .55 * (1 - (y - a[1]) / (b[1] - a[1] + 1)); const e0 = (hash(y) - .3) * 60, e1 = (hash(y * 3) - .3) * 60; cl.beginPath(); cl.moveTo(a[0] + dx + e0, y); cl.lineTo(b[0] + dx - e1, y + 2); cl.stroke(); } }
  cl.restore();
  // ripples in graphite: rain rings, the splash rings
  for (let i = 0; i < 12; i++) { const per = .55 + hash(i * 1.3 + 3) * .4, off = hash(i * 7.7 + 3) * per, cyc = Math.floor((t + off) / per), ph = ((t + off) % per) / per;
    const x = P.x + (hash(i * 3.3 + cyc * 1.91) - .5) * P.rx * 1.5, z = P.z + (hash(i * 5.1 + cyc * .77) - .5) * P.rz * 1.5; if (((x - P.x) / P.rx) ** 2 + ((z - P.z) / P.rz) ** 2 > .75) continue;
    pline(ik, ringPts(x, z, .02 + ph * .1, (.02 + ph * .1) * .8), 1.4, i * 31 + cyc, .55 * (1 - ph)); }
  if (t > EV.splash) for (let i = 0; i < 3; i++) { const a = t - EV.splash - i * .14; if (a < 0 || a > 1.4) continue; const r = .08 + a * .55; pline(ik, ringPts(SPL.x * K + .04, .03, r, r * .7).filter(p => true), 2.2 - i * .4, 70 + i, .8 * (1 - a / 1.4)); }
  rainLines(tg, t, 110, 1.68, 1, 2.2, .5);
}
function overlayS2(t) {
  signWords();
  for (const p of PUDS.slice(1)) { const c = proj(V(p.x, 0, p.z)); if (c[0] < -200 || c[0] > W + 200) continue; for (let i = 0; i < 3; i++) { const per = .7, ph = ((t + hash(p.x + i) * per) % per) / per, cyc = Math.floor((t + hash(p.x + i) * per) / per); const x = p.x + (hash(p.x * 3 + i + cyc) - .5) * p.rx, z = p.z + (hash(p.x * 5 + i + cyc) - .5) * p.rz * .8; pline(ik, ringPts(x, z, .02 + ph * .1, (.02 + ph * .1) * .6), 1.2, (p.x * 10 | 0) + i + cyc, .45 * (1 - ph)); } }
  for (const c of RUN.contacts) if (t >= c.t0 && t < c.t0 + .45) { const a = t - c.t0, r = .04 + a * .35; pline(ik, ringPts(c.x * K + .03, 0, r, r * .6), 1.4, (c.t0 * 100) | 0, .7 * (1 - a / .45)); }
  rainLines(tg, t, 220, 1.95, 3, 1.5, .5);
}
function overlayS4(t) { rainLines(tg, t, 200, 1.72, 7, 1.4, .5); }
function ring(cx, cy, r, prog, alpha, seed) { if (prog <= 0 || alpha <= 0) return; const n = 64, pts = []; for (let i = 0; i <= n * prog; i++) { const a = -Math.PI / 2 + i / n * TAU; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } pline(ik, pts, 3.2, seed, alpha); }

// ——— dynamic geometry: drops, the watch hands, the lights rushing past ———
let dropMesh;
function buildDrops(t, inS1) {
  const b = new Builder(), g = new THREE.SphereGeometry(1, 8, 6), col = () => hexc('#dfeaf6');
  const a = t - EV.splash;
  if (inS1 && a > 0 && a < .8) for (let j = 0; j < 14; j++) { const th = (hash(j * 1.7) - .5) * 2.4, ph = hash(j * 9) * TAU, v = 1.1 + hash(j * 3.1) * 1.6, a2 = a + .02;
    const x = SPL.x * K + .04 + Math.sin(th) * Math.cos(ph) * v * a2 * 1.1 + (hash(j * 11) - .5) * .08, z = Math.sin(th) * Math.sin(ph) * v * a2 * .6, y = Math.cos(th) * v * a2 - 4.9 * a2 * a2; if (y < 0) continue;
    const s = .004 + hash(j * 5) * .007; append(b, g, new THREE.Matrix4().makeScale(s, s * 1.2, s).premultiply(new THREE.Matrix4().makeTranslation(x, y, z)), col); }
  if (inS1 && a > 0 && a < .4) for (let j = 0; j < 12; j++) { const th = j / 12 * TAU, k = eo(a / .16), fall = clamp((a - .18) / .22, 0, 1), L = (.06 + .08 * hash(j)) * k * (1 - fall); if (L < .005) continue;
    const bx = SPL.x * K + .04 + Math.cos(th) * (.05 + .12 * k), bz = Math.sin(th) * (.04 + .1 * k); tube(b, [V(bx, .005, bz), V(bx + Math.cos(th) * L * .4, L, bz + Math.sin(th) * L * .3)], [.008, .002], 6, col); }
  for (const c of RUN.contacts) { const a2 = t - c.t0; if (c === SPL || a2 < 0 || a2 > .4) continue; for (let j = 0; j < 7; j++) { const th = (hash(j + c.t0) - .5) * 2.2, v = .7 + hash(j * 3 + c.t0) * .7, x = c.x * K + .03 + Math.sin(th) * v * a2 * .7, y = Math.cos(th) * v * a2 - 4.9 * a2 * a2; if (y < 0) continue; append(b, g, new THREE.Matrix4().makeScale(.008, .01, .008).premultiply(new THREE.Matrix4().makeTranslation(x, y, (hash(j * 7) - .5) * .2)), col); } }
  dropMesh.geometry.dispose(); dropMesh.geometry = b.p.length ? b.geo() : new THREE.BufferGeometry();
}
const secAt = t => { const k = t < 7.9 ? 47 : t < 8.9 ? 48 : 49, t0 = t < 7.9 ? 6.9 : t < 8.9 ? 7.9 : 8.9, a = t - t0; return k - 1 + (a < .14 ? back(a / .14, 2.4) : 1); };
function buildWatchDyn(t) {
  const b = new Builder(), wc = WATCH.c, a0 = Math.atan2(WATCH.u.y, WATCH.u.x);
  const hand = (f, L, w, tail, col) => { const a = Math.PI / 2 + a0 - f * TAU, g = new THREE.BoxGeometry(w, L + tail, .004); append(b, g, new THREE.Matrix4().makeRotationZ(a - Math.PI / 2).premultiply(new THREE.Matrix4().makeTranslation(wc.x + Math.cos(a) * (L - tail) / 2, wc.y + Math.sin(a) * (L - tail) / 2, wc.z + .04)), () => col); };
  hand((11 + 58 / 60) / 12, .055, .01, .012, hexc('#2a1c14')); hand(58 / 60, .085, .007, .014, hexc('#2a1c14')); hand(secAt(t) / 60, .095, .003, .025, hexc('#b03a2c'));
  append(b, new THREE.CylinderGeometry(.009, .009, .01, 12), new THREE.Matrix4().makeRotationX(Math.PI / 2).premultiply(new THREE.Matrix4().makeTranslation(wc.x, wc.y, wc.z + .045)), () => hexc('#d8a84a'));
  WATCH.handMesh.geometry.dispose(); WATCH.handMesh.geometry = b.geo();
  const s = new Builder(), cols = ['#f6c46a', '#f08cb8', '#7cd8d0', '#fbe3a4', '#b49af0'].map(hexc), a = t - 7.5;
  for (let i = 0; i < 26; i++) { const v = 2.4 + hash(i * 1.3) * 3, L = .2 + v * .12, x = WX - 3 + (((hash(i * 4.4) * 6 - v * a) % 6) + 6) % 6, y = WY - .9 + hash(i * 6.6) * 1.8, z = -1.5 - hash(i * 2.2) * 2;
    tube(s, [V(x, y, z), V(x + L, y, z)], [.012 + hash(i) * .02, .004], 8, () => cols[i % 5]); }
  WATCH.streakMesh.geometry.dispose(); WATCH.streakMesh.geometry = s.geo();
}

// ——— frame ———
function figure(t) { const S = poseAt(t), J = solveProfile(S), sc = secondary(q => { const p = RUN.pelvisAt(q); return [p[0], p[1] - 250]; }, 0, t); return { S, J, sc }; }
function frame(t) {
  const f = Math.round(t * 30); BOILV = Math.floor(f / 2) % 3; const id = shotAt(t)[2];
  SHARED.uTime.value = t; SHARED.uWindT.value = Math.floor(t * 12) / 12;
  postMat.uniforms.uBoil.value = BOILV;
  for (const c of [tg, ik, cl]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); }
  let main, inset = null, iris = null;
  // AKI: on twos in the locked insert, on ones under the tracking camera
  const tA = id === 'S1' ? Math.floor(t * 15 + 1e-6) / 15 + 1 / 30 : t;
  const showAki = (id === 'S1' && tA > .4 && tA < 1.8) || id === 'S2' || (id === 'S3' && t < 7.9);
  if (showAki) { const { J, sc } = figure(tA); buildAki(J, { hemB: sc.hemB, hair: sc.hair.back }); }
  buildDrops(t, id === 'S1');
  if (id === 'S3' || (id === 'S4' && t < 9.7)) buildWatchDyn(t);
  if (id === 'S1') { main = VIEW.S1(t); }
  else if (id === 'S2') { main = VIEW.S2(t); }
  else if (id === 'S3') {
    if (t < 7.9) {   // the magnifier opens on her wrist
      main = VIEW.S2(t); useView(main); const J = solveProfile(poseAt(t)), wr = proj(W3(J.arm.n.wr, .1));
      const k = eio(clamp((t - 7.6) / .3, 0, 1)), cx = lerp(wr[0], W / 2, k), cy = lerp(wr[1], H / 2, k), r = lerp(70, 2300, k * k);
      inset = { ...VIEW.S3(t), redraw: { t: 7.52, cx, cy, k: .00045 } }; iris = { cx, cy, r, inner: t > 7.6, ring: clamp((t - 7.5) / .1, 0, 1), ringA: 1 - ss((k - .45) / .4) };
    } else main = VIEW.S3(t);
  } else {
    if (t < 9.8) {   // the magnifier closes onto the station clock
      main = VIEW.S4(t); useView(main); const cw = proj(CLOCK.c), cr = Math.abs(proj(CLOCK.c.clone().add(V(CLOCK.r, 0, 0)))[0] - cw[0]);
      const k = eio(clamp((t - 9.375) / .2, 0, 1)), cx = lerp(W / 2, cw[0], k), cy = lerp(H / 2, cw[1], k), r = lerp(2300, cr + 6, Math.sqrt(k));
      inset = t < 9.575 ? VIEW.S3(t) : null; iris = { cx, cy, r, inner: t < 9.575, ring: 1, ringA: t < 9.575 ? ss((k - .3) / .4) : 1 - clamp((t - 9.575) / .2, 0, 1) };
    } else main = VIEW.S4(t);
  }
  // the clock face takes the warm accent on the chime
  const ch = clamp((t - EV.chime) / .25, 0, 1); CLOCK.mat.uniforms.uColor.value.setRGB(lerp(.98, 1.0, ch), lerp(.95, .8, ch), lerp(.88, .42, ch)); CLOCK.mat.uniforms.uDens.value = lerp(.5, 1.0, ch);
  useView(main); if (showAki) setAkiRef(id === 'S1' ? (X(tA) - X(.9375)) * K : (X(t) - X(2.5)) * K);
  renderView(main, rtP1);
  // overlays for the main view
  if (id === 'S1') overlayS1(t); else if (id === 'S2' || (id === 'S3' && t < 7.9)) overlayS2(t); else if (id === 'S4') overlayS4(t);
  if (inset) { useView(inset); if (showAki) setAkiRef((X(t) - X(2.5)) * K); renderView(inset, rtP2); useView(main); }
  if (iris && iris.inner && inset) for (const c of [tg, ik, cl]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(iris.cx, iris.cy, iris.r, 0, TAU); c.fill(); c.restore(); }   // the main view's marks stay outside the magnifier
  if (iris) ring(iris.cx, iris.cy, iris.r, iris.ring, iris.ringA, 9);
  compMat.uniforms.uIris.value.set(iris ? iris.cx : 0, iris ? iris.cy : 0, iris ? iris.r : 0, iris && iris.inner && inset ? 1 : 0);
  tagT.needsUpdate = true; inkT.needsUpdate = true; colT.needsUpdate = true;
  labelTooth(iris && iris.inner && iris.r > 900 && inset ? inset : main); useView(main);
  quad.material = compMat; renderer.setRenderTarget(rtC); renderer.render(qScene, qCam);
  quad.material = downMat; downMat.uniforms.tP.value = rtC.texture; renderer.setRenderTarget(null); renderer.render(qScene, qCam);
}

(async () => {
  try { await document.fonts.load('600 60px Caveat'); } catch (e) { }
  buildStreet(); buildWatch(); buildSky(); initAki();
  dropMesh = meshOf(new Builder(), mat({ id: ID.drops, kind: 6, dens: .5, outline: .6 }), 'drops');
  window.DUR = DUR; window.render = t => frame(t);
  window.RIGQA = t => { const id = shotAt(t)[2]; let tq = t; if (id === 'S1') { tq = Math.floor(t * 15 + 1e-6) / 15 + 1 / 30; if (tq <= .4 || tq >= 1.8) return null; } else if (id !== 'S2') return null; const J = solveProfile(poseAt(tq)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
  frame(0); window.READY = true;
})();
window.DUR = DUR;
