// 084: the materials of the library's glass-product demo (product.js), kept as they are; the demo's earbud geometry is not used.
// Units: millimetres.
import * as THREE from 'three';

// —— Materials ——
export const AURA_A = new THREE.Color('#62dcff');   // main light-pattern colour: ice blue
export const AURA_B = new THREE.Color('#a98bff');   // peak: pale violet

export function glass(o = {}) {
  return new THREE.MeshPhysicalMaterial(Object.assign({
    color: '#ffffff', metalness: 0, roughness: .015, transmission: 1, thickness: 3, ior: 1.52,
    dispersion: 5, attenuationColor: new THREE.Color('#f3f8fb'), attenuationDistance: 160,
    specularIntensity: 1, envMapIntensity: 1.25,
  }, o));
}
export const frosted = (o = {}) => glass(Object.assign({ color: '#eef2f5', transmission: .82, roughness: .4, thickness: 7, dispersion: 1.5, envMapIntensity: 1.1 }, o));
export const metal = (color, rough, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color, metalness: 1, roughness: rough, envMapIntensity: 1.2 }, o));

// Procedural textures (canvas)
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
// Brushed metal: fine concentric lines (driver diaphragm, battery cover)
export const brushed = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
  let s = 3; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 900; i++) { const r = R() * w * .7; g.strokeStyle = `rgba(${R() < .5 ? 255 : 0},${R() < .5 ? 255 : 0},${R() < .5 ? 255 : 0},${.05 + R() * .08})`; g.lineWidth = .6 + R(); g.beginPath(); g.arc(w / 2, h / 2, r, 0, 7); g.stroke(); }
}, false);
// PCB: graphite base + gold traces + pads
const pcbTex = canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = '#15181c'; g.fillRect(0, 0, w, h);
  let s = 11; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
  g.strokeStyle = '#c9a25a'; g.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    let x = w / 2 + (R() - .5) * w * .8, y = h / 2 + (R() - .5) * h * .8; g.lineWidth = 3 + R() * 5; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 4; k++) { const d = 40 + R() * 160, a = Math.floor(R() * 8) * Math.PI / 4; x += Math.cos(a) * d; y += Math.sin(a) * d; g.lineTo(x, y); }
    g.stroke(); g.fillStyle = '#d8b46a'; g.beginPath(); g.arc(x, y, 7 + R() * 5, 0, 7); g.fill();
  }
  g.strokeStyle = 'rgba(201,162,90,.8)'; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, h / 2, w * .46, 0, 7); g.stroke();
});
const pcbRough = canvasTex(4, 4, (g) => { g.fillStyle = '#777'; g.fillRect(0, 0, 4, 4); }, false);

// Light-guide material: dark polished acrylic + controllable light pulses (flowing along uv.x)
// pulses: [{p, w, a, h}] p=position (0..1) w=width a=intensity h=hue mix; wrap=true means a ring joined end to end
const WHITE = canvasTex(2, 2, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 2, 2); });
export function guideMat(wrap) {
  const m = new THREE.MeshPhysicalMaterial({ color: '#15181b', roughness: .08, metalness: 0, clearcoat: 1, clearcoatRoughness: .05, emissive: '#ffffff', emissiveMap: WHITE, envMapIntensity: 1.4 });
  const U = { uP: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, .1, 0, 0)) }, uBase: { value: .02 }, uA: { value: AURA_A }, uB: { value: AURA_B }, uWrap: { value: wrap ? 1 : 0 } };
  m.userData.U = U;
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform vec4 uP[8]; uniform float uBase, uWrap; uniform vec3 uA, uB;`)
      .replace('#include <emissivemap_fragment>', `{
        float x = vEmissiveMapUv.x; vec3 acc = uA * uBase;
        for (int i = 0; i < 8; i++) { vec4 P = uP[i]; if (P.z <= 0.) continue;
          float d = x - P.x; if (uWrap > .5) d = fract(d + .5) - .5;
          // comet-shaped pulse: sign of P.y = direction of travel; narrow Gaussian head, exponential tail behind (length = 4× width)
          float w = abs(P.y), s = sign(P.y + 1e-6), a = d * s;
          float head = exp(-a * a / (w * w * .25)), tail = a < 0. ? exp(a / (w * 4.)) * .55 : 0.;
          float k = max(head, tail);
          acc += (mix(uA, uB, P.w + (1. - head) * .25) * k + vec3(head * head * head * .35)) * P.z; }
        totalEmissiveRadiance = acc; }`);
  };
  m.customProgramCacheKey = () => 'guide' + (wrap ? 1 : 0);
  return m;
}
export function setPulses(mat, list, base = .02) {
  const U = mat.userData.U; U.uBase.value = base;
  for (let i = 0; i < 8; i++) { const p = list[i]; U.uP.value[i].set(p ? p.p : 0, p ? p.w : .1, p ? p.a : 0, p ? p.h : 0); }
}

