// 011 · Isometric Picture Book — the first 10 s of "Last Train Home" as one real place, full bleed, in true isometric
// (lemo-opuscar styles/isometric-picture-book): flat three-tone solids, no outlines/shadows/textures, people as slim
// billboards seen from behind with no faces and no hands, ONE accent colour reserved for the rule (here: AKI, the arrow
// ahead of her, the "58" and the spot that matters), type lying on the floor, a camera that only translates and zooms,
// 30 fps on ones. Page contract: window.render(t), DUR, READY, RIGQA, TEXTS.
import { iso, C, TOPS, LEGS, tri, mix, hex, css, onPlane, fillPoly, rect, phraseLayout, floorType, phraseBox, font, W, H, TAU, clamp, lerp, seg, ss, eo, eio, hash } from './kit.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { back } from './shared/lib/util.js';

const cv = document.getElementById('c'), g = cv.getContext('2d');
await Promise.all(['500 40px Newsreader', '600 40px Newsreader', '700 40px Newsreader'].map(f => document.fonts.load(f)));
iso.g = g;

// ——— the run: the shared rig at a picture-book pace (2.9 m/s: nobody faster than ~3 m/s on screen), toward −y (up-right) ———
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1000, v: 1055, cadence: CADENCE, duty: .42, lean: .14 });
const U2M = 1.65 / 600, SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02), XS = SPL.x;
const Yof = rx => -(rx - XS) * U2M;                               // rig x → world y (the splash lands at y = 0)
const AK = { top: C.accent, legs: '#3B3F4A', hair: '#4A2A4C', skin: C.skin, gold: '#D8B25C' };
function poseAt(t, raise = false) {
  const S = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  let w = clamp(up, 0, 1.1) * (1 - dn); if (raise) w = 1; S.watch = w;
  if (w > 0) { const J0 = solveProfile(S), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S.arms.f.sh *= 1 - .45 * wm; S.head += .26 * wm; }
  return S;
}
const W3 = (p, x) => [x, Yof(p[0]), -p[1] * U2M];                 // rig point → world (x = side offset; she faces −y, her left side is +x)

// AKI as a picture-book figure: legs and arms placed in 3D from the rig joints and projected (so a planted foot stays put),
// a back-view coat in the accent, the plum bob, no face, no hands; a gold disc on the left wrist
function drawAki(t, raise = false) {
  const S = poseAt(t, raise), J = solveProfile(S), sc = secondary(q => { const p = RUN.pelvisAt(q); return [p[0], p[1] - 250]; }, 0, t);
  const P = p => iso.P(...p), pv = W3(J.pelvis, 0);
  iso.bill(pv[0], pv[1], 0, () => {
    g.setTransform(1, 0, 0, 1, 0, 0);
    const k = iso.cam.k, T = tri(AK.top, .18, .26), Ld = hex(mix(AK.legs, '#15171A', .25));
    const limb = (a, b, w0, w1, col) => { const A = P(a), B = P(b), dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      g.beginPath(); g.moveTo(A[0] + nx * w0 * k, A[1] + ny * w0 * k); g.lineTo(B[0] + nx * w1 * k, B[1] + ny * w1 * k); g.lineTo(B[0] - nx * w1 * k, B[1] - ny * w1 * k); g.lineTo(A[0] - nx * w0 * k, A[1] - ny * w0 * k); g.closePath(); g.fillStyle = col; g.fill();
      g.beginPath(); g.arc(B[0], B[1], w1 * k, 0, TAU); g.fill(); };
    const leg = (kk, x, col) => { const l = J.leg[kk]; limb(W3(l.hip, x), W3(l.knee, x), .055, .048, col); limb(W3(l.knee, x), W3(l.ankle, x), .048, .036, col);
      const an = P(W3(l.ankle, x)), bl = P(W3(l.ball, x)); g.beginPath(); g.ellipse((an[0] + bl[0]) / 2, (an[1] + bl[1]) / 2 + .01 * k, .07 * k, .028 * k, Math.atan2(bl[1] - an[1], bl[0] - an[0]), 0, TAU); g.fillStyle = '#3A2A22'; g.fill(); };
    const arm = (kk, x, col) => { const a = J.arm[kk]; limb(W3(a.sh, x), W3(a.el, x), .045, .04, col); limb(W3(a.el, x), W3(a.wr, x), .04, .036, col); return P(W3(a.wr, x)); };
    arm('f', -.17, T[2]);
    leg('f', -.07, Ld); leg('n', .07, AK.legs);
    // coat, back view: shoulders → hips → flared hem trailing with the run
    const nb = J.neckBase, hb = sc.hemB, hip = J.pelvis;
    const sL = P(W3([nb[0] - 6, nb[1] + 14], -.2)), sR = P(W3([nb[0] - 6, nb[1] + 14], .2)), hL = P(W3([hip[0] + hb[0] * .5, hip[1] + 60 + hb[1] * .3], -.23)), hR = P(W3([hip[0] + hb[0] * .5, hip[1] + 60 + hb[1] * .3], .23));
    g.beginPath(); g.moveTo(...sL); g.lineTo(...sR); g.lineTo(...hR); g.lineTo(...hL); g.closePath(); g.fillStyle = T[1]; g.fill();
    const mS = [(sL[0] * .35 + sR[0] * .65), (sL[1] * .35 + sR[1] * .65)], mH = [(hL[0] * .35 + hR[0] * .65), (hL[1] * .35 + hR[1] * .65)];
    g.beginPath(); g.moveTo(...mS); g.lineTo(...sR); g.lineTo(...hR); g.lineTo(...mH); g.closePath(); g.fillStyle = T[2]; g.fill();
    const bl = P(W3([J.waist[0], J.waist[1] + 10], -.21)), br = P(W3([J.waist[0], J.waist[1] + 10], .21)); g.strokeStyle = hex(mix(AK.top, '#5B4434', .35)); g.lineWidth = .025 * k; g.beginPath(); g.moveTo(...bl); g.lineTo(...br); g.stroke();
    // head: the plum bob from behind, a sliver of skin at the ear, a cream collar
    const hc = P(W3(J.headC, 0)), r = .075 * k;
    const nk = P(W3(J.neckBase, 0)); g.fillStyle = '#E9DCC4'; g.beginPath(); g.ellipse(nk[0], nk[1] - .015 * k, .07 * k, .03 * k, 0, 0, TAU); g.fill();
    g.fillStyle = AK.hair; g.beginPath(); g.roundRect(hc[0] - r * 1.05, hc[1] - r * .6, r * 2.1, r * 2.0, r * .7); g.fill();
    g.beginPath(); g.arc(hc[0], hc[1] - r * .1, r * 1.05, 0, TAU); g.fill();
    g.fillStyle = AK.skin; g.beginPath(); g.ellipse(hc[0] + r * .82, hc[1] + r * .2, r * .18, r * .3, 0, 0, TAU); g.fill();
    const wr = arm('n', .17, T[1]);
    if ((S.watch || 0) > .2) { g.fillStyle = AK.gold; g.beginPath(); g.ellipse(wr[0], wr[1], .022 * k, .018 * k, 0, 0, TAU); g.fill(); }
  }, { r: 3 });
  return { J, S, nearWr: W3(J.arm.n.wr, .17) };
}

// ——— the place ———
const PUD = [0.05, 0];                                         // the puddle where the boot lands (world x, y)
const SHOPS = []; { let y = 9, i = 0; const words = ['24H', 'CAFE', 'BAKERY', 'BAR', 'BOOKS', 'PHARMACY', 'NOODLES', 'LAUNDRY', 'RECORDS', 'HOTEL', 'FLOWERS'];
  while (y > -34) { const w = 5 + hash(i * 1.7) * 1.6, h = 3.6 + hash(i * 2.3) * 2.6; SHOPS.push({ y0: y - w, y1: y, h, i, word: words[i % words.length], col: ['#C9B79A', '#B8B3A2', '#CFBFA6', '#BCAE98'][i % 4] }); y -= w + .2; i++; } }
// waiting people (four muted tops), standing still: the rule says they wait; one walker on the far pavement
const PEOPLE = [[-1.9, -35.2], [-1.2, -35.9], [-.5, -36.6], [.2, -37.3], [-2.2, -11.8], [-2.4, -12.6]].map(([x, y], i) => ({ x, y, p: { h: 1.62 + hash(i) * .16, top: TOPS[i % 4], legs: LEGS[i % 4], hairLong: i % 3 === 1 } }));
function drawPersonBack(gg, p, phase, walking) {   // a slim back-view figure (kit grammar): no face, no hands
  const h = p.h, sw = walking ? Math.sin(phase) : 0, B = tri(p.top, .18, .26), Lg = p.legs, Ld = hex(mix(Lg, '#15171A', .25));
  const leg = (hx, fx, col) => { gg.beginPath(); gg.moveTo(hx - .034 * h, -.49 * h); gg.lineTo(hx + .034 * h, -.49 * h); gg.lineTo(fx + .028 * h, -.02 * h); gg.lineTo(fx - .028 * h, -.02 * h); gg.closePath(); gg.fillStyle = col; gg.fill(); gg.beginPath(); gg.ellipse(fx - .008 * h, -.012 * h, .04 * h, .016 * h, 0, 0, TAU); gg.fillStyle = '#232524'; gg.fill(); };
  leg(.04 * h, .045 * h - sw * .1 * h, Ld); leg(-.04 * h, -.045 * h + sw * .1 * h, Lg);
  const arm = (sx, swg, col) => { gg.save(); gg.translate(sx, -.79 * h); gg.rotate(swg); gg.fillStyle = col; gg.beginPath(); gg.roundRect(-.026 * h, 0, .052 * h, .3 * h, .026 * h); gg.fill(); gg.restore(); };
  arm(.125 * h, -sw * .22 + .04, B[2]);
  gg.beginPath(); gg.moveTo(-.105 * h, -.5 * h); gg.lineTo(-.12 * h, -.78 * h); gg.quadraticCurveTo(-.12 * h, -.81 * h, -.09 * h, -.815 * h); gg.lineTo(.09 * h, -.815 * h); gg.quadraticCurveTo(.12 * h, -.81 * h, .12 * h, -.78 * h); gg.lineTo(.105 * h, -.5 * h); gg.closePath(); gg.fillStyle = B[1]; gg.fill();
  gg.beginPath(); gg.moveTo(.03 * h, -.5 * h); gg.lineTo(.03 * h, -.815 * h); gg.lineTo(.09 * h, -.815 * h); gg.quadraticCurveTo(.12 * h, -.81 * h, .12 * h, -.78 * h); gg.lineTo(.105 * h, -.5 * h); gg.closePath(); gg.fillStyle = B[2]; gg.fill();
  arm(-.125 * h, sw * .22 - .04, B[1]);
  gg.fillStyle = hex(mix(C.skin, '#5A3A2A', .15)); gg.fillRect(-.022 * h, -.85 * h, .044 * h, .05 * h);
  if (p.hairLong) { gg.beginPath(); gg.roundRect(-.07 * h, -.9 * h, .14 * h, .17 * h, .05 * h); gg.fillStyle = C.hair; gg.fill(); }
  gg.beginPath(); gg.arc(0, -.885 * h, .066 * h, 0, TAU); gg.fillStyle = C.hair; gg.fill();
  gg.beginPath(); gg.ellipse(-.058 * h, -.872 * h, .012 * h, .02 * h, 0, 0, TAU); gg.fillStyle = C.skin; gg.fill();
}
function ground() {
  const Z = 0, col = (pts, c) => fillPoly(g, pts.map(([x, y]) => iso.P(x, y, Z)), c);
  col(rect(-80, 80, -120, 80), '#E9E1D2');                                    // concrete (outdoor: a touch cooler paper)
  col(rect(2.2, 9, -120, 80), '#DDD5C5');                                    // the road
  col(rect(2.05, 2.25, -120, 80), '#CFC6B4');                                // kerb
  for (let y = 40; y > -110; y -= 6) col(rect(5.45, 5.6, y - 3, y), C.ginger);   // lane markings (ginger)
  for (let k = 0; k < 7; k++) col(rect(2.4, 8.8, -20.6 - k * .7, -20.3 - k * .7), '#F6F0E4');   // zebra crossing toward the station
  for (let y = 40; y > -110; y -= 1.5) col(rect(-3, 2.05, y - .02, y), '#E1D8C7');   // faint slab joints
  for (let x = -3; x < 2; x += 1.5) col(rect(x - .02, x, -110, 40), '#E1D8C7');
  for (const [px, py, r] of [[PUD[0], PUD[1], .55], [.6, -8.5, .4], [-1.4, -16.2, .5], [1.1, -24, .45]]) {
    const pts = []; for (let a = 0; a < TAU; a += TAU / 28) pts.push(iso.P(px + Math.cos(a) * r * 1.3, py + Math.sin(a) * r, Z)); fillPoly(g, pts, '#CBD3D1'); }
}
function place(t) {
  ground();
  // shops on the far side (x = −3, fronts facing +x), signs and lit windows face the camera side at the iso angle
  for (const s of SHOPS) {
    if (!iso.vis(-5, (s.y0 + s.y1) / 2, 2, 8)) continue;
    iso.box(-7.4, s.y0, 0, 4.4, s.y1 - s.y0, s.h, tri(s.col), {});
    iso.box(-3.15, s.y0 + .5, 2.5, .6, (s.y1 - s.y0) - 1.0, .12, tri(['#3D6B59', '#A7C2B2'][s.i % 2]), {});   // awning (subject hue)
  }
  // lamp posts on the kerb (marking ginger heads)
  for (let y = 6; y > -40; y -= 9) { if (y > -26.5 && y < -17.5) continue;   // no post on the stretch she runs in the watch close-up (the subject must never need a second look)
    iso.box(2.1, y, 0, .1, .1, 3.2, tri('#4B4F4A'), {}); iso.box(2.0, y - .05, 3.2, .3, .2, .18, tri(C.ginger), {}); }
  // the station at the end of the street: façade facing +y, a clock above the entrance
  iso.box(-7, -46, 0, 14, 6, 7, tri('#BFB29C'), {});
  iso.box(-1.6, -40.25, 0, 3.2, .3, 2.6, tri('#5E5A52'), {});                    // entrance (dark opening)
  iso.box(-1, -40.1, 4.4, 2, .3, 2, tri('#E8DCC2'), {});                         // clock block
  for (const p of PEOPLE) iso.bill(p.x, p.y, 0, gg => drawPersonBack(gg, p.p, 0, false), { r: 2 });
  const wk = { h: 1.7, top: TOPS[1], legs: LEGS[1] }, wy = -4 - t * 1.1; iso.bill(-2.3, wy, 0, gg => drawPersonBack(gg, wk, t * 7, true), { r: 2 });
}
function planeDetails(t) {   // markings, windows, signs, the clock face: things painted on planes (drawn after the solids they sit on)
  for (const s of SHOPS) {
    if (!iso.vis(-3, (s.y0 + s.y1) / 2, 2, 8)) continue;
    onPlane(g, -3, s.y1 - .5, 2.2, 'yz', gg => { gg.fillStyle = '#F2D79A'; gg.fillRect(0, 0, (s.y1 - s.y0) - 2.6, 1.9); gg.fillStyle = '#E2BE72'; gg.fillRect(0, 1.3, (s.y1 - s.y0) - 2.6, .6); });   // lit shop window
    onPlane(g, -3, s.y0 + 1.6, 2.2, 'yz', gg => { gg.fillStyle = '#6E5A48'; gg.fillRect(0, 0, .9, 2.2); });                                                               // door
    for (let z = 3.6; z < s.h - .6; z += 1.3) for (let y = s.y1 - .7; y > s.y0 + .7; y -= 1.4) onPlane(g, -3, y, z + .9, 'yz', gg => { gg.fillStyle = hash(s.i * 9 + z * 3 + y) < .5 ? '#F2D79A' : '#C8BCA6'; gg.fillRect(0, 0, .8, .9); });
    onPlane(g, -3, s.y1 - .7, 3.25, 'yz', gg => { gg.font = font(600, 1, 'Newsreader'); gg.save(); gg.scale(.5, .5); gg.fillStyle = C.ink; gg.fillText(s.word, 0, 0); gg.restore(); });   // sign on the wall, at the iso angle
  }
  onPlane(g, -1, -40.15, 6.2, 'xz', gg => { gg.fillStyle = '#FAF4E8'; gg.beginPath(); gg.arc(1, .9, .78, 0, TAU); gg.fill(); gg.strokeStyle = C.ink; gg.lineWidth = .06; gg.beginPath(); gg.moveTo(1, .9); gg.lineTo(.9, .4); gg.moveTo(1, .9); gg.lineTo(1.02, .25); gg.stroke(); });
  onPlane(g, -1.9, -40.2, 3.25, 'xz', gg => { gg.font = font(600, 1, 'Newsreader'); gg.save(); gg.scale(.42, .42); gg.fillStyle = C.ink; gg.fillText('LAST TRAIN 23:59', 0, 0); gg.restore(); });
}
// the accent arrow: grows ahead of her during the run and fades behind (the stretch being explained now)
function arrow(t) {
  const a = ss(seg(t, 2.7, 3.4)) * (1 - ss(seg(t, 7.3, 7.5))); if (a <= 0) return;
  const y0 = Yof(RUN.pelvisAt(t)[0]) - .8, len = lerp(1, 7, eo(seg(t, 2.7, 4.2))), x0 = .5;
  const pts = [[x0 - .12, y0], [x0 + .12, y0], [x0 + .12, y0 - len], [x0 + .32, y0 - len], [x0, y0 - len - .55], [x0 - .32, y0 - len], [x0 - .12, y0 - len]];
  g.save(); g.globalAlpha = a * .85; fillPoly(g, pts.map(([x, y]) => iso.P(x, y, 0.001)), C.accent); g.restore();
}
// the floor phrase at the watch beat: "23:58", the 58 in the accent
const PH = { x: 1.8, y: Yof(RUN.pelvisAt(6.4)[0]) - 1.2, z: 0, t0: 5.62, t1: 99, step: .14, scale: 1, lines: [[['23:', 'n'], ['58', 'na']]] };
const PHL = phraseLayout(PH);
function splash(t) {
  for (const c of RUN.contacts) { const u = t - c.t0; if (u < 0 || u > .9) continue; const hero = c === SPL, y = Yof(c.x) - .06, x = .07 * (RUN.contacts.indexOf(c) % 2 ? -1 : 1);
    for (let j = 0; j < (hero ? 3 : 1); j++) { const v = u - j * .18; if (v <= 0 || v > .9) continue; const r = (hero ? .1 : .06) + (hero ? .8 : .4) * eo(v / .9), pts = [];
      for (let a = 0; a < TAU; a += TAU / 32) pts.push(iso.P(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r, .002));
      g.save(); g.globalAlpha = .8 * (1 - v / .9); g.strokeStyle = '#FAF4E8'; g.lineWidth = Math.max(1.5, .025 * iso.cam.k); g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.stroke(); g.restore(); }
    if (u < .45) for (let j = 0; j < (hero ? 9 : 4); j++) { const a = hash(j * 7.3 + c.t0) * TAU, sp = (hero ? 1.6 : 1) * (.5 + hash(j * 3.1 + c.t0) * .6), z = Math.max(0, 1.8 * u - 4.9 * u * u) * (hero ? 1.2 : .7);
      const p = iso.P(x + Math.cos(a) * sp * u, y + Math.sin(a) * sp * u * .6, z); g.fillStyle = '#D7E0DE'; g.beginPath(); g.ellipse(p[0], p[1], .022 * iso.cam.k, .018 * iso.cam.k, 0, 0, TAU); g.fill(); } }
}
function watchDial(t, at) {   // the close-up: her watch, a gold disc with an ink dial, facing the camera side
  const sec = 41 + Math.floor(t - EV.watchHit), mm = 58 + sec / 60;
  onPlane(g, at[0] + .02, at[1] + .02, at[2] + .03, 'yz', gg => {
    gg.fillStyle = '#5A3B2A'; gg.fillRect(-.03, -.055, .06, .11);
    gg.fillStyle = '#D8B25C'; gg.beginPath(); gg.arc(0, 0, .036, 0, TAU); gg.fill(); gg.fillStyle = '#B68D3A'; gg.beginPath(); gg.arc(.008, .008, .036, -.6, 2.2); gg.fill();
    gg.fillStyle = '#FAF4E8'; gg.beginPath(); gg.arc(0, 0, .029, 0, TAU); gg.fill();
    gg.strokeStyle = C.ink; gg.lineCap = 'round';
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; gg.lineWidth = k % 3 ? .0015 : .003; gg.beginPath(); gg.moveTo(Math.sin(a) * .022, -Math.cos(a) * .022); gg.lineTo(Math.sin(a) * .027, -Math.cos(a) * .027); gg.stroke(); }
    const hand = (a, l, w, c) => { gg.strokeStyle = c; gg.lineWidth = w; gg.beginPath(); gg.moveTo(0, 0); gg.lineTo(Math.sin(a) * l, -Math.cos(a) * l); gg.stroke(); };
    hand((11 + mm / 60) / 12 * TAU, .014, .0035, C.ink); hand(mm / 60 * TAU, .021, .0025, C.ink); hand(sec / 60 * TAU, .024, .0012, C.accent);
  });
}

// ——— shots: translation and zoom only, the iso angle never changes ———
function render(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  const [t0, , id] = shotAt(t), lt = t - t0;
  const yR = Yof(RUN.pelvisAt(t)[0]);
  if (id === 'S1') iso.cam = { x: PUD[0] + .4, y: PUD[1] - .2, z: .55, k: lerp(250, 270, eio(lt / 2.5)) };
  else if (id === 'S2') iso.cam = { x: .9, y: yR - 1.4, z: .9, k: 118 };
  else if (id === 'S3') { const S = poseAt(t, true), J = solveProfile(S), w = W3(J.arm.n.wr, .17); iso.cam = { x: w[0] - .12, y: w[1] + .1, z: w[2] - .05, k: 1500 }; }
  else { const u = eio(seg(lt, 0, .625)); iso.cam = { x: lerp(-.5, -.8, u), y: lerp(-34, -37, u), z: lerp(3.5, 2.6, u), k: lerp(58, 64, u) }; }
  place(t);
  const ak = drawAki(t, id === 'S3');
  iso.flush();
  planeDetails(t);
  arrow(t);
  if (id === 'S2' || id === 'S3') floorType(g, t, PH, PHL);
  splash(t);
  if (id === 'S3') watchDial(t, ak.nearWr);
  // S4: the chime — "stand here": an accent outline traces round the station entrance (the spot that matters)
  if (id === 'S4' && t >= EV.chime) { const u = eo(seg(t, EV.chime, EV.chime + .35)), pts = [[-2, -39.9], [2, -39.9], [2, -38.3], [-2, -38.3]].map(([x, y]) => iso.P(x, y, .002));
    g.save(); g.strokeStyle = C.accent; g.lineWidth = 6; g.setLineDash([]); g.beginPath(); const L = [0, 1, 2, 3, 0].map(i => pts[i]); let rem = u * 4; g.moveTo(...L[0]); for (let i = 1; i < 5 && rem > 0; i++) { const f = Math.min(1, rem); g.lineTo(lerp(L[i - 1][0], L[i][0], f), lerp(L[i - 1][1], L[i][1], f)); rem -= 1; } g.stroke(); g.restore(); }
  // S1 → keep the drawn person out of the frame before she enters and after she leaves (no pop: she runs in and out)
}
window.DUR = DUR; window.render = render;
window.TEXTS = t => (t >= PH.t0 && t < 9.375 ? [{ text: '23:58', box: phraseBox(PH, PHL) }] : []);
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
