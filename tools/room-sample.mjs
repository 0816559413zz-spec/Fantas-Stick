// Room prefab test map (MAP-STANDARD round 3): maps/build/room-demo.json = the Great Hall prefab (room-greathall) placed in a field
// Needs maps/build/room-greathall.json (node tools/fcs-to-mb.mjs). Export: python tools/serve.py (other window) then
//   node tools/headless.js --url "mapbuild.html?export=room-demo" --js tools/mb-export.js --quiet
// Play: index.html?nosw&playmap=room-demo
import fs from 'fs';
import * as MD from '../mapbuild/model.js';
const R = MD.unpack(JSON.parse(fs.readFileSync('maps/build/room-greathall.json', 'utf8')));
const W = Math.ceil(R.W + 40), H = Math.ceil(R.H + 40);
const M = MD.newMap({ id: 'room-demo', name: 'Room Demo (ห้องโถงใหญ่ prefab)', W, H, surf: 0 });
M.desc = 'ทดสอบห้องสำเร็จจาก Map Builder: ห้องโถงใหญ่ (room-greathall) กลางทุ่ง';
M.modes = ['ffa', 'tdm', 'coop']; M.random = 0; M.autoProps = 0; M.sky = 'day'; M.style = 'castle-stone';
let id = 1;
const nid = () => id++;
M.rooms.push({ id: nid(), ref: R.id, x: W / 2, z: H / 2, rot: 0 });
const sp = [[8, 8], [W - 8, 8], [8, H - 8], [W - 8, H - 8], [W / 2, 6], [W / 2 - 30, H / 2], [W / 2 + 30, H / 2], [W / 2, H / 2 + 12]];
sp.forEach(([x, z], i) => M.objs.push({ id: nid(), t: 'spawn', x, z, y: 0, rot: 0 }));
M.objs.push({ id: nid(), t: 'spawnR', x: 6, z: H / 2, y: 0, rot: Math.PI / 2 }, { id: nid(), t: 'spawnB', x: W - 6, z: H / 2, y: 0, rot: -Math.PI / 2 });
M.seq = id;
fs.writeFileSync('maps/build/room-demo.json', JSON.stringify(MD.pack(M)));
console.log('room-demo written', W + 'x' + H);
