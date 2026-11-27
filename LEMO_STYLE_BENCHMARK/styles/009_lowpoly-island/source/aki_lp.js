// AKI as a low-poly figure: 6-sided cylinders for limbs, a tapered hexagonal coat with a flared hem, icosahedron head and
// bob, flat shading, no textures. Every limb is placed exactly between two joints of the shared rig (solveProfile), so
// bone lengths, IK and foot lock are the rig's; the run is on ones (the style moves on ones, smoothly).
import * as THREE from 'three';

export const K = 1 / 600;                                     // rig units → world units (AKI ≈ 1 unit tall)
const C = { coat: '#e4472d', coatF: '#b8341f', trou: '#3b3b4a', trouF: '#2a2a36', boot: '#6b4430', skin: '#f2c7a4', hair: '#4a2a50', knit: '#eee2cc', gold: '#d8b25c', dial: '#fff6dc', ink: '#1e1418' };
const MAT = {}; const mat = (c, o = {}) => (MAT[c + JSON.stringify(o)] ??= new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: .85, ...o }));
const UP = new THREE.Vector3(0, 1, 0), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3();
function cyl(r0, r1, col, seg = 6) { const g = new THREE.CylinderGeometry(r1, r0, 1, seg, 1); g.translate(0, .5, 0); const m = new THREE.Mesh(g, mat(col)); m.castShadow = m.receiveShadow = true; return m; }
function bone(m, a, b) { _d.subVectors(b, a); const L = _d.length() || 1e-6; m.position.copy(a); m.quaternion.setFromUnitVectors(UP, _d.multiplyScalar(1 / L)); m.scale.set(1, L, 1); }

export function makeAki() {
  const g = new THREE.Group();
  const P = {
    armF: [cyl(.034, .03, C.coatF), cyl(.03, .026, C.coatF)], handF: new THREE.Mesh(new THREE.IcosahedronGeometry(.03, 0), mat(C.skin)),
    legF: [cyl(.05, .042, C.trouF), cyl(.042, .034, C.trouF)], legN: [cyl(.05, .042, C.trou), cyl(.042, .034, C.trou)],
    bootF: new THREE.Mesh(new THREE.BoxGeometry(.13, .05, .06).translate(.04, -.008, 0), mat(C.boot)), bootN: new THREE.Mesh(new THREE.BoxGeometry(.13, .05, .06).translate(.04, -.008, 0), mat(C.boot)),
    coat: cyl(.1, .068, C.coat, 6), hem: cyl(.128, .1, C.coat, 6), neck: cyl(.024, .022, C.skin), collar: cyl(.048, .044, C.knit, 6),
    head: new THREE.Mesh(new THREE.IcosahedronGeometry(.072, 1), mat(C.skin)),
    hair: new THREE.Mesh(new THREE.IcosahedronGeometry(.08, 1), mat(C.hair)), bob: new THREE.Mesh(new THREE.BoxGeometry(.085, .09, .13), mat(C.hair)),
    eye: new THREE.Mesh(new THREE.IcosahedronGeometry(.011, 0), mat(C.ink)),
    armN: [cyl(.034, .03, C.coat), cyl(.03, .026, C.coat)], handN: new THREE.Mesh(new THREE.IcosahedronGeometry(.03, 0), mat(C.skin)),
    belt: cyl(.103, .103, '#a8321f', 6),
  };
  // the watch on the LEFT (near) wrist: a 10-sided gold case, a cream dial (slightly emissive), hands as thin boxes
  const watch = new THREE.Group();
  const caseM = new THREE.Mesh(new THREE.CylinderGeometry(.024, .024, .012, 10), mat(C.gold, { roughness: .4, metalness: .5 })); caseM.rotation.x = Math.PI / 2; watch.add(caseM);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(.019, .019, .004, 12), mat(C.dial, { emissive: new THREE.Color('#fff0c8'), emissiveIntensity: .35 })); dial.rotation.x = Math.PI / 2; dial.position.z = .006; watch.add(dial);
  for (let k = 0; k < 12; k++) { const tk = new THREE.Mesh(new THREE.BoxGeometry(k % 3 ? .0012 : .0022, .004, .001).translate(0, .0145, 0), mat(C.ink)); tk.position.z = .0083; tk.rotation.z = -k / 12 * Math.PI * 2; watch.add(tk); }
  const hands = ['h', 'm', 's'].map((k, i) => { const len = [.011, .016, .017][i], w = [.003, .002, .0012][i]; const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, .001).translate(0, len / 2, 0), mat(i === 2 ? '#d0402c' : C.ink)); m.position.z = .0085 + i * .0004; watch.add(m); return m; });
  watch.userData.set = sec => { const mm = 58 + sec / 60; hands[0].rotation.z = -(11 + mm / 60) / 12 * Math.PI * 2; hands[1].rotation.z = -mm / 60 * Math.PI * 2; hands[2].rotation.z = -sec / 60 * Math.PI * 2; };
  watch.userData.set(41);
  for (const v of Object.values(P)) for (const m of [].concat(v)) { m.castShadow = m.receiveShadow = true; g.add(m); }
  g.add(watch);
  // J = solveProfile(...); place(J, origin [x,y,z]) — near side toward +z
  const W = (p, z, o) => new THREE.Vector3(o[0] + p[0] * K, o[1] - p[1] * K, o[2] + z);
  function place(J, o, opt = {}) {
    const zN = .065, zF = -.065, zA = .1;
    const L = (k, z, parts, boot) => { const l = J.leg[k], hip = W(l.hip, z, o), kn = W(l.knee, z, o), an = W(l.ankle, z, o); bone(parts[0], hip, kn); bone(parts[1], kn, an); boot.position.copy(an); boot.rotation.set(0, 0, -l.pitch); };
    L('f', zF, P.legF, P.bootF); L('n', zN, P.legN, P.bootN);
    const A = (k, z, parts, hand) => { const a = J.arm[k], sh = W(a.sh, z, o), el = W(a.el, z, o), wr = W(a.wr, z, o); bone(parts[0], sh, el); bone(parts[1], el, wr); hand.position.copy(wr).add(_a.subVectors(wr, el).normalize().multiplyScalar(.022)); return { el, wr }; };
    A('f', -zA, P.armF, P.handF);
    const pv = W(J.pelvis, 0, o), nb = W(J.neckBase, 0, o), nt = W(J.neckTop, 0, o), wst = W(J.waist, 0, o);
    bone(P.coat, pv.clone().addScaledVector(_b.subVectors(nb, pv).normalize(), -.02), nb.clone().addScaledVector(_b, -.01));
    const hemDir = _a.subVectors(pv, nb).normalize(), hb = opt.hemB || [0, 0];
    bone(P.hem, pv.clone().addScaledVector(hemDir, -.01), pv.clone().addScaledVector(hemDir, .2).add(new THREE.Vector3(hb[0] * K * .6, -hb[1] * K * .6, 0)));
    bone(P.belt, wst.clone().addScaledVector(hemDir, .012), wst.clone().addScaledVector(hemDir, -.012));
    bone(P.neck, nb, nt); bone(P.collar, nb.clone().addScaledVector(hemDir, .015), nb.clone().addScaledVector(hemDir, -.02));
    const hc = W(J.headC, 0, o); hc.y += .02;
    P.head.position.copy(hc); P.head.rotation.set(0, 0, -J.headA);
    const lag = opt.hairLag || [0, 0];
    P.hair.position.set(hc.x - .018 + Math.max(-.02, lag[0] * K * .3), hc.y + .018, hc.z); P.hair.scale.set(1, .85, 1.04);
    P.bob.position.set(hc.x - .035 + Math.max(-.03, lag[0] * K * .5), hc.y - .025, hc.z); P.bob.rotation.z = -J.headA + .15;
    P.eye.position.set(hc.x + .052 * Math.cos(J.headA) + .02, hc.y - .004 - .03 * Math.sin(J.headA), hc.z + .045); P.eye.scale.set(1, opt.blink ? .2 : 1.4, 1);
    const n = A('n', zA, P.armN, P.handN);
    // watch on the outside of the near wrist, its face toward the camera side
    watch.position.copy(n.wr).addScaledVector(_a.subVectors(n.wr, n.el).normalize(), -.03); watch.position.z += .032;
    watch.rotation.set(0, 0, Math.atan2(_a.y, _a.x) - Math.PI / 2);
    return { watch, hc };
  }
  return { group: g, place, watch };
}
