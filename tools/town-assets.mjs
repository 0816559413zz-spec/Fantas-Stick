// Town decoration kit for Map Builder: houses, cobble roads, lamp posts, market/town clutter
// Run: node tools/town-assets.mjs  → assets/mapkit/town.glb + kit.json "user" rows (id town/*) + assets/mapkit/town.info.json
// Low poly, flat-shaded, vertex colours (one material 'town_vc' + 'glow_town' for lamp glass) → the game merges them per material.
// Units = metres, base at y=0, centred on x/z, house fronts (door) face +z. Watercolour-friendly muted palette (art-style-watercolor).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------- helpers ----------
function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
let R = rng(1);
const lin = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const col = hex => { const n = parseInt(hex.slice(1), 16); return [lin((n >> 16 & 255) / 255), lin((n >> 8 & 255) / 255), lin((n & 255) / 255)]; };
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const jit = (c, a = 0.08) => mul(c, 1 - a + 2 * a * R());
const P = {
  stone: col('#cdbf9f'), stoneD: col('#a69675'), stoneG: col('#b5b0a2'), plaster: col('#e8dfca'), ochre: col('#dcc79c'), rose: col('#e0c4b0'), sage: col('#c9cfb4'),
  timber: col('#5b4532'), glass: col('#3a4452'), frame: col('#efe7d4'), door: col('#6b4a30'), doorB: col('#4f5d6e'), doorG: col('#55684a'),
  roofR: col('#9c4f3b'), roofS: col('#56677f'), chim: col('#9a8c76'), iron: col('#33363b'), wood: col('#8a6a48'), woodD: col('#6a5038'), woodL: col('#a88560'),
  hay: col('#d1b86c'), cob: col('#aaa190'), mortar: col('#746c60'), curb: col('#c2b7a1'), flag: col('#b9b09c'), water: col('#4f8590'),
  red: col('#a84a3a'), blue: col('#4d6a8c'), cream: col('#ece1c6'), green: col('#5f7a52'), leaf: col('#6f8a4e'), leafD: col('#56703f'), flower: col('#c8646c'), flowerY: col('#e0c25a'), sack: col('#cdbb94'), soil: col('#6d5a44'), shut: col('#5e7a6a'), shutR: col('#8d4a3e'), shutB: col('#4e6a86'),
};
const GLOWC = col('#ffcf86');

class Mesh {
  constructor() { this.p = []; this.n = []; this.c = []; this.g = { p: [], n: [], c: [] }; }
  _t(a, b, c, k, hint, glow) {
    const T = glow ? this.g : this;
    let ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const L = Math.hypot(nx, ny, nz); if (L < 1e-9) return; nx /= L; ny /= L; nz /= L;
    if (hint && nx * hint[0] + ny * hint[1] + nz * hint[2] < 0) { [b, c] = [c, b]; nx = -nx; ny = -ny; nz = -nz; }
    for (const q of [a, b, c]) { T.p.push(q[0], q[1], q[2]); T.n.push(nx, ny, nz); T.c.push(k[0], k[1], k[2]); }
  }
  tri(a, b, c, k, hint, glow) { this._t(a, b, c, k, hint, glow); }
  quad(a, b, c, d, k, hint, glow) { this._t(a, b, c, k, hint, glow); this._t(a, c, d, k, hint, glow); }
  // axis-aligned box from min/max; k colour, top = top colour, sides skip list ('b' bottom by default)
  box(x0, y0, z0, x1, y1, z1, k, o = {}) {
    const top = o.top || k, glow = o.glow, sk = o.skip || (y0 < 0.02 ? 'b' : '');
    const v = (x, y, z) => [x, y, z];
    if (!sk.includes('t')) this.quad(v(x0, y1, z0), v(x1, y1, z0), v(x1, y1, z1), v(x0, y1, z1), jit(top, 0.03), [0, 1, 0], glow);
    if (!sk.includes('b')) this.quad(v(x0, y0, z0), v(x1, y0, z0), v(x1, y0, z1), v(x0, y0, z1), k, [0, -1, 0], glow);
    if (!sk.includes('f')) this.quad(v(x0, y0, z1), v(x1, y0, z1), v(x1, y1, z1), v(x0, y1, z1), jit(k, 0.03), [0, 0, 1], glow);
    if (!sk.includes('k')) this.quad(v(x0, y0, z0), v(x1, y0, z0), v(x1, y1, z0), v(x0, y1, z0), jit(k, 0.03), [0, 0, -1], glow);
    if (!sk.includes('r')) this.quad(v(x1, y0, z0), v(x1, y0, z1), v(x1, y1, z1), v(x1, y1, z0), jit(k, 0.03), [1, 0, 0], glow);
    if (!sk.includes('l')) this.quad(v(x0, y0, z0), v(x0, y0, z1), v(x0, y1, z1), v(x0, y1, z0), jit(k, 0.03), [-1, 0, 0], glow);
  }
  bx(cx, y0, cz, w, h, d, k, o) { this.box(cx - w / 2, y0, cz - d / 2, cx + w / 2, y0 + h, cz + d / 2, k, o); }
  // n-gon cylinder / frustum, base y0, top y1, radii r0/r1
  cyl(cx, y0, cz, r0, y1, r1, n, k, o = {}) {
    const top = o.top || k, a0 = o.a0 || 0;
    const ring = (y, r) => Array.from({ length: n }, (_, i) => { const t = a0 + i / n * Math.PI * 2; return [cx + Math.cos(t) * r, y, cz + Math.sin(t) * r]; });
    const A = ring(y0, r0), B = ring(y1, r1);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n, mx = (A[i][0] + A[j][0]) / 2 - cx, mz = (A[i][2] + A[j][2]) / 2 - cz; this.quad(A[i], A[j], B[j], B[i], jit(k, 0.04), [mx, 0, mz], o.glow); }
    if (!o.open && r1 > 0.001) for (let i = 1; i < n - 1; i++) this.tri(B[0], B[i], B[i + 1], top, [0, 1, 0], o.glow);
    if (o.bottom) for (let i = 1; i < n - 1; i++) this.tri(A[0], A[i], A[i + 1], k, [0, -1, 0], o.glow);
  }
  cone(cx, y0, cz, r, h, n, k, a0 = 0) { const T = [cx, y0 + h, cz]; for (let i = 0; i < n; i++) { const t0 = a0 + i / n * Math.PI * 2, t1 = a0 + (i + 1) / n * Math.PI * 2; this.tri([cx + Math.cos(t0) * r, y0, cz + Math.sin(t0) * r], [cx + Math.cos(t1) * r, y0, cz + Math.sin(t1) * r], T, jit(k, 0.05), [Math.cos((t0 + t1) / 2), 0.5, Math.sin((t0 + t1) / 2)]); } }
  // tilted plank / beam between two points (square section s)
  beam(a, b, s, k) { const m = new Mesh(), L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); m.box(-s / 2, 0, -s / 2, s / 2, L, s / 2, k, { skip: '' });
    const d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L, (b[2] - a[2]) / L], ax = [d[2], 0, -d[0]], al = Math.hypot(ax[0], ax[2]);
    if (al > 1e-6) m.rotAxis([ax[0] / al, 0, ax[2] / al], Math.acos(Math.max(-1, Math.min(1, d[1])))); else if (d[1] < 0) m.rotAxis([1, 0, 0], Math.PI);
    m.move(a[0], a[1], a[2]); this.add(m); }
  rotAxis(u, ang) { const c = Math.cos(ang), s = Math.sin(ang), t = 1 - c, [x, y, z] = u;
    const M = [t * x * x + c, t * x * y - s * z, t * x * z + s * y, t * x * y + s * z, t * y * y + c, t * y * z - s * x, t * x * z - s * y, t * y * z + s * x, t * z * z + c];
    for (const T of [this, this.g]) for (const arr of [T.p, T.n]) for (let i = 0; i < arr.length; i += 3) { const a = arr[i], b = arr[i + 1], d = arr[i + 2]; arr[i] = M[0] * a + M[1] * b + M[2] * d; arr[i + 1] = M[3] * a + M[4] * b + M[5] * d; arr[i + 2] = M[6] * a + M[7] * b + M[8] * d; }
    return this; }
  rotY(a) { return this.rotAxis([0, 1, 0], a); }
  scale(k, ky = k) { for (const T of [this, this.g]) for (let i = 0; i < T.p.length; i++) T.p[i] *= i % 3 === 1 ? ky : k;   // uniform: normals unchanged • ky = 1: flat pieces keep their thickness
    if (ky !== k) for (const T of [this, this.g]) for (let i = 0; i < T.n.length; i += 3) { const x = T.n[i] / k, y = T.n[i + 1] / ky, z = T.n[i + 2] / k, l = Math.hypot(x, y, z) || 1; T.n[i] = x / l; T.n[i + 1] = y / l; T.n[i + 2] = z / l; }
    return this; }
  move(x, y, z) { for (const T of [this, this.g]) for (let i = 0; i < T.p.length; i += 3) { T.p[i] += x; T.p[i + 1] += y; T.p[i + 2] += z; } return this; }
  add(m) { for (const k of ['p', 'n', 'c']) { this[k].push(...m[k]); this.g[k].push(...m.g[k]); } return this; }
  bbox() { const b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (const T of [this, this.g]) for (let k = 0; k < T.p.length; k += 3) for (let a = 0; a < 3; a++) { b[a] = Math.min(b[a], T.p[k + a]); b[a + 3] = Math.max(b[a + 3], T.p[k + a]); } return b; }
  lift() { const b = this.bbox(); return this.move(-(b[0] + b[3]) / 2, -b[1], -(b[2] + b[5]) / 2); }
  tris() { return (this.p.length + this.g.p.length) / 9; }
}

// ---------- house parts ----------
// window on a wall plane. side: 'f' (+z) 'k' (-z) 'r' (+x) 'l' (-x); wall at coordinate w0; u = along-wall centre, y = sill height
function windowOn(m, side, w0, u, y, ww, wh, o = {}) {
  const off = 0.04, n = { f: [0, 0, 1], k: [0, 0, -1], r: [1, 0, 0], l: [-1, 0, 0] }[side], sg = side === 'f' || side === 'r' ? 1 : -1;
  const pt = (uu, yy, d) => side === 'f' || side === 'k' ? [uu, yy, w0 + sg * d] : [w0 + sg * d, yy, uu];
  const q = (u0, u1, y0, y1, d, k) => m.quad(pt(u0, y0, d), pt(u1, y0, d), pt(u1, y1, d), pt(u0, y1, d), k, n);
  q(u - ww / 2 - 0.1, u + ww / 2 + 0.1, y - 0.1, y + wh + 0.1, off, o.frame || P.frame);
  q(u - ww / 2, u + ww / 2, y, y + wh, off + 0.02, o.glass || P.glass);
  if (ww > 0.7 && !o.noBar) q(u - 0.03, u + 0.03, y, y + wh, off + 0.03, o.frame || P.frame);
  if (o.shut) { q(u - ww / 2 - 0.1 - ww / 2, u - ww / 2 - 0.12, y, y + wh, off + 0.01, o.shut); q(u + ww / 2 + 0.12, u + ww / 2 + 0.1 + ww / 2, y, y + wh, off + 0.01, o.shut); }
  if (o.box) { const b = new Mesh(); b.bx(0, 0, 0, ww + 0.2, 0.22, 0.28, P.woodD); b.bx(0, 0.22, 0, ww + 0.1, 0.12, 0.2, P.leaf); for (let i = 0; i < 4; i++) b.bx(-ww / 2 + 0.1 + i * ww / 3.3, 0.3, (R() - 0.5) * 0.1, 0.1, 0.08, 0.1, i % 2 ? P.flower : P.flowerY);
    const r = { f: 0, k: Math.PI, r: Math.PI / 2, l: -Math.PI / 2 }[side]; b.rotY(r); const p = pt(u, y - 0.3, 0.16); b.move(p[0], p[1], p[2]); m.add(b); }
}
function doorOn(m, side, w0, u, wd, h, k) { windowOn(m, side, w0, u, 0.02, wd, h, { glass: k || P.door, frame: P.stoneD, noBar: 1 }); }
// timber framing strips on a wall plane between y0..y1
function timberOn(m, side, w0, u0, u1, y0, y1, step = 1.2) {
  const n = { f: [0, 0, 1], k: [0, 0, -1], r: [1, 0, 0], l: [-1, 0, 0] }[side], sg = side === 'f' || side === 'r' ? 1 : -1, d = 0.025;
  const pt = (uu, yy) => side === 'f' || side === 'k' ? [uu, yy, w0 + sg * d] : [w0 + sg * d, yy, uu];
  const strip = (a0, a1, b0, b1) => m.quad(pt(a0, b0), pt(a1, b0), pt(a1, b1), pt(a0, b1), P.timber, n);
  strip(u0, u1, y0, y0 + 0.16); strip(u0, u1, y1 - 0.16, y1);
  const cnt = Math.max(2, Math.round((u1 - u0) / step)); for (let i = 0; i <= cnt; i++) { const u = u0 + (u1 - u0) * i / cnt; strip(Math.max(u0, u - 0.08), Math.min(u1, u + 0.08), y0, y1); }
  for (let i = 0; i < cnt; i += 2) { const a = u0 + (u1 - u0) * i / cnt, b = u0 + (u1 - u0) * (i + 1) / cnt, w = 0.07;   // diagonal brace
    m.quad(pt(a, y0 + 0.16), pt(a + w * 2, y0 + 0.16), pt(b, y1 - 0.16), pt(b - w * 2, y1 - 0.16), P.timber, n); }
}
// gable roof over rect x0..x1 / z0..z1 at eave height e, ridge rise h, overhang o, ridge along 'x' or 'z'; gable triangles coloured wc
function gable(m, x0, z0, x1, z1, e, h, o, rc, wc, along = 'x') {
  const t = 0.16;
  if (along === 'x') {
    const zc = (z0 + z1) / 2, X0 = x0 - o, X1 = x1 + o, Z0 = z0 - o, Z1 = z1 + o, drop = o * h / ((z1 - z0) / 2), ey = e - drop, top = e + h;
    for (const [za, sg] of [[Z1, 1], [Z0, -1]]) {
      const k = jit(rc, 0.04), hint = [0, 1, sg * 0.5];
      m.quad([X0, ey, za], [X1, ey, za], [X1, top, zc], [X0, top, zc], k, hint);
      m.quad([X0, ey - t, za], [X1, ey - t, za], [X1, ey, za], [X0, ey, za], mul(rc, 0.7), [0, 0, sg]);
      m.quad([X0, ey - t, za], [X1, ey - t, za], [X1, top - t, zc], [X0, top - t, zc], mul(rc, 0.55), [0, -1, 0]);
      for (const [xx, sx] of [[X0, -1], [X1, 1]]) m.quad([xx, ey - t, za], [xx, ey, za], [xx, top, zc], [xx, top - t, zc], mul(rc, 0.7), [sx, 0, 0]);
    }
    for (const [xx, sx] of [[x0, -1], [x1, 1]]) m.tri([xx, e, z0], [xx, e, z1], [xx, e + h - 0.05, zc], jit(wc, 0.03), [sx, 0, 0]);
  } else {
    const xc = (x0 + x1) / 2, X0 = x0 - o, X1 = x1 + o, Z0 = z0 - o, Z1 = z1 + o, drop = o * h / ((x1 - x0) / 2), ey = e - drop, top = e + h;
    for (const [xa, sg] of [[X1, 1], [X0, -1]]) {
      const k = jit(rc, 0.04), hint = [sg * 0.5, 1, 0];
      m.quad([xa, ey, Z0], [xa, ey, Z1], [xc, top, Z1], [xc, top, Z0], k, hint);
      m.quad([xa, ey - t, Z0], [xa, ey - t, Z1], [xa, ey, Z1], [xa, ey, Z0], mul(rc, 0.7), [sg, 0, 0]);
      m.quad([xa, ey - t, Z0], [xa, ey - t, Z1], [xc, top - t, Z1], [xc, top - t, Z0], mul(rc, 0.55), [0, -1, 0]);
      for (const [zz, sz] of [[Z0, -1], [Z1, 1]]) m.quad([xa, ey - t, zz], [xa, ey, zz], [xc, top, zz], [xc, top - t, zz], mul(rc, 0.7), [0, 0, sz]);
    }
    for (const [zz, sz] of [[z0, -1], [z1, 1]]) m.tri([x0, e, zz], [x1, e, zz], [xc, e + h - 0.05, zz], jit(wc, 0.03), [0, 0, sz]);
  }
}
// hip roof (ridge along the longer side)
function hip(m, x0, z0, x1, z1, e, h, o, rc) {
  const X0 = x0 - o, X1 = x1 + o, Z0 = z0 - o, Z1 = z1 + o, xc = (X0 + X1) / 2, zc = (Z0 + Z1) / 2, W = (X1 - X0) / 2, D = (Z1 - Z0) / 2, ey = e - o * 0.6, top = e + h;
  const rx = Math.max(0, W - D), rz = Math.max(0, D - W), A = [xc - rx, top, zc - rz], B = [xc + rx, top, zc + rz];
  const c00 = [X0, ey, Z0], c10 = [X1, ey, Z0], c11 = [X1, ey, Z1], c01 = [X0, ey, Z1];
  if (rx >= rz) { m.quad(c01, c11, B, A, jit(rc, 0.04), [0, 1, 1]); m.quad(c00, c10, B, A, jit(rc, 0.04), [0, 1, -1]); m.tri(c00, c01, A, jit(rc, 0.04), [-1, 1, 0]); m.tri(c10, c11, B, jit(rc, 0.04), [1, 1, 0]); }
  else { m.quad(c10, c11, B, A, jit(rc, 0.04), [1, 1, 0]); m.quad(c00, c01, B, A, jit(rc, 0.04), [-1, 1, 0]); m.tri(c00, c10, A, jit(rc, 0.04), [0, 1, -1]); m.tri(c01, c11, B, jit(rc, 0.04), [0, 1, 1]); }
  m.box(X0, ey - 0.16, Z0, X1, ey, Z1, mul(rc, 0.7), { skip: 't' });
}
function chimney(m, x, z, y0, y1, w = 0.7) { m.bx(x, y0, z, w, y1 - y0, w, P.chim, { skip: 'b' }); m.bx(x, y1, z, w + 0.16, 0.18, w + 0.16, P.stoneD); m.bx(x, y1 + 0.18, z, 0.22, 0.25, 0.22, P.roofR); }
// windows on all 4 sides of a rect body for floor f (y = floor base)
function windowsAround(m, x0, z0, x1, z1, y, o = {}) {
  const sides = o.sides || 'fklr', ww = o.ww || 0.8, wh = o.wh || 1.2, sp = o.sp || 2.1, sill = o.sill == null ? 0.9 : o.sill;
  for (const s of sides) {
    const along = s === 'f' || s === 'k', a0 = along ? x0 : z0, a1 = along ? x1 : z1, w0 = { f: z1, k: z0, r: x1, l: x0 }[s];
    const n = Math.max(1, Math.floor((a1 - a0 - 0.6) / sp)); for (let i = 0; i < n; i++) { const u = a0 + (a1 - a0) * (i + 0.5) / n; if (o.skipU && s === 'f' && Math.abs(u - o.skipU) < 0.9) continue; windowOn(m, s, w0, u, y + sill, ww, wh, { shut: o.shut, box: o.box && s === 'f' && R() < 0.7 }); }
  }
}

// ---------- houses (front = +z) ----------
// rc roof colour; wall colours vary per house type
function cottage(rc) { R = rng(11); const m = new Mesh(), w = 5, d = 4.6, e = 2.9;
  m.box(-w / 2, 0, -d / 2, w / 2, e, d / 2, P.stone); m.box(-w / 2 - 0.1, 0, -d / 2 - 0.1, w / 2 + 0.1, 0.4, d / 2 + 0.1, P.stoneD);
  doorOn(m, 'f', d / 2, -0.6, 1.0, 2.0, P.doorG); windowOn(m, 'f', d / 2, 1.3, 1.0, 0.9, 1.0, { shut: P.shut, box: 1 });
  windowOn(m, 'k', -d / 2, 0, 1.0, 0.9, 1.0, { shut: P.shut }); windowOn(m, 'r', w / 2, 0, 1.0, 0.8, 1.0); windowOn(m, 'l', -w / 2, 0, 1.0, 0.8, 1.0);
  gable(m, -w / 2, -d / 2, w / 2, d / 2, e, 2.4, 0.45, rc, P.stone, 'x'); chimney(m, 1.6, -0.9, 3.4, 5.6);
  m.bx(-0.6, 2.3, d / 2 + 0.35, 1.5, 0.08, 0.7, rc);  // small porch canopy
  return m; }
function timberHouse(rc) { R = rng(23); const m = new Mesh(), w = 5.6, d = 6.6, f1 = 3, jet = 0.35, f2 = 2.8;
  m.box(-w / 2, 0, -d / 2, w / 2, f1, d / 2, P.stone); doorOn(m, 'f', d / 2, 1.2, 1.0, 2.1, P.door); windowOn(m, 'f', d / 2, -1.0, 1.0, 1.2, 1.1, { shut: P.shutR });
  windowsAround(m, -w / 2, -d / 2, w / 2, d / 2, 0, { sides: 'klr', sp: 2.4 });
  const X0 = -w / 2 - jet, X1 = w / 2 + jet, Z0 = -d / 2 - jet, Z1 = d / 2 + jet;
  m.box(X0, f1, Z0, X1, f1 + f2, Z1, P.plaster, { skip: 'b' }); m.box(X0 - 0.05, f1 - 0.2, Z0 - 0.05, X1 + 0.05, f1, Z1 + 0.05, P.timber);
  for (const s of 'fk') timberOn(m, s, s === 'f' ? Z1 : Z0, X0, X1, f1, f1 + f2, 1.0);
  for (const s of 'rl') timberOn(m, s, s === 'r' ? X1 : X0, Z0, Z1, f1, f1 + f2, 1.1);
  windowsAround(m, X0, Z0, X1, Z1, f1, { sp: 1.9, ww: 0.7, wh: 1.0, sill: 0.9, box: 1 });
  gable(m, X0, Z0, X1, Z1, f1 + f2, 3.2, 0.4, rc, P.plaster, 'z'); timberOn(m, 'f', Z1, X0 + 1.5, X1 - 1.5, f1 + f2, f1 + f2 + 1.0, 1.0);
  windowOn(m, 'f', Z1, 0, f1 + f2 + 0.5, 0.6, 0.8); chimney(m, -1.4, -1.8, 6.5, 9.1);
  return m; }
function tallHouse(rc) { R = rng(37); const m = new Mesh(), w = 4.4, d = 6, fh = 2.9, n = 3, e = fh * n;
  m.box(-w / 2, 0, -d / 2, w / 2, e, d / 2, P.ochre); m.box(-w / 2 - 0.05, 0, -d / 2 - 0.05, w / 2 + 0.05, fh, d / 2 + 0.05, P.stone);
  for (let f = 1; f < n; f++) m.box(-w / 2 - 0.08, f * fh - 0.12, -d / 2 - 0.08, w / 2 + 0.08, f * fh + 0.04, d / 2 + 0.08, P.frame);
  doorOn(m, 'f', d / 2 + 0.05, -1.0, 1.0, 2.2, P.doorB); windowOn(m, 'f', d / 2 + 0.05, 0.9, 1.0, 1.2, 1.2);
  for (let f = 1; f < n; f++) { windowOn(m, 'f', d / 2, -1.0, f * fh + 0.8, 0.8, 1.4, { shut: P.shutB, box: f === 1 }); windowOn(m, 'f', d / 2, 1.0, f * fh + 0.8, 0.8, 1.4, { shut: P.shutB }); }
  for (let f = 0; f < n; f++) windowsAround(m, -w / 2, -d / 2, w / 2, d / 2, f * fh, { sides: 'klr', sp: 2.5, ww: 0.7, wh: 1.2 });
  gable(m, -w / 2, -d / 2, w / 2, d / 2, e, 3.6, 0.35, rc, P.ochre, 'z'); windowOn(m, 'f', d / 2, 0, e + 0.7, 0.6, 0.9);
  chimney(m, 1.4, -2.2, e + 1.0, e + 3.4, 0.6);
  return m; }
function bigHouse(rc) { R = rng(41); const m = new Mesh(), w = 8, d = 9.4, fh = 3, n = 3, e = fh * n;
  m.box(-w / 2, 0, -d / 2, w / 2, e, d / 2, P.stone); m.box(-w / 2 - 0.12, 0, -d / 2 - 0.12, w / 2 + 0.12, 0.6, d / 2 + 0.12, P.stoneD);
  for (let f = 1; f < n; f++) m.box(-w / 2 - 0.08, f * fh - 0.15, -d / 2 - 0.08, w / 2 + 0.08, f * fh, d / 2 + 0.08, P.stoneD);
  for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) m.bx(x, 0, z, 0.6, e, 0.6, P.stoneD);   // corner quoins
  doorOn(m, 'f', d / 2, 0, 1.4, 2.6, P.door); m.bx(0, 2.75, d / 2 + 0.3, 2.2, 0.15, 0.6, P.stoneD);
  for (let f = 0; f < n; f++) windowsAround(m, -w / 2, -d / 2, w / 2, d / 2, f * fh, { sp: 2.0, ww: 0.85, wh: 1.4, skipU: f === 0 ? 0 : null, shut: f ? P.shutB : null, box: f === 1 });
  hip(m, -w / 2, -d / 2, w / 2, d / 2, e, 3.4, 0.45, rc); chimney(m, -2.6, -1.5, e + 1.2, e + 4.0, 0.8); chimney(m, 2.6, 1.5, e + 1.2, e + 4.0, 0.8);
  return m; }
function wideHouse(rc) { R = rng(53); const m = new Mesh(), w = 10, d = 5.6, fh = 2.9, e = fh * 2;
  m.box(-w / 2, 0, -d / 2, w / 2, e, d / 2, P.plaster); m.box(-w / 2 - 0.05, 0, -d / 2 - 0.05, w / 2 + 0.05, 0.5, d / 2 + 0.05, P.stoneD);
  m.box(-w / 2 - 0.06, fh - 0.12, -d / 2 - 0.06, w / 2 + 0.06, fh + 0.04, d / 2 + 0.06, P.timber);
  doorOn(m, 'f', d / 2, -1.6, 1.0, 2.1, P.doorG); doorOn(m, 'f', d / 2, 2.6, 1.0, 2.1, P.doorB);
  for (const u of [-3.8, 0.4, 4.2]) windowOn(m, 'f', d / 2, u, 1.0, 0.9, 1.1, { shut: P.shut, box: 1 });
  windowsAround(m, -w / 2, -d / 2, w / 2, d / 2, 0, { sides: 'klr', sp: 2.6 }); windowsAround(m, -w / 2, -d / 2, w / 2, d / 2, fh, { sp: 2.2, ww: 0.75, wh: 1.1, shut: P.shut });
  gable(m, -w / 2, -d / 2, w / 2, d / 2, e, 2.8, 0.45, rc, P.plaster, 'x');
  for (const x of [-2.6, 2.6]) { const z = d / 2 - 0.9, y = e + 0.6; m.box(x - 0.8, e - 0.2, z - 1.2, x + 0.8, y + 0.9, z + 0.4, P.plaster, { skip: 'b' }); windowOn(m, 'f', z + 0.4, x, y - 0.1, 0.7, 0.8); gable(m, x - 0.8, z - 1.2, x + 0.8, z + 0.4, y + 0.9, 0.9, 0.15, rc, P.plaster, 'z'); }
  chimney(m, -4.2, -0.6, e + 1.0, e + 3.4); chimney(m, 4.2, -0.6, e + 1.0, e + 3.4);
  return m; }
function rowHouses(rc) { R = rng(67); const m = new Mesh(), uw = 4, d = 6, fh = 2.8; const U = [[2, P.rose, P.doorB, P.shutB], [3, P.sage, P.door, P.shutR], [2, P.ochre, P.doorG, P.shut]];
  U.forEach(([n, wc, dc, sc], i) => { const x0 = -6 + i * uw, x1 = x0 + uw, e = n * fh, ox = (i === 1 ? 0.15 : 0);
    m.box(x0, 0, -d / 2, x1, e, d / 2 + ox, wc); m.box(x0 - 0.03, 0, -d / 2, x1 + 0.03, 0.45, d / 2 + ox + 0.03, P.stoneD);
    doorOn(m, 'f', d / 2 + ox, x0 + 1.0, 0.95, 2.1, dc); windowOn(m, 'f', d / 2 + ox, x0 + 2.8, 1.0, 1.0, 1.1, { box: 1 });
    for (let f = 1; f < n; f++) { windowOn(m, 'f', d / 2 + ox, x0 + 1.1, f * fh + 0.8, 0.75, 1.2, { shut: sc }); windowOn(m, 'f', d / 2 + ox, x0 + 2.9, f * fh + 0.8, 0.75, 1.2, { shut: sc }); }
    for (let f = 0; f < n; f++) windowOn(m, 'k', -d / 2, x0 + 2, f * fh + 0.9, 0.8, 1.1);
    if (i === 0) for (let f = 0; f < n; f++) windowOn(m, 'l', x0, 0, f * fh + 0.9, 0.8, 1.1); if (i === 2) for (let f = 0; f < n; f++) windowOn(m, 'r', x1, 0, f * fh + 0.9, 0.8, 1.1);
    gable(m, x0, -d / 2, x1, d / 2 + ox, e, 3.0, 0.25, rc, wc, 'z'); chimney(m, x0 + 0.5, -d / 2 + 0.8, e + 0.5, e + 2.6, 0.55); });
  return m; }
function towerHouse(rc) { R = rng(79); const m = new Mesh(), r = 2.2, fh = 3, n = 3, e = fh * n, N = 12;
  m.cyl(0, 0, 0, r, e, r, N, P.stone, { open: 1 }); m.cyl(0, 0, 0, r + 0.15, 0.6, r + 0.12, N, P.stoneD, { open: 1 });
  for (let f = 1; f < n; f++) m.cyl(0, f * fh - 0.15, 0, r + 0.1, f * fh, r + 0.1, N, P.stoneD, { open: 1 });
  m.cyl(0, e, 0, r + 0.3, e + 0.35, r + 0.3, N, P.stoneD, { bottom: 1 });
  for (let f = 0; f < n; f++) for (let k = 0; k < 3; k++) { const a = Math.PI / 2 + (k - 1) * 2.1 + f * 0.6; if (f === 0 && k === 1) continue; const wm = new Mesh(); windowOn(wm, 'f', 0, 0, f * fh + 0.9, 0.55, 1.1, { shut: f ? P.shutR : null }); wm.move(0, 0, r - 0.05); wm.rotY(-(a - Math.PI / 2)); m.add(wm); }
  const dm = new Mesh(); doorOn(dm, 'f', 0, 0, 1.0, 2.1, P.door); dm.move(0, 0, r - 0.04); m.add(dm);
  m.cone(0, e + 0.35, 0, r + 0.55, 4.6, N, rc); m.cyl(0, e + 4.8, 0, 0.05, e + 5.8, 0.05, 4, P.iron); m.bx(0.25, e + 5.3, 0, 0.5, 0.3, 0.02, P.red);
  return m; }
function shopHouse(rc, aw) { R = rng(83); const m = new Mesh(), w = 7, d = 5.6, f1 = 3.1, jet = 0.4, f2 = 2.8, e = f1 + f2;
  m.box(-w / 2, 0, -d / 2, w / 2, f1, d / 2, P.stone);
  windowOn(m, 'f', d / 2, -1.7, 0.7, 2.6, 1.6, { glass: col('#4a5566') }); doorOn(m, 'f', d / 2, 1.0, 1.1, 2.3, P.doorB); windowOn(m, 'f', d / 2, 2.6, 0.9, 0.9, 1.3);
  windowsAround(m, -w / 2, -d / 2, w / 2, d / 2, 0, { sides: 'klr', sp: 2.6 });
  // striped awning
  for (let i = 0; i < 8; i++) { const x0 = -3.3 + i * 0.6; m.quad([x0, 2.9, d / 2], [x0 + 0.6, 2.9, d / 2], [x0 + 0.6, 2.35, d / 2 + 1.3], [x0, 2.35, d / 2 + 1.3], i % 2 ? P.cream : aw, [0, 1, 0.4]); }
  m.quad([-3.3, 2.35, d / 2 + 1.3], [1.5, 2.35, d / 2 + 1.3], [1.5, 2.05, d / 2 + 1.3], [-3.3, 2.05, d / 2 + 1.3], aw, [0, 0, 1]);
  const X0 = -w / 2 - jet, X1 = w / 2 + jet, Z0 = -d / 2 - jet, Z1 = d / 2 + jet;
  m.box(X0, f1, Z0, X1, e, Z1, P.plaster, { skip: 'b' }); m.box(X0 - 0.05, f1 - 0.2, Z0 - 0.05, X1 + 0.05, f1, Z1 + 0.05, P.timber);
  for (const s of 'fk') timberOn(m, s, s === 'f' ? Z1 : Z0, X0, X1, f1, e, 1.0); for (const s of 'rl') timberOn(m, s, s === 'r' ? X1 : X0, Z0, Z1, f1, e, 1.1);
  windowsAround(m, X0, Z0, X1, Z1, f1, { sp: 2.0, ww: 0.7, wh: 1.0, box: 1 });
  gable(m, X0, Z0, X1, Z1, e, 2.7, 0.4, rc, P.plaster, 'x');
  { const z = Z1 - 1.0, y = e + 0.5; m.box(-0.8, e - 0.2, z - 1.2, 0.8, y + 0.9, z + 0.5, P.plaster, { skip: 'b' }); windowOn(m, 'f', z + 0.5, 0, y - 0.1, 0.7, 0.8); gable(m, -0.8, z - 1.2, 0.8, z + 0.5, y + 0.9, 0.9, 0.15, rc, P.plaster, 'z'); }
  chimney(m, 2.8, -1.2, e + 0.8, e + 3.2);
  // hanging sign
  m.bx(3.2, 3.6, d / 2 + 0.45, 0.08, 0.08, 0.9, P.iron); m.bx(3.2, 2.95, d / 2 + 0.7, 0.06, 0.6, 0.7, aw); m.bx(3.2, 3.05, d / 2 + 0.7, 0.08, 0.3, 0.4, P.cream);
  return m; }

// ---------- roads / paving (top at ~0.08 m) ----------
const RT = 0.08;
// cobbles laid in rows: region(x,z) → bool; rows along x; area bounds
function cobbles(m, x0, z0, x1, z1, inside, o = {}) {
  const rowH = o.rowH || 0.34, base = o.base || P.mortar, k = o.k || P.cob, gap = 0.035;
  m.box(x0, 0, z0, x1, RT - 0.035, z1, base, { skip: 'b' });
  let row = 0; for (let z = z0; z < z1 - 0.05; z += rowH, row++) { let x = x0 - (row % 2) * 0.2; while (x < x1 - 0.05) { const L = 0.32 + R() * 0.22, xa = Math.max(x0, x), xb = Math.min(x1, x + L), za = z, zb = Math.min(z1, z + rowH);
    const cx = (xa + xb) / 2, cz = (za + zb) / 2; if (xb - xa > 0.08 && inside(cx, cz)) { const h = RT - 0.01 + R() * 0.02; m.quad([xa + gap, h, za + gap], [xb - gap, h, za + gap], [xb - gap, h, zb - gap], [xa + gap, h, zb - gap], jit(k, 0.1), [0, 1, 0]); }
    x += L; } }
}
// cobbles on a polar band (curves, plazas): r0..r1, angle a0..a1, centred cx,cz
function cobblesPolar(m, cx, cz, r0, r1, a0, a1, o = {}) {
  const rowH = o.rowH || 0.34, k = o.k || P.cob, gap = 0.035, N = Math.max(6, Math.ceil((a1 - a0) * r1 / 0.5));
  // base band
  for (let i = 0; i < N; i++) { const t0 = a0 + (a1 - a0) * i / N, t1 = a0 + (a1 - a0) * (i + 1) / N, p = (r, t, y) => [cx + Math.cos(t) * r, y, cz + Math.sin(t) * r], y = RT - 0.035;
    m.quad(p(r0, t0, y), p(r1, t0, y), p(r1, t1, y), p(r0, t1, y), P.mortar, [0, 1, 0]); m.quad(p(r1, t0, 0), p(r1, t1, 0), p(r1, t1, y), p(r1, t0, y), P.mortar, [Math.cos(t0), 0, Math.sin(t0)]);
    if (r0 > 0.01) m.quad(p(r0, t0, 0), p(r0, t1, 0), p(r0, t1, y), p(r0, t0, y), P.mortar, [-Math.cos(t0), 0, -Math.sin(t0)]); }
  let row = 0; for (let r = r0; r < r1 - 0.05; r += rowH, row++) { const ra = r, rb = Math.min(r1, r + rowH), rm = (ra + rb) / 2; if (rm < 0.25) { continue; }
    const n = Math.max(3, Math.round((a1 - a0) * rm / 0.42)); for (let i = 0; i < n; i++) { const t0 = a0 + (a1 - a0) * (i + (row % 2) * 0.5 * 0) / n, t1 = a0 + (a1 - a0) * (i + 1) / n, g0 = gap / Math.max(ra, 0.3), h = RT - 0.01 + R() * 0.02;
      const p = (rr, t) => [cx + Math.cos(t) * rr, h, cz + Math.sin(t) * rr];
      m.quad(p(ra + gap, t0 + g0), p(rb - gap, t0 + g0), p(rb - gap, t1 - g0), p(ra + gap, t1 - g0), jit(k, 0.1), [0, 1, 0]); } }
}
function curbX(m, x0, x1, z, w = 0.3) { m.box(x0, 0, z - w / 2, x1, 0.18, z + w / 2, P.curb); }
function flags(m, x0, z0, x1, z1, s = 0.9) { m.box(x0, 0, z0, x1, RT - 0.03, z1, P.mortar, { skip: 'b' });
  let row = 0; for (let z = z0; z < z1 - 0.05; z += s, row++) { let x = x0 - (row % 2) * s * 0.4; while (x < x1 - 0.05) { const L = s * (0.8 + R() * 0.7), xa = Math.max(x0, x), xb = Math.min(x1, x + L), zb = Math.min(z1, z + s), h = RT - 0.005 + R() * 0.01;
    if (xb - xa > 0.1) m.quad([xa + 0.04, h, z + 0.04], [xb - 0.04, h, z + 0.04], [xb - 0.04, h, zb - 0.04], [xa + 0.04, h, zb - 0.04], jit(P.flag, 0.08), [0, 1, 0]); x += L; } } }

// ---------- lamps / lights ----------
function lantern(m, x, y, z, s = 1) { m.bx(x, y, z, 0.34 * s, 0.08, 0.34 * s, P.iron); m.bx(x, y + 0.08, z, 0.26 * s, 0.42 * s, 0.26 * s, GLOWC, { glow: 1 });
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) m.bx(x + dx * 0.13 * s, y + 0.08, z + dz * 0.13 * s, 0.04, 0.42 * s, 0.04, P.iron);
  m.cone(x, y + 0.08 + 0.42 * s, z, 0.26 * s, 0.22 * s, 4, P.iron, Math.PI / 4); m.bx(x, y + 0.08 + 0.64 * s, z, 0.06, 0.1, 0.06, P.iron); }
function lampPost() { R = rng(101); const m = new Mesh(); m.cyl(0, 0, 0, 0.22, 0.35, 0.16, 8, P.iron); m.cyl(0, 0.35, 0, 0.07, 3.1, 0.05, 6, P.iron); m.cyl(0, 3.1, 0, 0.12, 3.2, 0.12, 6, P.iron); lantern(m, 0, 3.2, 0); return m; }
function lampDouble() { R = rng(103); const m = new Mesh(); m.cyl(0, 0, 0, 0.24, 0.4, 0.17, 8, P.iron); m.cyl(0, 0.4, 0, 0.08, 3.6, 0.06, 6, P.iron); m.bx(0, 3.3, 0, 1.6, 0.07, 0.07, P.iron);
  for (const x of [-0.75, 0.75]) { m.bx(x, 2.95, 0, 0.05, 0.35, 0.05, P.iron); lantern(m, x, 2.45, 0, 0.9); m.beam([0, 3.0, 0], [x * 0.9, 3.3, 0], 0.04, P.iron); } m.cone(0, 3.6, 0, 0.1, 0.25, 6, P.iron); return m; }
function lampWall() { R = rng(107); const m = new Mesh(); m.bx(0, 0, 0, 0.3, 0.4, 0.05, P.iron); m.bx(0, 0.3, 0.3, 0.06, 0.06, 0.6, P.iron); m.beam([0, 0.05, 0.03], [0, 0.3, 0.5], 0.04, P.iron); lantern(m, 0, -0.35, 0.55, 0.85); m.bx(0, 0.06, 0.55, 0.03, 0.25, 0.03, P.iron); return m; }
function lampStone() { R = rng(109); const m = new Mesh(); m.bx(0, 0, 0, 0.7, 0.25, 0.7, P.stoneD); m.bx(0, 0.25, 0, 0.45, 1.0, 0.45, P.stone); m.bx(0, 1.25, 0, 0.6, 0.12, 0.6, P.stoneD); lantern(m, 0, 1.37, 0, 1.1); return m; }
function lampCrook() { R = rng(113); const m = new Mesh(); m.cyl(0, 0, 0, 0.2, 0.3, 0.15, 8, P.iron); m.cyl(0, 0.3, 0, 0.06, 3.3, 0.05, 6, P.iron);
  let px = 0, py = 3.3; for (let i = 1; i <= 6; i++) { const t = i / 6 * Math.PI, x = 0.45 - Math.cos(t) * 0.45, y = 3.3 + Math.sin(t) * 0.45; m.beam([px, py, 0], [x, y, 0], 0.06, P.iron); px = x; py = y; }
  m.bx(0.9, 2.9, 0, 0.03, 0.4, 0.03, P.iron); lantern(m, 0.9, 2.3, 0, 0.95); return m; }
function torchStand() { R = rng(127); const m = new Mesh(); m.cyl(0, 0, 0, 0.07, 1.8, 0.06, 6, P.woodD); m.cyl(0, 1.75, 0, 0.12, 2.0, 0.18, 6, P.iron); m.cone(0, 1.95, 0, 0.14, 0.35, 5, GLOWC); m.g.p.push(...m.p.splice(m.p.length - 45)); m.g.n.push(...m.n.splice(m.n.length - 45)); m.g.c.push(...m.c.splice(m.c.length - 45)); return m; }
function brazier() { R = rng(131); const m = new Mesh(); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; m.beam([Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45], [Math.cos(a) * 0.2, 0.75, Math.sin(a) * 0.2], 0.06, P.iron); }
  m.cyl(0, 0.7, 0, 0.25, 1.0, 0.5, 8, P.iron, { bottom: 1, open: 1 }); m.cyl(0, 0.85, 0, 0.42, 0.95, 0.4, 8, GLOWC, { glow: 1 }); return m; }

// ---------- props ----------
function barrel(m, x, y, z, s = 1, k = P.wood) { m.cyl(x, y, z, 0.3 * s, y + 0.45 * s, 0.34 * s, 10, k, { top: P.woodL }); m.cyl(x, y + 0.45 * s, z, 0.34 * s, y + 0.9 * s, 0.3 * s, 10, k, { top: P.woodL });
  for (const h of [0.12, 0.78]) m.cyl(x, y + h * s, z, 0.33 * s, y + (h + 0.05) * s, 0.33 * s, 10, P.iron, { open: 1 }); }
function crate(m, x, y, z, s = 0.8, ry = 0) { const c = new Mesh(); c.bx(0, 0, 0, s, s, s, P.woodL, { top: P.wood }); for (const d of [-1, 1]) { c.bx(0, 0, d * s / 2, s + 0.02, 0.08, 0.03, P.woodD); c.bx(0, s - 0.08, d * s / 2, s + 0.02, 0.08, 0.03, P.woodD); }
  c.rotY(ry).move(x, y, z); m.add(c); }
function wheel(m, x, y, z, r, ry = 0) { const w = new Mesh(); w.cyl(0, -0.06, 0, r, 0.06, r, 10, P.woodD, { bottom: 1 }); w.cyl(0, 0.06, 0, 0.1, 0.12, 0.1, 6, P.iron); w.rotAxis([0, 0, 1], Math.PI / 2).rotY(ry).move(x, y, z); m.add(w); }
function well() { R = rng(201); const m = new Mesh(); m.cyl(0, 0, 0, 1.0, 0.85, 1.0, 12, P.stone, { open: 1 }); m.cyl(0, 0, 0, 0.8, 0.85, 0.8, 12, P.stoneD, { open: 1 }); m.cyl(0, 0.85, 0, 1.08, 0.97, 1.08, 12, P.stoneD, { top: P.stoneD });
  m.cyl(0, 0.5, 0, 0.8, 0.55, 0.8, 12, P.water); for (const x of [-0.9, 0.9]) m.bx(x, 0.97, 0, 0.14, 1.7, 0.14, P.woodD);
  m.bx(0, 2.3, 0, 2.0, 0.1, 0.1, P.woodD); gable(m, -1.25, -0.8, 1.25, 0.8, 2.65, 0.7, 0.1, P.roofR, P.woodD, 'x'); m.bx(0, 1.7, 0, 0.3, 0.35, 0.3, P.wood); return m; }
function cart(hay) { R = rng(hay ? 211 : 213); const m = new Mesh(); m.box(-0.8, 0.55, -1.3, 0.8, 0.65, 1.3, P.wood); for (const s of [-1, 1]) { m.box(s * 0.8 - 0.04, 0.65, -1.3, s * 0.8 + 0.04, 1.05, 1.3, P.woodL); m.box(-0.8, 0.65, s * 1.3 - 0.04, 0.8, 1.05, s * 1.3 + 0.04, P.woodL); }
  for (const s of [-1, 1]) wheel(m, s * 0.92, 0.5, 0.2, 0.5); m.beam([-0.4, 0.6, 1.3], [-0.4, 0.4, 2.6], 0.08, P.woodD); m.beam([0.4, 0.6, 1.3], [0.4, 0.4, 2.6], 0.08, P.woodD);
  if (hay) { m.box(-0.75, 0.65, -1.25, 0.75, 1.25, 1.25, P.hay); m.cyl(0, 1.25, 0, 0.8, 1.55, 0.45, 8, P.hay); } else { crate(m, -0.35, 0.65, -0.6, 0.6, 0.2); barrel(m, 0.4, 0.65, 0.5, 0.8); m.bx(-0.3, 0.65, 0.7, 0.5, 0.35, 0.6, P.sack); }
  return m; }
function barrelStack() { R = rng(221); const m = new Mesh(); barrel(m, -0.36, 0, 0); barrel(m, 0.36, 0, 0); barrel(m, 0, 0, 0.62); barrel(m, 0, 0.9, 0.2, 0.95); return m; }
function crateStack() { R = rng(223); const m = new Mesh(); crate(m, -0.45, 0, 0, 0.85, 0.05); crate(m, 0.45, 0, 0.05, 0.85, -0.1); crate(m, 0, 0, 0.9, 0.8, 0.3); crate(m, -0.2, 0.85, 0.1, 0.75, 0.25); return m; }
function stall(aw) { R = rng(231); const m = new Mesh(), w = 3, d = 1.8; m.box(-w / 2, 0.85, -d / 2, w / 2, 0.95, d / 2 - 0.2, P.wood); m.box(-w / 2, 0, d / 2 - 0.3, w / 2, 0.85, d / 2 - 0.2, P.woodD);
  for (const x of [-w / 2 + 0.08, w / 2 - 0.08]) for (const z of [-d / 2 + 0.08, d / 2 - 0.08]) m.bx(x, 0, z, 0.1, z > 0 ? 2.3 : 2.6, 0.1, P.woodD);
  for (let i = 0; i < 6; i++) { const x0 = -w / 2 - 0.1 + i * (w + 0.2) / 6, x1 = x0 + (w + 0.2) / 6; m.quad([x0, 2.65, -d / 2 - 0.1], [x1, 2.65, -d / 2 - 0.1], [x1, 2.25, d / 2 + 0.4], [x0, 2.25, d / 2 + 0.4], i % 2 ? P.cream : aw, [0, 1, 0.3]); m.quad([x0, 2.25, d / 2 + 0.4], [x1, 2.25, d / 2 + 0.4], [x1, 2.0, d / 2 + 0.4], [x0, 2.0, d / 2 + 0.4], i % 2 ? P.cream : aw, [0, 0, 1]); }
  // goods
  for (let i = 0; i < 5; i++) { const x = -1.2 + i * 0.6; m.bx(x, 0.95, 0.1, 0.45, 0.12, 0.5, P.woodL); m.cyl(x, 1.07, 0.1, 0.18, 1.2, 0.12, 6, [P.flowerY, P.red, P.leaf, P.hay, P.flower][i]); }
  barrel(m, -1.1, 0, -0.5, 0.7); crate(m, 1.0, 0, -0.45, 0.55, 0.3); return m; }
function fountain() { R = rng(241); const m = new Mesh(); m.cyl(0, 0, 0, 2.4, 0.55, 2.4, 16, P.stone, { open: 1 }); m.cyl(0, 0, 0, 2.15, 0.55, 2.15, 16, P.stoneD, { open: 1 }); m.cyl(0, 0.55, 0, 2.5, 0.68, 2.5, 16, P.stoneD, { top: P.stoneD });
  m.cyl(0, 0.38, 0, 2.15, 0.42, 2.15, 16, P.water); m.cyl(0, 0, 0, 0.35, 1.6, 0.25, 8, P.stone); m.cyl(0, 1.6, 0, 0.3, 1.7, 0.9, 10, P.stoneD, { open: 1 }); m.cyl(0, 1.66, 0, 0.82, 1.68, 0.82, 10, P.water);
  m.cyl(0, 1.7, 0, 0.12, 2.4, 0.09, 6, P.stone); m.cyl(0, 2.4, 0, 0.25, 2.55, 0.001, 6, P.stoneD); return m; }
function trough() { R = rng(251); const m = new Mesh(); m.box(-1, 0, -0.35, 1, 0.6, 0.35, P.woodD, { top: P.water }); m.box(-1.05, 0.6, -0.4, 1.05, 0.66, -0.3, P.wood); m.box(-1.05, 0.6, 0.3, 1.05, 0.66, 0.4, P.wood); return m; }
function bench() { R = rng(261); const m = new Mesh(); m.box(-0.9, 0.42, -0.2, 0.9, 0.5, 0.2, P.woodL); for (const x of [-0.75, 0.75]) m.bx(x, 0, 0, 0.1, 0.42, 0.35, P.woodD); m.box(-0.9, 0.5, -0.24, 0.9, 0.95, -0.18, P.woodL); return m; }
function signpost() { R = rng(271); const m = new Mesh(); m.cyl(0, 0, 0, 0.07, 2.6, 0.06, 6, P.woodD); const a = [[2.2, 0.4, P.cream], [1.85, -0.5, P.woodL], [1.5, 1.2, P.cream]];
  for (const [y, r, k] of a) { const s = new Mesh(); s.box(0, -0.12, -0.03, 0.85, 0.12, 0.03, k); s.tri([0.85, -0.12, 0.031], [1.05, 0, 0.031], [0.85, 0.12, 0.031], k, [0, 0, 1]); s.tri([0.85, -0.12, -0.031], [1.05, 0, -0.031], [0.85, 0.12, -0.031], k, [0, 0, -1]); s.rotY(r).move(0, y, 0); m.add(s); } return m; }
function shopSign(k) { R = rng(281); const m = new Mesh(); m.bx(0, 0, 0, 0.3, 0.3, 0.05, P.iron); m.bx(0, 0.22, 0.45, 0.06, 0.06, 0.9, P.iron); for (const z of [0.25, 0.75]) m.bx(0, -0.1, z, 0.02, 0.32, 0.02, P.iron); m.bx(0, -0.7, 0.5, 0.06, 0.6, 0.7, k); m.bx(0, -0.58, 0.5, 0.08, 0.3, 0.42, P.cream); return m; }
function planter() { R = rng(291); const m = new Mesh(); m.box(-0.9, 0, -0.35, 0.9, 0.5, 0.35, P.stone, { top: P.soil }); for (let i = 0; i < 9; i++) { const x = -0.75 + i * 0.19, z = (R() - 0.5) * 0.4; m.cyl(x, 0.5, z, 0.14, 0.75 + R() * 0.2, 0.06, 5, i % 3 ? P.leaf : P.leafD); m.bx(x, 0.7 + R() * 0.2, z, 0.1, 0.08, 0.1, i % 2 ? P.flower : P.flowerY); } return m; }
function flowerPots() { R = rng(293); const m = new Mesh(); [[0, 0, 0.32], [0.55, 0.15, 0.24], [-0.4, 0.3, 0.2]].forEach(([x, z, r], i) => { m.cyl(x, 0, z, r * 0.75, r * 1.4, r, 8, col('#a8664a')); m.cyl(x, r * 1.4, z, r * 1.2, r * 2.2, r * 0.6, 6, P.leaf); m.bx(x, r * 2.1, z, r * 0.5, r * 0.3, r * 0.5, i === 1 ? P.flowerY : P.flower); }); return m; }
function hayBales() { R = rng(301); const m = new Mesh(); m.box(-1.0, 0, -0.45, 0.0, 0.6, 0.45, P.hay); m.box(0.05, 0, -0.4, 1.05, 0.6, 0.5, jit(P.hay, 0.06)); m.box(-0.5, 0.6, -0.42, 0.5, 1.2, 0.48, jit(P.hay, 0.06)); return m; }
function woodpile() { R = rng(311); const m = new Mesh(); for (let r = 0; r < 4; r++) for (let i = 0; i < 6 - r; i++) { const c = new Mesh(); c.cyl(0, -0.8, 0, 0.14, 0.8, 0.14, 6, P.wood, { top: P.woodL, bottom: 1 }); c.rotAxis([0, 0, 1], Math.PI / 2).rotY(Math.PI / 2).move(-0.8 + i * 0.29 + r * 0.145, 0.14 + r * 0.25, 0); m.add(c); }
  m.box(-1.0, 0, -0.95, 1.0, 0.05, 0.95, P.woodD); return m; }
function sacks() { R = rng(321); const m = new Mesh(); [[0, 0, 0], [0.55, 0, 0.1], [0.25, 0.4, 0.05], [-0.4, 0, 0.35]].forEach(([x, y, z]) => { m.cyl(x, y, z, 0.25, y + 0.35, 0.22, 7, jit(P.sack, 0.06)); m.cyl(x, y + 0.35, z, 0.22, y + 0.5, 0.06, 7, P.sack); }); return m; }
function bannerPole(k) { R = rng(331); const m = new Mesh(); m.cyl(0, 0, 0, 0.25, 0.3, 0.2, 8, P.stoneD); m.cyl(0, 0.3, 0, 0.06, 5.2, 0.05, 6, P.woodD); m.bx(0.5, 4.95, 0, 1.0, 0.06, 0.06, P.woodD);
  m.quad([0.05, 4.92, 0], [0.95, 4.92, 0], [0.95, 3.0, 0], [0.05, 3.0, 0], k, [0, 0, 1]); m.tri([0.05, 3.0, 0], [0.95, 3.0, 0], [0.5, 2.6, 0], k, [0, 0, 1]); m.cone(0, 5.2, 0, 0.1, 0.25, 6, P.hay); return m; }
function noticeBoard() { R = rng(341); const m = new Mesh(); for (const x of [-0.8, 0.8]) m.bx(x, 0, 0, 0.12, 2.1, 0.12, P.woodD); m.box(-0.75, 0.9, -0.04, 0.75, 1.95, 0.04, P.woodL); gable(m, -0.95, -0.25, 0.95, 0.25, 2.1, 0.35, 0.05, P.roofR, P.woodD, 'x');
  for (let i = 0; i < 5; i++) { const x = -0.55 + i * 0.27, y = 1.05 + R() * 0.55; m.quad([x - 0.1, y, 0.05], [x + 0.1, y, 0.05], [x + 0.1, y + 0.28, 0.05], [x - 0.1, y + 0.28, 0.05], P.cream, [0, 0, 1]); } return m; }
function statueSmall() { R = rng(351); const m = new Mesh(); m.bx(0, 0, 0, 1.3, 0.3, 1.3, P.stoneD); m.bx(0, 0.3, 0, 1.0, 1.3, 1.0, P.stone); m.bx(0, 1.6, 0, 1.15, 0.15, 1.15, P.stoneD);
  m.cyl(0, 1.75, 0, 0.32, 2.9, 0.22, 7, P.stoneG); m.cyl(0, 2.9, 0, 0.18, 3.25, 0.16, 7, P.stoneG); m.beam([0.15, 2.7, 0], [0.5, 3.4, 0.1], 0.09, P.stoneG); m.beam([0.5, 3.4, 0.1], [0.5, 1.9, 0.1], 0.04, P.stoneG); return m; }

// fences
function fenceWood() { R = rng(401); const m = new Mesh(); for (let i = 0; i <= 4; i++) m.bx(-2 + i, 0, 0, 0.12, 1.1, 0.12, P.woodD); for (const y of [0.4, 0.85]) m.box(-2.05, y, -0.04, 2.05, y + 0.1, 0.04, P.wood); return m; }
function fencePicket() { R = rng(403); const m = new Mesh(); for (let i = 0; i < 16; i++) { const x = -1.5 + i * 0.2; m.bx(x, 0, 0, 0.09, 0.85, 0.04, P.cream); m.tri([x - 0.045, 0.85, 0.02], [x + 0.045, 0.85, 0.02], [x, 0.95, 0.02], P.cream, [0, 0, 1]); }
  for (const y of [0.25, 0.6]) m.box(-1.55, y, -0.05, 1.55, y + 0.07, -0.02, P.frame); return m; }
function stoneWallLow() { R = rng(405); const m = new Mesh(); for (let r = 0; r < 3; r++) { let x = -2 + (r % 2) * 0.25; while (x < 2) { const L = Math.min(2 - x, 0.5 + R() * 0.4); m.box(x + 0.02, r * 0.3, -0.3, x + L - 0.02, r * 0.3 + 0.28, 0.3, jit(P.stone, 0.1)); x += L; } }
  m.box(-2.05, 0.9, -0.35, 2.05, 1.02, 0.35, P.stoneD); return m; }
function hedge() { R = rng(407); const m = new Mesh(); m.box(-1.5, 0, -0.45, 1.5, 1.2, 0.45, P.leafD, { top: P.leaf }); for (let i = 0; i < 7; i++) m.bx(-1.3 + i * 0.43, 1.0, (R() - 0.5) * 0.3, 0.45, 0.35, 0.6, jit(P.leaf, 0.1)); return m; }
function gateArch() { R = rng(409); const m = new Mesh(); for (const x of [-1.6, 1.6]) { m.bx(x, 0, 0, 0.7, 2.8, 0.7, P.stone); m.bx(x, 2.8, 0, 0.85, 0.15, 0.85, P.stoneD); }
  m.box(-1.95, 2.95, -0.3, 1.95, 3.45, 0.3, P.stone); gable(m, -1.95, -0.4, 1.95, 0.4, 3.45, 0.55, 0.12, P.roofR, P.stone, 'x'); lantern(m, -1.6, 2.95, 0.5, 0.7); m.box(-1.25, 2.6, -0.1, 1.25, 2.95, 0.1, P.woodD); return m; }

// ---------- list ----------
// the kit was modelled at real-life size (2.8–3 m floors, 2 m doors); the game's playable houses use ~4.5 m floors → everything ×1.5 (user 2026-11-24: too small)
// roads/paving grow in x/z only (same thickness); houses scale in their add() line, the rest in add()
const HS = 1.5;
const A = [];
// id, English name (UI is English), cat, mesh, {col, ns, cs}
const add = (id, name, cat, mesh, o = {}) => (cat !== 'build' && mesh.scale(HS, cat === 'road' && id !== 'steps_4' ? 1 : HS), A.push({ id, name, cat, mesh, col: o.col == null ? 1 : o.col, ns: o.ns || 0, cs: o.cs }));
const RF = [['red', P.roofR, 'red roof', P.red], ['slate', P.roofS, 'slate roof', P.blue]];
for (const [rk, rc, rn, aw] of RF) {
  add('cottage_' + rk, 'Cottage 7x7 (' + rn + ')', 'build', cottage(rc).scale(HS), { cs: 0.95 });
  add('timber_' + rk, 'Timber House 2F (' + rn + ')', 'build', timberHouse(rc).scale(HS), { cs: 0.9 });
  add('tall_' + rk, 'Tall Townhouse 3F (' + rn + ')', 'build', tallHouse(rc).scale(HS), { cs: 0.95 });
  add('big_' + rk, 'Big Stone House 3F 12x15 (' + rn + ')', 'build', bigHouse(rc).scale(HS), { cs: 0.95 });
  add('wide_' + rk, 'Wide House 2F 15x9 (' + rn + ')', 'build', wideHouse(rc).scale(HS), { cs: 0.92 });
  add('row_' + rk, 'Row Houses x3 (' + rn + ')', 'build', rowHouses(rc).scale(HS), { cs: 0.95 });
  add('towerh_' + rk, 'Round Tower House (' + rn + ')', 'build', towerHouse(rc).scale(HS), { cs: 0.85 });
  add('shop_' + rk, 'Shop House (' + rn + ')', 'build', shopHouse(rc, aw).scale(HS), { cs: 0.88 });
}
// roads: flat, walk-through, no shadow
{ const T = (id, name, f) => { R = rng(500 + A.length); const m = new Mesh(); f(m); add(id, name, 'road', m, { col: 0, ns: 1 }); };
  const all = () => true;
  T('road_4', 'Cobble Road 6x6', m => cobbles(m, -2, -2, 2, 2, all));
  T('road_8', 'Cobble Road 6x12', m => cobbles(m, -2, -4, 2, 4, all));
  T('road_curb_4', 'Cobble Road 6x6 + Curbs', m => { cobbles(m, -2, -2, 2, 2, all); for (const s of [-1, 1]) { const c = new Mesh(); curbX(c, -2, 2, 0); c.rotY(Math.PI / 2).move(s * 2.15, 0, 0); m.add(c); } });
  T('road_curve', 'Cobble Road Curve 90 (r6)', m => cobblesPolar(m, -4, -4, 2, 6, 0, Math.PI / 2));
  T('road_t', 'Cobble T-Junction 6x6', m => { cobbles(m, -2, -2, 2, 2, all); const c = new Mesh(); curbX(c, -2, 2, 0); c.move(0, 0, -2.15); m.add(c); });
  T('road_end', 'Cobble Road End (round)', m => { cobbles(m, -2, 0, 2, 2, all); cobblesPolar(m, 0, 0, 0, 2, Math.PI, Math.PI * 2); });
  T('alley_2', 'Narrow Alley 3x6', m => cobbles(m, -1, -2, 1, 2, all, { rowH: 0.28 }));
  T('plaza_round', 'Round Plaza 12m', m => { cobblesPolar(m, 0, 0, 0, 1.2, 0, Math.PI * 2, { k: P.stoneG }); cobblesPolar(m, 0, 0, 1.2, 4, 0, Math.PI * 2); });
  T('plaza_sq', 'Square Plaza 12x12', m => { cobbles(m, -4, -4, 4, 4, all); m.box(-1.2, 0, -1.2, 1.2, RT + 0.01, 1.2, P.stoneG); m.box(-1.0, 0, -1.0, 1.0, RT + 0.015, 1.0, P.flag); });
  T('flags_4', 'Stone Flag Paving 6x6', m => flags(m, -2, -2, 2, 2));
  T('flags_8', 'Stone Flag Paving 12x12', m => flags(m, -4, -4, 4, 4, 1.1));
  T('stepping', 'Stepping Stones Path', m => { for (let i = 0; i < 6; i++) { const z = -2.5 + i * 1.0, x = Math.sin(i * 1.3) * 0.35, r = 0.32 + R() * 0.12; m.cyl(x, 0, z, r, 0.07, r * 0.95, 7, jit(P.flag, 0.1), { a0: R() }); } });
  T('curb_4', 'Curb Stone 6m', m => curbX(m, -2, 2, 0));
  T('steps_4', 'Stone Steps 6 wide (3 steps)', m => { for (let i = 0; i < 3; i++) m.box(-2, 0, -0.6 + i * 0.4, 2, 0.22 * (3 - i), 0.6, jit(P.stone, 0.05), { top: P.flag }); });
}
// lights (glass glows; place a Light object for real light)
add('lamp_post', 'Lamp Post', 'light', lampPost(), { cs: 0.35 });
add('lamp_double', 'Double Lamp Post', 'light', lampDouble(), { cs: 0.12 });
add('lamp_crook', 'Hanging Lamp Post', 'light', lampCrook(), { cs: 0.2 });
add('lamp_stone', 'Stone Lantern Pillar', 'light', lampStone(), { cs: 0.7 });
add('lamp_wall', 'Wall Lantern', 'light', lampWall(), { col: 0, ns: 1 });
add('torch_stand', 'Torch Stand', 'light', torchStand(), { col: 0 });
add('brazier', 'Iron Brazier', 'light', brazier(), { cs: 0.8 });
// props
add('well', 'Town Well', 'prop', well(), { cs: 0.85 });
add('cart_goods', 'Cart (goods)', 'prop', cart(0), { cs: 0.75 });
add('cart_hay', 'Hay Cart', 'prop', cart(1), { cs: 0.75 });
add('stall_red', 'Market Stall (red)', 'prop', stall(P.red), { cs: 0.85 });
add('stall_blue', 'Market Stall (blue)', 'prop', stall(P.blue), { cs: 0.85 });
add('stall_green', 'Market Stall (green)', 'prop', stall(P.green), { cs: 0.85 });
add('fountain', 'Fountain', 'prop', fountain(), { cs: 0.95 });
add('trough', 'Water Trough', 'prop', trough(), { cs: 0.9 });
add('barrels', 'Barrel Stack', 'prop', barrelStack(), { cs: 0.85 });
add('crates', 'Crate Stack', 'prop', crateStack(), { cs: 0.85 });
add('hay_bales', 'Hay Bales', 'prop', hayBales(), { cs: 0.9 });
add('woodpile', 'Woodpile', 'prop', woodpile(), { cs: 0.85 });
add('statue', 'Small Statue', 'prop', statueSmall(), { cs: 0.9 });
add('barrel', 'Barrel', 'prop', (() => { R = rng(601); const m = new Mesh(); barrel(m, 0, 0, 0); return m; })(), { col: 0 });
add('crate', 'Crate', 'prop', (() => { R = rng(603); const m = new Mesh(); crate(m, 0, 0, 0, 0.8); return m; })(), { col: 0 });
add('sacks', 'Grain Sacks', 'prop', sacks(), { col: 0 });
add('bench', 'Wooden Bench', 'prop', bench(), { col: 0 });
add('signpost', 'Signpost', 'prop', signpost(), { col: 0 });
add('shop_sign_red', 'Hanging Shop Sign (red)', 'prop', shopSign(P.red), { col: 0, ns: 1 });
add('shop_sign_blue', 'Hanging Shop Sign (blue)', 'prop', shopSign(P.blue), { col: 0, ns: 1 });
add('planter', 'Flower Planter', 'prop', planter(), { col: 0 });
add('flower_pots', 'Flower Pots', 'prop', flowerPots(), { col: 0, ns: 1 });
add('banner_red', 'Banner Pole (red)', 'prop', bannerPole(P.red), { col: 0 });
add('banner_blue', 'Banner Pole (blue)', 'prop', bannerPole(P.blue), { col: 0 });
add('notice', 'Notice Board', 'prop', noticeBoard(), { col: 0 });
// fences / walls
add('fence_wood', 'Wooden Fence 6m', 'fence', fenceWood(), { cs: 1 });
add('fence_picket', 'Picket Fence 4.5m', 'fence', fencePicket(), { cs: 1 });
add('wall_low', 'Low Stone Wall 6m', 'fence', stoneWallLow(), { cs: 1 });
add('hedge', 'Hedge 4.5m', 'fence', hedge(), { cs: 1 });
add('gate_arch', 'Stone Gate Arch', 'fence', gateArch(), { col: 0 });

// ---------- GLB ----------
function glb(list) {
  const bufs = [], views = [], accs = [], meshes = [], nodes = [];
  const pushBuf = (arr, target) => { let b = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); const pad = (4 - b.length % 4) % 4; if (pad) b = Buffer.concat([b, Buffer.alloc(pad)]); const off = bufs.reduce((s, q) => s + q.length, 0); bufs.push(b); views.push({ buffer: 0, byteOffset: off, byteLength: arr.byteLength, target }); return views.length - 1; };
  const prim = (T, mat) => {
    const Pp = new Float32Array(T.p), N = new Float32Array(T.n), C = new Uint8Array(T.c.length / 3 * 4), n = Pp.length / 3;
    for (let k = 0; k < n; k++) { for (let a = 0; a < 3; a++) C[k * 4 + a] = Math.round(255 * Math.min(1, Math.max(0, T.c[k * 3 + a]))); C[k * 4 + 3] = 255; }
    const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let k = 0; k < Pp.length; k += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], Pp[k + a]); mx[a] = Math.max(mx[a], Pp[k + a]); }
    accs.push({ bufferView: pushBuf(Pp, 34962), componentType: 5126, count: n, type: 'VEC3', min: mn, max: mx }); const ap = accs.length - 1;
    accs.push({ bufferView: pushBuf(N, 34962), componentType: 5126, count: n, type: 'VEC3' }); const an = accs.length - 1;
    accs.push({ bufferView: pushBuf(C, 34962), componentType: 5121, normalized: true, count: n, type: 'VEC4' }); const ac = accs.length - 1;
    return { attributes: { POSITION: ap, NORMAL: an, COLOR_0: ac }, material: mat, mode: 4 };
  };
  for (const a of list) {
    const prims = [prim(a.mesh, 0)]; if (a.mesh.g.p.length) prims.push(prim(a.mesh.g, 1));
    meshes.push({ name: 't_' + a.id, primitives: prims }); nodes.push({ name: 't_' + a.id, mesh: meshes.length - 1 });
  }
  const bin = Buffer.concat(bufs);
  const json = { asset: { version: '2.0', generator: 'tools/town-assets.mjs' }, scene: 0, scenes: [{ nodes: nodes.map((_, i) => i) }], nodes, meshes,
    materials: [{ name: 'town_vc', doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.92 } },
      { name: 'glow_town', doubleSided: true, emissiveFactor: [1, 0.72, 0.38], pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.6 } }],
    accessors: accs, bufferViews: views, buffers: [{ byteLength: bin.length }] };
  let js = Buffer.from(JSON.stringify(json)); js = Buffer.concat([js, Buffer.alloc((4 - js.length % 4) % 4, 0x20)]);
  const head = Buffer.alloc(12), c1 = Buffer.alloc(8), c2 = Buffer.alloc(8); head.write('glTF', 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  c1.writeUInt32LE(js.length, 0); c1.write('JSON', 4); c2.writeUInt32LE(bin.length, 0); c2.write('BIN\0', 4);
  return Buffer.concat([head, c1, js, c2, bin]);
}

const inf = {}; for (const a of A) { a.mesh.lift(); const b = a.mesh.bbox(); inf[a.id] = { w: +(b[3] - b[0]).toFixed(2), d: +(b[5] - b[2]).toFixed(2), h: +(b[4] - b[1]).toFixed(2), tris: a.mesh.tris(), cat: a.cat, col: a.col }; }
const buf = glb(A), V = Date.now(), dir = path.join(ROOT, 'assets', 'mapkit');
fs.writeFileSync(path.join(dir, 'town.glb'), buf);
fs.writeFileSync(path.join(dir, 'town.info.json'), JSON.stringify(inf, null, 0));
const kp = path.join(dir, 'kit.json'), k = JSON.parse(fs.readFileSync(kp, 'utf8'));
k.user = (k.user || []).filter(u => !String(u.id).startsWith('town/'));
for (const a of A) { const r = { id: 'town/' + a.id, name: a.name + ' · Town', cat: a.cat, src: 'mapkit/town.glb', node: 't_' + a.id, col: a.col, brk: 0, ns: a.ns, v: V }; if (a.cs != null) r.cs = a.cs; k.user.push(r); }
fs.writeFileSync(kp, '{\n "_about": ' + JSON.stringify(k._about) + ',\n "v": ' + (k.v || 1) + ',\n "assets": [\n  ' + k.assets.map(a => JSON.stringify(a)).join(',\n  ') + '\n ],\n "user": [\n  ' + k.user.map(a => JSON.stringify(a)).join(',\n  ') + '\n ]\n}\n');
const tot = Object.values(inf).reduce((s, q) => s + q.tris, 0);
console.log('OK assets/mapkit/town.glb', (buf.length / 1024).toFixed(0) + ' KB', A.length, 'assets', tot, 'tris');
console.log(Object.entries(inf).map(([id, q]) => `${id}:${q.tris}t ${q.w}x${q.d}x${q.h}`).join('  '));
