// =====================================================================
//  ฝั่งแสดงผล (ทุกเครื่อง รวมโฮสต์ ใช้ snapshot เดียวกัน)
// =====================================================================
const cv=cvEl(),cx=cv.getContext('2d');
let DPR=1,SW=0,SH=0;
function resize(){
  DPR=Math.min(2,window.devicePixelRatio||1);SW=innerWidth;SH=innerHeight;cv.width=SW*DPR;cv.height=SH*DPR;
  if(typeof gl!=='undefined'){gl.setSize(SW,SH,false);composer.setSize(SW,SH);cam.aspect=SW/SH;cam.updateProjectionMatrix();}
}
addEventListener('resize',resize);

const VIEW={prev:null,cur:null,tPrev:0,tCur:0};
let screen='menu',lastBuffKey='',overShown=false,lastCount=0;
const PARTS=[],TEXTS=[];let shakeA=0;
// ---------- งบเอฟเฟกต์ (VFX budget) ----------
// โค้ดเอฟเฟกต์ที่รันทุกเฟรม (sync/update ใน render) ปล่อยอนุภาค "ต่อเฟรม" → จอ 144 Hz ได้อนุภาคมากกว่าจอ 60 Hz 2.4 เท่า
// แก้ที่จุดเดียว: ระหว่าง render ตั้ง VFXB.k = (dt×60) × ตัวคูณคุณภาพ × ตัวหน่วงเมื่อใกล้เต็ม แล้ว PARTS.push สุ่มเก็บตามสัดส่วนนั้น
// (k>1 = เฟรมช้า → เพิ่มให้ได้ถึง VFXB.up เท่า เฉพาะกราฟิกสูง/อัตโนมัติที่ยังไม่ลดระดับ) • นอก render (อีเวนต์ fx จาก snapshot) k = 1 เสมอ
// เอฟเฟกต์ครั้งเดียว: burst ≥ 6 ชิ้น และ later() ไม่ถูกหาร • ชั้นเสริม (ประกาย/ฝุ่นแสง/หมอกบาง ๆ) เช็ก vfxExtra() ก่อนสร้าง
const VFXB={k:1,on:false,up:1,cap:8000,mul:1,stat:{in:0,kept:0}};
const _apush=Array.prototype.push;
PARTS.push=function(){
  const k=VFXB.k;
  for(let i=0;i<arguments.length;i++){const p=arguments[i];VFXB.stat.in++;
    if(k<1){if(Math.random()>=k)continue;}
    _apush.call(this,p);VFXB.stat.kept++;
    if(k>1&&Math.random()<k-1){const q=Object.assign({},p);q.x+=rnd(-3,3);q.y+=rnd(-3,3);q.life*=rnd(0.6,1);_apush.call(this,q);VFXB.stat.kept++;}}
  return this.length;};
function vfxQual(){const m=QUAL.mode;return m==='low'?{mul:0.5,cap:3000,up:1}:m==='high'?{mul:1,cap:8000,up:2}:QUAL.lvl>=1||QUAL.scale<0.8?{mul:0.7,cap:5000,up:1}:{mul:1,cap:8000,up:1.5};}
// เรียกต้น render ในเกม: ตั้งตัวคูณการปล่อยของเฟรมนี้
function vfxBegin(dt){const q=vfxQual();VFXB.cap=q.cap;VFXB.mul=q.mul;VFXB.up=q.up;
  const fill=PARTS.length/q.cap,soft=fill<0.6?1:Math.max(0.12,(1-fill)/0.4);
  VFXB.k=Math.min(q.up,dt*60)*q.mul*soft;VFXB.on=true;}
function vfxEnd(){VFXB.k=1;VFXB.on=false;}
// ทำส่วนที่เป็น "ครั้งเดียว" ภายใน render โดยไม่โดนหาร
function vfxOnce(fn){const k=VFXB.k;VFXB.k=1;try{fn();}finally{VFXB.k=k;}}
// ชั้นเสริมสวยงาม — ข้ามเมื่อกราฟิกประหยัด หรืออัตโนมัติลดระดับแล้ว
function vfxExtra(){return VFXB.mul>=1;}
const PCOL={bolt:'#ffe27a',fire:'#ff6a2a',stun:'#5ad1ff',pull:'#c77dff',ebolt:'#7dff6a',web:'#e8e8f0',ice:'#9fe8ff',zap:'#fff27a',vine:'#6fd57f',dart:'#b6e86a',hex:'#b57dff',ember:'#ff9a4a',spike:'#d8f4ff',pb0:'#ff8a3a',pb1:'#9fe8ff',pb2:'#fff27a',pb3:'#8ef07a',pb4:'#b57dff',pb5:'#ff9ad5',spark:'#ffb347',pfire:'#ff6a2a',pfireb:'#ff5a1a',icicle:'#bfeaff',iceboulder:'#9fe0ff'};

function setScreen(s){
  if(s!=='game'&&document.getElementById('pause'))document.getElementById('pause').classList.add('hidden');
  screen=s;document.body.dataset.screen=s;
  $('#menu').classList.toggle('hidden',s!=='menu');
  $('#lobby').classList.toggle('hidden',s!=='lobby');
  $('#voice').classList.toggle('hidden',!(NET.online&&s!=='menu'));
  if(s!=='game'){$('#buff').classList.add('hidden');$('#over').classList.add('hidden');lastBuffKey='';overShown=false;}
  cv.style.cursor=s==='game'?'crosshair':'default';
}
function onLobby(m){
  LOBBY=m;for(const p of m.players){if(p.lk)LOOKS[p.id]=p.lk;if(p.kt!==undefined)KITS[p.id]=p.kt;}
  if(m.map&&m.map!==builtMap&&mapReady(m.map)){setMapVars(m.map);buildWorld(m.map);}
  if(m.ph==='lobby'){if(screen!=='lobby')setScreen('lobby');renderLobby();}
  voiceSync();updateVoiceUI();
}
function onSnap(s){
  if(s.mp&&s.mp!==builtMap&&mapReady(s.mp)){setMapVars(s.mp);buildWorld(s.mp);}
  PROPON=!!s.PB;if(s.PB)for(let i=0;i<PROPS.length;i++)PROPS[i].st=+(s.PB[i]||0);
  if(!NET.isHost)bldParse(s.BD);
  VIEW.prev=VIEW.cur;VIEW.tPrev=VIEW.tCur;VIEW.cur=s;VIEW.tCur=performance.now();
  if(s.ev)for(const ev of s.ev)fx(ev);
  syncOverlays(s);
}
function myPos(){const v=VIEW.cur;return v?v.P.find(p=>p.id===NET.myId):null;}

// ---------- เอฟเฟกต์ ----------
// อนุภาค: x,y = พิกัดเกม (px), h = ความสูง (หน่วย 3D), g = แรงโน้มถ่วง (ติดลบ = ลอยขึ้น), smoke = ควัน (ไม่เรืองแสง)
function burst(x,y,col,n,sp,life,size,o){
  o=o||{};
  if(n>=6&&VFXB.k!==1){const k=VFXB.k;VFXB.k=1;try{burst(x,y,col,n,sp,life,size,o);}finally{VFXB.k=k;}return;}   // burst ใหญ่ = เอฟเฟกต์ครั้งเดียว ไม่หาร
  for(let i=0;i<n;i++){
    const a=o.a!==undefined?o.a+rnd(-(o.spread||0.5),o.spread||0.5):rnd(0,Math.PI*2),s=rnd(sp*0.2,sp);
    const vh=o.vh?rnd(o.vh[0],o.vh[1]):rnd(-1,3.5);
    PARTS.push({x,y,h:(o.h!==undefined?o.h:1.2)+rnd(-0.1,0.1),vx:Math.cos(a)*s,vy:Math.sin(a)*s,vh,
      life:life*rnd(0.7,1.2),max:life,col,size:size*rnd(0.6,1.4),g:o.g!==undefined?o.g:4,smoke:!!o.smoke,grow:o.grow||0,drag:o.drag||3,
      sh:o.sh||0,c2:o.c2,rot:rnd(0,6.283),vr:o.vr?rnd(-o.vr,o.vr):0,fin:o.fin});
  }
}
function smoke(x,y,h,n,col,life,size,sp){burst(x,y,col||'#3a3640',n,sp||60,life||1.4,size||6,{h,vh:[0.3,1.4],g:-0.6,smoke:true,grow:1.6,drag:2});}
function ring(x,y,col,r,life,h){SHAPES_Q.push({k:'ring',x,y,h:h!==undefined?h:0.15,col,s1:r*S3,life});}
function floatText(x,y,t,col,size,h){TEXTS.push({x:x+rnd(-8,8),y,h,t:String(t),col,size:size||16,life:0.9,max:0.9});}
function shake(a){if(!SET.shake)return;shakeA=Math.max(shakeA,a);}
function wandPos(ev){const a=ev.a||0;return [ev.x+Math.cos(a)*24-Math.sin(a)*6,ev.y+Math.sin(a)*24+Math.cos(a)*6];}

function impactFX(x,y,t,onTarget,H){
  const col=PCOL[t]||'#ffffff';
  if(t==='web'){
    burst(x,y,'#f0f0f8',22,260,0.6,2,{h:H,g:3,smoke:true});
    for(let i=0;i<5;i++){const a=rnd(0,Math.PI*2);FX.bolt(x,y,H,x+Math.cos(a)*40,y+Math.sin(a)*40,H+rnd(-0.6,0.6),0.5,'#f4f4ff');}
    snd('splat',{x,y});return;
  }
  burst(x,y,col,onTarget?18:10,300,0.35,2.2,{h:H,g:6});
  burst(x,y,'#ffffff',6,200,0.2,1.6,{h:H,g:2});
  FX.flashSprite(x,y,H,col,0.3,onTarget?2.4:1.6,0.16,1.4);
  FX.flashLight(x,y,H,col,onTarget?3:2,9,0.18);
  if(t==='stun'){for(let i=0;i<4;i++){const a=rnd(0,Math.PI*2);FX.bolt(x,y,H,x+Math.cos(a)*rnd(40,70),y+Math.sin(a)*rnd(40,70),H+rnd(-1.1,1),0.22);}snd('zap',{x,y});}
  if(t==='pull')SHAPES_Q.push({k:'ringv',x,y,h:H,col,s1:1.6,life:0.3});
  if(t==='ebolt')smoke(x,y,H,6,'#1d3a1a',1,5);
  if(onTarget)snd('hit',{x,y});
}
// s = ขนาด (1 = ปกติ) — Ignition Snap ใช้ s ตามจำนวน Burning
function explosionFX(x,y,H,s){s=s||1;
  const low=H<3;
  FX.flashLight(x,y,H+0.2,'#ff8a3a',7*s,22*s,0.45);
  FX.flashSprite(x,y,H,'#ff7a2a',0.6,6*s,0.3,1.6);
  FX.flashSprite(x,y,H,'#fff0b0',0.3,4*s,0.18,3);
  fireBlast(x,y,low?Math.max(0.4,H):H,3.2*s,0.6);
  if(low){ring(x,y,'#ffb36a',95*s,0.4);SHAPES_Q.push({k:'decal',x,y,col:'#000000',s1:3.2*s,life:6,op:0.55});}
  burst(x,y,'#ffb347',Math.round(50*s),420*s,0.9,2,{h:H,vh:[1,7],g:9});
  burst(x,y,'#ff5a1a',Math.round(30*s),220*s,0.45,5,{h:H,vh:[0,3],g:-2});
  smoke(x,y,H,Math.round(18*s),'#2a2522',1.8,9*s,140);
}

// ---------- เอฟเฟกต์คาถาใหม่ ----------
const ZV=[],COLB=[],WVV=[],GLV=[],ICEV=[],SLV=[],ULTV=[],OBV=[];
// พื้นน้ำแข็ง: แผ่นน้ำแข็งใสๆ บนพื้น (ทางไถล/ทางคลื่นดาบ) • วงน้ำแข็ง = แผ่นใหญ่ + ขอบวงเรืองแสง + แท่งน้ำแข็งเล็กรอบขอบ ให้เห็นระยะชัด
const _iceDisc=new THREE.CircleGeometry(1,28);_iceDisc.rotateX(-Math.PI/2);_iceDisc.userData.keep=true;
const _iceEdge=new THREE.RingGeometry(0.955,1,72);_iceEdge.rotateX(-Math.PI/2);_iceEdge.userData.keep=true;
const _iceSpk=new THREE.ConeGeometry(1,1,5);_iceSpk.translate(0,0.5,0);_iceSpk.userData.keep=true;
function iceFloorMat(op){return new THREE.MeshStandardMaterial({color:'#bfe6fa',emissive:'#2f7fb8',emissiveIntensity:0.25,roughness:0.9,metalness:0,transparent:true,opacity:op,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});}
const _icePlane=new THREE.PlaneGeometry(1,1);_icePlane.rotateX(-Math.PI/2);_icePlane.userData.keep=true;
let _icePathMat=null;
function makeIceFloor(x,y,r,t,ring,lx,ly){
  if(!ring){
    // ทางน้ำแข็งเรียบๆ ต่อเนื่อง: วัสดุทึบ (ซ้อนกันไม่เป็นดวง) • ชิ้นยาวจากจุดก่อนหน้า + ข้อต่อกลม
    if(!_icePathMat){_icePathMat=new THREE.MeshStandardMaterial({color:'#a8d4ec',emissive:'#1f5f90',emissiveIntensity:0.18,roughness:0.85,metalness:0,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});_icePathMat.userData.keep=true;}
    const g=new THREE.Group();g.position.set(tx(x),0.03+GY(x,y),tz(y));scene.add(g);
    const w=r*S3*1.6;
    const j=new THREE.Mesh(_iceDisc,_icePathMat);j.scale.setScalar(w/2);g.add(j);
    if(lx!==undefined){const dx=tx(lx)-tx(x),dz=tz(ly)-tz(y),L=Math.hypot(dx,dz);if(L>0.01&&L<6){const q=new THREE.Mesh(_icePlane,_icePathMat);q.scale.set(L,1,w);q.position.set(dx/2,0,dz/2);q.rotation.y=-Math.atan2(dz,dx);g.add(q);}}
    return {g,mats:[],spikes:[],age:0,t,path:true};
  }
  const g=new THREE.Group();g.position.set(tx(x),0.035+GY(x,y),tz(y));scene.add(g);
  const mats=[];
  const disc=new THREE.Mesh(_iceDisc,iceFloorMat(ring?0.32:0.55));disc.scale.setScalar(r*S3*(ring?1:rnd(0.95,1.2)));disc.rotation.y=rnd(0,6.28);g.add(disc);mats.push([disc.material,ring?0.32:0.55]);
  const sheen=new THREE.Mesh(_iceDisc,new THREE.MeshBasicMaterial({color:hdr('#e8f8ff',1),transparent:true,opacity:0.08,blending:THREE.AdditiveBlending,depthWrite:false}));sheen.scale.setScalar(r*S3*0.55);sheen.position.set(rnd(-0.2,0.2)*r*S3,0.01,rnd(-0.2,0.2)*r*S3);g.add(sheen);mats.push([sheen.material,0.08]);
  const spikes=[];
  if(ring){
    const edge=new THREE.Mesh(_iceEdge,new THREE.MeshBasicMaterial({color:hdr('#7fd0ff',0.9),transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,depthWrite:false}));edge.scale.setScalar(r*S3);edge.position.y=0.02;g.add(edge);mats.push([edge.material,0.55]);
    const sm=iceMat(0.85);mats.push([sm,0.85]);
    const n=Math.round(r*S3*2.2);
    for(let i=0;i<n;i++){const a=i/n*Math.PI*2+rnd(-0.05,0.05),m=new THREE.Mesh(_iceSpk,sm);const hh=rnd(0.35,0.9),rr=rnd(0.12,0.22);m.position.set(Math.cos(a)*r*S3,0,Math.sin(a)*r*S3);m.rotation.set(Math.sin(a)*0.35,rnd(0,6),-Math.cos(a)*0.35);m.userData={hh,rr};m.scale.set(0.001,0.001,0.001);g.add(m);spikes.push(m);}
  }
  return {g,mats,spikes,age:0,t};
}
function updateIceFloors(dt){
  for(let i=ICEV.length-1;i>=0;i--){
    const v=ICEV[i];v.age+=dt;
    const k=Math.min(1,v.age/0.2)*Math.min(1,Math.max(0,(v.t-v.age)/0.6));
    for(const [m,op] of v.mats)m.opacity=op*k;
    for(const s of v.spikes){const u=s.userData;s.scale.set(u.rr*k+0.001,u.hh*k+0.001,u.rr*k+0.001);}
    if(v.path)v.g.scale.set(k+0.001,1,k+0.001);
    if(v.age>=v.t){scene.remove(v.g);v.mats.forEach(([m])=>m.dispose());ICEV.splice(i,1);}
  }
}
// โดนตี: ตัวละครกระพริบขาวแว้บเดียว (สลับวัสดุเป็นสีขาวชั่วคราว ~3 เฟรม แล้วคืนของเดิม)
let FLASHM=null;
const FLASHING=new Set();
function flashModel(o){
  if(!o||!o.g)return;
  o.hitT=0.25;
  if(o.flashT>0){o.flashT=0.1;return;}
  if(!FLASHM){FLASHM=new THREE.MeshBasicMaterial({color:hdr('#ffffff',1.7)});FLASHM.userData.keep=true;}
  o.flashT=0.1;o.flashSaved=[];
  o.g.traverse(m=>{if(m.isMesh&&!m.isInstancedMesh&&m.material&&!Array.isArray(m.material)&&!m.material.transparent){o.flashSaved.push([m,m.material]);m.material=FLASHM;}});
  FLASHING.add(o);
}
function endFlash(o){if(!o.flashSaved)return;for(const [m,mat] of o.flashSaved)m.material=mat;o.flashSaved=null;o.flashT=0;FLASHING.delete(o);}
function tickFlash(dt){for(const o of FLASHING){o.flashT-=dt;if(o.flashT<=0)endFlash(o);}}
// ร่างผี: สลับเป็นวัสดุโปร่งแสง (ไม่แก้วัสดุเดิม เพราะวัสดุใช้ร่วมกันหลายตัวละคร) — วัสดุที่แชร์ได้ผีแบบแชร์ด้วย
const GHOSTM=new WeakMap(),SOLIDM=new WeakMap();
function ghostOf(mat){
  if(mat.userData.keep&&GHOSTM.has(mat))return GHOSTM.get(mat);
  const g=mat.clone();g.transparent=true;g.opacity=0.35*(mat.transparent?mat.opacity:1);g.onBeforeCompile=mat.onBeforeCompile;g.customProgramCacheKey=mat.customProgramCacheKey;
  if(mat.userData.keep){g.userData.keep=true;GHOSTM.set(mat,g);}
  return g;
}
function setGhost(o,on){
  endFlash(o);
  o.g.traverse(m=>{
    if(!m.isMesh||!m.material||Array.isArray(m.material)||m.material.isShaderMaterial)return;
    if(on){if(!SOLIDM.has(m)){SOLIDM.set(m,m.material);m.material=ghostOf(m.material);}}
    else if(SOLIDM.has(m)){const gm=m.material;m.material=SOLIDM.get(m);SOLIDM.delete(m);if(!gm.userData.keep)gm.dispose();}
  });
}
function hitSparks(x,y,h,n){const k=Math.min(2,0.6+(n||5)/25);burst(x,y,'#ffffff',Math.round(8*k),260,0.22,2.4,{h,g:5,sh:2,c2:'#ffb060'});burst(x,y,'#ffd9a0',Math.round(5*k),160,0.3,2.6,{h,g:4,sh:1,vr:4,c2:'#ff8a3a'});FX.flashSprite(x,y,h,'#ffffff',0.2,1.1*k,0.08,1.6);}
