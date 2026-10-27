# Battlefield style test (designs/battlefield.md ขั้น 0): the same blast in 3 looks
#   A = realistic (grey-brown dust, black smoke) • B = cartoon (cel-shaded puffs) • C = mix (cartoon shapes, muted colours)
# Writes assets/fx/env/bf_style_a|b|c.fx.json — edit this file, not the JSON. Run: python tools/bf-style-gen.py
import json, math, os, random

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx', 'env')
DUR = 10.0


def blast():
    # same short blast core for every style, so only the aftermath differs
    return [
        {"id": "core", "t": "flash", "at": 0, "life": 0.08, "col": "$core", "size": "r*0.7"},
        {"id": "ball", "t": "mesh", "at": 0, "life": 0.5, "shape": "sphere", "mat": "fire", "mode": "ball", "disp": 0.3, "pos": [0, 0.7, 0],
         "scale": {"0": 0.2, "0.35": 0.8, "1": 1.0, "ease": "out", "x": "r*0.45"}, "heat": {"0": 0.35, "1": 0}, "dis": {"0": 0, "0.3": 0, "1": 0.95}},
        {"id": "sparks", "t": "emit", "at": 0, "life": 0.08, "burst": 26, "from": "hemisphere", "fr": 0.4, "dir": "out", "speed": [7, 15],
         "plife": [0.35, 0.8], "look": "streak", "size": [2.2, 3.2], "col": "$core", "c2": "$deep", "gravity": 8, "drag": 2},
        {"id": "light", "t": "light", "at": 0, "life": 0.4, "col": "$light", "int": 2.2, "dist": 18},
        {"id": "cam", "t": "screen", "at": 0, "life": 0.3, "shake": 5, "kick": 0.25},
    ]


def marks(scorch_op=None, dark=0.5):
    L = [{"id": "scorch", "t": "decal", "at": 0, "life": DUR, "kind": "scorch", "r": "r*1.0"}]
    if dark:
        L.append({"id": "soot", "t": "decal", "at": 0, "life": DUR, "kind": "dark", "r": "r*1.6", "op": dark})
    return L


def rocks(col, c2, n=22, big=(0.14, 0.34), life=(6, 7.5)):
    return [
        {"id": "rocks", "t": "emit", "at": 0, "life": 0.05, "burst": n, "att": "ground", "from": "disc", "fr": 0.8, "dir": "up", "spread": 1.1,
         "speed": [5, 11], "plife": list(life), "look": "model", "model": "rock_chunk", "mmat": "solid", "msize": list(big), "bounce": 0.25,
         "mspin": 420, "col": col, "c2": c2, "gravity": 16, "drag": 0.4},
        {"id": "clods", "t": "emit", "at": 0, "life": 0.05, "burst": int(n * 1.6), "att": "ground", "from": "disc", "fr": 0.6, "dir": "up", "spread": 0.9,
         "speed": [7, 15], "plife": list(life), "look": "model", "model": "rock_chunk", "mmat": "solid", "msize": [0.04, 0.1], "bounce": 0.15,
         "mspin": 700, "col": c2, "c2": c2, "gravity": 18, "drag": 0.6, "x": True},
    ]


# ---------- A: realistic ----------
def style_a():
    L = blast() + [
        {"id": "dustring", "t": "emit", "at": 0.02, "life": 0.06, "burst": 30, "att": "ground", "from": "disc", "fr": 1.0, "dir": "flat", "up": [0.2, 0.9],
         "speed": [7, 13], "plife": [2.2, 3.4], "look": "smoke", "fb": "tex/smoke_puff", "size": [11, 17], "col": "#b3a58e", "c2": "#8a8070",
         "gravity": -0.05, "drag": 2.6, "grow": 0.45},
        {"id": "column", "t": "emit", "at": 0.05, "life": 0.1, "burst": 14, "from": "sphere", "fr": 0.9, "dir": "up", "spread": 0.45,
         "speed": [1.6, 3.2], "plife": [3, 4.5], "look": "smoke", "fb": "tex/smoke_puff", "size": [15, 22], "col": "#4a423a", "c2": "#6a625a",
         "gravity": -0.2, "drag": 1.8, "grow": 0.45},
        {"id": "linger", "t": "emit", "at": 0.6, "life": 7.2, "rate": {"0": 5, "0.6": 3, "1": 1}, "att": "ground", "from": "disc", "fr": 1.5, "dir": "up",
         "spread": 0.3, "speed": [0.5, 1.1], "plife": [3.5, 5], "look": "smoke", "fb": "tex/smoke_puff", "size": [10, 15], "col": "#3a3430", "c2": "#77706a",
         "gravity": -0.3, "drag": 1.2, "grow": 0.45},
        {"id": "embers", "t": "emit", "at": 0.3, "life": 5, "rate": {"0": 10, "1": 0}, "att": "ground", "from": "disc", "fr": 1.4, "dir": "up", "spread": 0.6,
         "speed": [0.6, 1.8], "plife": [1.2, 2.4], "look": "ember", "size": [1.2, 2], "col": "#ffb060", "c2": "#ff5a1a", "gravity": -0.8, "x": True},
    ] + rocks("#5e554c", "#2e2925") + marks(dark=0.55)
    return {"v": 1, "desc": "แบบ A สมจริง (Battlefield): ฝุ่นเทาน้ำตาลพุ่งเป็นวง + ควันดำทึบลอยค้าง + เศษหินคม + รอยไหม้",
            "tags": ["env", "style", "battlefield"], "pal": "fire", "dur": DUR, "seed": 7, "params": {"r": {"def": 4, "desc": "รัศมีระเบิด (ม.)"}}, "layers": L}


# ---------- toon puffs (B and C): particles with the hard-edged 3-tone flipbook tex/smoke_toon (tools/bf-tex-gen.py) ----------
def puffs(lit, shade, dlit, dshade):
    T = {"look": "smoke", "fb": "tex/smoke_toon", "fin": 30, "curl": False}
    return [
        dict({"id": "ring", "t": "emit", "at": 0.02, "life": 0.06, "burst": 22, "att": "ground", "from": "disc", "fr": 0.9, "dir": "flat", "up": [0.2, 0.8],
              "speed": [7, 12], "plife": [1.6, 2.4], "size": [14, 20], "col": lit, "c2": shade, "gravity": -0.05, "drag": 3, "grow": 0.4}, **T),
        dict({"id": "column", "t": "emit", "at": 0.05, "life": 0.12, "burst": 12, "from": "sphere", "fr": 0.8, "dir": "up", "spread": 0.4,
              "speed": [1.6, 3.2], "plife": [2.6, 3.6], "size": [18, 26], "col": dlit, "c2": dshade, "gravity": -0.3, "drag": 2, "grow": 0.5}, **T),
        dict({"id": "linger", "t": "emit", "at": 0.8, "life": 7, "rate": {"0": 4, "0.6": 2.5, "1": 1}, "att": "ground", "from": "disc", "fr": 1.3, "dir": "up",
              "spread": 0.3, "speed": [0.6, 1.2], "plife": [2.6, 3.6], "size": [12, 18], "col": dlit, "c2": dshade, "gravity": -0.4, "drag": 1.4, "grow": 0.4}, **T),
    ]


def style_b():
    L = blast() + puffs("#f2e6d0", "#d8c8ae", "#b8aa96", "#9a8c7a") + [
        {"id": "embers", "t": "emit", "at": 0.3, "life": 4, "rate": {"0": 8, "1": 0}, "att": "ground", "from": "disc", "fr": 1.2, "dir": "up", "spread": 0.6,
         "speed": [0.8, 2], "plife": [1, 2], "look": "ember", "size": [1.6, 2.4], "col": "#ffd070", "c2": "#ff7a2a", "gravity": -0.8, "x": True},
    ] + rocks("#b08a60", "#6a4a2c", n=14, big=(0.2, 0.42)) + marks(dark=0)
    return {"v": 1, "desc": "แบบ B การ์ตูน: ควันก้อนกลมขอบคม แสงเงา 3 เฉด สีครีมอุ่น + เศษหินสีน้ำตาล + รอยไหม้",
            "tags": ["env", "style", "battlefield"], "pal": "earth", "dur": DUR, "seed": 7, "params": {"r": {"def": 4, "desc": "รัศมีระเบิด (ม.)"}}, "layers": L}


def style_c():
    L = blast() + puffs("#a89e90", "#8a8276", "#5e5750", "#4a4540") + [
        {"id": "dustring", "t": "emit", "at": 0.02, "life": 0.06, "burst": 20, "att": "ground", "from": "disc", "fr": 1.0, "dir": "flat", "up": [0.3, 1],
         "speed": [6, 11], "plife": [1.8, 2.8], "look": "smoke", "fb": "tex/smoke_puff", "size": [14, 22], "col": "#a8987f", "c2": "#7a7064",
         "gravity": -0.05, "drag": 2.6, "grow": 0.6, "x": True},
        {"id": "embers", "t": "emit", "at": 0.3, "life": 5, "rate": {"0": 9, "1": 0}, "att": "ground", "from": "disc", "fr": 1.3, "dir": "up", "spread": 0.6,
         "speed": [0.7, 1.8], "plife": [1.2, 2.2], "look": "ember", "size": [1.3, 2.1], "col": "#ffb868", "c2": "#ff5a1a", "gravity": -0.8, "x": True},
    ] + rocks("#6a6158", "#353029", n=18) + marks(dark=0.45)
    return {"v": 1, "desc": "แบบ C ผสม: ทรงควันการ์ตูน แต่สีหม่นเทา-ดำ + ฝุ่นจริงวงล่าง + เศษหินเทาเข้ม + รอยไหม้และเขม่า",
            "tags": ["env", "style", "battlefield"], "pal": "earth", "dur": DUR, "seed": 7, "params": {"r": {"def": 4, "desc": "รัศมีระเบิด (ม.)"}}, "layers": L}


for name, fn in (("bf_style_a", style_a), ("bf_style_b", style_b), ("bf_style_c", style_c)):
    with open(os.path.join(OUT, name + ".fx.json"), "w", encoding="utf8") as f:
        json.dump(fn(), f, ensure_ascii=False, indent=1)
    print("wrote", name)
