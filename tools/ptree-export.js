// Painterly wind trees → assets/mapkit/ptree.glb (Map Builder kit "ptree/*").
// Geometry = paintKit() (js/77: trunk + leaf cards, vertex colours, leaf/bark atlas). Material name 'paint_tree' tells the
// game to swap in the wind material (js/77 ptreeWind). Origin = trunk base.
//   python tools/serve.py   (other window)
//   node tools/ptree-export.js          → writes assets/mapkit/ptree.glb + registers kit.json "user" entries
const { spawnSync } = require('child_process'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const r = spawnSync('node', [path.join(__dirname, 'headless.js'), '--url', 'index.html?nosw&nopreload', '--js', path.join(__dirname, 'ptree-export.page.js'), '--quiet', '--timeout', '120'], { encoding: 'utf8', maxBuffer: 1 << 28 });
const b64p = path.join(ROOT, 'shots', 'ptree.glb.b64');
if (!fs.existsSync(b64p)) { console.error('export failed', (r.stdout || '').slice(-600), (r.stderr || '').slice(-300)); process.exit(1); }
const buf = Buffer.from(fs.readFileSync(b64p, 'utf8'), 'base64'); fs.unlinkSync(b64p);
fs.writeFileSync(path.join(ROOT, 'assets', 'mapkit', 'ptree.glb'), buf);
const NAMES = { tree_a: 'Wind Tree A (tall)', tree_b: 'Wind Tree B (leaning)', tree_c: 'Wind Tree C (short, wide)', tree_d: 'Wind Tree D (giant)',
  far_a: 'Wind Tree Far A (light)', far_b: 'Wind Tree Far B (light)', bush_a: 'Wind Bush A', bush_b: 'Wind Bush B' };
const kp = path.join(ROOT, 'assets', 'mapkit', 'kit.json'), kit = JSON.parse(fs.readFileSync(kp, 'utf8')), v = Date.now();
kit.user = kit.user.filter(e => !e.id.startsWith('ptree/'));
for (const [id, name] of Object.entries(NAMES)) kit.user.push({ id: 'ptree/' + id, name: name + ' · Painterly', cat: 'tree', src: 'mapkit/ptree.glb', node: 'pt_' + id, col: id.startsWith('bush') ? 0 : 1, brk: 0, ns: id.startsWith('far') || id.startsWith('bush') ? 1 : 0, v });
const row = A => A.map(e => JSON.stringify(e)).join(',\n  ');   // same layout as tools/manor-prefabs.mjs
fs.writeFileSync(kp, '{\n "_about": ' + JSON.stringify(kit._about || '') + ',\n "v": 1,\n "assets": [\n  ' + row(kit.assets || []) + '\n ],\n "user": [\n  ' + row(kit.user) + '\n ]\n}\n');
console.log('ptree.glb', (buf.length / 1024).toFixed(0) + ' KB,', Object.keys(NAMES).length, 'kit entries');
