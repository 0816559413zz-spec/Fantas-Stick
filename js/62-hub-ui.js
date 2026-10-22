// =====================================================================
//  เมนูใหม่ — หน้าจอ/ปุ่ม (ผู้ใช้ 2026-10-22 • สเปก designs/ui-menu.md)
//  ฉาก 3D = js/61 • วงเลือกคาถา = js/63 (skwOpen) • เลือกแผนที่แบบการ์ดโค้ง = js/64 (mpkOpen) • สไตล์ = css/hub.css
//  เมนูแรก (ชื่อเกมซ้ายบน + เล่น/เข้าห้องเพื่อน + ปุ่มเล็กซ้ายล่าง) → กดเล่น: ตัวละครหยิบไม้มาโพส → การ์ดโหมด 4 ใบ (ส่วนล่างของจอ)
//  → กดการ์ด: พื้นหลังเฟดดำ การ์ดพลิกแล้วขยายเป็นแผงห้อง (ห้องออนไลน์อัตโนมัติ) → ล็อบบี้แท่นวงเวท (ทุกคนยืนโชว์ด้านขวา)
//  ปุ่มเดิม (#btnSettings #btnGuide #btnMyMusic #btnStart #btnTeam #btnCopy …) ยังอยู่ — UI ใหม่เรียกใช้ปุ่มเหล่านั้น
// =====================================================================
// ภาพการ์ด/แผนที่: URL เต็ม — url() ใน CSS var อ่านเทียบไฟล์ css/hub.css ไม่ใช่หน้าเว็บ (เดิมชี้ css/assets/... = ภาพไม่ขึ้น)
const HUI_IMG=new URL('assets/ui/',location.href).href;
const HMODES=[
  {k:'ffa',en:'Free For All',th:'ทุกคนคือศัตรู',d:'ใครได้ 10 kill ก่อน ชนะ',n:'2–6'},
  {k:'tdm',en:'Team PvP',th:'สองทีมปะทะกัน',d:'ทีมแรกที่ได้ 15 kill ชนะ',n:'2–6'},
  {k:'coop',en:'Dungeon',th:'ร่วมมือฝ่าดันเจียน',d:'ฝ่าทีละชั้น บอสทุก 5 ชั้น',n:'1–6'},
  {k:'train',en:'Training',th:'ห้องฝึกคาถา',d:'หุ่นซ้อม ลองคาถา ปิดคูลดาวน์ได้',n:'1–6'}];
const HUI={st:'',mode:'ffa',hostT:0,flip:null,pend:false,shown:false};
// ไอคอนเส้นบาง (SVG) — กรอบหกเหลี่ยม + ไอคอนโหมด / ปุ่มเล็ก
const HICO={
  ffa:'<path d="M50 30v40M30 50h40M36 36l28 28M64 36L36 64"/><circle cx="50" cy="50" r="7"/>',
  tdm:'<path d="M36 34l-8 4v12c0 9 6 15 8 16 2-1 8-7 8-16V38z"/><path d="M64 34l-8 4v12c0 9 6 15 8 16 2-1 8-7 8-16V38z"/><path d="M45 60l10-10M45 50l10 10"/>',
  coop:'<path d="M36 68V46a14 14 0 0 1 28 0v22z"/><path d="M50 52v8"/><circle cx="50" cy="50" r="2.5"/><path d="M30 68h40"/>',
  train:'<circle cx="50" cy="50" r="18"/><circle cx="50" cy="50" r="10"/><circle cx="50" cy="50" r="2.5"/><path d="M50 26v8M50 66v8M26 50h8M66 50h8"/>',
  set:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"/><circle cx="12" cy="12" r="6.4"/>',
  look:'<path d="M4 19h16"/><path d="M7 19l4.2-14.5c.2-.7 1.2-.7 1.4 0L17 19"/><path d="M8.6 14h6.8"/><path d="M13 4.5l3-1.5"/>',
  guide:'<path d="M4 5.5c2.6-1.2 5.3-1.2 8 .6 2.7-1.8 5.4-1.8 8-.6V19c-2.6-1.2-5.3-1.2-8 .6-2.7-1.8-5.4-1.8-8-.6z"/><path d="M12 6.1v13.5"/>',
  music:'<path d="M9 17.5V5.5l10-2v12"/><circle cx="7" cy="17.5" r="2.2"/><circle cx="17" cy="15.5" r="2.2"/>',
  prog:'<path d="M12 3l2.6 5.5 6 .8-4.4 4.1 1.1 6L12 16.6 6.7 19.4l1.1-6L3.4 9.3l6-.8z"/>',
  mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  back:'<path d="M15 5l-7 7 7 7"/>',
  // ไอคอนปุ่มเมนูแรก (สเกล 100 ใส่ในหกเหลี่ยม): ไม้กายสิทธิ์ + ประกาย • ประตูโค้ง
  play:'<path d="M33 69l29-29"/><path d="M30 72l4-4" stroke-width="5"/><path d="M68 25c1 6 3 8 9 9-6 1-8 3-9 9-1-6-3-8-9-9 6-1 8-3 9-9z"/><path d="M45 33v5M42.5 35.5h5M74 52v4M72 54h4"/>',
  join:'<path d="M37 70V45a13 13 0 0 1 26 0v25"/><path d="M31 70h38"/><path d="M44 56h12M52 51l5 5-5 5"/>',
  crown:'<path d="M4 17l-1-9 5 4 4-7 4 7 5-4-1 9z"/>',
  spells:'<path d="M12 2.8l8.6 6.3-3.3 10.1H6.7L3.4 9.1z"/><path d="M12 7.6l4 2.9-1.5 4.7h-5L8 10.5z"/>'};
const hSvg=(k,vb)=>`<svg viewBox="${vb||'0 0 24 24'}" fill="none" stroke="currentColor" stroke-width="${vb?2:1.4}" stroke-linecap="round" stroke-linejoin="round">${HICO[k]}</svg>`;
const hHex=k=>`<svg class="hx" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linejoin="round"><polygon class="o" points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/><polygon class="i" points="50,11 84,30.5 84,69.5 50,89 16,69.5 16,30.5"/><g class="g" stroke-width="2" stroke-linecap="round">${HICO[k]}</g></svg>`;
const H_STAR='<svg viewBox="0 0 24 24"><path d="M12 0C12.8 8 16 11.2 24 12 16 12.8 12.8 16 12 24 11.2 16 8 12.8 0 12 8 11.2 11.2 8 12 0z" fill="currentColor"/></svg>';

document.body.insertAdjacentHTML('beforeend',`
<div id="hub">
  <div id="hFade"></div>
  <div class="hMenu" id="hMenu">
    <div class="hTitle">
      <div class="hStars"><i>${H_STAR}</i><i class="b">${H_STAR}</i><i class="d">${H_STAR}</i></div>
      <h1><span>Fantas</span> <span>Stick</span></h1>
      <div class="hRule"><i></i><b>${H_STAR}</b><i></i></div>
      <div class="hSub"><b>Four Elements · One Arena</b><small>Pick your element, build your spellbook, and duel your friends online.</small></div>
    </div>
    <nav class="hNav">
      <button class="hItem big" id="hPlay"><i class="hIc">${hHex('play')}</i><em><b>I</b>PLAY</em><span>เล่น<i class="hArr">${hSvg('back')}</i></span><small>เลือกโหมด แล้วเริ่มดวล</small></button>
      <div class="hItem" id="hJoin"><button class="hJoinB" id="hJoinB"><i class="hIc">${hHex('join')}</i><em><b>II</b>JOIN</em><span>เข้าห้องเพื่อน<i class="hArr">${hSvg('back')}</i></span><small>ใส่รหัสห้อง 5 ตัวจากเพื่อน</small></button>
        <div class="hCode"><input id="hCode" maxlength="5" placeholder="รหัสห้อง" autocomplete="off" spellcheck="false"><button id="hCodeGo" aria-label="เข้าห้อง">${hSvg('back')}</button></div></div>
    </nav>
    <div class="hStatus" id="hStatus"></div>
    <div class="hDock">
      <button class="hMe" id="hMe"></button>
      <div class="hIcons">
        <button data-h="set" aria-label="ตั้งค่า">${hSvg('set')}<i>ตั้งค่า</i></button>
        <button data-h="look" aria-label="แต่งตัวละคร">${hSvg('look')}<i>แต่งตัวละคร</i></button>
        <button data-h="guide" aria-label="คู่มือ">${hSvg('guide')}<i>คู่มือ</i></button>
        <button data-h="music" aria-label="เพลงของฉัน">${hSvg('music')}<i>เพลงของฉัน</i></button>
        <button data-h="prog" aria-label="เลเวลและสถิติ">${hSvg('prog')}<i>เลเวล & สถิติ</i></button>
      </div>
    </div>
  </div>
  <div class="hModes" id="hModes">
    <div class="hGrid"><i></i></div>
    <button class="hBack" id="hModesBack">${hSvg('back')}<span>กลับ</span></button>
    <div class="hModeHead"><b>SELECT MODE</b><span>เลือกโหมด</span></div>
    <div class="hCards" id="hCards">${HMODES.map((m,i)=>`
      <button class="hCard" data-mode="${m.k}" style="--i:${i};--bg:url('${HUI_IMG}modes/${m.k}.jpg')">
        <span class="cBg"></span><span class="cShade"></span><span class="cSweep"></span>
        <span class="cHex">${hHex(m.k)}</span>
        <span class="cTxt"><b>${m.en}</b><i>${m.th}</i><small>${m.d}</small></span>
        <span class="cN">${m.n} คน</span><span class="cCorner"></span>
      </button>`).join('')}</div>
  </div>
  <!-- ปุ่มรอบจอหน้าเลือกโหมด (ผู้ใช้ 2026-10-23 "เพิ่มปุ่มรอบๆ จอ") ⚠ Claude เลือกปุ่มเอง -->
  <div class="hMx" id="hMx">
    <div class="mxTop"><button class="hMe mxMe" id="hMxMe"></button>
      <button class="mxIc" data-mx="set" aria-label="ตั้งค่า">${hSvg('set')}<i>ตั้งค่า</i></button>
      <button class="mxIc" data-mx="music" aria-label="เพลงของฉัน">${hSvg('music')}<i>เพลงของฉัน</i></button></div>
    <div class="mxBL">
      <button class="mxPill" data-mx="spells">${hSvg('spells')}<span>จัดคาถา<small>GRIMOIRE</small></span></button>
      <button class="mxPill" data-mx="look">${hSvg('look')}<span>แต่งตัว<small>WARDROBE</small></span></button>
      <button class="mxPill" data-mx="guide">${hSvg('guide')}<span>คู่มือ<small>GUIDE</small></span></button>
      <button class="mxPill" data-mx="prog">${hSvg('prog')}<span>เลเวล<small>PROGRESS</small></span></button></div>
    <div class="mxBR"><label class="mxJoin"><span>เข้าห้องเพื่อน<small>JOIN BY CODE</small></span><input id="hMxCode" maxlength="5" placeholder="รหัส 5 ตัว" autocomplete="off" spellcheck="false"><button id="hMxGo" aria-label="เข้าห้อง">${hSvg('back')}</button></label></div>
  </div>
  <div class="hRoom" id="hRoom"></div>
  <div class="hGo" id="hGo"></div>
</div>`);
$('#hMe').onclick=()=>{ac();openCreator(false);};

// ---------- สถานะหน้าจอ: menu / modes / room / off ----------
function hubUiState(s){
  if(HUI.st===s)return;const prev=HUI.st;HUI.st=s;
  const b=document.body;
  b.classList.toggle('hS-menu',s==='menu');b.classList.toggle('hS-modes',s==='modes');b.classList.toggle('hS-room',s==='room');b.classList.toggle('hS-go',s==='go');
  if(s==='menu'){hubMeChip();}
  if(s==='modes'){const cs=[...document.querySelectorAll('.hCard')];cs.forEach(c=>c.classList.remove('pick','away'));hubMeChip();}
  if(s==='room'&&prev!=='flip')hubLobby();
}
function hubMeChip(){
  let lv='';try{lv='Lv '+progLv().L;}catch(e){}
  const P=PATHS[parseKit(myKit).path]||PATHS[0];
  $('#hMe').innerHTML=$('#hMxMe').innerHTML=`<span class="em">${icoHTML('p_'+P.id,P.col,18)}</span><span class="nm">${esc(myName())}</span><span class="lv">${lv}</span>`;
}
// เรียกจาก setScreen (js/19)
function hubOnScreen(s){
  if(!HUB.on)return;
  document.body.classList.add('hub');
  if(s!=='lobby'){const r=$('#hRoom');if(r)r.classList.remove('on');const g=$('#hGo');if(g)g.classList.remove('on');}
  if(s==='game'){document.body.classList.remove('hubOn');HUI.st='';['hS-menu','hS-modes','hS-room','hS-go'].forEach(c=>document.body.classList.remove(c));hubFlipKill();return;}
  if(s==='lobby'){const fl=HUI.st==='flip';if(!fl)hubUiState('room');if(HUI.pend){HUI.pend=false;if(!fl)setTimeout(()=>$('#hFade').classList.remove('on'),260);}return;}
  if(s==='menu'&&!HUI.st)hubUiState(HUB.st==='modes'?'modes':'menu');
}

// ---------- เมนูแรก ----------
$('#hPlay').onclick=()=>{ac();if(!HUB.me){toast('กำลังโหลดตัวละคร...');return;}if(hubGo())hubUiState('go');};
$('#hJoinB').onclick=()=>{ac();snd('ui_click');$('#hJoin').classList.toggle('open');if($('#hJoin').classList.contains('open'))setTimeout(()=>$('#hCode').focus(),180);};
const hubJoinGo=()=>{const v=($('#hCode').value||'').trim().toUpperCase();if(v.length!==5){$('#hCode').classList.remove('bad');void $('#hCode').offsetWidth;$('#hCode').classList.add('bad');return;}
  store('wd_name',myName());HUI.pend=true;joinGame(v);};
$('#hCodeGo').onclick=hubJoinGo;
$('#hCode').addEventListener('keydown',e=>{if(e.key==='Enter')hubJoinGo();e.stopPropagation();});
$('#hCode').addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'');});
document.querySelector('.hIcons').addEventListener('click',e=>{const b=e.target.closest('[data-h]');if(!b)return;ac();snd('ui_click');
  const k=b.dataset.h;
  if(k==='set')openSettings();else if(k==='look')openCreator(false);else if(k==='guide')$('#btnGuide').click();
  else if(k==='music')$('#btnMyMusic').click();else if(k==='prog')progOpen();});
document.addEventListener('mouseover',e=>{const b=e.target.closest&&e.target.closest('.hItem>button,.hItem.big,.hIcons button,.hCard,.hRoom button,.hGo button,.hBack');if(b&&b!==HUI.hov){HUI.hov=b;try{snd('ui_hover',{vol:0.25});}catch(_){}}});

// ---------- การ์ดโหมด ----------
$('#hModesBack').onclick=()=>{if(HUI.leaving||HUI.st!=='modes')return;snd('ui_click');HUI.leaving=true;document.body.classList.add('hS-leave');
  setTimeout(()=>{document.body.classList.remove('hS-leave');HUI.leaving=false;hubUiState('go');hubBack();},460);};
$('#hMxMe').onclick=()=>{ac();openCreator(false);};
$('#hMx').addEventListener('click',e=>{const b=e.target.closest('[data-mx]');if(!b)return;ac();snd('ui_click');const k=b.dataset.mx;
  if(k==='set')openSettings();else if(k==='music')$('#btnMyMusic').click();else if(k==='spells')skwOpen();else if(k==='look')openCreator(false);
  else if(k==='guide')$('#btnGuide').click();else if(k==='prog')progOpen();});
const hubMxJoin=()=>{const i=$('#hMxCode'),v=(i.value||'').trim().toUpperCase();if(v.length!==5){i.classList.remove('bad');void i.offsetWidth;i.classList.add('bad');return;}
  store('wd_name',myName());HUI.pend=true;joinGame(v);};
$('#hMxGo').onclick=e=>{e.preventDefault();hubMxJoin();};
$('#hMxCode').addEventListener('keydown',e=>{if(e.key==='Enter')hubMxJoin();e.stopPropagation();});
$('#hMxCode').addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'');});
$('#hCards').addEventListener('click',e=>{const c=e.target.closest('.hCard');if(!c||HUI.st!=='modes')return;hubPickMode(c.dataset.mode,c);});
addEventListener('keydown',e=>{
  if(e.code!=='Escape'||screen!=='menu'||crOpen)return;
  if(!$('#settings').classList.contains('hidden')||!$('#guide').classList.contains('hidden'))return;
  if(document.getElementById('skw')&&document.getElementById('skw').classList.contains('on'))return;
  if(HUI.st==='modes'){$('#hModesBack').click();}
  else if(HUI.st==='menu'&&$('#hJoin').classList.contains('open'))$('#hJoin').classList.remove('open');
});
function hubPickMode(k,card){
  ac();snd('portal',{vol:0.5});HUI.mode=k;HUI.st='flip';
  document.body.classList.remove('hS-modes');document.body.classList.add('hS-flip');
  document.querySelectorAll('.hCard').forEach(c=>c.classList.toggle('away',c!==card));
  $('#hFade').classList.add('on');
  hubFlip(card,k);
  // เปิดห้องออนไลน์อัตโนมัติ (ไม่มีเน็ต/ต่อไม่ได้ใน 7 วิ = เล่นคนเดียว)
  store('wd_name',myName());HUI.pend=true;HUI.want=k;
  const fall=()=>{if(screen==='lobby')return;try{NET.peer&&NET.peer.destroy();}catch(_){}NET.peer=null;hostGame(false);toast('ต่ออินเทอร์เน็ตไม่ได้ — เล่นแบบออฟไลน์');};
  if(typeof Peer==='undefined')setTimeout(fall,500);
  else{hostGame(true);clearTimeout(HUI.hostT);HUI.hostT=setTimeout(fall,7000);}
}
// การ์ดพลิก + ขยายเป็นแผงห้อง (ใช้ element ลอยชั่วคราว แล้วสลับเป็นแผงจริงตอนจบ)
function hubFlipKill(){if(HUI.flip){HUI.flip.remove();HUI.flip=null;}document.body.classList.remove('hS-flip');}
function hubRoomRect(){const W=innerWidth,H=innerHeight,w=Math.min(Math.max(W*0.44,460),780),l=Math.max(16,W*0.035),t=Math.max(16,H*0.05);return {l,t,w,h:H-t*2};}
function hubFlip(card,k){
  hubFlipKill();
  const r=card.getBoundingClientRect(),T=hubRoomRect(),m=HMODES.find(x=>x.k===k);
  const f=document.createElement('div');f.className='hFlip';
  f.innerHTML=`<div class="fIn"><div class="fFront" style="--bg:url('${HUI_IMG}modes/${k}.jpg')"><span class="cBg"></span><span class="cShade"></span><span class="cHex">${hHex(k)}</span><span class="cTxt"><b>${m.en}</b><i>${m.th}</i></span></div>
    <div class="fBack"><span class="fx">${hHex(k)}</span><b>${m.en}</b><i>กำลังเปิดห้อง…</i></div></div>`;
  Object.assign(f.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
  document.body.appendChild(f);HUI.flip=f;card.style.visibility='hidden';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    f.classList.add('go');Object.assign(f.style,{left:T.l+'px',top:T.t+'px',width:T.w+'px',height:T.h+'px'});
  }));
  HUI.flipT=performance.now();
  setTimeout(()=>{card.style.visibility='';HUI.flipDone=true;if(screen==='lobby'){hubFlipEnd();}},950);
}
// ย้อนการพลิก: แผงห้อง → หดเป็นการ์ดที่ช่องเดิม หมุนกลับด้านหน้า → เฟดดำ แล้วเรียก done (รีโหลดไปหน้าการ์ดโหมด)
function hubUnflip(done){
  if(HUI.unflip)return;HUI.unflip=true;
  const card=document.querySelector('.hCard[data-mode="'+(LOBBY&&LOBBY.mode||HUI.mode)+'"]')||document.querySelector('.hCard');
  const k=card?card.dataset.mode:'ffa',m=HMODES.find(x=>x.k===k)||HMODES[0],R=$('#hRoom').getBoundingClientRect(),r=card?card.getBoundingClientRect():{left:innerWidth/2-90,top:innerHeight*0.6,width:180,height:240};
  const f=document.createElement('div');f.className='hFlip go';
  f.innerHTML=`<div class="fIn"><div class="fFront" style="--bg:url('${HUI_IMG}modes/${k}.jpg')"><span class="cBg"></span><span class="cShade"></span><span class="cHex">${hHex(k)}</span><span class="cTxt"><b>${m.en}</b><i>${m.th}</i></span></div>
    <div class="fBack"><span class="fx">${hHex(k)}</span><b>${m.en}</b><i>ออกจากห้อง…</i></div></div>`;
  Object.assign(f.style,{left:R.left+'px',top:R.top+'px',width:R.width+'px',height:R.height+'px'});
  document.body.appendChild(f);document.body.classList.add('hS-unflip');snd('portal',{vol:0.4});
  requestAnimationFrame(()=>requestAnimationFrame(()=>{f.classList.remove('go');Object.assign(f.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});}));
  setTimeout(()=>$('#hFade').classList.add('on'),900);
  setTimeout(done,1320);
}
function hubFlipEnd(){
  if(!HUI.flip)return;
  HUI.st='';hubUiState('room');hubLobby();
  const f=HUI.flip;f.classList.add('fade');setTimeout(()=>{if(HUI.flip===f){f.remove();HUI.flip=null;}document.body.classList.remove('hS-flip');},260);
  setTimeout(()=>$('#hFade').classList.remove('on'),120);
}

// ---------- แผงห้อง (การ์ดที่ขยายแล้ว) ----------
const HUI_MAPN=k=>k&&MAPS[k]?MAPS[k].name.replace(/^[^\p{L}\p{N}]+/u,'').trim():'สุ่มแผนที่';
function hubLobby(){
  const L=LOBBY,el=$('#hRoom');if(!L||!el)return;
  if(HUI.st==='flip'){if(HUI.flipDone)hubFlipEnd();else return;}
  if(NET.isHost&&HUI.want&&G&&G.ph==='lobby'&&G.mode!==HUI.want){G.mode=HUI.want;HUI.want=null;clearTimeout(HUI.hostT);broadcastLobby();return;}
  if(NET.isHost)clearTimeout(HUI.hostT);
  const host=NET.isHost,M=MODES[L.mode]||MODES.coop,hm=HMODES.find(x=>x.k===L.mode)||{k:L.mode,en:modeTitle(M),th:'',d:M.d};
  const team=!!M.team,me=L.players.find(p=>p.id===NET.myId);
  const K=parseKit(myKit),P=PATHS[K.path]||PATHS[0],ult=SPELL_LIST[K.ult];
  const fixed=M.map?M.map:null,mk=fixed||L.mpk||'',img=mk?`url('${HUI_IMG}maps/${mk}.jpg')`:'none';
  const err=host?validate():'';
  const plRow=p=>{const kk=parseKit(p.kt!==undefined?p.kt:'0'),pp=PATHS[kk.path]||PATHS[0];return `<div class="pl ${p.id===NET.myId?'me':''}"><span class="em">${icoHTML('p_'+pp.id,pp.col,18)}</span><span class="nm">${esc(p.n)}</span>${p.id===L.host?`<span class="cr" title="โฮสต์">${hSvg('crown')}</span>`:''}${speakingIds().has(p.id)?'<span class="spk">♪</span>':''}</div>`;};
  const slots=L.online?Math.max(0,(M.max||6)-L.players.length):0;
  const players=team?`<div class="teams">${[0,1].map(t=>`<div class="tm t${t}"><h4><i style="background:${TEAMC[t]}"></i>${t?'RED':'BLUE'}<span>${TEAMN[t]}</span></h4>${L.players.filter(p=>p.tm===t).map(plRow).join('')||'<div class="pl empty">ว่าง</div>'}</div>`).join('')}</div>
      <button class="hLink" id="hrTeam">⇄ ย้ายทีม</button>`
    :`<div class="plist">${L.players.map(plRow).join('')}${'<div class="pl empty">รอเพื่อน…</div>'.repeat(Math.min(slots,2))}</div>`;
  el.innerHTML=`
    <div class="rIn">
    <div class="rCorner"></div>
    <header class="rHead">
      <button class="rLeave" id="hrLeave">${hSvg('back')}<span>ออกจากห้อง</span></button>
      <div class="rRoom">${L.online?`<span>ROOM</span><b>${L.code}</b><button id="hrCopy" title="คัดลอกลิงก์เชิญ">${hSvg('link')}<i>ลิงก์เชิญ</i></button>`:'<span>OFFLINE</span><b class="off">เล่นคนเดียว</b>'}</div>
    </header>
    <div class="rTitle">
      <span class="rHex">${hHex(hm.k in HICO?hm.k:'ffa')}</span>
      <div><h2>${hm.en}</h2><p>${hm.th}${hm.th?' · ':''}${M.d}</p></div>
    </div>
    ${host?`<div class="rModes">${HMODES.map(m=>`<button class="${m.k===L.mode?'on':''}" data-rmode="${m.k}" title="${m.en}">${hHex(m.k)}<span>${m.en}</span></button>`).join('')}</div>`:''}
    <section class="rSec"><h3><span>PLAYERS</span><em>${L.players.length} / ${M.max||6}</em></h3>${players}</section>
    <section class="rSec rKit">
      <h3><span>LOADOUT</span><em>ชุดคาถาของคุณ</em></h3>
      <button class="kitBox" id="hrKit">
        <span class="kEm" style="--c:${P.col}">${icoHTML('p_'+P.id,P.col,34)}</span>
        <span class="kNm"><b>${P.n}</b><small>คลิกเพื่อเลือกสาย / คาถา</small></span>
        <span class="kSl">${K.ids.map((id,i)=>{const S=SPELL_LIST[id],c=PATHS[S.path].col;return `<span class="pg" style="--c:${c}"><svg viewBox="0 0 100 100"><polygon points="50,4 96,38 78,94 22,94 4,38"/></svg>${icoHTML(S.id,c,24)}<i>${keyName(KEYS[SLOTK[i]]||'Key'+'QERF'[i])}</i></span>`;}).join('')}
          <span class="pg ult" style="--c:${P.col}"><svg viewBox="0 0 100 100"><polygon points="50,4 96,38 78,94 22,94 4,38"/></svg>${ult?icoHTML(ult.id,P.col,24):''}<i>${keyName(KEYS.ult||'KeyX')}</i></span></span>
      </button>
      <button class="hLink" id="hrLook">แต่งตัวละคร</button>
    </section>
    <div class="rGrow"></div>
    <footer class="rFoot">
      <div class="rSet">
        ${L.online?`<button class="tog ${VOICE.on?'on':''}" id="hrMic">${hSvg('mic')}<span>${VOICE.on?'ไมค์เปิด':'ไมค์ปิด'}</span><i></i></button>
        <button class="sel" id="hrPtt">${VOICE.ptt?'กดค้าง V พูด':'เปิดไมค์ตลอด'}</button>
        ${team?`<button class="sel ${VOICE.teamOnly?'on':''}" id="hrTeamVoice">${VOICE.teamOnly?'คุยเฉพาะทีม':'คุยทุกคน'}</button>`:''}`:''}
        <button class="ico" id="hrSet" title="ตั้งค่า">${hSvg('set')}</button>
      </div>
    </footer>
    </div>`;
  $('#hGo').innerHTML=`
      <div class="rGo">
        <button class="mapBtn ${fixed||!host?'fixed':''}" id="hrMap" style="--img:${img}">
          <span class="mImg"></span><span class="mShade"></span>
          <b>${HUI_MAPN(mk)}</b><small>${fixed?'แผนที่ประจำโหมด':host?'Change map':'โฮสต์เป็นคนเลือก'}</small>
        </button>
        ${host?`<button class="startBtn" id="hrStart" ${err?'disabled':''}><span>เริ่มเกม</span><em>START</em></button>`:'<div class="waitTxt">รอโฮสต์เริ่มเกม<i></i></div>'}
      </div>
      <div class="rErr">${err||''}</div>`;
  $('#hGo').classList.add('on');
  if(!el.classList.contains('on')){el.classList.add('on','anim');clearTimeout(HUI.animT);HUI.animT=setTimeout(()=>el.classList.remove('anim'),900);}
  const R=hubRoomRect();Object.assign(el.style,{left:R.l+'px',top:R.t+'px',width:R.w+'px',height:R.h+'px'});
}
addEventListener('resize',()=>{if(HUI.st==='room')hubLobby();});
const hubRoomClick=e=>{
  const b=e.target.closest('button');if(!b)return;ac();snd('ui_click');
  const id=b.id;
  if(id==='hrLeave'){try{sessionStorage.setItem('wd_hub','modes');}catch(_){}hubUnflip(()=>leave());return;}
  if(id==='hrCopy'){$('#btnCopy').click();return;}
  if(id==='hrTeam'){$('#btnTeam').click();return;}
  if(id==='hrKit'){skwOpen();return;}
  if(id==='hrLook'){openCreator(false);return;}
  if(id==='hrSet'){openSettings();return;}
  if(id==='hrMic'){toggleMic().then(()=>hubLobby());return;}
  if(id==='hrPtt'){VOICE.ptt=!VOICE.ptt;$('#micMode').value=VOICE.ptt?'ptt':'open';hubLobby();return;}
  if(id==='hrTeamVoice'){VOICE.teamOnly=!VOICE.teamOnly;$('#teamOnly').checked=VOICE.teamOnly;hubLobby();return;}
  if(id==='hrStart'){if(NET.isHost)hostStart();setTimeout(hubLobby,50);return;}
  if(id==='hrMap'){const L=LOBBY,M=MODES[L.mode];if(!NET.isHost||M.map)return;
    mpkOpen({cur:L.mpk||'',mode:L.mode,onPick:k=>{if(NET.isHost&&G&&G.ph==='lobby'){G.mapPick=k;broadcastLobby();}}});return;}
  const rm=b.dataset.rmode;if(rm&&NET.isHost&&G&&G.ph==='lobby'&&G.mode!==rm){G.mode=rm;broadcastLobby();}
};
$('#hRoom').addEventListener('click',hubRoomClick);$('#hGo').addEventListener('click',hubRoomClick);
// วงเลือกคาถา (js/63) เรียกตอนเปลี่ยนชุดคาถา
function hubKitChanged(){hubMeChip();if(HUI.st==='room')hubLobby();}

// ---------- เริ่มต้น ----------
document.body.classList.add('hub');
hubUiState('menu');
// ออกจากห้องแล้วกลับมา = ข้ามฉากเปิด ไปหน้าการ์ดโหมดเลย
try{if(sessionStorage.getItem('wd_hub')==='modes'&&!/[?&](join|studio)\b/.test(location.search)){sessionStorage.removeItem('wd_hub');$('#intro').classList.add('gone');STAGE.introT=1;
  const wait=setInterval(()=>{if(HUB.me||!HUB.on){clearInterval(wait);if(hubSnapModes())hubUiState('modes');}},120);}}catch(e){}
if(typeof WD!=='undefined')Object.assign(WD,{HUI,hubUiState,hubLobby,hubPickMode});
