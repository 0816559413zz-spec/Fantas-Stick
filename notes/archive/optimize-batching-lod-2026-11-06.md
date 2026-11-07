# Character batching and water-particle LOD — 2026-11-06

User approved continuing optimization after the shader warm-up patch. This is rendering work; gameplay, approved skill timing and the pending Moonwater end edits are separate.

## Changes

- Compatible skinned parts of each student share one Skeleton (same bone identities, order and inverse matrices). Seven separate bone uploads/textures become one per character; skeletons are never shared between different players.
- Combine the front-facing skin, iris and scarf trim into one skinned mesh using the existing per-vertex colour/roughness/metalness shader. Preserve all original triangles, positions, normals, weights, bind transforms and animations. Save two body draw calls per player per pass (24 for 12 players in the main pass, with further savings in shadow passes).
- Keep the texture-palette part and named cloak/lining meshes separate, so local cloth simulation continues to find its original panels. Shared materials that are still in use (e.g. scarf trim on a tie) are retained. New merged geometry is owned by the player and disposed on removal.
- Audit corrected an earlier attribution: the ~4k-triangle instanced particles are `water_blob` (3,968 triangles), not `frost_shard` (32 triangles). An observed frame had 110 active water blobs costing 436,480 triangles.
- Only tiny emitted water particles use a 224-triangle version of the same sphere/noise recipe (94.35% fewer triangles per selected particle). Classification uses a conservative projected sphere bound at 12 physical pixels. Larger/near particles keep the original geometry; hero/projectile meshes always retain the original. Mixed groups use separate high/low instance buffers and share the same material. Particle count, state updates, colour, size, lifetime and bounce are preserved.
- Diagnostic opt-outs: `?unbatchedStudent` keeps original student parts/skeletons; `?fullParticleDetail` keeps all emitted water particles at full detail.

## Verification

- `node tools/check.js` passed.
- `node tools/fx-check.js`: 0 errors; existing advisory warnings remain. No FX assets or schema are part of this patch.
- `tools/check-student-batching.js` in real WebGL with shader diagnostics: 28 comparisons (two colour sets, seven original animation clips, two views), unchanged triangle count, two fewer draws each, one shared skeleton. Worst mean RGB difference below 0.002 on the 0–255 scale; at most one pixel per image differs by more than 3. Image: `shots/student_batch_poses.jpg`.
- `tools/check-student-lifecycle.js`: three real match cycles, local cloth, ragdoll death/respawn, merged geometry disposed exactly once, shared bone texture released; no page errors. Fixture disables respawn invulnerability blinking before checking visibility.
- `tools/check-water-particle-lod.js`: small/far particles use 224 triangles; near views use all 3,968 and compare pixel-identically. A representative far sample changes four pixels by more than 3 (mean RGB error 0.000116); mixed high/low sizes conserve particle count; expiry and clear empty both buffers. No shader/page errors. Image: `shots/water_particle_lod.jpg`.
- Previous `tools/check-warm-materials.js` still passes on real Aqua Cage/Dust Burst after batching (no first-use outline programs, no page errors).
- Studio contact sheets rendered on bright `test` and dark `castle` maps with no page errors: `shots/opt_water_bright.jpg`, `shots/opt_water_dark.jpg`.

Commands for the browser integration checks:

```powershell
node tools/headless.js --game --url "index.html?nosw&debug" --js tools/check-student-batching.js --timeout 180 --quiet
node tools/headless.js --game --url "index.html?nosw&debug" --js tools/check-student-lifecycle.js --timeout 180 --quiet
node tools/headless.js --game --url "index.html?nosw&debug" --js tools/check-water-particle-lod.js --timeout 120 --quiet
node tools/headless.js --game --js tools/bench-render-audit.js --timeout 240 --quiet
```

## Limits

Draw/triangle reductions are directly measured, not a promised FPS percentage. Headless timings vary with GPU synchronization and other sessions. General draw-call consolidation, remaining shader variants, particle CPU work and real multiplayer testing remain open. `shots/` logs/images are local and untracked.

## Final full-room audit

`shots/render-audit-final.log`: 12 players, 240 frames, runtime/page errors = 0; all students have one Skeleton and local cloth is active. Across all timed frames, the exact same emitted water particles would cost 166239360 total triangles at full detail and cost 122243616 with automatic LOD (26.47% fewer for this particle workload). Peak small-mesh instances = 320. This is accumulated submitted geometry work, not distinct triangles or a whole-frame/FPS saving. Large particles at the final sampled frame still use their original detail.

Synchronized headless frame-work median 83 ms, p95 150.3 ms; still over the 33.4 ms budget. No display-FPS claim or controlled timing comparison with earlier runs. Remaining new programs: 1 |depth,highp,srgb-linear,false,,false,false,false,false,false, 123 valley_palette|physical,STANDARD,,highp,srgb-linear,false,,uv,false,false,f.
