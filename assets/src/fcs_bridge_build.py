# fcs_bridge_build.py - Castle Strike L-bridge outer stone shell, pre-broken into chunks ("eggshell", user 2026-11-19).
# Input : assets/src/fcs_bridge_layout.json  (tools/fcs-bridge-export.js; seeds = js/12-fcs-bridge.js bskBuild, same order)
# Output: assets/buildings/fcs_bridge.glb  - one object per chunk named c<index> (index = BSKN.C index in the game)
# Run   : D:/Blender/blender.exe -b --python assets/src/fcs_bridge_build.py
# Side shell: face outline extruded inward by `shell` m, cut into Voronoi cells around the seeds. Cut planes are tilted a little
# out of the face plane (same plane for both neighbours) so the broken edges are beveled like real spalled stone.
# Rim: outer 1 m strip of the deck top (rimH tall), cut at an angle between neighbours.
# Coordinates: game world (X, up, Z) -> Blender (X, -Z, up); the glTF exporter turns it back into Y-up.
import bpy, bmesh, json, os, math, random
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
L = json.load(open(os.path.join(HERE, 'fcs_bridge_layout.json')))
OUT = os.path.join(os.path.dirname(HERE), 'buildings', 'fcs_bridge.glb')
DH, SH, RW, RH = L['DH'], L['shell'], L['rimW'], L['rimH']
CROP, NEAR = 2.3, 4.6


def w2b(x, y, z):
    return Vector((x, -z, y))


def face_basis(f):
    """return (point(along, up, depth_in) -> blender Vector, along dir, outward normal) for a face"""
    c, n = f['c'], f['n']
    if f['ax'] == 'y':   # plane world X = c, along = world Z
        P = lambda a, u, d=0.0: w2b(c - n * d, u, a)
        A, N = w2b(0, 0, 1), w2b(n, 0, 0)
    else:                # plane world Z = c, along = world X
        P = lambda a, u, d=0.0: w2b(a, u, c - n * d)
        A, N = w2b(1, 0, 0), w2b(0, 0, n)
    return P, A, N


def slab(f, poly, depth):
    """closed solid: outline polygon on the face plane extruded `depth` m inward"""
    P, A, N = face_basis(f)
    bm = bmesh.new()
    pts = []
    for a, u in poly:   # drop repeated points (spans share end points)
        if not pts or abs(pts[-1][0] - a) > 1e-4 or abs(pts[-1][1] - u) > 1e-4: pts.append((a, u))
    if abs(pts[0][0] - pts[-1][0]) < 1e-4 and abs(pts[0][1] - pts[-1][1]) < 1e-4: pts.pop()
    vs = [bm.verts.new(P(a, u)) for a, u in pts]
    try:
        fc = bm.faces.new(vs)
    except ValueError:
        bm.free(); return None
    r = bmesh.ops.extrude_face_region(bm, geom=[fc])
    mv = [e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=mv, vec=-N * depth)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def cut(bm, co, no):
    """keep the side opposite to `no` and cap the cut"""
    geom = list(bm.verts) + list(bm.edges) + list(bm.faces)
    r = bmesh.ops.bisect_plane(bm, geom=geom, plane_co=co, plane_no=no, clear_outer=True)
    bnd = [e for e in r['geom_cut'] if isinstance(e, bmesh.types.BMEdge) and e.is_valid and e.is_boundary]
    if bnd:
        try: bmesh.ops.holes_fill(bm, edges=bnd, sides=0)
        except Exception: pass


def tilt(i, j):
    """shared out-of-plane tilt of the cut between cells i and j (sign follows the pair order)"""
    a, b = min(i, j), max(i, j)
    t = random.Random(a * 7919 + b * 104729).uniform(-0.45, 0.45)
    return t if i < j else -t


def uv_world(bm):
    """UV = world meters on the dominant plane (matches the code-built stone texture scale)"""
    uv = bm.loops.layers.uv.verify()
    for fc in bm.faces:
        n = fc.normal; ax = max(range(3), key=lambda k: abs(n[k]))
        for lp in fc.loops:
            p = lp.vert.co
            lp[uv].uv = (p.y, p.z) if ax == 0 else (p.x, p.z) if ax == 1 else (p.x, p.y)


def to_obj(bm, name, coll):
    if not bm.faces:
        bm.free(); return None
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    uv_world(bm)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = False
    ob = bpy.data.objects.new(name, me); coll.objects.link(ob)
    return ob


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    coll = bpy.context.scene.collection
    faces = L['faces']
    side = {}
    for c in L['chunks']:
        side.setdefault(c['f'], []).append(c)
    made = 0
    for fi, f in enumerate(faces):
        P, A, N = face_basis(f)
        ch = side.get(fi, [])
        seeds = [c for c in ch if not c.get('rim')]
        rims = sorted([c for c in ch if c.get('rim')], key=lambda c: min(c['a0'], c['a1']))
        poly = f['P']
        # --- side shell: Voronoi cells ---
        for c in seeds:
            bm = slab(f, poly, SH)
            if bm is None: continue
            a, z = c['a'], c['z']
            for no, d in ((A, CROP), (-A, CROP), (Vector((0, 0, 1)), CROP), (Vector((0, 0, -1)), CROP)):
                cut(bm, P(a, z) + no * d, no)
            nb = sorted((o for o in seeds if o is not c and math.hypot(o['a'] - a, o['z'] - z) < NEAR),
                        key=lambda o: math.hypot(o['a'] - a, o['z'] - z))
            for o in nb:
                if not bm.faces: break
                pa, pb = P(a, z), P(o['a'], o['z'])
                no = (pb - pa).normalized() + N * tilt(c['i'], o['i'])
                cut(bm, (pa + pb) * 0.5, no.normalized())
            # small random lift so neighbouring pieces don't read as one flat sheet
            rnd = random.Random(c['i'] * 31 + 5)
            bmesh.ops.translate(bm, verts=bm.verts, vec=N * rnd.uniform(-0.012, 0.02))
            if to_obj(bm, 'c%d' % c['i'], coll): made += 1
        # --- rim strip: box per chunk, angled cuts shared with neighbours ---
        for k, c in enumerate(rims):
            a0, a1 = sorted((c['a0'], c['a1']))
            bm = slab(f, [(a0 - 0.6, DH - RH), (a1 + 0.6, DH - RH), (a1 + 0.6, DH), (a0 - 0.6, DH)], RW)
            if bm is None: continue
            for side_k, aa, sgn in ((k - 1, a0, -1), (k + 1, a1, 1)):
                if 0 <= side_k < len(rims):
                    o = rims[side_k]
                    t1, t2 = abs(tilt(c['i'], o['i'])), tilt(min(c['i'], o['i']) + 999, max(c['i'], o['i']) + 999)   # same plane for both pieces
                    no = (A + N * (0.6 * (t1 - 0.22)) + Vector((0, 0, 1)) * (0.3 * t2)) * sgn
                else:
                    no = A * sgn
                cut(bm, P(aa, DH - RH / 2, RW / 2), no.normalized())
            if to_obj(bm, 'c%d' % c['i'], coll): made += 1
    print('chunks', made, 'of', len(L['chunks']))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    kw = dict(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True, export_normals=True, export_texcoords=True)
    try:
        bpy.ops.export_scene.gltf(**kw, export_materials='NONE')
    except TypeError:
        bpy.ops.export_scene.gltf(**kw)
    print('wrote', OUT, os.path.getsize(OUT))


main()
