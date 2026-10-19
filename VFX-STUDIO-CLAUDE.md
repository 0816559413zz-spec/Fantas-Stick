# VFX Studio — manual for Claude (any session, any device)

> Read this before doing **any** VFX work in Fantas Stick. Also read `CLAUDE.md` and `HANDOFF.md` §0.
> Full field reference: `FX-FORMAT.md` (generated from `assets/fx/schema.json`). Design and reasons: `designs/vfx-studio.md`. Art direction: `VFX.md` §1.
> The user is Thai and does not code. Reply in Thai and keep it simple. The user (or a friend) designs the skills, so **never invent mechanics or gameplay numbers**.

---

## 1. What it is (one minute)
- An effect is a **data file**: `assets/fx/<group>/<name>.fx.json`. It holds a list of **layers** on a timeline.
- One runtime, `js/45-fx-runtime.js`, plays these files with the game's own systems: particles, fire shader, volumetric fire, ice shader, lightning, trails, rings, lights and screen effects. So **what the studio shows is what the game shows**.
- `assets/fx/bind.json` binds game events to effects. You don't need to edit skill code.
- **`studio.html`** is the editor. It is the real game in studio mode (`index.html?studio`) with a timeline, an inspector, contact sheets and metrics.
- The same app also **makes the assets** effects need: 🧊 models (spikes, crowns, blades, wings, swirls, domes…) and 🎞 textures/flipbooks (fire, smoke, explosions, lightning, magic circles, real fluid sims). See §6b.
- Client side only. Effect files never change the network protocol, so there's no `PREFIX` bump.

## 2. Start it
- The user double-clicks **`VFX Studio.bat`** at the repo root. It starts `tools/serve.py` and opens the browser.
- You start it with `python tools/serve.py` (port 8765). In the Claude browser pane, `.claude/launch.json` → `wizardduel` already runs serve.py.
- Then open `http://localhost:8765/studio.html`.
- You need **serve.py**, not `python -m http.server`, for:
  - saving (`/api/save`)
  - shots (`/api/shot` → `shots/`, git-ignored)
  - the live file list (`/api/fx-list`)

## 3. File map
| Path | What |
|---|---|
| `assets/fx/schema.json` | **Single source of truth**: every layer type and field, with defaults, ranges, Thai labels and descriptions. The runtime, studio, checker and docs all read it. |
| `assets/fx/start/*.fx.json` | Starter templates: `explosion` `hit` `slash` `beam` `aura` `shield` `ice_spikes` `lightning_strike` `fire_pillar` `projectile` `summon` `zone`, plus `crystal_nova` / `campfire` (use studio-made models/textures). **Copy one; don't start from zero.** |
| `assets/fx/tpl/*`, `sig/*`, `rec/parry` | The old `playFx('fire_impact')` templates, now files (palette × template + element layers). Editing them changes every skill that uses them (`EFXAUG`/`fxAug` in `js/44-vfx-kit.js`). |
| `assets/fx/bind.json` | Event → effect table. |
| `assets/fx/index.json` | Generated list and versions. **Don't hand-edit.** |
| `FX-FORMAT.md` | Generated field docs. **Don't hand-edit.** |
| `js/45-fx-runtime.js` | Runtime: `fxPlay`, `fxStart`, `fxStop`, `fxKill`, `fxBind`, `fxTpl`, `FXCODE` |
| `assets/fx/mesh/*.mesh.json` | Models made in the 🧊 tab (recipes; the game builds them) — §6b |
| `assets/fx/tex/*.png` + `*.tex.json` | Textures / flipbooks made in the 🎞 tab — §6b |
| `js/46-fx-make.js` | Builds models from recipes + loads textures (`fxMeshBuild`, `fxTexLoad`, `MKGEN` part generators) |
| `studio/studio.js`, `studio/studio.css` | Studio, loaded only with `?studio` |
| `studio/maker.js`, `studio/texgen.js` | 🧊 Model / 🎞 Texture / 🔥 Fire 3D tabs (texture generators: GLSL shaders + 2D fluid sim + png writer; 3D fire sim worker `vxWorkerMain`) |
| `assets/fx/vol/*.vol.json` + `*.bin` | Fire 3D volumes made in the 🔥 tab — §6b |
| `tools/fx-lint.js`, `tools/fx-check.js` | Checker (shared by node and the studio) |
| `tools/serve.py` | Local server + save/shot API |

## 4. The workflow (do it in this order)
1. **Read the request.**
   - Check `notes/vfx-notes.md` for what the user already approved for that skill.
   - Check `notes/prompts/` if a VFX round prompt exists.
2. **Find the event.**
   - Effects are triggered by host events: `{k:'efx', z:'<name>', x, y, h, a, r, id, …}` (spell visuals) or generic events like `cast`, `imp`, `pop`, `boom`, `parry`, `die`.
   - To find names: `grep "z:'" js/0*.js js/1*.js`. Or use the `EFXAUG` keys in `js/44-vfx-kit.js`. `CODEMAP.md` tells you where code lives.
3. **Start from a template.** Copy `assets/fx/start/<closest>.fx.json` to `assets/fx/<element>/<skill>.fx.json` (e.g. `storm/railgun.fx.json`), or use **＋ ใหม่** in the studio.
4. **Edit the JSON.** Look up fields in `FX-FORMAT.md` (§5 below has the essentials).
5. **Check:** `node tools/fx-check.js`. It must print **✗ 0**. It also rewrites `index.json` and `FX-FORMAT.md`.
6. **Look at it** with a contact sheet (§6) and Read the image. Fix, then look again. Check a bright map (`map=test`) **and** a dark one (`map=castle`).
7. **Bind it** in `assets/fx/bind.json`.
   - Start with `"mode": "add"`, which plays on top of the old look.
   - Use `"replace"` only when the old code look should disappear and the user agrees.
8. **Try it in the real game:** training mode, cast the skill. Or use the studio's 🎮 button, which sets a temporary `localStorage wd_fxbind` override.
9. **Finish:**
   - Run `node tools/check.js`, `node tools/fx-check.js` and `node tools/codemap.js`.
   - Update `HANDOFF.md` (latest changelog line) and `notes/CHANGELOG.md`, plus `notes/vfx-notes.md` when the user approves a look.
   - **Pull first**, check there are no `<<<<<<<` markers, then commit and push.
   - Pushing to `main` deploys the live site. If the push hangs, the user must log in to GitHub.

## 5. Format essentials (details in `FX-FORMAT.md`)
```json
{
  "v": 1, "desc": "what it is", "tags": ["impact"], "pal": "storm", "dur": 1.2,
  "params": {"r": {"def": 4, "desc": "radius m"}},
  "layers": [
    {"id": "core",  "t": "flash", "at": 0, "life": 0.1, "col": "$core", "size": 2.5},
    {"id": "ball",  "t": "mesh",  "at": 0, "life": 0.6, "shape": "sphere", "mat": "energy", "pos": [0, 1, 0],
     "scale": {"0": 0.2, "0.4": 1, "1": 1.1, "ease": "out", "x": "r*0.6"}, "dis": {"0.5": 0, "1": 0.9}},
    {"id": "sparks","t": "emit",  "at": 0, "life": 0.05, "burst": 30, "from": "hemisphere", "dir": "out",
     "speed": [5, 12], "plife": [0.3, 0.7], "look": "streak", "size": [2, 3], "col": "$core", "c2": "$deep", "gravity": 5}
  ]
}
```
- **Units:**
  - metres (1 m = 1 game 3D unit = 20 sim px) and seconds
  - angles in degrees, except `spread` (radians)
  - particle `size`: 8 ≈ 1 m
- **Frame:** +x = right, +y = up, +z = **aim direction**. `att` picks the anchor: `point` (event point incl. height), `ground`, or `feet`/`chest`/`head`/`wand` of the followed player.
- **Values:**
  - a number
  - `[min,max]` = random (only fields marked "range")
  - `"r*0.5"` = expression over `params` + `s` (scale) + `k` (intensity); allowed: `+ - * / ( ) min max abs sqrt floor round sin cos PI`
  - a **curve** over the layer's life: `{"0":0,"0.3":1,"1":0,"ease":"out","x":mult}`, only on fields marked "curve"
  - `vec3` fields take `[x,y,z]`, and curves of `[x,y,z]`
- **Colours:** `#rrggbb`, or palette tokens `$core $hi $main $deep $light`.
  - Tokens follow `pal` (`fire ice storm nature hex summon earth arcane shield heal col`).
  - Prefer tokens, so one effect works for every element.
- **Layer types:**
  - `mesh`: 3D shape + material. Shapes: `sphere dome disc ring cylinder cone torus crescent spikes beam plane lathe ribbon glb`. Materials: `energy fire ice glow solid flip`.
  - `firevol`: real volumetric fire.
  - `emit`: particle emitter, from `point sphere hemisphere ring disc cone box line mesh`; dir `out flat up down in aim tangent random`; look `glow spark streak ring flake smoke fire ember`.
  - `trail`: follows a layer, or a `sweep` slash arc.
  - `bolt`: thick lightning, always yellow; `acc` = blue accent.
  - `decal`: `scorch rune crack icecrack dark glyph`.
  - `debris`: `rock ice`.
  - `mist`, `crown` (ice spike crown), `geyser` (fire column).
  - `flash`, `halo`, `ring`, `light`, `screen` (shake / flash / radial / kick / hurt), `sound`.
  - `use`: nest another fx (prefab).
  - `code`: call a registered `FXCODE` helper; escape hatch only.
- **Timing and gates:**
  - `at` + `life`
  - `loop: true` repeats until `fxStop` (auras, zones); `end: true` plays when stopped
  - `x: true` = optional layer, skipped on low graphics or far away
  - `own: true` = only for my own player; use it for screen effects and radial blur
  - `near: N` = only within N m of the camera

## 6. See your work: contact sheets (this is how you "look")
```
http://localhost:8765/studio.html?fx=storm/railgun&sheet=0.03,0.1,0.2,0.35,0.6,1&cam=side&at=self&map=test&save=railgun_v1
```
- This renders a **deterministic** grid of frames at those times (seeded random, fixed 1/60 steps). The header and each caption show metrics. The image goes to **`shots/railgun_v1.jpg`**; open it with the Read tool.
- Parameters:
  - `cam`: `game` (over-the-shoulder like a player), `side`, `front`, `top`, `orbit`
  - `at`: `front` (12 m ahead), `self` (on the caster, follows them; for auras, shields, beams and slashes), `far` (30 m)
  - `map`: `test` (bright), `castle` / `greathall` (dark), `meadow`, `lake`
  - `seed`: change it to see another random roll
- **Pass/fail rules** (printed in the sheet):
  - **white-out ≤ 8%** of pixels near-white
  - **character cover ≤ 35%** of my character's box washed white
  - particles comfortably below 3000
- From the browser console (JS tool on the studio tab):
  - `STUDIO.load(n)`, `STUDIO.seek(t)` → returns metrics, `STUDIO.sheet([..], saveName)`, `STUDIO.metrics()`, `STUDIO.lint()`
  - `STUDIO.set('layerId.field', value)`, `STUDIO.add(type)`, `STUDIO.select(id)`, `STUDIO.save()`, `STUDIO.cam(c)`, `STUDIO.at(a)`
  - **Find what whites out:** solo each layer with `STUDIO.state.solo='id'; STUDIO.seek(t)` and compare `white`. Set `solo=null` when done.
- When the file changes on disk, the studio reloads it by itself. So you edit JSON and the user sees it live.

## 6b. Make your own assets: 🧊 Model tab and 🎞 Texture tab (no Blender needed)
The studio has 4 tabs in the top bar: **✨ เอฟเฟกต์** (effects, sections above), **🧊 โมเดล** (models), **🎞 ภาพ** (textures / flipbooks), **🔥 ไฟ 3D** (simulated 3D fire volumes). Same app, same renderer as the game.

**Models: `assets/fx/mesh/<name>.mesh.json`.**
- A model is a **recipe**: a list of `parts` + modifiers. The game builds the 3D mesh itself when it loads (`js/46-fx-make.js`, same code in game and studio). Files are tiny and stay editable.
- Part kinds (`k`): `shard` (crystal spike), `crown` (ring of spikes), `cluster` (crystal cluster), `burst` (spikes in all directions), `blade` (crescent / slash / claw), `fan` (wing / feathers), `spiral` (ground swirl / tornado band), `tube` (horn / tentacle along a path), `ribbon`, `lathe` (profile spun around: domes, cups, funnels), `sphere`, `cyl`, `torus`, `disc`, `star`, `box`.
- Every part also has `pos` `rot` `scale`, shape modifiers `topScale` (taper) `twist` `bend` `noise` `nfreq` `seed` `flat`, and repeats `arr` (+ `arrMode` ring/line, `arrR`, `arrStep`, `arrScale`, `arrJit`) and `mir` (mirror left/right).
- Units are metres, base at y = 0, +x right +y up +z forward. uv v goes 0 at the root/inside → 1 at the tip/outside, so fire and energy flow outward.
- Use it in an effect: `{"t":"mesh","shape":"model","model":"<name>","mat":"ice", ...}` (all normal mesh fields work: `scale` curves, `dis`, `op`, `spin`, `bill`).
- 13 samples to copy: `crystal_crown` `crystal_cluster` `spike_shell` `slash_arc` `claw_triple` `flame_wing` `tornado` `rune_swirl` `horn_pair` `star_burst` `rock_chunks` `shield_dome` `energy_spear`.
- In the studio: ＋ ชิ้นส่วน adds a part; click a part on screen to select it; drag the gizmo; **G** move / **R** rotate / **S** scale (like Blender); Delete, Ctrl+D duplicate, H hide, W wireframe; "ดู: ดินปั้น/วัสดุจริง" = clay or real game material; ⬇ .glb exports for Blender.

**Textures: `assets/fx/tex/<name>.png` + `<name>.tex.json`.**
- The `.tex.json` is the recipe (generator `gen` + values `p` + `ramp` colours + frame grid `cols`×`rows`, `px` per frame, `kind` loop/life, playback `add span rand rot spin size occ`). The `.png` is the baked frame sheet. **Only the studio can bake the png** (GPU shaders + a CPU fluid sim).
- Generators: `fire` (looping flame), `smoke` (puff over the particle's life), `explosion`, `electric`, `vortex`, `shock` (shockwave ring), `burst` (hit sparks), `slash`, `flare` (star), `glow`, `ring`, `circle` (magic circle), `noise` (tileable mask: clouds / veins / cells), `sim` (**real 2D fluid simulation**, fire or smoke, like Blender Mantaflow but in under a second).
- `loop` textures loop seamlessly (periodic noise; sim crossfades). `life` textures play once over each particle's life.
- Use it in an effect: particles `{"t":"emit","fb":"tex/<name>","col":"#ffffff", ...}` (works with every `look`; `#ffffff` = the image's own colours, other colours tint it) or a card `{"t":"mesh","shape":"plane","bill":true,"mat":"flip","tex":"tex/<name>","col":"#ffffff"}` (flat on the ground: `"rot":[90,0,0]`, drop `bill`).
- 18 samples: `fire_loop` `fire_sim` `smoke_puff` `smoke_sim` `explosion` `electric_arc` `vortex_portal` `shockwave` `hit_burst` `slash_sweep` `star_flare` `soft_glow` `ring_soft` `magic_circle` `magic_circle_spin` `noise_clouds` `noise_veins` `noise_cells`.
- Demo effects that use them: `start/crystal_nova` (model + shockwave card + star particles), `start/campfire` (sim fire + sim smoke particles).

**Imported images:** 🎞 tab → 📥 นำเข้าภาพ (or drop PNG/JPG files on the preview). One file = a picture or sprite sheet (set `cols` × `rows` to its grid); several files = packed into frames in name order. Saved as `gen:"image"` (the .png is the source). `STUDIO.tex.import(files)`.

**🔥 Fire 3D: `assets/fx/vol/<name>.vol.json` + `<name>.bin`.** A real 3D fluid simulation (buoyancy, vorticity, turbulence, flame-tongue detail) run in a Web Worker in ~1–3 s — the same job as the friend's Blender Mantaflow → `tools/pack_volseq.py` pipeline, and the **same .bin format**. Presets: `column` (looping pillar), `wall` (line), `ring`, `bonfire`, `burst` (one-shot explosion). Play it with the **`vol`** layer: `{"t":"vol","src":"vol/<name>","hx":0.9,"hz":0.9,"h":3.6}` (box half-width/half-depth/height in m; `"once":true` for bursts; `dis`/`hgt` curves). The same layer plays the friend's Blender bakes in `assets/vfx`: `"src":"fire_column"` / `"df_impact"`. Fire colours only (uses the game's fire ramp). Samples: `fire3d_column`, `fire3d_burst` (demo fx `start/fire3d_burst`). Files are ~1 MB at res 24 × 32 frames — keep it small.

**New effect features (any effect):**
- `mesh` **`mat:"tex"`** — a studio texture on any shape/model: `tex:"tex/<name>"`, `uvTile:[u,v]`, `uvScroll:[u,v]` (flows), `col` tint, `col2`+`rim` glowing edge, `dis` burn-away. E.g. lava/rune/cell shields, energy blades.
- `mesh` **`grow`** (shape `model` only) — each piece (spike, copy, feather) rises from its own base: `"grow":{"0":0,"0.3":1}`, `stagger` (0 = all at once … 0.9 = one by one), `growBy` `center`/`order`/`random`/`height`. Walls, pillar rings and spike waves erupting.
- `emit` **`look:"model"`** — every particle is a studio model (`model`, `mmat` solid/ice/glow, `msize` m, `bounce`, `mspin`): flying rocks, crystal shards, feathers that tumble, fall and bounce on the ground.
- **`warp`** layer — air distortion: `kind` `haze` (rising heat) / `shock` (expanding ring that bends the image; `flat` = on the ground) / `bulge` (lens). Medium/high graphics only.
- Demo fx: `start/stone_eruption` (grow + rock debris + shock warp), `start/hex_dome` (tex material), `start/fire3d_burst` (vol + haze).

**Claude workflow for assets (all from the JS tool on the studio tab, needs serve.py):**
- Open a tab directly: `studio.html?mesh=<name>` or `studio.html?tex=<name>`.
- Models: write/edit the `.mesh.json` by hand (fields in `FX-FORMAT.md` → "โมเดลที่ปั้นเอง"), run `node tools/fx-check.js`, then look: `STUDIO.mesh.open(n)`, `STUDIO.mesh.view('mat'|'clay')`, `STUDIO.mesh.shot(name)` → `shots/<name>.jpg`, or `STUDIO.mesh.sheetAll(name)` = every model on one sheet. Edit live: `STUDIO.mesh.set('partId.field', v)`, `STUDIO.mesh.add(kind)`, `STUDIO.mesh.save(name)`. `STUDIO.mesh.tris()` (keep ≤ 30000), `STUDIO.mesh.lint()`.
- Textures: write the `.tex.json`, then bake: open `studio.html?tex=<name>&bake=1` (renders + saves the png) or `studio.html?bakeall=1` (re-bakes every texture). Look: `STUDIO.tex.sheetAll(name)` → frames of every texture on dark + checker backgrounds; `STUDIO.tex.sheet(name)` = one texture's full sheet. Edit live: `STUDIO.tex.set('p.scale', 4)`, `STUDIO.tex.gen('vortex')`, `STUDIO.tex.save(name)`.
- Fire 3D: `studio.html?vol=<name>` • `STUDIO.vol.newFrom(name,'column'|'wall'|'ring'|'bonfire'|'burst')`, `STUDIO.vol.set('p.size',0.3)`, `await STUDIO.vol.bake()`, `STUDIO.vol.save(name)`, `STUDIO.vol.shot(name)` (call `STUDIO.tick(30)` first so the preview plays).
- If the browser pane is hidden, animation frames don't run: use `STUDIO.tick(n)` to step the model/texture tab by hand before `shot`.
- After saving, fx-check runs by itself (via serve.py); still run `node tools/fx-check.js` before committing. Texture pngs are ~50 KB–1 MB; prefer `px` 128 and the smallest grid that looks right.

## 7. bind.json
```json
{
  "efx:dfboom":  {"fx": "fire/dfboom", "mode": "add", "p": {"r": "ev.r/20"}},
  "imp:fire":    {"fx": "fire/spark_hit"},
  "efx:blaze":   {"fx": "fire/blaze_aura", "follow": "ev.id"}
}
```
- Keys:
  - `efx:<z>` for spell events
  - `<k>:<t>` or `<k>` for generic events (`cast`, `imp`, `pop`, `boom`, `parry`, `block`, `sbreak`, `die`, `kill`, `revive`, `buff`, `land`)
- `p` maps event fields into params. **`ev.r` is in px: divide by 20 for metres.**
- `replace` skips the old code visuals **and** sounds for that event. Add a `sound` layer if needed.
- **Persistent effects** (auras, buffs) need code: `const h=fxPlay('x/y',{x,y,h,a,follow:id,own})` when it starts and `fxStop(h)` when it ends. Put that in the path's view code (`pyroFX`, `frostFX`, `stormFX`), or bind the start event with `follow` and stop it from code.

## 8. Rules and gotchas
- **No white-outs.**
  - Big white `glow` meshes and bright point `light`s on bright maps cause most of them.
  - Use `$main`/`$deep` for big things and keep white for small cores.
  - Keep `light.int` ≤ 2.5 (≤ 1.5 on big effects).
  - Keep screen `flash` ≤ 0.06.
- **Energy material on bright floors is faint.** Raise `op`, use `$deep` colours, or add a `glow`/`ring` edge.
- **Big recognisable shapes** (balls, walls, beams, shells, wings) → `mesh`/`firevol`. Use particles only for small scattered bits (VFX.md §1.6).
- **Budget:** one-shot `burst` ≤ 80 per layer, `rate` ≤ 200/s, ≤ 2–3 lights per effect. The runtime already scales particles by FPS and graphics level.
- `use` must not nest itself; the checker flags it, and the runtime stops at depth 4.
- `x` and `own` are gates. Use `own` for anything that hits the whole screen.
- Don't touch `index.json` or `FX-FORMAT.md` by hand. Run `node tools/fx-check.js`.
- The repo is **public**: only use self-made or CC0 images and models.
- **Need a new 3D shape or texture? Make it in the 🧊 / 🎞 tab first** (§6b). Blender is only for things the part kinds can't build (characters, detailed props).
- A Blender model (`mesh_*` in `assets/manifest.json`) can still be a shape: `"shape":"glb","glb":"mesh_fire_wing"`.
- Flipbooks: `mat:"flip"` with `tex` = `tex/<name>` (made in the studio) or a name from manifest `fx`/`ptex`.
- New part kinds or texture generators: add the fields to `schema.json` (`mk.parts` / `tx.gens`) first, then the code (`MKGEN` in `js/46-fx-make.js` / `TX_GLSL` in `studio/texgen.js`).
- New layer types or fields: add them to `schema.json` first, then `js/45-fx-runtime.js` (`fxSpawn`/`fxTick`/`fxEnd`), then `tools/fx-lint.js` if they need checks. Run fx-check to regenerate the docs.
- A friend (another Claude) also works on VFX, mostly fire/Pyro. **Pull often**, and don't rewrite their files without being asked.

## 9. Quick troubleshooting
| Symptom | Fix |
|---|---|
| Studio shows nothing / "เปิดไม่ได้" | The file path or name is wrong, or the JSON is broken. Run `node tools/fx-check.js`. |
| Save says it needs serve.py | You started a plain http.server. Use `VFX Studio.bat` / `python tools/serve.py`. |
| Screenshot tool times out (browser pane hidden) | Use `&save=` sheets and Read `shots/…` instead. |
| Effect is in the studio but not in the game | Not bound (`bind.json`), the event name is wrong (check `z:'…'` in host js), or the file isn't loaded yet (bound files are prefetched at load). |
| In-game look differs from the studio | Check `att` (`ground` vs `point`) and the event's `h`/`a`; studio `at=self` vs `front`. |
| `shape:"model"` layer shows nothing | Model name wrong (fx-check says so) or still loading — the first play after load can skip it; sheets wait for loading. |
| Particles with `fb:"tex/…"` look like plain dots | The png is missing or not baked: open `studio.html?tex=<name>&bake=1`. |
| Texture looks too dark / tinted | Set the layer `col` (and `c2`) to `#ffffff` so the image keeps its own colours. |
