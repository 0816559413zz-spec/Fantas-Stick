# Dragonfall impact: one Mantaflow fire sim shaped after the user's sketch (2026-10-20)
#   1) blast at the hit point  2) tall twisting fire column in the middle
#   3) one continuous fire ring that rolls out along the ground  4) fire rising along the edge of the circle
# Run headless:  blender -b -P assets/src/dragonfall_impact_build.py -- <outdir> [res] [frames] [render_step] [dump] [mode]
#   mode full (default) = column + ring • ring = no tall column: low burst, rolling ring, edge fire (storyboard #9 variant A)
#   writes <outdir>/prev_####.png (perspective preview, game-like camera, dark ground lit by the fire)
#   dump=1 also writes <outdir>/f####.f32 flame grids + seq.json (for tools/pack_volseq.py)
# Units: 1 Blender unit = impact radius / 1.6 (ring ends at R = 1.6).
import bpy, sys, os, math, json, array

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else '//dfimpact_out')
RES = int(argv[1]) if len(argv) > 1 else 112
FRAMES = int(argv[2]) if len(argv) > 2 else 60
STEP = int(argv[3]) if len(argv) > 3 else 4
DUMP = len(argv) > 4 and argv[4] == '1'
MODE = argv[5] if len(argv) > 5 else 'full'
R = 1.6
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.frame_start, sc.frame_end = 1, FRAMES
sc.render.fps = 24

def fire_flow(o, fuel, temp, src_vel=0.0, normal=0.0, up=0.0, dist=0.5):
    with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o]):
        bpy.ops.object.modifier_add(type='FLUID')
    m = o.modifiers['Fluid']; m.fluid_type = 'FLOW'
    f = m.flow_settings
    f.flow_type = 'FIRE'; f.flow_behavior = 'INFLOW'; f.flow_source = 'MESH'
    f.surface_distance = dist; f.fuel_amount = fuel; f.temperature = temp
    f.use_initial_velocity = True; f.velocity_factor = src_vel; f.velocity_normal = normal
    f.velocity_coord = (0, 0, up)
    o.hide_render = True
    return f

def key_fuel(f, pts):
    # pts = [(frame, fuel)] ; temperature follows fuel so the fire really stops
    for fr, v in pts:
        f.fuel_amount = v; f.keyframe_insert('fuel_amount', frame=fr)
        f.temperature = 0.0 if v == 0 else max(f.temperature, 1.0); f.keyframe_insert('temperature', frame=fr)

# 1) blast: squashed ball at the hit point, few frames, pushes out + up
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.38, location=(0, 0, 0.12)); blast = bpy.context.active_object
blast.name = 'Blast'; blast.scale = (1, 1, 0.45)
fb = fire_flow(blast, 2.6, 2.4, normal=3.2, up=2.2 if MODE != 'ring' else 1.2)
key_fuel(fb, [(1, 2.6), (4, 2.6), (6, 0)])

if MODE != 'ring':
    # 2) column: a thin emitter that shoots up like a geyser (its height = column height), then sinks back
    bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=0.42, radius2=0.12, depth=1.0, location=(0, 0, 0.5)); col = bpy.context.active_object  # wide base, narrow top (sketch)
    col.name = 'Column'
    bpy.context.scene.cursor.location = (0, 0, 0)
    with bpy.context.temp_override(object=col, active_object=col, selected_objects=[col], selected_editable_objects=[col]):
        bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    for f, h in ((1, 0.1), (5, 2.3), (22, 2.5), (36, 0.3)):
        col.scale = (1, 1, h); col.keyframe_insert('scale', frame=f)
    fc = fire_flow(col, 1.5, 2.0, src_vel=0.6, normal=1.4, up=3.0, dist=0.25)
    fc.subframes = 2
    # break the emission up with a noise texture -> flame tongues instead of a solid pipe
    tx = bpy.data.textures.new('ColNoise', 'CLOUDS'); tx.noise_scale = 0.18; tx.noise_depth = 2
    fc.use_texture = True; fc.noise_texture = tx; fc.texture_map_type = 'AUTO'; fc.texture_size = 1.0
    fc.keyframe_insert('texture_offset', frame=1); fc.texture_offset = 3.0; fc.keyframe_insert('texture_offset', frame=40)
    key_fuel(fc, [(1, 1.6), (22, 1.6), (34, 0.6), (38, 0)])

# 3) ground ring: thin torus that grows from the centre to R, its motion drives the fire outward
bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.07, major_segments=96, minor_segments=8, location=(0, 0, 0.08))
ring = bpy.context.active_object; ring.name = 'GroundRing'
fr = fire_flow(ring, 1.2, 1.6, src_vel=1.0, normal=0.6, up=0.4, dist=0.3)
for f, s in ((2, 0.15), (7, 0.75), (14, R)):
    ring.scale = (s, s, 1); ring.keyframe_insert('scale', frame=f)
for fc_ in ring.animation_data.action.fcurves if hasattr(ring.animation_data.action, 'fcurves') else []:
    for k in fc_.keyframe_points: k.interpolation = 'SINE'; k.easing = 'EASE_OUT'
key_fuel(fr, [(1, 0), (2, 1.2), (14, 1.2), (17, 0)])

# 4) edge wall: ring at R that keeps burning, flames rise along the circle then die
bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=0.06, major_segments=96, minor_segments=8, location=(0, 0, 0.08))
edge = bpy.context.active_object; edge.name = 'EdgeRing'
fe = fire_flow(edge, 0.0, 1.6, normal=0.2, up=2.6, dist=0.3)
key_fuel(fe, [(12, 0), (14, 1.3), (32, 1.0), (46, 0)])

# swirl around the centre: twists the column (sketch: spiralling tongues)
bpy.ops.object.effector_add(type='VORTEX', location=(0, 0, 0)); vx = bpy.context.active_object
vx.field.strength = 3.0; vx.field.use_max_distance = True; vx.field.distance_max = 0.7

# turbulence: flames lick and curl instead of rising in straight lines
bpy.ops.object.effector_add(type='TURBULENCE', location=(0, 0, 1.2)); tb = bpy.context.active_object
tb.field.strength = 5.0; tb.field.size = 0.3; tb.field.flow = 0.0

# domain: 2(R+0.3) wide, 3.2 tall, floor at z = 0
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 1.6)); dom = bpy.context.active_object
dom.name = 'Domain'; dom.scale = (2 * (R + 0.3), 2 * (R + 0.3), 3.2)
with bpy.context.temp_override(object=dom, active_object=dom, selected_objects=[dom]):
    bpy.ops.object.modifier_add(type='FLUID')
fm = dom.modifiers['Fluid']; fm.fluid_type = 'DOMAIN'
ds = fm.domain_settings
ds.domain_type = 'GAS'
ds.resolution_max = RES
ds.use_adaptive_domain = False
ds.cache_directory = os.path.join(OUT, 'cache')
ds.cache_type = 'ALL'
ds.cache_frame_start, ds.cache_frame_end = 1, FRAMES
ds.use_noise = False
ds.vorticity = 0.7
ds.flame_vorticity = 2.8          # twisting tongues
ds.burning_rate = 0.5           # slower burn = taller flames
ds.flame_smoke = 0.0              # the game adds its own smoke
ds.flame_max_temp = 2.4
ds.time_scale = 1.0               # a bit faster than real time: punchy
ds.use_collision_border_bottom = True

with bpy.context.temp_override(object=dom, active_object=dom, selected_objects=[dom]):
    bpy.ops.fluid.bake_all()

if DUMP:
    res = None
    for f in range(1, FRAMES + 1):
        sc.frame_set(f)
        dsev = dom.evaluated_get(bpy.context.evaluated_depsgraph_get()).modifiers['Fluid'].domain_settings
        res = list(dsev.domain_resolution)
        array.array('f', list(dsev.flame_grid)).tofile(open(os.path.join(OUT, 'f%04d.f32' % f), 'wb'))
    json.dump({'res': res, 'first': 1, 'last': FRAMES, 'size': [2 * (R + 0.3), 2 * (R + 0.3), 3.2], 'R': R},
              open(os.path.join(OUT, 'seq.json'), 'w'))

# --- look: flame attribute -> colour ramp (same ramp as fire_flipbook_build.py) ---
mat = bpy.data.materials.new('Fire'); mat.use_nodes = True; nt = mat.node_tree
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

# dark ground so the preview reads like the game (lit only by the fire)
bpy.ops.mesh.primitive_plane_add(size=14, location=(0, 0, 0)); gnd = bpy.context.active_object
gm = bpy.data.materials.new('Ground'); gm.use_nodes = True
gb = gm.node_tree.nodes['Principled BSDF']; gb.inputs['Base Color'].default_value = (0.09, 0.08, 0.075, 1); gb.inputs['Roughness'].default_value = 0.9
gnd.data.materials.append(gm)

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
sc.cycles.samples = 64
sc.cycles.use_denoising = True
sc.cycles.volume_step_rate = 0.5
sc.view_settings.view_transform = 'AgX'
sc.world = bpy.data.worlds.new('W'); sc.world.use_nodes = True
bg = sc.world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.012, 0.014, 0.022, 1); bg.inputs['Strength'].default_value = 1
sc.render.image_settings.file_format = 'PNG'

# camera: behind and above, like the game's over-the-shoulder view watching the hit
bpy.ops.object.camera_add(location=(0, -6.4, 1.9)); cam = bpy.context.active_object
cam.rotation_euler = (math.radians(80), 0, 0); cam.data.lens = 26
sc.camera = cam
sc.render.resolution_x, sc.render.resolution_y = 640, 400
for f in range(1, FRAMES + 1, STEP):
    sc.frame_set(f)
    sc.render.filepath = os.path.join(OUT, 'prev_%04d.png' % f)
    bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'dragonfall_impact.blend'))
print('DFIMPACT DONE', OUT)
