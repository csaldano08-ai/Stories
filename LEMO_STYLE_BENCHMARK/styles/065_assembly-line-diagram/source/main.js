// 065 · Assembly-Line Diagram — the first 10 s of "Last Train Home" with AKI cut open as a factory in flat front elevation
// (lemo-opuscar styles/assembly-line-diagram). A narrative adaptation: the process is the run to the last train. Her running
// silhouette (the shared rig, human proportions, feet planted on the ground line) is a body wall around a dark cavity with five
// numbered stations: 1 SHOCK ABSORBER in the shin (a spring that takes each landing), 2 PISTONS in the thighs, 3 PUMP in the
// chest, 4 CLOCK ROOM behind a porthole at the wrist, 5 CONTROL ROOM in the head. Three spot colours are the legend for the whole
// film: teal = the puddle's water (taken in at the splash, 0.94 s), vermilion = steps (pumped down to the pistons), ochre = time
// (a capsule carried from the clock room to the control room when she reads her watch). S1 trucks with the foot into the
// puddle; S2 pulls back to the whole runner, stations starting as the flow reaches them; S3 pushes through the porthole into the
// clock room (workers, a big dial, the seconds card flipped 47 → 48 at 8.4 s); S4 a porthole POV on the outside world: the
// station clock tower, its bell struck on the chime. Engine: engine/lib.js (copied, one marked edit). Page contract:
// window.render(t), DUR, READY, RIGQA.
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { back, mulberry } from './shared/lib/util.js';

window.DUR = DUR;
await Promise.all(['900 40px BSD', '800 40px BSD', '800 30px ARC', '700 34px XSans'].map(f => document.fonts.load(f, f.includes('XSans') ? '脚腿心脏手表大脑步伐时间积水' : 'AB09')));
const stage = document.getElementById('stage');
globalThis.ZL = 1;

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

// ═════════ world (px at zoom 1): 2.6 px per rig unit (AKI ≈ 1 500 px tall), ground line at y = 0, she runs toward +x
const K = 2.6, W_ = p => [(p[0] - SPL.x) * K, p[1] * K], XW = t => (X(t) - SPL.x) * K;
const ST = { foot: EV.splash, legs: 2.9, pump: 4.4, clock: EV.watchUp + .1, ctrl: 6.85 };   // when each station starts
const capsule = (a, b, ra, rb, n = 10) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, o = [];
  for (let i = 0; i <= n; i++) { const t = Math.PI / 2 + i / n * Math.PI; o.push([a[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * ra, a[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * ra]); }
  for (let i = 0; i <= n; i++) { const t = -Math.PI / 2 + i / n * Math.PI; o.push([b[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * rb, b[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * rb]); }
  return o; };
const shrink = (poly, k) => { const c = poly.reduce((s, p) => [s[0] + p[0] / poly.length, s[1] + p[1] / poly.length], [0, 0]); return poly.map(p => [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]); };
const along = (pts, u) => { const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { L.push(Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); tot += L[i - 1]; }
  let d = clamp(u) * tot; for (let i = 1; i < pts.length; i++) { if (d <= L[i - 1]) { const f = d / L[i - 1]; return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]; } d -= L[i - 1]; } return pts[pts.length - 1]; };
const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
const lit = (t, t0) => t >= t0;

// a moving flow along a pipe: dashes in the pipe's light colour travel down it (the belt never stops)
function flow(pts, w, colL, t, speed = 260) { out(`<path d="${PL(pts)}" fill="none" stroke="${colL}" stroke-width="${f1(w * .34)}" stroke-dasharray="${f1(w * .9)} ${f1(w * 1.6)}" stroke-dashoffset="${f1(-t * speed)}" stroke-linecap="round" opacity=".9"/>`); }
function bead(p, r, col) { shape(E(p[0], p[1], r), col, 2.6); out(`<circle cx="${f1(p[0] - r * .3)}" cy="${f1(p[1] - r * .3)}" r="${f1(r * .3)}" fill="#fff" opacity=".6"/>`); }

// ═════════ AKI as the factory
function aki(t) {
  const J = solveProfile(poseAt(t)), P = W_;
  const parts = { armF: [], legF: [], coat: [], legN: [], head: [], armN: [] };
  const cap = (layer, a, b, ra, rb) => parts[layer].push(capsule(P(a), P(b), ra * K, rb * K));
  for (const k of ['f', 'n']) {
    const A = k === 'f' ? 'armF' : 'armN', L = k === 'f' ? 'legF' : 'legN', a = J.arm[k], l = J.leg[k];
    const h = [a.wr[0] + (a.wr[0] - a.el[0]) * .26, a.wr[1] + (a.wr[1] - a.el[1]) * .26];
    cap(A, a.sh, a.el, 17, 14); cap(A, a.el, a.wr, 14, 11); cap(A, a.wr, h, 10, 6);
    cap(L, l.hip, l.knee, 26, 19); cap(L, l.knee, l.ankle, 19, 13);
    const c = Math.cos(l.pitch), s = Math.sin(l.pitch), F = ([u, v]) => P([l.ankle[0] + u * c - v * s, l.ankle[1] + u * s + v * c]);
    parts[L].push([[-17, -36], [18, -36], [20, -9], [48, -3], [75, 6], [75, 17], [-26, 17], [-30, 0]].map(F));
  }
  const TT = (b, u, f) => P([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
  const fa = SIM.flap(t), ha = fa + 1.75, hb = J.pelvis, hp = [hb[0] - 60 * J.uL[0] - 56 * J.fL[0], hb[1] - 60 * J.uL[1] - 56 * J.fL[1]];
  parts.coat.push([TT(J.neckBase, 8, -30), TT(J.waist, 0, -48), TT(J.pelvis, -100, -62), TT(J.pelvis, -104, 54), TT(J.waist, 0, 42), TT(J.neckBase, -6, 32)]);
  parts.coat.push([TT(J.pelvis, -40, -54), TT(J.pelvis, -100, -62), P([hp[0] + Math.cos(ha) * 76, hp[1] + Math.sin(ha) * 76]), P([hp[0] + Math.cos(ha) * 68 + 12, hp[1] + Math.sin(ha) * 68])]);
  cap('head', J.neckBase, J.neckTop, 14, 13);
  const hc = J.headC, HR = q => { const c = Math.cos(J.headA), s = Math.sin(J.headA); return P([hc[0] + q[0] * c - q[1] * s, hc[1] + q[0] * s + q[1] * c]); };
  parts.head.push([[16, -48], [36, -22], [47, -3], [40, 8], [42, 16], [37, 24], [34, 37], [12, 49], [-11, 51], [-39, 40], [-54, 8], [-50, -28], [-24, -52], [0, -64]].map(HR));
  { const ta = SIM.tail(t); let an = Math.PI - .25 + ta[0] + J.headA, p = [hc[0] - Math.cos(J.headA) * 50, hc[1] - Math.sin(J.headA) * 50 - 10];
    for (let i = 0; i < 3; i++) { const Lk = [46, 42, 36][i], q = [p[0] + Math.cos(an) * Lk, p[1] + Math.sin(an) * Lk]; cap('head', p, q, [15, 12, 9][i], [12, 9, 4][i]); p = q; an += ta[(i + 1) % 3] * .6 - ta[i] * .3; } }
  const wallK = { armF: .72, legF: .72, coat: .9, legN: .72, head: .86, armN: .7 };
  const cavity = (poly, layer) => poly.length > 20 ? shrinkCapsule(poly, layer) : shrink(poly, wallK[layer] + .06);
  function shrinkCapsule(poly) { const n = (poly.length - 2) / 2, a = mid(poly[0], poly[n]), b = mid(poly[n + 1], poly[2 * n + 1]); const ra = Math.hypot(poly[0][0] - a[0], poly[0][1] - a[1]), rb = Math.hypot(poly[n + 1][0] - b[0], poly[n + 1][1] - b[1]);
    return capsule(a, b, Math.max(4, ra - 11), Math.max(3, rb - 11), n); }
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const layer = (name, inside) => { for (const p of parts[name]) shape(PL(p) + 'Z', C.blush, 3); for (const p of parts[name]) shape(PL(cavity(p, name)) + 'Z', C.ground, 2.2); if (inside) inside(); };
  const contact = Math.abs(t - SPL.t0) < .2 ? 1 - Math.abs(t - SPL.t0) / .2 : 0;
  // far arm, far leg (with the water intake at the splash), the coat (pump room + steps pipe), near leg, head (control room), near arm (clock room)
  layer('armF');
  layer('legF', () => legMachines(J.leg.f, t, 'f'));
  layer('coat', () => pumpRoom(J, t, TT, P));
  layer('legN', () => legMachines(J.leg.n, t, 'n'));
  layer('head', () => controlRoom(J, t, HR, P));
  layer('armN', () => clockDoor(J, t, P));
  return { J, P, TT, HR };
}
// station 1 and 2 inside each leg: a piston in the thigh (vermilion = steps), a spring in the shin (it takes the landing)
function legMachines(l, t, k) {
  const P = W_, hip = P(l.hip), knee = P(l.knee), ank = P(l.ankle), dir = ang(knee, ank);
  const on = lit(t, ST.legs - (k === 'f' ? .1 : 0));
  // piston: a red cylinder hung from the hip, its rod to the knee
  const cl = Math.hypot(knee[0] - hip[0], knee[1] - hip[1]), cyl = .55 * cl, ux = (knee[0] - hip[0]) / cl, uy = (knee[1] - hip[1]) / cl;
  const c1 = [hip[0] + ux * 18, hip[1] + uy * 18], c2 = [hip[0] + ux * (18 + cyl), hip[1] + uy * (18 + cyl)];
  gline([c1, knee], 9, C.ink); gline([c1, knee], 5, C.wallD);
  pipe([c1, c2], 30, on ? C.red : C.blushD, on ? C.redL : C.blushL, { cap: 'round' });
  // spring: a zigzag between knee and ankle, compressed when the foot carries weight
  const sl = Math.hypot(ank[0] - knee[0], ank[1] - knee[1]), n = 9, vx = (ank[0] - knee[0]) / sl, vy = (ank[1] - knee[1]) / sl, px = -vy, py = vx, pts = [];
  for (let i = 0; i <= n; i++) { const f = .12 + .76 * i / n, s = i === 0 || i === n ? 0 : (i % 2 ? 1 : -1) * 16; pts.push([knee[0] + vx * sl * f + px * s, knee[1] + vy * sl * f + py * s]); }
  line(pts, 9, C.ink); line(pts, 4.5, on ? C.sun : C.wallD);
  // the water intake: a hatch in the sole; at the splash the teal water rises from it into the shin
  if (k === 'f' && t > SPL.t0 - .3 && t < 2.6) {
    const a = t - SPL.t0, sole = [ank[0] + 30, ank[1] + 34];
    pipe([sole, [ank[0] + 4, ank[1]], [knee[0] * .3 + ank[0] * .7, knee[1] * .3 + ank[1] * .7]], 16, C.teal, C.tealL, { cap: 'round' });
    if (a > 0 && a < 1.2) bead(along([sole, [ank[0] + 4, ank[1]], [knee[0] * .3 + ank[0] * .7, knee[1] * .3 + ank[1] * .7]], a / .9), 11, C.teal);
  }
}
// station 3: the pump room in the chest; the steps pipe runs down to the hips
function pumpRoom(J, t, TT, P) {
  const nb = P(J.neckBase), wa = P(J.waist), a = ang(wa, nb) + 90;
  const c = [lerp(wa[0], nb[0], .55), lerp(wa[1], nb[1], .55)];
  out(`<g transform="translate(${f1(c[0])} ${f1(c[1])}) rotate(${f1(a)})">`);
  const on = lit(t, ST.pump), r = room(-92, -96, 184, 178, on ? C.red : C.blushD, { sh: C.groundD });
  // the pump: a bellows on a frame, a flywheel turning at the cadence, a worker at the valve
  const beat = (t * CADENCE) % 1, squeeze = on ? Math.pow(Math.sin(beat * Math.PI), 2) : 0;
  shape(R(-58, r.fl - 70 + squeeze * 18, 70, 70 - squeeze * 18, 4), on ? C.redL : C.wallS, 2.6);
  for (let k = 1; k < 4; k++) line([[-58, r.fl - 70 + squeeze * 18 + k * (70 - squeeze * 18) / 4], [12, r.fl - 70 + squeeze * 18 + k * (70 - squeeze * 18) / 4]], 2);
  gear(42, r.fl - 48, 24, 10, on ? t * CADENCE * 360 : 0, on ? C.sun : C.wallD);
  worker(40, r.fl, { s: .62, front: [120 + 30 * Math.sin(t * 6), 20], cap: C.red });
  out('</g>');
  // the steps pipe: from the pump down the body to each hip
  const hipN = P(J.leg.n.hip), hipF = P(J.leg.f.hip), p0 = [c[0], c[1] + 60];
  for (const hp of [hipF, hipN]) { const pts = [p0, [lerp(p0[0], hp[0], .5), lerp(p0[1], hp[1], .7)], hp]; pipe(pts, 22, lit(t, ST.legs) ? C.red : C.blushD, lit(t, ST.legs) ? C.redL : C.blushL, { cap: 'round' }); if (lit(t, ST.legs)) flow(pts, 22, '#FFF4EC', t, 300); }
}
// station 5: the control room in the head; a lamp lights and the worker throws the lever when the time capsule arrives
function controlRoom(J, t, HR, P) {
  const c = HR([-6, 4]), a = J.headA * 180 / Math.PI;
  out(`<g transform="translate(${f1(c[0])} ${f1(c[1])}) rotate(${f1(a)})">`);
  const on = lit(t, ST.ctrl), r = room(-86, -76, 172, 150, on ? C.sun : C.blushD, { sh: C.groundD });
  lamp(0, r.y, r.y + 34, on);
  gauge(-46, r.fl - 44, 20, on ? .85 + .05 * Math.sin(t * 20) : .25);
  const pull = on ? ss(seg(t, ST.ctrl, ST.ctrl + .2)) : 0;
  shape(R(26, r.fl - 50, 14, 50, 2), C.wallD, 2.2); line([[33, r.fl - 46], [33 + 30 * Math.sin(-.6 + 1.2 * pull), r.fl - 46 - 30 * Math.cos(-.6 + 1.2 * pull)]], 5);
  worker(8, r.fl, { s: .6, front: [150 - 40 * pull, 10], cap: C.sun });
  out('</g>');
}
// station 4: the porthole of the clock room at the wrist (a small dial behind it); its time pipe runs to the head
function clockDoor(J, t, P) {
  const a = J.arm.n, el = P(a.el), wr = P(a.wr), d = [lerp(el[0], wr[0], .72), lerp(el[1], wr[1], .72)], on = lit(t, ST.clock);
  shape(E(d[0], d[1], 25), on ? C.sun : C.wallD, 3); shape(E(d[0], d[1], 17), C.cream, 2.2);
  const s = 47 + (t >= 8.4 ? 1 : 0), aS = (s / 60) * 360 - 90, aM = (58 / 60) * 360 - 90;
  line([d, [d[0] + Math.cos(aM * Math.PI / 180) * 13, d[1] + Math.sin(aM * Math.PI / 180) * 13]], 2.4);
  line([d, [d[0] + Math.cos(aS * Math.PI / 180) * 14, d[1] + Math.sin(aS * Math.PI / 180) * 14]], 1.4, C.red);
  // the time pipe (ochre): wrist → elbow → shoulder → neck → the control room; a capsule rides it once she reads the watch
  if (on) {
    const J2 = J, sh = P(J2.sh.n), nt = P(J2.neckTop), hc = P(J2.headC), pts = [d, el, sh, [lerp(sh[0], nt[0], .6), lerp(sh[1], nt[1], .6)], nt, hc];
    pipe(pts, 14, C.sun, C.sunL, { cap: 'round' });
    const u = seg(t, ST.clock + .15, ST.ctrl); if (u > 0 && u < 1) bead(along(pts, ss(u)), 12, C.sun);
  }
}
function plaqueDrop(t, t0, x, y, en, zh, n, tOut = 99) {
  const d = (1 - spring(t - t0, 9, .32)) * -70, o = seg(t, tOut, tOut + .25) * -400;
  if (t < t0) return;
  line([[x + 70, y + d + o - 60], [x + 70, y + d + o]], 2, C.ink, 'stroke-dasharray="4 4"'); line([[x + 230, y + d + o - 60], [x + 230, y + d + o]], 2, C.ink, 'stroke-dasharray="4 4"');
  const k = LBL(); out(`<g transform="translate(${f1(x)} ${f1(y + d + o)}) scale(${f1(k * 100) / 100}) translate(${-x} ${-y})">`); plaque(x, y, en, zh, { n, size: 30, zs: 30 }); out('</g>');
}
// the street in elevation: the ground line, paving joints, a kerb band, lamp posts, the puddle and its splash
function street(t, x0, x1) {
  fillOnly(R(x0 - 50, 0, x1 - x0 + 100, 90), C.paperD); line([[x0 - 50, 0], [x1 + 50, 0]], 4);
  line([[x0 - 50, 90], [x1 + 50, 90]], 2.4);
  for (let x = Math.floor(x0 / 340) * 340; x < x1; x += 340) line([[x, 0], [x - 26, 90]], 2, C.ink, 'opacity=".5"');
  for (let x = Math.floor(x0 / 2600) * 2600 + 900; x < x1 + 200; x += 2600) { shape(R(x - 9, -1150, 18, 1150), C.wallD, 2.6); shape(R(x - 34, -1200, 68, 60, 6), C.sunL, 2.6); shape(R(x - 26, -24, 52, 24, 3), C.wallD, 2.4); }
  const px = (SPL.x + 44 - SPL.x) * K;
  shape(`M${px - 300} 0Q${px} 30 ${px + 300} 0Z`, C.teal, 3);
  const a = t - SPL.t0;
  if (a > 0 && a < 1.4) {
    for (let j = 0; j < 3; j++) { const u = a - j * .15; if (u <= 0 || u > 1.2) continue; const r = 60 + 300 * Math.pow(u / 1.2, .6); out(`<ellipse cx="${px}" cy="6" rx="${f1(r)}" ry="${f1(r * .08)}" fill="none" stroke="${C.tealD}" stroke-width="${f1(3 * (1 - u / 1.2) + 1)}"/>`); }
    const rr = mulberry(65); for (let i = 0; i < 14; i++) { const an = (200 + rr() * 140) * Math.PI / 180, v = 500 + rr() * 700, x = px + Math.cos(an) * v * a, y = Math.sin(an) * v * a + 1400 * a * a; if (y > 4 || a > 1) continue; shape(E(x, y, 9 + rr() * 8), C.teal, 2.4); }
  }
}
// ═════════ S3: inside the clock room (screen space, its own drawing)
function clockRoom(t) {
  fillOnly(R(-40, -40, 2000, 1160), C.ground);
  const r = room(60, 50, 1800, 980, C.sun, { sh: C.groundD });
  slab(60, 1000, 1800, 40);
  plaque(110, 84, 'CLOCK ROOM', '手表', { n: 4, size: 40, zs: 40 });
  lamp(700, r.y, r.y + 110, true); lamp(1450, r.y, r.y + 110, true);
  // the time pipe leaving the room through the ceiling, with its legend tag
  pipe([[1240, r.y - 40], [1240, 230], [1100, 230]], 30, C.sun, C.sunL, { cap: 'round' }); flow([[1240, r.y - 40], [1240, 230], [1100, 230]], 30, C.cream, t, 220);
  tag(1290, 140, 'TIME', '时间', C.sun);
  // the big dial on its trestle, gears turning behind it
  const D = [980, 560], s = 47 + (t >= 8.4 ? 1 : 0), tick = s === 48 ? backE(seg(t, 8.4, 8.5), 3) : 1;
  gear(D[0] - 250, D[1] - 150, 70, 14, t * 40, C.sun); gear(D[0] + 260, D[1] - 170, 52, 11, -t * 54, C.red);
  trestle(D[0], D[1] + 200, r.fl, 120);
  shadow(E(D[0], D[1], 270), 18, 14, C.groundD); shape(E(D[0], D[1], 270), C.sun, 4); shape(E(D[0], D[1], 236), C.cream, 3);
  for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, L = i % 5 ? 12 : 30; line([[D[0] + Math.sin(a) * (226 - L), D[1] - Math.cos(a) * (226 - L)], [D[0] + Math.sin(a) * 226, D[1] - Math.cos(a) * 226]], i % 5 ? 2.4 : 6); }
  const hand = (fr, L, w, col = C.ink) => { const a = fr * Math.PI * 2; gline([D, [D[0] + Math.sin(a) * L, D[1] - Math.cos(a) * L]], w, C.ink); if (col !== C.ink) gline([D, [D[0] + Math.sin(a) * L, D[1] - Math.cos(a) * L]], w * .55, col); };
  hand((11 + 58 / 60) / 12, 130, 18); hand(58 / 60, 200, 12); hand((s - 1 + tick) / 60, 214, 8, C.red);
  shape(E(D[0], D[1], 16), C.ink, 0);
  // the seconds card on a stand, a worker flipping it on the tick; a second worker at the crank
  const flip = seg(t, 8.38, 8.5), sh = Math.abs(Math.cos(flip * Math.PI)), card = flip < .5 ? '47' : '48';
  trestle(330, 640, r.fl, 60); shadow(R(220, 400, 220, 220, 6), 12, 10, C.groundD);
  out(`<g transform="translate(330 510) scale(1 ${f1(Math.max(.04, sh) * 100) / 100}) translate(-330 -510)">`); shape(R(220, 400, 220, 220, 6), C.cream, 3.5); txt(330, 575, card, 190, { fam: FONT.en, w: 900, anchor: 'middle' }); out('</g>');
  worker(470, r.fl, { s: 1.9, front: [flip > 0 && flip < 1 ? 150 : 110, -10], back: [20, 10], cap: C.sun });
  const cr = t * 4;
  shape(R(1480, r.fl - 230, 120, 230, 6), C.wallD, 3); gear(1540, r.fl - 160, 40, 9, cr * 57, C.red);
  worker(1660, r.fl, { s: 1.9, flip: true, front: [90 + 40 * Math.sin(cr), 30 * Math.cos(cr)], cap: C.red });
  // the porthole to the outside (the next shot goes through it)
  porthole(1600, 360, 120, t, false);
}
function porthole(cx, cy, r, t, pov) {
  if (!pov) shadow(E(cx, cy, r + 30), 12, 10, C.groundD);
  if (pov) { out(`<path d="M${cx - r - 30} ${cy}a${r + 30} ${r + 30} 0 1 0 ${2 * r + 60} 0a${r + 30} ${r + 30} 0 1 0 ${-2 * r - 60} 0ZM${cx - r} ${cy}a${r} ${r} 0 1 1 ${2 * r} 0a${r} ${r} 0 1 1 ${-2 * r} 0Z" fill="${C.wallD}" fill-rule="evenodd"/>`); shape(E(cx, cy, r + 30), null, 4); shape(E(cx, cy, r), null, 3); }
  else { shape(E(cx, cy, r + 30), C.wallD, 4); shape(E(cx, cy, r), C.ground, 3); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; out(`<circle cx="${f1(cx + Math.cos(a) * (r + 15))}" cy="${f1(cy + Math.sin(a) * (r + 15))}" r="${f1(r * .035 + 2)}" fill="${C.ink}"/>`); }
  if (!pov) { for (const k of [-1, 1]) line([[cx - r * .5, cy - r * .2 + k * 20], [cx - r * .1, cy - r * .5 + k * 20]], 6, C.groundL); }
}
// ═════════ S4: the porthole POV on the outside world: the station clock tower, its bell struck on the chime
function outside(t, cx, cy, r) {
  const id = 'pov';
  out(`<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><g clip-path="url(#${id})">`);
  fillOnly(R(cx - r, cy - r, 2 * r, 2 * r), C.groundD);
  for (let i = 0; i < 40; i++) { const x = cx - r + hash(i) * 2 * r, y = cy - r + hash(i + 50) * 2 * r; line([[x, y], [x - 8, y + 30]], 2, C.groundL); }
  const tx = cx + 40, base = cy + r + 40, tw = 300, top = base - 900;
  fillOnly(R(cx - r, base - 160, 2 * r, 160), C.ground);
  shape(R(tx - tw / 2, top, tw, 900), C.blush, 4); shape(`M${tx - tw / 2 - 20} ${top}L${tx} ${top - 170}L${tx + tw / 2 + 20} ${top}Z`, C.blushD, 4);
  for (let y = top + 330; y < base - 100; y += 200) line([[tx - tw / 2, y], [tx + tw / 2, y]], 3);
  // belfry with the bell; the bell swings on the chime and three ring marks spring from it
  shape(R(tx - tw / 2 + 36, top + 30, tw - 72, 220, 8), C.ground, 3);
  const sw = t > EV.chime ? Math.sin((t - EV.chime) * 22) * Math.exp(-(t - EV.chime) * 3) * 18 : 0;
  out(`<g transform="translate(${tx} ${top + 40}) rotate(${f1(sw)})">`); shape(`M-60 150Q-60 40 0 30Q60 40 60 150Z`, C.sun, 3.5); shape(E(0, 160, 16), C.ink, 0); out('</g>');
  shape(E(tx, top + 430, 120), C.sun, 4); shape(E(tx, top + 430, 98), C.cream, 3);
  const hand = (fr, L, w) => { const a = fr * Math.PI * 2; gline([[tx, top + 430], [tx + Math.sin(a) * L, top + 430 - Math.cos(a) * L]], w, C.ink); };
  hand((11 + 58 / 60) / 12, 55, 12); hand(58 / 60, 84, 8);
  if (t > EV.chime) { const k = seg(t, EV.chime, EV.chime + .35); for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const a = (s > 0 ? -30 : 210) + (i - 1) * 24, R0 = 90 + 40 * eo(k), R1 = R0 + 50; line([[tx + Math.cos(a * Math.PI / 180) * R0, top + 120 + Math.sin(a * Math.PI / 180) * R0], [tx + Math.cos(a * Math.PI / 180) * R1, top + 120 + Math.sin(a * Math.PI / 180) * R1]], 6, C.sunL, `opacity="${f1(1 - k * .6)}"`); } }
  out('</g>');
  porthole(cx, cy, r, t, true);
}

// ═════════ camera and frame
function camAt(t) {
  const xh = XW(t);
  if (t < 2.5) {   // S1: truck with the foot into the puddle, then begin the pull back
    const z = lerp(1.25, .9, ss(seg(t, 1.6, 2.5)));
    return { c: [lerp(xh + 120, xh + 60, ss(seg(t, 1.6, 2.5))), lerp(-180, -420, ss(seg(t, 1.6, 2.5)))], z };
  }
  // S2: the pull back to the whole runner; the camera drifts toward the station that is starting; then a push into the porthole
  let z = lerp(.9, .66, ss(seg(t, 2.5, 3.2))), cy = lerp(-420, -800, ss(seg(t, 2.5, 3.2))), cx = xh + 60;
  const J = solveProfile(poseAt(Math.min(t, 7.5))), a = J.arm.n, d = W_([lerp(a.el[0], a.wr[0], .72), lerp(a.el[1], a.wr[1], .72)]);
  const pc = ss(seg(t, 6.2, 6.8)); cx = lerp(cx, d[0] + 80, pc * .5); cy = lerp(cy, lerp(-800, d[1], .4), pc);
  const push = ei(seg(t, 7.12, 7.5)); z = lerp(z, 14, push); cx = lerp(cx, d[0], ss(seg(t, 7.0, 7.35))); cy = lerp(cy, d[1], ss(seg(t, 7.0, 7.35)));
  return { c: [cx, cy], z };
}
const GRAIN = (() => { const g = document.getElementById('grain').getContext('2d'), img = g.createImageData(1920, 1080), r = mulberry(651);
  for (let i = 0; i < img.data.length; i += 4) { const n = 238 + r() * 17; img.data[i] = n; img.data[i + 1] = n - 2; img.data[i + 2] = n - 6; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0); g.globalAlpha = .05; g.strokeStyle = '#7a6a50';
  for (let k = 0; k < 900; k++) { const x = r() * 1920, y = r() * 1080, a = r() * 6.28, l = 4 + r() * 14; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  return true; })();
let CAMZ = 1; const LBL = () => clamp(Math.pow(1 / CAMZ, .9), .9, 1.6);   // labels keep a readable size on screen when the camera pulls back
function frame(t) {
  S.length = 0;
  let body = '';
  if (t < 7.5) {
    const cam = camAt(t); KS = Math.pow(cam.z, cam.z < 1 ? -.6 : -.85); ZL = cam.z; CAMZ = cam.z;
    const x0 = cam.c[0] - 960 / cam.z, x1 = cam.c[0] + 960 / cam.z;
    out(`<rect x="0" y="0" width="1920" height="1080" fill="${C.paper}"/>`);
    out(`<g transform="translate(${f1(960 - cam.c[0] * cam.z)} ${f1(540 - cam.c[1] * cam.z)}) scale(${cam.z})">`);
    street(t, x0, x1);
    const F = aki(t);
    // the stations' plaques and the legend tags, each dropped on its chains when its station starts (at most a few at once)
    const kn = W_(F.J.leg.n.knee), an = W_(F.J.leg.f.ankle), hd = W_(F.J.headC);
    const xh = XW(t);   // labels ride with her (the camera trucks with her, so they hold their place in the frame)
    if (t > ST.foot && t < 3.2) { plaqueDrop(t, ST.foot + .05, xh - 600, -580, 'SHOCK ABSORBER', '脚', 1, 2.75); tagDrop(t, ST.foot + .35, xh + 300, -520, 'WATER', '积水', C.teal, 2.75); }
    if (t > ST.legs && t < 5.0) { plaqueDrop(t, ST.legs, xh + 300, -560, 'PISTONS', '腿', 2, 4.4); tagDrop(t, ST.legs + .3, xh - 900, -980, 'STEPS', '步伐', C.red, 6.0); }
    if (t > ST.pump && t < 6.4) plaqueDrop(t, ST.pump, xh - 980, -1300, 'PUMP', '心脏', 3, 6.0);
    if (t > ST.clock && t < 7.3) tagDrop(t, ST.clock + .2, xh + 420, -1330, 'TIME', '时间', C.sun, 7.1);
    if (t > ST.ctrl - .1) plaqueDrop(t, ST.ctrl, hd[0] - 640, hd[1] - 120, 'CONTROL ROOM', '大脑', 5);
    out('</g>');
  } else if (t < 9.375) {
    KS = 1; ZL = 1;
    const push = ei(seg(t, 9.12, 9.375)), z = lerp(1, 4.2, push), c = [lerp(960, 1600, ss(seg(t, 9.0, 9.3))), lerp(540, 360, ss(seg(t, 9.0, 9.3)))];
    out(`<g transform="translate(${f1(960 - c[0] * z)} ${f1(540 - c[1] * z)}) scale(${f1(z * 1000) / 1000})">`);
    clockRoom(t);
    out('</g>');
    // entering through the door shape: a circle opening from the porthole of the last shot
    const o = seg(t, 7.5, 7.68); if (o < 1) { const rr = lerp(60, 1200, ei(o)); out(`<path d="M-10 -10H1930V1090H-10ZM${960 + rr} 540A${rr} ${rr} 0 1 0 ${960 - rr} 540A${rr} ${rr} 0 1 0 ${960 + rr} 540Z" fill="${C.ground}" fill-rule="evenodd"/>`); shape(E(960, 540, rr), null, 5); }
  } else {
    KS = 1; ZL = 1;
    out(`<rect x="0" y="0" width="1920" height="1080" fill="${C.wall}"/>`);
    for (let i = 0; i < 30; i++) out(`<circle cx="${80 + (i % 10) * 196}" cy="${i < 10 ? 50 : i < 20 ? 1030 : -50}" r="5" fill="${C.ink}" opacity=".7"/>`);
    const r = lerp(505, 470, ss(seg(t, 9.375, 10)));
    outside(t, 960, 560, r);
  }
  body = S.join('');
  stage.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">${body}</svg>`;
}
function tagDrop(t, t0, x, y, en, zh, col, tOut = 99) {
  if (t < t0) return; const d = (1 - spring(t - t0, 9, .32)) * -60, o = seg(t, tOut, tOut + .25) * -400;
  line([[x + 30, y + d + o - 50], [x + 30, y + d + o]], 2, C.ink, 'stroke-dasharray="4 4"');
  const k = LBL(); out(`<g transform="translate(${f1(x)} ${f1(y + d + o)}) scale(${f1(k * 100) / 100}) translate(${-x} ${-y})">`); tag(x, y, en, zh, col); out('</g>');
}
window.render = t => frame(t);
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
