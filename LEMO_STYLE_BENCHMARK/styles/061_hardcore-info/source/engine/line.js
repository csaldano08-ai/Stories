// engine/line.js — excerpt of lemo-opuscar styles/hardcore-info/demo/main.js: the renderer, the one material (grey tone / normal +
// linear depth), the tracing shader (silhouette, occlusion, crease tiers + the lighter fourth tier for hands), the 8-jitter
// accumulation inside a 0.12-frame shutter, renderView, and the 2D label kit (wipeText, tag, dimLine, arcs, hatchFill, polyGrow).
// Copied unchanged except where marked EDIT 061:
//   · packaged as a factory (the demo keeps them at module level) so the page passes its own canvases and sizes;
//   · SHUTTER is 0.12 of a 30 fps frame (the demo runs at 24 fps);
//   · opt.circle may carry its own centre and radius ([cx, cy, r] in rect pixels) so a circle can open anywhere (iris cuts);
//   · uKind 6 = water: a faint horizontal ripple tone; its section hatch is lighter and horizontal (a different material);
//   · tag(): an optional `w` lifts the leader's knee (the demo's is fixed at 7 px);
//   · pass(): opt.layers enables extra camera layers (the demo enables its guide layer the same way);
//   · cost on CPU WebGL: the silhouette search walks 8 directions instead of 16, and the tier radii scale with SS (the demo's
//     values are for SS = 2), so a lighter SS keeps the same line widths in output pixels.
import * as THREE from 'three';
import { clamp, lerp, seg, eio, eo, ss, back } from '../shared/lib/util.js';

export const PAPER = '#f6f5f0', INK = '#141414', GRAPH = '#5a5955', FAINT = '#8a8984', ACC = '#ff4d1a', ACC_GL = 0xff4d1a;
export const SANS = '"Plex Sans", sans-serif', MONO = '"Plex Mono", monospace';

export function makeLine({ canvas, ov, PX = 1920, PY = 1080, SS = 2, JIT = 8, FPS = 30 }) {
  THREE.ColorManagement.enabled = false;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(PX, PY, false);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0xffffff, 0);
  renderer.autoClear = false;

  // ---------- Material: one shader, two modes (0 = greyscale tone, 1 = normal + linear depth) ----------
  const U = { uMode: { value: 0 }, uTrace: { value: -1 } };
  const CTL = { uPath: { value: 0 }, uUmax: { value: 0.78 } };
  const VS = `
#include <clipping_planes_pars_vertex>
attribute float aS; attribute float aR;
varying vec3 vN; varying vec3 vWN; varying vec2 vUv; varying float vVZ; varying vec3 vWP; varying float vS; varying float vR;
void main(){
  vec4 mvPosition = modelViewMatrix * vec4(position,1.);
  vN = normalize(normalMatrix*normal);
  vWN = normalize(mat3(modelMatrix)*normal);
  vUv = uv; vVZ = -mvPosition.z; vWP = (modelMatrix*vec4(position,1.)).xyz; vS = aS; vR = aR;
  gl_Position = projectionMatrix*mvPosition;
  #include <clipping_planes_vertex>
}`;
  const FS = `
#include <clipping_planes_pars_fragment>
uniform float uMode; uniform vec3 uColor; uniform vec3 uColor0; uniform float uKind; uniform sampler2D uMap; uniform float uHasMap;
uniform float uPath; uniform float uUmax; uniform float uTrace;
varying vec3 vN; varying vec3 vWN; varying vec2 vUv; varying float vVZ; varying vec3 vWP; varying float vS; varying float vR;
float hatch(float period){ float h = mod(gl_FragCoord.x + gl_FragCoord.y, period); return smoothstep(0.6, 1.6, h) * (1. - smoothstep(2.6, 3.6, h)); }
float hatchH(float period){ float h = mod(gl_FragCoord.y, period); return smoothstep(0.6, 1.6, h) * (1. - smoothstep(2.6, 3.6, h)); }
void main(){
  #include <clipping_planes_fragment>
  if(uMode>0.5){
    vec3 n = normalize(vN); if(!gl_FrontFacing) n = vec3(0.,0.,1.);
    gl_FragColor = vec4(n, vVZ); return;
  }
  vec3 acc = vec3(1., .302, .102);
  vec3 col = uColor; bool lit = false; float head = 0.;
  if(uKind>2.5 && uKind<3.5){                     // accent path: lit along the path parameter vS
    float pe = min(uPath, .78);
    bool a = vS < pe, b = vS >= .78 && vS < uUmax;
    lit = a || b;
    head = a ? smoothstep(.035, 0., pe - vS) * step(pe, .779) : (b ? smoothstep(.03, 0., uUmax - vS) * step(uUmax, .999) : 0.);
    col = lit ? mix(uColor, vec3(1.,.72,.55), head*.6) : uColor0;
  }
  if(vR > .5 && uTrace > -.5){
    float d = vR - 1. - uTrace; d -= floor(d + .5);
    float k = smoothstep(.05, .015, abs(d));
    if(k > 0.){ col = mix(col, acc, k); lit = lit || k > .5; }
  }
  if(!gl_FrontFacing){                            // section faces: hatching; a lit path stays solid
    vec3 c = lit ? col : mix(vec3(.90), vec3(.34), hatch(10.));
    if(!lit && uKind>3.5 && uKind<4.5) c = mix(vec3(.93), vec3(.60), hatch(10.));
    if(!lit && uKind>5.5) c = mix(vec3(.95), vec3(.66), hatchH(7.));          // EDIT 061: water, horizontal light hatch
    gl_FragColor = vec4(c,1.); return;
  }
  vec3 n = normalize(vWN);
  vec3 L = normalize(vec3(-.35,1.,.55));
  float d = max(dot(n,L),0.);
  float tone = .82 + .18*d + .03*n.y;
  if(uKind>0.5 && uKind<1.5){ float s=.5+.5*sin((vWP.x - vWP.z*1.4)*.045); col *= mix(.94,1.0,s); }
  if(uKind>3.5 && uKind<4.5 && !lit){ col = mix(vec3(.88), vec3(.56), hatch(10.)); tone = 1.; }
  if(uKind>5.5){ float s=.5+.5*sin(vWP.x*.02 + sin(vWP.z*.013)*2.); col *= mix(.96,1.0,s); tone = .96 + .04*d; }   // EDIT 061: water
  if(uHasMap>.5){ vec4 m=texture2D(uMap,vUv); col = mix(col, m.rgb, m.a); }
  if(lit) tone = .94 + .06*d;
  float alpha = 1.;
  if(uKind>4.5 && uKind<5.5){ tone = .97 + .03*d; alpha = .5; }
  gl_FragColor = vec4(col*min(tone,1.0), alpha);
}`;
  function mat(hex, kind = 0, map = null, hex0 = null, ctl = CTL) {
    return new THREE.ShaderMaterial({
      uniforms: { uMode: U.uMode, uTrace: U.uTrace, uPath: ctl.uPath, uUmax: ctl.uUmax, uColor: { value: new THREE.Color(hex) }, uColor0: { value: new THREE.Color(hex0 ?? hex) }, uKind: { value: kind }, uMap: { value: map }, uHasMap: { value: map ? 1 : 0 } },
      vertexShader: VS, fragmentShader: FS, side: THREE.DoubleSide, clipping: true });
  }

  // ---------- Post: tracing + downsampled accumulation ----------
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const VQ = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
  const edgeMat = new THREE.ShaderMaterial({
    uniforms: { tC: { value: null }, tN: { value: null }, px: { value: new THREE.Vector2() }, rS: { value: 2.7 * SS / 2 }, rO: { value: Math.max(1, 1.7 * SS / 2) }, rC: { value: Math.max(.75, 1.05 * SS / 2) }, thD: { value: 0.0016 }, thO: { value: 0.012 }, thN: { value: 0.12 } },
    vertexShader: VQ,
    fragmentShader: `
  uniform sampler2D tC, tN; uniform vec2 px; uniform float rS, rO, rC, thD, thO, thN; varying vec2 vUv;
  float iz(vec4 s){ return s.a>0. ? 1./s.a : 0.; }
  void main(){
    vec4 c = texture2D(tC, vUv); vec4 n0 = texture2D(tN, vUv); float z0 = iz(n0); bool f0 = n0.a > 0.;
    float hf = abs(c.a - .5) < .2 ? 1. : 0.;
    float dS = 99.;
    for(int i=0;i<8;i++){
      float a = float(i)*0.785398 + 0.19635; vec2 d = vec2(cos(a), sin(a));
      for(int k=1;k<=4;k++){ float r = float(k)*rS*0.3; vec2 o = vUv + d*px*r; vec4 s = texture2D(tN, o);
        if((s.a>0.) != f0){ dS = min(dS, r); }
        if(k<=2){ float ca = texture2D(tC, o).a; if(abs(ca - .5) < .2) hf = 1.; } }
    }
    float eS = hf > .5 ? 1. - smoothstep(rS*0.3, rS*0.62, dS) : 1. - smoothstep(rS*0.62, rS*1.12, dS);
    float eO = 0., eC = 0.;
    vec2 dirs[4]; dirs[0]=vec2(1.,0.); dirs[1]=vec2(0.,1.); dirs[2]=vec2(.7071,.7071); dirs[3]=vec2(.7071,-.7071);
    for(int i=0;i<4;i++){
      vec4 a = texture2D(tN, vUv + dirs[i]*px*rO), b = texture2D(tN, vUv - dirs[i]*px*rO);
      if(f0 && a.a>0. && b.a>0.){
        float za = iz(a), zb = iz(b), m = max(z0, max(za, zb));
        eO = max(eO, smoothstep(thO, thO*1.8, abs(za + zb - 2.*z0) / m));
      }
      vec4 a2 = texture2D(tN, vUv + dirs[i]*px*rC), b2 = texture2D(tN, vUv - dirs[i]*px*rC);
      if(f0 && a2.a>0. && b2.a>0.){
        float za = iz(a2), zb = iz(b2), m = max(z0, max(za, zb));
        eC = max(eC, smoothstep(thD, thD*2.2, abs(za + zb - 2.*z0) / m));
        eC = max(eC, smoothstep(thN, thN*1.8, 1.-dot(n0.xyz, a2.xyz)));
        eC = max(eC, smoothstep(thN, thN*1.8, 1.-dot(n0.xyz, b2.xyz)));
      }
    }
    vec3 inkS = vec3(.078), inkO = vec3(.11), inkC = vec3(.25);
    float wS = eS, wO = eO*.95, wC = eC*.78;
    if(hf > .5){ wO *= .8; wC *= .75; inkS = vec3(.30); inkO = vec3(.36); inkC = vec3(.52); }
    float e = max(wS, max(wO, wC));
    vec3 ink = wS >= max(wO, wC) ? inkS : (wO >= wC ? inkO : inkC);
    vec3 col = mix(c.rgb, ink, e);
    float al = max(c.a > .01 ? 1. : 0., e);
    gl_FragColor = vec4(col*al, al);
  }`, depthTest: false, depthWrite: false, blending: THREE.NoBlending });
  const downMat = new THREE.ShaderMaterial({
    uniforms: { tE: { value: null }, px: { value: new THREE.Vector2() }, w: { value: 1 } },
    vertexShader: VQ,
    fragmentShader: `
  uniform sampler2D tE; uniform vec2 px; uniform float w; varying vec2 vUv;
  void main(){
    vec4 s = texture2D(tE, vUv + px*vec2(.5,.5)) + texture2D(tE, vUv + px*vec2(-.5,.5)) + texture2D(tE, vUv + px*vec2(.5,-.5)) + texture2D(tE, vUv + px*vec2(-.5,-.5));
    gl_FragColor = s*.25*w;
  }`, depthTest: false, depthWrite: false, transparent: true,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor });
  const copyMat = new THREE.ShaderMaterial({
    uniforms: { tA: { value: null }, circ: { value: new THREE.Vector3() }, size: { value: new THREE.Vector2() }, fadeA: { value: new THREE.Vector2() }, fadeB: { value: new THREE.Vector2() }, fadeOn: { value: 0 } }, vertexShader: VQ,
    fragmentShader: `uniform sampler2D tA; uniform vec3 circ; uniform vec2 size; uniform vec2 fadeA, fadeB; uniform float fadeOn; varying vec2 vUv;
  void main(){ vec4 s = texture2D(tA, vUv); s = vec4(min(s.rgb, vec3(s.a)), min(s.a, 1.));
    if(fadeOn > .5){ vec2 p = vec2(vUv.x, 1. - vUv.y)*size; vec2 ab = fadeB - fadeA; float u = dot(p - fadeA, ab) / dot(ab, ab); s *= 1. - smoothstep(0., 1., u); }
    if(circ.z > 0.){ float d = distance(vec2(vUv.x, 1. - vUv.y)*size, circ.xy); if(d > circ.z) discard;
      vec3 paper = vec3(.965,.961,.941); gl_FragColor = vec4(s.rgb + paper*(1.-s.a), 1.); return; }
    gl_FragColor = s; }`,
    depthTest: false, depthWrite: false, blending: THREE.NoBlending });
  const quad = new THREE.Mesh(quadGeo, edgeMat); const quadScene = new THREE.Scene(); quadScene.add(quad);
  const RT = {};
  function targets(key, w, h) {
    if (RT[key]) return RT[key];
    const lin = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    RT[key] = {
      c: new THREE.WebGLRenderTarget(w * SS, h * SS, { type: THREE.UnsignedByteType, ...lin }),
      n: new THREE.WebGLRenderTarget(w * SS, h * SS, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }),
      e: new THREE.WebGLRenderTarget(w * SS, h * SS, { type: THREE.UnsignedByteType, ...lin }),
      a: new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, ...lin }),
    };
    return RT[key];
  }
  function pass(scene, t, cam, opt, wgt) {
    renderer.clippingPlanes = opt.clip || [];
    U.uMode.value = 1; cam.layers.set(0); if (opt.layers) opt.layers.forEach(l => cam.layers.enable(l));
    scene.traverse(o => { if (o.userData.noND) o.visible = false; });
    renderer.setRenderTarget(t.n); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, cam);
    scene.traverse(o => { if (o.userData.noND) o.visible = true; });
    U.uMode.value = 0; cam.layers.set(0); if (opt.layers) opt.layers.forEach(l => cam.layers.enable(l));
    renderer.setRenderTarget(t.c); renderer.setClearColor(0xffffff, 0); renderer.clear(); renderer.render(scene, cam);
    renderer.clippingPlanes = [];
    quad.material = edgeMat; edgeMat.uniforms.tC.value = t.c.texture; edgeMat.uniforms.tN.value = t.n.texture;
    edgeMat.uniforms.px.value.set(1 / t.c.width, 1 / t.c.height);
    renderer.setRenderTarget(t.e); renderer.clear(); renderer.render(quadScene, quadCam);
    quad.material = downMat; downMat.uniforms.tE.value = t.e.texture; downMat.uniforms.px.value.set(1 / t.e.width, 1 / t.e.height); downMat.uniforms.w.value = wgt;
    renderer.setRenderTarget(t.a); renderer.render(quadScene, quadCam);
  }
  const JOFF = [[-0.125, -0.375], [0.375, -0.125], [0.125, 0.375], [-0.375, 0.125], [0, 0], [0.25, 0.25], [-0.25, 0.25], [0.25, -0.25]];
  const SHUTTER = 0.12 / FPS;                                                      // EDIT 061: 30 fps
  // rect: screen pixels (origin top left); setup(dt, jitter) poses the scene and returns {scene, cam, clip}
  // opt.circle: true = the rect's inscribed circle (demo), or [cx, cy, r] in rect pixels (EDIT 061); opt.fade = [[ax, ay], [bx, by]] (screen px)
  function renderView(key, rect, setup, opt = {}) {
    const t = targets(`${key}-${rect.w}x${rect.h}`, rect.w, rect.h);
    renderer.setRenderTarget(t.a); renderer.setClearColor(0x000000, 0); renderer.clear();
    for (let k = 0; k < JIT; k++) {
      const dt = JIT > 1 ? (k / (JIT - 1) - 0.5) * SHUTTER : 0;
      const r = setup(dt, JOFF[k % JOFF.length]);
      pass(r.scene, t, r.cam, { ...opt, clip: r.clip || [] }, 1 / JIT);
    }
    quad.material = copyMat; copyMat.uniforms.tA.value = t.a.texture;
    copyMat.uniforms.fadeOn.value = 0;
    if (opt.fade) { copyMat.uniforms.fadeA.value.set(opt.fade[0][0] - rect.x, opt.fade[0][1] - rect.y); copyMat.uniforms.fadeB.value.set(opt.fade[1][0] - rect.x, opt.fade[1][1] - rect.y); copyMat.uniforms.fadeOn.value = 1; }
    copyMat.uniforms.size.value.set(rect.w, rect.h);
    const ci = Array.isArray(opt.circle) ? opt.circle : (opt.circle ? [rect.w / 2, rect.h / 2, rect.w / 2] : [0, 0, 0]);
    copyMat.uniforms.circ.value.set(ci[0], ci[1], ci[2]);
    renderer.setRenderTarget(null); renderer.setViewport(rect.x, PY - rect.y - rect.h, rect.w, rect.h); renderer.setScissor(rect.x, PY - rect.y - rect.h, rect.w, rect.h); renderer.setScissorTest(true);
    renderer.render(quadScene, quadCam); renderer.setScissorTest(false); renderer.setViewport(0, 0, PX, PY);
  }
  function clear() { renderer.setRenderTarget(null); renderer.setClearColor(0xffffff, 0); renderer.clear(); }

  // ---------- 2D: paper, labels ----------
  function drawPaper(bg) {
    bg.fillStyle = PAPER; bg.fillRect(0, 0, PX, PY);
    bg.strokeStyle = 'rgba(20,20,20,0.04)'; bg.lineWidth = 1;
    for (let x = 0; x <= PX; x += 40) { bg.beginPath(); bg.moveTo(x + .5, 0); bg.lineTo(x + .5, PY); bg.stroke(); }
    for (let y = 0; y <= PY; y += 40) { bg.beginPath(); bg.moveTo(0, y + .5); bg.lineTo(PX, y + .5); bg.stroke(); }
    bg.strokeStyle = 'rgba(20,20,20,0.15)';
    for (let x = 40; x < PX; x += 200) for (let y = 40; y < PY; y += 200) { bg.beginPath(); bg.moveTo(x - 5, y + .5); bg.lineTo(x + 6, y + .5); bg.moveTo(x + .5, y - 5); bg.lineTo(x + .5, y + 6); bg.stroke(); }
  }
  function wipeText(c, text, x, y, p, font, color, spacing = 0, out = 0) {
    if (p <= 0 || out >= 1) return 0;
    c.save(); c.font = font; c.fillStyle = color; c.textBaseline = 'alphabetic';
    if (spacing) c.letterSpacing = spacing + 'px';
    const w = c.measureText(text).width;
    const x0 = x - 4 + (w + 8) * eio(out), x1 = x - 4 + (w + 8) * eo(p);
    c.beginPath(); c.rect(x0, y - 200, Math.max(0, x1 - x0), 260); c.clip();
    c.fillText(text, x, y); c.restore(); return w;
  }
  function textW(text, font, spacing = 0) { ov.save(); ov.font = font; if (spacing) ov.letterSpacing = spacing + 'px'; const w = ov.measureText(text).width; ov.restore(); return w; }
  function dot(c, x, y, col = INK, r = 3.2) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = col; c.fill(); }
  function polyGrow(c, pts, p) {
    if (p <= 0) return null;
    const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(l); tot += l; }
    let rem = tot * clamp(p); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); let end = pts[0];
    for (let i = 1; i < pts.length && rem > 0; i++) { const u = Math.min(1, rem / L[i - 1]); end = [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]; c.lineTo(end[0], end[1]); rem -= L[i - 1]; }
    c.stroke(); return end;
  }
  function tag(c, t, [t0, t1], anchor, { dx, dy, name, spec, accent = false, w = 7 }) {
    const u = t - t0; if (u <= 0 || t >= t1 + 0.45) return;
    const out = seg(t, t1, t1 + 0.4);
    const col = accent ? ACC : INK;
    const nameFont = `600 21px ${SANS}`;
    const nw = textW(name, nameFont, 1.4);
    const left = dx < 0;
    const lx = anchor[0] + dx, ly = anchor[1] + dy;
    const tx = left ? lx - nw : lx + 12;
    c.save(); c.globalAlpha = 1 - out * 0.15;
    c.strokeStyle = col; c.lineWidth = 1.3;
    const knee = [left ? lx + 8 : lx, ly - w];
    polyGrow(c, [anchor, knee], seg(u, 0, 0.35) * (1 - out));
    if (seg(u, 0.05, 0.2) > 0 && out < 1) dot(c, anchor[0], anchor[1], col, 3.4 * back(seg(u, 0.02, 0.18), 2));
    wipeText(c, name, tx, ly, seg(u, 0.18, 0.5), nameFont, col, 1.4, out);
    if (spec) wipeText(c, spec, tx, ly + 25, seg(u, 0.3, 0.7), `400 15px ${MONO}`, GRAPH, 0, out);
    c.restore();
  }
  function arcs(c, p, away, t, k) {
    if (k <= 0.01) return;
    const ang = Math.atan2(away[1], away[0]);
    c.save(); c.strokeStyle = ACC;
    for (let i = 0; i < 3; i++) {
      const ph = ((t * 0.8 + i / 3) % 1);
      const r = 26 + ph * 90 * (0.35 + 0.65 * k);
      c.globalAlpha = k * (1 - ph) * 0.9; c.lineWidth = 2.2 * (1 - ph) + 0.6;
      c.beginPath(); c.arc(p[0], p[1], r, ang - 0.8, ang + 0.8); c.stroke();
    }
    c.restore();
  }
  function dimLine(c, a, b, off, text, p = 1, al = 1, ticks = 0) {
    if (p <= 0 || al <= 0) return;
    c.save(); c.globalAlpha = al;
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L * off, ny = dx / L * off;
    const A = [a[0] + nx, a[1] + ny], Bp = [b[0] + nx, b[1] + ny];
    const q1 = seg(p, 0, 0.3), q2 = seg(p, 0.15, 0.8), q3 = seg(p, 0.6, 1);
    c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = 1;
    if (off) { c.beginPath(); c.moveTo(a[0] + nx * 0.15, a[1] + ny * 0.15); c.lineTo(lerp(a[0] + nx * .15, A[0] + nx * .12, q1), lerp(a[1] + ny * .15, A[1] + ny * .12, q1));
      c.moveTo(b[0] + nx * 0.15, b[1] + ny * 0.15); c.lineTo(lerp(b[0] + nx * .15, Bp[0] + nx * .12, q1), lerp(b[1] + ny * .15, Bp[1] + ny * .12, q1)); c.stroke(); }
    const M0 = [(A[0] + Bp[0]) / 2, (A[1] + Bp[1]) / 2];
    c.lineWidth = 1.25; c.beginPath(); c.moveTo(lerp(M0[0], A[0], ss(q2)), lerp(M0[1], A[1], ss(q2))); c.lineTo(lerp(M0[0], Bp[0], ss(q2)), lerp(M0[1], Bp[1], ss(q2))); c.stroke();
    const ux = dx / L, uy = dy / L;
    if (ticks && q2 > 0) { c.lineWidth = 1; for (let i = 0; i <= ticks; i++) { const f = i / ticks; if (Math.abs(f - 0.5) > ss(q2) / 2 + 1e-6) continue; const P0 = [lerp(A[0], Bp[0], f), lerp(A[1], Bp[1], f)], hl = i % 5 === 0 ? 7 : 4; c.beginPath(); c.moveTo(P0[0] - uy * hl, P0[1] + ux * hl); c.lineTo(P0[0] + uy * hl, P0[1] - ux * hl); c.stroke(); } }
    if (q2 >= 1) for (const [P0, s] of [[A, 1], [Bp, -1]]) { c.beginPath(); c.moveTo(P0[0], P0[1]); c.lineTo(P0[0] + s * ux * 11 + uy * 3.5, P0[1] + s * uy * 11 - ux * 3.5); c.lineTo(P0[0] + s * ux * 11 - uy * 3.5, P0[1] + s * uy * 11 + ux * 3.5); c.closePath(); c.fill(); }
    if (q3 > 0 && text) {
      let ang = Math.atan2(dy, dx); if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
      c.translate(M0[0], M0[1]); c.rotate(ang);
      c.font = `500 18px ${MONO}`; const tw = c.measureText(text).width; c.fillStyle = PAPER; c.fillRect(-tw / 2 - 8, -12, tw + 16, 24);
      c.globalAlpha = al * ss(q3); c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, 1);
    }
    c.restore();
  }
  function hatchFill(c, clipFn, light = false) {
    c.save(); c.beginPath(); clipFn(c); c.clip('evenodd');
    c.fillStyle = light ? '#eceae4' : '#e0e0dc'; c.fillRect(0, 0, PX, PY);
    c.strokeStyle = light ? '#a3a29d' : '#8f8f8b'; c.lineWidth = 1.1;
    c.beginPath();
    if (light) for (let k = 0; k < PY; k += 7) { c.moveTo(0, k + .5); c.lineTo(PX, k + .5); }               // EDIT 061: water hatch is horizontal
    else for (let k = -PY; k < PX + PY; k += 5) { c.moveTo(k, 0); c.lineTo(k - PY, PY); }
    c.stroke();
    c.restore();
  }
  return { THREE, renderer, U, CTL, mat, renderView, clear, drawPaper, wipeText, textW, dot, polyGrow, tag, arcs, dimLine, hatchFill };
}
