# Optimization backlog

Notes only — **nothing here is implemented yet** (user asked to record first, fix later).
Measured 2026-10-17 on the user's PC in a hidden Claude Browser pane, so absolute numbers are rough; compare before/after with the same harness (bottom of this file).
Scope of this track: logic, performance, algorithms, loading. Not balance/gameplay.

Priority: **P1** = real bug or big win, **P2** = clear win, **P3** = nice to have / needs more measuring.

## A. Bugs found while measuring
- [ ] **P1 Texture leak.** Each `hostToLobby` → `hostStart` leaves 7–10 GPU textures behind (61 → 110 after 6 matches). `buildWorld()` (line ~3462) and `disposeObj()` (~4208) only call `geometry.dispose()`; materials and their `map` CanvasTextures are never disposed. Fix: dispose `material` (+ `material.map`) too, skipping shared ones (`glowTex`, `projGeo`/`tailGeo`-style shared assets).
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

- [ ] **P1 Pre-compile shaders.** Call `renderer.compileAsync(scene, cam)` right after `buildWorld` / during the 3-2-1 countdown, and once for the menu stage. Also pre-warm VFX materials (shield, colossus, boss) by adding them invisible once.
- [ ] **P2 Find the pyro +381 geometries** on first cast and the frost-ult 213 ms spike (profile with `WD.PROF` + geometry diff).
- [ ] **P2 Share geometry/material between characters.** `makeStudent` creates ~43 geometries per player; same-shape parts should reuse one geometry, same-colour parts one material.
- [ ] **P3 Cache built maps** (or at least reuse geometry/material across rebuilds) instead of rebuilding the same map each match.
- [ ] **P3 Pool enemies and projectiles** instead of create/dispose on spawn/death.
- [ ] **P3 Time-slice heavy builds** (spread `buildWorld` over a few frames) — only if A/B fixes are not enough.

## C. Draw calls / render cost
- [ ] **P2 Measure the heaviest scene** (boss + 8 players + max particles) with `gl.info.render.calls`, `info.autoReset=false`. Not done yet.
- [ ] **P3 Merge static parts of characters/enemies** (`mergeGeometries` already imported) and use `InstancedMesh` for many enemies of the same type (spiders, pixies).
- Good already: particles = 2 point systems, 1 draw call each, max 5,000; forests/grass/candles use `InstancedMesh` (15 places); `batchStatic` merges map statics.

## D. Loading
Page open today: `index.html` 538 KB (≈ 82 KB inline icon SVGs) + `three.module.js` 1.24 MB unminified + 9 addon modules + PeerJS 91 KB + fonts + 73 SFX (752 KB, 74 parallel requests) + menu music 1.7 MB (streamed). Match start: `amb/<map>.ogg` + `music/<map>.ogg` (~2 MB, streamed).
- [ ] **P2 Use a minified / trimmed Three.js** (biggest single download).
- [ ] **P2 Service Worker cache** for `index.html`, Three.js, PeerJS, audio, future models: fast repeat visits, works if unpkg is down, offline solo. Needs versioning so players never get stuck on an old build (tie to `PREFIX`).
- [ ] **P3 Audio priority / sprite.** Load common SFX (bolt, hit, step, UI) first, rest when idle — or pack all SFX into one audio sprite (1 request instead of 74).
- [ ] **P3 Prefetch the chosen map's music/ambience in the lobby.**

## E. Direction: streamed asset files (agreed with user 2026-10-17)
Goal: models, VFX and sounds become files that are easy to edit/replace with better-looking made assets; code stays in `index.html`; the current code-built versions stay as fallback.
- [ ] Asset loader: `GLTFLoader` (+ Draco or Meshopt) loading `.glb` on demand, with a promise cache.
- [ ] Fallback rule: show the code-built model until the file arrives (or forever if it fails).
- [ ] LOD: low-detail first, swap to high-detail when loaded / when close.
- [ ] Prefetch next map/boss assets in lobby and buff screen.
- [ ] Service Worker (D) stores everything after first download.
- [ ] Asset manifest (one JSON listing files + versions) so the loader and Service Worker share one list.
- [ ] Licences: repo is public — only CC0 / CC-BY / self-made assets, credits in guide.

## Measuring harness (paste in console)
```js
window.requestAnimationFrame=()=>0;            // stop the game's own loop
const gl=WD.gl,ctx=gl.getContext(),px=new Uint8Array(4);
function frame(){const t=performance.now();WD.render(1/60,t);ctx.readPixels(0,0,1,1,ctx.RGBA,ctx.UNSIGNED_BYTE,px);return performance.now()-t;}
// around an event: diff gl.info.programs.length and gl.info.memory.{geometries,textures}
// events: WD.hostStart() · WD.castSlot(p,i) · p.ult=100;WD.castUlt(p) · boss: G.wave=4;G.queue=[];G.en=[] then G.buffT=0
```
