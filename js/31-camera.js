// ---------- กล้องมุมหลังไหล่ (แบบ Hogwarts Legacy) ----------
let yaw=0,pitch=0.3,lastPh='',locked=false;
const CAMRS={has:false,x:0,y:0};   // ตำแหน่งตัวเราเฟรมก่อน (ดูว่าเริ่มรอบแล้วถูกย้ายจุดเกิดไหม)
let SENS=0.0015*SET.sens/100;
function saveSet(){store('wd_set',JSON.stringify(SET));}
function applySettings(){
  SENS=0.0015*SET.sens/100;
  cam.fov=SET.fov;cam.updateProjectionMatrix();
  if(AC&&MASTER)MASTER.gain.setTargetAtTime(masterGain(),AC.currentTime,0.05);
  if(AC&&SFXBUS)SFXBUS.gain.setTargetAtTime(SET.sfx/100,AC.currentTime,0.05);
  if(AC&&MUSIC.bus)MUSIC.bus.gain.setTargetAtTime(MUSIC.on?0.8*SET.music/100:0,AC.currentTime,0.1);
  const f=document.getElementById('fps');if(f)f.style.display=SET.fps?'block':'none';
}
const camPos=new THREE.Vector3(0,20,40),camLook=new THREE.Vector3();
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===cv;if(locked){hidePause();trToggle(false);if(bpOpen)bpShow(false);}else if(screen==='game'&&!trOpenF&&!bpOpen&&!crOpen)showPause();});
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
  for(const q of OBS){if(q.k==='tfence'||q.bi!==undefined&&BLDG[q.bi]&&BLDG[q.bi].pc.some(p=>p.fl&1)||q.bot>=q.hgt)continue;{const g0=GY(q.x,q.y);cyl(tx(q.x),tz(q.y),q.r*S3,q.top!==undefined?-50:g0+(q.bot||0),q.top!==undefined?q.top:g0+(q.hgt||9));}}
  if(PROPON)for(const q of PROPS)if(q.st!==1){const g0=GY(q.x,q.y);cyl(tx(q.x),tz(q.y),q.r*S3,g0,g0+q.hgt);}
  for(const q of P||[])if(q.id!==me.id&&q.al&&!q.dn&&!q.gh){const g0=GY(q.x,q.y)+(q.z||0);cyl(tx(q.x),tz(q.y),0.55,g0,g0+2);}
  for(const e of E||[]){const D=EDEF[e.t];if(D){const g0=GY(e.x,e.y)+(e.h||0);cyl(tx(e.x),tz(e.y),Math.max(0.4,D.r*S3),g0,g0+D.ch+0.8);}}
  // เส้นเล็งลงพื้นก่อนชนอะไร = ยิงไปจุดนั้นบนพื้นตรงเป้า (ล็อกเป้าอัตโนมัติใน shoot() ยังช่วยถ้าเล็งใกล้ศัตรู)
  if(MAPID==='city')for(let t=tMin;t<T;t+=0.4){const X=o.x+dx*t,Z=o.z+dz*t;if(citySolidAt(X/S3+MW/2,Z/S3+MH/2,o.y+dy*t)){T=t;break;}}   // ตึกในเมือง (ผนังที่ยังไม่แตก/ส่วนทึบ)
  const tw=T;   // ระยะถึงสิ่งที่ชนก่อนพื้น (ใช้จำกัดจุดวางสกิลบนพื้นด้วย)
  const tg=TERR?rayTerr(o,_aimD,tMin,T):(dy<-1e-4?-o.y/dy:1e9);if(tg>tMin&&tg<T)T=tg;
  let X=o.x+dx*T,Z=o.z+dz*T,Y=Math.max(TW(X,Z)+0.1,o.y+dy*T);
  // จุดเล็งอยู่ใกล้/ข้างหลังตัวเกินไป (ก้มมองเท้า) ให้ยิงตรงไปข้างหน้าระดับอกแทน
  if(Math.hypot(X-px,Z-pz)<1.5||(X-px)*dx+(Z-pz)*dz<=0){X=o.x+dx*60;Z=o.z+dz*60;Y=Math.max(chest,o.y+dy*60);}
  INPUT.ax=X*20+MW/2;INPUT.ay=Z*20+MH/2;INPUT.ah=Y-gm;   // ความสูงเล็ง นับจากพื้นใต้ตัวเรา (ระบบเกมใช้ความสูงจากพื้น)
  // จุดที่เป้ากลางจอชนพื้น (ใช้กับคาถาวางพื้น / หน้าไม้ของร่างยักษ์)
  const tgG=TERR?rayTerr(o,_aimD,0,90):1e9;
  if(TERR&&tgG<90){INPUT.gx=(o.x+_aimD.x*tgG)*20+MW/2;INPUT.gy=(o.z+_aimD.z*tgG)*20+MH/2;}
  else if(!TERR&&_aimD.y<-0.01){const t=Math.min((o.y-0.05)/-_aimD.y,tw<60?tw:1e9);INPUT.gx=(o.x+_aimD.x*t)*20+MW/2;INPUT.gy=(o.z+_aimD.z*t)*20+MH/2;}else{INPUT.gx=INPUT.gy=-1;}   // จุดบนพื้น ไม่เลยผนังที่เส้นเล็งชนก่อน
}
let AIMZ=0,WBY=null;
// side = สัดส่วนครึ่งความกว้างภาพ: 0.30 ให้ตัวเราอยู่แถว 35% ของจอ แม้ FOV/สัดส่วนจอเปลี่ยน
// lift ยกตำแหน่งกล้องแยกจากจุดมอง: Earth มองข้าม Stand ได้ โดยไม่ยกเป้าเล็งหนีขึ้นฟ้า
// กล้องทุกสายใช้ชุดเดียวกัน; เลือกมุมพิเศษจาก snapshot จึงทำงานกับลูกห้องด้วย
const CAM_FRAMES={
  base:{dist:4.7,h:2.05,side:0.25},flight:{dist:7,h:2.4,side:0.28},   // base: แบบเกม hero shooter มุมบุคคลที่ 3 (ผู้ใช้ 2026-11-06) ใกล้ขึ้น ตัวอยู่ ~37% จากซ้าย (เดิม 6.2/2.25/0.30)
  colossus:{dist:14.5,h:4.4,side:0.34},airAim:{dist:6.6,h:2.5,side:0.29},
  kindle:{dist:5,h:2.3,side:0.31},rail:{dist:5.4,h:2.2,side:0.3},
  earthBase:{dist:7,h:2.25,side:0,lift:2.4},earthRampage:{dist:9,h:4.1,side:0,lift:3},
  earthShield:{dist:9,h:2.8,side:0,lift:5.5},earthCharge:{dist:10,h:3,side:0,lift:5},
  earthAuger:{dist:12,h:3.3,side:0,lift:3.5},earthSky:{dist:15.2,h:3.8,side:0,lift:3},
  windShield:{dist:6.2,h:2.45,side:0.34},windFlight:{dist:8.6,h:2.65,side:0.32},
  waterBeam:{dist:7.8,h:3.5,side:0},waterDragon:{dist:17.2,h:4.8,side:0.30}
};
const CAM_FRAME={dist:4.7,h:2.05,side:0.25,lift:0},CAM_TRACK={has:false,key:'',x:0,y:0,z:0,r:0,gy:undefined};
const _camFocus=new THREE.Vector3(),_camAnchor=new THREE.Vector3(),_camWant=new THREE.Vector3();
function cameraFrame(me){
  if(me.al){
    if(me.co>0)return CAM_FRAMES.colossus;
    if(me.ea){
      if(me.ea[3]===1)return CAM_FRAMES.earthSky;
      if(me.ea[2]>0)return CAM_FRAMES.earthAuger;
      if(me.ea[9]>0)return CAM_FRAMES.earthCharge;
      if(me.ea[1])return CAM_FRAMES.earthRampage;
      if(me.sh&&!(me.ea[0]>0))return CAM_FRAMES.earthShield;
      return me.fl?CAM_FRAMES.flight:CAM_FRAMES.earthBase;
    }
    // Beam คงมุมกลางหลังเหนือหัว ตั้งแต่ร่ายจนยิงจบ; การจำกัดทิศเมาส์อยู่ที่เดิม
    if(me.wt&&me.wt[7])return CAM_FRAMES.waterBeam;
    if(me.wt&&me.wt[5])return CAM_FRAMES.waterDragon;
    if(me.df)return CAM_FRAMES.airAim;
    if(me.wn&&me.wn[5])return CAM_FRAMES.windFlight;
    if(me.wn&&me.sh)return CAM_FRAMES.windShield;
    if(me.sm&&(me.sm[3]&16))return CAM_FRAMES.rail;
    if(me.kd>0&&me.hv)return CAM_FRAMES.kindle;
  }
  return me.fl?CAM_FRAMES.flight:CAM_FRAMES.base;
}
// ผู้เล่นอยู่ในห้อง (บ้านที่เดินเข้าได้ / ตึกกลวงในเมือง): ร่นกล้องตามแนวจากจุดโฟกัสให้อยู่ในห้อง (ห่างผนัง 0.3 ม. ต่ำกว่าเพดาน 0.25 ม.) • คืนสัดส่วน 0.12..1
function camRoomK(me,F,x,y,z){
  const mz=me.z||0;let k=1;const fit=(f,c,lo,hi)=>{if(c<lo&&f>lo)k=Math.min(k,(f-lo)/(f-c));else if(c>hi&&f<hi)k=Math.min(k,(hi-f)/(c-f));};
  const R=cityRoomBox(me.x,me.y,mz);
  if(R){fit(F.x,x,tx(R.x0)+0.3,tx(R.x1)-0.3);fit(F.z,z,tz(R.y0)+0.3,tz(R.y1)-0.3);fit(F.y,y,R.z0+0.3,R.z1-0.25);return Math.max(0.12,k);}
  if(BLDG.length)for(const b of BLDG){const [lx,ly]=bldLocal(b,me.x,me.y),hw=b.o.w/2-b.D.th/2,hd=b.o.d/2-b.D.th/2;
    if(Math.abs(lx)>=hw||Math.abs(ly)>=hd||mz>=b.D.wh||bldGone(b))continue;
    const [cx,cy]=bldLocal(b,x/S3+MW/2,z/S3+MH/2),[fx,fy]=bldLocal(b,F.x/S3+MW/2,F.z/S3+MH/2),m=6;
    fit(fx,cx,-hw+m,hw-m);fit(fy,cy,-hd+m,hd-m);fit(F.y,y,0.3,GY(b.o.x,b.o.y)+b.D.wh+b.D.rh*0.45);return Math.max(0.12,k);}
  return 1;
}
function updateCamera(me,dt){
  // ร่าย/ยิง Abyssal Beam: กล้องหมุนได้เร็วเท่าลำเท่านั้น (ผู้ใช้ 2026-11-01) เมาส์ยังบังคับทิศลำ
  if(me.wt&&me.wt[7]&&me.al&&WBY!==null){const m=WT_AB.turn*dt;yaw=WBY+Math.max(-m,Math.min(m,angDiff(yaw,WBY)));}
  WBY=me.wt&&me.wt[7]&&me.al?yaw:null;
  AIMZ+=(((me.kd>0&&me.hv)?1:0)-AIMZ)*Math.min(1,dt*10);if(AIMZ<0.001)AIMZ=0;
  {const fv=SET.fov*(1-0.25*AIMZ);if(Math.abs(cam.fov-fv)>0.01){cam.fov=fv;cam.updateProjectionMatrix();}}
  const px=tx(me.x),pz=tz(me.y);
  const fx=Math.cos(yaw),fz=Math.sin(yaw),rx=-fz,rz=fx;
  const target=cameraFrame(me),key=builtKey+'|'+me.id,ground=GY(me.x,me.y)+(me.z||0),cut=!CAM_TRACK.has||CAM_TRACK.key!==key;
  const blend=cut?1:1-Math.exp(-(target===CAM_FRAMES.waterDragon?14:8)*dt);
  for(const k of ['dist','h','side','lift'])CAM_FRAME[k]=lerp(CAM_FRAME[k],target[k]||0,blend);
  const dist=CAM_FRAME.dist*(1-0.15*AIMZ),cp=Math.cos(pitch),sp=Math.sin(pitch);
  const side=CAM_FRAME.side*dist*Math.tan(cam.fov*Math.PI/360)*cam.aspect;
  const focus=_camFocus.set(px+rx*side,ground+CAM_FRAME.h,pz+rz*side);
  // กล้องอยู่หลังผู้เล่น: ถ้าหลังชนขอบแผนที่ ให้ "ร่นกล้องเข้าหาตัว + ยกสูงขึ้น" แทนการบีบพิกัดทีละแกน (เดิมกล้องไปทับหัวตัวละคร)
  // กล้องล้ำเข้าไปในตัวกำแพงได้ (กำแพงหนา ~1.6 หน่วย ฝั่งหลังกำแพงโปร่ง มองทะลุเห็นตัวละคร) เกินกว่านั้นให้ร่นกล้องเข้าหาตัว
  const cfg=MAPCAM[MAPID]||MAPCAM.castle,hx=MW*S3/2,hz=MH*S3/2,bx=hx-1.2+cfg.m,bz=hz-1.2+cfg.m,ox=-fx*dist*cp,oz=-fz*dist*cp;
  const lim=(f,o,b)=>o>1e-6?(b-f)/o:o<-1e-6?(-b-f)/o:1;
  const k=Math.max(0.45,Math.min(1,lim(focus.x,ox,bx),lim(focus.z,oz,bz)));
  let x=focus.x+ox*k,z=focus.z+oz*k,y=focus.y+dist*sp*k+CAM_FRAME.lift+(1-k)*0.35;   // ร่นเข้าเป็นเส้นตรงหาไหล่ (เดิมยกสูง = หลังชนกำแพงแล้วตัวตกขอบจอล่างเหลือแต่หัว)
  x=clamp(x,-bx,bx);z=clamp(z,-bz,bz);
  if(TERR){   // เนินบังกล้อง: ร่นกล้องเข้าหาตัวจนพ้นพื้น
    for(let i=1;i<=10;i++){const f=i/10,X=focus.x+(x-focus.x)*f,Z=focus.z+(z-focus.z)*f,Y=focus.y+(y-focus.y)*f;if(Y<TW(X,Z)+0.4){const f2=Math.max(0.15,(i-1)/10);x=focus.x+(x-focus.x)*f2;z=focus.z+(z-focus.z)*f2;y=focus.y+(y-focus.y)*f2;break;}}
    y=Math.max(TW(x,z)+0.5,y);
  }else y=Math.max(0.5,y);
  // จุดยึดสำหรับตรวจห้องอยู่ที่ตัวเรา ไม่ใช่ไหล่ที่อาจอยู่นอกห้องแคบ
  const anchor=_camAnchor.set(px,ground+1.35,pz);
  {const k2=camRoomK(me,anchor,x,y,z);if(k2<1){x=anchor.x+(x-anchor.x)*k2;y=anchor.y+(y-anchor.y)*k2;z=anchor.z+(z-anchor.z)*k2;}}
  // พุ่ง/เทเลพอร์ต/ทะยาน: พากล้องตามการย้ายตัวก่อนเกลี่ยระยะ ป้องกันกล้องไล่หลังแล้วหันกลับหาตัว
  // หมุนตามเมาส์ทันที (เดิมเกลี่ยตำแหน่ง 25/วิ = กล้องลอย ๆ ตามหลังตอนหัน) • เกลี่ยแค่ "ระยะจากจุดมอง":
  //   ชนผนัง/เนิน = หดเข้าทันที (ไม่ทะลุ) • พ้นแล้ว = ค่อย ๆ ถอยกลับ (ไม่กระตุก) • พื้นสูงต่ำ = ความสูงตามแบบนุ่ม
  const wd=Math.hypot(x-focus.x,y-focus.y,z-focus.z)||1e-3;
  if(cut||!(CAM_TRACK.r>0))CAM_TRACK.r=wd;
  else CAM_TRACK.r=wd<CAM_TRACK.r?wd:CAM_TRACK.r+(wd-CAM_TRACK.r)*(1-Math.exp(-5*dt));
  const rk=CAM_TRACK.r/wd;
  if(cut||!(CAM_TRACK.gy!==undefined)||Math.abs(ground-CAM_TRACK.gy)>3)CAM_TRACK.gy=ground;
  else CAM_TRACK.gy+=(ground-CAM_TRACK.gy)*(1-Math.exp(-18*dt));
  const gyo=CAM_TRACK.gy-ground;
  camPos.set(focus.x+(x-focus.x)*rk,focus.y+(y-focus.y)*rk+gyo,focus.z+(z-focus.z)*rk);
  CAM_TRACK.has=true;CAM_TRACK.key=key;CAM_TRACK.x=px;CAM_TRACK.y=ground;CAM_TRACK.z=pz;
  // ตรวจตำแหน่งหลังเกลี่ยด้วย: ตอนเพิ่งเข้าห้อง กล้องเฟรมก่อนอาจยังอยู่นอกผนัง
  {const roomK=camRoomK(me,anchor,camPos.x,camPos.y,camPos.z);if(roomK<1)camPos.lerpVectors(anchor,camPos,roomK);}
  camPos.x=clamp(camPos.x,-bx,bx);camPos.z=clamp(camPos.z,-bz,bz);
  camPos.y=Math.max(TERR?TW(camPos.x,camPos.z)+0.5:0.5,camPos.y);
  cam.position.copy(camPos);
  if(shakeA>0)cam.position.add(new THREE.Vector3(rnd(-1,1),rnd(-1,1),rnd(-1,1)).multiplyScalar(shakeA*0.02));
  camLook.set(focus.x+fx*8*cp,focus.y+gyo-8*sp+1.2*sp,focus.z+fz*8*cp);
  cam.lookAt(camLook);
  if(window.WD&&window.WD.camHook)window.WD.camHook(cam);
}
function menuCamera(now){
  const t=now/9000,rx=MW*S3*0.36,rz=MH*S3*0.36;
  cam.position.set(Math.cos(t)*rx,MAPID==='castle'?20+Math.sin(t*0.7)*4:16,Math.sin(t)*rz);
  cam.lookAt(0,4,0);
}
