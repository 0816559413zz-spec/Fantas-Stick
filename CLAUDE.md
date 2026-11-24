# CLAUDE.md

Rules for every Claude session in this repo. Kept short on purpose: details live in the linked docs, one source per topic.
**Priority:** the user's latest message > `guides/WORKFLOW-WITH-CLAUDE.md` (language, style, scope) > this file > other docs.

## Core rules (always)

1. **Start:** read only the top of `HANDOFF.md` ("Latest notes" + §0 START HERE; use grep, never the whole file). Find code with `CODEMAP.md`, then read only the lines you need from the right `js/` file. Feature history is in `notes/` — open only when relevant.
2. **Language / style / scope:** follow `guides/WORKFLOW-WITH-CLAUDE.md` (Thai by default, short, answer only what was asked, no progress narration while working, off-topic ideas go to a separate session). Technical terms, file names, commands, error messages stay verbatim. Risky/irreversible actions (delete data, force push): explain fully, then wait. Code comments: short English. Commit messages and project docs: written normally.
3. **After every code task:** run `node tools/check.js` (must say OK), `node tools/codemap.js`, and `node tools/fx-check.js` if you touched `assets/fx/` (no ✗ allowed). Update `HANDOFF.md` (status, known issues, new note at the top of "Latest notes") and `notes/CHANGELOG.md`. Then commit and push with the code.
4. **Concept / design-only work** (no game edits requested): do not touch the game, do not commit/push automatically.
5. **Design before code:** read `notes/PROJECT-DESIGN-DIRECTION.md` before designing classes/skills/modes/maps. Think of skills with their role in Castle Strike in mind, but wait until the class is done before detailed interaction breakdown. No confirmed castle layout exists yet: rough sketches only, and say whether an image is an explanation or an approved layout.
6. **Skill design/edit:** always ask the gameplay team the questions in `guides/SKILL-DESIGN.md` §"Claude ต้องถามทุกครั้ง" (incl. Ragdoll: yes/no, seconds, height, push — `guides/RAGDOLL-STANDARD.md`). Never guess the answers.
7. **Protocol:** bump `PREFIX` (`wizduel-th-vN-`, in `js/10-net.js`) whenever the snapshot/network protocol changes.
8. **Git:** commit with the repo-local noreply identity (check `git config --local user.email` first — the global one is a work email). Pushing to `main` deploys GitHub Pages.
9. **The user doesn't code:** do the work for them.

## Architecture in one line

Game = `index.html` (HTML + loader) + `css/game.css` + `js/NN-*.js` (joined into one module in `FILES` order — see HANDOFF §5). No build step.

## Where to look (by task)

| Task | Read first |
|---|---|
| Any Tool (`hub.html`, opened by `Tools.bat`) | `guides/TOOL-UI-RULES.md`: Studio-style black UI (no game theme), use `hub/tool-ui.css`, register in `hub/tools.json`, sound off by default (`hub/tool-sound.js` switch) |
| VFX (`assets/fx/**/*.fx.json`, bound in `assets/fx/bind.json`) | `VFX-STUDIO-CLAUDE.md`, format `guides/FX-FORMAT.md` (read it instead of js). Check with contact sheets (`studio.html?fx=…&sheet=…&save=…` via `python tools/serve.py`, then Read `shots/…`), HANDOFF §0 tips. **Always show new/changed VFX in VFX Studio** (`studio.html?fx=<group>/<name>` in the browser pane) and send the contact sheet in chat before asking approval |
| VFX storyboards | `git pull` first (`guides/STORYBOARD-SYNC.md`); read `storyboard/sb-<id>.md` (open sketches with Read); follow `VFX-STUDIO-CLAUDE.md` §4b; write results to `storyboard/boards.json`, then `python tools/serve.py --sb-md` |
| Bugs (`bugs.html`) | `bugs/BUGS.md` (open pictures with Read). After fixing: in `bugs/bugs.json` set `status:"fixed"` + short Thai `reply`, then `python tools/serve.py --bugs-md` |
| Review Board (`review.html`) | `review/REVIEW.md`; act only on status `change` (✏️) per the user's comment (open pictures with Read). When done set `status:"wait"` + short Thai `reply`, then `python tools/serve.py --review-md`. **Never set `ok` yourself.** After finishing work the user must review (VFX/pose/new skill), add a `wait` entry with how to view it, without being asked |
| Reference maps (`mapedit.html`) | `maps/MAPS.md`, then `maps/<id>.md` and open `maps/<id>.png`; format `guides/MAP-FORMAT.md`. These are design references, not locked layouts |
| Real maps (`mapbuild.html` Map Builder) | `guides/MAP-BUILDER.md`, `guides/MAP-STANDARD.md` (standard for ALL maps; read before a new map or moving fcs; never build a new map as code). Source `maps/build/<id>.json` → ⬆ send to game → `assets/maps/<id>.json` + `.glb` + manifest. Asset library `assets/mapkit/kit.json` (`node tools/mapkit-gen.js`) |
| Map rooms | A map = one file in Map Builder, editable everywhere. Prefab rooms (`maps/build/room-<id>.json`) are optional reusable pieces: "แตกห้องเข้าแผนที่" then edit freely. Rooms still in code (`js/02-room-<id>.js`, old fcs) follow `guides/MAP-ROOMS.md` until migrated (MAP-STANDARD round 6) |
| Sketch (`sketch.html`) | `sketch/SKETCH.md`, then `sketch/<id>.md` and open `sketch/<id>.png` (image = what the user wants/problem, arrows/circles = pointing, numbers = order, notes in .md = explanation). Original backgrounds in `sketch/img/` |
| Concepts (`concepts.html`) | `concepts/CONCEPTS.md` (open images with Read); status `pick` = chosen direction. **Main art style = watercolor (user 2026-11-24)**: write new concept prompts as watercolor, add them as items in `concepts/concepts.json`, then `python tools/serve.py --concepts-md` |
| Other topics | Relation map in `guides/WORKFLOW-WITH-CLAUDE.md` §1 |
