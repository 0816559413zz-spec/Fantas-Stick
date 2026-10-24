# Wind skill style tests generator (2026-10-24). Run from repo root: python tools/wind-kit-gen.py
# Writes assets/fx/wind/sk_*.fx.json. tornado() = the user-approved "line storm" look (see designs/wind.md). Edit this, not the JSON.
import json,math,random
R='assets/fx/'
def W(p,o):json.dump(o,open(R+p,'w',encoding='utf8',newline='\n'),ensure_ascii=False,indent=1)
C=dict(inner='#eaffff',mid='#8fd8ff',outer='#1d6f86',hi='#ffffff',line='#123a55',ring='#7fe8c8',ring2='#ffffff',spark='#d8ffa0')
T=lambda n:'tex/'+n
# ---------- โมเดลเสริม (ทุกชิ้นใช้ภาพสโตรก ไม่มีแผ่นสี่เหลี่ยมเปล่า) ----------
W('mesh/wind_slashstroke.mesh.json',{"v":1,"desc":"สายลม: ใบมีดลม = เสี้ยวโค้งชิ้นเดียว (ใส่ภาพสโตรก wind_swoosh)","mat":"energy","pal":"storm","tags":["wind"],
 "parts":[{"id":"b","k":"blade","arc":120,"r":0.9,"w":0.5,"thick":0,"taper":0.2,"seg":40}]})
W('mesh/wind_vstroke.mesh.json',{"v":1,"desc":"สายลม: สโตรกตั้ง (ริบบิ้นโค้งขึ้น) สำหรับกำแพงลม","mat":"energy","pal":"storm","tags":["wind"],
 "parts":[{"id":"r","k":"ribbon","path":[[0,0,0],[0.15,0.8,0.05],[-0.1,1.6,0],[0.1,2.4,-0.05]],"w":1.3,"taper":0,"wall":False,"seg":32,"rot":[0,0,0]}]})
W('mesh/wind_wingstroke.mesh.json',{"v":1,"desc":"สายลม: ปีก = เสี้ยวสโตรกแผ่ออก 5 ชิ้นต่อข้าง (ทรงขนแหลม) กระจกซ้าย-ขวา","mat":"energy","pal":"storm","tags":["wind","wing"],
 "parts":[{"id":f"w{i}","k":"blade","arc":28,"r":round(ln,2),"w":0.32,"thick":0,"taper":0.2,"seg":20,"rot":[90,0,round(90-a,1)],"pos":[0.05,0,-0.05],"mir":True} for i,(a,ln) in enumerate([(58,1.0),(40,1.45),(24,1.7),(8,1.55),(-8,1.2)])]})
def lerp(a,b,t):return [a[i]+(b[i]-a[i])*t for i in range(3)]
# ---------- ทอร์นาโดสไตล์ที่ผู้ใช้อนุมัติ (สร้างเป็นชิ้นจริงตามเวลา — เคลื่อนที่ได้ / นอนได้) ----------
def tornado(pre,center,t0,t1,s=1.0,axis='up',every=0.12,life=0.9,core=True,col=C,floor=True):
  """center(t)->[x,y,z] ม. • axis 'up' = ตั้ง • 'fwd' = นอนพุ่งไปข้างหน้า (+z)"""
  L=[];rnd=random.Random(hash(pre)%999);n=0;t=t0
  def place(p,k):   # จุดของชิ้นที่อายุ k (0-1): ลอยขึ้นตามแกน + ส่ายนิด
    h=k*4.2*s;lean=0.35*s*k
    if axis=='up':return [round(p[0]+lean,2),round(p[1]+h,2),round(p[2],2)]
    return [round(p[0],2),round(p[1]+lean*0.3,2),round(p[2]+h,2)]
  while t<t1-0.05:
    v='ab'[n%2];m=f"wind_pieces{n%3}";ry=(n*67)%360
    pos={str(k):place(center(t+k*life),k) for k in (0,0.25,0.5,0.75,1)}
    sc=lambda mm:{"0":round(0.85*mm*s,2),"0.3":round(1.1*mm*s,2),"0.6":round(1.7*mm*s,2),"0.8":round(2.7*mm*s,2),"1":round(4.0*mm*s,2)}
    rot=[0,ry,0] if axis=='up' else [-90,0,ry]
    base=dict(t="mesh",at=round(t,3),life=life,att="feet",shape="model",model=m,mat="tex",col2="#000000",rim=0,uvTile=[1,1],uvScroll=[0,0],rot=rot,pos=pos,spin=520 if axis=='up' else 0,op={"0":0,"0.12":1,"0.88":1,"1":0})
    if n%2==0:L.append(dict(base,id=f"{pre}in{n}",tex=T(f"wind_swoosh_{v}_hi"),col=col['inner'],scale=sc(0.78),op={"0":0,"0.12":0.9,"0.88":0.9,"1":0}))
    else:L.append(dict(base,id=f"{pre}mid{n}",tex=T(f"wind_swoosh_{v}"),col=col['mid'],scale=sc(1.07)))
    L.append(dict(base,id=f"{pre}out{n}",tex=T(f"wind_swoosh_{v}"),col=col['outer'],scale=sc(1.3)))
    L.append(dict(base,id=f"{pre}hi{n}",tex=T(f"wind_swoosh_{v}_hi"),col=col['hi'],int=1.2,scale=sc(1.3)))
    L.append(dict(base,id=f"{pre}ln{n}",tex=T(f"wind_swoosh_{v}_ln"),col=col['line'],scale=sc(1.43)))
    n+=1;t+=every
  if core:
    dur=t1-t0;cp={str(round(k,2)):[round(x,2) for x in center(t0+k*dur)] for k in (0,0.25,0.5,0.75,1)}
    crot=[0,0,0] if axis=='up' else [-90,0,0]
    L.append({"id":f"{pre}core","t":"mesh","at":t0,"life":round(dur,2),"att":"feet","shape":"model","model":"wind_core","mat":"tex","tex":T("wind_streaks"),"col":"#ffffff","col2":"#000000","rim":0,"uvTile":[2,3],"uvScroll":[-2.5,-0.8],"pos":cp,"rot":crot,"scale":[round(1.6*s,2),round(1.4*s,2),round(1.6*s,2)],"int":1.0,"spin":600 if axis=='up' else 0,"op":{"0":0,"0.1":0.75,"0.9":0.75,"1":0}})
  if floor and axis=='up':
    dur=t1-t0;cp={str(round(k,2)):[round(x,2) for x in lerp(center(t0+k*dur),center(t0+k*dur),0)] for k in (0,0.5,1)}
    for j,(sc_,sp) in enumerate([(1.5,380),(2.4,-260)]):
      for suf,tex,cc in [('',f"wind_swoosh_{'ab'[j]}",col['outer']),('h',f"wind_swoosh_{'ab'[j]}_hi",col['hi']),('l',f"wind_swoosh_{'ab'[j]}_ln",col['line'])]:
        L.append({"id":f"{pre}g{j}{suf}","t":"mesh","at":t0,"life":round(dur,2),"att":"feet","shape":"model","model":"wind_groundswirl","mat":"tex","tex":T(tex),"col":cc,"col2":"#000000","rim":0,"uvTile":[1,1],"uvScroll":[0,0],"pos":{k:[v[0],round(0.04+j*0.03,2),v[2]] for k,v in cp.items()},"rot":[0,j*50,0],"spin":sp,"scale":{"0":round(sc_*s*0.4,2),"0.15":round(sc_*s,2),"1":round(sc_*s,2)},"op":{"0":0,"0.1":0.95,"0.85":0.95,"1":0},**({"int":1.2} if suf=='h' else {})})
    L.append({"id":f"{pre}glow","t":"mesh","at":t0,"life":round(dur,2),"att":"feet","shape":"ring","inner":0.55,"mat":"tex","tex":T("wind_streaks"),"col":col['ring'],"col2":"#000000","rim":0,"uvTile":[3,1],"uvScroll":[-1.6,0],"pos":{k:[v[0],0.06,v[2]] for k,v in cp.items()},"scale":round(2.6*s,2),"int":1.5,"op":{"0":0,"0.08":1,"0.85":1,"1":0}})
    L.append({"id":f"{pre}spk","t":"emit","at":t0,"life":round(dur,2),"att":"feet","pos":{k:[v[0],0.1,v[2]] for k,v in cp.items()},"rate":50,"from":"ring","fr":round(1.4*s,2),"dir":"tangent","speed":[4,7],"up":[0.5,2.5],"plife":[0.3,0.6],"look":"spark","size":[1.2,2.2],"col":col['spark'],"c2":col['ring'],"gravity":0.5})
  return L
def stroke_fx(pre,model,at,life,pos,rot,scale,v='a',o=1):
  b=dict(t="mesh",at=at,life=life,att="feet",shape="model",model=model,mat="tex",col2="#000000",rim=0,uvTile=[1,1],uvScroll=[0,0],pos=pos,rot=rot,op={"0":0,"0.1":o,"0.8":o,"1":0})
  return [dict(b,id=pre+"o",tex=T(f"wind_swoosh_{v}"),col=C['outer'],scale=scale),dict(b,id=pre+"h",tex=T(f"wind_swoosh_{v}_hi"),col=C['hi'],int=1.3,scale=scale),
          dict(b,id=pre+"l",tex=T(f"wind_swoosh_{v}_ln"),col=C['line'],scale=scale if not isinstance(scale,(int,float)) else round(scale*1.08,2))]
def flecks(pre,at,life,pos,rate=30,fr=0.6):
  return [{"id":pre+"fk","t":"emit","at":at,"life":life,"att":"feet","pos":pos,"rate":rate,"from":"sphere","fr":fr,"dir":"random","speed":[2,5],"plife":[0.3,0.6],"look":"model","model":"wind_slash","mmat":"solid","msize":[0.12,0.3],"col":C['outer'],"c2":C['outer'],"gravity":0.5,"mspin":500,"bounce":0},
          {"id":pre+"sp","t":"emit","at":at,"life":life,"att":"feet","pos":pos,"rate":rate,"from":"sphere","fr":fr,"dir":"random","speed":[1,3],"plife":[0.2,0.45],"look":"spark","size":[1,1.8],"col":C['spark'],"c2":C['ring'],"gravity":0}]
def FX(name,desc,dur,L):W(f'wind/{name}.fx.json',{"v":1,"desc":desc,"tags":["wind","style-test"],"pal":"wind","dur":dur,"layers":L})
F=lambda d:{str(k):v for k,v in d.items()}
# 1) BA
P=F({0:[0,1.2,0.8],1:[0,1.2,20]})
FX('sk_ba','สไตล์สโตรก: คลิกซ้าย ใบมีดลม = เสี้ยวสโตรกพู่กันพุ่ง 20 ม. + เศษหมึก/ประกายตาม',0.8,stroke_fx('b','wind_slashstroke',0,0.6,P,[90,0,20],1.9)+flecks('b',0,0.55,P,40,0.3))
# 2) GaleBurst = ทอร์นาโดนอนพุ่ง
FX('sk_galeburst','สไตล์สโตรก: GaleBurst เต็ม — ทอร์นาโดสไตล์เดียวกันนอนพุ่งไปข้างหน้า 25 ม.',1.6,tornado('gb',lambda t:[0,1.1,1+min(1,t/1.1)*24],0,1.1,s=0.5,axis='fwd',every=0.07,life=0.5,floor=False))
# 3) โล่ปีก + ปีกระเบิด
L=tornado('sh',lambda t:[0,0,0],0,1.35,s=0.32,every=0.1,life=0.7,core=False,floor=False)
L+=stroke_fx('wg','wind_wingstroke',0,1.4,[0,1.3,-0.3],[0,0,0],F({0:0.4,0.15:1.0,1:1.0}),'b',0.9)
for j,(sc,sp) in enumerate([(1.0,600),(2.2,-400),(3.4,300)]):
  L+=stroke_fx(f'bw{j}','wind_groundswirl',1.4,0.7,[0,0.4+j*0.2,0],[0,j*60,0],F({0:0.3,0.4:sc*1.2,1:sc*1.5}),'ab'[j%2])
L+=[{"id":"pulse","t":"ring","at":1.42,"life":0.5,"att":"feet","col":C['ring']}]+flecks('bf',1.4,0.25,[0,1,0],200,1.5)
FX('sk_shield','สไตล์สโตรก: โล่ = สโตรกวนห่อตัว + ปีกสโตรก (0–1.4 วิ) → ปีกระเบิด: สโตรกวงกวาดออก 3 ชั้น + เศษหมึก + คลื่นวง',2.3,L)
# 4) Dash
L=stroke_fx('push','wind_slashstroke',0,0.45,F({0:[0,0.9,1],1:[0,0.9,10]}),[90,0,0],F({0:1.2,1:3.5}),'a')
L+=stroke_fx('push2','wind_slashstroke',0.05,0.4,F({0:[0,1.3,1],1:[0,1.3,9]}),[90,0,180],F({0:1.0,1:3.0}),'b',0.8)
L+=stroke_fx('trail','wind_pieces1',0,0.5,F({0:[0,0.8,0],1:[0,0.8,-6]}),[-90,0,0],F({0:0.6,1:1.4}),'a',0.8)+flecks('d',0,0.4,F({0:[0,1,0],1:[0,1,-6]}),60,0.6)
FX('sk_dash','สไตล์สโตรก: Dash — เสี้ยวสโตรกใหญ่ 2 ชั้นผลักไปข้างหน้า + สโตรกลู่ตามตัวที่ดีดถอยหลัง + เศษหมึก',1.0,L)
# 5) กำแพงลม: สโตรกตั้งวนขึ้นเรียงเป็นแนว 12.5 ม.
L=[]
for c in range(13):
  x=-6+c*1.0
  for r in range(4):
    at=round(r*0.7+c*0.07,2);v='ab'[(c+r)%2]
    L+=stroke_fx(f'w{c}_{r}','wind_vstroke',at,1.2,F({0:[x,-0.3,8],1:[x+0.3,1.4,8]}),[0,(c*37)%40-20,0],F({0:1.0,1:1.6}),v,0.95)
L+=[{"id":"wline","t":"emit","at":0,"life":3,"att":"feet","pos":[0,0.1,8],"rate":40,"from":"line","fr":6.2,"dir":"up","spread":0.2,"speed":[2,4],"plife":[0.4,0.8],"look":"spark","size":[1.2,2],"col":C['spark'],"c2":C['ring'],"gravity":-0.5},
    {"id":"wfl","t":"emit","at":0,"life":3,"att":"feet","pos":[0,1.5,8],"rate":25,"from":"box","fr":6.2,"fh":1.5,"dir":"up","speed":[2,4],"plife":[0.4,0.8],"look":"model","model":"wind_slash","mmat":"solid","msize":[0.12,0.3],"col":C['outer'],"c2":C['outer'],"gravity":-0.5,"mspin":400,"bounce":0}]
FX('sk_wall','สไตล์สโตรก: กำแพงลม 12.5 ม. — สโตรกตั้งวนขึ้นเรียงแนว 9 แถว (ไม่มีแผ่นสี่เหลี่ยม) + ประกาย/เศษหมึกลอยขึ้น',3,L)
# 6) Gust
L=stroke_fx('wg','wind_wingstroke',0,0.5,[0,1.4,-0.3],[0,0,0],F({0:0.6,0.6:1.3,1:0.7}),'b')
L+=stroke_fx('dashs','wind_pieces2',0.3,0.3,F({0:[0,1,0],1:[0,1,10]}),[-90,0,0],F({0:0.8,1:1.6}),'a')
L+=stroke_fx('land','wind_groundswirl',0.45,0.5,[0,0.05,10],[0,0,0],F({0:0.4,1:2.5}),'b')
L+=tornado('gt',lambda t:[0,1,0.5+min(1,(t-1.45)/0.55)*13],1.45,2.05,s=0.6,axis='fwd',every=0.05,life=0.45,floor=False)
FX('sk_gust','สไตล์สโตรก: Gust — ปีกสโตรกชาร์จ → พุ่ง 10 ม. (สโตรกลู่) → ลงพื้น (วงสโตรก) → 1 วิ ต่อมา ทอร์นาโดนอนกวาดผ่านแนวทาง',2.4,L)
# 7) Vacuum
L=[]
for i,a in enumerate([-22,0,22]):
  x=math.sin(math.radians(a))*10;z=math.cos(math.radians(a))*10
  def cen(t,x=x,z=z):k=0 if t<0.6 else min(1,(t-0.6)/0.6);return [x+(x*0.1-x)*k,0,z+(3-z)*k]
  L+=tornado(f'v{i}',cen,0,1.4,s=0.3,every=0.12,life=0.7)
FX('sk_vacuum','สไตล์สโตรก: Vacuum — ทอร์นาโดสไตล์เดียวกันขนาดเล็ก 3 ลูกโค้งข้างหน้า 10 ม. → 0.6 วิ ถูกดึงมาหน้าเรา 3 ม.',1.6,L)
# 8) หลุมดำ
L=[]
for i in range(3):
  t0=i*0.18;P=F({0:[0,1.2,1],1:[0,1.2,20]})
  L+=[{"id":f"orb{i}","t":"mesh","at":t0,"life":0.7,"att":"feet","shape":"sphere","mat":"toon","col":"#000000","col2":"#000000","rim":0,"pos":P,"scale":0.42,"op":{"0":0,"0.05":1,"0.9":1,"1":0}}]
  L+=stroke_fx(f'o{i}r','wind_groundswirl',t0,0.7,P,[90,0,0],0.55,'ab'[i%2])
  L+=[{"id":f"suck{i}","t":"emit","at":t0,"life":0.65,"att":"feet","pos":P,"rate":60,"from":"sphere","fr":1.0,"dir":"in","speed":[3,6],"plife":[0.15,0.3],"look":"model","model":"wind_slash","mmat":"solid","msize":[0.08,0.18],"col":C['outer'],"c2":C['outer'],"gravity":0,"mspin":600,"bounce":0}]
FX('sk_blackhole','สไตล์สโตรก: ลูกหลุมดำ ×3 — แกนดำ + วงสโตรกพู่กันหมุนรอบ (หันหน้าเข้าทิศพุ่ง) + เศษหมึกถูกดูดเข้า',1.2,L)
# 9) Updraft ⚠
L=stroke_fx('warn','wind_groundswirl',0,0.45,[0,0.05,8],[0,0,0],F({0:1,1:3.2}),'a',0.8)+tornado('u',lambda t:[0,0,8],0.4,1.7,s=0.75,every=0.1,life=0.8)
FX('sk_updraft','สไตล์สโตรก (⚠ สกิล 5 Claude): ลมยกตัว — วงสโตรกเตือนที่พื้น → ทอร์นาโดสไตล์เดียวกันพุ่งขึ้น',2,L)
# 10) อัลติ คุกฟ้า ⚠
L=[]
for wi,(px,pz,ry) in enumerate([(0,6,0),(0,18,0),(-6,12,90),(6,12,90)]):
  for c in range(7):
    o=-4.5+c*1.5;x=px+(o if ry==0 else 0);z=pz+(o if ry==90 else 0)
    for r in range(4):
      at=round(wi*0.2+r*0.8+c*0.05,2)
      L+=stroke_fx(f'k{wi}_{c}_{r}','wind_vstroke',at,1.2,F({0:[x,-0.3,z],1:[x,1.4,z]}),[0,ry+(c*31)%30-15,0],F({0:1.0,1:1.6}),'ab'[(c+r)%2],0.9)
L+=tornado('ut',lambda t:[0,0,12],0.6,3.2,s=1.1,every=0.14,life=1.0)
L+=[{"id":"boom","t":"emit","at":3.3,"life":0.1,"att":"feet","pos":[0,1.5,12],"burst":80,"from":"box","fr":6,"fh":1.5,"dir":"in","speed":[14,22],"plife":[0.3,0.5],"look":"model","model":"wind_slash","mmat":"solid","msize":[0.2,0.45],"col":C['outer'],"c2":C['outer'],"gravity":0,"mspin":600,"bounce":0},
    {"id":"flash","t":"ring","at":3.35,"life":0.5,"att":"feet","pos":[0,0,12],"col":C['hi']}]
FX('sk_ult','สไตล์สโตรก (⚠ อัลติ Claude): คุกฟ้า — กำแพงสโตรก 4 ด้าน + ทอร์นาโดใหญ่ข้างใน → จบ: เศษหมึกระเบิดเข้ากลาง',3.8,L)
print('ok')
