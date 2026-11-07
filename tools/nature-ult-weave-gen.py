"""Unapproved dark-green woven-energy tree study. Does not overwrite A/B/C."""
import json, math, importlib.util
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('tree_base',ROOT/'tools/nature-ult-tree-gen.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
tree=module.Tree('d');tau=math.tau
for k in range(96):
    a=(k//8)*tau/12+(k%8-3.5)*.055
    path=[]
    # Large roots rise above the ground before flowing into the upright trunk.
    for j in range(12):
        u=j/11;r=(8.2+1.7*math.sin((k//8)*2.7)+.2*math.sin(k*4))*(1-u)+2.55*u;ang=a+u*1.15
        path.append([math.cos(ang)*r*(1.65-.65*u),4*u+(1.8+.2*math.sin(k))*math.sin(u*math.pi),math.sin(ang)*r*(.70+.30*u),.015+.065*u])
    for j in range(1,45):
        u=j/44;top=max(0,(u-.40)/.60);y=4+u*24+top*(2.5*math.sin((k//8)*2.4))
        ang=a+1.15+min(u,.61)*tau*(2.15 if k%4 else -1.65)+.20*math.sin(u*13+k)
        r=2.25-.85*math.exp(-((u-.38)/.19)**2)+.17*math.sin(u*15+k)
        x,z=math.cos(ang)*r,math.sin(ang)*r
        if top>0:
            group=k//8;branch=group*tau/12+.22*math.sin(group*2.1)
            length=8.5+1.8*math.sin(group*2.4)
            # Strands gather into a shared bough, then fork from that bough.
            twig=max(0,(top-.52)/.48);fork=(k%8-3.5)/3.5
            reach=1.7+length*math.sin(top*math.pi/2)
            bx=math.cos(branch)*reach+math.cos(branch+fork*.9)*twig*2.2
            bz=math.sin(branch)*reach+math.sin(branch+fork*.9)*twig*2.2
            blend=min(1,top/.30);blend=blend*blend*(3-2*blend)
            x=x*(1-blend)+bx*blend;z=z*(1-blend)+bz*blend
            y+=twig*fork*.9
        path.append([x,y,z,(.055+.022*math.sin(k*2.3))*(1-u*.7)+.007])
    palette=['#010c05','#031c0d','#052b12','#020f08','#0b3c1a','#0b3116','#246d25','#03190b']
    tree.sweep(f'dark_weave_{k}',path,col=palette[k%8],sides=5,steps=1,ribs=.015,surface=True,emit=.12 if k%8==6 else .01)
# Larger continuous core reaching the top, woven into branches rather than a floating gem.
for k in range(12):
    path=[]
    for j in range(40):
        u=j/39;top=max(0,(u-.49)/.51);y=.15+u*28;ang=k*tau/12+min(u,.65)*tau*2.5
        r=.3+1.2*math.sin(u*math.pi)**.7-.35*math.exp(-((u-.4)/.17)**2)
        branch=k*tau/12+.22*math.sin(k*2.1);reach=1.7+(8.5+1.8*math.sin(k*2.4))*math.sin(top*math.pi/2)
        blend=min(1,top/.35);blend=blend*blend*(3-2*blend)
        x=(1-blend)*math.cos(ang)*r+blend*math.cos(branch)*reach
        z=(1-blend)*math.sin(ang)*r+blend*math.sin(branch)*reach
        path.append([x,y,z,(.11+.14*math.sin(u*math.pi))*(1-.85*max(0,(u-.7)/.3))])
    tree.sweep(f'heart_to_crown_{k}',path,col=['#12682c','#38a93d','#71d854'][k%3],sides=5,steps=1,ribs=.015,surface=True,emit=[.4,.6,.75][k%3])
    for side in [-1,1]:
        start=path[24 if side<0 else 30]
        direction=k*tau/12+.22*math.sin(k*2.1)+side*.85
        fork=[]
        for j in range(13):
            v=j/12;length=3.1*v
            fork.append([start[0]+math.cos(direction)*length,
                         start[1]+2*v+3.5*v*v,
                         start[2]+math.sin(direction)*length,
                         .10*(1-v)**.8+.002])
        tree.sweep(f'crown_fork_{k}_{side}',fork,col='#2c8d34',sides=5,steps=1,ribs=0,surface=True,emit=.35)
        for twig_side in [-1,1]:
            start2=fork[7];direction2=direction+twig_side*.7;twig=[]
            for j in range(9):
                v=j/8
                twig.append([start2[0]+math.cos(direction2)*v*2.4,
                             start2[1]+v*2.6+v*v*.5,
                             start2[2]+math.sin(direction2)*v*2.4,.05*(1-v)+.002])
            tree.sweep(f'twig_{k}_{side}_{twig_side}',twig,col='#1d5a2a',sides=5,steps=1,ribs=0,surface=True,emit=.15)
data=dict(v=1,desc='Unapproved woven dark-green energy tree: upright, tall, raised roots and continuous core to crown. Static model only.',pal='nature',mat='solid',smooth=True,bark=False,parts=tree.parts)
dest=ROOT/'assets/fx/mesh/nature_ult_tree_weave.mesh.json';dest.write_text(json.dumps(data,separators=(',',':'))+'\n',encoding='utf-8')
print(dest.name,sum(sum(len(f)-2 for f in p['f']) for p in tree.parts),'triangles')
