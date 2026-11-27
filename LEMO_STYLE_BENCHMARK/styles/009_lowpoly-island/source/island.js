// The night town on a low-poly island: pointy-top hexagonal columns (sand-grey pavement, grass at the edges), box
// shops with prism roofs and emissive windows (each building its own material), plain emissive sign bars (no text: the
// style has no textures), hexagonal lamp posts with icosahedron lamps, a water tile set into the pavement as the puddle,
// a clock tower at the end of the street, the faceted sea around everything. Flat shading, no textures.
import * as THREE from 'three';
import { hash } from './shared/lib/util.js';

const SQ3 = Math.sqrt(3);
export const hex2w = (q, r) => [SQ3 * (q + r / 2), 1.5 * r];
const MC = new Map();
export function mat(hex, o = {}) { const k = hex + JSON.stringify(o); if (!MC.has(k)) MC.set(k, new THREE.MeshStandardMaterial({ color: hex, flatShading: true, roughness: .88, metalness: 0, ...o })); return MC.get(k); }
const jit = (hex, a) => { const c = new THREE.Color(hex), h = {}; c.getHSL(h); c.setHSL(h.h, h.s, Math.min(1, Math.max(0, h.l * (1 + a)))); return '#' + c.getHexString(); };
const Mm = (g, m, cast = true) => { const x = new THREE.Mesh(g, m); x.castShadow = cast; x.receiveShadow = true; return x; };
export const TOP = .22;                                           // pavement top height

export function buildIsland(scene, o = {}) {
  const G = new THREE.Group(); scene.add(G);
  // tiles: rows r = −3 … 2 along x; the runner's lane is row 0 (z = 0); the puddle replaces one tile in row 0
  const pudQR = o.puddle;                                          // [q, r]
  const tiles = [];
  for (let r = -4; r <= 2; r++) for (let q = -14 - Math.ceil(r / 2); q <= 14 - Math.floor(r / 2); q++) {
    const [x, z] = hex2w(q, r); if (Math.abs(x) > 23) continue;
    const edge = r === 2 || r === -4, h = edge ? .12 + hash(q * 3.1 + r) * .05 : TOP;
    const isPud = pudQR && q === pudQR[0] && r === pudQR[1];
    const top = isPud ? '#3d4a7a' : edge ? jit('#6f8a5e', (hash(q, r) - .5) * .12) : jit('#a8a2b8', (hash(q * 1.7 + r * 3.3) - .5) * .1);
    const side = edge ? '#5a4a3e' : '#6e6880';
    const col = Mm(new THREE.CylinderGeometry(.96, .96, h + .6 - .04, 6), mat(side)); col.position.set(x, (h - .04) / 2 - .3, z); G.add(col);
    const cap = Mm(new THREE.CylinderGeometry(.96, .96, .04, 6), mat(top, isPud ? { roughness: .25, metalness: .2 } : {})); cap.position.set(x, h - .02, z); G.add(cap);
    tiles.push({ q, r, x, z, h });
  }
  // shops on row −2 (fronts face +z), a second row of roofs behind on row −3
  const wall = ['#d8c9b0', '#c9b8d8', '#b8c9d0', '#e0c0a8', '#c0d0b8'], roof = ['#c46a5a', '#6a7aa8', '#7a5a8a', '#b07a4a', '#5a8a7a'];
  const signs = ['#7ff0e0', '#ff8fc0', '#ffc070', '#ff8fc0', '#fff0a0', '#a0f0a0', '#ffc070', '#a0e0ff'];
  const builds = [];
  let i = 0;
  for (let x = -21; x < 21; x += 2.3 + hash(i * 2.1) * .5, i++) {
    const w = 1.9 + hash(i * 1.3) * .4, h = .9 + hash(i * 3.7) * .9, d = 1.3, z = -2.6, b = new THREE.Group(); b.position.set(x, TOP, z);
    b.add(Mm(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), mat(jit(wall[i % 5], (hash(i) - .5) * .1))));
    const rf = Mm(new THREE.CylinderGeometry(d * .62, d * .62, w + .12, 3).rotateZ(Math.PI / 2).rotateX(Math.PI / 6), mat(roof[i % 5])); rf.position.set(0, h + d * .3, 0); b.add(rf);
    const winM = new THREE.MeshStandardMaterial({ color: '#ffd9a0', emissive: new THREE.Color('#ffb860'), emissiveIntensity: 1.6 + hash(i * 5.5) * .9, flatShading: true });
    const shop = Mm(new THREE.BoxGeometry(w * .6, .34, .04).translate(0, .22, d / 2 + .02), winM, false); shop.position.x = -w * .12; b.add(shop);
    const door = Mm(new THREE.BoxGeometry(.2, .36, .04).translate(w * .32, .18, d / 2 + .02), mat('#5a4040')); b.add(door);
    const sg = Mm(new THREE.BoxGeometry(w * .5, .08, .05).translate(-w * .12, .5, d / 2 + .04), new THREE.MeshStandardMaterial({ color: signs[i % signs.length], emissive: new THREE.Color(signs[i % signs.length]), emissiveIntensity: 1.4, flatShading: true }), false); b.add(sg);
    for (let fy = .7; fy < h - .15; fy += .32) for (let fx = -w / 2 + .3; fx < w / 2 - .2; fx += .42) { if (hash(i * 7 + fx * 3 + fy * 11) < .3) continue; const wq = Mm(new THREE.BoxGeometry(.18, .16, .04).translate(fx, fy, d / 2 + .02), winM, false); b.add(wq); }
    G.add(b); builds.push({ b, x, winM });
    const back = Mm(new THREE.BoxGeometry(w * .9, h + .5 + hash(i * 9.1) * .8, 1.1).translate(0, (h + .5) / 2, 0), mat(jit(wall[(i + 2) % 5], -.15))); back.position.set(x + .5, TOP, -4.3); G.add(back);
  }
  // lamp posts on row 1 (in front of the runner's lane), icosahedron lamps with a small warm light each
  const lamps = [];
  for (let k = 0; k < 6; k++) { let x = -17 + k * 6.6; if (o.avoid != null && Math.abs(x - o.avoid) < 2.2) x = o.avoid + 2.4 * Math.sign(x - o.avoid || 1); const z = 1.25, p = new THREE.Group(); p.position.set(x, TOP, z);
    p.add(Mm(new THREE.CylinderGeometry(.035, .05, 1.25, 6).translate(0, .625, 0), mat('#3a3448')));
    const lm = new THREE.Mesh(new THREE.IcosahedronGeometry(.09, 0), new THREE.MeshStandardMaterial({ color: '#fff0c0', emissive: new THREE.Color('#ffc870'), emissiveIntensity: 3, flatShading: true })); lm.position.y = 1.3; p.add(lm);
    const L = new THREE.PointLight('#ffc070', 1.6, 4.5, 2); L.position.set(x, TOP + 1.25, z); G.add(p, L); lamps.push({ p, L, x }); }
  // the clock tower at the far end of the street
  const tower = new THREE.Group(); tower.position.set(19.5, TOP, -2.4); G.add(tower);
  tower.add(Mm(new THREE.BoxGeometry(.9, 3.6, .9).translate(0, 1.8, 0), mat('#b8b0c8')));
  tower.add(Mm(new THREE.ConeGeometry(.75, .9, 4).rotateY(Math.PI / 4).translate(0, 4.05, 0), mat('#6a7aa8')));
  const faceM = new THREE.MeshStandardMaterial({ color: '#fff4d8', emissive: new THREE.Color('#ffe8b0'), emissiveIntensity: 1.2, flatShading: true });
  const face = Mm(new THREE.CylinderGeometry(.3, .3, .05, 12).rotateX(Math.PI / 2).translate(0, 3.0, .47), faceM, false); tower.add(face);
  for (const [len, a, w] of [[.18, -.15, .035], [.26, -.03, .022]]) { const hd = Mm(new THREE.BoxGeometry(w, len, .02).translate(0, len / 2, 0), mat('#2a2030'), false); hd.position.set(0, 3.0, .51); hd.rotation.z = a; tower.add(hd); }
  const clockL = new THREE.PointLight('#ffe0a0', 2, 5, 2); clockL.position.set(19.5, TOP + 3, -1.6); G.add(clockL);
  return { G, tiles, builds, lamps, tower, faceM, clockL };
}
