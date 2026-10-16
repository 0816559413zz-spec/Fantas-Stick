# HANDOFF — Wizard Duel (repo: Fantas-Stick)

> **For the next Claude Code session (any device): read this file first.**
> **Rule: update this file at the end of every task** — the status, changelog, and known issues sections at minimum. Commit and push it together with the code.
> Last updated: 2026-10-16

---

## 1. What this is
A 3D third-person (over-the-shoulder, Hogwarts Legacy style) wizard dueling browser game.
**The entire game is one file: `index.html`** (~3,750 lines, inline CSS + one `<script type="module">`).
Personal, non-commercial fan project made with/for the user and their friends. UI text is **Thai**; code comments are Thai.

- Live (GitHub Pages): https://0816559413zz-spec.github.io/Fantas-Stick/
- Repo: https://github.com/0816559413zz-spec/Fantas-Stick (public, branch `main`, Pages serves `/` of `main`)
- Commit identity used: `0816559413zz-spec <292358957+0816559413zz-spec@users.noreply.github.com>` (repo-local config — keep the noreply email; do NOT use a work email)

## 2. The user
- Thai speaker, no programming experience → explain in Thai, simply. Do the work for them.
- Plays with friends online; wants Harry Potter / Hogwarts Legacy vibes.
- Prefers: everything in a single HTML file, maps random (not selectable), in-game 📖 guide kept up to date.

## 3. Tech stack (all from CDN, no build step)
- **Three.js 0.160.0** via importmap (`unpkg.com/three@0.160.0`) + addons: EffectComposer, RenderPass, UnrealBloomPass, OutputPass. `gl.useLegacyLights=true` (light intensities tuned for legacy mode).
- **PeerJS 1.5.4** (classic script, global `Peer`) — WebRTC data + voice. Uses the public PeerJS cloud for signaling only. Room id = `PREFIX + 5-char code`. **`PREFIX='wizduel-th-v3-'` — bump the version whenever the network protocol/snapshot changes** so old clients can't join new hosts.
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

## 5. Code map (`index.html`, approximate line numbers — grep the section headers)
| Section (Thai header) | What |
|---|---|
| ~10 `<style>` | UI theme tokens on `:root` (`--gold`, `--panel`, `--corners` gold corner brackets, `--fd` display font). `.card` = gold-framed panel used everywhere (menu profile, lobby panels, guide, buff, results, meeting). Menu `.mleft/.mi/.mprof`, lobby `.ltop/.lmodes/.lright/.mcard`, buff cards `.boon .bc` |
| ~160 HTML | `#menu` (logo + text menu left, profile card bottom-right), `#guide`, `#lobby` (top bar w/ room code + copy, mode list left, selected-mode card + start button right), overlays `#buff/#over/#meet`, `#voice` |
| ~278 `พื้นฐาน` | utils (`$`, `rnd`, `clamp`, `lerp`, `store`, `toast`) |
| ~293 `ค่าคงที่ของเกม` | `MAPS`, `MODES`, `PDEF` (spells), `EDEF` (enemies), `POOLS`, `BUFFS` (each has icon `i`) |
| ~385 `เครือข่าย` | host/join, `hostOnData` (hello/in/team/pick/vote), `clientOnData` |
| ~457 `ฝั่งโฮสต์` | lobby, `hostStart`, `placeAll`, `respawn`, `hostTick`, `updatePlayer`, projectiles, damage, enemies + boss AI, `modeLogic`, `endMatch` |
| ~1156 `โหมดพิเศษ` | `modeInit`, training, Quidditch, race, battle royale, Voldemort mode, `bombTick`, `modeSnap` |
| ~1465 | `makeSnap` + host loop |
| ~1498 `ไมค์` | mesh voice chat |
| ~1587 `การควบคุม` | keyboard/mouse → `INPUT` |
| ~1624 `เสียง` | synth SFX `snd()` (tries `playBuf` file first), file audio engine (`SFXN/SFXV/SFXR/SFXSYN`, `loadSfx`, `ambTick`, `wantTrack`/`fileMusicTick` music switching incl. boss + win/lose stingers), "เพลงของฉัน" (`MY`, IndexedDB), synth music fallback (`musicTick`) |
| ~1800 `ฝั่งแสดงผล` | `setScreen` (also sets `body[data-screen]`), `onLobby`, `onSnap`, particles, `fx(ev)`, overlays (`syncOverlays` buff cards, `showOver` results) |
| ~2066 `โลก 3D` | renderer + bloom (`rpass` = RenderPass), sky, maps, cloth, `makeStudent`, `makeEnemy`, camera |
| ~2816 `เวทีเมนู/ล็อบบี้` | `stage` scene, `stageSpots(L)` (host centre, spread out; team = blue left / red right; online shows empty slots), `stageChar`, `stageIdle`, `renderStage` (camera auto-fits to player count + aspect), `drawStageLabels` (name plates, staggered when they overlap; host clicks plate = move team) |
| ~3226 | mode visuals (`syncModeObjs`), roles, meeting UI |
| ~3390 | `render()` loop |
| ~3447 `ชิ้นส่วน HUD` | canvas HUD kit: `plate`, `frameBox`, `drawBossBar` (top-centre boss HP with damage trail), `spellDia` (diamond spell slot), `thinBar`; then `drawHUD`, `drawModeHUD`, `drawBottom` (bottom-left emblem = ult ring + HP/shield bars; bottom-right diamond cluster Q/E/R/F + small row LMB/RMB/Space/X/B; Voldemort mode = its own diamond row), `drawBoard` (Tab) |
| ~2075 `โลก 3D` top | renderer, `QUAL`/`applyQuality`/`qualTick`, `batchStatic`, `stoneMat` cache |
| ~3684 `เมนู / ล็อบบี้ (DOM)` | menu wiring, lobby plate click, copy code, `renderLobby`, debug object `window.WD` |

## 6. Game content (current)
**Modes** (`MODES`): 🗝️ Dungeon Co-op (1–6, waves "floors", boss raid every 5: dragon 3-phase / spider queen 3-phase) • 🎯 Training (dummies, parry practice, host ends with button) • ⚔️ Duel 1v1 • 💥 FFA • 🛡️ Team 2v2/3v3 • 🏟️ Quidditch (team, pitch map, ball + golden snitch) • 🏁 Broom race (10 rings × 2 laps) • 🌀 Battle royale (forest map, shrinking zone, unlock spells by items) • 🐍 Find Lord Voldemort (Among Us style, 4–6, roles: นักเรียนฮอกวอตส์ / ลอร์ดโวลเดอมอร์ / ผู้เสพความตาย at 6 players).
**Maps** (random unless the mode forces one): 🏰 castle (night), 🌲 forest (large, trees/rocks/stone circle), 🏟️ Quidditch pitch (sunset).
**Controls:** click = pointer lock • WASD/mouse • LMB bolt • RMB shield (parry window 0.28 s) • Q fire • E stun • R push • F pull • Space dodge (fly: up) • X ultimate • B broom • C descend • Tab score • V push-to-talk • M music. Voldemort mode: E task • Q kill • R report • F emergency meeting.
Can't cast on a broom except in Quidditch/race. Stun or web knocks you off the broom.

## 7. How to run / test
- Just open `index.html` in Chrome/Edge (internet needed for CDN + PeerJS signaling). Solo play works without other players.
- For the Claude Browser pane, file:// can't be scripted — serve over http. `.claude/launch.json` (git-ignored, recreate if missing) runs `python -m http.server 8765 --bind 127.0.0.1` as `wizardduel`. Any static server works. **The browser caches `index.html` — load `http://localhost:8765/?v=N` with a new N after each edit.** Set the viewport to 1280x720 for screenshots.
- **Debug object `window.WD`** (console): `WD.G` (host state), `WD.VIEW`, `WD.INPUT`, `WD.hostStart()`, `WD.hostToLobby()`, `WD.addPlayer(id,name,color)` (fake bots for multiplayer modes), `WD.hostVote`, `WD.setYaw`, `WD.render(dt,now)`, `WD.camHook=(cam)=>{...}` (override camera for screenshots), `WD.PM3`, `WD.MO`, `WD.ROLE`.
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
- ⚠️ UI not designed for phones (<900px wide the lobby panels overlap the stage). Not checked with a real online friend yet (only host-side online lobby with room code).
- ⚠️ Graphics are low-poly primitives (no external models). Heavy maps (forest) may lag on weak PCs.
- `index.2d-backup.html` (old 2D version) is git-ignored and only exists on the original PC.

## 9b. Audio research
(Implemented 2026-10-17 — see the audio bullet in section 3. To re-encode: download sources listed in `audio/CREDITS.md`, ffmpeg via `pip install imageio-ffmpeg`, trim + peak-normalise to -2 dB, mono q2 for SFX, stereo q1 for music.)
`research/audio-assets.md` (Sonnet subagent, 2026-10-16): licence-checked free music/SFX picks. Verdict: Kenney (CC0) + OpenGameArt CC0 items for SFX, Incompetech/Kevin MacLeod (CC-BY 4.0, needs credits) for music; Pixabay/Sonniss/Mixkit/Zapsplat/Tabletop Audio rejected for raw files in a public repo. Plan: OGG files in `audio/`, lazy `fetch`+`decodeAudioData`, keep the synth as fallback. Nothing downloaded yet.
User asked about real Harry Potter music: told them not to put it in the public repo (copyright, takedown risk); offered a "เพลงของฉัน" button that plays an mp3 from the player's own PC locally (not built yet).

## 10. Ideas the user may ask for next
Minimap (bottom-left, Hogwarts Legacy style), house-crest picker in the menu, vents/secret passages for Voldemort, task mini-games, 3-player Voldemort mode, more bosses (basilisk), more maps (Hogsmeade, Great Hall), cosmetics, ranked/MMR, mobile controls.

## 11. Changelog
- 2026-10-16 — v1 2D prototype → 3D third-person (Three.js) → bloom, cloth, student uniforms, forest map.
- 2026-10-16 — Broom flying, spiders/pixies, Quidditch pitch map, random maps, guide button, synth sound + music; published to GitHub Pages.
- 2026-10-16 — Modes: Quidditch, broom race, battle royale, impostor, training, dungeon co-op with 3-phase dragon/queen boss raids; protocol `v3`.
- 2026-10-16 — Impostor mode renamed to 🐍 "หาลอร์ดโวลเดอมอร์" (Voldemort / Death Eater / Hogwarts students, Avada Kedavra kill FX).
- 2026-10-16 — Added this HANDOFF.md + CLAUDE.md.
- 2026-10-16 — **Whole new UX/UI** (refs: Hogwarts Legacy style + Fortnite/Valorant lobby + Hades boon cards + Elden Ring thin HUD): navy/gold theme with Cinzel, text-only main menu with your character standing on a 3D rune dais, 3D party lobby (everyone's character on stage, name plates, empty slots, click plate to swap team), mode list + selected-mode card + big gold start button, Hades-style buff cards, new results/meeting/guide styling, canvas HUD redone (diamond spell cluster, ult emblem, thin bars, boss bar, gold crosshair, framed scoreboard). No protocol change (PREFIX still v3).
- 2026-10-16 — **Performance pass** (~3x faster frames): half-res bloom, no canvas MSAA, pixel ratio ≤1, shadows every 2nd frame at 2048, static mesh batching, cached stone materials, fewer pool lights, auto/high/low graphics setting with auto resolution scaling, `WD.PROF` profiler. Audio asset research report added.
- 2026-10-17 — **Real audio**: CC0/CC-BY music per map + boss + imp + win/lose stingers, 73 CC0 SFX with synth fallback, footsteps, UI click/hover sounds, ambience loops, real wind for brooms, "เพลงของฉัน" local-music button (IndexedDB, N = next), credits section in the guide + `audio/CREDITS.md`.
