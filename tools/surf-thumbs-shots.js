// step 3 of tools/surf-thumbs.mjs — run in a real GPU browser (headless renders low quality: no ground detail, stripes):
//   open index.html?playmap=tmp-surf&dev=1&mbcam=0,4,0,0,0.6&mbclean=1 (serve.py), wait until the map shows, then paste this file
//   into the console (or the Claude browser pane javascript tool). Saves shots/surf_<k>.jpg (192×120) through POST /api/shot.
(async () => {
  const W = window.WD, T = W.THREE, MD = await import('/mapbuild/model.js'), cv = W.gl.domElement, out = [];
  const COLS = 6, CELL = 18, PATCH = 14, PAD = 12, map = W.G.map, MW = W.MAPS[map].W / 20, MH = W.MAPS[map].H / 20;   // same layout as tools/surf-thumbs.mjs
  const snap = () => { W.composer.render(); const c = document.createElement('canvas'); c.width = 192; c.height = 120; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    const sw = cv.width * 0.5, sh = sw * 120 / 192; x.drawImage(cv, (cv.width - sw) / 2, (cv.height - sh) / 2, sw, sh, 0, 0, 192, 120); return c.toDataURL('image/jpeg', 0.88); };
  W.setYaw(0); W.setPitch(0.61);   // yaw 0 = looking +x, 0.61 rad down
  for (let i = 0; i < MD.SURF.length; i++) {
    const k = MD.SURF[i].k, X = PAD + (i % COLS) * CELL + PATCH / 2 - MW / 2, Z = PAD + Math.floor(i / COLS) * CELL + PATCH / 2 - MH / 2;
    const hid = [], b = new T.Box3(), c = new T.Vector3(), s = new T.Vector3();   // hide small things standing on the patch (training dummies, the player)
    W.scene.traverse(o => { if (!o.isMesh || !o.visible || o.isInstancedMesh) return; b.setFromObject(o); if (b.isEmpty()) return; b.getCenter(c); b.getSize(s);
      if (Math.hypot(c.x - X, c.z - Z) < 9 && s.x < 5 && s.z < 5 && s.y > 0.3) { o.visible = false; hid.push(o); } });
    W.dev.fc.x = X - 6; W.dev.fc.y = 4.2; W.dev.fc.z = Z;
    await new Promise(r => setTimeout(r, 900));
    const r = await fetch('/api/shot?name=surf_' + k, { method: 'POST', body: snap() }); out.push(k + ':' + r.status);
    hid.forEach(o => o.visible = true);
  }
  console.log(out.join(' ')); return out.join(' ');
})();
