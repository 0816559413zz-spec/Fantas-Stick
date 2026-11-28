# Darkness + Storm rework: where it stands, what is next (2026-11-28)

Hand-off for the next chat. Reply in Thai, short. Discuss before building; still → GIF → approval → commit.

## Done and pushed (user approved)
- **Darkness** (`studio/darkness-rework.js` = VFX Studio previews + the live views; host `js/09-darkness.js`):
  - Death Sentence: 0.35 s two-hand charge, slender horizontal crescent (speed 1600, width ±70), miss = half cooldown; Flow fires 3 of the same waves.
  - Nightfall without a mark: 1.5 m step, lift everyone within 60 px ~4 m, 1 s stun, shadow tower (`DARK_LIFT`).
  - Nightfall marked: orb pass-through slash (10) → reappear 3.4 m above the far side → overhead slam (25), 1.1 s (`DARK_NF`, `darkNFRoute`). Flow: one pass slash (20), new look.
  - Previews: `darkness/rework_mark|lift|marked|flow`.
- **Storm** (`js/20-vfx-pyro-storm.js` bottom "Storm round 2", `js/08-storm.js`, `js/09-other-paths.js`, `js/72-dash-pose.js`):
  - Beam: hand on the aim line (`STBEAM`, armR.z −.47 measured).
  - Thunderbomb: 0.7 s charge, camera pull-back (`CAM_FRAMES.stormBomb`), branches out of the body, fresnel dome flash.
  - Storm Dome: 0.6 s charge (`SDOME.v.aim`, `p.sdW`), muzzle blast, dome 4.5 s, opens where the ball stops (wall / air too — user: no falling).
  - Lightning Mark: bigger chest glyph beside Burning numbers, lightning ring 100 px round the holder, clearer burst.
  - Dash: pose by travel direction (`zapMix`: `zapF/zapB/zapS`), God Lightning `bolt/boltB`.
  - Previews: `stance/storm_check`, `storm_dome_check`, `storm_dome_air`, `storm_dash_check`.
- **Nature**: free left hand drifts / swings / lags turns (js/35 readyStance).
- **Map Builder**: Ctrl+C / X / V (`copySel` / `pasteClip`).

## Open (next chat)
1. **User asked: re-check all Darkness and Storm animations after the last pull** (close `--cam front` + `side` sheets of every move) and fix anything weird/jittery. Started: Darkness BA checked (item 2, broken). Darkness skills and all Storm moves not re-checked yet.
2. **Darkness basic attack (scythe BA) — checked 2026-11-28, looks broken, not fixed yet:**
   - Real match (headless, `HL.cam('q34')`, holding fire): both arms stick out sideways like a T while attacking, and the scythe is not visible in the frames (`shots/dk_ba_live.jpg`), although `o.darkWeapon.visible` is true and arm rotations change (armR ≈ [-1.21,.49,-.7], armL ≈ [-1.77,0,.49] after a swing).
   - VFX Studio (`stance/darkness_ba_check`, acts `fire`): after the first swing the scythe disappears and the body plays a wand-shot pose with a light ball. The same happens on the old commit 13e1805d, so it is NOT from the Darkness rework.
   - More (2026-11-28): the BA scythe sweeps out to ~6 m from the caster (its range is 175 px) and loops round, so in a close camera it leaves the screen; with fire held it keeps circling far away. Probe: `o.darkWeapon` world position .2 s → 1.5 m, .45 s → 5.7 m, 1.0 s → 5.3 m. Ask the user what "arm spin" means (send `shots/dk_ba_wide_s.gif`).
   - Round 2 (approved + pushed 2026-11-28): BA = no forward lean, twist only (spine + hips), both hands fling out wider (`studio/darkness-scythe.js` liveHandPose); Nightfall lift dashes 8 m (`DARK_LIFT.step` 160, stepT .14) with a thick shadow trail, speed streaks and ink kick-up, then lifts within 60 where it lands (stun 0.6 s, was 1); marked Nightfall hides the body with layers in live too until the overhead slash. GIFs `shots/dk_ba_pose_s.gif`, `nightfall_lift_s.gif`, `nightfall_marked_s.gif`.
   - Next: look at the live BA pose code in `js/68-darkness-view.js` (`ST_DARK_LIVE_BA`, `darkBAPose`, `liveHandPose`) in a real browser (the browser pane) before trusting headless; then fix the arm pose (user: "arm spin") and confirm the scythe swing shows.
2b. **Full skill sweep 2026-11-28** (`stance/darkness_all`, `stance/storm_all`, sheets `shots/dk_all_sheet.jpg`, `shots/st_all_sheet.jpg`):
   - Fixed: God Lightning claw attacks were laid flat by the new `bolt` dash pose (js/72: skip bolt while `o.clSw`).
   - Thunder Line: thinner low-glow bolts + smaller flash (done 2026-11-28). From the side camera the line runs away from the camera, so it still looks like a bright column near the caster.
   - Night Waltz border B: huge pale grey sheets fill the screen from a close camera — check in a real match.
   - God Lightning dash echo leaves black branching cracks on the floor (other session's prototype) — looks like dark "tree" decals; ask the user.
   - Studio limits: `class-stance` keeps the foe at me.x+400 every tick, so marked Nightfall / Storm Dome on the foe can't be judged there; use a real match (HL) for those.
3. Death Sentence charge: hands brought closer (gap ~0.38 m, left hand straighter/lower; keys in `CANIM.dk_sentence`). Measured with `gap.js` style probe (hand_R/hand_L world positions).
4. Storm dash: check direction changes mid-dash and the side-dash roll sign.
5. Thunderbomb camera pull-back only exists in the real game camera — verify in a match.
6. Storm Dome: damage no longer goes through walls (`natureTrace` in the dome tick, done 2026-11-28). Still open: the ball ignores Earth Rampart walls (`aimRay3` checks ground, panels, city only).
7. Lightning Mark: no "who am I aiming at" highlight while choosing an ally.
8. Walking slower while charging Death Sentence: asked, not built.
9. Nothing tested online with several players.
10. **Stashed local edit**: `git stash` "local fcs-file edits before pull 2026-11-28" (maps/build/fcs-file.json objs differ from the remote v70). Ask the user: drop it or restore it. A copy is also in the old chat's scratchpad.

## Fast workflow (read first)
- Shots: `python tools/fxsheet.py <fx> --times a,b,c [--cam side|front|top] [--dist N] [--at self|front] [--map id] [--to T]` → `shots/<name>_sheet.jpg` (Read it) + `_s.gif` (send that one; big GIFs do not play in chat). Details: `VFX-STUDIO-CLAUDE.md` §6 "Fast loop".
- Skill previews with the real player: `studio/class-stance.js` acts (`skill`, `ult`, `dash`, `move`, `hold`, `shield`, `set`, `aimh`) or a preview module like `studio/darkness-rework.js` (CANIM poses, `camera(c,T)` for a fixed view).
- Match tests: `node tools/headless.js --game --js file.js --timeout 540` (HL.solo takes ~2.5 min; run in the background). `WD.spawnBot(path,0,x,y,null,me.id,1)` = still player dummy.
- Mistake list to check before sending: memory `vfx-mistake-patterns` (white-out from wide glowing bolts / additive rings, camera-facing helpers, shared temp vectors, cloth on teleport, retyped timings, front pose check, measure aim with a probe).
