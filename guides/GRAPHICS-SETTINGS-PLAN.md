# Graphics Settings — plan (2026-11-24, draft for the user to decide)

Goal: a real Graphics page in Settings (presets + advanced options) that fits the preload standard
(`guides/PRELOAD-STANDARD.md`): no shader compiled mid-match because a player changed a setting.

## 1. What exists now

One dropdown `#setGfx` (js/40-train-settings) → `QUAL.mode` = `auto` | `high` | `low` (saved `wd_gfx`), applied by
`applyQuality()` (js/27-world). `auto` steps down by itself (`qualTick`): `QUAL.lvl` 0–2 (GPU work), `QUAL.scale`
(resolution), `QUAL.cs` 0–2 (CPU savers). About 15 files read `QUAL.mode` / `QUAL.lvl` directly:

| Group | Feature | Where | high | auto (lvl 0 → 2) | low |
|---|---|---|---|---|---|
| Display | resolution (pixel ratio) | js/27 `qualPR` | ≤1.5 × dpr | 1 × scale (→0.45) | 0.7 |
| Lighting | shadows on/off (shader change!) | js/27 | on | on | off |
| | shadow map size | js/28-maps-build | 4096 | 2048 | 2048 |
| | shadow update interval | js/37 | 1–2 frames | 2 → 4 | (off) |
| | soft shadows (PCSS) | js/27 `shadowSoft` | on | off | off |
| | ambient occlusion + light rays | js/27, js/74 | on | on → off | off |
| Post | bloom | js/27 | on | off from lvl 1 | off |
| | colour grade | js/27 | on | on | off |
| | AA pass / TAA | js/27 | AA + TAA | AA → off at lvl 2 | off |
| | painterly filter (Kuwahara) | js/77 | full | fast → off at lvl 1 | off |
| | soft particles | js/27 | on | off at lvl 2 | off |
| World | grass density / ground pattern | js/50 | high | auto → off at lvl 2 | off |
| | surface materials | js/76 | on | off at lvl 2 | off |
| | ambient life (birds, leaves …) | js/75 | full | 0.6 → 0 | off |
| | backdrop / coast / hall detail | js/67, js/28-fcs-hall | full | full | light |
| | small far objects hidden (CPU) | js/27 `cullTick` | off | cs 1–2 | on |
| Effects | particle amount / cap | js/19 `vfxQual` | 1 × (8000) | 0.7–1 | 0.35 |
| | battlefield debris (count, shadows) | js/44 | high | mid | low, no shadow |
| | screen flash / radial | js/44 | on | on | off |

Problems: one switch for everything; players can't keep sharp resolution but drop grass, etc.;
`auto` is the only middle step; several switches (shadows on/off, Kuwahara full/fast, TAA) change shader programs → a hitch
if changed mid-match.

## 2. Proposal

**Presets:** `Auto` (default, as now) · `Low` · `Medium` · `High` · `Ultra` · `Custom` (any advanced change).
Medium = today's auto at lvl 0 without auto stepping. Ultra = High + 1.5× resolution cap + 4096 shadows everywhere
+ shadow every frame (strong PCs).

**Advanced options (Custom):**
- Display: Resolution scale (50–100 %, + "Native" up to 150 % on Ultra) · FPS limit (30 / 60 / 120 / unlimited) · Show FPS.
- Lighting: Shadows (Off / Low / High) · Soft shadows (on/off) · Ambient occlusion + light rays (on/off).
- Post: Bloom · Anti-aliasing (Off / Fast / TAA) · Painterly filter (Off / Fast / Full) · Colour grade.
- World: Grass (Off / Low / High) · Ground detail · Ambient life (Off / Low / Full) · Far detail (draw distance for small props).
- Effects: Particle amount (Low / Medium / High) · Battlefield debris (Low / High) · Screen flash (on/off, also an
  accessibility option).

**Architecture (one place for every switch):**
- New `GQ` table (js/27): one value per option, e.g. `GQ.shadow='high'`, `GQ.grass=1`, saved as one JSON in `wd_gfx2`
  (old `wd_gfx` migrates to a preset).
- Presets = fixed `GQ` tables. `auto` = Medium table + the existing `qualTick` steps, which now lower `GQ` values in a fixed
  order (bloom → resolution → shadows interval/AO → …) instead of checking `QUAL.mode` everywhere.
- The ~15 files read `gq('grass')` etc. instead of `QUAL.mode==='high'` (one helper, `QUAL.mode` kept for old code during
  the move).
- `applyQuality()` stays the single "apply" function.

**Preload rule (no mid-match compile):**
- Options that only change uniforms / counts / resolution (bloom, AO strength, grass, particles, resolution, FPS limit)
  apply at once, even mid-match.
- Options that change shader programs (shadows Off↔On, Kuwahara Off/Fast/Full, TAA, surface materials) are marked
  "applies at the next loading screen". The entry preload compiles only the chosen variant. In the lobby/menu they can
  apply at once with a short "compiling…" wait.
- The shader gate gets one more config per preset (Low / High at least) so every preset stays at 0 mid-match shaders.

**UI:** a "Graphics" tab in the existing Settings panel (game style, not the Tool style): preset buttons at the top,
advanced groups below (folded), a small live FPS / frame ms readout, and a tag on options that apply at the next load.

## 3. Work order

1. `GQ` table + presets + migration; `applyQuality` reads it; no visual change for current modes (check: screenshots
   high/auto/low before = after).
2. Move the ~15 files from `QUAL.mode` to `gq()`.
3. Settings tab UI (presets + advanced + "applies at next load" tags).
4. Auto mode steps through `GQ`; FPS limit.
5. Ultra preset + gate configs per preset + 6v6 bench per preset (numbers in this file).

## 4. Decisions for the user

1. Presets: Low / Medium / High / Ultra + Auto — OK, or fewer?
2. Which advanced options to show players (all of section 2, or a short list)?
3. FPS limit options (30 / 60 / 120 / unlimited)?
4. Default for new players: Auto (as now) or Medium?
5. Shader-changing options mid-match: "applies at next load" (no hitch, recommended) or apply at once with a hitch?
