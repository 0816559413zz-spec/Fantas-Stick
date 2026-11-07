# Featherwing (ท่าไฮไลต์) + โหมด Focus — ผู้ใช้ 2026-11-07
# ใช้: python tools/wind-fw-focus-gen.py แล้ว node tools/fx-check.js
# ไฟล์:
#   wind/fw_spin   ตามตัวผู้ร่าย 1.2 วิ ตอนหมุนตัวมีปีกบินวนขึ้น (ลมเกลียวรอบตัว + ใบไม้ + ขนลม + ฝุ่นพื้นตอนออกตัว)
#   wind/fw_focus  ตามตัวผู้ร่ายตลอดโหมด Focus (วน จนสั่งหยุด): เส้นลมเกลียวลากหลังปีก + เส้นลมจากปลายปีก — ไม่ใช้หมึก/ริบบิ้นการ์ตูน
#   wind/orb_fly   ลูกบอลลม (BA โหมด Focus) ตามกระสุน: แกนสว่าง + เปลือกลมวน + เกลียวลมสั้น (att point)
#   wind/orb_hit   ลูกบอลลมโดน: ลมกระแทกวงเล็ก + ลมแตกกระจาย
# เกลียวลมใช้ mesh/wind_gust_lines (จาก tools/wind-ba-gust-gen.py — รันอันนั้นก่อนถ้าไม่มีไฟล์)
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def save(n,layers,dur,desc,tags):
    (ROOT/f'assets/fx/wind/{n}.fx.json').write_text(json.dumps({'v':1,'desc':desc,'tags':['wind','featherwing']+tags,'pal':'wind','dur':dur,'seed':51,'layers':layers},ensure_ascii=False,indent=1),encoding='utf-8')
    print('wind/'+n,len(layers),'layers')
G=dict(hi='#ffffff',mint='#d8ffe0',mid='#8dff65',lime='#c6ff5a',deep='#0f9d55',green='#3ed486',dark='#0a7f43')
def emit(lid,at,life,pos,frm,loop=False,att='feet',**k):
    d={'id':lid,'t':'emit','at':at,'life':life,'att':att,'pos':list(pos),'from':frm,'gravity':0,'drag':1};d.update(k)
    if loop:d['loop']=True
    return d
def lines(lid,at,life,pos,sc,rolls,att,loop,col,hi,op=.8):
    keys={str(round(i/12,4)):[0,0,round(i/12*360*rolls,1)] for i in range(13)}
    out=[]
    for k,(m,c,c2,o) in enumerate([('toon',col,G['dark'],op),('glow',hi,G['mint'],op*.6)]):
        d={'id':f'{lid}{k}','t':'mesh','at':at,'life':life,'att':att,'shape':'model','model':'wind_gust_lines','mat':m,'col':c,'col2':c2,'pos':pos,'rot':keys,'scale':sc,'op':o,'fade':0}
        if loop:d['loop']=True
        out.append(d)
    return out
SMOKE=dict(look='smoke',curl=True)

# ---------------- spin (1.2 s, follows the caster) ----------------
L=[]
L.append({'id':'start_ring','t':'warp','at':0,'life':.35,'att':'ground','pos':[0,.1,0],'kind':'shock','flat':True,'size':{'0':.5,'1':5},'str':.8,'op':{'0':1,'1':0},'col':G['mint'],'glow':.02})
L.append(emit('start_dust',0,.08,[0,.1,0],'ring',att='ground',burst=34,rate=0,fr=.6,dir='out',speed=[3,6],up=[.3,1.2],plife=[.4,.8],size=[2.5,4.5],grow=.7,col='#d9d3c0',c2='#a39d88',drag=2,x=True,**SMOKE))
L.append(emit('swirl',0,1.2,[0,1.2,0],'ring',fr=1.1,dir='tangent',speed=[7,11],plife=[.25,.4],look='streak',size=[1.6,3],col=G['hi'],c2=G['mid'],rate=90,drag=.4,curl=False))
L.append(emit('swirl2',.05,1.15,[0,.7,0],'ring',fr=1.5,dir='tangent',speed=[5,9],up=[.5,1.5],plife=[.3,.5],look='streak',size=[1.2,2.4],col=G['mint'],c2=G['green'],rate=60,drag=.4,curl=False))
L.append(emit('chips',0,1.2,[0,1.2,0],'ring',fr=1.0,dir='tangent',speed=[5,8],plife=[.4,.7],look='model',model='wind_wing_airchip',mmat='glow',msize=[.08,.18],col=G['mint'],c2=G['green'],mspin=600,rate=26,drag=.5,bounce=0,x=True))
L.append(emit('leaves',0,1.2,[0,1,0],'ring',fr=1.3,dir='tangent',speed=[4,8],up=[.3,1.2],plife=[.5,.9],look='model',model='wind_leaf',mmat='glow',msize=[.1,.2],col=G['mid'],c2=G['deep'],mspin=500,rate=20,gravity=-.2,drag=.6,bounce=0,x=True))
L+=lines('sp',0,1.2,[0,1.2,-.3],1.0,3,'feet',False,G['green'],G['hi'],.7)
L.append({'id':'haze','t':'warp','at':0,'life':1.2,'att':'feet','pos':[0,1.2,0],'kind':'haze','size':3.5,'str':.4,'op':{'0':0,'0.2':1,'0.8':1,'1':0},'col':G['hi'],'glow':0,'x':True})
save('fw_spin',L,1.3,'Featherwing ① หมุนตัวมีปีกบินวนขึ้น 1.2 วิ (ตามตัว): ลมเกลียวรอบตัว + เส้นลมสีเขียวม้วน + ใบไม้/ขนลม + ฝุ่นพื้นตอนออกตัว',['spin'])

# ---------------- focus mode (loop, follows the caster; +z = flight direction) ----------------
F=[]
F+=lines('tr',0,.9,[0,1.1,-.5],1.5,2,'feet',True,G['green'],G['hi'],.75)
for sd in (1,-1):
    F.append(emit('tip'+('R' if sd>0 else 'L'),0,.9,[sd*1.2,1.5,-.6],'sphere',loop=True,fr=.15,dir='aim',yaw=180,spread=.08,speed=[8,14],plife=[.18,.32],look='streak',size=[2,4],col=G['hi'],c2=G['mid'],rate=45,drag=.4,curl=False))
F.append(emit('air',0,.9,[0,1.2,-.4],'sphere',loop=True,fr=.5,dir='aim',yaw=180,spread=.3,speed=[5,10],plife=[.2,.4],look='streak',size=[1.4,2.8],col=G['mint'],c2=G['green'],rate=40,drag=.6,curl=True))
F.append(emit('leaves',0,.9,[0,1.1,-.5],'sphere',loop=True,fr=.4,dir='aim',yaw=180,spread=.5,speed=[3,7],plife=[.4,.7],look='model',model='wind_leaf',mmat='glow',msize=[.08,.16],col=G['mid'],c2=G['deep'],mspin=500,rate=8,gravity=-.2,drag=.8,bounce=0,x=True))
save('fw_focus',F,.9,'Featherwing โหมด Focus (วนตามตัวจนจบ): เส้นลมเกลียวสีเขียวลากหลังปีก + เส้นลมจากปลายปีกสองข้าง + ใบไม้ปลิว (+z = ทิศบิน)',['loop'])

# ---------------- wind orb (Focus basic attack) ----------------
O=[]
O.append({'id':'core','t':'mesh','at':0,'life':.5,'loop':True,'att':'point','shape':'sphere','mat':'glow','col':G['mint'],'col2':G['mid'],'pos':[0,0,0],'scale':.3,'op':.95,'fade':0})
O.append({'id':'shell','t':'mesh','at':0,'life':.5,'loop':True,'att':'point','shape':'sphere','mat':'tex','tex':'tex/wind_air_rise','col':G['mid'],'col2':'#000000','rim':0,'uvTile':[2,2],'uvScroll':[1.4,-1.8],'pos':[0,0,0],'scale':.7,'op':.85,'fade':0})
O.append({'id':'shell2','t':'mesh','at':0,'life':.5,'loop':True,'att':'point','shape':'sphere','mat':'tex','tex':'tex/wind_dust','col':'#cfe9d6','col2':'#000000','rim':0,'uvTile':[2,2],'uvScroll':[-1.1,1.2],'pos':[0,0,0],'scale':.95,'op':.4,'fade':0})
O+=lines('sw',0,.5,[0,0,0],.4,3,'point',True,G['green'],G['hi'],.8)
O.append(emit('streak',0,.5,[0,0,0],'sphere',loop=True,att='point',fr=.2,dir='aim',yaw=180,spread=.15,speed=[8,14],plife=[.1,.18],look='streak',size=[1.2,2.4],col=G['hi'],c2=G['mid'],rate=40,drag=.6,curl=False))
O.append({'id':'halo','t':'halo','at':0,'life':.5,'loop':True,'att':'point','pos':[0,0,0],'col':G['mid'],'size0':.9,'size':1.0,'k':.4})
save('orb_fly',O,.5,'ลูกบอลลม (BA โหมด Focus Featherwing) ตามกระสุน: แกนสว่าง + เปลือกลมวน 2 ชั้น + เกลียวลมสั้นหมุน — ลูกกลมชัด ไม่ทึบ',['projectile'])
H=[]
H.append({'id':'shock','t':'warp','at':0,'life':.25,'att':'point','pos':[0,0,0],'kind':'shock','size':{'0':.3,'1':2.2},'str':.7,'op':{'0':1,'1':0},'col':G['hi'],'glow':0})
H.append(emit('puff',0,.05,[0,0,0],'sphere',loop=False,att='point',burst=10,rate=0,fr=.2,dir='out',speed=[2,5],plife=[.3,.55],size=[1.2,2.2],grow=.8,col='#d6e3d9',c2='#a3b5a8',drag=2.2,**SMOKE))
H.append(emit('spray',0,.05,[0,0,0],'sphere',loop=False,att='point',burst=18,rate=0,fr=.2,dir='aim',spread=.8,speed=[5,12],plife=[.12,.28],look='streak',size=[1.2,2.4],col=G['hi'],c2=G['mid'],drag=2.4,curl=False))
H.append(emit('leaves',0,.05,[0,0,0],'sphere',loop=False,att='point',burst=3,rate=0,fr=.2,dir='out',speed=[3,6],plife=[.35,.6],look='model',model='wind_leaf',mmat='glow',msize=[.06,.12],col=G['mid'],c2=G['deep'],mspin=500,gravity=-.3,drag=1.4,bounce=0,x=True))
H.append({'id':'flash','t':'flash','at':0,'life':.06,'att':'point','pos':[0,0,0],'col':G['mint'],'size0':.2,'size':1.0,'k':.5})
save('orb_hit',H,.5,'ลูกบอลลมโดน: ลมกระแทกวงเล็ก + ลมแตกกระจาย + ใบไม้ (เบา ยิงรัวไม่รก)',['hit'])
