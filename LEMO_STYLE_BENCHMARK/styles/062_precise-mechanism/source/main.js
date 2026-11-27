// 062 · Color-Coded Mechanism — the first 10 s of "Last Train Home" coloured like an anatomy plate (lemo-opuscar styles/precise-mechanism).
// A narrative adaptation: the style explains a machine by its systems; here the machine is the run to the last train, modelled in
// millimetres from our own scene (AKI 1 620 mm on the shared rig, 2.8 mm per rig unit). Three systems keep their roles throughout:
// ENERGY (warm yellow) = AKI, who drives everything; TRANSMISSION (grey-green) = the pavement that carries her; CONTROL (grey-violet)
// = the clocks that decide — her watch and the station clock. A grey world takes its colours in the order the energy flows: AKI at her
// contact with the puddle (0.94 s), the pavement as she runs, the watch at the raise. S3 cuts her watch open: a true teaching movement
// of our own counts (fourth wheel 60 → escape pinion 6, third wheel 64 → fourth pinion 8, 15-tooth escape wheel, balance 2.5 Hz =
// 5 beats a second), every wheel turned from the watch time through its tooth ratio, the escape wheel half a tooth per beat; the
// seconds hand is the accent at its moment (it crosses 48 at 8.4 s). S4 cuts the station tower open; the accent passes to the hammer,
// which strikes the bell at the chime. Every number on screen is computed from this model.
// Engine: engine/gears.js copied unchanged; engine/cel.js (excerpt of the demo's film.js shader + film-outline.js). Page contract:
// window.render(t), DUR, READY, RIGQA.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { involute, clubWheel, windows, circle as gcircle, hull, slab as gslab, spiralStrip } from './engine/gears.js';
import { makeCel } from './engine/cel.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, mulberry } from './shared/lib/util.js';

THREE.ColorManagement.enabled = false;
window.DUR = DUR;
const Q = new URLSearchParams(location.search);
const PX = 1920, PY = 1080, PR = +(Q.get('pr') || 2), TAU = Math.PI * 2, D2R = Math.PI / 180;
const PAL = { paper: '#F3F0EA', neutral: '#DDD8CF', ink: '#25282D', grey: '#7A756D', power: '#E6B94F', trans: '#79B09F', reg: '#8A97D4', accent: '#E8472A', dial: '#FAF8F3', water: '#E8E3D9' };
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(PR); renderer.setSize(PX, PY);
renderer.setClearColor(new THREE.Color(PAL.paper), 1);
renderer.localClippingEnabled = true;
document.getElementById('stage').appendChild(renderer.domElement);
const CEL = makeCel({ PAL, renderer });
const { material, dyeU, cutSet, setWedge, setLight } = CEL;
const POST = CEL.makeOutline(PX * PR, PY * PR);
const ov = document.getElementById('ov').getContext('2d');
await Promise.all(['600 30px Inter', '500 22px Inter', '500 13px "Plex Mono"'].map(f => document.fonts.load(f, 'AB09')));

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

// ═════════ materials: one light neutral for everything not discussed; the three systems; the accent; ink for hands only
const FR = material('frame', null);
const MT = {
  pave: material('street', PAL.trans), bed: FR, sub: FR, kerb: FR, road: FR, white: FR, wall: FR, trim: FR, glass: FR, frame: FR, mid: FR, dark: FR,
  jacket: material('aki', PAL.power), band: material('wwatch', PAL.reg), metal: material('wwatch', PAL.reg), ink: material('ink', PAL.ink, null, PAL.ink),
  face: material('tclock', PAL.reg, null, PAL.dial), bell: material('bell', null), hammer: material('hammer', PAL.accent),
  belfry: material('belfry', null, 'tower'),
};
MT.trousers = MT.shoe = MT.skin = MT.hair = MT.jacket;
const WATER = material('water', null, null, PAL.water);
cutSet('tower').u.hP.value = 140;
// ═════════ the street (one model, seen four ways; geometry shared with 061)
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
// shopfronts: pilasters, fascia with its name, stall riser, window with mullions, recessed door, cornice, upper storey with two windows
const SHOPS = [['BAR', 4200], ['BOOKS', 5400], ['24H', 4200], ['PHARMACY', 5600], ['NOODLES', 4800], ['CAFE', 4600], ['LAUNDRY', 5000], ['RECORDS', 5200], ['HOTEL', 6400], ['FLOWERS', 4600], ['BAKERY', 4800], ['TAILOR', 4400], ['BAR', 4000]];
const SIGNS = [];
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
    SIGNS.push([name, (a + b) / 2, 3250, ZF + 172]);
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

// ═════════ the station and its tower: a solid shaft, the clock face (control) at 22.8 m, the belfry above it built as four walls so
// a wedge cut about the tower's axis opens it; inside, the bell and its hammer
const TW = { x0: 54000, x1: 60000, h: 32000, cz: ZF - 3000 }, CLK = { x: 57000, y: 22800, z: ZF + 60, r: 1200 };
const STN = { x0: 60000, x1: 92000, h: 11000, door: 63500 };
const TCX = (TW.x0 + TW.x1) / 2, TWW = TW.x1 - TW.x0, BEL = { y0: 26000, y1: 31000, wall: 520 };
{
  const W_ = [], T = [], F = [], Bf = [];
  W_.push(box(STN.x1 - STN.x0, STN.h, 18000, (STN.x0 + STN.x1) / 2, 0, ZF - 9000));
  T.push(box(STN.x1 - STN.x0 + 200, 400, 500, (STN.x0 + STN.x1) / 2, STN.h - 400, ZF + 200));
  for (let x = STN.x0 + 2200; x < STN.x1 - 1500; x += 3200) F.push(box(1900, 5600, 40, x, 3200, ZF + 20), box(2200, 200, 260, x, 3000, ZF + 100), box(2200, 260, 200, x, 8800, ZF + 80), box(80, 5600, 120, x, 3200, ZF + 40));
  F.push(box(5200, 3400, 80, STN.door, 0, ZF + 10), box(4400, 2900, 40, STN.door, 0, ZF + 60));
  T.push(box(8400, 300, 3000, STN.door, 3800, ZF + 1500), box(140, 3800, 140, STN.door - 4000, 0, ZF + 2900), box(140, 3800, 140, STN.door + 4000, 0, ZF + 2900), box(6400, 700, 300, STN.door, 4400, ZF + 2900));
  W_.push(box(TWW + 600, 1400, TWW + 600, TCX, 0, TW.cz), box(TWW, BEL.y0, TWW, TCX, 0, TW.cz));
  for (const y of [7000, 14000, 20000]) T.push(box(TWW + 300, 300, TWW + 300, TCX, y, TW.cz));
  for (const y of [3000, 10000]) F.push(box(1300, 2600, 60, TCX, y, ZF + 30), box(1000, 2300, 40, TCX, y + 150, ZF + 62));
  // belfry: four walls with a tall opening in each, a floor, a cornice; all cut by the 'tower' wedge
  const wl = BEL.wall, H_ = BEL.y1 - BEL.y0, hw = TWW / 2;
  for (const s of [-1, 1]) {
    for (const [a, b] of [[-hw, -800], [800, hw]]) { Bf.push(box(b - a, H_, wl, TCX + (a + b) / 2, BEL.y0, TW.cz + s * (hw - wl / 2))); Bf.push(box(wl, H_, b - a, TCX + s * (hw - wl / 2), BEL.y0, TW.cz + (a + b) / 2)); }
    Bf.push(box(1600, 900, wl, TCX, BEL.y0, TW.cz + s * (hw - wl / 2)), box(1600, 1100, wl, TCX, BEL.y1 - 1100, TW.cz + s * (hw - wl / 2)));
    Bf.push(box(wl, 900, 1600, TCX + s * (hw - wl / 2), BEL.y0, TW.cz), box(wl, 1100, 1600, TCX + s * (hw - wl / 2), BEL.y1 - 1100, TW.cz));
  }
  Bf.push(box(TWW, 300, TWW, TCX, BEL.y0, TW.cz), box(TWW + 500, 500, TWW + 500, TCX, BEL.y1, TW.cz));
  T.push(new THREE.ConeGeometry(TWW * .78, 6500, 4).rotateY(Math.PI / 4).translate(TCX, BEL.y1 + 500 + 3250, TW.cz), cyl(90, 2600, TCX, BEL.y1 + 500 + 6400, TW.cz, 10));
  merge(STATIC, W_, MT.wall); merge(STATIC, T, MT.trim); merge(STATIC, F, MT.frame); merge(STATIC, Bf, MT.belfry);
  // the clock: face (control), bezel and indices in the neutral, hands in ink
  merge(STATIC, [new THREE.CylinderGeometry(CLK.r, CLK.r, 120, 72).rotateX(Math.PI / 2).translate(CLK.x, CLK.y, CLK.z)], MT.face);
  const ix = [new THREE.TorusGeometry(CLK.r + 50, 70, 10, 72).translate(CLK.x, CLK.y, CLK.z + 60)];
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, L = k % 3 ? 180 : 300; ix.push(new THREE.BoxGeometry(k % 3 ? 50 : 90, L, 30).translate(0, CLK.r - 80 - L / 2, 0).rotateZ(-a).translate(CLK.x, CLK.y, CLK.z + 75)); }
  merge(STATIC, ix, MT.ink);
  // the bell: a lathe of a bell profile, mouth 1 100 mm, hung from a yoke on a beam across the belfry
  const prof = [[0, 1180], [330, 1170], [420, 1120], [470, 980], [480, 760], [500, 520], [540, 300], [600, 120], [640, 30], [600, 0], [560, 60], [500, 260], [450, 500], [430, 760], [420, 980], [360, 1100], [0, 1120]];
  const bell = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 48).translate(TCX, 27300, TW.cz);
  merge(STATIC, [bell, box(TWW - 2 * wl, 260, 300, TCX, 28800, TW.cz), box(400, 300, 260, TCX, 28500, TW.cz)], MT.bell);
}
// the hammer: a lever pivoted beside the bell on the side facing the cut; at rest its head lies against the sound bow (lip r 640)
const HAM = { r: 1500, phi: 150 * D2R, L: 710, y: 27330 };
const hammerG = new THREE.Group(), hammerArm = new THREE.Group(); hammerG.add(hammerArm); STATIC.add(hammerG);
hammerG.position.set(TCX + Math.cos(HAM.phi) * HAM.r, HAM.y, TW.cz + Math.sin(HAM.phi) * HAM.r); hammerG.rotation.y = Math.PI - (HAM.phi + Math.PI);
merge(hammerArm, [new THREE.BoxGeometry(HAM.L, 90, 90).translate(-HAM.L / 2, 0, 0), new THREE.CylinderGeometry(150, 150, 260, 24).rotateX(Math.PI / 2).translate(-HAM.L, 0, 0), new THREE.CylinderGeometry(60, 60, 300, 14).rotateX(Math.PI / 2)], MT.hammer);
merge(hammerG, [box(220, 1400, 220, 0, -1350, 0)], MT.bell);
function hammerAngle(t) {                     // rad, + lifts the head; lifted by the cam, falls on the chime, rebounds once and rests
  if (t < EV.chime - .16) return .38 * ss(seg(t, 9.3, 9.42));
  if (t < EV.chime) return .38 * (1 - ei(seg(t, EV.chime - .16, EV.chime)));
  const u = t - EV.chime; return .07 * Math.sin(Math.min(1, u / .16) * Math.PI) * Math.exp(-u * 3);
}
const clockHands = (() => {
  const mk = (L, w, tail) => { const g = new THREE.BoxGeometry(w, L + tail, 30).translate(0, (L - tail) / 2, 0); const m = new THREE.Mesh(clean(g), MT.ink); m.position.set(CLK.x, CLK.y, CLK.z + 100); STATIC.add(m); return m; };
  return { h: mk(650, 90, 120), m: mk(980, 60, 160) };
})();

// ═════════ the watch (S3): case Ø 36 mm, dial up (+y), 12 o'clock toward −z, crown toward the hand (+x). Plan angles φ = atan2(z, x),
// so the dial reads clockwise for a camera above (12 at φ = 270°, 3 at 0°). A teaching movement of our own counts, direct centre
// seconds: the fourth wheel sits on the centre and carries the seconds hand.
const watchS = new THREE.Scene();
const TR = { fourth: 60, escP: 6, third: 64, fourP: 8, esc: 15, mF: .18, mT: .2 };
const P2D = (c, r, a) => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
const F0 = [0, 0], E0 = P2D(F0, TR.mF * (TR.fourth + TR.escP) / 2, 20 * D2R), T0 = P2D(F0, TR.mT * (TR.third + TR.fourP) / 2, 150 * D2R);
const MU = 62 * D2R, PIV = P2D(E0, 2.95, MU), BAL = P2D(E0, 6.2, MU), BRL = [-4.8, 8.6];
const ESC_R = 2.5, ESC_ROOT = 1.9;
const HY = { plate: [.6, 1.6], barrel: [1.7, 3.5], fourth: 3.0, fourP: [3.55, 4.45], third: 3.85, escP: [2.75, 3.55], esc: 3.9, fork: 4.25, hair: 4.45, bal: 4.85, dial: 5.9 };
// rotation-y convention of gears.js: shape angle θ → world φ = −θ; mesh.rotation.y = −ω puts tooth 0 at φ = ω
const WMAT = { frame: material('wframe', null), caseC: material('case', null, 'case'), dial: material('dial', null, 'case', PAL.dial),
  power: material('barrel', PAL.power), trans: material('train', PAL.trans), reg: material('esc', PAL.reg),
  ink: material('ink', PAL.ink, null, PAL.ink), sec: material('sec', PAL.accent, null, PAL.ink) };
cutSet('case').u.hP.value = .21;
const turning = [];                      // { mesh, w0, k } : angle = w0 + k · ωF
function part(geo, m, at, y, w0 = 0, k = 0) {
  const ms = new THREE.Mesh(geo, m); ms.position.set(at[0], y, at[1]); ms.rotation.y = -w0; watchS.add(ms);
  if (k !== null) turning.push({ ms, w0, k }); return ms;
}
const meshPhase = (cA, zA, wA, cB, zB) => { const b = Math.atan2(cB[1] - cA[1], cB[0] - cA[0]), pA = TAU / zA, pB = TAU / zB; const fA = (((b - wA) / pA) % 1 + 1) % 1; return b + Math.PI - (.5 - fA) * pB; };
{
  // main plate (frame) and the case (housing, cut), dial (cut)
  part(gslab(gcircle(14.9, 160), [], HY.plate[1] - HY.plate[0], 0), WMAT.frame, [0, 0], HY.plate[0], 0, null);
  const caseRing = (ri, ro, y0, h) => part(gslab(gcircle(ro, 180), [gcircle(ri, 180)], h, 0), WMAT.caseC, [0, 0], y0, 0, null);
  caseRing(15, 18, .1, 7.4); caseRing(14.9, 17.6, 7.5, 1.4);
  part(gslab(gcircle(15.5, 160), [], .5, 0), WMAT.caseC, [0, 0], 0, 0, null);
  part(gslab(gcircle(15.2, 180), [gcircle(.5, 24)], .35, 0), WMAT.dial, [0, 0], HY.dial, 0, null);
  // dial markings (ink, on the dial, cut with it): batons and minute ticks
  const mk = [];
  for (let k = 0; k < 60; k++) { const a = 270 * D2R + k / 60 * TAU, big = k % 15 === 0, hr = k % 5 === 0, L = big ? 3.4 : hr ? 2.6 : .9, wd = big ? 1.3 : hr ? .75 : .22, r = 14.2 - L / 2;
    mk.push(new THREE.BoxGeometry(L, .12, wd).translate(r, 0, 0).rotateY(-a).translate(0, HY.dial + .41, 0)); }
  const mm = new THREE.Mesh(mergeGeometries(mk.map(clean)), material('marks', PAL.ink, 'case', PAL.ink)); watchS.add(mm);
  // crown and lugs (frame), strap and wrist (frame)
  part(new THREE.CylinderGeometry(2.3, 2.3, 3.2, 20).rotateZ(Math.PI / 2), WMAT.caseC, [19.4, 0], 5.2, 0, null);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(new THREE.BoxGeometry(3, 4.4, 8), WMAT.caseC, [sx * 9.3, sz * 18.8], 4.6, 0, null);
  const band = (a0, a1) => { const s = new THREE.Shape(); s.absarc(0, 0, 32.4, a0, a1, false); s.absarc(0, 0, 30, a1, a0, true); const g = new THREE.ExtrudeGeometry(s, { depth: 18, bevelEnabled: false, curveSegments: 40 }); g.rotateY(-Math.PI / 2); g.translate(9, -31, 0); return g; };
  part(band(-1.6, .95), WMAT.frame, [0, 0], 0, 0, null); part(band(2.19, 4.4), WMAT.frame, [0, 0], 0, 0, null);
  part(bone(V3(-300, -31, 0), V3(40, -31, 0), 29.5, 27.5, false, 32).scale(1, 1, .86), WMAT.frame, [0, 0], 0, 0, null);
  part(bone(V3(40, -31, 0), V3(120, -34, -4), 27.5, 30, false, 28).scale(1, 1, .62), WMAT.frame, [0, 0], 0, 0, null);
  // barrel (energy): a toothed drum with its cover; it turns once in 6 h, so at this scale it stands still
  const gB = involute(72, .13, { steps: 4 });
  part(gslab(gB.pts, [gcircle(.9, 30)], .4, 0), WMAT.power, BRL, HY.barrel[0], 0, 0);
  part(gslab(gcircle(gB.rf - .3, 120), [gcircle(.9, 30)], HY.barrel[1] - HY.barrel[0] - .4, 0), WMAT.power, BRL, HY.barrel[0] + .4, 0, 0);
  part(new THREE.CylinderGeometry(.8, .8, 3.2, 18).translate(0, 1.6, 0), WMAT.power, BRL, 1.4, 0, null);
  // train (transmission): fourth wheel on the centre with its pinion; third wheel; arbors
  const gF = involute(TR.fourth, TR.mF), gFp = involute(TR.fourP, TR.mT), gT = involute(TR.third, TR.mT), gEp = involute(TR.escP, TR.mF);
  const wF0 = 0, wT0 = meshPhase(F0, TR.fourP, wF0, T0, TR.third), wE0 = meshPhase(F0, TR.fourth, wF0, E0, TR.escP);
  part(gslab(gF.pts, [...windows(4, 1.4, gF.rf - .55, .38), gcircle(.3, 20)], .25, 0), WMAT.trans, F0, HY.fourth, wF0, 1);
  part(gslab(gFp.pts, [], HY.fourP[1] - HY.fourP[0], 0), WMAT.trans, F0, HY.fourP[0], wF0, 1);
  part(new THREE.CylinderGeometry(.3, .3, HY.dial + .9 - HY.plate[1], 16).translate(0, (HY.dial + .9 - HY.plate[1]) / 2, 0), WMAT.trans, F0, HY.plate[1], 0, null);
  part(gslab(gT.pts, [...windows(4, 1.3, gT.rf - .55, .4), gcircle(.3, 20)], .25, 0), WMAT.trans, T0, HY.third, wT0, -1 / 8);
  part(new THREE.CylinderGeometry(.3, .3, 3.6, 16).translate(0, 1.8, 0), WMAT.trans, T0, HY.plate[1], 0, null);
  // escapement (control): escape pinion + club-tooth wheel; pallet fork with its two stones; balance with arms and hairspring
  part(gslab(gEp.pts, [], HY.escP[1] - HY.escP[0], 0), WMAT.reg, E0, HY.escP[0], wE0, -10);
  part(gslab(clubWheel(TR.esc, ESC_R, ESC_ROOT), [...windows(3, .6, ESC_ROOT - .35, .22), gcircle(.25, 20)], .22, 0), WMAT.reg, E0, HY.esc, wE0, -10);
  part(new THREE.CylinderGeometry(.25, .25, 3.0, 14).translate(0, 1.5, 0), WMAT.reg, E0, HY.plate[1], 0, null);
}
// the pallet fork: built in its own frame (pivot at the origin, +x toward the balance); stones at ±30° on the escape wheel's tip circle
const forkG = new THREE.Group(); forkG.position.set(PIV[0], HY.fork, PIV[1]); watchS.add(forkG);
{
  const toLocal = p => { const dx = p[0] - PIV[0], dz = p[1] - PIV[1], c = Math.cos(MU), s = Math.sin(MU); return [dx * c + dz * s, -(-dx * s + dz * c)]; };   // world plan → fork shape coords (x along MU)
  const sA = toLocal(P2D(E0, ESC_R + .05, MU - 30 * D2R)), sB = toLocal(P2D(E0, ESC_R + .05, MU + 30 * D2R));
  const body = hull([[0, 0, .55], [sA[0] * .78, sA[1] * .78, .32], [sB[0] * .78, sB[1] * .78, .32]], 24), lever = hull([[0, 0, .4], [1.95, 0, .22]], 20), horn = hull([[1.95, .32, .14], [1.95, -.32, .14], [2.25, .36, .12], [2.25, -.36, .12]], 12);
  for (const [o, h] of [[body, .2], [lever, .2], [horn, .2]]) { const g = gslab(o, [], h, 0); const m = new THREE.Mesh(g, WMAT.reg); m.rotation.y = -MU; forkG.add(m); }
  for (const s_ of [sA, sB]) { const g = gslab(hull([[s_[0], s_[1], .18], [s_[0] * .82, s_[1] * .82, .18]], 12), [], .3, 0); const m = new THREE.Mesh(g, WMAT.reg); m.position.y = -.4; m.rotation.y = -MU; forkG.add(m); }
}
const balG = new THREE.Group(); balG.position.set(BAL[0], HY.bal, BAL[1]); watchS.add(balG);
{
  const rim = gslab(gcircle(3.2, 120), [gcircle(2.85, 120)], .35, 0), arms = [];
  for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; arms.push(hull([[0, 0, .32], [Math.cos(a) * 2.95, Math.sin(a) * 2.95, .14]], 16)); }
  balG.add(new THREE.Mesh(rim, WMAT.reg)); for (const a of arms) balG.add(new THREE.Mesh(gslab(a, [], .18, 0), WMAT.reg));
  balG.add(new THREE.Mesh(gslab(gcircle(.55, 30), [], .25, 0).translate(0, -.55, 0), WMAT.reg));                // roller (impulse pin side)
  balG.add(new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .5, 8).translate(.48, -.55, 0), WMAT.reg));     // impulse pin
  balG.add(new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 1.6, 12).translate(0, -.3, 0), WMAT.reg));      // staff
}
const hair = new THREE.Mesh(spiralStrip(th => .45 + th / TAU * .26, 8.6, .05, .12), WMAT.reg); hair.position.set(BAL[0], HY.hair, BAL[1]); watchS.add(hair);
// hands: hour and minute in ink; the seconds hand on the fourth arbor, ink until its moment, then the accent (dye from the centre)
const handShape = (L, w0, w1, tail) => { const s = [[-tail, -w0 / 2], [L, -w1 / 2], [L + w1, 0], [L, w1 / 2], [-tail, w0 / 2]]; return s; };
const HAND = {
  h: part(gslab(handShape(8.6, 1.9, 1.3, 1.6), [], .25, 0), WMAT.ink, [0, 0], HY.dial + .55, 0, null),
  m: part(gslab(handShape(12.6, 1.4, .9, 2), [], .25, 0), WMAT.ink, [0, 0], HY.dial + .85, 0, null),
  s: part(gslab(handShape(13.4, .5, .34, 4.2), [], .2, 0), WMAT.sec, [0, 0], HY.dial + 1.15, 0, null),
};
part(new THREE.CylinderGeometry(1.1, 1.1, .7, 20).translate(0, .35, 0), WMAT.ink, [0, 0], HY.dial + 1.1, 0, null);
// ── the watch's time (seconds since midnight): it reads 11:58:47 on the cut and crosses 48 at 8.4 s (the shared event)
const W_T = t => 11 * 3600 + 58 * 60 + 48 + (t - 8.4);
const BPS = 5;                                                     // 18 000 beats an hour
function motionAt(t) {
  const b = W_T(t) * BPS, n = Math.floor(b), f = b - n;
  const steps = n + ss(clamp(f / .18));                            // the escape wheel moves only inside a short impulse window
  const S = steps / BPS;                                           // stepped seconds
  const wF = S / 60 * TAU;                                         // fourth wheel: 1 turn a minute (clockwise = φ increasing)
  const fork = 7 * D2R * (n % 2 ? 1 : -1) * lerp(-1, 1, ss(clamp(f / .18)));
  const theta = 280 * D2R / 2 * Math.sin(Math.PI * b);             // balance: passes its centre at every beat (amplitude ±140°)
  return { S, wF, fork, theta, beats: b };
}
function setWatch(t) {
  const M = motionAt(t);
  for (const p of turning) p.ms.rotation.y = -(p.w0 + p.k * M.wF);
  forkG.rotation.y = -M.fork; balG.rotation.y = -M.theta; hair.rotation.y = -M.theta * .25;
  const w = W_T(t), clk = a => 270 * D2R + a * TAU;               // dial angle → plan angle
  HAND.h.rotation.y = -clk((w / 3600 % 12) / 12); HAND.m.rotation.y = -clk((w / 60 % 60) / 60); HAND.s.rotation.y = -clk((M.S % 60) / 60);
  return M;
}

// ═════════ cameras
const camA = new THREE.PerspectiveCamera(18, PX / PY, 10, 1e6), camW = new THREE.PerspectiveCamera(20, PX / PY, .5, 5000);
function aim(cam, T, az, el, dist, fov, ox = 0, oy = 0) {
  const a = az * D2R, e = el * D2R;
  cam.fov = fov; cam.position.set(T.x + Math.sin(a) * Math.cos(e) * dist, T.y + Math.sin(e) * dist, T.z + Math.cos(a) * Math.cos(e) * dist);
  cam.up.set(0, 1, 0); cam.lookAt(T); cam.near = clamp(dist * .03, .5, 3000); cam.far = dist * 6 + 30000;
  cam.updateMatrixWorld(); cam.setViewOffset(PX, PY, ox, oy, PX, PY); cam.updateProjectionMatrix(); return cam;
}
function proj(v, cam) { const p = v.clone().project(cam); return [(p.x + 1) / 2 * PX, (1 - p.y) / 2 * PY, p.z]; }
// S1: a fast pull-back from the water where her foot will land to the low view of the crossing
function camS1(t) { const u = eo(seg(t, 0, .85)), d = seg(t, .85, 2.5);
  return aim(camA, V3(lerp(SPX.x + 120, -80, u), lerp(10, 520, u), lerp(SPX.z + 160, 220, u)), lerp(22, 14, u) - 3 * d, lerp(34, 8, u), lerp(760, 4300, u) - 250 * ss(d), 18); }
// S2: the low tracking shot along the force (her and the pavement she dyes)
function camS2(t) { const pu = ss(seg(t, EV.watchUp - .1, EV.watchUp + .9)), xh = XH(Math.min(t, 7.5));
  return aim(camA, V3(xh + 380, lerp(1450, 1200, pu), 0), lerp(9, 7, pu), 6, lerp(8600, 6600, pu), lerp(25, 22, pu)); }
// S3: locked overhead on the watch (a slow settle), the watch in the right two thirds
function camS3(t) { const u = ss(seg(t, 7.5, 9.375)); return aim(camW, V3(1.5, 5, -1), lerp(4, -2, u), lerp(70, 74, u), lerp(142, 132, u), 20, -330, -30); }
// S4: from the open belfry, a big pull-out to the whole tower with the cut kept
function camS4(t) { const u = ss(seg(t, 9.56, 10)) * .75 + .25 * ss(seg(t, 9.375, 10));
  return aim(camA, V3(TCX - 300, lerp(27800, 21500, u), TW.cz), lerp(-33, -38, u), lerp(4, 8, u), lerp(6500, 44000, u), 18, -260, -60); }

// ═════════ per-frame state
const NM = new Map(); for (const k of ['case', 'tower']) NM.set(cutSet(k).planes, cutSet(k).nm);
function partsOf(scene) { const a = []; scene.traverse(o => { if (o.isMesh) { o.userData.nm = (o.material.clippingPlanes && NM.get(o.material.clippingPlanes)) || CEL.nMat; a.push(o); } }); return a; }
function dye(g, O, R) { const u = dyeU[g]; u.O.value.copy(O); u.R.value = R; }
let LASTJ = null;
function setStreet(t) {
  LASTJ = buildAki(t); buildSplash(t);
  const xh = XH(t), sp = V3(SPX.x, 0, SPX.z), after = t >= EV.splash;
  dye('aki', sp, after ? (xh - SPX.x) + 2300 * eo(seg(t, EV.splash, EV.splash + .7)) : -1);
  dye('street', sp, after ? Math.max(.1, xh - SPX.x + 350) : -1);
  const w0 = XH(EV.watchUp); dye('wwatch', V3(w0, 1200, 220), t >= EV.watchUp ? (xh - w0) + 600 * eo(seg(t, EV.watchUp, EV.watchUp + .35)) : -1);
  dye('tclock', V3(CLK.x, CLK.y, CLK.z), t >= 9.375 ? 1500 * eo(seg(t, 9.38, 9.52)) : -1);
  dye('hammer', hammerG.position, t >= 9.375 ? 1300 * eo(seg(t, 9.42, 9.54)) : -1);
  hammerArm.rotation.z = -hammerAngle(t);
  const w = W_T(t); clockHands.h.rotation.z = -(w / 3600 % 12) / 12 * TAU; clockHands.m.rotation.z = -(w / 60 % 60) / 60 * TAU;
  setWedge(cutSet('tower'), [TCX, TW.cz], 150 * D2R, t >= 9.375 ? 95 * D2R * ss(seg(t, 9.375, 9.45)) : 0);
  return LASTJ;
}
function setWatchState(t) {
  const M = setWatch(t);
  setWedge(cutSet('case'), [0, 0], 62.5 * D2R, 175 * D2R * ss(seg(t, 7.62, 8.0)));
  dye('barrel', V3(BRL[0], 2, BRL[1]), t >= 7.75 ? 14 * eo(seg(t, 7.75, 8.0)) : -1);
  dye('train', V3(T0[0], 4, T0[1]), t >= 7.92 ? 18 * eo(seg(t, 7.92, 8.22)) : -1);
  dye('esc', V3(E0[0], 4, E0[1]), t >= 8.1 ? 12 * eo(seg(t, 8.1, 8.4)) : -1);
  dye('sec', V3(0, 7, 0), t >= 8.26 ? 16 * eo(seg(t, 8.26, 8.4)) : -1);
  return M;
}

// ═════════ the overlay: figure lines, the colour key, labels that grow out of their part
const FIG = `500 13px "Plex Mono"`;
function figLine(t, t0, t1, text) { const p = seg(t, t0, t0 + .3), o = seg(t, t1 - .2, t1); if (p <= 0 || o >= 1) return;
  ov.save(); ov.font = FIG; ov.letterSpacing = '2px'; ov.fillStyle = PAL.grey; ov.globalAlpha = 1 - o; ov.fillText(text, 64 + 14 * (1 - eo(p)), 74); ov.restore(); }
const KEY = [['ENERGY', 'AKI', PAL.power, EV.splash + .05], ['TRANSMISSION', 'THE PAVEMENT', PAL.trans, 2.7], ['CONTROL', 'THE CLOCKS', PAL.reg, EV.watchUp + .1]];
function colourKey(t) {
  KEY.forEach(([a, b, col, t0], i) => { const p = seg(t, t0, t0 + .35); if (p <= 0) return; const y = 74 + i * 26, x = PX - 330;
    ov.save(); ov.fillStyle = col; ov.beginPath(); ov.arc(x, y - 5, 7 * back(seg(t, t0, t0 + .22), 2.4), 0, TAU); ov.fill();
    ov.font = FIG; ov.letterSpacing = '2px'; ov.globalAlpha = eo(p); ov.fillStyle = PAL.ink; ov.fillText(a, x + 18 + 10 * (1 - eo(p)), y); ov.fillStyle = PAL.grey; ov.fillText('· ' + b, x + 18 + 10 * (1 - eo(p)) + ov.measureText(a).width + 10, y); ov.restore(); });
}
// level 1 = primary (name 30 px ink + one 18 px line), 2 = secondary (name 22 px mid grey)
function label(t, [t0, t1, t2], anchor, at, name, line, hue) {
  if (t < t0 || t > (t2 ?? t1) + .25 || !anchor || anchor[2] > 1) return;
  const lead = eo(seg(t, t0, t0 + .3)), txt = eo(seg(t, t0 + .15, t0 + .5)), sec = t2 && t > t1 ? ss(seg(t, t1, t1 + .3)) : 0, out = seg(t, (t2 ?? t1), (t2 ?? t1) + .25);
  ov.save(); ov.globalAlpha = 1 - out;
  const ex = lerp(anchor[0], at[0], lead), ey = lerp(anchor[1], at[1] + 10, lead);
  ov.strokeStyle = PAL.ink; ov.lineWidth = 1.2; ov.beginPath(); ov.moveTo(anchor[0], anchor[1]); ov.lineTo(ex, ey); ov.stroke();
  ov.fillStyle = PAL.ink; ov.beginPath(); ov.arc(anchor[0], anchor[1], 3.2, 0, TAU); ov.fill();
  const dx = at[0] + 6, cd = back(seg(t, t0 + .2, t0 + .42), 2.4);
  ov.fillStyle = hue; ov.beginPath(); ov.arc(dx + 8, at[1] - 10, 8 * cd, 0, TAU); ov.fill();
  ov.beginPath(); ov.rect(dx + 22, at[1] - 60, 1200 * txt, 120); ov.clip();
  const big = lerp(30, 22, sec);
  ov.font = `600 ${big}px Inter`; ov.letterSpacing = '-0.3px'; ov.fillStyle = sec > .5 ? PAL.grey : PAL.ink; ov.fillText(name, dx + 26 + 16 * (1 - txt), at[1]);
  if (line && sec < 1) { ov.globalAlpha = (1 - out) * (1 - sec); ov.font = `500 18px Inter`; ov.letterSpacing = '0px'; ov.fillStyle = PAL.grey; ov.fillText(line, dx + 27 + 16 * (1 - txt), at[1] + 27); }
  ov.restore();
}
// rain: world-anchored streaks in a deeper neutral, deterministic per drop
const RAIN = (() => { const r = mulberry(6201), o = []; for (let i = 0; i < 900; i++) o.push([r(), r(), r(), r()]); return o; })();
function rain(cam, t, c0, sz, n, len, alpha = .5) {
  ov.save(); ov.strokeStyle = '#A59D90'; ov.lineWidth = 1; ov.globalAlpha = alpha; ov.beginPath();
  for (let i = 0; i < n; i++) {
    const [a, b, cc, d] = RAIN[i], H = sz[1], y = c0.y - H / 2 + ((b * H - t * 7200 - d * H) % H + H) % H;
    const p0 = V3(c0.x + (a - .5) * sz[0], y, c0.z + (cc - .5) * sz[2]), p1 = p0.clone().add(V3(-len * .12, len, 0));
    const A = proj(p0, cam), B = proj(p1, cam); if (A[2] > 1 || B[2] > 1 || A[2] < -1) continue;
    ov.moveTo(A[0], A[1]); ov.lineTo(B[0], B[1]);
  }
  ov.stroke(); ov.restore();
}

// ═════════ the four shots
function S1(t) {
  const J = setStreet(t), cam = camS1(t); setLight(cam); POST.render(street, cam, partsOf(street));
  rain(cam, t, V3(0, 900, 300), [4200, 2000, 2400], 300, 130);
  figLine(t, .15, 2.45, 'FIG. 1 · CONTACT · LEFT FOOT IN THE PUDDLE · REAL SPEED');
  label(t, [1.05, 2.3], proj(P3(J.leg.n.knee, 120), cam), [150, 560], 'AKI', 'energy · 4.06 m/s · 2.9 steps a second', PAL.power);
}
function S2(t) {
  const J = setStreet(t), cam = camS2(t); setLight(cam); POST.render(street, cam, partsOf(street));
  const xh = XH(t);
  rain(cam, t, V3(xh + 300, 1700, 300), [9000, 3600, 5000], 520, 130, .45);
  figLine(t, 2.6, 7.45, 'FIG. 2 · THE ROUTE · REAL SPEED');
  label(t, [2.95, 4.55, 5.35], proj(V3(xh - 1300, 0, 700), cam), [150, 470], 'PAVEMENT', 'transmission · 1.40 m a step', PAL.trans);
  if (t > 6.05) { const a = J.arm.n, wp = P3(a.el, 196).lerp(P3(a.wr, 196), .84).setZ(236); label(t, [6.2, 7.38], proj(wp, cam), [150, 330], 'WATCH', 'control · case Ø 36 mm', PAL.reg); }
}
function S3(t) {
  setWatchState(t); const cam = camS3(t); setLight(cam); POST.render(watchS, cam, partsOf(watchS));
  figLine(t, 7.55, 9.36, "FIG. 3 · AKI'S WATCH, CUT OPEN · REAL SPEED");
  label(t, [7.98, 8.5, 9.3], proj(V3(BAL[0] + 2.4, HY.bal + .35, BAL[1] + 1.6), cam), [150, 640], 'BALANCE', '2.5 Hz · 5 beats a second', PAL.reg);
  const sa = 270 * D2R + (motionAt(t).S % 60) / 60 * TAU, sp = V3(Math.cos(sa) * 9.5, HY.dial + 1.3, Math.sin(sa) * 9.5);
  label(t, [8.5, 9.32], proj(sp, cam), [150, 420], 'SECONDS HAND', 'on the fourth wheel · 1 turn a minute', PAL.accent);
}
function S4(t) {
  setStreet(t); const cam = camS4(t); setLight(cam); POST.render(street, cam, partsOf(street));
  rain(cam, t, V3(TCX - 6000, 24000, 4000), [40000, 22000, 26000], 600, 900, .4);
  figLine(t, 9.4, 10.3, 'FIG. 4 · STATION CLOCK, CUT OPEN');
  hammerG.updateMatrixWorld(true);
  label(t, [9.46, 10.4], proj(V3(-HAM.L, 0, 0).applyMatrix4(hammerArm.matrixWorld), cam), [150, 470], 'HAMMER', 'one blow on the bell', PAL.accent);
}
window.render = t => {
  ov.clearRect(0, 0, PX, PY);
  const id = shotAt(t)[2];
  if (id === 'S1') S1(t); else if (id === 'S2') S2(t); else if (id === 'S3') S3(t); else S4(t);
  colourKey(t);
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
