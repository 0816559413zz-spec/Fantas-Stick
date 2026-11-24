// ---------- Dev Mode UI (user 2026-11-20): one floating window, many small columns (title + rows, toggle = ✓/✕) ----------
// drag by the title bar • resize from the bottom-right corner • opacity slider • game keeps running while it is open
// F2 = open (frees the mouse) → F2 again while playing = mouse to the menu → F2 while the mouse is on the menu = close • ` = mouse menu ↔ game
// also here: orbit camera (circles an anchor) + video recording (MediaRecorder → recordings/ via tools/serve.py, else browser download)
(function(){const D={orA:'bot',orR:12,orH:5,orS:20,recT:15,recHud:0,recFps:60,ui:null,cl:{}};for(const k in D)if(DEV.cfg[k]===undefined)DEV.cfg[k]=D[k];})();
if(!DEV.cfg.ui||typeof DEV.cfg.ui!=='object')DEV.cfg.ui={x:12,y:60,w:Math.min(1100,innerWidth-40),h:Math.min(560,innerHeight-90),op:0.78};
DEV.orb={on:false,ang:0,x:0,y:0,tid:null,has:0,cx:0,cy:0,cz:0};
DEV.auto=null;DEV.recLast='';DEV.free=0;

// ---- orbit camera ----
function devOrbPick(){   // anchor from the chosen mode
  const O=DEV.orb,C=DEV.cfg,me=dvMe();O.tid=null;O.has=0;
  if(C.orA==='bot'){
    if(DEV.spec&&SPEC.id)O.tid=SPEC.id;
    else{const ax=INPUT.gx>=0?INPUT.gx:me?me.x:MW/2,ay=INPUT.gy>=0?INPUT.gy:me?me.y:MH/2;let b=null,bd=1e18;
      for(const p of plist())if(p.ai&&p.alive){const d=(p.x-ax)**2+(p.y-ay)**2;if(d<bd){bd=d;b=p;}}if(b)O.tid=b.id;}
    if(!O.tid)C.orA='aim';
  }
  if(C.orA==='aim'){O.x=INPUT.gx>=0?INPUT.gx:me?me.x:MW/2;O.y=INPUT.gy>=0?INPUT.gy:me?me.y:MH/2;}
  else if(C.orA==='mid'){O.x=MW/2;O.y=MH/2;}
  else if(C.orA==='me'&&me){O.x=me.x;O.y=me.y;}
}
function devOrbToggle(on){
  const O=DEV.orb;on=on===undefined?!O.on:!!on;O.on=on;
  if(on){if(DEV.fc.on)devFcToggle(false);devOrbPick();O.ang=Math.atan2(cam.position.z-tz(O.y),cam.position.x-tx(O.x));toast('🔄 กล้องหมุนรอบจุด');}
  else CAM_TRACK.has=false;
}
function devOrbCam(dt){
  const O=DEV.orb,C=DEV.cfg;let x=O.x,y=O.y,z=0;
  if(C.orA==='bot'&&DEV.spec&&SPEC.id&&SPEC.id!==O.tid){O.tid=SPEC.id;}   // spectating: orbit whoever is being watched
  const p=O.tid&&G.players[O.tid];
  if(p&&p.alive){x=p.x;y=p.y;z=p.z||0;O.x=x;O.y=y;}
  else if(C.orA==='me'){const m=dvMe();if(m){x=m.x;y=m.y;z=m.z||0;}}
  const gx=tx(x),gz=tz(y),gy=GY(x,y)+z+1.2,k=O.has?1-Math.exp(-4*Math.min(dt,0.1)):1;O.has=1;
  O.cx+=(gx-O.cx)*k;O.cz+=(gz-O.cz)*k;O.cy+=(gy-O.cy)*k;
  O.ang+=C.orS*Math.PI/180*Math.min(dt,0.1);
  const px=O.cx+Math.cos(O.ang)*C.orR,pz=O.cz+Math.sin(O.ang)*C.orR;let py=O.cy+C.orH;
  if(TERR)py=Math.max(TW(px,pz)+0.5,py);
  cam.position.set(px,py,pz);cam.lookAt(O.cx,O.cy,O.cz);
}

// ---- video recording ----
const REC={on:false,mr:null,chunks:[],t0:0,dur:15,cv:null,ctx:null,ext:'webm',mt:'',to:0};
const _dvBadge=document.createElement('div');_dvBadge.id='devRecBadge';_dvBadge.className='hidden';document.body.appendChild(_dvBadge);
function devRecStart(){
  if(REC.on)return devRecStop();
  if(typeof MediaRecorder==='undefined')return toast('เบราว์เซอร์นี้อัดวิดีโอไม่ได้');
  const C=DEV.cfg,src=gl.domElement;let stream;
  if(C.recHud){REC.cv=REC.cv||document.createElement('canvas');REC.cv.width=src.width;REC.cv.height=src.height;REC.ctx=REC.cv.getContext('2d');stream=REC.cv.captureStream(C.recFps);}
  else{REC.ctx=null;stream=src.captureStream(C.recFps);}
  const mt=['video/mp4;codecs=avc1.640028','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t))||'';
  try{REC.mr=new MediaRecorder(stream,mt?{mimeType:mt,videoBitsPerSecond:16e6}:{videoBitsPerSecond:16e6});}catch(e){return toast('อัดวิดีโอไม่ได้: '+e.message);}
  REC.mt=REC.mr.mimeType||mt;REC.ext=/mp4/.test(REC.mt)?'mp4':'webm';REC.chunks=[];
  REC.mr.ondataavailable=e=>{if(e.data&&e.data.size)REC.chunks.push(e.data);};
  REC.mr.onstop=devRecSave;REC.mr.start(1000);
  REC.on=true;REC.t0=performance.now();REC.dur=C.recT;
  clearTimeout(REC.to);REC.to=setTimeout(()=>{if(REC.on)devRecStop();},REC.dur*1000+1500);   // backup if frames stop
  toast('⏺ เริ่มอัด '+REC.dur+' วิ');DEV.key='';
}
function devRecStop(){if(!REC.on)return;REC.on=false;clearTimeout(REC.to);try{REC.mr.stop();}catch(e){}DEV.key='';}
// end of each rendered frame (js/37): copy 3D + HUD into the record canvas, stop on time
function devRecFrame(){
  if(!REC.on)return;
  if(REC.ctx){const g=gl.domElement,c=REC.cv;if(c.width!==g.width||c.height!==g.height){c.width=g.width;c.height=g.height;}REC.ctx.drawImage(g,0,0);REC.ctx.drawImage(cvEl(),0,0,c.width,c.height);}
  if((performance.now()-REC.t0)/1000>=REC.dur)devRecStop();
}
async function devRecSave(){
  const blob=new Blob(REC.chunks,{type:REC.mt||'video/webm'});REC.chunks=[];
  const d=new Date(),z=n=>String(n).padStart(2,'0');
  const name='rec-'+d.getFullYear()+z(d.getMonth()+1)+z(d.getDate())+'-'+z(d.getHours())+z(d.getMinutes())+z(d.getSeconds())+'-'+(G&&G.mode||'game');
  const mb=(blob.size/1048576).toFixed(1);
  try{
    const r=await fetch('/api/video?name='+name+'&ext='+REC.ext,{method:'POST',body:blob});const j=await r.json();
    if(!j.ok)throw new Error(j.error||'save');
    DEV.recLast=j.path;toast('💾 บันทึกแล้ว: '+j.path+' ('+mb+' MB)');
  }catch(e){   // no local server (or old one): browser download
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name+'.'+REC.ext;document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);DEV.recLast='ดาวน์โหลด: '+name+'.'+REC.ext;toast('💾 ดาวน์โหลด '+name+'.'+REC.ext+' ('+mb+' MB)');
  }
  DEV.key='';
}
// one button: spectate a 6v6 bot match, orbit a bot, record once the fight has started
function devRecAuto(){
  devSpecStart('tdm');if(!DEV.spec)return;
  DEV.cfg.orA='bot';devSave();DEV.auto={t:0};toast('🎬 อัตโนมัติ: รอบอทเริ่มสู้แล้วจะหมุนกล้อง + อัด '+DEV.cfg.recT+' วิ');
}
function devAutoTick(){
  const A=DEV.auto;if(!A)return;if(!DEV.spec){DEV.auto=null;return;}
  if(G.ph!=='play'){A.t=0;return;}
  if(!A.t){A.t=performance.now();devOrbToggle(true);return;}
  if(performance.now()-A.t>6000){DEV.auto=null;devRecStart();}
}

// ---- window ----
const _dvPanel=document.createElement('div');_dvPanel.id='devPanel';_dvPanel.className='hidden';
_dvPanel.innerHTML='<div id="dvHead"><b>🛠 Dev</b><span class="sp" id="devPos"></span><span id="dvRecS"></span>'+
  '<label title="ความโปร่งใส">◐ <input type="range" data-s="op" min="0.25" max="1" step="0.01"></label><span class="x" data-d="close" title="ปิด [F2]">✕</span></div><div id="dvBody"></div>';
const _dvBtn=document.createElement('button');_dvBtn.id='devBtn';_dvBtn.className='hidden';_dvBtn.textContent='🛠 DEV [F2]';
document.body.appendChild(_dvPanel);document.body.appendChild(_dvBtn);
const _dvBody=_dvPanel.querySelector('#dvBody'),_dvHead=_dvPanel.querySelector('#dvHead');
_dvBtn.onclick=()=>devToggle(true);
function devUiApply(){
  const U=DEV.cfg.ui,W=innerWidth,H=innerHeight;
  U.w=clamp(U.w,240,W);U.h=clamp(U.h,120,H);U.x=clamp(U.x,-U.w+80,W-80);U.y=clamp(U.y,0,H-30);
  Object.assign(_dvPanel.style,{left:U.x+'px',top:U.y+'px',width:U.w+'px',height:U.h+'px'});
  _dvPanel.style.setProperty('--dvop',U.op);_dvHead.querySelector('input').value=U.op;
}
devUiApply();addEventListener('resize',devUiApply);
// mouse: free it for the menu without opening the pause menu
function devFreeMouse(){if(document.pointerLockElement){DEV.free=1;document.exitPointerLock();}INPUT.fire=INPUT.sh=0;}
function devToggle(on){
  const want=on===undefined?!DEV.open:!!on;if(want===DEV.open)return;
  DEV.open=want;_dvPanel.classList.toggle('hidden',!want);
  if(want){hidePause();trToggle(false);devFreeMouse();DEV.key='';devRender();}
}
function devF2(){   // closed → open • open + playing → mouse to menu • open + mouse on menu → close and play
  if(!DEV.open)return devToggle(true);
  if(locked)return devFreeMouse();
  devToggle(false);try{cvEl().requestPointerLock();}catch(e){}
}
function devGrave(){if(!DEV.open)return;if(locked)devFreeMouse();else try{cvEl().requestPointerLock();}catch(e){}}
// drag (title bar) + resize (corner, saved)
{let dr=null;
  _dvHead.addEventListener('mousedown',e=>{if(e.target.closest('input,[data-d]'))return;dr={x:e.clientX-DEV.cfg.ui.x,y:e.clientY-DEV.cfg.ui.y};e.preventDefault();});
  addEventListener('mousemove',e=>{if(!dr)return;DEV.cfg.ui.x=e.clientX-dr.x;DEV.cfg.ui.y=e.clientY-dr.y;devUiApply();});
  addEventListener('mouseup',()=>{if(dr){dr=null;devSave();}});
  let rt=0;new ResizeObserver(()=>{if(_dvPanel.classList.contains('hidden'))return;const U=DEV.cfg.ui,w=_dvPanel.offsetWidth,h=_dvPanel.offsetHeight;
    if(Math.abs(w-U.w)+Math.abs(h-U.h)<2)return;U.w=w;U.h=h;clearTimeout(rt);rt=setTimeout(devSave,300);}).observe(_dvPanel);}

// ---- rows ----
const dvA=o=>' data-d="'+o.d+'"'+(o.k!==undefined?' data-k="'+o.k+'"':'')+(o.v!==undefined?' data-v="'+o.v+'"':'');
const dvTg=(n,on,k,d)=>'<div class="dr t'+(on?' on':'')+'"'+dvA({d:d||'tog',k})+'><span>'+n+'</span><i>'+(on?'✓':'✕')+'</i></div>';
const dvB=(n,d,v,on,k)=>'<div class="dr b'+(on?' on':'')+'"'+dvA({d,v,k})+'><span>'+n+'</span><i>›</i></div>';
const dvCh=(d,k,list,cur)=>'<div class="dch">'+list.map(q=>'<b'+(cur===q[0]?' class="on"':'')+dvA({d,k,v:q[0]})+'>'+q[1]+'</b>').join('')+'</div>';
const dvSl=(n,k,min,max,step,val,unit)=>'<div class="dr s"><span>'+n+'</span><em data-o="'+k+'">'+(+val).toFixed(step<1?2:0)+(unit||'')+'</em><input type="range" data-s="'+k+'" data-u="'+(unit||'')+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+val+'"></div>';
const dvSub=n=>'<div class="dvsub">'+n+'</div>';
const dvCol=(id,t,rows)=>'<div class="dvc'+(DEV.cfg.cl[id]?' cl':'')+'"><h4 data-d="col" data-k="'+id+'">'+t+'</h4><div class="rows">'+rows.join('')+'</div></div>';
function devKeyOf(){
  const me=dvMe(),sg=G&&G.mode==='siege'&&G.sg;
  return JSON.stringify([DEV.cfg,DEV.fc.on,DEV.orb.on,G&&G.mode,me&&me.fly,me&&me.team,me&&getKit(me.id).path,sg&&sg.ph,DEV.bp,DEV.bl,DEV.bn,
    DEV.spec,DEV.specLock,SPEC.id,DEV.spec?plist().map(p=>p.alive?1:0).join(''):'',REC.on,DEV.recLast,!!DEV.auto,typeof photoKey==='function'?photoKey():0]);
}
function devRender(){
  if(!DEV.open||!devOn())return;
  const me=dvMe();if(!me&&!DEV.spec)return;
  const k=devKeyOf();if(k===DEV.key)return;DEV.key=k;
  const C=DEV.cfg,sg=G.mode==='siege'&&G.sg?G.sg:null,F=sg?sgF():null;
  const ok=PATHS.map((P,i)=>[i,P]).filter(q=>!q[1].off),nm=P=>P.n.replace('สาย','');
  const cols=[];
  // spectator / mode
  if(DEV.spec){
    const tn=p=>G.mode==='siege'?(SG_TEAM[p.team]||''):G.mode==='tdm'?(TEAMN[p.team]||''):'';
    const L=plist().slice().sort((a,b)=>(a.team-b.team)||a.name.localeCompare(b.name));
    cols.push(dvCol('spec','👁 ผู้ชม',[dvB('⏹ ออก (กลับไปเล่น)','specstop'),dvTg('กล้องหันตามบอท [R]',DEV.specLock,undefined,'slock'),dvSub('ดูบอท (Q/E • คลิก)'),
      ...L.map(p=>dvB((p.alive?'':'💀 ')+(tn(p)?tn(p).replace('ทีม','').replace('ฝ่าย','')+' · ':'')+p.name.replace('🤖 ',''),'sfol',p.id,!DEV.fc.on&&SPEC.id===p.id))]));
  }
  cols.push(dvCol('mode','🎮 โหมด',[...Object.keys(MODES).map(m=>dvB(MODES[m].name,'mode',m,!DEV.spec&&G.mode===m)),dvTg('🤖 เติมบอทตอนเริ่ม',C.sbots,'sbots'),dvTg('♾️ แมตช์ไม่จบเอง',C.noend,'noend'),dvB('🏁 จบแมตช์ตอนนี้','endnow'),
    dvSub('ผู้ชม (บอทเต็มห้อง)'),dvB('⚔️ ดูบอท 6v6','spec','tdm',DEV.spec&&G.mode==='tdm'),dvB('🏰 บุกปราสาท 6v6','spec','siege',DEV.spec&&G.mode==='siege'),dvB('💥 FFA 12 ตัว','spec','ffa',DEV.spec&&G.mode==='ffa')]));
  if(me){
    const path=getKit(me.id).path;
    cols.push(dvCol('me','🧙 ตัวละคร',[dvTg('🛡️ อมตะ',C.god,'god'),dvTg('⏱️ ไม่มีคูลดาวน์',C.nocd,'nocd'),dvTg('🌟 อัลติเต็มตลอด',C.ult,'ult'),dvTg('⚡ เกิดใหม่ไว',C.fast,'fast'),
      dvSl('🏃 ความเร็วเดิน','spd',0.5,3,0.1,C.spd,'×'),dvB('❤️ เลือดเต็ม','hp'),dvB('♻️ เกิดใหม่ทันที','rev'),
      dvTg('🧹 ไม้กวาดทุกโหมด (B)',C.broom,'broom'),dvB(me.fly?'⬇ ลงไม้กวาด [F9]':'🧹 ขึ้นไม้กวาด [F9]','mount'),
      dvSub('สาย'),dvCh('kit',undefined,ok.map(q=>[q[0],q[1].ic+' '+nm(q[1])]),path),dvB('🪄 เลือกคาถาละเอียด','creator')]));
  }
  cols.push(dvCol('cam','🎥 กล้อง',[dvTg('กล้องอิสระ [F3]',DEV.fc.on,undefined,'fc'),dvSl('ความเร็วกล้องอิสระ','fcspd',3,300,1,DEV.fc.spd),dvB('⬇ มองจากบน','fctop'),dvB(me?'🧍 กล้องอิสระที่ตัวเรา':'🎥 กล้องอิสระที่บอทนี้','fcme'),
    dvSub('หมุนรอบจุด'),dvTg('🔄 กล้องหมุน [F1]',DEV.orb.on,undefined,'orb'),dvCh('ora','orA',[['bot','บอท'],['aim','จุดเล็ง'],['me','ตัวเรา'],['mid','กลางแมพ']],C.orA),
    dvSl('ระยะ','orR',3,80,0.5,C.orR,' ม.'),dvSl('ความสูง','orH',0,50,0.5,C.orH,' ม.'),dvSl('ความเร็วหมุน','orS',-90,90,1,C.orS,'°/วิ')]));
  cols.push(dvCol('rec','🎬 อัดวิดีโอ',[dvB(REC.on?'⏹ หยุดอัด [F10]':'⏺ อัด '+C.recT+' วิ [F10]','rec',undefined,REC.on),dvCh('sets','recT',[[5,'5'],[10,'10'],[15,'15'],[30,'30'],[60,'60']].map(q=>[q[0],q[1]+' วิ']),C.recT),
    dvCh('sets','recFps',[[30,'30 fps'],[60,'60 fps']],C.recFps),dvTg('รวม HUD ในวิดีโอ',C.recHud,'recHud'),dvB('🎬 อัตโนมัติ: บอท 6v6 + หมุน + อัด','recauto',undefined,!!DEV.auto),
    DEV.recLast?'<div class="dvnote">'+esc(DEV.recLast)+'</div>':'']));
  cols.push(dvCol('bot','🤖 บอท',[dvCh('bp',undefined,[[-1,'🎲 สุ่ม']].concat(ok.map(q=>[q[0],q[1].ic+' '+nm(q[1])])),DEV.bp),dvCh('bl',undefined,[[0,'ง่าย'],[1,'กลาง'],[2,'เก่ง']],DEV.bl),
    ...(me?[dvCh('bn',undefined,[[1,'×1'],[2,'×2'],[3,'×3']],DEV.bn),...(G.mode==='siege'?[dvB('➕ บอทฝั่งบุก','botadd',0),dvB('➕ บอทฝั่งรับ','botadd',1)]:[dvB('➕ เพิ่มบอท (ที่เล็ง)','botadd',50)])]:[]),
    dvB('🧹 ลบบอททั้งหมด','botclr'),dvTg('🧊 บอทหยุดนิ่ง',C.freeze,'freeze')]));
  cols.push(dvCol('world','🌍 โลก',[dvSl('⏱ ความเร็วโลก [F8]','ts',0.1,2,0.05,C.ts,'×'),dvTg('⏸ หยุดโลก [F4]',C.pause,'pause'),dvTg('🟥 กล่องชน',C.col,'col'),dvTg('🗺️ แผนที่ 2D (คลิก = วาร์ป)',C.omap,'omap'),
    dvTg('⭕ เขตยึด + จุดเกิดปลอดภัย',C.zon,'zon'),dvB('📍 คัดลอกพิกัดที่เล็ง [F7]','copy')]));
  if(me){
    const w=[dvB('🎯 ไปจุดเล็ง [F6]','tpaim'),dvB('📍 ไปที่กล้อง','tpfc')];
    if(F){F.cores.forEach((c,i)=>{if(c)w.push(dvB('🔷 แกน '+(i+1),'tp',Math.round(c.x)+','+Math.round(c.y)));});
      ['A','B'].forEach(t=>{const s=F.sp[t][sg.ph];if(s)w.push(dvB(t==='A'?'⚔️ จุดเกิดบุก':'🛡️ จุดเกิดรับ','tp',Math.round(s.x)+','+Math.round(s.y)));});}
    cols.push(dvCol('warp','📍 วาร์ป',w));
  }
  if(F)cols.push(dvCol('siege','🏰 ปราสาท',[dvCh('ph','',Array.from({length:F.n},(_,i)=>[i+1,'เฟส '+(i+1)]),sg.ph),...(me?[dvB('🔁 สลับฝั่ง ('+(SG_TEAM[me.team]||'-')+')','team')]:[]),
    ...(()=>{const L=[];for(let b=1;b<F.n;b++)if(F.loot&&F.loot[b]&&F.loot[b].length)L.push([b,'🎁 ชิงของหลังแกน '+b]);
      return L.length?[dvCh('loot','',L,sg.lt>0?sg.ph-1:-1),dvB('⏹ จบช่วงชิงของ','lootend'),dvB('💠 รับของ 1 ชิ้น','lootgive','shard')]:[dvSub('🎁 แมพนี้ไม่มีเขตชิงของ')];})(),
    dvB('⏭ ข้ามเตรียมตัว','skip'),dvB('💥 แกนแตก','core0'),dvB('🔷 แกนเต็ม','corefull'),dvB('⏱ +60 วิ','time',60),dvB('⏱ เหลือ 5 วิ','time',0),
    dvB('🧱 ซ่อมกำแพง','walls',1),dvB('🔨 พังกำแพง','walls',0),dvB('🏆 บุกชนะ','win',0),dvB('🛡️ รับชนะ','win',1)]));
  cols.push(dvCol('dmg','💥 ทำลาย / ซ่อม',[dvSub('ที่เล็ง = จุดที่เมาส์ชี้ก่อนเปิดเมนู'),dvB('🔧 ซ่อมตรงที่เล็ง','dfix','part'),dvB('💥 พังตรงที่เล็ง','dbrk','part'),dvB('🔧 ซ่อมทั้งหลัง','dfix','whole'),
    dvB('💥 พังทั้งหลัง','dbrk','whole'),dvB('🔧 ซ่อมทั้งแมพ','dfix','map'),dvB('💥 พังทั้งแมพ','dbrk','map')]));
  if(typeof photoCol==='function')cols.push(photoCol());   // photo mode (js/79)
  cols.push(dvCol('keys','⌨️ ปุ่มลัด',['<div class="dvnote">F2 เปิด / เมาส์ไปเมนู / ปิด<br>` สลับเมาส์ เมนู ↔ เกม<br>F3 กล้องอิสระ • F1 กล้องหมุน<br>F10 อัดวิดีโอ • F4 หยุดโลก<br>F6 วาร์ป • F7 พิกัด • F8 สโลว์ • F9 ไม้กวาด<br>?dev=0 ปิด Dev Mode</div>',dvB('↺ รีเซ็ตตำแหน่งหน้าต่าง','uireset')]));
  const sx=_dvBody.scrollLeft,sy=_dvBody.scrollTop;
  _dvBody.innerHTML=cols.join('');_dvBody.scrollLeft=sx;_dvBody.scrollTop=sy;
  devPos();
}
function devPos(){
  const el=document.getElementById('devPos');if(!el)return;const me=dvMe(),f=n=>Math.round(n),ax=INPUT.gx,ay=INPUT.gy;
  el.textContent=(me?'ตัวเรา '+f(me.x)+','+f(me.y)+' '+devCell(me.x,me.y)+' • ':DEV.spec?'👁 ผู้ชม • ':'')+'เล็ง '+(ax>=0?f(ax)+','+f(ay)+' '+devCell(ax,ay):'—')+(DEV.fc.on?' • กล้องอิสระ '+f(DEV.fc.spd):'');
  const rs=document.getElementById('dvRecS'),left=REC.on?Math.max(0,REC.dur-(performance.now()-REC.t0)/1000):0;
  rs.textContent=REC.on?'● REC '+left.toFixed(0)+' วิ':'';rs.className=REC.on?'dvrec':'';
}
// new actions here, the rest go to devAct (js/77)
function devUiAct(a,k,v){
  const C=DEV.cfg;
  if(a==='close'){devToggle(false);return;}
  if(a==='col'){C.cl[k]=C.cl[k]?0:1;devSave();DEV.key='';devRender();return;}
  if(a==='orb')devOrbToggle();
  else if(a==='ora'){C[k]=String(v);devSave();if(DEV.orb.on)devOrbPick();}
  else if(a==='sets'){C[k]=+v;devSave();}
  else if(a==='rec')devRecStart();
  else if(a==='recauto')devRecAuto();
  else if(a==='uireset'){C.ui={x:12,y:60,w:Math.min(1100,innerWidth-40),h:Math.min(560,innerHeight-90),op:0.78};devSave();devUiApply();}
  else if(a==='fc'){if(DEV.orb.on)devOrbToggle(false);devAct(a,k,v);return;}
  else if(a.startsWith('ph'))photoAct(a,k,v);   // photo mode (js/79)
  else return devAct(a,k,v);
  DEV.key='';devRender();
}
_dvPanel.addEventListener('click',e=>{const b=e.target.closest('[data-d]');if(!b)return;ac();devUiAct(b.dataset.d,b.dataset.k,b.dataset.v);});
// sliders: change the value live without rebuilding the panel (rebuild would break the drag)
_dvPanel.addEventListener('input',e=>{
  const s=e.target.dataset&&e.target.dataset.s;if(!s)return;const v=+e.target.value,C=DEV.cfg;
  if(s==='op'){C.ui.op=v;_dvPanel.style.setProperty('--dvop',v);}
  else if(s==='fcspd')DEV.fc.spd=v;
  else if(s.startsWith('ph.'))photoSet(s.slice(3),v);
  else C[s]=v;
  const o=_dvPanel.querySelector('[data-o="'+s+'"]');if(o)o.textContent=v.toFixed(+e.target.step<1?2:0)+(e.target.dataset.u||'');
  devSave();DEV.key=devKeyOf();
});
_dvPanel.addEventListener('change',e=>{if(e.target.blur)e.target.blur();});   // keys go back to the game
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement&&document.activeElement&&_dvPanel.contains(document.activeElement))document.activeElement.blur();});
addEventListener('keydown',e=>{
  if(!(DEV.on&&devOn()))return;
  if(e.code==='Backquote'&&DEV.open){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)devGrave();}
  else if(e.code==='F10'||e.code==='F1'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat){if(e.code==='F10')devRecStart();else devOrbToggle();DEV.key='';}}
},true);
setInterval(()=>{
  try{
    const on=devOn();
    _dvBtn.classList.toggle('hidden',!on||DEV.open||DEV.fc.on||DEV.orb.on||REC.on);
    if(!on){_dvMap.classList.add('hidden');if(DEV.open)devToggle(false);DEV.fc.on=false;DEV.orb.on=false;DEV.auto=null;if(REC.on)devRecStop();devOverlay();return;}
    _dvMap.classList.toggle('hidden',!DEV.cfg.omap);if(DEV.cfg.omap)devMapDraw();
    if(DEV.open){devRender();devPos();}
    devAutoTick();
    _dvBadge.classList.toggle('hidden',!REC.on||DEV.open);if(REC.on)_dvBadge.textContent='● REC '+Math.max(0,REC.dur-(performance.now()-REC.t0)/1000).toFixed(0);
    devOverlay();
  }catch(e){}
},200);
if(window.WD){window.WD.dev=DEV;window.WD.spec=SPEC;window.WD.devSpec=devSpecStart;window.WD.devOrb=devOrbToggle;window.WD.devRec=devRecStart;window.WD.REC=REC;}   // debug / automated tests
