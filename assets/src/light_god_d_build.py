# light_god_d_build.py — Radiant Sovereign แบบ D "เทพคริสตัลทรงพลัง" (ผู้ใช้ 2026-11-16: C ใช้ได้ A พอได้ แต่ดูอ่อน หัวอ่อน)
# ทรงสามเหลี่ยมกลับหัว อก/ไหล่ใหญ่ เอวคอด • ชิ้นคริสตัลเหลี่ยมลอยต่อกันเล็กน้อย • ไหล่เป็นกลุ่มคริสตัลใหญ่บนฐานทอง
# หัว: เหลี่ยมคริสตัล + แฉกแหลมกลาง + แฉกข้างพุ่งขึ้นไปหลัง (แบบ ref) • มือใหญ่เรืองแสง • ไม่มีขา หางคริสตัลแหลม
# รัน: blender -b --factory-startup --python assets/src/light_god_d_build.py
import bpy, math, os, sys
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import reset, mat, export, save_blend

reset()
R = math.radians
M_CRY = mat('god_cry', '#d3e6ff', rough=0.15, emit='#8fb8ff', emit_k=0.35)
M_DEEP = mat('god_deep', '#9fc0f0', rough=0.2, emit='#5f8fe0', emit_k=0.3)
M_GOLD = mat('god_gold', '#ffc23d', rough=0.3, metal=0.6, emit='#ffb000', emit_k=0.6)
M_CORE = mat('god_core', '#ffffff', rough=0.1, emit='#ffe9a8', emit_k=1.8)
parts = []


def gem(name, m, loc, scale, rot=(0, 0, 0), sub=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    o.data.materials.append(m)
    parts.append(o)
    return o


def shard(name, m, a, b, w, d=None, sides=4):
    a, b = Vector(a), Vector(b)
    v = b - a
    bpy.ops.mesh.primitive_cone_add(vertices=sides, radius1=w, radius2=0, depth=v.length, location=(0, 0, 0))
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(m)
    for vt in o.data.vertices:
        vt.co.z += v.length / 2
        if d is not None:
            vt.co.y *= d / w
    o.location = a
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(v.normalized())
    parts.append(o)
    return o


def limb(name, m, a, b, w):
    """แขนเป็นคริสตัลยาวสองหัวแหลม (bipyramid) ระหว่าง a-b"""
    a, b = Vector(a), Vector(b)
    v = b - a
    o = gem(name, m, (a + b) / 2, (w, w * 0.85, v.length / 2), sub=0)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(v.normalized())
    return o


# ---------- ลำตัว: อกใหญ่ (เหลี่ยมหลายชิ้น) → เอวคอด ----------
gem('chest', M_CRY, (0, 0, 0.62), (0.42, 0.22, 0.3), sub=1)
for s in (-1, 1):
    gem('pec%d' % s, M_CRY, (s * 0.15, -0.14, 0.66), (0.16, 0.08, 0.13), rot=(0, R(10 * s), 0), sub=1)
    gem('lat%d' % s, M_DEEP, (s * 0.3, 0.02, 0.5), (0.12, 0.14, 0.2), rot=(0, R(-20 * s), 0), sub=0)
gem('abs', M_DEEP, (0, -0.02, 0.28), (0.19, 0.14, 0.14), sub=1)
gem('waist', M_CRY, (0, 0, 0.1), (0.14, 0.11, 0.09), sub=0)
gem('core', M_CORE, (0, -0.22, 0.64), (0.07, 0.04, 0.1), sub=0)
for s in (-1, 1):   # เส้นทองไขว้ X บนอก (ใส่เส้นในเกมทีหลังก็ได้) — ตอนนี้ทำเป็นแถบทองบาง
    shard('xline%d' % s, M_GOLD, (s * 0.24, -0.19, 0.84), (-s * 0.2, -0.17, 0.38), 0.012)
# ---------- ไหล่: ฐานทอง + คริสตัลใหญ่ 3 แท่ง ----------
for s in (-1, 1):
    gem('pad%d' % s, M_GOLD, (s * 0.5, 0, 0.84), (0.17, 0.17, 0.1), rot=(0, R(-25 * s), 0), sub=0)
    shard('spA%d' % s, M_CRY, (s * 0.52, 0, 0.88), (s * 0.78, 0.04, 1.3), 0.07)
    shard('spB%d' % s, M_CRY, (s * 0.46, 0.06, 0.9), (s * 0.6, 0.12, 1.18), 0.05)
    shard('spC%d' % s, M_CRY, (s * 0.58, -0.04, 0.84), (s * 0.86, -0.02, 1.04), 0.045)
    # ---------- แขน: หนาขึ้น กางออก ----------
    limb('upper%d' % s, M_CRY, (s * 0.56, 0, 0.74), (s * 0.82, -0.05, 0.42), 0.1)
    limb('fore%d' % s, M_DEEP, (s * 0.84, -0.06, 0.38), (s * 1.06, -0.14, 0.12), 0.09)
    gem('gaunt%d' % s, M_GOLD, (s * 1.0, -0.12, 0.18), (0.09, 0.09, 0.07), rot=(0, R(-40 * s), 0), sub=0)
    gem('hand%d' % s, M_CORE, (s * 1.1, -0.18, 0.06), (0.08, 0.04, 0.1), rot=(0, R(-40 * s), 0), sub=1)
    for i in range(4):
        a = R(-20 + i * 14)
        d = Vector((s * (0.5 + 0.5 * math.sin(a + 0.6)), -0.35, -0.8)).normalized()
        b0 = Vector((s * 1.13, -0.2, 0.0))
        shard('f%d%d' % (s, i), M_CORE, b0 + Vector((s * 0.0, 0, 0.02 * i - 0.03)), b0 + d * 0.16, 0.018)
# ---------- คอ + หัว: เหลี่ยมคริสตัล + แฉกกลาง + แฉกข้างพุ่งขึ้นหลัง ----------
gem('neck', M_DEEP, (0, 0, 0.96), (0.08, 0.08, 0.07), sub=0)
gem('god_head', M_CRY, (0, 0, 1.15), (0.14, 0.14, 0.18), sub=1)
shard('crest', M_CRY, (0, 0.02, 1.26), (0, 0.06, 1.62), 0.07)
for s in (-1, 1):
    shard('flare%d' % s, M_CRY, (s * 0.1, 0.02, 1.2), (s * 0.34, 0.16, 1.5), 0.045)
    shard('flare2%d' % s, M_GOLD, (s * 0.09, 0.05, 1.12), (s * 0.28, 0.2, 1.26), 0.03)
# ---------- หาง: คริสตัลแหลมยาวลงล่าง (จางในเกม) ----------
shard('tail', M_CRY, (0, 0, 0.06), (0, 0, -1.0), 0.16)
shard('tail2', M_DEEP, (0.08, 0.02, 0.02), (0.12, 0.02, -0.6), 0.06)
shard('tail3', M_DEEP, (-0.08, 0.02, 0.02), (-0.13, 0.02, -0.55), 0.06)
bpy.ops.object.select_all(action='DESELECT')
for o in parts:
    o.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
body = bpy.context.active_object
body.name = 'god_body'
export([body], 'assets/models/light_god_D.glb')
save_blend('assets/src/light_god_D.blend')
print('LIGHT_GOD_D_OK', len(body.data.vertices))
