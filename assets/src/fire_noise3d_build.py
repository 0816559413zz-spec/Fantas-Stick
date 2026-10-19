# "Fire detail" 3D texture from a real Mantaflow fire simulation (for fireVol in js/42-fire-vfx.js)
# Run headless:  blender -b -P assets/src/fire_noise3d_build.py -- <outdir> [res] [frame]
# Bakes a turbulent fire filling a cube domain, then writes the flame / density / heat grids of one
# developed frame as raw float32 files (<outdir>/flame.f32, density.f32, heat.f32 + grid.json with the size).
# tools/pack_noise3d.py turns them into assets/vfx/fire3d.bin (64^3 bytes, seamless) for the game.
import bpy, sys, os, json

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else '//noise3d_out')
RES = int(argv[1]) if len(argv) > 1 else 112
FRAME = int(argv[2]) if len(argv) > 2 else 90
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.frame_start, sc.frame_end = 1, FRAME

# many small burners at random spots, each pushing a different way -> plumes collide and curl through the whole domain
import random
random.seed(7)
ems = []
for i in range(14):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, location=(random.uniform(-0.75, 0.75), random.uniform(-0.75, 0.75), random.uniform(0.15, 1.2)))
    ems.append(bpy.context.active_object)
for o in ems: o.select_set(True)
bpy.context.view_layer.objects.active = ems[0]
bpy.ops.object.quick_smoke(style='BOTH', show_flows=False)
dom = [o for o in sc.objects if o.name.startswith('Smoke Domain')][0]
dom.location = (0, 0, 1.0); dom.scale = (1.0, 1.0, 1.0)
bpy.context.view_layer.update()

ds = dom.modifiers['Fluid'].domain_settings
ds.resolution_max = RES
ds.use_adaptive_domain = False
ds.cache_directory = os.path.join(OUT, 'cache')
ds.cache_type = 'ALL'
ds.cache_frame_start, ds.cache_frame_end = 1, FRAME
ds.use_noise = False            # grids are read at base resolution
ds.vorticity = 1.2
ds.flame_vorticity = 2.5
ds.burning_rate = 0.9
ds.flame_smoke = 1.0
ds.alpha = 0.3
ds.beta = 1.0
ds.use_dissolve_smoke = True
ds.dissolve_speed = 40
for side in ('top',):
    try: setattr(ds, 'use_collision_border_' + side, False)
    except Exception: pass

for o in ems:
    fl = o.modifiers['Fluid'].flow_settings
    fl.flow_type = 'BOTH'
    fl.flow_source = 'MESH'
    fl.surface_distance = 0.12
    fl.fuel_amount = 1.4
    fl.temperature = 1.4
    fl.density = 1.0
    fl.use_initial_velocity = True
    fl.velocity_coord = (random.uniform(-1.2, 1.2), random.uniform(-1.2, 1.2), random.uniform(0.2, 1.0))
    o.hide_render = True

with bpy.context.temp_override(object=dom, active_object=dom, selected_objects=[dom]):
    bpy.ops.fluid.bake_all()

sc.frame_set(FRAME)
dg = bpy.context.evaluated_depsgraph_get()
dsev = dom.evaluated_get(dg).modifiers['Fluid'].domain_settings
r = list(dsev.domain_resolution)
grids = {}
for name in ('flame_grid', 'density_grid', 'heat_grid'):
    try:
        a = list(getattr(dsev, name))
        grids[name] = a
        import array
        array.array('f', a).tofile(open(os.path.join(OUT, name.split('_')[0] + '.f32'), 'wb'))
    except Exception as e:
        print('grid fail', name, e)
json.dump({'res': r, 'frame': FRAME, 'n': {k: len(v) for k, v in grids.items()}}, open(os.path.join(OUT, 'grid.json'), 'w'))
print('NOISE3D DONE', r, {k: len(v) for k, v in grids.items()})
