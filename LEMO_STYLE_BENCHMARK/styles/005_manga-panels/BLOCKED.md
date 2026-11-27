# 005 · Manga Panels — BLOCKED

BLOCKED: this style requires an external image generator (STYLE.md §9: every character and panel drawing is generated, and stand-in characters drawn in code are forbidden). `core/image/gen_image.py --check` returned exit 4 (Codex CLI not installed, no other image tool provided). Not substituted with a generic version.

## To unblock

1. Install the Codex CLI and run `codex login` with an account that can generate images, then run `python3 ~/lemo-opuscar/core/image/gen_image.py --check` again (exit 0 expected).
2. Or provide the images yourself (an image API/app or your own drawings) from the prompts in the style's STYLE.md §9, under the file names the pipeline expects.

After that, the clip will be built on the shared 10 s timeline (`shared/clip10.js`) like every other style, using the AKI v2 character bible as the reference sheet.
