# Way 1 test: a baked fire column played back in the game as a real 3D volume sequence.
# Run headless:  blender -b -P assets/src/fire_volseq_build.py -- <outdir> [res] [first] [last] [mode]
#   mode column = looping fire column (Ignition Snap) • burst = one-shot fire burst rising from the ground (Dragonfall impact)
# Writes <outdir>/f####.f32 (flame grid of each frame) + seq.json (grid size, frames). tools/pack_volseq.py packs them.
import bpy, sys, os, json, array

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else '//volseq_out')
RES = int(argv[1]) if len(argv) > 1 else 64
FIRST = int(argv[2]) if len(argv) > 2 else 61
LAST = int(argv[3]) if len(argv) > 3 else 120
MODE = argv[4] if len(argv) > 4 else 'column'
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.frame_start, sc.frame_end = 1, LAST
if MODE == 'burst':
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.42, location=(0, 0, 0.2)); bpy.context.active_object.scale = (1, 1, 0.5)
else:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.2, location=(0, 0, 0.22))
emit = bpy.context.active_object
emit.select_set(True)
bpy.ops.object.quick_smoke(style='FIRE', show_flows=False)
dom = [o for o in sc.objects if o.name.startswith('Smoke Domain')][0]
if MODE == 'burst':
    dom.location = (0, 0, 0.75); dom.scale = (1.0, 1.0, 0.75)   # 2 x 2 x 1.5
else:
    dom.location = (0, 0, 1.0); dom.scale = (0.5, 0.5, 1.0)     # 1 x 1 x 2
bpy.context.view_layer.update()

ds = dom.modifiers['Fluid'].domain_settings
ds.resolution_max = RES
ds.use_adaptive_domain = False
ds.cache_directory = os.path.join(OUT, 'cache')
ds.cache_type = 'ALL'
ds.cache_frame_start, ds.cache_frame_end = 1, LAST
ds.use_noise = False
ds.vorticity = 0.6
ds.flame_vorticity = 1.6
ds.burning_rate = 1.0
ds.flame_smoke = 0.0
ds.flame_max_temp = 2.2
fl = emit.modifiers['Fluid'].flow_settings
fl.flow_type = 'FIRE'; fl.flow_source = 'MESH'; fl.surface_distance = 0.6
fl.fuel_amount = 1.0; fl.temperature = 1.3
fl.use_initial_velocity = True; fl.velocity_coord = (0, 0, 0.6)
if MODE == 'burst':
    # one big puff: blast out and up for a few frames, then the fire rolls up and burns out
    fl.fuel_amount = 2.6; fl.temperature = 2.2; fl.velocity_normal = 3.0; fl.velocity_coord = (0, 0, 1.6)
    fl.keyframe_insert('fuel_amount', frame=1); fl.keyframe_insert('fuel_amount', frame=9)
    fl.fuel_amount = 0.0; fl.keyframe_insert('fuel_amount', frame=12)
    fl.temperature = 2.2; fl.keyframe_insert('temperature', frame=9); fl.temperature = 0.0; fl.keyframe_insert('temperature', frame=12)
    ds.burning_rate = 0.3; ds.vorticity = 0.9; ds.flame_vorticity = 2.2

with bpy.context.temp_override(object=dom, active_object=dom, selected_objects=[dom]):
    bpy.ops.fluid.bake_all()

res = None
for f in range(FIRST, LAST + 1):
    sc.frame_set(f)
    dsev = dom.evaluated_get(bpy.context.evaluated_depsgraph_get()).modifiers['Fluid'].domain_settings
    res = list(dsev.domain_resolution)
    array.array('f', list(dsev.flame_grid)).tofile(open(os.path.join(OUT, 'f%04d.f32' % f), 'wb'))
json.dump({'res': res, 'first': FIRST, 'last': LAST}, open(os.path.join(OUT, 'seq.json'), 'w'))
print('VOLSEQ DONE', res, LAST - FIRST + 1)
