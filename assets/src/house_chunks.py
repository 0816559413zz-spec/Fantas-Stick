# house_chunks.py — ตัดบ้าน (house.blend) เป็นชิ้นย่อยแบบ Battlefield แล้ว export assets/buildings/house.glb ใหม่
# รัน:  D:\Blender\blender.exe -b assets/src/house.blend --python assets/src/house_chunks.py
# ตาราง (ต้องตรงกับ BLD_GRID ใน js/12-buildings.js — รายละเอียดใน Destruction.md):
#   wall_front / wall_back : 4 คอลัมน์ตามแกน X (ขอบ −2, 0, 2) × 3 แถวตามความสูง (ขอบ 1.4, 2.8)
#   wall_left / wall_right : 3 คอลัมน์ตามแกน Y (คอลัมน์ 0 = ฝั่ง +Y = หลังบ้าน; ขอบ ±1.083) × 3 แถว
#   roof_left / roof_right : 3 คอลัมน์ตามแกน Y (เหมือนผนังข้าง) × 2 แถว (แถว 0 = ชายคา |X| > 2, แถว 1 = สันหลังคา)
# ชิ้นย่อยชื่อ <ชิ้น>_c<เลข>  เลข = แถว × คอลัมน์ทั้งหมด + คอลัมน์ • ชิ้นเดิมและ _broken ยังอยู่ในไฟล์ (_broken = กองซากตอนชิ้นนั้นพังหมด)
import bpy, bmesh, os, math, sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), 'buildings', sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'house.glb')   # -- house_ldn.glb = บ้านลอนดอน
INF = 99.0
BW, BD, WH = 8.0, 6.5, 4.2
WROWS = [-INF, WH / 3, WH * 2 / 3, INF]
FB_COLS = [-INF, -BW / 4, 0.0, BW / 4, INF]                  # ตามแกน X
SIDE_COLS = [INF, BD / 6, -BD / 6, -INF]                       # ตามแกน Y (คอลัมน์ 0 = +Y)
GRID = {
    'wall_front': ('X', FB_COLS, 'Z', WROWS),
    'wall_back': ('X', FB_COLS, 'Z', WROWS),
    'wall_left': ('Y', SIDE_COLS, 'Z', WROWS),
    'wall_right': ('Y', SIDE_COLS, 'Z', WROWS),
    'roof_left': ('Y', SIDE_COLS, 'X', [-INF, -BW / 4, INF]),  # แถว 0 = ชายคา (X < −2)
    'roof_right': ('Y', SIDE_COLS, 'X', [INF, BW / 4, -INF]),  # แถว 0 = ชายคา (X > 2)
}
AX = {'X': Vector((1, 0, 0)), 'Y': Vector((0, 1, 0)), 'Z': Vector((0, 0, 1))}


def keep_between(bm, axis, a, b):
    """เก็บเฉพาะส่วนที่อยู่ระหว่างระนาบ axis = a … b (a, b เรียงอย่างไรก็ได้) แล้วปิดรอยตัด"""
    lo, hi = min(a, b), max(a, b)
    n = AX[axis]
    for val, clear_outer in ((lo, False), (hi, True)):
        if abs(val) >= INF: continue
        geom = list(bm.verts) + list(bm.edges) + list(bm.faces)
        r = bmesh.ops.bisect_plane(bm, geom=geom, plane_co=n * val, plane_no=n, clear_inner=not clear_outer, clear_outer=clear_outer)
        cut = [e for e in r['geom_cut'] if isinstance(e, bmesh.types.BMEdge)]
        bnd = [e for e in cut if e.is_valid and e.is_boundary]
        if bnd:
            try: bmesh.ops.holes_fill(bm, edges=bnd, sides=0)
            except Exception: pass


house = bpy.data.collections['HOUSE']
made = []
for name, (ua, ucols, va, vrows) in GRID.items():
    src = bpy.data.objects[name]
    ncol = len(ucols) - 1
    for r in range(len(vrows) - 1):
        for c in range(ncol):
            bm = bmesh.new(); bm.from_mesh(src.data)
            bm.transform(src.matrix_world)
            keep_between(bm, ua, ucols[c], ucols[c + 1])
            keep_between(bm, va, vrows[r], vrows[r + 1])
            if not bm.faces:
                bm.free(); continue
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
            me = bpy.data.meshes.new('%s_c%d' % (name, r * ncol + c)); bm.to_mesh(me); bm.free()
            for m in src.data.materials: me.materials.append(m)
            o = bpy.data.objects.new(me.name, me); house.objects.link(o)
            made.append(o)

# export (ชิ้นทั้งหมดของ collection HOUSE ไว้ที่ origin เหมือน house_build.py)
obs = list(house.objects)
saved = {o.name: o.location.copy() for o in obs}
for o in obs:
    if o.name.endswith('_broken'): o.location = (0, 0, 0)
for o in bpy.context.view_layer.objects: o.select_set(False)
for o in obs: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                          export_animations=False, export_extras=False, export_draco_mesh_compression_enable=True,
                          export_draco_mesh_compression_level=6)
for o in obs: o.location = saved[o.name]
print('CHUNKS', len(made), sorted(o.name for o in made)[:6], 'kb', round(os.path.getsize(OUT) / 1024, 1),
      'tris', sum(len(p.vertices) - 2 for o in made for p in o.data.polygons))
