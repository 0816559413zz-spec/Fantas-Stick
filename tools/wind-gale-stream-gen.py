# GaleBurst (BA เสริมพลังของสายลม) แบบ "ลมสมจริง" — ผู้ใช้ขอ 2026-11-07: เกจเต็ม → กดโจมตีปกติค้าง → ยิงลมกรวยกว้างต่อเนื่องนานขึ้น ผลักเบา ๆ
# ใช้: python tools/wind-gale-stream-gen.py แล้ว node tools/fx-check.js • ดู studio.html?fx=wind/gale_stream (at=self: ผู้ร่ายอยู่ที่ 0 หันทาง +z)
# ไฟล์: wind/gale_stream (วนจนสั่งหยุด fxStop → ชั้น end ค่อยจาง) • wind/gale_charge (เตรียม 0.3 วิ ก่อนยิง) • mesh/wind_real_cone
# ตัวเลขตรงโค้ด js/09-wind.js WNV: ระยะ 340 px = 17 ม. • รัศมีต้นทาง 10 px (0.5 ม.) ปลาย 62 px (3.1 ม.) • ขึ้นเต็มระยะใน 0.15 วิ
# แนวคิด: ลมจริง = ฝุ่น/อากาศขุ่นสีขาวเทาอุ่น มีเส้นลมไหลเร็ว + ฝุ่นพื้นพ่นไปข้างหน้า + ใบไม้ปลิว (ไม่ใช้หมึก/ริบบิ้นการ์ตูน) เขียวนิดเดียวแบบ Windrift
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def save(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=1),encoding='utf-8')
LEN=17.0;R0=.5;R1=3.1;MZ=[0.0,1.15,0.5]
WHITE='#ffffff';MINT='#d8ffe0';GREEN='#8dff65';DUST='#cfc7b0';DUST2='#9d957f';AIR='#e8efea'
# ---------------- mesh: กรวยลม (lathe รัศมี/ความยาว normalized: รัศมีปลาย 1, ยาว 1) ----------------
prof=[(R0/R1,0),(.2,.08),(.34,.3),(.55,.56),(.78,.8),(1.0,1.0)]
save(ROOT/'assets/fx/mesh/wind_real_cone.mesh.json',{'v':1,'desc':'GaleBurst (สมจริง): กรวยลมนอน รัศมีปลาย 1 ยาว 1 (ยืดด้วย scale; ใช้ rot [-90,0,0] ให้ยาวไปทาง +z)','mat':'solid','pal':'wind','tags':['wind','galeburst'],
    'parts':[{'id':'l','k':'lathe','prof':[[round(a,3),round(b,3)] for a,b in prof],'seg':48}]})
def cone(lid,at,life,tex,col,op,scale,tile,scroll,spin=0,loop=False,end=False):
    d={'id':lid,'t':'mesh','at':at,'life':life,'att':'feet','shape':'model','model':'wind_real_cone','mat':'tex','tex':tex,'col':col,'col2':'#000000','rim':0,
       'uvTile':list(tile),'uvScroll':list(scroll),'pos':list(MZ),'rot':[-90,0,0],'scale':scale,'op':op,'spin':spin,'fade':0}
    if loop:d['loop']=True
    if end:d['end']=True
    return d
SMOKE=dict(look='smoke',curl=True)
def emit(lid,at,life,pos,frm,loop=True,end=False,**k):
    d={'id':lid,'t':'emit','at':at,'life':life,'att':'feet','pos':list(pos),'from':frm,'gravity':0,'drag':1}
    d.update(k)
    if loop:d['loop']=True
    if end:d['end']=True
    return d
INTRO=.3;LOOP=.9
def stream():
    L=[]
    S=lambda y:[R1,y,R1]
    # (spin หมุนรอบแกนตั้งของเอฟเฟกต์ ไม่ใช่แกนกรวย → ห้ามใช้กับกรวย ใช้ uvScroll แกน u ให้ลมวนรอบแทน)
    # ---- กรวยอากาศ: ช่วงขึ้น 0.3 วิ (ยืดออกไปสุดระยะ) แล้ววนต่อเนื่อง ----
    cones=[('dust','tex/wind_dust',AIR,.34,[2,3],[.45,-1.6],0),
           ('rise','tex/wind_air_rise',WHITE,.5,[3,4],[-.6,-2.4],0),
           ('rise2','tex/wind_air_rise',MINT,.28,[2,5],[.8,-3.4],0),
           ('tint','tex/wind_dust',DUST,.2,[1,2],[.3,-1.1],0)]
    for nm,tx,col,op,tile,scr,spn in cones:
        L.append(cone('i_'+nm,0,INTRO,tx,col,{'0':0,'0.35':op,'1':op},{'0':[R1*.3,2,R1*.3],'1':S(LEN),'ease':'out'},tile,scr,spn))
        L.append(cone('c_'+nm,INTRO,LOOP,tx,col,{'0':op,'1':op},{'0':S(LEN),'1':S(LEN)},tile,scr,spn,loop=True))
        L.append(cone('e_'+nm,0,.35,tx,col,{'0':op,'1':0},{'0':S(LEN),'1':S(LEN)},tile,scr,spn,end=True))
    # ---- อนุภาค (วน) ----
    L.append(emit('puff',0,LOOP,MZ,'sphere',fr=.25,dir='aim',spread=.2,speed=[14,22],plife=[.45,.85],size=[2.2,4.2],grow=.6,col=AIR,c2='#b9c4bd',rate=60,**SMOKE))
    L.append(emit('dustline',0,LOOP,[0,.1,.8],'line',fh=LEN-1.5,dir='aim',spread=.5,up=[.1,.7],speed=[4,9],plife=[.5,1.0],size=[3,5.5],grow=.6,col=DUST,c2=DUST2,rate=70,drag=1.4,x=True,**SMOKE))
    L.append(emit('streak',0,LOOP,MZ,'sphere',fr=.3,dir='aim',spread=.14,speed=[24,38],plife=[.18,.34],look='streak',size=[1.4,3],col=WHITE,c2=MINT,rate=110,drag=.3,curl=False))
    L.append(emit('streak2',0,LOOP,MZ,'sphere',fr=.4,dir='aim',spread=.3,speed=[16,26],plife=[.25,.45],look='streak',size=[1.2,2.4],col=AIR,c2=GREEN,rate=70,drag=.6,curl=True))
    L.append(emit('leaves',0,LOOP,MZ,'sphere',fr=.4,dir='aim',spread=.32,speed=[12,20],plife=[.6,1.0],look='model',model='wind_leaf',mmat='glow',msize=[.1,.2],col=GREEN,c2='#2ec772',mspin=520,rate=12,gravity=-.25,drag=.8,bounce=0,x=True))
    L.append(emit('grit',0,LOOP,[0,.15,1.0],'line',fh=LEN-2,dir='aim',spread=.6,up=[.5,2.2],speed=[7,14],plife=[.35,.7],look='streak',size=[.5,1.1],col=DUST,c2=DUST2,rate=40,gravity=2,drag=1,curl=False,x=True))
    L.append({'id':'haze','t':'warp','at':0,'life':LOOP,'loop':True,'att':'feet','pos':[0,1.3,7.5],'kind':'haze','size':6,'str':.45,'op':1,'col':WHITE,'glow':0,'x':True})
    L.append({'id':'muzzle','t':'halo','at':0,'life':LOOP,'loop':True,'att':'feet','pos':[.35,1.3,.7],'col':GREEN,'size0':.9,'size':1.1,'k':.5})
    L.append({'id':'rumble','t':'screen','at':0,'life':LOOP,'loop':True,'shake':.5,'own':True})
    # ---- จบ: พ่นลมสุดท้าย + ฝุ่นฟุ้ง ----
    L.append(emit('x_puff',0,.12,MZ,'sphere',loop=False,end=True,fr=.3,dir='aim',spread=.3,speed=[10,18],plife=[.5,.9],size=[2.5,4.5],grow=.6,col=AIR,c2='#b9c4bd',rate=140,**SMOKE))
    L.append(emit('x_dust',0,.12,[0,.1,6],'line',loop=False,end=True,fh=10,dir='out',spread=.8,up=[.2,1],speed=[2,5],plife=[.8,1.4],size=[3,5.5],grow=.7,col=DUST,c2=DUST2,rate=60,drag=1.6,x=True,**SMOKE))
    return {'v':1,'desc':'GaleBurst แบบลมสมจริง (ยิงต่อเนื่องตอนกดค้าง): กรวยอากาศขุ่นสีขาวเทาไหลเร็ว 17 ม. กว้างปลาย ~6 ม. + ฝุ่นพื้นพ่นไปข้างหน้า + เส้นลม + ใบไม้ + อากาศบิด; ตามตัวผู้ร่าย (follow) วนจนสั่งหยุด — ชั้น end ค่อยจาง + พ่นฝุ่นท้าย','tags':['wind','galeburst','loop'],'pal':'wind','dur':INTRO+LOOP,'seed':27,'layers':L}
def charge():
    L=[]
    L.append(emit('in',0,.28,[0,1.2,.4],'sphere',loop=False,fr=2.2,dir='in',speed=[7,12],plife=[.15,.28],look='streak',size=[1.2,2.4],col=WHITE,c2=GREEN,rate=140,drag=0,curl=False))
    L.append(emit('dust',0,.28,[0,.08,.5],'ring',loop=False,fr=1.8,dir='in',speed=[3,6],up=[.2,.8],plife=[.3,.5],size=[2.5,4],col=DUST,c2=DUST2,rate=50,drag=1,x=True,**SMOKE))
    L.append(emit('leaf',0,.28,[0,1,.3],'sphere',loop=False,fr=1.6,dir='in',speed=[4,8],plife=[.2,.35],look='model',model='wind_leaf',mmat='glow',msize=[.1,.18],col=GREEN,c2='#2ec772',mspin=500,rate=14,x=True))
    L.append({'id':'glow','t':'halo','at':0,'life':.3,'att':'feet','pos':[.35,1.3,.7],'col':GREEN,'size0':.2,'size':1.0,'k':.6})
    L.append({'id':'haze','t':'warp','at':.05,'life':.25,'att':'feet','pos':[0,1.2,.8],'kind':'haze','size':2,'str':.4,'op':{'0':0,'0.4':1,'1':0},'col':WHITE,'glow':0,'x':True})
    return {'v':1,'desc':'GaleBurst เตรียมยิง 0.3 วิ: เส้นลม/ฝุ่น/ใบไม้ถูกดูดเข้าหาไม้ แสงเขียวที่ปลายไม้โตขึ้น (ตามตัวผู้ร่าย)','tags':['wind','galeburst','charge'],'pal':'wind','dur':.35,'seed':28,'layers':L}
save(ROOT/'assets/fx/wind/gale_stream.fx.json',stream())
save(ROOT/'assets/fx/wind/gale_charge.fx.json',charge())
print('wind/gale_stream, wind/gale_charge, mesh/wind_real_cone')
