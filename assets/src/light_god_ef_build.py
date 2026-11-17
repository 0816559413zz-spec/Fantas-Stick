# light_god_ef_build.py — Radiant Sovereign แบบ E/F (ต่อยอดสไตล์ D ที่ผู้ใช้ชอบ, ออกแบบใหม่) • เดิม: แบบ D "เทพคริสตัลทรงพลัง" (ผู้ใช้ 2026-11-16: C ใช้ได้ A พอได้ แต่ดูอ่อน หัวอ่อน)
# ทรงสามเหลี่ยมกลับหัว อก/ไหล่ใหญ่ เอวคอด • ชิ้นคริสตัลเหลี่ยมลอยต่อกันเล็กน้อย • ไหล่เป็นกลุ่มคริสตัลใหญ่บนฐานทอง
# หัว: เหลี่ยมคริสตัล + แฉกแหลมกลาง + แฉกข้างพุ่งขึ้นไปหลัง (แบบ ref) • มือใหญ่เรืองแสง • ไม่มีขา หางคริสตัลแหลม
# รัน: blender -b --factory-startup --python assets/src/light_god_d_build.py
import bpy, math, os, sys
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import reset, mat, export, save_blend

VAR=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'E'
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



if VAR=='E':
    # ===== E "Sun Herald": ลำตัวเรียวแกร่ง + วงอาทิตย์คริสตัลผสานไหล่ + กระโปรงแสง (แท่งคริสตัลหลายแท่ง = ส่วนล่างจาง) + หัวหน้ากากสุริยะ =====
    gem('chest', M_CRY, (0, 0, 0.64), (0.34, 0.2, 0.28), sub=1)
    gem('abs', M_DEEP, (0, -0.01, 0.32), (0.17, 0.13, 0.15), sub=1)
    gem('core', M_CORE, (0, -0.2, 0.66), (0.08, 0.05, 0.11), sub=0)
    for s in (-1,1):
        shard('xline%d'%s, M_GOLD, (s*0.22,-0.18,0.86), (-s*0.18,-0.16,0.42), 0.012)
        gem('pad%d'%s, M_GOLD, (s*0.42,0,0.86), (0.13,0.14,0.09), rot=(0,R(-20*s),0), sub=0)
        limb('upper%d'%s, M_CRY, (s*0.46,0,0.76), (s*0.7,-0.06,0.5), 0.085)
        gem('bracer%d'%s, M_GOLD, (s*0.82,-0.1,0.33), (0.08,0.08,0.11), rot=(0,R(-35*s),0), sub=0)   # ปลอกแขนลอย
        limb('fore%d'%s, M_DEEP, (s*0.74,-0.08,0.44), (s*0.92,-0.16,0.2), 0.075)
        gem('hand%d'%s, M_CORE, (s*0.98,-0.2,0.12), (0.085,0.04,0.11), rot=(0,R(-35*s),0), sub=1)
        for i in range(4):
            b0=Vector((s*1.0,-0.21,0.04));d=Vector((s*(0.3+0.2*i),-0.3,-0.9)).normalized()
            shard('f%d%d'%(s,i), M_CORE, b0+Vector((0,0,0.02*i-0.03)), b0+d*0.15, 0.016)
    # วงอาทิตย์คริสตัลหลังไหล่ (ผสานกับตัว ไม่ใช่วงลอยไกล)
    for k in range(14):
        a=R(-90+ (k/13)*180+90)
        r=0.62
        p=(math.cos(a)*r, 0.14, 0.86+math.sin(a)*r*0.75)
        q=(math.cos(a)*(r+0.22+0.1*(k%2)), 0.16, 0.86+math.sin(a)*(r+0.22+0.1*(k%2))*0.75)
        if math.sin(a)>-0.2: shard('sun%d'%k, M_GOLD if k%2 else M_CRY, p, q, 0.04)
    gem('neck', M_DEEP, (0,0,0.95), (0.07,0.07,0.07), sub=0)
    gem('god_head', M_CRY, (0,0,1.13), (0.13,0.13,0.17), sub=1)
    gem('mask', M_GOLD, (0,-0.1,1.15), (0.1,0.04,0.12), sub=0)          # หน้ากากทอง (ไม่มีตา)
    for k in range(5):
        a=R(-50+k*25)
        shard('crown%d'%k, M_GOLD if k==2 else M_CRY, (math.sin(a)*0.1,0.0,1.24), (math.sin(a)*0.32,0.05,1.24+math.cos(a)*(0.42 if k==2 else 0.28)), 0.035)
    for k in range(7):   # กระโปรงแสง: แท่งคริสตัลห้อยลงหลายแท่ง ยาวไม่เท่ากัน
        a=R(k*360/7)
        shard('skirt%d'%k, M_CRY if k%2 else M_DEEP, (math.cos(a)*0.12, math.sin(a)*0.1, 0.16), (math.cos(a)*0.24, math.sin(a)*0.2, -0.55-0.25*((k*3)%4)/3), 0.06)
    out='E'
else:
    # ===== F "Prism Titan": อกเป็นปริซึมสามเหลี่ยมใหญ่ + ไหล่ปริซึมลอย + แขนกำยำ + หัวเพชรมีวงรัศมีติดหัว =====
    bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=0.48, radius2=0.3, depth=0.62, location=(0,0,0.6), rotation=(0,0,R(90)))
    ch=bpy.context.active_object;ch.name='chest';ch.scale=(1,0.62,1);ch.rotation_euler=(R(180),0,R(90));ch.data.materials.append(M_CRY);parts.append(ch)   # ปริซึมกลับหัว: ไหล่กว้าง → เอวแคบ
    gem('core', M_CORE, (0,-0.22,0.66), (0.09,0.05,0.12), sub=0)
    gem('abs', M_DEEP, (0,0,0.22), (0.15,0.12,0.13), sub=0)
    for s in (-1,1):
        shard('xline%d'%s, M_GOLD, (s*0.3,-0.2,0.86), (-s*0.12,-0.12,0.36), 0.014)
        # ไหล่ปริซึมลอย
        bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=0.2, radius2=0, depth=0.42, location=(s*0.66,0,1.0), rotation=(0,R(-30*s),0))
        pr=bpy.context.active_object;pr.name='sp%d'%s;pr.data.materials.append(M_CRY);parts.append(pr)
        gem('pad%d'%s, M_GOLD, (s*0.6,0,0.84), (0.16,0.15,0.08), rot=(0,R(-25*s),0), sub=0)
        limb('upper%d'%s, M_CRY, (s*0.6,0,0.74), (s*0.86,-0.05,0.42), 0.12)
        limb('fore%d'%s, M_DEEP, (s*0.88,-0.06,0.38), (s*1.08,-0.15,0.12), 0.11)
        gem('gaunt%d'%s, M_GOLD, (s*1.03,-0.13,0.2), (0.11,0.11,0.09), rot=(0,R(-40*s),0), sub=0)
        gem('hand%d'%s, M_CORE, (s*1.13,-0.19,0.05), (0.1,0.05,0.12), rot=(0,R(-40*s),0), sub=1)
        for i in range(4):
            b0=Vector((s*1.16,-0.21,-0.02));d=Vector((s*(0.4+0.18*i),-0.3,-0.85)).normalized()
            shard('f%d%d'%(s,i), M_CORE, b0+Vector((0,0,0.02*i-0.03)), b0+d*0.18, 0.02)
    gem('neck', M_DEEP, (0,0,0.95), (0.08,0.08,0.07), sub=0)
    gem('god_head', M_CRY, (0,0,1.16), (0.12,0.12,0.2), sub=0)          # หัวเพชร
    bpy.ops.mesh.primitive_torus_add(major_radius=0.22, minor_radius=0.018, location=(0,0.08,1.2), rotation=(R(80),0,0))
    hr=bpy.context.active_object;hr.name='headhalo';hr.data.materials.append(M_GOLD);parts.append(hr)
    for k in range(8):
        a=R(k*45)
        shard('hr%d'%k, M_CRY, (math.cos(a)*0.22,0.08,1.2+math.sin(a)*0.22), (math.cos(a)*0.34,0.08,1.2+math.sin(a)*0.34), 0.025)
    shard('tail', M_CRY, (0,0,0.08), (0,0,-1.05), 0.2)
    for s in (-1,1):shard('tail2%d'%s, M_DEEP, (s*0.12,0,0.06), (s*0.2,0,-0.7), 0.07)
    out='F'
bpy.ops.object.select_all(action='DESELECT')
for o in parts:
    o.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
body = bpy.context.active_object
body.name = 'god_body'
export([body], 'assets/models/light_god_%s.glb'%out)
save_blend('assets/src/light_god_%s.blend'%out)
print('LIGHT_GOD_%s_OK'%out)
