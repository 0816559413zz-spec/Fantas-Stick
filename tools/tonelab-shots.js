// Tone Lab matrix: every zone of maps tonelab (rows) x every light scenario (cols) → shots/tonelab_<tag>.jpg
// Run (python tools/serve.py first): node tools/headless.js --game --url "index.html?nosw&playmap=tonelab" --js tools/tonelab-shots.js --w 1280 --h 720 --quiet --timeout 600
// Options via a wrapper that sets window.__tl = {tag, scen:['night',...], zones:['grass',...], w:300, set:{'look.night.exp':1.1}} before this file.
// Scenario = sky + Look preset (+ optional map lt), applied with WD.lookTest (js/74) the same way a map file would.
const O = window.__tl || {}, TAG = O.tag || 'base', CW = O.w || 300;
const ZW = 30, GAP = 2, COLS = 4;   // must match tools/tonelab-map.mjs
const ZONES = ['grass', 'forest', 'dry', 'dirt', 'sand', 'snow', 'ice', 'water', 'lava', 'castle', 'indoor', 'moss'];
const SCEN = {
  night: { sky: 'night', look: 'night' }, dusk: { sky: 'sunset', look: 'dusk' }, noon: { sky: 'day', look: 'dusk' },
  meadow: { sky: 'sunset', look: 'meadow' }, sand: { sky: 'sunset', look: 'sand' }, snow: { sky: 'night', look: 'snow' },
  gorge: { sky: 'sunset', look: 'gorge', lt: { hemi: ['#d4d9d2', '#4a4636', 0.55], sun: ['#fff0d2', 1.9, [25, 40, -95]], sky: '#cdd3cd', exp: 1.0 } },
};
const scens = O.scen || Object.keys(SCEN), zones = O.zones || ZONES;
for (let i = 0; i < 150 && WD.screen !== 'game'; i++) await HL.sleep(100);
await HL.sleep(1500); HL.freeze();
WD.QUAL.mode = 'high'; WD.QUAL.lvl = 0; WD.applyQuality();
for (let i = 0; i < 600 && WD.G.ph !== 'play'; i++) HL.step(1);
if (WD.G.tr) WD.G.tr.datk = 0;
for (const [k, v] of Object.entries(O.set || {})) WD.tuneSetKey(k, v);
{ const until = performance.now() + 25000; let ok = 0; while (performance.now() < until && ok < 3) { HL.step(2); await HL.sleep(30); ok = !WD.warm.q.length && !WD.warm.busy ? ok + 1 : 0; } }
await HL.sleep(4000); HL.step(30);
const me = HL.me();
// camera yaw that looks north (-z): probe a few values
const dir = new WD.THREE.Vector3(); let yawN = 0, best = -9;
for (const y of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) { HL.aim(y, -0.05); HL.step(2); WD.cam.getWorldDirection(dir); if (-dir.z > best) { best = -dir.z; yawN = y; } }
const cells = [], info = [];
for (const sn of scens) {
  const r = WD.lookTest(SCEN[sn]); info.push(sn + ' ' + JSON.stringify(r));
  for (const zk of zones) {
    const q = ZONES.indexOf(zk), x0 = GAP + (q % COLS) * (ZW + GAP), z0 = GAP + Math.floor(q / COLS) * (ZW + GAP);
    me.x = (x0 + ZW / 2 - 2.5) * 20; me.y = (z0 + 24) * 20;me.ang = -Math.PI / 2; me.vx = me.vy = 0;
    HL.aim(yawN, -0.05);
    WD.G.en = []; for (let i = 0; i < 40; i++) HL.step(1);
    cells.push({ c: HL.snap(CW), label: sn + ' • ' + zk });
  }
}
// sheet: rows = zones, cols = scenarios → reorder cells (they were made scenario-major)
const grid = []; for (let zi = 0; zi < zones.length; zi++) for (let si = 0; si < scens.length; si++) grid.push(cells[si * zones.length + zi]);
const images = { ['tonelab_' + TAG]: HL.sheet(grid, scens.length, 'tonelab ' + TAG + ' — rows: zones, cols: ' + scens.join(' / ') + ' ' + JSON.stringify(O.set || {})) };
return { info, yawN, images, errors: [...new Set(HL.errs)].slice(0, 5) };
