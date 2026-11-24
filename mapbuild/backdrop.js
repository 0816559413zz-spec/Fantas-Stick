// Map Builder — backdrop around the play area (user 2026-11-22): sculpt land, paint surfaces, tree density, sea level, sea stacks.
// Pure JS (editor + node). The game draws it from data.bd (js/67-coast.js bdGridSrc) — no collision, players never go there.
// Grid: cell c m, origin (x0,z0) in map coords, covers the map + E m on every side. Inside the play area it is not drawn
// (the real ground is there); within ~12 m of the edge its height blends into the map's edge ground so the two meet.
//   hg Float32 heights (m) • sf Uint8 surface (BSURF index, 0 = auto by slope/height) • tr Uint8 tree density 0..255
//   st [{x,z,r,h}] sea stacks (map coords, m) • sea = sea level (m) or null = no water • look '' | 'overcast' (coast sky + fog)
// Saved as int16 decimetres + run-length bytes, base64 (bdPack / bdUnpack). Format: guides/MAP-BUILDER.md "Backdrop".

// surfaces — keep the colours in sync with BD_SURF in js/67-coast.js
export const BSURF = [
  { k: 'auto', n: 'Auto (slope/height)', c: '#8f9a80' }, { k: 'grass', n: 'Grass', c: '#4f7034' }, { k: 'grass2', n: 'Dark Grass', c: '#3a542c' },
  { k: 'field', n: 'Field', c: '#7d8650' }, { k: 'rock', n: 'Rock', c: '#6a645c' }, { k: 'sand', n: 'Sand', c: '#c8b88a' },
  { k: 'dirt', n: 'Dirt', c: '#6e5a40' }, { k: 'snow', n: 'Snow', c: '#e8edf0' },
];
export const BD_PRESETS = [['coast', 'Sea-cliff headland (sea N/E/S)'], ['island', 'Island'], ['valley', 'Mountain valley'], ['alpine', 'Alpine Valley (snow peaks + river)'], ['plains', 'Hills & fields'], ['lake', 'Lakeside'], ['flat', 'Flat (sculpt from scratch)']];
export const BD_LOOK = [['', 'Map sky'], ['overcast', 'Overcast (sea-cliff sky + fog)'], ['day', 'Clear Day (blue sky + sun)']];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

export function bdNew(M, o = {}) {
  const E = o.E || 600, c = o.c || 5, nx = Math.round((M.W + 2 * E) / c) + 1, ny = Math.round((M.H + 2 * E) / c) + 1, n = nx * ny;
  return { on: 1, E, c, nx, ny, x0: -E, z0: -E, hg: new Float32Array(n), sf: new Uint8Array(n), tr: new Uint8Array(n), st: [], sea: null, look: '', seed: 1, pre: 'flat', snow: 110 };
}
export function bdClone(B) { return B ? Object.assign({}, B, { hg: B.hg.slice(), sf: B.sf.slice(), tr: B.tr.slice(), st: B.st.map(s => Object.assign({}, s)) }) : null; }
// bilinear height of the raw grid (map coords)
export function bdRaw(B, x, z) {
  const fx = clamp((x - B.x0) / B.c, 0, B.nx - 1.001), fz = clamp((z - B.z0) / B.c, 0, B.ny - 1.001), i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = j * B.nx + i, a = B.hg;
  return (a[k] * (1 - u) + a[k + 1] * u) * (1 - v) + (a[k + B.nx] * (1 - u) + a[k + B.nx + 1] * u) * v;
}
export function bdCell(B, x, z) { return clamp(Math.round((z - B.z0) / B.c), 0, B.ny - 1) * B.nx + clamp(Math.round((x - B.x0) / B.c), 0, B.nx - 1); }
// m outside the play area (negative inside)
export const bdOut = (M, x, z) => Math.max(-x, x - M.W, -z, z - M.H);
export const BD_BLEND = 12;   // m over which the backdrop meets the map's edge ground
// visible height: edge blend + sea stacks • edge(x,z) = ground height at the nearest map edge point
export function bdHeight(B, M, x, z, edge) {
  let y = bdRaw(B, x, z); const e = bdOut(M, x, z);
  if (e < BD_BLEND) { const t = clamp(e / BD_BLEND, 0, 1), s = t * t * (3 - 2 * t); y = edge(clamp(x, 0, M.W), clamp(z, 0, M.H)) * (1 - s) + y * s; }
  for (const s of B.st) { const d = Math.hypot(x - s.x, z - s.z) - s.r; if (d < 6) { const base = B.sea != null ? B.sea : y, k = d < 0 ? 1 : 1 - d / 6; y = Math.max(y, base - 6 + (s.h + 6) * k * k); } }
  return y;
}

// ---------- save format ----------
const b64e = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const b64d = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
export function rleE(u8) { const o = []; for (let i = 0; i < u8.length;) { const v = u8[i]; let n = 1; while (n < 255 && i + n < u8.length && u8[i + n] === v) n++; o.push(n, v); i += n; } return b64e(Uint8Array.from(o)); }
export function rleD(s, n) { const b = b64d(s), u = new Uint8Array(n); let p = 0; for (let i = 0; i + 1 < b.length && p < n; i += 2) { u.fill(b[i + 1], p, Math.min(n, p + b[i])); p += b[i]; } return u; }
export function bdPack(B) {
  if (!B) return null; const h = new Int16Array(B.hg.length); for (let i = 0; i < h.length; i++) h[i] = clamp(Math.round(B.hg[i] * 10), -32767, 32767);
  return { on: B.on ? 1 : 0, E: B.E, c: B.c, nx: B.nx, ny: B.ny, x0: B.x0, z0: B.z0, sea: B.sea, look: B.look || '', seed: B.seed || 1, pre: B.pre || '', snow: B.snow != null ? B.snow : 110,
    st: B.st.map(s => ({ x: +s.x.toFixed(1), z: +s.z.toFixed(1), r: +s.r.toFixed(1), h: +s.h.toFixed(1) })),
    hg: b64e(new Uint8Array(h.buffer)), sf: rleE(B.sf), tr: rleE(B.tr) };
}
export function bdUnpack(j) {
  if (!j || !j.hg) return null; const n = j.nx * j.ny, hb = b64d(j.hg), h = new Int16Array(hb.buffer, 0, hb.length >> 1), hg = new Float32Array(n);
  for (let i = 0; i < n && i < h.length; i++) hg[i] = h[i] / 10;
  return Object.assign({}, j, { hg, sf: rleD(j.sf, n), tr: rleD(j.tr, n), st: (j.st || []).map(s => Object.assign({}, s)) });
}
// change reach (E m past the map edge) / grid cell (c m): resample — heights bilinear (past the old reach = its edge heights), surface + trees nearest (none past the old reach)
export const BD_REACH = [300, 600, 1000, 1500, 2000, 3000, 4000], BD_CELL = [5, 10, 20, 40];
export const bdCells = (M, E, c) => (Math.round((M.W + 2 * E) / c) + 1) * (Math.round((M.H + 2 * E) / c) + 1);
export function bdResize(B, M, E, c) {
  const N = bdNew(M, { E, c }), x1 = B.x0 + (B.nx - 1) * B.c, z1 = B.z0 + (B.ny - 1) * B.c;
  for (const k of ['on', 'sea', 'look', 'seed', 'pre', 'snow']) N[k] = B[k];
  N.st = B.st.map(s => Object.assign({}, s));
  for (let j = 0; j < N.ny; j++) for (let i = 0; i < N.nx; i++) {
    const x = N.x0 + i * c, z = N.z0 + j * c, k = j * N.nx + i; N.hg[k] = bdRaw(B, x, z);
    if (x >= B.x0 && x <= x1 && z >= B.z0 && z <= z1) { const o = bdCell(B, x, z); N.sf[k] = B.sf[o]; N.tr[k] = B.tr[o]; }
  }
  return N;
}
// map resized (content kept centred): move the grid with it
export function bdShift(B, dx, dz) { if (!B) return; B.x0 += dx; B.z0 += dz; for (const s of B.st) { s.x += dx; s.z += dz; } }

// ---------- presets ----------
function hsh(a, b) { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vn(x, z, s) { const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v), q = s * 7919;
  const h00 = hsh(i + q, j), h10 = hsh(i + 1 + q, j), h01 = hsh(i + q, j + 1), h11 = hsh(i + 1 + q, j + 1); return h00 + (h10 - h00) * a + (h01 - h00) * b + (h00 - h10 - h01 + h11) * a * b; }
function fbm(x, z, s, o = 4) { let v = 0, a = 0.5, t = 0; for (let i = 0; i < o; i++) { v += a * vn(x, z, s + i * 13); t += a; x *= 2.03; z *= 2.03; a *= 0.5; } return v / t; }
const sst = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const rrect = (x, z, bx, bz, r) => { const qx = Math.abs(x) - bx + r, qz = Math.abs(z) - bz + r; return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r; };
const segD = (x, z, ax, az, bx, bz) => { const vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz), 0, 1); return [Math.hypot(x - ax - vx * t, z - az - vz * t), t]; };
// cliff profile: d = signed distance to the cliff edge (< 0 land), top = grass height, sea = water level
function cliffY(d, top, sea, x, z, sd) {
  if (d < -3) return top;
  if (d < 9) { const s = (d + 3) / 12, b = Math.pow(s, 0.85); return top + (sea - 4 - top) * clamp(b + 0.04 * Math.sin(b * 28 + vn(x * 0.07, z * 0.07, sd) * 4), 0, 1); }
  if (d < 24) return sea - 4 - (d - 9) * 0.35 + Math.pow(fbm(x * 0.11, z * 0.11, sd + 1, 3), 2.2) * 9;
  return sea - 10 - Math.min(30, (d - 24) * 0.08);
}
// fills B (keeps on/E/c/look) with a preset • M = map (W/H) • seed = variation
export function bdGen(B, M, pre, seed = 1) {
  const hx = M.W / 2, hz = M.H / 2, sd = seed * 31 + 7, n = B.nx * B.ny;
  B.pre = pre; B.seed = seed; B.st = []; B.sf.fill(0); B.tr.fill(0); B.sea = null; B.snow = 110;
  const each = f => { for (let j = 0; j < B.ny; j++) for (let i = 0; i < B.nx; i++) { const X = B.x0 + i * B.c - hx, Z = B.z0 + j * B.c - hz; f(j * B.nx + i, X, Z); } };   // X/Z = metres from the map centre
  const out = (X, Z) => Math.max(Math.abs(X) - hx, Math.abs(Z) - hz);
  if (pre === 'coast') {
    const sea = -40, gap = 20, mg = gap, xw = -hx + 66, heads = [{ z: -1, off: 330, L: 440, dz: -70, r: 58 }, { z: 1, off: 400, L: 340, dz: 60, r: 64 }].map(H => { const zc = H.z * (hz + mg + H.off); return { ax: xw - 60, az: zc, bx: xw + H.L, bz: zc + H.dz, r: H.r }; });
    B.sea = sea; B.look = B.look || 'overcast';
    const land = (X, Z) => { const u = (Math.atan2(Z, X) / (Math.PI * 2) + 1) % 1, j = (fbm(u * 18, 0, sd, 4) - 0.5) * 14 + (fbm(u * 70, 3, sd + 3, 3) - 0.5) * 5;
      let d = rrect(X, Z, hx + mg, hz + mg, 26) - j; d = smin(d, X - xw - (fbm(Z * 0.006, 3.1, sd + 5) - 0.5) * 70, 40);
      for (const H of heads) { const [q, t] = segD(X, Z, H.ax, H.az, H.bx, H.bz); d = Math.min(d, q - H.r * (1 - 0.45 * t * t) - (fbm(X * 0.02, Z * 0.02, sd + 7) - 0.5) * 22); } return d; };
    const top = (X, Z) => { const far = Math.max(0, out(X, Z) - 40), k = Math.min(1, far / 420); return k * k * (6 + 26 * fbm(X * 0.004, Z * 0.004, sd + 11)) + (vn(X * 0.05, Z * 0.05, sd + 12) - 0.5) * 0.8 * Math.min(1, far / 30); };
    each((k, X, Z) => { const d = land(X, Z) + (fbm(X * 0.09, Z * 0.09, sd + 77, 3) - 0.5) * 7; B.hg[k] = cliffY(d, top(X, Z), sea, X, Z, sd + 31);
      const tk = fbm(X * 0.007, Z * 0.007, sd + 301, 3) + (X < -hx && Math.abs(Z) < hz + 80 ? 0.25 * (1 - Math.min(1, (-hx - X) / 220)) : 0);
      if (d < -9 && out(X, Z) > 22 && tk > 0.55) B.tr[k] = Math.min(255, (tk - 0.5) * 2.2 * 255 | 0);
      const f = vn(X * 0.011, Z * 0.017, sd + 94); if (d < -6 && out(X, Z) > 40 && f > 0.64) B.sf[k] = 3; });   // field patches
    for (let i = 0; i < 14; i++) { const u = hsh(i, sd + 40), side = i % 3, o = 14 + hsh(i, sd + 41) * 38; let X, Z;
      if (side === 1) { X = hx + mg + o; Z = (u * 2 - 1) * (hz + mg); } else { X = -hx * 0.6 + u * (hx * 1.6 + mg); Z = (side ? 1 : -1) * (hz + mg + o); }
      B.st.push({ x: X + hx, z: Z + hz, r: 3 + hsh(i, sd + 42) * 8, h: 8 + hsh(i, sd + 43) * 30 }); }
    for (const H of heads) for (let i = 0; i < 3; i++) { const t = 0.75 + i * 0.12; B.st.push({ x: H.ax + (H.bx - H.ax) * t + 40 + i * 25 + hx, z: H.az + (H.bz - H.az) * t + (i - 1) * 30 + hz, r: 6 + i * 3, h: 14 + i * 6 }); }
  } else if (pre === 'island') {
    const sea = -6; B.sea = sea;
    each((k, X, Z) => { const u = (Math.atan2(Z, X) / (Math.PI * 2) + 1) % 1, R = 90 + 110 * fbm(u * 6, 1, sd, 4), d = rrect(X, Z, hx + R, hz + R * 0.8, 80) + (fbm(X * 0.01, Z * 0.01, sd + 2) - 0.5) * 60;
      const cliff = fbm(u * 9, 7, sd + 9, 3) > 0.58, top = 2 + Math.max(0, -d) * 0.04 * (0.6 + fbm(X * 0.006, Z * 0.006, sd + 3)) + (vn(X * 0.04, Z * 0.04, sd + 4) - 0.5);
      B.hg[k] = cliff ? cliffY(d, Math.max(top, 14), sea, X, Z, sd + 31) : d < 0 ? Math.max(sea + 0.6, top - Math.max(0, d + 30) * 0.1) : sea - 0.6 - Math.min(20, d * 0.12);
      for (let q = 0; q < 3; q++) { const ix = (hsh(q, sd + 60) - 0.5) * 1600, iz = (hsh(q, sd + 61) - 0.5) * 1400, r = 40 + hsh(q, sd + 62) * 70, dd = Math.hypot(X - ix, Z - iz) - r; if (Math.abs(ix) > hx + 300 || Math.abs(iz) > hz + 300) B.hg[k] = Math.max(B.hg[k], dd < 0 ? sea + 2 + Math.min(18, -dd * 0.3) : sea - 1 - dd * 0.1); }
      const tk = fbm(X * 0.008, Z * 0.008, sd + 301, 3); if (B.hg[k] > sea + 3 && out(X, Z) > 20 && tk > 0.5) B.tr[k] = Math.min(255, (tk - 0.45) * 2.4 * 255 | 0); });
  } else if (pre === 'valley') {
    each((k, X, Z) => { const e = Math.max(0, out(X, Z) - 30), ridge = 1 - Math.abs(fbm(X * 0.004, Z * 0.004, sd + 5, 5) * 2 - 1), H = 40 + 150 * ridge;
      const y = sst(0, 420, e) * H + (fbm(X * 0.03, Z * 0.03, sd + 6, 3) - 0.5) * 6 * sst(0, 60, e); B.hg[k] = y;
      const tk = fbm(X * 0.01, Z * 0.01, sd + 301, 3); if (e > 15 && y < 70 && tk > 0.42) B.tr[k] = Math.min(255, (tk - 0.38) * 2.6 * 255 * (1 - sst(45, 70, y)) | 0); });
  } else if (pre === 'plains' || pre === 'lake') {
    const lx = hx + 260, lz = 0;
    if (pre === 'lake') B.sea = -1.5;
    each((k, X, Z) => { const e = Math.max(0, out(X, Z) - 20); let y = sst(0, 300, e) * (4 + 24 * fbm(X * 0.005, Z * 0.005, sd + 5, 4)) + (vn(X * 0.04, Z * 0.04, sd + 6) - 0.5) * 0.8 * sst(0, 30, e);
      if (pre === 'lake') { const d = Math.hypot((X - lx) / 1.6, Z - lz) - 170 - (fbm(X * 0.01, Z * 0.01, sd + 8) - 0.5) * 80; if (d < 40) y = Math.min(y, d < 0 ? -1.5 - Math.min(8, -d * 0.12) : -1.5 + d * 0.06); }
      B.hg[k] = y; const tk = fbm(X * 0.008, Z * 0.008, sd + 301, 3);
      if (e > 18 && y > 0.5 && tk > 0.56) B.tr[k] = Math.min(255, (tk - 0.5) * 2.2 * 255 | 0); else if (e > 30 && vn(X * 0.012, Z * 0.018, sd + 94) > 0.6) B.sf[k] = 3; });
  } else if (pre === 'alpine') {
    // painted alpine valley (user ref 2026-11-24): map on a green valley floor (runs along X), a winding river past the +Z edge,
    // steep green walls both sides, a big snowy pyramid peak far past +X, more snow peaks around • sizes scale with reach E
    const E = B.E, sea = -2; B.sea = sea; B.snow = 520; B.look = B.look || 'day';
    const rz = X => hz + 95 + 45 * Math.sin(X * 0.0045 + sd) + 25 * Math.sin(X * 0.011 + sd * 2);   // river centre (Z) along the valley
    const pyr = (X, Z, px, pz, R, H, a) => { const dx = X - px, dz = Z - pz, c = Math.cos(a), s = Math.sin(a), p = Math.max(Math.abs(dx * c - dz * s), Math.abs(dx * s + dz * c)) * 1.18 + Math.hypot(dx, dz) * 0.15;   // 4-face pyramid, soft edges
      const t = Math.max(0, 1 - p / R); if (!t) return 0; const g = 1 - Math.abs(fbm(X * 0.011, Z * 0.011, sd + 73, 4) * 2 - 1);   // g = gully/rib pattern (ridged noise)
      return H * Math.pow(t, 1.25) * (0.86 + 0.28 * fbm(X * 0.006, Z * 0.006, sd + 71, 4)) - H * 0.09 * g * g * Math.sqrt(t) * (1 - t * t); };   // carved ribs + couloirs on the faces, sharp summit
    const pk = [[hx + E * 0.68, -E * 0.08, E * 0.42, Math.min(1150, E * 0.5), 0.5]];   // dominant peak (x, z, radius, height, turn)
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + hsh(i, sd + 81) * 0.6, r = E * (0.62 + hsh(i, sd + 82) * 0.3); pk.push([Math.cos(a) * r * 1.1, Math.sin(a) * r, E * (0.22 + hsh(i, sd + 83) * 0.12), Math.min(800, E * (0.24 + hsh(i, sd + 84) * 0.14)), hsh(i, sd + 85) * 3]); }
    each((k, X, Z) => {
      const ex = Math.max(0, Math.abs(X) - hx), zr = rz(X), bank = Z > 0 ? Math.max(0, Z - zr - 70) : Math.max(0, -Z - hz - 60),   // wall start: past the river (+Z) / map edge (-Z)
        ridge = 1 - Math.abs(fbm(X * 0.0035, Z * 0.0035, sd + 5, 5) * 2 - 1),
        wall = sst(0, 650, bank) * (230 + 230 * ridge) + sst(0, 120, bank) * (fbm(X * 0.02, Z * 0.02, sd + 9, 3) - 0.4) * 30,
        floor = 1.2 + sst(0, E, ex) * 70 + (fbm(X * 0.012, Z * 0.012, sd + 6, 3) - 0.5) * 3 * sst(0, 40, out(X, Z));
      let y = floor + wall; for (const P of pk) y = Math.max(y, pyr(X, Z, P[0], P[1], P[2], P[3], P[4]));
      const dr = Math.abs(Z - zr) - 14 - 6 * fbm(X * 0.01, 1, sd + 12);   // river channel (only past the map, never inside it)
      if (out(X, Z) > 8 && dr < 34) y = Math.min(y, dr < 0 ? sea - 1.2 - Math.min(2.5, -dr * 0.25) : sea + 0.3 + dr * 0.09 + (dr > 12 ? (dr - 12) * 0.05 : 0));
      B.hg[k] = y; const e = out(X, Z), tk = fbm(X * 0.009, Z * 0.009, sd + 301, 3), sl = sst(10, 30, y) * (1 - sst(260, 340, y));   // trees: lower slopes, thin out up high
      if (e > 15 && y > sea + 2 && tk > 0.47 && (sl > 0.2 || (y < 12 && tk > 0.62))) B.tr[k] = Math.min(255, (tk - 0.42) * 2.4 * 255 * Math.max(0.35, sl) | 0);
      else if (e > 25 && y > sea + 1 && y < 14 && vn(X * 0.012, Z * 0.018, sd + 94) > 0.58) B.sf[k] = 3; });   // meadow / field patches on the floor
    for (let i = 0; i < 10; i++) { const X = (hsh(i, sd + 50) * 2 - 1) * (hx + 400), Z = rz(X) + (hsh(i, sd + 51) - 0.5) * 30; if (Math.abs(X) < hx + 20) continue;   // boulders in the river
      B.st.push({ x: X + hx, z: Z + hz, r: 2 + hsh(i, sd + 52) * 3, h: 1.5 + hsh(i, sd + 53) * 2.5 }); }
  } else { B.hg.fill(0); }
  return B;
}
// shared auto-surface rule (editor preview; the game adds noise / strata on top)
export function bdAuto(B, y, slope) { if (slope > 1.0) return 4; if (B.sea != null && y < B.sea + 1.4) return 5; if (y > (B.snow != null ? +B.snow : 110) + 10) return 7; return 1; }
// tree positions from the density grid → flat [x, z, scale, …] (map coords) • yAt(x,z) = shown height • same rule in js/67-coast.js bdGridSrc.trees
export function bdTreePts(B, M, yAt, cap) {
  const P = [], sea = B.sea != null ? B.sea : -1e9, nt = Math.min(32, Math.max(2, Math.round(2 * (B.c / 5) * (B.c / 5))));   // same tries per cell as the game (js/67-coast.js)
  let ex = 0; for (let k = 0; k < B.tr.length; k++) ex += B.tr[k]; const kp = Math.min(1, cap / Math.max(1, ex / 255 * 0.8 * nt));   // over the cap: thin evenly (not first rows only)
  for (let j = 0; j < B.ny && P.length < cap * 3; j++) for (let i = 0; i < B.nx; i++) { const k = j * B.nx + i, t = B.tr[k]; if (!t) continue;
    for (let q = 0; q < nt; q++) { const id = nt === 2 ? k * 2 + q : k * 64 + q; if (hsh(id, 991) >= t / 255 * 0.8 * kp) continue;
      const x = B.x0 + (i + hsh(id, 992) - 0.5) * B.c, z = B.z0 + (j + hsh(id, 994) - 0.5) * B.c; if (bdOut(M, x, z) < 8) continue;
      const y = yAt(x, z); if (y < sea + 0.8) continue; if (Math.max(Math.abs(yAt(x + 2, z) - yAt(x - 2, z)), Math.abs(yAt(x, z + 2) - yAt(x, z - 2))) / 4 > 1.1) continue;
      P.push(+x.toFixed(2), +z.toFixed(2), +(0.9 + hsh(id, 993) * 0.9).toFixed(2)); if (P.length >= cap * 3) break; } }
  return P;
}
