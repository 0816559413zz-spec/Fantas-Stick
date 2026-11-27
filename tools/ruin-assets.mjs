// Modular ruin kit for Map Builder (Overwatch-style arena pieces: cover walls, pillars, high-ground platforms, stairs, walkways, arches, rubble)
// Run: node tools/ruin-assets.mjs  → assets/mapkit/ruin.glb + kit.json "user" rows (id ruin/*, cat 'ruin') + assets/mapkit/ruin.info.json
// Units = game metres (already at the town ×1.5 scale: full wall 4.5 m = one town floor). Module grid 2 m / 4 m, heights 1.2 / 2.4 / 3 / 4.5 m.
// Base at y=0, centred on the bbox, walls run along x, stairs/ramps climb towards +z.
// Each kit row may carry game shapes (mapbuild/model.js kitShapes): cb = collision boxes [cx,cz,w,d,h,y0] (replace the bbox footprint),
// fl = walkable slabs {x,z,w,d,y,y2,sol} (y at local -z edge, y2 at +z edge; sol 0 = no under-slab blockers, omitted = auto for ramps) → game floors.
// Raised blocks use sol 0 + a 2 m grid of collision boxes 0.6 m below the top (Map Builder's solid-below circles would stop you stepping off a stair onto the block).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
let R = rng(1);
const lin = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const col = hex => { const n = parseInt(hex.slice(1), 16); return [lin((n >> 16 & 255) / 255), lin((n >> 8 & 255) / 255), lin((n & 255) / 255)]; };
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const jit = (c, a = 0.08) => mul(c, 1 - a + 2 * a * R());
// watercolour-friendly weathered stone (same family as the town kit / castle stone)
const P = { stone: col('#c9bc9c'), stoneW: col('#d8ccae'), stoneD: col('#a39374'), stoneG: col('#b3ae9f'), mortar: col('#7a7062'), flag: col('#b9b09c'),
  moss: col('#7d8f55'), mossD: col('#5f7444'), dirt: col('#8a7558'), wood: col('#7a5c40') };
const stoneK = () => { const r = R(); return jit(r < 0.55 ? P.stone : r < 0.8 ? P.stoneW : r < 0.93 ? P.stoneG : P.stoneD, 0.07); };

class Mesh {
  constructor() { this.p = []; this.n = []; this.c = []; this.cb = []; this.fl = []; }
  _t(a, b, c, k, hint) {
    let ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const L = Math.hypot(nx, ny, nz); if (L < 1e-9) return; nx /= L; ny /= L; nz /= L;
    if (hint && nx * hint[0] + ny * hint[1] + nz * hint[2] < 0) { [b, c] = [c, b]; nx = -nx; ny = -ny; nz = -nz; }
    for (const q of [a, b, c]) { this.p.push(q[0], q[1], q[2]); this.n.push(nx, ny, nz); this.c.push(k[0], k[1], k[2]); }
  }
  tri(a, b, c, k, hint) { this._t(a, b, c, k, hint); }
  quad(a, b, c, d, k, hint) { this._t(a, b, c, k, hint); this._t(a, c, d, k, hint); }
  box(x0, y0, z0, x1, y1, z1, k, o = {}) {
    const top = o.top || k, sk = o.skip || (y0 < 0.02 ? 'b' : ''), v = (x, y, z) => [x, y, z];
    if (!sk.includes('t')) this.quad(v(x0, y1, z0), v(x1, y1, z0), v(x1, y1, z1), v(x0, y1, z1), jit(top, 0.03), [0, 1, 0]);
    if (!sk.includes('b')) this.quad(v(x0, y0, z0), v(x1, y0, z0), v(x1, y0, z1), v(x0, y0, z1), k, [0, -1, 0]);
    if (!sk.includes('f')) this.quad(v(x0, y0, z1), v(x1, y0, z1), v(x1, y1, z1), v(x0, y1, z1), jit(k, 0.03), [0, 0, 1]);
    if (!sk.includes('k')) this.quad(v(x0, y0, z0), v(x1, y0, z0), v(x1, y1, z0), v(x0, y1, z0), jit(k, 0.03), [0, 0, -1]);
    if (!sk.includes('r')) this.quad(v(x1, y0, z0), v(x1, y0, z1), v(x1, y1, z1), v(x1, y1, z0), jit(k, 0.03), [1, 0, 0]);
    if (!sk.includes('l')) this.quad(v(x0, y0, z0), v(x0, y0, z1), v(x0, y1, z1), v(x0, y1, z0), jit(k, 0.03), [-1, 0, 0]);
  }
  bx(cx, y0, cz, w, h, d, k, o) { this.box(cx - w / 2, y0, cz - d / 2, cx + w / 2, y0 + h, cz + d / 2, k, o); }
  cyl(cx, y0, cz, r0, y1, r1, n, k, o = {}) {
    const top = o.top || k, a0 = o.a0 || 0, ring = (y, r) => Array.from({ length: n }, (_, i) => { const t = a0 + i / n * Math.PI * 2; return [cx + Math.cos(t) * r, y, cz + Math.sin(t) * r]; });
    const A = ring(y0, r0), B = ring(y1, r1);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n, mx = (A[i][0] + A[j][0]) / 2 - cx, mz = (A[i][2] + A[j][2]) / 2 - cz; this.quad(A[i], A[j], B[j], B[i], jit(k, 0.04), [mx, 0, mz]); }
    if (!o.open && r1 > 0.001) for (let i = 1; i < n - 1; i++) this.tri(B[0], B[i], B[i + 1], top, [0, 1, 0]);
    if (o.bottom) for (let i = 1; i < n - 1; i++) this.tri(A[0], A[i], A[i + 1], k, [0, -1, 0]);
  }
  rotAxis(u, ang) { const c = Math.cos(ang), s = Math.sin(ang), t = 1 - c, [x, y, z] = u;
    const M = [t * x * x + c, t * x * y - s * z, t * x * z + s * y, t * x * y + s * z, t * y * y + c, t * y * z - s * x, t * x * z - s * y, t * y * z + s * x, t * z * z + c];
    for (const arr of [this.p, this.n]) for (let i = 0; i < arr.length; i += 3) { const a = arr[i], b = arr[i + 1], d = arr[i + 2]; arr[i] = M[0] * a + M[1] * b + M[2] * d; arr[i + 1] = M[3] * a + M[4] * b + M[5] * d; arr[i + 2] = M[6] * a + M[7] * b + M[8] * d; }
    return this; }
  rotY(a) { return this.rotAxis([0, 1, 0], a); }
  move(x, y, z) { for (let i = 0; i < this.p.length; i += 3) { this.p[i] += x; this.p[i + 1] += y; this.p[i + 2] += z; }
    for (const b of this.cb) { b[0] += x; b[1] += z; b[5] += y; } for (const f of this.fl) { f.x += x; f.z += z; f.y += y; f.y2 += y; } return this; }
  add(m) { for (const k of ['p', 'n', 'c']) this[k].push(...m[k]); return this; }
  bbox() { const b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let k = 0; k < this.p.length; k += 3) for (let a = 0; a < 3; a++) { b[a] = Math.min(b[a], this.p[k + a]); b[a + 3] = Math.max(b[a + 3], this.p[k + a]); } return b; }
  lift() { const b = this.bbox(); this.move(0, -b[1], 0);   // keep the modelled origin (grid footprint centre), base at y=0
    const ex = Math.max(-b[0], b[3]), ez = Math.max(-b[2], b[5]), e = 0.004;   // tiny anchors → symmetric bbox (Map Builder centres kit models on their bbox)
    for (const [x, z] of [[-ex, -ez], [ex, ez], [-ex, ez], [ex, -ez]]) this.tri([x, 0, z], [x + (x < 0 ? e : -e), 0, z], [x, 0, z + (z < 0 ? e : -e)], P.dirt, [0, 1, 0]);
    return this; }
  tris() { return this.p.length / 9; }
  // game shapes (local, before lift; lift moves them too)
  colBox(x0, z0, x1, z1, h, y0 = 0) { this.cb.push([(x0 + x1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(z1 - z0), h, y0]); return this; }
  // walkable block top: floor (not solid-below) + 2 m grid of collision boxes 0.6 m under the top → feet coming off a stair/ramp edge pass over them, ground walkers are stopped
  solidTop(x0, z0, x1, z1, H) { this.floor(x0, z0, x1, z1, H, H, 0); const nx = Math.max(1, Math.round((x1 - x0) / 2)), nz = Math.max(1, Math.round((z1 - z0) / 2)), sx = (x1 - x0) / nx, sz = (z1 - z0) / nz;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) this.colBox(x0 + i * sx, z0 + j * sz, x0 + (i + 1) * sx, z0 + (j + 1) * sz, H - 0.6); return this; }
  floor(x0, z0, x1, z1, y, y2 = y, sol) { const f = { x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0, y, y2 }; if (sol != null) f.sol = sol; this.fl.push(f); return this; }
}

// ---------- masonry ----------
// wall along x (x0..x1), thickness z0..z1, from y0 up to prof(x) (jagged break line). o.hole(x, y) → true = no block (window). o.ch course height.
function masonry(m, x0, x1, z0, z1, y0, prof, o = {}) {
  const ch = o.ch || 0.5; let row = 0;
  for (let y = y0; y < y0 + 20; y += ch, row++) {
    let x = x0 - (row % 2 ? 0.45 : 0), any = 0;
    while (x < x1 - 0.02) {
      const L = 0.75 + R() * 0.55, xa = Math.max(x0, x), xb = Math.min(x1, x + L); x += L; if (xb - xa < 0.12) continue;
      const xm = (xa + xb) / 2, top = prof(xm); if (y + 0.12 > top) continue;
      let yb = Math.min(y + ch, top); if (y + ch > top && top - y < ch) yb = y + Math.max(0.12, (top - y) * (0.6 + R() * 0.4));
      if (o.hole && o.hole(xm, (y + yb) / 2)) continue;
      any = 1; const g = 0.025, iz0 = R() * 0.05, iz1 = R() * 0.05, last = yb >= top - 0.13;
      const k = stoneK(), tk = last && R() < (o.moss == null ? 0.35 : o.moss) ? jit(R() < 0.5 ? P.moss : P.mossD, 0.08) : k;
      m.box(xa + g, y, z0 + iz0, xb - g, yb - g * (last ? 0 : 1), z1 - iz1, k, { top: tk, skip: y < 0.02 ? 'b' : '' });
    }
    if (!any && y > y0 + 0.5) break;
  }
  // mortar core so gaps never show through
  const lo = Math.min(...Array.from({ length: 9 }, (_, i) => prof(x0 + (x1 - x0) * i / 8)));
  m.box(x0 + 0.04, y0, z0 + 0.08, x1 - 0.04, Math.max(y0 + 0.1, lo - 0.1), z1 - 0.08, P.mortar, { skip: 'b' });
}
// rubble chunks scattered in a rect at ground (tumbled blocks)
function rubble(m, cx, cz, rx, rz, n, s = 1, hmax = 0.8) {
  for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, r = Math.sqrt(R()), x = cx + Math.cos(a) * rx * r, z = cz + Math.sin(a) * rz * r;
    const w = (0.25 + R() * 0.45) * s, h = Math.min(hmax, (0.18 + R() * 0.3) * s) * (1.2 - r * 0.6), d = (0.25 + R() * 0.4) * s, c = new Mesh();
    c.box(-w / 2, 0, -d / 2, w / 2, h, d / 2, stoneK(), { skip: '' }); const ax = R() - 0.5, az = R() - 0.5, al = Math.hypot(ax, az) || 1; c.rotAxis([ax / al, 0, az / al], R() * 0.35); c.rotY(R() * Math.PI); c.move(x, Math.max(0, (1 - r) * 0.08), z); m.add(c); }
}
const jag = (base, amp, seed) => x => base - amp * (0.5 + 0.5 * Math.sin(x * 2.1 + seed)) * (0.6 + 0.4 * Math.sin(x * 5.3 + seed * 2));

// ---------- pieces ----------
const T = 0.8;   // wall thickness
function wallStraight(L, H, o = {}) { R = rng(o.seed || 11); const m = new Mesh(), prof = o.prof || (H < 1.5 ? () => H : jag(H, o.amp == null ? 0.7 : o.amp, o.seed || 1));
  masonry(m, -L / 2, L / 2, -T / 2, T / 2, 0, prof, { hole: o.hole, moss: o.moss });
  if (o.base !== 0) m.box(-L / 2, 0, -T / 2 - 0.08, L / 2, 0.25, T / 2 + 0.08, jit(P.stoneD, 0.05));
  if (o.rub) rubble(m, (R() - 0.5) * L * 0.6, T / 2 + 0.35, L * 0.35, 0.25, o.rub, 0.8, 0.4);
  if (!o.noCol) m.colBox(-L / 2, -T / 2, L / 2, T / 2, H);
  return m; }
function wallWindow() { R = rng(21); const L = 4, H = 4.5, m = wallStraight(L, H, { seed: 21, amp: 0.45, noCol: 1, hole: (x, y) => Math.abs(x) < 0.7 && y > 1.2 && y < 2.65 });
  m.box(-0.8, 1.1, -T / 2 - 0.1, 0.8, 1.2, T / 2 + 0.1, jit(P.stoneD, 0.04));   // sill
  m.colBox(-2, -T / 2, 2, T / 2, 1.2); m.colBox(-2, -T / 2, -0.7, T / 2, 1.45, 1.2); m.colBox(0.7, -T / 2, 2, T / 2, 1.45, 1.2); m.colBox(-2, -T / 2, 2, T / 2, 1.6, 2.65);
  return m; }
function wallSlope() { R = rng(31); const m = new Mesh(), prof = x => 1.0 + (x + 2) / 4 * 3.5 - 0.35 * Math.abs(Math.sin(x * 3.1));
  masonry(m, -2, 2, -T / 2, T / 2, 0, prof); m.box(-2, 0, -T / 2 - 0.08, 2, 0.25, T / 2 + 0.08, jit(P.stoneD, 0.05)); rubble(m, -1.2, T / 2 + 0.5, 0.9, 0.45, 9, 0.9, 0.5); rubble(m, -1.4, -T / 2 - 0.4, 0.7, 0.3, 5, 0.8, 0.4);
  for (let i = 0; i < 4; i++) m.colBox(-2 + i, -T / 2, -1 + i, T / 2, 1.2 + i * 0.95);
  return m; }
function wallCorner(H) { R = rng(41 + H * 10); const m = new Mesh(), A = 4, prof = H < 1.5 ? () => H : jag(H, 0.55, 3);
  masonry(m, -A / 2, A / 2, -A / 2, -A / 2 + T, 0, prof); m.box(-A / 2, 0, -A / 2 - 0.08, A / 2, 0.25, -A / 2 + T + 0.08, jit(P.stoneD, 0.05));
  const s = new Mesh(); masonry(s, -A / 2 + T, A / 2, -T / 2, T / 2, 0, H < 1.5 ? () => H : jag(H - 0.3, 0.6, 7)); s.box(-A / 2 + T, 0, -T / 2 - 0.08, A / 2, 0.25, T / 2 + 0.08, jit(P.stoneD, 0.05));
  s.rotY(-Math.PI / 2).move(-A / 2 + T / 2, 0, 0); m.add(s);
  m.colBox(-A / 2, -A / 2, A / 2, -A / 2 + T, H); m.colBox(-A / 2, -A / 2 + T, -A / 2 + T, A / 2, H);
  return m; }
function wallEnd() { R = rng(51); const m = new Mesh(), prof = x => 2.4 - Math.max(0, x) * 1.1 - 0.25 * Math.abs(Math.sin(x * 4));
  masonry(m, -1, 1, -T / 2, T / 2, 0, prof); m.box(-1, 0, -T / 2 - 0.08, 1, 0.25, T / 2 + 0.08, jit(P.stoneD, 0.05)); rubble(m, 0.9, 0, 0.5, 0.6, 6, 0.8, 0.45);
  m.colBox(-1, -T / 2, 1, T / 2, 2.4); return m; }
function wallRubble() { R = rng(61); const m = new Mesh(); masonry(m, -2, 2, -T / 2, T / 2, 0, jag(0.8, 0.4, 5), { moss: 0.6 });
  rubble(m, 0, 0, 2.1, 0.9, 30, 1.0, 0.7); m.colBox(-2, -0.7, 2, 0.7, 1.0); return m; }
function pillarRound(H, broken) { R = rng(broken ? 71 : 73); const m = new Mesh(), r = 0.55;
  m.bx(0, 0, 0, 1.5, 0.35, 1.5, jit(P.stoneD, 0.04)); m.bx(0, 0.35, 0, 1.25, 0.2, 1.25, jit(P.stone, 0.04));
  const top = broken ? H : H - 0.5, n = Math.max(2, Math.round((top - 0.55) / 0.8));
  for (let i = 0; i < n; i++) { const y0 = 0.55 + i * (top - 0.55) / n, y1 = 0.55 + (i + 1) * (top - 0.55) / n - 0.03, last = i === n - 1;
    if (broken && last) { const ring = 12; for (let k = 0; k < ring; k++) { const t0 = k / ring * Math.PI * 2, t1 = (k + 1) / ring * Math.PI * 2, h0 = y0 + (y1 - y0) * (0.3 + 0.7 * R()), p = (t, y) => [Math.cos(t) * r, y, Math.sin(t) * r];
        m.quad(p(t0, y0), p(t1, y0), p(t1, h0), p(t0, h0), stoneK(), [Math.cos((t0 + t1) / 2), 0, Math.sin((t0 + t1) / 2)]); m.tri([0, y0 + (y1 - y0) * 0.5, 0], p(t0, h0), p(t1, h0), jit(P.stoneG, 0.06), [0, 1, 0]); } }
    else m.cyl(0, y0, 0, r, y1, r * 0.98, 12, stoneK()); }
  if (!broken) { m.bx(0, top, 0, 1.2, 0.2, 1.2, jit(P.stone, 0.04)); m.bx(0, top + 0.2, 0, 1.45, 0.3, 1.45, jit(P.stoneD, 0.04), { top: R() < 0.5 ? P.moss : P.stoneD }); }
  else rubble(m, 0.5, 0.5, 0.8, 0.7, 7, 0.8, 0.4);
  m.colBox(-0.6, -0.6, 0.6, 0.6, H); return m; }
function pillarSquare() { R = rng(77); const m = new Mesh(); m.bx(0, 0, 0, 1.5, 0.4, 1.5, jit(P.stoneD, 0.04));
  for (let i = 0; i < 9; i++) { const w = 1.0 - R() * 0.06; m.bx((R() - 0.5) * 0.04, 0.4 + i * 0.5, (R() - 0.5) * 0.04, w, 0.48, w, stoneK(), { top: i === 8 ? P.moss : null }); }
  m.colBox(-0.6, -0.6, 0.6, 0.6, 4.9); return m; }
function columnFallen() { R = rng(81); const m = new Mesh(), r = 0.55;
  for (let i = 0; i < 4; i++) { const c = new Mesh(), off = i * 0.04; c.cyl(0, 0, 0, r, 0.95, r * 0.98, 12, stoneK(), { bottom: 1, top: jit(P.stoneG, 0.05) }); c.rotAxis([0, 0, 1], -Math.PI / 2 + (R() - 0.5) * 0.06).rotY((R() - 0.5) * 0.12).move(-2 + i * 1.0, r, off); m.add(c); }
  rubble(m, 1.6, 0.4, 0.6, 0.4, 5, 0.7, 0.35); m.colBox(-2, -0.6, 2.1, 0.6, 1.1); return m; }
// raised block with masonry sides and a flagstone top (walkable)
function platform(W, D, H, o = {}) { R = rng(o.seed || 91); const m = new Mesh();
  const side = (L, H2) => { const s = new Mesh(); masonry(s, -L / 2, L / 2, -0.6, 0, 0, () => H2 - 0.18, { moss: 0 }); return s; };
  for (const [rot, L, dx, dz] of [[0, W, 0, D / 2], [Math.PI, W, 0, -D / 2], [Math.PI / 2, D, W / 2, 0], [-Math.PI / 2, D, -W / 2, 0]]) { const s = side(L, H); s.rotY(rot).move(dx, 0, dz); m.add(s); }
  m.box(-W / 2 + 0.3, 0, -D / 2 + 0.3, W / 2 - 0.3, H - 0.2, D / 2 - 0.3, P.mortar, { skip: 'b' });
  // cap stones (overhang a little) + flag top
  m.box(-W / 2, H - 0.2, -D / 2, W / 2, H - 0.06, D / 2, jit(P.stoneD, 0.04), { skip: 'b' });
  for (let z = -D / 2; z < D / 2 - 0.05; z += 1) for (let x = -W / 2 + (Math.round(z) % 2 ? 0.5 : 0); x < W / 2 - 0.05; x += 1) { const xa = Math.max(-W / 2, x), xb = Math.min(W / 2, x + 1), zb = Math.min(D / 2, z + 1), h = H - 0.04 + R() * 0.03;
    m.quad([xa + 0.04, h, z + 0.04], [xb - 0.04, h, z + 0.04], [xb - 0.04, h, zb - 0.04], [xa + 0.04, h, zb - 0.04], R() < 0.12 ? jit(P.moss, 0.1) : jit(P.flag, 0.08), [0, 1, 0]); }
  if (o.rub !== 0) rubble(m, W / 2 * (R() < 0.5 ? -0.8 : 0.8), D / 2 + 0.3, 0.9, 0.3, 6, 0.8, 0.45);
  m.solidTop(-W / 2, -D / 2, W / 2, D / 2, H);
  return m; }
// stairs climbing to +z: width W, rise H over run Lr
function stairs(W, H, Lr, seed = 101) { R = rng(seed); const m = new Mesh(), n = Math.round(H / 0.3), sd = Lr / n;
  for (let i = 0; i < n; i++) { const z0 = -Lr / 2 + i * sd, top = (i + 1) * H / n;
    for (let x = -W / 2; x < W / 2 - 0.05;) { const L = Math.min(W / 2 - x, 0.8 + R() * 0.7); m.box(x + 0.02, Math.max(0, top - 0.32), z0, x + L - 0.02, top, z0 + sd + 0.02, stoneK(), { top: R() < 0.1 ? P.moss : null }); x += L; } }
  // side cheek walls (filled triangle)
  for (const sx of [-1, 1]) { const x = sx * W / 2; m.tri([x, 0, -Lr / 2], [x, 0, Lr / 2], [x, H, Lr / 2], jit(P.stoneD, 0.05), [sx, 0, 0]); m.quad([x, 0, Lr / 2], [x, H, Lr / 2], [-x, H, Lr / 2], [-x, 0, Lr / 2], P.mortar, [0, 0, 1]); }
  m.floor(-W / 2, -Lr / 2, W / 2, Lr / 2, 0.15, H);
  return m; }
// rubble ramp (collapsed masonry slope) climbing to +z
function rubbleRamp(W, H, Lr) { R = rng(111); const m = new Mesh(), n = 8;
  for (let i = 0; i < n; i++) { const z0 = -Lr / 2 + i * Lr / n, top = (i + 1) * H / n;
    for (let x = -W / 2; x < W / 2 - 0.05;) { const L = Math.min(W / 2 - x, 0.6 + R() * 0.8), c = new Mesh(), h = top - Math.max(0, top - 0.7);
      c.box(0, 0, 0, L - 0.05, h, Lr / n + 0.15, stoneK(), { skip: '', top: R() < 0.25 ? P.moss : null }); c.rotAxis([1, 0, 0], (R() - 0.5) * 0.12).move(x, Math.max(0, top - 0.7) + (R() - 0.5) * 0.06, z0 - 0.05); m.add(c); x += L; } }
  m.box(-W / 2 + 0.1, 0, -Lr / 2 + 0.6, W / 2 - 0.1, H * 0.7, Lr / 2 - 0.1, P.mortar, { skip: 'b' });
  rubble(m, 0, -Lr / 2 - 0.2, W / 2, 0.3, 8, 0.8, 0.3);
  m.floor(-W / 2, -Lr / 2, W / 2, Lr / 2, 0.1, H);
  return m; }
// slab walkway: deck length L along x, width Wd, top at H; piers at both ends (sol 0 = walk under when H is high enough)
function walkway(L, Wd, H, seed, piers) { R = rng(seed); const m = new Mesh(), th = 0.45;
  m.box(-L / 2, H - th, -Wd / 2, L / 2, H - 0.08, Wd / 2, jit(P.stoneD, 0.04));
  for (let x = -L / 2; x < L / 2 - 0.05; x += 1) { const xb = Math.min(L / 2, x + 1), h = H - 0.05 + R() * 0.03; for (const [za, zb] of [[-Wd / 2, 0], [0, Wd / 2]]) m.quad([x + 0.04, h, za + 0.04], [xb - 0.04, h, za + 0.04], [xb - 0.04, h, zb - 0.04], [x + 0.04, h, zb - 0.04], R() < 0.1 ? jit(P.moss, 0.1) : jit(P.flag, 0.08), [0, 1, 0]); }
  // broken parapet stubs on the edges
  for (const sz of [-1, 1]) for (let x = -L / 2 + 0.2; x < L / 2 - 0.4; x += 1.1 + R() * 0.6) if (R() < 0.55) m.bx(x + 0.3, H - 0.08, sz * (Wd / 2 - 0.18), 0.55, 0.3 + R() * 0.35, 0.32, stoneK(), { top: R() < 0.4 ? P.moss : null });
  if (piers) { for (const sx of [-1, 1]) { const px = sx * (L / 2 - 0.6); const s = new Mesh(); masonry(s, -Wd / 2, Wd / 2, -0.6, 0.6, 0, () => H - th, { moss: 0 }); s.rotY(Math.PI / 2).move(px, 0, 0); m.add(s); m.colBox(px - 0.6, -Wd / 2, px + 0.6, Wd / 2, H - th); }
    // arch ribs under the deck
    const span = L - 2.4, rr = span / 2, cy = H - th - rr - 0.45; for (let i = 0; i < 9; i++) { const a0 = Math.PI * (0.18 + 0.64 * i / 9), a1 = Math.PI * (0.18 + 0.64 * (i + 1) / 9), p = (a, r, z) => [Math.cos(a) * r, cy + Math.sin(a) * r, z];
      for (const z of [-Wd / 2, Wd / 2]) { const sg = Math.sign(z); m.quad(p(a0, rr, z), p(a1, rr, z), p(a1, rr + 0.45, z), p(a0, rr + 0.45, z), stoneK(), [0, 0, sg]); }
      m.quad(p(a0, rr, -Wd / 2), p(a1, rr, -Wd / 2), p(a1, rr, Wd / 2), p(a0, rr, Wd / 2), jit(P.stoneD, 0.05), [0, -1, 0]); }
    m.floor(-L / 2, -Wd / 2, L / 2, Wd / 2, H, H, 0); }
  else { const s = new Mesh(); masonry(s, -L / 2, L / 2, -Wd / 2 + 0.2, Wd / 2 - 0.2, 0, () => H - th, { moss: 0 }); m.add(s); rubble(m, 0, Wd / 2 + 0.25, L / 2, 0.25, 6, 0.7, 0.35); m.solidTop(-L / 2, -Wd / 2, L / 2, Wd / 2, H); }
  return m; }
function arch() { R = rng(121); const m = new Mesh(), ow = 2.4, sp = 2.8, rr = ow / 2, ro = rr + 0.55, Ht = sp + ro + 0.05, H = 5.2;
  for (const sx of [-1, 1]) { const s = new Mesh(); masonry(s, -0.4, 0.4, -0.5, 0.5, 0, () => Ht, { moss: 0 }); s.move(sx * (rr + 0.4), 0, 0); m.add(s);
    m.bx(sx * (rr + 0.4), 0, 0, 1.0, 0.3, 1.2, jit(P.stoneD, 0.04)); m.colBox(sx * rr, -0.5, sx * (rr + 0.8), 0.5, H); }
  // voussoirs (wedge blocks round the opening) + spandrel faces up to the top band
  const n = 9; for (let i = 0; i < n; i++) { const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n, p = (a, r, z) => [Math.cos(a) * r, sp + Math.sin(a) * r, z], k = i === 4 ? jit(P.stoneW, 0.04) : stoneK();
    for (const z of [-0.5, 0.5]) m.quad(p(a0 + 0.01, rr, z), p(a1 - 0.01, rr, z), p(a1 - 0.01, ro, z), p(a0 + 0.01, ro, z), k, [0, 0, z]);
    m.quad(p(a0, rr, -0.5), p(a1, rr, -0.5), p(a1, rr, 0.5), p(a0, rr, 0.5), mul(k, 0.85), [0, -1, 0]);
    for (const z of [-0.46, 0.46]) { const A = p(a0, ro, z), B = p(a1, ro, z); m.quad(A, B, [B[0], Ht, z], [A[0], Ht, z], jit(P.stone, 0.05), [0, 0, z]); } }
  masonry(m, -rr - 0.8, rr + 0.8, -0.5, 0.5, Ht, x => H - (x > 0.6 ? 0.6 + 0.3 * Math.sin(x * 5) : 0.15 * Math.sin(x * 3)), { moss: 0.5 });
  m.colBox(-rr, -0.5, rr, 0.5, H - 3.4, 3.4);
  rubble(m, 1.6, 0.9, 0.6, 0.35, 5, 0.7, 0.35); return m; }
function floorTiles(W, D, seed) { R = rng(seed); const m = new Mesh(), s = 1.0;
  m.box(-W / 2, 0, -D / 2, W / 2, 0.04, D / 2, jit(P.dirt, 0.05), { skip: 'b' });
  for (let z = -D / 2; z < D / 2 - 0.05; z += s) for (let x = -W / 2 + (Math.round(z / s) % 2 ? s / 2 : 0); x < W / 2 - 0.05; x += s) { const ed = Math.min(W / 2 - Math.abs(x + s / 2), D / 2 - Math.abs(z + s / 2)); if (R() < 0.18 + (ed < 0.8 ? 0.25 : 0)) continue;   // missing / broken tiles
    const xa = Math.max(-W / 2, x), xb = Math.min(W / 2, x + s), zb = Math.min(D / 2, z + s), h = 0.07 + R() * 0.03, tl = (R() - 0.5) * 0.04; m.box(xa + 0.04, 0, z + 0.04, xb - 0.04, h, zb - 0.04, R() < 0.12 ? jit(P.moss, 0.1) : jit(P.flag, 0.09), { top: R() < 0.12 ? jit(P.moss, 0.1) : jit(P.flag, 0.09) }); }
  rubble(m, W / 2 - 0.6, D / 2 - 0.6, 0.6, 0.6, 4, 0.5, 0.2); return m; }
function rubblePile(big) { R = rng(big ? 131 : 133); const m = new Mesh(), rx = big ? 1.6 : 1.0, h = big ? 1.4 : 0.8;
  for (let l = 0; l < (big ? 4 : 3); l++) { const k = 1 - l * 0.25; const c = new Mesh(); rubble(c, 0, 0, rx * k, rx * 0.75 * k, big ? 14 : 9, big ? 1.2 : 0.9, 0.55); c.move(0, l * h / (big ? 4 : 3) * 0.85, 0); m.add(c); }
  m.cyl(0, 0, 0, rx * 0.9, h * 0.75, rx * 0.25, 8, jit(P.mortar, 0.06), { a0: R() }); if (big) m.colBox(-rx * 0.8, -rx * 0.6, rx * 0.8, rx * 0.6, h); return m; }
function stoneBlock() { R = rng(141); const m = new Mesh(); const c = new Mesh(); c.box(-1, 0, -0.6, 1, 1.25, 0.6, jit(P.stone, 0.05), { top: P.moss }); c.rotY(0.08); m.add(c);
  const d = new Mesh(); d.box(-0.45, 0, -0.4, 0.45, 0.6, 0.4, stoneK(), { skip: '' }); d.rotAxis([1, 0, 0], 0.25).move(1.4, 0.05, 0.5); m.add(d); rubble(m, -0.6, 0.9, 0.6, 0.3, 4, 0.6, 0.25);
  m.colBox(-1.05, -0.7, 1.05, 0.7, 1.25); return m; }
function stonesScatter() { R = rng(151); const m = new Mesh(); rubble(m, 0, 0, 1.8, 1.8, 18, 0.8, 0.35); return m; }

// ---------- list ----------
const A = [];
// id, English name (UI is English), mesh, {col, ns, cs}
const add = (id, name, mesh, o = {}) => A.push({ id, name, mesh, col: o.col == null ? 1 : o.col, ns: o.ns || 0, cs: o.cs });
add('wall_low_4', 'Low Cover Wall 4m (1.2m)', wallStraight(4, 1.2, { seed: 3, rub: 4 }));
add('wall_low_2', 'Low Cover Wall 2m (1.2m)', wallStraight(2, 1.2, { seed: 5 }));
add('wall_half_4', 'Half Wall 4m (2.4m, broken top)', wallStraight(4, 2.4, { seed: 7, amp: 0.6, rub: 5 }));
add('wall_full_4', 'Full Wall 4m (4.5m, broken top)', wallStraight(4, 4.5, { seed: 9, amp: 0.8 }));
add('wall_window_4', 'Wall 4m with Window Gap (4.5m)', wallWindow());
add('wall_slope_4', 'Collapsing Wall 4m (1→4.5m)', wallSlope());
add('wall_end_2', 'Wall End Stub 2m', wallEnd());
add('wall_corner_low', 'Corner Wall 4x4 (1.2m)', wallCorner(1.2));
add('wall_corner_half', 'Corner Wall 4x4 (2.4m)', wallCorner(2.4));
add('wall_rubble_4', 'Collapsed Wall Rubble 4m (~1m)', wallRubble());
add('pillar_round', 'Round Pillar (4.5m)', pillarRound(4.5, 0));
add('pillar_broken', 'Broken Pillar (2.2m)', pillarRound(2.2, 1));
add('pillar_square', 'Square Pillar (4.9m)', pillarSquare());
add('column_fallen', 'Fallen Column 4m (cover)', columnFallen());
add('plat_4x4_15', 'Platform 4x4 (1.5m high)', platform(4, 4, 1.5, { seed: 93 }));
add('plat_4x4_3', 'Platform 4x4 (3m high)', platform(4, 4, 3, { seed: 95 }));
add('plat_8x4_3', 'Platform 8x4 (3m high)', platform(8, 4, 3, { seed: 97 }));
add('plat_8x8_3', 'Platform 8x8 (3m high)', platform(8, 8, 3, { seed: 98 }));
add('plat_4x4_45', 'Platform 4x4 (4.5m high)', platform(4, 4, 4.5, { seed: 99 }));
add('stairs_15', 'Stairs 4 wide (1.5m rise, 3m run)', stairs(4, 1.5, 3, 103));
add('stairs_3', 'Stairs 4 wide (3m rise, 6m run)', stairs(4, 3, 6, 105));
add('ramp_rubble_3', 'Rubble Ramp 4 wide (3m rise, 6m run)', rubbleRamp(4, 3, 6));
add('walk_ledge_4', 'Walkway Ledge 4x3 (3m high, solid)', walkway(4, 3, 3, 161, 0));
add('bridge_8', 'Walkway Bridge 8x3 (4.5m deck, walk under)', walkway(8, 3, 4.5, 163, 1));
add('arch_4', 'Arch Doorway 4m (2.4m opening)', arch());
add('floor_4', 'Broken Floor Tiles 4x4', floorTiles(4, 4, 171), { col: 0, ns: 1 });
add('floor_8', 'Broken Floor Tiles 8x8', floorTiles(8, 8, 173), { col: 0, ns: 1 });
add('rubble_big', 'Rubble Pile (1.4m, cover)', rubblePile(1));
add('rubble_small', 'Rubble Pile small', rubblePile(0), { col: 0 });
add('stone_block', 'Fallen Stone Block (1.25m cover)', stoneBlock());
add('stones', 'Scattered Stones', stonesScatter(), { col: 0, ns: 1 });

// ---------- GLB ----------
function glb(list) {
  const bufs = [], views = [], accs = [], meshes = [], nodes = [];
  const pushBuf = (arr, target) => { let b = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); const pad = (4 - b.length % 4) % 4; if (pad) b = Buffer.concat([b, Buffer.alloc(pad)]); const off = bufs.reduce((s, q) => s + q.length, 0); bufs.push(b); views.push({ buffer: 0, byteOffset: off, byteLength: arr.byteLength, target }); return views.length - 1; };
  for (const a of list) {
    const T = a.mesh, Pp = new Float32Array(T.p), N = new Float32Array(T.n), C = new Uint8Array(T.c.length / 3 * 4), n = Pp.length / 3;
    for (let k = 0; k < n; k++) { for (let q = 0; q < 3; q++) C[k * 4 + q] = Math.round(255 * Math.min(1, Math.max(0, T.c[k * 3 + q]))); C[k * 4 + 3] = 255; }
    const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let k = 0; k < Pp.length; k += 3) for (let q = 0; q < 3; q++) { mn[q] = Math.min(mn[q], Pp[k + q]); mx[q] = Math.max(mx[q], Pp[k + q]); }
    accs.push({ bufferView: pushBuf(Pp, 34962), componentType: 5126, count: n, type: 'VEC3', min: mn, max: mx }); const ap = accs.length - 1;
    accs.push({ bufferView: pushBuf(N, 34962), componentType: 5126, count: n, type: 'VEC3' }); const an = accs.length - 1;
    accs.push({ bufferView: pushBuf(C, 34962), componentType: 5121, normalized: true, count: n, type: 'VEC4' }); const ac = accs.length - 1;
    meshes.push({ name: 'r_' + a.id, primitives: [{ attributes: { POSITION: ap, NORMAL: an, COLOR_0: ac }, material: 0, mode: 4 }] }); nodes.push({ name: 'r_' + a.id, mesh: meshes.length - 1 });
  }
  const bin = Buffer.concat(bufs);
  const json = { asset: { version: '2.0', generator: 'tools/ruin-assets.mjs' }, scene: 0, scenes: [{ nodes: nodes.map((_, i) => i) }], nodes, meshes,
    materials: [{ name: 'ruin_vc', doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.93 } }],
    accessors: accs, bufferViews: views, buffers: [{ byteLength: bin.length }] };
  let js = Buffer.from(JSON.stringify(json)); js = Buffer.concat([js, Buffer.alloc((4 - js.length % 4) % 4, 0x20)]);
  const head = Buffer.alloc(12), c1 = Buffer.alloc(8), c2 = Buffer.alloc(8); head.write('glTF', 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  c1.writeUInt32LE(js.length, 0); c1.write('JSON', 4); c2.writeUInt32LE(bin.length, 0); c2.write('BIN\0', 4);
  return Buffer.concat([head, c1, js, c2, bin]);
}

const r2 = v => Math.round(v * 100) / 100, inf = {};
for (const a of A) { a.mesh.lift(); const b = a.mesh.bbox(); inf[a.id] = { w: r2(b[3] - b[0]), d: r2(b[5] - b[2]), h: r2(b[4] - b[1]), tris: a.mesh.tris(), cat: 'ruin', col: a.col }; }
const buf = glb(A), V = Date.now(), dir = path.join(ROOT, 'assets', 'mapkit');
fs.writeFileSync(path.join(dir, 'ruin.glb'), buf);
fs.writeFileSync(path.join(dir, 'ruin.info.json'), JSON.stringify(inf, null, 0));
const kp = path.join(dir, 'kit.json'), k = JSON.parse(fs.readFileSync(kp, 'utf8'));
k.user = (k.user || []).filter(u => !String(u.id).startsWith('ruin/'));
for (const a of A) { const r = { id: 'ruin/' + a.id, name: a.name + ' · Ruin', cat: 'ruin', src: 'mapkit/ruin.glb', node: 'r_' + a.id, col: a.col, brk: 0, ns: a.ns, v: V }; if (a.cs != null) r.cs = a.cs;
  if (a.col && (a.mesh.cb.length || a.mesh.fl.length)) r.cb = a.mesh.cb.map(b => b.map(r2));
  if (a.mesh.fl.length) r.fl = a.mesh.fl.map(f => { const o = {}; for (const q in f) o[q] = r2(f[q]); return o; });
  k.user.push(r); }
fs.writeFileSync(kp, '{\n "_about": ' + JSON.stringify(k._about) + ',\n "v": ' + (k.v || 1) + ',\n "assets": [\n  ' + k.assets.map(a => JSON.stringify(a)).join(',\n  ') + '\n ],\n "user": [\n  ' + k.user.map(a => JSON.stringify(a)).join(',\n  ') + '\n ]\n}\n');
const tot = Object.values(inf).reduce((s, q) => s + q.tris, 0);
console.log('OK assets/mapkit/ruin.glb', (buf.length / 1024).toFixed(0) + ' KB', A.length, 'assets', tot, 'tris');
console.log(Object.entries(inf).map(([id, q]) => `${id}:${q.tris}t ${q.w}x${q.d}x${q.h}`).join('  '));
