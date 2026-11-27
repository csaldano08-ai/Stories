# 049 · Vintage Engraving Collage — BLOCKED

BLOCKED: the style is made of real printed matter (STYLE.md §1: "every figure is a cut-out of a real public-domain print (an engraving, a stamp, a news photo, a line drawing)… Nothing is drawn in a vector or 3D way to look printed"; §9: "only public domain and CC0 prints, each one in the credits"). The library ships no scans (the demo downloads them in `build.sh` from Wikimedia Commons, listed in `SOURCES.jsonl`), and this environment's network refuses the archive hosts: `upload.wikimedia.org`, `commons.wikimedia.org`, `www.loc.gov` and `archive.org` all answer `403 Forbidden (agent proxy: no rule or network setting allows this host)` (checked 2026-11-27). Drawing fake engravings in code would break the style's first rule; it is not substituted with a generic version.

What a native build would use (all generic objects, so the story does not need archive material *of* AKI): public-domain line engravings of a pocket watch, a station clock tower, a street lamp, a shopfront, rain and an umbrella (e.g. the Pearson Scott Foresman drawings on Commons), cut out with a white margin on torn teal/ochre/mustard papers; AKI herself as a black-paper silhouette cut in code with her ochre-red jacket as a separate paper piece (the demo does the same for its one person), moving on twos.

## To unblock

1. Allow `upload.wikimedia.org` (and `commons.wikimedia.org` for the licence pages) in this cloud environment's network settings, or
2. drop the public-domain scans (with their source URLs and licences) into `LEMO_STYLE_BENCHMARK/styles/049_vintage-collage/assets/raw/`.
