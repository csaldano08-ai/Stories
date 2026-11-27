// 091 · The props in AKI's tray, built as X-ray solids at real sizes (metres). Frame: x along the belt (the belt runs
// towards -x), z across it (+z = down on the top view, so 12 o'clock on the watch faces -z), y up from the belt.
// Every solid is closed; hollow parts are an outer solid plus the same shape shrunk with negative density (xr.js).
import { THREE, V, X, item, rbox, cylShell, tube, flat, spring, mulberry, ORG, MET, ALU, PVC, GLASS, CELL } from './xr.js';

const alongX = geo => geo.rotateZ(Math.PI / 2);   // cylinder axis y → x
// a grey plastic screening tray (organic, about 4 mm walls)
function tray(parent, w = .56, d = .40, h = .08, t = .004) {
  const g = new THREE.Group(); parent.add(g);
  X(rbox(w, t, d, .0015), ORG, .7, g).position.set(0, t / 2, 0);
  for (const s of [-1, 1]) {
    X(rbox(w, h, t, .0015), ORG, .7, g).position.set(0, h / 2, s * (d / 2 - t / 2));
    X(rbox(t, h, d - 2 * t, .0015), ORG, .7, g).position.set(s * (w / 2 - t / 2), h / 2, 0);
    X(rbox(w + .01, .007, .016, .003), ORG, .7, g).position.set(0, h - .0035, s * (d / 2 + .005));   // rim lip
  }
  return g;
}
// ——— the wristwatch: steel case, a small quartz movement set off-centre, a thin brass dial with steel indices, three steel hands
export function watch(parent) {
  const w = new THREE.Group(); parent.add(w);
  cylShell(.0195, .011, .0022, MET, 1.0, w, 56);                                                   // case wall
  X(new THREE.CylinderGeometry(.0185, .0185, .0008, 56), MET, .6, w).position.y = -.0047;            // case back
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) X(rbox(.0035, .0032, .0065, .0008), MET, 1.1, w).position.set(sx * .0085, -.001, sz * .0215);   // lugs
  X(alongX(new THREE.CylinderGeometry(.0021, .0021, .0035, 20)), MET, 1.3, w).position.set(.0213, 0, 0);   // crown at 3 o'clock
  // movement: a ring plate round the edge, the cell at 7 o'clock and three wheels between 1 and 5 o'clock
  X(new THREE.CylinderGeometry(.0165, .0165, .0007, 56), MET, .5, w).position.y = -.0034;
  X(new THREE.CylinderGeometry(.0128, .0128, .0009, 56), MET, -.5, w).position.y = -.0034;
  X(new THREE.CylinderGeometry(.0058, .0058, .0016, 40), CELL, 1.6, w).position.set(-.0072, -.0028, .0072);
  const wheel = (x, z, r, teeth) => {
    const g = new THREE.Group(); g.position.set(x, -.0026, z); w.add(g);
    X(new THREE.CylinderGeometry(r, r, .0005, 36), MET, 1.0, g); X(new THREE.CylinderGeometry(r * .62, r * .62, .0007, 36), MET, -1.0, g);
    for (let i = 0; i < 4; i++) X(rbox(r * 1.2, .0005, .0006, .0001), MET, 1.0, g).rotation.y = i * Math.PI / 4;     // spokes
    for (let i = 0; i < teeth; i++) { const a = i / teeth * Math.PI * 2; X(rbox(.0007, .0005, .0006, .0001), MET, 1.0, g).position.set(Math.cos(a) * (r + .0003), 0, Math.sin(a) * (r + .0003)); }
    X(new THREE.CylinderGeometry(.0006, .0006, .0018, 12), MET, 1.6, g);   // arbor
  };
  wheel(.0085, -.0055, .0036, 18); wheel(.0098, .0035, .0029, 14); wheel(.0042, .0092, .0022, 12);
  X(new THREE.CylinderGeometry(.0162, .0162, .0004, 56), MET, .15, w).position.y = .0008;             // brass dial
  for (let i = 0; i < 12; i++) {                                                                       // steel indices (12 o'clock doubled)
    const a = i / 12 * Math.PI * 2, n = i === 0 ? 2 : 1;
    for (let k = 0; k < n; k++) { const m = X(rbox(.0011, .0006, .0032, .0002), MET, 2.4, w); const off = n > 1 ? (k - .5) * .0019 : 0;
      m.position.set(Math.sin(a) * .0131 + Math.cos(a) * off, .0013, -Math.cos(a) * .0131 + Math.sin(a) * off); m.rotation.y = -a; }
  }
  const hand = (len, wd, th, den, tail, y) => {   // pivot at the centre, pointing to 12 (−z); rotation.y = −clockwise angle
    const p = new THREE.Group(); p.position.y = y; w.add(p);
    X(rbox(wd, th, len + tail, Math.min(wd, th) * .45).translate(0, 0, -(len - tail) / 2), MET, den, p);
    return p;
  };
  const H = { h: hand(.0088, .0021, .0013, 3.2, .002, .0019), m: hand(.0129, .0015, .0012, 3.2, .0024, .0031), s: hand(.0146, .0007, .0009, 3.6, .0042, .0040) };   // thick enough to read at the operator's zoom
  X(new THREE.CylinderGeometry(.0011, .0011, .0012, 16), MET, 2.6, H.s).position.y = .0002;   // centre cap
  X(new THREE.CylinderGeometry(.0168, .0168, .0016, 56), GLASS, .35, w).position.y = .0052;      // crystal
  // leather straps (organic, woven texture), five holes in one, a steel buckle on the other
  for (const sz of [-1, 1]) {
    const L = sz < 0 ? .078 : .066;
    X(rbox(.0185, .0028, L, .0012), ORG, .95, w, { weave: .55, seed: 3 + sz }).position.set(0, -.0012, sz * (.0215 + L / 2));
    if (sz < 0) for (let k = 0; k < 5; k++) X(new THREE.CylinderGeometry(.0011, .0011, .0034, 12), ORG, -.95, w).position.set(0, -.0012, -(.0215 + .03 + k * .0075));
    else { const bs = new THREE.Shape(); bs.moveTo(-.0115, -.008); bs.lineTo(.0115, -.008); bs.lineTo(.0115, .008); bs.lineTo(-.0115, .008); bs.lineTo(-.0115, -.008);
      const bh = new THREE.Path(); bh.moveTo(-.0088, -.0055); bh.lineTo(-.0088, .0055); bh.lineTo(.0088, .0055); bh.lineTo(.0088, -.0055); bh.lineTo(-.0088, -.0055); bs.holes.push(bh);
      flat(bs, .0022, MET, 1.4, w).position.set(0, .0002, .0215 + L - .002); X(rbox(.0009, .0012, .009, .0003), MET, 1.8, w).position.set(0, .0012, .0215 + L - .002); }
  }
  return { g: w, H };
}
// ——— a compact umbrella, folded and still wet: telescoped aluminium shaft, steel ribs, wet canopy, a handle with the opening spring inside
export function umbrella(parent, seed = 5) {
  const u = new THREE.Group(); parent.add(u); const r = mulberry(seed);
  [[.0046, .205, 0], [.0038, .19, .012], [.0031, .17, .026]].forEach(([rad, len, off]) => { const [o, i] = cylShell(rad, len, .0007, ALU, 1.0, u, 24); for (const m of [o, i]) { m.geometry.rotateZ(Math.PI / 2); m.position.set(off - .01, .02, 0); } });
  X(alongX(new THREE.CylinderGeometry(.0026, .0018, .016, 16)), MET, 1.6, u).position.set(.098, .02, 0);   // ferrule
  for (let i = 0; i < 8; i++) {                                                                                 // ribs, folded along the shaft
    const a = i / 8 * Math.PI * 2, R0 = .0075 + r() * .003, R1 = .0105 + r() * .004;
    tube([V(-.085, .02 + Math.sin(a) * R0, Math.cos(a) * R0), V(-.02, .02 + Math.sin(a) * R1, Math.cos(a) * R1), V(.04, .02 + Math.sin(a) * (R1 - .002), Math.cos(a) * (R1 - .002)), V(.088, .02 + Math.sin(a) * R0 * .6, Math.cos(a) * R0 * .6)], .00085, MET, 1.4, u, 40, false, 5);
  }
  X(rbox(.19, .034, .04, .015, 5), ORG, .42, u, { weave: .75, seed: 9 }).position.set(.0, .003, 0);            // canopy, wrapped
  for (let i = 0; i < 9; i++) { const d = X(new THREE.SphereGeometry(.003 + r() * .004, 12, 8), ORG, .9, u, { lump: .4, seed: i }); d.position.set(-.08 + r() * .17, .002, (r() - .5) * .05); d.scale.y = .5; }   // water drops
  X(alongX(new THREE.CylinderGeometry(.0135, .0145, .072, 24)), ORG, .85, u).position.set(-.138, .02, 0);      // handle
  X(alongX(new THREE.CylinderGeometry(.008, .008, .062, 20)), ORG, -.85, u).position.set(-.138, .02, 0);
  const sp = new THREE.Group(); sp.position.set(-.135, .02, 0); sp.rotation.z = Math.PI / 2; u.add(sp); spring(.0055, .05, 11, .0006, MET, 1.6, sp);   // the opening spring
  X(rbox(.008, .004, .006, .0015), MET, 1.4, u).position.set(-.118, .034, 0);                                  // the button
  X(rbox(.05, .0016, .014, .0006), ORG, .9, u, { weave: .6, seed: 2 }).position.set(.02, .0005, .028);         // strap
  X(new THREE.CylinderGeometry(.005, .005, .002, 20), MET, 1.3, u).position.set(.04, .002, .028);              // snap
  return u;
}
// ——— a key ring with two keys
function keyShape(len, seed) {
  const r = mulberry(seed), s = new THREE.Shape();
  s.absarc(0, 0, .0135, Math.PI * .22, Math.PI * 1.78, false); s.lineTo(.016, -.0042);
  for (let i = 0; i < 5; i++) { const x = .018 + (len - .022) * (i + .5) / 5; s.lineTo(x - .0022, -.0036 - r() * .0032); s.lineTo(x + .0022, -.0042); }
  s.lineTo(len, -.0018); s.lineTo(len, .0034); s.lineTo(.016, .0042); s.lineTo(.0105, .0085);
  const hole = new THREE.Path(); hole.absarc(-.0035, 0, .0042, 0, Math.PI * 2, true); s.holes.push(hole);
  return s;
}
export function keys(parent, seed = 31) {
  const g = new THREE.Group(); parent.add(g);
  X(new THREE.TorusGeometry(.0145, .0012, 8, 44).rotateX(Math.PI / 2), MET, 1.6, g).position.y = .004;
  [[.058, -.35], [.05, .55]].forEach(([len, rot], i) => { const k = new THREE.Group(); k.position.set(.011, .002 + i * .0024, 0); k.rotation.y = rot; g.add(k); flat(keyShape(len, seed + i), .0021, MET, 1.15, k).position.x = .0135; });
  return g;
}
export function coins(parent, list) { for (const [x, z, r] of list) X(new THREE.CylinderGeometry(r, r, .0019, 36), MET, 1.0, parent).position.set(x, .003, z); }
// ——— a contactless transit card: PVC body, a copper antenna of four turns, the chip module
export function card(parent) {
  const g = new THREE.Group(); parent.add(g);
  X(rbox(.0856, .0008, .054, .0003), PVC, 1.1, g).position.y = .0004;
  for (let k = 0; k < 4; k++) { const w2 = .037 - k * .0016, h2 = .0225 - k * .0016, s = new THREE.Shape(); s.moveTo(-w2, -h2); s.lineTo(w2, -h2); s.lineTo(w2, h2); s.lineTo(-w2, h2); s.lineTo(-w2, -h2);
    const ih = new THREE.Path(), w3 = w2 - .0006, h3 = h2 - .0006; ih.moveTo(-w3, -h3); ih.lineTo(-w3, h3); ih.lineTo(w3, h3); ih.lineTo(w3, -h3); ih.lineTo(-w3, -h3); s.holes.push(ih);
    flat(s, .0003, MET, 2.6, g).position.y = .0005; }
  X(rbox(.0118, .0007, .0098, .0006), MET, 1.8, g).position.set(-.022, .0008, -.002);
  X(rbox(.004, .0009, .004, .0003), MET, 2.4, g).position.set(-.022, .0011, -.002);
  return g;
}
// ——— AKI's tray: the watch she took off, her keys, coins, the card and the wet umbrella
export function akiTray() {
  const it = item('tray'); tray(it);
  const U = umbrella(it); U.position.set(-.06, .004, -.105); U.rotation.y = .1;
  const K = keys(it); K.position.set(.17, .004, -.11); K.rotation.y = .7;
  coins(it, [[.205, .045, .0118], [.188, .065, .0105], [.222, .07, .0118]]);
  const C = card(it); C.position.set(.11, .004, .1); C.rotation.y = -.18;
  const Wt = watch(it); Wt.g.position.set(-.07, .0095, .075); Wt.g.rotation.y = 0;
  return { it, watch: Wt };
}
