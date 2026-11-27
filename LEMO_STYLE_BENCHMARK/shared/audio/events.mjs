// Exports the film's sound cues from the shared rig: every footfall (and which one is in the puddle) and the story events.
import { runner } from '../aki2/motion.js';
import { CADENCE, FIRST_STEP, STEP, T } from '../clip10.js';
import fs from 'fs';
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const steps = RUN.contacts.filter(c => c.t0 >= 0 && c.t0 < 10).map(c => ({ t: +c.t0.toFixed(4), foot: c.foot, puddle: Math.abs(c.t0 - T.splash) < .02 }));
const ev = { duration: 10, steps, splash: T.splash, watchUp: T.watchUp, watchDown: T.watchDown, clockTick: 8.4, chime: T.chime, cuts: [2.5, 7.5, 9.375], firstStep: FIRST_STEP };
fs.writeFileSync(new URL('./events.json', import.meta.url), JSON.stringify(ev, null, 1)); console.log(steps.length, 'steps');
