# เซิร์ฟเวอร์ทดสอบในเครื่อง (ใช้แทน python -m http.server ได้เลย): python tools/serve.py [พอร์ต=8765]
# เสิร์ฟไฟล์ทั้งโฟลเดอร์เหมือนเดิม + ช่องทางสำหรับ VFX Studio (studio.html):
#   GET  /api/fx-list               → รายชื่อเอฟเฟกต์ + โมเดล (mesh) + ภาพ (tex) ทั้งหมด + เวลาแก้ล่าสุด (ไลบรารี / โหลดใหม่อัตโนมัติเมื่อไฟล์เปลี่ยน)
#   POST /api/save?path=<ไฟล์>      → บันทึกไฟล์ (อนุญาตเฉพาะ assets/fx/**.fx.json, bind.json, mesh/<ชื่อ>.mesh.json, tex/<ชื่อ>.tex.json|.png, vol/<ชื่อ>.vol.json|.bin, assets/vfx/<ชื่อ>.glb|.png) แล้วรัน fx-check
#   POST /api/shot?name=<ชื่อ>      → เก็บภาพ (data URL หรือไบต์ PNG/JPEG) ลง shots/<ชื่อ>.png|.jpg (git-ignore) ให้ Claude เปิดดูด้วย Read
#   GET/POST /api/bugs              → โน้ตปัญหา (bugs.html): bugs/bugs.json + เขียน bugs/BUGS.md ให้ Claude อ่าน + ลบรูปที่ไม่ใช้แล้ว
#   POST /api/bug-img?name=<ชื่อ>   → เก็บรูปของโน้ตลง bugs/img/<ชื่อ>.png|.jpg
#   GET/POST /api/sb                → สตอรี่บอร์ด VFX (storyboard.html): storyboard/boards.json + เขียน storyboard/sb-<id>.md + STORYBOARDS.md ให้ Claude อ่าน
#   POST /api/sb-img?name=<ชื่อ>    → เก็บภาพร่าง/รูปตัวอย่างลง storyboard/img/<ชื่อ>.png|.jpg
# ฟังเฉพาะ 127.0.0.1 (เครื่องตัวเองเท่านั้น)
import base64, json, os, re, subprocess, sys, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FXD = os.path.join(ROOT, 'assets', 'fx')
SAVE_OK = [re.compile(r'^assets/fx/[a-z0-9_\-/]+\.fx\.json$'), re.compile(r'^assets/fx/bind\.json$'), re.compile(r'^assets/vfx/[a-z0-9_\-]+\.(glb|png)$'),
           re.compile(r'^assets/fx/mesh/[a-z0-9_\-]+\.mesh\.json$'), re.compile(r'^assets/fx/tex/[a-z0-9_\-]+\.(tex\.json|png)$'),
           re.compile(r'^assets/fx/vol/[a-z0-9_\-]+\.(vol\.json|bin)$')]

def asset_list(sub, ext):
    out = {}
    d = os.path.join(FXD, sub)
    if not os.path.isdir(d):
        return out
    for f in os.listdir(d):
        if not f.endswith(ext):
            continue
        p = os.path.join(d, f); n = f[:-len(ext)]
        try:
            j = json.load(open(p, encoding='utf-8'))
            e = {'t': os.path.getmtime(p), 'desc': j.get('desc', '')}
            if sub == 'tex':
                png = os.path.join(d, n + '.png')
                e.update({'gen': j.get('gen', ''), 'kind': j.get('kind', ''), 'png_t': os.path.getmtime(png) if os.path.exists(png) else 0})
            elif sub == 'vol':
                b = os.path.join(d, n + '.bin')
                e.update({'mode': j.get('mode', ''), 'frames': j.get('frames', 0), 'bytes': os.path.getsize(b) if os.path.exists(b) else 0})
            else:
                e.update({'mat': j.get('mat', ''), 'n': len(j.get('parts', []))})
            out[n] = e
        except Exception as ex:
            out[n] = {'t': os.path.getmtime(p), 'err': str(ex)}
    return out

BUGD = os.path.join(ROOT, 'bugs')
BUG_SEV = {'high': '🔴 ด่วน', 'mid': '🟠 ปานกลาง', 'low': '🟢 เล็กน้อย'}
BUG_ST = {'open': '⬜ ยังไม่แก้', 'fixed': '✅ แก้แล้ว', 'wont': '➖ ไม่แก้'}

def bugs_load():
    p = os.path.join(BUGD, 'bugs.json')
    if not os.path.exists(p):
        return {'next': 1, 'items': []}
    return json.load(open(p, encoding='utf-8'))

def bugs_md(db):
    L = ['# โน้ตปัญหา (Bug Notes)', '',
         '> เขียนอัตโนมัติจาก `bugs.html` (ผ่าน `tools/serve.py`) — อย่าแก้ไฟล์นี้ตรง ๆ, แก้ `bugs/bugs.json` แทน.',
         '> **Claude:** อ่านโน้ตที่ยังไม่แก้ → เปิดรูปด้วย Read → แก้ → ใน `bugs/bugs.json` ตั้ง `status:"fixed"` + เขียน `reply` (ภาษาไทยง่าย ๆ ว่าแก้อะไร) แล้วรัน `python tools/serve.py --bugs-md` เพื่อเขียนไฟล์นี้ใหม่.', '']
    items = sorted(db.get('items', []), key=lambda b: (b.get('status') != 'open', -b.get('id', 0)))
    if not items:
        L.append('_ยังไม่มีโน้ต_')
    for b in items:
        L.append(f"## #{b.get('id')} {b.get('title') or '(ไม่มีหัวข้อ)'}")
        L.append(f"- สถานะ: {BUG_ST.get(b.get('status'), b.get('status'))} • ความสำคัญ: {BUG_SEV.get(b.get('sev'), b.get('sev'))} • เจอที่: {b.get('where') or '-'} • จด: {b.get('created', '')[:16].replace('T', ' ')}")
        L.append('')
        if b.get('text'):
            L += [b['text'].strip(), '']
        for im in b.get('imgs', []):
            L.append(f"- รูป: `{im}`")
        if b.get('imgs'):
            L.append('')
        if b.get('reply'):
            L += [f"> **Claude ตอบ:** {b['reply'].strip()}", '']
    return '\n'.join(L) + '\n'

def bugs_save(db):
    os.makedirs(os.path.join(BUGD, 'img'), exist_ok=True)
    with open(os.path.join(BUGD, 'bugs.json'), 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=1)
    with open(os.path.join(BUGD, 'BUGS.md'), 'w', encoding='utf-8') as f:
        f.write(bugs_md(db))
    used = {os.path.basename(i) for b in db.get('items', []) for i in b.get('imgs', [])}
    d = os.path.join(BUGD, 'img')
    for f in os.listdir(d):
        if f not in used and time.time() - os.path.getmtime(os.path.join(d, f)) > 120:
            os.remove(os.path.join(d, f))

SBD = os.path.join(ROOT, 'storyboard')
SB_KIND = {'charge': 'ชาร์จ / เตรียม (anticipation)', 'cast': 'ปล่อย / ร่าย (release)', 'travel': 'พุ่ง / เคลื่อนที่ (travel)',
           'impact': 'กระทบ (impact)', 'linger': 'ค้าง / พื้นที่ (linger)', 'fade': 'จางหาย (dissipate)', 'other': 'อื่น ๆ'}
SB_ST = {'draft': '✏️ กำลังร่าง', 'ready': '📤 พร้อมให้ Claude ทำ', 'wip': '🔧 Claude กำลังทำ', 'review': '👀 รอผู้ใช้ดูผล', 'done': '✅ ผ่านแล้ว'}
SB_POW = ['', 'เบามาก', 'เบา', 'ปานกลาง', 'แรง', 'สุดพลัง']

def sb_load():
    p = os.path.join(SBD, 'boards.json')
    if not os.path.exists(p):
        return {'next': 1, 'items': []}
    return json.load(open(p, encoding='utf-8'))

def sb_times(b):  # เวลาเริ่ม/จบของแต่ละช่วง = ต่อจากช่วงก่อน ลบ overlap (เหมือนใน storyboard.html)
    t, out = 0.0, []
    for s in b.get('shots', []):
        st = max(0.0, t - float(s.get('overlap') or 0)); t = st + float(s.get('dur') or 0); out.append((st, t))
    return out

def sb_md(b):
    f = lambda v: ('%.2f' % float(v)).rstrip('0').rstrip('.') or '0'
    pw = lambda s: SB_POW[max(1, min(5, int(s.get('power') or 3)))]
    T = sb_times(b); tot = max([e for _, e in T] or [0])
    L = [f"# สตอรี่บอร์ด VFX #{b.get('id')} — {b.get('title') or '(ไม่มีชื่อ)'}", '',
         '> เขียนอัตโนมัติจาก `storyboard.html` — อย่าแก้ไฟล์นี้ตรง ๆ, แก้ `storyboard/boards.json` แล้วรัน `python tools/serve.py --sb-md`.',
         '> **Claude:** ทำตาม `VFX-STUDIO-CLAUDE.md` §4b. เปิดภาพร่าง + รูปตัวอย่างทุกรูปด้วย Read ก่อนเริ่ม (ภาพร่าง = ความตั้งใจหลัก; ตัวขาวซ้าย = ผู้ร่ายหันขวา, ตัวแดงขวา = เป้า ห่าง ~5 ตัว, ขีดบนพื้น = 1 ตัวละคร).', '',
         f"- สาย: {b.get('who') or '-'} • ปุ่ม/ชื่อในเกม: {b.get('skill') or '-'} • สถานะ: {SB_ST.get(b.get('status'), b.get('status'))}",
         f"- ความยาวรวม: **{f(tot)} วินาที** • {len(T)} ช่วง",
         f"- ความรู้สึก: {', '.join(b.get('mood') or []) or '-'}",
         f"- สีหลัก: {' '.join('`' + c + '`' for c in b.get('colors') or []) or '-'}"]
    if b.get('fx'):
        L.append(f"- ไฟล์เอฟเฟกต์: `assets/fx/{b['fx']}.fx.json`")
    L.append('')
    if (b.get('overview') or '').strip():
        L += ['## ภาพรวม', '', b['overview'].strip(), '']
    if b.get('refs'):
        L += ['รูปตัวอย่างรวม:'] + [f"- `{r}`" for r in b['refs']] + ['']
    L += ['## ไทม์ไลน์', '', '| # | ช่วง | เวลา (วิ) | ที่ | ขนาด (เท่าตัวละคร) | แรง |', '|---|---|---|---|---|---|']
    for i, (s, (st, en)) in enumerate(zip(b.get('shots', []), T)):
        L.append(f"| {i+1} | {s.get('name') or SB_KIND.get(s.get('kind'), '')} | {f(st)}–{f(en)} | {s.get('where') or '-'} | {f(s.get('size') or 1)} | {pw(s)} |")
    L.append('')
    for i, (s, (st, en)) in enumerate(zip(b.get('shots', []), T)):
        L.append(f"## ช่วง {i+1}: {SB_KIND.get(s.get('kind'), s.get('kind'))}{' — ' + s['name'] if s.get('name') else ''}")
        ov = float(s.get('overlap') or 0)
        L.append(f"- เวลา: {f(st)}–{f(en)} วิ (นาน {f(s.get('dur') or 0)} วิ{', เริ่มซ้อนช่วงก่อน ' + f(ov) + ' วิ' if ov > 0 else ''})")
        L.append(f"- เกิดที่: {s.get('where') or '-'} • ขนาด: {f(s.get('size') or 1)} เท่าตัวละคร • ความแรง: {pw(s)} ({s.get('power', 3)}/5)")
        for k, th in (('shapes', 'รูปทรง'), ('motion', 'การเคลื่อนไหว'), ('camera', 'กล้อง/จอ')):
            if s.get(k):
                L.append(f"- {th}: {', '.join(s[k])}")
        if s.get('colors'):
            L.append(f"- สี: {' '.join('`' + c + '`' for c in s['colors'])}")
        if s.get('sketch'):
            L.append(f"- ภาพร่าง: `{s['sketch']}`")
        for r in s.get('refs', []):
            L.append(f"- รูปตัวอย่าง: `{r}`")
        if s.get('result'):
            L.append(f"- ผลที่ทำแล้ว: `{s['result']}`")
        L.append('')
        if (s.get('text') or '').strip():
            L += [s['text'].strip(), '']
        if s.get('note'):
            L += [f"> **Claude:** {s['note'].strip()}", '']
    if b.get('reply'):
        L += ['## Claude ตอบ', '', b['reply'].strip(), '']
    return '\n'.join(L) + '\n'

def sb_save(db):
    os.makedirs(os.path.join(SBD, 'img'), exist_ok=True)
    with open(os.path.join(SBD, 'boards.json'), 'w', encoding='utf-8') as fh:
        json.dump(db, fh, ensure_ascii=False, indent=1)
    keep = set()
    for b in db.get('items', []):
        keep.add(f"sb-{b.get('id')}.md")
        with open(os.path.join(SBD, f"sb-{b.get('id')}.md"), 'w', encoding='utf-8') as fh:
            fh.write(sb_md(b))
    idx = ['# สตอรี่บอร์ด VFX ทั้งหมด', '', '> จาก `storyboard.html`. Claude: เปิดไฟล์ `sb-<id>.md` ของเรื่องที่ผู้ใช้บอก.', '']
    for b in sorted(db.get('items', []), key=lambda x: -x.get('id', 0)):
        idx.append(f"- [#{b.get('id')} {b.get('title') or '(ไม่มีชื่อ)'}](sb-{b.get('id')}.md) — {b.get('who') or '-'} • {len(b.get('shots', []))} ช่วง • {SB_ST.get(b.get('status'), '')}")
    with open(os.path.join(SBD, 'STORYBOARDS.md'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(idx) + '\n')
    for fn in os.listdir(SBD):  # สตอรี่บอร์ดที่ถูกลบ → ลบ .md ด้วย
        if re.match(r'^sb-\d+\.md$', fn) and fn not in keep:
            os.remove(os.path.join(SBD, fn))
    used = set()
    for b in db.get('items', []):
        used |= {os.path.basename(i) for i in b.get('refs', [])}
        for s in b.get('shots', []):
            used |= {os.path.basename(i) for i in s.get('refs', []) + [s.get('sketch') or '', s.get('result') or ''] if i}
    d = os.path.join(SBD, 'img')
    for fn in os.listdir(d):
        if fn not in used and time.time() - os.path.getmtime(os.path.join(d, fn)) > 120:
            os.remove(os.path.join(d, fn))

def fx_list():
    out = {}
    for d, _, fs in os.walk(FXD):
        for f in fs:
            if f.endswith('.fx.json'):
                p = os.path.join(d, f)
                n = os.path.relpath(p, FXD).replace('\\', '/')[:-8]
                try:
                    j = json.load(open(p, encoding='utf-8'))
                    out[n] = {'t': os.path.getmtime(p), 'desc': j.get('desc', ''), 'pal': j.get('pal', ''), 'tags': j.get('tags', []), 'n': len(j.get('layers', []))}
                except Exception as e:
                    out[n] = {'t': os.path.getmtime(p), 'err': str(e)}
    b = os.path.join(FXD, 'bind.json')
    return {'fx': out, 'mesh': asset_list('mesh', '.mesh.json'), 'tex': asset_list('tex', '.tex.json'), 'vol': asset_list('vol', '.vol.json'), 'bind_t': os.path.getmtime(b) if os.path.exists(b) else 0, 'now': time.time()}

class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    def log_message(self, fmt, *args):
        if '/api/' in (args[0] if args else ''):
            super().log_message(fmt, *args)
    def _json(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code); self.send_header('Content-Type', 'application/json; charset=utf-8'); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        u = urlparse(self.path)
        if u.path == '/api/fx-list':
            return self._json(200, fx_list())
        if u.path == '/api/bugs':
            return self._json(200, bugs_load())
        if u.path == '/api/sb':
            return self._json(200, sb_load())
        return super().do_GET()
    def _body(self):
        n = int(self.headers.get('Content-Length', 0))
        return self.rfile.read(n)
    def do_POST(self):
        u = urlparse(self.path); q = parse_qs(u.query)
        if u.path == '/api/save':
            rel = (q.get('path', [''])[0]).replace('\\', '/').lstrip('/')
            if '..' in rel or not any(r.match(rel) for r in SAVE_OK):
                return self._json(403, {'ok': False, 'err': 'บันทึกได้เฉพาะ assets/fx/*.fx.json, assets/fx/bind.json, assets/vfx/*.glb|png'})
            data = self._body()
            if rel.endswith('.json'):
                try: json.loads(data.decode('utf-8'))
                except Exception as e: return self._json(400, {'ok': False, 'err': 'JSON ผิดรูปแบบ: ' + str(e)})
            p = os.path.join(ROOT, *rel.split('/'))
            os.makedirs(os.path.dirname(p), exist_ok=True)
            with open(p, 'wb') as f: f.write(data)
            chk = ''
            try:
                r = subprocess.run(['node', os.path.join(ROOT, 'tools', 'fx-check.js'), '--quiet'], cwd=ROOT, capture_output=True, text=True, encoding='utf-8', timeout=30)
                chk = (r.stdout + r.stderr).strip()
            except Exception as e:
                chk = 'fx-check ไม่ได้รัน (ไม่มี node?): ' + str(e)
            return self._json(200, {'ok': True, 'path': rel, 'check': chk})
        if u.path == '/api/shot':
            name = re.sub(r'[^a-zA-Z0-9_\-]', '_', q.get('name', ['shot'])[0])[:60] or 'shot'
            data = self._body(); ext = 'png'
            if data[:5] == b'data:':
                head, b64 = data.split(b',', 1); ext = 'jpg' if b'jpeg' in head else 'png'; data = base64.b64decode(b64)
            elif data[:3] == b'\xff\xd8\xff': ext = 'jpg'
            d = os.path.join(ROOT, 'shots'); os.makedirs(d, exist_ok=True)
            p = os.path.join(d, name + '.' + ext)
            with open(p, 'wb') as f: f.write(data)
            return self._json(200, {'ok': True, 'path': 'shots/' + name + '.' + ext})
        if u.path == '/api/bugs':
            try:
                db = json.loads(self._body().decode('utf-8'))
                assert isinstance(db.get('items'), list)
            except Exception as e:
                return self._json(400, {'ok': False, 'err': 'ข้อมูลผิดรูปแบบ: ' + str(e)})
            bugs_save(db)
            return self._json(200, {'ok': True})
        if u.path == '/api/sb':
            try:
                db = json.loads(self._body().decode('utf-8'))
                assert isinstance(db.get('items'), list)
            except Exception as e:
                return self._json(400, {'ok': False, 'err': 'ข้อมูลผิดรูปแบบ: ' + str(e)})
            sb_save(db)
            return self._json(200, {'ok': True})
        if u.path in ('/api/bug-img', '/api/sb-img'):
            name = re.sub(r'[^a-zA-Z0-9_\-]', '_', q.get('name', ['img'])[0])[:60] or 'img'
            data = self._body(); ext = 'png'
            if data[:5] == b'data:':
                head, b64 = data.split(b',', 1); ext = 'jpg' if b'jpeg' in head else 'png'; data = base64.b64decode(b64)
            elif data[:3] == b'\xff\xd8\xff': ext = 'jpg'
            sub = 'bugs' if u.path == '/api/bug-img' else 'storyboard'
            d = os.path.join(ROOT, sub, 'img'); os.makedirs(d, exist_ok=True)
            with open(os.path.join(d, name + '.' + ext), 'wb') as f: f.write(data)
            return self._json(200, {'ok': True, 'path': sub + '/img/' + name + '.' + ext})
        return self._json(404, {'ok': False, 'err': 'ไม่มีช่องทางนี้'})

if __name__ == '__main__':
    if '--bugs-md' in sys.argv:  # Claude แก้ bugs/bugs.json เองแล้ว → เขียน BUGS.md ใหม่
        bugs_save(bugs_load()); print('bugs/BUGS.md updated'); sys.exit()
    if '--sb-md' in sys.argv:  # Claude แก้ storyboard/boards.json เองแล้ว → เขียน sb-<id>.md ใหม่
        sb_save(sb_load()); print('storyboard/*.md updated'); sys.exit()
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print(f'Fantas Stick: http://localhost:{port}/  •  VFX Studio: http://localhost:{port}/studio.html  •  Bug Notes: http://localhost:{port}/bugs.html  •  Storyboard: http://localhost:{port}/storyboard.html')
    ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
