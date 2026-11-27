// 029 · Impasto (palette knife) — the first 10 s of "Last Train Home" as a moving oil painting laid with a palette knife
// (lemo-opuscar styles/impasto): every set is a value-planned reference illustration converted into knife strokes
// coarse → fine (paintRef), confined to shape groups, over a thin underpainting; raking light over the paint's height
// field; reflections are explicit stacks of short horizontal knife dabs; AKI is rebuilt every frame from knife strokes
// with fixed seeds (her paint never boils), smooth, on ones. Static paint never moves: only rain, ripples, splashes, AKI,
// the watch hands and the lights the camera rushes past move. Warm windows against cool violet shadow; the purest chroma
// is AKI's red jacket. Transitions are the style's own: a knife paint-over sweep (S1→S2), hard cuts on the beat (7.5 s,
// 9.375 s); the light rakes when the station clock chimes (9.575 s). No grain, supersampled 2×.
// Engine copied unchanged from the style's demo (impasto.js renderer, plate.js reference→strokes, common.js, figures.js).
// Page contract: window.render(t), DUR, READY, RIGQA.
import { Impasto, Strokes, KNIFE, BRUSH, DAB, LINE, hex, mixc, shade, F } from './engine/impasto.js';
import { Ref, paintRef } from './engine/plate.js';
import { P, E as ELL, lin, rad } from './engine/common.js';
import { rain, splashes } from './engine/figures.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { lerp, seg, ss, eio, eo, ei, back, hash, clamp, mulberry } from './shared/lib/util.js';

const W = 1920, H = 1080, TAU = Math.PI * 2;
const C = hex;
const shadeHex = (h, k) => '#' + C(h).map(v => Math.max(0, Math.min(255, Math.round(v * k * 255))).toString(16).padStart(2, '0')).join('');
const TR = (x, y) => [1, 0, 0, 1, x, y], SC = k => [k, 0, 0, k, 0, 0];
const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const unit = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / d, (b[1] - a[1]) / d]; };
const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];

// ——— the shared run (same as every style) ———
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

// ——— cameras ———
const camS1 = t => ({ x: SPL.x + 30 + 12 * t, y: -90, zoom: 2.0 });         // locked insert at puddle level, slow drift
const camS2 = t => ({ x: X(t) + 330, y: -400, zoom: .72 });                  // tracking at the runner's speed
const SCR = { x: W / 2, y: H / 2, zoom: 1 };
const C25 = camS2(2.5).x, C75 = camS2(7.5).x;

// ——— paint palette ———
const AK = { jk: C('#d9442e'), jkS: C('#8e2622'), jkL: C('#ff9468'), jkD: C('#5a160f'), sw: C('#e8dcc6'), swS: C('#a89a90'),
  tr: C('#363550'), trS: C('#20202f'), trL: C('#5c5c80'), bt: C('#62402e'), btS: C('#38221a'), btL: C('#b08062'),
  sk: C('#efc6b2'), skS: C('#b28a94'), skL: C('#fde2d2'), hr: C('#3c2448'), hrS: C('#22122a'), hrL: C('#7c5c96'),
  gold: C('#e2ba62'), goldL: C('#fff2bc'), eye: C('#1e0c10') };
const LIGHT = { amber: '#ffcf86', pink: '#ff8fc0', teal: '#8ee0d6', cream: '#f6ead4', violet: '#b49af0' };

// ——— engine + plates ———
let E, dyn;
const plates = {};
function up(R, st, ox, oy) { return { b: E.batch(st.data()), tex: E.texture(R.ctx.canvas), w: R.w, h: R.h, ox, oy }; }
function worldRef(x0, y0, x1, y1, sc) { const R = new Ref(x1 - x0, y1 - y0, sc); for (const q of [R.ctx, R.idc]) q.setTransform(sc, 0, 0, sc, -x0 * sc, -y0 * sc); return R; }
function keep(st, f) { const o = new Strokes(Math.max(16, st.n)); for (let i = 0; i < st.n; i++) if (f(st.a[i * F], st.a[i * F + 1])) { o.a.set(st.a.subarray(i * F, i * F + F), o.n * F); o.n++; } return o; }
function plate(pl, o) {
  const M = o.M || TR(pl.ox, pl.oy);
  if (!o.noUnder && (o.ua ?? 1) > 0) E.under(pl.tex, pl.w, pl.h, { ...o, M, alpha: (o.alpha ?? 1) * (o.ua ?? 1), grey: 0 });
  E.draw(pl.b, { grey: 0, ...o, M });
}
const flush = o => { if (dyn.n) E.drawNow(dyn.data(), { grey: 0, ...o }); dyn.clear(); };
const visX = (pl, cam) => pl.ox + pl.w > cam.x - W / 2 / cam.zoom - 40 && pl.ox < cam.x + W / 2 / cam.zoom + 40;

// a stack of short horizontal knife dabs: a light reflected in wet ground (the style's reflections)
function stack(st, x, yTop, len, w, col, o = {}) {
  const r = mulberry(Math.round(x * 13 + yTop * 7) | 0), st0 = o.step || 11;
  for (let y = yTop; y < yTop + len; y += st0 * (.7 + r() * .8)) {
    const f = (y - yTop) / len; if (r() < .12 + f * .6) continue;
    const xx = x + (r() - .5) * w * (o.jx ?? .55); if (o.skip && o.skip(xx, y)) continue;
    const ww = w * (1 - f * .5) * (.45 + r() * .55), c = col.map(v => v * (1 - f * .45) * (o.k ?? 1) * (.85 + r() * .3));
    st.push({ x: xx - (o.ox || 0), y: y - (o.oy || 0), ang: (r() - .5) * .08, len: ww, wid: (o.wid || 7) * (.6 + r() * .7), c, c2: c.map(v => v * .78),
      type: KNIFE, hgt: .7, alpha: (o.a0 ?? .8) * (1 - f * .8) * (.6 + r() * .4), seed: 7 + r() * 900, skew: (r() - .5), app: o.app ? o.app(xx, y) : 0 });
  }
}

// ======================= S1 · the puddle (insert at ground level) =======================
const PX = SPL.x + 20, PY = 52, PRX = 320, PRY = 60;
const inPud = (x, y, k = .92) => ((x - PX) / PRX) ** 2 + ((y - PY) / PRY) ** 2 < k;
const BOK = []; { const r = mulberry(2903); const cols = ['#c8904e', '#b85a86', '#c8b49e', '#a8743e', '#7a5aa6', '#3e8890', '#b86470'];
  for (let i = 0; i < 18; i++) BOK.push({ x: SPL.x - 500 + r() * 1100, y: -360 + r() * 300, r: 14 + r() * 24, col: cols[(r() * cols.length) | 0] }); }
function buildS1() {
  const x0 = SPL.x - 540, y0 = -400, x1 = SPL.x + 640, y1 = 214, sc = 2, R = worldRef(x0, y0, x1, y1, sc);
  // the street behind, out of focus: dark plum wall, the shop windows as soft warm planes, the lights as round knife dabs
  R.fill(P([[x0, y0], [x1, y0], [x1, -26], [x0, -26]]), lin(0, y0, 0, -26, [[0, '#1e1228'], [.6, '#2a1830'], [1, '#33203a']]), { dir: 0, fallback: 0, group: 'bg', maxR: 40, detail: 1.6, aj: .3, jit: .1 });
  const soft = { detail: 3.2, jit: .1, aj: .5 };   // out of focus: only the coarse knife passes survive
  for (const [wx, ww, a, b] of [[SPL.x - 560, 360, '#d89a62', '#a85e3e'], [SPL.x - 120, 300, '#e2c2b4', '#a08a9a'], [SPL.x + 250, 140, '#c87a52', '#7a4038'], [SPL.x + 430, 300, '#d8925a', '#9a5236']]) {
    R.fill(P([[wx, -400], [wx + ww, -400], [wx + ww, -40], [wx, -40]]), lin(0, -400, 0, -40, [[0, a], [1, b]]), { dir: 90, fallback: 90, group: 'win' + wx, maxR: 44, ...soft });
    for (const y of [-300, -190]) R.fill(P([[wx, y], [wx + ww, y], [wx + ww, y + 22], [wx, y + 22]]), shadeHex(b, .6), { dir: 0, group: 'win' + wx, maxR: 44, ...soft });
    R.fill(P([[wx + ww * .48, -400], [wx + ww * .52, -400], [wx + ww * .52, -40], [wx + ww * .48, -40]]), '#2a1a2a', { dir: 90, group: 'win' + wx, maxR: 44, ...soft }); }
  BOK.slice(0, 8).forEach((b, i) => R.fill(ELL(b.x, b.y, b.r * .6, b.r * .6), shadeHex(b.col, 1.25), { dir: (i * 37) % 180, group: 'bk' + i, maxR: 10, jit: .06 }));
  // the shop base in shadow, then the wet asphalt (far rows reflect the glow, near rows dark)
  R.fill(P([[x0, -40], [x1, -40], [x1, -24], [x0, -24]]), '#2a1a2c', { dir: 0, group: 'base', maxR: 8 });
  R.fill(P([[x0, -20], [x1, -20], [x1, y1], [x0, y1]]), lin(0, -20, 0, y1, [[0, '#46324e'], [.25, '#2e2238'], [1, '#17111f']]), { dir: 0, fallback: 0, group: 'asph', maxR: 26, aj: .2, jit: .08 });
  // the puddle: a dark mirror with a light rim where the asphalt is wet-edged
  R.fill(ELL(PX, PY, PRX, PRY), lin(0, PY - PRY, 0, PY + PRY, [[0, '#3c2a52'], [.45, '#1c1230'], [1, '#100a1e']]), { dir: 0, fallback: 0, group: 'pud', maxR: 16, hgt: .45, aj: .12, detail: .9 });
  const st = paintRef(R, { R: [56, 28, 14, 6.5, 3.2], T: 12, seed: 291 });
  // static reflections of the out-of-focus lights on the asphalt (the puddle's own reflections ripple: drawn live)
  for (const [wx, ww, col] of [[SPL.x - 560, 360, '#d89a62'], [SPL.x - 120, 300, '#e2c2b4'], [SPL.x + 250, 140, '#c87a52'], [SPL.x + 430, 300, '#d8925a']]) for (let k = 0; k < 4; k++) stack(st, wx + ww * (k + .5) / 4, -14, 210, ww / 4.4, C(col).map(v => v * .55), { ox: x0, oy: y0, a0: .4, wid: 5, step: 8, skip: (x, y) => inPud(x, y, 1.12) });
  const r = mulberry(77); for (let i = 0; i < 90; i++) { const x = x0 + r() * (x1 - x0), y = -10 + r() * 180; if (inPud(x, y, 1.1)) continue;
    st.push({ x: x - x0, y: y - y0, ang: (r() - .5) * .3, len: 5 + r() * 10, wid: 3 + r() * 3, c: mixc(C('#8a7096'), C('#e0b08a'), r() * .5), type: DAB, alpha: .5 + r() * .4, hgt: 1.3, seed: 300 + i }); }
  plates.s1 = up(R, st, x0, y0);
}
// live reflections inside the puddle: the 24H / CAFE signs upside down, sampled from mirrored letters into knife dabs
const REFL = [];
function buildReflections() {
  const words = [['24H', PX - 175, C(LIGHT.pink), C('#ffd6ea')], ['CAFE', PX + 155, C(LIGHT.amber), C('#fff0cc')]];
  for (const [w, cx, col, core] of words) {
    const cv = document.createElement('canvas'); cv.width = 420; cv.height = 90; const q = cv.getContext('2d');
    q.translate(210, 0); q.scale(1, -1); q.font = '700 66px Cormorant'; q.textAlign = 'center'; q.fillStyle = '#fff'; q.fillText(w, 0, -10);
    const d = q.getImageData(0, 0, 420, 90).data;
    const halo = document.createElement('canvas'); halo.width = 420; halo.height = 90; const h2 = halo.getContext('2d'); h2.filter = 'blur(7px)'; h2.drawImage(cv, 0, 0);
    const dh = h2.getImageData(0, 0, 420, 90).data;
    for (let y = 2; y < 88; y += 3.4) for (let x = 2; x < 418; x += 4.6) {
      const i = ((y | 0) * 420 + (x | 0)) * 4, wx = cx - 210 + x + ((y / 3.4 | 0) % 2) * 2.3 + (hash(x * 1.9 + y * 3.7) - .5) * 3, wy = y + 2;
      if (!inPud(wx, wy, .86)) continue;
      if (d[i + 3] > 110) REFL.push({ x: wx, y: wy, c: mixc(col, core, hash(x * .3 + y) * .6), a: .82, len: 12 + hash(x + y * 3) * 9, wid: 4.2, sd: x * 3.1 + y * 17.7 });
      else if (dh[i + 3] > 34 && hash(x * 1.7 + y * 2.3) > .45) REFL.push({ x: wx, y: wy, c: col.map(v => v * .7), a: .28, len: 12 + hash(x + y) * 8, wid: 6, sd: x * 5.3 + y * 9.1 });
    }
  }
  for (const [wx, ww, col] of [[SPL.x - 560, 360, '#d89a62'], [SPL.x - 120, 300, '#e2c2b4'], [SPL.x + 250, 140, '#c87a52'], [SPL.x + 430, 300, '#d8925a']])
    for (let x = wx + 10; x < wx + ww - 10; x += 26) for (let i = 0; i < 4; i++) { const y = PY - PRY * .75 + i * 9 + hash(x + i) * 5; if (!inPud(x, y, .8) || hash(x * 1.3 + i) < .35) continue;
      REFL.push({ x: x + (hash(x * 3 + i) - .5) * 10, y, c: C(col).map(v => v * .5), a: .3 * (1 - i / 5), len: 20 + hash(x + i * 7) * 16, wid: 5, sd: x * 1.7 + i * 13 }); }
  for (const b of BOK.slice(0, 8)) if (Math.abs(b.x - PX) < PRX * .9) for (let i = 0; i < 6; i++) { const y = PY - PRY * .6 + i * 14 + hash(b.x + i) * 6; if (!inPud(b.x, y, .8)) continue;
    REFL.push({ x: b.x + (hash(b.x * 3 + i) - .5) * b.r * .4, y, c: C(b.col).map(v => v * .6), a: .35 * (1 - i / 7), len: b.r * (1.1 - i * .1), wid: 6, sd: b.x + i * 31 }); }
}
// ripple displacement of the mirror: fine rain shimmer + the splash wave travelling out from the boot
function ripple(x, y, t) {
  let dx = 3.4 * Math.sin(y * .5 + t * 6.5 + x * .013) + 1.6 * Math.sin(y * 1.3 - t * 9.2 + x * .03);
  if (t > EV.splash) { const a = t - EV.splash, r = Math.hypot(x - SPL.x, (y - 8) * 3.2), front = a * 430;
    if (r < front + 30) dx += 24 * Math.exp(-a * 1.5) * Math.sin(r * .05 - a * 13) * clamp((front + 30 - r) / 60); }
  return dx;
}
function ring(out, cx, cy, rr, k, w, a, sd, c = [.86, .84, .95], n = 0, inside = null) {   // a ripple: thin arcs along an ellipse
  const ry = rr * k, m = n || Math.max(16, Math.min(40, Math.round(rr / 3.5)));
  for (let j = 0; j < m; j++) { if (hash(sd * 1.3 + j * 7.1) < .22) continue; const th = (j + hash(sd + j) * .3) / m * TAU, x = cx + Math.cos(th) * rr, y = cy + Math.sin(th) * ry; if (inside && !inside(x, y)) continue;
    out.push({ x, y, ang: Math.atan2(Math.cos(th) * ry, -Math.sin(th) * rr), len: TAU * Math.hypot(rr, ry) / Math.SQRT2 / m * (1.05 + hash(sd * 3 + j) * .4), wid: w, c, seed: sd * 7 + j, type: LINE, alpha: a * (.6 + hash(sd + j * 5) * .4), hgt: .3 }); }
}
function rainRings(out, t, x0, x1, y0, y1, n, inside, seed = 1, s = 1) {
  for (let i = 0; i < n; i++) {
    const per = .55 + hash(i * 1.3 + seed) * .4, off = hash(i * 7.7 + seed) * per, cyc = Math.floor((t + off) / per), ph = ((t + off) % per) / per;
    const cx = lerp(x0, x1, hash(i * 3.3 + cyc * 1.91 + seed)), cy = lerp(y0, y1, hash(i * 5.1 + cyc * .77 + seed));
    if (inside && !inside(cx, cy)) continue;
    ring(out, cx, cy, (6 + ph * 52) * s, .26, 1.6 * s, .26 * (1 - ph), i * 30 + cyc);
  }
}
// the splash in the puddle (0.9375 s): crown, sheets, droplets, rings
function bigSplash(out, t) {
  const a = t - EV.splash; if (a < 0) return;
  const x = SPL.x + 12, y = 6, wc = [.9, .9, .97];
  for (let i = 0; i < 3; i++) { const ai = a - i * .13; if (ai < 0 || ai > 1.5) continue;
    ring(out, x, y + 30, 34 + ai * 330, .2, 4 - i, .7 * (1 - ai / 1.5), 40 + i * 13, wc, 0, (px, py) => inPud(px, py, 1.02)); }
  if (a < .42) for (let j = 0; j < 11; j++) {   // crown sheets: knife blades of water thrown up and out, uneven
    const th = (j / 11 - .5) * Math.PI * .9 + (hash(j * 7) - .5) * .25, k = eo(a / (.16 + hash(j) * .1)), fall = Math.max(0, a - .2) / .22;
    const bx = x + Math.sin(th) * (36 + 80 * k), by = y + 6 - Math.cos(th) * 3, L = (40 + 80 * hash(j * 1.3)) * k * (1 - clamp(fall));
    if (L < 4) continue; const ang = -Math.PI / 2 + Math.sin(th) * (.7 + hash(j * 2) * .5);
    out.push({ x: bx + Math.cos(ang) * L / 2, y: by + Math.sin(ang) * L / 2, ang, len: L, wid: 6 + 8 * hash(j * 3), c: mixc(wc, [.78, .74, .9], hash(j * 4)), c2: [.66, .64, .78], seed: 500 + j, type: KNIFE, taper: .75, alpha: .4 + hash(j * 5) * .3, hgt: .6 });
  }
  if (a < .8) for (let j = 0; j < 30; j++) {   // droplets on ballistic arcs
    const th = -Math.PI / 2 + (hash(j * 1.7) - .5) * 2.4, v = 420 + hash(j * 3.1) * 620, a2 = a + .025, px = x + (hash(j * 9) - .5) * 60 + Math.cos(th) * v * a2, py = y + Math.sin(th) * v * a2 + 1700 * a2 * a2;
    if (py > 14 + hash(j) * 30) continue; const s = 3.5 + hash(j * 5) * 6;
    out.push({ x: px, y: py, ang: Math.atan2(Math.sin(th) * v + 3400 * a, Math.cos(th) * v), len: s * 1.5, wid: s, c: wc, seed: 600 + j, type: DAB, alpha: .9, hgt: .7 });
  }
}
function smallSplash(out, cx, a, s = 1, seed = 1) {   // a footfall on wet stone
  if (a < 0 || a > .5) return; const wc = [.86, .86, .94];
  for (let j = 0; j < 10; j++) { const th = -Math.PI / 2 + (hash(j + seed) - .5) * 2.4, v = (160 + hash(j * 3 + seed) * 220) * s, px = cx + Math.cos(th) * v * a, py = Math.sin(th) * v * a + 1500 * a * a * s;
    if (py > 8) continue; out.push({ x: px, y: py, ang: 0, len: 7 * s, wid: 6 * s, c: wc, seed: seed * 50 + j, type: DAB, alpha: .8 * (1 - a / .5), hgt: .6 }); }
  ring(out, cx, 10 * s, (20 + a * 160) * s, .2, 2.2 * s, .5 * (1 - a / .5), seed * 70, wc);
}

// ======================= S2 · the street (side tracking) =======================
const SX0 = C25 - 1500, SX1 = C75 + 1500, FAC = -70;
const WORDS = ['BAKERY', 'BAR', 'BOOKS', '24H', 'PHARMACY', 'NOODLES', 'CAFE', 'LAUNDRY', 'RECORDS', 'HOTEL', 'FLOWERS'];
const WALLS = [['#3a2a3e', '#5a3e48'], ['#2e2a42', '#4a3e52'], ['#44303a', '#62443e'], ['#30283a', '#4c3a46'], ['#3a3040', '#5a4650'], ['#2c3040', '#464a56']];
const SIGN = [['dark', LIGHT.amber], ['dark', LIGHT.pink], ['lit', '#e8d4b0'], ['dark', LIGHT.teal], ['dark', LIGHT.cream], ['dark', LIGHT.violet]];
const GOODS = { BAKERY: 'round', BAR: 'bottles', BOOKS: 'spines', '24H': 'shelf', PHARMACY: 'shelf', NOODLES: 'lanterns', CAFE: 'tables', LAUNDRY: 'drums', RECORDS: 'spines', HOTEL: 'lobby', FLOWERS: 'flowers' };
const COOL = { '24H': 1, PHARMACY: 1, LAUNDRY: 1 };
const SHOPS = []; { const r = mulberry(29029); let x = SX0 - 300, i = 0;
  while (x < SX1 + 300) { const w = 860 + r() * 240, word = WORDS[i % WORDS.length];
    SHOPS.push({ x0: x, x1: x + w, top: -(900 + r() * 200), lit: COOL[word] || r() < .85, ups: [r() < .55, r() < .4, r() < .6], awn: r() < .5, vbox: r() < .45, wall: WALLS[i % WALLS.length], sign: SIGN[i % SIGN.length], word, i, sd: r() });
    x += w + 44; i++; } }
const PUD2 = []; for (let x = SX0 + 600; x < SX1; x += 1700 + hash(x) * 900) PUD2.push({ x, y: 60 + hash(x * 3) * 60, rx: 150 + hash(x * 7) * 120, ry: 20 + hash(x * 9) * 10 });
const inPud2 = (x, y) => PUD2.some(p => ((x - p.x) / p.rx) ** 2 + ((y - p.y) / p.ry) ** 2 < 1);
const appS2 = (x, y, lv = 0) => clamp((x - (C25 - 1420)) / 2840) * .3 + lv * .012;   // the paint-over sweep, left → right on screen

function drawShop(R, s, lights) {
  const { x0, x1, top } = s, w = x1 - x0, g = 'sh' + s.i, ww = (w - 280) * .74, wx0 = x0 + 52, wx1 = wx0 + ww, dx0 = wx1 + 50, dx1 = dx0 + 136;
  // wall: cool above, warmed by the shop light near the street
  R.fill(P([[x0, top], [x1, top], [x1, FAC], [x0, FAC]]), lin(0, top, 0, FAC, [[0, s.wall[0]], [.55, s.wall[0]], [1, s.wall[1]]]), { dir: 90, fallback: 90, group: g, maxR: 36, detail: 1.3, jit: .1, aj: .5 });
  R.fill(P([[x0 - 6, top - 4], [x1 + 6, top - 4], [x1 + 6, top + 24], [x0 - 6, top + 24]]), '#5c4658', { dir: 0, group: g + 'c', maxR: 8 });   // cornice
  // upper storey windows
  const nu = w > 980 ? 3 : 2;
  for (let k = 0; k < nu; k++) {
    const ux = x0 + w * (k + .5) / nu - 62, uy = top + 100, lit = s.ups[k];
    R.fill(P([[ux - 10, uy - 10], [ux + 134, uy - 10], [ux + 134, uy + 190], [ux - 10, uy + 190]]), '#5a4656', { dir: 90, group: g + 'uf' + k, maxR: 5 });
    R.fill(P([[ux, uy], [ux + 124, uy], [ux + 124, uy + 180], [ux, uy + 180]]), lit ? lin(0, uy, 0, uy + 180, [[0, '#ffd88e'], [1, '#e2914a']]) : lin(0, uy, 0, uy + 180, [[0, '#2a2440'], [1, '#1c1830']]), { dir: 90, group: g + 'u' + k, maxR: 10 });
    if (lit) { R.fill(P([[ux, uy], [ux + 34, uy], [ux + 26, uy + 180], [ux, uy + 180]]), '#a0503e', { dir: 90, group: g + 'cu' + k, maxR: 6 }); lights.push({ x: ux + 62, w: 90, col: C('#f2b870'), k: .6, top: FAC + 6, a0: .4 }); }
    if (k === 1 || nu === 2) { R.fill(P([[ux - 26, uy + 186], [ux + 150, uy + 186], [ux + 150, uy + 200], [ux - 26, uy + 200]]), '#1c1420', { dir: 0, group: g + 'bal' + k, maxR: 5 });
      for (let b = 0; b < 7; b++) R.fill(P([[ux - 20 + b * 26, uy + 200], [ux - 14 + b * 26, uy + 200], [ux - 14 + b * 26, uy + 262], [ux - 20 + b * 26, uy + 262]]), '#1c1420', { dir: 90, group: g + 'bal' + k, maxR: 3 });
      R.fill(P([[ux - 26, uy + 258], [ux + 150, uy + 258], [ux + 150, uy + 270], [ux - 26, uy + 270]]), '#1c1420', { dir: 0, group: g + 'bal' + k, maxR: 4 }); }
  }
  // projecting lightbox sign
  if (s.vbox) { const vx = x1 - 96, vy0 = Math.max(top + 60, -990), vy1 = -730, col = s.sign[1];
    R.fill(P([[vx, vy0], [vx + 62, vy0], [vx + 62, vy1], [vx, vy1]]), lin(0, vy0, 0, vy1, [[0, col], [1, '#ffffff']]), { dir: 90, group: g + 'vb', maxR: 8 });
    for (let k = 0; k < 3; k++) R.fill(ELL(vx + 31, vy0 + 50 + k * (vy1 - vy0 - 100) / 2, 14, 14), '#2a1e30', { group: g + 'vbd' + k, maxR: 3 });
    lights.push({ x: vx + 31, w: 40, col: C(col), k: .9, top: FAC + 4, a0: .55 }); }
  // sign board with knife-laid letters
  const by0 = -712, by1 = -608, [kind, lc] = s.sign;
  R.fill(P([[x0 + 36, by0], [x1 - 36, by0], [x1 - 36, by1], [x0 + 36, by1]]), kind === 'lit' ? lin(0, by0, 0, by1, [[0, '#f4e4c2'], [1, '#d8bc8e']]) : '#231a2a', { dir: 0, group: g + 'sb', maxR: 12 });
  for (const q of [R.ctx, R.idc]) q.letterSpacing = '7px';
  R.text(s.word, (x0 + x1) / 2, by1 - 22, '700 78px Cormorant', kind === 'lit' ? '#3a2430' : lc, { group: g + 'sl', maxR: 2.6, dir: 'edge', hgt: 1.2 });
  for (const q of [R.ctx, R.idc]) q.letterSpacing = '0px';
  lights.push({ x: (x0 + x1) / 2, w: w * .62, col: C(kind === 'lit' ? '#f0d8a8' : lc), k: .75, top: FAC + 4, a0: .5 });
  // awning
  if (s.awn) { const ac = ['#2e5a5a', '#7a5a34', '#4a3a6a', '#3a4a6a'][s.i % 4];
    R.fill(P([[wx0 - 24, -598], [wx1 + 24, -598], [wx1 + 34, -540], [wx0 - 34, -540]]), ac, { dir: 90, group: g + 'aw', maxR: 10 });
    for (let k = 0; k * 64 < ww + 40; k += 2) R.fill(P([[wx0 - 24 + k * 64, -598], [wx0 + 8 + k * 64, -598], [wx0 + 8 + k * 64, -540], [wx0 - 30 + k * 64, -540]]), '#d8ccb0', { dir: 90, group: g + 'aw', maxR: 8 }); }
  // shop window
  const wy0 = -520, wy1 = -112, cool = COOL[s.word], lit = s.lit;
  const glass = lit ? (cool ? lin(0, wy0, 0, wy1, [[0, '#eef2ee'], [1, '#a8c0c4']]) : lin(0, wy0, 0, wy1, [[0, '#ffe2a2'], [.6, '#f2a85a'], [1, '#c8743c']])) : lin(0, wy0, 0, wy1, [[0, '#2e2c4a'], [1, '#1a182e']]);
  R.fill(P([[wx0 - 12, wy0 - 12], [wx1 + 12, wy0 - 12], [wx1 + 12, wy1 + 12], [wx0 - 12, wy1 + 12]]), '#1e1622', { dir: 90, group: g + 'wf', maxR: 5 });
  R.fill(P([[wx0, wy0], [wx1, wy0], [wx1, wy1], [wx0, wy1]]), glass, { dir: 90, group: g + 'w', maxR: 16, detail: 1.2 });
  goods(R, s, wx0, wx1, wy0, wy1, g);
  for (const u of [.34, .67]) R.fill(P([[wx0 + ww * u - 5, wy0], [wx0 + ww * u + 5, wy0], [wx0 + ww * u + 5, wy1], [wx0 + ww * u - 5, wy1]]), '#1e1622', { dir: 90, group: g + 'mu', maxR: 3 });
  if (lit) { lights.push({ x: (wx0 + wx1) / 2, w: ww * .9, col: C(cool ? '#dfeae6' : '#f6b66a'), k: 1, top: FAC + 2, a0: .8 }); }
  // door
  R.fill(P([[dx0, -470], [dx1, -470], [dx1, FAC], [dx0, FAC]]), lit && !cool ? lin(0, -470, 0, FAC, [[0, '#d88a4a'], [1, '#8a4a2e']]) : '#2e2230', { dir: 90, group: g + 'd', maxR: 10 });
  R.fill(P([[dx0 + 16, -440], [dx1 - 16, -440], [dx1 - 16, -230], [dx0 + 16, -230]]), lit ? (cool ? '#cfdcd8' : '#ffd090') : '#3a3048', { dir: 90, group: g + 'dg', maxR: 8 });
  R.fill(ELL(dx1 - 26, -260, 7, 7), '#e8c070', { group: g + 'dh', maxR: 2 });
  // the shop light spills on the wall around the window (tint keeps the shape ids)
  if (lit) R.tint(ELL((wx0 + wx1) / 2, -300, ww * .8, 320), rad((wx0 + wx1) / 2, -300, 20, ww * .8, [[0, cool ? 'rgba(190,220,220,.22)' : 'rgba(255,190,120,.26)'], [1, 'rgba(255,190,120,0)']]));
}
function goods(R, s, x0, x1, y0, y1, g) {
  const kind = GOODS[s.word], r = mulberry(4000 + s.i), w = x1 - x0;
  const shelf = (y, c = '#5a3a30') => R.fill(P([[x0, y], [x1, y], [x1, y + 12], [x0, y + 12]]), c, { dir: 0, group: g + 'gs', maxR: 4 });
  if (kind === 'round') { for (const y of [-380, -250]) { shelf(y); for (let x = x0 + 30; x < x1 - 30; x += 46 + r() * 20) R.fill(ELL(x, y - 16, 22, 15), ['#b86a30', '#d08a44', '#9a5428'][(r() * 3) | 0], { group: g + 'go', maxR: 5, type: DAB }); } }
  else if (kind === 'spines' || kind === 'shelf') { for (const y of [-420, -310, -200]) { shelf(y, kind === 'shelf' ? '#7a8a90' : '#4a2e28'); for (let x = x0 + 16; x < x1 - 16; x += 14 + r() * 10) { const hh = 50 + r() * 36; R.fill(P([[x, y - hh], [x + 10, y - hh], [x + 10, y], [x, y]]), kind === 'shelf' ? ['#c86a5a', '#5a8ab8', '#e8c060', '#6aa070'][(r() * 4) | 0] : ['#7a3a3a', '#3a5a6a', '#8a7a3a', '#4a3a5a', '#6a5a4a'][(r() * 5) | 0], { dir: 90, group: g + 'go', maxR: 3 }); } } }
  else if (kind === 'bottles') { shelf(-300); for (let x = x0 + 24; x < x1 - 24; x += 26 + r() * 12) { const hh = 70 + r() * 40; R.fill(c => c.roundRect(x, -300 - hh, 16, hh, 6), ['#3a6a3a', '#8a5a2a', '#5a3a5a'][(r() * 3) | 0], { dir: 90, group: g + 'go', maxR: 3 }); } }
  else if (kind === 'lanterns') { for (let x = x0 + 70; x < x1 - 40; x += 120) { R.fill(ELL(x, -430, 34, 42), '#e8823a', { group: g + 'go' + x, maxR: 6, type: DAB }); R.fill(P([[x - 2, -520], [x + 2, -520], [x + 2, -470], [x - 2, -470]]), '#2a1a1a', { group: g + 'gl', maxR: 2 }); } }
  else if (kind === 'tables') { for (let x = x0 + 80; x < x1 - 60; x += 170) { R.fill(P([[x - 50, -200], [x + 50, -200], [x + 50, -190], [x - 50, -190]]), '#3a2420', { group: g + 'go', maxR: 3 }); R.fill(P([[x - 4, -190], [x + 4, -190], [x + 4, -120], [x - 4, -120]]), '#3a2420', { group: g + 'go', maxR: 3 }); R.fill(ELL(x + 70, -250, 18, 24), '#4a2e2a', { group: g + 'gp', maxR: 4, type: DAB }); R.fill(P([[x + 52, -228], [x + 88, -228], [x + 84, -130], [x + 56, -130]]), '#4a2e2a', { group: g + 'gp', maxR: 4 }); } }
  else if (kind === 'drums') { for (let x = x0 + 70; x < x1 - 50; x += 130) { R.fill(P([[x - 55, -330], [x + 55, -330], [x + 55, -120], [x - 55, -120]]), '#d8dcd8', { group: g + 'go', maxR: 5 }); R.fill(ELL(x, -230, 36, 36), '#5a6a7a', { group: g + 'gd', maxR: 4, type: DAB }); } }
  else if (kind === 'flowers') { for (let k = 0; k < 70; k++) { const x = x0 + 20 + r() * (w - 40), y = -260 + r() * 130; R.fill(ELL(x, y, 9 + r() * 7, 8 + r() * 6), ['#f0a0b8', '#f6e070', '#f4f0e8', '#c870c8', '#f08a50'][(r() * 5) | 0], { group: g + 'fl' + k, maxR: 4, type: DAB }); } R.fill(P([[x0, -150], [x1, -150], [x1, y1], [x0, y1]]), '#2e4a30', { dir: 0, group: g + 'go', maxR: 6 }); }
  else if (kind === 'lobby') { R.fill(P([[x0 + 40, -260], [x1 - 40, -260], [x1 - 40, -180], [x0 + 40, -180]]), '#5a3a2a', { dir: 0, group: g + 'go', maxR: 5 }); R.fill(ELL(x0 + w * .7, -420, 30, 30), '#fff0c0', { group: g + 'gl', maxR: 4, type: DAB }); }
}
function buildStreet() {
  const sc = .72, CORE = 1800, M = 150, Y0 = -1180, Y1 = 470, list = [];
  const tiles = []; for (let x = SX0; x < SX1; x += CORE) tiles.push([x, x + CORE]);
  for (const [c0, c1] of tiles) {
    const x0 = c0 - M, x1 = c1 + M, R = worldRef(x0, Y0, x1, Y1, sc), lights = [];
    for (const s of SHOPS) if (s.x1 > x0 - 200 && s.x0 < x1 + 200) {
      drawShop(R, s, lights);
      // the alley between two shops: dark at the bottom, open to the far city above
      R.fill(P([[s.x1, -420], [s.x1 + 44, -420], [s.x1 + 44, FAC], [s.x1, FAC]]), '#0e0a16', { dir: 90, group: 'al' + s.i, maxR: 6 });
    }
    // wet pavement, kerb, road
    R.fill(P([[x0, FAC], [x1, FAC], [x1, 150], [x0, 150]]), lin(0, FAC, 0, 150, [[0, '#46344c'], [.4, '#34283e'], [1, '#2a2034']]), { dir: 0, fallback: 0, group: 'side', maxR: 24, aj: .2, jit: .08 });
    R.fill(P([[x0, 150], [x1, 150], [x1, 174], [x0, 174]]), lin(0, 150, 0, 174, [[0, '#6a5872'], [1, '#3a2c40']]), { dir: 0, group: 'kerb', maxR: 6 });
    R.fill(P([[x0, 174], [x1, 174], [x1, Y1], [x0, Y1]]), lin(0, 174, 0, Y1, [[0, '#221a2e'], [1, '#120e1c']]), { dir: 0, fallback: 0, group: 'road', maxR: 28, aj: .2 });
    for (const p of PUD2) if (p.x + p.rx > x0 && p.x - p.rx < x1) R.fill(ELL(p.x, p.y, p.rx, p.ry), '#160e22', { dir: 0, group: 'pd' + p.x, maxR: 10, hgt: .45 });
    const st0 = paintRef(R, { R: [40, 20, 10, 5, 2.6], T: 13, seed: 2900 + c0 | 0, app: (x, y, lv) => appS2(x + x0, y + Y0, lv) });
    const st = keep(st0, (x) => x + x0 >= c0 && x + x0 < c1);
    // reflections of every light in the wet stone (brighter in the puddles)
    for (const L of lights) if (L.x >= c0 && L.x < c1) {
      const n = Math.max(1, Math.round(L.w / 70));
      for (let k = 0; k < n; k++) { const x = L.x + (k - (n - 1) / 2) * L.w / n; stack(st, x, L.top, 280 + hash(x) * 140, Math.min(80, L.w / n * 1.05), L.col.map(v => v * .8), { ox: x0, oy: Y0, a0: L.a0, k: L.k, wid: 9, step: 9, jx: .3, app: (xx, yy) => appS2(xx, yy, 4) });
        for (const p of PUD2) if (Math.abs(p.x - x) < p.rx * .8) stack(st, x, p.y - p.ry * .7, p.ry * 1.6, 60, L.col.map(v => v * .9), { ox: x0, oy: Y0, a0: .75, wid: 6, step: 7, app: (xx, yy) => appS2(xx, yy, 4) }); } }
    const r = mulberry(c0 | 0); for (let i = 0; i < 50; i++) { const x = c0 + r() * CORE, y = FAC + 8 + r() * 520;
      st.push({ x: x - x0, y: y - Y0, ang: (r() - .5) * .2, len: 6 + r() * 16, wid: 3 + r() * 3, c: mixc(C('#8a7896'), C('#c8a090'), r() * .5), type: DAB, alpha: .3 + r() * .3, hgt: 1.25, seed: 900 + i, app: appS2(x, y, 4) }); }
    list.push(up(R, st, x0, Y0));
  }
  plates.street = list;
}
// far city at parallax 0.32 (sky, low clouds lit by the city, towers with a few windows)
const FPAR = .32, FX = t => 2600 + (camS2(t).x - C25) * FPAR;
function buildFar() {
  const x0 = 2600 - 1500, x1 = 2600 + (C75 - C25) * FPAR + 1500, y0 = -1200, y1 = -60, sc = .4, R = worldRef(x0, y0, x1, y1, sc), r = mulberry(3131);
  R.fill(P([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]), lin(0, y0, 0, y1, [[0, '#120c24'], [.35, '#24163a'], [.7, '#4a2a4c'], [1, '#6a3c52']]), { dir: -4, fallback: -4, group: 'sky', maxR: 60, detail: 2.2, aj: .3 });
  for (let i = 0; i < 9; i++) { const cx = x0 + (i + r()) * (x1 - x0) / 9, cy = -1100 + r() * 160, cw = 260 + r() * 260, ch = 40 + r() * 30;
    R.fill(c2 => { c2.ellipse(cx, cy, cw, ch, 0, 0, 7); c2.ellipse(cx - cw * .5, cy + ch * .3, cw * .6, ch * .7, 0, 0, 7); c2.ellipse(cx + cw * .55, cy + ch * .35, cw * .5, ch * .6, 0, 0, 7); }, lin(0, cy - ch, 0, cy + ch, [[0, '#2c2042'], [.6, '#3e2a4c'], [1, '#86506a']]), { dir: -4, group: 'cl', maxR: 40, detail: 1.6 }); }
  let x = x0; while (x < x1) { const w = 140 + r() * 260, top = -620 - r() * 420, col = ['#1e1630', '#241a36', '#2a1e3a'][(r() * 3) | 0], gid = 'tw' + Math.round(x);
    R.fill(P([[x, top], [x + w, top], [x + w, y1], [x, y1]]), col, { dir: 90, group: gid, maxR: 24 });
    for (let yy = top + 30; yy < -140; yy += 46) for (let xx = x + 18; xx < x + w - 24; xx += 38) if (r() < .22) R.fill(P([[xx, yy], [xx + 14, yy], [xx + 14, yy + 20], [xx, yy + 20]]), r() < .8 ? '#d89a58' : '#a8b8d0', { group: gid + 'w' + xx + yy, maxR: 5 });
    x += w * (.6 + r() * .5); }
  const st = paintRef(R, { R: [60, 30, 15, 7.5, 3.6], T: 14, seed: 313, app: (xx, yy, lv) => clamp(((xx + x0 - FX(2.5)) * .72 + 960) / 1920) * .3 + lv * .012 });
  plates.far = up(R, st, x0, y0);
}
// foreground lamp posts (parallax 1.6), painted live with fixed seeds
const POSTS = [C25 + 900, C25 + 2900, C25 + 4900, C25 + 6900];
function posts(out, cam) {
  for (const [i, px] of POSTS.entries()) {
    const sx = W / 2 + (px - cam.x) * cam.zoom * 1.6; if (sx < -160 || sx > W + 160) continue;
    out.push({ x: sx, y: 560, ang: Math.PI / 2, len: 1150, wid: 40, c: C('#0e0a14'), c2: C('#1c1424'), seed: 40 + i, type: KNIFE, hgt: 1.2 });
    out.push({ x: sx - 15, y: 600, ang: Math.PI / 2, len: 1000, wid: 7, c: C('#6a5070'), seed: 50 + i, type: KNIFE, alpha: .7, hgt: 1.3 });
    out.push({ x: sx + 46, y: 70, ang: 0, len: 120, wid: 22, c: C('#120c18'), seed: 60 + i, type: KNIFE });
    out.push({ x: sx + 92, y: 96, ang: 0, len: 62, wid: 40, c: C('#ffe0a0'), c2: C('#f0a860'), seed: 70 + i, type: DAB, hgt: 1.3 });
    for (let k = 0; k < 3; k++) out.push({ x: sx + 92, y: 98, ang: 0, len: 110 + k * 70, wid: 90 + k * 60, c: C('#f6c880'), seed: 80 + i * 10 + k, type: DAB, alpha: .16 - k * .04, hgt: .1 });
  }
}

// ======================= AKI in knife strokes =======================
const K = (out, a, b, w, c, c2, sd, x = {}) => out.push({ x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, ang: Math.atan2(b[1] - a[1], b[0] - a[0]), len: Math.hypot(b[0] - a[0], b[1] - a[1]) + w * (x.over ?? .45), wid: w, c, c2: c2 || c, seed: sd, type: x.type ?? KNIFE, taper: x.taper ?? .1, hgt: x.hgt ?? 1.15, alpha: x.alpha ?? 1, bend: x.bend ?? 0, skew: x.skew ?? 0 });
const Dd = (out, p, l, w, c, c2, sd, ang = 0, x = {}) => out.push({ x: p[0], y: p[1], ang, len: l, wid: w, c, c2: c2 || c, seed: sd, type: DAB, hgt: x.hgt ?? 1.1, alpha: x.alpha ?? 1 });
function paintLeg(out, l, m, sd, near) {
  const tr = shade(AK.tr, m), trS = shade(AK.trS, m);
  K(out, l.hip, l.knee, 50, tr, trS, sd, { taper: -.12 });
  K(out, l.knee, l.ankle, 40, tr, trS, sd + 1);
  if (near) K(out, add(l.hip, unit(l.hip, l.knee), 20), l.knee, 9, AK.trL, AK.tr, sd + 2, { alpha: .55, over: .1 });
  const u = unit(l.knee, l.ankle), top = add(l.ankle, u, -52), F_ = p => add(l.ankle, rot(p, l.pitch));
  K(out, top, add(l.ankle, u, 6), 44, shade(AK.bt, m), shade(AK.btS, m), sd + 3, { over: .2 });              // boot shaft
  K(out, F_([66, 12]), F_([-24, 8]), 32, shade(AK.bt, m), shade(AK.btS, m), sd + 4, { over: .25, taper: .32 });    // foot (toe first, narrow)
  K(out, F_([-26, 22]), F_([64, 22]), 8, C('#1a100c'), null, sd + 5, { over: .1 });                              // sole
  if (near) K(out, F_([6, -2]), F_([52, 2]), 6, AK.btL, AK.bt, sd + 6, { alpha: .7, over: .1, hgt: 1.3 });           // wet sheen on the boot
}
function paintArm(out, a, m, sd, watch, near) {
  const jk = shade(AK.jk, m), jkS = shade(AK.jkS, m), u = unit(a.el, a.wr);
  K(out, a.sh, a.el, 36, jk, jkS, sd, { taper: -.1 });
  K(out, a.el, add(a.wr, u, -6), 31, jk, jkS, sd + 1);
  if (near) K(out, add(a.sh, unit(a.sh, a.el), 10), a.el, 8, AK.jkL, AK.jk, sd + 2, { alpha: .75, over: .1 });
  K(out, add(a.wr, u, -18), add(a.wr, u, 2), 33, jkS, shade(AK.jkD, m), sd + 3, { over: .15 });                  // cuff
  Dd(out, add(a.wr, u, 18), 30, 26, shade(AK.sk, m), shade(AK.skS, m), sd + 4, Math.atan2(u[1], u[0]));         // fist
  if (watch) { Dd(out, add(a.wr, u, 4), 16, 18, AK.gold, C('#a07830'), sd + 5, Math.atan2(u[1], u[0]), { hgt: 1.4 }); Dd(out, add(add(a.wr, u, 1), [-3, -4]), 5, 5, AK.goldL, null, sd + 6, 0, { hgt: 1.5 }); }
}
function paintAki(out, J, o = {}) {
  const sd = 7000, pv = J.pelvis, nb = J.neckBase, uL = J.uL, fL = J.fL, T = (b, u_, f_) => [b[0] + uL[0] * u_ + fL[0] * f_, b[1] + uL[1] * u_ + fL[1] * f_];
  const hb = o.hemB || [0, 0], lag = o.hair || [0, 0], lx = clamp(lag[0] * .45, -30, 8), ly = clamp(lag[1] * .35, -12, 14);
  const hc = J.headC, HR = p => { const q = rot(p, J.headA); return [hc[0] + q[0], hc[1] + q[1]]; };
  paintArm(out, J.arm.f, .62, sd + 10, false, false);
  paintLeg(out, J.leg.f, .66, sd + 20, false);
  paintLeg(out, J.leg.n, 1, sd + 30, true);
  // hair: the mass hanging behind the neck (flipped-out ends stream back)
  K(out, HR([-8, -36]), add(HR([-46, 44]), [lx, ly]), 66, AK.hr, AK.hrS, sd + 40, { taper: -.25, over: .25 });
  Dd(out, add(HR([-52, 54]), [lx * 1.1, ly * 1.1]), 42, 20, AK.hrS, AK.hr, sd + 41, -.5 + lx * .01);
  K(out, nb, J.neckTop, 26, AK.skS, null, sd + 42, { over: .3 });
  // the jacket: body plane, shaded front, warm rim down the back, a trailing hem, the zip, the collar
  K(out, T(nb, -12, -2), T(pv, -80, -4), 90, AK.jk, AK.jkS, sd + 50, { taper: -.08, over: .2 });
  K(out, T(nb, -22, 32), add(T(pv, -82, 34), hb, .25), 28, AK.jkS, AK.jkD, sd + 51, { over: .15 });
  K(out, T(pv, -48, -40), add(T(pv, -88, -50), hb, .9), 34, AK.jk, AK.jkS, sd + 52, { taper: .45, over: .2 });
  K(out, T(nb, -8, -38), T(J.waist, 0, -44), 13, AK.jkL, AK.jk, sd + 53, { alpha: .9, over: .1 });
  K(out, T(nb, -20, 28), T(pv, -74, 28), 4, AK.jkD, null, sd + 54, { type: LINE, over: 0 });
  K(out, T(nb, 6, -12), T(nb, -16, 22), 24, AK.jkS, AK.jk, sd + 55, { over: .2 });
  Dd(out, T(nb, 10, 6), 32, 24, AK.sw, AK.swS, sd + 56, Math.atan2(fL[1], fL[0]));
  // head in profile: face plane, chin, nose, eye, brow, mouth, blush; hair cap, bangs, side lock, highlight
  Dd(out, HR([10, 4]), 74, 84, AK.sk, AK.skS, sd + 60, J.headA);
  K(out, HR([20, 14]), HR([31, 30]), 22, AK.sk, AK.skS, sd + 61, { over: .2 });
  Dd(out, HR([44, -1]), 13, 11, AK.sk, AK.skL, sd + 62, J.headA);
  Dd(out, HR([24, 12]), 15, 9, C('#e8949a'), null, sd + 63, J.headA, { alpha: .55 });
  if (!o.blink) Dd(out, HR([29, -8]), 10, 7, AK.eye, null, sd + 64, J.headA); else K(out, HR([23, -6]), HR([33, -6]), 3, AK.eye, null, sd + 64, { type: LINE });
  K(out, HR([22, -19]), HR([36, -18]), 3.5, AK.hrS, null, sd + 65, { type: LINE, over: 0 });
  K(out, HR([33, 22]), HR([40, 21]), 3, C('#8a3a40'), null, sd + 66, { type: LINE, over: 0 });
  Dd(out, HR([-10, -16]), 86, 70, AK.hr, AK.hrS, sd + 67, J.headA - .35);                                         // the skull cap
  K(out, HR([-2, -44]), HR([34, -27]), 22, AK.hr, AK.hrS, sd + 68, { taper: .45, over: .05 });                     // bangs, swept forward
  K(out, HR([-6, -22]), add(HR([-2, 30]), [lx * .4, ly * .4]), 28, AK.hr, AK.hrS, sd + 69, { taper: -.3, over: .1 });   // lock over the ear
  K(out, HR([-34, -30]), HR([6, -46]), 7, AK.hrL, AK.hr, sd + 70, { alpha: .8, over: .1 });
  paintArm(out, J.arm.n, 1, sd + 80, true, true);
}
// her reflection in the wet stone: broken horizontal dabs under her, colours of what is mirrored
function akiReflection(out, J, k = 1) {
  const x = J.pelvis[0] + 6, r = (i) => hash(i * 7.31 + 3);
  for (let i = 0; i < 11; i++) { const y = 10 + i * 26, hgt = y / .55, col = hgt < 60 ? AK.bt : hgt < 300 ? AK.tr : AK.jk;
    out.push({ x: x + (r(i) - .5) * 30, y, ang: 0, len: (hgt < 300 ? 70 : 110) * (1 - i * .03), wid: 12, c: shade(col, .7), seed: 7500 + i, type: KNIFE, alpha: k * (.55 - i * .035), hgt: .6 }); }
}

// ======================= S3 · wrist and watch (insert) =======================
const A0 = [-160, 960], A1 = [1700, 420], AU = unit(A0, A1), AN = [-AU[1], AU[0]];
const AP = (s, q) => [A0[0] + AU[0] * s + AN[0] * q, A0[1] + AU[1] * s + AN[1] * q];
const WC = AP(1167, -10), WR = 205, ANG3 = Math.atan2(AU[1], AU[0]);   // dial centre; 3 o'clock points toward the hand
const handDir = f => [Math.cos(ANG3 - Math.PI / 2 + f * TAU), Math.sin(ANG3 - Math.PI / 2 + f * TAU)];
function buildS3() {
  const x0 = -60, y0 = -60, R = worldRef(x0, y0, 1980, 1140, 1), dirArm = ANG3 * 180 / Math.PI;
  const poly = pts => P(pts.map(([s, q]) => AP(s, q)));
  // sleeve (red), its folds, the cuff, the sweater edge
  R.fill(poly([[-60, -230], [900, -200], [920, 190], [-60, 220]]), lin(...AP(300, -220), ...AP(300, 220), [[0, '#f0603e'], [.35, '#d8442e'], [.8, '#9a2a24'], [1, '#6a1a18']]), { dir: dirArm, fallback: dirArm, group: 'sl', maxR: 34, detail: 1.2, jit: .08 });
  for (const [s_, w, d] of [[220, 30, 1], [480, 24, -1], [720, 28, 1]]) {
    R.fill(poly([[s_ - w, -200], [s_ + w * .3, -190], [s_ + w * 1.2, 40 * d], [s_ + w * .2, 190], [s_ - w * .6, 190], [s_ - w * .2, 40 * d]]), '#a42e26', { dir: 90 + dirArm, group: 'fold' + s_, maxR: 10 });
    R.fill(poly([[s_ + w * .4, -190], [s_ + w * .9, -186], [s_ + w * 1.5, 30 * d], [s_ + w, 60 * d]]), '#ff8a62', { dir: 90 + dirArm, group: 'ridge' + s_, maxR: 6 }); }
  R.fill(poly([[880, -196], [972, -186], [972, 180], [880, 190]]), lin(...AP(920, -190), ...AP(920, 190), [[0, '#c83a2c'], [1, '#6a1a16']]), { dir: 90 + dirArm, group: 'cuff', maxR: 10 });
  R.fill(poly([[970, -160], [1002, -156], [1002, 150], [970, 154]]), '#e8dcc6', { dir: 90 + dirArm, group: 'swt', maxR: 6 });
  // wrist and the back of the fist, warm in the street light, cool in shadow
  const skin = lin(...AP(1300, -190), ...AP(1300, 170), [[0, '#fbe0cc'], [.45, '#ecbea6'], [1, '#a87a76']]);
  R.fill(c2 => { const m = (s_, q) => AP(s_, q); let p = m(998, -150); c2.moveTo(p[0], p[1]);
    for (const [s_, q] of [[1380, -140], [1470, -172], [1640, -176]]) { p = m(s_, q); c2.lineTo(p[0], p[1]); }
    const a = m(1760, -170), b = m(1790, -40); c2.quadraticCurveTo(a[0], a[1], b[0], b[1]);
    const e = m(1770, 120), f = m(1650, 150); c2.quadraticCurveTo(e[0], e[1], f[0], f[1]);
    for (const [s_, q] of [[1420, 148], [998, 146]]) { p = m(s_, q); c2.lineTo(p[0], p[1]); } c2.closePath(); }, skin, { dir: dirArm, fallback: dirArm, group: 'skin', maxR: 26, detail: 1.1, jit: .07 });
  R.fill(poly([[1380, -150], [1600, -182], [1680, -168], [1600, -140], [1420, -126]]), '#d6a294', { dir: dirArm, group: 'thumb', maxR: 7 });
  R.fill(poly([[1080, 60], [1360, 40], [1360, 70], [1080, 92]]), '#c2928a', { dir: dirArm, group: 'tend', maxR: 6, alpha: .9 });
  // strap, case, bezel, dial, indices, crown
  R.fill(poly([[1087, -175], [1247, -175], [1247, 170], [1087, 170]]), lin(...AP(1160, -175), ...AP(1160, 170), [[0, '#8a6048'], [.5, '#5a3b2a'], [1, '#3a2418']]), { dir: 90 + dirArm, group: 'strap', maxR: 8 });
  R.fill(ELL(WC[0], WC[1], WR, WR), lin(WC[0] - WR, WC[1] - WR, WC[0] + WR, WC[1] + WR, [[0, '#fff0b0'], [.35, '#e0b860'], [.75, '#a07830'], [1, '#6a4a1c']]), { dir: { radial: WC, off: 90 }, group: 'case', maxR: 8 });
  R.line(ELL(WC[0], WC[1], WR - 22, WR - 22), '#b08838', 12, { dir: { radial: WC, off: 90 }, group: 'bez', maxR: 4 });
  R.fill(ELL(WC[0], WC[1], WR - 30, WR - 30), rad(WC[0] - 50, WC[1] - 60, 10, WR, [[0, '#fff8e6'], [.6, '#eadcbc'], [1, '#c4ab84']]), { dir: { radial: WC, off: 90 }, group: 'dial', maxR: 12, hgt: .7 });
  for (let k = 0; k < 12; k++) { const d = handDir(k / 12), n = [-d[1], d[0]], r0 = k === 0 ? 118 : 136, r1 = 162, hw = k % 3 ? 4 : 7;
    const pts = [[WC[0] + d[0] * r0 + n[0] * hw, WC[1] + d[1] * r0 + n[1] * hw], [WC[0] + d[0] * r1 + n[0] * hw, WC[1] + d[1] * r1 + n[1] * hw], [WC[0] + d[0] * r1 - n[0] * hw, WC[1] + d[1] * r1 - n[1] * hw], [WC[0] + d[0] * r0 - n[0] * hw, WC[1] + d[1] * r0 - n[1] * hw]];
    R.fill(P(pts), '#3a2a20', { group: 'ix' + k, maxR: 2.5 }); }
  const cr = [WC[0] + AU[0] * (WR + 14), WC[1] + AU[1] * (WR + 14)]; R.fill(ELL(cr[0], cr[1], 16, 22, ANG3), '#d8b060', { group: 'crown', maxR: 4 });
  const st = paintRef(R, { R: [44, 22, 11, 5.5, 2.8], T: 12, seed: 3303 });
  // glass: a sheen laid across the crystal, and raindrops sitting on it
  st.push({ x: WC[0] - 60 - x0, y: WC[1] - 70 - y0, ang: -.75, len: 230, wid: 34, c: [1, 1, 1], c2: [.92, .94, 1], seed: 11, type: KNIFE, alpha: .28, hgt: .3, taper: .4 });
  for (const [dx, dy, r] of [[-90, 60, 16], [70, -110, 12], [110, 70, 20], [-30, -40, 9], [20, 130, 11]]) {
    const p = [WC[0] + dx - x0, WC[1] + dy - y0];
    st.push({ x: p[0], y: p[1] + 2, ang: 0, len: r * 2.1, wid: r * 2, c: C('#7a6a52'), seed: 20 + dx, type: DAB, alpha: .45, hgt: 1.4 });
    st.push({ x: p[0], y: p[1], ang: 0, len: r * 1.8, wid: r * 1.7, c: C('#fff6e4'), c2: C('#d8c8a8'), seed: 30 + dx, type: DAB, alpha: .7, hgt: 1.6 });
    st.push({ x: p[0] - r * .35, y: p[1] - r * .35, ang: 0, len: r * .55, wid: r * .45, c: [1, 1, 1], seed: 40 + dx, type: DAB, alpha: .95, hgt: 1.8 }); }
  plates.s3 = up(R, st, x0, y0);
}
const secAt = t => { const k = t < 7.9 ? 47 : t < 8.9 ? 48 : 49, t0 = t < 7.9 ? 6.9 : t < 8.9 ? 7.9 : 8.9; const a = t - t0; return k - 1 + (a < .14 ? back(a / .14, 2.4) : 1); };   // a tick with follow-through
function watchHands(out, t) {
  const hand = (f, r0, r1, w, c, c2, sd, type = KNIFE) => { const d = handDir(f); out.push({ x: WC[0] + d[0] * (r0 + r1) / 2, y: WC[1] + d[1] * (r0 + r1) / 2, ang: Math.atan2(d[1], d[0]), len: r1 - r0, wid: w, c, c2, seed: sd, type, taper: type === KNIFE ? .5 : 0, hgt: 1.4 }); };
  hand((11 + 58 / 60) / 12, -18, 96, 15, C('#2a1c14'), C('#8a6a3a'), 1);
  hand(58 / 60, -22, 150, 11, C('#2a1c14'), C('#8a6a3a'), 2);
  const s = secAt(t) / 60; hand(s, -40, 160, 4, C('#8a2a20'), C('#5a1a14'), 3, LINE);
  const d = handDir(s); out.push({ x: WC[0] - d[0] * 32, y: WC[1] - d[1] * 32, ang: 0, len: 13, wid: 13, c: C('#8a2a20'), seed: 4, type: DAB, hgt: 1.4 });
  out.push({ x: WC[0], y: WC[1], ang: 0, len: 22, wid: 22, c: AK.gold, c2: AK.goldL, seed: 5, type: DAB, hgt: 1.6 });
}
function streaks(out, t) {   // the street rushing past behind the wrist: moving paint, not static paint
  const a = t - 7.5;
  for (let i = 0; i < 16; i++) { const v = 220 + hash(i) * 160, L = 900, x = ((hash(i * 3.1) * 3200 - v * a) % 3200 + 3200) % 3200 - 600, y = hash(i * 5.7) * 1080;
    out.push({ x, y, ang: (hash(i * 2) - .5) * .06, len: L, wid: 150 + hash(i * 9) * 120, c: C(['#1a1028', '#221434', '#140c20', '#2a1a3a'][i % 4]), c2: C('#120a1c'), seed: 100 + i, type: KNIFE, hgt: .8 }); }
  const cols = ['#f2b25a', '#e872a8', '#f0e2d0', '#58b8b0', '#ffcf86', '#9a7ae0'];
  for (let i = 0; i < 0; i++) { const v = 700 + hash(i * 1.3) * 700, x = ((hash(i * 4.4) * 3400 - v * a) % 3400 + 3400) % 3400 - 700, y = 60 + hash(i * 6.6) * 960, r = 26 + hash(i * 8.1) * 50;
    const c = C(cols[i % cols.length]); out.push({ x, y, ang: 0, len: r * 2.2 + v * .1, wid: r * 2, c, c2: shade(c, .8), seed: 200 + i, type: DAB, alpha: .26, hgt: .4 }); }
  for (let i = 0; i < 46; i++) { const v = 1600 + hash(i * 2.9) * 1800, L = v * .26, x = ((hash(i * 7.7) * 3800 - v * a) % 3800 + 3800) % 3800 - 900, y = 30 + hash(i * 3.3) * 1020;
    const c = C(cols[(i * 7) % cols.length]); out.push({ x, y, ang: 0, len: L, wid: 6 + hash(i * 5.5) * 20, c, c2: shade(c, .35), seed: 300 + i, type: KNIFE, taper: .3, alpha: .85, hgt: 1.1 }); }
}

// ======================= S4 · the sky over the city (wide, the crane begins to tilt down) =======================
const CLK = [1240, 862, 50];
function buildS4() {
  const x0 = -40, y0 = -20, x1 = 1960, y1 = 1320, R = worldRef(x0, y0, x1, y1, 1), r = mulberry(4404);
  R.fill(P([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]), lin(0, y0, 0, 1080, [[0, '#0c0820'], [.3, '#1a1236'], [.62, '#2e1c44'], [.85, '#5a3050'], [1, '#7a4458']]), { dir: -5, fallback: -5, group: 'sky', maxR: 48, detail: 2.2, aj: .3 });
  const cloud = (x, y, w, h) => R.fill(c2 => { for (let k = 0; k < 6; k++) { const u = (k / 5 - .5) * 2; c2.moveTo(x + u * w * .7 + w * .45, y + h * .2); c2.ellipse(x + u * w * .7, y + h * .2 - (1 - u * u) * h * .5 * (.7 + hash(x + k) * .6), w * (.32 + hash(x * 3 + k) * .14), h * (.55 + hash(x * 5 + k) * .3), 0, 0, 7); } },
    lin(0, y - h, 0, y + h, [[0, '#2a1e40'], [.55, '#3e2c50'], [1, '#8a5468']]), { dir: -4, fallback: -4, group: 'sky', maxR: 34, detail: 1.4, aj: .35, jit: .1 });
  cloud(300, 150, 300, 60); cloud(1180, 110, 360, 64); cloud(1700, 300, 260, 50); cloud(700, 420, 280, 46); cloud(1450, 560, 300, 44); cloud(220, 640, 240, 40); cloud(980, 730, 260, 36);
  let x = x0; while (x < x1) { const w = 120 + r() * 200, top = 1010 + r() * 160, gid = 'b' + Math.round(x);
    const bc = ['#1a1226', '#20182e', '#24192f'][(r() * 3) | 0], kind = r();
    R.fill(P([[x, top], [x + w, top], [x + w, y1], [x, y1]]), bc, { dir: 90, group: gid, maxR: 20 });
    if (kind < .3) R.fill(P([[x - 6, top + 2], [x + w / 2, top - w * .32], [x + w + 6, top + 2]]), '#2a1c34', { dir: 30, group: gid + 'p', maxR: 8 });          // pitched roof
    else { R.fill(P([[x, top], [x + w, top], [x + w, top + 8], [x, top + 8]]), '#4a3650', { dir: 0, group: gid + 'e', maxR: 4 });
      if (kind < .55) { const tx = x + w * (.2 + r() * .5); R.fill(ELL(tx + 22, top - 46, 24, 28), '#1e1428', { group: gid + 'tk', maxR: 6 });                 // water tank on legs
        for (const lx of [tx + 4, tx + 36]) R.fill(P([[lx, top - 22], [lx + 5, top - 22], [lx + 5, top], [lx, top]]), '#1e1428', { group: gid + 'tk', maxR: 2 }); }
      else if (kind < .8) R.fill(P([[x + w * .3, top - 40], [x + w * .3 + 44, top - 40], [x + w * .3 + 44, top], [x + w * .3, top]]), '#1a1226', { dir: 90, group: gid + 't', maxR: 6 });
      else R.line(c2 => { c2.moveTo(x + w * .6, top); c2.lineTo(x + w * .6, top - 90); c2.moveTo(x + w * .6 - 16, top - 60); c2.lineTo(x + w * .6 + 16, top - 60); }, '#2a1c34', 4, { group: gid + 'an', maxR: 2 }); }
    for (let yy = top + 30; yy < y1; yy += 44) for (let xx = x + 14; xx < x + w - 20; xx += 34) if (r() < .3) R.fill(P([[xx, yy], [xx + 14, yy], [xx + 14, yy + 20], [xx, yy + 20]]), r() < .85 ? '#e8b060' : '#a8b8d0', { group: gid + 'w' + xx + '_' + yy, maxR: 4 });
    x += w + r() * 30; }
  // the station clock tower among the roofs
  const [cx, cy, cr] = CLK;
  R.fill(P([[cx - 80, cy - 70], [cx + 80, cy - 70], [cx + 80, y1], [cx - 80, y1]]), lin(cx - 80, 0, cx + 80, 0, [[0, '#3a2a40'], [.3, '#2a1e34'], [1, '#1a1224']]), { dir: 90, group: 'tw', maxR: 16 });
  R.fill(P([[cx - 96, cy - 70], [cx, cy - 190], [cx + 96, cy - 70]]), '#1e1428', { dir: 60, group: 'twr', maxR: 10 });
  R.fill(P([[cx - 92, cy - 76], [cx + 92, cy - 76], [cx + 92, cy - 64], [cx - 92, cy - 64]]), '#5a4458', { dir: 0, group: 'twc', maxR: 4 });
  R.fill(ELL(cx, cy, cr + 8, cr + 8), '#5a4458', { group: 'clr', maxR: 4 });
  R.fill(ELL(cx, cy, cr, cr), rad(cx - 10, cy - 12, 4, cr, [[0, '#fff6dc'], [1, '#e8c88a']]), { dir: { radial: [cx, cy], off: 90 }, group: 'clk', maxR: 6 });
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU - Math.PI / 2; R.fill(ELL(cx + Math.cos(a) * (cr - 9), cy + Math.sin(a) * (cr - 9), 3, 3), '#3a2a24', { group: 'ci' + k, maxR: 2 }); }
  const hn = (f, L, w, g) => { const a = f * TAU - Math.PI / 2; R.line(c2 => { c2.moveTo(cx, cy); c2.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); }, '#2a1c18', w, { group: g, maxR: 2 }); };
  hn((11 + 58 / 60) / 12, cr * .55, 6, 'hh'); hn(58 / 60, cr * .82, 4, 'mh');
  R.tint(ELL(cx, cy, 160, 160), rad(cx, cy, 30, 160, [[0, 'rgba(255,220,160,.35)'], [1, 'rgba(255,220,160,0)']]));
  const st = paintRef(R, { R: [48, 24, 12, 6, 3], T: 13, seed: 4404 });
  plates.s4 = up(R, st, x0, y0);
}

// ======================= frame =======================
const POST = { light: [-.55, -.6, .7], norm: 3.6, amb: .8, dif: .34, spec: .24, shin: 30, sat: 1.05, expo: 1.02, vig: .34, contrast: 1.06, lightCol: [1, .95, .9], ground: [.08, .06, .1], weave: .1 };
function figure(t) { const S = poseAt(t), J = solveProfile(S), sc = secondary(q => { const p = RUN.pelvisAt(q); return [p[0], p[1] - 250]; }, 0, t); return { S, J, sc }; }
function shotS1(t) {
  const cam = camS1(t), o = { t, cam };
  plate(plates.s1, o);
  // the mirror: reflected signs and lights, broken by rain and by the splash
  for (const r of REFL) { const dx = ripple(r.x, r.y, t); dyn.push({ x: r.x + dx, y: r.y + dx * .12, ang: 0, len: r.len, wid: r.wid, c: r.c, c2: r.c.map(v => v * .8), seed: r.sd, type: KNIFE, alpha: r.a, hgt: .35 }); }
  rainRings(dyn, t, PX - PRX, PX + PRX, PY - PRY, PY + PRY, 16, (x, y) => inPud(x, y, .8), 3, 1);
  flush({ ...o, run: .4, wet: 1 });
  rainRings(dyn, t, cam.x - 560, cam.x + 560, -10, 190, 26, (x, y) => !inPud(x, y, 1.05), 9, .45);
  flush({ ...o, run: .3 });
  if (t > .45 && t < 1.75) {
    const { J, sc } = figure(t);
    // her legs mirrored in the puddle (only where the water is)
    const tmp = new Strokes(256); paintAki(tmp, J, { hemB: sc.hemB, hair: sc.hair.back });
    for (let i = 0; i < tmp.n; i++) { const b = i * F, x = tmp.a[b], y = tmp.a[b + 1]; const ry = -y * .62 + 4, hl = tmp.a[b + 3] * .4, ca = Math.cos(tmp.a[b + 2]), sa = Math.sin(tmp.a[b + 2]);
      if (y > -10 || !inPud(x + ca * hl, ry - sa * hl * .62, .85) || !inPud(x - ca * hl, ry + sa * hl * .62, .85)) continue;
      dyn.push({ x: x + ripple(x, -y * .62, t), y: -y * .62 + 4, ang: -tmp.a[b + 2], len: tmp.a[b + 3] * .8, wid: tmp.a[b + 4] * .9, c: [tmp.a[b + 5] * .4, tmp.a[b + 6] * .38, tmp.a[b + 7] * .5], seed: tmp.a[b + 11] + 1, type: KNIFE, alpha: .3, hgt: .4 }); }
    flush({ ...o, run: .2 });
    paintAki(dyn, J, { hemB: sc.hemB, hair: sc.hair.back }); flush({ ...o, run: .12 });
  }
  bigSplash(dyn, t);
  for (const c of RUN.contacts) if (c !== SPL && t >= c.t0 && t < c.t0 + .5 && Math.abs(c.x - cam.x) < 700) smallSplash(dyn, c.x, t - c.t0, 1.6, c.t0 * 10);
  flush({ ...o, run: .2 });
  rain(dyn, t, { n: 110, near: .22, alpha: .42, ang: 1.68, seed: 1, col: [.82, .8, .9] }); flush({ t, cam: SCR, hgt: .4 });
}
function shotS2(t) {
  const cam = camS2(t), sw = t < 2.95, o = { t, cam };
  if (sw) shotS1(t);   // under the paint-over sweep, the previous painting is still there
  const ap = sw ? { appear: 2.5, appDur: .14 } : {}, ua = sw ? seg(t, 2.72, 2.84) : 1;
  plate(plates.far, { t, cam: { x: FX(t), y: cam.y, zoom: cam.zoom }, ...ap, ua });
  for (const pl of plates.street) if (visX(pl, cam)) plate(pl, { ...o, ...ap, ua, wet: .5 });
  {
    for (const p of PUD2) if (Math.abs(p.x - cam.x) < 1600) rainRings(dyn, t, p.x - p.rx, p.x + p.rx, p.y - p.ry, p.y + p.ry, 3, (x, y) => ((x - p.x) / p.rx) ** 2 + ((y - p.y) / p.ry) ** 2 < .7, p.x, .8);
    flush({ ...o, run: .3 });
    const { S, J, sc } = figure(t), blink = [3.6, 5.2].some(b => t >= b && t < b + .1);
    const lay = (fx, run, c = o) => { for (let i = 0; i < dyn.n; i++) dyn.a[i * F + 14] = fx(dyn.a[i * F], dyn.a[i * F + 1]); flush({ ...c, ...ap, run }); };
    akiReflection(dyn, J); lay(appS2, .3);
    paintAki(dyn, J, { hemB: sc.hemB, hair: sc.hair.back, blink }); lay(appS2, .12);
    for (const c of RUN.contacts) if (t >= c.t0 && t < c.t0 + .5) smallSplash(dyn, c.x, t - c.t0, 1, c.t0 * 10);
    lay(appS2, .2);
    posts(dyn, cam); lay(x => clamp(x / W) * .3, .15, { t, cam: SCR });
  }
  rain(dyn, t, { n: 230, near: .25, alpha: .5, ang: 1.98, seed: 3, col: [.84, .8, .9] }); flush({ t, cam: SCR, hgt: .4 });
}
function shotS3(t) {
  const a = t - 7.5, bob = [-16 * a + 4 * Math.sin(TAU * CADENCE * a * .5), 9 * Math.sin(TAU * CADENCE * a)];
  const Mw = mul(TR(1010 + bob[0], 560 + bob[1]), mul(SC(1.55), TR(-WC[0], -WC[1]))), M = mul(Mw, TR(plates.s3.ox, plates.s3.oy));
  streaks(dyn, t); flush({ t, cam: SCR, run: .5 });
  plate(plates.s3, { t, cam: SCR, M });
  watchHands(dyn, t); flush({ t, cam: SCR, M: Mw, run: 0 });
  rain(dyn, t, { n: 90, near: .35, alpha: .4, ang: 2.2, seed: 5 }); flush({ t, cam: SCR, hgt: .4 });
}
function shotS4(t) {
  const a = t - 9.375, cam = { x: 960, y: 560 + 190 * ei(a / .625) * .8 + 40 * a, zoom: 1 };
  plate(plates.s4, { t, cam });
  const ch = t - EV.chime;
  if (ch > 0) { const k = Math.exp(-ch * 4) * ss(ch / .05);   // the dial flares on the chime and settles
    for (let i = 0; i < 4; i++) dyn.push({ x: CLK[0], y: CLK[1], ang: 0, len: CLK[2] * (2.2 + i * 1.3), wid: CLK[2] * (2.2 + i * 1.3), c: C(i ? '#ffd890' : '#fff4d8'), seed: 950 + i, type: DAB, alpha: (i ? .2 - i * .04 : .55) * k, hgt: .1 });
    flush({ t, cam, run: .3 }); }
  rain(dyn, t, { n: 200, near: .2, alpha: .48, ang: 1.72, seed: 7 }); flush({ t, cam: SCR, hgt: .4 });
}
function frame(t) {
  const id = shotAt(t)[2];
  E.begin(POST.ground);
  let post = POST;
  if (id === 'S1') shotS1(t);
  else if (id === 'S2') shotS2(t);
  else if (id === 'S3') { shotS3(t); post = { ...POST, spec: .3, shin: 34 }; }
  else { shotS4(t); const ch = t - EV.chime, k = ch > 0 ? Math.exp(-ch * 3.2) * ss(ch / .08) : 0;   // the light rakes on the chime
    post = { ...POST, light: [lerp(-.55, -.9, k), lerp(-.6, -.3, k), lerp(.7, .32, k)], dif: lerp(.3, .5, k), spec: lerp(.24, .34, k) }; }
  E.finish(post);
}

async function setup() {
  await document.fonts.load('700 80px Cormorant');
  E = new Impasto(document.getElementById('c'), { W, H, ss: 2 }); dyn = new Strokes(16384);
  buildS1(); buildReflections(); buildFar(); buildStreet(); buildS3(); buildS4();
  window.DUR = DUR; window.render = t => frame(t);
  window.RIGQA = t => { const id = shotAt(t)[2]; if (id === 'S1' && !(t > .45 && t < 1.75)) return null; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
  window.READY = true;
}
window.DUR = DUR;
setup();
