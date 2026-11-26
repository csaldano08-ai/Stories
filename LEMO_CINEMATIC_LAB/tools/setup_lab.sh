#!/bin/sh
# Rebuild the lab toolchain from scratch in a fresh container (idempotent).
# Needs network access to: github.com, pypi.org, huggingface.co (+ its CDN hosts), download.pytorch.org, download-r2.pytorch.org.
set -e
LAB=$(cd "$(dirname "$0")/.." && pwd)
SKILL=$(ls -d "$HOME"/.claude/plugins/cache/lemolab/lemo-opuscar/*/skills/lemo-opuscar 2>/dev/null | head -1)
if [ -z "$SKILL" ]; then
  claude plugin marketplace add lemomo-ai/lemo-opuscar
  claude plugin install lemo-opuscar@lemolab
  SKILL=$(ls -d "$HOME"/.claude/plugins/cache/lemolab/lemo-opuscar/*/skills/lemo-opuscar | head -1)
fi
sh "$SKILL/scripts/setup.sh"
sh "$SKILL/scripts/setup.sh" deps voice music
# Chatterbox: PyPI 0.1.7 has no nano=True; main (ab55923) has it. Perth master fixes the pkg_resources import that
# silently disabled the watermarker (PerthImplicitWatermarker = None) in resemble-perth 1.0.1.
cd "$LAB/tools" && mkdir -p venvs bin && cd venvs
[ -x tts/bin/python ] || uv venv -q -p 3.11 tts
uv pip install --python tts/bin/python --torch-backend cpu chatterbox-tts==0.1.7 faster-whisper pyloudnorm "av<19" soundfile imageio-ffmpeg
uv pip install --python tts/bin/python --no-deps \
  "git+https://github.com/resemble-ai/chatterbox@ab55923c27757c90cfcc407baa57dc25a7d25217" \
  "git+https://github.com/resemble-ai/Perth.git@ff1c8ac55a976971245cdd53c18d6131ca00d993"
FF=$(tts/bin/python -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())")
ln -sf "$FF" "$LAB/tools/bin/ffmpeg"
tts/bin/python - <<'PY'
from huggingface_hub import snapshot_download as s
s("ResembleAI/chatterbox-nano"); s("ResembleAI/chatterbox-turbo", allow_patterns=["*.safetensors","*.json","*.txt","*.pt","*.model"])
s("ResembleAI/chatterbox", allow_patterns=["ve.pt","t3_mtl23ls_v3.safetensors","s3gen.pt","grapheme_mtl_merged_expanded_v1.json","conds.pt","Cangjie5_TC.json"])
PY
echo "lab toolchain ready: . $LAB/tools/env.sh"
