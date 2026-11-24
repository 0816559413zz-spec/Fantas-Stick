// In-game shots of the town kit showcase map — python tools/serve.py, then
//   node tools/headless.js --game --url "index.html?nosw&playmap=town-demo" --js tools/town-shots.js --w 1280 --h 720 --quiet --timeout 280
// → shots/town_game_<name>.jpg + shots/town_game_sheet.jpg  • SHOTS = [name, x,z (map m), height above ground, target x,z, target height, fov?]
for (let i = 0; i < 100 && WD.screen !== 'game'; i++) await HL.sleep(100);
await HL.sleep(1500); HL.freeze();
for (let i = 0; i < 600 && WD.G.ph !== 'play'; i++) HL.step(1);
if (WD.G.tr) WD.G.tr.datk = 0;
HL.step(30);
const map = WD.G.map;
// รอ .glb ของแมพโหลดจริง (พื้นสำรองเป็นสีเขียวธรรมดา)
const MW = WD.MAPS[map].W, MH = WD.MAPS[map].H;
const tx = x => x - MW / 40, tz = z => z - MH / 40, gy = (x, z) => WD.terrT(x * 20, z * 20);
const SHOTS = [
  ['street_eye', 160, 88, 1.8, 160, 46, 3, 60],
  ['market_eye', 154, 56, 1.8, 164, 40, 2.5, 62],
  ['street_high', 135, 95, 24, 160, 45, 0, 50],
  ['houses_red', 50, 40, 9, 50, 10, 3, 60],
  ['houses_slate', 50, 52, 9, 50, 26, 3, 60],
  ['props_row', 40, 80, 7, 40, 58, 0, 55],
  ['roads_row', 40, 58, 14, 40, 42, 0, 60],
];
const images = {}, cells = [];
for (const [name, cx, cz, h, tcx, tcz, th, fov] of SHOTS) {
  const ey = gy(cx, cz) + h, ty = gy(tcx, tcz) + th, f = fov || 58;
  WD.camHook = cam => { cam.fov = f; cam.updateProjectionMatrix(); cam.position.set(tx(cx), ey, tz(cz)); cam.lookAt(tx(tcx), ty, tz(tcz)); };
  HL.step(8);
  images['town_game_' + name] = HL.snap(1280).toDataURL('image/jpeg', 0.9);
  cells.push({ c: HL.snap(640), label: name });
}
images['town_game_sheet'] = HL.sheet(cells, 3, 'town kit in game (' + map + ')');
let tris = 0, meshes = 0; WD.scene.traverse(o => { if (o.isMesh && o.visible) { meshes++; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); } });
return { map, errs: HL.errs, tris: Math.round(tris), meshes, info: WD.gl.info.render, images };
