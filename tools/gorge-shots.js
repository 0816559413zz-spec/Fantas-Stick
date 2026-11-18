// ถ่ายภาพแมพ gorge ในเกมจริง (headless) เทียบกับรูปอ้างอิง — ใช้: python tools/serve.py แล้ว
//   node tools/headless.js --game --url "index.html?nosw&playmap=gorge" --js tools/gorge-shots.js --w 1280 --h 640 --quiet --timeout 280
// ได้ shots/gorge_<ชื่อ>.jpg + shots/gorge_sheet.jpg (แผ่นรวม) • แก้รายการ SHOTS ด้านล่างได้ [ชื่อ, x,z (เมตรในแมพ), สูงจากพื้น, เป้าหมาย x,z, สูงเป้าจากพื้น, fov?]
// ?playmap=gorge เริ่มห้องฝึกบนแมพนี้เองทันที (ไม่ต้องกดปุ่ม)
for (let i = 0; i < 100 && WD.screen !== 'game'; i++) await HL.sleep(100);
await HL.sleep(1500); HL.freeze();
for (let i = 0; i < 600 && WD.G.ph !== 'play'; i++) HL.step(1);
if (WD.G.tr) WD.G.tr.datk = 0;
HL.step(30);
const map = WD.G.map;
// รอ .glb ของแมพโหลดจริง (พื้นสำรองเป็นสีเขียวธรรมดา)
for (let i = 0; i < 120; i++) { HL.step(2); await HL.sleep(100); if (WD.scene && !WD.scene.userData.x) { let n = 0; WD.scene.traverse(o => { if (o.isMesh) n++; }); if (n > 80) break; } }
HL.step(60);
const MW = WD.MAPS[map].W, MH = WD.MAPS[map].H;
const tx = x => x - MW / 40, tz = z => z - MH / 40, gy = (x, z) => WD.terrT(x * 20, z * 20);
const xc = z => 70 + 16 * Math.cos((z - 45) / 17), pcX = z => xc(z) + 1.7 * Math.sin(z / 5.7 + 1) + 0.8 * Math.sin(z / 2.3);   // แนวทางดิน (ต้องตรง tools/gorge-map.mjs)
const SHOTS = window.__SHOTS || [
  ['00_ref_view', pcX(76), 76, 1.7, 86, 45, 4.0, 50],
  ['01_path_to_bridge', 66, 80, 1.7, 86, 45, 6.0],
  ['02_path_mid', 74, 66, 2.0, 86, 45, 8],
  ['03_left_bank_view', 58, 66, 3.5, 88, 43, 7.5],
  ['04_under_bridge', 86, 56, 1.8, 86, 40, 6],
  ['05_on_bridge_south', 74, 45, 10.0, 99, 45, 9],
  ['06_north_of_bridge', 82, 36, 2.0, 70, 14, 5],
  ['07_overview_top', 80, 100, 62, 80, 40, 0],
  ['08_valley_south', 60, 100, 2.0, 70, 70, 3],
  ['09_west_cliffs', 100, 70, 4.0, 62, 60, 4],
  ['10_east_plateau', 120, 40, 3.0, 96, 48, 2],
  ['11_closeup_rocks', 70, 70, 1.4, 62, 66, 1.6],
  ['12_bridge_side', 99, 52, 4.0, 86, 45, 6],
];
const images = {}, cells = [];
for (const [name, cx, cz, h, tcx, tcz, th, fov] of SHOTS) {
  const ey = gy(cx, cz) + h, ty = gy(tcx, tcz) + th, f = fov || 58;
  WD.camHook = cam => { cam.fov = f; cam.updateProjectionMatrix(); cam.position.set(tx(cx), ey, tz(cz)); cam.lookAt(tx(tcx), ty, tz(tcz)); };
  const fg = WD.scene.fog, f0 = fg && fg.far; if (fg && name.includes('overview')) fg.far = 500;   // มุมสูง: ไม่ให้หมอกกลืนทั้งแมพ
  HL.step(8);
  images['gorge_' + name] = HL.snap(1280).toDataURL('image/jpeg', 0.9);
  cells.push({ c: HL.snap(640), label: name }); if (fg) fg.far = f0;
}
images['gorge_sheet'] = HL.sheet(cells, 3, 'gorge (' + map + ')');
let tris = 0, meshes = 0; WD.scene.traverse(o => { if (o.isMesh && o.visible) { meshes++; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); } });
return { map, mode: WD.G.mode, errs: HL.errs, tris: Math.round(tris), meshes, info: WD.gl.info.render, images };
