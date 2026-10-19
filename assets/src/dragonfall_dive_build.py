# Dragonfall dive: fire comet streak (user's sketch, 2026-10-20: two slanted lines down into the impact)
# A fire ball moves fast along +X through a long box and leaves a continuous fire trail that burns out.
# The game rotates the box along the real dive line and stretches its length (js/25-efx.js 'dfdive').
# Run headless:  blender -b -P assets/src/dragonfall_dive_build.py -- <outdir> [res] [frames] [render_step] [dump]
#   prev_####.png = side view preview • dump=1 -> f####.f32 + seq.json for tools/pack_volseq.py
# Local box: x -3..3 (head travels -2.6 -> +2.6 in frames 1..HEAD), y/z -0.7..0.7 (z = "up" of the sim)
import bpy, sys, os, math, json, array

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else '//dfdive_out')
RES = int(argv[1]) if len(argv) > 1 else 128
FRAMES = int(argv[2]) if len(argv) > 2 else 24
STEP = int(argv[3]) if len(argv) > 3 else 3
DUMP = len(argv) > 4 and argv[4] == '1'
HEAD = 11                      # 0.45 s at 24 fps = the dive time on the host
L, W = 6.0, 1.4
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.frame_start, sc.frame_end = 1, FRAMES
sc.render.fps = 24
sc.gravity = (0, 0, -2.0)      # weak buoyancy: the trail stays on the line, curls a little

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.26, location=(-2.6, 0, 0)); head = bpy.context.active_object
head.name = 'Head'; head.scale = (1.5, 1, 1)
head.keyframe_insert('location', frame=1)
head.location = (2.6, 0, 0); head.keyframe_insert('location', frame=HEAD)
with bpy.context.temp_override(object=head, active_object=head, selected_objects=[head]):
    bpy.ops.object.modifier_add(type='FLUID')
m = head.modifiers['Fluid']; m.fluid_type = 'FLOW'
f = m.flow_settings
f.flow_type = 'FIRE'; f.flow_behavior = 'INFLOW'; f.flow_source = 'MESH'; f.subframes = 4
f.surface_distance = 0.35; f.fuel_amount = 2.0; f.temperature = 2.2
f.use_initial_velocity = True; f.velocity_factor = -0.35; f.velocity_normal = 0.5   # fire thrown backward = streak
tx = bpy.data.textures.new('HeadNoise', 'CLOUDS'); tx.noise_scale = 0.15
f.use_texture = True; f.noise_texture = tx; f.texture_map_type = 'AUTO'
for fr, v in ((1, 2.0), (HEAD, 2.0), (HEAD + 1, 0.0)):
    f.fuel_amount = v; f.keyframe_insert('fuel_amount', frame=fr)
    f.temperature = 2.2 if v else 0.0; f.keyframe_insert('temperature', frame=fr)
head.hide_render = True

bpy.ops.object.effector_add(type='TURBULENCE', location=(0, 0, 0)); tb = bpy.context.active_object
tb.field.strength = 4.5; tb.field.size = 0.2

bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0)); dom = bpy.context.active_object
dom.name = 'Domain'; dom.scale = (L, W, W)
with bpy.context.temp_override(object=dom, active_object=dom, selected_objects=[dom]):
    bpy.ops.object.modifier_add(type='FLUID')
fm = dom.modifiers['Fluid']; fm.fluid_type = 'DOMAIN'
ds = fm.domain_settings
ds.domain_type = 'GAS'; ds.resolution_max = RES; ds.use_adaptive_domain = False
ds.cache_directory = os.path.join(OUT, 'cache'); ds.cache_type = 'ALL'
ds.cache_frame_start, ds.cache_frame_end = 1, FRAMES
ds.use_noise = False; ds.vorticity = 0.6; ds.flame_vorticity = 2.4
ds.burning_rate = 3.0;   # burns fast: tail tapers, head stays brightest
ds.flame_smoke = 0.0; ds.flame_max_temp = 2.4
with bpy.context.temp_override(object=dom, active_object=dom, selected_objects=[dom]):
    bpy.ops.fluid.bake_all()

if DUMP:
    res = None
    for fr in range(1, FRAMES + 1):
        sc.frame_set(fr)
        dsev = dom.evaluated_get(bpy.context.evaluated_depsgraph_get()).modifiers['Fluid'].domain_settings
        res = list(dsev.domain_resolution)
        array.array('f', list(dsev.flame_grid)).tofile(open(os.path.join(OUT, 'f%04d.f32' % fr), 'wb'))
    json.dump({'res': res, 'first': 1, 'last': FRAMES, 'size': [L, W, W], 'head': HEAD}, open(os.path.join(OUT, 'seq.json'), 'w'))

mat = bpy.data.materials.new('Fire'); nt = mat.node_tree if mat.node_tree else None
mat.use_nodes = True; nt = mat.node_tree
for n in list(nt.nodes):
    if n.type != 'OUTPUT_MATERIAL': nt.nodes.remove(n)
out = [n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'][0]
at = nt.nodes.new('ShaderNodeAttribute'); at.attribute_name = 'flame'
cr = nt.nodes.new('ShaderNodeValToRGB'); E = cr.color_ramp.elements
E[0].position, E[0].color = 0.0, (0, 0, 0, 1)
E[1].position, E[1].color = 1.0, (1.0, 0.97, 0.85, 1)
for pos, c in ((0.08, (0.35, 0.03, 0.0, 1)), (0.25, (0.95, 0.22, 0.02, 1)), (0.5, (1.0, 0.55, 0.08, 1)), (0.75, (1.0, 0.85, 0.35, 1))):
    e = E.new(pos); e.color = c
pv = nt.nodes.new('ShaderNodeVolumePrincipled'); pv.inputs['Density'].default_value = 0.0
pv.inputs['Emission Strength'].default_value = 2.2
nt.links.new(at.outputs['Fac'], cr.inputs['Fac']); nt.links.new(cr.outputs['Color'], pv.inputs['Emission Color'])
nt.links.new(pv.outputs['Volume'], out.inputs['Volume'])
dom.data.materials.append(mat)

sc.render.engine = 'CYCLES'
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for t in ('OPTIX', 'CUDA'):
        try:
            prefs.compute_device_type = t; prefs.get_devices()
            if any(d.type == t for d in prefs.devices):
                for d in prefs.devices: d.use = d.type == t
                sc.cycles.device = 'GPU'; break
        except Exception:
            pass
except Exception:
    pass
sc.cycles.samples = 48; sc.cycles.use_denoising = True; sc.cycles.volume_step_rate = 0.5
sc.view_settings.view_transform = 'AgX'
sc.world = bpy.data.worlds.new('W'); sc.world.use_nodes = True
bg = sc.world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.012, 0.014, 0.022, 1)
sc.render.image_settings.file_format = 'PNG'
bpy.ops.object.camera_add(location=(0, -6.5, 0.8)); cam = bpy.context.active_object
cam.rotation_euler = (math.radians(83), 0, 0); cam.data.lens = 28
sc.camera = cam
sc.render.resolution_x, sc.render.resolution_y = 640, 300
for fr in range(1, FRAMES + 1, STEP):
    sc.frame_set(fr)
    sc.render.filepath = os.path.join(OUT, 'prev_%04d.png' % fr)
    bpy.ops.render.render(write_still=True)
print('DFDIVE DONE', OUT)
