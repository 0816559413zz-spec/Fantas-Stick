# แยกเอฟเฟกต์สายลมที่ผู้ใช้ผ่านแล้ว (ตัวอย่างใน VFX Studio) เป็นชิ้นที่เกมเรียกใช้จริง — รันหลังแก้ไฟล์ต้นทางทุกครั้ง
# ใช้: python tools/wind-ingame-split.py แล้ว node tools/fx-check.js
#   wind/ba_fly       ← ba_boomerang (ส่วนบิน, ตามกระสุน: จุดศูนย์ = ตัวกระสุน หันไป +z)
#   wind/ba_hit       ← ba_boomerang (ส่วนโดน)
#   wind/wing_idle    ← wing_angular (ท่ากางนิ่ง ไม่กระพือ — ผู้ใช้: ปีกปกติเกือบนิ่ง)
#   wind/shield_guard ← shield_wing (ห่อปีกค้างไว้ตลอดที่ยกโล่ ไม่มีจังหวะโดนตีตัวอย่าง / ไม่มีระเบิด)
#   wind/shield_burst ← shield_wing (ระเบิดโล่ ตั้งแต่ 3.56 วิ)
import json,copy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FX=ROOT/'assets/fx/wind'
load=lambda n:json.loads((FX/f'{n}.fx.json').read_text(encoding='utf-8'))
def save(n,F):(FX/f'{n}.fx.json').write_text(json.dumps(F,ensure_ascii=False,indent=1),encoding='utf-8');print('wind/'+n,len(F['layers']),'layers')
iscurve=lambda v:isinstance(v,dict)and any(k.replace('.','',1).isdigit()for k in v)
def first(v):
    if not iscurve(v):return v
    return v[min((k for k in v if k.replace('.','',1).isdigit()),key=float)]
def shift(v,d):   # ย้ายตำแหน่ง (ทั้งค่าเดี่ยวและเส้นโค้ง) ลบด้วย d
    sub=lambda p:[round(p[i]-d[i],4)for i in range(3)]if isinstance(p,list)and len(p)==3 and all(isinstance(x,(int,float))for x in p)else p
    return {k:(sub(x)if k.replace('.','',1).isdigit()else x)for k,x in v.items()}if isinstance(v,dict)else sub(v)

# ---------- BA ใบมีดลม (บูมเมอแรง) ----------
B=load('ba_boomerang');T_HIT=.64;ORG=[0,1.35,20]
fly=[];hit=[]
for L in B['layers']:
    L=copy.deepcopy(L)
    if L.get('at',0)>=T_HIT-1e-6:   # ส่วนโดน
        L['at']=round(L['at']-T_HIT,4)
        if 'pos' in L:L['pos']=shift(L['pos'],ORG)
        hit.append(L)
    else:                          # ส่วนบิน: ตรึงไว้ที่ตัวกระสุน (ตำแหน่งเริ่มของเส้นทาง เอาความสูง/ระยะออก)
        if 'pos' in L:p0=first(L['pos']);L['pos']=[p0[0],round(p0[1]-1.35,4),0]
        L['at']=0;L['life']=.6
        fly.append(L)
save('ba_fly',{'v':1,'desc':'ใบมีดลม BA ตอนบิน (ตามกระสุน) — แยกจาก wind/ba_boomerang ที่ผู้ใช้ผ่าน','tags':['wind','ba','ingame'],'pal':'wind','dur':.6,'layers':fly})
save('ba_hit',{'v':1,'desc':'ใบมีดลม BA ตอนโดน — แยกจาก wind/ba_boomerang','tags':['wind','ba','ingame'],'pal':'wind','dur':.4,'layers':hit})

# ---------- ปีกติดหลัง (ท่ากางนิ่ง วนตลอด) ----------
W=load('wing_angular');L2=[]
for L in W['layers']:
    L=copy.deepcopy(L)
    for k in('rot','pos'):
        if k in L and iscurve(L[k]):L[k]=first(L[k])
    L['loop']=True;L2.append(L)
save('wing_idle',{'v':1,'desc':'ปีกลมติดหลัง ท่ากางนิ่ง (เกม) — จาก wind/wing_angular ตัดการกระพือออก','tags':['wind','wing','ingame'],'pal':'wind','dur':1.6,'layers':L2})

# ---------- โล่ปีก: ห่อค้าง / ระเบิด ----------
S=load('shield_wing');D=S['dur'];HOLD=3.25;GL=9.5;T0=3.56
def hold(v):   # ตัดเส้นโค้งที่ HOLD วิ แล้วค้างค่านั้นไปจนจบ GL วิ
    if not iscurve(v):return v
    ks=sorted((k for k in v if k.replace('.','',1).isdigit()),key=float);out={}
    for k in ks:
        t=float(k)*D
        if t<=HOLD+1e-6:out[str(round(t/GL,5))]=v[k]
    last=[k for k in ks if float(k)*D<=HOLD+1e-6][-1];out['1']=v[last]
    for k,x in v.items():
        if not k.replace('.','',1).isdigit():out[k]=x
    return out
guard=[];burst=[]
for L in S['layers']:
    L=copy.deepcopy(L);i=L['id']
    if i.startswith('hit_'):continue
    if i.startswith(('burst_','release_')):
        L['at']=round(max(0,L.get('at',0)-T0),4);burst.append(L);continue
    for k,x in list(L.items()):
        if iscurve(x):L[k]=hold(x)
    a=L.get('at',0);L['life']=round(GL-a,3);guard.append(L)
save('shield_guard',{'v':1,'desc':'โล่ปีก: ปีกห่อตัวค้างตลอดที่ยกโล่ (เกม) — จาก wind/shield_wing','tags':['wind','shield','ingame'],'pal':'wind','dur':GL,'layers':guard})
save('shield_burst',{'v':1,'desc':'โล่ปีกระเบิด: ทรงกลมลมแถบสโตรก (เกม) — จาก wind/shield_wing','tags':['wind','shield','ingame'],'pal':'wind','dur':1.3,'layers':burst})

# ---------- Featherwing: ขึ้นบิน / สะบัดปีก (ตำแหน่งในไฟล์ต้นทางอยู่ที่ความสูงสาธิต 3.2 ม. — เกมเล่นที่ h = ตัวเรา − 3.2) ----------
FW=load('featherwing')
def part(pre,t0,name,desc):
    out=[]
    for L in FW['layers']:
        if not L['id'].startswith(pre):continue
        L=copy.deepcopy(L);L['at']=round(max(0,L.get('at',0)-t0),4);out.append(L)
    save(name,{'v':1,'desc':desc,'tags':['wind','featherwing','ingame'],'pal':'wind','dur':round(max(l['at']+l.get('life',0.5) for l in out),2),'layers':out})
part('s1_',0.15,'fw_takeoff','Featherwing ขึ้นบิน: วงลมพื้น + เส้นลมพุ่งขึ้น (เกม) — จาก wind/featherwing')
part('s3_',3.0,'fw_flick','Featherwing สะบัดปีก: ชาร์จเรือง + ลมพัดไปข้างหน้าเอียงลงพื้น 12.5 ม. (เกม, h = ตัวเรา − 3.2) — จาก wind/featherwing')
