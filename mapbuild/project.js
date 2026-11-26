// Map Builder bottom dock, Unity style: Project window (folder tree • asset grid/list • search • favorites • drag an asset into the Scene)
// + Console tab (log of status messages, warnings and errors). Pure DOM: the app passes its data/actions to initProject(api).
// api: items(cat) → OBJ_IN rows • cur() → opt.obj • pick(t, cat) • dragStart(t, cat) • dragEnd() • thumb(kitId) → Promise<dataURL>
//      tool() • visual(t) • importAsset(cat) • reloadKit() • need()
const $ = id => document.getElementById(id);
const el = (tag, props, ...kids) => { const e = document.createElement(tag); if (props) for (const k in props) { if (k === 'class') e.className = props[k]; else if (k === 'html') e.innerHTML = props[k]; else if (k.startsWith('on')) e.addEventListener(k.slice(2), props[k]); else if (k === 'style') e.style.cssText = props[k]; else e[k] = props[k]; } for (const c of kids) if (c != null) e.append(c); return e; };
const LS = { get(k, d) { try { const v = localStorage.getItem('mbp-' + k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } }, set(k, v) { try { localStorage.setItem('mbp-' + k, JSON.stringify(v)); } catch (_) {} } };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// folder layout of the library (category keys = OBJ cat / kit.json cat). No "/" inside names (they are path parts)
const SPEC = [
  ['Gameplay', [['sys', 'Game Points'], ['mode', 'Siege Mode'], ['game', 'Game Objects'], ['collide', 'Collision Shapes']]],
  ['Rooms', [['prefab', 'Room Prefabs'], ['room', 'Room Props'], ['deco', 'Decor (game-drawn)']]],
  ['Nature', [['tree', 'Trees'], ['rock', 'Rocks'], ['plant', 'Small Plants'], ['water', 'Water']]],
  ['Architecture', [['build', 'Buildings'], ['ruin', 'Ruin (modular)'], ['fence', 'Fences & Walls'], ['road', 'Roads & Paving']]],
  ['Props', [['prop', 'Props'], ['light', 'Lamps & Lights']]],
  ['Primitives', 'prim'],
  ['Custom', 'user'],
];
const KITCAT = new Set(['tree', 'rock', 'plant', 'build', 'ruin', 'fence', 'road', 'prop', 'light', 'user']);
const TYPE = { sys: 'Game Point', mode: 'Siege Marker', game: 'Game Object', collide: 'Collider', prefab: 'Room Prefab', room: 'Room Prop', deco: 'Decor', water: 'Water', prim: 'Primitive' };
const GLYPH = { sys: '◎', mode: '⚑', game: '▣', collide: '▢', prefab: '⌂', room: '◫', deco: '◇', water: '≈', prim: '■' };
const PRIMG = { box: '■', cyl: '▮', cone: '▲', ball: '●', wedge: '◢' };
const SVG_FOLD = '<svg viewBox="0 0 24 20" aria-hidden="true"><path d="M1 3.2C1 2 2 1 3.2 1h5.6l2.3 2.6h9.7c1.2 0 2.2 1 2.2 2.2v11c0 1.2-1 2.2-2.2 2.2H3.2C2 19 1 18 1 16.8z" fill="currentColor"/></svg>';
const SVG_STAR = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.8z" fill="currentColor"/></svg>';

let api = null;
const S = { dir: LS.get('dir', 'Assets'), open: new Set(LS.get('open', ['Assets', 'Favorites'])), size: LS.get('size', 46), q: '', scope: 'all',
  flat: LS.get('flat', 0), tab: LS.get('tab', 'project'), fav: LS.get('fav', []), recent: LS.get('recent', []), treeW: LS.get('treeW', 210), h: LS.get('h', 250), selF: null };
let NODES = new Map(), BYT = new Map(), dragIt = null, obs = null;

// ---------- data ----------
function mkItem(x, nd) {
  if (Array.isArray(x)) { const [t, D] = x; return { t, n: D.n, full: D.n, cat: nd.cat, c: D.c, path: nd.id, g: nd.cat === 'prim' ? PRIMG[t] || '■' : GLYPH[nd.cat] || '◆', type: TYPE[nd.cat] || '' }; }
  const [n, pack] = x.name.split(' · ');
  return { t: 'kit:' + x.id, kit: x.id, n, pack: pack || '', full: x.name, cat: nd.cat, path: nd.id, type: 'Model' };
}
function build() {
  NODES = new Map(); BYT = new Map();
  const add = (id, n, o) => { const nd = Object.assign({ id, n, ch: [], items: null }, o); NODES.set(id, nd); const p = id.lastIndexOf('/'); if (p > 0) NODES.get(id.slice(0, p)).ch.push(id); return nd; };
  add('Favorites', 'Favorites', { kind: 'fav' }); add('Favorites/Recent', 'Recently Used', { kind: 'recent' });
  add('Assets', 'Assets', {});
  for (const [n, sub] of SPEC) {
    if (typeof sub === 'string') add('Assets/' + n, n, { cat: sub });
    else { add('Assets/' + n, n, {}); for (const [c, cn] of sub) add('Assets/' + n + '/' + cn, cn, { cat: c }); }
  }
  for (const nd of [...NODES.values()]) if (nd.cat) { nd.items = api.items(nd.cat).map(x => mkItem(x, nd)); for (const it of nd.items) BYT.set(it.t, it); }
  // second view of the same models: one folder per source pack (the map theme they came from)
  add('Assets/Packs', 'Packs (by map theme)', {});
  const packs = new Map();
  for (const it of BYT.values()) if (it.kit && it.pack) (packs.get(it.pack) || packs.set(it.pack, []).get(it.pack)).push(it);
  for (const p of [...packs.keys()].sort()) add('Assets/Packs/' + p, p, { items: packs.get(p), pack: p });
  if (!NODES.has(S.dir)) S.dir = 'Assets';
}
const favItems = () => S.fav.map(t => BYT.get(t)).filter(Boolean);
const recentItems = () => S.recent.map(t => BYT.get(t)).filter(Boolean);
function nodeItems(nd) { return nd.kind === 'fav' ? favItems() : nd.kind === 'recent' ? recentItems() : nd.items || []; }
function deepItems(nd, out = [], seen = new Set()) {   // every asset under a folder (search "in folder", Show sub-folder contents)
  for (const it of nodeItems(nd)) if (!seen.has(it.t)) { seen.add(it.t); out.push(it); }
  for (const c of nd.ch) if (!c.startsWith('Assets/Packs') || nd.id.startsWith('Assets/Packs')) deepItems(NODES.get(c), out, seen);
  return out;
}
const countOf = nd => nd.kind === 'fav' ? S.fav.length : nd.kind === 'recent' ? recentItems().length : deepItems(nd).length;
const isFav = t => S.fav.includes(t);
function toggleFav(t) { S.fav = isFav(t) ? S.fav.filter(x => x !== t) : [...S.fav, t]; LS.set('fav', S.fav); renderTree(); renderGrid(); }

// ---------- tree ----------
function renderTree() {
  const box = $('ptree'); box.textContent = '';
  const row = (id, d) => {
    const nd = NODES.get(id), open = S.open.has(id), hasCh = nd.ch.length > 0, root = d === 0, on = S.dir === id && !S.q;
    const r = el('div', { class: 'hrow' + (on ? ' on' : '') + (root ? ' root' : ''), style: 'padding-left:' + (4 + d * 14) + 'px', title: id,
      onclick: () => openDir(id), oncontextmenu: e => { e.preventDefault(); openDir(id); folderMenu(e, nd); } },
      el('span', { class: 'harr', onclick: e => { e.stopPropagation(); if (!hasCh) return; if (open) S.open.delete(id); else S.open.add(id); LS.set('open', [...S.open]); renderTree(); } }, hasCh ? (open ? '▾' : '▸') : ''),
      el('span', { class: 'pfi' + (nd.kind ? ' star' : ''), html: nd.kind === 'fav' ? SVG_STAR : SVG_FOLD }), el('span', { class: 'pnm' }, nd.n), el('span', { class: 'hcnt' }, String(countOf(nd) || '')));
    box.append(r);
    if (open) for (const c of nd.ch) row(c, d + 1);
  };
  row('Favorites', 0); box.append(el('div', { class: 'psep' })); row('Assets', 0);
}
function openDir(id) { S.dir = id; S.selF = null; LS.set('dir', id); let p = id; while (p.includes('/')) { p = p.slice(0, p.lastIndexOf('/')); S.open.add(p); } LS.set('open', [...S.open]); if (S.q) { S.q = ''; $('pq').value = ''; } renderTree(); renderGrid(); }

// ---------- grid ----------
const listMode = () => S.size <= 6;
function crumbs() {
  const c = $('pcrumb'); c.textContent = '';
  if (S.q) {
    const nd = NODES.get(S.dir);
    c.append(el('span', { class: 'pcl' }, 'Search:'), el('span', { class: 'pseg' },
      el('button', { class: S.scope === 'all' ? 'on' : '', onclick: () => { S.scope = 'all'; renderGrid(); } }, 'All Assets'),
      el('button', { class: S.scope === 'dir' ? 'on' : '', onclick: () => { S.scope = 'dir'; renderGrid(); } }, 'In \'' + nd.n + '\'')));
    return;
  }
  const parts = S.dir.split('/');
  parts.forEach((p, i) => { const id = parts.slice(0, i + 1).join('/'); if (i) c.append(el('span', { class: 'pcs' }, '›'));
    c.append(el('button', { class: 'pcb' + (i === parts.length - 1 ? ' last' : ''), onclick: () => openDir(id) }, NODES.get(id).n)); });
  const nd = NODES.get(S.dir);
  if (nd.ch.length && !nd.kind) c.append(el('span', { class: 'sp' }), el('label', { class: 'pchk', title: 'Also list every asset inside the sub-folders of this folder' },
    el('input', { type: 'checkbox', checked: !!S.flat, onchange: e => { S.flat = e.target.checked ? 1 : 0; LS.set('flat', S.flat); renderGrid(); } }), 'Show sub-folder contents'));
}
function match(it, words) { const s = (it.full + ' ' + (it.type || '') + ' ' + it.path).toLowerCase(); return words.every(w => s.includes(w)); }
function renderGrid() {
  crumbs();
  const g = $('pgrid'); g.textContent = ''; g.className = listMode() ? 'list' : 'grid'; g.style.setProperty('--ts', (40 + S.size * 0.9 | 0) + 'px');
  if (obs) obs.disconnect();
  obs = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { obs.unobserve(e.target); const im = e.target; api.thumb(im.dataset.kit).then(u => { if (u) { im.src = u; im.classList.add('ok'); } }); } }, { root: g, rootMargin: '120px' });
  const nd = NODES.get(S.dir);
  let folders = [], items;
  if (S.q) { const w = S.q.toLowerCase().split(/\s+/).filter(Boolean); items = (S.scope === 'dir' ? deepItems(nd) : deepItems(NODES.get('Assets'))).filter(it => match(it, w)); }
  else { if (!nd.kind) folders = nd.ch.map(id => NODES.get(id)); items = S.flat && nd.ch.length && !nd.kind ? deepItems(nd) : nodeItems(nd); }
  for (const f of folders) g.append(folderTile(f));
  for (const it of items) g.append(tile(it));
  if (!folders.length && !items.length) g.append(el('div', { class: 'pempty' }, S.q ? 'No assets match "' + S.q + '"' : nd.kind === 'fav' ? 'No favorites yet — right-click an asset → Add to Favorites' : nd.kind === 'recent' ? 'Assets you pick show up here' : 'This folder is empty'));
  foot();
}
function folderTile(nd) {
  const n = countOf(nd);
  return el('div', { class: 'pi fold' + (S.selF === nd.id ? ' on' : ''), title: nd.n + ' (' + n + ')', tabIndex: -1,
    onclick: e => { S.selF = nd.id; for (const x of $('pgrid').querySelectorAll('.pi.fold.on')) x.classList.remove('on'); e.currentTarget.classList.add('on'); foot(nd.id); },
    ondblclick: () => openDir(nd.id), oncontextmenu: e => { e.preventDefault(); folderMenu(e, nd); } },
    el('span', { class: 'ic', html: SVG_FOLD }), el('span', { class: 'nm' }, nd.n), listMode() ? el('span', { class: 'pk' }, n + ' items') : null);
}
function iconOf(it, big) {
  if (it.kit) { const im = el('img', { class: 'th', alt: '', draggable: false }); im.dataset.kit = it.kit; if (obs && !big) obs.observe(im); else api.thumb(it.kit).then(u => { if (u) { im.src = u; im.classList.add('ok'); } }); return im; }
  return el('span', { class: 'gl', style: 'color:' + (it.c || 'var(--tx2)') }, it.g);
}
function tile(it) {
  const on = it.t === api.cur(), dim = api.tool() === 'scatter' && !api.visual(it.t);
  const d = el('div', { class: 'pi' + (on ? ' on' : '') + (dim ? ' dim' : ''), title: it.full + '\n' + it.path.replace(/^Assets\//, '') + (it.type ? ' • ' + it.type : '') + '\nclick = pick for placing • drag into the Scene = drop it there', draggable: true, tabIndex: -1,
    onclick: () => pick(it), oncontextmenu: e => { e.preventDefault(); pick(it); itemMenu(e, it); },
    ondragstart: e => { dragIt = it; e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('text/plain', it.full); const ic = d.querySelector('.th.ok'); if (ic) e.dataTransfer.setDragImage(ic, 24, 24); api.dragStart(it.t, it.cat); },
    ondragend: () => { dragIt = null; api.dragEnd(); } });
  d.dataset.t = it.t;
  d.append(el('span', { class: 'ic' }, iconOf(it)), el('span', { class: 'nm' }, it.n));
  if (it.pack && !listMode() && !S.dir.startsWith('Assets/Packs/')) d.append(el('span', { class: 'sub' }, it.pack));   // same names in different packs (Tree 1…) stay tellable apart
  if (isFav(it.t)) d.append(el('span', { class: 'fv', html: SVG_STAR }));
  if (listMode()) d.append(el('span', { class: 'pk' }, it.pack || it.type));
  return d;
}
function pick(it) {
  S.selF = null; api.pick(it.t, it.cat);
  S.recent = [it.t, ...S.recent.filter(t => t !== it.t)].slice(0, 30); LS.set('recent', S.recent);
  sync(); foot();
}
function foot(fid) {
  const p = $('ppath'), it = BYT.get(api.cur());
  p.textContent = fid ? fid : it ? it.path + '/' + it.n : '';
  p.title = it && !fid ? it.full : '';
}
// highlight the current asset without rebuilding (safe while a tile is being dragged)
function sync() {
  if (!api) return; const cur = api.cur(), sc = api.tool() === 'scatter';
  for (const d of $('pgrid').querySelectorAll('.pi[data-t]')) { d.classList.toggle('on', d.dataset.t === cur); d.classList.toggle('dim', sc && !api.visual(d.dataset.t)); }
  foot();
}
// open the folder that holds an asset and scroll to it (Unity "ping")
function reveal(t) {
  const it = BYT.get(t); if (!it) return; setTab('project'); openDir(it.path);
  const d = [...$('pgrid').querySelectorAll('.pi[data-t]')].find(x => x.dataset.t === t);
  if (d) { d.scrollIntoView({ block: 'nearest' }); d.classList.add('ping'); setTimeout(() => d.classList.remove('ping'), 900); }
}
// small asset card for Tool Settings
function card(t) {
  const it = api && BYT.get(t);
  if (!it) return el('p', { class: 'note' }, 'Pick an asset in the Project window (bottom)');
  return el('div', { class: 'pcard', title: 'Show in the Project window', onclick: () => reveal(t) },
    el('span', { class: 'ic' }, iconOf(it, 1)), el('span', { class: 'tx' }, el('b', null, it.n), el('span', null, (it.pack ? it.pack + ' • ' : '') + it.path.replace(/^Assets\//, ''))));
}

// ---------- context menu ----------
let menuEl = null;
function menu(e, rows) {
  closeMenu(); menuEl = el('div', { class: 'pmenu' });
  for (const r of rows) menuEl.append(r === '-' ? el('div', { class: 'msep' }) : el('button', { disabled: !!r[2], onclick: () => { closeMenu(); r[1](); } }, r[0]));
  document.body.append(menuEl);
  const w = menuEl.offsetWidth, h = menuEl.offsetHeight; menuEl.style.left = clamp(e.clientX, 0, innerWidth - w - 4) + 'px'; menuEl.style.top = clamp(e.clientY, 0, innerHeight - h - 4) + 'px';
}
function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; } }
addEventListener('pointerdown', e => { if (menuEl && !menuEl.contains(e.target)) closeMenu(); }, true);
addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
const impCat = () => { const nd = NODES.get(S.dir); return nd && KITCAT.has(nd.cat) ? nd.cat : 'user'; };
function itemMenu(e, it) {
  menu(e, [[isFav(it.t) ? '★ Remove from Favorites' : '☆ Add to Favorites', () => toggleFav(it.t)],
    ['Show in Folder', () => reveal(it.t), S.dir === it.path && !S.q],
    ['Copy Name', () => { try { navigator.clipboard.writeText(it.full); } catch (_) {} }], '-',
    ['Import New Asset… (.glb)', () => api.importAsset(impCat())], ['Refresh', () => api.reloadKit()]]);
}
function folderMenu(e, nd) {
  menu(e, [['Open', () => openDir(nd.id)], ['Collapse All', () => { S.open = new Set(['Assets', 'Favorites']); LS.set('open', [...S.open]); renderTree(); }], '-',
    ['Import New Asset… (.glb)', () => api.importAsset(impCat())], ['Refresh', () => api.reloadKit()]]);
}

// ---------- console ----------
const LOG = []; let cSel = -1;
const CF = Object.assign({ i: 1, w: 1, e: 1, col: 1 }, LS.get('cf', {}));
const kOf = cls => cls === 'err' ? 'e' : cls === 'warn' ? 'w' : 'i';
const ICON = { i: 'ⓘ', w: '⚠', e: '⛔' };
function log(t, cls) {
  t = String(t || '').trim(); if (!t) return;
  const now = new Date(), tm = [now.getHours(), now.getMinutes(), now.getSeconds()].map(v => String(v).padStart(2, '0')).join(':');
  LOG.push({ t, k: kOf(cls), tm }); if (LOG.length > 600) LOG.shift();
  if (S.tab === 'console') renderConsole(); badge();
}
function badge() {
  const n = { i: 0, w: 0, e: 0 }; for (const r of LOG) n[r.k]++;
  const b = $('conN'); if (b) { b.textContent = n.e ? String(n.e) : n.w ? String(n.w) : ''; b.className = n.e ? 'e' : n.w ? 'w' : ''; }
  for (const k of 'iwe') { const x = $('cf' + k); if (x) x.lastChild.textContent = ' ' + n[k]; }
}
function renderConsole() {
  const box = $('clist'); box.textContent = '';
  let rows = LOG.map((r, i) => ({ ...r, i, n: 1 })).filter(r => CF[r.k]);
  if (CF.col) { const m = new Map(); for (const r of rows) { const key = r.k + r.t, o = m.get(key); if (o) { o.n++; o.tm = r.tm; o.i = r.i; } else m.set(key, r); } rows = [...m.values()].sort((a, b) => a.i - b.i); }
  for (const r of rows) box.append(el('div', { class: 'crow ' + r.k + (r.i === cSel ? ' on' : ''), onclick: () => { cSel = r.i; renderConsole(); } },
    el('span', { class: 'cic' }, ICON[r.k]), el('span', { class: 'ctm' }, '[' + r.tm + ']'), el('span', { class: 'ctx' }, r.t), r.n > 1 ? el('span', { class: 'cn' }, String(r.n)) : null));
  const sel = LOG.find((r, i) => i === cSel); $('cdet').textContent = sel ? sel.t : '';
  box.scrollTop = box.scrollHeight; badge();
}
function hookConsole() {
  addEventListener('error', e => log((e.message || 'Error') + (e.filename ? '  (' + e.filename.split('/').pop() + ':' + e.lineno + ')' : ''), 'err'));
  addEventListener('unhandledrejection', e => log('Unhandled: ' + (e.reason && e.reason.message || e.reason), 'err'));
  for (const [m, k] of [['warn', 'warn'], ['error', 'err']]) { const f = console[m].bind(console);
    console[m] = (...a) => { f(...a); try { log(a.map(x => x instanceof Error ? x.message : typeof x === 'object' ? (() => { try { return JSON.stringify(x); } catch (_) { return String(x); } })() : String(x)).join(' '), k); } catch (_) {} }; }
}

// ---------- dock / tabs / splitters ----------
function setTab(t) {
  S.tab = t; LS.set('tab', t);
  for (const x of document.querySelectorAll('#bottom .tab')) x.classList.toggle('on', x.dataset.tab === t);
  $('projPane').hidden = t !== 'project'; $('conPane').hidden = t !== 'console';
  if (t === 'console') renderConsole();
}
function drag(h, move, done) {
  h.addEventListener('pointerdown', e => { e.preventDefault(); h.setPointerCapture(e.pointerId); h.classList.add('on');
    const mv = ev => move(ev), up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.classList.remove('on'); done(); };
    h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); });
}
function applySize() { $('bottom').style.height = clamp(S.h, 120, innerHeight * 0.72) + 'px'; $('ptree').style.width = clamp(S.treeW, 120, 420) + 'px'; api.need(); }

export function initProject(a) {
  api = a; hookConsole();
  for (const x of document.querySelectorAll('#bottom .tab')) x.onclick = () => setTab(x.dataset.tab);
  $('pq').oninput = e => { S.q = e.target.value.trim(); renderTree(); renderGrid(); };
  $('pq').onkeydown = e => { if (e.key === 'Escape') { e.target.value = ''; S.q = ''; renderTree(); renderGrid(); } };
  $('psize').value = S.size; $('psize').oninput = e => { const was = listMode(); S.size = +e.target.value; LS.set('size', S.size); if (was !== listMode()) renderGrid(); else $('pgrid').style.setProperty('--ts', (40 + S.size * 0.9 | 0) + 'px'); };
  $('pAdd').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); menu({ clientX: r.left, clientY: r.bottom + 2 }, [['Import New Asset… (.glb)', () => api.importAsset(impCat())], ['Refresh', () => api.reloadKit()]]); };
  $('pFav').onclick = () => openDir('Favorites');
  $('pgrid').oncontextmenu = e => { if (e.target === $('pgrid')) { e.preventDefault(); folderMenu(e, NODES.get(S.dir)); } };
  $('pgrid').onclick = e => { if (e.target === $('pgrid')) { S.selF = null; for (const x of $('pgrid').querySelectorAll('.pi.fold.on')) x.classList.remove('on'); foot(); } };
  $('cClear').onclick = () => { LOG.length = 0; cSel = -1; renderConsole(); };
  for (const k of ['col', 'i', 'w', 'e']) { const b = $('cf' + k); b.classList.toggle('on', !!CF[k]); b.onclick = () => { CF[k] = CF[k] ? 0 : 1; LS.set('cf', CF); b.classList.toggle('on', !!CF[k]); renderConsole(); }; }
  drag($('hsplit'), e => { S.h = $('bottom').getBoundingClientRect().bottom - e.clientY; applySize(); }, () => LS.set('h', S.h));
  drag($('vsplit'), e => { S.treeW = e.clientX - $('ptree').getBoundingClientRect().left; applySize(); }, () => LS.set('treeW', S.treeW));
  addEventListener('resize', applySize);
  applySize(); setTab(S.tab);
  return { render: () => { if (!api) return; build(); renderTree(); renderGrid(); }, sync, card, reveal, log, dragging: () => dragIt };
}
