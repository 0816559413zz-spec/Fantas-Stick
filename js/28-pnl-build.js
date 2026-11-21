// ---------- Breakable panels — view (state = PNL in js/12-pnl.js) ----------
// One box mesh per panel. Damage = small DataTexture (1 texel per cell: R crack, G outer skin gone, B through) sampled with linear filter + noise,
// so holes are smooth and merge across cells. Brick/stone sample the field at the brick centre → hole edges step along whole bricks.
// Holes/recesses are real geometry (pnlGeo: greedy-merged faces, rebuilt only when a cell changes depth) — the shader only paints (aPk = surface kind).
// Pattern coordinates are world-continuous (along the wall + world height) so neighbouring panels line up.
// Rubble: dusty heap strip + instanced chunks at the foot of broken cells (same heights as pnlMoundH).
const PNV={list:[],mats:new Map()};
const PN_MI={brick:0,plaster:1,stone:2,wood:3,glass:4,metal:5,roof:6,snowroof:7,timber:8,litwin:9};
const PN_GLSL=`
uniform sampler2D uDmg;uniform vec3 uSz;uniform vec2 uOff;uniform float uRec;uniform float uTri;uniform vec4 uHo[4];uniform float uNHo;
float pnH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float pnN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(pnH(i),pnH(i+vec2(1.,0.)),f.x),mix(pnH(i+vec2(0.,1.)),pnH(i+vec2(1.,1.)),f.x),f.y);}
// running-bond units: x edge distance, y id hash, zw unit centre (q space)
vec4 pnUnit(vec2 q,float rh,float bw){float r=floor(q.y/rh);float o=mod(r,2.)*0.5*bw;float x=q.x+o;float b=floor(x/bw);
  vec2 l=vec2(x-b*bw,q.y-r*rh);float e=min(min(l.x,bw-l.x),min(l.y,rh-l.y));return vec4(e,pnH(vec2(b,r)),(b+0.5)*bw-o,(r+0.5)*rh);}
vec4 pnU(vec2 q){
#if PNM==2
  return pnUnit(q,0.42,0.8);
#elif PNM==3
  vec4 u=pnUnit(q.yx,1.7,0.22);return vec4(u.x,u.y,u.w,u.z);
#elif PNM==6||PNM==7
  return pnUnit(q,0.2,0.3);
#else
  return pnUnit(q,0.12,0.34);
#endif
}
vec3 pnF(vec2 lp){return texture2D(uDmg,clamp((lp+uSz.xy*0.5)/uSz.xy,0.001,0.999)).rgb;}
// material depth at local (x,y): 0 intact • uRec outer skin gone • 9 through
float pnM(vec2 lp){
  if(uTri>0.5&&lp.y+uSz.y*0.5>uSz.y*(1.-abs(lp.x)/(uSz.x*0.5)))return 9.;   // gable triangle
  vec2 hp=lp+uSz.xy*0.5;for(int i=0;i<4;i++){if(float(i)>=uNHo)break;vec4 h=uHo[i];if(hp.x>h.x&&hp.x<h.y&&hp.y>h.z&&hp.y<h.w)return 9.;}   // openings
  vec2 s=lp;float n=pnN(lp*2.3)*0.6+pnN(lp*6.1)*0.4;
#if PNM==0||PNM==2||PNM==3||PNM==6||PNM==7
  vec4 u=pnU(lp+uOff);s=mix(u.zw-uOff,lp,0.18);n=mix(n,u.y,0.6);
#endif
  vec3 f=pnF(s);
  if(f.b+(n-0.5)*0.55>0.5)return 9.;
  if(f.g+(pnN(lp*3.7+5.)-0.5)*0.6>0.5)return uRec;
  return 0.;
}`;
function pnlMat(mat){
  const mi=PN_MI[mat]??0;
  const m=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:mi===4||mi===9?0.15:mi===5?0.55:0.92,metalness:mi===5?0.4:0,transparent:mi===4,opacity:mi===4?0.55:1});
  m.defines={PNM:mi};
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,m.userData.U);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aPk;varying vec3 vLP;varying float vPk;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvLP=position;vPk=aPk;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vLP;varying float vPk;'+PN_GLSL)
      .replace('#include <map_fragment>',`#include <map_fragment>
int pk=int(vPk+0.5);vec2 lp=vLP.xy;float dep=uSz.z*0.5-abs(vLP.z),pnGlow=0.;   // pk 0 outer surface • 1 recess floor • 2 cut face (real geometry, pnlGeo)
vec2 q=lp+uOff;vec3 fd=pnF(lp);float nz=pnN(q*1.7)*0.55+pnN(q*7.3)*0.45;vec3 c;
#if PNM==1
  if(pk==0){c=vec3(0.72,0.68,0.61)*(0.88+0.16*nz);c*=1.-0.12*smoothstep(0.55,0.9,pnN(q*0.6+2.));}
  else{vec4 u=pnUnit(q,0.12,0.34);vec3 br=mix(vec3(0.58,0.28,0.17),vec3(0.74,0.42,0.26),u.y)*(0.85+0.25*nz);c=mix(vec3(0.58,0.55,0.5),br,smoothstep(0.008,0.018,u.x));
    if(pk==2&&dep<uRec*0.9)c=vec3(0.66,0.63,0.57)*(0.8+0.3*nz);}
#elif PNM==2
  {vec4 u=pnU(q);c=vec3(0.6,0.58,0.54)*(0.8+0.3*u.y)*(0.85+0.25*nz);c=mix(c*0.5,c,smoothstep(0.01,0.035,u.x));}
#elif PNM==3
  {vec4 u=pnU(q);c=mix(vec3(0.42,0.28,0.16),vec3(0.58,0.4,0.24),u.y)*(0.8+0.3*pnN(vec2(q.x*30.,q.y*1.5)));c=mix(c*0.45,c,smoothstep(0.006,0.016,u.x));}
#elif PNM==4
  c=vec3(0.72,0.88,0.95);
#elif PNM==5
  c=vec3(0.5,0.53,0.56)*(0.85+0.15*sin(q.x*40.))*(0.9+0.15*nz);
#elif PNM==6||PNM==7
  {vec4 u=pnU(q);c=vec3(0.30,0.32,0.38)*(0.78+0.34*u.y)*(0.88+0.2*nz);c=mix(c*0.45,c,smoothstep(0.004,0.02,u.x));c*=0.8+0.2*smoothstep(0.,0.12,fract(q.y/0.2)*0.2);
   if(pk!=0)c=mix(vec3(0.36,0.24,0.14),vec3(0.46,0.32,0.2),pnN(vec2(q.x*2.,q.y*14.)));
#if PNM==7
   if(pk==0){float sn=smoothstep(0.38,0.62,pnN(q*0.7)*0.55+pnN(q*2.6+3.)*0.3+0.22);c=mix(c,vec3(0.9,0.93,0.98)*(0.9+0.1*nz),sn);}
#endif
  }
#elif PNM==8
  if(pk==0){c=vec3(0.80,0.75,0.66)*(0.88+0.16*nz);float hy=lp.y+uSz.y*0.5,px=abs(fract(q.x/1.3)-0.5)*1.3,b=min(px,min(abs(hy-0.1),min(abs(hy-uSz.y*0.5),abs(hy-uSz.y+0.12))));
    c=mix(vec3(0.27,0.18,0.11)*(0.8+0.3*pnN(vec2(q.x*20.,q.y*3.))),c,smoothstep(0.075,0.09,b));}
  else{vec4 u=pnUnit(q,0.12,0.34);vec3 br=mix(vec3(0.58,0.28,0.17),vec3(0.74,0.42,0.26),u.y)*(0.85+0.25*nz);c=mix(vec3(0.58,0.55,0.5),br,smoothstep(0.008,0.018,u.x));}
#elif PNM==9
  {vec2 a=abs(lp);float fr=min(min(uSz.x*0.5-a.x,uSz.y*0.5-a.y),min(a.x,a.y));pnGlow=smoothstep(0.03,0.045,fr);c=mix(vec3(0.3,0.2,0.12),vec3(1.,0.86,0.62),pnGlow);}
#else
  {vec2 qq=pk==1?q+vec2(0.085,0.):q;vec4 u=pnUnit(qq,0.12,0.34);vec3 br=mix(vec3(0.6,0.29,0.17),vec3(0.78,0.45,0.27),u.y)*(0.82+0.3*nz);
   br*=1.-0.25*step(0.86,u.y);c=mix(vec3(0.6,0.57,0.52)*(0.85+0.2*nz),br,smoothstep(0.008,0.018,u.x));}
#endif
if(pk==1)c*=0.72;
if(pk==2){c*=0.62*(0.8+0.4*nz);}
if(pk==0){float cr=smoothstep(0.35,0.85,fd.r+(nz-0.5)*0.45);vec2 w=q*1.4+vec2(pnN(q*3.1),pnN(q*3.1+7.))*0.7;
  float ln=max(1.-smoothstep(0.,0.01+0.012*cr,abs(pnN(w*2.)-0.5)),0.7*(1.-smoothstep(0.,0.007,abs(pnN(w*4.6+3.)-0.5))));c*=1.-0.75*cr*ln;
  c*=1.-0.3*smoothstep(0.15,0.5,fd.b*0.8+fd.g*0.5);}
diffuseColor.rgb=pow(max(c,vec3(0.)),vec3(2.2));`)   // palette written in sRGB → linear
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#if PNM==9\ntotalEmissiveRadiance=vec3(1.,0.6,0.26)*1.4*pnGlow;\n#endif');
  };
  m.customProgramCacheKey=()=>'pnl'+mi;
  return m;
}
const PN_RUB={roof:['#4a4e58','#3a3e48','#5a5e68'],snowroof:['#e8eef4','#4a4e58','#cfd8e0'],timber:['#d8ccb4','#5a3e28','#9a5a3c'],litwin:['#ffd89a','#cfeef8'],brick:['#8a4a32','#a85a3a','#7c7468','#6a3a28'],plaster:['#bdb5a5','#9a5a3c','#8c8478','#a8a090'],stone:['#8a857a','#6e6a62','#9a948a'],wood:['#6a4a2c','#4a3420','#7a5a38'],glass:['#cfeef8'],metal:['#6a6e72','#55585c']};
const PN_HEAP={roof:'#4e5058',snowroof:'#8a8c90',timber:'#968c7c',litwin:'#888',brick:'#7a5a48',plaster:'#968c7c',stone:'#7e786e',wood:'#5a4632',glass:'#888',metal:'#5c5e60'};
// Real geometry for a panel: the slab is split on cell lines (+ exact opening edges, + gable slope crossings) into sub-rects;
// each sub-rect is full thickness (stage ≤1), a thinner core (stage 2 = outer skin gone on both faces) or empty (stage 3 / opening / above the gable).
// Faces between different depths become cut faces (aPk 2), recess floors aPk 1, outer surface aPk 0. Same-depth faces are merged (greedy) → few triangles.
// Rebuilt only when a cell changes depth class (pnlSyncOne), so the render cost is a plain mesh.
function pnlCls(p){   // depth class per cell: 0 full • 1 core • 2 gone
  const n=p.st.length,c=new Uint8Array(n);
  for(let k=0;k<n;k++)c[k]=!p.ex[k]?3:p.st[k]>=3?2:p.st[k]>=2?1:0;
  for(let k=0;k<n;k++)if(c[k]===3){const col=k%p.nc,r=(k/p.nc)|0;let b=2;   // missing cell (opening / gable): follow its live neighbours (exact edge comes from the clip)
    for(const [dc,dr] of [[-1,0],[1,0],[0,-1],[0,1]]){const cc=col+dc,rr=r+dr;if(cc<0||rr<0||cc>=p.nc||rr>=p.nr)continue;const q=c[rr*p.nc+cc];if(q<b)b=q;}c[k]=b;}
  return c;
}
function pnlGeo(p,cls,Lm,H,Tm,rec){
  const hL=Lm/2,hH=H/2,hT=Tm/2,cw=Lm/p.nc,ch=H/p.nr,ho=(p.d.ho||[]).slice(0,4),tri=p.tri;
  const slope=x=>tri?-hH+H*(1-Math.abs(x)/hL):1e9;
  const xs=new Set([-hL,hL]),ys=new Set([-hH,hH]);
  for(let i=1;i<p.nc;i++)xs.add(-hL+i*cw);for(let j=1;j<p.nr;j++)ys.add(-hH+j*ch);
  for(const q of ho){xs.add(Math.max(-hL,Math.min(hL,q[0]-hL)));xs.add(Math.max(-hL,Math.min(hL,q[1]-hL)));ys.add(Math.max(-hH,Math.min(hH,q[2]-hH)));ys.add(Math.max(-hH,Math.min(hH,q[3]-hH)));}
  if(tri){xs.add(0);for(const y of ys){const u=hL*(1-(y+hH)/H);xs.add(u);xs.add(-u);}}
  const X=[...xs].sort((a,b)=>a-b).filter((v,i,a)=>!i||v-a[i-1]>1e-4),Y=[...ys].sort((a,b)=>a-b).filter((v,i,a)=>!i||v-a[i-1]>1e-4),NX=X.length-1,NY=Y.length-1;
  const ext=[hT,hT-rec,0],E=new Float32Array(NX*NY),T0=new Float32Array(NX*NY),T1=new Float32Array(NX*NY),CL=new Uint8Array(NX*NY);   // E half-depth, T0/T1 top at left/right (gable clip)
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const id=j*NX+i,x0=X[i],x1=X[i+1],y0=Y[j],y1=Y[j+1];
    const t0=Math.min(y1,slope(x0)),t1=Math.min(y1,slope(x1));T0[id]=t0;T1[id]=t1;
    if(t0<=y0+1e-5&&t1<=y0+1e-5){E[id]=0;continue;}
    const cx=(x0+x1)/2,cy=(y0+Math.min(y1,(t0+t1)/2))/2;
    if(ho.some(q=>cx>q[0]-hL&&cx<q[1]-hL&&cy>q[2]-hH&&cy<q[3]-hH)){E[id]=0;continue;}
    const col=Math.min(p.nc-1,Math.max(0,Math.floor((cx+hL)/cw))),r=Math.min(p.nr-1,Math.max(0,Math.floor((cy+hH)/ch)));E[id]=ext[cls[r*p.nc+col]];
    CL[id]=(t0<y1-1e-5||t1<y1-1e-5)?1:0;}
  const P=[],N=[],K=[],I=[];
  const quad=(a,b,c,d,n,k)=>{const o=P.length/3;P.push(...a,...b,...c,...d);for(let q=0;q<4;q++){N.push(...n);K.push(k);}
    const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2],dt=(uy*vz-uz*vy)*n[0]+(uz*vx-ux*vz)*n[1]+(ux*vy-uy*vx)*n[2];
    if(dt>=0)I.push(o,o+1,o+2,o,o+2,o+3);else I.push(o,o+2,o+1,o,o+3,o+2);};
  const zk=e=>e>=hT-1e-5?0:1;   // outer face or recess floor
  // front/back faces: greedy rectangles of equal depth (gable-clipped sub-rects emitted alone)
  const used=new Uint8Array(NX*NY);
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const id=j*NX+i,e=E[id];if(used[id]||e<=0)continue;
    if(CL[id]){used[id]=1;const x0=X[i],x1=X[i+1],y0=Y[j];for(const s of [1,-1])quad([x0,y0,s*e],[x1,y0,s*e],[x1,T1[id],s*e],[x0,T0[id],s*e],[0,0,s],zk(e));continue;}
    let w=1;while(i+w<NX&&!used[id+w]&&!CL[id+w]&&E[id+w]===e)w++;
    let h=1;grow:while(j+h<NY){for(let q=0;q<w;q++){const k2=(j+h)*NX+i+q;if(used[k2]||CL[k2]||E[k2]!==e)break grow;}h++;}
    for(let r=0;r<h;r++)for(let q=0;q<w;q++)used[(j+r)*NX+i+q]=1;
    const x0=X[i],x1=X[i+w],y0=Y[j],y1=Y[j+h];for(const s of [1,-1])quad([x0,y0,s*e],[x1,y0,s*e],[x1,y1,s*e],[x0,y1,s*e],[0,0,s],zk(e));}
  // side faces where the depth steps down (cut faces) or at the panel border / gable slope (outer edge)
  const side=(ea,eb,pa,pb,n,k)=>{   // strip between depth eb and ea on both faces (eb 0 = one band through the core)
    if(eb<=0){quad([...pa,-ea],[...pb,-ea],[...pb,ea],[...pa,ea],n,k);return;}
    quad([...pa,eb],[...pb,eb],[...pb,ea],[...pa,ea],n,k);quad([...pa,-ea],[...pb,-ea],[...pb,-eb],[...pa,-eb],n,k);};
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const id=j*NX+i,e=E[id];if(e<=0)continue;const x0=X[i],x1=X[i+1],y0=Y[j];
    // ±x neighbours (vertical edge, height up to the clipped top at that x)
    for(const [di,xe,t] of [[-1,x0,T0[id]],[1,x1,T1[id]]]){const ii=i+di,eb=ii<0||ii>=NX?0:Math.min(E[j*NX+ii],e);if(eb>=e-1e-6||t<=y0+1e-5)continue;
      const k=ii<0||ii>=NX?0:2;side(e,eb,[xe,y0],[xe,t],[di,0,0],k);}
    // −y neighbour
    {const eb=j===0?0:Math.min(E[(j-1)*NX+i],e);if(eb<e-1e-6)side(e,eb,[x0,y0],[x1,y0],[0,-1,0],j===0?0:2);}
    // top: clipped = gable slope (outer edge) • else +y neighbour
    if(CL[id]){const dx=x1-x0,dy=T1[id]-T0[id],l=Math.hypot(dx,dy);side(e,0,[x0,T0[id]],[x1,T1[id]],[-dy/l,dx/l,0],0);}
    else{const top=j===NY-1,eb=top?0:Math.min(E[(j+1)*NX+i],e);if(eb<e-1e-6)side(e,eb,[x0,Y[j+1]],[x1,Y[j+1]],[0,1,0],top?0:2);}}
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('aPk',new THREE.Float32BufferAttribute(K,1));g.setIndex(I);
  g.computeBoundingSphere();g.computeBoundingBox();return g;
}
function pnlBuild(){
  PNV.list=[];if(!PNL.length)return;
  const grp=addW(new THREE.Group()),rg=new THREE.DodecahedronGeometry(1,0);
  for(const p of PNL){
    const n=p.st.length,data=new Uint8Array(n*4),tex=new THREE.DataTexture(data,p.nc,p.nr,THREE.RGBAFormat);
    tex.magFilter=tex.minFilter=THREE.LinearFilter;tex.needsUpdate=true;
    const Lm=p.hl*2*S3,Tm=p.ht*2*S3,cx=tx(p.x),cz=tz(p.y),mid=pnP3(p,0,p.Hp/2);
    const U={uDmg:{value:tex},uSz:{value:new THREE.Vector3(Lm,p.H,Tm)},uOff:{value:new THREE.Vector2(cx*p.c+cz*p.s,p.tl?p.H/2:p.zb+p.H/2)},uRec:{value:Math.min(0.12,Tm*0.4)},uTri:{value:p.tri?1:0},uNHo:{value:Math.min(4,(p.d.ho||[]).length)},uHo:{value:[0,1,2,3].map(i=>{const h=(p.d.ho||[])[i]||[0,0,0,0];return new THREE.Vector4(h[0],h[1],h[2],h[3]);})}};
    const mat=pnlMat(p.mat);mat.userData.U=U;
    const rec=U.uRec.value,cls=pnlCls(p),m=new THREE.Mesh(pnlGeo(p,cls,Lm,p.H,Tm,rec),mat);m.position.set(tx(mid[0]),mid[2],tz(mid[1]));m.rotation.order='YXZ';m.rotation.y=-p.a;m.rotation.x=p.tl;m.castShadow=m.receiveShadow=true;
    grp.add(m);
    const e={p,m,tex,data,ver:-1,heap:null,rub:null,ck:cls.join(''),Lm,Tm,rec};
    if(p.mode!=='g'&&!p.tl){
      const S=PNDEF.pile.sp*S3,W=Lm+2*S,D=Tm+2*S,hg=new THREE.PlaneGeometry(W,D,Math.max(2,Math.ceil(W/0.35)),12);hg.rotateX(-Math.PI/2);
      const hm=new THREE.Mesh(hg,new THREE.MeshStandardMaterial({color:PN_HEAP[p.mat]||'#7a6a5a',roughness:1,flatShading:true}));hm.position.set(cx,0,cz);hm.rotation.y=-p.a;hm.receiveShadow=true;hm.visible=false;grp.add(hm);
      const rm=new THREE.InstancedMesh(rg,new THREE.MeshStandardMaterial({color:'#ffffff',roughness:0.95,flatShading:true}),n*6);rm.count=0;rm.castShadow=rm.receiveShadow=true;rm.frustumCulled=false;grp.add(rm);
      e.heap=hm;e.rub=rm;}
    PNV.list.push(e);
  }
}
function pnlSyncOne(e){
  const p=e.p,d=e.data;e.ver=p.ver;let alive=false;
  for(let k=0;k<p.st.length;k++){const s=p.st[k];d[k*4]=s>=1?255:0;d[k*4+1]=s>=2?255:0;d[k*4+2]=s>=3?255:0;d[k*4+3]=255;if(s<3)alive=true;}
  e.tex.needsUpdate=true;e.m.visible=alive;
  if(alive){const cls=pnlCls(p),ck=cls.join('');if(ck!==e.ck){e.ck=ck;e.m.geometry.dispose();e.m.geometry=pnlGeo(p,cls,e.Lm,p.H,e.Tm,e.rec);}}   // depth changed → rebuild this panel only
  if(!e.heap)return;
  const ph=pnPileCols(p);e.heap.visible=!!ph;if(!ph){e.rub.count=0;return;}
  // heap strip: vertex heights from pnPileAt (local grid → world)
  const pos=e.heap.geometry.attributes.position,cx=tx(p.x),cz=tz(p.y);
  for(let i=0;i<pos.count;i++){const lx=pos.getX(i),lz=pos.getZ(i),wx=cx+lx*p.c-lz*p.s,wz=cz+lx*p.s+lz*p.c,x=wx/S3+MW/2,y=wz/S3+MH/2,h=pnPileAt(p,x,y);
    pos.setY(i,GY(x,y)+(h>0.02?h:-0.15));}
  pos.needsUpdate=true;e.heap.geometry.computeVertexNormals();e.heap.geometry.computeBoundingSphere();
  // chunks: 6 per broken cell, deterministic per cell (same on every machine)
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),eu=new THREE.Euler(),col=new THREE.Color(),pal=PN_RUB[p.mat]||PN_RUB.brick,S=PNDEF.pile.sp;let n=0;
  const rnd=s=>{const v=Math.sin(s*12.9898+p.i*78.233)*43758.5453;return v-Math.floor(v);};
  for(let k=0;k<p.st.length;k++){if(p.st[k]<3)continue;const c0=k%p.nc;
    for(let j=0;j<6;j++){const s=k*7+j*1.37,u=pnCU(p,c0)+(rnd(s)-0.5)*p.cw*1.2,v=(rnd(s+3.1)-0.5)*2*(p.ht+S*0.75),[x,y]=pnWorld(p,u,v),h=pnPileAt(p,x,y),sz=0.08+0.18*rnd(s+5.7);
      eu.set(rnd(s+1)*6.3,rnd(s+2)*6.3,rnd(s+4)*6.3);q.setFromEuler(eu);
      m4.compose(new THREE.Vector3(tx(x),GY(x,y)+h*(0.45+0.5*rnd(s+6))+sz*0.3,tz(y)),q,new THREE.Vector3(sz*1.3,sz*0.7,sz));
      e.rub.setMatrixAt(n,m4);e.rub.setColorAt(n,col.set(pal[(rnd(s+8)*pal.length)|0]));n++;}}
  e.rub.count=n;e.rub.instanceMatrix.needsUpdate=true;if(e.rub.instanceColor)e.rub.instanceColor.needsUpdate=true;
}
function pnlView(){if(!PNV.list.length)return;if(PNV.list[0].p!==PNL[0])PNV.list.forEach((e,i)=>{if(PNL[i]){e.p=PNL[i];e.ver=-1;}});   // cached world, new match = new PNL state
  for(const e of PNV.list)if(e.ver!==e.p.ver)pnlSyncOne(e);}
// events: hit = dust puff • break = chunks + dust (whole panel 'g' = bursts along the length)
function pnlFX(ev,H,near){
  const p=PNL[ev.i];if(!p)return;const pal=PN_RUB[p.mat]||PN_RUB.brick,col=pal[0],glass=p.mat==='glass'||p.mat==='litwin',el=ev.el||'none';
  if(ev.e==='h'){burst(ev.x,ev.y,col,6,90,0.45,2.2,{h:H,vh:[0.5,3],g:6});if(!glass)smoke(ev.x,ev.y,H,2,'#8a7a68',0.7,5,40);if(near)snd('thud',{x:ev.x,y:ev.y,vol:0.45});return;}
  const nb=Math.max(1,Math.round(p.hl*2/40)),pts=ev.c<0?Array.from({length:nb},(_,i)=>pnP3(p,-p.hl+(i+0.5)*p.hl*2/nb,p.Hp/2)):[[ev.x,ev.y,null]];
  for(const [x,y,za] of pts){const h=za!=null?za-pnGT(x,y):H;
    burst(x,y,col,glass?30:16,glass?220:170,glass?0.9:0.8,glass?1.6:2.8,{h,vh:[0.5,5],g:9});burst(x,y,pal[1%pal.length],glass?10:8,140,0.7,2.2,{h,vh:[0.5,4],g:9});
    if(!glass)smoke(x,y,h,ev.c<0?8:5,'#8a7a66',1.4,7,90);}
  if(near){snd('break',ev);if(el.includes('blast'))snd('boom',{x:ev.x,y:ev.y,vol:0.5});shake(ev.c<0?4:2);}
}
