// ---------- Breakable panels — view (state = PNL in js/12-pnl.js) ----------
// One box mesh per panel. Damage = small DataTexture (1 texel per cell: R crack, G outer skin gone, B through) sampled with linear filter + noise,
// so holes are smooth and merge across cells. Brick/stone sample the field at the brick centre → hole edges step along whole bricks.
// Holes/recesses are ray-marched through the slab thickness in the fragment shader (rim + inner layer visible, no geometry rebuild).
// Pattern coordinates are world-continuous (along the wall + world height) so neighbouring panels line up.
// Rubble: dusty heap strip + instanced chunks at the foot of broken cells (same heights as pnlMoundH).
const PNV={list:[],mats:new Map()};
const PN_MI={brick:0,plaster:1,stone:2,wood:3,glass:4,metal:5};
const PN_GLSL=`
uniform sampler2D uDmg;uniform vec3 uSz;uniform vec2 uOff;uniform float uRec;
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
#else
  return pnUnit(q,0.12,0.34);
#endif
}
vec3 pnF(vec2 lp){return texture2D(uDmg,clamp((lp+uSz.xy*0.5)/uSz.xy,0.001,0.999)).rgb;}
// material depth at local (x,y): 0 intact • uRec outer skin gone • 9 through
float pnM(vec2 lp){
  vec2 s=lp;float n=pnN(lp*2.3)*0.6+pnN(lp*6.1)*0.4;
#if PNM==0||PNM==2||PNM==3
  vec4 u=pnU(lp+uOff);s=mix(u.zw-uOff,lp,0.18);n=mix(n,u.y,0.6);
#endif
  vec3 f=pnF(s);
  if(f.b+(n-0.5)*0.55>0.5)return 9.;
  if(f.g+(pnN(lp*3.7+5.)-0.5)*0.6>0.5)return uRec;
  return 0.;
}`;
function pnlMat(mat){
  const mi=PN_MI[mat]??0;
  const m=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:mi===4?0.15:mi===5?0.55:0.92,metalness:mi===5?0.4:0,transparent:mi===4,opacity:mi===4?0.55:1});
  m.defines={PNM:mi};
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,m.userData.U);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vLP;varying vec3 vCamL;varying vec3 vAx;varying vec3 vAy;varying vec3 vAz;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvLP=position;vCamL=(inverse(modelMatrix)*vec4(cameraPosition,1.)).xyz;vAx=normalize(normalMatrix*vec3(1.,0.,0.));vAy=normalize(normalMatrix*vec3(0.,1.,0.));vAz=normalize(normalMatrix*vec3(0.,0.,1.));');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vLP;varying vec3 vCamL;varying vec3 vAx;varying vec3 vAy;varying vec3 vAz;'+PN_GLSL)
      .replace('#include <map_fragment>',`#include <map_fragment>
int pk=0;vec3 nR=vec3(0.);vec2 lp=vLP.xy;float dep=0.;
if(abs(vLP.z)>uSz.z*0.5-0.003){
  if(pnM(lp)>0.){
    float sg=sign(vLP.z);vec3 D=normalize(vLP-vCamL);float dz=max(-sg*D.z,0.08);const int NS=16;float stp=uSz.z/float(NS),pd=0.;bool hit=false;
    for(int i=1;i<=NS;i++){float d=stp*float(i);vec3 P=vLP+D*(d/dz);if(abs(P.x)>uSz.x*0.5||abs(P.y)>uSz.y*0.5)break;
      float m=pnM(P.xy);if(m<=d){if(m>pd+1e-4){pk=1;dep=m;lp=(vLP+D*(m/dz)).xy;}else{pk=2;dep=d;lp=P.xy;}hit=true;break;}pd=d;}
    if(!hit)discard;
    if(pk==2){float e=0.025;float a=step(pnM(lp-vec2(e,0.)),dep)-step(pnM(lp+vec2(e,0.)),dep),b=step(pnM(lp-vec2(0.,e)),dep)-step(pnM(lp+vec2(0.,e)),dep);
      nR=length(vec2(a,b))>0.?normalize(vec3(a,b,0.)):normalize(vec3(-D.xy,0.001));}
  }
}else if(pnM(lp)>=9.)discard;
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
      .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nif(pk==2)normal=normalize(nR.x*vAx+nR.y*vAy+nR.z*vAz);');
  };
  m.customProgramCacheKey=()=>'pnl'+mi;
  return m;
}
function pnlDepthMat(mat,U){
  const m=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});m.defines={PNM:PN_MI[mat]??0};
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vLP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvLP=position;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vLP;'+PN_GLSL).replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(pnM(vLP.xy)>=9.)discard;');};
  m.customProgramCacheKey=()=>'pnld'+(PN_MI[mat]??0);
  return m;
}
const PN_RUB={brick:['#8a4a32','#a85a3a','#7c7468','#6a3a28'],plaster:['#bdb5a5','#9a5a3c','#8c8478','#a8a090'],stone:['#8a857a','#6e6a62','#9a948a'],wood:['#6a4a2c','#4a3420','#7a5a38'],glass:['#cfeef8'],metal:['#6a6e72','#55585c']};
const PN_HEAP={brick:'#7a5a48',plaster:'#968c7c',stone:'#7e786e',wood:'#5a4632',glass:'#888',metal:'#5c5e60'};
function pnlBuild(){
  PNV.list=[];if(!PNL.length)return;
  const grp=addW(new THREE.Group()),rg=new THREE.DodecahedronGeometry(1,0);
  for(const p of PNL){
    const n=p.st.length,data=new Uint8Array(n*4),tex=new THREE.DataTexture(data,p.nc,p.nr,THREE.RGBAFormat);
    tex.magFilter=tex.minFilter=THREE.LinearFilter;tex.needsUpdate=true;
    const Lm=p.hl*2*S3,Tm=p.ht*2*S3,cx=tx(p.x),cz=tz(p.y);
    const U={uDmg:{value:tex},uSz:{value:new THREE.Vector3(Lm,p.H,Tm)},uOff:{value:new THREE.Vector2(cx*p.c+cz*p.s,p.zb+p.H/2)},uRec:{value:Math.min(0.12,Tm*0.4)}};
    const mat=pnlMat(p.mat);mat.userData.U=U;
    const m=new THREE.Mesh(new THREE.BoxGeometry(Lm,p.H,Tm),mat);m.position.set(cx,p.zb+p.H/2,cz);m.rotation.y=-p.a;m.castShadow=m.receiveShadow=true;
    m.customDepthMaterial=pnlDepthMat(p.mat,U);grp.add(m);
    const e={p,m,tex,data,ver:-1,heap:null,rub:null};
    if(p.mode!=='g'){
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
function pnlView(){if(!PNV.list.length)return;for(const e of PNV.list)if(e.ver!==e.p.ver)pnlSyncOne(e);}
// events: hit = dust puff • break = chunks + dust (whole panel 'g' = bursts along the length)
function pnlFX(ev,H,near){
  const p=PNL[ev.i];if(!p)return;const pal=PN_RUB[p.mat]||PN_RUB.brick,col=pal[0],glass=p.mat==='glass',el=ev.el||'none';
  if(ev.e==='h'){burst(ev.x,ev.y,col,6,90,0.45,2.2,{h:H,vh:[0.5,3],g:6});if(!glass)smoke(ev.x,ev.y,H,2,'#8a7a68',0.7,5,40);if(near)snd('thud',{x:ev.x,y:ev.y,vol:0.45});return;}
  const nb=Math.max(1,Math.round(p.hl*2/40)),pts=ev.c<0?Array.from({length:nb},(_,i)=>pnWorld(p,-p.hl+(i+0.5)*p.hl*2/nb,0)):[[ev.x,ev.y]];
  for(const [x,y] of pts){const h=ev.c<0?p.zb+p.H*0.5-pnGT(x,y):H;
    burst(x,y,col,glass?30:16,glass?220:170,glass?0.9:0.8,glass?1.6:2.8,{h,vh:[0.5,5],g:9});burst(x,y,pal[1%pal.length],glass?10:8,140,0.7,2.2,{h,vh:[0.5,4],g:9});
    if(!glass)smoke(x,y,h,ev.c<0?8:5,'#8a7a66',1.4,7,90);}
  if(near){snd('break',ev);if(el.includes('blast'))snd('boom',{x:ev.x,y:ev.y,vol:0.5});shake(ev.c<0?4:2);}
}
