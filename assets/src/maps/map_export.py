# Map exporter for Fantas Stick (MAP-DESIGN.md). Run inside Blender with the map's .blend open:
#   MAP_ID = "valley"; exec(open(r"C:\AI Project\Fantas-Stick\assets\src\maps\map_export.py", encoding="utf-8").read())
# (MAP_ID can be left out when the file has only one MAP_<id> collection.)
# Writes  assets/maps/<id>.json  (gameplay data: height grid, floors, collision, spawns, props, houses, lights ...)
#         assets/maps/<id>.glb   (what you see: every visual mesh, Draco compressed, animations of anim_ objects)
# and adds/bumps the "maps" entry in assets/manifest.json. Runs map_check.py (if present) and prints its problems.
#
# Coordinates: Blender (x, y) with the map centre at (0,0) -> game px  x = (bx + W/2)*20,  y = (H/2 - by)*20
# Heights in the JSON are Blender Z (world units); the game stores everything else as "height above the ground".
import bpy, json, math, os, base64, struct, array
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT_DIR = globals().get("ROOT_DIR") or r"C:\AI Project\Fantas-Stick\assets"
CELL = 0.5            # height grid spacing (units) — the game reads it from the file
DRACO = True
NONE = -32768         # "no surface" in int16 grids

cols_all = [c for c in bpy.data.collections if c.name.startswith("MAP_")]
MAP_ID = globals().get("MAP_ID") or (cols_all[0].name[4:] if len(cols_all) == 1 else None)
assert MAP_ID, "set MAP_ID (collections found: %s)" % [c.name for c in cols_all]
ROOT = bpy.data.collections["MAP_" + MAP_ID]

# ---------------------------------------------------------------- objects (skip sub-collections whose name starts with "_")
def walk(col, out, flags):
    f = set(flags)
    n = col.name.lower()
    if n.startswith("deco_far") or n.startswith("noshadow"): f.add("ns")
    if n.startswith("deco_far"): f.add("far")
    for o in col.objects:
        if o.name not in out: out[o.name] = (o, f)
    for c in col.children:
        if not c.name.startswith("_"): walk(c, out, f)
OBJ = {}
walk(ROOT, OBJ, set())
objs = [v[0] for v in OBJ.values()]
low = lambda o: o.name.lower()
def pre(*p): return [o for o in objs if low(o).startswith(p)]
MARK = ("col_", "bounds", "spawn_", "enemy_spawn_", "prop_", "bld_", "ring_", "task_", "light_")
problems, info = [], {}

dg = bpy.context.evaluated_depsgraph_get()
def world_mesh(o):
    e = o.evaluated_get(dg); me = e.to_mesh(); M = o.matrix_world
    v = [M @ x.co for x in me.vertices]; p = [list(f.vertices) for f in me.polygons]
    e.to_mesh_clear(); return v, p
def tree(lst):
    V, P = [], []
    for o in lst:
        if o.type != 'MESH': continue
        v, p = world_mesh(o); off = len(V); V += v; P += [[off + i for i in f] for f in p]
    return BVHTree.FromPolygons(V, P) if P else None

grounds = [o for o in pre("ground") if o.type == 'MESH']
assert grounds, "no 'ground' mesh in MAP_%s" % MAP_ID
T_G = tree(grounds)
def gz(x, y):
    h = T_G.ray_cast(Vector((x, y, 1000)), Vector((0, 0, -1)))
    return h[0].z if h[0] else None

# ---------------------------------------------------------------- size from bounds (or ground)
b = next(iter(pre("bounds")), None)
src = [b] if b else grounds
xs, ys = [], []
for o in src:
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c); xs.append(w.x); ys.append(w.y)
HW, HH = max(abs(min(xs)), abs(max(xs))), max(abs(min(ys)), abs(max(ys)))
if not b: problems.append("no bounds plane: using ground size")
WU, HU = 2 * HW, 2 * HH
W, H = round(WU * 20), round(HU * 20)
C = CELL * 20
def to_sim(bx, by): return ((bx + HW) * 20, (HH - by) * 20)
def to_b(x, y): return (x / 20 - HW, HH - y / 20)
def fwd_a(rz): return math.atan2(math.cos(rz), math.sin(rz))   # Blender -Y front -> game angle
def r1(v): return round(v, 1)

def b64(vals):
    a = array.array('h', vals)
    if a.itemsize != 2 or struct.pack('=h', 1) != b'\x01\x00': a.byteswap()
    return base64.b64encode(a.tobytes()).decode('ascii')
def cm(z): return NONE if z is None else max(-32767, min(32767, round(z * 100)))

# ---------------------------------------------------------------- ground height grid
NX, NY = int(round(W / C)) + 1, int(round(H / C)) + 1
g, miss = [], 0
for j in range(NY):
    for i in range(NX):
        bx, by = to_b(i * C, j * C); z = gz(bx, by)
        if z is None: miss += 1; z = 0.0
        g.append(cm(z))
if miss: problems.append("ground: %d grid points have no ground below (used 0)" % miss)
gvals = [v / 100 for v in g]
info["ground_range"] = (min(gvals), max(gvals))
def gsim(x, y):
    fx = min(max(x / C, 0), NX - 1.001); fy = min(max(y / C, 0), NY - 1.001)
    i, j = int(fx), int(fy); u, v = fx - i, fy - j; k = j * NX + i
    return ((gvals[k] * (1 - u) + gvals[k + 1] * u) * (1 - v) + (gvals[k + NX] * (1 - u) + gvals[k + NX + 1] * u) * v)
def gB(bx, by): return gsim(*to_sim(bx, by))

# ---------------------------------------------------------------- floors (bridges, balconies): top + bottom surface per grid point
floors = []
for o in pre("floor_"):
    if o.type != 'MESH': continue
    T = tree([o]); xs, ys = [], []
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c); x, y = to_sim(w.x, w.y); xs.append(x); ys.append(y)
    x0, y0 = math.floor(min(xs) / C) * C, math.floor(min(ys) / C) * C
    nx, ny = int(math.ceil((max(xs) - x0) / C)) + 1, int(math.ceil((max(ys) - y0) / C)) + 1
    top, bot, low_n = [], [], 0
    for j in range(ny):
        for i in range(nx):
            bx, by = to_b(x0 + i * C, y0 + j * C)
            ht = T.ray_cast(Vector((bx, by, 1000)), Vector((0, 0, -1)))
            hb = T.ray_cast(Vector((bx, by, -1000)), Vector((0, 0, 1)))
            if ht[0]:
                top.append(cm(ht[0].z)); bot.append(cm(hb[0].z if hb[0] else ht[0].z))
                gap = (hb[0].z if hb[0] else ht[0].z) - gB(bx, by)
                if 0.3 < gap < 2.8: low_n += 1
            else:
                top.append(NONE); bot.append(NONE)
    floors.append({"x0": r1(x0), "y0": r1(y0), "nx": nx, "ny": ny, "top": b64(top), "bot": b64(bot)})
    info.setdefault("floors", []).append("%s %dx%d" % (o.name, nx, ny))
    if low_n: info.setdefault("floor_low_points", {})[o.name] = low_n   # map_check reports whether a col_ blocks them

# ---------------------------------------------------------------- collision: col_ / colv_ -> circles (boxes become a chain of circles)
obs = []
def add_circle(bx, by, r, top, k, extra=None):
    x, y = to_sim(bx, by); hg = top - gB(bx, by)
    if hg <= 0.05: return
    c = {"x": r1(x), "y": r1(y), "r": r1(r * 20), "hgt": round(hg, 2), "k": k}
    if extra: c.update(extra)
    obs.append(c)
for o in pre("col_", "colv_"):
    if o.type != 'MESH': continue
    rot = o.matrix_world.to_euler()
    if abs(rot.x) > 1e-3 or abs(rot.y) > 1e-3: problems.append("%s: tilted (only Z rotation allowed)" % o.name)
    M = o.matrix_world; bb = [Vector(c) for c in o.bound_box]
    lx0, lx1 = min(v.x for v in bb), max(v.x for v in bb); ly0, ly1 = min(v.y for v in bb), max(v.y for v in bb)
    sx, sy = M.col[0].xyz.length, M.col[1].xyz.length
    ex, ey = (lx1 - lx0) / 2 * sx, (ly1 - ly0) / 2 * sy
    cen = M @ Vector(((lx0 + lx1) / 2, (ly0 + ly1) / 2, 0))
    top = max((M @ v).z for v in bb)
    k = "colv" if low(o).startswith("colv_") else "col"
    if "k" in o.keys(): k = str(o["k"])                     # custom property k (e.g. "hoop" = Quidditch goal)
    ex_ = {"ring": round(float(o["ring"]), 2)} if "ring" in o.keys() else None   # hoop ring height above ground
    nv = len(o.data.vertices)
    if nv > 8 and abs(ex - ey) < 0.15 * max(ex, ey):
        add_circle(cen.x, cen.y, max(ex, ey), top, k, ex_); continue
    rz = rot.z; ax = Vector((math.cos(rz), math.sin(rz))); ay = Vector((-math.sin(rz), math.cos(rz)))
    if ey > ex: ax, ay, ex, ey = ay, ax, ey, ex          # ax = long axis
    r = ey; L = ex - r
    n = max(1, int(math.ceil(L / (r * 1.1)))) if L > 0.01 else 0
    for t in range(n + 1):
        d = -L + 2 * L * t / n if n else 0.0
        add_circle(cen.x + ax.x * d, cen.y + ax.y * d, r, top, k, ex_)
if len(obs) > 2000: problems.append("collision circles: %d (heavy, simplify col_)" % len(obs))
info["col_circles"] = len(obs)

# ---------------------------------------------------------------- markers
def num(o):
    t = ''.join(ch for ch in o.name.split('.')[0] if ch.isdigit()); return int(t) if t else 0
def pos(o):
    w = o.matrix_world.translation; x, y = to_sim(w.x, w.y); return x, y, w.z - gB(w.x, w.y), o.matrix_world.to_euler().z
spawns = []
for o in sorted(pre("spawn_"), key=num):
    x, y, _, rz = pos(o); s = {"x": r1(x), "y": r1(y), "a": round(fwd_a(rz), 3)}
    if low(o).startswith("spawn_red"): s["t"] = 1
    elif low(o).startswith("spawn_blue"): s["t"] = 0
    spawns.append(s)
if sum(1 for s in spawns if "t" not in s) < 6: problems.append("spawn_: need 6")
espawn = [{"x": r1(p[0]), "y": r1(p[1])} for p in (pos(o) for o in pre("enemy_spawn_"))]
rings = [{"x": r1(p[0]), "y": r1(p[1]), "h": round(max(1.0, p[2]), 2)} for p in (pos(o) for o in sorted(pre("ring_"), key=num))]
tasks = [{"x": r1(p[0]), "y": r1(p[1])} for p in (pos(o) for o in pre("task_"))]
PK = {"prop_crate_": "pcrate", "prop_barrel_": "pbarrel", "prop_chest_": "pchest", "prop_tree_": "ptree", "prop_pine_": "ppine"}
props = []
for o in pre("prop_"):
    k = next((v for p, v in PK.items() if low(o).startswith(p)), None)
    if not k: problems.append("%s: unknown prop kind" % o.name); continue
    x, y, _, rz = pos(o); props.append({"k": k, "x": r1(x), "y": r1(y), "a": round(rz, 3)})
houses = []
for o in pre("bld_house_"):
    x, y, _, rz = pos(o); s = o.matrix_world.to_scale()
    houses.append({"x": r1(x), "y": r1(y), "w": r1(160 * abs(s.x)), "d": r1(130 * abs(s.y)), "ry": round(rz, 3)})
lights = []
for o in pre("light_"):
    x, y, h, _ = pos(o)
    L = o.data if o.type == 'LIGHT' else None
    col = '#%02x%02x%02x' % tuple(int(max(0, min(1, c)) * 255) for c in (L.color if L else (1, 0.75, 0.45)))
    lights.append({"x": r1(x), "y": r1(y), "h": round(h, 2), "col": col, "int": round(min(5, (L.energy if L else 100) / 50), 2), "dist": 14})
# env_<kind>_ : top-down mask on a 1-unit grid (phase 2 surfaces)
env = []
for o in pre("env_"):
    if o.type != 'MESH': continue
    kind = low(o)[4:].split('_')[0]; T = tree([o]); xs, ys = [], []
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c); x, y = to_sim(w.x, w.y); xs.append(x); ys.append(y)
    ec = 20; x0, y0 = math.floor(min(xs) / ec) * ec, math.floor(min(ys) / ec) * ec
    nx, ny = int(math.ceil((max(xs) - x0) / ec)) + 1, int(math.ceil((max(ys) - y0) / ec)) + 1
    bits = bytearray((nx * ny + 7) // 8)
    for j in range(ny):
        for i in range(nx):
            bx, by = to_b(x0 + i * ec, y0 + j * ec)
            if T.ray_cast(Vector((bx, by, 1000)), Vector((0, 0, -1)))[0]: k = j * nx + i; bits[k >> 3] |= 1 << (k & 7)
    env.append({"k": kind, "name": o.name, "c": ec, "x0": x0, "y0": y0, "nx": nx, "ny": ny, "m": base64.b64encode(bytes(bits)).decode('ascii')})

# ---------------------------------------------------------------- settings (custom properties on MAP_<id>)
def prop(k, d=None): return ROOT[k] if k in ROOT.keys() else d
fog = prop("fog")
if isinstance(fog, str):
    p = [s.strip() for s in fog.split(',')]; fog = [p[0], float(p[1]), float(p[2])] if len(p) == 3 else None
modes = prop("modes"); modes = [m.strip() for m in modes.split(',') if m.strip()] if isinstance(modes, str) and modes else None
data = {"fmt": 1, "id": MAP_ID, "name": prop("name", MAP_ID), "desc": prop("desc", ""), "sky": prop("sky", "night"), "fog": fog,
        "modes": modes, "random": int(prop("random", 1)), "weather": prop("weather", ""), "music": prop("music", ""),
        "W": W, "H": H, "c": C, "nx": NX, "ny": NY, "g": b64(g), "fl": floors, "obs": obs, "spawns": spawns, "espawn": espawn,
        "rings": rings, "tasks": tasks, "houses": houses, "lights": lights, "env": env,
        "fx": [t.strip() for t in str(prop("fx", "")).split(',') if t.strip()]}
if pre("prop_") or int(prop("props", 1)) == 0: data["props"] = props      # no prop_ empties = game places crates/barrels itself

out_dir = os.path.join(ROOT_DIR, "maps"); os.makedirs(out_dir, exist_ok=True)
jpath = os.path.join(out_dir, MAP_ID + ".json")
with open(jpath, "w", encoding="utf-8") as f: json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

# ---------------------------------------------------------------- visual .glb
vis = []
for name, (o, fl) in OBJ.items():
    if low(o).startswith(MARK) or o.type not in ('MESH', 'CURVE', 'FONT', 'SURFACE', 'META'): continue
    if o.hide_render: continue
    if "ns" in fl: o["ns"] = 1
    elif "ns" in o.keys(): del o["ns"]
    vis.append(o)
keep = set(vis)
for o in list(vis):                                 # parents (e.g. windmill hub) keep the hierarchy
    p = o.parent
    while p:
        if not low(p).startswith(MARK): keep.add(p)
        p = p.parent
view = bpy.context.view_layer
for o in view.objects: o.select_set(False)
hidden = []
for o in keep:
    try:
        if o.hide_get(): hidden.append(o); o.hide_set(False)
        o.select_set(True)
    except RuntimeError: problems.append("%s: not in the view layer, skipped" % o.name)
gpath = os.path.join(out_dir, MAP_ID + ".glb")
kw = dict(filepath=gpath, export_format='GLB', use_selection=True, export_apply=True, export_extras=True, export_lights=False,
          export_cameras=False, export_animations=True, export_draco_mesh_compression_enable=DRACO)
try: bpy.ops.export_scene.gltf(use_active_scene=True, **kw)
except TypeError: bpy.ops.export_scene.gltf(**kw)
for o in hidden: o.hide_set(True)

# ---------------------------------------------------------------- manifest
mpath = os.path.join(ROOT_DIR, "manifest.json")
man = json.load(open(mpath, encoding="utf-8")) if os.path.exists(mpath) else {"v": 1, "models": {}}
mp = man.setdefault("maps", {}); old = mp.get(MAP_ID, {})
mp[MAP_ID] = {"file": "maps/%s.glb" % MAP_ID, "data": "maps/%s.json" % MAP_ID, "v": int(old.get("v", 0)) + 1}
with open(mpath, "w", encoding="utf-8") as f: json.dump(man, f, ensure_ascii=False, indent=2); f.write("\n")

# ---------------------------------------------------------------- rule check (map_check.py next to this script)
chk = os.path.join(ROOT_DIR, "src", "maps", "map_check.py")
if os.path.exists(chk):
    ns = {"MAP_ID": MAP_ID}
    try:
        exec(open(chk, encoding="utf-8").read(), ns); problems += ns["result"]["problems"]
    except Exception as e: problems.append("map_check failed: %s" % e)

info.update({"W": W, "H": H, "grid": (NX, NY), "spawns": len(spawns), "props": len(props), "houses": len(houses), "lights": len(lights),
             "env": [e["k"] for e in env], "glb_objects": len(keep), "json_kb": round(os.path.getsize(jpath) / 1024, 1),
             "glb_kb": round(os.path.getsize(gpath) / 1024, 1), "manifest_v": mp[MAP_ID]["v"]})
result = {"problems": problems, "info": info}
print(result)
