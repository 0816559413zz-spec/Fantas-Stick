// ตรวจไฟล์เอฟเฟกต์ .fx.json + bind.json (ใช้ร่วมกัน: node tools/fx-check.js และหน้าสตูดิโอ studio/)
// fxLint(fx, schema, ctx) → [{lv:'err'|'warn', at:'layer.field', msg}] • ctx: {names:Set, models:Set, flips:Set, sounds:Set}
// fxLintBind(bind, schema, ctx) → เหมือนกัน • ctx.events = Set ชื่อ efx ที่มีในโค้ด (ว่าง = ไม่ตรวจชื่อ)
(function (root) {
  const EXPR = /^[\w\s.+\-*/(),]*$/, COL = /^(#[0-9a-fA-F]{6}|\$(core|hi|main|deep|light))$/;
  const isCurve = v => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).some(k => k.trim() !== '' && !isNaN(+k));
  const EXTRA = new Set(['mute', 'note', 'solo']);
  function checkVal(spec, v, at, out, schema) {
    const bad = m => out.push({ lv: 'err', at, msg: m });
    if (v === undefined) return;
    if (isCurve(v)) {
      if (!spec.curve) return bad('ฟิลด์นี้ใช้เส้นโค้งไม่ได้ (ใส่ตัวเลขเดียว)');
      for (const k of Object.keys(v)) { if (k === 'ease') { if (!['in', 'out', 'inout', 'step', 'linear'].includes(v.ease)) bad('ease ต้องเป็น in/out/inout/step'); continue; }
        if (k === 'x') continue; const t = +k; if (isNaN(t) || t < 0 || t > 1) bad(`จุดเส้นโค้ง "${k}" ต้องอยู่ระหว่าง 0 ถึง 1`); }
      return;
    }
    switch (spec.type) {
      case 'num': case 'int':
        if (typeof v === 'number') { if (spec.min !== undefined && (v < spec.min || v > spec.max)) out.push({ lv: 'warn', at, msg: `${v} อยู่นอกช่วงแนะนำ ${spec.min}–${spec.max}` }); return; }
        if (typeof v === 'string') { if (!EXPR.test(v)) bad(`สูตร "${v}" มีตัวอักษรที่ไม่อนุญาต`); return; }
        if (Array.isArray(v) && v.length === 2) { if (!spec.range) bad('ฟิลด์นี้สุ่มช่วง [min,max] ไม่ได้'); return; }
        return bad('ต้องเป็นตัวเลข / สูตร' + (spec.range ? ' / [min,max]' : '') + (spec.curve ? ' / เส้นโค้ง' : ''));
      case 'col': if (typeof v !== 'string' || !COL.test(v)) bad(`สี "${v}" ต้องเป็น #rrggbb หรือ $core $hi $main $deep $light`); return;
      case 'bool': if (typeof v !== 'boolean') bad('ต้องเป็น true/false'); return;
      case 'str': if (typeof v !== 'string') bad('ต้องเป็นข้อความ'); return;
      case 'enum': { const list = Array.isArray(spec.of) ? spec.of : spec.of === 'types' ? Object.keys(schema.types) : schema[spec.of] || []; if (!list.includes(v)) bad(`"${v}" ไม่มีในตัวเลือก: ${list.join(', ')}`); return; }
      case 'vec3': if (typeof v === 'number' || typeof v === 'string') return; if (!Array.isArray(v) || v.length !== 3) bad('ต้องเป็น [x,y,z]'); return;
      case 'list': if (!Array.isArray(v)) bad('ต้องเป็นรายการ [...]'); return;
      case 'obj': case 'params': if (typeof v !== 'object' || Array.isArray(v)) bad('ต้องเป็น {...}'); return;
    }
  }
  function num(v, d) { return typeof v === 'number' ? v : Array.isArray(v) && typeof v[1] === 'number' ? v[1] : isCurve(v) ? Math.max(...Object.keys(v).filter(k => !isNaN(+k)).map(k => typeof v[k] === 'number' ? v[k] : 0)) : d; }
  function fxLint(fx, schema, ctx) {
    ctx = ctx || {}; const out = [], S = schema;
    if (!fx || typeof fx !== 'object') return [{ lv: 'err', at: '', msg: 'ไฟล์ต้องเป็น JSON object' }];
    for (const k of Object.keys(fx)) if (!S.file[k] && k !== 'name') out.push({ lv: 'warn', at: k, msg: 'ฟิลด์ระดับไฟล์ที่ไม่รู้จัก (สะกดผิด?)' });
    for (const k in S.file) if (k !== 'layers') checkVal(S.file[k], fx[k], k, out, S);
    if (fx.v !== undefined && fx.v !== 1) out.push({ lv: 'err', at: 'v', msg: 'รองรับเฉพาะ v: 1' });
    if (!Array.isArray(fx.layers) || !fx.layers.length) { out.push({ lv: 'err', at: 'layers', msg: 'ต้องมีชั้นอย่างน้อย 1 ชั้น' }); return out; }
    const ids = new Set(); let lights = 0, end = 0;
    fx.layers.forEach((L, i) => {
      const at = (L && L.id) || '#' + i, T = L && S.types[L.t];
      if (!L || typeof L !== 'object') return out.push({ lv: 'err', at, msg: 'ชั้นต้องเป็น object' });
      if (!L.id) out.push({ lv: 'err', at, msg: 'ชั้นต้องมี id' }); else if (ids.has(L.id)) out.push({ lv: 'err', at, msg: 'id ซ้ำ' }); else ids.add(L.id);
      if (!T) return out.push({ lv: 'err', at: at + '.t', msg: `ชนิดชั้น "${L.t}" ไม่มี — ใช้: ${Object.keys(S.types).join(', ')}` });
      for (const k of Object.keys(L)) { const sp = S.common[k] || T.fields[k]; if (!sp) { if (!EXTRA.has(k)) out.push({ lv: 'warn', at: at + '.' + k, msg: `ชั้น ${L.t} ไม่มีฟิลด์นี้ (สะกดผิด?)` }); continue; } checkVal(sp, L[k], at + '.' + k, out, S); }
      const g = k => L[k] !== undefined ? L[k] : (T.fields[k] || S.common[k] || {}).def;
      const tEnd = num(g('at'), 0) + num(g('life'), 0.4); end = Math.max(end, tEnd);
      if (tEnd > 10 && !g('loop')) out.push({ lv: 'warn', at, msg: `จบที่ ${tEnd.toFixed(2)} วิ — ยาวเกิน 10 วิ (ใช้ loop:true ถ้าเป็นออร่า)` });
      // งบ / ความอ่านออก (VFX.md §1.4–1.5, §6)
      const W = m => out.push({ lv: 'warn', at, msg: m });
      if (L.t === 'emit') { const b = num(g('burst'), 0) * (fx.k || 1); if (b > 80) W(`burst ${Math.round(b)} เม็ด เกินงบ (≤ 80 ต่อครั้ง)`); if (num(g('rate'), 0) > 200) W('rate เกิน 200 เม็ด/วิ'); if (g('from') === 'mesh' && !fx.layers.some(q => q.id === g('of') && q.t === 'mesh')) out.push({ lv: 'err', at: at + '.of', msg: 'from:"mesh" ต้องชี้ไปที่ชั้น mesh (of)' }); }
      if (L.t === 'light') { lights++; if (num(g('int'), 2) > 2.5) W(`ไฟจุด int ${num(g('int'), 2)} แรงเกิน (≤ 2.5) — พื้นจะสว่างจ้า`); }
      if (L.t === 'flash' && num(g('size'), 2.5) > 6) W('แฟลชใหญ่เกิน 6 ม. — เสี่ยงจอขาว');
      if (L.t === 'halo' && num(g('size'), 5) > 14) W('ฮาโลใหญ่เกิน 14 ม. — เสี่ยงจอขาว');
      if (L.t === 'screen') { if (num(g('flash'), 0) > 0.06) W('แฟลชทั้งจอเกิน 0.06 — สว่างทั้งจอเร็วมาก'); if (num(g('shake'), 0) > 10) W('จอสั่นเกิน 10'); if (num(g('radial'), 0) > 0 && !g('own')) W('เบลอพุ่งเข้าจุด (radial) ควรใส่ own:true (เฉพาะของเรา)'); }
      if (L.t === 'mesh') { const sh = g('shape'); if (sh === 'glb' && ctx.models && !ctx.models.has(g('glb'))) out.push({ lv: 'err', at: at + '.glb', msg: `ไม่มีโมเดล "${g('glb')}" ใน assets/manifest.json` });
        if (g('mat') === 'flip' && ctx.flips && !ctx.flips.has(g('tex'))) out.push({ lv: 'err', at: at + '.tex', msg: `ไม่มีภาพ flipbook "${g('tex')}" (manifest fx / ptex)` });
        if (num(g('scale'), 1) > 15 && ['energy', 'glow', 'fire'].includes(g('mat'))) W('รูปทรงเรืองแสงใหญ่เกิน 15 ม. — เสี่ยงบังจอ'); }
      if (L.t === 'use') { if (!g('fx')) out.push({ lv: 'err', at: at + '.fx', msg: 'ต้องใส่ชื่อเอฟเฟกต์' }); else if (ctx.self && g('fx') === ctx.self) out.push({ lv: 'err', at: at + '.fx', msg: 'ใส่เอฟเฟกต์ตัวเองซ้อนในตัวเองไม่ได้ (วนไม่จบ)' }); else if (ctx.names && !ctx.names.has(g('fx'))) out.push({ lv: 'err', at: at + '.fx', msg: `ไม่มีไฟล์ assets/fx/${g('fx')}.fx.json` }); }
      if (L.t === 'trail' && g('of') && !fx.layers.some(q => q.id === g('of'))) out.push({ lv: 'err', at: at + '.of', msg: `ไม่มีชั้น "${g('of')}"` });
      if (L.t === 'sound' && ctx.sounds && !ctx.sounds.has(g('name'))) W(`ไม่มีเสียงชื่อ "${g('name')}" (ดู SFXN ใน js/18-audio.js)`);
    });
    if (lights > 3) out.push({ lv: 'warn', at: 'layers', msg: `ไฟจุด ${lights} ดวง — เกม มีพร้อมกันได้ 6 ดวงทั้งฉาก ใช้ไม่เกิน 2–3` });
    if (fx.dur && end > fx.dur + 0.01) out.push({ lv: 'warn', at: 'dur', msg: `ชั้นสุดท้ายจบที่ ${end.toFixed(2)} วิ แต่ dur = ${fx.dur}` });
    return out;
  }
  function fxLintBind(bind, schema, ctx) {
    ctx = ctx || {}; const out = [];
    for (const key of Object.keys(bind || {})) {
      if (!/^[a-z0-9_]+(:[a-z0-9_]+)?$/i.test(key)) out.push({ lv: 'err', at: key, msg: 'คีย์ต้องเป็น efx:<ชื่อ> หรือ <k>:<t> หรือ <k>' });
      if (key.startsWith('efx:') && ctx.events && ctx.events.size && !ctx.events.has(key.slice(4))) out.push({ lv: 'warn', at: key, msg: `ไม่เจอ efx "${key.slice(4)}" ในโค้ดฝั่ง host (สะกดผิด?)` });
      for (const b of [].concat(bind[key])) {
        if (!b || !b.fx) { out.push({ lv: 'err', at: key, msg: 'ต้องมี fx' }); continue; }
        if (ctx.names && !ctx.names.has(b.fx)) out.push({ lv: 'err', at: key, msg: `ไม่มีไฟล์ assets/fx/${b.fx}.fx.json` });
        if (b.mode && !['add', 'replace'].includes(b.mode)) out.push({ lv: 'err', at: key, msg: 'mode ต้องเป็น add หรือ replace' });
        for (const k of Object.keys(b)) if (!['fx', 'mode', 'p', 's', 'pal', 'follow', 'note'].includes(k)) out.push({ lv: 'warn', at: key + '.' + k, msg: 'ฟิลด์ที่ไม่รู้จัก' });
      }
    }
    return out;
  }
  const api = { fxLint, fxLintBind };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FXLINT = api;
})(typeof window !== 'undefined' ? window : globalThis);
