# ใบมีดลม (โจมตีปกติสายลม) → "ลมพัดไป" — ผู้ใช้ขอ 2026-11-07: VFX เป็นเหมือนสายลมพัดไป ไกลขึ้นแต่ช้าลงนิดนึง
# ใช้: python tools/wind-ba-gust-gen.py แล้ว node tools/fx-check.js • ดู studio.html?fx=wind/ba_gust_fly / wind/ba_gust_hit
# ไฟล์: wind/ba_gust_fly (ตามกระสุน: หัวลมพุ่งไป หางลมบางพัดตามหลัง + ฝุ่น/เส้นลม/ใบไม้) • wind/ba_gust_hit (ลมกระแทกแตกกระจาย)
# กระสุนอยู่ที่ pos 0 หันไป +z (เอฟเฟกต์ถูกเล่นตามกระสุน) • ใช้กรวย mesh/wind_real_cone (หัวเล็ก-ท้ายบาน) หันหางไป -z
# ไม่ใช้ใบมีดทึบ/หมึก/ริบบิ้นการ์ตูน — เป็นอากาศขุ่นโปร่ง ๆ แบบกระแสลมจริง
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def save(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=1),encoding='utf-8')
WHITE='#ffffff';MINT='#d8ffe0';GREEN='#8dff65';AIR='#e8efea';DUST='#cfc7b0';DUST2='#9d957f'
SMOKE=dict(look='smoke',curl=True)
def emit(lid,at,life,pos,frm,loop=False,**k):
    d={'id':lid,'t':'emit','at':at,'life':life,'att':'point','pos':list(pos),'from':frm,'gravity':0,'drag':1}
    d.update(k)
    if loop:d['loop']=True
    return d
def tail(lid,tex,col,op,length,width,tile,scroll,at=0):
    # หัวเล็กอยู่ที่ pos (กระสุน) ท้ายบานไปข้างหลัง (-z) : rot +90 พลิกแกน y ของกรวยไป -z
    return {'id':lid,'t':'mesh','at':at,'life':.6,'loop':True,'att':'point','shape':'model','model':'wind_real_cone','mat':'tex','tex':tex,'col':col,'col2':'#000000','rim':0,
            'uvTile':list(tile),'uvScroll':list(scroll),'pos':[0,0,.25],'rot':[90,0,0],'scale':{'0':[width,length,width],'1':[width,length,width]},'op':{'0':op,'1':op},'fade':0}
def fly():
    L=[]
    L.append(tail('tail_air','tex/wind_air_rise',WHITE,.7,3.6,.95,[2,3],[.5,-2.8]))
    L.append(tail('tail_air2','tex/wind_air_rise','#9fe8a8',.5,2.8,1.1,[2,4],[-.7,-3.6]))
    L.append(tail('tail_dust','tex/wind_dust','#9d9684',.5,4.4,1.05,[2,3],[.3,-1.6]))
    L.append(emit('puff',0,.6,[0,0,0],'sphere',loop=True,fr=.2,dir='aim',yaw=180,spread=.25,speed=[1.5,4],plife=[.3,.55],size=[1.8,3.2],grow=.7,col='#c9c5b3',c2='#8f8974',rate=70,drag=1.6,**SMOKE))
    L.append(emit('streak',0,.6,[0,0,0],'sphere',loop=True,fr=.22,dir='aim',yaw=180,spread=.2,speed=[3,8],plife=[.14,.26],look='streak',size=[2.4,4.6],col=WHITE,c2=GREEN,rate=120,drag=1.2,curl=False))
    L.append(emit('wisps',0,.6,[0,0,0],'sphere',loop=True,fr=.5,dir='aim',yaw=180,spread=.5,speed=[.5,2],plife=[.3,.5],look='streak',size=[1,2],col=AIR,c2=GREEN,rate=50,drag=1.4,curl=True))
    L.append(emit('leaves',0,.6,[0,0,0],'sphere',loop=True,fr=.35,dir='aim',yaw=180,spread=.6,speed=[1,3.5],plife=[.4,.7],look='model',model='wind_leaf',mmat='glow',msize=[.06,.12],col=GREEN,c2='#2ec772',mspin=500,rate=7,gravity=-.2,drag=1,bounce=0,x=True))
    L.append({'id':'haze','t':'warp','at':0,'life':.6,'loop':True,'att':'point','pos':[0,0,-.7],'kind':'haze','size':1.6,'str':.4,'op':1,'col':WHITE,'glow':0,'x':True})
    L.append({'id':'core','t':'halo','at':0,'life':.6,'loop':True,'att':'point','pos':[0,0,.1],'col':MINT,'size0':.5,'size':.55,'k':.25})
    return {'v':1,'desc':'ใบมีดลม BA แบบลมพัดไป (ตามกระสุน): หัวลมเล็กพุ่งไป หางอากาศขุ่นโปร่งบานไปข้างหลัง + เส้นลม + ฝุ่นบาง ๆ + ใบไม้ปลิว — ไม่มีใบมีดทึบ ไม่ใช้หมึก','tags':['wind','ba','projectile'],'pal':'wind','dur':.6,'seed':41,'layers':L}
def hit():
    L=[]
    L.append({'id':'shock','t':'warp','at':0,'life':.3,'att':'point','pos':[0,0,.1],'kind':'shock','size':{'0':.4,'1':3.4},'str':.9,'op':{'0':1,'1':0},'col':WHITE,'glow':0})
    L.append(emit('puff',0,.05,[0,0,0],'sphere',burst=22,rate=0,fr=.2,dir='out',speed=[2.5,6],plife=[.4,.8],size=[2,3.8],grow=.8,col=AIR,c2='#b9c4bd',drag=2.2,**SMOKE))
    L.append(emit('spray',0,.05,[0,0,0],'sphere',burst=40,rate=0,fr=.2,dir='aim',spread=.75,speed=[7,15],plife=[.18,.38],look='streak',size=[1.6,3.4],col=WHITE,c2=MINT,drag=2.4,curl=False))
    L.append(emit('side',0,.05,[0,0,0],'ring',burst=16,rate=0,fr=.4,dir='tangent',speed=[4,8],plife=[.3,.5],look='streak',size=[1.4,2.6],col=AIR,c2=GREEN,drag=2,curl=True))
    L.append(emit('leaves',0,.05,[0,0,0],'sphere',burst=8,rate=0,fr=.2,dir='out',speed=[4,9],plife=[.4,.7],look='model',model='wind_leaf',mmat='glow',msize=[.08,.16],col=GREEN,c2='#2ec772',mspin=500,gravity=-.3,drag=1.4,bounce=0,x=True))
    L.append({'id':'flash','t':'flash','at':0,'life':.07,'att':'point','pos':[0,0,0],'col':MINT,'size0':.3,'size':1.5,'k':.7})
    return {'v':1,'desc':'ใบมีดลม BA ตอนโดน (ลมพัด): คลื่นอากาศวงเล็ก + ฝุ่นฟุ้งกระจาย + เส้นลมพุ่งออกไปข้างหน้า/วนข้าง + ใบไม้ปลิว','tags':['wind','ba','hit'],'pal':'wind','dur':.8,'seed':42,'layers':L}
save(ROOT/'assets/fx/wind/ba_gust_fly.fx.json',fly())
save(ROOT/'assets/fx/wind/ba_gust_hit.fx.json',hit())
print('wind/ba_gust_fly, wind/ba_gust_hit')
