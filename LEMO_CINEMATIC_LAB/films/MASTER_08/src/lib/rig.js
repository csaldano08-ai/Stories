// LEMO_CINEMATIC_LAB — 2D character rig toolkit (original code for MASTER 08, reusable).
// Conventions: world units u (a 1.62 m character = 600 u ⇒ 1 m ≈ 370 u), y grows DOWN (screen-like), ground at y = 0.
// Limb angles are measured from straight DOWN, positive toward the facing direction (+x): dirDown(a) = (sin a, cos a).
// Spine angles are measured from straight UP, positive = leaning forward: dirUp(a) = (sin a, -cos a).
import { clamp, lerp } from './util.js';

export const dirDown = a => [Math.sin(a), Math.cos(a)];
export const dirUp = a => [Math.sin(a), -Math.cos(a)];
export const add = (p, v, s = 1) => [p[0] + v[0] * s, p[1] + v[1] * s];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const len = v => Math.hypot(v[0], v[1]);
export const mixP = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const rot = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; };
export const ang = v => Math.atan2(v[1], v[0]);

// Two-bone IK. a = root (hip/shoulder), t = target (ankle/wrist), l1/l2 bone lengths.
// bend = +1 puts the middle joint on the +x side of the a→t line when it points down (a knee bending forward),
// bend = -1 the other side (an elbow pointing back). Unreachable targets are clamped (limb fully straight, no stretch).
export function ik2(a, t, l1, l2, bend = 1) {
  let d = sub(t, a), D = len(d);
  const maxR = (l1 + l2) * 0.9995, minR = Math.abs(l1 - l2) + 1e-3;
  const Dc = clamp(D, minR, maxR);
  if (D < 1e-6) d = [0, 1], D = 1;
  const u = [d[0] / D, d[1] / D];
  const x = (l1 * l1 - l2 * l2 + Dc * Dc) / (2 * Dc);
  const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  // perpendicular: rotate u by -90° (screen space, y down) → points to +x when u points down
  const n = [-u[1] * bend, u[0] * bend];
  const mid = [a[0] + u[0] * x - n[0] * h, a[1] + u[1] * x - n[1] * h];
  const end = [a[0] + u[0] * Dc, a[1] + u[1] * Dc];
  return { mid, end, reach: D / (l1 + l2) };
}

// Deterministic second-order lag: the response of a damped spring to a moving anchor, integrated from tStart every call
// (so any frame can be rendered alone). anchor(t) → [x, y]. Returns the lagging point at time t.
// k = natural frequency (rad/s), z = damping ratio, g = constant acceleration (e.g. gravity sag) added to the follower.
export function lagPoint(anchor, tStart, t, k = 14, z = 0.45, g = [0, 0], dt = 1 / 240) {
  let p = anchor(tStart), v = [0, 0];
  const n = Math.max(0, Math.floor((t - tStart) / dt));
  let tt = tStart;
  for (let i = 0; i < n; i++) {
    tt += dt; const A = anchor(tt);
    const ax = k * k * (A[0] - p[0]) - 2 * z * k * v[0] + g[0];
    const ay = k * k * (A[1] - p[1]) - 2 * z * k * v[1] + g[1];
    v = [v[0] + ax * dt, v[1] + ay * dt]; p = [p[0] + v[0] * dt, p[1] + v[1] * dt];
  }
  const rem = t - tt; if (rem > 0) { const A = anchor(t); p = [p[0] + v[0] * rem, p[1] + v[1] * rem]; void A; }
  return p;
}
// Offset version: how far the follower trails its anchor (used to bend hair locks / cloth hems)
export function lagOffset(anchor, tStart, t, k, z, g) { const p = lagPoint(anchor, tStart, t, k, z, g), a = anchor(t); return [p[0] - a[0], p[1] - a[1]]; }

// ——— locomotion ———
// A contact = one foot on the ground: { foot: 'n'|'f', t0 (touch-down), t1 (lift-off), x (ball of foot, world), y (ground) }
// footAt() returns { ball:[x,y], pitch, planted } — pitch > 0 = heel up (rotating about the locked ball), < 0 = toe up (heel strike).
// Swing feet follow a pelvis-relative arc between lift-off and the next touch-down; planted feet never move (foot locking).
export function footAt(contacts, foot, t, pelvisAt, P) {
  const C = contacts.filter(c => c.foot === foot).sort((a, b) => a.t0 - b.t0);
  for (let i = 0; i < C.length; i++) {
    const c = C[i];
    if (t >= c.t0 && t <= c.t1) {
      const u = (t - c.t0) / Math.max(1e-3, c.t1 - c.t0);
      // heel strike → flat → heel rise → toe-off  (pitch in radians)
      const p0 = c.strike ?? -0.18, p1 = c.toeoff ?? 0.75;
      let pitch;
      if (u < 0.18) pitch = lerp(p0, 0, smooth(u / 0.18));
      else if (u < (c.flatTo ?? 0.5)) pitch = 0;
      else pitch = lerp(0, p1, Math.pow((u - (c.flatTo ?? 0.5)) / (1 - (c.flatTo ?? 0.5)), 1.6));
      if (c.hold) pitch = c.holdPitch ?? 0;
      return { ball: [c.x, c.y ?? 0], pitch, planted: true, u };
    }
    const nx = C[i + 1];
    if (nx && t > c.t1 && t < nx.t0) {
      const u = (t - c.t1) / (nx.t0 - c.t1);
      const pA = pelvisAt(c.t1), pB = pelvisAt(nx.t0), pT = pelvisAt(t);
      // pelvis-relative endpoints
      const rA = [c.x - pA[0], (c.y ?? 0) - pA[1]], rB = [nx.x - pB[0], (nx.y ?? 0) - pB[1]];
      const L = P.legLen, run = P.run ?? 1;
      // key arc (relative to pelvis): kick back & up (run) → knee drive forward → reach down to the next contact
      const keys = [
        [0, rA],
        [0.3, [lerp(rA[0], -0.42 * L, run), lerp(rA[1] - 0.12 * L, 0.42 * L, run)]],
        [0.62, [lerp(lerp(rA[0], rB[0], 0.62), 0.22 * L, run), lerp(rA[1] - 0.16 * L, 0.66 * L, run)]],
        [1, rB],
      ];
      const r = catmull(keys, u);
      const pitch = lerp(c.toeoff ?? 0.75, nx.strike ?? -0.18, smooth(u)) + (run ? Math.sin(u * Math.PI) * 0.5 : Math.sin(u * Math.PI) * 0.12);
      return { ball: [pT[0] + r[0], pT[1] + r[1]], pitch, planted: false, u };
    }
  }
  // before the first / after the last contact: stay at the nearest one
  const c = t < C[0].t0 ? C[0] : C[C.length - 1];
  return { ball: [c.x, c.y ?? 0], pitch: c.hold ? (c.holdPitch ?? 0) : 0, planted: true, u: 0 };
}
function catmull(keys, u) {
  let i = 0; while (i < keys.length - 2 && u > keys[i + 1][0]) i++;
  const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(keys.length - 1, i + 2)];
  const s = (u - k1[0]) / (k2[0] - k1[0]);
  const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * s + (2 * a - 5 * b + 4 * c - d) * s * s + (-a + 3 * b - 3 * c + d) * s * s * s);
  return [f(k0[1][0], k1[1][0], k2[1][0], k3[1][0]), f(k0[1][1], k1[1][1], k2[1][1], k3[1][1])];
}
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };

// Plan a steady run/walk: returns contacts alternating feet.
// x0 = pelvis x at t0, v = speed (u/s), cadence = steps/s, duty = fraction of a step period the foot is down (run ≈ .62 of a step, walk > 1)
export function planGait({ t0, t1, x0, v, cadence, duty, lead = 0.1, first = 'n', L = 312, y = 0, strike, toeoff, flatTo }) {
  const T = 1 / cadence, out = []; let foot = first;
  for (let t = t0 - T; t < t1 + T; t += T) {
    const tc = t + T * duty * 0.5;   // mid-stance time; the pelvis passes over the ball here (plus lead)
    out.push({ foot, t0: t, t1: t + T * duty, x: x0 + v * (tc - t0) + lead * L, y, strike, toeoff, flatTo });
    foot = foot === 'n' ? 'f' : 'n';
  }
  return out;
}

// Ankle from the ball of the foot and its pitch (profile, facing +x). Foot geometry in u.
export const FOOT = { ankleToBall: [44, 16], ballToToe: 20, ankleToHeel: [-20, 17] };
export function ankleFromBall(ball, pitch) {
  // ball = rotation pivot; ankle sits behind and above it. pitch>0 lifts the heel (rotates the foot about the ball)
  const v = rot([-FOOT.ankleToBall[0], -FOOT.ankleToBall[1]], pitch);
  return [ball[0] + v[0], ball[1] + v[1]];
}
