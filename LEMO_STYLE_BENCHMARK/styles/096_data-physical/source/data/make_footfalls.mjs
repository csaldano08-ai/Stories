// Writes footfalls.csv from the shared run rig (the same runner every style uses): one row per foot contact in the first 10 s.
// Usage: node data/make_footfalls.mjs  (from the source folder). The chart reads this file by column name.
import { runner } from '../shared/aki2/motion.js';
import { CADENCE, FIRST_STEP, STEP, T as EV } from '../shared/clip10.js';
import fs from 'fs';
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const UM = .0028, X0 = RUN.pelvisAt(0)[0];
const clock = t => { const s = 23 * 3600 + 58 * 60 + 48 + (t - 8.4), S = Math.floor(s + 1e-6); return [Math.floor(S / 3600), Math.floor(S / 60) % 60, S % 60].map(v => String(v).padStart(2, '0')).join(':') + '.' + String(Math.floor((s - S) * 10)); };
const rows = RUN.contacts.filter(c => c.t0 >= 0 && c.t0 <= 10).map((c, i) => [i + 1, c.t0.toFixed(4), clock(c.t0), ((c.x + 44 - X0) * UM).toFixed(3), Math.abs(c.t0 - EV.splash) < .02 ? 1 : 0]);
const head = 'step,t_s,clock,distance_m,in_puddle';
fs.writeFileSync(new URL('./footfalls.csv', import.meta.url), [head, ...rows.map(r => r.join(','))].join('\n') + '\n');
console.log(head); rows.slice(0, 4).forEach(r => console.log(r.join(','))); console.log('…', rows.length, 'rows; speed', (1450 * UM).toFixed(2), 'm/s');
