// Map Builder (mapbuild.html) — 3D editor for real game maps. Data model + game export: mapbuild/model.js • format/how-to: guides/MAP-BUILDER.md
// Saves the source to maps/build/<id>.json and exports assets/maps/<id>.json + .glb (+ manifest) through tools/serve.py (/api/mb*).
// Scene: everything lives in `root` (map coords: x east 0..W, z south 0..H, y up); root is shifted so the map centre is the world origin, like the game.
// Mouse: left = current tool • right-drag = orbit • middle-drag / Space+drag = pan • wheel = zoom.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as MD from './model.js';
const { C, SURF, OBJ } = MD;

const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const css = n => getComputedStyle(document.body).getPropertyValue(n).trim();
const el = (tag, props, ...kids) => { const e = document.createElement(tag); if (props) for (const k in props) { if (k === 'class') e.className = props[k]; else if (k === 'html') e.innerHTML = props[k]; else if (k.startsWith('on')) e.addEventListener(k.slice(2), props[k]); else if (k === 'style') e.style.cssText = props[k]; else e[k] = props[k]; } for (const c of kids) if (c != null) e.append(c); return e; };

// ================= state =================
let M = null, online = false, dirty = false, saveT = 0, list = [];
let tool = 'select', sel = null;   // sel = {k:'wall'|'floor'|'obj', id, pt?}
const opt = { smode: 'up', rad: 4, str: 4, soft: 1, hval: 2, surf: 0, wall: 0, wth: 1, wh: 3.5, wc: '#8a8478', wm: 'stone', wcurve: 0, wbrk: 0, floor: 0, fw: 4, fh: 3, fauto: 1, obj: 'spawn', cat: 'sys',
  rrot: 1, rscale: 0, dens: 3, snap: 0, part: 'wall', pp: {}, csnap: 1, psnap: 1, prim: { c: '#8a8478', sx: 2, sy: 2, sz: 2 } };
const show = { steep: true, col: false, grid: false, sky: true, area: true };
let undo = [], redo = [];
let hover = null, stroke = null, drag = null, draft = null, ghostRot = 0, spaceDown = false;
const cam = { x: 50, z: 35, dist: 90, yaw: 0, pitch: 0.95 };

// ================= three setup =================
const cv = $('cv'), host = $('view');
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(50, 1, 0.2, 4000);
const hemi = new THREE.HemisphereLight(0xffffff, 0x50545c, 1.4), sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05;
scene.add(hemi, sun, sun.target);
const root = new THREE.Group(); scene.add(root);
const gWalls = new THREE.Group(), gFloors = new THREE.Group(), gObjs = new THREE.Group(), gParts = new THREE.Group(), gHelp = new THREE.Group(), gCol = new THREE.Group();
root.add(gWalls, gFloors, gObjs, gParts, gHelp, gCol);
const ACC = new THREE.Color(css('--acc') || '#4a8cff');
let terr = null, gridLines = null, bounds = null, selBox = null;
const ray = new THREE.Raycaster(), v2 = new THREE.Vector2(), v3 = new THREE.Vector3();

const matCache = new Map();
function mat(c, o = {}) {   // shared material per colour (few materials = few draw calls in the game after batching)
  const k = c + '|' + (o.name || '') + (o.emit ? 'e' : '');
  let m = matCache.get(k);
  if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.92, metalness: 0, flatShading: true }); m.name = (o.name || 'mb') + '_' + c.replace('#', '');
    if (o.emit) { m.emissive = new THREE.Color(c); m.emissiveIntensity = 1.5; m.name = 'glow_' + m.name; } matCache.set(k, m); }
  return m;
}
const helpMat = (c, op = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: op < 1, opacity: op, depthWrite: op >= 1 });

// ================= terrain mesh =================
const steepCol = new THREE.Color('#e0442a'), tmpC = new THREE.Color(), surfLin = SURF.map(s => new THREE.Color(s.c));
function vcolor(i, j, out, o, overlay) {
  const k = j * M.nx + i, c = surfLin[M.sf[k]] || surfLin[0], n = 0.9 + 0.2 * MD.hash2(i, j) * 0.6 + 0.08 * MD.vnoise(i * 0.11, j * 0.11);
  tmpC.copy(c).multiplyScalar(n);
  if (overlay && MD.slopeAt(M, i, j) > MD.TSLOPE) tmpC.lerp(steepCol, 0.55);
  out[o] = tmpC.r; out[o + 1] = tmpC.g; out[o + 2] = tmpC.b;
}
function vnormal(i, j, out, o) {
  const a = M.hg, nx = M.nx, ny = M.ny, k = j * nx + i, hl = a[i > 0 ? k - 1 : k], hr = a[i < nx - 1 ? k + 1 : k], hu = a[j > 0 ? k - nx : k], hd = a[j < ny - 1 ? k + nx : k];
  const sx = (hl - hr) / ((i > 0 && i < nx - 1 ? 2 : 1) * C), sz = (hu - hd) / ((j > 0 && j < ny - 1 ? 2 : 1) * C), L = Math.hypot(sx, 1, sz);
  out[o] = sx / L; out[o + 1] = 1 / L; out[o + 2] = sz / L;
}
function buildTerrain() {
  if (terr) { root.remove(terr); terr.geometry.dispose(); }
  const { nx, ny } = M, n = nx * ny, pos = new Float32Array(n * 3), idx = new Uint32Array((nx - 1) * (ny - 1) * 6);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const k = (j * nx + i) * 3; pos[k] = i * C; pos[k + 2] = j * C; }
  let q = 0; for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, d = a + nx, e = d + 1; idx[q++] = a; idx[q++] = d; idx[q++] = b; idx[q++] = b; idx[q++] = d; idx[q++] = e; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(M.W / 2, 0, M.H / 2), Math.hypot(M.W, M.H) / 2 + 60);
  terr = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 })); terr.receiveShadow = true; terr.castShadow = true; terr.name = 'ground';
  root.add(terr); root.position.set(-M.W / 2, 0, -M.H / 2);
  updTerrain(0, 0, nx - 1, ny - 1);
  // bounds frame + grid
  if (bounds) gHelp.remove(bounds);
  bounds = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(M.W, 40, M.H)), new THREE.LineBasicMaterial({ color: ACC, transparent: true, opacity: 0.35 }));
  bounds.position.set(M.W / 2, 12, M.H / 2); gHelp.add(bounds);
  buildGrid();
}
function updTerrain(i0, j0, i1, j1) {
  const { nx, ny } = M, g = terr.geometry, P = g.attributes.position, N = g.attributes.normal, Cc = g.attributes.color;
  i0 = clamp(i0 - 1, 0, nx - 1); j0 = clamp(j0 - 1, 0, ny - 1); i1 = clamp(i1 + 1, 0, nx - 1); j1 = clamp(j1 + 1, 0, ny - 1);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * nx + i; P.array[k * 3 + 1] = M.hg[k]; vnormal(i, j, N.array, k * 3); vcolor(i, j, Cc.array, k * 3, show.steep); }
  P.needsUpdate = N.needsUpdate = Cc.needsUpdate = true;
}
function buildGrid() {
  if (gridLines) { gHelp.remove(gridLines); gridLines.geometry.dispose(); gridLines = null; }
  if (!show.grid || !M) return;
  const p = [], step = 5;
  for (let x = 0; x <= M.W; x += step) for (let z = 0; z < M.H; z += 1) p.push(x, MD.gh(M, x, z) + 0.06, z, x, MD.gh(M, x, z + 1) + 0.06, z + 1);
  for (let z = 0; z <= M.H; z += step) for (let x = 0; x < M.W; x += 1) p.push(x, MD.gh(M, x, z) + 0.06, z, x + 1, MD.gh(M, x + 1, z) + 0.06, z);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  gridLines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 })); gHelp.add(gridLines);
}

// ================= walls / floors meshes =================
function tri(P, a, b, c, n) {   // push a triangle so that it faces n
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const d = (uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2];
  if (d >= 0) P.push(...a, ...b, ...c); else P.push(...a, ...c, ...b);
}
const quad = (P, a, b, c, d, n) => { tri(P, a, b, c, n); tri(P, a, c, d, n); };
function wallGeo(w, R) {
  const P = [], hw = w.th / 2, sink = w.base != null ? 0 : 0.8, bh = p => MD.wallBase(M, w, p[0], p[1]);
  for (let i = 0; i < R.length - 1; i++) {
    const a = R[i], b = R[i + 1]; let dx = b[0] - a[0], dz = b[1] - a[1]; const L = Math.hypot(dx, dz); if (L < 1e-5) continue; dx /= L; dz /= L;
    const nx = -dz, nz = dx, ba = bh(a), bb = bh(b), ta = ba + w.h, tb = bb + w.h;
    const aL = [a[0] + nx * hw, a[1] + nz * hw], aR = [a[0] - nx * hw, a[1] - nz * hw], bL = [b[0] + nx * hw, b[1] + nz * hw], bR = [b[0] - nx * hw, b[1] - nz * hw];
    quad(P, [aL[0], ta, aL[1]], [aR[0], ta, aR[1]], [bR[0], tb, bR[1]], [bL[0], tb, bL[1]], [0, 1, 0]);
    quad(P, [aL[0], ba - sink, aL[1]], [bL[0], bb - sink, bL[1]], [bL[0], tb, bL[1]], [aL[0], ta, aL[1]], [nx, 0, nz]);
    quad(P, [aR[0], ba - sink, aR[1]], [bR[0], bb - sink, bR[1]], [bR[0], tb, bR[1]], [aR[0], ta, aR[1]], [-nx, 0, -nz]);
    if (w.base != null) quad(P, [aL[0], ba, aL[1]], [aR[0], ba, aR[1]], [bR[0], bb, bR[1]], [bL[0], bb, bL[1]], [0, -1, 0]);
    if (i === 0) quad(P, [aL[0], ba - sink, aL[1]], [aR[0], ba - sink, aR[1]], [aR[0], ta, aR[1]], [aL[0], ta, aL[1]], [-dx, 0, -dz]);
    if (i === R.length - 2) quad(P, [bL[0], bb - sink, bL[1]], [bR[0], bb - sink, bR[1]], [bR[0], tb, bR[1]], [bL[0], tb, bL[1]], [dx, 0, dz]);
    // round joint where the wall turns (matches the collision circles)
    if (i > 0) { const p = R[i - 1], ax = a[0] - p[0], az = a[1] - p[1], pl = Math.hypot(ax, az) || 1; if ((ax * dx + az * dz) / pl < 0.995) {
      const S = 10; for (let s = 0; s < S; s++) { const t0 = s / S * 6.2832, t1 = (s + 1) / S * 6.2832, x0 = a[0] + Math.cos(t0) * hw, z0 = a[1] + Math.sin(t0) * hw, x1 = a[0] + Math.cos(t1) * hw, z1 = a[1] + Math.sin(t1) * hw;
        quad(P, [x0, ba - sink, z0], [x1, ba - sink, z1], [x1, ta, z1], [x0, ta, z0], [Math.cos((t0 + t1) / 2), 0, Math.sin((t0 + t1) / 2)]);
        tri(P, [a[0], ta, a[1]], [x0, ta, z0], [x1, ta, z1], [0, 1, 0]); } } }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals(); return g;
}
function floorGeo(f) {   // local coords (mesh sits at f.x, 0, f.z and is rotated by f.rot)
  const P = [], hw = f.w / 2, hd = f.d / 2, y2 = f.y2 == null ? f.y : f.y2, th = f.th || 0.4;
  const slab = (z0, z1, t0, t1, b0, b1) => {
    const A = [-hw, t0, z0], B = [hw, t0, z0], Cc = [hw, t1, z1], D = [-hw, t1, z1], a = [-hw, b0, z0], b = [hw, b0, z0], c = [hw, b1, z1], d = [-hw, b1, z1];
    quad(P, A, B, Cc, D, [0, 1, 0]); quad(P, a, b, c, d, [0, -1, 0]); quad(P, A, B, b, a, [0, 0, -1]); quad(P, D, Cc, c, d, [0, 0, 1]); quad(P, A, D, d, a, [-1, 0, 0]); quad(P, B, Cc, c, b, [1, 0, 0]);
  };
  if (f.steps && Math.abs(y2 - f.y) > 0.3) { const n = Math.max(2, Math.round(Math.abs(y2 - f.y) / 0.3));
    for (let i = 0; i < n; i++) { const z0 = -hd + f.d * i / n, z1 = -hd + f.d * (i + 1) / n, h0 = f.y + (y2 - f.y) * i / n, h1 = f.y + (y2 - f.y) * (i + 1) / n, t = y2 > f.y ? h1 : h0; slab(z0, z1, t, t, h0 - th, h1 - th); } }
  else slab(-hd, hd, f.y, y2, f.y - th, y2 - th);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals(); return g;
}
function clearGroup(g) { for (const c of [...g.children]) { g.remove(c); c.traverse(o => { if (o.isMesh && o.userData.own) o.geometry.dispose(); }); } }
// room prefab instances (M.rooms → MD.flatRooms): RM = loaded room maps, RX = their content in map space (rebuilt by syncRooms)
const RM = new Map(); let RX = { walls: [], floors: [], objs: [], parts: [] };
const refOfItem = (it, k) => it.room ? { k: 'room', id: it.room } : { k, id: it.id };   // room content selects the whole instance
async function loadRooms() {
  const need = [...new Set((M.rooms || []).map(r => r.ref))].filter(r => !RM.has(r));
  await Promise.all(need.map(async r => { try { const j = await (await fetch('/api/mb?id=' + r)).json(); if (j.ok) RM.set(r, MD.unpack(j.map)); } catch (e) { } }));
}
function syncRooms() { syncAll(); }
const ALLM = () => MD.withRooms(M, RX);
function syncWalls() {
  clearGroup(gWalls);
  for (const w of M.walls.concat(RX.walls)) MD.wallChunks(w).forEach((R, ci) => { const m = new THREE.Mesh(wallGeo(w, R), mat(w.c || '#8a8478', { name: w.m === 'ice' ? 'ice' : 'wall' })); m.castShadow = m.receiveShadow = true; m.userData = { ref: refOfItem(w, 'wall'), wid: w.id, own: 1, ci }; m.name = 'wall_' + w.id + '_' + ci; if (w.vis === 0) ghostify(m); gWalls.add(m); });
}
function syncFloors() {
  clearGroup(gFloors);
  for (const f of M.floors.concat(RX.floors)) { const m = new THREE.Mesh(floorGeo(f), mat(f.c || '#8a8478', { name: 'floor' })); m.position.set(f.x, 0, f.z); m.rotation.y = f.rot || 0; m.castShadow = m.receiveShadow = true; m.userData = { ref: refOfItem(f, 'floor'), wid: f.id, own: 1 }; m.name = 'floorv_' + f.id; if (f.vis === 0) ghostify(m); gFloors.add(m); }
}

// ================= asset kit =================
const KIT = { list: [], byId: new Map(), files: new Map(), tpl: new Map(), thumbs: new Map() };
const CATS = [['sys', 'จุดเกม'], ['mode', 'โหมดบุกปราสาท'], ['prefab', 'ห้องสำเร็จ (prefab)'], ['room', 'ห้อง / ของพังได้'], ['deco', 'ของตกแต่ง (เกมวาด)'], ['game', 'ของในเกม'], ['prim', 'ทรงพื้นฐาน'], ['tree', 'ต้นไม้'], ['rock', 'หิน'], ['plant', 'พืชเล็ก'], ['build', 'สิ่งก่อสร้าง'], ['prop', 'ของประกอบ'], ['light', 'โคม/ไฟ'], ['fence', 'รั้ว'], ['user', 'เพิ่มเอง']];
const CS_DEF = { tree: 0.22, light: 0.4, plant: 0.6 };
let gltfL = null;
function loader() { if (!gltfL) { gltfL = new GLTFLoader(); const d = new DRACOLoader(); d.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/'); gltfL.setDRACOLoader(d); gltfL.setMeshoptDecoder(MeshoptDecoder); } return gltfL; }
async function loadKit() {
  try { const k = await (await fetch('assets/mapkit/kit.json?t=' + Date.now())).json(); KIT.list = [...(k.assets || []), ...(k.user || [])]; } catch (e) { KIT.list = []; }
  KIT.byId = new Map(KIT.list.map(a => [a.id, a]));
}
const sanit = s => s.replace(/\s/g, '_').replace(/[\[\]\.:\/]/g, '');
function kitTpl(id) {   // → Promise<{obj (template, base centre at origin), ex, ez, h}>
  if (KIT.tpl.has(id)) return KIT.tpl.get(id);
  const a = KIT.byId.get(id);
  const p = !a ? Promise.resolve(null) : (KIT.files.get(a.src) || KIT.files.set(a.src, loader().loadAsync('assets/' + a.src + (a.v ? '?v=' + a.v : ''))).get(a.src)).then(gltf => {
    const src = a.node ? gltf.scene.getObjectByName(sanit(a.node)) || gltf.scene.getObjectByName(a.node) : gltf.scene; if (!src) return null;
    const inner = src.clone(true); inner.position.set(0, 0, 0); if (a.node) inner.rotation.y = 0;
    inner.traverse(o => { o.userData = {}; if (o.isMesh) { o.castShadow = !a.ns; o.receiveShadow = true; } });
    const g = new THREE.Group(); g.add(inner); g.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(g), c = bb.getCenter(new THREE.Vector3());
    inner.position.set(-c.x, -bb.min.y, -c.z);
    return { obj: g, ex: (bb.max.x - bb.min.x) / 2, ez: (bb.max.z - bb.min.z) / 2, h: bb.max.y - bb.min.y };
  }).catch(e => { console.warn('kit', id, e); return null; });
  KIT.tpl.set(id, p); p.then(t => { KIT.tplNow = KIT.tplNow || new Map(); KIT.tplNow.set(id, t); });
  return p;
}
const tplNow = id => KIT.tplNow && KIT.tplNow.get(id);
let thumbR = null, thumbS = null, thumbC = null;
async function thumb(id) {
  if (KIT.thumbs.has(id)) return KIT.thumbs.get(id);
  const t = await kitTpl(id); if (!t) return '';
  if (!thumbR) { thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); thumbR.setSize(96, 96); thumbS = new THREE.Scene(); thumbS.add(new THREE.HemisphereLight(0xffffff, 0x555555, 2.2)); const d = new THREE.DirectionalLight(0xffffff, 2); d.position.set(2, 4, 3); thumbS.add(d); thumbC = new THREE.PerspectiveCamera(30, 1, 0.05, 500); }
  const o = t.obj.clone(true); thumbS.add(o);
  const R = Math.max(t.ex, t.ez, t.h / 2, 0.2) * 1.25, d = R / Math.tan(15 * Math.PI / 180) * 1.05;
  thumbC.position.set(d * 0.62, t.h / 2 + d * 0.42, d * 0.66); thumbC.lookAt(0, t.h / 2, 0);
  thumbR.render(thumbS, thumbC); thumbS.remove(o);
  const u = thumbR.domElement.toDataURL('image/png'); KIT.thumbs.set(id, u); return u;
}

// ================= objects =================
const PRIM = {
  box: () => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), cyl: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 14).translate(0, 0.5, 0),
  cone: () => new THREE.ConeGeometry(0.5, 1, 4).rotateY(Math.PI / 4).scale(1.4142, 1, 1.4142).translate(0, 0.5, 0), ball: () => new THREE.IcosahedronGeometry(0.5, 1).translate(0, 0.42, 0),
  wedge: () => { const P = []; const A = [-.5, 0, -.5], B = [.5, 0, -.5], Cc = [.5, 0, .5], D = [-.5, 0, .5], E = [-.5, 1, .5], F = [.5, 1, .5];
    quad(P, A, B, Cc, D, [0, -1, 0]); quad(P, A, B, F, E, [0, 1, -1]); quad(P, D, Cc, F, E, [0, 0, 1]); tri(P, A, D, E, [-1, 0, 0]); tri(P, B, Cc, F, [1, 0, 0]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals(); return g; },
};
const primGeo = {}; const pg = k => primGeo[k] || (primGeo[k] = PRIM[k]());
const isKit = o => o.t.startsWith('kit:'), kitId = o => o.t.slice(4), isPrim = o => OBJ[o.t] && OBJ[o.t].cat === 'prim';
const isVisual = o => isKit(o) || isPrim(o);   // exported into the .glb (everything else is a marker the game fills in itself)
function dim(o) {   // footprint for collision (model.js objCircles)
  if (isPrim(o)) { const sx = o.sx || 1, sz = o.sz || 1, round = o.t === 'cyl' || o.t === 'ball' || o.t === 'cone'; return { ex: sx / 2, ez: sz / 2, h: (o.sy || 1) * (o.t === 'ball' ? 0.84 : 1), col: o.col == null ? 1 : o.col, brk: 0, m: o.m || 'stone', cs: round ? 0.92 : 1 }; }
  if (isKit(o)) { const a = KIT.byId.get(kitId(o)), t = tplNow(kitId(o)); if (!a || !t) return null; const s = o.s || 1;
    return { ex: t.ex * s, ez: t.ez * s, h: t.h * s, col: o.col == null ? a.col : o.col, brk: a.brk ? 1 : 0, m: a.brk || 'stone', cs: CS_DEF[a.cat] || 0.85 }; }
  return null;
}
function labelSprite(text, c) {   // small always-readable tag (core number, phase number)
  const cv2 = document.createElement('canvas'); cv2.width = 128; cv2.height = 64; const x = cv2.getContext('2d');
  x.fillStyle = 'rgba(10,12,16,.78)'; x.fillRect(0, 0, 128, 64); x.strokeStyle = c; x.lineWidth = 6; x.strokeRect(3, 3, 122, 58);
  x.fillStyle = '#fff'; x.font = 'bold 40px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 64, 34);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv2), depthTest: false, transparent: true })); s.scale.set(2.4, 1.2, 1); s.renderOrder = 9; return s;
}
const noPick = m => { m.raycast = () => {}; return m; };
function areaMesh(o, g, c, h) {   // flat rect (phase) or slab at height (ceiling): see-through, not pickable except the centre handle
  const sx = o.sx || 1, sz = o.sz || 1, box = new THREE.BoxGeometry(sx, 0.25, sz);
  const f = noPick(new THREE.Mesh(box, helpMat(c, 0.13))); f.position.y = h; f.userData.area = 1; g.add(f);
  const e = noPick(new THREE.LineSegments(new THREE.EdgesGeometry(box), new THREE.LineBasicMaterial({ color: c }))); e.position.y = h; e.userData.area = 1; g.add(e);
  const hd = new THREE.Mesh(new THREE.OctahedronGeometry(0.9), helpMat(c)); hd.position.y = h + 0.9; g.add(hd);
}
// decor drawn by the game (dc_*): editor proxy close to the game builder (js/28-fcs-castle.js fcsDecoKit)
function decoMesh(o) {
  const g = new THREE.Group(), t = o.t.slice(3), c = t === 'cloth' ? (o.c || '#7a1418') : MD.DECO_COL[o.k || (t === 'roof' || t === 'cone' ? 'roof' : 'stone')] || '#c2b298';
  const add = (geo, m) => { const me = new THREE.Mesh(geo, m); me.userData.own = 1; me.castShadow = me.receiveShadow = true; g.add(me); return me; };
  if (t === 'box') add(new THREE.BoxGeometry(o.sx || 1, o.sy || 1, o.sz || 1), mat(c));
  else if (t === 'cyl') add(new THREE.CylinderGeometry(o.rt != null ? o.rt : 0.5, o.rb != null ? o.rb : 0.5, o.sy || 1, o.seg || 8), mat(c));
  else if (t === 'cone') { const geo = new THREE.ConeGeometry(o.r != null ? o.r : 0.5, o.sy || 1, o.seg || 8, 1, !!o.open); if (o.ry) geo.rotateY(o.ry); if (o.ssx || o.ssz) geo.scale(o.ssx || 1, 1, o.ssz || 1); const m = add(geo, mat(c)); if (o.open) { m.material = m.material.clone(); m.material.side = THREE.DoubleSide; } }
  else if (t === 'banner') { const geo = new THREE.PlaneGeometry(1.5, 3.8); geo.translate(0, 6 - 0.15 - 1.9 - (o.y || 0) + (o.y || 0), 0.06); const m = add(geo, mat('#9a1c20')); m.material = m.material.clone(); m.material.side = THREE.DoubleSide; }
  else if (t === 'torch') { const geo = new THREE.CylinderGeometry(0.07, 0.05, 0.6, 6); geo.translate(0, 2.55, 0.25); add(geo, mat('#5a3f28')); const f = new THREE.SphereGeometry(0.25, 8, 6); f.translate(0, 3.0, 0.42); add(f, mat('#ffb060', { emit: 1 })); }
  else if (t === 'flag') { const geo = new THREE.PlaneGeometry(2.2, 1.3); geo.translate(1.1, 0, 0); const m = add(geo, mat('#9a1c20')); m.material = m.material.clone(); m.material.side = THREE.DoubleSide; m.rotation.y = -0.6; }
  else if (t === 'post') add(new THREE.SphereGeometry(0.3, 10, 8), mat('#ffb060', { emit: 1 }));
  else if (t === 'roof') { const w = o.sx || 10, d = o.sz || 8, h = o.sy || 4, s = new THREE.Shape(); s.moveTo(-d / 2 - 0.6, 0); s.lineTo(0, h); s.lineTo(d / 2 + 0.6, 0); s.lineTo(-d / 2 - 0.6, 0);
    const geo = new THREE.ExtrudeGeometry(s, { depth: w + 1.2, bevelEnabled: false }); geo.translate(0, 0, -(w + 1.2) / 2); geo.rotateY(Math.PI / 2); add(geo, mat(c)); }
  else if (t === 'flame') add(new THREE.SphereGeometry(0.3, 10, 8), mat('#ffb060', { emit: 1 }));
  else if (t === 'cloth') { const geo = new THREE.PlaneGeometry(o.sx || 2, o.sy || 4); geo.translate(0, -(o.sy || 4) / 2, 0); const m = add(geo, mat(c)); m.material = m.material.clone(); m.material.side = THREE.DoubleSide; }
  else if (t === 'shield') { const geo = new THREE.CylinderGeometry(0.75, 0.75, 0.12, 14); geo.rotateX(Math.PI / 2); add(geo, mat(c)); }
  else if (t === 'chand') { const geo = new THREE.TorusGeometry(2.2, 0.12, 6, 24); geo.rotateX(Math.PI / 2); add(geo, mat('#2b2a2a')); add(new THREE.SphereGeometry(0.4, 8, 6), mat('#ffb36a', { emit: 1 })); }
  return g;
}
const ghostMats = new Map();
function ghostify(g) {   // vis 0 = collision only (not in the .glb): see-through in the editor
  g.traverse(m => { if (!m.isMesh) return; const k = m.material.uuid; let gm = ghostMats.get(k); if (!gm) { gm = m.material.clone(); gm.transparent = true; gm.opacity = 0.22; gm.depthWrite = false; ghostMats.set(k, gm); } m.material = gm; m.castShadow = false; });
  return g;
}
function markerMesh(o) {
  if (MD.isDeco(o.t)) return decoMesh(o);
  const D = OBJ[o.t], g = new THREE.Group(), c = D.c || '#888';
  const add = (geo, m, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); g.add(me); return me; };
  if (o.t === 'core') { const s = o.s || 4; add(new THREE.CylinderGeometry(s / 2, s / 2, 0.2, 24), helpMat(c, 0.5), 0, 0.1, 0); add(new THREE.OctahedronGeometry(s * 0.3), mat(c, { emit: 1 }), 0, 3, 0); const l = labelSprite('แกน ' + (o.n || '?'), c); l.position.y = 5.6; g.add(l); return g; }
  if (o.t === 'sgA' || o.t === 'sgB') { add(new THREE.CylinderGeometry(4, 4, 0.1, 28), helpMat(c, 0.35), 0, 0.06, 0); add(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 6), helpMat(c), 0, 1.3, 0); const l = labelSprite((o.t === 'sgA' ? 'บุก ' : 'รับ ') + (o.ph || 1), c); l.position.y = 3.2; g.add(l); return g; }
  if (o.t === 'phase') { areaMesh(o, g, c, 0.15); const l = labelSprite('เฟส ' + (o.ph || 1), c); l.position.y = 2.6; g.add(l); return g; }
  if (o.t === 'ceil') { areaMesh(o, g, c, 0); return g; }
  if (D.rp) { const R = MD.RPK[D.rp], L = R.L ? Math.max(0.3, o.L || 4) : R.w, w = R.L ? R.w : R.w;
    const b = add(new THREE.BoxGeometry(L, R.h, w), mat(R.col ? c : '#b89a76'), 0, R.h / 2, 0); b.castShadow = true; return g; }
  if (/^spawn|espawn|task/.test(o.t)) { add(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 20), helpMat(c, 0.75), 0, 0.08, 0); add(new THREE.CylinderGeometry(0.06, 0.06, 2.1, 6), helpMat(c), 0, 1.05, 0);
    if (/^spawn/.test(o.t)) { const a = add(new THREE.ConeGeometry(0.35, 0.9, 10), helpMat(c), 0, 0.3, 1.2); a.rotation.x = Math.PI / 2; } else add(new THREE.OctahedronGeometry(0.35), helpMat(c), 0, 2.3, 0); }
  else if (o.t === 'ring') { const r = add(new THREE.TorusGeometry(2, 0.12, 8, 28), helpMat(c), 0, 0, 0); }
  else if (o.t === 'light') { add(new THREE.SphereGeometry(0.28, 12, 8), helpMat(o.c || c), 0, 0, 0); const l = new THREE.PointLight(o.c || c, (o.int == null ? 2.4 : o.int) * 6, o.dist || 14, 1.6); g.add(l); }
  else if (o.t === 'pn_wall') { const L = o.L || 4, H = o.sy || 3, T = o.T || 0.3, b = add(new THREE.BoxGeometry(L, H, T), mat({ brick: '#b0603c', plaster: '#cfc6b4', stone: '#9a9488', wood: '#8a6440', glass: '#bfe4f0', metal: '#7c8288' }[o.mat || 'brick'] || c), 0, H / 2, 0); b.castShadow = true;
    const cs = o.cs || 1, nc = Math.max(1, Math.round(L / cs)), nr = Math.max(1, Math.round(H / cs)), pts = [];
    for (let i = 1; i < nc; i++) { const x = -L / 2 + i * L / nc; pts.push(x, 0, T / 2 + 0.01, x, H, T / 2 + 0.01); } for (let j = 1; j < nr; j++) { const y = j * H / nr; pts.push(-L / 2, y, T / 2 + 0.01, L / 2, y, T / 2 + 0.01); }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#2a2a2a', transparent: true, opacity: 0.45 }))); }
  else if (o.t === 'house') { const b = add(new THREE.BoxGeometry(8, 4.2, 6.5), mat('#b08a5a'), 0, 2.1, 0); b.castShadow = true; const r = add(PRIM.cone(), mat('#7a4a36'), 0, 4.2, 0); r.scale.set(6.2, 2.6, 5); add(new THREE.BoxGeometry(1.2, 2.2, 0.2), helpMat('#3a2a1c'), 0, 1.1, 3.3); }
  else if (o.t === 'ptree' || o.t === 'ppine') { add(new THREE.CylinderGeometry(0.3, 0.45, 3, 8), mat('#6a4a2c'), 0, 1.5, 0).castShadow = true; const top = o.t === 'ptree' ? add(new THREE.IcosahedronGeometry(2.6, 1), mat(c), 0, 5, 0) : add(new THREE.ConeGeometry(2, 5.5, 8), mat(c), 0, 4.6, 0); top.castShadow = true; }
  else if (o.t === 'pbarrel') add(new THREE.CylinderGeometry(0.7, 0.7, 1.6, 12), mat(c), 0, 0.8, 0).castShadow = true;
  else add(new THREE.BoxGeometry(1.5, D.h || 1.4, 1.5), mat(c), 0, (D.h || 1.4) / 2, 0).castShadow = true;
  return g;
}
function polyGeo(o) {   // free-shape part: footprint polygon (local x,z) extruded 0..sy, top shrunk toward the centroid by tp
  const P = o.pts, n = P.length, h = o.sy, tp = o.tp == null ? 1 : o.tp, V = [];
  let cx = 0, cz = 0, A = 0; for (const q of P) { cx += q[0] / n; cz += q[1] / n; }
  for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; A += a[0] * b[1] - b[0] * a[1]; }
  const top = P.map(q => [cx + (q[0] - cx) * tp, cz + (q[1] - cz) * tp]), sg = A >= 0 ? 1 : -1, buf = [];
  for (let i = 0; i < n; i++) { const j = (i + 1) % n, a = P[i], b = P[j], ta = top[i], tb = top[j], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
    quad(buf, [a[0], 0, a[1]], [b[0], 0, b[1]], [tb[0], h, tb[1]], [ta[0], h, ta[1]], [dz / L * sg, 0.3 * (1 - tp), -dx / L * sg]); }
  const tri2 = THREE.ShapeUtils.triangulateShape(P.map(q => new THREE.Vector2(q[0], q[1])), []);
  for (const t of tri2) { const [i, j, k] = t; tri(buf, [top[i][0], h, top[i][1]], [top[j][0], h, top[j][1]], [top[k][0], h, top[k][1]], [0, 1, 0]); tri(buf, [P[i][0], 0, P[i][1]], [P[j][0], 0, P[j][1]], [P[k][0], 0, P[k][1]], [0, -1, 0]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(buf, 3)); g.computeVertexNormals(); return g;
}
function objMesh(o) {
  let g;
  if (o.t === 'poly') { g = new THREE.Group(); const m = new THREE.Mesh(polyGeo(o), mat(o.c || '#8a8478', { name: 'prim' })); m.castShadow = m.receiveShadow = true; m.userData.own = 1; g.add(m); }
  else if (isPrim(o)) { g = new THREE.Group(); const m = new THREE.Mesh(pg(o.t), mat(o.c || '#8a8478', { name: o.glow ? 'glow' : 'prim', emit: o.glow })); m.castShadow = !o.glow; m.receiveShadow = true; g.add(m); g.scale.set(o.sx || 1, o.sy || 1, o.sz || 1); }
  else if (isKit(o)) { const t = tplNow(kitId(o)); if (t) { g = t.obj.clone(true); g.scale.setScalar(o.s || 1); } else { g = new THREE.Group(); g.add(new THREE.Mesh(pg('box'), helpMat('#666', 0.5))); kitTpl(kitId(o)).then(tt => { if (tt && M.objs.includes(o)) syncObj(o); }); } }
  else if (OBJ[o.t]) { g = markerMesh(o); if (o.t === 'house') g.scale.set(o.sx || 1, 1, o.sz || 1); }
  else { g = new THREE.Group(); g.add(new THREE.Mesh(pg('box'), helpMat('#f06a6a', 0.6))); }
  const lift = o.t === 'ring' ? Math.max(1, o.y || 6) : o.t === 'light' ? (o.y == null ? 2.2 : o.y) : o.t === 'ceil' ? (o.y == null ? 21 : o.y) : (o.y || 0);
  g.position.set(o.x, MD.gh(M, o.x, o.z) + lift, o.z); g.rotation.y = o.t === 'phase' || o.t === 'ceil' || o.t === 'dc_box' ? 0 : o.rot || 0;   // areas + decor boxes are axis-aligned in the game
  if (o.vis === 0) ghostify(g);
  if (!show.area) g.traverse(m => { if (m.userData.area) m.visible = false; });
  g.userData.ref = refOfItem(o, 'obj'); g.name = 'obj_' + o.id;
  return g;
}
const objNode = new Map();
// decor boxes (dc_box, thousands on a castle map): one InstancedMesh per material, picked by instanceId (userData.ids)
const boxInst = new Map(), _bm4 = new THREE.Matrix4(), _bq = new THREE.Quaternion(), _bv = new THREE.Vector3(), _bs = new THREE.Vector3();
const boxMat4 = o => _bm4.compose(_bv.set(o.x, MD.gh(M, o.x, o.z) + (o.y || 0), o.z), _bq, _bs.set(o.sx || 1, o.sy || 1, o.sz || 1));
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
function syncBoxes(list) {
  boxInst.clear(); const by = new Map();
  for (const o of list) { const k = o.k || 'stone'; if (!by.has(k)) by.set(k, []); by.get(k).push(o); }
  for (const [k, L] of by) { const im = new THREE.InstancedMesh(boxGeo, mat(MD.DECO_COL[k] || '#c2b298', { emit: k === 'lit' || k === 'lit2' }), L.length); im.castShadow = im.receiveShadow = true;
    im.userData = { ids: L.map(o => o.id), refs: L.map(o => refOfItem(o, 'obj')) }; L.forEach((o, i) => { im.setMatrixAt(i, boxMat4(o)); boxInst.set(o.id, { im, i }); }); im.computeBoundingSphere(); gObjs.add(im); }
}
function syncObj(o) {
  if (o.t === 'dc_box') { const e = boxInst.get(o.id); if (e && e.im.material === mat(MD.DECO_COL[o.k || 'stone'] || '#c2b298', { emit: o.k === 'lit' || o.k === 'lit2' })) { e.im.setMatrixAt(e.i, boxMat4(o)); e.im.instanceMatrix.needsUpdate = true; e.im.computeBoundingSphere(); } else syncObjs(); if (sel && sel.k === 'obj' && sel.id === o.id) updSel(); need(); return; }
  const old = objNode.get(o.id); if (old) gObjs.remove(old); const g = objMesh(o); objNode.set(o.id, g); gObjs.add(g); if (sel && sel.k === 'obj' && sel.id === o.id) updSel(); need(); }
function syncObjs() { for (const c of [...gObjs.children]) gObjs.remove(c); objNode.clear(); const all = M.objs.concat(RX.objs), boxes = [];
  for (const o of all) { if (o.t === 'dc_box') { boxes.push(o); continue; } const g = objMesh(o); objNode.set(o.id, g); gObjs.add(g); }
  syncBoxes(boxes); }
// castle parts → groups of meshes (prim objs + floor slabs generated by MD.expandParts); each group carries ref {k:'part'}
const partNode = new Map();
function partGroup(p, ghostMode) {
  const X = MD.expandParts(M, [p]), g = new THREE.Group();
  for (const o of X.objs) { if (o.hid) continue; const n = objMesh(o); n.userData = { po: o }; g.add(n); }
  for (const f of X.floors) { const m = new THREE.Mesh(floorGeo(f), mat(f.c || '#8a8478', { name: 'floor' })); m.position.set(f.x, 0, f.z); m.rotation.y = f.rot || 0; m.castShadow = m.receiveShadow = true; m.userData = { pf: f }; m.updateMatrix(); g.add(m); }
  g.userData.ref = refOfItem(p, 'part'); g.userData.pid = p.id; g.name = 'part_' + p.id; return g;
}
function syncPart(p) { const old = partNode.get(p.id); if (old) { gParts.remove(old); old.traverse(o => { if (o.isMesh && (o.userData.pf || o.userData.own)) o.geometry.dispose(); }); } const g = partGroup(p); partNode.set(p.id, g); gParts.add(g); if (sel && sel.k === 'part' && sel.id === p.id) updSel(); need(); }
function syncParts() { for (const c of [...gParts.children]) { gParts.remove(c); c.traverse(o => { if (o.isMesh && (o.userData.pf || o.userData.own)) o.geometry.dispose(); }); } partNode.clear(); for (const p of M.parts.concat(RX.parts)) { const g = partGroup(p); partNode.set(p.id, g); gParts.add(g); } }
function syncAll() { RX = MD.flatRooms(M, RM); syncWalls(); syncFloors(); syncObjs(); syncParts(); updSel(); colDirty(); need(); }

// ================= collision preview =================
let colT = 0, GD = null;
function colDirty() { GD = null; clearTimeout(colT); colT = setTimeout(() => { buildCol(); renderCheck(); }, 250); }
function gameData() { if (!GD) { GD = MD.gameData(ALLM(), dim); GD.data.fog = M.fog || fogDef(); } return GD; }
function buildCol() {
  for (const c of [...gCol.children]) { gCol.remove(c); c.geometry.dispose(); }
  if (!show.col || !M) return;
  const obs = gameData().data.obs; if (!obs.length) return;
  const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xff5a4a, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide }), obs.length), m4 = new THREE.Matrix4();
  obs.forEach((o, i) => { const x = o.x / MD.PX, z = o.y / MD.PX, r = o.r / MD.PX, g = MD.gh(M, x, z), b = o.bot || 0, h = o.hgt - b; im.setMatrixAt(i, m4.makeScale(r, h, r).setPosition(x, g + b + h / 2, z)); });
  gCol.add(im); need();
}

// ================= camera / picking =================
function camApply() {
  cam.pitch = clamp(cam.pitch, 0.08, 1.55); cam.dist = clamp(cam.dist, 3, 900);
  const ty = M ? MD.gh(M, clamp(cam.x, 0, M.W), clamp(cam.z, 0, M.H)) : 0, cp = Math.cos(cam.pitch);
  const tx = cam.x - M.W / 2, tz = cam.z - M.H / 2;
  camera.position.set(tx + Math.sin(cam.yaw) * cp * cam.dist, ty + Math.sin(cam.pitch) * cam.dist, tz + Math.cos(cam.yaw) * cp * cam.dist);
  camera.lookAt(tx, ty, tz);
  sun.position.set(tx + 60, 120, tz + 40); sun.target.position.set(tx, ty, tz);
  const s = Math.max(60, Math.min(260, cam.dist * 1.1)), sc = sun.shadow.camera; sc.left = -s; sc.right = s; sc.top = s; sc.bottom = -s; sc.near = 1; sc.far = 400; sc.updateProjectionMatrix();
  need();
}
function fit() { cam.x = M.W / 2; cam.z = M.H / 2; cam.dist = Math.max(M.W, M.H) * 0.95; cam.pitch = 0.95; cam.yaw = 0; camApply(); }
function setRay(e) { const r = cv.getBoundingClientRect(); v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(v2, camera); }
function groundHit() {   // march the ray over the height field (map coords)
  const o = ray.ray.origin, d = ray.ray.direction, ox = o.x + M.W / 2, oz = o.z + M.H / 2; let t = 0, pt = 0; const maxT = cam.dist * 4 + 400;
  const below = t => { const x = ox + d.x * t, z = oz + d.z * t; return x >= 0 && z >= 0 && x <= M.W && z <= M.H && o.y + d.y * t <= MD.gh(M, x, z); };
  for (; t < maxT; pt = t, t += Math.max(0.3, t * 0.01)) if (below(t)) { let a = pt, b = t; for (let i = 0; i < 14; i++) { const m = (a + b) / 2; if (below(m)) b = m; else a = m; }
    const x = ox + d.x * b, z = oz + d.z * b; return { x, z, y: MD.gh(M, x, z), t: b, on: 'ground' }; }
  return null;
}
function refOf(o, inst) { if (o && o.userData && o.userData.refs && inst != null) return o.userData.refs[inst]; for (; o; o = o.parent) if (o.userData && o.userData.ref) return o.userData.ref; return null; }
const shown = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
function pickItem() { const h = ray.intersectObjects([gObjs, gWalls, gFloors, gParts], true).find(q => shown(q.object)); return h ? { ref: refOf(h.object, h.instanceId), t: h.distance, p: h.point } : null; }
function surfHit() {   // ground or the top of a floor / object (to place things on platforms)
  const g = groundHit(), hs = ray.intersectObjects([gFloors, gParts], true), h = hs.find(q => { if (q.object.parent === gFloors || !q.face) return true; v3.copy(q.face.normal).transformDirection(q.object.matrixWorld); return v3.y > 0.7; });   // parts: only upward faces count as a surface
  if (h && (!g || h.distance < g.t)) { const x = h.point.x + M.W / 2, z = h.point.z + M.H / 2; return { x, z, y: h.point.y, t: h.distance, on: 'floor' }; }
  return g;
}
const KEYS = { wall: 'walls', floor: 'floors', obj: 'objs', part: 'parts', room: 'rooms' };
const find = s => s && (M[KEYS[s.k]] || []).find(v => v.id === s.id);
const nid = () => (M.seq = (M.seq || 1) + 1);
const snapV = v => opt.snap ? Math.round(v / opt.snap) * opt.snap : +v.toFixed(2);

// ================= undo =================
const META = ['walls', 'floors', 'objs', 'parts', 'rooms', 'name', 'desc', 'sky', 'style', 'fog', 'music', 'weather', 'fx', 'modes', 'random', 'autoProps', 'skirt', 'seq'];
function snap(kind) { const e = {}; if (kind !== 'o') { e.hg = M.hg.slice(); e.sf = M.sf.slice(); e.W = M.W; e.H = M.H; } if (kind !== 't') { const o = {}; for (const k of META) o[k] = M[k]; e.js = JSON.stringify(o); } return e; }
function pushUndo(kind) { undo.push(snap(kind)); if (undo.length > 40) undo.shift(); redo = []; }
function restore(e) {
  const kind = e.hg && e.js ? 'a' : e.hg ? 't' : 'o', back = snap(kind);
  if (e.hg) { const rs = e.W !== M.W || e.H !== M.H; M.W = e.W; M.H = e.H; M.nx = Math.round(M.W / C) + 1; M.ny = Math.round(M.H / C) + 1; M.hg = e.hg; M.sf = e.sf; if (rs) buildTerrain(); else updTerrain(0, 0, M.nx - 1, M.ny - 1); }
  if (e.js) Object.assign(M, JSON.parse(e.js));
  if (sel && !find(sel)) sel = null;
  syncAll(); buildGrid(); renderSide(); changed(); return back;
}
function doUndo() { if (undo.length) redo.push(restore(undo.pop())); }
function doRedo() { if (redo.length) undo.push(restore(redo.pop())); }

// ================= terrain brushes =================
function brushRange(x, z, R) { return [clamp(Math.floor((x - R) / C), 0, M.nx - 1), clamp(Math.floor((z - R) / C), 0, M.ny - 1), clamp(Math.ceil((x + R) / C), 0, M.nx - 1), clamp(Math.ceil((z + R) / C), 0, M.ny - 1)]; }
function falloff(d, R) { if (d >= R) return 0; if (opt.soft) { const q = 1 - (d / R) * (d / R); return q * q; } return d < R * 0.8 ? 1 : (R - d) / (R * 0.2); }
function sculpt(dt, inv) {
  const h = hover; if (!h) return;
  const R = opt.rad, [i0, j0, i1, j1] = brushRange(h.x, h.z, R), a = M.hg, nx = M.nx, mode = opt.smode, s = opt.str;
  let src = null; if (mode === 'smooth') src = a.slice();
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const d = Math.hypot(i * C - h.x, j * C - h.z), f = falloff(d, R); if (f <= 0) continue; const k = j * nx + i;
    if (mode === 'up' || mode === 'down') a[k] += ((mode === 'up') !== inv ? 1 : -1) * s * 0.9 * f * dt;
    else if (mode === 'smooth') { let t = 0, n = 0; for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) { const X = i + x, Y = j + y; if (X < 0 || Y < 0 || X >= nx || Y >= M.ny) continue; t += src[Y * nx + X]; n++; } a[k] += (t / n - a[k]) * Math.min(1, f * s * dt * 1.6); }
    else if (mode === 'flat') a[k] += (stroke.h0 - a[k]) * Math.min(1, f * s * dt * 1.4);
    else if (mode === 'set') a[k] += (opt.hval - a[k]) * Math.min(1, f * s * dt * 3);
    else if (mode === 'noise') a[k] += (MD.vnoise(i * 0.19 + stroke.seed, j * 0.19) + 0.5 * MD.vnoise(i * 0.47, j * 0.47 + stroke.seed) - 0.75) * (inv ? -1 : 1) * s * 0.7 * f * dt;
    a[k] = clamp(a[k], MD.HMIN, MD.HMAX);
  }
  updTerrain(i0, j0, i1, j1); stroke.moved = 1;
}
function paintSurf(inv) {
  const h = hover; if (!h) return; const R = opt.rad, [i0, j0, i1, j1] = brushRange(h.x, h.z, R), v = inv ? 0 : opt.surf;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const d = Math.hypot(i * C - h.x, j * C - h.z); if (d < R * (opt.soft ? 0.86 + 0.28 * MD.hash2(i + 7, j + 3) : 1)) M.sf[j * M.nx + i] = v; }
  updTerrain(i0, j0, i1, j1); stroke.moved = 1;
}
function applyRamp(A, B, W) {   // straight slope from A to B (heights taken at both ends), W wide, soft edges
  const dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz); if (L < 1) return;
  const hA = MD.gh(M, A.x, A.z), hB = MD.gh(M, B.x, B.z), pad = W / 2 + 2, i0 = clamp(Math.floor((Math.min(A.x, B.x) - pad) / C), 0, M.nx - 1), i1 = clamp(Math.ceil((Math.max(A.x, B.x) + pad) / C), 0, M.nx - 1), j0 = clamp(Math.floor((Math.min(A.z, B.z) - pad) / C), 0, M.ny - 1), j1 = clamp(Math.ceil((Math.max(A.z, B.z) + pad) / C), 0, M.ny - 1);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const px = i * C - A.x, pz = j * C - A.z, t = (px * dx + pz * dz) / (L * L); if (t < -0.02 || t > 1.02) continue;
    const off = Math.abs(px * dz - pz * dx) / L, e = off <= W / 2 ? 1 : opt.soft ? clamp(1 - (off - W / 2) / 1.5, 0, 1) : 0; if (e <= 0) continue;
    const k = j * M.nx + i, target = hA + (hB - hA) * clamp(t, 0, 1); M.hg[k] += (target - M.hg[k]) * e * e * (3 - 2 * e); }
  updTerrain(i0, j0, i1, j1);
}

// ================= helpers drawn in the view =================
const ringGeo = new THREE.BufferGeometry(); ringGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(65 * 3), 3));
const ring = new THREE.Line(ringGeo, new THREE.LineBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.9 })); ring.renderOrder = 10; ring.frustumCulled = false; gHelp.add(ring);
const lineGeo = new THREE.BufferGeometry(); const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: ACC, depthTest: false })); line.renderOrder = 11; line.frustumCulled = false; gHelp.add(line);
const gHandles = new THREE.Group(); gHelp.add(gHandles);
let ghost = null, ghostKey = '';
function drawRing() {
  const on = hover && (tool === 'sculpt' || tool === 'paint' || tool === 'scatter'); ring.visible = !!on; if (!on) return;
  const P = ringGeo.attributes.position.array, R = opt.rad;
  for (let i = 0; i <= 64; i++) { const a = i / 64 * 6.2832, x = clamp(hover.x + Math.cos(a) * R, 0, M.W), z = clamp(hover.z + Math.sin(a) * R, 0, M.H); P[i * 3] = x; P[i * 3 + 1] = MD.gh(M, x, z) + 0.12; P[i * 3 + 2] = z; }
  ringGeo.attributes.position.needsUpdate = true;
}
function drawLine(pts) {   // [[x,z],[x,z]…] draped on the ground; null = hide
  line.visible = !!(pts && pts.length > 1); if (!line.visible) return;
  const P = []; for (const p of MD.resample(pts, 0.5)) P.push(p[0], (pts.y != null ? pts.y : MD.gh(M, p[0], p[1])) + 0.15, p[1]);
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); lineGeo.computeBoundingSphere();
}
function drawHandles() {
  for (const c of [...gHandles.children]) gHandles.remove(c);
  const fh = freeHandles();
  if (fh) { fh.forEach((q, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), helpMat(sel && sel.pt === i && !fdraft ? '#ffffff' : ACC)); m.material.depthTest = false; m.renderOrder = 12; m.position.set(q.x, q.y, q.z); gHandles.add(m); }); return; }
  const pts = draft ? draft.pts : sel && sel.k === 'wall' && find(sel) ? find(sel).pts : null; if (!pts) return;
  const w = draft || find(sel);
  pts.forEach((p, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), helpMat(sel && sel.pt === i && !draft ? '#ffffff' : ACC)); m.material.depthTest = false; m.renderOrder = 12; m.position.set(p[0], (w.base != null ? w.base : MD.gh(M, p[0], p[1])) + (w.h || opt.wh) + 0.2, p[1]); gHandles.add(m); });
}
function updSel() {
  if (selBox) { scene.remove(selBox); selBox.geometry.dispose(); selBox = null; }   // Box3Helper lives in world space (scene), not in root
  const it = find(sel);
  if (it) { const b = new THREE.Box3(), t = new THREE.Box3(); b.makeEmpty();
    const bxN = sel.k === 'obj' && it.t === 'dc_box' ? (() => { const m = new THREE.Mesh(boxGeo); m.applyMatrix4(boxMat4(it)); root.add(m); setTimeout(() => root.remove(m), 0); return m; })() : null;
    const nodes = bxN ? [bxN] : sel.k === 'obj' ? [objNode.get(it.id)] : sel.k === 'part' ? [partNode.get(it.id)] : sel.k === 'room' ? [gWalls, gFloors, gObjs, gParts].flatMap(g => g.children.filter(c => c.userData.ref && c.userData.ref.k === 'room' && c.userData.ref.id === it.id)) : (sel.k === 'wall' ? gWalls : gFloors).children.filter(c => c.userData.ref.id === it.id);
    root.updateMatrixWorld(true); for (const n of nodes) if (n) { t.setFromObject(n); b.union(t); }
    if (!b.isEmpty()) { selBox = new THREE.Box3Helper(b, 0xffffff); selBox.material.depthTest = false; selBox.renderOrder = 9; scene.add(selBox); } }
  drawHandles(); need();
}
function updGhost() {
  const key = (tool === 'place' && !opt.obj.startsWith('room:') ? opt.obj + '|' + JSON.stringify(opt.prim) : '');
  if (key !== ghostKey) { if (ghost) gHelp.remove(ghost); ghost = null; ghostKey = key;
    if (key) { const o = protoObj(0, 0); const make = () => { if (ghostKey !== key) return; if (ghost) gHelp.remove(ghost); ghost = objMesh(o); ghost.userData = {}; ghost.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = 0.6; m.castShadow = false; } }); gHelp.add(ghost); need(); };
      make(); if (isKit(o) && !tplNow(kitId(o))) kitTpl(kitId(o)).then(make); } }
  if (ghost) { ghost.visible = !!hover && tool === 'place'; if (hover) { ghost.position.set(snapV(hover.x), hover.y + (opt.obj === 'ring' ? 6 : opt.obj === 'light' ? 2.2 : 0), snapV(hover.z)); ghost.rotation.y = ghostRot; } }
}
function protoObj(x, z) {
  const t = opt.obj, o = { id: 0, t, x, z, y: 0, rot: ghostRot };
  if (OBJ[t] && OBJ[t].cat === 'prim') Object.assign(o, { c: opt.prim.c, sx: opt.prim.sx, sy: opt.prim.sy, sz: opt.prim.sz });
  else if (t.startsWith('kit:')) o.s = 1;
  else if (t === 'light') Object.assign(o, { y: 2.2, c: '#ffb060', int: 2.4, dist: 14 });
  else if (t === 'ring') o.y = 6;
  else if (t === 'core') Object.assign(o, { n: M.objs.filter(q => q.t === 'core').length + 1, s: 4 });
  else if (t === 'sgA' || t === 'sgB') o.ph = 1;
  else if (t === 'phase') Object.assign(o, { ph: 1, sx: 40, sz: 40, rot: 0 });
  else if (t === 'ceil') Object.assign(o, { sx: 20, sz: 20, y: 21, rot: 0 });
  else if (MD.isRP(t) && MD.RPK[t.slice(3)].L) o.L = 4;
  else if (MD.isDeco(t)) Object.assign(o, { box: { k: 'stone', sx: 2, sy: 2, sz: 2, y: 1, rot: 0 }, cyl: { k: 'stone', rt: 1, rb: 1, sy: 4, seg: 12, y: 2 }, cone: { k: 'roof', r: 2, sy: 3, seg: 8, y: 1.5 },
    roof: { sx: 12, sz: 8, sy: 4, y: 6 }, flame: { y: 2.5 }, cloth: { sx: 2, sy: 4, c: '#7a1418', y: 6 }, shield: { y: 3 }, chand: { y: 12 } }[t.slice(3)] || {});
  return o;
}

// ================= pointer =================
function updHover(e) { setRay(e); hover = (tool === 'place' || tool === 'floor' || tool === 'wall' || tool === 'scatter' || tool === 'castle') ? surfHit() : groundHit(); if (hover && tool === 'scatter') hover.y = MD.gh(M, hover.x, hover.z); }
function placeObj(h, extra) {
  if (opt.obj.startsWith('room:')) { const r = { id: nid(), ref: opt.obj.slice(5), x: snapV(h.x), z: snapV(h.z), rot: Math.round(ghostRot / (Math.PI / 2)) * (Math.PI / 2) };
    M.rooms.push(r); sel = { k: 'room', id: r.id }; loadRooms().then(() => { syncRooms(); renderSide(); }); return r; }
  const o = protoObj(snapV(h.x), snapV(h.z)); o.id = nid(); if (o.t !== 'light' && o.t !== 'ring' && o.t !== 'ceil' && !MD.isDeco(o.t)) o.y = +(Math.max(0, h.y - MD.gh(M, o.x, o.z))).toFixed(2); Object.assign(o, extra || {});
  M.objs.push(o); syncObj(o); return o;
}
// castle parts: proto at the hover point (grid snap + port snap to other parts), then place
const snapC = v => opt.csnap ? Math.round(v / opt.csnap) * opt.csnap : +v.toFixed(2);
function partPP(k) { const D = MD.PART[k], pp = opt.pp[k] || (opt.pp[k] = {}); for (const q in D.p) if (pp[q] == null) pp[q] = D.p[q][0]; for (const q in D.f) if (pp[q] == null) pp[q] = D.f[q]; if (!pp.c) pp.c = D.c; if (pp.brk == null) pp.brk = 0; return pp; }
function snapPartTo(p) { const sn = opt.psnap && MD.snapPart(M, p); if (sn) { p.x = +(p.x + sn.dx).toFixed(3); p.z = +(p.z + sn.dz).toFixed(3); if (sn.base !== undefined) p.base = Math.abs(sn.base - MD.gh(M, p.x, p.z)) < 0.06 ? null : sn.base; } return !!sn; }
function castleProto(h) { const k = opt.part, p = MD.partNew(k, Object.assign({}, partPP(k), { id: 0, rot: ghostRot, x: snapC(h.x), z: snapC(h.z), base: h.on === 'floor' ? +(Math.round(h.y * 20) / 20).toFixed(2) : null })); snapPartTo(p); return p; }
function placePart(h) { pushUndo('o'); const p = castleProto(h); p.id = nid(); M.parts.push(p); syncPart(p); sel = { k: 'part', id: p.id }; updSel(); renderSide(); changed(); colDirty(); return p; }
let fdraft = null;   // free-shape part being drawn: {pts:[[x,z]…] world, base}
function finishFree() {
  const d = fdraft; fdraft = null; drawLine(null); drawHandles();
  if (!d || d.pts.length < 3) { if (d) undo.pop(); need(); return; }
  const xs = d.pts.map(q => q[0]), zs = d.pts.map(q => q[1]), cx = snapC((Math.min(...xs) + Math.max(...xs)) / 2), cz = snapC((Math.min(...zs) + Math.max(...zs)) / 2);
  const pt = MD.partNew('free', Object.assign({}, partPP('free'), { id: nid(), x: cx, z: cz, base: d.base, pts: d.pts.map(q => [+(q[0] - cx).toFixed(3), +(q[1] - cz).toFixed(3)]) }));
  M.parts.push(pt); syncPart(pt); sel = { k: 'part', id: pt.id }; updSel(); renderSide(); changed(); colDirty();
}
function freeHandles() {   // vertex handles of the selected free-shape part (world map coords) or of the draft
  if (fdraft) return fdraft.pts.map(q => ({ x: q[0], z: q[1], y: (fdraft.base != null ? fdraft.base : MD.gh(M, q[0], q[1])) + 0.3 }));
  const it = sel && sel.k === 'part' && find(sel); if (!it || !it.pts) return null;
  const cs = Math.cos(it.rot || 0), sn = Math.sin(it.rot || 0), g0 = MD.gh(M, it.x, it.z), b = it.base != null ? it.base : g0;
  return it.pts.map(q => ({ x: it.x + q[0] * cs + q[1] * sn, z: it.z - q[0] * sn + q[1] * cs, y: b + it.h + 0.3 }));
}
const toLocal = (it, x, z) => { const dx = x - it.x, dz = z - it.z, cs = Math.cos(it.rot || 0), sn = Math.sin(it.rot || 0); return [+(dx * cs - dz * sn).toFixed(3), +(dx * sn + dz * cs).toFixed(3)]; };
let pghost = null, pghostKey = '';
function updPartGhost() {
  if (!(tool === 'castle' && hover) || opt.part === 'free') { if (pghost) pghost.visible = false; return; }
  const p = castleProto(hover), key = JSON.stringify(p);
  if (key !== pghostKey) { if (pghost) gHelp.remove(pghost); pghostKey = key; pghost = partGroup(p); pghost.userData = {};
    pghost.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = 0.55; m.castShadow = false; } }); gHelp.add(pghost); }
  pghost.visible = true;
}
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('pointerdown', e => {
  cv.focus(); cv.setPointerCapture(e.pointerId); updHover(e);
  if (e.button === 2 || e.button === 1 || (e.button === 0 && spaceDown)) { drag = { k: e.button === 2 ? 'orbit' : 'pan', x: e.clientX, y: e.clientY }; return; }
  if (e.button !== 0) return;
  const inv = e.shiftKey;
  if (tool === 'sculpt') {
    if (!hover) return;
    if (opt.smode === 'ramp') { drag = { k: 'ramp', a: { x: hover.x, z: hover.z } }; return; }
    pushUndo('t'); stroke = { k: 'sculpt', inv, h0: hover.y, seed: Math.random() * 99 };
  } else if (tool === 'paint') { if (!hover) return; if (e.altKey) { opt.surf = M.sf[clamp(Math.round(hover.z / C), 0, M.ny - 1) * M.nx + clamp(Math.round(hover.x / C), 0, M.nx - 1)]; renderOpts(); return; } pushUndo('t'); stroke = { k: 'paint', inv }; paintSurf(inv); }
  else if (tool === 'scatter') { if (!hover) return; pushUndo('o'); stroke = { k: 'scatter', inv, acc: 1 }; }
  else if (tool === 'wall') {
    if (!hover) return;
    if (!draft) { pushUndo('o'); draft = { pts: [], base: hover.on === 'floor' ? +hover.y.toFixed(2) : null, h: opt.wh }; }
    const p = [snapV(hover.x), snapV(hover.z)], f = draft.pts[0];
    if (f && draft.pts.length > 2 && Math.hypot(f[0] - p[0], f[1] - p[1]) < 0.8) return finishWall(true);
    draft.pts.push(p); drawHandles(); need();
  } else if (tool === 'floor') { if (hover) drag = { k: 'floor', a: { x: hover.x, z: hover.z, y: hover.y } }; }
  else if (tool === 'castle') {
    if (!hover) return;
    if (opt.part !== 'free') placePart(hover);
    else {
      if (!fdraft) { pushUndo('o'); fdraft = { pts: [], base: hover.on === 'floor' ? +(Math.round(hover.y * 20) / 20).toFixed(2) : null }; }
      const q = [snapC(hover.x), snapC(hover.z)], f = fdraft.pts[0];
      if (f && fdraft.pts.length > 2 && Math.hypot(f[0] - q[0], f[1] - q[1]) < 0.8) return finishFree();
      fdraft.pts.push(q); drawHandles(); need();
    }
  }
  else if (tool === 'place') { if (!hover) return; pushUndo('o'); const o = placeObj(hover); if (opt.rrot && isVisual(o)) { ghostRot = Math.random() * 6.2832; } changed(); colDirty(); }
  else if (tool === 'select') {
    const fh = freeHandles();
    if (fh && !fdraft) { const r = cv.getBoundingClientRect(); let best = -1, bd = 12;
      fh.forEach((q, i) => { v3.set(q.x - M.W / 2, q.y, q.z - M.H / 2).project(camera); const d = Math.hypot((v3.x + 1) / 2 * r.width + r.left - e.clientX, (1 - v3.y) / 2 * r.height + r.top - e.clientY); if (d < bd) { bd = d; best = i; } });
      if (best >= 0) { sel.pt = best; drag = { k: 'fpt', it: find(sel), i: best, moved: 0 }; drawHandles(); renderSide(); need(); return; } }
    // wall point handle first
    const w = sel && sel.k === 'wall' && find(sel);
    if (w) { const r = cv.getBoundingClientRect(); let best = -1, bd = 12;
      w.pts.forEach((p, i) => { v3.set(p[0] - M.W / 2, (w.base != null ? w.base : MD.gh(M, p[0], p[1])) + w.h + 0.2, p[1] - M.H / 2).project(camera); const d = Math.hypot((v3.x + 1) / 2 * r.width + r.left - e.clientX, (1 - v3.y) / 2 * r.height + r.top - e.clientY); if (d < bd) { bd = d; best = i; } });
      if (best >= 0) { sel.pt = best; drag = { k: 'pt', w, i: best, moved: 0 }; drawHandles(); renderSide(); need(); return; } }
    const p = pickItem(), g = groundHit();
    if (p && p.ref) { const same = sel && sel.k === p.ref.k && sel.id === p.ref.id; sel = { k: p.ref.k, id: p.ref.id };
      if (e.altKey && p.ref.k === 'wall') { insertWallPt(find(sel), p.p.x + M.W / 2, p.p.z + M.H / 2); }
      else if (e.altKey && p.ref.k === 'part' && find(sel).pts) { insertFreePt(find(sel), p.p.x + M.W / 2, p.p.z + M.H / 2); }
      else if (g) { const it = find(sel); drag = { k: 'move', it, kind: sel.k, gx: g.x, gz: g.z, o: sel.k === 'wall' ? it.pts.map(q => q.slice()) : [it.x, it.z], moved: 0 }; }
      if (!same) renderSide(); updSel(); }
    else { sel = null; renderSide(); updSel(); }
  }
});
cv.addEventListener('pointermove', e => {
  if (drag && (drag.k === 'orbit' || drag.k === 'pan')) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
    if (drag.k === 'orbit') { cam.yaw -= dx * 0.006; cam.pitch += dy * 0.005; }
    else { const s = cam.dist * 0.0016, c = Math.cos(cam.yaw), sn = Math.sin(cam.yaw); cam.x -= (dx * c + dy * sn) * s; cam.z -= (-dx * sn + dy * c) * s; cam.x = clamp(cam.x, -20, M.W + 20); cam.z = clamp(cam.z, -20, M.H + 20); }
    camApply(); return;
  }
  updHover(e); status();
  if (drag && drag.k === 'move') { setRay(e); const g = groundHit(); if (!g) return; const dx = g.x - drag.gx, dz = g.z - drag.gz;
    if (!drag.moved && Math.hypot(dx, dz) < 0.15) return; if (!drag.moved) { pushUndo('o'); drag.moved = 1; }
    if (drag.kind === 'wall') drag.it.pts.forEach((p, i) => { p[0] = snapV(drag.o[i][0] + dx); p[1] = snapV(drag.o[i][1] + dz); }); else if (drag.kind === 'part') { const it = drag.it, sv = opt.csnap ? snapC : snapV; it.x = clamp(sv(drag.o[0] + dx), 0, M.W); it.z = clamp(sv(drag.o[1] + dz), 0, M.H); snapPartTo(it); }
    else { drag.it.x = clamp(snapV(drag.o[0] + dx), 0, M.W); drag.it.z = clamp(snapV(drag.o[1] + dz), 0, M.H); }
    if (drag.kind === 'room') syncRooms(); else if (drag.kind === 'obj') syncObj(drag.it); else if (drag.kind === 'part') syncPart(drag.it); else if (drag.kind === 'wall') { syncWalls(); updSel(); } else { syncFloors(); updSel(); } }
  else if (drag && drag.k === 'fpt') { setRay(e); const g = groundHit(); if (!g) return; if (!drag.moved) { pushUndo('o'); drag.moved = 1; } drag.it.pts[drag.i] = toLocal(drag.it, clamp(snapC(g.x), 0, M.W), clamp(snapC(g.z), 0, M.H)); syncPart(drag.it); }
  else if (drag && drag.k === 'pt') { setRay(e); const g = groundHit(); if (!g) return; if (!drag.moved) { pushUndo('o'); drag.moved = 1; } drag.w.pts[drag.i] = [clamp(snapV(g.x), 0, M.W), clamp(snapV(g.z), 0, M.H)]; syncWalls(); updSel(); }
  else if (drag && drag.k === 'ramp' && hover) drawLine([[drag.a.x, drag.a.z], [hover.x, hover.z]]);
  else if (drag && drag.k === 'floor' && hover) { const p = [[drag.a.x, drag.a.z], [hover.x, hover.z]]; drawLine(p); }
  else if (tool === 'wall' && draft && hover) drawLine([...draft.pts, [hover.x, hover.z]]);
  else if (tool === 'castle' && fdraft && hover) { const l = [...fdraft.pts, [snapC(hover.x), snapC(hover.z)]]; if (l.length > 2) l.push(l[0]); if (fdraft.base != null) l.y = fdraft.base; drawLine(l); }
  need();
});
cv.addEventListener('pointerup', e => {
  if (drag && drag.k === 'ramp') { if (hover && Math.hypot(hover.x - drag.a.x, hover.z - drag.a.z) > 1) { pushUndo('t'); applyRamp(drag.a, hover, opt.rad * 2); afterTerrain(); } drawLine(null); }
  else if (drag && drag.k === 'floor') { makeFloor(drag.a, hover || drag.a); drawLine(null); }
  else if (drag && (drag.k === 'move' || drag.k === 'pt' || drag.k === 'fpt') && drag.moved) { changed(); colDirty(); renderSide(); }
  if (stroke) { if (stroke.k !== 'scatter' && stroke.moved) afterTerrain(); else if (stroke.k === 'scatter') { changed(); colDirty(); } stroke = null; }
  drag = null; need();
});
cv.addEventListener('pointerleave', () => { hover = null; need(); });
cv.addEventListener('dblclick', () => { if (tool === 'wall' && draft) { draft.pts.pop(); finishWall(false); } else if (tool === 'castle' && fdraft) { fdraft.pts.pop(); finishFree(); } });
cv.addEventListener('wheel', e => { e.preventDefault();
  if (e.shiftKey && (tool === 'sculpt' || tool === 'paint' || tool === 'scatter')) { opt.rad = clamp(+(opt.rad * (e.deltaY > 0 ? 0.9 : 1.11)).toFixed(1), 0.5, 40); renderOpts(); need(); return; }
  if (e.shiftKey && (tool === 'place' || tool === 'castle')) { ghostRot += (e.deltaY > 0 ? 1 : -1) * (tool === 'castle' ? Math.PI / 4 : Math.PI / 12); need(); return; }
  cam.dist *= e.deltaY > 0 ? 1.12 : 0.89; camApply(); }, { passive: false });

function afterTerrain() { syncAll(); buildGrid(); changed(); }
function finishWall(closed) {
  const d = draft; draft = null; drawLine(null);
  if (d && d.pts.length >= 2) { const P = MD.WALL_PRESET[opt.wall] || {}; const w = { id: nid(), pts: d.pts, th: opt.wth, h: opt.wh, c: opt.wc, m: opt.wm, closed: closed ? 1 : 0, curve: opt.wcurve ? 1 : 0, brk: opt.wbrk ? 1 : 0, base: d.base, n: P.n };
    M.walls.push(w); sel = { k: 'wall', id: w.id }; syncWalls(); changed(); colDirty(); renderSide(); }
  else undo.pop();
  updSel();
}
function insertFreePt(it, x, z) {   // Alt+click on a free shape: add a vertex on the nearest edge
  const [lx, lz] = toLocal(it, x, z), P = it.pts, n = P.length; let bi = 0, bd = 1e9;
  for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((lx - a[0]) * dx + (lz - a[1]) * dz) / (dx * dx + dz * dz || 1), 0, 1), d = Math.hypot(a[0] + dx * t - lx, a[1] + dz * t - lz); if (d < bd) { bd = d; bi = i; } }
  pushUndo('o'); P.splice(bi + 1, 0, [lx, lz]); sel.pt = bi + 1; syncPart(it); changed(); colDirty(); renderSide();
}
function insertWallPt(w, x, z) {
  let bi = 0, bd = 1e9; const n = w.pts.length, m = w.closed ? n : n - 1;
  for (let i = 0; i < m; i++) { const a = w.pts[i], b = w.pts[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1), 0, 1), d = Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z); if (d < bd) { bd = d; bi = i; } }
  pushUndo('o'); w.pts.splice(bi + 1, 0, [+x.toFixed(2), +z.toFixed(2)]); sel.pt = bi + 1; syncWalls(); changed(); colDirty();
}
function makeFloor(A, B) {
  const P = MD.FLOOR_PRESET[opt.floor], L = Math.hypot(B.x - A.x, B.z - A.z), f = { id: nid(), th: P.th, c: P.c, steps: P.steps ? 1 : 0, n: P.n, w: opt.fw };
  pushUndo('o');
  if (L < 1.5) { Object.assign(f, { x: snapV(A.x), z: snapV(A.z), d: P.d, rot: ghostRot }); const g = A.y; if (P.ramp) { f.y = +g.toFixed(2); f.y2 = +(g + opt.fh).toFixed(2); } else f.y = f.y2 = +(g + opt.fh).toFixed(2); }
  else { Object.assign(f, { x: +((A.x + B.x) / 2).toFixed(2), z: +((A.z + B.z) / 2).toFixed(2), d: +L.toFixed(2), rot: +Math.atan2(B.x - A.x, B.z - A.z).toFixed(4) });
    const hB = B.y != null ? B.y : MD.gh(M, B.x, B.z);
    if (P.ramp) { f.y = +A.y.toFixed(2); f.y2 = +(Math.abs(hB - A.y) > 0.3 ? hB : A.y + opt.fh).toFixed(2); } else f.y = f.y2 = +(opt.fauto ? Math.max(A.y, hB) : Math.min(A.y, hB) + opt.fh).toFixed(2); }
  M.floors.push(f); sel = { k: 'floor', id: f.id }; syncFloors(); updSel(); changed(); colDirty(); renderSide();
}
function scatter(dt, inv) {
  const h = hover; if (!h) return; const R = opt.rad;
  if (inv) { const n = M.objs.length; M.objs = M.objs.filter(o => !(isVisual(o) && Math.hypot(o.x - h.x, o.z - h.z) < R)); if (M.objs.length !== n) { syncObjs(); need(); } return; }
  if (!isVisualType(opt.obj)) return;
  stroke.acc += opt.dens * R * R * 0.12 * dt * 6;
  const gap = Math.max(0.35, 1.6 / Math.sqrt(opt.dens));
  while (stroke.acc >= 1) { stroke.acc -= 1; const a = Math.random() * 6.2832, r = Math.sqrt(Math.random()) * R, x = h.x + Math.cos(a) * r, z = h.z + Math.sin(a) * r;
    if (x < 1 || z < 1 || x > M.W - 1 || z > M.H - 1) continue;
    if (M.objs.some(o => Math.abs(o.x - x) < gap && Math.abs(o.z - z) < gap && Math.hypot(o.x - x, o.z - z) < gap)) continue;
    const save = ghostRot; ghostRot = opt.rrot ? Math.random() * 6.2832 : ghostRot; const o = placeObj({ x, z, y: MD.gh(M, x, z) }); ghostRot = save;
    if (opt.rscale && isKit(o)) { o.s = +(1 + (Math.random() - 0.5) * 2 * opt.rscale).toFixed(2); syncObj(o); } }
}
const isVisualType = t => t.startsWith('kit:') || (OBJ[t] && OBJ[t].cat === 'prim');

// ================= keyboard =================
addEventListener('keydown', e => {
  if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { spaceDown = true; e.preventDefault(); }
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { if (e.key === 'Escape') document.activeElement.blur(); return; }
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); save(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); doRedo(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'd') { e.preventDefault(); dupSel(); return; }
  if (e.ctrlKey || e.metaKey) return;
  const T = TOOLS.find(t => t[3] === k); if (T) { setTool(T[0]); return; }
  if (k === 'escape') { if (fdraft) { fdraft = null; undo.pop(); drawLine(null); drawHandles(); } else if (draft) { draft = null; undo.pop(); drawLine(null); drawHandles(); } else { sel = null; renderSide(); updSel(); } need(); }
  else if (k === 'enter' && fdraft) finishFree();
  else if (k === 'backspace' && fdraft) { fdraft.pts.pop(); if (!fdraft.pts.length) { fdraft = null; undo.pop(); drawLine(null); } drawHandles(); need(); }
  else if (k === 'enter' && draft) finishWall(false);
  else if (k === 'backspace' && draft) { draft.pts.pop(); drawHandles(); need(); }
  else if (k === 'delete' || k === 'backspace') delSel();
  else if (k === 'home') fit();
  else if (k === 't') { cam.pitch = 1.55; cam.yaw = 0; camApply(); }
  else if (k === 'f' && find(sel)) { const it = find(sel); cam.x = it.x != null ? it.x : it.pts[0][0]; cam.z = it.z != null ? it.z : it.pts[0][1]; cam.dist = Math.min(cam.dist, 30); camApply(); }
  else if (k === 'q' || k === 'e' || k === 'r') { const cst = tool === 'castle' || (sel && sel.k === 'part'), a = (k === 'q' ? 1 : -1) * (cst ? (e.shiftKey ? Math.PI / 12 : Math.PI / 4) : (e.shiftKey ? Math.PI / 36 : Math.PI / 12)) * (k === 'r' ? -1 : 1); if (tool === 'place' || tool === 'floor' || tool === 'castle') { ghostRot += a; need(); } else rotSel(a); }
  else if (k === '[' || k === ']') { if (tool === 'sculpt' || tool === 'paint' || tool === 'scatter') { opt.rad = clamp(+(opt.rad * (k === '[' ? 0.85 : 1.18)).toFixed(1), 0.5, 40); renderOpts(); } else scaleSel(k === '[' ? 0.9 : 1.1); need(); }
  else if (k === 'pageup' || k === 'pagedown') { e.preventDefault(); liftSel((k === 'pageup' ? 1 : -1) * (e.shiftKey ? 0.05 : 0.25)); }
});
addEventListener('keyup', e => { if (e.code === 'Space') spaceDown = false; });
function editSel(fn) { const it = find(sel); if (!it) return; pushUndo('o'); fn(it); resync(); renderSide(); }
function resync() { const it = find(sel); if (sel && sel.k === 'room') { syncAll(); changed(); return; } if (sel && sel.k === 'obj' && it) syncObj(it); else if (sel && sel.k === 'part' && it) syncPart(it); else if (sel && sel.k === 'wall') syncWalls(); else syncFloors(); updSel(); changed(); colDirty(); }
function delSel() { if (!sel) return; const w = sel.k === 'wall' && find(sel), fp = sel.k === 'part' && find(sel);
  if (fp && fp.pts && sel.pt != null && fp.pts.length > 3) { pushUndo('o'); fp.pts.splice(sel.pt, 1); sel.pt = null; resync(); drawHandles(); return; }
  if (w && sel.pt != null && w.pts.length > 2) { pushUndo('o'); w.pts.splice(sel.pt, 1); sel.pt = null; resync(); return; }
  pushUndo('o'); const key = KEYS[sel.k]; M[key] = M[key].filter(v => v.id !== sel.id); sel = null; syncAll(); renderSide(); changed(); }
function dupSel() { const it = find(sel); if (!it) return; pushUndo('o'); const c = JSON.parse(JSON.stringify(it)); c.id = nid(); if (c.pts && sel.k === 'wall') c.pts.forEach(p => { p[0] += 2; p[1] += 2; }); else { c.x += 2; c.z += 2; }
  M[KEYS[sel.k]].push(c); sel = { k: sel.k, id: c.id }; syncAll(); renderSide(); changed(); }
function rotSel(a) { if (!find(sel)) return; if (sel.k === 'room') { editSel(it => { it.rot = +((((it.rot || 0) + Math.sign(a) * Math.PI / 2) % 6.2832 + 6.2832) % 6.2832).toFixed(4); }); return; } editSel(it => { if (it.pts && sel.k === 'wall') { const cx = it.pts.reduce((s, p) => s + p[0], 0) / it.pts.length, cz = it.pts.reduce((s, p) => s + p[1], 0) / it.pts.length, c = Math.cos(a), s = Math.sin(a); it.pts = it.pts.map(p => { const x = p[0] - cx, z = p[1] - cz; return [+(cx + x * c + z * s).toFixed(2), +(cz - x * s + z * c).toFixed(2)]; }); } else it.rot = +(((it.rot || 0) + a) % 6.2832).toFixed(4); }); }
function scaleSel(k) { if (!find(sel)) return; editSel(it => { if (sel.k === 'obj') { if (isKit(it)) it.s = +((it.s || 1) * k).toFixed(2); else if (isPrim(it) || it.t === 'house' || it.t === 'phase' || it.t === 'ceil') { it.sx = +((it.sx || 1) * k).toFixed(2); it.sz = +((it.sz || 1) * k).toFixed(2); if (isPrim(it)) it.sy = +((it.sy || 1) * k).toFixed(2); } else if (it.t === 'core') it.s = +((it.s || 4) * k).toFixed(2); else if (MD.isRP(it.t) && it.L) it.L = +(it.L * k).toFixed(2); } else if (sel.k === 'part' && it.pts) { it.pts = it.pts.map(q => [+(q[0] * k).toFixed(3), +(q[1] * k).toFixed(3)]); it.h = +clamp(it.h * k, 0.5, 40).toFixed(2); } else if (sel.k === 'part') { const D = MD.PART[it.k], q = D.main, mn = D.p[q][1], mx = D.p[q][2]; it[q] = +clamp(it[q] * k, mn, mx).toFixed(2); } else if (sel.k === 'floor') { it.w = +(it.w * k).toFixed(2); it.d = +(it.d * k).toFixed(2); } else it.h = +(it.h * k).toFixed(2); }); }
function liftSel(d) { if (!find(sel)) return; editSel(it => { if (sel.k === 'obj') it.y = +Math.max(0, (it.y || 0) + d).toFixed(2); else if (sel.k === 'part') it.base = +((it.base != null ? it.base : MD.gh(M, it.x, it.z)) + d).toFixed(2); else if (sel.k === 'floor') { it.y = +(it.y + d).toFixed(2); it.y2 = +((it.y2 == null ? it.y : it.y2) + d).toFixed(2); } else it.base = +((it.base != null ? it.base : MD.gh(M, it.pts[0][0], it.pts[0][1])) + d).toFixed(2); }); }

// ================= UI: tools + options =================
const TOOLS = [['select', '⬚', 'เลือก', 'v', 'คลิกเลือก ลากเพื่อย้าย • Q/E หมุน • [ ] ย่อขยาย • PgUp/PgDn ยกขึ้นลง • Ctrl+D ทำซ้ำ • Del ลบ • กำแพง: ลากจุดขาว, Alt+คลิกเพิ่มจุด'],
  ['sculpt', '⛰', 'ปั้นพื้น', 'b', 'ลากเพื่อปั้น • Shift = กลับทิศ • Shift+ล้อ หรือ [ ] = ขนาดแปรง • สีแดง = ชันเกินเดินขึ้น'],
  ['paint', '🖌', 'พื้นผิว', 'p', 'ลากเพื่อระบายพื้นผิว • Shift = ลบกลับเป็นหญ้า • Alt+คลิก = ดูดชนิดพื้นผิว'],
  ['wall', '▤', 'กำแพง', 'w', 'คลิกทีละจุดเพื่อลากเส้นกำแพง • ดับเบิลคลิก/Enter = จบ • คลิกจุดแรก = ปิดวง • Backspace = ถอยจุด • Esc = ยกเลิก'],
  ['floor', '▭', 'ชั้นบน', 'l', 'ลากจากจุด A ไป B = สะพาน/ทางลาดเชื่อมสองจุด • คลิกเฉย ๆ = วางชานขนาดมาตรฐาน • เดินลอดข้างใต้ได้ถ้าสูง ≥ 2.8'],
  ['castle', '♜', 'ปราสาท', 'c', 'เลือกชิ้นส่วน แล้วคลิกวาง • Q/E หมุน 45° (Shift = 15°) หรือ Shift+ล้อ • ปลายชิ้นดูดติดกันเอง • คลิกบนยอดกำแพง/ทางเดิน = วางต่อที่ความสูงนั้น • ใช้เครื่องมือเลือกเพื่อย้าย/แก้ขนาด'],
  ['place', '◈', 'วางของ', 'o', 'คลิกเพื่อวาง • Q/E หรือ Shift+ล้อ = หมุน • วางบนพื้นชั้นบนได้'],
  ['scatter', '⁘', 'โปรย', 'g', 'ลากเพื่อโปรยของที่เลือก (ต้นไม้ หิน หญ้า) • Shift = ลบของในวง'],
];
const HINT = Object.fromEntries(TOOLS.map(t => [t[0], t[4]]));
function setTool(t) { if (draft) { draft = null; undo.pop(); drawLine(null); } if (fdraft) { fdraft = null; undo.pop(); drawLine(null); } tool = t; if (t === 'scatter' && !isVisualType(opt.obj)) { const a = KIT.list.find(a => a.cat === 'tree'); if (a) { opt.obj = 'kit:' + a.id; opt.cat = 'tree'; } } renderTools(); renderOpts(); drawHandles(); $('hint').textContent = HINT[t] || ''; need(); }
function renderTools() { const box = $('tools'); box.textContent = ''; for (const t of TOOLS) box.append(el('button', { class: tool === t[0] ? 'on' : '', title: t[2] + ' (' + t[3].toUpperCase() + ')', onclick: () => setTool(t[0]) }, el('b', null, t[1]), el('i', null, t[2]))); }
const h3 = t => el('h3', null, t);
function seg(items, cur, on) { const d = el('div', { class: 'seg' }); for (const [v, n, tip] of items) d.append(el('button', { class: 'tl-btn' + (v === cur ? ' on' : ''), title: tip || '', onclick: () => on(v) }, n)); return d; }
function slider(label, key, min, max, step, obj = opt, after) { const out = el('output', null, String(obj[key])); const r = el('input', { type: 'range', min, max, step, value: obj[key], oninput: () => { obj[key] = +r.value; out.textContent = r.value; if (after) after(); need(); } }); return el('div', { class: 'row' }, el('label', null, label), r, out); }
function check(label, key, obj = opt, after) { const c = el('input', { type: 'checkbox', checked: !!obj[key], onchange: () => { obj[key] = c.checked ? 1 : 0; if (after) after(); need(); } }); return el('label', { class: 'chk' }, c, label); }
function pal(items, cur, on, cls) { const d = el('div', { class: 'pal ' + (cls || '') }); items.forEach((it, i) => d.append(el('button', { class: i === cur ? 'on' : '', title: it.n, onclick: () => on(i) }, it.c ? el('span', { class: 'sw', style: 'background:' + it.c }) : null, it.n))); return d; }
function renderOpts() {
  const b = $('opts'); b.textContent = '';
  const brush = () => { b.append(h3('แปรง'), slider('ขนาด (รัศมี)', 'rad', 0.5, 40, 0.5), tool !== 'paint' && tool !== 'scatter' ? slider('แรง', 'str', 0.5, 12, 0.5) : null, tool !== 'scatter' ? check('ขอบนุ่ม', 'soft') : null); };
  if (tool === 'select') { b.append(h3('ย้าย'), el('div', { class: 'row' }, el('label', null, 'ดูดเข้ากริด'), el('select', { class: 'tl-sel', onchange: e => { opt.snap = +e.target.value; }, html: [[0, 'อิสระ'], [0.25, '0.25'], [0.5, '0.5'], [1, '1'], [2, '2']].map(([v, n]) => `<option value="${v}"${v === opt.snap ? ' selected' : ''}>${n}</option>`).join('') })),
    el('p', { class: 'note', html: 'คลิกของ/กำแพง/พื้นชั้นบนเพื่อเลือก แล้วแก้ค่าละเอียดที่แผงขวา<br><kbd>Q</kbd><kbd>E</kbd> หมุน 15° (Shift = 5°)<br><kbd>[</kbd><kbd>]</kbd> ย่อ/ขยาย<br><kbd>PgUp</kbd><kbd>PgDn</kbd> ยกขึ้น/ลง<br><kbd>F</kbd> ซูมไปที่ของ<br><kbd>Ctrl+D</kbd> ทำซ้ำ • <kbd>Del</kbd> ลบ' })); }
  else if (tool === 'sculpt') {
    b.append(h3('ปั้นพื้น'), seg([['up', 'ยกขึ้น'], ['down', 'กดลง'], ['smooth', 'เกลี่ย'], ['flat', 'ปรับระดับ', 'ดึงพื้นให้เท่าจุดที่เริ่มลาก'], ['set', 'ตั้งความสูง'], ['noise', 'ขรุขระ'], ['ramp', 'ทางลาด', 'ลากจาก A ไป B = ทางลาดเรียบเชื่อมสองระดับ']], opt.smode, v => { opt.smode = v; renderOpts(); }));
    if (opt.smode === 'set') b.append(slider('ความสูง', 'hval', -5, 20, 0.25));
    if (opt.smode === 'ramp') b.append(slider('กว้าง', 'rad', 0.5, 20, 0.5, opt), check('ขอบนุ่ม', 'soft'), el('p', { class: 'note' }, 'ลากจากจุดต่ำไปจุดสูง: พื้นระหว่างทางจะเป็นทางลาดเรียบ (กว้าง = 2 × ค่านี้)')); else brush();
    b.append(el('p', { class: 'note', html: 'ทางชันเกิน ~58° (สูง 1.6 ต่อระยะ 1) เดินขึ้นไม่ได้ — ขึ้นสีแดง<br>กระโดดได้สูง ~1.4' }));
  } else if (tool === 'paint') { b.append(h3('พื้นผิว'), pal(SURF, opt.surf, i => { opt.surf = i; renderOpts(); })); brush(); b.append(el('p', { class: 'note' }, 'สีเขียว = เกมปลูกหญ้า 3D ให้เอง • โคลน/น้ำ/น้ำแข็ง/ลาวา ถูกบันทึกเป็นพื้นผิวพิเศษของเกม')); }
  else if (tool === 'wall') {
    b.append(h3('แบบกำแพง'), pal(MD.WALL_PRESET, opt.wall, i => { const P = MD.WALL_PRESET[i]; Object.assign(opt, { wall: i, wth: P.th, wh: P.h, wc: P.c, wm: P.m }); renderOpts(); }, 'one'),
      h3('ค่า'), slider('หนา', 'wth', 0.3, 4, 0.1), slider('สูง', 'wh', 0.4, 14, 0.1), el('div', { class: 'row' }, el('label', null, 'สี'), el('input', { type: 'color', value: opt.wc, oninput: e => { opt.wc = e.target.value; } })),
      check('เส้นโค้ง (ลากผ่านจุด)', 'wcurve'), check('พังได้ (แตกเป็นช่วง)', 'wbrk'), el('p', { class: 'note' }, 'เริ่มคลิกบนพื้นชั้นบน = กำแพง/ราวตั้งบนชั้นนั้น (ไม่ขวางข้างล่าง) • กำแพงยิ่งบางยิ่งใช้ที่ชนเยอะ'));
  } else if (tool === 'castle') {
    const k = opt.part, D = MD.PART[k], pp = partPP(k), keys = Object.keys(MD.PART);
    b.append(h3('ชิ้นส่วนปราสาท'), pal(keys.map(q => ({ n: MD.PART[q].n, c: MD.PART[q].c })), keys.indexOf(k), i => { opt.part = keys[i]; renderOpts(); need(); }),
      h3('ขนาด'), ...Object.entries(D.p).map(([q, v]) => slider(MD.PART_P[q], q, v[1], v[2], v[3], pp)),
      h3('ตัวเลือก'), ...Object.keys(D.f).map(q => check(MD.PART_F[q], q, pp)),
      el('div', { class: 'row' }, el('label', null, 'สี'), el('input', { type: 'color', value: pp.c, oninput: e => { pp.c = e.target.value; need(); } })),
      check('พังได้ (ทั้งชิ้น)', 'brk', pp), el('p', { class: 'note' }, 'พังได้ = ไม่มีฟันปลา/ทางเดินบนยอด (ชิ้นส่วนลอยไม่ได้) • ปิด = กำแพงทนทาน (ค่าเริ่ม)'),
      k === 'free' ? el('p', { class: 'note', html: 'ทรงอิสระ: คลิกทีละจุดวาดรูปปิดบนพื้น • คลิกจุดแรก/Enter/ดับเบิลคลิก = จบ • Backspace ถอยจุด • Esc ยกเลิก<br>ได้แล้วเลือกชิ้นแล้วลากจุดฟ้า (Alt+คลิกขอบ = เพิ่มจุด) • "หุบยอด" 1 = ทรงตรง, ต่ำลง = ยอดแคบ/แหลม' }) : null,
      h3('ดูดติด'), el('div', { class: 'row' }, el('label', null, 'กริดวาง'), el('select', { class: 'tl-sel', onchange: e => { opt.csnap = +e.target.value; need(); }, html: [[0, 'อิสระ'], [0.5, '0.5'], [1, '1'], [2, '2']].map(([v, n]) => `<option value="${v}"${v === opt.csnap ? ' selected' : ''}>${n}</option>`).join('') })),
      check('ปลายชิ้นดูดติดชิ้นอื่น (ระดับ+ตำแหน่ง)', 'psnap'),
      el('p', { class: 'note', html: 'ปลายกำแพง/ประตู/ทางเดิน/บันได/มุมตึก ดูดติดกันภายใน 1.6 ม.<br>บันได/ทางลาด: ปลายบนดูดติดยอดกำแพง (ตั้ง "สูงขึ้น" = ความสูงกำแพง)<br>เลือกชิ้นด้วยเครื่องมือเลือก แล้วแก้ขนาดที่แผงขวา' }));
  } else if (tool === 'floor') {
    b.append(h3('แบบ'), pal(MD.FLOOR_PRESET, opt.floor, i => { opt.floor = i; opt.fw = MD.FLOOR_PRESET[i].w; renderOpts(); }, 'one'), h3('ค่า'), slider('กว้าง', 'fw', 1, 30, 0.5), slider('สูงจากพื้น', 'fh', 0.5, 15, 0.25),
      MD.FLOOR_PRESET[opt.floor].ramp ? null : check('ลากข้าม: สูงเท่าปลายที่สูงกว่า', 'fauto'),
      el('p', { class: 'note', html: MD.FLOOR_PRESET[opt.floor].ramp ? 'ลากจากปลายล่างไปปลายบน: ทางลาดเชื่อมความสูงของสองจุด (ปลายบนวางบนชานได้)<br>เดินขึ้นได้ถ้าไม่ชันเกิน 1.6 ต่อ 1' : 'ลากจาก A ไป B = สะพานพาดสองฝั่ง • ขอบพื้นชั้นบนก้าวขึ้นได้ถ้าสูงไม่เกิน 1.1' }));
  } else if (tool === 'place' || tool === 'scatter') {
    if (tool === 'scatter') b.append(h3('โปรย'), slider('ขนาด (รัศมี)', 'rad', 0.5, 40, 0.5), slider('ความหนาแน่น', 'dens', 0.5, 12, 0.5), slider('สุ่มขนาด ±', 'rscale', 0, 0.6, 0.05));
    b.append(check('สุ่มหมุน', 'rrot'));
    const cats = tool === 'scatter' ? CATS.filter(c => !['sys', 'game', 'mode', 'prefab', 'room', 'deco'].includes(c[0])) : CATS;
    if (!cats.some(c => c[0] === opt.cat)) opt.cat = cats[0][0];
    b.append(h3('คลัง'), el('select', { class: 'tl-sel', style: 'width:100%;margin-bottom:6px', onchange: e => { opt.cat = e.target.value; renderOpts(); }, html: cats.map(([k, n]) => `<option value="${k}"${k === opt.cat ? ' selected' : ''}>${n}${OBJ_CATN(k)}</option>`).join('') }));
    const items = OBJ_IN(opt.cat);
    if (opt.cat === 'sys' || opt.cat === 'game' || opt.cat === 'prim' || opt.cat === 'mode' || opt.cat === 'room' || opt.cat === 'prefab' || opt.cat === 'deco') { b.append(pal(items.map(([t, D]) => ({ n: D.n, c: D.c })), items.findIndex(([t]) => t === opt.obj), i => { opt.obj = items[i][0]; renderOpts(); need(); }, 'one'));
      const D = OBJ[opt.obj]; if (D && D.note) b.append(el('p', { class: 'note' }, D.note));
      if (opt.cat === 'prim') b.append(h3('ขนาด/สี'), slider('กว้าง', 'sx', 0.2, 30, 0.1, opt.prim), slider('สูง', 'sy', 0.2, 30, 0.1, opt.prim), slider('ลึก', 'sz', 0.2, 30, 0.1, opt.prim), el('div', { class: 'row' }, el('label', null, 'สี'), el('input', { type: 'color', value: opt.prim.c, oninput: e => { opt.prim.c = e.target.value; need(); } })));
      if (opt.cat === 'game') b.append(el('p', { class: 'note' }, 'ของชุดนี้เกมใส่โมเดลและระบบพังให้เอง (ในนี้เห็นเป็นรูปทรงแทน)'));
      if (opt.cat === 'deco') b.append(el('p', { class: 'note' }, 'ของตกแต่งที่เกมวาดเอง (แบบห้องโถงในเกม): ไม่มีที่ชน ไม่อยู่ใน .glb • กล่อง/ทรงกระบอกใช้วัสดุ "หินปราสาท" ฯลฯ ตั้งในแผงขวา'));
      if (opt.cat === 'prefab') b.append(el('p', { class: 'note' }, items.length ? 'คลิกวางห้อง (จุดกลางห้อง) • Shift+ล้อ = หมุน 90° • ห้อง = แผนที่ชื่อ room-… ทำ/แก้ได้เหมือนแผนที่ทั่วไป' : 'ยังไม่มีห้อง — สร้างแผนที่ใหม่ชื่อ id ขึ้นต้นด้วย room- (พื้นราบ) แล้ววางของในห้อง'));
      if (opt.cat === 'mode') b.append(el('p', { class: 'note' }, 'ติ๊ก "บุกปราสาท" ในโหมดที่เล่นได้ แล้วดูตัวตรวจ • เกมสร้างแกน/เขตจุดเกิดเอง (ในนี้เห็นเป็นเครื่องหมาย) • กำแพง/ประตูเป้าหมาย = เลือกกำแพงแล้วตั้ง "เป้าหมายบุกปราสาท"'));
      if (opt.cat === 'room') b.append(el('p', { class: 'note' }, 'ของในห้องพังได้ (เกมวาดหน้าตาจริงเอง ในนี้เป็นกล่องแทน) • โต๊ะ/ม้านั่ง/ราว ปรับความยาวได้ • ยกจากพื้น = วางบนชั้นลอย'));
    } else {
      const g = el('div', { class: 'kit' });
      for (const a of items) { const img = el('span', { class: 'ph' }); const bt = el('button', { class: opt.obj === 'kit:' + a.id ? 'on' : '', title: a.name, onclick: () => { opt.obj = 'kit:' + a.id; renderOpts(); need(); } }, img, el('span', null, a.name.split(' · ')[0])); g.append(bt);
        thumb(a.id).then(u => { if (u) { const im = el('img', { src: u }); img.replaceWith(im); } }); }
      b.append(g);
      if (!items.length) b.append(el('p', { class: 'note' }, 'ยังไม่มี Asset ในหมวดนี้'));
      if (opt.cat === 'user') b.append(el('button', { class: 'tl-btn', style: 'width:100%;margin-top:8px', onclick: addAsset }, '＋ เพิ่ม Asset (.glb)'), el('p', { class: 'note' }, 'ไฟล์ .glb จาก Blender (1 หน่วย = 1 เมตร, ฐานอยู่ที่พื้น) เก็บใน assets/mapkit/'));
    }
  }
}
const OBJ_IN = cat => cat === 'prefab' ? list.filter(m => MD.isRoomId(m.id) && (!M || m.id !== M.id)).map(m => ['room:' + m.id, { n: m.name, c: '#c9a86a' }]) : cat === 'deco' || cat === 'sys' || cat === 'game' || cat === 'prim' || cat === 'mode' || cat === 'room' ? Object.entries(OBJ).filter(([, D]) => D.cat === cat) : KIT.list.filter(a => a.cat === cat);
const OBJ_CATN = k => { const n = OBJ_IN(k).length; return n ? ' (' + n + ')' : ''; };
function addAsset() {
  const inp = el('input', { type: 'file', accept: '.glb' });
  inp.onchange = async () => { const f = inp.files[0]; if (!f) return; const label = prompt('ชื่อที่จะแสดงในคลัง', f.name.replace(/\.glb$/i, '')); if (label == null) return;
    const name = f.name.replace(/\.glb$/i, '').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    try { const r = await (await fetch('/api/mb-asset?name=' + encodeURIComponent(name) + '&label=' + encodeURIComponent(label), { method: 'POST', body: await f.arrayBuffer() })).json(); if (!r.ok) throw new Error(r.err);
      KIT.tpl.delete(r.asset.id); KIT.thumbs.delete(r.asset.id); KIT.files.delete(r.asset.src); await loadKit(); opt.obj = 'kit:' + r.asset.id; opt.cat = 'user'; renderOpts(); stat('เพิ่ม Asset แล้ว', 'ok'); } catch (e) { stat('เพิ่ม Asset ไม่ได้: ' + e.message, 'err'); } };
  inp.click();
}

// ================= UI: side panel =================
function fld(label, it, key, o = {}) {   // bound field: number / text / color / checkbox / select
  const type = o.type || 'number', get = () => o.get ? o.get() : it[key];
  let inp;
  const commit = () => { let v = type === 'checkbox' ? (inp.checked ? 1 : 0) : type === 'number' ? (inp.value === '' ? null : +inp.value) : inp.value; if (type === 'number' && v != null && o.deg) v = v * Math.PI / 180; if (type === 'number' && v != null && o.min != null && v < o.min) v = o.min;
    pushUndo('o'); if (o.set) o.set(v); else if (v == null && !o.nullable) return; else it[key] = v; if (o.after) o.after(); else resync(); };
  if (type === 'select') inp = el('select', { class: 'tl-sel', onchange: commit, html: o.items.map(([v, n]) => `<option value="${v}"${String(v) === String(get()) ? ' selected' : ''}>${n}</option>`).join('') });
  else if (type === 'checkbox') { inp = el('input', { type, checked: !!get(), onchange: commit }); return el('label', { class: 'chk' }, inp, label); }
  else if (type === 'textarea') inp = el('textarea', { class: 'tl-in', value: get() || '', onchange: commit });
  else { let v = get(); if (type === 'number' && v != null) v = +(o.deg ? v * 180 / Math.PI : v).toFixed(o.deg ? 1 : 2); inp = el('input', { class: type === 'color' ? '' : 'tl-in', type, value: v == null ? '' : v, step: o.step || (o.deg ? 5 : 0.1), onchange: commit }); if (o.min != null) inp.min = o.min; if (o.ph) inp.placeholder = o.ph; }
  return el('div', { class: 'row' }, el('label', null, label), inp);
}
function decoFields(it) {   // inspector rows for dc_* decor
  const t = it.t.slice(3), F = [];
  if (t === 'box' || t === 'cyl' || t === 'cone') F.push(fld('วัสดุ', it, 'k', { type: 'select', items: MD.DECO_MAT, get: () => it.k || 'stone' }));
  if (t === 'box' || t === 'roof' || t === 'cloth') F.push(fld(t === 'roof' ? 'ยาว (สัน)' : 'กว้าง', it, 'sx', { min: 0.05 }));
  if (t !== 'flame' && t !== 'shield' && t !== 'chand') F.push(fld('สูง', it, 'sy', { min: 0.05 }));
  if (t === 'box' || t === 'roof') F.push(fld(t === 'roof' ? 'กว้าง' : 'ลึก', it, 'sz', { min: 0.05 }));
  if (t === 'cyl') F.push(fld('รัศมีบน', it, 'rt', { min: 0 }), fld('รัศมีล่าง', it, 'rb', { min: 0 }));
  if (t === 'cone') F.push(fld('รัศมี', it, 'r', { min: 0.05 }));
  if (t === 'cloth') F.push(fld('สี', it, 'c', { type: 'color' }));
  return F;
}
function section(title, open, ...kids) { const d = el('details', { class: 'sec', open }); d.append(el('summary', null, title), ...kids.filter(Boolean)); return d; }
function renderSide() {
  const box = $('side'); box.textContent = ''; if (!M) return;
  const it = find(sel);
  if (it) {
    const btns = el('div', { class: 'seg' }, el('button', { class: 'tl-btn', onclick: dupSel }, 'ทำซ้ำ'), el('button', { class: 'tl-btn', onclick: () => { sel.pt = null; delSel(); } }, 'ลบ'));
    if (sel.k === 'room') { const R = RM.get(it.ref), rooms = list.filter(m => MD.isRoomId(m.id) && m.id !== M.id);
      box.append(section('ห้อง (prefab) — ' + (R ? R.name : it.ref), true,
        fld('ห้อง', it, 'ref', { type: 'select', items: rooms.map(m => [m.id, m.name]), after: () => loadRooms().then(() => { syncAll(); renderSide(); changed(); }) }),
        fld('ตำแหน่ง X (กลางห้อง)', it, 'x'), fld('ตำแหน่ง Z (กลางห้อง)', it, 'z'), fld('หมุน (องศา, ทีละ 90)', it, 'rot', { deg: 1, step: 90 }),
        el('div', { class: 'seg' }, el('button', { class: 'tl-btn', onclick: () => { location.href = 'mapbuild.html?id=' + encodeURIComponent(it.ref); } }, 'เปิดแก้ห้องนี้'),
          el('button', { class: 'tl-btn', title: 'คัดลอกของในห้องเข้าแผนที่นี้ แก้ได้ทุกชิ้น (ไม่ผูกกับไฟล์ห้องแล้ว) • พื้นใต้ห้องปรับราบ + ทาสีตามห้อง', onclick: () => { if (!R) return; pushUndo('a'); MD.roomUnpack(M, it, R); sel = null; buildTerrain(); syncAll(); renderSide(); changed(); } }, 'แตกห้องเข้าแผนที่')),
        el('p', { class: 'note' }, R ? 'ขนาด ' + R.W + ' × ' + R.H + ' ม. • ของในห้องแก้ที่ไฟล์ห้อง (ทุกแผนที่ที่ใช้ห้องนี้เปลี่ยนตาม) • Q/E หมุน 90° • ลากเพื่อย้าย' : 'ยังโหลดห้องไม่ได้ (' + it.ref + ')'), btns)); }
    else if (sel.k === 'obj') { const D = OBJ[it.t], a = isKit(it) && KIT.byId.get(kitId(it)), d = dim(it);
      box.append(section((D ? D.n : a ? a.name : it.t), true,
        fld('ตำแหน่ง X', it, 'x'), fld('ตำแหน่ง Z', it, 'z'), it.t === 'light' || it.t === 'ring' || MD.isDeco(it.t) ? fld('สูงจากพื้น', it, 'y') : fld('ยกจากพื้น', it, 'y', { min: 0 }), fld('หมุน (องศา)', it, 'rot', { deg: 1 }),
        isKit(it) ? fld('ขนาด (เท่า)', it, 's', { min: 0.05 }) : null,
        isPrim(it) || it.t === 'house' ? fld(it.t === 'house' ? 'กว้าง (เท่า)' : 'กว้าง', it, 'sx', { min: 0.1 }) : null, isPrim(it) ? fld('สูง', it, 'sy', { min: 0.1 }) : null, isPrim(it) || it.t === 'house' ? fld(it.t === 'house' ? 'ลึก (เท่า)' : 'ลึก', it, 'sz', { min: 0.1 }) : null,
        isPrim(it) ? fld('สี', it, 'c', { type: 'color' }) : null, isPrim(it) ? fld('เรืองแสง', it, 'glow', { type: 'checkbox' }) : null,
        isPrim(it) || it.t === 'poly' ? fld('มองเห็น (ส่งภาพเข้าเกม)', it, 'vis', { type: 'checkbox', get: () => it.vis !== 0, set: v => { if (v) delete it.vis; else it.vis = 0; } }) : null,
        ...(MD.isDeco(it.t) ? decoFields(it) : []),
        it.t === 'core' ? fld('เลขแกน (ลำดับ)', it, 'n', { min: 1, step: 1 }) : null, it.t === 'core' ? fld('ขนาดแกน', it, 's', { min: 1 }) : null,
        it.t === 'sgA' || it.t === 'sgB' || it.t === 'phase' ? fld('เฟส', it, 'ph', { min: 1, step: 1 }) : null,
        it.t === 'phase' || it.t === 'ceil' ? fld('กว้าง (X)', it, 'sx', { min: 1 }) : null, it.t === 'phase' || it.t === 'ceil' ? fld('ยาว (Z)', it, 'sz', { min: 1 }) : null,
        it.t === 'ceil' ? fld('ใช้กับคนที่ต่ำกว่า (ม.)', it, 'zmax', { nullable: 1, ph: 'ทุกคน', min: 0 }) : null,
        MD.isRP(it.t) && MD.RPK[it.t.slice(3)].L ? fld('ความยาว', it, 'L', { min: 0.3 }) : null,
        it.t === 'light' ? fld('สีแสง', it, 'c', { type: 'color' }) : null, it.t === 'light' ? fld('ความสว่าง', it, 'int', { min: 0 }) : null, it.t === 'light' ? fld('ระยะ', it, 'dist', { min: 1 }) : null,
        d ? fld('ชนได้ (เดิน/ยิงไม่ผ่าน)', it, 'col', { type: 'checkbox', get: () => d.col }) : null,
        d && d.col ? fld('ขนาดที่ชน (เท่า)', it, 'cs', { get: () => it.cs == null ? d.cs : it.cs, min: 0.05 }) : null,
        d && d.col ? fld('พังได้', it, 'brk', { type: 'checkbox', get: () => it.brk == null ? d.brk : it.brk }) : null,
        D && D.cat === 'game' && it.t !== 'pchest' ? fld('พังได้', it, 'brk', { type: 'checkbox', get: () => it.brk == null ? 1 : it.brk }) : null, btns)); }   // houses / crates / barrels / trees: off = unbreakable
    else if (sel.k === 'wall') box.append(section('กำแพง' + (it.n ? ' — ' + it.n : ''), true, fld('หนา', it, 'th', { min: 0.2 }), fld('สูง', it, 'h', { min: 0.2 }), fld('สี', it, 'c', { type: 'color' }),
      fld('ฐาน (ความสูง)', it, 'base', { nullable: 1, ph: 'ตามพื้น' }), fld('เส้นโค้ง', it, 'curve', { type: 'checkbox' }), fld('ปิดวง', it, 'closed', { type: 'checkbox' }), fld('พังได้', it, 'brk', { type: 'checkbox' }),
      fld('วัสดุตอนพัง', it, 'm', { type: 'select', items: [['stone', 'หิน'], ['wood', 'ไม้'], ['ice', 'น้ำแข็ง']] }),
      fld('เป้าหมายบุกปราสาท', it, 'sg', { type: 'select', items: MD.SG_WALL, get: () => it.sg || '', after: () => { if (it.sg && !it.brk) it.brk = 1; resync(); renderSide(); } }),
      fld('มองเห็น (ส่งภาพเข้าเกม)', it, 'vis', { type: 'checkbox', get: () => it.vis !== 0, set: v => { if (v) delete it.vis; else it.vis = 0; } }),
      fld('ระบบ', it, 'sys', { type: 'select', items: MD.SYS_WALL, get: () => it.sys || '' }), fld('สไตล์', it, 'style', { type: 'select', items: MD.STYLE, get: () => it.style || '' }),
      el('p', { class: 'note' }, it.pts.length + ' จุด • ยาว ' + MD.pathLen(MD.wallPath(it)).toFixed(1) + ' • ลากจุดขาวเพื่อดัด • Alt+คลิกบนกำแพง = เพิ่มจุด • เลือกจุดแล้ว Del = ลบจุด • เว้นช่อง "ฐาน" ว่าง = ตั้งตามพื้น'), btns));
    else if (sel.k === 'part') { const D = MD.PART[it.k];
      box.append(section('ปราสาท — ' + D.n, true, fld('ตำแหน่ง X', it, 'x'), fld('ตำแหน่ง Z', it, 'z'), fld('หมุน (องศา)', it, 'rot', { deg: 1 }), fld('ฐาน (ความสูง)', it, 'base', { nullable: 1, ph: 'ตามพื้น' }),
        ...Object.entries(D.p).map(([q, v]) => fld(MD.PART_P[q], it, q, { min: v[1], step: v[3] })), ...Object.keys(D.f).map(q => fld(MD.PART_F[q], it, q, { type: 'checkbox' })),
        fld('สี', it, 'c', { type: 'color' }), fld('พังได้ (ทั้งชิ้น)', it, 'brk', { type: 'checkbox' }), fld('สไตล์', it, 'style', { type: 'select', items: MD.STYLE, get: () => it.style || '' }),
        it.pts ? el('p', { class: 'note' }, it.pts.length + ' จุด • ลากจุดฟ้าเพื่อปั้นรูป • Alt+คลิกที่ขอบ = เพิ่มจุด • เลือกจุดแล้ว Del = ลบจุด • ชนเฉพาะขอบรูป (ข้างในกลวง) ไม่มีพื้นเดินบนยอด/พังไม่ได้') : null,
        el('p', { class: 'note' }, 'ปลายชิ้นดูดติดกันตอนลาก/วาง • เว้นช่อง "ฐาน" ว่าง = ตั้งตามพื้น • พังได้ = ไม่มีฟันปลา/ทางเดินบนยอด • บานประตูพังได้เสมอ'), btns)); }
    else box.append(section('พื้นชั้นบน' + (it.n ? ' — ' + it.n : ''), true, fld('ตำแหน่ง X', it, 'x'), fld('ตำแหน่ง Z', it, 'z'), fld('กว้าง', it, 'w', { min: 0.5 }), fld('ยาว', it, 'd', { min: 0.5 }), fld('หมุน (องศา)', it, 'rot', { deg: 1 }),
      fld('สูง (ปลายต้น)', it, 'y'), fld('สูง (ปลายท้าย)', it, 'y2', { get: () => it.y2 == null ? it.y : it.y2 }), fld('หนา', it, 'th', { min: 0.1 }), fld('สี', it, 'c', { type: 'color' }), fld('ทำเป็นขั้นบันได', it, 'steps', { type: 'checkbox' }),
      fld('มองเห็น (ส่งภาพเข้าเกม)', it, 'vis', { type: 'checkbox', get: () => it.vis !== 0, set: v => { if (v) delete it.vis; else it.vis = 0; } }),
      fld('ระบบ', it, 'sys', { type: 'select', items: MD.SYS_FLOOR, get: () => it.sys || '' }), fld('สไตล์', it, 'style', { type: 'select', items: MD.STYLE, get: () => it.style || '' }),
      el('div', { class: 'seg' }, el('button', { class: 'tl-btn', title: 'ปลายต้นลงมาแตะพื้นตรงนั้น', onclick: () => editSel(f => { const c = MD.floorCorners(f); f.y = +MD.gh(M, (c[0][0] + c[1][0]) / 2, (c[0][1] + c[1][1]) / 2).toFixed(2); }) }, 'ปลายต้นแตะพื้น'), el('button', { class: 'tl-btn', onclick: () => editSel(f => { f.y2 = f.y; }) }, 'ทำให้ราบ')),
      el('p', { class: 'note' }, 'ใต้พื้นสูง ' + (Math.min(it.y, it.y2 == null ? it.y : it.y2) - (it.th || 0.4) - MD.gh(M, it.x, it.z)).toFixed(1) + ' (ต้อง ≥ 2.8 ถึงเดินลอดได้)'), btns));
  }
  const mset = (k, o) => fld(o.label, M, k, Object.assign({ after: () => { applySky(); changed(); renderList(); } }, o));
  box.append(section('แผนที่', !it,
    mset('name', { label: 'ชื่อ', type: 'text' }), mset('desc', { label: 'คำอธิบาย', type: 'text' }),
    el('div', { class: 'row' }, el('label', null, 'ขนาด'), el('span', { style: 'flex:1;font-family:var(--fu)' }, M.W + ' × ' + M.H + ' ม.'), el('button', { class: 'tl-btn', style: 'padding:2px 8px', onclick: resizeDlg }, 'เปลี่ยน')),
    mset('sky', { label: 'ท้องฟ้า', type: 'select', items: MD.SKY }),
    mset('style', { label: 'สไตล์หลัก', type: 'select', items: MD.STYLE, get: () => M.style || '' }),
    fld('หมอก: สี', M, 'fog', { type: 'color', get: () => (M.fog || fogDef())[0], set: v => { M.fog = [v, (M.fog || fogDef())[1], (M.fog || fogDef())[2]]; }, after: () => { applySky(); changed(); } }),
    fld('หมอก: เริ่ม', M, 'fog', { get: () => (M.fog || fogDef())[1], set: v => { const f = M.fog || fogDef(); M.fog = [f[0], v || 0, f[2]]; }, after: () => { applySky(); changed(); }, step: 10 }),
    fld('หมอก: สุด', M, 'fog', { get: () => (M.fog || fogDef())[2], set: v => { const f = M.fog || fogDef(); M.fog = [f[0], f[1], v || 300]; }, after: () => { applySky(); changed(); }, step: 10 }),
    mset('music', { label: 'เพลง', type: 'select', items: MD.MUSIC.map(m => [m, m || '(ค่าเริ่มต้น)']) }),
    mset('weather', { label: 'อากาศ', type: 'text', ph: 'clear:60,rain:40' }),
    mset('skirt', { label: 'ขอบนอกสนาม', step: 5, min: 0 }),
    el('p', { class: 'note' }, 'ขอบนอกสนาม = พื้นที่ยื่นเลยขอบเล่นออกไป (หน่วย ม.) ให้ไม่เห็นขอบแผนที่ลอย')));
  const modes = el('div', { class: 'pal' }); for (const [k, n] of MD.MODES) { const c = el('input', { type: 'checkbox', checked: M.modes.includes(k), onchange: () => { pushUndo('o'); M.modes = MD.MODES.map(m => m[0]).filter(m => m === k ? c.checked : M.modes.includes(m)); changed(); colDirty(); } }); modes.append(el('label', { class: 'chk' }, c, n)); }
  const fx = el('div', { class: 'pal' }); for (const [k, n] of MD.FXS) { const on = M.fx.some(f => f.split(':')[0] === k), c = el('input', { type: 'checkbox', checked: on, onchange: () => { pushUndo('o'); M.fx = M.fx.filter(f => f.split(':')[0] !== k); if (c.checked) M.fx.push(k); changed(); } }); fx.append(el('label', { class: 'chk' }, c, n)); }
  box.append(section('โหมดที่เล่นได้', false, modes, check('อยู่ในรายการสุ่มแผนที่', 'random', M, changed), check('ให้เกมสุ่มวางลัง/ถังเอง (ถ้าไม่ได้วางเอง)', 'autoProps', M, () => { changed(); colDirty(); })),
    section('เอฟเฟกต์บรรยากาศ', false, fx));
  box.append(el('details', { class: 'sec', open: true, id: 'chkSec' }, el('summary', null, 'ตรวจก่อนส่งเข้าเกม'), el('ul', { class: 'lst', id: 'chk' })));
  renderCheck();
}
const fogDef = () => M.sky === 'day' ? ['#a9c4d6', 110, 420] : M.sky === 'sunset' ? ['#d8a888', 130, 520] : ['#16223a', 90, 380];
function renderCheck() {
  const ul = $('chk'); if (!ul || !M) return; ul.textContent = '';
  let G; try { G = gameData(); } catch (e) { ul.append(el('li', { class: 'err' }, 'คำนวณไม่ได้: ' + e.message)); return; }
  const loading = M.objs.some(o => isKit(o) && !tplNow(kitId(o)) && KIT.byId.has(kitId(o))), lost = M.objs.filter(o => isKit(o) && !KIT.byId.has(kitId(o))).length;
  if (loading) ul.append(el('li', { class: 'warn' }, 'กำลังโหลดโมเดล…'));
  if (lost) ul.append(el('li', { class: 'err' }, 'มีของ ' + lost + ' ชิ้นที่หา Asset ไม่เจอ (จะไม่ถูกส่งออก)'));
  for (const r of MD.check(ALLM(), G)) { const li = el('li', { class: r.lv }, r.t); if (r.at) li.append(' ', el('a', { onclick: () => { cam.x = r.at[0]; cam.z = r.at[1]; cam.dist = Math.min(cam.dist, 35); camApply(); } }, '[ไปดู]')); ul.append(li); }
  const c = G.counts; $('sInfo').textContent = `กำแพง ${M.walls.length} • ชั้นบน ${M.floors.length} • ปราสาท ${M.parts.length} • ของ ${M.objs.length} • ที่ชน ${c.obs} • พังได้ ${c.brk}`;
}

// ================= sky / light preview =================
function applySky() {
  const s = show.sky ? M.sky : 'studio', fog = M.fog || fogDef();
  if (s === 'studio') { scene.background = new THREE.Color(css('--bg0') || '#161616'); scene.fog = null; hemi.color.set('#ffffff'); hemi.groundColor.set('#50545c'); hemi.intensity = 1.4; sun.intensity = 2.2; sun.color.set('#ffffff'); }
  else { const night = s === 'night' || s === 'indoor';
    scene.background = new THREE.Color(fog[0]); scene.fog = new THREE.Fog(fog[0], +fog[1], +fog[2] * 1.6);
    if (night) { hemi.color.set('#a8b8e8'); hemi.groundColor.set('#2a3448'); hemi.intensity = 0.9; sun.intensity = 1.2; sun.color.set('#c8d8ff'); }
    else { hemi.color.set(s === 'sunset' ? '#ffd0a0' : '#ffe8d0'); hemi.groundColor.set('#4a5a2a'); hemi.intensity = 1.1; sun.intensity = s === 'sunset' ? 1.9 : 2.4; sun.color.set(s === 'sunset' ? '#ffc890' : '#fff0dc'); } }
  need();
}

// ================= save / load =================
function stat(t, cls) { const s = $('stat'); s.textContent = t; s.className = cls || ''; }
function changed() { dirty = true; GD = null; stat('ยังไม่ได้บันทึก', 'warn'); clearTimeout(saveT); if (online && M.id) saveT = setTimeout(save, 4000); need(); }
async function save() {
  clearTimeout(saveT); if (!M) return false;
  if (!M.id) { stat('ยังไม่มี id', 'err'); return false; }
  try { const r = await (await fetch('/api/mb?id=' + M.id, { method: 'POST', body: JSON.stringify({ map: MD.pack(M) }) })).json(); if (!r.ok) throw new Error(r.err);
    dirty = false; stat('บันทึกแล้ว ' + new Date().toLocaleTimeString('th-TH'), 'ok'); localStorage.setItem('mb_last', M.id); return true; }
  catch (e) { stat('บันทึกไม่ได้: ' + e.message + (online ? '' : ' (เปิดผ่าน Tools.bat)'), 'err'); return false; }
}
async function refreshList() { try { const r = await (await fetch('/api/mb-list')).json(); list = r.maps || []; online = true; } catch (e) { online = false; list = []; } renderList(); }
function renderList() { const s = $('mapSel'); s.innerHTML = ''; const ids = new Set(list.map(m => m.id));
  if (M && M.id && !ids.has(M.id)) s.append(el('option', { value: M.id }, M.name));
  for (const m of list) s.append(el('option', { value: m.id }, (M && m.id === M.id ? M.name : m.name) + (m.game ? '  ✓ในเกม' : '')));
  if (M) s.value = M.id; }
async function openMap(id) {
  if (dirty) await save();
  try { const r = await (await fetch('/api/mb?id=' + id)).json(); if (!r.ok) throw new Error(r.err); setMap(MD.unpack(r.map)); localStorage.setItem('mb_last', id); stat('เปิดแล้ว', 'ok'); } catch (e) { stat('เปิดไม่ได้: ' + e.message, 'err'); }
}
function setMap(m) {
  M = m; sel = null; undo = []; redo = []; draft = null; dirty = false; GD = null;
  buildTerrain(); applySky(); syncAll(); fit(); renderList(); renderSide(); renderOpts();
  if (M.rooms && M.rooms.length) loadRooms().then(() => { if (M === m) { syncAll(); renderSide(); } });   // room prefabs (room-*.json)
  for (const o of M.objs) if (isKit(o)) kitTpl(kitId(o)).then(() => { clearTimeout(setMap.t); setMap.t = setTimeout(() => { if (M === m) { syncObjs(); updSel(); colDirty(); } }, 60); });
  $('vmsg').textContent = '';
}
function dlg(title, body, okText, onOk) {
  const d = $('dlg'); d.textContent = ''; const err = el('p', { class: 'note', style: 'color:var(--serr)' });
  d.append(el('h2', null, title), body, err, el('div', { class: 'btns' }, el('button', { class: 'tl-btn', onclick: () => d.close() }, 'ยกเลิก'), el('button', { class: 'tl-btn pri', onclick: async () => { try { const r = await onOk(); if (r !== false) d.close(); } catch (e) { err.textContent = e.message; } } }, okText)));
  d.showModal();
}
function newDlg() {
  const v = { name: 'แผนที่ใหม่', id: '', W: 100, H: 70, surf: 0 }, body = el('div');
  const f = (label, key, type, extra) => { const i = el('input', Object.assign({ class: 'tl-in', type: type || 'text', value: v[key], oninput: () => { v[key] = type === 'number' ? +i.value : i.value; } }, extra || {})); body.append(el('div', { class: 'row' }, el('label', null, label), i)); return i; };
  f('ชื่อ', 'name'); f('id (อังกฤษ)', 'id', 'text', { placeholder: 'เช่น cliffs' }); f('กว้าง (ม.)', 'W', 'number', { min: 30, max: 260, step: 10 }); f('ยาว (ม.)', 'H', 'number', { min: 30, max: 260, step: 10 });
  body.append(el('div', { class: 'row' }, el('label', null, 'พื้นเริ่มต้น'), el('select', { class: 'tl-sel', onchange: e => { v.surf = +e.target.value; }, html: SURF.map((s, i) => `<option value="${i}">${s.n}</option>`).join('') })),
    el('p', { class: 'note', html: 'ขนาดเทียบ: ลานปราสาท 80×50 (เล็ก) • ห้องโถง 120×75 • ทุ่งหญ้า 150×90 (ใหญ่)<br>2–6 คน แนะนำด้านยาว 100–150' }));
  dlg('แผนที่ใหม่', body, 'สร้าง', async () => {
    const id = v.id.trim().toLowerCase(); if (!/^[a-z0-9][a-z0-9_-]{0,40}$/.test(id)) throw new Error('id ใช้ได้เฉพาะ a-z 0-9 _ -');
    if (list.some(m => m.id === id)) throw new Error('มี id นี้แล้ว');
    const W = clamp(Math.round(v.W), 30, 260), H = clamp(Math.round(v.H), 30, 260);
    if (dirty) await save();
    const m = MD.newMap({ id, name: v.name || id, W, H, surf: v.surf }); setMap(m); if (!await save()) throw new Error($('stat').textContent); await refreshList();
  });
}
function resizeDlg() {
  const v = { W: M.W, H: M.H }, body = el('div'); for (const [l, k] of [['กว้าง (ม.)', 'W'], ['ยาว (ม.)', 'H']]) { const i = el('input', { class: 'tl-in', type: 'number', min: 30, max: 260, value: v[k], oninput: () => { v[k] = +i.value; } }); body.append(el('div', { class: 'row' }, el('label', null, l), i)); }
  body.append(el('p', { class: 'note' }, 'ของเดิมจะอยู่ตรงกลาง ขยาย = พื้นขอบถูกยืดออก ย่อ = ส่วนที่เกินถูกตัด (กด ↶ ย้อนได้)'));
  dlg('เปลี่ยนขนาดแผนที่', body, 'ตกลง', () => { const W = clamp(Math.round(v.W), 30, 260), H = clamp(Math.round(v.H), 30, 260); pushUndo('a'); MD.resize(M, W, H); buildTerrain(); syncAll(); fit(); renderSide(); changed(); });
}

// ================= export to the game =================
function groundExport() {   // ground mesh for the .glb: vertex colours (no overlay), optional coarser step, skirt beyond the play area
  const { nx, ny } = M, step = nx * ny > 400000 ? 4 : nx * ny > 70000 ? 2 : 1, cols = Math.floor((nx - 1) / step) + 1, rows = Math.floor((ny - 1) / step) + 1, sk = M.skirt > 0 ? 1 : 0, CC = cols + sk * 2, RR = rows + sk * 2, n = CC * RR;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Uint8Array(n * 4), idx = n > 65535 ? new Uint32Array((CC - 1) * (RR - 1) * 6) : new Uint16Array((CC - 1) * (RR - 1) * 6), tmp = [0, 0, 0];
  for (let r = 0; r < RR; r++) for (let c = 0; c < CC; c++) {
    const k = r * CC + c, gi = clamp((c - sk) * step, 0, nx - 1), gj = clamp((r - sk) * step, 0, ny - 1), out = c < sk || r < sk || c >= CC - sk || r >= RR - sk;
    const ox = c < sk ? -M.skirt : c >= CC - sk ? M.skirt : 0, oz = r < sk ? -M.skirt : r >= RR - sk ? M.skirt : 0;
    pos[k * 3] = gi * C + ox; pos[k * 3 + 1] = M.hg[gj * nx + gi]; pos[k * 3 + 2] = gj * C + oz;
    if (out) { nor[k * 3 + 1] = 1; } else vnormal(gi, gj, nor, k * 3);
    vcolor(gi, gj, tmp, 0, false); const L = v => Math.round(255 * clamp(v, 0, 1)); col[k * 4] = L(tmp[0]); col[k * 4 + 1] = L(tmp[1]); col[k * 4 + 2] = L(tmp[2]); col[k * 4 + 3] = 255;
  }
  let q = 0; for (let r = 0; r < RR - 1; r++) for (let c = 0; c < CC - 1; c++) { const a = r * CC + c, b = a + 1, d = a + CC, e = d + 1; idx[q++] = a; idx[q++] = d; idx[q++] = b; idx[q++] = b; idx[q++] = d; idx[q++] = e; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 4, true)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, name: 'mb_ground' })); m.name = 'ground'; return m;
}
async function buildExport() {
  await Promise.all(M.objs.filter(isKit).map(o => kitTpl(kitId(o)))); syncObjs(); syncParts(); GD = null;
  const G = gameData(), sc = new THREE.Scene(), R = new THREE.Group(); R.name = 'mb_root'; R.position.set(-M.W / 2, 0, -M.H / 2); sc.add(R);
  R.add(groundExport());
  // static meshes merge per material AND style (userData.style on the merged node → game style presets, MAP-STANDARD §1.5)
  const bucket = new Map(), put = (mesh, geo, st) => { st = st || M.style || ''; const k = mesh.material.uuid + '|' + st; if (!bucket.has(k)) bucket.set(k, { m: mesh.material, g: [], st }); bucket.get(k).g.push(geo); };
  const AM = ALLM(), styleOf = (k, id) => { const it = (k === 'wall' ? AM.walls : k === 'floor' ? AM.floors : AM.parts).find(q => q.id === id); return it && it.style; };
  let tris = 0;
  for (const w of gWalls.children) { const wd = AM.walls.find(q => q.id === w.userData.wid); if (wd && (wd.sg || wd.sys === 'fence' || wd.vis === 0)) continue;   // siege targets + burnable fences: the game draws them
    const gi = G.brkOf.get('w' + w.userData.wid + ':' + w.userData.ci), st = styleOf('wall', w.userData.wid) || M.style;
    if (gi != null) { const c = new THREE.Mesh(w.geometry, w.material); c.name = w.name; c.userData = { brk: gi }; if (st) c.userData.style = st; R.add(c); } else put(w, w.geometry, st); }
  for (const f of gFloors.children) { const fd = AM.floors.find(q => q.id === f.userData.wid); if (fd && fd.vis === 0) continue; f.updateMatrix(); put(f, f.geometry.clone().applyMatrix4(f.matrix), styleOf('floor', f.userData.wid)); }
  const flat = g => { g = g.index ? g.toNonIndexed() : g; g.deleteAttribute('uv'); return g; };   // same attribute set as the hand-made wall/floor geometry so they merge
  for (const g of gParts.children) for (const nd of g.children) {
    const pst = styleOf('part', g.userData.pid);
    if (nd.userData.pf) { nd.updateMatrix(); put(nd, flat(nd.geometry.clone().applyMatrix4(nd.matrix)), pst); continue; }
    const o = nd.userData.po, gi = G.brkOf.get('o' + o.id);
    if (gi != null) { const c = nd.clone(true); c.userData = { brk: gi }; if (pst || M.style) c.userData.style = pst || M.style; c.name = 'part_' + o.id; c.traverse(m => { if (m !== c) m.userData = {}; }); R.add(c); }
    else { nd.updateMatrix(); nd.traverse(m => { if (m.isMesh) put(m, flat(m.geometry.clone().applyMatrix4(nd.matrix)), pst); }); }
  }
  let n = 0; for (const b of bucket.values()) { const g = b.g.length > 1 ? mergeGeometries(b.g, false) : b.g[0]; const m = new THREE.Mesh(g, b.m); m.name = 'mb_static_' + (n++); if (b.st) m.userData.style = b.st; R.add(m); }
  for (const o of AM.objs) { if (!isVisual(o) || o.vis === 0 || (isKit(o) && !tplNow(kitId(o)))) continue; const src = objNode.get(o.id); if (!src) continue; const c = src.clone(true); const a = isKit(o) && KIT.byId.get(kitId(o));
    c.userData = {}; const gi = G.brkOf.get('o' + o.id); if (gi != null) c.userData.brk = gi; c.traverse(m => { if (m !== c) m.userData = {}; if (m.isMesh && ((a && a.ns) || o.glow)) m.userData.ns = 1; }); R.add(c); }
  sc.updateMatrixWorld(true); sc.traverse(o => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  const glb = await new GLTFExporter().parseAsync(sc, { binary: true });
  return { G, glb, tris: Math.round(tris) };
}
function ab64(buf) { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
async function exportGame() {
  if (!M.id) return false; stat('กำลังส่งเข้าเกม…');
  try { if (!await save()) return false; const { G, glb, tris } = await buildExport();
    const r = await (await fetch('/api/mb-export?id=' + M.id, { method: 'POST', body: JSON.stringify({ data: G.data, glb: ab64(glb) }) })).json(); if (!r.ok) throw new Error(r.err);
    stat(`ส่งเข้าเกมแล้ว (v${r.v}) • ${r.glb_kb} KB • ${tris.toLocaleString()} สามเหลี่ยม`, r.glb_kb > 5000 || tris > 150000 ? 'warn' : 'ok'); await refreshList(); return true; }
  catch (e) { console.error(e); stat('ส่งเข้าเกมไม่ได้: ' + e.message, 'err'); return false; }
}

// ================= loop =================
let dirtyView = true, last = performance.now();
function need() { dirtyView = true; }
function status() { $('sPos').textContent = hover ? `x ${hover.x.toFixed(1)}  z ${hover.z.toFixed(1)}  สูง ${hover.y.toFixed(2)}` : '–'; }
function frame(t) {
  requestAnimationFrame(frame); const dt = Math.min(0.05, (t - last) / 1000); last = t; if (!M) return;
  if (stroke) { if (stroke.k === 'sculpt') sculpt(dt, stroke.inv); else if (stroke.k === 'paint') paintSurf(stroke.inv); else scatter(dt, stroke.inv); dirtyView = true; }
  const w = host.clientWidth, h = host.clientHeight; if (cv.width !== Math.round(w * renderer.getPixelRatio()) || cv.height !== Math.round(h * renderer.getPixelRatio())) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirtyView = true; }
  if (!dirtyView) return; dirtyView = false;
  drawRing(); updGhost(); updPartGhost(); gCol.visible = show.col; renderer.render(scene, camera);
}

// ================= boot =================
$('bNew').onclick = newDlg; $('bSave').onclick = save; $('bUndo').onclick = doUndo; $('bRedo').onclick = doRedo; $('bExport').onclick = exportGame;
$('bPlay').onclick = async () => { const w = window.open('about:blank', 'mb_play'); if (await exportGame()) w.location = 'index.html?nosw&playmap=' + M.id + (M.modes.length === 1 && M.modes[0] === 'siege' ? '&pm=siege' : '') + '&t=' + Date.now(); else w.close(); };
$('mapSel').onchange = e => openMap(e.target.value);
$('vTop').onclick = () => { cam.pitch = 1.55; cam.yaw = 0; camApply(); }; $('vFit').onclick = fit;
$('oSteep').onchange = e => { show.steep = e.target.checked; updTerrain(0, 0, M.nx - 1, M.ny - 1); need(); };
$('oCol').onchange = e => { show.col = e.target.checked; buildCol(); need(); };
$('oArea').onchange = e => { show.area = e.target.checked; gObjs.traverse(m => { if (m.userData.area) m.visible = show.area; }); need(); };
$('oGrid').onchange = e => { show.grid = e.target.checked; buildGrid(); need(); };
$('oSky').onchange = e => { show.sky = e.target.checked; applySky(); };
addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
window.__mb = { get M() { return M; }, get RX() { return RX; }, loadRooms, MD, opt, placePart, syncParts, partNode, gParts, castleProto, cam, camApply, setTool, gameData, buildExport, exportGame, save, setMap, syncAll, need, kitTpl, KIT, get sel() { return sel; }, set sel(v) { sel = v; renderSide(); updSel(); }, pushUndo, changed, colDirty, updTerrain, afterTerrain, applyRamp, makeFloor, placeObj, doUndo };
(async () => {
  renderTools(); $('hint').textContent = HINT[tool];
  await Promise.all([loadKit(), refreshList()]);
  const want = new URLSearchParams(location.search).get('id') || localStorage.getItem('mb_last');
  if (want && list.some(m => m.id === want)) await openMap(want); else if (list.length) await openMap(list[0].id);
  if (!M) { setMap(MD.newMap({ id: '', name: 'ยังไม่ได้ตั้งชื่อ' })); $('vmsg').textContent = ''; stat(online ? 'กด "＋ ใหม่" เพื่อเริ่มแผนที่' : 'ออฟไลน์ — เปิดผ่าน Tools.bat เพื่อบันทึก', 'warn'); if (online) newDlg(); }
  requestAnimationFrame(frame);
})();
