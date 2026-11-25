// Map Builder (mapbuild.html) — 3D editor for real game maps. Data model + game export: mapbuild/model.js • format/how-to: guides/MAP-BUILDER.md
// Saves the source to maps/build/<id>.json and exports assets/maps/<id>.json + .glb (+ manifest) through tools/serve.py (/api/mb*).
// Scene: everything lives in `root` (map coords: x east 0..W, z south 0..H, y up); root is shifted so the map centre is the world origin, like the game.
// Mouse: left = current tool • right-drag = orbit • middle-drag / Space+drag = pan • wheel = zoom • gizmo on the selection (1 move / 2 rotate / 3 size / 0 off).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import * as MD from './model.js';
import * as BD from './backdrop.js';
const { C, SURF, OBJ } = MD;

const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const css = n => getComputedStyle(document.body).getPropertyValue(n).trim();
const el = (tag, props, ...kids) => { const e = document.createElement(tag); if (props) for (const k in props) { if (k === 'class') e.className = props[k]; else if (k === 'html') e.innerHTML = props[k]; else if (k.startsWith('on')) e.addEventListener(k.slice(2), props[k]); else if (k === 'style') e.style.cssText = props[k]; else e[k] = props[k]; } for (const c of kids) if (c != null) e.append(c); return e; };

// ================= state =================
let M = null, online = false, dirty = false, saveT = 0, list = [];
let tool = 'select', sel = null, msel = [];   // sel = {k:'wall'|'floor'|'obj', id, pt?} = primary (Inspector, gizmo) • msel = more items picked with Shift/Ctrl
const opt = { wk: 'lake', wdig: 1, wdep: 1.5, rk: 'cobble', rw: 4, rc: 0, smode: 'up', rad: 4, str: 4, soft: 1, hval: 2, surf: 0, wall: 0, wth: 1, wh: 3.5, wc: '#8a8478', wm: 'stone', wcurve: 0, wbrk: 0, floor: 0, fw: 4, fh: 3, fauto: 1, obj: 'spawn', cat: 'sys',
  rrot: 1, rscale: 0, dens: 3, snap: 0, part: 'wall', pp: {}, csnap: 1, psnap: 1, prim: { c: '#8a8478', sx: 2, sy: 2, sz: 2 }, pn: { pre: 0, mat: 'brick', m: 'p', thru: 1, sy: 3.6, T: 0.3, cs: 0.6, hp: 0, y: 0, draw: 'line', sides: 12 },
  bm: 'up', brad: 40, bstr: 4, bh: 0, bs: 1, btd: 200, sr: 6, sh: 20, bpre: 'coast', bseed: 1 };   // b* = backdrop tool
const show = { steep: true, col: false, grid: false, sky: true, area: true, bd: true };
let undo = [], redo = [];
let hover = null, stroke = null, drag = null, draft = null, ghostRot = 0, spaceDown = false;
const fly = new Set();   // keys held while right-dragging (WASD fly, Q/E down/up)
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
// selection gizmo (see 'gizmo' below) — made before the canvas listeners so its pointerdown runs first and sets tc.dragging
const gAnchor = new THREE.Object3D(); root.add(gAnchor);
const tc = new TransformControls(camera, cv); tc.setSize(0.9); scene.add(tc);
tc.traverse(o => { o.renderOrder = 30; });

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
const SURF_PAL = SURF.map(s => Object.assign({ img: 'mapbuild/surf/' + s.k + '.jpg' }, s));   // in-game look of each surface (tools/surf-thumbs.mjs)
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
const CATS = [['sys', 'Game Points'], ['mode', 'Siege Mode'], ['water', 'Water'], ['prefab', 'Room Prefabs'], ['room', 'Room / Breakables'], ['deco', 'Decor (game-drawn)'], ['game', 'Game Objects'], ['prim', 'Primitives'], ['collide', 'Collision Shapes'], ['tree', 'Trees'], ['rock', 'Rocks'], ['plant', 'Small Plants'], ['build', 'Buildings'], ['road', 'Roads / Paving'], ['prop', 'Props'], ['light', 'Lamps/Lights'], ['fence', 'Fences'], ['ruin', 'Ruin (modular)'], ['user', 'Custom']];
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
const tiltOk = o => !!o && !!o.t && (isKit(o) || isPrim(o) || o.t === 'poly');   // visual objects that may tilt (rx/rz, look only: game collision stays the rot footprint)
const isVisual = o => isKit(o) || isPrim(o);   // exported into the .glb (everything else is a marker the game fills in itself)
function dim(o) {   // footprint for collision (model.js objCircles)
  if (MD.DECO_SHAPE.has(o.t) && o.t !== 'dc_arch') {   // decor: centred on its height (game dkGeo) • collision only when ticked (col 1)
    if (o.t === 'dc_cone') return { ex: o.r || 0.5, ez: o.r || 0.5, h: o.sy || 1, yo: -(o.sy || 1) / 2, col: o.col ? 1 : 0, brk: 0, m: 'stone', cs: 0.92 };
    if (o.t === 'dc_dome' || o.t === 'dc_rock') return { ex: (o.sx || 1) / 2, ez: (o.sz || 1) / 2, h: o.sy || 1, yo: -(o.sy || 1) / 2, col: o.col ? 1 : 0, brk: 0, m: 'stone', cs: 0.92 };
    const sy = o.sy || 1, cy = o.t === 'dc_cyl', r = cy ? Math.max(o.rt != null ? o.rt : (o.sx || 1) / 2, o.rb != null ? o.rb : (o.sx || 1) / 2) : 0;
    return { ex: cy ? r : (o.sx || 1) / 2, ez: cy ? r : (o.sz || 1) / 2, h: sy, yo: -sy / 2, col: o.col ? 1 : 0, brk: 0, m: 'stone', cs: cy ? 0.92 : 1 }; }
  if (isPrim(o)) { const sx = o.sx || 1, sz = o.sz || 1, round = o.t === 'cyl' || o.t === 'ball' || o.t === 'cone'; return { ex: sx / 2, ez: sz / 2, h: (o.sy || 1) * (o.t === 'ball' ? 0.84 : 1), col: o.col == null ? 1 : o.col, brk: 0, m: o.m || 'stone', cs: round ? 0.92 : 1 }; }
  if (isKit(o)) { const a = KIT.byId.get(kitId(o)), t = tplNow(kitId(o)); if (!a || !t) return null; const s = o.s || 1;
    return { ex: t.ex * s, ez: t.ez * s, h: t.h * s, col: o.col == null ? a.col : o.col, brk: a.brk ? 1 : 0, m: a.brk || 'stone', cs: a.cs != null ? a.cs : CS_DEF[a.cat] || 0.85, s, cb: a.cb, fl: a.fl }; }   // cb/fl = kit collision boxes + walkable slabs (model.js objCircles/kitFloors)
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
  if (o.t === 'dc_road') {   // drawn road: same ribbon as the game (DK.dkRoad), built in the object's local frame
    if (!DK || !o.pts || o.pts.length < 2) return g; const cs = Math.cos(o.rot || 0), sn = Math.sin(o.rot || 0), y0 = MD.gh(M, o.x, o.z) + (o.y || 0);
    const yAt = (lx, lz) => MD.gh(M, clamp(o.x + lx * cs + lz * sn, 0, M.W), clamp(o.z - lx * sn + lz * cs, 0, M.H)) + (o.y || 0) - y0;
    const R = DK.dkRoad(o.pts, o.w || 4, o.curb, yAt, o.x * 20 * 0.013 + o.z * 20 * 0.029); if (!R) return g; const k = o.k || 'cobble';
    add(R.road, DK.DK_TEX[k] ? DK.dkMat(k) : mat(MD.DECO_COL[k] || '#8f897d')).castShadow = false; if (R.curb) add(R.curb, DK.dkMat('sand')); return g; }
  if (DK && MD.DECO_SHAPE.has(o.t)) {   // same geometry + textures as the game
    const k = o.k || (t === 'cone' || t === 'pyr' ? 'roof' : 'stone'), geo = DK.dkGeo(Object.assign({}, o, { t }), o.x * 20 * 0.013 + o.z * 20 * 0.029);
    if (geo) { let m = DK.DK_TEX[k] ? DK.dkMat(k) : mat(MD.DECO_COL[k] || '#c2b298', { emit: k === 'lit' || k === 'lit2' }); if (o.open) { m = m.clone(); m.side = THREE.DoubleSide; } add(geo, m); return g; } }
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
let DK = null;   // game decor shapes + textures (js/28-fcs-castle.js @dk-begin…@dk-end)
fetch('js/28-fcs-castle.js').then(r => r.text()).then(t => { const i = t.indexOf('// @dk-begin'), j = t.indexOf('// @dk-end'); if (i < 0 || j < 0) return;
  DK = new Function('THREE', 'mergeGeometries', t.slice(i, j) + '\nreturn {dkGeo, dkMat, dkRoad, DK_TEX};')(THREE, mergeGeometries); if (M) { syncObjs(); updSel(); } }).catch(e => console.warn('DK', e));
let FRPB = null;   // game room-prop builder (js/28-fcs-props.js frpBuild) → props look exactly like in the game
fetch('js/28-fcs-props.js').then(r => r.text()).then(t => { const i = t.indexOf('function frpBuild('), j = t.indexOf('\nfunction ', i + 10); if (i < 0 || j < 0) return;
  FRPB = new Function('THREE', t.slice(i, j) + '\nreturn frpBuild;')(THREE); if (M) { syncObjs(); updSel(); } }).catch(() => {});
const rpSeed = s => () => { s = (s + 0x6D2B79F5) | 0; let x = Math.imul(s ^ (s >>> 15), 1 | s); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
function rpLook(o, rp) {   // merged vertex-coloured mesh of one room prop, or null while the builder loads
  if (!FRPB) return null; let parts; try { parts = FRPB({ kind: rp, L: (o.L || 4) * MD.PX }, rpSeed(9001 + (o.id | 0) * 131)); } catch (e) { return null; } if (!parts || !parts.length) return null;
  const col = new THREE.Color(), gs = [];
  for (const [g, c] of parts) { const gg = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(gg.attributes)) if (k !== 'position' && k !== 'normal') gg.deleteAttribute(k);
    const n = gg.attributes.position.count, ca = new Float32Array(n * 3); col.set(c); for (let i = 0; i < n; i++) { ca[i * 3] = col.r; ca[i * 3 + 1] = col.g; ca[i * 3 + 2] = col.b; }
    gg.setAttribute('color', new THREE.BufferAttribute(ca, 3)); gs.push(gg); }
  const m = new THREE.Mesh(mergeGeometries(gs, false), RP_MAT); m.castShadow = m.receiveShadow = true; return m;
}
const RP_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
function markerMesh(o) {
  if (MD.isDeco(o.t)) return decoMesh(o);
  const D = OBJ[o.t], g = new THREE.Group(), c = D.c || '#888';
  const add = (geo, m, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); g.add(me); return me; };
  if (o.t === 'core') { const s = o.s || 4; add(new THREE.CylinderGeometry(s / 2, s / 2, 0.2, 24), helpMat(c, 0.5), 0, 0.1, 0); add(new THREE.OctahedronGeometry(s * 0.3), mat(c, { emit: 1 }), 0, 3, 0); const l = labelSprite('Core ' + (o.n || '?'), c); l.position.y = 5.6; g.add(l); return g; }
  if (o.t === 'sgA' || o.t === 'sgB') { add(new THREE.CylinderGeometry(4, 4, 0.1, 28), helpMat(c, 0.35), 0, 0.06, 0); add(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 6), helpMat(c), 0, 1.3, 0); const l = labelSprite((o.t === 'sgA' ? 'Atk ' : 'Def ') + (o.ph || 1), c); l.position.y = 3.2; g.add(l); return g; }
  if (o.t === 'phase') { areaMesh(o, g, c, 0.15); const l = labelSprite('Phase ' + (o.ph || 1), c); l.position.y = 2.6; g.add(l); return g; }
  if (o.t === 'ceil') { areaMesh(o, g, c, 0); return g; }
  if (o.t === 'sgHold' || o.t === 'sgLoot') { const tc = o.t === 'sgHold' ? (o.tm === 'B' ? '#5aa8ff' : '#ff6a5a') : c; areaMesh(o, g, tc, 0.2); const l = labelSprite(o.t === 'sgHold' ? (o.tm === 'B' ? 'Def' : 'Atk') + ' retreat ' + (o.ph || 1) : 'Loot ' + (o.ph || 1), tc); l.position.y = 2.8; g.add(l); return g; }
  if (o.t === 'sgItem') { add(new THREE.CylinderGeometry(1.2, 1.2, 0.1, 20), helpMat(c, 0.5), 0, 0.06, 0); add(new THREE.BoxGeometry(0.8, 0.8, 0.8), mat(c, { emit: 1 }), 0, 1.2, 0).rotation.set(0.6, 0.6, 0); const l = labelSprite('Item ' + (o.ph || 1) + ' T' + (o.tier || 1), c); l.position.y = 2.6; g.add(l); return g; }
  if (o.t === 'brz') { const tc = o.tm === 'A' ? '#ff8a7a' : o.tm === 'B' ? '#7ab8ff' : c, top = o.top == null ? 60 : o.top; areaMesh(o, g, tc, 0.1);   // floor rect + wire box up to Top
    const bx = new THREE.BoxGeometry(o.sx || 1, top, o.sz || 1), e = noPick(new THREE.LineSegments(new THREE.EdgesGeometry(bx), new THREE.LineBasicMaterial({ color: tc, transparent: true, opacity: 0.45 }))); e.position.y = top / 2; e.userData.area = 1; g.add(e);
    const l = labelSprite('Broom ' + (o.tm === 'A' ? 'Atk' : o.tm === 'B' ? 'Def' : 'all'), tc); l.position.y = 3; g.add(l); return g; }
  if (o.t === 'wind') { areaMesh(o, g, c, 0.3); const a = (o.dir || 0) * Math.PI / 180, L = Math.max(3, Math.min(o.sx || 1, o.sz || 1) * 0.4), ar = new THREE.Group();   // arrow = push direction
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, L), helpMat(c)); sh.position.z = L / 2; ar.add(sh); const hd = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.4, 12), helpMat(c)); hd.rotation.x = Math.PI / 2; hd.position.z = L + 1.2; ar.add(hd);
    ar.traverse(m => m.isMesh && noPick(m)); ar.position.y = 1.5; ar.rotation.y = a; g.add(ar); const l = labelSprite('Wind ' + (o.str == null ? 8 : o.str), c); l.position.y = 3.4; g.add(l); return g; }
  if (o.t === 'water') { const D0 = MD.WATER_DEF[o.k] || MD.WATER_DEF.lake, wc = new THREE.Color(o.cs || D0.sh).lerp(new THREE.Color(o.cd || D0.dp), 0.5), sx = o.sx || 1, sz = o.sz || 1;
    const f = noPick(new THREE.Mesh(new THREE.PlaneGeometry(sx, sz).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: wc, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.45 + 0.4 * (1 - (o.cl != null ? o.cl : D0.cl)), depthWrite: false })));
    f.renderOrder = 2; g.add(f); const e = noPick(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(sx, 0.05, sz)), new THREE.LineBasicMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.7 }))); e.userData.area = 1; g.add(e);
    const hd = new THREE.Mesh(new THREE.OctahedronGeometry(0.6), helpMat('#bfe8ff')); hd.position.y = 0.6; g.add(hd); const l = labelSprite('Water ' + (o.y || 0).toFixed(1) + ' m', '#bfe8ff'); l.position.y = 2; l.userData.area = 1; g.add(l); return g; }
  if (o.t === 'lz') { areaMesh(o, g, c, 0); const l = labelSprite('Indoor light', c); l.position.y = 1.4; g.add(l); return g; }   // drawn at its Top height
  if (D.rp) { const R = MD.RPK[D.rp], L = R.L ? Math.max(0.3, o.L || 4) : R.w, w = R.L ? R.w : R.w; const lk = rpLook(o, D.rp); if (lk) { g.add(lk); return g; }
    const b = add(new THREE.BoxGeometry(L, R.h, w), mat(R.col ? c : '#b89a76'), 0, R.h / 2, 0); b.castShadow = true; return g; }
  if (/^spawn|espawn|task/.test(o.t)) { add(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 20), helpMat(c, 0.75), 0, 0.08, 0); add(new THREE.CylinderGeometry(0.06, 0.06, 2.1, 6), helpMat(c), 0, 1.05, 0);
    if (/^spawn/.test(o.t)) { const a = add(new THREE.ConeGeometry(0.35, 0.9, 10), helpMat(c), 0, 0.3, 1.2); a.rotation.x = Math.PI / 2; } else add(new THREE.OctahedronGeometry(0.35), helpMat(c), 0, 2.3, 0); }
  else if (o.t === 'ring') { const r = add(new THREE.TorusGeometry(2, 0.12, 8, 28), helpMat(c), 0, 0, 0); }
  else if (o.t === 'light') { add(new THREE.SphereGeometry(0.28, 12, 8), helpMat(o.c || c), 0, 0, 0); const l = new THREE.PointLight(o.c || c, (o.int == null ? 2.4 : o.int) * 6, o.dist || 14, 1.6); g.add(l); }
  else if (o.t === 'pn_wall') { const L = o.L || 4, H = o.sy || 3, T = o.T || 0.3, sh = new THREE.Shape();
    const tp = MD.pnTP(o) || [1, 0, 1], X = t => -L / 2 + t * L;   // shaped top: left height, apex, right height (fractions)
    { const P = [[-L / 2, 0], [L / 2, 0], [L / 2, tp[2] * H], [X(tp[1]), H], [-L / 2, tp[0] * H]].filter((q, i, a) => i === 0 || Math.hypot(q[0] - a[i - 1][0], q[1] - a[i - 1][1]) > 1e-4);
      if (Math.hypot(P[0][0] - P.at(-1)[0], P[0][1] - P.at(-1)[1]) < 1e-4) P.pop(); sh.moveTo(...P[0]); for (const q of P.slice(1)) sh.lineTo(...q); sh.lineTo(...P[0]); }
    for (const q of o.ho || []) { const h = new THREE.Path(), a = q[0] - L / 2, b = q[1] - L / 2; h.moveTo(a, q[2]); h.lineTo(a, q[3]); h.lineTo(b, q[3]); h.lineTo(b, q[2]); h.lineTo(a, q[2]); sh.holes.push(h); }
    if (o.hc && o.hc.length) { const d = MD.pnDims(o), cw = L / d.nc, ch = H / d.nr, e = 0.004, on = new Set(o.hc.filter(q => q[0] < d.nc && q[1] < d.nr).map(q => q[1] * d.nc + q[0]));   // punched cells: one hole per row run
      for (let r = 0; r < d.nr; r++) for (let c = 0; c < d.nc; c++) { if (!on.has(r * d.nc + c) || on.has(r * d.nc + c - 1) && c > 0) continue; let c2 = c; while (c2 + 1 < d.nc && on.has(r * d.nc + c2 + 1)) c2++;
        const a = -L / 2 + c * cw + e, b = -L / 2 + (c2 + 1) * cw - e, y0 = r * ch + e, y1 = (r + 1) * ch - e, h = new THREE.Path(); h.moveTo(a, y0); h.lineTo(a, y1); h.lineTo(b, y1); h.lineTo(b, y0); h.lineTo(a, y0); sh.holes.push(h); } }
    const geo = new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false }); geo.translate(0, 0, -T / 2); if (o.tl) geo.rotateX(o.tl);
    const b = add(geo, mat(MD.PN_COL[o.mat || 'brick'] || c), 0, 0, 0); b.castShadow = true;
    if (o.mat === 'litwin' || o.mat === 'glass') { b.material = b.material.clone(); b.material.transparent = true; b.material.opacity = 0.6; }
    const cs = o.cs || 1, one = o.nb && !(o.ho && o.ho.length) && !(o.hc && o.hc.length), nc = one ? 1 : Math.max(1, Math.round(L / cs)), nr = one ? 1 : Math.max(1, Math.round(H / cs)), pts = [];   // unbreakable = no cell lines
    for (const zf of [T / 2 + 0.01, -T / 2 - 0.01]) {   // cell lines on both faces
      for (let i = 1; i < nc; i++) { const x = -L / 2 + i * L / nc; pts.push(x, 0, zf, x, H * MD.pnTopF(tp, i / nc), zf); }
      for (let j = 1; j < nr; j++) { const y = j * H / nr, f = y / H, [a, k, b] = tp, xl = f <= a ? -L / 2 : X(k * (f - a) / (1 - a)), xr = f <= b ? L / 2 : X(k + (1 - k) * (1 - f) / (1 - b)); if (xr > xl) pts.push(xl, y, zf, xr, y, zf); } }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); if (o.tl) lg.rotateX(o.tl); g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#2a2a2a', transparent: true, opacity: 0.45 }))); }
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
  else if (isKit(o)) { const t = tplNow(kitId(o)); if (t) { g = t.obj.clone(true); g.scale.setScalar(o.s || 1); } else { g = new THREE.Group(); g.add(new THREE.Mesh(pg('box'), helpMat('#666', 0.5))); kitTpl(kitId(o)).then(tt => { if (tt && (M.objs.includes(o) || RX.objs.includes(o))) syncObj(o); }); } }   // room objs (RX) too
  else if (OBJ[o.t]) { g = markerMesh(o); if (o.t === 'house') g.scale.set(o.sx || 1, 1, o.sz || 1); }
  else { g = new THREE.Group(); g.add(new THREE.Mesh(pg('box'), helpMat('#f06a6a', 0.6))); }
  const lift = o.t === 'ring' ? Math.max(1, o.y || 6) : o.t === 'light' ? (o.y == null ? 2.2 : o.y) : o.t === 'ceil' ? (o.y == null ? 21 : o.y) : o.t === 'lz' ? (o.y == null ? 22 : o.y) : (o.y || 0);
  g.position.set(o.x, o.t === 'water' ? o.y || 0 : MD.gh(M, o.x, o.z) + lift, o.z);   // water: y = absolute level g.rotation.y = MD.AREA.has(o.t) ? 0 : o.rot || 0;   // areas are axis-aligned in the game
  if (tiltOk(o) && (o.rx || o.rz)) g.rotation.set(o.rx || 0, o.rot || 0, o.rz || 0, 'YXZ');   // yaw first, then tilt
  if (o.vis === 0) ghostify(g);
  if (!show.area) g.traverse(m => { if (m.userData.area) m.visible = false; });
  g.userData.ref = refOfItem(o, 'obj'); g.name = 'obj_' + o.id;
  return g;
}
const objNode = new Map();
// decor boxes (dc_box, thousands on a castle map): one InstancedMesh per material, picked by instanceId (userData.ids)
const boxInst = new Map(), _bm4 = new THREE.Matrix4(), _bq = new THREE.Quaternion(), _bv = new THREE.Vector3(), _bs = new THREE.Vector3();
const _bY = new THREE.Vector3(0, 1, 0), boxMat4 = o => _bm4.compose(_bv.set(o.x, MD.gh(M, o.x, o.z) + (o.y || 0), o.z), _bq.setFromAxisAngle(_bY, o.rot || 0), _bs.set(o.sx || 1, o.sy || 1, o.sz || 1));
const instBox = o => o.t === 'dc_box' && !MD.DECO_TEX.has(o.k);   // textured boxes get their own mesh (uv in metres)
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
function syncBoxes(list) {
  boxInst.clear(); const by = new Map();
  for (const o of list) { const k = o.k || 'stone'; if (!by.has(k)) by.set(k, []); by.get(k).push(o); }
  for (const [k, L] of by) { const im = new THREE.InstancedMesh(boxGeo, mat(MD.DECO_COL[k] || '#c2b298', { emit: k === 'lit' || k === 'lit2' }), L.length); im.castShadow = im.receiveShadow = true;
    im.userData = { ids: L.map(o => o.id), refs: L.map(o => refOfItem(o, 'obj')) }; L.forEach((o, i) => { im.setMatrixAt(i, boxMat4(o)); boxInst.set(o.id, { im, i }); }); im.computeBoundingSphere(); gObjs.add(im); }
}
function syncObj(o) {
  if (instBox(o)) { const e = boxInst.get(o.id); if (e && e.im.material === mat(MD.DECO_COL[o.k || 'stone'] || '#c2b298', { emit: o.k === 'lit' || o.k === 'lit2' })) { e.im.setMatrixAt(e.i, boxMat4(o)); e.im.instanceMatrix.needsUpdate = true; e.im.computeBoundingSphere(); } else syncObjs(); if (sel && sel.k === 'obj' && sel.id === o.id) updSel(); need(); return; }
  const old = objNode.get(o.id); if (old) gObjs.remove(old); const g = objMesh(o); objNode.set(o.id, g); gObjs.add(g); if (sel && sel.k === 'obj' && sel.id === o.id) updSel(); need(); }
function syncObjs() { for (const c of [...gObjs.children]) gObjs.remove(c); objNode.clear(); const all = M.objs.concat(RX.objs), boxes = [];
  for (const o of all) { if (instBox(o)) { boxes.push(o); continue; } const g = objMesh(o); objNode.set(o.id, g); gObjs.add(g); }
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
  const q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), P = new THREE.Vector3(), S = new THREE.Vector3();
  obs.forEach((o, i) => { const x = o.x / MD.PX, z = o.y / MD.PX, r = o.r / MD.PX, g = MD.gh(M, x, z), b = o.bot || 0, h = o.hgt - b, L = o.hx == null ? 0 : Math.hypot(o.hx, o.hy) / MD.PX;   // capsule (straight wall) = stretched along its axis
    q.setFromAxisAngle(Y, o.hx == null ? 0 : -Math.atan2(o.hy, o.hx)); im.setMatrixAt(i, m4.compose(P.set(x, g + b + h / 2, z), q, S.set(r + L, h, r))); });
  gCol.add(im); need();
}

// ================= camera / picking =================
function camApply() {
  cam.pitch = clamp(cam.pitch, 0.08, 1.55); cam.dist = clamp(cam.dist, 3, M ? bdLim().d : 900);
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
const selAll = () => (sel ? [sel] : []).concat(msel), sameRef = (a, b) => !!(a && b && a.k === b.k && a.id === b.id), isSel = r => selAll().some(q => sameRef(q, r));
function toggleSel(r) {   // Shift/Ctrl+click: add to / remove from the selection (the last added = primary)
  if (sameRef(sel, r)) { sel = msel.shift() || null; return; }
  const i = msel.findIndex(q => sameRef(q, r)); if (i >= 0) { msel.splice(i, 1); return; }
  if (sel) msel.push({ k: sel.k, id: sel.id }); sel = { k: r.k, id: r.id };
}
const syncKind = (k, it) => k === 'room' ? syncRooms() : k === 'obj' ? syncObj(it) : k === 'part' ? syncPart(it) : k === 'wall' ? syncWalls() : syncFloors();
const nid = () => (M.seq = (M.seq || 1) + 1);
const snapV = v => opt.snap ? Math.round(v / opt.snap) * opt.snap : +v.toFixed(2);

// ================= undo =================
const META = ['walls', 'floors', 'objs', 'parts', 'rooms', 'groups', 'name', 'desc', 'sky', 'style', 'fog', 'music', 'weather', 'fx', 'modes', 'random', 'autoProps', 'skirt', 'seq'];
function snap(kind) { if (kind === 'b') return { isBd: 1, bd: BD.bdClone(M.bd) }; const e = {}; if (kind !== 'o') { e.hg = M.hg.slice(); e.sf = M.sf.slice(); e.W = M.W; e.H = M.H; } if (kind !== 't') { const o = {}; for (const k of META) o[k] = M[k]; e.js = JSON.stringify(o); } return e; }
function pushUndo(kind) { undo.push(snap(kind)); if (undo.length > 40) undo.shift(); redo = []; }
function restore(e) {
  if (e.isBd) { const back = snap('b'); M.bd = e.bd; buildBd(); applySky(); renderOpts(); changed(); return back; }
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

// ================= backdrop (land / sea / trees around the play area — mapbuild/backdrop.js) =================
const gBd = new THREE.Group(); gBd.name = 'backdrop'; root.add(gBd);
let bdMesh = null, bdWater = null, bdTrees = null, bdStk = null, bdY = null, bdTT = 0;
const bdSurf = BD.BSURF.map(s => new THREE.Color(s.c)), bdSeaC = new THREE.Color('#33505a'), bdTmp = new THREE.Color();
const bdEdge = (x, z) => MD.gh(M, x, z);
function bdAt(x, z) { return BD.bdOut(M, x, z) < -0.01 ? MD.gh(M, clamp(x, 0, M.W), clamp(z, 0, M.H)) - 4 : BD.bdHeight(M.bd, M, x, z, bdEdge); }   // shown height (inside = under the map ground)
function bdSlope(i, j) { const B = M.bd, k = j * B.nx + i, Y = bdY, l = Y[i > 0 ? k - 1 : k], r = Y[i < B.nx - 1 ? k + 1 : k], u = Y[j > 0 ? k - B.nx : k], d = Y[j < B.ny - 1 ? k + B.nx : k]; return Math.max(Math.abs(r - l), Math.abs(d - u)) / (2 * B.c); }
function buildBd() {
  clearGroup(gBd); bdMesh = bdWater = bdTrees = bdStk = null; bdY = null; if (!M || !M.bd) return;
  const B = M.bd, n = B.nx * B.ny, pos = new Float32Array(n * 3), idx = new Uint32Array((B.nx - 1) * (B.ny - 1) * 6);
  for (let j = 0; j < B.ny; j++) for (let i = 0; i < B.nx; i++) { const k = (j * B.nx + i) * 3; pos[k] = B.x0 + i * B.c; pos[k + 2] = B.z0 + j * B.c; }
  let q = 0; for (let j = 0; j < B.ny - 1; j++) for (let i = 0; i < B.nx - 1; i++) { const a = j * B.nx + i, b = a + 1, d = a + B.nx, e = d + 1; idx[q++] = a; idx[q++] = d; idx[q++] = b; idx[q++] = b; idx[q++] = d; idx[q++] = e; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  bdMesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); bdMesh.userData.own = 1; bdMesh.frustumCulled = false; gBd.add(bdMesh); bdY = new Float32Array(n);
  updBd(0, 0, B.nx - 1, B.ny - 1); bdSea(); bdStacks(); bdTreesBuild(); gBd.visible = show.bd; need();
}
function updBd(i0, j0, i1, j1) {
  const B = M.bd; if (!B || !bdMesh) return; const g = bdMesh.geometry, P = g.attributes.position.array, N = g.attributes.normal.array, Cc = g.attributes.color.array;
  i0 = clamp(i0 - 1, 0, B.nx - 1); j0 = clamp(j0 - 1, 0, B.ny - 1); i1 = clamp(i1 + 1, 0, B.nx - 1); j1 = clamp(j1 + 1, 0, B.ny - 1);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * B.nx + i; bdY[k] = bdAt(B.x0 + i * B.c, B.z0 + j * B.c); P[k * 3 + 1] = bdY[k]; }
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * B.nx + i, Y = bdY, l = Y[i > 0 ? k - 1 : k], r = Y[i < B.nx - 1 ? k + 1 : k], u = Y[j > 0 ? k - B.nx : k], d = Y[j < B.ny - 1 ? k + B.nx : k];
    const sx = (l - r) / (2 * B.c), sz = (u - d) / (2 * B.c), L = Math.hypot(sx, 1, sz); N[k * 3] = sx / L; N[k * 3 + 1] = 1 / L; N[k * 3 + 2] = sz / L;
    const y = Y[k], si = B.sf[k] || BD.bdAuto(B, y, bdSlope(i, j)); bdTmp.copy(bdSurf[si] || bdSurf[1]).multiplyScalar(0.92 + 0.16 * MD.hash2(i, j));
    if (B.sea != null && y < B.sea) bdTmp.lerp(bdSeaC, clamp((B.sea - y) / 6, 0, 1) * 0.7);
    Cc[k * 3] = bdTmp.r; Cc[k * 3 + 1] = bdTmp.g; Cc[k * 3 + 2] = bdTmp.b; }
  g.attributes.position.needsUpdate = g.attributes.normal.needsUpdate = g.attributes.color.needsUpdate = true; need();
}
function bdSea() {
  if (bdWater) { gBd.remove(bdWater); bdWater.geometry.dispose(); bdWater = null; } const B = M.bd; if (!B || B.sea == null) return;
  const w = (B.nx - 1) * B.c, h = (B.ny - 1) * B.c; bdWater = new THREE.Mesh(new THREE.PlaneGeometry(w, h).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#2c6a80', roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.82 }));
  bdWater.position.set(B.x0 + w / 2, B.sea, B.z0 + h / 2); bdWater.renderOrder = 2; gBd.add(bdWater);
}
function bdStacks() {
  if (bdStk) { gBd.remove(bdStk); bdStk.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); bdStk = null; } const B = M.bd; if (!B || !B.st.length) return;
  bdStk = new THREE.Group(); const base = B.sea != null ? B.sea : 0, m = new THREE.MeshLambertMaterial({ color: '#5a554e', flatShading: true });
  for (const s of B.st) { const c = new THREE.Mesh(new THREE.CylinderGeometry(s.r * 0.75, s.r, s.h + 6, 9, 3), m); c.position.set(s.x, base - 6 + (s.h + 6) / 2, s.z); bdStk.add(c); }
  gBd.add(bdStk);
}
function bdTreeNote() {   // painted trees vs the game cap (4500, thinned evenly over the whole backdrop)
  const B = M && M.bd; if (!B) return ''; let ex = 0; for (let k = 0; k < B.tr.length; k++) ex += B.tr[k]; const nt = Math.min(32, Math.max(2, Math.round(2 * (B.c / 5) * (B.c / 5)))), n = Math.round(ex / 255 * 0.8 * nt);
  return n <= 4500 ? 'Painted ≈ ' + n.toLocaleString() + ' trees (game max 4,500)' : 'Painted ≈ ' + n.toLocaleString() + ' trees → game shows 4,500 spread evenly (' + Math.round(4500 / n * 100) + '% of each patch) • clear far patches (Shift) to make the rest denser';
}
function bdTreesBuild() {
  if (bdTrees) { gBd.remove(bdTrees); bdTrees.geometry.dispose(); bdTrees = null; } const B = M.bd; if (!B) return;
  const P = BD.bdTreePts(B, M, bdAt, 4500); if (!P.length) return; const n = P.length / 3;
  const geo = new THREE.ConeGeometry(2.4, 9, 6).translate(0, 4.5, 0);
  bdTrees = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: '#2c4a2a', flatShading: true }), n); const m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { const s = P[i * 3 + 2]; bdTrees.setMatrixAt(i, m4.makeScale(s, s, s).setPosition(P[i * 3], bdAt(P[i * 3], P[i * 3 + 1]) - 0.3, P[i * 3 + 1])); }
  bdTrees.frustumCulled = false; gBd.add(bdTrees); need();
}
function bdHit() {   // ray march over the backdrop + map ground
  if (!M.bd) return groundHit();
  const o = ray.ray.origin, d = ray.ray.direction, ox = o.x + M.W / 2, oz = o.z + M.H / 2, B = M.bd, maxT = cam.dist * 4 + 3000; let t = 0, pt = 0;
  const inG = (x, z) => x >= B.x0 && z >= B.z0 && x <= B.x0 + (B.nx - 1) * B.c && z <= B.z0 + (B.ny - 1) * B.c;
  const top = (x, z) => BD.bdOut(M, x, z) < 0 ? MD.gh(M, x, z) : Math.max(bdAt(x, z), B.sea != null ? B.sea : -1e9);
  const below = t => { const x = ox + d.x * t, z = oz + d.z * t; if (!inG(x, z)) return false; return o.y + d.y * t <= top(x, z); };
  for (; t < maxT; pt = t, t += Math.max(0.5, t * 0.01)) if (below(t)) { let a = pt, b = t; for (let i = 0; i < 14; i++) { const m = (a + b) / 2; if (below(m)) b = m; else a = m; }
    const x = ox + d.x * b, z = oz + d.z * b; return { x, z, y: top(x, z), t: b, on: 'bd' }; }
  return null;
}
function bdRange(x, z, R) { const B = M.bd; return [clamp(Math.floor((x - R - B.x0) / B.c), 0, B.nx - 1), clamp(Math.floor((z - R - B.z0) / B.c), 0, B.ny - 1), clamp(Math.ceil((x + R - B.x0) / B.c), 0, B.nx - 1), clamp(Math.ceil((z + R - B.z0) / B.c), 0, B.ny - 1)]; }
function bdBrush(dt, inv) {
  const h = hover, B = M.bd; if (!h || !B || !stroke) return;
  const R = opt.brad, [i0, j0, i1, j1] = bdRange(h.x, h.z, R), a = B.hg, nx = B.nx, mode = opt.bm, s = opt.bstr; let src = null; if (mode === 'smooth') src = a.slice();
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const d = Math.hypot(B.x0 + i * B.c - h.x, B.z0 + j * B.c - h.z), f = falloff(d, R); if (f <= 0) continue; const k = j * nx + i;
    if (mode === 'up' || mode === 'down') a[k] += ((mode === 'up') !== inv ? 1 : -1) * s * 3 * f * dt;
    else if (mode === 'smooth') { let t = 0, n = 0; for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) { const X = i + x, Y = j + y; if (X < 0 || Y < 0 || X >= nx || Y >= B.ny) continue; t += src[Y * nx + X]; n++; } a[k] += (t / n - a[k]) * Math.min(1, f * s * dt * 1.6); }
    else if (mode === 'flat') a[k] += (stroke.h0 - a[k]) * Math.min(1, f * s * dt * 1.4);
    else if (mode === 'set') a[k] += (opt.bh - a[k]) * Math.min(1, f * s * dt * 3);
    else if (mode === 'noise') a[k] += (MD.vnoise(i * 0.31 + stroke.seed, j * 0.31) + 0.5 * MD.vnoise(i * 0.8, j * 0.8 + stroke.seed) - 0.75) * (inv ? -1 : 1) * s * 2 * f * dt;
    else if (mode === 'paint') { if (d < R * (opt.soft ? 0.86 + 0.28 * MD.hash2(i + 7, j + 3) : 1)) B.sf[k] = inv ? 0 : opt.bs; }
    else if (mode === 'tree') { const tg = inv ? 0 : opt.btd; B.tr[k] = clamp(Math.round(B.tr[k] + (tg - B.tr[k]) * Math.min(1, f * dt * 5)), 0, 255); }
    a[k] = clamp(a[k], -200, 600);
  }
  updBd(i0, j0, i1, j1); stroke.moved = 1;
  if (mode === 'tree' && performance.now() - bdTT > 250) { bdTT = performance.now(); bdTreesBuild(); }
}
function bdStackClick(inv) {
  const B = M.bd, h = hover; if (!B || !h) return; pushUndo('b');
  if (inv) { let bi = -1, bd = 1e9; B.st.forEach((s, i) => { const d = Math.hypot(s.x - h.x, s.z - h.z) - s.r; if (d < bd) { bd = d; bi = i; } }); if (bi >= 0 && bd < 12) B.st.splice(bi, 1); }
  else B.st.push({ x: +h.x.toFixed(1), z: +h.z.toFixed(1), r: opt.sr, h: opt.sh });
  const [i0, j0, i1, j1] = bdRange(h.x, h.z, 60); updBd(i0, j0, i1, j1); bdStacks(); changed();
}
function bdCreate(pre, seed) {
  pushUndo('b'); let E = M.bd ? M.bd.E : opt.bE || 600, c = M.bd ? M.bd.c : opt.bc || 5; if (pre === 'alpine') { E = Math.max(2000, E); c = Math.max(10, c); }   // far peaks need reach; 10 m grid keeps it light
  const B = Object.assign(BD.bdNew(M, { E, c }), M.bd ? { look: M.bd.look } : {}); BD.bdGen(B, M, pre, seed); M.bd = B; buildBd(); applySky(); renderOpts(); changed();
}
function bdOpts(b) {   // Settings panel of the Backdrop tool
  const B = M.bd;
  b.append(h3('Start From Preset'), el('div', { class: 'row' }, el('label', null, 'Preset'), el('select', { class: 'tl-sel', onchange: e => { opt.bpre = e.target.value; }, html: BD.BD_PRESETS.map(([k, n]) => `<option value="${k}"${k === opt.bpre ? ' selected' : ''}>${n}</option>`).join('') })),
    slider('Variation (seed)', 'bseed', 1, 20, 1),
    el('button', { class: 'tl-btn pri', style: 'width:100%;margin:4px 0', onclick: () => { if (B && !confirm('Replace the whole backdrop with this preset? (Undo works)')) return; bdCreate(opt.bpre, opt.bseed); } }, B ? '↻ Rebuild From Preset' : '＋ Create Backdrop'),
    el('p', { class: 'note' }, 'Covers the map + ' + (B ? B.E : opt.bE || 600) + ' m on every side (' + (B ? B.c : opt.bc || 5) + ' m grid) • inside the play area nothing is drawn; near the edge it meets your map ground • no collision'));
  {const E0 = B ? B.E : opt.bE || 600, c0 = B ? B.c : opt.bc || 5, sz = { E: E0, c: c0 };
    const info = el('p', { class: 'note' }), upd = () => { const n = BD.bdCells(M, sz.E, sz.c); info.textContent = (n / 1e6).toFixed(2) + ' M grid points' + (n > 600000 ? ' — heavy: use a bigger grid cell for a far reach' : '') + ' • the game sees ' + Math.round(Math.max(M.W, M.H) / 2 + sz.E) + ' m from the map centre'; };
    const sel = (k, L, unit) => el('select', { class: 'tl-sel', onchange: e => { sz[k] = +e.target.value; if (!B) { opt[k === 'E' ? 'bE' : 'bc'] = sz[k]; } upd(); }, html: [...new Set([...L, sz[k]])].sort((x, y) => x - y).map(v => `<option value="${v}"${v === sz[k] ? ' selected' : ''}>${v} ${unit}</option>`).join('') });   // keeps an odd current value listed
    b.append(h3('Size'), el('div', { class: 'row' }, el('label', null, 'Reach'), sel('E', BD.BD_REACH, 'm')), el('div', { class: 'row' }, el('label', null, 'Grid Cell'), sel('c', BD.BD_CELL, 'm')), info,
      B ? el('button', { class: 'tl-btn', style: 'width:100%;margin:4px 0', onclick: () => { if (sz.E === B.E && sz.c === B.c) return; pushUndo('b'); M.bd = BD.bdResize(B, M, sz.E, sz.c); buildBd(); renderOpts(); changed(); } }, '⇲ Apply Size (keeps your sculpting)') : null,
      el('p', { class: 'note' }, 'Reach = how far the backdrop goes past the map edge • Grid Cell = detail (bigger = coarser but light, good for far mountains seen from a high map)'));
    upd();}
  if (!B) return;
  b.append(h3('Mode'), seg([['up', 'Raise'], ['down', 'Lower'], ['smooth', 'Smooth'], ['flat', 'Flatten', 'Pull to the height where the drag started'], ['set', 'Set Height'], ['noise', 'Noise'], ['paint', 'Paint'], ['tree', 'Trees'], ['stack', 'Sea Stack']], opt.bm, v => { opt.bm = v; renderOpts(); need(); }));
  if (opt.bm === 'stack') b.append(slider('Radius', 'sr', 2, 30, 0.5), slider('Height above sea', 'sh', 2, 80, 1), el('p', { class: 'note' }, 'Click = add a rock pillar • Shift+click = remove the nearest'));
  else {
    b.append(h3('Brush'), slider('Size (radius m)', 'brad', 3, 400, 1), opt.bm !== 'paint' ? slider(opt.bm === 'tree' ? 'Speed' : 'Strength', 'bstr', 0.5, 20, 0.5) : null, check('Soft Edge', 'soft'));
    if (opt.bm === 'set') b.append(slider('Height (m)', 'bh', -80, 300, 1), el('div', { class: 'row' }, el('span', { style: 'flex:1' }, 'Alt+click = take the height under the cursor'), pickBtn('height', v => { opt.bh = clamp(Math.round(v), -80, 300); renderOpts(); }, 'a height')));
    if (opt.bm === 'paint') b.append(el('div', { class: 'row' }, el('span', { style: 'flex:1' }, 'Current: ' + BD.BSURF[opt.bs].n), pickBtn('bsurf', v => { opt.bs = v; renderOpts(); }, 'a surface (map ground → closest colour)')), pal(BD.BSURF, opt.bs, i => { opt.bs = i; renderOpts(); }), el('p', { class: 'note' }, 'Shift = back to Auto (grass on flat, rock on steep, sand at the water, snow up high)'));
    if (opt.bm === 'tree') b.append(slider('Density (0–255)', 'btd', 10, 255, 5), el('p', { class: 'note' }, 'Drag = grow trees toward this density • Shift = clear • no trees under water or on cliffs'), el('p', { class: 'note' }, bdTreeNote()));
  }
  const sea = el('input', { type: 'checkbox', checked: B.sea != null, onchange: () => { pushUndo('b'); B.sea = sea.checked ? (opt.seaL != null ? opt.seaL : -2) : null; bdAfter(); } });
  const lv = el('input', { class: 'tl-in', type: 'number', step: 0.5, value: B.sea != null ? B.sea : (opt.seaL != null ? opt.seaL : -2), style: 'width:70px', onchange: e => { pushUndo('b'); opt.seaL = +e.target.value; if (B.sea != null) B.sea = opt.seaL; bdAfter(); } });
  b.append(h3('Water'), el('div', { class: 'row' }, el('label', { class: 'chk' }, sea, 'Sea / lake level'), lv), el('p', { class: 'note' }, 'Everything lower than this level is water (waves + foam on the shore in the game)'),
    h3('Look'), el('div', { class: 'row' }, el('label', null, 'Sky'), el('select', { class: 'tl-sel', onchange: e => { pushUndo('b'); B.look = e.target.value; changed(); }, html: BD.BD_LOOK.map(([k, n]) => `<option value="${k}"${k === (B.look || '') ? ' selected' : ''}>${n}</option>`).join('') })),
    el('div', { class: 'row' }, el('label', null, 'Snowline'), el('select', { class: 'tl-sel', onchange: e => { pushUndo('b'); B.snow = +e.target.value; buildBd(); changed(); }, html: [...new Set([60, 110, 200, 300, 400, 520, 700, 9999, B.snow != null ? +B.snow : 110])].sort((x, y) => x - y).map(v => `<option value="${v}"${v === (B.snow != null ? +B.snow : 110) ? ' selected' : ''}>${v > 5000 ? 'no snow' : v + ' m'}</option>`).join('') })),   // height where snow starts (game + preview)
    check('Show Backdrop', 'bd', show, () => { gBd.visible = show.bd; applySky(); camApply(); }),
    check('Use in Game', 'on', B, () => changed()),
    el('button', { class: 'tl-btn', style: 'width:100%;margin-top:6px', onclick: () => { if (!confirm('Delete the backdrop? (Undo works)')) return; pushUndo('b'); M.bd = null; buildBd(); applySky(); renderOpts(); changed(); } }, '✕ Delete Backdrop'));
}
function bdAfter() { const B = M.bd; updBd(0, 0, B.nx - 1, B.ny - 1); bdSea(); bdStacks(); bdTreesBuild(); renderOpts(); changed(); }
const bdLim = () => M.bd && show.bd ? { x0: M.bd.x0, z0: M.bd.z0, x1: M.bd.x0 + (M.bd.nx - 1) * M.bd.c, z1: M.bd.z0 + (M.bd.ny - 1) * M.bd.c, d: Math.max(3200, M.bd.E * 2 + 1200) } : { x0: -20, z0: -20, x1: M.W + 20, z1: M.H + 20, d: 900 };

// ================= eyedropper (💧 Pick): take a colour / surface / height from what is under the cursor =================
// pickArm = {k:'color'|'surf'|'bsurf'|'height', apply(v), n} armed by a 💧 button; Alt+click in Paint / Backdrop / Wall / Castle / Place picks for that tool
let pickArm = null;
const pickCol = new THREE.Color(), pickC2 = new THREE.Color();
function nearestPal(list, hex, skip0) { pickCol.set(hex); let bi = skip0 ? 1 : 0, bd = 1e9; list.forEach((s, i) => { if (skip0 && i === 0) return; pickC2.set(s.c); const d = (pickC2.r - pickCol.r) ** 2 + (pickC2.g - pickCol.g) ** 2 + (pickC2.b - pickCol.b) ** 2; if (d < bd) { bd = d; bi = i; } }); return bi; }
function pickSample() {   // → {color, surf (map SURF index), bsurf (BSURF index), height, what}
  const it = pickItem(), g = M.bd ? bdHit() : groundHit();
  if (it && it.ref && (!g || it.t <= g.t + 0.01)) { const o = find(it.ref), c = o && (o.c || (o.t && MD.isDeco(o.t) && MD.DECO_COL[o.k || 'stone']) || (o.t && OBJ[o.t] && OBJ[o.t].c));
    if (c) { const y = it.p.y; return { color: c, surf: nearestPal(SURF, c), bsurf: nearestPal(BD.BSURF, c, 1), height: +y.toFixed(2), what: 'item' }; } }
  if (!g) return null;
  if (BD.bdOut(M, g.x, g.z) <= 0) { const k = clamp(Math.round(g.z / C), 0, M.ny - 1) * M.nx + clamp(Math.round(g.x / C), 0, M.nx - 1), si = M.sf[k], c = SURF[si].c;
    return { color: c, surf: si, bsurf: nearestPal(BD.BSURF, c, 1), height: +g.y.toFixed(2), what: 'ground' }; }
  const B = M.bd, k = BD.bdCell(B, g.x, g.z), i = k % B.nx, j = (k / B.nx) | 0, bi = B.sf[k] || BD.bdAuto(B, bdY ? bdY[k] : g.y, bdY ? bdSlope(i, j) : 0), c = BD.BSURF[bi].c;
  return { color: c, surf: nearestPal(SURF, c), bsurf: bi, height: +BD.bdRaw(B, g.x, g.z).toFixed(1), what: 'backdrop' };
}
function pickFor(k, apply, n) { pickArm = { k, apply, n }; cv.style.cursor = 'crosshair'; $('hint').textContent = '💧 Click on the map to pick ' + (n || k) + ' • Esc = cancel'; need(); }
function pickOff() { pickArm = null; cv.style.cursor = ''; $('hint').textContent = HINT[tool] || ''; }
function toolPick() {   // what Alt+click picks in the current tool
  if (tool === 'paint') return { k: 'surf', apply: v => { opt.surf = v; renderOpts(); } };
  if (tool === 'bd') return opt.bm === 'paint' ? { k: 'bsurf', apply: v => { opt.bs = v; renderOpts(); } } : opt.bm === 'set' || opt.bm === 'flat' ? { k: 'height', apply: v => { opt.bh = clamp(Math.round(v), -80, 300); opt.bm = 'set'; renderOpts(); } } : null;
  if (tool === 'wall') return { k: 'color', apply: v => { opt.wc = v; renderOpts(); } };
  if (tool === 'castle') return { k: 'color', apply: v => { partPP(opt.part).c = v; renderOpts(); } };
  if (tool === 'place' && opt.cat === 'prim') return { k: 'color', apply: v => { opt.prim.c = v; renderOpts(); } };
  return null;
}
function doPick(P) { const r = pickSample(); if (!r) { stat('Nothing to pick there', 'warn'); return; } P.apply(r[P.k]); stat('💧 Picked ' + (P.k === 'height' ? 'height ' + r.height : P.k === 'color' ? r.color : P.k === 'surf' ? SURF[r.surf].n : BD.BSURF[r.bsurf].n) + ' from ' + r.what, 'ok'); need(); }
const pickBtn = (k, apply, n) => el('button', { class: 'tl-btn', title: 'Eyedropper: click on the map to pick ' + (n || k) + ' (or Alt+click with the tool)', style: 'padding:2px 8px', onclick: e => { e.preventDefault(); pickFor(k, apply, n); } }, '💧 Pick');

// ================= helpers drawn in the view =================
const ringGeo = new THREE.BufferGeometry(); ringGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(65 * 3), 3));
const ring = new THREE.Line(ringGeo, new THREE.LineBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.9 })); ring.renderOrder = 10; ring.frustumCulled = false; gHelp.add(ring);
const lineGeo = new THREE.BufferGeometry(); const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: ACC, depthTest: false })); line.renderOrder = 11; line.frustumCulled = false; gHelp.add(line);
const gHandles = new THREE.Group(); gHelp.add(gHandles);
let ghost = null, ghostKey = '';
function drawRing() {
  const on = hover && (tool === 'sculpt' || tool === 'paint' || tool === 'scatter' || (tool === 'bd' && M.bd && opt.bm !== 'stack')); ring.visible = !!on; if (!on) return;
  const P = ringGeo.attributes.position.array, R = tool === 'bd' ? opt.brad : opt.rad;
  for (let i = 0; i <= 64; i++) { const a = i / 64 * 6.2832; let x = hover.x + Math.cos(a) * R, z = hover.z + Math.sin(a) * R, y; if (tool === 'bd') y = Math.max(bdAt(x, z), M.bd.sea != null ? M.bd.sea : -1e9) + 0.6; else { x = clamp(x, 0, M.W); z = clamp(z, 0, M.H); y = MD.gh(M, x, z) + 0.12; } P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z; }
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
function selNodes(sel, it) {   // scene nodes of one selected item (for its box)
  const bxN = sel.k === 'obj' && instBox(it) ? (() => { const m = new THREE.Mesh(boxGeo); m.applyMatrix4(boxMat4(it)); root.add(m); setTimeout(() => root.remove(m), 0); return m; })() : null;
  return bxN ? [bxN] : sel.k === 'obj' ? [objNode.get(it.id)] : sel.k === 'part' ? [partNode.get(it.id)] : sel.k === 'room' ? [gWalls, gFloors, gObjs, gParts].flatMap(g => g.children.filter(c => c.userData.ref && c.userData.ref.k === 'room' && c.userData.ref.id === it.id)) : (sel.k === 'wall' ? gWalls : gFloors).children.filter(c => c.userData.ref.id === it.id);
}
let mBoxes = [];
function updSel() {
  if (selBox) { scene.remove(selBox); selBox.geometry.dispose(); selBox = null; }   // Box3Helper lives in world space (scene), not in root
  const it = find(sel);
  if (it) { const b = new THREE.Box3(), t = new THREE.Box3(); b.makeEmpty();
    const nodes = selNodes(sel, it);
    root.updateMatrixWorld(true); for (const n of nodes) if (n) { t.setFromObject(n); b.union(t); }
    if (!b.isEmpty()) { selBox = new THREE.Box3Helper(b, 0xffffff); selBox.material.depthTest = false; selBox.renderOrder = 9; scene.add(selBox); } }
  for (const h of mBoxes) { scene.remove(h); h.geometry.dispose(); } mBoxes = []; msel = msel.filter(q => find(q) && !(sel && q.k === sel.k && q.id === sel.id));
  for (const q of msel) { const b = new THREE.Box3(), t = new THREE.Box3(); b.makeEmpty(); root.updateMatrixWorld(true); for (const n of selNodes(q, find(q))) if (n) { t.setFromObject(n); b.union(t); }
    if (!b.isEmpty()) { const h = new THREE.Box3Helper(b, 0xffcc44); h.material.depthTest = false; h.renderOrder = 9; scene.add(h); mBoxes.push(h); } }
  drawHandles(); placeGizmo(); need();
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
  if (t === 'col_box' || t === 'col_cyl') return Object.assign(o, { t: t === 'col_box' ? 'box' : 'cyl', c: '#ff5a5a', vis: 0, col: 1, sx: opt.prim.sx, sy: opt.prim.sy, sz: opt.prim.sz });
  if (OBJ[t] && OBJ[t].cat === 'prim') Object.assign(o, { c: opt.prim.c, sx: opt.prim.sx, sy: opt.prim.sy, sz: opt.prim.sz });
  else if (t.startsWith('kit:')) o.s = 1;
  else if (t === 'light') Object.assign(o, { y: 2.2, c: '#ffb060', int: 2.4, dist: 14 });
  else if (t === 'ring') o.y = 6;
  else if (t === 'core') Object.assign(o, { n: M.objs.filter(q => q.t === 'core').length + 1, s: 4 });
  else if (t === 'sgA' || t === 'sgB') o.ph = 1;
  else if (t === 'phase') Object.assign(o, { ph: 1, sx: 40, sz: 40, rot: 0 });
  else if (t === 'sgHold') Object.assign(o, { ph: 1, tm: 'A', sx: 20, sz: 14, rot: 0 });
  else if (t === 'sgLoot') Object.assign(o, { ph: 1, sx: 30, sz: 30, rot: 0 });
  else if (t === 'sgItem') Object.assign(o, { ph: 1, tier: 1 });
  else if (t === 'brz') Object.assign(o, { sx: 60, sz: 60, top: 60, tm: '', rot: 0 });
  else if (t === 'wind') Object.assign(o, { sx: 20, sz: 20, dir: 0, str: 8, rot: 0 });
  else if (t === 'ceil') Object.assign(o, { sx: 20, sz: 20, y: 21, rot: 0 });
  else if (t === 'lz') Object.assign(o, { sx: 30, sz: 20, y: 22, k: 1, rot: 0 });
  else if (t === 'water') Object.assign(o, { sx: 12, sz: 12, k: opt.wk });
  else if (MD.isRP(t) && MD.RPK[t.slice(3)].L) o.L = 4;
  else if (MD.isDeco(t)) Object.assign(o, { box: { k: 'stone', sx: 2, sy: 2, sz: 2, y: 1, rot: 0 }, cyl: { k: 'stone', rt: 1, rb: 1, sy: 4, seg: 12, y: 2 }, cone: { k: 'roof', r: 2, sy: 3, seg: 8, y: 1.5 },
    pyr: { k: 'slate', sx: 4, sy: 3, sz: 4, y: 1.5 }, dome: { k: 'copper', sx: 4, sy: 2, sz: 4, y: 1 }, wedge: { k: 'stone', sx: 4, sy: 2, sz: 3, y: 1 },
    arch: { k: 'stone', sx: 4, sy: 5, sz: 1, ow: 2, oh: 3.5, y: 2.5 }, cren: { k: 'stone', sx: 8, sy: 1, sz: 1, mw: 1, y: 0.5 }, rock: { k: 'rock', sx: 3, sy: 2, sz: 2.5, y: 0.8 }, road: { k: 'cobble', w: 4, pts: [[-6, 0], [6, 0]], y: 0 },
    roof: { sx: 12, sz: 8, sy: 4, y: 6 }, flame: { y: 2.5 }, cloth: { sx: 2, sy: 4, c: '#7a1418', y: 6 }, shield: { y: 3 }, chand: { y: 12 } }[t.slice(3)] || {});
  return o;
}

// ================= pointer =================
function updHover(e) { setRay(e); if (tool === 'bd') { hover = bdHit(); return; } hover = (tool === 'place' || tool === 'floor' || tool === 'wall' || tool === 'pnl' || tool === 'scatter' || tool === 'castle') ? surfHit() : groundHit(); if (hover && tool === 'scatter') hover.y = MD.gh(M, hover.x, hover.z); }
function placeObj(h, extra) {
  if (opt.obj.startsWith('room:')) { const r = { id: nid(), ref: opt.obj.slice(5), x: snapV(h.x), z: snapV(h.z), rot: Math.round(ghostRot / (Math.PI / 2)) * (Math.PI / 2) };
    M.rooms.push(r); sel = { k: 'room', id: r.id }; loadRooms().then(() => { syncRooms(); renderSide(); }); return r; }
  const o = protoObj(snapV(h.x), snapV(h.z)); o.id = nid(); if (o.t === 'water') o.y = MD.waterAutoLevel(M, o); else if (o.t !== 'light' && o.t !== 'ring' && o.t !== 'ceil' && o.t !== 'lz' && !MD.isDeco(o.t)) o.y = +(Math.max(0, h.y - MD.gh(M, o.x, o.z))).toFixed(2); Object.assign(o, extra || {});
  M.objs.push(o); syncObj(o); return o;
}
// castle parts: proto at the hover point (grid snap + port snap to other parts), then place
const snapC = v => opt.csnap ? Math.round(v / opt.csnap) * opt.csnap : +v.toFixed(2);
function partPP(k) { const D = MD.PART[k], pp = opt.pp[k] || (opt.pp[k] = {}); for (const q in D.p) if (pp[q] == null) pp[q] = D.p[q][0]; for (const q in D.f) if (pp[q] == null) pp[q] = D.f[q]; if (!pp.c) pp.c = D.c; if (pp.brk == null) pp.brk = 0; return pp; }
function snapPartTo(p) { const sn = opt.psnap && MD.snapPart(M, p); if (sn) { p.x = +(p.x + sn.dx).toFixed(3); p.z = +(p.z + sn.dz).toFixed(3); if (sn.base !== undefined) p.base = Math.abs(sn.base - MD.gh(M, p.x, p.z)) < 0.06 ? null : sn.base; } return !!sn; }
function castleProto(h) { const k = opt.part, p = MD.partNew(k, Object.assign({}, partPP(k), { id: 0, rot: ghostRot, x: snapC(h.x), z: snapC(h.z), base: h.on === 'floor' ? +(Math.round(h.y * 20) / 20).toFixed(2) : null })); snapPartTo(p); return p; }
function placePart(h) { pushUndo('o'); const p = castleProto(h); p.id = nid(); M.parts.push(p); syncPart(p); sel = { k: 'part', id: p.id }; updSel(); renderSide(); changed(); colDirty(); return p; }
const isRoad = r => !!(r && r.k === 'obj' && (find(r) || {}).t === 'dc_road');
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
  const it = sel && (sel.k === 'part' || isRoad(sel)) && find(sel); if (!it || !it.pts) return null;
  const cs = Math.cos(it.rot || 0), sn = Math.sin(it.rot || 0), g0 = MD.gh(M, it.x, it.z), b = it.base != null ? it.base : g0;
  if (it.t === 'dc_road') return it.pts.map(q => { const x = it.x + q[0] * cs + q[1] * sn, z = it.z - q[0] * sn + q[1] * cs; return { x, z, y: MD.gh(M, clamp(x, 0, M.W), clamp(z, 0, M.H)) + (it.y || 0) + 0.4 }; });
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
  if (e.button === 0 && !spaceDown && tc.object && (tc.axis || tc.dragging)) return;   // gizmo handle grabbed
  cv.focus(); cv.setPointerCapture(e.pointerId); updHover(e);
  if (e.button === 2 || e.button === 1 || (e.button === 0 && (spaceDown || (tool === 'select' && gmode === 'hand')))) { drag = { k: e.button === 2 ? 'orbit' : 'pan', x: e.clientX, y: e.clientY }; return; }
  if (e.button !== 0) return;
  if (pickArm) { const P = pickArm; pickOff(); doPick(P); return; }
  if (e.altKey && tool !== 'select' && tool !== 'paint') { const P = toolPick(); if (P) { doPick(P); return; } }
  const inv = e.shiftKey;
  if (tool === 'bd') { if (!hover || !M.bd) return; if (opt.bm === 'stack') { bdStackClick(inv); return; } pushUndo('b'); stroke = { k: 'bd', inv, h0: BD.bdRaw(M.bd, hover.x, hover.z), seed: Math.random() * 99 }; bdBrush(0.016, inv); return; }
  if (tool === 'sculpt') {
    if (!hover) return;
    if (opt.smode === 'ramp') { drag = { k: 'ramp', a: { x: hover.x, z: hover.z } }; return; }
    pushUndo('t'); stroke = { k: 'sculpt', inv, h0: hover.y, seed: Math.random() * 99 };
  } else if (tool === 'paint') { if (!hover) return; if (e.altKey) { opt.surf = M.sf[clamp(Math.round(hover.z / C), 0, M.ny - 1) * M.nx + clamp(Math.round(hover.x / C), 0, M.nx - 1)]; renderOpts(); return; } pushUndo('t'); stroke = { k: 'paint', inv }; paintSurf(inv); }
  else if (tool === 'scatter') { if (!hover) return; pushUndo('o'); stroke = { k: 'scatter', inv, acc: 1 }; }
  else if (tool === 'pnl' && opt.pn.draw === 'round') {   // round tower: click centre, click radius → closed ring of panels
    if (!hover) return; const p = [snapV(hover.x), snapV(hover.z)];
    if (!draft) { pushUndo('o'); draft = { pts: [p], base: hover.on === 'floor' ? +hover.y.toFixed(2) : null, round: 1 }; need(); return; }
    const c = draft.pts[0], r = Math.hypot(p[0] - c[0], p[1] - c[1]); if (r < 0.5) return;
    draft.pts = pnRing(c, r); finishPnl(true);
  }
  else if (tool === 'road') {   // click points -> road (double-click / Enter = finish)
    if (!hover) return; if (!draft) { pushUndo('o'); draft = { pts: [], base: null, h: 0 }; }
    const p = [snapV(hover.x), snapV(hover.z)], l = draft.pts[draft.pts.length - 1]; if (l && Math.hypot(l[0] - p[0], l[1] - p[1]) < 0.3) return;
    draft.pts.push(p); drawHandles(); need();
  }
  else if (tool === 'wall' || tool === 'pnl') {
    if (!hover) return;
    if (!draft) { pushUndo('o'); draft = { pts: [], base: hover.on === 'floor' ? +hover.y.toFixed(2) : null, h: opt.wh }; }
    const p = [snapV(hover.x), snapV(hover.z)], f = draft.pts[0];
    if (f && draft.pts.length > 2 && Math.hypot(f[0] - p[0], f[1] - p[1]) < 0.8) return finishWall(true);
    draft.pts.push(p); drawHandles(); need();
  } else if (tool === 'floor') { if (hover) drag = { k: 'floor', a: { x: hover.x, z: hover.z, y: hover.y } }; }
  else if (tool === 'water') { if (hover) drag = { k: 'water', a: { x: hover.x, z: hover.z } }; }
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
    if (PNT.on) { const h = pickItem(), it2 = h && h.ref && h.ref.k === 'obj' && find(h.ref); if (it2 && it2.t === 'pn_wall') { pnTestHit(it2, h.p, e.shiftKey); return; } }
    if (PNH.on) { const h = pickItem(), it2 = h && h.ref && h.ref.k === 'obj' && find(h.ref); if (it2 && it2.t === 'pn_wall') { pnHoleHit(it2, h.p, e.shiftKey); return; } }
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
    if (p && p.ref) { const same = sameRef(sel, p.ref), was = isSel(p.ref);
      if (e.shiftKey || e.ctrlKey || e.metaKey) { toggleSel(p.ref); renderSide(); updSel(); return; }   // multi-select
      if (!was) msel = []; else if (!same) { msel = msel.filter(q => !sameRef(q, p.ref)); if (sel) msel.push({ k: sel.k, id: sel.id }); }
      sel = { k: p.ref.k, id: p.ref.id };
      if (e.altKey && p.ref.k === 'wall') { insertWallPt(find(sel), p.p.x + M.W / 2, p.p.z + M.H / 2); }
      else if (e.altKey && (p.ref.k === 'part' || isRoad(p.ref)) && find(sel).pts) { insertFreePt(find(sel), p.p.x + M.W / 2, p.p.z + M.H / 2); }
      else if (g && was && opt.dragMove !== 0) {   // drag only an item that was already selected (first click = select only) • Drag Move off = gizmo only
        drag = { k: 'move', gx: g.x, gz: g.z, moved: 0, group: selAll().map(q => { const it = find(q); return { k: q.k, it, o: it && q.k === 'wall' ? it.pts.map(v => v.slice()) : it ? [it.x, it.z] : null }; }).filter(q => q.it) }; }
      if (!same) renderSide(); updSel(); }
    else { const add = e.shiftKey || e.ctrlKey || e.metaKey; if (!add) { sel = null; msel = []; renderSide(); updSel(); } drag = { k: 'box', x0: e.clientX, y0: e.clientY, add }; }   // empty space: drag = box select
  }
});
// box (marquee) select: drag on empty space in the Select tool • Shift/Ctrl = add to the selection • an item counts when its centre (a wall: any point) is inside
const boxEl = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'mb-box' }));
boxEl.style.cssText = 'position:fixed;display:none;pointer-events:none;z-index:50;border:1px solid #5aa0ff;background:rgba(90,160,255,.12)';
function boxRect(d, e) { return [Math.min(d.x0, e.clientX), Math.min(d.y0, e.clientY), Math.max(d.x0, e.clientX), Math.max(d.y0, e.clientY)]; }
function boxDraw(d, e) { const [x0, y0, x1, y1] = boxRect(d, e); if (x1 - x0 < 4 && y1 - y0 < 4) { boxEl.style.display = 'none'; return; }
  Object.assign(boxEl.style, { display: 'block', left: x0 + 'px', top: y0 + 'px', width: (x1 - x0) + 'px', height: (y1 - y0) + 'px' }); }
function boxEnd(d, e) {
  boxEl.style.display = 'none'; const [x0, y0, x1, y1] = boxRect(d, e); if (x1 - x0 < 4 && y1 - y0 < 4) return;
  const r = cv.getBoundingClientRect(), inBox = (x, y, z) => { v3.set(x - M.W / 2, y, z - M.H / 2).project(camera); if (v3.z > 1 || v3.z < -1) return false;
    const sx = (v3.x + 1) / 2 * r.width + r.left, sy = (1 - v3.y) / 2 * r.height + r.top; return sx >= x0 && sx <= x1 && sy >= y0 && sy <= y1; };
  const hits = [];
  for (const [k, key] of Object.entries(KEYS)) for (const it of M[key] || []) {
    const ok = k === 'wall' ? (it.pts || []).some(p => inBox(p[0], (it.base != null ? it.base : MD.gh(M, p[0], p[1])) + (it.h || 0) / 2, p[1]))
      : it.x != null && it.z != null && inBox(it.x, k === 'floor' ? (it.y || 0) : MD.gh(M, it.x, it.z) + (it.y || 0), it.z);
    if (ok) hits.push({ k, id: it.id }); }
  const all = d.add ? selAll().map(q => ({ k: q.k, id: q.id })) : [];
  for (const h of hits) if (!all.some(q => sameRef(q, h))) all.push(h);
  if (!all.length) return;
  sel = all[all.length - 1]; msel = all.slice(0, -1); renderSide(); updSel();
}
cv.addEventListener('pointermove', e => {
  if (drag && (drag.k === 'orbit' || drag.k === 'pan')) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
    if (drag.k === 'orbit') { cam.yaw -= dx * 0.006; cam.pitch += dy * 0.005; }
    else { const s = cam.dist * 0.0016, c = Math.cos(cam.yaw), sn = Math.sin(cam.yaw); cam.x -= (dx * c + dy * sn) * s; cam.z -= (-dx * sn + dy * c) * s; { const L = bdLim(); cam.x = clamp(cam.x, L.x0, L.x1); cam.z = clamp(cam.z, L.z0, L.z1); } }
    camApply(); return;
  }
  updHover(e); status();
  if (drag && drag.k === 'move') { setRay(e); const g = groundHit(); if (!g) return; const dx = g.x - drag.gx, dz = g.z - drag.gz;
    if (!drag.moved && Math.hypot(dx, dz) < 0.15) return; if (!drag.moved) { pushUndo('o'); drag.moved = 1; }
    const one = drag.group.length === 1;
    for (const q of drag.group) { const it = q.it;
      if (q.k === 'wall') it.pts.forEach((p, i) => { p[0] = snapV(q.o[i][0] + dx); p[1] = snapV(q.o[i][1] + dz); });
      else if (q.k === 'part') { const sv = opt.csnap ? snapC : snapV; it.x = clamp(sv(q.o[0] + dx), 0, M.W); it.z = clamp(sv(q.o[1] + dz), 0, M.H); if (one) snapPartTo(it); }
      else { it.x = clamp(snapV(q.o[0] + dx), 0, M.W); it.z = clamp(snapV(q.o[1] + dz), 0, M.H); }
      syncKind(q.k, it); }
    updSel(); }
  else if (drag && drag.k === 'fpt') { setRay(e); const g = groundHit(); if (!g) return; if (!drag.moved) { pushUndo('o'); drag.moved = 1; } const rd = drag.it.t === 'dc_road', sn = rd ? snapV : snapC; drag.it.pts[drag.i] = toLocal(drag.it, clamp(sn(g.x), 0, M.W), clamp(sn(g.z), 0, M.H)); if (rd) { syncObj(drag.it); drawHandles(); } else syncPart(drag.it); }
  else if (drag && drag.k === 'pt') { setRay(e); const g = groundHit(); if (!g) return; if (!drag.moved) { pushUndo('o'); drag.moved = 1; } drag.w.pts[drag.i] = [clamp(snapV(g.x), 0, M.W), clamp(snapV(g.z), 0, M.H)]; syncWalls(); updSel(); }
  else if (drag && drag.k === 'box') boxDraw(drag, e);
  else if (drag && drag.k === 'ramp' && hover) drawLine([[drag.a.x, drag.a.z], [hover.x, hover.z]]);
  else if (drag && drag.k === 'floor' && hover) { const p = [[drag.a.x, drag.a.z], [hover.x, hover.z]]; drawLine(p); }
  else if (drag && drag.k === 'water' && hover) { const a = drag.a, b = hover; drawLine([[a.x, a.z], [b.x, a.z], [b.x, b.z], [a.x, b.z], [a.x, a.z]]); }
  else if (tool === 'pnl' && draft && draft.round && hover) { const c = draft.pts[0], r = Math.hypot(hover.x - c[0], hover.z - c[1]); if (r > 0.3) { const P = pnRing(c, r); P.push(P[0]); drawLine(P); } }
  else if ((tool === 'wall' || tool === 'pnl' || tool === 'road') && draft && hover) drawLine([...draft.pts, [hover.x, hover.z]]);
  else if (tool === 'castle' && fdraft && hover) { const l = [...fdraft.pts, [snapC(hover.x), snapC(hover.z)]]; if (l.length > 2) l.push(l[0]); if (fdraft.base != null) l.y = fdraft.base; drawLine(l); }
  need();
});
cv.addEventListener('pointerup', e => {
  if (drag && drag.k === 'ramp') { if (hover && Math.hypot(hover.x - drag.a.x, hover.z - drag.a.z) > 1) { pushUndo('t'); applyRamp(drag.a, hover, opt.rad * 2); afterTerrain(); } drawLine(null); }
  else if (drag && drag.k === 'floor') { makeFloor(drag.a, hover || drag.a); drawLine(null); }
  else if (drag && drag.k === 'water') { makeWater(drag.a, hover || drag.a); drawLine(null); }
  else if (drag && drag.k === 'box') boxEnd(drag, e);
  else if (drag && (drag.k === 'move' || drag.k === 'pt' || drag.k === 'fpt') && drag.moved) { changed(); colDirty(); renderSide(); }
  if (stroke && stroke.k === 'bd') { bdTreesBuild(); changed(); stroke = null; }
  if (stroke) { if (stroke.k !== 'scatter' && stroke.moved) afterTerrain(); else if (stroke.k === 'scatter') { changed(); colDirty(); } stroke = null; }
  if (drag && drag.k === 'orbit') fly.clear();
  drag = null; need();
});
cv.addEventListener('pointerleave', () => { hover = null; need(); });
cv.addEventListener('dblclick', () => { if (tool === 'road' && draft) finishRoad(); else if ((tool === 'wall' || tool === 'pnl') && draft) { draft.pts.pop(); finishWall(false); } else if (tool === 'castle' && fdraft) { fdraft.pts.pop(); finishFree(); } });
cv.addEventListener('wheel', e => { e.preventDefault();
  if (e.shiftKey && tool === 'bd') { opt.brad = clamp(Math.round(opt.brad * (e.deltaY > 0 ? 0.9 : 1.11)), 3, 400); renderOpts(); need(); return; }
  if (e.shiftKey && (tool === 'sculpt' || tool === 'paint' || tool === 'scatter')) { opt.rad = clamp(+(opt.rad * (e.deltaY > 0 ? 0.9 : 1.11)).toFixed(1), 0.5, 40); renderOpts(); need(); return; }
  if (e.shiftKey && (tool === 'place' || tool === 'castle')) { ghostRot += (e.deltaY > 0 ? 1 : -1) * (tool === 'castle' ? Math.PI / 4 : Math.PI / 12); need(); return; }
  cam.dist *= e.deltaY > 0 ? 1.12 : 0.89; camApply(); }, { passive: false });

function afterTerrain() { syncAll(); buildGrid(); changed(); }
function finishRoad() {
  const d = draft; draft = null; drawLine(null); drawHandles();
  if (!d || d.pts.length < 2) { if (d) undo.pop(); need(); return; }
  const xs = d.pts.map(q => q[0]), zs = d.pts.map(q => q[1]), cx = +((Math.min(...xs) + Math.max(...xs)) / 2).toFixed(2), cz = +((Math.min(...zs) + Math.max(...zs)) / 2).toFixed(2);
  const o = { id: nid(), t: 'dc_road', x: cx, z: cz, y: 0, rot: 0, k: opt.rk, w: opt.rw, pts: d.pts.map(q => [+(q[0] - cx).toFixed(2), +(q[1] - cz).toFixed(2)]) }; if (opt.rc) o.curb = 1;
  M.objs.push(o); syncObj(o); sel = { k: 'obj', id: o.id }; updSel(); renderSide(); changed(); drawHandles();
}
function finishWall(closed) {
  if (tool === 'road') return finishRoad();
  if (tool === 'pnl') return finishPnl(closed);
  const d = draft; draft = null; drawLine(null);
  if (d && d.pts.length >= 2) { const P = MD.WALL_PRESET[opt.wall] || {}; const w = { id: nid(), pts: d.pts, th: opt.wth, h: opt.wh, c: opt.wc, m: opt.wm, closed: closed ? 1 : 0, curve: opt.wcurve ? 1 : 0, brk: opt.wbrk ? 1 : 0, base: d.base, n: P.n };
    M.walls.push(w); sel = { k: 'wall', id: w.id }; syncWalls(); changed(); colDirty(); renderSide(); }
  else undo.pop();
  updSel();
}
function insertFreePt(it, x, z) {   // Alt+click on a free shape: add a vertex on the nearest edge
  const [lx, lz] = toLocal(it, x, z), P = it.pts, n = P.length; let bi = 0, bd = 1e9;
  for (let i = 0; i < (it.t === 'dc_road' ? n - 1 : n); i++) { const a = P[i], b = P[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((lx - a[0]) * dx + (lz - a[1]) * dz) / (dx * dx + dz * dz || 1), 0, 1), d = Math.hypot(a[0] + dx * t - lx, a[1] + dz * t - lz); if (d < bd) { bd = d; bi = i; } }
  pushUndo('o'); P.splice(bi + 1, 0, [lx, lz]); sel.pt = bi + 1; if (it.t === 'dc_road') { syncObj(it); drawHandles(); } else syncPart(it); changed(); colDirty(); renderSide();
}
function insertWallPt(w, x, z) {
  let bi = 0, bd = 1e9; const n = w.pts.length, m = w.closed ? n : n - 1;
  for (let i = 0; i < m; i++) { const a = w.pts[i], b = w.pts[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1), 0, 1), d = Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z); if (d < bd) { bd = d; bi = i; } }
  pushUndo('o'); w.pts.splice(bi + 1, 0, [+x.toFixed(2), +z.toFixed(2)]); sel.pt = bi + 1; syncWalls(); changed(); colDirty();
}
// Water tool: rect A→B (or 12 m square at A) • level = just under the lowest edge • optional smooth bed
function makeWater(A, B) {
  const big = Math.abs(B.x - A.x) > 1.5 && Math.abs(B.z - A.z) > 1.5, o = { id: nid(), t: 'water', rot: 0, k: opt.wk };
  if (big) Object.assign(o, { x: r2((A.x + B.x) / 2), z: r2((A.z + B.z) / 2), sx: r2(Math.abs(B.x - A.x)), sz: r2(Math.abs(B.z - A.z)) }); else Object.assign(o, { x: snapV(A.x), z: snapV(A.z), sx: 12, sz: 12 });
  pushUndo(opt.wdig ? 'a' : 'o'); o.y = MD.waterAutoLevel(M, o);
  if (opt.wdig) waterDigNow(o);
  M.objs.push(o); syncObj(o); sel = { k: 'obj', id: o.id }; changed(); renderSide(); updSel();
}
function waterDigNow(o) { const [i0, j0, i1, j1] = MD.waterDig(M, o, opt.wdep); updTerrain(i0, j0, i1, j1); afterTerrain(); colDirty(); }
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

// ================= gizmo: arrows / ring / boxes on the selection (three TransformControls) =================
// 1 = move (world axes, Y = height) • 2 = rotate (Y ring) • 3 = size (local axes of the item) • 0 = off. One undo step per drag.
// The anchor sits in `root` (map coords); each drag maps the anchor's change onto the item's own fields from a copy taken at mouse-down.
let gmode = 'translate', gz = null;   // 'hand' | 'translate' | 'rotate' | 'scale'
const yawOf = q => 2 * Math.atan2(q.y, q.w), r2 = v => +v.toFixed(2), r3 = v => +v.toFixed(3);
const sns = v => { const st = opt.snap ? opt.snap / 2 : 0; return st ? Math.max(st, +(Math.round(v / st) * st).toFixed(3)) : r2(v); };   // gizmo sizes snap to half the grid step
const flatRot = it => MD.AREA.has(it.t);   // axis-aligned in the game
const isDeco = it => OBJ[it.t] && OBJ[it.t].cat === 'deco';
function gScaleKind(k, it) {   // how [3] size maps onto this item: 'u' uniform s, 'p' panel L/sy/T, 'L' length, 'xyz' / 'xz' sizes, 'f' floor, 'w' wall, 'fp' free shape, 'cp' castle part, null = none
  if (k === 'room') return null; if (k === 'wall') return 'w'; if (k === 'floor') return 'f'; if (k === 'part') return it.pts ? 'fp' : 'cp';
  if (isKit(it) || it.t === 'core') return 'u'; if (it.t === 'pn_wall') return 'p'; if (MD.isRP(it.t) && it.L) return 'L';
  if (isPrim(it) || isDeco(it)) return 'xyz'; if (it.t === 'house' || it.t === 'water' || MD.AREA.has(it.t)) return 'xz'; return null;
}
function placeGizmo() {
  if (gz) return; const it = tool === 'select' && gmode !== 'hand' && sel && sel.pt == null ? find(sel) : null;
  syncGbar(); if (!it) { tc.detach(); need(); return; }
  const k = sel.k, b = selBox && selBox.box;
  const px = k === 'wall' ? it.pts.reduce((s, p) => s + p[0], 0) / it.pts.length : it.x, pz = k === 'wall' ? it.pts.reduce((s, p) => s + p[1], 0) / it.pts.length : it.z;
  gAnchor.position.set(px, b && !b.isEmpty() ? (b.min.y + b.max.y) / 2 : MD.gh(M, px, pz), pz);
  const tilt = k === 'obj' && tiltOk(it) && gmode !== 'translate';
  if (tilt) gAnchor.quaternion.setFromEuler(new THREE.Euler(it.rx || 0, it.rot || 0, it.rz || 0, 'YXZ'));
  else gAnchor.quaternion.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, gmode === 'translate' || k === 'wall' || flatRot(it) ? 0 : it.rot || 0); gAnchor.scale.set(1, 1, 1);
  const sk = gScaleKind(k, it);
  if (gmode === 'translate') { tc.showX = tc.showZ = true; tc.showY = k !== 'room'; }
  else if (gmode === 'rotate') { tc.showX = tc.showZ = tilt; tc.showY = !flatRot(it); if (k === 'obj' && it.t === 'pn_wall') tc.showX = true; }   // breakable panel: X ring (length axis) = Tilt
  else if (gmode === 'resize') { const ok = sk === 'xyz' || sk === 'xz' || sk === 'p' || sk === 'f'; tc.showX = tc.showZ = ok; tc.showY = ok && (sk === 'xyz' || sk === 'p'); }   // one-sided: drag a face, the opposite face stays
  else { tc.showX = tc.showZ = !!sk && sk !== 'u' && sk !== 'cp' && sk !== 'L'; tc.showY = !!sk && sk !== 'xz' && sk !== 'L'; if (sk === 'u' || sk === 'cp' || sk === 'L') tc.showX = tc.showY = tc.showZ = true; }
  if (!tc.showX && !tc.showY && !tc.showZ) { tc.detach(); need(); return; }
  tc.setMode(gmode === 'resize' ? 'scale' : gmode); tc.setSpace(gmode === 'translate' ? 'world' : 'local');
  tc.setTranslationSnap(opt.snap || null); tc.setRotationSnap(k === 'room' ? Math.PI / 2 : Math.PI / 36);
  if (tc.object !== gAnchor) tc.attach(gAnchor); need();
}
function setGizmo(m) { gmode = m; if (tool !== 'select') setTool('select'); else placeGizmo(); }
function syncGbar() { for (const b of document.querySelectorAll('#gbar [data-g]')) b.classList.toggle('on', tool === 'select' && b.dataset.g === gmode); cv.classList.toggle('hand', tool === 'select' && gmode === 'hand'); }
tc.addEventListener('change', need);
tc.addEventListener('mouseDown', () => { const it = find(sel); if (!it) return; gz = { it, k: sel.k, ms: msel.map(q => ({ k: q.k, it: find(q), s: JSON.parse(JSON.stringify(find(q) || null)) })).filter(q => q.it), s: JSON.parse(JSON.stringify(it)), j: JSON.stringify(it), p: gAnchor.position.clone(), r0: yawOf(gAnchor.quaternion) }; pushUndo('o'); });
tc.addEventListener('mouseUp', () => { const z = gz; if (!z) return; gz = null;
  if (JSON.stringify(z.it) === z.j) undo.pop(); else { changed(); colDirty(); renderSide(); } updSel(); });
tc.addEventListener('objectChange', () => {
  const z = gz; if (!z) return; const { it, k, s } = z;
  if (gmode === 'translate') {
    const dx = gAnchor.position.x - z.p.x, dy = gAnchor.position.y - z.p.y, dz = gAnchor.position.z - z.p.z, up = Math.abs(dy) > 0.004;
    if (k === 'wall') { it.pts = s.pts.map(p => [r2(clamp(p[0] + dx, 0, M.W)), r2(clamp(p[1] + dz, 0, M.H))]); if (up) it.base = r2((s.base != null ? s.base : MD.gh(M, s.pts[0][0], s.pts[0][1])) + dy); }
    else { it.x = r2(clamp(s.x + dx, 0, M.W)); it.z = r2(clamp(s.z + dz, 0, M.H));
      if (up && k === 'obj') it.y = r2((s.y != null ? s.y : it.t === 'ring' ? 6 : it.t === 'light' ? 2.2 : it.t === 'ceil' ? 21 : it.t === 'lz' ? 22 : 0) + dy);   // may go below 0 = sunk into the ground
      else if (up && k === 'part') it.base = r2((s.base != null ? s.base : MD.gh(M, s.x, s.z)) + dy);
      else if (up && k === 'floor') { it.y = r2(s.y + dy); it.y2 = r2((s.y2 == null ? s.y : s.y2) + dy); } }
    for (const q of z.ms) { const o = q.it, c = q.s;   // other selected items follow the same move
      if (q.k === 'wall') { o.pts = c.pts.map(p => [r2(clamp(p[0] + dx, 0, M.W)), r2(clamp(p[1] + dz, 0, M.H))]); if (up) o.base = r2((c.base != null ? c.base : MD.gh(M, c.pts[0][0], c.pts[0][1])) + dy); }
      else { o.x = r2(clamp(c.x + dx, 0, M.W)); o.z = r2(clamp(c.z + dz, 0, M.H));
        if (up && q.k === 'obj') o.y = r2((c.y != null ? c.y : o.t === 'ring' ? 6 : o.t === 'light' ? 2.2 : o.t === 'ceil' ? 21 : o.t === 'lz' ? 22 : 0) + dy);
        else if (up && q.k === 'part') o.base = r2((c.base != null ? c.base : MD.gh(M, c.x, c.z)) + dy);
        else if (up && q.k === 'floor') { o.y = r2(c.y + dy); o.y2 = r2((c.y2 == null ? c.y : c.y2) + dy); } }
      syncKind(q.k, o); }
  } else if (gmode === 'rotate') {
    let a = yawOf(gAnchor.quaternion) - z.r0; a = Math.atan2(Math.sin(a), Math.cos(a));
    if (k === 'wall') { const cx = z.p.x, cz = z.p.z, c = Math.cos(a), sn = Math.sin(a); it.pts = s.pts.map(p => { const x = p[0] - cx, q = p[1] - cz; return [r2(cx + x * c + q * sn), r2(cz - x * sn + q * c)]; }); }
    else if (k === 'obj' && it.t === 'pn_wall' && tc.axis === 'X') {   // panel Tilt (tl) about its length axis • anchor is yaw-only, so Euler x = the drag
      let v = (s.tl || 0) + new THREE.Euler().setFromQuaternion(gAnchor.quaternion, 'YXZ').x; v = +Math.atan2(Math.sin(v), Math.cos(v)).toFixed(4);
      if (Math.abs(v) < 1e-3) delete it.tl; else it.tl = v; }
    else if (k === 'obj' && tiltOk(it)) { const e = new THREE.Euler().setFromQuaternion(gAnchor.quaternion, 'YXZ'), w = v => { v = Math.atan2(Math.sin(v), Math.cos(v)); return Math.abs(v) < 1e-3 ? 0 : +v.toFixed(4); };
      const r = w(e.y); it.rot = r < 0 ? +(r + 6.2832).toFixed(4) : r; it.rx = w(e.x); it.rz = w(e.z); if (!it.rx) delete it.rx; if (!it.rz) delete it.rz; }
    else { const r = ((s.rot || 0) + a) % 6.2832; it.rot = +(r < 0 ? r + 6.2832 : r).toFixed(4); }
  } else if (gmode === 'resize') {   // T: grow/shrink only the grabbed side (TransformControls scale handles exist at both ends; pointStart tells which)
    const ax = tc.axis; if (!ax || ax.length !== 1) return; const sk = gScaleKind(k, it), c = 'xyz'['XYZ'.indexOf(ax)];
    const inv = gAnchor.quaternion.clone().invert(), ps = tc.pointStart.clone().applyQuaternion(inv), pe = tc.pointEnd.clone().applyQuaternion(inv), sg = Math.sign(ps[c]) || 1;
    const st = opt.snap ? opt.snap / 2 : 0; let d = (pe[c] - ps[c]) * sg; if (st) d = Math.round(d / st) * st;
    const F = sk === 'p' ? { x: 'L', y: 'sy', z: 'T' } : sk === 'f' ? { x: 'w', z: 'd' } : { x: 'sx', y: 'sy', z: 'sz' }, key = F[c]; if (!key) return;
    const def = { L: 4, sy: sk === 'p' ? 3 : 1, T: 0.3, sx: 1, sz: 1 }[key] || 1, s0 = s[key] != null ? s[key] : def, n = r3(Math.max(key === 'T' ? 0.03 : 0.1, s0 + d)), real = n - s0;
    it[key] = n;
    if (c === 'y') { if (sg < 0 && k === 'obj') it.y = r3((s.y || 0) - real); }   // bottom handle: grow downward
    else { const v = new THREE.Vector3(c === 'x' ? real / 2 * sg : 0, 0, c === 'z' ? real / 2 * sg : 0).applyQuaternion(gAnchor.quaternion); it.x = r3(s.x + v.x); it.z = r3(s.z + v.z); }
  } else {
    const S = gAnchor.scale, f = [S.x, S.y, S.z].reduce((m, v) => Math.abs(Math.log(Math.max(v, 1e-3))) > Math.abs(Math.log(Math.max(m, 1e-3))) ? v : m, 1), sk = gScaleKind(k, it), mn = v => Math.max(0.05, v);
    if (sk === 'u') it.s = r2(mn((s.s || (it.t === 'core' ? 4 : 1)) * f));
    else if (sk === 'p') { it.L = sns(mn((s.L || 4) * S.x)); it.sy = sns(mn((s.sy || 3) * S.y)); it.T = r3(Math.max(0.03, (s.T || 0.3) * S.z)); }
    else if (sk === 'L') it.L = r2(mn(s.L * f));
    else if (sk === 'xyz' || sk === 'xz') { it.sx = sns(mn((s.sx || 1) * S.x)); it.sz = sns(mn((s.sz || 1) * S.z)); if (sk === 'xyz') it.sy = sns(mn((s.sy || 1) * S.y)); }
    else if (sk === 'f') { it.w = sns(mn(s.w * S.x)); it.d = sns(mn(s.d * S.z)); if (s.th) it.th = r2(mn(s.th * S.y)); }
    else if (sk === 'fp') { it.pts = s.pts.map(q => [r3(q[0] * S.x), r3(q[1] * S.z)]); it.h = r2(clamp(s.h * S.y, 0.5, 40)); }
    else if (sk === 'cp') { const D = MD.PART[it.k], q = D.main; it[q] = r2(clamp(s[q] * f, D.p[q][1], D.p[q][2])); }
    else if (sk === 'w') { const cx = z.p.x, cz = z.p.z; it.pts = s.pts.map(p => [r2(cx + (p[0] - cx) * S.x), r2(cz + (p[1] - cz) * S.z)]); it.h = r2(mn(s.h * S.y)); }
  }
  if (k === 'obj') syncObj(it); else if (k === 'part') syncPart(it); else if (k === 'room') syncRooms(); else if (k === 'wall') { syncWalls(); updSel(); } else { syncFloors(); updSel(); }
});

// ================= Hierarchy (left dock, Unity-style tree of the map’s content) =================
// Groups: Walls / Upper Floors / Breakable Panels (by group) / Objects (by category) / Castle / Rooms • click = select, double-click = frame • search filters by name
const hOpen = new Set(['walls', 'floors', 'pnl', 'objs', 'parts', 'rooms']); let hRAF = 0;
const hierSoon = () => { cancelAnimationFrame(hRAF); hRAF = requestAnimationFrame(renderHier); };
const catOf = o => isPrim(o) && o.vis === 0 && o.col !== 0 ? 'collide' : isKit(o) ? ((KIT.byId.get(kitId(o)) || {}).cat || 'user') : (OBJ[o.t] ? OBJ[o.t].cat : 'other');
const catName = c => (CATS.find(x => x[0] === c) || [c, c])[1];
function hName(k, it) {
  if (k === 'wall') return 'Wall ' + it.id; if (k === 'floor') return 'Upper Floor ' + it.id; if (k === 'room') return 'Room ' + it.ref;
  if (k === 'part') return (MD.PART[it.k] ? MD.PART[it.k].n : it.k) + ' ' + it.id;
  if (isKit(it)) { const a = KIT.byId.get(kitId(it)); return a ? a.name : kitId(it); }
  return (OBJ[it.t] ? OBJ[it.t].n : it.t) + (it.t === 'pn_wall' ? ' ' + it.id : '');
}
function hKeys(k, it) {   // groups that must be open to show this item
  if (it.grp) return ['u/' + it.grp];
  if (k === 'wall') return ['walls']; if (k === 'floor') return ['floors']; if (k === 'part') return ['parts']; if (k === 'room') return ['rooms'];
  if (it.t === 'pn_wall') return ['pnl', 'pnl/' + (it.g == null || it.g === '' ? '–' : it.g)]; return ['objs', 'objs/' + catOf(it)];
}
// ================= user groups (Hierarchy folders): item.grp = name • M.groups = order (keeps empty groups) • editor only, the game ignores them =================
let hRen = null;   // group name being renamed inline in the Hierarchy
const allItems = () => Object.entries(KEYS).flatMap(([k, key]) => (M[key] || []).map(it => [k, it]));
function grpList() { const L = (M.groups || []).slice(); for (const [, it] of allItems()) if (it.grp && !L.includes(it.grp)) L.push(it.grp); return L; }
const grpItems = g => allItems().filter(([, it]) => it.grp === g).map(([k, it]) => ({ k, id: it.id }));
function grpSelect(g, add) { const L = grpItems(g); if (!L.length) return; const S = add ? selAll() : []; for (const r of L) if (!S.some(q => sameRef(q, r))) S.push(r); sel = S.pop(); msel = S; renderSide(); updSel(); need(); }
function grpSet(g, S = selAll()) {   // put the items in group g ('' = take them out of their group)
  if (!S.length) { stat('Select something first (Shift+click to pick several)', 'warn'); return false; }
  pushUndo('o'); for (const r of S) { const it = find(r); if (!it) continue; if (g) it.grp = g; else delete it.grp; }
  if (g) { M.groups = grpList(); if (!M.groups.includes(g)) M.groups.push(g); hOpen.add('u/' + g); }
  renderSide(); changed(); return true;
}
function grpNew() { const L = grpList(); let i = L.length + 1; while (L.includes('Group ' + i)) i++; const g = 'Group ' + i; if (grpSet(g)) { hRen = g; renderHier(); } }
function grpRename(g, n) {   // '' = dissolve (items go back to their normal place)
  n = (n || '').trim(); if (n === g) return; pushUndo('o');
  for (const [, it] of allItems()) if (it.grp === g) { if (n) it.grp = n; else delete it.grp; }
  const L = grpList().filter(x => x !== n); M.groups = n ? L.map(x => x === g ? n : x) : L.filter(x => x !== g); if (n) hOpen.add('u/' + n);
  renderSide(); changed();
}
function hierSel() { const it = find(sel); if (it) for (const k of hKeys(sel.k, it)) hOpen.add(k); renderHier(); }
function renderHier() {
  const box = $('hier'); if (!box || !M) return; const top = box.scrollTop; box.textContent = '';
  const q = (($('hq') || {}).value || '').trim().toLowerCase(), match = n => !q || n.toLowerCase().includes(q), pad = d => 'padding-left:' + (4 + d * 14) + 'px';
  const leaf = (d, k, it) => { const n = hName(k, it); if (!match(n)) return 0; const on = isSel({ k, id: it.id });
    box.append(el('div', { class: 'hrow' + (on ? ' on' : ''), style: pad(d), onclick: e => { if (e.shiftKey || e.ctrlKey || e.metaKey) toggleSel({ k, id: it.id }); else { sel = { k, id: it.id }; msel = []; } renderSide(); updSel(); }, ondblclick: () => { sel = { k, id: it.id }; frameSel(); } },
      el('span', { class: 'hic' }, '▪'), n, it.vis === 0 ? el('span', { class: 'hdim' }, '  (hidden)') : null)); return 1; };
  const group = (d, key, label, items, sub) => {   // items = [[k, it]] • sub = [[key, label, items]]
    const total = items.length + (sub ? sub.reduce((a, g) => a + g[2].length, 0) : 0); if (!total) return;
    const open = hOpen.has(key) || !!q;
    box.append(el('div', { class: 'hrow hgrp', style: pad(d), onclick: () => { hOpen.has(key) ? hOpen.delete(key) : hOpen.add(key); renderHier(); } }, el('span', { class: 'harr' }, open ? '▾' : '▸'), label, el('span', { class: 'hcnt' }, String(total))));
    if (!open) return;
    if (sub) for (const g of sub) group(d + 1, key + '/' + g[0], g[1], g[2]);
    let n = 0; for (const [k, it] of items) { if (n >= 300) { box.append(el('div', { class: 'hrow hdim', style: pad(d + 1) }, '… more (use Search)')); break; } n += leaf(d + 1, k, it); }
  };
  box.append(el('div', { class: 'hrow root' + (sel ? '' : ' on'), style: pad(0), onclick: () => { sel = null; renderSide(); updSel(); } }, el('span', { class: 'harr' }, '◆'), M.name || M.id || 'Untitled'));
  box.append(el('div', { class: 'hrow', style: pad(1), title: 'Terrain: use the Sculpt / Paint tools • click = map settings in the Inspector', onclick: () => { sel = null; renderSide(); updSel(); } }, el('span', { class: 'hic' }, '⛰'), 'Terrain ' + M.W + ' × ' + M.H));
  const ug = new Map(grpList().map(g => [g, []])), ng = it => !it.grp;
  for (const [k, it] of allItems()) if (it.grp) ug.get(it.grp).push([k, it]);
  for (const [g, L] of ug) {   // user folders: arrow = open/close • name = select all • double-click name = rename
    const key = 'u/' + g, hit = L.filter(([k, it]) => match(hName(k, it))); if (q && !hit.length && !match(g)) continue;
    const open = hOpen.has(key) || (!!q && hit.length > 0), on = L.length > 0 && L.every(([k, it]) => isSel({ k, id: it.id }));
    if (hRen === g) { const inp = el('input', { class: 'tl-in', value: g, style: 'flex:1;padding:0 4px;font-size:12px' }); let done = 0; const fin = ok => { if (done) return; done = 1; hRen = null; if (ok) grpRename(g, inp.value); else renderHier(); };
      inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') fin(1); else if (e.key === 'Escape') fin(0); }; inp.onblur = () => fin(1);
      box.append(el('div', { class: 'hrow hgrp', style: pad(1) }, el('span', { class: 'harr' }, '▾'), inp)); setTimeout(() => { inp.focus(); inp.select(); }); }
    else box.append(el('div', { class: 'hrow hgrp hug' + (on ? ' on' : ''), style: pad(1), title: 'Click = select the whole group (Shift = add) • double-click = rename (empty name = ungroup) • Ctrl+G = group the selection • Ctrl+Shift+G = ungroup it',
        onclick: e => { if (e.target.classList.contains('harr')) { open ? hOpen.delete(key) : hOpen.add(key); renderHier(); return; } grpSelect(g, e.shiftKey || e.ctrlKey || e.metaKey); }, ondblclick: e => { if (e.target.classList.contains('harr')) return; hRen = g; renderHier(); } },
      el('span', { class: 'harr' }, open ? '▾' : '▸'), el('span', { class: 'hic' }, '📁'), g, el('span', { class: 'hcnt' }, String(L.length))));
    if (open) { let n = 0; for (const [k, it] of q ? hit : L) { if (n >= 300) break; n += leaf(2, k, it); } if (!L.length) box.append(el('div', { class: 'hrow hdim', style: pad(2) }, '(empty — select items + Ctrl+G or use Group in the Inspector)')); }
  }
  group(1, 'walls', 'Walls', M.walls.filter(ng).map(w => ['wall', w]));
  group(1, 'floors', 'Upper Floors', M.floors.filter(ng).map(f => ['floor', f]));
  const pg = new Map(), oc = new Map();
  for (const o of M.objs) { if (o.grp) continue; if (o.t === 'pn_wall') { const g = o.g == null || o.g === '' ? '–' : o.g; if (!pg.has(g)) pg.set(g, []); pg.get(g).push(['obj', o]); } else { const c = catOf(o); if (!oc.has(c)) oc.set(c, []); oc.get(c).push(['obj', o]); } }
  group(1, 'pnl', 'Breakable Panels', [], [...pg].sort((a, b) => String(a[0]).localeCompare(String(b[0]))).map(([g, L]) => [g, 'Group ' + g, L]));
  group(1, 'objs', 'Objects', [], [...oc].map(([c, L]) => [c, catName(c), L]));
  group(1, 'parts', 'Castle', M.parts.filter(ng).map(p => ['part', p]));
  group(1, 'rooms', 'Rooms', (M.rooms || []).filter(ng).map(r => ['room', r]));
  box.scrollTop = top; const on = box.querySelector('.hrow.on:not(.root)'); if (on && (on.offsetTop < box.scrollTop || on.offsetTop > box.scrollTop + box.clientHeight - 20)) on.scrollIntoView({ block: 'nearest' });
}

// ================= keyboard =================
addEventListener('keydown', e => {
  if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { spaceDown = true; e.preventDefault(); }
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { if (e.key === 'Escape') document.activeElement.blur(); return; }
  if (drag && drag.k === 'orbit' && /^Key[WASDQE]$/.test(e.code)) { fly.add(e.code); fly.fast = e.shiftKey; e.preventDefault(); return; }   // right-drag + WASD = fly (Unity)
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); save(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); doRedo(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'd') { e.preventDefault(); dupSel(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'g') { e.preventDefault(); if (e.shiftKey) grpSet(''); else grpNew(); return; }   // group / ungroup the selection
  if (e.ctrlKey || e.metaKey) return;
  if (k === 'q' || k === 'w' || k === 'e' || k === 'r' || (k === 't' && !e.shiftKey)) { setGizmo({ q: 'hand', w: 'translate', e: 'rotate', r: 'scale', t: 'resize' }[k]); return; }   // Unity transform tools
  const T = TOOLS.find(t => t[3] === k); if (T) { setTool(T[0]); return; }
  if (k === 'escape' && $('gv').classList.contains('on')) { gameViewClose(); return; }
  if (k === 'escape' && pickArm) { pickOff(); need(); return; }
  if (k === 'escape') { if (fdraft) { fdraft = null; undo.pop(); drawLine(null); drawHandles(); } else if (draft) { draft = null; undo.pop(); drawLine(null); drawHandles(); } else { sel = null; renderSide(); updSel(); } need(); }
  else if (k === 'enter' && fdraft) finishFree();
  else if (k === 'backspace' && fdraft) { fdraft.pts.pop(); if (!fdraft.pts.length) { fdraft = null; undo.pop(); drawLine(null); } drawHandles(); need(); }
  else if (k === 'enter' && draft) finishWall(false);
  else if (k === 'backspace' && draft) { draft.pts.pop(); drawHandles(); need(); }
  else if (k === 'delete' || k === 'backspace') delSel();
  else if (k === 'home') fit();
  else if (k === 't') { cam.pitch = 1.55; cam.yaw = 0; camApply(); }
  else if (k === 'f') frameSel();
  else if (k === ',' || k === '.' || k === '<' || k === '>') { const cst = tool === 'castle' || (sel && sel.k === 'part'), a = (k === ',' || k === '<' ? 1 : -1) * (cst ? (e.shiftKey ? Math.PI / 12 : Math.PI / 4) : (e.shiftKey ? Math.PI / 36 : Math.PI / 12)); if (tool === 'place' || tool === 'floor' || tool === 'castle') { ghostRot += a; need(); } else rotSel(a); }
  else if ((k === '[' || k === ']') && tool === 'bd') { opt.brad = clamp(Math.round(opt.brad * (k === '[' ? 0.85 : 1.18)), 3, 400); renderOpts(); need(); }
  else if (k === '[' || k === ']') { if (tool === 'sculpt' || tool === 'paint' || tool === 'scatter') { opt.rad = clamp(+(opt.rad * (k === '[' ? 0.85 : 1.18)).toFixed(1), 0.5, 40); renderOpts(); } else scaleSel(k === '[' ? 0.9 : 1.1); need(); }
  else if (k === 'end') { e.preventDefault(); snapGround(); }
  else if (k === 'pageup' || k === 'pagedown') { e.preventDefault(); liftSel((k === 'pageup' ? 1 : -1) * (e.shiftKey ? 0.05 : 0.25)); }
});
addEventListener('keyup', e => { if (e.code === 'Space') spaceDown = false; fly.delete(e.code); fly.fast = e.shiftKey; });
function frameSel() { const it = find(sel); if (!it) return; cam.x = it.x != null ? it.x : it.pts[0][0]; cam.z = it.z != null ? it.z : it.pts[0][1]; cam.dist = Math.min(cam.dist, 30); camApply(); }
function editSel(fn) { const it = find(sel); if (!it) return; pushUndo('o'); fn(it); resync(); renderSide(); }
function resync() { const it = find(sel); if (sel && sel.k === 'room') { syncAll(); changed(); return; } if (sel && sel.k === 'obj' && it) syncObj(it); else if (sel && sel.k === 'part' && it) syncPart(it); else if (sel && sel.k === 'wall') syncWalls(); else syncFloors(); updSel(); changed(); colDirty(); }
function delSel() { if (!sel) return;
  if (msel.length) { pushUndo('o'); for (const q of selAll()) M[KEYS[q.k]] = M[KEYS[q.k]].filter(v => v.id !== q.id); sel = null; msel = []; syncAll(); renderSide(); changed(); return; }   // multi
  const w = sel.k === 'wall' && find(sel), fp = (sel.k === 'part' || isRoad(sel)) && find(sel);
  if (fp && fp.pts && sel.pt != null && fp.pts.length > (fp.t === 'dc_road' ? 2 : 3)) { pushUndo('o'); fp.pts.splice(sel.pt, 1); sel.pt = null; resync(); drawHandles(); return; }
  if (w && sel.pt != null && w.pts.length > 2) { pushUndo('o'); w.pts.splice(sel.pt, 1); sel.pt = null; resync(); return; }
  pushUndo('o'); const key = KEYS[sel.k]; M[key] = M[key].filter(v => v.id !== sel.id); sel = null; syncAll(); renderSide(); changed(); }
function dupSel() {   // copies stay exactly where the originals are (move them with the gizmo) • all selected items are copied, the copies become the selection
  if (!find(sel)) return; pushUndo('o'); const out = [];
  for (const q of selAll()) { const it = find(q); if (!it) continue; const c = JSON.parse(JSON.stringify(it)); c.id = nid(); M[KEYS[q.k]].push(c); out.push({ k: q.k, id: c.id }); }
  sel = out[0] || null; msel = out.slice(1); syncAll(); renderSide(); changed(); }
function rotSel(a) { if (!find(sel)) return; if (sel.k === 'room') { editSel(it => { it.rot = +((((it.rot || 0) + Math.sign(a) * Math.PI / 2) % 6.2832 + 6.2832) % 6.2832).toFixed(4); }); return; } editSel(it => { if (it.pts && sel.k === 'wall') { const cx = it.pts.reduce((s, p) => s + p[0], 0) / it.pts.length, cz = it.pts.reduce((s, p) => s + p[1], 0) / it.pts.length, c = Math.cos(a), s = Math.sin(a); it.pts = it.pts.map(p => { const x = p[0] - cx, z = p[1] - cz; return [+(cx + x * c + z * s).toFixed(2), +(cz - x * s + z * c).toFixed(2)]; }); } else it.rot = +(((it.rot || 0) + a) % 6.2832).toFixed(4); }); }
function scaleSel(k) { if (!find(sel)) return; editSel(it => { if (sel.k === 'obj') { if (isKit(it)) it.s = +((it.s || 1) * k).toFixed(2); else if (isPrim(it) || it.t === 'house' || MD.AREA.has(it.t)) { it.sx = +((it.sx || 1) * k).toFixed(2); it.sz = +((it.sz || 1) * k).toFixed(2); if (isPrim(it)) it.sy = +((it.sy || 1) * k).toFixed(2); } else if (it.t === 'core') it.s = +((it.s || 4) * k).toFixed(2); else if ((MD.isRP(it.t) || it.t === 'pn_wall') && it.L) it.L = +(it.L * k).toFixed(2); } else if (sel.k === 'part' && it.pts) { it.pts = it.pts.map(q => [+(q[0] * k).toFixed(3), +(q[1] * k).toFixed(3)]); it.h = +clamp(it.h * k, 0.5, 40).toFixed(2); } else if (sel.k === 'part') { const D = MD.PART[it.k], q = D.main, mn = D.p[q][1], mx = D.p[q][2]; it[q] = +clamp(it[q] * k, mn, mx).toFixed(2); } else if (sel.k === 'floor') { it.w = +(it.w * k).toFixed(2); it.d = +(it.d * k).toFixed(2); } else it.h = +(it.h * k).toFixed(2); }); }
function snapGround() {   // End: move the selection so its lowest point meets the LOWEST ground under its footprint (sinks into slopes, no gap below)
  const it = find(sel), b = selBox && selBox.box; if (!it || !b || b.isEmpty() || sel.k === 'floor' || sel.k === 'room') return;
  if (sel.k === 'obj' && (it.t === 'ring' || it.t === 'light' || it.t === 'water' || MD.AREA.has(it.t))) return;
  const d = sel.k === 'obj' ? (it.t === 'pn_wall' ? { ex: (it.L || 4) / 2, ez: (it.T || 0.3) / 2 } : dim(it)) : null, pts = [];
  if (d && !it.rx && !it.rz && !it.tl) { const c = Math.cos(it.rot || 0), sn = Math.sin(it.rot || 0);   // true (rotated) footprint
    for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) { const lx = (i / 3 - 1) * d.ex, lz = (j / 3 - 1) * d.ez; pts.push([it.x + lx * c + lz * sn, it.z - lx * sn + lz * c]); } }
  else for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) pts.push([b.min.x + M.W / 2 + (b.max.x - b.min.x) * i / 6, b.min.z + M.H / 2 + (b.max.z - b.min.z) * j / 6]);   // selection box (world → map coords)
  const g = Math.min(...pts.map(([x, z]) => MD.gh(M, clamp(x, 0, M.W), clamp(z, 0, M.H)))), dy = +(g - b.min.y).toFixed(3);
  if (Math.abs(dy) > 0.004) liftSel(dy);
}
function liftSel(d) { if (!find(sel)) return; editSel(it => { if (sel.k === 'obj') it.y = +((it.y || 0) + d).toFixed(3); else if (sel.k === 'part') it.base = +((it.base != null ? it.base : MD.gh(M, it.x, it.z)) + d).toFixed(2); else if (sel.k === 'floor') { it.y = +(it.y + d).toFixed(2); it.y2 = +((it.y2 == null ? it.y : it.y2) + d).toFixed(2); } else it.base = +((it.base != null ? it.base : MD.gh(M, it.pts[0][0], it.pts[0][1])) + d).toFixed(2); }); }

// ================= UI: tools + options =================
// breakable panels: each segment of the drawn line = one pn_wall, all in a new group (they hold each other up); joints overlap by half the thickness
function finishPnl(closed) {
  const d = draft; draft = null; drawLine(null); drawHandles();
  if (!d || d.pts.length < 2) { undo.pop(); return; }
  const P = d.pts.slice(); if (closed) P.push(P[0]);
  const q = opt.pn, g = MD.pnNewGroup(M), T = q.T, add = [];
  for (let i = 0; i + 1 < P.length; i++) { const [ax, az] = P[i], [bx, bz] = P[i + 1], dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz); if (L < 0.3) continue;
    const eA = closed || i > 0 ? T / 2 : 0, eB = closed || i + 2 < P.length ? T / 2 : 0, ux = dx / L, uz = dz / L, x = (ax + bx) / 2 + ux * (eB - eA) / 2, z = (az + bz) / 2 + uz * (eB - eA) / 2;
    const y = d.base != null ? Math.max(0, d.base - MD.gh(M, x, z)) : q.y;
    const o = { id: nid(), t: 'pn_wall', x: +x.toFixed(3), z: +z.toFixed(3), y: +y.toFixed(2), rot: +Math.atan2(-dz, dx).toFixed(4), L: +(L + eA + eB).toFixed(3), sy: q.sy, T, cs: q.cs, mat: q.mat, m: q.m, g };
    if (q.m === 'l' && !q.thru) o.thru = 0; if (q.hp > 0) o.hp = q.hp; add.push(o); }
  if (!add.length) { undo.pop(); return; }
  M.objs.push(...add); sel = { k: 'obj', id: add[add.length - 1].id }; syncObjs(); changed(); renderSide(); stat(add.length + ' panels (group ' + g + ')', 'ok');
}
function pnRing(c, r) { const n = Math.max(3, Math.round(opt.pn.sides || 12)), P = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; P.push([+(c[0] + Math.cos(a) * r).toFixed(3), +(c[1] + Math.sin(a) * r).toFixed(3)]); } return P; }   // ring points (radius = to the panel centre line corners)
function pnCut(it, kind) {   // opening = hole in the same panel (+ a lit glass pane for windows, same group)
  const q = MD.pnOpening(it, kind); if (!q || !M.objs.includes(it)) { stat('Can’t cut: panel too short/low, or it already has 4 openings', 'err'); return; }
  pushUndo('o'); if (it.g == null || it.g === '') it.g = MD.pnNewGroup(M); it.ho = (it.ho || []).concat([q]);
  if (kind === 'window') { const F = MD.pnFrame(M, it), d = MD.pnDims(it), u = (q[0] + q[1]) / 2 - d.L / 2;
    M.objs.push({ id: nid(), t: 'pn_wall', x: +(it.x + F.U[0] * u).toFixed(3), z: +(it.z + F.U[2] * u).toFixed(3), y: +((it.y || 0) + q[2] - 0.05).toFixed(3), rot: it.rot || 0, L: +(q[1] - q[0] + 0.1).toFixed(3), sy: +(q[3] - q[2] + 0.1).toFixed(3), T: 0.1, cs: 9, mat: 'litwin', m: 'g', g: it.g }); }
  syncObjs(); changed(); renderSide(); pnTestDraw();
}
function pnFromHouse(it, ldn) {   // old breakable house → panel objects (fully editable)
  const i = M.objs.indexOf(it); if (i < 0) return; pushUndo('o'); const Q = MD.pnHouseObjs(M, it, MD.pnNewGroup(M), ldn); Q.forEach(q => q.id = nid());
  M.objs.splice(i, 1, ...Q); sel = { k: 'obj', id: Q[0].id }; syncObjs(); changed(); renderSide(); stat(Q.length + ' panels (group ' + Q[0].g + ')', 'ok');
}
const selRow = (label, items, cur, on) => el('div', { class: 'row' }, el('label', null, label), el('select', { class: 'tl-sel', onchange: e => on(e.target.value), html: items.map(([v, n]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${n}</option>`).join('') }));
function pnFields(it) {
  const d = MD.pnDims(it), mat = it.mat || 'brick', hp = it.hp || MD.PN_HP[mat];
  return [fld('Material', it, 'mat', { type: 'select', items: MD.PN_MAT, get: () => mat }), fld('Break Mode', it, 'm', { type: 'select', items: MD.PN_MODE, get: () => it.m || 'p', after: () => { resync(); renderSide(); } }),
    it.m === 'l' ? fld('Breaks Through (off = damage only)', it, 'thru', { type: 'checkbox', get: () => it.thru !== 0, set: v => { if (v) delete it.thru; else it.thru = 0; } }) : null,
    fld('Length', it, 'L', { min: 0.2 }), fld('Height (along panel)', it, 'sy', { min: 0.2 }), fld('Thickness', it, 'T', { min: 0.03, step: 0.05 }), fld('Cell Size', it, 'cs', { min: 0.2, step: 0.05 }),
    fld('Tilt (deg, roof)', it, 'tl', { deg: 1, nullable: 1, ph: '0 = upright' }), fld('Shape', it, 'sh', { type: 'select', items: [['', 'Rectangle'], ['tri', 'Triangle'], ['trap', 'Slanted Top']], get: () => it.sh || '', set: v => { if (v) it.sh = v; else delete it.sh; }, after: () => { resync(); renderSide(); } }),
    it.sh === 'tri' ? fld('Apex Position (0 left • 0.5 middle • 1 right)', it, 'ap', { nullable: 1, ph: '0.5', min: 0, max: 1, step: 0.05 }) : null,
    it.sh === 'trap' ? fld('Right End Height (0..1 of Height)', it, 'hr', { nullable: 1, ph: '0.5', min: 0, max: 1, step: 0.05 }) : null,
    it.hc && it.hc.length ? el('div', { class: 'row' }, el('label', null, 'Punched cells: ' + it.hc.length), el('button', { class: 'tl-btn', onclick: () => { pushUndo('o'); delete it.hc; resync(); renderSide(); colDirty(); } }, 'Clear Punched')) : null,
    it.ho && it.ho.length ? el('div', { class: 'row' }, el('label', null, 'Openings: ' + it.ho.length), el('button', { class: 'tl-btn', onclick: () => { pushUndo('o'); delete it.ho; resync(); renderSide(); } }, 'Clear Openings')) : null,
    fld('Unbreakable (one solid piece, no cells)', it, 'nb', { type: 'checkbox', get: () => !!it.nb, set: v => { if (v) it.nb = 1; else delete it.nb; }, after: () => { resync(); renderSide(); } }),
    fld('HP per cell', it, 'hp', { nullable: 1, ph: 'material default (' + MD.PN_HP[mat] + ')', min: 1, step: 5 }),
    fld('Group (supports)', it, 'g', { type: 'text', get: () => it.g == null ? '' : it.g, set: v => { if (v === '' || v == null) delete it.g; else it.g = v; } }),
    el('p', { class: 'note' }, d.nc + ' × ' + d.nr + ' = ' + d.nc * d.nr + ' cells (each ' + (d.L / d.nc).toFixed(2) + ' × ' + (d.H / d.nr).toFixed(2) + ' m) • ' + ((it.m || 'p') === 'g' ? 'HP (whole panel) ' + hp : 'HP ' + hp + ' per cell') + ' • Touching panels in the same group hold each other up — nothing reaching the ground = falls'),
    el('div', { class: 'seg' }, el('button', { class: 'tl-btn', title: 'Cut a 1.4 × 2.4 m door in the middle of the panel (max 4 openings per panel)', onclick: () => pnCut(it, 'door') }, 'Cut Door'),
      el('button', { class: 'tl-btn', title: 'Cut a 1.2 × 1.2 m window, 1 m above the base, with a lit glass pane', onclick: () => pnCut(it, 'window') }, 'Cut Window'),
      el('button', { class: 'tl-btn' + (PNT.on ? ' on' : ''), title: 'Click a panel to break one cell at a time and see what falls with it', onclick: () => { PNT.on = !PNT.on; PNH.on = false; if (!PNT.on) PNT.br.clear(); pnTestDraw(); renderSide(); } }, PNT.on ? 'Stop Test Break' : 'Test Break'),
      el('button', { class: 'tl-btn' + (PNH.on ? ' on' : ''), title: 'Click cells to punch holes that are saved in the map (the game starts with them missing)', onclick: () => { PNH.on = !PNH.on; if (PNH.on && PNT.on) { PNT.on = false; PNT.br.clear(); pnTestDraw(); } renderSide(); } }, PNH.on ? 'Stop Punching' : 'Punch Holes')),
    PNT.on ? el('p', { class: 'note' }, 'Click a breakable panel = break 1 cell (Shift = 3×3) • red = broken • orange = will fall • not saved to the file') : null,
    PNH.on ? el('p', { class: 'note' }, 'Click a cell on any breakable panel = punch a hole (click again = fill it) • Shift = 3×3 • saved in the map: the game starts with these cells missing (no rubble) • cells left hanging with no support fall at the start like any loose piece') : null];
}
// editor test-break: broken cells per panel id (not saved) → red = broken, orange = would fall (same support rules as the game)
const PNT = { on: false, br: new Map() }, gPnT = new THREE.Group();
const PNH = { on: false };   // Punch Holes mode: click toggles saved holes (o.hc [col,row])
function pnHoleHit(o, pt, big) {
  const d = MD.pnDims(o), F = MD.pnFrame(M, o), D = [pt.x + M.W / 2 - F.B[0], pt.y - F.B[1], pt.z + M.H / 2 - F.B[2]], dot = A => A[0] * D[0] + A[1] * D[1] + A[2] * D[2], u = dot(F.U), w = dot(F.W);
  const c0 = Math.floor((u + d.L / 2) / (d.L / d.nc)), r0 = Math.floor(w / (d.H / d.nr)); if (c0 < 0 || c0 >= d.nc || r0 < 0 || r0 >= d.nr) return;
  const cur = new Set((o.hc || []).filter(q => q[0] < d.nc && q[1] < d.nr).map(q => q[1] * d.nc + q[0])), fill = cur.has(r0 * d.nc + c0), R = big ? 1 : 0, bare = Object.assign({}, o, { hc: null });
  pushUndo('o');
  for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) { const cc = c0 + a, rr = r0 + b, k = rr * d.nc + cc; if (cc < 0 || cc >= d.nc || rr < 0 || rr >= d.nr || !MD.pnExists(bare, d, k)) continue; if (fill) cur.delete(k); else cur.add(k); }
  if (cur.size) o.hc = [...cur].sort((x, y) => x - y).map(k => [k % d.nc, (k / d.nc) | 0]); else delete o.hc;
  syncObj(o); changed(); colDirty(); renderSide(); pnTestDraw();
}
function pnTestDraw() {
  if (!gPnT.parent && gObjs.parent) gObjs.parent.add(gPnT);
  for (const c of [...gPnT.children]) { gPnT.remove(c); c.geometry.dispose(); }
  if (!PNT.on || !PNT.br.size) { need(); return; }
  const G = MD.pnGraph(M, M.objs), br = new Set(), list = [];
  for (const p of G.ps) { const st = PNT.br.get(p.o.id); if (st) for (const k of st) if (k < p.nc * p.nr) br.add(p.base + k); }
  const S = MD.pnSupported(G, br);
  for (const p of G.ps) for (let k = 0; k < p.nc * p.nr; k++) { const id = p.base + k; if (!G.ex[id]) continue; if (S.dead[id]) list.push([p, id, '#e02a2a']); else if (!S.seen[id]) list.push([p, id, '#ff9a2a']); }
  if (!list.length) { need(); return; }
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.62, depthWrite: false }), list.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(), eu = new THREE.Euler(0, 0, 0, 'YXZ');
  list.forEach(([p, id, c], i) => { eu.set(p.o.tl || 0, p.o.rot || 0, 0); q.setFromEuler(eu);
    m4.compose(new THREE.Vector3(G.C[id * 3], G.C[id * 3 + 1], G.C[id * 3 + 2]), q, new THREE.Vector3(p.cw * 0.96, p.ch * 0.96, p.T + 0.08)); im.setMatrixAt(i, m4); im.setColorAt(i, col.set(c)); });
  im.renderOrder = 6; gPnT.add(im); need();
}
function pnTestHit(o, pt, big) {
  const d = MD.pnDims(o), F = MD.pnFrame(M, o), D = [pt.x + M.W / 2 - F.B[0], pt.y - F.B[1], pt.z + M.H / 2 - F.B[2]], dot = A => A[0] * D[0] + A[1] * D[1] + A[2] * D[2], u = dot(F.U), w = dot(F.W);
  const c0 = Math.floor((u + d.L / 2) / (d.L / d.nc)), r0 = Math.floor(w / (d.H / d.nr)); if (!PNT.br.has(o.id)) PNT.br.set(o.id, new Set());
  const st = PNT.br.get(o.id), R = big ? 1 : 0;
  for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) { const cc = c0 + a, rr = r0 + b; if (cc >= 0 && cc < d.nc && rr >= 0 && rr < d.nr) st.add(rr * d.nc + cc); }
  pnTestDraw();
}
const TOOLS = [['select', '⬚', 'Select', 'v', 'Click to select, drag to move • W/E/R/T = move/rotate/scale/resize gizmo • Q = hand (pan) • , . rotate • [ ] scale • PgUp/PgDn raise/lower (below ground OK) • End snap to ground • F frame • Ctrl+D duplicate • Del delete • Walls: drag white points, Alt+click adds a point'],
  ['sculpt', '⛰', 'Sculpt', 'b', 'Drag to sculpt • Shift = invert • Shift+wheel or [ ] = brush size • red = too steep to walk up'],
  ['paint', '🖌', 'Paint', 'p', 'Drag to paint the surface • Shift = erase back to grass • Alt+click = pick surface type'],
  ['wall', '▤', 'Wall', 'k', 'Click point by point to draw a wall line • double-click/Enter = finish • click the first point = close loop • Backspace = undo point • Esc = cancel'],
  ['pnl', '▦', 'Breakable Panel', 'n', 'Click point by point to lay a breakable wall line (each segment = 1 panel, same group) • click the first point = close loop (house) • double-click/Enter = finish • Backspace undo point • Esc cancel'],
  ['floor', '▭', 'Upper Floor', 'l', 'Drag from A to B = bridge/ramp joining two points • plain click = standard platform • walkable underneath if height ≥ 2.8'],
  ['castle', '♜', 'Castle', 'c', 'Pick a piece, then click to place • , . rotate 45° (Shift = 15°) or Shift+wheel • piece ends snap together • click on top of a wall/walkway = place at that height • use Select to move/resize'],
  ['place', '◈', 'Place', 'o', 'Click to place • , . or Shift+wheel = rotate • can be placed on upper floors'],
  ['bd', '🌊', 'Backdrop', 'j', 'Backdrop = land/sea outside the play area (drawn in the game, no collision) • pick a mode in Settings, drag to sculpt/paint/plant • Shift = invert • Shift+wheel or [ ] = brush size • Sea Stack: click = add, Shift+click = remove'],
  ['road', '🛣', 'Road', 'u', 'Click point by point along the road (smooth curve, follows the ground) • double-click/Enter = finish • Backspace = undo point • Esc = cancel • edit later with Select: drag the points, Alt+click = add a point'],
  ['water', '💧', 'Water', 'h', 'Drag a rectangle = water area (plain click = 12 × 12 m) • the level sits just under the lowest edge • Dig Basin (on) carves a smooth bed • edit later with Select: move/rotate/R scale, PgUp/PgDn or the green arrow = level'],
  ['scatter', '⁘', 'Scatter', 'g', 'Drag to scatter the chosen item (trees, rocks, grass) • Shift = remove items in the circle'],
];
const HINT = Object.fromEntries(TOOLS.map(t => [t[0], t[4]]));
function setTool(t) { const wasBd = tool === 'bd'; setTimeout(() => { if (M && (wasBd || t === 'bd')) applySky(); }, 0); if (draft) { draft = null; undo.pop(); drawLine(null); } if (fdraft) { fdraft = null; undo.pop(); drawLine(null); } tool = t; if (t === 'scatter' && !isVisualType(opt.obj)) { const a = KIT.list.find(a => a.cat === 'tree'); if (a) { opt.obj = 'kit:' + a.id; opt.cat = 'tree'; } } renderTools(); renderOpts(); drawHandles(); $('hint').textContent = HINT[t] || ''; placeGizmo(); need(); }
function renderTools() { const box = $('tools'); box.textContent = ''; for (const t of TOOLS) box.append(el('button', { class: tool === t[0] ? 'on' : '', title: t[2] + ' (' + t[3].toUpperCase() + ')', onclick: () => setTool(t[0]) }, el('b', null, t[1]))); const T = TOOLS.find(x => x[0] === tool); if ($('optTitle')) $('optTitle').textContent = '⚙ ' + (T ? T[2] : '') + ' Settings'; }
const h3 = t => el('h3', null, t);
function seg(items, cur, on) { const d = el('div', { class: 'seg' }); for (const [v, n, tip] of items) d.append(el('button', { class: 'tl-btn' + (v === cur ? ' on' : ''), title: tip || '', onclick: () => on(v) }, n)); return d; }
function slider(label, key, min, max, step, obj = opt, after) { const out = el('output', null, String(obj[key])); const r = el('input', { type: 'range', min, max, step, value: obj[key], oninput: () => { obj[key] = +r.value; out.textContent = r.value; if (after) after(); need(); } }); return el('div', { class: 'row' }, el('label', null, label), r, out); }
function check(label, key, obj = opt, after) { const c = el('input', { type: 'checkbox', checked: !!obj[key], onchange: () => { obj[key] = c.checked ? 1 : 0; if (after) after(); need(); } }); return el('label', { class: 'chk' }, c, label); }
function pal(items, cur, on, cls) { const d = el('div', { class: 'pal ' + (cls || '') }); items.forEach((it, i) => d.append(el('button', { class: i === cur ? 'on' : '', title: it.n, onclick: () => on(i) },
  it.img ? el('span', { class: 'th', style: `background-color:${it.c};background-image:url(${it.img})` }) : it.c ? el('span', { class: 'sw', style: 'background:' + it.c }) : null, it.img ? el('span', null, it.n) : it.n))); return d; }
function renderOpts() {
  const b = $('opts'); b.textContent = '';
  const brush = () => { b.append(h3('Brush'), slider('Size (radius)', 'rad', 0.5, 40, 0.5), tool !== 'paint' && tool !== 'scatter' ? slider('Strength', 'str', 0.5, 12, 0.5) : null, tool !== 'scatter' ? check('Soft Edge', 'soft') : null); };
  if (tool === 'select') { b.append(el('p', { class: 'note', html: 'Click an item in the Scene or the Hierarchy, then edit it in the Inspector.<br><kbd>Q</kbd> Hand (pan) <kbd>W</kbd> Move <kbd>E</kbd> Rotate <kbd>R</kbd> Scale <kbd>T</kbd> Resize (one side)<br>Green arrow = height • centre cube = uniform scale • one drag = one undo<br><kbd>,</kbd><kbd>.</kbd> rotate 15° (Shift = 5°)<br><kbd>[</kbd><kbd>]</kbd> scale down/up<br><kbd>PgUp</kbd><kbd>PgDn</kbd> raise/lower (can sink below ground) <kbd>End</kbd> snap to ground<br><kbd>F</kbd> frame selected (or double-click in the Hierarchy) • <kbd>T</kbd> top view<br><kbd>Ctrl+D</kbd> duplicate • <kbd>Del</kbd> delete<br>Camera: right-drag orbit (hold it + <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> fly, <kbd>Q</kbd><kbd>E</kbd> down/up, Shift = fast) • middle-drag or Space+drag pan • wheel zoom' })); }
  else if (tool === 'sculpt') {
    b.append(h3('Sculpt'), seg([['up', 'Raise'], ['down', 'Lower'], ['smooth', 'Smooth'], ['flat', 'Flatten', 'Pull the ground to the height where the drag started'], ['set', 'Set Height'], ['noise', 'Noise'], ['ramp', 'Ramp', 'Drag from A to B = smooth ramp joining two levels']], opt.smode, v => { opt.smode = v; renderOpts(); }));
    if (opt.smode === 'set') b.append(slider('Height', 'hval', -5, 20, 0.25));
    if (opt.smode === 'ramp') b.append(slider('Width', 'rad', 0.5, 20, 0.5, opt), check('Soft Edge', 'soft'), el('p', { class: 'note' }, 'Drag from the low point to the high point: the ground in between becomes a smooth ramp (width = 2 × this value)')); else brush();
    b.append(el('p', { class: 'note', html: 'Slopes steeper than ~58° (1.6 up per 1 across) can’t be walked up — shown red<br>jump height ~1.4' }));
  } else if (tool === 'paint') { b.append(h3('Paint'), el('div', { class: 'row' }, el('span', { style: 'flex:1' }, 'Current: ' + SURF[opt.surf].n), pickBtn('surf', v => { opt.surf = v; renderOpts(); }, 'a ground surface')), pal(SURF_PAL, opt.surf, i => { opt.surf = i; renderOpts(); }, 'tex')); brush(); b.append(el('p', { class: 'note' }, 'Green = the game grows 3D grass • mud/water/ice/lava are saved as special game surfaces')); }
  else if (tool === 'road') {
    b.append(h3('Road'), fld('Material', opt, 'rk', { type: 'select', items: MD.DECO_MAT.filter(m => MD.DECO_TEX.has(m[0])), get: () => opt.rk }), slider('Width (m)', 'rw', 1, 16, 0.5), check('Curbs (stone edges)', 'rc'),
      el('p', { class: 'note' }, 'Click points along the way • the road bends smoothly through them and follows the ground • double-click or Enter = finish • crossings: let two roads meet and put a plaza piece on top'));
  }
  else if (tool === 'wall') {
    b.append(h3('Wall Preset'), pal(MD.WALL_PRESET, opt.wall, i => { const P = MD.WALL_PRESET[i]; Object.assign(opt, { wall: i, wth: P.th, wh: P.h, wc: P.c, wm: P.m }); renderOpts(); }, 'one'),
      h3('Settings'), slider('Thickness', 'wth', 0.3, 4, 0.1), slider('Height', 'wh', 0.4, 14, 0.1), el('div', { class: 'row' }, el('label', null, 'Color'), el('input', { type: 'color', value: opt.wc, oninput: e => { opt.wc = e.target.value; } }), pickBtn('color', v => { opt.wc = v; renderOpts(); }, 'a colour')),
      check('Curved (through points)', 'wcurve'), check('Breakable (in segments)', 'wbrk'), el('p', { class: 'note' }, 'Start the click on an upper floor = wall/rail standing on that floor (doesn’t block below) • thinner walls use more colliders'));
  } else if (tool === 'pnl') { const q = opt.pn;
    b.append(h3('Panel Preset'), pal(MD.PN_PRESET.map(p => ({ n: p.n, c: MD.PN_COL[p.mat] })), q.pre, i => { const P = MD.PN_PRESET[i]; Object.assign(q, { pre: i, mat: P.mat, m: P.m, thru: P.thru === 0 ? 0 : 1, sy: P.sy, T: P.T, cs: P.cs, y: P.y || 0, hp: 0 }); renderOpts(); }, 'one'),
      h3('Draw'), selRow('Shape', [['line', 'Line (click point by point)'], ['round', 'Round Tower (centre → radius)']], q.draw, v => { q.draw = v; draft = null; drawLine(null); renderOpts(); }),
      ...(q.draw === 'round' ? [slider('Sides (more = rounder)', 'sides', 6, 32, 1, q), el('p', { class: 'note' }, 'Click the centre, then click again for the radius • one panel per side, all in one group (they hold each other up)')] : []),
      h3('Settings'), selRow('Material', MD.PN_MAT, q.mat, v => { q.mat = v; renderOpts(); }), selRow('Break Mode', MD.PN_MODE, q.m, v => { q.m = v; renderOpts(); }), ...(q.m === 'l' ? [check('Breaks Through (off = damage only)', 'thru', q)] : []),
      slider('Height', 'sy', 0.3, 12, 0.1, q), slider('Thickness', 'T', 0.05, 1.5, 0.05, q), slider('Cell Size', 'cs', 0.25, 3, 0.05, q), slider('Base Offset', 'y', 0, 10, 0.1, q), slider('HP per cell (0 = material default)', 'hp', 0, 500, 5, q),
      el('p', { class: 'note', html: 'Break modes: <b>Holes</b> = breaks into cells, leaves rubble • <b>Skin Peel</b> = crack → outer skin falls (still blocks) → through • <b>Whole Panel</b> = HP as one piece (glass/door)<br>HP by material: ' + MD.PN_HP[q.mat] + ' per cell • parts that must not break: use normal walls/boxes<br>Select a panel, then press "Cut Door/Window" or "Test Break" in the Inspector' }));
  } else if (tool === 'castle') {
    const k = opt.part, D = MD.PART[k], pp = partPP(k), keys = Object.keys(MD.PART);
    b.append(h3('Castle Pieces'), pal(keys.map(q => ({ n: MD.PART[q].n, c: MD.PART[q].c })), keys.indexOf(k), i => { opt.part = keys[i]; renderOpts(); need(); }),
      h3('Size'), ...Object.entries(D.p).map(([q, v]) => slider(MD.PART_P[q], q, v[1], v[2], v[3], pp)),
      h3('Options'), ...Object.keys(D.f).map(q => check(MD.PART_F[q], q, pp)),
      el('div', { class: 'row' }, el('label', null, 'Color'), el('input', { type: 'color', value: pp.c, oninput: e => { pp.c = e.target.value; need(); } }), pickBtn('color', v => { pp.c = v; renderOpts(); }, 'a colour')),
      check('Breakable (whole piece)', 'brk', pp), el('p', { class: 'note' }, 'Breakable = no battlements/walkway on top (pieces can’t float) • off = sturdy wall (default)'),
      k === 'free' ? el('p', { class: 'note', html: 'Free shape: click point by point to draw a closed outline on the ground • click the first point/Enter/double-click = finish • Backspace undo point • Esc cancel<br>Then select the piece and drag the blue points (Alt+click an edge = add point) • "Taper" 1 = straight, lower = narrow/pointed top' }) : null,
      h3('Snap'), el('div', { class: 'row' }, el('label', null, 'Place Grid'), el('select', { class: 'tl-sel', onchange: e => { opt.csnap = +e.target.value; need(); }, html: [[0, 'Off'], [0.5, '0.5'], [1, '1'], [2, '2']].map(([v, n]) => `<option value="${v}"${v === opt.csnap ? ' selected' : ''}>${n}</option>`).join('') })),
      check('Piece ends snap to other pieces (level + position)', 'psnap'),
      el('p', { class: 'note', html: 'Ends of walls/gates/walkways/stairs/building corners snap within 1.6 m<br>Stairs/ramps: the upper end snaps to a wall top (set "Rise" = wall height)<br>Select the piece with the Select tool, then resize it in the Inspector' }));
  } else if (tool === 'floor') {
    b.append(h3('Preset'), pal(MD.FLOOR_PRESET, opt.floor, i => { opt.floor = i; opt.fw = MD.FLOOR_PRESET[i].w; renderOpts(); }, 'one'), h3('Settings'), slider('Width', 'fw', 1, 30, 0.5), slider('Height Above Ground', 'fh', 0.5, 15, 0.25),
      MD.FLOOR_PRESET[opt.floor].ramp ? null : check('Drag across: height of the higher end', 'fauto'),
      el('p', { class: 'note', html: MD.FLOOR_PRESET[opt.floor].ramp ? 'Drag from the low end to the high end: a ramp joining the two heights (the top end can sit on a platform)<br>walkable if not steeper than 1.6 per 1' : 'Drag from A to B = bridge spanning both sides • upper floor edges can be stepped onto if no higher than 1.1' }));
  } else if (tool === 'water') {
    b.append(h3('Look'), el('select', { class: 'tl-sel', style: 'width:100%', onchange: e => { opt.wk = e.target.value; }, html: MD.WATER_LOOK.map(([k, n]) => `<option value="${k}"${k === opt.wk ? ' selected' : ''}>${n}</option>`).join('') }),
      h3('Bed'), check('Dig Basin when placing', 'wdig'), slider('Basin Depth (m)', 'wdep', 0.3, 6, 0.1),
      el('p', { class: 'note' }, 'The water is a flat surface at its Level: ground higher than the level hides it, so the shore follows the ground • off = keep the ground as it is (dig with Sculpt → Lower first) • overlapping areas with the same level + look join into one water • look only: no swimming/slow yet'));
  } else if (tool === 'bd') bdOpts(b);
  else if (tool === 'place' || tool === 'scatter') {
    if (tool === 'scatter') b.append(h3('Scatter'), slider('Size (radius)', 'rad', 0.5, 40, 0.5), slider('Density', 'dens', 0.5, 12, 0.5), slider('Random Scale ±', 'rscale', 0, 0.6, 0.05));
    b.append(check('Random Rotation', 'rrot'));
    const cats = tool === 'scatter' ? CATS.filter(c => !['sys', 'game', 'mode', 'water', 'prefab', 'room', 'deco'].includes(c[0])) : CATS;
    if (!cats.some(c => c[0] === opt.cat)) opt.cat = cats[0][0];
    b.append(h3('Library'), el('select', { class: 'tl-sel', style: 'width:100%;margin-bottom:6px', onchange: e => { opt.cat = e.target.value; renderOpts(); }, html: cats.map(([k, n]) => `<option value="${k}"${k === opt.cat ? ' selected' : ''}>${n}${OBJ_CATN(k)}</option>`).join('') }));
    const items = OBJ_IN(opt.cat);
    if (opt.cat === 'sys' || opt.cat === 'game' || opt.cat === 'prim' || opt.cat === 'collide' || opt.cat === 'mode' || opt.cat === 'water' || opt.cat === 'room' || opt.cat === 'prefab' || opt.cat === 'deco') { b.append(pal(items.map(([t, D]) => ({ n: D.n, c: D.c })), items.findIndex(([t]) => t === opt.obj), i => { opt.obj = items[i][0]; renderOpts(); need(); }, 'one'));
      const D = OBJ[opt.obj]; if (D && D.note) b.append(el('p', { class: 'note' }, D.note));
      if (opt.cat === 'collide') b.append(h3('Size'), slider('Width', 'sx', 0.2, 30, 0.1, opt.prim), slider('Height', 'sy', 0.2, 30, 0.1, opt.prim), slider('Depth', 'sz', 0.2, 30, 0.1, opt.prim), el('p', { class: 'note' }, 'Shown red see-through here, invisible in the game • it is a Box/Cylinder with Visible off + Collider on'));
      if (opt.cat === 'prim') b.append(h3('Size/Color'), slider('Width', 'sx', 0.2, 30, 0.1, opt.prim), slider('Height', 'sy', 0.2, 30, 0.1, opt.prim), slider('Depth', 'sz', 0.2, 30, 0.1, opt.prim), el('div', { class: 'row' }, el('label', null, 'Color'), el('input', { type: 'color', value: opt.prim.c, oninput: e => { opt.prim.c = e.target.value; need(); } }), pickBtn('color', v => { opt.prim.c = v; renderOpts(); }, 'a colour')));
      if (opt.cat === 'game') b.append(el('p', { class: 'note' }, 'The game adds the models and break system for these (shown as stand-in shapes here)'));
      if (opt.cat === 'deco') b.append(el('p', { class: 'note' }, 'Decor the game draws itself (hall style): no collision, not in the .glb • boxes/cylinders use materials "castle stone" etc., set in the Inspector'));
      if (opt.cat === 'prefab') b.append(el('p', { class: 'note' }, items.length ? 'Click to place a room (room centre) • Shift+wheel = rotate 90° • a room = a map named room-…, made/edited like any map' : 'No rooms yet — create a new map whose id starts with room- (flat ground) and place the room’s items in it'));
      if (opt.cat === 'water') b.append(el('p', { class: 'note' }, 'Placed with its level just under the lowest edge • the Water tool (H) can drag a size + dig a basin'));
      if (opt.cat === 'mode') b.append(el('p', { class: 'note' }, 'Tick "Siege" in Playable Modes, then check the Validation list • the game builds the cores/spawn zones (shown as markers here) • target wall/gate = select a wall and set "Siege Target"'));
      if (opt.cat === 'room') b.append(el('p', { class: 'note' }, 'Breakable room props (the game draws the real look, boxes here) • tables/benches/rails have adjustable length • Height Above Ground = place on a mezzanine'));
    } else {
      const g = el('div', { class: 'kit' });
      for (const a of items) { const img = el('span', { class: 'ph' }); const bt = el('button', { class: opt.obj === 'kit:' + a.id ? 'on' : '', title: a.name, onclick: () => { opt.obj = 'kit:' + a.id; renderOpts(); need(); } }, img, el('span', null, a.name.split(' · ')[0])); g.append(bt);
        thumb(a.id).then(u => { if (u) { const im = el('img', { src: u }); img.replaceWith(im); } }); }
      b.append(g);
      if (!items.length) b.append(el('p', { class: 'note' }, 'No assets in this category yet'));
      if (opt.cat === 'user') b.append(el('button', { class: 'tl-btn', style: 'width:100%;margin-top:8px', onclick: addAsset }, '＋ Add Asset (.glb)'), el('p', { class: 'note' }, '.glb file from Blender (1 unit = 1 m, base at the ground) stored in assets/mapkit/'));
    }
  }
}
const OBJ_IN = cat => cat === 'prefab' ? list.filter(m => MD.isRoomId(m.id) && (!M || m.id !== M.id)).map(m => ['room:' + m.id, { n: m.name, c: '#c9a86a' }]) : cat === 'deco' || cat === 'sys' || cat === 'game' || cat === 'prim' || cat === 'collide' || cat === 'mode' || cat === 'room' ? Object.entries(OBJ).filter(([, D]) => D.cat === cat) : KIT.list.filter(a => a.cat === cat);
const OBJ_CATN = k => { const n = OBJ_IN(k).length; return n ? ' (' + n + ')' : ''; };
function addAsset() {
  const inp = el('input', { type: 'file', accept: '.glb' });
  inp.onchange = async () => { const f = inp.files[0]; if (!f) return; const label = prompt('Name shown in the library', f.name.replace(/\.glb$/i, '')); if (label == null) return;
    const name = f.name.replace(/\.glb$/i, '').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    try { const r = await (await fetch('/api/mb-asset?name=' + encodeURIComponent(name) + '&label=' + encodeURIComponent(label), { method: 'POST', body: await f.arrayBuffer() })).json(); if (!r.ok) throw new Error(r.err);
      KIT.tpl.delete(r.asset.id); KIT.thumbs.delete(r.asset.id); KIT.files.delete(r.asset.src); await loadKit(); opt.obj = 'kit:' + r.asset.id; opt.cat = 'user'; renderOpts(); stat('Asset added', 'ok'); } catch (e) { stat('Couldn’t add asset: ' + e.message, 'err'); } };
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
  if (type === 'color') return el('div', { class: 'row' }, el('label', null, label), inp, pickBtn('color', v => { inp.value = v; commit(); }, 'a colour'));
  return el('div', { class: 'row' }, el('label', null, label), inp);
}
function decoFields(it) {   // inspector rows for dc_* decor
  const t = it.t.slice(3), F = [];
  if (t === 'road') return [fld('Material', it, 'k', { type: 'select', items: MD.DECO_MAT, get: () => it.k || 'cobble' }), fld('Width', it, 'w', { min: 0.5 }),
    fld('Curbs (stone edges)', it, 'curb', { type: 'checkbox' }), el('p', { class: 'note' }, 'Drag the white points to bend the road • Alt+click the road = add a point • select a point + Delete = remove it')];
  const bx = ['box', 'pyr', 'dome', 'wedge', 'arch', 'cren', 'rock'].includes(t);
  if (MD.DECO_SHAPE.has(it.t)) F.push(fld('Material', it, 'k', { type: 'select', items: MD.DECO_MAT, get: () => it.k || (t === 'cone' || t === 'pyr' ? 'roof' : 'stone') }));
  if (bx || t === 'roof' || t === 'cloth') F.push(fld(t === 'roof' ? 'Length (ridge)' : t === 'cren' ? 'Length (row)' : 'Width', it, 'sx', { min: 0.05 }));
  if (t !== 'flame' && t !== 'shield' && t !== 'chand') F.push(fld('Height', it, 'sy', { min: 0.05 }));
  if (bx || t === 'roof') F.push(fld(t === 'roof' ? 'Width' : t === 'arch' || t === 'cren' ? 'Thickness' : 'Depth', it, 'sz', { min: 0.05 }));
  if (t === 'arch') F.push(fld('Opening Width', it, 'ow', { min: 0.2 }), fld('Opening Height', it, 'oh', { min: 0.2 }));
  if (t === 'cren') F.push(fld('Merlon Width (gap = same)', it, 'mw', { min: 0.2 }));
  if (t === 'cyl' || t === 'cone') F.push(fld('Sides (3 = triangle, 4 = square...)', it, 'seg', { min: 3, step: 1 }));
  if (t === 'cyl') F.push(fld('Top Radius', it, 'rt', { min: 0 }), fld('Bottom Radius', it, 'rb', { min: 0 }));
  if (t === 'cone') F.push(fld('Radius', it, 'r', { min: 0.05 }));
  if (t === 'cloth') F.push(fld('Color', it, 'c', { type: 'color' }));
  return F;
}
function section(title, open, ...kids) { const d = el('details', { class: 'sec', open }); d.append(el('summary', null, title), ...kids.filter(Boolean)); return d; }
function renderSide() {
  const box = $('side'); box.textContent = ''; if (!M) return;
  const it = find(sel);
  if (it) {
    const btns = el('div', { class: 'seg' }, el('button', { class: 'tl-btn', title: 'End key: lowest point of the item meets the lowest ground under it (sinks into slopes, no gap)', onclick: snapGround }, 'Snap to Ground'), el('button', { class: 'tl-btn', onclick: dupSel }, 'Duplicate'), el('button', { class: 'tl-btn', onclick: () => { sel.pt = null; delSel(); } }, 'Delete'));
    if (sel.k === 'room') { const R = RM.get(it.ref), rooms = list.filter(m => MD.isRoomId(m.id) && m.id !== M.id);
      box.append(section('Room (prefab) — ' + (R ? R.name : it.ref), true,
        fld('Room', it, 'ref', { type: 'select', items: rooms.map(m => [m.id, m.name]), after: () => loadRooms().then(() => { syncAll(); renderSide(); changed(); }) }),
        fld('Position X (room centre)', it, 'x'), fld('Position Z (room centre)', it, 'z'), fld('Rotation (deg, steps of 90)', it, 'rot', { deg: 1, step: 90 }),
        R && R.objs.some(o => o.t === 'pn_wall') ? fld('Unbreakable (breakable walls of this room become solid)', it, 'nbk', { type: 'checkbox', set: v => { if (v) it.nbk = 1; else delete it.nbk; }, after: () => { syncAll(); renderSide(); changed(); } }) : null,
        R && R.floors.some(f => f.rf) ? fld('Roof collision (players can stand on the roof)', it, 'rfc', { type: 'checkbox', set: v => { if (v) it.rfc = 1; else delete it.rfc; }, after: () => { syncAll(); renderSide(); changed(); } }) : null,
        el('div', { class: 'seg' }, el('button', { class: 'tl-btn', onclick: () => { location.href = 'mapbuild.html?id=' + encodeURIComponent(it.ref); } }, 'Open This Room'),
          el('button', { class: 'tl-btn', title: 'Copy the room’s contents into this map, every piece editable (no longer linked to the room file) • ground under the room is flattened + painted like the room', onclick: () => { if (!R) return; pushUndo('a'); MD.roomUnpack(M, it, R); sel = null; buildTerrain(); syncAll(); renderSide(); changed(); } }, 'Unpack Room into Map')),
        el('p', { class: 'note' }, R ? 'Size ' + R.W + ' × ' + R.H + ' m • edit the room’s contents in its own file (every map using it updates) • , . rotate 90° • drag to move' : 'Room not loaded yet (' + it.ref + ')'), btns)); }
    else if (sel.k === 'obj') { const D = OBJ[it.t], a = isKit(it) && KIT.byId.get(kitId(it)), d = dim(it);
      box.append(section((D ? D.n : a ? a.name : it.t), true,
        fld('Position X', it, 'x'), fld('Position Z', it, 'z'), it.t === 'water' ? null : it.t === 'light' || it.t === 'ring' || MD.isDeco(it.t) ? fld('Height Above Ground', it, 'y') : fld('Height Above Ground', it, 'y', { ph: '0 (negative = sunk)' }), fld('Rotation (deg)', it, 'rot', { deg: 1 }),
        tiltOk(it) ? fld('Tilt X (deg)', it, 'rx', { deg: 1, ph: '0' }) : null, tiltOk(it) ? fld('Tilt Z (deg)', it, 'rz', { deg: 1, ph: '0' }) : null,
        isKit(it) ? fld('Scale (×)', it, 's', { min: 0.05 }) : null,
        isPrim(it) || it.t === 'house' ? fld(it.t === 'house' ? 'Width (×)' : 'Width', it, 'sx', { min: 0.1 }) : null, isPrim(it) ? fld('Height', it, 'sy', { min: 0.1 }) : null, isPrim(it) || it.t === 'house' ? fld(it.t === 'house' ? 'Depth (×)' : 'Depth', it, 'sz', { min: 0.1 }) : null,
        isPrim(it) ? fld('Color', it, 'c', { type: 'color' }) : null, isPrim(it) ? fld('Emissive', it, 'glow', { type: 'checkbox' }) : null,
        isPrim(it) || it.t === 'poly' ? fld('Visible (exported to the game)', it, 'vis', { type: 'checkbox', get: () => it.vis !== 0, set: v => { if (v) delete it.vis; else it.vis = 0; } }) : null,
        ...(MD.isDeco(it.t) ? decoFields(it) : []), ...(it.t === 'pn_wall' ? pnFields(it) : []),
        it.t === 'core' ? fld('Core Number (order)', it, 'n', { min: 1, step: 1 }) : null, it.t === 'core' ? fld('Core Size', it, 's', { min: 1 }) : null,
        it.t === 'sgA' || it.t === 'sgB' || it.t === 'phase' ? fld('Phase', it, 'ph', { min: 1, step: 1 }) : null,
        it.t === 'sgHold' || it.t === 'sgLoot' || it.t === 'sgItem' ? fld('Break (after core N)', it, 'ph', { min: 1, step: 1 }) : null,
        it.t === 'sgHold' ? fld('Team', it, 'tm', { type: 'select', items: [['A', 'Attackers'], ['B', 'Defenders']], get: () => it.tm === 'B' ? 'B' : 'A' }) : null,
        it.t === 'sgItem' ? fld('Tier (1-3)', it, 'tier', { min: 1, max: 3, step: 1 }) : null,
        it.t === 'brz' ? fld('Who may fly', it, 'tm', { type: 'select', items: [['', 'Both teams'], ['A', 'Attackers only'], ['B', 'Defenders only']], get: () => it.tm || '' }) : null,
        it.t === 'brz' ? fld('Top (m above ground)', it, 'top', { get: () => it.top == null ? 60 : it.top, min: 2 }) : null,
        it.t === 'wind' ? fld('Direction (deg, 0 = +Z)', it, 'dir', { get: () => it.dir || 0, step: 15 }) : null, it.t === 'wind' ? fld('Strength', it, 'str', { get: () => it.str == null ? 8 : it.str, min: 0 }) : null,
        ...(it.t === 'water' ? [fld('Width (X)', it, 'sx', { min: 1 }), fld('Length (Z)', it, 'sz', { min: 1 }), fld('Level (m, absolute)', it, 'y', { step: 0.05 }),
          fld('Look (preset)', it, 'k', { type: 'select', items: MD.WATER_LOOK, get: () => it.k || 'lake', set: v => { it.k = v; for (const q of MD.WATER_OPT) delete it[q]; }, after: () => { resync(); renderSide(); } }),
          h3('Water Colour + Waves'),
          fld('Shallow Colour (edge)', it, 'cs', { type: 'color', get: () => it.cs || (MD.WATER_DEF[it.k] || MD.WATER_DEF.lake).sh }),
          fld('Deep Colour (middle)', it, 'cd', { type: 'color', get: () => it.cd || (MD.WATER_DEF[it.k] || MD.WATER_DEF.lake).dp }),
          fld('Clarity (0 murky – 1 clear)', it, 'cl', { get: () => it.cl != null ? it.cl : (MD.WATER_DEF[it.k] || MD.WATER_DEF.lake).cl, min: 0, max: 1, step: 0.05 }),
          fld('Wave Height (×, 0 = still)', it, 'wh', { get: () => it.wh != null ? it.wh : 1, min: 0, max: 4, step: 0.1 }),
          fld('Wave Speed (×)', it, 'ws', { get: () => it.ws != null ? it.ws : 1, min: 0, max: 4, step: 0.1 }),
          fld('Foam (×)', it, 'fo', { get: () => it.fo != null ? it.fo : 1, min: 0, max: 3, step: 0.1 }),
          el('button', { class: 'tl-btn', title: 'Clear the colour/wave changes: back to the Look preset', onclick: () => editSel(o => { for (const q of MD.WATER_OPT) delete o[q]; }) }, 'Reset to Look'),
          el('div', { class: 'seg' }, el('button', { class: 'tl-btn', title: 'Level = just under the lowest ground along the edge', onclick: () => editSel(o => { o.y = MD.waterAutoLevel(M, o); }) }, 'Auto Level'),
            el('button', { class: 'tl-btn', title: 'Carve a smooth oval bed (Basin Depth in the Water tool settings) — only lowers the ground', onclick: () => { pushUndo('a'); waterDigNow(it); syncObj(it); } }, 'Dig Basin ' + opt.wdep + ' m'))] : []),
        MD.AREA.has(it.t) ? fld('Width (X)', it, 'sx', { min: 1 }) : null, MD.AREA.has(it.t) ? fld('Length (Z)', it, 'sz', { min: 1 }) : null,
        it.t === 'lz' ? fld('Indoor strength (0-1)', it, 'k', { get: () => it.k == null ? 1 : it.k, min: 0, max: 1, step: 0.05 }) : null,
        it.t === 'ceil' ? fld('Only for players lower than (m)', it, 'zmax', { nullable: 1, ph: 'everyone', min: 0 }) : null,
        MD.isRP(it.t) && MD.RPK[it.t.slice(3)].L ? fld('Length', it, 'L', { min: 0.3 }) : null,
        it.t === 'light' ? fld('Light Color', it, 'c', { type: 'color' }) : null, it.t === 'light' ? fld('Intensity', it, 'int', { min: 0 }) : null, it.t === 'light' ? fld('Range', it, 'dist', { min: 1 }) : null,
        d ? fld('Collides (blocks walking/shots)', it, 'col', { type: 'checkbox', get: () => d.col }) : null,
        d && d.col ? fld('Collider Size (×)', it, 'cs', { get: () => it.cs == null ? d.cs : it.cs, min: 0.05 }) : null,
        d && d.col && !MD.isDeco(it.t) ? fld('Breakable', it, 'brk', { type: 'checkbox', get: () => it.brk == null ? d.brk : it.brk }) : null,
        it.t === 'house' ? el('div', { class: 'seg' }, el('button', { class: 'tl-btn', title: 'Convert to breakable panels (plaster walls, snow roof, lit windows), editable panel by panel', onclick: () => pnFromHouse(it, false) }, 'Break into Panels (snow house)'),
          el('button', { class: 'tl-btn', title: 'Convert to breakable panels, London brick house style', onclick: () => pnFromHouse(it, true) }, '(brick house)')) : null,
        it.t === 'house' ? el('p', { class: 'note' }, 'In the game this house is already breakable panels (auto-converted) • break it apart when you want to edit walls/windows/roof panel by panel') : null,
        D && D.cat === 'game' && it.t !== 'pchest' && it.t !== 'pn_wall' ? fld('Breakable', it, 'brk', { type: 'checkbox', get: () => it.brk == null ? 1 : it.brk }) : null, btns)); }   // houses / crates / barrels / trees: off = unbreakable
    else if (sel.k === 'wall') box.append(section('Wall' + (it.n ? ' — ' + it.n : ''), true, fld('Thickness', it, 'th', { min: 0.2 }), fld('Height', it, 'h', { min: 0.2 }), fld('Color', it, 'c', { type: 'color' }),
      fld('Base (height)', it, 'base', { nullable: 1, ph: 'follow ground' }), fld('Curved', it, 'curve', { type: 'checkbox' }), fld('Closed Loop', it, 'closed', { type: 'checkbox' }), fld('Breakable', it, 'brk', { type: 'checkbox' }),
      fld('Break Material', it, 'm', { type: 'select', items: [['stone', 'Rocks'], ['wood', 'Wood'], ['ice', 'Ice']] }),
      fld('Siege Target', it, 'sg', { type: 'select', items: MD.SG_WALL, get: () => it.sg || '', after: () => { if (it.sg && !it.brk) it.brk = 1; resync(); renderSide(); } }),
      fld('Visible (exported to the game)', it, 'vis', { type: 'checkbox', get: () => it.vis !== 0, set: v => { if (v) delete it.vis; else it.vis = 0; } }),
      fld('System', it, 'sys', { type: 'select', items: MD.SYS_WALL, get: () => it.sys || '' }), fld('Style', it, 'style', { type: 'select', items: MD.STYLE, get: () => it.style || '' }),
      el('p', { class: 'note' }, it.pts.length + ' points • length ' + MD.pathLen(MD.wallPath(it)).toFixed(1) + ' • drag the white points to bend • Alt+click on the wall = add point • select a point then Del = delete point • leave "Base" empty = follow the ground'), btns));
    else if (sel.k === 'part') { const D = MD.PART[it.k];
      box.append(section('Castle — ' + D.n, true, fld('Position X', it, 'x'), fld('Position Z', it, 'z'), fld('Rotation (deg)', it, 'rot', { deg: 1 }), fld('Base (height)', it, 'base', { nullable: 1, ph: 'follow ground' }),
        ...Object.entries(D.p).map(([q, v]) => fld(MD.PART_P[q], it, q, { min: v[1], step: v[3] })), ...Object.keys(D.f).map(q => fld(MD.PART_F[q], it, q, { type: 'checkbox' })),
        fld('Color', it, 'c', { type: 'color' }), fld('Breakable (whole piece)', it, 'brk', { type: 'checkbox' }), fld('Style', it, 'style', { type: 'select', items: MD.STYLE, get: () => it.style || '' }),
        it.pts ? el('p', { class: 'note' }, it.pts.length + ' points • drag the blue points to shape • Alt+click an edge = add point • select a point then Del = delete point • collides only at the outline (hollow inside), no walkable top, not breakable') : null,
        el('p', { class: 'note' }, 'Piece ends snap together while dragging/placing • leave "Base" empty = follow the ground • breakable = no battlements/walkway on top • gate doors are always breakable'), btns)); }
    else box.append(section('Upper Floor' + (it.n ? ' — ' + it.n : ''), true, fld('Position X', it, 'x'), fld('Position Z', it, 'z'), fld('Width', it, 'w', { min: 0.5 }), fld('Length', it, 'd', { min: 0.5 }), fld('Rotation (deg)', it, 'rot', { deg: 1 }),
      fld('Height (start)', it, 'y'), fld('Height (end)', it, 'y2', { get: () => it.y2 == null ? it.y : it.y2 }), fld('Thickness', it, 'th', { min: 0.1 }), fld('Color', it, 'c', { type: 'color' }), fld('Make Steps', it, 'steps', { type: 'checkbox' }),
      fld('Solid Below', it, 'sol', { type: 'select', items: [['', 'Auto (ramps from the ground)'], [1, 'On (walls under it)'], [0, 'Off (walk under)']], get: () => it.sol == null ? '' : it.sol, set: v => { if (v === '') delete it.sol; else it.sol = +v; } }),
      fld('Visible (exported to the game)', it, 'vis', { type: 'checkbox', get: () => it.vis !== 0, set: v => { if (v) delete it.vis; else it.vis = 0; } }),
      fld('System', it, 'sys', { type: 'select', items: MD.SYS_FLOOR, get: () => it.sys || '' }), fld('Style', it, 'style', { type: 'select', items: MD.STYLE, get: () => it.style || '' }),
      el('div', { class: 'seg' }, el('button', { class: 'tl-btn', title: 'Bring the start end down to touch the ground there', onclick: () => editSel(f => { const c = MD.floorCorners(f); f.y = +MD.gh(M, (c[0][0] + c[1][0]) / 2, (c[0][1] + c[1][1]) / 2).toFixed(2); }) }, 'Start Touches Ground'), el('button', { class: 'tl-btn', onclick: () => editSel(f => { f.y2 = f.y; }) }, 'Make Level')),
      el('p', { class: 'note' }, 'Clearance below ' + (Math.min(it.y, it.y2 == null ? it.y : it.y2) - (it.th || 0.4) - MD.gh(M, it.x, it.z)).toFixed(1) + ' (need ≥ 2.8 to walk under)'), btns));
  }
  if (it) { const S = selAll(), dl = el('datalist', { id: 'grpdl' }, ...grpList().map(g => el('option', { value: g }))), cur = it.grp || '';
    const inp = el('input', { class: 'tl-in', value: cur, placeholder: '(none)', onchange: e => grpSet(e.target.value.trim(), S) }); inp.setAttribute('list', 'grpdl');
    box.append(section('Group' + (S.length > 1 ? ' — ' + S.length + ' selected' : ''), true, el('div', { class: 'row' }, el('label', null, 'Hierarchy group'), inp, dl),
      el('div', { class: 'seg' }, el('button', { class: 'tl-btn', title: 'Ctrl+G', onclick: grpNew }, 'New Group'), cur ? el('button', { class: 'tl-btn', title: 'Ctrl+Shift+G', onclick: () => grpSet('', S) }, 'Ungroup') : null, cur ? el('button', { class: 'tl-btn', onclick: () => grpSelect(cur) }, 'Select Group') : null),
      el('p', { class: 'note' }, 'Folders in the Hierarchy only (the game ignores them) • type a name to move the selection into that group')));
    const PW = S.map(find).filter(o => o && o.t === 'pn_wall');   // whole house / group at once (same as a panel's Unbreakable)
    if (PW.length > 1) { const all = PW.every(o => o.nb), cb = el('input', { type: 'checkbox', checked: all, onchange: () => { pushUndo('o'); for (const o of PW) { if (cb.checked) o.nb = 1; else delete o.nb; syncObj(o); } renderSide(); changed(); } });
      box.lastChild.append(el('label', { class: 'chk', title: 'Breakable panels in the selection become one solid piece each (same as Unbreakable on a single panel)' }, cb, 'Unbreakable — ' + PW.length + ' breakable panels in the selection' + (all || !PW.some(o => o.nb) ? '' : ' (some)'))); } }
  const mset = (k, o) => fld(o.label, M, k, Object.assign({ after: () => { applySky(); changed(); renderList(); } }, o));
  box.append(section('Map', !it,
    mset('name', { label: 'Name', type: 'text' }), mset('desc', { label: 'Description', type: 'text' }),
    el('div', { class: 'row' }, el('label', null, 'Size'), el('span', { style: 'flex:1;font-family:var(--fu)' }, M.W + ' × ' + M.H + ' m'), el('button', { class: 'tl-btn', style: 'padding:2px 8px', onclick: resizeDlg }, 'Change')),
    mset('sky', { label: 'Sky', type: 'select', items: MD.SKY }),
    mset('style', { label: 'Main Style', type: 'select', items: MD.STYLE, get: () => M.style || '' }),
    fld('Fog: Color', M, 'fog', { type: 'color', get: () => (M.fog || fogDef())[0], set: v => { M.fog = [v, (M.fog || fogDef())[1], (M.fog || fogDef())[2]]; }, after: () => { applySky(); changed(); } }),
    fld('Fog: Start', M, 'fog', { get: () => (M.fog || fogDef())[1], set: v => { const f = M.fog || fogDef(); M.fog = [f[0], v || 0, f[2]]; }, after: () => { applySky(); changed(); }, step: 10 }),
    fld('Fog: End', M, 'fog', { get: () => (M.fog || fogDef())[2], set: v => { const f = M.fog || fogDef(); M.fog = [f[0], f[1], v || 300]; }, after: () => { applySky(); changed(); }, step: 10 }),
    mset('music', { label: 'Music', type: 'select', items: MD.MUSIC.map(m => [m, m || '(default)']) }),
    mset('weather', { label: 'Weather', type: 'text', ph: 'clear:60,rain:40' }),
    mset('skirt', { label: 'Outer Border', step: 5, min: 0 }),
    el('p', { class: 'note' }, 'Outer border = ground extending past the play edge (in m) so the map edge isn’t seen floating')));
  const modes = el('div', { class: 'pal' }); for (const [k, n] of MD.MODES) { const c = el('input', { type: 'checkbox', checked: M.modes.includes(k), onchange: () => { pushUndo('o'); M.modes = MD.MODES.map(m => m[0]).filter(m => m === k ? c.checked : M.modes.includes(m)); changed(); colDirty(); } }); modes.append(el('label', { class: 'chk' }, c, n)); }
  const fx = el('div', { class: 'pal' }); for (const [k, n] of MD.FXS) { const on = M.fx.some(f => f.split(':')[0] === k), c = el('input', { type: 'checkbox', checked: on, onchange: () => { pushUndo('o'); M.fx = M.fx.filter(f => f.split(':')[0] !== k); if (c.checked) M.fx.push(k); changed(); } }); fx.append(el('label', { class: 'chk' }, c, n)); }
  box.append(section('Playable Modes', false, modes, check('In the random map pool', 'random', M, changed), check('Let the game place crates/barrels randomly (if none placed)', 'autoProps', M, () => { changed(); colDirty(); })),
    section('Ambient Effects', false, fx));
  box.append(el('details', { class: 'sec', open: true, id: 'chkSec' }, el('summary', null, 'Validation (before export)'), el('ul', { class: 'lst', id: 'chk' })));
  renderCheck(); hierSel();
}
const fogDef = () => M.sky === 'day' ? ['#a9c4d6', 110, 420] : M.sky === 'sunset' ? ['#d8a888', 130, 520] : ['#16223a', 90, 380];
function renderCheck() {
  const ul = $('chk'); if (!ul || !M) return; ul.textContent = '';
  let G; try { G = gameData(); } catch (e) { ul.append(el('li', { class: 'err' }, 'Couldn’t compute: ' + e.message)); return; }
  const loading = M.objs.some(o => isKit(o) && !tplNow(kitId(o)) && KIT.byId.has(kitId(o))), lost = M.objs.filter(o => isKit(o) && !KIT.byId.has(kitId(o))).length;
  if (loading) ul.append(el('li', { class: 'warn' }, 'Loading models…'));
  if (lost) ul.append(el('li', { class: 'err' }, 'Has ' + lost + ' items whose asset is missing (won’t be exported)'));
  for (const r of MD.check(ALLM(), G)) { const li = el('li', { class: r.lv }, r.t); if (r.at) li.append(' ', el('a', { onclick: () => { cam.x = r.at[0]; cam.z = r.at[1]; cam.dist = Math.min(cam.dist, 35); camApply(); } }, '[go]')); ul.append(li); }
  const c = G.counts; $('sInfo').textContent = `Walls ${M.walls.length} • Floors ${M.floors.length} • Castle ${M.parts.length} • Objects ${M.objs.length} • Colliders ${c.obs} • Breakable ${c.brk}`;
}

// ================= sky / light preview =================
function applySky() {
  const s = show.sky ? M.sky : 'studio', fog = M.fog || fogDef();
  if (s === 'studio') { scene.background = new THREE.Color(css('--bg0') || '#161616'); scene.fog = null; hemi.color.set('#ffffff'); hemi.groundColor.set('#50545c'); hemi.intensity = 1.4; sun.intensity = 2.2; sun.color.set('#ffffff'); }
  else { const night = s === 'night' || s === 'indoor';
    scene.background = new THREE.Color(fog[0]); scene.fog = new THREE.Fog(fog[0], +fog[1], +fog[2] * 1.6); if (tool === 'bd' || (M.bd && M.bd.on && show.bd)) { scene.fog.near *= 2.5; scene.fog.far *= 2.5; }
    if (night) { hemi.color.set('#a8b8e8'); hemi.groundColor.set('#2a3448'); hemi.intensity = 0.9; sun.intensity = 1.2; sun.color.set('#c8d8ff'); }
    else { hemi.color.set(s === 'sunset' ? '#ffd0a0' : '#ffe8d0'); hemi.groundColor.set('#4a5a2a'); hemi.intensity = 1.1; sun.intensity = s === 'sunset' ? 1.9 : 2.4; sun.color.set(s === 'sunset' ? '#ffc890' : '#fff0dc'); } }
  need();
}

// ================= save / load =================
function stat(t, cls) { const s = $('stat'); s.textContent = t; s.className = cls || ''; }
function changed() { hierSoon(); dirty = true; GD = null; stat('Unsaved', 'warn'); clearTimeout(saveT); if (online && M.id) saveT = setTimeout(save, 4000); need(); }
async function save() {
  clearTimeout(saveT); if (!M) return false;
  if (!M.id) { stat('No id yet', 'err'); return false; }
  try { const r = await (await fetch('/api/mb?id=' + M.id, { method: 'POST', body: JSON.stringify({ map: MD.pack(M) }) })).json(); if (!r.ok) throw new Error(r.err);
    dirty = false; stat('Saved ' + new Date().toLocaleTimeString('th-TH'), 'ok'); localStorage.setItem('mb_last', M.id); return true; }
  catch (e) { stat('Couldn’t save: ' + e.message + (online ? '' : ' (open through Tools.bat)'), 'err'); return false; }
}
async function refreshVer() {   // top bar: map version here vs on GitHub (Pages deploys from origin/main)
  const s = $('ver'); if (!s) return; if (!online || !M || !M.id) { s.textContent = ''; return; }
  const id = M.id; let r; try { r = await (await fetch('/api/mb-ver?id=' + id)).json(); } catch (e) { return; } if (!M || M.id !== id) return;
  const v = x => x == null ? '?' : x ? 'v' + x : '–', loc = r.local || 0, rem = r.remote;
  s.textContent = 'Map ' + v(loc) + ' • Remote ' + v(rem) + (rem != null && loc !== rem ? (r.head === loc ? ' (not pushed)' : ' (not committed)') : '');
  s.className = rem == null ? '' : loc === rem ? 'ok' : 'warn';
  s.title = ['Map = version exported on this machine (assets/manifest.json)', 'Last commit = ' + v(r.head), 'Remote = version on GitHub (origin/main = what the online game loads)',
    r.err ? 'Couldn’t reach GitHub: ' + r.err : r.fetched ? 'Checked ' + new Date(r.fetched * 1000).toLocaleTimeString('th-TH') : '', 'Click to check again'].filter(Boolean).join('\n');
}
async function refreshList() { try { const r = await (await fetch('/api/mb-list')).json(); list = r.maps || []; online = true; } catch (e) { online = false; list = []; } renderList(); refreshVer(); }
function renderList() { const s = $('mapSel'); s.innerHTML = ''; const ids = new Set(list.map(m => m.id));
  if (M && M.id && !ids.has(M.id)) s.append(el('option', { value: M.id }, M.name));
  for (const m of list) s.append(el('option', { value: m.id }, (M && m.id === M.id ? M.name : m.name) + (m.game ? '  ✓ in game' : '')));
  if (M) s.value = M.id; }
async function openMap(id) {
  if (dirty) await save();
  try { const r = await (await fetch('/api/mb?id=' + id)).json(); if (!r.ok) throw new Error(r.err); setMap(MD.unpack(r.map)); localStorage.setItem('mb_last', id); stat('Opened', 'ok'); refreshVer(); } catch (e) { stat('Couldn’t open: ' + e.message, 'err'); }
}
function setMap(m) {
  M = m; sel = null; msel = []; undo = []; redo = []; draft = null; PNT.br.clear(); PNH.on = false; dirty = false; GD = null;
  buildTerrain(); buildBd(); applySky(); syncAll(); fit(); renderList(); renderSide(); renderOpts();
  if (M.rooms && M.rooms.length) loadRooms().then(() => { if (M === m) { syncAll(); renderSide(); } });   // room prefabs (room-*.json)
  for (const o of M.objs) if (isKit(o)) kitTpl(kitId(o)).then(() => { clearTimeout(setMap.t); setMap.t = setTimeout(() => { if (M === m) { syncObjs(); updSel(); colDirty(); } }, 60); });
  $('vmsg').textContent = '';
}
function dlg(title, body, okText, onOk) {
  const d = $('dlg'); d.textContent = ''; const err = el('p', { class: 'note', style: 'color:var(--serr)' });
  d.append(el('h2', null, title), body, err, el('div', { class: 'btns' }, el('button', { class: 'tl-btn', onclick: () => d.close() }, 'Cancel'), el('button', { class: 'tl-btn pri', onclick: async () => { try { const r = await onOk(); if (r !== false) d.close(); } catch (e) { err.textContent = e.message; } } }, okText)));
  d.showModal();
}
// New Map: everything the Map panel / Playable Modes / Backdrop set, chosen before the map exists (user 2026-11-25)
const NEW_SIZES = [['s', 'Small (80 × 50)', 80, 50], ['m', 'Medium (120 × 75)', 120, 75], ['l', 'Large (150 × 90)', 150, 90], ['xl', 'Huge (200 × 130)', 200, 130], ['c', 'Custom', 0, 0]];
const NEW_TERR = [['flat', 'Flat'], ['hills', 'Gentle Hills'], ['bowl', 'Valley (raised edges)'], ['plateau', 'Plateau (high middle)']];
function newTerrain(m, k, seed) {   // starting ground shape (walkable slopes, sculpt from there)
  if (k === 'flat') return; const { nx, ny, W, H } = m, fb = (x, z) => { let v = 0, a = 1, t = 0, f = 1; for (let i = 0; i < 3; i++) { v += a * MD.vnoise(x * f + seed * 13, z * f - seed * 7); t += a; a *= 0.5; f *= 2.1; } return v / t; };
  const ss = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = i * MD.C, z = j * MD.C, ex = Math.abs(x / W - 0.5) * 2, ez = Math.abs(z / H - 0.5) * 2, e = Math.max(ex, ez); let h = 0;
    if (k === 'hills') h = (fb(x * 0.025, z * 0.025) - 0.5) * 11;
    else if (k === 'bowl') h = 6 * ss((e - 0.55) / 0.45) + (fb(x * 0.03, z * 0.03) - 0.5) * 1.5;
    else if (k === 'plateau') h = 4 * (1 - ss((e - 0.35) / 0.4)) + (fb(x * 0.03, z * 0.03) - 0.5) * 1.2;
    m.hg[j * nx + i] = +h.toFixed(2); }
}
function newDlg() {
  const v = { name: 'New Map', id: '', desc: '', size: 'm', W: 120, H: 75, surf: 0, terr: 'flat', sky: 'day', style: '', music: '', modes: ['coop', 'ffa', 'duel', 'tdm'], random: 0, autoProps: 1, skirt: 40, bd: '' }, body = el('div', { class: 'newmap', style: 'max-height:70vh;overflow-y:auto;min-width:380px;padding-right:6px' });
  const row = (label, ...c) => el('div', { class: 'row' }, el('label', null, label), ...c);
  const inp = (key, type, extra) => { const i = el('input', Object.assign({ class: 'tl-in', type: type || 'text', value: v[key], oninput: () => { v[key] = type === 'number' ? +i.value : i.value; } }, extra || {})); return i; };
  const sel = (key, items, after) => el('select', { class: 'tl-sel', onchange: e => { v[key] = e.target.value; if (after) after(); }, html: items.map(([k, n]) => `<option value="${k}"${String(k) === String(v[key]) ? ' selected' : ''}>${n}</option>`).join('') });
  const wI = inp('W', 'number', { min: 30, max: 260, step: 10 }), hI = inp('H', 'number', { min: 30, max: 260, step: 10 }), sizeRow = row('Width × Length (m)', wI, hI);
  const sizeSync = () => { const S = NEW_SIZES.find(q => q[0] === v.size); if (S && S[2]) { v.W = S[2]; v.H = S[3]; wI.value = v.W; hI.value = v.H; } sizeRow.style.display = v.size === 'c' ? '' : 'none'; };
  const modes = el('div', { class: 'pal' }); for (const [k, n] of MD.MODES) { const c = el('input', { type: 'checkbox', checked: v.modes.includes(k), onchange: () => { v.modes = MD.MODES.map(m => m[0]).filter(m => m === k ? c.checked : v.modes.includes(m)); } }); modes.append(el('label', { class: 'chk' }, c, n)); }
  const chk = (key, label) => { const c = el('input', { type: 'checkbox', checked: !!v[key], onchange: () => { v[key] = c.checked ? 1 : 0; } }); return el('label', { class: 'chk' }, c, label); };
  body.append(h3('Map'), row('Name', inp('name')), row('id (English)', inp('id', 'text', { placeholder: 'e.g. cliffs' })), row('Description', inp('desc', 'text', { placeholder: 'shown in the lobby' })),
    h3('Size + Ground'), row('Size', sel('size', NEW_SIZES.map(q => [q[0], q[1]]), sizeSync)), sizeRow,
    row('Starting Ground', sel('surf', SURF.map((q, i) => [i, q.n]))), row('Starting Shape', sel('terr', NEW_TERR)),
    row('Backdrop', sel('bd', [['', '(none)'], ...BD.BD_PRESETS])),
    h3('Look'), row('Sky', sel('sky', MD.SKY)), row('Main Style', sel('style', MD.STYLE)), row('Music', sel('music', MD.MUSIC.map(m => [m, m || '(default)']))), row('Outer Border (m)', inp('skirt', 'number', { min: 0, step: 5 })),
    h3('Playable Modes'), modes, chk('random', 'In the random map pool'), chk('autoProps', 'Let the game place crates/barrels randomly (if none placed)'),
    el('p', { class: 'note', html: 'Everything here can be changed later in the Inspector (Map, Playable Modes) and the Backdrop tool<br>2–6 players: longer side 100–150 recommended' }));
  sizeSync();
  dlg('New Map', body, 'Create', async () => {
    const id = v.id.trim().toLowerCase(); if (!/^[a-z0-9][a-z0-9_-]{0,40}$/.test(id)) throw new Error('id Only a-z 0-9 _ - allowed');
    if (list.some(m => m.id === id)) throw new Error('That id already exists');
    if (!v.modes.length) throw new Error('Tick at least one Playable Mode');
    const W = clamp(Math.round(v.W), 30, 260), H = clamp(Math.round(v.H), 30, 260);
    if (dirty) await save();
    const m = MD.newMap({ id, name: v.name || id, W, H, surf: +v.surf });
    Object.assign(m, { desc: v.desc || '', sky: v.sky, music: v.music, modes: v.modes.slice(), random: v.random, autoProps: v.autoProps, skirt: Math.max(0, +v.skirt || 0) }); if (v.style) m.style = v.style;
    newTerrain(m, v.terr, Math.random() * 50);
    setMap(m); if (v.bd) bdCreate(v.bd, 1 + Math.floor(Math.random() * 999));
    if (!await save()) throw new Error($('stat').textContent); await refreshList();
  });
}
function resizeDlg() {
  const v = { W: M.W, H: M.H }, body = el('div'); for (const [l, k] of [['Width (m)', 'W'], ['Length (m)', 'H']]) { const i = el('input', { class: 'tl-in', type: 'number', min: 30, max: 260, value: v[k], oninput: () => { v[k] = +i.value; } }); body.append(el('div', { class: 'row' }, el('label', null, l), i)); }
  body.append(el('p', { class: 'note' }, 'Existing content stays centred; grow = edge ground is stretched, shrink = the excess is cut (↶ undo works)'));
  dlg('Resize Map', body, 'OK', () => { const W = clamp(Math.round(v.W), 30, 260), H = clamp(Math.round(v.H), 30, 260); pushUndo('a'); MD.resize(M, W, H); buildTerrain(); buildBd(); syncAll(); fit(); renderSide(); changed(); });
}

// ================= export to the game =================
function groundExport() {   // ground mesh for the .glb: vertex colours (no overlay), optional coarser step, skirt beyond the play area
  const { nx, ny } = M, step = nx * ny > 400000 ? 4 : nx * ny > 70000 ? 2 : 1, cols = Math.floor((nx - 1) / step) + 1, rows = Math.floor((ny - 1) / step) + 1, sk = M.skirt > 0 && !(M.bd && M.bd.on) ? 1 : 0, CC = cols + sk * 2, RR = rows + sk * 2, n = CC * RR;
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
  if (!M.id) return false; stat('Exporting…');
  try { if (!await save()) return false; const { G, glb, tris } = await buildExport();
    const r = await (await fetch('/api/mb-export?id=' + M.id, { method: 'POST', body: JSON.stringify({ data: G.data, glb: ab64(glb) }) })).json(); if (!r.ok) throw new Error(r.err);
    stat(`Exported (v${r.v}) • ${r.glb_kb} KB • ${tris.toLocaleString()} triangles`, r.glb_kb > 5000 || tris > 150000 ? 'warn' : 'ok'); await refreshList(); return true; }
  catch (e) { console.error(e); stat('Couldn’t export: ' + e.message, 'err'); return false; }
}

async function exportPublish() {   // ⬆ Export = export + commit/push only this map's files to GitHub (Play / Game View only export)
  if (!await exportGame()) return; const st = $('stat').textContent; stat(st + ' • Pushing…');
  try { const r = await (await fetch('/api/mb-publish?id=' + M.id, { method: 'POST' })).json(); if (!r.ok) throw new Error(r.err);
    stat(r.same ? st + ' • GitHub already has v' + r.v : st + ' • Pushed v' + r.v + ' (' + r.sha + ')' + (r.local === 'behind' ? ' • this PC not pulled yet' : ''), 'ok'); }
  catch (e) { stat(st + ' • Not pushed: ' + e.message, 'err'); }
  refreshVer();
}
// ================= game view (real game in an iframe at the editor camera; game side: js/77-dev.js devMbCam) =================
async function gameView() {
  if (!M || !M.id) { stat('No map id yet', 'err'); return; }
  const d = new THREE.Vector3(); camera.getWorldDirection(d);   // builder world = game world (metres, map centre at origin)
  const pose = [camera.position.x, camera.position.y, camera.position.z, Math.atan2(d.z, d.x), -Math.asin(clamp(d.y, -1, 1))].map(v => +v.toFixed(3));
  const gv = $('gv'); gv.classList.add('on'); $('gvStat').textContent = 'Exporting…';
  const old = gv.querySelector('iframe'); if (old) old.remove();
  if (!await exportGame()) { $('gvStat').textContent = 'Export failed'; return; }
  $('gvStat').textContent = 'Loading game…';
  const f = el('iframe', { src: 'index.html?nosw&mbclean=1&playmap=' + M.id + '&mbcam=' + pose.join(',') + '&t=' + Date.now(), allow: 'fullscreen' });
  f.onload = () => { $('gvStat').textContent = ''; }; gv.append(f);
}
function gameViewClose() { const gv = $('gv'); gv.classList.remove('on'); const f = gv.querySelector('iframe'); if (f) f.remove(); cv.focus(); need(); }

// ================= loop =================
let dirtyView = true, last = performance.now();
function need() { dirtyView = true; }
function status() { $('sPos').textContent = hover ? `x ${hover.x.toFixed(1)}  z ${hover.z.toFixed(1)}  height ${hover.y.toFixed(2)}` : '–'; }
function frame(t) {
  requestAnimationFrame(frame); const dt = Math.min(0.05, (t - last) / 1000); last = t; if (!M) return;
  if (stroke) { if (stroke.k === 'bd') bdBrush(dt, stroke.inv); else if (stroke.k === 'sculpt') sculpt(dt, stroke.inv); else if (stroke.k === 'paint') paintSurf(stroke.inv); else scatter(dt, stroke.inv); dirtyView = true; }
  const w = host.clientWidth, h = host.clientHeight; if (cv.width !== Math.round(w * renderer.getPixelRatio()) || cv.height !== Math.round(h * renderer.getPixelRatio())) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirtyView = true; }
  if (fly.size && drag && drag.k === 'orbit') { camera.getWorldDirection(v3); v3.y = 0; v3.normalize(); const sp = Math.max(8, cam.dist * 0.9) * dt * (fly.fast ? 3 : 1), fw = (fly.has('KeyW') ? 1 : 0) - (fly.has('KeyS') ? 1 : 0), rt = (fly.has('KeyD') ? 1 : 0) - (fly.has('KeyA') ? 1 : 0);
    { const L = bdLim(); cam.x = clamp(cam.x + (v3.x * fw - v3.z * rt) * sp, L.x0, L.x1); cam.z = clamp(cam.z + (v3.z * fw + v3.x * rt) * sp, L.z0, L.z1); } if (fly.has('KeyE')) cam.dist *= 1 + dt; if (fly.has('KeyQ')) cam.dist = Math.max(3, cam.dist * (1 - dt * 0.9)); camApply(); }
  if (!dirtyView) return; dirtyView = false;
  drawRing(); updGhost(); updPartGhost(); gCol.visible = show.col; renderer.render(scene, camera);
}

// Capture the current view as PNG: helpers hidden, up to 2x resolution (max 4096 px); download + copy to shots/ when online
async function shotPNG() {
  if (!M) return;
  const w = host.clientWidth, h = host.clientHeight, pr = renderer.getPixelRatio(), R = Math.max(1, Math.min(Math.max(pr, 2), 4096 / w, 4096 / h));
  const hide = [gHelp, gCol, tc, selBox, ...mBoxes].filter(Boolean), was = hide.map(o => o.visible);
  hide.forEach(o => { o.visible = false; });
  let url, size = '';
  try { renderer.setPixelRatio(R); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.render(scene, camera); url = cv.toDataURL('image/png'); size = cv.width + '×' + cv.height; }
  finally { hide.forEach((o, i) => { o.visible = was[i]; }); renderer.setPixelRatio(pr); renderer.setSize(w, h, false); need(); }
  const d = new Date(), p2 = n => String(n).padStart(2, '0'), name = `${(M.id || 'map').replace(/[^\w-]/g, '_')}-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
  const a = document.createElement('a'); a.href = url; a.download = name + '.png'; document.body.append(a); a.click(); a.remove();
  let msg = `📷 Saved ${name}.png (${size}) to Downloads`;
  if (online) { try { const j = await (await fetch('/api/shot?name=mb-' + name, { method: 'POST', body: url })).json(); if (j.ok) msg += ' + ' + j.path; } catch (_) {} }
  stat(msg, 'ok');
}

// ================= boot =================
$('bNew').onclick = newDlg; $('bSave').onclick = save; $('bUndo').onclick = doUndo; $('bRedo').onclick = doRedo; $('bExport').onclick = exportPublish; $('ver').onclick = refreshVer; setInterval(refreshVer, 120000);
$('bPlay').onclick = async () => { const w = window.open('about:blank', 'mb_play'); if (await exportGame()) w.location = 'index.html?nosw&playmap=' + M.id + (M.modes.length === 1 && M.modes[0] === 'siege' ? '&pm=siege' : '') + '&t=' + Date.now(); else w.close(); };
$('mapSel').onchange = e => openMap(e.target.value);
for (const b of document.querySelectorAll('#gbar [data-g]')) b.onclick = () => setGizmo(b.dataset.g);
$('snapSel').value = String(opt.snap); $('snapSel').onchange = e => { opt.snap = +e.target.value; placeGizmo(); };
$('hq').oninput = renderHier;
$('vGame').onclick = gameView; $('gvRe').onclick = gameView; $('gvX').onclick = gameViewClose;
$('vTop').onclick = () => { cam.pitch = 1.55; cam.yaw = 0; camApply(); }; $('vFit').onclick = fit; $('vShot').onclick = shotPNG;
{ let dm = 1; try { dm = localStorage.getItem('mb-dragmove') === '0' ? 0 : 1; } catch (_) {} opt.dragMove = dm; $('oDrag').checked = !!dm; }
$('oDrag').onchange = e => { opt.dragMove = e.target.checked ? 1 : 0; try { localStorage.setItem('mb-dragmove', String(opt.dragMove)); } catch (_) {} };
$('oSteep').onchange = e => { show.steep = e.target.checked; updTerrain(0, 0, M.nx - 1, M.ny - 1); need(); };
$('oCol').onchange = e => { show.col = e.target.checked; buildCol(); need(); };
$('oArea').onchange = e => { show.area = e.target.checked; gObjs.traverse(m => { if (m.userData.area) m.visible = show.area; }); need(); };
$('oGrid').onchange = e => { show.grid = e.target.checked; buildGrid(); need(); };
$('oSky').onchange = e => { show.sky = e.target.checked; applySky(); };
addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
window.__mb = { get M() { return M; }, get tool() { return tool; }, makeWater, pnHoleHit, gameView, gameViewClose, get RX() { return RX; }, loadRooms, MD, opt, placePart, syncParts, partNode, gParts, castleProto, cam, camApply, setTool, gameData, buildExport, exportGame, save, setMap, syncAll, need, kitTpl, KIT, get sel() { return sel; }, set sel(v) { sel = v; renderSide(); updSel(); }, pushUndo, changed, colDirty, updTerrain, afterTerrain, applyRamp, makeFloor, placeObj, doUndo };
(async () => {
  renderTools(); $('hint').textContent = HINT[tool];
  await Promise.all([loadKit(), refreshList()]);
  const want = new URLSearchParams(location.search).get('id') || localStorage.getItem('mb_last');
  if (want && list.some(m => m.id === want)) await openMap(want); else if (list.length) await openMap(list[0].id);
  if (!M) { setMap(MD.newMap({ id: '', name: 'Untitled' })); $('vmsg').textContent = ''; stat(online ? 'Press "＋ New" to start a map' : 'Offline — open through Tools.bat to save', 'warn'); if (online) newDlg(); }
  requestAnimationFrame(frame);
})();
