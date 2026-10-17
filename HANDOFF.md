# HANDOFF — Wizard Duel (repo: Fantas-Stick)

> **For the next Claude Code session (any device): read this file first.**
> **Rule: update this file at the end of every task** — the status, changelog, and known issues sections at minimum. Commit and push it together with the code.
> Last updated: 2026-10-17 (end of session 1 — the user is switching to a new Claude session)

---

## 0. START HERE
> Session 2 (2026-10-17): the questions below were asked; the user skipped them and picked **minimap first** (done). Still unanswered: audio feel, performance, real online test, UI feedback, "เพลงของฉัน". Ask again briefly if relevant, then offer the next ideas in §10.
>
> Tip: if port 8765 is already taken by a stale server, just use it (`http://localhost:8765/?v=N`). `WD.addPlayer` accumulates bots across calls — reload the page for a clean test.

### Original opening questions (ask in Thai)
The user asked that the next session **open by asking these questions** (one short message, Thai, simple words, numbered so they can answer quickly). Don't start coding before they answer, unless they already gave a task.

1. **เสียงและเพลงใหม่เป็นยังไงบ้าง?** มีเสียงไหนแปลกหรือไม่เข้ากับเกมไหม (เช่น เสียงโดนตี เสียงลูกไฟ เสียงเจ็บ) — จะเปลี่ยนให้ *(sounds were picked by file name, never listened to — see §9)*
2. **เกมลื่นขึ้นไหม** บนเครื่องของคุณและของเพื่อน? ปุ่ม "กราฟิก" ตั้งไว้แบบไหน ยังกระตุกตรงไหนอยู่ไหม
3. **ได้ลองเล่นออนไลน์กับเพื่อนจริงหรือยัง?** มีปัญหาเข้าห้องไม่ได้ / หลุด / หน่วง / ไมค์ไม่ได้ยิน / โหวตโหมดโวลเดอมอร์ไม่ทำงานไหม *(never verified with real friends)*
4. **หน้าตา UI ใหม่ชอบไหม** มีหน้าไหนอยากแก้ (หน้าแรก ล็อบบี้ HUD ตอนเล่น หน้าเลือกพลัง หน้าจบเกม)
5. **ปุ่ม "เพลงของฉัน" ใช้ได้ไหม** (เลือกเพลงจากเครื่องตัวเอง)
6. **อยากทำอะไรต่อ?** ตัวเลือกที่เคยคุยไว้: แผนที่ย่อมุมซ้ายล่าง • เลือกตราบ้าน (กริฟฟินดอร์ ฯลฯ) ในหน้าแรก • บอสใหม่ (บาซิลิสก์) • แผนที่ใหม่ (ฮอกส์มี้ด / ห้องโถงใหญ่) • ช่องลับ+มินิเกมภารกิจในโหมดโวลเดอมอร์ • ชุดแต่งตัว • เล่นบนมือถือ

Then do the work, keep replying in Thai, and update this file at the end (CLAUDE.md rule).

---

## 1. What this is
A 3D third-person (over-the-shoulder, Hogwarts Legacy style) wizard dueling browser game.
**The entire game is one file: `index.html`** (~4,000 lines, inline CSS + one `<script type="module">`) plus static assets in `audio/`.
Personal, non-commercial fan project made with/for the user and their friends. UI text is **Thai**; code comments are Thai.

- Live (GitHub Pages): https://0816559413zz-spec.github.io/Fantas-Stick/
- Repo: https://github.com/0816559413zz-spec/Fantas-Stick (public, branch `main`, Pages serves `/` of `main`)
- Commit identity used: `0816559413zz-spec <292358957+0816559413zz-spec@users.noreply.github.com>` (repo-local config — keep the noreply email; do NOT use a work email)

## 2. The user
- Thai speaker, no programming experience → explain in Thai, simply. Do the work for them.
- Plays with friends online; wants Harry Potter / Hogwarts Legacy vibes.
- Prefers: everything in a single HTML file (audio files in `audio/` are OK), maps random (not selectable), in-game 📖 guide kept up to date.
- Likes to **see references first** before big redesigns (we showed a visual board of 3 directions; they picked a mix). Likes short Thai summaries; asks to use subagents (e.g. "use subagent sonnet") for research — do that when asked.
- Not commercial, plays only with friends — but the repo/site is **public**, so never commit copyrighted assets (Harry Potter music etc.). Point them to "เพลงของฉัน" instead.
- They may stop the local preview server by closing the browser pane; just restart it (`preview_start` name `wizardduel`) when needed.

## 3. Tech stack (all from CDN, no build step)
- **Three.js 0.160.0** via importmap (`unpkg.com/three@0.160.0`) + addons: EffectComposer, RenderPass, UnrealBloomPass, OutputPass. `gl.useLegacyLights=true` (light intensities tuned for legacy mode).
- **PeerJS 1.5.4** (classic script, global `Peer`) — WebRTC data + voice. Uses the public PeerJS cloud for signaling only. Room id = `PREFIX + 5-char code`. **`PREFIX='wizduel-th-v7-'` — bump the version whenever the network protocol/snapshot changes** so old clients can't join new hosts.
- **Audio files in `audio/`** (14 MB, OGG Vorbis, credits in `audio/CREDITS.md` + in-game guide): `music/` (menu, castle, forest, pitch, boss, imp + victory/defeat stingers), `sfx/<name>_<n>.ogg` (73 files for 39 sound names), `amb/` (wind loop for brooms, castle crickets, forest). Loaded after the first click (`ac()` → `loadSfx()`); any sound that fails or has no file falls back to the original Web Audio synth in `snd()`. Music streams through `<audio>` elements (`MUSF`, not decoded into RAM); SFX/ambience are decoded buffers. Kevin MacLeod tracks are **CC BY 4.0 — the credit in the guide must stay**.
- **"เพลงของฉัน"** (menu): player picks local audio files → stored in IndexedDB `wd_music` → played via `<audio>` instead of game music, only on that PC (never uploaded). `N` = next song, "ล้าง" clears. This is the answer for "can we use Harry Potter music": players use their own files locally; never commit copyrighted music to the public repo.
- Google Fonts: **Cinzel** (Latin display — logo, headings, countdown; caps-only) + **Kanit** (all Thai text). Font stack `'Cinzel','Kanit'` lets Latin use Cinzel and Thai fall back to Kanit.

## 4. Architecture (important)
- **Host-authoritative.** The host runs the whole simulation in `hostTick()` (setInterval 60 Hz) in a **2D plane** (x,y in pixels) plus height (`p.z` / `e.h` / `pr.h` in 3D units). Clients only send input (`{t:'in',i:INPUT}` every 30 ms) and render snapshots.
- Host broadcasts `makeSnap()` at 30 Hz (`{t:'s',s}`); the host itself renders from the same snapshot via `onSnap()` at 60 Hz. Events (`EVL`/`EVN` → `ev` array) drive effects/sounds through `fx(ev)`.
- Private per-player messages: `sendPriv(id,{...})` → client `{t:'priv',m}` → `onPriv(m)` (used for secret roles in the Voldemort mode). Never put secret data in the snapshot.
- Coordinates: 1 3D unit = 20 sim px. `tx(x)=(x-MW/2)/20`, `tz(y)=(y-MH/2)/20`. Current map size `MW,MH`, obstacles `OBS` (each `{x,y,r,k,hgt}`; flying higher than `hgt` passes over).
- Maps are generated deterministically (seeded `mulberry`) so every client builds the same world. `buildWorld(id)` rebuilds the 3D scene when `builtMap` differs from the lobby/snapshot map.
- Two canvases: `#gl` (WebGL 3D) and `#cv` (2D overlay for HUD, name tags, damage numbers). DOM overlays: menu, lobby, buff picker, results, meeting vote, guide, voice panel.
- **Menu & lobby render a separate 3D scene `stage`** (dark hall, gold rune dais, floating candles) via `renderStage()` — `rpass.scene` is swapped to `stage` for that frame. Characters there come from `makeStudent()` re-parented into `stage` (`STAGE.chars`). The map scene is only rendered in-game.
- **Performance (2026-10-16):** `antialias:false` (composer RT has no MSAA anyway), pixel ratio ≤1 by default, bloom rendered at half res (patched `bloom.setSize`), `PCFShadowMap` with `shadowMap.autoUpdate=false` (re-rendered every 2nd frame in auto, every frame in high), shadow map 2048 (4096 only on high for forest/pitch), light pool 6, `stoneMat` cached per (repeat,tint), and **`batchStatic(world, skip)`** merges every static, opaque, same-material mesh after `buildWorld` (castle ~480→~270 draw calls). Anything animated must go in the `skip` set (RUNE, CRYSTAL, SNITCH, FIREFLIES, CANDLES, BANNERS) or be a Sprite/InstancedMesh/transparent — **if you add a moving/toggled mesh to a map, add it to that skip list.**
- **Graphics quality** `QUAL` (menu button "กราฟิก", stored in `localStorage wd_gfx`): `auto` (default; `qualTick` drops render scale 1→0.55 when frames average >24 ms, raises it back when <18 ms), `high` (DPR up to 1.5, shadows every frame), `low` (scale 0.7, no shadows, no bloom). `applyQuality()` applies it.
- Camera: pointer lock; mouse → `yaw/pitch`; WASD is camera-relative (`INPUT.mx/my`); aim `INPUT.ax/ay` + pitch `INPUT.ap`. Spells **auto-lock vertically** onto a foe within ~0.3 rad of the aim (`shoot()`).

## 5. Code map
(Character data/helpers: `HOUSES`, `lookStr/parseLook/randLook/getLook` right after `COLORS` (~line 346); `makeStudent(look,id)` ~2670; creator UI JS right before the `btnSolo` wiring at the end of the file.) (`index.html`, approximate line numbers — grep the section headers)
| Line | Section (Thai header) | What |
|---|---|---|
| ~10 | `<style>` | UI theme tokens on `:root` (`--gold`, `--panel`, `--corners` gold corner brackets, `--fd` display font). `.card` = gold-framed panel used everywhere. Menu `.mleft/.mi/.mprof/.myrow`, lobby `.ltop/.lmodes/.lright/.mcard`, buff cards `.boon .bc` |
| ~163 | HTML | `#menu` (logo + text menu: solo / host / join / guide / กราฟิก / เพลง / เพลงของฉัน; profile card bottom-right), `#guide` (incl. เพลงของฉัน help + **credits**), `#lobby`, overlays `#buff/#over/#meet`, `#voice` |
| ~290 | `พื้นฐาน` | utils (`$`, `rnd`, `clamp`, `lerp`, `store`, `toast`) |
| ~305 | `ค่าคงที่ของเกม` | `MAPS`, `MODES`, `PDEF`, `EDEF`, `POOLS`, `BUFFS` (icon `i`) |
| ~397 | `เครือข่าย` | host/join, `hostOnData`, `clientOnData` |
| ~469 | `ฝั่งโฮสต์` | lobby, `hostStart`, `hostTick`, `updatePlayer`, projectiles, damage, enemies + boss AI, `modeLogic`, `endMatch` |
| ~1168 | `โหมดพิเศษ` | training, Quidditch, race, battle royale, Voldemort mode, `modeSnap` |
| ~1478 | | `makeSnap`, `PROF`/`pf` profiler, host loop |
| ~1513 | `ไมค์` | mesh voice chat |
| ~1602 | `การควบคุม` | keyboard/mouse → `INPUT` (M music, N next own song) |
| ~1640 | `เสียง` | synth SFX `snd()` (tries `playBuf` file first) |
| ~1756 | `ไฟล์เสียงจริง` | `SFXN/SFXV/SFXR/SFXSYN`, `loadSfx`, `playBuf`, `ambTick`, `MUSF` streamed music (`wantTrack`, `fileMusicTick`, boss + win/lose stingers) |
| ~1839 | `"เพลงของฉัน"` | `MY` playlist, IndexedDB `wd_music`; then synth music fallback `musicTick`, `toggleMusic` |
| ~1939 | `ฝั่งแสดงผล` | `setScreen`, `onLobby`, `onSnap`, particles, `fx(ev)`, overlays (`syncOverlays`, `showOver`) |
| ~2205 | `โลก 3D` | renderer + bloom (`rpass`), **`QUAL`/`applyQuality`/`qualTick` (~2227)**, sky, **`batchStatic` (~2336)**, maps, cloth, `makeStudent`, `makeEnemy`, camera |
| ~3017 | `เวทีเมนู/ล็อบบี้` | `stage` scene, `stageSpots`, `stageChar`, `renderStage`, `drawStageLabels` |
| ~3427 | `ฝั่งแสดงผลของโหมดพิเศษ` | `syncModeObjs`, roles, meeting UI |
| ~3599 | | `render()` loop (+ own footsteps) |
| ~3652 | `ชิ้นส่วน HUD` | `plate`, `frameBox`, `drawBossBar`, `spellDia`, `thinBar`, `drawHUD`, `drawModeHUD`, `drawBottom`, `drawBoard` |
| ~3840 | `drawMinimap` | **minimap** top-right (kill feed sits below it): rotating circle (forward = up), view radius `MM.view`=620 sim px, draws OBS, enemies (red), players (team colour in tdm/quid), race rings, quid ball/snitch, BR zone, Voldemort tasks/bodies, "N" north marker; hidden while Tab scoreboard is open |
| ~3960 | `เมนู / ล็อบบี้ (DOM)` | menu wiring (graphics button, my-music input, UI click sounds), lobby, `renderLobby`, `window.WD` |

> **Safety net:** `v6.html` = the game exactly as it was before the skills rework (old Q/E/R/F spells, protocol `v6`, separate rooms). Live URL `.../Fantas-Stick/v6.html`. Delete it once the new system is trusted.

## 5b. Skills system (rewritten 2026-10-17/18 — "paths × spells")
**Design (user's brief):** many spells, element spells with side effects, crowd control, summons, split into "paths" (สาย), balanced. Chosen: pick **1 main path (สาย)** → gives the **ultimate (X)**; fill **Q/E/R/F** from the spell library (max **2 off-path** spells); **6 paths × 6 spells = 36** (5 normal + 1 ult per path).
- Data: `PATHS`, `SPELL_LIST`, `SPELLS` (`defSpell(path,{id,n,ic,cd,d,fx,cast(p,S),hit(pr,t),ult})`) — **append-only** (index = position; kit string `path.q.e.r.f` uses indices). Kit helpers: `parseKit/cleanKit/setKit/kitSpells`, host-side `p.kit/p.kitIds/p.ultId`, client `KITS[id]`/`getKit(id)`. Kit travels in `hello.kit` + lobby `players[].kt`; lobby change = `{t:'kit',k}`.
- Cast: `castSlot(p,i)` (cooldown `p.cd.q/e/r/f`, silence, BR unlock via `BRMAP`), `castUlt(p)`. HUD slots come from `mySlots(me)`.
- **Statuses** (players + enemies + minions): `addStun/addRoot/addFreeze/addSlow/addChill/ignite/shock/addPoison/addSil/addFear/addBlind/addMark/addWard/knock/healT`, ticked by `tickStatus`, speed by `moveMul`, CC duration scaling by `ccScale` (bosses 25 %, big 40 %, players get diminishing returns 100/60/35/20 % within 6 s), bitmask `fxMask` in the snapshot (`fm` on P/E/MN). Combos: fire on chilled/frozen = **melt** (+6, clears chill/freeze), ice shard/zap on frozen = **shatter**, shocked takes +8 % (zap +60 % and short stun), marked +25 % & half healing, poison reduces healing 15 %/stack, frozen +15 % damage.
- Field objects: zones `addZone` (`G.zones`, `hit`/`allyHit`), delayed strikes `addStrike` (telegraph via `tele` event with `col`), walls `addWall` (`G.walls`, snapshot `WL`, block movement + enemy projectiles), channels `G.chan` (tempest). Minions `G.mins` (snapshot `MN`), AI `updateMins`, types in `MIND` (wolf/sprite/golem/wisp), targetable (`foesOf` includes enemy minions, projectiles hit them, coop enemies may target them), HP bars `drawMinBars`.
- Client FX: events `zn` (persistent zone visuals `ZV`), `efx` (`efxFX` — one case per spell effect), `heal`, `tele`; walls `syncWalls`, minions `syncMins`, statuses `statusFX`, HUD status icons `STATUS_ICO`, blind vignette in `drawHUD`.
- Kit UI: creator **step 3 "คาถา"** (paths grid, 4 slots + fixed ult, library tabs, description box) + lobby button `#btnKit` (kit-only mode `crKitOnly`). Stored in `localStorage wd_kit`.
- **Balance tools (console only):** `WD.dmgTest()` (per-spell damage/CC vs a dummy over 8 s), `WD.bal(kitA,kitB,rounds,maxT)` (bot duels, sides swapped), `WD.tour({name:kitStr,...},rounds,maxT)` (round-robin win rates), `WD.balArena(false)` restores obstacles, `WD.hostTick(dt)` for headless sims. `botBrain` = simple kiting bot (aim lead, cast when in range, shoots minions that are close). **Sim caveats:** bots never dodge/shield and don't walk around walls/golems, so wall/minion/CC kits are over/under-rated — use sims to find *outliers*, then tune by feel with real players.
- `WD.coop(kitStr,maxSeconds,runs)` = solo dungeon with the bot (avg wave/time/kills). Last run (3 runs, 240 s): pyro wave 8, nature-A 7, frost 5, storm 5, summoner-A 5, hex-B 4.7, nature-B 4, summoner-B 3.7 → PvE favours pyro/nature; summoners are weak in PvE but strong in the PvP sim.
- **How to add/replace a spell (when the user sends their own designs):** append a `defSpell(pathIdx,{id,n,ic,cd,d,fx,cast(p,S),hit(pr,t)})` (never reorder existing ones — saved kits use indices); use helpers `shoot` (projectile; add a `PDEF`/`PCOL` entry for a new look), `aoeHit/foesIn` (area), `addZone/addStrike/addWall/summonMin`, statuses `add*`/`ignite/shock/knock/healT`; add a `case` in `efxFX` for visuals; run `WD.dmgTest()` + `WD.tour(...)`. Design template to ask the user for: name, path, cooldown, how it is cast (projectile / self-area / ground point / dash / buff / summon), damage, status effects + durations, side effect/combo, visual idea, ultimate or normal.
- Spell list (index:id): 0 fireball, 1 flamewall, 2 emberburst, 3 scorchdash, 4 meteor, 5 inferno(ult) • 6 iceshard, 7 frostnova, 8 icewall, 9 blizzard, 10 frostarmor, 11 abszero(ult) • 12 zap, 13 staticfield, 14 thunderclap, 15 overcharge, 16 arcblink, 17 tempest(ult) • 18 vinelash, 19 poisondart, 20 bloom, 21 barkskin, 22 sporecloud, 23 worldtree(ult) • 24 hexbolt, 25 terror, 26 blinddust, 27 hexmark, 28 gravity, 29 darkness(ult) • 30 spiritwolf, 31 firesprite, 32 stonegolem, 33 wispheal, 34 soulbind, 35 legion(ult).
- **Last sim (40 rounds/pair, rough):** pyro 39 %, frost 38 %, storm 41 %, nature-A 55 % / nature-B 28 %, hex-B 48 %, summoner-A 67 % / summoner-B 84 % (summoners are the outlier in the sim — minions soak bolts; needs human playtest, nerf by lowering `MIND` hp/life or `spiritwolf/firesprite` cooldowns). Old spells removed: stun bolt/push/pull/nova (stun→hexbolt/vine/thunderclap, pull→gravity, push→emberburst/frostnova knockback).

## 6. Game content (current)
**Modes** (`MODES`): 🗝️ Dungeon Co-op (1–6, waves "floors", boss raid every 5: dragon 3-phase / spider queen 3-phase) • 🎯 Training (dummies, parry practice, host ends with button) • ⚔️ Duel 1v1 • 💥 FFA • 🛡️ Team 2v2/3v3 • 🏟️ Quidditch (team, pitch map, ball + golden snitch) • 🏁 Broom race (10 rings × 2 laps) • 🌀 Battle royale (forest map, shrinking zone, unlock spells by items) • 🐍 Find Lord Voldemort (Among Us style, 4–6, roles: นักเรียนฮอกวอตส์ / ลอร์ดโวลเดอมอร์ / ผู้เสพความตาย at 6 players).
**Maps** (random unless the mode forces one): 🏰 castle (night), 🌲 forest (large, trees/rocks/stone circle), 🏟️ Quidditch pitch (sunset).
**Controls:** click = pointer lock • WASD/mouse • LMB bolt • RMB shield (parry window 0.28 s) • Q fire • E stun • R push • F pull • Space dodge (fly: up) • X ultimate • B broom • C descend • Tab score • V push-to-talk • M music on/off • N next song (เพลงของฉัน). Voldemort mode: E task • Q kill • R report • F emergency meeting.
Can't cast on a broom except in Quidditch/race. Stun or web knocks you off the broom.

## 7. How to run / test
- Just open `index.html` in Chrome/Edge (internet needed for CDN + PeerJS signaling). Solo play works without other players.
- For the Claude Browser pane, file:// can't be scripted — serve over http. `.claude/launch.json` (git-ignored, recreate if missing) runs `python -m http.server 8765 --bind 127.0.0.1` as `wizardduel`. Any static server works. **The browser caches `index.html` — load `http://localhost:8765/?v=N` with a new N after each edit.** Set the viewport to 1280x720 for screenshots.
- **Debug object `window.WD`** (console): `WD.AUDIO` (loaded sfx count, current music + time, ambience, own songs), `WD.G` (host state), `WD.VIEW`, `WD.INPUT`, `WD.hostStart()`, `WD.hostToLobby()`, `WD.addPlayer(id,name,color)` (fake bots for multiplayer modes), `WD.hostVote`, `WD.setYaw`, `WD.render(dt,now)`, `WD.camHook=(cam)=>{...}` (override camera for screenshots), `WD.PM3`, `WD.MO`, `WD.ROLE`.
- Typical test: click `#btnSolo`, add bots with `WD.addPlayer(id,name,color)` then `WD.broadcastLobby()` (they appear on the lobby stage), set `WD.G.mode='quid'`, `WD.hostStart()`, then drive `WD.render` from a setInterval if the pane is hidden (rAF pauses) and collect `window.onerror` messages. Boss bar: give players huge HP, then `WD.G.wave=4;WD.G.queue=[];WD.G.en=[]` twice → buff cards → wave 5 boss.
- **Profiling:** `WD.PROF.on=true` collects avg ms per section in `WD.PROF.t/n` (players, enemies, projMode, fx, gpuSubmit, hud2d, hostTick, snap). For real frame cost (CPU+GPU) call `WD.render(1/60,now)` in a loop followed by `WD.gl.getContext().readPixels(...)` to force a GPU sync, and read `WD.gl.info.render.calls` with `info.autoReset=false`. rAF FPS is useless when the pane is hidden (throttled to 1 Hz).
- Benchmarks at 1280x720 in the Claude browser pane (median frame ms, before → after): castle 14.4 → 4.6, forest 13.5 → 5.0, pitch 7.9 → 3.6.
- Not testable alone: real online play between devices, voice chat.

## 8. Deploy
`git add -A && git commit && git push` on `main` → GitHub Pages rebuilds in ~1 min (check: `gh api repos/0816559413zz-spec/Fantas-Stick/pages/builds/latest`). End commit messages with the Co-Authored-By line used in history.

## 9. Status / known issues
- ✅ All 9 modes run without console errors in automated solo+bot tests (2026-10-16). Quidditch goal/catch, race rings, dragon phases, Voldemort roles/kill/meeting/vote verified.
- ⚠️ Not yet verified with real friends online: Voldemort-mode voting over the network, voice in that mode, battle-royale/quidditch sync under real latency.
- ⚠️ Host can technically see secret roles via console (accepted — friends only).
- ✅ New UI (2026-10-16): navy+gold "magic book" theme, 3D party lobby, Hades-style buff cards, diamond spell HUD, boss bar. Checked at 1280x720 and 1024x640, all 9 modes start without console errors.
- ⚠️ Audio picks were chosen by name/duration, not by listening — the user may want to swap some (`hurt` uses human grunts, `cast_fire` uses a sci-fi thruster). Swap = replace the OGG with the same file name, or change counts in `SFXN`. OGG may not decode on old iPhone Safari → synth fallback.
- ✅ Audio (2026-10-17): all 73 SFX load, menu/castle/forest/pitch/boss/imp music switch correctly, victory stinger plays, ambience per map, เพลงของฉัน plays/skips/clears and survives reload. Verified in the Claude browser pane only.
- ⚠️ UI not designed for phones (<900px wide the lobby panels overlap the stage). Not checked with a real online friend yet (only host-side online lobby with room code).
- ⚠️ Graphics are low-poly primitives (no external models). Heavy maps (forest) may lag on weak PCs.
- `index.2d-backup.html` (old 2D version) is git-ignored and only exists on the original PC.

## 9b. Audio research
(Implemented 2026-10-17 — see the audio bullet in section 3. To re-encode: download sources listed in `audio/CREDITS.md`, ffmpeg via `pip install imageio-ffmpeg`, trim + peak-normalise to -2 dB, mono q2 for SFX, stereo q1 for music.)
`research/audio-assets.md` (Sonnet subagent, 2026-10-16): licence-checked free music/SFX picks. Verdict: Kenney (CC0) + OpenGameArt CC0 items for SFX, Incompetech/Kevin MacLeod (CC-BY 4.0, needs credits) for music; Pixabay/Sonniss/Mixkit/Zapsplat/Tabletop Audio rejected for raw files in a public repo. Done: files are in `audio/` (game music streamed, SFX decoded), synth kept as fallback.
User asked about real Harry Potter music: told them not to put it in the public repo (copyright, takedown risk); built the "เพลงของฉัน" button instead (local files, IndexedDB, never uploaded).

## 10. Ideas the user may ask for next
(Minimap done 2026-10-17.) Vents/secret passages for Voldemort, task mini-games, 3-player Voldemort mode, more bosses (basilisk), more maps (Hogsmeade, Great Hall), cosmetics, ranked/MMR, mobile controls.

## 11. Changelog
- 2026-10-16 — v1 2D prototype → 3D third-person (Three.js) → bloom, cloth, student uniforms, forest map.
- 2026-10-16 — Broom flying, spiders/pixies, Quidditch pitch map, random maps, guide button, synth sound + music; published to GitHub Pages.
- 2026-10-16 — Modes: Quidditch, broom race, battle royale, impostor, training, dungeon co-op with 3-phase dragon/queen boss raids; protocol `v3`.
- 2026-10-16 — Impostor mode renamed to 🐍 "หาลอร์ดโวลเดอมอร์" (Voldemort / Death Eater / Hogwarts students, Avada Kedavra kill FX).
- 2026-10-16 — Added this HANDOFF.md + CLAUDE.md.
- 2026-10-16 — **Whole new UX/UI** (refs: Hogwarts Legacy style + Fortnite/Valorant lobby + Hades boon cards + Elden Ring thin HUD): navy/gold theme with Cinzel, text-only main menu with your character standing on a 3D rune dais, 3D party lobby (everyone's character on stage, name plates, empty slots, click plate to swap team), mode list + selected-mode card + big gold start button, Hades-style buff cards, new results/meeting/guide styling, canvas HUD redone (diamond spell cluster, ult emblem, thin bars, boss bar, gold crosshair, framed scoreboard). No protocol change (PREFIX still v3).
- 2026-10-16 — **Performance pass** (~3x faster frames): half-res bloom, no canvas MSAA, pixel ratio ≤1, shadows every 2nd frame at 2048, static mesh batching, cached stone materials, fewer pool lights, auto/high/low graphics setting with auto resolution scaling, `WD.PROF` profiler. Audio asset research report added.
- 2026-10-17 — **Real audio**: CC0/CC-BY music per map + boss + imp + win/lose stingers, 73 CC0 SFX with synth fallback, footsteps, UI click/hover sounds, ambience loops, real wind for brooms, "เพลงของฉัน" local-music button (IndexedDB, N = next), credits section in the guide + `audio/CREDITS.md`.
- 2026-10-17 (session 2) — **Minimap** (แผนที่ย่อมุมซ้ายล่าง) via `drawMinimap`; no protocol change. Tested solo+bots in coop (castle/forest), quid, race, br, imp, ffa: no console errors. Role secrets are not shown on it (all other players use their own/team colour).
- 2026-10-17 (session 2) — **Character creator + Hogwarts houses** (protocol bumped to `v4`). `HOUSES` (Gryffindor/Slytherin/Hufflepuff/Ravenclaw; `c` primary, `c2` secondary), look options `HAIRC/HAIRSTY/EYEC/SKINC/CLOAKC/TIESTY`; a look = string `h.hr.hs.ey.sk.cl.ti` (`lookStr/parseLook/randLook/getLook`, `LOOKS[id]`). `makeStudent(look,id)` builds hair (4 styles), eyes (white+iris+pupil), proper tie, cloak colour (lining/scarf/tie from house). Player colour `p.color`/`p.c` is now always the house primary (host derives it from the look; the `color` arg of `addPlayer` is ignored). Client sends `hello.look`; looks travel in the lobby message (`players[].lk`) and are NOT in the per-tick snapshot — renderers use `getLook(id)`. Creator overlay `#creator` (opens automatically when `localStorage wd_look` is missing; button `#btnLook` on the profile card), live preview = `me-preview` on the menu stage (closer camera while `crOpen`). Guide section added. Verified: creator, lobby with 5 different looks, FFA start, no console errors. Not verified: real online join (look over PeerJS).
- 2026-10-18 (session 2) — **Perf + camera fix**: floating candles are now 1 InstancedMesh + 1 Points (`makeCandles/updateCandles`, was 2 draw calls per candle: castle 321→135 calls, Great Hall 462→143); forest grass tufts 7000→4200, bushes 260→200; auto graphics now escalates (resolution → bloom off `QUAL.lvl1` → shadows off `lvl2`) and recovers when smooth. Camera: when the player's back is to a map edge the old per-axis clamp put the camera on top of the player's head; now the camera may sink into the wall volume (`MAPCAM[map].m`) and otherwise shortens toward the player (`k`, min 0.45). **Skills note:** the user will design the real skills themselves — the 36 spells are a working placeholder/framework (replace via `defSpell`).
- 2026-10-18 (session 2, overnight task) — **Skills rework** (protocol `v7`, branch `skills-rework`): see §5b. R1 framework + Pyro/Frost/Storm, R2 Nature/Hex + extra statuses, R3 Summoner (minions) + kit UI + bot balance harness. Guide updated.
- 2026-10-17 (session 2) — **Creator v3** (protocol `v6`, look string now 10 fields `h.hr.hs.ey.sk.cl.ti.wd.wc.ws`): 3-step timeline 1 หน้าตา → 2 ไม้กายสิทธิ์ → 3 เลือกบ้าน (house stays last; `crStep` is 1/2/3, CSS classes `.cr1/.cr12/.cr2/.cr3` on `#creator.s1/.s2/.s3`). 11 hair styles (`HAIRSTY`, rebuilt in `makeStudent`: cap + temples + per-style pieces, hair material double-sided), 16 hair colours; wand = wood colour `WOODC` / core glow `WCOREC` / handle style `WANDSTY` (shown in the right hand; step 2 uses `POSES[4]` to raise the wand). Panel scrollbar hidden (`scrollbar-width:none`). Debug hooks: `window.__rotY` (rotate stage chars), `window.__stageCam(cam)` (override stage camera) — handy for hair/outfit close-ups.
- 2026-10-17 (session 2) — **Two new random maps** (protocol `v5`): ❄️ `hogsmeade` (2600x1700 snowy village: houses/stalls/lamps/barrels/well, instanced pines, mountains + distant castle, falling snow `SNOW`) and 🕯️ `greathall` (2400x1500: 4 long tables as chains of `table` circles `hgt 1.8`, carpet aisle, pillars, tall arched windows, house crest banners, 120 floating candles). Data: `genHogsmeade/genGreatHall` (+`MAPS.greathall.tables`), builders `buildHogsmeade/buildGreatHall`, `POOLS` entries, music/ambience mapped to forest/castle tracks, minimap colours for the new `k` kinds. Frame cost ~8 ms (285-338 draw calls). **Testing gotcha:** don't override `Math.random` for the whole of `hostStart()` — three.js UUIDs use it and `batchStatic` then merges every material into one (screen goes dark/odd). Use a counter that only fakes the first call.
- 2026-10-17 (session 2) — **House look pass 2** (user: crest/colours/fonts not good, backgrounds should match the house): crests redrawn (`crestSVG` with hand-drawn lion/snake/badger/eagle `CREST_ANI`, richer house colours, ribbon in 'Cinzel Decorative'); creator headings use 'Cinzel Decorative' (Google font added). Each house now has its own 3D backdrop built by `buildHouseEnvs()` (`STAGE.env[h]`, shown only in creator step 2): Gryffindor fireplace+red banners, Slytherin green dungeon arches+lanterns, Hufflepuff round doors+plants+barrels, Ravenclaw starry tower+bookshelves; banners use `crestTex(h)` (SVG→canvas texture). Env point lights are always in the scene (intensity 0 when inactive) to avoid shader recompiles; default stage windows (`STAGE.wins`) are hidden except for Ravenclaw.
- 2026-10-17 (session 2) — **Creator redesign** (ref: "Enchant Life" screen): 2 steps — 1 หน้าตา (left icon tabs ใบหน้า/ผม/เสื้อคลุม/เนคไท + option panel + name field) → 2 เลือกบ้าน (big house name + 4 crest cards at the bottom). Picking a house: character spins + shockwave ring (`STAGE.switchT`, `STAGE.burst`), blends to a per-house pose (`POSES`, smoothed via `o.pp`, kept across rebuilds), stage background/fog/rim light/runes/dust/banners + DOM tint (`.crTints`) fade to the house tone (`stageTone`, `HOUSES[].gl/bg`). Lobby characters also use their house pose. Crests are **drawn by us as SVG** (`crestSVG`: shield pattern + animal emoji + ribbon), NOT the Warner Bros artwork (public repo → copyright); the user may want nicer art later. Globals `crOpen/crStep/crTab`; `openCreator/closeCreator/crGo/crSetHouse`; creator hides `.mleft`/`.mprof` while open.
- 2026-10-17 — HANDOFF: added §0 questions to ask the user at the start of the next session; refreshed code map and user notes.
