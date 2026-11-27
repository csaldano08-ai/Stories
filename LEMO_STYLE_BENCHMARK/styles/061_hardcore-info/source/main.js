// 061 · Line-Art Cutaway — the first 10 s of "Last Train Home" as a live technical drawing (lemo-opuscar styles/hardcore-info).
// A narrative adaptation: the style explains a real object built to size; here the object is the scene itself, built in millimetres
// from our own scene model (AKI 1 620 mm on the shared rig, 2.8 mm per rig unit; her watch Ø 36 mm; the street, its shops and the
// station tower), so every number on screen is a fact of that model, never an outside statistic. The one accent belongs to one path:
// her route to the station. It lights the pavement behind her as she runs (its head is her), and floods its end part, the station
// clock, at the chime — while the route ahead of her is still grey: she is not there yet.
// S1: a section sweep opens on the puddle cut through the pavement (slab | bedding | sub-base | water, each its own hatch); her legs
//     cross, the far foot lands in the water at 0.94 s, drops fly as traced beads, rings spread. A dive into the water section.
// S2: tracking her along the shopfronts (the route lit under her); a ruler at model scale measures one step; the watch raise.
// S3: through a closing circle onto her watch: locked top-down with a magnifier cross-section of the case; the seconds tick.
// S4: the dial circle becomes the tower's clock; pull back with a slow orbit; at the chime the clock floods with the accent.
// Engine: engine/line.js (excerpt of the demo: renderer, tracing shader, jitter accumulation, label kit). Page contract:
// window.render(t), DUR, READY, RIGQA.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makeLine, PAPER, INK, GRAPH, FAINT, ACC, ACC_GL, SANS, MONO } from './engine/line.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, mulberry } from './shared/lib/util.js';

window.DUR = DUR;
const Q = new URLSearchParams(location.search);
const PX = 1920, PY = 1080, TAU = Math.PI * 2, D2R = Math.PI / 180;
const bg = document.getElementById('bg').getContext('2d'), ov = document.getElementById('ov').getContext('2d');
await Promise.all([`600 21px "Plex Sans"`, `400 21px "Plex Sans"`, `400 15px "Plex Mono"`, `500 18px "Plex Mono"`].map(f => document.fonts.load(f, 'AB09')));
const LN = makeLine({ canvas: document.getElementById('gl'), ov, PX, PY, SS: +(Q.get('ss') || 1.5), JIT: +(Q.get('jit') || 8), FPS: 30 });
const { mat, renderView, tag, dimLine, wipeText, arcs, hatchFill, dot, textW, CTL } = LN;

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
// secondary motion (shared): the jacket's back hem and the three-link ponytail, pre-simulated at 240 Hz from the pelvis bounce
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

// ═════════ units: millimetres. x along the street (she runs +x), y up, z toward the camera (shopfronts at z = ZF)
const MM = 2.8, xw = rx => (rx - SPL.x) * MM, XH = t => xw(X(t));
const ZF = -2500, KERB = 1800, ZCUT = 900;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z), Y_UP = V3(0, 1, 0);
const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z);
const cyl = (r, h, x, y, z, s = 20) => new THREE.CylinderGeometry(r, r, h, s).translate(x, y + h / 2, z);
function bone(a, b, r0, r1, open = true, s = 18) {
  const v = new THREE.Vector3().subVectors(b, a), L = Math.max(1e-3, v.length());
  const g = new THREE.CylinderGeometry(r1, r0, L, s, 1, open);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y_UP, v.normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); return g;
}
const ball = (p, r, s = 18) => new THREE.SphereGeometry(r, s, Math.round(s * .67)).translate(p.x, p.y, p.z);
function slab(shape, depth, y0 = 0, seg_ = 18) { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: seg_ }); g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); return g; }
function ring(r0, r1, h, x, y, z, n = 64) { const s = new THREE.Shape(); s.absarc(0, 0, r1, 0, TAU); const p = new THREE.Path(); p.absarc(0, 0, r0, 0, TAU, true); s.holes.push(p); return slab(s, h, y, n).translate(x, 0, z); }
function clean(g) { g = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'aS', 'aR'].includes(k)) g.deleteAttribute(k); if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); return g; }
function merge(group, geos, m) {
  if (!geos.length) return null;
  const gs = geos.map(clean);
  for (const k of ['aS', 'aR']) {
    if (gs.some(g => g.attributes[k])) gs.forEach(g => { if (!g.attributes[k]) g.setAttribute(k, new THREE.BufferAttribute(new Float32Array(g.attributes.position.count), 1)); });
    else gs.forEach(g => g.deleteAttribute(k));
  }
  const g = mergeGeometries(gs); gs.forEach(x => x.dispose()); const mesh = new THREE.Mesh(g, m); group.add(mesh); return mesh;
}
function setS(g, fn) { const p = g.attributes.position, a = new Float32Array(p.count); for (let i = 0; i < p.count; i++) a[i] = fn(p.getX(i), p.getY(i), p.getZ(i)); g.setAttribute('aS', new THREE.BufferAttribute(a, 1)); return g; }

// ═════════ materials: light greys for surfaces, dark grey only where the part is dense; one accent (the route + its end, the clock)
const MT = {
  pave: mat(0xededea), bed: mat(0xdcdcd8, 4), sub: mat(0xc8c8c4), water: mat(0xf4f4f1, 6), kerb: mat(0xdcdcd8), road: mat(0xe2e2de),
  wall: mat(0xf2f2ef), trim: mat(0xdcdcd8), glass: mat(0xf6f6f3, 1), frame: mat(0xc8c8c4), dark: mat(0x555553), white: mat(0xfbfbf9),
  metal: mat(0xededea), metal2: mat(0xdcdcd8), mid: mat(0x9a9a97),
  route: mat(ACC_GL, 3, null, 0xdcdcd8), face: mat(ACC_GL, 3, null, 0xfbfbf9),
  jacket: mat(0xbcbcb8), trousers: mat(0xa4a4a0), shoe: mat(0x555553), skin: mat(0xf9f8f4), hair: mat(0x4a4a49), band: mat(0x555553),
  handT: mat(0xf9f8f4, 5), cuffT: mat(0xe4e4e0, 5),
};
const WATER = MT.water;

// ═════════ the street (one model, seen four ways)
const street = new THREE.Scene();
const STATIC = new THREE.Group(); street.add(STATIC);
const X0 = -12000, X1 = 92000;
{ // pavement: 900 × 600 slabs with 8 mm joints on 30 mm bedding and a 150 mm sub-base; kerb; road
  const P = [], Bd = [], Sb = [], K = [], R = [], Mk = [];
  for (let x = X0; x < X1; x += 900) for (let z = ZF; z < KERB; z += 600) { const d = Math.min(600, KERB - z); P.push(box(892, 60, d - 8, x + 450, -60, z + d / 2)); }
  Bd.push(box(X1 - X0, 30, KERB - ZF, (X0 + X1) / 2, -90, (ZF + KERB) / 2));
  Sb.push(box(X1 - X0, 150, KERB - ZF + 300, (X0 + X1) / 2, -240, (ZF + KERB + 300) / 2));
  for (let x = X0; x < X1; x += 1000) K.push(box(994, 270, 150, x + 500, -150, KERB + 75));
  R.push(box(X1 - X0, 120, 9000, (X0 + X1) / 2, -270, KERB + 150 + 4500));
  for (let x = X0; x < X1; x += 6000) Mk.push(box(3000, 4, 120, x + 1500, -150, KERB + 3400));
  merge(STATIC, P, MT.pave); merge(STATIC, Bd, MT.bed); merge(STATIC, Sb, MT.sub); merge(STATIC, K, MT.kerb); merge(STATIC, R, MT.road); merge(STATIC, Mk, MT.white);
}
// the puddle: an organic sheet of water 14 mm deep in a shallow dip, centred on the splash, cut by the S1 section plane
const PUD = { x: 0, z: 300, rx: 680, rz: 720 };
{
  const s = new THREE.Shape();
  for (let i = 0; i <= 64; i++) { const a = i / 64 * TAU, r = 1 + .09 * Math.sin(a * 3 + 1.2) + .06 * Math.sin(a * 5 + .4) + .04 * Math.cos(a * 7);
    const x = PUD.x + Math.cos(a) * PUD.rx * r, y = -(PUD.z + Math.sin(a) * PUD.rz * r); i ? s.lineTo(x, y) : s.moveTo(x, y); }
  merge(STATIC, [slab(s, 16, -12, 64)], WATER);
}
// the route: a raised strip on the pavement from off-screen left to the station door; aS runs 0 → .78 along it
const ROUTE = { x0: -9000, x1: 63500, z: 650, w: 200 };
const routeS = x => .78 * clamp((x - ROUTE.x0) / (ROUTE.x1 - ROUTE.x0));
{
  const gs = []; for (let x = ROUTE.x0; x < ROUTE.x1; x += 1000) gs.push(box(Math.min(1000, ROUTE.x1 - x), 10, ROUTE.w, x + Math.min(1000, ROUTE.x1 - x) / 2, 0, ROUTE.z));
  const m = merge(STATIC, gs, MT.route); setS(m.geometry, (x) => routeS(x));
}
// shopfronts: pilasters, fascia with its name, stall riser, window with mullions, recessed door, cornice, upper storey with two windows
const SHOPS = [['BAR', 4200], ['BOOKS', 5400], ['24H', 4200], ['PHARMACY', 5600], ['NOODLES', 4800], ['CAFE', 4600], ['LAUNDRY', 5000], ['RECORDS', 5200], ['HOTEL', 6400], ['FLOWERS', 4600], ['BAKERY', 4800], ['TAILOR', 4400], ['BAR', 4000]];
function signTex(name, w, h) {
  const c = document.createElement('canvas'); c.width = 2048; c.height = Math.round(2048 * h / w); const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, c.width, c.height);
  const fs = Math.min(c.height * .62, 2048 / Math.max(4, name.length) * 1.1);
  g.font = `600 ${fs}px "Plex Sans"`; g.letterSpacing = `${fs * .12}px`; g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name, c.width / 2 + fs * .06, c.height / 2 + fs * .04);
  const tx = new THREE.CanvasTexture(c); tx.anisotropy = 4; return tx;
}
const SHOPX = [];
{
  const T = [], W_ = [], G = [], F = [], D = [], H = [];
  let x = -9200;
  SHOPS.forEach(([name, w], i) => {
    const a = x + 320, b = x + w, hh = 7400 + (i % 3) * 1100 + (i % 2) * 500;
    SHOPX.push([x, w, name]);
    T.push(box(320, 3600, 320, x + 160, 0, ZF + 160));                                   // pilaster
    T.push(box(400, 200, 380, x + 160, 3600, ZF + 190));                                 // pilaster cap
    W_.push(box(w, hh, 9000, x + w / 2, 0, ZF - 4600));                                  // the building behind
    W_.push(box(w, 260, 300, x + w / 2, hh - 260, ZF + 10));                              // parapet
    T.push(box(w - 320, 640, 170, (a + b) / 2, 2930, ZF + 85));                           // fascia
    const pw = w - 320 - 260, sm = new THREE.Mesh(new THREE.PlaneGeometry(pw, 400), mat(0xfbfbf9, 0, signTex(name, pw, 400))); sm.position.set((a + b) / 2, 3250, ZF + 172); STATIC.add(sm);
    T.push(box(w + 40, 150, 330, x + w / 2, 3570, ZF + 165));                              // cornice
    const dw = 1100, db = b - 160 - dw, ww = db - 160 - a, wc = a + 80 + ww / 2;          // door bay at the right, window at the left
    F.push(box(ww, 100, 230, wc, 520, ZF + 40)); F.push(box(ww, 130, 170, wc, 2780, ZF + 10)); // sill, transom
    F.push(box(90, 2160, 170, a + 125, 620, ZF + 10)); F.push(box(90, 2160, 170, db - 125, 620, ZF + 10));
    G.push(box(ww - 120, 2160, 14, wc, 620, ZF - 110));                                    // the glass, recessed
    const nm = Math.max(1, Math.round(ww / 1500)); for (let k = 1; k < nm; k++) F.push(box(70, 2160, 110, a + 80 + ww * k / nm, 620, ZF - 40));
    T.push(box(ww, 520, 150, wc, 0, ZF + 50)); T.push(box(ww - 260, 290, 24, wc, 115, ZF + 136));   // stall riser + its panel
    F.push(box(100, 2780, 220, db + 50, 0, ZF + 20)); F.push(box(100, 2780, 220, db + dw + 50, 0, ZF + 20)); F.push(box(dw + 200, 120, 220, db + dw / 2 + 100, 2660, ZF + 20));
    D.push(box(dw - 120, 2300, 60, db + dw / 2 + 100, 0, ZF - 380));                        // door leaf, recessed 0.4 m
    G.push(box(dw - 520, 1250, 12, db + dw / 2 + 100, 820, ZF - 345));
    H.push(box(36, 420, 44, db + dw - 140, 900, ZF - 320));
    for (const u of [.27, .73]) {                                                          // upper windows
      const cx = x + w * u; W_.push(box(1260, 1760, 60, cx, 4560, ZF + 30)); G.push(box(1020, 1520, 12, cx, 4680, ZF + 66));
      F.push(box(56, 1520, 30, cx, 4680, ZF + 80)); F.push(box(1380, 90, 180, cx, 4470, ZF + 90));
      if (hh > 8600) { W_.push(box(1260, 1500, 60, cx, 6800, ZF + 30)); G.push(box(1020, 1260, 12, cx, 6920, ZF + 66)); F.push(box(1380, 90, 180, cx, 6710, ZF + 90)); }
    }
    if (i % 3 === 1) {                                                                     // an awning
      const g = new THREE.BoxGeometry(ww - 100, 36, 1300); g.translate(0, 0, 650); g.rotateX(.32); g.translate(wc, 2860, ZF + 170); F.push(g);
      F.push(box(ww - 100, 230, 30, wc, 2860 - 1300 * Math.sin(.32) - 230, ZF + 170 + 1300 * Math.cos(.32)));
    }
    x += w;
  });
  T.push(box(320, 3600, 320, x + 160, 0, ZF + 160));
  merge(STATIC, T, MT.trim); merge(STATIC, W_, MT.wall); merge(STATIC, G, MT.glass); merge(STATIC, F, MT.frame); merge(STATIC, D, MT.white); merge(STATIC, H, MT.dark);
}
// lamp posts along the kerb
{
  const P = [], Lg = [];
  for (let x = -6000; x < 60000; x += 9000) {
    P.push(cyl(150, 420, x, 0, 1450, 16), cyl(62, 4300, x, 420, 1450, 14), box(60, 60, 900, x, 4620, 1050));
    Lg.push(box(300, 420, 300, x, 4220, 650), new THREE.ConeGeometry(260, 200, 4).rotateY(Math.PI / 4).translate(x, 4740, 650));
  }
  merge(STATIC, P, MT.mid); merge(STATIC, Lg, MT.white);
}
// the station: a long hall with tall windows and a canopy over the door, and the clock tower at its corner
const TW = { x0: 54000, x1: 60000, h: 30000 }, CLK = { x: 57000, y: 24200, z: ZF + 60, r: 1200 };
const STN = { x0: 60000, x1: 92000, h: 11000, door: 63500 };
{
  const W_ = [], T = [], G = [], F = [];
  W_.push(box(STN.x1 - STN.x0, STN.h, 18000, (STN.x0 + STN.x1) / 2, 0, ZF - 9000));
  T.push(box(STN.x1 - STN.x0 + 200, 400, 500, (STN.x0 + STN.x1) / 2, STN.h - 400, ZF + 200));
  for (let x = STN.x0 + 2200; x < STN.x1 - 1500; x += 3200) { G.push(box(1900, 5600, 14, x, 3200, ZF + 20)); F.push(box(2200, 200, 260, x, 3000, ZF + 100), box(2200, 260, 200, x, 8800, ZF + 80), box(80, 5600, 120, x, 3200, ZF + 40)); }
  F.push(box(5200, 3400, 80, STN.door, 0, ZF + 10)); G.push(box(4400, 2900, 14, STN.door, 0, ZF + 60));
  T.push(box(8400, 300, 3000, STN.door, 3800, ZF + 1500)); T.push(box(140, 3800, 140, STN.door - 4000, 0, ZF + 2900), box(140, 3800, 140, STN.door + 4000, 0, ZF + 2900));
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(5600, 600), mat(0xfbfbf9, 0, signTex('STATION', 5600, 600))); sm.position.set(STN.door, 4400 + 300, ZF + 3001); sm.rotation.x = 0; STATIC.add(sm);
  T.push(box(6400, 700, 300, STN.door, 4400, ZF + 2900));
  // tower
  const cx = (TW.x0 + TW.x1) / 2, cz = ZF - 3000, w = TW.x1 - TW.x0;
  W_.push(box(w + 600, 1400, w + 600, cx, 0, cz)); W_.push(box(w, TW.h, w, cx, 0, cz));
  for (const y of [7000, 14000, 21000]) T.push(box(w + 300, 300, w + 300, cx, y, cz));
  T.push(box(w + 500, 500, w + 500, cx, TW.h - 500, cz));
  for (const u of [-1, 1]) { F.push(box(1100, 3200, 60, cx + u * 1500, 26800 - 0, ZF + 30)); G.push(box(800, 2900, 14, cx + u * 1500, 26950, ZF + 62)); }
  for (const y of [3000, 10000, 17000]) { F.push(box(1300, 2600, 60, cx, y, ZF + 30)); G.push(box(1000, 2300, 14, cx, y + 150, ZF + 62)); }
  T.push(new THREE.ConeGeometry(w * .78, 6500, 4).rotateY(Math.PI / 4).translate(cx, TW.h + 3250, cz), cyl(90, 2600, cx, TW.h + 6400, cz, 10));
  merge(STATIC, W_, MT.wall); merge(STATIC, T, MT.trim); merge(STATIC, G, MT.glass); merge(STATIC, F, MT.frame);
  // clock: face (accent end part, aS .78 → 1 by radius from the centre), bezel, indices, hands
  const face = new THREE.CylinderGeometry(CLK.r, CLK.r, 120, 72).rotateX(Math.PI / 2).translate(CLK.x, CLK.y, CLK.z);
  setS(face, (x, y) => .78 + .22 * clamp(Math.hypot(x - CLK.x, y - CLK.y) / CLK.r));
  const fm = merge(STATIC, [face], MT.face);
  const bz = new THREE.TorusGeometry(CLK.r + 50, 70, 10, 72).translate(CLK.x, CLK.y, CLK.z + 60), ix = [];
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, L = k % 3 ? 180 : 300; ix.push(new THREE.BoxGeometry(k % 3 ? 50 : 90, L, 30).translate(0, CLK.r - 80 - L / 2, 0).rotateZ(-a).translate(CLK.x, CLK.y, CLK.z + 75)); }
  merge(STATIC, [bz, ...ix], MT.dark);
}
const clockHands = (() => {
  const mk = (L, w, tail) => { const g = new THREE.BoxGeometry(w, L + tail, 30).translate(0, (L - tail) / 2, 0); const m = new THREE.Mesh(clean(g), MT.dark); m.position.set(CLK.x, CLK.y, CLK.z + 100); STATIC.add(m); return m; };
  return { h: mk(650, 90, 120), m: mk(980, 60, 160) };
})();

// ═════════ AKI: built each frame from the shared rig (profile points become the street's vertical plane; near side toward us)
const akiG = new THREE.Group(); street.add(akiG);
const P3 = (p, z) => V3(xw(p[0]), -p[1] * MM, z);
function lathe(pts, base, dir, sx = .62, sway = 0) {
  const g = new THREE.LatheGeometry(pts.map(([r, s]) => new THREE.Vector2(r, s)), 28);
  g.scale(sx, 1, 1);
  if (sway) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = Math.pow(clamp(1 - y / 300), 2); p.setX(i, p.getX(i) + sway * k * (p.getX(i) < 0 ? 1.35 : .7)); } g.computeVertexNormals(); } g.rotateZ(Math.atan2(-dir.x, dir.y)); g.translate(base.x, base.y, base.z); return g;
}
function buildAki(t) {
  for (const m of akiG.children) m.geometry.dispose(); akiG.clear();
  const J = solveProfile(poseAt(t)), B = { jacket: [], trousers: [], shoe: [], skin: [], hair: [], band: [], metal: [] };
  for (const k of ['f', 'n']) {                                                        // legs and shoes
    const l = J.leg[k], z = k === 'n' ? 86 : -86, hip = P3(l.hip, z), knee = P3(l.knee, z), ank = P3(l.ankle, z);
    B.trousers.push(bone(hip, knee, 76, 56), ball(knee, 56), bone(knee, ank, 56, 40), ball(ank, 40));
    const c = Math.cos(l.pitch), s = Math.sin(l.pitch), pc = P3([l.ankle[0] + 22 * c - 3 * s, l.ankle[1] + 22 * s + 3 * c], z);
    B.shoe.push(new RoundedBoxGeometry(100 * MM, 26 * MM, 104, 2, 20).rotateZ(-l.pitch).translate(pc.x, pc.y, pc.z));
  }
  const dirL = V3(J.uL[0], -J.uL[1], 0).normalize(), dirU = V3(J.uU[0], -J.uU[1], 0).normalize();
  const hem = P3([J.pelvis[0] - J.uL[0] * 96, J.pelvis[1] - J.uL[1] * 96], 0), waist = P3(J.waist, 0);
  B.jacket.push(lathe([[0, -2], [176, 0], [168, 40], [158, 120], [150, 269], [140, 380], [134, hem.distanceTo(waist)]], hem, dirL, .62, -(SIM.flap(t) - .3) * 260));   // the hem sways back with the bounce (secondary motion)
  B.jacket.push(lathe([[134, 0], [146, 90], [158, 190], [160, 240], [150, 282], [112, 302], [55, 318], [0, 322]], waist, dirU));
  for (const k of ['f', 'n']) {                                                        // arms, hands, the watch on the near wrist
    const a = J.arm[k], z = k === 'n' ? 196 : -196, sh = P3(a.sh, z * .92), el = P3(a.el, z), wr = P3(a.wr, z);
    B.jacket.push(ball(sh, 50), bone(sh, el, 50, 41), ball(el, 41), bone(el, wr, 41, 35));
    const hd = new THREE.Vector3().subVectors(wr, el).normalize(), he = wr.clone().addScaledVector(hd, 92);
    B.skin.push(bone(wr, he, 31, 27), ball(he, 27));
    if (k === 'n') { const wp = el.clone().lerp(wr, .84); B.band.push(new THREE.TorusGeometry(36, 5, 8, 24).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), hd)).translate(wp.x, wp.y, wp.z));
      B.metal.push(new THREE.CylinderGeometry(19, 19, 10, 28).rotateX(Math.PI / 2).translate(wp.x, wp.y, wp.z + 40)); }
  }
  B.skin.push(bone(P3(J.neckBase, 0), P3(J.neckTop, 0), 46, 42));
  const hc = P3(J.headC, 0), ha_ = -J.headA, R = new THREE.Matrix4().makeRotationZ(ha_);
  const head = new THREE.SphereGeometry(100, 28, 20).scale(1, 1.1, .9); head.applyMatrix4(R); head.translate(hc.x, hc.y, hc.z); B.skin.push(head);
  const nose = new THREE.ConeGeometry(12, 30, 10).rotateZ(-Math.PI / 2 - .25).translate(102, -14, 0); nose.applyMatrix4(R); nose.translate(hc.x, hc.y, hc.z); B.skin.push(nose);
  const ear = new THREE.SphereGeometry(20, 12, 8).scale(.7, 1, .5).translate(-14, -6, 88); ear.applyMatrix4(R); ear.translate(hc.x, hc.y, hc.z); B.skin.push(ear);
  const cap = new THREE.SphereGeometry(106, 28, 16, -Math.PI * .7, Math.PI * 1.4, 0, Math.PI * .6).scale(1, 1.1, .92).translate(-6, 8, 0); cap.applyMatrix4(R); cap.translate(hc.x, hc.y, hc.z); B.hair.push(cap);
  const top = new THREE.SphereGeometry(106, 28, 10, 0, TAU, 0, Math.PI * .3).scale(1, 1.1, .92).translate(-6, 8, 0); top.applyMatrix4(R); top.translate(hc.x, hc.y, hc.z); B.hair.push(top);
  { // ponytail: three tapered links from the back of the head (rig angles, as every style)
    const ta = SIM.tail(t); let ang = Math.PI - .25 + ta[0] + J.headA, p = [J.headC[0] - Math.cos(J.headA) * 50, J.headC[1] - Math.sin(J.headA) * 50 - 10];
    B.hair.push(ball(P3(p, 0), 16 * MM * .9));
    for (let i = 0; i < 3; i++) { const Lk = [46, 42, 36][i], q = [p[0] + Math.cos(ang) * Lk, p[1] + Math.sin(ang) * Lk]; B.hair.push(bone(P3(p, 0), P3(q, 0), [14, 11, 8][i] * MM * .9, [11, 8, 3][i] * MM * .9), ball(P3(q, 0), [11, 8, 3][i] * MM * .9)); p = q; ang += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
  }
  for (const [k, gs] of Object.entries(B)) merge(akiG, gs, MT[k]);
  return J;
}

// ═════════ the splash: traced beads in flight, a crown, rings on the water (all from the contact at 0.9375 s)
const splG = new THREE.Group(); street.add(splG);
const SPX = { x: xw(SPL.x) + 80, z: -86 };
const DROPS = (() => { const r = mulberry(61), o = []; for (let i = 0; i < 26; i++) { const az = r() * TAU, el = lerp(38, 74, r()) * D2R, v = lerp(1100, 2400, r()); o.push({ v: [Math.cos(az) * Math.cos(el) * v * 1.15, Math.sin(el) * v, Math.sin(az) * Math.cos(el) * v * .8], r: lerp(5, 12, r()), d: r() * .03 }); } return o; })();
const RAINRINGS = (() => { const r = mulberry(612), o = []; for (let i = 0; i < 14; i++) { const a = r() * TAU, u = Math.sqrt(r()) * .8; o.push({ x: PUD.x + Math.cos(a) * PUD.rx * u, z: PUD.z + Math.sin(a) * PUD.rz * u, t0: r() * 2.6 - .2 }); } return o; })();
function buildSplash(t) {
  for (const m of splG.children) m.geometry.dispose(); splG.clear();
  const gs = [], rg = [], a = t - EV.splash;
  if (a > 0 && a < 1.2) for (const d of DROPS) { const u = a - d.d; if (u <= 0) continue; const y = 20 + d.v[1] * u - 4905 * u * u; if (y < 0) continue; gs.push(ball(V3(SPX.x + d.v[0] * u, y, SPX.z + d.v[2] * u), d.r, 10)); }
  if (a > 0 && a < .3) { const u = a / .3, rb = 50 + 190 * eo(u), h = 70 * Math.sin(Math.PI * u);           // the crown: a ring of beads that rises and falls
    for (let k = 0; k < 22; k++) { const an = k / 22 * TAU + .3, j = .75 + .5 * ((k * 7) % 5) / 4; gs.push(new THREE.SphereGeometry(7 * j, 10, 7).scale(1, 1.9, 1).translate(SPX.x + Math.cos(an) * rb, 6 + h * j, SPX.z + Math.sin(an) * rb * .9)); } }
  const ringAt = (x, z, age, R0, R1, tube, life) => { if (age <= 0 || age > life) return; const r = R0 + R1 * Math.pow(age / life, .6), tb = tube * (1 - age / life); if (tb < .6) return;
    rg.push(new THREE.TorusGeometry(r, tb, 5, 64).rotateX(Math.PI / 2).scale(1, .35, 1).translate(x, 4.5, z)); };
  for (let j = 0; j < 3; j++) ringAt(SPX.x, SPX.z, a - j * .13, 60, 620, 5, 1.6);
  for (const d of RAINRINGS) for (let k = 0; k < 3; k++) ringAt(d.x, d.z, t - d.t0 - k * .9, 6, 120, 2.4, .7);
  merge(splG, gs, WATER); merge(splG, rg, WATER);
}

// ═════════ the watch (S3): a 36 mm case on her wrist, built to size; dial up (+y), 12 o'clock toward −z, crown toward the hand (+x)
const watchS = new THREE.Scene();
const WG = { case: 18, lugZ: 21 };
{
  const M_ = [], M2 = [], Dk = [], Wh = [], Hn = [], Cu = [];
  M2.push(new THREE.CylinderGeometry(15.5, 15.5, 1.6, 64).translate(0, .8, 0));                       // caseback
  M_.push(ring(15, 18, 7.4, 0, 1.4, 0));                                                              // case middle
  M_.push(ring(14.9, 17.6, 1.4, 0, 8.6, 0));                                                          // bezel
  Dk.push(new THREE.CylinderGeometry(13, 13, 4.2, 48).translate(0, 3.7, 0));                          // movement (dense)
  Wh.push(new THREE.CylinderGeometry(15.2, 15.2, .4, 64).translate(0, 6.1, 0));                       // dial
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, big = k % 3 === 0; Dk.push(new THREE.BoxGeometry(big ? 1.5 : .8, .3, big ? 3.6 : 2.6).translate(0, 6.45, -(11.6 - (big ? 0 : .5))).rotateY(-a)); }
  for (let k = 0; k < 60; k++) if (k % 5) Dk.push(new THREE.BoxGeometry(.25, .15, .9).translate(0, 6.38, -14.1).rotateY(-k / 60 * TAU));
  M_.push(new THREE.CylinderGeometry(2.3, 2.3, 3.2, 18).rotateZ(Math.PI / 2).translate(19.4, 5.2, 0), new THREE.CylinderGeometry(1.5, 1.5, 1.6, 12).rotateZ(Math.PI / 2).translate(17.6, 5.2, 0));   // crown + stem tube
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) M_.push(new RoundedBoxGeometry(3, 4.4, 8, 2, .9).translate(sx * 9.3, 4.6, sz * (WG.lugZ - 2.2)));          // lugs
  // strap: two leather bands from the lugs round the wrist (a cylinder of r 30 centred 27 mm below the case)
  const band = (a0, a1) => { const s = new THREE.Shape(); s.absarc(0, 0, 32.4, a0, a1, false); s.absarc(0, 0, 30, a1, a0, true); const g = new THREE.ExtrudeGeometry(s, { depth: 18, bevelEnabled: false, curveSegments: 40 }); g.rotateY(-Math.PI / 2); g.translate(9, -27, 0); return g; };
  Cu.push(band(.97, 2.1), band(-1.75, .55));
  Cu.push(new RoundedBoxGeometry(20.5, 7, 2.4, 2, .8).translate(0, 0, 0).rotateX(.45).translate(0, -27 + 31.2 * Math.sin(.15), 31.2 * Math.cos(.15)));   // keeper
  merge(watchS, M_, MT.metal); merge(watchS, M2, MT.metal2); merge(watchS, Dk, MT.dark); merge(watchS, Wh, MT.white); merge(watchS, Cu, MT.band);
  const cr = merge(watchS, [new THREE.CylinderGeometry(15, 15, 1.1, 64).translate(0, 8.8, 0)], MT.glass); cr.layers.set(1);   // crystal: drawn only in the section view
  // her wrist, cuff and hand: the diagrammatic tier (thin light lines, fades out at the elbow side)
  const T_ = [bone(V3(-260, -27, 0), V3(38, -27, 0), 29.5, 27.5, false, 32).scale(1, 1, .86), bone(V3(38, -27, 0), V3(118, -30, -4), 27.5, 30, false, 28).scale(1, 1, .62), ball(V3(120, -30, -4), 30).scale(1, .8, .62)];
  T_.push(bone(V3(96, -12, 18), V3(132, -6, 30), 10, 9), ball(V3(132, -6, 30), 9));
  merge(watchS, T_, MT.handT);
  merge(watchS, [bone(V3(-300, -27, 0), V3(-96, -27, 0), 41, 39.5, false, 36).scale(1, 1, .9), new THREE.TorusGeometry(39.6, 1.6, 6, 40).rotateY(Math.PI / 2).scale(1, 1, .9).translate(-96, -27, 0)], MT.cuffT);
}
const WH = (() => {
  const shape = (L, w0, w1, tail) => { const s = new THREE.Shape(); s.moveTo(-w0 / 2, -tail); s.lineTo(w0 / 2, -tail); s.lineTo(w1 / 2, L); s.lineTo(0, L + w1); s.lineTo(-w1 / 2, L); s.closePath(); return s; };
  const mk = (L, w0, w1, tail, y, m) => { const g = clean(slab(shape(L, w0, w1, tail), .25, y, 4)); const ms = new THREE.Mesh(g, m); watchS.add(ms); return ms; };
  const h = mk(8.6, 1.9, 1.3, 1.6, 6.6, MT.dark), mn = mk(12.6, 1.4, .9, 2, 6.95, MT.dark), sc = mk(13.4, .5, .34, 4.2, 7.3, MT.dark);
  merge(watchS, [new THREE.CylinderGeometry(1.1, 1.1, .7, 20).translate(0, 7.2, 0), new THREE.CylinderGeometry(.6, .6, .5, 16).translate(0, 7.62, 0)], MT.dark);
  return { h, m: mn, s: sc };
})();
const secAt = t => 47 + (t >= 8.4 ? 1 : 0) + (t >= 9.4 ? 1 : 0);
function secAngle(t) { const s = secAt(t), tk = s === 47 ? -1 : (s === 48 ? 8.4 : 9.4); const u = tk < 0 ? 1 : back(seg(t, tk, tk + .1), 3.2); return (s - 1 + u) / 60 * TAU; }
function setHands(t) {
  const s = secAt(t) + 0, aH = (11 + 58 / 60 + s / 3600) / 12 * TAU, aM = (58 + s / 60) / 60 * TAU;
  WH.h.rotation.y = -aH; WH.m.rotation.y = -aM; WH.s.rotation.y = -secAngle(t);
  clockHands.h.rotation.z = -aH; clockHands.m.rotation.z = -aM;
}

// ═════════ cameras
const camA = new THREE.PerspectiveCamera(18, PX / PY, 10, 1e6), camW = new THREE.PerspectiveCamera(20, PX / PY, .5, 5000), magCam = new THREE.PerspectiveCamera(26, 1, .5, 2000);
function aim(cam, T, az, el, dist, fov, ox = 0, oy = 0, jit = [0, 0], W = PX, H = PY) {
  const a = az * D2R, e = el * D2R;
  cam.fov = fov; cam.position.set(T.x + Math.sin(a) * Math.cos(e) * dist, T.y + Math.sin(e) * dist, T.z + Math.cos(a) * Math.cos(e) * dist);
  cam.up.set(0, 1, 0); cam.lookAt(T); cam.near = clamp(dist * .02, .5, 2500); cam.far = dist * 10 + 30000;
  cam.updateMatrixWorld(); cam.setViewOffset(W, H, ox + jit[0], oy + jit[1], W, H); cam.updateProjectionMatrix(); return cam;
}
function proj(v, cam) { const p = v.clone().project(cam); return [(p.x + 1) / 2 * PX, (1 - p.y) / 2 * PY, p.z]; }
// shot cameras (t is film time)
const camS1 = (t, j) => aim(camA, V3(-140, 430 - 300 * ei(seg(t, 2.1, 2.5)), 420), lerp(15, 11, ss(seg(t, 0, 2.5))), lerp(7, 2, ei(seg(t, 2.1, 2.5))), lerp(4300, 3900, ss(seg(t, 0, 2.2))) - 2200 * ei(seg(t, 2.15, 2.5)), 18, 0, 0, j);
function camS2(t, j) {
  const pu = ss(seg(t, EV.watchUp - .1, EV.watchUp + .9)), xh = XH(Math.min(t, 7.5));
  return aim(camA, V3(xh + 380, lerp(1450, 1200, pu), 0), lerp(9, 7, pu), 6, lerp(8600, 6600, pu), lerp(25, 22, pu), 0, 0, j);
}
const DIAL_SCR = [1230, 520];
let s3off = [0, 0];
function camS3(t, j) {
  const u = seg(t, 7.5, 9.375);
  const c = aim(camW, V3(1.5, 6, 1.5), lerp(20, 13, ss(u)), lerp(60, 66, ss(u)), lerp(176, 158, ss(u)), 20, 0, 0, [0, 0]);
  const p = proj(V3(0, 6.3, 0), c), tgt = t < 7.85 ? lerpP(irisFrom(), DIAL_SCR, ss(seg(t, 7.5, 7.85))) : DIAL_SCR;
  s3off = [p[0] - tgt[0], p[1] - tgt[1]];
  return aim(camW, V3(1.5, 6, 1.5), lerp(20, 13, ss(u)), lerp(60, 66, ss(u)), lerp(176, 158, ss(u)), 20, s3off[0], s3off[1], j);
}
const lerpP = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
const S4_TGT = V3(50500, 15500, -2500);
function camS4(t, j) {
  const u = seg(t, 9.375, 10), az = lerp(-31, -37, ss(u)), el = lerp(7, 9.5, ss(u)), d = lerp(126000, 142000, eo(u));
  const c = aim(camA, S4_TGT, az, el, d, 18, 0, 0, [0, 0]);
  const p = proj(V3(CLK.x, CLK.y, CLK.z), c), want = lerpP(DIAL_SCR, [1290, 250], eio(seg(t, 9.375, 9.75)));
  return aim(camA, S4_TGT, az, el, d, 18, p[0] - want[0], p[1] - want[1], j);
}
// the S2 → S3 circle closes on the watch: its screen position at 7.5 in the S2 view
let IRIS0 = null;
function irisFrom() { if (!IRIS0) { const J = solveProfile(poseAt(7.5)), a = J.arm.n, wp = P3(a.el, 196).lerp(P3(a.wr, 196), .84); camS2(7.5, [0, 0]); IRIS0 = proj(wp.setZ(236), camA); } return IRIS0; }

// ═════════ scene state per frame
let LASTT = -1, LASTJ = null;
function setStreet(t) {
  if (t !== LASTT) { LASTJ = buildAki(t); buildSplash(t); setHands(t); LASTT = t; }
  CTL.uPath.value = routeS(XH(t));
  CTL.uUmax.value = lerp(.78, 1.001, eo(seg(t, EV.chime, EV.chime + .32)));
  return LASTJ;
}
const cutZ = new THREE.Plane(V3(0, 0, -1), ZCUT), sweep = new THREE.Plane(V3(-1, 0, 0), 0);
function s1Clip(t) { sweep.constant = lerp(-1500, 1500, eio(seg(t, 0, .55))) + (t > .56 ? 1e7 : 0); return [cutZ, sweep]; }

// ═════════ rain: world-anchored graphite streaks (drawn in 2D from 3D points), deterministic per drop
const RAIN = (() => { const r = mulberry(6101), o = []; for (let i = 0; i < 900; i++) o.push([r(), r(), r(), r()]); return o; })();
function rain(cam, t, c0, sz, n, len, alpha = .3) {
  ov.save(); ov.strokeStyle = GRAPH; ov.lineWidth = 1; ov.globalAlpha = alpha; ov.beginPath();
  for (let i = 0; i < n; i++) {
    const [a, b, cc, d] = RAIN[i], H = sz[1], y = c0.y - H / 2 + ((b * H - t * 7200 - d * H) % H + H) % H;
    const p0 = V3(c0.x + (a - .5) * sz[0], y, c0.z + (cc - .5) * sz[2]), p1 = p0.clone().add(V3(-len * .12, len, 0));
    const A = proj(p0, cam), B = proj(p1, cam); if (A[2] > 1 || B[2] > 1 || A[2] < -1) continue;
    ov.moveTo(A[0], A[1]); ov.lineTo(B[0], B[1]);
  }
  ov.stroke(); ov.restore();
}
function circle(cx, cy, r, w = 2) { ov.save(); ov.strokeStyle = INK; ov.lineWidth = w; ov.beginPath(); ov.arc(cx, cy, r, 0, TAU); ov.stroke(); ov.restore(); }
const FULL = { x: 0, y: 0, w: PX, h: PY };

// ═════════ S1 · 0–2.5: the section through the puddle
function S1(t) {
  setStreet(t);
  renderView('main', FULL, (dt, j) => ({ scene: street, cam: camS1(t, j), clip: s1Clip(t) }));
  camS1(t, [0, 0]);
  rain(camA, t, V3(-100, 900, 400), [3600, 1800, 1400], 260, 130, .26);
  const L = (x, y, z) => proj(V3(x, y, z), camA);
  dimLine(ov, L(PUD.x - 640, 4, ZCUT), L(PUD.x + 655, 4, ZCUT), 46, '1 300 mm', seg(t, .15, .7), 1 - seg(t, .82, 1.0));
  tag(ov, t, [.3, .86], L(-330, -4, ZCUT), { dx: -170, dy: -150, name: 'WATER', spec: '16 mm over a 60 mm slab' });
  tag(ov, t, [1.02, 2.0], L(SPX.x + 160, 30, SPX.z + 140), { dx: 150, dy: -170, name: 'SPLASH', spec: 't 0.94 s · 4.06 m/s' });
  // the dive: the water section fills the frame
  if (t > 2.22) { ov.save(); ov.globalAlpha = ss(seg(t, 2.22, 2.5)); hatchFill(ov, c => c.rect(0, 0, PX, PY), true); ov.restore(); }
}
// ═════════ S2 · 2.5–7.5: tracking her along the shopfronts
function S2(t) {
  const J = setStreet(t);
  const close = seg(t, 7.24, 7.5), r = lerp(2300, 26, eio(close));
  renderView('main', FULL, (dt, j) => ({ scene: street, cam: camS2(t, j) }), close > 0 ? { circle: [...irisFrom(), r] } : {});
  camS2(t, [0, 0]);
  const L = (x, y, z) => proj(V3(x, y, z), camA), xh = XH(t);
  if (close <= 0) rain(camA, t, V3(xh + 300, 1700, 300), [9000, 3600, 5000], 520, 130, .24);
  // the step ruler: two consecutive footfalls measured on the pavement at model scale
  const c1 = RUN.contacts.find(c => c.t0 > 3.3), c2 = RUN.contacts[RUN.contacts.indexOf(c1) + 1];
  const zc = k => k.foot === 'n' ? 86 : -86;
  if (t > 3.7 && t < 5.4) {
    const a = L(xw(c1.x), 0, 420), b = L(xw(c2.x), 0, 420), p = seg(t, 3.78, 4.3), al = 1 - seg(t, 4.95, 5.3);
    ov.save(); ov.globalAlpha = al; ov.strokeStyle = INK; ov.lineWidth = 1; ov.setLineDash([4, 4]);
    for (const [k, q] of [[c1, a], [c2, b]]) { const f = L(xw(k.x), 0, zc(k)); ov.beginPath(); ov.moveTo(f[0], f[1]); ov.lineTo(q[0], q[1]); ov.stroke(); }
    ov.setLineDash([]); ov.restore();
    dimLine(ov, a, b, 30, `${Math.round((c2.x - c1.x) * MM).toLocaleString('en').replace(',', ' ')} mm`, p, al, 10);
  }
  tag(ov, t, [2.86, 4.0], L(xw(J.headC[0]) - 40, -J.headC[1] * MM + 96, 0), { dx: 120, dy: -78, name: 'AKI', spec: 'height 1 620 mm' });
  tag(ov, t, [5.0, 5.92], L(xh, -J.pelvis[1] * MM, 160), { dx: -170, dy: -150, name: 'PACE', spec: '4.06 m/s · 174 steps/min' });
  if (t > 6.1) { const a = J.arm.n, wp = P3(a.el, 196).lerp(P3(a.wr, 196), .84).setZ(236); tag(ov, t, [6.2, 7.0], L(wp.x, wp.y, wp.z), { dx: 140, dy: -120, name: 'WATCH', spec: 'case Ø 36 mm' }); }
  if (close > 0) circle(...irisFrom(), r);
  // the dive into the water opens as a circle on her at the start of S2
  if (t < 2.82) { const o = L(xh + 150, 700, 0), rr = 2300 * ei(seg(t, 2.5, 2.82)) + 2; hatchFill(ov, c => { c.rect(0, 0, PX, PY); c.moveTo(o[0] + rr, o[1]); c.arc(o[0], o[1], rr, 0, TAU); }, true); circle(o[0], o[1], rr); }
}
// ═════════ S3 · 7.5–9.375: the watch, locked top-down, with a magnifier cross-section of its case
const MAG = { cx: 370, cy: 700, r: 170 };
const magCut = new THREE.Plane(V3(0, 0, -1), 0);
function S3(t) {
  setHands(t);
  const open = seg(t, 7.5, 7.8), close = seg(t, 9.2, 9.375);
  const o = lerpP(irisFrom(), DIAL_SCR, ss(seg(t, 7.5, 7.85)));
  const r = open < 1 ? lerp(26, 2300, ei(open)) : lerp(2300, DIAL_R(), eio(close));
  const ci = (open < 1 || close > 0) ? [o[0], o[1], r] : null;
  renderView('main', FULL, (dt, j) => ({ scene: watchS, cam: camS3(t, j) }), { ...(ci ? { circle: ci } : {}), fade: fadeLine() });
  camS3(t, [0, 0]);
  const L = (x, y, z) => proj(V3(x, y, z), camW);
  // the statement column (left): the watch time, read from the model, and what it leaves
  const s = secAt(t), lp = seg(t, 7.78, 8.15), out = seg(t, 9.12, 9.32);
  wipeText(ov, `11:58:${s}`, 120, 300, lp, `500 64px ${MONO}`, INK, 1, out);
  wipeText(ov, `${120 - 47 - (s - 47)} S TO 12:00:00`, 122, 346, seg(t, 7.95, 8.3), `600 21px ${SANS}`, INK, 1.4, out);
  wipeText(ov, 'seconds hand · one step of 6° per second', 122, 372, seg(t, 8.05, 8.45), `400 15px ${MONO}`, GRAPH, 0, out);
  { const a = L(-18, 9.5, 0), b = L(18, 9.5, 0), c0 = L(0, 9.5, 0), e = L(0, 9.5, -18); dimLine(ov, a, b, -(Math.hypot(e[0] - c0[0], e[1] - c0[1]) + 70), 'Ø 36.0 mm', seg(t, 7.9, 8.5), 1 - seg(t, 9.0, 9.25), 0); }
  // magnifier: the same model, cut through its centre, seen from the crown side
  const mp = eo(seg(t, 8.0, 8.32)) * (1 - eio(seg(t, 9.0, 9.2)));
  if (mp > 0) {
    const rr = Math.max(10, Math.round(MAG.r * mp / 10) * 10);
    renderView('mag', { x: MAG.cx - rr, y: MAG.cy - rr, w: 2 * rr, h: 2 * rr }, (dt, j) => {
      const tg = V3(12, 4.8, 0), a = 7 * D2R, e = 7 * D2R, dist = 44;
      magCam.position.set(tg.x + Math.sin(a) * Math.cos(e) * dist, tg.y + Math.sin(e) * dist, tg.z + Math.cos(a) * Math.cos(e) * dist);
      magCam.up.set(0, 1, 0); magCam.lookAt(tg); magCam.near = .5; magCam.far = 600; magCam.fov = 24; magCam.aspect = 1; magCam.updateMatrixWorld();
      magCam.setViewOffset(2 * rr, 2 * rr, j[0], j[1], 2 * rr, 2 * rr); magCam.updateProjectionMatrix();
      return { scene: watchS, cam: magCam, clip: [magCut] };
    }, { circle: true, layers: [1] });
    circle(MAG.cx, MAG.cy, rr);
    const sp = L(17.8, 5, 0); ov.save(); ov.strokeStyle = INK; ov.lineWidth = 1.3; ov.beginPath(); ov.arc(sp[0], sp[1], 18, 0, TAU); ov.stroke();
    const ang = Math.atan2(MAG.cy - sp[1], MAG.cx - sp[0]); ov.setLineDash([5, 4]); ov.beginPath(); ov.moveTo(sp[0] + Math.cos(ang) * 18, sp[1] + Math.sin(ang) * 18); ov.lineTo(MAG.cx - Math.cos(ang) * rr, MAG.cy - Math.sin(ang) * rr); ov.stroke(); ov.restore();
    const lq = seg(t, 8.3, 8.7);
    wipeText(ov, 'CASE SECTION', MAG.cx - 150, MAG.cy + 214, lq, `600 21px ${SANS}`, INK, 1.4, seg(t, 8.95, 9.2));
    wipeText(ov, 'crystal 1.1 · dial 0.4 · movement 4.2 mm', MAG.cx - 150, MAG.cy + 238, seg(t, 8.4, 8.8), `400 15px ${MONO}`, GRAPH, 0, seg(t, 8.95, 9.2));
  }
  if (ci) circle(ci[0], ci[1], ci[2]);
}
function DIAL_R() { camS3(9.3, [0, 0]); const c = proj(V3(0, 6.3, 0), camW), e = proj(V3(17.6, 9.5, 0), camW); return Math.hypot(e[0] - c[0], e[1] - c[1]); }
function fadeLine() { const a = proj(V3(-100, -27, 0), camW), b = proj(V3(-190, -27, 0), camW); return [a, b]; }
// ═════════ S4 · 9.375–10: the dial becomes the station clock; the chime floods it
function S4(t) {
  setStreet(t);
  const open = seg(t, 9.375, 9.56), r0 = DIAL_R_CACHE ?? (DIAL_R_CACHE = DIAL_R());
  const ci = open < 1 ? [...lerpP(DIAL_SCR, DIAL_SCR, 0), lerp(r0, 2300, ei(open))] : null;
  renderView('main', FULL, (dt, j) => ({ scene: street, cam: camS4(t, j) }), ci ? { circle: ci } : {});
  camS4(t, [0, 0]);
  const L = (x, y, z) => proj(V3(x, y, z), camA), c = L(CLK.x, CLK.y, CLK.z);
  rain(camA, t, V3(40000, 12000, 6000), [60000, 30000, 30000], 700, 1400, .2);
  arcs(ov, [c[0] + 6, c[1]], [1, -.55], t - EV.chime, ss(seg(t, EV.chime + .04, EV.chime + .3)));
  tag(ov, t, [9.44, 10.6], L(CLK.x - CLK.r * .72, CLK.y - CLK.r * .7, CLK.z + 60), { dx: -230, dy: 120, name: 'STATION CLOCK', spec: 'face Ø 2 400 mm', accent: true });
  const xh = XH(t), gap = (STN.door - xh) / 1000;
  dimLine(ov, L(xh, 0, ROUTE.z), L(STN.door, 0, ROUTE.z), 26, `${gap.toFixed(1)} m TO THE DOOR`, seg(t, 9.42, 9.85), 1, 0);
  if (ci) circle(ci[0], ci[1], ci[2]);
}
let DIAL_R_CACHE = null;

window.render = t => {
  LN.drawPaper(bg); LN.clear(); ov.clearRect(0, 0, PX, PY);
  const id = shotAt(t)[2];
  if (id === 'S1') S1(t); else if (id === 'S2') S2(t); else if (id === 'S3') S3(t); else S4(t);
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
