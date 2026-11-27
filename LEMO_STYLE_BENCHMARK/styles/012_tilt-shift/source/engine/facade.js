// Excerpt copied unchanged from lemo-opuscar styles/tilt-shift/demo/city.js (library 2.0.0): the facade material (shader windows, lit windows at night) and its uniforms; the town itself is not used.
import * as THREE from 'three';
export const CURB = .16;
export const U = { night: { value: 0 }, sky: { value: new THREE.Color('#8fb4d8') }, sun: { value: 1 }, lit: { value: 1 } };

const FACADE = ['#efe6d6', '#e9d9bd', '#d9c3a0', '#c9784f', '#b85c45', '#e8c872', '#f0d9a8', '#d8e2dc', '#a9c5c2', '#c8d0d8', '#9fb3c8', '#e3a58c', '#f2ece2', '#cfc6b8', '#8e9aa6', '#dcb67a'];
const TOWER = ['#9fb3c8', '#b8c4cc', '#7f95a8', '#c9d3d8', '#d9d4c8', '#6f8596'];
const ROOF = ['#8b8a86', '#a09c94', '#6e6c69', '#b7b2a8', '#7d7870', '#9a8f80', '#c2bcb0', '#5f5c58'];
const TILE = ['#b4553c', '#9c4a36', '#c26a48', '#7a5a4a', '#5f6770', '#a8543f'];

// —— Building material: shader windows, lit windows at night, smoother glass ——
export function buildingMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .86, metalness: 0 });
  m.onBeforeCompile = sh => {
    sh.uniforms.uNight = U.night; sh.uniforms.uSky = U.sky; sh.uniforms.uLit = U.lit;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 wp; varying vec3 vWp; varying vec2 vFac; varying vec3 vWP;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvWp = wp; vFac = uv; vWP = (modelMatrix * vec4(position, 1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vWp; varying vec2 vFac; varying vec3 vWP; uniform float uNight; uniform vec3 uSky; uniform float uLit;
      float hh(vec3 p){ p = fract(p*vec3(.1031,.1030,.0973)); p += dot(p, p.yxz+33.33); return fract((p.x+p.y)*p.z); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); float a = hh(vec3(i,1.)), b = hh(vec3(i+vec2(1,0),1.)), c = hh(vec3(i+vec2(0,1),1.)), d = hh(vec3(i+vec2(1,1),1.)); return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }
      float gWin = 0.; float gLit = 0.; const float CURB_Y = ${CURB.toFixed(2)};`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      { float gn = vn(vWP.xz * .7 + vWP.y * .13) * .6 + vn(vWP.xz * 3.1 - vWP.y * .9) * .4; diffuseColor.rgb *= .9 + .18 * gn; diffuseColor.rgb *= mix(.62, 1., smoothstep(CURB_Y, CURB_Y + 2.6, vWP.y)); }
      if (vFac.x >= 0. && vWp.x > 0.) {
        vec2 cs = vWp.xy; vec2 q = vFac / cs; vec2 id = floor(q); vec2 f = fract(q);
        float gf = step(vFac.y, vWp.y + ${CURB.toFixed(2)});
        float ty = floor(vWp.z / 1000.);
        float wx = .24, wy0 = .32, wy1 = .82;
        if (ty == 1.) { wx = .03; wy0 = .36; wy1 = .78; }
        else if (ty == 2.) { wx = .05; wy0 = .07; wy1 = .95; }
        else if (ty == 3.) { wx = .32; wy0 = .34; wy1 = .76; }
        if (gf > .5) { wx = .06; wy0 = .06; wy1 = .8; }
        vec2 fw = fwidth(q) * 1.2;
        float win = smoothstep(wx-fw.x, wx+fw.x, f.x) * (1.-smoothstep(1.-wx-fw.x, 1.-wx+fw.x, f.x))
                  * smoothstep(wy0-fw.y, wy0+fw.y, f.y) * (1.-smoothstep(wy1-fw.y, wy1+fw.y, f.y));
        float lod = clamp(max(fw.x, fw.y) * 2.5 - .35, 0., 1.);
        win = mix(win, (1.-2.*wx)*(wy1-wy0), lod);
        float r = hh(vec3(id, fract(vWp.z / 1000.) * 97.));
        vec3 glass = mix(vec3(.05,.07,.10), uSky * .8, .2 + .4*r);
        if (gf > .5) glass = mix(vec3(.06,.06,.07), vec3(.42,.36,.3), .35*r);
        gWin = win;
        float inY = (f.y - wy0) / (wy1 - wy0), inX = (f.x - wx) / (1. - 2.*wx);
        glass *= mix(1., .55 + .45 * smoothstep(.72, 1., 1. - inY) , 1. - lod) * mix(1., .75 + .25 * smoothstep(0., .18, inX), 1. - lod);
        float frame = win * (1. - smoothstep(0., fw.y * 2.5 + .03, min(min(inY, 1. - inY) * (wy1-wy0) * cs.y, min(inX, 1.-inX) * (1.-2.*wx) * cs.x) - .06));
        diffuseColor.rgb = mix(diffuseColor.rgb, glass, win);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.92, .91, .88), frame * (1. - lod) * .7);
        // A dark line for the parapet at the top, a string course between storeys
        float band = 1. - smoothstep(0., fw.y*2., abs(f.y - .02)) * .12 * (1.-lod);
        diffuseColor.rgb *= band;
        gLit = win * step(r, .2) * step(.55, hh(vec3(vWp.z, id.y, id.x*.37))) * (1. - lod * .6) * step(hh(vec3(id.yx, 3.3)), uLit);
      }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      roughnessFactor = mix(roughnessFactor, floor(vWp.z / 1000.) == 2. ? .08 : .22, gWin);`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
      metalnessFactor = mix(metalnessFactor, .35, gWin);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      totalEmissiveRadiance += gLit * uNight * vec3(1.0, .72, .42) * 1.25;`);
  };
  return m;
}
