# Water VFX shapes (user 2026-10-31: "อัปเกรดระบบ — ปั้นทรงน้ำใน Blender"). The game paints them with the fx material
# 'toonwater' (js/45: blue top → cyan base, thin white light lines, foam on top), so only the SHAPE matters here.
# Run:  "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup --python assets/src/water_meshes_build.py
# Out:  assets/vfx/water_ringwave.glb    — ring wall of water round the origin, 3 outward-curling crests (shield base)
#       assets/vfx/water_ringwave_low.glb — same, shrunk evenly to hug the ground
#       assets/vfx/water_crescent.glb  — water blade: thick middle, sharp tips, the outer edge curls up like a wave lip
#       assets/vfx/water_crown.glb     — splash crown: flared wall, spiky ragged top, droplets off the spike tips
#       assets/vfx/water_wave.glb      — curling wave sheet, tapering at both ends (Riptide etc.)
#       assets/vfx/water_slab.glb     — wide flat-topped wave wall, front curls under (Riptide)
#       assets/vfx/water_wake.glb     — flat tapering water tail, ragged edges (Riptide)
#       assets/vfx/water_curl.glb     — thin sheet curling over forward, one end taller (Riptide)
#       assets/vfx/water_curl_body.glb — solid water under the curl (hollow only under the lip)
#       assets/vfx/water_serpent.glb  — Tidecaller water serpent wrapped round the caster, head at the right shoulder
#       assets/vfx/water_jet.glb       — rising water column: flared foot, wobbly body, splashing crown on top
# Units: metres. Blender z = up (exported Y-up). ⚠ Blender +Y exports as glTF -Z = BACKWARD in fx space (+z = aim).
# Shapes below are modelled with their front at +Y, so fx layers that need the front forward use rot [0, 180, 0]
# (water_wake, water_curl, water_curl_body). Verified 2026-11-01 by measuring vertices in game (Riptide).
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

# ---------------- 5. ring wave: a wall of water round the origin (radius 1) with 3 crests that curl outward (shield base) ----------------
clear()
def crest(th):                                           # 3 crests, uneven, never fully flat between them
    k = (math.sin(th * 3 + .4 * math.sin(th * 2)) * .5 + .5) ** 1.6
    return .22 + .78 * k
def ringwave(sz):
    def f_(u, v):
        th = u * 2 * math.pi; k = crest(th)
        f, up = prof(v)                                  # same curling profile as the wave: forward = outward
        r = 1.0 + ((f + .9) * .28 * k + .03 * math.sin(th * 9 + v * 5)) * sz
        return Vector((r * math.cos(th), r * math.sin(th), up * .75 * k * sz))
    return f_
ob = finish(grid('water_ringwave', ringwave(1), 96, 24, close_u=True), thick=.05, subd=1)
export(ob, 'water_ringwave.glb')
# low version: same wave cross-section shrunk evenly (keeps the steep sides, so the toon shading stays blue, not foam white)
clear()
ob = finish(grid('water_ringwave_low', ringwave(.32), 96, 24, close_u=True), thick=.025, subd=1)
export(ob, 'water_ringwave_low.glb')

# ---------------- 6. slab wave (Riptide, ref designs/water_ref/riptide_ref.png): wide flat-topped wall of water, the front
# rounds over and curls down, the back slopes to the ground; square-ish ends. Width along X (±1), profile along Y like the wave.
clear()
SLAB = [(-1.6, 0), (-1.2, .55), (-.7, .9), (-.1, 1.0), (.35, .98), (.62, .85), (.72, .6), (.62, .38), (.45, .3)]   # (forward, up) back foot → top → front lip curling under
def sprof(t):
    x = t * (len(SLAB) - 1); i = min(int(x), len(SLAB) - 2); f = x - i
    a, b = SLAB[i], SLAB[i + 1]
    return a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f
def slab(u, v):
    xw = (u - .5) * 2
    end = max(0.0, 1 - abs(xw) ** 6) ** .5                # square-ish slab, rounded ends
    f, up = sprof(v)
    rag = .04 * math.sin(xw * 11 + v * 4) + .03 * math.sin(xw * 23)
    return Vector((xw, f * (.6 + .4 * end), (up + rag * up) * end))
ob = finish(grid('water_slab', slab, 64, 32), thick=.05, subd=1)
export(ob, 'water_slab.glb')

# ---------------- 7. wake (Riptide tail): flat water strip from the origin (y 0, narrow) to y 1 (full width ±1), ragged
# edges, a gentle crown in the middle and a few ripple bumps. uv.v runs along the length so 'water' flow lines run forward.
clear()
def wake(u, v):
    xw = (u - .5) * 2
    half = .18 + .82 * v ** .7                            # tapers toward the back
    rag = 1 + .12 * math.sin(v * 31 + (1 if xw > 0 else 0) * 2) + .07 * math.sin(v * 67)
    x = xw * half * rag
    z = (.12 * (1 - xw * xw) + .09 * max(0, math.sin(v * 38 - xw * 2.5)) ** 2) * (1 - xw * xw) * (.4 + .6 * v)   # not flat (user): rolling ripples, higher toward the wave
    return Vector((x, v, z))
ob = finish(grid('water_wake', wake, 24, 80), thick=0, subd=1)
export(ob, 'water_wake.glb')

# ---------------- 8. curl wave (Riptide, refs riptide_ref.png / riptide_ref2.png; user: "the FRONT of the wave is the curve
# side"): the outer skin of an ocean breaking wave — long back slope, crest, lip throwing FORWARD (+Y) and down over a hollow.
# Level crest, steep ends; ends run a little ahead of the middle (crescent) so the barrel shows at the wings from behind;
# leans forward. uv: u across (0..1), v back foot → lip tip (0..1). Width ±1, ~2 tall. In fx: rot [0, 180, 0] (see top).
clear()
CURL = [(-1.5, 0), (-1.15, .3), (-.8, .7), (-.5, 1.15), (-.25, 1.6), (-.05, 2.0), (.15, 2.3), (.45, 2.38), (.75, 2.25), (1.0, 1.98), (1.12, 1.62), (1.1, 1.28), (.98, 1.02), (.82, .9)]   # sharp crest, deep forward hook
LEAN, CRES = .12, .7
def cprof(t):
    x = t * (len(CURL) - 1); i = min(int(x), len(CURL) - 2); f = x - i
    a, b = CURL[i], CURL[i + 1]
    return a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f
def wshape(xw, f, up):                                     # shared by the skin and the body so they line up
    end = max(0.0, 1 - abs(xw) ** 6) ** .5                 # ends come down (a level crest + steep ends read as a box)
    hi = (1 - .3 * xw * xw) * (1 + .06 * math.sin(xw * 7 + 1))   # uneven crest line, lower ends
    up = max(0.0, up) * hi * end
    return Vector((xw, f * (.3 + .7 * end) + LEAN * up + CRES * xw * xw, up))
def curl(u, v):
    xw = (u - .5) * 2
    f, up = cprof(v)
    return wshape(xw, f + .03 * math.sin(xw * 9 + v * 5), up)
ob = finish(grid('water_curl', curl, 64, 40), thick=.03, subd=1)
export(ob, 'water_curl.glb')

# ---------------- 9. curl body: the solid water under the skin — a real wave is only hollow under the lip, so from behind
# you see a full hump. Closed loop around the cross-section (u): back → crest → under the lip root → concave front face →
# ground; across the width (v). Same wshape() as the skin. In fx: rot [0, 180, 0].
clear()
BODY = [(-1.5, 0), (-1.15, .3), (-.8, .7), (-.5, 1.15), (-.25, 1.6), (-.05, 2.0), (.15, 2.28), (.3, 2.12), (.32, 1.7), (.25, 1.25),
        (.2, .8), (.28, .4), (.45, .12), (.65, 0), (0, -.02), (-.9, -.02)]   # back → crest → concave front face (the barrel wall) → ground
def bloop(t):
    n = len(BODY); x = t * n; i = int(x) % n; f = x - int(x)
    a, b = BODY[i], BODY[(i + 1) % n]
    return a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f
def body(u, v):
    f, up = bloop(u)
    return wshape((v - .5) * 2, f, up)
ob = finish(grid('water_curl_body', body, 70, 40, close_u=True), thick=0, subd=1)
export(ob, 'water_curl_body.glb')

# ---------------- 10. water serpent (Tidecaller, user 2026-11-01 ref designs/water_ref/tidecaller_serpent_ref.png): small but
# long, all water. Tail starts at the hip, wraps once round the caster up to the right shoulder, neck rises, dragon-like head
# beside the head pointing FORWARD = Blender -Y (exports as fx +z, no rot needed). Swept-back spiky water fins on head + neck.
# Origin = caster's feet. uv: u around the tube, v tail → head.
clear()
import mathutils
def sweep(name, pts, rads, sides=14):
    """tube along pts with radius per point; parallel-transport frames; capped tail"""
    me = bpy.data.meshes.new(name); bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap')
    P = [Vector(p) for p in pts]; n = len(P)
    T = [(P[min(i + 1, n - 1)] - P[max(i - 1, 0)]).normalized() for i in range(n)]
    N = T[0].orthogonal().normalized(); rings = []
    for i in range(n):
        if i: 
            axis = T[i - 1].cross(T[i])
            if axis.length > 1e-6: N = (mathutils.Matrix.Rotation(T[i - 1].angle(T[i]), 3, axis.normalized()) @ N).normalized()
        B = T[i].cross(N)
        rings.append([bm.verts.new(P[i] + (N * math.cos(a) + B * math.sin(a)) * rads[i]) for a in [k / sides * 2 * math.pi for k in range(sides)]])
    for i in range(n - 1):
        for k in range(sides):
            q = [rings[i][k], rings[i][(k + 1) % sides], rings[i + 1][(k + 1) % sides], rings[i + 1][k]]
            f = bm.faces.new(q)
            for lp, (a, b) in zip(f.loops, [(k / sides, i / (n - 1)), ((k + 1) / sides, i / (n - 1)), ((k + 1) / sides, (i + 1) / (n - 1)), (k / sides, (i + 1) / (n - 1))]): lp[uvl].uv = (a, b)
    bm.faces.new(list(reversed(rings[0])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)   # outward (the fx shader draws front faces only)
    bm.normal_update(); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob); me.materials.append(mat())
    for p in me.polygons: p.use_smooth = True
    return ob
# body (round 3, user: "โค้งไหลลื่นตามเรา ไม่หักศอก ติดตัวเราได้ หัวออกมาหน่อย"): ONE smooth Catmull-Rom curve hugging the caster —
# left leg → round the back → up behind the right shoulder → arches over the shoulder → into the head (no kink at the neck).
# +Y = behind the caster, -Y = forward.
CP = [(-.4, .0, .2), (-.52, .3, .62), (-.3, .55, 1.0), (.12, .55, 1.3), (.45, .35, 1.62), (.55, .02, 1.9), (.5, -.3, 1.98), (.45, -.55, 1.9)]
def catmull(P, n):
    P = [Vector(P[0]) * 2 - Vector(P[1])] + [Vector(p) for p in P] + [Vector(P[-1]) * 2 - Vector(P[-2])]
    out = []
    for k in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[k - 1], P[k], P[k + 1], P[k + 2]
        for i in range(n):
            t = i / n
            out.append(.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(Vector(P[-2])); return out
pts = catmull(CP, 14); NP = len(pts)
rads = [.02 + .1 * min(1, (i / (NP - 1)) * 2.2) ** .7 + .012 * math.sin(i * .5) for i in range(NP)]
body = sweep('serpent_body', [tuple(p) for p in pts], rads)
neck_end = pts[-1]; neck_dir = (pts[-1] - pts[-4]).normalized()
# head (round 3, ref tidecaller_serpent_ref.png): long elegant dragon head continuing the neck, tilted slightly down; skull a
# bit wider than the neck, long snout tapering to a rounded nose; flattened; brow ridges; lower jaw; mane of long flowing
# water spikes sweeping BACK from the top of the head and down the neck
fwd = Vector((neck_dir.x * .3, -1, -.18)).normalized()
HR = [.12, .15, .16, .155, .14, .12, .1, .08, .06]   # round 4 (user: mouth/face too long) → shorter, rounder snout
HL_ = .44
hp = [neck_end - fwd * .06 + fwd * (HL_ * k / (len(HR) - 1)) for k in range(len(HR))]
head = sweep('serpent_head', [tuple(p) for p in hp], HR, sides=14)
bpy.context.view_layer.objects.active = head; head.select_set(True)
for v in head.data.vertices:                                       # flatten round the head's own axis (keep width, squash height)
    c = neck_end + fwd * max(0, min(HL_, (v.co - neck_end).dot(fwd)))
    d = v.co - c; v.co = c + Vector((d.x, d.y, d.z * .72))
jaw = sweep('serpent_jaw', [tuple(p + Vector((0, 0, -.075 - .012 * k))) for k, p in enumerate(hp[2:8])], [.075 - .008 * k for k in range(6)], sides=10)
side = fwd.cross(Vector((0, 0, 1))).normalized()
eyes = [hp[3] + side * s_ * .12 + Vector((0, 0, .06)) for s_ in (-1, 1)]
brows = [sweep('brow', [tuple(e + fwd * (-.06 + .1 * k / 4) + Vector((0, 0, .03 + .01 * math.sin(k)))) for k in range(5)], [.03, .035, .03, .022, .012], sides=8) for e in eyes]
fins = list(brows)   # the jaw is exported on its own (water_serpent_jaw) so it can open when the serpent shoots
def fin(base, d, length, w, bend=.35):
    pts_ = [Vector(base) + d * (t * length) + Vector((0, 0, -bend * (t * length) ** 2)) for t in [k / 7 for k in range(8)]]
    return sweep('fin', [tuple(p) for p in pts_], [w * (1 - k / 7) + .003 for k in range(8)], sides=6)
back = (-fwd + Vector((0, 0, .55))).normalized()
for k in range(9):                                                # mane: from the top/back of the skull, fanning back
    a = (k - 4) / 4
    base = hp[2 + k % 3] + Vector((0, 0, .08)) + side * a * .08
    d = (back + side * a * .55 + Vector((0, 0, .15 * (1 - abs(a))))).normalized()
    fins.append(fin(base, d, .42 + .28 * (1 - abs(a)), .05 - .012 * abs(a)))
for k in range(10):                                               # smaller spikes down the neck and back, also swept back
    i = NP - 6 - k * 6
    if i < 10: break
    p = pts[i]; t_ = (pts[i + 1] - pts[i - 1]).normalized()
    fins.append(fin(p + Vector((0, 0, rads[i] * .85)), (-t_ + Vector((0, 0, .5))).normalized(), .16 + .04 * (k % 3), .022, .2))
print('eyes', [tuple(round(c, 3) for c in e) for e in eyes])
hp = [tuple(p) for p in hp]
bpy.ops.object.select_all(action='DESELECT')
for o in [body, head] + fins: o.select_set(True)
bpy.context.view_layer.objects.active = body; bpy.ops.object.join()
ob = finish(bpy.context.view_layer.objects.active, thick=0, subd=1)
ob.name = 'water_serpent'
export(ob, 'water_serpent.glb')
# jaw alone, origin at the hinge (back of the jaw) so an fx layer can swing it open with rot x (user 2026-11-01: 'อ้าปาก')
hinge = Vector(jaw.data.vertices[0].co) * 0
for v in jaw.data.vertices: hinge = hinge if hinge.length else Vector(hp[2]) + Vector((0, 0, -.075))
for v in jaw.data.vertices: v.co -= hinge
bpy.ops.object.select_all(action='DESELECT'); jaw.select_set(True); bpy.context.view_layer.objects.active = jaw
jaw = finish(jaw, thick=0, subd=1); export(jaw, 'water_serpent_jaw.glb')
print('jaw hinge', tuple(round(c, 3) for c in hinge))
print('head tip', hp[-1])
