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
import math
# เส้นลมเกลียว (mesh ribbon) ลากตามหลังหัวกระสุน (-z) 7 เส้น ยาว 4–7.5 ม. ปลายเรียว — ใช้วัสดุทึบ (toon) เขียว ให้เห็นชัดทั้งพื้นขาวและมืด
# (หางแสง/อนุภาคบวกแสงจมหายไปบนพื้นสว่าง) หมุนม้วนรอบแกนวิ่ง (rot z) ให้เส้นพัดวน
def gust_mesh():
    parts=[]
    N=7
    for i in range(N):
        ph=i*2*math.pi/N;L=[4.0,6.0,5.0,7.5,4.5,6.5,5.5][i];r1=[.5,.7,.6,.8,.55,.75,.65][i];sg=1 if i%2==0 else -1
        path=[]
        for k in range(25):
            u=k/24;z=-L*u;rad=.05+r1*u**.8;a=ph+sg*2*math.pi*(.9*u)
            path.append([round(math.cos(a)*rad,3),round(math.sin(a)*rad,3),round(z,3)])
        parts.append({'id':f'r{i}','k':'ribbon','path':path,'w':[.17,.24,.16,.22,.16,.21,.19][i],'taper':1,'seg':60})
    save(ROOT/'assets/fx/mesh/wind_gust_lines.mesh.json',{'v':1,'desc':'ใบมีดลม BA แบบเส้นลมพัด: เส้นลมเกลียว 7 เส้นลากไปข้างหลัง (-z) ปลายเรียว','mat':'glow','pal':'wind','tags':['wind','ba'],'parts':parts})
gust_mesh()
def lines(L):
    for nm,mat,col,col2,op,sc,rolls in (('lines','toon','#3ed486','#0a7f43',1.0,1.0,2),('lines_hi','glow','#e8fff0','#8ff0b5',.7,.9,-3)):
        keys={str(round(k/12,4)):[0,0,round(k/12*360*rolls,1)] for k in range(13)}
        L.append({'id':nm,'t':'mesh','at':0,'life':.6,'loop':True,'att':'point','shape':'model','model':'wind_gust_lines','mat':mat,'col':col,'col2':col2,'pos':[0,0,0],
                  'rot':keys,'scale':sc,'op':op,'fade':0})
def fly():
    L=[]
    lines(L)
    L.append(emit('streak',0,.6,[0,0,0],'sphere',loop=True,fr=.45,dir='aim',yaw=180,spread=.12,speed=[10,18],plife=[.12,.22],look='streak',size=[1.6,3.2],col='#7fe9a8',c2='#0e9a52',rate=70,drag=.6,curl=False))
    L.append(emit('streak2',0,.6,[0,0,0],'ring',loop=True,fr=.4,dir='aim',yaw=180,spread=.1,speed=[6,12],plife=[.15,.3],look='streak',size=[1.3,2.6],col='#a8f3c4',c2='#0e9a52',rate=40,drag=.8,curl=True))
    L.append(emit('puff',0,.6,[0,0,0],'sphere',loop=True,fr=.2,dir='aim',yaw=180,spread=.25,speed=[1.5,4],plife=[.25,.45],size=[1,1.8],grow=.7,col='#d6d3c4',c2='#a39d88',rate=30,drag=1.6,**SMOKE))
    L.append(emit('leaves',0,.6,[0,0,0],'sphere',loop=True,fr=.35,dir='aim',yaw=180,spread=.6,speed=[1,3.5],plife=[.4,.7],look='model',model='wind_leaf',mmat='glow',msize=[.06,.12],col=GREEN,c2='#2ec772',mspin=500,rate=7,gravity=-.2,drag=1,bounce=0,x=True))
    L.append({'id':'core','t':'halo','at':0,'life':.6,'loop':True,'att':'point','pos':[0,0,.1],'col':'#7fe9a8','size0':.5,'size':.55,'k':.15})
    return {'v':1,'desc':'ใบมีดลม BA แบบเส้นลมพัดไป (ตามกระสุน): เส้นลมบาง ๆ 8 เส้นวนเกลียวรอบหัว หัวขาว-หางเขียว ยาว ~4–9 ม. + เส้นลมพุ่งตามหลัง + ฝุ่นบาง + ใบไม้ — เห็นชัด ไม่มีใบมีดทึบ ไม่ใช้หมึก','tags':['wind','ba','projectile'],'pal':'wind','dur':.6,'seed':41,'layers':L}
def hit():
    L=[]
    L.append({'id':'shock','t':'warp','at':0,'life':.3,'att':'point','pos':[0,0,.1],'kind':'shock','size':{'0':.4,'1':3.4},'str':.9,'op':{'0':1,'1':0},'col':WHITE,'glow':0})
    L.append(emit('puff',0,.05,[0,0,0],'sphere',burst=22,rate=0,fr=.2,dir='out',speed=[2.5,6],plife=[.4,.8],size=[2,3.8],grow=.8,col=AIR,c2='#b9c4bd',drag=2.2,**SMOKE))
    L.append(emit('spray',0,.05,[0,0,0],'sphere',burst=40,rate=0,fr=.2,dir='aim',spread=.75,speed=[7,15],plife=[.18,.38],look='streak',size=[1.6,3.4],col=WHITE,c2=MINT,drag=2.4,curl=False))
    L.append(emit('side',0,.05,[0,0,0],'ring',burst=16,rate=0,fr=.4,dir='tangent',speed=[4,8],plife=[.3,.5],look='streak',size=[1.4,2.6],col=AIR,c2=GREEN,drag=2,curl=True))
    L.append(emit('leaves',0,.05,[0,0,0],'sphere',burst=8,rate=0,fr=.2,dir='out',speed=[4,9],plife=[.4,.7],look='model',model='wind_leaf',mmat='glow',msize=[.08,.16],col=GREEN,c2='#2ec772',mspin=500,gravity=-.3,drag=1.4,bounce=0,x=True))
    L.append({'id':'flash','t':'flash','at':0,'life':.07,'att':'point','pos':[0,0,0],'col':MINT,'size0':.3,'size':1.5,'k':.7})
    return {'v':1,'desc':'ใบมีดลม BA ตอนโดน (ลมพัด): คลื่นอากาศวงเล็ก + ฝุ่นฟุ้งกระจาย + เส้นลมพุ่งออกไปข้างหน้า/วนข้าง + ใบไม้ปลิว','tags':['wind','ba','hit'],'pal':'wind','dur':.8,'seed':42,'layers':L}
def demo(d,speed=55.0,life=.6):
    """studio-only: fx เดินหน้า 55 ม./วิ ด้วยตัวเอง (ในเกม fx ถูกย้ายตามกระสุนอยู่แล้ว) เพื่อให้หางแสงลากเส้นให้ดูในสตูดิโอ"""
    import copy;d=copy.deepcopy(d);d['desc']='(สตูดิโอเท่านั้น) '+d['desc'];d['dur']=.65
    for l in d['layers']:
        p=l.get('pos',[0,0,0]);keys=sorted({round(i/12,4) for i in range(13)})
        if isinstance(p,dict):
            ks=sorted(float(k) for k in p);base=lambda u:p[str(u)] if str(u) in p else p[min(p,key=lambda k:abs(float(k)-u))]
        else:base=lambda u:p
        l['pos']={str(u):[base(u)[0],base(u)[1],round(base(u)[2]+speed*life*u*.8,3)] for u in keys}
        l['life']=.6;l.pop('loop',None)
    return d
save(ROOT/'assets/fx/wind/ba_gust_fly.fx.json',fly())
save(ROOT/'assets/fx/wind/ba_gust_fly_demo.fx.json',demo(fly()))
save(ROOT/'assets/fx/wind/ba_gust_hit.fx.json',hit())
print('wind/ba_gust_fly, wind/ba_gust_hit')
