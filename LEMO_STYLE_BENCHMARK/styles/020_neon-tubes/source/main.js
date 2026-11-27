// 020 · Neon Tubes — the first 10 s of "Last Train Home" on a rainy night street of real neon signs (lemo-opuscar
// styles/neon-tubes): bent glass tubes on painted boards, struck on the beat, lighting the wet walls and doubling in the
// puddles. AKI is a figure made of tubes, as the medium wants: one bent clear-neon outline per pose (red-orange: her coat),
// a purple phosphor tube for the bob, a white eye, a yellow ring for the watch; she moves by switching poses on the 16th-note
// grid of the reference's 96 BPM, never tweened. Her outline for each pose is traced from the shared rig's silhouette.
// Signs strike in sequence as she passes; the watch insert is a macro on her own tubes; a clock sign strikes on the chime.
// Engine: gl.js and lib.js copied unchanged from the style's demo; the layer/tube drawing helpers below (strike, hum, tfStreet,
// drawTube, bands, dome, the facade and rain loops) are adapted from the demo's film.js; street, signs and figure are new.
// Page contract: window.render(t), DUR, READY, RIGQA.
import { clamp, lerp, seg, ss, eio, eo, hsh, track, at, sub, cumlen, tubeFromStrokes } from './engine/lib.js';
import { makeGL } from './engine/gl.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { back } from './shared/lib/util.js';

const W = 1920, H = 1080, F = 1.3 * W, TOP = 2 * H, CHT = H + TOP, EW = W >> 1, EH = CHT >> 1;
const BEAT = .625, SIXT = BEAT / 4;                       // 96 BPM (the reference's tempo)
// gas colours (linear emission): clear neon = red-orange (hers alone), clear argon-mercury = blue, the rest phosphor-coated
const GAS = { neon: [1.0, .11, .035], argon: [.24, .46, 1.0], green: [.22, 1.0, .36], white: [.92, .9, 1.0], pink: [1.0, .24, .62], purple: [.66, .28, 1.0], turq: [.12, .95, .85], yellow: [1.0, .72, .16] };
const CLEAR = { neon: true, argon: true };

// ——— power ———
function strike(t, t0, sd = 0) { const d = t - t0; if (d < 0) return 0; const j = hsh(sd) * .03;
  if (d < .05 + j) return 1; if (d < .12 + j) return 0; if (d < .17 + j) return .7; if (d < .23 + j) return .08; return Math.min(1, .6 + (d - .23 - j) * 5); }
const hum = (t, sd) => 1 - .03 * hsh(Math.floor(t * 30) * 1.7 + sd);

// ——— the run (shared rig) in metres: 600 rig units = 1.6 m ———
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const KS = 1.6 / 600, XOFF = 2.0 - SPL.x * KS, FOOT_Y = .14;   // her feet run along the wall base, 14 cm above the pavement
const mX = x => XOFF + x * KS, mY = y => FOOT_Y - y * KS;
function poseAt(t) {
  const S = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  const w = clamp(up, 0, 1.1) * (1 - dn); S.watch = w;
  if (w > 0) { const J0 = solveProfile(S), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S.arms.f.sh *= 1 - .45 * wm; S.head += .26 * wm; S.neck += .08 * wm; }
  return S;
}
// the switch grid: one pose per 16th note. In the watch insert she holds the frame in which she looks at her wrist.
const HOLD_K = Math.round(6.62 / SIXT);
const keyOf = t => { const id = shotAt(t)[2]; return id === 'S3' ? HOLD_K : Math.floor(t / SIXT + 1e-6); };

// ——— monoline capitals on a 10-unit cap height (centrelines in stroke order; one tube per letter, strokes joined by painted double-backs) ———
const C_ = [[5.5, 1.5], [3.8, .3], [1.8, .6], [.5, 3], [.4, 6], [1.5, 9], [3.5, 9.8], [5.6, 8.5]];
const LAT = {
  '2': { w: 6, u: [[[.5, 2.5], [1.5, .6], [3.5, .2], [5.2, 1.4], [5, 3.5], [.5, 9.5], [5.8, 9.5]]] }, '4': { w: 6, u: [[[4.2, 9.5], [4.2, .5], [.2, 7], [6, 7]]] },
  H: { w: 5.6, u: [[[.5, .2], [.5, 9.8]], [[.5, 5], [5.1, 5]], [[5.1, .2], [5.1, 9.8]]] }, C: { w: 5.8, u: [C_] }, A: { w: 6, u: [[[.2, 9.8], [3, .2], [5.8, 9.8]], [[1.3, 6.2], [4.7, 6.2]]] },
  F: { w: 5.2, u: [[[5.2, .4], [.8, .4], [.8, 9.8]], [[.8, 4.8], [4.5, 4.8]]] }, E: { w: 5.4, u: [[[5.4, .4], [.8, .4], [.8, 9.6], [5.5, 9.6]], [[.8, 4.8], [4.5, 4.8]]] },
  B: { w: 5.6, u: [[[.8, 9.6], [.8, .4], [4, .4], [5.2, 1.5], [5, 3.8], [3.8, 4.8], [.8, 4.8]], [[3.8, 4.8], [5.5, 6], [5.6, 8.2], [4.2, 9.6], [.8, 9.6]]] },
  K: { w: 5.6, u: [[[.8, .2], [.8, 9.8]], [[5.5, .2], [1, 5.5], [5.6, 9.8]]] }, R: { w: 5.6, u: [[[.8, 9.8], [.8, .4], [4, .4], [5.2, 1.6], [5, 3.8], [3.8, 4.8], [.8, 4.8], [3, 4.8], [5.6, 9.8]]] },
  Y: { w: 6, u: [[[.2, .2], [3, 5]], [[5.8, .2], [3, 5], [3, 9.8]]] }, O: { w: 5.8, u: [[[3, .2], [1, 1.2], [.3, 5], [1, 8.8], [3, 9.8], [5, 8.8], [5.7, 5], [5, 1.2], [3, .2]]] },
  S: { w: 5.6, u: [[[5.4, 1.4], [3.6, .2], [1.4, .6], [.6, 2.5], [2, 4.4], [4.2, 5.4], [5.5, 7.4], [4.6, 9.4], [2.2, 9.8], [.4, 8.5]]] },
  N: { w: 5.6, u: [[[.6, 9.8], [.6, .2], [5, 9.8], [5, .2]]] }, D: { w: 5.8, u: [[[.8, .4], [.8, 9.6], [3, 9.6], [5, 8.2], [5.7, 5], [5, 1.8], [3, .4], [.8, .4]]] },
  L: { w: 5, u: [[[.8, .2], [.8, 9.6], [5.2, 9.6]]] }, T: { w: 6, u: [[[.2, .4], [5.8, .4]], [[3, .4], [3, 9.8]]] }, P: { w: 5.6, u: [[[.8, 9.8], [.8, .4], [4, .4], [5.2, 1.6], [5, 3.8], [3.8, 4.8], [.8, 4.8]]] },
  M: { w: 6.4, u: [[[.4, 9.8], [.6, .2], [3.2, 6], [5.8, .2], [6, 9.8]]] }, U: { w: 5.6, u: [[[.6, .2], [.6, 7], [1.8, 9.4], [3, 9.8], [4.4, 9.4], [5.4, 7], [5.4, .2]]] },
  W: { w: 7, u: [[[.2, .2], [1.6, 9.8], [3.5, 3.5], [5.4, 9.8], [6.8, .2]]] }, I: { w: 1.6, u: [[[.8, .2], [.8, 9.8]]] },
};
function latin(word, x0, ytop, h, opt = {}) { const tubes = []; let x = x0; const sp = 2.6;
  for (const ch of word) { if (ch === ' ') { x += 4.2 * h / 10; continue; } const L = LAT[ch]; tubes.push(tubeFromStrokes(L.u.map(st => st.map(([gx, gy]) => [x + gx / 10 * h, ytop - gy / 10 * h])), { fil: h * .06, D: opt.D ?? .016, ...opt })); x += (L.w + sp) * h / 10; }
  return { tubes, w: x - x0 - sp * h / 10 }; }
const latinW = (word, h) => { let x = 0; for (const ch of word) x += ch === ' ' ? 4.2 * h / 10 : (LAT[ch].w + 2.6) * h / 10; return x - 2.6 * h / 10; };

// ——— the street (metres; x along the facade, y up from the pavement) ———
// buildings: [x0, x1, type (0 brick, 1 mosaic tile, 2 plaster), seed], tint
const BUILDINGS = [[[-15, 4.6, 0, 2], [.24, .14, .12]], [[4.6, 11.2, 1, 3], [.36, .42, .44]], [[11.2, 17.0, 2, 4], [.42, .38, .32]], [[17.0, 18.4, 2, 9], [.035, .035, .04]],
  [[18.4, 25.5, 0, 5], [.22, .14, .12]], [[25.5, 31.2, 1, 6], [.4, .44, .5]], [[31.2, 38.5, 2, 7], [.33, .33, .35]], [[38.5, 60, 0, 8], [.25, .16, .14]]];
const FRONTS = [];   // [x0, y0, x1, y1, kind, light colour]
const WORDS = [['24H', 'argon'], ['CAFE', 'green'], ['BAKERY', 'yellow'], ['BOOKS', 'white'], ['NOODLES', 'pink'], ['HOTEL', 'turq'], ['BAR', 'purple'], ['LAUNDRY', 'argon'], ['FLOWERS', 'green'], ['RECORDS', 'white']];
const BOARD = { argon: ['#0a1626', '#1c2a3a'], green: ['#0b1d12', '#1d3324'], yellow: ['#241a08', '#3a2e14'], white: ['#16161c', '#2a2a32'], pink: ['#240a16', '#3a1c2a'], turq: ['#06201c', '#163430'], purple: ['#1a0a24', '#2e1c3a'] };
const SIGNS = [];
{ let x = -2.4, i = 0; const lc = [[.3, .2, .1], [.14, .2, .22], [.32, .22, .1], [.2, .12, .2], [.3, .18, .08]];
  while (x < 40) { const w = 3.2 + hsh(i * 3.1) * 1.2; if (Math.abs(x + w / 2 - 17.7) < 2.2) { x += 1.6; continue; }   // the dark alley at 17–18.4 m
    FRONTS.push([x + .2, .32, x + w * .7, 2.4, 'win', lc[i % 5]]); FRONTS.push([x + w * .74, 0, x + w - .2, 2.3, 'door', lc[i % 5].map(v => v * .7)]);
    const [word, gas] = WORDS[i % WORDS.length], h = .42, ww = latinW(word, h), cx = x + w / 2, top = 3.42;
    const tubes = latin(word, cx - ww / 2, top, h, { col: GAS[gas], coat: !CLEAR[gas], circ: 'sign' + i, z: .05 }).tubes;
    SIGNS.push({ i, x: cx, gas, word, tubes, backer: { x0: cx - ww / 2 - .22, y0: 2.78, x1: cx + ww / 2 + .22, y1: 3.62, col: BOARD[gas][0], trim: BOARD[gas][1] } });
    x += w; i++; } }
const UPPER = []; for (let x = -12; x < 42; x += 2.4) for (const [y0, y1] of [[4.9, 6.0], [6.7, 7.8]]) { const k = Math.round(x * 3 + y0); UPPER.push([x + .3, y0, x + 1.4, y1, k % 5 === 1 ? [.3, .2, .1] : k % 7 === 2 ? [.12, .16, .2] : null, k]); }
const AC = [[-3.8, 4.5], [6.2, 4.6], [14.1, 5.4], [21.5, 4.6], [29.8, 4.7], [36.5, 6.4]];
// the clock sign for the last shot: a big white phosphor ring with ticks and hands, high on the corner building
const CLK = { x: 35.6, y: 5.6, r: 1.0 };
const clockTubes = (() => { const P = []; for (let k = 0; k <= 64; k++) { const a = .12 + k / 64 * (Math.PI * 2 - .24); P.push([CLK.x + Math.sin(a) * CLK.r, CLK.y - Math.cos(a) * CLK.r]); }
  const ring = tubeFromStrokes([P], { col: GAS.white, coat: true, circ: 'clock', D: .03, fil: .02, z: .06 });
  const ticks = []; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, r0 = CLK.r * (k % 3 ? .78 : .7); ticks.push([[CLK.x + Math.sin(a) * r0, CLK.y + Math.cos(a) * r0], [CLK.x + Math.sin(a) * CLK.r * .86, CLK.y + Math.cos(a) * CLK.r * .86]]); }
  const tk = tubeFromStrokes(ticks, { col: GAS.white, coat: true, circ: 'clock', D: .02, fil: .005, z: .06 });
  const hh = (11 + 58 / 60) / 12 * Math.PI * 2, mm = 58 / 60 * Math.PI * 2;
  const hands = tubeFromStrokes([[[CLK.x + Math.sin(hh) * CLK.r * .45, CLK.y + Math.cos(hh) * CLK.r * .45], [CLK.x, CLK.y], [CLK.x + Math.sin(mm) * CLK.r * .66, CLK.y + Math.cos(mm) * CLK.r * .66]]], { col: GAS.white, coat: true, circ: 'clock', D: .024, fil: .01, z: .065 });
  return [ring, tk, hands]; })();
// strike times: the two signs by the puddle are on from the start; the others strike on the 8th-note grid as she comes within 3.5 m
const xAt = t => mX(RUN.pelvisAt(t)[0]);
for (const s of SIGNS) { if (s.x < 6) { s.on = -1; continue; } let t = 2.5; while (t < 12 && xAt(t) < s.x - 3.5) t += .02; s.on = Math.max(2.82, Math.ceil(t / (BEAT / 2)) * (BEAT / 2)); }

// ——— AKI's tubes for one pose: the rig's silhouette rendered small, its outer contour traced, smoothed and bent into one tube ———
const MASK = document.createElement('canvas'); MASK.width = 520; MASK.height = 760; const MX = MASK.getContext('2d', { willReadFrequently: true });
const MOX = 260, MOY = 700;   // rig origin (feet line) inside the mask, 1 px per rig unit
function silhouette(J) {
  const g = MX; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, 520, 760); g.translate(MOX - J.pelvis[0], MOY); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round';
  const seg2 = (a, b, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
  for (const k of ['f', 'n']) { const l = J.leg[k]; seg2(l.hip, l.knee, 50); seg2(l.knee, l.ankle, 40); const c = Math.cos(l.pitch), s = Math.sin(l.pitch); seg2(l.ankle, [l.ankle[0] + 52 * c - 8 * s, l.ankle[1] + 52 * s + 8 * c], 30); }
  for (const k of ['f', 'n']) { const a = J.arm[k]; seg2(a.sh, a.el, 38); seg2(a.el, a.wr, 32); g.beginPath(); g.arc(a.wr[0] + (a.wr[0] - a.el[0]) * .14, a.wr[1] + (a.wr[1] - a.el[1]) * .14, 18, 0, 7); g.fill(); }
  const nb = J.neckBase, pv = J.pelvis, uL = J.uL, fL = J.fL, T = (b, up, fw) => [b[0] + uL[0] * up + fL[0] * fw, b[1] + uL[1] * up + fL[1] * fw];
  g.beginPath(); [T(nb, -2, 16), T(nb, -4, -18), T(nb, -18, -32), T(J.waist, 0, -34), T(pv, -80, -50), T(pv, -84, 44), T(J.waist, 0, 28), T(nb, -40, 30)].forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.fill();
  seg2(nb, J.neckTop, 26);
  const hc = [J.headC[0], J.headC[1] - 6], c = Math.cos(J.headA), s = Math.sin(J.headA), HP = ([u, v]) => [hc[0] + u * c - v * s, hc[1] + u * s + v * c];
  g.beginPath(); [[0, -40], [26, -35], [40, -18], [44, -4], [51, 5], [44, 12], [42, 24], [30, 38], [10, 45], [-14, 41], [-30, 27], [-37, 4], [-30, -22], [-16, -36]].map(HP).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.fill();
  g.beginPath(); [[12, -46], [-14, -50], [-38, -38], [-52, -10], [-54, 22], [-50, 54], [-34, 62], [-18, 56], [-10, 20], [8, -26]].map(HP).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.fill();
  return { HP, hc, ox: J.pelvis[0] - MOX, oy: -MOY };
}
function traceOuter() {   // Moore-neighbour tracing (backtrack rule) of the outer boundary of the figure's blob
  const d = MX.getImageData(0, 0, 520, 760).data, on = (x, y) => x >= 0 && y >= 0 && x < 520 && y < 760 && d[(y * 520 + x) * 4] > 127;
  let sx = -1, sy = -1; outer: for (let y = 0; y < 760; y++) for (let x = 0; x < 520; x++) if (on(x, y)) { sx = x; sy = y; break outer; }
  if (sx < 0) return [];
  const N = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]];   // clockwise from west
  const idx = (dx, dy) => N.findIndex(([a, b]) => a === dx && b === dy);
  const out = [[sx, sy]]; let cx = sx, cy = sy, b = 0;   // the start's west neighbour is background (row scan from the left)
  for (let guard = 0; guard < 40000; guard++) {
    let moved = false;
    for (let i = 1; i <= 8; i++) { const k = (b + i) % 8, nx = cx + N[k][0], ny = cy + N[k][1];
      if (on(nx, ny)) { const pk = (k + 7) % 8, px = cx + N[pk][0], py = cy + N[pk][1]; cx = nx; cy = ny; b = idx(px - cx, py - cy); moved = true; break; } }
    if (!moved) break;
    if (cx === sx && cy === sy && out.length > 2) break;
    out.push([cx, cy]);
  }
  return out;
}
function rdp(P, eps) { if (P.length < 3) return P; let dm = 0, im = 0; const [a, b] = [P[0], P[P.length - 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  for (let i = 1; i < P.length - 1; i++) { const dd = Math.abs((b[0] - a[0]) * (a[1] - P[i][1]) - (a[0] - P[i][0]) * (b[1] - a[1])) / L; if (dd > dm) { dm = dd; im = i; } }
  return dm > eps ? [...rdp(P.slice(0, im + 1), eps).slice(0, -1), ...rdp(P.slice(im), eps)] : [a, b]; }
function chaikin(P, n = 2) { let Q = P; for (let k = 0; k < n; k++) { const R = [Q[0]]; for (let i = 0; i < Q.length - 1; i++) { const a = Q[i], b = Q[i + 1]; R.push([.75 * a[0] + .25 * b[0], .75 * a[1] + .25 * b[1]], [.25 * a[0] + .75 * b[0], .25 * a[1] + .75 * b[1]]); } R.push(Q[Q.length - 1]); Q = R; } return Q; }
const FIG = new Map();
function figureTubes(k) {
  if (FIG.has(k)) return FIG.get(k);
  const S = poseAt(k * SIXT), J = solveProfile(S), sil = silhouette(J); let P = traceOuter();
  // open the contour on her back at waist height (the electrodes sit there, behind the coat)
  const bw = [J.waist[0] - J.fL[0] * 34 - sil.ox, J.waist[1] - J.fL[1] * 34 - sil.oy]; let bi = 0, bd = 1e9; P.forEach(([x, y], i) => { const dd = Math.hypot(x - bw[0], y - bw[1]); if (dd < bd) { bd = dd; bi = i; } });
  if (P.length < 40) { const empty = {}; FIG.set(k, empty); return empty; }
  P = [...P.slice(bi), ...P.slice(0, bi)]; P = P.slice(6, P.length - 6);
  P = chaikin(rdp(P, 2.2), 2).map(([x, y]) => [mX(x + sil.ox), mY(y + sil.oy)]);
  const out = { outline: tubeFromStrokes([P], { col: GAS.neon, coat: false, circ: 'aki', D: .018, fil: .012, z: .05 }) };
  // the bob in purple phosphor (crown → back → tips, then the bangs), the eye in white, the watch ring in yellow on the left wrist
  const hp = pts => pts.map(sil.HP).map(([x, y]) => [mX(x), mY(y)]);
  out.hair = tubeFromStrokes([hp([[20, -36], [-6, -44], [-32, -34], [-44, -8], [-46, 22], [-40, 48], [-30, 54]]), hp([[-20, -30], [6, -36], [28, -26], [36, -12]])], { col: GAS.purple, coat: true, circ: 'aki.hair', D: .011, fil: .008, z: .052 });
  out.eye = tubeFromStrokes([hp([[20, -6], [30, -4]])], { col: GAS.white, coat: true, circ: 'aki.eye', D: .008, fil: .002, z: .053, ties: false });
  const an = J.arm.n, dx = an.wr[0] - an.el[0], dy = an.wr[1] - an.el[1], dl = Math.hypot(dx, dy) || 1, wc = [an.wr[0] - dx / dl * 10, an.wr[1] - dy / dl * 10], R = (S.watch || 0) > .3 ? 17 : 13;
  const ring = []; for (let j = 0; j <= 24; j++) { const a = .3 + j / 24 * (Math.PI * 2 - .6); ring.push([mX(wc[0] + Math.cos(a) * R), mY(wc[1] + Math.sin(a) * R)]); }
  out.watch = tubeFromStrokes([ring], { col: GAS.yellow, coat: true, circ: 'aki.watch', D: .009, fil: .004, z: .054, ties: false });
  out.wc = [mX(wc[0]), mY(wc[1])]; out.wr = R * KS; out.watchW = S.watch || 0; out.J = J;
  // a tiny dial for the macro: four ticks and the hands (white), the second hand added per second at draw time
  const ticks = []; for (let j = 0; j < 4; j++) { const a = j / 4 * Math.PI * 2, r0 = out.wr * .62, r1 = out.wr * .84; ticks.push([[out.wc[0] + Math.sin(a) * r0, out.wc[1] + Math.cos(a) * r0], [out.wc[0] + Math.sin(a) * r1, out.wc[1] + Math.cos(a) * r1]]); }
  out.ticks = tubeFromStrokes(ticks, { col: GAS.white, coat: true, circ: 'aki.watch', D: .0026, fil: .001, z: .055, ties: false, ends: false });
  const hh = (11 + 58 / 60) / 12 * Math.PI * 2, mm = 58 / 60 * Math.PI * 2;
  out.hands = tubeFromStrokes([[[out.wc[0] + Math.sin(hh) * out.wr * .42, out.wc[1] + Math.cos(hh) * out.wr * .42], out.wc, [out.wc[0] + Math.sin(mm) * out.wr * .62, out.wc[1] + Math.cos(mm) * out.wr * .62]]], { col: GAS.white, coat: true, circ: 'aki.watch', D: .003, fil: .001, z: .056, ties: false, ends: false });
  if (FIG.size > 300) FIG.clear(); FIG.set(k, out); return out;
}

// ——— cameras: [lx, ly, K (px per metre at the wall), eye height E] ———
const camS1 = t => ({ lx: 2.0 + .05 * t, ly: .3, K: 600, E: .3 });
const camS2 = t => ({ lx: xAt(t) + 1.3, ly: 1.62, K: 265, E: 1.62 });
const camS3 = t => { const f = figureTubes(HOLD_K), b = .004 * Math.sin((t - FIRST_STEP) * CADENCE * Math.PI); return { lx: f.wc[0] + .012, ly: f.wc[1] + b, K: 4400, E: f.wc[1] }; };
const camS4 = t => { const k = eio(seg(t, 9.4, 10.4)); return { lx: CLK.x - 2.6, ly: lerp(4.4, 4.0, k), K: lerp(100, 104, k), E: lerp(6.2, 5.6, k) }; };
function cam(t) { const id = shotAt(t)[2], c = id === 'S1' ? camS1(t) : id === 'S2' ? camS2(t) : id === 'S3' ? camS3(t) : camS4(t); return { ...c, shot: id, D: F / c.K }; }

// ——— layers and tube drawing (adapted from the demo's film.js) ———
const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const CV = { prof: mkc(W, CHT), tcol: mkc(W, CHT), ovl: mkc(W, CHT), add: mkc(W, CHT), emit: mkc(EW, EH), rain: mkc(W, H) };
const X = Object.fromEntries(Object.entries(CV).map(([k, c]) => [k, c.getContext('2d')]));
const rgb = (c, m = 1) => `rgb(${Math.round(clamp(c[0] * m) * 255)},${Math.round(clamp(c[1] * m) * 255)},${Math.round(clamp(c[2] * m) * 255)})`;
function tfStreet(c, z) { const d = c.D - z; if (d < .05) return null; const Kz = F / d; return { m: [Kz, 0, 0, -Kz, W / 2 - c.lx * Kz, TOP + H / 2 + c.K * (c.ly - c.E) + Kz * c.E], K: Kz }; }
const setT = (ctx, tf) => { const m = tf.m; ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]); };
const setE = tf => { const m = tf.m; X.emit.setTransform(m[0] / 2, m[1] / 2, m[2] / 2, m[3] / 2, m[4] / 2, m[5] / 2); };
const MAT = { clear: 0, coat: 85, paint: 170, metal: 255 };
function bands(ctx, path, D, K, mat) { const N = clamp(Math.round(D * K / 2.2), 2, 28); for (let i = 0; i < N; i++) { const f = 1 - i / N, r = 1 - (i + .5) / N, h = Math.sqrt(Math.max(0, 1 - r * r)); ctx.strokeStyle = `rgb(${Math.round((.1 + .9 * h) * 255)},${mat},0)`; ctx.lineWidth = Math.max(D * f, (i ? .6 : 1.3) / K); ctx.stroke(path); } }
function dome(ctx, x, y, R, K, mat) { const N = clamp(Math.round(R * 2 * K / 2.2), 2, 24); for (let i = 0; i < N; i++) { const f = 1 - i / N, r = 1 - (i + .5) / N, h = Math.sqrt(Math.max(0, 1 - r * r)); ctx.fillStyle = `rgb(${Math.round((.1 + .9 * h) * 255)},${mat},0)`; ctx.beginPath(); ctx.arc(x, y, Math.max(R * f, .7 / K), 0, 6.2832); ctx.fill(); } }
function drawTube(Tb, tf, st, pass, opt = {}) {
  const K = tf.K, D = Tb.D, P = X.prof, Cc = X.tcol, E = X.emit, p = st.p, col = st.col || Tb.col, lit1 = Tb.len * (st.fill ?? 1);
  setT(P, tf); setT(Cc, tf); setE(tf); P.lineCap = Cc.lineCap = E.lineCap = 'round'; P.lineJoin = Cc.lineJoin = E.lineJoin = 'round';
  for (const g of Tb.paths) {
    if (g.paint !== (pass === 0)) continue;
    const mat = g.paint ? MAT.paint : Tb.coat ? MAT.coat : MAT.clear;
    bands(P, g.path, D, K, mat); Cc.setLineDash([]); Cc.strokeStyle = '#000'; Cc.lineWidth = D + 1 / K; Cc.stroke(g.path);
    if (g.paint) continue;
    const a = g.a, b = Math.min(g.b, lit1); if (b <= a || p < .003) continue;
    const dash = b < g.b ? [0, 0, b - a, 1e4] : [];
    Cc.setLineDash(dash); Cc.strokeStyle = rgb(col, p); Cc.lineWidth = D + .5 / K; Cc.stroke(g.path);
    E.setLineDash(dash); E.globalAlpha = p; E.strokeStyle = rgb(col, .55); E.lineWidth = Math.max(D * 1.9, 2.4 / K); E.stroke(g.path); E.strokeStyle = rgb(col); E.lineWidth = Math.max(D * .8, 1.2 / K); E.stroke(g.path); E.globalAlpha = 1;
  }
  Cc.setLineDash([]); E.setLineDash([]);
  if (pass === 1) {
    if (Tb.ties && !opt.noTies) { P.strokeStyle = 'rgb(150,255,0)'; P.lineWidth = Math.max(D * .11, .7 / K); P.lineCap = 'butt'; P.beginPath(); for (const [x, y, tx, ty] of Tb.tiesAt) { P.moveTo(x - ty * D * .62, y + tx * D * .62); P.lineTo(x + ty * D * .62, y - tx * D * .62); } P.stroke(); P.lineCap = 'round'; }
    if (Tb.ends) [Tb.pts[0], Tb.pts[Tb.pts.length - 1]].forEach((q, i) => { if (!Tb.caps[i]) return; const cr = D * (D < .013 ? .62 : .78); dome(P, q[0], q[1], cr, K, MAT.paint); Cc.fillStyle = '#000'; Cc.beginPath(); Cc.arc(q[0], q[1], cr * 1.02, 0, 6.2832); Cc.fill(); });
  }
}
const rect = (ctx, x0, y0, x1, y1) => ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
function drawFacade(c, t) {
  const tf = tfStreet(c, 0); if (!tf) return;
  const O = X.ovl, Ad = X.add; setT(O, tf); setT(Ad, tf); setE(tf);
  const vx0 = c.lx - W / 2 / tf.K - 1, vx1 = c.lx + W / 2 / tf.K + 1, vis = (a, b) => b > vx0 && a < vx1;
  for (const [x0, y0, x1, y1, kind, lc] of FRONTS) { if (!vis(x0, x1)) continue;
    O.fillStyle = '#26262a'; rect(O, x0 - .06, y0 - .02, x1 + .06, y1 + .06); O.fillStyle = '#3a3a3e'; rect(O, x0 - .1, 2.42, x1 + .1, 2.68);
    O.fillStyle = '#050608'; rect(O, x0, y0, x1, y1); O.fillStyle = '#2c2c30';
    if (kind === 'win') { const n = Math.max(1, Math.round((x1 - x0) / 1.3)); for (let k = 1; k < n; k++) { const xx = x0 + (x1 - x0) * k / n; rect(O, xx - .03, y0, xx + .03, y1); } rect(O, x0, y0 + (y1 - y0) * .78, x1, y0 + (y1 - y0) * .78 + .04); }
    else rect(O, x0 + .04, 1.0, x1 - .04, 1.06);
    const on = .55, gr = Ad.createLinearGradient(0, y1, 0, y0); gr.addColorStop(0, rgb(lc, .42 * on)); gr.addColorStop(.25, rgb(lc, .2 * on)); gr.addColorStop(.7, rgb(lc, .1 * on)); gr.addColorStop(1, rgb(lc, .05 * on));
    Ad.fillStyle = gr; rect(Ad, x0 + .02, y0 + .02, x1 - .02, y1 - .02);
    for (let xx = x0 + .35; xx < x1 - .2; xx += .9) { const lg = Ad.createRadialGradient(xx, y1 - .12, 0, xx, y1 - .12, .5); lg.addColorStop(0, rgb(lc, 1.6 * on)); lg.addColorStop(.15, rgb(lc, .5 * on)); lg.addColorStop(1, rgb(lc, 0)); Ad.fillStyle = lg; rect(Ad, xx - .5, y1 - .62, xx + .5, y1 - .02); }
    setE(tf); X.emit.globalCompositeOperation = 'lighter'; X.emit.fillStyle = rgb(lc, .25 * on); rect(X.emit, x0, y0, x1, y1);
    O.fillStyle = 'rgba(120,130,150,0.06)'; O.beginPath(); O.moveTo(x0 + .2, y0); O.lineTo(x0 + .6, y0); O.lineTo(x0 + 1.1, y1); O.lineTo(x0 + .7, y1); O.fill(); }
  for (const [x0, y0, x1, y1, lit] of UPPER) { if (!vis(x0, x1)) continue;
    O.fillStyle = '#323034'; rect(O, x0 - .08, y0 - .1, x1 + .08, y1 + .06); O.fillStyle = '#07080b'; rect(O, x0, y0, x1, y1);
    O.fillStyle = '#2a2a2e'; rect(O, (x0 + x1) / 2 - .025, y0, (x0 + x1) / 2 + .025, y1); rect(O, x0, y0 + .62, x1, y0 + .66);
    if (lit) { const gr = Ad.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, rgb(lit, .18)); gr.addColorStop(1, rgb(lit, .32)); Ad.fillStyle = gr; rect(Ad, x0 + .03, y0 + .03, x1 - .03, y1 - .03); Ad.fillStyle = '#000'; rect(Ad, x0 + .03, y0 + .03, x0 + .03 + (x1 - x0) * .28, y1 - .03); X.emit.fillStyle = rgb(lit, .18); rect(X.emit, x0, y0, x1, y1); } }
  for (const [x, y] of AC) { if (!vis(x - 1, x + 1)) continue; O.fillStyle = '#8a8a86'; rect(O, x - .4, y - .28, x + .4, y + .28); O.fillStyle = '#5a5a58'; O.beginPath(); O.arc(x + .12, y, .2, 0, 6.3); O.fill(); O.strokeStyle = '#3a3a38'; O.lineWidth = .012; for (let k = -3; k <= 3; k++) { O.beginPath(); O.moveTo(x + .12 + k * .05, y - .2); O.lineTo(x + .12 + k * .05, y + .2); O.stroke(); } }
  O.fillStyle = '#3a3836'; for (const x of [4.6, 11.2, 25.5, 31.2]) if (vis(x, x)) { rect(O, x - .05, 0, x + .05, 8.2); }
  for (const s of SIGNS) { const b = s.backer; if (!vis(b.x0, b.x1)) continue; O.fillStyle = b.trim; rect(O, b.x0 - .035, b.y0 - .035, b.x1 + .035, b.y1 + .035); O.fillStyle = b.col; rect(O, b.x0, b.y0, b.x1, b.y1);
    O.fillStyle = 'rgba(200,200,200,0.35)'; for (const [rx, ry] of [[b.x0 + .05, b.y0 + .05], [b.x1 - .05, b.y0 + .05], [b.x0 + .05, b.y1 - .05], [b.x1 - .05, b.y1 - .05]]) { O.beginPath(); O.arc(rx, ry, .012, 0, 6.3); O.fill(); }
    O.fillStyle = '#4c4e50'; rect(O, b.x1 + .12, 2.9, b.x1 + .36, 3.3); }   // the transformer box beside each sign
  if (vis(CLK.x - 1.2, CLK.x + 1.2)) { O.fillStyle = '#121418'; O.beginPath(); O.arc(CLK.x, CLK.y, CLK.r + .16, 0, 6.3); O.fill(); O.fillStyle = '#1e2228'; O.beginPath(); O.arc(CLK.x, CLK.y, CLK.r + .1, 0, 6.3); O.fill(); }
}
const NR = 2600, RAIN = Array.from({ length: NR }, (_, i) => [lerp(-8, 46, hsh(i * 1.13)), lerp(.05, 14, Math.pow(hsh(i * 2.71 + 5), .9)), hsh(i * 3.97 + 1) * 6, 6.5 + hsh(i * 5.3) * 2.0]);
function drawRain(c, t) {
  const R = X.rain; R.setTransform(1, 0, 0, 1, 0, 0); R.clearRect(0, 0, W, H); const c0 = H / 2 + c.K * (c.ly - c.E); R.lineCap = 'round'; const buckets = [[], [], []];
  for (let i = 0; i < NR; i++) { const [x, z, y0, v] = RAIN[i], dist = c.D - z; if (dist < .15) continue; const y = 5.8 - ((y0 + v * t) % 6); if (y < -.05) continue; const kd = F / dist, sx = W / 2 + (x - c.lx) * kd; if (sx < -20 || sx > W + 20) continue;
    const sy = c0 - (y - c.E) * kd, len = v * .018 * kd; if (sy < -len || sy - len > H) continue; const wpx = .0025 * kd, b = wpx < 1.6 ? 0 : wpx < 5 ? 1 : 2; buckets[b].push(sx, sy - len, sx, sy); }
  const al = [.42, .22, .1]; buckets.forEach((B, bi) => { if (!B.length) return; R.strokeStyle = `rgba(255,255,255,${al[bi]})`; R.lineWidth = bi === 0 ? .8 : bi === 1 ? 4 : 9; R.beginPath(); for (let i = 0; i < B.length; i += 4) { R.moveTo(B[i], B[i + 1]); R.lineTo(B[i + 2], B[i + 3]); } R.stroke(); });
}
function clearLayers() {
  for (const k of ['prof', 'tcol', 'add']) { const x = X[k]; x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.fillStyle = '#000'; x.fillRect(0, 0, W, CHT); }
  X.ovl.setTransform(1, 0, 0, 1, 0, 0); X.ovl.clearRect(0, 0, W, CHT);
  X.emit.setTransform(1, 0, 0, 1, 0, 0); X.emit.globalCompositeOperation = 'source-over'; X.emit.fillStyle = '#000'; X.emit.fillRect(0, 0, EW, EH); X.emit.globalCompositeOperation = 'lighter';
}

// ——— the street, the signs, AKI ———
function drawAll(c, t) {
  drawFacade(c, t); X.emit.globalCompositeOperation = 'lighter';
  const tf = tfStreet(c, .05); if (!tf) return;
  const vx0 = c.lx - W / 2 / tf.K - .6, vx1 = c.lx + W / 2 / tf.K + .6;
  for (const pass of [0, 1]) for (const s of SIGNS) { if (s.backer.x1 < vx0 || s.backer.x0 > vx1) continue; const p = (s.on < 0 ? 1 : strike(t, s.on, s.i)) * hum(t, s.i);
    for (const tb of s.tubes) drawTube(tb, tf, { p, fill: 1 }, pass, { noTies: true }); }
  // the clock: cold milky glass until the chime, then it strikes (two flashes and a ramp)
  if (CLK.x + 1 > vx0 && CLK.x - 1 < vx1) { const p = t < EV.chime ? .06 : strike(t, EV.chime, 7) * hum(t, 7); for (const pass of [0, 1]) for (const tb of clockTubes) drawTube(tb, tf, { p, fill: 1 }, pass); }
  // AKI: the pose of the current 16th, all her tubes lit (no afterglow on a run: one figure must never read as two)
  const k = keyOf(t), id = c.shot, vis = id !== 'S1' || (t > .3 && t < 1.95), f = vis ? figureTubes(k) : null;   // (no pose exists before her run begins)
  if (f && f.outline) { const h = hum(t, 3), ww = clamp(f.watchW);
    for (const pass of [0, 1]) { drawTube(f.outline, tf, { p: h, fill: 1 }, pass); drawTube(f.hair, tf, { p: h, fill: 1 }, pass); drawTube(f.eye, tf, { p: h, fill: 1 }, pass, { noTies: true });
      drawTube(f.watch, tf, { p: (.7 + .3 * ww) * h, fill: 1 }, pass, { noTies: true });
      if (id === 'S3') { drawTube(f.ticks, tf, { p: h, fill: 1 }, pass, { noTies: true }); drawTube(f.hands, tf, { p: h, fill: 1 }, pass, { noTies: true });
        const sec = 41 + Math.floor(t - EV.watchHit), a = sec / 60 * Math.PI * 2, sh = tubeFromStrokes([[[f.wc[0] - Math.sin(a) * f.wr * .18, f.wc[1] - Math.cos(a) * f.wr * .18], [f.wc[0] + Math.sin(a) * f.wr * .7, f.wc[1] + Math.cos(a) * f.wr * .7]]], { col: GAS.neon, coat: false, D: .0018, fil: .001, z: .057, ties: false, ends: false });
        drawTube(sh, tf, { p: h, fill: 1 }, pass, { noTies: true }); } } }
  // the splash where her foot comes down over the puddle: a crown of small white tubes for two switches
  const u = t - SPL.t0; if (u >= 0 && u < 2 * SIXT) { const fr = u < SIXT ? 0 : 1, cx = mX(SPL.x + 30), cy = FOOT_Y - .02;
    for (let i = 0; i < 7; i++) { const an = Math.PI * (.12 + .76 * i / 6), r0 = .07 + fr * .06, r1 = .14 + fr * .1, tb = tubeFromStrokes([[[cx + Math.cos(an) * r0 * 1.3, cy + Math.sin(an) * r0], [cx + Math.cos(an) * r1 * 1.3, cy + Math.sin(an) * r1]]], { D: .011, z: .05, ties: false, ends: false, col: GAS.white, coat: true });
      for (const pass of [0, 1]) drawTube(tb, tf, { p: fr ? .6 : 1, fill: 1 }, pass); } }
}
const cvs = document.getElementById('c'); cvs.width = W; cvs.height = H;
const gl = makeGL(cvs, W, H, TOP);
const bldU = new Float32Array(32), bldC = new Float32Array(24); BUILDINGS.forEach(([b, c], i) => { bldU.set(b, i * 4); bldC.set(c, i * 3); });
// the floor point where the mirror image of (x, y) on the wall lands for camera c (to aim the splash ripple at her reflection)
function mirrorFloor(c, x, y) { const sy = H / 2 + c.K * c.ly + c.K * y, c0 = H / 2 + c.K * (c.ly - c.E), tf = c.E / ((sy - c0) / F), sx = W / 2 + (x - c.lx) * c.K; return [c.lx + (sx - W / 2) / F * tf, c.D - tf]; }
function uniformsFor(c, t) {
  const u = { mode: 0, K: c.K, t, F, gain: 2.5, envC: [.1, .11, .14], bld: bldU, bldC, exposure: 1, lift: [0, 0, 0], vig: .55, bloomGain: 1, lightGain: 1.35, tubeD: .015,
    drop: [0, 0, -9, 0], floorAmb: [.008, .01, .016], pud1: [2.0, .9, 3.0, .8], pud2: [0, -99, 1, 1], wet: .9, rain: 1, calm: 0 };
  u.A = [1 / c.K, 0, 0, -1 / c.K]; u.B = [c.lx - W / 2 / c.K, c.ly + (TOP + H / 2) / c.K]; u.lx = c.lx; u.ly = c.ly; u.E = c.E;
  u.amb = [.014, .016, .03];
  if (c.shot === 'S1') { const m = mirrorFloor(c, mX(SPL.x + 30), FOOT_Y); u.pud2 = [m[0], m[1] + .25, .9, .45]; u.drop = [m[0], m[1], SPL.t0, 1.2]; u.wet = 1.2; }
  if (c.shot === 'S3') { u.lightGain = 1.1; u.bloomGain = .8; u.vig = .6; }
  if (c.shot === 'S4') { const f = t > EV.chime ? Math.exp(-(t - EV.chime) / .4) : 0; u.exposure = 1 + .12 * f; u.bloomGain = 1 + .5 * f; }
  return u;
}
function render(t) {
  t = clamp(t, 0, DUR); const c = cam(t), cp = cam(Math.max(0, t - .5 / 30));
  clearLayers(); drawAll(c, t); drawRain(c, t);
  const u = uniformsFor(c, t); Object.assign(u, c.shot !== cp.shot ? { mT: [0, 0], mS: 0, mR: 0 } : { mT: [(c.lx - cp.lx) * cp.K, -(c.ly - cp.ly) * cp.K], mS: 1 - cp.K / c.K, mR: 0 });
  gl.frame(CV, u);
}
window.DUR = DUR; window.render = render;
// rig QA on the switched poses that are on screen (S1 while she is in frame, S2); a held pose shows no slide, a switch places the planted foot by the rig
window.RIGQA = t => { const id = shotAt(t)[2]; if (id === 'S1') { if (t <= .3 || t >= 1.95) return null; } else if (id !== 'S2') return null; const J = solveProfile(poseAt(keyOf(t) * SIXT)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
render(0);
window.READY = true;
