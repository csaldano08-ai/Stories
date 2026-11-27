# 002_rubber-hose — 1930s Rubber Hose Cartoon (Cartoons) — QA report

Style construction: Canvas 2D. Narrative adaptation: no.

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
 "size_mb": 9.4
}
```
## Visual review (done by the agent on stills / strips — not full-speed playback)
- Stills & enlarged rows checked: S1 shoes splash into the puddle at 0.9375 s with an inked crown splash, the hydrant watches and squints; S2 trucking pan (pan speed = foot speed at contact), breathing lamp posts, speed lines; watch take 6.05–7.15 s brings the gloved wrist to her pie eyes; S3 watch object character 11:58 with darting eyes and sweat; S4 tilt starts over rain clouds to the clock tower.
- Squash/stretch and limb length changes are the style's intended rubber-hose deformation, not rig errors.
- Breathing is sampled on twos at 96 BPM (beat = 18.75 frames at 30 fps): extremes land within one frame of the beat (documented limit of the common audio grid).

## Needs a human
- full-speed viewing; listening to the mix

**Automated result:** PASS

Native rebuild: greyscale 4:3 worn print, pie eyes, gloves, noodle limbs, windmill run synced to the shared footfalls, breathing props, watch as an object character.
