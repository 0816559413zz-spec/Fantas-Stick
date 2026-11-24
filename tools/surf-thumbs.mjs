// Paint palette thumbnails: how each ground surface (mapbuild/model.js SURF) really looks in the game.
// 1) node tools/surf-thumbs.mjs            → maps/build/tmp-surf.json (flat test map, one 14 m patch per surface)
// 2) node tools/headless.js --url "mapbuild.html?export=tmp-surf" --js tools/mb-export.js --quiet
// 3) open the game on tmp-surf in a real GPU browser and run tools/surf-thumbs-shots.js (see its header) → shots/surf_<k>.jpg
// 4) node tools/surf-thumbs.mjs --copy     → mapbuild/surf/<k>.jpg + deletes maps/build/tmp-surf.json
// 5) remove the exported temp map: POST /api/mb-unexport?id=tmp-surf on the serve.py server (assets/maps/tmp-surf.* + manifest entry)
// Map Builder Paint shows mapbuild/surf/<k>.jpg in each palette button (falls back to the plain colour). New SURF entry = rerun all steps.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MD = await import(pathToFileURL(path.join(ROOT, 'mapbuild', 'model.js')).href);
const { newMap, pack, SURF, C } = MD;
export const COLS = 6, CELL = 18, PATCH = 14, PAD = 12;
export const patchAt = i => ({ x: PAD + (i % COLS) * CELL + PATCH / 2, z: PAD + Math.floor(i / COLS) * CELL + PATCH / 2 });

if (process.argv.includes('--copy')) {
  const dir = path.join(ROOT, 'mapbuild', 'surf'); fs.mkdirSync(dir, { recursive: true }); let n = 0;
  for (const s of SURF) { const f = path.join(ROOT, 'shots', 'surf_' + s.k + '.jpg'); if (fs.existsSync(f)) { fs.copyFileSync(f, path.join(dir, s.k + '.jpg')); n++; } }
  const b = path.join(ROOT, 'maps', 'build', 'tmp-surf.json'); if (fs.existsSync(b)) fs.unlinkSync(b);
  console.log('copied', n, 'thumbnails → mapbuild/surf/');
} else {
  const rows = Math.ceil(SURF.length / COLS), W = PAD * 2 + COLS * CELL, H = PAD * 2 + rows * CELL;
  const M = newMap({ id: 'tmp-surf', name: 'tmp surface thumbnails', W, H, surf: 6 });
  Object.assign(M, { sky: 'day', fog: null, modes: ['ffa'], autoProps: 0, skirt: 20 });
  SURF.forEach((s, si) => { const p = patchAt(si);
    for (let j = 0; j < M.ny; j++) for (let i = 0; i < M.nx; i++) { const x = i * C, z = j * C; if (Math.abs(x - p.x) <= PATCH / 2 && Math.abs(z - p.z) <= PATCH / 2) M.sf[j * M.nx + i] = si; } });
  M.objs.push({ id: 'o1', t: 'spawn', x: 4, z: 4, y: 0, rot: 0 }, { id: 'o2', t: 'spawn', x: W - 4, z: H - 4, y: 0, rot: 0 }); M.seq = 3;
  fs.writeFileSync(path.join(ROOT, 'maps', 'build', 'tmp-surf.json'), JSON.stringify(pack(M)));
  console.log('maps/build/tmp-surf.json', W + '×' + H, SURF.length, 'patches');
}
