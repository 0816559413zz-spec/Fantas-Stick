# Prompt — Pyro VFX round (2026-10-19)

Work on the 🔥 Pyro path visuals in Fantas Stick.

**Read first:** `CLAUDE.md`, `HANDOFF.md`, `VFX.md`, `notes/vfx-notes.md` (Pyro lines), `designs/pyro.md`. Find code with `CODEMAP.md` (Pyro visuals live mostly in `js/33-pyro-view.js`, `js/42-fire-vfx.js`, `js/25-efx.js`, `js/20-vfx-pyro-storm.js`, recipes in `js/44-vfx-kit.js`). Don't read whole files.

**Rules:** visuals only, except the one gameplay change in task 2 (the user's own number). Respect the VFX budget (`vfxOnce`, `vfxExtra`, no new material/geometry per frame). No white-outs.

**Earlier rejections — don't bring these back:**
- flame spray up the arm on the shield;
- orbiting "guard orbs".

## Tasks

1. **Charged basic attack — full charge**
   - The fire rising from under the feet is too much and lasts too long.
   - Make it a **short burst only at the moment the charge becomes full** (~0.3–0.5 s), then it's gone.
   - After that, only the fireball at the wand tip shows that the charge is full.

2. **Ring of Embers — new cast sequence + better ring**
   - **Cast sequence:**
     - After the player confirms the spot, a fireball/meteor falls from above onto the spot quickly (~0.3 s) and explodes a little on impact.
     - Then the ring appears.
   - **Inside the ring:**
     - ground-break cracks;
     - burnt ground with glowing lava cracks;
     - a fire magic rune circle on the floor.
   - **The wall:** make the fire thicker and denser (it is "almost good" already).
   - **Gameplay change (user's number):** the meteor impact deals **10 damage once** to enemies inside the ring radius when it lands.
     - The trap starts when the meteor lands, so it starts slightly later — tell the user.
     - Bump `PREFIX` if the snapshot or network protocol changes.

3. **Dragonfall impact**
   - Make the slam more powerful:
     - more ground breaking (bigger crack web, chunks of debris flying);
     - more and taller fire bursting up from the ground.

4. **Fire shield**
   - This is the round shield shown while holding right-click — **not** the small stored fire orbs beside the player.
   - Add flames that keep flowing **upward all around the circle/sphere of the shield** (fire licking up its outline).
   - Keep the centre clear so the player stays visible.

5. **Ignition Snap**
   - Every snapped enemy gets a clear fire explosion on their body, bigger with more Burning stacks.

6. **Blazeform**
   - **Body:** more fire on the body, with strong flames on the feet.
   - **Signature look:** a **flaming halo ring behind the head/back**, with flames flickering around the ring.
   - **Aura:** flames circling around the player along the aura edge, so the aura's range (radius) is clearly visible.
   - Overall it should look much better.

## Done when
- Tested in the training room (P menu: no cooldown, ult always full) on a bright map and a dark map. Before/after screenshots for each task. No console errors.
- `node tools/check.js` OK, `node tools/codemap.js` run.
- The user's requests are recorded in `designs/pyro.md` (new section dated today, including the 10-damage meteor) and `notes/vfx-notes.md`. `HANDOFF.md` and `notes/CHANGELOG.md` updated.
- Committed and pushed. Report to the user in Thai, simply.
