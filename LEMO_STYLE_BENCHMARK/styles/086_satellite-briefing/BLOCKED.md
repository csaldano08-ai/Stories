# 086 · Satellite Briefing — BLOCKED

BLOCKED. STYLE.md §1: "The ground is a photograph: real, licence-clean, georeferenced satellite or aerial imagery of the actual place. Nothing on the ground is drawn, stylised or generated." The marks are measurements on that photograph.

Two blockers. (1) **The story is fiction in an invented place**: AKI's run, the puddle and the station clock happen on a street that does not exist. Putting them on a real photograph of a real town would present a simulation as an observed fact, which the brief forbids ("Non… presentare le simulazioni come riprese autentiche"); drawing an invented street as if it were imagery would break the style's first rule. (2) **The imagery is out of reach at the scale the story needs**: the whole event covers about 40 m of pavement, so the dive has to end on sub-metre aerial imagery. The hosts the library's demo and docs use answer `403 (agent proxy: no rule allows this host)`: `planetarycomputer.microsoft.com`, `gibs.earthdata.nasa.gov`, `tiles.maps.eox.at`, `api.pdok.nl`, `basemap.nationalmap.gov`. Only 10 m Sentinel-2 tiles on `sentinel-cogs.s3.us-west-2.amazonaws.com` answer, and at 10 m the street is four pixels wide.

(Network: checked 2026-11-27 from this cloud session.)

What a native build would be, once unblocked: an orbit-to-street dive on a real station square (true colour at orbit, analyst grey below), a reticle lock on the station, *the range line* from a street corner to the platform measured on the image, and the run shown as a **claim layer** (the style's second hue, flat and labelled "reconstruction, not observed") so the only white marks are real measurements; the chime as the lock-on ping.

## To unblock

1. Choose a real station that may stand in for Station Road, and agree that the run is shown as a labelled reconstruction (claim layer), never as a measurement.
2. Allow `planetarycomputer.microsoft.com` (Landsat/NAIP plates) and `gibs.earthdata.nasa.gov` (Blue Marble for the orbit) in the environment's network settings, or drop licence-clean sub-metre orthophotos of that place (with source and licence) into `assets/raw/`.
