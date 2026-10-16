# HANDOFF — Wizard Duel (repo: Fantas-Stick)

> **For the next Claude Code session (any device): read this file first.**
> **Rule: update this file at the end of every task** — the status, changelog, and known issues sections at minimum. Commit and push it together with the code.
> Last updated: 2026-10-16

---

## 1. What this is
A 3D third-person (over-the-shoulder, Hogwarts Legacy style) wizard dueling browser game.
**The entire game is one file: `index.html`** (~3,400 lines, inline CSS + one `<script type="module">`).
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
- Web Audio — all SFX and music are synthesized at runtime (no audio files).
- Google Font Kanit.

## 4. Architecture (important)
- **Host-authoritative.** The host runs the whole simulation in `hostTick()` (setInterval 60 Hz) in a **2D plane** (x,y in pixels) plus height (`p.z` / `e.h` / `pr.h` in 3D units). Clients only send input (`{t:'in',i:INPUT}` every 30 ms) and render snapshots.
- Host broadcasts `makeSnap()` at 30 Hz (`{t:'s',s}`); the host itself renders from the same snapshot via `onSnap()` at 60 Hz. Events (`EVL`/`EVN` → `ev` array) drive effects/sounds through `fx(ev)`.
- Private per-player messages: `sendPriv(id,{...})` → client `{t:'priv',m}` → `onPriv(m)` (used for secret roles in the Voldemort mode). Never put secret data in the snapshot.
- Coordinates: 1 3D unit = 20 sim px. `tx(x)=(x-MW/2)/20`, `tz(y)=(y-MH/2)/20`. Current map size `MW,MH`, obstacles `OBS` (each `{x,y,r,k,hgt}`; flying higher than `hgt` passes over).
- Maps are generated deterministically (seeded `mulberry`) so every client builds the same world. `buildWorld(id)` rebuilds the 3D scene when `builtMap` differs from the lobby/snapshot map.
- Two canvases: `#gl` (WebGL 3D) and `#cv` (2D overlay for HUD, name tags, damage numbers). DOM overlays: menu, lobby, buff picker, results, meeting vote, guide, voice panel.
- Camera: pointer lock; mouse → `yaw/pitch`; WASD is camera-relative (`INPUT.mx/my`); aim `INPUT.ax/ay` + pitch `INPUT.ap`. Spells **auto-lock vertically** onto a foe within ~0.3 rad of the aim (`shoot()`).

## 5. Code map (`index.html`, approximate line numbers — grep the section headers)
| Section (Thai header) | What |
|---|---|
| ~200 `พื้นฐาน` | utils (`$`, `rnd`, `clamp`, `lerp`, `store`, `toast`) |
| ~215 `ค่าคงที่ของเกม` | `MAPS` (castle / forest / pitch generators), `MODES`, `PDEF` (spells), `EDEF` (enemies: gob, wiz, troll, spl, spider, queen, pixie, dragon, dummy), `POOLS`, `BUFFS` |
| ~305 `เครือข่าย` | host/join, `hostOnData` (hello/in/team/pick/vote), `clientOnData` |
| ~380 `ฝั่งโฮสต์` | lobby, `hostStart` (picks map: `MODES[m].map` or random), `placeAll`, `respawn`, `hostTick`, `updatePlayer` (broom, shield, casting rules per mode), projectiles, damage, enemies + boss AI (`bossPhase`), `modeLogic`, `endMatch` |
| ~1076 `โหมดพิเศษ` | `modeInit`, training dummies, Quidditch (`quidTick`, `snitchTick`), broom race, battle royale (zone + items), Voldemort mode (tasks, kills, meetings, votes, `impCheck`), `bombTick`, `modeSnap` |
| ~1385 | `makeSnap` + host loop |
| ~1418 `ไมค์` | mesh voice chat (each player calls everyone; team-only gating) |
| ~1507 `การควบคุม` | keyboard/mouse → `INPUT` (`e.code` based, works with Thai layout) |
| ~1544 `เสียง` | synth SFX `snd(name,{x,y})` with reverb + stereo pan, wind, generative music per map (`THEMES`) |
| ~1720 `ฝั่งแสดงผล` | `onLobby`, `onSnap`, particles helpers, `fx(ev)` (all event visuals), overlays |
| ~1985 `โลก 3D` | renderer + bloom, sky (night/sunset), `buildCastle/Forest/Pitch`, cloth sim (`makeCloak/updateCloth`), `makeStudent` (uniform, broom, cocoon), `makeEnemy`, particles, shapes/telegraphs, light pool, camera, `syncPlayers/Enemies/Proj` |
| ~2987 | mode visuals (`syncModeObjs`), roles (`onPriv`), meeting UI (`syncMeeting`) |
| ~3152 | `render()` loop, HUD (`drawHUD`, `drawModeHUD`, `drawBottom`) |
| ~3365 | menu/lobby DOM wiring, `renderLobby`, debug object `window.WD` |

## 6. Game content (current)
**Modes** (`MODES`): 🗝️ Dungeon Co-op (1–6, waves "floors", boss raid every 5: dragon 3-phase / spider queen 3-phase) • 🎯 Training (dummies, parry practice, host ends with button) • ⚔️ Duel 1v1 • 💥 FFA • 🛡️ Team 2v2/3v3 • 🏟️ Quidditch (team, pitch map, ball + golden snitch) • 🏁 Broom race (10 rings × 2 laps) • 🌀 Battle royale (forest map, shrinking zone, unlock spells by items) • 🐍 Find Lord Voldemort (Among Us style, 4–6, roles: นักเรียนฮอกวอตส์ / ลอร์ดโวลเดอมอร์ / ผู้เสพความตาย at 6 players).
**Maps** (random unless the mode forces one): 🏰 castle (night), 🌲 forest (large, trees/rocks/stone circle), 🏟️ Quidditch pitch (sunset).
**Controls:** click = pointer lock • WASD/mouse • LMB bolt • RMB shield (parry window 0.28 s) • Q fire • E stun • R push • F pull • Space dodge (fly: up) • X ultimate • B broom • C descend • Tab score • V push-to-talk • M music. Voldemort mode: E task • Q kill • R report • F emergency meeting.
Can't cast on a broom except in Quidditch/race. Stun or web knocks you off the broom.

## 7. How to run / test
- Just open `index.html` in Chrome/Edge (internet needed for CDN + PeerJS signaling). Solo play works without other players.
- For the Claude Browser pane, file:// can't be scripted — serve over http. On the original Windows PC we used a PowerShell HttpListener (`serve.ps1` in the session scratchpad) via `.claude/launch.json` (name `wizardduel`, port 8765). Any static server works (`npx serve`, `python -m http.server`).
- **Debug object `window.WD`** (console): `WD.G` (host state), `WD.VIEW`, `WD.INPUT`, `WD.hostStart()`, `WD.hostToLobby()`, `WD.addPlayer(id,name,color)` (fake bots for multiplayer modes), `WD.hostVote`, `WD.setYaw`, `WD.render(dt,now)`, `WD.camHook=(cam)=>{...}` (override camera for screenshots), `WD.PM3`, `WD.MO`, `WD.ROLE`.
- Typical test: click `#btnSolo`, add bots with `WD.addPlayer`, set `WD.G.mode='quid'`, `WD.hostStart()`, then drive `WD.render` from a setInterval (rAF pauses when the pane is hidden) and collect `window.onerror` messages.
- Not testable alone: real online play between devices, voice chat.

## 8. Deploy
`git add -A && git commit && git push` on `main` → GitHub Pages rebuilds in ~1 min (check: `gh api repos/0816559413zz-spec/Fantas-Stick/pages/builds/latest`). End commit messages with the Co-Authored-By line used in history.

## 9. Status / known issues
- ✅ All 9 modes run without console errors in automated solo+bot tests (2026-10-16). Quidditch goal/catch, race rings, dragon phases, Voldemort roles/kill/meeting/vote verified.
- ⚠️ Not yet verified with real friends online: Voldemort-mode voting over the network, voice in that mode, battle-royale/quidditch sync under real latency.
- ⚠️ Host can technically see secret roles via console (accepted — friends only).
- ⚠️ Graphics are low-poly primitives (no external models). Heavy maps (forest) may lag on weak PCs.
- `index.2d-backup.html` (old 2D version) is git-ignored and only exists on the original PC.

## 10. Ideas the user may ask for next
Vents/secret passages for Voldemort, task mini-games, 3-player Voldemort mode, more bosses (basilisk), more maps (Hogsmeade, Great Hall), cosmetics, ranked/MMR, mobile controls.

## 11. Changelog
- 2026-10-16 — v1 2D prototype → 3D third-person (Three.js) → bloom, cloth, student uniforms, forest map.
- 2026-10-16 — Broom flying, spiders/pixies, Quidditch pitch map, random maps, guide button, synth sound + music; published to GitHub Pages.
- 2026-10-16 — Modes: Quidditch, broom race, battle royale, impostor, training, dungeon co-op with 3-phase dragon/queen boss raids; protocol `v3`.
- 2026-10-16 — Impostor mode renamed to 🐍 "หาลอร์ดโวลเดอมอร์" (Voldemort / Death Eater / Hogwarts students, Avada Kedavra kill FX).
- 2026-10-16 — Added this HANDOFF.md + CLAUDE.md.
