#!/usr/bin/env python3
# Wind rework (designs/wind.md, user 2026-11-08): Dash = crouch 0.25 s, wind bursts upward, updraft lifts you 8 m with wings held open, then glide down.
# Same crisp shader wind as the shield (mat windshell, mode ball = wraps around the column).
import json, os
R = os.path.join(os.path.dirname(__file__), '..')
with open(os.path.join(R, 'assets/fx/mesh/wind_updraft.mesh.json'), 'w', encoding='utf-8') as o:
    json.dump({"v": 1, "desc": "Dash สายลม: ลำลมพัดขึ้น กว้างขึ้นด้านบน สูง 6.2 ม.", "mat": "glow", "pal": "wind", "tags": ["wind"], "parts": [{"id": "p", "k": "lathe", "seg": 48, "prof": [[0.75, 0], [0.62, 0.8], [0.72, 2.2], [0.95, 4.2], [1.3, 6.2]]}]}, o, ensure_ascii=False, indent=1)
def col(i, sx, scroll, cc, c2, op, at=0, sy=1.35, life=0.8):
    return {"id": i, "t": "mesh", "at": at, "life": life, "att": "point", "fade": 0, "shape": "model", "model": "wind_updraft", "mat": "windshell", "mode": "ball", "col": cc, "col2": c2, "scroll": scroll,
            "scale": {"0": [sx * 0.7, 0.08, sx * 0.7], "0.3": [sx, sy, sx], "1": [sx * 1.15, sy * 1.1, sx * 1.15], "ease": "out"}, "op": {"0": op, "0.55": op, "1": 0}}
def swirl(i, tex, cc, spin, s0, s1, op, at=0, life=0.5):
    return {"id": i, "t": "mesh", "at": at, "life": life, "att": "ground", "pos": [0, 0.1, 0], "fade": 0, "shape": "model", "model": "wind_groundswirl", "mat": "tex", "tex": tex, "col": cc, "col2": "#000000", "rim": 0, "spin": spin, "scale": {"0": s0, "1": s1, "ease": "out"}, "op": {"0": op, "1": 0}}
# ระเบิดขึ้น: ลำลมเดิม + ปากลมบานออกเร็ว ๆ ตอนออกตัว + เส้นลมพุ่งขึ้นหนึ่งชุดใหญ่ + เส้นลมแผ่รอบพื้น + แรงกระแทกบิดภาพ
fx = {"v": 1, "desc": "Dash สายลม: ระเบิดลมพุ่งขึ้น + ลำลมพัดขึ้น 8 ม. + ลมวนบนพื้น + ขนนกปลิว", "tags": ["wind", "dash"], "pal": "wind", "dur": 0.85, "seed": 21, "layers": [
 col("c0", 1.0, 2.4, "#f0fff8", "#2bdc88", 0.9), col("c1", 1.3, 1.6, "#9dffc9", "#14b56e", 0.55),
 col("b0", 2.3, 3.2, "#f0fff8", "#2bdc88", 0.75, sy=0.55, life=0.34), col("b1", 3.2, 2.2, "#9dffc9", "#14b56e", 0.45, at=0.02, sy=0.38, life=0.4),
 swirl("sw", "tex/wind_swoosh_a_hi", "#7dffb4", 520, 0.5, 3.4, 1), swirl("sw2", "tex/wind_swoosh_b_hi", "#b9ffd9", -380, 0.4, 2.6, 0.9, at=0.03, life=0.42),
 {"id": "shock", "t": "warp", "at": 0, "life": 0.3, "att": "point", "kind": "shock", "size": {"0": 1.2, "1": 9}, "str": 0.6, "op": {"0": 1, "1": 0}, "col": "#ffffff", "glow": 0},
 {"id": "blast", "t": "emit", "at": 0, "life": 0.06, "att": "point", "from": "ring", "fr": 1.0, "burst": 60, "rate": 0, "dir": "up", "gravity": 0, "drag": 0.9, "speed": [20, 36], "plife": [0.25, 0.5], "look": "streak", "size": [2.2, 4.2], "col": "#f0fff8", "c2": "#2bdc88", "curl": True},
 {"id": "side", "t": "emit", "at": 0, "life": 0.06, "att": "ground", "from": "ring", "fr": 0.9, "burst": 34, "rate": 0, "dir": "out", "gravity": 0, "drag": 1.6, "speed": [14, 24], "up": [1, 4], "plife": [0.22, 0.4], "look": "streak", "size": [1.6, 3], "col": "#c9ffe2", "c2": "#12a067", "curl": True},
 {"id": "up", "t": "emit", "at": 0, "life": 0.5, "att": "point", "from": "ring", "fr": 0.8, "dir": "up", "gravity": 0, "drag": 0.5, "rate": 120, "speed": [12, 22], "plife": [0.2, 0.4], "look": "streak", "size": [1.4, 2.8], "col": "#e6fff4", "c2": "#39cf8c", "curl": True},
 {"id": "plume", "t": "emit", "at": 0.04, "life": 0.06, "att": "point", "pos": [0, 1.6, -0.3], "from": "sphere", "fr": 0.7, "burst": 14, "rate": 0, "dir": "out", "gravity": -1.5, "drag": 1.3, "speed": [3, 7], "plife": [0.7, 1.2], "look": "model", "model": "wind_feather", "mmat": "glow", "msize": [0.16, 0.3], "col": "#b9ffd9", "c2": "#39cf8c", "mspin": 3},
]}
with open(os.path.join(R, 'assets/fx/wind/dash_up.fx.json'), 'w', encoding='utf-8') as o:
    json.dump(fx, o, ensure_ascii=False, indent=1)
# ชาร์จ 0.25 วิ: ลมวนหดเข้าเท้า + เส้นลมไหลเข้าหาตัว
ch = {"v": 1, "desc": "Dash สายลม ชาร์จ 0.25 วิ: ลมวนหดเข้าเท้า + เส้นลมไหลเข้าหาตัว", "tags": ["wind", "dash"], "pal": "wind", "dur": 0.32, "seed": 22, "layers": [
 {"id": "in0", "t": "mesh", "at": 0, "life": 0.3, "att": "ground", "pos": [0, 0.08, 0], "fade": 0, "shape": "model", "model": "wind_groundswirl", "mat": "tex", "tex": "tex/wind_swoosh_a_hi", "col": "#7dffb4", "col2": "#000000", "rim": 0, "spin": -640, "scale": {"0": 2.7, "1": 0.7, "ease": "in"}, "op": {"0": 0, "0.35": 0.95, "1": 1}},
 {"id": "in1", "t": "mesh", "at": 0.04, "life": 0.26, "att": "ground", "pos": [0, 0.12, 0], "fade": 0, "shape": "model", "model": "wind_groundswirl", "mat": "tex", "tex": "tex/wind_swoosh_b_hi", "col": "#c9ffe2", "col2": "#000000", "rim": 0, "spin": 480, "scale": {"0": 2.0, "1": 0.45, "ease": "in"}, "op": {"0": 0, "0.4": 0.8, "1": 0.9}},
 {"id": "suck", "t": "emit", "at": 0, "life": 0.22, "att": "ground", "pos": [0, 0.35, 0], "from": "ring", "fr": 2.4, "dir": "in", "gravity": 0, "drag": 0, "rate": 130, "speed": [7, 11], "plife": [0.14, 0.24], "look": "streak", "size": [0.9, 1.7], "col": "#e6fff4", "c2": "#39cf8c", "curl": True},
]}
with open(os.path.join(R, 'assets/fx/wind/dash_charge.fx.json'), 'w', encoding='utf-8') as o:
    json.dump(ch, o, ensure_ascii=False, indent=1)
print('ok')
