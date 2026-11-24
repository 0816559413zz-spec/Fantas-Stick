// Sample arena for the modular ruin kit (node tools/ruin-assets.mjs): maps/build/ruin-demo.json
// Catalog row of every ruin/* piece (north strip) + a small Overwatch-style yard: two 4.5 m towers joined by a bridge you can walk under,
// 3 m side platforms with stairs / rubble ramps / ledges, arches, cover walls, pillars and rubble.
// Export: node tools/headless.js --url "mapbuild.html?export=ruin-demo" --js tools/mb-export.js --quiet
// Play: index.html?nosw&playmap=ruin-demo
import fs from 'fs';
import * as MD from '../mapbuild/model.js';
const INF = JSON.parse(fs.readFileSync('assets/mapkit/ruin.info.json', 'utf8'));
const W = 140, H = 100, Y0 = 36;   // yard occupies z Y0..Y0+60
const M = MD.newMap({ id: 'ruin-demo', name: 'Ruin Kit Demo', W, H, surf: 0 });
M.desc = 'Modular ruin kit (ruin/*): catalog + sample arena yard';
M.modes = ['ffa', 'tdm', 'coop']; M.random = 0; M.autoProps = 0; M.sky = 'day';
let id = 1; const nid = () => id++;
const put = (k, x, z, rot = 0, o = {}) => M.objs.push(Object.assign({ id: nid(), t: 'kit:ruin/' + k, x, z, y: 0, rot }, o));
// catalog: one row per strip along the north edge
{ let x = 4, z = 6; for (const k of Object.keys(INF)) { const w = INF[k].w; if (x + w > W - 4) { x = 4; z += 10; } put(k, x + w / 2, z); x += w + 2.5; } }
// yard (x 40..100, z Y0..Y0+60), centre (70, Y0+30)
const cx = 70, cz = Y0 + 30, P = (k, dx, dz, rot = 0, o) => put(k, cx + dx, cz + dz, rot, o), Q = Math.PI / 2;
// centre: towers 4.5 m + bridge (walk under it), reached from 3 m platforms by short stairs
P('floor_8', 0, 0); P('bridge_8', 0, 0);
for (const s of [-1, 1]) {
  P('plat_4x4_45', s * 6, 0); P('plat_8x4_3', s * 10, 0, Q);
  P('stairs_15', s * 9.5, 0, s < 0 ? Q : -Q, { y: 3 }); P('stairs_3', s * 15, 0, s < 0 ? Q : -Q);
}
// north / south walls with an arch gate, cover in front
for (const s of [-1, 1]) { const z = s * 18, r = s < 0 ? 0 : Math.PI;
  P('arch_4', 0, z, r); P('wall_full_4', -4, z, r); P('wall_window_4', 4, z, r); P('wall_slope_4', 8, z, s < 0 ? 0 : Math.PI); P('wall_end_2', -7, z, r);
  P('wall_half_4', 0, s * 10, r); P('wall_low_4', -8, s * 8, r); P('wall_low_4', 8, s * 8, r); P('pillar_round', -6, s * 12); P('pillar_round', 6, s * 12);
  P('wall_rubble_4', 0, s * 23, r); P('pillar_broken', 12, s * 14);
}
// corners: 3 m platforms with rubble ramps + ledges (diagonal symmetry)
P('plat_4x4_3', -18, 18); P('ramp_rubble_3', -18, 13, 0); P('walk_ledge_4', -14, 18);
P('plat_4x4_3', 18, -18); P('ramp_rubble_3', 18, -13, Math.PI); P('walk_ledge_4', 14, -18);
P('plat_8x8_3', -20, -18); P('stairs_3', -20, -11, Math.PI); P('wall_corner_half', -26, -26, 0);
P('plat_8x8_3', 20, 18); P('stairs_3', 20, 11, 0); P('wall_corner_half', 26, 26, Math.PI);
// scatter cover
P('column_fallen', -10, -5, 0.4); P('column_fallen', 10, 5, 0.4 + Math.PI); P('stone_block', -3, 6, 0.2); P('stone_block', 3, -6, 0.2 + Math.PI);
P('rubble_big', -24, 2); P('rubble_big', 24, -2); P('pillar_square', -24, 8); P('pillar_square', 24, -8); P('wall_corner_low', -26, 26, -Q); P('wall_corner_low', 26, -26, Q);
P('rubble_small', 12, 12); P('rubble_small', -12, -12); P('stones', 0, 12); P('stones', 0, -12); P('floor_4', -6, -8); P('floor_4', 6, 8); P('pillar_broken', -14, 4); P('wall_low_2', 14, -4, Q);
// spawns at the yard ends
[[cx - 26, cz], [cx + 26, cz], [cx, cz - 26], [cx, cz + 26], [cx - 12, cz - 24], [cx + 12, cz + 24], [cx - 26, cz + 10], [cx + 26, cz - 10]].forEach(([x, z]) => M.objs.push({ id: nid(), t: 'spawn', x, z, y: 0, rot: 0 }));
M.objs.push({ id: nid(), t: 'spawnR', x: cx - 28, z: cz, y: 0, rot: Q }, { id: nid(), t: 'spawnB', x: cx + 28, z: cz, y: 0, rot: -Q });
M.seq = id;
fs.writeFileSync('maps/build/ruin-demo.json', JSON.stringify(MD.pack(M)));
console.log('ruin-demo written', W + 'x' + H, M.objs.length, 'objs');
