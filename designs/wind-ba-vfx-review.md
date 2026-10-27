# Wind BA — visual review, 2026-10-25

User requirement: use Tornado Ink / Curse Ink as the shared rendering language (layered masses, contrast, broken edges, motion). Design each skill's own recognizable silhouette. Do not reuse tornado pieces as its shape.

- A: `wind/ba_boomerang` — broad swept boomerang, raised center, pointed ends; body width initially 2.64 m; revised to 1.98 m (25% smaller).
- B: `wind/ba_tiny_blade` — compact asymmetric crescent; body width 0.96 m.
- New mesh recipes for each: closed 3D body, inset flow band, luminous leading edge, tapered airflow wake.
- Both are standalone Studio candidates. No bind or gameplay changes. The boomerang name refers to shape; flight is straight.
- Preview: fast flight, short slipstreams, small wind splinters, then curved fragments disperse at the demonstration endpoint.

Review image: `storyboard/img/wind_ba_compare.jpg`. Top detail views use different zoom. Bottom shots use the same camera and actual size. Interactive links: `designs/wind-ba-vfx-review.html`. Storyboards #4 and #5.

Validation: fx-check passes; bright and dark map renders inspected. Bright capture has no page errors. The fast dark contact-sheet run reported an asynchronous Three.js `isReady` error while recycling shaders, despite producing all frames; do not describe that run as error-free. No game runtime code changed.

Pending: user picks or revises the BA silhouette, then discuss Shield and Dash individually.

## Boomerang direction revision

User asked to turn the boomerang the other way. Mirrored the body/flow/edge meshes along their forward axis and reversed face winding to retain correct surface normals. The airflow wake now starts at the mirrored tip height. Flight direction and timing stay as before. Before/after image: `storyboard/img/wind_ba_boomerang_direction.jpg`; source review: `designs/wind-boomerang-direction.html`. This is a trial orientation awaiting visual feedback. Bright Studio capture: zero page errors, fx-check zero errors.

The direction revision has new bright detail, flight and comparison images. Refreshing its dark timeline failed during application boot because a module fetch failed (STUDIO never initialized). The earlier dark timeline is retained and labeled historical; current orientation is shown in the updated detail/flight images.

## Correct orientation — user clarification

The user meant the boomerang should lie flat, parallel to the ground, with its convex front edge leading into the firing direction and its two tips swept behind. The earlier mouth flip misunderstood the requested axis. Restored the convex-forward mesh geometry, reset flight and slipstream rotations to [0,0,0], and reattached the wake at the flat tip height. Current review: `designs/wind-boomerang-flat.html`, `storyboard/img/wind_ba_boomerang_flat.jpg`. Earlier orientation images are historical.

## Tail particles and hit — requested after flat orientation approval

User accepted the flat boomerang orientation and requested trailing particles plus a hit effect. Added two tip emitters (32 streaks/s each), surface motes (34/s), mesh splinters (22/s), and a short ribbon tail. The hit demo uses a small contact flash, two layered curved pressure sweeps, forward streak burst, curved fragments and a quick fade. No camera shake. New mesh recipe: `wind_ba_hit_ribbons`. Demo duration 1.08 s; flight remains 0.64 s and visual contact remains at the 20 m endpoint. These are Studio visuals; actual gameplay collision bindings have not been added.

New review: `designs/wind-boomerang-tail-hit.html`, `storyboard/img/wind_ba_tail_hit_review.jpg`. Flat orientation approved; tail/hit awaiting review.

Tail/hit verification: fx-check 0 errors/0 warnings; bright render 0 page errors, white peak 0.37%, caster cover 0%. Dark renders inspected; peak 53 particles, one run retained the known asynchronous Three.js isReady warning. Target is a procedural preview character positioned with its front surface at the demo contact point. Screenshots and storyboard #4 updated.

## Smaller blade and richer tail

User requested more tail detail and a smaller boomerang. Reduced the body/flow/edge and slipstreams by 25%; tip emitters follow the smaller tips. Extended the two tapered wakes with different lengths and added five fine curved streamers, including detached branches. Added sparse curved chips and finer surface motes; reduced main trail width and impact mesh/flash size to suit a BA. Flat orientation, straight flight and timing retained. New recipe: `wind_ba_boomerang_wake_detail`. Updated screenshots and storyboard #4 stay Studio-only.

Latest render verification: bright and dark captures each completed with 0 page errors and no lint warnings; measured 55 standard particles at contact, cover 0%, white peak 0.37% bright / 0% dark. One initial dark boot failed to fetch source files; retry succeeded. Detail review: `designs/wind-boomerang-tail-detail.html` / `storyboard/img/wind_ba_tail_detail_review.jpg`; close view is a labeled crop, lower panel shows the original camera framing. Syntax check OK; fx-check 0 errors/0 warnings.
