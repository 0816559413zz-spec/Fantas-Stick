import bpy, math
from mathutils import Matrix, Vector, Quaternion
V = Vector
rig = bpy.data.objects["gob_rig"]
sc = bpy.context.scene
sc.render.fps = 30

# remove old actions / tracks
if rig.animation_data:
    for t in list(rig.animation_data.nla_tracks):
        rig.animation_data.nla_tracks.remove(t)
    rig.animation_data.action = None
for a in list(bpy.data.actions):
    if a.name in ("idle", "walk", "run", "attack", "hit"):
        bpy.data.actions.remove(a)
ad = rig.animation_data_create()

AX = {"x": V((1, 0, 0)), "y": V((0, 1, 0)), "z": V((0, 0, 1))}

def qlocal(bname, rots):
    """rots: list of (axis, degrees) in armature space, applied in order."""
    R = Quaternion()
    for ax, deg in rots:
        R = Quaternion(AX[ax], math.radians(deg)) @ R
    M = rig.data.bones[bname].matrix_local.to_3x3()
    q = (M.inverted() @ R.to_matrix() @ M).to_quaternion()
    return q

def loclocal(bname, vec):
    M = rig.data.bones[bname].matrix_local.to_3x3()
    return M.inverted() @ V(vec)

S = math.sin; C = math.cos

def base():
    """hunched goblin base pose: dict bone -> list of (axis, deg); plus 'loc'"""
    p = {
        "spine": [("x", 8)], "chest": [("x", 8)], "head": [("x", -14)],
        "thigh_L": [("x", -14), ("z", 6)], "thigh_R": [("x", -14), ("z", -6)],
        "shin_L": [("x", 24)], "shin_R": [("x", 24)],
        "foot_L": [("x", -10)], "foot_R": [("x", -10)],
        "upper_arm_L": [("x", -6), ("y", -8)], "upper_arm_R": [("x", -10), ("y", 8)],
        "forearm_L": [("x", -22)], "forearm_R": [("x", -50)],
        "hand_L": [], "hand_R": [("x", 30)],
        "ear_L": [], "ear_R": [], "hips": [], "root": [],
    }
    return p

def add(p, b, ax, deg):
    p.setdefault(b, []).append((ax, deg))

def key(p, f, loc=None):
    for b, rots in p.items():
        pb = rig.pose.bones[b]
        pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = qlocal(b, rots)
        pb.keyframe_insert("rotation_quaternion", frame=f)
    pb = rig.pose.bones["hips"]
    pb.location = loclocal("hips", loc or (0, 0, 0))
    pb.keyframe_insert("location", frame=f)

def new_action(name):
    for b in rig.pose.bones:
        b.rotation_mode = 'QUATERNION'
        b.rotation_quaternion = Quaternion(); b.location = V()
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    ad.action = act
    return act

def push(act, n0, n1):
    ad.action = None
    tr = ad.nla_tracks.new(); tr.name = act.name
    st = tr.strips.new(act.name, n0, act)
    st.name = act.name
    tr.mute = False

made = {}
# ---------------- idle (60 f, loop) ----------------
act = new_action("idle"); L = 60
for f in range(0, L + 1, 3):
    ph = 2 * math.pi * f / L
    p = base()
    add(p, "spine", "x", 2.5 * S(ph))
    add(p, "chest", "x", 2 * S(ph + 0.4))
    add(p, "head", "z", 14 * S(ph))
    add(p, "head", "x", 3 * S(2 * ph))
    add(p, "upper_arm_L", "x", 3 * S(ph + 1))
    add(p, "upper_arm_R", "x", 3 * S(ph + 1.4))
    tw = max(0.0, S(4 * ph - 2.5)) ** 6       # quick ear twitches
    add(p, "ear_L", "x", -14 * tw); add(p, "ear_R", "x", -10 * max(0.0, S(4 * ph - 1.0)) ** 6)
    key(p, f, (0, 0, -0.012 + 0.008 * S(ph)))
push(act, 0, L); made["idle"] = L

# ---------------- walk (24 f, loop) ----------------
act = new_action("walk"); L = 24
for f in range(0, L + 1, 2):
    ph = 2 * math.pi * f / L
    p = base()
    sw = 28
    add(p, "thigh_L", "x", -sw * S(ph)); add(p, "thigh_R", "x", sw * S(ph))
    add(p, "shin_L", "x", 35 * max(0.0, C(ph))); add(p, "shin_R", "x", 35 * max(0.0, -C(ph)))
    add(p, "foot_L", "x", 12 * S(ph)); add(p, "foot_R", "x", -12 * S(ph))
    add(p, "hips", "z", 7 * S(ph)); add(p, "spine", "z", -9 * S(ph))
    add(p, "spine", "x", 6)
    add(p, "upper_arm_L", "x", 26 * S(ph)); add(p, "upper_arm_R", "x", -14 * S(ph))
    add(p, "forearm_L", "x", -10 * max(0.0, -S(ph)))
    add(p, "head", "x", 3 * C(2 * ph))
    add(p, "ear_L", "y", 6 * C(2 * ph)); add(p, "ear_R", "y", -6 * C(2 * ph))
    key(p, f, (0, 0, -0.02 + 0.03 * abs(C(ph))))
push(act, 0, L); made["walk"] = L

# ---------------- run (12 f, loop) ----------------
act = new_action("run"); L = 12
for f in range(0, L + 1, 1):
    ph = 2 * math.pi * f / L
    p = base()
    sw = 50
    add(p, "spine", "x", 22); add(p, "chest", "x", 6); add(p, "head", "x", -24)
    add(p, "thigh_L", "x", -sw * S(ph) - 10); add(p, "thigh_R", "x", sw * S(ph) - 10)
    add(p, "shin_L", "x", 25 + 65 * max(0.0, C(ph))); add(p, "shin_R", "x", 25 + 65 * max(0.0, -C(ph)))
    add(p, "foot_L", "x", 20 * S(ph)); add(p, "foot_R", "x", -20 * S(ph))
    add(p, "hips", "z", 10 * S(ph)); add(p, "spine", "z", -12 * S(ph))
    add(p, "upper_arm_L", "x", 45 * S(ph) - 10); add(p, "upper_arm_R", "x", -30 * S(ph) - 25)
    add(p, "upper_arm_L", "y", -14); add(p, "upper_arm_R", "y", 10)
    add(p, "forearm_L", "x", -40); add(p, "forearm_R", "x", -15)
    add(p, "ear_L", "x", 16 + 10 * C(2 * ph)); add(p, "ear_R", "x", 16 + 10 * C(2 * ph))
    key(p, f, (0, -0.05, -0.03 + 0.07 * abs(C(ph))))
push(act, 0, L); made["run"] = L

# ---------------- attack (16 f, once) : wind-up and stab with the dagger ----------------
act = new_action("attack")
def atk(f, wind, stab):
    p = base()
    # overhead stab: raise the dagger above the head, then drive it down in front
    add(p, "spine", "z", -15 * wind + 18 * stab); add(p, "spine", "x", -10 * wind + 22 * stab)
    add(p, "head", "x", 6 * wind - 12 * stab)
    add(p, "upper_arm_R", "x", -150 * wind - 55 * stab); add(p, "upper_arm_R", "y", 15 * wind)
    add(p, "forearm_R", "x", 85 * wind + 35 * stab)
    add(p, "hand_R", "x", 70 * wind + 25 * stab)
    add(p, "upper_arm_L", "x", -30 * wind + 25 * stab); add(p, "upper_arm_L", "y", -20 * wind)
    add(p, "thigh_L", "x", -25 * stab); add(p, "shin_L", "x", 10 * stab)
    add(p, "thigh_R", "x", 15 * stab)
    add(p, "ear_L", "x", 20 * wind - 15 * stab); add(p, "ear_R", "x", 20 * wind - 15 * stab)
    key(p, f, (0, -0.16 * stab + 0.05 * wind, -0.03 * wind - 0.05 * stab))
for f, w, s in ((0, 0, 0), (4, 0.8, 0), (6, 1, 0), (8, 0.2, 0.9), (9, 0, 1), (12, 0, 0.6), (16, 0, 0)):
    atk(f, w, s)
push(act, 0, 16); made["attack"] = 16

# ---------------- hit (10 f, once) : recoil ----------------
act = new_action("hit")
def hit(f, k):
    p = base()
    add(p, "spine", "x", -18 * k); add(p, "chest", "x", -10 * k); add(p, "head", "x", -22 * k); add(p, "head", "z", 10 * k)
    add(p, "upper_arm_L", "y", -35 * k); add(p, "upper_arm_R", "y", 35 * k)
    add(p, "upper_arm_L", "x", -20 * k); add(p, "upper_arm_R", "x", -20 * k)
    add(p, "ear_L", "x", 30 * k); add(p, "ear_R", "x", 30 * k)
    key(p, f, (0, 0.1 * k, -0.02 * k))
for f, k in ((0, 0), (2, 1), (4, 0.9), (10, 0)):
    hit(f, k)
push(act, 0, 10); made["hit"] = 10

# rest pose shown when nothing plays
for b in rig.pose.bones:
    b.rotation_quaternion = Quaternion(); b.location = V()
result = {"made": made, "tracks": [t.name for t in ad.nla_tracks]}
