import bpy, bmesh, math
from mathutils import Matrix, Vector
V = Vector

for n in ("enemy_gob", "gob_rig"):
    if n in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)
for coll in (bpy.data.meshes, bpy.data.armatures):
    for n in ("enemy_gob", "gob_rig"):
        if n in coll:
            coll.remove(coll[n])

def swuv(i):
    col, row = i % 4, i // 4
    return ((col + 0.5) / 4, (row + 0.5) / 4)

FLAT = {2, 12}
BONES = [
    ("root", (0, 0, 0), (0, 0.25, 0), None),
    ("hips", (0, 0.02, 0.62), (0, 0.02, 0.82), "root"),
    ("spine", (0, 0.02, 0.82), (0, -0.02, 1.02), "hips"),
    ("chest", (0, -0.02, 1.02), (0, -0.09, 1.2), "spine"),
    ("head", (0, -0.09, 1.2), (0, -0.12, 1.55), "chest"),
    ("ear_L", (0.24, -0.1, 1.42), (0.62, -0.02, 1.58), "head"),
    ("ear_R", (-0.24, -0.1, 1.42), (-0.62, -0.02, 1.58), "head"),
]
for s, S in ((1, "L"), (-1, "R")):
    BONES += [
        ("upper_arm_" + S, (s * 0.27, -0.03, 1.1), (s * 0.36, -0.06, 0.84), "chest"),
        ("forearm_" + S, (s * 0.36, -0.06, 0.84), (s * 0.39, -0.14, 0.6), "upper_arm_" + S),
        ("hand_" + S, (s * 0.39, -0.14, 0.6), (s * 0.40, -0.17, 0.47), "forearm_" + S),
        ("thigh_" + S, (s * 0.16, 0.02, 0.6), (s * 0.19, -0.04, 0.34), "hips"),
        ("shin_" + S, (s * 0.19, -0.04, 0.34), (s * 0.19, 0.03, 0.09), "thigh_" + S),
        ("foot_" + S, (s * 0.19, 0.03, 0.09), (s * 0.2, -0.22, 0.03), "shin_" + S),
    ]
BI = {b[0]: i for i, b in enumerate(BONES)}
bh = {b[0]: (V(b[1]), V(b[2])) for b in BONES}

bm = bmesh.new()
uvl = bm.loops.layers.uv.new("UVMap")
dl = bm.verts.layers.deform.verify()

def finish(verts, bone, sw):
    vs = set(verts)
    fs = {f for v in vs for f in v.link_faces}
    gi = BI[bone]
    for v in vs:
        v[dl][gi] = 1.0
    u = swuv(sw)
    for f in fs:
        f.smooth = sw not in FLAT
        for l in f.loops:
            l[uvl].uv = u

def sphere(c, r, bone, sw, sc=(1, 1, 1), seg=(12, 8)):
    M = Matrix.Translation(V(c)) @ Matrix.Diagonal((sc[0], sc[1], sc[2], 1))
    res = bmesh.ops.create_uvsphere(bm, u_segments=seg[0], v_segments=seg[1], radius=r, matrix=M)
    finish(res['verts'], bone, sw)
    return res['verts']

def seg(a, b, r1, r2, bone, sw, n=8, sq=1.0):
    a = V(a); b = V(b); d = b - a; L = d.length
    q = V((0, 0, 1)).rotation_difference(d.normalized())
    M = Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4() @ Matrix.Diagonal((1, sq, 1, 1))
    res = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=n, radius1=r1, radius2=r2, depth=L, matrix=M)
    finish(res['verts'], bone, sw)
    return res['verts']

def box(c, size, bone, sw):
    M = Matrix.Translation(V(c)) @ Matrix.Diagonal((size[0], size[1], size[2], 1))
    res = bmesh.ops.create_cube(bm, size=1, matrix=M)
    finish(res['verts'], bone, sw)
    return res['verts']

# body
sphere((0, 0.0, 0.76), 0.27, "hips", 2, sc=(1.05, 0.95, 0.9))
sphere((0, -0.03, 0.98), 0.25, "spine", 2, sc=(1.15, 0.9, 0.95))
sphere((0, -0.07, 1.12), 0.17, "chest", 0, sc=(1.4, 1, 0.8))
# ragged skirt: wide end at the bottom, jagged hem
sk = seg((0, -0.03, 0.5), (0, -0.04, 0.86), 0.33, 0.26, "hips", 12, 10)
low = sorted([v for v in sk if v.co.z < 0.55], key=lambda v: math.atan2(v.co.y + 0.03, v.co.x))
for i, v in enumerate(low):
    if i % 2:
        v.co.z += 0.07
seg((0, -0.02, 0.84), (0, -0.02, 0.92), 0.29, 0.29, "hips", 4, 14)
box((0, -0.29, 0.88), (0.1, 0.04, 0.08), "hips", 11)
sphere((0.2, 0.0, 1.13), 0.11, "chest", 3, sc=(1.2, 1.1, 0.7))
seg((0.15, -0.2, 1.12), (-0.2, 0.2, 0.86), 0.035, 0.035, "spine", 3, 6)   # strap across chest
# head
sphere((0, -0.15, 1.36), 0.26, "head", 0, sc=(1.08, 1.0, 0.92), seg=(14, 10))
sphere((0, -0.30, 1.27), 0.16, "head", 0, sc=(1.15, 0.8, 0.65))
seg((0, -0.36, 1.36), (0, -0.56, 1.31), 0.07, 0.025, "head", 1, 8)
sphere((0, -0.385, 1.45), 0.12, "head", 1, sc=(1.5, 0.5, 0.32))
for s in (1, -1):
    sphere((s * 0.1, -0.36, 1.41), 0.052, "head", 9, seg=(8, 6))
    seg((s * 0.07, -0.40, 1.22), (s * 0.07, -0.41, 1.29), 0.025, 0.004, "head", 7, 5)
    S = "L" if s > 0 else "R"
    seg((s * 0.22, -0.12, 1.42), (s * 0.62, -0.02, 1.58), 0.12, 0.01, "ear_" + S, 0, 8, 0.35)
    seg((s * 0.24, -0.135, 1.42), (s * 0.5, -0.06, 1.53), 0.06, 0.01, "ear_" + S, 1, 6, 0.3)
box((0, -0.405, 1.255), (0.15, 0.02, 0.022), "head", 8)
# arms / legs
for s, S in ((1, "L"), (-1, "R")):
    h, t = bh["upper_arm_" + S]; seg(h, t, 0.075, 0.06, "upper_arm_" + S, 0, 8)
    sphere(t, 0.065, "upper_arm_" + S, 0, seg=(8, 6))
    h, t = bh["forearm_" + S]; seg(h, t, 0.062, 0.05, "forearm_" + S, 0, 8)
    seg(h.lerp(t, 0.45), h.lerp(t, 0.85), 0.072, 0.066, "forearm_" + S, 3, 8)
    h, t = bh["hand_" + S]; sphere(h.lerp(t, 0.45), 0.08, "hand_" + S, 0, sc=(0.9, 1.1, 1.2), seg=(10, 7))
    for dx in (-0.035, 0, 0.035):
        p = h.lerp(t, 0.9) + V((dx * s, -0.02, 0)); seg(p, p + V((0, -0.05, -0.04)), 0.017, 0.003, "hand_" + S, 10, 5)
    h, t = bh["thigh_" + S]; seg(h, t, 0.09, 0.07, "thigh_" + S, 0, 8)
    sphere(t, 0.07, "thigh_" + S, 0, seg=(8, 6))
    h, t = bh["shin_" + S]; seg(h, t, 0.065, 0.055, "shin_" + S, 0, 8)
    seg(h.lerp(t, 0.35), h.lerp(t, 0.95), 0.075, 0.07, "shin_" + S, 3, 8)
    h, t = bh["foot_" + S]; sphere(h.lerp(t, 0.5) + V((0, 0, -0.01)), 0.13, "foot_" + S, 0, sc=(0.75, 1.35, 0.42), seg=(10, 7))
    for dx in (-0.05, 0, 0.05):
        p = V((t.x + dx * s, t.y, 0.035)); seg(p, p + V((0, -0.05, -0.005)), 0.02, 0.004, "foot_" + S, 10, 5)
# dagger in the right hand (goblin's right = -X), blade forward (-Y)
hp = bh["hand_R"][0].lerp(bh["hand_R"][1], 0.5)
seg(hp + V((0, 0.07, 0)), hp + V((0, -0.07, 0)), 0.025, 0.025, "hand_R", 6, 6)
box(hp + V((0, -0.085, 0)), (0.03, 0.025, 0.15), "hand_R", 5)
seg(hp + V((0, -0.1, 0)), hp + V((0, -0.5, 0.0)), 0.05, 0.004, "hand_R", 5, 4, 0.3)

bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
me = bpy.data.meshes.new("enemy_gob"); bm.to_mesh(me); bm.free()
me.materials.append(bpy.data.materials["gob_mat"])
ob = bpy.data.objects.new("enemy_gob", me)
col = bpy.data.collections.get("Enemies") or bpy.data.collections.new("Enemies")
if col.name not in bpy.context.scene.collection.children:
    bpy.context.scene.collection.children.link(col)
col.objects.link(ob)
for b in BONES:
    ob.vertex_groups.new(name=b[0])

arm = bpy.data.armatures.new("gob_rig"); rig = bpy.data.objects.new("gob_rig", arm); col.objects.link(rig)
arm.display_type = 'STICK'
for o in bpy.context.view_layer.objects:
    o.select_set(False)
bpy.context.view_layer.objects.active = rig; rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for n, h, t, p in BONES:
    e = arm.edit_bones.new(n); e.head = h; e.tail = t; e.roll = 0
    if p:
        e.parent = arm.edit_bones[p]; e.use_connect = False
bpy.ops.object.mode_set(mode='OBJECT')
ob.parent = rig
mod = ob.modifiers.new("Armature", "ARMATURE"); mod.object = rig
rig.hide_render = True
zs = [v.co.z for v in me.vertices]
result = {"tris": sum(len(p.vertices) - 2 for p in me.polygons), "zmin": min(zs), "zmax": max(zs)}
