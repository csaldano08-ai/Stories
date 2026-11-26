# Production tracker — LEMO_CINEMATIC_LAB

Status legend: ✅ delivered · 🟡 in production · ⏳ queued · ⛔ blocked (reason given) · 🔁 needs fix round

## Resume point

- **Now:** MASTER 08 *Last Train Home* — first full render v1 → QA → fix round → final (see `films/MASTER_08/NOTES.md`).
- **Next (brief §21 order):** MASTER 13 *The Little Repair Robot* (Brick Toy, 3D — no GPU here: see `research/limitations/`), MASTER 03, MASTER 10, then MASTER 01, 02, 04, 05, 06, 07, 09, 11, 12, 14, 15; showreel + comparative report; then the 84 concepts.

## Order of execution

| # | step | status |
|---|---|---|
| 1 | Install Lemo-Opuscar (plugin + library 439b98a) | ✅ |
| 2 | Install Chatterbox Nano / Turbo / Multilingual V3, benchmark | ✅ (CPU only; no GPU in this container) |
| 3 | Dependency tests (Node 22, Python 3.11/3.12, ffmpeg 9 via imageio-ffmpeg, Chromium headless) | ✅ |
| 4 | Style inventory (99 styles) | ✅ `STYLE_CATALOG.md` |
| 5 | Lab scaffolding | ✅ |
| 6 | MASTER 08 | 🟡 |
| 7 | MASTER 13 | ⏳ |
| 8 | MASTER 03 | ⏳ |
| 9 | MASTER 10 | ⏳ |
| 10 | other 11 MASTERs | ⏳ |
| 11 | showreel + comparative report | ⏳ |
| 12 | 84 concepts | ⏳ |

## All films


### 01 — Edit & Documentary

| ID | style | title | status | notes |
|---|---|---|---|---|
| MASTER_01 | City Symphony (`city-symphony`) | *The City That Never Woke Up* | ⏳ |  |
| STYLE_016 | Caption News (`caption-news`) | *The Missing Hour* | ⏳ |  |
| STYLE_017 | 1920s Newsreel (`newsreel`) | *The Flying Bicycle* | ⏳ |  |
| STYLE_018 | Live Countdown Split-screen (`countdown`) | *Ten Seconds Left* | ⏳ |  |
| STYLE_019 | Visual Investigation (`visual-investigation`) | *The Empty Platform* | ⏳ |  |
| STYLE_020 | Constructivist Montage (`kino-montage`) | *The Workers of Tomorrow* | ⏳ |  |
| STYLE_021 | Sports Telestrator (`telestrator`) | *The Impossible Pass* | ⏳ |  |
| STYLE_022 | Broadcast News Package (`news-package`) | *A City Beneath the Sea* | ⏳ |  |

### 02 — Painting & Illustration

| ID | style | title | status | notes |
|---|---|---|---|---|
| MASTER_02 | Watercolor Brush (`watercolor`) | *The Last Drop* | ⏳ |  |
| STYLE_023 | Crayon Picture Book (`crayon-book`) | *The Star Under the Bed* | ⏳ |  |
| STYLE_024 | Impasto Oil Painting (`impasto`) | *The Painter's Window* | ⏳ |  |
| STYLE_025 | Urban Sketch · Pen & Wash (`urban-sketch`) | *The Forgotten Café* | ⏳ |  |
| STYLE_026 | Colored-Pencil Science Illustration (`colored-pencil`) | *The Seed's Journey* | ⏳ |  |

### 03 — Sketch & Board

| ID | style | title | status | notes |
|---|---|---|---|---|
| MASTER_03 | Stick-figure Explainer (`stick-explainer`) | *The Man Who Sold His Time* | ⏳ |  |
| STYLE_027 | One-line Drawing (`one-line`) | *A Line Between Us* | ⏳ |  |
| STYLE_028 | Whiteboard Explainer (`whiteboard`) | *The Price of a Sandwich* | ⏳ |  |
| STYLE_029 | Chalkboard (`chalkboard`) | *Falling Up* | ⏳ |  |
| STYLE_030 | Sketchnote (`sketchnote`) | *A Day Without Decisions* | ⏳ |  |
| STYLE_031 | Tablet Sketch Explainer (`ipad-sketch`) | *How Memory Works* | ⏳ |  |
| STYLE_032 | Marker on Paper (`marker-paper`) | *One Small Habit* | ⏳ |  |

### 04 — Traditional Crafts

| ID | style | title | status | notes |
|---|---|---|---|---|
| MASTER_04 | Chinese Ink Wash (`ink-wash`) | *The Fox and the Moon* | ⏳ |  |
| STYLE_033 | Shadow Puppetry (`shadow-puppet`) | *The Lantern Keeper* | ⏳ |  |
| STYLE_034 | Ukiyo-e (`ukiyoe`) | *The Fisherman's Promise* | ⏳ |  |
| STYLE_035 | Red Paper-cut (`papercut-red`) | *The Paper Dragon* | ⏳ |  |
| STYLE_036 | Paper-cut Lightbox (`paper-lantern`) | *Beneath the Forest* | ⏳ |  |
| STYLE_037 | Stained Glass (`stained-glass`) | *The Broken Sun* | ⏳ |  |
| STYLE_038 | Gilded Illumination (`gilded-illumination`) | *The Golden Library* | ⏳ |  |

### 05 — Print & Printmaking

| ID | style | title | status | notes |
|---|---|---|---|---|
| MASTER_05 | Risograph Print (`risograph`) | *The Last Letter* | ⏳ |  |
| STYLE_039 | Halftone Dossier (`halftone-dossier`) | *The Clockmaker's Secret* | ⏳ |  |
| STYLE_040 | Woodcut Print (`woodcut`) | *Against the Mountain* | ⏳ |  |
| STYLE_041 | Copperplate Engraving (`engraving`) | *The Mechanical Bird* | ⏳ |  |
| STYLE_042 | Silkscreen Travel Poster (`silkscreen-poster`) | *Somewhere Beyond the Sea* | ⏳ |  |
| STYLE_043 | Scratchboard Long Take (`printed-long-take`) | *Into the Woods* | ⏳ |  |
| STYLE_044 | Pop Art (`pop-art`) | *The Most Expensive Coffee* | ⏳ |  |
| STYLE_045 | Vintage Engraving Collage (`vintage-collage`) | *The Whale in the Sky* | ⏳ |  |

### 06 — Graphic & Type

| ID | style | title | status | notes |
|---|---|---|---|---|
| MASTER_06 | Swiss Motion Graphics (`swiss-motion`) | *One Second* | ⏳ |  |
| STYLE_046 | 60s Spy Title Sequence (`spy-titles`) | *The Missing Briefcase* | ⏳ |  |
| STYLE_047 | Art Deco (`art-deco`) | *Midnight at the Grand Hotel* | ⏳ |  |
| STYLE_048 | Pictogram Motion (`pictogram-motion`) | *Crossing Paths* | ⏳ |  |
| STYLE_049 | Bauhaus Shapes (`bauhaus-shapes`) | *The Shape That Didn't Fit* | ⏳ |  |
| STYLE_050 | Scale Zoom Explainer (`flat-space-explainer`) | *From Dust to Stars* | ⏳ |  |
| STYLE_051 | Text Flash Cuts (`text-flash-cuts`) | *The Words We Never Said* | ⛔ blocked | needs an image generator (Codex CLI or equivalent) — none available here; not faked |
| STYLE_052 | Silhouette Rhythm (`silhouette-rhythm`) | *The Night Dancer* | ⏳ |  |

### 07 — Line Diagrams

| ID | style | title | status | notes |
|---|---|---|---|---|
| MASTER_07 | Exploded Teardown (`teardown`) | *Inside the Broken Watch* | ⏳ |  |
| STYLE_053 | Blueprint (`blueprint`) | *The Bridge That Almost Wasn't* | ⏳ |  |
| STYLE_054 | Isometric Infographic (`iso-infographic`) | *A Parcel's Journey* | ⏳ |  |
| STYLE_055 | Line-Art Cutaway (`hardcore-info`) | *The House That Breathes* | ⏳ |  |
| STYLE_056 | Color-Coded Mechanism (`precise-mechanism`) | *The Elevator* | ⏳ |  |
| STYLE_057 | Instruction Manual Art (`instruction-manual`) | *The Missing Screw* | ⏳ |  |
| STYLE_058 | Pen Plotter (`pen-plotter`) | *A Machine Draws a Dream* | ⏳ |  |
| STYLE_059 | Assembly-Line Diagram (`assembly-line-diagram`) | *The Journey of a Pencil* | ⏳ |  |

### 08 — Cartoons

| ID | style | title | status | notes |
|---|---|---|---|---|
| MASTER_08 | 80s Cel Anime (`cel-anime-80s`) | *Last Train Home* | 🟡 in production |  |
| STYLE_060 | 1930s Rubber Hose Cartoon (`rubber-hose`) | *The Runaway Pancake* | ⏳ |  |
| STYLE_061 | Sci-Fi Sitcom Toon (`scifi-toon`) | *Alien Roommate* | ⏳ |  |
| STYLE_062 | Mid-century Cartoon (`midcentury-toon`) | *The Lazy Robot* | ⏳ |  |
| STYLE_063 | Comic History Cartoon (`comic-history`) | *The First Photograph* | ⛔ blocked | needs an image generator (Codex CLI or equivalent) — none available here; not faked |
| STYLE_064 | Manga Panels (`manga-panels`) | *The Final Delivery* | ⛔ blocked | needs an image generator (Codex CLI or equivalent) — none available here; not faked |

### 09 — Games

| ID | style | title | status | notes |
|---|---|---|---|---|
| MASTER_09 | 2.5D Pixel Art (`hd-2d`) | *The Forgotten Save Point* | ⏳ |  |
| STYLE_065 | 16-bit Pixel RPG (`pixel-rpg`) | *The Shopkeeper's Quest* | ⏳ |  |
| STYLE_066 | Microgame Frenzy (`microgame`) | *The Worst Morning Ever* | ⏳ |  |
| STYLE_067 | Rhythm Game Show (`game-show`) | *Beat the Machine* | ⏳ |  |

### 10 — Film & Tape

| ID | style | title | status | notes |
|---|---|---|---|---|
| MASTER_10 | Liminal Found Footage (`backrooms`) | *Floor Zero* | ⏳ |  |
| STYLE_068 | CRT ASCII Terminal (`ascii-crt`) | *A Message From Tomorrow* | ⏳ |  |
| STYLE_069 | 1920s Silent Film (`silent-film`) | *The Wrong Hat* | ⏳ |  |
| STYLE_070 | Scratch Film (`scratch-film`) | *The Shadow That Stayed* | ⏳ |  |
| STYLE_071 | Double Exposure (`double-exposure`) | *Two Lives, One City* | ⏳ |  |

### 11 — Screens & Interfaces

| ID | style | title | status | notes |
|---|---|---|---|---|
| MASTER_11 | Sci-fi Hologram HUD (`hologram-hud`) | *The Last Signal* | ⏳ |  |
| STYLE_072 | Dark Tech Keynote (`dark-keynote`) | *The Pocket Observatory* | ⏳ |  |
| STYLE_073 | Mascot Screencast (`living-screencast`) | *The Messy Desktop* | ⏳ |  |
| STYLE_074 | Tabletop App Flythrough (`desktop-flythrough`) | *The Dinner Problem* | ⏳ |  |
| STYLE_075 | Spreadsheet Film (`spreadsheet`) | *The Missing Penny* | ⏳ |  |
| STYLE_076 | 1-bit Dither (`one-bit-dither`) | *The Last Computer* | ⏳ |  |

### 12 — Light & Lines

| ID | style | title | status | notes |
|---|---|---|---|---|
| MASTER_12 | Neon Tubes (`neon-tubes`) | *A World Made of Light* | ⏳ |  |
| STYLE_077 | Circuit Board (`circuit-board`) | *The Signal That Found Home* | ⏳ |  |
| STYLE_078 | Firefly Pointillism (`firefly-pointillism`) | *The Lost Firefly* | ⏳ |  |
| STYLE_079 | Flow-field Wind Lines (`flow-field`) | *The Invisible Ocean* | ⏳ |  |
| STYLE_080 | Oscilloscope Math (`oscilloscope-math`) | *When Waves Meet* | ⏳ |  |

### 13 — 3D & Miniature

| ID | style | title | status | notes |
|---|---|---|---|---|
| MASTER_13 | Brick Toy (`brick-toy`) | *The Little Repair Robot* | ⏳ |  |
| STYLE_081 | Paper Pop-up Book (`paper-popup`) | *The Island Between Pages* | ⏳ |  |
| STYLE_082 | Tilt-Shift Miniature (`tilt-shift`) | *The Town's First Snow* | ⏳ |  |
| STYLE_083 | Low-poly Isometric Island (`lowpoly-island`) | *The Floating Village* | ⏳ |  |
| STYLE_084 | Glass Product Render (`glass-product`) | *The Bottle of Tomorrow* | ⏳ |  |
| STYLE_085 | Memphis Diorama (`memphis-diorama`) | *The Apartment of Shapes* | ⏳ |  |
| STYLE_086 | Isometric People Scene (`isometric-picture-book`) | *The Office Mix-up* | ⏳ |  |
| STYLE_087 | Crayon World 3D (`crayon-world`) | *The Boy Who Drew a Door* | ⏳ |  |

### 14 — Instruments & Evidence

| ID | style | title | status | notes |
|---|---|---|---|---|
| MASTER_14 | Under the Microscope (`microscope`) | *The Invisible World* | ⏳ |  |
| STYLE_088 | Satellite Briefing (`satellite-briefing`) | *The River That Changed Course* | ⏳ |  |
| STYLE_089 | Engineering Briefing Board (`briefing-board`) | *Why the Bridge Moves* | ⏳ |  |
| STYLE_090 | LiDAR Survey (`lidar-survey`) | *The Village Beneath the Trees* | ⏳ |  |
| STYLE_091 | Archive Light Table (`archive-lighttable`) | *The Photograph's Journey* | ⏳ |  |
| STYLE_092 | Security X-ray (`security-xray`) | *Inside the Suitcase* | ⏳ |  |
| STYLE_093 | Radar Sweep Documentary (`dark-documentary`) | *Following the Storm* | ⏳ |  |
| STYLE_094 | Thermal Camera (`thermal-camera`) | *Where the Heat Escapes* | ⏳ |  |

### 15 — Data & Maps

| ID | style | title | status | notes |
|---|---|---|---|---|
| MASTER_15 | Data Storytelling (`dataviz`) | *A World Without Bees* | ⏳ |  |
| STYLE_095 | Projection-Mapped Model (`white-model`) | *The Growing City* | ⏳ |  |
| STYLE_096 | Data Physicalization (`data-physical`) | *A Thousand Small Choices* | ⏳ |  |
| STYLE_097 | Transit Map (`transit-map`) | *The Long Way Home* | ⏳ |  |
| STYLE_098 | 3D Map Explainer (`map-explainer`) | *From Mountain to Ocean* | ⏳ |  |
| STYLE_099 | Blob Simulation (`pip-simulation`) | *One Drop Becomes Many* | ⏳ |  |
