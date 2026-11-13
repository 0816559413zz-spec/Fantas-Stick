// สร้างคลัง Asset ของ Map Builder (assets/mapkit/kit.json) จากโมเดลที่มีอยู่ในแผนที่ของเกม (assets/maps/*.glb)
// ใช้: node tools/mapkit-gen.js   — รันใหม่เมื่อมีแผนที่ Blender ใหม่/เปลี่ยนชื่อชิ้น. รายการ "user" (Asset ที่ผู้ใช้เพิ่มเองจาก Map Builder) คงเดิมเสมอ
// 1 รายการ = ชิ้น (node) หนึ่งในไฟล์ .glb : Map Builder โหลดไฟล์นั้นแล้วหยิบชิ้นตามชื่อมาวาง ไม่ต้องมีไฟล์โมเดลแยก
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), mapDir = path.join(root, 'assets', 'maps'), outDir = path.join(root, 'assets', 'mapkit');
const SKIP = /^(ground|floor_|env_|anim_|bounds)|_far|mountain|_walls?$|bridge_stones|ford_stone|hoops|teacher|rail_posts|island|tree_edge|drape|_stand|pitch_tower|castle_banners|hall_banners/i;
// [หมวด, คำค้น, ชื่อไทย, ชน (1 = มีที่ชน), พังได้ (วัสดุ), ของเล็กไม่ทอดเงา]
const RULES = [
  ['plant', /tuft|flower|mush|drift|web/, 'พืชเล็ก', 0, 0, 1],
  ['plant', /bush/, 'พุ่มไม้', 0, 0, 1],
  ['tree', /tree|pine/, 'ต้นไม้', 1, 'wood', 0],
  ['rock', /rock|boulder|stone|chunk|rubble|crystal/, 'หิน', 1, 'stone', 0],
  ['fence', /fence/, 'รั้ว', 1, 'wood', 0],
  ['light', /lamp|lantern|torch|brazier|candle|glow/, 'ไฟ', 1, 'stone', 0],
  ['prop', /bench|table|stall|crate|hay|cart|tent|well|log|snowman|hourglass/, 'ของประกอบ', 1, 'wood', 0],
  ['build', /column|pillar|statue|obelisk|arch|gargoyle|altar|fallen|windmill|step|wall/, 'สิ่งก่อสร้าง', 1, 'stone', 0],
];
const TH = { tuft: 'กอหญ้า', flower: 'ดอกไม้', mush: 'เห็ด', drift: 'กองหิมะ', web: 'ใยแมงมุม', bush: 'พุ่มไม้', tree: 'ต้นไม้', pine: 'ต้นสน', rock: 'หิน', boulder: 'หินก้อนใหญ่', stone: 'แท่นหิน', chunk: 'ก้อนน้ำแข็ง', rubble: 'เศษหิน',
  fence: 'รั้ว', lamp: 'เสาไฟ', lantern: 'โคมไฟ', torch: 'คบไฟ', brazier: 'กระถางไฟ', candle: 'เชิงเทียน', glow: 'หินเรืองแสง', bench: 'ม้านั่ง', table: 'โต๊ะยาว', stall: 'ร้านแผงลอย', crate: 'ลัง', hay: 'กองฟาง', tent: 'เต็นท์', well: 'บ่อน้ำ',
  log: 'ขอนไม้', snowman: 'ตุ๊กตาหิมะ', hourglass: 'นาฬิกาทราย', column: 'เสา', pillar: 'เสาใหญ่', statue: 'รูปปั้น', obelisk: 'เสาโอเบลิสก์', arch: 'ซุ้มหิน', gargoyle: 'การ์กอยล์', altar: 'แท่นบูชา', fallen: 'เสาล้ม', windmill: 'กังหันลม', step: 'ขั้นหิน', wall: 'กำแพงเก่า' };
const MAPN = { valley: 'หุบเขา', castle: 'ปราสาท', forest: 'ป่า', hogsmeade: 'หิมะ', meadow: 'ทุ่งหญ้า', ruins: 'ซาก', lake: 'ทะเลสาบ', greathall: 'ห้องโถง', pitch: 'สนาม' };
const PER = 3;   // เก็บกี่แบบต่อ 1 ตระกูล (ชิ้นแรก / กลาง / ท้าย — มักต่างขนาด)
const assets = [];
for (const f of fs.readdirSync(mapDir).filter(f => f.endsWith('.glb')).sort()) {
  const mid = f.slice(0, -4), b = fs.readFileSync(path.join(mapDir, f));
  if (fs.existsSync(path.join(root, 'maps', 'build', mid + '.json'))) continue;   // แผนที่ที่ทำจาก Map Builder เอง ไม่นับเป็นคลัง
  const j = JSON.parse(b.slice(20, 20 + b.readUInt32LE(12)).toString());
  const fam = new Map();
  for (const n of j.nodes || []) {
    if (n.mesh == null || !n.name || SKIP.test(n.name)) continue;
    const k = n.name.replace(/([._-]-?\d+)+$/, '');
    if (!fam.has(k)) fam.set(k, []);
    fam.get(k).push(n.name);
  }
  for (const [k, L] of fam) {
    const rule = RULES.find(r => r[1].test(k)); if (!rule) continue;
    const word = (k.match(rule[1]) || [''])[0];
    const pick = L.length <= PER ? L : [L[0], L[L.length >> 1], L[L.length - 1]];
    pick.forEach((node, i) => assets.push({ id: mid + '/' + node, name: (TH[word] || rule[2]) + (pick.length > 1 ? ' ' + (i + 1) : '') + ' · ' + (MAPN[mid] || mid), cat: rule[0], src: 'maps/' + f, node, col: rule[3], brk: rule[4] || 0, ns: rule[5] }));
  }
}
fs.mkdirSync(outDir, { recursive: true });
const p = path.join(outDir, 'kit.json');
let user = []; try { user = JSON.parse(fs.readFileSync(p, 'utf8')).user || []; } catch (e) {}
const out = { _about: 'คลัง Asset ของ Map Builder (mapbuild.html). assets = สร้างอัตโนมัติด้วย node tools/mapkit-gen.js จากชิ้นใน assets/maps/*.glb • user = Asset ที่เพิ่มเองจากปุ่ม "เพิ่ม Asset" (ไฟล์อยู่ assets/mapkit/). รูปแบบ: guides/MAP-BUILDER.md',
  v: 1, assets, user };
fs.writeFileSync(p, '{\n "_about": ' + JSON.stringify(out._about) + ',\n "v": 1,\n "assets": [\n  ' + assets.map(a => JSON.stringify(a)).join(',\n  ') + '\n ],\n "user": [\n  ' + user.map(a => JSON.stringify(a)).join(',\n  ') + '\n ]\n}\n');
console.log('OK assets/mapkit/kit.json', assets.length, 'ชิ้น +', user.length, 'ของผู้ใช้');
