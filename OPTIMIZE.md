# Optimization backlog

Notes + status. Items marked [x] were done on 2026-10-18 (overnight session).
Measured 2026-10-17 on the user's PC in a hidden Claude Browser pane, so absolute numbers are rough; compare before/after with the same harness (bottom of this file).
Scope of this track: logic, performance, algorithms, loading. Not balance/gameplay.

Priority: **P1** = real bug or big win, **P2** = clear win, **P3** = nice to have / needs more measuring.

## A. Bugs found while measuring
- [x] **P1 Texture leak.** (fixed: `disposeTree`/`disposeMaterial`; textures stay ~30 across matches) Each `hostToLobby` → `hostStart` leaves 7–10 GPU textures behind (61 → 110 after 6 matches). `buildWorld()` (line ~3462) and `disposeObj()` (~4208) only call `geometry.dispose()`; materials and their `map` CanvasTextures are never disposed. Fix: dispose `material` (+ `material.map`) too, skipping shared ones (`glowTex`, `projGeo`/`tailGeo`-style shared assets).
- [x] **P1 Cloak NaN** (found 2026-10-18 in the heavy bench): enemy wizard cloaks (height 1.7) had NaN in their top row of vertices every frame — the rest positions are Float32, so `0.85f` is a hair above `hh=0.85` and `Math.pow(negative,1.5)` = NaN (console `computeBoundingSphere(): Computed radius is NaN`). Fixed with `Math.max(0,…)` in `updateCloth`; also `updateCloth`/`localVel` now reset on non-finite state. Side finding: in the old build, a NaN mesh plus bloom could turn the whole screen black in a test (bloom off = picture back); the new build did not black out under the same test.
- [x] **P2 Doc/code mismatch.** (done 2026-10-18: loading at page open is the better behaviour now that the SW caches the files, so the comment was fixed, not the trigger.) Comment at line ~2616 says audio loads on first click; it actually loads at page open (`ac()` runs on load). Decide which is wanted and fix the comment or the trigger.

## B. Hitches (frame spikes)
Normal in-game frame here ≈ 9–17 ms.

| Moment | Spike | Measured cause |
|---|---|---|
| First menu frame | 162 ms | 20 shader compiles |
| Match start, map not seen yet | 107–176 ms | `buildWorld` 24–42 ms JS + 11 new shaders + ~150 geometry uploads |
| Match start, same map again | ≈ 52 ms | world rebuilt from scratch every time |
| First pyro spell of session | 89 ms | +381 geometries in one go — **cause not found yet** |
| First frost ult (ศูนย์สัมบูรณ์) | 213 ms (later casts 31–40 ms) | not pinned down |
| Boss spawn (wave 5) | 45 ms | +90 geometries, +1 shader |
| 3 bots join lobby | 45 ms | ≈ 43 un-shared geometries per `makeStudent` |

- [x] **P1 Pre-compile shaders.** (2026-10-21: the old prewarm compiled for the screen (srgb+ACES) instead of the composer RT and skipped hidden objects, and disposing warm materials deleted the programs → replaced by the countdown warm-up `js/51-warmup.js`; first-use spikes now ≈ normal frames; harness `tools/bench-firstcast.js`) (done: `prewarmShaders()` after `buildWorld`, `gl.compileAsync` + hidden VFX group; first spell casts no longer compile — Permafrost still adds 1 program) Call `renderer.compileAsync(scene, cam)` right after `buildWorld` / during the 3-2-1 countdown, and once for the menu stage. Also pre-warm VFX materials (shield, colossus, boss) by adding them invisible once.
- [x] **P2 Find the pyro +381 geometries / frost-ult spike** — obsolete: those placeholder spells were replaced by the user's Pyro/Frost designs; the new ones were measured after prewarm (≤ 20 ms).
- [x] **P2 Share geometry/material between characters.** (done 2026-10-18: `sGeo/sMat/sStripe` caches, marked `userData.keep`; only the animated cloak geometry, the shield ShaderMaterial and the foot ring material stay per character. Ghost mode now swaps to transparent clones via `setGhost` instead of editing materials. Result in the heavy bench: 5 bots joining the lobby 66 → 26 ms and +195 → +35 geometries; heavy scene 892 → 512 geometries, 39 → 25 textures; match start 294 → 124 geometries. Draw calls unchanged — see C.)
- [x] **P3 Cache built maps** (done 2026-10-18: `WCACHE`, LRU of 3 built worlds incl. their globals; props are rebuilt per match). `tools/bench-start.js` (solo co-op, maps castle→meadow→castle→meadow→castle→hogsmeade→castle): **returning to a cached map: `hostStart` 10–12 → 0.4 ms, worst frame 75–97 → 36–41 ms (= a normal frame in that run)**. First visit of a map is unchanged (meadow ≈134–206 ms, hogsmeade ≈100–120 ms, the very first match after the menu ≈600 ms) — this happens during the 3-2-1 countdown. Cost: up to 2 extra worlds kept on the GPU (≈ +50–80 geometries). Random maps never repeat back-to-back, so the cache hits about 1 match in 3 with 7 random maps.
- [ ] **P3 First-visit map hitch** (≈100–200 ms, during the countdown). Tried `gl.compileAsync(world,cam,scene)` before adding the world → no measurable gain (so it is not only shader compile; likely geometry/texture upload + first shadow pass); reverted. Next idea if needed: build/upload maps in the background while in the lobby (`WCACHE` warm-up) or time-slice `buildWorld`.
- [x] **P3 Pool enemies and projectiles** — measured, not worth it (2026-10-18): in the heavy bench `syncProj`+walls+minions+mode objects cost 0.02 ms/frame (`WD.PROF` `projMode`), particles/FX 1.7 ms, GPU submit 6.9 ms. Revisit only if a bullet-heavy mode appears.
- [ ] **P3 Time-slice heavy builds** (spread `buildWorld` over a few frames) — only if A/B fixes are not enough.

- [x] **P1 Multi-target / AoE hitch** (reported by the user 2026-10-18). Measured: the damage math and per-hit FX are cheap (6 dummies hit at once: frame 2.6 → 4.7 ms; flashing a skinned file model compiles 1 extra program once). The visible stutter was the **local hit-stop** (`hitStop`, added with the "hit feel" pass): every own hit ≥15 dmg stopped *rendering* for 55–80 ms with no cooldown, so AoE/multi-hit attacks froze the screen almost half the time while the host sim kept running (then everything jumped). Fix: `hit` events carry `a:1` for `aoe`/`zone` damage → no hit-stop; after a hit-stop there is a `HSTOP.gap` (0.3 s) before the next one. Single strong hits keep the same feel. Event field is optional/backward compatible (no PREFIX bump). Verified by the user in the Test Place (2026-10-18): no more stutter.

## C. Draw calls / render cost
- [x] **P2 Measure the heaviest scene** (done 2026-10-18, `tools/bench-heavy.js`: castle, solo + 5 bots — coop allows max 6 — wave 5 dragon + 7 adds, everyone casting every slot, ~7,900 particles). Baseline: **~1,280 draw calls (max ~1,400)**, 118 k triangles, 48 shader programs, frame median ≈ 30 ms in the hidden pane (vsync-quantised, use calls/geometries to compare, not ms). Each player is ~110 meshes (≈35 in the body + spell props), mostly drawn twice (shadow + main).
- [x] **P2 Merge the static body parts of each character** (done 2026-10-18, `mergeBody`): inside every group of a student (body, legs, arms, wand, scarf ends) all plain-colour parts become one mesh with the shared `BODYM` material (front/double side); colour/roughness/metalness are per-vertex attributes (`color`/`aRough`/`aMetal`, shader patch `bodyPatch`). Parts with a texture (striped tie/scarf), emissive (gold wand), transparency or `userData.anim` (cloak) stay separate. Body meshes per player ~35 → ~15. Heavy bench: **draw calls median 1,285 → 1,045 (−19 %), max 1,405 → 1,151**; +4 shader programs; 5-bot lobby join 26 → 42 ms (merge cost, still below the original 66 ms). Visual A/B at the lobby (same looks) shows no difference.
- [x] **P3 Same merge for enemies** (done 2026-10-18): `makeEnemy` uses `sGeo/sMat/bMat` + `mergeBody` (a second pass also merges same shared-material siblings such as glowing eyes; flat-shaded spider hair and the troll club `userData.anim` stay separate). Heavy bench: **draw calls median 1,045 → 1,006, max 1,151 → 1,081; geometries 537 → 483**. Total for the whole track: **1,285 → 1,006 median (−22 %), 1,405 → 1,081 max (−23 %), 892 → 483 geometries**. Cost: building a character now merges meshes, so 5 bots joining the lobby takes ≈30–60 ms (noisy; 26 ms with sharing only, 66 ms originally). Visual A/B on the pitch: goblin, small/big spider, pixie, dummy, dragon identical; wizard/troll checked in the new build only.
- [ ] **P3 `InstancedMesh` for many enemies of the same type** (spiders, pixies) — the merge part of this item is done (see above).
- Good already: particles = 2 point systems, 1 draw call each, max 5,000; forests/grass/candles use `InstancedMesh` (15 places); `batchStatic` merges map statics.

## D. Loading
Page open today: `index.html` 538 KB (≈ 82 KB inline icon SVGs — moved to `icons/*.svg` 2026-10-18) + `three.module.js` 1.24 MB unminified + 9 addon modules + PeerJS 91 KB + fonts + 73 SFX (752 KB, 74 parallel requests) + menu music 1.7 MB (streamed). Match start: `amb/<map>.ogg` + `music/<map>.ogg` (~2 MB, streamed).
- [x] **P2 Use a minified / trimmed Three.js** (done 2026-10-18: `three.module.min.js`, 257→166 KB gzip, 1.27→0.67 MB to parse. Addons are still unminified `examples/jsm/` files — small; a custom tree-shaken build would need a build step.)
- [x] **P2 Service Worker cache** (done 2026-10-18: `sw.js`, cache `wd-<PREFIX>`, network-first page / cache-first CDN / stale-while-revalidate same-origin; `?nosw` disables; details in HANDOFF §3. Not cached: streamed music (Range requests) — see new item below.) for `index.html`, Three.js, PeerJS, audio, future models: fast repeat visits, works if unpkg is down, offline solo. Needs versioning so players never get stuck on an old build (tie to `PREFIX`).
- [ ] **P3 Audio priority / sprite.** Load common SFX (bolt, hit, step, UI) first, rest when idle — or pack all SFX into one audio sprite (1 request instead of 74).
- [ ] **P3 Prefetch the chosen map's music/ambience in the lobby.**
- [ ] **P3 Offline music.** The SW skips Range requests, so `<audio>` music is not cached (offline = synth music). Option: SW answers Range requests by slicing a full cached copy, filled when the track first plays.

## E. Direction: streamed asset files (agreed with user 2026-10-17)
Goal: models, VFX and sounds become files that are easy to edit/replace with better-looking made assets; code stays in `js/`; the current code-built versions stay as fallback.
- [x] Asset loader: `GLTFLoader` (+ Draco or Meshopt) loading `.glb` on demand, with a promise cache. (done 2026-10-18: `loadModel`, lazy import)
- [x] Fallback rule: show the code-built model until the file arrives (or forever if it fails). (done: `modelOr`)
- [ ] LOD: low-detail first, swap to high-detail when loaded / when close.
- [ ] Prefetch next map/boss assets in lobby and buff screen. (props of the current map are prefetched when the map is built; lobby prefetch not yet)
- [x] Service Worker (D) stores everything after first download. (done: `assets/` cached with their `?v=`, manifest network-first)
- [x] Asset manifest (one JSON listing files + versions) so the loader and Service Worker share one list. (done: `assets/manifest.json`; Blender conventions in `ASSETS.md`)
- [ ] Licences: repo is public — only CC0 / CC-BY / self-made assets, credits in guide.

## F. Future tech plan: big maps + lots of destruction + many skill lights (talked with user 2026-10-22 — record only, do later)
User's future goals: bigger maps, more and finer breakable things, light from skill effects. Map + mode design comes first; do not start this until asked.
- **Now:** stay on WebGL (three.js 0.160) + JS. Measured: sim/particles < 2 ms per frame, the heavy part is drawing (GPU submit ≈ 7 ms in the heavy bench).
- **Skill lights:** only 6 pooled point lights today (`LPOOL`, js/27). In WebGL forward rendering every lit pixel loops over every light, and a change in light count recompiles every shader (see the 2026-10-21 warm-up entry) → more real lights does not scale. Options: (a) fake light (emissive + glow sprites + light decals on the ground) — works now; (b) **WebGPU + tiled/clustered lighting** (three.js WebGPU renderer, TSL) → 100+ dynamic lights. Shadows from skill lights stay expensive either way (keep to 1–2).
- **Backdrop (done for all outdoor maps 2026-10-28, `js/67-backdrop.js`):** cheap fake scenery rings outside the play area make maps look bigger; add other maps to `BACKDROP`.
- **Bigger maps:** split into zones, LOD (low-detail far away, also §E), bake static map lighting (lightmaps / light probes), keep `batchStatic` for unbreakable parts. Breakable parts can't be merged → more draw calls → instancing per chunk type; WebGPU lowers draw cost and allows GPU culling / indirect draws.
- **More/finer destruction:** debris physics with **Rapier (WebAssembly)**, debris simulated on each client only (visual), network sends only "which piece broke" (bandwidth is the real online limit, not CPU).
- **WebGPU cost/risk:** every custom GLSL shader (fireVol, ice, particles, grass, trails, soft particles, AO/grade passes…) must be rewritten in TSL; some friends' browsers/devices may lack WebGPU → need a WebGL fallback.
- **First step when the user asks:** a separate test scene (not the game): WebGPU + 100–200 moving lights + one house breaking into a few hundred Rapier chunks; open on the user's and friends' PCs, compare FPS and which devices can't run it; decide from those numbers.

## G. Round 2026-10-25 (user: "แล็คมาก") — CPU-bound on the user's AMD iGPU PC
- [x] Auto quality shadow toggle = full shader recompile (~2 s freeze) → auto keeps shadows on, updates every 4th frame at lvl 2.
- [x] Cloth `Math.hypot` → `Math.sqrt` (V8 hypot is slow), typed edge array.
- [x] Particle removal O(n) compaction instead of per-item `splice`.
- [x] Additive DoubleSide transparent materials single pass (`forceSinglePass`, js/01).
- [x] `burnNum` cached canvases (no per-frame shadowBlur).
- [x] Auto quality CPU-aware (2026-11-01): `QUAL.cpu` vs frame time; CPU-bound → `lvl` up, resolution kept.
- [x] Particle uploads only `0..n` (`addUpdateRange`), empty systems skipped (2026-11-01).
- [ ] Full GPU particle sim (spawn once into fixed slots, shader computes position/colour/size from age): saves the remaining ~3–4% CPU of `updateParticles`, but ~180 `PARTS.push` sites with free-form fields, curl drift and terrain height would change how every approved effect looks → only with the user's OK + VFX re-review.
- [ ] `drawLabels` (name tags / HP bars, 2D canvas) is now the biggest game-side CPU cost (~6%) → next candidate.
- [ ] Remaining CPU: three.js render traversal/matrix updates, `getParameters` for 54 normal-blend DoubleSide materials (two-pass), cloth still ~8%, labels/HUD 2D.

> In-game numbers: Settings → ภาพ → ข้อมูลประสิทธิภาพ (F3) + กราฟ FPS (`js/71-perfhud.js`); the 📋 button copies them as text.

## H. Round 2026-11-05 — user's perf report (TDM, valley, 12 players) — record only, nothing fixed yet
User's F3 report (1920×911, graphics high): **34 FPS, 1% low 11 FPS, worst 101 ms, CPU 23.6 ms/frame (host sim only 1.2)**, 662 draw calls, 1,025k triangles, **243 shaders / 2,433 geometries / 1,209 textures**, JS 218 MB, 1,142 particles, 12 people, net 22 snapshots/s · 88 KB/s per client.
Reproduced in the hidden pane (`?nosw`, `lobbyBotFill()` → 11 bots, `G.mode='tdm'; G.mapPick='valley'`, frames driven with `WD.hostStep` + `WD.render` + `readPixels`): render-side CPU 19–20 ms/frame, host 0.7 ms, 1.0–1.7 M triangles, 260–1,300 draw calls depending on the fight. `WD.PROF`: **gpuSubmit 10.6 ms** (three.js traversal + draw submit), **fx 6.4 ms** (particles/shapes/lights/vfx/debris), **players 4.9 ms** (syncPlayers + grass + cloth), hud2d 1.1 ms, hostTick 0.6 ms.

**The big one — the game gets slower the longer a session runs (leaks between matches):**
- [x] **P1 Skeleton bone-texture leak.** (done: `disposeTree` calls `skeleton.dispose()` for skinned meshes. **Fixed 2026-11-05:** textures stay ≈180 and geometries ≈1,000 over 4 matches in a row (were +84 textures/match); warm-up chars freed in game, rebuilt in the next lobby; no console errors, characters render normally.) Every skinned character part gets a `Skeleton` with its own bone `DataTexture` (`computeBoneTexture`), but `disposeTree` (js/29 ~427) never calls `skeleton.dispose()` (no `skeleton.dispose` anywhere in `js/`). Measured **+84 textures per match** with 12 players (12 chars × 7 skinned parts of `char_student`): 99 → 182 → 270 → 362 → 447 → 531 → 615 over 6 matches, never going down. This is how the user reached 1,209. Fix: in `disposeTree`, `if(o.isSkinnedMesh&&o.skeleton&&!keep)o.skeleton.dispose()` (careful with skeletons shared by outline copies in js/47 ~491 and js/68 ~61, which `bind(m.skeleton)` to the original).
- [x] **P1 Warm-up characters never freed.** (done: `gameWarmFree` js/51, called from `renderGame` js/37 — disposes `GWARM.chars` 2 s into the match; programs stay because `pinPrograms` pins them, file geometry/materials are `keep`.) `GWARM.chars` (js/51 ~122/131) keeps one hidden `makeStudent` + file model per distinct look forever and adds to it every lobby (bot looks are random per fill, friends add more). Seen: 12 hidden rigs = 604 meshes left in the scene in the lobby. Hidden objects are not drawn, but three.js still updates their matrices every frame and they hold GPU memory. Fix: clear/dispose `GWARM.chars` when the match starts (or cap it, LRU of ~12).
- [x] **P2 Hidden code-built body under the file model.** (done 2026-11-06: `useFileModel` js/22 removes layer-31 leaf meshes + unused `hair_/tie_/wand_` variants; code cloak no longer simulated once the file model is in (js/35). 12-player scene 2,844 → ~2,050 objects.) Each player has ~28 visible meshes (7 skinned `char_student` parts + wand/tie/props) and **~23 hidden** code-built fallback parts that are still traversed every frame. Once the file model is ready, remove (or detach) the fallback parts instead of hiding them.
- [ ] **P2 Check geometry growth too:** geometries went 264 → ~1,250–1,580 over the session (part of it is the `WCACHE` map cache + warm-up chars); re-measure after the two P1 fixes.
- Draw calls looked higher in later matches (first match 260–420, later 560–1,070) but fight intensity differs between runs — **not proven** to be a leak; re-measure after the fixes with a fixed scripted fight.

**Per-frame cost (not leaks):**
- [ ] **P2 Players = most draw calls.** 12 players × ~28 visible meshes ≈ 395 draws + ~311 shadow casters. Ideas: merge the 7 skinned `char_student` parts into 1–2 skinned meshes (one material + atlas/vertex colours) in Blender/export; merge the static code-built extras (wand, tie, belt) per player like `mergeBody`; drop `castShadow` on small parts (tie, buttons, wand).
- [ ] **P2 FX mesh particles are very high-poly.** The 3 biggest single meshes in the scene are FX mesh-particle `InstancedMesh`es (js/46 ~202, ice colours): **198k, 91k, 79k triangles** (≈ 4k triangles per shard × 20–50 instances). Need a triangle budget for `.mesh.json` used as particles (e.g. ≤ 300 tris) — VFX Studio could show tris per instance and warn. Also `water_ringwave_low` ×3 = 38k tris each.
- [ ] **P2 `fx` 6.4 ms/frame** — split it (`updateParticles` / `updateShapes` / `updateLights` / `updateVfx` / `updateDebris`) with `WD.PROF` sub-timers to find which one.
- Shadows are not the problem: `shadowMap.autoUpdate` is already off (updated every N frames); turning shadow updates off completely changed render CPU by only ~0–1.6 ms.
- [ ] **P3 Network for 12 players:** 88 KB/s per client × 11 clients ≈ 1 MB/s upload for the host at 22 snapshots/s. Fine on LAN/fibre, may be too much for a home upload with 12 real players → delta/quantised snapshots, interest management, or a lower snapshot rate for far players.

**Dev-environment note:** once in the pane, a Service Worker from an earlier load stayed in control even with `?nosw` and every same-origin fetch failed (`Failed to fetch`, page stuck without `WD`) while `curl` to the server worked. Unregistering the SW fixed it. Not reproduced; if a player ever reports "the game won't load", check this first.

## I. Round 2026-11-06 (user: "sometimes stuck at 20 fps all the time")
- Why exactly 20: on a 60 Hz screen the browser shows 60 / 30 / 20 fps; a 12-player brawl costs ~25–31 ms CPU per frame here (bench below), so bad moments drop to 20.
- Bench: `node tools/headless.js --game --js <script> --profile <name>` (new): wrap the part to measure in `console.profile()`/`console.profileEnd()`; prints the top self-time functions and saves `shots/<name>.cpuprofile`. 12-player TDM valley bench script = 11 bots via `lobbyBotFill`, huddled, 400 frames with `WD.hostStep` + `WD.render`. Timings on this laptop swing 30 → 65 ms between identical runs when other sessions render at the same time — compare A/B interleaved.
- New `WD.PROF` sub-timers: `p.sync` `p.grass` `p.cloth` (players), `fx.parts` (= updateZV effects + updateParticles) `fx.shapes` `fx.lights` `fx.vfx` `fx.debris`, `h.labels`.
- Profile (frame ≈ 100%): three render ≈ 50% (`renderBufferDirect`/setProgram/uniform upload ≈ 28% for ~800 draws — per-draw cost, many distinct materials), effects+particles ≈ 15%, `updateMatrixWorld` ≈ 10%, syncPlayers ≈ 7%, HUD ≈ 5%, cloth ≈ 4%.
- [x] `gl.debug.checkShaderErrors` off (js/27, `?debug` turns it back on): every new shader made the CPU wait for the compile (`getProgramInfoLog` ~3%).
- [x] Hidden code body + unused file-model variants removed, code cloak not simulated (see §H P2).
- [x] F3 panel shows the GPU name and warns when it is a built-in GPU (this laptop has Radeon built-in + RTX 3050: Chrome on the built-in one = very slow; fix = Windows Settings → Display → Graphics → Chrome → High performance).
- [ ] **Shaders still compile mid-fight:** 12 new programs in a 400-frame 12-player brawl (each 50–280 ms freeze): material flag combos (cacheKey index 49–52) not covered by warm-up, point-light count change 10→6 (index 36), earth/water outline materials (`_eOlMat` js/47, `_wtOlMat` js/68) first used mid-fight. Fix = warm these combos in js/51 / keep light count fixed.
- [x] `h4Portrait` (js/66): readback moved to the start of the next frame (`h4PfRead`, called in `frame()` js/37) — the GPU has finished by then, so no stall.
- Shader compiles mid-fight, detail (2026-11-06): the new programs are ShaderMaterial **fragment-source variants** not warmed (fireVol `uN.uS.uSim…`, heat haze `hazeMat` ring/plain, a `t.c` shader, an `uOp.uInt.uScale.uFlow…` shader) + a textured MeshStandardMaterial when far buildings stream in. One freeze per variant per session (programs are pinned after), not the cause of steady low FPS.
- [ ] Draw calls: players' 7 skinned parts + extras per player (see §H P2 players).

- [x] Cloth round 2 (2026-11-06): body-frame cloak + 60 Hz step → 2.4 → 0.65 ms in the 12-player brawl.
- [ ] Headless can't measure GPU: `gpuWait` ~32 ms unchanged with bloom off or half resolution. Needs a real play session (F3 panel).
- [~] Mid-fight shaders: 3-4 → 0-1 per 500 frames on 4 maps (shadow pass in `warmDraw`, `fireSeqVol`, crack variants). Left: occasional flipSided STANDARD; map lights counted 10 or 6 keep two program sets.

## G. 12-player room measurement (2026-11-06, user: "เสกบอทให้เต็มห้อง 12 ตัว เฟรมเรทไม่ถึง 60")
Setup: solo host, FFA, `lobbyBotFill` → 12 players (11 bots, mixed paths, lv 1), meadow, browser pane 1024×768 @ DPR 1.25, **Intel Iris Xe (integrated)**. Numbers = `WD.PROF` per frame over 5–6 s + perf panel (`js/71-perfhud.js`).
| Graphics | FPS | frame | CPU (JS) | host sim | draw calls | triangles | render size |
|---|---|---|---|---|---|---|---|
| auto (dropped itself to level 2, scale 0.45) | 57 | 17.5 ms | 12.5 ms | 0.5 ms | 207 | 173k | 461×346 (blurry) |
| high | 29 | 34.8 ms | 19.5 ms | 0.5 ms | 387 | 604k | 1280×960 |
CPU per frame on **high**: `gpuSubmit` (three.js walking the scene + issuing draws, incl. shadow pass) **8.9 ms** · particles + skill visuals (`fx.parts`: `updateParticles` 2.5 + `updateZV` 2.0) **4.6 ms** · `p.cloth` (own cloak only!) **2.5 ms** · 2D HUD `hud2d` **2.3 ms** + name labels `h.labels` **1.5 ms** · `p.sync` 1.7 ms · host game logic `hostTick` **0.6 ms** + snapshot 0.4 ms. The rest of the frame (~15 ms) = waiting for the GPU.
Scene: 1473 visible meshes, **744 shadow casters**, 100 skinned meshes (≈8 per character), ~2000 geometries (stable, not growing).
**Conclusion: WebAssembly would not help** — the game logic is 0.6 ms; the cost is drawing (CPU side of draw calls + GPU) and view-side JS. Wins in order:
- [~] **Shadow casters** — 2026-11-06: character accessories (tie, wand, hair base, tiny trim) no longer cast (`useFileModel`, js/22). Map props still cast; next: small props/debris. **Was: Shadow casters 744 → only characters + big props** (small props, flowers, tufts, fences, debris off) — cuts the shadow pass (draw calls + GPU).
- [ ] **Merge each character into 1–2 meshes** (8 skinned parts + hair/wand/tie separate today) → ~100 fewer draw calls with 12 players; far characters: update animation every 2nd frame.
- [x] **Cloth** — 2026-11-06: ≤2 solver steps per frame (was 4: slow frames did more work) + body capsules on alternate iterations (last one always) → 3.4 → 2.4 ms in the brawl bench. **Was: Cloth 2.5 ms** for one cloak — profile `clothTick` (world gather `clWorld` with 12 players nearby? solver iterations) — should be < 0.5 ms.
- [~] **2D HUD + labels** — 2026-11-06: name labels are pre-rendered images (`nameTag`, js/35) → 0.48 → 0.30 ms; rest of `hud2d` still open. **Was: 2D HUD + labels 3.8 ms** — cache text (name labels as pre-rendered sprites/canvases, redraw only on change).
- [~] **Particles on CPU** — 2026-11-06: colour object cached on the particle, curl noise every other frame (×2 step) → 10.1 → 7.7 ms at ~7k particles. **Was: Particles on CPU** (~900 alive, 2.5 ms) — cap per effect or move motion to the GPU (shader-driven, like the existing point systems).
- [x] Auto graphics (GPU-bound) order — 2026-11-06: bloom off first → resolution down to 0.7 → lvl 2 → only then 0.55/0.45. **Was:** GPU side at full res: auto mode drops to scale 0.45 (very soft image) before cutting effects — consider cutting bloom/SSAO/soft particles first, keep resolution ≥ 0.7.

Brawl bench after round 1 (`tools/bench-bots.js`, meadow, 11 bots paths [0,1,2,6,7,0,1,2,6,7,0], seeded, 600 frames, hidden pane): particles 10.1 → 7.7 ms, cloth 3.4 → 2.4, labels 0.48 → 0.30, gpuSubmit 30.8 → 27.4 (≈ −7 ms CPU per frame). Median frame unchanged (~81 ms) because the hidden pane's readPixels sync is a fixed ~20–30 ms wait that does not change with half resolution / no grass / no shadows → **GPU cost cannot be measured in the Claude pane**; check real FPS on the user's PC with F3.

Round 2 (2026-11-06, same bench): finer `WD.PROF` sections — `zv.*` inside `updateZV` (ice/slash/storm/fire/frost/kit/**fxfile**) and `h.*` inside the 2D HUD (bars/texts/hud/social/ffa/hud4). Findings: VFX Studio runtime `updateFx` was the biggest skill-visual cost (**3.1 ms**) — `fxCurve` rebuilt + sorted the curve key list on every value read → keys now sorted once per curve object (`fxCurveKeys`, WeakMap; off in `?studio` so edits still show) → **2.0 ms**. 2D HUD is now small (drawHUD 0.7–0.9, FFA board 0.3, labels 0.23 ms). Per-player sync 12 players ≈ 2.5 ms (anim 0.4, broom/cloak 0.4, path visuals 0.7). Map prop shadows: map is already merged/instanced, visible map casters ≈ 70 → low value, not changed. Biggest CPU left in a 12-player brawl: particles ~5 ms (~7k alive; next idea = pool particle objects to cut GC / move motion to GPU) and three.js render submit (≈ 2000 scene nodes, ~1200 of them the 12 characters incl. bones).

## J. Round 2026-11-05/06 — "big fights drop from 50 to 20–30 FPS" (user)
Bench: `tools/bench-fight.js` (TDM valley, 12 players, everyone casts every slot + ult every 1.5 s, seeded `Math.random`, fixed kits; `window.BENCH_KITS=[...]` to pick kits). Hidden pane, 1920×911. Runs still vary ±2–3 ms / ±100 draw calls between runs, so compare draw calls and repeat runs.
New `WD.PROF` sub-timers (render loop): `fx.zv/fx.parts/fx.shapes/fx.lights/fx.vfx/fx.debris`, `pm.proj/pm.walls/pm.earth/pm.wind/pm.water/pm.props/pm.mins`, `zv.frost1/zv.storm/zv.fire/zv.frost2/zv.kit/zv.fxrt`, `wt.dragon`.

Calm → big fight (render-side CPU per frame): **≈8 → 17–26 ms**, GPU wait 13 → 17–24 ms. Where the extra time goes (ms/frame in the fight):
| Part | ms | Note |
|---|---|---|
| `gpuSubmit` (three.js traverse + draw) | 7–10 (calm 3.5) | 480–900 draw calls; up to ~2,500 visible objects traversed |
| `fx.parts` (CPU particles) | 3–3.7 | 5,000–6,500 particles |
| `players` (sync + grass + cloth) | ≈3 | same as calm |
| `hud2d` (name tags, HP bars, HUD) | 2.2–3 (calm 1.2) | 2D canvas text every frame |
| `zv.fxrt` (fx.json runtime) | ≈2 | |
| `wt.dragon` (water dragon) | 0.7–3 | only when a water player is fighting |

- [x] **Code-built shapes batched** (done 2026-11-06, `js/30-particles.js`): ring/ringv/arc/dome/warn/warnr/rune/decal are now one `InstancedMesh` per kind (additive: opacity folded into the instance colour = same picture; decal: per-instance `iOp` alpha). Before, every ring/scorch mark was its own Mesh + new material; one random fight had **493 rings alive at once**. A/B screenshot (warn circles, rune, lava decal) identical. Earth+pyro fight: draw calls 644/722 → 584/702, CPU 17.5/17.8 → 16.8/16.5 ms (small, within noise on mixed kits). Ordering note: decals now draw before other transparent objects (renderOrder −1), glows after (3).
- [x] `curlAt` no longer allocates an array per particle per frame (less GC).
- [ ] **P2 Particles on the GPU** (§G item) — still the cleanest big CPU win for fights, but changes how approved effects move → needs the user's OK + VFX re-review.
- [ ] **P2 HUD text cache** — `drawLabels` redraws every name/HP text each frame; cache per player (re-render only when text/HP changes).
- [ ] **P2 Earth ult area rings** (`js/47-earth-view.js` ~617): spawns a ring + burst almost every frame for big radii → hundreds alive. Cheap now (batched) but still particles; could be rate-limited (visual change → ask).
- [ ] **P3 Water dragon tick** (`wdgTick`, js/70) 0.7–3 ms while active — profile inside.
- [ ] **P3 fx runtime** (`updateFx`) ≈2 ms in fights — profile per layer type.
- Tip for players: graphics **อัตโนมัติ** lowers effects (×0.7, cap 5,000) and resolution when frames get slow; **สูง** keeps everything on.

## K. Round 2026-11-06 (user: "mostly 20 fps in TDM with 5 bots", "what about weaker PCs?")
Real-time bench (real rAF, not `WD.hostStep`): TDM valley, 5 top-level bots huddled, `node tools/headless.js --url "index.html?nosw" --js <script> --w 1891 --h 942 --quiet --cpu N`. **`--cpu N` (new) = CDP CPU throttling, simulates a slower PC.** Always check machine load first: the same code measured 14 fps while something else ran on this PC, 50–59 fps when idle (other Claude sessions' headless renders, or the game open in Chrome). The main thread was 99% busy in those 14 fps runs and lowering resolution did nothing.
- "Fixed at 20" was partly the counter: FPS text used `dt`, clamped to 0.05 s, so it could never read below 20. Now real time (js/37). Real frames could be slower than 20.
- `warmCompile` used `gl.compileAsync`, which throws in r160 (`isReady` of undefined) → warm step waited its 4 s timeout. Now `gl.compile`. Assets created during a 1,500-frame brawl: programs 80 → 3, textures 80 → 5, geometries 465 → 83, network fetches 0.
- Same bench at CPU ×1: d01b2c3 26–29 fps → b5a683c 42–48 → latest 50.6 → with this round 59 (screen cap), 0 frames over 50 ms in auto.
- **CPU saving tiers** `qualCS()` (js/27, 0–2; low = 2, auto = `QUAL.cs`, high = 0): `cullTick` hides small world meshes far from the camera (layer 29, radius ≤ 12 only), shadows every 6th/12th frame, particles ×0.5/×0.35 cap 2,500/1,200 (`vfxQual` js/19), cloth every 2nd/3rd frame, HUD portrait every 2 s. Auto raises `cs` after `lvl` 2 when CPU-bound (>24 ms), lowers after 16 s under 18 ms. Picture nearly identical (`shots/low_cmp.jpg`).
- Label loop no longer sets `cx.font` per player.
- Result: CPU ×2 33 fps (auto), p95 42 ms. **CPU ×4 still only 12.5 fps** (was 8). Remaining cost at ×4: `renderBufferDirect` 31% (per-draw three.js work, ~600 draws, characters ≈ 135) — the next real gain = fewer draws per character / merged static map pieces, then particles on GPU (§G).
- [ ] Host sim in a Web Worker would free ~5% of the main thread (bigger refactor).
- [ ] Bloom-white roofs in valley (seen in `shots/low_cmp.jpg`) are a look issue, not perf.

## L. GPU particles 2026-11-06 (user chose this, played it, approved) — ON for everyone; `?cpup` = old CPU path
`js/30-particles.js`: `pgpuSpawn` writes start values into one interleaved buffer once; `PGPU_HEAD` (vertex shader) computes position, colour, size from age. All 177 `PARTS.push` sites and every fragment shader are unchanged; `PARTS` stays for count/cap and is compacted every 6 frames. Nobody keeps a reference to a pushed particle (checked), so this is safe.
Known differences: ground height read once at spawn (not per frame); curl = approximation at the current point, so smoke swirl differs slightly; `grow` = exp(grow*t). Do not call `clearUpdateRanges` per frame: frames that skip drawing (Studio seek) would lose new particles; three clears ranges after upload.
Measured: `updateParticles` 3–4 ms → 0.25 ms in a 12-player brawl; whole render-side CPU 21–28 → 17–23 ms; 5 bots CPU x2 30.5 → 33.8 fps (p95 45 → 38 ms), x4 11.8 → 13.8 fps. Contact sheets old/new: `shots/gpup_ab1.jpg`, `gpup_ab2.jpg`. Next cleanup: once no problem reports come in, delete the old CPU path and old vertex shaders.

## M. Remaining lag check 2026-11-06 (user: "a lot better, can it be better?")
12-player brawl, 1,500 frames, idle PC: median 20.8 ms, p99 70 ms, max 156 ms. Mid-fight creation: programs 4, textures 8, geometries 92, network 0. Spikes (40-80 ms) cluster in the first 2 s of a fight, then rare; the profile is flat, no single hot function.
Tried and dropped: skipping `updateMatrix` for unmoved objects. `scene.updateMatrixWorld()` costs only ~0.12 ms per frame here, so no gain. Do not retry.
Next real gains are structural: fewer draw calls per character (merge parts in Blender), shader variants still missed by warm-up (section I), host simulation in a Worker.

## N. Character merge 2026-11-06 (user chose)
`mergeStudent` (js/22): other players' file model becomes one SkinnedMesh with `bodyMat(DoubleSide)`: colours, roughness and metalness per vertex, palette texture sampled into vertices, hair/tie (children of bones) turned into 100% weights on that bone. 10 draws per character down to body + wand. Own player is not merged (cloth in js/49 needs the separate panels); `?unbatchedStudent` = off. 12-player brawl draw calls 514-570 down to 424-474 (timings stay in machine noise). Look compared side by side from the front: `shots/mf_cmp.jpg`.

## Benchmarks
Follow-up batching/LOD 2026-11-06: student Skeletons 7→1 per player; compatible skin/iris/scarf trim combines with vertex colour/PBR attributes (2 fewer draws per body per pass). Cloth panels/palette stay separate. Actual high-poly emitted model is `water_blob` (3,968 tris), not frost shards (32). Tiny water particles <=12 physical pixels use a 224-triangle mesh; near particles and hero geometry stay full detail. Visual/animation/lifecycle checks pass. This partially addresses §H player/particle items, not all FPS causes. See `notes/optimize-batching-lod-2026-11-06.md` and `tools/bench-render-audit.js` for actual active instance costs.

Follow-up 2026-11-06: countdown now registers code-created fire surfaces/heat haze, rigid+skinned Earth/Water outlines, and water tether (`js/51`, `js/70`). Actual Aqua Cage/Dust Burst regression shows one new outline program per skill with these registrations disabled, zero with them enabled. This does not close the general mid-fight shader item above. `fx.zv` / `fx.particles` now separate the old `fx.parts` measurement (which remains for older reports); these timers are nested, not additive. `tools/bench-bots.js` waits for async warm-up before timing; old reports that timed outstanding loading are not directly comparable. See `notes/optimize-followup-2026-11-06.md`.

`tools/bench-start.js` = match start / map switch hitch (see its header).

## Heavy-scene bench
`tools/bench-heavy.js` (header says how to run it). Open the page with `?nosw` so the Service Worker does not serve an old copy of the script. Uses `WD.hostStep(dt)` (one host loop iteration: hostTick + snapshot + FX) because the hidden pane throttles `setInterval`.

## Measuring harness (paste in console)
```js
window.requestAnimationFrame=()=>0;            // stop the game's own loop
const gl=WD.gl,ctx=gl.getContext(),px=new Uint8Array(4);
function frame(){const t=performance.now();WD.render(1/60,t);ctx.readPixels(0,0,1,1,ctx.RGBA,ctx.UNSIGNED_BYTE,px);return performance.now()-t;}
// around an event: diff gl.info.programs.length and gl.info.memory.{geometries,textures}
// events: WD.hostStart() · WD.castSlot(p,i) · p.ult=100;WD.castUlt(p) · boss: G.wave=4;G.queue=[];G.en=[] then G.buffT=0
```

Round 3 (2026-11-06): measured at frame 200 of the 12-player brawl (hogsmeade): 485 draw calls incl. shadow, 420k triangles, 160 shadow casters, light count steady (no program switches), shadows already every 2nd frame. Flat ground decals (`_decM`, cast discs) marked `forceSinglePass`: two-pass materials 21 → 4 draws, `getParameters` 2.3 → 0.8% of profile. `animTick` takes a `lod` (`animLod`, js/22): other characters and enemies ≥35 units from the camera update bones every 2nd frame, ≥70 every 3rd; own character always every frame. Spread-out bench: `players` ~2.3 → ~2.05 ms, `gpuSubmit` ~9.8 → ~8.1 ms (noisy, two runs vs two runs). Not measured on a real GPU.

Water triangles (2026-11-06): 9 Blender grid meshes in `assets/vfx/` reduced with `tools/mesh-simplify.py` (no external install; surviving vertices keep exact position/normal/UV, open edges and UV seams locked): ringwave + ringwave_low 38.4k → 10k, crown 36.5k → 17.6k, jet 23.8k → 6.2k, curl 42.6k → 11k, curl_body 22.4k → 5.8k, crescent 13.5k → 3.5k, wake 15.4k → 4k, serpent 19.1k → 5k. `water_blob` particles now use a 16-segment sphere (960 tris) close up instead of 32 (3,968); ≤12 px stays 224. Peak scene triangles in Training with one Water player: Dragon ult 1,229k → 647k, Riptide 900k → 428k, basic attack 428k → 315k. Re-running `assets/src/water_meshes_build.py` in Blender would bring the heavy meshes back: run the simplifier after. Same-seed in-game frames compared old vs new (Riptide, ult impact): no visible difference at game camera distance.

Water triangles round 2 (2026-11-06): simplifier now runs repeated passes, takes a bend limit, and ignores zero-area UVs (89% of crown triangles, which blocked it). Run from the original Blender meshes with limit 0.45: crown 6k, ringwave + ringwave_low 5k, jet 3.5k, curl 6k, curl_body 3.5k, crescent 2.5k, wake 2.5k, serpent 4.4k. `water_blob` particles: 12 segments (~500 tris) close up, 224 tris up to 20 px. `water_dome_foam` seg 12/10 → 8/7. Ult frame 370 in Training: 1,029k → 423k, of which ~270k is the map and character with no water on screen.
