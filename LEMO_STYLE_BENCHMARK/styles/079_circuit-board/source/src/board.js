// 079 · the world module: one board, 1 unit = 1 cm of the street (the rig's 2.8 mm units × 0.28). Everything on it stands for something:
// the route trace is her run, every via beside it is one real footfall of the rig (near foot south, far foot north), the lake is the
// puddle (a clearance: bare laminate), the module south of the route is her watch (a quartz crystal and a 7-segment display), U1 at the
// east end is the station clock. Silkscreen poses of AKI are plotted at every near-foot contact, from the rig at that instant.
import { measure, octi } from './geo.js';
import { chip } from './parts.js';
import { solveProfile } from '../shared/aki2/aki_profile.js';
import { mulberry } from '/core/lib.js';

export function makeWorld({ RUN, poseAt, X0, SPL, WATCH_T, X }) {
  const K = .28, bx = x => (x - X0) * K;
  const BOARD = { x0: -420, y0: -1500, x1: 5400, y1: 1500, r: 12, inset: 3 };
  const CLR = 3.2, VIA_R = 3.4, FENCE_R = 2.6;
  const TRACES = [], PADS = [], SILK = [], KEEP = [], DESIG = [], VIAS = [], LABELS = [], LAKES = [];
  const tr = (id, pts, w, o = {}) => { const t = { id, pts, w, ...o, m: measure(pts) }; TRACES.push(t); return t; };
  // —— the route: from her start pad to the station clock (U1)
  const UX = 4700, route = tr('route', [[-200, 0], [UX - 22, 0]], 14);
  PADS.push({ x: -200, y: 0, r: 22, shape: 'square', hole: 6, id: 'start' }); SILK.push({ circle: [-200, 0, 36], w: 2 });
  LABELS.push({ id: 'aki', text: 'AKI', x: -200, y: 52, cap: 26, sw: 3.2, align: 'center' }, { id: 'run', text: 'RUN 4.06 m/s', x: -200, y: 92, cap: 13, sw: 2, align: 'center' });
  // ruler under the route: 1 m ticks, 5 m numbers (designators fade when too small)
  for (let x = 0; x <= 4600; x += 100) SILK.push({ pts: [[x, 62], [x, 62 + (x % 500 === 0 ? 16 : 8)]], w: 1.5 });
  SILK.push({ pts: [[0, 62], [4600, 62]], w: 1.3 });
  for (let x = 500; x <= 4500; x += 500) DESIG.push({ text: `${x / 100} m`, x, y: 84, cap: 11, align: 'center' });
  // —— the rest of the street, unlit: the kerb (a ground bus south of the route), lamp posts (test pads every 9 m), the shopfronts (footprints north)
  tr('kerb', [[-300, 360], [5300, 360]], 8); tr('kerb2', [[-300, 384], [5300, 384]], 3);
  let li = 1; for (let x = 300; x < 4600; x += 900) { PADS.push({ x, y: 330, r: 11, shape: 'round', hole: 4 }); SILK.push({ circle: [x, 330, 20], w: 1.6 }); DESIG.push({ text: 'L' + li++, x: x + 26, y: 316, cap: 10, align: 'left' }); }
  ['HOTEL', 'BAR', 'PHARMACY', 'BOOKS', 'NOODLES', 'RECORDS', 'BAKERY', 'LAUNDRY'].forEach((nm, i) => { const x = -60 + i * 600, y0 = -620, y1 = -330;
    SILK.push({ pts: [[x, y0], [x + 540, y0], [x + 540, y1], [x, y1], [x, y0]], w: 2 }); for (let k = 0; k < 4; k++) PADS.push({ x: x + 70 + k * 130, y: y1 - 24, w: 40, h: 12, shape: 'rect', r: 2 });
    LABELS.push({ id: 'shop' + i, text: nm, x: x + 270, y: y0 + 60, cap: 30, sw: 3.4, align: 'center' }); DESIG.push({ text: 'J' + (i + 1), x: x + 10, y: y0 - 22, cap: 12, align: 'left' }); });
  // —— footfalls: a via per contact, poses plotted at near-foot contacts
  const STEPS = RUN.contacts.filter(c => c.t0 > -.4 && c.t0 < 10.4).map((c, i) => ({ ...c, i, x: bx(c.x + 44), y: c.foot === 'n' ? 27 : -27 }));
  for (const s of STEPS) VIAS.push([s.x, s.y, VIA_R * 1.6, VIA_R * .7]);
  const FIGS = [];
  STEPS.filter(s => s.foot === 'n' && s.t0 > -.2).forEach(s => {
    const J = solveProfile(poseAt(s.t0)), G = -46, P = p => [bx(p[0]), G + p[1] * K], id = 'fig' + s.i, w = 2.1;
    const leg = l => { const c = Math.cos(l.pitch), sn = Math.sin(l.pitch); return [P(l.hip), P(l.knee), P(l.ankle), P([l.ankle[0] + 66 * c, l.ankle[1] + 66 * sn])]; };
    const arm = a => [P(a.sh), P(a.el), P(a.wr), P([a.wr[0] + (a.wr[0] - a.el[0]) * .25, a.wr[1] + (a.wr[1] - a.el[1]) * .25])];
    const TT = (b, u, f) => P([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
    const coat = [TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)];
    const hc = P(J.headC);
    for (const pts of [leg(J.leg.f), arm(J.arm.f), [...coat, coat[0]], leg(J.leg.n), arm(J.arm.n), [P(J.neckBase), P(J.neckTop)]]) SILK.push({ pts, w, plot: id });
    SILK.push({ circle: [hc[0], hc[1], 46 * K], w, plot: id });
    SILK.push({ pts: [[hc[0] - 46 * K * .9, hc[1] - 3], [hc[0] - 46 * K * 2.1, hc[1] - 8], [hc[0] - 46 * K * 3.1, hc[1] + 1]], w, plot: id });   // the ponytail
    SILK.push({ pts: [[s.x - 30, G + 4], [s.x + 30, G + 4]], w: 1.4, plot: id });
    DESIG.push({ text: s.t0.toFixed(2), x: s.x, y: G + 10, cap: 8, align: 'center' });
    FIGS.push({ id, t0: s.t0 });
  });
  // —— the puddle: a lake cut out of the copper, the route crossing it; fenced with vias
  const PX = bx(SPL.x + 44), lake = octi([[PX - 95, -78], [PX + 70, -78], [PX + 108, -40], [PX + 108, 30], [PX + 60, 62], [PX - 80, 62], [PX - 112, 22], [PX - 112, -50], [PX - 95, -78]]);
  LAKES.push(lake);
  LABELS.push({ id: 'wet', text: 'WET', x: PX, y: -150, cap: 26, sw: 3.2, align: 'center' }, { id: 'wett', text: '0.94 s', x: PX, y: -112, cap: 15, sw: 2.2, align: 'center' });
  // —— the watch: a module south of the route, tapped where she raises her wrist
  const WX = bx(X(WATCH_T)), M0 = [WX - 120, 120], M1 = [WX + 170, 300];
  const tap = tr('tap', [[WX, 7], [WX, 104], [WX + 16, 120]], 6);
  SILK.push({ pts: [[M0[0], M0[1]], [M1[0], M0[1]], [M1[0], M1[1]], [M0[0], M1[1]], [M0[0], M0[1]]], w: 2.2 });
  LABELS.push({ id: 'watch', text: 'WATCH', x: M0[0] + 6, y: M1[1] + 14, cap: 18, sw: 2.6, align: 'left' });
  DESIG.push({ text: 'U3', x: M1[0] - 40, y: M1[1] + 16, cap: 12, align: 'left' });
  // the quartz crystal X1 (HC-49 footprint) and its trace to the display driver: AC, 32768 Hz
  const XC = [WX - 60, 245], xt = chip(XC, 48, 14, 16, { sw: 1.4 }); PADS.push(...xt.pads); KEEP.push(...xt.keep);
  SILK.push({ pts: [[XC[0] - 30, XC[1] - 13], [XC[0] + 30, XC[1] - 13], [XC[0] + 38, XC[1] - 5], [XC[0] + 38, XC[1] + 5], [XC[0] + 30, XC[1] + 13], [XC[0] - 30, XC[1] + 13], [XC[0] - 38, XC[1] + 5], [XC[0] - 38, XC[1] - 5], [XC[0] - 30, XC[1] - 13]], w: 1.4 });
  DESIG.push({ text: 'X1 32.768 kHz', x: XC[0], y: XC[1] + 22, cap: 7, align: 'center' });
  const osc = tr('osc', [[XC[0] + 24, XC[1]], [XC[0] + 52, XC[1]], [XC[0] + 70, XC[1] - 18], [XC[0] + 70, 200]], 4);
  // the display: 6 digits + 2 colons as gold segment pads (lit in amber when the time is shown)
  const DX = WX - 26, DY = 140, SEG = [], DIG = [];
  const segOf = (x, y) => ({ a: [[x + 4, y], [x + 18, y]], b: [[x + 22, y + 4], [x + 22, y + 18]], c: [[x + 22, y + 24], [x + 22, y + 38]], d: [[x + 4, y + 42], [x + 18, y + 42]], e: [[x, y + 24], [x, y + 38]], f: [[x, y + 4], [x, y + 18]], g: [[x + 4, y + 21], [x + 18, y + 21]] });
  // the LED display sits in a window of bare laminate; its unlit segments are faint silkscreen outlines, lit ones are light
  KEEP.push({ rect: [DX - 8, DY - 8, DX + 200, DY + 50] });
  [0, 30, 70, 100, 140, 170].forEach(o => { const S = segOf(DX + o, DY); DIG.push(S); for (const L of Object.values(S)) SILK.push({ pts: L, w: .7 }); });
  const COL = [[DX + 59, DY + 13], [DX + 59, DY + 29], [DX + 129, DY + 13], [DX + 129, DY + 29]];
  SILK.push({ pts: [[DX - 10, DY - 10], [DX + 202, DY - 10], [DX + 202, DY + 52], [DX - 10, DY + 52], [DX - 10, DY - 10]], w: 1.6 });
  // —— the station clock U1 at the east end: pads on four sides, a silkscreen clock face; radial traces carry its chime
  const UC = [UX + 120, 0], US = 120;
  for (let i = 0; i < 11; i++) { const o = -US + 20 + i * 22; PADS.push({ x: UC[0] - US - 4, y: o, w: 16, h: 7, shape: 'rect', r: 1 }, { x: UC[0] + US + 4, y: o, w: 16, h: 7, shape: 'rect', r: 1 }, { x: UC[0] + o, y: -US - 4, w: 7, h: 16, shape: 'rect', r: 1 }, { x: UC[0] + o, y: US + 4, w: 7, h: 16, shape: 'rect', r: 1 }); }
  KEEP.push({ rect: [UC[0] - US, -US, UC[0] + US, US] });
  SILK.push({ pts: [[UC[0] - US + 10, -US + 10], [UC[0] + US - 10, -US + 10], [UC[0] + US - 10, US - 10], [UC[0] - US + 10, US - 10], [UC[0] - US + 10, -US + 10]], w: 2.4 }, { circle: [UC[0] - US + 26, -US + 26, 5], w: 2 });
  SILK.push({ circle: [UC[0], UC[1], 70], w: 3 }); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; SILK.push({ pts: [[UC[0] + Math.sin(a) * 58, -Math.cos(a) * 58], [UC[0] + Math.sin(a) * 68, -Math.cos(a) * 68]], w: 3 }); }
  const mn = 58.8, hr = 11 + mn / 60; SILK.push({ pts: [[UC[0], 0], [UC[0] + Math.sin(mn / 60 * Math.PI * 2) * 58, -Math.cos(mn / 60 * Math.PI * 2) * 58]], w: 3.4 }, { pts: [[UC[0], 0], [UC[0] + Math.sin(hr / 12 * Math.PI * 2) * 38, -Math.cos(hr / 12 * Math.PI * 2) * 38]], w: 5 });
  DESIG.push({ text: 'U1', x: UC[0] - US, y: -US - 34, cap: 14, align: 'left' });
  LABELS.push({ id: 'station', text: 'STATION', x: UC[0], y: US + 44, cap: 30, sw: 3.6, align: 'center' }, { id: 'clock', text: 'CLOCK TOWER', x: UC[0], y: US + 86, cap: 15, sw: 2.2, align: 'center' },
    { id: 'chime', text: 'CHIME 11:58:49', x: UC[0], y: -US - 88, cap: 22, sw: 3, align: 'center' });
  const RAYS = [[1, 0], [1, 1], [0, 1], [-1, 1], [0, -1], [1, -1], [-1, -1]].map(([dx, dy], i) => { const L = 330, a = [UC[0] + dx * (US + 14), dy * (US + 14)], b = [a[0] + dx * L * (dx && dy ? .72 : 1), a[1] + dy * L * (dx && dy ? .72 : 1)]; PADS.push({ x: b[0], y: b[1], r: 9, shape: 'round', hole: 3 }); return tr('ray' + i, [a, b], 6); });
  // —— board texture: stitching vias on the pour, a fence around the lake, a few real parts (decoupling caps on the route)
  const rnd = mulberry(77);
  const stitch = () => { const out = []; for (let x = BOARD.x0 + 40; x < BOARD.x1 - 40; x += 80) for (let y = BOARD.y0 + 40; y < BOARD.y1 - 40; y += 80) {
    const jx = x + ((y / 80) % 2) * 40; if (Math.abs(y) < 120 && jx > -260 && jx < UX + 300) continue; if (jx > M0[0] - 30 && jx < M1[0] + 30 && y > M0[1] - 30 && y < M1[1] + 30) continue; if (jx > UC[0] - US - 380 && jx < UC[0] + US + 380 && Math.abs(y) < US + 380) continue; out.push([jx, y]); } return out; };
  const fence = () => { const out = []; for (let i = 0; i < lake.length - 1; i++) { const a = lake[i], b = lake[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L / 14); for (let k = 0; k < n; k++) { const u = k / n, nx = (b[1] - a[1]) / L, ny = -(b[0] - a[0]) / L; out.push([a[0] + (b[0] - a[0]) * u - nx * 12, a[1] + (b[1] - a[1]) * u - ny * 12]); } } return out.filter(p => Math.abs(p[1]) > 14); };
  return { BOARD, CLR, VIA_R, FENCE_R, TRACES, PADS, SILK, KEEP, DESIG, VIAS, LABELS, LAKES, stitch, fence,
    route, tap, osc, RAYS, STEPS, FIGS, PX, WX, DIG, COL, UC, US, XC, M0, M1 };
}
