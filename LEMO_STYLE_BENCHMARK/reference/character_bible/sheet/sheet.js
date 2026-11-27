// AKI v2 character sheet — drawn with the same functions the animated clips use (page A: turnaround; page B: details).
import { W, H } from './shared/lib/cel.js';
import { PAL } from './shared/aki2/palette.js';
import { headFront, head34v2, headProfile2, headBack, eye2 } from './shared/aki2/face2.js';
import { hairFront, hairBack, hairUnder, hairOver } from './shared/aki2/hair2.js';
import { figureFront, figureBack } from './shared/aki2/body2.js';
import { solveProfile, drawProfile } from './shared/aki2/aki_profile.js';
import { hand2 } from './shared/aki2/hands2.js';
import { resetSil } from './shared/lib/celgroup.js';
const g = document.getElementById('c').getContext('2d', { willReadFrequently: true });
const P = PAL.day, L = { sh: [6, 2], hi: [2.5, 1] };
await document.fonts.load('600 30px "Barlow SC"');
const label = (t, x, y, s = 22, c = '#4a3e52') => { g.save(); g.font = `600 ${s}px "Barlow SC"`; g.fillStyle = c; g.textAlign = 'center'; g.fillText(t, x, y); g.restore(); };
const bg = () => { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#ecebe6'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(80,70,90,.08)'; g.lineWidth = 1; for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } };
const at = (x, y, s, fn) => { g.save(); g.translate(x, y); g.scale(s, s); fn(); g.restore(); };
const neutral = { open: 1, mouth: 'X', look: [0, 0] };
function standPose(x) {
  return { pelvis: [x, -312], tL: 0, tU: .02, neck: .04, head: -.02,
    legs: { n: { ball: [x + 30, 0], pitch: 0, planted: 1 }, f: { ball: [x + 8, 0], pitch: 0, planted: 1 } },
    arms: { n: { sh: .05, el: .12, wr: .1, hand: 'relax' }, f: { sh: -.08, el: .15, wr: .1, hand: 'relax' } } };
}
function pageA() {
  bg(); resetSil();
  label('AKI — v2 concept · turnaround', 960, 44, 30, '#2a2030');
  const hs = 2.35, hy = 190; const ho = { P, L, hair: {} };
  at(250, hy, hs, () => { hairFront(g, P, [0, 0], 0, ho, 'under'); headFront(g, P, [0, 0], 0, neutral, L, ho); hairFront(g, P, [0, 0], 0, ho, 'over'); }); label('front', 250, 330);
  at(560, hy, hs, () => { const J = { headC: [0, 0], headA: 0 }; hairUnder(g, P, J, ho, '34'); head34v2(g, P, [0, 0], 0, neutral, L, ho); hairOver(g, P, J, ho, '34'); }); label('3/4', 560, 330);
  at(870, hy, hs, () => { const J = { headC: [0, 0], headA: 0 }; hairUnder(g, P, J, ho, 'side'); headProfile2(g, P, [0, 0], 0, neutral, L, ho); hairOver(g, P, J, ho, 'side'); }); label('profile', 870, 330);
  at(1180, hy, hs, () => { headBack(g, P, [0, 0], 0, L, ho); hairBack(g, P, [0, 0], 0, ho); }); label('back', 1180, 330);
  // full figures
  const fs = .92, gy = 1040;
  at(240, gy, fs, () => figureFront(g, P, L, { face: neutral })); label('front', 240, gy - 590);
  at(560, gy, fs, () => drawProfile(g, solveProfile(standPose(-10)), { P, L, jacket: 1, face: neutral, watch: 1 })); label('profile', 560, gy - 590);
  at(880, gy, fs, () => figureBack(g, P, L, {})); label('back', 880, gy - 590);
  // proportion guide: 7.5 heads
  g.strokeStyle = 'rgba(60,40,80,.35)'; g.lineWidth = 1; g.setLineDash([6, 6]);
  for (let i = 0; i <= 7.5; i += .5) { const y = gy - i * 80 * fs; if (i % 1 === 0 || i === 7.5) { g.beginPath(); g.moveTo(60, y); g.lineTo(1060, y); g.stroke(); label(String(i), 40, y + 7, 16); } }
  g.setLineDash([]);
  // notes + palette
  const notes = ['24 · junior draughtsperson · 7.5 heads (1.62 m)', 'eyes: narrow almond, lid covers the top of the iris,', 'outer corner lifted, lash line thickest at the outer third', 'brows: tapered, arch at 2/3, start over the inner corner',
    'nose: planes, not outlines · lips: light cupid’s bow', 'hair: dark plum, side part (her right), bangs off the eyes,', 'locks over the ears, flipped shoulder-length ends', 'accent colour: vermilion trench (one in every light)', 'watch: gold, left wrist'];
  g.save(); g.font = '600 24px "Barlow SC"'; g.fillStyle = '#2a2030'; g.textAlign = 'left'; notes.forEach((t, i) => g.fillText(t, 1330, 150 + i * 36)); g.restore();
  const sw = [['skin', P.skin.f], ['skin shade', P.skin.s], ['hair', P.hair.f], ['hair shine', P.hair.h], ['eyes', P.eye.f], ['jacket', P.jacket.f], ['jacket shade', P.jacket.s], ['knit', P.sweater.f], ['trousers', P.trousers.f], ['boots', P.boots.f], ['watch', P.gold.f]];
  sw.forEach(([n, c], i) => { const x = 1330 + (i % 4) * 140, y = 520 + Math.floor(i / 4) * 110; g.fillStyle = c; g.fillRect(x, y, 110, 62); g.strokeStyle = '#2a2030'; g.strokeRect(x, y, 110, 62); g.save(); g.font = '600 18px "Barlow SC"'; g.fillStyle = '#2a2030'; g.fillText(n, x, y + 84); g.restore(); });
}
function pageB() {
  bg(); resetSil();
  label('AKI — v2 concept · eyes · expressions · hands', 960, 44, 30, '#2a2030');
  // eye detail (front, right eye) at 11×
  const eyes = [['open', { open: 1, look: [0, 0] }], ['half-lid', { open: .62, lid: .3 }], ['look down', { open: .9, look: [.1, .8], lid: .15 }], ['closed', { open: 0 }]];
  eyes.forEach(([n, e], i) => { at(170 + i * 230, 175, 7.6, () => { g.fillStyle = P.skin.f; g.fillRect(-15, -10, 30, 20); eye2(g, P, { cx: 0, cy: 0, w: 19, h: 9.5, dir: 1, lx: .6, k: .16, ...e }); }); label(n, 170 + i * 230, 262); });
  // expressions (3/4)
  const ex = [['neutral', neutral], ['running · worried', { open: .85, lid: .2, mouth: 'pant', brow: [-3.5, 2.5, 1.2], sweat: 1, look: [.4, -.2] }], ['surprise', { open: 1.15, iris: .86, mouth: 'O', brow: [-5, -4, 3] }],
    ['tender smile', { open: .55, smileEyes: 1, mouth: 'smile', blush: 1, brow: [-1, -1, 2], look: [0, .5] }], ['determined', { open: .9, lid: .35, mouth: 'M', brow: [3, -2, .8], look: [.5, 0] }], ['sad', { open: .7, lid: .25, mouth: 'sad', brow: [-5, 3, 1], look: [-.2, .6], tear: .5 }]];
  ex.forEach(([n, f], i) => { at(165 + i * 318, 470, 2.05, () => { const J = { headC: [0, 0], headA: 0 }, ho = { P, L, hair: {} }; hairUnder(g, P, J, ho, '34'); head34v2(g, P, [0, 0], 0, f, L, ho); hairOver(g, P, J, ho, '34'); }); label(n, 165 + i * 318, 600); });
  // hands (dorsal view, five fingers)
  const hp = [['open', { pose: 'open', spread: 1 }], ['relaxed', { pose: 'relaxed' }], ['fist', { pose: 'fist' }], ['grip', { pose: 'grip' }], ['point', { pose: 'point' }]];
  hp.forEach(([n, o], i) => { at(170 + i * 250, 700, 3.4, () => { g.save(); g.fillStyle = P.jacket.f; g.fillRect(-12, -2, 24, 6); g.restore(); hand2(g, P, L, 0, 4, { ang: Math.PI / 2, side: 1, ...o }); }); label(n, 170 + i * 250, 1010); });
  // the watch wrist, as seen when she checks the time while running
  at(1600, 760, 3.2, () => { g.fillStyle = P.jacket.f; g.beginPath(); g.moveTo(-70, -16); g.lineTo(-20, -15); g.lineTo(-20, 15); g.lineTo(-70, 17); g.fill(); g.fillStyle = P.skin.f; g.fillRect(-22, -11, 16, 22); g.fillStyle = P.strap.f; g.fillRect(-16, -12, 9, 24); g.fillStyle = P.gold.f; g.beginPath(); g.arc(-11.5, 0, 8.5, 0, 7); g.fill(); g.fillStyle = '#f2eee0'; g.beginPath(); g.arc(-11.5, 0, 6.6, 0, 7); g.fill(); hand2(g, P, L, -6, 0, { ang: 0, side: 1, pose: 'relaxed', s: .9 }); });
  label('left wrist · gold watch', 1600, 1010);
}
window.DUR = 2; window.render = t => (t < 1 ? pageA() : pageB()); window.render(0); window.READY = true;
