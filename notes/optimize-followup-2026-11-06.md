# Optimize follow-up — 2026-11-06

Scope: complete part of the remaining optimization work without changing approved effect appearance, gameplay or the pending Moonwater edits.

- Countdown preparation now includes code-created heat-haze materials (in fxScene), fire surfaces (plain/displaced ball + sheet), both rigid/skinned variants of Earth and Water outlines, and the water tether.
- Outline warm-up uses a tiny independent one-bone proxy, not a full player or a borrowed live skeleton. Resources remain in the existing detached warm-up holds; no added per-frame scene objects after warm-up.
- Added `fx.zv` and `fx.particles` profiler timers; retained `fx.parts` for previous consumers. Timers nest: do not sum parent and child measurements.
- Bot benchmark no longer sleeps through the countdown before drawing; it starts rendering immediately, then yields while async asset preparation/compilation completes before timing the fight. Earlier synchronous-countdown results could include loading and are not valid controlled FPS comparisons against this version.

## Evidence

`node tools/headless.js --game --js tools/check-warm-materials.js --timeout 180 --quiet`

Uses a real three-player FFA countdown (Pyro/Earth/Water), then the actual Aqua Cage event and Dust Burst snapshot path on real character models. Both outline programs are reused (new programs = 0), page errors = 0. The same regression passes with `?nosw&debug` (shader error checks enabled), and asserts successful shader program linking.

Negative control: add `--url "index.html?nosw&coldWarm=1"`. The diagnostic disables just the new registrations before the countdown. Both actual skills produce one new outline program each and fail with `FIRST_USE_COMPILES`, proving the regression catches the original missing preparation.

Local logs: `shots/warm-real-skills-cold-2026-11-06.log`, `shots/warm-real-skills-2026-11-06.log` (shots are not tracked).

The separate initial proxy diagnostic also exercised heat haze, fire surfaces, both outline variants and tether through the real warmStep compile/upload path: zero new programs on recreation, no page errors. The committed regression instead uses actual skills to avoid relying only on proxy behavior.

## Still open

- Steady low FPS in a full-room brawl: player mesh/material draw calls and high-poly effect particles still need measured work.
- Other material/source variants can still compile mid-fight. This patch does not claim to warm every possible shader or solve the overall FPS problem.
- No percentage FPS gain is claimed from this change. Headless GPU synchronization and asynchronous assets make uncontrolled timing comparisons unreliable.

## Full-room stress after harness correction

12 players, 360 frames in valley: median 56.6 ms, p95 77.3 ms, 273 late frames over 50 ms, 4 frames with new programs, no runtime errors. This still fails `PERF_FRAME_BUDGET`. These are synchronized headless frame-work timings, not display FPS; do not compare to the earlier run that skipped preparation. Average measured sections: gpuSubmit 8.16 ms, GPU readback wait 41.33 ms, fx.particles 2.4 ms, fx.zv 1.71 ms. Log: `shots/perf-optimize-after-2026-11-06.log`.
