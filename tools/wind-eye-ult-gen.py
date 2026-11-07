# Eye of Heaven v2 (อัลติสายลม) — ผู้ใช้ขอ 2026-11-07
# กด → รอยแยกมิติฉีกบนฟ้า → ตาลืมจากรอยแยก (ตาคม ๆ ขาว-เขียว) → Impact frame (โค้ดเกม js/44 impactFrame)
# → ทุกคนในเขตลอยค้าง โดนใบมีดลมฟันรัว ๆ (เบาแต่ถี่) → ลมกระแทกผลักไปชนกำแพงวง (เหมือนเดิม)
# ใช้: python tools/wind-eye-ult-gen.py แล้ว node tools/fx-check.js
# ไฟล์: wind/eye_ult (ตัวหลัก ที่ผู้ร่าย aim:false) • wind/eye_wall (กำแพงวง 1 ชิ้น) • wind/ult_blade_a|b|c (ใบมีดฟัน 1 ครั้ง ที่ตัวเป้า)
#       wind/ult_hold (ลมรัดตัวเป้า ตามตัว 2.1 วิ)
# เวลา = โค้ดเกม js/09-wind.js W_UL: 1.2 ตาลืมเต็ม+ลอย • 1.35 กำแพงวงขึ้น • 1.45–3.1 ใบมีดฟันทุก 0.1 วิ • 3.2 ลมกระแทก • 3.5 จบ (กำแพงอยู่ 6.25 วิ)
# ส่วนเขต/ลมปั่นป่วน/กำแพงวง ยืมโค้ดจาก tools/wind-eye-sb-gen.py (สตอรี่บอร์ด #20 แบบ B ที่ผู้ใช้เลือก) แต่เลื่อนเวลาตามข้างบน
import json,math,random,importlib.util
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def save(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=1),encoding='utf-8')
def r3(v):return [round(c,4) for c in v]

# ---------------------------------------------------------------- ยืม sb-gen (มันเขียนไฟล์ตอน import — เนื้อเดิมเหมือนเดิม ไม่เปลี่ยน)
spec=importlib.util.spec_from_file_location('sbgen',ROOT/'tools/wind-eye-sb-gen.py');SB=importlib.util.module_from_spec(spec);spec.loader.exec_module(SB)
T_SLAM,T_WALL,T_IMP,T_END_G=1.2,1.35,3.2,3.5
WLIFE=6.25
SB.T_SLAM,SB.T_WALL,SB.T_IMP,SB.T_END=T_SLAM,T_WALL,T_IMP,T_WALL+WLIFE
GREEN='#8dff65';WHITE='#ffffff';MINT='#d8ffe0';DEEP='#0a7f43';DK='#063d27'
R=17.5

# ---------------------------------------------------------------- meshes (ระนาบ XY หันหาจอ ใช้กับ bill:true) ----------------
def band(pts,w,closed=False):
    n=len(pts);V=[];F=[]
    for i,(x,y) in enumerate(pts):
        a=pts[(i-1)%n] if (closed or i>0) else pts[i];b=pts[(i+1)%n] if (closed or i<n-1) else pts[i]
        tx,ty=b[0]-a[0],b[1]-a[1];L=math.hypot(tx,ty) or 1;nx,ny=-ty/L,tx/L
        ww=(w[i] if isinstance(w,list) else w)*.5
        V+=[r3([x+nx*ww,y+ny*ww,0]),r3([x-nx*ww,y-ny*ww,0])]
    m=n if closed else n-1
    for i in range(m):j=(i+1)%n;F.append([2*i,2*j,2*j+1,2*i+1])
    return V,F
def pp(pid,VF):return {'id':pid,'k':'poly','v':VF[0],'f':VF[1]}
def circ(r,n=96,a0=0,a1=2*math.pi,closed=True):
    m=n if closed else n+1
    return [(r*math.cos(a0+(a1-a0)*i/(n if not closed else n)),r*math.sin(a0+(a1-a0)*i/(n if not closed else n))) for i in range(m)]
def tri(x0,y0,x1,y1,x2,y2):return [r3([x0,y0,0]),r3([x1,y1,0]),r3([x2,y2,0])]
def tris(list_of_tri):
    V=[];F=[]
    for t in list_of_tri:
        b=len(V);V+=t;F.append([b,b+1,b+2])
    return V,F
def mesh(name,desc,parts,mat='glow'):save(ROOT/f'assets/fx/mesh/{name}.mesh.json',{'v':1,'desc':desc,'mat':mat,'pal':'wind','tags':['wind','ult','eye'],'parts':parts})

# ตาทรงอัลมอนด์ปลายแหลม: เปลือกบน/ล่าง • รอยพับเปลือกตา • หางตาแหลมยื่นออกสองข้าง
def up(x):return .56*max(0,1-abs(x)**1.75)**1.12
def lo(x):return -.40*max(0,1-abs(x)**1.95)**1.2
N=64
XS=[-1+2*i/N for i in range(N+1)]
UP=[(x,up(x)) for x in XS];LO=[(x,lo(x)) for x in XS]
def taper(xs,w0,p=1.1,minw=.006):return [minw+w0*max(0,1-abs(x)**1.0)**p for x in xs]
lids=[pp('up',band(UP,taper(XS,.095))),pp('lo',band(LO,taper(XS,.06)))]
# รอยพับเปลือกตาบน (ขีดบาง ๆ เหนือเปลือกตา) + คิ้วโค้งแหลม
crease=[(x,1.32*up(x)+.05*(1-abs(x))) for x in [-.86+1.72*i/48 for i in range(49)]]
lids.append(pp('crease',band(crease,[.004+.03*max(0,1-abs(c[0])/.86)**.9 for c in crease])))
# หางตา: ขีดแหลมยื่นออกนอกมุมตา
def wing(sg,L=.62,rise=.16):
    pts=[(sg*(1+L*i/16),rise*(i/16)**1.6) for i in range(17)]
    return pp('wing'+('R' if sg>0 else 'L'),band(pts,[.05*(1-i/16)**1.2+.004 for i in range(17)]))
lids+=[wing(1),wing(-1,.5,.1)]
mesh('wind_eye2_lid','Eye of Heaven v2: ขอบตาอัลมอนด์ปลายแหลม (เปลือกบน/ล่างเรียวหายที่มุม) + รอยพับเปลือกตา + หางตาแหลม — ระนาบ XY กว้าง 2 ใช้ bill:true',lids)
# ตาขาว (แผ่นอัลมอนด์) — ใช้เป็นเนื้อตา
def almond_fill():
    ring=[(x,lo(x)) for x in XS]+[(x,up(x)) for x in reversed(XS[1:-1])]
    V=[r3([0,0,0])]+[r3([x,y,0]) for x,y in ring]
    F=[[0,1+i,1+(i+1)%len(ring)] for i in range(len(ring))]
    return V,F
mesh('wind_eye2_fill','Eye of Heaven v2: เนื้อตา (แผ่นอัลมอนด์ เต็มรูปตา) ระนาบ XY กว้าง 2',[pp('f',almond_fill())])
# ม่านตา: วงนอกหนา + วงในบาง + ลายซี่เส้นลม (ซี่แหลมยาวสั้นสลับ) + แขนวังวนลม 6 แขน
iris=[pp('limb',band(circ(.405),.075,True)),pp('mid',band(circ(.33),.014,True)),pp('inn',band(circ(.17),.012,True))]
T=[]
K=72
for k in range(K):
    a=2*math.pi*k/K;ro=.31 if k%2 else .37;ri=.15;wd=.022 if k%3 else .03
    ca,sa=math.cos(a),math.sin(a)
    T.append(tri(ri*ca-sa*wd,ri*sa+ca*wd,ri*ca+sa*wd,ri*sa-ca*wd,ro*ca,ro*sa))
mesh('wind_eye2_iris','Eye of Heaven v2: ม่านตา — วงขอบหนา + วงบางสองวง (รัศมี .405/.33/.17 ของครึ่งความกว้างตา)',iris)
mesh('wind_eye2_fibre','Eye of Heaven v2: ลายซี่ม่านตา 72 ซี่แหลมคม ยาวสั้นสลับ',[pp('fibre',tris(T))])
arms=[]
for j in range(6):
    pts=[];ws=[]
    for i in range(34):
        t=i/33;a=j*2*math.pi/6+t*2.2;r=.1+.27*t
        pts.append((r*math.cos(a),r*math.sin(a)));ws.append(.006+.042*math.sin(math.pi*t)**.8)
    arms.append(pp(f'a{j}',band(pts,ws)))
mesh('wind_eye2_swirl','Eye of Heaven v2: วังวนลมในม่านตา 6 แขนโค้ง ปลายเรียว',arms)
def disc(r,n=64):
    V=[r3([0,0,0])]+[r3([r*math.cos(2*math.pi*i/n),r*math.sin(2*math.pi*i/n),0]) for i in range(n)]
    return V,[[0,1+i,1+(i+1)%n] for i in range(n)]
mesh('wind_eye2_disc','Eye of Heaven v2: แผ่นกลมรัศมี 1 (รูม่านตา/แสง) ระนาบ XY',[pp('d',disc(1))])
mesh('wind_eye2_pring','Eye of Heaven v2: วงรอบรูม่านตา (บาง คม)',[pp('r',band(circ(1.0),.12,True)),pp('r2',band(circ(1.55),.03,True))])
# ประกายดาว 4 แฉก (ใส่ที่ม่านตาตอนจ้อง)
star=[]
for a,L,w in [(0,1,.05),(math.pi/2,.62,.04),(math.pi,1,.05),(3*math.pi/2,.62,.04)]:
    ca,sa=math.cos(a),math.sin(a);star.append(tri(-sa*w,ca*w,sa*w,-ca*w,ca*L,sa*L))
    star.append(tri(-sa*w,ca*w,sa*w,-ca*w,-ca*L*.12,-sa*L*.12))
mesh('wind_eye2_star','Eye of Heaven v2: ประกายดาว 4 แฉกแหลม (แนวนอนยาว แนวตั้งสั้น) ยาว 1',[pp('s',tris(star))])
# รัศมีรอบตา: ซี่แสง 28 ซี่ + วงบาง 2 วง (วงนอกเป็นเส้นประ) หมุนสวนกัน
RAYS=[]
M=28
for k in range(M):
    a=2*math.pi*k/M;L=1.0 if k%4==0 else .62 if k%2==0 else .36;r0=1.28;wd=.045 if k%4==0 else .03
    ca,sa=math.cos(a),math.sin(a)
    RAYS.append(tri(r0*ca-sa*wd,r0*sa+ca*wd,r0*ca+sa*wd,r0*sa-ca*wd,(r0+L)*ca,(r0+L)*sa))
mesh('wind_eye2_rays','Eye of Heaven v2: ซี่แสงรอบตา 28 ซี่ (ยาว 3 ระดับ) เริ่มที่รัศมี 1.28',[pp('rays',tris(RAYS))])
dash=[]
for k in range(48):
    a0=2*math.pi*k/48;a1=a0+2*math.pi/48*.55
    dash.append(pp(f'd{k}',band(circ(1.2,6,a0,a1,False),.035)))
mesh('wind_eye2_halo','Eye of Heaven v2: วงรอบตา — วงบางทึบ + วงเส้นประ 48 ช่วง',[pp('ring',band(circ(1.12),.018,True))]+dash)
# รอยแยกมิติ: ฉีกซิกแซกเป็นเส้นแหลมสองปลาย + รอยแตกกิ่ง
rg=random.Random(7)
def crack(L=1.0,seg=26,jit=.07):
    pts=[(-L+2*L*i/seg,rg.uniform(-jit,jit)*(1-abs(-1+2*i/seg))) for i in range(seg+1)]
    return pts
main=crack()
parts=[pp('main',band(main,[.003+.06*max(0,1-abs(x))**.8 for x,_ in main]))]
for j in range(7):
    i0=rg.randint(3,len(main)-4);x0,y0=main[i0];sg=1 if j%2 else -1
    pts=[(x0+rg.uniform(.02,.06)*k*sg*2,y0+sg*(k*.045)+rg.uniform(-.015,.015)) for k in range(7)]
    parts.append(pp(f'b{j}',band(pts,[.02*(1-k/6)+.002 for k in range(7)])))
mesh('wind_eye2_rift','Eye of Heaven v2: รอยแยกมิติ — รอยฉีกซิกแซกปลายแหลม + กิ่งแตก 7 เส้น กว้าง 2',parts)
# ใบมีดลม (เสี้ยวคม ปลายแหลมสองข้าง) รัศมี 1 ระนาบ XY ครึ่งหนึ่งโค้งไปทาง +x
def blade_part(pid,r=1.0,half=64,wmax=.26,n=40):
    V=[];F=[];a0=math.radians(-half);a1=math.radians(half)
    for i in range(n+1):
        t=i/n;a=a0+(a1-a0)*t;w=wmax*max(0,math.sin(math.pi*t))**1.25
        ca,sa=math.cos(a),math.sin(a)
        V+=[r3([r*ca,r*sa,0]),r3([(r-w)*ca,(r-w)*sa,0])]
        if i<n:F.append([2*i,2*i+2,2*i+3,2*i+1])
    return {'id':pid,'k':'poly','v':V,'f':F}
mesh('wind_ult_blade','Eye of Heaven v2: ใบมีดลมเสี้ยวคมปลายแหลม รัศมี 1 โค้งออกทาง +x ระนาบ XY',[blade_part('b'),blade_part('b2',.78,48,.1)])
mesh('wind_ult_blade_thin','Eye of Heaven v2: ใบมีดลมเสี้ยวบางเฉียบ (เส้นฟัน) รัศมี 1',[blade_part('b',1.0,70,.07)])

# ---------------------------------------------------------------- ตา: ตำแหน่ง/ขนาด/เวลา ----------------
EYE=[0,16.0,30.0]       # เหนือเขต ข้างหน้านิดหน่อย (m)
EW=7.0                 # ครึ่งความกว้างตา (m) → ตากว้าง ~9 ม.
EL=T_IMP+.65           # อายุเลเยอร์ตา
def fr(t):return round(min(1,max(0,t/EL)),4)
def K(pairs,ease=None):
    d={str(fr(t)):v for t,v in pairs}
    if ease:d['ease']=ease
    return d
def lin(pairs,t):
    if t<=pairs[0][0]:return pairs[0][1]
    for (t0,v0),(t1,v1) in zip(pairs,pairs[1:]):
        if t<=t1:return v0+(v1-v0)*((t-t0)/(t1-t0) if t1>t0 else 1)
    return pairs[-1][1]
def eyel(lid,model,col,op,sx,sy,mat='glow',dz=0,spin=0,col2=None,at=0,life=None,extra=None):
    """sx/sy/op = [(เวลาวินาที, ค่า)] — sx,sy เวลาไม่ต้องตรงกัน (รวมแล้วสอดค่าเอง) • สเกล × EW"""
    life=life if life is not None else EL-at
    def kk(pairs):
        d2={}
        for t,v in pairs:d2[str(round(min(1,max(0,(t-at)/life)),4))]=v
        return d2
    ts=sorted(set(t for t,_ in sx)|set(t for t,_ in sy))
    d={'id':lid,'t':'mesh','at':at,'life':round(life,3),'att':'ground','shape':'model','model':model,'mat':mat,'col':col,'col2':col2 or col,'bill':True,
       'pos':[EYE[0],EYE[1],EYE[2]+dz],'scale':kk([(t,[round(lin(sx,t)*EW,3),round(lin(sy,t)*EW,3),1]) for t in ts]),'op':kk(op),'spin':spin,'fade':0}
    if extra:d.update(extra)
    return d
T0,T1,T2=.35,1.05,1.2          # เริ่มลืม / ลืมเต็ม / ตาจ้อง (Impact frame)
TC=T_IMP+.3                    # ตาหลับ
def lidx():return [(0,.05),(.28,1.05),(.5,1.0),(T_IMP,1.0),(T_IMP+.06,1.1),(TC,.9),(EL,.9)]
def lidy():return [(0,.03),(T0,.03),(T1,1.07),(T1+.15,1.0),(T_IMP,1.0),(T_IMP+.06,1.12),(TC,.02),(EL,.02)]
def lidop(o=1):return [(0,0),(.06,o),(TC,o),(EL,0)]
def irx(s=1):return [(0,0),(.45,0),(.7,.3*s),(T1,1.0*s),(T2,.84*s),(T2+.25,1.0*s),(T_IMP,1.0*s),(T_IMP+.06,1.1*s),(TC,.9*s),(EL,.9*s)]
def iry(s=1):return [(0,0),(.45,0),(.7,.22*s),(T1,.97*s),(T2,.84*s),(T2+.25,1.0*s),(T_IMP,1.0*s),(T_IMP+.06,1.1*s),(TC,.02),(EL,.02)]
def irop(o=1):return [(0,0),(.5,0),(.75,o),(TC,o),(TC+.1,0),(EL,0)]

def eye_layers():
    Ls=[]
    # ---- รอยแยกมิติ (0–0.8): ฉีกกว้างขึ้น เปลวขาวเขียวไหลออก แล้วเปลือกตาแยกออก ----
    Ls.append(eyel('rift','wind_eye2_rift',WHITE,[(0,0),(.04,1),(.5,1),(.85,0)],[(0,.1),(.3,1.2),(.85,1.55)],[(0,1),(.85,1)],life=.9))
    Ls.append(eyel('riftg','wind_eye2_rift',GREEN,[(0,0),(.05,.8),(.5,.7),(.9,0)],[(0,.1),(.3,1.3),(.9,1.7)],[(0,1.6),(.9,1.7)],life=.95))
    Ls.append(eyel('slit','wind_eye2_disc',WHITE,[(0,0),(.04,1),(.3,1),(.5,.8),(.7,0)],[(0,.04),(.3,.95),(.7,1.1)],[(0,.007),(.3,.012),(.7,.05)],life=.75))
    # ---- ตา: ตาขาว(ทึบบางๆ) • ขอบตามืดรองหลัง • ขอบตาขาวเรือง ----
    Ls.append(eyel('sclera_dk','wind_eye2_fill','#05281c',lidop(.9),[(t,v*1.02) for t,v in lidx()],[(t,v*1.03) for t,v in lidy()],mat='toon',col2='#021a12',dz=-.01))
    Ls.append(eyel('sclera','wind_eye2_fill','#c8ffd8',lidop(.12),lidx(),lidy(),mat='glow'))
    Ls.append(eyel('lid_dk','wind_eye2_lid',DEEP,lidop(1),[(t,v*1.012) for t,v in lidx()],[(t,v*1.02) for t,v in lidy()],mat='toon',col2=DK,dz=.01))
    Ls.append(eyel('lid','wind_eye2_lid',WHITE,lidop(1),lidx(),lidy(),dz=.03))
    Ls.append(eyel('lid_g','wind_eye2_lid',GREEN,lidop(.65),[(t,v*1.05) for t,v in lidx()],[(t,v*1.08) for t,v in lidy()],dz=.02))
    # ---- ม่านตา ----
    S=.9
    Ls.append(eyel('iris_fill','wind_eye2_disc',GREEN,irop(.5),irx(.405*1.0),iry(.405*1.0),dz=.04))
    Ls.append(eyel('iris_fill2','wind_eye2_disc',MINT,irop(.35),irx(.24),iry(.24),dz=.045))
    Ls.append(eyel('iris_fibre','wind_eye2_fibre',WHITE,irop(.95),irx(),iry(),dz=.05,spin=14))
    Ls.append(eyel('iris_fibre_g','wind_eye2_fibre',GREEN,irop(.8),irx(1.04),iry(1.04),dz=.048,spin=-22))
    Ls.append(eyel('iris_swirl','wind_eye2_swirl',MINT,irop(.9),irx(),iry(),dz=.055,spin=-95))
    Ls.append(eyel('iris_swirl2','wind_eye2_swirl',GREEN,irop(.75),irx(.8),iry(.8),dz=.056,spin=140))
    Ls.append(eyel('iris_ring_dk','wind_eye2_iris',DEEP,irop(1),irx(1.025),iry(1.025),mat='toon',col2=DK,dz=.06))
    Ls.append(eyel('iris_ring','wind_eye2_iris',WHITE,irop(1),irx(),iry(),dz=.065))
    # ---- รูม่านตา: ดำสนิท + วงสว่างรอบ + ประกายตา ----
    PUP=[(0,0),(.6,0),(.95,.13),(T1+.05,.16),(T2,.065),(T2+.3,.09),(T_IMP-.2,.085),(T_IMP,.14),(TC,.1),(EL,.1)]
    Ls.append(eyel('pupil','wind_eye2_disc','#000000',irop(1),[(t,v*1) for t,v in PUP],[(t,v*1) for t,v in PUP],mat='toon',col2='#000000',dz=.07))
    Ls.append(eyel('pupil_ring','wind_eye2_pring',WHITE,irop(1),[(t,v*1.0) for t,v in PUP],[(t,v*1.0) for t,v in PUP],dz=.075))
    Ls.append(eyel('catch','wind_eye2_disc',WHITE,[(0,0),(1.0,0),(1.15,1),(TC,1),(TC+.05,0),(EL,0)],[(t,.03) for t in (0,EL)],[(t,.03) for t in (0,EL)],dz=.08,extra={'pos':[EYE[0]-.13*EW,EYE[1]+.09*EW,EYE[2]+.08]}))
    # ---- ประกายดาว 4 แฉกตอนจ้อง + ตอนลมกระแทก ----
    Ls.append(eyel('star','wind_eye2_star',WHITE,[(0,0),(T2-.05,0),(T2,1),(T2+.55,0),(T_IMP-.1,0),(T_IMP,1),(T_IMP+.35,0),(EL,0)],
                   [(0,0),(T2-.05,.3),(T2,1.7),(T2+.55,.8),(T_IMP-.1,.3),(T_IMP,2.0),(T_IMP+.35,1.0),(EL,0)],[(0,0),(T2-.05,.3),(T2,1.2),(T2+.55,.5),(T_IMP-.1,.2),(T_IMP,1.4),(T_IMP+.35,.7),(EL,0)],dz=.09))
    # ---- รัศมีรอบตา (ซี่แสง + วงเส้นประ + วงบาง) ----
    RS=[(0,0),(.9,0),(T2,1.35),(T2+.4,1.0),(T_IMP,1.0),(T_IMP+.05,1.45),(TC,.5),(EL,.2)]
    RO=[(0,0),(.95,0),(T2,.55),(TC,.45),(TC+.1,0),(EL,0)]
    Ls.append(eyel('rays','wind_eye2_rays',WHITE,RO,RS,RS,spin=10,dz=-.05))
    Ls.append(eyel('rays_g','wind_eye2_rays',GREEN,[(t,o*.7) for t,o in RO],[(t,v*1.07) for t,v in RS],[(t,v*1.07) for t,v in RS],spin=-7,dz=-.06))
    Ls.append(eyel('halo','wind_eye2_halo',WHITE,[(0,0),(.95,0),(T2,.55),(TC,.45),(TC+.1,0),(EL,0)],[(t,v*1.05) for t,v in RS],[(t,v*1.05) for t,v in RS],spin=-26,dz=-.04))
    Ls.append(eyel('halo_g','wind_eye2_halo',GREEN,[(0,0),(.95,0),(T2,.4),(TC,.35),(TC+.1,0),(EL,0)],[(t,v*1.28) for t,v in RS],[(t,v*1.28) for t,v in RS],spin=34,dz=-.045))
    # ---- เรือง/แสง ----
    Ls.append({'id':'eye_halo','t':'halo','at':.3,'life':round(EL-.3,3),'att':'ground','pos':list(EYE),'col':GREEN,'size0':2,'size':8,'k':.16,'x':True})
    Ls.append({'id':'eye_light','t':'light','at':.3,'life':round(TC-.3+.4,3),'att':'ground','pos':[0,9,EYE[2]*.5],'col':'#e9ffd8','int':{'0':0,str(round(.8/(TC-.3+.4),3)):1.6,str(round((T2-.3)/(TC-.3+.4),3)):2.4,str(round((T_IMP-.3)/(TC-.3+.4),3)):1.8,str(round((T_IMP+.08-.3)/(TC-.3+.4),3)):2.4,'1':0},'dist':30})
    # ---- รอยแยก: ประกายฉีก + อากาศถูกดูด + ตาง้างอากาศบิด ----
    Ls.append({'id':'tear','t':'emit','at':.02,'life':.5,'att':'ground','pos':list(EYE),'from':'line','fh':EW*2,'fr':.1,'rate':{'0':80,'1':180},'dir':'random','speed':[2,6],'plife':[.2,.45],
        'look':'streak','size':[1,2.2],'col':WHITE,'c2':GREEN,'gravity':0,'drag':2,'curl':False})
    Ls.append({'id':'suck','t':'emit','at':.2,'life':.9,'att':'ground','pos':list(EYE),'from':'sphere','fr':EW*1.6,'rate':110,'dir':'in','speed':[8,14],'plife':[.3,.55],
        'look':'streak','size':[1.4,2.6],'col':WHITE,'c2':GREEN,'gravity':0,'drag':0,'curl':False})
    Ls.append({'id':'bulge','t':'warp','at':.3,'life':round(TC-.3,3),'att':'ground','pos':list(EYE),'kind':'bulge','size':EW*1.8,'str':{'0':0,'0.2':.3,'1':.15},'op':{'0':0,'0.1':1,'0.9':1,'1':0},'col':WHITE,'glow':0})
    # ---- จ้อง (1.2): คลื่นกระแทกรูปวงออกจากตา + แฟลช ----
    Ls.append({'id':'stare_shock','t':'warp','at':T2,'life':.5,'att':'ground','pos':list(EYE),'kind':'shock','size':{'0':2,'1':EW*3},'str':.9,'op':{'0':1,'1':0},'col':WHITE,'glow':0})
    Ls.append({'id':'stare_flash','t':'flash','at':T2,'life':.22,'att':'ground','pos':list(EYE),'col':'#f4fff0','size':5,'size0':1,'k':.4})
    Ls.append({'id':'stare_beam','t':'emit','at':T2,'life':.08,'att':'ground','pos':list(EYE),'from':'point','burst':64,'rate':0,'dir':'out','spread':3.2,'speed':[24,40],'plife':[.25,.4],
        'look':'streak','size':[5,9],'col':WHITE,'c2':GREEN,'gravity':0,'drag':1.4,'curl':False})
    # ---- ลำแสงตาส่องลงเขต (กรวยโปร่ง ไหลลง) ----
    gh=EYE[1]
    for nm,tex,col,op,tile,scr,sc in [('lance','tex/wind_air_rise',WHITE,.05,[3,2],[.2,-1.4],1.0),('lance2','tex/wind_dust',MINT,.03,[2,2],[-.15,-.8],1.06)]:
        Ls.append({'id':nm,'t':'mesh','at':T2,'life':round(TC-T2,3),'att':'ground','shape':'model','model':'wind_real_cone','mat':'tex','tex':tex,'col':col,'col2':'#000000','rim':0,'uvTile':tile,'uvScroll':scr,
            'pos':[EYE[0],EYE[1],EYE[2]],'rot':[180,0,0],'scale':{'0':[1,EYE[1]*.2,1],'0.12':[9*sc,EYE[1],9*sc],'1':[9.5*sc,EYE[1],9.5*sc],'ease':'out'},'op':{'0':0,'0.1':op,'0.85':op,'1':0},'fade':0,'x':True})
    # ---- ลมกระแทก (3.2): ตาแฟลชสว่างแล้วหลับ ----
    Ls.append({'id':'imp_flash','t':'flash','at':T_IMP,'life':.2,'att':'ground','pos':list(EYE),'col':'#f4fff0','size':5.5,'size0':1.2,'k':.5})
    Ls.append({'id':'imp_shock','t':'warp','at':T_IMP,'life':.55,'att':'ground','pos':list(EYE),'kind':'shock','size':{'0':2,'1':EW*3.4},'str':1.0,'op':{'0':1,'1':0},'col':WHITE,'glow':0})
    Ls.append({'id':'close_rift','t':'mesh','at':TC-.05,'life':.4,'att':'ground','shape':'model','model':'wind_eye2_rift','mat':'glow','col':WHITE,'col2':GREEN,'bill':True,'pos':list(EYE),
        'scale':{'0':[EW*1.6,EW,1],'1':[EW*.2,EW,1]},'op':{'0':0,'0.15':1,'0.6':.7,'1':0},'fade':0})
    return Ls

def zone_layers():
    Fz=SB.build('b',game=True)
    keep=[l for l in Fz['layers'] if not l['id'].startswith(('s1_','s4_','s5_','s6_','s3_hit','s3_shake'))]
    out=[]
    for l in keep:
        i=l['id']
        if i in('s2_curl','s2_lift'):l['size']=[2,3.5];l['pos']=[0,.6,0]
        if i=='s2_curl':l['rate']={'0':80,'0.3':120,'1':130}
        if i=='s2_haze':l['size']=9;l['pos']=[0,1.5,9];l['str']=.22
        if i=='s2_dust':l['rate']=8
        if i=='s3_dust':l['burst']=28
        if i=='s2_kick':l['burst']=12
        if i.startswith('s2_sw') and not i.startswith('s2_swg'):l['op']={'0':0,'0.15':.4,'0.85':.32,'1':0}
        if i.startswith('s2_swg'):l['op']={'0':0,'0.15':.14,'0.85':.1,'1':0}
        if i in('s3_roll','s3_roll2'):
            sc=l['scale'];l['scale']={'0':[3.5,sc['0'][1],3.5],'0.5':sc['0.5'],'1':sc['1'],'ease':'out'}
            l['op']={k:round(v*(.6 if i=='s3_roll' else .7),3) for k,v in l['op'].items()}
        if i in('s3_flash','s2_flash'):l['k']=.7;l['size']=1.6
        if i=='s3_rays':l['size']=[3,5];l['pos']=[0,.6,0]
        out.append(l)
    return out

def blade_zone():
    """ใบมีดลมบินวนทั่วเขตตอนฟันรัว (1.35–3.2)"""
    a=T_WALL+.1;b=T_IMP-.05;life=round(b-a,3)
    Ls=[]
    Ls.append({'id':'bz_blades','t':'emit','at':a,'life':life,'att':'ground','pos':[0,1.6,0],'from':'disc','fr':R-2,'rate':{'0':14,'0.4':26,'1':30},'dir':'tangent','speed':[10,18],'up':[-.5,2.5],'plife':[.5,.9],
        'look':'model','model':'wind_ult_blade','mmat':'glow','msize':[.5,1.15],'mspin':520,'bounce':0,'col':WHITE,'c2':GREEN,'gravity':0,'drag':.2,'curl':True,'x':True})
    Ls.append({'id':'bz_thin','t':'emit','at':a,'life':life,'att':'ground','pos':[0,1.2,0],'from':'disc','fr':R-2,'rate':{'0':20,'0.4':36,'1':40},'dir':'tangent','speed':[12,22],'up':[-.5,3],'plife':[.3,.55],
        'look':'model','model':'wind_ult_blade_thin','mmat':'glow','msize':[.8,1.8],'mspin':420,'bounce':0,'col':MINT,'c2':GREEN,'gravity':0,'drag':.1,'curl':True,'x':True})
    Ls.append({'id':'bz_lines','t':'emit','at':a,'life':life,'att':'ground','pos':[0,1.0,0],'from':'disc','fr':R-2,'rate':120,'dir':'tangent','speed':[12,20],'up':[0,3],'plife':[.25,.5],
        'look':'streak','size':[3,6],'col':WHITE,'c2':GREEN,'gravity':0,'drag':.2,'curl':True})
    return Ls

def eye_ult():
    L=eye_layers()+zone_layers()+blade_zone()
    return {'v':1,'desc':'Eye of Heaven v2 (อัลติสายลม): รอยแยกมิติฉีกบนฟ้า → ตาคมลืมจากรอยแยก (ตาอัลมอนด์ปลายแหลม ม่านตาซี่คม วังวนลม รัศมีแสง) → จ้อง 1.2 วิ (ประกายดาว + คลื่นกระแทก = Impact frame ในโค้ด) → ลมปั่นป่วน ใบมีดลมบินวนทั่วเขต → ลมกระแทก 3.2 วิ ตาหลับ • ตามผู้ร่าย aim:false (ตา +z = ทิศร่าย) • กำแพงวงแยกเป็น wind/eye_wall',
        'tags':['wind','ult','eye'],'pal':'wind','dur':EL+.2,'seed':20,'layers':L}

def blade_hit(var):
    """ใบมีดฟัน 1 ครั้ง ที่ตัวเป้า (เล่นทุก 0.1 วิ) — เสี้ยวบางคมกวาดข้ามตัว + ประกาย 3 variant ต่างมุมเอียง"""
    tilt=[-38,34,4][var];sw=[(-34,40),(40,-36),(-18,22)][var]
    Ls=[]
    def bl(lid,model,col,op,sc,rot0,rot1,life=.16):
        return {'id':lid,'t':'mesh','at':0,'life':life,'att':'point','shape':'model','model':model,'mat':'glow','col':col,'col2':col,'bill':True,'pos':[0,0,0],
            'rot':{'0':[0,0,rot0],'1':[0,0,rot1]},'scale':{'0':[sc*.35,sc*.35,1],'0.3':[sc*1.1,sc*1.1,1],'1':[sc*1.25,sc*1.25,1],'ease':'out'},'op':{'0':0,'0.1':op,'0.55':op,'1':0},'fade':0}
    Ls.append(bl('b_core','wind_ult_blade_thin',WHITE,1,1.9,tilt+sw[0],tilt+sw[1]))
    Ls.append(bl('b_g','wind_ult_blade',GREEN,.8,1.65,tilt+sw[0]*.8,tilt+sw[1]*.8,life=.2))
    Ls.append(bl('b_w','wind_ult_blade',WHITE,.9,1.35,tilt+sw[0]*.6,tilt+sw[1]*.6,life=.15))
    Ls.append({'id':'spray','t':'emit','at':0,'life':.04,'att':'point','pos':[0,0,0],'from':'sphere','fr':.2,'burst':9,'rate':0,'dir':'random','speed':[5,11],'plife':[.1,.24],
        'look':'streak','size':[1.2,2.6],'col':WHITE,'c2':GREEN,'gravity':0,'drag':2.2,'curl':False})
    Ls.append({'id':'flash','t':'flash','at':0,'life':.07,'att':'point','pos':[0,0,0],'col':MINT,'size0':.2,'size':.9,'k':.55})
    return {'v':1,'desc':'Eye of Heaven ใบมีดลมฟัน 1 ครั้ง (ตัวเป้าที่ลอยอยู่) แบบ '+'abc'[var]+': เสี้ยวคมบางกวาดข้ามตัว + ประกาย — เล่นถี่ทุก 0.1 วิ','tags':['wind','ult','hit'],'pal':'wind','dur':.3,'seed':60+var,'layers':Ls}

def hold():
    """ลมรัดตัวเป้า 2.1 วิ (ตามตัว): เกลียวลมรอบตัว + ลมยกขึ้น"""
    Ls=[]
    Ls.append({'id':'grip','t':'warp','at':0,'life':.4,'att':'feet','pos':[0,.1,0],'kind':'shock','flat':True,'size':{'0':.6,'1':4.2},'str':.9,'op':{'0':1,'1':0},'col':MINT,'glow':.02})
    Ls.append({'id':'spiral','t':'emit','at':.05,'life':2.0,'att':'feet','pos':[0,.2,0],'from':'ring','fr':.9,'rate':70,'dir':'tangent','speed':[5,9],'up':[1.5,4],'plife':[.3,.5],'look':'streak','size':[1.4,2.8],'col':WHITE,'c2':GREEN,'gravity':0,'drag':.5,'curl':False})
    Ls.append({'id':'lift','t':'emit','at':.05,'life':2.0,'att':'feet','pos':[0,0,0],'from':'ring','fr':.6,'rate':36,'dir':'up','spread':.15,'speed':[2,5],'plife':[.3,.6],'look':'streak','size':[1,2],'col':MINT,'c2':GREEN,'gravity':0,'drag':.4,'curl':False})
    Ls.append({'id':'leaf','t':'emit','at':.05,'life':2.0,'att':'feet','pos':[0,.2,0],'from':'ring','fr':.8,'rate':8,'dir':'tangent','speed':[2,4],'up':[1,3],'plife':[.5,.9],'look':'model','model':'wind_leaf','mmat':'glow','msize':[.07,.14],
        'col':GREEN,'c2':'#2ec772','mspin':480,'gravity':-.1,'drag':.6,'bounce':0,'x':True})
    return {'v':1,'desc':'Eye of Heaven ลมรัดตัวเป้า (ตามตัว 2 วิ): เกลียวลมพุ่งรอบตัว + ลมยกขึ้น + ใบไม้','tags':['wind','ult','hold'],'pal':'wind','dur':2.1,'seed':65,'layers':Ls}

# ---------------------------------------------------------------- กำแพงวง (เหมือนเดิม แต่เวลาตามเกมใหม่) ----------------
save(ROOT/'assets/fx/wind/eye_ult.fx.json',eye_ult())
save(ROOT/'assets/fx/wind/eye_wall.fx.json',SB.g_seg())
for v in range(3):save(ROOT/f'assets/fx/wind/ult_blade_{"abc"[v]}.fx.json',blade_hit(v))
save(ROOT/'assets/fx/wind/ult_hold.fx.json',hold())
print('wind/eye_ult eye_wall ult_blade_a|b|c ult_hold + meshes wind_eye2_* wind_ult_blade*')
