# Void Spheres → one big black hole (user redesign 2026-10-31, designs/wind.md "Void Spheres → หลุมดำลูกเดียว").
# Run: python tools/wind-blackhole-gen.py then node tools/fx-check.js
# View: studio.html?fx=wind/void_blackhole (whole skill) • pieces the game plays:
#   wind/void_matter  thrust kick at the hand + dark neon matter flies 2.5 m (50 units) + trembles 0.5 s   (at the caster, a = aim)
#   wind/void_hole    the black hole, 2.5 s: approved void orb look ×3 — horizontal disk is the main shape,
#                     plus tilted wind rings that pop up at random angles for a moment and vanish (user)   (at the hole)
#   wind/void_boom    implode → blast forward (+z = shot direction)                                          (at the hole, a = aim)
# Colours = approved wind void palette (white, mint, neon green, lime, aqua/teal). No ink.
import json,math,random
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FX=ROOT/'assets/fx/wind'
G=dict(hi='#ffffff',inner='#efffe8',mint='#b8ffe0',mid='#8dff65',lime='#c6ff5a',aqua='#5cf0c8',teal='#21b89a',outer='#2ec772',deep='#0f4a2c',neon='#39ff7a')
T=lambda n:'tex/'+n
Y=1.3          # hole centre height (chest of the spinning enemies)
DIST=2.5       # matter travel (50 units)
FLY=.15        # matter flight time
WAIT=.5        # tremble before it turns into the hole
HOLD=2.5       # hole life
DRIFT=5.0      # hole drifts forward 5 m (100 units) over its life (⚠ 40 units/s)
ORBIT=2.5      # enemies spin at ~50 units from the core
SUCK=7.5       # suck radius (150 units)
rnd=random.Random(31)

def save(name,layers,desc,tags):
    dur=round(max(l['at']+l.get('life',.3) for l in layers)+.05,2)
    (FX/f'{name}.fx.json').write_text(json.dumps({'v':1,'desc':desc,'tags':['wind','void','blackhole']+tags,'pal':'wind','dur':dur,'seed':31,'layers':layers},ensure_ascii=False,indent=1),encoding='utf-8')
    print('wind/'+name,len(layers),'layers dur',dur)

# ---------- matter: thrust kick at the hand, small dark neon orb flies 2.5 m, trembles and sucks in ----------
M=[]
H=[0,Y,.8]
M.append({'id':'kick_flash','t':'flash','at':0,'life':.08,'att':'feet','pos':H,'col':G['mint'],'size0':.2,'size':1.0,'k':.45})
M.append({'id':'kick_warp','t':'warp','at':0,'life':.16,'att':'feet','pos':H,'kind':'shock','size':{'0':.2,'1':1.8},'str':.6,'op':{'0':1,'1':0},'col':G['inner'],'glow':.03})
M.append({'id':'kick_wisp','t':'emit','at':0,'life':.04,'att':'feet','pos':H,'burst':14,'rate':0,'from':'disc','fr':.3,'dir':'aim','spread':.35,'speed':[6,10],'plife':[.1,.2],
    'look':'streak','size':[1,1.6],'col':G['inner'],'c2':G['aqua'],'gravity':0,'drag':4,'curl':False})
MP={'0':[0,Y,.8],str(round(FLY/(FLY+WAIT),3)):[0,Y,DIST]}
for i in range(1,9):   # tremble: small jitter around the stop point
    u=round((FLY+WAIT*i/9)/(FLY+WAIT),3);MP[str(u)]=[round(rnd.uniform(-.06,.06),3),round(Y+rnd.uniform(-.06,.06),3),round(DIST+rnd.uniform(-.06,.06),3)]
MP['1']=[0,Y,DIST]
ML=FLY+WAIT
M.append({'id':'matter_core','t':'mesh','at':0,'life':ML,'att':'feet','shape':'sphere','mat':'toon','col':'#000000','col2':'#000000','rim':1.6,'pos':MP,
    'scale':{'0':.18,'0.25':.3,'0.85':.42,'1':.2},'op':1,'fade':0})
M.append({'id':'matter_rim','t':'mesh','at':0,'life':ML,'att':'feet','shape':'plane','mat':'tex','tex':T('wind_void_disk'),'col':'#ffffff','col2':'#000000','rim':0,
    'uvTile':[1,1],'uvScroll':[0,0],'pos':MP,'rot':[90,0,15],'spin':720,'int':1.1,'scale':{'0':.6,'0.25':1.2,'0.85':1.6,'1':.4},'op':{'0':0,'0.1':1,'0.9':1,'1':0},'fade':0})
M.append({'id':'matter_tail','t':'trail','at':0,'life':FLY+.02,'att':'feet','pos':{'0':[0,Y,.8],'1':[0,Y,DIST]},'col':G['neon'],'col2':G['deep'],'w':.14,'tlife':.14,'k':1.0})
M.append({'id':'matter_suck','t':'emit','at':FLY,'life':WAIT,'att':'feet','pos':[0,Y,DIST],'rate':120,'from':'sphere','fr':1.8,'dir':'in','speed':[5,8],'plife':[.12,.22],
    'look':'streak','size':[.8,1.4],'col':G['lime'],'c2':G['aqua'],'gravity':0,'drag':0,'curl':False})
M.append({'id':'matter_spark','t':'emit','at':FLY,'life':WAIT,'att':'feet','pos':[0,Y,DIST],'rate':50,'from':'ring','fr':.5,'dir':'tangent','speed':[3,5],'plife':[.15,.3],
    'look':'glow','size':[.4,.7],'col':G['neon'],'c2':G['teal'],'gravity':0,'drag':1})
save('void_matter',M,'Void Spheres ① ท่าแทงไม้ + ก้อนสสารมืดขอบนีออน พุ่ง 2.5 ม. (50) แล้วสั่นบีบตัว 0.5 วิ (เกม: ที่ตัวผู้ร่าย a = ทิศเล็ง)',['ingame'])

# ---------- the black hole (2.5 s) ----------
B=[];C=[0,Y,0]
op={'0':0,'0.06':1,'0.94':1,'1':0}
B.append({'id':'form_flash','t':'flash','at':0,'life':.12,'att':'feet','pos':C,'col':G['mint'],'size0':.3,'size':1.0,'k':.3})
B.append({'id':'form_shock','t':'warp','at':0,'life':.28,'att':'feet','pos':C,'kind':'shock','size':{'0':.4,'1':5},'str':1,'op':{'0':1,'1':0},'col':G['inner'],'glow':.04})
# main shape: horizontal accretion disks (approved look, ×3)
for j,(tex,sc,tilt,sp,o) in enumerate([('wind_void_disk',4.4,8,620,1),('wind_void_disk_b',6.2,-6,400,.8),('wind_void_disk',3.8,14,-700,.5)]):
    B.append({'id':f'disk{j}','t':'mesh','at':0,'life':HOLD,'att':'feet','shape':'plane','mat':'tex','tex':T(tex),'col':['#6fe0a8','#2ec772','#5cf0c8'][j],'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[0,0],'pos':C,'rot':[90,j*40,tilt],'spin':sp,'int':.8,
        'scale':{'0':.4,'0.08':sc,'0.92':sc*1.05,'1':.3,'ease':'out'},'op':{k:v*o for k,v in op.items()},'fade':0})
B.append({'id':'core','t':'mesh','at':0,'life':HOLD,'att':'feet','shape':'sphere','mat':'black','col':'#000000','col2':'#000000','rim':1.2,
    'pos':C,'scale':{'0':.1,'0.06':1.0,'0.5':1.1,'0.94':1.15,'1':.08},'op':1,'fade':0,'rim':0})
# the hole spins on itself (user: "blackhole will spinning around itself too"): swirl arms hugging the core
for j in range(4):
    B.append({'id':f'arm{j}','t':'mesh','at':0,'life':HOLD,'att':'feet','shape':'model','model':f'wind_pieces{j%3}','mat':'tex','tex':T('wind_swoosh_a_hi'),'col':[G['mint'],G['aqua'],G['lime'],G['mid']][j],'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[0,0],'pos':C,'rot':[[12,-12,30,-30][j],j*90,[20,-25,10,-15][j]],'spin':[720,680,-700,-660][j],'int':.55,
        'scale':{'0':[.3,.3,.3],'0.08':[1.6,.45,1.6],'0.92':[1.65,.45,1.65],'1':[.2,.2,.2]},'op':{'0':0,'0.08':.9,'0.92':.9,'1':0},'fade':0})
# more around (round 4): wind comets orbiting on tilted circles (3D, 2 laps), big outer tilted rings popping in and out
for j in range(14):
    R=rnd.uniform(1.5,3.4);tx=math.radians(rnd.uniform(-70,70));tz=math.radians(rnd.uniform(-70,70));ph=rnd.uniform(0,6.283);d=rnd.choice([-1,1])
    P={}
    for k in range(33):
        u=k/32;th=ph+d*u*2*6.283;x,y,z=R*math.cos(th),0,R*math.sin(th)
        y,z=y*math.cos(tx)-z*math.sin(tx),y*math.sin(tx)+z*math.cos(tx)
        x,y=x*math.cos(tz)-y*math.sin(tz),x*math.sin(tz)+y*math.cos(tz)
        P[str(round(u,4))]=[round(x,3),round(Y+y,3),round(z,3)]
    c=[(G['inner'],G['aqua']),(G['mint'],G['teal']),(G['lime'],G['outer']),(G['aqua'],G['deep'])][j%4]
    B.append({'id':f'comet{j}','t':'trail','at':round(.05+j*.025,3),'life':round(HOLD-.15-j*.025,3),'att':'feet','pos':P,'col':c[0],'col2':c[1],'w':.13,'tlife':.3,'k':1.0})
for i in range(10):
    a=round(.15+i*(HOLD-.5)/10+rnd.uniform(-.05,.05),3);sc=rnd.uniform(3.4,4.6)
    B.append({'id':f'outer{i}','t':'mesh','at':a,'life':round(rnd.uniform(.35,.5),3),'att':'feet','shape':'model','model':f'wind_pieces{i%3}','mat':'tex','tex':T(rnd.choice(['wind_swoosh_a_hi','wind_swoosh_b_hi'])),
        'col':rnd.choice([G['mint'],G['aqua'],G['lime']]),'col2':'#000000','rim':0,'uvTile':[1,1],'uvScroll':[0,0],'pos':C,
        'rot':[round(rnd.choice([-1,1])*rnd.uniform(20,60),1),round(rnd.uniform(0,360),1),round(rnd.uniform(-30,30),1)],'spin':rnd.choice([-1,1])*rnd.randint(500,700),
        'scale':{'0':[sc*.7,.3,sc*.7],'0.3':[sc,.45,sc],'1':[sc*1.1,.3,sc*1.1],'ease':'out'},'op':{'0':0,'0.2':.85,'0.7':.7,'1':0},'fade':0,'x':True})
# round 5 (user: "more effect around blackhole"): second bigger set of arms, sparks streaming into the core, glints, ground dust ring
for j in range(3):
    B.append({'id':f'armb{j}','t':'mesh','at':0,'life':HOLD,'att':'feet','shape':'model','model':f'wind_pieces{j}','mat':'tex','tex':T('wind_swoosh_b_hi'),'col':[G['aqua'],G['mint'],G['lime']][j],'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[0,0],'pos':C,'rot':[[-40,45,70][j],j*120,[35,-50,15][j]],'spin':[-560,600,-640][j],
        'scale':{'0':[.4,.3,.4],'0.1':[2.1,.4,2.1],'0.9':[2.2,.4,2.2],'1':[.3,.2,.3]},'op':{'0':0,'0.1':.6,'0.9':.6,'1':0},'fade':0})
B.append({'id':'dustring','t':'emit','at':.05,'life':HOLD-.15,'att':'feet','pos':[0,.08,0],'rate':55,'from':'ring','fr':SUCK*.3,'dir':'tangent','speed':[7,10],'plife':[.3,.5],
    'look':'streak','size':[1.2,2],'col':'#d9efe4','c2':G['teal'],'gravity':0,'drag':0,'curl':False})
# dark stain on the ground
B.append({'id':'stain','t':'decal','at':0,'life':HOLD,'att':'feet','pos':[0,0,0],'kind':'dark','r':SUCK*.55,'op':.6})
# horizontal wind bands orbiting at the enemies' spin radius
for j,(tex,col,sc,sp,y) in enumerate([('wind_swoosh_a_hi',G['mint'],ORBIT*.95,560,0),('wind_swoosh_b',G['aqua'],ORBIT*1.15,-480,.35),('wind_swoosh_a_hi',G['lime'],ORBIT*.75,640,-.3)]):
    B.append({'id':f'band{j}','t':'mesh','at':0,'life':HOLD,'att':'feet','shape':'model','model':f'wind_pieces{j}','mat':'tex','tex':T(tex),'col':col,'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[0,0],'pos':[0,Y+y,0],'rot':[0,j*60,rnd.uniform(-8,8)],'spin':sp,
        'scale':{'0':[.3,.2,.3],'0.1':[sc,.6,sc],'0.9':[sc,.6,sc],'1':[.3,.2,.3]},'op':{'0':0,'0.08':1,'0.9':.95,'1':0},'fade':0})
# random tilted rings: pop up for a moment at random angles, then vanish (user: "เป็นบางจุด สุ่มๆ … มาแค่ไม่นาน")
for i in range(30):
    a=round(.1+i*(HOLD-.45)/30+rnd.uniform(-.05,.05),3);rx=rnd.choice([-1,1])*rnd.uniform(35,80);ry=rnd.uniform(0,360);rz=rnd.uniform(-40,40)
    sc=rnd.uniform(2.0,3.2);col=rnd.choice([G['mint'],G['aqua'],G['lime'],G['inner']]);tex=rnd.choice(['wind_swoosh_a_hi','wind_swoosh_b_hi'])
    B.append({'id':f'tilt{i}','t':'mesh','at':a,'life':round(rnd.uniform(.3,.42),3),'att':'feet','shape':'model','model':f'wind_pieces{i%3}','mat':'tex','tex':T(tex),'col':col,'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[0,0],'pos':C,'rot':[round(rx,1),round(ry,1),round(rz,1)],'spin':rnd.choice([-1,1])*rnd.randint(600,720),
        'scale':{'0':[sc*.6,.3,sc*.6],'0.3':[sc,.5,sc],'1':[sc*1.15,.3,sc*1.15],'ease':'out'},'op':{'0':0,'0.2':1,'0.7':.85,'1':0},'fade':0})
# wind pulled in from the whole suck radius (spiral streaks), chips and motes orbiting, ground swirl
for j,(c,c2,fr,rate) in enumerate([(G['lime'],G['aqua'],SUCK*.8,90),(G['inner'],G['mid'],SUCK*.5,70)]):
    B.append({'id':f'suck{j}','t':'emit','at':.05,'life':HOLD-.15,'att':'feet','pos':C,'rate':rate,'from':'sphere','fr':fr,'dir':'in','speed':[10,16],'plife':[.2,.32],
        'look':'streak','size':[1.2,2.2],'col':c,'c2':c2,'gravity':0,'drag':0,'curl':True})
B.append({'id':'chips','t':'emit','at':.05,'life':HOLD-.15,'att':'feet','pos':C,'rate':40,'from':'ring','fr':ORBIT,'dir':'tangent','speed':[6,9],'plife':[.4,.7],
    'look':'model','model':'wind_wing_airchip','mmat':'glow','msize':[.08,.18],'col':G['mint'],'c2':G['teal'],'mspin':600,'gravity':0,'drag':1,'bounce':0})
for j,(c,c2,fr) in enumerate([(G['mint'],G['teal'],ORBIT*.7),(G['neon'],G['outer'],ORBIT*1.3)]):
    B.append({'id':f'spark{j}','t':'emit','at':.05,'life':HOLD-.15,'att':'feet','pos':C,'rate':50,'from':'ring','fr':fr,'dir':'tangent','speed':[5,8],'plife':[.3,.5],
        'look':'glow','size':[.5,.9],'col':c,'c2':c2,'gravity':0,'drag':.5,'x':j==1})
B.append({'id':'ground','t':'mesh','at':0,'life':HOLD,'att':'feet','shape':'plane','mat':'tex','tex':T('wind_void_disk_b'),'col':'#ffffff','col2':'#000000','rim':0,
    'uvTile':[1,1],'uvScroll':[0,0],'pos':[0,.04,0],'rot':[90,0,0],'spin':180,'int':.7,'scale':{'0':1,'0.1':SUCK*1.1,'0.9':SUCK*1.1,'1':2},'op':{'0':0,'0.1':.25,'0.9':.22,'1':0},'fade':0})
B.append({'id':'leaves','t':'emit','at':.05,'life':HOLD-.15,'att':'feet','pos':[0,.2,0],'rate':32,'from':'disc','fr':SUCK,'dir':'in','speed':[4,7],'plife':[.6,1],
    'look':'model','model':'wind_leaf','mmat':'glow','msize':[.12,.24],'col':G['lime'],'c2':G['outer'],'mspin':400,'gravity':-1.2,'drag':.5,'bounce':0,'x':True})
# more around (user round 2: "เอฟเฟกต์รอบๆ ยังน้อย"): spiral wind arms on the ground, wind circling the suck edge (shows the 7.5 m range),
# updraft streaks rising round the hole, inner fast ring of streaks
for j,(c,c2,fr) in enumerate([(G['mint'],G['teal'],SUCK*.75),(G['aqua'],G['outer'],SUCK*.45)]):   # ground swirl = streaks circling flat on the floor
    B.append({'id':f'gswirl{j}','t':'emit','at':.05,'life':HOLD-.15,'att':'feet','pos':[0,.12,0],'rate':60,'from':'ring','fr':fr,'dir':'tangent','speed':[8,12],'plife':[.3,.5],
        'look':'streak','size':[1.6,2.6],'col':c,'c2':c2,'gravity':0,'drag':0,'curl':False})
B.append({'id':'edge','t':'emit','at':.05,'life':HOLD-.15,'att':'feet','pos':[0,.5,0],'rate':100,'from':'ring','fr':SUCK,'dir':'tangent','speed':[9,13],'plife':[.25,.4],
    'look':'streak','size':[1.4,2.4],'col':G['inner'],'c2':G['aqua'],'gravity':0,'drag':0,'curl':False})
B.append({'id':'updraft','t':'emit','at':.05,'life':HOLD-.15,'att':'feet','pos':[0,.1,0],'rate':45,'from':'ring','fr':ORBIT*1.4,'dir':'up','spread':.15,'speed':[6,9],'plife':[.3,.5],
    'look':'streak','size':[1,1.8],'col':G['mint'],'c2':G['teal'],'gravity':0,'drag':0,'curl':False,'x':True})
# no point light in the hole: it tinted the black core green (user wants it perfectly black)
B.append({'id':'hum','t':'screen','at':0,'life':.2,'shake':1.2,'own':True})
save('void_hole',B,'Void Spheres ② หลุมดำ 2.5 วิ: แกนดำ + จานลมแนวนอนหลายสี (×3 ของลูกเดิมที่ผ่านแล้ว) + วงลมเอียงสุ่มทิศโผล่แป๊บเดียว + ลมดูดเข้าจากรัศมี 7.5 ม. + เศษลมหมุนวงที่ศัตรูหมุน (เกม: ที่จุดหลุมดำ)',['ingame'])

# ---------- explosion: implode, then a huge blast forward (+z) (user round 3: "make it alot more impact") ----------
X=[]
X.append({'id':'implode','t':'emit','at':0,'life':.12,'att':'feet','pos':C,'rate':200,'from':'sphere','fr':4.5,'dir':'in','speed':[30,42],'plife':[.08,.12],
    'look':'streak','size':[1.6,2.8],'col':G['hi'],'c2':G['aqua'],'gravity':0,'drag':0,'curl':False})
X.append({'id':'crush','t':'mesh','at':0,'life':.13,'att':'feet','shape':'sphere','mat':'black','col':'#000000','col2':'#000000','rim':.6,'pos':C,'scale':{'0':1.2,'1':.15,'ease':'in'},'op':1,'fade':0})
t=.12
X.append({'id':'flash','t':'flash','at':t,'life':.2,'att':'feet','pos':C,'col':G['inner'],'size0':.8,'size':5,'k':.9})
X.append({'id':'ball','t':'mesh','at':t,'life':.32,'att':'feet','shape':'sphere','mat':'energy','col':G['mint'],'col2':G['outer'],'pos':C,'scale':{'0':.6,'1':7,'ease':'out'},'op':{'0':.9,'1':0},'fade':0,'rim':1.5})
X.append({'id':'cone','t':'mesh','at':t,'life':.4,'att':'feet','shape':'cone','mat':'energy','col':G['inner'],'col2':G['aqua'],'pos':{'0':[0,Y,2],'0.3':[0,Y,9],'1':[0,Y,12]},'rot':[90,0,0],
    'scale':{'0':[1,2,1],'0.3':[3.5,9,3.5],'1':[5,12,5],'ease':'out'},'op':{'0':.85,'1':0},'fade':0,'rim':1.5,'scroll':4})
X.append({'id':'light','t':'light','at':t,'life':.3,'att':'feet','pos':C,'col':G['mint'],'int':{'0':2.5,'1':0},'dist':14})
X.append({'id':'shock','t':'warp','at':t,'life':.32,'att':'feet','pos':C,'kind':'shock','size':{'0':.4,'1':9},'str':1,'op':{'0':1,'1':0},'col':G['inner'],'glow':.05})
X.append({'id':'shock2','t':'warp','at':round(t+.1,3),'life':.4,'att':'feet','pos':C,'kind':'shock','size':{'0':1,'1':14},'str':.8,'op':{'0':1,'1':0},'col':G['mint'],'glow':.04})
X.append({'id':'shock3','t':'warp','at':t,'life':.35,'att':'feet','pos':[0,Y,4],'kind':'shock','size':{'0':.5,'1':7},'str':.9,'op':{'0':1,'1':0},'col':G['inner'],'glow':.04})
for j in range(7):   # wind slabs rushing forward, fanned
    tex,col=[('wind_swoosh_a_hi',G['inner']),('wind_swoosh_b_hi',G['aqua']),('wind_swoosh_a_hi',G['lime']),('wind_swoosh_b_hi',G['mint']),('wind_swoosh_a_hi',G['mid']),('wind_swoosh_b_hi',G['inner']),('wind_swoosh_a_hi',G['aqua'])][j]
    dx=[0,-1.2,1.2,-.6,.6,-2,2][j];sc=[3.6,3,3,2.6,2.6,2.2,2.2][j];dy=[0,.4,.4,-.3,-.3,.2,.2][j]
    X.append({'id':f'gust{j}','t':'mesh','at':round(t+j*.025,3),'life':.55,'att':'feet','shape':'model','model':f'wind_pieces{j%3}','mat':'tex','tex':T(tex),'col':col,'col2':'#000000','rim':0,
        'uvTile':[1,1],'uvScroll':[0,0],'pos':{'0':[dx*.3,Y+dy,0],'1':[dx*3,Y+dy,18]},'rot':[90,0,j*35],'spin':[700,-700,700,-700,680,-650,620][j],
        'scale':{'0':[sc*.4,.3,sc*.4],'0.25':[sc,.5,sc],'1':[sc*1.8,.35,sc*1.8],'ease':'out'},'op':{'0':0,'0.08':1,'0.6':.75,'1':0},'fade':0})
X.append({'id':'blast','t':'emit','at':t,'life':.08,'att':'feet','pos':C,'burst':80,'rate':0,'from':'sphere','fr':1,'dir':'aim','spread':.4,'speed':[26,42],'plife':[.25,.45],
    'look':'streak','size':[1.8,3.4],'col':G['hi'],'c2':G['aqua'],'gravity':0,'drag':2,'curl':False})
X.append({'id':'blast2','t':'emit','at':t,'life':.08,'att':'feet','pos':C,'burst':70,'rate':0,'from':'sphere','fr':1.2,'dir':'aim','spread':.65,'speed':[16,26],'plife':[.35,.6],
    'look':'streak','size':[1.4,2.4],'col':G['lime'],'c2':G['teal'],'gravity':0,'drag':2,'curl':False})
X.append({'id':'chips','t':'emit','at':t,'life':.06,'att':'feet','pos':C,'burst':40,'rate':0,'from':'sphere','fr':.8,'dir':'aim','spread':.7,'speed':[10,20],'plife':[.4,.8],
    'look':'model','model':'wind_wing_airchip','mmat':'glow','msize':[.14,.3],'col':G['mint'],'c2':G['teal'],'mspin':500,'gravity':2,'drag':1,'bounce':0})
X.append({'id':'groundwave','t':'emit','at':t,'life':.08,'att':'feet','pos':[0,.15,0],'burst':80,'rate':0,'from':'ring','fr':1.2,'dir':'out','speed':[16,24],'plife':[.3,.5],
    'look':'streak','size':[1.6,2.6],'col':G['inner'],'c2':G['mid'],'gravity':0,'drag':3,'curl':False})
X.append({'id':'shake','t':'screen','at':t,'life':.55,'shake':7,'flash':.05,'fcol':G['inner'],'radial':.6,'kick':.3,'own':True})
X.append({'id':'shock4','t':'warp','at':round(t+.2,3),'life':.45,'att':'feet','pos':[0,.3,0],'kind':'shock','size':{'0':2,'1':18},'str':.7,'op':{'0':1,'1':0},'col':G['inner'],'glow':.03})
X.append({'id':'flash2','t':'flash','at':round(t+.06,3),'life':.22,'att':'feet','pos':[0,Y,3],'col':G['mint'],'size0':1,'size':4.2,'k':.7})
for j in range(6):   # long wind trails shooting forward
    dx=[-1.6,-.8,0,.8,1.6,0][j];dy=[.2,-.4,.6,-.4,.2,-.8][j]
    X.append({'id':f'jet{j}','t':'trail','at':round(t+j*.015,3),'life':.35,'att':'feet','pos':{'0':[dx*.2,Y+dy*.3,0],'1':[dx*4,Y+dy,22]},
        'col':[G['hi'],G['mint'],G['lime'],G['aqua'],G['hi'],G['mint']][j],'col2':G['teal'],'w':.22,'tlife':.3,'k':1.0})
X.append({'id':'shake_o','t':'screen','at':t,'life':.35,'shake':4,'other':True})
save('void_boom',X,'Void Spheres ③ หลุมดำระเบิด: ยุบเข้าเป็นจุด แล้วระเบิดใหญ่พุ่งไปข้างหน้า (คลื่นกระแทก 3 ชั้น แผ่นลม 7 แผ่น หินกระเด็น จอสั่นแรง) (เกม: ที่จุดหลุมดำ a = ทิศเล็ง)',['ingame'])

# ---------- whole skill for the studio ----------
T1=FLY+WAIT;P=[0,0,DIST]
D=[{'id':'matter','t':'use','at':0,'life':T1+.05,'att':'feet','pos':[0,0,0],'fx':'wind/void_matter'},
   
   {'id':'boom','t':'use','at':round(T1+HOLD-.1,3),'life':.8,'att':'feet','pos':[0,0,DIST+DRIFT],'fx':'wind/void_boom'}]
# 'use' layers can't follow a pos curve, so the demo copies the hole layers in and adds the forward drift to each one
def drift(p,at,life):
    def mv(v,u):   # v at hole-life fraction u → shifted forward
        return [v[0],v[1],round(v[2]+DIST+DRIFT*u,3)]
    if isinstance(p,list):
        u0=at/HOLD;u1=min(1,(at+life)/HOLD);return {'0':mv(p,u0),'1':mv(p,u1)}
    out={}
    for k,v in p.items():
        if not isinstance(v,list):out[k]=v;continue
        u=(at+float(k)*life)/HOLD;out[k]=mv(v,min(1,u))
    return out
for l in B:
    l=json.loads(json.dumps(l));l['id']='hole_'+l['id']
    if l['t']!='screen':l['pos']=drift(l.get('pos',[0,0,0]),l['at'],l.get('life',.4))
    if l['t']=='decal':l['pos']=[0,0,DIST+DRIFT/2]
    l['at']=round(l['at']+T1,3);D.append(l)
save('void_blackhole',D,'Void Spheres (หลุมดำ — แบบใหม่ผู้ใช้ 2026-10-31) ทั้งสกิล: แทงไม้ → สสารมืดพุ่ง 2.5 ม. สั่น 0.5 วิ → หลุมดำ 2.5 วิ (ดูดรัศมี 7.5 ม. หมุนวง 2.5 ม.) → ระเบิดผลักไปข้างหน้า • ตัวอย่างใน Studio',['demo'])
