// page script for tools/ptree-export.js (runs inside index.html via tools/headless.js)
// ---- page part (runs inside index.html through tools/headless.js) ----
for (let i = 0; i < 100 && !(window.WD && WD.paintKit); i++) await new Promise(r => setTimeout(r, 100));
const THREE = await import('three'), { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
const K = WD.paintKit(), src = K.mat;
const mat = new THREE.MeshStandardMaterial({ map: src.map, vertexColors: true, alphaTest: src.alphaTest, roughness: 1, metalness: 0, name: 'paint_tree' });
const sc = new THREE.Scene(), L = { tree: ['a', 'b', 'c', 'd'], far: ['a', 'b'], bush: ['a', 'b'] };
for (const [k, ids] of Object.entries(L)) ids.forEach((s, i) => { const m = new THREE.Mesh(K[k][i], mat); m.name = 'pt_' + k + '_' + s; sc.add(m); });
const glb = await new GLTFExporter().parseAsync(sc, { binary: true });
let bin = ''; const u8 = new Uint8Array(glb); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
return { files: { 'ptree.glb.b64': btoa(bin) }, bytes: u8.length };
