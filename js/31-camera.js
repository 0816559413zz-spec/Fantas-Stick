// ---------- กล้องมุมหลังไหล่ (แบบ Hogwarts Legacy) ----------
let yaw=0,pitch=0.3,lastPh='',locked=false;
const CAMRS={has:false,x:0,y:0};   // ตำแหน่งตัวเราเฟรมก่อน (ดูว่าเริ่มรอบแล้วถูกย้ายจุดเกิดไหม)
let SENS=0.0015*SET.sens/100;
function saveSet(){store('wd_set',JSON.stringify(SET));}
function applySettings(){
  SENS=0.0015*SET.sens/100;
  cam.fov=SET.fov;cam.updateProjectionMatrix();
  if(AC&&MASTER)MASTER.gain.setTargetAtTime(SET.master/100,AC.currentTime,0.05);
  if(AC&&SFXBUS)SFXBUS.gain.setTargetAtTime(SET.sfx/100,AC.currentTime,0.05);
  if(AC&&MUSIC.bus)MUSIC.bus.gain.setTargetAtTime(MUSIC.on?0.8*SET.music/100:0,AC.currentTime,0.1);
  const f=document.getElementById('fps');if(f)f.style.display=SET.fps?'block':'none';
}
const camPos=new THREE.Vector3(0,20,40),camLook=new THREE.Vector3();
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===cv;if(locked){hidePause();trToggle(false);}else if(screen==='game'&&!trOpenF&&!crOpen)showPause();});
// เมนู Esc: ปล่อยเมาส์ (Esc) ระหว่างเล่น = เปิดเมนูหยุดพัก
function overlayOpen(){return ['#over','#buff','#meet'].some(s=>{const el=document.querySelector(s);return el&&!el.classList.contains('hidden');});}
function showPause(){if(overlayOpen())return;const el=$('#pause');uiShow(el);$('#pLobby').style.display=NET.isHost?'':'none';INPUT.fire=INPUT.sh=INPUT.u=INPUT.d=INPUT.l=INPUT.r=INPUT.jh=INPUT.ch=0;}
function hidePause(){uiHide($('#pause'));}
const MAPCAM={castle:{m:1.4,wy:0},forest:{m:6,wy:0},pitch:{m:7,wy:0},hogsmeade:{m:4,wy:0},greathall:{m:1.4,wy:0},meadow:{m:8,wy:0},lake:{m:8,wy:0},ruins:{m:5,wy:0}};
// วางสกิลแบบ Overwatch: กดครั้งแรก = เห็นเงาสีฟ้าตรงจุดที่จะวาง • กดซ้ำ/คลิกซ้าย = วาง • คลิกขวา = ยกเลิก
const PLACE={slot:-1,g:null};const PLACE_SP={mudswamp:{r:120,range:600},dustburst:{r:350,range:500},ringofembers:{r:170,range:400},triplestrike:{r:70,range:600}};
function placeKey(a){
  const i='qerf'.indexOf(a);if(i<0)return false;
  const v=VIEW.cur,me=v&&v.P&&v.P.find(q=>q.id===NET.myId);if(!me||!me.al)return false;
  const S=SPELL_LIST[getKit(NET.myId).ids[i]];if(!S||!PLACE_SP[S.id])return false;
  if(PLACE.slot===i){PLACE.slot=-1;return false;}       // กดซ้ำ = ยืนยัน (ส่งปุ่มไปตามปกติ)
  if((me.cd[i+1]||0)>0)return false;
  PLACE.slot=i;return true;
}
function updatePlaceGhost(me){
  if(PLACE.slot<0||!me.al){if(PLACE.g)PLACE.g.visible=false;if(!me.al)PLACE.slot=-1;return;}
  const S=SPELL_LIST[getKit(NET.myId).ids[PLACE.slot]],D=S&&PLACE_SP[S.id];if(!D){PLACE.slot=-1;return;}
  if(!PLACE.g){const g=new THREE.Group(),m=new THREE.MeshBasicMaterial({color:hdr('#5ff0ff',1.4),transparent:true,opacity:0.85,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
    g.add(new THREE.Mesh(_iceEdge,m));const d=new THREE.Mesh(_iceDisc,new THREE.MeshBasicMaterial({color:'#3fd8ff',transparent:true,opacity:0.12,depthWrite:false}));g.add(d);
    for(let i=0;i<28;i++){const a=i/28*Math.PI*2,f=new THREE.Mesh(new THREE.ConeGeometry(0.035,0.12,5),m);f.position.set(Math.cos(a),0.06,Math.sin(a));f.userData.a=a;g.add(f);}
    scene.add(g);PLACE.g=g;}
  let gx=INPUT.gx,gy=INPUT.gy;if(!(gx>=0)){gx=me.x+Math.cos(yaw)*D.range*0.75;gy=me.y+Math.sin(yaw)*D.range*0.75;}
  const dx=gx-me.x,dy=gy-me.y,d=Math.hypot(dx,dy)||1,k=Math.min(1,D.range/d);gx=me.x+dx*k;gy=me.y+dy*k;
  const g=PLACE.g;g.visible=true;g.position.set(tx(gx),0.05+GY(gx,gy),tz(gy));g.scale.set(D.r*S3,D.r*S3*(1+0.1*Math.sin(performance.now()/150)),D.r*S3);
  g.children.forEach(c=>{if(c.userData.a!==undefined)c.scale.y=1+0.6*Math.abs(Math.sin(performance.now()/120+c.userData.a*3));});
}
// เล็งตามเป้ากลางจอ: ยิงเส้นจากกล้องผ่านกลางจอ หาสิ่งแรกที่เส้นชน (ศัตรู/ผู้เล่น/สิ่งกีดขวาง) แล้วส่งจุดนั้นเป็นเป้า (ax/ay) + ความสูง (ah)
// กล้องอยู่ข้างไหล่ขวา ถ้าเล็งจุดไกลตายตัว เป้าใกล้ๆ จะเบี้ยวซ้าย/สูงต่ำผิด — ต้องเล็งไปที่จุดชนจริง
const _aimD=new THREE.Vector3();
// เส้นจากกล้อง (o + d*t) ชนพื้นสูงต่ำ/พื้นชั้นบนที่ t เท่าไหร่ (ไม่ชน = 1e9) — เดินทีละ 0.5 หน่วยแล้วแบ่งครึ่งหาจุดชน
function rayTerr(o,d,t0,t1){
  const solid=t=>{const X=o.x+d.x*t,Z=o.z+d.z*t,sx=X*20+MW/2,sy=Z*20+MH/2;return terrSolid(sx,sy,o.y+d.y*t-terrT(sx,sy));};
  let a=Math.max(0,t0);if(solid(a))return 1e9;
  for(let t=a+0.5;t<=t1;t+=0.5){if(solid(t)){let lo=t-0.5,hi=t;for(let i=0;i<6;i++){const m=(lo+hi)/2;if(solid(m))hi=m;else lo=m;}return hi;}}
  return 1e9;
}
function aimFromCrosshair(me,P,E){
  cam.getWorldDirection(_aimD);
  const o=cam.position,dx=_aimD.x,dy=_aimD.y,dz=_aimD.z,hDir=dx*dx+dz*dz;
  const px=tx(me.x),pz=tz(me.y),gm=GY(me.x,me.y),chest=gm+(me.z||0)+1.3;
  // ไม่นับสิ่งที่อยู่ระหว่างกล้องกับตัวผู้เล่น (กล้องล้ำเข้าไปในกำแพงได้)
  const tMin=Math.max(0.5,(px-o.x)*dx+(pz-o.z)*dz);
  let T=60;
  const cyl=(cx,cz,r,y0,y1)=>{
    if(hDir<1e-8)return;
    const fx=o.x-cx,fz=o.z-cz,b=fx*dx+fz*dz,c=fx*fx+fz*fz-r*r,disc=b*b-hDir*c;
    if(disc<0)return;
    const t=(-b-Math.sqrt(disc))/hDir;
    if(t<=tMin||t>=T)return;
    const y=o.y+dy*t;if(y>=y0&&y<=y1)T=t;
  };
  for(const q of OBS){if(q.k==='tfence'||q.bi!==undefined&&BLDG[q.bi]&&BLDG[q.bi].pc.some(p=>p.fl&1))continue;{const g0=GY(q.x,q.y);cyl(tx(q.x),tz(q.y),q.r*S3,q.top!==undefined?-50:g0,q.top!==undefined?q.top:g0+(q.hgt||9));}}
  if(PROPON)for(const q of PROPS)if(q.st!==1){const g0=GY(q.x,q.y);cyl(tx(q.x),tz(q.y),q.r*S3,g0,g0+q.hgt);}
  for(const q of P||[])if(q.id!==me.id&&q.al&&!q.dn&&!q.gh){const g0=GY(q.x,q.y)+(q.z||0);cyl(tx(q.x),tz(q.y),0.55,g0,g0+2);}
  for(const e of E||[]){const D=EDEF[e.t];if(D){const g0=GY(e.x,e.y)+(e.h||0);cyl(tx(e.x),tz(e.y),Math.max(0.4,D.r*S3),g0,g0+D.ch+0.8);}}
  // เส้นเล็งลงพื้นก่อนชนอะไร = ยิงไปจุดนั้นบนพื้นตรงเป้า (ล็อกเป้าอัตโนมัติใน shoot() ยังช่วยถ้าเล็งใกล้ศัตรู)
  const tg=TERR?rayTerr(o,_aimD,tMin,T):(dy<-1e-4?-o.y/dy:1e9);if(tg>tMin&&tg<T)T=tg;
  let X=o.x+dx*T,Z=o.z+dz*T,Y=Math.max(TW(X,Z)+0.1,o.y+dy*T);
  // จุดเล็งอยู่ใกล้/ข้างหลังตัวเกินไป (ก้มมองเท้า) ให้ยิงตรงไปข้างหน้าระดับอกแทน
  if(Math.hypot(X-px,Z-pz)<1.5||(X-px)*dx+(Z-pz)*dz<=0){X=o.x+dx*60;Z=o.z+dz*60;Y=Math.max(chest,o.y+dy*60);}
  INPUT.ax=X*20+MW/2;INPUT.ay=Z*20+MH/2;INPUT.ah=Y-gm;   // ความสูงเล็ง นับจากพื้นใต้ตัวเรา (ระบบเกมใช้ความสูงจากพื้น)
  // จุดที่เป้ากลางจอชนพื้น (ใช้กับคาถาวางพื้น / หน้าไม้ของร่างยักษ์)
  const tgG=TERR?rayTerr(o,_aimD,0,90):1e9;
  if(TERR&&tgG<90){INPUT.gx=(o.x+_aimD.x*tgG)*20+MW/2;INPUT.gy=(o.z+_aimD.z*tgG)*20+MH/2;}
  else if(!TERR&&_aimD.y<-0.01){const t=(o.y-0.05)/-_aimD.y;INPUT.gx=(o.x+_aimD.x*t)*20+MW/2;INPUT.gy=(o.z+_aimD.z*t)*20+MH/2;}else{INPUT.gx=INPUT.gy=-1;}
}
let AIMZ=0;
// สายดิน: ซูมออก + เลื่อนกล้องไปซ้ายตอนกดค้าง BA ชาร์จ / ตอนรอปาเสาอัลติบนฟ้า (Stand ใหญ่ไม่บังจอ) — ผู้ใช้ 2026-10-21
let EZC=0,ESC=0;   // ESC = โล่ Earth: Stand ทึบอยู่หลังเรา → กล้องเลื่อนไปซ้ายให้เห็นข้างหน้า (ผู้ใช้ 2026-10-21)
function updateCamera(me,dt){
  AIMZ+=(((me.kd>0&&me.hv)?1:0)-AIMZ)*Math.min(1,dt*10);if(AIMZ<0.001)AIMZ=0;
  {const fv=SET.fov*(1-0.25*AIMZ);if(Math.abs(cam.fov-fv)>0.01){cam.fov=fv;cam.updateProjectionMatrix();}}
  const px=tx(me.x),pz=tz(me.y);
  const fx=Math.cos(yaw),fz=Math.sin(yaw),rx=-fz,rz=fx;
  const eu=me.ea&&me.al?(me.ea[3]===1?1:me.ea[9]>0?0.45:0):0;EZC+=(eu-EZC)*Math.min(1,dt*(eu>EZC?4:2.5));
  const es=me.ea&&me.al&&me.sh&&!(me.ea[0]>0)&&eu===0?1:0;ESC+=(es-ESC)*Math.min(1,dt*(es>ESC?5:3));
  const big=me.co>0,dist=(big?13:me.fl?7.4:5.6)*(1-0.35*AIMZ)+EZC*9+ESC*1.5,cp=Math.cos(pitch),sp=Math.sin(pitch),side=(big?4.2:0.85+0.3*AIMZ)-EZC*3-ESC*2.6;
  const focus=new THREE.Vector3(px+rx*side,GY(me.x,me.y)+(me.z||0)+(big?3.4:2.05)+EZC*1.5+ESC*0.4,pz+rz*side);
  // กล้องอยู่หลังผู้เล่น: ถ้าหลังชนขอบแผนที่ ให้ "ร่นกล้องเข้าหาตัว + ยกสูงขึ้น" แทนการบีบพิกัดทีละแกน (เดิมกล้องไปทับหัวตัวละคร)
  // กล้องล้ำเข้าไปในตัวกำแพงได้ (กำแพงหนา ~1.6 หน่วย ฝั่งหลังกำแพงโปร่ง มองทะลุเห็นตัวละคร) เกินกว่านั้นให้ร่นกล้องเข้าหาตัว
  const cfg=MAPCAM[MAPID]||MAPCAM.castle,hx=MW*S3/2,hz=MH*S3/2,bx=hx-1.2+cfg.m,bz=hz-1.2+cfg.m,ox=-fx*dist*cp,oz=-fz*dist*cp;
  const lim=(f,o,b)=>o>1e-6?(b-f)/o:o<-1e-6?(-b-f)/o:1;
  const k=Math.max(0.45,Math.min(1,lim(focus.x,ox,bx),lim(focus.z,oz,bz)));
  let x=focus.x+ox*k,z=focus.z+oz*k,y=focus.y+dist*sp+(1-k)*dist*0.5;
  x=clamp(x,-bx,bx);z=clamp(z,-bz,bz);
  if(TERR){   // เนินบังกล้อง: ร่นกล้องเข้าหาตัวจนพ้นพื้น
    for(let i=1;i<=10;i++){const f=i/10,X=focus.x+(x-focus.x)*f,Z=focus.z+(z-focus.z)*f,Y=focus.y+(y-focus.y)*f;if(Y<TW(X,Z)+0.4){const f2=Math.max(0.15,(i-1)/10);x=focus.x+(x-focus.x)*f2;z=focus.z+(z-focus.z)*f2;y=focus.y+(y-focus.y)*f2;break;}}
    y=Math.max(TW(x,z)+0.5,y);
  }else y=Math.max(0.5,y);
  camPos.lerp(new THREE.Vector3(x,y,z),1-Math.exp(-25*dt));
  cam.position.copy(camPos);
  if(shakeA>0)cam.position.add(new THREE.Vector3(rnd(-1,1),rnd(-1,1),rnd(-1,1)).multiplyScalar(shakeA*0.02));
  camLook.set(focus.x+fx*8*cp,focus.y-8*sp+1.2*sp,focus.z+fz*8*cp);
  cam.lookAt(camLook);
  if(window.WD&&window.WD.camHook)window.WD.camHook(cam);
}
function menuCamera(now){
  const t=now/9000,rx=MW*S3*0.36,rz=MH*S3*0.36;
  cam.position.set(Math.cos(t)*rx,MAPID==='castle'?20+Math.sin(t*0.7)*4:16,Math.sin(t)*rz);
  cam.lookAt(0,4,0);
}
