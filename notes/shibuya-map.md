# Shibuya night test map (`shibuya-demo`) + weather / reflections — 2026-11-26

User request: a realistic Shibuya scramble crossing at night, painterly cel look, rain, reflections, from the real map,
modelled in Blender, to test the weather system and light reflections. Decisions (user): area = crossing + the buildings
around it • test map, hidden from the picker • reflections = SSR **and** Planar as a graphics setting • rain = central system
every map can use (look + sound only).

## Data

- Real layout from **OpenStreetMap** (Overpass, bbox around the crossing). **© OpenStreetMap contributors, ODbL**
  (https://www.openstreetmap.org/copyright). Footprints, heights (`height` / `building:levels`), roads (type + lanes → width),
  crossings, rail.
- `assets/src/shibuya_prep.py <overpass.json>` → `assets/src/shibuya_data.json` (map metres, x east / z south, 320 × 265,
  crossing at (165, 140)): 141 buildings, 125 roads/rails, 39 crosswalks.
- Shop / sign words are generic nouns (ラーメン, カラオケ, ホテル …). **No real brands or logos.** Landmarks only by shape
  (round tower with a lit ring, big facade screen on the corner building, rooftop billboards, dog statue on a plinth).

## Build steps

1. `python assets/src/shibuya_tex.py` (Pillow) → `assets/src/shibuya_tex/` facade / shopfront / sign + screen atlases
   (colour + emission).
2. `blender -b --factory-startup --python assets/src/shibuya_build.py` → `assets/mapkit/shibuya.glb` (node `sbb_<osm id>`
   per building, origin = footprint centroid; `sb_street` lamps / signals / statue / planters / vending machines;
   `sb_marks` zebra + lane lines; `sb_rail` viaduct + parked train), `assets/src/shibuya_place.json`, `assets/src/shibuya.blend`.
3. `node tools/shibuya-demo.mjs` → kit rows `shibuya/*` (cat `shibuya`, col 0) + `maps/build/shibuya-demo.json`:
   asphalt roads (0 m) / raised sidewalks (0.12 m), one invisible collision box per building wall (959, the exporter merges
   each into a capsule), 8 spawns + 4 red / 4 blue, 8 map lights, sky night, weather `rain:100`.
4. Export: Map Builder ⬆ (or `node tools/headless.js --url "mapbuild.html?export=shibuya-demo" --js tools/mb-export.js`).
   Result ~9.5 MB, ~204k triangles.
5. Play: Map Builder ▶ Play, or `index.html?playmap=shibuya-demo` (hidden from the picker by `MAP_TEST`, name ends `-demo`).

Look: `PAINT.maps['shibuya-demo']` (js/77, `sunC` = moon colour, new field) + Look preset `citynight` (js/74).
New ground surfaces (end of `SURF`, mapbuild/model.js): `asphalt` 21, `sidewalk` 22 (no palette thumbnails yet:
plain colour; `tools/surf-thumbs.mjs` makes them).

## Weather (js/76-weather.js) — any map

- Map field `weather` = weights, e.g. `clear:60,rain:40`, picked once per map build (`wxMap` from `buildWorld`).
  PAINT.maps[id].weather overrides like sky/fog. Pick is local per client (look only).
- Rain: GPU streaks around the camera (count by Graphics > Particles: 1500 / 3200 / 5500 / 8000), splash rings on the
  terrain in front of the camera (50–340), stars + moon hidden, sound = 3 filtered noise layers + random drop ticks.
  Streaks / splashes live in `fxScene` (drawn after the painterly filter, soft depth). Streak quads need DoubleSide.
- Dev: `WD.wx('rain' | 'clear' | '')`, `WD.WX`, `WD.WETU`.
- Not done: rain under roofs / viaduct is not blocked; no lightning; no gameplay effect.

## Wet ground + reflections (js/27 `WETU`, FXPass copy shader)

- Pixels whose depth normal points up: darker, puddles (world noise), rain ripple rings, reflection with Fresnel.
- Graphics > **เงาสะท้อนพื้นเปียก** (`refl`): ปิด / หลอก (vertical smear toward lights above, cheap) / SSR (ray march in the
  frame, sky colour where it misses) / Planar (`wxPre` renders the scene mirrored about the ground under the camera at half
  resolution with an oblique near plane, used near that height; SSR elsewhere). Presets: Low 0, Medium 1, High/Ultra 2,
  Cinematic 3. Needs soft particles on (Low has no wet pass).
- Not measured: frame cost of SSR / Planar (the browser pane was hidden during the test).
