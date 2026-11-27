# 088 · Lidar Survey — BLOCKED

BLOCKED. STYLE.md §1: "The cloud is the data: every point is a real return at its measured position; points… are never moved into a shape." Not an invented interface: "the points are real, sparse where the survey was".

The data host is reachable (`s3-us-west-2.amazonaws.com/usgs-lidar-public` answers 200), so this is not a network block. The blocker is the story: a lidar survey of Station Road cannot exist because the street is invented, and AKI cannot appear in a real scan, since making a runner out of points would be "moving points into a shape", fabricated data presented as a measurement. Surveying some real street and claiming it is hers would present a simulation as an observation, which the brief forbids.

(Network: checked 2026-11-27 from this cloud session.)

What a native build would be, once unblocked: a real airborne scan of a real station street flown through at night-dark; the scan front condenses the cloud into a raking-lit surface; a hairline range line from a corner to the station doors with the reading from the points; the run drawn only as a labelled hairline path ("reconstruction") above the ground class, never as points.

## To unblock

1. Choose a real station street inside USGS 3DEP coverage (or supply your own scan with its licence), and
2. agree that AKI's run appears only as a labelled reconstruction line, not as points. With that decision the style can be built from the reachable USGS bucket.
