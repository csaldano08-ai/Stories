// engine/world_kit.js — excerpt from lemo-opuscar styles/printed-long-take/demo/world.js: canvasTex(), billboards(), fillBoards(), copied unchanged
import * as THREE from 'three';
export function canvasTex(c, mips = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; t.generateMipmaps = mips;
  t.minFilter = mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter; t.magFilter = THREE.LinearFilter;
  return t;
}


// ------------------------------------------------------------------ instanced billboards
export function billboards(count, mat, pivotBottom) {
  const base = new THREE.PlaneGeometry(1, 1); if (pivotBottom) base.translate(0, .5, 0);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.uv = base.attributes.uv;
  g.setAttribute('aOff', new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute('aSize', new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2));
  g.setAttribute('aTile', new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4));
  g.setAttribute('aRot', new THREE.InstancedBufferAttribute(new Float32Array(count), 1));
  g.instanceCount = count;
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}
function fillBoards(mesh, list, cols, rows = 1) {
  const a = mesh.geometry.attributes;
  list.forEach(([x, y, z, w, h, v, rot = 0], i) => {
    a.aOff.array.set([x, y, z], i * 3); a.aSize.array.set([w, h], i * 2);
    a.aTile.array.set([(v % cols) / cols, (rows - 1 - Math.floor(v / cols)) / rows, 1 / cols, 1 / rows], i * 4); a.aRot.array[i] = rot;
  });
  mesh.geometry.instanceCount = list.length;
  for (const k in a) a[k].needsUpdate = true;
}
export { fillBoards };
