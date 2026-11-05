# Vortex Bind ตามสตอรี่บอร์ด #17 (ผู้ใช้ 2026-11-05) — 3 แบบให้เลือก: wind/vortex_bind_sb_a / _b / _c
# ภาพร่าง: ลมหลายเส้นพุ่งออกจากไม้ไปข้างหน้า (0–0.25 วิ) → ไปถึงแล้วม้วนเป็นเกลียวเล็ก (0.25–0.4) → โตเป็นทอร์นาโด 3 อัน (0.4–0.75)
#          → "พายุดูดกลับเข้ามา" (0.8–1.05 ตามโค้ด W_VX.hold/pull) แล้วสลาย
#   a = ตามภาพร่างตรง ๆ • b = ลมใส เบา (แนว Aegis "ลมใส" ที่ผู้ใช้เลือก) • c = หนัก โชว์ (ใหญ่ขึ้น ลมเยอะ ดูดแรง)
# ตัวทอร์นาโดใช้แบบเดียวกับ wind/vortex_bind เดิม (tools/wind-vortex-gen.py) แต่ขึ้นช้าลงหลังลมไปถึง
# ใช้: python tools/wind-vortex-sb-gen.py แล้ว node tools/fx-check.js • ดู studio.html?fx=wind/vortex_bind_sb_a
import json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FAR,NEAR=15.0,3.0                 # W_VX.far 300 / near 60 (px ÷ 20)
T_ARRIVE,T_FULL,T_PULL,T_ARR,T_END=0.22,0.75,0.8,1.05,1.35
W,LG,G,DG,LN='#ffffff','#efffe8','#8dff65','#2ec772','#1a7a45'
WAND=[0.4,1.3,0.6]                # ปลายไม้ (ขวา, สูง, หน้า)
ANG=[math.radians(-22.5),0.0,math.radians(22.5)]
r2=lambda v:round(v,2)

def at_dist(a,d,y=0.0,side=0.0):  # จุดบนแนวมุม a ระยะ d (+ เยื้องข้าง)
    sx,cz=math.sin(a),math.cos(a)
    return [r2(sx*d+cz*side),r2(y),r2(cz*d-sx*side)]

def build(v):
    S=v['S'];L=[]
    life=T_END-T_ARRIVE
    k=lambda t:str(round((t-T_ARRIVE)/life,3))        # เวลาจริง → เวลาในชั้นทอร์นาโด
    def path(a,y=0.0):
        return {'0':at_dist(a,FAR,y),k(T_PULL):at_dist(a,FAR,y),k(T_PULL+.12):at_dist(a,FAR-1.2,y),k(T_ARR):at_dist(a,NEAR,y),'1':at_dist(a,NEAR,y)}
    def grow(s,end=.15):   # เกลียวเล็กตอนลมไปถึง → โตเต็มที่ T_FULL → พองนิดก่อนดึง → หดตอนมาถึง → ยุบ
        return {'0':round(.12*s,3),k(.4):round(.35*s,3),k(T_FULL):round(s,3),k(T_PULL):round(1.1*s,3),k(T_ARR):round(.8*s,3),k(T_ARR+.1):round(.6*s,3),'1':round(end*s,3)}
    OP=lambda o:{'0':0,k(.3):o,k(T_ARR+.1):o,'1':0}
    R=v['rate']

    # ---- ช่วง 1 ปล่อย: ลมหลายเส้นพุ่งจากไม้ไปจุดทอร์นาโด เป็นเส้นคลื่น ----
    L.append({'id':'cast','t':'flash','at':0,'life':.15,'att':'feet','pos':WAND,'col':LG,'size0':.2,'size':v['castFlash'],'k':1})
    L.append({'id':'cast_puff','t':'emit','at':0,'life':.08,'att':'feet','pos':WAND,'burst':int(18*R),'rate':0,'from':'sphere','fr':.2,'dir':'aim','spread':.5,'speed':[8,14],'plife':[.12,.25],'look':'streak','size':[1,1.8],'col':W,'c2':G,'gravity':0,'drag':2,'curl':False})
    for n,a in enumerate(ANG):
        for j,(y,amp,ph,w) in enumerate(v['streaks']):
            keys={};N=12
            for i in range(N+1):
                u=i/N;e=1-(1-u)**1.6                     # ออกเร็ว ช้าลงตอนใกล้ถึง
                d=0.8+(FAR-0.8)*e
                side=amp*math.sin(u*math.pi*2.2+ph)*(0.3+u)
                yy=WAND[1]+(y-WAND[1])*e
                p=at_dist(a,d,yy,side)
                if i==0:p=[WAND[0],WAND[1],WAND[2]]
                keys[str(round(u,3))]=p
            L.append({'id':f's1_{n}_{j}','t':'trail','at':round(n*.02+j*.03,2),'life':T_ARRIVE+.02,'att':'feet','pos':keys,'col':W if j%2==0 else LG,'col2':G,'w':w,'tlife':v['tlife'],'k':v['trailK']})
        # หัวลม: ละอองตามหัวเส้นกลาง
        L.append({'id':f's1_{n}_head','t':'emit','at':n*.02,'life':T_ARRIVE,'att':'feet','pos':{'0':WAND,'1':at_dist(a,FAR,1.1)},'rate':int(90*R),'from':'sphere','fr':.25,'dir':'out','speed':[1,3],'plife':[.1,.2],'look':'spark','size':[.8,1.4],'col':'#d2ffb8','c2':G,'gravity':0})

    # ---- ช่วง 2 กระทบ: ไปถึงแล้วม้วนเป็นเกลียว (เส้นลมวนขึ้น) → ทอร์นาโดโตขึ้น ----
    for n,a in enumerate(ANG):
        C=at_dist(a,FAR)
        for j in range(v['curls']):
            keys={};N=16;turns=1.6;ph=j*2.1
            for i in range(N+1):
                u=i/N;ang=ph+u*turns*math.pi*2;rad=.5+u*(1.3+.3*j)*S/1.5
                keys[str(round(u,3))]=[r2(C[0]+math.cos(ang)*rad),r2(.4+u*(1.6+.7*j)*S/1.5),r2(C[2]+math.sin(ang)*rad)]
            L.append({'id':f's2_{n}_curl{j}','t':'trail','at':round(T_ARRIVE-.03+n*.02+j*.05,2),'life':.45,'att':'feet','pos':keys,'col':W,'col2':G,'w':v['curlW'],'tlife':.3,'k':v['trailK']})
        L.append({'id':f's2_{n}_arrive','t':'emit','at':T_ARRIVE+n*.02,'life':.06,'att':'feet','pos':at_dist(a,FAR,.8),'burst':int(24*R),'rate':0,'from':'ring','fr':.6,'dir':'tangent','speed':[5,9],'up':[1,3],'plife':[.2,.4],'look':'streak','size':[1.2,2.2],'col':W,'c2':G,'gravity':0,'drag':1,'curl':False})

    # ---- ตัวทอร์นาโด (แบบ vortex_bind เดิม) ขึ้นตอนลมไปถึง ----
    for n,a in enumerate(ANG):
        p=f't{n}_';P=path(a);at=round(T_ARRIVE+n*.02,2);lf=round(life-n*.02,2)
        L.append({'id':p+'helix','t':'mesh','at':at,'life':lf,'att':'feet','shape':'model','model':'wind_helix','mat':'glow','col':LG,'int':v['glow'],'pos':P,'spin':600,'scale':grow(S),'op':OP(.95*v['op']),'fade':0})
        L.append({'id':p+'helix2','t':'mesh','at':at,'life':lf,'att':'feet','shape':'model','model':'wind_helix','mat':'energy','col':G,'col2':DG,'rot':[0,45,0],'pos':P,'spin':420,'scale':grow(S*1.12),'rim':.3,'op':OP(.85*v['op']),'fade':0})
        if v['dark']:
            L.append({'id':p+'helix3','t':'mesh','at':at,'life':lf,'att':'feet','shape':'model','model':'wind_helix','mat':'solid','col':DG,'col2':LN,'rot':[0,100,0],'pos':P,'spin':-380,'scale':grow(S*1.22),'rim':0,'op':OP(.7),'fade':0})
        L.append({'id':p+'core','t':'mesh','at':at,'life':lf,'att':'feet','shape':'model','model':'wind_core','mat':'tex','tex':'tex/wind_streaks','col':W,'col2':'#000000','rim':0,'uvTile':[2,3],'uvScroll':[-2.5,-.8],'pos':P,'spin':700,
                  'scale':{kk:[round(x*.75,3),round(x*.8,3),round(x*.75,3)] for kk,x in grow(S).items()},'int':v['coreInt'],'op':OP(.9*v['op']),'fade':0})
        for j,(y,tex,col,sp,sc) in enumerate([(1.0,'tex/wind_swoosh_a_hi',W,560,1.25),(2.2,'tex/wind_swoosh_b',G,-480,1.55)]):
            L.append({'id':p+f'band{j}','t':'mesh','at':at+.05,'life':lf-.05,'att':'feet','shape':'model','model':f'wind_pieces{j}','mat':'tex','tex':tex,'col':col,'col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],
                      'pos':path(a,y*S/1.5),'rot':[0,j*90,0],'spin':sp,'scale':{kk:[x,round(x*.45,3),x] for kk,x in grow(sc*S*.75).items()},'op':OP(.9*v['op']),'fade':0})
        for j,(tex,col,sp,sc) in enumerate([('tex/wind_swoosh_b',G,300,1.5),('tex/wind_swoosh_a_hi',W,-240,1.1)]):
            L.append({'id':p+f'gs{j}','t':'mesh','at':at,'life':lf,'att':'feet','shape':'model','model':'wind_groundswirl','mat':'tex','tex':tex,'col':col,'col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],
                      'pos':path(a,.04+j*.02),'rot':[0,j*60,0],'spin':sp,'scale':grow(sc*S),'op':OP(.9*v['op']),'fade':0})
        # อนุภาครอบลำ (เริ่มหลังเกลียวเริ่มโต)
        E0=T_ARRIVE+.12;EL=T_ARR+.05-E0
        Pe=lambda y=0.0:{'0':at_dist(a,FAR,y),str(round((T_PULL-E0)/EL,3)):at_dist(a,FAR,y),'1':at_dist(a,NEAR,y)}
        for j,(y,fr,sp) in enumerate([(0.6,1.9,1),(1.7,2.3,-1),(2.8,2.8,1),(3.8,3.2,-1)][:v['orbits']]):
            L.append({'id':p+f'orbit{j}','t':'emit','at':E0,'life':EL,'att':'feet','pos':Pe(round(y*S/1.5,2)),'rate':int(55*R),'from':'ring','fr':round(fr*S/1.5,2),'dir':'tangent','speed':[7*sp,11*sp],'up':[.3,1.2],'plife':[.25,.45],'look':'streak','size':[1.6,3.0],'col':W,'c2':G,'gravity':0,'drag':.3,'curl':False})
        L.append({'id':p+'suck','t':'emit','at':E0,'life':T_PULL-E0,'att':'feet','pos':at_dist(a,FAR),'rate':int(70*R),'from':'ring','fr':2.6*S/1.5,'dir':'in','speed':[4,7],'up':[0,1.5],'plife':[.3,.5],'look':'streak','size':[1,2],'col':W,'c2':G,'gravity':0,'drag':.5,'curl':False})
        L.append({'id':p+'dust','t':'emit','at':E0,'life':EL,'att':'feet','pos':Pe(.1),'rate':int(35*R),'from':'ring','fr':1.6*S/1.5,'dir':'tangent','speed':[4,7],'up':[.2,.8],'plife':[.4,.7],'look':'model','model':'wind_slash','mmat':'solid','msize':[.06,.14],'col':'#8a7560','c2':'#c9b79a','gravity':1,'mspin':500,'bounce':0})
        if v['leaves']:
            L.append({'id':p+'leaves','t':'emit','at':E0,'life':EL,'att':'feet','pos':Pe(),'rate':int(14*R),'from':'cone','fr':1.5*S/1.5,'fh':3.5*S/1.5,'dir':'tangent','speed':[4,7],'up':[1,3],'plife':[.6,1],'look':'model','model':'wind_leaf','mmat':'solid','msize':[.1,.18],'col':'#6fae5a','c2':'#3f7a3a','gravity':-.2,'mspin':500,'bounce':0})
        L.append({'id':p+'glint','t':'emit','at':E0,'life':EL,'att':'feet','pos':Pe(),'rate':int(40*R),'from':'cone','fr':1.8*S/1.5,'fh':4*S/1.5,'dir':'tangent','speed':[3,6],'up':[.5,2],'plife':[.3,.6],'look':'spark','size':[1,2],'col':'#d2ffb8','c2':G,'gravity':-.2})

    # ---- ช่วง 3: พายุดูดกลับเข้ามา (ลูกศรในภาพร่างเฟรม 8) ----
    for n,a in enumerate(ANG):
        p=f'x{n}_';yaw=round((math.degrees(a)+360)%360-180,1);at=round(n*.02,2)
        if v['chargeFlash']:
            L.append({'id':p+'charge','t':'flash','at':T_PULL-.12+at,'life':.16,'att':'feet','pos':at_dist(a,FAR,1.6*S/1.5),'col':G,'size0':.6,'size':v['chargeFlash'],'k':.7})
        L.append({'id':p+'drag','t':'emit','at':T_PULL+at,'life':T_ARR-T_PULL,'att':'feet','pos':{'0':at_dist(a,FAR,.15),'1':at_dist(a,NEAR,.15)},
                  'rate':int(120*R),'from':'disc','fr':.8,'dir':'aim','yaw':yaw,'spread':.25,'speed':[8,14],'plife':[.15,.3],'look':'streak','size':[1.2,2.4],'col':W,'c2':G,'gravity':0,'drag':1,'curl':False})
        L.append({'id':p+'tether','t':'emit','at':T_PULL+at,'life':T_ARR-T_PULL,'att':'feet','pos':{'0':at_dist(a,FAR*.5,1.2),'1':at_dist(a,NEAR*.5,1.2)},'rate':min(200,int(160*R)),'from':'line','fr':FAR*.5,'dir':'aim','yaw':yaw,'spread':.05,'speed':[14,20],'plife':[.1,.2],'look':'streak','size':[1.4,2.6],'col':W,'c2':G,'gravity':0,'drag':.5,'curl':False})
        # ลูกศรลมนำหน้า: เส้นยาววิ่งจากทอร์นาโดเข้าหาเราก่อนตัวทอร์นาโด
        for j,(y,side) in enumerate(v['arrows']):
            L.append({'id':p+f'arrow{j}','t':'trail','at':T_PULL-.04+at+j*.03,'life':.3,'att':'feet','pos':{'0':at_dist(a,FAR-.5,y,side),'1':at_dist(a,NEAR-.6,y,side*.4)},'col':W,'col2':G,'w':v['arrowW'],'tlife':.25,'k':v['trailK']})
        for j,(tex,col) in enumerate([('tex/wind_swoosh_b',G),('tex/wind_swoosh_a_hi',W)]):
            L.append({'id':p+f'trail{j}','t':'mesh','at':T_PULL+at,'life':T_ARR-T_PULL+.25,'att':'feet','shape':'model','model':'wind_groundswirl','mat':'tex','tex':tex,'col':col,'col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],
                      'pos':{'0':at_dist(a,FAR,.05+j*.02),'0.2':at_dist(a,FAR-1.2,.05+j*.02),'0.5':at_dist(a,NEAR,.05+j*.02),'1':at_dist(a,NEAR,.05+j*.02)},'rot':[0,j*70,0],'spin':500*(1-2*j),'scale':{'0':1.6*S/1.5,'0.5':2.6*S/1.5,'1':1.2*S/1.5},'op':{'0':0,'0.1':.95*v['op'],'0.7':.8*v['op'],'1':0},'fade':0})
        E=at_dist(a,NEAR,1.2)
        L.append({'id':p+'pop','t':'flash','at':T_ARR+at+.08,'life':.12,'att':'feet','pos':E,'col':LG,'size0':.3,'size':v['popFlash'],'k':.8})
        L.append({'id':p+'popstk','t':'emit','at':T_ARR+at+.08,'life':.05,'att':'feet','pos':E,'burst':int(30*R),'rate':0,'from':'sphere','fr':.6,'dir':'out','speed':[5,9],'plife':[.15,.3],'look':'streak','size':[1.2,2.2],'col':W,'c2':G,'gravity':0,'drag':2,'curl':False})
    L.append({'id':'pull','t':'flash','at':T_PULL,'life':.15,'att':'feet','pos':[0,1.2,.5],'col':G,'size0':.2,'size':1.5,'k':1})
    L.append({'id':'shake','t':'screen','at':T_PULL,'life':.12,'shake':v['shake']})
    return {'v':1,'desc':v['desc'],'tags':['wind','vortex','storyboard'],'pal':'wind','dur':1.6,'seed':21,'layers':L}

VAR={
 'a':{'desc':'Vortex Bind สตอรี่บอร์ด #17 แบบ A — ตามภาพร่าง: ลม 3 เส้นต่อทิศพุ่งออกจากไม้ → ม้วนเป็นเกลียว → โตเป็นทอร์นาโด 3 อัน → ลูกศรลมดูดกลับเข้ามา',
      'S':1.5,'rate':1.0,'op':1.0,'glow':.75,'coreInt':1.3,'dark':True,'leaves':True,'orbits':4,
      'streaks':[(0.8,.55,0,.22),(1.3,.7,2.1,.26),(1.9,.5,4.2,.22)],'tlife':.3,'trailK':1.8,'curls':2,'curlW':.24,
      'arrows':[(.9,-.8),(1.5,0),(1.1,.9)],'arrowW':.32,'castFlash':1.2,'chargeFlash':3.2,'popFlash':2.2,'shake':1.5},
 'b':{'desc':'Vortex Bind สตอรี่บอร์ด #17 แบบ B — ลมใส เบา: เส้นลมบาง ทอร์นาโดโปร่ง ไม่มีชั้นเข้ม แสงน้อย (แนว Aegis ลมใส)',
      'S':1.4,'rate':.55,'op':.7,'glow':.45,'coreInt':.8,'dark':False,'leaves':False,'orbits':2,
      'streaks':[(1.0,.45,.8,.12),(1.6,.55,3.3,.11)],'tlife':.32,'trailK':1.2,'curls':1,'curlW':.14,
      'arrows':[(1.2,-.5),(1.2,.5)],'arrowW':.16,'castFlash':.8,'chargeFlash':0,'popFlash':1.2,'shake':1.0},
 'c':{'desc':'Vortex Bind สตอรี่บอร์ด #17 แบบ C — หนัก โชว์: ลมหนาเยอะ ทอร์นาโดใหญ่ขึ้น ดูดกลับแรง จอสั่นมากขึ้น',
      'S':1.8,'rate':1.4,'op':1.0,'glow':.9,'coreInt':1.5,'dark':True,'leaves':True,'orbits':4,
      'streaks':[(0.6,.6,0,.3),(1.1,.8,1.6,.34),(1.6,.7,3.2,.3),(2.2,.55,4.8,.26)],'tlife':.34,'trailK':2.0,'curls':3,'curlW':.3,
      'arrows':[(.7,-1.1),(1.4,-.4),(1.8,.4),(1.0,1.1)],'arrowW':.42,'castFlash':1.6,'chargeFlash':4.0,'popFlash':3.0,'shake':2.4},
}
for n,v in VAR.items():
    fx=build(v);p=ROOT/f'assets/fx/wind/vortex_bind_sb_{n}.fx.json'
    p.write_text(json.dumps(fx,ensure_ascii=False,indent=1),encoding='utf-8')
    print(p.name,len(fx['layers']),'layers')
