# Evidence: Story 001 — ระบบต่อสู้หลัก

**Date:** 2026-10-31
**Method:** code check by `gameplay-programmer` (no code changed) + run in the browser pane (FFA, map meadow, 1 bot)
**Screenshot:** `story-001-core-combat/ffa-shield.jpg` — player with the fire shield up in an FFA match (shield raised via `WD.INPUT.sh`, host `shieldT` set)
**Stamp:** `story-001-core-combat/stamp.txt`

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | LMB bolt lands on crosshair point | PASS (code) | `aimFromCrosshair` js/31-camera.js:53-84 → `INPUT.ax/ay/ah`; `shoot` js/12-buildings.js:302 |
| 2 | RMB shield blocks frontal damage | PASS (code + screenshot) | js/17-input.js:62, js/11-host.js:293-296, `shieldFaces` js/03-spells-core.js:146 |
| 3 | Parry 0.28 s, distinct effect/sound | PASS (code) | js/12-buildings.js:470 `k:'parry'`; sound js/18-audio.js:78; fx js/26-fx-events.js:60-67 |
| 4 | Dodge moves faster briefly | PASS mechanic, **key differs** | js/11-host.js:362-365 (dash 0.18 s, 900 u/s). Default key is **Left Shift**, not Space (Space = jump) — open question |
| 5 | Mouse camera, WASD camera-relative | PASS (code) | js/17-input.js:54-56, js/37-render-loop.js:47-49 |
| 6 | Ground aim + vertical auto-lock | PASS (code) | `aimFromCrosshair` L75; `shoot` L293-301 (0.3 rad, 1300 u) |
| 7 | Combat resolved on host | PASS (code) | `hostTick` js/11-host.js, projectile loop js/12-buildings.js:455-494 |

**Deferred:** the feel (timing, weight) of shooting/parry/dodge needs a real playtest (`/team-qa`).

**Sign-off:** pending — user
