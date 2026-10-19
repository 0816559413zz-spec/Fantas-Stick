# Prompt — Storm VFX round (2026-10-19)

Work on the ⚡ Storm path in Fantas Stick.

**Read first:** `CLAUDE.md`, `HANDOFF.md`, `VFX.md`, `notes/vfx-notes.md` (Storm lines), `designs/storm.md`. Find code with `CODEMAP.md` (Storm host logic is in `js/08-storm.js`; visuals are mostly in `js/20-vfx-pyro-storm.js`, `js/25-efx.js` and the recipes in `js/44-vfx-kit.js`). Don't read whole files.

**Rules:**
- Visuals only, except the claw numbers in task 3 (the user's own numbers).
- Respect the VFX budget (`vfxOnce`, `vfxExtra`, no new material or geometry per frame). No white-outs.
- Earlier user decision (2026-10-19): the ult claws are dark with constant lightning and must not glow too much. Only the enhanced claw in task 4 should be brighter.

## Tasks

1. **Railgun → like Zero's "Cero" in Bleach.** Mechanics stay the same.
   - **Warning stage:**
     - The yellow guide that shoots out before the damage must sit at the **same height as the real shot**, not on the ground.
     - Lightning particles spiral/run around it.
   - **Real shot:**
     - Fires along the same line and is a bit bigger than the warning.
     - Lightning arcs and particles run around the beam.
     - Strong impact.

2. **Lightning orbs.** When a Dash hit launches an orb:
   - The player must clearly see the orb **fly into the target**.
   - The orb makes a small explosion on hit: flash, sparks and a small shockwave.

3. **Ult claw combo — rework animation + VFX + numbers**
   - **Animation:** on every slash the body twists with the swing — torso, both arms and the legs follow it.
   - **Hits 1 and 2:** slashes on alternating sides.
   - **Hit 3:** raise **both arms**, then slash down crossing, forming an **X**.
   - **Slash VFX:**
     - follow the real claw motion, but reach further out than the claw itself so the range is readable;
     - look **sharp — not thick, not too thin, clearly visible**.
   - **Numbers (user's):**
     - damage **15 / 15 / 35** (was 15 / 15 / 25);
     - range: hits 1–2 stay **200**, hit 3 = **240**;
     - hit 3 still applies Shock.

4. **Enhanced claw after a Dash hit in ult form**
   - **Direction:** the next basic attack is a **horizontal slash to the left or right (random)**.
   - **Look:** more lightning on the claw slash than a normal hit, with **brighter colours**.
   - **Reach:** the VFX reaches further than the normal hits, because its range is 280 (current value).
   - **Rules:** applies Shock; damage unchanged (25).

## Done when
- Tested in the training room (P menu: no cooldown, ult always full).
- Before/after screenshots for each task. No console errors.
- New damage and range checked on a dummy.
- `node tools/check.js` OK, `node tools/codemap.js` run.
- The user's requests are recorded:
  - `designs/storm.md` — a new section dated today, including the new claw numbers;
  - `notes/vfx-notes.md`.
- `HANDOFF.md` and `notes/CHANGELOG.md` updated. Bump `PREFIX` if the snapshot changes.
- Committed and pushed. Report to the user in Thai, simply.
