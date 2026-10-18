# Map "valley" (หมู่บ้านในหุบเขา) — generator for Blender. Run inside Blender; rebuilds collection MAP_valley.
# Follows MAP-DESIGN.md naming: ground, floor_, col_, colv_, bounds, spawn_*, enemy_spawn_*, prop_*, bld_house_*,
# env_water_*, light_*, anim_*, sub-collections deco_far / noshadow. Design form: designs/maps/valley.md
# 1 Blender unit = 1 game unit, map centre at (0,0,0), north = +Y, ground level Z = 0.
import bpy, bmesh, math, random
import numpy as np
from mathutils import Vector, Matrix, Euler

MAP_ID = "valley"
BX, BY = 65.0, 43.0              # play bounds (half sizes)
GX, GY = 72, 50                  # ground mesh half sizes (a bit past the bounds)

# ---------------------------------------------------------------- helpers
def clamp(v, a=0.0, b=1.0): return a if v < a else b if v > b else v
def smooth(e0, e1, x):
    t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t)

def stream_y(x): return 3.5 * math.sin(x / 17.0) + 1.0 * math.sin(x / 7.3)
def stream_depth(x): return 1.4 - 0.9 * (1 - smooth(4, 7, abs(x + 40)))      # shallow ford at x = -40
def water_z(x): return -0.6 * stream_depth(x) / 1.4

BR_HALF_X, BR_TOP, BR_SPAN, BR_END = 2.6, 2.0, 5.0, 10.0   # bridge: deck half width, height, span |y|, ramp end |y|

def height_raw(x, y):
    h = 0.0
    # north hill (+5): gentle at the sides, a cliff in the middle (x 16..44)
    cliff = smooth(10, 16, x) * (1 - smooth(44, 50, x))
    hn = (1 - cliff) * smooth(24, 34, y) + cliff * smooth(26.5, 28.5, y)
    h += 5.0 * hn + 0.5 * hn * math.sin(x / 9.0) * math.cos(y / 7.0)
    # south hill (+3.5)
    hs = smooth(-26, -36, y)
    h += 3.5 * hs + 0.4 * hs * math.sin(x / 8.0 + 1.0)
    # outer rim outside the play area (scenery)
    h += 7.0 * smooth(BX - 1, GX, abs(x)) + 7.0 * smooth(BY - 1, GY, abs(y))
    # stream channel
    d = abs(y - stream_y(x))
    h -= stream_depth(x) * (1 - smooth(3.0, 5.0, d))
    # bridge embankments (ramps up to the deck), solid ground: |y| 5..10 at |x| < 2.6, steep side walls
    if abs(x) < 3.4 and BR_SPAN - 0.2 < abs(y) < BR_END + 0.5:
        ramp = BR_TOP * (1 - smooth(BR_SPAN, BR_END, abs(y)))
        side = 1 - smooth(BR_HALF_X, BR_HALF_X + 0.6, abs(x))
        h = max(h, ramp * side)
    return h

# flat pads under the houses (MAP-DESIGN §7: ground under a house may vary at most 0.3)
HOUSE_PADS = [(-30, 14.5), (-16, 14.5), (16, 14.5), (30, 14.5), (-22, -15.5), (22, -15.5), (-40, 37.0)]
_PAD_Z = {}
def height(x, y):
    h = height_raw(x, y)
    for cx, cy in HOUSE_PADS:
        m = (1 - smooth(5.5, 8.0, abs(x - cx))) * (1 - smooth(4.5, 7.0, abs(y - cy)))
        if m > 0:
            if (cx, cy) not in _PAD_Z: _PAD_Z[(cx, cy)] = height_raw(cx, cy)
            h = h + (_PAD_Z[(cx, cy)] - h) * m
    return h

def slope_deg(x, y, e=0.5):
    dx = (height(x + e, y) - height(x - e, y)) / (2 * e)
    dy = (height(x, y + e) - height(x, y - e)) / (2 * e)
    return math.degrees(math.atan(math.hypot(dx, dy)))

def on_road(x, y):
    return (abs(x) < 2.5 and abs(y) < 27) or (20 < y < 22.5 and abs(x) < 61) or (-22.5 < y < -20 and abs(x) < 61)

# ---------------------------------------------------------------- palette (one texture for the whole map)
PAL = {  # index: colour
    0: 0x5f9a3c, 1: 0x6aa845, 2: 0x568f37, 3: 0x437c30,     # grass x3, dark grass
    4: 0x8a6a44, 5: 0x7a5c3a, 6: 0x7c7a74, 7: 0x66645f,     # dirt x2, rock x2
    8: 0xb8a57a, 9: 0x7a5230, 10: 0x4e3420, 11: 0x9a968c,   # sand, wood, dark wood, stone
    12: 0x9a3a2a, 13: 0x3d7a35, 14: 0x4f8f3c, 15: 0xffcf6a, # roof/cloth red, leaves x2, lantern glow (emissive)
}
SW = {"grass": (0, 1, 2), "dgrass": 3, "dirt": (4, 5), "rock": (6, 7), "sand": 8, "wood": 9, "dwood": 10,
      "stone": 11, "red": 12, "leaf": (13, 14), "glow": 15}

def swuv(i):
    c, r = i % 4, i // 4
    return ((c + 0.5) / 4, (r + 0.5) / 4)

def make_images():
    N, P = 64, 16
    rng = np.random.default_rng(11)
    col = np.zeros((N, N, 4), np.float32); col[..., 3] = 1
    emi = np.zeros((N, N, 4), np.float32); emi[..., 3] = 1
    for i, c in PAL.items():
        cx, cy = i % 4, i // 4
        base = np.array([(c >> 16) & 255, (c >> 8) & 255, c & 255], np.float32) / 255
        n = rng.normal(0, 0.03, (P, P))[..., None]
        col[cy * P:(cy + 1) * P, cx * P:(cx + 1) * P, :3] = np.clip(base * (1 + n), 0, 1)
        if i == 15:
            emi[cy * P:(cy + 1) * P, cx * P:(cx + 1) * P, :3] = base
    out = []
    for name, a in (("valley_palette", col), ("valley_emit", emi)):
        if name in bpy.data.images: bpy.data.images.remove(bpy.data.images[name])
        im = bpy.data.images.new(name, N, N, alpha=False)
        im.pixels.foreach_set(a.ravel()); im.file_format = 'PNG'; im.pack(); out.append(im)
    return out

def make_materials():
    imC, imE = make_images()
    def fresh(name):
        if name in bpy.data.materials: bpy.data.materials.remove(bpy.data.materials[name])
        m = bpy.data.materials.new(name); m.use_nodes = True; return m
    pal = fresh("valley_palette")
    nt = pal.node_tree; b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexImage"); tc.image = imC; tc.interpolation = 'Closest'
    te = nt.nodes.new("ShaderNodeTexImage"); te.image = imE; te.interpolation = 'Closest'
    nt.links.new(tc.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(te.outputs["Color"], b.inputs["Emission Color"])
    b.inputs["Emission Strength"].default_value = 1.5
    b.inputs["Roughness"].default_value = 0.9
    water = fresh("valley_water")
    b = water.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.16, 0.42, 0.62, 1)
    b.inputs["Roughness"].default_value = 0.08
    b.inputs["Alpha"].default_value = 0.72
    water.surface_render_method = 'BLENDED'
    col_m = fresh("valley_col")      # only for viewing collision shapes in Blender (col_ are invisible in game)
    b = col_m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (1, 0.2, 0.2, 1); b.inputs["Alpha"].default_value = 0.25
    col_m.surface_render_method = 'BLENDED'
    return pal, water, col_m

# ---------------------------------------------------------------- collections
def get_col(name, parent):
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
    if c.name not in parent.children:
        parent.children.link(c)
    return c

def wipe(col):
    for c in list(col.children):
        wipe(c)
        bpy.data.collections.remove(c)
    for o in list(col.objects):
        data = o.data
        bpy.data.objects.remove(o, do_unlink=True)
        if data is not None and data.users == 0:
            if isinstance(data, bpy.types.Mesh): bpy.data.meshes.remove(data)
            elif isinstance(data, bpy.types.Light): bpy.data.lights.remove(data)

ROOT = get_col("MAP_" + MAP_ID, bpy.context.scene.collection)
wipe(ROOT)
for a in list(bpy.data.actions):
    if a.name.startswith("valley_"):
        bpy.data.actions.remove(a)
C_MAIN = ROOT
C_LOGIC = get_col("valley_logic", ROOT)        # plain organisational collection (names decide meaning, not this)
C_DECO = get_col("valley_deco", ROOT)
C_FAR = get_col("deco_far", ROOT)
C_NOSH = get_col("noshadow", ROOT)
PAL_M, WATER_M, COL_M = make_materials()

# ---------------------------------------------------------------- mesh builder (palette UVs per face)
class MB:
    def __init__(s):
        s.bm = bmesh.new(); s.uv = s.bm.loops.layers.uv.new("UVMap")
    def _paint(s, faces, sw):
        u = swuv(sw)
        for f in faces:
            for l in f.loops: l[s.uv].uv = u
    def _faces(s, verts):
        vs = set(verts); return {f for v in vs for f in v.link_faces}
    def cyl(s, a, b, r1, r2, sw, n=8):
        a, b = Vector(a), Vector(b); d = b - a
        q = Vector((0, 0, 1)).rotation_difference(d.normalized())
        M = Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4()
        res = bmesh.ops.create_cone(s.bm, cap_ends=True, cap_tris=False, segments=n, radius1=r1, radius2=r2, depth=d.length, matrix=M)
        s._paint(s._faces(res['verts']), sw)
    def box(s, c, size, sw, rz=0.0):
        M = Matrix.Translation(c) @ Matrix.Rotation(rz, 4, 'Z') @ Matrix.Diagonal((*size, 1))
        res = bmesh.ops.create_cube(s.bm, size=1, matrix=M)
        s._paint(s._faces(res['verts']), sw)
    def ico(s, c, r, sw, sc=(1, 1, 1), sub=1):
        M = Matrix.Translation(c) @ Matrix.Diagonal((sc[0], sc[1], sc[2], 1))
        res = bmesh.ops.create_icosphere(s.bm, subdivisions=sub, radius=r, matrix=M)
        s._paint(s._faces(res['verts']), sw)
    def mesh(s, name, mat=None, flat=True):
        bmesh.ops.recalc_face_normals(s.bm, faces=s.bm.faces)
        me = bpy.data.meshes.new(name); s.bm.to_mesh(me); s.bm.free()
        me.materials.append(mat or PAL_M)
        for p in me.polygons: p.use_smooth = not flat
        return me

def obj(name, data, col, loc=(0, 0, 0), rz=0.0, scale=None):
    o = bpy.data.objects.new(name, data); col.objects.link(o)
    o.location = loc; o.rotation_euler = (0, 0, rz)
    if scale: o.scale = scale
    return o

def empty(name, loc, rz=0.0, kind='SINGLE_ARROW', size=1.5, col=None, scale=None):
    o = bpy.data.objects.new(name, None); (col or C_LOGIC).objects.link(o)
    o.empty_display_type = kind; o.empty_display_size = size
    o.location = loc; o.rotation_euler = (0, 0, rz)
    if scale: o.scale = scale
    return o

def face_dir(px, py, tx, ty):
    """rotation about Z so the empty's -Y points from (px,py) toward (tx,ty)"""
    return math.atan2(tx - px, -(ty - py))

COLN = [0]
def col_cyl(x, y, r, h, z0=None, name="col_"):
    """invisible collision cylinder (in game). Bottom at the ground under it."""
    COLN[0] += 1
    z0 = height(x, y) if z0 is None else z0
    me = MB(); me.cyl((0, 0, 0), (0, 0, h), r, r, 6, n=10)
    o = obj("%s%03d" % (name, COLN[0]), me.mesh("col_cyl", COL_M), C_LOGIC, (x, y, z0 - 0.3))
    o.display_type = 'WIRE'; o.hide_render = True
    return o

def col_box(x, y, sx, sy, h, rz=0.0, z0=None):
    COLN[0] += 1
    z0 = height(x, y) if z0 is None else z0
    me = MB(); me.box(Vector((0, 0, h / 2)), (sx, sy, h), 6)
    o = obj("col_%03d" % COLN[0], me.mesh("col_box", COL_M), C_LOGIC, (x, y, z0 - 0.3), rz)
    o.display_type = 'WIRE'; o.hide_render = True
    return o

# ---------------------------------------------------------------- ground
def build_ground():
    rnd = random.Random(1)
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new("UVMap")
    step = 1.0
    xs = np.arange(-GX, GX + 0.001, step); ys = np.arange(-GY, GY + 0.001, step)
    grid = [[bm.verts.new((x, y, height(x, y))) for x in xs] for y in ys]
    for j in range(len(ys) - 1):
        for i in range(len(xs) - 1):
            f = bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
            cx, cy = xs[i] + step / 2, ys[j] + step / 2
            cz = height(cx, cy); sl = slope_deg(cx, cy)
            if sl > 38: sw = rnd.choice(SW["rock"])
            elif cz < -0.35: sw = SW["sand"]
            elif on_road(cx, cy) and cz > -0.2: sw = rnd.choice(SW["dirt"])
            else:
                # grass in soft patches (spatial noise) instead of per-face random
                n = (math.sin(cx * 0.21 + math.sin(cy * 0.17) * 2.0) + math.sin(cy * 0.23 + cx * 0.05)
                     + 0.35 * math.sin(cx * 0.9 + cy * 0.7) + rnd.uniform(-0.25, 0.25))
                if cz > 4.2 or abs(cx) > BX or abs(cy) > BY: n -= 0.8
                sw = SW["dgrass"] if n < -1.1 else SW["grass"][2] if n < -0.2 else SW["grass"][0] if n < 0.8 else SW["grass"][1]
            u = swuv(sw)
            for l in f.loops: l[uvl].uv = u
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new("ground"); bm.to_mesh(me); bm.free()
    me.materials.append(PAL_M)
    return obj("ground", me, C_MAIN)

def build_water():
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new("UVMap")
    rows = []
    for x in np.arange(-BX - 2, BX + 2.001, 1.0):
        ys = stream_y(x); z = water_z(x); w = 4.1 if stream_depth(x) > 1.0 else 3.6
        rows.append((bm.verts.new((x, ys - w, z)), bm.verts.new((x, ys + w, z))))
    for (a0, b0), (a1, b1) in zip(rows, rows[1:]):
        bm.faces.new((a0, a1, b1, b0))
    me = bpy.data.meshes.new("env_water_stream"); bm.to_mesh(me); bm.free()
    me.materials.append(WATER_M)
    return obj("env_water_stream", me, C_MAIN)

def build_bounds():
    bm = bmesh.new()
    v = [bm.verts.new(p) for p in ((-BX, -BY, 0), (BX, -BY, 0), (BX, BY, 0), (-BX, BY, 0))]
    bm.faces.new(v)
    me = bpy.data.meshes.new("bounds"); bm.to_mesh(me); bm.free()
    o = obj("bounds", me, C_LOGIC); o.display_type = 'WIRE'; o.hide_render = True
    return o

# ---------------------------------------------------------------- bridge (floor_ deck over the stream + stone details)
def build_bridge():
    # deck top surface (floor_): flat at BR_TOP for |y| < BR_SPAN, slight overlap with the embankments
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new("UVMap")
    hx, y0 = BR_HALF_X, BR_SPAN + 0.3
    top = [bm.verts.new(p) for p in ((-hx, -y0, BR_TOP), (hx, -y0, BR_TOP), (hx, y0, BR_TOP), (-hx, y0, BR_TOP))]
    bot = [bm.verts.new((v.co.x, v.co.y, BR_TOP - 0.6)) for v in top]
    faces = [bm.faces.new(top), bm.faces.new(list(reversed(bot)))]
    for i in range(4):
        j = (i + 1) % 4; faces.append(bm.faces.new((top[i], bot[i], bot[j], top[j])))
    for f in faces:
        for l in f.loops: l[uvl].uv = swuv(SW["stone"])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new("floor_bridge"); bm.to_mesh(me); bm.free(); me.materials.append(PAL_M)
    obj("floor_bridge", me, C_MAIN)
    # decoration: arch under the deck, parapets along the sides, stone facing on the embankment walls
    d = MB()
    for k in range(9):                                   # arch ring stones
        a = math.pi * k / 8; y = -BR_SPAN * math.cos(a); z = BR_TOP - 0.6 - 1.4 * math.sin(a) * 0.35
        for sx in (-1, 1):
            d.box(Vector((sx * (hx - 0.15), y, z - 0.2)), (0.3, 1.3, 0.5), SW["stone"])
    for sx in (-1, 1):                                   # parapets (decor only, low)
        for k in range(-5, 6):
            d.box(Vector((sx * (hx - 0.18), k * 1.0, BR_TOP + 0.35)), (0.32, 0.9, 0.7), SW["stone"] if k % 2 else 7)
        for sy in (-1, 1):                               # ramp side walls
            for k in range(6):
                y = sy * (BR_SPAN + 0.5 + k * 0.9); z = max(0.2, height(0, y)) / 2
                d.box(Vector((sx * (hx + 0.1), y, z)), (0.35, 0.95, max(0.4, height(0, y)) + 0.2), SW["stone"] if (k + sy) % 2 else 7)
    obj("bridge_stones", d.mesh("bridge_stones"), C_DECO)
    # under-deck bank parts are lower than 2.8 → solid (MAP-DESIGN §4); tops stay below the deck so the deck is walkable
    for sy in (-1, 1):
        col_box(0, sy * 4.2, 2 * hx + 0.2, 2.4, 1.5, z0=-0.2)

# ---------------------------------------------------------------- reusable decor meshes (linked duplicates = instances)
def mesh_pine():
    m = MB(); m.cyl((0, 0, 0), (0, 0, 1.6), 0.28, 0.22, SW["dwood"], n=6)
    for z, r, h in ((1.2, 2.1, 2.6), (2.6, 1.65, 2.3), (3.9, 1.15, 2.0)):
        m.cyl((0, 0, z), (0, 0, z + h), r, 0.05, SW["leaf"][0], n=7)
    return m.mesh("deco_pine")
def mesh_oak():
    m = MB(); m.cyl((0, 0, 0), (0, 0, 2.4), 0.32, 0.24, SW["dwood"], n=6)
    m.ico(Vector((0, 0, 3.4)), 1.9, SW["leaf"][1], sc=(1.1, 1.0, 0.85))
    m.ico(Vector((0.9, 0.4, 2.9)), 1.2, SW["leaf"][0])
    m.ico(Vector((-0.8, -0.5, 3.0)), 1.1, SW["leaf"][1])
    return m.mesh("deco_oak")
def mesh_rock(seed):
    rnd = random.Random(seed); m = MB()
    m.ico(Vector((0, 0, 0.35)), 1.0, SW["rock"][seed % 2], sc=(1.0, 0.8, 0.65), sub=1)
    me = m.mesh("deco_rock%d" % seed)
    for v in me.vertices:
        v.co *= 1 + rnd.uniform(-0.12, 0.12)
    return me
def mesh_fence():
    m = MB()
    for x in (-1.9, 0, 1.9): m.box(Vector((x, 0, 0.5)), (0.16, 0.16, 1.0), SW["dwood"])
    for z in (0.4, 0.8): m.box(Vector((0, 0, z)), (4.0, 0.08, 0.12), SW["wood"])
    return m.mesh("deco_fence")
def mesh_lantern():
    m = MB(); m.cyl((0, 0, 0), (0, 0, 2.6), 0.08, 0.07, SW["dwood"], n=6)
    m.box(Vector((0.35, 0, 2.55)), (0.75, 0.08, 0.08), SW["dwood"])
    m.box(Vector((0.65, 0, 2.2)), (0.28, 0.28, 0.4), SW["glow"])
    m.box(Vector((0.65, 0, 2.43)), (0.36, 0.36, 0.06), SW["dwood"])
    return m.mesh("deco_lantern")
def mesh_tuft():
    m = MB()
    for k in range(3):
        a = k * 2.1
        m.box(Vector((math.cos(a) * 0.08, math.sin(a) * 0.08, 0.2)), (0.05, 0.25, 0.4), SW["grass"][k % 3], rz=a)
    return m.mesh("deco_tuft")
def mesh_flower():
    m = MB(); m.cyl((0, 0, 0), (0, 0, 0.35), 0.02, 0.02, SW["leaf"][0], n=4)
    m.ico(Vector((0, 0, 0.38)), 0.08, SW["red"], sub=0)
    return m.mesh("deco_flower")

# ---------------------------------------------------------------- placement
LAYOUT = {
    "houses": [(-30, 14.5, math.pi), (-16, 14.5, math.pi), (16, 14.5, math.pi), (30, 14.5, math.pi),
               (-22, -15.5, 0.0), (22, -15.5, 0.0), (-40, 37.0, 0.0)],
    "spawns": [(-56, 14), (-56, -15), (56, 14), (56, -15), (0, 34), (0, -34)],
    "red": [(-58, 9), (-58, -9), (-50, 30)], "blue": [(58, 9), (58, -9), (50, -30)],
    "enemy": [(-62, 38), (62, 38), (-62, -38), (62, -38)],
    "crates": [(-23, 18.8, 0.3), (-21.6, 19.3, 1.1), (23, 18.8, 0.2), (9, 18.5, 0.7), (-9, -18.5, 0.4),
               (28, -18.5, 1.3), (-31, -11.5, 0.1), (45, 10, 0.9)],
    "barrels": [(-24.6, 18.4), (24.6, 18.8), (-7, 15.5), (12, -18.6), (-28, -18.6), (46.5, 11.5)],
    "chests": [(-47, 39, 0.4), (52, -38, -0.6)],
    "lanterns": [(4.2, 11.5), (-4.2, -11.5), (-23, 23.6), (23, 23.6), (-12, -23.6), (12, -23.6), (-34, 31.5), (36, -31)],
    "well": (9, -12.5), "stall": (-8, 17.5), "windmill": (40, -37.5),
}

def keepout(x, y, extra=0.0):
    for hx, hy, _ in LAYOUT["houses"]:
        if abs(x - hx) < 6 + extra and abs(y - hy) < 5 + extra: return True
    for px, py in LAYOUT["spawns"] + LAYOUT["red"] + LAYOUT["blue"]:
        if math.hypot(x - px, y - py) < 6 + extra: return True
    for px, py in LAYOUT["lanterns"]:
        if math.hypot(x - px, y - py) < 2.5: return True
    for p in (LAYOUT["well"], LAYOUT["stall"], LAYOUT["windmill"]):
        if math.hypot(x - p[0], y - p[1]) < 6: return True
    if on_road(x, y) or abs(y - stream_y(x)) < 6.5 or (abs(x) < 5 and abs(y) < 12): return True
    return False

def place_logic():
    build_bounds()
    for i, (x, y) in enumerate(LAYOUT["spawns"], 1):
        empty("spawn_%d" % i, (x, y, height(x, y)), face_dir(x, y, 0, 0))
    for team in ("red", "blue"):
        for i, (x, y) in enumerate(LAYOUT[team], 1):
            empty("spawn_%s_%d" % (team, i), (x, y, height(x, y)), face_dir(x, y, 0, 0))
    for i, (x, y) in enumerate(LAYOUT["enemy"], 1):
        empty("enemy_spawn_%d" % i, (x, y, height(x, y)), face_dir(x, y, 0, 0), kind='PLAIN_AXES')
    for i, (x, y, r) in enumerate(LAYOUT["crates"], 1):
        empty("prop_crate_%d" % i, (x, y, height(x, y)), r, kind='CUBE', size=0.65)
    for i, (x, y) in enumerate(LAYOUT["barrels"], 1):
        empty("prop_barrel_%d" % i, (x, y, height(x, y)), 0, kind='CIRCLE', size=0.75)
    for i, (x, y, r) in enumerate(LAYOUT["chests"], 1):
        empty("prop_chest_%d" % i, (x, y, height(x, y)), r, kind='CUBE', size=0.55)
    for i, (x, y, r) in enumerate(LAYOUT["houses"], 1):
        # scale 1 = standard 8 x 6.5 house; door side = -Y of the empty
        e = empty("bld_house_%d" % i, (x, y, height(x, y)), r, kind='CUBE', size=1.0)
        e.empty_display_size = 1.0; e.scale = (1, 1, 1)
        e["note"] = "house 8 x 6.5, door faces -Y"

def place_decor():
    rnd = random.Random(7)
    pine, oak = mesh_pine(), mesh_oak()
    rocks = [mesh_rock(k) for k in range(3)]
    # trees: hills + outer edge, outside keep-out zones
    n = 0; tries = 0
    while n < 46 and tries < 4000:
        tries += 1
        x = rnd.uniform(-BX + 2, BX - 2); y = rnd.uniform(-BY + 2, BY - 2)
        z = height(x, y)
        wild = abs(y) > 25 or abs(x) > 50
        if not wild or keepout(x, y) or slope_deg(x, y) > 32: continue
        ok = True
        for o in C_DECO.objects:
            if o.name.startswith("tree") and (Vector((x, y)) - o.location.xy).length < 5.0: ok = False; break
        if not ok: continue
        n += 1
        s = rnd.uniform(0.85, 1.25)
        t = obj("tree_%02d" % n, pine if y > 0 or rnd.random() < 0.3 else oak, C_DECO, (x, y, z - 0.1), rnd.uniform(0, 6.28), (s, s, s))
        col_cyl(x, y, 0.45 * s, 3.0)
    # scenery trees outside the bounds (no collision)
    for k in range(40):
        side = k % 4
        x = rnd.uniform(-GX + 2, GX - 2) if side < 2 else (BX + rnd.uniform(1.5, 6)) * (1 if side == 2 else -1)
        y = (BY + rnd.uniform(1.5, 6)) * (1 if side == 0 else -1) if side < 2 else rnd.uniform(-GY + 2, GY - 2)
        s = rnd.uniform(1.0, 1.5)
        obj("tree_edge_%02d" % k, pine if rnd.random() < 0.6 else oak, C_DECO, (x, y, height(x, y) - 0.1), rnd.uniform(0, 6.28), (s, s, s))
    # rocks (cover)
    n = 0; tries = 0
    while n < 18 and tries < 3000:
        tries += 1
        x = rnd.uniform(-BX + 3, BX - 3); y = rnd.uniform(-BY + 3, BY - 3)
        if keepout(x, y, 1.0) or slope_deg(x, y) > 30: continue
        n += 1
        s = rnd.uniform(0.9, 1.8)
        obj("rock_%02d" % n, rocks[n % 3], C_DECO, (x, y, height(x, y) - 0.15), rnd.uniform(0, 6.28), (s, s * rnd.uniform(0.8, 1.1), s))
        col_cyl(x, y, 0.85 * s, 1.0 * s)
    # stepping stones at the ford (decor, low enough to walk over)
    for k in range(5):
        x = -40 + rnd.uniform(-1.2, 1.2); y = stream_y(x) - 3.2 + k * 1.6
        obj("ford_stone_%d" % k, rocks[k % 3], C_DECO, (x, y, water_z(x) - 0.25), rnd.uniform(0, 6.28), (0.55, 0.5, 0.35))
    # fences along the roads in front of the houses (low: jumpable cover)
    fence = mesh_fence()
    for fx, fy, rz in ((-36, 23.4, 0), (-8, 23.4, 0), (8, 23.4, 0), (36, 23.4, 0), (-36, -23.4, 0), (36, -23.4, 0),
                       (-44, -12, math.pi / 2), (44, 12, math.pi / 2)):
        obj("fence_%d_%d" % (fx, fy), fence, C_DECO, (fx, fy, height(fx, fy)), rz)
        col_box(fx, fy, 4.0 if rz == 0 else 0.3, 0.3 if rz == 0 else 4.0, 1.0)
    # lanterns + point lights (light_)
    lan = mesh_lantern()
    for i, (x, y) in enumerate(LAYOUT["lanterns"], 1):
        rz = face_dir(x, y, 0, 0) + math.pi / 2
        z = height(x, y)
        obj("lantern_%d" % i, lan, C_DECO, (x, y, z), rz)
        L = bpy.data.lights.new("light_lantern_%d" % i, 'POINT'); L.energy = 120; L.color = (1.0, 0.8, 0.45); L.shadow_soft_size = 0.2
        lo = obj("light_lantern_%d" % i, L, C_LOGIC, (x + math.cos(rz) * 0.65, y + math.sin(rz) * 0.65, z + 2.2))
        col_cyl(x, y, 0.2, 2.6)
    # well
    wx, wy = LAYOUT["well"]; wz = height(wx, wy); m = MB()
    m.cyl((0, 0, 0), (0, 0, 0.9), 1.1, 1.1, SW["stone"], n=12)
    m.cyl((0, 0, 0.9), (0, 0, 0.95), 0.9, 0.9, SW["dwood"], n=12)
    for sx in (-1, 1): m.box(Vector((sx * 0.95, 0, 1.6)), (0.14, 0.14, 1.5), SW["dwood"])
    m.box(Vector((0, 0, 2.45)), (2.4, 1.4, 0.12), SW["red"]); m.box(Vector((0, 0, 2.0)), (2.0, 0.08, 0.08), SW["dwood"])
    obj("well", m.mesh("deco_well"), C_DECO, (wx, wy, wz))
    col_cyl(wx, wy, 1.1, 1.0)
    # market stall
    sx_, sy_ = LAYOUT["stall"]; sz = height(sx_, sy_); m = MB()
    for px in (-1.4, 1.4):
        for py in (-0.9, 0.9): m.box(Vector((px, py, 1.1)), (0.12, 0.12, 2.2), SW["dwood"])
    m.box(Vector((0, -0.2, 2.25)), (3.2, 2.4, 0.08), SW["red"]); m.box(Vector((0, -0.4, 0.85)), (2.9, 1.0, 0.12), SW["wood"])
    for k in range(4): m.ico(Vector((-1.0 + k * 0.65, -0.4, 1.05)), 0.18, (SW["red"], 15, SW["leaf"][0], SW["sand"])[k], sub=1)
    obj("market_stall", m.mesh("deco_stall"), C_DECO, (sx_, sy_, sz), math.pi)
    col_box(sx_, sy_, 3.0, 2.0, 1.0)
    # windmill (body decor + anim_ blades)
    mx, my = LAYOUT["windmill"]; mz = height(mx, my); m = MB()
    m.cyl((0, 0, 0), (0, 0, 6.5), 2.4, 1.6, SW["stone"], n=10)
    m.cyl((0, 0, 6.5), (0, 0, 8.6), 2.0, 0.2, SW["red"], n=10)
    m.box(Vector((0, -2.25, 1.0)), (1.1, 0.3, 2.0), SW["dwood"])
    obj("windmill", m.mesh("deco_windmill"), C_DECO, (mx, my, mz), face_dir(mx, my, 0, 0))
    col_cyl(mx, my, 2.3, 7.0)
    m = MB(); m.cyl((0, 0, 0), (0, -0.6, 0), 0.25, 0.25, SW["dwood"], n=8)
    for k in range(4):
        a = k * math.pi / 2
        c = Vector((math.cos(a) * 2.6, -0.4, math.sin(a) * 2.6))
        m.box(c, (0.4 if k % 2 == 0 else 5.0, 0.06, 5.0 if k % 2 == 0 else 0.4), SW["wood"])
    rz = face_dir(mx, my, 0, 0)
    fwd = Vector((math.sin(rz), -math.cos(rz), 0))
    blades = obj("anim_windmill_blades", m.mesh("anim_windmill_blades"), C_DECO, Vector((mx, my, mz + 6.0)) + fwd * 2.0, rz)
    blades.animation_data_create()
    for f, ang in ((1, 0.0), (121, -2 * math.pi)):
        blades.rotation_euler = (0, ang, rz); blades.keyframe_insert("rotation_euler", index=1, frame=f)
    blades.animation_data.action.name = "valley_windmill_spin"
    # far mountains (deco_far: no collision, no shadow)
    for k in range(16):
        a = k / 16 * 2 * math.pi + rnd.uniform(-0.1, 0.1)
        x = math.cos(a) * 118; y = math.sin(a) * 82
        h = rnd.uniform(22, 42); r = rnd.uniform(22, 34)
        mm = MB(); mm.cyl((0, 0, -2), (0, 0, h), r, 2.0, SW["rock"][k % 2], n=7)
        mm.cyl((0, 0, -2), (0, 0, h * 0.45), r * 1.15, r * 0.55, SW["dgrass"], n=7)
        obj("mountain_%02d" % k, mm.mesh("deco_mountain_%02d" % k), C_FAR, (x, y, 0), rnd.uniform(0, 6))
    # grass tufts + flowers (noshadow, instanced)
    tuft, flower = mesh_tuft(), mesh_flower()
    n = 0
    while n < 160:
        x = rnd.uniform(-BX, BX); y = rnd.uniform(-BY, BY)
        if on_road(x, y) or height(x, y) < -0.3 or slope_deg(x, y) > 30: continue
        n += 1
        obj("tuft_%03d" % n if n % 4 else "flower_%03d" % n, tuft if n % 4 else flower, C_NOSH,
            (x, y, height(x, y)), rnd.uniform(0, 6.28), (1.3,) * 3)

# ---------------------------------------------------------------- build
build_ground()
build_water()
build_bridge()
place_logic()
place_decor()

# map settings (MAP-DESIGN §3): custom properties on the MAP_ collection
ROOT["name"] = "⛰️ หมู่บ้านในหุบเขา"
ROOT["desc"] = "หมู่บ้านริมลำธารกลางหุบเขา สะพานหินเชื่อมสองฝั่ง เนินสูงทั้งเหนือและใต้"
ROOT["sky"] = "day"
ROOT["fog"] = "#9fb8c8,90,260"
ROOT["modes"] = "coop,ffa,duel,tdm,br"
ROOT["random"] = 1
ROOT["weather"] = "clear:50,rain:30,fog:20"
ROOT["music"] = "meadow"

tris = 0
for o in ROOT.all_objects:
    if o.type == 'MESH' and not o.name.lower().startswith(("col_", "bounds")):
        tris += sum(len(p.vertices) - 2 for p in o.data.polygons)
result = {"objects": len(ROOT.all_objects), "col": sum(1 for o in ROOT.all_objects if o.name.startswith("col_")),
          "tris_visible": tris, "lights": sum(1 for o in ROOT.all_objects if o.type == 'LIGHT'),
          "materials": len({m.name for o in ROOT.all_objects if o.type == 'MESH' for m in o.data.materials})}
