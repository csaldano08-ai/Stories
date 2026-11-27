// 018 · Paper-cut Lightbox — the first 10 s of "Last Train Home" as a backlit paper-cut shadow box (lemo-opuscar
// styles/paper-lantern), full-bleed: the lens is inside the box. Every element is a flat cut sheet parallel to the box
// front (night ladder: pale translucent sky and far city at the back, darker shopfronts, an almost black front); warm light
// burns through cut windows, signs and the watch; a top spot casts soft shadows from each layer onto the next; shallow depth
// of field and bloom. AKI is a jointed paper silhouette (a sheet per limb, anchored at its joint, rotation only, joints placed
// by the shared rig); her vermilion coat is the one accent colour, backlit. Everything renders on ones (style rule).
// Engine copied unchanged from the style's demo (paper.js sheets, stage.js scene + lights, post.js DoF/bloom/grade, lib.js).
// Page contract: window.render(t), DUR, READY, RIGQA.
import * as THREE from 'three';
import { Pipe } from './engine/post.js';
import { stage, aim, dispose } from './engine/stage.js';
import { sheet, skyPanel, text, burst } from './engine/paper.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { lerp, seg, ss, eio, eo, back, hash, clamp, mulberry } from './shared/lib/util.js';

const TAU = Math.PI * 2, SSAA = +(new URLSearchParams(location.search).get('ssaa') || 1);
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(SSAA); renderer.setSize(1920, 1080, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
const pipe = new Pipe(renderer, 1920, 1080, SSAA);
await document.fonts.load('600 40px Cormorant', 'CAFE24H');

// the night ladder (back → front) + warm light + one accent
const L = { sky0: '#0a1330', sky1: '#2a3d72', far: '#6a86c2', mid: '#3f5a92', shop: '#2a3a66', front: '#0e1532', fig: '#151b38', win: '#ffb862', coat: '#c8432c', gold: '#d9a441' };
const PAPER = '#d8d2c4', LIT = '#f3d9a6';   // LIT: thin warm paper over a light (with its emissive map)

// ——— the run (shared rig), in metres: 600 rig units ≈ 6.6 cm of paper ———
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const K = 1.1e-4, XR = t => RUN.pelvisAt(t)[0];
const wx = x => x * K, wy = y => -y * K;   // rig (y down) → paper metres (y up); ground line at y = 0
function poseAt(t) {
  const S = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  const w = clamp(up, 0, 1.1) * (1 - dn); S.watch = w;
  if (w > 0) { const J0 = solveProfile(S), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S.arms.f.sh *= 1 - .45 * wm; S.head += .26 * wm; S.neck += .08 * wm; }
  return S;
}

// ——— AKI: a jointed paper silhouette ———
// each limb sheet is drawn hanging straight down from its anchor (the joint); per frame it is placed at the rig's joint and
// rotated to point at the next joint, so bone lengths are the rig's and only rotations animate
function capsule(x, L_, w0, w1) { x.beginPath(); x.moveTo(-w0 / 2, 0); x.lineTo(-w1 / 2, -L_); x.arc(0, -L_, w1 / 2, Math.PI, 0, false); x.lineTo(w0 / 2, 0); x.arc(0, 0, w0 / 2, 0, Math.PI, true); x.fill(); }
function limbSheet(U, Lu, w0u, w1u, col, z, o = {}) {
  const Lm = Lu * K, w0 = w0u * K, w1 = w1u * K, pad = .0012, w = Math.max(w0, w1) + pad * 2 + (o.extraW || 0), h = Lm + w0 / 2 + w1 / 2 + pad * 2 + (o.extraH || 0);
  const ay = h / 2 - pad - w0 / 2;
  return sheet({ U, w, h, ax: 0, ay, z, trans: o.trans ?? .06, shadow: true, recv: true, finish: { rim: .3, under: .3 },
    draw: (x) => { x.fillStyle = col; x.save(); x.translate(0, ay); capsule(x, Lm, w0, w1); if (o.end) o.end(x, Lm); x.restore(); },
    glowDraw: o.glow ? (x) => { x.fillStyle = '#000'; x.fillRect(-w / 2, -h / 2, w, h); x.save(); x.translate(0, ay); o.glow(x, Lm); x.restore(); } : undefined, glow: o.glowK ?? 0, glowCol: L.win });
}
function place(m, a, b, x0, y0) { const A = [x0 + wx(a[0]), y0 + wy(a[1])], B = [x0 + wx(b[0]), y0 + wy(b[1])]; m.position.x = A[0]; m.position.y = A[1]; m.rotation.z = Math.atan2(B[1] - A[1], B[0] - A[0]) + Math.PI / 2; }
function buildAki(S, U, z) {
  const P = {};
  P.armF = [limbSheet(U, 108, 34, 30, L.coat, z - .0012, { trans: .2 }), limbSheet(U, 92, 30, 26, L.coat, z - .0011, { trans: .2, end: (x, Lm) => { x.fillStyle = L.fig; x.beginPath(); x.arc(0, -Lm - 14 * K, 15 * K, 0, TAU); x.fill(); } })];
  P.legF = [limbSheet(U, 150, 46, 40, L.fig, z - .0010), limbSheet(U, 144, 40, 34, L.fig, z - .0009)];
  P.legN = [limbSheet(U, 150, 48, 42, L.fig, z + .0004), limbSheet(U, 144, 42, 36, L.fig, z + .0005)];
  const bootDraw = x => { x.fillStyle = '#1d1410'; x.beginPath(); const pts = [[-16, 26], [-20, -14], [-14, -18], [44, -18], [60, -14], [62, -4], [48, 4], [18, 10], [14, 26]]; pts.forEach(([u, v], i) => i ? x.lineTo(u * K, v * K) : x.moveTo(u * K, v * K)); x.fill(); };
  P.bootF = sheet({ U, w: .011, h: .007, ax: 0, ay: 0, z: z - .0008, trans: .05, draw: bootDraw, finish: { rim: .3, under: .3 } });
  P.bootN = sheet({ U, w: .011, h: .007, ax: 0, ay: 0, z: z + .0006, trans: .05, draw: bootDraw, finish: { rim: .3, under: .3 } });
  // the coat: one vermilion sheet hinged at the pelvis (torso + coat), and a hem flap hinged at the hips that lags behind
  const coatPts = [[16, 182], [-18, 180], [-32, 164], [-34, 72], [-38, -10], [40, -10], [28, 72], [30, 140]];
  P.coat = sheet({ U, w: .011, h: .024, ax: 0, ay: -.004, z: z, trans: .32, finish: { rim: .35, under: .3 },
    draw: x => { x.translate(0, -.004); x.fillStyle = L.coat; x.beginPath(); coatPts.forEach(([u, v], i) => i ? x.lineTo(u * K, v * K) : x.moveTo(u * K, v * K)); x.fill();
      x.fillStyle = L.fig; x.fillRect(-34 * K, 66 * K, 64 * K, 8 * K); x.fillStyle = '#e8dcc0'; x.beginPath(); x.ellipse(0, 176 * K, 20 * K, 10 * K, 0, 0, TAU); x.fill(); } });
  P.hem = sheet({ U, w: .011, h: .011, ax: 0, ay: .004, z: z + .0001, trans: .32, finish: { rim: .2, under: .35 },
    draw: x => { x.translate(0, .004); x.fillStyle = L.coat; x.beginPath(); [[-38, 0], [40, 0], [44, -84], [-46, -80]].forEach(([u, v], i) => i ? x.lineTo(u * K, v * K) : x.moveTo(u * K, v * K)); x.fill(); } });
  // the head: profile (forehead, nose, chin), the bob as one cut shape with bangs; a back hair flap hinged at the crown
  P.head = sheet({ U, w: .014, h: .014, ax: 0, ay: 0, z: z + .0002, trans: .06, finish: { rim: .3, under: .25 },
    draw: x => { x.translate(8 * K, 30 * K); x.fillStyle = L.fig; x.beginPath(); [[0, 40], [26, 35], [40, 18], [44, 4], [51, -5], [44, -12], [42, -24], [30, -38], [10, -45], [-14, -41], [-30, -27], [-37, -4], [-30, 22], [-16, 36]].forEach(([u, v], i) => i ? x.lineTo(u * K, v * K) : x.moveTo(u * K, v * K)); x.fill();
      x.beginPath(); [[12, 46], [-14, 50], [-38, 38], [-52, 10], [-54, -22], [-48, -50], [-30, -58], [-14, -48], [-8, -24], [4, -8], [10, 16], [26, 34], [44, 22], [48, 12], [30, 22], [14, 24]].forEach(([u, v], i) => i ? x.lineTo(u * K, v * K) : x.moveTo(u * K, v * K)); x.fill(); },
    glowDraw: x => { x.fillStyle = '#000'; x.fillRect(-.007, -.007, .014, .014); x.translate(8 * K, 30 * K); x.fillStyle = '#fff'; x.beginPath(); x.ellipse(27 * K, 4 * K, 5 * K, 2.4 * K, -.15, 0, TAU); x.fill(); }, glow: .9, glowCol: '#ffd9a0' });   // the eye: a sliver of light cut through
  P.armN = [limbSheet(U, 108, 36, 32, L.coat, z + .0008, { trans: .22 }), limbSheet(U, 92, 32, 28, L.coat, z + .0009, { trans: .22,
    end: (x, Lm) => { x.fillStyle = L.fig; x.beginPath(); x.arc(0, -Lm - 14 * K, 16 * K, 0, TAU); x.fill(); x.fillStyle = L.gold; x.beginPath(); x.arc(0, -Lm + 8 * K, 11 * K, 0, TAU); x.fill(); },
    glow: (x, Lm) => { x.fillStyle = '#fff'; x.beginPath(); x.arc(0, -Lm + 8 * K, 6.5 * K, 0, TAU); x.fill(); }, glowK: 1.4 })];   // the watch face: light through a pinhole
  for (const k in P) for (const m of [].concat(P[k])) S.add(m);
  function set(J, x0, y0, o = {}) {
    place(P.armF[0], J.arm.f.sh, J.arm.f.el, x0, y0); place(P.armF[1], J.arm.f.el, J.arm.f.wr, x0, y0);
    for (const [k, Lg, Bt] of [['f', P.legF, P.bootF], ['n', P.legN, P.bootN]]) { const l = J.leg[k]; place(Lg[0], l.hip, l.knee, x0, y0); place(Lg[1], l.knee, l.ankle, x0, y0); Bt.position.set(x0 + wx(l.ankle[0]), y0 + wy(l.ankle[1]), Bt.position.z); Bt.rotation.z = -l.pitch; }
    const lean = Math.atan2(J.neckBase[0] - J.pelvis[0], -(J.neckBase[1] - J.pelvis[1]));
    P.coat.position.set(x0 + wx(J.pelvis[0]), y0 + wy(J.pelvis[1]), P.coat.position.z); P.coat.rotation.z = -lean;
    const hb = o.hemB || [0, 0]; P.hem.position.set(x0 + wx(J.pelvis[0]), y0 + wy(J.pelvis[1]) - 2 * K, P.hem.position.z); P.hem.rotation.z = -lean + clamp(-hb[0] * .006, -.5, .1);
    P.head.position.set(x0 + wx(J.neckTop[0]), y0 + wy(J.neckTop[1]), P.head.position.z); P.head.rotation.z = -J.headA;
    place(P.armN[0], J.arm.n.sh, J.arm.n.el, x0, y0); place(P.armN[1], J.arm.n.el, J.arm.n.wr, x0, y0);
  }
  return { P, set };
}

// ——— paper motifs (metric, y up) ———
const R = mulberry(1818), WORDS = ['24H', 'CAFE', 'BAKERY', 'BAR', 'BOOKS', 'PHARMACY', 'NOODLES', 'LAUNDRY', 'RECORDS', 'HOTEL', 'FLOWERS'];
const ST_X0 = wx(-3200), ST_X1 = wx(11800);                     // the street strip covers the whole run
const SHOPS = []; { let x = ST_X0, i = 0; while (x < ST_X1) { const w = .055 + R() * .025; SHOPS.push({ x0: x, x1: x + w, top: .052 + R() * .02, word: WORDS[i % WORDS.length], lit: R() < .85, up: R() < .6 }); x += w + .002; i++; } }
{ const sx = wx(SPL.x), j = SHOPS.findIndex(s => s.x0 <= sx - .01 && s.x1 > sx - .01); if (j >= 0) { const W2 = SHOPS.map(s => s.word); SHOPS.forEach((s, i) => { s.word = i === j ? '24H' : i === j + 1 ? 'CAFE' : s.word; }); } }
function streetSheets(S, U) {   // far skyline, the shop row (cut windows and letters burn), the pavement band, posts
  const W_ = ST_X1 - ST_X0, cx = (ST_X0 + ST_X1) / 2;
  const far = sheet({ U, w: W_, h: .16, x: cx, y: .07, z: -.115, trans: .85, ppm: 1600, finish: { rim: .3, under: .2 },
    draw: x => { x.fillStyle = L.far; const r = mulberry(5); for (let xx = -W_ / 2; xx < W_ / 2; xx += .012 + r() * .02) { const w = .01 + r() * .018, h = .03 + r() * .05; x.fillRect(xx, -.08, w, h + .02 + .03); } } });
  S.add(far);
  const shop = sheet({ U, w: W_, h: .12, x: cx, y: .03, z: -.07, trans: .3, ppm: 4200, finish: { rim: .35, under: .3 },
    draw: x => { x.fillStyle = L.shop; for (const s of SHOPS) { const a = s.x0 - cx, b = s.x1 - cx; x.fillRect(a, -.06, b - a, s.top + .03); x.beginPath(); x.moveTo(a - .002, s.top - .03); x.lineTo((a + b) / 2, s.top - .03 + .012); x.lineTo(b + .002, s.top - .03); x.fill(); }
      // windows, sign letters, upper windows: thin warm paper the light burns through (the emissive map below), the door a dark cut
      for (const s of SHOPS) { const a = s.x0 - cx, b = s.x1 - cx, w = b - a; x.fillStyle = s.lit ? LIT : '#34467a'; x.fillRect(a + .004, -.028, w * .55, .022); x.fillStyle = L.front; x.fillRect(b - .014, -.03, .008, .024);
        if (s.up) for (let k = 0; k < 2; k++) { x.fillStyle = hash(a * 1e3 + k) < .7 ? LIT : '#34467a'; x.fillRect(a + .006 + k * w * .45, s.top - .03 - .022, .007, .01); }
        text(x, s.word, (a + b) / 2, -.0015, .0072, 'Cormorant', { weight: 600, fill: LIT }); }
      for (const s of SHOPS) { const a = s.x0 - cx, b = s.x1 - cx; x.fillStyle = L.front; x.fillRect(a + .002, -.0062, b - a - .004, .0016); } },
    glowDraw: x => { x.fillStyle = '#000'; x.fillRect(-W_ / 2, -.06, W_, .12); x.fillStyle = '#fff';
      for (const s of SHOPS) { const a = s.x0 - cx, b = s.x1 - cx, w = b - a; if (s.lit) x.fillRect(a + .004, -.028, w * .55, .022); if (s.up) for (let k = 0; k < 2; k++) if (hash(a * 1e3 + k) < .7) x.fillRect(a + .006 + k * w * .45, s.top - .03 - .022, .007, .01);
        text(x, s.word, (a + b) / 2, -.0015, .0072, 'Cormorant', { weight: 600, fill: '#fff' }); } }, glow: 1.6, glowCol: L.win, glowRes: .6 });
  S.add(shop);
  // the pavement band: her ground line is its top edge; puddles cut through it show warm reflections behind
  const reflDraw = (x, light) => { for (const s of SHOPS) { if (!s.lit) continue; const a = s.x0 - cx, w = (s.x1 - s.x0) * .55; for (let k = 0; k < 9; k++) { const h = .004 + .009 * hash(a * 900 + k), x0 = a + .004 + k * w / 9 + .0006 * hash(k + a), g = x.createLinearGradient(0, .025 - .0012, 0, .025 - .0012 - h);
      g.addColorStop(0, light ? 'rgba(255,255,255,.55)' : 'rgba(150,130,120,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(x0, .025 - .0012 - h, w / 22, h); } } };
  const pave = sheet({ U, w: W_, h: .05, x: cx, y: -.025, z: -.03, trans: .05, ppm: 3000, finish: { rim: .45, under: .2 },
    draw: x => { x.fillStyle = L.front; x.fillRect(-W_ / 2, -.025, W_, .05); reflDraw(x, false); x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
      for (const p of PUD) { x.beginPath(); x.ellipse(p.x - cx, p.y + .025, p.rx, p.ry, 0, 0, TAU); x.fill(); } x.restore(); },   // sheet-local y (the band's centre is at y = −.025)
    glowDraw: x => { x.fillStyle = '#000'; x.fillRect(-W_ / 2, -.025, W_, .05); reflDraw(x, true); }, glow: .55, glowCol: L.win, glowRes: .5 });
  S.add(pave);
  const refl = sheet({ U, w: W_, h: .05, x: cx, y: -.025, z: -.034, trans: .4, ppm: 2400, finish: { rim: 0, under: 0 },
    draw: x => { x.fillStyle = '#1d2a52'; x.fillRect(-W_ / 2, -.025, W_, .05); },
    glowDraw: x => { x.fillStyle = '#000'; x.fillRect(-W_ / 2, -.025, W_, .05); x.fillStyle = '#fff';
      // (the windows' own reflections are on the pavement band; through the puddle only the two signs show, upside down)
      const p = PUD[0], c = p.x - cx; x.save(); x.translate(0, p.y + .025); x.scale(1, -1); text(x, '24H', c - .013, 0, .0048, 'Cormorant', { weight: 600, fill: '#fff' }); text(x, 'CAFE', c + .012, 0, .0048, 'Cormorant', { weight: 600, fill: '#fff' }); x.restore(); }, glow: 1.1, glowCol: L.win, glowRes: .7 });
  S.add(refl);
  return { far, shop, pave, refl };
}
const PUD = [{ x: wx(SPL.x + 30), y: -.0068, rx: .032, ry: .0052 }, { x: wx(3400), y: -.004, rx: .02, ry: .0018 }, { x: wx(6200), y: -.004, rx: .022, ry: .002 }];
function rainSheet(U, w, h, z, seed, dens = 1) {   // thin slanted slits of light, the sheet slides down
  return sheet({ U, w, h, z, trans: 0, shadow: false, recv: false, ppm: 2200, finish: { grain: false, rim: 0, under: 0 },
    draw: x => { x.fillStyle = 'rgba(200,215,255,.0)'; x.fillRect(-w / 2, -h / 2, w, h); x.strokeStyle = 'rgba(190,210,255,.55)'; x.lineWidth = .00025; const r = mulberry(seed);
      for (let i = 0; i < 520 * dens; i++) { const px = (r() - .5) * w, py = (r() - .5) * h, l = .004 + r() * .006; x.beginPath(); x.moveTo(px, py); x.lineTo(px - l * .22, py - l); x.stroke(); } } });
}

// ——— shots ———
const PIPE_POST = (focus, aper = 6, maxCoc = 8) => ({ focus, aper, maxCoc, bloom: { strength: .42, radius: .55, threshold: 1.05 } });
function shotStreet(id) {   // S1 (the puddle, close) and S2 (travelling alongside) share the street box
  const S = stage({ light: [0, .09, -.12], lightR: .26, lightCol: '#ffd9a8', key: 1.6, keyPos: [0, .3, .28], keyTarget: [0, -.02, -.08], amb: .35, ambCol: '#8a9ccc', floor: .32 });
  const { U } = S;
  const sky = skyPanel({ w: .9, h: .5, z: -.14, stops: [[0, L.sky1], [1, L.sky0]], gain: 1.1 }); S.add(sky);
  const st = streetSheets(S, U);
  const aki = buildAki(S, U, -.045);
  const rain = [rainSheet(U, .5, .5, -.05, 3), rainSheet(U, .5, .5, -.012, 7, .6)]; rain.forEach(r => S.add(r));
  const posts = []; for (let i = 0; i < 9; i++) { const px = wx(-1800 + i * 1500); const m = sheet({ U, w: .006, h: .2, x: px, y: .02, z: -.008, trans: .02, finish: { rim: .3, under: .2 }, draw: x => { x.fillStyle = '#05070f'; x.fillRect(-.0015, -.1, .003, .2); x.fillRect(-.0015, .055, .004, .004); } }); S.add(m); posts.push(m); }
  // the splash: paper droplets on sticks and two ring cut-outs that scale up from nothing
  const drops = []; for (let j = 0; j < 12; j++) { const m = sheet({ U, w: .002, h: .002, z: -.0435, trans: .9, shadow: false, recv: false, draw: x => { x.fillStyle = '#cfe0ff'; x.beginPath(); x.arc(0, 0, .0006 + .0003 * hash(j), 0, TAU); x.fill(); }, glowDraw: x => { x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, .0005, 0, TAU); x.fill(); }, glow: .5, glowCol: '#cfe0ff' }); m.visible = false; S.add(m); drops.push(m); }
  const rings = [0, 1].map(k => { const m = sheet({ U, w: .02, h: .006, z: -.042 + k * .0002, trans: .6, shadow: false, recv: false, draw: x => { x.strokeStyle = '#cfe0ff'; x.lineWidth = .0004; x.beginPath(); x.ellipse(0, 0, .0095, .0025, 0, 0, TAU); x.stroke(); }, glowDraw: x => { x.strokeStyle = '#fff'; x.lineWidth = .0003; x.beginPath(); x.ellipse(0, 0, .0095, .0025, 0, 0, TAU); x.stroke(); }, glow: .6, glowCol: '#cfe0ff' }); m.visible = false; S.add(m); return m; });
  return {
    S,
    update(t) {
      const S1 = id === 'S1', tq = t;   // on ones (style rule)
      const Sx = poseAt(tq), J = solveProfile(Sx), sc = secondary(q => { const p = RUN.pelvisAt(q); return [p[0], p[1] - 250]; }, 0, tq);
      const vis = !S1 || (tq > .3 && tq < 1.9); for (const k in aki.P) for (const m of [].concat(aki.P[k])) m.visible = vis;
      aki.set(J, 0, 0, { hemB: sc.hemB });
      for (const [i, r] of rain.entries()) { r.position.y = .25 - ((t * (i ? .34 : .22)) % .25) - .125 + .05; }
      let cam;
      if (S1) { const cx = wx(SPL.x) + .006 + .0012 * t; cam = [cx, .012, -.045 + .1, cx, .009, -.06]; }
      else { const cx = wx(XR(t)) + .024; cam = [cx, .03, -.045 + .27, cx, .028, -.07]; }
      sky.position.x = cam[0]; rain.forEach(r => { r.position.x = cam[0]; });
      aim(S.cam, cam, t, { hand: .0004 });
      // splashes
      drops.forEach(d => { d.visible = false; }); rings.forEach(r => { r.visible = false; });
      const hero = S1 ? SPL : RUN.contacts.filter(c => c !== SPL && t - c.t0 >= 0 && t - c.t0 < .35).pop();
      if (hero) { const u = t - hero.t0; if (u >= 0 && u < (S1 ? .7 : .35)) { const p0 = [wx(hero.x + 24), 0];
        drops.forEach((d, j) => { const a = Math.PI * (.15 + .7 * hash(j * 7.1 + hero.t0)), sp = (S1 ? .055 : .03) * (.5 + .6 * hash(j * 3.3)), sg = hash(j + hero.t0) < .5 ? -1 : 1, x = p0[0] + Math.cos(a) * sp * u * sg, y = Math.sin(a) * sp * u * 1.4 - .16 * u * u; if (y < -.0005) return; d.visible = true; d.position.set(x, y + .0006, d.position.z); });
        rings.forEach((r, k) => { const v = u - k * .14; if (v <= 0) return; r.visible = true; r.position.set(p0[0], .0003, r.position.z); r.scale.set(.2 + (S1 ? 2.6 : 1.2) * v, .2 + (S1 ? 2.6 : 1.2) * v, 1); }); } }
      // the watch glows a little brighter when she looks at it
      const wl = aki.P.armN[1].material.userData; aki.P.armN[1].material.emissiveIntensity = 1.4 + 1.4 * clamp(Sx.watch || 0);
    },
    post() { return id === 'S1' ? { ...PIPE_POST(.1, 5, 7), bloom: { strength: .3, radius: .5, threshold: 1.15 } } : PIPE_POST(.27, 7, 8); },
    grade() { return { vig: .38, expo: id === 'S1' ? .82 : 1.05 }; },
  };
}
function shotWatch() {   // S3: her forearm across the box, the watch face lit from behind, hands on pins
  const S = stage({ light: [.02, .02, -.1], lightR: .14, lightCol: '#ffe0b0', key: 1.4, keyPos: [0, .2, .25], keyTarget: [0, 0, -.05], amb: .3, ambCol: '#8a9ccc', floor: .3 });
  const { U } = S;
  S.add(skyPanel({ w: .5, h: .3, z: -.12, stops: [[0, L.sky1], [1, L.sky0]], gain: 1 }));
  // the street lights streaking past: long cut slits of light on a dark strip that slides fast
  const streak = sheet({ U, w: .9, h: .16, z: -.08, trans: .25, ppm: 2000, shadow: false, finish: { rim: 0, under: 0 },
    draw: x => { x.fillStyle = L.mid; x.fillRect(-.45, -.08, .9, .16); x.fillStyle = LIT; const r = mulberry(9); for (let i = 0; i < 26; i++) x.fillRect((r() - .5) * .9, (r() - .5) * .14, .02 + r() * .08, .0012 + r() * .002); },
    glowDraw: x => { x.fillStyle = '#000'; x.fillRect(-.45, -.08, .9, .16); x.fillStyle = '#fff'; const r = mulberry(9); for (let i = 0; i < 26; i++) x.fillRect((r() - .5) * .9, (r() - .5) * .14, .02 + r() * .08, .0012 + r() * .002); }, glow: 1.4, glowCol: L.win });
  S.add(streak);
  const arm = new THREE.Group(); S.add(arm);
  const add = m => { arm.add(m); return m; };
  add(sheet({ U, w: .12, h: .04, x: -.05, y: -.006, z: -.03, trans: .3, finish: { rim: .35, under: .3 }, draw: x => { x.fillStyle = L.coat; x.beginPath(); x.moveTo(-.06, -.02); x.lineTo(.045, -.008); x.lineTo(.05, .012); x.lineTo(-.06, .016); x.fill(); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(-.03, -.002, .05, .0012); } }));
  add(sheet({ U, w: .01, h: .03, x: .0, y: .0, z: -.0298, trans: .3, finish: { rim: .3, under: .3 }, draw: x => { x.fillStyle = '#e8dcc0'; x.fillRect(-.004, -.012, .008, .024); x.fillStyle = 'rgba(0,0,0,.15)'; for (let k = 0; k < 4; k++) x.fillRect(-.003 + k * .002, -.012, .0004, .024); } }));
  add(sheet({ U, w: .05, h: .04, x: .035, y: .002, z: -.0302, trans: .06, finish: { rim: .3, under: .3 }, draw: x => { x.fillStyle = L.fig; x.beginPath(); x.ellipse(.004, 0, .018, .014, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(-.004, .012, .012, .005, -.15, 0, TAU); x.fill(); } }));
  // the watch: a gold paper ring, a dark dial with the numerals and ticks cut through (they burn), hands as strips on a pin
  const wc = [.008, .002, -.026];
  add(sheet({ U, w: .014, h: .07, x: wc[0], y: wc[1], z: -.0292, trans: .05, draw: x => { x.fillStyle = '#2b1d14'; x.fillRect(-.006, -.035, .012, .07); } }));
  add(sheet({ U, w: .036, h: .036, x: wc[0], y: wc[1], z: -.028, trans: .2, finish: { rim: .5, under: .3 }, draw: x => { x.fillStyle = L.gold; x.beginPath(); x.arc(0, 0, .0165, 0, TAU); x.fill(); x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; x.beginPath(); x.arc(0, 0, .0135, 0, TAU); x.fill(); x.restore(); } }));
  const dialDraw = (x, light) => { x.fillStyle = light ? '#fff' : '#f2e4c6'; x.beginPath(); x.arc(0, 0, .0138, 0, TAU); x.fill(); x.fillStyle = light ? '#000' : '#1a1a26';
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; x.save(); x.rotate(-a); x.fillRect(-.0003, .0105, .0006, k % 3 ? .0016 : .0026); x.restore(); }
    [['12', 0], ['3', 1], ['6', 2], ['9', 3]].forEach(([n, i]) => { const a = i / 4 * TAU; text(x, n, Math.sin(a) * .0082, Math.cos(a) * .0082, .0032, 'Cormorant', { weight: 600, fill: light ? '#000' : '#1a1a26' }); }); };
  add(sheet({ U, w: .03, h: .03, x: wc[0], y: wc[1], z: -.0284, trans: .28, draw: x => dialDraw(x, false), glowDraw: x => { x.fillStyle = '#000'; x.fillRect(-.015, -.015, .03, .03); dialDraw(x, true); }, glow: .3, glowCol: '#ffe6b8', glowRes: 1.2 }));
  const hand = (len, w, col, z, tail = 0) => add(sheet({ U, w: w + .001, h: len + tail + .001, ax: 0, ay: -(len - tail) / 2, x: wc[0], y: wc[1] + (len - tail) / 2, z, trans: .05, finish: { rim: .3, under: .2 }, draw: x => { x.fillStyle = col; x.fillRect(-w / 2, -(len + tail) / 2, w, len + tail); } }));
  const hH = hand(.0066, .0019, '#0b0d18', -.0274), hM = hand(.0098, .0013, '#0b0d18', -.0272), hS = hand(.0108, .0006, L.coat, -.027, .0022);
  const pin = add(sheet({ U, w: .002, h: .002, x: wc[0], y: wc[1], z: -.0268, trans: .05, draw: x => { x.fillStyle = '#0b0d18'; x.beginPath(); x.arc(0, 0, .0008, 0, TAU); x.fill(); } }));
  const drops = [[-.006, .005, .0011], [.004, -.006, .0008], [.007, .006, .0006]].map(([u, v, r]) => add(sheet({ U, w: r * 3, h: r * 3, x: wc[0] + u, y: wc[1] + v, z: -.0266, trans: .9, shadow: false, recv: false, draw: x => { x.strokeStyle = '#cfe0ff'; x.lineWidth = r * .35; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.stroke(); }, glowDraw: x => { x.fillStyle = '#fff'; x.beginPath(); x.arc(-r * .3, r * .3, r * .3, 0, TAU); x.fill(); }, glow: .8, glowCol: '#ffffff' })));
  const rain = rainSheet(U, .2, .2, -.02, 11, .8); S.add(rain);
  return {
    S,
    update(t) {
      const sec = 41 + Math.floor(t - EV.watchHit), mm = 58 + sec / 60;
      hH.rotation.z = -(11 + mm / 60) / 12 * TAU; hM.rotation.z = -mm / 60 * TAU; hS.rotation.z = -sec / 60 * TAU;
      arm.position.y = .0009 * Math.sin((t - FIRST_STEP) * CADENCE * Math.PI); arm.rotation.z = .02 * Math.sin((t - FIRST_STEP) * CADENCE * Math.PI);   // her stride, on ones
      streak.position.x = .3 - ((t * .55) % .6);
      rain.position.y = .1 - ((t * .2) % .1);
      aim(S.cam, [.005, .002, .062, .005, .002, -.03], t, { hand: .0002 });
    },
    post() { return PIPE_POST(.09, 4, 6); },
    grade() { return { vig: .4, expo: 1.05 }; },
  };
}
function shotTower() {   // S4: the sky, clouds and roofs stacked in depth, the clock tower; the chime is a light cue
  const S = stage({ light: [.03, .08, -.12], lightR: .2, lightCol: '#ffd9a8', key: 1.4, keyPos: [0, .32, .3], keyTarget: [0, .04, -.08], amb: .32, ambCol: '#8a9ccc', floor: .3 });
  const { U } = S;
  S.add(skyPanel({ w: .8, h: .6, z: -.14, y: .06, stops: [[0, L.sky1], [1, L.sky0]], gain: 1.1 }));
  const cloud = (cx, cy, z, w, seed) => S.add(sheet({ U, w, h: w * .35, x: cx, y: cy, z, trans: .7, ppm: 2400, finish: { rim: .4, under: .2 }, draw: x => { x.fillStyle = '#7d8fc4'; const r = mulberry(seed); for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse((r() - .5) * w * .6, (r() - .5) * w * .08, w * (.12 + r() * .1), w * (.06 + r() * .05), 0, 0, TAU); x.fill(); } } }));
  cloud(-.06, .16, -.13, .16, 3); cloud(.1, .19, -.125, .2, 5); cloud(.02, .12, -.12, .12, 7);
  const tw = { x: .035, z: -.09 };
  const towerDraw = (x, light) => { if (!light) { x.fillStyle = '#26345e'; x.fillRect(-.011, -.12, .022, .2); x.beginPath(); x.moveTo(-.014, .08); x.lineTo(0, .102); x.lineTo(.014, .08); x.fill(); x.fillStyle = LIT; }
    else { x.fillStyle = '#000'; x.fillRect(-.02, -.14, .04, .28); x.fillStyle = '#fff'; }
    x.beginPath(); x.arc(0, .062, .0085, 0, TAU); x.fill(); for (let k = 0; k < 3; k++) x.fillRect(-.005 + k * .004, .036, .002, .008);
    x.fillStyle = light ? '#000' : '#1a1a26'; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; x.fillRect(Math.sin(a) * .0072 - .0002, .062 + Math.cos(a) * .0072 - .0002, .0004, .0004); } };
  const tower = S.add(sheet({ U, w: .04, h: .28, x: tw.x, y: 0, z: tw.z, trans: .15, finish: { rim: .4, under: .3 }, draw: x => towerDraw(x, false), glowDraw: x => towerDraw(x, true), glow: 1.5, glowCol: L.win, glowRes: 1 }));
  const hand = (len, w, rot) => { const m = S.add(sheet({ U, w: w + .0006, h: len + .0006, ax: 0, ay: -len / 2, x: tw.x, y: .062, z: tw.z + .0006, trans: .05, draw: x => { x.fillStyle = '#0b0d18'; x.fillRect(-w / 2, -len / 2, w, len); } })); m.rotation.z = rot; return m; };
  hand(.0048, .0011, -(11 + 58 / 60) / 12 * TAU); hand(.0072, .0008, -58 / 60 * TAU);
  // roofs stacked in depth, windows burning; they light up a little more, one by one, on the chime
  const rows = []; for (const [z, y, col, tr, sd] of [[-.11, -.03, L.far, .8, 11], [-.075, -.05, L.mid, .4, 13], [-.04, -.07, L.front, .08, 17]]) {
    const r = mulberry(sd), blocks = []; for (let x = -.2; x < .2; x += .018 + r() * .02) blocks.push([x, .02 + r() * .05]);
    const m = S.add(sheet({ U, w: .42, h: .14, y, z, trans: tr, ppm: 3200, finish: { rim: .4, under: .25 }, draw: x => { x.fillStyle = col; for (const [bx, h] of blocks) { x.fillRect(bx, -.07, .02, h + .02); } x.fillStyle = LIT; for (const [bx, h] of blocks) for (let yy = -.04; yy < h - .055; yy += .008) if (hash(bx * 1e3 + yy * 1e4) < .5) x.fillRect(bx + .005, yy, .003, .004); },
      glowDraw: x => { x.fillStyle = '#000'; x.fillRect(-.21, -.07, .42, .14); x.fillStyle = '#fff'; for (const [bx, h] of blocks) for (let yy = -.04; yy < h - .055; yy += .008) if (hash(bx * 1e3 + yy * 1e4) < .5) x.fillRect(bx + .005, yy, .003, .004); }, glow: 1.1, glowCol: L.win, glowRes: .8 }));
    rows.push(m); }
  const rain = rainSheet(U, .5, .5, -.03, 13, .9); S.add(rain);
  return {
    S,
    update(t) {
      const u = t - EV.chime, f = u > 0 ? Math.exp(-u / .5) : 0;
      tower.material.emissiveIntensity = 1.5 + 2.6 * f;
      rows.forEach((m, i) => { m.material.emissiveIntensity = 1.1 + .9 * clamp((u - i * .08) / .12) * Math.exp(-Math.max(0, u - i * .08) / .7); });
      rain.position.y = .25 - ((t * .3) % .25) - .1;
      const k = eio(seg(t, 9.4, 10.4)); aim(S.cam, [.02, .07 - .02 * k, .33, .025, .06 - .025 * k, -.09], t, { hand: .0004 });
    },
    post() { return PIPE_POST(.42, 5, 7); },
    grade() { return { vig: .38, expo: 1.05 }; },
  };
}

// ——— the timeline: cuts at the reference times (the style's demo cuts as well as dissolves) ———
const BUILD = { S1: () => shotStreet('S1'), S2: () => shotStreet('S2'), S3: shotWatch, S4: shotTower };
const live = new Map();
function get(id) { if (!live.has(id)) live.set(id, BUILD[id]()); return live.get(id); }
function gc(keep) { for (const [k, s] of live) if (k !== keep) { dispose(s.S.scene); live.delete(k); } }
window.DUR = DUR;
window.render = t => { const id = shotAt(t)[2], s = get(id); gc(id); s.update(t); pipe.shot(s.S.scene, s.S.cam, s.post(), pipe.rtA); pipe.final({ ...s.grade(), mixB: 0 }); };
window.RIGQA = t => { const id = shotAt(t)[2]; if (id === 'S1') { if (t <= .3 || t >= 1.9) return null; } else if (id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
