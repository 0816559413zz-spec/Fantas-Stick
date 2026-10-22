// สร้างไฟล์เอฟเฟกต์สายน้ำแข็ง assets/fx/frost/*.fx.json + ผูก bind.json (รัน: node tools/frost-fx-gen.js แล้ว node tools/fx-check.js)
// แก้ค่าที่นี่แล้วรันใหม่ (ไฟล์ .fx.json ถูกเขียนทับ) — หรือแก้ .fx.json ในสตูดิโอได้เลยแล้วไม่ต้องรันสคริปต์นี้อีก
// ภาพเท่านั้น: ไม่แตะดาเมจ/ระยะ/เวลา (ระยะ/รัศมีมาจาก event ของ host ผ่าน p ใน bind)
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..', 'assets', 'fx', 'frost');
fs.mkdirSync(DIR, { recursive: true });
// จานสี Frost: ขาวแกน • ฟ้าซีด • ฟ้าน้ำแข็ง • น้ำเงินลึก (เห็นบนพื้นขาว) • หมอก
const C = { core: '#ffffff', hi: '#e6f7ff', main: '#9fdcff', deep: '#2f7fe0', navy: '#1d4f9e', mist: '#d6ecff', mist2: '#8fb4d8' };
const FX = {};
const fx = (name, desc, tags, dur, params, layers) => { FX[name] = { v: 1, desc, tags: ['frost', ...tags], pal: 'ice', dur, params, layers }; };

// ---------- ชิ้นส่วนที่ใช้ซ้ำ ----------
const shardsOut = (id, o) => Object.assign({ id, t: 'emit', at: 0, life: 0.05, burst: 8, from: 'sphere', fr: 0.3, dir: 'out', spread: 1, speed: [4, 9], up: [1, 3],
  plife: [0.6, 1.1], look: 'model', model: 'frost_shard', mmat: 'ice', msize: [0.12, 0.26], bounce: 0.3, mspin: 540, gravity: 12, drag: 1.2, col: C.hi, c2: C.deep }, o);
const flakes = (id, o) => Object.assign({ id, t: 'emit', at: 0, life: 0.05, burst: 14, from: 'sphere', fr: 0.4, dir: 'out', spread: 1.2, speed: [1.5, 5], up: [0.5, 2],
  plife: [0.7, 1.3], look: 'flake', size: [2, 3.4], col: C.core, c2: C.main, gravity: 1.2, drag: 2.2, spin: 6, fin: 6, x: true }, o);
const glints = (id, o) => Object.assign({ id, t: 'emit', at: 0, life: 0.05, burst: 8, from: 'sphere', fr: 0.5, dir: 'out', spread: 1.2, speed: [1, 3],
  plife: [0.25, 0.5], look: 'glow', fb: 'tex/star_flare', size: [5, 8], col: C.core, c2: C.main, gravity: 0, drag: 3, x: true }, o);
// หมอกเย็นต่ำ = ชั้น mist ของเกม (Glacier Mist) — o.fr = รัศมี, o.burst = จำนวนก้อน, o.out = แรงพุ่งออก
const mistPuffs = (id, o) => { const m = { id, t: 'mist', at: o.at || 0, life: 1, att: o.att || 'ground', r: o.fr !== undefined ? o.fr : 1, n: Math.max(1, Math.min(40, o.burst || 6)), out: o.out !== undefined ? o.out : 1.4 };
  if (o.pos) m.pos = o.pos; if (o.x) m.x = true; return m; };
const snd = (id, name, vol, at) => ({ id, t: 'sound', at: at || 0, life: 0.05, name, vol });
const shake = (id, n, at) => ({ id, t: 'screen', at: at || 0, life: 0.2, shake: n, own: true });
// สั่นจอคนอื่นที่อยู่ใกล้ (≤50 ม. = 1000 px เหมือนโค้ดเดิม) • all = ทุกคนใกล้ ๆ รวมคนร่าย
const shakeNear = (id, n, at, all) => Object.assign({ id, t: 'screen', at: at || 0, life: 0.2, shake: n, near: 50 }, all ? {} : { other: true });

// ---------- 1) ฟันดาบ / ขวาน (event swing) ----------
// dir +1 = ฟันขวา→ซ้าย (จังหวะ 1), -1 = ซ้าย→ขวา (จังหวะ 2) • r = ระยะฟัน (ม.)
function swing(name, axe, dir) {
  const a0 = 85 * dir, a1 = -85 * dir, tilt = 22 * dir, R = axe ? 'r*1.1' : 'r';
  const L = [
    { id: 'blade', t: 'mesh', at: 0, life: axe ? 0.3 : 0.22, shape: 'model', model: axe ? 'frost_axeblade' : 'frost_blade', mat: 'ice',
      rot: [0, 0, tilt], pos: [0, 0, 0], col: C.main, col2: C.deep,
      scale: { '0': [0.55, 1, 0.55], '0.35': [1, 1, 1], '1': [1.06, 1, 1.06], ease: 'out', x: axe ? 'r*1.05' : 'r*0.95' }, op: { '0': 0.95, '0.6': 0.8, '1': 0 }, dis: { '0': 0, '0.5': 0, '1': 0.85 } },
    { id: 'edge', t: 'trail', at: 0, life: axe ? 0.16 : 0.12, sweep: true, a0, a1, r: R, r0: axe ? 'r*0.86' : 'r*0.9', tilt, col: C.core, col2: C.main, tlife: 0.22, k: 2, w: 0.3 },
    { id: 'body', t: 'trail', at: 0, life: axe ? 0.16 : 0.12, sweep: true, a0, a1, r: axe ? 'r*1.02' : 'r*0.94', r0: axe ? 'r*0.45' : 'r*0.62', tilt, col: C.main, col2: C.navy, tlife: axe ? 0.24 : 0.18, k: 1.1, w: 0.3 },
    shardsOut('hang', { at: 0.04, burst: axe ? 12 : 8, from: 'ring', fr: 'r*0.85', pos: [0, 0, 0], dir: 'tangent', spread: 0.3, speed: [0.6, 1.6], up: [0.2, 0.8], plife: [0.35, 0.6], msize: axe ? [0.14, 0.28] : [0.1, 0.2], gravity: 1.5, drag: 3, mspin: 300, bounce: 0 }),
    shardsOut('shards', { at: 0.06, burst: axe ? 9 : 4, from: 'disc', fr: 'r*0.5', pos: [0, 0, 'r*0.6'], dir: 'aim', spread: 1.1, speed: axe ? [5, 10] : [4, 8], msize: axe ? [0.14, 0.3] : [0.08, 0.18] }),
    flakes('flakes', { at: 0.05, burst: axe ? 16 : 10, from: 'disc', fr: 'r*0.55', pos: [0, 0, 'r*0.55'], dir: 'aim', speed: [1.5, 4] }),
    glints('glint', { at: 0.04, burst: axe ? 6 : 4, from: 'disc', fr: 'r*0.6', pos: [0, 0, 'r*0.6'], size: [4, 7] }),
    mistPuffs('mist', { at: 0.06, burst: axe ? 6 : 3, att: 'ground', fr: 'r*0.4', pos: [0, 0, 'r*0.55'], out: 0.8, x: true }),
    snd('snd', 'whoosh', axe ? 0.6 : 0.5)
  ];
  if (axe) L.push({ id: 'chips', t: 'debris', at: 0.05, life: 0.9, kind: 'ice', n: 5, speed: 6, r: 'r*0.5', size: 0.7, pos: [0, 0, 'r*0.6'], x: true });
  fx(name, (axe ? 'ฟันขวานน้ำแข็ง: รอยกว้างหนัก' : 'ฟันดาบน้ำแข็ง: รอยแคบคม') + ' — เสี้ยวผลึก + ขอบขาว + เศษผลึก/เกล็ด/หมอก (' + (dir > 0 ? 'ขวา→ซ้าย' : 'ซ้าย→ขวา') + ')',
    ['slash', 'melee'], 1.1, { r: { def: 6, desc: 'ระยะฟัน (ม.) = ev.r/20' } }, L);
}
swing('swing_sword_a', false, 1); swing('swing_sword_b', false, -1);
swing('swing_axe_a', true, 1); swing('swing_axe_b', true, -1);
// จังหวะ 3 = ง้างอาวุธ (ยังไม่ฟัน): ความเย็นรวมตัวที่อาวุธ
fx('swing_windup', 'ง้างอาวุธจังหวะ 3: เกล็ด/ประกายเย็นดูดเข้าหาอาวุธเหนือหัว', ['melee', 'charge'], 0.5, {}, [
  { id: 'pull', t: 'emit', at: 0, life: 0.18, rate: 70, from: 'sphere', fr: 1.3, pos: [0.2, 0.9, 0.1], dir: 'in', speed: [3, 5], plife: [0.2, 0.3], look: 'streak', size: [1.4, 2.2], col: C.core, c2: C.main, gravity: 0, drag: 0, curl: false },
  { id: 'halo', t: 'halo', at: 0, life: 0.3, pos: [0.2, 0.9, 0.1], col: C.main, size: 1.2, size0: 0.3, k: 0.6 },
  snd('snd', 'whoosh', 0.35)
]);
// อาวุธลอย 2 เล่มของ Mirror Legion ฟันตาม (ช้ากว่า 0.12 วิ, กลับทิศ) — ซ้าย/ขวา ห่าง 2.75 ม. หน้า 1.5 ม.
fx('swing_echo', 'อาวุธลอย 2 เล่มของ Mirror Legion ฟันตาม: รอยกระจกน้ำแข็งสะท้อน 2 ข้าง ช้ากว่า 0.12 วิ', ['slash', 'melee', 'mirror'], 0.7, { r: { def: 6, desc: 'ระยะฟัน (ม.)' } },
  [-1, 1].flatMap(k => [
    { id: 'echo' + (k > 0 ? 'R' : 'L'), t: 'trail', at: 0.12, life: 0.12, sweep: true, a0: -80, a1: 80, r: 'r*0.9', r0: 'r*0.6', tilt: -14, pos: [2.75 * k, 0.15, 1.5], col: C.hi, col2: C.deep, tlife: 0.2, k: 1.3, w: 0.3 },
    flakes('fl' + (k > 0 ? 'R' : 'L'), { at: 0.14, burst: 6, pos: [2.75 * k, 0, 2.6], dir: 'aim', speed: [1.5, 3] })
  ]));

// ---------- 2) จังหวะ 3 ฟาดพื้น (slam3) ----------
// จุด event = จุดกระแทก (หน้าผู้เล่น r*0.8/0.75) • r = รัศมีกระแทก (ม.)
fx('slam3', 'จังหวะ 3 ฟาดพื้น: รอยฟันแนวตั้ง → พื้นแตกร้าว + หนามน้ำแข็งพุ่ง + เศษผลึก + คลื่นหมอกเย็น', ['melee', 'ground', 'impact'], 2.1, { r: { def: 3.4, desc: 'รัศมีกระแทก (ม.) = ev.r/20' } }, [
  { id: 'vslash', t: 'trail', at: 0, life: 0.1, sweep: true, a0: -100, a1: 30, r: 'r*1.3', r0: 'r*0.8', tilt: 90, att: 'ground', pos: [0, 0.4, '-r*1.05'], col: C.core, col2: C.deep, tlife: 0.18, k: 1.6, w: 0.3 },
  { id: 'core', t: 'flash', at: 0.05, life: 0.1, att: 'ground', pos: [0, 0.4, 0], col: C.hi, size: 2 },
  { id: 'spires', t: 'mesh', at: 0.05, life: 1.15, att: 'ground', shape: 'model', model: 'frost_spires', mat: 'ice', col: C.main, col2: C.deep,
    scale: { '0': 1, '1': 1, x: 'r*0.45' }, grow: { '0': 0, '0.12': 1, '0.75': 1, '1': 0 }, stagger: 0.5, growBy: 'center' },
  { id: 'cracks', t: 'decal', at: 0.04, life: 2, att: 'ground', kind: 'icecrack', r: 'r*1.5', n: 12, col: C.deep },
  { id: 'floor', t: 'mesh', at: 0.04, life: 1.5, att: 'ground', shape: 'disc', mat: 'ice', pos: [0, 0.03, 0], col: C.main, col2: C.deep,
    scale: { '0': 0.2, '0.15': 1, '1': 1, ease: 'out', x: 'r*0.95' }, op: { '0': 0.55, '0.7': 0.45, '1': 0 } },
  shardsOut('shards', { at: 0.05, burst: 12, att: 'ground', from: 'ring', fr: 'r*0.35', pos: [0, 0.3, 0], dir: 'up', spread: 0.9, speed: [5, 10], up: [3, 6] }),
  { id: 'chips', t: 'debris', at: 0.05, life: 1.1, att: 'ground', kind: 'ice', n: 8, speed: 7, r: 'r*0.3', size: 0.9 },
  flakes('flakes', { at: 0.06, burst: 18, att: 'ground', pos: [0, 0.5, 0], from: 'ring', fr: 'r*0.5', dir: 'up', speed: [2, 5] }),
  mistPuffs('mist', { at: 0.08, burst: 10, fr: 'r*0.6', speed: [2, 4] }),
  { id: 'shock', t: 'ring', at: 0.05, life: 0.4, att: 'ground', pos: [0, 0.12, 0], col: C.main, r: 'r*1.4', op: 0.6 },
  { id: 'warp', t: 'warp', at: 0.05, life: 0.4, att: 'ground', kind: 'shock', flat: true, size: { '0': 1, '1': 1, x: 'r*3' }, str: 0.6, col: C.main, glow: 0.04, x: true },
  { id: 'light', t: 'light', at: 0.05, life: 0.35, att: 'ground', pos: [0, 1.2, 0], col: C.main, int: 1.4, dist: 12 },
  shake('cam', 5, 0.05), shakeNear('cam2', 2, 0.05), snd('snd', 'slam', 0.8, 0.04), snd('snd2', 'break', 0.6, 0.06)
]);
fx('slam3_echo', 'อาวุธลอย 2 เล่มของ Mirror Legion ฟาดพื้นตาม: หนามน้ำแข็งเล็ก 2 ข้าง', ['melee', 'ground', 'mirror'], 1.4, { r: { def: 3.4, desc: 'รัศมี (ม.)' } },
  [-1, 1].flatMap(k => [
    { id: 'sp' + k, t: 'mesh', at: 0.1, life: 0.9, att: 'ground', pos: [2.75 * k, 0, 0], shape: 'model', model: 'frost_spires', mat: 'ice', col: C.main, col2: C.deep,
      scale: { '0': 1, '1': 1, x: 'r*0.35' }, grow: { '0': 0, '0.15': 1, '0.7': 1, '1': 0 }, stagger: 0.5 },
    { id: 'cr' + k, t: 'decal', at: 0.1, life: 1.3, att: 'ground', pos: [2.75 * k, 0, 0], kind: 'icecrack', r: 'r*0.9', n: 8, col: C.deep },
    flakes('fl' + k, { at: 0.12, burst: 8, att: 'ground', pos: [2.75 * k, 0.4, 0], dir: 'up', speed: [2, 4] })
  ]));

// ---------- 3) ลงพื้นจากที่สูง (slamgo / slam) ----------
fx('slamgo', 'เริ่มดิ่งลงจากที่สูง: เกล็ดหมุนรอบตัว + เสียงลม', ['melee', 'air'], 0.6, {}, [
  flakes('flakes', { burst: 12, from: 'ring', fr: 0.6, dir: 'tangent', speed: [3, 5], up: [-1, 0] }),
  { id: 'streak', t: 'emit', at: 0, life: 0.05, burst: 10, from: 'ring', fr: 0.4, dir: 'up', spread: 0.3, speed: [5, 9], plife: [0.2, 0.35], look: 'streak', size: [1.4, 2], col: C.core, c2: C.main, gravity: 0, drag: 1 },
  snd('snd', 'whoosh', 0.6)
]);
fx('slam', 'ลงพื้นจากที่สูง: วงร้าวน้ำแข็งเตี้ย + ผลึกเตี้ยรอบวงงอกแล้วยุบเร็ว + เศษเลียดพื้น + หมอกคลื่น', ['melee', 'ground', 'impact'], 2, { r: { def: 7.5, desc: 'รัศมี (ม.) = ev.r/20' } }, [
  { id: 'core', t: 'flash', at: 0, life: 0.1, att: 'ground', pos: [0, 0.3, 0], col: C.hi, size: 2.2 },
  { id: 'cracks', t: 'decal', at: 0, life: 2, att: 'ground', kind: 'icecrack', r: 'r*0.85', n: 14, col: C.deep },
  { id: 'rim', t: 'mesh', at: 0.02, life: 0.75, att: 'ground', shape: 'model', model: 'frost_rim', mat: 'ice', col: C.main, col2: C.deep,
    scale: ['r*0.6', 3.2, 'r*0.6'], grow: { '0': 0, '0.2': 1, '0.55': 1, '1': 0 }, stagger: 0.35, growBy: 'center' },
  { id: 'spires', t: 'mesh', at: 0.02, life: 0.7, att: 'ground', shape: 'model', model: 'frost_spires', mat: 'ice', col: C.main, col2: C.deep,
    scale: { '0': [1, 0.55, 1], '1': [1, 0.55, 1], x: 'r*0.16' }, grow: { '0': 0, '0.15': 1, '0.6': 1, '1': 0 }, stagger: 0.4 },
  { id: 'skim', t: 'emit', at: 0, life: 0.05, burst: 22, att: 'ground', from: 'ring', fr: 0.6, pos: [0, 0.15, 0], dir: 'flat', speed: ['r*1.6', 'r*2.4'], plife: [0.3, 0.45],
    look: 'streak', size: [1.8, 2.6], col: C.core, c2: C.main, gravity: 0, drag: 3 },
  shardsOut('shards', { at: 0, burst: 10, att: 'ground', from: 'ring', fr: 0.8, pos: [0, 0.2, 0], dir: 'flat', speed: [6, 11], up: [1.5, 3] }),
  mistPuffs('mist', { at: 0.04, burst: 14, fr: 'r*0.25', speed: ['r*0.4', 'r*0.6'], size: [16, 24] }),
  { id: 'shock', t: 'ring', at: 0, life: 0.45, att: 'ground', pos: [0, 0.12, 0], col: C.deep, r: 'r', op: 0.45 },
  { id: 'warp', t: 'warp', at: 0, life: 0.45, att: 'ground', kind: 'shock', flat: true, size: { '0': 1, '1': 1, x: 'r*2.2' }, str: 0.7, col: C.main, glow: 0.04, x: true },
  { id: 'light', t: 'light', at: 0, life: 0.35, att: 'ground', pos: [0, 1.2, 0], col: C.main, int: 1.5, dist: 16 },
  shake('cam', 6), shakeNear('cam2', 2), snd('snd', 'slam', 0.9)
]);

// ---------- 4) ไถลน้ำแข็ง (slide) ----------
fx('slide', 'เริ่มไถลน้ำแข็ง: แผ่นน้ำแข็งผุดใต้เท้า + ผลึกแตกกระจาย + เศษเตะไปข้างหน้า + หมอกต่ำ', ['dash', 'ground'], 1.2, {}, [
  { id: 'plates', t: 'mesh', at: 0, life: 0.6, att: 'ground', shape: 'model', model: 'frost_spires', mat: 'ice', col: C.main, col2: C.deep,
    scale: { '0': [1.2, 0.35, 1.2], '1': [1.2, 0.35, 1.2] }, grow: { '0': 0, '0.15': 1, '0.55': 1, '1': 0 }, stagger: 0.4, growBy: 'random' },
  { id: 'cracks', t: 'decal', at: 0, life: 1.1, att: 'ground', kind: 'icecrack', r: 1.6, n: 8, col: C.deep },
  shardsOut('kick', { burst: 8, att: 'ground', from: 'disc', fr: 0.5, pos: [0, 0.2, 0.4], dir: 'aim', spread: 0.6, speed: [6, 11], up: [1.5, 3] }),
  flakes('flakes', { burst: 12, att: 'ground', pos: [0, 0.3, 0], from: 'ring', fr: 0.6, dir: 'flat', speed: [2, 5], up: [0.5, 1.5] }),
  mistPuffs('mist', { burst: 6, fr: 0.7, speed: [0.8, 1.8], size: [12, 18] }),
  { id: 'ring', t: 'ring', at: 0, life: 0.3, att: 'ground', pos: [0, 0.1, 0], col: C.main, r: 2, op: 0.5 },
  snd('snd', 'whoosh', 0.6)
]);

// ---------- 5) ก้อนน้ำแข็งยักษ์ Frostforge โหมดไกลระเบิด (iceboom) ----------
fx('iceboom', 'ก้อนน้ำแข็ง Frostforge แตก: ผลึกพุ่งรอบทิศ + มงกุฎหนามบนพื้น + หมอกเย็น', ['impact', 'ice'], 1.6, { r: { def: 5, desc: 'รัศมี (ม.) = ev.r/20' } }, [
  { id: 'core', t: 'flash', at: 0, life: 0.1, col: C.hi, size: 2.4 },
  { id: 'burst', t: 'mesh', at: 0, life: 0.35, shape: 'spikes', n: 14, mat: 'ice', col: C.main, col2: C.deep, scale: { '0': 0.3, '0.3': 1, '1': 1.15, ease: 'out', x: 'r*0.32' }, op: { '0': 1, '0.6': 0.9, '1': 0 } },
  { id: 'spires', t: 'mesh', at: 0.03, life: 1.1, att: 'ground', shape: 'model', model: 'frost_spires', mat: 'ice', col: C.main, col2: C.deep,
    scale: { '0': 1, '1': 1, x: 'r*0.3' }, grow: { '0': 0, '0.12': 1, '0.75': 1, '1': 0 }, stagger: 0.5 },
  shardsOut('shards', { burst: 16, fr: 0.4, speed: ['r*1.2', 'r*2.2'] }),
  flakes('flakes', { burst: 16, speed: [2, 6] }),
  glints('glint', { burst: 8, fr: 'r*0.3' }),
  { id: 'cracks', t: 'decal', at: 0, life: 1.6, att: 'ground', kind: 'icecrack', r: 'r*0.7', n: 10, col: C.deep },
  mistPuffs('mist', { at: 0.03, burst: 10, fr: 'r*0.3', speed: [1.5, 3] }),
  { id: 'shock', t: 'ring', at: 0, life: 0.35, col: C.main, r: 'r*0.9', op: 0.55 },
  { id: 'light', t: 'light', at: 0, life: 0.3, pos: [0, 0.5, 0], col: C.main, int: 1.5, dist: 12 },
  snd('snd', 'break', 0.8)
]);

// ---------- 6) Permafrost (perma) ----------
// พื้นน้ำแข็งถาวร/วง (ICEV + ZV) ยังวาดจากโค้ด 'ice' — ไฟล์นี้ = ช่วงเปิด + ผลึกขอบวง + หิมะลอยวน + แตกตอนหมด
fx('perma', 'Permafrost: ผลึกแตกออก → พื้นแข็งจากกลางถึงขอบ + รอยร้าวแตกกิ่ง + ผลึกเตี้ยรอบขอบ + หิมะลอยวน + แตกเป็นเศษตอนหมด (6 วิ)', ['zone', 'ground'], 6.4, { r: { def: 15, desc: 'รัศมีวง (ม.) = ev.r/20' } }, [
  { id: 'core', t: 'flash', at: 0, life: 0.12, att: 'ground', pos: [0, 0.6, 0], col: C.main, size: 2.4 },
  { id: 'burst', t: 'mesh', at: 0, life: 1.2, att: 'ground', shape: 'model', model: 'frost_spires', mat: 'ice', col: C.main, col2: C.deep,
    scale: { '0': 1, '1': 1, x: 1.6 }, grow: { '0': 0, '0.1': 1, '0.7': 1, '1': 0 }, stagger: 0.5 },
  shardsOut('shards', { burst: 16, att: 'ground', pos: [0, 0.5, 0], fr: 0.8, dir: 'flat', speed: [7, 13], up: [2, 4] }),
  { id: 'freeze', t: 'mesh', at: 0, life: 6, att: 'ground', shape: 'disc', mat: 'ice', pos: [0, 0.04, 0], col: C.main, col2: C.deep,
    scale: { '0': 0.05, '0.07': 1, '1': 1, ease: 'out', x: 'r' }, op: { '0': 0.5, '0.9': 0.32, '1': 0 }, fade: 0.1 },
  { id: 'cracks', t: 'decal', at: 0.1, life: 6, att: 'ground', kind: 'icecrack', r: 'r*0.95', n: 18, col: C.deep },
  { id: 'wave', t: 'ring', at: 0, life: 0.6, att: 'ground', pos: [0, 0.1, 0], col: C.deep, r: 'r', op: 0.45 },
  { id: 'wave2', t: 'ring', at: 0.15, life: 0.5, att: 'ground', pos: [0, 0.1, 0], col: C.main, r: 'r*0.7', op: 0.3 },
  { id: 'rim', t: 'mesh', at: 0.25, life: 5.6, att: 'ground', shape: 'model', model: 'frost_rim', mat: 'ice', col: C.main, col2: C.deep,
    scale: ['r', 2.2, 'r'], grow: { '0': 0, '0.06': 1, '0.95': 1, '1': 0 }, stagger: 0.8, growBy: 'random' },
  ...[0.05, 1.4, 2.8, 4.2].map((t, i) => mistPuffs('mist' + i, { at: t, burst: i ? 10 : 16, fr: 'r*0.8', out: i ? 0.6 : 1.6 })),
  { id: 'snow', t: 'emit', at: 0.3, life: 5.4, rate: 14, att: 'ground', from: 'disc', fr: 'r*0.9', pos: [0, 0.3, 0], dir: 'tangent', speed: [0.6, 1.4], up: [0.3, 0.8],
    plife: [1.6, 2.6], look: 'flake', size: [1.8, 2.8], col: C.core, c2: C.main, gravity: -0.05, drag: 0.4, spin: 3, x: true },
  { id: 'light', t: 'light', at: 0, life: 0.45, att: 'ground', pos: [0, 2, 0], col: C.main, int: 1.2, dist: 22 },
  // หมดเวลา: ผิวน้ำแข็งแตกเป็นเศษ
  shardsOut('shatter', { at: 5.7, burst: 24, att: 'ground', from: 'disc', fr: 'r*0.9', pos: [0, 0.15, 0], dir: 'up', spread: 0.6, speed: [2, 4], up: [2, 4], msize: [0.1, 0.22] }),
  flakes('shatterfl', { at: 5.7, burst: 30, att: 'ground', from: 'disc', fr: 'r*0.9', pos: [0, 0.2, 0], dir: 'up', speed: [1, 2.5] }),
  snd('snd', 'nova', 0.6), snd('snd2', 'break', 0.5, 5.7)
]);

// ---------- 7) Cryo Shell (cryo / cryoend) — ตัวเปลือกยังเป็นโค้ด (frostFX) ----------
fx('cryo', 'Cryo Shell เริ่ม: น้ำแข็งงอกจากพื้นรอบเท้า + เกล็ดลอยขึ้นตามเปลือก + แสงเย็นกลางตัว', ['shield', 'self'], 1.4, {}, [
  { id: 'base', t: 'mesh', at: 0, life: 1.2, att: 'ground', shape: 'model', model: 'frost_spires', mat: 'ice', col: C.main, col2: C.deep,
    scale: { '0': [1.05, 0.7, 1.05], '1': [1.05, 0.7, 1.05] }, grow: { '0': 0, '0.25': 1, '0.75': 1, '1': 0 }, stagger: 0.6, growBy: 'random' },
  { id: 'rise', t: 'emit', at: 0, life: 0.35, rate: 60, att: 'ground', from: 'ring', fr: 1, pos: [0, 0.1, 0], dir: 'up', spread: 0.15, speed: [4, 6], plife: [0.3, 0.45], look: 'streak', size: [1.4, 2], col: C.core, c2: C.main, gravity: 0, drag: 1 },
  flakes('flakes', { at: 0.1, burst: 14, att: 'ground', pos: [0, 1.2, 0], from: 'ring', fr: 1, dir: 'tangent', speed: [1, 2] }),
  { id: 'cracks', t: 'decal', at: 0, life: 1.4, att: 'ground', kind: 'icecrack', r: 1.8, n: 9, col: C.deep },
  { id: 'light', t: 'light', at: 0.1, life: 0.8, att: 'ground', pos: [0, 1.2, 0], col: C.main, int: 1.2, dist: 8 },
  snd('snd', 'break', 0.6)
]);
fx('cryoend', 'Cryo Shell แตก: เปลือกแตกเป็นเศษผลึก + เกล็ด + หมอก (ไม่ผลักใคร)', ['shield', 'self', 'break'], 1.6, {}, [
  { id: 'core', t: 'flash', at: 0, life: 0.1, col: C.hi, size: 2.2 },
  shardsOut('shards', { burst: 18, fr: 0.7, speed: [4, 8], up: [1, 3], msize: [0.14, 0.32] }),
  { id: 'chips', t: 'debris', at: 0, life: 1.1, kind: 'ice', n: 8, speed: 5, r: 0.6, size: 0.8 },
  flakes('flakes', { burst: 20, fr: 0.7 }),
  glints('glint', { burst: 8, fr: 0.8 }),
  mistPuffs('mist', { burst: 8, fr: 0.8, speed: [1, 2] }),
  snd('snd', 'break', 0.8)
]);

// ---------- 8) Frostbite Aura (aura / auhit) — วงออร่าตามตัวยังเป็นโค้ด ----------
fx('aura', 'Frostbite Aura เปิด: หมอกเย็นระเบิดออกแล้วหมุนเป็นเกลียว + เกล็ด/ผลึกโคจรรอบตัว + คลื่นพื้น', ['aura', 'self'], 1.5, {}, [
  { id: 'spiral', t: 'emit', at: 0, life: 0.25, rate: 120, att: 'ground', from: 'ring', fr: 1.3, pos: [0, 0.5, 0], dir: 'tangent', speed: [6, 8], up: [0.5, 1.5], plife: [0.35, 0.55], look: 'streak', size: [1.4, 2], col: C.hi, c2: C.deep, gravity: -0.5, drag: 0.5 },
  mistPuffs('mist', { burst: 6, fr: 1.4, out: 1.2 }),
  { id: 'orbit', t: 'emit', at: 0, life: 0.05, burst: 24, att: 'ground', from: 'ring', fr: 1.4, pos: [0, 1, 0], dir: 'tangent', speed: [5, 7], up: [0, 1], plife: [0.5, 0.8], look: 'flake', size: [2, 3], col: C.core, c2: C.main, gravity: 0, drag: 1.5, spin: 6 },
  shardsOut('crys', { burst: 8, att: 'ground', from: 'ring', fr: 1.2, pos: [0, 1, 0], dir: 'tangent', speed: [4, 6], up: [1, 2], gravity: 6, msize: [0.08, 0.16] }),
  { id: 'pulse', t: 'ring', at: 0, life: 0.5, att: 'ground', pos: [0, 0.1, 0], col: C.deep, r: 9, op: 0.4 },
  { id: 'frost', t: 'decal', at: 0, life: 1.4, att: 'ground', kind: 'icecrack', r: 2.4, n: 10, col: C.deep },
  snd('snd', 'push', 0.4)
]);
fx('auhit', 'Frostbite Aura โดนศัตรู: เศษน้ำแข็งเล็ก ๆ หลุดจากตัว', ['aura', 'hit'], 0.8, {}, [
  shardsOut('chips', { burst: 3, fr: 0.3, speed: [2, 4], up: [1, 2], msize: [0.06, 0.12] }),
  flakes('flakes', { burst: 6, fr: 0.3, speed: [1, 2.5] }),
  { id: 'tick', t: 'flash', at: 0, life: 0.08, col: C.main, size: 1 }
]);

// ---------- 9) Glacier Rend (grcharge / gwave / glacier) ----------
fx('grcharge', 'Glacier Rend ชาร์จ: แสงเย็นดูดเข้าหาตัว/อาวุธ + เกล็ดวน (ชาร์จ 1 วิ)', ['charge'], 1.3, {}, [
  { id: 'pull', t: 'emit', at: 0, life: 0.95, rate: 45, from: 'sphere', fr: 1.8, pos: [0, 0.2, 0.3], dir: 'in', speed: [2.5, 4], plife: [0.3, 0.45], look: 'streak', size: [1.4, 2.2], col: C.core, c2: C.main, gravity: 0, drag: 0, curl: false },
  { id: 'swirl', t: 'emit', at: 0, life: 0.95, rate: 18, att: 'ground', from: 'ring', fr: 1.3, pos: [0, 0.2, 0], dir: 'tangent', speed: [2, 3], up: [0.6, 1.2], plife: [0.6, 0.9], look: 'flake', size: [1.8, 2.6], col: C.core, c2: C.main, gravity: -0.2, drag: 0.6, spin: 5, x: true },
  { id: 'halo', t: 'halo', at: 0.6, life: 0.45, pos: [0, 0.2, 0.3], col: C.main, size: 1.6, size0: 0.5, k: 0.6 },
  { id: 'frost', t: 'decal', at: 0, life: 1.3, att: 'ground', kind: 'icecrack', r: 1.4, n: 8, col: C.deep },
  snd('snd', 'buff', 0.6)
]);
fx('gwave', 'Glacier Rend ปล่อยคลื่นดาบ: ฟันแนวตั้ง + ขอบขาวคม + เศษผลึกพุ่งตามแนว + พื้นร้าว (ตัวคลื่นยังเป็นโค้ด)', ['melee', 'wave'], 1.7, {}, [
  { id: 'vslash', t: 'trail', at: 0, life: 0.1, sweep: true, a0: -100, a1: 40, r: 3.4, r0: 2.2, tilt: 90, att: 'ground', pos: [0, 0.4, -2.2], col: C.core, col2: C.deep, tlife: 0.2, k: 1.7, w: 0.3 },
  { id: 'core', t: 'flash', at: 0.03, life: 0.1, att: 'ground', pos: [0, 0.5, 1.6], col: C.hi, size: 1.8 },
  shardsOut('shards', { at: 0.03, burst: 14, att: 'ground', pos: [0, 0.5, 1.8], dir: 'aim', spread: 0.35, speed: [10, 18], up: [1, 3], gravity: 8 }),
  { id: 'streaks', t: 'emit', at: 0.03, life: 0.05, burst: 22, att: 'ground', pos: [0, 0.6, 1.8], dir: 'aim', spread: 0.4, speed: [12, 20], plife: [0.2, 0.35], look: 'streak', size: [1.8, 2.6], col: C.core, c2: C.main, gravity: 2, drag: 1.5 },
  { id: 'cracks', t: 'decal', at: 0.03, life: 1.6, att: 'ground', pos: [0, 0, 1.6], kind: 'icecrack', r: 2.2, n: 8, col: C.deep },
  mistPuffs('mist', { at: 0.05, burst: 6, pos: [0, 0.25, 2], fr: 0.8, speed: [1.5, 3] }),
  { id: 'light', t: 'light', at: 0.03, life: 0.3, att: 'ground', pos: [0, 1, 1.6], col: C.main, int: 1.5, dist: 12 },
  shake('cam', 3, 0.03), snd('snd', 'whoosh', 0.7), snd('snd2', 'slam', 0.4, 0.03)
]);
// โหมดไกล: สันน้ำแข็ง (GLV) งอกจากโค้ด — ไฟล์นี้ = จุดเริ่มระเบิด + รอยร้าว/หมอกเลื้อยไปตามแนว 35 ม.
fx('glacier', 'Glacier Rend โหมดไกล: น้ำแข็งระเบิดที่ต้นทาง + รอยร้าว/เศษผลึก/หมอกวิ่งไปตามแนวสัน (สันยังเป็นโค้ด)', ['ground', 'ridge'], 2.2, { len: { def: 35, desc: 'ยาวสัน (ม.) = ev.len/20' } }, [
  { id: 'spires', t: 'mesh', at: 0, life: 1, att: 'ground', shape: 'model', model: 'frost_spires', mat: 'ice', col: C.main, col2: C.deep,
    scale: { '0': 1.4, '1': 1.4 }, grow: { '0': 0, '0.12': 1, '0.7': 1, '1': 0 }, stagger: 0.5 },
  { id: 'cracks', t: 'decal', at: 0, life: 2, att: 'ground', kind: 'icecrack', r: 2.6, n: 10, col: C.deep },
  shardsOut('shards', { burst: 12, att: 'ground', pos: [0, 0.4, 0], fr: 0.6, speed: [5, 9], up: [2, 4] }),
  { id: 'run', t: 'emit', at: 0.05, life: 0.6, rate: 60, att: 'ground', from: 'line', fh: 'len', pos: [0, 0.2, 0], dir: 'up', spread: 0.5, speed: [2, 4], plife: [0.4, 0.7], look: 'flake', size: [2, 3], col: C.core, c2: C.main, gravity: 3, drag: 1.5, spin: 5 },
  ...[6, 14, 22, 30].map((z, i) => mistPuffs('runmist' + i, { at: 0.1 + i * 0.12, burst: 6, fr: 1.2, pos: [0, 0, z], out: 0.6, x: true })),
  mistPuffs('mist', { burst: 8, fr: 1.4, speed: [1.5, 3] }),
  { id: 'light', t: 'light', at: 0, life: 0.35, att: 'ground', pos: [0, 1.5, 0], col: C.main, int: 1.5, dist: 14 },
  shakeNear('cam', 5, 0, true), snd('snd', 'break', 0.8)
]);

// ---------- 10) Mirror Legion (mirror / mirrorend) — อาวุธลอยเป็นโค้ด (js/34 frostFX) + รอยฟันตอนพุ่ง (ULTV) ----------
fx('mirror', 'Mirror Legion: แผ่นกระจกน้ำแข็งพุ่งเข้าประกอบเป็นดาบ/ขวานน้ำแข็งลอย 2 เล่มข้างตัว + วงกระแทก + แสงเย็น', ['ult', 'summon'], 1.7, {}, [
  { id: 'core', t: 'flash', at: 0, life: 0.14, att: 'ground', pos: [0, 1.1, 0], col: C.main, size: 2.6 },
  ...[-1, 1].flatMap(k => [
    { id: 'gather' + k, t: 'emit', at: 0, life: 0.3, rate: 80, att: 'ground', from: 'sphere', fr: 1.6, pos: [2.75 * k, 1.1, 0], dir: 'in', speed: [4, 6], plife: [0.25, 0.35],
      look: 'model', model: 'frost_shard', mmat: 'ice', msize: [0.1, 0.2], bounce: 0, mspin: 720, gravity: 0, drag: 0, col: C.hi, c2: C.deep },
    { id: 'form' + k, t: 'emit', at: 0.25, life: 0.05, burst: 10, att: 'ground', from: 'box', fr: 0.4, fh: 2, pos: [2.75 * k, 1, 0], dir: 'out', speed: [0.5, 1.5], plife: [0.4, 0.7], look: 'glow', fb: 'tex/star_flare', size: [5, 8], col: C.core, c2: C.main, gravity: 0, drag: 2, x: true },
    { id: 'pad' + k, t: 'decal', at: 0.25, life: 1.4, att: 'ground', pos: [2.75 * k, 0, 0], kind: 'icecrack', r: 1.4, n: 8, col: C.deep }
  ]),
  { id: 'ring', t: 'ring', at: 0.02, life: 0.5, att: 'ground', pos: [0, 0.12, 0], col: C.deep, r: 6, op: 0.45 },
  { id: 'spires', t: 'mesh', at: 0, life: 1, att: 'ground', shape: 'model', model: 'frost_spires', mat: 'ice', col: C.main, col2: C.deep, scale: { '0': 1.3, '1': 1.3 }, grow: { '0': 0, '0.12': 1, '0.7': 1, '1': 0 }, stagger: 0.5 },
  flakes('flakes', { burst: 24, att: 'ground', pos: [0, 1, 0], fr: 1 }),
  { id: 'light', t: 'light', at: 0, life: 0.5, att: 'ground', pos: [0, 2, 0], col: C.main, int: 1.5, dist: 14 },
  shakeNear('cam', 4, 0, true), snd('snd', 'nova', 0.7)
]);
fx('mirrorend', 'Mirror Legion หมด: รอยร้าววิ่งออก แล้วร่างกระจกแตกเป็นเกล็ดสะท้อนแสงจางหาย', ['ult', 'break'], 1.6, {}, [
  { id: 'cracks', t: 'decal', at: 0, life: 1.5, att: 'ground', kind: 'icecrack', r: 2.4, n: 12, col: C.deep },
  shardsOut('shards', { at: 0.15, burst: 18, fr: 0.9, speed: [2, 5], up: [1, 3], msize: [0.1, 0.24] }),
  glints('glint', { at: 0.15, burst: 12, fr: 1, plife: [0.4, 0.8], speed: [0.5, 2] }),
  flakes('flakes', { at: 0.15, burst: 24, fr: 1, speed: [1, 3], plife: [0.9, 1.4] }),
  snd('snd', 'break', 0.6, 0.12)
]);

// ---------- 11) Frostforge เปิด (forge) — ขวาน/ก้อนน้ำแข็ง/ออร่ายังเป็นโค้ด ----------
fx('forge', 'Frostforge เปิด: ออร่าเย็นบาง ๆ — ผลึกเล็กงอกรอบเท้า + เกล็ดวนขึ้น + ประกาย', ['buff', 'self'], 1.3, {}, [
  { id: 'rim', t: 'mesh', at: 0, life: 0.9, att: 'ground', shape: 'model', model: 'frost_rim', mat: 'ice', col: C.main, col2: C.deep,
    scale: { '0': [1.1, 2.5, 1.1], '1': [1.1, 2.5, 1.1] }, grow: { '0': 0, '0.2': 1, '0.7': 1, '1': 0 }, stagger: 0.6, growBy: 'random' },
  { id: 'up', t: 'emit', at: 0, life: 0.4, rate: 50, att: 'ground', from: 'ring', fr: 0.9, pos: [0, 0.1, 0], dir: 'tangent', speed: [1.5, 2.5], up: [2.5, 4], plife: [0.5, 0.8], look: 'flake', size: [1.8, 2.6], col: C.core, c2: C.main, gravity: 0, drag: 0.6, spin: 6 },
  glints('glint', { at: 0.1, burst: 6, att: 'ground', pos: [0, 1.2, 0], fr: 0.7 }),
  { id: 'ring', t: 'ring', at: 0, life: 0.4, att: 'ground', pos: [0, 0.1, 0], col: C.main, r: 2.2, op: 0.45 },
  snd('snd', 'parry', 0.5)
]);

// ---------- 12) แท่งน้ำแข็งโหมดไกลโดน (imp:icicle) — เพิ่มจากภาพเดิม ----------
fx('icicle_hit', 'แท่งน้ำแข็ง (ยิงไกล) โดน: เศษผลึกแหลมแตกกระจาย + รอยเย็นบนเป้าชั่วครู่', ['impact', 'small'], 0.9, {}, [
  shardsOut('shards', { burst: 5, fr: 0.15, speed: [3, 6], up: [0.5, 2], msize: [0.06, 0.14], gravity: 9 }),
  { id: 'mark', t: 'halo', at: 0, life: 0.45, col: C.main, size: 1.1, size0: 0.4, k: 0.7 },
  glints('glint', { burst: 3, fr: 0.2, size: [4, 6] })
]);

// ---------- เขียนไฟล์ ----------
for (const n in FX) fs.writeFileSync(path.join(DIR, n + '.fx.json'), JSON.stringify(FX[n], null, 1) + '\n');
// bind.json: เก็บของเดิม (ถ้ามี) แล้วเขียนของ Frost ทับ
const BP = path.join(__dirname, '..', 'assets', 'fx', 'bind.json');
const bind = JSON.parse(fs.readFileSync(BP, 'utf8') || '{}');
const R = 'replace', rr = { r: 'ev.r/20' };
Object.assign(bind, {
  'efx:swing': [
    { fx: 'frost/swing_sword_a', mode: R, p: rr, if: 'ev.ax==0&&ev.c==0' },
    { fx: 'frost/swing_sword_b', mode: R, p: rr, if: 'ev.ax==0&&ev.c==1' },
    { fx: 'frost/swing_axe_a', mode: R, p: rr, if: 'ev.ax==1&&ev.c==0' },
    { fx: 'frost/swing_axe_b', mode: R, p: rr, if: 'ev.ax==1&&ev.c==1' },
    { fx: 'frost/swing_windup', mode: R, if: 'ev.c==2' },
    { fx: 'frost/swing_echo', mode: R, p: rr, if: 'ev.m==1&&ev.c<2' }],
  'efx:slam3': [{ fx: 'frost/slam3', mode: R, p: rr, s: '1+ev.ax*0.2' }, { fx: 'frost/slam3_echo', mode: R, p: rr, if: 'ev.m*1' }],
  'efx:slamgo': { fx: 'frost/slamgo', mode: R },
  'efx:slam': { fx: 'frost/slam', mode: R, p: rr, s: '1+ev.ax*0.25' },
  'efx:slide': { fx: 'frost/slide', mode: R },
  'efx:iceboom': { fx: 'frost/iceboom', mode: R, p: rr },
  'efx:perma': { fx: 'frost/perma', mode: R, p: rr },
  'efx:cryo': { fx: 'frost/cryo', mode: R },
  'efx:cryoend': { fx: 'frost/cryoend', mode: R },
  'efx:aura': { fx: 'frost/aura', mode: R },
  'efx:auhit': { fx: 'frost/auhit', mode: R },
  'efx:grcharge': { fx: 'frost/grcharge', mode: R },
  'efx:gwave': { fx: 'frost/gwave', mode: R },
  'efx:glacier': { fx: 'frost/glacier', mode: R, p: { len: 'ev.len/20' } },
  'efx:mirror': { fx: 'frost/mirror', mode: R },
  'efx:mirrorend': { fx: 'frost/mirrorend', mode: R },
  'efx:forge': { fx: 'frost/forge', mode: R },
  'imp:icicle': { fx: 'frost/icicle_hit', mode: 'add' }
});
fs.writeFileSync(BP, JSON.stringify(bind, null, 2) + '\n');
console.log('frost fx:', Object.keys(FX).length, 'files');
