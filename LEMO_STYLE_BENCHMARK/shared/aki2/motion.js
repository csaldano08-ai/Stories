// Locomotion & secondary motion for Aki (profile). All functions are pure functions of time (deterministic).
import { planGait, footAt, lagOffset } from '../lib/rig.js';
import { lerp, clamp } from '../lib/util.js';

export const HIP_STAND = 312;

// soft-limit a vector's length (hair can stream, but never further than its length allows)
export const soft = (v, m) => { const L = Math.hypot(v[0], v[1]); if (L < 1e-6) return [0, 0]; const k = m * Math.tanh(L / m) / L; return [v[0] * k, v[1] * k]; };

// A steady run (profile, facing +x). Returns {pose(t), pelvisAt(t), contacts, phase(t)}.
export function runner({ t0 = 0, t1 = 10, x0 = 0, v = 1450, cadence = 2.9, duty = .62, lean = .14, armA = .62, y = 0 }) {
  const T = 1 / cadence;
  const contacts = planGait({ t0, t1, x0, v, cadence, duty, lead: .07, first: 'n', L: HIP_STAND, y, strike: -.22, toeoff: .85, flatTo: .42 });
  const firstN = contacts.find(c => c.foot === 'n').t0;
  const midStance = firstN + T * duty * .5;
  const pelvisAt = t => [x0 + v * (t - t0), y - (300 - 9 * Math.cos(2 * Math.PI * cadence * (t - midStance)))];
  const P = { legLen: 294, run: 1 };
  const phase = t => 2 * Math.PI * (t - firstN) / (2 * T);
  const pose = t => {
    const ph = phase(t), c = Math.cos(ph), s2 = Math.sin(2 * Math.PI * cadence * (t - midStance));
    const fN = footAt(contacts, 'n', t, pelvisAt, P), fF = footAt(contacts, 'f', t, pelvisAt, P);
    return {
      pelvis: pelvisAt(t), tL: lean * .7 + .02 * s2, tU: lean + .03 * s2, neck: lean * .3, head: -lean * .55 - .03 * s2,
      legs: { n: { ball: fN.ball, pitch: fN.pitch, planted: fN.planted }, f: { ball: fF.ball, pitch: fF.pitch, planted: fF.planted } },
      arms: {
        n: { sh: -armA * c - .05, el: 1.6 - .32 * c, wr: .2, hand: 'fist' },
        f: { sh: armA * c - .05, el: 1.6 + .32 * c, wr: .2, hand: 'fist' },
      },
    };
  };
  return { pose, pelvisAt, contacts, phase, T };
}

// secondary motion of hair & jacket, driven by a body point. anchor(t) world → offsets
export function secondary(anchor, tStart, t, opt = {}) {
  const back = soft(lagOffset(anchor, tStart, t, opt.kb ?? 8, opt.zb ?? .32, [0, 0]), opt.mb ?? 34);
  const side = soft(lagOffset(anchor, tStart, t, opt.ks ?? 11, opt.zs ?? .3, [0, 0]), opt.ms ?? 18);
  const bang = soft(lagOffset(anchor, tStart, t, opt.kg ?? 16, opt.zg ?? .4, [0, 0]), opt.mg ?? 7);
  const hem = soft(lagOffset(anchor, tStart, t, opt.kh ?? 10, opt.zh ?? .35, [0, 0]), opt.mh ?? 28);
  const hemF = soft(lagOffset(anchor, tStart, t, opt.kf ?? 13, opt.zf ?? .3, [0, 0]), opt.mf ?? 14);
  // the jacket hem lifts when it trails (it swings back AND up around the hips)
  return { hair: { back, side, bang, back2: back, side2: side }, hemB: [hem[0], hem[1] - Math.abs(hem[0]) * .35], hemF: [hemF[0], hemF[1] - Math.abs(hemF[0]) * .3] };
}
export { lerp, clamp };
