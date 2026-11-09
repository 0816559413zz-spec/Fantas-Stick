#!/usr/bin/env python3
# Wind rework (designs/wind.md): Tailwind = wind lane, 30 m long (600) x 6 m wide (120), 5 s. +z = aim direction, starts at the caster.
import json, os
R = os.path.join(os.path.dirname(__file__), '..')
LEN, W = 30, 9
def ribbon(i, x, w):
    return {"id": i, "k": "ribbon", "path": [[x, 0, 0], [x, 0, LEN / 2], [x, 0, LEN]], "w": w, "seg": 40}
def mesh(name, desc, mat, parts):
    with open(os.path.join(R, 'assets/fx/mesh', name + '.mesh.json'), 'w', encoding='utf-8', newline='\n') as o:
        json.dump({"v": 1, "desc": desc, "mat": mat, "pal": "wind", "tags": ["wind"], "parts": parts}, o, ensure_ascii=False, indent=1)
mesh('wind_tail_lane', "Tailwind: แผ่นร่องลมแบนบนพื้น ยาว 30 ม. กว้าง 9 ม.", "glow", [ribbon("lane", 0, W)])
mesh('wind_tail_edge', "Tailwind: เส้นขอบร่องลมสองข้าง", "glow", [ribbon("l", -W / 2, 0.5), ribbon("r", W / 2, 0.5)])
def line(i, a, b):
    return {"id": i, "k": "ribbon", "path": [a, [(a[0] + b[0]) / 2, 0, (a[2] + b[2]) / 2], b], "w": 0.28, "seg": 4}
parts = []
for s, n in ((-1, "l"), (1, "r")):
    parts.append(ribbon("in" + n, s * (W / 2 - 0.9), 0.1))
    z = 2.0
    k = 0
    while z < LEN - 0.5:
        parts.append(line("b%s%d" % (n, k), [s * W / 2, 0, z], [s * (W / 2 - 1.1), 0, z - 1.3]))
        z += 2.5
        k += 1
mesh('wind_tail_deco', "Tailwind: ลายลูกศรและเส้นในตามขอบร่องลม", "glow", parts)
mesh('wind_tail_gust', "Tailwind: เส้นลมยาวลอยเหนือร่อง", "glow", [{"id": "g", "k": "ribbon", "path": [[0, 0, 0], [0.3, 0.15, 3], [-0.2, 0.35, 6], [0.25, 0.15, 9], [0, 0, 12]], "w": 0.3, "taper": 0.6, "seg": 24}, {"id": "gw", "k": "ribbon", "wall": True, "path": [[0, 0, 0], [0.3, 0.15, 3], [-0.2, 0.35, 6], [0.25, 0.15, 9], [0, 0, 12]], "w": 0.22, "taper": 0.6, "seg": 24}])
L = [
 {"id": "lane", "t": "mesh", "at": 0, "life": 5, "att": "ground", "pos": [0, 0.08, 0], "fade": 0, "shape": "model", "model": "wind_tail_lane", "mat": "solid", "col": "#2fd08f", "scale": {"0": [1, 1, 0.01], "0.075": 1}, "op": {"0": 0, "0.04": 0.17, "0.92": 0.17, "1": 0}},
 {"id": "edge", "t": "mesh", "at": 0, "life": 5, "att": "ground", "pos": [0, 0.1, 0], "fade": 0, "shape": "model", "model": "wind_tail_edge", "mat": "solid", "col": "#07845a", "scale": {"0": [1, 1, 0.01], "0.075": 1}, "op": {"0": 0, "0.04": 1, "0.92": 1, "1": 0}},
 {"id": "open", "t": "emit", "at": 0, "life": 0.25, "att": "ground", "pos": [0, 0.5, 1], "burst": 0, "rate": 60, "from": "disc", "fr": 4, "dir": "aim", "spread": 0.12, "speed": [18, 30], "plife": [0.5, 0.9], "look": "streak", "size": [3, 5], "col": "#e8fff2", "c2": "#14ff8c", "gravity": 0, "drag": 0.4, "curl": False},
]
for i in range(6):
    L.append({"id": "st%d" % i, "t": "emit", "at": 0.05, "life": 4.7, "att": "ground", "pos": [0, 0.55, 2.5 + i * 5], "burst": 0, "rate": 7, "from": "disc", "fr": 4, "dir": "aim", "spread": 0.08, "speed": [9, 15], "plife": [0.45, 0.8], "look": "streak", "size": [2, 3.4], "col": "#d8ffe8", "c2": "#14ff8c", "gravity": 0, "drag": 0.3, "curl": False, "x": i % 2 == 1})
L.append({"id": "fth", "t": "emit", "at": 0.1, "life": 4.6, "att": "ground", "pos": [0, 0.8, 15], "burst": 0, "rate": 4, "from": "disc", "fr": 9, "dir": "aim", "spread": 0.2, "speed": [6, 10], "plife": [0.8, 1.3], "look": "model", "model": "wind_feather", "mmat": "solid", "msize": [0.2, 0.3], "col": "#17b877", "c2": "#0f9e68", "gravity": 0, "drag": 0.2, "mspin": 120, "x": True})
# Release blast (user 2026-11-09): strong forward gust as the wand swings up; every layer waits for the 0.2 s wind-up.
# The wind front runs down the lane first; the lane is revealed behind it (0.38 s to the far end).
RUN = 0.38
FRONT = {"0": [0, 0.15, 0], "1": [0, 0.15, LEN]}
AIR = {"0": [0, 0.8, 0], "1": [0, 0.8, LEN]}
L.append({"id": "gust", "t": "emit", "at": 0, "life": RUN, "att": "ground", "pos": AIR, "burst": 0, "rate": 110, "from": "disc", "fr": 4, "dir": "aim", "spread": 0.2, "speed": [10, 22], "plife": [0.25, 0.45], "look": "smoke", "size": [3.5, 6], "col": "#a8f2d2", "c2": "#4fd9a0", "gravity": 0, "drag": 2, "grow": 1.3})
L.append({"id": "gfth", "t": "emit", "at": 0, "life": RUN, "att": "ground", "pos": AIR, "burst": 0, "rate": 45, "from": "disc", "fr": 4, "dir": "aim", "spread": 0.3, "speed": [12, 26], "plife": [0.5, 0.9], "look": "model", "model": "wind_feather", "mmat": "solid", "msize": [0.22, 0.34], "col": "#17b877", "c2": "#0f9e68", "gravity": 0, "drag": 1.5, "mspin": 200})
L.append({"id": "deco", "t": "mesh", "at": 0, "life": 5, "att": "ground", "pos": [0, 0.09, 0], "fade": 0, "shape": "model", "model": "wind_tail_deco", "mat": "solid", "col": "#12a06e", "scale": {"0": [1, 1, 0.01], "0.075": 1}, "op": {"0": 0, "0.04": 0.85, "0.92": 0.85, "1": 0}})
for s in (-1, 1):
    for z in (3, 9, 15, 21, 27):
        L.append({"id": "ef%d%d" % (s + 1, z), "t": "emit", "at": round(z / LEN * RUN, 3), "life": 4.4, "att": "ground", "pos": [s * W / 2, 0.4, z], "burst": 0, "rate": 3, "from": "disc", "fr": 0.6, "dir": "up", "speed": [0.5, 1.5], "up": [1, 2.5], "plife": [0.7, 1.2], "look": "model", "model": "wind_feather", "mmat": "solid", "msize": [0.16, 0.24], "col": "#17b877", "c2": "#0f9e68", "gravity": 0, "drag": 0.5, "mspin": 120})
# Release: long pale wind lines shoot forward with the front (no arrow head).
SX = [-3.4, -2.0, -0.7, 0.6, 1.9, 3.2, -1.2, 2.5]
SY = [1.0, 2.2, 1.5, 2.8, 1.2, 2.0, 3.2, 3.0]
for i in range(8):
    L.append({"id": "shot%d" % i, "t": "mesh", "at": round(i * 0.012, 3), "life": RUN, "att": "ground", "pos": {"0": [SX[i], SY[i], -6], "1": [SX[i], SY[i], 20]}, "fade": 0, "shape": "model", "model": "wind_tail_gust", "mat": "solid", "col": "#cfeee0", "scale": 1, "op": {"0": 0.7, "0.7": 0.7, "1": 0}})
# Colourless faint wind streams run start to end all the time: broken into offset segments, one ends and another comes.
XS = [-3.3, -1.7, 0.1, 1.8, 3.3]
YS = [1.3, 2.6, 1.8, 3.0, 1.5]
JX = [0, 0.45, -0.35, 0.25]
JY = [0, -0.3, 0.35, -0.15]
for i in range(5):
    for k in range(4):
        L.append({"id": "air%d_%d" % (i, k), "t": "mesh", "at": round(0.5 + k * 0.85 + i * 0.23, 3), "life": 1.2, "att": "ground", "pos": {"0": [XS[i] + JX[(k + i) % 4], YS[i] + JY[(k + i) % 4], 0], "1": [XS[i] + JX[(k + i) % 4], YS[i] + JY[(k + i) % 4], 18]}, "fade": 0, "shape": "model", "model": "wind_tail_gust", "mat": "solid", "col": "#eef3f1", "scale": 1, "op": {"0": 0, "0.2": 0.32, "0.8": 0.32, "1": 0}})
for l in L:
    if l["id"].startswith("st"): l["at"] = round(l["pos"][2] / LEN * RUN, 3)
for l in L: l["at"] = round(l["at"] + 0.2, 3)
with open(os.path.join(R, 'assets/fx/wind/tailwind.fx.json'), 'w', encoding='utf-8', newline='\n') as o:
    json.dump({"v": 1, "desc": "Tailwind: ร่องลมยาว 30 ม. กว้าง 9 ม. อยู่ 5 วิ ลายลมไหลไปข้างหน้า มีเส้นขอบและเส้นลม", "tags": ["wind", "zone", "buff"], "pal": "wind", "dur": 5.4, "seed": 71, "layers": L}, o, ensure_ascii=False, indent=1)
