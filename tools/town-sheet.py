# Contact sheets of the town kit (assets/mapkit/town.glb) + town-demo street scene, rendered offline in Blender
# Run: D:/Blender/blender.exe -b --factory-startup --python tools/town-sheet.py  → shots/town_sheet_*.jpg, shots/town_scene_*.jpg
import bpy, json, math, os, sys
ROOT = r'D:\AI\Fantas-Stick'
OUT = os.path.join(ROOT, 'shots')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, 'assets', 'mapkit', 'town.glb'))
INF = json.load(open(os.path.join(ROOT, 'assets', 'mapkit', 'town.info.json')))
src = {o.name[2:]: o for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith('t_')}
for o in src.values(): o.hide_render = True; o.hide_viewport = True
sc = bpy.context.scene
try: sc.render.engine = 'BLENDER_EEVEE_NEXT'
except TypeError:
    try: sc.render.engine = 'BLENDER_EEVEE'
    except TypeError: pass
sc.render.film_transparent = False
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs[0].default_value = (0.78, 0.82, 0.86, 1); bg.inputs[1].default_value = 0.9
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 3.2; sun.rotation_euler = (math.radians(50), math.radians(10), math.radians(35)); sc.collection.objects.link(sun)
for m in bpy.data.materials:
    if m.name.startswith('glow'):
        bs = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if bs: bs.inputs['Emission Strength'].default_value = 3.0
gm = bpy.data.materials.new('ground'); gm.use_nodes = True; next(n for n in gm.node_tree.nodes if n.type == 'BSDF_PRINCIPLED').inputs['Base Color'].default_value = (0.42, 0.5, 0.32, 1)
coll = []
def inst(k, x, y, rz=0):
    o = bpy.data.objects.new(k, src[k].data); o.location = (x, y, 0); o.rotation_euler = (0, 0, rz); sc.collection.objects.link(o); coll.append(o); return o
def label(t, x, y, s=0.6):
    c = bpy.data.curves.new('t', 'FONT'); c.body = t; c.size = s; c.align_x = 'CENTER'; o = bpy.data.objects.new('t', c); o.location = (x, y, 0.02); sc.collection.objects.link(o); coll.append(o)
    m = bpy.data.materials.new('lbl'); m.use_nodes = True; next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED').inputs['Base Color'].default_value = (0.05, 0.05, 0.06, 1); c.materials.append(m)
def ground(cx, cy, sx, sy):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(cx, cy, -0.01)); g = bpy.context.object; g.scale = (sx, sy, 1); g.data.materials.append(gm); coll.append(g)
def clear():
    for o in coll: bpy.data.objects.remove(o, do_unlink=True)
    coll.clear()
def cam(loc, tgt, lens=35, res=(1600, 1000)):
    c = bpy.data.objects.get('cam') or bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    if c.name not in sc.collection.objects: sc.collection.objects.link(c)
    c.data.lens = lens; c.data.clip_end = 2000; c.location = loc
    d = (tgt[0] - loc[0], tgt[1] - loc[1], tgt[2] - loc[2]); import mathutils
    c.rotation_euler = mathutils.Vector(d).to_track_quat('-Z', 'Y').to_euler(); sc.camera = c
    sc.render.resolution_x, sc.render.resolution_y = res
def shot(name): sc.render.filepath = os.path.join(OUT, name); sc.render.image_settings.file_format = 'JPEG'; bpy.ops.render.render(write_still=True)
def grid(keys, cols, gap, name, h=1.0):
    cw = max(max(INF[k]['w'], INF[k]['d']) for k in keys) + gap; rows = math.ceil(len(keys) / cols)
    for i, k in enumerate(keys):
        x = (i % cols) * cw; y = -(i // cols) * cw; inst(k, x, y); label(k, x, y - max(INF[k]['d'], 1) / 2 - 0.9 * h, 0.55 * h)
    W = (cols - 1) * cw; H = (rows - 1) * cw; ground(W / 2, -H / 2, W + cw, H + cw)
    D = max(W * 0.62, H) * 1.25 + cw * 2.2
    cam((W / 2, -H / 2 - D * 0.75, D * 0.75), (W / 2, -H / 2, 0), 35); shot(name); clear()
cats = lambda c: [k for k in INF if INF[k]['cat'] == c]
grid([k for k in cats('build') if k.endswith('_red')] + [k for k in cats('build') if k.endswith('_slate')], 4, 4, 'town_sheet_houses.jpg', 1.6)
grid(cats('road'), 5, 2.5, 'town_sheet_roads.jpg', 1.2)
grid(cats('light') + cats('fence'), 6, 1.5, 'town_sheet_lights_fences.jpg', 0.9)
grid(cats('prop'), 7, 1.2, 'town_sheet_props.jpg', 0.8)
# street scene from maps/build/town-demo.json (x east, z south → blender (x, -z))
M = json.load(open(os.path.join(ROOT, 'maps', 'build', 'town-demo.json'), encoding='utf8'))
for o in M['objs']:
    if o['t'].startswith('kit:town/') and o['x'] > 125: inst(o['t'][9:], o['x'], -o['z'], o.get('rot', 0))
ground(160, -48, 80, 100)
cam((140, -100, 22), (160, -48, 0), 30, (1600, 900)); shot('town_scene_street.jpg')
cam((150, -54, 2.2), (162, -30, 3), 24, (1600, 900)); shot('town_scene_eye.jpg')
cam((205, -30, 40), (160, -50, 0), 32, (1600, 900)); shot('town_scene_high.jpg')
