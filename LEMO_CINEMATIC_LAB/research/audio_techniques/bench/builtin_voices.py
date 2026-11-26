import torch, torchaudio as ta, numpy as np, librosa, time
from chatterbox.tts_turbo import ChatterboxTurboTTS
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
torch.set_num_threads(4)
def f0(p):
    y,sr=librosa.load(p,sr=16000); f,_,_=librosa.pyin(y,fmin=60,fmax=500,sr=sr); f=f[~np.isnan(f)]; return np.median(f)
txt="I almost missed the last train tonight, but somehow it waited for me."
for name,ctor in [("nano",lambda: ChatterboxTurboTTS.from_pretrained("cpu",nano=True)),("turbo",lambda: ChatterboxTurboTTS.from_pretrained("cpu")),("mtl3",lambda: ChatterboxMultilingualTTS.from_pretrained("cpu",t3_model="v3"))]:
    t=time.time(); m=ctor(); lt=time.time()-t
    torch.manual_seed(0); m.generate("Warm up.", **({"language_id":"en"} if name=="mtl3" else {}))
    torch.manual_seed(0); t=time.time(); w=m.generate(txt, **({"language_id":"en"} if name=="mtl3" else {})); g=time.time()-t
    d=w.shape[-1]/m.sr; ta.save(f"builtin_{name}.wav",w,m.sr)
    print(f"{name}: load {lt:.1f}s gen {g:.1f}s audio {d:.2f}s RTF {g/d:.2f} f0 {f0(f'builtin_{name}.wav'):.0f}Hz", flush=True)
    del m
