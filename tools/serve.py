# เซิร์ฟเวอร์ทดสอบในเครื่อง (ใช้แทน python -m http.server ได้เลย): python tools/serve.py [พอร์ต=8765]
# เสิร์ฟไฟล์ทั้งโฟลเดอร์เหมือนเดิม + ช่องทางสำหรับ VFX Studio (studio.html):
#   GET  /api/fx-list               → รายชื่อเอฟเฟกต์ + โมเดล (mesh) + ภาพ (tex) ทั้งหมด + เวลาแก้ล่าสุด (ไลบรารี / โหลดใหม่อัตโนมัติเมื่อไฟล์เปลี่ยน)
#   POST /api/save?path=<ไฟล์>      → บันทึกไฟล์ (อนุญาตเฉพาะ assets/fx/**.fx.json, bind.json, mesh/<ชื่อ>.mesh.json, tex/<ชื่อ>.tex.json|.png, vol/<ชื่อ>.vol.json|.bin, assets/vfx/<ชื่อ>.glb|.png) แล้วรัน fx-check
#   POST /api/shot?name=<ชื่อ>      → เก็บภาพ (data URL หรือไบต์ PNG/JPEG) ลง shots/<ชื่อ>.png|.jpg (git-ignore) ให้ Claude เปิดดูด้วย Read
#   GET/POST /api/bugs              → โน้ตปัญหา (bugs.html): bugs/bugs.json + เขียน bugs/BUGS.md ให้ Claude อ่าน + ลบรูปที่ไม่ใช้แล้ว
#   POST /api/bug-img?name=<ชื่อ>   → เก็บรูปของโน้ตลง bugs/img/<ชื่อ>.png|.jpg
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
        if u.path == '/api/bug-img':
            name = re.sub(r'[^a-zA-Z0-9_\-]', '_', q.get('name', ['img'])[0])[:60] or 'img'
            data = self._body(); ext = 'png'
            if data[:5] == b'data:':
                head, b64 = data.split(b',', 1); ext = 'jpg' if b'jpeg' in head else 'png'; data = base64.b64decode(b64)
            elif data[:3] == b'\xff\xd8\xff': ext = 'jpg'
            d = os.path.join(BUGD, 'img'); os.makedirs(d, exist_ok=True)
            with open(os.path.join(d, name + '.' + ext), 'wb') as f: f.write(data)
            return self._json(200, {'ok': True, 'path': 'bugs/img/' + name + '.' + ext})
        return self._json(404, {'ok': False, 'err': 'ไม่มีช่องทางนี้'})

if __name__ == '__main__':
    if '--bugs-md' in sys.argv:  # Claude แก้ bugs/bugs.json เองแล้ว → เขียน BUGS.md ใหม่
        bugs_save(bugs_load()); print('bugs/BUGS.md updated'); sys.exit()
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print(f'Fantas Stick: http://localhost:{port}/  •  VFX Studio: http://localhost:{port}/studio.html  •  Bug Notes: http://localhost:{port}/bugs.html')
    ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
