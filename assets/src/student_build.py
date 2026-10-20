# student_build.py — ตัวละครผู้เล่น char_student (+ ไม้กวาด char_broom) พร้อมกระดูกและท่า
# รัน:  D:\Blender\blender.exe -b --factory-startup --python assets/src/student_build.py
# ได้:  assets/chars/student.glb, assets/chars/broom.glb, assets/src/student.blend
# สัดส่วน/ตำแหน่งพอร์ตจาก makeStudent() ใน js/29-characters.js (ตัวเลขพิกัดในฟังก์ชันรูปทรง = แบบ three.js)
# ชิ้นที่ผู้เล่นเลือกได้ = object แยก: hair_0..hair_10 (ทรงผม look.hs), tie_0..tie_2 (look.ti, 3 = ไม่มี), wand_0..wand_3 (look.ws)
#   เกมโชว์เฉพาะชิ้นที่ตรงกับหน้าตาผู้เล่น (fileVariants ใน js/22-models.js) • สีมาจากชื่อวัสดุ tint_* (ASSETS.md §5)
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from _kit import *

reset()
PI = math.pi

# ---------- วัสดุ ----------
PAL = ['#222228', '#0b0b0d', '#3b3b44', '#f2f0ec',     # 0 กางเกง 1 รองเท้า 2 เสื้อกันหนาว 3 เสื้อเชิ้ต/ตาขาว
       '#0a0806', '#e8c060', '#8a4a40', '#5a3a1c',     # 4 รูม่านตา 5 ทอง 6 ปาก 7 ไม้กวาด
       '#b08a50', '#2a2a30', '#c9a26a', '#ffffff']     # 8 ฟาง 9 พื้นรองเท้า 10 ฟางอ่อน
pal = mat('student_pal', img=palette('student_pal', PAL + ['#ffffff'] * (16 - len(PAL))), rough=0.8)
T = {k: mat('tint_' + k, rough=r, double=d) for k, r, d in
     (('skin', 0.7, False), ('hair', 0.55, True), ('cloak', 0.92, True), ('house', 0.8, True), ('house2', 0.8, False),
      ('eyes', 0.3, False), ('wand', 0.5, False))}

# ---------- กระดูก (พิกัด blender: z ขึ้น, −Y หน้า, +X = ซ้ายของตัวละคร) ----------
BONES = [
    ('root', (0, 0, 0), (0, 0.25, 0), None),
    ('hips', (0, 0, 0.84), (0, 0, 1.02), 'root'),
    ('spine', (0, 0, 1.02), (0, 0, 1.28), 'hips'),
    ('chest', (0, 0, 1.28), (0, 0, 1.56), 'spine'),
    ('neck', (0, 0, 1.56), (0, 0, 1.7), 'chest'),
    ('head', (0, 0, 1.7), (0, 0, 2.1), 'neck'),
    ('cloak_B', (0, 0.3, 1.35), (0, 0.72, 0.12), 'spine'),
    ('scarf_1', (0.12, -0.24, 1.57), (0.12, -0.25, 1.07), 'chest'),
    ('scarf_2', (-0.11, -0.24, 1.57), (-0.11, -0.25, 1.15), 'chest'),
]
for s, S in ((1, 'L'), (-1, 'R')):
    BONES += [
        ('upper_arm_' + S, (s * 0.33, 0, 1.5), (s * 0.33, 0, 1.18), 'chest'),
        ('forearm_' + S, (s * 0.33, 0, 1.18), (s * 0.33, 0, 0.9), 'upper_arm_' + S),
        ('hand_' + S, (s * 0.33, 0, 0.9), (s * 0.33, 0, 0.78), 'forearm_' + S),
        ('thigh_' + S, (s * 0.12, 0, 0.86), (s * 0.12, 0, 0.47), 'hips'),
        ('shin_' + S, (s * 0.12, 0, 0.47), (s * 0.12, 0, 0.09), 'thigh_' + S),
        ('foot_' + S, (s * 0.12, 0, 0.09), (s * 0.12, -0.17, 0.04), 'shin_' + S),
        ('cloak_' + S, (s * 0.3, 0.06, 1.35), (s * 0.68, 0.08, 0.12), 'spine'),
    ]
BN = [b[0] for b in BONES]


def zb(*pts):
    """น้ำหนักตามความสูง (z blender): pts = (z, bone) เรียงจากบนลงล่าง ไล่ระหว่างจุด"""
    def f(co):
        z = co.z
        if z >= pts[0][0]:
            return {pts[0][1]: 1.0}
        for (z0, b0), (z1, b1) in zip(pts, pts[1:]):
            if z >= z1:
                t = (z0 - z) / (z0 - z1)
                return {b0: 1 - t, b1: t} if b0 != b1 else {b0: 1.0}
        return {pts[-1][1]: 1.0}
    return f


def lathe(prof, rs=16, t0=0.0, tl=math.tau):
    """ทรงหมุนรอบแกน y (three): prof = [(รัศมี, y)] จากบนลงล่าง"""
    return [[V((r * math.sin(t0 + tl * j / rs), y, r * math.cos(t0 + tl * j / rs))) for j in range(rs + 1)] for r, y in prof], tl >= math.tau - 1e-6


body = MB([pal, T['skin'], T['cloak'], T['house'], T['house2'], T['eyes'], T['hair']], BN)

# ขา + รองเท้า
for s, S in ((1, 'L'), (-1, 'R')):
    x = s * 0.12
    body.grid(lathe([(0.0, 0.9), (0.085, 0.89), (0.1, 0.84), (0.097, 0.66), (0.092, 0.52), (0.09, 0.44), (0.087, 0.3), (0.085, 0.14), (0.083, 0.08), (0.0, 0.08)], 12),
              trs3((x, 0, 0)), pal, 0, zb((0.56, 'thigh_' + S), (0.38, 'shin_' + S), (0.12, 'shin_' + S), (0.07, 'foot_' + S)))
    body.grid(g_sphere(1, 12, 8), trs3((x, 0.065, 0.05), scale=(0.085, 0.07, 0.17)), pal, 1, 'foot_' + S)
    body.grid(g_sphere(1, 12, 4, t0=PI * 0.62, tl=PI * 0.38), trs3((x, 0.07, 0.05), scale=(0.09, 0.06, 0.175)), pal, 9, 'foot_' + S)

# ลำตัว (เสื้อกันหนาว) + ปกเสื้อ + คอ
body.grid(lathe([(0.0, 1.6), (0.17, 1.59), (0.235, 1.55), (0.25, 1.46), (0.245, 1.3), (0.238, 1.12), (0.235, 0.98), (0.232, 0.86), (0.2, 0.82), (0.0, 0.82)], 18),
          trs3(), pal, 2, zb((1.42, 'chest'), (1.2, 'spine'), (1.02, 'spine'), (0.9, 'hips')))
body.grid(lathe([(0.115, 1.62), (0.14, 1.6), (0.165, 1.55), (0.15, 1.53)], 14), trs3(), pal, 3, 'chest')
body.grid(g_cyl(0.075, 0.085, 0.18, 10, 1, True), trs3((0, 1.64, 0)), T['skin'], None, zb((1.68, 'neck'), (1.6, 'neck'), (1.55, 'chest')))

# หัว หน้า ตา คิ้ว
body.grid(g_sphere(0.235, 22, 16), trs3((0, 1.86, 0), scale=(1, 1.08, 1)), T['skin'], None, 'head')
body.grid(g_sphere(1, 8, 6), trs3((0, 1.835, 0.232), scale=(0.028, 0.032, 0.024)), T['skin'], None, 'head')     # จมูก
for s in (-1, 1):
    body.grid(g_sphere(1, 8, 6), trs3((s * 0.232, 1.86, -0.005), scale=(0.02, 0.055, 0.04)), T['skin'], None, 'head')   # หู
    body.grid(g_sphere(0.038, 12, 8), trs3((s * 0.085, 1.865, 0.2)), pal, 3, 'head')
    body.grid(g_sphere(0.028, 12, 8), trs3((s * 0.085, 1.865, 0.221)), T['eyes'], None, 'head')
    body.grid(g_sphere(0.014, 8, 6), trs3((s * 0.085, 1.865, 0.238)), pal, 4, 'head')
    body.box((0.075, 0.016, 0.02), trs3((s * 0.088, 1.925, 0.218), rot=(0, 0, s * 0.12)), T['hair'], None, 'head')    # คิ้ว
body.grid(g_sphere(1, 10, 6, t0=PI * 0.5, tl=PI * 0.5), trs3((0, 1.775, 0.214), rot=(-0.25, 0, 0), scale=(0.045, 0.02, 0.015)), pal, 6, 'head')   # ปากยิ้ม

# แขนเสื้อ (บานปลาย) + มือ — แขนขวาอยู่ฝั่ง −x เหมือนโค้ด
for s, S in ((1, 'L'), (-1, 'R')):
    x = s * 0.33
    body.grid(g_sphere(0.098, 12, 8), trs3((x, 1.5, 0)), T['cloak'], None, 'upper_arm_' + S)
    body.grid(lathe([(0.088, 1.52), (0.095, 1.4), (0.11, 1.22), (0.13, 1.08), (0.16, 0.9), (0.165, 0.87)], 12), trs3((x, 0, 0)), T['cloak'], None,
              zb((1.24, 'upper_arm_' + S), (1.12, 'forearm_' + S)), recalc=False)
    body.grid(lathe([(0.15, 0.9), (0.155, 0.875), (0.12, 0.87)], 12), trs3((x, 0, 0)), T['house'], None, 'forearm_' + S, recalc=False)   # ขอบแขนเสื้อสีบ้าน
    body.grid(g_sphere(0.075, 12, 8), trs3((x, 0.86, 0.01), scale=(0.95, 1.1, 1)), T['skin'], None, 'hand_' + S)
    body.grid(g_sphere(0.03, 8, 6), trs3((x - s * 0.055, 0.88, 0.045)), T['skin'], None, 'hand_' + S)            # นิ้วโป้ง

# เสื้อคลุม (เปิดด้านหน้า) ด้านนอกสีเสื้อคลุม ด้านในสีบ้าน
GAP = 0.95
CL = [(0.3, 1.6), (0.355, 1.5), (0.4, 1.3), (0.47, 1.0), (0.58, 0.7), (0.7, 0.4), (0.8, 0.1)]
ANG = {'cloak_B': 0.0, 'cloak_L': PI / 2, 'cloak_R': -PI / 2}


def cloak_w(co):
    t = max(0.0, min(1.0, (1.56 - co.z) / 1.45))
    wc = t * t * (3 - 2 * t)
    phi = math.atan2(co.x, co.y)          # 0 = หลัง (+Y), +90° = ซ้าย (+X)
    aw = {b: max(0.0, math.cos(phi - a)) ** 1.5 for b, a in ANG.items()}
    sw = sum(aw.values()) or 1
    out = {b: wc * x / sw for b, x in aw.items()}
    up = 1 - wc
    k = max(0.0, min(1.0, (co.z - 1.15) / 0.25))
    out['chest'] = out.get('chest', 0) + up * k
    out['spine'] = out.get('spine', 0) + up * (1 - k)
    return out


for inner in (False, True):
    d = -0.014 if inner else 0.0
    rows = [[V(((r + d) * math.sin(GAP / 2 + (math.tau - GAP) * j / 28), y, (r + d) * math.cos(GAP / 2 + (math.tau - GAP) * j / 28))) for j in range(29)] for r, y in CL]
    vs, fs = body.grid((rows, False), trs3(), T['house'] if inner else T['cloak'], None, cloak_w, recalc=False)
    for f in fs:                          # หันหน้าออก (ด้านใน = หันเข้า)
        f.normal_update()
        c = f.calc_center_median()
        if (f.normal.x * c.x + f.normal.y * c.y > 0) == inner:
            f.normal_flip()
# ฮู้ดด้านหลังคอ
body.grid(g_sphere(0.3, 16, 8, 0, math.tau, 0, PI / 2), trs3((0, 1.5, -0.2), rot=(-1.75, 0, 0), scale=(0.85, 0.42, 0.75)), T['cloak'], None, 'chest', recalc=False)

# ผ้าพันคอลายทาง (สลับสีบ้าน 1/2) + ชายผ้า 2 เส้น
for k in range(6):
    body.grid(g_torus(0.17, 0.075, 8, 4, math.tau / 6), trs3((0, 1.6, 0), rot=(PI / 2, 0, k * math.tau / 6)), T['house'] if k % 2 == 0 else T['house2'], None, 'chest')
for (x, ln), bn in (((0.12, 0.5), 'scarf_1'), ((-0.11, 0.42), 'scarf_2')):
    n = 5
    ry = math.asin(x / 0.25)               # หันตามความโค้งของอก
    for i in range(n):
        body.box((0.12, ln / n, 0.035), trs3((x, 1.57 - (i + 0.5) * ln / n, 0.255), rot=(0, ry, 0)), T['house2'] if i % 2 else T['house'], None, bn)
    body.box((0.125, 0.03, 0.04), trs3((x, 1.57 - ln + 0.012, 0.255), rot=(0, ry, 0)), pal, 5, bn)   # ชายครุย

coll = bpy.context.scene.collection
ob = body.build('char_student')
rig = make_rig('student_rig', BONES)
skin(ob, rig)
rig.hide_render = True
parts = [rig, ob]


def rigid(name, fill, bone, mats):
    m = MB(mats)
    fill(m)
    o = m.build(name)
    bone_child(o, rig, bone)
    parts.append(o)
    return o


# ---------- ผม ----------
H = T['hair']
HCt = V((0, 1.88, -0.02))
UP = V((0, 1, 0))
BACK = [0.5, 0.6, 0.62, 0.55, 0.55, 0.62, 0.6, 0.6, 0.55, 0.55, 0.5]


def hair_base(m):
    m.grid(g_sphere(0.255, 24, 8, 0, math.tau, 0, PI * 0.34), trs3((0, 1.88, -0.02)), H)
    for sd in (-1, 1):
        m.grid(g_sphere(0.1, 12, 10), trs3((sd * 0.222, 1.91, 0.03), scale=(0.5, 1.2, 0.95)), H)


def hair_style(hs):
    def f(m):
        tie = T['house2']
        m.grid(g_sphere(0.255, 24, 10, PI, PI, 0, PI * BACK[hs]), trs3((0, 1.88, -0.02)), H, recalc=False)
        ball = lambda x, y, z, r, mt=H: m.grid(g_sphere(r, 10, 7) if hs == 8 else g_sphere(r, 12, 10), trs3((x, y, z)), mt)
        caps = lambda r, l, x, y, z, rx=0, rz=0, sc=(1, 1, 1): m.grid(g_capsule(r, l, 4, 10), trs3((x, y, z), rot=(rx, 0, rz), scale=sc), H)

        def tuft(dx, dy, dz, ln, rad):
            d = V((dx, dy, dz)).normalized()
            m.grid(g_cyl(0, rad, ln, 6), trs3(HCt + d * (0.23 + ln * 0.35), quat=UP.rotation_difference(d)), H)

        bangs = lambda w, y, z, k: m.grid(g_sphere(0.22, 18, 10), trs3((0, y, z), scale=(w, k, 0.62)), H)
        if hs == 0:
            m.grid(g_sphere(0.17, 14, 8), trs3((-0.06, 2.02, 0.17), rot=(0, 0, 0.28), scale=(1.05, 0.42, 0.6)), H)
            m.grid(g_sphere(0.13, 14, 8), trs3((0.1, 2.0, 0.17), rot=(0, 0, -0.2), scale=(0.9, 0.4, 0.55)), H)
        elif hs == 1:
            bangs(1.05, 2.0, 0.17, 0.36); ball(-0.2, 1.93, 0.11, 0.06); ball(0.2, 1.93, 0.11, 0.06)
        elif hs == 2:
            caps(0.17, 0.5, 0, 1.6, -0.17, sc=(1.25, 1, 0.55))
            for s in (-1, 1):
                caps(0.045, 0.34, s * 0.215, 1.72, 0.04)
            bangs(1.0, 2.0, 0.17, 0.3)
        elif hs == 3:
            ball(0, 2.14, -0.08, 0.12)
            m.grid(g_torus(0.115, 0.022, 6, 16), trs3((0, 2.06, -0.08), rot=(PI / 2, 0, 0)), tie)
        elif hs == 4:
            for x, y, z in ((0.3, 1, 0.5), (-0.4, 1, 0.4), (0, 1, 0.75), (0.6, 0.9, 0), (-0.6, 0.9, 0.1), (0.2, 1, -0.5), (-0.3, 1, -0.4), (0.7, 0.5, -0.3), (-0.7, 0.5, -0.2)):
                tuft(x, y, z, 0.2, 0.075)
        elif hs == 5:
            m.grid(g_sphere(0.285, 24, 12, PI * 0.85, PI * 1.3, PI * 0.3, PI * 0.52), trs3((0, 1.82, -0.04)), H, recalc=False)
            bangs(1.0, 2.0, 0.17, 0.32)
        elif hs == 6:
            ball(0, 1.93, -0.27, 0.045, tie); caps(0.075, 0.42, 0, 1.7, -0.4, 0.45)
        elif hs == 7:
            for i in range(5):
                ball(0, 1.78 - 0.11 * i, -0.29, 0.085 - 0.009 * i)
            ball(0, 1.2, -0.29, 0.04, tie)
        elif hs == 8:
            ball(0, 2.12, -0.02, 0.12)
            for th in (0.3, 0.5, 0.68):
                for k in range(8):
                    ph = k / 8 * math.tau
                    if th > 0.42 and math.sin(ph) > 0.35:
                        continue
                    r = 0.265 * math.sin(th * PI)
                    ball(math.cos(ph) * r, 1.88 + 0.265 * math.cos(th * PI), -0.02 + math.sin(ph) * r, 0.1)
        elif hs == 9:
            for s in (-1, 1):
                ball(s * 0.26, 1.94, -0.02, 0.04, tie); caps(0.07, 0.36, s * 0.3, 1.74, -0.04, 0, -s * 0.3)
        elif hs == 10:
            for x, y, z in ((0, 1, 0), (0.5, 1, 0.2), (-0.5, 1, 0.2), (0.3, 1, -0.5), (-0.3, 1, -0.5), (0.85, 0.7, 0), (-0.85, 0.7, 0), (0, 1, 0.6)):
                tuft(x, y, z, 0.3, 0.09)
    return f


rigid('hair_base', hair_base, 'head', [H])
for hs in range(11):
    rigid('hair_%d' % hs, hair_style(hs), 'head', [H, T['house2']])


# ---------- เนคไท (0 ลายทาง / 1 สีบ้าน / 2 สีรอง / 3 ไม่มี) ----------
def tie(ti):
    def f(m):
        hm, h2 = T['house'], T['house2']
        m.box((0.085, 0.07, 0.05), trs3((0, 1.51, 0.243)), h2 if ti == 2 else hm)
        n = 6
        for i in range(n):
            w = 0.095 * (1 - 0.15 * i / n)
            mt = (hm if i % 2 == 0 else h2) if ti == 0 else (hm if ti == 1 else h2)
            m.box((w, 0.3 / n, 0.026), trs3((0, 1.49 - (i + 0.5) * 0.3 / n, 0.252 - 0.004 * i / n), rot=(-0.06, 0, 0)), mt)
        m.grid(g_cyl(0.0, 0.048, 0.05, 4, 1, False, PI / 4), trs3((0, 1.165, 0.249), rot=(PI, 0, 0), scale=(1, 1, 0.27)), h2 if ti == 2 or ti == 0 else hm)
    return f


for ti in range(3):
    rigid('tie_%d' % ti, tie(ti), 'chest', [T['house'], T['house2']])


# ---------- ไม้กายสิทธิ์ (ติดมือขวา ยื่นต่อลงไปตามแขนเหมือนโค้ด) ----------
AX_, AY_ = -0.33, 1.5


def wand(ws):
    def f(m):
        W = T['wand']
        at = lambda y, x=0.0, z=0.0: (AX_ + x, AY_ + y, z)
        m.grid(g_cyl(0.021, 0.011, 0.48, 8, 3), trs3(at(-0.86)), W)
        m.grid(g_sphere(0.011, 6, 4), trs3(at(-1.1)), W)
        if ws == 0:
            m.grid(g_sphere(0.034, 8, 6), trs3(at(-0.64)), W)
            m.grid(g_cyl(0.026, 0.024, 0.12, 8), trs3(at(-0.7)), W)
        elif ws == 1:
            for i in range(7):
                m.grid(g_torus(0.024 - i * 0.0014, 0.006, 5, 10), trs3(at(-0.7 - i * 0.055), rot=(PI / 2 + 0.35, 0, 0)), W)
        elif ws == 2:
            m.grid(g_sphere(0.04, 8, 6), trs3(at(-0.65)), W)
            for y, r in ((-0.72, 0.034), (-0.84, 0.028), (-0.95, 0.026)):
                m.grid(g_sphere(r, 8, 6), trs3(at(y, 0.007)), W)
        else:
            m.grid(g_cyl(0.031, 0.031, 0.13, 10), trs3(at(-0.71)), pal, 5)
            for y in (-0.79, -1.0):
                m.grid(g_torus(0.024, 0.007, 6, 12), trs3(at(y), rot=(PI / 2, 0, 0)), pal, 5)
            m.grid(g_sphere(0.02, 8, 6), trs3(at(-1.1)), pal, 5)
    return f


for ws in range(4):
    rigid('wand_%d' % ws, wand(ws), 'hand_R', [T['wand'], pal])

# ---------- ท่า ----------
A = Anim(rig)
S_, C_ = math.sin, math.cos


def base():
    return {'upper_arm_L': [('y', -5)], 'upper_arm_R': [('x', -20), ('y', 5)], 'forearm_L': [('x', -8)]}


def cyc(name, L, step, fn):
    act = A.begin(name)
    for f in range(0, L + 1, step):
        ph = math.tau * f / L
        p = base()
        loc = fn(p, ph)
        A.key(p, f, loc)
    A.end(act, L, True)


def idle(p, ph):
    add(p, 'chest', 'x', 1.5 * S_(ph)); add(p, 'spine', 'x', -1 * S_(ph))
    add(p, 'head', 'z', 7 * S_(ph)); add(p, 'head', 'x', 2 * S_(2 * ph))
    add(p, 'upper_arm_L', 'x', 3 * S_(ph + 1)); add(p, 'upper_arm_R', 'x', 2 * S_(ph + 1.3))
    add(p, 'cloak_B', 'x', 2 + 2 * S_(ph + 0.6)); add(p, 'cloak_L', 'z', 2 * S_(ph)); add(p, 'cloak_R', 'z', 2 * S_(ph + 0.4))
    add(p, 'scarf_1', 'x', -2 * S_(ph + 1)); add(p, 'scarf_2', 'x', -2 * S_(ph + 1.5)); add(p, 'scarf_1', 'z', 3 * S_(ph))
    return (0, 0, -0.006 + 0.005 * S_(ph))


def walk(p, ph):
    add(p, 'thigh_L', 'x', -30 * S_(ph)); add(p, 'thigh_R', 'x', 30 * S_(ph))
    add(p, 'shin_L', 'x', 40 * max(0.0, C_(ph))); add(p, 'shin_R', 'x', 40 * max(0.0, -C_(ph)))
    add(p, 'foot_L', 'x', 14 * S_(ph)); add(p, 'foot_R', 'x', -14 * S_(ph))
    add(p, 'hips', 'z', 5 * S_(ph)); add(p, 'spine', 'z', -7 * S_(ph)); add(p, 'spine', 'x', 3)
    add(p, 'upper_arm_L', 'x', 24 * S_(ph)); add(p, 'upper_arm_R', 'x', -14 * S_(ph))
    add(p, 'forearm_L', 'x', -12 * max(0.0, -S_(ph)))
    add(p, 'head', 'z', 3 * S_(ph)); add(p, 'head', 'x', 2 * C_(2 * ph))
    add(p, 'cloak_B', 'x', 8 + 3 * C_(2 * ph)); add(p, 'cloak_L', 'x', 4 + 4 * S_(ph)); add(p, 'cloak_R', 'x', 4 - 4 * S_(ph))
    add(p, 'scarf_1', 'z', 6 * S_(ph)); add(p, 'scarf_2', 'z', 5 * S_(ph + 0.5))
    return (0, 0, -0.015 + 0.03 * abs(C_(ph)))


def run(p, ph):
    add(p, 'spine', 'x', 14); add(p, 'chest', 'x', 4); add(p, 'head', 'x', -14)
    add(p, 'thigh_L', 'x', -48 * S_(ph) - 10); add(p, 'thigh_R', 'x', 48 * S_(ph) - 10)
    add(p, 'shin_L', 'x', 20 + 75 * max(0.0, C_(ph))); add(p, 'shin_R', 'x', 20 + 75 * max(0.0, -C_(ph)))
    add(p, 'foot_L', 'x', 20 * S_(ph)); add(p, 'foot_R', 'x', -20 * S_(ph))
    add(p, 'hips', 'z', 9 * S_(ph)); add(p, 'spine', 'z', -11 * S_(ph))
    add(p, 'upper_arm_L', 'x', 48 * S_(ph) - 5); add(p, 'upper_arm_L', 'y', -10); add(p, 'forearm_L', 'x', -55)
    add(p, 'upper_arm_R', 'x', -28 * S_(ph) - 25); add(p, 'upper_arm_R', 'y', 8)
    add(p, 'cloak_B', 'x', 30 + 6 * C_(2 * ph)); add(p, 'cloak_L', 'x', 18 + 5 * S_(ph)); add(p, 'cloak_R', 'x', 18 - 5 * S_(ph))
    add(p, 'cloak_L', 'z', 6); add(p, 'cloak_R', 'z', -6)
    add(p, 'scarf_1', 'z', 12 * S_(2 * ph)); add(p, 'scarf_2', 'z', 10 * S_(2 * ph + 1)); add(p, 'scarf_1', 'x', -10); add(p, 'scarf_2', 'x', -8)
    return (0, -0.04, -0.04 + 0.07 * abs(C_(ph)))


def fly(p, ph):
    for s, S in ((1, 'L'), (-1, 'R')):
        add(p, 'thigh_' + S, 'x', -76); add(p, 'thigh_' + S, 'z', s * 6)
        add(p, 'shin_' + S, 'x', 82 + 3 * S_(ph + s)); add(p, 'foot_' + S, 'x', -18)
        add(p, 'cloak_' + S, 'x', 42 + 5 * S_(ph * 2 + s)); add(p, 'cloak_' + S, 'z', s * 10)
    add(p, 'spine', 'x', 10); add(p, 'chest', 'x', 4 + 1.5 * S_(ph)); add(p, 'head', 'x', -16)
    p['upper_arm_L'] = [('x', -58 + 2 * S_(ph)), ('y', 16)]; add(p, 'forearm_L', 'x', -14)
    p['upper_arm_R'] = [('x', -60), ('y', -14)]
    add(p, 'cloak_B', 'x', 58 + 6 * S_(ph * 2))
    add(p, 'scarf_1', 'x', -35 + 8 * S_(ph * 2)); add(p, 'scarf_2', 'x', -30 + 8 * S_(ph * 2 + 1)); add(p, 'scarf_1', 'z', 10 * S_(ph * 2))
    return (0, 0, 0.012 * S_(ph))


cyc('idle', 60, 3, idle)
cyc('walk', 16, 1, walk)
cyc('run', 12, 1, run)
cyc('fly', 40, 2, fly)

# cast (ครั้งเดียว 12 เฟรม): บิดตัวง้าง → ตวัดไม้ไปข้างหน้า → คืนท่า
act = A.begin('cast')
for f, w, k, r in ((0, 0, 0, 0), (3, 1, 0, 0), (5, 0, 1, 0), (8, 0, 0.8, 0.3), (12, 0, 0, 1)):
    p = base()
    add(p, 'chest', 'z', 12 * w - 14 * k); add(p, 'spine', 'z', 5 * w - 6 * k); add(p, 'spine', 'x', 6 * k)
    add(p, 'head', 'z', -4 * w + 6 * k)
    add(p, 'upper_arm_R', 'x', -40 * w - 75 * k); add(p, 'upper_arm_R', 'y', 10 * w)
    add(p, 'upper_arm_L', 'x', -15 * w + 12 * k); add(p, 'upper_arm_L', 'y', -14 * w - 24 * k); add(p, 'forearm_L', 'x', -20 * w)
    add(p, 'thigh_L', 'x', -12 * k); add(p, 'shin_L', 'x', 8 * k); add(p, 'thigh_R', 'x', 8 * k)
    add(p, 'cloak_B', 'x', 2 + 10 * k); add(p, 'cloak_L', 'x', 6 * k); add(p, 'cloak_R', 'x', 8 * k)
    add(p, 'scarf_1', 'x', -10 * k); add(p, 'scarf_2', 'x', -8 * k)
    A.key(p, f, (0, -0.05 * k + 0.02 * w, -0.02 * k))
A.end(act, 12)

# hit (ครั้งเดียว 10 เฟรม): เซถอยหลัง
act = A.begin('hit')
for f, k in ((0, 0), (2, 1), (4, 0.85), (10, 0)):
    p = base()
    add(p, 'spine', 'x', -14 * k); add(p, 'chest', 'x', -10 * k); add(p, 'head', 'x', -20 * k); add(p, 'head', 'z', 10 * k)
    add(p, 'upper_arm_L', 'y', -30 * k); add(p, 'upper_arm_L', 'x', -18 * k); add(p, 'upper_arm_R', 'y', 25 * k)
    add(p, 'thigh_L', 'x', 10 * k); add(p, 'thigh_R', 'x', -6 * k)
    add(p, 'cloak_B', 'x', -8 * k); add(p, 'scarf_1', 'x', -18 * k); add(p, 'scarf_2', 'x', -15 * k)
    A.key(p, f, (0, 0.08 * k, -0.02 * k))
A.end(act, 10)

# down (ครั้งเดียว ค้างเฟรมสุดท้าย): ตัวนอนหงายมาจากโค้ด (o.b หมุน) — ท่านี้คือแขนขาหมดแรงกางออก
act = A.begin('down')
for f, k, o in ((0, 0, 0), (6, 1, 1), (16, 1, 0)):
    p = base()
    p['upper_arm_L'] = [('y', -(5 + 70 * k + 15 * o)), ('x', -10 * k)]
    p['upper_arm_R'] = [('y', 5 + 65 * k + 15 * o), ('x', -10 * k)]
    add(p, 'forearm_L', 'x', -20 * k); add(p, 'forearm_R', 'x', -15 * k)
    add(p, 'head', 'z', 35 * k); add(p, 'head', 'x', -8 * k)
    add(p, 'thigh_L', 'x', -22 * k); add(p, 'thigh_L', 'z', 10 * k); add(p, 'shin_L', 'x', 38 * k)
    add(p, 'thigh_R', 'z', -8 * k); add(p, 'foot_L', 'x', 10 * k); add(p, 'foot_R', 'x', 20 * k)
    add(p, 'spine', 'x', -5 * k); add(p, 'cloak_L', 'z', 25 * k); add(p, 'cloak_R', 'z', -25 * k)
    A.key(p, f)
A.end(act, 16)
A.rest()

info = {'tris': tris(ob), 'parts': {o.name: tris(o) for o in parts if o.type == 'MESH'}, 'anims': A.made}
size = export(parts, 'assets/chars/student.glb', anim=True)

# ---------- ไม้กวาด char_broom (origin = จุดนั่ง, หน้า = −Y, ตรงกับกลุ่ม broom ในโค้ด) ----------
bm = MB([pal])   # ไม้ + ฟาง อยู่ใน palette เดียว
rows = []                                  # ด้ามโค้งนิดๆ
for i in range(13):
    t = i / 12
    zf = 1.42 - 2.5 * t                     # three z (หน้า +)
    yc = 0.03 * math.sin(t * PI) - 0.02 * t
    r = 0.036 + 0.016 * t
    rows.append([V((r * math.sin(math.tau * j / 8), yc + r * math.cos(math.tau * j / 8), zf)) for j in range(9)])
bm.grid((rows, True), trs3(), pal, 7)
bm.grid(g_sphere(0.045, 8, 6), trs3((0, 0.0, 1.43)), pal, 7)
for z in (-0.92, -1.02):
    bm.grid(g_torus(0.075, 0.022, 6, 12), trs3((0, -0.02, z)), pal, 5)
# ฟาง: กรวยบานด้านหลัง + ปลายแฉก
rows = []
for i in range(7):
    t = i / 6
    zf = -0.95 - 0.95 * t
    r = 0.07 + 0.22 * math.sin(min(1, t * 1.2) * PI / 2) + 0.03 * t
    rows.append([V(((r + (0.05 * t if j % 2 else -0.02 * t)) * math.sin(math.tau * j / 16), -0.02 + (r + (0.05 * t if j % 2 else -0.02 * t)) * math.cos(math.tau * j / 16) * 0.85, zf - (0.12 * t if j % 2 else 0))) for j in range(17)])
rows.append([V((0, -0.02, -1.95)) for _ in range(17)])
bm.grid((rows, True), trs3(), pal, 8, smooth=False)
for k in range(10):                         # ฟางเส้นยื่นออกมา
    a = k / 10 * math.tau
    bm.grid(g_cyl(0.012, 0.004, 0.5, 4), trs3((math.sin(a) * 0.2, -0.02 + math.cos(a) * 0.17, -1.72), rot=(PI / 2 + 0.1 * math.cos(a), 0, 0)), pal, 10 if k % 2 else 8)
bo = bm.build('char_broom')
binfo = tris(bo)
bsize = export([bo], 'assets/chars/broom.glb')
bo.location.x = 2
save_blend('assets/src/student.blend')
print('RESULT', info, 'glb', size, 'broom', binfo, bsize)
