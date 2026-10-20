# _preview.py — ภาพตัวอย่างโมเดลจากไฟล์ .blend เป็นตาราง (contact sheet) ไว้ตรวจงานโดยไม่ต้องเปิดเกม
# รัน: blender -b <file.blend> --python assets/src/_preview.py -- '<json>'
#  json = {"out":"shots/x.png","cell":[w,h],"cols":4,"h":2.4,"cy":1.1,
#          "tint":{"house":"#7a1a1a",...},
#          "shots":[{"act":"walk","f":4,"view":"front|side|back|q|top","vars":{"hair":3,"tie":0,"wand":1},"hide":["obj"],"label":"..."}]}
import bpy, sys, json, os, math
import numpy as np
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import hexcol, ROOT

spec = json.loads(sys.argv[sys.argv.index('--') + 1])
sc = bpy.context.scene
W, H = spec.get('cell', [300, 420])
sc.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE_NEXT'
try:
    sc.eevee.taa_render_samples = 8
except Exception:
    pass
sc.render.resolution_x, sc.render.resolution_y = W, H
sc.render.film_transparent = False
sc.view_settings.view_transform = 'Standard'
wd = bpy.data.worlds.new('pv') if not sc.world else sc.world
sc.world = wd
wd.use_nodes = True
bg = wd.node_tree.nodes.get('Background')
bg.inputs[0].default_value = (0.32, 0.34, 0.38, 1)
bg.inputs[1].default_value = 0.9
for k, v in spec.get('tint', {}).items():
    m = bpy.data.materials.get('tint_' + k)
    if m:
        m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = hexcol(v)
sun = bpy.data.objects.new('pv_sun', bpy.data.lights.new('pv_sun', 'SUN'))
sun.data.energy = 3.2
sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
sc.collection.objects.link(sun)
camd = bpy.data.cameras.new('pv_cam')
camd.type = 'ORTHO'
camd.ortho_scale = spec.get('h', 2.4) * max(1, W / H)
cam = bpy.data.objects.new('pv_cam', camd)
sc.collection.objects.link(cam)
sc.camera = cam
cy = spec.get('cy', 1.1)
VIEWS = {'front': (0, -8, 0), 'back': (0, 8, 0), 'side': (8, 0, 0), 'rside': (-8, 0, 0), 'q': (5.5, -5.5, 2.2), 'qb': (-5, 5.5, 2.4), 'top': (0.01, -0.5, 8)}
rig = next((o for o in sc.objects if o.type == 'ARMATURE'), None)
VARS = {}
for o in sc.objects:
    p = o.name.rsplit('_', 1)
    if len(p) == 2 and p[1].isdigit():
        VARS.setdefault(p[0], []).append(o)


def pose(act, f):
    if not rig:
        return
    ad = rig.animation_data or rig.animation_data_create()
    for t in ad.nla_tracks:
        t.mute = True
    a = bpy.data.actions.get(act) if act else None
    ad.action = a
    if a is not None and hasattr(ad, 'action_slot') and len(a.slots):
        ad.action_slot = a.slots[0]
    if a is None:
        for b in rig.pose.bones:
            b.rotation_quaternion = (1, 0, 0, 0)
            b.location = (0, 0, 0)
    sc.frame_set(int(f))


cols = spec.get('cols', 4)
shots = spec['shots']
rows = (len(shots) + cols - 1) // cols
sheet = np.zeros((rows * H, cols * W, 4), dtype=np.float32)
tmp = os.path.join(ROOT, 'shots', '_pv_tmp.png')
for i, s in enumerate(shots):
    for k, objs in VARS.items():
        want = s.get('vars', {}).get(k, 0)
        for o in objs:
            o.hide_render = int(o.name.rsplit('_', 1)[1]) != want
    for n in s.get('hide', []):
        if n in sc.objects:
            sc.objects[n].hide_render = True
    pose(s.get('act'), s.get('f', 0))
    d = Vector(VIEWS[s.get('view', 'front')])
    ce = sc.objects[s['center']].location if s.get('center', '') in sc.objects else Vector()
    tgt = Vector((ce.x, ce.y, s.get('cy', cy)))
    cam.location = tgt + d
    cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = tmp
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(tmp)
    px = np.array(img.pixels[:], dtype=np.float32).reshape(H, W, 4)
    bpy.data.images.remove(img)
    r, c = i // cols, i % cols
    sheet[(rows - 1 - r) * H:(rows - r) * H, c * W:(c + 1) * W] = px
    for n in s.get('hide', []):
        if n in sc.objects:
            sc.objects[n].hide_render = False
out = bpy.data.images.new('sheet', cols * W, rows * H)
out.pixels = sheet.ravel()
out.filepath_raw = os.path.join(ROOT, spec['out'])
out.file_format = 'PNG'
out.save()
os.remove(tmp)
print('SHEET', spec['out'], len(shots))
