// 070 · 1920s Silent Film — the first 10 s of "Last Train Home" as a projected one-reeler (lemo-opuscar styles/silent-film).
// Every shot is painted in grey values only (night: dark sky, pale lit windows, a wet pavement that holds the light), then the
// Redraw pass inks, posterises and hatches it, and the print pass adds silver tone, flicker, weave, scratches and burn; the 4:3
// print sits in its gate between velvet curtains. The whole reel is tinted night blue (one tint per section, the period way);
// the intertitle is a clean black card. Figures are sampled hand-cranked: 16 fps, the chase undercranked to 18 fps.
//   S1  a locked wide on the corner: she runs in and puts her foot straight into the puddle (0.94 s), the splash in pale drops
//   S2  a tracking shot, lamp posts passing in the foreground — the card, "Almost midnight… and the last train would not
//       wait." — tracking again; she raises her watch (6.05 s) and the iris starts to close on her wrist
//   S3  the watch in an iris: eleven fifty-eight, the seconds hand stepping 47 → 48 at 8.4 s
//   S4  a locked extreme wide on the station tower; the chime (9.58 s); the iris closes on the clock face to end the reel
// Engine: engine/ink.js, redraw.js, film.js, cards.js copied unchanged. Page contract: window.render(t), DUR, READY, RIGQA.
import { form, stroke, grey, setFrame, ellipsePts, rectPts, catmull, S as INKS } from './engine/ink.js';
import { Redraw } from './engine/redraw.js';
import { FilmPost, damage } from './engine/film.js';
import { intertitle, iris, theatre } from './engine/cards.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, mulberry, hash } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080, GW = 1440, GH = 1080, GX = 240, TAU = Math.PI * 2;
const g = document.getElementById('c').getContext('2d');
await Promise.all(['italic 64px "Old Standard TT"', '64px "Old Standard TT"', '700 64px "Playfair Display SC"'].map(f => document.fonts.load(f, 'Aa')));
const mk = () => Object.assign(document.createElement('canvas'), { width: GW, height: GH });
const PAINT = mk(), pg = PAINT.getContext('2d'), CARD = mk(), cg = CARD.getContext('2d');
const RD = new Redraw(GW, GH), FP = new FilmPost(GW, GH);

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
  for (let i = 0; i < n; i++) { const t = -.5 + i * dt, A = ay(t), wv = clamp((t - EV.watchUp) / .3) * (1 - clamp((t - EV.watchDown) / .3));
    va += (-46 * (a - (.34 + .06 * wv)) - 5.5 * va + .011 * A) * dt; a += va * dt; flap[i] = a;
    for (let k = 0; k < 3; k++) { const par = k ? th[k - 1] : -.1, rest = .16 + .05 * k; vt[k] += (-60 * (th[k] - (par + rest)) - 6 * vt[k] + .014 * A * (k + 1) * .6) * dt; th[k] += vt[k] * dt; tail[k][i] = th[k]; } }
  const at = (arr, t) => arr[clamp(Math.round((t + .5) / dt), 0, n - 1)];
  return { flap: t => at(flap, t), tail: t => tail.map(a => at(a, t)) };
})();
const crank = (t, fps) => Math.floor(t * fps + 1e-6) / fps;            // hand-cranked sampling of figure and camera motion

// ═════════ painting helpers (tonal: values only; the Redraw pass inks and hatches)
const capsule = (a, b, ra, rb, n = 8) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, o = [];
  for (let i = 0; i <= n; i++) { const t = Math.PI / 2 + i / n * Math.PI; o.push([a[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * ra, a[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * ra]); }
  for (let i = 0; i <= n; i++) { const t = -Math.PI / 2 + i / n * Math.PI; o.push([b[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * rb, b[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * rb]); }
  return o; };
function sky(c, top = .14, bot = .26) { const gr = c.createLinearGradient(0, 0, 0, GH); gr.addColorStop(0, grey(top)); gr.addColorStop(1, grey(bot)); c.fillStyle = gr; c.fillRect(0, 0, GW, GH); }
// AKI: realistic proportions on the shared rig; a dark coat, darker trousers, pale face, ink-dark hair and ponytail
function aki(c, t, M, k) {
  const J = solveProfile(poseAt(t));
  const limb = (a, b, ra, rb, v, seed) => form(c, capsule(M(a), M(b), ra * k, rb * k), { v, cyl: 0, seed });
  const leg = (kk, v) => { const l = J.leg[kk], cc = Math.cos(l.pitch), s = Math.sin(l.pitch), F = ([u, w]) => M([l.ankle[0] + u * cc - w * s, l.ankle[1] + u * s + w * cc]);
    limb(l.hip, l.knee, 22, 17, v, 11); limb(l.knee, l.ankle, 17, 12, v, 12); form(c, [[-15, -30], [16, -30], [20, -6], [48, -1], [72, 6], [72, 15], [-24, 15], [-28, 0]].map(F), { v: .1, seed: 13 }); };
  const arm = (kk, v) => { const a = J.arm[kk], h = [a.wr[0] + (a.wr[0] - a.el[0]) * .25, a.wr[1] + (a.wr[1] - a.el[1]) * .25]; limb(a.sh, a.el, 15, 12, v, 14); limb(a.el, a.wr, 12, 10, v, 15); limb(a.wr, h, 9, 6, .78, 16); };
  arm('f', .2); leg('f', .14);
  const TT = (b, u, f) => M([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
  const fa = SIM.flap(t), ha = fa + 1.75, hp = [J.pelvis[0] - 60 * J.uL[0] - 56 * J.fL[0], J.pelvis[1] - 60 * J.uL[1] - 56 * J.fL[1]];
  form(c, [TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), M([hp[0] + Math.cos(ha) * 70, hp[1] + Math.sin(ha) * 70]), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)], { v: .3, shade: 10, seed: 17 });
  leg('n', .18);
  form(c, capsule(M(J.neckBase), M(J.neckTop), 11 * k, 10 * k), { v: .8, seed: 18 });
  const hc = M(J.headC), hr = 46 * k, HR = q => { const cc = Math.cos(J.headA), s = Math.sin(J.headA); return M([J.headC[0] + q[0] * cc - q[1] * s, J.headC[1] + q[0] * s + q[1] * cc]); };
  const ta = SIM.tail(t); let an = Math.PI - .25 + ta[0] + J.headA, p = [J.headC[0] - Math.cos(J.headA) * 50, J.headC[1] - Math.sin(J.headA) * 50 - 10]; const tail = [M(p)];
  for (let i = 0; i < 3; i++) { const Lk = [46, 42, 36][i]; p = [p[0] + Math.cos(an) * Lk, p[1] + Math.sin(an) * Lk]; tail.push(M(p)); an += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
  for (let i = 1; i < tail.length; i++) form(c, capsule(tail[i - 1], tail[i], [13, 10, 7][i - 1] * k, [10, 7, 3][i - 1] * k), { v: .08, seed: 19 + i });
  form(c, [[16, -44], [34, -20], [44, -3], [37, 8], [39, 16], [34, 23], [32, 35], [12, 46], [-10, 48], [-36, 38], [-50, 8], [-46, -26], [-22, -48], [0, -60]].map(HR), { v: .82, shade: 6, seed: 23 });
  form(c, [[-46, -26], [-22, -50], [2, -62], [22, -52], [30, -40], [10, -38], [-12, -20], [-30, 0], [-50, 6]].map(HR), { v: .07, seed: 24 });
  // silent-era make-up: dark lids, dark lips — a deadpan face
  const e = HR([22, -8]); c.fillStyle = grey(.2); c.beginPath(); c.ellipse(e[0], e[1], 4 * k + 2, 3 * k + 1.5, 0, 0, TAU); c.fill();
  const m = HR([26, 24]); c.fillStyle = grey(.25); c.beginPath(); c.ellipse(m[0], m[1], 5 * k + 1, 2 * k + 1, 0, 0, TAU); c.fill();
  arm('n', .28);
  const a = J.arm.n, wp = M([a.el[0] + (a.wr[0] - a.el[0]) * .84, a.el[1] + (a.wr[1] - a.el[1]) * .84]); form(c, ellipsePts(wp[0], wp[1], 8 * k + 2, 8 * k + 2), { v: .9, seed: 25 });
  return { J, wp };
}
// the street at night: shopfronts with pale windows, a lamp, a wet pavement that holds the light, the puddle
function street(c, t, cx, k, o = {}) {
  sky(c, .12, .22);
  const GY = o.ground ?? 860, M = p => [GW / 2 + (p[0] - cx) * k, GY + p[1] * k];
  const r = mulberry(70);
  for (let i = -3; i < 26; i++) { const x0 = SPL.x - 2600 + i * 1700; if (M([x0 + 1700, 0])[0] < -50 || M([x0, 0])[0] > GW + 50) continue;
    const a = M([x0, -1650]), b = M([x0 + 1660, 0]); form(c, rectPts(a[0], a[1], b[0] - a[0], b[1] - a[1]), { v: [.32, .26, .36][((i % 3) + 3) % 3], seed: 30 + i, line: 2 });
    const w0 = M([x0 + 120, -900]), w1 = M([x0 + 1060, -260]); form(c, rectPts(w0[0], w0[1], w1[0] - w0[0], w1[1] - w0[1]), { v: .86, seed: 50 + i, shade: 8 });
    for (let q = 1; q < 4; q++) { const xx = lerp(w0[0], w1[0], q / 4); stroke(c, [[xx, w0[1]], [xx, w1[1]]], 3, { seed: 60 + q }); }
    const d0 = M([x0 + 1180, -760]), d1 = M([x0 + 1520, 0]); form(c, rectPts(d0[0], d0[1], d1[0] - d0[0], d1[1] - d0[1]), { v: .16, seed: 70 + i });
    const s0 = M([x0 + 100, -1080]), s1 = M([x0 + 1560, -960]); form(c, rectPts(s0[0], s0[1], s1[0] - s0[0], s1[1] - s0[1]), { v: .55, seed: 80 + i, line: 2 }); }
  // the wet pavement: dark, with the windows' light lying on it in long pale strokes
  form(c, rectPts(-20, GY, GW + 40, GH - GY + 20), { v: .2, line: 0 });
  c.save(); c.globalAlpha = .35; for (let i = -3; i < 26; i++) { const x0 = SPL.x - 2600 + i * 1700, a = M([x0 + 140, 0]), b = M([x0 + 1040, 0]); if (b[0] < 0 || a[0] > GW) continue; const gr = c.createLinearGradient(0, GY, 0, GY + 180); gr.addColorStop(0, grey(.75)); gr.addColorStop(1, grey(.2, 0)); c.fillStyle = gr; c.fillRect(a[0], GY + 4, b[0] - a[0], 180); } c.restore();
  // the puddle and its splash
  const pc = M([SPL.x + 44, 8]); form(c, ellipsePts(pc[0], pc[1], 300 * k, 34 * k), { v: .7, seed: 90, line: 1.5 });
  const a = t - EV.splash;
  if (a > 0 && a < 1.4) { for (let j = 0; j < 3; j++) { const u = a - j * .15; if (u <= 0 || u > 1.2) continue; stroke(c, ellipsePts(pc[0], pc[1], (40 + 280 * Math.pow(u / 1.2, .6)) * k, (5 + 30 * Math.pow(u / 1.2, .6)) * k).concat([[pc[0] + (40 + 280 * Math.pow(u / 1.2, .6)) * k, pc[1]]]), 3 * (1 - u / 1.2) + 1, { seed: 91 + j, color: grey(.9) }); }
    const rr = mulberry(71); for (let i = 0; i < 16; i++) { const an = (200 + rr() * 140) * Math.PI / 180, v = 900 + rr() * 1200, x = SPL.x + 44 + Math.cos(an) * v * a, y = Math.sin(an) * v * a + 2600 * a * a; if (y > 0 || a > 1) continue; const q = M([x, y]); form(c, ellipsePts(q[0], q[1], 7 * k + 3, 9 * k + 3), { v: .92, seed: 100 + i, line: 1.4 }); } }
  return M;
}
function lampPost(c, x, GY, v = .1) { form(c, rectPts(x - 14, GY - 620, 28, 620), { v, seed: 120 }); form(c, rectPts(x - 34, GY - 700, 68, 86), { v: .9, seed: 121, shade: 6 }); form(c, rectPts(x - 44, GY - 712, 88, 16), { v, seed: 122 }); }
function rain(c, t) { c.save(); c.strokeStyle = grey(.75, .35); c.lineWidth = 1.6; for (let i = 0; i < 90; i++) { const x = (hash(i) * (GW + 200) + crank(t, 16) * 120) % (GW + 200) - 100, y = (hash(i + 5) * GH + crank(t, 16) * 1500) % GH; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 8, y + 34); c.stroke(); } c.restore(); }

// ═════════ the shots (each returns the print settings for its section)
function S1(t) { const tc = crank(t, 16); setFrame(tc);
  const cx = SPL.x + 220, k = .78; const M = street(pg, tc, cx, k); aki(pg, tc, M, k); lampPost(pg, 1180, 860); rain(pg, tc);
  return { strength: .62, sepia: .12, crank: 1 }; }
function S2(t) { const tc = crank(t, 18); setFrame(tc);
  const xh = X(tc), k = .95, cx = xh + 130, M = street(pg, tc, cx, k, { ground: 900 }), A = aki(pg, tc, M, k);
  // foreground lamp posts passing (dark, out of the light) — the tracking shot's foreground
  for (let i = -2; i < 30; i++) { const px = GW / 2 + (SPL.x + i * 2300 - cx) * k * 1.7; if (px > -120 && px < GW + 120) { form(pg, rectPts(px - 40, -20, 80, GH + 40), { v: .07, seed: 130 + i }); } }
  rain(pg, tc);
  return { strength: .72, sepia: .1, crank: 1.15, wrist: A.wp }; }
function S3(t) { setFrame(crank(t, 16));
  // the wristwatch, close, in its iris: the cuff of her coat, the case, the dial at eleven fifty-eight
  sky(pg, .1, .16);
  form(pg, capsule([-100, 760], [760, 520], 150, 140), { v: .28, shade: 14, seed: 140 });                         // the coat sleeve
  form(pg, capsule([700, 540], [1500, 300], 118, 104), { v: .8, shade: 10, seed: 141 });                          // the wrist
  form(pg, rectPts(860, 160, 220, 600).map(([x, y]) => { const a = -.28, cx = 970, cy = 460; return [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]; }), { v: .14, seed: 142 });   // the strap
  const C = [960, 450], R = 250; form(pg, ellipsePts(C[0], C[1], R + 34, R + 34), { v: .55, shade: 12, seed: 143 }); form(pg, ellipsePts(C[0], C[1], R, R), { v: .92, seed: 144, line: 2 });
  form(pg, rectPts(C[0] + R + 26, C[1] - 26, 50, 52), { v: .5, seed: 145 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, L = i % 3 ? 26 : 46, p0 = [C[0] + Math.sin(a) * (R - 14), C[1] - Math.cos(a) * (R - 14)], p1 = [C[0] + Math.sin(a) * (R - 14 - L), C[1] - Math.cos(a) * (R - 14 - L)]; stroke(pg, [p0, p1], i % 3 ? 5 : 10, { seed: 150 + i, taper: 0 }); }
  const s = 47 + (t >= 8.4 ? 1 : 0), tick = s === 48 ? back(seg(t, 8.4, 8.48), 3) : 1, hand = (fr, L, w) => { const a = fr * TAU; stroke(pg, [C, [C[0] + Math.sin(a) * L, C[1] - Math.cos(a) * L]], w, { seed: 160, taper: .2 }); };
  hand((11 + 58 / 60) / 12, 130, 18); hand(58 / 60, 200, 11); hand((s - 1 + tick) / 60, 220, 4);
  form(pg, ellipsePts(C[0], C[1], 14, 14), { v: .08, seed: 161 });
  return { strength: .5, sepia: .14, crank: 1, iris: [C[0], C[1], lerp(1100, 420, eo(seg(t, 7.5, 7.75)))] }; }
function S4(t) { const tc = crank(t, 16); setFrame(tc);
  sky(pg, .08, .2);
  // the town in silhouette, the station tower, its clock face pale
  for (let i = 0; i < 14; i++) { const x = i * 120 - 40, h = 160 + hash(i) * 140; form(pg, rectPts(x, GH - 160 - h, 124, h + 200), { v: .12, seed: 170 + i, line: 1.5 }); for (let q = 0; q < 3; q++) if (hash(i * 3 + q) > .5) form(pg, rectPts(x + 20 + q * 34, GH - 130 - h * .6, 18, 26), { v: .8, seed: 190 + q, line: 0 }); }
  const tx = 760; form(pg, rectPts(tx - 120, 250, 240, 800), { v: .3, shade: 10, seed: 200 }); form(pg, [[tx - 150, 260], [tx, 60], [tx + 150, 260]], { v: .2, seed: 201 });
  form(pg, rectPts(tx - 90, 290, 180, 120), { v: .1, seed: 202 });
  const C = [tx, 540]; form(pg, ellipsePts(C[0], C[1], 92, 92), { v: .9, shade: 6, seed: 203 });
  const hand = (fr, L, w) => { const a = fr * TAU; stroke(pg, [C, [C[0] + Math.sin(a) * L, C[1] - Math.cos(a) * L]], w, { seed: 204, taper: .2 }); };
  hand((11 + 58 / 60) / 12, 46, 9); hand(58 / 60, 72, 6);
  // the bell in the belfry swings on the chime
  const sw = t > EV.chime ? Math.sin((t - EV.chime) * 22) * Math.exp(-(t - EV.chime) * 3) * .3 : 0; const bp = [tx + Math.sin(sw) * 30, 350]; form(pg, ellipsePts(bp[0], bp[1], 30, 34, sw), { v: .7, seed: 205 });
  rain(pg, tc);
  return { strength: .58, sepia: .12, crank: 1, iris: [C[0], C[1], t > 9.7 ? lerp(1100, 70, ei(seg(t, 9.7, 10))) : 1200] }; }

// ═════════ one frame: painting → ink (Redraw) → print (FilmPost) → the night tint → the gate between the curtains
const TINT = 'rgb(150,178,222)';
function frame(t) {
  const f24 = Math.round(t * 24), card = t >= 4.2 && t < 6.0;
  let p = null, print;
  if (!card) {
    INKS.mode = 'tonal'; pg.setTransform(1, 0, 0, 1, 0, 0);
    p = t < 2.5 ? S1(t) : t < 7.5 ? S2(t) : t < 9.375 ? S3(t) : S4(t);
    const inked = RD.render(PAINT, { frame: Math.floor(t * 12) });
    print = FP.render(inked, { frame: f24, strength: p.strength, sepia: p.sepia, crank: p.crank });
  } else {
    // the intertitle: narration, a double rule with stepped corners and fans; it goes through the same print, untinted
    intertitle(pg, GW, GH, { level: 1, seed: 3, lines: [{ text: 'Almost midnight…', italic: true, size: 70 }, { text: 'and the last train', italic: true, size: 70 }, { text: 'would not wait.', italic: true, size: 70 }] }, t - 4.2);
    print = FP.render(PAINT, { frame: f24, strength: .45, sepia: .2, crank: 1, scratches: .6 });
  }
  // the picture house: curtains lit by the screen, the print in the gate (night tint, iris), a soft dark rim, dust and hair
  theatre(g, W, H, { x: GX, y: 0, w: GW, h: GH }, .2 + FP.mean * .5, 1);
  g.save(); g.beginPath(); g.roundRect(GX + 6, 6, GW - 12, GH - 12, 26); g.clip();
  g.drawImage(print, GX, 0);
  g.translate(GX, 0);
  if (!card) { g.globalCompositeOperation = 'multiply'; g.fillStyle = TINT; g.fillRect(0, 0, GW, GH); g.globalCompositeOperation = 'source-over';
    if (p.iris) iris(g, GW, GH, p.iris[0], p.iris[1], p.iris[2], 6);
    if (t > 7.12 && t < 7.5 && p.wrist) iris(g, GW, GH, p.wrist[0], p.wrist[1], lerp(1300, 140, eio(seg(t, 7.12, 7.5))), 6); }
  const rim = g.createRadialGradient(GW / 2, GH / 2, GH * .45, GW / 2, GH / 2, GW * .66); rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = rim; g.fillRect(0, 0, GW, GH);
  g.translate(-GX, 0);
  damage(g, GX, 0, GW, GH, f24, card ? .4 : .6);
  g.restore();
}
window.render = t => frame(t);
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
