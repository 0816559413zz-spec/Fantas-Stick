#!/usr/bin/env python3
# Wind rework (designs/wind.md, user 2026-11-08/09): shield = curved wind wall floating in front of the body, 160 degrees.
# Ref: glassy curved force panels. Edges must not show (soft round mask in the shader), waves of wind keep moving inside (mat "windshell", js/45).
import json, math, os
R = os.path.join(os.path.dirname(__file__), '..')
RAD, HALF, LOW, TOP, NU, NV = 1.9, 80.0, -52.0, 58.0, 48, 28

v, uv, f = [], [], []
for j in range(NV + 1):
    t = j / NV; ph = math.radians(LOW + (TOP - LOW) * t)
    for i in range(NU + 1):
        s = i / NU; th = math.radians(-HALF + 2 * HALF * s)
        v.append([round(RAD * math.cos(ph) * math.sin(th), 4), round(RAD * math.sin(ph), 4), round(RAD * math.cos(ph) * math.cos(th), 4)])
        uv.append([round(s, 4), round(t, 4)])
W = NU + 1
for j in range(NV):
    for i in range(NU):
        a = j * W + i
        f.append([a, a + W, a + W + 1, a + 1])
with open(os.path.join(R, 'assets/fx/mesh/wind_wall_shell.mesh.json'), 'w', encoding='utf-8') as o:
    json.dump({"v": 1, "desc": "โล่สายลม: แผ่นโค้งส่วนของทรงกลม รัศมี 1.9 ม. กว้าง 160 องศา โค้งเข้าหาตัว", "mat": "glow", "pal": "wind", "tags": ["shield", "wind"],
               "parts": [{"id": "p", "k": "poly", "v": v, "f": f, "uv": uv, "flat": False}]}, o, ensure_ascii=False)

def shell(i, sc, scroll, op, col, col2):
    return {"id": i, "t": "mesh", "at": 0, "life": 60, "att": "feet", "fade": 0, "pos": [0, 1.42, 0], "shape": "model", "model": "wind_wall_shell",
            "mat": "windshell", "col": col, "col2": col2, "scroll": scroll, "scale": {"0": [sc * 0.72, sc * 0.72, sc * 0.72], "0.0035": [sc, sc, sc], "1": [sc, sc, sc], "ease": "out"}, "op": {"0": 0, "0.0025": op, "1": op}}
fx = {"v": 1, "desc": "โล่สายลม: กำแพงลมโค้งลอยตรงหน้า ไม่เห็นขอบ คลื่นลมวิ่งไปมาข้างใน (ผู้ใช้ 2026-11-09)", "tags": ["wind", "shield"], "pal": "wind", "dur": 60.0, "seed": 9, "layers": [
    shell("back", 0.97, 0.7, 0.75, "#9dffc9", "#14b56e"),
    shell("front", 1.03, 1.0, 1.0, "#f0fff8", "#2bdc88"),
]}
with open(os.path.join(R, 'assets/fx/wind/wall_guard.fx.json'), 'w', encoding='utf-8') as o:
    json.dump(fx, o, ensure_ascii=False, indent=1)
REL, ARR = 0.6 / 1.0, 0.79 / 1.0
def key(a): return str(round(a, 3))
def L(i, sc, col, col2, scroll, op):
    return {"id": i, "t": "mesh", "at": 0, "life": 1.0, "att": "ground", "fade": 0, "shape": "model", "model": "wind_wall_shell", "mat": "windshell", "col": col, "col2": col2, "scroll": scroll,
            "pos": {"0": [0, 1.42, 0], key(REL): [0, 1.42, -0.5], key(ARR): [0, 1.42, 8.0], "1": [0, 1.42, 8.5]},
            "scale": {"0": sc, key(REL): sc * 0.86, key(ARR): sc * 1.2, "1": sc * 1.45},
            "dis": {"0": 0, key(REL): 1, key(ARR): 0.6, "1": 0}, "op": {"0": op, key(ARR - 0.03): op, key(ARR + 0.1): 0, "1": 0}}
launch = {"v": 1, "desc": "ปล่อยโล่: ง้าง 0.6 วิ แผ่นลมถอยนิด หดตัว เส้นลมถี่ขึ้นและหมุนเข้ากลาง แล้วพุ่งออกไปข้างหน้า", "tags": ["wind", "shield"], "pal": "wind", "dur": 1.0, "seed": 13, "layers": [
    L("back", 0.97, "#9dffc9", "#14b56e", 1.6, 0.75), L("front", 1.03, "#f0fff8", "#2bdc88", 2.2, 1.0),
]}
with open(os.path.join(R, 'assets/fx/wind/wall_launch.fx.json'), 'w', encoding='utf-8') as o:
    json.dump(launch, o, ensure_ascii=False, indent=1)
blast = {"v": 1, "desc": "กำแพงลมระเบิด: ลมกระจายจากแผ่น + เส้นลมหมุนดูดเข้ากลาง วง 7.5 ม.", "tags": ["wind", "shield"], "pal": "wind", "dur": 0.75, "seed": 12, "layers": [
 {"id": "pull0", "t": "mesh", "at": 0.04, "life": 0.55, "att": "point", "fade": 0, "pos": [0, -1.0, 0], "shape": "model", "model": "wind_groundswirl", "mat": "tex", "tex": "tex/wind_swoosh_a_hi", "col": "#5dffa8", "col2": "#000000", "rim": 0, "spin": -620, "scale": {"0": 4.4, "1": 0.7, "ease": "in"}, "op": {"0": 0, "0.15": 1, "0.8": 0.9, "1": 0}},
 {"id": "pull1", "t": "mesh", "at": 0.1, "life": 0.5, "att": "point", "fade": 0, "pos": [0, -0.3, 0], "shape": "model", "model": "wind_groundswirl", "mat": "tex", "tex": "tex/wind_swoosh_b_hi", "col": "#c9ffe2", "col2": "#000000", "rim": 0, "spin": -760, "rot": [0, 70, 0], "scale": {"0": 3.8, "1": 0.5, "ease": "in"}, "op": {"0": 0, "0.15": 0.95, "0.8": 0.8, "1": 0}},
 {"id": "in", "t": "emit", "at": 0.03, "life": 0.4, "att": "point", "from": "sphere", "fr": 5.2, "dir": "in", "gravity": 0, "drag": 0.1, "rate": 200, "speed": [12, 20], "plife": [0.18, 0.34], "look": "streak", "size": [1.5, 3.0], "col": "#c9ffe2", "c2": "#14b56e", "curl": True},
 {"id": "shock", "t": "warp", "at": 0, "life": 0.3, "att": "point", "kind": "shock", "size": {"0": 1.5, "1": 12}, "str": 0.7, "op": {"0": 1, "1": 0}, "col": "#ffffff", "glow": 0},
 {"id": "dust", "t": "emit", "at": 0, "life": 0.06, "att": "ground", "from": "ring", "fr": 3.5, "burst": 14, "rate": 0, "dir": "in", "gravity": 0, "drag": 1.2, "speed": [4, 8], "up": [0.3, 1.2], "plife": [0.4, 0.7], "size": [3, 5], "grow": 0.5, "look": "smoke", "curl": True, "col": "#e4e0cf", "c2": "#a39d88"},
]}
with open(os.path.join(R, 'assets/fx/wind/wall_blast.fx.json'), 'w', encoding='utf-8') as o:
    json.dump(blast, o, ensure_ascii=False, indent=1)
print('ok', len(v))
