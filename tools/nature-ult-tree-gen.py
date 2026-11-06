"""Nature ultimate tree: three editable, unbound Model studies.

Continuous root/trunk/branch bundles, buttress flanges and attached forks.
No animation, particles, gameplay size, radius or skill binding is defined here.
Run from any directory: python tools/nature-ult-tree-gen.py
"""
import json
import math
import random
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
TAU = math.tau


def unit(p):
    return p / max(np.linalg.norm(p), 1e-9)


def curve(points, steps=7):
    """Cubic Hermite interpolation with shortened tangents, including radius."""
    p = np.asarray(points, dtype=float)
    out = []
    for i in range(len(p) - 1):
        b, c = p[i], p[i + 1]
        a, d = p[max(0, i - 1)], p[min(len(p) - 1, i + 2)]
        m0, m1 = (c - a) * .40, (d - b) * .40
        for k in range(steps):
            t = k / steps
            out.append((2*t**3-3*t*t+1)*b+(t**3-2*t*t+t)*m0
                       +(-2*t**3+3*t*t)*c+(t**3-t*t)*m1)
    out.append(p[-1])
    return np.asarray(out)


class Tree:
    def __init__(self, variant):
        self.kind = variant
        self.rng = random.Random(10619 + ord(variant))
        self.parts = []
        self.paths = []
        self.wood = ['#41412e', '#494936', '#514d36', '#3c3c2d', '#555039', '#41432e']

    def sweep(self, name, controls, col=None, sides=9, steps=7, flange=False,
              ribs=.08, surface=False, emit=0):
        """Closed, UV-unwrapped sweep using parallel transported frames.

        controls are x,y,z,r; intersections overlap intentionally at branch
        collars. Flanges flatten near the ground rather than floating as tubes.
        """
        p = curve(controls, steps)
        pos, radius = p[:, :3], np.maximum(.0015, p[:, 3])
        tangent = np.array([unit(pos[min(i+1,len(p)-1)]-pos[max(i-1,0)])
                            for i in range(len(p))])
        n = unit(np.cross(tangent[0], [0, 1, .01]))
        verts, uv, faces = [], [], []
        length = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pos, axis=0), axis=1))]
        seed = self.rng.uniform(0, TAU)
        for i, (centre, rad, t) in enumerate(zip(pos, radius, tangent)):
            # Project the preceding normal onto the next normal plane: no flips.
            projected = n - t * np.dot(n, t)
            n = unit(projected if np.linalg.norm(projected)>.01 else np.cross(t,[1,.01,0]))
            b = unit(np.cross(t, n))
            for j in range(sides + 1):
                angle = TAU * j / sides
                lobe = 1 + ribs * math.cos(angle*3+seed+.24*length[i])
                off = (n*math.cos(angle)+b*math.sin(angle))*rad*lobe
                if flange:
                    # High, thin supporting shoulders at the trunk become wide,
                    # low roots on the ground, with continuous section changes.
                    h = np.clip(centre[1]/1.6, 0, 1)
                    off[1] *= .38 + .74*h
                    horizontal = unit(np.array([-t[2], 0, t[0]]))
                    lateral = np.dot(off,horizontal)
                    off += horizontal*lateral*(.25+.16*(1-h))
                v = centre + off
                if not surface:
                    # Root ends enter the ground instead of leaving a paper-thin
                    # horizontal cap that z-fights with the training-room floor.
                    v[1] = max(-.08, v[1])
                verts.append(np.round(v, 5).tolist())
                # Dense grain across the bundle, stretched along its flow:
                # fibrous, rope-like wood rather than broad painted wood knots.
                uv.append([round(j/sides*2.6, 5), round(length[i]*.24, 5)])
        width = sides+1
        for i in range(len(p)-1):
            for j in range(sides):
                a = i*width+j
                # tangent x circumferential orientation points outwards.
                faces.append([a, a+1, a+1+width, a+width])
        faces += [list(range(sides-1,-1,-1)),
                  [len(verts)-width+j for j in range(sides)]]
        self.parts.append(dict(id=name,k='poly',v=verts,f=faces,uv=uv,sub=0,
                               flat=False,seamNormals=True,col=col or self.rng.choice(self.wood)))
        if emit:
            self.parts[-1]['emit'] = emit
        return p

    def centre(self, y):
        if self.kind == 'c':
            return np.array([.11*y + .035*y*y, y, .24*math.sin(y*.65)])
        return np.array([.17*math.sin(y*.66), y, .11*math.sin(y*.81+.5)])

    def structure(self):
        r = self.rng
        # Each dominant path runs from an outer root, through the trunk and out
        # into a major upper bough. Unequal phase/height avoids a screw pattern.
        phases = [-.22,.83,1.96,3.0,4.16,5.20]
        heights = [6.75,7.65,7.12,7.92,6.6,7.45]
        for i, phi in enumerate(phases):
            reach = [5.9,4.8,6.15,5.0,5.65,4.6][i]
            def polar(a, d, y):
                return [math.cos(a)*d, y, math.sin(a)*d]
            controls = []
            for a,d,y,rad in [(phi-.16,reach,-.045,.018),
                               (phi+.04,reach*.76,.07,.16),
                               (phi+.11,reach*.48,.22,.34),
                               (phi+.08,2.05,.64,.49),
                               (phi-.05,1.35,1.45,.43)]:
                controls.append([*polar(a,d,y),rad])
            # The open-heart variant has a deliberately wider gap at mid-height.
            for j,y in enumerate([2.4,3.6,4.7,5.55]):
                rotation=[.10,.59,1.15,1.28][j] * ([1.1,.91,1.14,.85,1.08,.88][i])
                a = phi+rotation
                dist = [1.23,1.12,1.14,1.40][j]
                if self.kind=='b':
                    # Pair of uneven side bundles, depth survives side views.
                    side = 1 if math.cos(phi)>0 else -1
                    px = side*(1.50+(.35 if j==1 else 0))
                    pz = math.sin(a)*(.68 if j<2 else .85)
                    point = self.centre(y) + np.array([px,0,pz])
                else:
                    point = self.centre(y)+np.array([math.cos(a)*dist,0,math.sin(a)*dist])
                controls.append([*point,[.37,.33,.32,.30][j]*(1+.06*math.sin(i*2))])
            a = phi + 1.28
            tip = self.centre(heights[i])
            extent=[3.45,2.85,3.0,3.55,3.5,2.5][i]
            p1 = self.centre(6.16)+np.array([math.cos(a)*1.9,0,math.sin(a)*1.9])
            p2 = tip+np.array([math.cos(a+.13)*extent,0,math.sin(a+.13)*extent])
            p3 = tip+np.array([math.cos(a+.25)*(extent+.43),.46,math.sin(a+.25)*(extent+.43)])
            controls.extend([[*p1,.23],[*p2,.105],[*p3,.009]])
            p=self.sweep(f'bundle_{i}',controls,sides=11,steps=7,flange=True,ribs=.16)
            self.paths.append(p)

            # Root forks begin within the parent shoulder, not near a tip or in air.
            for k,idx in enumerate([9,17]):
                start=p[idx].copy();a=phi+[-.57,.52][k]
                ll=[1.55,1.8][k]+r.uniform(-.25,.25)
                root=[[*start[:3],start[3]*.66],
                      [start[0]+math.cos(a)*ll*.4,max(.045,start[1]*.58),start[2]+math.sin(a)*ll*.4,.14],
                      [start[0]+math.cos(a+.12)*ll,-.04,start[2]+math.sin(a+.12)*ll,.008]]
                fork=self.sweep(f'root_fork_{i}_{k}',root,sides=7,steps=7,flange=True)
                at=fork[7,:3];a+=.58 if k else -.64
                self.sweep(f'root_fine_{i}_{k}',[[*at,.049],
                    [at[0]+math.cos(a)*.53,.026,at[2]+math.sin(a)*.53,.022],
                    [at[0]+math.cos(a+.15)*1.05,-.035,at[2]+math.sin(a+.15)*1.05,.002]],
                    sides=5,steps=5,flange=True)

            # Secondary upper branches overlap the parent along the initial neck.
            for k,idx in enumerate([62,69]):
                start=p[min(idx,len(p)-4)].copy()
                a=phi+1.28+(-.68 if k==0 else .64)
                span=1.35+r.random()*.85
                end=start[:3]+np.array([math.cos(a)*span,.75+r.random()*.7,math.sin(a)*span])
                mid=start[:3]*.43+end*.57+np.array([0,.12,0])
                branch=self.sweep(f'bough_fork_{i}_{k}',[[*start[:3],start[3]*.84],
                     [*mid,.10],[*end,.006]],sides=8,steps=8)
                at=branch[8,:3];a+=.65
                self.sweep(f'twig_{i}_{k}',[[*at,.068],
                    [at[0]+math.cos(a)*.65,at[1]+.40,at[2]+math.sin(a)*.65,.032],
                    [at[0]+math.cos(a)*1.08,at[1]+.66,at[2]+math.sin(a)*1.08,.002]],sides=6,steps=5)

            # Raised fibre ribbons follow the SAME wood, never random spaghetti.
            # Intermittent, recessed on upper trunk, with distinct width/length.
            for k,(start,end) in enumerate([(21,62),(28,72),(18,67)]):
                section=p[start:end:4]
                decorated=[]
                for j,row in enumerate(section):
                    tangent=unit(p[min(len(p)-1,start+j*4+1),:3]-p[max(0,start+j*4-1),:3])
                    side=unit(np.cross(tangent,[math.cos(phi+k),.2,math.sin(phi+k)]))
                    point=row[:3]+side*row[3]*.98
                    rad=.009+[.058,.043,.075][k]*math.sin(math.pi*j/max(1,len(section)-1))**.55
                    decorated.append([*point,rad])
                self.sweep(f'grain_ridge_{i}_{k}',decorated,col=['#54583b','#616343','#343829'][k],
                           sides=5,steps=3,ribs=.035)

        # Join low/high neighbouring bundles, keeping the central opening free
        # of horizontal rung-like bars, especially in the open-heart study.
        for i,a,b,h in [(0,1,2,1.15),(1,3,4,5.4)]:
            p=self.paths[a][min(range(len(self.paths[a])),key=lambda j:abs(self.paths[a][j,1]-h)),:3]
            q=self.paths[b][min(range(len(self.paths[b])),key=lambda j:abs(self.paths[b][j,1]-(h+.55))),:3]
            mid=(p+q)*.5+np.array([.05,.37,-.25])
            self.sweep(f'joined_bark_{i}',[[*p,.19],[*mid,.24],[*q,.16]],sides=8,steps=7)

    def energy(self):
        # Three irregular, rising filaments: clear inner mass but real dark gaps.
        for k in range(3):
            p=[]
            for j,y in enumerate([.55,1.3,2.2,3.2,4.25,5.15,5.9]):
                angle=k*2.17+y*.83
                distance=[.12,.32,.34,.25,.31,.22,.07][j]
                centre=self.centre(y)+np.array([math.cos(angle)*distance,0,math.sin(angle)*distance])
                radius=[.015,.14,.19,.20,.18,.12,.008][j]
                p.append([*centre,radius*(1 if k==0 else .72)])
            self.sweep(f'heart_light_{k}',p,col=['#94ef78','#55cd69','#ccffb0'][k],
                       sides=8,steps=7,ribs=.12,surface=True,emit=[.85,.6,.9][k])
        # Thin green veins are laid on the inner-facing surface of selected wood.
        for k,path in enumerate(self.paths):
            start,end=26+(k%2)*5,63+(k%3)*3
            controls=[]
            section=path[start:end:3]
            for j,row in enumerate(section):
                inside=unit(self.centre(row[1])-row[:3])
                point=row[:3]+inside*row[3]*.93
                rad=.006+.014*math.sin(math.pi*j/max(1,len(section)-1))
                controls.append([*point,rad])
            self.sweep(f'living_vein_{k}',controls,col='#a2ef71',sides=5,steps=3,ribs=0,emit=.8)

    def save(self):
        self.structure()
        self.energy()
        name=f'nature_ult_tree_{self.kind}'
        labels={'a':'Bundled roots, interwoven trunk, spreading crown',
                'b':'Uneven root bundles framing an open heart',
                'c':'Leaning crown held by opposing buttress roots'}
        data=dict(v=1,desc=f'Nature ultimate MODEL DRAFT {self.kind.upper()}: '+labels[self.kind]+
                  '. Provisional scale only; no binding, mechanics, animation or particles.',
                  pal='nature',mat='solid',smooth=True,bark=True,
                  parts=self.parts)
        dest=ROOT/'assets/fx/mesh'/f'{name}.mesh.json'
        dest.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
        tri=sum(sum(len(f)-2 for f in p['f']) for p in self.parts)
        vs=np.array([v for p in self.parts for v in p['v']])
        print(name, len(self.parts),'parts',tri,'triangles',
              'bounds',np.round(vs.min(axis=0),2),np.round(vs.max(axis=0),2))


if __name__ == '__main__':
    for variant in 'abc':
        Tree(variant).save()
