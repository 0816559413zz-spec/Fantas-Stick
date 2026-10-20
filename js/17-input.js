// =====================================================================
//  การควบคุม
// =====================================================================
const INPUT=emptyInput();
let mouseX=0,mouseY=0,showBoard=false;
const SET_DEF={sens:100,inv:0,master:90,sfx:100,music:80,fov:62,fps:0,dmg:1,shake:1,hitm:1,dirm:1,mini:1,names:1,xh:0,xhc:0,xhs:100,keys:{}};
const SET=Object.assign({},SET_DEF,(()=>{try{return JSON.parse(store('wd_set')||'{}');}catch(e){return {};}})());
// ปุ่มกดตั้งเองได้ (หน้าตั้งค่า > ปุ่มกด) — KMAP = ปุ่มค้าง / PMAP = ปุ่มกดทีละครั้ง
const KEYACT=[['up','เดินหน้า','KeyW'],['down','ถอยหลัง','KeyS'],['left','ไปซ้าย','KeyA'],['right','ไปขวา','KeyD'],['dash','พุ่ง/หลบ','ShiftLeft'],['jump','กระโดด / บินขึ้น','Space'],['q','คาถา 1','KeyQ'],['e','คาถา 2','KeyE'],['r','คาถา 3','KeyR'],['f','คาถา 4','KeyF'],['ult','เวทโบราณ','KeyX'],['mode','สลับโหมด (สายน้ำแข็ง)','KeyV'],['broom','ไม้กวาด','KeyB'],['use','ใช้ของ / โต้ตอบ','KeyG'],['down2','บินลง','KeyC'],['talk','พูดไมค์','KeyT'],['score','ตารางคะแนน','Tab'],['music','เปิด/ปิดเพลง','KeyM'],['test','เมนูทดลอง (ห้องฝึก)','KeyP']];
const KMAP={},PMAP={};let KEYS={};
function rebuildKeys(){
  KEYS={};for(const [a,,d] of KEYACT)KEYS[a]=(SET.keys&&SET.keys[a])||d;
  for(const o of [KMAP,PMAP])for(const k in o)delete o[k];
  const K=(code,v)=>{KMAP[code]=v;},Pp=(code,v)=>{PMAP[code]=v;};
  K(KEYS.up,'u');K(KEYS.down,'d');K(KEYS.left,'l');K(KEYS.right,'r');K('ArrowUp','u');K('ArrowDown','d');K('ArrowLeft','l');K('ArrowRight','r');
  K(KEYS.jump,'jh');K(KEYS.down2,'ch');K('ControlLeft','ch');K(KEYS.dash,'dh');if(KEYS.dash==='ShiftLeft')K('ShiftRight','dh');
  K(KEYS.q,'hq');K(KEYS.e,'he');K(KEYS.r,'hr');K(KEYS.f,'hf');   // ปุ่มสกิลกดค้าง (Terra Auger ชาร์จ)
  Pp(KEYS.q,'q');Pp(KEYS.e,'e');Pp(KEYS.r,'r');Pp(KEYS.f,'f');Pp(KEYS.dash,'sp');if(KEYS.dash==='ShiftLeft')Pp('ShiftRight','sp');Pp(KEYS.jump,'jp');Pp(KEYS.ult,'x');Pp(KEYS.broom,'b');Pp(KEYS.use,'g');Pp(KEYS.mode,'v');
}
function keyName(c){return ({Space:'Space',ShiftLeft:'Shift',ShiftRight:'Shift R',ControlLeft:'Ctrl',Tab:'Tab',Escape:'Esc'})[c]||c.replace(/^Key|^Digit/,'');}
rebuildKeys();
let _rebind=null;
addEventListener('keydown',e=>{
  if(_rebind){e.preventDefault();if(e.code!=='Escape'){SET.keys=Object.assign({},SET.keys,{[_rebind]:e.code});saveSet();rebuildKeys();}_rebind=null;renderSettings();return;}
  if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;
  if(e.code===KEYS.score){e.preventDefault();showBoard=true;return;}
  if(e.code==='Space'||e.code==='Tab')e.preventDefault();
  if(screen==='game'&&crOpen)return;   // หน้าเลือกคาถาเปิดอยู่กลางเกม (ห้องฝึก) → ไม่ส่งปุ่มเข้าเกม
  if(e.code===KEYS.talk)VOICE.talking=true;
  if(e.repeat)return;
  if(e.code===KEYS.test&&screen==='game'&&VIEW.cur&&VIEW.cur.mode==='train'){trToggle();return;}
  if(KMAP[e.code])INPUT[KMAP[e.code]]=1;
  if(PMAP[e.code]&&screen==='game'){const a=PMAP[e.code];if(placeKey(a))return;INPUT.c[a]++;}
  if(/^Digit[123]$/.test(e.code)&&!$('#buff').classList.contains('hidden'))choosePick(+e.code[5]-1);
  if(e.code===KEYS.music){ac();toggleMusic();}
  if(e.code==='KeyN')myNext();
});
addEventListener('keyup',e=>{
  if(e.code===KEYS.score)showBoard=false;
  if(e.code===KEYS.talk)VOICE.talking=false;
  if(KMAP[e.code])INPUT[KMAP[e.code]]=0;
});
addEventListener('blur',()=>{INPUT.hq=INPUT.he=INPUT.hr=INPUT.hf=0;INPUT.u=INPUT.d=INPUT.l=INPUT.r=INPUT.fire=INPUT.sh=INPUT.jh=INPUT.ch=INPUT.dh=0;VOICE.talking=false;showBoard=false;});
addEventListener('mousemove',e=>{
  mouseX=e.clientX;mouseY=e.clientY;
  if(locked&&screen==='game'){const v=VIEW.cur,me=v&&v.P&&v.P.find(q=>q.id===NET.myId),k=(me&&me.bm===2?0.55:1)*(1-0.25*AIMZ);if(!(me&&me.sm&&(me.sm[3]&16))){yaw+=e.movementX*SENS*k;pitch=clamp(pitch+e.movementY*SENS*k*(SET.inv?-1:1),-0.25,1.15);}}
});
cvEl().addEventListener('mousedown',e=>{
  if(screen!=='game')return;
  if(!locked){try{cvEl().requestPointerLock();}catch(err){}return;}
  if(PLACE.slot>=0){if(e.button===0){INPUT.c['qerf'[PLACE.slot]]++;}PLACE.slot=-1;return;}
  if(e.button===0)INPUT.fire=1;if(e.button===2)INPUT.sh=1;
});
addEventListener('mouseup',e=>{if(e.button===0)INPUT.fire=0;if(e.button===2)INPUT.sh=0;});
addEventListener('contextmenu',e=>{if(screen==='game')e.preventDefault();});
function cvEl(){return document.getElementById('cv');}
