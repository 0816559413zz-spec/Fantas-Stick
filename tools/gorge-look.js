// ลองค่าแสง/หมอกของแมพ gorge เป็นแผ่นเทียบหลายแบบ (headless) — ใช้เหมือน gorge-shots.js:
//   node tools/headless.js --game --url "index.html?nosw&playmap=gorge" --js tools/gorge-look.js --w 1280 --h 640 --quiet
// แก้ VARIANTS ได้: {label, P:{ฟิลด์ใน LOOK.P.gorge}, hemi:[สี,สีพื้น,แรง], sun:[สี,แรง], fog:[สี,near,far], exp}
for (let i = 0; i < 100 && WD.screen !== 'game'; i++) await HL.sleep(100);
await HL.sleep(1500); HL.freeze();
for (let i = 0; i < 600 && WD.G.ph !== 'play'; i++) HL.step(1);
if (WD.G.tr) WD.G.tr.datk = 0;
for (let i = 0; i < 60; i++) { HL.step(2); await HL.sleep(60); }
HL.step(60);
const MW = WD.MAPS.gorge.W, MH = WD.MAPS.gorge.H, tx = x => x - MW / 40, tz = z => z - MH / 40, gy = (x, z) => WD.terrT(x * 20, z * 20);
const SH = [['a', 66, 80, 1.7, 86, 45, 7.5], ['b', 60, 100, 2.0, 70, 70, 3]];
const P = WD.LOOK.P.gorge, P0 = JSON.parse(JSON.stringify(P));
let hemi, moon; WD.scene.traverse(o => { if (o.isHemisphereLight) hemi = o; if (o.isDirectionalLight && o.castShadow) moon = o; });
const fg = WD.scene.fog, H0 = { hc: hemi.color.getHexString(), hg: hemi.groundColor.getHexString(), hi: hemi.intensity, mc: moon.color.getHexString(), mi: moon.intensity, fc: fg.color.getHexString(), fn: fg.near, ff: fg.far };
const V = window.__VARS || [
  { label: 'ปัจจุบัน' },
  { label: 'hemi ต่ำ แดดแรง', P: { hemi: 0.25, amb: 0.05 }, hemi: ['#c9d3d6', '#3e3c32', 0.35], sun: ['#f4efe0', 1.9] },
  { label: 'ACES (tone 0)', P: { tone: 0, con: 1.05, hemi: 0.3 }, hemi: ['#c9d3d6', '#3e3c32', 0.4], sun: ['#f4efe0', 1.7] },
  { label: 'ACES + มืดลง', P: { tone: 0, con: 1.15, hemi: 0.25, exp: 0.9 }, hemi: ['#cdd3d0', '#33302a', 0.35], sun: ['#f4efe0', 1.7], exp: 0.9 },
  { label: 'AgX คอนทราสต์สูง', P: { con: 1.3, hemi: 0.3, exp: 0.92 }, hemi: ['#c9d3d6', '#3e3c32', 0.4], sun: ['#f4efe0', 1.8] },
  { label: 'หมอกเบา far 300', fog: ['#bcc5c1', 30, 300], P: { haze: 0.7 }, hemi: ['#c9d3d6', '#3e3c32', 0.4], sun: ['#f4efe0', 1.7] },
];
const cells = [];
for (const v of V) {
  Object.assign(P, JSON.parse(JSON.stringify(P0)), v.P || {});
  hemi.color.set('#' + H0.hc); hemi.groundColor.set('#' + H0.hg); hemi.intensity = H0.hi; moon.color.set('#' + H0.mc); moon.intensity = H0.mi; fg.color.set('#' + H0.fc); fg.near = H0.fn; fg.far = H0.ff;
  WD.lookRefresh();
  if (v.hemi) { hemi.color.set(v.hemi[0]); hemi.groundColor.set(v.hemi[1]); hemi.intensity = v.hemi[2]; }
  if (v.sun) { moon.color.set(v.sun[0]); moon.intensity = v.sun[1]; }
  if (v.fog) { fg.color.set(v.fog[0]); fg.near = v.fog[1]; fg.far = v.fog[2]; }
  if (v.exp) WD.gl.toneMappingExposure = v.exp;
  for (const [n, cx, cz, h, tcx, tcz, th] of SH) {
    WD.camHook = cam => { cam.fov = 58; cam.updateProjectionMatrix(); cam.position.set(tx(cx), gy(cx, cz) + h, tz(cz)); cam.lookAt(tx(tcx), gy(tcx, tcz) + th, tz(tcz)); };
    HL.step(6); cells.push({ c: HL.snap(640), label: v.label + ' • ' + n });
  }
}
return { errs: HL.errs, images: { gorge_look_sheet: HL.sheet(cells, 2, 'look variants') } };
