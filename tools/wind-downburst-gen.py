#!/usr/bin/env python3
# Wind rework (designs/wind.md): Downburst = wind pressing down from the sky, radius 150 (7.5 m), 4 s.
# Sky mouth up high (must read from above and from the side) + rings falling and hitting the floor + falling streaks + ground swirl.
import json, os
R = os.path.join(os.path.dirname(__file__), '..')
with open(os.path.join(R, 'assets/fx/mesh/wind_downburst.mesh.json'), 'w', encoding='utf-8') as o:
    json.dump({"v": 1, "desc": "Downburst: ผนังลมวงกว้าง สูง 13 ม. บานออกที่พื้น", "mat": "glow", "pal": "wind", "tags": ["wind"], "parts": [{"id": "p", "k": "lathe", "seg": 64, "prof": [[8.3, 0], [7.6, 0.5], [7.3, 1.8], [7.15, 6], [7.0, 13]]}]}, o, ensure_ascii=False, indent=1)
TELE, LIFE, TOP = 0.35, 4.0, 11.5
import math, random
random.seed(5)
parts = [{"id": "s%d" % i, "k": "spiral", "turns": 0.15 + random.random() * 0.06, "r0": 7.15 - random.random() * 0.9, "r1": 7.15 - random.random() * 0.9, "rise": 5.5 + random.random() * 2.5, "w": 1.4 + random.random() * 0.8, "taper": 0.3, "wall": True, "seg": 24, "rot": [0, i * 30 + random.random() * 14, 0]} for i in range(12)]
with open(os.path.join(R, 'assets/fx/mesh/wind_down_strands.mesh.json'), 'w', encoding='utf-8') as o:
    json.dump({"v": 1, "desc": "Downburst: สายลมแนวตั้ง 12 เส้น รอบวง 7 ม.", "mat": "glow", "pal": "wind", "tags": ["wind"], "parts": parts}, o, ensure_ascii=False, indent=1)
def swirl(i, tex, cc, spin, y, sc, op, at, life, yaw=0):
    return {"id": i, "t": "mesh", "at": at, "life": life, "att": "ground", "pos": y, "fade": 0, "shape": "model", "model": "wind_groundswirl", "mat": "tex", "tex": tex, "col": cc, "col2": "#000000", "rim": 0, "spin": spin, "rot": [0, yaw, 0], "scale": sc, "op": op}
HOLD = {"0": 0, "0.06": 1, "0.92": 1, "1": 0}
def hold(v): return {k: x * v for k, x in HOLD.items()}
L = []
# บอกจุดก่อนลมลง: ลมวนหดบนพื้น + ปากลมบนฟ้าเริ่มหมุน
L.append(swirl("tele", "tex/wind_swoosh_a_hi", "#7dffb4", -300, [0, 0.08, 0], {"0": 6.6, "1": 5.3, "ease": "in"}, {"0": 0, "0.5": 0.8, "1": 0.9}, 0, TELE))
# ปากลมบนฟ้า (เห็นทั้งจากข้างล่าง ด้านข้าง และคนบินที่มองลงมา)
L.append(swirl("sky0", "tex/wind_swoosh_a_hi", "#c9ffe2", 150, [0, TOP, 0], {"0": 2.4, "0.09": 5.6, "1": 5.8, "ease": "out"}, hold(0.95), 0.05, TELE + LIFE - 0.05))
L.append(swirl("sky1", "tex/wind_swoosh_b_hi", "#7dffb4", -210, [0, TOP + 0.5, 0], {"0": 2.0, "0.09": 4.3, "1": 4.5, "ease": "out"}, hold(0.9), 0.1, TELE + LIFE - 0.1, 40))
L.append(swirl("sky2", "tex/wind_swoosh_a_hi", "#f0fff8", 280, [0, TOP - 0.5, 0], {"0": 1.4, "0.09": 2.8, "1": 3.0, "ease": "out"}, hold(0.85), 0.14, TELE + LIFE - 0.14, 95))
# ผนังลมใส ไหลลง
for i, (sc, scr, cc, c2, op) in enumerate([(1.0, -2.2, "#c9ffe2", "#16b872", 0.5), (0.965, -1.5, "#7dffb4", "#0e9a5e", 0.34)]):
    L.append({"id": "wall%d" % i, "t": "mesh", "at": TELE - 0.06, "life": LIFE + 0.06, "att": "ground", "fade": 0, "shape": "model", "model": "wind_downburst", "mat": "windshell", "mode": "ball", "col": cc, "col2": c2, "scroll": scr, "scale": {"0": [sc, 0.06, sc], "0.03": [sc, 1, sc], "1": [sc, 1, sc]}, "op": {"0": 0, "0.03": op, "0.93": op, "1": 0}, "pos": [0, 0, 0]})
# ชั้นลมหมุนกลางเสา ให้เสามีเนื้อทุกความสูง
L.append(swirl("m0", "tex/wind_swoosh_b_hi", "#5dffa8", -260, [0, 7.6, 0], {"0": 5.2, "1": 5.3}, hold(0.7), TELE, LIFE, 20))
L.append(swirl("m1", "tex/wind_swoosh_a_hi", "#5dffa8", 300, [0, 3.8, 0], {"0": 5.3, "1": 5.4}, hold(0.75), TELE, LIFE, 110))
# สายลมแนวตั้งพุ่งลง ชุดละ 12 เส้น ทุก 0.2 วิ
for i in range(20):
    at = TELE - 0.3 + i * 0.2
    L.append({"id": "st%d" % i, "t": "mesh", "at": at, "life": 0.46, "att": "ground", "fade": 0, "shape": "model", "model": "wind_down_strands", "mat": "tex", "tex": "tex/wind_swoosh_a_hi" if i % 2 else "tex/wind_swoosh_b_hi", "col": "#9dffc9" if i % 3 else "#e6fff4", "col2": "#000000", "rim": 0, "spin": 34, "rot": [0, i * 67 % 360, 0], "pos": {"0": [0, TOP, 0], "1": [0, -4.5, 0], "ease": "in"}, "scale": 1, "op": {"0": 0, "0.35": 0.75, "0.8": 0.95, "1": 0}})
# พื้น: ลมวนกดอยู่ตลอด ขอบวงชัด
L.append(swirl("g0", "tex/wind_swoosh_a_hi", "#39e690", 240, [0, 0.1, 0], {"0": 5.2, "1": 5.6}, hold(1), TELE, LIFE))
L.append(swirl("g2", "tex/wind_swoosh_b_hi", "#39e690", 200, [0, 0.12, 0], {"0": 5.0, "1": 5.3}, hold(0.9), TELE, LIFE, 45))
L.append(swirl("g1", "tex/wind_swoosh_b_hi", "#5dffa8", -180, [0, 0.14, 0], {"0": 3.6, "1": 3.9}, hold(0.85), TELE, LIFE, 70))
# ระลอกลมตกจากฟ้า กระแทกพื้นทุก 0.42 วิ
N = 9
for i in range(N):
    at = TELE - 0.3 + i * 0.42
    tex = "tex/wind_swoosh_a_hi" if i % 2 == 0 else "tex/wind_swoosh_b_hi"
    L.append(swirl("fall%d" % i, tex, "#9dffc9", 340 if i % 2 else -340, {"0": [0, TOP, 0], "1": [0, 0.5, 0], "ease": "in"}, {"0": 3.6, "1": 5.6, "ease": "in"}, {"0": 0, "0.2": 0.9, "0.85": 0.95, "1": 0.2}, at, 0.34, i * 47))
    hit = at + 0.32
    L.append({"id": "q%d" % i, "t": "warp", "at": hit, "life": 0.26, "att": "ground", "pos": [0, 0.4, 0], "kind": "shock", "size": {"0": 4, "1": 15}, "str": 0.32, "op": {"0": 1, "1": 0}, "col": "#ffffff", "glow": 0})
    L.append({"id": "kick%d" % i, "t": "emit", "at": hit, "life": 0.05, "att": "ground", "from": "disc", "fr": 6.6, "burst": 9, "rate": 0, "dir": "out", "speed": [5, 12], "up": [3, 7], "plife": [0.55, 0.95], "look": "model", "model": "rock_chunk", "mmat": "solid", "msize": [0.2, 0.5], "bounce": 0.3, "mspin": 420, "col": "#8a7254", "c2": "#3a2c1e", "gravity": 16, "drag": 0.5})
    L.append({"id": "out%d" % i, "t": "emit", "at": hit, "life": 0.06, "att": "ground", "pos": [0, 0.25, 0], "from": "ring", "fr": 6.4, "burst": 26, "rate": 0, "dir": "out", "gravity": 0, "drag": 2.0, "speed": [10, 18], "up": [0.4, 1.8], "plife": [0.2, 0.36], "look": "streak", "size": [2.2, 4], "col": "#c9ffe2", "c2": "#16b872", "curl": True})
# พื้นในวงสั่น: ภาพบิดไหวตลอด + เศษดินกระดอนขึ้นลงทั่ววง + ฝุ่นดินถูกลมดันออกขอบวงเรี่ยพื้น
L.append({"id": "haze", "t": "warp", "at": TELE, "life": LIFE, "att": "ground", "pos": [0, 0.5, 0], "kind": "haze", "size": 16, "str": {"0": 0, "0.05": 0.6, "0.92": 0.6, "1": 0}, "op": {"0": 0, "0.05": 1, "0.92": 1, "1": 0}, "col": "#ffffff", "glow": 0})
L.append({"id": "hop", "t": "emit", "at": TELE, "life": LIFE, "att": "ground", "from": "disc", "fr": 7.0, "rate": 22, "dir": "up", "speed": [3, 7], "plife": [0.4, 0.8], "look": "model", "model": "rock_chunk", "mmat": "solid", "msize": [0.14, 0.34], "bounce": 0.35, "mspin": 500, "col": "#9a8260", "c2": "#3a2c1e", "gravity": 16, "drag": 0.3})
L.append({"id": "dust", "t": "emit", "at": TELE, "life": LIFE, "att": "ground", "pos": [0, 0.15, 0], "from": "disc", "fr": 6.8, "rate": 36, "dir": "out", "gravity": 0, "drag": 1.2, "speed": [5, 11], "up": [0.3, 1.4], "plife": [0.5, 0.95], "look": "smoke", "size": [2.4, 4.6], "grow": 0.7, "curl": True, "col": "#b39f76", "c2": "#7c6b4c"})
# เส้นลมตกลงตลอด
L.append({"id": "rain", "t": "emit", "at": TELE - 0.2, "life": LIFE + 0.1, "att": "ground", "pos": [0, TOP, 0], "from": "disc", "fr": 7.0, "rate": 200, "dir": "down", "gravity": 0, "drag": 0, "speed": [24, 36], "plife": [0.32, 0.5], "look": "streak", "size": [3, 5.5], "col": "#c9ffe2", "c2": "#16b872"})
# กระแทกครั้งแรก
L.append({"id": "shock", "t": "warp", "at": TELE, "life": 0.32, "att": "ground", "pos": [0, 0.3, 0], "kind": "shock", "size": {"0": 3, "1": 20}, "str": 0.6, "op": {"0": 1, "1": 0}, "col": "#ffffff", "glow": 0})
fx = {"v": 1, "desc": "Downburst: ปากลมบนฟ้า + ระลอกลมตกกระแทกพื้น + เส้นลมตก + ลมวนบนพื้น + พื้นสั่น เศษดินกระเด็น วง 7.5 ม. นาน 4 วิ", "tags": ["wind", "zone"], "pal": "wind", "dur": TELE + LIFE + 0.1, "seed": 31, "layers": L}
with open(os.path.join(R, 'assets/fx/wind/downburst.fx.json'), 'w', encoding='utf-8') as o:
    json.dump(fx, o, ensure_ascii=False, indent=1)
print('ok', len(L))
