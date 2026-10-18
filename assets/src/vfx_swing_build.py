# Frost sword slash VFX (vfx_swing) — run inside Blender, then export the "VFX_swing" collection to assets/vfx/swing.glb
# Built at radius 1 (manifest "radius": true scales it to the real swing radius). Origin = swing centre (chest height in game),
# front = -Y. Materials: add_* = additive glow, *fade* = fades out at the end (handled by the game).
# The look comes from emission gradient textures (bright outer rim + bright head, fading inward and toward the tail).
import bpy, bmesh, math, random
import numpy as np
from mathutils import Vector, Matrix

COL = "VFX_swing"
col = bpy.data.collections.get(COL) or bpy.data.collections.new(COL)
if col.name not in bpy.context.scene.collection.children:
    bpy.context.scene.collection.children.link(col)
for o in list(col.objects):
    bpy.data.objects.remove(o, do_unlink=True)
for a in list(bpy.data.actions):
    if a.name.startswith("swing_"):
        bpy.data.actions.remove(a)

# ---------- gradient textures (u = along the arc, 1 = leading head; v = across, 1 = outer rim) ----------
W, H = 256, 64
u = np.linspace(0, 1, W)[None, :]
v = np.linspace(0, 1, H)[:, None]
rng = np.random.default_rng(3)
streak = 0.78 + 0.22 * np.sin(v * 55 + np.sin(u * 9) * 2.0) + rng.normal(0, 0.04, (H, W))
head = 0.15 + 0.85 * u ** 0.8
rim = np.exp(-((1 - v) / 0.07) ** 2) * (0.35 + 0.65 * u ** 0.5)
body = (v ** 1.5) * head * streak
I = np.clip(body * 1.35 + rim * 1.2, 0, 1)
deep = np.array([0.06, 0.25, 0.85]); cyan = np.array([0.45, 0.85, 1.0]); white = np.array([1, 1, 1])
c1 = np.clip(I * 2, 0, 1)[..., None]; c2 = np.clip(I * 2 - 1, 0, 1)[..., None]
rgb = (deep * (1 - c1) + cyan * c1) * (1 - c2) + white * c2
slash_px = rgb * (I ** 0.6)[..., None]
glow_I = (np.sin(np.pi * v) ** 1.5) * (0.1 + 0.9 * u ** 0.9) * 0.8
glow_px = np.array([0.15, 0.45, 1.0])[None, None, :] * glow_I[..., None]

def image(name, px):
    if name in bpy.data.images:
        bpy.data.images.remove(bpy.data.images[name])
    im = bpy.data.images.new(name, W, H, alpha=False)
    a = np.ones((H, W, 4), np.float32); a[..., :3] = np.clip(px, 0, 1)
    im.pixels.foreach_set(a.ravel()); im.file_format = 'PNG'; im.pack()
    return im

def mat(name, base, emit, strength, rough=0.4, img=None):
    if name in bpy.data.materials:
        bpy.data.materials.remove(bpy.data.materials[name])
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*base, 1)
    b.inputs["Emission Color"].default_value = (*emit, 1)
    b.inputs["Emission Strength"].default_value = strength
    b.inputs["Roughness"].default_value = rough
    if img:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = img; t.extension = 'EXTEND'
        nt.links.new(t.outputs["Color"], b.inputs["Emission Color"])
    m.use_backface_culling = False
    return m

M_SLASH = mat("add_fade_slash", (0, 0, 0), (1, 1, 1), 2.0, img=image("swing_slash_tex", slash_px))
M_GLOW = mat("add_fade_glow", (0, 0, 0), (1, 1, 1), 1.4, img=image("swing_glow_tex", glow_px))
M_SHARD = mat("fade_shard", (0.75, 0.9, 1.0), (0.35, 0.7, 1.0), 0.5, rough=0.1)

SPAN = math.radians(62)          # half-angle of the arc, centred on -Y

def arc_mesh(name, r_out, r_in_mid, rise, m, z0=0.0, n=48, taper=1.6):
    """crescent ribbon, thick in the middle and pointed at both tips; t=-1 (caster's right, -X) is the leading head."""
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new("UVMap")
    rows = []
    for i in range(n + 1):
        t = i / n * 2 - 1
        a = -math.pi / 2 + t * SPAN
        w = (1 - abs(t)) ** (1 / taper)
        ri = r_out - (r_out - r_in_mid) * max(w, 0.04)
        z = z0 + rise * t
        rows.append((bm.verts.new((math.cos(a) * r_out, math.sin(a) * r_out, z)),
                     bm.verts.new((math.cos(a) * ri, math.sin(a) * ri, z)), (1 - t) / 2))
    for i in range(n):
        o0, i0, u0 = rows[i]; o1, i1, u1 = rows[i + 1]
        f = bm.faces.new((o0, o1, i1, i0))
        for l, uv in zip(f.loops, ((u0, 1), (u1, 1), (u1, 0), (u0, 0))):
            l[uvl].uv = uv
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    me.materials.append(m)
    ob = bpy.data.objects.new(name, me); col.objects.link(ob)
    return ob

root = bpy.data.objects.new("swing_root", None); col.objects.link(root)
root.empty_display_size = 0.3
slash = arc_mesh("swing_slash", 1.0, 0.5, 0.12, M_SLASH)
glow = arc_mesh("swing_glow", 1.14, 0.45, 0.12, M_GLOW, z0=-0.015, taper=1.2)
for o in (slash, glow):
    o.parent = root

# ice shards: one mesh; scaling it from the centre throws them outward along the arc
rnd = random.Random(4)
bm = bmesh.new()
for k in range(9):
    t = (k / 8) * 2 - 1
    a = -math.pi / 2 + t * SPAN * 0.95
    r = rnd.uniform(0.75, 1.0)
    L = rnd.uniform(0.06, 0.11)
    c = Vector((math.cos(a) * r, math.sin(a) * r, 0.12 * t + rnd.uniform(-0.04, 0.07)))
    d = Vector((math.cos(a), math.sin(a), rnd.uniform(0.1, 0.5))).normalized()
    q = Vector((0, 0, 1)).rotation_difference(d)
    M = Matrix.Translation(c) @ q.to_matrix().to_4x4() @ Matrix.Diagonal((0.32 * L, 0.32 * L, L, 1))
    bmesh.ops.create_icosphere(bm, subdivisions=0, radius=1.0, matrix=M)
me = bpy.data.meshes.new("swing_shards"); bm.to_mesh(me); bm.free()
me.materials.append(M_SHARD)
shards = bpy.data.objects.new("swing_shards", me); col.objects.link(shards)
shards.parent = root

# ---------------- animation (30 fps, 10 frames = 0.33 s) ----------------
bpy.context.scene.render.fps = 30

def anim(ob, name, keys):
    ob.animation_data_create(); ob.animation_data.action = None
    for f, rz, sc, loc in keys:
        if rz is not None:
            ob.rotation_euler = (0, 0, math.radians(rz)); ob.keyframe_insert("rotation_euler", frame=f)
        if sc is not None:
            ob.scale = sc; ob.keyframe_insert("scale", frame=f)
        if loc is not None:
            ob.location = loc; ob.keyframe_insert("location", frame=f)
    ob.animation_data.action.name = "swing_" + name

# the whole slash sweeps clockwise (seen from above: from the caster's left to right) and opens up
anim(root, "root", [(0, 40, (0.72, 0.72, 0.72), None), (3, 8, (1.0, 1.0, 1.0), None),
                    (6, -6, (1.06, 1.06, 1.0), None), (10, -12, (1.1, 1.1, 1.0), None)])
# outer glow swells
anim(glow, "glow", [(0, None, (0.85, 0.85, 1), None), (5, None, (1.0, 1.0, 1), None), (10, None, (1.12, 1.12, 1), None)])
# shards burst outward, rise then drop, shrink
anim(shards, "shards", [(0, 12, (0.85, 0.85, 0.85), (0, 0, 0)), (4, 0, (1.15, 1.15, 1.15), (0, 0, 0.06)),
                        (10, -6, (1.45, 1.45, 1.2), (0, 0, -0.08))])
result = {"objs": [o.name for o in col.objects]}
