# Optimization backlog

Notes + status. Items marked [x] were done on 2026-10-18 (overnight session).
Measured 2026-10-17 on the user's PC in a hidden Claude Browser pane, so absolute numbers are rough; compare before/after with the same harness (bottom of this file).
Scope of this track: logic, performance, algorithms, loading. Not balance/gameplay.

Priority: **P1** = real bug or big win, **P2** = clear win, **P3** = nice to have / needs more measuring.

## A. Bugs found while measuring
- [x] **P1 Texture leak.** (fixed: `disposeTree`/`disposeMaterial`; textures stay ~30 across matches) Each `hostToLobby` → `hostStart` leaves 7–10 GPU textures behind (61 → 110 after 6 matches). `buildWorld()` (line ~3462) and `disposeObj()` (~4208) only call `geometry.dispose()`; materials and their `map` CanvasTextures are never disposed. Fix: dispose `material` (+ `material.map`) too, skipping shared ones (`glowTex`, `projGeo`/`tailGeo`-style shared assets).
- [x] **P1 Cloak NaN** (found 2026-10-18 in the heavy bench): enemy wizard cloaks (height 1.7) had NaN in their top row of vertices every frame — the rest positions are Float32, so `0.85f` is a hair above `hh=0.85` and `Math.pow(negative,1.5)` = NaN (console `computeBoundingSphere(): Computed radius is NaN`). Fixed with `Math.max(0,…)` in `updateCloth`; also `updateCloth`/`localVel` now reset on non-finite state. Side finding: in the old build, a NaN mesh plus bloom could turn the whole screen black in a test (bloom off = picture back); the new build did not black out under the same test.
- [ ] **P2 Doc/code mismatch.** Comment at line ~2616 says audio loads on first click; it actually loads at page open (`ac()` runs on load). Decide which is wanted and fix the comment or the trigger.

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

- [x] **P1 Pre-compile shaders.** (done: `prewarmShaders()` after `buildWorld`, `gl.compileAsync` + hidden VFX group; first spell casts no longer compile — Permafrost still adds 1 program) Call `renderer.compileAsync(scene, cam)` right after `buildWorld` / during the 3-2-1 countdown, and once for the menu stage. Also pre-warm VFX materials (shield, colossus, boss) by adding them invisible once.
- [x] **P2 Find the pyro +381 geometries / frost-ult spike** — obsolete: those placeholder spells were replaced by the user's Pyro/Frost designs; the new ones were measured after prewarm (≤ 20 ms).
- [x] **P2 Share geometry/material between characters.** (done 2026-10-18: `sGeo/sMat/sStripe` caches, marked `userData.keep`; only the animated cloak geometry, the shield ShaderMaterial and the foot ring material stay per character. Ghost mode now swaps to transparent clones via `setGhost` instead of editing materials. Result in the heavy bench: 5 bots joining the lobby 66 → 26 ms and +195 → +35 geometries; heavy scene 892 → 512 geometries, 39 → 25 textures; match start 294 → 124 geometries. Draw calls unchanged — see C.)
- [ ] **P3 Cache built maps** (or at least reuse geometry/material across rebuilds) instead of rebuilding the same map each match.
- [ ] **P3 Pool enemies and projectiles** instead of create/dispose on spawn/death.
- [ ] **P3 Time-slice heavy builds** (spread `buildWorld` over a few frames) — only if A/B fixes are not enough.

## C. Draw calls / render cost
- [x] **P2 Measure the heaviest scene** (done 2026-10-18, `tools/bench-heavy.js`: castle, solo + 5 bots — coop allows max 6 — wave 5 dragon + 7 adds, everyone casting every slot, ~7,900 particles). Baseline: **~1,280 draw calls (max ~1,400)**, 118 k triangles, 48 shader programs, frame median ≈ 30 ms in the hidden pane (vsync-quantised, use calls/geometries to compare, not ms). Each player is ~110 meshes (≈35 in the body + spell props), mostly drawn twice (shadow + main).
- [x] **P2 Merge the static body parts of each character** (done 2026-10-18, `mergeBody`): inside every group of a student (body, legs, arms, wand, scarf ends) all plain-colour parts become one mesh with the shared `BODYM` material (front/double side); colour/roughness/metalness are per-vertex attributes (`color`/`aRough`/`aMetal`, shader patch `bodyPatch`). Parts with a texture (striped tie/scarf), emissive (gold wand), transparency or `userData.anim` (cloak) stay separate. Body meshes per player ~35 → ~15. Heavy bench: **draw calls median 1,285 → 1,045 (−19 %), max 1,405 → 1,151**; +4 shader programs; 5-bot lobby join 26 → 42 ms (merge cost, still below the original 66 ms). Visual A/B at the lobby (same looks) shows no difference.
- [x] **P3 Same merge for enemies** (done 2026-10-18): `makeEnemy` uses `sGeo/sMat/bMat` + `mergeBody` (a second pass also merges same shared-material siblings such as glowing eyes; flat-shaded spider hair and the troll club `userData.anim` stay separate). Heavy bench: **draw calls median 1,045 → 1,006, max 1,151 → 1,081; geometries 537 → 483**. Total for the whole track: **1,285 → 1,006 median (−22 %), 1,405 → 1,081 max (−23 %), 892 → 483 geometries**. Cost: building a character now merges meshes, so 5 bots joining the lobby takes ≈30–60 ms (noisy; 26 ms with sharing only, 66 ms originally). Visual A/B on the pitch: goblin, small/big spider, pixie, dummy, dragon identical; wizard/troll checked in the new build only.
- [ ] **P3 `InstancedMesh` for many enemies of the same type** (spiders, pixies) — the merge part of this item is done (see above).
- Good already: particles = 2 point systems, 1 draw call each, max 5,000; forests/grass/candles use `InstancedMesh` (15 places); `batchStatic` merges map statics.

## D. Loading
Page open today: `index.html` 538 KB (≈ 82 KB inline icon SVGs) + `three.module.js` 1.24 MB unminified + 9 addon modules + PeerJS 91 KB + fonts + 73 SFX (752 KB, 74 parallel requests) + menu music 1.7 MB (streamed). Match start: `amb/<map>.ogg` + `music/<map>.ogg` (~2 MB, streamed).
- [x] **P2 Use a minified / trimmed Three.js** (done 2026-10-18: `three.module.min.js`, 257→166 KB gzip, 1.27→0.67 MB to parse. Addons are still unminified `examples/jsm/` files — small; a custom tree-shaken build would need a build step.)
- [x] **P2 Service Worker cache** (done 2026-10-18: `sw.js`, cache `wd-<PREFIX>`, network-first page / cache-first CDN / stale-while-revalidate same-origin; `?nosw` disables; details in HANDOFF §3. Not cached: streamed music (Range requests) — see new item below.) for `index.html`, Three.js, PeerJS, audio, future models: fast repeat visits, works if unpkg is down, offline solo. Needs versioning so players never get stuck on an old build (tie to `PREFIX`).
- [ ] **P3 Audio priority / sprite.** Load common SFX (bolt, hit, step, UI) first, rest when idle — or pack all SFX into one audio sprite (1 request instead of 74).
- [ ] **P3 Prefetch the chosen map's music/ambience in the lobby.**
- [ ] **P3 Offline music.** The SW skips Range requests, so `<audio>` music is not cached (offline = synth music). Option: SW answers Range requests by slicing a full cached copy, filled when the track first plays.

## E. Direction: streamed asset files (agreed with user 2026-10-17)
Goal: models, VFX and sounds become files that are easy to edit/replace with better-looking made assets; code stays in `index.html`; the current code-built versions stay as fallback.
- [x] Asset loader: `GLTFLoader` (+ Draco or Meshopt) loading `.glb` on demand, with a promise cache. (done 2026-10-18: `loadModel`, lazy import)
- [x] Fallback rule: show the code-built model until the file arrives (or forever if it fails). (done: `modelOr`)
- [ ] LOD: low-detail first, swap to high-detail when loaded / when close.
- [ ] Prefetch next map/boss assets in lobby and buff screen. (props of the current map are prefetched when the map is built; lobby prefetch not yet)
- [x] Service Worker (D) stores everything after first download. (done: `assets/` cached with their `?v=`, manifest network-first)
- [x] Asset manifest (one JSON listing files + versions) so the loader and Service Worker share one list. (done: `assets/manifest.json`; Blender conventions in `ASSETS.md`)
- [ ] Licences: repo is public — only CC0 / CC-BY / self-made assets, credits in guide.

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
