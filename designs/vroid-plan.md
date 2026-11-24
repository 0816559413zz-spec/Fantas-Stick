# VRoid player models — plan (started 2026-11-24)

User picked VRoid (over finishing the blocky Blender female) after showing anime MMO references
(gray-blue creator screen with twin tails, blue-haired male mage). Goal: anime-style male + female
player models made in **VRoid Studio** (free, pixiv; installed via `winget pixivInc.VRoidStudio`),
loaded with **@pixiv/three-vrm 2.1.0** (peer three ^0.160 = ours).

Parked: blocky female body in Blender (`git stash list` → "blocky female body via Blender gbody_0/1").
Live game still has the code-made female (skirt + lashes + blush, `lookGender` js/22) until VRM lands.

## Steps
1. **User makes 2 characters in VRoid Studio** (male, female; start from a sample avatar is fine),
   school-uniform-ish clothes; export **VRM 1.0** → `assets/vrm/male.vrm`, `assets/vrm/female.vrm`.
   Export settings: reduce polygons (target ≤ 30k triangles), texture atlas 2048 or less, materials ≤ 8.
2. **Check in `tools/vrm-test.html`** (`?vrm=assets/vrm/female.vrm`): weight (green/yellow/red),
   our clips retargeted (idle/walk/run/fly/cast/hit/down), spring-bone hair, expressions.
3. **Creator stage + menu hub** use VRM (low risk, no gameplay): replace `char_student` in
   `stageChar` (js/32) / `hubMakeChar` (js/61) / thumbnails `crtShot` (js/39).
   Customisation = VRM swaps for hair colour (material colour), eye colour, cloak overlay (our cloak mesh
   on VRM bones), wand in right hand.
4. **In-game players** (big): `useFileModel` js/22 + `rigBind`/`rigSync` (code arms ↔ bones, names
   differ: map `upper_arm_R` → `rightUpperArm` …), skill poses (`CANIM`/`SKANIM` js/35, `readyStance`,
   class poses js/47/68/72), cloak cloth js/49 (pin to VRM chest/shoulders), ragdoll js/48, batching
   (`mergeStudent` — VRM MToon materials won't merge; LOD: far players use a low-poly VRM or the old model).
5. Perf pass with 10 players (bench), then remove the old model path.

## Retarget notes (tools/vrm-test.html `retarget`)
- Our rig rest = arms hanging down, VRM normalized rest = T-pose. World-space delta per key:
  `q' = parentRestWorld · q · restWorld⁻¹`; upper arm `q'·OFF`, forearm/hand `OFF⁻¹·q'·OFF`,
  OFF = ±90° about Z (L −, R +). VRM 0.x: negate x,z.
- Hips position not retargeted yet (clips are in place).

## Licence
VRoid Studio exports (incl. edited samples) may be used in games; set the VRM meta licence when exporting.
The repo is public — don't commit models bought from Booth etc. unless their licence allows redistribution.
