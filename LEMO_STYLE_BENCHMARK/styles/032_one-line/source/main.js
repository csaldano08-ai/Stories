// 032 · One-line Drawing — the first 10 s of "Last Train Home" as one ink line that never leaves the paper
// (lemo-opuscar styles/one-line): warm black ink on warm white paper, a soft pen shadow, nothing else. The world is one
// path drawn in time: the puddle (and, upside down in it, the 24H and CAFE signs), the splash, the ripples, then the street
// raced in ahead of her (the camera scrolls laterally with the line running ahead), then the watch, whose circle becomes
// the station clock in one continuous pull-back. No cuts: the shot changes are camera moves along the same line.
// AKI is the line too: her outline rises from the ground line, animated from the shared rig on ones (the style's rule),
// in the one accent the style allows (red, used for her and nothing else). Letters are written along glyph skeletons.
// Engine copied unchanged from the style's demo (geom.js path + timing, ink.js line renderer, paper.js, cam.js, hands.js).
// Page contract: window.render(t), DUR, READY, RIGQA.
import { buildPath, headAt, posAt } from './engine/geom.js';
import { prepare, drawLine, PAPER, INK, RED } from './engine/ink.js';
import { makePaper, drawPaper, vignette, makeTooth, drawTooth } from './engine/paper.js';
import { worldToScreen } from './engine/cam.js';
import { penShadow } from './engine/hands.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { lerp, seg, ss, eio, eo, back, hash, clamp, vnoise } from './shared/lib/util.js';

const W = 1920, H = 1080, TAU = Math.PI * 2;
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const X = t => RUN.pelvisAt(t)[0];
function poseAt(t) {
  const S = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  const w = clamp(up, 0, 1.1) * (1 - dn); S.watch = w;
  if (w > 0) { const J0 = solveProfile(S), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S.arms.f.sh *= 1 - .45 * wm; S.head += .26 * wm; S.neck += .08 * wm; }
  return S;
}

// ——— path helpers: SVG d strings from points; letters along glyph skeletons ———
const f1 = v => (+v).toFixed(1);
const poly = pts => 'M' + pts.map(p => `${f1(p[0])},${f1(p[1])}`).join(' L');
function curve(pts) {   // Catmull-Rom through the points
  let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`; }
  return d;
}
const ellipsePts = (cx, cy, rx, ry, a0 = Math.PI, turns = 1, n = 48) => { const o = []; for (let i = 0; i <= n * turns; i++) { const a = a0 + i / n * TAU; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; };
let GLY;
function wordParts(str, cx, base, size, mirror = false) {   // one part per glyph stroke; the connectors between them are the pen's joining moves
  const G = GLY.WK, parts = []; let w = 0; const adv = size * .58; w = str.length * adv;
  let x = cx - w / 2;
  for (const ch of str) { for (const a of (G.g[ch] || [])) { const pts = []; for (let j = 0; j < a.length; j += 2) pts.push([x + a[j] * size, mirror ? base - a[j + 1] * size : base + a[j + 1] * size]); if (pts.length > 1) parts.push({ d: poly(pts) }); } x += adv; }
  return parts;
}

// ——— the world, as one line ———
const PX = SPL.x + 20, PY = 26, PRX = 330, PRY = 58;
const C25 = X(2.5) + 330, C75 = X(7.5) + 330, AHEAD = 1000;
const tA = x => 2.5 + (x - (X(2.5) + AHEAD)) / 1450;               // when the nib, running AHEAD units in front of her, reaches x
const WO = [X(7.5) + AHEAD + 4400, -2300], WR = 300, TW = 520;   // the watch, which becomes the clock of a tower standing on the same ground line                          // the watch (and later the clock face)
const WORDS = ['BAKERY', 'BAR', 'BOOKS', '24H', 'PHARMACY', 'NOODLES', 'CAFE', 'LAUNDRY', 'RECORDS', 'HOTEL', 'FLOWERS'];
const SHOPS = []; { let x = X(2.5) + AHEAD, i = 0; while (tA(x + 1100) < 7.45) { const w = 860 + hash(i * 3.7) * 220; SHOPS.push({ x0: x, x1: x + w, top: -(880 + hash(i * 5.1) * 200), word: WORDS[i % WORDS.length], i }); x += w + 40; i++; } }
function segments() {
  const S = [];
  // S1 — the ground line comes in, the puddle (a lens below the line), the signs upside down in it, the splash, the ripples
  S.push({ id: 'in', style: 'adult', t: [.04, .28], parts: [{ d: curve([[SPL.x - 640, 2], [SPL.x - 520, -1], [PX - PRX - 30, 0]]) }] });
  S.push({ id: 'pud', style: 'adult', t: [.28, .58], parts: [{ d: curve(ellipsePts(PX, PY, PRX, PRY, Math.PI, 1, 40)) }] });
  S.push({ id: 'refl', style: 'teen', t: [.58, .9], parts: [...wordParts('24H', PX - 170, 18, 64, true), ...wordParts('CAFE', PX + 140, 18, 64, true)] });
  const cx = SPL.x + 12, crown = [];   // the crown, drawn right to left from where the writing ended: uneven blades of water
  for (let k = 0; k <= 8; k++) { const u = 1 - k / 8, x = cx - 100 + u * 210 + (hash(k * 7.7) - .5) * 30, up = k % 2 === 1, hgt = 40 + 95 * Math.sin(Math.PI * u) * (.55 + .7 * hash(k * 3.1)); crown.push([x + (up ? (u - .5) * 40 : 0), up ? -hgt : -2 - 10 * hash(k)]); }
  S.push({ id: 'splash', style: 'adult', t: [.94, 1.14], parts: [{ d: poly(crown) }] });
  const spiral = []; for (let i = 0; i <= 150; i++) { const u = i / 150, a = Math.PI + u * TAU * 2.5, r = 40 + u * 240; spiral.push([cx + Math.cos(a) * r, PY + 6 + Math.sin(a) * r * .17]); }
  S.push({ id: 'ripple', style: 'teen', t: [1.16, 1.55], parts: [{ d: curve(spiral) }] });
  S.push({ id: 'run', style: 'adult', t: [1.55, 2.5], parts: [{ d: curve([[cx + 280, 4], [PX + PRX + 300, 0], [PX + PRX + 900, 1], [X(2.5) + AHEAD, 0]]) }] });
  // S2 — the street, raced in ahead of her: up the wall, the name written across the front, an underline that runs to the
  // far wall, over the roof, back down (retracing is invisible), the window, down to the ground, the door, along the ground
  for (const s of SHOPS) {
    const { x0, x1, top } = s, w = x1 - x0, ww = (w - 280) * .74, wx0 = x0 + 40, wx1 = wx0 + ww, dx0 = wx1 + 50, dx1 = dx0 + 136, size = 66, wl = s.word.length * size * .58;
    S.push({ id: 'shop' + s.i, style: 'adult', t: [tA(x0), tA(x1 + 40)], slowK: .5, parts: [
      { d: poly([[x0, 0], [x0, -640]]) },
      ...wordParts(s.word, x0 + 60 + wl / 2, -628, size),
      { d: poly([[x0 + 60 + wl + 10, -596], [x1, -596], [x1, top], [x0, top], [x0, -520], [wx1, -520], [wx1, -112], [wx0, -112], [wx0, 0], [dx0, 0], [dx0, -470], [dx1, -470], [dx1, 0], [x1 + 40, 0]]) }] });
  }
  // S3 — the line runs on along the ground, climbs (the tower's wall, though we can't know it yet), and draws the watch:
  // wrist, dial, hands (23:58), ticks, raindrops on the crystal, the strap out to the right
  const [ox, oy] = WO, rp = (a, r) => [ox + Math.cos(a) * r, oy + Math.sin(a) * r], last = SHOPS[SHOPS.length - 1];
  const hh = -Math.PI / 2 + (11 + 58 / 60) / 12 * TAU, mm = -Math.PI / 2 + 58 / 60 * TAU, tick = [];
  for (let k = 0; k <= 12; k++) { const a = -Math.PI / 2 + k / 12 * TAU; tick.push(rp(a, WR - 6)); if (k < 12) { tick.push(rp(a, WR - (k % 3 ? 40 : 70))); for (let j = 0; j <= 5; j++) tick.push(rp(a + .015 + j / 5 * (TAU / 12 - .035), WR - 6)); } }
  S.push({ id: 'climb', style: 'adult', t: [7.5, 7.66], parts: [{ d: poly([[last.x1 + 40, 0], [ox - TW, 0], [ox - TW, oy + 150]]) }] });
  const a0 = Math.PI - Math.asin(150 / WR);
  S.push({ id: 'watch', style: 'adult', t: [7.66, 8.5], slowK: 1.2, parts: [
    { d: poly([[ox - TW, oy + 150], rp(a0, WR)]) },
    { d: curve(ellipsePts(ox, oy, WR, WR, a0, 1 + (1.5 * Math.PI - a0) / TAU, 72)) },
    { d: poly([rp(-Math.PI / 2, WR - 2), rp(mm, 222), [ox, oy], rp(hh, 150), [ox, oy], rp(mm, 222), rp(-Math.PI / 2, WR - 6)]) },
    { d: poly(tick) }] });
  S.push({ id: 'drops', style: 'teen', t: [8.6, 9.3], parts: [[-60, -170, 14], [110, -170, 16], [150, -80, 22], [120, 60, 26]].map(([dx, dy, r]) => ({ d: curve(ellipsePts(ox + dx, oy + dy, r, r * .9, 0, 1, 18)) })) });
  S.push({ id: 'strap', style: 'adult', t: [9.3, 9.375], parts: [{ d: poly([rp(-Math.asin(150 / WR), WR), [ox + TW, oy - 150]]) }] });
  // S4 — the pull-back: the circle was the station clock all along; the roof, the tower, the city's roofs on the same ground
  const L = [[ox - TW, -800]], R = [];
  let x = ox - TW; while (x > ox - 3600) { const w = 380 + hash(x * .37) * 520, h = 450 + hash(x * .71) * 650; L.push([x, -h], [x - w, -h]); x -= w; }
  L.push([x, 0]);
  x = ox + 3600; R.push([x, 0]); while (x > ox + TW) { const w = 380 + hash(x * .53) * 520, h = 450 + hash(x * .29) * 650, x2 = Math.max(ox + TW, x - w); R.push([x, -h], [x2, -h]); x = x2; }
  S.push({ id: 'tower', style: 'adult', t: [9.375, 10], slowK: .3, parts: [{ d: poly([[ox + TW, oy - 150], [ox + TW, oy - 420], [ox, oy - 950], [ox - TW, oy - 420], [ox + TW, oy - 420], [ox - TW, oy - 420], [ox - TW, -800], ...L.slice(1), [ox + 3600, 0], ...R.slice(1), [ox + TW, -800], [ox + TW, oy - 150]]) }] });
  return S;
}

// ——— AKI's outline: her silhouette from the rig, traced into one loop (red, the one accent) ———
const MASK = document.createElement('canvas'); MASK.width = 560; MASK.height = 780; const MX = MASK.getContext('2d', { willReadFrequently: true });
const MOX = 280, MOY = 720;
function silhouette(J) {
  const g = MX; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, 560, 780); g.translate(MOX - J.pelvis[0], MOY); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round';
  const seg2 = (a, b, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
  for (const k of ['f', 'n']) { const l = J.leg[k]; seg2(l.hip, l.knee, 48); seg2(l.knee, l.ankle, 38); const c = Math.cos(l.pitch), s = Math.sin(l.pitch); seg2(l.ankle, [l.ankle[0] + 56 * c - 8 * s, l.ankle[1] + 56 * s + 8 * c], 30); }
  for (const k of ['f', 'n']) { const a = J.arm[k]; seg2(a.sh, a.el, 36); seg2(a.el, a.wr, 30); g.beginPath(); g.arc(a.wr[0] + (a.wr[0] - a.el[0]) * .14, a.wr[1] + (a.wr[1] - a.el[1]) * .14, 17, 0, 7); g.fill(); }
  const nb = J.neckBase, pv = J.pelvis, uL = J.uL, fL = J.fL, T = (b, up, fw) => [b[0] + uL[0] * up + fL[0] * fw, b[1] + uL[1] * up + fL[1] * fw];
  g.beginPath(); [T(nb, -2, 16), T(nb, -4, -18), T(nb, -18, -32), T(J.waist, 0, -34), T(pv, -80, -50), T(pv, -84, 44), T(J.waist, 0, 28), T(nb, -40, 30)].forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.fill();
  seg2(nb, J.neckTop, 26);
  const hc = [J.headC[0], J.headC[1] - 6], c = Math.cos(J.headA), s = Math.sin(J.headA), HP = ([u, v]) => [hc[0] + u * c - v * s, hc[1] + u * s + v * c];
  g.beginPath(); [[0, -40], [26, -35], [40, -18], [44, -4], [51, 5], [44, 12], [42, 24], [30, 38], [10, 45], [-14, 41], [-30, 27], [-37, 4], [-30, -22], [-16, -36]].map(HP).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.fill();
  g.beginPath(); [[12, -46], [-14, -50], [-38, -38], [-52, -10], [-54, 22], [-50, 54], [-34, 62], [-18, 56], [-10, 20], [8, -26]].map(HP).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.fill();
  return { ox: J.pelvis[0] - MOX, oy: -MOY };
}
function traceOuter() {
  const d = MX.getImageData(0, 0, 560, 780).data, on = (x, y) => x >= 0 && y >= 0 && x < 560 && y < 780 && d[(y * 560 + x) * 4] > 127;
  let sx = -1, sy = -1; outer: for (let y = 0; y < 780; y++) for (let x = 0; x < 560; x++) if (on(x, y)) { sx = x; sy = y; break outer; }
  if (sx < 0) return [];
  const N = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]], idx = (dx, dy) => N.findIndex(([a, b]) => a === dx && b === dy);
  const out = [[sx, sy]]; let cx = sx, cy = sy, b = 0;
  for (let guard = 0; guard < 40000; guard++) { let moved = false;
    for (let i = 1; i <= 8; i++) { const k = (b + i) % 8, nx = cx + N[k][0], ny = cy + N[k][1]; if (on(nx, ny)) { const pk = (k + 7) % 8; const px = cx + N[pk][0], py = cy + N[pk][1]; cx = nx; cy = ny; b = idx(px - cx, py - cy); moved = true; break; } }
    if (!moved) break; if (cx === sx && cy === sy && out.length > 2) break; out.push([cx, cy]); }
  return out;
}
function rdp(P, eps) { if (P.length < 3) return P; let dm = 0, im = 0; const [a, b] = [P[0], P[P.length - 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  for (let i = 1; i < P.length - 1; i++) { const dd = Math.abs((b[0] - a[0]) * (a[1] - P[i][1]) - (a[0] - P[i][0]) * (b[1] - a[1])) / L; if (dd > dm) { dm = dd; im = i; } }
  return dm > eps ? [...rdp(P.slice(0, im + 1), eps).slice(0, -1), ...rdp(P.slice(im), eps)] : [a, b]; }
function chaikin(P, n = 2) { let Q = P; for (let k = 0; k < n; k++) { const R = [Q[0]]; for (let i = 0; i < Q.length - 1; i++) { const a = Q[i], b = Q[i + 1]; R.push([.75 * a[0] + .25 * b[0], .75 * a[1] + .25 * b[1]], [.25 * a[0] + .75 * b[0], .25 * a[1] + .75 * b[1]]); } R.push(Q[Q.length - 1]); Q = R; } return Q; }
function outlineOf(t) {
  const J = solveProfile(poseAt(t)), sil = silhouette(J); let P = traceOuter(); if (P.length < 40) return null;
  // open the loop at its lowest point (where she touches the ground line), so the line rises out of the ground and returns to it
  let bi = 0; P.forEach(([x, y], i) => { if (y > P[bi][1]) bi = i; }); P = [...P.slice(bi), ...P.slice(0, bi)];   // ends adjacent (a closed copy would collapse in rdp)
  P = chaikin(rdp(P, 1.6), 2).map(([x, y]) => [x + sil.ox, y + sil.oy]);
  // eye: a short tick, drawn as a little hook continuing from nowhere would break the rule; instead the profile carries her (nose, chin, bob)
  return { P, J };
}
// a transient line through the ink renderer (same pressure, bleed and pooling rules)
function inkPoly(pts, { w = 2.9, col = INK, a = .96, v = 220 } = {}) {
  const N = pts.length, Xa = new Float64Array(N), Ya = new Float64Array(N), S = new Float64Array(N), V = new Float64Array(N).fill(v), WID = new Float64Array(N), DRY = new Float64Array(N), COL = new Array(N);
  for (let i = 0; i < N; i++) { Xa[i] = pts[i][0]; Ya[i] = pts[i][1]; if (i) S[i] = S[i - 1] + Math.hypot(Xa[i] - Xa[i - 1], Ya[i] - Ya[i - 1]); }
  const cc = [lerp(PAPER[0], col[0], a), lerp(PAPER[1], col[1], a), lerp(PAPER[2], col[2], a)];
  for (let i = 0; i < N; i++) { WID[i] = w * (0.66 + 0.8 * Math.exp(-v / 300)) * (1 + 0.16 * (vnoise(S[i] / 3.1 + 7) - .5)); COL[i] = cc; }
  return { N, X: Xa, Y: Ya, DX: Xa, DY: Ya, S, V, WID, COL, DRY };
}

// ——— camera: composed per shot, the shot changes are continuous moves (no cuts) ———
const camS1 = t => ({ cx: PX + 20 + 12 * t, cy: -110, k: 2.0, r: 0 });
const camS2 = t => ({ cx: X(t) + 330, cy: -380, k: .72, r: 0 });
const camS3 = t => { const a = t - 7.5; return { cx: WO[0] + 40 + 14 * a + 6 * Math.sin(TAU * CADENCE * a * .5) / 1.3, cy: WO[1] + 10 + 9 * Math.sin(TAU * CADENCE * a) / 1.3, k: 1.3 + .04 * a, r: 0 }; };
const camS4 = t => { const u = eio(seg(t, 9.375, 10)); return { cx: WO[0], cy: lerp(WO[1], WO[1] + 820, u), k: Math.exp(lerp(Math.log(1.36), Math.log(.27), u)), r: 0 }; };
const mix = (a, b, u) => ({ cx: lerp(a.cx, b.cx, u), cy: lerp(a.cy, b.cy, u), k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), u)), r: .03 * Math.sin(Math.PI * u) });
function camera(t) {
  const id = shotAt(t)[2];
  if (id === 'S1') return camS1(t);
  if (id === 'S2') return t < 2.82 ? mix(camS1(2.5), camS2(2.82), eio(seg(t, 2.5, 2.82))) : camS2(t);
  if (id === 'S3') { if (t >= 7.86) return camS3(t);   // the camera chases the pen as it runs on and climbs, then settles on the dial
    const u = eio(seg(t, 7.5, 7.86)), nib = posAt(P, headAt(P, t)), a = ss(seg(t, 7.5, 7.56)), b = ss(seg(t, 7.66, 7.86)), c2 = camS2(7.5), c3 = camS3(7.86);
    const fx = lerp(c2.cx, nib[0], a), fy = lerp(c2.cy, nib[1] - 200, a);
    return { cx: lerp(fx, c3.cx, b), cy: lerp(fy, c3.cy, b), k: Math.exp(lerp(Math.log(.72), Math.log(1.3), u)) * (1 - .4 * Math.sin(Math.PI * u)), r: .02 * Math.sin(Math.PI * u) }; }
  return camS4(t);
}

// ——— frame ———
let P, paper, tooth;
function render(t) {
  const ctx = document.getElementById('c').getContext('2d'), cam = camera(t), M = worldToScreen(cam, W, H), id = shotAt(t)[2];
  drawPaper(ctx, paper, cam, W, H);
  const head = headAt(P, t);
  if (t >= P.T[0]) drawLine(ctx, P, head, M, cam.k);
  // AKI's outline, rising from the ground line (on ones)
  if ((id === 'S1' && t > .42 && t < 1.8) || id === 'S2' || (id === 'S3' && t < 7.86)) { const o = outlineOf(t); if (o) drawLine(ctx, inkPoly(o.P, { col: RED, w: 3.1, a: .95, v: 260 }), o.P.length - 1, M, cam.k); }
  // the second hand: the only line on the dial that moves, ticking once a second (with follow-through)
  if (t > 8.5 && t < 9.6) { const k = t < 8.4 ? 47 : t < 9.4 ? 48 : 49, t0 = t < 8.4 ? 7.4 : t < 9.4 ? 8.4 : 9.4, a = t - t0, s = k - 1 + (a < .14 ? back(a / .14, 2.4) : 1), ang = -Math.PI / 2 + s / 60 * TAU;
    const pts = []; for (let i = 0; i <= 24; i++) { const r = -60 + i / 24 * (WR - 34 + 60); pts.push([WO[0] + Math.cos(ang) * r, WO[1] + Math.sin(ang) * r]); }
    drawLine(ctx, inkPoly(pts, { w: 1.6, a: .9, v: 600 }), pts.length - 1, M, cam.k); }
  drawTooth(ctx, tooth, cam, W, H);
  vignette(ctx, W, H);
  // the pen's shadow at the nib while it draws
  if (t >= P.T[0] - .3 && t <= P.T[P.N - 1] + .2) { const h = Math.min(P.N - 1, head), tip = M(...posAt(P, h)), back_ = M(...posAt(P, Math.max(0, h - 30)));
    let dx = tip[0] - back_[0], dy = tip[1] - back_[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const dir = [lerp(.56, dx * .3 + .56, .3), lerp(.83, .83, .3)], dl = Math.hypot(...dir); penShadow(ctx, tip, [dir[0] / dl, dir[1] / dl], cam.k, { lift: t < P.T[0] ? clamp((P.T[0] - t) / .3) : 0, alpha: 1 }); }
}

(async () => {
  GLY = await (await fetch('assets/glyphs.json')).json();
  P = prepare(buildPath(segments())); paper = makePaper(); tooth = makeTooth();
  window.render = render;
  window.RIGQA = t => { const id = shotAt(t)[2]; if (!((id === 'S1' && t > .42 && t < 1.8) || id === 'S2')) return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
  window.READY = true;
})();
window.DUR = DUR;
