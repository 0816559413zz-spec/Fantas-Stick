// สร้างโมเดลสำหรับแมพ "หุบเขาหมอก" (gorge) ด้วยโค้ด → assets/mapkit/gorge.glb + ลงทะเบียนใน assets/mapkit/kit.json (user)
// ใช้: node tools/gorge-assets.mjs   (แมพ: node tools/gorge-map.mjs) • รายละเอียด: notes/gorge-map.md
// ทุกชิ้นใช้วัสดุเดียว (สีที่จุดยอด, โทนจาง) → รวม draw call ได้ • 1 ไฟล์ = หลาย node (ชื่อ g_*) • หน่วยเมตร ฐานอยู่ y=0 กึ่งกลาง x/z
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------- ตัวช่วยสุ่ม/noise ----------
export function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const h3 = (x, y, z, s) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1274126177) ^ Math.imul(s | 0, 1442695041); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function n3(x, y, z, s = 0) { const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z), u = x - i, v = y - j, w = z - k, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v), c = w * w * (3 - 2 * w), L = (p, q, r) => h3(i + p, j + q, k + r, s);
  const l = (p, q, t) => L(p, q, 0) * (1 - t) + L(p, q, 1) * t, m = (p, t) => l(p, 0, t) * (1 - b) + l(p, 1, t) * b; return m(0, c) * (1 - a) + m(1, c) * a; }
const fb3 = (x, y, z, s) => 0.6 * n3(x, y, z, s) + 0.3 * n3(x * 2.1, y * 2.1, z * 2.1, s + 5) + 0.1 * n3(x * 4.3, y * 4.3, z * 4.3, s + 9);
const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lin = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
export const col = hex => { const n = parseInt(hex.slice(1), 16); return [lin((n >> 16 & 255) / 255), lin((n >> 8 & 255) / 255), lin((n & 255) / 255)]; };
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

// ---------- mesh ----------
class Mesh {
  constructor() { this.p = []; this.c = []; this.i = []; }
  v(x, y, z, c) { this.p.push(x, y, z); this.c.push(c[0], c[1], c[2]); return this.p.length / 3 - 1; }
  tri(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  // กล่อง (กึ่งกลาง cx,cy,cz ครึ่งขนาด hx,hy,hz หมุนรอบ y) สีเดียว + (ถ้ามี) สีข้างบน
  box(cx, cy, cz, hx, hy, hz, c, ry = 0, ctop) {
    const co = Math.cos(ry), si = Math.sin(ry), P = (x, y, z) => [cx + x * co + z * si, cy + y, cz - x * si + z * co];
    const f = (pts, k, cc) => { const ids = pts.map(q => this.v(q[0], q[1], q[2], mul(cc || c, k))); this.quad(ids[0], ids[1], ids[2], ids[3]); };
    const s = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(q => P(q[0] * hx, q[1] * hy, q[2] * hz));
    f([s[0], s[3], s[2], s[1]], 0.8); f([s[4], s[5], s[6], s[7]], 0.9); f([s[0], s[4], s[7], s[3]], 0.7); f([s[1], s[2], s[6], s[5]], 0.85); f([s[3], s[7], s[6], s[2]], 1.0, ctop); f([s[0], s[1], s[5], s[4]], 0.5);
  }
  // 'tapered' ท่อ n เหลี่ยม จาก (x0,y0,z0) รัศมี r0 ไป (x1,y1,z1) รัศมี r1
  tube(a, b, r0, r1, n, c0, c1, cap) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1, d = [dx / L, dy / L, dz / L];
    let u = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]; const cx = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]], cl = Math.hypot(...cx); const e1 = cx.map(q => q / cl), e2 = [d[1] * e1[2] - d[2] * e1[1], d[2] * e1[0] - d[0] * e1[2], d[0] * e1[1] - d[1] * e1[0]];
    const r = [], s = []; for (let k = 0; k < n; k++) { const t = k / n * Math.PI * 2, cc = Math.cos(t), ss = Math.sin(t);
      r.push(this.v(a[0] + (e1[0] * cc + e2[0] * ss) * r0, a[1] + (e1[1] * cc + e2[1] * ss) * r0, a[2] + (e1[2] * cc + e2[2] * ss) * r0, c0));
      s.push(this.v(b[0] + (e1[0] * cc + e2[0] * ss) * r1, b[1] + (e1[1] * cc + e2[1] * ss) * r1, b[2] + (e1[2] * cc + e2[2] * ss) * r1, c1)); }
    for (let k = 0; k < n; k++) { const k2 = (k + 1) % n; this.quad(r[k], r[k2], s[k2], s[k]); }
    if (cap) { const t = this.v(b[0], b[1], b[2], cap), q = []; for (let k = 0; k < n; k++) q.push(this.v(s.length ? this.p[s[k] * 3] : 0, this.p[s[k] * 3 + 1], this.p[s[k] * 3 + 2], cap)); for (let k = 0; k < n; k++) this.tri(q[k], q[(k + 1) % n], t); }
  }
  normals() {
    const nrm = new Float32Array(this.p.length), P = this.p;
    for (let t = 0; t < this.i.length; t += 3) { const a = this.i[t] * 3, b = this.i[t + 1] * 3, c = this.i[t + 2] * 3,
      ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2],
      nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; for (const q of [a, b, c]) { nrm[q] += nx; nrm[q + 1] += ny; nrm[q + 2] += nz; } }
    for (let k = 0; k < nrm.length; k += 3) { const L = Math.hypot(nrm[k], nrm[k + 1], nrm[k + 2]) || 1; nrm[k] /= L; nrm[k + 1] /= L; nrm[k + 2] /= L; }
    return nrm;
  }
  unshare() { const p = [], c = []; for (const k of this.i) { p.push(this.p[k * 3], this.p[k * 3 + 1], this.p[k * 3 + 2]); c.push(0, 0, 0); } this.p = p; this.c = c; this.i = Array.from({ length: p.length / 3 }, (_, k) => k); return this; }
  bbox() { const b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let k = 0; k < this.p.length; k += 3) for (let a = 0; a < 3; a++) { b[a] = Math.min(b[a], this.p[k + a]); b[a + 3] = Math.max(b[a + 3], this.p[k + a]); } return b; }
  lift() { const b = this.bbox(), cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2; for (let k = 0; k < this.p.length; k += 3) { this.p[k] -= cx; this.p[k + 1] -= b[1]; this.p[k + 2] -= cz; } return this; }
  append(m) { const o = this.p.length / 3; this.p.push(...m.p); this.c.push(...m.c); for (const k of m.i) this.i.push(k + o); }
}

// ---------- icosphere ----------
function icosphere(sub) {
  const t = (1 + Math.sqrt(5)) / 2, V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(v => { const L = Math.hypot(...v); return v.map(q => q / L); });
  let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  for (let s = 0; s < sub; s++) { const cache = new Map(), mid = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (cache.has(k)) return cache.get(k); const m = V[a].map((q, i) => (q + V[b][i]) / 2), L = Math.hypot(...m); V.push(m.map(q => q / L)); cache.set(k, V.length - 1); return V.length - 1; };
    const G = []; for (const [a, b, c] of F) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); G.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); } F = G; }
  return { V, F };
}

// ---------- หิน ----------
// o: {sx,sy,sz ครึ่งขนาด, seed, sub, ang (จำนวนระนาบตัด 0 = กลมมน), moss 0..1, tone 0..1 (0 เทาเข้ม 1 เทาอ่อน), warm (ย้อมน้ำตาล), flat (เงาแบบเหลี่ยม)}
function rock(o) {
  const { V, F } = icosphere(o.sub == null ? 2 : o.sub), R = rng(o.seed), m = new Mesh();
  const planes = []; for (let k = 0; k < (o.ang || 0); k++) { const a = R() * 6.283, e = (R() - 0.35) * 1.2, nn = [Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)]; planes.push([nn, 0.55 + R() * 0.3]); }
  const P = V.map(d => { let r = 1 + 0.30 * (fb3(d[0] * 1.6 + o.seed, d[1] * 1.6, d[2] * 1.6, o.seed) - 0.5) * 2 + 0.07 * (n3(d[0] * 6, d[1] * 6, d[2] * 6, o.seed + 3) - 0.5);
    let p = d.map(q => q * r); for (const [nn, dist] of planes) { const dd = p[0] * nn[0] + p[1] * nn[1] + p[2] * nn[2]; if (dd > dist) p = p.map((q, i) => q - nn[i] * (dd - dist)); }
    p = [p[0] * o.sx, p[1] * o.sy, p[2] * o.sz]; if (p[1] < -0.55 * o.sy) p[1] = -0.55 * o.sy; return p; });
  for (const p of P) m.v(p[0], p[1], p[2], [0, 0, 0]);
  for (const f of F) m.tri(f[0], f[1], f[2]);
  m.lift();
  if (o.flat !== 0) m.unshare();   // เงาแบบเหลี่ยม (ผิวหินแตกเป็นหน้า)
  const N = m.normals(), b = m.bbox(), H = Math.max(0.01, b[4] - b[1]), rockA = mix(col('#454a47'), col('#848a84'), o.tone == null ? 0.5 : o.tone), warm = col('#5d5a4e');
  for (let k = 0; k < m.p.length; k += 3) {
    const x = m.p[k], y = m.p[k + 1], z = m.p[k + 2], ny = N[k + 1], nz = fb3(x * 1.3, y * 1.3, z * 1.3, o.seed + 11), fine = n3(x * 7, y * 7, z * 7, o.seed + 21);
    let c = mix(rockA, warm, (o.warm || 0.15) * nz); c = mul(c, 0.78 + 0.4 * fine + 0.18 * nz);
    const ms = clamp((ny - 0.2 + 0.35 * (nz - 0.5) * 2) * 3.4, 0, 1) * (o.moss == null ? 0.7 : o.moss), mossC = mix(col('#55703a'), col('#7d9048'), fine);
    c = mix(c, mossC, ms); c = mul(c, 0.55 + 0.45 * clamp(y / H * 2.2 + 0.25, 0, 1));   // โคนเข้ม (ดิน/ความชื้น)
    m.c[k] = c[0]; m.c[k + 1] = c[1]; m.c[k + 2] = c[2];
  }
  return m;
}

// ---------- ต้นสน ----------
// o: {H สูง, base รัศมีโคน, bare สัดส่วนลำต้นเปลือย, R รัศมีทรงพุ่มสูงสุด, tiers, seed, dead 0..1 (กิ่งแห้ง), lean}
function conifer(o) {
  const R = rng(o.seed), m = new Mesh(), H = o.H, lean = o.lean || 0.04, bark = col('#4b3f33'), bark2 = col('#6a5a47');
  const lx = y => Math.sin(o.seed) * lean * y, lz = y => Math.cos(o.seed * 1.7) * lean * y;
  // ลำต้น (3 ท่อ ลู่เข้า)
  const segs = o.lo ? 2 : 4; for (let s = 0; s < segs; s++) { const y0 = H * s / segs, y1 = H * (s + 1) / segs * 1.0, r0 = o.base * Math.pow(1 - s / segs, 0.8) + 0.04, r1 = o.base * Math.pow(1 - (s + 1) / segs, 0.8) + 0.04; m.tube([lx(y0), y0, lz(y0)], [lx(y1), y1, lz(y1)], r0, r1, o.lo ? 5 : 6, mix(bark, bark2, R() * 0.5), mix(bark, bark2, R() * 0.5)); }
  const y0 = H * (o.bare == null ? 0.3 : o.bare), n = o.tiers || 11, Rm = o.R || 2.6;
  for (let t = 0; t < n; t++) {
    const u = t / (n - 1), y = lerp(y0, H * 0.97, u), rad = Rm * Math.pow(1 - u, 0.85) * (0.78 + 0.3 * R()) + 0.25, th = 0.9 + rad * 0.55, sides = o.lo ? 5 : 7;
    const dark = mix(col('#2f4030'), col('#4c5f40'), u * 0.8 + R() * 0.2), under = mul(dark, 0.55), tip = mix(dark, col('#7a8c5c'), 0.35);
    const ap = m.v(lx(y + th) + 0, y + th, lz(y + th), tip), ring = [];
    const off = R() * 6.283;
    for (let k = 0; k < sides; k++) { const a = off + k / sides * 6.283, rr = rad * (0.8 + 0.4 * R()), yy = y - rad * 0.28 - R() * 0.25; ring.push(m.v(lx(y) + Math.cos(a) * rr, yy, lz(y) + Math.sin(a) * rr, mix(under, dark, 0.25 + R() * 0.3))); }
    const mid = []; for (let k = 0; k < sides; k++) { const a = off + (k + 0.5) / sides * 6.283, rr = rad * 0.52, yy = y + th * 0.18; mid.push(m.v(lx(y) + Math.cos(a) * rr, yy, lz(y) + Math.sin(a) * rr, dark)); }
    for (let k = 0; k < sides; k++) { const k2 = (k + 1) % sides; m.tri(ap, mid[k], mid[(k + sides - 1) % sides]); m.tri(ring[k], ring[k2], mid[k]); m.tri(mid[k], ring[k], mid[(k + sides - 1) % sides]); }
    // ใต้พุ่ม (ปิดฝา)
    if (!o.lo) { const cn = m.v(lx(y), y - 0.1, lz(y), under); for (let k = 0; k < sides; k++) m.tri(ring[(k + 1) % sides], ring[k], cn); }
  }
  // กิ่งแห้งใต้พุ่ม
  const nd = o.lo ? 0 : Math.round((o.dead == null ? 0.5 : o.dead) * 9); for (let k = 0; k < nd; k++) { const y = lerp(H * 0.1, y0 + 1, R()), a = R() * 6.283, L = 0.7 + R() * 1.1, e = lerp(-0.1, 0.35, R());
    m.tube([lx(y), y, lz(y)], [lx(y) + Math.cos(a) * L, y + e * L, lz(y) + Math.sin(a) * L], 0.05, 0.03, 4, bark, mul(bark2, 0.9)); }
  return m;
}
// ต้นตาย/ลำเปลือย (ลำบางสูง กิ่งตอ)
function snag(o) {
  const R = rng(o.seed), m = new Mesh(), H = o.H, c0 = col('#52483c'), c1 = col('#7a6e5f'), segs = 5, bend = o.bend || 0.8;
  const P = y => [Math.sin(o.seed) * bend * Math.pow(y / H, 2), y, Math.cos(o.seed * 1.3) * bend * 0.6 * Math.pow(y / H, 2)];
  for (let s = 0; s < segs; s++) { const y0 = H * s / segs, y1 = H * (s + 1) / segs; m.tube(P(y0), P(y1), o.r * (1 - s / segs * 0.8), o.r * (1 - (s + 1) / segs * 0.8), 6, mix(c0, c1, R() * 0.6), mix(c0, c1, R() * 0.6)); }
  const nb = o.branches == null ? 6 : o.branches; for (let k = 0; k < nb; k++) { const y = lerp(H * 0.35, H * 0.9, R()), a = R() * 6.283, L = 0.5 + R() * 1.6 * (1 - y / H + 0.3), p = P(y);
    m.tube(p, [p[0] + Math.cos(a) * L, p[1] + L * (0.15 + R() * 0.4), p[2] + Math.sin(a) * L], o.r * 0.28, 0.035, 4, c0, c1); }
  return m;
}
// ต้นไม้ใบเหลืองส้มจาง (กลางภาพอ้างอิง)
function autumn(o) {
  const R = rng(o.seed), m = new Mesh(), H = o.H, bark = col('#4f4538'), bark2 = col('#76695a'), th = H * 0.42;
  m.tube([0, 0, 0], [0.1, th, 0.05], o.r, o.r * 0.55, 7, bark, bark2);
  const tops = [], nb = 5 + Math.round(R() * 2);
  for (let k = 0; k < nb; k++) { const a = k / nb * 6.283 + R() * 0.7, L = H * (0.28 + R() * 0.2), e = H * (0.28 + R() * 0.22), b0 = [0.1, th * (0.7 + R() * 0.3), 0.05], b1 = [b0[0] + Math.cos(a) * L, th + e, b0[2] + Math.sin(a) * L];
    m.tube(b0, b1, o.r * 0.34, o.r * 0.1, 5, bark, bark2); tops.push(b1);
    const b2 = [b1[0] + Math.cos(a + 0.6) * L * 0.4, b1[1] + e * 0.35, b1[2] + Math.sin(a + 0.6) * L * 0.4]; m.tube(b1, b2, o.r * 0.1, 0.035, 4, bark, bark2); tops.push(b2); }
  const leaf = [col('#8c7545'), col('#74673c'), col('#9a8450'), col('#6b6a40'), col('#80693a')];
  for (const t of tops) for (let q = 0; q < 1; q++) { const { V, F } = icosphere(1), cx = t[0] + (R() - 0.5) * 1.3, cy = t[1] + (R() - 0.3) * 0.9, cz = t[2] + (R() - 0.5) * 1.3, rr = (1.4 + R() * 1.2) * (H / 9), base = leaf[Math.floor(R() * leaf.length)], o0 = m.p.length / 3;
    for (const d of V) { const k = 0.62 + 0.8 * n3(d[0] * 2 + cx, d[1] * 2 + cy, d[2] * 2 + cz, o.seed); m.v(cx + d[0] * rr * k, cy + d[1] * rr * 0.85 * k, cz + d[2] * rr * k, mul(mix(base, col('#5a5232'), (1 - d[1]) * 0.35), 0.82 + 0.3 * n3(d[0] * 5, d[1] * 5, d[2] * 5, 4))); }
    for (const f of F) m.tri(o0 + f[0], o0 + f[2], o0 + f[1]); }
  return m;
}
// ล้มทับ: ท่อนไม้ล้ม
function log(o) {
  const R = rng(o.seed), m = new Mesh(), L = o.L, r = o.r, bark = col('#4a3f33'), bark2 = col('#675a48'), cut = col('#9a8666'), moss = col('#58683e'), n = 8, segs = Math.max(3, Math.round(L / 1.1));
  const rings = []; for (let s = 0; s <= segs; s++) { const t = s / segs, x = (t - 0.5) * L, rr = r * (1 - 0.15 * t) * (0.92 + 0.16 * R()), ring = [];
    for (let k = 0; k < n; k++) { const a = k / n * 6.283, topness = Math.sin(a) > 0 ? 1 : 0, c = mix(mix(bark, bark2, R() * 0.6), moss, topness * clamp(n3(x * 0.8, a, 0, o.seed) * 1.6 - 0.35, 0, 0.9) * (o.moss == null ? 0.8 : o.moss));
      ring.push(m.v(x, r + Math.sin(a) * rr, Math.cos(a) * rr, mul(c, 0.8 + 0.3 * R()))); } rings.push(ring); }
  for (let s = 0; s < segs; s++) for (let k = 0; k < n; k++) m.quad(rings[s][k], rings[s][(k + 1) % n], rings[s + 1][(k + 1) % n], rings[s + 1][k]);
  const c0 = m.v(-L / 2, r, 0, cut), c1 = m.v(L / 2, r, 0, mul(cut, 0.9)); for (let k = 0; k < n; k++) { m.tri(c0, rings[0][(k + 1) % n], rings[0][k]); m.tri(c1, rings[segs][k], rings[segs][(k + 1) % n]); }
  if (o.stubs) for (let k = 0; k < o.stubs; k++) { const x = (R() - 0.5) * L * 0.8, a = R() * 3.2 + 0.2; m.tube([x, r + Math.sin(a) * r * 0.9, Math.cos(a) * r * 0.9], [x + 0.2, r + Math.sin(a) * (r + 0.55), Math.cos(a) * (r + 0.55)], 0.07, 0.03, 4, bark, bark2); }
  return m;
}
function stump(o) { const R = rng(o.seed), m = new Mesh(), r = o.r, h = o.h, n = 9, bark = col('#4a3f33'), cut = col('#8f7c5c'), top = [], bot = [];
  for (let k = 0; k < n; k++) { const a = k / n * 6.283, rr = r * (0.85 + 0.3 * R()); bot.push(m.v(Math.cos(a) * rr * 1.25, 0, Math.sin(a) * rr * 1.25, mul(bark, 0.7))); top.push(m.v(Math.cos(a) * rr, h * (0.85 + 0.3 * R()), Math.sin(a) * rr, mix(bark, col('#675a48'), R()))); }
  for (let k = 0; k < n; k++) m.quad(bot[k], bot[(k + 1) % n], top[(k + 1) % n], top[k]);
  const c = m.v(0, h * 1.02, 0, cut); for (let k = 0; k < n; k++) m.tri(c, top[(k + 1) % n], top[k]);
  return m; }
// พุ่มเตี้ย (กิ่งเปลือย + ใบแห้ง) และเฟิร์น
function shrub(o) {
  const R = rng(o.seed), m = new Mesh(), c0 = col('#54463a'), c1 = col('#7d6c55'), lf = [col('#7a6a40'), col('#6a603a'), col('#5a5a38')];
  for (let k = 0; k < (o.n || 9); k++) { const a = R() * 6.283, L = o.h * (0.6 + R() * 0.6), tilt = 0.35 + R() * 0.7, tip = [Math.cos(a) * L * tilt, L * (1 - tilt * 0.4), Math.sin(a) * L * tilt], mid = [tip[0] * 0.5, tip[1] * 0.55, tip[2] * 0.5];
    m.tube([0, 0, 0], mid, 0.035, 0.03, 3, c0, c1); m.tube(mid, tip, 0.03, 0.02, 3, c0, c1);
    if (o.leaves) { const rr = 0.2 + R() * 0.22, cc = lf[Math.floor(R() * 3)]; const a0 = m.v(tip[0], tip[1] + rr * 0.6, tip[2], mul(cc, 1.1)), b = [0, 1, 2, 3, 4].map(q => { const t = q / 5 * 6.283; return m.v(tip[0] + Math.cos(t) * rr, tip[1] - rr * 0.1, tip[2] + Math.sin(t) * rr, mul(cc, 0.7)); }); for (let q = 0; q < 5; q++) m.tri(a0, b[q], b[(q + 1) % 5]); } }
  return m;
}
function fern(o) {
  const R = rng(o.seed), m = new Mesh(), n = o.n || 7, c0 = col('#4b5738'), c1 = col('#7b8a58'), c2 = col('#8a8456');
  for (let k = 0; k < n; k++) { const a = k / n * 6.283 + R() * 0.5, L = o.h * (0.75 + R() * 0.5), w = L * 0.17, ca = Math.cos(a), sa = Math.sin(a), px = -sa, pz = ca, dry = R() < 0.25;
    const pts = [0, 0.33, 0.66, 1].map(t => [ca * L * 0.85 * t, o.h * 0.55 * Math.sin(t * 2.2) * (1 - t * 0.35) + 0.04, sa * L * 0.85 * t]);
    const lc = dry ? c2 : c1, ids = pts.map((p, q) => { const t = q / 3, ww = w * Math.sin(Math.PI * (t * 0.85 + 0.12)); return [m.v(p[0] + px * ww, p[1], p[2] + pz * ww, mix(c0, lc, t)), m.v(p[0] - px * ww, p[1], p[2] - pz * ww, mix(c0, lc, t))]; });
    for (let q = 0; q < 3; q++) { m.quad(ids[q][0], ids[q + 1][0], ids[q + 1][1], ids[q][1]); } }
  return m;
}

// ---------- สะพานมีหลังคา ----------
// ยาว L (แกน x) กว้างด้านใน Wd (แกน z) • พื้นสะพานกับผนังล่าง (ที่ชน) มาจาก floors/walls ของแมพ — ชิ้นนี้คือโครง เสา ผนังบน หลังคา คานใต้พื้น ท่าบน
function bridge(o) {
  const m = new Mesh(), L = o.L, Wd = o.W, hw = Wd / 2, wood = col('#443e36'), wood2 = col('#544d42'), dark = col('#332f2a'), roof = col('#3a3a38'), roof2 = col('#494845'), light = col('#c8cdc6'), stone = col('#66696a');
  const topY = o.deckY, yl = o.wallH, yo = 3.0, y1 = yo + 0.95, yr = 3.9;   // ผนังล่างสูง yl (ที่ชน) • ช่องหน้าต่าง yl..yo • ผนังบน yo..y1
  const posts = Math.round(L / 3.4);
  // คานใต้พื้น + คานทแยง (โครงถัก) ให้เห็นจากใต้สะพาน (y=0 = ผิวพื้นสะพาน)
  for (const z of [-hw + 0.5, 0, hw - 0.5]) m.box(0, -0.62, z, L / 2, 0.38, 0.22, dark);
  const bays = posts * 2, dx = (L - 2) / bays;
  for (let k = 0; k < bays; k++) { const x0 = -L / 2 + 1.0 + k * dx, up = k % 2 === 0; for (const z of [-hw + 0.4, hw - 0.4]) m.tube([x0, up ? -0.45 : -2.1, z], [x0 + dx, up ? -2.1 : -0.45, z], 0.1, 0.1, 4, dark, dark); }
  // ตอม่อหินสองฝั่ง (ฝังในตลิ่ง)
  for (const s of [-1, 1]) m.box(s * (L / 2 - 1.6), -1.6, 0, 1.7, 1.6, hw + 0.4, stone, 0, mul(stone, 1.15));
  // เสาตามแนวผนัง (จากพื้นถึงชายคา)
  for (const z of [-hw, hw]) for (let k = 0; k <= posts; k++) { const x = -L / 2 + 0.3 + k * ((L - 0.6) / posts); m.box(x, (y1 + 0.1) / 2, z, 0.17, (y1 + 0.1) / 2, 0.17, wood); }
  // คานราวบน + ผนังบน (แผ่นไม้) ตามแนวยาว
  for (const z of [-hw, hw]) { m.box(0, yo - 0.08, z, L / 2, 0.1, 0.2, wood2); m.box(0, (yo + y1) / 2, z + (z > 0 ? -0.02 : 0.02), L / 2, (y1 - yo) / 2, 0.09, wood); m.box(0, y1 + 0.08, z, L / 2, 0.1, 0.22, wood2); }
  // หลังคาจั่ว (เปลือกด้านบน + ชายคายื่น)
  const ov = 0.9, ridge = yr + 1.55, rl = L / 2 + 0.9, rc = [mix(roof, roof2, 0.3), roof2];
  for (const s of [-1, 1]) { const a = [-rl, y1 + 0.1, s * (hw + ov)], b = [rl, y1 + 0.1, s * (hw + ov)], c = [rl, ridge, 0], d = [-rl, ridge, 0], seg = 10;
    for (let k = 0; k < seg; k++) { const t0 = k / seg, t1 = (k + 1) / seg, X0 = lerp(-rl, rl, t0), X1 = lerp(-rl, rl, t1), jit = 0.9 + 0.12 * ((k * 7) % 3), e = (x, y, z, cc) => m.v(x, y, z, mul(cc, jit));
      const v0 = e(X0, a[1], a[2], rc[0]), v1 = e(X1, a[1], a[2], rc[0]), v2 = e(X1, ridge, 0, rc[1]), v3 = e(X0, ridge, 0, rc[1]); if (s > 0) m.quad(v0, v1, v2, v3); else m.quad(v1, v0, v3, v2); } }
  // ชายหลังคาด้านล่างเป็นแผ่นหนา + จั่วหน้า-หลัง
  for (const s of [-1, 1]) m.box(0, y1 + 0.02, s * (hw + ov), rl, 0.07, 0.06, dark);
  for (const e of [-1, 1]) { const x = e * (L / 2 + 0.02), A = m.v(x, y1 + 0.1, -hw - ov * 0.6, dark), B = m.v(x, y1 + 0.1, hw + ov * 0.6, dark), T = m.v(x, ridge, 0, wood2); if (e > 0) m.tri(A, B, T); else m.tri(B, A, T);
    // โครงปากทางเข้า (กรอบ)
    m.box(x, (yl + yo) / 2, -hw, 0.2, (yo - yl) / 2 + 0.3, 0.2, wood2); m.box(x, (yl + yo) / 2, hw, 0.2, (yo - yl) / 2 + 0.3, 0.2, wood2); m.box(x, yo + 0.1, 0, 0.2, 0.2, hw + 0.2, wood2); }
  // (ช่องหน้าต่างเปิดโล่ง เห็นป่าทะลุ — ไม่มีแผ่นกระจก)
  return m;
}

// ---------- รายการโมเดล ----------
// [id, ชื่อ, หมวด, สร้าง, มีที่ชน, ไม่ทอดเงา, รัศมีลำต้น(ใช้คิด cs)]
const A = [];
const add = (id, name, cat, mesh, o = {}) => A.push({ id, name, cat, mesh, col: o.col == null ? 1 : o.col, ns: o.ns || 0, trunk: o.trunk || 0 });
add('pine_a', 'สนสูง A', 'tree', conifer({ H: 20, base: 0.5, R: 2.2, tiers: 9, seed: 11, bare: 0.46, dead: 0.6 }), { trunk: 0.55 });
add('pine_b', 'สนสูง B', 'tree', conifer({ H: 26, base: 0.62, R: 2.6, tiers: 11, seed: 23, bare: 0.52, dead: 0.8, lean: 0.06 }), { trunk: 0.64 });
add('pine_c', 'สนอวบ', 'tree', conifer({ H: 15, base: 0.44, R: 2.5, tiers: 8, seed: 37, bare: 0.34, dead: 0.4 }), { trunk: 0.46 });
add('pine_d', 'สนยักษ์', 'tree', conifer({ H: 31, base: 0.74, R: 3.0, tiers: 12, seed: 51, bare: 0.55, dead: 0.9, lean: 0.05 }), { trunk: 0.76 });
add('pine_s', 'สนเล็ก', 'tree', conifer({ H: 5.5, base: 0.12, R: 1.5, tiers: 6, seed: 63, bare: 0.08, dead: 0 }), { trunk: 0.14 });
add('pine_la', 'สนไกล A (เบา)', 'tree', conifer({ H: 24, base: 0.4, R: 2.1, tiers: 6, seed: 71, bare: 0.5, lo: 1 }), { trunk: 0.44 });
add('pine_lb', 'สนไกล B (เบา)', 'tree', conifer({ H: 19, base: 0.34, R: 2.0, tiers: 5, seed: 83, bare: 0.4, lo: 1 }), { trunk: 0.38 });
add('snag_a', 'ลำเปลือยสูง', 'tree', snag({ H: 13, r: 0.2, seed: 5, branches: 5 }), { trunk: 0.22 });
add('snag_b', 'ไม้ตายผอม', 'tree', snag({ H: 9, r: 0.26, seed: 9, branches: 9, bend: 1.2 }), { trunk: 0.28 });
add('autumn_a', 'ต้นใบเหลืองจาง A', 'tree', autumn({ H: 9.5, r: 0.38, seed: 3 }), { trunk: 0.42 });
add('autumn_b', 'ต้นใบเหลืองจาง B', 'tree', autumn({ H: 7.5, r: 0.3, seed: 8 }), { trunk: 0.34 });
add('boulder_a', 'ก้อนหินมอส ใหญ่', 'rock', rock({ sx: 2.4, sy: 1.7, sz: 2.0, seed: 101, sub: 2, ang: 3, moss: 0.75, tone: 0.45 }));
add('boulder_b', 'ก้อนหินมอส กลาง', 'rock', rock({ sx: 1.5, sy: 1.0, sz: 1.3, seed: 113, sub: 2, ang: 2, moss: 0.65, tone: 0.55 }));
add('boulder_c', 'ก้อนหินกลม', 'rock', rock({ sx: 1.2, sy: 0.9, sz: 1.1, seed: 127, sub: 1, ang: 2, moss: 0.5, tone: 0.4, warm: 0.4 }));
add('boulder_d', 'ก้อนหินเหลี่ยม', 'rock', rock({ sx: 1.0, sy: 0.8, sz: 1.0, seed: 139, sub: 1, ang: 5, moss: 0.35, tone: 0.65 }));
add('cliff_a', 'ผาหินแผ่น', 'rock', rock({ sx: 5.0, sy: 3.4, sz: 3.2, seed: 151, sub: 2, ang: 5, moss: 0.7, tone: 0.5 }));
add('cliff_b', 'ผาหินสูง', 'rock', rock({ sx: 2.6, sy: 4.6, sz: 2.4, seed: 163, sub: 2, ang: 6, moss: 0.55, tone: 0.5 }));
add('stone_a', 'หินเล็ก A', 'rock', rock({ sx: 0.34, sy: 0.22, sz: 0.3, seed: 171, sub: 0, ang: 2, moss: 0.3, tone: 0.55 }), { col: 0, ns: 1 });
add('stone_b', 'หินเล็ก B', 'rock', rock({ sx: 0.22, sy: 0.16, sz: 0.2, seed: 181, sub: 0, ang: 0, moss: 0.2, tone: 0.6, warm: 0.5 }), { col: 0, ns: 1 });
add('stone_c', 'หินเล็ก C', 'rock', rock({ sx: 0.5, sy: 0.3, sz: 0.42, seed: 191, sub: 0, ang: 3, moss: 0.4, tone: 0.5 }), { col: 0, ns: 1 });
add('log_a', 'ขอนไม้ล้มยาว', 'prop', log({ L: 6.0, r: 0.42, seed: 7, stubs: 3 }), { col: 1 });
add('log_b', 'ขอนไม้ล้มสั้น', 'prop', log({ L: 3.6, r: 0.3, seed: 15, stubs: 2 }), { col: 0 });
add('log_c', 'ท่อนไม้ผุ', 'prop', log({ L: 2.4, r: 0.24, seed: 29, moss: 1, stubs: 1 }), { col: 0, ns: 1 });
add('stump_a', 'ตอไม้', 'prop', stump({ r: 0.5, h: 0.7, seed: 4 }), { col: 1 });
add('shrub_a', 'พุ่มกิ่งเปลือย', 'plant', shrub({ h: 1.4, n: 11, seed: 6, leaves: 0 }), { col: 0, ns: 1 });
add('shrub_b', 'พุ่มกิ่งเปลือยเตี้ย', 'plant', shrub({ h: 0.9, n: 8, seed: 19, leaves: 0 }), { col: 0, ns: 1 });
add('fern_a', 'เฟิร์น', 'plant', fern({ h: 0.8, n: 7, seed: 2 }), { col: 0, ns: 1 });
add('fern_b', 'เฟิร์นใหญ่', 'plant', fern({ h: 1.2, n: 9, seed: 12 }), { col: 0, ns: 1 });
export const BRIDGE = { L: 28, W: 5.6, deckY: 0, wallH: 1.3 };
add('bridge_cov', 'สะพานมีหลังคา', 'build', bridge(BRIDGE), { col: 0 });

// ---------- GLB ----------
function glb(list) {
  const bufs = [], views = [], accs = [], meshes = [], nodes = [];
  const pushBuf = (arr, target) => { let b = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); const pad = (4 - b.length % 4) % 4; if (pad) b = Buffer.concat([b, Buffer.alloc(pad)]); const off = bufs.reduce((s, q) => s + q.length, 0); bufs.push(b); views.push({ buffer: 0, byteOffset: off, byteLength: arr.byteLength, target }); return views.length - 1; };
  for (const a of list) {
    const m = a.mesh, N = m.normals(), P = new Float32Array(m.p), C = new Uint8Array(m.c.length / 3 * 4), I = new Uint32Array(m.i); const bb = m.bbox();
    for (let k = 0; k < m.c.length / 3; k++) { const tr = v => Math.round(255 * Math.pow(clamp(v, 0, 1), 1 / 2.2) * 0 + 255 * clamp(v, 0, 1)); C[k * 4] = tr(m.c[k * 3]); C[k * 4 + 1] = tr(m.c[k * 3 + 1]); C[k * 4 + 2] = tr(m.c[k * 3 + 2]); C[k * 4 + 3] = 255; }
    const vp = pushBuf(P, 34962), vn = pushBuf(N, 34962), vc = pushBuf(C, 34962), vi = pushBuf(I, 34963);
    accs.push({ bufferView: vp, componentType: 5126, count: P.length / 3, type: 'VEC3', min: bb.slice(0, 3), max: bb.slice(3) }); const ap = accs.length - 1;
    accs.push({ bufferView: vn, componentType: 5126, count: N.length / 3, type: 'VEC3' }); const an = accs.length - 1;
    accs.push({ bufferView: vc, componentType: 5121, normalized: true, count: C.length / 4, type: 'VEC4' }); const ac = accs.length - 1;
    accs.push({ bufferView: vi, componentType: 5125, count: I.length, type: 'SCALAR' }); const ai = accs.length - 1;
    meshes.push({ name: 'g_' + a.id, primitives: [{ attributes: { POSITION: ap, NORMAL: an, COLOR_0: ac }, indices: ai, material: 0, mode: 4 }] });
    nodes.push({ name: 'g_' + a.id, mesh: meshes.length - 1 });
  }
  const bin = Buffer.concat(bufs);
  const json = { asset: { version: '2.0', generator: 'tools/gorge-assets.mjs' }, scene: 0, scenes: [{ nodes: nodes.map((_, i) => i) }], nodes, meshes, materials: [{ name: 'gorge_vc', doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.94 } }], accessors: accs, bufferViews: views, buffers: [{ byteLength: bin.length }] };
  let js = Buffer.from(JSON.stringify(json)); js = Buffer.concat([js, Buffer.alloc((4 - js.length % 4) % 4, 0x20)]);
  const head = Buffer.alloc(12), c1 = Buffer.alloc(8), c2 = Buffer.alloc(8); head.write('glTF', 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  c1.writeUInt32LE(js.length, 0); c1.write('JSON', 4); c2.writeUInt32LE(bin.length, 0); c2.write('BIN\0', 4);
  return Buffer.concat([head, c1, js, c2, bin]);
}

// ---------- สรุปขนาด (ให้ gorge-map.mjs ใช้คิดที่ชน/ระยะ) ----------
export function info() { const o = {}; for (const a of A) { const b0 = a.mesh.bbox(); a.mesh.lift(); const b = a.mesh.bbox(); o[a.id] = { y0: b0[1], ex: (b[3] - b[0]) / 2, ez: (b[5] - b[2]) / 2, h: b[4] - b[1], tris: a.mesh.i.length / 3, trunk: a.trunk, col: a.col, cat: a.cat }; } return o; }

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const inf = info(), buf = glb(A), V = Date.now();
  // เก็บเป็นไฟล์ที่ bridge ตั้ง lift ตัวเองไม่ได้ (สะพานวางตามค่า deckY จริงใน gorge-map) → ไม่ lift สะพาน
  fs.mkdirSync(path.join(ROOT, 'assets', 'mapkit'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'assets', 'mapkit', 'gorge.glb'), buf);
  const kp = path.join(ROOT, 'assets', 'mapkit', 'kit.json'), k = JSON.parse(fs.readFileSync(kp, 'utf8'));
  k.user = (k.user || []).filter(u => !String(u.id).startsWith('gorge/'));
  for (const a of A) k.user.push({ id: 'gorge/' + a.id, name: a.name + ' · หุบเขาหมอก', cat: a.cat, src: 'mapkit/gorge.glb', node: 'g_' + a.id, col: a.col, brk: 0, ns: a.ns, v: V });
  fs.writeFileSync(kp, '{\n "_about": ' + JSON.stringify(k._about) + ',\n "v": ' + (k.v || 1) + ',\n "assets": [\n  ' + k.assets.map(a => JSON.stringify(a)).join(',\n  ') + '\n ],\n "user": [\n  ' + k.user.map(a => JSON.stringify(a)).join(',\n  ') + '\n ]\n}\n');
  fs.writeFileSync(path.join(ROOT, 'assets', 'mapkit', 'gorge.info.json'), JSON.stringify(inf));
  const tot = Object.values(inf).reduce((s, q) => s + q.tris, 0);
  console.log('OK assets/mapkit/gorge.glb', (buf.length / 1024).toFixed(0) + ' KB', Object.keys(inf).length, 'ชิ้น', tot, 'tris'); console.log(Object.entries(inf).map(([k, q]) => `${k}:${q.tris}t ${q.ex.toFixed(1)}x${q.h.toFixed(1)}`).join('  '));
}
