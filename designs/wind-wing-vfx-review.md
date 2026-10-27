# Wind wings — angular silhouette study

User reference: `storyboard/img/wind_wing_angular_ref.png`.

User direction (2026-10-25): redesign the underlying wings before the shield. Angular, straight pointed edges; luminous wind; particles continuously present. The user requested a Studio prototype of the described design. This prototype is awaiting visual review.

- `wind/wing_angular`: standalone looping wing study, 4 s Studio timeline.
- Five separated pointed vanes per side, long upper spear, shorter descending vanes and visible gaps. Span about 7.3 m; visual sizing only.
- Dark blue/teal translucent silhouette, cyan/mint flowing inset, narrow white luminous seams, short internal contrasting cuts. Both wing faces have light seams for the normal rear game camera.
- Slight unequal breathing of the two sides. Continuous angular wind chips, surface motes and outward tip streaks; no camera shake.
- Nine custom model recipes: right/left body, flow, spines and cuts, plus a small angular particle model. Generator: `tools/wind-wing-study.py`; edit it before regenerating.
- Uses the aura starter's looping structure. Does not replace the existing wing or shield skill test, bind gameplay events, implement blocking or change mechanics.

Preview screenshots are staged with a procedural wizard at the effect anchor. The capture shifts the complete wing study forward by 10 m in memory to avoid the castle statue; the saved effect remains centered on its player anchor. Front, three-quarter, rear and bright-map views show the same design.

Storyboard #6; review page `designs/wind-wing-vfx-review.html`.

Visual checks: bright-map capture completed with 0 page errors (white 0.18%, cover 0%). Dark front/quarter/rear frames were inspected (white peak 0.03%, 35 standard particles measured; model chips are additional). The dark capture also reported the existing asynchronous Three.js `isReady` error during shader recycling; screenshots still rendered. No runtime fix was attempted in this visual task. Syntax check OK, fx-check 0 errors / 0 warnings, diff whitespace check passed. The model generator uses explicit mirrored left models because runtime mesh scales clamp negative values.

Previous BA: the user accepted the smaller boomerang / detailed tail and asked to continue; storyboard #4 marked done for the visual design. It remains a Studio candidate without gameplay binding.

## Revision: one visible wing tier per side

User found the stacked wings too large but liked their length. Removed all four lower vanes per side, kept the 3.65 m tip reach per side and narrowed the remaining main vane. Added angular internal channels, short highlights, fine contrasting cuts, and four broken hairline wind traces just beneath the lower edge. Repositioned tip emitters onto the remaining wing and added fine under-edge streaks. Rendering materials still combine color and light on the single silhouette; they do not create additional visible tiers. Previous rear view archived as `storyboard/img/wind_wing_tiered_previous.jpg`. This supersedes the five-vane silhouette above.

Single-tier verification: fx-check 0 errors / 0 warnings, syntax check OK. Dark front/quarter/rear and bright front renders inspected; both completed with 0 page errors after one initial source-fetch boot failure on dark. Dark white peak 0.04%, 44 standard particles; bright white 0.20%. Bright cover metric reported 75.8% despite the staged character remaining clearly visible; this metric uses the real caster and is not reliable for the remote preview stand-in, so no gameplay cover claim is made. Current review image and storyboard #6 updated.

## Revision: shorter translucent neon green + featherlets

User found the single-tier cyan wing too long and opaque. They prefer neon green with a little white, and requested the small overlapping feather-like forms from their reference. Reduced horizontal reach 25% (3.65 to 2.74 m per side; total 5.48 m); vertical reach reduced 15%. Body opacity .20, flowing inset .27, featherlets .32. Replaced cyan/navy with neon/lime greens; white limited to small root/tip highlights. Added six short angular air-featherlets per side whose roots sit on the main vane and tips stagger just below its edge; these are local detail on one wing, not full stacked wing tiers. Mirrored feathers and accents add four mesh recipes (13 total for this study). Previous rear view: `storyboard/img/wind_wing_single_cyan_previous.jpg`.

Neon/featherlet revision checks: syntax OK; fx-check 0 errors / 0 warnings; diff whitespace clean. Dark front/quarter/rear screenshots inspected (white peak 0.025%, 42 standard particles); the known asynchronous Three.js isReady warning appeared during shader recycling. Bright render completed with 0 page errors (white 0.17%, cover 0%). Review montage and storyboard updated. Independent visual review found the shorter translucent green shape and integrated edge featherlets consistent with the requested direction.

## Moving preview

User requested motion. Added `storyboard/img/wind_wing_motion.gif`: 48 frames / 4 s / 12 fps, looping, captured from the existing game renderer at 60 Hz, then encoded with a shared palette by `tools/pack-wind-wing-preview.py`. No effect or motion design was changed. Shows the existing subtle wing breathing, scrolling light and continuous particles. Live Studio tab refreshed to load the new model index; play at 1x and loop verified through visible controls. Render completed with 0 page errors. GIF linked in storyboard #6 and displayed in the review page.

## Actual wingbeat — clarification

User clarified that motion means actual up/down wing beating, not the previous gentle breathing/particles preview. Recentered all wing geometry at the shoulder hinge; body, flowing layers, featherlets and light seams rotate together. Both wings beat in sync: 18 degrees raised to 40 degrees below the neutral pose, 1.6 s per beat, downstroke in 38% of the cycle and slower recovery. Mesh emitters follow world transforms; fixed tip/under-edge sources use sampled matching hinge trajectories. Shape, selected size, palette and opacity retained.

Minimal runtime support: mesh rot in schema now accepts curves; fxMeshTick evaluates it with the same existing YXZ / axis conventions as static rot. No skill mechanics changed. New GIF captures 64 frames at 20 fps (3.2 s, two beats); it supersedes the previous breathing-only GIF.

New output: `storyboard/img/wind_wing_flap.gif`, 64 frames / 3.2 s / 20 fps; up/down stills are `wind_wing_flap_up.png` and `wind_wing_flap_down.png`. Inspected both extremes and intermediate frame. Dark capture retained the known asynchronous Three.js isReady warning during shader recycling; all 64 frames rendered. Live Studio refreshed and reports fx-check passed, playback/loop at 1x. Runtime/generator coordinate and static-rotation compatibility audited independently with no concrete issue found.

Bright-map wingbeat frame inspected; capture completed with 0 page errors, lint empty, white 0.17%, cover 0%. Syntax OK, fx-check 0 errors / 0 warnings, codemap regenerated, diff whitespace clean.

## Gameplay motion policy — latest clarification overrides idle interpretation

Normal wings stay mostly fixed with only subtle movement. The strong up/down flap is an ACTION study, not the normal looping idle. Individual skills use different motion amplitudes; some small, some large. User suggested possible reuse for Gust (lift/charge, burst forward, delayed wind follows). Keep the current study available, but do not bind its continuous flap to normal gameplay or assume every skill uses it. Final poses are discussed per skill. No gameplay binding has been added.
