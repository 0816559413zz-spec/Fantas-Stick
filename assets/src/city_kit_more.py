# city_kit_more.py — ส่วนต่อของ city_kit_build.py (ไม่รันเดี่ยว): ตึกออฟฟิศหินขาว / ตึกกระจก / โกดังเหล็ก / อาคารจอดรถ + ยานพาหนะ + ของทั้งเมือง
# ใช้ตัวแปร/ฟังก์ชันจาก city_kit_build.py (bx, MB, PALM, BRICK, PAL2, PAINT, MW, MH, TH, swatch …) ผ่าน exec ในไฟล์นั้น
# วัสดุใหม่: city_pal2 (สีชุดที่ 2 + ไฟเรือง) • city_paint (ขาว — เกมย้อมสีต่อชิ้น: รถ/ตู้คอนเทนเนอร์)

# ---------------- ออฟฟิศหินขาว (Portland stone) ----------------
def co_win(lit):
    m = MB(MATS)
    x0, x1, y0, y1 = -0.85, 0.85, 0.55, 3.05
    bx(m, -MW / 2, MW / 2, 0, y0, -TH, 0, PAL2, P_STONE)
    bx(m, -MW / 2, MW / 2, y1, MH, -TH, 0, PAL2, P_STONE)
    bx(m, -MW / 2, x0, y0, y1, -TH, 0, PAL2, P_STONE)
    bx(m, x1, MW / 2, y0, y1, -TH, 0, PAL2, P_STONE)
    bx(m, x0, x1, y0, y1, -TH, -0.24, PAL2, P_GLASS_LIT if lit else P_GLASS)
    for xx in (x0 + 0.04, 0.0, x1 - 0.04):
        bx(m, xx - 0.04, xx + 0.04, y0, y1, -0.25, -0.2, PAL2, P_MULL)
    bx(m, x0, x1, 2.2, 2.27, -0.25, -0.2, PAL2, P_MULL)
    bx(m, x0 - 0.1, x1 + 0.1, y0 - 0.1, y0, -0.05, 0.1, PAL2, P_STONE2)                 # ขอบล่าง
    for xa in (-MW / 2, MW / 2 - 0.3):                                                 # เสาแบน (pilaster)
        bx(m, xa, xa + 0.3, 0, MH, 0, 0.08, PAL2, P_STONE2)
    bx(m, -MW / 2, MW / 2, MH - 0.18, MH, 0, 0.1, PAL2, P_STONE2)
    return m.build('city_co_win' + ('' if lit else '_d'))


def co_plain():
    m = MB(MATS)
    bx(m, -MW / 2, MW / 2, 0, MH, -TH, 0, PAL2, P_STONE)
    for xa in (-MW / 2, MW / 2 - 0.3):
        bx(m, xa, xa + 0.3, 0, MH, 0, 0.08, PAL2, P_STONE2)
    bx(m, -MW / 2, MW / 2, MH - 0.18, MH, 0, 0.1, PAL2, P_STONE2)
    for y in (0.9, 1.8, 2.7):                                                          # ร่องหิน
        bx(m, -MW / 2 + 0.3, MW / 2 - 0.3, y, y + 0.04, 0, 0.01, PAL2, P_STONE2)
    return m.build('city_co_plain')


def co_lobby():
    """ชั้นล่างออฟฟิศ: ประตูกระจกเต็มบาน + กันสาดแผ่นเรียบ + ป้ายเลขตึกทอง"""
    m = MB(MATS)
    bx(m, -MW / 2, MW / 2, 3.0, MH, -TH, 0, PAL2, P_STONE)
    bx(m, -1.8, 1.8, 0, 3.0, -0.3, -0.26, PALM, GLASS_LIT)
    for xx in (-1.8, -0.6, 0.6, 1.8):
        bx(m, xx - 0.05, xx + 0.05, 0, 3.0, -0.26, -0.2, PAL2, P_MULL)
    bx(m, -1.8, 1.8, 2.3, 2.36, -0.26, -0.2, PAL2, P_MULL)
    for xa in (-MW / 2, MW / 2 - 0.2):
        bx(m, xa, xa + 0.2, 0, MH, -TH, 0.08, PAL2, P_STONE2)
    bx(m, -1.6, 1.6, 3.05, 3.18, 0, 1.4, PAL2, P_MULL)                                   # กันสาด
    bx(m, -0.35, 0.35, 3.2, 3.42, 0.02, 0.05, PALM, GOLD)
    bx(m, -1.4, 1.4, 0, 0.12, 0, 0.9, PAL2, P_STONE2)                                    # ขั้นบันได
    return m.build('city_co_lobby')


def co_top():
    m = MB(MATS)
    bx(m, -MW / 2, MW / 2, 0, 1.0, -TH, 0, PAL2, P_STONE)
    bx(m, -MW / 2, MW / 2, 0, 0.22, -0.05, 0.25, PAL2, P_STONE2)
    bx(m, -MW / 2, MW / 2, 0.9, 1.05, -TH - 0.05, 0.12, PAL2, P_STONE2)
    return m.build('city_co_top')


def co_corner():
    m = MB(MATS)
    bx(m, -0.3, 0.3, 0, MH, -0.3, 0.3, PAL2, P_STONE2)
    for y in (1.2, 2.4):
        bx(m, -0.32, 0.32, y, y + 0.05, -0.32, 0.32, PAL2, P_STONE)
    return m.build('city_co_corner')


# ---------------- ตึกกระจก (curtain wall) ----------------
def cg_win(lit):
    m = MB(MATS)
    bx(m, -MW / 2, MW / 2, 0, 0.7, -TH, -0.1, PAL2, P_SPAND)                              # แผงทึบใต้กระจก
    bx(m, -MW / 2, MW / 2, 0.7, MH, -0.25, -0.15, PAL2, P_GLASS_LIT if lit else P_GLASS)
    for xx in (-MW / 2 + 0.04, -MW / 6, MW / 6, MW / 2 - 0.04):
        bx(m, xx - 0.04, xx + 0.04, 0, MH, -0.15, 0.0, PAL2, P_MULL)
    bx(m, -MW / 2, MW / 2, 0.66, 0.74, -0.15, 0.0, PAL2, P_MULL)
    return m.build('city_cg_win' + ('' if lit else '_d'))


def cg_lobby():
    m = MB(MATS)
    bx(m, -MW / 2, MW / 2, 0, MH, -0.3, -0.25, PALM, GLASS_LIT)
    for xx in (-MW / 2 + 0.05, 0, MW / 2 - 0.05):
        bx(m, xx - 0.06, xx + 0.06, 0, MH, -0.25, -0.05, PAL2, P_MULL)
    bx(m, -MW / 2, MW / 2, 3.3, MH, -0.25, 0.0, PAL2, P_SPAND)
    bx(m, -1.2, 1.2, 3.0, 3.1, 0, 1.6, PAL2, P_MULL)
    return m.build('city_cg_lobby')


def cg_top():
    m = MB(MATS)
    bx(m, -MW / 2, MW / 2, 0, 1.6, -0.25, 0.0, PAL2, P_SPAND)
    bx(m, -MW / 2, MW / 2, 1.5, 1.7, -0.35, 0.08, PAL2, P_MULL)
    bx(m, -MW / 2, MW / 2, 0.7, 0.8, 0.0, 0.03, PAL2, P_GLASS_LIT)                          # เส้นไฟบนยอดตึก
    return m.build('city_cg_top')


def cg_corner():
    m = MB(MATS)
    bx(m, -0.25, 0.25, 0, MH, -0.25, 0.25, PAL2, P_MULL)
    return m.build('city_cg_corner')


# ---------------- โกดังเหล็กลอน ----------------
def ribs(m, x0, x1, y0, y1, sw):
    bx(m, x0, x1, y0, y1, -TH, -0.06, PAL2, sw)
    n = int((x1 - x0) / 0.33)
    for k in range(n):
        x = x0 + (k + 0.5) * (x1 - x0) / n
        bx(m, x - 0.06, x + 0.06, y0, y1, -0.06, 0.0, PAL2, sw)


def cw_wall(sw):
    m = MB(MATS)
    ribs(m, -MW / 2, MW / 2, 0, MH, sw)
    return m.build('city_cw_wall' + ('_b' if sw == P_CORB else ''))


def cw_win():
    m = MB(MATS)
    ribs(m, -MW / 2, MW / 2, 0, 2.3, P_COR)
    ribs(m, -MW / 2, MW / 2, 3.1, MH, P_COR)
    bx(m, -MW / 2, MW / 2, 2.3, 3.1, -0.3, -0.2, PAL2, P_GLASS_LIT)
    for xx in (-1.33, 0, 1.33):
        bx(m, xx - 0.04, xx + 0.04, 2.3, 3.1, -0.2, -0.1, PAL2, P_MULL)
    return m.build('city_cw_win')


def cw_door():
    """ประตูม้วน (roller shutter) กว้าง 3.4 ม. + ไฟเหลืองเตือนด้านบน"""
    m = MB(MATS)
    ribs(m, -MW / 2, -1.7, 0, MH, P_COR)
    ribs(m, 1.7, MW / 2, 0, MH, P_COR)
    ribs(m, -1.7, 1.7, 3.2, MH, P_COR)
    bx(m, -1.7, 1.7, 0, 3.2, -0.3, -0.24, PAL2, P_SHUT)
    for k in range(16):
        y = 0.1 + k * 0.19
        bx(m, -1.7, 1.7, y, y + 0.04, -0.24, -0.2, PAL2, P_MULL)
    for s in (-1, 1):
        bx(m, s * 1.75 - 0.08, s * 1.75 + 0.08, 0, 3.25, -0.2, 0.05, PAL2, P_HAZ)
    bx(m, -0.15, 0.15, 3.3, 3.42, 0.0, 0.12, PALM, GLASS_LIT)
    return m.build('city_cw_door')


def cw_top():
    m = MB(MATS)
    bx(m, -MW / 2, MW / 2, 0, 0.35, -TH, 0.05, PAL2, P_MULL)
    bx(m, -MW / 2, MW / 2, 0.25, 0.4, 0.05, 0.25, PAL2, P_MULL)                            # รางน้ำ
    return m.build('city_cw_top')


def cw_corner():
    m = MB(MATS)
    bx(m, -0.22, 0.22, 0, MH, -0.22, 0.22, PAL2, P_MULL)
    return m.build('city_cw_corner')


# ---------------- อาคารจอดรถ (คอนกรีต เปิดโล่ง) ----------------
def cc_open():
    m = MB(MATS)
    bx(m, -MW / 2, MW / 2, 0, 0.35, -TH, 0, PAL2, P_CONC2)                               # ขอบพื้นชั้น
    bx(m, -MW / 2, MW / 2, 0.35, 1.15, -0.25, 0, PAL2, P_CONC)                           # ผนังกันตก
    bx(m, -MW / 2, MW / 2, 1.13, 1.2, 0, 0.03, PAL2, P_HAZ)
    bx(m, -0.25, 0.25, 1.15, MH, -0.5, -0.1, PAL2, P_CONC)                              # เสากลาง
    return m.build('city_cc_open')


def cc_entry():
    m = MB(MATS)
    bx(m, -MW / 2, -1.6, 0, MH, -TH, 0, PAL2, P_CONC)
    bx(m, 1.6, MW / 2, 0, MH, -TH, 0, PAL2, P_CONC)
    bx(m, -1.6, 1.6, 2.9, MH, -TH, 0, PAL2, P_CONC)
    for k in range(8):                                                                   # แถบเหลืองดำเหนือทางเข้า
        x = -1.6 + k * 0.4
        bx(m, x, x + 0.4, 2.9, 3.2, 0, 0.03, PAL2, P_HAZ if k % 2 else P_SPAND)
    bx(m, -0.9, 0.9, 3.25, 3.45, 0.02, 0.06, PAL2, P_TUBE)                                # ป้าย P สีน้ำเงิน
    bx(m, -0.12, 0.12, 3.28, 3.42, 0.06, 0.07, PALM, LIGHT)
    bx(m, -1.3, 1.3, 1.0, 1.08, 0.3, 0.38, PALM, AWN_R)                                  # ไม้กั้น
    bx(m, 1.3, 1.5, 0, 1.1, 0.25, 0.45, PAL2, P_HAZ)
    return m.build('city_cc_entry')


def cc_top():
    m = MB(MATS)
    bx(m, -MW / 2, MW / 2, 0, 1.1, -TH, 0, PAL2, P_CONC)
    bx(m, -MW / 2, MW / 2, 1.05, 1.15, -TH - 0.03, 0.03, PAL2, P_HAZ)
    return m.build('city_cc_top')


def cc_corner():
    m = MB(MATS)
    bx(m, -0.3, 0.3, 0, MH, -0.3, 0.3, PAL2, P_CONC)
    return m.build('city_cc_corner')


# ---------------- ยานพาหนะ ----------------
def wheels(m, xs, zs, r=0.34, w=0.24):
    for x in xs:
        for z in zs:
            m.grid(g_cyl(r, r, w, 12), trs3((x, r, z), (0, 0, PI / 2)), PALM, RUBBER)
            m.grid(g_cyl(r * 0.5, r * 0.5, w + 0.02, 8), trs3((x, r, z), (0, 0, PI / 2)), PALM, STONE)


def car():
    """รถเก๋ง 4.4 × 1.8 ม. — ตัวถังใช้ city_paint (เกมย้อมสี)"""
    m = MB(MATS)
    L, Wd = 4.4, 1.78
    bx(m, -Wd / 2, Wd / 2, 0.3, 0.85, -L / 2, L / 2, PAINT)
    bx(m, -Wd / 2 + 0.08, Wd / 2 - 0.08, 0.85, 1.38, -L / 2 + 0.85, L / 2 - 1.35, PALM, GLASS)
    bx(m, -Wd / 2 + 0.06, Wd / 2 - 0.06, 1.36, 1.44, -L / 2 + 0.95, L / 2 - 1.45, PAINT)
    for zz in (-L / 2 + 0.85, -0.2, L / 2 - 1.4):
        bx(m, -Wd / 2 + 0.07, Wd / 2 - 0.07, 0.85, 1.38, zz, zz + 0.07, PAINT)
    for s in (-1, 1):
        bx(m, s * 0.6 - 0.2, s * 0.6 + 0.2, 0.62, 0.75, L / 2 - 0.02, L / 2 + 0.02, PALM, LIGHT)
        bx(m, s * 0.65 - 0.18, s * 0.65 + 0.18, 0.62, 0.74, -L / 2 - 0.02, -L / 2 + 0.02, PALM, AWN_R)
    bx(m, -Wd / 2 - 0.02, Wd / 2 + 0.02, 0.28, 0.4, -L / 2 - 0.05, -L / 2 + 0.1, PALM, RUBBER)
    bx(m, -Wd / 2 - 0.02, Wd / 2 + 0.02, 0.28, 0.4, L / 2 - 0.1, L / 2 + 0.05, PALM, RUBBER)
    wheels(m, (-Wd / 2 + 0.1, Wd / 2 - 0.1), (-L / 2 + 0.8, L / 2 - 0.8))
    return m.build('city_cp_car')


def van():
    m = MB(MATS)
    L, Wd = 5.0, 1.95
    bx(m, -Wd / 2, Wd / 2, 0.35, 2.3, -L / 2, L / 2 - 1.2, PAINT)
    bx(m, -Wd / 2, Wd / 2, 0.35, 1.05, L / 2 - 1.2, L / 2, PAINT)
    bx(m, -Wd / 2 + 0.05, Wd / 2 - 0.05, 1.05, 2.0, L / 2 - 1.2, L / 2 - 0.5, PALM, GLASS, rot=(-0.5, 0, 0))
    bx(m, -Wd / 2 - 0.01, Wd / 2 + 0.01, 1.2, 1.9, L / 2 - 1.9, L / 2 - 1.25, PALM, GLASS)
    bx(m, -Wd / 2 - 0.02, Wd / 2 + 0.02, 0.9, 1.0, -L / 2 + 0.3, L / 2 - 2.0, PAL2, P_TUBE)   # แถบข้างรถ
    for s in (-1, 1):
        bx(m, s * 0.65 - 0.18, s * 0.65 + 0.18, 0.7, 0.82, L / 2 - 0.02, L / 2 + 0.02, PALM, LIGHT)
    wheels(m, (-Wd / 2 + 0.12, Wd / 2 - 0.12), (-L / 2 + 0.9, L / 2 - 0.9), 0.36)
    return m.build('city_cp_van')


def bus():
    """รถเมล์แดง 2 ชั้น 10.5 × 2.5 × 4.4 ม. • หน้า = +z • ป้ายเส้นทางเรือง"""
    m = MB(MATS)
    L, Wd = 10.4, 2.5
    bx(m, -Wd / 2, Wd / 2, 0.35, 4.3, -L / 2, L / 2, PAL2, P_BUS)
    for y0, y1 in ((1.15, 2.05), (2.65, 3.6)):                                            # แถวหน้าต่าง 2 ชั้น
        bx(m, -Wd / 2 - 0.02, Wd / 2 + 0.02, y0, y1, -L / 2 + 0.4, L / 2 - 0.4, PALM, GLASS_LIT)
        for k in range(9):
            z = -L / 2 + 0.4 + k * (L - 0.8) / 8
            bx(m, -Wd / 2 - 0.04, Wd / 2 + 0.04, y0, y1, z - 0.06, z + 0.06, PAL2, P_BUS)
        bx(m, -Wd / 2 + 0.15, Wd / 2 - 0.15, y0, y1, L / 2 - 0.02, L / 2 + 0.02, PALM, GLASS_LIT)
    bx(m, -Wd / 2 - 0.03, Wd / 2 + 0.03, 2.2, 2.45, -L / 2, L / 2, PALM, CREAM)            # แถบครีมคั่นชั้น
    bx(m, -0.8, 0.8, 3.7, 4.05, L / 2 + 0.0, L / 2 + 0.04, PALM, LIGHT)                    # ป้ายเส้นทาง
    bx(m, -Wd / 2 - 0.03, Wd / 2 + 0.03, 0.3, 0.5, -L / 2 - 0.03, L / 2 + 0.03, PALM, BLACK)
    for s in (-1, 1):
        bx(m, s * 0.95 - 0.15, s * 0.95 + 0.15, 0.6, 0.8, L / 2, L / 2 + 0.04, PALM, LIGHT)
    bx(m, -Wd / 2 + 0.1, Wd / 2 - 0.1, 4.3, 4.38, -L / 2 + 0.1, L / 2 - 0.1, PAL2, P_MULL)
    wheels(m, (-Wd / 2 + 0.15, Wd / 2 - 0.15), (-L / 2 + 1.8, L / 2 - 2.2), 0.5, 0.32)
    return m.build('city_cp_bus')


def container():
    """ตู้คอนเทนเนอร์ 12.2 × 2.44 × 2.6 ม. — ตัวตู้ใช้ city_paint (เกมย้อมสี) • ยาวตามแกน x"""
    m = MB(MATS)
    L, Wd, H = 12.2, 2.44, 2.6
    bx(m, -L / 2 + 0.1, L / 2 - 0.1, 0.1, H - 0.1, -Wd / 2 + 0.05, Wd / 2 - 0.05, PAINT)
    n = 30
    for k in range(n):
        x = -L / 2 + 0.3 + k * (L - 0.6) / (n - 1)
        bx(m, x - 0.07, x + 0.07, 0.15, H - 0.15, -Wd / 2, Wd / 2, PAINT)
    for xs in (-1, 1):
        for zs in (-1, 1):                                                                # เสามุมตู้
            bx(m, xs * (L / 2 - 0.1) - 0.1, xs * (L / 2 - 0.1) + 0.1, 0, H, zs * (Wd / 2 - 0.1) - 0.1, zs * (Wd / 2 - 0.1) + 0.1, PAL2, P_MULL)
    for y in (0.0, H - 0.12):
        bx(m, -L / 2, L / 2, y, y + 0.12, -Wd / 2, Wd / 2, PAL2, P_MULL)
    for zz in (-0.4, 0.4):                                                                   # คานล็อกประตู
        bx(m, L / 2 - 0.08, L / 2 + 0.02, 0.2, H - 0.2, zz - 0.03, zz + 0.03, PAL2, P_MULL)
    return m.build('city_cp_container')


def train():
    """ตู้รถไฟ 17 × 2.8 × 3.8 ม. ยาวตามแกน x — สีส้ม/ขาวแบบรถไฟลอนดอน"""
    m = MB(MATS)
    L, Wd = 17.0, 2.8
    bx(m, -L / 2, L / 2, 0.6, 3.5, -Wd / 2, Wd / 2, PALM, CREAM)
    bx(m, -L / 2 + 0.1, L / 2 - 0.1, 3.5, 3.8, -Wd / 2 + 0.2, Wd / 2 - 0.2, PAL2, P_MULL)
    bx(m, -L / 2, L / 2, 0.6, 1.1, -Wd / 2 - 0.02, Wd / 2 + 0.02, PAL2, P_HAZ)
    bx(m, -L / 2 + 0.5, L / 2 - 0.5, 1.6, 2.7, -Wd / 2 - 0.03, Wd / 2 + 0.03, PALM, GLASS_LIT)
    for k in range(9):
        x = -L / 2 + 0.5 + k * (L - 1) / 8
        bx(m, x - 0.1, x + 0.1, 1.6, 2.7, -Wd / 2 - 0.05, Wd / 2 + 0.05, PALM, CREAM)
    for x in (-L / 4, L / 4):
        bx(m, x - 0.7, x + 0.7, 0.7, 3.0, -Wd / 2 - 0.05, Wd / 2 + 0.05, PAL2, P_HAZ)        # ประตู
    for x in (-L / 2 + 2.5, L / 2 - 2.5):
        bx(m, x - 1.3, x + 1.3, 0.0, 0.6, -Wd / 2 + 0.3, Wd / 2 - 0.3, PALM, RUBBER)          # โบกี้ล้อ
    return m.build('city_cp_train')


# ---------------- ของในเมือง ----------------
def tlight():
    m = MB(MATS)
    m.grid(g_cyl(0.07, 0.09, 3.0, 8), trs3((0, 1.5, 0)), PALM, IRON)
    bx(m, -0.2, 0.2, 2.2, 3.3, -0.15, 0.15, PALM, BLACK)
    for k, sw in enumerate((AWN_R, GLASS_LIT, None)):
        y = 3.1 - k * 0.36
        if sw is None:
            m.grid(g_cyl(0.11, 0.11, 0.05, 10), trs3((0, y, 0.16), (PI / 2, 0, 0)), PAL2, P_GREEN)
        else:
            m.grid(g_cyl(0.11, 0.11, 0.05, 10), trs3((0, y, 0.16), (PI / 2, 0, 0)), PALM, sw)
        bx(m, -0.15, 0.15, y + 0.12, y + 0.15, 0.15, 0.32, PALM, BLACK)
    bx(m, -0.2, 0.2, 1.0, 1.25, 0.1, 0.18, PALM, CREAM)                                      # ปุ่มข้ามถนน
    return m.build('city_cp_tlight')


def busstop():
    """ป้ายรถเมล์มีหลังคา 3.6 ม. หันหน้า +z + ป้ายวงกลมแดง"""
    m = MB(MATS)
    for x in (-1.75, 1.75):
        bx(m, x - 0.05, x + 0.05, 0, 2.5, -0.7, -0.6, PALM, IRON)
        bx(m, x - 0.05, x + 0.05, 0, 2.5, 0.5, 0.6, PALM, IRON)
    bx(m, -1.8, 1.8, 2.45, 2.55, -0.75, 0.75, PAL2, P_MULL)
    bx(m, -1.75, 1.75, 0.3, 2.4, -0.68, -0.64, PAL2, P_GLASS_LIT)
    bx(m, 1.72, 1.78, 0.3, 2.4, -0.6, 0.55, PAL2, P_GLASS_LIT)
    bx(m, -1.4, 1.4, 0.45, 0.52, -0.6, -0.3, PALM, IRON)
    m.grid(g_cyl(0.05, 0.05, 3.0, 6), trs3((-2.1, 1.5, 0.4)), PALM, IRON)
    m.grid(g_cyl(0.32, 0.32, 0.06, 16), trs3((-2.1, 3.0, 0.4), (PI / 2, 0, 0)), PALM, RED)
    m.grid(g_cyl(0.2, 0.2, 0.07, 16), trs3((-2.1, 3.0, 0.4), (PI / 2, 0, 0)), PALM, CREAM)
    return m.build('city_cp_busstop')


def bin_():
    m = MB(MATS)
    m.grid(g_cyl(0.28, 0.24, 0.95, 10), trs3((0, 0.48, 0)), PALM, BLACK)
    m.grid(g_cyl(0.3, 0.3, 0.08, 10), trs3((0, 0.98, 0)), PALM, GOLD)
    return m.build('city_cp_bin')


def bollard():
    m = MB(MATS)
    m.grid(g_cyl(0.11, 0.13, 0.9, 8), trs3((0, 0.45, 0)), PALM, BLACK)
    m.grid(g_sphere(0.12, 8, 4, tl=PI / 2), trs3((0, 0.9, 0)), PALM, BLACK)
    bx(m, -0.12, 0.12, 0.7, 0.76, -0.12, 0.12, PALM, GOLD)
    return m.build('city_cp_bollard')


def tube():
    """ป้ายรถไฟใต้ดิน: วงกลมแดง + แถบน้ำเงิน บนเสา 3.2 ม. (ไฟเรือง)"""
    m = MB(MATS)
    m.grid(g_cyl(0.07, 0.09, 3.2, 8), trs3((0, 1.6, 0)), PALM, IRON)
    m.grid(g_torus(0.42, 0.1, 6, 20), trs3((0, 3.3, 0)), PALM, AWN_R)
    m.grid(g_cyl(0.33, 0.33, 0.06, 20), trs3((0, 3.3, 0), (PI / 2, 0, 0)), PALM, LIGHT)
    bx(m, -0.62, 0.62, 3.2, 3.4, -0.06, 0.06, PAL2, P_TUBE)
    return m.build('city_cp_tube')


def planter():
    m = MB(MATS)
    bx(m, -0.9, 0.9, 0, 0.6, -0.45, 0.45, PAL2, P_STONE)
    for k in range(5):
        m.grid(g_sphere(0.35, 8, 6), trs3((-0.65 + k * 0.33, 0.75, (k % 2 - 0.5) * 0.25)), PAL2, P_HEDGE)
    return m.build('city_cp_planter')


def bush():
    m = MB(MATS)
    for x, y, z, r in ((0, 0.5, 0, 0.7), (0.5, 0.4, 0.2, 0.5), (-0.45, 0.38, -0.15, 0.5), (0.1, 0.8, -0.2, 0.45)):
        m.grid(g_sphere(r, 9, 6), trs3((x, y, z)), PAL2, P_HEDGE)
    return m.build('city_cp_bush')


def cone():
    m = MB(MATS)
    bx(m, -0.22, 0.22, 0, 0.05, -0.22, 0.22, PALM, AWN_R)
    m.grid(g_cyl(0.03, 0.17, 0.7, 10), trs3((0, 0.4, 0)), PALM, AWN_R)
    m.grid(g_cyl(0.11, 0.13, 0.12, 10), trs3((0, 0.45, 0)), PALM, CREAM)
    return m.build('city_cp_cone')


def barrier():
    m = MB(MATS)
    for x in (-0.9, 0.9):
        bx(m, x - 0.04, x + 0.04, 0, 1.0, -0.04, 0.04, PALM, IRON)
        bx(m, x - 0.25, x + 0.25, 0, 0.06, -0.15, 0.15, PALM, IRON)
    for k in range(6):
        x = -0.9 + k * 0.3
        bx(m, x, x + 0.3, 0.7, 0.95, -0.03, 0.03, PALM, AWN_R if k % 2 else CREAM)
    return m.build('city_cp_barrier')


def pallet():
    m = MB(MATS)
    for x in (-0.5, 0, 0.5):
        bx(m, x - 0.06, x + 0.06, 0, 0.1, -0.6, 0.6, PALM, WOOD)
    for k in range(5):
        z = -0.55 + k * 0.275
        bx(m, -0.6, 0.6, 0.1, 0.14, z - 0.06, z + 0.06, PALM, WOOD)
    bx(m, -0.5, 0.5, 0.14, 0.95, -0.5, 0.5, PAL2, P_SHUT)                                    # ห่อสินค้า
    return m.build('city_cp_pallet')


def crane():
    """ปั้นจั่นหอสูง 46 ม. + แขนยาว 30 ม. (เสาตาข่ายเหลือง) • ฐานกว้าง 2.6 ม."""
    m = MB(MATS)
    H = 46.0
    for sx in (-1, 1):
        for sz in (-1, 1):
            bx(m, sx * 1.2 - 0.12, sx * 1.2 + 0.12, 0, H, sz * 1.2 - 0.12, sz * 1.2 + 0.12, PAL2, P_HAZ)
    for k in range(int(H / 2.4)):
        y = k * 2.4 + 1.2
        bx(m, -1.2, 1.2, y, y + 0.1, -1.25, -1.15, PAL2, P_HAZ, rot=(0, 0, 0.75 * (1 if k % 2 else -1)))
        bx(m, -1.2, 1.2, y, y + 0.1, 1.15, 1.25, PAL2, P_HAZ, rot=(0, 0, 0.75 * (1 if k % 2 else -1)))
    bx(m, -1.6, 1.6, H, H + 2.2, -1.6, 1.6, PAL2, P_CONC)                                    # ห้องคนขับ
    bx(m, -1.0, 1.0, H + 0.7, H + 1.8, 1.55, 1.65, PALM, GLASS_LIT)
    bx(m, -8, 30, H + 2.2, H + 3.2, -0.8, 0.8, PAL2, P_HAZ)                                  # แขน
    bx(m, -12, -8, H + 1.5, H + 3.4, -1.2, 1.2, PAL2, P_CONC2)                               # ถ่วง
    m.grid(g_cyl(0.02, 0.02, 18, 4), trs3((24, H + 2.2 - 9, 0)), PALM, IRON)                 # สลิง
    bx(m, 23.5, 24.5, H - 7.2, H - 6.8, -0.5, 0.5, PALM, IRON)
    bx(m, -0.15, 0.15, H + 5, H + 5.3, -0.15, 0.15, PALM, AWN_R)                             # ไฟเตือนแดง
    return m.build('city_cp_crane')


def boat():
    """เรือขนของเล็ก 14 × 4.5 ม. ยาวตามแกน z"""
    m = MB(MATS)
    L, Wd = 14.0, 4.5
    bx(m, -Wd / 2, Wd / 2, -0.8, 1.2, -L / 2 + 1.2, L / 2 - 1.5, PAL2, P_TUBE)
    bx(m, -Wd / 2 + 0.6, Wd / 2 - 0.6, -0.6, 1.2, L / 2 - 1.5, L / 2, PAL2, P_TUBE)
    bx(m, -Wd / 2, Wd / 2, 1.1, 1.3, -L / 2 + 1.2, L / 2 - 1.5, PALM, CREAM)
    bx(m, -1.4, 1.4, 1.3, 3.8, -L / 2 + 1.6, -L / 2 + 4.6, PALM, CREAM)                       # ห้องเรือ
    bx(m, -1.3, 1.3, 2.6, 3.4, -L / 2 + 4.55, -L / 2 + 4.65, PALM, GLASS_LIT)
    m.grid(g_cyl(0.25, 0.25, 1.4, 10), trs3((0, 4.4, -L / 2 + 2.6)), PALM, BLACK)            # ปล่อง
    return m.build('city_cp_boat')


def kiosk():
    """ซุ้มขายหนังสือพิมพ์ 6 × 4 × 3 ม. (ยืดตามกล่องในผัง)"""
    m = MB(MATS)
    bx(m, -3, 3, 0, 2.6, -2, 2, PAL2, P_BUS)
    bx(m, -2.6, 2.6, 1.0, 2.2, 1.98, 2.04, PALM, GLASS_LIT)
    bx(m, -3.2, 3.2, 2.6, 3.0, -2.2, 2.6, PAL2, P_MULL)
    bx(m, -2.8, 2.8, 2.65, 2.95, 2.6, 2.64, PALM, LIGHT)
    bx(m, -2.6, 2.6, 0.9, 1.0, 2.0, 2.5, PALM, WOOD)                                       # เคาน์เตอร์
    return m.build('city_cp_kiosk')


def stand():
    """อัฒจันทร์ 1 ช่วง กว้าง 4 ม. ลึก 9 ม. สูง 4.5 ม. • ด้านสนาม = +z (ขั้นบันไดหันหาสนาม)"""
    m = MB(MATS)
    n = 6
    for k in range(n):
        y = 0.75 * (k + 1)
        z = 4.5 - k * 1.5
        bx(m, -MW / 2, MW / 2, 0, y, z - 1.5, z, PAL2, P_CONC)
        bx(m, -MW / 2 + 0.05, MW / 2 - 0.05, y, y + 0.35, z - 0.6, z - 0.15, PAL2, P_TUBE if k % 2 else P_BUS)   # ที่นั่ง
    bx(m, -MW / 2, MW / 2, 4.5, 5.6, -4.5, -4.3, PAL2, P_CONC2)
    return m.build('city_cs_stand')


# ---------------- ภาพตัวอย่างชุดที่ 2 (เรียกจากท้าย city_kit_build.py) ----------------
def demo2(shot, all_src):
    for o in bpy.context.scene.objects:
        if o.type == 'MESH':
            o.hide_render = True
    c2 = bpy.data.collections.new('demo2'); bpy.context.scene.collection.children.link(c2)
    S = {o.name: o for o in all_src}

    def put(name, x, y, z, rz=0.0):
        o = S['city_' + name].copy(); c2.objects.link(o); o.hide_render = False
        o.location = (x, -z, y); o.rotation_euler = (0, 0, rz); return o

    def facade(x0, k, n, ground, upper, top, corner, fl=MH):
        for i in range(k):
            x = x0 + (i - (k - 1) / 2) * MW
            put(ground(i), x, 0, 0)
            for f in range(1, n):
                put(upper(i, f), x, f * fl, 0)
            put(top, x, n * fl, 0)
        for s in (-1, 1):
            for f in range(n):
                put(corner, x0 + s * k * MW / 2, f * fl, 0)
    rr = random.Random(4)
    facade(-26, 3, 4, lambda i: 'co_lobby' if i == 1 else 'co_win_d', lambda i, f: 'co_win' if rr.random() < 0.6 else 'co_win_d', 'co_top', 'co_corner')
    facade(-11, 3, 7, lambda i: 'cg_lobby', lambda i, f: 'cg_win' if rr.random() < 0.5 else 'cg_win_d', 'cg_top', 'cg_corner')
    facade(5, 4, 3, lambda i: 'cw_door' if i == 1 else 'cw_wall', lambda i, f: 'cw_win' if f == 2 else ('cw_wall_b' if i % 2 else 'cw_wall'), 'cw_top', 'cw_corner')
    facade(23, 3, 3, lambda i: 'cc_entry' if i == 1 else 'cc_open', lambda i, f: 'cc_open', 'cc_top', 'cc_corner')
    g = MB(MATS); bx(g, -40, 40, -0.15, 0, -2, 14, PALM, RUBBER); g.build('demo2_ground', c2)
    shot('shots/city_kit_buildings.png', (0, -48, 14), (0, 0, 9))
    for o in list(c2.objects):
        o.hide_render = True
    # ยานพาหนะ
    x = -20
    for n, w in (('cp_bus', 4.5), ('cp_car', 3.2), ('cp_van', 3.4), ('cp_taxi', 4)):
        put(n, x, 0, 0); x += w
    put('cp_train', x + 9.5, 0, -3); put('cp_container', x + 9.5, 0, 2); put('cp_container', x + 9.5, 2.6, 2)
    put('cp_boat', 26, 0, -2)
    g = MB(MATS); bx(g, -40, 40, -0.15, 0, -14, 10, PALM, STONE); g.build('demo2_ground2', c2)
    shot('shots/city_kit_vehicles.png', (2, -30, 9), (2, 0, 1.5))
    for o in list(c2.objects):
        if not o.name.startswith('demo2_ground2'):
            o.hide_render = True
    # ของริมทาง
    x = -15
    for n in ('tlight', 'busstop', 'bin', 'bollard', 'tube', 'planter', 'bush', 'cone', 'barrier', 'pallet', 'kiosk'):
        w = 5.5 if n in ('busstop', 'kiosk') else 2.4
        put('cp_' + n, x + w / 2, 0, 0); x += w
    put('cs_stand', x + 3, 0, 0)
    shot('shots/city_kit_props.png', (0, -17, 5), (0, 0, 1.4))
    for o in list(c2.objects):
        o.hide_render = True
    put('cp_crane', 0, 0, 0)
    g = MB(MATS); bx(g, -30, 40, -0.15, 0, -20, 20, PALM, STONE); g.build('demo2_ground3', c2)
    shot('shots/city_kit_crane.png', (-30, -70, 30), (8, 0, 26))


# ---------------- แผ่นผนังที่แตกแล้ว (ขั้น 4 — เกมสลับแผ่นปกติเป็นแผ่นนี้เมื่อเลือดแผ่นหมด) ----------------
# ขอบผนังเหลือเป็นฟันเลื่อย (รูใหญ่ เหลือขอบบาง — ผู้ใช้ 2026-10-28) • ใช้วัสดุตามชนิดตึก
# open=False: ข้างในมืด (เห็นพื้นชั้น + เหล็กเส้น) — ชั้นที่ตึกยังทึบ • open=True (<ชื่อ>o): โล่ง ไม่มีแผ่นดำ/พื้น/เพดานปลอม — ชั้นที่เดินเข้าได้ (เกมมีห้องจริง)
def hole(name, mt, sw, seed, open_=False):
    rr = random.Random(seed)
    m = MB(MATS)
    w = (lambda x0, x1, y0, y1, z0=-TH, z1=0.0: bx(m, x0, x1, y0, y1, z0, z1, mt, sw))
    w(-MW / 2, MW / 2, 0, 0.12 + rr.random() * 0.2)                                        # ตอผนังล่าง
    w(-MW / 2, MW / 2, MH - 0.18 - rr.random() * 0.18, MH)                                  # คานบน
    for s in (-1, 1):                                                                       # ขอบซ้าย/ขวา ฟันเลื่อย
        for k in range(6):
            y0 = k * MH / 6
            ww = 0.12 + rr.random() * 0.4
            x = s * MW / 2
            w(min(x, x - s * ww), max(x, x - s * ww), y0, y0 + MH / 6)
    for k in range(5):                                                                      # เศษห้อยจากคาน
        x = -1.4 + k * 0.7 + rr.uniform(-0.2, 0.2)
        h = 0.1 + rr.random() * 0.35
        w(x - 0.2, x + 0.2, MH - 0.35 - h, MH - 0.3)
    if not open_:
        bx(m, -MW / 2, MW / 2, 0.05, 0.25, -2.5, -TH, PAL2, P_CONC2)                        # พื้นชั้นด้านใน
        bx(m, -MW / 2, MW / 2, MH - 0.35, MH - 0.15, -2.5, -TH, PAL2, P_CONC2)              # เพดาน
        bx(m, -MW / 2, MW / 2, 0, MH, -2.6, -2.5, PALM, BLACK)                              # ข้างในมืด
    for k in range(4):                                                                      # เหล็กเส้นโผล่
        x = rr.uniform(-1.6, 1.6)
        bx(m, x - 0.02, x + 0.02, MH - 0.6 - rr.random() * 0.6, MH - 0.3, -0.25, -0.2, PALM, IRON, rot=(0, 0, rr.uniform(-0.4, 0.4)))
    if not open_:
        for k in range(5):                                                                  # เศษกองบนพื้นด้านใน
            x = rr.uniform(-1.6, 1.6)
            s3 = 0.2 + rr.random() * 0.25
            bx(m, x - s3, x + s3, 0.25, 0.25 + s3, -1.2 - rr.random(), -0.5, mt, sw, rot=(0, rr.random() * 3, 0))
    return m.build('city_' + name)


HSPEC = [('ct_hole', BRICK, None, 1), ('co_hole', PAL2, P_STONE, 2), ('cg_hole', PAL2, P_MULL, 3), ('cw_hole', PAL2, P_COR, 4), ('cc_hole', PAL2, P_CONC, 5)]
holes = [hole(n, a, b, c) for n, a, b, c in HSPEC] + [hole(n + 'o', a, b, c, True) for n, a, b, c in HSPEC]
for o in holes:
    if o.name.startswith('city_ct_hole'):
        brick_uv(o)
    export([o], 'assets/city/%s.glb' % o.name[len('city_'):])
