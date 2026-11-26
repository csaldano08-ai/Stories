// Model sheet & action tests (?test=model|run|...). Rendered with the film's real drawing code.
import { solveProfile, drawProfile } from './chars/aki.js';
import { head34, headProfile } from './chars/head.js';
import { hairUnder, hairOver } from './chars/hair.js';
import { PAL } from './chars/palette.js';
import { runner, secondary } from './chars/motion.js';
import { W, H } from './lib/cel.js';
import { celGroup } from './lib/celgroup.js';
import { dirUp } from './lib/rig.js';

const LIGHT = { sh: [7, 2], hi: [3, 1], rim: { c: '#ff6fbf', d: [-3, 0] } };
const LIGHTD = { sh: [7, 2], hi: [3, 1] };
function standPose(x, extra = {}) {
  return { pelvis: [x, -312], tL: 0, tU: .02, neck: .04, head: -.02,
    legs: { n: { ball: [x + 30, 0], pitch: 0, planted: 1 }, f: { ball: [x + 8, 0], pitch: 0, planted: 1 } },
    arms: { n: { sh: .05, el: .12, wr: .1, hand: 'relax' }, f: { sh: -.08, el: .15, wr: .1, hand: 'relax' } }, ...extra };
}
export function test(g, e, t, which) {
  g.fillStyle = '#d9d4dc'; g.fillRect(0, 0, W, H);
  if (which === 'model') {
    const P = PAL.day;
    // profile turnaround-ish row: stand (jacket), stand (sweater), run phases
    g.save(); g.translate(0, 1000); g.scale(.82, .82);
    const s1 = solveProfile(standPose(170));
    drawProfile(g, s1, { P, L: LIGHTD, jacket: 1, face: { open: 1, mouth: 'X' } });
    const s2 = solveProfile(standPose(470));
    drawProfile(g, s2, { P, L: LIGHTD, jacket: 0, face: { open: 1, mouth: 'smile', blush: .6 } });
    const R = runner({ t0: 0, x0: 0, v: 1450, cadence: 2.9 });
    for (let i = 0; i < 4; i++) {
      const tt = .5 + i * R.T / 2;
      const S = R.pose(tt); const dx = 800 + i * 310 - S.pelvis[0];
      S.pelvis = [S.pelvis[0] + dx, S.pelvis[1]];
      for (const k of ['n', 'f']) S.legs[k].ball = [S.legs[k].ball[0] + dx, S.legs[k].ball[1]];
      const sec = secondary(tq => { const p = R.pelvisAt(tq); return [p[0], p[1] - 250]; }, 0, tt);
      drawProfile(g, solveProfile(S), { P, L: LIGHTD, jacket: 1, ...sec, face: { open: .8, lid: .2, mouth: 'pant', brow: [-3, 2, 1.5], sweat: 1 } });
    }
    g.restore();
    // heads, large
    const faces = [{ open: 1, mouth: 'X' }, { open: .7, lid: .3, mouth: 'pant', brow: [-4, 3, 1], sweat: 1 }, { open: 1.15, iris: .85, mouth: 'O', brow: [-5, -4, 3] }, { open: .62, mouth: 'smile', smileEyes: 1, blush: 1 }, { open: 0, mouth: 'soft' }];
    faces.forEach((f, i) => {
      const J = { headC: [150 + i * 230, 130], headA: 0 };
      g.save(); g.scale(1, 1);
      const o = { P, L: LIGHT, hair: {} };
      g.save(); g.translate(0, 0); g.scale(1.9, 1.9); g.translate(-J.headC[0] * .474, -J.headC[1] * .474);
      const J2 = { headC: [J.headC[0], J.headC[1]], headA: 0 };
      g.restore();
      g.save(); g.translate(J.headC[0], J.headC[1]); g.scale(2, 2);
      const J3 = { headC: [0, 0], headA: 0 };
      hairUnder(g, P, J3, o, '34'); head34(g, P, [0, 0], 0, f, LIGHT, o); hairOver(g, P, J3, o, '34');
      g.restore();
      g.save(); g.translate(J.headC[0], J.headC[1] + 210); g.scale(2, 2);
      hairUnder(g, P, J3, o, 'side'); headProfile(g, P, [0, 0], 0, f, LIGHT, o); hairOver(g, P, J3, o, 'side');
      g.restore();
      g.restore();
    });
  }
}
export function testRun(g, e, t) {
  g.fillStyle = '#2a2140'; g.fillRect(0, 0, W, H);
  const P = PAL.street, L = { sh: [8, 2], hi: [3, 1], rim: { c: '#ff5fb3', d: [-3, 0] } };
  const R = runner({ t0: 0, x0: 0, v: 1450, cadence: 2.9 });
  const S = R.pose(t);
  const cam = R.pelvisAt(t)[0];
  g.save(); g.translate(960 - cam * .9, 1000); g.scale(.9, .9);
  const sec = secondary(tq => { const p = R.pelvisAt(tq); return [p[0], p[1] - 250]; }, 0, t);
  drawProfile(g, solveProfile(S), { P, L, jacket: 1, ...sec, face: { open: .8, lid: .2, mouth: 'pant', brow: [-3, 2, 1.5] } });
  g.restore();
}
import { drawKitten } from './chars/kitten.js';
import { drawBust34 } from './chars/aki34.js';
export function testKit(g, e, t) {
  g.fillStyle = '#2a2a3a'; g.fillRect(0, 0, W, H);
  const P = PAL.canopy, L = { sh: [6, 2], hi: [2, 1], rim: { c: '#59e6ff', d: [-2, 0] } };
  const ks = [{ wet: 1, shiver: 1, time: t, eyes: 1, pupil: .9 }, { wet: 1, mouth: .8, headTilt: -.2, eyes: 1, pupil: .8, earL: -.2, paw: .5 }, { wet: .6, eyes: .1, yawn: 0 }, { wet: .5, yawn: 1, eyes: .2 }];
  ks.forEach((k, i) => { g.save(); g.translate(220 + i * 330, 420); g.scale(3.2, 3.2); drawKitten(g, P, k, L); g.restore(); });
  const PI = PAL.interior;
  for (let i = 0; i < 3; i++) {
    g.save(); g.translate(330 + i * 620, 800); g.scale(1.6, 1.6);
    drawBust34(g, i === 1 ? PI : P, { wet: .8, breathe: t * 3, face: [{ open: 1, mouth: 'X', look: [.4, -.3] }, { open: .6, smileEyes: 1, mouth: 'smile', blush: .8, look: [0, .6] }, { open: .9, mouth: 'A', brow: [-3, -2, 2] }][i],
      head: [-.05, .12, 0][i], kit: { wet: .6, eyes: i === 1 ? .2 : 1, pupil: .7, time: t }, hair: {} }, i === 1 ? { sh: [6, 2], hi: [2, 1], rim: { c: '#ffd9a0', d: [-2, 0] } } : L);
    g.restore();
  }
}
