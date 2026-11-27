// 035 · Sketchnote — the first 10 s of "Last Train Home" as one page of visual notes drawn while you watch
// (lemo-opuscar styles/sketchnote): warm dot-grid paper, one black fineliner (two passes, jittered, boiling on twos), a grey
// marker for volume and shadow, one yellow marker for the single thread the page follows: AKI (her coat is the yellow, the
// style's one accent; the numbered banners and the fat arrow are the structural yellow). Four numbered blocks: 1 the
// puddle (the signs written upside down in it, her lower legs, the splash), 2 the street (shops outlined and named ahead
// of her, one AKI per footfall: a page can't move what it has drawn, so the run is a row of drawings, a flip-book on the
// page), 3 the watch (23:58, a dark-yellow spark at the rim for every second), 4 the station clock (sparks on the chime).
// The cuts are the style's camera moves over one page: quintic whips (2.5, 7.5 s) and the pull-back poster (9.375 s).
// Engine: engine/sketch.js, the demo's drawing code copied unchanged (pen, marker, lettering, timeline, parts, paper).
// Page contract: window.render(t), DUR, READY, RIGQA.
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { seg, back, hash, ss } from './shared/lib/util.js';

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

// ——— page layout (page px) ———
const B1 = { x: 0, y: 0, w: 560, h: 380, gy: 262 }, B2 = { x: -60, y: 470, w: 1960, h: 430, gy: 860 }, B3 = { x: 2030, y: 0, w: 720, h: 420 }, B4 = { x: 2030, y: 470, w: 720, h: 430 };
const K1 = .36, M1 = p => [300 + (p[0] - SPL.x) * K1, B1.gy + p[1] * K1];                       // rig → block 1
const K2 = .27, T2 = 2.59, M2 = p => [60 + (p[0] - X(T2)) * K2, B2.gy + p[1] * K2];               // rig → block 2
const WCX = 2350, WCY = 215, WR = 150, CLX = 2480, CLY = 650, CLR = 54;

// AKI as a sketchnote figure: ink outline, coat in yellow marker with a grey crescent, hair in dark grey marker
function figure(J, M, k, t0, d, lower = false) {
  const T = (b, u, f) => M([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
  const w = Math.max(2, 3.2 * k / .27 * .6), parts = [], q = d / 10;
  let tt = t0;
  for (const kk of ['f', 'n']) { const l = J.leg[kk], c = Math.cos(l.pitch), s = Math.sin(l.pitch), F = ([u, v]) => M([l.ankle[0] + u * c - v * s, l.ankle[1] + u * s + v * c]);
    tt = INK_(bez(M(l.hip), M(l.knee), M(l.knee), M(l.ankle), 12).concat(bez(M(l.ankle), F([20, 16]), F([50, 16]), F([62, 6]), 8)), { w, amp: .5, passes: 2 }, tt, q * 1.3); }
  const coat = [T(J.neckBase, 6, -24), T(J.waist, 0, -38), T(J.pelvis, -86, -46), T(J.pelvis, -90, 40), T(J.waist, 0, 32), T(J.neckBase, -6, 26)];
  const coatLow = [T(J.waist, 0, -38), T(J.pelvis, -86, -46), T(J.pelvis, -90, 40), T(J.waist, 0, 32)];
  const cp = lower ? coatLow : coat;
  FILL(cp, tt); MRK([cp], { col: YEL, w: 10 * k / .27 * .5 + 4, ang: -.7 }, tt + q * .6, q * 1.2); tt = INK_(cp, { closed: true, w, amp: .6 }, tt, q * 1.6);
  MRK([cp, shift(cp, -6 * k / .27 * .4, -4 * k / .27 * .4)], { col: GRY2, w: 8 }, tt, q * .5);
  if (lower) return tt + q;
  for (const kk of ['f', 'n']) { const a = J.arm[kk]; tt = INK_([M(a.sh), M(a.el), M(a.wr)], { w, amp: .4, passes: 1 }, tt, q * .9); INK_(ell(...M([a.wr[0] + (a.wr[0] - a.el[0]) * .16, a.wr[1] + (a.wr[1] - a.el[1]) * .16]), 14 * k, 11 * k, 0, TAU, 14), { closed: true, w: w * .8, amp: .2, passes: 1 }, tt, q * .3); }
  const hc = J.headC, HR = p => { const c = Math.cos(J.headA), s = Math.sin(J.headA); return M([hc[0] + p[0] * c - p[1] * s, hc[1] + p[0] * s + p[1] * c]); };
  const head = []; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; head.push(HR([4 + Math.cos(a) * 40, Math.sin(a) * 44])); }
  FILL(head, tt); tt = INK_(head, { closed: true, w, amp: .4 }, tt, q);
  const hair = [HR([32, -30]), HR([8, -48]), HR([-26, -42]), HR([-48, -10]), HR([-50, 30]), HR([-38, 56]), HR([-18, 40]), HR([-14, 4]), HR([10, -24])];
  MRK([hair], { col: GRYD, w: 8, ang: .9 }, tt, q * .6); tt = INK_(hair, { closed: true, w, amp: .4 }, tt, q * .8);
  INK_([HR([24, -6]), HR([30, -6])], { w: w * 1.1, amp: 0, passes: 1 }, tt, q * .2);
  return tt;
}
// text written upside down (a reflection): the same lettering, flipped about its baseline
function TXTflip(s, x, y, size, o, t0, d) { const T = textLayout(s, x, y, size, o); return addEl(t0, d, 'write', p => { ctx.save(); ctx.translate(0, 2 * y - size * .3); ctx.scale(1, -1); textDraw(T, p); ctx.restore(); }, x); }

function buildPage() {
  // ——— block 1: the puddle ———
  box(B1.x, B1.y, B1.w, B1.h, 0, .3);
  ribbon(70, 0, 60, 46, '1', 34, .2, { d: .22 });
  INK_(line(20, B1.gy, 540, B1.gy + 2), { w: 2.8, amp: 1 }, .35, .18);
  const pud = ell(310, B1.gy + 34, 190, 36, 0, TAU, 60);
  FILL(pud, .5); MRK([pud], { col: GRY, w: 16, ang: -.1 }, .55, .25); INK_(pud, { closed: true, w: 2.8, amp: .8 }, .5, .22);
  TXTflip('24H', 225, B1.gy + 24, 30, { f: 'PH', align: 'center', col: INK2 }, .62, .2);
  TXTflip('CAFE', 385, B1.gy + 24, 30, { f: 'PH', align: 'center', col: INK2 }, .7, .22);
  for (let i = 0; i < 16; i++) { const x = 40 + hash(i * 3.3) * 480, y = 30 + hash(i * 5.7) * 180, t0 = .9 + i * .09; INK_(line(x, y, x - 4, y + 18), { w: 1.6, amp: 0, passes: 1, alpha: .7 }, t0, .04); }
  for (const c of RUN.contacts.filter(c => c.t0 > .5 && c.t0 < 1.5)) { const J = solveProfile(poseAt(c.t0)); figure(J, M1, K1, c.t0 - .3, .28); }
  { const sx = M1([SPL.x + 12, 0])[0];
    sparks(sx, B1.gy - 8, 22, 60, [-2.6, -2.15, -1.57, -1.0, -.55], EV.splash, .16);
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i / 6 - .5) * 2.2, r = 40 + hash(i * 1.7) * 40; INK_(ell(sx + Math.cos(a) * r * 1.3, B1.gy - 10 + Math.sin(a) * r, 4 + hash(i) * 3, 5 + hash(i) * 3, 0, TAU, 10), { closed: true, w: 1.8, amp: .2, passes: 1 }, EV.splash + .05 + i * .02, .05); }
    for (let i = 0; i < 3; i++) { const r = 40 + i * 50, rg = ell(sx, B1.gy + 34, r, r * .2, .2, TAU - .3, 40); INK_(rg, { w: 2, amp: .4, passes: 1 }, EV.splash + .2 + i * .15, .18); } }
  // ——— block 2: the street, written ahead of her, one AKI per footfall ———
  box(B2.x, B2.y, B2.w, B2.h, 2.35, .45);
  ribbon(B2.x + 70, B2.y, 60, 46, '2', 34, 2.5, { d: .22 });
  INK_(line(B2.x + 20, B2.gy, B2.x + B2.w - 20, B2.gy + 2), { w: 2.8, amp: 1.2 }, 2.55, .5);
  const WORDS = ['BAKERY', 'BAR', 'BOOKS', '24H', 'PHARMACY', 'NOODLES', 'CAFE', 'LAUNDRY', 'RECORDS'];
  let x = B2.x + 40; const xAt = px => T2 + (px - 60) / (1450 * K2);   // when she reaches page x
  for (let i = 0; i < WORDS.length; i++) { const sw = 200, top = B2.gy - 250 - hash(i * 3.1) * 40, t0 = Math.max(2.6, xAt(x + 120) - 1.1);
    const shop = rrect(x, top, sw, B2.gy - top + 4, 14);
    INK_(shop, { closed: true, w: 2.8, amp: 1 }, t0, .22);
    MRK([rrect(x + 20, top + 70, sw * .52, 120, 6)], { col: GRY, w: 14 }, t0 + .25, .12); INK_(rrect(x + 20, top + 70, sw * .52, 120, 6), { closed: true, w: 2.2, amp: .6, passes: 1 }, t0 + .22, .12);
    INK_(rrect(x + sw - 62, B2.gy - 130, 42, 130, 4), { closed: true, w: 2.2, amp: .5, passes: 1 }, t0 + .32, .1);
    TXT(WORDS[i], x + sw / 2, top + 48, 40, { f: 'PH', align: 'center' }, t0 + .4, .3);
    x += sw + 12; }
  for (const c of RUN.contacts.filter(c => c.t0 > 2.62 && c.t0 < 7.45)) { const J = solveProfile(poseAt(c.t0)); figure(J, M2, K2, c.t0 - .32, .3); }
  fatArrow(B2.x + B2.w + 6, 690, B4.x - 8, 7.0, { h: 26, hh: 32, hl: 30 });
  // ——— block 3: the watch ———
  box(B3.x, B3.y, B3.w, B3.h, 7.42, .3);
  ribbon(B3.x + 70, 0, 60, 46, '3', 34, 7.5, { d: .2 });
  const sleeve = [[B3.x + 24, WCY - 72], [WCX - WR - 10, WCY - 62], [WCX - WR, WCY + 64], [B3.x + 24, WCY + 76]];
  FILL(sleeve, 7.55); MRK([sleeve], { col: YEL, w: 16 }, 7.7, .16); INK_(sleeve, { closed: true, w: 3, amp: .8 }, 7.55, .18);
  const cs = ell(WCX, WCY, WR, WR, 0, TAU, 80), dl = ell(WCX, WCY, WR - 16, WR - 16, 0, TAU, 80);
  dropShadow(cs, 8, 9, 7.9, .1); FILL(cs, 7.62); MRK([cs, dl], { col: GRY2, w: 12 }, 7.82, .1); INK_(cs, { closed: true, w: 3.4, amp: .8 }, 7.62, .22); INK_(dl, { closed: true, w: 2.4, amp: .5, passes: 1 }, 7.82, .14);
  for (let kk = 0; kk < 12; kk++) { const a = -Math.PI / 2 + kk / 12 * TAU, r0 = kk % 3 ? WR - 40 : WR - 52; INK_(line(WCX + Math.cos(a) * r0, WCY + Math.sin(a) * r0, WCX + Math.cos(a) * (WR - 24), WCY + Math.sin(a) * (WR - 24)), { w: kk % 3 ? 2.4 : 3.6, amp: 0, passes: 1 }, 7.96 + kk * .022, .02); }
  const hh = -Math.PI / 2 + (11 + 58 / 60) / 12 * TAU, mm = -Math.PI / 2 + 58 / 60 * TAU;
  INK_(line(WCX, WCY, WCX + Math.cos(hh) * 70, WCY + Math.sin(hh) * 70), { w: 5.4, amp: 0, passes: 1 }, 8.24, .07); INK_(line(WCX, WCY, WCX + Math.cos(mm) * 108, WCY + Math.sin(mm) * 108), { w: 3.6, amp: 0, passes: 1 }, 8.31, .07);
  TXT('23:58', B3.x + 620, WCY + 22, 64, { f: 'KB', align: 'center' }, 8.42, .38);
  MST(bez([B3.x + 540, WCY + 40], [B3.x + 580, WCY + 52], [B3.x + 660, WCY + 50], [B3.x + 700, WCY + 36], 20), { w: 12, col: YEL }, 8.82, .14);
  for (const [s, t0] of [[47, 8.0], [48, 8.4], [49, 9.4]]) { const a = -Math.PI / 2 + s / 60 * TAU; sparks(WCX + Math.cos(a) * (WR + 10), WCY + Math.sin(a) * (WR + 10), 0, 26, [a - .3, a, a + .3], t0, .1); }
  // ——— block 4: the station clock (drawn while the page pulls back), sparks on the chime ———
  box(B4.x, B4.y, B4.w, B4.h, 9.0, .25);
  ribbon(B4.x + 70, B4.y, 60, 46, '4', 34, 9.05, { d: .18 });
  const tw = [[CLX - 76, B2.gy], [CLX - 76, CLY - 76], [CLX, CLY - 140], [CLX + 76, CLY - 76], [CLX + 76, B2.gy]];
  INK_(tw, { w: 3, amp: .8 }, 9.1, .2); INK_(rrect(B4.x + 60, B2.gy - 170, 260, 174, 10), { closed: true, w: 2.8, amp: .8 }, 9.15, .14);
  const ck = ell(CLX, CLY, CLR, CLR, 0, TAU, 40); FILL(ck, 9.25); MRK([ck], { col: GRY, w: 12 }, 9.32, .06); INK_(ck, { closed: true, w: 3, amp: .5 }, 9.25, .1);
  INK_([[CLX + Math.cos(hh) * 30, CLY + Math.sin(hh) * 30], [CLX, CLY], [CLX + Math.cos(mm) * 46, CLY + Math.sin(mm) * 46]], { w: 3, amp: 0, passes: 1 }, 9.36, .05);
  TXT('STATION', B4.x + 190, B2.gy - 100, 40, { f: 'PH', align: 'center' }, 9.2, .25);
  sparks(CLX, CLY, CLR + 14, CLR + 50, [-2.6, -2.0, -1.57, -1.1, -.5, .5, 2.6], EV.chime, .2);
}

// ——— camera over the page: keys [t, x, y, zoom, ease]; quintic whips; the pull-back poster ———
const Xp = t => M2([X(t), 0])[0];
const CAM = [[0, 285, 200, 2.6], [2.5, 300, 205, 2.5], [2.85, Xp(2.85) + 220, 700, 1.6, 'whip'], [7.5, Xp(7.5) + 220, 700, 1.6, 'track'],
  [7.86, WCX + 60, 215, 2.25, 'whip'], [9.375, WCX + 70, 220, 2.25], [9.95, 1335, 450, .66], [10, 1335, 450, .66]];
function cam(t) {
  let i = 0; while (i < CAM.length - 2 && t >= CAM[i + 1][0]) i++;
  const a = CAM[i], b = CAM[i + 1];
  if (b[4] === 'track' && t >= a[0]) { return { x: Xp(t) + 220, y: 700, z: 1.6 }; }
  let u = clamp((t - a[0]) / (b[0] - a[0]));
  u = b[4] === 'whip' ? (u < .5 ? 16 * u ** 5 : 1 - Math.pow(-2 * u + 2, 5) / 2) : eio(u);
  const z = Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), u)), wa = 1 / a[3], wb = 1 / b[3], k = Math.abs(wa - wb) < 1e-6 ? u : (1 / z - wa) / (wb - wa);
  const kk = Math.abs(Math.log(a[3] / b[3])) > .5 ? k : u;
  return { x: lerp(a[1], b[1], kk), y: lerp(a[2], b[2], kk), z };
}

function render(t) {
  const f = Math.round(t * 30); BOIL = Math.floor(f / 2) % 3;
  const c = cam(t);
  paper(c);
  for (const e of EL) { if (t < e.t0) continue; SEED = e.seed; e.draw(clamp((t - e.t0) / e.d)); }
}

(async () => {
  GLY = await (await fetch('glyphs.json')).json();
  await Promise.all(['KB', 'PH'].map(f => document.fonts.load(`40px ${f}`, 'Ag')));
  makeGrain(); buildPage();
  window.render = render;
  window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const c = RUN.contacts.filter(c => c.t0 - .32 <= t).pop(); if (!c) return null; const J = solveProfile(poseAt(c.t0)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
  window.READY = true;
})();
window.DUR = DUR;
