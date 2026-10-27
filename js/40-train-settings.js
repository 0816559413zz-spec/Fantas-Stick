// ---------- เมนูทดลอง (ห้องฝึก / Test Place) ----------
let trOpenF=false,trKey='',trN=1;
const TR_OPTS=[['datk','🎯 หุ่นซ้อมยิงเวทใส่เรา'],['mai','👹 มอนสเตอร์ขยับ + โจมตี'],['nocd','⏱️ ไม่มีคูลดาวน์ (Q/E/R/F)'],['ult','🌟 อัลติเมทเต็มตลอด'],['god','🛡️ อมตะ (เลือดไม่ลด)']];
function trToggle(on){
  const want=on===undefined?!trOpenF:!!on;if(want===trOpenF)return;
  trOpenF=want;$('#trPanel').classList.toggle('hidden',!want);if(want&&bpOpen)bpShow(false);
  if(want){trKey='';hidePause();if(document.pointerLockElement)document.exitPointerLock();INPUT.fire=INPUT.sh=0;if(VIEW.cur)trSync(VIEW.cur);}
}
function trSend(d){
  d.t='tr';
  if(NET.isHost){if(G&&G.players[NET.myId])trCmd(G.players[NET.myId],d);}
  else if(NET.hostConn)try{NET.hostConn.send(d);}catch(e){}
}
function trSync(v){
  const on=v.mode==='train'&&v.ph!=='over';
  $('#trOpen').classList.toggle('hidden',!on||trOpenF);
  if(!on){if(trOpenF)trToggle(false);return;}
  if(!trOpenF)return;
  const tr=(v.M&&v.M.tr)||{},me=v.P.find(q=>q.id===NET.myId),myT=me?me.tm:0,k=JSON.stringify(tr)+'|'+trN+'|'+myT;
  if(k===trKey)return;trKey=k;
  const mons=Object.keys(EDEF);
  $('#trPanel').innerHTML=`<h2>🧪 Test Place</h2>
    <button class="pri trw" data-tr="kit">🪄 เปลี่ยนสาย / คาถา</button>
    <div class="trs">ผู้เล่น</div>
    <div class="trn">${['🤝 ทีมเดียวกัน','⚔️ 2 ทีม','💥 ตัวใครตัวมัน'].map((n,i)=>`<button class="${(tr.pvp|0)===i?'on':''}" data-trp="${i}">${n}</button>`).join('')}</div>
    ${tr.pvp===1?`<div class="trn">${TEAMN.map((n,i)=>`<button class="${myT===i?'on':''}" data-trteam="${i}" style="color:${TEAMC[i]}">${myT===i?'✔ ':''}${n}</button>`).join('')}</div>`:''}
    <div class="trs">ตั้งค่า</div>
    ${TR_OPTS.map(([k2,n])=>`<button class="trt ${tr[k2]?'on':''}" data-trk="${k2}">${n}<b>${tr[k2]?'เปิด':'ปิด'}</b></button>`).join('')}
    <div class="trs">เสกมอนสเตอร์ (ที่วงสีแดง)</div>
    <div class="trn">${[1,3,5].map(n=>`<button class="${trN===n?'on':''}" data-trn="${n}">×${n}</button>`).join('')}</div>
    <div class="trg">${mons.map(m=>`<button class="${EDEF[m].boss?'boss':''}" data-tre="${m}">${EDEF[m].boss?'👑 ':''}${EDEF[m].name}</button>`).join('')}</div>
    <button class="trw" data-tr="clear">🧹 ล้างมอนสเตอร์ที่เสก</button>
    <small>P / Esc = ปิดเมนู • คลิกจอ = เล่นต่อ</small>`;
}
$('#trOpen').onclick=()=>trToggle(true);
$('#trPanel').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;ac();
  const v=VIEW.cur,tr=(v&&v.M&&v.M.tr)||{};
  if(b.dataset.trk){const k=b.dataset.trk;trSend({c:'set',k,v:tr[k]?0:1});}
  else if(b.dataset.trp)trSend({c:'pvp',v:+b.dataset.trp});
  else if(b.dataset.trteam)trSend({c:'team',v:+b.dataset.trteam});
  else if(b.dataset.trn){trN=+b.dataset.trn;trKey='';}
  else if(b.dataset.tre)trSend({c:'spawn',e:b.dataset.tre,n:trN});
  else if(b.dataset.tr==='clear')trSend({c:'clear'});
  else if(b.dataset.tr==='kit'){trToggle(false);openCreator(false,3);}
  if(v)trSync(v);
});
// ---------- แท่นเสกบอท (โซนเสกบอท ห้องฝึก, trBotPad js/02): ยืนบนแท่น = เมนูขึ้น + ปล่อยเมาส์ • คลิกจอ = ซ่อนจนกว่าจะเดินออกแล้วเข้าใหม่ ----------
let bpOpen=false,bpOn=false,bpKey='';const BP={p:0,lv:1,n:1};
document.body.insertAdjacentHTML('beforeend','<div id="bpPanel" class="card hidden"></div>');
function bpShow(on){bpOpen=on;$('#bpPanel').classList.toggle('hidden',!on);if(on){bpKey='';hidePause();if(document.pointerLockElement)document.exitPointerLock();INPUT.fire=INPUT.sh=0;}}
function bpSync(v){
  const me=v.mode==='train'&&v.ph!=='over'&&MAPID==='test'&&v.P.find(q=>q.id===NET.myId),B=me?trBotPad():null;
  const on=!!(B&&me.al&&Math.hypot(me.x-B.x,me.y-B.y)<B.r);
  if(on!==bpOn){bpOn=on;bpShow(on&&!trOpenF);}
  if(TRPAD)TRPAD.material.opacity=on?0.7+0.3*Math.sin(performance.now()/160):1;
  if(!bpOpen)return;
  const nb=v.P.filter(q=>String(q.id).startsWith('bot')).length,k=JSON.stringify(BP)+'|'+nb;if(k===bpKey)return;bpKey=k;
  $('#bpPanel').innerHTML=`<h2>🤖 แท่นเสกบอท</h2>
    <div class="trs">ธาตุ</div>
    <div class="trg">${PATHS.map((P,i)=>P.off?'':`<button class="${BP.p===i?'on':''}" data-bpp="${i}" style="color:${P.col}">${P.ic} ${P.n}</button>`).join('')}</div>
    <div class="trs">ความเก่ง</div>
    <div class="trn">${BOT_LV.map((L,i)=>`<button class="${BP.lv===i?'on':''}" data-bpl="${i}">${L.n}</button>`).join('')}</div>
    <div class="trs">จำนวน</div>
    <div class="trn">${[1,2,3].map(n=>`<button class="${BP.n===n?'on':''}" data-bpn="${n}">×${n}</button>`).join('')}</div>
    <button class="pri trw" data-bp="go" ${nb>=BOT_MAX?'disabled':''}>🤖 เสกบอท</button>
    <button class="trw" data-bp="clr" ${nb?'':'disabled'}>🧹 ลบบอททั้งหมด${nb?` (${nb} ตัว)`:''}</button>
    <small>บอทอยู่แค่ในโซนนี้ • สูงสุด ${BOT_MAX} ตัว • คลิกจอ = เล่นต่อ</small>`;
}
$('#bpPanel').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;ac();
  if(b.dataset.bpp)BP.p=+b.dataset.bpp;
  else if(b.dataset.bpl)BP.lv=+b.dataset.bpl;
  else if(b.dataset.bpn)BP.n=+b.dataset.bpn;
  else if(b.dataset.bp==='go')trSend({c:'bot',p:BP.p,lv:BP.lv,n:BP.n});
  else if(b.dataset.bp==='clr')trSend({c:'botclr'});
  bpKey='';if(VIEW.cur)bpSync(VIEW.cur);
});
$('#btnMyMusic').onclick=()=>{ac();$('#myMusicIn').click();};
$('#myMusicIn').onchange=async e=>{
  const fs=[...e.target.files].filter(f=>/^audio\//.test(f.type)||/\.(mp3|ogg|wav|m4a|aac|flac|opus|webm)$/i.test(f.name));
  e.target.value='';if(!fs.length)return;
  MY.list=fs.map(f=>({name:f.name,blob:f}));MY.i=0;MY.playing=false;myInfo();
  if(!MUSIC.on)toggleMusic();
  musicTick();toast(`เพิ่ม ${fs.length} เพลงแล้ว เล่นแค่ในเครื่องคุณ`);
  mySave(fs);
};
$('#btnMyClear').onclick=myClear;
myLoad();
// เสียงคลิก/ชี้ปุ่ม
document.addEventListener('click',e=>{if(e.target.closest('button,.bc,.sw'))snd('ui_click',{rev:0});});
let hovEl=null;document.addEventListener('pointerover',e=>{const b=e.target.closest('button:not(:disabled),.bc');if(b!==hovEl){hovEl=b;if(b)snd('ui_hover',{rev:0});}});
// ----- หน้าตั้งค่า -----
function setRow(lab,key,min,max,step,unit){return `<label class="srow"><span>${lab}</span><input type="range" min="${min}" max="${max}" step="${step}" data-set="${key}" value="${SET[key]}"><b data-sv="${key}">${SET[key]}${unit||''}</b></label>`;}
function setTog(lab,key){return `<label class="srow tog"><span>${lab}</span><input type="checkbox" data-set="${key}" ${SET[key]?'checked':''}><i></i></label>`;}
let setTab=0;
const XHC=['#f3dc94','#ffffff','#7dff9a','#7fe8ff','#ff6b6b','#ff9ad5'],XHN=['ทอง','ขาว','เขียว','ฟ้า','แดง','ชมพู'];
function setOpts(lab,key,names){return `<label class="srow"><span>${lab}</span><div class="segs">${names.map((n,i)=>`<button type="button" class="seg ${SET[key]===i?'on':''}" data-seg="${key}" data-v="${i}">${n}</button>`).join('')}</div></label>`;}
// ไอคอนแท็บ (เส้นบาง 24×24) — เรียงบนเส้นโค้งวงกลมด้านซ้าย (มุม --a) + ปุ่มออกล่างสุด
const SET_ICO=['<circle cx="12" cy="12" r="7"/><path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5"/>','<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  '<rect x="3" y="5" width="18" height="12" rx="1.5"/><path d="M9 21h6M12 17v4"/><path d="M6.5 14l3.5-4 2.5 2.5 2-2 3 3.5"/>','<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 8.5h18M7 12.5h4M7 15.5h7"/><circle cx="17" cy="14" r="1.6"/>',
  '<rect x="2.5" y="6.5" width="19" height="11" rx="1.5"/><path d="M6 10h1M9 10h1M12 10h1M15 10h1M18 10h1M7.5 14h9"/>','<path d="M10 4H5.5v16H10"/><path d="M14 8l4 4-4 4M18 12H9"/>'];
const SET_EN=['Mouse','Audio','Graphics','Display','Controls','Exit'];
function renderSettings(){
  const tabs=['เมาส์ & เป้าเล็ง','เสียง','ภาพ','หน้าจอ','ปุ่มกด'];
  let b='';
  if(setTab===0)b=`${setRow('ความไวเมาส์','sens',20,250,5,'%')}${setTog('กลับแกนขึ้น-ลง','inv')}
    <h3 class="sec">เป้าเล็ง</h3>${setOpts('รูปแบบ','xh',['กากบาท','จุด','วงกลม','กากบาท+วง'])}${setOpts('สี','xhc',XHN)}${setRow('ขนาด','xhs',50,200,10,'%')}
    <div class="xhprev"><canvas id="xhPrev" width="120" height="70"></canvas></div>`;
  if(setTab===1)b=`${setRow('เสียงรวม','master',0,100,1,'%')}${setRow('เสียงเอฟเฟกต์','sfx',0,100,1,'%')}${setRow('เพลง','music',0,100,1,'%')}${setTog('เปิดเพลงประกอบ','_music')}`;
  if(setTab===2)b=`<label class="srow"><span>กราฟิก</span><select id="setGfx">${['auto','high','low'].map(m=>`<option value="${m}" ${QUAL.mode===m?'selected':''}>${QUAL_NAME[m]}${m==='auto'?' (ปรับเองให้ลื่น)':m==='high'?' (เครื่องแรง)':' (ลื่นสุด ไม่มีเงา)'}</option>`).join('')}</select></label>
    ${setRow('มุมกว้างกล้อง (FOV)','fov',50,95,1,'°')}${setTog('กล้องสั่น','shake')}${setTog('แสดง FPS','fps')}`;
  if(setTab===3)b=`${setTog('ตัวเลขดาเมจ','dmg')}${setTog('เครื่องหมายตอนยิงโดน','hitm')}${setTog('บอกทิศที่โดนยิง','dirm')}${setTog('แผนที่ย่อ','mini')}${setTog('ชื่อผู้เล่นเหนือหัว','names')}`;
  if(setTab===4)b=`<p class="crnote" style="margin:4px 0 10px">คลิกปุ่มแล้วกดปุ่มบนคีย์บอร์ดที่ต้องการ (Esc = ยกเลิก)</p><div class="kbind">${KEYACT.map(([a,n])=>`<label class="srow kb"><span>${n}</span><button type="button" class="kbtn ${_rebind===a?'wait':''}" data-bind="${a}">${_rebind===a?'กดปุ่ม...':keyName(KEYS[a])}</button></label>`).join('')}</div>
    <p class="crnote" style="margin-top:10px">คลิกซ้าย = ยิง • คลิกขวา = โล่ • N = เพลงถัดไป • Esc = เมนูหยุดพัก</p>`;
  const N=tabs.length+1,ang=i=>(-52+104*i/(N-1)).toFixed(1)+'deg',ico=i=>`<span class="sxI"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${SET_ICO[i]}</svg></span>`;
  $('#setTabs').innerHTML=tabs.map((t,i)=>`<button type="button" class="stab ${setTab===i?'on':''}" data-stab="${i}" style="--a:${ang(i)};--i:${i}">${ico(i)}<span class="sxL">${SET_EN[i]}<small>${t}</small></span></button>`).join('')
    +`<button type="button" class="stab sxExit" data-sx="exit" style="--a:${ang(N-1)};--i:${N-1}">${ico(5)}<span class="sxL">${SET_EN[5]}<small>ปิด</small></span></button>`;
  {const ti=$('#setTiTh');if(ti)ti.textContent=tabs[setTab];}
  $('#setBody').innerHTML=b;
  const mt=$('#setBody').querySelector('[data-set="_music"]');if(mt)mt.checked=MUSIC.on;
  drawXhPrev();
}
function drawXhPrev(){const c=document.getElementById('xhPrev');if(!c)return;const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.fillStyle='#1a2340';g.fillRect(0,0,c.width,c.height);drawXh(c.width/2,c.height/2,false,g);}
function openSettings(){const el=$('#settings');clearTimeout(el._t);el.classList.remove('out');renderSettings();el.classList.remove('hidden');}
// ปิด = เล่นตอนเปิดย้อนกลับ (ผู้ใช้ 2026-10-23: กดกลับแล้วแอนิเมชันย้อน)
function closeSettings(){const el=$('#settings');if(el.classList.contains('hidden')||el.classList.contains('out'))return;el.classList.add('out');clearTimeout(el._t);el._t=setTimeout(()=>{el.classList.add('hidden');el.classList.remove('out');},430);}
$('#btnSettings').onclick=()=>{ac();openSettings();};
$('#setClose').onclick=closeSettings;
$('#setReset').onclick=()=>{Object.assign(SET,SET_DEF,{keys:{}});saveSet();rebuildKeys();applySettings();renderSettings();};
$('#settings').addEventListener('click',e=>{
  if(e.target.closest('[data-sx="exit"]')||e.target.classList.contains('sxBg')){closeSettings();return;}
  const t=e.target.closest('[data-stab]');if(t){setTab=+t.dataset.stab;_rebind=null;renderSettings();$('#setBody').classList.remove('sxNew');void $('#setBody').offsetWidth;$('#setBody').classList.add('sxNew');return;}
  const s=e.target.closest('[data-seg]');if(s){SET[s.dataset.seg]=+s.dataset.v;saveSet();renderSettings();return;}
  const k=e.target.closest('[data-bind]');if(k){_rebind=k.dataset.bind;renderSettings();return;}
});
$('#settings').addEventListener('input',e=>{
  const el=e.target,k=el.dataset&&el.dataset.set;
  if(el.id==='setGfx'){QUAL.mode=el.value;QUAL.scale=1;QUAL.lvl=0;store('wd_gfx',QUAL.mode);applyQuality();return;}
  if(!k)return;
  if(k==='_music'){if(!!el.checked!==MUSIC.on){ac();toggleMusic();}return;}
  SET[k]=el.type==='checkbox'?(el.checked?1:0):+el.value;
  const sv=$('#setBody').querySelector(`[data-sv="${k}"]`);if(sv)sv.textContent=el.value+(k==='fov'?'°':'%');
  saveSet();applySettings();drawXhPrev();
});
$('#settings').addEventListener('change',e=>{if(e.target.id==='setGfx'){QUAL.mode=e.target.value;QUAL.scale=1;QUAL.lvl=0;store('wd_gfx',QUAL.mode);applyQuality();}});
applySettings();
// เพลงเริ่มได้หลังผู้ใช้คลิกครั้งแรก (กฎของเบราว์เซอร์)
addEventListener('pointerdown',()=>ac(),{once:true});
$('#btnStart').onclick=()=>{if(NET.isHost)hostStart();};
$('#btnTeam').onclick=()=>{
  if(NET.isHost){const p=G.players[NET.myId];p.lteam^=1;broadcastLobby();}
  else if(NET.hostConn)NET.hostConn.send({t:'team'});
};
$('#modes').addEventListener('click',e=>{
  const b=e.target.closest('[data-mode]');
  if(b&&NET.isHost&&G&&G.ph==='lobby'){G.mode=b.dataset.mode;broadcastLobby();}
  const mb=e.target.closest('[data-map]');
  if(mb&&NET.isHost&&G&&G.ph==='lobby'){G.map=mb.dataset.map;broadcastLobby();}
});
$('#modeCard').addEventListener('click',e=>{const b=e.target.closest('[data-mappick]');if(b&&NET.isHost&&G&&G.ph==='lobby'){G.mapPick=b.dataset.mappick;broadcastLobby();}});
// คลิกป้ายชื่อในล็อบบี้ = ย้ายทีม (โฮสต์ / โหมดทีม)
cv.addEventListener('click',e=>{
  if(screen!=='lobby'||!NET.isHost||!G||G.ph!=='lobby'||!MODES[G.mode].team)return;
  const r=STAGE.plates.find(r=>e.clientX>=r.x&&e.clientX<=r.x+r.w&&e.clientY>=r.y-16&&e.clientY<=r.y+r.h);
  if(r){const p=G.players[r.id];if(p){p.lteam^=1;broadcastLobby();}}
});
// คัดลอกลิงก์เชิญ (ผู้ใช้ 2026-10-22): เพื่อนกดลิงก์ ...?join=รหัส แล้วเข้าห้องทันที (ยังไม่มีตัวละคร = สร้างก่อนแล้วเข้าเอง)
$('#btnCopy').onclick=()=>{const c=LOBBY&&LOBBY.code;if(!c)return;const u=location.origin+location.pathname+'?join='+c;
  const ok=()=>toast('คัดลอกลิงก์เชิญแล้ว ส่งให้เพื่อนกดเข้าห้องได้เลย'),no=()=>toast('ลิงก์เชิญ: '+u);
  try{navigator.clipboard.writeText(u).then(ok,no);}catch(e){no();}};
$('#micBtn').onclick=toggleMic;
$('#micMode').onchange=e=>{VOICE.ptt=e.target.value==='ptt';};
$('#teamOnly').onchange=e=>{VOICE.teamOnly=e.target.checked;};
$('#vlist').addEventListener('click',e=>{
  const id=e.target.dataset.mute;if(!id)return;
  if(VOICE.muted.has(id))VOICE.muted.delete(id);else VOICE.muted.add(id);
  const o=VOICE.inc.get(id);if(o)o.audio.muted=VOICE.muted.has(id);
  updateVoiceUI();
});
$('#vmin').onclick=()=>{const b=$('#vbody');b.classList.toggle('hidden');$('#vmin').textContent=b.classList.contains('hidden')?'▸':'▾';};

function modeIcon(m){return m.name.split(' ')[0];}
function modeTitle(m){return m.name.split(' ').slice(1).join(' ');}
function renderLobby(){
  const L=LOBBY;if(!L)return;
  const host=NET.isHost,M=MODES[L.mode]||MODES.coop;
  $('#roomChip').classList.toggle('hidden',!L.online);
  $('#roomCode').textContent=L.online?L.code:'';
  $('#roomHint').textContent=L.online?'ส่งรหัสห้องให้เพื่อน → เพื่อนใส่รหัสที่หน้าแรกแล้วกด "เข้าร่วม"':'โหมดออฟไลน์ — เล่นคนเดียว ไม่ต้องใช้อินเทอร์เน็ต';
  $('#pcount').innerHTML=`ผู้เล่น <b>${L.players.length}</b> / 6`;
  $('#modes').innerHTML=Object.entries(MODES).map(([k,m])=>`<button class="mode ${L.mode===k?'on':''}" data-mode="${k}" ${host?'':'disabled'}><span class="ic"><span>${modeIcon(m)}</span></span><span><b>${modeTitle(m)}</b><small>${m.min===m.max?m.min:m.min+'-'+m.max} คน</small></span></button>`).join('');
  $('#mapNote').textContent='';
  const mapTxt=M.map?(MAPS[M.map]||{name:M.map}).name:L.mpk&&MAPS[L.mpk]?MAPS[L.mpk].name:'🎲 สุ่ม';
  const mapPick=M.map?'':`<div class="mpick">${['',...new Set([...RANDOM_MAPS,'forest',...Object.keys(MAPS).filter(k=>MAPS[k].fm||MAPS[k].pick)])].filter(k=>!MAP_OFF.has(k)).map(k=>`<button type="button" class="mchip ${(L.mpk||'')===k?'on':''}" data-mappick="${k}" ${host?'':'disabled'} title="${k?esc(MAPS[k].d):'สุ่มทุกรอบ'}">${k?MAPS[k].name:'🎲 สุ่ม'}</button>`).join('')}</div>`;
  $('#modeCard').innerHTML=`<div class="k">โหมดที่เลือก</div><div class="n">${modeIcon(M)} ${modeTitle(M)}</div><div class="d">${M.d}</div>
    <div class="meta"><span>👥 ${M.min===M.max?M.min:M.min+'-'+M.max} คน</span><span>🗺️ ${mapTxt}</span>${M.team?'<span>⚔️ 2 ทีม</span>':''}</div>
    ${mapPick}
    ${M.team?`<div class="d" style="margin-top:8px">${host?'คลิกป้ายชื่อเพื่อนเพื่อย้ายทีม':'กด "สลับทีม" เพื่อย้ายทีม'}</div>`:''}`;
  $('#btnTeam').classList.toggle('hidden',!M.team);
  $('#btnStart').classList.toggle('hidden',!host);
  $('#lobbyWait').classList.toggle('hidden',host);
  const err=host?validate():'';
  $('#btnStart').disabled=!!err;
  $('#lobbyStatus').textContent=err||'';
  if(typeof hubLobby==='function')hubLobby();   // แผงห้องแบบใหม่ (js/62)
}

resize();
applyQuality();
buildWorld('castle');
loadAllMapData();   // ข้อมูลแผนที่จากไฟล์ (เล็ก) — พร้อมให้สุ่ม/เลือกก่อนเริ่มเกม
setScreen('menu');
requestAnimationFrame(frame);
