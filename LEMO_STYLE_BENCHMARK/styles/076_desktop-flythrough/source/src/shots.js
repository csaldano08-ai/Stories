// The one take: [t, target (Vector3 | live subject), dist, az, el, fov, target offset?, {ease}?] and impact shakes [t, amp, decay].
// az 0 = camera on the +z side looking toward −z (card print reads upright); el in radians. Shot boundaries of the common clip: 2.5 / 7.5 / 9.375 s.
import { T as EV } from '../shared/clip10.js';
const R = { ease: 1 };
export const KEYS = [
  // S1 macro glide, low and in front: she runs at us over the street card, the puddle between us
  [0.0, 'aki', .6, .78, .3, 32],
  [1.3, 'aki', .56, .66, .3, 32],
  // S2 ride along beside her, drifting behind as she runs the route
  [2.5, 'aki', .66, .42, .34, 33],
  [4.6, 'aki', .78, .12, .38, 34],
  [6.4, 'aki', .7, -.16, .36, 34],
  [7.15, 'aki', .68, -.2, .36, 34, null, R],
  // S3 whip and rise over the watch card to read it (62° down)
  [7.55, 'C', .88, .02, 1.08, 34],
  [9.3, 'C', .84, .05, 1.1, 34, null, R],
  // S4 whip to the station as the tower pops and chimes, then pull back over the whole desk
  [9.56, 'D', .7, .22, .5, 34],
  [10.0, 'wide', 4.7, .08, .98, 36],
];
export const SHAKES = [[EV.splash, .0016, 9], [EV.chime, .004, 9]];
