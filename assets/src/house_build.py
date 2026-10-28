# House + debris generator for Fantas Stick (run inside Blender: exec(open(r"...house_build.py").read()))
# Builds scene "house_build" with collections HOUSE (12 piece objects) / DEBRIS_STONE / DEBRIS_WOOD and exports
#   assets/buildings/house.glb  (bld_house)     assets/buildings/debris_stone.glb / debris_wood.glb
# Rules: ASSETS.md §3b — front (door) faces -Y, origin = house centre on the floor, base 8 x 6.5, walls 4.2 high,
# roof halves split at x = 0, every _broken piece sits where its intact piece was.
import bpy, bmesh, math, random, os
from mathutils import Matrix, Vector, Euler

ROOT = r"C:\AI Project\Fantas-Stick\assets"
EXPORT = True
DRACO = True     # game ships the Draco decoder; cuts the house file ~300 KB -> tens of KB

# ---- palette (4x4 swatches, 16 px each) ----
PAL = ['#d9c9a8', '#bfae8c', '#4a3020', '#6a3a3e',
       '#eef3fb', '#6a4226', '#ffc36b', '#8e92a0',
       '#5a4a3a', '#1a1412', '#ff6a20', '#6a6e7a',
       '#a08a68', '#3a3f4a', '#c9d6e6', '#ffffff']
PLASTER, PLASTER2, BEAM, ROOF, SNOW, DOOR, GLASS, STONE, LATH, DARK, EMBER, STONE2, WOOD2 = range(13)
EMIT = {GLASS: '#ffb04a', EMBER: '#ff5a10'}

def hexrgb(h):
    h = h.lstrip('#')
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]

def swuv(i):
    return ((i % 4 + 0.5) / 4, (i // 4 + 0.5) / 4)

def make_img(name, fill):
    if name in bpy.data.images:
        bpy.data.images.remove(bpy.data.images[name])
    im = bpy.data.images.new(name, 64, 64, alpha=False)
    px = [0.0] * (64 * 64 * 4)
    for y in range(64):
        for x in range(64):
            c = fill(x // 16 + (y // 16) * 4)
            k = (y * 64 + x) * 4
            px[k:k + 4] = [c[0], c[1], c[2], 1.0]
    im.pixels.foreach_set(px)
    im.file_format = 'PNG'
    im.pack()
    return im

def make_mat():
    name = 'house_mat'
    if name in bpy.data.materials:
        bpy.data.materials.remove(bpy.data.materials[name])
    base = make_img('house_pal', lambda i: hexrgb(PAL[i]))
    emit = make_img('house_emit', lambda i: hexrgb(EMIT[i]) if i in EMIT else [0, 0, 0])
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    t1 = nt.nodes.new('ShaderNodeTexImage'); t1.image = base; t1.interpolation = 'Closest'
    t2 = nt.nodes.new('ShaderNodeTexImage'); t2.image = emit; t2.interpolation = 'Closest'
    nt.links.new(t1.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(t2.outputs['Color'], bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = 2.5
    bsdf.inputs['Roughness'].default_value = 0.88
    return m

MAT = make_mat()

class Piece:
    def __init__(s, name):
        s.name = name
        s.bm = bmesh.new()
        s.uv = s.bm.loops.layers.uv.new('UVMap')

    def paint(s, faces, sw):
        u = swuv(sw)
        for f in faces:
            f.smooth = False
            for l in f.loops:
                l[s.uv].uv = u

    def box(s, c, size, sw, rot=(0, 0, 0)):
        M = Matrix.Translation(Vector(c)) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((size[0], size[1], size[2], 1))
        r = bmesh.ops.create_cube(s.bm, size=1.0, matrix=M)
        s.paint({f for v in r['verts'] for f in v.link_faces}, sw)

    def prism(s, pts, y0, y1, sw):
        a = [s.bm.verts.new((x, y0, z)) for x, z in pts]
        b = [s.bm.verts.new((x, y1, z)) for x, z in pts]
        fs = [s.bm.faces.new(a), s.bm.faces.new(b[::-1])]
        n = len(pts)
        for i in range(n):
            j = (i + 1) % n
            fs.append(s.bm.faces.new((a[i], a[j], b[j], b[i])))
        s.paint(fs, sw)

    def rock(s, c, r, sc, sw, rng):
        M = Matrix.Translation(Vector(c)) @ Matrix.Diagonal((sc[0], sc[1], sc[2], 1))
        res = bmesh.ops.create_icosphere(s.bm, subdivisions=1, radius=r, matrix=M)
        for v in res['verts']:
            v.co += Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1))) * r * 0.22
        s.paint({f for v in res['verts'] for f in v.link_faces}, sw)

    def finish(s, coll):
        if s.name in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[s.name], do_unlink=True)
        if s.name in bpy.data.meshes:
            bpy.data.meshes.remove(bpy.data.meshes[s.name])
        bmesh.ops.recalc_face_normals(s.bm, faces=s.bm.faces[:])
        me = bpy.data.meshes.new(s.name)
        s.bm.to_mesh(me)
        s.bm.free()
        me.materials.append(MAT)
        ob = bpy.data.objects.new(s.name, me)
        coll.objects.link(ob)
        return ob

# ---- wall frames: u = along the wall, v = outward from the wall centre line, z = up ----
W2, D2, WH, T = 4.0, 3.25, 4.2, 0.7
DOOR_HW, DOOR_H = 1.1, 2.7   # doorway on wall_front (half width, height) — open from match start; must match BLD_DOOR in js/12-buildings.js (player is 1.8 m wide)
WALLS = {
    'front': dict(ax='X', c=-D2, o=-1, L=W2 + 0.35),
    'back':  dict(ax='X', c=D2,  o=1,  L=W2 + 0.35),
    'left':  dict(ax='Y', c=-W2, o=-1, L=D2 - 0.35),
    'right': dict(ax='Y', c=W2,  o=1,  L=D2 - 0.35),
}

class Frame:
    def __init__(s, p, kind):
        s.p, s.k = p, WALLS[kind]
        s.L = s.k['L']

    def P(s, u, v, z):
        k = s.k
        return (u, k['c'] + k['o'] * v, z) if k['ax'] == 'X' else (k['c'] + k['o'] * v, u, z)

    def S(s, su, sv, sz):
        return (su, sv, sz) if s.k['ax'] == 'X' else (sv, su, sz)

    def R(s, a):  # a > 0 = rises toward +u, in the wall plane
        return (0, -a, 0) if s.k['ax'] == 'X' else (a, 0, 0)

    def B(s, u, v, z, su, sv, sz, sw, a=0.0):
        # front wall with s.cut: boxes on the wall that cross the doorway are split around it (left / right / above),
        # boxes fully inside it (old door, trims) are dropped. Low steps outside (top < 0.2) stay.
        if getattr(s, 'cut', False) and a == 0.0:
            u0, u1, z0, z1 = u - su / 2, u + su / 2, z - sz / 2, z + sz / 2
            if u0 < DOOR_HW and u1 > -DOOR_HW and z0 < DOOR_H and z1 > 0.2 and v - sv / 2 < T / 2 + 0.5:
                for a0, a1, b0, b1 in ((u0, -DOOR_HW, z0, z1), (DOOR_HW, u1, z0, z1), (max(u0, -DOOR_HW), min(u1, DOOR_HW), DOOR_H, z1)):
                    if a1 - a0 > 0.06 and b1 - b0 > 0.06:
                        s.p.box(s.P((a0 + a1) / 2, v, (b0 + b1) / 2), s.S(a1 - a0, sv, b1 - b0), sw)
                return
        s.p.box(s.P(u, v, z), s.S(su, sv, sz), sw, s.R(a))

    def doorway(s, sw):
        # open double door: leaves swung inward against the reveal + lintel beam (call after the wall is built)
        s.cut = False
        for e in (-1, 1):
            s.B(e * (DOOR_HW - 0.05), -(T / 2 + 0.55), DOOR_H / 2, 0.08, 1.05, DOOR_H - 0.1, sw)
        s.B(0, 0.42, DOOR_H + 0.12, 2 * DOOR_HW + 0.5, 0.16, 0.24, BEAM)

    def brace(s, u0, z0, u1, z1, v=0.41):
        L = math.hypot(u1 - u0, z1 - z0)
        s.B((u0 + u1) / 2, v, (z0 + z1) / 2, L, 0.14, 0.16, BEAM, math.atan2(z1 - z0, u1 - u0))

    def window(s, u, zc, w=1.1, h=1.2):
        s.B(u, 0, zc, w, 0.76, h, GLASS)
        s.B(u, 0.45, zc + h / 2 + 0.07, w + 0.3, 0.14, 0.14, BEAM)
        s.B(u, 0.5, zc - h / 2 - 0.07, w + 0.4, 0.3, 0.12, BEAM)
        s.B(u, 0.52, zc - h / 2 + 0.02, w + 0.32, 0.26, 0.07, SNOW)
        for e in (-1, 1):
            s.B(u + e * (w / 2 + 0.07), 0.45, zc, 0.14, 0.14, h, BEAM)
        s.B(u, 0.43, zc, 0.07, 0.08, h, BEAM)
        s.B(u, 0.43, zc, w, 0.08, 0.07, BEAM)

def wall_intact(kind):
    p = Piece('wall_' + kind)
    f = Frame(p, kind)
    L = f.L
    f.cut = kind == 'front'
    f.B(0, 0.04, 0.3, 2 * L, 0.84, 0.6, STONE)
    f.B(0, 0, 2.4, 2 * L, T, 3.6, PLASTER)
    f.B(0, 0.41, 4.08, 2 * L, 0.14, 0.3, BEAM)
    f.B(0, 0.41, 0.68, 2 * L, 0.14, 0.18, BEAM)
    if kind == 'front':
        for u in (-0.8, 0.8, -1.75, 1.75, -3.5, 3.5):
            f.B(u, 0.41, 2.35, 0.2, 0.14, 3.3, BEAM)
        for e in (-1, 1):
            f.B(e * (L + 0.8) / 2, 0.41, 1.85, L - 0.8, 0.14, 0.14, BEAM)
            f.window(e * 2.62, 2.65)
            f.brace(e * 1.75, 0.78, e * 3.5, 1.78)
        f.B(0, 0.38, 1.25, 1.2, 0.1, 2.5, DOOR)
        for u in (-0.3, 0.3):
            f.B(u, 0.44, 1.25, 0.06, 0.04, 2.4, BEAM)
        f.B(0.38, 0.47, 1.25, 0.1, 0.1, 0.1, STONE2)
        f.B(0, 0.45, 2.62, 1.8, 0.16, 0.22, BEAM)
        f.B(0, 0.75, 0.08, 1.7, 0.7, 0.16, STONE)
        f.B(1.2, 0.55, 2.35, 0.26, 0.26, 0.34, GLASS)
        f.B(1.2, 0.55, 2.56, 0.34, 0.34, 0.08, STONE2)
        f.B(1.2, 0.47, 2.2, 0.06, 0.2, 0.06, BEAM)
    elif kind == 'back':
        for u in (-1.2, 1.2, -3.4, 3.4):
            f.B(u, 0.41, 2.35, 0.2, 0.14, 3.3, BEAM)
        f.B(0, 0.41, 1.85, 2 * L, 0.14, 0.14, BEAM)
        for e in (-1, 1):
            f.window(e * 2.3, 2.7)
        f.brace(-1.2, 0.78, 1.2, 1.78)
        # fireplace on the inner side (seen when another wall is gone)
        f.B(0, -0.75, 0.8, 1.9, 0.8, 1.6, STONE)
        f.B(0, -1.13, 0.55, 1.0, 0.06, 0.8, DARK)
        f.B(0, -1.0, 0.22, 0.8, 0.3, 0.16, EMBER)
        f.B(0, -0.85, 1.67, 2.2, 1.05, 0.14, BEAM)
        f.B(0, -0.58, 2.95, 1.0, 0.45, 2.5, STONE)
    else:
        for e in (-1, 1):
            f.B(e * (D2), 0, 2.15, 0.55, 0.55, 4.3, BEAM)
            f.B(e * 1.0, 0.41, 2.35, 0.2, 0.14, 3.3, BEAM)
        f.window(0, 2.65, 1.0, 1.1)
        f.brace(1.0, 0.78, 2.9, 3.95)
        f.brace(-2.9, 3.95, -1.0, 0.78)
    if kind == 'front':
        f.doorway(DOOR)
    return p

def wall_broken(kind, seed):
    rng = random.Random(seed)
    p = Piece('wall_' + kind + '_broken')
    f = Frame(p, kind)
    L, n = f.L, 7
    sl = 2 * L / n
    for k in range(n):
        u = -L + (k + 0.5) * sl
        edge = k in (0, n - 1)
        h = rng.uniform(1.3, 2.6) if edge else rng.uniform(0.15, 1.6)
        fh = 0.6 if rng.random() > 0.2 else rng.uniform(0.25, 0.5)
        f.B(u, 0.04, fh / 2, sl * 0.98, 0.84, fh, STONE)
        if fh >= 0.6:
            f.B(u, 0, 0.6 + h / 2, sl * 0.97, T, h, PLASTER)
            f.B(u, 0, 0.6 + h + 0.03, sl * 0.9, T + 0.04, 0.1, LATH, rng.uniform(-0.18, 0.18))
    for u in (rng.uniform(-L, -L / 2), rng.uniform(L / 3, L)):
        f.B(u, 0.41, 0.68, rng.uniform(0.8, 1.6), 0.14, 0.18, BEAM)
    if kind in ('left', 'right'):
        for e in (-1, 1):
            h = rng.uniform(1.4, 2.8)
            f.B(e * D2, 0, h / 2, 0.55, 0.55, h, BEAM, rng.uniform(-0.12, 0.12))
    if kind == 'front':
        p.box(f.P(rng.uniform(-0.4, 0.4), 2.1, 0.07), f.S(1.2, 2.5, 0.1), DOOR, (0, 0, rng.uniform(-0.4, 0.4)))
        f.B(0, 0.75, 0.08, 1.7, 0.7, 0.16, STONE)
    if kind == 'back':
        f.B(0, -0.75, 0.6, 1.9, 0.8, 1.2, STONE)
        f.B(0, -1.13, 0.45, 1.0, 0.06, 0.6, DARK)
        f.B(0, -1.0, 0.22, 0.8, 0.3, 0.16, EMBER)
    for k in range(13):
        u, v = rng.uniform(-L, L), rng.uniform(-1.3, 2.4)
        sw = rng.choice((PLASTER, PLASTER, PLASTER2, STONE, BEAM, LATH))
        sz = (rng.uniform(0.3, 0.85), rng.uniform(0.25, 0.7), rng.uniform(0.15, 0.4))
        p.box(f.P(u, v, sz[2] / 2), sz, sw, (rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), rng.uniform(0, 3.14)))
    for k in range(2):
        u = rng.uniform(-L * 0.7, L * 0.7)
        p.box(f.P(u, rng.uniform(0.9, 2.0), 0.1), (rng.uniform(1.8, 2.8), 0.16, 0.16), BEAM, (0, 0, rng.uniform(0, 3.14)))
    for k in range(4):
        p.box(f.P(rng.uniform(-L, L), rng.uniform(0.6, 1.8), 0.03), (0.22, 0.18, 0.04), GLASS, (0, 0, rng.uniform(0, 3)))
    return p

# ---- roof: gable, ridge along Y at x = 0, eaves at x = +-4.7 ----
RID, EAVE, EX = 7.6, 3.95, 4.7
ANG = math.atan2(RID - EAVE, EX)
SLOPE = math.hypot(RID - EAVE, EX)

def roof_intact(s):
    p = Piece('roof_' + ('left' if s < 0 else 'right'))
    n = Vector((s * math.sin(ANG), 0, math.cos(ANG)))
    d = Vector((s * math.cos(ANG), 0, -math.sin(ANG)))
    mid = Vector((s * EX / 2, 0, (RID + EAVE) / 2))
    rot = (0, s * ANG, 0)
    p.box(mid + n * 0.13, (SLOPE + 0.1, 7.9, 0.26), ROOF, rot)
    p.box(mid + n * 0.33 - d * 0.35, (SLOPE - 0.6, 7.7, 0.16), SNOW, rot)
    p.box((s * 0.14, 0, RID + 0.18), (0.32, 7.95, 0.24), SNOW)
    p.box((s * (EX - 0.06), 0, EAVE - 0.04), (0.14, 7.9, 0.22), BEAM)
    for yc in (-D2, D2):
        o = -1 if yc < 0 else 1
        p.prism([(0, WH), (s * W2, WH), (0, RID - 0.2)], yc - 0.35, yc + 0.35, PLASTER)
        p.box((s * 0.1, yc + o * 0.41, 5.8), (0.2, 0.14, 3.0), BEAM)
        p.box((s * 1.25, yc + o * 0.41, 5.15), (2.5, 0.14, 0.16), BEAM)
        p.box((s * W2 / 2, yc + o * 0.41, WH + 0.08), (W2, 0.14, 0.2), BEAM)
        if yc < 0:
            p.box((s * 1.15, yc, 6.0), (0.55, 0.76, 0.6), GLASS)
            p.box((s * 1.15, yc + o * 0.44, 6.36), (0.75, 0.12, 0.12), BEAM)
            p.box((s * 1.15, yc + o * 0.44, 5.64), (0.75, 0.12, 0.12), BEAM)
    if s > 0:
        p.box((2.2, 1.3, 6.9), (0.95, 0.95, 3.8), STONE)
        p.box((2.2, 1.3, 8.88), (1.15, 1.15, 0.24), STONE2)
        p.box((2.2, 1.3, 9.06), (1.0, 1.0, 0.12), SNOW)
        p.box((2.2, 1.3, 8.98), (0.55, 0.55, 0.06), DARK)
    return p

def roof_broken(s, seed):
    rng = random.Random(seed)
    p = Piece('roof_' + ('left' if s < 0 else 'right') + '_broken')
    for k in range(11):
        sw = ROOF if k % 3 else SNOW
        p.box((s * rng.uniform(0.3, 3.5), rng.uniform(-2.6, 2.6), rng.uniform(0.12, 0.45)),
              (rng.uniform(0.8, 1.5), rng.uniform(0.6, 1.2), 0.18 if sw == ROOF else 0.24), sw,
              (rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), rng.uniform(0, 3.14)))
    for k in range(2):
        y = rng.uniform(-2.2, 2.2)
        L = math.hypot(2.9, 4.0)
        p.box((s * 2.45, y, 2.0), (0.22, 0.22, L), BEAM, (0, s * 0.627, rng.uniform(-0.2, 0.2)))
    p.box((s * 0.7, 0, 1.0), (0.26, 6.8, 0.26), BEAM, (0.3, 0, 0))
    for k in range(5):
        p.box((s * rng.uniform(0.5, 3.3), rng.uniform(-2.5, 2.5), 0.12), (rng.uniform(0.4, 0.9), 0.14, 0.12), LATH, (0, 0, rng.uniform(0, 3.14)))
    if s > 0:
        for k in range(5):
            p.box((2.2 + rng.uniform(-0.8, 0.8), 1.3 + rng.uniform(-0.8, 0.8), rng.uniform(0.2, 0.4)), (0.5, 0.42, 0.36), STONE if k % 2 else STONE2,
                  (rng.uniform(-0.4, 0.4), rng.uniform(-0.4, 0.4), rng.uniform(0, 3)))
    return p

def debris_stone():
    rng = random.Random(7)
    out = []
    for i, sw in enumerate((PLASTER, STONE, PLASTER2, STONE2, PLASTER)):
        p = Piece('chunk_%d' % (i + 1))
        p.rock((0, 0, 0), rng.uniform(0.28, 0.42), (1, rng.uniform(0.6, 0.9), rng.uniform(0.45, 0.7)), sw, rng)
        out.append(p)
    return out

def debris_wood():
    rng = random.Random(11)
    out = []
    for i in range(3):
        p = Piece('plank_%d' % (i + 1))
        p.box((0, 0, 0), (0.18, rng.uniform(0.7, 1.1), 0.1), BEAM if i % 2 == 0 else WOOD2)
        p.box((0, 0.48, 0.0), (0.18, 0.2, 0.1), LATH, (0.5, 0, 0.4))
        out.append(p)
    for i in range(2):
        p = Piece('tile_%d' % (i + 1))
        p.box((0, 0, 0), (0.62, 0.46, 0.1), ROOF)
        p.box((0, 0, 0.07), (0.5, 0.36, 0.05), SNOW)
        out.append(p)
    p = Piece('snow_1')
    p.rock((0, 0, 0), 0.3, (1, 0.8, 0.55), SNOW, rng)
    out.append(p)
    return out

# ---- build ----
sc = bpy.data.scenes.get('house_build') or bpy.data.scenes.new('house_build')
for c in list(sc.collection.children):
    for o in list(c.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.collections.remove(c)
cols = {}
for n in ('HOUSE', 'DEBRIS_STONE', 'DEBRIS_WOOD'):
    if n in bpy.data.collections:
        bpy.data.collections.remove(bpy.data.collections[n])
    cols[n] = bpy.data.collections.new(n)
    sc.collection.children.link(cols[n])

objs = {'HOUSE': [], 'DEBRIS_STONE': [], 'DEBRIS_WOOD': []}
for i, k in enumerate(('front', 'back', 'left', 'right')):
    objs['HOUSE'].append(wall_intact(k).finish(cols['HOUSE']))
    objs['HOUSE'].append(wall_broken(k, 100 + i).finish(cols['HOUSE']))
for i, s in enumerate((-1, 1)):
    objs['HOUSE'].append(roof_intact(s).finish(cols['HOUSE']))
    objs['HOUSE'].append(roof_broken(s, 200 + i).finish(cols['HOUSE']))
for p in debris_stone():
    objs['DEBRIS_STONE'].append(p.finish(cols['DEBRIS_STONE']))
for p in debris_wood():
    objs['DEBRIS_WOOD'].append(p.finish(cols['DEBRIS_WOOD']))
# lay debris out in a row so they are easy to look at in Blender (the game only reads each mesh's own shape)
for i, o in enumerate(objs['DEBRIS_STONE']):
    o.location = (8 + i * 1.2, -6, 0.5)
for i, o in enumerate(objs['DEBRIS_WOOD']):
    o.location = (8 + i * 1.2, -8, 0.5)
# broken pieces sit beside the house while editing (export puts every object back at the origin)
for o in objs['HOUSE']:
    if o.name.endswith('_broken'):
        o.location = (12, 0, 0)

def tris(obs):
    return sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in obs)

def export(coll, path):
    # export = only the objects of one collection (collection=..., selection-based export also picked up other scenes' objects), every object back at the origin
    obs = list(bpy.data.collections[coll].objects)
    saved = {o.name: o.location.copy() for o in obs}
    for o in obs:
        o.location = (0, 0, 0)
    bpy.context.window.scene = sc
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', collection=coll, export_apply=True,
                              export_yup=True, export_animations=False, export_extras=False,
                              export_draco_mesh_compression_enable=DRACO, export_draco_mesh_compression_level=6)
    for o in obs:
        o.location = saved[o.name]

result = {k: {'objects': len(v), 'tris': tris(v)} for k, v in objs.items()}
if EXPORT:
    export('HOUSE', os.path.join(ROOT, 'buildings', 'house.glb'))
    export('DEBRIS_STONE', os.path.join(ROOT, 'buildings', 'debris_stone.glb'))
    export('DEBRIS_WOOD', os.path.join(ROOT, 'buildings', 'debris_wood.glb'))
    for n in ('house', 'debris_stone', 'debris_wood'):
        f = os.path.join(ROOT, 'buildings', n + '.glb')
        result[n + '_kb'] = round(os.path.getsize(f) / 1024, 1)
