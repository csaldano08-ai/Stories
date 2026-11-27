// 046 · Silkscreen Travel Poster — the first 10 s of "Last Train Home" as a full-bleed screen print being pulled on camera
// (lemo-opuscar styles/silkscreen-poster). Opaque, hard-edged flat inks, one pull per beat, stepped bands instead of
// gradients, 1–3 px registration slips leaving slivers of paper, an ink-thickness rim on every fill, paper as a colour.
// Night palette, six inks: sky1, sky2 (bands), far, mid, near (also the info band) and ONE accent, vermilion, which is
// AKI's coat (and the station clock's rings at the end). Lit windows, the puddle and the splash are bare paper.
//   S1 0–2.5    the camera trucks with the squeegee: sky bands, far roofs, the café front (windows and the CAFE letters
//               knocked out to paper), the pavement with the puddle left as paper; AKI printed in near ink + accent, on
//               twos; the boot lands at 0.9375 s: the splash is pulled in paper-colour ink, one hit.
//   S2 2.5–7.5  a street walk through loose planes (far 0.4, shops 1.0, lamp posts 1.45) with paper gaps and thickness
//               shadows; each shop sign is pulled as it passes; the planes slip out of register as she runs …
//   S3 7.5–9.4  … and SNAP into register on the 7.5 hit; push to the info band: the watch dial, 23:58, and the run's own
//               numbers (4 m/s, 2.9 steps/s) printed left to right, one per beat; the second hand steps at 8.4 and 9.4.
//   S4 9.4–10   pull back to the whole print: the header printed into the sky, the station clock; on the chime (9.575)
//               the accent rings are pulled round the clock.
// Engine: engine/silk.js unchanged (ink, pulls, squeegee, paper, bands). Page contract: render(t), DUR, READY, RIGQA.
import { makeTextures, paperSheet, ink, wipeRegion, wipeFront, squeegee, inkFinish, bandSteps, polyPath, circlePath, ringPath, rectPath, unionPath, ridgeLine } from './engine/silk.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, back, ss, eo, ei, hash, mulberry, TAU } from './shared/lib/util.js';

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
const PH = EV.splash - Math.floor(EV.splash * 12) / 12;
const twos = t => Math.floor((t - PH) * 12 + 1e-6) / 12 + PH;

const cv = document.getElementById('c'), g = cv.getContext('2d');
await Promise.all(['700 40px Jost', '600 40px Jost', '800 40px Jost'].map(f => document.fonts.load(f)));
const P = { paper: '#F1E6CF', sky1: '#5D6E8C', sky2: '#3A4766', far: '#6F5E7E', mid: '#2F3D57', near: '#161C29', acc: '#E3543A' };
const T = makeTextures(P.paper, 11);
const BEAT = .625;

// ───────── AKI as ink parts: near-ink limbs, accent coat and sleeves, paper face (one path per ink)
function capPts(a, b, r0, r1, n = 8) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, pts = [];
  for (let i = 0; i <= n; i++) { const t = Math.PI / 2 + i / n * Math.PI; pts.push([a[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * r0, a[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * r0]); }
  for (let i = 0; i <= n; i++) { const t = -Math.PI / 2 + i / n * Math.PI; pts.push([b[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * r1, b[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * r1]); }
  return polyPath(pts);
}
function akiInks(tq, M) {
  const S_ = poseAt(tq), J = solveProfile(S_), W = p => M(p);
  const near = [], acc = [], paper = [];
  for (const kk of ['f', 'n']) {
    const l = J.leg[kk]; near.push(capPts(W(l.hip), W(l.knee), 24 * M.k, 19 * M.k), capPts(W(l.knee), W(l.ankle), 19 * M.k, 14 * M.k));
    const c = Math.cos(l.pitch), s = Math.sin(l.pitch), F = ([u, v]) => W([l.ankle[0] + u * c - v * s, l.ankle[1] + u * s + v * c]);
    near.push(polyPath([F([-16, -34]), F([16, -34]), F([18, -8]), F([44, -2]), F([70, 6]), F([72, 16]), F([-24, 16]), F([-28, 0])]));
    const a = J.arm[kk]; acc.push(capPts(W(a.sh), W(a.el), 16 * M.k, 13 * M.k), capPts(W(a.el), W(a.wr), 13 * M.k, 11 * M.k));
    const h = W([a.wr[0] + (a.wr[0] - a.el[0]) * .18, a.wr[1] + (a.wr[1] - a.el[1]) * .18]); paper.push(circlePath(h[0], h[1], 12 * M.k));
  }
  const TT = (b, u, f) => W([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
  acc.push(polyPath([TT(J.neckBase, 6, -26), TT(J.waist, 0, -42), TT(J.pelvis, -104, -62), TT(J.pelvis, -110, 54), TT(J.waist, 0, 36), TT(J.neckBase, -6, 28)]));
  const hc = J.headC, HR = q => { const c = Math.cos(J.headA), s = Math.sin(J.headA); return W([hc[0] + q[0] * c - q[1] * s, hc[1] + q[0] * s + q[1] * c]); };
  paper.push(polyPath([[16, -44], [34, -20], [44, -3], [37, 8], [39, 16], [34, 23], [32, 35], [12, 46], [-10, 48], [-36, 38], [-50, 8], [-46, -26], [-22, -48]].map(HR)));
  near.push(polyPath([[22, -44], [0, -58], [-34, -52], [-56, -22], [-58, 12], [-44, 38], [-22, 42], [-10, 18], [-2, -14], [8, -32]].map(HR)));
  const wv = Math.sin(tq * Math.PI * CADENCE);
  near.push(polyPath([[-48, -16], [-90, -12 + 8 * wv], [-130, 0 - 10 * wv], [-150, 8 + 6 * wv], [-124, 10 - 8 * wv], [-86, 6 + 6 * wv], [-46, 8]].map(HR)));
  const eye = HR([24, -10]);
  if (S_.watch > .3) { const a = J.arm.n, q = W([a.wr[0] - (a.wr[0] - a.el[0]) * .14, a.wr[1] - (a.wr[1] - a.el[1]) * .14]); paper.push(circlePath(q[0], q[1], 11 * M.k)); }
  return { near: unionPath(near), acc: unionPath(acc), paper: unionPath(paper), eye: circlePath(eye[0], eye[1], 4.5 * M.k) };
}
function printAki(A, reg) {
  ink(g, { path: A.acc }, { color: P.acc, reg: reg[0], sheen: 1, trap: 1 });
  ink(g, { path: A.near }, { color: P.near, reg: reg[1], sheen: 1 });
  ink(g, { path: A.paper }, { color: P.paper, reg: reg[2], sheen: .6 });
  ink(g, { path: A.eye }, { color: P.near, reg: reg[2] });
}
const mk = (ox, oy, k, x0) => { const f = p => [ox + (p[0] - x0) * k, oy + p[1] * k]; f.k = k; return f; };

// ───────── S1: the café and its puddle, pulled on camera
const GY1 = 820, PX1 = 980, K1 = .95;
const S1 = (() => {
  const R = mulberry(3), sky = rectPath(-200, -200, 2400, 1100), bands = bandSteps(-200, 2400, 380, 640, 5);
  const far = []; let x = -200; while (x < 2300) { const w = 120 + R() * 200, h = 120 + R() * 160; far.push([x, 600 - h], [x + w, 600 - h]); x += w; }
  const farP = polyPath([[-200, 700], ...far, [2300, 700]]);
  const cafe = rectPath(260, 180, 1120, GY1 - 180), wins = unionPath([rectPath(330, 330, 330, 360), rectPath(700, 330, 330, 360), rectPath(1090, 420, 200, GY1 - 420)]);
  const signBoard = rectPath(420, 210, 560, 96);
  const pave = rectPath(-200, GY1, 2400, 400), pud = polyPath([[PX1 - 400, GY1 + 70], [PX1 - 300, GY1 + 40], [PX1 + 60, GY1 + 32], [PX1 + 380, GY1 + 46], [PX1 + 430, GY1 + 78], [PX1 + 260, GY1 + 110], [PX1 - 180, GY1 + 112]]);
  const refl = unionPath([rectPath(PX1 - 330, GY1 + 52, 300, 12), rectPath(PX1 + 10, GY1 + 56, 300, 10), rectPath(PX1 - 140, GY1 + 80, 340, 8)]);
  return { sky, bands, farP, cafe, wins, signBoard, pave, pud, refl };
})();
const PULLS1 = [['sky', 0.0, .2], ['far', .2, .36], ['cafe', .36, .54], ['pave', .54, .72], ['refl', .72, .84]];
function shot1(t) {
  const cx = 960 + 40 * t, CM = [1.12, 0, 0, 1.12, 960 - cx * 1.12, 560 - 540 * 1.12];
  g.setTransform(1, 0, 0, 1, 0, 0); paperSheet(g, T, 0, 0, 1920, 1080);
  g.setTransform(...CM);
  const box = [-200, -200, 2400, 1500], pr = name => { const q = PULLS1.find(p => p[0] === name); return clamp((t - q[1]) / (q[2] - q[1])); };
  const clip = name => wipeRegion(box, 'right', pr(name), name.length * 7);
  if (pr('sky') > 0) { ink(g, { path: S1.sky }, { color: P.sky1, clip: clip('sky'), sheen: .6 }); ink(g, { path: S1.bands }, { color: P.sky2, reg: [2, -1], clip: clip('sky') }); }
  if (pr('far') > 0) ink(g, { path: S1.farP }, { color: P.far, reg: [-2, 1], clip: clip('far'), sheen: 1, trap: 1 });
  if (pr('cafe') > 0) {
    ink(g, { path: S1.wins }, { color: P.paper, reg: [-1, 0], clip: clip('cafe') });
    ink(g, { path: S1.cafe, knock: S1.wins }, { color: P.mid, reg: [1, 2], clip: clip('cafe'), sheen: 1, trap: 1 });
    ink(g, { path: S1.signBoard, paint: (c, col) => { c.fillStyle = col; c.fill(S1.signBoard); c.fillStyle = P.paper; c.font = '800 80px Jost'; c.textAlign = 'center'; c.letterSpacing = '18px'; c.fillText('CAFE', 700, 288); } }, { color: P.near, reg: [-1, 1], clip: clip('cafe') });
  }
  if (pr('pave') > 0) ink(g, { path: S1.pave, knock: S1.pud }, { color: P.near, reg: [2, 2], clip: clip('pave'), sheen: 1 });
  if (pr('refl') > 0) { const sh = t > SPL.t0 ? Math.round(Math.sin((t - SPL.t0) * 30) * 6 * Math.exp(-(t - SPL.t0) * 2)) : 0; g.save(); g.clip(S1.pud); ink(g, { path: S1.refl }, { color: P.sky1, reg: [sh, 0], clip: clip('refl') }); g.restore(); }
  // AKI, printed on twos (near ink, accent, paper), from the moment she enters
  if (t > .4) printAki(akiInks(twos(t), mk(PX1, GY1, K1, SPL.x)), [[2, -1], [-1, 1], [1, 1]]);
  // the splash: paper-colour ink pulled in one hit, a crown and drops
  const u = t - SPL.t0;
  if (u >= 0 && u < .6) {
    const fx = PX1 + 30, k = Math.min(1, u * 10) * (1 - u / .7), crown = [];
    for (let i = -3; i <= 3; i++) { const h = (80 + 30 * Math.cos(i)) * k; crown.push(polyPath([[fx + i * 22 - 11, GY1 + 6], [fx + i * 30, GY1 - h], [fx + i * 22 + 11, GY1 + 6]])); }
    for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i / 7 - .5) * 2.4, r = 380 * u; crown.push(circlePath(fx + Math.cos(a) * r, GY1 - 30 + Math.sin(a) * r * .8 + 900 * u * u, 9)); }
    ink(g, { path: unionPath(crown) }, { color: P.paper, reg: [1, -1], sheen: .8 });
  }
  // the squeegee riding the current pull
  const cur = PULLS1.find(p => t >= p[1] && t < p[2] + .04);
  if (cur) { const p = clamp((t - cur[1]) / (cur[2] - cur[1])), x = wipeFront(box, 'right', p); squeegee(g, [x + 18, -260], [x + 18, 1400], [1, 0], { color: { sky: P.sky1, far: P.far, cafe: P.mid, pave: P.near, refl: P.sky1 }[cur[0]], roll: x / 30, handle: .25, scale: 1.4 }); }
  g.setTransform(1, 0, 0, 1, 0, 0); inkFinish(g, T, 0, 0, 1920, 1080);
}

// ───────── S2: the street walk (loose planes, signs pulled as they pass)
const GY2 = 830, K2 = .62;
const xs2 = t => 500 + (X(t) - X(2.5)) * K2;
const S2 = (() => {
  const R = mulberry(9), shops = []; let x = -100; const N = ['24H', 'BAKERY', 'BOOKS', 'NOODLES', 'BAR', 'FLOWERS', 'HOTEL', 'RECORDS', 'LAUNDRY', 'NEWS'];
  for (let i = 0; i < 10; i++) { const w = 420 + R() * 160, h = 360 + R() * 150; shops.push({ x, w, h, name: N[i], body: rectPath(x, GY2 - h, w, h), wins: unionPath([rectPath(x + 40, GY2 - h + 150, w - 80, h - 230)]), sign: rectPath(x + 30, GY2 - h + 36, w - 60, 84) }); x += w + 40; }
  const far = []; let fx = -400; while (fx < 6500) { const w = 140 + R() * 220, h = 200 + R() * 220; far.push([fx, 640 - h], [fx + w, 640 - h]); fx += w; }
  const posts = []; for (let px = 300; px < 7000; px += 900) posts.push(unionPath([rectPath(px - 10, 320, 20, GY2 + 200), rectPath(px - 40, 300, 80, 36)]));
  return { shops, far: polyPath([[-2000, 760], [-2000, 500], ...far, [8000, 500], [8000, 760]]), posts: unionPath(posts), pave: rectPath(-2000, GY2, 10000, 400), sky: rectPath(-4000, -300, 16000, 1400), bands: bandSteps(-4000, 16000, 360, 620, 5) };
})();
function shot2(t) {
  const cx = Math.max(960, xs2(t) + 180), slip = ss(seg(t, 3.0, 7.3)) * 12, snapped = t >= 7.5;
  const sl = snapped ? 0 : slip;
  g.setTransform(1, 0, 0, 1, 0, 0); paperSheet(g, T, 0, 0, 1920, 1080);
  const plane = (k, dy = 0) => [1, 0, 0, 1, 960 - cx * k, dy];
  g.setTransform(...plane(.15)); ink(g, { path: S2.sky }, { color: P.sky1, sheen: .5 }); ink(g, { path: S2.bands }, { color: P.sky2, reg: [2, -1] });
  // far roofs, a little loose: a paper gap and a thickness shadow while they slip
  g.setTransform(...plane(.4, -sl * .6)); g.save(); g.shadowColor = 'rgba(20,16,10,.35)'; g.shadowBlur = 6 * (sl / 12); g.shadowOffsetY = 4 * (sl / 12); ink(g, { path: S2.far }, { color: P.far, reg: [-2 + sl * .3, 1], sheen: 1, trap: 1 }); g.restore();
  g.setTransform(...plane(1));
  ink(g, { path: S2.pave }, { color: P.near, reg: [2, 2], sheen: 1 });
  for (const s of S2.shops) {
    if (s.x + s.w < cx - 1100 || s.x > cx + 1100) continue;
    ink(g, { path: s.wins }, { color: P.paper, reg: [-1, 0] });
    ink(g, { path: s.body, knock: s.wins }, { color: P.mid, reg: [1 - sl * .4, 2], sheen: 1, trap: 1 });
    // the sign is pulled when it comes into frame
    const tin = clamp((cx + 960 - s.x - 200) / 300), clip = wipeRegion([s.x + 30, GY2 - s.h + 36, s.w - 60, 84], 'right', tin, s.x | 0, 14);
    if (tin > 0) ink(g, { path: s.sign, paint: (c, col) => { c.fillStyle = col; c.fill(s.sign); c.fillStyle = P.paper; c.font = '700 54px Jost'; c.textAlign = 'center'; c.letterSpacing = '10px'; c.fillText(s.name, s.x + s.w / 2, GY2 - s.h + 97); } }, { color: P.sky2, clip, reg: [-1, 1] });
  }
  printAki(akiInks(twos(t), mk(500, GY2, K2, X(2.5))), [[2 - sl * .5, -1], [-1, 1 + sl * .2], [1, 1]]);
  g.setTransform(...plane(1.45, sl * .4)); ink(g, { path: S2.posts }, { color: P.near, reg: [sl * .5, 0], sheen: 1 });
  for (const c of RUN.contacts) { const u = t - c.t0; if (u < 0 || u > .2 || c.t0 < 2.5) continue; g.setTransform(...plane(1)); const fx = 500 + (c.x - X(2.5)) * K2 + 14, cr = []; for (let i = -2; i <= 2; i++) cr.push(polyPath([[fx + i * 12 - 6, GY2 + 2], [fx + i * 16, GY2 - 36 * (1 - u * 4)], [fx + i * 12 + 6, GY2 + 2]])); ink(g, { path: unionPath(cr) }, { color: P.paper }); }
  g.setTransform(1, 0, 0, 1, 0, 0); inkFinish(g, T, 0, 0, 1920, 1080);
}
// ───────── S3: the info band; S4: the whole print
const AH = -Math.PI / 2 + (11 + 58 / 60) / 12 * TAU, AM = -Math.PI / 2 + 58 / 60 * TAU;
function band(t, CM) {
  g.setTransform(...CM);
  ink(g, { path: rectPath(0, 760, 1920, 320) }, { color: P.near, sheen: 1 });
  const it = (t0) => t >= t0;
  // the dial, then 23:58, then the run's own numbers, one per beat
  if (it(7.62)) { ink(g, { path: circlePath(330, 920, 96) }, { color: P.paper, reg: [1, -1], sheen: 1 }); ink(g, { path: unionPath([capPts([330, 920], [330 + Math.cos(AH) * 50, 920 + Math.sin(AH) * 50], 7, 5), capPts([330, 920], [330 + Math.cos(AM) * 76, 920 + Math.sin(AM) * 76], 5, 4)]) }, { color: P.near, reg: [-1, 1] });
    const ts = twos(t), sec = ts < 8.4 ? 47 : ts < 9.4 ? 48 : 49, as = -Math.PI / 2 + sec / 60 * TAU; ink(g, { path: capPts([330 - Math.cos(as) * 14, 920 - Math.sin(as) * 14], [330 + Math.cos(as) * 84, 920 + Math.sin(as) * 84], 2.4, 2) }, { color: P.acc, reg: [2, 0] }); }
  const txt = (s, x, y, size, col, w = 800, ls = 4, t0 = 0) => { if (t < t0) return; ink(g, { path: rectPath(0, 0, 1, 1), paint: c => { c.fillStyle = col; c.font = `${w} ${size}px Jost`; c.letterSpacing = ls + 'px'; c.textAlign = 'left'; c.save(); c.translate(x, y); c.scale(.82, 1); c.fillText(s, 0, 0); c.restore(); } }, { color: col, reg: [1, 1] }); };
  txt('23:58', 460, 990, 210, P.paper, 800, 4, 7.62 + BEAT * .5);
  txt('NOW', 464, 800 + 20, 30, P.sky1, 600, 10, 7.62 + BEAT * .5);
  g.setTransform(...CM); ink(g, { path: rectPath(1040, 800, 4, 230) }, { color: P.sky2 });
  txt('4 M/S', 1090, 930, 120, P.acc, 800, 4, 7.62 + BEAT * 1.5); txt('RUNNING', 1094, 800 + 20, 30, P.sky1, 600, 10, 7.62 + BEAT * 1.5);
  txt('2.9', 1500, 930, 120, P.paper, 800, 4, 7.62 + BEAT * 2.5); txt('STEPS / S', 1504, 800 + 20, 30, P.sky1, 600, 10, 7.62 + BEAT * 2.5);
}
function shot3(t) {
  const u = eo(seg(t, 7.5, 7.9)), z = lerp(1.04, 1.2, u), CM = [z, 0, 0, z, 960 - 960 * z, 1080 - 1080 * z];      // push to the band, anchored on the foot of the print
  g.setTransform(1, 0, 0, 1, 0, 0); paperSheet(g, T, 0, 0, 1920, 1080);
  g.setTransform(...CM); ink(g, { path: rectPath(0, -400, 1920, 1200) }, { color: P.sky1, sheen: .5 }); ink(g, { path: bandSteps(0, 1920, 300, 700, 5) }, { color: P.sky2, reg: [2, -1] });
  ink(g, { path: S1.farP }, { color: P.far, reg: [-2, 1], sheen: 1 });
  band(t, CM);
  g.setTransform(1, 0, 0, 1, 0, 0); inkFinish(g, T, 0, 0, 1920, 1080);
}
function shot4(t) {
  const u = eo(seg(t, 9.375, 9.8)), z = lerp(1.2, 1, u), CM = [z, 0, 0, z, 960 - 960 * z, 1080 - 1080 * z];        // pull back to the whole print
  g.setTransform(1, 0, 0, 1, 0, 0); paperSheet(g, T, 0, 0, 1920, 1080);
  g.setTransform(...CM); ink(g, { path: rectPath(0, -400, 1920, 1200) }, { color: P.sky1, sheen: .5 }); ink(g, { path: bandSteps(0, 1920, 300, 700, 5) }, { color: P.sky2, reg: [2, -1] });
  ink(g, { path: S1.farP }, { color: P.far, reg: [-2, 1], sheen: 1 });
  const TX = 1460, tower = polyPath([[TX - 90, 760], [TX - 90, 300], [TX, 200], [TX + 90, 300], [TX + 90, 760]]);
  ink(g, { path: tower, knock: circlePath(TX, 380, 56) }, { color: P.mid, reg: [1, 1], sheen: 1, trap: 1 });
  ink(g, { path: unionPath([capPts([TX, 380], [TX + Math.cos(AH) * 30, 380 + Math.sin(AH) * 30], 5, 4), capPts([TX, 380], [TX + Math.cos(AM) * 46, 380 + Math.sin(AM) * 46], 4, 3)]) }, { color: P.near });
  if (t >= EV.chime) { const p = clamp((t - EV.chime) / .22), clip = wipeRegion([TX - 160, 220, 320, 320], 'down', p, 5, 16); ink(g, { path: unionPath([ringPath(TX, 380, 70, 84), ringPath(TX, 380, 100, 110), ringPath(TX, 380, 128, 134)]) }, { color: P.acc, clip, reg: [2, -1], sheen: 1 }); }
  // the header, printed into the sky
  const hp = clamp((t - 9.4) / .25);
  if (hp > 0) ink(g, { path: rectPath(0, 0, 1, 1), paint: c => { c.save(); c.beginPath(); c.rect(0, 0, 1920 * hp + 40, 400); c.clip(); c.fillStyle = P.paper; c.font = '800 150px Jost'; c.letterSpacing = '30px'; c.textAlign = 'left'; c.translate(120, 210); c.scale(.82, 1); c.fillText('LAST TRAIN', 0, 0); c.restore(); } }, { color: P.paper });
  band(t, CM);
  g.setTransform(1, 0, 0, 1, 0, 0); inkFinish(g, T, 0, 0, 1920, 1080);
}
function render(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  if (t < 2.5) shot1(t);
  else if (t < 7.5) shot2(t);
  else if (t < 9.375) shot3(t);
  else shot4(t);
  // the registration snap on the 7.5 hit: one frame of jolt
  if (t >= 7.5 && t < 7.5 + 1 / 30) { g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(cv, 6, -4); }
}
window.render = render;
window.DUR = DUR;
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(twos(t))); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
render(0);
window.READY = true;
