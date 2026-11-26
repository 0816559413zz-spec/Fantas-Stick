// posecam.js — Pose + Camera tool (posecam.html). Standalone three.js (same version as the game).
// Character = assets/chars/student.glb. Pose = clip sample + preset (HPOSE copy from js/61-hub.js) + per-bone edits (local quat delta).
// Shots = camera + full pose state; saved via serve.py /api/posecam → posecam/<id>.json|.md + <id>_<shot>.jpg
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {TransformControls} from 'three/addons/controls/TransformControls.js';

const $=s=>document.querySelector(s),V3=THREE.Vector3,Q=THREE.Quaternion;
const DEG=Math.PI/180,r4=x=>Math.round(x*1e4)/1e4;
const view=$('#view'),frame=$('#frame');

// ---------- renderer / scene ----------
const R=new THREE.WebGLRenderer({antialias:true});
R.setPixelRatio(Math.min(2,devicePixelRatio));R.outputColorSpace=THREE.SRGBColorSpace;
R.toneMapping=THREE.ACESFilmicToneMapping;R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
frame.prepend(R.domElement);R.domElement.tabIndex=0;
const scene=new THREE.Scene();scene.background=new THREE.Color('#14131a');
const cam=new THREE.PerspectiveCamera(40,16/9,0.03,300);cam.position.set(0,1.3,3.4);
scene.add(new THREE.HemisphereLight('#b8c4ff','#2a2018',0.7));
const key=new THREE.DirectionalLight('#fff1dd',2.4);key.position.set(2.5,4,3);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:0.5,far:15});key.shadow.bias=-0.0004;scene.add(key);
const rim=new THREE.DirectionalLight('#8fb0ff',1.5);rim.position.set(-3,3,-3);scene.add(rim);
const floor=new THREE.Mesh(new THREE.CircleGeometry(3.2,64),new THREE.MeshStandardMaterial({color:'#24222b',roughness:0.9}));
floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const grid=new THREE.GridHelper(12,24,'#3a3a46','#2a2a33');grid.position.y=0.002;scene.add(grid);

function fit(){const w=view.clientWidth-16,h=view.clientHeight-16;let fw=w,fh=w*9/16;if(fh>h){fh=h;fw=h*16/9;}
  fw=Math.max(160,Math.floor(fw));fh=Math.max(90,Math.floor(fh));R.setSize(fw,fh);cam.aspect=16/9;cam.updateProjectionMatrix();}
addEventListener('resize',fit);fit();

// ---------- camera controls ----------
const orbit=new OrbitControls(cam,R.domElement);orbit.target.set(0,1.1,0);
orbit.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};orbit.zoomSpeed=0.8;orbit.update();
let camMode='orbit',roll=0;const fly={yaw:0,pitch:0,dist:3,rmb:false,lx:0,ly:0,keys:{}};
function camFwd(o=new V3()){return cam.getWorldDirection(o);}
function curTarget(){return camMode==='orbit'?orbit.target.clone():cam.position.clone().addScaledVector(camFwd(),fly.dist);}
function setCamMode(m){
  if(m===camMode)return;
  if(m==='fly'){fly.dist=cam.position.distanceTo(orbit.target);const e=new THREE.Euler().setFromQuaternion(cam.quaternion,'YXZ');fly.yaw=e.y;fly.pitch=e.x;orbit.enabled=false;}
  else{orbit.target.copy(curTarget());orbit.enabled=true;}
  camMode=m;$('#mOrb').classList.toggle('on',m==='orbit');$('#mFly').classList.toggle('on',m==='fly');
}
function applyRoll(){if(roll)cam.rotateZ(roll*DEG);}
function setCam(p,t,fov){cam.position.copy(p);orbit.target.copy(t);cam.lookAt(t);if(fov){cam.fov=fov;cam.updateProjectionMatrix();}
  const e=new THREE.Euler().setFromQuaternion(cam.quaternion,'YXZ');fly.yaw=e.y;fly.pitch=e.x;fly.dist=p.distanceTo(t);syncCamUI();}
R.domElement.addEventListener('contextmenu',e=>e.preventDefault());
R.domElement.addEventListener('pointerdown',e=>{if(camMode==='fly'&&e.button===2){fly.rmb=true;fly.lx=e.clientX;fly.ly=e.clientY;R.domElement.setPointerCapture(e.pointerId);}});
R.domElement.addEventListener('pointermove',e=>{if(!fly.rmb)return;fly.yaw-=(e.clientX-fly.lx)*0.0035;fly.pitch=Math.max(-1.55,Math.min(1.55,fly.pitch-(e.clientY-fly.ly)*0.0035));fly.lx=e.clientX;fly.ly=e.clientY;});
R.domElement.addEventListener('pointerup',e=>{if(e.button===2)fly.rmb=false;});
R.domElement.addEventListener('wheel',e=>{if(camMode!=='fly')return;e.preventDefault();cam.position.addScaledVector(camFwd(),-Math.sign(e.deltaY)*0.25*(e.shiftKey?3:1));},{passive:false});
function flyTick(dt){
  cam.rotation.set(fly.pitch,fly.yaw,0,'YXZ');
  const k=fly.keys,sp=+$('#spd').value*(k.shift?3:1)*dt,f=camFwd(),rt=new V3().crossVectors(f,cam.up).normalize();
  if(k.w)cam.position.addScaledVector(f,sp);if(k.s)cam.position.addScaledVector(f,-sp);
  if(k.d)cam.position.addScaledVector(rt,sp);if(k.a)cam.position.addScaledVector(rt,-sp);
  if(k.e)cam.position.y+=sp;if(k.q)cam.position.y-=sp;
}

// ---------- character ----------
const BONE_TH={root:'ทั้งตัว',hips:'สะโพก',spine:'เอว',chest:'อก',neck:'คอ',head:'หัว',upper_arm_L:'ต้นแขน ซ้าย',forearm_L:'แขนล่าง ซ้าย',hand_L:'มือ ซ้าย',
  upper_arm_R:'ต้นแขน ขวา',forearm_R:'แขนล่าง ขวา',hand_R:'มือ ขวา',thigh_L:'ต้นขา ซ้าย',shin_L:'แข้ง ซ้าย',foot_L:'เท้า ซ้าย',thigh_R:'ต้นขา ขวา',shin_R:'แข้ง ขวา',foot_R:'เท้า ขวา',
  scarf_1:'ผ้าพันคอ 1',scarf_2:'ผ้าพันคอ 2',cloak_B:'ผ้าคลุม หลัง',cloak_L:'ผ้าคลุม ซ้าย',cloak_R:'ผ้าคลุม ขวา'};
const MOVABLE=new Set(['root','hips']);
// game defaults (js/02-data.js tables): Gryffindor, brown hair, light skin, black cloak
const TINT={skin:'#f1d2b0',cloak:'#141218',house:'#a71b26',house2:'#f0b92a',eyes:'#4a2e16',hair:'#2b1b10',wand:'#6b4423'};
// copy of HPOSE in js/61-hub.js (frame: x = character's left, y up, z front)
const HPOSE={
  lean:{uaL:[0.32,-0.88,0.36],faL:[0.12,-0.62,0.78],hL:[0.05,-0.75,0.66],uaR:[-0.3,-0.9,0.3],faR:[-0.1,-0.6,0.8],hR:[-0.05,-0.8,0.6],ch:[0.2,0,0],hd:[0.42,0]},
  lift:{uaL:[0.25,-0.95,0.15],faL:[0.15,-0.85,0.5],hL:[0.1,-0.9,0.4],uaR:[-0.22,-0.85,0.48],faR:[0.15,0.55,0.82],hR:[0.1,0.92,0.38],ch:[0.02,0,0],hd:[0,0]},
  spread:{uaL:[0.6,-0.22,0.77],faL:[0.34,0.16,0.92],hL:[0.08,0.32,0.95],twL:1.2,uaR:[-0.94,-0.28,0.18],faR:[-0.9,0.08,0.42],hR:[-0.62,0.62,0.48],ch:[-0.07,0.14,0],hd:'cam',orb:'L'},
  hero:{uaL:[0.45,-0.88,0.15],faL:[-0.25,-0.5,0.83],hL:[-0.4,-0.6,0.7],uaR:[-0.35,0.9,0.25],faR:[-0.15,0.97,0.18],hR:[-0.05,1,0.1],ch:[-0.12,0,0.06],hd:'cam',ry:-0.15},
  duel:{uaL:[0.75,0.15,-0.6],faL:[0.6,0.78,-0.15],hL:[0.4,0.9,0.1],uaR:[-0.3,0.02,0.95],faR:[-0.18,0.08,0.98],hR:[-0.12,0.12,0.99],ch:[0.06,-0.5,0],hd:'cam',ry:0.55},
  orb2:{uaL:[0.4,-0.62,0.66],faL:[-0.35,0.12,0.93],hL:[-0.45,0.35,0.82],twL:1.3,uaR:[-0.4,-0.62,0.66],faR:[0.35,0.12,0.93],hR:[0.45,0.35,0.82],twR:-1.3,ch:[0.05,0,0],hd:[0.25,0],orb:'M'},
  rest:{uaL:[0.78,-0.6,-0.12],faL:[-0.55,-0.62,0.55],hL:[-0.5,-0.7,0.5],uaR:[-0.38,-0.78,0.5],faR:[-0.1,0.95,0.3],hR:[0.1,0.45,-0.88],ch:[0,0.18,0.07],hd:'cam',ry:-0.35},
  present:{uaL:[0.78,-0.12,0.6],faL:[0.62,0.38,0.68],hL:[0.42,0.62,0.66],twL:1.4,uaR:[-0.8,0.22,0.32],faR:[-0.42,0.86,0.22],hR:[-0.22,0.97,0.06],ch:[0.12,-0.16,0.03],hd:'cam',orb:'L'},
  cast:{uaL:[0.35,0.12,0.93],faL:[0.2,0.3,0.93],hL:[0.1,0.7,0.7],twL:1.5,uaR:[-0.62,-0.72,0.3],faR:[-0.5,-0.15,0.85],hR:[-0.4,0.55,0.73],ch:[0.04,0.3,0],hd:'cam',ry:-0.4,orb:'L'}
};
const PRESET_TH={'':'ไม่มี',present:'present — มือซ้ายถือลูกแก้ว (เมนู)',spread:'spread — กางแขน + ลูกแก้ว',hero:'hero — ชูไม้',duel:'duel — ท่าดวล',orb2:'orb2 — สองมือประคองลูกแก้ว',rest:'rest — พักไม้',cast:'cast — ร่ายเวท',lean:'lean — ก้มตัว',lift:'lift — ยกไม้'};
const HPK=['uaL','faL','hL','uaR','faR','hR'],HBN={uaL:'upper_arm_L',faL:'forearm_L',hL:'hand_L',uaR:'upper_arm_R',faR:'forearm_R',hR:'hand_R'};
const _Y=new V3(0,1,0),_q=new Q(),_q2=new Q(),_q3=new Q(),_v=new V3(),_v2=new V3();
function hbAim(b,dw){const bw=b.getWorldQuaternion(_q),cur=_v.copy(_Y).applyQuaternion(bw);
  const tg=_q2.setFromUnitVectors(cur,dw).multiply(bw);b.quaternion.copy(b.parent.getWorldQuaternion(_q3).invert().multiply(tg));b.updateMatrixWorld(true);}
function hbRot(b,axW,ang){if(Math.abs(ang)<1e-5)return;const bw=b.getWorldQuaternion(_q),tg=_q2.setFromAxisAngle(axW,ang).multiply(bw);
  b.quaternion.copy(b.parent.getWorldQuaternion(_q3).invert().multiply(tg));b.updateMatrixWorld(true);}

const CH={B:{},rest:{},base:{},baseP:{},clips:{},marks:[],hair:[],wand:[]};
// state = what a shot stores
let S={clip:'idle',t:0,play:true,preset:'',ry:0,orb:false,wand:true,hair:0,edits:{},moves:{}};
const cloneS=s=>JSON.parse(JSON.stringify(s));

new GLTFLoader().load('assets/chars/student.glb?v=1',gl=>{
  const inst=gl.scene,g=new THREE.Group();g.add(inst);scene.add(g);CH.g=g;CH.inst=inst;
  inst.traverse(o=>{
    if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;
      const tint=m=>{const k=(m.name||'').toLowerCase();if(k.startsWith('tint_')&&TINT[k.slice(5)])m.color.set(TINT[k.slice(5)]);};
      Array.isArray(o.material)?o.material.forEach(tint):tint(o.material);}
    if(o.isBone){CH.B[o.name]=o;}
    let r=/^hair_(\d+)$/.exec(o.name);if(r)CH.hair[+r[1]]=o;
    r=/^(wand|tie)_(\d+)$/.exec(o.name);if(r){o.visible=+r[2]===0;if(r[1]==='wand')CH.wand.push(o);}
  });
  for(const n in CH.B){const b=CH.B[n];CH.rest[n]={p:b.position.clone(),q:b.quaternion.clone(),s:b.scale.clone()};CH.base[n]=new Q();CH.baseP[n]=new V3();}
  for(const c of gl.animations){const tr=[];
    for(const t of c.tracks){const pn=THREE.PropertyBinding.parseTrackName(t.name),o=inst.getObjectByName(pn.nodeName);
      if(o&&(pn.propertyName==='quaternion'||pn.propertyName==='position'||pn.propertyName==='scale'))tr.push({o,prop:pn.propertyName,I:t.createInterpolant()});}
    CH.clips[c.name]={dur:c.duration,tr};}
  // joint markers
  const mg=new THREE.SphereGeometry(0.028,12,8);
  for(const n in CH.B){if(!BONE_TH[n])continue;const m=new THREE.Mesh(mg,new THREE.MeshBasicMaterial({color:'#4a8cff',depthTest:false,transparent:true,opacity:0.85}));
    m.renderOrder=999;m.userData.bone=n;CH.B[n].add(m);CH.marks.push(m);}
  buildUI();evalPose(0);
  inst.updateMatrixWorld(true);CH.h=CH.B.head?CH.B.head.getWorldPosition(new V3()).y+0.3:1.8;   // bbox counts hidden hair variants
  quick('front');$('#load').remove();stat('โหลดแล้ว • ตัวสูง '+CH.h.toFixed(2)+' m');
},undefined,e=>{$('#load').textContent='โหลดโมเดลไม่ได้: '+e;});

function applyPreset(P){
  const B=CH.B,q=CH.g.getWorldQuaternion(new Q());
  const right=new V3(1,0,0).applyQuaternion(q),fwd=new V3(0,0,1).applyQuaternion(q);
  if(B.chest&&P.ch){hbRot(B.chest,right,P.ch[0]);hbRot(B.chest,_Y,P.ch[1]);hbRot(B.chest,fwd,P.ch[2]);}
  for(const k of HPK){const v=P[k],b=B[HBN[k]];if(!v||!b)continue;hbAim(b,new V3(v[0],v[1],v[2]).normalize().applyQuaternion(q));}
  for(const [k,s] of [['twL','hand_L'],['twR','hand_R']]){const b=B[s];if(b&&P[k])hbRot(b,new V3(0,1,0).applyQuaternion(b.getWorldQuaternion(_q)),P[k]);}
  if(B.head&&B.neck&&P.hd){let pit=0,yaw=0;
    if(P.hd==='cam'){const hp=B.head.getWorldPosition(new V3()),d=cam.position.clone().sub(hp).applyQuaternion(q.clone().invert());
      yaw=Math.max(-0.55,Math.min(0.55,Math.atan2(d.x,d.z)));pit=Math.max(-0.35,Math.min(0.35,-Math.atan2(d.y,Math.hypot(d.x,d.z))));}
    else{pit=P.hd[0];yaw=P.hd[1];}
    hbRot(B.neck,_Y,yaw*0.45);hbRot(B.head,_Y,yaw*0.55);hbRot(B.head,right,pit);}
}
// full pose from state: rest → clip sample → yaw → preset → edits
function evalPose(dt){
  if(!CH.g)return;
  for(const n in CH.rest){const b=CH.B[n],r=CH.rest[n];b.position.copy(r.p);b.quaternion.copy(r.q);b.scale.copy(r.s);}
  const C=CH.clips[S.clip];
  if(C){if(S.play&&dt)S.t=(S.t+dt)%C.dur;for(const t of C.tr)t.o[t.prop].fromArray(t.I.evaluate(S.t));}
  const P=HPOSE[S.preset];
  CH.g.rotation.y=S.ry*DEG+(P&&P.ry||0);CH.g.updateMatrixWorld(true);
  if(P)applyPreset(P);
  for(const n in CH.B){CH.base[n].copy(CH.B[n].quaternion);CH.baseP[n].copy(CH.B[n].position);}
  for(const n in S.edits){const b=CH.B[n];if(b)b.quaternion.multiply(_q.fromArray(S.edits[n]));}
  for(const n in S.moves){const b=CH.B[n];if(b)b.position.add(_v.fromArray(S.moves[n]));}
  CH.g.updateMatrixWorld(true);
  CH.hair.forEach((m,i)=>{if(m)m.visible=i===S.hair;});
  for(const w of CH.wand)w.visible=S.wand&&w.name==='wand_0';
}
function snapBones(){const o={ry:CH.g.rotation.y,q:{},p:{}};for(const n in CH.B){o.q[n]=CH.B[n].quaternion.clone();o.p[n]=CH.B[n].position.clone();}return o;}

// ---------- orb (left hand) ----------
function glowTex(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(0.25,'rgba(200,190,255,.55)');g.addColorStop(1,'rgba(120,100,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
const orb=new THREE.Group();scene.add(orb);
orb.add(new THREE.Mesh(new THREE.SphereGeometry(0.075,32,24),new THREE.MeshBasicMaterial({color:new THREE.Color(1.1,1.0,2.2)})));
const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:'#a995ff',blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));halo.scale.set(0.55,0.55,1);orb.add(halo);
const orbL=new THREE.PointLight('#a99cff',1.4,3,2);orb.add(orbL);
function orbTick(now){
  const P=HPOSE[S.preset],B=CH.B,on=!!(CH.g&&S.orb);orb.visible=on;if(!on)return;const t=now/1000;
  if(P&&P.orb==='M'&&B.hand_L&&B.hand_R){B.hand_L.getWorldPosition(_v);B.hand_R.getWorldPosition(_v2);_v.add(_v2).multiplyScalar(0.5);_v.y+=0.1;}
  else{B.hand_L.getWorldPosition(_v);_v.add(_v2.set(0,0.2,0.17).applyQuaternion(CH.g.getWorldQuaternion(_q)));}
  _v.y+=Math.sin(t*2.1)*0.02;orb.position.copy(_v);
}

// ---------- bone selection + gizmo ----------
const tc=new TransformControls(cam,R.domElement);tc.setSpace('local');tc.setSize(0.75);scene.add(tc);
let sel='';
tc.addEventListener('dragging-changed',e=>{orbit.enabled=!e.value&&camMode==='orbit';if(e.value)pushUndo();});
tc.addEventListener('objectChange',()=>{const b=CH.B[sel];if(!b)return;
  const dq=CH.base[sel].clone().invert().multiply(b.quaternion);
  if(Math.abs(dq.w)>0.99999)delete S.edits[sel];else S.edits[sel]=dq.toArray().map(r4);
  if(MOVABLE.has(sel)){const d=b.position.clone().sub(CH.baseP[sel]);if(d.lengthSq()<1e-8)delete S.moves[sel];else S.moves[sel]=d.toArray().map(r4);}
  dirty();boneUI();});
function selBone(n){sel=n||'';if(sel&&CH.B[sel]){tc.attach(CH.B[sel]);if(!MOVABLE.has(sel))gizmo('rotate');}else tc.detach();boneUI();}
function gizmo(m){if(m==='translate'&&!MOVABLE.has(sel))m='rotate';tc.setMode(m);$('#gRot').classList.toggle('on',m==='rotate');$('#gMove').classList.toggle('on',m==='translate');}
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();let downXY=null;
R.domElement.addEventListener('pointerdown',e=>{if(e.button===0)downXY=[e.clientX,e.clientY];},true);
R.domElement.addEventListener('pointerup',e=>{
  if(e.button!==0||!downXY||tc.dragging)return;const moved=Math.hypot(e.clientX-downXY[0],e.clientY-downXY[1]);downXY=null;if(moved>4||!$('#marks').checked)return;
  const r=R.domElement.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,cam);
  const h=ray.intersectObjects(CH.marks,false);if(h.length)selBone(h[0].object.userData.bone);
});

// ---------- undo ----------
const undo=[];
function pushUndo(){undo.push(JSON.stringify(S));if(undo.length>80)undo.shift();}
function doUndo(){const s=undo.pop();if(!s)return stat('ไม่มีอะไรให้ย้อน');const t=S.t;S=JSON.parse(s);S.t=t;stateUI();dirty();}

// ---------- shots + transitions ----------
let shots=[],curShot='',tr=null,seq=null,seqTimer=0;
const EASE={smooth:k=>k<0.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2,out:k=>1-Math.pow(1-k,3),in:k=>k*k*k,linear:k=>k,
  back:k=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(k-1,3)+c1*Math.pow(k-1,2);},snap:k=>1-Math.pow(1-k,5)};
const EASE_TH={smooth:'นุ่ม เข้า-ออก',out:'เร็วแล้วช้าลง',in:'ช้าแล้วเร็วขึ้น',linear:'คงที่',back:'เลยแล้วเด้งกลับ',snap:'พุ่งแล้วหยุด'};
function camNow(){return {p:cam.position.toArray().map(r4),t:curTarget().toArray().map(r4),fov:cam.fov,roll};}
function uid(){return Math.random().toString(36).slice(2,8);}
function addShot(){
  const sh={id:uid(),name:'มุม '+(shots.length+1),note:'',dur:1.2,hold:1,ease:'smooth',cam:camNow(),st:cloneS(S)};
  sh._img=thumb();shots.push(sh);curShot=sh.id;shotsUI();dirty();stat('บันทึกมุมแล้ว');
}
function updShot(sh){sh.cam=camNow();sh.st=cloneS(S);sh._img=thumb();curShot=sh.id;shotsUI();dirty();stat('อัปเดตมุมแล้ว');}
function goShot(sh,dur,ease,done){
  if(!CH.g)return;tc.detach();
  const from={p:cam.position.clone(),t:curTarget(),fov:cam.fov,roll,b:snapBones()};
  S=cloneS(sh.st);evalPose(0);stateUI(true);
  const to={p:new V3().fromArray(sh.cam.p),t:new V3().fromArray(sh.cam.t),fov:sh.cam.fov,roll:sh.cam.roll||0,b:snapBones()};
  curShot=sh.id;shotsUI(true);
  if(!(dur>0)){finishTr(to);done&&done();return;}
  // restore "from" bones for the first frame
  for(const n in CH.B){CH.B[n].quaternion.copy(from.b.q[n]);CH.B[n].position.copy(from.b.p[n]);}
  tr={t:0,dur,ease:EASE[ease]||EASE.smooth,from,to,done};
}
function finishTr(to){setCamMode('orbit');roll=to.roll;setCam(to.p,to.t,to.fov);tr=null;selBone(sel);}
function trTick(dt){
  tr.t+=dt;const k0=Math.min(1,tr.t/tr.dur),k=tr.ease(k0),f=tr.from,t=tr.to;
  for(const n in CH.B){CH.B[n].quaternion.slerpQuaternions(f.b.q[n],t.b.q[n],Math.min(1,Math.max(0,k)));CH.B[n].position.lerpVectors(f.b.p[n],t.b.p[n],k);}
  CH.g.rotation.y=f.b.ry+(t.b.ry-f.b.ry)*k;CH.g.updateMatrixWorld(true);
  const tg=new V3().lerpVectors(f.t,t.t,k);cam.position.lerpVectors(f.p,t.p,k);cam.lookAt(tg);
  cam.fov=f.fov+(t.fov-f.fov)*k;cam.updateProjectionMatrix();roll=f.roll+(t.roll-f.roll)*k;applyRoll();
  if(k0>=1){const d=tr.done;finishTr(t);d&&d();}
}
function playAll(){
  if(seq){stopSeq();return;}if(!shots.length)return stat('ยังไม่มีมุมที่บันทึก',1);
  seq={i:0};$('#bPlayAll').textContent='■ หยุด';seqStep();
}
function seqStep(){
  if(!seq)return;const sh=shots[seq.i];const ov=$('#ovShot');ov.style.display='block';ov.textContent=(seq.i+1)+'. '+sh.name;
  goShot(sh,+sh.dur||0,sh.ease,()=>{seqTimer=setTimeout(()=>{if(!seq)return;seq.i++;
    if(seq.i>=shots.length){if($('#loop').checked)seq.i=0;else return stopSeq();}seqStep();},(+sh.hold||0)*1000);});
}
function stopSeq(){seq=null;clearTimeout(seqTimer);$('#bPlayAll').textContent='▶ เล่นต่อกัน';$('#ovShot').style.display='none';}

function thumb(){
  const hide=[tc,...CH.marks],was=hide.map(o=>o.visible),gv=grid.visible;hide.forEach(o=>o.visible=false);
  R.render(scene,cam);const c=document.createElement('canvas');c.width=960;c.height=540;c.getContext('2d').drawImage(R.domElement,0,0,960,540);
  hide.forEach((o,i)=>o.visible=was[i]);grid.visible=gv;return c.toDataURL('image/jpeg',0.86);
}

// ---------- quick camera angles ----------
function quick(k){
  if(!CH.g)return;setCamMode('orbit');if(!tr)evalPose(0);const q=CH.g.getWorldQuaternion(new Q()),L=v=>new V3(...v).applyQuaternion(q);
  const h=CH.h||1.7,chest=new V3(0,h*0.62,0),wp=n=>CH.B[n].getWorldPosition(new V3());
  const A={front:[L([0,0.15,3.4]),chest],q34:[L([1.9,0.25,2.8]),chest],side:[L([3.4,0.1,0]),chest],back:[L([0,0.3,-3.4]),chest],
    face:[wp('head').add(L([0,0.05,1.0])),wp('head').add(new V3(0,0.06,0))],low:[L([0.6,-chest.y+0.25,2.2]),chest.clone().add(new V3(0,0.25,0))],
    handL:[wp('hand_L').add(L([0.25,0.12,0.8])),wp('hand_L').add(L([0,0.1,0.1]))],handR:[wp('hand_R').add(L([-0.25,0.12,0.8])),wp('hand_R')]}[k];
  if(!A)return;const p=A[0].clone();if(k==='front'||k==='q34'||k==='side'||k==='back'||k==='low')p.add(chest);setCam(p,A[1]);
}

// ---------- UI ----------
let isDirty=false;
function dirty(){isDirty=true;}
function stat(s,err){const e=$('#stat');e.textContent=s;e.className=err?'err':'';}
function buildUI(){
  const cs=$('#clip');cs.innerHTML='<option value="">ไม่มี (ท่าตั้งต้น)</option>'+Object.keys(CH.clips).map(n=>`<option>${n}</option>`).join('');
  $('#preset').innerHTML=Object.keys(PRESET_TH).map(n=>`<option value="${n}">${PRESET_TH[n]}</option>`).join('');
  $('#hair').innerHTML=CH.hair.map((m,i)=>m?`<option value="${i}">ทรง ${i}</option>`:'').join('');
  $('#bones').innerHTML=Object.keys(BONE_TH).filter(n=>CH.B[n]).map(n=>`<button class="tl-btn" data-b="${n}" title="${n}">${BONE_TH[n]}</button>`).join('');
  $('#bones').onclick=e=>{const b=e.target.closest('[data-b]');if(b)selBone(b.dataset.b===sel?'':b.dataset.b);};
  stateUI();shotsUI();
}
function stateUI(keepSel){
  $('#clip').value=S.clip;$('#preset').value=S.preset;$('#ry').value=S.ry;$('#ryV').textContent=S.ry+'°';
  $('#orb').checked=S.orb;$('#wand').checked=S.wand;$('#hair').value=S.hair;$('#bPlay').textContent=S.play?'⏸':'▶';
  if(!keepSel)selBone(sel);boneUI();
}
function boneUI(){for(const b of document.querySelectorAll('#bones [data-b]')){const n=b.dataset.b;b.classList.toggle('on',n===sel);b.classList.toggle('ed',!!(S.edits[n]||S.moves[n]));}
  for(const m of CH.marks){const n=m.userData.bone;m.material.color.set(n===sel?'#f2a35e':(S.edits[n]||S.moves[n])?'#6fcf97':'#4a8cff');}
  $('#gMove').disabled=!MOVABLE.has(sel);}
function shotsUI(onlyCur){
  const box=$('#shots');
  if(onlyCur){for(const el of box.children)el.classList.toggle('cur',el.dataset.id===curShot);return;}
  box.innerHTML=shots.map((s,i)=>`<div class="shot${s.id===curShot?' cur':''}" data-id="${s.id}">
    ${s._img||s.img?`<img src="${s._img||s.img+'?'+(s.ts||0)}" data-a="go" title="ไปมุมนี้">`:`<div class="noimg" data-a="go">ไม่มีรูป</div>`}
    <input class="tl-in" data-f="name" value="${esc(s.name)}">
    <div class="r">เคลื่อน<input class="tl-in" data-f="dur" type="number" step="0.1" min="0" value="${s.dur}">s ค้าง<input class="tl-in" data-f="hold" type="number" step="0.1" min="0" value="${s.hold}">s</div>
    <div class="r"><select class="tl-sel" data-f="ease">${Object.keys(EASE).map(k=>`<option value="${k}"${k===s.ease?' selected':''}>${EASE_TH[k]}</option>`).join('')}</select>
      <button class="tl-btn" data-a="cut" title="ไปทันที ไม่เคลื่อน">ตัด</button><button class="tl-btn" data-a="upd" title="เก็บกล้อง+ท่าตอนนี้ทับ">⟳</button>
      <button class="tl-btn" data-a="up" title="เลื่อนขึ้น">↑</button><button class="tl-btn" data-a="dn" title="เลื่อนลง">↓</button><button class="tl-btn" data-a="del" title="ลบ">✕</button></div>
    <textarea data-f="note" placeholder="โน้ต เช่น ตอนกดเลือกธาตุ UI ลอยขึ้นทางขวา">${esc(s.note)}</textarea></div>`).join('');
}
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
$('#shots').addEventListener('click',e=>{
  const el=e.target.closest('.shot'),a=e.target.closest('[data-a]');if(!el||!a)return;const i=shots.findIndex(s=>s.id===el.dataset.id),sh=shots[i];
  if(a.dataset.a==='go'){stopSeq();goShot(sh,+sh.dur||0,sh.ease);}
  else if(a.dataset.a==='cut'){stopSeq();goShot(sh,0);}
  else if(a.dataset.a==='upd')updShot(sh);
  else if(a.dataset.a==='del'){if(confirm('ลบ "'+sh.name+'"?')){shots.splice(i,1);shotsUI();dirty();}}
  else if(a.dataset.a==='up'&&i>0){shots.splice(i-1,0,shots.splice(i,1)[0]);shotsUI();dirty();}
  else if(a.dataset.a==='dn'&&i<shots.length-1){shots.splice(i+1,0,shots.splice(i,1)[0]);shotsUI();dirty();}
});
$('#shots').addEventListener('input',e=>{const el=e.target.closest('.shot'),f=e.target.dataset.f;if(!el||!f)return;const sh=shots.find(s=>s.id===el.dataset.id);
  sh[f]=f==='dur'||f==='hold'?Math.max(0,+e.target.value||0):e.target.value;dirty();});

$('#clip').onchange=e=>{pushUndo();S.clip=e.target.value;S.t=0;dirty();};
$('#bPlay').onclick=()=>{S.play=!S.play;$('#bPlay').textContent=S.play?'⏸':'▶';dirty();};
$('#time').oninput=e=>{const C=CH.clips[S.clip];if(!C)return;S.play=false;$('#bPlay').textContent='▶';S.t=+e.target.value*C.dur;dirty();};
$('#preset').onchange=e=>{pushUndo();S.preset=e.target.value;const P=HPOSE[S.preset];if(P&&P.orb)S.orb=true;$('#orb').checked=S.orb;dirty();};
$('#ry').oninput=e=>{S.ry=+e.target.value;$('#ryV').textContent=S.ry+'°';dirty();};
$('#orb').onchange=e=>{S.orb=e.target.checked;dirty();};
$('#wand').onchange=e=>{S.wand=e.target.checked;dirty();};
$('#hair').onchange=e=>{S.hair=+e.target.value;dirty();};
$('#gRot').onclick=()=>gizmo('rotate');$('#gMove').onclick=()=>gizmo('translate');
$('#sLoc').onclick=()=>{tc.setSpace('local');$('#sLoc').classList.add('on');$('#sWor').classList.remove('on');};
$('#sWor').onclick=()=>{tc.setSpace('world');$('#sWor').classList.add('on');$('#sLoc').classList.remove('on');};
$('#bResB').onclick=()=>{if(!sel)return stat('ยังไม่ได้เลือกข้อต่อ',1);pushUndo();delete S.edits[sel];delete S.moves[sel];boneUI();dirty();};
$('#bResAll').onclick=()=>{pushUndo();S.edits={};S.moves={};boneUI();dirty();};
$('#bUndo').onclick=doUndo;
$('#marks').onchange=e=>{for(const m of CH.marks)m.visible=e.target.checked;};
$('#bg').oninput=e=>scene.background.set(e.target.value);
$('#floor').onchange=e=>floor.visible=e.target.checked;
$('#grid').onchange=e=>grid.visible=e.target.checked;
$('#th3').onchange=e=>$('#thirds').classList.toggle('on',e.target.checked);
$('#mOrb').onclick=()=>setCamMode('orbit');$('#mFly').onclick=()=>setCamMode('fly');
$('#fov').oninput=e=>{cam.fov=+e.target.value;cam.updateProjectionMatrix();syncCamUI();};
$('#roll').oninput=e=>{roll=+e.target.value;syncCamUI();};
$('#spd').oninput=e=>$('#spdV').textContent=(+e.target.value).toFixed(1);
for(const b of document.querySelectorAll('[data-q]'))b.onclick=()=>quick(b.dataset.q);
$('#bShot').onclick=addShot;$('#bPlayAll').onclick=playAll;
function syncCamUI(){$('#fov').value=Math.round(cam.fov);$('#fovV').textContent=Math.round(cam.fov)+'°';$('#roll').value=roll;$('#rollV').textContent=roll+'°';}

addEventListener('keydown',e=>{
  const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)&&document.activeElement.type!=='checkbox'&&document.activeElement.type!=='range';
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save();return;}
  if(typing)return;
  const k=e.key.toLowerCase();
  if((e.ctrlKey||e.metaKey)&&k==='z'){e.preventDefault();doUndo();return;}
  if(camMode==='fly'&&'wasdqe'.includes(k)&&k.length===1){fly.keys[k]=true;e.preventDefault();}
  fly.keys.shift=e.shiftKey;
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(k==='p')addShot();else if(k==='c')setCamMode(camMode==='orbit'?'fly':'orbit');
  else if(k==='escape')selBone('');else if(k==='r'&&camMode!=='fly')gizmo('rotate');else if(k==='g')gizmo('translate');
  else if(k==='f'){const b=CH.B[sel]||CH.B.chest;if(b){const p=b.getWorldPosition(new V3()),d=cam.position.clone().sub(curTarget()).setLength(Math.min(1.2,cam.position.distanceTo(curTarget())));setCamMode('orbit');setCam(p.clone().add(d),p);}}
});
addEventListener('keyup',e=>{fly.keys[e.key.toLowerCase()]=false;fly.keys.shift=e.shiftKey;});
addEventListener('blur',()=>{fly.keys={};fly.rmb=false;});

// ---------- save / load ----------
let docId='';
function slug(s){const a=String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40);return a||'';}
function camDesc(c,st){
  const p=new V3().fromArray(c.p),t=new V3().fromArray(c.t),d=p.clone().sub(t),ry=st.ry*DEG+((HPOSE[st.preset]||{}).ry||0);
  const l=d.clone().applyAxisAngle(_Y,-ry),yaw=Math.atan2(l.x,l.z)/DEG,pit=Math.atan2(d.y,Math.hypot(d.x,d.z))/DEG,h=CH.h||1.7;
  const part=t.y>h*0.85?'ระดับหัว':t.y>h*0.55?'ระดับอก':t.y>h*0.35?'ระดับเอว':'ระดับขา';
  return {dist:d.length(),yaw,pit,part};
}
function makeMd(doc){
  const f=v=>v.map(x=>x.toFixed(2)).join(', ');
  const L=['# ท่า + กล้อง: '+(doc.name||doc.id)+' (`'+doc.id+'`)','',
    '> เขียนอัตโนมัติจาก `posecam.html` (ศูนย์รวม Tool → ท่า + กล้อง) — อย่าแก้ตรง ๆ. **Claude: เปิดรูปแต่ละมุมด้วย Read.** หน่วย = เมตร, ตัวละครยืนที่ (0,0,0), สูง '+(CH.h||0).toFixed(2)+' m, หน้าตัวละคร = +z เมื่อหมุนตัว 0°. มุมรอบตัว: 0° = หน้าตรง, +90° = ด้านซ้ายของตัวละคร, ±180° = ด้านหลัง. ข้อมูลดิบ (ท่าครบทุกข้อต่อ) อยู่ใน `posecam/'+doc.id+'.json`.','',
    '- จำนวนมุม: '+doc.shots.length+' • เล่นต่อกันรวม ~'+doc.shots.reduce((a,s)=>a+(+s.dur||0)+(+s.hold||0),0).toFixed(1)+' s',''];
  doc.shots.forEach((s,i)=>{const c=camDesc(s.cam,s.st),st=s.st;
    L.push('## '+(i+1)+'. '+s.name,'','- รูป: `posecam/'+doc.id+'_'+s.id+'.jpg`');
    if(s.note)L.push('- โน้ต: '+s.note.replace(/\n/g,' / '));
    L.push('- กล้อง: อยู่ที่ ('+f(s.cam.p)+') มองไปที่ ('+f(s.cam.t)+') • FOV '+Math.round(s.cam.fov)+'° • ห่างจุดมอง '+c.dist.toFixed(2)+' m • จุดมอง'+c.part+(s.cam.roll?' • เอียงกล้อง '+s.cam.roll+'°':''),
      '- มุมรอบตัวละคร '+Math.round(c.yaw)+'° • '+(c.pit>2?'มองลง '+Math.round(c.pit)+'°':c.pit<-2?'มองขึ้น '+Math.round(-c.pit)+'°':'ระดับสายตา'),
      '- เข้ามุมนี้: เคลื่อน '+s.dur+' s แบบ "'+(EASE_TH[s.ease]||s.ease)+'" แล้วค้าง '+s.hold+' s',
      '- ท่า: คลิป '+(st.clip||'ไม่มี')+(st.clip?' @ '+(+st.t).toFixed(2)+' s'+(st.play?' (เล่นอยู่)':' (หยุด)'):'')+' • ท่าสำเร็จ '+(st.preset||'ไม่มี')+' • หมุนตัว '+st.ry+'°'+(st.orb?' • มีลูกแก้วมือซ้าย':'')+(st.wand?'':' • ซ่อนไม้'),
      '- ข้อต่อที่แก้เอง: '+([...new Set([...Object.keys(st.edits),...Object.keys(st.moves)])].map(n=>BONE_TH[n]||n).join(', ')||'ไม่มี'),'');});
  return L.join('\n')+'\n';
}
async function save(){
  if(!shots.length)return stat('ยังไม่มีมุมที่บันทึก (กด P)',1);
  const name=$('#name').value.trim()||'ไม่มีชื่อ';if(!docId)docId=slug(name)||('pc-'+Date.now().toString(36));
  const doc={id:docId,name,h:r4(CH.h||0),scene:{bg:$('#bg').value,floor:floor.visible,grid:grid.visible},
    shots:shots.map(s=>({id:s.id,name:s.name,note:s.note,dur:s.dur,hold:s.hold,ease:s.ease,cam:s.cam,st:s.st}))};
  const imgs={};for(const s of shots)if(s._img)imgs[s.id]=s._img;
  stat('กำลังบันทึก…');
  try{const r=await fetch('/api/posecam?id='+encodeURIComponent(docId),{method:'POST',body:JSON.stringify({doc,imgs,md:makeMd(doc)})});const j=await r.json();
    if(!j.ok)throw j.err||r.status;
    const ts=Date.now();for(const s of shots){if(s._img){s.img='posecam/'+docId+'_'+s.id+'.jpg';s.ts=ts;delete s._img;}}
    isDirty=false;shotsUI();listDocs();$('#stat').className='ok';$('#stat').textContent='บันทึกแล้ว → posecam/'+docId+'.json';
  }catch(e){stat('บันทึกไม่ได้: '+e+' (เปิดผ่าน Tools.bat ไหม?)',1);}
}
async function listDocs(){try{const r=await fetch('/api/posecams');const a=await r.json();
  $('#open').innerHTML='<option value="">เปิดชุดเดิม…</option>'+a.map(d=>`<option value="${d.id}"${d.id===docId?' selected':''}>${esc(d.name)} (${d.n})</option>`).join('');}catch(e){}}
$('#open').onchange=async e=>{const id=e.target.value;if(!id)return;if(isDirty&&!confirm('ทิ้งที่ยังไม่บันทึก?')){e.target.value=docId;return;}
  try{const d=await (await fetch('/api/posecam?id='+id)).json();docId=d.id;$('#name').value=d.name||'';const ts=Date.now();
    shots=(d.shots||[]).map(s=>({...s,img:'posecam/'+d.id+'_'+s.id+'.jpg',ts}));
    if(d.scene){$('#bg').value=d.scene.bg||'#14131a';scene.background.set($('#bg').value);floor.visible=$('#floor').checked=d.scene.floor!==false;grid.visible=$('#grid').checked=d.scene.grid!==false;}
    isDirty=false;shotsUI();if(shots[0])goShot(shots[0],0);stat('เปิด '+d.id);}catch(err){stat('เปิดไม่ได้: '+err,1);}};
$('#bNew').onclick=()=>{if(isDirty&&!confirm('ทิ้งที่ยังไม่บันทึก?'))return;docId='';shots=[];curShot='';$('#name').value='';$('#open').value='';isDirty=false;shotsUI();stat('ชุดใหม่');};
$('#bSave').onclick=save;
addEventListener('beforeunload',e=>{if(isDirty){e.preventDefault();e.returnValue='';}});
listDocs();

// ---------- loop ----------
const clock=new THREE.Clock();
function loop(now){
  requestAnimationFrame(loop);const dt=Math.min(0.1,clock.getDelta());
  if(tr)trTick(dt);
  else{if(camMode==='fly')flyTick(dt);else orbit.update();applyRoll();evalPose(dt);}
  orbTick(now);
  const C=CH.clips[S.clip];if(C&&document.activeElement!==$('#time')){$('#time').value=S.t/C.dur;}$('#timeV').textContent=(+S.t).toFixed(2);
  const t=curTarget();$('#ov').textContent=(camMode==='fly'?'บินอิสระ':'หมุนรอบจุด')+'  FOV '+Math.round(cam.fov)+'°  ห่าง '+cam.position.distanceTo(t).toFixed(2)+' m'+(sel?'\nข้อต่อ: '+BONE_TH[sel]:'');
  R.render(scene,cam);
}
requestAnimationFrame(loop);
window.PC={S:()=>S,shots:()=>shots,CH,cam,orbit,goShot,addShot,quick,evalPose,save};
