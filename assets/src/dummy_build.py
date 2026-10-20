# dummy_build.py — หุ่นซ้อม enemy_dummy (สูง ~2.4) พร้อมกระดูกและท่า idle / hit / attack
# รัน:  D:\Blender\blender.exe -b --factory-startup --python assets/src/dummy_build.py
# ได้:  assets/enemies/dummy.glb + assets/src/dummy.blend   (หน้า = −Y, เป้าอยู่ที่หน้าอก)
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from _kit import *

reset()
PI = math.pi
R = random.Random(5)
# palette: 0 ไม้เสา 1 ไม้เข้ม 2 ฟาง 3 ฟางเข้ม/เชือก 4 กระสอบ 5 ด้ายเย็บ 6 ขาว 7 แดง 8 ฟางอ่อน
PAL = ['#6a4a2a', '#4a3018', '#c8a060', '#8a6a34', '#b89a70', '#3a2a1a', '#f4f0e8', '#d02a2a', '#e0c080']
pal = mat('dummy_pal', img=palette('dummy_pal', PAL + ['#ffffff'] * (16 - len(PAL)), noise={0: 0.1, 1: 0.1, 2: 0.14, 3: 0.12, 4: 0.08, 8: 0.12}), rough=0.95)

BONES = [
    ('root', (0, 0, 0), (0, 0.3, 0), None),
    ('body', (0, 0, 0.12), (0, 0, 1.85), 'root'),
    ('head', (0, 0, 1.82), (0, 0, 2.35), 'body'),
    ('arm_L', (0.12, 0, 1.55), (0.68, 0, 1.55), 'body'),
    ('arm_R', (-0.12, 0, 1.55), (-0.68, 0, 1.55), 'body'),
]
m = MB([pal], [b[0] for b in BONES])


def lathe(prof, rs=14):
    return [[V((r * math.sin(math.tau * j / rs), y, r * math.cos(math.tau * j / rs))) for j in range(rs + 1)] for r, y in prof], True


# ฐานไม้กากบาท + เสา
for a in (0, PI / 2):
    m.box((1.1, 0.1, 0.16), trs3((0, 0.05, 0), rot=(0, a + PI / 4, 0)), pal, 1, 'root')
m.grid(g_cyl(0.075, 0.095, 2.0, 8), trs3((0, 1.0, 0)), pal, 0, lambda co: {'root': 1.0} if co.z < 0.15 else {'body': 1.0})
# ตัวฟาง (ป่องนิดๆ) + เชือกมัด
m.grid(lathe([(0.0, 1.86), (0.3, 1.84), (0.4, 1.75), (0.42, 1.45), (0.4, 1.15), (0.34, 0.86), (0.2, 0.8), (0.0, 0.8)], 16), trs3(), pal, 2, 'body')
for y, r in ((1.7, 0.41), (0.98, 0.385)):
    m.grid(g_torus(r, 0.025, 5, 18), trs3((0, y, 0), rot=(PI / 2, 0, 0)), pal, 3, 'body')
for i in range(14):                                   # ฟางแหย่ออกมาที่ชายล่าง
    a = i / 14 * math.tau + R.uniform(-0.15, 0.15)
    m.grid(g_cyl(0.025, 0.0, 0.22, 4), trs3((math.sin(a) * 0.3, 0.75, math.cos(a) * 0.3), rot=(PI + 0.5 * math.cos(a), 0, -0.5 * math.sin(a))), pal, 8 if i % 2 else 2, 'body')
# แขนไม้ + ฟางปลายแขน
for s, S in ((1, 'L'), (-1, 'R')):
    m.grid(g_cyl(0.055, 0.055, 0.62, 8), trs3((s * 0.38, 1.55, 0), rot=(0, 0, PI / 2)), pal, 0, 'arm_' + S)
    for k in range(6):
        a = k / 6 * math.tau
        m.grid(g_cyl(0.035, 0.0, 0.26, 4), trs3((s * 0.74, 1.55 + 0.05 * math.cos(a), 0.05 * math.sin(a)), rot=(0.35 * math.sin(a), 0, -s * (PI / 2 - 0.3 * math.cos(a)))), pal, 8 if k % 2 else 2, 'arm_' + S)
    m.grid(g_torus(0.07, 0.018, 4, 10), trs3((s * 0.64, 1.55, 0), rot=(0, PI / 2, 0)), pal, 3, 'arm_' + S)
# หัวกระสอบ + ตาเย็บกากบาท + ปากเย็บ + ปมผูกคอ
m.grid(g_sphere(0.28, 16, 12), trs3((0, 2.06, 0), scale=(1, 1.05, 0.95)), pal, 4, 'head')
m.grid(g_cyl(0.12, 0.16, 0.12, 12), trs3((0, 1.84, 0)), pal, 3, 'head')
for s in (-1, 1):
    for r in (0.7, -0.7):
        m.box((0.11, 0.022, 0.02), trs3((s * 0.095, 2.11, 0.255), rot=(0, 0, r)), pal, 5, 'head')
for i in range(5):
    m.box((0.035, 0.016, 0.016), trs3((-0.08 + i * 0.04, 1.985 + 0.012 * math.sin(i / 4 * PI), 0.258), rot=(0, 0, 0.6 if i % 2 else -0.6)), pal, 5, 'head')
# เป้าที่หน้าอก (ขาว + วงแดง + จุดแดง) — วงกลมแบนหันไปหน้า
for r, z, sw in ((0.27, 0.425, 6), (0.19, 0.43, 7), (0.13, 0.435, 6), (0.06, 0.44, 7)):
    m.grid(g_cyl(r, r, 0.012, 24), trs3((0, 1.35, z), rot=(PI / 2, 0, 0)), pal, sw, 'body')

ob = m.build('enemy_dummy')
rig = make_rig('dummy_rig', BONES)
skin(ob, rig)
rig.hide_render = True

A = Anim(rig)
S_ = math.sin
act = A.begin('idle')                                  # โยกเบาๆ ตามลม
L = 90
for f in range(0, L + 1, 5):
    ph = math.tau * f / L
    A.key({'body': [('x', 1.2 * S_(ph)), ('y', 0.8 * S_(ph + 1))], 'head': [('z', 4 * S_(ph + 0.5)), ('x', 1.5 * S_(2 * ph))],
           'arm_L': [('y', 2 * S_(ph + 2))], 'arm_R': [('y', -2 * S_(ph + 2.4))]}, f, locbone='root')
A.end(act, L, True)
act = A.begin('hit')                                    # โดนตี: เอนหลังแล้วเด้งกลับแบบสปริง
for f, k in ((0, 0), (2, -1), (5, 0.6), (8, -0.35), (11, 0.18), (14, -0.07), (18, 0)):
    A.key({'body': [('x', 13 * k)], 'head': [('x', -10 * k), ('z', 6 * k)], 'arm_L': [('y', 10 * k)], 'arm_R': [('y', -10 * k)]}, f, locbone='root')
A.end(act, 18)
act = A.begin('attack')                                 # หุ่นยิง: กระตุกไปหน้า
for f, k in ((0, 0), (3, 1), (6, -0.4), (10, 0)):
    A.key({'body': [('x', 7 * k)], 'head': [('x', 8 * k)], 'arm_L': [('y', -12 * k)], 'arm_R': [('y', 12 * k)]}, f, locbone='root')
A.end(act, 10)
A.rest()
size = export([rig, ob], 'assets/enemies/dummy.glb', anim=True)
save_blend('assets/src/dummy.blend')
print('RESULT', tris(ob), size, A.made)
