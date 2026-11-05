"""Studio-only Moonwater end studies. Not bound to gameplay."""
import copy
import json
import math
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FX=ROOT/'assets/fx'
base=json.loads((FX/'start/hit.fx.json').read_text(encoding='utf-8'))

def save(path,data):
    path.write_text(json.dumps(data,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')

parts=[]
for i in range(8):
    a=i*math.tau/8
    points=[]
    for j in range(7):
        u=j/6
        angle=a+u*.32
        radius=.08+(.7+.24*math.sin(i*2.7)**2)*u
        points.append([round(math.cos(angle)*radius,4), round(math.sin(angle)*radius,4),round(-.34*u*u,4)])
    parts.append(dict(id=f'spray_arm_{i}',k='tube',path=points,r0=.075,r1=.006,sides=6,seg=14))
save(FX/'mesh/water_moon_impact_fan.mesh.json',dict(v=1,desc='Moonwater ร่างปลายน้ำสาดกระแทก บานออกและสะบัดย้อน',mat='solid',pal='ice',tags=['water','preview'],parts=parts))
save(FX/'mesh/water_moon_end_wall.mesh.json',dict(v=1,desc='ผนังสาธิตจุดน้ำกระแทกใน Studio เท่านั้น',mat='solid',pal='earth',tags=['preview'],parts=[dict(id='wall',k='box',w=3.8,h=3,d=.15)]))

# Full-width body with an uneven torn edge; the spray carries on beyond it.
vertices=[]
faces=[]
sides=20
rows=40
for j in range(rows+1):
    u=j/rows
    edge=max(0,(u-.76)/.24)**2
    for i in range(sides):
        a=i*math.tau/sides
        r=.18*(1+.06*edge*math.sin(a*5+u*13))
        z=u*4.8+edge*(.19*math.sin(a*5)+.12*math.sin(a*9+.4))
        vertices.append([round(math.cos(a)*r,5),round(math.sin(a)*r,5),round(z,5)])
for j in range(rows):
    for i in range(sides):
        a=j*sides+i
        b=j*sides+(i+1)%sides
        faces.append([a,b,b+sides,a+sides])
free_parts=[dict(id='full_width_water',k='poly',v=vertices,f=faces,flat=False)]
for i in range(8):
    pts=[]
    for j in range(13):
        u=j/12
        a=i*2.4+u*.75
        r=.12+.38*u
        pts.append([round(math.cos(a)*r,4),round(math.sin(a)*r-.22*u*u,4),round(4.15+u*(4.6+(i%3)*.4),4)])
    free_parts.append(dict(id=f'water_thread_{i}',k='tube',path=pts,r0=.055,r1=.008,sides=6,seg=32))
save(FX/'mesh/water_moon_free_breakup.mesh.json',dict(v=1,desc='ลำน้ำหนาคงเดิม ปลายแตกขอบไม่เสมอกันและสาดยาวเป็นสายน้ำ',mat='solid',pal='ice',tags=['water','preview'],parts=free_parts))

water=dict(t='mesh',att='feet',mat='toonwater',col='#8de6ff',col2='#269edc',rim=.15,scroll=6,int=.8,fade=0)
incoming=dict(water,id='incoming_context',at=0,life=.62,shape='beam',pos=[0,1.35,1],scale=[.18,.18,5],op={'0':0,'.08':1,'.88':1,'1':0})

def spray(i,impact=False):
    a=i*math.tau/(8 if impact else 6)
    path={}
    for j in range(9):
        u=j/8
        r=.1+(1 if impact else .65)*u
        z=6-(.45*u*u) if impact else 5.1+u*5.8
        path[f'{u:.3f}']=[round(math.cos(a+u*.3)*r,4),round(1.35+math.sin(a+u*.3)*r-u*u*.3,4),round(z,4)]
    return dict(id=f'peeling_water_{i}',t='trail',att='feet',at=.02+(i%3)*.015,life=.48,pos=path,w=.075 if impact else .075,tlife=.14 if impact else .2,k=.8,col='#d2faff',col2='#38b5e5')

for impact,name in [(False,'moon_end_free_study'),(True,'moon_end_hit_study')]:
    if '--free' in sys.argv and impact: continue
    layers=[copy.deepcopy(incoming)]
    if not impact:
        layers[0]=dict(water,id='unbroken_water_to_filaments',at=0,life=.62,shape='model',model='water_moon_free_breakup',pos=[0,1.35,1],scale=1,disp=.15,op={'0':0,'.08':1,'.88':1,'1':0})
    layers += [spray(i,impact) for i in range(8 if impact else 6)]
    layers.append(dict(id='droplet_spray',t='emit',att='feet',at=.03,life=.48,pos=[0,1.35,6 if impact else 5.2],rate=90 if impact else 100,**{'from':'sphere'},fr=.15,dir='random' if impact else 'aim',spread=.38,speed=[3,7] if impact else [7,13],plife=[.15,.3],look='streak',size=[.7,1.4],col='#d4faff',c2='#4cc7ea',gravity=7,drag=.5))
    if impact:
        layers += [
            dict(id='wall_context',t='mesh',att='feet',at=0,life=.85,shape='model',model='water_moon_end_wall',mat='solid',col='#637482',pos=[0,1.5,6.65],scale=1,op=1,fade=0),
            dict(water,id='water_fan',at=.01,life=.57,shape='model',model='water_moon_impact_fan',pos=[0,1.35,6],scale={'0':.15,'.2':1,'.75':1.15,'1':1.3},op={'0':0,'.12':1,'.8':.85,'1':0}),
            dict(water,id='impact_water',at=0,life=.57,shape='sphere',pos=[0,1.35,6],scale=[.23,.23,.12],op={'0':0,'.12':1,'.8':.9,'1':0}),
            dict(id='foam_splash',t='mesh',att='feet',at=.015,life=.48,shape='plane',mat='tex',tex='tex/water_splash_flakes',col='#bfefff',col2='#000000',rim=0,pos=[0,1.35,6.1],scale={'0':.2,'.25':1.7,'1':2.2},op={'0':0,'.15':.7,'.7':.6,'1':0},fade=0,int=.9),
        ]
    else:
        for i in range(7):
            a=i*2.4
            x=math.cos(a)*(.1+i*.025)
            y=1.35+math.sin(a)*.2
            z=6.1+i*.52
            layers.append(dict(water,id=f'separated_drop_{i}',at=.015*(i%4),life=.53,shape='sphere',pos={'0':[x,y,z],'1':[x*2,y-.25,z+1.5]},scale={'0':[.03,.03,.1],'.3':[.045,.04,.15],'1':[.008,.008,.04]},op={'0':0,'.12':.8,'.7':.8,'1':0}))
    data=copy.deepcopy(base)
    data.update(desc='ร่างปลาย Moonwater: '+('ชนเป้า น้ำบานย้อนเป็นพัด' if impact else 'สุดระยะ เส้นน้ำคลายแตกเป็นละออง'),pal='ice',dur=.85,seed=53,tags=['water','moon','preview'],layers=layers)
    save(FX/f'water/{name}.fx.json',data)
    print(name,len(layers),'layers')
