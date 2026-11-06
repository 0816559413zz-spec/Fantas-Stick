"""Studio wall r7: attached foliage motifs and wooden thorns from the reference.
Uses numpy surface nets; editable poly, no binding or gameplay changes.
"""
import json, math, random
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
R=random.Random(1703)
parts=[];curves=[]

def smooth(points,steps=5):
    p=np.asarray(points,dtype=float);q=np.vstack([p[0],p,p[-1]]);out=[]
    for j in range(len(p)-1):
        a,b,c,d=q[j:j+4]
        for k in range(steps):
            t=k/steps
            out.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t))
    out.append(p[-1]);return np.asarray(out)

def wood(points,radii):
    points=smooth(points)
    radii=np.interp(np.linspace(0,1,len(points)),np.linspace(0,1,len(radii)),radii)
    curves.append((points,radii));return points

def tube(name,path,r0,r1,seg=12,sides=6,col='#8b704c'):
    parts.append(dict(id=name,k='tube',path=np.round(path,4).tolist(),r0=r0,r1=r1,
        seg=seg,sides=sides,curve=1.3,noise=.006,nfreq=3,seed=len(parts)+11,col=col))

def leaf(name,base,direction,length,width,col=None,thin=False):
    # Curved lanceolate leaf with a folded midrib and a thin lower skin.
    base=np.asarray(base,dtype=float);ax=np.asarray(direction,dtype=float);ax/=np.linalg.norm(ax)
    sd=np.array([ax[1],-ax[0],0]);sd/=max(np.linalg.norm(sd),1e-5);nm=np.cross(sd,ax)
    curl=R.uniform(.08,.19)*length;skew=R.uniform(-.12,.12)*length
    v=[];rows=[0,.48,1]
    for skin in [1,-1]:
        for t in rows:
            centre=base+ax*length*t+nm*curl*t*t+sd*skew*math.sin(math.pi*t)
            w=width*(.025+.975*math.sin(math.pi*t)**.8)
            for edge in [-1,0,1]:
                height=(.035*length if edge==0 else 0)+skin*(.0012 if thin else .004)
                v.append(np.round(centre+sd*w*edge+nm*height,4).tolist())
    f=[]
    for j in range(2):
        for k in range(2):
            a=j*3+k;f.append([a,a+1,a+4,a+3])
            a+=9;f.append([a+3,a+4,a+1,a])
    if not thin:
        for j in range(2):
            a=j*3;f.append([a,a+3,a+12,a+9]);a+=2;f.append([a+9,a+12,a+3,a])
        f.extend([[0,9,10,1],[1,10,11,2],[6,7,16,15],[7,8,17,16]])
    parts.append(dict(id=name,k='poly',v=v,f=f,sub=0,flat=False,
        col=col or R.choice(['#3d7034','#4e8436','#639243','#35643a','#769e4a'])))


def sprig(name,base,lean,length=.5,pairs=2,thin=False):
    # All leaves are attached to one visible twig, growing in coherent pairs.
    base=np.asarray(base,dtype=float);lean=np.asarray(lean,dtype=float)
    lean/=max(np.linalg.norm(lean),1e-5)
    tip=base+lean*length
    mid=base+lean*length*.48+np.array([0,.05,0])
    root=base-np.array([0,.16,0]) if thin and name.endswith('_leader') else base
    thickness=.024 if thin and name.endswith('_leader') else (.017 if thin else .014)
    tube(name+'_stem',[root,mid,tip],thickness,.004,seg=5,sides=4,col='#667644')
    lateral=np.array([lean[1],-lean[0],0]);lateral/=max(np.linalg.norm(lateral),1e-5)
    palette=R.choice([['#3c7036','#54823b','#6e9445'],['#39633b','#487747','#628c4b']])
    for j in range(pairs):
        t=(.22+j*.50/max(1,pairs-1)) if thin else .25+j*.27
        node=base+lean*length*t+np.array([0,.025,0])
        for side in [-1,1]:
            direction=lean*.45+lateral*side*.8+np.array([0,.16,R.uniform(-.16,.16)])
            ll=length*R.uniform(.51,.67)*(1-j*.14)
            leaf(f'{name}_leaf_{j}_{side}',node,direction,ll,ll*R.uniform(.21,.3),R.choice(palette),thin=thin)
    ll=length*(.43 if thin else .57)
    leaf(name+'_tip',tip-lean*.05,lean,ll,ll*.26,palette[-1],thin=thin)

# Dense living wood wall: narrow crooked boughs merge with a woody core.
# The core closes oversized see-through cells; front/back branches retain depth.
xs=[-5.15+j*.645+R.uniform(-.045,.045) for j in range(17)];stems=[]
for j,x in enumerate(xs):
    phase=R.uniform(0,math.tau)
    bend=R.uniform(.17,.31)
    depth=R.uniform(-.14,.14)
    top=R.uniform(3.09,3.31)
    points=[]
    for k,y in enumerate([0,.44,1.04,1.65,2.25,2.82,top]):
        points.append([x+bend*math.sin(y*3.2+phase),y,
                       depth+.11*math.sin(y*2.6+phase)])
    # Rounded returning branch end, hidden among the crown leaves.
    dr=R.choice([-1,1])
    points.extend([[points[-1][0]+dr*.25,top+.03,depth],
                   [points[-1][0]+dr*.40,top-.29,depth-.03]])
    stems.append(wood(points,[.26,.25,.23,.25,.22,.21,.18,.15,.12]))
# Non-repeating forks connect across several neighbours at different heights.
for j in range(15):
    a=j;b=min(16,j+R.choice([1,2,3]))
    p=stems[a][R.randrange(6,25)].copy()
    q=stems[b][R.randrange(12,33)].copy()
    mid=(p+q)*.5
    mid[1]+=R.uniform(-.23,.23);mid[2]=R.choice([-1,1])*R.uniform(.20,.33)
    wood([p,p*.6+mid*.4,mid,q*.6+mid*.4,q],[.13,.17,.16,.15,.12])
# Root forks grow out of the parent root at early and middle junctions.
for j,x in enumerate(xs):
    for side in [-1,1]:
        reach=R.uniform(1.3,2.15);drift=R.uniform(-.6,.6)
        path=[[x,.14,side*.12],[x+drift*.25,.065,side*.42],
              [x+drift*.7+R.uniform(-.16,.16),.045,side*reach*.5],
              [x+drift-R.uniform(-.16,.16),.025,side*reach*.8],
              [x+drift+R.uniform(-.14,.14),.012,side*reach]]
        tube(f'ground_root_{j}_{side}',path,R.uniform(.065,.09),.004,seg=10,sides=5,col=R.choice(['#604a34','#705238','#7a5c3d']))
        for fork,index in enumerate([1,2]):
            start=np.asarray(path[index]);parent=np.asarray(path[index+1])-start
            theta=math.atan2(parent[2],parent[0])+R.choice([-1,1])*R.uniform(.55,1.0)
            direction=np.array([math.cos(theta),0,math.sin(theta)])
            ll=R.uniform(.48,.88);middle=start+direction*ll*.5+np.array([-.08,0,.05])
            end=start+direction*ll;middle[1]=max(.025,start[1]*.62);end[1]=.009
            tube(f'root_side_branch_{j}_{side}_{fork}',[start,middle,end],.032 if index==1 else .023,.003,seg=6,sides=4,col='#705337')
            if j%2==0:
                split=middle.copy();tt=theta+R.uniform(-.8,.8)
                tip=split+np.array([math.cos(tt)*.36,0,math.sin(tt)*.36]);tip[1]=.007
                tube(f'root_twigs_{j}_{side}_{fork}',[split,(split+tip)*.5,tip],.012,.002,seg=5,sides=4,col='#6c5036')
for side,x in [(-1,xs[0]),(1,xs[-1])]:
    for k in range(3):
        tube(f'end_root_{side}_{k}',[[x,.12,0],[x+side*.35,.055,(k-1)*.3],
             [x+side*.85,.025,(k-1)*.55],[x+side*1.3,.009,(k-1)*.8]],.065,.003,seg=12,sides=6,col='#73502d')

# Smooth union of curved wood volumes, sampled on a bounded voxel grid.
step=.18;origin=np.array([-6.9,-.42,-2.6])
axes=[np.arange(origin[i],end+step*.5,step) for i,end in enumerate([6.9,3.95,2.6])]
gx,gy,gz=np.meshgrid(*axes,indexing='ij')
crown=3.03+.09*np.sin(gx*1.5)+.06*np.sin(gx*4.1)
core_depth=.125+.026*np.sin(gx*3.1+gy*4.7)
field=np.minimum.reduce([5.36-np.abs(gx),gy+.06,crown-gy,
                         core_depth-np.abs(gz+.02)]).astype(np.float32)
for path,radii in curves:
    lo=np.maximum(0,np.floor((path.min(axis=0)-radii.max()-.22-origin)/step).astype(int))
    hi=np.minimum(np.array(field.shape)-1,np.ceil((path.max(axis=0)+radii.max()+.22-origin)/step).astype(int))
    sl=tuple(slice(int(lo[i]),int(hi[i])+1) for i in range(3))
    points=np.stack(np.meshgrid(*(axes[i][sl[i]] for i in range(3)),indexing='ij'),axis=-1)
    shape=np.full(points.shape[:-1],-9,dtype=np.float32)
    for j in range(len(path)-1):
        a,b=path[j],path[j+1];ab=b-a;den=max(np.dot(ab,ab),1e-9)
        t=np.clip(np.sum((points-a)*ab,axis=-1)/den,0,1)
        dist=np.linalg.norm(points-(a+t[...,None]*ab),axis=-1)
        shape=np.maximum(shape,radii[j]*(1-t)+radii[j+1]*t-dist)
    old=field[sl];h=np.maximum(.1-np.abs(old-shape),0)/.1
    field[sl]=np.maximum(old,shape)+h*h*.025

# Surface nets: one shared vertex per crossing cell, connected quad topology.
corners=[(0,0,0),(1,0,0),(0,1,0),(1,1,0),(0,0,1),(1,0,1),(0,1,1),(1,1,1)]
edges=[(0,1),(2,3),(4,5),(6,7),(0,2),(1,3),(4,6),(5,7),(0,4),(1,5),(2,6),(3,7)]
shape=np.array(field.shape)-1
values=[field[a:a+shape[0],b:b+shape[1],c:c+shape[2]] for a,b,c in corners]
active=(np.minimum.reduce(values)<0)&(np.maximum.reduce(values)>=0)
acc=np.zeros((*shape,3));count=np.zeros(shape,dtype=np.int32)
for a,b in edges:
    va,vb=values[a],values[b];mask=(va>=0)!=(vb>=0)
    t=np.divide(va,va-vb,out=np.zeros_like(va),where=mask)
    offset=np.asarray(corners[a])+t[...,None]*(np.asarray(corners[b])-corners[a])
    acc+=offset*mask[...,None];count+=mask
ijk=np.argwhere(active);vertices=origin+(ijk+acc[active]/count[active,None])*step
ids=np.full(shape,-1,dtype=np.int32);ids[active]=np.arange(len(ijk));faces=[]
for axis in range(3):
    s1=[slice(None)]*3;s2=[slice(None)]*3;s1[axis]=slice(0,-1);s2[axis]=slice(1,None)
    changes=(field[tuple(s1)]>=0)!=(field[tuple(s2)]>=0)
    for i,j,k in np.argwhere(changes):
        if axis==0:cells=[(i,j-1,k-1),(i,j,k-1),(i,j,k),(i,j-1,k)]
        elif axis==1:cells=[(i-1,j,k-1),(i-1,j,k),(i,j,k),(i,j,k-1)]
        else:cells=[(i-1,j-1,k),(i,j-1,k),(i,j,k),(i-1,j,k)]
        if any(any(p[d]<0 or p[d]>=shape[d] for d in range(3)) for p in cells):continue
        face=[int(ids[p]) for p in cells]
        if min(face)<0:continue
        if field[i,j,k]<0:face.reverse()
        faces.append(face)
# Discard tiny isolated voxel islands, retaining one connected primary surface.
parent=list(range(len(vertices)))
def find(a):
    while parent[a]!=a:parent[a]=parent[parent[a]];a=parent[a]
    return a
for face in faces:
    for a in face[1:]:parent[find(a)]=find(face[0])
labels=np.array([find(i) for i in range(len(vertices))])
groups,counts=np.unique(labels,return_counts=True);keep=labels==groups[np.argmax(counts)]
remap=np.full(len(vertices),-1,dtype=int);remap[keep]=np.arange(np.sum(keep))
faces=[[int(remap[i]) for i in f] for f in faces if all(keep[i] for i in f)]
vertices=vertices[keep]
parts.insert(0,dict(id='fused_living_wood',k='poly',v=np.round(vertices,4).tolist(),f=faces,sub=0,flat=False,col='#69503a'))
# Raised surface boughs retain individual woody strands over the dense core.
# Their irregular shared-endpoint paths include both ascending and cross forks.
for j,(path,radii) in enumerate(curves):
    q=path[::3].copy()
    if len(q)<3:continue
    q[:,2]+=.42
    radius=float(np.median(radii))*.90
    tube(f'raised_bough_{j}',q,radius,max(.055,radius*.77),seg=14 if j<17 else 12,
         sides=7,col=R.choice(['#71573e','#806345','#624b35','#8b6b48','#5b4635']))
    parts[-1]['noise']=.018
# Reference-led foliage: low attached fans at growth nodes, not seedlings.
# Motifs repeat deliberately (five-leaf crown / three-leaf connector), but are
# positioned from the actual crooked boughs rather than a regular spacing grid.
def crest(x):
    ix=int(np.clip(round((x-origin[0])/step),0,field.shape[0]-1))
    profile=field[ix].max(axis=1);top=np.flatnonzero(profile>=0)
    if not len(top):return np.array([x,3.02,0])
    k=int(top[-1]);frac=profile[k]/(profile[k]-profile[k+1]) if k+1<len(profile) else 0
    y=origin[1]+(k+frac)*step
    z=axes[2][int(np.argmax(field[ix,k]))]
    return np.array([x,y-.035,z])


def leaf_motif(name,base,side=1,count=5,vertical=False,scale=1):
    base=np.asarray(base,dtype=float)
    tube(name+'_creeping_twig',[base+[-.11,-.045,0],base,base+[.12,-.02,side*.025]],
         .015,.005,seg=5,sides=4,col='#607644')
    angles=[-1.08,-.54,0,.54,1.08] if count==5 else [-.82,0,.82]
    lengths=[.22,.27,.30,.27,.22] if count==5 else [.235,.285,.235]
    palette=['#477535','#5c8a3d','#6c9746','#558439','#3f7035']
    for k,(angle,ll) in enumerate(zip(angles,lengths)):
        if vertical:direction=[math.sin(angle)*.8,-math.cos(angle)*.75,.16]
        else:direction=[math.sin(angle)*.8,-.14,side*math.cos(angle)*.9]
        origin_leaf=base+np.array([math.sin(angle)*.025,.008,side*.012])
        leaf(f'{name}_leaf_{k}',origin_leaf,direction,ll*scale,ll*.36*scale,
             palette[k if count==5 else k+1],thin=True)


def thorn(name,base,direction,length,radius):
    base=np.asarray(base,dtype=float);axis=np.asarray(direction,dtype=float)
    axis/=np.linalg.norm(axis)
    bend=np.array([.045 if axis[0]>=0 else -.045,0,.02])
    path=[base-axis*.055,base+axis*length*.30,
          base+axis*length*.72+bend,base+axis*length+bend*.7]
    tube(name,path,radius,.0015,seg=9,sides=7,col='#775438')
    parts[-1]['curve']=.72;parts[-1]['noise']=.003

# Crown motifs hug the crest and sit around the bases of selected wood thorns.
for j,p in enumerate(stems):
    anchor=crest(float(p[30][0]))
    leaf_motif(f'crown_motif_{j}',anchor+[0,.025,.075],side=1,
               count=5 if j%2==0 else 3,scale=1.04 if j%2==0 else .94)
    if j%2==0:
        leaf_motif(f'crown_back_motif_{j}',anchor+[0,.018,-.07],side=-1,count=3,scale=.92)
        thorn(f'crown_wood_thorn_{j}',anchor+[0,-.015,0],
              [(.26 if j%4 else -.30),.95,.18],.30+.12*((j//2)%3)/2,.10)
# Upper-middle thorns project out of bough forks, with small attached leaf fans.
for j in [1,4,7,10,13,15]:
    anchor=stems[j][22].copy();anchor[2]+=.56
    thorn(f'upper_wood_thorn_{j}',anchor,[.3 if j%2 else -.28,.65,1],
          .28+.06*(j%3),.095)
    leaf_motif(f'upper_joint_motif_{j}',anchor+[0,-.065,.035],count=3,
               vertical=True,scale=.90)

for j in [1,5,9,13,16]:
    sprig(f'ground_sprig_{j}',[xs[j],.09,.5],[R.uniform(-.6,.6),.8,.4],length=.34,pairs=1)
# Bend every component with one shared arc. Ends return toward local -Z,
# the caster's side when the wall is placed in front. Radius is only a study.
arc_radius=18.0
for part in parts:
    if part['id'].startswith(('ground_root','root_side','root_twigs','end_root')):part['noise']=.0015
    if part['id']=='fused_living_wood':
        part['uv']=[[round(v[0]*.7,5),round(v[1]*.3,5)] for v in part['v']]
    for key in ['v','path']:
        if key not in part:continue
        for v in part[key]:
            x=v[0];angle=x/arc_radius
            v[0]=round(arc_radius*math.sin(angle),4)
            v[2]=round(v[2]+arc_radius*(math.cos(angle)-1),4)

dest=ROOT/'assets/fx/mesh/nature_wood_wall_study.mesh.json'
dest.write_text(json.dumps(dict(v=1,desc='Nature กำแพงไม้ r7: ใบเกาะแนบตามข้อไม้เป็นกลุ่ม หนามไม้บนยอดและช่วงบนของผนัง; ร่างรอรีวิว',
    mat='solid',pal='earth',smooth=True,bark=True,tags=['nature','wood','wall','study'],parts=parts),ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
print(f'{dest.name}: fused body {len(vertices)} verts/{len(faces)} quads; {len(parts)} editable parts')
