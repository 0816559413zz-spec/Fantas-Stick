# เซิร์ฟเวอร์ทดสอบในเครื่อง (ใช้แทน python -m http.server ได้เลย): python tools/serve.py [พอร์ต=8765]
# เสิร์ฟไฟล์ทั้งโฟลเดอร์เหมือนเดิม + ช่องทางสำหรับ VFX Studio (studio.html):
#   GET  /api/fx-list               → รายชื่อเอฟเฟกต์ + โมเดล (mesh) + ภาพ (tex) ทั้งหมด + เวลาแก้ล่าสุด (ไลบรารี / โหลดใหม่อัตโนมัติเมื่อไฟล์เปลี่ยน)
#   POST /api/save?path=<ไฟล์>      → บันทึกไฟล์ (อนุญาตเฉพาะ assets/tune.json, assets/hud/layout.json, assets/fx/**.fx.json, bind.json, mesh/<ชื่อ>.mesh.json, tex/<ชื่อ>.tex.json|.png, vol/<ชื่อ>.vol.json|.bin, assets/vfx/<ชื่อ>.glb|.png) แล้วรัน fx-check
#   POST /api/photo?name=<ชื่อ>     → โหมดถ่ายรูปในเกม (js/79-photo.js): PNG ลง photos/<ชื่อ>.png (git-ignored)
#   POST /api/shot?name=<ชื่อ>      → เก็บภาพ (data URL หรือไบต์ PNG/JPEG) ลง shots/<ชื่อ>.png|.jpg (git-ignore) ให้ Claude เปิดดูด้วย Read
#   GET/POST /api/bugs              → โน้ตปัญหา (bugs.html): bugs/bugs.json + เขียน bugs/BUGS.md ให้ Claude อ่าน + ลบรูปที่ไม่ใช้แล้ว
#   POST /api/bug-img?name=<ชื่อ>   → เก็บรูปของโน้ตลง bugs/img/<ชื่อ>.png|.jpg
#   GET/POST /api/reviews           → กระดานรอรีวิว (review.html): review/reviews.json + เขียน review/REVIEW.md ให้ Claude อ่าน (`--review-md` = เขียนใหม่)
#   POST /api/review-img?name=<ชื่อ> → เก็บรูปลง review/img/<ชื่อ>.png|.jpg
#   GET/POST /api/concepts          → คลัง Concept (concepts.html): concepts/concepts.json + เขียน concepts/CONCEPTS.md ให้ Claude อ่าน (`--concepts-md` = เขียนใหม่)
#   POST /api/concept-img?name=<ชื่อ> → เก็บรูป Ref/ผลลัพธ์ลง concepts/img/<ชื่อ>.png|.jpg
#   GET/POST /api/sb                → สตอรี่บอร์ด VFX (storyboard.html): storyboard/boards.json + เขียน storyboard/sb-<id>.md + STORYBOARDS.md ให้ Claude อ่าน
#   POST /api/sb-img?name=<ชื่อ>    → เก็บภาพร่าง/รูปตัวอย่างลง storyboard/img/<ชื่อ>.png|.jpg
#   POST /api/sb-rec?name=<ชื่อ>    → เก็บท่าตัวละครที่อัดจากเกม (studio/rec.js) ลง storyboard/rec/<ชื่อ>.json
#   POST /api/sb-sync               → ☁ ซิงก์สตอรี่บอร์ดกับเครื่องอื่นผ่าน GitHub (fetch → รวมรายบอร์ด → commit เฉพาะ storyboard/ → merge → push)
#   GET  /api/maps                  → รายชื่อแผนที่ (mapedit.html) ใน maps/
#   GET  /api/map?id=<id>           → ข้อมูลแผนที่ maps/<id>.json
#   POST /api/map?id=<id>           → บันทึก {map, md, png} → maps/<id>.json + <id>.md + <id>.png แล้วเขียน maps/MAPS.md (ให้ Claude อ่าน)
#   POST /api/map-del?id=<id>       → ย้ายแผนที่ไป maps/_deleted/ (กู้คืนได้)
#   POST /api/map-img?name=<ชื่อ>   → เก็บภาพอ้างอิงที่วางใต้แผนที่ลง maps/img/<ชื่อ>.png|.jpg
#   GET  /api/mb-list              → รายชื่อแผนที่จริงของ Map Builder (mapbuild.html) ใน maps/build/
#   GET/POST /api/mb?id=<id>        → อ่าน/บันทึกไฟล์ต้นฉบับ maps/build/<id>.json (รูปแบบ: guides/MAP-BUILDER.md)
#   POST /api/mb-export?id=<id>     → ส่งเข้าเกม: {data, glb(base64)} → assets/maps/<id>.json + .glb + เพิ่ม/ขยับเลข v ใน assets/manifest.json
#   GET  /api/mb-ver?id=<id>       → เลข v ของแผนที่: ในเครื่อง (manifest) / commit ล่าสุด / บน GitHub (origin/main, fetch ทุก 1 นาที)
#   POST /api/mb-publish?id=<id>    → commit + push เฉพาะไฟล์ของแผนที่นี้ (ต้นฉบับ + ห้อง prefab + assets/maps/<id>.* + รายการใน manifest) บน origin/main ด้วย index ชั่วคราว (&dry=1 = ไม่ push)
#   POST /api/mb-unexport?id=<id>   → ถอดแผนที่ออกจากเกม (ลบไฟล์ใน assets/maps + รายการใน manifest) เฉพาะแผนที่ที่มีต้นฉบับใน maps/build/
#   POST /api/mb-del?id=<id>        → ถอดออกจากเกม + ย้ายต้นฉบับไป maps/build/_deleted/
#   POST /api/mb-asset?name=<ชื่อ>&label=&cat=<หมวด, ไม่ใส่ = user> → เพิ่ม Asset เอง: เก็บ .glb ลง assets/mapkit/ + ลงทะเบียนใน assets/mapkit/kit.json (user)
#   GET  /api/sb-skills             → รายการสกิลจากโค้ดเกม (js/*.js: PATHS, PBASIC, defSpell) ให้ปุ่ม Import ของสตอรี่บอร์ด — อ่านสดทุกครั้ง ไม่มีไฟล์ค้าง
#   GET  /api/hud-designs / GET|POST /api/hud-design?id= {doc,png,md} / POST /api/hud-design-del?id= / POST /api/hud-design-img?name= → HUD Editor โหมดออกแบบ: huddesign/<id>.json|.jpg(.png)|.md + huddesign/HUDDESIGN.md
#   GET  /api/sketches              → รายชื่อสเก็ตช์ (sketch.html) ใน sketch/
#   GET/POST /api/sketch?id=<id>    → อ่าน/บันทึก {doc, png} → sketch/<id>.json + .png + .md แล้วเขียน sketch/SKETCH.md (ให้ Claude อ่าน)
#   POST /api/sketch-del?id=<id>    → ย้ายไป sketch/_deleted/ (กู้คืนได้) • POST /api/sketch-img?name=<ชื่อ> → เก็บรูปพื้นหลังลง sketch/img/
# ฟังเฉพาะ 127.0.0.1 (เครื่องตัวเองเท่านั้น)
import base64, json, os, re, subprocess, sys, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FXD = os.path.join(ROOT, 'assets', 'fx')
SAVE_OK = [re.compile(r'^assets/fx/[a-z0-9_\-/]+\.fx\.json$'), re.compile(r'^assets/fx/bind\.json$'), re.compile(r'^assets/vfx/[a-z0-9_\-]+\.(glb|png)$'),
           re.compile(r'^assets/fx/mesh/[a-z0-9_\-]+\.mesh\.json$'), re.compile(r'^assets/fx/tex/[a-z0-9_\-]+\.(tex\.json|png)$'),
           re.compile(r'^assets/fx/vol/[a-z0-9_\-]+\.(vol\.json|bin)$'), re.compile(r'^assets/tune\.json$'), re.compile(r'^assets/hud/layout\.json$')]   # HUD Editor (hudedit.html)

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
        return {'next': 1, 'rev': 0, 'items': []}
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

CPD = os.path.join(ROOT, 'concepts')
CP_ST = {'idea': '💡 ไอเดีย', 'ready': '📝 พรอมต์พร้อม', 'gen': '🖼 เจนแล้ว', 'pick': '⭐ ใช้เป็นแนวหลัก', 'drop': '❌ ไม่เอา'}

def cp_load():
    p = os.path.join(CPD, 'concepts.json')
    if not os.path.exists(p):
        return {'next': 1, 'items': []}
    return json.load(open(p, encoding='utf-8'))

def cp_md(db):
    L = ['# คลัง Concept (concepts.html)', '',
         '> เขียนอัตโนมัติจาก `concepts.html` (ผ่าน `tools/serve.py`) — อย่าแก้ตรง ๆ, แก้ `concepts/concepts.json` แล้วรัน `python tools/serve.py --concepts-md`.',
         '> **Claude:** นี่คือคลังภาพอ้างอิง + พรอมต์ที่ผู้ใช้เอาไปเจนรูป (ChatGPT) — เปิดรูปด้วย Read. สถานะ ⭐ = แนวทางที่ผู้ใช้เลือก. สไตล์งานหลัก = สีน้ำ.', '']
    order = {'pick': 0, 'gen': 1, 'ready': 2, 'idea': 3, 'drop': 4}
    for b in sorted(db.get('items', []), key=lambda b: (order.get(b.get('status'), 9), -b.get('id', 0))):
        L.append(f"## #{b.get('id')} {b.get('title') or '(ไม่มีหัวข้อ)'}")
        L.append(f"- สถานะ: {CP_ST.get(b.get('status'), b.get('status'))} • ชนิด: {b.get('kind') or '-'} • แท็ก: {b.get('tags') or '-'}")
        L.append('')
        if b.get('notes'):
            L += [b['notes'].strip(), '']
        for im in b.get('refs', []):
            L.append(f"- Ref: `{im}`")
        for im in b.get('results', []):
            L.append(f"- ผลลัพธ์: `{im}`")
        if b.get('refs') or b.get('results'):
            L.append('')
        if b.get('prompt'):
            L += ['**พรอมต์:**', '```', b['prompt'].strip(), '```', '']
    return chr(10).join(L) + chr(10)

def cp_save(db):
    os.makedirs(os.path.join(CPD, 'img'), exist_ok=True)
    with open(os.path.join(CPD, 'concepts.json'), 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=1)
    with open(os.path.join(CPD, 'CONCEPTS.md'), 'w', encoding='utf-8') as f:
        f.write(cp_md(db))
    used = {os.path.basename(i) for b in db.get('items', []) for i in b.get('refs', []) + b.get('results', [])}
    d = os.path.join(CPD, 'img')
    for f in os.listdir(d):
        if f not in used and time.time() - os.path.getmtime(os.path.join(d, f)) > 120:
            os.remove(os.path.join(d, f))

RVD = os.path.join(ROOT, 'review')
RV_ST = {'wait': '⏳ รอผู้ใช้รีวิว', 'ok': '✅ ผ่าน', 'change': '✏️ ขอแก้ (Claude ต้องทำ)', 'drop': '❌ ไม่เอา'}

def rv_load():
    p = os.path.join(RVD, 'reviews.json')
    if not os.path.exists(p):
        return {'next': 1, 'items': []}
    return json.load(open(p, encoding='utf-8'))

def rv_md(db):
    L = ['# กระดานรอรีวิว (Review Board)', '',
         '> เขียนอัตโนมัติจาก `review.html` (ผ่าน `tools/serve.py`) — อย่าแก้ไฟล์นี้ตรง ๆ, แก้ `review/reviews.json` แล้วรัน `python tools/serve.py --review-md`.',
         '> **Claude:** ทำเฉพาะหัวข้อสถานะ **✏️ ขอแก้** — อ่านความเห็นผู้ใช้ (`ความเห็นผู้ใช้`) + เปิดรูปด้วย Read → แก้ → ตั้ง `status:"wait"` + เขียน `reply` (ไทยสั้น ๆ ว่าแก้อะไร) เพื่อส่งกลับให้ผู้ใช้รีวิวใหม่. อย่าตั้ง `ok` เอง (ผู้ใช้เป็นคนกดผ่าน). งานที่ **⏳ รอ** = รอผู้ใช้ ไม่ต้องทำอะไร', '']
    order = {'change': 0, 'wait': 1, 'ok': 2, 'drop': 3}
    items = sorted(db.get('items', []), key=lambda b: (order.get(b.get('status'), 9), -b.get('id', 0)))
    if not items:
        L.append('_ยังไม่มีรายการ_')
    for b in items:
        L.append(f"## #{b.get('id')} {b.get('title') or '(ไม่มีหัวข้อ)'}")
        L.append(f"- สถานะ: {RV_ST.get(b.get('status'), b.get('status'))} • ชนิด: {b.get('kind') or '-'} • สาย/ส่วน: {b.get('who') or '-'}")
        L.append('')
        if b.get('text'):
            L += ['**วิธีดู / อะไรรอรีวิว:**', b['text'].strip(), '']
        for lk in b.get('links', []):
            L.append(f"- ลิงก์/ไฟล์: `{lk}`")
        for im in b.get('imgs', []):
            L.append(f"- รูป: `{im}`")
        if b.get('links') or b.get('imgs'):
            L.append('')
        if b.get('checks'):
            L.append('**เช็กลิสต์:**')
            for c in b['checks']:
                L.append(f"- [{'x' if c.get('ok') else ' '}] {c.get('t')}")
            L.append('')
        if b.get('feedback'):
            L += [f"> **ความเห็นผู้ใช้:** {b['feedback'].strip()}", '']
        if b.get('reply'):
            L += [f"> **Claude ตอบ:** {b['reply'].strip()}", '']
    return '\n'.join(L) + '\n'

def rv_save(db):
    os.makedirs(os.path.join(RVD, 'img'), exist_ok=True)
    with open(os.path.join(RVD, 'reviews.json'), 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=1)
    with open(os.path.join(RVD, 'REVIEW.md'), 'w', encoding='utf-8') as f:
        f.write(rv_md(db))
    used = {os.path.basename(i) for b in db.get('items', []) for i in b.get('imgs', [])}
    d = os.path.join(RVD, 'img')
    for f in os.listdir(d):
        if f not in used and time.time() - os.path.getmtime(os.path.join(d, f)) > 120:
            os.remove(os.path.join(d, f))

SBD = os.path.join(ROOT, 'storyboard')
SB_KIND = {'charge': 'ชาร์จ / เตรียม (anticipation)', 'cast': 'ปล่อย / ร่าย (release)', 'travel': 'พุ่ง / เคลื่อนที่ (travel)',
           'impact': 'กระทบ (impact)', 'linger': 'ค้าง / พื้นที่ (linger)', 'fade': 'จางหาย (dissipate)', 'other': 'อื่น ๆ'}
SB_ST = {'draft': '✏️ กำลังร่าง', 'ready': '📤 พร้อมให้ Claude ทำ', 'wip': '🔧 Claude กำลังทำ', 'review': '👀 รอผู้ใช้ดูผล', 'done': '✅ ผ่านแล้ว'}
SB_POW = ['', 'เบามาก', 'เบา', 'ปานกลาง', 'แรง', 'สุดพลัง']

SB_3D = {'ball': 'ลูกบอล', 'ring': 'วงแหวน', 'disc': 'วงบนพื้น', 'dome': 'โดม', 'spike': 'หนาม/กรวย', 'pillar': 'เสา', 'beam': 'ลำแสง',
         'slash': 'รอยฟัน', 'box': 'กล่อง/หิน', 'wall': 'กำแพง', 'arrow': 'ลูกศรทิศ', 'fig': 'ตัวละคร'}

def sb_sketches(s):  # ข้อมูลเก่ามี sketch รูปเดียว
    return s.get('sketches') or ([{'img': s['sketch'], 'kind': '2d'}] if s.get('sketch') else [])

SB_LOCK = __import__('threading').Lock()

def sb_load():
    p = os.path.join(SBD, 'boards.json')
    if not os.path.exists(p):
        return {'next': 1, 'rev': 0, 'items': []}
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
         '> **Claude:** ทำตาม `VFX-STUDIO-CLAUDE.md` §4b. เปิดภาพร่าง + รูปตัวอย่างทุกรูปด้วย Read ก่อนเริ่ม (ภาพร่าง = ความตั้งใจหลัก; ตัวขาวซ้าย = ผู้ร่ายหันขวา, ตัวแดงขวา = เป้า ห่าง ~5 ตัว, ขีดบนพื้น = 1 ตัวละคร ≈ 2.1 ม.; ภาพ 3D = ถ่ายจากฉากแบบร่าง ใช้ตาราง \"ฉาก 3D\" เป็นตำแหน่ง/ขนาดจริง).', '',
         f"- สาย: {b.get('who') or '-'} • ปุ่ม/ชื่อในเกม: {b.get('skill') or '-'} • สถานะ: {SB_ST.get(b.get('status'), b.get('status'))}",
         f"- ความยาวรวม: **{f(tot)} วินาที** • {len(T)} ช่วง",
         f"- ความรู้สึก: {', '.join(b.get('mood') or []) or '-'}",
         f"- สีหลัก: {' '.join('`' + c + '`' for c in b.get('colors') or []) or '-'}"]
    g = b.get('game')
    if b.get('rec'):
        rc = b['rec']
        L.append(f"- **ท่าตัวละครจากเกมจริง (อัดไว้):** `{rc.get('file')}` • ยาว {f(rc.get('dur') or 0)} วิ • ท่าในไฟล์ตามเวลา: {rc.get('clips') or '-'} — ฉาก 3D ของแต่ละช่วงใช้ท่านี้ที่เวลาเริ่มของช่วง (ภาพ 3D = ท่าจริงในเกม)")
    if g:
        L.append(f"- **นำเข้าจากเกม:** `{g.get('id')}` ({g.get('kind', 'spell')}) • โค้ด `{g.get('file')}:{g.get('line')}` • คูลดาวน์ {f(g.get('cd') or 0)} วิ — เวลา/ขนาดในช่วงต่าง ๆ เดาจากคำอธิบายในเกม ผู้ใช้อาจแก้แล้ว; ถ้าไม่ตรงกับโค้ด ให้เชื่อโค้ดและบอกผู้ใช้")
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
        for k, sk in enumerate(sb_sketches(s)):
            L.append(f"- ภาพร่าง {k+1}{' (3D ' + sk['view'] + ')' if sk.get('view') and sk.get('kind') == '3d' else ' (3D)' if sk.get('kind') == '3d' else ' (มุม ' + sk['view'] + ')' if sk.get('view') else ''}{' + วาดทับ' if sk.get('over') and sk.get('kind') == '3d' else ''}: `{sk['img']}`")
        S3 = s.get('scene3d') or {}
        objs = S3.get('objs') or []
        for r, th in (('cast', 'ผู้ร่าย'), ('targ', 'เป้า')):
            if S3.get(r):
                L.append(f"- ฉาก 3D: {th} = " + (f"ท่าจริงที่อัดจากเกม `{S3[r]['rec']}`" if S3[r].get('rec') else f"ตัวละครจากเกม `{S3[r].get('m')}` ท่า `{S3[r].get('a')}` (ท่าเดียวกับในเกม)"))
        if (S3.get('cast') or S3.get('targ') or any(o.get('t') == 'actor' for o in objs)) and S3.get('at') is not None:
            L.append(f"- ฉาก 3D: เวลาของท่าตอนถ่าย = {f(S3.get('at') or 0)} วิ (นับจากเริ่มท่า)")
        if objs:
            L += ['', 'ฉาก 3D (เมตร; หน้า = ไปทางเป้า, ขวา = ขวาของผู้ร่าย → fx `pos` = [ขวา, สูง, หน้า]; ขนาด = กล่องรอบชิ้น หน้า×สูง×ข้าง):', '',
                  '| ชิ้น | ป้าย | หน้า | สูง | ขวา | ขนาด (ม.) | หมุน (องศา) | สี | ทึบ | เรือง |', '|---|---|---|---|---|---|---|---|---|---|']
            for o in objs:
                p_ = o.get('p') or [0, 0, 0]; z = o.get('size') or [0, 0, 0]
                nm = f"ตัวละครเกม `{o.get('am')}` ท่า `{o.get('aa')}`" if o.get('t') == 'actor' else SB_3D.get(o.get('t'), o.get('t'))
                L.append(f"| {nm} | {o.get('label') or '-'} | {f(p_[0])} | {f(p_[1])} | {f(p_[2])} | {f(z[0])}×{f(z[1])}×{f(z[2])} | {', '.join(str(v) for v in o.get('r') or [0, 0, 0])} | `{o.get('col')}` | {f(o.get('op', 1))} | {'ใช่' if o.get('glow') else '-'} |")
        fr = s.get('frames') or {}
        if fr.get('list'):
            fl = fr['list']; fps = float(fr.get('fps') or 12)
            L += ['', f"🎞 **เฟรมต่อเฟรม (ผู้ใช้วาดทีละเฟรม = การเคลื่อนไหวที่ต้องการ):** {len(fl)} เฟรม • {f(fps)} fps • ยาว {f(len(fl) / fps)} วิ"
                  + (f" • รูปรวมทุกเฟรม: `{fr['sheet']}` (อ่านอันนี้ก่อน)" if fr.get('sheet') else '')]
            if fr.get('angles'):
                names = [fr.get('name') or 'มุม 1'] + [a_.get('name') or f'มุม {i + 2}' for i, a_ in enumerate(fr['angles'])]
                L.append(f"  - **หลายมุมมอง {len(names)} มุม (วาดแยกมุม แต่เล่นพร้อมกัน เฟรมที่ k ของทุกมุมคือเวลาเดียวกัน):** " + ' • '.join(f'{i + 1}. {n_}' for i, n_ in enumerate(names))
                         + ' — รูปของแต่ละเฟรมคือทุกมุมวางเรียงกัน (ซ้ายไปขวา แล้วบนไปล่าง ตามเลขมุม) ใช้เทียบรูปทรง/ทิศทางของเอฟเฟกต์จากหลายด้านให้ตรงกัน')
            for k, x in enumerate(fl):
                im = x.get('img') or x.get('base')
                if im:
                    L.append(f"  - เฟรม {k+1} ({f(k / fps)} วิ{', ท่า ' + f(x['t']) + ' วิ' if x.get('t') is not None else ''}{', มีวาดทับ' if x.get('ops') else ''}): `{im}`")
            L.append('')
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

# ---------- ☁ ซิงก์สตอรี่บอร์ดระหว่างเครื่อง ผ่าน GitHub (git ของโปรเจกต์นี้) ----------
# เพื่อน/เครื่องอื่น clone repo เดียวกัน → กดซิงก์ = ดึงของคนอื่น + รวมรายบอร์ด + ส่งขึ้น (commit เฉพาะโฟลเดอร์ storyboard/)
# รวมแบบ 3 ทาง: ฐาน = boards.json ใน commit ล่าสุดของเครื่องนี้ (HEAD), เรา = ไฟล์ตอนนี้, เขา = origin
#   ใครแก้บอร์ดไหนใช้ของคนนั้น • แก้ทั้งคู่ = อันที่ updated ใหม่กว่า • ลบฝั่งเดียว (อีกฝั่งไม่ได้แก้) = ลบ • เลขบอร์ดใหม่ชนกัน = เปลี่ยนเลขของเรา
def git(*a):
    return subprocess.run(['git', *a], cwd=ROOT, capture_output=True, text=True, encoding='utf-8', errors='replace')

def git_json(ref):
    r = git('show', ref + ':storyboard/boards.json')
    try:
        return json.loads(r.stdout) if r.returncode == 0 else {'next': 1, 'items': []}
    except Exception:
        return {'next': 1, 'items': []}

def sb_merge3(base, mine, theirs):
    J = lambda b: json.dumps(b, sort_keys=True, ensure_ascii=False) if b is not None else None
    B = {b['id']: b for b in base.get('items', [])}; M = {b['id']: b for b in mine.get('items', [])}; T = {b['id']: b for b in theirs.get('items', [])}
    order = [b['id'] for b in theirs.get('items', [])] + [i for i in M if i not in T]
    out, clash = [], []
    for i in order:
        b, m, t = B.get(i), M.get(i), T.get(i)
        if b is None and m is not None and t is not None and J(m) != J(t):
            out.append(t); clash.append(m); continue          # สร้างบอร์ดใหม่เลขเดียวกันทั้งสองเครื่อง
        mc, tc = J(m) != J(b), J(t) != J(b)
        if not mc: pick = t
        elif not tc: pick = m
        elif m is None: pick = t
        elif t is None: pick = m
        else: pick = m if (m.get('updated') or '') >= (t.get('updated') or '') else t
        if pick is not None: out.append(pick)
    nx = max([mine.get('next') or 1, theirs.get('next') or 1] + [b['id'] + 1 for b in out])
    for m in clash:
        m['id'] = nx; nx += 1; out.append(m)
    return {'next': nx, 'items': out}

SYNC = {'last': 0, 'msg': ''}
def sb_sync():
    with SB_LOCK:
        br = git('rev-parse', '--abbrev-ref', 'HEAD').stdout.strip() or 'main'
        f = git('fetch', 'origin', br)
        if f.returncode != 0:
            return {'ok': False, 'err': 'ต่อ GitHub ไม่ได้ (เน็ต / ยังไม่ได้ล็อกอิน git?) ' + f.stderr.strip()[-200:]}
        local = sb_load()
        merged = sb_merge3(git_json('HEAD'), local, git_json('origin/' + br))
        merged['rev'] = int(local.get('rev') or 0) + 1
        sb_save(merged)
        idn = [] if git('config', 'user.email').stdout.strip() else ['-c', 'user.name=Storyboard', '-c', 'user.email=storyboard@localhost']
        git('add', '-A', 'storyboard')
        if git('diff', '--cached', '--quiet', '--', 'storyboard').returncode != 0:
            c = git(*idn, 'commit', '-m', 'Storyboard sync (' + os.environ.get('COMPUTERNAME', 'pc') + ')', '--', 'storyboard')
            if c.returncode != 0:
                return {'ok': False, 'err': 'commit ไม่ได้: ' + (c.stderr or c.stdout).strip()[-200:]}
        if git('rev-list', '--count', 'HEAD..origin/' + br).stdout.strip() not in ('', '0'):
            m = git(*idn, 'merge', '--no-ff', '--no-commit', 'origin/' + br)
            bad = [x for x in git('diff', '--name-only', '--diff-filter=U').stdout.split() if x]
            if [x for x in bad if not x.startswith('storyboard/')] or (m.returncode != 0 and not bad):
                git('merge', '--abort')
                return {'ok': False, 'err': 'ดึงของใหม่ไม่ได้ — มีไฟล์อื่นในเครื่องนี้ชนกับของบน GitHub (ให้ Claude ช่วย) ' + (m.stderr or m.stdout).strip()[-200:]}
            for x in bad:   # ชนเฉพาะข้อมูลสตอรี่บอร์ด = ใช้ของเรา (รวมแล้วข้างบน) — ไฟล์ .md เขียนใหม่จาก json
                if git('checkout', '--ours', '--', x).returncode != 0:
                    git('rm', '-q', '--cached', '--', x)
            sb_save(dict(merged))
            git('add', '-A', 'storyboard')
            c = git(*idn, 'commit', '--no-edit', '-m', 'Storyboard sync: merge')
            if c.returncode != 0:
                git('merge', '--abort')
                return {'ok': False, 'err': 'รวมไม่ได้: ' + (c.stderr or c.stdout).strip()[-200:]}
        ahead = git('rev-list', '--count', 'origin/' + br + '..HEAD').stdout.strip()
        if ahead not in ('', '0'):
            ps = git('push', 'origin', br)
            if ps.returncode != 0:
                return {'ok': False, 'db': sb_load(), 'err': 'ดึงของใหม่แล้ว แต่ส่งขึ้น GitHub ไม่ได้ (ไม่มีสิทธิ์ push / มีคนส่งพร้อมกัน — กดซิงก์อีกครั้ง) ' + ps.stderr.strip()[-200:]}
        SYNC['last'] = time.time()
        return {'ok': True, 'db': sb_load(), 'pushed': ahead not in ('', '0')}

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
            fr = s.get('frames') or {}
            used |= {os.path.basename(i) for i in s.get('refs', []) + [k['img'] for k in sb_sketches(s)] + [s.get('result') or '', fr.get('sheet') or '']
                     + [x.get(k) or '' for x in (fr.get('list') or []) + [y for an in fr.get('angles') or [] for y in an.get('list') or []] for k in ('img', 'base')] if i}
    recs = set(re.findall(r'storyboard/rec/([\w\-]+\.json)', json.dumps(db, ensure_ascii=False)))
    rd = os.path.join(SBD, 'rec')
    if os.path.isdir(rd):  # ท่าที่อัดไว้แต่ไม่มีบอร์ดไหนใช้แล้ว → ลบ
        for fn in os.listdir(rd):
            if fn not in recs and time.time() - os.path.getmtime(os.path.join(rd, fn)) > 120:
                os.remove(os.path.join(rd, fn))
    d = os.path.join(SBD, 'img')
    for fn in os.listdir(d):
        if fn not in used and time.time() - os.path.getmtime(os.path.join(d, fn)) > 120:
            os.remove(os.path.join(d, fn))

def sb_skills():  # อ่านสกิลจากโค้ดเกมตรง ๆ (ชื่อ ไอคอน คูลดาวน์ บทบาท คำอธิบาย) — ไม่เอาข้อความ VFX (fx:) มา
    S = lambda k: r"(?<![\w])" + k + r":'((?:[^'\\]|\\.)*)'"
    def get(blk, k, num=False):
        m = re.search((r"(?<![\w])" + k + r":([\d.]+)") if num else S(k), blk)
        return (float(m.group(1)) if num else m.group(1).replace("\\'", "'")) if m else None
    paths, spells, basics, consts = [], [], [], {}
    # ลำดับเดียวกับที่เกมโหลด (FILES ใน index.html) — เรียงตามชื่อไฟล์จะได้ 09-water ก่อน 09-wind = เลขสายลม/น้ำสลับกัน (บั๊ก 2026-11-05)
    fm = re.search(r"const FILES=\[([^\]]*)\]", open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read())
    order = [x + '.js' for x in re.findall(r"'([^']+)'", fm.group(1))] if fm else sorted(os.listdir(os.path.join(ROOT, 'js')))
    for fn in order:
        if not fn.endswith('.js') or not os.path.exists(os.path.join(ROOT, 'js', fn)):
            continue
        src = open(os.path.join(ROOT, 'js', fn), encoding='utf-8').read()
        for m in re.finditer(r'const (\w+)=(\d+)\b', src):
            consts.setdefault(m.group(1), int(m.group(2)))
        if 'const PATHS=[' in src:
            body = src[src.index('const PATHS=['):]; body = body[:body.index('\n];')]
            for ln in body.split('\n')[1:]:
                if "{id:'" in ln:
                    paths.append({'id': get(ln, 'id'), 'n': get(ln, 'n'), 'ic': get(ln, 'ic'), 'col': get(ln, 'col'), 'd': get(ln, 'd'), 'off': "off:1" in ln})
        here = None   # สายที่ไฟล์นี้เพิ่ม (const XP=PATHS.length; PATHS.push(...)) — สกิลที่ใช้ชื่อแบบนี้เป็นของสายนี้
        for m in re.finditer(r"PATHS\.push\(\{(.*)", src):
            ln = m.group(1); here = len(paths); paths.append({'id': get(ln, 'id'), 'n': get(ln, 'n'), 'ic': get(ln, 'ic'), 'col': get(ln, 'col'), 'd': get(ln, 'd'), 'off': "off:1" in ln})
        for m in re.finditer(r'const (\w+)\s*=\s*PATHS\.length\b', src):
            if here is not None: consts[m.group(1)] = here
        starts = [m for m in re.finditer(r"defSpell\((\w+),\{", src)]
        for k, m in enumerate(starts):
            blk = src[m.end():starts[k + 1].start() if k + 1 < len(starts) else len(src)][:6000]
            pa = m.group(1); pa = int(pa) if pa.isdigit() else consts.get(pa, -1)
            cd = get(blk[:600], 'cd', 1)
            if cd is None:   # cd:W_DR.cd → หาค่าใน const W_DR={...cd:N...}
                cm = re.search(r"(?<![\w])cd:(\w+)\.cd", blk[:600]); cv = cm and re.search(r'\b' + cm.group(1) + r'\s*=\s*\{[^}]*?(?<![\w])cd:([\d.]+)', src)
                cd = float(cv.group(1)) if cv else None
            spells.append({'id': get(blk, 'id'), 'n': get(blk, 'n'), 'ic': get(blk, 'ic'), 'cd': cd, 'role': get(blk, 'role'),
                           'ult': bool(re.search(r'(?<![\w])ult:true', blk[:400])), 'd': get(blk, 'd'), 'path': pa,
                           'file': 'js/' + fn, 'line': src[:m.start()].count('\n') + 1})
        for m in re.finditer(r"\{id:'(b_\w+)'", src):
            blk = src[m.start():m.start() + 4000]; nx = blk.find("{id:'b_", 5); blk = blk[:nx] if nx > 0 else blk
            basics.append({'id': m.group(1), 'n': get(blk, 'n'), 'd': get(blk, 'd'), 'shd': get(blk, 'shd'), 'dsd': get(blk, 'dsd'),
                           'file': 'js/' + fn, 'line': src[:m.start()].count('\n') + 1})
    out = []
    for i, pt in enumerate(paths):
        if pt['off']:
            continue
        b = next((x for x in basics if x['id'] == 'b_' + pt['id']), None)
        out.append({**pt, 'i': i, 'basic': b, 'spells': [s for s in spells if s['path'] == i]})
    return {'paths': out}

MAPD = os.path.join(ROOT, 'maps')
MAP_ID = re.compile(r'^[a-z0-9][a-z0-9_\-]{0,40}$')

def map_list():
    out = []
    if os.path.isdir(MAPD):
        for f in sorted(os.listdir(MAPD)):
            if not f.endswith('.json'):
                continue
            p = os.path.join(MAPD, f)
            try:
                j = json.load(open(p, encoding='utf-8'))
                out.append({'id': f[:-5], 'name': j.get('name', f[:-5]), 'w': j.get('w'), 'h': j.get('h'), 't': os.path.getmtime(p)})
            except Exception as e:
                out.append({'id': f[:-5], 'name': f[:-5], 'err': str(e), 't': os.path.getmtime(p)})
    return out

def maps_index():
    L = ['# แผนที่ (Map Editor)', '',
         '> เขียนอัตโนมัติจาก `mapedit.html` (ศูนย์รวม Tool → Map Editor). แต่ละแผนที่มี `maps/<id>.md` (อ่านก่อน — ตาราง ของ/Interact/เส้นทาง/ผลตรวจทางเดิน + กริด ASCII), `maps/<id>.png` (ภาพ topdown เปิดด้วย Read) และ `maps/<id>.json` (ข้อมูลดิบ — รูปแบบใน `guides/MAP-FORMAT.md`).',
         '> แผนที่ในนี้เป็น **ภาพอ้างอิง/แบบร่าง** ไม่ใช่ผังที่ล็อกแล้ว เว้นแต่ผู้ใช้เขียนไว้ในคำอธิบาย.', '']
    for m in sorted(map_list(), key=lambda m: -m['t']):
        L.append('- **%s** (`%s`) %s×%s ช่อง — `maps/%s.md` • `maps/%s.png` • แก้ล่าสุด %s' % (m['name'], m['id'], m.get('w'), m.get('h'), m['id'], m['id'], time.strftime('%Y-%m-%d %H:%M', time.localtime(m['t']))))
    open(os.path.join(MAPD, 'MAPS.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')

def map_json_dump(m):  # กริด/รายการเป็นบรรทัดละแถว อ่าน diff ใน git ง่าย
    lines = ['{']
    keys = list(m.keys())
    for i, k in enumerate(keys):
        v = m[k]; end = ',' if i < len(keys) - 1 else ''
        if isinstance(v, list) and v and isinstance(v[0], (list, dict)):
            rows = [json.dumps(r, ensure_ascii=False, separators=(',', ':')) for r in v]
            lines.append(' %s: [\n  %s\n ]%s' % (json.dumps(k), ',\n  '.join(rows), end))
        else:
            lines.append(' %s: %s%s' % (json.dumps(k), json.dumps(v, ensure_ascii=False), end))
    lines.append('}')
    return '\n'.join(lines) + '\n'

# ---------- Map Builder (mapbuild.html): แผนที่จริงที่เกมโหลดได้ ----------
MBD = os.path.join(MAPD, 'build')
KITD = os.path.join(ROOT, 'assets', 'mapkit')
MANP = os.path.join(ROOT, 'assets', 'manifest.json')

def mb_list():
    out = []
    try: man = json.load(open(MANP, encoding='utf-8')).get('maps', {})
    except Exception: man = {}
    if os.path.isdir(MBD):
        for f in sorted(os.listdir(MBD)):
            if not f.endswith('.json'):
                continue
            fp = os.path.join(MBD, f)
            try:
                j = json.load(open(fp, encoding='utf-8'))
                out.append({'id': f[:-5], 'name': j.get('name', f[:-5]), 'W': j.get('W'), 'H': j.get('H'), 't': os.path.getmtime(fp), 'game': (man.get(f[:-5]) or {}).get('v', 0)})
            except Exception as e:
                out.append({'id': f[:-5], 'name': f[:-5], 'err': str(e), 't': os.path.getmtime(fp)})
    return out

_mbv = {'t': 0}
def mb_ver(mid):  # map version: on this machine (manifest file) / last commit (HEAD) / GitHub (origin/main, fetched at most once a minute)
    def v_of(txt):
        try: return int(((json.loads(txt).get('maps') or {}).get(mid) or {}).get('v', 0))
        except Exception: return None
    try: local = v_of(open(MANP, encoding='utf-8').read())
    except Exception: local = None
    r = git('show', 'HEAD:assets/manifest.json'); head = v_of(r.stdout) if r.returncode == 0 else None
    err = ''
    if time.time() - _mbv['t'] > 60:
        try:
            f = subprocess.run(['git', 'fetch', '--quiet', 'origin', 'main'], cwd=ROOT, capture_output=True, text=True, timeout=20)
            if f.returncode == 0: _mbv['t'] = time.time()
            else: err = (f.stderr or 'fetch failed').strip()[:120]
        except Exception as e: err = str(e)[:120]
    r = git('show', 'origin/main:assets/manifest.json'); remote = v_of(r.stdout) if r.returncode == 0 else None
    return {'ok': True, 'local': local, 'head': head, 'remote': remote, 'fetched': _mbv['t'], 'err': err}

MB_PUB_LOCK = __import__('threading').Lock()
def mb_publish(mid, dry=False):
    """Export → GitHub: one commit holding only this map (source + room prefabs it uses + assets/maps/<id>.* + its manifest entry),
    built on origin/main with a temporary index (other local changes are never included), then pushed. dry = build, don't push."""
    with MB_PUB_LOCK:
        f = git('fetch', '--quiet', 'origin', 'main')
        if f.returncode != 0:
            return {'ok': False, 'err': 'ต่อ GitHub ไม่ได้: ' + (f.stderr or '').strip()[-200:]}
        _mbv['t'] = time.time()
        if git('merge-base', '--is-ancestor', 'HEAD', 'origin/main').returncode != 0:
            n = git('rev-list', '--count', 'origin/main..HEAD').stdout.strip()
            return {'ok': False, 'err': 'ในเครื่องมี %s commit ที่ยังไม่ได้ push (ให้ Claude จัดการก่อน)' % n}
        base = git('rev-parse', 'origin/main').stdout.strip(); head = git('rev-parse', 'HEAD').stdout.strip()
        src = os.path.join(MBD, mid + '.json')
        try: m = json.load(open(src, encoding='utf-8')); man = json.load(open(MANP, encoding='utf-8'))
        except Exception as e: return {'ok': False, 'err': str(e)}
        ent = (man.get('maps') or {}).get(mid)
        if not ent: return {'ok': False, 'err': 'ยังไม่ได้ Export แผนที่นี้'}
        paths = ['maps/build/%s.json' % mid, 'assets/maps/%s.json' % mid, 'assets/maps/%s.glb' % mid]
        for r in sorted({x.get('ref') for x in m.get('rooms') or [] if x.get('ref')}):
            if re.fullmatch(r'[a-z0-9_\-]+', r) and os.path.exists(os.path.join(MBD, r + '.json')): paths.append('maps/build/%s.json' % r)
        r = git('show', base + ':assets/manifest.json')
        try: bm = json.loads(r.stdout) if r.returncode == 0 else {'v': 1}
        except Exception: return {'ok': False, 'err': 'manifest บน GitHub อ่านไม่ได้'}
        bm.setdefault('maps', {})[mid] = ent
        tmp = os.path.join(ROOT, '.git', 'mb-publish.index'); env = dict(os.environ, GIT_INDEX_FILE=tmp)
        def gi(*a, inp=None):
            return subprocess.run(['git', *a], cwd=ROOT, env=env, input=inp, capture_output=True)
        try:
            if gi('read-tree', base).returncode != 0: return {'ok': False, 'err': 'read-tree ไม่ได้'}
            a = gi('add', '-f', '--', *paths)
            if a.returncode != 0: return {'ok': False, 'err': 'add ไม่ได้: ' + a.stderr.decode('utf-8', 'replace')[-200:]}
            blob = gi('hash-object', '-w', '--stdin', inp=(json.dumps(bm, ensure_ascii=False, indent=1) + '\n').encode('utf-8')).stdout.decode().strip()
            gi('update-index', '--add', '--cacheinfo', '100644,%s,assets/manifest.json' % blob)
            tree = gi('write-tree').stdout.decode().strip()
            if tree == git('rev-parse', base + '^{tree}').stdout.strip():
                return {'ok': True, 'same': True, 'v': ent.get('v')}
            msg = 'Map %s: publish v%s from Map Builder' % (mid, ent.get('v'))
            c = gi('commit-tree', tree, '-p', base, '-m', msg)
            if c.returncode != 0: return {'ok': False, 'err': 'commit ไม่ได้: ' + c.stderr.decode('utf-8', 'replace')[-200:]}
            sha = c.stdout.decode().strip()
        finally:
            if os.path.exists(tmp): os.remove(tmp)
        files = [p for p in paths] + ['assets/manifest.json']
        if dry:
            return {'ok': True, 'dry': True, 'sha': sha, 'files': files, 'v': ent.get('v')}
        p = git('push', 'origin', sha + ':refs/heads/main')
        if p.returncode != 0:
            return {'ok': False, 'err': 'push ไม่ได้ (มีคน push พร้อมกัน? กดอีกครั้ง): ' + p.stderr.strip()[-200:]}
        git('fetch', '--quiet', 'origin', 'main')
        local = 'updated'
        if head == base:   # nothing else to bring in: move HEAD, keep the working tree, sync the index for our files
            git('update-ref', 'HEAD', sha, head); git('reset', '-q', sha, '--', *files)
        elif git('merge', '--ff-only', '--quiet', sha).returncode != 0:
            local = 'behind'   # local edits block the fast-forward; the push already landed
        return {'ok': True, 'sha': sha[:7], 'files': files, 'v': ent.get('v'), 'local': local}

def mb_manifest(fn):  # แก้ส่วน "maps" ของ assets/manifest.json (คงรูปแบบย่อหน้า 1 ช่องเดิม)
    man = json.load(open(MANP, encoding='utf-8'))
    r = fn(man.setdefault('maps', {}))
    with open(MANP, 'w', encoding='utf-8') as f:
        json.dump(man, f, ensure_ascii=False, indent=1); f.write('\n')
    return r

def kit_dump(kit):
    row = lambda L: ',\n  '.join(json.dumps(a, ensure_ascii=False) for a in L)
    return '{\n "_about": %s,\n "v": 1,\n "assets": [\n  %s\n ],\n "user": [\n  %s\n ]\n}\n' % (json.dumps(kit.get('_about', ''), ensure_ascii=False), row(kit.get('assets', [])), row(kit.get('user', [])))

def mb_post(self, u, q):
    if u.path == '/api/mb-asset':
        name = re.sub(r'[^a-z0-9_\-]', '_', q.get('name', ['asset'])[0].lower())[:40] or 'asset'
        data = self._body()
        if data[:4] != b'glTF':
            return self._json(400, {'ok': False, 'err': 'ต้องเป็นไฟล์ .glb'})
        os.makedirs(KITD, exist_ok=True)
        with open(os.path.join(KITD, name + '.glb'), 'wb') as f: f.write(data)
        kp = os.path.join(KITD, 'kit.json')
        kit = json.load(open(kp, encoding='utf-8')) if os.path.exists(kp) else {'v': 1, 'assets': [], 'user': []}
        cat = q.get('cat', ['user'])[0]
        if cat not in ('user', 'tree', 'rock', 'plant', 'build', 'ruin', 'fence', 'road', 'prop', 'light'): cat = 'user'
        e = {'id': 'user/' + name, 'name': q.get('label', [name])[0][:60] or name, 'cat': cat, 'src': 'mapkit/' + name + '.glb', 'node': '', 'col': 1, 'brk': 0, 'ns': 0, 'v': int(time.time())}
        kit['user'] = [a for a in kit.get('user', []) if a.get('id') != e['id']] + [e]
        open(kp, 'w', encoding='utf-8').write(kit_dump(kit))
        return self._json(200, {'ok': True, 'asset': e})
    mid = q_id(u)
    if not mid:
        return self._json(400, {'ok': False, 'err': 'id ใช้ได้เฉพาะ a-z 0-9 _ -'})
    src = os.path.join(MBD, mid + '.json'); ad = os.path.join(ROOT, 'assets', 'maps')
    if u.path == '/api/mb':
        try:
            m = json.loads(self._body().decode('utf-8'))['map']; assert m.get('hg') and m.get('W')
        except Exception as e:
            return self._json(400, {'ok': False, 'err': 'ข้อมูลผิดรูปแบบ: ' + str(e)})
        if not os.path.exists(src) and os.path.exists(os.path.join(ad, mid + '.json')):
            return self._json(400, {'ok': False, 'err': 'id นี้ซ้ำกับแผนที่เดิมของเกม ใช้ id อื่น'})
        os.makedirs(MBD, exist_ok=True); m['id'] = mid
        with open(src + '.tmp', 'w', encoding='utf-8') as f: json.dump(m, f, ensure_ascii=False, separators=(',', ':'))
        os.replace(src + '.tmp', src)
        return self._json(200, {'ok': True, 'id': mid})
    if not os.path.exists(src):  # กันเขียนทับ/ลบแผนที่ที่ปั้นจาก Blender
        return self._json(400, {'ok': False, 'err': 'ไม่มีต้นฉบับ maps/build/%s.json (บันทึกก่อน)' % mid})
    if u.path == '/api/mb-publish':
        return self._json(200, mb_publish(mid, dry=q.get('dry', ['0'])[0] == '1'))
    if u.path == '/api/mb-export':
        try:
            b = json.loads(self._body().decode('utf-8')); d = b['data']; glb = base64.b64decode(b['glb'])
            assert d.get('fmt') == 1 and d.get('g') and glb[:4] == b'glTF'
        except Exception as e:
            return self._json(400, {'ok': False, 'err': 'ข้อมูลผิดรูปแบบ: ' + str(e)})
        os.makedirs(ad, exist_ok=True); d['id'] = mid
        with open(os.path.join(ad, mid + '.json'), 'w', encoding='utf-8') as f: json.dump(d, f, ensure_ascii=False, separators=(',', ':'))
        with open(os.path.join(ad, mid + '.glb'), 'wb') as f: f.write(glb)
        def bump(mp):
            v = int((mp.get(mid) or {}).get('v', 0)) + 1
            mp[mid] = {'file': 'maps/%s.glb' % mid, 'data': 'maps/%s.json' % mid, 'v': v}; return v
        return self._json(200, {'ok': True, 'v': mb_manifest(bump), 'glb_kb': round(len(glb) / 1024)})
    for ext in ('.json', '.glb'):  # mb-unexport / mb-del
        fp = os.path.join(ad, mid + ext)
        if os.path.exists(fp): os.remove(fp)
    mb_manifest(lambda mp: mp.pop(mid, None))
    if u.path == '/api/mb-del':
        d = os.path.join(MBD, '_deleted'); os.makedirs(d, exist_ok=True)
        os.replace(src, os.path.join(d, mid + '_' + time.strftime('%Y%m%d-%H%M%S') + '.json'))
    return self._json(200, {'ok': True})

def img_body(data):
    ext = 'png'
    if data[:5] == b'data:':
        head, b64 = data.split(b',', 1); ext = 'jpg' if b'jpeg' in head else 'png'; data = base64.b64decode(b64)
    elif data[:3] == b'\xff\xd8\xff': ext = 'jpg'
    return data, ext

def q_id(u):
    mid = (parse_qs(u.query).get('id', [''])[0]).strip().lower()
    return mid if MAP_ID.match(mid) else ''

# ---------- สเก็ตช์ (sketch.html): วาด/เขียน/รูปร่างให้ Claude ดู ----------
SKD = os.path.join(ROOT, 'sketch')
SK_COL = {'#ff3030': 'red', '#ffb000': 'orange', '#2ee86b': 'green', '#3aa0ff': 'blue', '#b36bff': 'purple', '#111111': 'black', '#ffffff': 'white'}

def sk_list():
    out = []
    if os.path.isdir(SKD):
        for f in sorted(os.listdir(SKD)):
            if not f.endswith('.json'):
                continue
            p = os.path.join(SKD, f)
            try:
                j = json.load(open(p, encoding='utf-8'))
                out.append({'id': f[:-5], 'name': j.get('name') or f[:-5], 'n': len(j.get('shapes', [])), 't': os.path.getmtime(p)})
            except Exception:
                pass
    return out

def sk_md(sid, d):
    W, H = max(1, int(d.get('w') or 1280)), max(1, int(d.get('h') or 720))
    pct = lambda x, y: 'x=%d%% y=%d%%' % (round(100 * x / W), round(100 * y / H))
    sh = d.get('shapes') or []
    L = ['# สเก็ตช์: %s (`%s`)' % (d.get('name') or sid, sid), '',
         '> เขียนอัตโนมัติจาก `sketch.html` — อย่าแก้ตรง ๆ. **Claude: เปิดภาพ `sketch/%s.png` ด้วย Read ก่อน** (นี่คือสิ่งที่ผู้ใช้วาด) แล้วอ่านโน้ต/ป้ายข้อความด้านล่างประกอบ. ตำแหน่งเป็น %% ของภาพ (0,0 = มุมซ้ายบน).' % sid, '',
         '- ขนาดภาพ: %d×%d • พื้น: %s' % (W, H, 'ดำ' if d.get('paper') == '#1e1e1e' else 'ขาว')]
    if d.get('bg'):
        L.append('- รูปพื้นหลัง (ต้นฉบับ ไม่มีรอยวาด): `%s`' % d['bg'])
    L += ['', '## โน้ตจากผู้ใช้', '', (d.get('note') or '(ไม่มี)').strip(), '']
    marks = [s for s in sh if s.get('t') in ('num', 'text')]
    if marks:
        L += ['## ป้ายข้อความ / เลขลำดับ', '', '| ชนิด | ตำแหน่ง | ข้อความ/เลข | สี |', '|---|---|---|---|']
        for s in marks:
            c = SK_COL.get(s.get('c'), s.get('c', ''))
            if s['t'] == 'num':
                L.append('| ① เลขลำดับ | %s | %s | %s |' % (pct(s['x'], s['y']), s.get('n'), c))
            else:
                L.append('| ข้อความ | %s | %s | %s |' % (pct(s['x'], s['y']), str(s.get('s', '')).replace('\n', ' / ').replace('|', '\\|'), c))
        L.append('')
    kinds = {'rect': 'กรอบสี่เหลี่ยม', 'ellipse': 'วงรี/วงกลม', 'line': 'เส้นตรง', 'arrow': 'ลูกศร'}
    geo = [s for s in sh if s.get('t') in kinds]
    if geo:
        L += ['## รูปร่าง / เส้น / ลูกศร', '', '| ชนิด | จาก → ถึง | สี | มีพื้นสี |', '|---|---|---|---|']
        for s in geo:
            a, b = s['a'], s['b']
            L.append('| %s | %s → %s | %s | %s |' % (kinds[s['t']], pct(*a), pct(*b), SK_COL.get(s.get('c'), s.get('c', '')), 'ใช่' if s.get('f') else ''))
        L.append('')
    pens = [s for s in sh if s.get('t') == 'pen']
    if pens:
        L.append('ปากกาลายมือ %d เส้น (ดูในภาพ)' % len(pens))
    return '\n'.join(L) + '\n'

def sk_index():
    L = ['# สเก็ตช์ (sketch.html)', '',
         '> เขียนอัตโนมัติจาก `sketch.html` (ศูนย์รวม Tool → สเก็ตช์). แต่ละอัน: `sketch/<id>.md` (โน้ต + ป้ายข้อความ + ตำแหน่ง), `sketch/<id>.png` (ภาพที่วาด — **เปิดด้วย Read**), `sketch/<id>.json` (ข้อมูลดิบ).',
         '> ผู้ใช้วาดเพื่อสื่อสารกับ Claude: ภาพ = สิ่งที่อยากได้/ปัญหา, ลูกศร/วงกลม = ชี้จุด, เลขลำดับ = ขั้นตอน/ลำดับ.', '']
    for m in sorted(sk_list(), key=lambda m: -m['t']):
        L.append('- **%s** (`%s`) %d ชิ้น — `sketch/%s.md` • `sketch/%s.png` • แก้ล่าสุด %s' % (m['name'], m['id'], m['n'], m['id'], m['id'], time.strftime('%Y-%m-%d %H:%M', time.localtime(m['t']))))
    open(os.path.join(SKD, 'SKETCH.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')

def sk_post(self, u, q):
    if u.path == '/api/sketch-img':
        name = re.sub(r'[^a-zA-Z0-9_\-]', '_', q.get('name', ['img'])[0])[:60] or 'img'
        data, ext = img_body(self._body())
        d = os.path.join(SKD, 'img'); os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, name + '.' + ext), 'wb') as f: f.write(data)
        return self._json(200, {'ok': True, 'path': 'sketch/img/' + name + '.' + ext})
    sid = q_id(u)
    if not sid:
        return self._json(400, {'ok': False, 'err': 'id ใช้ได้เฉพาะ a-z 0-9 _ -'})
    os.makedirs(SKD, exist_ok=True)
    if u.path == '/api/sketch-del':
        d = os.path.join(SKD, '_deleted'); os.makedirs(d, exist_ok=True); st = time.strftime('%Y%m%d-%H%M%S')
        for ext in ('.json', '.md', '.png', '.jpg'):
            p = os.path.join(SKD, sid + ext)
            if os.path.exists(p):
                os.replace(p, os.path.join(d, sid + '_' + st + ext))
        sk_index()
        return self._json(200, {'ok': True})
    try:
        b = json.loads(self._body().decode('utf-8')); doc = b['doc']
        assert isinstance(doc.get('shapes'), list)
    except Exception as e:
        return self._json(400, {'ok': False, 'err': 'ข้อมูลผิดรูปแบบ: ' + str(e)})
    doc['id'] = sid
    open(os.path.join(SKD, sid + '.json'), 'w', encoding='utf-8').write(json.dumps(doc, ensure_ascii=False, separators=(',', ':')))
    if b.get('png'):
        data, ext = img_body(b['png'].encode('ascii'))
        for e2 in ('png', 'jpg'):
            if e2 != ext and os.path.exists(os.path.join(SKD, sid + '.' + e2)):
                os.remove(os.path.join(SKD, sid + '.' + e2))
        open(os.path.join(SKD, sid + '.' + ext), 'wb').write(data)
    md = sk_md(sid, doc)
    open(os.path.join(SKD, sid + '.md'), 'w', encoding='utf-8').write(md)
    sk_index()
    return self._json(200, {'ok': True, 'id': sid})

# ---------- HUD designs (hudedit.html, design mode): hand-drawn HUD references for Claude ----------
HDD = os.path.join(ROOT, 'huddesign')

def hd_list():
    out = []
    if os.path.isdir(HDD):
        for f in sorted(os.listdir(HDD)):
            if not f.endswith('.json'):
                continue
            p = os.path.join(HDD, f)
            try:
                j = json.load(open(p, encoding='utf-8'))
                out.append({'id': f[:-5], 'img': j.get('img') or 'huddesign/%s.png' % f[:-5], 'name': j.get('name') or f[:-5], 'n': len(j.get('objs', [])), 'w': j.get('w'), 'h': j.get('h'), 't': os.path.getmtime(p)})
            except Exception:
                pass
    return out

def hd_index():
    os.makedirs(HDD, exist_ok=True)
    L = ['# HUD designs (hudedit.html → ✎ ออกแบบ)', '',
         '> เขียนอัตโนมัติจาก HUD Editor โหมดออกแบบ. ผู้ใช้วาด HUD ที่อยากได้ทับภาพเกม (ภาพอ้างอิง ยังไม่ใช่ HUD จริงในเกม).',
         '> แต่ละอัน: ภาพ `huddesign/<id>.jpg` หรือ `.png` (**เปิดด้วย Read ก่อน**), `huddesign/<id>.md` (โน้ต + รายการชิ้น HUD/สกิล/ข้อความ + ตำแหน่ง), `huddesign/<id>.json` (ข้อมูลดิบ).', '']
    for m in sorted(hd_list(), key=lambda m: -m['t']):
        L.append('- **%s** (`%s`) %s×%s, %d ชิ้น — `%s` • `huddesign/%s.md` • แก้ล่าสุด %s' % (m['name'], m['id'], m['w'], m['h'], m['n'], m['img'], m['id'], time.strftime('%Y-%m-%d %H:%M', time.localtime(m['t']))))
    if len(L) == 4:
        L.append('- (ยังไม่มีแบบ)')
    open(os.path.join(HDD, 'HUDDESIGN.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')

def hd_post(self, u, q):
    if u.path == '/api/hud-design-img':
        name = re.sub(r'[^a-zA-Z0-9_\-]', '_', q.get('name', ['img'])[0])[:60] or 'img'
        data, ext = img_body(self._body())
        d = os.path.join(HDD, 'img'); os.makedirs(d, exist_ok=True)
        for e2 in ('png', 'jpg'):
            if e2 != ext and os.path.exists(os.path.join(d, name + '.' + e2)):
                os.remove(os.path.join(d, name + '.' + e2))
        with open(os.path.join(d, name + '.' + ext), 'wb') as f: f.write(data)
        return self._json(200, {'ok': True, 'path': 'huddesign/img/' + name + '.' + ext})
    sid = q_id(u)
    if not sid:
        return self._json(400, {'ok': False, 'err': 'id ใช้ได้เฉพาะ a-z 0-9 _ -'})
    os.makedirs(HDD, exist_ok=True)
    if u.path == '/api/hud-design-del':
        d = os.path.join(HDD, '_deleted'); os.makedirs(d, exist_ok=True); st = time.strftime('%Y%m%d-%H%M%S')
        for ext in ('.json', '.md', '.png', '.jpg'):
            p = os.path.join(HDD, sid + ext)
            if os.path.exists(p):
                os.replace(p, os.path.join(d, sid + '_' + st + ext))
        di = os.path.join(HDD, 'img')   # its background / pasted pictures too
        for f in (os.listdir(di) if os.path.isdir(di) else []):
            if f.startswith(sid + '-'):
                os.replace(os.path.join(di, f), os.path.join(d, st + '_' + f))
        hd_index()
        return self._json(200, {'ok': True})
    try:
        b = json.loads(self._body().decode('utf-8')); doc = b['doc']
        assert isinstance(doc.get('objs'), list)
    except Exception as e:
        return self._json(400, {'ok': False, 'err': 'ข้อมูลผิดรูปแบบ: ' + str(e)})
    doc['id'] = sid
    open(os.path.join(HDD, sid + '.json'), 'w', encoding='utf-8').write(json.dumps(doc, ensure_ascii=False, separators=(',', ':')))
    if b.get('png'):
        data, ext = img_body(b['png'].encode('ascii'))
        for e2 in ('png', 'jpg'):
            if e2 != ext and os.path.exists(os.path.join(HDD, sid + '.' + e2)):
                os.remove(os.path.join(HDD, sid + '.' + e2))
        open(os.path.join(HDD, sid + '.' + ext), 'wb').write(data)
    if b.get('md'):
        open(os.path.join(HDD, sid + '.md'), 'w', encoding='utf-8').write(b['md'])
    hd_index()
    return self._json(200, {'ok': True, 'id': sid})

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
        if '/api/' in str(args[0] if args else ''):
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
        if u.path == '/api/reviews':
            return self._json(200, rv_load())
        if u.path == '/api/concepts':
            return self._json(200, cp_load())
        if u.path == '/api/sb':
            return self._json(200, sb_load())
        if u.path == '/api/sb-skills':
            return self._json(200, sb_skills())
        if u.path == '/api/mb-ver':
            return self._json(200, mb_ver(q_id(u)))
        if u.path == '/api/mb-list':
            return self._json(200, {'ok': True, 'maps': mb_list()})
        if u.path == '/api/mb':
            try:
                return self._json(200, {'ok': True, 'map': json.load(open(os.path.join(MBD, q_id(u) + '.json'), encoding='utf-8'))})
            except Exception as e:
                return self._json(404, {'ok': False, 'err': str(e)})
        if u.path == '/api/hud-designs':
            return self._json(200, hd_list())
        if u.path == '/api/hud-design':
            p = os.path.join(HDD, q_id(u) + '.json')
            if not q_id(u) or not os.path.exists(p):
                return self._json(404, {'ok': False, 'err': 'ไม่มีแบบนี้'})
            return self._json(200, json.load(open(p, encoding='utf-8')))
        if u.path == '/api/sketches':
            return self._json(200, sk_list())
        if u.path == '/api/sketch':
            p = os.path.join(SKD, q_id(u) + '.json')
            if not q_id(u) or not os.path.exists(p):
                return self._json(404, {'ok': False, 'err': 'ไม่มีสเก็ตช์นี้'})
            return self._json(200, json.load(open(p, encoding='utf-8')))
        if u.path == '/api/maps':
            return self._json(200, map_list())
        if u.path == '/api/map':
            mid = q_id(u)
            p = os.path.join(MAPD, (mid or '_') + '.json')
            if not mid or not os.path.exists(p):
                return self._json(404, {'ok': False, 'err': 'ไม่มีแผนที่นี้'})
            return self._json(200, json.load(open(p, encoding='utf-8')))
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
            if rel.startswith('assets/hud/'): return self._json(200, {'ok': True, 'path': rel, 'check': ''})   # HUD layout: not an fx file, skip fx-check
            try:
                r = subprocess.run(['node', os.path.join(ROOT, 'tools', 'fx-check.js'), '--quiet'], cwd=ROOT, capture_output=True, text=True, encoding='utf-8', timeout=30)
                chk = (r.stdout + r.stderr).strip()
            except Exception as e:
                chk = 'fx-check ไม่ได้รัน (ไม่มี node?): ' + str(e)
            return self._json(200, {'ok': True, 'path': rel, 'check': chk})
        if u.path == '/api/video':   # Dev Mode recording (js/78-dev-ui.js) -> recordings/<name>.mp4|webm
            name = re.sub(r'[^A-Za-z0-9_\-]', '', q.get('name', ['rec'])[0])[:80] or 'rec'
            ext = 'mp4' if q.get('ext', [''])[0] == 'mp4' else 'webm'
            d = os.path.join(ROOT, 'recordings'); os.makedirs(d, exist_ok=True)
            with open(os.path.join(d, name + '.' + ext), 'wb') as f: f.write(self._body())
            return self._json(200, {'ok': True, 'path': 'recordings/' + name + '.' + ext})
        if u.path == '/api/photo':   # Dev photo mode (js/79-photo.js) -> photos/<name>.png
            name = re.sub(r'[^a-zA-Z0-9_\-]', '_', q.get('name', ['photo'])[0])[:80] or 'photo'
            data = self._body()
            if data[:5] == b'data:': data = base64.b64decode(data.split(b',', 1)[1])
            d = os.path.join(ROOT, 'photos'); os.makedirs(d, exist_ok=True)
            with open(os.path.join(d, name + '.png'), 'wb') as f: f.write(data)
            return self._json(200, {'ok': True, 'path': 'photos/' + name + '.png'})
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
        if u.path == '/api/reviews':
            try:
                db = json.loads(self._body().decode('utf-8'))
                assert isinstance(db.get('items'), list)
            except Exception as e:
                return self._json(400, {'ok': False, 'err': 'ข้อมูลผิดรูปแบบ: ' + str(e)})
            rv_save(db)
            return self._json(200, {'ok': True})
        if u.path == '/api/concepts':
            try:
                db = json.loads(self._body().decode('utf-8'))
                assert isinstance(db.get('items'), list)
            except Exception as e:
                return self._json(400, {'ok': False, 'err': 'ข้อมูลผิดรูปแบบ: ' + str(e)})
            cp_save(db)
            return self._json(200, {'ok': True})
        if u.path == '/api/sb':
            try:
                db = json.loads(self._body().decode('utf-8'))
                assert isinstance(db.get('items'), list)
            except Exception as e:
                return self._json(400, {'ok': False, 'err': 'ข้อมูลผิดรูปแบบ: ' + str(e)})
            with SB_LOCK:  # หลายหน้าต่างเปิดพร้อมกัน: ต้องส่ง rev ที่โหลดมา — ไม่ตรง = มีคนบันทึกก่อน → ส่งของล่าสุดกลับไปให้รวมเอง (ไม่ทับกัน)
                cur = sb_load()
                if int(db.get('rev') or 0) != int(cur.get('rev') or 0):
                    return self._json(409, {'ok': False, 'conflict': True, 'db': cur})
                db['rev'] = int(cur.get('rev') or 0) + 1
                sb_save(db)
            return self._json(200, {'ok': True, 'rev': db['rev']})
        if u.path == '/api/sb-sync':
            try:
                return self._json(200, sb_sync())
            except Exception as e:
                return self._json(200, {'ok': False, 'err': str(e)})
        if u.path == '/api/sb-rec':
            name = re.sub(r'[^a-zA-Z0-9_\-]', '_', q.get('name', ['rec'])[0])[:60] or 'rec'
            data = self._body(); json.loads(data)
            d = os.path.join(SBD, 'rec'); os.makedirs(d, exist_ok=True)
            with open(os.path.join(d, name + '.json'), 'wb') as f: f.write(data)
            return self._json(200, {'ok': True, 'path': 'storyboard/rec/' + name + '.json'})
        if u.path in ('/api/bug-img', '/api/sb-img', '/api/review-img', '/api/concept-img'):
            name = re.sub(r'[^a-zA-Z0-9_\-]', '_', q.get('name', ['img'])[0])[:60] or 'img'
            data = self._body(); ext = 'png'
            if data[:5] == b'data:':
                head, b64 = data.split(b',', 1); ext = 'jpg' if b'jpeg' in head else 'png'; data = base64.b64decode(b64)
            elif data[:3] == b'\xff\xd8\xff': ext = 'jpg'
            sub = {'/api/bug-img': 'bugs', '/api/review-img': 'review', '/api/concept-img': 'concepts'}.get(u.path, 'storyboard')
            d = os.path.join(ROOT, sub, 'img'); os.makedirs(d, exist_ok=True)
            with open(os.path.join(d, name + '.' + ext), 'wb') as f: f.write(data)
            return self._json(200, {'ok': True, 'path': sub + '/img/' + name + '.' + ext})
        if u.path == '/api/map':
            mid = q_id(u)
            if not mid:
                return self._json(400, {'ok': False, 'err': 'id ใช้ได้เฉพาะ a-z 0-9 _ -'})
            try:
                b = json.loads(self._body().decode('utf-8')); m = b['map']
                assert isinstance(m.get('height'), list)
            except Exception as e:
                return self._json(400, {'ok': False, 'err': 'ข้อมูลผิดรูปแบบ: ' + str(e)})
            os.makedirs(MAPD, exist_ok=True)
            m['id'] = mid
            open(os.path.join(MAPD, mid + '.json'), 'w', encoding='utf-8').write(map_json_dump(m))
            if b.get('md'):
                open(os.path.join(MAPD, mid + '.md'), 'w', encoding='utf-8').write(b['md'])
            if b.get('png'):
                data, ext = img_body(b['png'].encode('ascii'))
                open(os.path.join(MAPD, mid + '.png'), 'wb').write(data)
            maps_index()
            return self._json(200, {'ok': True, 'id': mid})
        if u.path in ('/api/hud-design', '/api/hud-design-del', '/api/hud-design-img'):
            return hd_post(self, u, q)
        if u.path in ('/api/sketch', '/api/sketch-del', '/api/sketch-img'):
            return sk_post(self, u, q)
        if u.path in ('/api/mb', '/api/mb-export', '/api/mb-publish','/api/mb-unexport', '/api/mb-del', '/api/mb-asset'):
            return mb_post(self, u, q)
        if u.path == '/api/map-del':
            mid = q_id(u)
            if not mid:
                return self._json(400, {'ok': False, 'err': 'id ผิด'})
            d = os.path.join(MAPD, '_deleted'); os.makedirs(d, exist_ok=True); st = time.strftime('%Y%m%d-%H%M%S')
            for ext in ('.json', '.md', '.png'):
                p = os.path.join(MAPD, mid + ext)
                if os.path.exists(p):
                    os.replace(p, os.path.join(d, mid + '_' + st + ext))
            maps_index()
            return self._json(200, {'ok': True})
        if u.path == '/api/map-img':
            name = re.sub(r'[^a-zA-Z0-9_\-]', '_', q.get('name', ['img'])[0])[:60] or 'img'
            data, ext = img_body(self._body())
            d = os.path.join(MAPD, 'img'); os.makedirs(d, exist_ok=True)
            with open(os.path.join(d, name + '.' + ext), 'wb') as f: f.write(data)
            return self._json(200, {'ok': True, 'path': 'maps/img/' + name + '.' + ext})
        return self._json(404, {'ok': False, 'err': 'ไม่มีช่องทางนี้'})

if __name__ == '__main__':
    if '--bugs-md' in sys.argv:  # Claude แก้ bugs/bugs.json เองแล้ว → เขียน BUGS.md ใหม่
        bugs_save(bugs_load()); print('bugs/BUGS.md updated'); sys.exit()
    if '--review-md' in sys.argv:  # Claude แก้ review/reviews.json เองแล้ว → เขียน REVIEW.md ใหม่
        rv_save(rv_load()); print('review/REVIEW.md updated'); sys.exit()
    if '--concepts-md' in sys.argv:  # Claude แก้ concepts/concepts.json เองแล้ว → เขียน CONCEPTS.md ใหม่
        cp_save(cp_load()); print('concepts/CONCEPTS.md updated'); sys.exit()
    if '--sb-md' in sys.argv:  # Claude แก้ storyboard/boards.json เองแล้ว → เขียน sb-<id>.md ใหม่
        sb_save(sb_load()); print('storyboard/*.md updated'); sys.exit()
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print(f'Tool Hub: http://localhost:{port}/hub.html  •  Fantas Stick: http://localhost:{port}/  •  VFX Studio: http://localhost:{port}/studio.html  •  Bug Notes: http://localhost:{port}/bugs.html  •  Storyboard: http://localhost:{port}/storyboard.html  •  Map Editor: http://localhost:{port}/mapedit.html')
    class Srv(ThreadingHTTPServer):
        request_queue_size = 128      # default 5 → the game loads hundreds of files at once and Windows refused the rest (Failed to fetch)
        allow_reuse_address = False   # Windows: reuse = เปิดซ้อนพอร์ตเดียวกันได้ 2 ตัว → คำขอสลับไปมา ข้อมูลเพี้ยน
    try:
        srv = Srv(('127.0.0.1', port), H)
    except OSError:
        print(f'มีเซิร์ฟเวอร์เปิดอยู่แล้วที่พอร์ต {port} (เช่นเปิด Tools.bat ไว้แล้ว) — ใช้ตัวเดิมได้เลย ปิดหน้าต่างนี้ได้')
        sys.exit(0)
    srv.serve_forever()
