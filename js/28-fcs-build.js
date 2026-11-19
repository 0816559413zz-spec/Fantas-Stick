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
  const fl=new THREE.Mesh(terrGeo((i,j)=>{const a=[[i,j],[i-1,j],[i,j-1],[i-1,j-1]].every(([a,b])=>surf(Math.max(0,a),Math.max(0,b))===2);return a?T.g[j*T.nx+i]+0.03:NaN;},T.nx,T.ny,T.c,1),stoneMat(1,1,'#a8a294'));fl.receiveShadow=true;addW(fl);
  // กำแพงจากตาราง (InstancedMesh ต่อชนิด)
  const m4=new THREE.Matrix4(),cells=[[],[],[],[]];
  for(let y=0;y<D.h;y++)for(let x=0;x<D.w;x++){const v=parseInt(D.W[y*D.w+x],36);if(v)cells[v].push([x,y]);}
  const inst=(geo,mat,list,fn)=>{if(!list.length)return;const im=new THREE.InstancedMesh(geo,mat,list.length);list.forEach((q,i)=>im.setMatrixAt(i,fn(q)));im.castShadow=im.receiveShadow=true;addW(im);return im;};
  const box=sGeo(THREE.BoxGeometry,1,1,1);
  inst(box,stoneMat(1,1,'#7a746a'),cells[1],([x,y])=>{const px=(x+0.5)*C,py=(y+0.5)*C,b=GY(px,py);return m4.makeScale(c3,FCS_WH[1],c3).setPosition(tx(px),b+FCS_WH[1]/2,tz(py)).clone();});
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
  inst(sGeo(THREE.CylinderGeometry,0.65,0.75,1,10),stoneMat(1,1,'#bdb5a5'),P('pl'),([,x,y])=>m4.makeScale(1,6,1).setPosition(tx(x),GY(x,y)+3,tz(y)).clone());
  // แท่นจุดเกิด (สีทีม)
  for(const [t,L] of [[0,F.sp.A],[1,F.sp.B]])for(const k in L){const s=L[k],m=new THREE.Mesh(new THREE.CircleGeometry(SG_SPR*S3,32),new THREE.MeshBasicMaterial({color:TEAMC[t],transparent:true,opacity:0.18,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(tx(s.x),GY(s.x,s.y)+0.05,tz(s.y));addW(m);}
  try{fcsForest(fb);}catch(e){console.error('fcsForest',e);}
}
// L-shaped stone bridge (js/02-fcs.js bridge): arched spans (extruded shape, piers 1.6 m), corner block, ramps, crenellated parapet.
function fcsBridge(B){
  const pm=stoneMat(1,1,'#a49a88'),mat=fcsHoleMat(pm),dark=stoneMat(1,1,'#8a8070'),W=B.HW*2*S3,DH=B.DH,grp=new THREE.Group();   // mat = stone with skin-damage holes cut in (fcsHoleMat)
  const add=(geo,m,x,y,z,ry)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.rotation.y=ry||0;o.castShadow=o.receiveShadow=true;grp.add(o);return o;};
  // arch spans: shape in (along, up) meters, extruded across the deck width
  for(const s of B.spans){const L=Math.hypot(s.x2-s.x1,s.y2-s.y1)*S3,r=(L-1.6)/2,ux=(s.x2-s.x1)/(L/S3),uy=(s.y2-s.y1)/(L/S3);
    const mx=(s.x1+s.x2)/2,my=(s.y1+s.y2)/2,base=Math.min(GY(s.x1,s.y1),GY(s.x2,s.y2),GY(mx,my))-1.2,top=DH-base,spring=DH-1.3-r-base;
    const sh=new THREE.Shape();sh.moveTo(-L/2,0);sh.lineTo(-r,0);sh.lineTo(-r,spring);sh.absarc(0,spring,r,Math.PI,0,true);sh.lineTo(r,0);sh.lineTo(L/2,0);sh.lineTo(L/2,top);sh.lineTo(-L/2,top);sh.lineTo(-L/2,0);
    const geo=new THREE.ExtrudeGeometry(sh,{depth:W,bevelEnabled:false,curveSegments:14});geo.translate(0,0,-W/2);
    add(geo,mat,tx(mx),base,tz(my),-Math.atan2(uy,ux));
    // string course under the parapet (thin ledge both sides)
    add(sGeo(THREE.BoxGeometry,L,0.25,W+0.5),dark,tx(mx),DH-0.2,tz(my),-Math.atan2(uy,ux));}
  // corner block
  {const x=B.ax,y=B.cy,base=GY(x,y)-1.2;add(sGeo(THREE.BoxGeometry,W+0.4,DH-base,W+0.4),mat,tx(x),base+(DH-base)/2,tz(y));
   add(sGeo(THREE.BoxGeometry,W+0.9,0.25,W+0.9),dark,tx(x),DH-0.2,tz(y));}
  // ramps: side profile extruded across the width
  for(const [R0,alongY,L,gEnd] of [[B.rs,true,B.LS,B.gS],[B.re,false,B.LE,B.gE]]){const Lm=L*S3,x0=alongY?B.ax:B.xE,y0=alongY?B.yS:B.cy,base=Math.min(GY(x0,y0),gEnd)-1.2;
    const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(Lm+0.3,0);sh.lineTo(Lm+0.3,gEnd-base-0.05);sh.lineTo(0,DH-base);sh.lineTo(0,0);
    const geo=new THREE.ExtrudeGeometry(sh,{depth:W,bevelEnabled:false});geo.translate(0,0,-W/2);
    add(geo,mat,tx(x0),base,tz(y0),alongY?-Math.PI/2:0);}
  // parapet: per unit (B.parU) one base-wall segment + one merlon; each unit breaks via BRK (fcsParView). Rubble lumps hidden until broken.
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),U=B.parU,box=sGeo(THREE.BoxGeometry,1,1,1),FP=FCSB;
  FP.base=[];FP.mer=[];FP.rub=[];FP.st=new Int8Array(U.length);FP.off=-1;
  const mk=(n,m)=>{const im=new THREE.InstancedMesh(box,m,n);im.castShadow=im.receiveShadow=true;grp.add(im);return im;};
  FP.imB=mk(U.length,pm);FP.imM=mk(U.length,pm);FP.imR=mk(U.length,pm);
  FP.imC=mk(1200,pm);FP.imC.count=0;FP.nC=0;FP.fall=[];FP.t0=0;   // fallen parapet chunks (sim then rest)
  const W1=new THREE.Color(1,1,1);
  U.forEach((u,k)=>{q.setFromAxisAngle(Y,-u.a);const X=tx(u.x),Z=tz(u.y),sl=u.seg*S3+0.02;
    FP.base[k]=[new THREE.Vector3(X,DH+0.25,Z),q.clone(),new THREE.Vector3(sl,0.5,0.45)];
    FP.mer[k]=[new THREE.Vector3(X,DH+0.85,Z),q.clone(),new THREE.Vector3(1.0,0.75,0.5)];
    FP.rub[k]=[new THREE.Vector3(X,DH+0.13,Z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0.06,-u.a,0.08*((k%3)-1))),new THREE.Vector3(sl*0.96,0.26,0.45)];   // broken = jagged stump stays on the edge
    FP.imB.setMatrixAt(k,m4.compose(...FP.base[k]));FP.imM.setMatrixAt(k,m4.compose(...FP.mer[k]));FP.imR.setMatrixAt(k,m4.makeScale(0,0,0));
    FP.imB.setColorAt(k,W1);FP.imM.setColorAt(k,W1);FP.imR.setColorAt(k,W1);});
  for(const im of [FP.imB,FP.imM,FP.imR]){im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true;}
  FCSB.grp=grp;FCSB.B=B;FCSB.skin=null;FCSB.sv=-1;
  addW(grp);
}
// bridge runtime view: parapet break stages (BRK) + skin damage spots (BSKN). Called every frame from the render loop.
const FCSB={grp:null,B:null,skin:null,sv:-1,tex:null};
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
// damage decal textures (stage 1 chipped / 2 missing bricks / 3 exposed rubble), drawn once
function fcsSkinTex(){
  if(FCSB.tex)return FCSB.tex;const R=mulberry(7731);FCSB.tex=[1,2,3].map(st=>{
    const N=128,cv=document.createElement('canvas');cv.width=cv.height=N;const x=cv.getContext('2d');
    // jagged blob mask
    const blob=(r0,col)=>{x.beginPath();for(let i=0;i<=24;i++){const a=i/24*6.283,r=r0*(0.72+0.38*R());const px=N/2+Math.cos(a)*r,py=N/2+Math.sin(a)*r*0.85;i?x.lineTo(px,py):x.moveTo(px,py);}x.closePath();x.fillStyle=col;x.fill();};
    if(st===3){blob(60,'rgba(22,18,14,0.97)');blob(50,'#7d7062');for(let i=0;i<320;i++){const v=85+R()*70|0;x.fillStyle=`rgb(${v},${v-8},${v-18})`;const r=1+R()*4;x.fillRect(N/2+(R()-0.5)*80,N/2+(R()-0.5)*66,r,r);}}
    else{blob(st===2?54:46,'rgba(128,112,96,0.85)');blob(st===2?44:36,'rgba(96,84,72,0.9)');}   // fresh chipped stone = lighter than the weathered face
    // missing bricks (dark recesses) on a running-bond grid
    const bw=22,bh=11,n=st===1?3:st===2?8:5;
    for(let i=0;i<n;i++){const row=(R()*7|0)-3,col=(R()*5|0)-2,ox=(row&1)*bw/2,px=N/2+col*bw+ox-bw/2,py=N/2+row*bh-bh/2;
      x.fillStyle='rgba(14,11,9,0.96)';x.fillRect(px+1,py+1,bw-2,bh-2);x.fillStyle='rgba(165,148,124,0.65)';x.fillRect(px+1,py+bh-3,bw-2,2);}
    // cracks
    x.strokeStyle='rgba(12,10,8,0.95)';x.lineWidth=2;for(let i=0;i<(st===1?4:6);i++){x.beginPath();let px=N/2,py=N/2;x.moveTo(px,py);for(let k=0;k<5;k++){px+=(R()-0.5)*26;py+=(R()-0.5)*22;x.lineTo(px,py);}x.stroke();}
    const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;});
  return FCSB.tex;
}
// stone material with up to 64 skin-damage holes: fragments on a hole's face plane inside a brick-stepped radius are discarded,
// the cavity mesh behind (fcsSkinView) shows the inside. uHC = center xyz + radius, uHN = outward normal xyz + seed.
function fcsHoleMat(base){
  if(FCSB.hm)return FCSB.hm;const m=base.clone(),U={uHC:{value:[]},uHN:{value:[]},uHNn:{value:0}};
  for(let i=0;i<64;i++){U.uHC.value.push(new THREE.Vector4());U.uHN.value.push(new THREE.Vector4());}
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vHW;').replace('#include <project_vertex>','#include <project_vertex>\nvHW=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vHW;uniform vec4 uHC[64];uniform vec4 uHN[64];uniform int uHNn;').replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n'+
      'for(int i=0;i<64;i++){if(i>=uHNn)break;vec3 c=uHC[i].xyz,n=uHN[i].xyz;vec3 d=vHW-c;if(abs(dot(d,n))>0.26)continue;'+
      'vec3 ua=normalize(cross(vec3(0.,1.,0.),n));vec2 q=vec2(dot(d,ua),d.y);float row=floor(q.y/0.25+0.5),off=mod(row,2.)*0.25;'+
      'float bx=(floor((q.x+off)/0.5)+0.5)*0.5-off,by=row*0.25;float h=fract(sin(dot(vec2(bx,by)+uHN[i].w,vec2(12.9898,78.233)))*43758.5453);'+
      'if(length(vec2(bx,by*1.25))<uHC[i].w*(0.7+0.4*h))discard;}');};
  m.customProgramCacheKey=()=>'fcsHole';FCSB.hm=m;FCSB.hu=U;return m;
}
// parapet unit broke (brk event): spawn chunks — most fall outward off the bridge to the ground, a few drop on the deck
function fcsParFall(ev){
  const P=FCSB,g=BRK[ev.i];if(!P.B||!g||!g.d||g.d.fp==null)return;const u=P.B.parU[g.d.fp];if(!u)return;
  const R=Math.random,n=5+(R()*3|0);
  for(let k=0;k<n;k++){const out=k<n-2,sp=out?2+R()*3:0.6+R()*1.2,side=(R()-0.5)*1.4;
    P.fall.push({x:tx(u.x)+(u.ny?side:0),z:tz(u.y)+(u.nx?side:0),y:P.B.DH+0.6+R()*0.6,vx:(out?u.nx:-u.nx)*sp+(R()-0.5)*1.5,vz:(out?u.ny:-u.ny)*sp+(R()-0.5)*1.5,vy:1+R()*2.5,
      rx:R()*6,ry:R()*6,rz:R()*6,w:R()*8-4,s:0.35+R()*0.35});}
}
function fcsFallTick(){
  const P=FCSB;if(!P.imC)return;const now=performance.now(),dt=Math.min(0.05,P.t0?(now-P.t0)/1000:0);P.t0=now;if(!P.fall.length||!(dt>0))return;
  const B=P.B,m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),onDeck=(X,Z)=>{const x=X*20+MW/2,y=Z*20+MH/2;return [B.ns,B.ew].some(r=>x>r.x1&&x<r.x2&&y>r.y1&&y<r.y2);};
  for(let i=P.fall.length-1;i>=0;i--){const f=P.fall[i];f.vy-=14*dt;f.x+=f.vx*dt;f.z+=f.vz*dt;f.y+=f.vy*dt;f.rx+=f.w*dt;f.rz+=f.w*0.7*dt;
    const floor=(onDeck(f.x,f.z)?B.DH:TW(f.x,f.z))+f.s*0.3;
    if(f.y<=floor&&f.vy<0){f.y=floor;if(Math.abs(f.vy)>3){f.vy*=-0.3;f.vx*=0.5;f.vz*=0.5;f.w*=0.5;}else f.done=1;}
    if(f.k===undefined){if(P.nC>=1200){P.fall.splice(i,1);continue;}f.k=P.nC++;}
    P.imC.setMatrixAt(f.k,m4.compose(new THREE.Vector3(f.x,f.y,f.z),q.setFromEuler(e.set(f.done?0.1:f.rx,f.ry,f.done?0.05:f.rz)),new THREE.Vector3(f.s*1.4,f.s*0.6,f.s*0.8)));
    if(f.done)P.fall.splice(i,1);}
  P.imC.count=P.nC;P.imC.instanceMatrix.needsUpdate=true;
}
// rebuild skin damage when the spot list changes: stage 1 = chipped decal, 2 = shallow hole, 3 = deep hole (brick-stepped edge, cavity, loose + fallen bricks)
function fcsSkinView(){
  fcsFallTick();
  const P=FCSB;if(!P.grp||P.grp.parent!==world||P.sv===BSKN.ver)return;P.sv=BSKN.ver;
  if(P.skin){P.grp.remove(P.skin);P.skin.traverse(o=>{if(o.geometry&&o.geometry.userData.tmp)o.geometry.dispose();});}
  const S=new THREE.Group();P.skin=S;P.grp.add(S);const HU=P.hu;let nh=0;
  if(BSKN.list.length&&BSKN.F.length){
  const T=fcsSkinTex();FCSB.plane=FCSB.plane||new THREE.PlaneGeometry(1,1);FCSB.cube=FCSB.cube||new THREE.BoxGeometry(1,1,1);
  FCSB.mats=FCSB.mats||T.map(t=>new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:0.2,depthWrite:false,roughness:1,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  FCSB.cavM=FCSB.cavM||new THREE.MeshStandardMaterial({color:'#3e362f',roughness:1,side:THREE.DoubleSide});FCSB.backM=FCSB.backM||new THREE.MeshStandardMaterial({map:T[2],color:'#6f6457',roughness:1,alphaTest:0.3,side:THREE.DoubleSide});
  const bricks=[],m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),R=mulberry(99),Yv=new THREE.Vector3(0,1,0);
  BSKN.list.forEach((sp,i)=>{const f=BSKN.F[sp.f];if(!f)return;const ny=f.ax==='y',X=ny?tx(f.c):tx(sp.a),Z=ny?tz(sp.a):tz(f.c),ry=ny?f.n*Math.PI/2:(f.n>0?0:Math.PI);
    const nx=ny?f.n:0,nz=ny?0:f.n;
    if(HU&&nh<64){let r=sp.s*[0,0.22,0.38,0.58][sp.st];const dep=[0,0.12,0.32,0.7][sp.st];
      // hole must fit between the arch ring (or ground) and the deck edge: shrink radius over arch crowns
      // over an arch crown there is little wall: slide the hole (up to 3 m) toward the pier where it fits bigger
      const hi=BSKN.B.DH-0.35,fit=a2=>{const gF=GY(ny?f.c:a2,ny?a2:f.c),lo=Math.max(gF+0.3,bskArcAt(f,a2));return [Math.max(0.2,Math.min(r,(hi-lo)*0.5/1.15)),lo];};
      let ab=sp.a,best=-1e9,lo=0,rb=r;for(let o=-3.2;o<=3.21;o+=0.4){const a2=clamp(sp.a+o*20,f.a0+40,f.a1-40),[rr,l2]=fit(a2),sc=rr-0.06*Math.abs(o);if(sc>best){best=sc;ab=a2;rb=rr;lo=l2;}}
      r=rb;const X2=ny?X:tx(ab),Z2=ny?tz(ab):Z,zc=clamp(sp.z,lo+r*1.15,hi-r*1.15);
      HU.uHC.value[nh].set(X2,zc,Z2,r);HU.uHN.value[nh].set(nx,0,nz,i*1.37);nh++;
      // cavity: open cup going into the wall (radius covers the brick-stepped cut), back plate with rubble texture
      const cg=new THREE.CylinderGeometry(r*1.15,r*0.85,dep,14,1,true);cg.userData.tmp=1;const cav=new THREE.Mesh(cg,FCSB.cavM);
      cav.quaternion.setFromUnitVectors(Yv,new THREE.Vector3(nx,0,nz));cav.position.set(X2-nx*dep/2,zc,Z2-nz*dep/2);S.add(cav);
      const bg=new THREE.CircleGeometry(r*0.9,14);bg.userData.tmp=1;const back=new THREE.Mesh(bg,FCSB.backM);back.position.set(X2-nx*dep,zc,Z2-nz*dep);back.rotation.y=ry;S.add(back);
      // broken bricks inside the cavity and jutting at the rim
      for(let k=0;k<[0,2,5,9][sp.st];k++){const a=R()*6.283,rr=r*(0.6+R()*0.5),u=Math.cos(a)*rr,v=Math.sin(a)*rr*0.9,dd=R()*dep*0.9;
        bricks.push(m4.compose(new THREE.Vector3(X2+(ny?0:u)-nx*dd,zc+v,Z2+(ny?u:0)-nz*dd),q.setFromEuler(e.set((R()-0.5)*0.6,ry+(R()-0.5)*0.8,(R()-0.5)*0.6)),new THREE.Vector3(0.5,0.25,0.3+R()*0.3)).clone());}}
    // fallen bricks at the foot (more for deeper holes)
    const g=GY((ny?f.c:sp.a)+nx*30,(ny?sp.a:f.c)+nz*30),nf=sp.st===1?2:sp.st===2?7:14;
    for(let k=0;k<nf;k++){const u=(R()-0.5)*sp.s*1.6,o=0.3+R()*1.5;bricks.push(m4.compose(new THREE.Vector3(X+(ny?0:u)+nx*o,g+0.1+R()*0.12,Z+(ny?u:0)+nz*o),q.setFromEuler(e.set(R()*3,R()*3,R()*3)),new THREE.Vector3(0.45,0.22,0.25)).clone());}});
  if(bricks.length){const im=new THREE.InstancedMesh(FCSB.cube,stoneMat(1,1,'#9c9280'),bricks.length);bricks.forEach((mm,i)=>im.setMatrixAt(i,mm));im.castShadow=true;S.add(im);}}
  if(HU)HU.uHNn.value=nh;
}
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
const SGV3={g:null,cores:[],bw:[],bar:null,barK:'',beams:new Map(),bwK:''};
function sgClearView(){if(SGV3.g){scene.remove(SGV3.g);disposeTree(SGV3.g);}SGV3.g=null;SGV3.cores=[];SGV3.bw=[];SGV3.bar=null;SGV3.barK='';SGV3.bwK='';SGV3.beams.clear();}
function sgViewBuild(){
  sgClearView();const F=MAPS.fcs.fcs,g=new THREE.Group();scene.add(g);SGV3.g=g;
  F.cores.forEach((k,i)=>{const o=new THREE.Group();o.position.set(tx(k.x),GY(k.x,k.y),tz(k.y));g.add(o);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.4,0.6,8),stoneMat(1,1,'#6a6258'));base.position.y=0.3;base.castShadow=true;o.add(base);
    const cm=new THREE.MeshStandardMaterial({color:'#9fd8ff',emissive:'#3a8cff',emissiveIntensity:1.2,roughness:0.2,transparent:true,opacity:0.92});
    const cr=new THREE.Mesh(new THREE.OctahedronGeometry(0.9,0),cm);cr.scale.set(1,2,1);cr.position.y=2.4;o.add(cr);
    const glow=new THREE.Sprite(glowMat('#7fc0ff',1.4));glow.scale.setScalar(4);glow.position.y=2.4;o.add(glow);
    const ring=new THREE.Mesh(new THREE.RingGeometry(SGVZR()*S3-0.25,SGVZR()*S3,64),new THREE.MeshBasicMaterial({color:'#7fc0ff',transparent:true,opacity:0.5,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=0.08;o.add(ring);
    const rub=new THREE.Group();for(let q=0;q<6;q++){const m=new THREE.Mesh(sGeo(THREE.OctahedronGeometry,0.4,0),cm);m.position.set(Math.cos(q)*0.9,0.7,Math.sin(q*1.7)*0.9);m.rotation.set(q,q*2,0);rub.add(m);}rub.visible=false;o.add(rub);
    for(const ch of [base,cr,glow,rub]){ch.scale.multiplyScalar(1.8);ch.position.y*=1.8;}   // แมพขยาย 3 เท่า → แกนใหญ่ขึ้นให้เห็นจากไกล
    SGV3.cores.push({o,cr,cm,glow,ring,rub});});
  F.bw.forEach((b,i)=>{const cx=b.x+b.w/2,cy=b.y+b.d/2,o=new THREE.Group();o.position.set(tx(cx),GY(cx,cy),tz(cy));g.add(o);
    if(b.k==='gate'){const n=Math.max(2,Math.round(Math.max(b.w,b.d)/20)),horiz=b.w>=b.d;
      for(let q=0;q<n;q++){const t=(q+0.5)/n-0.5,m=new THREE.Mesh(sGeo(THREE.BoxGeometry,0.18,1,0.18),new THREE.MeshStandardMaterial({color:'#3a3a40',metalness:0.6,roughness:0.5}));m.scale.y=b.h;m.position.set(horiz?t*b.w*S3:0,b.h/2,horiz?0:t*b.d*S3);m.castShadow=true;o.add(m);}
      const top=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,0.3,1),new THREE.MeshStandardMaterial({color:'#4a4040',metalness:0.5}));top.scale.set(Math.max(0.3,b.w*S3),1,Math.max(0.3,b.d*S3));top.position.y=b.h;o.add(top);}
    else{const m=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),stoneMat(1,1,'#b08a60'));m.scale.set(b.w*S3,b.h,b.d*S3);m.position.y=b.h/2;m.castShadow=m.receiveShadow=true;o.add(m);
      const cr=new THREE.Mesh(sGeo(THREE.BoxGeometry,1,1,1),new THREE.MeshBasicMaterial({color:'#ffcf6a',transparent:true,opacity:0.18,depthWrite:false}));cr.scale.set(b.w*S3+0.08,b.h+0.08,b.d*S3+0.08);cr.position.y=b.h/2;o.add(cr);}   // ขอบสีทอง = พังได้
    SGV3.bw.push(o);});
}
function SGVZR(){return (VIEW.cur&&VIEW.cur.M&&VIEW.cur.M.sg&&VIEW.cur.M.sg.zr)||150;}
// ขอบพื้นที่เล่นของเฟส: ม่านโปร่งบาง ๆ ตามเส้นขอบรวมของทุกกรอบ
function sgBarrier(ph){
  if(SGV3.barK===ph+'')return;SGV3.barK=ph+'';
  if(SGV3.bar){SGV3.g.remove(SGV3.bar);disposeTree(SGV3.bar);SGV3.bar=null;}
  const A=sgArea(ph),R=A.rects,ins=(x,y)=>R.some(q=>x>=q.x1&&x<=q.x2&&y>=q.y1&&y<=q.y2),step=FCS_C,pos=[],H=5;
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
  if(v.mode!=='siege'||!S||MAPID!=='fcs'){if(SGV3.g)sgClearView();return;}
  SGPH=S.ph;
  if(!SGV3.g)sgViewBuild();
  sgBarrier(S.ph);fcsForestTick();
  SGV3.cores.forEach((c,i)=>{const n=i+1,dead=S.hp[i]<=0,act=n===S.ph,fut=n>S.ph;
    c.cr.visible=c.glow.visible=!dead;c.rub.visible=dead;c.ring.visible=act;
    c.cr.rotation.y+=dt*(act?1.2:0.3);c.cr.position.y=4.3+Math.sin(now/600+i)*0.25;
    const hit=act&&S.atk,col=hit?'#ff6a5a':fut?'#5a6a80':'#9fd8ff';c.cm.color.set(col);c.cm.emissive.set(hit?'#ff2a1a':fut?'#1a2030':'#3a8cff');
    c.ring.material.color.set(hit?'#ff6a5a':S.def?'#ffb060':'#7fc0ff');c.ring.material.opacity=0.35+0.25*Math.sin(now/(hit?120:400));});
  if(S.bw!==SGV3.bwK){const old=SGV3.bwK;SGV3.bwK=S.bw;SGV3.bw.forEach((o,i)=>{o.visible=S.bw[i]!=='1';if(old&&old[i]!=='1'&&S.bw[i]==='1')sgDust(o.position);});gl.shadowMap.needsUpdate=true;}
  // ลำแสงร่าย: จากมือคนร่ายไปยอดแกน
  const k=MAPS.fcs.fcs.cores[S.ph-1],seen=new Set();
  if(k)for(const p of P){if(!p.sc||!p.al)continue;seen.add(p.id);let b=SGV3.beams.get(p.id);
    if(!b){b=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.12,1,6,1,true),new THREE.MeshBasicMaterial({color:hdr('#8fd0ff',2),transparent:true,opacity:0.8,blending:THREE.AdditiveBlending,depthWrite:false}));SGV3.g.add(b);SGV3.beams.set(p.id,b);}
    const a=new THREE.Vector3(tx(p.x),GY(p.x,p.y)+(p.z||0)+1.3,tz(p.y)),e=new THREE.Vector3(tx(k.x),GY(k.x,k.y)+4.3,tz(k.y)),d=e.clone().sub(a),L=d.length();
    b.position.copy(a).addScaledVector(d,0.5);b.scale.set(1,L,1);b.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());b.material.opacity=0.55+0.3*Math.sin(now/70+p.x);
    if(Math.random()<0.4)PARTS.push({x:k.x+rnd(-14,14),y:k.y+rnd(-14,14),h:GY(k.x,k.y)+4.3+rnd(-0.8,0.8),vx:rnd(-40,40),vy:rnd(-40,40),vh:rnd(0.5,2),life:0.5,max:0.5,col:'#9fd8ff',size:1.6,g:0});}
  for(const [id,b] of SGV3.beams)if(!seen.has(id)){SGV3.g.remove(b);b.geometry.dispose();b.material.dispose();SGV3.beams.delete(id);}
}
function sgDust(pos){const x=pos.x*20+MW/2,y=pos.z*20+MH/2;for(let i=0;i<26;i++)PARTS.push({x:x+rnd(-40,40),y:y+rnd(-40,40),h:rnd(0.3,4),vx:rnd(-60,60),vy:rnd(-60,60),vh:rnd(0.5,3),life:1.4,max:1.4,col:'#b8a488',size:rnd(3,6),g:0,smoke:true,grow:1});}
function sgFx(ev){
  const me=myPos(),near=!me||Math.hypot(ev.x-me.x,ev.y-me.y)<1400;
  if(ev.k==='sgwall'){if(near)snd('rubble',ev);}
  else if(ev.k==='sgcore'){for(let i=0;i<40;i++)PARTS.push({x:ev.x+rnd(-20,20),y:ev.y+rnd(-20,20),h:4.3,vx:rnd(-260,260),vy:rnd(-260,260),vh:rnd(1,7),life:1.1,max:1.1,col:'#9fd8ff',size:2.4,g:6});FX.flashLight(ev.x,ev.y,4.3,'#7fc0ff',6,30,0.6);snd('boom',ev);}
}
// ---------- HUD ----------
function sgTop(v){const S=v.M&&v.M.sg;if(!S)return '🏰 บุกปราสาท';const i=S.ph-1,pc=Math.ceil(S.hp[i]/S.mx*100);
  return `🏰 เฟส ${S.ph}/${S.n}   •   แกน ${S.ph} เหลือ ${pc}%   •   `+(S.pr>0?`เตรียมตัว ${S.pr} วิ`:S.ot?`⏱ ต่อเวลา! (ผ่อนผัน ${S.gr.toFixed(1)} วิ)`:`⏱ ${fmtTime(v.tm)}`);}
function sgHud(v,me,big){
  const S=v.M&&v.M.sg;if(!S||!me)return;
  const atk=me.tm===0,F=MAPS.fcs.fcs,k=F.cores[S.ph-1];
  // แถบเลือดแกนทั้ง 3 (ใต้แถบบน)
  const bw=Math.min(110,(SW-80)/S.n-10),x0=SW/2-(bw+10)*S.n/2;
  for(let i=0;i<S.n;i++){const x=x0+i*(bw+10),r=S.hp[i]/S.mx,act=i===S.ph-1;
    cx.fillStyle='rgba(8,10,20,0.7)';cx.fillRect(x,52,bw,12);cx.fillStyle=S.hp[i]<=0?'#555':act&&S.atk?'#ff6a5a':act?'#7fc0ff':'#4a5a70';cx.fillRect(x+1,53,(bw-2)*r,10);
    if(act){cx.strokeStyle=HG2;cx.lineWidth=1.5;cx.strokeRect(x-1,51,bw+2,14);}
    cx.font='600 11px Kanit,sans-serif';cx.textAlign='center';cx.fillStyle='#efe6cf';cx.fillText(S.hp[i]<=0?'แตกแล้ว':'แกน '+(i+1),x+bw/2,78);}
  cx.textAlign='center';
  big(`คุณเป็น${atk?SG_TEAM[0]:SG_TEAM[1]} (${TEAMN[me.tm]||''})`,96,14,atk?'#8fc8ff':'#ff9a9a');
  if(S.atk)big('⚠️ แกนกำลังถูกร่ายทำลาย',SH*0.2,18,'#ff8a7a');
  // เครื่องหมายแกนบนจอ
  if(k&&me.al){const s=toScreen(k.x,(GY(k.x,k.y)||0)+4,k.y),d=Math.round(Math.hypot(k.x-me.x,k.y-me.y)/20);
    if(s&&s[0]>30&&s[0]<SW-30&&s[1]>30&&s[1]<SH-30){cx.save();cx.translate(s[0],s[1]);cx.rotate(Math.PI/4);cx.strokeStyle=S.atk?'#ff6a5a':'#9fd8ff';cx.lineWidth=2.5;cx.strokeRect(-9,-9,18,18);cx.restore();
      cx.font='600 13px Kanit,sans-serif';cx.fillStyle='#efe6cf';cx.fillText(`แกน ${S.ph} • ${d} ม.`,s[0],s[1]-18);}}
  if(atk&&me.al&&S.pr<=0&&k){const inz=Math.hypot(me.x-k.x,me.y-k.y)<S.zr+PR;
    if(me.sc)big('🔮 กำลังร่ายทำลายแกน… (ยิง / โล่ / สกิล / พุ่ง = หยุด • G = หยุด)',SH-170,17,'#9fd8ff');
    else if(inz)big('กด G เพื่อร่ายทำลายแกน',SH-170,18,'#ffe9a8');}
  if(atk&&S.pr>0)big(`ฝ่ายรับกำลังเตรียมตัว — ประตูเปิดใน ${S.pr} วิ`,SH*0.36,22,'#ffe9a8');
  if(!atk&&S.pr>0)big(`เตรียมแนวป้องกัน — ฝ่ายบุกออกมาใน ${S.pr} วิ`,SH*0.36,22,'#ffe9a8');
}
