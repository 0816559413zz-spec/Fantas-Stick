# light_god_crystal_build.py — Radiant Sovereign แบบ C "ร่างคริสตัล" (ตัวเลือกให้ผู้ใช้เทียบ 2026-11-16)
# ตัวทำจากก้อนคริสตัลเหลี่ยมลอยต่อกันเป็นรูปคน (มีช่องว่างระหว่างชิ้น) • หัวคริสตัลทรงไข่เหลี่ยม • ไม่มีขา หางคริสตัลแหลม
# รัน: blender -b --factory-startup --python assets/src/light_god_crystal_build.py
import bpy, math, os, sys
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import reset, mat, export, save_blend

reset()
R = math.radians
M_CRY = mat('god_cry', '#d6e8ff', rough=0.15, emit='#9fc4ff', emit_k=0.35)
M_GOLD = mat('god_gold', '#ffc23d', rough=0.3, metal=0.6, emit='#ffb000', emit_k=0.6)
M_CORE = mat('god_core', '#ffffff', rough=0.1, emit='#ffe9a8', emit_k=1.6)
parts = []


def gem(name, m, loc, scale, rot=(0, 0, 0), sub=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    o.data.materials.append(m)
    parts.append(o)
    return o


def shard_between(name, m, a, b, w):
    a, b = Vector(a), Vector(b)
    d = b - a
    o = gem(name, m, (a + b) / 2, (w, w * 0.8, d.length / 2 * 0.92), sub=0)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
    return o


gem('chest', M_CRY, (0, 0, 0.6), (0.3, 0.17, 0.26))
gem('belly', M_CRY, (0, 0, 0.22), (0.18, 0.13, 0.17))
gem('core', M_CORE, (0, -0.15, 0.62), (0.06, 0.04, 0.09), sub=0)
for s in (-1, 1):
    gem('shoulder%d' % s, M_GOLD, (s * 0.38, 0, 0.8), (0.1, 0.11, 0.08), rot=(0, R(-25 * s), 0), sub=0)
    shard_between('upper%d' % s, M_CRY, (s * 0.42, 0, 0.74), (s * 0.64, -0.04, 0.44), 0.065)
    shard_between('fore%d' % s, M_CRY, (s * 0.67, -0.05, 0.4), (s * 0.86, -0.12, 0.17), 0.055)
    gem('hand%d' % s, M_CORE, (s * 0.9, -0.14, 0.12), (0.05, 0.03, 0.07), sub=0)
    for i in range(4):
        a = R(-30 + i * 20) * s
        d = Vector((math.sin(a) * 0.4 * s + 0.6 * s, -0.25, -0.75)).normalized()
        base = Vector((s * 0.92, -0.15, 0.08))
        shard_between('f%d%d' % (s, i), M_CRY, base, base + d * 0.12, 0.014)
    for k in range(2):
        shard_between('sp%d%d' % (s, k), M_CRY, (s * (0.38 + 0.06 * k), 0, 0.86), (s * (0.5 + 0.1 * k), 0.02, 1.1 - 0.08 * k), 0.025)
gem('neck', M_CRY, (0, 0, 0.92), (0.05, 0.05, 0.05), sub=0)
head = gem('god_head', M_CRY, (0, 0, 1.1), (0.12, 0.12, 0.16), sub=2)
tail = None
shard_between('god_tail', M_CRY, (0, 0, 0.08), (0, 0, -0.9), 0.14)
bpy.ops.object.select_all(action='DESELECT')
for o in parts:
    o.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
body = bpy.context.active_object
body.name = 'god_body'
export([body], 'assets/models/light_god_C.glb')
save_blend('assets/src/light_god_C.blend')
print('LIGHT_GOD_C_OK')
