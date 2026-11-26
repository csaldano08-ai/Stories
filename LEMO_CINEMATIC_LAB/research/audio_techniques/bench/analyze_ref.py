import sys, numpy as np, librosa
from faster_whisper import WhisperModel
p=sys.argv[1]
y,sr=librosa.load(p,sr=24000,mono=True)
f0,vf,vp=librosa.pyin(y,fmin=60,fmax=500,sr=sr,frame_length=2048)
f=f0[~np.isnan(f0)]
print("dur",len(y)/sr,"f0 median",np.median(f),"p10",np.percentile(f,10),"p90",np.percentile(f,90))
rms=librosa.feature.rms(y=y)[0]; db=20*np.log10(rms+1e-9)
print("rms p5/p50/p95 dB",np.percentile(db,[5,50,95]))
m=WhisperModel("small",device="cpu",compute_type="int8")
segs,info=m.transcribe(p,language=None)
print("lang",info.language,info.language_probability)
for s in segs: print(f"[{s.start:.1f}-{s.end:.1f}] {s.text}")
