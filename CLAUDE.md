# CLAUDE.md

1. **Read `HANDOFF.md` first** — architecture, testing tricks, current status. Then use `CODEMAP.md` to find code: read only the lines you need from the right `js/` file, never whole files (save tokens). Feature history is in `notes/` — open only when relevant.
2. **After every task:** run `node tools/check.js` (must say OK) and `node tools/codemap.js`, update `HANDOFF.md` (status, known issues, latest changelog line) + `notes/CHANGELOG.md`, then commit and push with the code.
3. The user speaks Thai and doesn't code: reply in Thai, keep it simple, and do the work for them.
4. Game = `index.html` (HTML + loader) + `css/game.css` + `js/NN-*.js` (joined into one module in `FILES` order — see HANDOFF §5). No build step. Bump `PREFIX` (`wizduel-th-vN-`, in `js/10-net.js`) whenever the snapshot/network protocol changes.
5. Commit with the repo-local noreply identity (check `git config --local user.email` first — the global one is a work email); pushing to `main` deploys GitHub Pages.
