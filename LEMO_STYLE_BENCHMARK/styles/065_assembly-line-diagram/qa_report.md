# 065_assembly-line-diagram — Assembly-Line Diagram (Line Diagrams) — QA report

Style construction: Canvas 2D, SVG. Narrative adaptation: yes.

## Automated checks (measured on final.mp4)
```
{
 "frames": 300,
 "fps": "30/1",
 "size": "1920x1080",
 "codec": "h264",
 "pix_fmt": "yuvj420p",
 "duration_s": 10.0,
 "audio": "aac 48000 Hz 2 ch",
 "black": [],
 "frozen_ge_0.7s": [],
 "lufs": -14.2,
 "true_peak_dbtp": -1.0,
 "size_mb": 8.3
}
```
## Rig QA (all 300 frames, `shared/qa/rig_check.mjs`)
```
{
 "bone": {
  "thigh": [
   150,
   150
  ],
  "shin": [
   144,
   144
  ],
  "upper": [
   108,
   108
  ],
  "fore": [
   92,
   92
  ]
 },
 "kneeBackward": 0,
 "slideMaxU": 3.907985046680551e-14,
 "slideFrames": 0,
 "belowGround": 0,
 "adjustments": 22,
 "lifted": 0,
 "pass": true
}
```
bone = [min, max] measured length in u over all frames (constant ⇒ no stretching); slide = planted-foot drift between frames.
## Visual review (done by the agent on stills / strips — not full-speed playback)
QA review 2026-11-27: final.mp4 contact sheet viewed (events present; framing and legibility OK)

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native assembly-line diagram: AKI as a cut-away machine with labelled parts (shock absorber, water, steps, pistons, pump, time), the splash in the puddle at 0.94 s, the run with the parts working, the watch read in the clock room with workers and a flip counter 47 to 48, the tower and its bell on the chime. S1 is a low insert on her legs (by design); part labels are bilingual English and Chinese.
