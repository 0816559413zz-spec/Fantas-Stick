// =====================================================================
//  ภาพแผนที่ First Castle Strike (แบบ Basic: กล่อง/ทรงพื้นฐาน ยังไม่มีโมเดลจริง) + ภาพ/HUD โหมดบุกปราสาท
//  ฉากนิ่ง buildFcs (รวม batch ได้) • ของที่เปลี่ยนสถานะ (แกน, กำแพงพังได้, ประตู, ขอบพื้นที่เฟส, ลำแสงร่าย) = sgSync ใน scene (ไม่โดน batch)
// =====================================================================
function buildFcs(){
  const M=MAPS.fcs,F=M.fcs,D=FCS_DATA,C=FCS_C,T=TERR,c3=C*S3;
  scene.fog.color.set('#c9b8a0');scene.fog.near=120;scene.fog.far=480;
  hemi.color.set('#ffe6c8');hemi.groundColor.set('#4a5a3a');hemi.intensity=0.8;moonL.intensity=1.45;moonL.color.set('#fff0dc');
  const surf=(i,j)=>parseInt(D.S[clamp(Math.floor(j/2),0,D.h-1)*D.w+clamp(Math.floor(i/2),0,D.w-1)],36);
  // พื้น: หญ้าทั้งแผนที่ + พื้นหินปราสาททับตรงช่องพื้นผิวหิน
  const gm=grLive(new THREE.MeshStandardMaterial({map:grassTex('#4f7a38',23,1),roughness:0.95}));
  const gr=new THREE.Mesh(terrGeo((i,j)=>T.g[j*T.nx+i],T.nx,T.ny,T.c,1),gm);gr.receiveShadow=true;addW(gr);
  const fl=new THREE.Mesh(terrGeo((i,j)=>{const a=[[i,j],[i-1,j],[i,j-1],[i-1,j-1]].every(([a,b])=>surf(Math.max(0,a),Math.max(0,b))===2);return a?T.g[j*T.nx+i]+0.03:NaN;},T.nx,T.ny,T.c,1),fcsCastleMat('f','#b4a68e',{fr:1.3,fc:1.0,moss:0.35}));fl.receiveShadow=true;addW(fl);
  // กำแพงจากตาราง (InstancedMesh ต่อชนิด)
  const m4=new THREE.Matrix4(),cells=[[],[],[],[]];
  for(let y=0;y<D.h;y++)for(let x=0;x<D.w;x++){const v=parseInt(D.W[y*D.w+x],36);if(v&&!fcsCut(x,y))cells[v].push([x,y]);}
  const inst=(geo,mat,list,fn)=>{if(!list.length)return;const im=new THREE.InstancedMesh(geo,mat,list.length);list.forEach((q,i)=>im.setMatrixAt(i,fn(q)));im.castShadow=im.receiveShadow=true;addW(im);return im;};
  const box=sGeo(THREE.BoxGeometry,1,1,1);
  try{fcsCastle();}catch(e){console.error('fcsCastle',e);}
  try{fcsRoomsView();}catch(e){console.error('fcsRoomsView',e);}
  try{fcsPropsBuild();}catch(e){console.error('fcsPropsBuild',e);}   // breakable room props (js/28-fcs-props.js)   // room pieces (js/02-room-*.js view)   // solid walls (type 1) = castle walls, towers, banners, outer wall + keep (js/28-fcs-castle.js)
  inst(box,stoneMat(1,1,'#9a8a6a'),cells[2],([x,y])=>{const px=(x+0.5)*C,py=(y+0.5)*C,b=GY(px,py);return m4.makeScale(c3,FCS_WH[2],c3).setPosition(tx(px),b+FCS_WH[2]/2,tz(py)).clone();});
  fcsFences(F.fences||[],inst,box);   // รั้วไม้ (ชนิด 3)
  if(F.bridge)try{fcsBridge(F.bridge);}catch(e){console.error('fcsBridge',e);}
  // ต้นไม้ / ลัง / เสา
  const P=k=>F.props.filter(q=>q[0]===k);
  const inF=q=>q[1]<FF_X1*C,fb=[];   // ต้นไม้ในป่า = กรวยชั่วคราว จนกว่าโมเดลสนจริงโหลดเสร็จ (js/28-fcs-forest.js)
  fb.push(inst(sGeo(THREE.CylinderGeometry,0.22,0.32,1,7),new THREE.MeshStandardMaterial({color:'#5a3f28',roughness:0.95}),P('tr').filter(inF),([,x,y])=>m4.makeScale(1,3,1).setPosition(tx(x),GY(x,y)+1.5,tz(y)).clone()));
  fb.push(inst(sGeo(THREE.ConeGeometry,1.5,1,8),new THREE.MeshStandardMaterial({color:'#2f5a2a',roughness:0.9,flatShading:true}),P('tr').filter(inF),([,x,y])=>m4.makeScale(1,4.5,1).setPosition(tx(x),GY(x,y)+4.6,tz(y)).clone()));
  inst(sGeo(THREE.CylinderGeometry,0.22,0.32,1,7),new THREE.MeshStandardMaterial({color:'#5a3f28',roughness:0.95}),P('tr').filter(q=>!inF(q)),([,x,y])=>m4.makeScale(1,3,1).setPosition(tx(x),GY(x,y)+1.5,tz(y)).clone());
  inst(sGeo(THREE.ConeGeometry,1.5,1,8),new THREE.MeshStandardMaterial({color:'#2f5a2a',roughness:0.9,flatShading:true}),P('tr').filter(q=>!inF(q)),([,x,y])=>m4.makeScale(1,4.5,1).setPosition(tx(x),GY(x,y)+4.6,tz(y)).clone());
  inst(box,new THREE.MeshStandardMaterial({color:'#8a6238',roughness:0.85}),P('cr'),([,x,y])=>m4.makeScale(1.25,1.2,1.25).setPosition(tx(x),GY(x,y)+0.6,tz(y)).clone());
  inst(sGeo(THREE.CylinderGeometry,0.65,0.75,1,10),fcsCastleMat('s','#c2b298'),P('pl'),([,x,y])=>m4.makeScale(1,6,1).setPosition(tx(x),GY(x,y)+3,tz(y)).clone());
  // แท่นจุดเกิด (สีทีม)
  for(const [t,L] of [[0,F.sp.A],[1,F.sp.B]])for(const k in L){const s=L[k],m=new THREE.Mesh(new THREE.CircleGeometry(SG_SPR*S3,32),new THREE.MeshBasicMaterial({color:TEAMC[t],transparent:true,opacity:0.18,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(tx(s.x),GY(s.x,s.y)+0.05,tz(s.y));addW(m);}
  try{fcsForest(fb);}catch(e){console.error('fcsForest',e);}
}
// L-shaped stone bridge (js/02-fcs.js bridge): arched spans (extruded shape, piers 1.6 m), corner block, ramps, crenellated parapet.
// Starts as the full code-built bridge; when the Blender shell (map_fcs_bridge, assets/src/fcs_bridge_build.py) loads it swaps to
// an inset core + the pre-broken shell chunks (fcsShellBuild). Shell chunk states come from BSKN (js/12-fcs-bridge.js).
function fcsBridge(B){
  const pm=stoneMat(1,1,'#a49a88'),grp=new THREE.Group();
  FCSB.grp=grp;FCSB.B=B;FCSB.shell=null;FCSB.sv=-1;FCSB.full=fcsCore(B,false);grp.add(FCSB.full);
  // parapet: per unit (B.parU) one base-wall segment + one merlon; each unit breaks via BRK (fcsParView). Rubble lumps hidden until broken.
  const DH=B.DH,m4=new THREE.Matrix4(),q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),U=B.parU,box=sGeo(THREE.BoxGeometry,1,1,1),FP=FCSB;
  FP.base=[];FP.mer=[];FP.rub=[];FP.st=new Int8Array(U.length);FP.off=-1;
  const mk=(n,m)=>{const im=new THREE.InstancedMesh(box,m,n);im.castShadow=im.receiveShadow=true;grp.add(im);return im;};
  FP.imB=mk(U.length,pm);FP.imM=mk(U.length,pm);FP.imR=mk(U.length,pm);
  FP.imC=mk(1200,pm);FP.imC.count=0;FP.nC=0;FP.fall=[];FP.t0=0;   // fallen chunks (sim then rest)
  const W1=new THREE.Color(1,1,1);
  U.forEach((u,k)=>{q.setFromAxisAngle(Y,-u.a);const X=tx(u.x),Z=tz(u.y),sl=u.seg*S3+0.02;
    FP.base[k]=[new THREE.Vector3(X,DH+0.25,Z),q.clone(),new THREE.Vector3(sl,0.5,0.45)];
    FP.mer[k]=[new THREE.Vector3(X,DH+0.85,Z),q.clone(),new THREE.Vector3(1.0,0.75,0.5)];
    FP.rub[k]=[new THREE.Vector3(X,DH+0.13,Z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0.06,-u.a,0.08*((k%3)-1))),new THREE.Vector3(sl*0.96,0.26,0.45)];   // broken = jagged stump stays on the edge
    FP.imB.setMatrixAt(k,m4.compose(...FP.base[k]));FP.imM.setMatrixAt(k,m4.compose(...FP.mer[k]));FP.imR.setMatrixAt(k,m4.makeScale(0,0,0));
    FP.imB.setColorAt(k,W1);FP.imM.setColorAt(k,W1);FP.imR.setColorAt(k,W1);});
  for(const im of [FP.imB,FP.imM,FP.imR]){im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true;}
  addW(grp);
  loadModel('map_fcs_bridge').then(r=>{if(r&&FCSB.grp===grp&&BSKN.C.length)try{fcsShellBuild(r.scene,B);}catch(e){console.error('fcsShellBuild',e);}});
}
// bridge body. inset=false: full solid (no shell model). inset=true: core behind the shell — sides pulled in by BSKV.shell,
// top BSKV.rimH pulled in by BSKV.rimW on both deck edges (rim chunks fill it), darker rough stone shows where the shell broke
// exposed rubble core (where shell chunks fell off): irregular stones in mortar, world-space cells, no brick texture
function fcsRubbleMat(){
  if(FCSB.rubM)return FCSB.rubM;const m=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1});
  m.onBeforeCompile=sh=>{
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vRP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvRP=(modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vRP;'+
      'vec2 rbH(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}'+
      'float rbN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=rbH(i).x,b=rbH(i+vec2(1.,0.)).x,c=rbH(i+vec2(0.,1.)).x,d=rbH(i+vec2(1.,1.)).x;return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}')
      .replace('#include <map_fragment>','#include <map_fragment>\n'+
      'vec2 q=vec2((vRP.x+vRP.z)*1.5,vRP.y*3.1);q+=vec2(rbN(q*0.6),rbN(q*0.6+5.))*0.7-0.35;vec2 ip=floor(q),fp=fract(q);float d1=8.,d2=8.;vec2 id=vec2(0.);'+
      'for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 g=vec2(float(i),float(j)),o=rbH(ip+g)*0.8+0.1,r=g+o-fp;float d=dot(r,r);if(d<d1){d2=d1;d1=d;id=ip+g;}else if(d<d2)d2=d;}'+
      'float edge=sqrt(d2)-sqrt(d1),h=rbH(id).y,nz=rbN(vRP.xy*9.+vRP.z*7.);'+
      'vec3 stone=mix(vec3(0.30,0.27,0.23),vec3(0.46,0.42,0.36),h)*(0.7+0.45*nz);vec3 mortar=vec3(0.24,0.17,0.11)*(0.75+0.5*nz);'+
      'diffuseColor.rgb=mix(mortar,stone,smoothstep(0.02,0.12+0.08*nz,edge));if(rbN(vRP.zy*23.+vRP.x*5.)>0.78)diffuseColor.rgb*=0.6;');};
  m.customProgramCacheKey=()=>'fcsRubble';return FCSB.rubM=m;
}
function fcsCore(B,inset){
  const g=new THREE.Group(),pm=inset?stoneMat(1,1,'#958b7c'):stoneMat(1,1,'#a49a88'),rb=inset?fcsRubbleMat():pm,dark=stoneMat(1,1,'#8a8070'),W=B.HW*2*S3,DH=B.DH;
  // material arrays: extrude [caps = side faces, sides = top/bottom/arch soffit] • box [+x,-x,+y,-y,+z,-z]
  const mat=[rb,pm],boxZ=[pm,pm,pm,pm,rb,rb];
  const Ts=inset?BSKV.shell:0,RW=BSKV.rimW,RH=inset?BSKV.rimH:0;
  const add=(geo,m,x,y,z,ry)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.rotation.y=ry||0;o.castShadow=o.receiveShadow=true;g.add(o);return o;};
  for(const s of B.spans){const L=Math.hypot(s.x2-s.x1,s.y2-s.y1)*S3,r=(L-1.6)/2,ux=(s.x2-s.x1)/(L/S3),uy=(s.y2-s.y1)/(L/S3),ry=-Math.atan2(uy,ux);
    const mx=(s.x1+s.x2)/2,my=(s.y1+s.y2)/2,base=Math.min(GY(s.x1,s.y1),GY(s.x2,s.y2),GY(mx,my))-1.2,top=DH-RH-base,spring=DH-1.3-r-base;
    const sh=new THREE.Shape();sh.moveTo(-L/2,0);sh.lineTo(-r,0);sh.lineTo(-r,spring);sh.absarc(0,spring,r,Math.PI,0,true);sh.lineTo(r,0);sh.lineTo(L/2,0);sh.lineTo(L/2,top);sh.lineTo(-L/2,top);sh.lineTo(-L/2,0);
    const geo=new THREE.ExtrudeGeometry(sh,{depth:W-2*Ts,bevelEnabled:false,curveSegments:14});geo.translate(0,0,-(W-2*Ts)/2);
    add(geo,mat,tx(mx),base,tz(my),ry);
    if(inset)add(sGeo(THREE.BoxGeometry,L,RH,W-2*RW),boxZ,tx(mx),DH-RH/2,tz(my),ry);   // deck core between the rims
    else add(sGeo(THREE.BoxGeometry,L,0.25,W+0.5),dark,tx(mx),DH-0.2,tz(my),ry);}       // string course
  {const x=B.ax,y=B.cy,base=GY(x,y)-1.2,h=DH-RH-base;
   if(inset){const t=Ts*20,rw=RW*20,HW=B.HW;
     const cb=[pm,rb,pm,pm,pm,rb];   // west (-x) + north (-z) faces are behind the shell
     add(sGeo(THREE.BoxGeometry,W-Ts,h,W-Ts),cb,tx(x+t/2),base+h/2,tz(y+t/2));
     add(sGeo(THREE.BoxGeometry,W-RW,RH,W-RW),cb,tx(x+rw/2),DH-RH/2,tz(y+rw/2));}
   else{add(sGeo(THREE.BoxGeometry,W+0.4,DH-base,W+0.4),pm,tx(x),base+(DH-base)/2,tz(y));add(sGeo(THREE.BoxGeometry,W+0.9,0.25,W+0.9),dark,tx(x),DH-0.2,tz(y));}}
  for(const [alongY,L,gEnd] of [[true,B.LS,B.gS],[false,B.LE,B.gE]]){const Lm=L*S3,x0=alongY?B.ax:B.xE,y0=alongY?B.yS:B.cy,base=Math.min(GY(x0,y0),gEnd)-1.2,Wr=W-2*Ts;
    const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(Lm+0.3,0);sh.lineTo(Lm+0.3,gEnd-base-0.05);sh.lineTo(0,DH-base);sh.lineTo(0,0);
    const geo=new THREE.ExtrudeGeometry(sh,{depth:Wr,bevelEnabled:false});geo.translate(0,0,-Wr/2);
    add(geo,mat,tx(x0),base,tz(y0),alongY?-Math.PI/2:0);}
  return g;
}
// bridge runtime view: parapet break stages (BRK) + shell chunk states (BSKN). Called every frame from the render loop.
const FCSB={grp:null,B:null,full:null,core:null,shell:null,sv:-1,tex:null,blk:null};
function fcsParView(){
  const P=FCSB,U=P.B&&P.B.parU;if(!U||!P.imM||P.grp.parent!==world)return;
  if(P.off<0){P.off=BRK.findIndex(g=>g.d&&g.d.fp===0);if(P.off<0)return;}
  const m4=new THREE.Matrix4(),c=new THREE.Color(),e=new THREE.Euler();let ch=false;
  for(let k=0;k<U.length;k++){const g=BRK[P.off+k];if(!g)break;const st=g.st|0;if(st===P.st[k])continue;P.st[k]=st;ch=true;
    if(st>=3){P.imB.setMatrixAt(k,m4.makeScale(0,0,0));P.imM.setMatrixAt(k,m4.makeScale(0,0,0));P.imR.setMatrixAt(k,m4.compose(...P.rub[k]));P.imR.setColorAt(k,c.setRGB(0.75,0.72,0.68));continue;}
    const [pp,pq,ps]=P.mer[k],t=st===2?0.62:st===1?0.82:1;c.setRGB(t,t*0.98,t*0.95);
    const q2=pq.clone().multiply(new THREE.Quaternion().setFromEuler(e.set(st*0.06,0,st*0.09*((k%2)*2-1))));
    P.imM.setMatrixAt(k,m4.compose(new THREE.Vector3(pp.x,pp.y-(st===2?0.18:0),pp.z),q2,new THREE.Vector3(ps.x*(st===2?0.8:1),ps.y*(st===2?0.7:1),ps.z)));
    P.imM.setColorAt(k,c);P.imB.setColorAt(k,c);P.imB.setMatrixAt(k,m4.compose(...P.base[k]));P.imR.setMatrixAt(k,m4.makeScale(0,0,0));}
  if(ch)for(const im of [P.imB,P.imM,P.imR]){im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true;}
}
// shell material: per-chunk state from a 64x32 data texture (r = stage). Stage 1/2 = darker + crack lines + pushed out a bit,
// stage 3 = vertices collapsed (chunk gone, a falling copy is spawned by fcsShellView). Same vertex code on the shadow depth material.
const FSH_V='attribute vec4 cd;uniform sampler2D uSt;varying float vSt;varying vec3 vP;';
const FSH_B='float stc=floor(texture2D(uSt,vec2((mod(cd.x,64.)+.5)/64.,(floor(cd.x/64.)+.5)/32.)).r*255.+.5);vSt=stc;vP=transformed;'+
  'if(stc>2.5)transformed=vec3(0.,-500.,0.);else{float lo=step(1.-0.3*stc,cd.w);transformed.xz+=cd.yz*(stc*0.012+lo*stc*0.035);transformed.y-=lo*stc*0.02;}';   // cracked: some blocks work loose
function fcsShellMat(tex){
  const inj=sh=>{sh.uniforms.uSt={value:tex};sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+FSH_V).replace('#include <begin_vertex>','#include <begin_vertex>\n'+FSH_B);};
  const m=stoneMat(1,1,'#a49a88').clone();
  m.onBeforeCompile=sh=>{inj(sh);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vSt;varying vec3 vP;'+
      'float fsH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}'+
      'float fsN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(fsH(i),fsH(i+vec2(1.,0.)),f.x),mix(fsH(i+vec2(0.,1.)),fsH(i+vec2(1.,1.)),f.x),f.y);}')
      .replace('#include <map_fragment>','#include <map_fragment>\nif(vSt>0.5){vec2 q=vec2(vP.x+vP.z,vP.y)*2.2;float c1=abs(fsN(q)*2.-1.),c2=abs(fsN(q*1.9+7.)*2.-1.);'+
        'float w=0.035*vSt;diffuseColor.rgb*=(1.-0.09*vSt)*(1.-0.65*(1.-smoothstep(0.,w,min(c1,c2))));}');};
  m.customProgramCacheKey=()=>'fcsShell';
  const d=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});d.onBeforeCompile=inj;d.customProgramCacheKey=()=>'fcsShellD';
  return [m,d];
}
// split one chunk geometry into its stone blocks (blocks share corner positions, joints keep blocks apart)
// -> per-vertex block random (cd.w) + block boxes {x,y,z,sx,sy,sz} for the falling copies
function fcsBlocks(g,cd){
  const p=g.attributes.position.array,n=p.length/3,par=new Int32Array(n);for(let i=0;i<n;i++)par[i]=i;
  const fd=i=>{while(par[i]!==i){par[i]=par[par[i]];i=par[i];}return i;},un=(a,b)=>{a=fd(a);b=fd(b);if(a!==b)par[a]=b;};
  const ix=g.index?g.index.array:null;
  if(ix)for(let t=0;t<ix.length;t+=3){un(ix[t],ix[t+1]);un(ix[t],ix[t+2]);}else for(let t=0;t<n;t+=3){un(t,t+1);un(t,t+2);}
  const key=new Map();for(let i=0;i<n;i++){const k=Math.round(p[i*3]*400)+','+Math.round(p[i*3+1]*400)+','+Math.round(p[i*3+2]*400),o=key.get(k);if(o===undefined)key.set(k,i);else un(i,o);}
  const comp=new Map(),out=[];
  for(let i=0;i<n;i++){const r=fd(i);let b=comp.get(r);if(!b){b={a:[1e9,1e9,1e9],b:[-1e9,-1e9,-1e9],rnd:Math.abs(Math.sin(r*12.9898+p[i*3]*78.233)*43758.5453)%1};comp.set(r,b);out.push(b);}
    for(let k=0;k<3;k++){const v=p[i*3+k];if(v<b.a[k])b.a[k]=v;if(v>b.b[k])b.b[k]=v;}cd[i*4+3]=b.rnd;}
  return out.map(b=>({x:(b.a[0]+b.b[0])/2,y:(b.a[1]+b.b[1])/2,z:(b.a[2]+b.b[2])/2,sx:b.b[0]-b.a[0],sy:b.b[1]-b.a[1],sz:b.b[2]-b.a[2]}));
}
// model loaded: merge all chunks c<i> into one mesh with attribute cd = (chunk id, outward nx, nz, rim), swap code bridge -> core + shell
function fcsShellBuild(sc,B){
  const P=FCSB;sc.updateMatrixWorld(true);const geos=[],blk=new Map();fcsShellClear();
  sc.traverse(o=>{if(!o.isMesh||!/^c\d+$/.test(o.name))return;const id=+o.name.slice(1),c=BSKN.C[id];if(!c)return;const f=BSKN.F[c.f];
    const g=o.geometry.clone().applyMatrix4(o.matrixWorld);for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);
    if(!g.attributes.uv)return;const n=g.attributes.position.count,cd=new Float32Array(n*4),nx=f.ax==='y'?f.n:0,nz=f.ax==='y'?0:f.n;
    for(let k=0;k<n;k++){cd[k*4]=id;cd[k*4+1]=nx;cd[k*4+2]=nz;}
    blk.set(id,fcsBlocks(g,cd));g.setAttribute('cd',new THREE.BufferAttribute(cd,4));geos.push(g);});
  if(!geos.length)return;
  const geo=mergeGeometries(geos,false);if(!geo)return;
  const tex=new THREE.DataTexture(new Uint8Array(64*32*4),64,32,THREE.RGBAFormat);tex.needsUpdate=true;
  const [m,d]=fcsShellMat(tex),mesh=new THREE.Mesh(geo,m);mesh.customDepthMaterial=d;mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;
  P.grp.remove(P.full);disposeTree(P.full);P.full=null;P.core=fcsCore(B,true);P.grp.add(P.core,mesh);
  P.shell=mesh;P.tex=tex;P.blk=blk;P.prev=new Uint8Array(BSKN.C.length);P.sv=-1;gl.shadowMap.needsUpdate=true;
}
// parapet unit broke (brk event): spawn chunks — most fall outward off the bridge to the ground, a few drop on the deck
function fcsParFall(ev){
  const P=FCSB,g=BRK[ev.i];if(!P.B||!g||!g.d||g.d.fp==null)return;const u=P.B.parU[g.d.fp];if(!u)return;
  const R=Math.random,n=5+(R()*3|0);
  for(let k=0;k<n;k++){const out=k<n-2,sp=out?2+R()*3:0.6+R()*1.2,side=(R()-0.5)*1.4;
    P.fall.push({x:tx(u.x)+(u.ny?side:0),z:tz(u.y)+(u.nx?side:0),y:P.B.DH+0.6+R()*0.6,vx:(out?u.nx:-u.nx)*sp+(R()-0.5)*1.5,vz:(out?u.ny:-u.ny)*sp+(R()-0.5)*1.5,vy:1+R()*2.5,
      rx:R()*6,ry:R()*6,rz:R()*6,w:R()*8-4,s:0.35+R()*0.35});}
}
function fcsFallTick(dt){
  const P=FCSB;if(!P.imC)return;dt=Math.min(0.05,dt||0);if(!P.fall.length||!(dt>0))return;
  const B=P.B,m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),onDeck=(X,Z)=>{const x=X*20+MW/2,y=Z*20+MH/2;return [B.ns,B.ew].some(r=>x>r.x1&&x<r.x2&&y>r.y1&&y<r.y2);};
  for(let i=P.fall.length-1;i>=0;i--){const f=P.fall[i];f.vy-=14*dt;f.x+=f.vx*dt;f.z+=f.vz*dt;f.y+=f.vy*dt;f.rx+=f.w*dt;f.rz+=f.w*0.7*dt;
    const floor=(onDeck(f.x,f.z)?B.DH:TW(f.x,f.z))+f.s*0.3;
    if(f.y<=floor&&f.vy<0){f.y=floor;if(Math.abs(f.vy)>3){f.vy*=-0.3;f.vx*=0.5;f.vz*=0.5;f.w*=0.5;}else f.done=1;}
    if(f.k===undefined){if(P.freeC&&P.freeC.length)f.k=P.freeC.pop();else if(P.nC>=1200){P.fall.splice(i,1);continue;}else f.k=P.nC++;}
    P.imC.setMatrixAt(f.k,m4.compose(new THREE.Vector3(f.x,f.y,f.z),q.setFromEuler(e.set(f.done?0.1:f.rx,f.ry,f.done?0.05:f.rz)),new THREE.Vector3(f.s*1.4,f.s*0.6,f.s*0.8)));
    if(f.done){P.fall.splice(i,1);(P.restC||(P.restC=[])).push({k:f.k,t:performance.now(),m:m4.clone()});}}
  P.imC.count=P.nC;P.imC.instanceMatrix.needsUpdate=true;
}
// per frame: push chunk stages into the data texture; a chunk that just broke drops its stones one by one into a rubble pile
function fcsShellView(dt){
  fcsFallTick(dt);fcsPileTick(dt);fcsRubbleFade();
  const P=FCSB;if(!P.shell||P.grp.parent!==world||P.sv===BSKN.ver)return;P.sv=BSKN.ver;
  const D=P.tex.image.data;
  for(const c of BSKN.C){const st=c.st|0;D[c.i*4]=st;if(st>=3&&P.prev[c.i]<3&&P.prev.ok)fcsShellFall(c);P.prev[c.i]=st;}
  P.prev.ok=1;P.tex.needsUpdate=true;gl.shadowMap.needsUpdate=true;
}
// fallen stones: one InstancedMesh (unit box scaled to each block), simple tumble, then they stack on a 0.4 m height grid -> piles at the wall foot
const FPILE={im:null,n:0,cap:7400,live:[],h:new Map(),m4:null,q:null,e:null,free:[],rest:[],cnt:new Map()};
// rubble is visual only (no collision) -> like other wreckage it sinks into the ground and vanishes after BF_LIFE s; freed slots are reused
const _rfP=new THREE.Vector3(),_rfQ=new THREE.Quaternion(),_rfS=new THREE.Vector3();
function fcsFadeList(im,list,free,gone){if(!im||!list||!list.length)return false;const now=performance.now(),L=BF_LIFE*1000,F=BF_FADE*1000;let up=false;
  for(let i=list.length-1;i>=0;i--){const r=list[i],age=now-r.t;if(age<L-F)continue;const k=Math.max(0,(L-age)/F);
    r.m.decompose(_rfP,_rfQ,_rfS);_rfS.multiplyScalar(k);_rfP.y-=(1-k)*0.3;im.setMatrixAt(r.k,_rfS.x>0?new THREE.Matrix4().compose(_rfP,_rfQ,_rfS):new THREE.Matrix4().makeScale(0,0,0));up=true;
    if(k<=0){list.splice(i,1);free.push(r.k);if(gone)gone(r);}}
  if(up)im.instanceMatrix.needsUpdate=true;return up;}
function fcsRubbleFade(){const F=FPILE,P=FCSB;let up=false;
  up=fcsFadeList(F.im,F.rest,F.free,r=>{const n=(F.cnt.get(r.c)||1)-1;if(n>0)F.cnt.set(r.c,n);else{F.cnt.delete(r.c);F.h.delete(r.c);}})||up;
  if(P.imC)up=fcsFadeList(P.imC,P.restC,P.freeC||(P.freeC=[]))||up;
  if(up)gl.shadowMap.needsUpdate=true;}
function fcsShellFall(c){
  const P=FCSB,bl=P.blk&&P.blk.get(c.i);if(!bl)return;const f=BSKN.F[c.f],nx=f.ax==='y'?f.n:0,nz=f.ax==='y'?0:f.n,R=Math.random,F=FPILE;
  if(!F.im){F.im=new THREE.InstancedMesh(sGeo(THREE.BoxGeometry,1,1,1),stoneMat(1,1,'#c4baa6'),F.cap);F.im.count=0;F.im.castShadow=F.im.receiveShadow=true;F.im.frustumCulled=false;F.m4=new THREE.Matrix4();F.q=new THREE.Quaternion();F.e=new THREE.Euler();}
  if(F.im.parent!==P.grp)P.grp.add(F.im);
  for(const b of bl){const k=F.free.length?F.free.pop():F.n<F.cap?F.n++:-1;if(k<0)break;const sp=c.rim?0.6+R()*1.4:0.1+R()*0.6,dl=R()*0.25;
    F.live.push({k,x:b.x,y:b.y,z:b.z,sx:Math.max(0.12,b.sx),sy:Math.max(0.12,b.sy),sz:Math.max(0.12,b.sz),vx:nx*sp+(R()-0.5)*0.35,vz:nz*sp+(R()-0.5)*0.35,vy:R()*0.8,
      rx:0,ry:0,rz:0,wx:(R()-0.5)*6,wy:(R()-0.5)*3,wz:(R()-0.5)*6,t:-dl});}
  F.im.count=F.n;
}
function fcsPileTick(dt){
  const F=FPILE;if(!F.live.length)return;dt=Math.min(0.05,dt||0);if(!(dt>0))return;const c=0.4,H=F.h;
  const top=(x,z,hx,hz)=>{let m=-1e9;for(let i=Math.floor((x-hx)/c);i<=Math.floor((x+hx)/c);i++)for(let j=Math.floor((z-hz)/c);j<=Math.floor((z+hz)/c);j++){const v=H.get(i*7919+j);if(v!==undefined&&v>m)m=v;}return m;};
  for(let i=F.live.length-1;i>=0;i--){const o=F.live[i];o.t+=dt;if(o.t<0)continue;
    o.vy-=14*dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.z+=o.vz*dt;o.rx+=o.wx*dt;o.ry+=o.wy*dt;o.rz+=o.wz*dt;
    const hx=Math.max(o.sx,o.sz)*0.35,hz=hx,fl=Math.max(TW(o.x,o.z),top(o.x,o.z,0,0));
    let rest=false;if(o.y-o.sy*0.5<=fl&&o.vy<0){o.y=fl+o.sy*0.5;if(o.vy<-4){o.vy*=-0.22;o.vx*=0.5;o.vz*=0.5;o.wx*=0.4;o.wz*=0.4;}else rest=true;}
    if(rest){   // angle of repose: roll down to a lower neighbour cell while the pile is steeper than ~1 block per cell
      for(let it=0;it<14;it++){const h0=Math.max(TW(o.x,o.z),top(o.x,o.z,0,0));let bx=0,bz=0,bh=h0-0.32;   // point samples (cell heights)
        for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const h=Math.max(TW(o.x+dx*c,o.z+dz*c),top(o.x+dx*c,o.z+dz*c,0,0))+Math.random()*0.04;if(h<bh){bh=h;bx=dx;bz=dz;}}
        if(!bx&&!bz){o.y=Math.max(TW(o.x,o.z),top(o.x,o.z,0,0))+o.sy*0.5;break;}o.x+=bx*c;o.z+=bz*c;o.y=Math.max(TW(o.x,o.z),top(o.x,o.z,0,0))+o.sy*0.5;}
      o.rx=(Math.random()-0.5)*0.35;o.rz=(Math.random()-0.5)*0.35;const tp=o.y+o.sy*0.65;   // loose packing: a pile grows faster than solid stone   // settle almost flat, add to the pile height
      {const k=Math.floor(o.x/c)*7919+Math.floor(o.z/c);if(!(H.get(k)>tp))H.set(k,tp);o.c=k;F.cnt.set(k,(F.cnt.get(k)||0)+1);}}   // one cell per stone
    F.q.setFromEuler(F.e.set(o.rx,o.ry,o.rz));F.im.setMatrixAt(o.k,F.m4.compose(new THREE.Vector3(o.x,o.y,o.z),F.q,new THREE.Vector3(o.sx,o.sy,o.sz)));
    if(rest){F.live.splice(i,1);F.rest.push({k:o.k,c:o.c,t:performance.now(),m:F.m4.clone()});}}
  F.im.instanceMatrix.needsUpdate=true;gl.shadowMap.needsUpdate=true;
}
// Dev repair / new round: clear the piles
function fcsShellClear(){const F=FPILE;F.live.length=0;F.h.clear();F.n=0;F.free.length=0;F.rest.length=0;F.cnt.clear();if(F.im)F.im.count=0;const P=FCSB;if(P.imC){P.nC=0;P.fall.length=0;P.imC.count=0;P.restC=[];P.freeC=[];}}
// รั้วไม้ (ชนิด 3 — js/02-fcs.js fences): เสาไม้ทุก ~1.8 ม. เอียงนิด ๆ + ราว 2 เส้นต่อช่วงเสา ตามพื้นเอียง • InstancedMesh 2 ชุด
// จำ index เสา/ราวของแต่ละช่วงไว้ใน EFS3 (ลำดับช่วงเดียวกับ EFS.S ของ js/12-efs.js) → efsView ทำไหม้ดำ / พังหาย / เปลวไฟ
const EFS3={sec:[],posts:null,rails:null,pm:[],rm:[],acc:0};
function fcsFences(list,inst,box){
  EFS3.sec=[];EFS3.pm=[];EFS3.rm=[];EFS3.posts=EFS3.rails=null;
  if(!list.length)return;const R=mulberry(424242),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),X=new THREE.Vector3(1,0,0),d=new THREE.Vector3(),pos=new THREE.Vector3(),sc=new THREE.Vector3();
  const posts=[],rails=[];
  for(const [x1,y1,x2,y2] of list){const n=Math.max(1,Math.round(Math.hypot(x2-x1,y2-y1)*S3/EFSV.sec)),P=[],p0=posts.length;
    for(let i=0;i<=n;i++){const x=x1+(x2-x1)*i/n,y=y1+(y2-y1)*i/n,g=GY(x,y),hp=1.22+(R()-0.5)*0.14;P.push([tx(x),g,tz(y)]);
      const pp=pos.set(tx(x),g+hp/2-0.05,tz(y)).clone(),pq=q.setFromEuler(e.set((R()-0.5)*0.08,R()*3.14,(R()-0.5)*0.08)).clone();
      EFS3.pm.push([pp,pq,hp,g]);posts.push(m4.compose(pp,pq,sc.set(0.15,hp,0.15)).clone());}
    for(let i=0;i<n;i++){const [ax,ay,az]=P[i],[bx,by,bz]=P[i+1],r0=rails.length;
      for(const hh of [0.42,0.92]){const ja=(R()-0.5)*0.06,jb=(R()-0.5)*0.06;d.set(bx-ax,(by+jb)-(ay+ja),bz-az);const len=d.length()+0.18;d.normalize();
        rails.push(m4.compose(pos.set((ax+bx)/2,(ay+by)/2+hh+(ja+jb)/2,(az+bz)/2),q.setFromUnitVectors(X,d),sc.set(len,0.1,0.06)).clone());}
      EFS3.sec.push({p:[p0+i,p0+i+1],r:[r0,r0+1],lv:0,dm:0,br:0,acc:0});}}
  EFS3.posts=inst(box,new THREE.MeshStandardMaterial({color:'#6b4c32',roughness:0.95}),posts,mm=>mm);
  EFS3.rails=inst(box,new THREE.MeshStandardMaterial({color:'#8a6a46',roughness:0.9}),rails,mm=>mm);EFS3.rm=rails;
  const W=new THREE.Color(1,1,1);for(const im of [EFS3.posts,EFS3.rails]){for(let i=0;i<im.count;i++)im.setColorAt(i,W);im.instanceColor.needsUpdate=true;}
}
// ภาพไฟรั้ว (ทุกเครื่อง ทุกเฟรม): ไหม้ดำตามแถบความเสียหาย • พัง = ราวหาย เสาที่ไม่มีช่วงเหลือ = ตอดำเตี้ย • เปลว/ควันตามระดับไฟ (เฉพาะใกล้กล้อง)
const _efC=new THREE.Color(),_efM=new THREE.Matrix4(),_efS=new THREE.Vector3(),_efZ=new THREE.Matrix4().makeScale(0,0,0);
function efsView(dt){
  const S=EFS.S,V=EFS3.sec;if(!S.length||V.length!==S.length||!EFS3.posts)return;
  if(NET.isHost)efsHostView();
  const P=EFS3.posts,Rl=EFS3.rails;let dP=false,dR=false;
  const char=(k)=>_efC.setRGB(1-0.72*k,1-0.78*k,1-0.8*k);
  for(let i=0;i<S.length;i++){const s=S[i],v=V[i];
    if(s.dm!==v.dm||s.br!==v.br){v.dm=s.dm;
      if(s.br&&!v.br){v.br=1;for(const r of v.r)Rl.setMatrixAt(r,_efZ);dR=true;
        for(const pi of v.p){const alive=V.some((w,j)=>!S[j].br&&w.p.includes(pi));if(alive)continue;const [pp,pq,hp,g]=EFS3.pm[pi],h2=0.35+0.2*((pi*7)%5)/5;
          _efM.compose(_efS.set(pp.x,g+h2/2-0.05,pp.z),pq,new THREE.Vector3(0.14,h2,0.14));P.setMatrixAt(pi,_efM);P.setColorAt(pi,char(1));dP=true;}}
      else if(!s.br){if(v.br){v.br=0;for(const r of v.r)Rl.setMatrixAt(r,EFS3.rm[r]);for(const pi of v.p){const [pp,pq,hp]=EFS3.pm[pi];P.setMatrixAt(pi,_efM.compose(pp,pq,_efS.set(0.15,hp,0.15)));}}   // dev repair
        char(s.dm/4);for(const r of v.r)Rl.setColorAt(r,_efC);for(const pi of v.p)P.setColorAt(pi,_efC);dP=dR=true;}}
    v.lv=s.br?0:s.lv;}
  if(dP){P.instanceMatrix.needsUpdate=true;if(P.instanceColor)P.instanceColor.needsUpdate=true;}
  if(dR){Rl.instanceMatrix.needsUpdate=true;if(Rl.instanceColor)Rl.instanceColor.needsUpdate=true;}
  // เปลว/ควัน
  if(!(dt>0))return;const cp=cam.position,okFx=PARTS.length<VFXB.cap*0.8,RATE=[0,12,30,55],wv=AIR.str*25,wx=AIR.dir.x*wv,wy=AIR.dir.y*wv;
  for(let i=0;i<S.length;i++){const s=S[i],v=V[i];if(!v.lv||!okFx)continue;
    const dx=tx(s.cx)-cp.x,dz=tz(s.cy)-cp.z;if(dx*dx+dz*dz>4900)continue;
    v.acc+=RATE[v.lv]*dt;const L=v.lv,rad=EFSV.rad[L]*20;
    while(v.acc>=1){v.acc-=1;const u=Math.random(),x=s.x1+(s.x2-s.x1)*u+rnd(-1,1)*rad*0.35,y=s.y1+(s.y2-s.y1)*u+rnd(-1,1)*rad*0.35,g=terrT(x,y);
      flame(x,y,g+rnd(0.05,0.3+0.25*L),{vh:rnd(0.9,1.5)+0.6*L,vx:wx+rnd(-4,4),vy:wy+rnd(-4,4),life:rnd(0.3,0.45)+0.1*L,size:rnd(2.4,3.4)+1.3*L});
      const q=Math.random();
      if(q<0.12*L){const l=rnd(0.8,1.5);PARTS.push({x,y,h:g+0.6+0.3*L,vx:wx*2+rnd(-14,14),vy:wy*2+rnd(-14,14),vh:rnd(1.2,3),life:l,max:l,col:'#ff9a3a',size:1.6,g:1.3,drag:1.2});}
      else if(L>=2&&q>0.93)smoke(x,y,g+1.1+0.3*L,1,'#2b2724',rnd(1.2,1.8),3+1.2*L,10);}}
}
// ---------- ภาพโหมด (ลูกข่ายทุกเครื่องจาก snapshot M.sg) ----------
const SGV3={g:null,cores:[],bw:[],bar:null,barK:'',beams:new Map(),bwK:'',it:[],itK:'',lz:null,lzK:''};
function sgClearView(){if(SGV3.g){scene.remove(SGV3.g);disposeTree(SGV3.g);}SGV3.g=null;SGV3.cores=[];SGV3.bw=[];SGV3.bar=null;SGV3.barK='';SGV3.bwK='';SGV3.beams.clear();SGV3.it=[];SGV3.itK='';SGV3.lz=null;SGV3.lzK='';}
// Map Builder siege map (MAPS[id].fcs from sgFromFile): parts the game draws itself — burnable fences + team spawn pads
// (target walls/gate + cores come from sgViewBuild like on fcs). Called from buildFileMap (js/28-maps-build.js).
function sgFileBuild(id){
  const F=MAPS[id].fcs,box=sGeo(THREE.BoxGeometry,1,1,1);
  const inst=(geo,mat,list,fn)=>{if(!list.length)return;const im=new THREE.InstancedMesh(geo,mat,list.length);list.forEach((q,i)=>im.setMatrixAt(i,fn(q)));im.castShadow=im.receiveShadow=true;addW(im);return im;};
  fcsFences(F.fences||[],inst,box);
  for(const [t,L] of [[0,F.sp.A],[1,F.sp.B]])for(const k in L){const s=L[k],m=new THREE.Mesh(new THREE.CircleGeometry(SG_SPR*S3,32),new THREE.MeshBasicMaterial({color:TEAMC[t],transparent:true,opacity:0.18,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(tx(s.x),GY(s.x,s.y)+0.05,tz(s.y));addW(m);}
}
function sgViewBuild(){
  sgClearView();const F=sgFD(),g=new THREE.Group();scene.add(g);SGV3.g=g;
  F.cores.forEach((k,i)=>{const o=new THREE.Group();o.position.set(tx(k.x),GY(k.x,k.y),tz(k.y));g.add(o);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.4,0.6,8),stoneMat(1,1,'#6a6258'));base.position.y=0.3;base.castShadow=true;o.add(base);
    const cm=new THREE.MeshStandardMaterial({color:'#9fd8ff',emissive:'#3a8cff',emissiveIntensity:1.2,roughness:0.2,transparent:true,opacity:0.92});
    const cr=new THREE.Mesh(new THREE.OctahedronGeometry(0.9,0),cm);cr.scale.set(1,2,1);cr.position.y=2.4;o.add(cr);
    const glow=new THREE.Sprite(glowMat('#7fc0ff',1.4));glow.scale.setScalar(4);glow.position.y=2.4;o.add(glow);
    const ring=sgZoneMesh(k);g.add(ring);   // capture zone boundary (any shape, js/15-siege sgZone)
    const rub=new THREE.Group();for(let q=0;q<6;q++){const m=new THREE.Mesh(sGeo(THREE.OctahedronGeometry,0.4,0),cm);m.position.set(Math.cos(q)*0.9,0.7,Math.sin(q*1.7)*0.9);m.rotation.set(q,q*2,0);rub.add(m);}rub.visible=false;o.add(rub);
    for(const ch of [base,cr,glow,rub]){ch.scale.multiplyScalar(1.8);ch.position.y*=1.8;}   // แมพขยาย 3 เท่า → แกนใหญ่ขึ้นให้เห็นจากไกล
    SGV3.cores.push({o,cr,cm,glow,ring,rub});});
  F.bw.forEach((b,i)=>{const cx=b.x+b.w/2,cy=b.y+b.d/2,o=new THREE.Group();o.position.set(tx(cx),GY(cx,cy),tz(cy));g.add(o);
    if(b.k==='gate'){const n=Math.max(2,Math.round(Math.max(b.w,b.d)/20)),horiz=b.w>=b.d;
      for(let q=0;q<n;q++){const t=(q+0.5)/n-0.5,m=new THREE.Mesh(sGeo(THREE.BoxGeometry,0.18,1,0.18),new THREE.MeshStandardMaterial({color:'#3a3a40',metalness:0.6,roughness:0.5}));m.scale.y=b.h;m.position.set(horiz?t*b.w*S3:0,b.h/2,horiz?0:t*b.d*S3);m.castShadow=true;o.add(m);}
      const top=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,0.3,1),new THREE.MeshStandardMaterial({color:'#4a4040',metalness:0.5}));top.scale.set(Math.max(0.3,b.w*S3),1,Math.max(0.3,b.d*S3));top.position.y=b.h;o.add(top);}
    else{const vh=MAPID==='fcs'&&fcsCut(Math.floor(cx/FCS_C),Math.floor(cy/FCS_C))?Math.min(b.h,5.55):b.h;   // inside a room piece: stay under the gallery deck (6 m)
      const m=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),stoneMat(1,1,'#b08a60'));m.scale.set(b.w*S3,vh,b.d*S3);m.position.y=vh/2;m.castShadow=m.receiveShadow=true;o.add(m);
      const cr=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),new THREE.MeshBasicMaterial({color:'#ffcf6a',transparent:true,opacity:0.18,depthWrite:false}));cr.scale.set(b.w*S3+0.08,vh+0.08,b.d*S3+0.08);cr.position.y=vh/2;o.add(cr);}   // ขอบสีทอง = พังได้
    SGV3.bw.push(o);});
}
// glowing curtain along the capture zone outline (union: edge pieces inside another shape of the same zone are skipped), follows the ground
function sgZoneMesh(k){
  const Z=sgZone(k),pos=[],H=2.2,step=40;
  const inOther=(P,x,y)=>Z.some(Q=>Q!==P&&sgPolyIn(Q,x,y));
  for(const P of Z)for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(L/step));
    for(let j=0;j<n;j++){const x0=a[0]+(b[0]-a[0])*j/n,y0=a[1]+(b[1]-a[1])*j/n,x1=a[0]+(b[0]-a[0])*(j+1)/n,y1=a[1]+(b[1]-a[1])*(j+1)/n;
      if(inOther(P,(x0+x1)/2,(y0+y1)/2))continue;const b0=GY(x0,y0)+0.05,b1=GY(x1,y1)+0.05;
      pos.push(tx(x0),b0,tz(y0),tx(x1),b1,tz(y1),tx(x1),b1+H,tz(y1),tx(x0),b0,tz(y0),tx(x1),b1+H,tz(y1),tx(x0),b0+H,tz(y0));}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos),3));
  const uv=new Float32Array(pos.length/3*2);for(let i=0;i<pos.length/18;i++)uv.set([0,0,0,0,0,1,0,0,0,1,0,1],i*12);geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:{c:{value:new THREE.Color('#7fc0ff')},a:{value:0.5}},transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    vertexShader:'varying float v;void main(){v=uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform vec3 c;uniform float a;varying float v;void main(){float k=(1.0-v)*(1.0-v)*0.8+smoothstep(0.08,0.0,v)*0.9;gl_FragColor=vec4(c*k*a,1.0);}'}));
  m.material.color=m.material.uniforms.c.value;m.frustumCulled=false;return m;   // .color alias so sgSync can .set() it like the old ring
}
// ขอบพื้นที่เล่นของเฟส: ม่านโปร่งบาง ๆ ตามเส้นขอบรวมของทุกกรอบ
// mode 'atk' = phase transition seen by an attacker: the old area (where attackers are held) instead of the new one
function sgBarrier(ph,mode){
  const key=ph+'|'+(mode||'');if(SGV3.barK===key)return;SGV3.barK=key;
  if(SGV3.bar){SGV3.g.remove(SGV3.bar);disposeTree(SGV3.bar);SGV3.bar=null;}
  const R=mode==='atk'&&ph>1?(sgFD().phases[ph-2]||sgArea(ph).rects):sgArea(ph).rects,ins=(x,y)=>R.some(q=>x>=q.x1&&x<=q.x2&&y>=q.y1&&y<=q.y2),step=FCS_C,pos=[],H=5;
  const seg=(x0,y0,x1,y1)=>{const b0=GY(x0,y0),b1=GY(x1,y1);pos.push(tx(x0),b0,tz(y0),tx(x1),b1,tz(y1),tx(x1),b1+H,tz(y1),tx(x0),b0,tz(y0),tx(x1),b1+H,tz(y1),tx(x0),b0+H,tz(y0));};
  for(const q of R){
    for(let x=q.x1;x<q.x2;x+=step){for(const [y,o] of [[q.y1,-2],[q.y2,2]]){const mx=x+step/2;if(y<=2||y>=MH-2)continue;if(!ins(mx,y+o))seg(x,y,x+step,y);}}
    for(let y=q.y1;y<q.y2;y+=step){for(const [x,o] of [[q.x1,-2],[q.x2,2]]){const my=y+step/2;if(x<=2||x>=MW-2)continue;if(!ins(x+o,my))seg(x,y,x,y+step);}}
  }
  if(!pos.length)return;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos),3));
  const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:'#ffd27a',transparent:true,opacity:0.13,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  SGV3.bar=m;SGV3.g.add(m);
}
function sgSync(v,P,me,now,dt){
  const S=v.M&&v.M.sg;
  if(v.mode!=='siege'||!S||!(MAPS[MAPID]&&MAPS[MAPID].fcs)){if(SGV3.g)sgClearView();return;}
  SGPH=S.ph;SGTR=S.tr||0;
  if(!SGV3.g||SGV3.map!==MAPID){sgViewBuild();SGV3.map=MAPID;}
  sgBarrier(S.ph,S.tr>0&&me&&me.tm===0?'atk':'');if(MAPID==='fcs'){fcsForestTick();fcsCastleTick();}   // fcsPropsView runs in the render loop (all maps)
  SGV3.cores.forEach((c,i)=>{const n=i+1,got=(S.cp[i]|0)>=100,act=n===S.ph&&!got,fut=n>S.ph;
    c.cr.visible=c.glow.visible=true;c.rub.visible=false;c.ring.visible=act;
    c.cr.rotation.y+=dt*(act?1.2:0.3);c.cr.position.y=4.3+Math.sin(now/600+i)*0.25;
    const cs=act?S.cs|0:0,hit=cs===1,col=got?TEAMC[0]:hit?'#ff6a5a':cs===2?'#ffd24d':fut?'#5a6a80':'#9fd8ff';c.cm.color.set(col);c.cm.emissive.set(got?TEAMC[0]:hit?'#ff2a1a':cs===2?'#a07a10':fut?'#1a2030':'#3a8cff');
    c.ring.material.color.set(hit?'#ff6a5a':cs===2?'#ffd24d':cs===3?'#ffb060':'#7fc0ff');c.ring.material.uniforms.a.value=0.55+0.3*Math.sin(now/(hit||cs===2?140:450));});   // capture state 0 idle • 1 capturing • 2 contested • 3 pushed back
  if(S.bw!==SGV3.bwK){const old=SGV3.bwK;SGV3.bwK=S.bw;SGV3.bw.forEach((o,i)=>{o.visible=S.bw[i]!=='1';if(old&&old[i]!=='1'&&S.bw[i]==='1')sgDust(o.position);});gl.shadowMap.needsUpdate=true;}
  // ลำแสงร่าย: จากมือคนร่ายไปยอดแกน
  const k=sgFD().cores[S.ph-1],seen=new Set();
  if(k)for(const p of P){if(!p.sc||!p.al)continue;seen.add(p.id);let b=SGV3.beams.get(p.id);
    if(!b){b=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.12,1,6,1,true),new THREE.MeshBasicMaterial({color:hdr('#8fd0ff',2),transparent:true,opacity:0.8,blending:THREE.AdditiveBlending,depthWrite:false}));SGV3.g.add(b);SGV3.beams.set(p.id,b);}
    const a=new THREE.Vector3(tx(p.x),GY(p.x,p.y)+(p.z||0)+1.3,tz(p.y)),e=new THREE.Vector3(tx(k.x),GY(k.x,k.y)+4.3,tz(k.y)),d=e.clone().sub(a),L=d.length();
    b.position.copy(a).addScaledVector(d,0.5);b.scale.set(1,L,1);b.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());b.material.opacity=0.55+0.3*Math.sin(now/70+p.x);
    if(Math.random()<0.4)PARTS.push({x:k.x+rnd(-14,14),y:k.y+rnd(-14,14),h:GY(k.x,k.y)+4.3+rnd(-0.8,0.8),vx:rnd(-40,40),vy:rnd(-40,40),vh:rnd(0.5,2),life:0.5,max:0.5,col:'#9fd8ff',size:1.6,g:0});}
  for(const [id,b] of SGV3.beams)if(!seen.has(id)){SGV3.g.remove(b);b.geometry.dispose();b.material.dispose();SGV3.beams.delete(id);}
  sgLootSync(S,now);
}
// loot phase view: gold curtain around the loot area (retreat + loot) • ground items (S.it "kind,x,y;…" from sgSnap js/15-siege)
function sgLootSync(S,now){
  const b=S.ph-1,on=S.lc&&(S.tr>0||S.lt>0),key=on?MAPID+'|'+b:'';
  if(SGV3.lzK!==key){SGV3.lzK=key;if(SGV3.lz){SGV3.g.remove(SGV3.lz);disposeTree(SGV3.lz);SGV3.lz=null;}
    const R=on&&sgFD().loot&&sgFD().loot[b]||[],pos=[],H=2.5,step=FCS_C;
    const ins=(x,y)=>R.some(q=>x>=q.x1&&x<=q.x2&&y>=q.y1&&y<=q.y2);
    const seg=(x0,y0,x1,y1)=>{const b0=GY(x0,y0),b1=GY(x1,y1);pos.push(tx(x0),b0,tz(y0),tx(x1),b1,tz(y1),tx(x1),b1+H,tz(y1),tx(x0),b0,tz(y0),tx(x1),b1+H,tz(y1),tx(x0),b0+H,tz(y0));};
    for(const q of R){
      for(let x=q.x1;x<q.x2;x+=step){const x2=Math.min(q.x2,x+step),mx=(x+x2)/2;for(const [y,o] of [[q.y1,-2],[q.y2,2]])if(!ins(mx,y+o))seg(x,y,x2,y);}
      for(let y=q.y1;y<q.y2;y+=step){const y2=Math.min(q.y2,y+step),my=(y+y2)/2;for(const [x,o] of [[q.x1,-2],[q.x2,2]])if(!ins(x+o,my))seg(x,y,x,y2);}}
    if(pos.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos),3));
      SGV3.lz=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:'#ffc94a',transparent:true,opacity:0.22,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));SGV3.g.add(SGV3.lz);}}
  if(SGV3.lz)SGV3.lz.material.opacity=S.lt>0?0.2+0.08*Math.sin(now/300):0.12;
  const it=S.it||'';
  if(SGV3.itK!==it){SGV3.itK=it;for(const o of SGV3.it){SGV3.g.remove(o);disposeTree(o);}SGV3.it=[];
    for(const e of it?it.split(';'):[]){const [k,x,y]=e.split(','),I=SG_ITEMS[k]||{col:'#ffffff'},X=+x,Y=+y,o=new THREE.Group();o.position.set(tx(X),GY(X,Y),tz(Y));
      const m=new THREE.Mesh(new THREE.OctahedronGeometry(0.45,0),new THREE.MeshStandardMaterial({color:I.col,emissive:I.col,emissiveIntensity:1.4,roughness:0.25}));m.scale.y=1.5;m.position.y=1.2;o.add(m);
      const gl=new THREE.Sprite(glowMat(I.col,1.2));gl.scale.setScalar(2.4);gl.position.y=1.2;o.add(gl);
      const rg=new THREE.Mesh(new THREE.RingGeometry(0.7,0.9,24),new THREE.MeshBasicMaterial({color:I.col,transparent:true,opacity:0.5,depthWrite:false,side:THREE.DoubleSide}));rg.rotation.x=-Math.PI/2;rg.position.y=0.06;o.add(rg);
      o.userData={m,ph:X*0.01+Y*0.013};SGV3.g.add(o);SGV3.it.push(o);}}
  for(const o of SGV3.it){const u=o.userData;u.m.rotation.y=now/500+u.ph;u.m.position.y=1.2+Math.sin(now/350+u.ph)*0.18;}
}
function sgDust(pos){const x=pos.x*20+MW/2,y=pos.z*20+MH/2;for(let i=0;i<26;i++)PARTS.push({x:x+rnd(-40,40),y:y+rnd(-40,40),h:rnd(0.3,4),vx:rnd(-60,60),vy:rnd(-60,60),vh:rnd(0.5,3),life:1.4,max:1.4,col:'#b8a488',size:rnd(3,6),g:0,smoke:true,grow:1});}
function sgFx(ev){
  const me=myPos(),near=!me||Math.hypot(ev.x-me.x,ev.y-me.y)<1400;
  if(ev.k==='sgwall'){if(near)snd('rubble',ev);}
  else if(ev.k==='sgitem'){const I=SG_ITEMS[ev.it]||{col:'#ffffff'};for(let i=0;i<18;i++)PARTS.push({x:ev.x+rnd(-10,10),y:ev.y+rnd(-10,10),h:1.2,vx:rnd(-90,90),vy:rnd(-90,90),vh:rnd(1,4),life:0.6,max:0.6,col:I.col,size:1.4,g:3});if(near)snd('pickup',ev);}
  else if(ev.k==='sgcore'){for(let i=0;i<40;i++)PARTS.push({x:ev.x+rnd(-20,20),y:ev.y+rnd(-20,20),h:4.3,vx:rnd(-260,260),vy:rnd(-260,260),vh:rnd(1,7),life:1.1,max:1.1,col:'#9fd8ff',size:2.4,g:6});FX.flashLight(ev.x,ev.y,4.3,'#7fc0ff',6,30,0.6);snd('boom',ev);}
}
// ---------- HUD ----------
function sgTop(v){const S=v.M&&v.M.sg;if(!S)return '🏰 บุกปราสาท';const i=S.ph-1,pc=S.cp[i]|0;
  return `🏰 เฟส ${S.ph}/${S.n}   •   จุด ${S.ph} ยึดแล้ว ${pc}%   •   `+(S.pr>0?`เตรียมตัว ${S.pr} วิ`:S.lt>0?`🎁 ชิงของ ${S.lt} วิ`:S.tr>0?(S.lc?`🔁 ชิงของเริ่มใน ${S.tr} วิ`:`🔁 เฟสถัดไปเริ่มใน ${S.tr} วิ`):S.ot?`⏱ ต่อเวลา! (ผ่อนผัน ${S.gr.toFixed(1)} วิ)`:`⏱ ${fmtTime(v.tm)}`);}
// loot HUD: own bag (S.iv "id:kind.kind;…") + markers on nearby ground items
function sgLootHud(S,me,big){
  const mine=(S.iv||'').split(';').find(e=>e.slice(0,e.lastIndexOf(':'))===String(me.id)),bag=mine?mine.slice(mine.lastIndexOf(':')+1).split('.'):[];
  if(bag.length||S.lt>0){cx.textAlign='center';big('กระเป๋า '+(bag.length?bag.map(k=>(SG_ITEMS[k]||{}).ic||'?').join(' '):'—')+`  (${bag.length}/${SG_CARRY})`+(bag.length?'  • '+[...new Set(bag)].map(k=>(SG_ITEMS[k]||{}).n||k).join(', '):''),SH*0.36+30,15,'#d8fff0');}
  if(!me.al||!S.it)return;
  for(const e of S.it.split(';')){const [k,x,y]=e.split(','),X=+x,Y=+y,d=Math.hypot(X-me.x,Y-me.y);if(d>2400)continue;
    const s=toScreen(X,(GY(X,Y)||0)+2.2,Y);if(!s||s[0]<20||s[0]>SW-20||s[1]<20||s[1]>SH-20)continue;const I=SG_ITEMS[k]||{ic:'?',col:'#fff'};
    cx.font='600 15px Kanit,sans-serif';cx.textAlign='center';cx.fillStyle=I.col;cx.fillText(I.ic+' '+Math.round(d/20)+' ม.',s[0],s[1]);}
}
function sgHud(v,me,big){
  const S=v.M&&v.M.sg;if(!S||!me)return;
  const atk=me.tm===0,F=sgFD(),k=F.cores[S.ph-1];
  // capture bars of every point (under the top bar) • fill = capture progress
  const bw=Math.min(110,(SW-80)/S.n-10),x0=SW/2-(bw+10)*S.n/2,cs=S.cs|0,stc=c=>c===1?'#ff6a5a':c===2?'#ffd24d':c===3?'#ffb060':'#7fc0ff';
  if(hlBegin('top',SW/2,12))   // follows the HUD Editor 'top' block
  {for(let i=0;i<S.n;i++){const x=x0+i*(bw+10),r=(S.cp[i]|0)/100,act=i===S.ph-1,got=r>=1;
    cx.fillStyle='rgba(8,10,20,0.7)';cx.fillRect(x,52,bw,12);cx.fillStyle=got?TEAMC[0]:act?stc(cs):'#4a5a70';cx.fillRect(x+1,53,(bw-2)*r,10);
    if(act){cx.strokeStyle=HG2;cx.lineWidth=1.5;cx.strokeRect(x-1,51,bw+2,14);}
    cx.font='600 11px Kanit,sans-serif';cx.textAlign='center';cx.fillStyle='#efe6cf';cx.fillText(got?'ยึดแล้ว':'จุด '+(i+1),x+bw/2,78);}hlEnd();}
  cx.textAlign='center';
  if(hlBegin('top',SW/2,12)){big(`คุณเป็น${atk?SG_TEAM[0]:SG_TEAM[1]} (${TEAMN[me.tm]||''})`,96,14,atk?'#8fc8ff':'#ff9a9a');hlEnd();}
  // เครื่องหมายแกนบนจอ
  if(k&&me.al){const s=toScreen(k.x,(GY(k.x,k.y)||0)+4,k.y),d=Math.round(Math.hypot(k.x-me.x,k.y-me.y)/20);
    if(s&&s[0]>30&&s[0]<SW-30&&s[1]>30&&s[1]<SH-30){cx.save();cx.translate(s[0],s[1]);cx.rotate(Math.PI/4);cx.strokeStyle=stc(cs);cx.lineWidth=2.5;cx.strokeRect(-9,-9,18,18);cx.restore();
      cx.font='600 13px Kanit,sans-serif';cx.fillStyle='#efe6cf';cx.fillText(`จุด ${S.ph} • ${d} ม.`,s[0],s[1]-18);}}
  // standing in the zone: big progress bar + what is happening
  if(me.al&&S.pr<=0&&!(S.tr>0)&&!(S.lt>0)&&k&&sgZoneIn(k,me.x,me.y,PR)){const pc=S.cp[S.ph-1]|0,W=Math.min(320,SW-60),bx=SW/2-W/2,by=SH-150;
    cx.fillStyle='rgba(8,10,20,0.72)';cx.fillRect(bx-2,by-2,W+4,16);cx.fillStyle=stc(cs);cx.fillRect(bx,by,W*pc/100,12);cx.strokeStyle='rgba(255,255,255,0.35)';cx.lineWidth=1;cx.strokeRect(bx-2,by-2,W+4,16);
    const t=cs===1?(atk?`🚩 กำลังยึดจุด ${S.ph}… ${pc}%`:`⚠️ ฝ่ายบุกกำลังยึด ${pc}%`):cs===2?(atk?'⚔️ ฝ่ายรับอยู่ในเขต — หยุดยึด ไล่ออกไปก่อน':'⚔️ ฝ่ายบุกอยู่ในเขต — ไล่ออกไป'):cs===3?(atk?`ฝ่ายรับกำลังดันกลับ ${pc}%`:`🛡 กำลังดันแถบยึดกลับ ${pc}%`):(atk?`เขตยึดจุด ${S.ph} — ${pc}%`:`เขตจุด ${S.ph} — ${pc}%`);
    big(t,by-14,17,stc(cs));}
  sgLootHud(S,me,big);
  if(S.tr>0&&S.lc)big(`🎁 ไปจุดถอยของทีม — ช่วงชิงของเริ่มใน ${S.tr} วิ (เขตทอง = ที่ของจะเกิด)`,SH*0.36,22,'#ffe9a8');
  else if(S.tr>0){const inNew=me.al&&sgInArea(me.x,me.y,S.ph);
    if(atk)big(`ฝ่ายรับกำลังถอย — บุกเฟส ${S.ph} ได้ใน ${S.tr} วิ`,SH*0.36,22,'#ffe9a8');
    else if(me.al&&!inNew)big(`⚠️ ถอยเข้าเขตใหม่! เหลือ ${S.tr} วิ — อยู่นอกเขต = ตาย`,SH*0.36,24,'#ff8a7a');
    else big(`ตั้งแนวป้องกันแกน ${S.ph} — ฝ่ายบุกมาใน ${S.tr} วิ`,SH*0.36,22,'#ffe9a8');}
  if(S.lt>0)big(`🎁 ชิงของ! เก็บของในเขตทอง — เหลือ ${S.lt} วิ (ตาย = ของหล่น)`,SH*0.36,22,'#ffd76a');
  if(atk&&S.pr>0)big(`ฝ่ายรับกำลังเตรียมตัว — ประตูเปิดใน ${S.pr} วิ`,SH*0.36,22,'#ffe9a8');
  if(!atk&&S.pr>0)big(`เตรียมแนวป้องกัน — ฝ่ายบุกออกมาใน ${S.pr} วิ`,SH*0.36,22,'#ffe9a8');
}
