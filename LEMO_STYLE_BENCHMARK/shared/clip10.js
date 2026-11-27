// The common 10-second event timeline every style tells (measured on the original: reference/shot_list.json).
export const FPS = 30, DUR = 10, FRAMES = 300;
export const SHOTS = [[0, 2.5, 'S1'], [2.5, 7.5, 'S2'], [7.5, 9.375, 'S3'], [9.375, 10, 'S4']];
export const shotAt = t => SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[3];
// footfalls (touch-down of each step) shared by every style so the common audio stays in sync
export const CADENCE = 2.9, STEP = 1 / CADENCE, FIRST_STEP = 0.9375 - 2 * STEP;   // 0.248, 0.593, 0.9375 (in the puddle), …
export const footfall = k => FIRST_STEP + k * STEP;
export const T = { splash: 0.9375, watchUp: 6.05, watchDown: 7.15, watchHit: 7.5, chime: 9.575 };
