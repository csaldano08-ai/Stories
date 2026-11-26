// Single source of truth for picture, music, foley, voice and subtitles. 96 BPM: beat = 0.625 s, bar = 2.5 s.
export const BPM = 96, BEAT = 60 / BPM, BAR = BEAT * 4, FPS = 30;
export const b = n => +(n * BEAT).toFixed(4);          // beat n → seconds
export const DUR = b(119);                              // 74.375 s

// shots: [t0, t1, id]  (every cut on a beat; see TREATMENT.md §5 for framing and motivation)
export const SHOTS = [
  [b(0), b(4), 'S1_puddle'],
  [b(4), b(12), 'S2_run'],
  [b(12), b(15), 'S3_watch'],
  [b(15), b(21), 'S4_wide'],
  [b(21), b(26), 'S5_face'],
  [b(26), b(30), 'S6_brake'],
  [b(30), b(34), 'S7_eyes'],
  [b(34), b(39), 'S8_kitten'],
  [b(39), b(50), 'S9_crouch'],
  [b(50), b(54), 'S10_kitten'],
  [b(54), b(63), 'S11_hands'],
  [b(63), b(66), 'S12_clock'],
  [b(66), b(70), 'S13_stand'],
  [b(70), b(76), 'S14_platform'],
  [b(76), b(81), 'S15_driver'],
  [b(81), b(85), 'S16_thanks'],
  [b(85), b(90), 'S17_board'],
  [b(90), b(102), 'S18_interior'],
  [b(102), b(110), 'S19_window'],
  [b(110), b(119), 'S20_city'],
];
export const shotAt = t => SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];

// voice lines: file in audio/voice/final/, start time, speaker, subtitle text (what is said, as written in the script)
export const LINES = [
  { id: 'A1', t: b(21) + .30, who: 'aki', text: 'Oh, no… I’m going to miss it.' },
  { id: 'A2', t: b(39) + 3.05, who: 'aki', text: 'Hey, little one. Are you all alone?' },
  { id: 'D1', t: b(76) + .45, who: 'driver', text: 'Come on. I’ve got a minute.' },
  { id: 'A3', t: b(81) + .35, who: 'aki', text: 'Thank you.' },
];

// story hit points (seconds)
export const T = {
  splash1: b(1.5), splash2: b(1.5) + .345,
  watchLook: b(10) - .2,
  watchTick: b(12) + .6,
  chime: b(15) + .2,                 // departure melody on the platform speakers
  mew1: b(26) - .15,                 // the mew that stops her (L-cut over the end of S5)
  brake: b(26) + .1,
  musicOut: b(26),                   // silence #1 (rain only)
  mew2: b(34) + .55,                 // first sound we SEE: the kitten
  epIn: b(38),                       // electric piano enters (bar 9.5)
  crouch: b(39) + 1.6,
  jacketOff: b(39) + 5.3,
  mew3: b(50) + .7,
  lift: b(54) + 2.4,
  purr: b(54) + 3.4,
  clock: b(64),                      // 23:59 → 00:00
  silence2: b(67) + .2,             // she looks up
  hum: b(69) + .2,                   // first sound after silence #2: the train is still there
  groove: b(70),
  doorStep: b(85) + .55,
  doorChime: b(85) + 1.9,
  doorClose: b(85) + 2.5,
  depart: b(90) + .05,              // doors closed in S17; the train starts on the cut to the interior
  sit: b(90) + .4,
  yawn: b(90) + 4.6,
  chorus: b(90),
  lift2: b(110),                     // last phrase
  end: b(119),
};
