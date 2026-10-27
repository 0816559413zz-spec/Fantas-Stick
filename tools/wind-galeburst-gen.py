# GaleBurst (สายลม) — ยิงคลิกซ้ายเสริมพลังตอนเกจเต็ม = ทอร์นาโดนอนพุ่งไปข้างหน้า 25 ม. (500 หน่วย)
# ใช้: python tools/wind-galeburst-gen.py แล้ว node tools/fx-check.js • ดู studio.html?fx=wind/galeburst
# User ref 2026-10-27 (manga panel): horizontal tornado, rings stacked along the shot growing outward, a spiky burst at the hand.
# Main body = the approved clear-wind brush tornado; the layer around it = the cursed ink tornado (black + deep green); vertical wind rings along the path.
import json,math,random
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
src=(ROOT/'tools/wind-kit-gen.py').read_text(encoding='utf-8')
g={'__name__':'kit'};exec(src[:src.index('def stroke_fx')].replace("W('mesh/","(lambda *a:None)('mesh/"),g)   # เอาแค่ tornado() ที่ผู้ใช้อนุมัติ (ไม่เขียนไฟล์ชุดเดิม)
tornado=g['tornado'];C=g['C']
INK=dict(inner='#2fbf74',mid='#0b2c1d',outer='#010503',hi='#8effc0',line='#000000',ring='#3dff8a',ring2='#8effc0',spark='#8effc0')
DUR=1.5;FLY=0.95;DIST=25.0;Y=1.15
head=lambda t:[0,Y,1.0+DIST*min(1,max(0,t)/FLY)**.85]
L=[]
# 1) แกนหลัก: ทอร์นาโดลมใสนอนพุ่ง
L+=tornado('m',head,0,FLY,s=.95,axis='fwd',every=.05,life=.45,col=C,floor=False)
# 2) ชั้นรอบนอก: ลมหมึก (ดำ-เขียวเข้ม) ใหญ่กว่า ช้ากว่าหน่อย
L+=tornado('k',lambda t:head(t-.04),.03,FLY,s=1.3,axis='fwd',every=.08,life=.5,col=INK,core=False,floor=False)
# 3) วงลมแนวตั้งเรียงตามทาง (แบบในรูป): เกิดหลังหัวพุ่งผ่าน แล้วขยายออก+จาง
rg=random.Random(4)
for j in range(9):
    t0=.04+j*.095;z=head(t0)[2];big=1.6+j*.18
    for k,(tex,col,sc,sp) in enumerate([('tex/wind_swoosh_a_hi','#ffffff',1.0,420),('tex/wind_swoosh_b','#8fd8ff',1.12,-360),('tex/wind_swoosh_b','#010503',1.3,300)]):
        L.append({'id':f'ring{j}_{k}','t':'mesh','at':round(t0,3),'life':.5,'att':'feet','shape':'model','model':f'wind_pieces{(j+k)%3}','mat':'tex','tex':tex,'col':col,'col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],
            'pos':[0,Y,round(z,2)],'rot':[-90,0,rg.uniform(0,360)],'scale':{'0':[.35*big*sc,.12,.35*big*sc],'0.4':[1.0*big*sc,.16,1.0*big*sc],'1':[1.5*big*sc,.08,1.5*big*sc],'ease':'out'},'spin':sp,'op':{'0':0,'0.1':.85 if k<2 else .7,'0.6':.5,'1':0},'fade':0})
# 4) ระเบิดตอนปล่อยที่มือ: แฟลช + หนามลมพุ่ง + วงกระแทกแนวตั้ง
L.append({'id':'muzzle','t':'flash','at':0,'life':.12,'att':'feet','pos':[0,Y,.9],'col':'#eaffff','size0':.3,'size':2.4,'k':1})
L.append({'id':'spikes','t':'emit','at':0,'life':.05,'att':'feet','pos':[0,Y,.9],'burst':60,'rate':0,'from':'sphere','fr':.15,'dir':'out','speed':[6,12],'plife':[.12,.28],'look':'streak','size':[1.6,3.2],'col':'#ffffff','c2':'#8fd8ff','gravity':0,'drag':3,'curl':False})
for k,(tex,col) in enumerate([('tex/wind_swoosh_a_hi','#ffffff'),('tex/wind_swoosh_b','#010503')]):
    L.append({'id':f'muzring{k}','t':'mesh','at':0,'life':.3,'att':'feet','shape':'model','model':f'wind_pieces{k}','mat':'tex','tex':tex,'col':col,'col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],
        'pos':[0,Y,1.0],'rot':[-90,0,k*90],'scale':{'0':[.2,.1,.2],'1':[1.1+k*.3,.15,1.1+k*.3],'ease':'out'},'spin':500*(1-2*k),'op':{'0':0,'0.08':1,'1':0},'fade':0})
L.append({'id':'shock','t':'warp','at':0,'life':.25,'att':'feet','pos':[0,Y,1.2],'kind':'shock','size':{'0':.4,'1':3.5},'str':1,'op':{'0':1,'1':0},'col':'#eaffff','glow':.04})
# 5) พื้นตามทาง: ฝุ่น/เศษลมเตะขึ้นใต้ทอร์นาโด + เศษหมึกปลิว
L.append({'id':'kick','t':'emit','at':.02,'life':FLY,'att':'feet','pos':{'0':[0,.1,1],'1':[0,.1,1+DIST]},'rate':90,'from':'disc','fr':.8,'dir':'aim','yaw':0,'spread':.7,'speed':[4,9],'up':[1,4],'plife':[.25,.55],'look':'streak','size':[1,2.2],'col':'#eaffff','c2':'#1d6f86','gravity':4,'drag':1.5,'curl':False})
L.append({'id':'flecks','t':'emit','at':.02,'life':FLY,'att':'feet','pos':{str(k):head(k*FLY) for k in (0,.5,1)},'rate':45,'from':'sphere','fr':1.0,'dir':'random','speed':[2,6],'plife':[.3,.6],'look':'model','model':'wind_slash','mmat':'solid','msize':[.12,.3],'col':'#010503','c2':'#0b2c1d','gravity':.5,'mspin':500,'bounce':0})
L.append({'id':'shake','t':'screen','at':0,'life':.12,'shake':2})
fx={'v':1,'desc':'GaleBurst (เกจเต็ม → คลิกซ้าย): ทอร์นาโดนอนพุ่งไปข้างหน้า 25 ม. — แกนลมใส + ชั้นนอกลมหมึก + วงลมเรียงตามทาง + ระเบิดที่มือ (ผู้ใช้ 2026-10-27 ส่งรูปมังงะ)','tags':['wind','galeburst','ba'],'pal':'wind','dur':DUR,'seed':12,'layers':L}
(ROOT/'assets/fx/wind/galeburst.fx.json').write_text(json.dumps(fx,ensure_ascii=False,indent=1),encoding='utf-8')
print('wind/galeburst',len(L),'layers')
