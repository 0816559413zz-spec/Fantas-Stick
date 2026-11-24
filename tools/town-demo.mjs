// Showcase map for the town kit (node tools/town-assets.mjs): maps/build/town-demo.json
//   west = catalog (every town/* asset in rows), east = a small street scene built from the kit
// Export: node tools/headless.js --url "mapbuild.html?export=town-demo" --js tools/mb-export.js --quiet
// Play: index.html?nosw&playmap=town-demo
import fs from 'fs';
import * as MD from '../mapbuild/model.js';
const INF = JSON.parse(fs.readFileSync('assets/mapkit/town.info.json', 'utf8'));
const W = 200, H = 96;
const M = MD.newMap({ id: 'town-demo', name: 'Town Kit Demo', W, H, surf: 0 });
M.desc = 'Town props kit (town/*): catalog + street scene';
M.modes = ['ffa', 'tdm', 'coop']; M.random = 0; M.autoProps = 0; M.sky = 'day';
// paved catalog area
for (let j = 0; j < M.ny; j++) for (let i = 0; i < M.nx; i++) { const x = i * 0.5, z = j * 0.5; if (x < 120) M.sf[j * M.nx + i] = 4; }
let id = 1; const nid = () => id++;
const put = (k, x, z, rot = 0, o = {}) => M.objs.push(Object.assign({ id: nid(), t: 'kit:town/' + k, x, z, y: 0, rot }, o));
const ids = Object.keys(INF), of = c => ids.filter(k => INF[k].cat === c);
// catalog rows: houses red / slate, roads, small stuff
const row = (list, z, x0 = 6, gap = 2.5, x1 = 116) => { let x = x0; const rows = []; for (const k of list) { const w = INF[k].w; if (x + w > x1) { x = x0; z += 9; } put(k, x + w / 2, z); x += w + gap; } return z; };
row(of('build').filter(k => k.endsWith('_red')), 10, 4, 2, 124);
row(of('build').filter(k => k.endsWith('_slate')), 30, 4, 2, 124);
let z = row(of('road'), 48, 4, 2);
z = row(of('light').concat(of('fence')), z + 11, 4, 2.2);
row(of('prop'), z + 8, 4, 1.6);
// street scene (x 130..195): main street along z at x=160
const sx = 160;
for (const zz of [6, 14, 22, 30, 54, 62, 70, 78]) put('road_8', sx, zz + 4);
put('road_4', sx, 40); put('road_4', sx, 52); put('plaza_sq', sx, 46); put('plaza_sq', sx - 8, 46); put('plaza_sq', sx + 8, 46); put('fountain', sx, 46);
for (let zz = 6; zz < 90; zz += 4) if (zz < 38 || zz >= 54) { put('curb_4', sx - 2.15, zz + 2, Math.PI / 2); put('curb_4', sx + 2.15, zz + 2, Math.PI / 2); }
put('flags_8', sx - 6.3, 20); put('flags_8', sx + 6.3, 20); put('flags_8', sx - 6.3, 72); put('flags_8', sx + 6.3, 72);
const west = ['tall_red', 'shop_slate', 'timber_red', 'row_slate', 'cottage_red'], east = ['big_slate', 'tall_slate', 'shop_red', 'wide_red'];
let zw = 6; for (const k of west) { const w = INF[k].w, d = INF[k].d; if (zw + w > 90) break; put(k, sx - 10.5 - d / 2, zw + w / 2, Math.PI / 2); zw += w + 1; }
let ze = 6; for (const k of east) { const w = INF[k].w, d = INF[k].d; if (ze + w > 90) break; put(k, sx + 10.5 + d / 2, ze + w / 2, -Math.PI / 2); ze += w + 1; }
put('towerh_red', sx + 15, 84); put('wide_slate', sx - 22, 84, 0);
for (let zz = 10; zz < 90; zz += 10) if (zz < 38 || zz > 54) { put('lamp_post', sx - 3.0, zz); put('lamp_post', sx + 3.0, zz + 5); }
put('stall_red', sx - 7, 40, Math.PI / 2); put('stall_blue', sx - 7, 52, Math.PI / 2); put('stall_green', sx + 7, 46, -Math.PI / 2);
put('lamp_double', sx, 37.5); put('lamp_double', sx, 54.5); put('well', sx + 8, 22);
put('barrels', sx - 8, 31); put('crates', sx + 8.5, 30); put('cart_hay', sx + 7, 60, 0.3); put('cart_goods', sx - 7.5, 62, -0.2);
put('bench', sx - 5, 46, Math.PI / 2); put('bench', sx + 5, 42, -Math.PI / 2); put('planter', sx - 6, 16); put('flower_pots', sx + 7.5, 15); put('signpost', sx - 3.2, 58);
put('banner_red', sx - 3.5, 34); put('banner_blue', sx + 3.5, 34); put('sacks', sx - 9, 55); put('barrel', sx + 9, 63); put('crate', sx + 9.8, 64, 0.4); put('trough', sx + 8, 70, Math.PI / 2);
put('notice', sx - 6, 68, Math.PI / 2); put('hay_bales', sx + 8, 78); put('woodpile', sx - 8, 78); put('fence_picket', sx + 8, 82); put('hedge', sx - 8, 88);
put('brazier', sx - 2.5, 42); put('brazier', sx + 2.5, 50); put('gate_arch', sx, 3);
// spawns
[[20, 90], [60, 90], [100, 90], [160, 18], [160, 30], [160, 62], [160, 74], [60, 4]].forEach(([x, z]) => M.objs.push({ id: nid(), t: 'spawn', x, z, y: 0, rot: 0 }));
M.objs.push({ id: nid(), t: 'spawnR', x: 6, z: 4, y: 0, rot: 0 }, { id: nid(), t: 'spawnB', x: 194, z: 92, y: 0, rot: Math.PI });
M.seq = id;
fs.writeFileSync('maps/build/town-demo.json', JSON.stringify(MD.pack(M)));
console.log('town-demo written', W + 'x' + H, M.objs.length, 'objs');
