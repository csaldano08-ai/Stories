// 074 · Mascot Screencast — the first 10 s of "Last Train Home" as a screen recording of a live route app (lemo-opuscar styles/living-screencast).
// A narrative adaptation. There is no real product in this story, so the interface is an original route app (no third-party product, OS or brand
// imitated), built completely as real HTML/CSS (every label, number and state coherent, every state change caused on screen) and floating as a
// window on a night wallpaper. The mascot is AKI in big square pixels: her pose is rasterised every frame from the shared rig (constant bone
// lengths, joint limits, a planted foot) onto one coarse pixel grid with an automatic outline, so the low-res sprite clashes with the hi-res UI.
// Gravity = the top edge of a real element: she runs on the live route track (its top edge measured from the DOM every frame) while the track
// scrolls under her, both on the same pixel lattice, so a planted foot stays planted on its tick. The cursor is the user; the mascot is AKI.
//   01 Route   push-in on the track: the wet-surface segment arrives, her far foot lands in it at 0.94 s (pixel splash), the chip turns to Splash
//   02 Pace    pull back to the whole window: steps count her real footfalls, distance runs; at 6.05 s she raises her wrist, the watch card lights
//   03 Time    the cursor clicks the watch card: push-in + spotlight freeze on 11:58:47, which steps to 48 at 8.4 s (UI on ones)
//   04 Station whip-pan (motion blur from camera speed, on an untransformed wrapper) to the station clock; at 9.58 s it chimes
// Page contract: window.render(t), DUR, READY, RIGQA.
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, hash } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080, TAU = Math.PI * 2;
await Promise.all(['400 16px Inter', '500 16px Inter', '600 16px Inter', '500 16px Mono'].map(f => document.fonts.load(f, 'AB09')));
const $ = id => document.getElementById(id);
const world = $('world'), mbw = $('mbw'), mbg = $('mbg'), hud = $('hud'), spr = $('spr'), sc = spr.getContext('2d');
const bk = u => u <= 0 ? 0 : back(clamp(u), 1.3);

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
  const dt = 1 / 240, n = Math.ceil(11 / dt), tail = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  const th = [-.2, -.1, 0], vt = [0, 0, 0], py = t => RUN.pelvisAt(t)[1], ay = t => (py(t + dt) - 2 * py(t) + py(t - dt)) / (dt * dt);
  for (let i = 0; i < n; i++) { const t = -.5 + i * dt, A = ay(t);
    for (let k = 0; k < 3; k++) { const par = k ? th[k - 1] : -.1, rest = .16 + .05 * k; vt[k] += (-60 * (th[k] - (par + rest)) - 6 * vt[k] + .014 * A * (k + 1) * .6) * dt; th[k] += vt[k] * dt; tail[k][i] = th[k]; } }
  return { tail: t => tail.map(a => a[clamp(Math.round((t + .5) / dt), 0, n - 1)]) };
})();
function figure(t, M) {
  const J = solveProfile(poseAt(t));
  const limb = (k, part) => { const a = J.arm[k], l = J.leg[k];
    if (part === 'arm') { const h = [a.wr[0] + (a.wr[0] - a.el[0]) * .25, a.wr[1] + (a.wr[1] - a.el[1]) * .25]; return [M(a.sh), M(a.el), M(a.wr), M(h)]; }
    const c = Math.cos(l.pitch), s = Math.sin(l.pitch); return [M(l.hip), M(l.knee), M(l.ankle), M([l.ankle[0] + 62 * c, l.ankle[1] + 62 * s])]; };
  const TT = (b, u, f) => M([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
  const coat = [TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)];
  const ta = SIM.tail(t); let an = Math.PI - .25 + ta[0] + J.headA, p = [J.headC[0] - Math.cos(J.headA) * 50, J.headC[1] - Math.sin(J.headA) * 50 - 10]; const tail = [M(p)];
  for (let i = 0; i < 3; i++) { const Lk = [46, 42, 36][i]; p = [p[0] + Math.cos(an) * Lk, p[1] + Math.sin(an) * Lk]; tail.push(M(p)); an += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
  const a = J.arm.n, watch = M([a.el[0] + (a.wr[0] - a.el[0]) * .84, a.el[1] + (a.wr[1] - a.el[1]) * .84]);
  return { J, armF: limb('f', 'arm'), legF: limb('f', 'leg'), coat, legN: limb('n', 'leg'), armN: limb('n', 'arm'), headC: M(J.headC), headA: J.headA, tail, neck: [M(J.neckBase), M(J.neckTop)], watch, w: J.S.watch };
}

// ═════════ time (her watch): 11:58:47 → 48 at 8.4 s → 49 at 9.4 s
const W_T = t => 11 * 3600 + 58 * 60 + 48 + (t - 8.4);
const hms = s => { s = Math.floor(s + 1e-6); return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

// ═════════ the pixel grid: one lattice for the sprite, its props and the track's scroll
const PX = 3, K = .085, S = K * PX, GW = 176, GH = 74, CX = 76, GY = 68, UPM = 1000 / 2.8;   // PX world px per sprite pixel; K sprite px per rig unit; UPM rig units per metre
spr.width = GW; spr.height = GH; spr.style.width = GW * PX + 'px'; spr.style.height = GH * PX + 'px';
const X0 = X(0), Xq = t => X0 + Math.round((X(t) - X0) * K) / K;     // her position snapped to the lattice: the sprite and the floor move in the same 1-pixel steps
const COL = { out: '#1B1A26', coat: '#E0453A', coatF: '#A8322B', legN: '#3A4060', legF: '#262A40', shoe: '#5A3A2A', skin: '#F3C7A5', hair: '#2A2340', watch: '#F2C14E', drop: '#3FA2E0', dropL: '#BFE6FB', white: '#FFFFFF' };
function capsule(a, b, r, col) { sc.fillStyle = col; const x0 = Math.floor(Math.min(a[0], b[0]) - r), x1 = Math.ceil(Math.max(a[0], b[0]) + r), y0 = Math.floor(Math.min(a[1], b[1]) - r), y1 = Math.ceil(Math.max(a[1], b[1]) + r);
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const u = clamp(((x + .5 - a[0]) * dx + (y + .5 - a[1]) * dy) / L2), qx = a[0] + dx * u - x - .5, qy = a[1] + dy * u - y - .5; if (qx * qx + qy * qy <= r * r) sc.fillRect(x, y, 1, 1); } }
function poly(P, col) { sc.fillStyle = col; const ys = P.map(p => p[1]); for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) { const xs = [];
  for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; if ((p[1] <= y + .5) !== (q[1] <= y + .5)) xs.push(p[0] + (y + .5 - p[1]) / (q[1] - p[1]) * (q[0] - p[0])); }
  xs.sort((m, n) => m - n); for (let k = 0; k + 1 < xs.length; k += 2) sc.fillRect(Math.round(xs[k]), y, Math.round(xs[k + 1]) - Math.round(xs[k]), 1); } }
const px = (x, y, col, w = 1, h = 1) => { sc.fillStyle = col; sc.fillRect(Math.round(x), Math.round(y), w, h); };
function drawSprite(t) {
  sc.clearRect(0, 0, GW, GH);
  const xq = Xq(t), M = p => [CX + (p[0] - xq) * K, GY + p[1] * K], F = figure(t, M), chain = (pts, r, col) => { for (let i = 1; i < pts.length; i++) capsule(pts[i - 1], pts[i], r, col); };
  // back to front; the head is drawn a little larger than the rig's (a mascot's proportion), the bones themselves are the rig's
  chain(F.armF.slice(0, 3), 1.25, COL.coatF); capsule(F.armF[2], F.armF[3], 1, COL.skin);
  chain(F.legF.slice(0, 3), 1.55, COL.legF); capsule(F.legF[2], F.legF[3], 1.2, COL.shoe);
  poly(F.coat, COL.coat);
  chain(F.legN.slice(0, 3), 1.6, COL.legN); capsule(F.legN[2], F.legN[3], 1.25, COL.shoe);
  capsule(F.neck[0], F.neck[1], 1.1, COL.skin);
  chain(F.tail, 1.3, COL.hair);
  const hc = F.headC, hr = 46 * K * 1.32, ca = Math.cos(F.headA), sa = Math.sin(F.headA);
  capsule(hc, hc, hr, COL.skin); capsule([hc[0] - ca * 1.6 - sa * -1.4, hc[1] - sa * 1.6 - 1.4], [hc[0] - ca * 2.2, hc[1] - sa * 2.2 - 1.9], hr * .9, COL.hair);
  chain(F.armN.slice(0, 3), 1.3, COL.coat); capsule(F.armN[2], F.armN[3], 1.05, COL.skin);
  px(F.watch[0] - .5, F.watch[1] - .5, COL.watch);
  // the automatic one-pixel outline
  const id = sc.getImageData(0, 0, GW, GH), d = id.data, o = new Uint8ClampedArray(d);
  for (let y = 1; y < GH - 1; y++) for (let x = 1; x < GW - 1; x++) { const i = (y * GW + x) * 4; if (d[i + 3]) continue; if (d[i + 7] || d[i - 1] || d[i + GW * 4 + 3] || d[i - GW * 4 + 3]) { o[i] = 27; o[i + 1] = 26; o[i + 2] = 38; o[i + 3] = 255; } }
  sc.putImageData(new ImageData(o, GW, GH), 0, 0);
  // the eye (one dark pixel, looking where she looks) and a highlight in the hair
  px(hc[0] + ca * hr * .55 - sa * -hr * .05, hc[1] + sa * hr * .55 - hr * .12, COL.out);
  // props on the same grid. The splash: her far foot lands in the wet segment (0.94 s)
  const a = t - SPL.t0, sx = CX + (SPL.x + 44 - xq) * K;
  if (a >= 0 && a < .75) {
    for (let i = 0; i < 14; i++) { const vx = (hash(i * 3.1) - .45) * 46, vy = 26 + hash(i * 7.7) * 34, gy = 150, x = sx + vx * a, y = GY - 1 - vy * a + .5 * gy * a * a;
      if (y < GY) px(x, y, i % 3 ? COL.drop : COL.dropL, hash(i * 1.3) > .6 ? 2 : 1, hash(i * 1.3) > .6 ? 2 : 1); }
    for (let k = 0; k < 2; k++) { const u = clamp((a - k * .14) / .6); if (u <= 0 || u >= 1) continue; const r = 4 + 22 * eo(u), w = Math.max(1, Math.round(4 * (1 - u)));
      px(sx - r - w, GY - 1, COL.drop, w, 1); px(sx + r, GY - 1, COL.drop, w, 1); }
  }
  // the watch: a glint when she raises it, then an exclamation over her head ("I'm going to miss it")
  if (t > EV.watchUp && t < EV.watchUp + .5) { const k = Math.floor((t - EV.watchUp) * 8) % 2, wx = F.watch[0], wy = F.watch[1];
    for (const [dx, dy] of [[0, -2], [0, -3], [0, 2], [0, 3], [-2, 0], [-3, 0], [2, 0], [3, 0]]) if (!k || Math.abs(dx) + Math.abs(dy) < 3) px(wx + dx, wy + dy, COL.watch); }
  if (t > EV.watchUp + .2 && t < EV.watchDown + .1) { const bx = hc[0] + 2, by = hc[1] - hr - 13 - Math.round(bk(seg(t, EV.watchUp + .2, EV.watchUp + .36)) * 2);
    px(bx - 1, by - 1, COL.out, 5, 11); px(bx, by, COL.white, 3, 6); px(bx, by + 7, COL.white, 3, 2); }
  return F;
}

// ═════════ static UI pieces built once: the station clock face
const clk = $('clk'); { let s = '<circle r="78" fill="#FFFFFF" stroke="#D3D3CB" stroke-width="2"/>';
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, r0 = i % 5 ? 70 : 62; s += `<line x1="${Math.sin(a) * r0}" y1="${-Math.cos(a) * r0}" x2="${Math.sin(a) * 74}" y2="${-Math.cos(a) * 74}" stroke="${i % 5 ? '#B9BCC2' : '#1D2026'}" stroke-width="${i % 5 ? 1.4 : 3}"/>`; }
  s += '<line id="hh" x1="0" y1="8" x2="0" y2="-38" stroke="#1D2026" stroke-width="6" stroke-linecap="round"/><line id="mh" x1="0" y1="10" x2="0" y2="-58" stroke="#1D2026" stroke-width="4" stroke-linecap="round"/>';
  s += '<line id="sh" x1="0" y1="14" x2="0" y2="-64" stroke="#2D6CDF" stroke-width="2"/><circle r="5" fill="#2D6CDF"/><circle id="cring" r="80" fill="none" stroke="#2D6CDF" stroke-width="3" opacity="0"/>';
  clk.innerHTML = s; }

// ═════════ anchors: world coordinates of DOM elements (measured live, camera inverted)
let CAM = [960, 540, 1];
const A = (el, fx = .5, fy = .5) => { const r = (typeof el === 'string' ? $(el) : el).getBoundingClientRect(), [cx, cy, z] = CAM;
  return { x: (r.left + r.width * fx - W / 2) / z + cx, y: (r.top + r.height * fy - H / 2) / z + cy, w: r.width / z, h: r.height / z, l: (r.left - W / 2) / z + cx, t: (r.top - H / 2) / z + cy }; };
const setCam = c => { CAM = c; const [cx, cy, z] = c; world.style.transform = `translate(${W / 2 - cx * z}px,${H / 2 - cy * z}px) scale(${z})`; };
setCam([960, 540, 1]);
const TR = A('track', 0, 0), HER = { x: TR.x + Math.round(TR.w * .34 / PX) * PX, y: TR.y };   // her station on the track (the track scrolls under her)
const DIG = A('digits'), HERO = A('hero'), STA = A('station');

// ═════════ the camera: one continuous recording take, zoom ≥ 1 (we never see past the monitor)
const lz = (a, b, u) => Math.exp(lerp(Math.log(a), Math.log(b), u));
function camAt(t) {
  const c1 = [HER.x + 70 + 10 * seg(t, 0, 2.5), HER.y - 40, lz(2.55, 2.7, seg(t, 0, 2.5))];
  if (t < 2.5) return c1;
  const full = [lerp(960, 930, ss(seg(t, 3.3, 7.15))), lerp(548, 540, ss(seg(t, 3.3, 7.15))), lz(1.0, 1.06, ss(seg(t, 3.3, 7.15)))];
  const cA = c1.slice(0, 2), zA = c1[2];
  if (t < 7.2) { const u = eio(seg(t, 2.5, 3.3)); return [lerp(cA[0], full[0], u), lerp(cA[1], full[1], u), lz(zA, full[2], u)]; }
  const dig = [HERO.x, HERO.y - 6, lz(1.9, 2.0, seg(t, 7.6, 9.375))];   // the whole watch card in frame, the digits spotlit
  if (t < 9.375) { const u = eio(seg(t, 7.2, 7.6)), f = full.map((v, i) => i < 2 ? v : v); return [lerp(f[0], dig[0], u), lerp(f[1], dig[1], u), lz(f[2], dig[2], u)]; }
  const d0 = [HERO.x, HERO.y - 6, 2.0], sta = [STA.x, STA.y + 4, lz(2.4, 2.46, seg(t, 9.55, 10))], u = eio(seg(t, 9.375, 9.52));   // the whip
  return [lerp(d0[0], sta[0], u), lerp(d0[1], sta[1], u), lz(d0[2], sta[2], u)];
}

// ═════════ the cursor (the user): appears when she raises her wrist, glides to the watch card, clicks it
const CUR = (() => { const p0 = [1560, 1000], p1 = [HERO.l + HERO.w - 150, HERO.t + 132];
  return t => { if (t < 6.25 || t > 8.0) return null; const u = eio(seg(t, 6.3, 7.05)), ov = Math.sin(clamp((t - 6.9) / .3) * Math.PI) * 10 * (t < 7.2 ? 1 : 0);
    return { x: lerp(p0[0], p1[0], u) - ov * .4, y: lerp(p0[1], p1[1], u) - ov, op: clamp((t - 6.25) / .15) * (1 - clamp((t - 7.65) / .25)), press: t > 7.17 && t < 7.29 ? .86 : 1, ring: t > 7.2 && t < 7.65 ? seg(t, 7.2, 7.65) : -1 }; }; })();
const cursorSvg = (x, y, sc_, op) => { const s = 1.6 * sc_; return `<svg style="position:absolute;left:${x - 2 * s}px;top:${y - 2 * s}px;opacity:${op};filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))" width="${22 * s}" height="${30 * s}" viewBox="0 0 22 30"><path d="M2 2 L2 24 L7.5 18.5 L11 27 L15 25.2 L11.6 17 L19 17 Z" fill="#000" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`; };

const CHAP = [[0, '01', 'Route'], [2.5, '02', 'Pace'], [7.5, '03', 'Time'], [9.375, '04', 'Station']];
const STEPS = RUN.contacts.filter(c => c.t0 >= 0);
const scr = (x, y) => [(x - CAM[0]) * CAM[2] + W / 2, (y - CAM[1]) * CAM[2] + H / 2];

function frame(t) {
  setCam(camAt(t));
  // —— the UI's own state, all caused on screen
  const now = W_T(t), rem = 12 * 3600 - Math.floor(now + 1e-6);
  $('digits').textContent = hms(now); $('stTime').textContent = hms(now); $('cdt').textContent = `${rem} s to 12:00:00`; $('cdbar').style.width = `${(1 - rem / 120) * 100}%`;
  const sec = Math.floor(now + 1e-6) % 60, mn = 58 + sec / 60;
  $('sh').setAttribute('transform', `rotate(${sec * 6})`); $('mh').setAttribute('transform', `rotate(${mn * 6})`); $('hh').setAttribute('transform', `rotate(${(11 + mn / 60) * 30})`);
  $('livedot').style.opacity = .45 + .55 * (1 - seg((t % .625), 0, .5));
  const n = STEPS.filter(c => c.t0 <= t).length; $('steps').textContent = n;
  $('dist').innerHTML = `${((X(t) - X0) / UPM).toFixed(1)}<small>m</small>`;
  const hit = t >= SPL.t0; $('wetchip').className = 'wetchip' + (hit ? ' hit' : ''); $('wettxt').textContent = hit ? 'Splash · 11:58:40 PM' : 'Wet surface';
  const bd = $('badge'); bd.style.display = hit ? '' : 'none'; bd.textContent = '1'; bd.style.transform = `scale(${hit ? lerp(.4, 1, bk(seg(t, SPL.t0, SPL.t0 + .2))) : 1})`;
  const raised = t >= EV.watchUp, sel = t >= 7.2; $('hero').className = 'card hero' + ((raised && t < EV.watchDown + .1) || sel ? ' focus' : '');
  const rz = $('raise'); rz.style.display = raised && t < 7.4 ? '' : 'none'; rz.style.opacity = raised ? clamp((t - EV.watchUp) / .1) * (1 - clamp((t - EV.watchDown - .05) / .2)) : 0; rz.style.transform = `translateY(${(1 - bk(seg(t, EV.watchUp, EV.watchUp + .2))) * -8}px)`;
  // the chime: the bell rings, the clock's ring pulses, a pill pops
  const ch = t - EV.chime; $('bell').style.transform = ch > 0 ? `rotate(${Math.sin(ch * 38) * 16 * Math.exp(-ch * 5)}deg)` : '';
  const cr = $('cring'); cr.setAttribute('opacity', ch > 0 ? (1 - seg(ch, 0, .42)).toFixed(3) : 0); cr.setAttribute('r', ch > 0 ? 78 + 30 * eo(seg(ch, 0, .42)) : 78);
  const cp = $('chime'); cp.style.display = ch > 0 ? '' : 'none'; cp.style.transform = `scale(${lerp(.6, 1, bk(seg(ch, 0, .16)))})`; cp.style.transformOrigin = '0 50%';
  // —— the track scrolls under her on the pixel lattice
  const xq = Xq(t), TX = HER.x - TR.x, tick = m => TX + (X0 + m * UPM - xq) * S;
  let tk = '', tl = ''; const m0 = Math.floor((xq - X0) / UPM - TX / (UPM * S)) - 1, m1 = m0 + Math.ceil(TR.w / (UPM * S)) + 3;
  const wc = TX + (SPL.x + 44 - xq) * S, wl = wc - 300 * S, ww = 600 * S;
  for (let m = m0; m <= m1; m++) { const x = tick(m); if (x < -4 || x > TR.w + 4) continue; tk += `<b class="${m % 5 ? '' : 'm5'}" style="left:${x - 1}px"></b>`;
    if (m % 5 === 0 && m >= 0 && Math.abs(x - wc) > 120) tl += `<div class="tl" style="left:${x + 24}px">${m} m</div>`; }
  $('ticks').innerHTML = tk; $('tls').innerHTML = tl; $('wet').style.left = wl + 'px'; $('wet').style.width = ww + 'px'; $('done').style.width = TX + 'px';
  $('wetchip').style.left = (wc + 24) + 'px';
  // —— the mascot stands on the track's top edge, measured from the DOM this frame
  const tr = A('track', 0, 0), sx = tr.l + TX, sy = tr.t;
  drawSprite(t); spr.style.left = (sx - CX * PX) + 'px'; spr.style.top = (sy - GY * PX) + 'px';
  // —— motion blur only on the whip: camera speed → an anisotropic Gaussian on the untransformed wrapper
  const [px0, py0] = camAt(t - 1 / 30), vx = (CAM[0] - px0) * CAM[2], vy = (CAM[1] - py0) * CAM[2];
  const whip = t > 9.3 && t < 9.65;   // pushes stay sharp (they are slow to the eye); only the whip-pan smears
  const bx = whip ? Math.min(36, Math.max(0, Math.abs(vx) - 30) * .3) : 0, by = whip ? Math.min(36, Math.max(0, Math.abs(vy) - 30) * .3) : 0;
  mbg.setAttribute('stdDeviation', `${bx.toFixed(2)} ${by.toFixed(2)}`); mbw.style.filter = bx > .6 || by > .6 ? 'url(#mb)' : '';
  // —— HUD: the spotlight freeze on the time, the chapter pill, the cursor
  let h = '';
  const sp = t >= 7.5 && t < 9.375 ? clamp((t - 7.6) / .25) : 0;
  if (sp > 0) { const d = A('digits'), [x, y] = scr(d.x, d.y), r = d.w * CAM[2] * .62;
    h += `<div class="spot" style="opacity:${sp};background:radial-gradient(ellipse ${r * 1.25}px ${r * .62}px at ${x}px ${y}px, transparent 62%, rgba(12,14,24,.62) 100%)"></div>`; }
  const ci = CHAP.reduce((k, c, i) => t >= c[0] ? i : k, 0), cu = ci ? seg(t, CHAP[ci][0], CHAP[ci][0] + .22) : 1, [, no, nm] = CHAP[ci];
  h += `<div class="chap"><b>${no}</b><span style="display:inline-block;transform:translateY(${(1 - eo(cu)) * 22}px);opacity:${eo(cu)}">${nm}</span></div>`;
  const c = CUR(t); if (c) { const [x, y] = scr(c.x, c.y);
    if (c.ring >= 0) { const r = 10 + 34 * eo(c.ring); h += `<div class="ring" style="left:${x - r}px;top:${y - r}px;width:${2 * r}px;height:${2 * r}px;opacity:${(1 - c.ring) * .9}"></div>`; }
    h += cursorSvg(x, y, c.press, c.op); }
  hud.innerHTML = h;
}
window.render = t => frame(t);
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
