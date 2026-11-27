# 098 · 3D Map Explainer — BLOCKED

BLOCKED. STYLE.md §1: "The ground is real data. Elevation and bathymetry from public tiles, imagery from licence-clean satellite mosaics, coastlines and place names where they really are. Nothing on the ground is invented or traced."

Elevation is reachable (`copernicus-dem-30m.s3.amazonaws.com` and `elevation-tiles-prod.s3.amazonaws.com` answer 200), and so is 10 m Sentinel-2 (`sentinel-cogs.s3.us-west-2.amazonaws.com`). The blockers are (1) **the place**: our story happens on an invented street, and a 3D relief map has to show a real place, so placing the run there would present the fiction as geography; and (2) **the scale**: the event covers about 40 m, below what 30 m elevation and 10 m imagery can show, and the licence-clean mosaics the style uses for the wide shot answer `403`: `tiles.maps.eox.at` (Sentinel-2 cloudless), `gibs.earthdata.nasa.gov`.

(Network: checked 2026-11-27 from this cloud session.)

What a native build would be, once unblocked: a real valley town in raking warm light with exaggerated relief; the railway as a glowing line along the true valley floor; the station marked where it really is; the last train's path flowing in as data; the run of AKI as a labelled reconstruction dot on the street; the chime as a ring spreading from the station.

## To unblock

1. Choose a real town and station to stand in for the story and agree that the run is a labelled reconstruction, and
2. allow `tiles.maps.eox.at` (or `gibs.earthdata.nasa.gov`) for the wide mosaic; the DEM and Sentinel-2 hosts already answer.
