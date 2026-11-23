# Preload standard + graphics/perf plan

Agreed with the user 2026-11-23. Next big track: **overall graphics upgrade together with performance**, built so that
assets are loaded and shaders are compiled **when the player enters the game** (after CLICK TO BEGIN), not when a map
starts and never mid-fight. More gameplay systems will be added later, so this is a standard every new system follows,
not a one-off fix. Read this before adding a skill, VFX, map feature, light, material or graphics option.

Related: `guides/OPTIMIZE.md` (history + benches), `guides/MAP-STANDARD.md`, `VFX-STUDIO-CLAUDE.md`, `guides/ASSETS.md`.

## 1. Why (what the freezes were)

User F3 logs on siege / fcs-file (2026-11-23): freezes of 0.4–3.7 s with `shader+N` and almost no `geo`/`tex` change.
So the freezes are **GPU shader compiles**, not slow downloads (downloads are async and never freeze the frame).

three.js builds one shader program per "recipe": material type, maps, transparent/side, skinning, defines,
`customProgramCacheKey`, **number of lights**, shadows, fog, clipping, output target. Any recipe seen for the first
time compiles on the spot. Causes found so far:

| Cause | Status |
|---|---|
| Painterly cel patch applied after warm-up (`paintSweep`) → every material compiled twice | fixed (`paintPre`, `shrCollect`) |
| Character variants only seen in fights: hit flash, ghost, slash-split death, death dissolve, Darkness body tint | fixed (`warmCharVariants`) |
| three `clippingPlanes` — `renderer.compile()` ignores clipping state, can never be warmed | fixed (`deathClipMat`, own discard) |
| Code-built Darkness scythe VFX swaps materials after `add()` → SHR never sees it (`sc_silver`) | open |
| Some code VFX `ShaderMaterial`s not warmed | open |
| Match start: countdown warm compile runs 3–7 s, then `warmDraw` waits for links (0.5–1.5 s) | open |

Bench: `node tools/headless.js --url "index.html?nosw#dark" --game --js tools/bench-paint-freeze.js --timeout 400 --quiet`
(siege, fcs-file, 12 bots, `#dark` = half Darkness). Reports programs created after warm-up, slow frames, and the
recipe difference of each new program.

## 2. Rules for every system (new and old)

| Never | Do instead |
|---|---|
| `new THREE.*Light` during a match, or `light.visible=false` (hidden lights are not counted → recipe changes) | borrow from a fixed pool (`LPOOL`, map light slots), change `intensity` |
| toggle `castShadow` on a light, `scene.environment` on/off, quality level mid-match | decide at game entry; only resolution scale may change live |
| new material / `onBeforeCompile` / shader text built during a fight | take materials from the registry (§3); built once at load |
| numbers baked into shader source (`${x}` per instance) | uniforms |
| `material.dispose()` on something other instances may reuse (three deletes the program with the last user) | keep it, or return to a pool |
| swap `mesh.material` to an unregistered material after the mesh is in the scene | register the variant; swap only between registered ones |
| three `clippingPlanes` | discard against a uniform plane in the shader (`deathClipMat`, js/48) |
| build meshes from code on every cast | build once, pool, reuse |

Fixed-shape things (characters, weapons, trees, props, the scythe) should be `.glb` files (`asset-streaming` direction).
Code-built geometry is fine for things that really change shape (ribbons, cracks, dug terrain, simple quads driven by a
shader), but only if built once and pooled. Render cost of a code mesh and a file mesh is the same; the costs of code
are draw calls (many small parts), CPU on every spawn, materials created ad hoc, no browser cache, harder preload.

## 3. Architecture

**3a. Preload registry.** Every system declares, at load time, what it needs:
- files: models, FX json, textures, sounds, map files it can use;
- material variants: base materials plus every state they can enter in a fight (tint, ghost, fade, flash, cut, …),
  per mesh kind (skinned / static / instanced).

Today this exists in pieces (`WARM.reg[path]`, `warmCharVariants`, `WARM_FXDIR`, `brk` step) and runs in the lobby /
countdown. Target: one registry API (e.g. `preloadReg({files, variants, build})`) read by the entry loader.

**3b. Entry loader (after CLICK TO BEGIN).** A loading screen with a progress bar:
1. download + decode registered files (kept by the service worker cache);
2. upload textures and geometry to the GPU;
3. compile every registered variant with the **standard light rig** (§4) into the composer render target, sliced
   per frame, waiting with `KHR_parallel_shader_compile` (no blocking `isReady` spin);
4. draw once off-screen for shadow programs (the only thing `compile()` cannot do);
5. enter the hub. Lobby and countdown then only place the real actors.

Programs stay alive for the session (materials kept, `pinPrograms`). Chrome also keeps compiled shaders on disk, so the
second launch is faster, but every launch still links.

**3c. Mid-match compile detector (dev).** Any program created after the loader finished shows a warning on screen
(material name, recipe difference, stack of who created it) and is logged to F3. A system that forgot to register is
caught on the first test, not by players.

**3d. Bench gate.** `tools/bench-paint-freeze.js` becomes the standard check: bots of every path fight on each mode's
map; **new programs during the fight must be 0**. Run it before committing skill, VFX or graphics work.

## 4. Fixed budgets

**Light rig (same on every map, whole match):**

| Light | Count | Notes |
|---|---|---|
| Sun (`moonL`, shadow) | 1 | only shadow-casting light |
| Sky (`hemi`) | 1 | |
| Skill pool (`LPOOL`) | 6 | exists; skills already borrow, intensity 0 when idle |
| Map light slots | N (start 8, measure 8/12/16 on fcs-file) | new |

Map light slots: a map may place any number of light points (torches, crystals, windows) in Map Builder. Each frame the
N real lights move to the points nearest the camera, fading in/out on swap; far points show only flame/glow (emissive,
sprite). Every map has the same recipe, so the entry loader can compile everything. Point lights never cast shadows.
Every extra light costs every lit pixel on screen (forward rendering), hence the measured cap.

**Quality level:** chosen at game entry (and on Settings change = reload/recompile screen). Mid-match auto adjust may
only change resolution scale.

## 5. Painterly inside the assets (instead of drawn over)

| Part | Now | Plan |
|---|---|---|
| sky / fog / lights | per map at load | keep |
| trees | built in code (`paintKit`) | export `.glb` + leaf atlas |
| brush strokes on surfaces | world-space shader noise per pixel | paint into the Map Builder kit textures (tiles by UV; slightly different look) |
| cel shading | per-material patch → duplicate programs | built into three's lighting chunk once at startup for all Standard materials; strength uniform (0 on non-paint maps) — no per-material patch, no extra recipes |
| Kuwahara full-screen filter | 4 × 16 samples per pixel at full res | lighter once strokes live in textures: lower strength, half resolution, off on medium |

## 6. Dynamic lighting inside the standard (example: dark room, roof collapses, becomes bright)

Rule: **light changes = uniform changes, never structural changes.**
- The sun always exists; the room is dark because the roof shadows it. Roof pieces break → sun reaches the floor.
  Refresh the shadow map when pieces fall (`shadowMap.needsUpdate`).
- Sky light ignores roofs → **indoor zones** (new Map Builder feature): volumes with a 0–1 factor multiplying sky/ambient
  light in the shared lighting chunk (same uniform family as cel). Collapse animates 0 → 1. Also for caves, tunnels,
  castle rooms.
- Baked light in textures: bake both states, blend with a uniform.
- Shafts, dust, debris: registered VFX + destruction (`brk`) already warmed.
- Torches inside: map light slots, intensity only. Exposure / fog / grade: Look values.
- Forbidden for this: a new DirectionalLight for the shaft, swapping the room to "lit" materials, toggling shadows or
  `scene.environment`.

## 7. Work order

| Step | Work | Done when |
|---|---|---|
| 1 | Detector (§3c) + bench gate (§3d) for all paths and modes | bench lists every mid-fight program with its creator |
| 2 | Cel (and indoor factor) in the shared lighting chunk at startup; standard light rig with map light slots | no `|pt2` keys; all maps share one recipe set |
| 3 | Preload registry + entry loader; move lobby/countdown warm-up into it | match start freeze gone; lobby/countdown do no compiling |
| 4 | Bring old systems under the rules, guided by the detector (Darkness scythe VFX, code ShaderMaterials, …) | bench: 0 programs mid-fight |
| 5 | Graphics upgrade inside the budgets: painterly in assets, trees as `.glb`, Kuwahara lighter, light slots used by maps, indoor zones | FPS same or better at higher quality |

Step 1 first: it measures every later step and keeps future systems from bringing the freezes back.

## 8. Open decisions (ask the user when reaching them)

- N map light slots (from the 8/12/16 measurement) and the low-quality value.
- Painterly strokes in textures: accept the tiled look vs today's world-space strokes (compare shots side by side).
- Acceptable entry loading time (first launch guess 5–15 s, not measured).
- Which maps are preloaded at entry vs loaded when picked (siege = fcs-file 2.4 MB json + glb).
