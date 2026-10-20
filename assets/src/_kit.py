# _kit.py — เครื่องมือร่วมของสคริปต์ปั้นโมเดล (student_build.py, dummy_build.py, props_build.py)
# รันผ่าน Blender:  blender -b --factory-startup --python assets/src/<script>.py
# พิกัด: ฟังก์ชันรูปทรงรับค่าแบบ three.js (y ขึ้น, +z = หน้า) เพื่อพอร์ตจากโค้ดเกมได้ตรงๆ แล้วแปลงเป็น Blender (z ขึ้น, −Y = หน้า) ให้เอง
import bpy, bmesh, math, os
from mathutils import Matrix, Vector, Quaternion, Euler

V = Vector
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))          # โฟลเดอร์ repo
C3 = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))   # three → blender: (x, y, z) → (x, −z, y)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = 30


def hexcol(h, a=1.0):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]   # sRGB → linear
    return (c[0], c[1], c[2], a)


def srgb(h):
    h = h.lstrip('#')
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]


def mat(name, col='#ffffff', rough=0.85, metal=0.0, emit=None, emit_k=1.0, double=False, img=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = hexcol(col)
    bs.inputs['Roughness'].default_value = rough
    bs.inputs['Metallic'].default_value = metal
    if emit:
        bs.inputs['Emission Color'].default_value = hexcol(emit)
        bs.inputs['Emission Strength'].default_value = emit_k
    if img is not None:
        tx = m.node_tree.nodes.new('ShaderNodeTexImage')
        tx.image = img
        tx.interpolation = 'Closest'
        m.node_tree.links.new(tx.outputs['Color'], bs.inputs['Base Color'])
    m.use_backface_culling = not double
    return m


def palette(name, cols, n=4, px=16, noise=None):
    """ภาพ palette n×n ช่อง (ช่องละ px) — cols = list ของ '#hex' ตามลำดับช่อง (ซ้าย→ขวา, ล่าง→บน ตาม UV)
    noise = {ช่อง: แรง} ใส่ลายสุ่มเล็กน้อย (ลายไม้/ฟาง)"""
    import random
    rnd = random.Random(7)
    S = n * px
    img = bpy.data.images.new(name, S, S, alpha=False)
    pix = [0.0] * (S * S * 4)
    for i, h in enumerate(cols):
        c = srgb(h)                       # ภาพ byte เก็บค่าแบบ sRGB ตรงๆ (ไม่แปลงเป็น linear)
        cx, cy = (i % n) * px, (i // n) * px
        k = (noise or {}).get(i, 0)
        for y in range(px):
            for x in range(px):
                j = ((cy + y) * S + cx + x) * 4
                f = 1.0 + (rnd.uniform(-k, k) + k * 0.6 * math.sin(y * 1.7 + rnd.uniform(0, 0.5)) if k else 0)
                pix[j:j + 4] = [c[0] * f, c[1] * f, c[2] * f, 1.0]
    img.pixels = pix
    img.pack()
    return img


def swuv(i, n=4):
    return ((i % n + 0.5) / n, (i // n + 0.5) / n)


# ---------------- รูปทรงแบบ three.js (คืนค่าเป็น grid ของจุดใน local three) ----------------
def g_sphere(r, ws=16, hs=12, p0=0.0, pl=math.tau, t0=0.0, tl=math.pi):
    rows = []
    for i in range(hs + 1):
        th = t0 + tl * i / hs
        row = []
        for j in range(ws + 1):
            ph = p0 + pl * j / ws
            row.append(V((-r * math.cos(ph) * math.sin(th), r * math.cos(th), r * math.sin(ph) * math.sin(th))))
        rows.append(row)
    return rows, pl >= math.tau - 1e-6


def g_cyl(rt, rb, h, rs=12, hseg=1, open_=False, t0=0.0, tl=math.tau):
    rows = []
    rad = [rt + (rb - rt) * i / hseg for i in range(hseg + 1)]
    ys = [h / 2 - h * i / hseg for i in range(hseg + 1)]
    if not open_:
        rad = [0.0] + rad + [0.0]
        ys = [ys[0]] + ys + [ys[-1]]
    for r, y in zip(rad, ys):
        rows.append([V((r * math.sin(t0 + tl * j / rs), y, r * math.cos(t0 + tl * j / rs))) for j in range(rs + 1)])
    return rows, tl >= math.tau - 1e-6


def g_capsule(r, l, cs=4, rs=10):
    rows = []
    for i in range(cs + 1):                       # ครึ่งบน
        a = math.pi / 2 * i / cs
        rows.append((r * math.sin(a), l / 2 + r * math.cos(a)))
    for i in range(cs + 1):                       # ครึ่งล่าง
        a = math.pi / 2 + math.pi / 2 * i / cs
        rows.append((r * math.sin(a), -l / 2 + r * math.cos(a)))
    out = [[V((rr * math.sin(math.tau * j / rs), y, rr * math.cos(math.tau * j / rs))) for j in range(rs + 1)] for rr, y in rows]
    return out, True


def g_torus(R, r, rseg=8, tseg=16, arc=math.tau):
    rows = []
    for i in range(rseg + 1):
        v = math.tau * i / rseg
        rows.append([V(((R + r * math.cos(v)) * math.cos(arc * j / tseg), (R + r * math.cos(v)) * math.sin(arc * j / tseg), r * math.sin(v))) for j in range(tseg + 1)])
    return rows, arc >= math.tau - 1e-6


def trs3(pos=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1), quat=None):
    """เมทริกซ์แบบ three (Euler XYZ) แล้วแปลงเป็น blender"""
    R = quat.to_matrix().to_4x4() if quat is not None else (Matrix.Rotation(rot[0], 4, 'X') @ Matrix.Rotation(rot[1], 4, 'Y') @ Matrix.Rotation(rot[2], 4, 'Z'))
    return C3 @ Matrix.Translation(V(pos)) @ R @ Matrix.Diagonal((scale[0], scale[1], scale[2], 1))


def p3(x, y, z):
    """จุด three → blender"""
    return V((x, -z, y))


class MB:
    """ตัวสะสม mesh: หลายวัสดุ + น้ำหนักกระดูก + UV แบบช่อง palette"""

    def __init__(self, mats, bones=None):
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.new('UVMap')
        self.dl = self.bm.verts.layers.deform.verify()
        self.mats = mats                      # list ของ material
        self.mi = {m.name: i for i, m in enumerate(mats)}
        self.bones = bones or []
        self.bi = {b: i for i, b in enumerate(self.bones)}

    def grid(self, g, M, mat, sw=None, w=None, smooth=True, flip=False, recalc=True, uvmode=None):
        rows, closed = g
        nr, nc = len(rows), len(rows[0])
        cols = nc - 1 if closed else nc
        vs = [[self.bm.verts.new(M @ rows[i][j]) for j in range(cols)] for i in range(nr)]
        fs = []
        for i in range(nr - 1):
            for j in range(nc - 1):
                a, b = vs[i][j], vs[i][(j + 1) % cols]
                c, d = vs[i + 1][(j + 1) % cols], vs[i + 1][j]
                q = [a, d, c, b] if flip else [a, b, c, d]
                uq = [(j / (nc - 1), 1 - i / (nr - 1)), (j / (nc - 1), 1 - (i + 1) / (nr - 1)), ((j + 1) / (nc - 1), 1 - (i + 1) / (nr - 1)), ((j + 1) / (nc - 1), 1 - i / (nr - 1))] if flip else \
                     [(j / (nc - 1), 1 - i / (nr - 1)), ((j + 1) / (nc - 1), 1 - i / (nr - 1)), ((j + 1) / (nc - 1), 1 - (i + 1) / (nr - 1)), (j / (nc - 1), 1 - (i + 1) / (nr - 1))]
                if len(set(q)) < 3:
                    continue
                try:
                    f = self.bm.faces.new(q)
                except ValueError:
                    continue
                f.loops[0][self.uv].uv, f.loops[1][self.uv].uv, f.loops[2][self.uv].uv, f.loops[3][self.uv].uv = uq
                fs.append(f)
        allv = [v for r in vs for v in r]
        bmesh.ops.remove_doubles(self.bm, verts=allv, dist=1e-6)
        allv = [v for v in allv if v.is_valid]
        fs = [f for f in fs if f.is_valid]
        if recalc and fs:
            bmesh.ops.recalc_face_normals(self.bm, faces=fs)
        self._fin(allv, fs, mat, sw, w, smooth)
        return allv, fs

    def box(self, size, M, mat, sw=None, w=None):
        r = bmesh.ops.create_cube(self.bm, size=1, matrix=M @ Matrix.Diagonal((size[0], size[1], size[2], 1)))
        fs = list({f for v in r['verts'] for f in v.link_faces})
        for f in fs:
            for k, l in enumerate(f.loops):
                l[self.uv].uv = ((0, 0), (1, 0), (1, 1), (0, 1))[k % 4]
        self._fin(r['verts'], fs, mat, sw, w, False)
        return r['verts'], fs

    def _fin(self, verts, faces, mat, sw, w, smooth):
        mi = self.mi[mat.name if hasattr(mat, 'name') else mat]
        for f in faces:
            f.material_index = mi
            f.smooth = smooth
            if sw is not None:
                u = swuv(sw)
                for l in f.loops:
                    l[self.uv].uv = u
        if w is not None and self.bones:
            for v in verts:
                ww = w(v.co) if callable(w) else ({w: 1.0} if isinstance(w, str) else w)
                for bn, x in ww.items():
                    if x > 1e-4:
                        v[self.dl][self.bi[bn]] = x

    def build(self, name, coll=None):
        me = bpy.data.meshes.new(name)
        self.bm.to_mesh(me)
        self.bm.free()
        for m in self.mats:
            me.materials.append(m)
        ob = bpy.data.objects.new(name, me)
        (coll or bpy.context.scene.collection).objects.link(ob)
        for b in self.bones:
            ob.vertex_groups.new(name=b)
        return ob


def tris(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)


# ---------------- กระดูก + animation ----------------
def make_rig(name, bones, coll=None):
    """bones: [(ชื่อ, head, tail, parent)] พิกัด blender"""
    arm = bpy.data.armatures.new(name)
    rig = bpy.data.objects.new(name, arm)
    (coll or bpy.context.scene.collection).objects.link(rig)
    arm.display_type = 'STICK'
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for n, h, t, p in bones:
        e = arm.edit_bones.new(n)
        e.head, e.tail, e.roll = h, t, 0
        if p:
            e.parent = arm.edit_bones[p]
            e.use_connect = False
    bpy.ops.object.mode_set(mode='OBJECT')
    return rig


def skin(ob, rig):
    ob.parent = rig
    m = ob.modifiers.new('Armature', 'ARMATURE')
    m.object = rig


def bone_child(ob, rig, bone):
    """ติดชิ้นแข็ง (ผม ไม้กายสิทธิ์) กับกระดูก — ปั้นไว้ตำแหน่งจริง แล้วคงตำแหน่งเดิม"""
    mw = ob.matrix_world.copy()
    ob.parent = rig
    ob.parent_type = 'BONE'
    ob.parent_bone = bone
    bpy.context.view_layer.update()
    ob.matrix_world = mw


AX = {'x': V((1, 0, 0)), 'y': V((0, 1, 0)), 'z': V((0, 0, 1))}


class Anim:
    """ท่าแบบเดียวกับ gob_anim.py: หมุนในแกนของ armature (x = ก้ม/เงย, −x ยกแขน/ขาไปหน้า, z = หมุนรอบตัว)"""

    def __init__(self, rig):
        self.rig = rig
        self.ad = rig.animation_data_create()
        for t in list(self.ad.nla_tracks):
            self.ad.nla_tracks.remove(t)
        self.made = {}

    def q(self, b, rots):
        R = Quaternion()
        for ax, deg in rots:
            R = Quaternion(AX[ax], math.radians(deg)) @ R
        M = self.rig.data.bones[b].matrix_local.to_3x3()
        return (M.inverted() @ R.to_matrix() @ M).to_quaternion()

    def key(self, pose, f, loc=None, locbone='hips'):
        for pb in self.rig.pose.bones:
            pb.rotation_mode = 'QUATERNION'
            pb.rotation_quaternion = self.q(pb.name, pose.get(pb.name, []))
            pb.keyframe_insert('rotation_quaternion', frame=f)
        pb = self.rig.pose.bones[locbone]
        M = self.rig.data.bones[locbone].matrix_local.to_3x3()
        pb.location = M.inverted() @ V(loc or (0, 0, 0))
        pb.keyframe_insert('location', frame=f)

    def begin(self, name):
        for b in self.rig.pose.bones:
            b.rotation_mode = 'QUATERNION'
            b.rotation_quaternion = Quaternion()
            b.location = V()
        a = bpy.data.actions.new(name)
        a.use_fake_user = True
        self.ad.action = a
        return a

    def end(self, act, L, cyclic=False):
        if cyclic:     # ให้วนเนียน: เส้นโค้งไม่พุ่งเกินที่รอยต่อ
            for fc in _fcurves(act):
                for k in fc.keyframe_points:
                    k.interpolation = 'BEZIER'
        self.ad.action = None
        tr = self.ad.nla_tracks.new()
        tr.name = act.name
        st = tr.strips.new(act.name, 0, act)
        st.name = act.name
        self.made[act.name] = L

    def rest(self):
        for b in self.rig.pose.bones:
            b.rotation_quaternion = Quaternion()
            b.location = V()


def _fcurves(act):
    try:
        return list(act.fcurves)
    except AttributeError:      # Blender 5: slotted actions
        out = []
        for ly in act.layers:
            for st in ly.strips:
                for cb in st.channelbags:
                    out += list(cb.fcurves)
        return out


def add(p, b, ax, deg):
    p.setdefault(b, []).append((ax, deg))


def export(objs, rel_path, anim=False):
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for o in objs:
        o.hide_set(False)
        o.select_set(True)
    path = os.path.join(ROOT, rel_path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    kw = dict(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
              export_materials='EXPORT', export_image_format='AUTO')
    if anim:
        kw.update(export_animations=True, export_animation_mode='NLA_TRACKS', export_skins=True, export_force_sampling=True,
                  export_def_bones=False, export_optimize_animation_size=True)
    else:
        kw.update(export_animations=False)
    bpy.ops.export_scene.gltf(**kw)
    return os.path.getsize(path)


def save_blend(rel_path):
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, rel_path), compress=True)
