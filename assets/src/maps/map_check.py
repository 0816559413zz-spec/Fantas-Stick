# Rule checker for a map collection (MAP-DESIGN.md). Run inside Blender with MAP_ID set, e.g.
#   MAP_ID = "valley"; exec(open(".../map_check.py").read())
# Prints/returns a list of problems. Uses a top-down ray cast against the real meshes, so it works for any map.
import bpy, math
from mathutils import Vector
from mathutils.bvhtree import BVHTree

MAP_ID = globals().get("MAP_ID", "valley")
root = bpy.data.collections["MAP_" + MAP_ID]
objs = list(root.all_objects)
low = lambda o: o.name.lower()
problems, info = [], {}

def tree(prefixes):
    dg = bpy.context.evaluated_depsgraph_get()
    verts, polys = [], []
    for o in objs:
        if o.type != 'MESH' or not low(o).startswith(prefixes): continue
        me = o.evaluated_get(dg).to_mesh(); M = o.matrix_world; off = len(verts)
        verts += [M @ v.co for v in me.vertices]; polys += [[off + i for i in p.vertices] for p in me.polygons]
        o.evaluated_get(dg).to_mesh_clear()
    return BVHTree.FromPolygons(verts, polys) if polys else None

T_GROUND, T_FLOOR = tree(("ground",)), tree(("floor_",))
def ground_z(x, y):
    hit = T_GROUND.ray_cast(Vector((x, y, 200)), Vector((0, 0, -1)))
    return hit[0].z if hit[0] else None

cols = [o for o in objs if low(o).startswith("col_")]
def col_shapes():
    out = []
    for o in cols:
        bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
        out.append((o, min(v.x for v in bb), max(v.x for v in bb), min(v.y for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
    return out
CS = col_shapes()
def covered(x, y, below=None):
    for o, x0, x1, y0, y1, top in CS:
        if x0 <= x <= x1 and y0 <= y <= y1 and (below is None or top < below): return True
    return False

# --- counts / budgets
spawns = [o for o in objs if low(o).startswith("spawn_") and not low(o).startswith(("spawn_red", "spawn_blue"))]
info["spawns"] = len(spawns)
if len(spawns) < 6: problems.append("spawn_: need 6, have %d" % len(spawns))
for t in ("red", "blue"):
    n = sum(1 for o in objs if low(o).startswith("spawn_" + t)); info["spawn_" + t] = n
info["col_"] = len(cols)
if len(cols) > 300: problems.append("col_: %d > 300" % len(cols))
chests = [o for o in objs if low(o).startswith("prop_chest_")]
if len(chests) > 2: problems.append("prop_chest_: %d > 2" % len(chests))
lights = [o for o in objs if low(o).startswith("light_")]
info["light_"] = len(lights)
if len(lights) > 12: problems.append("light_: %d > 12" % len(lights))
for o in lights:
    if o.type != 'LIGHT' or o.data.type != 'POINT': problems.append("%s: light_ must be a Point Light" % o.name)
anims = [o for o in objs if low(o).startswith("anim_")]
if len(anims) > 20: problems.append("anim_: %d > 20" % len(anims))
mats = {m.name for o in objs if o.type == 'MESH' and not low(o).startswith(("col_", "bounds")) for m in o.data.materials if m}
info["materials"] = sorted(mats)
if len(mats) > 8: problems.append("materials: %d > 8" % len(mats))
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs if o.type == 'MESH' and not low(o).startswith(("col_", "bounds")))
info["tris"] = tris
if tris > 150000: problems.append("tris: %d > 150000" % tris)
if not any(low(o).startswith("bounds") for o in objs): problems.append("no bounds plane (game will use ground edges)")
for k in ("name", "desc", "sky", "modes", "random"):
    if k not in root.keys(): problems.append("collection property '%s' missing" % k)

# --- col_ must only rotate around Z
for o in cols:
    r = o.matrix_world.to_euler()
    if abs(r.x) > 1e-3 or abs(r.y) > 1e-3: problems.append("%s: tilted (only Z rotation allowed)" % o.name)

# --- spawns: on ground, 4 units clear of col_
for o in spawns + [o for o in objs if low(o).startswith(("spawn_red", "spawn_blue"))]:
    x, y = o.location.x, o.location.y
    g = ground_z(x, y)
    if g is None: problems.append("%s: no ground below" % o.name); continue
    if abs(g - o.location.z) > 0.3: problems.append("%s: not on the ground (%.2f vs %.2f)" % (o.name, o.location.z, g))
    for c, x0, x1, y0, y1, top in CS:
        dx = max(x0 - x, 0, x - x1); dy = max(y0 - y, 0, y - y1)
        if math.hypot(dx, dy) < 4: problems.append("%s: %s within 4 units" % (o.name, c.name)); break

# --- houses on flat ground (footprint 8 x 6.5 scaled by the empty)
for o in objs:
    if not low(o).startswith("bld_house_"): continue
    hx, hy = 4.0 * o.scale.x, 3.25 * o.scale.y
    zs = []
    for i in range(-4, 5):
        for j in range(-4, 5):
            p = o.matrix_world @ Vector((i / 4 * hx / o.scale.x, j / 4 * hy / o.scale.y, 0))
            g = ground_z(p.x, p.y)
            if g is not None: zs.append(g)
    d = max(zs) - min(zs)
    if d > 0.3: problems.append("%s: ground under the house varies %.2f (> 0.3)" % (o.name, d))

# --- under floor_: clearance >= 2.8 or blocked by a col_ that stays below the deck
if T_FLOOR:
    bad = 0
    for o in objs:
        if not low(o).startswith("floor_"): continue
        bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
        x0, x1 = min(v.x for v in bb), max(v.x for v in bb); y0, y1 = min(v.y for v in bb), max(v.y for v in bb)
        x = x0
        while x <= x1:
            y = y0
            while y <= y1:
                hit = T_FLOOR.ray_cast(Vector((x, y, 200)), Vector((0, 0, -1)))
                g = ground_z(x, y)
                if hit[0] and g is not None:
                    gap = hit[0].z - g
                    if 0.05 < gap < 2.8 and not covered(x, y, below=hit[0].z):
                        bad += 1
                y += 0.5
            x += 0.5
    if bad: problems.append("floor_: %d points with clearance < 2.8 not blocked by col_" % bad)

# --- ground range inside bounds
zmin, zmax = 1e9, -1e9
b = next((o for o in objs if low(o).startswith("bounds")), None)
if b:
    bb = [b.matrix_world @ Vector(c) for c in b.bound_box]
    bx0, bx1 = min(v.x for v in bb), max(v.x for v in bb); by0, by1 = min(v.y for v in bb), max(v.y for v in bb)
    x = bx0
    while x <= bx1:
        y = by0
        while y <= by1:
            g = ground_z(x, y)
            if g is not None: zmin, zmax = min(zmin, g), max(zmax, g)
            y += 1.0
        x += 1.0
    info["ground_range"] = (round(zmin, 2), round(zmax, 2))
    if zmin < -5 or zmax > 20: problems.append("ground range %.1f..%.1f outside -5..20" % (zmin, zmax))

result = {"problems": problems, "info": info}
print(result)
