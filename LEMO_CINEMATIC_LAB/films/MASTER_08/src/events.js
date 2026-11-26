// Sound events for the mixer (exported to events.json by core/render/events.mjs). Every foley hit sits on its frame.
import { T, b, LINES, SHOTS } from './timeline.js';
import { RUN } from './shots_a.js';
export function buildEvents(A) {
  const ev = [], add = (type, t, o = {}) => ev.push({ type, t: +t.toFixed(3), ...o });
  const shot = id => SHOTS.find(s => s[2] === id);
  // running footsteps on wet pavement S1–S5 (each real touch-down), louder/closer in S1 & S5
  for (const c of RUN.contacts) if (c.t0 >= 0 && c.t0 < T.brake - .05) {
    const s = SHOTS.find(x => c.t0 >= x[0] && c.t0 < x[1]); if (!s) continue;
    const near = { S1_puddle: 1, S2_run: .8, S3_watch: .6, S4_wide: .25, S5_face: .7 }[s[2]] ?? .5;
    add('step_wet', c.t0, { v: near, pan: s[2] === 'S2_run' ? 0 : .1 });
  }
  add('splash_big', T.splash1, { v: 1 });
  add('chime', T.chime, { v: .8 });
  add('mew', T.mew1, { v: .55, k: 1 }); add('mew', T.mew2, { v: .8, k: 2 }); add('mew', T.mew3, { v: .9, k: 3 });
  for (const L of LINES) add('voice', L.t, { id: L.id, who: L.who });
  if (A?.B?.events) A.B.events(add); if (A?.C?.events) A.C.events(add);
  return ev.sort((a, b2) => a.t - b2.t);
}
