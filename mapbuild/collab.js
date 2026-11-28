// Map Builder live co-editing (phase 1, 2026-11-28): one person hosts a room (PeerJS / WebRTC, same servers as the game),
// others join with the 5-letter code. The host's machine owns the file (only the host saves / exports); everyone sees edits live.
// Sync = diff by id: walls / floors / objs / parts / rooms + map settings (META) + terrain regions (heights + surface paint).
// Locks: an item someone has selected can't be selected by anyone else. Cursors + remote selections drawn in the colour of each person.
// New ids: each person gets a slot (host 0) and only makes ids with id % 32 === slot → no clashes.
// Not synced yet: backdrop (Backdrop tool is off in a room), map resize. Undo restores only what you changed (remote edits are kept).
// Messages (JSON strings, split into 12 KB chunks): hi, wel, map, ops, cur, sel, peers, bye.
const PREFIX = 'fsmb-v1-', CH = 12000, SLOTS = 32;
const COLS = ['walls', 'floors', 'objs', 'parts', 'rooms'], KOF = { walls: 'wall', floors: 'floor', objs: 'obj', parts: 'part', rooms: 'room' };
const META = ['groups', 'name', 'desc', 'sky', 'style', 'fog', 'music', 'weather', 'fx', 'modes', 'random', 'autoProps', 'skirt', 'look', 'lt'];
const PAL = ['#4a8cff', '#ff6b6b', '#5ad17a', '#ffb547', '#c77dff', '#3fd1d1', '#ff7ac6', '#d9d24a'];
const TURN_URL = 'https://fantas-stick.metered.live/api/v1/turn/credentials?apiKey=c38e05b067af11e7f3e8299b4c0e66de6975';   // same as js/10-net.js
const ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }, { urls: 'stun:stun.cloudflare.com:3478' }];
const genCode = () => { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 5; i++) s += c[Math.floor(Math.random() * c.length)]; return s; };

export function initCollab(A) {   // A = app hooks (mapbuild/app.js)
  const { THREE } = A;
  const S = { on: false, host: false, code: '', slot: 0, name: '', peer: null, conns: new Map(), hostConn: null, peers: new Map(),   // peers: id → {name, slot, sel, cur}
    shadow: null, meta: {}, dirty: false, terr: null, applying: false, remT: new Map(), inbox: new Map(), lastCur: 0, curKey: '' };
  try { S.name = localStorage.getItem('mb_name') || ''; } catch (e) { }
  const colorOf = slot => PAL[slot % PAL.length];
  const me = () => S.host ? 'host' : S.peer && S.peer.id;

  // ---------- transport ----------
  function sendTo(c, m) { if (!c || !c.open) return; const s = JSON.stringify(m); try { if (s.length <= CH) { c.send(s); return; } const k = Math.random().toString(36).slice(2, 8), n = Math.ceil(s.length / CH);
    for (let i = 0; i < n; i++) c.send(JSON.stringify({ t: 'ch', k, i, n, s: s.slice(i * CH, (i + 1) * CH) })); } catch (e) { } }
  function broadcast(m, except) { if (S.host) { for (const [id, c] of S.conns) if (id !== except) sendTo(c, m); } else sendTo(S.hostConn, m); }
  function recv(c, raw) { let m; try { m = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return; }
    if (m.t === 'ch') { const key = c.peer + ':' + m.k, b = S.inbox.get(key) || { n: m.n, got: 0, p: [] }; b.p[m.i] = m.s; b.got++; S.inbox.set(key, b);
      if (b.got < b.n) return; S.inbox.delete(key); try { m = JSON.parse(b.p.join('')); } catch (e) { return; } }
    onMsg(c, m); }
  async function iceReady() { try { const a = await Promise.race([fetch(TURN_URL).then(r => r.json()), new Promise(r => setTimeout(() => r(null), 4000))]); if (Array.isArray(a)) return ICE.concat(a); } catch (e) { } return ICE; }
  async function newPeer(id) { if (typeof Peer === 'undefined') throw new Error('PeerJS not loaded (needs internet)'); const ice = await iceReady();
    return new Promise((res, rej) => { const p = id ? new Peer(id, { debug: 1, config: { iceServers: ice } }) : new Peer({ debug: 1, config: { iceServers: ice } });
      const t = setTimeout(() => rej(new Error('connection server timeout')), 15000); p.on('open', () => { clearTimeout(t); res(p); }); p.on('error', e => { clearTimeout(t); rej(e); }); }); }

  // ---------- state diff ----------
  function snapShadow() { const M = A.M; S.shadow = {}; for (const c of COLS) { const m = new Map(); for (const it of M[c] || []) m.set(it.id, JSON.stringify(it)); S.shadow[c] = m; }
    S.meta = {}; for (const k of META) S.meta[k] = JSON.stringify(M[k] === undefined ? null : M[k]); }
  function diff(only) {   // only = [{k,id}] → just those items (live drag)
    const M = A.M, ops = []; if (!M || !S.shadow) return ops;
    if (only) { for (const r of only) { const c = Object.keys(KOF).find(q => KOF[q] === r.k); if (!c) continue; const it = (M[c] || []).find(v => v.id === r.id); if (!it) continue;
      const j = JSON.stringify(it); if (S.shadow[c].get(it.id) !== j) { S.shadow[c].set(it.id, j); ops.push({ c, id: it.id, v: it }); } } return ops; }
    for (const c of COLS) { const sh = S.shadow[c], seen = new Set();
      for (const it of M[c] || []) { seen.add(it.id); const j = JSON.stringify(it); if (sh.get(it.id) !== j) { sh.set(it.id, j); ops.push({ c, id: it.id, v: it }); } }
      for (const id of [...sh.keys()]) if (!seen.has(id)) { sh.delete(id); ops.push({ c, id, v: null }); } }
    return ops; }
  function metaDiff() { const M = A.M, o = {}; let n = 0; for (const k of META) { const j = JSON.stringify(M[k] === undefined ? null : M[k]); if (S.meta[k] !== j) { S.meta[k] = j; o[k] = M[k] === undefined ? null : M[k]; n++; } } return n ? o : null; }
  function terrPack() { const T = S.terr; if (!T) return null; S.terr = null; const M = A.M, hg = [], sf = [];
    for (let j = T[1]; j <= T[3]; j++) for (let i = T[0]; i <= T[2]; i++) { const k = j * M.nx + i; hg.push(Math.round(M.hg[k] * 100)); sf.push(M.sf[k]); }
    return { r: T, hg, sf }; }
  function flush(only) { if (!S.on || S.applying || !A.M) return; const ops = diff(only), meta = only ? null : metaDiff(), terr = only ? null : terrPack();
    if (!ops.length && !meta && !terr && !(only === undefined && seqBump())) return;
    broadcast({ t: 'ops', from: me(), ops, meta, terr, seq: A.M.seq }); }
  let lastSeq = 0; const seqBump = () => { const s = A.M.seq || 0; if (s !== lastSeq) { lastSeq = s; return true; } return false; };

  // ---------- apply remote ----------
  let syncAllT = 0;
  function applyOps(m) {
    const M = A.M; if (!M) return; S.applying = true; const now = performance.now(), touched = new Set(); let objUp = [], objDel = false, parts = [];
    try {
      for (const o of m.ops || []) { const arr = M[o.c] || (M[o.c] = []), i = arr.findIndex(v => v.id === o.id); S.remT.set(o.c + ':' + o.id, now); touched.add(o.c);
        if (o.v) { if (i >= 0) arr[i] = o.v; else arr.push(o.v); S.shadow[o.c].set(o.id, JSON.stringify(o.v)); if (o.c === 'objs') objUp.push(o.v); if (o.c === 'parts') parts.push(o.v); }
        else { if (i >= 0) arr.splice(i, 1); S.shadow[o.c].delete(o.id); if (o.c === 'objs') objDel = true; if (o.c === 'parts') parts = null; } }
      if (m.meta) { for (const k in m.meta) { M[k] = m.meta[k]; S.meta[k] = JSON.stringify(m.meta[k]); } A.applySky(); }
      if (m.seq) M.seq = Math.max(M.seq || 0, m.seq);
      if (m.terr) { const [i0, j0, i1, j1] = m.terr.r; let n = 0; for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * M.nx + i; M.hg[k] = m.terr.hg[n] / 100; M.sf[k] = m.terr.sf[n]; n++; }
        A.updTerrain(i0, j0, i1, j1); clearTimeout(syncAllT); syncAllT = setTimeout(() => { A.syncAll(); A.buildGrid(); }, 300); }   // objects sit on the ground → resync once the stroke settles
      if (touched.has('rooms')) A.syncAll();
      else { if (touched.has('objs')) { if (objDel || objUp.length > 60) A.syncObjs(); else for (const o of objUp) A.syncObj(o); }
        if (touched.has('walls')) A.syncWalls(); if (touched.has('floors')) A.syncFloors();
        if (touched.has('parts')) { if (!parts || parts.length > 30) A.syncParts(); else for (const p of parts) A.syncPart(p); } }
      if (touched.size || m.meta || m.terr) { A.colDirty(); A.hierSoon(); A.markDirty(); if (A.sel && touched.has(Object.keys(KOF).find(c => KOF[c] === A.sel.k))) A.renderSide(); A.updSel(); }
    } finally { S.applying = false; }
    drawSels(); A.need(); }

  // undo in a room: items others changed after the snapshot keep their current value
  function mergeUndo(parsed, t) { if (!S.on) return parsed; const M = A.M;
    for (const c of COLS) { if (!parsed[c]) continue; const cur = new Map((M[c] || []).map(v => [v.id, v])), hit = id => (S.remT.get(c + ':' + id) || 0) > t, out = [];
      for (const v of parsed[c]) { if (!hit(v.id)) out.push(v); else if (cur.has(v.id)) out.push(cur.get(v.id)); }
      for (const v of M[c] || []) if (hit(v.id) && !out.some(q => q.id === v.id)) out.push(v);
      parsed[c] = out; }
    return parsed; }

  // ---------- presence: cursors + remote selections ----------
  const gPres = new THREE.Group(); gPres.name = 'collab'; A.root.add(gPres);
  const curGeo = new THREE.ConeGeometry(0.5, 1.4, 10).rotateX(Math.PI).translate(0, 0.7, 0);
  function label(text, col) { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); x.fillStyle = col; x.beginPath(); x.roundRect(0, 8, 256, 48, 10); x.fill();
    x.fillStyle = '#fff'; x.font = 'bold 30px Segoe UI, Tahoma, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text.slice(0, 14), 128, 33);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: Object.assign(new THREE.CanvasTexture(c), { colorSpace: THREE.SRGBColorSpace }), depthTest: false, transparent: true, toneMapped: false, sizeAttenuation: false })); s.scale.set(0.16, 0.04, 1); s.center.set(0.5, -0.6); s.renderOrder = 12; return s; }
  function curNode(p) { if (p.node) return p.node; const g = new THREE.Group(), col = colorOf(p.slot);
    const cone = new THREE.Mesh(curGeo, new THREE.MeshBasicMaterial({ color: col, depthTest: false, transparent: true, opacity: 0.9, toneMapped: false })); cone.renderOrder = 12; g.add(cone, label(p.name || '?', col));
    g.visible = false; gPres.add(g); p.node = g; return g; }
  function dropPeer(id) { const p = S.peers.get(id); if (!p) return; if (p.node) gPres.remove(p.node); for (const b of p.boxes || []) A.scene.remove(b); S.peers.delete(id); }
  function drawSels() { for (const p of S.peers.values()) { for (const b of p.boxes || []) { A.scene.remove(b); b.geometry.dispose(); } p.boxes = [];
    for (const r of p.sel || []) { const b = A.boxOf(r); if (!b) continue; const h = new THREE.Box3Helper(b, new THREE.Color(colorOf(p.slot))); h.material.depthTest = false; h.renderOrder = 9; A.scene.add(h); p.boxes.push(h); } } A.need(); }
  const lockedBy = r => { for (const [id, p] of S.peers) if (id !== me() && (p.sel || []).some(q => q.k === r.k && q.id === r.id)) return p; return null; };

  // ---------- messages ----------
  function peersMsg() { return { t: 'peers', list: [['host', S.name || 'Host', 0], ...[...S.peers].filter(([id]) => id !== 'host').map(([id, p]) => [id, p.name, p.slot])] }; }
  function onMsg(c, m) {
    if (m.t === 'hi' && S.host) {   // a guest joined → slot, map, who is here, current selections
      const used = new Set([0, ...[...S.peers.values()].map(p => p.slot)]); let slot = 1; while (used.has(slot) && slot < SLOTS - 1) slot++;
      S.peers.set(c.peer, { name: String(m.name || 'Guest').slice(0, 20), slot, sel: [] }); flush();
      sendTo(c, { t: 'wel', slot, code: S.code }); sendTo(c, { t: 'map', m: A.MD.pack(A.M) });
      broadcast(peersMsg()); sendTo(c, { t: 'sel', from: 'host', refs: A.selAll() }); for (const [id, p] of S.peers) if (id !== c.peer && id !== 'host' && p.sel && p.sel.length) sendTo(c, { t: 'sel', from: id, refs: p.sel });
      A.stat('👥 ' + (m.name || 'Guest') + ' joined', 'ok'); render(); return; }
    if (m.t === 'wel') { S.slot = m.slot; return; }
    if (m.t === 'map') { S.applying = true; try { A.loadMap(A.MD.unpack(m.m)); } finally { S.applying = false; } snapShadow(); lastSeq = A.M.seq || 0; A.stat('👥 Joined room ' + S.code, 'ok'); render(); return; }
    if (m.t === 'peers') { const keep = new Set(m.list.map(q => q[0])); for (const id of [...S.peers.keys()]) if (!keep.has(id)) dropPeer(id);
      for (const [id, name, slot] of m.list) { if (id === me()) continue; const p = S.peers.get(id) || { sel: [] }; p.name = name; p.slot = slot; S.peers.set(id, p); } render(); drawSels(); return; }
    const from = S.host && m.from !== 'host' ? c.peer : m.from; if (S.host) m.from = from;   // host stamps the sender (guests can't pretend)
    if (m.t === 'ops') { if (!S.shadow) return; applyOps(m); if (S.host) broadcast(m, from); return; }
    if (m.t === 'cur') { const p = S.peers.get(from); if (p) { const g = curNode(p); if (m.p) { g.position.set(m.p[0], m.p[1], m.p[2]); g.visible = true; } else g.visible = false; A.need(); } if (S.host) broadcast(m, from); return; }
    if (m.t === 'sel') { const p = S.peers.get(from); if (p) { p.sel = m.refs || []; drawSels(); onSel(true); } if (S.host) broadcast(m, from); return; }
    if (m.t === 'bye') { if (S.host) { const p = S.peers.get(c.peer); dropPeer(c.peer); broadcast(peersMsg()); A.stat('👥 ' + ((p && p.name) || 'Guest') + ' left', 'warn'); render(); } else leave('Host closed the room'); }
  }
  function wire(c) {
    c.on('data', d => recv(c, d));
    c.on('close', () => { if (S.host) { const p = S.peers.get(c.peer); S.conns.delete(c.peer); if (p) { dropPeer(c.peer); broadcast(peersMsg()); A.stat('👥 ' + p.name + ' left', 'warn'); render(); } } else if (S.on) leave('Lost connection to the host'); });
  }

  // ---------- room ----------
  async function hostRoom(name) {
    if (S.on) return; if (!A.M || !A.M.id) { A.stat('Open or create a map first', 'err'); return; }
    S.name = name || 'Host'; S.code = genCode(); A.stat('👥 Opening room…', 'warn');
    try { S.peer = await newPeer(PREFIX + S.code); } catch (e) { A.stat('Couldn’t open a room: ' + (e.message || e.type), 'err'); return; }
    S.on = true; S.host = true; S.slot = 0; S.peers.clear(); snapShadow(); lastSeq = A.M.seq || 0;
    S.peer.on('connection', c => { c.on('open', () => { S.conns.set(c.peer, c); wire(c); }); });
    S.peer.on('disconnected', () => { try { S.peer.reconnect(); } catch (e) { } });
    A.stat('👥 Room ' + S.code + ' open', 'ok'); render(); }
  async function joinRoom(code, name) {
    if (S.on) return; code = String(code || '').trim().toUpperCase(); if (code.length < 4) { A.stat('Enter the room code', 'err'); return; }
    S.name = name || 'Guest'; A.stat('👥 Joining ' + code + '…', 'warn');
    try { S.peer = await newPeer(); } catch (e) { A.stat('Couldn’t connect: ' + (e.message || e.type), 'err'); return; }
    const c = S.peer.connect(PREFIX + code, { reliable: true, serialization: 'json' }); let ok = false;
    const t = setTimeout(() => { if (!ok) { A.stat('Room ' + code + ' not found (check the code / host still open?)', 'err'); try { S.peer.destroy(); } catch (e) { } S.peer = null; } }, 15000);
    c.on('open', () => { ok = true; clearTimeout(t); S.on = true; S.host = false; S.code = code; S.hostConn = c; S.peers.clear(); wire(c); sendTo(c, { t: 'hi', name: S.name }); render(); });
    c.on('error', () => { }); }
  function leave(why) {
    if (!S.on) return; try { broadcast({ t: 'bye' }); } catch (e) { }
    const wasGuest = !S.host; setTimeout(() => { try { S.peer && S.peer.destroy(); } catch (e) { } S.peer = null; }, 200);
    for (const id of [...S.peers.keys()]) dropPeer(id); S.on = false; S.host = false; S.conns.clear(); S.hostConn = null; S.shadow = null; S.code = '';
    if (wasGuest) A.guestLeft(); A.stat('👥 ' + (why || 'Left the room'), why ? 'warn' : 'ok'); render(); }

  // ---------- hooks called by app.js ----------
  let liveT = 0;
  function onChanged() { if (!S.on || S.applying) return; clearTimeout(S.dirtyT); S.dirtyT = setTimeout(() => flush(), 120); }
  function onTerr(i0, j0, i1, j1) { if (!S.on || S.applying || !A.M) return; const M = A.M; i0 = Math.max(0, i0); j0 = Math.max(0, j0); i1 = Math.min(M.nx - 1, i1); j1 = Math.min(M.ny - 1, j1);
    const T = S.terr; S.terr = T ? [Math.min(T[0], i0), Math.min(T[1], j0), Math.max(T[2], i1), Math.max(T[3], j1)] : [i0, j0, i1, j1]; onChanged(); }
  function onSel(fromRemote) {   // after any selection change: drop items others hold, tell everyone what I hold
    if (!S.on) return; const L = A.selAll(), keep = L.filter(r => !lockedBy(r));
    if (keep.length < L.length) { const p = lockedBy(L.find(r => lockedBy(r))); A.setSel(keep); A.stat('🔒 ' + (p ? p.name : 'Someone') + ' is editing that', 'warn'); return; }
    if (fromRemote) return; const key = JSON.stringify(L); if (key === S.selKey) return; S.selKey = key; broadcast({ t: 'sel', from: me(), refs: L }); }
  function onHover(h) { if (!S.on) return; const t = performance.now(); if (t - S.lastCur < 90) return; S.lastCur = t; const p = h ? [+h.x.toFixed(2), +h.y.toFixed(2), +h.z.toFixed(2)] : null, k = JSON.stringify(p);
    if (k === S.curKey) return; S.curKey = k; broadcast({ t: 'cur', from: me(), p }); }
  setInterval(() => { if (S.on && A.dragging()) flush(A.selAll()); }, 100);   // live gizmo drags
  setInterval(() => { if (!S.on) return; const k = Math.max(0.6, A.camDist() / 35); for (const p of S.peers.values()) if (p.node) p.node.children[0].scale.setScalar(k); }, 250);   // cursor cone grows with zoom (label = fixed size on screen)
  const nid = () => { const M = A.M; let s = (M.seq || 1) + 1; if (S.on) while (((s % SLOTS) + SLOTS) % SLOTS !== S.slot) s++; M.seq = s; return s; };

  // ---------- UI: 👥 button + panel in the top bar ----------
  const btn = A.el('button', { class: 'tl-btn', id: 'bRoom', title: 'Edit together live: open a room or join one with its code' }, '👥');
  const pane = A.el('div', { class: 'mb-room' }); pane.hidden = true; document.body.append(pane);
  btn.onclick = () => { pane.hidden = !pane.hidden; render(); };
  A.barSlot.before(btn);
  function render() {
    btn.textContent = S.on ? '👥 ' + (S.peers.size + 1) + ' • ' + S.code : '👥'; btn.classList.toggle('on', S.on); if (pane.hidden) return; pane.textContent = '';
    const r = btn.getBoundingClientRect(); pane.style.top = (r.bottom + 6) + 'px'; pane.style.left = Math.max(8, Math.min(innerWidth - 300, r.left - 120)) + 'px';
    if (!S.on) {
      const nm = A.el('input', { class: 'tl-in', placeholder: 'Your name', value: S.name, maxlength: 20 }), code = A.el('input', { class: 'tl-in', placeholder: 'Room code', maxlength: 6, style: 'text-transform:uppercase;width:90px' });
      const nameOf = () => { const v = nm.value.trim(); try { localStorage.setItem('mb_name', v); } catch (e) { } return v; };
      pane.append(A.el('h4', null, 'Edit together (live)'), nm,
        A.el('button', { class: 'tl-btn pri', onclick: () => { hostRoom(nameOf()); } }, 'Open a room for this map'),
        A.el('div', { class: 'row' }, code, A.el('button', { class: 'tl-btn', onclick: () => joinRoom(code.value, nameOf()) }, 'Join')),
        A.el('p', { class: 'note' }, 'Host = the file is saved and exported on the host’s machine. Joining replaces the map you have open with the host’s map (your file isn’t touched while in the room). Backdrop editing is off in a room.'));
      return; }
    const list = A.el('div', { class: 'who' }), row = (n, slot, tag) => list.append(A.el('div', null, A.el('i', { style: 'background:' + colorOf(slot) }), n + (tag ? ' ' + tag : '')));
    row(S.name || (S.host ? 'Host' : 'Me'), S.slot, '(you' + (S.host ? ', host)' : ')')); for (const [id, p] of S.peers) row(p.name, p.slot, id === 'host' ? '(host)' : '');
    pane.append(A.el('h4', null, 'Room ' + S.code), A.el('p', { class: 'note' }, S.host ? 'Give this code to the others. Keep this tab open: closing it ends the room.' : 'The host saves and exports. Items someone else has selected are locked.'), list,
      A.el('button', { class: 'tl-btn', onclick: () => leave() }, S.host ? 'Close the room' : 'Leave the room'));
  }
  addEventListener('beforeunload', () => { if (S.on) try { broadcast({ t: 'bye' }); } catch (e) { } });

  return { get on() { return S.on; }, get guest() { return S.on && !S.host; }, get applying() { return S.applying; }, nid, onChanged, onTerr, onSel, onHover, mergeUndo, render, host: hostRoom, join: joinRoom, leave, S };
}
