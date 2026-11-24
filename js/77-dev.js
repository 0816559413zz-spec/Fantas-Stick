// ---------- Dev Mode: ทดสอบแมพ/สกิลในแมตช์จริง (ผู้ใช้ 2026-11-18) ----------
// เปิดด้วย ?dev=1 (จำไว้ในเครื่อง) • ปิดด้วย ?dev=0 • ใช้ได้เฉพาะโฮสต์ออฟไลน์ (ไม่ออนไลน์) = ไม่มีใครโดนโกง
// F2 หน้าต่าง Dev • F3 กล้องอิสระ • F4 หยุดโลก • F6 วาร์ปไปจุดที่เล็ง • F7 คัดลอกพิกัดที่เล็ง • F8 สโลว์โมชัน
// hook ในไฟล์อื่น: hostTick (js/11) • damage (js/12-buildings) • moveMul (js/03) • renderLoop (js/37) • pointerlock (js/31)
const DEV={on:false,open:false,key:'',bp:-1,bl:1,bn:1,ov:null,ovK:'',k:{},fc:{on:false,x:0,y:30,z:0,spd:30}};
DEV.cfg=Object.assign({god:0,nocd:0,ult:0,spd:1,fast:0,ts:1,omap:0,pause:0,freeze:0,col:0,zon:0,broom:0,noend:1,sbots:1},(()=>{try{return JSON.parse(store('wd_devcfg')||'{}');}catch(e){return {};}})());
DEV.cfg.pause=0;
try{const q=new URLSearchParams(location.search).get('dev');if(q==='1')store('wd_dev','1');else if(q==='0')store('wd_dev','');DEV.on=store('wd_dev')==='1';}catch(e){}
if(/[?&]mbcam=/.test(location.search))DEV.on=true;   // Map Builder game view: dev on for this page only (not remembered)
const devOn=()=>DEV.on&&NET.isHost&&!NET.online&&screen==='game'&&!!G&&G.ph!=='lobby';
const devOff=()=>DEV.on&&NET.isHost&&!NET.online;   // dev + offline host (also true in lobby)
const devSoloOk=()=>devOff()&&!!DEV.solo;   // set only while devStartMode runs
const devHold=()=>devOff()&&!!DEV.cfg.noend&&!DEV.endNow&&G&&G.ph!=='lobby';   // block auto match end
const devBroomOk=()=>devOff()&&!!DEV.cfg.broom;   // B works in every mode
const dvMe=()=>G&&G.players&&G.players[NET.myId];
const devSave=()=>store('wd_devcfg',JSON.stringify(DEV.cfg));
// ---- hook จากโฮสต์: เรียกต้น hostTick (คืน dt ที่ปรับแล้ว • -1 = หยุดโลก) ----
function devDt(dt){
  if(!devOn())return dt;
  const C=DEV.cfg;if(C.pause)return -1;
  return dt*C.ts;
}
function devTick(){
  if(!devOn())return;
  const me=dvMe(),C=DEV.cfg;if(!me)return;
  if(C.nocd)for(const k of SLOTK)me.cd[k]=0;
  if(C.ult)me.ult=100;
  if(C.god&&me.alive)me.hp=me.maxHp;
  me.devSpd=C.spd;
  if(C.fast&&!me.alive&&me.respawn>0.5)me.respawn=0.5;
}
const devGod=t=>DEV.on&&DEV.cfg.god&&t.id===NET.myId&&devOn();
const devFreeze=()=>DEV.on&&DEV.cfg.freeze&&devOn();
// ---- กล้องอิสระ ----
// Map Builder "มุมมองเกม" (mapbuild/app.js gameView): index.html?...&playmap=<id>&mbcam=x,y,z,yaw,pitch[&mbclean=1]
// → when the match is running, jump into the free camera at that pose (world metres, same frame as the builder) • mbclean = hide HUD/menus, only the 3D view
const MBCAM=(new URLSearchParams(location.search).get('mbcam')||'').split(',').map(Number);
let mbcamDone=MBCAM.length!==5||MBCAM.some(v=>!Number.isFinite(v));
if(/[?&]mbclean=1(&|$)/.test(location.search)){const st=document.createElement('style');st.textContent='body>*:not(#gl){display:none!important}';document.head.appendChild(st);}   // own <style>: html class gets reset elsewhere
function devMbCam(){if(mbcamDone||!devOn())return;mbcamDone=true;devFcToggle(true);const F=DEV.fc;F.x=MBCAM[0];F.y=MBCAM[1];F.z=MBCAM[2];yaw=MBCAM[3];pitch=MBCAM[4];}
function devFcToggle(on){
  const F=DEV.fc;on=on===undefined?!F.on:!!on;if(on===F.on)return;
  F.on=on;DEV.k={};if(on&&DEV.orb)DEV.orb.on=false;
  if(on){F.x=cam.position.x;F.y=cam.position.y;F.z=cam.position.z;INPUT.u=INPUT.d=INPUT.l=INPUT.r=INPUT.fire=INPUT.sh=INPUT.jh=INPUT.ch=INPUT.dh=0;
    toast('🎥 กล้องอิสระ: WASD บิน • Space/Ctrl ขึ้นลง • Shift เร็ว • ล้อเมาส์ = ความเร็ว • F3 ออก');}
  else CAM_TRACK.has=false;
}
function devFcCam(dt){
  const F=DEV.fc,k=DEV.k,cp=Math.cos(pitch),fx=Math.cos(yaw)*cp,fy=-Math.sin(pitch),fz=Math.sin(yaw)*cp;
  const mv=(k.KeyW||k.ArrowUp?1:0)-(k.KeyS||k.ArrowDown?1:0),st=(k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0),ud=(k.Space?1:0)-(k.ControlLeft?1:0),sp=F.spd*(k.ShiftLeft?3:1)*Math.min(dt,0.1);
  F.x+=(fx*mv-Math.sin(yaw)*st)*sp;F.y+=(fy*mv+ud)*sp;F.z+=(fz*mv+Math.cos(yaw)*st)*sp;
  cam.position.set(F.x,F.y,F.z);cam.lookAt(F.x+fx,F.y+fy,F.z+fz);
}
function devFcTop(){   // มองจากบนทั้งแมพ
  const F=DEV.fc;if(!F.on)devFcToggle(true);
  F.x=0;F.z=0;F.y=Math.max(MW,MH)*S3*0.62;pitch=1.5;yaw=-Math.PI/2;
}
function devFcMe(){const me=dvMe()||(DEV.spec&&VIEW.cur&&SPEC.id&&G.players[SPEC.id]);if(!me)return;const F=DEV.fc;if(!F.on)devFcToggle(true);F.x=tx(me.x);F.z=tz(me.y)+8;F.y=GY(me.x,me.y)+9;pitch=0.7;yaw=-Math.PI/2;}
addEventListener('keydown',e=>{
  if(!DEV.on)return;
  if(/^F(2|3|4|6|7|8|9)$/.test(e.code)){if(devOn()){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)devKey(e.code);}return;}
  if(DEV.spec&&devOn()&&!DEV.fc.on&&/^Key[REQ]$/.test(e.code)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)devSpecKey(e.code);return;}
  if(!(DEV.fc.on&&devOn()))return;
  DEV.k[e.code]=1;
  if(e.code==='Escape'||e.code==='Tab'||/^F\d+$/.test(e.code))return;
  e.preventDefault();e.stopImmediatePropagation();   // กล้องอิสระ: ปุ่มเกมไม่ถึงตัวละคร (ตัวไม่ขยับ/ไม่ร่าย)
},true);
addEventListener('keyup',e=>{delete DEV.k[e.code];},true);
addEventListener('mousedown',e=>{
  if(!(DEV.on&&DEV.fc.on&&devOn())||(e.target.closest&&e.target.closest('#devPanel,#devBtn')))return;
  if(!locked){try{cvEl().requestPointerLock();}catch(err){}}
  e.stopImmediatePropagation();
},true);
addEventListener('wheel',e=>{if(DEV.on&&DEV.fc.on&&devOn()&&!(e.target.closest&&e.target.closest('#devPanel'))){DEV.fc.spd=clamp(DEV.fc.spd*Math.exp(-e.deltaY*0.0015),3,600);}},{passive:true,capture:true});
function devKey(c){
  const C=DEV.cfg;
  if(c==='F2')devF2();
  else if(c==='F3')devFcToggle();
  else if(c==='F4'){C.pause=C.pause?0:1;toast(C.pause?'⏸ หยุดโลก (F4 เล่นต่อ)':'▶ เล่นต่อ');}
  else if(c==='F6'){devTp(INPUT.gx,INPUT.gy);}
  else if(c==='F7')devCopyAim();
  else if(c==='F9')devMount();
  else if(c==='F8'){const L=[1,0.5,0.25,2];C.ts=L[(L.indexOf(C.ts)+1)%L.length];devSave();toast('⏱ ความเร็วโลก ×'+C.ts);}
}
// mount/dismount the broom now (turns the broom on for modes that ban it)
function devMount(){
  const p=dvMe();if(!p||!p.alive||p.wfo)return;
  DEV.cfg.broom=1;devSave();p.fly=!p.fly;p.flyCd=0.8;
  if(p.fly){p.vz=7;p.shieldOn=false;p.dash=0;emit({k:'mount',x:p.x,y:p.y,h:p.z,id:p.id});}
  else emit({k:'dismount',x:p.x,y:p.y,h:p.z,id:p.id});
  toast(p.fly?'🧹 บนไม้กวาด (F9 ลง)':'🧹 ลงจากไม้กวาด');
}
// bots needed per mode so every rule has opponents/teammates (bots may only stand still in quid/race/imp)
const DEV_BOTS={coop:1,train:0,duel:1,ffa:3,tdm:5,quid:3,race:2,br:3,imp:3,siege:5};
function devStartMode(mode,withBots){
  const me=dvMe();if(!me||!MODES[mode])return;
  DEV.solo=1;DEV.endNow=0;
  try{
    hostToLobby();removeBots(()=>true);
    G.mode=mode;me.lteam=0;
    if(withBots)for(let i=0;i<(DEV_BOTS[mode]||0);i++)if(!lobbyBotAdd(DEV.bp,DEV.bl,1))break;
    hostStart();
  }finally{DEV.solo=0;}
  DEV.key='';
  if(G.ph==='lobby')toast('เริ่มโหมด '+mode+' ไม่สำเร็จ');
  else{toast('▶ '+MODES[mode].name+(withBots?' + บอท':' (เล่นคนเดียว)'));}
}
// ---- Spectator (user 2026-11-20): watch a full bot match — host steps out, bots fill every slot (6v6 in tdm/siege) ----
// follow cam = a bot's over-shoulder view like a player (L/R click = next/prev bot, R = turn with the bot / with the mouse) • F3 = free cam
DEV.spec=0;DEV.specP=null;DEV.specG=null;DEV.specLock=1;DEV.sfill=0;
function devSpecStart(mode){
  const me=dvMe();if(!me||!MODES[mode])return;
  DEV.solo=1;DEV.endNow=0;
  try{
    hostToLobby();removeBots(()=>true);G.mode=mode;
    DEV.specP=me;DEV.specG=G;delete G.players[NET.myId];G.order=G.order.filter(id=>id!==NET.myId);
    const M=MODES[mode],cap=Math.min(ROOM_MAX,M.max||6,M.team?(M.tmax||3)*2:99);
    DEV.sfill=1;try{for(let i=0;i<cap;i++)if(!lobbyBotAdd(DEV.bp,DEV.bl,1))break;}finally{DEV.sfill=0;}
    hostStart();
  }finally{DEV.solo=0;}
  DEV.key='';
  if(G.ph==='lobby'){devSpecRestore();broadcastLobby();toast('เริ่มโหมดผู้ชมไม่สำเร็จ');return;}
  DEV.spec=1;SPEC.id=null;CAM_TRACK.has=false;if(DEV.fc.on)devFcToggle(false);
  toast('👁 โหมดผู้ชม: คลิกซ้าย/ขวา = เปลี่ยนบอท • R = กล้องหันตามบอท/หมุนเอง • F3 = กล้องอิสระ • F2 = เมนู');
}
// put the host back into the room (hostToLobby calls this) — only into the same room it left
function devSpecRestore(){
  const p=DEV.specP,g=DEV.specG;DEV.spec=0;DEV.specP=DEV.specG=null;
  if(!p||!G||G!==g||G.players[NET.myId])return;
  G.players[NET.myId]=p;if(!G.order.includes(NET.myId))G.order.unshift(NET.myId);
  while(plist().length>modeCap()){const L=lobbyBots(),b=L.filter(q=>q.lteam===p.lteam).pop()||L.pop();if(!b)break;hostRemove(b.id);}   // room was full of bots: make space for the host
}
function devSpecStop(){const m=G.mode;hostToLobby();devStartMode(MODES[m]?m:'tdm',!!DEV.cfg.sbots);}   // hostToLobby puts the host back first
// follow cam: turn the camera with the bot (as if looking through its eyes); off = mouse orbits freely
function devSpecAim(t,dt){
  if(!(DEV.spec&&DEV.specLock&&devOn())||DEV.fc.on||!t||t.a===undefined)return;
  const k=1-Math.exp(-7*dt);yaw=lerpAng(yaw,t.a,k);pitch+=(0.28-pitch)*k;
}
function devSpecKey(c){
  if(c==='KeyR'){DEV.specLock^=1;toast(DEV.specLock?'🎯 กล้องหันตามบอท':'🖱 หมุนกล้องเอง');}
  else if(c==='KeyE'||c==='KeyQ')specCycle(c==='KeyE'?1:-1);
}
function devCell(x,y){return MAPID==='fcs'?'ช่อง ('+Math.floor(x/FCS_C)+','+Math.floor(y/FCS_C)+')':'';}
function devCopyAim(){
  const x=INPUT.gx,y=INPUT.gy;if(!(x>=0))return toast('ไม่มีจุดที่เล็ง');
  const s=Math.round(x)+','+Math.round(y)+' '+devCell(x,y);
  try{navigator.clipboard.writeText(s);}catch(e){}
  toast('📍 '+s);
}
// ---- คำสั่งโฮสต์ ----
function devTp(x,y,p){
  p=p||dvMe();if(!p||!(x>=0))return;
  p.x=clamp(x,60,MW-60);p.y=clamp(y,60,MH-60);p.z=0;p.vz=0;collideWorld(p,PR);p.inv=Math.max(p.inv,1);emit({k:'revive',x:p.x,y:p.y});
}
function devSgPhase(n){
  const S=G.sg,F=sgF();if(!S)return;
  n=clamp(n|0,1,F.n);S.ph=n;SGPH=n;S.tr=0;SGTR=0;S.ot=false;S.otT=0;S.prep=0;S.win=-1;
  S.hp=S.hp.map((v,i)=>i<n-1?0:SGV.coreHp);
  AREA=mapArea(G.map,G.mode);sgWallsApply();
  for(const p of plist())sgStop(p);
  let i=0;
  for(const p of plist()){if(p.team!==0&&p.team!==1)continue;const s=sgSpawn(p.team,n),a=i*1.047,rr=i%6?80:0;i++;
    devTp(s.x+Math.cos(a)*rr,s.y+Math.sin(a)*rr,p);if(!p.alive)p.respawn=Math.min(p.respawn,0.5);}
  banner('🛠 Dev: ไปเฟส '+n,2);
}
function devBotAdd(t){
  const ok=PATHS.map((P,i)=>i).filter(i=>!PATHS[i].off);
  for(let i=0;i<DEV.bn;i++){
    const P=DEV.bp>=0?DEV.bp:ok[Math.floor(Math.random()*ok.length)];
    const s=G.mode==='siege'&&G.sg?sgSpawn(t):{x:INPUT.gx>=0?INPUT.gx:MW/2,y:INPUT.gy>=0?INPUT.gy:MH/2};
    const p=spawnBot(P,DEV.bl,s.x,s.y,null,NET.myId);if(!p){toast('บอทเต็มแล้ว (สูงสุด '+BOT_MAX+')');break;}
    if(G.mode==='siege'){p.lteam=p.team=p.ai.team=t;}
  }
}
function devAct(a,k,v){
  const me=dvMe(),C=DEV.cfg;if(!me&&!DEV.spec)return;
  if(!me&&/^(kit|creator|hp|rev|team|mount|tpfc|tpaim|tp|botadd)$/.test(a))return;   // spectator has no own player
  if(a==='kit'){const s=parseKit(String(v)).str;setKit(me,s);myKit=s;store('wd_kit2',s);broadcastLobby();toast('🪄 เปลี่ยนเป็น '+PATHS[parseKit(s).path].n);}
  else if(a==='creator'){devToggle(false);openCreator(false,3);}
  else if(a==='tog'){C[k]=C[k]?0:1;devSave();}
  else if(a==='set'){C[k]=+v;devSave();}
  else if(a==='hp'){me.hp=me.maxHp;}
  else if(a==='rev'){if(!me.alive)me.respawn=0;}
  else if(a==='team'&&G.mode==='siege'&&G.sg){me.team=me.lteam=me.team^1;const s=sgSpawn(me.team);devTp(s.x,s.y);toast('🔁 ตอนนี้ฝั่ง'+SG_TEAM[me.team]);}
  else if(a==='fc')devFcToggle();
  else if(a==='fctop')devFcTop();
  else if(a==='fcme')devFcMe();
  else if(a==='tpfc'){devTp(cam.position.x/S3+MW/2,cam.position.z/S3+MH/2);}
  else if(a==='tpaim')devTp(INPUT.gx,INPUT.gy);
  else if(a==='tp'){const q=String(v).split(',').map(Number);devTp(q[0],q[1]);}
  else if(a==='ph')devSgPhase(+v);
  else if(a==='skip'&&G.sg){G.sg.prep=0;}
  else if(a==='core0'&&G.sg){G.sg.prep=0;G.sg.hp[G.sg.ph-1]=0;}
  else if(a==='corefull'&&G.sg){G.sg.hp[G.sg.ph-1]=SGV.coreHp;}
  else if(a==='time'&&G.sg){G.timer=+v>0?G.timer+ +v:5;}
  else if(a==='win'&&G.sg){sgEnd(+v);}
  else if(a==='walls'&&G.sg){G.sg.bw=sgF().bw.map(b=>b.k==='gate'?-1:(+v?SGV.wallHp:0));sgWallsApply();}
  else if(a==='mode')devStartMode(String(v),!!C.sbots);
  else if(a==='spec')devSpecStart(String(v));
  else if(a==='specstop')devSpecStop();
  else if(a==='slock')DEV.specLock^=1;
  else if(a==='sfol'){if(DEV.fc.on)devFcToggle(false);SPEC.id=String(v);CAM_TRACK.has=false;}
  else if(a==='mount')devMount();
  else if(a==='endnow'){DEV.endNow=1;try{endMatch();}finally{DEV.endNow=0;}}
  else if(a==='bp')DEV.bp=+v;
  else if(a==='bl')DEV.bl=+v;
  else if(a==='bn')DEV.bn=+v;
  else if(a==='botadd')devBotAdd(+v);
  else if(a==='botclr')removeBots();
  else if(a==='copy')devCopyAim();
  else if(a==='dfix')devDestroy(true,String(v));
  else if(a==='dbrk')devDestroy(false,String(v));
  DEV.key='';devRender();
}

// ---- Destruction debug (user 2026-11-19): repair / collapse breakables at the aim point, a whole building, or the whole map ----
// Covers: cover pieces + bridge parapet (BRK), breakable panels / houses (PNL cells), fences (EFS sections), bridge shell chunks (BSKN), props (PROPS).
// part = everything within DEVD_R of the aim point • whole = the nearest structure (house / fence line / bridge / single cover piece)
const DEVD_R=60;
function devBrkFix(g,fix){if(fix){g.hp=g.max;if(g.st)brkApply(g,0);}else if(g.st<3)hitBrk(g,1e6,g.x,g.y);}
function devPnlFix(p,fix,cells){   // breakable panel: repair all / break all or only `cells`
  if(fix){p.hp.fill(p.max);p.st.fill(0);p.burnT=0;p.ver++;return;}
  for(let k=0;k<p.st.length;k++)if(!cells||cells.has(k))pnlHit(p,k,1e9,'blast',p.x,p.y,true);
}
function devPropFix(o,fix){const D=PROPDEF[o.k];if(!D||!D.hp)return;if(fix){o.st=0;o.hp=D.hp;}else hitProp(o,1e6,null);}
function devSkinFix(fix,x,y,all){   // bridge shell chunks (BSKN.C): repair or knock off — all, or within 1.5x DEVD_R of the aim point
  if(!BSKN.B)return 0;const R=all?null:DEVD_R*1.5;
  if(fix){const n=bskRepair(x,y,R);if(all&&typeof fcsShellClear==='function')fcsShellClear();return n;}
  let n=0;for(const c of BSKN.C)if(c.st<3&&(all||Math.hypot(c.px-x,c.py-y)<R)){bskHit(c,1e9,x,y);n++;}return n;
}
function devDestroy(fix,scope){
  if(!G)return;const x=INPUT.gx,y=INPUT.gy,R=DEVD_R;let n=0;
  const parG=g=>g.d&&g.d.fp!=null;
  if(scope==='map'){
    for(const g of BRK){devBrkFix(g,fix);n++;}
    for(const p of PNL){devPnlFix(p,fix);n++;}
    for(const s of EFS.S){fix?efsRepair(s):(!s.br&&efsBreak(s));n++;}
    for(const o of PROPS){devPropFix(o,fix);n++;}
    n+=devSkinFix(fix,x,y,true);
    toast((fix?'🔧 ซ่อมทั้งแมพ':'💥 พังทั้งแมพ')+' ('+n+')');return;}
  if(scope==='part'){
    for(const g of BRK)if(g.cs.some(o=>Math.hypot(o.x-x,o.y-y)<R+o.r)){devBrkFix(g,fix);n++;}
    for(const p of PNL){const za=pnGT(x,y)+1,cells=new Set();for(let k=0;k<p.st.length;k++){const q=pnCellPos(p,k);if(Math.hypot(q[0]-x,q[1]-y,(q[2]-za)*20)<R)cells.add(k);}
      if(cells.size){fix?devPnlFix(p,true):devPnlFix(p,false,cells);n+=cells.size;}}
    for(const s of EFS.S)if(efsDist(s,x,y)<R){fix?efsRepair(s):(!s.br&&efsBreak(s));n++;}
    for(const o of PROPS)if(Math.hypot(o.x-x,o.y-y)<R+o.r){devPropFix(o,fix);n++;}
    if(BSKN.B&&BSKN.B.at(x,y,R))n+=devSkinFix(fix,x,y,false);
    toast((fix?'🔧 ซ่อมตรงที่เล็ง':'💥 พังตรงที่เล็ง')+' ('+n+')');return;}
  // whole structure: pick the nearest candidate
  let best=null,bd=R*4;const cand=(d,k,o)=>{if(d<bd){bd=d;best={k,o};}};
  for(const p of PNL){const [u,v]=pnLoc(p,x,y);cand(Math.hypot(Math.max(0,Math.abs(u)-p.hl),Math.max(0,Math.abs(v)-p.ht)),'bld',p);}   // nearest panel → its whole group (house)
  for(const g of BRK)if(!parG(g))for(const o of g.cs)cand(Math.max(0,Math.hypot(o.x-x,o.y-y)-o.r),'brk',g);
  for(const s of EFS.S)cand(efsDist(s,x,y),'fence',s.f);
  if(BSKN.B&&BSKN.B.at(x,y,R*2))cand(0,'bridge',null);
  for(const o of PROPS)cand(Math.max(0,Math.hypot(o.x-x,o.y-y)-o.r),'prop',o);
  if(!best){toast('ไม่เจอสิ่งก่อสร้างใกล้จุดเล็ง');return;}
  const {k,o}=best;
  if(k==='bld'){for(const p of PNL)if(p===o||(o.g!=null&&p.g===o.g))devPnlFix(p,fix);}
  else if(k==='brk')devBrkFix(o,fix);
  else if(k==='prop')devPropFix(o,fix);
  else if(k==='fence'){for(const s of EFS.S)if(s.f===o){if(fix)efsRepair(s);else if(!s.br)efsBreak(s);}}
  else if(k==='bridge'){for(const g of BRK)if(parG(g))devBrkFix(g,fix);devSkinFix(fix,x,y,true);}
  toast((fix?'🔧 ซ่อมทั้งหลัง: ':'💥 พังทั้งหลัง: ')+({bld:'บ้าน',brk:'ของบัง',prop:'ของในฉาก',fence:'รั้ว',bridge:'สะพาน'}[k]));
}
// ---- ภาพซ้อนไว้ดูแมพ: กล่องชน (OBS) + วงเขตยึด/จุดเกิดปลอดภัย ----
const _dvCyl=new THREE.CylinderGeometry(1,1,1,10,1,true);
const _dvMat=new THREE.MeshBasicMaterial({color:0xff4040,wireframe:true,transparent:true,opacity:0.6,depthTest:false});
function devOverlay(){
  const C=DEV.cfg,want=devOn()&&(C.col||C.zon);
  if(!want){if(DEV.ov){scene.remove(DEV.ov);DEV.ov=null;DEV.ovK='';}return;}
  const solid=C.col?OBS.filter(o=>(o.hgt||0)>0):[],F=MAPID==='fcs'?sgF():null,key=[MAPID,C.col,C.zon,solid.length,solid.reduce((s,o)=>s+o.hgt,0)].join('|');
  if(key===DEV.ovK&&DEV.ov)return;
  if(DEV.ov)scene.remove(DEV.ov);
  const g=new THREE.Group();g.renderOrder=999;
  if(solid.length){
    const im=new THREE.InstancedMesh(_dvCyl,_dvMat,solid.length),m=new THREE.Matrix4(),q=new THREE.Quaternion(),pos=new THREE.Vector3(),sc=new THREE.Vector3();
    solid.forEach((o,i)=>{const h=Math.min(o.hgt,9),r=Math.max(0.2,o.r*S3),L=o.hx===undefined?0:Math.hypot(o.hx,o.hy)*S3;q.setFromAxisAngle(_dvY,o.hx===undefined?0:-Math.atan2(o.hy,o.hx));pos.set(tx(o.x),GY(o.x,o.y)+h/2,tz(o.y));sc.set(r+L,h,r);m.compose(pos,q,sc);im.setMatrixAt(i,m);});   // capsule = stretched along its axis
    im.frustumCulled=false;g.add(im);
  }
  if(C.zon&&F){
    const ring=(x,y,r,col)=>{const mm=new THREE.Mesh(new THREE.RingGeometry(Math.max(0.1,r*S3-0.18),r*S3,64),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.85,side:THREE.DoubleSide,depthTest:false}));
      mm.rotation.x=-Math.PI/2;mm.position.set(tx(x),GY(x,y)+0.25,tz(y));g.add(mm);};
    F.cores.forEach(k=>{if(k)ring(k.x,k.y,SGV.zoneR,0x39e6ff);});
    for(const t of ['A','B'])for(const ph in F.sp[t]){const s=F.sp[t][ph];if(s)ring(s.x,s.y,SG_SPR,t==='A'?0xff6a5a:0x5a8aff);}
  }
  scene.add(g);DEV.ov=g;DEV.ovK=key;
}
// ---- 2D overlay map: spawn zones + capture zones + players (click = warp) ----
const _dvMap=document.createElement('canvas');_dvMap.id='devMap';_dvMap.className='hidden';
_dvMap.style.cssText='position:fixed;left:12px;bottom:12px;z-index:60;border:1px solid #4a5a7a;background:#0b1020cc;border-radius:6px;cursor:crosshair';
document.body.appendChild(_dvMap);
_dvMap.addEventListener('click',e=>{const r=_dvMap.getBoundingClientRect();devTp((e.clientX-r.left)/r.width*MW,(e.clientY-r.top)/r.height*MH);});
const _dvY=new THREE.Vector3(0,1,0);
function devMapDraw(){
  const W=Math.min(360,innerWidth*0.4),H=Math.round(W*MH/MW);
  if(_dvMap.width!==W||_dvMap.height!==H){_dvMap.width=W;_dvMap.height=H;}
  const c=_dvMap.getContext('2d'),k=W/MW;c.clearRect(0,0,W,H);
  c.fillStyle='#3a4258';c.strokeStyle='#3a4258';c.lineCap='round';for(const o of OBS){if(!(o.hgt>0))continue;if(o.hx!==undefined){c.lineWidth=Math.max(2,o.r*k*2);c.beginPath();c.moveTo((o.x-o.hx)*k,(o.y-o.hy)*k);c.lineTo((o.x+o.hx)*k,(o.y+o.hy)*k);c.stroke();continue;}c.fillRect(o.x*k-1,o.y*k-1,Math.max(2,o.r*k*2),Math.max(2,o.r*k*2));}
  const ring=(x,y,r,col,txt)=>{c.strokeStyle=col;c.fillStyle=col+'33';c.lineWidth=2;c.beginPath();c.arc(x*k,y*k,Math.max(3,r*k),0,7);c.fill();c.stroke();
    if(txt){c.fillStyle='#fff';c.font='10px sans-serif';c.textAlign='center';c.fillText(txt,x*k,y*k+3);}};
  if(MAPID==='fcs'){const F=sgF();
    F.cores.forEach((q,i)=>{if(q)ring(q.x,q.y,SGV.zoneR,'#39e6ff','C'+(i+1));});
    for(const t of ['A','B'])for(const ph in F.sp[t]){const q=F.sp[t][ph];if(q)ring(q.x,q.y,SG_SPR,t==='A'?'#ff6a5a':'#5a8aff',(t==='A'?'⚔':'🛡')+ph);}}
  for(const p of plist()){if(!p.alive)continue;c.fillStyle=p.id===NET.myId?'#fff':(p.team===0?'#4da3ff':p.team===1?'#ff5a5a':'#ffd24d');
    c.beginPath();c.arc(p.x*k,p.y*k,p.id===NET.myId?4:2.5,0,7);c.fill();}
}
// UI (panel, orbit cam, video recording) lives in js/78-dev-ui.js
