# shibuya_tex.py — textures for the Shibuya test map (facades, shopfronts, neon signs, screens)
# Run with normal Python (Pillow): python assets/src/shibuya_tex.py  → assets/src/shibuya_tex/*.png (then blender shibuya_build.py packs them into the .glb)
# All shop words are generic Japanese nouns (ramen, karaoke, pharmacy …) — no real brand names or logos.
# Facade tiles = 4 bays (3 m) × 4 floors (3.5 m) = 12 × 14 m, seamless left/right + top/bottom. *_e.png = emission (lit windows).
import os, random, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'shibuya_tex'); os.makedirs(OUT, exist_ok=True)
FONT = 'C:/Windows/Fonts/YuGothB.ttc'
R = random.Random(5)
T = 512                      # facade tile px
BAY, FL = T // 4, T // 4     # 128 px per bay / floor


def font(px): return ImageFont.truetype(FONT, px)


def lit_col(r):
    return R.choice([(255, 236, 200), (255, 246, 228), (230, 240, 255), (255, 214, 160), (210, 232, 255)])


def save(im, n): im.save(os.path.join(OUT, n))


# ---------- facades ----------
def facade_glass():
    b = Image.new('RGB', (T, T), (34, 44, 62)); e = Image.new('RGB', (T, T), (0, 0, 0)); g = ImageDraw.Draw(b); q = ImageDraw.Draw(e)
    for fy in range(4):
        for bx in range(4):
            for s in range(2):                                   # 2 panes per bay
                x0, y0 = bx * BAY + s * BAY // 2 + 3, fy * FL + 10
                x1, y1 = x0 + BAY // 2 - 6, y0 + FL - 22
                v = R.randint(-8, 10); g.rectangle([x0, y0, x1, y1], fill=(40 + v, 54 + v, 78 + v))
                g.rectangle([x0, y0, x1, y0 + (y1 - y0) // 3], fill=(58 + v, 74 + v, 100 + v))   # sky reflection band
                if R.random() < 0.34:
                    c = lit_col(R); k = R.uniform(0.5, 1); q.rectangle([x0, y0, x1, y1], fill=tuple(int(v2 * k) for v2 in c))
                    g.rectangle([x0, y0, x1, y1], fill=tuple(int(v2 * 0.55) for v2 in c))
            g.rectangle([bx * BAY, fy * FL, bx * BAY + 2, fy * FL + FL], fill=(150, 158, 170))  # mullion
        g.rectangle([0, fy * FL, T, fy * FL + 9], fill=(120, 128, 140)); g.rectangle([0, fy * FL + FL - 12, T, fy * FL + FL], fill=(70, 76, 88))  # slab edge
    save(b, 'fac_glass.png'); save(e, 'fac_glass_e.png')


def facade_ribbon():
    b = Image.new('RGB', (T, T), (178, 176, 168)); e = Image.new('RGB', (T, T), (0, 0, 0)); g = ImageDraw.Draw(b); q = ImageDraw.Draw(e)
    for fy in range(4):
        y0, y1 = fy * FL + 40, fy * FL + FL - 14
        g.rectangle([0, y0, T, y1], fill=(46, 54, 66))
        x = 0
        while x < T:
            w = R.choice([64, 96, 128]); w = min(w, T - x)
            if R.random() < 0.45:
                c = lit_col(R); k = R.uniform(0.45, 1); q.rectangle([x + 2, y0 + 2, x + w - 2, y1 - 2], fill=tuple(int(v * k) for v in c))
                g.rectangle([x + 2, y0 + 2, x + w - 2, y1 - 2], fill=tuple(int(v * 0.5) for v in c))
            g.rectangle([x, y0, x + 2, y1], fill=(120, 124, 130)); x += w
        g.rectangle([0, fy * FL, T, fy * FL + 4], fill=(150, 148, 140))
    for i in range(1800):                                     # concrete noise
        x, y = R.randrange(T), R.randrange(T); v = R.randint(-14, 8); px = b.getpixel((x, y)); b.putpixel((x, y), tuple(max(0, min(255, c + v)) for c in px))
    save(b, 'fac_ribbon.png'); save(e, 'fac_ribbon_e.png')


def facade_tile():
    b = Image.new('RGB', (T, T), (196, 178, 150)); e = Image.new('RGB', (T, T), (0, 0, 0)); g = ImageDraw.Draw(b); q = ImageDraw.Draw(e)
    for y in range(0, T, 8): g.line([0, y, T, y], fill=(184, 166, 138))
    for x in range(0, T, 16): g.line([x, 0, x, T], fill=(188, 170, 142))
    for fy in range(4):
        for bx in range(4):
            x0, y0 = bx * BAY + 28, fy * FL + 30; x1, y1 = x0 + 72, y0 + 70
            g.rectangle([x0 - 4, y0 - 4, x1 + 4, y1 + 8], fill=(150, 136, 116))
            g.rectangle([x0, y0, x1, y1], fill=(40, 46, 56))
            if R.random() < 0.5:
                c = lit_col(R); k = R.uniform(0.4, 1); q.rectangle([x0, y0, x1, y1], fill=tuple(int(v * k) for v in c)); g.rectangle([x0, y0, x1, y1], fill=tuple(int(v * 0.5) for v in c))
                if R.random() < 0.5: g.rectangle([x0, y0, x1, y0 + 26], fill=(220, 214, 196)); q.rectangle([x0, y0, x1, y0 + 26], fill=(60, 58, 50))   # blind
            g.line([(x0 + x1) // 2, y0, (x0 + x1) // 2, y1], fill=(170, 170, 170), width=2)
            if R.random() < 0.3: g.rectangle([x0 - 6, y1 + 8, x1 + 6, y1 + 12], fill=(90, 90, 92))   # AC / sill
    save(b, 'fac_tile.png'); save(e, 'fac_tile_e.png')


def facade_dark():
    b = Image.new('RGB', (T, T), (62, 64, 70)); e = Image.new('RGB', (T, T), (0, 0, 0)); g = ImageDraw.Draw(b); q = ImageDraw.Draw(e)
    for fy in range(4):
        for i in range(8):
            x0 = i * 64 + 14; y0 = fy * FL + 16; x1, y1 = x0 + 30, y0 + FL - 30
            g.rectangle([x0, y0, x1, y1], fill=(30, 36, 46))
            if R.random() < 0.3:
                c = lit_col(R); k = R.uniform(0.4, 0.9); q.rectangle([x0, y0, x1, y1], fill=tuple(int(v * k) for v in c)); g.rectangle([x0, y0, x1, y1], fill=tuple(int(v * 0.5) for v in c))
        g.rectangle([0, fy * FL, T, fy * FL + 6], fill=(84, 86, 92))
    save(b, 'fac_dark.png'); save(e, 'fac_dark_e.png')


# ---------- shopfront band: 3 shops per tile, tile = 12 m × 4.4 m (512 × 188 → stored 512 × 192) ----------
SHOP_WORDS = ['ラーメン', 'カラオケ', '居酒屋', '焼肉', '寿司', 'カフェ', '薬局', '書店', '古着', 'ゲーム', '餃子', 'うどん', '中華', '喫茶', '酒場', '靴', '雑貨', 'パン', 'そば', '天ぷら', '定食', '牛丼', 'たこ焼き', 'クレープ', '服', '時計', 'メガネ', 'コスメ', '花', '銀行']


def shopfront():
    W2, H2 = 1024, 384
    b = Image.new('RGB', (W2, H2), (60, 58, 56)); e = Image.new('RGB', (W2, H2), (0, 0, 0)); g = ImageDraw.Draw(b); q = ImageDraw.Draw(e)
    sw = W2 // 4
    for i in range(4):
        x0 = i * sw; inner = R.choice([(255, 226, 170), (255, 244, 220), (220, 236, 255), (255, 200, 150), (240, 250, 255)])
        band = R.choice([(200, 40, 40), (250, 200, 40), (30, 120, 200), (240, 240, 240), (30, 30, 30), (230, 110, 30), (40, 150, 90), (200, 60, 140)])
        g.rectangle([x0 + 6, 0, x0 + sw - 6, 86], fill=band); q.rectangle([x0 + 6, 0, x0 + sw - 6, 86], fill=tuple(int(c * 0.85) for c in band))
        w = R.choice(SHOP_WORDS); f = font(56); tc = (255, 255, 255) if sum(band) < 500 else (20, 20, 20)
        tw = g.textlength(w, font=f); tx = x0 + (sw - tw) / 2
        g.text((tx, 10), w, font=f, fill=tc); q.text((tx, 10), w, font=f, fill=tc)
        g.rectangle([x0 + 10, 96, x0 + sw - 10, H2 - 10], fill=tuple(int(c * 0.6) for c in inner))
        q.rectangle([x0 + 10, 96, x0 + sw - 10, H2 - 10], fill=tuple(int(c * 0.75) for c in inner))
        for k in range(R.randint(3, 6)):                       # shelves / people silhouettes / goods
            cx = x0 + R.randint(20, sw - 40); cy = R.randint(140, H2 - 40); cc = R.choice([(80, 60, 50), (150, 60, 60), (60, 90, 140), (200, 170, 90), (40, 40, 40)])
            g.rectangle([cx, cy, cx + R.randint(16, 60), cy + R.randint(20, 90)], fill=cc); q.rectangle([cx, cy, cx + 30, cy + 20], fill=tuple(c // 3 for c in cc))
        g.rectangle([x0 + 6, 92, x0 + 10, H2], fill=(150, 150, 150)); g.rectangle([x0 + sw // 2 - 2, 96, x0 + sw // 2 + 2, H2], fill=(150, 150, 150))
        if R.random() < 0.5:                                    # shutter half down
            g.rectangle([x0 + 10, 96, x0 + sw - 10, 96 + R.randint(40, 120)], fill=(130, 130, 134)); q.rectangle([x0 + 10, 96, x0 + sw - 10, 140], fill=(0, 0, 0))
    save(b, 'shop.png'); save(e, 'shop_e.png')


# ---------- sign atlas 2048²: 8 × 8 cells of 256 ----------
# layout: column 0-3 rows 0-3: 16 vertical neon signs (each 1 cell wide × 4 tall? no: vertical = 128 × 512) → region A (x 0-1023, y 0-1023): 8 vertical signs 128×1024
# region B (x 1024-2047, y 0-1023): 8 horizontal signs 1024 × 128 • region C (y 1024-2047): 4 screens/billboards 1024 × 512
NEON = [(255, 60, 90), (255, 200, 40), (60, 220, 255), (120, 255, 120), (255, 120, 220), (255, 150, 40), (180, 120, 255), (255, 255, 255)]
VWORDS = ['カラオケ', 'ラーメン', '居酒屋', '焼肉食放題', 'ゲームセンター', '漫画喫茶', '薬', 'ホテル', '寿司', '餃子酒場', '古着', '歯科', '英会話', '中華料理', '牛タン', '珈琲']
HWORDS = ['カラオケ 24時間', 'ラーメン 横丁', '焼肉 食べ放題', 'ドラッグ 薬', 'ゲーム センター', '居酒屋 酒場', 'カフェ & バー', 'SHIBUYA']


def neon_text(g, q, xy, s, f, c, glowimg):
    g.text(xy, s, font=f, fill=c); q.text(xy, s, font=f, fill=c)


def atlas():
    A = 2048; b = Image.new('RGB', (A, A), (10, 10, 14)); e = Image.new('RGB', (A, A), (0, 0, 0)); g = ImageDraw.Draw(b); q = ImageDraw.Draw(e)
    for i in range(8):                                       # vertical signs 128 × 1024
        x0 = i * 128; bg = R.choice([(20, 20, 24), (240, 240, 236), (180, 20, 30), (20, 40, 120), (250, 210, 40)]); c = R.choice(NEON)
        g.rectangle([x0 + 4, 4, x0 + 123, 1019], fill=bg); q.rectangle([x0 + 4, 4, x0 + 123, 1019], fill=tuple(int(v * 0.35) for v in bg))
        g.rectangle([x0 + 4, 4, x0 + 123, 1019], outline=c, width=5); q.rectangle([x0 + 4, 4, x0 + 123, 1019], outline=c, width=5)
        w = VWORDS[i * 2 % len(VWORDS)] if i % 2 == 0 else VWORDS[(i * 2 + 1) % len(VWORDS)]
        n = len(w); fs = min(104, int(960 / max(1, n)) - 8); f = font(fs); tc = c if sum(bg) < 200 else (20, 20, 20)
        y = (1024 - n * (fs + 8)) // 2
        for ch in w:
            tw = g.textlength(ch, font=f); neon_text(g, q, (x0 + 64 - tw / 2, y), ch, f, tc, None); y += fs + 8
    for i in range(8):                                       # horizontal signs 1024 × 128
        y0 = i * 128; x0 = 1024; bg = R.choice([(20, 20, 24), (240, 240, 236), (190, 30, 40), (20, 60, 150), (250, 200, 30), (30, 130, 70)]); c = R.choice(NEON)
        g.rectangle([x0 + 4, y0 + 4, x0 + 1019, y0 + 123], fill=bg); q.rectangle([x0 + 4, y0 + 4, x0 + 1019, y0 + 123], fill=tuple(int(v * 0.4) for v in bg))
        w = HWORDS[i]; f = font(84); tc = c if sum(bg) < 200 else (20, 20, 20); tw = g.textlength(w, font=f)
        neon_text(g, q, (x0 + 512 - tw / 2, y0 + 14), w, f, tc, None)
        g.rectangle([x0 + 4, y0 + 4, x0 + 1019, y0 + 123], outline=c, width=4); q.rectangle([x0 + 4, y0 + 4, x0 + 1019, y0 + 123], outline=c, width=4)
    for i in range(4):                                       # screens / billboards 1024 × 512 (abstract adverts)
        x0, y0 = (i % 2) * 1024, 1024 + (i // 2) * 512
        im = Image.new('RGB', (1024, 512)); d2 = ImageDraw.Draw(im)
        c1, c2 = R.sample([(255, 60, 120), (40, 160, 255), (255, 200, 40), (120, 255, 180), (160, 80, 255), (255, 120, 40)], 2)
        for y in range(512):
            k = y / 511; d2.line([0, y, 1024, y], fill=tuple(int(c1[j] * (1 - k) + c2[j] * k) for j in range(3)))
        for k in range(14):
            r = R.randint(30, 200); cx, cy = R.randint(0, 1024), R.randint(0, 512); cc = R.choice([(255, 255, 255), (20, 20, 40), c2, c1])
            if R.random() < 0.5: d2.ellipse([cx - r, cy - r, cx + r, cy + r], fill=cc)
            else: d2.polygon([(cx, cy - r), (cx + r, cy + r // 2), (cx - r, cy + r // 2)], fill=cc)
        im = im.filter(ImageFilter.GaussianBlur(3)); d2 = ImageDraw.Draw(im)
        w = ['ネオン シティ', 'SHIBUYA NIGHT', '新発売', 'ミュージック'][i]; f = font(110); tw = d2.textlength(w, font=f)
        d2.text((512 - tw / 2 + 5, 195), w, font=f, fill=(0, 0, 0)); d2.text((512 - tw / 2, 190), w, font=f, fill=(255, 255, 255))
        b.paste(im, (x0, y0)); e.paste(im.point(lambda v: int(v * 0.9)), (x0, y0))
    save(b, 'signs.png'); save(e, 'signs_e.png')


facade_glass(); facade_ribbon(); facade_tile(); facade_dark(); shopfront(); atlas()
print('ok', sorted(os.listdir(OUT)))
