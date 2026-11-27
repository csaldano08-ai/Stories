# QA report — last-train-home_v1.mp4

## Container
```
{
 "duration_s": 74.367,
 "video_s": 74.367,
 "audio_s": 74.36,
 "fps": 30.0,
 "size": "1920x1080",
 "vcodec": "h264",
 "pix_fmt": "yuvj420p",
 "profile": "High",
 "frames": 2231,
 "acodec": "aac",
 "arate": 48000,
 "channels": 2,
 "bitrate_kbps": 8412
}
```
## Picture
- black segments: []
- frozen ≥ 1.2s: []
- contact sheet: `contact_sheet.jpg`
## Audio (measured on the exported file)
```
{
 "integrated_lufs": -14.3,
 "lra_lu": 5.0,
 "true_peak_dbtp": -1.0,
 "clipped_samples": 0,
 "dc": [
  0.0006297804065980017,
  0.000616656499914825
 ],
 "low_20_120hz_pct": 30.4,
 "quiet_windows": [
  {
   "t": [
    16.4,
    18.6
   ],
   "rms_dbfs": -22.3
  },
  {
   "t": [
    42.0,
    43.1
   ],
   "rms_dbfs": -31.3
  }
 ]
}
```
## Dialogue in the final mix (faster-whisper small.en)

- A1: expected “Oh, no… I’m going to miss it.” — heard “Oh no, I'm going to miss it.” — OK
- A2: expected “Hey, little one. Are you all alone?” — heard “Hey, little one, are you all alone?” — OK
- D1: expected “Come on. I’ve got a minute.” — heard “Come on, I've got a minute.” — OK
- A3: expected “Thank you.” — heard “Thank you.” — OK

## Result
PASS
