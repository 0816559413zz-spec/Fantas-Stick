// Swap the low-poly gorge pines of a Map Builder map for the painterly wind trees (kit ptree/*, tools/ptree-export.js).
// Same position / rotation; height roughly kept (pine a/b/c/d → tree a/b/c/d with a size factor, small random spread).
// Usage: node tools/ptree-place.mjs [mapId=fcs-file]   then export:  node tools/headless.js --url "mapbuild.html?export=<id>" --js tools/mb-export.js --quiet
//        (close/reload Map Builder on that map afterwards: it autosaves). Re-running does nothing once no pines are left.
import fs from 'fs';
import * as MD from '../mapbuild/model.js';
const id = process.argv[2] || 'fcs-file';
const MAP = { pine_a: ['tree_a', 1.1], pine_b: ['tree_b', 1.25], pine_c: ['tree_c', 1.2], pine_d: ['tree_d', 1.3], pine_s: ['tree_c', 0.8] };
const path = 'maps/build/' + id + '.json', M = MD.unpack(JSON.parse(fs.readFileSync(path, 'utf8')));
let n = 0, sd = 20261123; const R = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
for (const o of M.objs) {
  const m = /^kit:gorge\/(pine_[a-z])$/.exec(o.t || ''); if (!m || !MAP[m[1]]) continue;
  const [t, k] = MAP[m[1]];
  o.t = 'kit:ptree/' + t; o.s = +((o.s || 1) * k * (0.9 + R() * 0.2)).toFixed(3); n++;
}
fs.writeFileSync(path, JSON.stringify(MD.pack(M)));
console.log(id + ':', n, 'pines → ptree');
