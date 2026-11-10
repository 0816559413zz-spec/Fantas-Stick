// Map Editor — 3D view (mapedit.html, ปุ่ม "2D + 3D" / "3D"). Live blockout of the map being edited in mapedit/editor.js.
// Reads the map through window.__mapedit (M, mver, hlCells, pDown/pMove/pUp …) — no data of its own, nothing is saved from here.
// World: X = map x * cell (east), Z = map y * cell (south), Y = up (level * lvl). North (top of the 2D map) = -Z.
// Mouse: left = current editor tool (Shift = secondary, like right-click in 2D) • right-drag = orbit • middle-drag = pan • wheel = zoom.
// Walk mode (🚶): first person, WASD + mouse, follows the ground, blocked by walls and ledges.
import * as THREE from 'three';

const E = window.__mapedit;
const host = document.getElementById('p3d'), cv = document.getElementById('cv3');
const $ = id => document.getElementById(id);
const css = n => getComputedStyle(document.body).getPropertyValue(n).trim();

const WALL_H = [0, 3.5, 1.1, 1.1], WALL_C = [0, '#6e6e78', '#8c8c96', '#a08a60']; // metres / colours of wall kinds 1..3
const SURF_DY = { 6: -0.12, 7: -0.3, 9: -0.1 }; // water / lava sit a little lower (metres)
const PIT = 4; // surface 10 (pit) is drawn this many levels down
const EYE = 1.6;

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(css('--bg0') || '#161616');
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 6000);
scene.add(new THREE.HemisphereLight(0xffffff, 0x50545c, 1.5));
const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);

const gTerrain = new THREE.Group(), gObjs = new THREE.Group(), gLabels = new THREE.Group(), gZones = new THREE.Group(), gRoutes = new THREE.Group(), gOver = new THREE.Group();
scene.add(gTerrain, gObjs, gLabels, gZones, gRoutes, gOver);
const ACC = new THREE.Color(css('--acc') || '#4a8cff');

const opt = { labels: 1, zones: 1, routes: 1, shadow: 1 };
try { Object.assign(opt, JSON.parse(localStorage.getItem('fs_map3d_opt') || '{}')); } catch (e) { }

// ---------- shared geometry / materials ----------
const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 14).translate(0, 0.5, 0),
  cone: new THREE.ConeGeometry(0.5, 1, 12).translate(0, 0.5, 0),
  roof: new THREE.ConeGeometry(0.7072, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0),
  sph: new THREE.SphereGeometry(0.5, 14, 10),
  octa: new THREE.OctahedronGeometry(0.5),
  rock: new THREE.DodecahedronGeometry(0.5),
  torus: new THREE.TorusGeometry(0.5, 0.07, 8, 20),
};
const mats = new Map();
function mat(col, op = 1, glow = 0) {
  const k = col + '|' + op + '|' + glow; let m = mats.get(k);
  if (!m) { m = glow ? new THREE.MeshBasicMaterial({ color: col }) : new THREE.MeshLambertMaterial({ color: col }); if (op < 1) { m.transparent = true; m.opacity = op; m.depthWrite = false; } mats.set(k, m); }
  return m;
}
function part(g, geo, col, sx, sy, sz, x = 0, y = 0, z = 0, op = 1, glow = 0) {
  const m = new THREE.Mesh(GEO[geo], mat(col, op, glow)); m.scale.set(sx, sy, sz); m.position.set(x, y, z);
  m.castShadow = op === 1 && !glow; m.receiveShadow = !glow; g.add(m); return m;
}
const labelTex = new Map();
function label(text, col, x, y, z, big) {
  const k = text + '|' + col; let t = labelTex.get(k);
  if (!t) {
    const c = document.createElement('canvas'), g = c.getContext('2d'), F = '600 30px "Segoe UI","Noto Sans Thai",Tahoma,sans-serif';
    g.font = F; c.width = Math.ceil(g.measureText(text).width) + 28; c.height = 48;
    g.fillStyle = 'rgba(22,22,22,.82)'; g.beginPath(); g.roundRect(0, 0, c.width, c.height, 8); g.fill();
    g.fillStyle = col; g.fillRect(0, 0, 6, c.height);
    g.font = F; g.fillStyle = '#f0f0f0'; g.textBaseline = 'middle'; g.fillText(text, 16, 25);
    t = { tex: new THREE.CanvasTexture(c), asp: c.width / c.height }; t.tex.colorSpace = THREE.SRGBColorSpace; labelTex.set(k, t);
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t.tex, depthTest: false, sizeAttenuation: false, transparent: true }));
  const h = big ? 0.034 : 0.027; s.scale.set(h * t.asp, h, 1); s.position.set(x, y, z); s.renderOrder = 10; gLabels.add(s);
}
let tmp = []; // per-rebuild geometries / materials to dispose
function clear(g) { while (g.children.length) g.remove(g.children[0]); }

// ---------- map data helpers ----------
let M = null, CH = null, yMin = 0, yMax = 0; // CH = corner heights (metres) per cell: nw, ne, se, sw
function calcCorners() {
  const W = M.w, H = M.h, L = M.lvl; CH = new Float32Array(W * H * 4); yMin = 1e9; yMax = -1e9;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const s = M.surf[y][x], hv = M.height[y][x], i = (y * W + x) * 4; let h = hv * L;
    if (s === 10) h -= PIT * L; else if (SURF_DY[s]) h += SURF_DY[s];
    CH[i] = CH[i + 1] = CH[i + 2] = CH[i + 3] = h;
    const r = M.ramp[y][x];
    if (r) {
      const d = E.DIRS[r], nx = x + d[0], ny = y + d[1];
      if (nx >= 0 && ny >= 0 && nx < W && ny < H && M.height[ny][nx] === hv + 1) { // only a working ramp slopes (same rule as the editor)
        if (r === 1) { CH[i] += L; CH[i + 1] += L; } else if (r === 2) { CH[i + 1] += L; CH[i + 2] += L; } else if (r === 3) { CH[i + 2] += L; CH[i + 3] += L; } else { CH[i + 3] += L; CH[i] += L; }
      }
    }
    yMin = Math.min(yMin, h); yMax = Math.max(yMax, CH[i], CH[i + 1], CH[i + 2], CH[i + 3]);
  }
}
const inb = (x, y) => x >= 0 && y >= 0 && x < M.w && y < M.h;
function groundAt(fx, fy) { // metres, bilinear inside the cell (so ramps are smooth)
  const x = Math.min(M.w - 1, Math.max(0, Math.floor(fx))), y = Math.min(M.h - 1, Math.max(0, Math.floor(fy))), i = (y * M.w + x) * 4;
  const u = Math.min(1, Math.max(0, fx - x)), v = Math.min(1, Math.max(0, fy - y));
  return (CH[i] * (1 - u) + CH[i + 1] * u) * (1 - v) + (CH[i + 3] * (1 - u) + CH[i + 2] * u) * v;
}
function cellTop(x, y) { const i = (y * M.w + x) * 4; return Math.max(CH[i], CH[i + 1], CH[i + 2], CH[i + 3]); }

// ---------- terrain mesh (ground + cliffs + ramps + walls + tall bush) ----------
let terrain = null;
function buildTerrain() {
  const W = M.w, H = M.h, c = M.cell, P = [], N = [], C = [], base = yMin - Math.max(1, M.lvl);
  const col = E.SURF.map(s => new THREE.Color(s.c)), wcol = WALL_C.map(v => v ? new THREE.Color(v) : null), bush = new THREE.Color('#345f2c');
  // quad a,b,c,d (any winding) facing roughly (nx,ny,nz)
  function quad(ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz, nx, ny, nz, r, g, b) {
    let fx = (cy - ay) * (dz - bz) - (cz - az) * (dy - by), fy = (cz - az) * (dx - bx) - (cx - ax) * (dz - bz), fz = (cx - ax) * (dy - by) - (cy - ay) * (dx - bx);
    const flip = fx * nx + fy * ny + fz * nz < 0, l = Math.hypot(fx, fy, fz) || 1, s = flip ? -1 / l : 1 / l; fx *= s; fy *= s; fz *= s;
    if (flip) P.push(ax, ay, az, cx, cy, cz, bx, by, bz, ax, ay, az, dx, dy, dz, cx, cy, cz); else P.push(ax, ay, az, bx, by, bz, cx, cy, cz, ax, ay, az, cx, cy, cz, dx, dy, dz);
    for (let i = 0; i < 6; i++) { N.push(fx, fy, fz); C.push(r, g, b); }
  }
  function side(x1, z1, t1, x2, z2, t2, b1, b2, nx, nz, r, g, b) {
    b1 = Math.min(t1, b1); b2 = Math.min(t2, b2); if (t1 - b1 < 1e-4 && t2 - b2 < 1e-4) return;
    quad(x1, t1, z1, x2, t2, z2, x2, b2, z2, x1, b1, z1, nx, 0, nz, r, g, b);
  }
  function box(x0, y0, z0, x1, y1, z1, k) {
    const r = k.r, g = k.g, b = k.b;
    quad(x0, y1, z0, x0, y1, z1, x1, y1, z1, x1, y1, z0, 0, 1, 0, r, g, b);
    quad(x0, y1, z0, x1, y1, z0, x1, y0, z0, x0, y0, z0, 0, 0, -1, r, g, b); quad(x0, y1, z1, x1, y1, z1, x1, y0, z1, x0, y0, z1, 0, 0, 1, r, g, b);
    quad(x0, y1, z0, x0, y1, z1, x0, y0, z1, x0, y0, z0, -1, 0, 0, r, g, b); quad(x1, y1, z0, x1, y1, z1, x1, y0, z1, x1, y0, z0, 1, 0, 0, r, g, b);
  }
  const ch = (x, y, k) => inb(x, y) ? CH[(y * W + x) * 4 + k] : base;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, s = M.surf[y][x], k = col[s] || col[0], f = (x + y) & 1 ? 0.93 : 1, r = k.r * f, g = k.g * f, b = k.b * f;
    const X0 = x * c, X1 = X0 + c, Z0 = y * c, Z1 = Z0 + c, a = CH[i], bb = CH[i + 1], cc = CH[i + 2], d = CH[i + 3];
    quad(X0, a, Z0, X0, d, Z1, X1, cc, Z1, X1, bb, Z0, 0, 1, 0, r, g, b);
    const sr = r * 0.6, sg = g * 0.6, sb = b * 0.6;
    side(X0, Z0, a, X1, Z0, bb, ch(x, y - 1, 3), ch(x, y - 1, 2), 0, -1, sr, sg, sb);
    side(X1, Z0, bb, X1, Z1, cc, ch(x + 1, y, 0), ch(x + 1, y, 3), 1, 0, sr, sg, sb);
    side(X1, Z1, cc, X0, Z1, d, ch(x, y + 1, 1), ch(x, y + 1, 0), 0, 1, sr, sg, sb);
    side(X0, Z1, d, X0, Z0, a, ch(x - 1, y, 2), ch(x - 1, y, 1), -1, 0, sr, sg, sb);
    const top = Math.max(a, bb, cc, d), w = M.wall[y][x];
    if (w) {
      let ix = 0, iz = 0;
      if (w === 3) { // fence: thin, joins neighbouring wall cells
        const lr = (inb(x - 1, y) && M.wall[y][x - 1]) || (inb(x + 1, y) && M.wall[y][x + 1]), ud = (inb(x, y - 1) && M.wall[y - 1][x]) || (inb(x, y + 1) && M.wall[y + 1][x]);
        if (!lr || ud) ix = c * 0.4; if (!ud || lr) iz = c * 0.4; if (lr && ud) { ix = iz = c * 0.4; box(X0, top, Z0 + c * 0.4, X1, top + WALL_H[3], Z1 - c * 0.4, wcol[3]); ix = c * 0.4; iz = 0; }
      }
      box(X0 + ix, Math.min(a, bb, cc, d), Z0 + iz, X1 - ix, top + WALL_H[w], Z1 - iz, wcol[w]);
    } else if (s === 11) box(X0 + c * 0.1, top, Z0 + c * 0.1, X1 - c * 0.1, top + 0.9, Z1 - c * 0.1, bush);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  if (terrain) { gTerrain.remove(terrain); terrain.geometry.dispose(); }
  terrain = new THREE.Mesh(g, terrainMat); terrain.castShadow = terrain.receiveShadow = true; gTerrain.add(terrain);
}
const terrainMat = new THREE.MeshLambertMaterial({ vertexColors: true });

// ---------- objects ----------
function buildObj(o) {
  const d = E.OBJ[o.t] || E.OBJ.custom, c = M.cell, W = o.w * c, D = o.h * c, S = Math.min(W, D), col = d[6], g = new THREE.Group();
  const cx = o.x + o.w / 2, cy = o.y + o.h / 2, gy = o.lv != null ? o.lv * M.lvl : groundAt(cx, cy);
  let top = 2;
  switch (o.t) {
    case 'spawnA': case 'spawnB':
      part(g, 'box', col, W, 0.08, D, 0, 0, 0, 0.5); part(g, 'cyl', col, 0.45, 1.35, 0.45); part(g, 'sph', col, 0.34, 0.34, 0.34, 0, 1.55, 0); break; // the figure = a 1.75 m person, for scale
    case 'core': part(g, 'cyl', '#55555f', S * 0.7, 0.3, S * 0.7); part(g, 'octa', col, S * 0.8, S * 1.1, S * 0.8, 0, 0.5 + S * 0.6, 0, 1, 1); top = 1.2 + S; break;
    case 'point': part(g, 'cyl', col, S, 0.06, S, 0, 0, 0, 0.45); part(g, 'cyl', '#d0d0d0', 0.1, 3.4, 0.1); part(g, 'box', col, 1, 0.6, 0.05, 0.5, 2.8, 0); top = 3.6; break;
    case 'pickup': part(g, 'sph', col, 0.55, 0.55, 0.55, 0, 0.8, 0, 1, 1); top = 1.3; break;
    case 'view': part(g, 'cyl', '#888888', 0.06, 1.6, 0.06); part(g, 'sph', col, 0.3, 0.3, 0.3, 0, 1.6, 0, 1, 1); break;
    case 'pillar': part(g, 'cyl', col, S * 0.8, 4, S * 0.8); top = 4.2; break;
    case 'crate': part(g, 'box', col, W * 0.9, Math.min(S * 0.9, 1.2), D * 0.9); top = 1.4; break;
    case 'tree': part(g, 'cyl', '#6b4a2e', 0.36, 2.2, 0.36); part(g, 'cone', col, 2.8, 3.6, 2.8, 0, 1.7, 0); top = 5.4; break;
    case 'bush': part(g, 'sph', col, W, 1.3, D, 0, 0.45, 0); top = 1.4; break;
    case 'rock': part(g, 'rock', col, W, S * 0.7, D, 0, S * 0.25, 0); top = S * 0.7 + 0.3; break;
    case 'building': part(g, 'box', col, W, 4, D); part(g, 'roof', '#5a4038', W + 0.4, 1.8, D + 0.4, 0, 4, 0); top = 6; break;
    case 'tower': part(g, 'box', col, W, 9, D); part(g, 'box', col, W + 0.5, 0.8, D + 0.5, 0, 9, 0); top = 10; break;
    case 'bridge': part(g, 'box', col, W, 0.25, D, 0, -0.25, 0); top = 0.8; break;
    case 'drawbridge': part(g, 'box', col, W, 0.2, D, 0, 0.02, 0, 0.7); top = 0.8; break;
    case 'lift': part(g, 'box', col, W * 0.9, 0.15, D * 0.9, 0, 0.02, 0); top = 0.8; break;
    case 'torch': part(g, 'cyl', '#555555', 0.1, 1.8, 0.1); part(g, 'sph', col, 0.34, 0.4, 0.34, 0, 1.95, 0, 1, 1); top = 2.4; break;
    case 'statue': part(g, 'box', '#77777f', 0.8, 0.5, 0.8); part(g, 'cyl', col, 0.45, 1.5, 0.45, 0, 0.5, 0); part(g, 'sph', col, 0.4, 0.4, 0.4, 0, 2.2, 0); top = 2.6; break;
    case 'deco': part(g, 'box', col, 0.5, 0.5, 0.5); top = 0.9; break;
    case 'breakwall': part(g, 'box', col, W, 3, D); top = 3.2; break;
    case 'gate': part(g, 'box', col, W, 3.2, D, 0, 0, 0, 0.75); part(g, 'box', '#6a5a2a', W, 0.3, D, 0, 3.2, 0); top = 3.7; break;
    case 'lever': part(g, 'box', '#555555', 0.4, 0.2, 0.4); part(g, 'cyl', col, 0.09, 0.9, 0.09).rotation.z = 0.5; top = 1.2; break;
    case 'plate': part(g, 'box', col, W * 0.8, 0.07, D * 0.8); top = 0.6; break;
    case 'jumppad': part(g, 'cyl', col, S * 0.85, 0.14, S * 0.85); part(g, 'cone', col, S * 0.4, 0.5, S * 0.4, 0, 0.3, 0, 1, 1); top = 1.1; break;
    case 'portal': part(g, 'torus', col, 1.6, 1.6, 1.6, 0, 1.1, 0, 1, 1); top = 2.2; break;
    case 'barrel': part(g, 'cyl', col, 0.78, 1.05, 0.78); top = 1.3; break;
    case 'climb': part(g, 'box', col, 0.6, 3.5, 0.14); top = 3.7; break;
    case 'elem': part(g, 'cyl', col, S * 0.9, 0.05, S * 0.9, 0, 0, 0, 0.4); part(g, 'octa', col, S * 0.45, S * 0.45, S * 0.45, 0, 1, 0, 1, 1); top = 1.6; break;
    case 'trap': part(g, 'box', col, W * 0.9, 0.05, D * 0.9); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) part(g, 'cone', col, 0.18, 0.4, 0.18, a * W * 0.22, 0.05, b * D * 0.22); top = 0.8; break;
    default: part(g, 'box', col, W * 0.8, 1, D * 0.8); top = 1.3;
  }
  g.position.set(cx * c, gy, cy * c); g.userData.oid = o.id; g.userData.top = top; gObjs.add(g);
  if (o.lb || d[2] !== 'build') label(o.lb || d[0], col, cx * c, gy + top + 0.5, cy * c, d[2] === 'sys');
}
function rectY(x, y, w, h) { let lo = 1e9, hi = -1e9; for (let yy = Math.max(0, y); yy < Math.min(M.h, y + h); yy++) for (let xx = Math.max(0, x); xx < Math.min(M.w, x + w); xx++) { const i = (yy * M.w + xx) * 4; lo = Math.min(lo, CH[i]); hi = Math.max(hi, cellTop(xx, yy)); } return lo > hi ? [0, 0] : [lo, hi]; }
function buildZone(z) {
  const c = M.cell, [lo, hi] = rectY(z.x, z.y, z.w, z.h), y0 = lo, y1 = hi + 1.6, X0 = z.x * c, X1 = (z.x + z.w) * c, Z0 = z.y * c, Z1 = (z.y + z.h) * c;
  const P = []; for (const [ax, az, bx, bz] of [[X0, Z0, X1, Z0], [X1, Z0, X1, Z1], [X1, Z1, X0, Z1], [X0, Z1, X0, Z0]]) P.push(ax, y0, az, bx, y0, bz, bx, y1, bz, ax, y0, az, bx, y1, bz, ax, y1, az);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  const m = new THREE.MeshBasicMaterial({ color: z.col, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false });
  const L = new THREE.BufferGeometry(); L.setAttribute('position', new THREE.Float32BufferAttribute([X0, y1, Z0, X1, y1, Z0, X1, y1, Z1, X0, y1, Z1], 3));
  const lm = new THREE.LineBasicMaterial({ color: z.col });
  gZones.add(new THREE.Mesh(g, m), new THREE.LineLoop(L, lm)); tmp.push(g, m, L, lm);
  if (opt.labels) label(z.name || 'โซน', z.col, (X0 + X1) / 2, y1 + 0.6, (Z0 + Z1) / 2, true);
}
function buildRoute(rt) {
  if (!rt.pts || rt.pts.length < 2) return; const c = M.cell, pts = [];
  for (let i = 1; i < rt.pts.length; i++) {
    const a = rt.pts[i - 1], b = rt.pts[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2));
    for (let k = i === 1 ? 0 : 1; k <= n; k++) { const fx = a[0] + (b[0] - a[0]) * k / n, fy = a[1] + (b[1] - a[1]) * k / n; pts.push(new THREE.Vector3(fx * c, groundAt(fx, fy) + 0.3, fy * c)); }
  }
  const col = (E.ROUTE[rt.kind] || E.ROUTE.other)[1], g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05), pts.length * 2, 0.11, 5), m = mat(col, 1, 1);
  gRoutes.add(new THREE.Mesh(g, m)); tmp.push(g);
  const e = pts[pts.length - 1], p = pts[pts.length - 2], h = new THREE.Mesh(GEO.cone, m); h.scale.set(0.6, 0.9, 0.6); h.position.copy(e);
  h.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), e.clone().sub(p).normalize()); gRoutes.add(h);
  if (opt.labels && rt.name && rt.name !== (E.ROUTE[rt.kind] || E.ROUTE.other)[0]) label(rt.name, col, pts[0].x, pts[0].y + 1.2, pts[0].z);
}

// ---------- rebuild ----------
let lastM = null, lastVer = -1, lastKey = '';
function rebuild() {
  M = E.M; lastM = M; lastVer = E.mver; if (!M) return;
  calcCorners(); buildTerrain();
  for (const o of tmp) o.dispose(); tmp = [];
  for (const s of gLabels.children) s.material.dispose();
  clear(gObjs); clear(gLabels); clear(gZones); clear(gRoutes);
  for (const o of M.objs) buildObj(o);
  if (opt.zones) for (const z of M.zones) buildZone(z);
  if (opt.routes) for (const r of M.routes) buildRoute(r);
  if (opt.labels) for (const n of M.notes) if (n.text) label('✎ ' + (n.text.length > 34 ? n.text.slice(0, 33) + '…' : n.text), '#dedede', n.x * M.cell, groundAt(n.x, n.y) + 1.6, n.y * M.cell);
  gLabels.visible = !!opt.labels;
  const W = M.w * M.cell, D = M.h * M.cell, R = Math.hypot(W, D) / 2 + (yMax - yMin) + 6;
  sun.target.position.set(W / 2, 0, D / 2); sun.position.set(W / 2 - R * 0.45, yMax + R * 0.9, D / 2 + R * 0.55);
  const sc = sun.shadow.camera; sc.left = sc.bottom = -R; sc.right = sc.top = R; sc.near = 1; sc.far = R * 3.2; sc.updateProjectionMatrix();
  sun.castShadow = !!opt.shadow;
  const key = M.id + '|' + M.w + '|' + M.h + '|' + M.cell; if (key !== lastKey) { lastKey = key; fit(); }
}

// ---------- overlays: brush / shape preview, selection ----------
const hlMat = new THREE.MeshBasicMaterial({ color: ACC, transparent: true, opacity: 0.38, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
const hlMesh = new THREE.Mesh(new THREE.BufferGeometry(), hlMat); hlMesh.renderOrder = 5; hlMesh.frustumCulled = false; gOver.add(hlMesh);
const selBox = new THREE.Box3Helper(new THREE.Box3(), ACC); selBox.material.depthTest = false; selBox.renderOrder = 6; gOver.add(selBox);
function updOverlay() {
  const cells = walking ? [] : E.hlCells(), c = M.cell, P = [];
  for (let n = 0; n < cells.length && n < 6000; n++) {
    const x = cells[n][0], y = cells[n][1]; if (!inb(x, y)) continue;
    const i = (y * M.w + x) * 4, e = 0.05, X0 = x * c, X1 = X0 + c, Z0 = y * c, Z1 = Z0 + c;
    P.push(X0, CH[i] + e, Z0, X0, CH[i + 3] + e, Z1, X1, CH[i + 2] + e, Z1, X0, CH[i] + e, Z0, X1, CH[i + 2] + e, Z1, X1, CH[i + 1] + e, Z0);
  }
  hlMesh.geometry.dispose(); hlMesh.geometry = new THREE.BufferGeometry(); hlMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  const s = E.sel, it = s && (s.k === 'obj' || s.k === 'zone') ? E.getSel() : null;
  selBox.visible = !!it;
  if (it) { const [lo, hi] = rectY(it.x, it.y, it.w, it.h), g = s.k === 'obj' && gObjs.children.find(o => o.userData.oid === it.id), y0 = g ? g.position.y : lo, y1 = g ? y0 + g.userData.top : hi + 1.6; selBox.box.set(new THREE.Vector3(it.x * c, y0 - 0.05, it.y * c), new THREE.Vector3((it.x + it.w) * c, y1, (it.y + it.h) * c)); }
}

// ---------- orbit camera ----------
const cam = { t: new THREE.Vector3(), yaw: 0, pitch: 0.9, dist: 60, moved: 0 }; // moved = the user took the camera (until then a pane resize re-fits)
function fit(top) {
  if (!M) return; const W = M.w * M.cell, D = M.h * M.cell, asp = camera.aspect || 1.6, half = Math.tan(camera.fov * Math.PI / 360);
  cam.t.set(W / 2, (yMin + yMax) / 2, D / 2); cam.yaw = 0; cam.moved = 0; cam.pitch = top ? 1.5533 : 0.87;
  cam.dist = Math.max(W / (2 * half * asp), (top ? D : D * Math.sin(cam.pitch) + 8) / (2 * half)) * 1.12 + 4; req();
}
function applyCam() {
  const cp = Math.cos(cam.pitch);
  camera.position.set(cam.t.x + cam.dist * cp * Math.sin(cam.yaw), cam.t.y + cam.dist * Math.sin(cam.pitch), cam.t.z + cam.dist * cp * Math.cos(cam.yaw));
  camera.rotation.set(0, 0, 0); camera.lookAt(cam.t);
}

// ---------- picking ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(), v3 = new THREE.Vector3();
function setRay(e) { const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera); }
const mkCell = (fx, fy, y) => ({ px: 0, py: 0, fx, fy, cx: Math.floor(fx), cy: Math.floor(fy), y });
function pickCell(e, withObjs) { // → editor cell under the mouse (null = sky)
  if (!M || !terrain) return null; setRay(e);
  const h = ray.intersectObjects(withObjs ? [terrain, gObjs] : [terrain], true)[0]; if (!h) return null;
  if (h.object !== terrain) { let g = h.object; while (g && !g.userData.oid) g = g.parent; const o = g && M.objs.find(v => v.id === g.userData.oid); if (o) return mkCell(o.x + o.w / 2, o.y + o.h / 2, h.point.y); }
  const n = h.face ? h.face.normal : v3.set(0, 1, 0), p = h.point; // step a hair into the surface so a cliff / wall side picks the cell it belongs to
  return mkCell((p.x - n.x * 0.02) / M.cell, (p.z - n.z * 0.02) / M.cell, p.y);
}
function planeCell(e, y) { setRay(e); plane.set(v3.set(0, 1, 0), -y); const p = ray.ray.intersectPlane(plane, new THREE.Vector3()); return p ? mkCell(p.x / M.cell, p.z / M.cell, y) : null; }

// ---------- mouse ----------
let drag = null;
const ev3 = e => ({ button: 0, sec: e.shiftKey, altKey: e.altKey, v3d: 1 });
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('pointerdown', e => {
  if (!M || walking) return; e.preventDefault(); cv.focus(); cv.setPointerCapture(e.pointerId);
  const d = { sx: e.clientX, sy: e.clientY, yaw: cam.yaw, pitch: cam.pitch, t: cam.t.clone() };
  if (e.button === 1) d.mode = 'pan';
  else if (e.button === 2) d.mode = 'orbit';
  else { const c = pickCell(e, E.tool === 'select'); if (c && E.pDown(ev3(e), c) !== false) { d.mode = 'tool'; d.y = c.y; } else d.mode = 'orbit'; }
  if (d.mode !== 'tool') cam.moved = 1;
  drag = d; req();
});
cv.addEventListener('pointermove', e => {
  if (!M || walking) return; const d = drag;
  if (!d) { const c = pickCell(e, false); c ? E.pMove(ev3(e), c) : E.leave(); return; }
  const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
  if (d.mode === 'orbit') { cam.yaw = d.yaw - dx * 0.006; cam.pitch = Math.min(1.5533, Math.max(0.06, d.pitch + dy * 0.006)); }
  else if (d.mode === 'pan') {
    const k = cam.dist * 0.0016, s = Math.sin(cam.yaw), c = Math.cos(cam.yaw);
    cam.t.set(d.t.x - (dx * c + dy * s) * k, d.t.y, d.t.z - (-dx * s + dy * c) * k);
  } else { const c = planeCell(e, d.y); if (c) E.pMove(ev3(e), c); }
  req();
});
function endDrag() { const d = drag; drag = null; if (d && d.mode === 'tool') E.pUp(); req(); }
cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
cv.addEventListener('pointerleave', () => { if (!drag && !walking) E.leave(); });
cv.addEventListener('dblclick', e => { if (walking) return; if (E.tool === 'route') { E.finishRoute(); return; } if (E.tool !== 'select') return; setRay(e); const h = terrain && ray.intersectObject(terrain)[0]; if (h) { cam.t.copy(h.point); req(); } });
cv.addEventListener('wheel', e => {
  e.preventDefault(); if (walking || !M) return;
  const f = Math.exp(e.deltaY * 0.0012), nd = Math.min(4000, Math.max(3, cam.dist * f)), k = nd / cam.dist;
  setRay(e); const h = terrain && ray.intersectObject(terrain)[0]; if (h) cam.t.lerp(h.point, 1 - k); // zoom toward the point under the mouse
  cam.dist = nd; cam.moved = 1; req();
}, { passive: false });

// ---------- walk mode ----------
let walking = false, wk = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, keys: {}, t: 0 };
function canStand(fx, fy, y) { const cx = Math.floor(fx), cy = Math.floor(fy); return inb(cx, cy) && !M.wall[cy][cx] && groundAt(fx, fy) - y <= Math.max(0.5, (M.rules.up || 0) * M.lvl + 0.15); }
function setWalk(on) {
  if (on === walking || !M) return; walking = on; $('v3walk').classList.toggle('on', on); host.classList.toggle('walk', on);
  if (on) {
    const sp = M.objs.find(o => o.t === 'spawnA') || M.objs.find(o => o.t === 'spawnB');
    wk.x = sp ? sp.x + sp.w / 2 : cam.t.x / M.cell; wk.z = sp ? sp.y + sp.h / 2 : cam.t.z / M.cell; wk.y = groundAt(wk.x, wk.z);
    wk.yaw = sp && sp.x > M.w / 2 ? Math.PI / 2 : sp ? -Math.PI / 2 : cam.yaw; wk.pitch = 0; wk.keys = {}; wk.t = performance.now();
    E.leave(); if (cv.requestPointerLock) try { const p = cv.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { }
  } else if (document.pointerLockElement === cv) document.exitPointerLock();
  req();
}
document.addEventListener('pointerlockchange', () => { if (walking && document.pointerLockElement !== cv && wk.locked) setWalk(false); wk.locked = document.pointerLockElement === cv; });
cv.addEventListener('mousemove', e => { if (!walking || !(wk.locked || e.buttons)) return; wk.yaw -= e.movementX * 0.0025; wk.pitch = Math.min(1.5, Math.max(-1.5, wk.pitch - e.movementY * 0.0025)); });
const WKEYS = { w: 'f', arrowup: 'f', s: 'b', arrowdown: 'b', a: 'l', arrowleft: 'l', d: 'r', arrowright: 'r', shift: 'run' };
function wkey(e, down) { // capture phase: while walking the keys must not reach the editor's tool shortcuts
  if (!walking) return; const tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  const k = e.key.toLowerCase(); e.stopImmediatePropagation(); if (!(e.ctrlKey || e.metaKey)) e.preventDefault();
  if (k === 'escape') { if (down) setWalk(false); return; }
  if (WKEYS[k]) wk.keys[WKEYS[k]] = down;
}
addEventListener('keydown', e => wkey(e, true), true); addEventListener('keyup', e => wkey(e, false), true);
function stepWalk() {
  const now = performance.now(), dt = Math.min(0.05, (now - wk.t) / 1000); wk.t = now;
  const K = wk.keys, f = (K.f ? 1 : 0) - (K.b ? 1 : 0), s = (K.r ? 1 : 0) - (K.l ? 1 : 0);
  if (f || s) {
    const sp = (M.rules.speed || 6) * (K.run ? 2 : 1) * dt / M.cell / Math.hypot(f, s), sn = Math.sin(wk.yaw), cs = Math.cos(wk.yaw);
    const dx = (-sn * f + cs * s) * sp, dz = (-cs * f - sn * s) * sp;
    if (canStand(wk.x + dx, wk.z, wk.y)) wk.x += dx; if (canStand(wk.x, wk.z + dz, wk.y)) wk.z += dz;
  }
  const gy = groundAt(wk.x, wk.z); wk.y = gy >= wk.y ? gy : Math.max(gy, wk.y - 14 * dt);
  camera.position.set(wk.x * M.cell, wk.y + EYE, wk.z * M.cell); camera.rotation.order = 'YXZ'; camera.rotation.set(wk.pitch, wk.yaw, 0);
}

// ---------- frame ----------
let raf = 0;
function req() { if (!raf) raf = requestAnimationFrame(frame); }
function frame() {
  raf = 0; if (!host.offsetWidth) return; // hidden (2D-only mode)
  const w = host.clientWidth, h = host.clientHeight, pr = renderer.getPixelRatio();
  if (cv.width !== Math.round(w * pr) || cv.height !== Math.round(h * pr)) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (M && !cam.moved) fit(); }
  if (E.M !== lastM || E.mver !== lastVer) rebuild();
  if (!M) { renderer.render(scene, camera); return; }
  updOverlay();
  gLabels.visible = !!opt.labels && !walking; // labels show through walls: useful from above, noise at eye level
  if (walking) { stepWalk(); req(); } else applyCam();
  renderer.render(scene, camera);
}
new ResizeObserver(req).observe(host);

// ---------- pane UI ----------
$('v3fit').onclick = () => { setWalk(false); fit(); };
$('v3top').onclick = () => { setWalk(false); fit(true); };
$('v3walk').onclick = () => setWalk(!walking);
host.querySelectorAll('[data-o]').forEach(el => {
  el.checked = !!opt[el.dataset.o];
  el.onchange = () => { opt[el.dataset.o] = el.checked ? 1 : 0; try { localStorage.setItem('fs_map3d_opt', JSON.stringify(opt)); } catch (e) { } lastVer = -1; req(); };
});
$('v3msg').textContent = '';

window.Map3D = { req, fit, setWalk, cam, wk, get walking() { return walking; }, renderer, scene, camera, shot: () => { frame(); return cv.toDataURL('image/jpeg', 0.9); } };
req();
