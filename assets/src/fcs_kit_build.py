# fcs_kit_build.py — ชุดชิ้นส่วนตกแต่งแผนที่บุกปราสาท First Castle Strike (โหมด siege)
# รัน:  D:\Blender\blender.exe -b --factory-startup --python assets/src/fcs_kit_build.py
# ได้:  assets/fcs/fcs_kit.glb (ทุกชิ้นในไฟล์เดียว ชื่อ object = ชื่อชิ้น) + assets/src/fcs_kit.blend
# เกมวางเองตามตารางกำแพงของแผนที่ (js/28-fcs-build.js fcsKitPlace) — ชิ้นหน้าตาเท่านั้น ที่ชนยังเป็นของเดิมในโค้ด
# พิกัดแบบ three: y ขึ้น • ชิ้นแนวขอบ (merlon/plinth/banner/torch/buttress) จุดกำเนิด = กลางขอบช่อง, +z = หันออกนอกกำแพง, x = ตามขอบ
# ช่อง 1 ช่อง = 4.5 ม. (FCS_C 90 px) • กำแพงทึบสูง 6 ม. • กำแพงเตี้ย 1.2 ม. • รั้ว 1.1 ม.
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from _kit import *

reset()
R = random.Random(11)
CW = 4.5
# palette: 0 หินอ่อน 1 หินกลาง 2 หินเข้ม 3 หินขอบ(ครีม) 4 ไม้ 5 ไม้เข้ม 6 เหล็ก 7 ผ้าน้ำเงิน 8 ผ้าทอง 9 ผ้าแดง 10 หลังคาเทาฟ้า 11 มอส 12 ทองเหลือง
PAL = ['#9a917f', '#857c6c', '#665f50', '#a69a80', '#8a6238', '#5a3f28', '#55565e', '#2f4f9a', '#e0b84a', '#9a2f2f', '#4d6a86', '#5f7f3a', '#c8a050']
pal = mat('fcs_pal', img=palette('fcs_pal', PAL + ['#ffffff'] * (16 - len(PAL)), noise={0: 0.07, 1: 0.08, 2: 0.08, 3: 0.05, 4: 0.12, 5: 0.1}), rough=0.9)
OUT = []


def jit(k):
    return R.uniform(-k, k)


def stone(m, w, h, d, x, y, z, sw=None, j=0.06):
    """ก้อนหิน 1 ก้อน (กล่องเอียงนิด ๆ)"""
    sw = R.choice((0, 1, 1, 2)) if sw is None else sw
    m.box((w * (1 + jit(j)), h * (1 + jit(j)), d * (1 + jit(j))), trs3((x, y, z), (jit(0.04), jit(0.08), jit(0.04))), pal, sw)


def piece(name, fn):
    m = MB([pal])
    fn(m)
    OUT.append(m.build(name))


# ---------- ขอบบนกำแพง: ใบเสมา 2 อัน + ขอบยื่น ----------
def merlons(m):
    m.box((CW, 0.28, 1.0), trs3((0, 0.14, 0.12)), pal, 3)                     # ขอบยื่นออกนอกกำแพง
    for x in (-CW * 0.27, CW * 0.27):
        stone(m, 1.15, 1.05, 0.72, x, 0.28 + 0.52, 0.18, 1, 0.03)
        m.box((1.25, 0.14, 0.82), trs3((x, 0.28 + 1.07, 0.18)), pal, 3)        # ฝาใบเสมา
piece('merlon', merlons)


# ---------- ฐานกำแพง: หินก้อนใหญ่เรียง (กันพื้นกับผนังดูแบน) ----------
def plinth(m):
    x = -CW / 2
    while x < CW / 2 - 0.2:
        w = min(R.uniform(0.9, 1.5), CW / 2 - x)
        stone(m, w - 0.05, R.uniform(0.55, 0.75), 0.42, x + w / 2, 0.3, 0.08, 2, 0.05)
        x += w
piece('plinth', plinth)


# ---------- ค้ำยัน (บางขอบ) ----------
def buttress(m):
    for i, (w, h, d) in enumerate(((1.0, 2.2, 1.0), (0.85, 1.8, 0.75), (0.7, 1.6, 0.5))):
        y = sum((2.2, 1.8, 1.6)[:i])
        m.box((w, h, d), trs3((0, y + h / 2, d / 2)), pal, 1 if i else 2)
    m.box((0.8, 0.25, 0.65), trs3((0, 5.7, 0.32), (-0.35, 0, 0)), pal, 3)
piece('buttress', buttress)


# ---------- หอคอยมุม (กลม หลังคากรวย) ----------
def tower(m):
    r, h = 2.5, 8.5
    m.grid(g_cyl(r, r * 1.08, h, 16, 1, True), trs3((0, h / 2, 0)), pal, 1)
    for y in (2.6, 5.4):                                                      # แนวหินคาด
        m.grid(g_cyl(r + 0.12, r + 0.12, 0.3, 16, 1, True), trs3((0, y, 0)), pal, 3)
    m.grid(g_cyl(r + 0.45, r + 0.1, 0.7, 16, 1, False), trs3((0, h + 0.35, 0)), pal, 3)   # ชายคาหิน
    for k in range(10):                                                      # ใบเสมารอบ
        a = k / 10 * math.tau
        stone(m, 0.9, 0.95, 0.55, math.sin(a) * (r + 0.25), h + 1.15, math.cos(a) * (r + 0.25), 1, 0.03)
    m.grid(g_cyl(0.02, r + 0.15, 4.2, 16, 1, False), trs3((0, h + 0.7 + 2.1 + 0.6, 0)), pal, 10)   # หลังคากรวย
    m.grid(g_cyl(0.05, 0.05, 1.2, 6, 1, False), trs3((0, h + 6.2, 0)), pal, 12)
    for k in range(4):                                                       # ช่องยิงธนู (มืด)
        a = k / 4 * math.tau + 0.4
        m.box((0.35, 1.2, 0.2), trs3((math.sin(a) * (r + 0.02), 6.6, math.cos(a) * (r + 0.02)), (0, a, 0)), pal, 5)
piece('tower', tower)


# ---------- ธงห้อยผนัง ----------
def banner(m):
    m.box((1.7, 0.1, 0.1), trs3((0, 0, 0.35)), pal, 5)                         # คานไม้
    for x in (-0.75, 0.75):
        m.box((0.08, 0.5, 0.08), trs3((x, -0.2, 0.18), (0.6, 0, 0)), pal, 6)
    m.box((1.4, 3.0, 0.05), trs3((0, -1.5, 0.38)), pal, 7)                     # ผ้า
    m.box((1.4, 0.18, 0.06), trs3((0, -0.18, 0.39)), pal, 8)
    m.box((1.4, 0.12, 0.06), trs3((0, -2.85, 0.39)), pal, 8)
    rows = [[V((-0.7, -3.0, 0.38)), V((0.7, -3.0, 0.38))], [V((0.0, -3.7, 0.38)), V((0.0, -3.7, 0.38))]]   # ปลายสามเหลี่ยม
    m.grid((rows, False), trs3(), pal, 7, recalc=False)
    m.grid(([list(reversed(rows[0])), list(reversed(rows[1]))], False), trs3(), pal, 7, recalc=False)
    m.box((0.5, 0.5, 0.06), trs3((0, -1.4, 0.42), (0, 0, math.pi / 4)), pal, 8)   # ตราสัญลักษณ์
piece('banner', banner)


# ---------- คบเพลิงผนัง (เปลวไฟใส่ในเกม) ----------
def torch(m):
    m.box((0.3, 0.45, 0.08), trs3((0, 0, 0.04)), pal, 6)                       # แผ่นยึด
    m.box((0.08, 0.08, 0.55), trs3((0, -0.05, 0.3), (0.5, 0, 0)), pal, 6)
    m.grid(g_cyl(0.22, 0.1, 0.3, 8, 1, False), trs3((0, 0.18, 0.55)), pal, 6)   # ถ้วย
    m.grid(g_cyl(0.18, 0.18, 0.06, 8, 1, False), trs3((0, 0.33, 0.55)), pal, 5)
piece('torch', torch)


# ---------- กำแพงเตี้ยกำบัง (เต็มช่อง 4.5 ม. สูง ~1.2) ----------
def lowwall(m):
    for row in range(2):
        x = -CW / 2 + 0.1
        y = 0.3 + row * 0.55
        while x < CW / 2 - 0.25:
            w = min(R.uniform(0.7, 1.2), CW / 2 - 0.1 - x)
            stone(m, w - 0.06, 0.55, 1.1 - row * 0.15, x + w / 2, y, jit(0.06), None, 0.08)
            x += w
    m.box((CW - 0.2, 0.16, 0.95), trs3((0, 1.2, 0)), pal, 3)
    for k in range(3):                                                       # หินร่วงที่ฐาน
        stone(m, R.uniform(0.35, 0.6), 0.3, R.uniform(0.35, 0.6), R.uniform(-1.8, 1.8), 0.15, R.choice((-0.8, 0.8)), 2, 0.2)
    m.box((R.uniform(0.6, 1.2), 0.05, 0.5), trs3((R.uniform(-1, 1), 1.29, 0.1)), pal, 11)   # มอสบนสัน
piece('lowwall', lowwall)


# ---------- รั้วไม้ (ตามแนว x ยาวเต็มช่อง) ----------
def fence(m):
    for x in (-CW / 2 + 0.15, 0, CW / 2 - 0.15):
        m.box((0.18, 1.2, 0.18), trs3((x, 0.6, 0), (0, jit(0.2), jit(0.04))), pal, 5)
        m.grid(g_cyl(0.01, 0.13, 0.18, 4, 1, False), trs3((x, 1.29, 0), (0, math.pi / 4, 0)), pal, 5)
    for y in (0.45, 0.9):
        m.box((CW, 0.12, 0.07), trs3((0, y + jit(0.03), 0.1), (0, 0, jit(0.03))), pal, 4)
piece('fence', fence)


# ---------- เสาหิน (ฐาน + ลำ + หัวเสา) สูง 6 ม. ----------
def column(m):
    m.box((1.7, 0.45, 1.7), trs3((0, 0.22, 0)), pal, 2)
    m.box((1.45, 0.3, 1.45), trs3((0, 0.6, 0)), pal, 3)
    m.grid(g_cyl(0.62, 0.68, 4.6, 12, 1, True), trs3((0, 3.05, 0)), pal, 0)
    for k in range(12):                                                      # ร่องเสา
        a = k / 12 * math.tau
        m.box((0.08, 4.4, 0.06), trs3((math.sin(a) * 0.66, 3.05, math.cos(a) * 0.66), (0, a, 0)), pal, 1)
    m.box((1.45, 0.35, 1.45), trs3((0, 5.55, 0)), pal, 3)
    m.box((1.7, 0.25, 1.7), trs3((0, 5.85, 0)), pal, 0)
piece('column', column)


# ---------- ลังไม้กำบัง (1.25 ม.) + ลังเล็กบน (บางกอง) ----------
def crate(m, s=1.25, y0=0.0, rot=0.0):
    M = lambda p, r=(0, 0, 0), sc=(1, 1, 1): trs3((p[0], y0 + p[1], p[2]), (r[0], rot + r[1], r[2]), sc)
    m.box((s, s, s), M((0, s / 2, 0)), pal, 4)
    t = 0.09
    for sx in (-1, 1):                                                       # คานขอบ
        for sz in (-1, 1):
            m.box((t, s + 0.02, t), M((sx * (s / 2 - t / 2 + 0.01), s / 2, sz * (s / 2 - t / 2 + 0.01))), pal, 5)
    for sy in (0, 1):
        for a in (0, math.pi / 2):
            m.box((s + 0.03, t, t), M((0, sy * s, 0), (0, a, 0)), pal, 5)
            for sz in (-1, 1):
                m.box((s + 0.02, t, t), M((0, t / 2 + sy * (s - t), sz * (s / 2 + 0.005)), (0, a, 0)), pal, 5)
    m.box((s * 1.25, t * 0.9, 0.05), M((0, s / 2, s / 2 + 0.02), (0, 0, math.pi / 4)), pal, 5)   # คานทแยง
    m.box((s * 1.25, t * 0.9, 0.05), M((0, s / 2, -s / 2 - 0.02), (0, 0, -math.pi / 4)), pal, 5)
piece('crate', lambda m: (crate(m), crate(m, 0.7, 1.25, 0.5)))
piece('crate2', lambda m: crate(m, 1.25, 0, 0.25))


# ---------- กองหินร่วง (ประดับโคนกำแพง) ----------
def rubble(m):
    for k in range(6):
        stone(m, R.uniform(0.3, 0.75), R.uniform(0.25, 0.5), R.uniform(0.3, 0.7), R.uniform(-0.9, 0.9), 0.15, R.uniform(-0.5, 0.5), R.choice((1, 2)), 0.25)
piece('rubble', rubble)

print('pieces', [o.name for o in OUT], 'tris', sum(tris(o) for o in OUT))
print('size', export(OUT, 'assets/fcs/fcs_kit.glb'))
save_blend('assets/src/fcs_kit.blend')
