"""Angular wind-wing silhouette study. Studio-only; no gameplay binding."""
import copy
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MESH = ROOT / 'assets/fx/mesh'
SPAN = .75
RISE = .85
FLAP_CYCLE = 1.6
HINGE_X = .18 * SPAN
HINGE_Y = .12 * RISE


def save(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


# One long, slim angular vane per side. Detail stays on the vane or just below its edge.
VANES = [
    [[.18,.14],[.82,.48],[3.65,1.51],[2.62,.73],[1.08,.20],[.28,.02]],
]


def depth(x, y):
    return -.11 * x - .035 * abs(y)


HINGE_Z = depth(.18, .12) * SPAN


def flap_angle(k):
    # Smooth, stronger downstroke followed by a slower recovery.
    if k <= .38:
        u=k/.38
        return 18+(-40-18)*(u*u*(3-2*u))
    u=(k-.38)/.62
    return -40+(18+40)*(u*u*(3-2*u))


def flap_point(side, x, y):
    """Keep tip and underside particle sources on the rotating shoulder-hinged wing."""
    curve={}
    for k in sorted(set([i/40 for i in range(41)]+[.38])):
        a=math.radians(flap_angle(k));c=math.cos(a);s=math.sin(a)
        dx=x*SPAN-HINGE_X;dy=y*RISE-HINGE_Y
        curve[str(round(k,4))]=[
            round(side*(HINGE_X+dx*c-dy*s),5),
            round(1.5+HINGE_Y+dx*s+dy*c,5),
            round(-.22+depth(x,y)*SPAN,5),
        ]
    return curve


def poly_part(name, points, lift=0, thick=False):
    n = len(points)
    cx = sum(p[0] for p in points) / n
    cy = sum(p[1] for p in points) / n
    v = [[x,y,depth(x,y)+lift] for x,y in points]
    v.append([cx,cy,depth(cx,cy)+lift+(.055 if thick else .008)])
    f = [[n,i,(i+1)%n] for i in range(n)]
    if thick:
        v += [[x,y,depth(x,y)-.025] for x,y in points]
        v.append([cx,cy,depth(cx,cy)-.035])
        for i in range(n):
            j=(i+1)%n
            f += [[2*n+1,n+1+j,n+1+i],[i,n+1+i,n+1+j,j]]
    return {'id':name,'k':'poly','v':v,'f':f,'flat':True}


def stroke(name, pts, width, lift=.085):
    v=[]
    for i,(x,y) in enumerate(pts):
        a=pts[max(0,i-1)]; b=pts[min(len(pts)-1,i+1)]
        dx=b[0]-a[0]; dy=b[1]-a[1]; d=max(.0001,(dx*dx+dy*dy)**.5)
        w=width*(1-.88*i/(len(pts)-1))
        v.extend([[x-dy/d*w,y+dx/d*w,depth(x,y)+lift],
                  [x+dy/d*w,y-dx/d*w,depth(x,y)+lift]])
    return {'id':name,'k':'poly','v':v,
            'f':[[2*i,2*i+1,2*i+3,2*i+2] for i in range(len(pts)-1)],'flat':True}


def recipe(name, parts, material):
    if name.startswith('wind_wing_angular_'):
        parts=copy.deepcopy(parts)
        for part in parts:
            part['v']=[[x*SPAN-HINGE_X,y*RISE-HINGE_Y,z*SPAN-HINGE_Z] for x,y,z in part['v']]
    save(MESH / (name+'.mesh.json'), {'v':1,'desc':name,'mat':material,
                                    'pal':'wind','tags':['wind','wing','study'],'parts':parts})
    if name.startswith('wind_wing_angular_'):
        mirrored=copy.deepcopy(parts)
        for part in mirrored:
            part['v']=[[-x,y,z] for x,y,z in part['v']]
            part['f']=[list(reversed(face)) for face in part['f']]
        save(MESH / (name+'_L.mesh.json'), {'v':1,'desc':name+' left wing','mat':material,
                                         'pal':'wind','tags':['wind','wing','study'],'parts':mirrored})


body=[]; flow=[]; spines=[]; fractures=[]; feathers=[]; accents=[]
for i,p in enumerate(VANES):
    body.append(poly_part('vane_'+str(i),p,thick=True))
    cx=sum(v[0] for v in p)/len(p); cy=sum(v[1] for v in p)/len(p)
    inset=[[cx+(x-cx)*.88,cy+(y-cy)*.68] for x,y in p]
    flow.append(poly_part('flow_'+str(i),inset,.073))
    # Straight segmented leading seams, with light deliberately confined to narrow areas.
    spines.append(stroke('leading_'+str(i),[p[0],p[1],p[2]],.017,.10))
    if i<3:
        tip=p[2]
        spines.append(stroke('inner_'+str(i),[[cx-.30,cy-.05],[cx+.25,cy+.03],[tip[0]-.20,tip[1]-.08]],.018,.104))
        fractures.append(stroke('split_'+str(i),[[cx-.16,cy-.15],[cx+.19,cy-.05],[cx+.45,cy+.11]],.013,.11))

# Fine direction lines and inset facets enrich this one silhouette, without adding tiers.
spines.append(stroke('inner_channel',[[.68,.27],[1.10,.42],[1.82,.66],[2.74,1.09],[3.45,1.42]],.013,.105))
spines.append(stroke('root_seam',[[.29,.12],[.63,.25],[.93,.30]],.012,.106))
for i,x in enumerate([1.0,1.34,1.68,2.02,2.36,2.68]):
    low=.20+(x-1.08)*.344
    high=.48+(x-.82)*.364
    fractures.append(stroke('fine_cut_'+str(i),[[x,low+.025],[x+.10,low+.095],[x+.23,high-.025]],.009,.113))
    if i%2==0:
        spines.append(stroke('short_glint_'+str(i),[[x+.06,low+.07],[x+.17,low+.13]],.009,.116))

# Broken hairline airflow under the lower edge; these are thin traces, not another wing.
for i,pts in enumerate([
    [[.62,.035],[.86,.09],[1.03,.13]],
    [[1.18,.14],[1.43,.23],[1.68,.32]],
    [[1.86,.34],[2.07,.43],[2.32,.55]],
    [[2.48,.62],[2.67,.75],[2.80,.88]],
]):
    spines.append(stroke('under_air_'+str(i),pts,.008,.07))

# Short overlapping air-feathers articulate the lower edge of ONE wing silhouette.
# Their roots sit in the wing; only the small staggered tips extend beneath it.
FEATHERLETS = [
    [[.39,.16],[.68,.26],[1.02,.08],[.58,-.06]],
    [[.65,.25],[1.03,.38],[1.48,.12],[.94,.04]],
    [[1.00,.38],[1.37,.50],[1.96,.30],[1.30,.17]],
    [[1.37,.49],[1.74,.64],[2.38,.51],[1.72,.31]],
    [[1.77,.64],[2.12,.79],[2.73,.76],[2.08,.51]],
    [[2.15,.81],[2.48,.98],[3.03,1.02],[2.45,.70]],
]
for i,p in enumerate(FEATHERLETS):
    feathers.append(poly_part('air_feather_'+str(i),p,.115))
    start=[(p[0][0]+p[1][0])*.5,(p[0][1]+p[1][1])*.5]
    tip=p[2]
    spines.append(stroke('feather_vein_'+str(i),[start,[tip[0]-.15,tip[1]+.015],tip],.010,.13))
    if i in [1,4]:
        accents.append(stroke('feather_tip_'+str(i),[[tip[0]-.13,tip[1]-.015],tip],.010,.14))
accents.append(stroke('root_glint',[[.26,.16],[.52,.28],[.71,.33]],.009,.14))
accents.append(stroke('outer_glint',[[3.26,1.36],[3.51,1.46]],.008,.14))

# The back of the wings is the normal gameplay view; keep the light seams on both faces.
for parts in [flow,spines,fractures,feathers,accents]:
    backs=copy.deepcopy(parts)
    for part in backs:
        part['id']+='_back'
        part['v']=[[x,y,2*depth(x,y)-z] for x,y,z in part['v']]
        part['f']=[list(reversed(face)) for face in part['f']]
    parts.extend(backs)

recipe('wind_wing_angular_body',body,'solid')
recipe('wind_wing_angular_flow',flow,'energy')
recipe('wind_wing_angular_spines',spines,'glow')
recipe('wind_wing_angular_cuts',fractures,'solid')
recipe('wind_wing_angular_feathers',feathers,'energy')
recipe('wind_wing_angular_accents',accents,'glow')
recipe('wind_wing_airchip',[poly_part('chip',[[0,-.5],[.14,-.10],[.035,.50],[-.06,.02]],.01)],'glow')

fx=json.loads((ROOT/'assets/fx/start/aura.fx.json').read_text(encoding='utf-8'))
fx.update(desc='ปีกลมเขียวนีออนโปร่งแซมขาว — กระพือขึ้นลงจากโคนปีก กดลงเร็วและยกกลับช้ากว่า พร้อมขนลมและ particle ตามปีก (Studio)',
          tags=['wind','wing','aura','shape-study','review'],pal='wind',dur=4.8,seed=41)
fx['layers']=[]
for side in [-1,1]:
    sid='L' if side<0 else 'R'
    # Both wings beat together about their shoulder hinge; retain the selected shape/size.
    scales=1
    pos=[side*HINGE_X,1.5+HINGE_Y,-.22+HINGE_Z]
    rotation={'0':[0,0,-side*18],'.38':[0,0,side*40],'1':[0,0,-side*18],'ease':'inout'}
    for name,mat,col,col2,op,rim in [
        ('body','toon','#57ce6a','#196a40',.20,.15),
        ('flow','energy','#7cff68','#2ec772',.27,.65),
        ('feathers','energy','#8dff65','#35b96d',.32,.45),
        ('spines','glow','#b2ff83','#44f778',.60,0),
        ('accents','glow','#efffe8','#d2ffb8',.63,0),
        ('cuts','toon','#2a8c48','#0c5230',.28,0),
    ]:
        fx['layers'].append({'id':sid+'_'+name,'t':'mesh','loop':True,'at':0,'life':FLAP_CYCLE,
            'att':'feet','shape':'model','model':'wind_wing_angular_'+name+('_L' if side<0 else ''),'mat':mat,
            'col':col,'col2':col2,'op':op,'rim':rim,'scroll':2.2,'fade':0,
            'scale':scales,'pos':pos,'rot':rotation})
    fx['layers'].append({'id':sid+'_airchips','t':'emit','loop':True,'at':0,'life':FLAP_CYCLE,
        'att':'feet','from':'mesh','of':sid+'_body','rate':24,'burst':2,
        'dir':'aim','yaw':side*110,'spread':.25,'speed':[.6,1.4],
        'plife':[.35,.65],'look':'model','model':'wind_wing_airchip','mmat':'glow',
        'msize':[.12,.27],'col':'#b0ff82','c2':'#32b866','mspin':55,
        'gravity':-.03,'drag':.7,'curl':False,'bounce':0})
    fx['layers'].append({'id':sid+'_motes','t':'emit','loop':True,'at':0,'life':FLAP_CYCLE,
        'att':'feet','from':'mesh','of':sid+'_body','rate':15,'burst':1,
        'dir':'aim','yaw':side*100,'spread':.45,'speed':[.25,.7],
        'plife':[.35,.6],'look':'spark','size':[.45,.9],
        'col':'#dbffc1','c2':'#4cd96c','gravity':-.08,'curl':False,'drag':1.2,'fin':20})
    for j,(x,y) in enumerate([(3.5,1.42),(2.85,1.12),(2.0,.59)]):
        fx['layers'].append({'id':sid+'_tip_'+str(j),'t':'emit','loop':True,'at':0,'life':FLAP_CYCLE,
            'att':'feet','pos':flap_point(side,x,y),
            'from':'sphere','fr':.07,'rate':9,'burst':0,'dir':'aim','yaw':side*110,
            'spread':.13,'speed':[1.4,3.2],'plife':[.25,.46],'look':'streak',
            'size':[.9,1.6],'col':'#c3ffa1','c2':'#43a95e',
            'gravity':-.02,'drag':1,'curl':False,'fin':15})
    fx['layers'].append({'id':sid+'_under_edge','t':'emit','loop':True,'at':0,'life':FLAP_CYCLE,
        'att':'feet','pos':flap_point(side,1.60,.26),
        'from':'line','fr':.20,'fh':.05,'rate':12,'burst':0,'dir':'aim','yaw':side*108,
        'spread':.12,'speed':[.5,1.3],'plife':[.25,.45],'look':'streak',
        'size':[.6,1.1],'col':'#aaff7c','c2':'#3c9e54',
        'gravity':-.04,'drag':1.3,'curl':False,'fin':20})

save(ROOT/'assets/fx/wind/wing_angular.fx.json',fx)
print('Angular wing study written: 13 mesh recipes + wind/wing_angular')
