# Interaction test — the jacket and the kitten (native pixel art)

The same 7 s action as `../jacket_kitten_anime/` (same rig poses, same precomputed cloth record), rasterised natively on a 320×180 grid:
hard pixels, a fixed 16-colour palette, ordered (Bayer) dithering for the sky, the pavement and the lamp's pool, then a 6× nearest-neighbour
scale to 1920×1080. Nothing is drawn at full resolution and reduced. `final.mp4` (1920×1080, 30 fps, 210 frames, silent stereo); contact sheet in `qa/contact_sheet.png`.

The camera's zoom is done by re-rasterising at a new pixel scale (never by scaling pixels), so the pixel grid stays fixed.
At the action's scale AKI is about 90 px tall and the kitten about 12 px: the grab, the spread, the drape, the tuck and the lift read clearly;
the kitten's face is only a few pixels, and the jacket is a strip with a highlight and a shadow row (no collar or sleeve silhouette).
