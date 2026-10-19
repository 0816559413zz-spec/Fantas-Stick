# Prompt — Frost VFX round (2026-10-19)

Work on the ❄️ Frost path visuals in Fantas Stick.

**Read first:** `CLAUDE.md`, `HANDOFF.md`, `VFX.md`, `notes/vfx-notes.md` (Frost lines), `designs/frost.md`. Find code with `CODEMAP.md` (Frost visuals live mostly in `js/34-frost-view.js`, `js/21-vfx-frost.js`, `js/43-frost-vfx.js`, `js/25-efx.js`, recipes in `js/44-vfx-kit.js`). Don't read whole files.

**Rules:** visuals only — don't change damage, heal, slow, ranges or timings. Respect the VFX budget (`vfxOnce`, `vfxExtra`, no new material/geometry per frame). No white-outs.

## Tasks

1. **Melee slash upgrade (sword and axe)**
   - **Sword:** each swing leaves a crisp, narrow ice slash line (bright white edge, cold-blue body). Cold mist trails along the swing path.
   - **Axe:** reads clearly **heavier** than the sword:
     - wider, thicker arc with more ice shards;
     - every slam-down (3rd combo hit and the aerial slam) hits the ground hard: crack web, ice spike crown (`iceBurst`), a low mist wave and a small camera shake on your own hits.

2. **Frostforge activation ("upgrade BA")**
   - **On activation:** ice crystals and cold mist rise up around the player, so it feels like you just powered yourself up.
   - **During the 6 s buff:** a light, continuous version (a few rising crystals and mist wisps) so it's clear the buff is still active.
   - **When the buff ends:** it stops.

3. **Bug: white straight rectangle on the ice sword**
   - The user sees it **all the time**, and it seems to point toward the sun.
   - Likely suspects:
     - the Blender sword model `mesh_ice_sword` (`assets/vfx/ice_sword.glb`, built by `assets/src/frost_meshes_build.py`): a stray face, a glint plane, or a flat face catching sun specular;
     - a trail or slash strip stuck on screen.
   - Find the real cause and fix it. Show before/after screenshots.

4. **Ice is too bright in the sun**
   - **Covers:** every ice object — sword, axe, ice floors (slide path, Permafrost, wave path), Glacier Rend spires, ice spike crowns, Cryo Shell.
   - **Problem:** they reflect the sun too strongly.
   - **Fix:** lower the sun reflection (specular, roughness, metalness, env reflection, emissive). Keep the shapes readable and keep the shadows.
   - **Test on:** bright maps — lake, meadow, Test Place at sunset.

## Done when
- Tested in the training room (P menu: no cooldown, ult always full) on a bright map and a dark map. Before/after screenshots for each task. No console errors.
- `node tools/check.js` OK, `node tools/codemap.js` run.
- The user's requests are recorded in `designs/frost.md` (new section dated today) and `notes/vfx-notes.md`. `HANDOFF.md` and `notes/CHANGELOG.md` updated.
- Committed and pushed. Report to the user in Thai, simply.
