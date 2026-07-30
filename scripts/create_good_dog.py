import bpy
import math
import os
import random
from mathutils import Vector


ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(ROOT_DIR, "public", "models", "good-dog.glb")
POSTER_PATH = os.path.join(ROOT_DIR, "public", "images", "hotdog-poster.png")

random.seed(27)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def set_principled(material, color, roughness=0.5, metallic=0.0):
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "IOR" in bsdf.inputs:
        bsdf.inputs["IOR"].default_value = 1.46
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.08
    return material


def make_material(name, color, roughness=0.5, metallic=0.0):
    return set_principled(
        bpy.data.materials.new(name=name),
        color,
        roughness=roughness,
        metallic=metallic,
    )


def make_brioche_material(name):
    texture_path = os.path.join(
        ROOT_DIR, "public", "models", "brioche-albedo.png"
    )
    if not os.path.exists(texture_path):
        raise RuntimeError(
            "Missing brioche texture. Run scripts/create_brioche_texture.mjs first."
        )
    image = bpy.data.images.load(texture_path, check_existing=False)
    image.name = f"{name}_Albedo"
    image.colorspace_settings.name = "sRGB"

    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = 0.72
    if "IOR" in bsdf.inputs:
        bsdf.inputs["IOR"].default_value = 1.46
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Linear"
    material.node_tree.links.new(texture.outputs["Color"], bsdf.inputs["Base Color"])
    return material


def make_capsule(
    name,
    length,
    radius_y,
    radius_z,
    center=(0.0, 0.0, 0.0),
    cap_length=0.7,
    segments=40,
    cap_steps=10,
    straight_steps=32,
    bend=0.0,
    surface=0.0,
    materials=None,
    seed=1,
):
    rng = random.Random(seed)
    half_cylinder = max(0.05, length * 0.5 - cap_length)
    ring_specs = []

    for i in range(1, cap_steps + 1):
        a = -math.pi * 0.5 + (math.pi * 0.5) * (i / cap_steps)
        ring_specs.append(
            (-half_cylinder + cap_length * math.sin(a), math.cos(a))
        )

    for i in range(1, straight_steps):
        x = -half_cylinder + (2.0 * half_cylinder) * (i / straight_steps)
        ring_specs.append((x, 1.0))

    for i in range(0, cap_steps):
        a = (math.pi * 0.5) * (i / cap_steps)
        ring_specs.append(
            (half_cylinder + cap_length * math.sin(a), math.cos(a))
        )

    vertices = [(-length * 0.5 + center[0], center[1], center[2])]
    rings = []
    vertex_tones = [0.0]

    for ring_i, (x, radial) in enumerate(ring_specs):
        ring = []
        centerline_z = bend * (1.0 - min(1.0, (x / (length * 0.5)) ** 2))
        for segment in range(segments):
            angle = (segment / segments) * math.tau
            broad = (
                math.sin(x * 3.7 + angle * 2.0 + seed)
                + 0.55 * math.sin(x * 8.1 - angle * 3.0)
                + 0.25 * math.sin(x * 17.0 + angle * 7.0)
            )
            fine = rng.uniform(-0.32, 0.32)
            distortion = 1.0 + surface * (broad * 0.33 + fine)
            y = center[1] + radius_y * radial * distortion * math.cos(angle)
            z = (
                center[2]
                + centerline_z
                + radius_z * radial * distortion * math.sin(angle)
            )
            ring.append(len(vertices))
            vertices.append((x + center[0], y, z))
            vertex_tones.append(broad)
        rings.append(ring)

    right_pole = len(vertices)
    vertices.append((length * 0.5 + center[0], center[1], center[2]))
    vertex_tones.append(0.0)

    faces = []
    face_tones = []

    first = rings[0]
    for j in range(segments):
        faces.append((0, first[(j + 1) % segments], first[j]))
        face_tones.append(0.0)

    for ring_i in range(len(rings) - 1):
        current = rings[ring_i]
        following = rings[ring_i + 1]
        for j in range(segments):
            faces.append(
                (
                    current[j],
                    current[(j + 1) % segments],
                    following[(j + 1) % segments],
                    following[j],
                )
            )
            x_norm = ring_i / max(1, len(rings) - 2)
            tone = (
                math.sin(x_norm * 17.0 + j * 0.31 + seed) * 0.65
                + math.sin(x_norm * 39.0 - j * 0.17) * 0.35
            )
            face_tones.append(tone)

    last = rings[-1]
    for j in range(segments):
        faces.append((last[j], last[(j + 1) % segments], right_pole))
        face_tones.append(0.0)

    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()

    uv_layer = mesh.uv_layers.new(name="UVMap")
    for polygon in mesh.polygons:
        loop_values = []
        for loop_index in polygon.loop_indices:
            vertex = mesh.vertices[mesh.loops[loop_index].vertex_index].co
            u = max(
                0.0,
                min(
                    1.0,
                    (vertex.x - center[0] + length * 0.5) / max(length, 0.001),
                ),
            )
            relative_y = (vertex.y - center[1]) / max(radius_y, 0.001)
            relative_z = (vertex.z - center[2]) / max(radius_z, 0.001)
            if abs(relative_y) + abs(relative_z) < 0.0001:
                v = 0.5
            else:
                v = (math.atan2(relative_z, relative_y) / math.tau) % 1.0
            loop_values.append([loop_index, u, v])
        v_values = [item[2] for item in loop_values]
        if v_values and max(v_values) - min(v_values) > 0.5:
            for item in loop_values:
                if item[2] < 0.5:
                    item[2] += 1.0
        for loop_index, u, v in loop_values:
            uv_layer.data[loop_index].uv = (u, v)

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    if materials:
        for material in materials:
            obj.data.materials.append(material)
        for polygon, tone in zip(mesh.polygons, face_tones):
            if len(materials) == 1:
                polygon.material_index = 0
            elif tone > 0.56:
                polygon.material_index = 1
            elif tone < -0.63:
                polygon.material_index = min(2, len(materials) - 1)
            else:
                polygon.material_index = 0

    for polygon in mesh.polygons:
        polygon.use_smooth = True

    bevel = obj.modifiers.new(name="Soft micro bevel", type="BEVEL")
    bevel.width = 0.018
    bevel.segments = 2
    return obj


def make_curve(name, points, material, bevel_depth=0.06, bevel_resolution=4):
    curve = bpy.data.curves.new(name=f"{name}_Curve", type="CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 2
    curve.bevel_depth = bevel_depth
    curve.bevel_resolution = bevel_resolution
    curve.resolution_u = 2
    curve.use_fill_caps = True
    spline = curve.splines.new("NURBS")
    spline.points.add(len(points) - 1)
    for point, co in zip(spline.points, points):
        point.co = (*co, 1.0)
    spline.order_u = min(4, len(points))
    spline.use_endpoint_u = True
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj = bpy.context.object
    obj.name = name
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def make_topping_piece(name, location, scale, rotation, material, kind):
    if kind == "onion":
        bpy.ops.mesh.primitive_ico_sphere_add(
            subdivisions=1, radius=1.0, location=location
        )
    else:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.rotation_euler = rotation
    obj.data.materials.append(material)
    bevel = obj.modifiers.new(name="Rounded edges", type="BEVEL")
    bevel.width = 0.12
    bevel.segments = 2
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def parent_to(obj, parent):
    obj.parent = parent
    return obj


def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def build_scene():
    clear_scene()

    root = bpy.data.objects.new("GOOD_DOG_ROOT", None)
    bpy.context.collection.objects.link(root)
    root.rotation_euler[1] = math.radians(-5.0)

    bun = make_brioche_material("Brioche")
    sausage_classic_mat = make_material(
        "Link_Classic", (0.55, 0.075, 0.045), 0.34
    )
    sausage_smoked_mat = make_material(
        "Link_Smoked", (0.31, 0.040, 0.026), 0.42
    )
    sausage_plant_mat = make_material(
        "Link_Plant", (0.24, 0.16, 0.075), 0.52
    )
    ketchup_mat = make_material("Ketchup", (0.72, 0.018, 0.012), 0.18)
    mustard_mat = make_material("Mustard", (0.91, 0.50, 0.025), 0.25)
    grill_mat = make_material("Grill_Mark", (0.095, 0.018, 0.010), 0.58)
    onion_mat = make_material("Crispy_Onion", (0.78, 0.42, 0.11), 0.7)
    herb_mat = make_material("Fresh_Herb", (0.10, 0.28, 0.075), 0.64)

    rear_bun = make_capsule(
        "Bun_Rear",
        7.25,
        0.62,
        0.72,
        center=(0.0, 0.46, -0.11),
        cap_length=0.82,
        bend=0.05,
        surface=0.034,
        materials=[bun],
        seed=5,
    )
    rear_bun.rotation_euler[0] = math.radians(-7)
    parent_to(rear_bun, root)

    front_bun = make_capsule(
        "Bun_Front",
        7.25,
        0.64,
        0.72,
        center=(0.0, -0.44, -0.19),
        cap_length=0.82,
        bend=0.04,
        surface=0.038,
        materials=[bun],
        seed=11,
    )
    front_bun.rotation_euler[0] = math.radians(8)
    parent_to(front_bun, root)

    link_specs = [
        (
            "Sausage_Classic",
            sausage_classic_mat,
            0.035,
            23,
        ),
        (
            "Sausage_Smoked",
            sausage_smoked_mat,
            0.018,
            29,
        ),
        (
            "Sausage_Plant",
            sausage_plant_mat,
            0.008,
            31,
        ),
    ]
    sausages = []
    for name, material, bend, seed in link_specs:
        obj = make_capsule(
            name,
            6.45,
            0.43,
            0.48,
            center=(0.0, -0.01, 0.52),
            cap_length=0.5,
            bend=bend,
            surface=0.012,
            materials=[material],
            seed=seed,
        )
        obj["good_dog_category"] = "link"
        parent_to(obj, root)
        sausages.append(obj)

    for i, x in enumerate((-2.10, -1.05, 0.05, 1.15, 2.20)):
        points = []
        for k in range(7):
            t = k / 6
            z = 0.35 + t * 0.48
            points.append((x + (t - 0.5) * 0.18, -0.435, z))
        mark = make_curve(
            f"Grill_Mark_{i + 1:02d}", points, grill_mat, bevel_depth=0.026
        )
        mark["good_dog_category"] = "grill"
        parent_to(mark, root)

    ketchup_points = []
    mustard_points = []
    steps = 70
    for i in range(steps):
        t = i / (steps - 1)
        x = -2.85 + 5.70 * t
        ketchup_points.append(
            (x, -0.425, 0.86 + 0.17 * math.sin(t * math.tau * 4.25))
        )
        mustard_points.append(
            (x, -0.455, 0.79 + 0.15 * math.sin(t * math.tau * 4.25 + 0.72))
        )

    ketchup = make_curve(
        "Sauce_Ketchup", ketchup_points, ketchup_mat, bevel_depth=0.073
    )
    ketchup["good_dog_category"] = "sauce"
    parent_to(ketchup, root)

    mustard = make_curve(
        "Sauce_Mustard", mustard_points, mustard_mat, bevel_depth=0.068
    )
    mustard["good_dog_category"] = "sauce"
    parent_to(mustard, root)

    toppings = []
    for i in range(13):
        x = -2.65 + i * 0.43 + random.uniform(-0.09, 0.09)
        z = 0.91 + 0.14 * math.sin(i * 1.7)
        y = -0.47 + random.uniform(-0.025, 0.025)
        piece = make_topping_piece(
            f"Topping_Onion_{i + 1:02d}",
            (x, y, z),
            (
                random.uniform(0.10, 0.17),
                random.uniform(0.045, 0.075),
                random.uniform(0.055, 0.10),
            ),
            (
                random.uniform(-0.6, 0.6),
                random.uniform(-0.6, 0.6),
                random.uniform(-1.2, 1.2),
            ),
            onion_mat,
            "onion",
        )
        piece["good_dog_category"] = "onion"
        parent_to(piece, root)
        toppings.append(piece)

    for i in range(11):
        x = -2.55 + i * 0.50 + random.uniform(-0.11, 0.11)
        z = 0.88 + 0.12 * math.sin(i * 1.33 + 0.4)
        y = -0.49 + random.uniform(-0.03, 0.03)
        piece = make_topping_piece(
            f"Topping_Herb_{i + 1:02d}",
            (x, y, z),
            (
                random.uniform(0.16, 0.26),
                random.uniform(0.035, 0.055),
                random.uniform(0.035, 0.06),
            ),
            (
                random.uniform(-0.5, 0.5),
                random.uniform(-0.5, 0.5),
                random.uniform(-1.2, 1.2),
            ),
            herb_mat,
            "herb",
        )
        piece["good_dog_category"] = "herb"
        parent_to(piece, root)
        toppings.append(piece)

    for obj in sausages[1:]:
        obj.hide_render = True
    mustard.hide_render = True
    for piece in toppings:
        piece.hide_render = True

    bpy.ops.object.camera_add(location=(0.0, -11.7, 1.85))
    camera = bpy.context.object
    camera.name = "Poster_Camera"
    camera.data.lens = 58
    look_at(camera, (0.0, 0.0, 0.22))
    bpy.context.scene.camera = camera

    def add_area(name, location, energy, size, color):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        light.data.color = color
        look_at(light, (0.0, 0.0, 0.0))
        return light

    add_area("Key", (-4.0, -5.0, 6.5), 1200, 5.0, (1.0, 0.62, 0.34))
    add_area("Fill", (4.5, -3.0, 3.3), 760, 5.5, (1.0, 0.88, 0.70))
    add_area("Rim", (0.0, 4.0, 4.8), 980, 4.0, (1.0, 0.43, 0.24))

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1100
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = True
    scene.render.filepath = POSTER_PATH
    scene.render.image_settings.color_depth = "8"
    scene.world.color = (0.035, 0.024, 0.018)

    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass

    os.makedirs(os.path.dirname(POSTER_PATH), exist_ok=True)
    bpy.ops.render.render(write_still=True)

    for obj in sausages:
        obj.hide_render = False
        obj.hide_set(False)
    mustard.hide_render = False
    mustard.hide_set(False)
    for piece in toppings:
        piece.hide_render = False
        piece.hide_set(False)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=MODEL_PATH,
        export_format="GLB",
        export_apply=True,
        export_cameras=False,
        export_lights=False,
        export_extras=True,
        export_yup=True,
    )

    print(f"GOOD_DOG_MODEL={MODEL_PATH}")
    print(f"GOOD_DOG_POSTER={POSTER_PATH}")


if __name__ == "__main__":
    build_scene()
