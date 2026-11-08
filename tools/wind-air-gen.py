# สายลมรีดีไซน์ "พริ้วไหวกลางอากาศ" (ผู้ใช้ 2026-11-08) — VFX ของสกิลใหม่ทั้งชุด
# ใช้: python tools/wind-air-gen.py แล้ว node tools/fx-check.js • ดู studio.html?fx=wind/<ชื่อ>
# ไฟล์ที่สร้าง (assets/fx/wind/):
#   up_zone    Windup ① วงลมรอตรงจุดวาง 0.45 วิ (att ground, p.r ม.)        up_go   Windup ② พัดขึ้น: เสาลมเส้นบาง + ฝุ่น/ใบไม้ลอย (p.r, p.a วิ)   up_hit  เป้าถูกพัดลอย
#   push_fly   Wind Push ลมพลังสูงตามกระสุน (loop, att point)  push_sink เป้าบนพื้นจมดิน (หลุม+ฝุ่น)  push_up เป้าบนพื้นถูกพัดขึ้น  push_slam เป้าลอยถูกกดลง  slam_hit ถึงพื้นหลังถูกกด
#   force_dash Windforce พุ่ง (att point ที่จุดเริ่ม +z = ทิศพุ่ง, p.d ม.)   force_hit เป้าถูกพาไป
#   blade_fly  Windblade ใบมีดเล็กตามกระสุน (เบา ยิงรัว 14 ใบ)
#   fw_fast    Featherwing บินเร็ว (Shift) วนตามตัว: เส้นลมความเร็ว + กรวยไอ + ลมปลายปีก
#   sonic_charge ชาร์จ 1 วิ (ตามตัว)  sonic_dash พุ่งทะลุเสียง (att point ที่จุดเริ่ม +z = ทิศพุ่ง, p.d ม.)  sonic_hit ชนตรง  sonic_wave พุ่งผ่าน (บูมตามหลัง)
# ใช้โมเดล/ภาพที่ผู้ใช้อนุมัติแล้วของสายลม (wind_real_cone / wind_vortex_air / wind_gust_lines / tex wind_air_rise / wind_lines / wind_void_disk ...) — โทนเขียว-ขาว ลมใส
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def save(n,layers,dur,desc,tags,params=None,seed=61):
    d={'v':1,'desc':desc,'tags':['wind']+tags,'pal':'wind','dur':dur,'seed':seed,'layers':layers}
    if params:d['params']=params
    (ROOT/f'assets/fx/wind/{n}.fx.json').write_text(json.dumps(d,ensure_ascii=False,indent=1),encoding='utf-8')
    print('wind/'+n,len(layers),'layers')
G=dict(hi='#ffffff',mint='#d8ffe0',mid='#8dff65',lime='#c6ff5a',deep='#0f9d55',green='#3ed486',dark='#0a7f43',air='#e8efea')
SMOKE=dict(look='smoke',curl=True)
DUST=dict(look='smoke',curl=True,col='#d9d3c0',c2='#a39d88',gravity=0)
def emit(lid,at,life,pos,frm,loop=False,att='point',**k):
    d={'id':lid,'t':'emit','at':at,'life':life,'att':att,'pos':list(pos),'from':frm,'gravity':0,'drag':1};d.update(k)
    if loop:d['loop']=True
    return d
def mesh(lid,at,life,att,pos,model=None,shape=None,mat='tex',tex=None,col='#ffffff',col2='#000000',loop=False,**k):
    d={'id':lid,'t':'mesh','at':at,'life':life,'att':att,'pos':pos,'mat':mat,'col':col,'col2':col2,'fade':0}
    if model:d.update(shape='model',model=model)
    else:d['shape']=shape
    if tex:d.update(tex=tex,rim=0)
    if loop:d['loop']=True
    d.update(k);return d
def warp(lid,at,life,att,pos,kind,size,**k):
    d={'id':lid,'t':'warp','at':at,'life':life,'att':att,'pos':pos,'kind':kind,'size':size,'str':.7,'op':{'0':1,'1':0},'col':G['hi'],'glow':0};d.update(k);return d
def lines(lid,at,life,att,pos,sc,rolls,loop,col,hi,op=.8):
    keys={str(round(i/12,4)):[0,0,round(i/12*360*rolls,1)] for i in range(13)}
    out=[]
    for k,(m,c,c2,o) in enumerate([('toon',col,G['dark'],op),('glow',hi,G['mint'],op*.6)]):
        d={'id':f'{lid}{k}','t':'mesh','at':at,'life':life,'att':att,'shape':'model','model':'wind_gust_lines','mat':m,'col':c,'col2':c2,'pos':pos,'rot':keys,'scale':sc,'op':o,'fade':0}
        if loop:d['loop']=True
        out.append(d)
    return out
def tunnel(lid,at,life,att,pos,length,width,col,op,scroll=(-3,0),tile=(3,1),tex='tex/wind_lines',loop=False,rot=(90,0,0),model='wind_real_cone',**k):
    # กรวยลมบางโปร่ง: หัวเล็กอยู่ที่ pos บานไปทาง -z (rot 90 = หันหัวกรวยไปด้านหน้า) • length/width เมตร
    d=mesh(lid,at,life,att,list(pos),model=model,mat='tex',tex=tex,col=col,uvTile=list(tile),uvScroll=list(scroll),rot=list(rot),scale=[width,length,width],op=op,loop=loop)
    d.update(k);return d

def along(lid,at,life,y,Dm,rate,**k):
    # ปล่อยอนุภาคตามเส้นยาว Dm ม. (from line จำกัดยาว ≤ 20 ม. ต่อตัว → แบ่งเป็นท่อน) • rate = รวมทั้งเส้น
    out=[];n=max(1,-(-int(Dm)//20));seg=Dm/n
    for i in range(n):
        d=emit(f'{lid}{i}' if n>1 else lid,at,life,[0,y,round(i*seg,2)],'line',fh=round(seg,2),rate=max(4,round(rate*seg/Dm)),**k);out.append(d)
    return out

def runners(pre,Dm,T,y,offs,w,tlife,col,col2,size=.7,at=0):
    # หัวแสงวิ่งไปตามแนวพุ่งใน T วิ (flash ขยับด้วย pos curve) + หางแสง (trail) ลากตามหลัง = เส้นลมสว่างยาวตามทาง
    out=[]
    for i,(ox,oy) in enumerate(offs):
        mid=f'{pre}m{i}'
        out.append({'id':mid,'t':'flash','at':at,'life':T,'att':'point','pos':{'0':[ox,y+oy,0],'1':[ox,y+oy,Dm]},'col':col,'size0':size,'size':size,'k':1.1})
        out.append({'id':f'{pre}t{i}','t':'trail','at':at,'life':T+tlife,'of':mid,'col':col,'col2':col2,'w':w,'tlife':tlife,'k':1.4})
    return out

# ===================== Windup =====================
def windup():
    P={'r':{'def':5,'desc':'รัศมีวง (ม.)'},'t':{'def':.45,'desc':'รอก่อนพัด (วิ)'},'a':{'def':1.0,'desc':'วงพัดอยู่ (วิ)'}}
    # ① วงลมรอ: จานเกลียวลมหมุนบนพื้น + เส้นลมไหลเข้าหากลางวง + ขอบวงสว่างขึ้น
    L=[]
    L.append(mesh('disk',0,'t','ground',[0,.08,0],shape='plane',tex='tex/wind_void_disk',col=G['mid'],rot=[90,0,0],spin=140,scale={'0':1,'1':1,'x':'r*1.9'},op={'0':0,'0.25':.8,'0.85':.9,'1':.2}))
    L.append(mesh('disk2',0,'t','ground',[0,.1,0],shape='plane',tex='tex/wind_void_disk_b',col=G['hi'],rot=[90,0,0],spin=-90,scale={'0':.6,'1':1,'x':'r*1.5'},op={'0':0,'0.4':.55,'1':.1}))
    L.append({'id':'edge','t':'ring','at':0,'life':'t','att':'ground','pos':[0,.12,0],'col':G['mint'],'r':'r','op':.55})
    L.append(emit('inflow',0,'t',[0,.2,0],'ring',att='ground',rate=70,fr='r',dir='in',speed=[2,5],up=[.3,1.2],plife=[.25,.4],look='streak',size=[1.4,2.6],col=G['hi'],c2=G['mid'],drag=.4,curl=False))
    L.append(emit('dust',0,'t',[0,.1,0],'ring',att='ground',rate=24,fr='r',dir='tangent',speed=[1.5,3],up=[.2,.6],plife=[.5,.8],size=[2.5,4.5],grow=.5,drag=1.2,x=True,**DUST))
    L.append(warp('haze',0,'t','ground',[0,.2,0],'haze',{'0':1,'1':'r*0.9'},str=.35,op={'0':0,'0.3':1,'1':.5},x=True))
    save('up_zone',L,.5,'Windup ① วงลมรอตรงจุดวาง (0.45 วิ ก่อนพัดขึ้น): จานเกลียวลมเขียวหมุนบนพื้น + เส้นลมไหลเข้าหากลางวง + ขอบวงสว่าง — ขนาดตาม p.r (ม.)',['windup','zone'],P)
    # ② พัดขึ้น: เสาลมเส้นบางหมุนลอยขึ้นสูง ~7 ม. + ฝุ่น/ใบไม้/เส้นลมถูกดูดขึ้น + คลื่นลมวงบนพื้น
    U=[]
    H=7.0
    for i,(model,col,op,tile,scr,spin,sc,rot) in enumerate([('wind_vortex_air','#ffffff',.8,[3,1],[-.5,0],320,1.0,0),('wind_vortex_air2','#d8ffe0',.45,[2,1],[-.35,0],-240,1.1,60),('wind_vortex_air',G['mid'],.25,[2,1],[-.7,0],420,.85,120)]):
        U.append(mesh(f'col{i}',0,'a','ground',[0,0,0],model=model,tex='tex/wind_air_rise',col=col,uvTile=tile,uvScroll=scr,rot=[0,rot,0],spin=spin,
                      scale={'0':[.3,.2,.3],'0.2':[1,1,1],'0.85':[1,1,1],'1':[.8,1.1,.8],'x':[f'r*{.62*sc}',round(H/1.5*sc,2),f'r*{.62*sc}']},
                      op={'0':0,'0.12':op,'0.8':op,'1':0}))
    U.append(mesh('disk',0,'a','ground',[0,.08,0],shape='plane',tex='tex/wind_void_disk',col=G['mid'],rot=[90,0,0],spin=360,scale={'0':1,'1':1,'x':'r*2'},op={'0':.9,'0.6':.5,'1':0}))
    U.append(warp('shock',0,.45,'ground',[0,.2,0],'shock',{'0':.5,'1':'r*1.6'},flat=True,str=.8))
    U.append({'id':'ring','t':'ring','at':0,'life':.45,'att':'ground','pos':[0,.12,0],'col':G['mid'],'r':'r*1.2','op':.45})
    U.append(emit('streaks',0,'a',[0,.1,0],'ring',att='ground',rate=90,fr='r*0.9',dir='up',spread=.15,speed=[7,13],up=[2,5],plife=[.4,.8],look='streak',size=[1.6,3.2],col=G['hi'],c2=G['mid'],drag=.3,curl=True))
    U.append(emit('dust',0,'a',[0,.1,0],'ring',att='ground',rate=40,fr='r*0.8',dir='up',spread=.3,speed=[2,5],plife=[.7,1.3],size=[3,5.5],grow=.6,drag=.8,x=True,**{**DUST,'gravity':-.4}))
    U.append(emit('leaves',0,'a',[0,.2,0],'ring',att='ground',rate=14,fr='r*0.7',dir='up',spread=.4,speed=[3,7],plife=[.8,1.4],look='model',model='wind_leaf',mmat='glow',msize=[.1,.22],col=G['mid'],c2=G['deep'],mspin=500,gravity=-.3,drag=.6,bounce=0,x=True))
    U.append(emit('burst',0,.08,[0,.1,0],'ring',att='ground',burst=40,rate=0,fr='r*0.8',dir='up',spread=.2,speed=[10,16],plife=[.3,.5],look='streak',size=[2,3.4],col=G['hi'],c2=G['mid'],drag=1.4,curl=False))
    U.append({'id':'shake','t':'screen','at':0,'life':.3,'near':25,'other':True,'shake':1.2})
    U.append({'id':'shake_own','t':'screen','at':0,'life':.3,'own':True,'shake':1.8})
    save('up_go',U,1.2,'Windup ② พัดขึ้น: เสาลมเส้นบางหมุนลอยสูง ~7 ม. (ลมใสแบบกำแพง Aegis) + จานเกลียวลมบนพื้น + คลื่นลมวง + เส้นลม/ฝุ่น/ใบไม้ถูกดูดขึ้น — ขนาด p.r (ม.) นาน p.a (วิ)',['windup','zone'],P)
    # เป้าที่ถูกพัดลอย: วงลมรอบตัว + เกลียวลมสั้น + ขนลม
    Hh=[]
    Hh.append({'id':'ring','t':'ring','at':0,'life':.35,'att':'point','pos':[0,-.6,0],'col':G['mint'],'r':1.8,'op':.5})
    Hh+=lines('sp',0,.6,'point',[0,0,.2],.9,2,False,G['green'],G['hi'],.7)
    Hh.append(emit('rise',0,.5,[0,-.8,0],'ring',rate=60,fr=.6,dir='up',speed=[3,6],plife=[.3,.5],look='streak',size=[1.2,2.4],col=G['hi'],c2=G['mid'],drag=.5,curl=True))
    Hh.append(emit('feathers',0,.06,[0,0,0],'sphere',burst=6,rate=0,fr=.3,dir='up',speed=[2,5],plife=[.5,.9],look='model',model='wind_wing_airchip',mmat='glow',msize=[.06,.14],col=G['mint'],c2=G['green'],mspin=500,gravity=-.2,drag=1,bounce=0,x=True))
    save('up_hit',Hh,.7,'Windup เป้าถูกพัดลอย: วงลมรอบเอว + เกลียวลมสั้น + เส้นลมไหลขึ้น + ขนลมกระจาย',['windup','hit'])

# ===================== Wind Push =====================
def push():
    # ลมพลังสูงตามกระสุน: หัวลมสว่างยืดยาว + กรวยลมหางสั้นแต่หนา + เกลียวลม + วงคลื่นหน้าหัว
    F=[]
    F.append(mesh('core',0,.4,'point',[0,0,0],shape='sphere',mat='glow',col=G['hi'],col2=G['mid'],loop=True,scale=[.32,.32,1.3],op=.95))
    F.append(tunnel('tailD',0,.4,'point',[0,0,.3],5,1.1,'#1a7a45',.45,scroll=(-3,0),tile=(2,1),tex='tex/wind_streaks_ink',loop=True))
    F.append(tunnel('tail',0,.4,'point',[0,0,.3],5.5,.9,G['mint'],.8,scroll=(-4,0),tile=(3,1),tex='tex/wind_streaks',loop=True))
    F.append(tunnel('tail2',0,.4,'point',[0,0,.2],4,.7,G['mid'],.6,scroll=(-5,0),tile=(2,1),tex='tex/wind_lines',loop=True))
    F+=lines('sw',0,.4,'point',[0,0,.2],.8,3,True,G['green'],G['hi'],.8)
    F.append(emit('streak',0,.4,[0,0,0],'sphere',loop=True,fr=.25,dir='aim',yaw=180,spread=.2,speed=[16,26],plife=[.1,.22],look='streak',size=[1.6,3.2],col=G['hi'],c2=G['mid'],rate=90,drag=.6,curl=False))
    F.append(emit('air',0,.4,[0,0,-.6],'sphere',loop=True,fr=.5,dir='aim',yaw=180,spread=.5,speed=[6,12],plife=[.2,.35],look='streak',size=[1.2,2.2],col=G['mint'],c2=G['green'],rate=50,drag=.6,curl=True,x=True))
    F.append({'id':'halo','t':'halo','at':0,'life':.4,'loop':True,'att':'point','pos':[0,0,0],'col':G['mid'],'size0':1.3,'size':1.5,'k':.45})
    save('push_fly',F,.4,'Wind Push ลมพลังสูงตามกระสุน (loop): หัวลมสว่างยืดยาว + กรวยลมหางหนา 2 ชั้น + เกลียวลม + เส้นลมพุ่งตามหลัง',['push','projectile'])
    # เป้าบนพื้นจมดิน: หลุมกระแทก + ฝุ่นพุ่งเป็นวง + ลมไหลลงดิน
    S=[]
    S.append(mesh('disk',0,.7,'ground',[0,.08,0],shape='plane',tex='tex/wind_void_disk',col=G['mid'],rot=[90,0,0],spin=300,scale=3.4,op={'0':.9,'0.5':.5,'1':0}))
    S.append(warp('shock',0,.4,'ground',[0,.2,0],'shock',{'0':.4,'1':4.2},flat=True,str=.9))
    S.append({'id':'ring','t':'ring','at':0,'life':.4,'att':'ground','pos':[0,.12,0],'col':G['hi'],'r':3.2,'op':.6})
    S.append(emit('dust',0,.08,[0,.1,0],'ring',att='ground',burst=40,rate=0,fr=.5,dir='out',speed=[4,8],up=[.5,2],plife=[.6,1.1],size=[3,6],grow=.7,drag=2,**{**DUST,'c2':'#a39d88'}))
    S.append(emit('down',0,.35,[0,2.2,0],'disc',att='ground',rate=120,fr=.9,dir='down',spread=.1,speed=[10,16],plife=[.15,.25],look='streak',size=[1.8,3.4],col=G['hi'],c2=G['mid'],drag=.2,curl=False))
    S.append(emit('chips',0,.06,[0,.1,0],'disc',att='ground',burst=10,rate=0,fr=.6,dir='up',spread=.8,speed=[3,7],plife=[.5,.9],look='model',model='rock_chunks',mmat='solid',msize=[.08,.18],col='#8a7a5a',c2='#5c5038',gravity=9,bounce=.25,mspin=500,x=True))
    S.append({'id':'shake','t':'screen','at':0,'life':.25,'near':25,'shake':1.2})
    save('push_sink',S,1.0,'Wind Push (บิน) ตีเป้าบนพื้น = จมดิน: ลมกดลงดิน + หลุมกระแทกเกลียวลม + ฝุ่นกระจายเป็นวง + เศษดิน',['push','hit'])
    # เป้าบนพื้นถูกพัดขึ้น (โหมดพื้น): เสาลมสั้น ๆ ใต้เท้า
    Up=[]
    Up.append(mesh('col',0,.5,'point',[0,-1.1,0],model='wind_vortex_air',tex='tex/wind_air_rise',col='#ffffff',uvTile=[3,1],uvScroll=[-.6,0],spin=400,scale={'0':[.3,.2,.3],'0.3':[.5,.6,.5],'1':[.4,.7,.4]},op={'0':0,'0.15':.8,'0.7':.6,'1':0}))
    Up.append(mesh('disk',0,.4,'ground',[0,.08,0],shape='plane',tex='tex/wind_void_disk',col=G['mid'],rot=[90,0,0],spin=300,scale=2.2,op={'0':.9,'1':0}))
    Up.append(warp('shock',0,.3,'ground',[0,.2,0],'shock',{'0':.3,'1':2.6},flat=True,str=.7))
    Up.append(emit('rise',0,.4,[0,-1,0],'ring',rate=100,fr=.5,dir='up',speed=[6,11],plife=[.25,.45],look='streak',size=[1.4,2.8],col=G['hi'],c2=G['mid'],drag=.4,curl=True))
    Up.append(emit('dust',0,.06,[0,-1,0],'ring',burst=14,rate=0,fr=.4,dir='out',speed=[2,4],up=[1,3],plife=[.5,.9],size=[2.5,4.5],grow=.6,drag=1.6,x=True,**DUST))
    save('push_up',Up,.6,'Wind Push (พื้น) ตีเป้าบนพื้น = พัดขึ้น: เสาลมสั้นใต้เท้า + จานเกลียวลม + คลื่นวงบนพื้น + เส้นลมพุ่งขึ้น',['push','hit'])
    # เป้าลอยถูกกดลง: เส้นลมดิ่งลงรอบตัว + วงแบนกดลง
    D=[]
    D.append(tunnel('fall',0,.4,'point',[0,2.6,0],4.5,1.3,G['mint'],.85,scroll=(-6,0),tile=(3,1),tex='tex/wind_streaks',rot=(180,0,0)))
    D.append(emit('down',0,.3,[0,1.8,0],'disc',rate=130,fr=.7,dir='down',spread=.08,speed=[14,22],plife=[.12,.22],look='streak',size=[2,3.6],col=G['hi'],c2=G['mid'],drag=.1,curl=False))
    D.append({'id':'ring','t':'ring','at':0,'life':.3,'att':'point','pos':[0,.3,0],'col':G['mid'],'r':1.8,'op':.5})
    D.append({'id':'flash','t':'flash','at':0,'life':.06,'att':'point','pos':[0,0,0],'col':G['mint'],'size0':.3,'size':1.2,'k':.6})
    save('push_slam',D,.5,'Wind Push เป้าลอยถูกกดลง: เส้นลมดิ่งลงรอบตัว + กรวยลมกดลง + วงแบนที่เอว',['push','hit'])
    # ถึงพื้นหลังถูกกด: คลื่นกระแทก + ฝุ่นวง + รอยแตก + ลมพุ่งออกรอบ
    I=[]
    I.append(warp('shock',0,.4,'ground',[0,.2,0],'shock',{'0':.4,'1':5},flat=True,str=1))
    I.append({'id':'ring','t':'ring','at':0,'life':.4,'att':'ground','pos':[0,.12,0],'col':G['hi'],'r':4,'op':.65})
    I.append(mesh('disk',0,.5,'ground',[0,.08,0],shape='plane',tex='tex/wind_void_disk',col=G['mid'],rot=[90,0,0],spin=240,scale=4.2,op={'0':.8,'1':0}))
    I.append(emit('dust',0,.08,[0,.1,0],'ring',att='ground',burst=46,rate=0,fr=.5,dir='out',speed=[5,10],up=[.5,2.5],plife=[.6,1.1],size=[3.5,6.5],grow=.8,drag=2,**DUST))
    I.append(emit('streaks',0,.06,[0,.3,0],'ring',att='ground',burst=30,rate=0,fr=.4,dir='flat',speed=[10,18],plife=[.15,.3],look='streak',size=[1.6,3],col=G['hi'],c2=G['mid'],drag=1.6,curl=False))
    I.append({'id':'shake','t':'screen','at':0,'life':.3,'near':25,'shake':2})
    save('slam_hit',I,1.2,'ถึงพื้นหลังถูกกดลง (Wind Push): คลื่นกระแทกวง + จานเกลียวลม + ฝุ่นพุ่งเป็นวง + เส้นลมแผ่ราบ',['push','impact'])

# ===================== Windforce =====================
def body_wake(pre,T,k,tail=.3,rate=190):
    # ลมรอบตัวผู้พุ่ง (เล่นแบบ follow ตามตัว — att feet): กรวยลมโปร่ง 3 ชั้นหันไปข้างหน้า + เส้นลมเกลียวลากหลังตัว + เส้นลมความเร็วทิ้งไว้ตามทาง (อนุภาคอยู่ในโลก = เห็นแนวพุ่ง) + ฝุ่นตามพื้น
    L=[]
    L.append(tunnel(pre+'coneD',0,T+tail,'feet',[0,1.1,1.0*k],5.5*k,1.9*k,'#1a7a45',{'0':0,'0.15':.5,'0.6':.4,'1':0},scroll=(-3,0),tile=(2,1),tex='tex/wind_streaks_ink'))
    L.append(tunnel(pre+'cone',0,T+tail,'feet',[0,1.1,1.1*k],6.5*k,1.4*k,G['hi'],{'0':0,'0.15':.45,'0.6':.32,'1':0},scroll=(-6,0),tile=(3,1),tex='tex/wind_lines'))
    L.append(tunnel(pre+'cone2',0,T+tail,'feet',[0,1.1,.9*k],5*k,2.1*k,G['mid'],{'0':0,'0.15':.45,'0.6':.35,'1':0},scroll=(-4,0),tile=(2,1),tex='tex/wind_streaks'))
    L+=lines(pre+'tr',0,T+tail,'feet',[0,1.1,-.9*k],1.1*k,3,False,G['green'],G['mint'],.5)
    L.append(emit(pre+'streaks',0,T,[0,1.1,-.3],'sphere',att='feet',fr=.7*k,dir='aim',yaw=180,spread=.1,speed=[18,34],plife=[.25,.5],look='streak',size=[1.2*k,2.4*k],col=G['mint'],c2=G['mid'],rate=int(rate*.7),drag=.3,curl=False))
    L.append(emit(pre+'air',0,T,[0,1.1,.2],'sphere',att='feet',fr=1.8*k,dir='aim',yaw=180,spread=.06,speed=[14,26],plife=[.2,.4],look='streak',size=[1.4*k,2.8*k],col=G['mint'],c2=G['green'],rate=rate//2,drag=.2,curl=True,x=True))
    L.append(emit(pre+'dust',0,T,[0,.15,0],'disc',att='feet',fr=.6*k,dir='up',spread=.4,speed=[1,3],plife=[.5,.9],rate=70,size=[2.5*k,4.5*k],grow=.5,drag=1,x=True,**DUST))
    return L
def force_dash(n,Dm,T,desc):
    L=body_wake('',T,1.0,.25)
    L.append(warp('start',0,.3,'point',[0,1.1,0],'shock',{'0':.5,'1':3.4},str=.9))
    L.append({'id':'startring','t':'ring','at':0,'life':.3,'att':'point','pos':[0,.2,0],'col':G['hi'],'r':2.6,'op':.55})
    L.append(warp('end',round(T*.85,2),.35,'point',[0,1.1,Dm],'shock',{'0':.5,'1':3.6},str=.8))
    L.append({'id':'endring','t':'ring','at':round(T*.85,2),'life':.3,'att':'point','pos':[0,.2,Dm],'col':G['mint'],'r':2.2,'op':.5})
    L.append({'id':'shake','t':'screen','at':0,'life':.3,'own':True,'shake':1.2,'radial':.5})
    save(n,L,.7,desc,['force','dash'])
def force():
    force_dash('force_dash',26,.26,'Windforce (บิน) พุ่ง 26 ม.: อุโมงค์เส้นลมตามแนวพุ่ง (ขาว+เขียว) + เส้นลมพุ่งตามหลัง + ฝุ่นตามพื้น + คลื่นที่จุดเริ่ม/ปลายทาง (att point ที่จุดเริ่ม +z = ทิศพุ่ง)')
    force_dash('force_dash_g',15,.2,'Windforce (พื้น) พุ่งสั้น 15 ม.: เหมือนโหมดบินแต่สั้นกว่า')
    H=[]
    H.append({'id':'ring','t':'ring','at':0,'life':.3,'att':'point','pos':[0,-.5,0],'col':G['mint'],'r':1.8,'op':.5})
    H+=lines('sp',0,.5,'point',[0,0,0],.8,3,False,G['green'],G['hi'],.7)
    H.append(emit('streak',0,.06,[0,0,0],'sphere',burst=14,rate=0,fr=.3,dir='aim',yaw=180,spread=.6,speed=[6,12],plife=[.15,.3],look='streak',size=[1.4,2.6],col=G['hi'],c2=G['mid'],drag=2,curl=False))
    save('force_hit',H,.6,'Windforce เป้าถูกพาไป: วงลมที่เอว + เกลียวลมสั้น + เส้นลมสาดตามหลัง',['force','hit'])

# ===================== Windblade =====================
def blade():
    F=[]
    F.append(mesh('core',0,.3,'point',[0,0,0],shape='sphere',mat='glow',col=G['hi'],col2=G['mint'],loop=True,scale=[.1,.1,.55],op=.95))
    F.append(tunnel('tail',0,.3,'point',[0,0,.15],2.4,.34,G['mint'],.8,scroll=(-6,0),tile=(2,1),tex='tex/wind_streaks',loop=True))
    F.append(emit('streak',0,.3,[0,0,0],'sphere',loop=True,fr=.1,dir='aim',yaw=180,spread=.1,speed=[8,14],plife=[.08,.16],look='streak',size=[1,1.8],col=G['hi'],c2=G['mid'],rate=26,drag=.6,curl=False,x=True))
    save('blade_fly',F,.3,'Windblade ใบมีดลมเล็กตามกระสุน (เบา: ยิง 14 ใบต่อครั้ง): แกนขาวบางยืดยาว + หางเส้นลมเขียวจาง',['blade','projectile'])

# ===================== Featherwing บินเร็ว (Shift) =====================
def fast():
    F=[]
    # กรวยไอลมรอบลำตัว (หัวที่ด้านหน้า บานไปหลังตัว) + เส้นความเร็ว + ลมปลายปีก
    F.append(tunnel('coneD',0,.7,'feet',[0,1.2,1.0],6,1.9,'#1a7a45',.4,scroll=(-3,0),tile=(2,1),tex='tex/wind_streaks_ink',loop=True))
    F.append(tunnel('cone',0,.7,'feet',[0,1.2,1.2],7,1.5,G['hi'],.55,scroll=(-5,0),tile=(3,1),tex='tex/wind_lines',loop=True))
    F.append(tunnel('cone2',0,.7,'feet',[0,1.2,.9],5.5,2.1,G['mid'],.35,scroll=(-4,0),tile=(2,1),tex='tex/wind_streaks',loop=True))
    F+=lines('tr',0,.7,'feet',[0,1.2,-.4],1.6,3,True,G['green'],G['hi'],.75)
    for sd in (1,-1):
        F.append(emit('tip'+('R' if sd>0 else 'L'),0,.7,[sd*1.6,1.6,-.5],'sphere',loop=True,fr=.15,dir='aim',yaw=180,spread=.05,speed=[18,28],plife=[.2,.4],look='streak',size=[2,4],col=G['hi'],c2=G['mid'],rate=60,drag=.3,curl=False))
    F.append(emit('speed',0,.7,[0,1.2,2],'sphere',loop=True,fr=2.4,dir='aim',yaw=180,spread=.04,speed=[22,36],plife=[.15,.3],look='streak',size=[2,4],col=G['mint'],c2=G['green'],rate=80,drag=.2,curl=False))
    F.append(warp('haze',0,.7,'feet',[0,1.2,0],'haze',3.2,str=.4,op={'0':0,'0.2':1,'0.8':1,'1':0},loop=True,x=True))
    save('fw_fast',F,.7,'Featherwing บินเร็ว (Shift) วนตามตัวจนปล่อย: กรวยลมโปร่ง 2 ชั้นรอบลำตัว + เส้นลมเกลียวลากหลัง + เส้นความเร็วรอบตัว + ลมจากปลายปีก (+z = ทิศบิน)',['fast','loop'])

# ===================== Sonic Boom Strike =====================
def sonic_dash(n,Dm,T,W,desc):
    k=W
    D=body_wake('b_',T,1.5*k,.4,rate=190)
    for i in range(8):
        f=(i+1)/9
        D.append({'id':f'mach{i}','t':'mesh','at':round(T*f,3),'life':.55,'att':'point','shape':'torus','mat':'glow','col':G['mint'],'col2':G['mid'],'pos':[0,1.1,round(Dm*f,2)],'rot':[90,0,0],'scale':{'0':[.8,.8,.8],'1':[7*k,7*k,7*k]},'op':{'0':.8,'1':0},'fade':0})
    D+=runners('r',Dm,T,1.1,[(0,0),(1.0*k,.4*k),(-1.0*k,-.3*k),(0,1.1*k),(0,-.9*k)],1.1*k,.45,G['hi'],G['mid'],size=1.4*k)
    D+=along('sparks',0,T,1.1,Dm,190,fr=1.2*k,dir='out',spread=.6,speed=[6,14],plife=[.2,.5],look='streak',size=[2,4.2],col=G['hi'],c2=G['mid'],drag=.8,curl=True)
    D.append(warp('start',0,.4,'point',[0,1.1,0],'shock',{'0':.6,'1':6*k},str=1))
    D.append(warp('end',T,.5,'point',[0,1.1,Dm],'shock',{'0':.6,'1':9*k},str=1))
    D.append({'id':'startflash','t':'flash','at':0,'life':.12,'att':'point','pos':[0,1.1,0],'col':G['mint'],'size0':.5,'size':2.6*k,'k':.6})
    D.append({'id':'endflash','t':'flash','at':T,'life':.15,'att':'point','pos':[0,1.1,Dm],'col':G['mint'],'size0':.5,'size':3.5*k,'k':.8})
    D.append({'id':'shake','t':'screen','at':0,'life':.6,'near':40,'shake':3.5*k})
    D.append({'id':'kick','t':'screen','at':0,'life':.4,'own':True,'radial':1*k,'kick':.3*k})
    D.append({'id':'boom','t':'sound','at':0,'name':'boom','vol':1})
    save(n,D,1.0,desc,['sonic','dash'])
def sonic():
    # ชาร์จ 1 วิ ตามตัว: เส้นลมไหลเข้าหาตัว + วงลมหดเข้า + แกนขาวโตขึ้น + จานเกลียวใต้เท้าหมุนเร็วขึ้น
    C=[]
    C.append(mesh('disk',0,1.0,'ground',[0,.08,0],shape='plane',tex='tex/wind_void_disk',col=G['mid'],rot=[90,0,0],spin=420,scale={'0':2,'1':5},op={'0':0,'0.2':.8,'0.9':.9,'1':0}))
    C.append(mesh('shell',0,1.0,'feet',[0,1.1,0],shape='sphere',mat='tex',tex='tex/wind_air_rise',col=G['mint'],uvTile=[2,2],uvScroll=[1.5,-2],scale={'0':3.2,'1':1.1},op={'0':0,'0.3':.3,'1':.45}))
    C.append(mesh('core',.25,.75,'feet',[0,1.1,0],shape='sphere',mat='glow',col=G['mint'],col2=G['mid'],scale={'0':.15,'1':.55},op={'0':0,'0.5':.35,'1':.6}))
    C.append(emit('inflow',0,1.0,[0,1.1,0],'sphere',fr=3.5,rate=130,dir='in',speed=[6,12],plife=[.25,.45],look='streak',size=[1.6,3.2],col=G['hi'],c2=G['mid'],drag=.1,curl=True))
    C+=lines('sp',0,1.0,'feet',[0,1.1,0],1.3,5,False,G['green'],G['hi'],.7)
    C.append({'id':'ring0','t':'ring','at':0,'life':.45,'att':'ground','pos':[0,.12,0],'col':G['mint'],'r':5,'op':.4})
    C.append({'id':'ring1','t':'ring','at':.5,'life':.45,'att':'ground','pos':[0,.12,0],'col':G['hi'],'r':5.5,'op':.5})
    C.append(emit('dust',0,1.0,[0,.1,0],'ring',att='ground',rate=40,fr=2.5,dir='in',speed=[2,5],up=[.3,1],plife=[.5,.9],size=[2.5,4.5],grow=.5,drag=1,x=True,**DUST))
    C.append({'id':'hold','t':'screen','at':.2,'life':.8,'own':True,'radial':.5})
    save('sonic_charge',C,1.1,'Sonic Boom Strike ① ชาร์จ 1 วิ (ตามตัว): เส้นลมไหลเข้าหาตัว + เปลือกลมหดเข้า + แกนขาวโตขึ้น + จานเกลียวใต้เท้าหมุนเร็ว + วงสั่งสมพลัง',['sonic','charge'])
    sonic_dash('sonic_dash',120,.3,1.0,'Sonic Boom Strike ② พุ่งทะลุเสียง (บิน 120 ม. ใน 0.3 วิ ตรงกับ W_UL dA/tA): ลำเส้นลมขาว-เขียวบางยาวตามแนวพุ่ง + แกนเส้นตรงสว่าง + วงกรวยไอ (Mach cone) 8 วงไล่ตามทาง + คลื่นกระแทกที่จุดเริ่ม/ปลาย (att point ที่จุดเริ่ม +z = ทิศพุ่ง)')
    sonic_dash('sonic_dash_g',70,.22,.8,'Sonic Boom Strike ② (พื้น) พุ่ง 70 ม. ใน 0.22 วิ (W_UL dG/tG) แคบกว่าโหมดบิน')
    # ชนตรง: แฟลชขาวใหญ่ + เส้นลมแผ่รัศมี + วงช็อก + เศษลมกระเด็นไปตามทิศพุ่ง
    H=[]
    H.append({'id':'flash','t':'flash','at':0,'life':.15,'att':'point','pos':[0,0,0],'col':G['hi'],'size0':.5,'size':4.5,'k':1.4})
    H.append(warp('shock',0,.4,'point',[0,0,0],'shock',{'0':.5,'1':7},str=1))
    H.append({'id':'ring','t':'ring','at':0,'life':.35,'att':'ground','pos':[0,.12,0],'col':G['hi'],'r':6,'op':.7})
    H.append(emit('radial',0,.06,[0,0,0],'sphere',burst=60,rate=0,fr=.2,dir='out',speed=[14,26],plife=[.2,.45],look='streak',size=[2,4.2],col=G['hi'],c2=G['mid'],drag=1.4,curl=False))
    H.append(emit('fwd',0,.06,[0,0,0],'sphere',burst=30,rate=0,fr=.3,dir='aim',spread=.35,speed=[20,34],plife=[.2,.4],look='streak',size=[2,4],col=G['mint'],c2=G['green'],drag=.8,curl=False))
    H.append(emit('chips',0,.06,[0,0,0],'sphere',burst=8,rate=0,fr=.3,dir='out',speed=[6,12],plife=[.5,.9],look='model',model='wind_wing_airchip',mmat='glow',msize=[.08,.2],col=G['mint'],c2=G['green'],mspin=700,gravity=1,drag=1,bounce=0,x=True))
    H.append({'id':'shake','t':'screen','at':0,'life':.4,'near':30,'shake':2.5})
    H.append({'id':'kick','t':'screen','at':0,'life':.3,'own':True,'kick':.25,'flash':.04,'fcol':G['hi']})
    save('sonic_hit',H,.7,'Sonic Boom ชนตรง: แฟลชขาวใหญ่ + คลื่นช็อก + เส้นลมแผ่รัศมีและพุ่งไปตามทิศพุ่ง + เศษลม',['sonic','hit'])
    # พุ่งผ่าน (บูมตามหลัง): วงคลื่นเสียง + เส้นลมสาดออกจากเส้นทาง
    W=[]
    W.append(warp('shock',0,.4,'point',[0,0,0],'shock',{'0':.4,'1':4.2},str=.9))
    W.append({'id':'ring','t':'ring','at':0,'life':.3,'att':'point','pos':[0,-.3,0],'col':G['mint'],'r':3,'op':.55})
    W.append(emit('streak',0,.06,[0,0,0],'sphere',burst=22,rate=0,fr=.3,dir='out',speed=[8,16],plife=[.2,.4],look='streak',size=[1.6,3.2],col=G['hi'],c2=G['mid'],drag=1.6,curl=True))
    W.append({'id':'flash','t':'flash','at':0,'life':.1,'att':'point','pos':[0,0,0],'col':G['mint'],'size0':.3,'size':2,'k':.8})
    save('sonic_wave',W,.5,'Sonic Boom พุ่งผ่าน (บูมตามหลัง): คลื่นเสียงวงบิดอากาศ + วงลม + เส้นลมสาดออกจากเส้นทาง',['sonic','hit'])

windup();push();force();blade();fast();sonic()
