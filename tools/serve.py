# เซิร์ฟเวอร์ทดสอบในเครื่อง (ใช้แทน python -m http.server ได้เลย): python tools/serve.py [พอร์ต=8765]
# เสิร์ฟไฟล์ทั้งโฟลเดอร์เหมือนเดิม + ช่องทางสำหรับ VFX Studio (studio.html):
#   GET  /api/fx-list               → รายชื่อไฟล์เอฟเฟกต์ทั้งหมด + เวลาแก้ล่าสุด (ไลบรารี / โหลดใหม่อัตโนมัติเมื่อไฟล์เปลี่ยน)
#   POST /api/save?path=<ไฟล์>      → บันทึกไฟล์ (อนุญาตเฉพาะ assets/fx/**.fx.json, assets/fx/bind.json, assets/vfx/<ชื่อ>.glb|.png) แล้วรัน fx-check
#   POST /api/shot?name=<ชื่อ>      → เก็บภาพ (data URL หรือไบต์ PNG/JPEG) ลง shots/<ชื่อ>.png|.jpg (git-ignore) ให้ Claude เปิดดูด้วย Read
# ฟังเฉพาะ 127.0.0.1 (เครื่องตัวเองเท่านั้น)
import base64, json, os, re, subprocess, sys, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FXD = os.path.join(ROOT, 'assets', 'fx')
SAVE_OK = [re.compile(r'^assets/fx/[a-z0-9_\-/]+\.fx\.json$'), re.compile(r'^assets/fx/bind\.json$'), re.compile(r'^assets/vfx/[a-z0-9_\-]+\.(glb|png)$')]

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
    return {'fx': out, 'bind_t': os.path.getmtime(b) if os.path.exists(b) else 0, 'now': time.time()}

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
        return self._json(404, {'ok': False, 'err': 'ไม่มีช่องทางนี้'})

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print(f'Fantas Stick: http://localhost:{port}/  •  VFX Studio: http://localhost:{port}/studio.html')
    ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
