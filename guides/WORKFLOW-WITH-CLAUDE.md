# Workflow with Claude (applies to EVERY session)

User-defined rules for all Claude sessions in this repo. They override the explain-as-you-go habits in older docs (CLAUDE.md rules 3 and 3b, AGENTS.md).

## 1. Stay on topic

- Talk and act only on what this session was asked to do, plus parts that touch it.
- Find "parts that touch it" from the repo docs (map below, or `docgraph.html` / `docgraph/graph.json`), not from memory. Read only those docs.
- If the user suggests something unrelated to this session's topic: do NOT do it inline. Propose a separate session (nested session via `start_session`) with a short brief. Then continue the current task.
- Small related fixes in files you already touch are fine. Another topic's files are not.

### Relation map (what touches what)

| Working on | Also check (docs) |
|---|---|
| Skill / class | `guides/CLASS-GUIDE.md`, `guides/SKILL-DESIGN.md`, `guides/ANIMATION.md` (poses: bend joints + timing), `notes/PROJECT-DESIGN-DIRECTION.md`; VFX (`VFX-STUDIO-CLAUDE.md`, `guides/FX-FORMAT.md`); balance (`tune.html` / `assets/tune.json`); map/environment interaction (`guides/Destruction.md`, `designs/element-surfaces.md`, `designs/element-environment-ideas.md`); role in Castle Strike (`designs/castle-gameplay-concept.md`) |
| VFX | `VFX-STUDIO-CLAUDE.md`, `guides/FX-FORMAT.md`, `guides/VFX.md`; owning skill's design doc in `designs/`; `guides/OPTIMIZE.md` (cost); `guides/PRELOAD-STANDARD.md` §2 (no mid-fight shaders) |
| Balance / numbers | `assets/tune.json`, the skill/class doc, `review/REVIEW.md` (approved values) |
| Castle Strike mode | `designs/castle-gameplay-concept.md`, `notes/PROJECT-DESIGN-DIRECTION.md`, `maps/firstcastlestrike.md`, map guides; class roles; Dev Mode (`HANDOFF.md`) |
| Map / Map Builder | `guides/MAP-STANDARD.md` (standard + fcs migration plan), `guides/MAP-DESIGN.md`, `MAP-BUILDER.md`, `MAP-FORMAT.md`, `maps/MAPS.md`; destruction + environment docs; Castle Strike concept |
| Environment interaction / destruction | `guides/Destruction.md`, `designs/element-surfaces.md`, `designs/battlefield.md`; skills that hit terrain; map docs |
| Bug fix | `bugs/BUGS.md` entry + the code area only |
| Tool UI | `guides/TOOL-UI-RULES.md`, `hub/tools.json` |
| HUD (in-match) | `HANDOFF.md` HUD Editor entry; `js/66-hud4.js`, `js/66-hudlay.js`, `css/hud4.css`, `js/38-hud.js`; layout `assets/hud/layout.json` (edited in `hudedit.html`) |
| Graphics / perf / loading, or anything adding lights, materials, shaders, code-built meshes | `guides/PRELOAD-STANDARD.md` (rules + plan), `guides/OPTIMIZE.md` |

Keep this table updated when a new system or doc appears.

## 2. Replies

- Default language: **Thai** (user chose 2026-11-20). Short, simple words. Answer only what was asked.
- Style: `Fix: moved X to Y.` / `Done: ...` / `Need: <one decision>`.
- Fixing a bug without being asked for the cause: do not explain the cause.
- **While working: write NO progress text between tool calls** (no "now I'm testing…", "still recording…", "found the cause…"). Run tools silently. Speak only in the final reply, or earlier only to ask a blocking question.
- No preamble, no recap of the user's request, no step-by-step narration, no summary of what is visible.
- English only if the user asks for it.
- Keep identifiers, file names, commands, error messages verbatim.
- Risky / irreversible actions (delete data, force push): state clearly and fully, then wait.

## 3. Code

- Comments: short, English, just enough for Claude to understand. The user does not read code.
- Commit messages and project docs (`HANDOFF.md`, `notes/`): normal, English or existing style.
- Existing end-of-task steps still apply (`node tools/check.js`, `node tools/codemap.js`, HANDOFF/CHANGELOG, commit, push).
