// ---------- Breakable panels — view (state = PNL in js/12-pnl.js) ----------
// One box mesh per panel. Damage = small DataTexture (1 texel per cell: R crack, G outer skin gone, B through) sampled with linear filter + noise,
// so holes are smooth and merge across cells. Brick/stone sample the field at the brick centre → hole edges step along whole bricks.
// Holes/recesses are real geometry (pnlGeo: greedy-merged faces, rebuilt only when a cell changes depth) — the shader only paints (aPk = surface kind).
// Pattern coordinates are world-continuous (along the wall + world height) so neighbouring panels line up.
// Rubble: dusty heap strip + instanced chunks at the foot of broken cells (same heights as pnlMoundH).
const PNV={list:[],mats:new Map()};
const PN_MI={brick:0,plaster:1,stone:2,wood:3,glass:4,metal:5,roof:6,snowroof:7,timber:8,litwin:9};
const PN_GLSL=`
uniform sampler2D uDmg;uniform vec3 uSz;uniform vec2 uOff;uniform float uRec;uniform float uTri;uniform vec3 uTp;uniform vec4 uHo[4];uniform float uNHo;
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
  if(uTri>0.5){float t=lp.x/uSz.x+0.5,f=t<uTp.y?uTp.x+(1.-uTp.x)*t/max(uTp.y,1e-4):1.+(uTp.z-1.)*(t-uTp.y)/max(1.-uTp.y,1e-4);if(lp.y+uSz.y*0.5>uSz.y*f)return 9.;}   // shaped top (triangle / slanted)
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
// Faces between different depths become cut faces (aPk 2), recess floors aPk 1, outer surface aPk 0. Untouched cells are merged (greedy) → few triangles.
// Damage edges are tiles cut on the fly: each cut edge bites into the cell in brick-sized steps (PN_ZU), continuous along a run of cut edges,
// flat near run ends so corners never cross; the core bites less than the outer skin. Door/window/gable/border edges stay straight.
// Rebuilt only when a cell changes depth class (pnlSyncOne), so the render cost is a plain mesh.
function pnlCls(p){   // depth class per cell: 0 full • 1 core • 2 gone
  const n=p.st.length,c=new Uint8Array(n);
  for(let k=0;k<n;k++)c[k]=!p.ex[k]?3:p.st[k]>=3?2:p.st[k]>=2?1:0;
  for(let k=0;k<n;k++)if(c[k]===3){const col=k%p.nc,r=(k/p.nc)|0;let b=2;   // missing cell (opening / gable): follow its live neighbours (exact edge comes from the clip)
    for(const [dc,dr] of [[-1,0],[1,0],[0,-1],[0,1]]){const cc=col+dc,rr=r+dr;if(cc<0||rr<0||cc>=p.nc||rr>=p.nr)continue;const q=c[rr*p.nc+cc];if(q<b)b=q;}c[k]=b;}
  return c;
}
// stair size along a cut edge [horizontal, vertical] m per material (brick-sized bites)
const PN_ZU={brick:[0.17,0.12],stone:[0.4,0.21],plaster:[0.15,0.15],wood:[0.11,0.3],timber:[0.15,0.15],roof:[0.15,0.1],snowroof:[0.15,0.1]};
function pnlGeo(p,cls,Lm,H,Tm,rec){
  const hL=Lm/2,hH=H/2,hT=Tm/2,cz=hT-rec,cw=Lm/p.nc,ch=H/p.nr,ho=(p.d.ho||[]).slice(0,4),tri=p.tri;
  const tp=p.tp,slope=x=>tri?-hH+H*pnTopF(tp,(x+hL)/Lm):1e9;
  const xs=new Set([-hL,hL]),ys=new Set([-hH,hH]);
  for(let i=1;i<p.nc;i++)xs.add(-hL+i*cw);for(let j=1;j<p.nr;j++)ys.add(-hH+j*ch);
  for(const q of ho){xs.add(Math.max(-hL,Math.min(hL,q[0]-hL)));xs.add(Math.max(-hL,Math.min(hL,q[1]-hL)));ys.add(Math.max(-hH,Math.min(hH,q[2]-hH)));ys.add(Math.max(-hH,Math.min(hH,q[3]-hH)));}
  if(tri){const [a,k,b]=tp,ax=t=>-hL+t*Lm;xs.add(ax(k));   // apex + where each row line meets the sloped top
    for(const y of ys){const f=(y+hH)/H;if(a<1&&f>=a&&f<=1)xs.add(ax(k*(f-a)/(1-a)));if(b<1&&f>=b&&f<=1)xs.add(ax(k+(1-k)*(1-f)/(1-b)));}}
  const X=[...xs].sort((a,b)=>a-b).filter((v,i,a)=>!i||v-a[i-1]>1e-4),Y=[...ys].sort((a,b)=>a-b).filter((v,i,a)=>!i||v-a[i-1]>1e-4),NX=X.length-1,NY=Y.length-1,NN=NX*NY;
  // per sub-rect: GE geometric presence (not opening / above gable) • C damage class 0 full / 1 core / 2 gone • CL gable-clipped (T0/T1 top)
  const GE=new Uint8Array(NN),C=new Uint8Array(NN),CL=new Uint8Array(NN),T0=new Float32Array(NN),T1=new Float32Array(NN);
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const id=j*NX+i,x0=X[i],x1=X[i+1],y0=Y[j],y1=Y[j+1];
    const t0=Math.min(y1,slope(x0)),t1=Math.min(y1,slope(x1));T0[id]=t0;T1[id]=t1;
    if(t0<=y0+1e-5&&t1<=y0+1e-5)continue;
    const cx=(x0+x1)/2,cy=(y0+Math.min(y1,(t0+t1)/2))/2;
    if(ho.some(q=>cx>q[0]-hL&&cx<q[1]-hL&&cy>q[2]-hH&&cy<q[3]-hH))continue;
    GE[id]=1;CL[id]=(t0<y1-1e-5||t1<y1-1e-5)?1:0;
    const col=Math.min(p.nc-1,Math.max(0,Math.floor((cx+hL)/cw))),r=Math.min(p.nr-1,Math.max(0,Math.floor((cy+hH)/ch)));C[id]=cls[r*p.nc+col];}
  const has=(L,i,j)=>i>=0&&j>=0&&i<NX&&j<NY&&GE[j*NX+i]&&C[j*NX+i]<=L;   // layer L: 0 outer skin, 1 core
  const DI=[[0,-1],[1,0],[0,1],[-1,0]];   // edge dir: 0 bottom • 1 right • 2 top • 3 left
  // edge type: 'n' neighbour has this layer (no face) • 'b' panel border / opening / gable (straight outer face) • 'c' damage cut (stepped face)
  const et=(L,i,j,d)=>{const id=j*NX+i;if(d===2&&CL[id])return 'b';const ni=i+DI[d][0],nj=j+DI[d][1];
    if(ni<0||nj<0||ni>=NX||nj>=NY||!GE[nj*NX+ni])return 'b';return has(L,ni,nj)?'n':'c';};
  // stepped depth along a cut run (global coordinate s → equal on both cells of a run); 0 near run ends so corners never cross
  const A=Math.min(0.2,0.25*Math.min(cw,ch)),Lf=A*1.05,ZU=PN_ZU[p.mat]||[0.1,0.1],H0=n=>{const v=Math.sin(n*12.9898+p.i*78.233)*43758.5453;return v-Math.floor(v);};
  const runC={};
  const run=(L,d,i,j)=>{const k=L+','+d+','+i+','+j;if(runC[k])return runC[k];const hz=d%2===0,ok=(a,b)=>has(L,a,b)&&!CL[b*NX+a]&&et(L,a,b,d)==='c';
    let a=hz?i:j,b=a;if(hz){while(ok(a-1,j))a--;while(ok(b+1,j))b++;}else{while(ok(i,a-1))a--;while(ok(i,b+1))b++;}
    const r=hz?[X[a],X[b+1]]:[Y[a],Y[b+1]];
    for(let q=a;q<=b;q++)runC[L+','+d+','+(hz?q:i)+','+(hz?j:q)]=r;return r;};
  const unit=(d,len)=>Math.max(0.04,Math.min(d%2===0?ZU[0]:ZU[1],len/5));
  const raw=(d,i,j,s,u)=>{const line=d===0?j:d===2?j+1:d===1?i+1:i,k=Math.floor(s/u),h=H0(k*1.731+line*101.3+d*17.1);return {k,dep:h<0.2?0:A*(0.3+0.7*H0(k*3.17+line*7.7+d*5.3))};};
  const depth=(L,d,i,j,s)=>{   // inward depth of layer L's face on cell (i,j) edge d at coordinate s
    const id=j*NX+i;if(CL[id]||et(L,i,j,d)!=='c')return 0;
    const [s0,s1]=run(L,d,i,j),u=unit(d,s1-s0),{k,dep}=raw(d,i,j,s,u),ps=k*u,pe=ps+u;
    if(ps<s0+Lf||pe>s1-Lf)return 0;return L===0?dep:dep*0.55;};   // core bites less than the skin → the skin never overhangs empty space
  const P=[],N=[],K=[],I=[];
  const tri3=(a,b,c,n,k)=>{const o=P.length/3;P.push(...a,...b,...c);for(let q=0;q<3;q++){N.push(...n);K.push(k);}
    const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
    if((uy*vz-uz*vy)*n[0]+(uz*vx-ux*vz)*n[1]+(ux*vy-uy*vx)*n[2]>=0)I.push(o,o+1,o+2);else I.push(o,o+2,o+1);};
  const quad=(a,b,c,d,n,k)=>{tri3(a,b,c,n,k);tri3(a,c,d,n,k);};
  const bands=L=>L===0?[[cz,hT],[-hT,-cz]]:[[-cz,cz]];
  const wall=(L,a,b,k)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);if(l<1e-6)return;const n=[dy/l,-dx/l,0];
    for(const [z0,z1] of bands(L))quad([a[0],a[1],z0],[b[0],b[1],z0],[b[0],b[1],z1],[a[0],a[1],z1],n,k);};
  // cells with no cut edge (and not gable-clipped) = plain blocks → merged below; the rest get per-layer polygons
  const plain=new Uint8Array(NN);
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const id=j*NX+i;if(!GE[id]||C[id]>1||CL[id])continue;let ok=1;
    for(let L=0;L<=1&&ok;L++)if(has(L,i,j))for(let d=0;d<4;d++)if(et(L,i,j,d)==='c'){ok=0;break;}plain[id]=ok;}
  // greedy caps for plain cells (top layer only; hidden inner faces skipped)
  const used=new Uint8Array(NN),ext=c=>c===0?hT:cz;
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const id=j*NX+i;if(used[id]||!plain[id])continue;const c=C[id];
    let w=1;while(i+w<NX&&!used[id+w]&&plain[id+w]&&C[id+w]===c)w++;
    let h=1;grow:while(j+h<NY){for(let q=0;q<w;q++){const k2=(j+h)*NX+i+q;if(used[k2]||!plain[k2]||C[k2]!==c)break grow;}h++;}
    for(let r=0;r<h;r++)for(let q=0;q<w;q++)used[(j+r)*NX+i+q]=1;
    const e=ext(c),x0=X[i],x1=X[i+w],y0=Y[j],y1=Y[j+h];for(const s of [1,-1])quad([x0,y0,s*e],[x1,y0,s*e],[x1,y1,s*e],[x0,y1,s*e],[0,0,s],c===0?0:1);}
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const id=j*NX+i;if(!GE[id]||C[id]>1)continue;const x0=X[i],x1=X[i+1],y0=Y[j],y1=Y[j+1];
    if(plain[id]){   // straight outer faces only
      for(let L=0;L<=1;L++){if(!has(L,i,j))continue;
        if(et(L,i,j,0)==='b')wall(L,[x0,y0],[x1,y0],0);if(et(L,i,j,1)==='b')wall(L,[x1,y0],[x1,y1],0);
        if(et(L,i,j,2)==='b')wall(L,[x1,y1],[x0,y1],0);if(et(L,i,j,3)==='b')wall(L,[x0,y1],[x0,y0],0);}
      continue;}
    for(let L=0;L<=1;L++){if(!has(L,i,j))continue;
      const t0=T0[id],t1=T1[id];
      // edge paths in CCW order: bottom x0→x1, right y0→t1, top/slope x1→x0, left t0→y0 • points [x,y,type of the segment that starts here]
      const path=(d,a,b,map)=>{const ty=et(L,i,j,d),out=[];if(ty!=='c'||CL[id]){out.push([...map(a,0),ty]);return out;}
        const [s0,s1]=run(L,d,i,j),u=unit(d,s1-s0),lo=Math.min(a,b),hi=Math.max(a,b),cuts=[];for(let s=Math.ceil(lo/u-1e-6)*u;s<hi-1e-6;s+=u)if(s>lo+1e-6)cuts.push(s);
        const seq=a<b?cuts:cuts.reverse(),dir=a<b?1:-1;let prev=a;out.push([...map(a,depth(L,d,i,j,a+dir*1e-5)),ty]);
        for(const s of seq){out.push([...map(s,depth(L,d,i,j,s-dir*1e-5)),ty]);out.push([...map(s,depth(L,d,i,j,s+dir*1e-5)),ty]);prev=s;}
        return out;};
      const E=[path(0,x0,x1,(s,dd)=>[s,y0+dd]),path(1,y0,t1,(s,dd)=>[x1-dd,s]),CL[id]?[[x1,t1,'b']]:path(2,x1,x0,(s,dd)=>[s,y1-dd]),path(3,t0,y0,(s,dd)=>[x0+dd,s])];
      // corners: combine the inward shift of both edges meeting there (only one is ever non-zero)
      const cn=[[x1,y0,depth(L,1,i,j,y0+1e-5),depth(L,0,i,j,x1-1e-5),-1,1],[x1,t1,CL[id]?0:depth(L,1,i,j,t1-1e-5),CL[id]?0:depth(L,2,i,j,x1-1e-5),-1,-1],
        [x0,t0,CL[id]?0:depth(L,3,i,j,t0-1e-5),CL[id]?0:depth(L,2,i,j,x0+1e-5),1,-1],[x0,y0,depth(L,3,i,j,y0+1e-5),depth(L,0,i,j,x0+1e-5),1,1]];
      const pts=[];for(let e=0;e<4;e++){const seg=E[e];const c0=cn[(e+3)%4];seg[0][0]=c0[0]+c0[4]*c0[2];seg[0][1]=c0[1]+c0[5]*c0[3];for(const q of seg)pts.push(q);}
      const ring=[];for(const q of pts){const l=ring[ring.length-1];if(!l||Math.abs(l[0]-q[0])>1e-6||Math.abs(l[1]-q[1])>1e-6)ring.push(q);else l[2]=q[2];}
      while(ring.length>1&&Math.abs(ring[0][0]-ring[ring.length-1][0])<1e-6&&Math.abs(ring[0][1]-ring[ring.length-1][1])<1e-6)ring.pop();
      if(ring.length<3)continue;
      for(let q=0;q<ring.length;q++){const a=ring[q],b=ring[(q+1)%ring.length];if(a[2]==='c')wall(L,a,b,2);else if(a[2]==='b')wall(L,a,b,0);}
      const z=L===0?hT:cz,tr=THREE.ShapeUtils.triangulateShape(ring.map(q=>new THREE.Vector2(q[0],q[1])),[]);
      for(const s of [1,-1])for(const t of tr)tri3([ring[t[0]][0],ring[t[0]][1],s*z],[ring[t[1]][0],ring[t[1]][1],s*z],[ring[t[2]][0],ring[t[2]][1],s*z],[0,0,s],L===0?0:1);}}
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
    const U={uDmg:{value:tex},uSz:{value:new THREE.Vector3(Lm,p.H,Tm)},uOff:{value:new THREE.Vector2(cx*p.c+cz*p.s,p.tl?p.H/2:p.zb+p.H/2)},uRec:{value:Math.min(0.12,Tm*0.4)},uTri:{value:p.tri?1:0},uTp:{value:new THREE.Vector3(...(p.tp||[1,0,1]))},uNHo:{value:Math.min(4,(p.d.ho||[]).length)},uHo:{value:[0,1,2,3].map(i=>{const h=(p.d.ho||[])[i]||[0,0,0,0];return new THREE.Vector4(h[0],h[1],h[2],h[3]);})}};
    const mat=pnlMat(p.mat);mat.userData.U=U;
    const rec=U.uRec.value,cls=pnlCls(p),m=new THREE.Mesh(pnlGeo(p,cls,Lm,p.H,Tm,rec),mat);m.position.set(tx(mid[0]),mid[2],tz(mid[1]));m.rotation.order='YXZ';m.rotation.y=-p.a;m.rotation.x=p.tl;m.castShadow=m.receiveShadow=true;
    grp.add(m);
    const e={p,m,tex,data,ver:-1,heap:null,rub:null,ck:cls.join(''),Lm,Tm,rec};
    if(p.mode!=='g'&&!p.tl){
      const S=PNDEF.pile.sp*S3,W=Lm+2*S,D=Tm+2*S,hg=new THREE.PlaneGeometry(W,D,Math.max(2,Math.ceil(W/0.35)),12);hg.rotateX(-Math.PI/2);
      const hm=new THREE.Mesh(hg,new THREE.MeshStandardMaterial({color:PN_HEAP[p.mat]||'#7a6a5a',roughness:1,flatShading:true}));hm.position.set(cx,0,cz);hm.rotation.y=-p.a;hm.receiveShadow=true;hm.visible=false;grp.add(hm);
      const rm=new THREE.InstancedMesh(rg,new THREE.MeshStandardMaterial({color:'#ffffff',roughness:0.95,flatShading:true}),n*6);rm.setMatrixAt(0,new THREE.Matrix4().makeScale(0,0,0));rm.setColorAt(0,new THREE.Color('#fff'));rm.count=PNV.list.length?0:1;   // first pile: 1 empty instance + colour → the map warm-up compiles the rubble shader (+ shadow) now, not on the first break (~0.4 s); one is enough (same program), the rest stay at 0 draws
      rm.castShadow=rm.receiveShadow=true;rm.frustumCulled=false;grp.add(rm);
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
