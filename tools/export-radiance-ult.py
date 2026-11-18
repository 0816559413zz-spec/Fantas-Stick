"""Export the reviewed Radiance Blender scenes as game meshes.

blender -b -P tools/export-radiance-ult.py -- shots/radiance_alabaster_v8_neon assets/vfx
"""
import sys
from math import exp, copysign
from pathlib import Path

import bpy
from mathutils import Vector


def export(path):
    bpy.ops.export_scene.gltf(
        filepath=str(path), export_format='GLB', use_selection=True,
        export_attributes=True, export_animations=False,
        export_normals=True, export_texcoords=False,
    )


def mesh_object(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    if obj.type == 'CURVE':
        obj.data.bevel_resolution = 1
        obj.data.resolution_u = min(obj.data.resolution_u, 9)
        bpy.ops.object.convert(target='MESH')
        obj = bpy.context.object
    return obj


def select(obj):
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def adopt(obj, parent):
    matrix = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = matrix


def merge(name, parts, parent):
    if not parts:
        return
    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts:
        select(obj)
    if len(parts) > 1:
        bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name
    if obj.parent != parent:
        adopt(obj, parent)
    return obj


def empty(name, parent, location):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    return obj


def attribute(mesh, target, values):
    attr = mesh.attributes.new(target, 'FLOAT', 'POINT')
    attr.data.foreach_set('value', values)


def sculpt_torso(mesh):
    # The source ends at the waist. Extend the lowest rings into a shallow hip taper.
    for vertex in mesh.vertices:
        x, y, z = vertex.co
        side = abs(x)
        if side > .82 or z > 3.25:
            continue
        hip = min(1, max(0, (2.42 - z) / .45))
        vertex.co.z -= .48 * hip ** 1.25
        vertex.co.x += copysign(.10 * hip, x) if side > .12 else x * .55 * hip
        if y < -.015:
            chest = .102 * exp(-((side - .34) / .24) ** 2 - ((z - 2.94) / .19) ** 2)
            abdomen = .065 * exp(-((side - .145) / .118) ** 2 - ((z - 2.40) / .32) ** 2)
            ribs = .041 * exp(-((side - .40) / .14) ** 2 - ((z - 2.58) / .26) ** 2)
            vertex.co.y -= (chest + abdomen + ribs) * min(1, -y / .20)


def sculpt_arms(mesh):
    # Sculpt around the same joint centers used by LIGHT_FORM_ARMS in the game.
    arms = (
        tuple(map(Vector, ((.83, .007, 2.905), (1.67, .041, 2.274), (2.79, -.34, 2.62)))),
        tuple(map(Vector, ((-.827, .008, 2.878), (-1.62, .035, 2.15), (-2.69, -.435, 2.21)))),
    )
    profiles = []
    for vertex in mesh.vertices:
        x = vertex.co.x
        shoulder, elbow, wrist = arms[0 if x > 0 else 1]
        side = abs(x)
        start, joint, end = map(abs, (shoulder.x, elbow.x, wrist.x))
        if side < .67 or side >= end:
            profiles.append(0)
            continue

        if side < joint:
            t = (side - start) / (joint - start)
            center = shoulder.lerp(elbow, t)
            cap = exp(-((t - .10) / .34) ** 2)
            muscle = exp(-((t - .46) / .34) ** 2)
            width = .16 + .23 * cap + .25 * muscle
        else:
            t = (side - joint) / (end - joint)
            center = elbow.lerp(wrist, t)
            muscle = exp(-((t - .27) / .39) ** 2)
            rise = min(1, t / .23)
            width = (.18 + .29 * muscle * rise * rise * (3 - 2 * rise)) * (1 - t ** 2)

        # Feather the shoulder into the chest. Keep the wrist dock and the palms intact.
        root = min(1, max(0, (side - .67) / .23))
        weight = root * root * (3 - 2 * root)
        radius = vertex.co - center
        radius.x = 0
        radius.y *= .93
        vertex.co += radius * width * weight
        profiles.append(min(1, weight * width / .40))
    attribute(mesh, '_arm_sculpt', profiles)


def flatten_materials():
    # Runtime recreates Blender's time-dependent emission and transparency.
    # Simple material slots carry the other hues and opacity into glTF.
    for mat in bpy.data.materials:
        if not mat.use_nodes:
            continue
        shader = next((node for node in mat.node_tree.nodes if node.type == 'BSDF_PRINCIPLED'), None)
        if shader is None:
            mat.node_tree.nodes.clear()
            shader = mat.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
            output = mat.node_tree.nodes.new('ShaderNodeOutputMaterial')
            mat.node_tree.links.new(shader.outputs[0], output.inputs['Surface'])
            shader.inputs['Emission Color'].default_value = (1, .59, .15, 1)
            shader.inputs['Emission Strength'].default_value = 1
        for input_name in ('Base Color', 'Emission Color', 'Emission Strength', 'Alpha', 'Transmission Weight'):
            for link in list(shader.inputs[input_name].links):
                mat.node_tree.links.remove(link)
        shader.inputs['Base Color'].default_value = mat.diffuse_color
        shader.inputs['Transmission Weight'].default_value = 0
        if mat.name == 'Alabaster':
            out = next(node for node in mat.node_tree.nodes if node.type == 'OUTPUT_MATERIAL')
            mat.node_tree.links.new(shader.outputs[0], out.inputs['Surface'])


def sovereign(source, target):
    bpy.ops.wm.open_mainfile(filepath=str(source))
    root = bpy.data.objects['Sovereign hover']
    for obj in (root, *root.children_recursive):
        obj.animation_data_clear()
    root.location.z = 0
    bpy.context.view_layer.update()
    halo = empty('SolarHalo', root, (0, .96, 3.98))
    head = empty('SovereignHead', root, (0, 0, 3.54))
    wing_pivots = {
        'Upper left': empty('SovereignWingLeft', root, (-.79, .44, 3.17)),
        'Upper right': empty('SovereignWingRight', root, (.79, .44, 3.17)),
        'Lower left': empty('SovereignWingLower', root, (-.75, .56, 2.55)),
    }
    wing_parts = {key: [] for key in wing_pivots}
    bpy.context.view_layer.update()
    static, face, orbit, current, echo = [], [], [], [], []
    for obj in list(root.children):
        label = obj.name
        if label.startswith('Detached eclipse crystal'):
            bpy.data.objects.remove(obj, do_unlink=True)
        elif label == 'Connected alabaster sculpt':
            obj.name = 'SovereignBody'
            mesh_object(obj)
            simplify = obj.modifiers.new('Game triangle budget', 'DECIMATE')
            simplify.ratio = .063
            bpy.ops.object.modifier_apply(modifier=simplify.name)
            geo = obj.data
            sculpt_torso(geo)
            sculpt_arms(geo)
            geo.update()
            for key in ('palm_light', 'palm_crease'):
                geo.attributes[key].name = '_' + key
            fade = [min(1, max(0, (v.co.z - 1.51) / .52)) for v in geo.vertices]
            attribute(geo, '_waist_fade', fade)
            attribute(geo, '_body_height', [v.co.z for v in geo.vertices])
        elif label.startswith(('Floating front X', 'Rear X', 'Shoulder current wake', 'Waist current wake')):
            obj.location = (0, 0, 0)
            # Each authored current uses six vertices around its centreline.
            vertices = list(obj.data.vertices)
            thickness = 2.0 if 'wake' in label else 2.65
            for start in range(0, len(vertices), 6):
                ring = vertices[start:start + 6]
                center = sum((v.co for v in ring), Vector()) / len(ring)
                for vertex in ring:
                    vertex.co = center + (vertex.co - center) * thickness
                    if not label.startswith('Rear X'):
                        vertex.co.y -= .102
            obj.data.attributes['flow_distance'].name = '_flow_distance'
            (echo if 'wake' in label else current).append(obj)
        elif label == 'Heart of light':
            obj.name = 'SovereignHeart'
        elif label.startswith(('Carved face of light', 'Swept alabaster crest', 'Secondary carved temple crest',
                               'Narrow cheek recess', 'Light within the cheek', 'Broken crown', 'Rising crown prism')):
            face.append(mesh_object(obj))
        elif label.startswith(('Rear solar orbit', 'Crescent light', 'Faint underside')):
            orbit.append(mesh_object(obj))
        elif label.startswith(tuple(wing_pivots)):
            key = next(name for name in wing_pivots if label.startswith(name))
            wing_parts[key].append(mesh_object(obj))
        elif label.startswith('Broken solar fragment'):
            middle = sum((v.co for v in obj.data.vertices), Vector()) / len(obj.data.vertices)
            key = 'Upper right' if middle.x > 0 else 'Upper left' if middle.z >= 2.6 else 'Lower left'
            wing_parts[key].append(mesh_object(obj))
        elif label.startswith('Wrist magic circle'):
            obj.name = 'WristPositive' if obj.location.x > 0 else 'WristNegative'
            for part in list(obj.children):
                if part.type != 'EMPTY':
                    mesh_object(part)
                    continue
                part.name = ('WristMarks' if part.name.startswith('Orbiting') else 'WristPulse') + obj.name[5:]
                part.rotation_euler.z = 0
                meshes = [mesh_object(o) for o in list(part.children) if o.type in ('MESH', 'CURVE')]
                merge(part.name + 'Geometry', meshes, part)
                for lamp in [o for o in part.children if o.type == 'LIGHT']:
                    bpy.data.objects.remove(lamp, do_unlink=True)
        elif obj.type in ('MESH', 'CURVE'):
            static.append(mesh_object(obj))

    merge('SovereignStone', static, root)
    merge('SovereignHeadGeometry', face, head)
    for key, pivot in wing_pivots.items():
        merge(pivot.name + 'Blades', wing_parts[key], pivot)
    merge('SolarHaloGeometry', orbit, halo)
    merge('SovereignCross', current, root)
    merge('SovereignCrossWake', echo, root)
    root.name = 'SovereignHover'
    root.location.z = -1.86
    flatten_materials()
    bpy.ops.object.select_all(action='DESELECT')
    for obj in (root, *root.children_recursive):
        select(obj)
    export(target)


def crystal(source, target):
    bpy.ops.wm.open_mainfile(filepath=str(source))
    root = bpy.data.objects['Crystal review pose']
    root.name = 'SovereignCrystal'
    root.location = (0, 0, 0)
    root.rotation_euler = (0, 0, 0)
    root.scale = (1, 1, 1)
    bpy.data.objects['Eight-face clear crystal'].name = 'SovereignCrystalShell'
    bpy.data.objects['Yellow suspended core'].name = 'SovereignCrystalCore'
    flatten_materials()
    bpy.ops.object.select_all(action='DESELECT')
    for obj in (root, *root.children):
        select(obj)
    export(target)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:]
    source, target = map(lambda value: Path(value).resolve(), args[:2])
    sovereign(source / 'radiant_sovereign_alabaster.blend', target / 'radiant_sovereign.glb')
    if '--sovereign-only' not in args:
        crystal(source / 'double_point_crystal.blend', target / 'radiant_sovereign_crystal.glb')
