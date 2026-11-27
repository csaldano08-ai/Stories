// engine/print.js — excerpt from lemo-opuscar styles/printed-long-take/demo/scene.js: the renderer set-up (2× render targets rtA/rtB),
// the print pass printMat with its post scene, and draw(); copied unchanged and exported (the demo keeps them at the top of its film file).
import * as THREE from 'three';
import { C, U, GLSL_HASH } from './look.js';
const W_ = 1920, H_ = 1080, SS = 2;

// ---------------------------------------------------------------- renderer
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W_, H_, false);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
document.body.appendChild(renderer.domElement);
const rtA = new THREE.WebGLRenderTarget(W_ * SS, H_ * SS, { samples: 4 });
const rtB = new THREE.WebGLRenderTarget(W_ * SS, H_ * SS, { samples: 4 });

const scene = new THREE.Scene(); scene.background = C.ink;
const camera = new THREE.PerspectiveCamera(34, W_ / H_, .3, 9000);
const projScale = () => H_ * SS / (2 * Math.tan(camera.fov * Math.PI / 360));


// ---------------------------------------------------------------- the print pass
const printMat = new THREE.ShaderMaterial({
  uniforms: {
    tA: { value: rtA.texture }, tB: { value: rtB.texture }, uT: { value: 0 }, uRes: { value: new THREE.Vector2(W_, H_) },
    uPeel: { value: -1 }, uWhite: { value: 0 }, uFresh: { value: 0 }, tSub: { value: null }, uPaper: U.uPaper, uInk: U.uInk,
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy,0.,1.); }`,
  fragmentShader: GLSL_HASH + `
    uniform sampler2D tA, tB, tSub; uniform float uT, uPeel, uWhite, uFresh; uniform vec2 uRes; uniform vec3 uPaper, uInk; varying vec2 vUv;
    float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*vn(p); p*=2.03; a*=.5; } return s; }
    vec3 freshInk(vec3 c, vec2 uv, float amt){
      // a print just pulled: the ink hasn't covered everywhere yet
      float dark = 1. - smoothstep(.2, .5, dot(c, vec3(.33)));
      float m = smoothstep(.6, .72, fbm(uv*vec2(260.,150.)+7.)) * amt;
      float sp = step(.82, h21(floor(uv*vec2(900.,500.))));
      return mix(c, uPaper*.9, dark*max(m*.8, sp*amt*.5));
    }
    void main(){
      vec2 uv = vUv;
      vec3 c = texture2D(tA, uv).rgb;
      if (uPeel >= 0.) {
        // the top sheet is peeled from the top-right corner; the fresh print lies under it
        vec2 asp = vec2(uRes.x/uRes.y, 1.);
        vec2 p = uv*asp, corner = asp, D = normalize(-asp);
        float diag = length(asp), s = uPeel*(diag+.15);
        float d = dot(p - corner, D);
        vec3 under = freshInk(texture2D(tB, uv).rgb, uv, uFresh);
        if (d < s) {
          c = under * (1. - .4*smoothstep(.1, 0., s - d));                       // shadow along the fold
        } else if (d < 2.*s) {
          vec2 pm = p - 2.*(d - s)*D;                                           // where this bit of the flap came from
          vec2 um = pm/asp;
          if (um.x <= 1. && um.y <= 1. && um.x >= 0. && um.y >= 0.) {
            float k = (d - s)/max(s, 1e-3);
            vec3 ghost = texture2D(tA, vec2(1.-um.x, um.y)).rgb;              // show-through, mirrored
            vec3 back = mix(uPaper, ghost, .13) * (.8 + .26*smoothstep(0., .5, k) - .1*smoothstep(.5, 1., k));
            back *= 1. + (fbm(um*vec2(500.,300.))-.5)*.05;
            c = back;
            // the flap's edge, a hard ink line
            float e = min(min(um.x, um.y), min(1.-um.x, 1.-um.y));
            c = mix(uInk, c, smoothstep(.0, .0025, e));
          } else {
            c *= 1. - .3*smoothstep(.05, 0., d - 2.*s + .02);                 // cast shadow of the flap
          }
        }
      } else if (uFresh > 0.) {
        c = freshInk(c, uv, uFresh);
      }
      float lum = dot(c, vec3(.299,.587,.114));
      float dark = 1. - smoothstep(.18, .55, lum);
      float tf = floor(uT*12.)/12.;
      float fib = fbm(uv*vec2(700.,420.));
      c *= 1. + (fib-.5)*.06*(1.-dark);
      float mot = fbm(uv*vec2(46.,26.) + 3.);
      c += dark*(mot-.5)*.05;
      float b = fbm(vec2(uv.x*4.2 + tf*.06, uv.y*2.2 - tf*.02) + 11.);
      b = smoothstep(.5, .78, b) * smoothstep(.62, 1., uv.y);
      c += dark*b*.09;
      // steam whiteout: the picture is eaten by horizontal paper cuts
      if (uWhite > 0.) {
        float row = floor(uv.y*120.), f = abs(fract(uv.y*120.)-.5);
        float r = h11(row*1.7), run = vn(vec2(uv.x*3. + r*20., row*.37));
        float w = smoothstep(.0, .25, uWhite*1.8 - r*.5 - run*.5 + (.5-f)*.3);
        c = mix(c, uPaper*(1. + (fib-.5)*.05), clamp(w, 0., 1.));
      }
      c *= 1. + (h11(tf*13.7)-.5)*.03;
      vec2 q = uv-.5; c *= 1. - dot(q,q)*.1;
      vec4 sb = texture2D(tSub, uv); c = mix(c, sb.rgb, sb.a);
      gl_FragColor = vec4(c, 1.);
    }`,
  depthTest: false, depthWrite: false,
});
const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), printMat));

function draw(target) { renderer.setRenderTarget(target); renderer.render(scene, camera); }
export { renderer, rtA, rtB, scene, camera, projScale, printMat, postScene, postCam, draw, W_, H_, SS };
