import time, sys, torch, torchaudio as ta
from chatterbox.tts_turbo import ChatterboxTurboTTS
torch.set_num_threads(4)
t=time.time(); m=ChatterboxTurboTTS.from_pretrained(device="cpu", nano=True); print("load_s", round(time.time()-t,1), flush=True)
for i,txt in enumerate(["Oh, no... I'm going to miss it.", "Hey, little one. Are you all alone?"]):
    torch.manual_seed(1)
    t=time.time(); w=m.generate(txt); el=time.time()-t; d=w.shape[-1]/m.sr
    print(f"line{i} audio_s={d:.2f} gen_s={el:.2f} rtf={el/d:.2f}", flush=True)
    ta.save(f"nano_default_{i}.wav", w, m.sr)
