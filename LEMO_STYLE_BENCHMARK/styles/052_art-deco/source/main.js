// 052 · Art Deco — the first 10 s of "Last Train Home" as a 1930s poster that moves (lemo-opuscar styles/art-deco): warm lacquer
// black, engraved gold keylines, airbrushed hard-edged volumes, one vertical axis per composition, and light that arrives as bulbs
// switching on in counted order. AKI is drawn the deco way (tapered planes, airbrush, a gold rim on the lit side) and carries the
// film's one saturated accent, the burgundy of her jacket; emerald is the cooler jewel of the night.
// S1: the café's stepped arch on the axis, its bulb sign lighting C-A-F-E one letter per drawing of her approach, the last bulb on
// the splash in the mirror of the puddle. S2 opens on two lacquer door leaves; a lateral run through a street in true perspective
// whose bulb signs light as she passes. S3 opens through a stepped arch onto the dial (the number is the plot). S4 match-cuts the
// dial's circle to the station clock high on a tower seen from below; on the chime its ring of bulbs lights in order and a sheen
// crosses the gold; the camera starts down. Figures on twos (15 drawings a second at 30 fps), camera and light on ones.
// Engine: engine/deco.js, type.js, bulbs.js, cam.js copied unchanged. Page contract: window.render(t), DUR, READY, RIGQA.
import { C, TAU, clamp, lerp, seg, ss, eio, eo, back, mix, rgba, goldGrad, gline, toPath, arcPts, rectPts, airbrush, sunburst, stepArchPts, archFrame, chevrons, sparkle, speedLines, glow, ground, vignette, starPts, mulberry, hash } from './engine/deco.js';
import { goldText, decoDigits, clockFace, FONTS } from './engine/type.js';
import { buildSign, drawSign, litSequence } from './engine/bulbs.js';
import { makeCam } from './engine/cam.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';

window.DUR = DUR;
const cv = document.getElementById('c'), g = cv.getContext('2d');
await Promise.all(['40px Limelight', '40px Poiret', '600 40px Josefin', '40px Italiana'].map(f => document.fonts.load(f)));
const W = 1920, H = 1080, AX = 960;

// ═════════ the run (shared by every style)
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const X = t => RUN.pelvisAt(t)[0];
function poseAt(t) {
  const S_ = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  const w = clamp(up, 0, 1.1) * (1 - dn); S_.watch = w;
  if (w > 0) { const J0 = solveProfile(S_), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S_.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S_.arms.f.sh *= 1 - .45 * wm; S_.head += .26 * wm; S_.neck += .08 * wm; }
  return S_;
}
const SIM = (() => {
  const dt = 1 / 240, n = Math.ceil(11 / dt), flap = new Float32Array(n), tail = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  let a = .3, va = 0; const th = [-.2, -.1, 0], vt = [0, 0, 0];
  const py = t => RUN.pelvisAt(t)[1], ay = t => (py(t + dt) - 2 * py(t) + py(t - dt)) / (dt * dt);
  for (let i = 0; i < n; i++) {
    const t = -.5 + i * dt, A = ay(t), wv = clamp((t - EV.watchUp) / .3) * (1 - clamp((t - EV.watchDown) / .3));
    va += (-46 * (a - (.34 + .06 * wv)) - 5.5 * va + .011 * A) * dt; a += va * dt; flap[i] = a;
    for (let k = 0; k < 3; k++) { const par = k ? th[k - 1] : -.1, rest = .16 + .05 * k; vt[k] += (-60 * (th[k] - (par + rest)) - 6 * vt[k] + .014 * A * (k + 1) * .6) * dt; th[k] += vt[k] * dt; tail[k][i] = th[k]; }
  }
  const at = (arr, t) => arr[clamp(Math.round((t + .5) / dt), 0, n - 1)];
  return { flap: t => at(flap, t), tail: t => tail.map(a => at(a, t)) };
})();
const twos = t => Math.floor((t - EV.splash) * 15 + 1e-6) / 15 + EV.splash;

// ═════════ AKI, deco: tapered planes, airbrushed from the upper left, a gold rim on the lit side, no black outline
const cap = (a, b, r0, r1, n = 8) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, o = [];
  for (let i = 0; i <= n; i++) { const t = Math.PI / 2 + i / n * Math.PI; o.push([a[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * r0, a[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * r0]); }
  for (let i = 0; i <= n; i++) { const t = -Math.PI / 2 + i / n * Math.PI; o.push([b[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * r1, b[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * r1]); }
  return o;
};
const LACQ = '#2a2026', BOOT = '#16100e', HAIR = '#140e0b';
// map: rig units → screen through (k, ox, oy, xr): screen = (ox + (rx - xr)·k, oy + ry·k)
function aki(t, k, ox, oy, xr, opt = {}) {
  const S_ = poseAt(t), J = solveProfile(S_), M = p => [ox + (p[0] - xr) * k, oy + p[1] * k], rim = Math.max(1.4, 2.2 * k / .9);
  const fill = (pts, base, o = {}) => airbrush(g, pts, { base, dir: -2.3, rim: o.rim ?? rim, ...o });
  const leg = (kk, base) => { const l = J.leg[kk]; fill(cap(M(l.hip), M(l.knee), 25 * k, 19 * k), base); fill(cap(M(l.knee), M(l.ankle), 19 * k, 13 * k), base);
    const c = Math.cos(l.pitch), s = Math.sin(l.pitch), F = ([u, v]) => M([l.ankle[0] + u * c - v * s, l.ankle[1] + u * s + v * c]);
    fill([F([-15, -34]), F([16, -34]), F([18, -8]), F([48, -1]), F([74, 8]), F([74, 16]), F([-24, 16]), F([-28, 0])], BOOT, { rim: rim * .8 }); };
  const arm = (kk, base) => { const a = J.arm[kk], h = [a.wr[0] + (a.wr[0] - a.el[0]) * .22, a.wr[1] + (a.wr[1] - a.el[1]) * .22];
    fill(cap(M(a.sh), M(a.el), 17 * k, 14 * k), base); fill(cap(M(a.el), M(a.wr), 14 * k, 11 * k), base);
    const hp = cap(M(a.wr), M(h), 9 * k, 4 * k); fill(hp, C.skin, { rim: rim * .7 }); return a; };
  arm('f', C.burgD); leg('f', '#1a1216');
  // ponytail: a tapered black lacquer ribbon with gold strands
  const ta = SIM.tail(t), hc = J.headC, HR = q => { const c = Math.cos(J.headA), s = Math.sin(J.headA); return M([hc[0] + q[0] * c - q[1] * s, hc[1] + q[0] * s + q[1] * c]); };
  let ang = Math.PI - .25 + ta[0] + J.headA, p = HR([-50, -14]); const tp = [p];
  for (let i = 0; i < 3; i++) { const L = [46, 42, 36][i] * k; p = [p[0] + Math.cos(ang) * L, p[1] + Math.sin(ang) * L]; tp.push(p); ang += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
  for (let i = 2; i >= 0; i--) fill(cap(tp[i], tp[i + 1], [15, 12, 9][i] * k, [12, 9, 3][i] * k), HAIR, { rim: rim * .6 });
  gline(g, tp, { w: Math.max(.8, 1.2 * k) });
  // jacket: the accent, burgundy, faceted (a gold hairline at the plane change), the hem swinging
  const TT = (b, u, f) => M([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
  const fa = SIM.flap(t), hb = TT(J.pelvis, -60, -56), hcs = Math.cos(fa + 1.75), hsn = Math.sin(fa + 1.75);
  fill([TT(J.pelvis, -40, -50), TT(J.pelvis, -96, -58), [hb[0] + (hcs * 74 - hsn * 14) * k, hb[1] + (hsn * 74 + hcs * 14) * k], [hb[0] + (hcs * 66 + hsn * 10) * k, hb[1] + (hsn * 66 - hcs * 10) * k]], C.burgD);
  fill(cap(M(J.neckBase), M(J.neckTop), 12 * k, 11 * k), C.skinD, { rim: 0 });
  const torso = [TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)];
  fill(torso, C.burg);
  gline(g, [TT(J.neckBase, -2, 6), TT(J.waist, 0, 6), TT(J.pelvis, -96, 0)], { w: Math.max(.8, 1.4 * k) });
  gline(g, [TT(J.waist, -4, -42), TT(J.waist, -4, 36)], { w: Math.max(.7, 1.1 * k) });
  leg('n', LACQ);
  // head: a streamlined profile in airbrushed skin; lacquer hair with a gold rim; the almond eye and one-stroke brow in gold
  fill([[16, -44], [34, -20], [44, -3], [37, 8], [39, 16], [34, 23], [32, 35], [12, 46], [-10, 48], [-36, 38], [-50, 8], [-46, -26], [-22, -48]].map(HR), C.skin, { rim: rim * .8 });
  fill([[22, -44], [0, -60], [-36, -54], [-58, -22], [-60, 12], [-46, 40], [-22, 44], [-10, 18], [-2, -14], [8, -32]].map(HR), HAIR);
  gline(g, [HR([18, -10]), HR([25, -13]), HR([31, -9])], { w: Math.max(.8, 1.6 * k), color: '#2a1408' });
  gline(g, [HR([14, -20]), HR([32, -19])], { w: Math.max(.6, 1.1 * k) });
  g.fillStyle = C.burgL; g.beginPath(); const lp = HR([33, 26]); g.ellipse(lp[0], lp[1], 3.5 * k, 2.2 * k, J.headA, 0, TAU); g.fill();
  const a = arm('n', C.burg);
  // the gold watch on the near wrist
  const u = .82, wq = M([a.el[0] + (a.wr[0] - a.el[0]) * u, a.el[1] + (a.wr[1] - a.el[1]) * u]), d = Math.atan2(a.wr[1] - a.el[1], a.wr[0] - a.el[0]);
  g.save(); g.translate(...wq); g.rotate(d); g.fillStyle = goldGrad(g, -8 * k, -15 * k, 8 * k, 15 * k, { sheen: .4 }); g.fillRect(-7 * k, -15 * k, 14 * k, 30 * k); g.restore();
  return J;
}

// ═════════ S1 — the café on the axis (0–2.5)
const K1 = 2.2, GY1 = 860;
const SIGN_CAFE = buildSign('CAFE', { size: 230, spacing: 21 });
const CAFE_T = [.12, .38, .65, EV.splash];                           // counted light: the last letter on the splash
function puddlePts() { return arcPts(AX, GY1 + 26, 470, 0, TAU, 80, 74); }
function cafeSet(t, mirror) {
  // the stepped arch of the doorway, its lunette a sunburst of the café's light
  archFrame(g, AX, 700, 760, 640, { rings: 3, gap: 16, steps: 3, fill: '#140f0a', burst: true, sheen: .3 + .4 * ss(seg(t, 1.6, 2.4)) });
  glow(g, AX, 520, 420, '#ffcf7a', mirror ? .1 : .16);
  // side piers: fluted, gold rules, chevron bands
  for (const s of [-1, 1]) { const x = AX + s * 610; airbrush(g, rectPts(x - 70, -40, 140, 760), { base: '#1d1612', dir: -2.3, rim: 2 }); gline(g, [[x - 40, -40], [x - 40, 720]], { w: 1.4 }); gline(g, [[x + 40, -40], [x + 40, 720]], { w: 1.4 }); chevrons(g, x - 66, x + 66, 160, { n: 3, h: 16, rows: 3 }); }
  // the bulb sign over the arch: C, A, F, E light in order
  const s = .78, sw = SIGN_CAFE.w * s;
  drawSign(g, SIGN_CAFE, AX - sw / 2, 20, s, { lit: litSequence(t, CAFE_T, { chaseFrom: 1.6, chaseSpeed: 18 }) });
  goldText(g, '24 H', AX, 600, { size: 54, font: FONTS.serif, track: .3, sheen: .4 });
}
function shotS1(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); ground(g, W, H, { top: C.black, bot: '#120d09' });
  cafeSet(t, false);
  // the floor: lacquer in one-point perspective, its gold seams running to the axis
  g.fillStyle = '#0b0807'; g.fillRect(0, 720, W, 360);
  gline(g, [[0, 720], [W, 720]], { w: 2.2 });
  const VP = [AX, 420];
  for (let i = -9; i <= 9; i++) { const xb = AX + i * 260; const y0 = 720, x0 = VP[0] + (xb - VP[0]) * (y0 - VP[1]) / (1180 - VP[1]); gline(g, [[x0, y0], [xb, 1180]], { w: 1, alpha: .5 }); }
  for (const y of [770, 840, 940, 1060]) gline(g, [[0, y], [W, y]], { w: .9, alpha: .4 });
  // the puddle: a mirror holding the arch and the sign upside down
  const pud = puddlePts(), pp = toPath(pud, true), td = twos(t);
  g.save(); g.fillStyle = '#050403'; g.fill(pp); g.clip(pp);
  const wob = td > EV.splash ? 10 * Math.exp(-(td - EV.splash) * 2.6) * Math.sin((td - EV.splash) * 30) : 0;
  g.save(); g.translate(wob, 913); g.scale(1, -.14); g.globalAlpha = .75; cafeSet(t, true); g.restore();
  for (let r = 0; r < 3; r++) { const a = td - EV.splash - r * .1; if (a > 0 && a < 1.2) gline(g, arcPts(AX, GY1 + 26, 40 + a * 520, 0, TAU, 72, (40 + a * 520) * .16), { w: 1.6, alpha: 1 - a / 1.2, closed: true }); }
  g.restore();
  gline(g, pud, { w: 2, closed: true, sheen: .5 });
  // her reflection, then AKI from the hips down (on twos)
  if (t > .35 && t < 1.95) {
    g.save(); g.clip(pp); g.translate(0, 2 * GY1 + 30); g.scale(1, -.4); g.globalAlpha = .55; aki(td, K1, AX, GY1, SPL.x); g.restore();
    aki(td, K1, AX, GY1, SPL.x);
  }
  // the splash: a gold crown drawn on, four-point sparkles thrown out
  const a = td - EV.splash;
  if (a >= 0 && a < .9) {
    const R = mulberry(7), hh = 190 * Math.sin(Math.min(1, a / .3) * Math.PI / 2) * (1 - ss(seg(a, .4, .9)));
    const crown = []; for (let i = 0; i <= 12; i++) crown.push([AX - 230 + i * 38, GY1 + 20 - (i % 2 ? hh * (.6 + R() * .5) : hh * .25)]);
    if (hh > 8) gline(g, crown, { w: 2.6, glow: .6 });
    for (let i = 0; i < 14; i++) { const vx = (R() - .5) * 1000, vy = -500 - R() * 700, x = AX + vx * a, y = GY1 - 40 + vy * a + 1700 * a * a; if (y < GY1 + 40) sparkle(g, x, y, 10 + R() * 10, { rot: R(), alpha: 1 - a / .9 }); }
  }
  rainLines(t, 0, W, 0, 1080, 26);
  vignette(g, W, H, .5);
  doors(t);
}
function rainLines(t, x0, x1, y0, y1, n, seed = 3) {
  const td = twos(t), R = mulberry(seed);
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < n; i++) { const x = lerp(x0, x1, R()), L = 50 + R() * 70, y = y0 + ((R() * (y1 - y0) + td * 1500) % (y1 - y0)); gline(g, [[x, y], [x - L * .22, y + L]], { w: .9, alpha: .55 }); }
  g.restore();
}
// threshold: two lacquer leaves hinged at the frame's edges close over the shot (2.28–2.5) and open on the next (2.5–2.72)
function doors(t) {
  const c = t < 2.5 ? eio(seg(t, 2.28, 2.5)) : 1 - eio(seg(t, 2.5, 2.72)); if (c <= 0) return;
  for (const s of [-1, 1]) {
    const w = 960 * c, x0 = s < 0 ? 0 : W - w;
    g.save(); g.beginPath(); g.rect(x0, 0, w, H); g.clip();
    airbrush(g, rectPts(x0, 0, w, H), { base: '#181210', dir: s < 0 ? -.4 : -2.7, rim: 0 });
    const ex = s < 0 ? x0 + w : x0;
    gline(g, [[ex, 0], [ex, H]], { w: 3 }); gline(g, [[ex - s * 22, 0], [ex - s * 22, H]], { w: 1.2 });
    sunburst(g, ex, H / 2, { rays: 18, r0: 30, r1: 700, a0: s < 0 ? Math.PI / 2 : -Math.PI / 2, a1: s < 0 ? 1.5 * Math.PI : Math.PI / 2, w: 1.4, alpha: .6 });
    chevrons(g, ex - s * 180 - 60, ex - s * 180 + 60, 120, { n: 3, h: 18, rows: 4 });
    g.restore();
  }
}

// ═════════ S2 — the street in true perspective (2.5–7.5), signs lighting as she passes
const M_ = .0028, X0 = X(2.5);
const wxr = rx => (rx - X0) * M_;                                   // world metres along the street
const ZF = 2.6;
const SHOPS = (() => { const n = ['NOODLES', 'BOOKS', 'BAKERY', 'HOTEL', 'RECORDS', 'FLOWERS', 'BAR'], o = []; let x = -6; for (let i = 0; i < 9; i++) { const w = 4.6; o.push({ x, w, name: n[i % n.length], h: 4.6 + (i % 3) * .25 }); x += w; } return o; })();
SHOPS.forEach(S => S.sign = buildSign(S.name, { size: 150, spacing: 15 }));
const tAt = x => 2.5 + (x / M_) / 1450;                              // when she reaches world x
function shotS2(t) {
  const td = twos(t), xa = wxr(X(t));
  const cam = makeCam({ x: xa + .25, y: .9, z: -5.4, f: 1500, oy: 700 });
  g.setTransform(1, 0, 0, 1, 0, 0);
  // night: warm black above, emerald toward the horizon behind the roofs
  const sky = g.createLinearGradient(0, 0, 0, 640); sky.addColorStop(0, C.black); sky.addColorStop(1, mix(C.emeraldD, C.black, .35)); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // far towers (parallax): setback silhouettes with gold rims and lit windows
  for (let i = -4; i < 14; i++) { const x = i * 9 + 3, z = 60, h = 26 + (i * 7 % 5) * 6; const a = cam.P(x - 3, 0, z), b = cam.P(x + 3, h, z), c = cam.P(x - 2, h + 5, z), d = cam.P(x + 2, h + 5, z);
    airbrush(g, [[a[0], a[1]], [a[0], b[1]], [c[0], b[1]], [c[0], c[1]], [d[0], c[1]], [d[0], b[1]], [b[0], b[1]], [b[0], a[1]]], { base: '#151a1a', rim: 1.2 }); }
  // the floor: lacquer pavement, gold seams in perspective
  const f0 = cam.P(0, 0, ZF); g.fillStyle = '#0b0807'; g.fillRect(0, f0[1], W, H - f0[1]);
  for (let x = Math.floor(xa - 12); x < xa + 12; x += 1) { const a = cam.P(x, 0, ZF), b = cam.P(x, 0, -3.2); gline(g, [[a[0], a[1]], [b[0], b[1]]], { w: .9, alpha: .45 }); }
  for (const z of [1.6, .6, -.6, -2]) { const a = cam.P(xa - 20, 0, z), b = cam.P(xa + 20, 0, z); gline(g, [[a[0], a[1]], [b[0], b[1]]], { w: .8, alpha: .35 }); }
  // shop fronts: airbrushed lacquer blocks with stepped crowns, a stepped arch door, a bulb sign
  for (const S of SHOPS) {
    if (S.x > xa + 9 || S.x + S.w < xa - 9) continue;
    const P = (x, y) => cam.P(S.x + x, y, ZF), k = cam.scaleAt(S.x, 0, ZF);
    const body = [P(0, 0), P(0, S.h), P(.5, S.h), P(.5, S.h + .5), P(1.2, S.h + .5), P(1.2, S.h + .9), P(S.w - 1.2, S.h + .9), P(S.w - 1.2, S.h + .5), P(S.w - .5, S.h + .5), P(S.w - .5, S.h), P(S.w, S.h), P(S.w, 0)].map(p => [p[0], p[1]]);
    airbrush(g, body, { base: S.name === 'HOTEL' ? '#24161c' : '#1e1713', dir: -2.3, rim: 2.2 });
    gline(g, body, { w: 2, closed: true, sheen: .35 });
    const mid = P(S.w / 2, 0);
    const door = archFrame(g, mid[0], mid[1], 1.8 * k, 3.0 * k, { rings: 2, gap: 9, steps: 2, fill: '#2a1a0c', burst: true });
    glow(g, mid[0], mid[1] - 1.2 * k, 1.6 * k, '#ffcf7a', .18);
    for (const s of [-1, 1]) { const w0 = P(S.w / 2 + s * 1.55, 1.0); g.fillStyle = '#c9963c'; g.globalAlpha = .55; g.fillRect(w0[0] - .45 * k, w0[1] - 1.4 * k, .9 * k, 1.4 * k); g.globalAlpha = 1; gline(g, rectPts(w0[0] - .45 * k, w0[1] - 1.4 * k, .9 * k, 1.4 * k), { w: 1.2 }); }
    chevrons(g, P(.6, 0)[0], P(S.w - .6, 0)[0], P(0, S.h - .35)[1], { n: 10, h: 9, rows: 2, gap: 6 });
    // the sign: lights letter by letter as she reaches the shop
    const sc = (S.w - 1) * k / S.sign.w, tl = P(.5, S.h - .55);
    const T0 = tAt(S.x + .5), T = S.sign.letters.map((_, i) => T0 + i * .07);
    drawSign(g, S.sign, tl[0], tl[1] - S.sign.h * sc * .6, sc, { lit: litSequence(t, T, {}) });
  }
  // AKI at z = 0 (on twos): her plane is parallel to the lens, so the rig maps by one scale
  const kA = cam.scaleAt(0, 0, 0) * M_, o = cam.P(wxr(X0) , 0, 0);
  // drawn at the drawing's own time: pose and place together, the planted foot never slides
  aki(td, kA, o[0], o[1], X0);
  // lamp posts in front (z = −1.4), passing; bulb globes
  for (let x = -4; x < 40; x += 7) { if (Math.abs(x - xa) > 8) continue; const a = cam.P(x, 0, -1.4), b = cam.P(x, 4.4, -1.4), k = cam.scaleAt(x, 0, -1.4);
    airbrush(g, [[a[0] - .07 * k, a[1]], [b[0] - .045 * k, b[1]], [b[0] + .045 * k, b[1]], [a[0] + .07 * k, a[1]]], { base: '#2a2018', rim: 2 });
    glow(g, b[0], b[1] - .2 * k, .9 * k, '#ffd98a', .5); g.fillStyle = C.bulb; g.beginPath(); g.arc(b[0], b[1] - .2 * k, .16 * k, 0, TAU); g.fill(); gline(g, arcPts(b[0], b[1] - .2 * k, .2 * k, 0, TAU, 32), { w: 2, closed: true }); }
  rainLines(t, 0, W, 0, 1080, 30, 5);
  vignette(g, W, H, .5);
  doors(t);
  archIn(t);
}

// ═════════ S3 — the dial (7.5–9.375): through a stepped arch that opens from the centre
const CX = AX, CY = 470, CR = 250;
const AH = 11 + 58 / 60;
function dialSet(t) {
  ground(g, W, H, { top: C.black, bot: '#0c0907' });
  sunburst(g, CX, CY, { rays: 48, r0: CR * 1.2, r1: 1500, mode: 'both', colorA: rgba(C.emerald, .22), w: 1.4, alpha: .8, sheen: .4 + .3 * ss(seg(t, 8.3, 9.2)) });
  // her forearm across the axis: the burgundy sleeve from the left, the hand to the right, the watch on the wrist
  const td = twos(t), bob = 8 * Math.sin((td - EV.splash) * TAU * CADENCE / 2);
  g.save(); g.translate(0, bob);
  airbrush(g, [[-40, CY + 120], [CX - 120, CY + 70], [CX - 120, CY + 300], [-40, CY + 380]], { base: C.burg, dir: -2.0, rim: 3 });
  gline(g, [[CX - 150, CY + 60], [CX - 150, CY + 310]], { w: 2.4 });
  airbrush(g, [[CX + 150, CY + 80], [CX + 420, CY + 110], [CX + 520, CY + 190], [CX + 470, CY + 280], [CX + 150, CY + 290]], { base: C.skin, dir: -2.2, rim: 2.4 });
  for (let i = 0; i < 4; i++) gline(g, [[CX + 430 + i * 6, CY + 140 + i * 36], [CX + 500, CY + 150 + i * 34]], { w: 1.2 });
  g.restore();
  // the dial: an octagonal stepped bezel in gold, roman numerals, 23:58; the second hand ticks once a second
  const sec = 47 + (t >= 8.4 ? 1 : 0) + (t >= 9.4 ? 1 : 0);
  clockFace(g, CX, CY, CR, { h: 11, m: 58, s: sec, roman: true, sheen: .3 + .5 * ss(seg(t, 8.3, 9.2)) });
  decoDigits(g, '23:58', CX, 935, 92);
  // rain on the crystal: small sparkles
  for (const [dx, dy, r] of [[-90, 70, 12], [80, -110, 9], [120, 60, 8], [-30, -150, 7]]) sparkle(g, CX + dx, CY + dy, r, { rot: .4 });
  rainLines(t, 0, W, 0, 1080, 22, 9);
  vignette(g, W, H, .55);
}
function archIn(t) {
  const p = eo(seg(t, 7.5, 7.74)); if (t < 7.5 || p <= 0) return;
  const pts = stepArchPts(AX, H + 40, 2400 * p, 1600 * p, { steps: 3, crown: 'round' });
  g.save(); g.clip(toPath(pts, true)); dialSet(t); g.restore();
  gline(g, pts, { w: 3, closed: true, glow: .5 });
}
function shotS3(t) {
  if (t < 7.74) { shotS2(t); return; }
  g.setTransform(1, 0, 0, 1, 0, 0); dialSet(t);
}

// ═════════ S4 — the station clock high on its tower (9.375–10): the same circle, steep perspective from below
function shotS4(t) {
  const dn = 180 * eio(seg(t, 9.45, 10.6));                         // the crane down begins
  g.setTransform(1, 0, 0, 1, 0, -dn);
  const sky = g.createLinearGradient(0, -400, 0, 1400); sky.addColorStop(0, C.black); sky.addColorStop(.7, mix(C.emeraldD, C.black, .3)); sky.addColorStop(1, C.emeraldD); g.fillStyle = sky; g.fillRect(-10, -400, W + 20, 1900);
  sunburst(g, CX, CY, { rays: 64, r0: CR * 1.35, r1: 1900, mode: 'both', colorA: rgba(C.gold1, .06), w: 1.2, alpha: .55 });
  // the tower, converging upward to a vanishing point far above (a Cassandre angle)
  const VP = [CX, -2600], conv = (x, y) => VP[0] + (x - VP[0]) * (y - VP[1]) / (1500 - VP[1]);
  const tw = [[conv(CX - 380, 1500), 1500], [conv(CX - 380, 180), 180], [conv(CX - 300, 180), 180], [conv(CX - 300, -60), -60], [conv(CX - 200, -60), -60], [conv(CX - 200, -200), -200], [CX, -360], [conv(CX + 200, -200), -200], [conv(CX + 200, -60), -60], [conv(CX + 300, -60), -60], [conv(CX + 300, 180), 180], [conv(CX + 380, 180), 180], [conv(CX + 380, 1500), 1500]];
  airbrush(g, tw, { base: '#1d1712', dir: -2.3, rim: 3 });
  gline(g, tw, { w: 2.4, closed: true });
  for (const x of [-300, -200, 200, 300]) gline(g, [[conv(CX + x, 1500), 1500], [conv(CX + x, 760), 760]], { w: 1.6 });
  for (const y of [760, 980, 1200]) gline(g, [[conv(CX - 380, y), y], [conv(CX + 380, y), y]], { w: 1.4 });
  chevrons(g, conv(CX - 360, 820), conv(CX + 360, 820), 820, { n: 12, h: 14, rows: 3 });
  // city tops below, the same block printed in gold rims
  for (let i = 0; i < 10; i++) { const x = 60 + i * 190; if (Math.abs(x - CX) < 480) continue; const h = 260 + (i * 37 % 4) * 70; airbrush(g, [[x, 1500], [x, 1080 - h], [x + 60, 1080 - h - 50], [x + 120, 1080 - h], [x + 120, 1500]], { base: '#141616', rim: 1.6 });
    for (let r = 0; r < 4; r++) { g.fillStyle = (i + r) % 3 ? '#c9963c' : '#3a2a18'; g.fillRect(x + 30, 1100 - h + r * 70, 18, 30); g.fillRect(x + 72, 1100 - h + r * 70, 18, 30); } }
  // the clock: the same circle as the watch; on the chime a ring of bulbs lights in order and a sheen crosses the gold
  const ch = t - EV.chime;
  clockFace(g, CX, CY, CR, { h: 11, m: 58, roman: true, lit: ch > 0 ? Math.min(1, ch / .2) : 0, sheen: ch > 0 ? -.2 + ch * 3 : .3 });
  const n = 28;
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i / n * TAU, x = CX + Math.cos(a) * CR * 1.32, y = CY + Math.sin(a) * CR * 1.32, t0 = EV.chime + i * .011;
    const v = t < t0 ? 0 : (t - t0 < .18 ? 1 + .6 * (1 - (t - t0) / .18) : 1);
    if (v > 0) glow(g, x, y, 34 * v, '#ffcf7a', .5 * Math.min(1, v));
    g.fillStyle = v > 0 ? C.bulbCore : '#2a1d0c'; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); g.strokeStyle = v > 0 ? C.gold2 : '#7a5e2a'; g.lineWidth = 2; g.stroke(); }
  rainLines(t, 0, W, -200, 1300, 26, 11);
  g.setTransform(1, 0, 0, 1, 0, 0); vignette(g, W, H, .5);
}

window.render = t => {
  if (t < 2.5) shotS1(t);
  else if (t < 7.5) shotS2(t);
  else if (t < 9.375) shotS3(t);
  else shotS4(t);
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(twos(t))); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0);
window.READY = true;
