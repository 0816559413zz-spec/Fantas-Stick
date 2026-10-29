# กำแพงลม Aegis Gale (สายลม) — สร้างเอฟเฟกต์ wind/wall + ภาพ tex/wind_wall_fall + โมเดล mesh/wind_wall_*
# ใช้: python tools/wind-wall-gen.py แล้ว node tools/fx-check.js • ดูใน studio.html?fx=wind/wall
# Build the Yasuo-style curved wind wall (user ref 2026-10-27): vertical wind streaks flowing DOWN all the time,
# brighter at both ends, see-through middle, rounded top corners, a glowing ground line with curled ends showing the wall's range.
import json,math,random
from pathlib import Path
from PIL import Image,ImageFilter
ROOT=Path(__file__).resolve().parents[1]
def save(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=1),encoding='utf-8')

# ---- ภาพเส้นลมแนวตั้ง (ต่อบน-ล่างได้ ไหลลงด้วย uvScroll) ----
random.seed(7);W,H=1024,1024
img=Image.new('L',(W,H),0);px=img.load()
for _ in range(230):
    x=random.uniform(0,W);w=random.uniform(1.0,7.0);L=random.uniform(140,820);y0=random.uniform(0,H);b=random.uniform(.3,1.0)
    for dy in range(int(L)):
        t=dy/L;env=math.sin(math.pi*t)**.7*b
        y=int(y0+dy)%H
        for dx in range(int(-w*2),int(w*2)+1):
            xx=int(x+dx)%W;d=abs(dx)/w;a=env*(max(0,1-d)**1.6*.75+math.exp(-(d*2.2)**2)*.6)
            px[xx,y]=min(255,px[xx,y]+int(a*200))
img=img.filter(ImageFilter.GaussianBlur(.35))
rgba=Image.new('RGBA',(W,H),(255,255,255,0));rgba.putalpha(img)
rgba.save(ROOT/'assets/fx/tex/wind_wall_fall.png')
save(ROOT/'assets/fx/tex/wind_wall_fall.tex.json',{'v':1,'desc':'เส้นลมแนวตั้งต่อบน-ล่างได้ — ใช้กับกำแพงลม (uvScroll [0,-1] = ไหลลง)','gen':'image','seed':7,'px':1024,'cols':1,'rows':1,'kind':'loop','fps':24,'ramp':'white','add':True,'p':{}})

random.seed(9);TW,TH=1024,512
tip=Image.new('L',(TW,TH),0);tp=tip.load()
for _ in range(170):
    x=random.uniform(0,TW);w=random.uniform(1.2,6.5);top=random.uniform(.12,.75)*TH;b=random.uniform(.35,1)
    for y in range(int(top),TH):
        t=max(0,(y-top)/(TH-top));env=b*min(1,t*3.5)**1.4*(1-.25*t)
        for dx in range(int(-w*2),int(w*2)+1):
            xx=int(x+dx)%TW;d=abs(dx)/w;a=env*(max(0,1-d)**1.6*.75+math.exp(-(d*2.2)**2)*.6)
            tp[xx,y]=min(255,tp[xx,y]+int(a*190))
for y in range(TH):   # ด้านล่างสุดค่อย ๆ จาง (ซ้อนกับตัวกำแพงไม่ให้เห็นรอยต่อ)
    k=min(1,(TH-1-y)/(TH*.25))*min(1,y/(TH*.22))**1.5   # บนสุดจางเป็น 0 = ไม่มีรอยตัดที่ยอด
    for x in range(TW):tp[x,y]=int(tp[x,y]*k)
tip=tip.filter(ImageFilter.GaussianBlur(.35))
rg=Image.new('RGBA',(TW,TH),(255,255,255,0));rg.putalpha(tip);rg.save(ROOT/'assets/fx/tex/wind_wall_tips.png')
save(ROOT/'assets/fx/tex/wind_wall_tips.tex.json',{'v':1,'desc':'ปลายเส้นลมยอดกำแพง สูงต่ำไม่เท่ากัน จางขึ้นบน (ห้ามเลื่อนแนวตั้ง)','gen':'image','seed':9,'px':1024,'cols':1,'rows':1,'kind':'loop','fps':24,'ramp':'white','add':True,'p':{}})

random.seed(13);CW,CH=1024,512
cur=Image.new('L',(CW,CH),0);cp=cur.load()
for _ in range(260):
    x=random.uniform(0,CW);w=random.uniform(1.0,6.0);top=random.uniform(.0,.3)*CH;b=random.uniform(.45,1)   # ผู้ใช้: ทึบเต็มความสูง (เดิมเส้นเริ่ม 12-80% → ส่วนบนโหรง ดูเตี้ยเท่าตัวผู้เล่น)
    for y in range(int(top),CH):
        t=max(0,(y-top)/(CH-top));env=b*min(1,t*2.6)**1.5
        for dx in range(int(-w*2),int(w*2)+1):
            xx=int(x+dx)%CW;d=abs(dx)/w;a=env*(max(0,1-d)**1.6*.75+math.exp(-(d*2.2)**2)*.6)
            cp[xx,y]=min(255,cp[xx,y]+int(a*175))
for _ in range(420):   # เส้นบางคม (เส้นผมลม) ให้ดูละเอียด
    x=random.uniform(0,CW);top=random.uniform(.0,.45)*CH;b=random.uniform(.25,.8);wob=random.uniform(-1.5,1.5)
    for y in range(int(top),CH):
        t=max(0,(y-top)/(CH-top));xx=int(x+wob*t*6)%CW;env=b*min(1,t*3)**1.3
        cp[xx,y]=min(255,cp[xx,y]+int(env*150));cp[(xx+1)%CW,y]=min(255,cp[(xx+1)%CW,y]+int(env*55))
for _ in range(40):    # แผ่นจางกว้าง ให้ม่านมีเนื้อ
    x=random.uniform(0,CW);w=random.uniform(14,40);top=random.uniform(.03,.35)*CH;b=random.uniform(.15,.3)
    for y in range(int(top),CH):
        t=max(0,(y-top)/(CH-top));env=b*min(1,t*2)**1.2
        for dx in range(int(-w),int(w)+1):
            xx=int(x+dx)%CW;cp[xx,y]=min(255,cp[xx,y]+int(env*math.exp(-(dx/w*1.8)**2)*120))
for y in range(CH):
    k=min(1,y/(CH*.18))**1.5
    for x in range(CW):cp[x,y]=int(cp[x,y]*k)
cur=cur.filter(ImageFilter.GaussianBlur(.25))
rc=Image.new('RGBA',(CW,CH),(255,255,255,0));rc.putalpha(cur);rc.save(ROOT/'assets/fx/tex/wind_wall_curtain.png')
save(ROOT/'assets/fx/tex/wind_wall_curtain.tex.json',{'v':1,'desc':'ม่านเส้นลมกำแพง: เส้นตั้งจากพื้น ยอดสูงต่ำ จางหายก่อนขอบบน (เลื่อนแนวนอนได้ ห้ามเลื่อนแนวตั้ง)','gen':'image','seed':13,'px':1024,'cols':1,'rows':1,'kind':'loop','fps':24,'ramp':'white','add':True,'p':{}})

# ---- รูปทรง: ผนังโค้ง (ปลายสองข้างโค้งเข้าหาผู้ร่าย +z) ยอดมนตรงปลาย ----
R=10.9;AMAX=math.radians(35);HMAX=5.4   # 2026-10-29 user: a bit taller (was 4.5)
HK=HMAX/4.5   # กว้างรวม ~12.5 ม. = 250 หน่วยในเกม
def arc_wall(name,r,a0,a1,hmax,n=240,lift=0,seed=1):
    V=[];F=[];rg=random.Random(seed);jag=[1.0 for _ in range(n+1)]   # ยอดสูงต่ำมาจากภาพม่านแล้ว (ตัดรูปทรง = เห็นรอยตัด)
    for i in range(n+1):
        a=a0+(a1-a0)*i/n;x=r*math.sin(a);z=-r*math.cos(a)
        e=abs(a)/AMAX;h=hmax*jag[i]*max(.08,(1-e**6))**.5
        V+=[[round(x,4),lift,round(z,4)],[round(x,4),round(lift+h,4),round(z,4)]]
        if i<n:F.append([2*i,2*i+2,2*i+3,2*i+1])
    return {'id':name,'k':'poly','v':V,'f':F}
save(ROOT/'assets/fx/mesh/wind_wall_body.mesh.json',{'v':1,'desc':'กำแพงลมโค้ง (ผิวหลัก)','pal':'wind','mat':'solid','parts':[arc_wall('body',R,-AMAX,AMAX,HMAX,seed=2)]})
save(ROOT/'assets/fx/mesh/wind_wall_back.mesh.json',{'v':1,'desc':'กำแพงลมโค้ง (ชั้นหลัง)','pal':'wind','mat':'solid','parts':[arc_wall('back',R+.18,-AMAX,AMAX,HMAX*1.04,seed=5)]})
def arc_band(name,r,y0,y1,n=96,a0=None,a1=None):
    a0=-AMAX if a0 is None else a0;a1=AMAX if a1 is None else a1
    V=[];F=[]
    for i in range(n+1):
        a=a0+(a1-a0)*i/n;x=r*math.sin(a);z=-r*math.cos(a);e=abs(a)/AMAX;s=max(.08,(1-e**6))**.5
        V+=[[round(x,4),round(y0*s,4),round(z,4)],[round(x,4),round(y1*s,4),round(z,4)]]
        if i<n:F.append([2*i,2*i+2,2*i+3,2*i+1])
    return {'id':name,'k':'poly','v':V,'f':F}
NSEG=14;OVL=.35   # ช่วงซ้อนกันนิดหน่อย กันรอยต่อ
for s in range(NSEG):
    w=2*AMAX/NSEG;a0=-AMAX+s*w-w*OVL;a1=-AMAX+(s+1)*w+w*OVL
    save(ROOT/f'assets/fx/mesh/wind_wall_tips{s}.mesh.json',{'v':1,'desc':f'แถบปลายเส้นลมยอดกำแพง ช่วง {s}','pal':'wind','mat':'solid','parts':[arc_band('tips',R+.04+.01*(s%3),1.35*HK,3.7*HK,10,max(-AMAX,a0),min(AMAX,a1))]})
E=math.radians(8)
save(ROOT/'assets/fx/mesh/wind_wall_ends.mesh.json',{'v':1,'desc':'ปลายกำแพงสองข้าง (สว่าง)','pal':'wind','mat':'solid','parts':[arc_wall('endL',R-.06,-AMAX,-AMAX+E,HMAX,12),arc_wall('endR',R-.06,AMAX-E,AMAX,HMAX,12)]})
# เส้นพื้นบอกระยะ: โค้งตามกำแพง ปลายม้วนเข้า
def ground_path(r,curl):
    P=[]
    for i in range(29):
        a=-AMAX+2*AMAX*i/28;P.append([r*math.sin(a),.02,-r*math.cos(a)])
    def tail(s):
        a=s*AMAX;cx=r*math.sin(a);cz=-r*math.cos(a);out=[]
        for k in range(1,9):
            t=k/8;ang=t*math.pi*1.6;rr=curl*(1-t*.75)
            out.append([cx+s*(math.sin(ang)*rr*.8)+s*t*.25,.02,cz+(1-math.cos(ang))*rr])
        return out
    return [p for p in reversed(tail(-1))]+P+tail(1)
save(ROOT/'assets/fx/mesh/wind_wall_line.mesh.json',{'v':1,'desc':'เส้นพื้นบอกระยะกำแพงลม ปลายม้วน','pal':'wind','mat':'glow','parts':[
  {'id':'main','k':'ribbon','path':[[round(c,4) for c in p] for p in ground_path(R+.05,.55)],'w':.07,'seg':160},
  {'id':'thin','k':'ribbon','path':[[round(c,4) for c in p] for p in ground_path(R-.22,.3)],'w':.025,'seg':160}]})

# ---- เอฟเฟกต์ ----
DUR=18.0   # 2026-10-29 user: lasts longer (was 12)
#  # ผู้ใช้ 2026-10-28: อยู่ 12 วิ (เดิม 6) • สูงกว่าตัวผู้เล่น (HMAX 3.4 → 5.0 → 8.0 → 4.2: ผู้ใช้ 'ส่วนทึบสูง 2 เท่าตัวผู้เล่น' + ทึบขึ้น)
grow={'0':[1,.02,1],'0.045':[1,1.08,1],'0.07':[1,1,1],'0.93':[1,1,1],'1':[1,.02,1]}
fade=lambda pk:{'0':0,'0.03':pk,'0.94':pk,'1':0}
def flick(seed,lo=.45,hi=.92,step=.22):
    rg=random.Random(seed);k={};t=0
    while t<=DUR+1e-6:
        v=rg.uniform(lo,hi)
        if rg.random()<.08:v=1.0          # แตะเพดานนาน ๆ ครั้ง
        u=round(t/DUR,4);g=min(1,t/.25)*(1 if t<DUR-.35 else max(.02,(DUR-t)/.35))
        k[str(u)]=[1,round(max(.02,v*g),3),1];t+=step*rg.uniform(.7,1.3)
    k['1']=[1,.02,1];return k
L=[]
L.append({'id':'back','t':'mesh','at':0,'life':DUR,'att':'ground','pos':[0,0,R],'shape':'model','model':'wind_wall_back','mat':'tex','tex':'tex/wind_wall_curtain','col':'#4fd07a','col2':'#14663c','rim':0,'uvTile':[72.0,.96],'uvScroll':[-.015,0],'op':fade(.5),'scale':flick(4,.8,1.0,.27),'fade':0})
L.append({'id':'body','t':'mesh','at':0,'life':DUR,'att':'ground','pos':[0,0,R],'shape':'model','model':'wind_wall_body','mat':'tex','tex':'tex/wind_wall_curtain','col':'#c9fff0','col2':'#3aa58a','rim':0,'uvTile':[51.4,.96],'uvScroll':[.01,0],'op':fade(.62),'scale':flick(3,.82,1.0,.3),'fade':0})
L.append({'id':'body2','t':'mesh','at':0,'life':DUR,'att':'ground','pos':[0,0,R],'shape':'model','model':'wind_wall_body','mat':'tex','tex':'tex/wind_wall_curtain','col':'#ffffff','col2':'#c9fff0','rim':0,'uvTile':[30.9,.96],'uvScroll':[.02,0],'op':fade(.25),'scale':grow,'fade':0})
# ยอดเส้นลมขยับขึ้นลงตลอดเหมือนเปลวไฟ (ผู้ใช้ 2026-10-27): 6 ชั้นปลายเส้น แต่ละชั้นสูง-ต่ำสุ่มคนละจังหวะ แตะเพดานนาน ๆ ครั้ง
for j,(col,c2,tile,sx,pk) in enumerate([('#c9fff0','#4fd07a',[7,1],.03,.45),('#4fd07a','#14663c',[11,.9],-.02,.38),('#ffffff','#c9fff0',[5,1],.05,.3),
                                         ('#7fe8b0','#2fae5e',[9,1.1],-.04,.36),('#c9fff0','#3aa58a',[13,.95],.02,.32),('#4fd07a','#14663c',[6,1.05],-.03,.34)]):
  for s in range(NSEG):
    L.append({'id':f'tips{j}_{s}','t':'mesh','at':0,'life':DUR,'att':'ground','pos':[0,0,R],'shape':'model','model':f'wind_wall_tips{s}','mat':'tex','tex':'tex/wind_wall_tips','col':col,'col2':c2,'rim':0,'uvTile':[round(tile[0]*360/70,1),tile[1]],'uvScroll':[sx,0],'op':fade(pk),'scale':flick(31+j*7+s*101,step=.16+.05*((j+s)%4)),'fade':0})
L.append({'id':'ends','t':'mesh','at':0,'life':DUR,'att':'ground','pos':[0,0,R],'shape':'model','model':'wind_wall_ends','mat':'tex','tex':'tex/wind_wall_curtain','col':'#ffffff','col2':'#c9fff0','rim':0,'uvTile':[15.4,.96],'uvScroll':[.03,0],'op':fade(.6),'scale':grow,'fade':0})
L.append({'id':'line','t':'mesh','at':0,'life':DUR,'att':'ground','pos':[0,0,R],'shape':'model','model':'wind_wall_line','mat':'glow','col':'#c9fff0','col2':'#4fd07a','op':{'0':0,'0.02':1,'0.94':1,'1':0},'scale':{'0':[.2,1,.2],'0.05':[1,1,1]},'fade':0})
# เศษลมร่วงลงตามกำแพง
for s,ph in [(-1,0),(1,.5)]:
    L.append({'id':f'wisp{"LR"[(s+1)//2]}','t':'emit','at':.15,'life':DUR-.4,'att':'ground','pos':[s*R*math.sin(AMAX*.92),round(2.6*HK,2),round(R-R*math.cos(AMAX*.92),3)],'rate':10,'from':'sphere','fr':.4,'dir':'down','speed':[1.2,2.4],'plife':[.4,.9],'look':'streak','size':[.5,1.1],'col':'#e6fff4','c2':'#4fd07a','gravity':0,'drag':.5,'curl':False})
for j,(col,c2,rate) in enumerate([('#e6fff4','#4fd07a',70),('#4fd07a','#14663c',55)]):
    L.append({'id':f'fall{j}','t':'emit','at':.1,'life':DUR-.35,'att':'ground','pos':[0,0,R],'from':'mesh','of':'body','rate':rate,'dir':'down','speed':[2.6,4.2],'plife':[.35,.75],'look':'streak','size':[1.6,3.2],'col':col,'c2':c2,'gravity':0,'drag':0,'curl':False})
L.append({'id':'wispM','t':'emit','at':.15,'life':DUR-.4,'att':'ground','from':'mesh','of':'body','rate':14,'dir':'down','speed':[1,2],'plife':[.5,1],'look':'streak','size':[.4,.9],'col':'#c9fff0','c2':'#3aa58a','gravity':0,'drag':.5,'curl':False})
# ลมวนรอบกำแพง (ผู้ใช้ 2026-10-27 "add abit effect like wind around"): สโตรกลมเล็กวิ่งเลียบหน้ากำแพงไปมา + เศษลมลอยตาม
rgw=random.Random(21)
for j in range(9):
    s=1 if j%2 else -1;y=rgw.uniform(.5,2.6);a0=-s*AMAX*1.05;a1=s*AMAX*1.05;off=rgw.choice([-.55,.45])
    pts={}
    for k in range(7):
        u=k/6;a=a0+(a1-a0)*u;rr=R+off+.15*math.sin(u*6.3+j)
        pts[str(round(u,3))]=[round(rr*math.sin(a),3),round(y+.35*math.sin(u*9+j*1.7),3),round(-rr*math.cos(a)+R,3)]
    L.append({'id':f'gust{j}','t':'mesh','at':.3+j*.55,'life':round(min(DUR-.35-(.3+j*.55),1.6+rgw.uniform(0,.6)),2),'loop':True,'att':'ground','shape':'model','model':f'wind_pieces{j%3}','mat':'tex','tex':'tex/wind_swoosh_a_hi' if j%3 else 'tex/wind_swoosh_b',
        'col':'#e6fff4' if j%2 else '#7fe8b0','col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],'pos':pts,'rot':[0,0,90],'scale':[.35,.18,.35],'spin':s*420,'op':{'0':0,'0.15':.55,'0.8':.45,'1':0},'fade':0})
L.append({'id':'drift','t':'emit','at':.2,'life':DUR-.5,'att':'ground','pos':[0,0,R],'from':'mesh','of':'body','rate':18,'dir':'random','speed':[.6,1.6],'plife':[.8,1.6],'look':'streak','size':[.3,.6],'col':'#e6fff4','c2':'#4fd07a','gravity':0,'drag':.8,'curl':True})
# ตอนเกิด: วาบตามเส้นพื้น
L.append({'id':'rise','t':'emit','at':0,'life':.12,'att':'ground','from':'mesh','of':'line','burst':60,'rate':0,'dir':'up','speed':[3,6],'plife':[.25,.5],'look':'streak','size':[.8,1.6],'col':'#e6fff4','c2':'#4fd07a','gravity':0,'drag':2,'curl':False})
fx={'v':1,'desc':'กำแพงลม Aegis Gale — แบบกำแพงลม Yasuo (ผู้ใช้ 2026-10-27): ผนังโค้ง เส้นลมไหลลงตลอด ขอบสองข้างสว่าง กลางโปร่ง เส้นพื้นบอกระยะปลายม้วน','tags':['wind','wall','ground'],'pal':'wind','dur':DUR,'seed':11,'layers':L}
save(ROOT/'assets/fx/wind/wall.fx.json',fx)
print('wind/wall: Yasuo-style curved wall, 6 s')

# =====================================================================
# ชนกำแพง / ใกล้แตก / แตกระเบิด (ผู้ใช้ 2026-10-27 เลือก: กำแพงกระเพื่อม+ลมรัด • เส้นลมปั่นป่วน • ม่านลมระเบิดออกด้านหน้า)
# ทิศ (เช็กพิกัดจริงในสตูดิโอแล้ว): ผู้ร่ายอยู่ฝั่ง -z • ฝั่งศัตรู (ด้านหน้ากำแพง) = +z • ปลายกำแพงโค้งไปทาง +z
# =====================================================================
SW=lambda j:'tex/wind_swoosh_a_hi' if j%2 else 'tex/wind_swoosh_b'
# ---- ชน: วางที่ตัวศัตรู หัน -z เข้าหากำแพง • นาน 0.6 วิ (สตัน 0.5) ----
H=[]
for j,(y,sc,sp) in enumerate([(.45,.42,620),(.95,.38,-700),(1.45,.34,560)]):
    H.append({'id':f'bind{j}','t':'mesh','at':.02*j,'life':.56,'att':'ground','shape':'model','model':f'wind_pieces{j}','mat':'tex','tex':SW(j),'col':'#e6fff4' if j%2 else '#7fe8b0','col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],
        'pos':[0,y,0],'rot':[8*(j-1),j*50,0],'scale':{'0':[sc*1.8,.2,sc*1.8],'0.15':[sc,.24,sc],'0.85':[sc*.9,.22,sc*.9],'1':[sc*.5,.1,sc*.5]},'spin':sp,'op':{'0':0,'0.1':.85,'0.8':.7,'1':0},'fade':0})
for j in range(2):
    H.append({'id':f'ripple{j}','t':'mesh','at':.03*j,'life':.42,'att':'ground','shape':'model','model':f'wind_pieces{j+1}','mat':'tex','tex':SW(j),'col':'#ffffff' if j else '#c9fff0','col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],
        'pos':[0,1.0,-.35],'rot':[90,0,j*40],'scale':{'0':[.15,.1,.15],'1':[1.7+j*.5,.18,1.7+j*.5],'ease':'out'},'spin':300*(1-2*j),'op':{'0':0,'0.08':.9,'1':0},'fade':0})
H.append({'id':'flash','t':'flash','at':0,'life':.12,'att':'ground','pos':[0,1.0,-.3],'col':'#e6fff4','size0':.2,'size':1.6,'k':.9})
H.append({'id':'shock','t':'warp','at':0,'life':.3,'att':'ground','pos':[0,1.0,-.3],'kind':'shock','size':{'0':.4,'1':2.6},'str':.8,'op':{'0':1,'1':0},'col':'#c9fff0','glow':.04})
H.append({'id':'splinter','t':'emit','at':0,'life':.04,'att':'ground','pos':[0,1.0,-.3],'burst':18,'rate':0,'from':'sphere','fr':.15,'dir':'aim','yaw':0,'spread':1.4,'speed':[3,6],'plife':[.18,.35],'look':'streak','size':[.9,1.8],'col':'#e6fff4','c2':'#4fd07a','gravity':0,'drag':2.2,'curl':False})
H.append({'id':'shake','t':'screen','at':0,'life':.15,'shake':2.5})
save(ROOT/'assets/fx/wind/wall_hit.fx.json',{'v':1,'desc':'กำแพงลม: ศัตรูถูกผลักชนกำแพง (สตัน) — กำแพงกระเพื่อมเป็นวงคลื่นตรงจุดชน + ลมสโตรกรัดรอบตัวศัตรูตลอดสตัน 0.5 วิ (วางที่ตัวศัตรู หัน -z เข้ากำแพง)','tags':['wind','wall','hit','stun'],'pal':'wind','dur':.6,'seed':5,'layers':H})

# ---- ใกล้แตก: เล่นซ้อนกำแพงเดิม (วางเหมือน wind/wall) วนตลอดจนแตก ----
U=[{'id':'shiver','t':'mesh','at':0,'life':2,'loop':True,'att':'ground','pos':[0,0,R],'shape':'model','model':'wind_wall_body','mat':'tex','tex':'tex/wind_wall_curtain','col':'#e6fff4','col2':'#4fd07a','rim':0,'uvTile':[60,.96],'uvScroll':[.35,0],
    'scale':{'0':[1,1,1],'0.13':[1.005,1.06,1],'0.27':[.997,.95,1],'0.4':[1.004,1.04,1],'0.55':[.996,.97,1],'0.7':[1.006,1.07,1],'0.85':[.998,.96,1],'1':[1,1,1]},'op':{'0':.25,'0.2':.4,'0.45':.22,'0.7':.42,'1':.25},'fade':0}]
for j,(col,rate,sp) in enumerate([('#ffffff',120,[4,6.5]),('#7fe8b0',90,[3.5,5.5])]):
    U.append({'id':f'rush{j}','t':'emit','at':0,'life':2,'loop':True,'att':'ground','pos':[0,0,R],'from':'mesh','of':'shiver','rate':rate,'dir':'down','speed':sp,'plife':[.25,.5],'look':'streak','size':[1.8,3.4],'col':col,'c2':'#14663c','gravity':0,'drag':0,'curl':False})
U.append({'id':'chips','t':'emit','at':0,'life':2,'loop':True,'att':'ground','pos':[0,0,R],'from':'mesh','of':'shiver','rate':40,'dir':'aim','yaw':0,'spread':.9,'speed':[1.5,3.5],'plife':[.3,.7],'look':'streak','size':[.5,1.1],'col':'#e6fff4','c2':'#4fd07a','gravity':0,'drag':1.2,'curl':True})
save(ROOT/'assets/fx/wind/wall_unstable.fx.json',{'v':1,'desc':'กำแพงลมใกล้แตก (ดาเมจใกล้ 70) — เส้นลมไหลเร็วขึ้น สั่น สว่างขึ้น เศษลมหลุดออก (เล่นซ้อนกำแพง วนจนแตก)','tags':['wind','wall','loop'],'pal':'wind','dur':2,'seed':6,'layers':U})

# ---- แตกระเบิด: วางเหมือน wind/wall • หดเข้า 0.12 วิ แล้วระเบิดพัดออกด้านหน้า (-z) ----
B=[{'id':'contract','t':'mesh','at':0,'life':.2,'att':'ground','pos':[0,0,R],'shape':'model','model':'wind_wall_body','mat':'tex','tex':'tex/wind_wall_curtain','col':'#ffffff','col2':'#c9fff0','rim':0,'uvTile':[51.4,.96],'uvScroll':[0,0],
    'scale':{'0':[1,1,1],'0.6':[.97,.72,.94],'1':[1.03,.3,1.1]},'op':{'0':.6,'0.6':.95,'1':0},'fade':0}]
rgb=random.Random(77)
for j in range(22):
    a=-AMAX*.95+1.9*AMAX*j/21;x=R*math.sin(a);z=-R*math.cos(a)+R;y=rgb.uniform(.3,2.6);dist=rgb.uniform(5,10);nx,nz=math.sin(a)*.3,1
    B.append({'id':f'gust{j}','t':'mesh','at':round(.12+rgb.uniform(0,.06),3),'life':round(.55+rgb.uniform(0,.2),3),'att':'ground','shape':'model','model':f'wind_pieces{j%3}','mat':'tex','tex':SW(j),'col':'#e6fff4' if j%2 else '#4fd07a','col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],
        'pos':{'0':[round(x,3),round(y,3),round(z,3)],'1':[round(x+nx*dist,3),round(y+rgb.uniform(-.3,.8),3),round(z+nz*dist,3)],'ease':'out'},'rot':[90,0,round(rgb.uniform(-30,30),1)],'scale':{'0':[.9,.4,.9],'0.3':[2.6,.6,2.6],'1':[4.2,.25,4.2]},'spin':rgb.choice([-1,1])*500,'op':{'0':0,'0.06':1,'0.6':.75,'1':0},'fade':0})
# ตัวม่านลมถูกพัดพุ่งออกไปด้านหน้าทั้งแผ่น (กว้างขึ้น เตี้ยลง จาง)
for j,(col,dz,dl) in enumerate([('#ffffff',7,0),('#7fe8b0',10,.04)]):
    B.append({'id':f'blow{j}','t':'mesh','at':.12+dl,'life':.55,'att':'ground','shape':'model','model':'wind_wall_body','mat':'tex','tex':'tex/wind_wall_curtain','col':col,'col2':'#4fd07a','rim':0,'uvTile':[51.4,.96],'uvScroll':[0,-2],
        'pos':{'0':[0,0,R],'1':[0,0,round(R+dz,2)],'ease':'out'},'scale':{'0':[1,1,1],'0.3':[1.15,.85,1.15],'1':[1.4,.45,1.4]},'op':{'0':.95,'0.4':.7,'1':0},'fade':0})
B.append({'id':'shards','t':'emit','at':.12,'life':.05,'att':'ground','pos':[0,0,R],'from':'mesh','of':'contract','burst':80,'rate':0,'dir':'aim','yaw':0,'spread':.8,'speed':[7,14],'up':[0,3],'plife':[.35,.8],'look':'streak','size':[1.4,3],'col':'#e6fff4','c2':'#4fd07a','gravity':0,'drag':1.4,'curl':False})
B.append({'id':'floor','t':'mesh','at':.12,'life':.7,'att':'ground','pos':[0,.04,1.5],'shape':'model','model':'wind_groundswirl','mat':'tex','tex':'tex/wind_swoosh_b','col':'#8dff65','col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],'scale':{'0':1,'0.4':5,'1':8,'ease':'out'},'spin':200,'op':{'0':0,'0.08':.9,'1':0},'fade':0})
B.append({'id':'flash','t':'flash','at':.12,'life':.2,'att':'ground','pos':[0,1.3,1.2],'col':'#e6fff4','size0':1,'size':5,'k':1})
B.append({'id':'shock','t':'warp','at':.12,'life':.45,'att':'ground','pos':[0,.1,1.5],'kind':'shock','flat':True,'size':{'0':1,'1':14},'str':1.4,'op':{'0':1,'1':0},'col':'#c9fff0','glow':.05})
B.append({'id':'shake','t':'screen','at':.12,'life':.3,'shake':7,'flash':.03,'fcol':'#e6fff4'})
save(ROOT/'assets/fx/wind/wall_break.fx.json',{'v':1,'desc':'กำแพงลมแตกระเบิด — หดเข้าสั้น ๆ แล้วม่านลมระเบิดพัดออกด้านหน้า (สโตรกลมใหญ่ + เส้นลมแตกกระจาย + คลื่นพื้น + จอสั่น) วางเหมือน wind/wall','tags':['wind','wall','break'],'pal':'wind','dur':1.2,'seed':7,'layers':B})
print('wind/wall_hit, wall_unstable, wall_break')

# =====================================================================
# ดันกำแพงพุ่งไปข้างหน้า (ผู้ใช้ 2026-10-27 เลือก: กำแพงเอนไปข้างหน้า + รอยลาก)
# wind/wall_push = เล่นวนซ้อนกำแพงตอนกำแพงวิ่ง (เกมขยับตำแหน่งตามกำแพง) • wind/wall_stop = ตอนหยุด เด้งตั้งตรง + คลื่นลมเล็ก
# พิกัด: pos กับโมเดลแกนเดียวกัน • +z = ไปข้างหน้า (ฝั่งศัตรู) • กลางกำแพงอยู่ที่จุดวาง (pos z = R ชดเชยรัศมีวงโค้ง)
# =====================================================================
def lean_wall(name,r,hmax,k,n=120):
    V=[];F=[]
    for i in range(n+1):
        a=-AMAX+2*AMAX*i/n;x=r*math.sin(a);z=-r*math.cos(a);e=abs(a)/AMAX;h=hmax*max(.08,(1-e**6))**.5
        V+=[[round(x,4),0,round(z,4)],[round(x,4),round(h,4),round(z+k*h,4)]]
        if i<n:F.append([2*i,2*i+2,2*i+3,2*i+1])
    return {'id':name,'k':'poly','v':V,'f':F}
save(ROOT/'assets/fx/mesh/wind_wall_lean.mesh.json',{'v':1,'desc':'กำแพงลมเอนไปข้างหน้า (ตอนดัน)','pal':'wind','mat':'solid','parts':[lean_wall('lean',R,HMAX,.38)]})
save(ROOT/'assets/fx/mesh/wind_wall_front.mesh.json',{'v':1,'desc':'ลมอัดหน้ากำแพง (ตอนดัน)','pal':'wind','mat':'solid','parts':[lean_wall('front',R-.35,HMAX*.85,.5)]})
P=[]
P.append({'id':'lean','t':'mesh','at':0,'life':.6,'loop':True,'att':'ground','pos':[0,0,R],'shape':'model','model':'wind_wall_lean','mat':'tex','tex':'tex/wind_wall_curtain','col':'#e6fff4','col2':'#4fd07a','rim':0,'uvTile':[51.4,.96],'uvScroll':[.6,0],'op':.45,'fade':0})
P.append({'id':'front','t':'mesh','at':0,'life':.6,'loop':True,'att':'ground','pos':[0,0,R],'shape':'model','model':'wind_wall_front','mat':'tex','tex':'tex/wind_wall_curtain','col':'#ffffff','col2':'#c9fff0','rim':0,'uvTile':[40,.96],'uvScroll':[-.8,0],'op':{'0':.35,'0.5':.55,'1':.35},'fade':0})
# รอยลากบนพื้นด้านหลัง + เศษฝุ่น/ใบไม้ปลิวตาม
P.append({'id':'drag','t':'emit','at':0,'life':.6,'loop':True,'att':'ground','pos':[0,.05,-R],'from':'mesh','of':'lean','rate':90,'dir':'aim','yaw':180,'spread':.25,'speed':[5,9],'up':[0,.3],'plife':[.4,.8],'look':'streak','size':[2,4],'col':'#c9fff0','c2':'#14663c','gravity':3,'drag':1.5,'curl':False})
P.append({'id':'dust','t':'emit','at':0,'life':.6,'loop':True,'att':'ground','pos':[0,.1,-R],'from':'mesh','of':'lean','rate':35,'dir':'aim','yaw':180,'spread':.6,'speed':[2,5],'up':[.5,2],'plife':[.5,1],'look':'model','model':'wind_wing_airchip','mmat':'glow','msize':[.08,.16],'mspin':200,'col':'#b7ff87','c2':'#329b50','gravity':1,'drag':1.2,'curl':True})
P.append({'id':'floorlines','t':'mesh','at':0,'life':.6,'loop':True,'att':'ground','pos':[0,.03,-1.6],'shape':'model','model':'wind_groundswirl','mat':'tex','tex':'tex/wind_swoosh_b','col':'#7fe8b0','col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],'scale':[3.2,1,1.2],'spin':0,'op':{'0':.15,'0.5':.35,'1':.15},'fade':0})
# เส้นลมพุ่งนำหน้ากำแพง
P.append({'id':'ahead','t':'emit','at':0,'life':.6,'loop':True,'att':'ground','pos':[0,1.2,-R],'from':'mesh','of':'front','rate':45,'dir':'aim','yaw':0,'spread':.2,'speed':[8,12],'plife':[.15,.3],'look':'streak','size':[1.5,3],'col':'#ffffff','c2':'#7fe8b0','gravity':0,'drag':.5,'curl':False})
save(ROOT/'assets/fx/wind/wall_push.fx.json',{'v':1,'desc':'ดันกำแพงลมพุ่งไปข้างหน้า (เล่นวนซ้อนกำแพงขณะวิ่ง): กำแพงเอนไปข้างหน้า ลมอัดสว่างที่หน้ากำแพง รอยลมลากยาวบนพื้นด้านหลัง เศษลมปลิว เส้นลมพุ่งนำ','tags':['wind','wall','push','loop'],'pal':'wind','dur':.6,'seed':8,'layers':P})
S=[]
S.append({'id':'snap','t':'mesh','at':0,'life':.35,'att':'ground','pos':[0,0,R],'shape':'model','model':'wind_wall_lean','mat':'tex','tex':'tex/wind_wall_curtain','col':'#ffffff','col2':'#c9fff0','rim':0,'uvTile':[51.4,.96],'uvScroll':[0,0],'scale':{'0':[1,1,1],'0.4':[1,1.08,1],'1':[1,1,1]},'op':{'0':.6,'1':0},'fade':0})
for j in range(2):
    S.append({'id':f'puff{j}','t':'mesh','at':.03*j,'life':.45,'att':'ground','pos':[0,.05,0],'shape':'model','model':'wind_groundswirl','mat':'tex','tex':'tex/wind_swoosh_b' if j else 'tex/wind_swoosh_a_hi','col':'#c9fff0' if j else '#ffffff','col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],'scale':{'0':[1.5,1,.6],'1':[5,1,2],'ease':'out'},'spin':120*(1-2*j),'op':{'0':0,'0.1':.7,'1':0},'fade':0})
S.append({'id':'spray','t':'emit','at':0,'life':.05,'att':'ground','pos':[0,1.2,0],'from':'sphere','fr':1.5,'burst':40,'rate':0,'dir':'aim','yaw':0,'spread':.9,'speed':[4,8],'up':[.5,2],'plife':[.25,.5],'look':'streak','size':[1,2.2],'col':'#e6fff4','c2':'#4fd07a','gravity':0,'drag':2,'curl':False})
S.append({'id':'shake','t':'screen','at':0,'life':.15,'shake':2})
save(ROOT/'assets/fx/wind/wall_stop.fx.json',{'v':1,'desc':'กำแพงลมหยุดหลังดัน: เด้งตั้งตรง + คลื่นลมพื้นเล็ก + เส้นลมพ่นไปข้างหน้า (วางเหมือน wind/wall)','tags':['wind','wall','push'],'pal':'wind','dur':.5,'seed':9,'layers':S})
print('wind/wall_push, wall_stop')
