// engine/cel.js — excerpt of lemo-opuscar styles/precise-mechanism/demo: the soft cel + dye front + section-hatching shader, the
// wedge cut sets and dye groups (film.js), and the own-colour outline pass (film-outline.js). Copied unchanged except EDIT 062:
//   · packaged as a factory; the cut sets are created on demand by name (the demo has two fixed ones, A and B);
//   · the hatch period is a uniform per cut set (the demo's 0.21 mm suits a watch; the station tower is cut in metres);
//   · the outline pass takes the scene, camera and part list at each render and refreshes near/far (the demo has one camera).
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

export function makeCel({ PAL, renderer }) {
  const LIGHT = new THREE.Vector3(-0.55, 1.0, 0.45).normalize();
  const lightView = { value: new THREE.Vector3() };
  const VS = `
  #include <clipping_planes_pars_vertex>
  varying vec3 vN; varying vec3 vW;
  void main(){
    vN = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <clipping_planes_vertex>
  }`;
  const FS = `
  #include <clipping_planes_pars_fragment>
  uniform vec3 colA, colB, Ld, O; uniform float R, cut, hP;
  uniform vec4 P1, P2;
  uniform vec3 hatchU;
  varying vec3 vN; varying vec3 vW;
  vec3 cel(vec3 col, float d){
    float lit = smoothstep(0.02, 0.30, d);
    float deep = smoothstep(-0.55, -0.05, d);
    vec3 shade = col * vec3(.80, .80, .86) * mix(.90, 1., deep);
    vec3 c = mix(shade, col, lit);
    return mix(c, min(col * 1.04 + .015, vec3(1.)), smoothstep(.85, .97, d) * .6);
  }
  void main(){
    #include <clipping_planes_fragment>
    float dd = distance(vW, O);
    float k = 1. - smoothstep(R - .05 * hP / .21, R + .05 * hP / .21, dd);
    float rim = smoothstep(R - .55 * hP / .21, R - .04 * hP / .21, dd) * k;
    vec3 col = mix(colA, colB, k);
    col = mix(col, min(colB * 1.10 + .10, vec3(1.)), rim * .55);
    vec3 n = normalize(vN);
    if (!gl_FrontFacing) {
      if (cut > .5) {
        vec3 rd = normalize(vW - cameraPosition);
        float best = 1e9; vec3 hp = vW;
        for (int i = 0; i < 2; i++) {
          vec4 P = i == 0 ? P1 : P2; vec4 Q = i == 0 ? P2 : P1;
          float dn = dot(P.xyz, rd); if (abs(dn) < 1e-4) continue;
          float s = -(dot(P.xyz, cameraPosition) + P.w) / dn;
          vec3 p = cameraPosition + rd * s;
          if (s > 0. && dot(Q.xyz, p) + Q.w > -1e-3 && s < best) { best = s; hp = p; }
        }
        float u = length(hp.xz - hatchU.xz) + hp.y;
        float f = abs(fract(u / hP) - .5);
        float line = 1. - smoothstep(.13, .21, f);
        vec3 base = mix(col, vec3(1.), .18);
        gl_FragColor = vec4(mix(base, col * .55, line * .85), 1.);
        return;
      }
      n = -n;
    }
    gl_FragColor = vec4(cel(col, dot(n, Ld)), 1.);
  }`;
  const CUT = {};
  function cutSet(name, period = .21) {
    if (CUT[name]) return CUT[name];
    const P1 = new THREE.Plane(), P2 = new THREE.Plane();
    return (CUT[name] = { planes: [P1, P2], P1, P2, u: { P1: { value: new THREE.Vector4() }, P2: { value: new THREE.Vector4() }, hatchU: { value: new THREE.Vector3() }, hP: { value: period } },
      nm: new THREE.MeshNormalMaterial({ side: THREE.DoubleSide, clippingPlanes: [P1, P2], clipIntersection: true }) });
  }
  const NOCUT = { P1: { value: new THREE.Vector4() }, P2: { value: new THREE.Vector4() }, hatchU: { value: new THREE.Vector3() }, hP: { value: .21 } };
  function setWedge(cs, axis, centre, open) {
    const { P1, P2, u } = cs;
    if (open < 1e-4) { P1.set(new THREE.Vector3(0, 1, 0), 1e7); P2.set(new THREE.Vector3(0, 1, 0), 1e7); }
    else {
      const a1 = centre - open / 2, a2 = centre + open / 2, c = new THREE.Vector3(axis[0], 0, axis[1]);
      P1.setFromNormalAndCoplanarPoint(new THREE.Vector3(-Math.cos(a1 + Math.PI / 2), 0, -Math.sin(a1 + Math.PI / 2)), c);
      P2.setFromNormalAndCoplanarPoint(new THREE.Vector3(-Math.cos(a2 - Math.PI / 2), 0, -Math.sin(a2 - Math.PI / 2)), c);
    }
    u.P1.value.set(P1.normal.x, P1.normal.y, P1.normal.z, P1.constant);
    u.P2.value.set(P2.normal.x, P2.normal.y, P2.normal.z, P2.constant);
    u.hatchU.value.set(axis[0], 0, axis[1]);
  }
  const dyeU = {};
  function dyeGroup(g, hexB, hexA = PAL.neutral) {
    if (!dyeU[g]) dyeU[g] = { colA: { value: new THREE.Color(hexA) }, colB: { value: new THREE.Color(hexB || hexA) }, O: { value: new THREE.Vector3() }, R: { value: -1 } };
    return dyeU[g];
  }
  function material(g, hexB, clip, hexA) {
    const u = dyeGroup(g, hexB, hexA), cs = clip ? cutSet(clip) : null;
    return new THREE.ShaderMaterial({
      uniforms: { ...u, Ld: lightView, cut: { value: cs ? 1 : 0 }, ...(cs ? cs.u : NOCUT) },
      vertexShader: VS, fragmentShader: FS, side: THREE.DoubleSide, clipping: !!cs,
      clippingPlanes: cs ? cs.planes : null, clipIntersection: true,
    });
  }
  const nMat = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
  function setLight(camera) { lightView.value.copy(LIGHT).transformDirection(camera.matrixWorldInverse); }

  // ---------- outline pass (film-outline.js) ----------
  const fs = `
  #include <packing>
  varying vec2 vUv;
  uniform sampler2D tCol, tN, tD; uniform vec2 px; uniform float near, far, rD, rN, kD; uniform vec3 ink;
  float lz(vec2 uv){ return -perspectiveDepthToViewZ(texture2D(tD, uv).x, near, far); }
  vec3 nn(vec2 uv){ return texture2D(tN, uv).xyz * 2. - 1.; }
  void main(){
    vec3 col = texture2D(tCol, vUv).rgb;
    float zc = lz(vUv);
    if (zc > far * .98) { gl_FragColor = vec4(col, 1.); return; }
    vec3 nc = nn(vUv);
    float e = 0.;
    vec2 dirs[4]; dirs[0] = vec2(1., 0.); dirs[1] = vec2(0., 1.); dirs[2] = vec2(.7071, .7071); dirs[3] = vec2(.7071, -.7071);
    float thr = kD * zc;
    for (int i = 0; i < 4; i++) {
      vec2 o = dirs[i] * px * rD;
      float za = lz(vUv + o), zb = lz(vUv - o);
      float lap = za + zb - 2. * zc;
      e = max(e, smoothstep(thr, thr * 2.2, lap));
      vec2 on = dirs[i] * px * rN;
      float dn = max(1. - dot(nc, nn(vUv + on)), 1. - dot(nc, nn(vUv - on)));
      float zn = abs(lz(vUv + on) - zc);
      e = max(e, smoothstep(.30, .55, dn) * (1. - smoothstep(thr, thr * 3., zn)) * .85);
    }
    vec3 line = mix(col * .52, ink, .28);
    gl_FragColor = vec4(mix(col, line, e), 1.);
  }`;
  function makeOutline(w, h) {
    const rtC = new THREE.WebGLRenderTarget(w, h, { samples: 4 });
    const rtN = new THREE.WebGLRenderTarget(w, h, { depthTexture: new THREE.DepthTexture(w, h, THREE.FloatType) });
    const q = new FullScreenQuad(new THREE.ShaderMaterial({
      uniforms: { tCol: { value: rtC.texture }, tN: { value: rtN.texture }, tD: { value: rtN.depthTexture }, px: { value: new THREE.Vector2(1 / w, 1 / h) },
        near: { value: 1 }, far: { value: 100 }, rD: { value: 2.6 }, rN: { value: 1.6 }, kD: { value: .0022 }, ink: { value: new THREE.Color(PAL.ink) } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
      fragmentShader: fs, depthTest: false, depthWrite: false,
    }));
    return {
      render(scene, camera, parts) {
        q.material.uniforms.near.value = camera.near; q.material.uniforms.far.value = camera.far;   // EDIT 062
        camera.layers.enableAll();
        renderer.setRenderTarget(rtC); renderer.clear(); renderer.render(scene, camera);
        camera.layers.set(0);
        const bg = renderer.getClearColor(new THREE.Color()), a = renderer.getClearAlpha();
        for (const m of parts) { m.userData.cm = m.material; m.material = m.userData.nm || nMat; }
        renderer.setClearColor(0x8080ff, 1);
        renderer.setRenderTarget(rtN); renderer.clear(); renderer.render(scene, camera);
        for (const m of parts) m.material = m.userData.cm;
        renderer.setClearColor(bg, a);
        camera.layers.enableAll();
        renderer.setRenderTarget(null); q.render(renderer);
      },
    };
  }
  return { material, dyeGroup, dyeU, cutSet, setWedge, setLight, makeOutline, nMat };
}
