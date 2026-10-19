# Fire / smoke flipbooks from a real Mantaflow simulation (VFX.md §5.1)
# Run headless:  blender -b -P assets/src/fire_flipbook_build.py -- <mode> <outdir> [res] [frames]
#   mode = fire  -> <outdir>/fire_####.png  (tall camera 1:2) + fire_sq_####.png (square camera)
#   mode = wall  -> <outdir>/wall_####.png  (a long continuous line of fire, 2:1 camera) — for fire along edges/cracks
#   mode = smoke -> <outdir>/smoke_####.png (transparent, lit from above, white-grey)
# The frames are packed into 8x8 atlases by tools/pack_flipbook.py (alpha from brightness for fire, loop crossfade).
import bpy, sys, os, math

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
MODE = argv[0] if argv else 'fire'
OUT = os.path.abspath(argv[1] if len(argv) > 1 else '//flipbook_out')
RES = int(argv[2]) if len(argv) > 2 else 96
FRAMES = int(argv[3]) if len(argv) > 3 else 120
RFROM = int(argv[4]) if len(argv) > 4 else 1      # render only frames RFROM..FRAMES (quick look tests)
os.makedirs(OUT, exist_ok=True)
FIRE = MODE in ('fire', 'wall')

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.frame_start, sc.frame_end = 1, FRAMES

# --- emitter + domain via Quick Smoke (sets up the volume material that reads density/flame) ---
if MODE == 'wall':
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.14)); bpy.context.active_object.scale = (3.2, 0.12, 0.08)
elif MODE == 'fire':
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.16, location=(0, 0, 0.22))
else:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.16, location=(0, 0, 0.62))
emit = bpy.context.active_object
emit.name = 'Emitter'
emit.select_set(True)
bpy.ops.object.quick_smoke(style='FIRE' if FIRE else 'SMOKE', show_flows=False)
dom = [o for o in sc.objects if o.name.startswith('Smoke Domain')][0]
# domain: 1 wide, 1 deep, 2 tall (fire) / 1.6 cube (smoke), origin at the floor
if MODE == 'wall':
    dom.location = (0, 0, 0.8); dom.scale = (2.0, 0.4, 0.8)
elif MODE == 'fire':
    dom.location = (0, 0, 1.0); dom.scale = (0.5, 0.5, 1.0)
else:
    dom.location = (0, 0, 0.8); dom.scale = (0.8, 0.8, 0.8)
bpy.context.view_layer.update()

fm = dom.modifiers['Fluid']; ds = fm.domain_settings
ds.resolution_max = RES
ds.use_adaptive_domain = False
ds.cache_directory = os.path.join(OUT, 'cache_' + MODE)
ds.cache_type = 'ALL'
ds.cache_frame_start, ds.cache_frame_end = 1, FRAMES
ds.use_noise = True
ds.noise_scale = 2
ds.noise_strength = 1.8 if FIRE else 1.2
ds.vorticity = 0.55 if FIRE else 0.35
if FIRE:
    ds.flame_vorticity = 1.6
    ds.burning_rate = 0.85 if MODE == 'wall' else 1.2   # fuel burns fast -> short flames with licking tips
    ds.flame_smoke = 0.0         # no smoke: the game adds its own smoke
    ds.flame_max_temp = 2.2
else:
    ds.alpha = -0.05             # buoyancy (density): puff stays near the centre, the game moves particles itself
    ds.beta = 0.12               # buoyancy (heat)
    ds.dissolve_speed = 45
    ds.use_dissolve_smoke = True

flow = emit.modifiers['Fluid'].flow_settings
flow.flow_source = 'MESH'
flow.surface_distance = 0.6
if FIRE:
    flow.flow_type = 'FIRE'
    flow.fuel_amount = 0.9
    flow.temperature = 1.2
    flow.use_initial_velocity = True
    flow.velocity_coord = (0, 0, 0.6)
else:
    flow.flow_type = 'SMOKE'
    flow.density = 1.4
    flow.temperature = 1.0
    flow.smoke_color = (1, 1, 1)
    # one puff: emit only for the first frames (keyframe the flow on/off)
    flow.flow_behavior = 'INFLOW'
    flow.use_initial_velocity = True
    flow.velocity_normal = 1.4           # puff billows outward
    flow.velocity_coord = (0, 0, 0.15)
    flow.density = 1.6
    flow.keyframe_insert('density', frame=1)
    flow.density = 1.6
    flow.keyframe_insert('density', frame=5)
    flow.density = 0.0
    flow.keyframe_insert('density', frame=7)
emit.hide_render = True

# --- bake ---
with bpy.context.temp_override(object=dom, active_object=dom, selected_objects=[dom]):
    bpy.ops.fluid.bake_all()

# --- look: volume material tweaks ---
mat = dom.active_material
nodes = mat.node_tree.nodes
pv = [n for n in nodes if n.type == 'PRINCIPLED_VOLUME'][0]
if FIRE:
    # own emission: flame attribute -> colour ramp (dark red tips -> orange -> yellow -> white-hot core), no smoke density
    nt = mat.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL': nt.nodes.remove(n)
    out = [n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'][0]
    at = nt.nodes.new('ShaderNodeAttribute'); at.attribute_name = 'flame'
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Max'].default_value = 1.0
    cr = nt.nodes.new('ShaderNodeValToRGB'); E = cr.color_ramp.elements
    E[0].position, E[0].color = 0.0, (0, 0, 0, 1)
    E[1].position, E[1].color = 1.0, (1.0, 0.97, 0.85, 1)
    for pos, c in ((0.08, (0.35, 0.03, 0.0, 1)), (0.25, (0.95, 0.22, 0.02, 1)), (0.5, (1.0, 0.55, 0.08, 1)), (0.75, (1.0, 0.85, 0.35, 1))):
        e = E.new(pos); e.color = c
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 6.0
    pv2 = nt.nodes.new('ShaderNodeVolumePrincipled'); pv2.inputs['Density'].default_value = 0.0
    pv2.inputs['Emission Strength'].default_value = 6.0
    nt.links.new(at.outputs['Fac'], mr.inputs['Value']); nt.links.new(mr.outputs['Result'], cr.inputs['Fac'])
    nt.links.new(cr.outputs['Color'], pv2.inputs['Emission Color']); nt.links.new(pv2.outputs['Volume'], out.inputs['Volume'])
else:
    pv.inputs['Density'].default_value = 5.0
    pv.inputs['Color'].default_value = (0.92, 0.92, 0.92, 1)

# --- render setup: Cycles GPU, black world (fire alpha comes from brightness later), Standard colours ---
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
sc.cycles.samples = 48
sc.cycles.use_denoising = True
sc.cycles.volume_step_rate = 0.5
sc.view_settings.view_transform = 'Standard'
sc.view_settings.look = 'None'
sc.world = bpy.data.worlds.new('W'); sc.world.use_nodes = True
bg = sc.world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0, 0, 0, 1); bg.inputs['Strength'].default_value = 0
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'
sc.render.film_transparent = not FIRE
if not FIRE:
    bpy.ops.object.light_add(type='SUN', location=(0, 0, 5)); s = bpy.context.active_object
    s.data.energy = 6.0; s.rotation_euler = (math.radians(25), 0, math.radians(20))
    bpy.ops.object.light_add(type='SUN', location=(0, 0, -5)); f = bpy.context.active_object
    f.data.energy = 0.6; f.rotation_euler = (math.radians(180), 0, 0)

def cam(name, w, h, scale, z):
    bpy.ops.object.camera_add(location=(0, -6, z), rotation=(math.radians(90), 0, 0))
    c = bpy.context.active_object; c.name = name
    c.data.type = 'ORTHO'; c.data.ortho_scale = scale
    return c, w, h

shots = []
if MODE == 'wall':
    shots.append((cam('CamWall', 512, 256, 4.0, 0.8), 'wall_'))
elif MODE == 'fire':
    shots.append((cam('CamTall', 256, 512, 1.7, 0.84), 'fire_'))
    shots.append((cam('CamSq', 256, 256, 1.25, 0.62), 'fire_sq_'))
else:
    shots.append((cam('CamSmoke', 256, 256, 1.62, 0.8), 'smoke_'))

for (c, w, h), prefix in shots:
    sc.camera = c
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.resolution_percentage = 100
    for f in range(RFROM, FRAMES + 1):
        sc.frame_set(f)
        sc.render.filepath = os.path.join(OUT, prefix + '%04d.png' % f)
        bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, MODE + '_flipbook.blend'))
print('FLIPBOOK DONE', MODE, OUT)
