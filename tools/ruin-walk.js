// Ruin kit test (headless): walk up stairs/ramps onto platforms + bridge, walk under the bridge, bump into cover walls, then take shots
//   node tools/headless.js --game --url "index.html?nosw&playmap=ruin-demo" --js tools/ruin-walk.js --w 1280 --h 720 --quiet --timeout 280
// Map from tools/ruin-demo.mjs (yard centre 70,66). Results: per-test trace [x, z, height] + shots/ruin_*.jpg + shots/ruin_sheet.jpg
for (let i = 0; i < 100 && WD.screen !== 'game'; i++) await HL.sleep(100);
await HL.sleep(1500); HL.freeze();
for (let i = 0; i < 600 && WD.G.ph !== 'play'; i++) HL.step(1);
if (WD.G.tr) WD.G.tr.datk = 0;
HL.step(30);
for (let i = 0; i < 120; i++) { HL.step(2); await HL.sleep(100); let n = 0; WD.scene.traverse(o => { if (o.isMesh) n++; }); if (n > 80) break; }
const me = HL.me(), out = [];
const place = (x, z, yawDeg) => { me.x = x * 20; me.y = z * 20; me.vx = me.vy = 0; me.z = 0; me.vz = 0; me.inv = 99; HL.aim(yawDeg * Math.PI / 180); HL.step(20); };
const walk = (frames, key = 'u') => { HL.input({ [key]: 1 }); const tr = []; for (let i = 0; i < frames; i++) { HL.step(1); if (i % 30 === 29) tr.push([+(me.x / 20).toFixed(1), +(me.y / 20).toFixed(1), +(me.z || 0).toFixed(2)]); } HL.input({ [key]: 0 }); return tr; };
place(47, 66, 0); out.push({ test: 'W→E: stairs 3m → platform → stairs 1.5 → tower 4.5 → bridge → east tower', trace: walk(420) });
place(70, 59, 90); out.push({ test: 'S→N under the bridge (z 64.5..67.5)', trace: walk(240) });
place(62, 54, 90); out.push({ test: 'bump low cover wall (62,58) from the south', trace: walk(120) });
place(52, 73, 90); out.push({ test: 'rubble ramp (52,79) up to 3m platform (52,84)', trace: walk(240) });
place(54, 75, 90); me.z = 0; HL.input({ j: 1 }); HL.step(2); HL.input({ j: 0 }); out.push({ test: 'jump test near low wall (height peak)', trace: walk(60) });
// shots [name, eye x,z,h, target x,z,h, fov]
const gy = (x, z) => WD.terrT(x * 20, z * 20), MW = WD.MAPS[WD.G.map].W, MH = WD.MAPS[WD.G.map].H, tx = x => x - MW / 40, tz = z => z - MH / 40;
const SHOTS = [['overview', 70, 104, 46, 70, 64, 0, 55], ['yard_sw', 40, 94, 9, 70, 64, 2, 60], ['yard_ne', 100, 38, 9, 70, 66, 2, 60], ['on_bridge', 61, 66, 6.3, 80, 66, 4.6, 70],
  ['under_bridge', 70, 58, 1.7, 70, 72, 3.0, 70], ['catalog_a', 30, 34, 16, 30, 8, 0, 60], ['catalog_b', 100, 34, 16, 100, 8, 0, 60]];
const images = {}, cells = [];
me.x = -999 * 20;   // hide the player
for (const [name, cx, cz, h, tcx, tcz, th, fov] of SHOTS) {
  WD.camHook = cam => { cam.fov = fov; cam.updateProjectionMatrix(); cam.position.set(tx(cx), gy(cx, cz) + h, tz(cz)); cam.lookAt(tx(tcx), gy(tcx, tcz) + th, tz(tcz)); };
  const fg = WD.scene.fog, f0 = fg && fg.far; if (fg) fg.far = 600; HL.step(8);
  images['ruin_' + name] = HL.snap(1280).toDataURL('image/jpeg', 0.9); cells.push({ c: HL.snap(640), label: name }); if (fg) fg.far = f0;
}
images['ruin_sheet'] = HL.sheet(cells, 3, 'ruin kit (ruin-demo)');
return { out, errs: HL.errs, images };
