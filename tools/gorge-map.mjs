// สร้างแมพ "หุบเขาหมอก" (gorge) → maps/build/gorge.json (ต้นฉบับ Map Builder) • ใช้: node tools/gorge-assets.mjs && node tools/gorge-map.mjs
// แล้วส่งเข้าเกม: node tools/gorge-export.mjs  (เปิด mapbuild.html แบบไร้หน้าต่างแล้วเรียก __mb.exportGame()) • รายละเอียด: notes/gorge-map.md
// โครง: หุบเขาคดเคี้ยวเหนือ–ใต้ มีทางดินกลางหุบ สะพานไม้มีหลังคาข้ามหุบตรงกลาง (ลอดใต้ได้) ตลิ่งหินมอสสองฝั่ง ที่ราบสูงเป็นป่าสน
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MD = await import(pathToFileURL(path.join(ROOT, 'mapbuild', 'model.js')).href);
const { rng } = await import('./gorge-assets.mjs');
const INFO = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'mapkit', 'gorge.info.json'), 'utf8'));
const { newMap, pack, gh, vnoise, hash2, slopeAt, C } = MD;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t, sm = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const W = 160, H = 110, SEED = 20261118;
const M = newMap({ id: 'gorge', name: '🌲 หุบเขาหมอก', W, H, surf: 17 });
Object.assign(M, { desc: 'หุบเขาสนหมอกครึ้ม ทางดินคดเคี้ยวไปสะพานไม้มีหลังคา ตลิ่งหินมอสสองฝั่ง', sky: 'day', fog: ['#c3cac4', 30, 270], music: 'forest', weather: '', modes: ['ffa', 'duel', 'tdm', 'coop'], random: 0, autoProps: 1, skirt: 60,
  look: 'gorge', lt: { hemi: ['#d4d9d2', '#4a4636', 0.55], sun: ['#fff0d2', 1.9, [25, 40, -95]], sky: '#cdd3cd', exp: 1.0 } });

// ---------- ภูมิประเทศ ----------
const BZ = 45, BX = 86, DECK = 6.4;                       // สะพาน: กลาง (BX,BZ) พื้นสูง DECK ยาวตามแกน x
const xc = z => 70 + 16 * Math.cos((z - BZ) / 17);        // แนวกลางหุบ
const pcX = z => xc(z) + 1.7 * Math.sin(z / 5.7 + 1) + 0.8 * Math.sin(z / 2.3);   // แนวทางดิน (แกว่งรอบแนวกลาง)
const pinch = z => Math.exp(-(((z - BZ) / 11) ** 2));     // 1 ที่สะพาน (หุบแคบ ตลิ่งสูงชัดสม่ำเสมอ)
const wf = z => lerp(6.2 + 3.2 * vnoise(z / 7 + 3, 1.7), 4.8, pinch(z)) + (z > 85 ? (z - 85) * 0.1 : 0);   // ครึ่งความกว้างพื้นหุบ
function zone(x, z) {
  const dx = x - xc(z), side = dx < 0 ? -1 : 1, P = pinch(z), d = Math.abs(dx) - wf(z), Hb = lerp(side < 0 ? 8.8 : 7.6, DECK, P), Lb = lerp(side < 0 ? 12.5 : 16, 9.0, P);
  return { dx, side, d, P, Hb, Lb, u: clamp(d / Lb, 0, 1) };
}
function height(x, z) {
  const K = Math.max(sm((26 - z) / 14), sm((z - 97) / 13));   // ปลายเหนือ/ใต้ของหุบ: พื้นหุบยกขึ้นเป็นที่ราบสูง (ตลิ่งลดลงตามสัดส่วน → ไม่เกิดผาชัน)
  const Z = zone(x, z), fl = 0.4 * vnoise(x * 0.11, z * 0.11) + 0.16 * vnoise(x * 0.37 + 9, z * 0.37) - 0.28 + 8.2 * K;
  let h;
  if (Z.d <= 0) h = fl;
  else {
    const prof = sm(Z.u), rough = (vnoise(x * 0.17, z * 0.17) - 0.5) * 2.2 * Math.sin(Math.PI * Z.u) * (1 - 0.85 * Z.P) + (vnoise(x * 0.6, z * 0.6) - 0.5) * 0.5 * prof;
    h = fl + Z.Hb * (1 - K) * prof + rough * (1 - K);
    if (Z.d > Z.Lb) h += (vnoise(x * 0.045, z * 0.045 + 5) - 0.5) * 2.6 * (1 - 0.8 * Z.P) + (vnoise(x * 0.13, z * 0.13) - 0.5) * 0.9 * (1 - 0.9 * Z.P) + 0.03 * (Z.d - Z.Lb);
  }
  const e = Math.min(x, W - x, z * 0.6, (H - z) * 0.6); h += 2.4 * sm((14 - e) / 14);   // ขอบแมพยกเป็นเนิน
  return h;
}
for (let j = 0; j < M.ny; j++) for (let i = 0; i < M.nx; i++) M.hg[j * M.nx + i] = Math.round(height(i * C, j * C) * 100) / 100;
{ let hi = 0, bad = 0, tot = 0; for (let j = 0; j < M.ny; j += 2) for (let i = 0; i < M.nx; i += 2) { const s = slopeAt(M, i, j); tot++; if (s > 1.35) bad++; hi = Math.max(hi, s); } console.log('slope max', hi.toFixed(2), 'steep>1.35:', (100 * bad / tot).toFixed(2) + '%'); }

// ---------- พื้นผิว ----------
const S = { grass: 0, dry: 2, dirt: 3, path: 4, rock: 5, moss: 16, litter: 17, gravel: 18, duff: 19, trail: 20 };
for (let j = 0; j < M.ny; j++) for (let i = 0; i < M.nx; i++) {
  const x = i * C, z = j * C, Z = zone(x, z), dp = Math.abs(x - pcX(z)), half = 1.45 + 0.55 * vnoise(z / 4, 2.2), n1 = vnoise(x * 0.2, z * 0.2), n2 = vnoise(x * 0.09 + 7, z * 0.09 + 3), n3 = vnoise(x * 0.5, z * 0.5), sl = slopeAt(M, i, j);
  let s;
  if (Z.d <= 1.0 && dp < half && sl < 0.6) s = n3 < 0.18 ? S.gravel : S.trail;
  else if (Z.d <= 1.0 && dp < half + 1.3 && sl < 0.7) s = n3 < 0.45 ? S.dirt : S.litter;
  else if (sl > 1.05) s = n1 < 0.6 ? S.rock : S.moss;
  else if (Z.d <= 0) s = n1 < 0.22 ? S.gravel : n2 > 0.8 ? S.moss : n2 < 0.4 ? S.duff : S.litter;
  else if (Z.u < 1) s = n2 > 0.78 ? S.moss : n1 < 0.3 ? S.rock : n1 > 0.62 ? S.duff : S.litter;
  else s = n2 > 0.82 ? S.moss : n1 < 0.4 ? S.litter : S.duff;
  if ((s === S.litter || s === S.duff) && hash2(i * 3 + 1, j * 7 + 2) < 0.22) s = hash2(i + 9, j + 4) < 0.5 ? S.gravel : (s === S.litter ? S.duff : S.litter);   // ลายด่างของใบไม้/ดิน/กรวด
  M.sf[j * M.nx + i] = s;
}

// ---------- วางของ ----------
const R = rng(SEED), rnd = (a, b) => a + (b - a) * R();
const placed = [];                                          // {x,z,r}
const grid = new Map(), GS = 4, gk = (x, z) => Math.floor(x / GS) + ',' + Math.floor(z / GS);
const free = (x, z, r) => { for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const L = grid.get((Math.floor(x / GS) + a) + ',' + (Math.floor(z / GS) + b)); if (L) for (const q of L) if (Math.hypot(q.x - x, q.z - z) < q.r + r) return false; } return true; };
const mark = (x, z, r) => { const k = gk(x, z); if (!grid.has(k)) grid.set(k, []); grid.get(k).push({ x, z, r }); placed.push({ x, z, r }); };
let id = 1; const OBJS = M.objs;
const put = (t, x, z, o = {}) => { const g = gh(M, x, z); OBJS.push(Object.assign({ id: id++, t, x: +x.toFixed(2), z: +z.toFixed(2), y: 0, rot: 0 }, o)); return g; };
const kit = (k, x, z, o = {}) => { const s = o.s || 1, I = INFO[k], tr = I.trunk ? clamp(I.trunk / Math.max(I.ex, I.ez), 0.05, 1) : null;
  const ob = Object.assign({ rot: R() * 6.283, s }, o); if (I.col && tr && o.cs == null) ob.cs = +tr.toFixed(3); if (!I.col) ob.col = 0; return put('kit:gorge/' + k, x, z, ob); };
const inBox = (x, z, pad) => x > BX - 17 - pad && x < BX + 17 + pad && z > BZ - 5.5 - pad && z < BZ + 5.5 + pad;   // รอบสะพาน
// จุดเกม
const sp = (t, x, z, rot) => { put(t, x, z, { rot }); mark(x, z, 4.2); };
const flatSpot = (z, off) => [xc(z) + off, z];
for (const [z, off, rot] of [[93, -4, Math.PI], [95, 0.5, Math.PI], [92.5, 5, Math.PI]]) { const [x] = flatSpot(z, off); sp('spawnR', x, z, rot); }
for (const [z, off, rot] of [[31, -4, 0], [28.5, 0.5, 0], [32, 4.5, 0]]) { const [x] = flatSpot(z, off); sp('spawnB', x, z, rot); }
for (const [z, off, rot] of [[84, -3, Math.PI], [74, 4, Math.PI], [64, -4, 0], [56, 2, Math.PI], [37, 3.5, 0], [24.5, 0, 0]]) { const [x] = flatSpot(z, off); sp('spawn', x, z, rot); }
sp('spawn', 130, 66, 2.4); sp('spawn', 28, 74, 0.8); sp('spawn', 40, 30, 5.5); sp('spawn', 120, 28, 3.9);   // บนที่ราบสูง
// พื้นที่ห้ามต้นไม้: ทางดิน + ใต้/รอบสะพาน
const nearPath = (x, z, w) => Math.abs(x - pcX(z)) < w && zone(x, z).d < 3;
const SMALL = (x, z) => nearPath(x, z, 2.4) || inBox(x, z, 1.5);

// สะพาน
{ const I = INFO.bridge_cov, g = gh(M, BX, BZ); const ob = { id: id++, t: 'kit:gorge/bridge_cov', x: BX, z: BZ, y: +(DECK + I.y0 - g).toFixed(2), rot: 0, s: 1, col: 0 }; OBJS.push(ob); }
M.floors.push({ id: 1, x: BX, z: BZ, w: 5.6, d: 28, rot: Math.PI / 2, y: DECK, y2: DECK, th: 0.35, c: '#4a463e', steps: 0 });
for (const s of [-1, 1]) M.walls.push({ id: M.walls.length + 1, pts: [[BX - 14, BZ + s * 2.8], [BX + 14, BZ + s * 2.8]], th: 0.3, h: 1.3, c: '#38352f', m: 'wood', closed: 0, curve: 0, brk: 0, base: DECK });
mark(BX - 14, BZ, 3); mark(BX + 14, BZ, 3);
let tries = 0;
let na = 0; tries = 0;
while (na < 12 && tries++ < 20000) { const x = rnd(6, W - 6), z = rnd(30, 105), Z = zone(x, z), dp = Math.abs(x - pcX(z)); if (SMALL(x, z) || dp < 4.5 || dp > 34 || Z.d > Z.Lb + 14) continue; if (z > 62 && z < 74 && R() < 0.5) continue; if (!free(x, z, 4.6)) continue; kit(R() < 0.55 ? 'autumn_a' : 'autumn_b', x, z, { s: rnd(0.9, 1.2), y: -0.1 }); mark(x, z, 4.6); na++; }
// หินใหญ่ ตามตลิ่ง
const kinds = [['boulder_a', 2.7, 0.12], ['boulder_b', 1.6, 0.28], ['boulder_c', 1.3, 0.28], ['boulder_d', 1.1, 0.32]];
let nb = 0;
for (let t = 0; t < 9000 && nb < 46; t++) {
  const x = rnd(4, W - 4), z = rnd(6, H - 5), Z = zone(x, z); if (SMALL(x, z) || nearPath(x, z, 5.2) || Z.P > 0.55 && Z.d < 9 && Z.d > -1 && R() < 0.35) continue;
  const edge = Z.d > -3 && Z.d < Z.Lb * 0.8, ok = edge ? R() < 0.9 : R() < 0.05; if (!ok) continue;
  let r0 = R(), k = kinds[0]; let a = 0; for (const q of kinds) { a += q[2]; if (r0 < a) { k = q; break; } }
  const s = rnd(0.8, 1.35); if (!free(x, z, k[1] * s * 0.7)) continue;
  kit(k[0], x, z, { s, y: -0.12 * s }); mark(x, z, k[1] * s * 0.85); nb++;
}
// ผาหิน (ผนังหินริมตลิ่ง)
let nc = 0;
for (let t = 0; t < 9000 && nc < 13; t++) {
  const x = rnd(6, W - 6), z = rnd(10, H - 8), Z = zone(x, z); if (SMALL(x, z) || Z.d < 1 || Z.u > 0.85 || Z.u < 0.12) continue; if (Z.side > 0 && R() < 0.5) continue;
  const big = R() < 0.55, k = big ? 'cliff_a' : 'cliff_b', s = rnd(0.75, 1.25), r = (big ? 4 : 2.4) * s; if (!free(x, z, r * 0.8)) continue;
  kit(k, x, z, { s, y: -0.55 * s, cs: 0.8 }); mark(x, z, r); nc++;
}
// ต้นไม้
const pineKinds = reg => reg === 'plateau' ? [['pine_b', 0.3], ['pine_a', 0.3], ['pine_c', 0.18], ['pine_d', 0.14], ['pine_s', 0.08]] : reg === 'bank' ? [['pine_a', 0.38], ['pine_c', 0.3], ['pine_b', 0.15], ['pine_s', 0.17]] : [['pine_a', 0.34], ['pine_c', 0.34], ['pine_s', 0.32]];
const pick = L => { let r = R(), a = 0; for (const q of L) { a += q[1]; if (r < a) return q[0]; } return L[0][0]; };
let np = 0; tries = 0; const NPINE = 150;
while (np < NPINE && tries++ < 40000) {
  const x = rnd(2.5, W - 2.5), z = rnd(2.5, H - 2.5), Z = zone(x, z), reg = Z.d <= 0 ? 'floor' : Z.u < 1 ? 'bank' : 'plateau';
  if (SMALL(x, z)) continue; if (reg === 'floor' && (R() < 0.7 || Math.abs(x - pcX(z)) < 3.6)) continue; if (reg === 'bank' && R() < 0.35) continue;
  const edgeD = Math.min(x, W - x, z, H - z), dens = edgeD < 12 ? 2.2 : 3.0, k = pick(pineKinds(reg)); if (!free(x, z, dens)) continue;
  kit(k, x, z, { s: rnd(0.88, 1.18), y: -0.15 }); mark(x, z, dens); np++;
}
// สนไกล (เบา) ที่ราบสูงห่างทาง + วงนอกแมพ (ไม่มีที่ชน) → ขอบฟ้าเต็มไปด้วยลำต้นสน
let nf = 0; tries = 0;
while (nf < 80 && tries++ < 40000) { const x = rnd(2.5, W - 2.5), z = rnd(2.5, H - 2.5), Z = zone(x, z); if (SMALL(x, z) || Z.d < 6 || Math.abs(x - pcX(z)) < 20 || !free(x, z, 3.0)) continue;
  kit(R() < 0.5 ? 'pine_la' : 'pine_lb', x, z, { s: rnd(0.9, 1.25), y: -0.15 }); mark(x, z, 3.0); nf++; }
let nr = 0; tries = 0;
while (nr < 130 && tries++ < 60000) { const x = rnd(-42, W + 42), z = rnd(-42, H + 42); if (x > -1 && x < W + 1 && z > -1 && z < H + 1) continue; if (!free(x, z, 3.3)) continue;
  kit(R() < 0.5 ? 'pine_la' : 'pine_lb', x, z, { s: rnd(0.95, 1.4), y: -0.15, col: 0 }); mark(x, z, 3.3); nr++; }
let ns = 0; tries = 0;
while (ns < 22 && tries++ < 20000) { const x = rnd(4, W - 4), z = rnd(6, H - 6), Z = zone(x, z); if (SMALL(x, z) || Z.d < -1 || Z.P > 0.7 && Z.d < 14) continue; if (!free(x, z, 2.4)) continue; kit(R() < 0.55 ? 'snag_a' : 'snag_b', x, z, { s: rnd(0.9, 1.25), y: -0.1 }); mark(x, z, 2.4); ns++; }
// ขอนไม้ + ตอ (วางตามแนวระดับของตลิ่ง / พาดข้ามริมทาง)
const contour = (x, z) => { const e = 0.6, gx = gh(M, x + e, z) - gh(M, x - e, z), gz = gh(M, x, z + e) - gh(M, x, z - e); return -Math.atan2(gx, -gz) * 0 + Math.atan2(gz, gx) + Math.PI / 2; };   // ทิศขนานเส้นชั้นความสูง (มุมในระนาบ x,z)
let nl = 0; tries = 0;
while (nl < 26 && tries++ < 20000) {
  const x = rnd(5, W - 5), z = rnd(8, H - 6), Z = zone(x, z); if (inBox(x, z, 2) || Z.d > Z.Lb + 6) continue;
  const k = nl < 7 ? 'log_a' : nl < 17 ? 'log_b' : 'log_c', r = k === 'log_a' ? 3.2 : k === 'log_b' ? 2 : 1.3; if (!free(x, z, r * 0.8)) continue;
  const near = nearPath(x, z, 3.8), ang = near ? rnd(0.6, 2.4) : contour(x, z) + rnd(-0.35, 0.35); kit(k, x, z, { rot: -ang, y: -0.12 }); mark(x, z, r * 0.8); nl++;
}
let nt = 0; tries = 0; while (nt < 9 && tries++ < 8000) { const x = rnd(5, W - 5), z = rnd(8, H - 6); if (SMALL(x, z) || !free(x, z, 1.6)) continue; kit('stump_a', x, z, { s: rnd(0.8, 1.3), y: -0.05 }); mark(x, z, 1.1); nt++; }
// ของเล็ก (ไม่มีที่ชน): หินกรวดริมทาง พุ่ม เฟิร์น
for (let k = 0, n = 0; k < 6000 && n < 200; k++) { const z = rnd(6, H - 4), x = pcX(z) + (R() < 0.5 ? rnd(-2.2, 2.2) : rnd(-7, 7)), Z = zone(x, z); if (x < 3 || x > W - 3 || Z.d > 4 || !free(x, z, 0.35)) continue; const t = pick([['stone_a', 0.42], ['stone_b', 0.36], ['stone_c', 0.22]]); kit(t, x, z, { s: rnd(0.8, 1.6), y: -0.04 }); mark(x, z, 0.3); n++; }
for (let k = 0, n = 0; k < 6000 && n < 30; k++) { const x = rnd(4, W - 4), z = rnd(6, H - 5), Z = zone(x, z); if (nearPath(x, z, 1.8) || inBox(x, z, 0) || Z.d > Z.Lb + 8 || !free(x, z, 0.9)) continue; kit(R() < 0.55 ? 'shrub_a' : 'shrub_b', x, z, { s: rnd(0.85, 1.4), y: -0.05 }); mark(x, z, 0.7); n++; }
for (let k = 0, n = 0; k < 8000 && n < 70; k++) { const x = rnd(4, W - 4), z = rnd(6, H - 5), Z = zone(x, z); if (nearPath(x, z, 1.4) || inBox(x, z, 0) || Z.d > Z.Lb + 8 || !free(x, z, 0.7)) continue; kit(R() < 0.6 ? 'fern_a' : 'fern_b', x, z, { s: rnd(0.9, 1.5), y: -0.02 }); mark(x, z, 0.5); n++; }
M.seq = id + 10;
const out = path.join(ROOT, 'maps', 'build', 'gorge.json');
fs.writeFileSync(out, JSON.stringify(pack(M)));
const cnt = {}; for (const o of OBJS) cnt[o.t] = (cnt[o.t] || 0) + 1;
let tris = 0; for (const o of OBJS) { const k = (o.t.split('/')[1]); if (INFO[k]) tris += INFO[k].tris; }
console.log('OK maps/build/gorge.json', M.W + 'x' + M.H, 'objs', OBJS.length, 'tris(objs)~', tris); console.log(Object.entries(cnt).map(([k, v]) => k.replace('kit:gorge/', '') + ':' + v).join(' '));
