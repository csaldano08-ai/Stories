# Source me: . tools/env.sh   — sets up the lab toolchain for this shell.
LAB=$(cd "$(dirname "${BASH_SOURCE:-$0}")/.." 2>/dev/null && pwd)
[ -f "$LAB/tools/env.sh" ] || LAB=/home/user/Stories/LEMO_CINEMATIC_LAB
export LAB
export LIB=${LIB:-$HOME/lemo-opuscar}            # Lemo-Opuscar library (skill setup.sh prints it)
export PATH="$LAB/tools/bin:$PATH"                 # ffmpeg 9.x (imageio-ffmpeg wheel) ahead of system ffmpeg 6.1
export TTS_PY="$LAB/tools/venvs/tts/bin/python"    # Chatterbox Nano/Turbo/Multilingual V3 + faster-whisper
export LEMO_PY="$LIB/.venv/bin/python"             # library core tier (numpy/scipy/soundfile/pillow)
export LEMO_ANGLE=${LEMO_ANGLE:-swiftshader}       # no GPU in this container: software WebGL for 3D/CRT passes
