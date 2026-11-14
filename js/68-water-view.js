// =====================================================================
//  สายน้ำ 💧 — ภาพฝั่งผู้เล่น • VFX = assets/fx/water/* (tools/water-vfx-gen.py, สไตล์ designs/water_ref/style_toon_orb.png)
//  เรียกจาก: efxFX (js/25, z ขึ้นต้น 'wt') • syncPlayers (js/35 waterFX) • render loop (js/37 syncWater) • HUD (js/35 drawWaterHud)
// =====================================================================
const WTV={st:new Map(),wf:new Map(),sk:new Map(),bm:[],ol:[]};   // sk = ตัวละครกำลังจม/โผล่ (Dash) ตาม id
const WTC={hi:'#e3f7ff',main:'#4fc3ff',deep:'#1466c8',neon:'#7ff6ff'};
// ตัวละครต้องร่าย/รับแรงต่อเนื่องตลอด Beam ไม่กลับไปท่ายืนหลังท่าเปิด0.65วิ
const WT_BODY={
  gather:[-0.95,-0.5,-0.28,-0.05,-1.1,0.4,0.03,-0.08],ready:[-2.2,-0.18,-0.12,-0.12,-1.65,0.1,0,-0.05],
  recoil:[-1.36,-0.06,0.1,-0.24,-1.4,-0.15,-0.03,-0.12],channel:[-1.58,-0.05,0.06,-0.1,-1.4,-0.15,0,-0.05],
  aim:[-1.85,-0.12,0.06,-0.06,-1.2,0.35,0,-0.03],sink:[-1.0,0.5,0,0.35,-1.0,-0.5,0,-0.28],pop:[-1.7,-0.5,0,-0.12,-1.3,0.5,0,-0.12]
},WT_BRACE=[0.28,-0.38,0.14,-0.14],WT_DASH_FEET=[-0.6,0.25,0.12,-0.12];
// Moonwater ยิง (ผู้ใช้ 2026-11-11): หันข้างเอาไหล่ข้างถือไม้ไปหน้า ยื่นไม้ตรงไปข้างหน้า ยืนกางขา ค้างตลอดลำ แล้วคืนท่า
const WMB_POSE={by:1.1,rx:-1.5,ry:0.0,rz:-1.05};
function waterMoonPose(o,p,dt){o.wmb+=dt;const u=o.wmb,sm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);},w=sm(u/0.08)*(1-sm((u-0.62)/0.25));if(u>0.9||!p.al){o.wmb=undefined;return false;}
  const R=o.armR.rotation,L=o.armL.rotation,P=WMB_POSE,a=o.legs[0].position.x>0?o.legs[0]:o.legs[1],b=a===o.legs[0]?o.legs[1]:o.legs[0];
  const pitch=p.wt?.[9]?p.wt[9][1]/1000:o.wmbPitch||0;
  o.b.rotation.y=lerp(o.b.rotation.y,P.by,w);R.x=lerp(R.x,P.rx-pitch*0.65,w);R.y=lerp(R.y,P.ry,w);R.z=lerp(R.z,P.rz,w);L.x=lerp(L.x,0.35,w);L.z=lerp(L.z,0.55,w);a.rotation.x=lerp(a.rotation.x,0.28,w);b.rotation.x=lerp(b.rotation.x,-0.28,w);o.b.rotation.x=lerp(o.b.rotation.x,0.08,w);return true;}
function waterCharacterPose(o,p,dt,now){
  if(o.wmb!==undefined&&waterMoonPose(o,p,dt))return;
  const A=p.wt;
  if(!A||!p.al||p.dn||p.fl||p.st){o.wBeamPose=null;return;}
  if(A[10]||o.cageToss>0){
    const charge=clamp(A[10]/100||0,0,1),toss=o.cageToss>0?1-o.cageToss/0.32:0;
    o.cageToss=Math.max(0,(o.cageToss||0)-dt);
    const pose=[lerp(-0.65,-1.9,_cs(Math.min(1,toss*4))),lerp(-1.15,-0.12,toss),lerp(0.65,-0.35,toss),0.1,-0.8,0.4,0.05,0];
    characterStance(o,pose,null,A[10]?Math.min(1,charge*7):1-_cs(toss));return;
  }
  let s=o.wBeamPose;
  if(A[7]){
    if(!s)s=o.wBeamPose={phase:0,t:0,w:0,P:WT_BODY.gather.slice()};
    const phase=A[3]!==null&&A[3]!==undefined?2:1;if(phase!==s.phase){s.phase=phase;s.t=0;}
    s.t+=dt;s.w=Math.min(1,s.w+dt*10);
    if(phase===1)characterPoseMix(s.P,WT_BODY.gather,WT_BODY.ready,_cs(Math.min(1,s.t/Math.max(0.1,WT_AB.cast-0.15))));
    else{characterPoseMix(s.P,WT_BODY.recoil,WT_BODY.channel,_cs(Math.min(1,s.t/0.22)));s.P[0]+=Math.sin(now/43)*0.016;s.P[3]+=Math.sin(now/71)*0.012;}
    const pitch=(A[8]||0)/1000;
    s.P[0]-=pitch*0.65;s.P[4]-=pitch*0.35;
    characterStance(o,s.P,WT_BRACE,s.w);wandTwoHand(o,s.w*0.92);return;
  }
  if(s&&s.phase!==3){s.phase=3;s.t=0;}
  if(s&&s.phase===3){s.t+=dt;const w=1-_cs(Math.min(1,s.t/0.45));
    if(w>0&&!p.sh&&!o.caN){characterStance(o,s.P,p.wv>1?null:WT_BRACE,w);wandTwoHand(o,w*0.75);return;}
    if(!w)o.wBeamPose=null;
  }
  const dash=WTV.sk.get(p.id);
  if(dash){const w=Math.sin(Math.min(1,dash.e/0.35)*Math.PI)*0.9;characterStance(o,dash.k==='s'?WT_BODY.sink:WT_BODY.pop,WT_DASH_FEET,w);return;}
  if(A[5]===2&&!p.sh&&!o.caN){characterStance(o,WT_BODY.aim,p.wv>1?null:WT_BRACE,0.8);}
}
function wtState(id){let s=WTV.st.get(id);if(!s){s={};WTV.st.set(id,s);}return s;}
function wtStop(s,k){if(s[k]){fxStop(s[k]);s[k]=null;}}
function wtMesh(s,k){if(s[k]){scene.remove(s[k]);if(s[k].userData.own)s[k].geometry.dispose();s[k]=null;}}
// ร่างโคลนน้ำ (ผู้ใช้ 2026-11-01: ร่างตัวละครเป็นน้ำ): อบท่าตอนกดของโมเดลตัวละคร (รวม skinned) เป็น mesh นิ่ง ทาด้วยน้ำการ์ตูน toonwater
const _wtV=new THREE.Vector3(),_wtP=new THREE.Vector3();
function wtBakeClone(o){const src=o.fileModel||o.b;if(!src)return null;o.g.updateMatrixWorld(true);_wtP.setFromMatrixPosition(o.g.matrixWorld);
  const pos=[],uv=[],idx=[];
  src.traverse(m=>{if(!m.isMesh||!m.visible||!m.geometry||!m.geometry.attributes.position)return;const g=m.geometry,P=g.attributes.position,I=g.index,b=pos.length/3;
    for(let i=0;i<P.count;i++){_wtV.fromBufferAttribute(P,i);if(m.isSkinnedMesh)m.applyBoneTransform(i,_wtV);m.localToWorld(_wtV);_wtV.sub(_wtP);
      pos.push(_wtV.x,_wtV.y,_wtV.z);uv.push(Math.atan2(_wtV.x,_wtV.z)/6.283+0.5,_wtV.y*0.6);}
    if(I)for(let k=0;k<I.count;k++)idx.push(b+I.getX(k));else for(let k=0;k<P.count;k++)idx.push(b+k);});
  if(!pos.length)return null;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
  const mt=fxToonWaterMat('#9ff4ff','#36b8f5',1,1.2,1.5,1);   // ฟ้าเดียวกับสายน้ำmt.uniforms.uOp.value=0.85;mt.depthWrite=true;
  const me=new THREE.Mesh(geo,mt);me.renderOrder=3;me.userData.own=1;scene.add(me);return me;}
// เส้นน้ำโคลน→ตัวเรา (ผู้ใช้: บาง + มีคลื่นวิ่งข้างในเป็นสีนิดๆ): พื้นฟ้าอมเขียว + คลื่นสีเข้มกว่าส่ายวิ่งไปหาตัวเรา + ยอดขาวบาง • ขอบจาง
function wtLineMat(){return new THREE.ShaderMaterial({uniforms:{time:FIRE_U.time},transparent:true,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform float time;varying vec2 vUv;void main(){float v=vUv.y,u=vUv.x;'+
    'float c0=0.5+0.26*sin(v*18.0-time*9.0),w=abs(u-c0);float band=1.0-smoothstep(0.12,0.18,w);float crest=1.0-smoothstep(0.0,0.05,abs(w-0.2));'+
    'vec3 c=mix(vec3(0.5,0.86,1.0),vec3(0.08,0.38,0.9),band*0.9);c=mix(c,vec3(1.1),crest);'+
    'float a=(1.0-smoothstep(0.38,0.5,abs(u-0.5)))*0.85;gl_FragColor=vec4(c,a);}'});}
// ขอบขาวเรืองรอบตัวผู้เล่น (เห็นทะลุลูกน้ำ Aqua Cage): เปลือกกลับด้านพองออกตามผิว วาดทีหลังสุด • หมดเวลาแล้วลบ (syncWater)
const _wtOlMat=new THREE.MeshBasicMaterial({color:0xcffcff,side:THREE.BackSide,fog:false,transparent:true,opacity:1,depthWrite:false});
_wtOlMat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>'+String.fromCharCode(10)+'  transformed += normalize(normal) * 0.1;');};
function wtOutline(id,dur){const o=PM3.get(id);if(!o||!o.g)return;const L=[];
  o.g.traverse(m=>{if(!m.isMesh||m.userData.wtOl||m.userData.eOl||!m.parent||!m.visible||m.material.transparent)return;
    const c=m.isSkinnedMesh?new THREE.SkinnedMesh(m.geometry,_wtOlMat):new THREE.Mesh(m.geometry,_wtOlMat);if(m.isSkinnedMesh)c.bind(m.skeleton,m.bindMatrix);
    c.position.copy(m.position);c.quaternion.copy(m.quaternion);c.scale.copy(m.scale);c.userData.wtOl=1;c.renderOrder=999;c.frustumCulled=false;m.parent.add(c);L.push(c);});
  WTV.ol.push({L,t:dur});}
// Dash: ตัวละครจมลงพื้น 0.35 วิ (WAV.dsSink) แล้วโผล่ขึ้น 0.25 วิ — เลื่อนโมเดลลง (ของจริงอยู่ที่ host)
const WT_SINKD=2.4;
function wtSinkOffset(o,p,dt){const k0=WTV.sk.get(p.id);let d=0;
  if(k0){const e=(k0.e+=dt);
    if(k0.k==='s'){const k=Math.min(1,e/WAV.dsSink);d=WT_SINKD*k*k;if(e>1.5)WTV.sk.delete(p.id);}
    else{const k=e/0.25;if(k>=1)WTV.sk.delete(p.id);else d=WT_SINKD*(1-k)*(1-k);}}
  o.g.position.y-=d;
  // ลึกเกินครึ่งตัว = ซ่อนตัว (ผ้าคลุม js/49 ชนพื้น จะกองบนพื้นแทนที่จะจมตาม)
  const hide=d>1.1;if(hide){o._wtHid=1;o.g.visible=false;}else if(o._wtHid){o._wtHid=0;o.g.visible=true;}}
const wtAlive=I=>I&&FXR.inst.includes(I);
// เล่น fx วน ค้างไว้ใน s[k] (เล่นใหม่ถ้าหลุด)
function wtLoop(s,k,name,o){if(!wtAlive(s[k]))s[k]=fxPlay(name,o);return s[k];}

// Tidecaller เรียกออกมา (ผู้ใช้ 2026-11-01): ตัวงูน้ำบินวงกว้างจากเท้าขึ้นไหล่แบบอัลติ แล้วโมเดลงูใน water/fam_serpent รับช่วงต่อ • ทางเดียวกับ tools/water-fam-rise-gen.py
const WT_FR={u0:.16,T:1.3,R:44,N:8,len:.42,end:[-.42,1.95,.55]};WT_FR.a=Math.atan2(WT_FR.end[2],WT_FR.end[0]);WT_FR.rr=Math.hypot(WT_FR.end[0],WT_FR.end[2]);
function wtFrPath(u0,v){const u=WT_FR.u0+(1-WT_FR.u0)*u0,e=u*u*(3-2*u),q=e*0.6+u*0.4,r=1.5*Math.pow(Math.sin(Math.PI*Math.min(1,q*1.05)),0.8)*(1-0.25*q)+0.3+(WT_FR.rr-0.3)*q*q*q,a=WT_FR.a-(1-q)*1.75*6.283;
  return v.set(r*Math.cos(a),-0.2+(WT_FR.end[1]+0.2)*q+0.35*Math.sin(q*Math.PI),r*Math.sin(a));}
const _wtFa=new THREE.Vector3(),_wtFb=new THREE.Vector3(),_wtFs=new THREE.Vector3(),_wtFn=new THREE.Vector3();
function wtFamRiseMesh(){const R=WT_FR.R,N=WT_FR.N;const g=new THREE.BufferGeometry(),n=(R+1)*(N+1),idx=[];for(let i=0;i<R;i++)for(let j=0;j<N;j++){const a=i*(N+1)+j,b=a+N+1;idx.push(a,b,a+1,b,b+1,a+1);}
    const uv=new Float32Array(n*2);for(let i=0;i<=R;i++)for(let j=0;j<=N;j++){uv[(i*(N+1)+j)*2]=j/N;uv[(i*(N+1)+j)*2+1]=i/R*3;}
    g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(n*3),3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(idx);
    const m=fxToonWaterMat('#9ff4ff','#36b8f5',0.6,3,1,0,0);m.side=THREE.DoubleSide;m.depthWrite=true;const M=new THREE.Mesh(g,m);M.frustumCulled=false;M.renderOrder=3;return M;}
// เมชใช้ซ้ำ ห้าม dispose: วัสดุหาย = three.js ลบ shader แล้ว compile ใหม่ทุกครั้งที่กดสกิล (กระตุก)
const WT_POOL={fr:[],bm:[]};
function wtFamRise(S,o){const k=S.famT/WT_FR.T;if(k>=1){wtFamRiseOff(S);return;}const R=WT_FR.R,N=WT_FR.N;
  if(!S.fr){S.fr=WT_POOL.fr.pop()||wtFamRiseMesh();scene.add(S.fr);}
  const M=S.fr,P=M.geometry.attributes.position.array;M.position.copy(o.g.position);M.rotation.y=o.g.rotation.y;
  for(let i=0;i<=R;i++){const w=i/R,u=Math.max(0,k-WT_FR.len*(1-w));wtFrPath(u,_wtFa);wtFrPath(Math.min(1,u+0.006),_wtFb);_wtFb.sub(_wtFa).normalize();_wtFs.set(_wtFb.z,0,-_wtFb.x);if(_wtFs.lengthSq()<1e-4)_wtFs.set(1,0,0);_wtFs.normalize();_wtFn.crossVectors(_wtFb,_wtFs);
    const r=(0.015+0.15*Math.pow(Math.sin(Math.min(1,w*1.08)*Math.PI*0.5),1.4))*(w>0.93?1+(w-0.93)*7:1)*(w>0.985?0.45:1);
    for(let j=0;j<=N;j++){const t=j/N*6.283,c=Math.cos(t)*r,s=Math.sin(t)*r,n=(i*(N+1)+j)*3;P[n]=_wtFa.x+_wtFs.x*c+_wtFn.x*s;P[n+1]=_wtFa.y+_wtFs.y*c+_wtFn.y*s;P[n+2]=_wtFa.z+_wtFs.z*c+_wtFn.z*s;}}
  M.geometry.attributes.position.needsUpdate=true;M.geometry.computeVertexNormals();}
function wtFamRiseOff(S){if(S.fr){scene.remove(S.fr);WT_POOL.fr.push(S.fr);S.fr=null;}}
// ลำ Abyssal Beam (ผู้ใช้ 2026-11-01): ท่อน้ำที่คลื่นวิ่งตลอดความยาว ผิวเป็นชิ้นขาว/ฟ้าการ์ตูน + เปลือกนอกเป็นลิ้นคลื่น • ยาวถึงจุดที่ host บอก (A[6])
const _wtTube=new THREE.CylinderGeometry(1,1,1,28,110,true).translate(0,0.5,0).rotateX(Math.PI/2);
const WT_BEAM_V='uniform float time,uLen,uR,uAmp,uFl;varying vec2 vQ;varying vec3 vN;varying vec3 vV;void main(){float s=position.z*uLen,z=position.z,a=atan(position.y,position.x),st=smoothstep(0.0,1.5,s);'+
  'float w=uAmp*(0.1*sin(s*2.2-time*34.0)+0.06*sin(s*5.1-time*52.0+a*2.0));float fl=smoothstep(uLen-3.2,uLen,s);float r=uR*(1.0-0.45*z)*(0.72+0.28*st)*(1.0+w*st)*(1.0+uFl*fl*fl);'+
  'vec4 mv=modelViewMatrix*vec4(position.x*r,position.y*r,s,1.0);vQ=vec2(a,s);vN=normalize(normalMatrix*vec3(position.x,position.y,0.0));vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}';
const WT_BEAM_F='uniform float time,uLen;varying vec2 vQ;varying vec3 vN;varying vec3 vV;void main(){float fr=1.0-abs(dot(normalize(vN),normalize(vV))),a=vQ.x,s=vQ.y;'+
  'if(sin(a*7.0+time*19.0)+sin(a*11.0-time*13.0)>(uLen-s)*1.7)discard;'+
  'float f=sin(a*3.0+s*0.35-time*5.0)+0.8*sin(s*1.05-time*30.0+a*2.0),g=sin(a*2.0-s*0.5+time*9.0);'+
  'vec3 c=g>0.0?vec3(0.05,0.42,0.98):vec3(0.04,0.72,0.9);if(f>0.2)c=vec3(0.16,0.86,0.96);if(f>0.95)c=vec3(0.86,1.0,1.0);if(fr>0.7)c=vec3(0.03,0.22,0.78);gl_FragColor=vec4(c*0.92,1.0);}';
const WT_BEAM_O='uniform float time,uLen;varying vec2 vQ;varying vec3 vN;varying vec3 vV;void main(){float a=vQ.x,s=vQ.y,fr=1.0-abs(dot(normalize(vN),normalize(vV)));'+
  'if(sin(a*5.0-time*17.0)+sin(a*9.0+time*11.0)>(uLen-s)*1.3)discard;'+
  'float f=sin(s*0.42-time*22.0+a*2.0)+0.6*sin(s*1.3-time*33.0-a*3.0);if(f<0.55)discard;vec3 c=sin(s*0.3-time*8.0)>0.0?vec3(0.1,0.45,1.0):vec3(0.12,0.85,0.9);gl_FragColor=vec4(c,0.8*(1.0-fr*0.4));}';
function wtBeamMesh(){const U={time:FIRE_U.time,uLen:{value:1},uR:{value:0.34},uAmp:{value:1},uFl:{value:3.2}},U2={time:FIRE_U.time,uLen:U.uLen,uR:{value:0.5},uAmp:{value:1.6},uFl:{value:3.6}};
  const m=new THREE.Mesh(_wtTube,new THREE.ShaderMaterial({uniforms:U,vertexShader:WT_BEAM_V,fragmentShader:WT_BEAM_F,side:THREE.DoubleSide,fog:false})),
    o=new THREE.Mesh(_wtTube,new THREE.ShaderMaterial({uniforms:U2,vertexShader:WT_BEAM_V,fragmentShader:WT_BEAM_O,transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:false}));
  m.add(o);m.frustumCulled=o.frustumCulled=false;m.renderOrder=4;o.renderOrder=5;return m;}
function wtBeamSync(S,o,p,a,pt,L,dt){if(!S.bm){S.bm=WT_POOL.bm.pop()||wtBeamMesh();scene.add(S.bm);S.bL=0;}S.bL=Math.min(L,S.bL+dt*2400);S.bL+=(L-S.bL)*Math.min(1,dt*30);
  const c=Math.cos(a)*Math.cos(pt),n=Math.sin(a)*Math.cos(pt),rise=Math.sin(pt)/20;
  const y0=o.g.position.y+WT_BEAM_H,L0=Math.min(56,S.bL),ex=p.x+c*S.bL,ey=p.y+n*S.bL,B=S.bm;
  B.visible=S.bL-L0>2;
  B.position.set(tx(p.x+c*L0),y0+rise*L0,tz(p.y+n*L0));_wtA.set(tx(ex),y0+rise*S.bL,tz(ey));
  if(B.visible)B.lookAt(_wtA);
  B.material.uniforms.uLen.value=Math.max(0.1,(S.bL-L0)/20);
  const th=Math.max(0,_wtA.y-GY(ex,ey)),I=wtLoop(S,'tip','water/beam_tip',{x:ex,y:ey,h:th,a,aim:false});if(I){I.x=ex;I.y=ey;I.h=th;I.a=a;}
  // ปลายลำ (ผู้ใช้ 2026-11-15 ref): โดมออร่าน้ำ + วงกลมเรืองฟ้าหันเข้าหาลำ + น้ำสาดกระจายออกจากวงตลอด
  if(!S.tipD){S.tipD=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),wtTipDomeMat());S.tipD.renderOrder=5;scene.add(S.tipD);
    S.tipR=new THREE.Mesh(new THREE.RingGeometry(0.78,1,64),new THREE.MeshBasicMaterial({color:hdr('#7fe4ff',2.2),transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));S.tipR.renderOrder=6;scene.add(S.tipR);
    S.tipR2=new THREE.Mesh(new THREE.CircleGeometry(0.75,48),new THREE.MeshBasicMaterial({color:hdr('#cff6ff',1.6),transparent:true,opacity:0.35,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));S.tipR2.renderOrder=6;scene.add(S.tipR2);}
  const on=B.visible,T=performance.now()/1000,pl=1+0.06*Math.sin(T*9);S.tipD.visible=S.tipR.visible=S.tipR2.visible=on;
  const TW=S.tipW||(S.tipW=new THREE.Vector3());TW.set(tx(ex),y0+rise*S.bL,tz(ey));   // ปลายลำจริง (_wtA ถูกใช้ซ้ำใน wtLoop)
  if(on){S.tipD.position.copy(TW);S.tipD.scale.setScalar(1.35*pl);S.tipD.material.uniforms.uT.value=T;
    _wtV.set(tx(p.x),y0,tz(p.y));for(const R of [S.tipR,S.tipR2]){R.position.copy(TW);R.lookAt(_wtV);}S.tipR.scale.setScalar(1.15*pl);S.tipR2.scale.setScalar(1.15*pl);S.tipR.rotateZ(T*2);
    const px=-n,py=c;   // ทิศตั้งฉากกับลำ (แนวนอน)
    for(let i=0;i<5;i++){const an=Math.random()*6.283,ca=Math.cos(an),sa=Math.sin(an),sp=Math.random()*90+110,back=Math.random()*60+20;
      PARTS.push({x:ex,y:ey,h:th,vx:px*ca*sp-c*back,vy:py*ca*sp-n*back,vh:sa*sp/20+Math.random()*2,life:.45+Math.random()*.3,max:.75,col:i%3?'#bff2ff':'#ffffff',size:2+Math.random()*2.2,g:5,drag:1.5,sh:4,rot:an,vr:Math.random()*6-3});}
    LREQ.push({x:TW.x,y:TW.y,z:TW.z,col:'#7fe4ff',int:2.2,dist:7});}}
let _wtTipM=null;
function wtTipDomeMat(){if(!_wtTipM){_wtTipM=new THREE.ShaderMaterial({uniforms:{uT:{value:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
  vertexShader:'varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-w.xyz);vP=position;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform float uT;varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){float fr=pow(1.-abs(dot(vN,vV)),2.4);float w=smoothstep(.75,1.,sin(vP.y*9.+sin(atan(vP.z,vP.x)*3.+uT*2.)*1.2-uT*3.)*.5+.5);float a=fr*.75+w*.25*fr+.03;vec3 col=mix(vec3(.2,.7,1.),vec3(.85,.97,1.),fr);gl_FragColor=vec4(col*a,a);}'});_wtTipM.userData.keep=true;}return _wtTipM;}
function wtBeamOff(S){if(S.bm){scene.remove(S.bm);WT_POOL.bm.push(S.bm);S.bm=null;}wtStop(S,'tip');for(const k of ['tipD','tipR','tipR2'])if(S[k]){scene.remove(S[k]);S[k].geometry.dispose();if(k!=='tipD')S[k].material.dispose();S[k]=null;}}

// ---------- ต่อผู้เล่น: โล่ฟองน้ำ/ฮีล • ลูกผู้ช่วยที่ไหล่ • ร่างโคลน + เส้นน้ำ • ลำน้ำ Abyssal • Moonwater • มังกร ----------
function waterFX(o,p,pz,now,dt){
  const A=p.wt,s=WTV.st.get(p.id);
  if(!A){if(s){for(const k of ['sh','heal','fam','jaw','cl','clmA','clmB','beam','moon','drg','aim','cageCharge'])wtStop(s,k);wtBeamOff(s);wtFamRiseOff(s);wtMesh(s,'ln');wtMesh(s,'cm');s.cmD=s.cmT=0;}return;}
  const S=wtState(p.id),alive=p.al&&!p.dn,a=p.a||0,t=now/1000;
  if(alive&&A[10]){
    const k=clamp(A[10]/100,0,1),side=23-9*k*k,front=4+19*k*k;
    const x=p.x+Math.cos(a)*front-Math.sin(a)*side,y=p.y+Math.sin(a)*front+Math.cos(a)*side,h=pz+1.4;
    const I=wtLoop(S,'cageCharge','water/cage_fly',{x,y,h,a,s:0.22});
    if(I){I.x=x;I.y=y;I.h=h;I.a=a;I.s=0.22+0.78*k;}
  }else wtStop(S,'cageCharge');
  wtSinkOffset(o,p,dt);
  // โล่ฟองน้ำ + ฮีล (มีเกจ)
  if(alive&&p.sh){wtLoop(S,'sh','water/shield_bubble',{x:p.x,y:p.y,h:0,follow:p.id});if(A[0]>0)wtLoop(S,'heal','water/shield_heal',{x:p.x,y:p.y,h:0,follow:p.id});else wtStop(S,'heal');}
  else{wtStop(S,'sh');wtStop(S,'heal');}
  // ลูกผู้ช่วย: ลอยที่ไหล่ขวา (ผู้ใช้: ให้เห็นง่ายว่ากำลังใช้)
  if(alive&&A[1]){wtLoop(S,'fam','water/fam_serpent',{x:p.x,y:p.y,h:0,follow:p.id});   // งูทะเลน้ำพันตัว หัวที่ไหล่ขวา หันตามตัว (ผู้ใช้ 2026-11-01)
    // ขากรรไกรแยกชิ้น: ขึ้นหลังงูเรียกเสร็จ (1.3 วิ) • ตอนยิง (wtPew) หยุด 0.45 วิ ให้ fam_jawopen อ้าปากแทน
    S.famT=(S.famT||0)+dt;wtFamRise(S,o);if(S.jawT>0){S.jawT-=dt;wtStop(S,'jaw');}else if(S.famT>1.3)wtLoop(S,'jaw','water/fam_jaw',{x:p.x,y:p.y,h:0,follow:p.id});}
  else{wtStop(S,'fam');wtStop(S,'jaw');S.famT=0;wtFamRiseOff(S);}
  // ร่างโคลน + เส้นน้ำบนพื้นจากโคลนถึงตัวเรา
  if(A[4]){const I=wtLoop(S,'cl','water/clone',{x:A[4][0],y:A[4][1],h:0,a,aim:false});if(I){I.x=A[4][0];I.y=A[4][1];}
    const cx=tx(A[4][0]),cz=tz(A[4][1]),cy=GY(A[4][0],A[4][1]),P=o.g.position;
    wtLoop(S,'clmA','water/clone_mark',{x:p.x,y:p.y,h:0,follow:p.id});{const J=wtLoop(S,'clmB','water/clone_mark',{x:A[4][0],y:A[4][1],h:0,aim:false});if(J){J.x=A[4][0];J.y=A[4][1];}}
    if(!S.cmT){if(S.cm){wtMesh(S,'cm');S.cmD=0;}S.cm=wtBakeClone(o);S.cmT=1;}
    if(S.cm)S.cm.position.set(cx,cy,cz);
    if(!S.ln){const m=wtLineMat();S.ln=new THREE.Mesh(new THREE.PlaneGeometry(0.22,1),m);S.ln.userData.own=1;S.ln.rotation.order='YXZ';S.ln.rotation.x=-Math.PI/2;S.ln.renderOrder=3;scene.add(S.ln);}
    const dx=P.x-cx,dz=P.z-cz,L=Math.hypot(dx,dz)||0.01,u=S.ln.geometry.attributes.uv;S.ln.scale.set(1,L,1);S.ln.position.set((P.x+cx)/2,Math.min(cy,o.zs)+0.06,(P.z+cz)/2);S.ln.rotation.y=Math.atan2(dx,dz);
    for(let k=0;k<4;k++)u.setY(k,u.getY(k)>0.5?L/2:0);u.needsUpdate=true;}   // ลายน้ำซ้ำทุก 2 ม. (ไม่ยืดตามความยาว)
  else{wtStop(S,'cl');wtStop(S,'clmA');wtStop(S,'clmB');wtMesh(S,'ln');if(S.cm&&!S.cmD)S.cmD=1e-4;S.cmT=0;}
  // ร่างโคลนหมดเวลา/ถูกเรียกกลับ: ยุบละลายลงพื้น 0.3 วิ แล้วหาย
  if(S.cmD){const k=(S.cmD+=dt)/0.3;if(k>=1){wtMesh(S,'cm');S.cmD=0;}else{S.cm.scale.set(1+k*0.3,1-k,1+k*0.3);S.cm.material.uniforms.uOp.value=0.85*(1-k*0.6);}}
  // ลำน้ำ Abyssal Beam — fx ตามตำแหน่งและมุมลำจาก host
  if(A[3]!==null&&A[3]!==undefined){
    const a=A[3]/100,pt=(A[8]||0)/1000;
    const I=wtLoop(S,'beam','water/beam_loop',{x:p.x,y:p.y,h:0,follow:p.id,aim:false,a,aimPitch:pt,pivotY:WT_BEAM_H});
    if(I){I.a=a;I.o.aimPitch=pt;}
    wtBeamSync(S,o,p,a,pt,A[6]??WT_AB.len,dt);
  }else{wtStop(S,'beam');wtBeamOff(S);}
  if(A[9]&&wtAlive(S.moonBeam)){S.moonBeam.a=A[9][0]/1000;S.moonBeam.o.aimPitch=A[9][1]/1000;o.wmbPitch=S.moonBeam.o.aimPitch;}
  // Moonwater Arts 8 วิ
  if(alive&&A[2])wtLoop(S,'moon','water/moon_aura',{x:p.x,y:p.y,h:0,follow:p.id});else wtStop(S,'moon');
  // มังกร: ลอยเหนือหัวขวาระหว่างเลือกจุด + วงเล็ง (เฉพาะเรา)
  if(A[5])wdgKeep(p.id);   // มังกรตัวจริงอยู่ js/70
  if(A[5]===2&&p.id===NET.myId){let gx=typeof INPUT.gx==='number'?INPUT.gx:p.x,gy=typeof INPUT.gy==='number'?INPUT.gy:p.y;const d=Math.hypot(gx-p.x,gy-p.y);if(d>700){gx=p.x+(gx-p.x)/d*700;gy=p.y+(gy-p.y)/d*700;}
    const I=wtLoop(S,'aim','water/dragon_aim',{x:gx,y:gy,h:0,aim:false});if(I){I.x=gx;I.y=gy;}}
  else wtStop(S,'aim');
}

// ---------- ทั้งเกม: ลูกผู้ช่วยที่กำลังพุ่ง (ล็อกเป้า) ----------
// Tidecaller (ผู้ใช้ 2026-11-01): งูทะเลยิงลำน้ำเล็กจากปากไปหาเป้า — ลำน้ำยืดจากปากงูถึงหัวกระสุน (host WF) แล้วจางเร็วตอนโดน
const WT_MOUTH=[-0.45,1.86,0.95];   // ปากงู ใน fx ของเจ้าของ (x ขวา, y ขึ้น, z หน้า) — โมเดล water_serpent หัวที่ไหล่ (x กลับข้างแบบตา)
const _wtA=new THREE.Vector3(),_wtB=new THREE.Vector3();
function wtMouth(oid,out){const P=PM3.get(oid),v=VIEW.cur&&VIEW.cur.P.find(p=>p.id===oid);if(!P||!v)return null;const q=simOf(P.g.position),a=v.a||0,c=Math.cos(a),s=Math.sin(a),m=WT_MOUTH;
  const x=q.x+(c*m[2]-s*m[0])*20,y=q.y+(s*m[2]+c*m[0])*20;return out.set(tx(x),P.g.position.y+m[1],tz(y));}
// ลำน้ำงู (ผู้ใช้ 2026-11-01 เลือก 'สายน้ำพ่นเกลียว'): แกนน้ำขาวเรือง + เปลือกน้ำฟ้าที่มีเส้นขาว 2 เส้นพันเกลียววิ่งไปหาเป้า (ระยะเกลียวคงที่ไม่ยืดตามความยาว: uLen)
const _wtCyl=new THREE.CylinderGeometry(1,1,1,14,1,true).translate(0,0.5,0).rotateX(Math.PI/2);
// round 3 (ผู้ใช้: รูป serpent_beam_ref.png — 'really small and bright', pew แล้วหาย ไม่แตกปลาย): แกนขาวสว่างเส้นเล็ก + เรืองฟ้าบาง ๆ รอบ (บวกแสง ไม่ติดหมอก)
function wtBeam(){const g=new THREE.Group(),core=new THREE.MeshBasicMaterial({color:0xffffff,fog:false,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}),
    glow=new THREE.MeshBasicMaterial({color:0x2fa8ff,fog:false,transparent:true,opacity:0.85,blending:THREE.AdditiveBlending,depthWrite:false});
  const c=new THREE.Mesh(_wtCyl,core),sh=new THREE.Mesh(_wtCyl,glow);c.scale.set(0.35,0.35,1);g.add(c,sh);c.renderOrder=6;sh.renderOrder=5;g.userData.sh=sh;g.userData.mats=[core,glow];scene.add(g);return g;}
function syncWater(v,dt,now){const t1=performance.now();wdgTick(dt);pf('wt.dragon',t1);
  for(let i=WTV.ol.length-1;i>=0;i--){const O=WTV.ol[i];O.t-=dt;if(O.t<=0){for(const c of O.L)if(c.parent)c.parent.remove(c);WTV.ol.splice(i,1);}}
  // ลำน้ำงู: วาดตอน host ยิงโดน (efx wtfamhit) — ปากงู → เป้า สว่างแวบ 0.16 วิ แล้วบางลงหาย
  for(let i=WTV.bm.length-1;i>=0;i--){const B=WTV.bm[i];B.t+=dt;const k=Math.max(0,B.t)/0.16;if(k>=1){scene.remove(B.g);for(const m of B.g.userData.mats)m.dispose();WTV.bm.splice(i,1);continue;}
    if(B.t<0){B.g.visible=false;continue;}B.g.visible=true;
    if(B.o!=null&&wtMouth(B.o,_wtA)){_wtA.add(B.off);_wtB.copy(B.p).sub(_wtA).normalize().multiplyScalar(0.18);_wtA.add(_wtB);B.g.position.copy(_wtA);B.g.lookAt(B.p);B.g.scale.z=Math.max(0.01,_wtA.distanceTo(B.p));}const r=0.05*(k<0.5?1:1-(k-0.5)*2);B.g.scale.x=B.g.scale.y=Math.max(0.001,r);}
}
function wtPew(oid,x,y,h){if(oid==null||!wtMouth(oid,_wtA))return;const p=new THREE.Vector3(tx(x),h+GY(x,y),tz(y));
  // วงเวทเกิดสุ่มรอบหัวงู (ผู้ใช้ 2026-11-01: 'randomly where วงเวท') — ลำแสงยิงออกจากวงนั้น
  const off=new THREE.Vector3((Math.random()-0.5)*1.1,Math.random()*0.7-0.15,(Math.random()-0.5)*1.1);_wtA.add(off);const q=simOf(_wtA),a=Math.atan2(y-q.y,x-q.x);
  const S=WTV.st.get(oid);if(S){S.jawT=0.45;fxPlay('water/fam_jawopen',{x:q.x,y:q.y,h:0,follow:oid});}
  fxPlay('water/fam_muzzle',{x:q.x,y:q.y,h:Math.max(0,q.h-GY(q.x,q.y)),a,aim:false});   // วงเวทหน้าปาก (หันหาเป้า)
  const g=wtBeam();g.visible=false;WTV.bm.push({g,p,o:oid,off,t:-0.07});}

if(typeof WD!=='undefined')WD.WTV=WTV;
// ---------- เหตุการณ์ (efx z 'wt…') ----------
function waterEfx(ev){
  const z=ev.z,x=ev.x,y=ev.y,H=ev.h!==undefined?ev.h:0,me=myPos(),near=!me||Math.hypot(x-me.x,y-me.y)<1100,a=ev.a||0;
  switch(z){
    case 'wtslash':{fxPlay('water/ba_muzzle',{x,y,h:0,follow:ev.id});const o=ev.id&&PM3.get(ev.id);if(o)castStart(o,'wdrop',2);if(near)snd('cast_pull',ev);return true;}   // ท่าฟันเฉียงตรงรอยฟันเดิมที่ปล่อยหยดน้ำ3นัด
    case 'wtsink':fxPlay('water/dash_sink',{x,y,h:0});if(ev.id!=null)WTV.sk.set(ev.id,{k:'s',e:0});if(near)snd('cast_pull',ev);return true;
    case 'wtpop':fxPlay('water/dash_pop',{x,y,h:0});if(ev.id!=null)WTV.sk.set(ev.id,{k:'p',e:0});if(near)shake(0.15);return true;
    case 'wtclend':return true;
    case 'wtfam':fxPlay('water/dash_pop',{x,y,h:0,s:0.5});return true;
    case 'wtfamoff':return true;
    case 'wtfamhit':wtPew(ev.id,x,y,H);fxPlay('water/fam_hit',{x,y,h:H});return true;
    case 'wtwave':fxPlay('water/riptide',{x,y,h:0,a,aim:false});if(near){shake(0.12);snd('cast_pull',ev);}return true;
    case 'wtabhit':fxPlay('water/beam_hit',{x,y,h:H});return true;
    case 'wtcagetoss':{const o=PM3.get(ev.id);if(o)o.cageToss=0.32;if(near)snd('cast_pull',ev);return true;}
    case 'wtcage':fxPlay('water/cage_bubble',{x,y,h:0,follow:ev.n});wtOutline(ev.n,2.4);return true;   // ลูกน้ำทึบ: คนที่ถูกขังมีขอบขาวเห็นทะลุ (ผู้ใช้ 2026-11-01)
    case 'wtab':if(!ev.n)fxPlay('water/beam_cast',{x,y,h:0,follow:ev.id});if(near)snd(ev.n?'break':'cast_pull',ev);if(ev.n&&near)shake(0.12);return true;
    case 'wtaboff':return true;
    case 'wtmw':fxPlay('water/moon_mark',{x,y,h:0,follow:ev.id});return true;   // ตราดาวตอนเปิด Moonwater (ผู้ใช้ 2026-11-01)
    case 'wtmwoff':return true;
    case 'wtmb':{const pt=ev.pt||0;wtState(ev.id).moonBeam=fxPlay('water/moon_beam',{x,y,h:0,feetH:H,a,aim:false,aimPitch:pt,pivotY:WT_BEAM_H});const o=PM3.get(ev.id);if(o){o.wmb=0;o.wmbPitch=pt;o.caN=null;o.cpT=0;}if(near)snd('break',ev);return true;}
    case 'wtdg':wdgStart(ev.id,x,y);if(near){shake(0.2);snd('cast_pull',ev);}return true;
    case 'wtdgaim':return true;
    case 'wtdgdive':{const c=VIEW.cur&&VIEW.cur.P.find(q=>q.id===ev.id),da=c?Math.atan2(y-c.y,x-c.x):0;
      skAnim({id:ev.id,s:'dragondeep_dive'});
      wdgDive(ev.id,x,y);{const m=VIEW.cur&&VIEW.cur.P.find(q=>q.id===NET.myId);fxPlay(ev.id!==NET.myId&&!(teamOn()&&m&&c&&m.tm===c.tm)?'water/dragon_warn_foe':'water/dragon_warn',{x,y,h:0,aim:false});}later(WT_UL.rise-0.4,()=>fxPlay('water/dragon_dive',{x,y,h:0,a:da,aim:false}));if(near)for(let k=0;k<WT_UL.n;k++)later(WT_UL.rise+k*WT_UL.gap,()=>{shake(k?0.3:0.6);if(!(k%2))snd('break',ev);});return true;}
    case 'wtdgend':return true;
  }
  return false;
}

// ---------- HUD: เกจฮีลโล่ (โค้งซ้ายรอบเป้าเล็ง) ----------
function drawWaterHud(x,y,A,me){const g=Math.max(0,Math.min(70,A[0]))/70,R=34,a0=Math.PI*0.62,a1=Math.PI*1.38;
  cx.lineCap='round';cx.lineWidth=5;cx.strokeStyle='rgba(0,0,0,0.45)';cx.beginPath();cx.arc(x,y,R,a0,a1);cx.stroke();
  if(g>0){cx.strokeStyle=WTC.main;cx.lineWidth=3.5;cx.beginPath();cx.arc(x,y,R,a1-(a1-a0)*g,a1);cx.stroke();}
  cx.lineCap='butt';cx.font='600 12px Kanit,sans-serif';cx.textAlign='right';cx.fillStyle='#bfeaff';cx.fillText('+'+Math.floor(A[0]),x-R-8,y+4);}
