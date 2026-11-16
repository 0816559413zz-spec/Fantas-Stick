# Brief: Radiant Sovereign god model (Light class ult)

> **PAUSED 2026-11-16** by the user after 9 rounds. The next attempt should start from a new idea or a new pipeline (e.g. an AI 3D generator from the ref, or a real artist), not from more primitive-built variants.

Hand-off for a new session that will help the user think through the god form. Last updated 2026-11-16.
The user is Thai and doesn't code. Reply in **Thai**, keep it short, and **show pictures** for every idea. Use **AskUserQuestion with options**, because the user often says "I don't know".

## 1. Where this model is used
- The class is **Radiance** (Light). The full design is in `designs/light.md`.
- The ult is **Radiant Sovereign**. It only works while you are linked to a duo partner, and lasts 8 s.
  - Cast: point the wand up, crystals spin fast with a neon glow, a circle of light appears on the ground, then the caster "cuts" into a **god of light floating above the linked duo's head**.
  - God: the lower body fades out, so you see from the middle of the body upward.
  - The duo gets a 100 HP shield, 30% less damage taken, and 3 crystals spinning slowly around them.
  - God BA: hold left click to fire a beam from one arm for 1.5 s, stop for 0.8 s, then switch arms (12 dmg / 0.3 s, range 800).
  - Finisher: a big beam from the chest crystal to the aim point, exploding for 80 damage in radius 250. Using it ends the god form at once.
  - On end: you return to where you cast it, so the ground needs a marker.

## 2. Look the user has already asked for
- References:
  - `designs/light_ref/ult_god_ref.webp`: golden god, eclipse ring behind, crystal arm/wings.
  - `designs/light_ref/ult_god_ref2.webp` (main ref): white-blue glowing body with stars inside, chest orb, gold wings, halo rings.
- Body:
  - Only the upper half is visible; it fades out from the lower middle of the body.
  - No legs, no cape.
  - Whole body glows; star sparkles inside are a good idea.
  - Hands glow brighter, like gloves of light.
- Face: no eyes, no star on the forehead.
- Chest: **crystal in the middle**, and **glowing lines crossing in an X** across the chest that continue to the back.
- Upper back: a **small** circle of light line behind and above the head, with **big crystals spinning along the line**. During the finisher the circle spins in toward the chest crystal.
- Wings:
  - Gold light wings in **3 directions**: upper left, upper right, lower left. No lower right (in the ref it is purple).
  - Not symmetrical, on purpose.
  - Must look like the ref: long, separate light blades. **Not plain spikes, and made as VFX, not code shapes.**
- Crown:
  - A floating **sun-spike crown** with crystal spikes of different lengths, the middle one longest.
  - The base is **not a full circle; one side is broken**, with fragments floating.
  - Must look "cool", not a plain circle with crystals.

## 3. What was tried, and what the user said
| Round | What it was | User feedback |
|---|---|---|
| 1 | Borrowed the player model (`char_student`) with a glowing material, plus a ring, crown and wings made of code shapes | Has legs and a cape (unwanted), far too bright, can't see detail |
| 2 | New body from code shapes (tube/lathe), wing and crown as python-drawn images on cards | "Feels weak, too normal a shape", wings "just come out of the back", crown still plain spikes |
| 3 | Blocky body like Earth's Stand (`js/47-earth-view.js` makeStand) | Wants **almost-Roblox blocks** (1–2 pieces per part), head not a block, only the upper half visible |
| 4 | Roblox-style: 1 torso block, 2 pieces per arm, egg head, stepped fade | **"Why so fat"**, and "out of ideas" |
| 5 | Blender model with a script: slim god, gold pauldrons, chest socket, egg head | "Bad, don't know what the form should be" |
| 6 | 3 variants: A smooth/rounded, B gold armor, C floating crystal body | **C looks ok. A is ok but too weak, and the head is weak.** "Don't stick to these forms too much" |
| 7 | D "powerful crystal god": inverted triangle, crystal pauldron clusters, head with a centre spike and side flares, glowing hands (`shots/light_god_pv_D.png`) | **Likes the style** but "don't stick too much, keep designing new" |
| 8 | E "Sun Herald" (crystal sun-ray halo behind the shoulders, gold mask, crystal-shard skirt as the fading lower body, floating bracers) + F "Prism Titan" (big inverted prism chest, floating prism pauldrons, bulky arms, diamond head with a gold halo) — `assets/src/light_god_ef_build.py -- E|F`, side by side in `shots/light_god_DEF.png` | "NONO don't keep these styles, try new style, I only like it a bit" |
| 9 | 3 completely new styles (`assets/src/light_god_styles_build.py -- S1|S2|S3`, `shots/light_god_styles.png`): S1 smooth slim light body (Skin modifier) with gold blade wings like ref • S2 robed seraph (long flowing robe, hood, sun halo) • S3 abstract ring angel (nested gold rings, light core, blade wings, not humanoid) | "These look bad, stop for now, too many tokens" — **paused 2026-11-16** |

What we learned:
- The user wants it to look **powerful** with a **strong silhouette**. "Weak" and "normal" are the most common complaints.
- Head: a plain egg is too weak.
- Not too fat, but not too thin either.
- The crystal theme fits the class.

## 4. Pictures to look at
- Ref: `designs/light_ref/ult_god_ref.webp`, `designs/light_ref/ult_god_ref2.webp`
- Variants A/B/C side by side: `shots/light_god_variants.png`
- D (latest): `shots/light_god_pv_D.png`
- The first Blender model: `shots/light_god_pv.png`

## 5. Files and how to work on them
- **Blender**: `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`. Run it in the background yourself; the user doesn't need to open it.
  - Build scripts:
    - `assets/src/light_god_build.py` (round 5; `-- A` or `-- B` makes a variant)
    - `assets/src/light_god_crystal_build.py` (C)
    - `assets/src/light_god_d_build.py` (D)
  - Shared helpers: `assets/src/_kit.py` (`mat`, `export`, `save_blend`)
  - Run: `blender -b --factory-startup --python assets/src/light_god_d_build.py`, which writes `assets/models/light_god_D.glb` and `.blend`.
  - Preview image (4 views): `blender -b assets/src/light_god_D.blend --python assets/src/_preview.py -- '{"out":"shots/x.png","cell":[420,560],"cols":4,"h":3.0,"cy":0.4,"shots":[{"view":"front"},{"view":"q"},{"view":"side"},{"view":"back"}]}'`
- **VFX in the game** (VFX Studio):
  - Draft of everything: `assets/fx/light/sovereign_draft.fx.json`
  - Body only: `assets/fx/light/sovereign_body.fx.json`
  - Python-drawn images: `assets/fx/tex/light_wing.png` (blade wing; the user said it looks like the ref but the placement made it look like it sticks out of the back) and `assets/fx/tex/light_crown.png` (broken-side crown)
  - Code-shape models: `assets/fx/mesh/light_*.mesh.json`
  - The `.glb` from Blender is **not yet** in `assets/manifest.json` / the game.
- Taking a picture in the game: `shots/_sov.js` (`node tools/headless.js --game --js shots/_sov.js`). The training map is bright and washes the model out, so check the shape in Blender first.

## 6. Questions for the user (ask one at a time, with pictures)
1. Is D good now, or should it be stronger or bigger?
2. Head: centre spike + side flares like D, an ornate crystal mask, or something else?
3. Body material: crystal facets (C/D) or smooth glowing (A) with crystal parts?
4. Overall size above the duo: how many times bigger than a normal character?
5. Wings: long separate blades like the ref, coming out from behind the shoulders. Do we model them in Blender, or as VFX images?
6. Have them pick a mood from refs: Destiny Traveler / Overwatch Mercy / Zenyatta / Diablo Tyrael / Genshin Dottore? Gather 3–4 pictures and let them choose before building more.

Every build in this round is local only and **not committed**. Rule: no VFX commit before the user approves it.
