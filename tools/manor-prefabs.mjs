// Stone manor house prefabs (user 2026-11-22: "Blender + breakable"): maps/build/room-house-<id>.json
// Each house = Blender frame (kit manor/<id>: roof, corner piers, chimneys, dormers, porch, bay, ivy — unbreakable, no collision)
//            + breakable pn_wall stone walls with window/door holes, lit glass panes, a wooden door and gable triangles (one pn group per house)
//            + invisible collision boxes for piers / chimney breasts / bay / porch posts.
// Every item carries grp = house name, so "Unpack Room into Map" leaves one Hierarchy group per house.
// Spec: assets/src/manor_spec.json (shared with assets/src/manor_build.py). Also registers the kit models in assets/mapkit/kit.json.
// Run after the Blender build: node tools/manor-prefabs.mjs
import fs from 'fs';
import * as MD from '../mapbuild/model.js';
const PI = Math.PI;
const SP = JSON.parse(fs.readFileSync('assets/src/manor_spec.json', 'utf8'));
const INFO = JSON.parse(fs.readFileSync('assets/mapkit/manor.info.json', 'utf8'));
const { T, P, SH } = SP;
const f3 = v => +v.toFixed(3);

// ---- kit registration (user list, same format as tools/serve.py kit_dump) ----
const kp = 'assets/mapkit/kit.json', kit = JSON.parse(fs.readFileSync(kp, 'utf8')), v = Date.now();
kit.user = (kit.user || []).filter(a => !String(a.id).startsWith('manor/'));
for (const H of SP.houses) kit.user.push({ id: 'manor/' + H.id, name: H.name + ' (frame) · Manor', cat: 'build', src: 'mapkit/manor.glb', node: 'mn_' + H.id, col: 0, brk: 0, ns: 0, v });
const row = L => L.map(a => JSON.stringify(a)).join(',\n  ');
fs.writeFileSync(kp, '{\n "_about": ' + JSON.stringify(kit._about || '') + ',\n "v": 1,\n "assets": [\n  ' + row(kit.assets || []) + '\n ],\n "user": [\n  ' + row(kit.user) + '\n ]\n}\n');

function sides(H) {   // [centre x, z, U (along, left→right seen from outside), rot (editor), L]
  const { w, d } = H;
  return { f: { x: 0, z: d / 2, U: [1, 0], rot: 0, L: w - P }, b: { x: 0, z: -d / 2, U: [-1, 0], rot: PI, L: w - P },
           r: { x: w / 2, z: 0, U: [0, -1], rot: PI / 2, L: d - P }, l: { x: -w / 2, z: 0, U: [0, 1], rot: -PI / 2, L: d - P } };
}
const opening = ([u, s, k], L, hh) => {   // → [u0, u1, z0, z1, kind, centre]
  const c = u * L, wd = k === 'd' ? 1.3 : 1.0, z0 = k === 'd' ? 0 : s * SH + 0.95, z1 = Math.min(hh - 0.3, k === 'd' ? 2.4 : z0 + 1.35);
  return [c - wd / 2, c + wd / 2, z0, z1, k, c];
};

function house(H) {
  const id = 'room-house-' + H.id, W = Math.ceil(H.w + 6), D = Math.ceil(H.d + 7), cx = W / 2, cz = D / 2 - 0.5;
  const M = MD.newMap({ id, name: 'บ้านหิน: ' + H.name, W, H: D });
  M.desc = 'บ้านหินทรงอังกฤษ — โครง Blender (หลังคา เสามุม ปล่องไฟ ไม้เลื้อย) + ผนังหินพังได้ หน้าต่าง ประตูไม้ • แตกเข้าแผนที่แล้วได้ 1 กลุ่ม';
  M.modes = ['ffa', 'tdm', 'coop']; M.random = 0; M.autoProps = 0; M.sky = 'day'; M.style = 'castle-stone';
  const grp = H.name, gid = 'H' + H.id; M.groups = [grp];
  let n = 1; const put = (t, x, z, e = {}) => M.objs.push(Object.assign({ id: n++, t, x: f3(cx + x), z: f3(cz + z), y: 0, rot: 0 }, e, { grp }));
  const wall = (x, z, rot, L, sy, e = {}) => put('pn_wall', x, z, Object.assign({ rot: f3(rot), L: f3(L), sy: f3(sy), T, cs: 0.7, mat: 'stone', m: 'p', g: gid }, e));
  const colBox = (x, z, sx, sy, sz, rot = 0, y = 0) => put('box', x, z, { sx: f3(sx), sy: f3(sy), sz: f3(sz), rot: f3(rot), y: f3(y), c: '#ff5a5a', vis: 0, col: 1 });
  const t = H.roof.t, tp = t === 'shed' ? (H.wb - H.wh) / (H.d + T) : Math.tan(H.roof.pitch * PI / 180);
  const I = INFO[H.id];
  put('kit:manor/' + H.id, (I.x[0] + I.x[1]) / 2, (I.z[0] + I.z[1]) / 2, { s: 1 });   // kit models are centred on their bbox
  // walls with openings (≤ 4 holes per panel → split long walls between window columns)
  for (const [k, S] of Object.entries(sides(H))) {
    const hh = t === 'shed' && k === 'b' ? H.wb : H.wh, ops = (H.open[k] || []).map(o => opening(o, S.L, hh)).sort((a, b) => a[5] - b[5]);
    const cols = []; for (const o of ops) { const c = cols.find(q => Math.abs(q[0][5] - o[5]) < 0.3); if (c) c.push(o); else cols.push([o]); }
    const chunks = [[]]; for (const c of cols) { if (chunks.at(-1).flat().length + c.length > 4) chunks.push([]); chunks.at(-1).push(c); }
    const cuts = [0]; for (let i = 1; i < chunks.length; i++) cuts.push((chunks[i - 1].at(-1)[0][1] + chunks[i][0][0][0]) / 2); cuts.push(S.L);
    chunks.forEach((ch, i) => { const a = cuts[i], b = cuts[i + 1], mid = (a + b) / 2 - S.L / 2;
      wall(S.x + S.U[0] * mid, S.z + S.U[1] * mid, S.rot, b - a, hh, ch.length ? { ho: ch.flat().map(o => [f3(o[0] - a), f3(o[1] - a), f3(o[2]), f3(o[3])]) } : {}); });
    for (const o of ops) { const u = o[5] - S.L / 2, x = S.x + S.U[0] * u, z = S.z + S.U[1] * u;
      if (o[4] === 'd') wall(x, z, S.rot, 1.4, 2.45, { mat: 'wood', m: 'g', T: 0.12, cs: 9 });
      else wall(x, z, S.rot, o[1] - o[0] + 0.1, o[3] - o[2] + 0.1, { y: f3(o[2] - 0.05), mat: 'litwin', m: 'g', T: 0.1, cs: 9 }); }
  }
  // gable triangles (breakable, same group → fall when the wall under them goes)
  if (t === 'gable') {
    const S = sides(H); for (const k of ['l', 'r']) wall(S[k].x, S[k].z, S[k].rot, H.d - 0.1, (H.d / 2 + T / 2) * tp - 0.15, { y: H.wh, sh: 'tri' });
    for (const q of H.xg || []) wall((H.w - P) * (q.u - 0.5), H.d / 2, 0, q.w, (q.w / 2 + T / 2) * tp - 0.12, { y: H.wh, sh: 'tri' });
  }
  // collision for the unbreakable frame (the kit model itself has none)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) colBox(sx * H.w / 2, sz * H.d / 2, P, (t === 'shed' && sz < 0 ? H.wb : H.wh) + 0.1, P);
  const S = sides(H);
  for (const c of H.chim || []) if (c.k === 'breast') { const s = S[c.side], u = (c.u - 0.5) * s.L;
    const nx = Math.sin(s.rot), nz = Math.cos(s.rot), off = T / 2 + 0.45; colBox(s.x + s.U[0] * u + nx * off, s.z + s.U[1] * u + nz * off, 1.9, H.wh - 0.3, 0.9, s.rot); }
  if (H.bay) colBox((H.w - P) * (H.bay.u - 0.5), H.d / 2 + T / 2 + 0.45, H.bay.w, 2.8, 0.95);
  if (H.porch != null) for (const sx of [-1, 1]) put('cyl', (H.w - P) * (H.porch - 0.5) + sx * 1.0, H.d / 2 + T / 2 + 1.35, { sx: 0.24, sy: 2.6, sz: 0.24, c: '#ff5a5a', vis: 0, col: 1 });
  // roof collision: invisible roof slabs (rf:1 → only used when the room instance ticks 'Roof collision')
  // each slab is solid from its sloped top down to the wall top (yb) → skills can't pass through, fliers land on it; the overhang stays 0.3 thick
  // gable + cross gables + lean-to = sloped floors • tower pyramid = stack of flat squares (stepped)
  const OV = 0.45, GOV = 0.12, lift = 0.22 * Math.sqrt(1 + tp * tp), xo = H.w / 2 + T / 2, zo = H.d / 2 + T / 2, yb = f3(H.wh + 0.05);
  const roofF = (x, z, w, d, rot, y, y2) => M.floors.push({ id: n++, x: f3(cx + x), z: f3(cz + z), w: f3(w), d: f3(d), rot: f3(rot), y: f3(y), y2: f3(y2), th: 0.3, yb, c: '#7a8090', vis: 0, sol: 0, rf: 1, grp });
  if (t === 'gable') {
    const ze = zo + OV, top = H.wh + zo * tp + lift, eave = H.wh - OV * tp + lift;
    roofF(0, ze / 2, 2 * (xo + GOV), ze, 0, top, eave); roofF(0, -ze / 2, 2 * (xo + GOV), ze, 0, eave, top);
    for (const q of H.xg || []) { const qx = (H.w - P) * (q.u - 0.5), xw = q.w / 2 + T / 2, Yx = H.wh + xw * tp + lift, zb = zo - (xw * tp) / tp - 0.8, z1 = zo + GOV + 0.15;
      roofF(qx - (xw + OV) / 2, (zb + z1) / 2, z1 - zb, xw + OV, PI / 2, eave, Yx); roofF(qx + (xw + OV) / 2, (zb + z1) / 2, z1 - zb, xw + OV, PI / 2, Yx, eave); }
  } else if (t === 'shed') {
    const zf = zo + OV, zb = -zo - 0.15, hAt = z => H.wh + (zo - z) * tp + lift;
    roofF(0, (zf + zb) / 2, 2 * (xo + GOV), zf - zb, 0, hAt(zb), hAt(zf));
  } else if (t === 'pyr') {
    const r0 = Math.max(xo, zo) + OV, ds = 0.25, top = r => H.wh + (Math.max(xo, zo) - r) * tp + lift;
    for (let r = r0; r > 0.1; r -= ds) { const y = top(r) + ds * tp * 0.5; roofF(0, 0, 2 * r, 2 * r, 0, y, y); }
  }
  // flagstone path from the door to the front edge (game-drawn floor decor, no collision)
  const door = (H.open.f || []).find(o => o[2] === 'd');
  if (door) { const x = (H.w - P) * (door[0] - 0.5), z0 = H.d / 2 + 0.3, z1 = D - cz; put('dc_box', x, (z0 + z1) / 2, { k: 'floor', y: 0.03, sx: 1.8, sy: 0.06, sz: f3(z1 - z0) }); }
  M.seq = n;
  fs.writeFileSync('maps/build/' + id + '.json', JSON.stringify(MD.pack(M)));
  console.log(id, W + 'x' + D, M.objs.length, 'items,', M.objs.filter(o => o.t === 'pn_wall').length, 'panels,', M.floors.length, 'roof floors');
}
SP.houses.forEach(house);
