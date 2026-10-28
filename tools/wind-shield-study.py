"""Wing shield choreography, Studio-only. Uses the selected wing's three-section rig."""
import copy
import json
import math
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DUR=5.6
CUTS=[0,.88,1.74,2.6025]
REST_AXIS=[1,.454,-.124]
# ผู้ใช้ 2026-10-28 'wrap shape weird' → ตามสเก็ตช์ wind_shield_fold_ref: ข้อปีกยกเหนือหัว แล้วโค้งลงมาด้านหน้า
GUARD=[[0,0,0],[.48,.58,.28],[.75,0,.58],[-.25,-.40,.75]]
HITS=[1.25,1.82,2.38]
TIMES=sorted(set([0,.20,.24,.28,.32,.36,.40,.44,.48,.52,.56,.60,.64,.75,.85,.95,1.1,1.25,1.30,1.37,1.5,1.82,1.87,1.94,2.07,2.38,2.43,2.50,2.65,2.75,3.0,3.25,3.38,3.50,3.56,3.62,3.70,3.78,3.9,4.1,4.4,4.8,5.2,5.6]))

def save(path,data):
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def smooth(t,a,b):
    v=max(0,min(1,(t-a)/(b-a)))
    return v*v*(3-2*v)

def length(v):return math.sqrt(sum(x*x for x in v))
def unit(v):return [x/max(1e-8,length(v)) for x in v]
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]

def quat_between(a,b):
    a=unit(a);b=unit(b);q=cross(a,b)+[1+sum(x*y for x,y in zip(a,b))]
    n=length(q)
    if n>1e-7:return [x/n for x in q]
    helper=[1,0,0] if abs(a[0])<.9 else [0,1,0]
    return unit(cross(a,helper))+[0]

def quat_blend(q,t):
    if q[3]<0:q=[-x for x in q]
    a=math.acos(max(-1,min(1,q[3])))
    if a<1e-6:return q
    s=math.sin(a)
    return [q[i]*math.sin(a*t)/s for i in range(3)]+[(math.sin((1-t)*a)+q[3]*math.sin(a*t))/s]

def quat_mul(a,b):
    ax,ay,az,aw=a;bx,by,bz,bw=b
    return [aw*bx+ax*bw+ay*bz-az*by,aw*by-ax*bz+ay*bw+az*bx,aw*bz+ax*by-ay*bx+az*bw,aw*bw-ax*bx-ay*by-az*bz]

def quat_rotate(q,v):
    p=quat_mul(quat_mul(q,v+[0]),[-q[0],-q[1],-q[2],q[3]])
    return p[:3]

def fx_euler(q):
    x,y,z,w=q
    m11=1-2*(y*y+z*z);m13=2*(x*z+y*w)
    m21=2*(x*y+z*w);m22=1-2*(x*x+z*z);m23=2*(y*z-x*w)
    m31=2*(x*z-y*w);m33=1-2*(x*x+y*y)
    ex=math.asin(max(-1,min(1,-m23)))
    if abs(m23)<.9999999:ey=math.atan2(m13,m33);ez=math.atan2(m21,m22)
    else:ey=math.atan2(-m31,m11);ez=0
    return [round(-math.degrees(ex),4),round(-math.degrees(ey),4),round(math.degrees(ez),4)]

LIFT=lambda t:.32*smooth(t,3.30,3.56)*(1-smooth(t,4.0,4.7))   # ลอยขึ้นนิดเดียวตอนปล่อยพลัง (ในเกม = ยกตัวผู้เล่น)
def wing_pose(side,t):
    # Root closes first, tips follow. One controlled opening, then almost fixed idle.
    amounts=[smooth(t,.24+i*.025,.52+i*.035)*(1-smooth(t,3.50,3.78)) for i in range(3)]
    compress=1-.10*smooth(t,3.25,3.50)*(1-smooth(t,3.50,3.78))
    up=34*(smooth(t,3.46,3.62)-smooth(t,3.75,4.5))
    up+=.6*math.sin(t*2.3)*(1-max(amounts))
    for hit in HITS:
        if hit<t<hit+.18:up-=2.8*math.sin((t-hit)/.18*math.pi)
    roll=math.radians(-side*up)
    rootq=[0,0,math.sin(roll/2),math.cos(roll/2)]
    srcaxis=[-side,.454,-.124]
    pivot=[0,0,0];bones=[]
    for i,amount in enumerate(amounts):
        delta=[GUARD[i+1][j]-GUARD[i][j] for j in range(3)]
        target=[-side*delta[0],delta[1],delta[2]]
        q=quat_blend(quat_between(srcaxis,target),amount)
        # Rotate the main wing without increasing any section's dimensions.
        scale=compress
        qtotal=quat_mul(rootq,q)
        posedpivot=quat_rotate(rootq,pivot)
        pos=[side*.135-posedpivot[0],1.602+LIFT(t)+posedpivot[1],-.23779+posedpivot[2]]
        bones.append((pos,fx_euler(qtotal),scale))
        direction=quat_rotate(q,[a*(CUTS[i+1]-CUTS[i])*scale for a in srcaxis])
        pivot=[pivot[j]+direction[j] for j in range(3)]
    return bones

def curve_for(side,bone,component):
    return {str(round(t/DUR,5)):wing_pose(side,t)[bone][component] for t in TIMES}

def quat_from_fx(rot):
    x,y,z=[math.radians(v) for v in [-rot[0],-rot[1],rot[2]]]
    qx=[math.sin(x/2),0,0,math.cos(x/2)]
    qy=[0,math.sin(y/2),0,math.cos(y/2)]
    qz=[0,0,math.sin(z/2),math.cos(z/2)]
    return quat_mul(quat_mul(qy,qx),qz)

def extension(t,i=0):
    return smooth(t,.25+i*.010,.46+i*.010)*(1-smooth(t,3.50,3.78))

# Extra feather length grows only during guard. The approved main vane never gets enlarged.
# Canonical quill: origin at its root, pointed end along -Y, broad face toward +Z.
def poly(name,points,z=0):
    vertices=[[x,y,z] for x,y in points]
    vertices.append([sum(x for x,y in points)/len(points),sum(y for x,y in points)/len(points),z+.015])
    return {'id':name,'k':'poly','v':vertices,'f':[[len(points),i,(i+1)%len(points)] for i in range(len(points))],'flat':True}

def line(name,points,width,z=.025):
    vertices=[]
    for i,(x,y) in enumerate(points):
        a=points[max(0,i-1)];b=points[min(len(points)-1,i+1)]
        dx=b[0]-a[0];dy=b[1]-a[1];n=max(.0001,math.hypot(dx,dy))
        w=width*(1-.7*i/max(1,len(points)-1))
        vertices += [[x-dy/n*w,y+dx/n*w,z],[x+dy/n*w,y-dx/n*w,z]]
    return {'id':name,'k':'poly','v':vertices,'f':[[2*i,2*i+1,2*i+3,2*i+2] for i in range(len(points)-1)],'flat':True}

OUTLINE=[[-.16,0],[.29,-.035],[.51,-.23],[.37,-.58],[.28,-.78],[.10,-1],[-.13,-.87],[-.38,-.52],[-.45,-.21]]
QUILL_MODELS={
 'shadow':('toon',[poly('dense_air',OUTLINE)]),
 'flow':('energy',[poly('front_flow',[[x*.82,y*.97] for x,y in OUTLINE],.023),poly('back_flow',[[x*.82,y*.97] for x,y in OUTLINE],-.023)]),
 'edge':('glow',[line('outer_edge',[[-.16,0],[-.45,-.21],[-.38,-.52],[-.13,-.87],[.1,-1]],.017),line('inner_edge',[[.29,-.035],[.51,-.23],[.37,-.58],[.28,-.78]],.010),line('spine',[[0,-.06],[.04,-.4],[.10,-.94]],.012)]),
 'cut':('toon',[line('dark_split_1',[[-.29,-.21],[.025,-.40],[.20,-.44]],.025,.036),line('dark_split_2',[[-.19,-.53],[.07,-.67],[.25,-.7]],.018,.037)]),
 'glint':('glow',[line('tip_glint',[[.03,-.86],[.10,-1]],.014,.04),line('shoulder_glint',[[-.38,-.20],[-.28,-.36]],.010,.04)])}
for name,(material,parts) in QUILL_MODELS.items():
    save(ROOT/f'assets/fx/mesh/wind_shield_longfeather_{name}.mesh.json',{'v':1,'desc':'Angular wind feather expands below the existing wing during guard','pal':'wind','mat':'solid' if material=='toon' else material,'parts':parts})

FEATHER_ROOTS=[.32,.70,1.08,1.46,1.84,2.20]
# ทุกขนไขว้ข้ามกลางตัว (X ชัด) ปลายลงถึงเท้า เรียงเป็นชั้นจากบนลงล่าง
# z ลบ = ด้านหน้าตัวละคร (โคนปีกอยู่ z บวก = หลังไหล่) → ขนอ้อมมาห่อไขว้ด้านหน้า
FEATHER_TIPS=[[.30,1.45,-.70],[.18,1.20,-.78],[-.38,.40,-.92],[-.30,.10,-.88],[-.18,-.02,-.80],[.42,1.70,-.62]]
FEATHER_WIDTHS=[.36,.44,.48,.46,.40,.34]
# สีต่อชั้น [ตัวขน, เงา, ลมไหล, ลมไหล2, ขอบ, ขอบ2] — 0 = บนสุด/ในสุด (สว่าง) … 4 = ล่างสุด/นอกสุด (เข้ม), 5 = ขนบนสุดคลุมไหล่
FEATHER_COL=[['#c9fff0','#3aa58a','#f0fffa','#9cf5d8','#ffffff','#c8fff0'],['#c9fff0','#3aa58a','#f0fffa','#9cf5d8','#ffffff','#c8fff0'],['#4fd07a','#14663c','#8cff9a','#2fae5e','#b8ffb0','#4fd07a'],['#4fd07a','#14663c','#8cff9a','#2fae5e','#b8ffb0','#4fd07a'],['#4fd07a','#14663c','#8cff9a','#2fae5e','#b8ffb0','#4fd07a'],['#c9fff0','#3aa58a','#f0fffa','#9cf5d8','#ffffff','#c8fff0']]

def feather_pose(side,i,t):
    s=FEATHER_ROOTS[i];bone=0 if s<CUTS[1] else 1 if s<CUTS[2] else 2
    p,rot,scale=wing_pose(side,t)[bone];q=quat_from_fx(rot)
    u=s-CUTS[bone]
    root=quat_rotate(q,[-side*u*scale,(.454*u-.07)*scale,(-.124*u+.06)*scale])
    root=[p[0]-root[0],p[1]+root[1],p[2]+root[2]]
    e0=extension(t,i);root=[root[0]+side*.22*e0,root[1],root[2]-.62*e0]
    target=FEATHER_TIPS[i];target=[side*target[0],target[1],target[2]+(.035 if side<0 else 0)]
    e=extension(t,i)
    restdir=quat_rotate(q,[-side*.8,-.45,.02])
    guarddir=unit([-(target[0]-root[0]),target[1]-root[1],target[2]-root[2]])
    direction=unit([(1-e)*restdir[j]+e*guarddir[j] for j in range(3)])
    quillq=quat_between([0,-1,0],direction)
    reach=length([target[j]-root[j] for j in range(3)])
    return root,fx_euler(quillq),[.18+(FEATHER_WIDTHS[i]-.18)*e,.24+(reach-.24)*e,1]

def feather_curve(side,i,component):
    return {str(round(t/DUR,5)):feather_pose(side,i,t)[component] for t in TIMES}

fx=json.loads((ROOT/'assets/fx/start/shield.fx.json').read_text(encoding='utf-8'))
fx.update(desc='โล่ปีกลม — ขนปีกล่างขยายทันทีเป็นแผงยาวห่อไขว้ถึงขา ตามภาพอ้างอิง; แกนปีกขนาดเดิม (Studio review)',tags=['wind','shield','self','review'],pal='wind',dur=DUR,seed=73)
fx['layers']=[]
MATERIALS=[('body','toon','#c9fff0','#3aa58a',1.0,.15),('flow','energy','#e8fff6','#7fe8c4',.0,.65),('feathers','energy','#4fd07a','#14663c',1.0,.45),('spines','glow','#f0fffa','#9cf5d8',.9,0),('accents','glow','#ffffff','#c8fff0',.9,0),('cuts','toon','#3aa58a','#1d6f5a',.0,0)]
for side,sid in [(-1,'L'),(1,'R')]:
    for bone in range(3):
        pos=curve_for(side,bone,0);rot=curve_for(side,bone,1);scale=curve_for(side,bone,2)
        for name,mat,col,c2,opacity,rim in MATERIALS:
            op={'0':opacity,'0.48':opacity,'0.58':min(.85,opacity*1.32),'0.625':min(.9,opacity*1.5),'0.70':opacity,'1':opacity}
            if name=='feathers':
                op={'0':1.0,'1':1.0}   # ผู้ใช้: ปีก 100% ไม่จาง
            fx['layers'].append({'id':f'{sid}_{bone}_{name}','t':'mesh','at':0,'life':DUR,'att':'feet','shape':'model','model':f'wind_shield_{sid}_{name}_{bone}','mat':mat,'col':col,'col2':c2,'op':op,'rim':rim,'scroll':2.8,'fade':0,'pos':pos,'rot':rot,'scale':scale})
        fx['layers'].append({'id':f'{sid}_{bone}_air','t':'emit','at':0,'life':DUR,'att':'feet','from':'mesh','of':f'{sid}_{bone}_feathers','rate':0,'burst':0,'dir':'random','speed':[.3,.8],'plife':[.22,.45],'look':'model','model':'wind_wing_airchip','mmat':'glow','msize':[.09,.18],'mspin':80,'col':'#b7ff87','c2':'#329b50','gravity':-.05,'drag':1.6,'curl':False,'bounce':0})

    for i in range(6):
        # ผู้ใช้ 2026-10-27 "make layer for feather and diff color too": แต่ละชั้นขนคนละสี ไล่จากชั้นใน (มิ้นต์/ขาว) ไปชั้นนอก (เขียวเข้ม)
        FC=FEATHER_COL[i]
        for name,mat,col,c2,opacity,rim in [
            ('shadow','toon',FC[0],FC[1],1.0,.14),
            ('flow','energy',FC[2],FC[3],1.0,.45),
            ('edge','glow',FC[4],FC[5],1.0,0),
            ('glint','glow','#eeffcf','#a0ff7f',.0,0)]:
            op={str(round(t/DUR,5)):round(min(1,opacity*min(1,extension(t,i)*3)),4) for t in TIMES}   # ขนยาวทึบเต็มเร็ว ไม่โปร่ง
            fx['layers'].append({'id':f'{sid}_long_{i}_{name}','t':'mesh','at':0,'life':DUR,'att':'feet','shape':'model','model':f'wind_shield_longfeather_{name}','mat':mat,'col':col,'col2':c2,'op':op,'rim':rim,'scroll':3,'fade':0,'pos':feather_curve(side,i,0),'rot':feather_curve(side,i,1),'scale':feather_curve(side,i,2)})
        fx['layers'].append({'id':f'{sid}_long_{i}_motes','t':'emit','at':.35,'life':3.38,'att':'feet','from':'mesh','of':f'{sid}_long_{i}_flow','rate':0,'dir':'up','speed':[.4,1],'plife':[.18,.35],'look':'streak','size':[.4,.85],'col':'#c8ff9d','c2':'#45b96a','gravity':0,'drag':1.5,'curl':False})

# เปลือกโล่บาง ๆ แบบโล่ไฟ: ริบบิ้นลมสโตรกหมุนรอบตัว 3 ชั้น + กรอบหกเหลี่ยมเส้นบาง (โผล่ตอนยกโล่ หายตอนปล่อย)
SHELL=lambda pk,a,b:{str(round(t/DUR,5)):round(pk*smooth(t,.18,.42)*(1-smooth(t,3.45,3.7)),4) for t in TIMES}
for j,(tilt,yaw,sc,tex,col,spin,pk) in enumerate([(18,0,1.25,'tex/wind_swoosh_b','#5fb5a6',240,.42),(-28,70,1.18,'tex/wind_swoosh_a_hi','#eaffff',-300,.30),(52,140,1.10,'tex/wind_swoosh_b','#7fcfbf',280,.36),(-60,210,1.15,'tex/wind_swoosh_a_hi','#ffffff',-260,.24),(4,300,1.32,'tex/wind_swoosh_b','#4c9d8f',200,.32)]):
    fx['layers'].append({'id':f'shell_{j}','t':'mesh','at':0,'life':DUR,'att':'feet','shape':'model','model':f'wind_pieces{j%3}','mat':'tex','tex':tex,'col':col,'col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],
        'pos':[0,.75,0],'rot':[tilt,yaw,0],'scale':[sc,.62*sc,sc],'spin':spin,'op':SHELL(pk,0,0),'fade':0})
fx['layers'].append({'id':'shell_hex','t':'mesh','at':0,'life':DUR,'att':'chest','pos':[0,-.35,0],'shape':'model','model':'fire_hex_frames','mat':'glow','col':'#9dff7a','col2':'#efffe8','rim':1.2,'int':.9,
    'scale':{'0':[.95,.6,.95],'0.07':[.72,.46,.72],'0.6':[.74,.47,.74],'1':[.72,.46,.72]},'spin':30,'op':SHELL(.14,0,0),'fade':0})

# Demonstration hits: small white contact, wind splinters, light travelling back to the hinge.
for i,t in enumerate(HITS):
    side=-1 if i%2 else 1;p=[side*.26,1.12+(i%2)*.12,-.62]
    fx['layers'].append({'id':f'hit_{i}_pin','t':'flash','at':t,'life':.07,'att':'feet','pos':p,'col':'#f3ffe8','size0':.06,'size':.65,'k':.8})
    fx['layers'].append({'id':f'hit_{i}_chips','t':'emit','at':t,'life':.03,'att':'feet','pos':p,'burst':12,'rate':0,'from':'sphere','fr':.10,'dir':'aim','yaw':0,'spread':1.1,'speed':[1.6,3.2],'plife':[.15,.28],'look':'streak','size':[.8,1.5],'col':'#dcffb1','c2':'#49ba60','gravity':0,'drag':2.5,'curl':False})
    fx['layers'].append({'id':f'hit_{i}_return','t':'mesh','at':t+.03,'life':.24,'att':'feet','shape':'model','model':'wind_wing_airchip','mat':'glow','col':'#b8ff85','col2':'#4fce6f','pos':{'0':p,'0.28':[side*.80,1.55,.68],'0.65':[side*.70,2.15,.26],'1':[side*.135,1.602,-.23779]},'scale':[.20,.32,.20],'rot':[75,0,side*45],'op':{'0':0,'0.15':.8,'0.8':.7,'1':0},'fade':0})

# Broken fork-shaped wind pieces travel outward, with visible empty space between them.
piece={'v':1,'desc':'แฉกลมกวาดออกจากการสะบัดปีก','pal':'wind','mat':'energy','parts':[
 {'id':'fork','k':'poly','v':[[-.38,0,-.60],[-.16,.04,.20],[0,.02,.85],[.09,0,.24],[.43,.03,.50],[.19,0,-.26],[.03,-.03,-.70]],'f':[[0,1,6],[1,2,3,6],[3,4,5,6]],'flat':True},
 {'id':'slice','k':'poly','v':[[-.43,.07,-.33],[-.24,.08,.20],[-.13,.08,.57],[-.18,.07,-.21]],'f':[[0,1,2,3]],'flat':True}]}
save(ROOT/'assets/fx/mesh/wind_shield_burst.mesh.json',piece)
fx['params']={'r':{'def':10,'desc':'Shield release radius in metres (existing gameplay 200 sim units)'}}
# ระเบิดโล่ (ผู้ใช้ 2026-10-28 ส่งรูป Spellcasters "Wind Shield"): ทรงกลมลมขยายออกจากตัว — แถบสโตรกพู่กันพันรอบทรงกลมหลายแนวเอียง
# + ไส้ทรงกลมใสสีมิ้นต์ + สโตรกดินน้ำตาลกวาดพื้น + เศษดิน/ใบไม้ปลิว
RB=3.0;T0=3.56;BC=[0,1.0,0]
SPH=lambda k:{'0':[.35*k,.35*k,.35*k],'0.22':[RB*k,RB*k,RB*k],'1':[RB*1.18*k,RB*1.18*k,RB*1.18*k],'ease':'out'}
fx['layers'].append({'id':'burst_fill','t':'mesh','at':T0,'life':.7,'att':'feet','shape':'sphere','mat':'energy','col':'#e0ffd2','col2':'#2ec772','pos':BC,'scale':SPH(.97),'rim':1.1,'scroll':1.5,'op':{'0':0,'0.08':.42,'0.55':.3,'1':0},'fade':0})
BANDS=[(0,0,'tex/wind_swoosh_a_hi','#ffffff',520,1.0),(28,40,'tex/wind_swoosh_b','#8dff65',-460,.95),(-24,95,'tex/wind_swoosh_a_hi','#efffe8',480,.95),(48,150,'tex/wind_swoosh_b','#2ec772',-420,.9),
       (-46,200,'tex/wind_swoosh_b_hi','#ffffff',440,.9),(14,255,'tex/wind_swoosh_b','#8dff65',-500,.9),(-12,310,'tex/wind_swoosh_a','#1f9a55',400,.8),(62,20,'tex/wind_swoosh_a_hi','#efffe8',-380,.85),(-64,120,'tex/wind_swoosh_b','#2ec772',360,.85)]
for j,(tilt,yaw,tex,col,sp,o) in enumerate(BANDS):
    fx['layers'].append({'id':f'burst_band_{j}','t':'mesh','at':T0+j*.012,'life':.68,'att':'feet','shape':'model','model':f'wind_pieces{j%3}','mat':'tex','tex':tex,'col':col,'col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],
        'pos':BC,'rot':[tilt,yaw,0],'scale':{k:[v[0],round(v[1]*.32,2),v[2]] for k,v in SPH(1).items() if k!='ease'},'spin':sp,'op':{'0':0,'0.07':o,'0.6':round(o*.85,2),'1':0},'fade':0,**({'int':1.4} if col in('#ffffff','#efffe8','#efffe8') else {})})
    if j%3==0:fx['layers'].append({'id':f'burst_line_{j}','t':'mesh','at':T0+j*.012,'life':.68,'att':'feet','shape':'model','model':f'wind_pieces{j%3}','mat':'tex','tex':'tex/wind_swoosh_a_ln','col':'#1a7a45','col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],
        'pos':BC,'rot':[tilt,yaw+25,0],'scale':{k:[round(v[0]*1.05,2),round(v[1]*.3,2),round(v[2]*1.05,2)] for k,v in SPH(1).items() if k!='ease'},'spin':sp,'op':{'0':0,'0.07':.7,'0.6':.55,'1':0},'fade':0})
# สโตรกดินกวาดพื้นรอบฐาน (น้ำตาล แบบในรูป) + เศษดิน + ใบไม้
for j,(tex,col,sp,sc) in enumerate([('tex/wind_swoosh_b','#8a7560',300,1.0),('tex/wind_swoosh_a','#6e5a48',-260,1.2)]):
    fx['layers'].append({'id':f'burst_dirt_{j}','t':'mesh','at':T0+.02,'life':.7,'att':'feet','shape':'model','model':'wind_groundswirl','mat':'tex','tex':tex,'col':col,'col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],
        'pos':[0,.05+j*.03,0],'rot':[0,j*70,0],'scale':{'0':.5,'0.25':RB*sc,'1':RB*sc*1.3,'ease':'out'},'spin':sp,'op':{'0':0,'0.08':.95,'0.6':.7,'1':0},'fade':0})
fx['layers'].append({'id':'burst_soil','t':'emit','at':T0+.02,'life':.08,'att':'feet','pos':[0,.2,0],'burst':60,'rate':0,'from':'ring','fr':1.2,'dir':'out','speed':[5,10],'up':[1,4],'plife':[.4,.8],'look':'model','model':'wind_slash','mmat':'solid','msize':[.06,.16],'col':'#5b4a3a','c2':'#8a7560','gravity':6,'mspin':600,'bounce':0})
fx['layers'].append({'id':'burst_leaves','t':'emit','at':T0+.03,'life':.1,'att':'feet','pos':BC,'burst':26,'rate':0,'from':'sphere','fr':1.5,'dir':'out','speed':[4,8],'plife':[.6,1.1],'look':'model','model':'wind_leaf','mmat':'solid','msize':[.12,.22],'col':'#6fae5a','c2':'#3f7a3a','gravity':.6,'drag':1.2,'mspin':500,'bounce':0})
fx['layers'].append({'id':'release_contact','t':'flash','at':3.56,'life':.12,'att':'feet','pos':[0,1.1,0],'col':'#efffe8','size0':.4,'size':3.2,'k':1})
fx['layers'].append({'id':'release_splinters','t':'emit','at':3.56,'life':.05,'att':'feet','pos':[0,1.1,0],'burst':48,'rate':0,'from':'ring','fr':.7,'dir':'out','speed':[7,12],'up':[.2,1.2],'plife':[.22,.5],'look':'streak','size':[1.1,2.2],'col':'#ffffff','c2':'#8dff65','gravity':0,'drag':1.6,'curl':False})

# เพิ่มเอฟเฟกต์ (ผู้ใช้ "abit more effect"): เส้นลมพุ่งออกรอบทิศ + ประกายเขียว + วงสโตรกนอกขยายไกล + คลื่นอากาศ + เข็มลม
fx['layers'].append({'id':'burst_streaks','t':'emit','at':T0,'life':.06,'att':'feet','pos':BC,'burst':70,'rate':0,'from':'sphere','fr':.8,'dir':'out','speed':[9,16],'plife':[.2,.4],'look':'streak','size':[1.4,2.8],'col':'#ffffff','c2':'#8dff65','gravity':0,'drag':2,'curl':False})
fx['layers'].append({'id':'burst_glint','t':'emit','at':T0+.04,'life':.45,'att':'feet','pos':BC,'rate':90,'from':'sphere','fr':RB,'dir':'tangent','speed':[2,5],'plife':[.3,.6],'look':'spark','size':[1,2],'col':'#d2ffb8','c2':'#8dff65','gravity':0})
fx['layers'].append({'id':'burst_needle','t':'emit','at':T0,'life':.06,'att':'feet','pos':BC,'burst':22,'rate':0,'from':'sphere','fr':1,'dir':'out','speed':[6,11],'plife':[.25,.45],'look':'model','model':'wind_needle','mmat':'solid','msize':[.3,.6],'col':'#efffe8','c2':'#8dff65','gravity':0,'drag':2,'mspin':0,'bounce':0})
for j,(tex,col,sp) in enumerate([('tex/wind_swoosh_a_hi','#ffffff',420),('tex/wind_swoosh_b','#8dff65',-360)]):
    fx['layers'].append({'id':f'burst_outer_{j}','t':'mesh','at':T0+.05+j*.03,'life':.6,'att':'feet','shape':'model','model':f'wind_pieces{j+1}','mat':'tex','tex':tex,'col':col,'col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],
        'pos':[0,.9,0],'rot':[0,j*90,0],'scale':{'0':[RB,.25,RB],'0.4':[RB*2,.3,RB*2],'1':[RB*3.2,.15,RB*3.2],'ease':'out'},'spin':sp,'op':{'0':0,'0.1':.95,'0.6':.6,'1':0},'fade':0,**({'int':1.4} if j==0 else {})})
fx['layers'].append({'id':'burst_shock','t':'warp','at':T0,'life':.35,'att':'feet','pos':BC,'kind':'shock','size':{'0':.5,'1':RB*2.2},'str':1,'op':{'0':1,'1':0},'col':'#efffe8','glow':.05})
fx['layers'].append({'id':'burst_shake','t':'screen','at':T0,'life':.15,'shake':2.5})
save(ROOT/'assets/fx/wind/shield_wing.fx.json',fx)
print('Wind wing shield: 5.6 s, 3-section wing animation, staged hits and radial release')
