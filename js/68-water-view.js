// =====================================================================
//  สายน้ำ 💧 — ภาพฝั่งผู้เล่น • VFX = assets/fx/water/* (tools/water-vfx-gen.py, สไตล์ designs/water_ref/style_toon_orb.png)
//  เรียกจาก: efxFX (js/25, z ขึ้นต้น 'wt') • syncPlayers (js/35 waterFX) • render loop (js/37 syncWater) • HUD (js/35 drawWaterHud)
// =====================================================================
const WTV={st:new Map(),wf:new Map(),sk:new Map(),bm:[],ol:[]};   // sk = ตัวละครกำลังจม/โผล่ (Dash) ตาม id
const WTC={hi:'#e3f7ff',main:'#4fc3ff',deep:'#1466c8',neon:'#7ff6ff'};
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
  const mt=fxToonWaterMat('#6cf2e0','#14a89a',1,1.2,1.5,1);   // teal (Dash ใช้โทนนี้)mt.uniforms.uOp.value=0.85;mt.depthWrite=true;
  const me=new THREE.Mesh(geo,mt);me.renderOrder=3;me.userData.own=1;scene.add(me);return me;}
// เส้นน้ำโคลน→ตัวเรา (ผู้ใช้: บาง + มีคลื่นวิ่งข้างในเป็นสีนิดๆ): พื้นฟ้าอมเขียว + คลื่นสีเข้มกว่าส่ายวิ่งไปหาตัวเรา + ยอดขาวบาง • ขอบจาง
function wtLineMat(){return new THREE.ShaderMaterial({uniforms:{time:FIRE_U.time},transparent:true,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform float time;varying vec2 vUv;void main(){float v=vUv.y,u=vUv.x;'+
    'float c0=0.5+0.26*sin(v*18.0-time*9.0),w=abs(u-c0);float band=1.0-smoothstep(0.12,0.18,w);float crest=1.0-smoothstep(0.0,0.05,abs(w-0.2));'+
    'vec3 c=mix(vec3(0.42,0.92,0.84),vec3(0.03,0.5,0.5),band*0.9);c=mix(c,vec3(1.1),crest);'+
    'float a=(1.0-smoothstep(0.38,0.5,abs(u-0.5)))*0.85;gl_FragColor=vec4(c,a);}'});}
// ขอบขาวเรืองรอบตัวผู้เล่น (เห็นทะลุลูกน้ำ Aqua Cage): เปลือกกลับด้านพองออกตามผิว วาดทีหลังสุด • หมดเวลาแล้วลบ (syncWater)
const _wtOlMat=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.BackSide,fog:false,transparent:true,opacity:0.95,depthWrite:false});
_wtOlMat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>'+String.fromCharCode(10)+'  transformed += normalize(objectNormal) * 0.07;');};
function wtOutline(id,dur){const o=PM3.get(id);if(!o||!o.g)return;const L=[];
  (o.fileModel||o.b||o.g).traverse(m=>{if(!m.isMesh||m.userData.wtOl||m.userData.eOl||!m.parent)return;
    const c=m.isSkinnedMesh?new THREE.SkinnedMesh(m.geometry,_wtOlMat):new THREE.Mesh(m.geometry,_wtOlMat);if(m.isSkinnedMesh)c.bind(m.skeleton,m.bindMatrix);
    c.position.copy(m.position);c.quaternion.copy(m.quaternion);c.scale.copy(m.scale);c.userData.wtOl=1;c.renderOrder=999;c.frustumCulled=false;m.parent.add(c);L.push(c);});
  WTV.ol.push({L,t:dur});}
// Dash: ตัวละครจมลงพื้น 0.35 วิ (WT_DS.sink) แล้วโผล่ขึ้น 0.25 วิ — เลื่อนโมเดลลง (ของจริงอยู่ที่ host)
const WT_SINKD=2.4;
function wtSinkOffset(o,p,dt){const k0=WTV.sk.get(p.id);let d=0;
  if(k0){const e=(k0.e+=dt);
    if(k0.k==='s'){const k=Math.min(1,e/0.35);d=WT_SINKD*k*k;if(e>1.5)WTV.sk.delete(p.id);}
    else{const k=e/0.25;if(k>=1)WTV.sk.delete(p.id);else d=WT_SINKD*(1-k)*(1-k);}}
  o.g.position.y-=d;
  // ลึกเกินครึ่งตัว = ซ่อนตัว (ผ้าคลุม js/49 ชนพื้น จะกองบนพื้นแทนที่จะจมตาม)
  const hide=d>1.1;if(hide){o._wtHid=1;o.g.visible=false;}else if(o._wtHid){o._wtHid=0;o.g.visible=true;}}
const wtAlive=I=>I&&FXR.inst.includes(I);
// เล่น fx วน ค้างไว้ใน s[k] (เล่นใหม่ถ้าหลุด)
function wtLoop(s,k,name,o){if(!wtAlive(s[k]))s[k]=fxPlay(name,o);return s[k];}

// ---------- ต่อผู้เล่น: โล่ฟองน้ำ/ฮีล • ลูกผู้ช่วยที่ไหล่ • ร่างโคลน + เส้นน้ำ • ลำน้ำ Abyssal • Moonwater • มังกร ----------
function waterFX(o,p,pz,now,dt){
  const A=p.wt,s=WTV.st.get(p.id);
  if(!A){if(s){for(const k of ['sh','heal','fam','jaw','cl','beam','moon','drg','aim'])wtStop(s,k);wtMesh(s,'ln');wtMesh(s,'cm');s.cmD=s.cmT=0;}return;}
  const S=wtState(p.id),alive=p.al&&!p.dn,a=p.a||0,t=now/1000;
  wtSinkOffset(o,p,dt);
  // โล่ฟองน้ำ + ฮีล (มีเกจ)
  if(alive&&p.sh){wtLoop(S,'sh','water/shield_bubble',{x:p.x,y:p.y,h:0,follow:p.id});if(A[0]>0)wtLoop(S,'heal','water/shield_heal',{x:p.x,y:p.y,h:0,follow:p.id});else wtStop(S,'heal');}
  else{wtStop(S,'sh');wtStop(S,'heal');}
  // ลูกผู้ช่วย: ลอยที่ไหล่ขวา (ผู้ใช้: ให้เห็นง่ายว่ากำลังใช้)
  if(alive&&A[1]){wtLoop(S,'fam','water/fam_serpent',{x:p.x,y:p.y,h:0,follow:p.id});   // งูทะเลน้ำพันตัว หัวที่ไหล่ขวา หันตามตัว (ผู้ใช้ 2026-11-01)
    // ขากรรไกรแยกชิ้น: ขึ้นหลังงูเรียกเสร็จ (1.3 วิ) • ตอนยิง (wtPew) หยุด 0.45 วิ ให้ fam_jawopen อ้าปากแทน
    S.famT=(S.famT||0)+dt;if(S.jawT>0){S.jawT-=dt;wtStop(S,'jaw');}else if(S.famT>1.3)wtLoop(S,'jaw','water/fam_jaw',{x:p.x,y:p.y,h:0,follow:p.id});}
  else{wtStop(S,'fam');wtStop(S,'jaw');S.famT=0;}
  // ร่างโคลน + เส้นน้ำบนพื้นจากโคลนถึงตัวเรา
  if(A[4]){const I=wtLoop(S,'cl','water/clone',{x:A[4][0],y:A[4][1],h:0,a,aim:false});if(I){I.x=A[4][0];I.y=A[4][1];}
    const cx=tx(A[4][0]),cz=tz(A[4][1]),cy=GY(A[4][0],A[4][1]),P=o.g.position;
    if(!S.cmT){if(S.cm){wtMesh(S,'cm');S.cmD=0;}S.cm=wtBakeClone(o);S.cmT=1;}
    if(S.cm)S.cm.position.set(cx,cy,cz);
    if(!S.ln){const m=wtLineMat();S.ln=new THREE.Mesh(new THREE.PlaneGeometry(0.22,1),m);S.ln.userData.own=1;S.ln.rotation.order='YXZ';S.ln.rotation.x=-Math.PI/2;S.ln.renderOrder=3;scene.add(S.ln);}
    const dx=P.x-cx,dz=P.z-cz,L=Math.hypot(dx,dz)||0.01,u=S.ln.geometry.attributes.uv;S.ln.scale.set(1,L,1);S.ln.position.set((P.x+cx)/2,Math.min(cy,o.zs)+0.06,(P.z+cz)/2);S.ln.rotation.y=Math.atan2(dx,dz);
    for(let k=0;k<4;k++)u.setY(k,u.getY(k)>0.5?L/2:0);u.needsUpdate=true;}   // ลายน้ำซ้ำทุก 2 ม. (ไม่ยืดตามความยาว)
  else{wtStop(S,'cl');wtMesh(S,'ln');if(S.cm&&!S.cmD)S.cmD=1e-4;S.cmT=0;}
  // ร่างโคลนหมดเวลา/ถูกเรียกกลับ: ยุบละลายลงพื้น 0.3 วิ แล้วหาย
  if(S.cmD){const k=(S.cmD+=dt)/0.3;if(k>=1){wtMesh(S,'cm');S.cmD=0;}else{S.cm.scale.set(1+k*0.3,1-k,1+k*0.3);S.cm.material.uniforms.uOp.value=0.85*(1-k*0.6);}}
  // ลำน้ำ Abyssal Beam (3 วิ) — fx ตามตัว หันตามตัวผู้เล่น (host หมุนตัวตามลำ)
  if(A[3]!==null&&A[3]!==undefined)wtLoop(S,'beam','water/beam_loop',{x:p.x,y:p.y,h:0,follow:p.id});else wtStop(S,'beam');
  // Moonwater Arts 8 วิ
  if(alive&&A[2])wtLoop(S,'moon','water/moon_aura',{x:p.x,y:p.y,h:0,follow:p.id});else wtStop(S,'moon');
  // มังกร: ลอยเหนือหัวขวาระหว่างเลือกจุด + วงเล็ง (เฉพาะเรา)
  if(A[5]===2)wtLoop(S,'drg','water/dragon_hover',{x:p.x,y:p.y,h:0,follow:p.id});else wtStop(S,'drg');
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
function syncWater(v,dt,now){
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

// ---------- เหตุการณ์ (efx z 'wt…') ----------
function waterEfx(ev){
  const z=ev.z,x=ev.x,y=ev.y,H=ev.h!==undefined?ev.h:0,me=myPos(),near=!me||Math.hypot(x-me.x,y-me.y)<1100,a=ev.a||0;
  switch(z){
    case 'wtslash':fxPlay('water/ba_slash',{x,y,h:0,follow:ev.id});if(near)snd('cast_pull',ev);return true;
    case 'wtsink':fxPlay('water/dash_sink',{x,y,h:0});if(ev.id!=null)WTV.sk.set(ev.id,{k:'s',e:0});if(near)snd('cast_pull',ev);return true;
    case 'wtpop':fxPlay('water/dash_pop',{x,y,h:0});if(ev.id!=null)WTV.sk.set(ev.id,{k:'p',e:0});if(near)shake(0.15);return true;
    case 'wtclend':return true;
    case 'wtfam':fxPlay('water/dash_pop',{x,y,h:0,s:0.5});return true;
    case 'wtfamoff':return true;
    case 'wtfamhit':wtPew(ev.id,x,y,H);fxPlay('water/fam_hit',{x,y,h:H});return true;
    case 'wtwave':fxPlay('water/riptide',{x,y,h:0,a,aim:false});if(near){shake(0.12);snd('cast_pull',ev);}return true;
    case 'wtabhit':fxPlay('water/beam_hit',{x,y,h:H});return true;
    case 'wtcage':fxPlay('water/cage_bubble',{x,y,h:0,follow:ev.n});wtOutline(ev.n,2.4);return true;   // ลูกน้ำทึบ: คนที่ถูกขังมีขอบขาวเห็นทะลุ (ผู้ใช้ 2026-11-01)
    case 'wtab':if(!ev.n)fxPlay('water/beam_cast',{x,y,h:0,follow:ev.id});if(near)snd(ev.n?'break':'cast_pull',ev);if(ev.n&&near)shake(0.12);return true;
    case 'wtaboff':return true;
    case 'wtmw':fxPlay('water/moon_mark',{x,y,h:0,follow:ev.id});return true;   // ตราดาวตอนเปิด Moonwater (ผู้ใช้ 2026-11-01)
    case 'wtmwoff':return true;
    case 'wtmb':fxPlay('water/moon_beam',{x,y,h:0,a,aim:false});if(near)snd('break',ev);return true;
    case 'wtdg':fxPlay('water/dragon_intro',{x,y,h:0,follow:ev.id});if(near){shake(0.2);snd('cast_pull',ev);}return true;
    case 'wtdgaim':return true;
    case 'wtdgdive':{const c=VIEW.cur&&VIEW.cur.P.find(q=>q.id===ev.id),da=c?Math.atan2(y-c.y,x-c.x):0;
      fxPlay('water/dragon_dive',{x,y,h:0,a:da,aim:false});if(near)snd('break',ev);later(0.7,()=>{if(near)snd('break',ev);});return true;}
    case 'wtdgend':return true;
  }
  return false;
}

// ---------- HUD: เกจฮีลโล่ (โค้งซ้ายรอบเป้าเล็ง) ----------
function drawWaterHud(x,y,A,me){const g=Math.max(0,Math.min(70,A[0]))/70,R=34,a0=Math.PI*0.62,a1=Math.PI*1.38;
  cx.lineCap='round';cx.lineWidth=5;cx.strokeStyle='rgba(0,0,0,0.45)';cx.beginPath();cx.arc(x,y,R,a0,a1);cx.stroke();
  if(g>0){cx.strokeStyle=WTC.main;cx.lineWidth=3.5;cx.beginPath();cx.arc(x,y,R,a1-(a1-a0)*g,a1);cx.stroke();}
  cx.lineCap='butt';cx.font='600 12px Kanit,sans-serif';cx.textAlign='right';cx.fillStyle='#bfeaff';cx.fillText('+'+Math.floor(A[0]),x-R-8,y+4);}
