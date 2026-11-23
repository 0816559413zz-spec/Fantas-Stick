// ---------- Photo mode (user 2026-11-23): promo shots of maps ----------
// Dev panel (F2) column '📸 ถ่ายรูป': saved camera spots (free cam F3) + look sliders (shadow, sun, fog, light, colour) + high-res PNG.
// Sliders are multipliers / offsets on the map's own values (1 / 0 = unchanged), saved per map in DEV.cfg.ph[map].
// Mode off (or leaving the map) = everything restored. Capture: renders at ×scale, PNG → photos/<map>_<time>.png via
// tools/serve.py (/api/photo), else browser download. Called each frame from frame() (js/37) after the camera is placed.
const PH={on:false,base:null,map:'',busy:false,note:''};
// key, label, min, max, step, default, unit
const PH_F=[['shR','☀ ระยะเงา',0.5,6,0.05,1,'×'],['shS','☀ เงานุ่ม',0,4,0.05,1,'×'],['sunA','☀ หมุนดวงอาทิตย์',-180,180,1,0,'°'],['sunE','☀ ความสูงดวงอาทิตย์',-40,40,1,0,'°'],
  ['sunK','☀ ความแรงแสงหลัก',0,3,0.05,1,'×'],['skyK','🌤 แสงฟ้า/รอบตัว',0,3,0.05,1,'×'],
  ['fogN','🌫 หมอก • เริ่มที่ระยะ',0.2,5,0.05,1,'×'],['fogF','🌫 หมอก • ทึบสุดที่ระยะ',0.2,5,0.05,1,'×'],['haze','🌫 หมอกตามระยะ',0,3,0.05,1,'×'],['rays','✨ ลำแสง',0,4,0.05,1,'×'],
  ['exp','🎞 ความสว่าง',0.4,2.5,0.01,1,'×'],['con','🎞 คอนทราสต์',0.6,1.6,0.01,1,'×'],['sat','🎞 สีสด',0,2,0.01,1,'×'],['vig','🎞 ขอบมืด',0,3,0.05,1,'×'],['blm','🎞 แสงฟุ้ง',0,3,0.05,1,'×'],
  ['fov','🎥 มุมกล้อง (ซูม)',0.3,1.6,0.01,1,'×']];
function phStore(){const C=DEV.cfg;if(!C.ph||typeof C.ph!=='object')C.ph={};const m=builtMap||'-';
  if(!C.ph[m])C.ph[m]={s:{},pts:[]};const P=C.ph[m];for(const f of PH_F)if(P.s[f[0]]===undefined)P.s[f[0]]=f[5];return P;}
function phBase(){return {shR:SHD.r,shRH:SHD.rHigh,pcss:PCSS.size,ldir:LDIR.clone(),sun:moonL.intensity,hemi:hemi.intensity,amb:LOOK.amb?LOOK.amb.intensity:null,
  fogN:scene.fog?scene.fog.near:null,fogF:scene.fog?scene.fog.far:null,haze:GFX.haze,ray:AOU.uRay.value||(LOOK.cur&&LOOK.P[LOOK.cur]?LOOK.P[LOOK.cur].rays:0.3),
  exp:gl.toneMappingExposure,con:GRADEU.uCon.value,sat:GRADEU.uSat.value,vig:GRADEU.uVig.value,ms:moonL.shadow.mapSize.x};}
function phShadowSize(n){if(moonL.shadow.mapSize.x===n)return;moonL.shadow.mapSize.set(n,n);if(moonL.shadow.map){moonL.shadow.map.dispose();moonL.shadow.map=null;}gl.shadowMap.needsUpdate=true;}
function phOn(){if(PH.on)return;PH.base=phBase();PH.map=builtMap;PH.on=true;phStore();}
function phOff(){if(!PH.on)return;PH.on=false;const B=PH.base;PH.base=null;if(!B)return;
  SHD.r=B.shR;SHD.rHigh=B.shRH;PCSS.size=B.pcss;phShadowSize(B.ms);
  if(PH.map!==builtMap)return;   // map changed: its own lights are already fresh
  LDIR.copy(B.ldir);moonL.intensity=B.sun;hemi.intensity=B.hemi;if(LOOK.amb&&B.amb!==null)LOOK.amb.intensity=B.amb;
  if(scene.fog&&B.fogN!==null){scene.fog.near=B.fogN;scene.fog.far=B.fogF;}
  GFX.haze=B.haze;lookRays();gl.toneMappingExposure=B.exp;GRADEU.uCon.value=B.con;GRADEU.uSat.value=B.sat;GRADEU.uVig.value=B.vig;
  cam.fov=SET.fov;cam.updateProjectionMatrix();}
// every frame while on (other systems reset some of these per frame, e.g. bloom strength in js/37)
function photoFrame(){
  if(!PH.on)return;if(!devOn()||PH.map!==builtMap){phOff();DEV.key='';return;}
  const B=PH.base,S=phStore().s;
  SHD.r=B.shR*S.shR;SHD.rHigh=B.shRH*S.shR;PCSS.size=B.pcss*S.shS;
  const d=B.ldir,az=Math.atan2(d.z,d.x)+S.sunA*Math.PI/180,el=Math.max(0.04,Math.min(1.5,Math.asin(Math.max(-1,Math.min(1,d.y)))+S.sunE*Math.PI/180)),c=Math.cos(el);
  LDIR.set(Math.cos(az)*c,Math.sin(el),Math.sin(az)*c);
  moonL.intensity=B.sun*S.sunK;hemi.intensity=B.hemi*S.skyK;if(LOOK.amb&&B.amb!==null)LOOK.amb.intensity=B.amb*S.skyK;
  if(scene.fog&&B.fogN!==null){scene.fog.near=B.fogN*S.fogN;scene.fog.far=Math.max(scene.fog.near+1,B.fogF*S.fogF);}
  GFX.haze=B.haze*S.haze;AOU.uRay.value=B.ray*S.rays;
  gl.toneMappingExposure=B.exp*S.exp;GRADEU.uCon.value=B.con*S.con;GRADEU.uSat.value=B.sat*S.sat;GRADEU.uVig.value=B.vig*S.vig;bloom.strength*=S.blm;
  if(S.fov!==1){cam.fov=SET.fov*S.fov;cam.updateProjectionMatrix();}
  shakeA=0;
}
// right before the scene is drawn (renderGame js/37): player sync sets visibility after photoFrame
PH.hid=[];
function photoPre(){if(!(PH.on&&phStore().s.hideMe))return;const o=PM3.get(NET.myId);if(!o)return;   // every part (cloak etc. are not under o.g)
  const ex=o.g&&o.g.userData.extra||[];   // cloth meshes live in the scene, listed here (js/49)
  for(const q of Object.values(o).concat(ex))if(q&&q.isObject3D&&q.visible){q.visible=false;PH.hid.push(q);}}
function photoPost(){for(const q of PH.hid)q.visible=true;PH.hid.length=0;}
// camera spots (free cam)
function phAdd(){if(!DEV.fc.on)devFcToggle(true);const F=DEV.fc;phStore().pts.push([+F.x.toFixed(2),+F.y.toFixed(2),+F.z.toFixed(2),+yaw.toFixed(4),+pitch.toFixed(4)]);devSave();}
function phGo(p){if(!DEV.fc.on)devFcToggle(true);const F=DEV.fc;F.x=p[0];F.y=p[1];F.z=p[2];yaw=p[3];pitch=p[4];}
// draw n frames ourselves (works with or without the game loop running; world is paused)
async function phWait(n){for(let i=0;i<n;i++){render(1/60,performance.now());await new Promise(r=>setTimeout(r,0));}}
async function phSave(url,name){
  for(const [api,dir] of [['photo','photos'],['shot','shots']])   // /api/shot = older tools/serve.py still running
    try{const r=await fetch('/api/'+api+'?name='+encodeURIComponent(name),{method:'POST',body:url});if(r.ok)return dir+'/'+name+'.png';}catch(e){}
  const a=document.createElement('a');a.href=url;a.download=name+'.png';a.click();return name+'.png (ดาวน์โหลด)';}
// spots = list of camera spots, null = current view
async function phShoot(spots){
  if(PH.busy)return;PH.busy=true;DEV.key='';
  const sc=+DEV.cfg.phScale||1,pr=gl.getPixelRatio(),C=DEV.cfg,wasPause=C.pause,out=[];
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace('T','-').slice(0,15);
  try{
    C.pause=1;gl.setPixelRatio(pr*sc);composer.setPixelRatio(pr*sc);
    const list=spots||[null];
    for(let i=0;i<list.length;i++){
      if(list[i])phGo(list[i]);PH.note='กำลังถ่าย '+(i+1)+'/'+list.length+' …';DEV.key='';
      await phWait(24);   // shadows / TAA settle at the new size
      render(0,performance.now());
      out.push(await phSave(gl.domElement.toDataURL('image/png'),(builtMap||'map')+'_'+stamp+(list.length>1?'_'+(i+1):'')));
    }
    PH.note='✓ '+out.join(' • ');
  }catch(e){PH.note='✗ '+e.message;}
  finally{gl.setPixelRatio(pr);composer.setPixelRatio(pr);C.pause=wasPause;PH.busy=false;DEV.key='';}
}
function photoCol(){
  const r=[dvTg('📸 โหมดถ่ายรูป',PH.on,undefined,'phon')];
  if(!PH.on){r.push('<div class="dvnote">เปิดแล้วจะปรับเงา / หมอก / แสง / สี ได้<br>จำมุมกล้อง แล้วถ่ายเป็น PNG ความละเอียดสูง<br>ปิด = ค่ากลับเหมือนเดิม</div>');return dvCol('photo','📸 ถ่ายรูป',r);}
  const P=phStore(),S=P.s;
  r.push(dvSub('มุมกล้อง (บินด้วยกล้องอิสระ F3)'),dvB('➕ จำมุมนี้','phadd'));
  P.pts.forEach((p,i)=>r.push('<div class="dch"><b'+dvA({d:'phgo',v:i})+'>📍 มุม '+(i+1)+'</b><b'+dvA({d:'phdel',v:i})+'>✕</b></div>'));
  r.push(dvSub('ถ่าย (หยุดโลกระหว่างถ่าย)'),dvCh('phsc','phScale',[[1,'×1'],[2,'×2'],[3,'×3']],+DEV.cfg.phScale||1),
    dvB(PH.busy?'⏳ กำลังถ่าย…':'📸 ถ่ายมุมนี้','phshot',undefined,PH.busy),P.pts.length?dvB('📸 ถ่ายทุกมุม ('+P.pts.length+')','phall',undefined,PH.busy):'',
    dvTg('🙈 ซ่อนตัวเรา',!!S.hideMe,undefined,'phhide'),dvSub('ความคมเงา'),dvCh('phms','',[[2048,'2K'],[4096,'4K'],[8192,'8K']],moonL.shadow.mapSize.x));
  for(const f of PH_F)r.push(dvSl(f[1],'ph.'+f[0],f[2],f[3],f[4],S[f[0]],f[6]));
  r.push(dvB('↺ ค่าเดิมทั้งหมด','phreset'));
  if(PH.note)r.push('<div class="dvnote">'+esc(PH.note)+'</div>');
  return dvCol('photo','📸 ถ่ายรูป',r);
}
function photoAct(a,k,v){
  const P=PH.on?phStore():null;
  if(a==='phon'){PH.on?phOff():phOn();}
  else if(!P)return;
  else if(a==='phadd')phAdd();
  else if(a==='phgo')phGo(P.pts[+v]);
  else if(a==='phdel'){P.pts.splice(+v,1);devSave();}
  else if(a==='phsc'){DEV.cfg.phScale=+v;devSave();}
  else if(a==='phshot')phShoot(null);
  else if(a==='phall')phShoot(P.pts.slice());
  else if(a==='phhide'){P.s.hideMe=P.s.hideMe?0:1;devSave();}
  else if(a==='phms')phShadowSize(+v);
  else if(a==='phreset'){P.s={hideMe:P.s.hideMe};phStore();phShadowSize(PH.base.ms);devSave();}
  DEV.key='';
}
function photoSet(k,v){if(!PH.on)return;phStore().s[k]=v;devSave();}
const photoKey=()=>[PH.on,PH.busy,PH.note,moonL.shadow.mapSize.x];
if(window.WD)Object.assign(window.WD,{PH,photoAct,photoSet,phShoot});
