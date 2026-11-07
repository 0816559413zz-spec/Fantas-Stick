"""Crown silhouette study: connected forks, no loops or woven surface yet."""
import importlib.util,json,math,random
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('base',ROOT/'tools/nature-ult-tree-gen.py')
base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
tree=base.Tree('d');rng=random.Random(71);tau=math.tau
def branch(name,points,r0,r1,col='#12442c'):
    controls=[[*p,r0+(r1-r0)*i/(len(points)-1)] for i,p in enumerate(points)]
    tree.sweep(name,controls,col=col,sides=8,steps=5,ribs=.025,surface=True)
tree.sweep('trunk',[[0,2.1,0,1.88],[0,3.3,0,1.72],[0,5.4,0,1.36],
                    [0,6.8,0,1.34],[0,8.8,0,1.58],[0,10.2,0,1.90],
                    [0,11.5,0,1.50],[0,13,0,.72],[0,14.8,0,.07]],
                    col='#12442c',sides=16,steps=6,ribs=.085,surface=True)
for k in range(9):
    a=k*tau/9+rng.uniform(-.15,.15);L=6.8+rng.random()*2.8
    pts=[(math.cos(a)*.45,3.2,math.sin(a)*.45),
         (math.cos(a+.05)*2.4,2.5,math.sin(a+.05)*2.4),
         (math.cos(a+.12)*L*.64,1.5+rng.random()*.5,math.sin(a+.12)*L*.64),
         (math.cos(a+.2)*L,.18,math.sin(a+.2)*L)]
    branch('root_'+str(k),pts,.98,.045)
    aa=a+(-1 if k%2 else 1)*.35
    branch('root_fork_'+str(k),[pts[1],pts[2],(math.cos(aa)*L*.98,.12,math.sin(aa)*L*.98)],.35,.018)
def polar(a,r,y):return (math.cos(a)*r,y,math.sin(a)*r)
def fork(name,start,a,length,rise,radius):
    # Outward continuation with a curved elbow, rather than parallel needles.
    end=(start[0]+math.cos(a)*length,start[1]+rise,start[2]+math.sin(a)*length)
    elbow=(start[0]+math.cos(a-.12)*length*.55,start[1]+rise*.68,
           start[2]+math.sin(a-.12)*length*.55)
    branch(name,[start,elbow,end],radius,.025)
    return elbow,end

# Lateral scaffold: long outward runs, short forks staggered along the parent.
for k in range(7):
    a=k*tau/7+rng.uniform(-.14,.14)
    y=10.0+(k%3)*.55
    shoulder=polar(a,3.1,y+1.5)
    joint=polar(a+.08,6.8+rng.random(),y+2.4)
    outer=polar(a+.15,11.8+rng.random()*1.6,y+3.0+rng.random()*.7)
    branch('bough_'+str(k),[(0,y,0),shoulder,joint,outer],.85,.075)
    for j,start in enumerate([joint,outer]):
        aa=a+[-.48,.30][j]
        elbow,end=fork(f'lateral_{k}_{j}',start,aa,[4.1,2.3][j],
                       [.8,.25][j]+rng.uniform(-.4,.4),[.25,.075][j])
        if j==0:
            fork(f'lateral_tip_{k}',elbow,aa-.42,2.6,.4,.10)
    # Only selected side boughs carry an ascending secondary branch.
    if k%2==0:
        elbow,end=fork(f'upper_side_{k}',shoulder,a-.18,5.7,5.0,.36)
        fork(f'upper_side_tip_{k}',elbow,a+.35,3.7,1.8,.15)
    # New upward shoots grow from the outer lateral bough, preserving its spread.
    elbow,end=fork(f'outer_riser_{k}',joint,a+.18,2.5+(k%3)*.5,
                   3.0+(k%3)*.65,.21)
    fork(f'outer_riser_fork_{k}',elbow,a-.45,2.1,1.2,.095)

# Three readable central leaders, each with forks at different heights/depths.
# No sevenfold cluster of parallel spikes starting from the same central point.
for k,(a,height,reach) in enumerate([(.35,22.8,3.6),(2.65,21.4,5.0),(4.65,20.0,4.7)]):
    p0=polar(a,.45,11.0+k*.5)
    p1=polar(a,1.3,14.2+k*.45)
    p2=polar(a+.16,reach*.72,height-2.8)
    p3=polar(a+.30,reach+1.2,height)
    branch(f'leader_{k}',[p0,p1,p2,p3],.73,.06)
    for j,(start,aa,length,rise,rad) in enumerate([
        (p1,a-.65,6.4,3.5,.36),(p2,a+.72,4.0,1.3,.23)]):
        elbow,end=fork(f'leader_fork_{k}_{j}',start,aa,length,rise,rad)
        fork(f'leader_twig_{k}_{j}',elbow,aa-.47,2.6,.9,rad*.42)
    # More crown detail attached high on existing leaders, not extra trunk spikes.
    elbow,end=fork(f'crown_fork_{k}',p2,a-.60,3.4,2.1,.19)
    fork(f'crown_twig_{k}',elbow,a-.98,2.0,1.15,.08)
    fork(f'crown_tip_{k}',p3,a+.86,1.9,1.0,.06)
# Lengthen the trunk's exposed body, leaving roots and crown proportions intact.
# The same continuous height warp keeps every branch junction connected.
for part in tree.parts:
    if part['id'].startswith('root_'):
        continue
    for vertex in part['v']:
        vertex[1]=round(vertex[1]+3.2*min(1,max(0,(vertex[1]-3.3)/5.7)),5)

data=dict(v=1,desc='Unapproved taller-body scaffold: raised roots and unchanged spreading crown proportions; no foliage, fibres or gameplay binding.',pal='nature',mat='solid',smooth=True,bark=False,parts=tree.parts)
(ROOT/'assets/fx/mesh/nature_ult_tree_scaffold_v1.mesh.json').write_text(json.dumps(data,separators=(',',':'))+'\n',encoding='utf-8')
print('scaffold',sum(sum(len(f)-2 for f in p['f']) for p in tree.parts),'triangles')
