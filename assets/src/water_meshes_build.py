# Water VFX shapes (user 2026-10-31: "อัปเกรดระบบ — ปั้นทรงน้ำใน Blender"). The game paints them with the fx material
# 'toonwater' (js/45: blue top → cyan base, thin white light lines, foam on top), so only the SHAPE matters here.
# Run:  "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup --python assets/src/water_meshes_build.py
# Out:  assets/vfx/water_crescent.glb  — water blade: thick middle, sharp tips, the outer edge curls up like a wave lip
#       assets/vfx/water_crown.glb     — splash crown: flared wall, spiky ragged top, droplets off the spike tips
#       assets/vfx/water_wave.glb      — curling wave sheet, tapering at both ends (Riptide etc.)
#       assets/vfx/water_jet.glb       — rising water column: flared foot, wobbly body, splashing crown on top
# Units: metres. Blender z = up (exported Y-up). +Y in Blender = forward in the game (+z in fx space) after export.
# UV: v = 0 at the base / start → 1 at the top / tip.
import bpy, bmesh, math, os, random
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'assets', 'vfx')

def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def mat():
    m = bpy.data.materials.get('water') or bpy.data.materials.new('water')
    m.diffuse_color = (0.3, 0.7, 1, 1)
    return m

def grid(name, f, nu, nv, close_u=False):
    """surface from f(u,v)->Vector, u in [0,1] (closed if close_u), v in [0,1]; uv = (u, v)"""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    cu = nu if close_u else nu + 1
    verts = [[bm.verts.new(f(i / nu, j / nv)) for j in range(nv + 1)] for i in range(cu)]
    uvl = bm.loops.layers.uv.new('UVMap')
    for i in range(nu):
        i2 = (i + 1) % cu if close_u else i + 1
        for j in range(nv):
            q = [verts[i][j], verts[i2][j], verts[i2][j + 1], verts[i][j + 1]]
            try:
                fc = bm.faces.new(q)
            except ValueError:
                continue
            for lp, (a, b) in zip(fc.loops, [(i / nu, j / nv), ((i + 1) / nu, j / nv), ((i + 1) / nu, (j + 1) / nv), (i / nu, (j + 1) / nv)]):
                lp[uvl].uv = (a, b)
    bm.normal_update(); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    me.materials.append(mat())
    for p in me.polygons: p.use_smooth = True
    return ob

def finish(ob, thick=0.0, subd=1):
    if thick:
        m = ob.modifiers.new('solid', 'SOLIDIFY'); m.thickness = thick; m.offset = 0; m.use_even_offset = True
    if subd:
        s = ob.modifiers.new('sub', 'SUBSURF'); s.levels = subd; s.render_levels = subd
    return ob

def export(ob, file):
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    path = os.path.join(OUT, file); os.makedirs(OUT, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_materials='EXPORT', export_animations=False)
    print('wrote', path, os.path.getsize(path))

smooth = lambda t: t * t * (3 - 2 * t)

# ---------------- 1. crescent: arc radius 1 around the origin in the ground plane, middle at +Y (forward) ----------------
clear()
def cres(u, v):
    a = (u - .5) * math.radians(150)                      # arc ±75°
    taper = math.sin(math.pi * u) ** .8                  # 0 at the tips → 1 mid
    w = .55 * taper                                      # blade width (radial)
    s = (v - .5) * 2                                     # -1 inner edge … +1 outer edge
    r = 1.0 + s * w * .5
    lip = max(0, s) ** 2 * .28 * taper                    # outer edge curls up
    sag = (1 - s * s) * .06 * taper                       # slight belly
    return Vector((r * math.sin(a), r * math.cos(a), lip + sag))
ob = finish(grid('water_crescent', cres, 64, 12), thick=.09, subd=1)
export(ob, 'water_crescent.glb')

# ---------------- 2. splash crown ----------------
clear()
rnd = random.Random(7)
SP = [rnd.uniform(.0, .35) for _ in range(11)]
def top(th):                                             # ragged top: 11 spikes, uneven
    k = th / (2 * math.pi) * 11; i = int(k) % 11; f = k - int(k)
    peak = (1 - abs(f - .5) * 2) ** 3
    return .7 + SP[i] * .6 + peak * (.35 + SP[i])
def crown(u, v):
    th = u * 2 * math.pi
    h = v * top(th)
    r = .45 + .5 * v ** 1.6 + .05 * math.sin(th * 3 + v * 4)
    return Vector((r * math.cos(th), r * math.sin(th), h))
ob = finish(grid('water_crown', crown, 88, 14, close_u=True), thick=.05, subd=1)
# droplets flung off the spike tips (part of the same mesh so one fx layer carries them)
bm = bmesh.new(); bm.from_mesh(ob.data)
for i in range(11):
    th = (i + .5) / 11 * 2 * math.pi; h = top(th); r = .95
    for k in range(1 + (i % 2)):
        c = Vector((r * 1.15 * math.cos(th), r * 1.15 * math.sin(th), h + .18 + k * .22))
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=.045 + .02 * rnd.random(), matrix=__import__('mathutils').Matrix.Translation(c))
bm.to_mesh(ob.data); bm.free()
for p in ob.data.polygons: p.use_smooth = True
export(ob, 'water_crown.glb')

# ---------------- 3. curling wave (width along X, travels toward +Y) ----------------
clear()
PROF = [(-.9, 0), (-.55, .45), (-.15, .95), (.2, 1.35), (.55, 1.55), (.82, 1.45), (.92, 1.18), (.8, .95)]   # (forward, up), base → curl tip
def prof(t):
    x = t * (len(PROF) - 1); i = min(int(x), len(PROF) - 2); f = x - i
    a, b = PROF[i], PROF[i + 1]
    return a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f
def wave(u, v):
    xw = (u - .5) * 2                                    # -1 … +1 across the width
    bell = max(0.0, 1 - xw * xw) ** .6                   # ends taper down
    f, up = prof(v)
    wob = .06 * math.sin(xw * 5 + v * 3)
    return Vector((xw * 2.5, f + wob, up * (.25 + .75 * bell)))
ob = finish(grid('water_wave', wave, 48, 28), thick=.07, subd=1)
export(ob, 'water_wave.glb')

# ---------------- 4. jet / column ----------------
clear()
def jet(u, v):
    th = u * 2 * math.pi
    foot = max(0, .25 - v) / .25                          # flared foot
    r = .22 + .5 * foot ** 2 + .04 * math.sin(v * 14 + th * 2) + (.25 * smooth(max(0, v - .85) / .15))   # crown flare at the top
    h = v * 2.4 + (.15 * math.sin(th * 7) * max(0, v - .85) / .15)
    return Vector((r * math.cos(th), r * math.sin(th), h))
ob = finish(grid('water_jet', jet, 48, 30, close_u=True), thick=.04, subd=1)
export(ob, 'water_jet.glb')
