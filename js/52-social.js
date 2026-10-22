// =====================================================================
//  เล่นกับเพื่อน (ผู้ใช้ 2026-10-22): แชท + อีโมต + ดูเพื่อนเล่น (spectator) + ป้ายต่อเน็ตใหม่
//  ฝั่งโฮสต์ (รับ/ส่งต่อแชท อีโมต ต่อกลับเข้าห้อง เข้ากลางเกม) อยู่ใน js/11-host.js • ฝั่งต่อใหม่ของลูกข่ายอยู่ใน js/10-net.js
// =====================================================================

// ---------- แชท: Enter = พิมพ์ / Enter อีกที = ส่ง / Esc = ปิด • ข้อความขึ้นมุมซ้ายล่าง + ฟองบนหัว 4 วิ ----------
const CHAT={log:[],open:false,bub:{},last:0};
(function chatDom(){
  const box=document.createElement('div');box.id='chatBox';
  box.innerHTML='<div id="chatLog"></div><input id="chatIn" maxlength="120" placeholder="พิมพ์ข้อความ... (Enter ส่ง / Esc ปิด)" autocomplete="off">';
  document.body.appendChild(box);
  const st=document.createElement('style');
  st.textContent=`#chatBox{position:fixed;left:14px;bottom:200px;width:min(380px,70vw);z-index:7;pointer-events:none;font:500 14px Kanit,sans-serif}
#chatLog{display:flex;flex-direction:column;gap:3px;max-height:220px;overflow:hidden;justify-content:flex-end}
#chatLog div{background:rgba(6,8,18,.55);color:#f2efe6;padding:3px 9px;border-radius:6px;text-shadow:0 1px 2px #000;transition:opacity .6s;width:fit-content;max-width:100%;overflow-wrap:anywhere}
#chatLog div b{margin-right:6px}#chatLog div.sys{color:#c8c2ff}#chatLog div.old{opacity:0}#chatBox.on #chatLog div.old{opacity:.85}
#chatIn{display:none;margin-top:6px;width:100%;box-sizing:border-box;background:rgba(6,8,18,.85);color:#fff;border:1px solid rgba(232,196,104,.6);border-radius:6px;padding:6px 9px;font:inherit;pointer-events:auto;outline:none}
#chatBox.on #chatIn{display:block}`;
  document.head.appendChild(st);
  const inp=box.querySelector('#chatIn');
  inp.addEventListener('keydown',e=>{
    e.stopPropagation();
    if(e.key==='Enter'){const m=inp.value.trim();if(m)chatSend(m);inp.value='';chatClose();e.preventDefault();}
    else if(e.key==='Escape'){inp.value='';chatClose();e.preventDefault();}
  });
})();
function chatOpen(){
  if(CHAT.open)return;CHAT.open=true;$('#chatBox').classList.add('on');
  INPUT.u=INPUT.d=INPUT.l=INPUT.r=INPUT.fire=INPUT.sh=INPUT.jh=INPUT.ch=INPUT.dh=0;
  setTimeout(()=>{try{$('#chatIn').focus();}catch(e){}},0);
}
function chatClose(){CHAT.open=false;$('#chatBox').classList.remove('on');try{$('#chatIn').blur();}catch(e){}}
// Enter เปิดช่องพิมพ์ (ในล็อบบี้/ในเกม) — ดักก่อน js/17 (capture) และไม่ยุ่งตอนพิมพ์ช่องอื่นอยู่
addEventListener('keydown',e=>{
  if(e.key!=='Enter'||CHAT.open||e.repeat)return;
  if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT'))return;
  if((screen!=='game'&&screen!=='lobby')||!NET.online&&!NET.isHost)return;
  if(screen==='game'&&crOpen)return;
  e.preventDefault();chatOpen();
},true);
function chatSend(m){
  m=String(m).slice(0,120);
  if(NET.isHost){chatRelay(NET.myId,m);return;}
  hostSend({t:'chat',m});
}
function chatAdd(html,sys){
  const L=$('#chatLog');if(!L)return;const d=document.createElement('div');if(sys)d.className='sys';d.innerHTML=html;L.appendChild(d);
  while(L.children.length>8)L.removeChild(L.firstChild);
  setTimeout(()=>d.classList.add('old'),10000);
}
function escH(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function onChat(d){
  chatAdd(`<b style="color:${escH(d.c||'#e8c468')}">${escH(d.n||'?')}</b>${escH(d.m)}`);
  CHAT.bub[d.id]={m:String(d.m),t:performance.now()};
  try{snd('ui',{vol:0.25});}catch(e){}
}
// ฟองข้อความบนหัว (4 วิ) + ไอคอนอีโมต
function drawSocial(P,me,dt,now){
  const t=performance.now();
  for(const p of P){
    const b=CHAT.bub[p.id],eo=EMO.show[p.id];
    if(!b&&!eo)continue;
    const s=toScreen(p.x,(p.z||0)+3.05,p.y);if(!s)continue;
    let y=s[1];
    if(eo){const age=(t-eo.t)/1000;if(age>2.6)delete EMO.show[p.id];else{
      const a=Math.min(1,age/0.15)*(age>2.2?1-(age-2.2)/0.4:1),bob=Math.sin(age*7)*3,E=EMOS[eo.e];
      cx.save();cx.globalAlpha=a;cx.textAlign='center';cx.textBaseline='middle';
      if(E[1]==='GG'){cx.font='800 26px Kanit,sans-serif';cx.lineWidth=4;cx.strokeStyle='rgba(0,0,0,.7)';cx.strokeText('GG',s[0],y-14+bob);cx.fillStyle='#ffe27a';cx.fillText('GG',s[0],y-14+bob);}
      else{cx.font='30px sans-serif';cx.fillText(E[1],s[0],y-14+bob);}
      cx.restore();y-=36;}}
    if(b){const age=(t-b.t)/1000;if(age>4){delete CHAT.bub[p.id];continue;}
      const a=age>3.5?1-(age-3.5)/0.5:1,txt=b.m.length>34?b.m.slice(0,33)+'…':b.m;
      cx.save();cx.globalAlpha=a;cx.font='500 13px Kanit,sans-serif';cx.textAlign='center';cx.textBaseline='middle';
      const w=cx.measureText(txt).width+16,h=22,x0=s[0]-w/2,y0=y-h-6;
      cx.fillStyle='rgba(250,247,238,.92)';cx.beginPath();if(cx.roundRect)cx.roundRect(x0,y0,w,h,8);else cx.rect(x0,y0,w,h);cx.fill();
      cx.beginPath();cx.moveTo(s[0]-5,y0+h);cx.lineTo(s[0],y0+h+6);cx.lineTo(s[0]+5,y0+h);cx.fill();
      cx.fillStyle='#1d1a24';cx.fillText(txt,s[0],y0+h/2+1);cx.restore();}
  }
  drawEmoWheel();drawSpecHint(P,me);drawNetBanner();drawPing();
}
// ปิงมุมซ้ายบน (ลูกข่ายเท่านั้น): เขียว <80 / เหลือง <150 / แดง
function drawPing(){
  if(NET.isHost||!NET.online||!NET.rtt)return;const r=Math.round(NET.rtt);
  cx.save();cx.font='600 12px Kanit,sans-serif';cx.textAlign='left';cx.textBaseline='top';cx.fillStyle='rgba(0,0,0,.6)';cx.fillText('ปิง '+r+' ms',11,SET.fps?27:9);
  cx.fillStyle=r<80?'#9fe0a0':r<150?'#ffe27a':'#ff8a6a';cx.fillText('ปิง '+r+' ms',10,SET.fps?26:8);cx.restore();
}

// ---------- อีโมต: กด Z ค้าง → วงล้อ 6 แบบ ลากเมาส์ไปทางที่ต้องการ ปล่อย Z = เล่นท่า ----------
const EMOS=[['wave','👋','โบกมือ'],['dance','💃','เต้น'],['laugh','😂','หัวเราะ'],['angry','😠','โกรธ'],['gg','GG','GG'],['thumb','👍','เยี่ยม']];
const EMO={open:false,vx:0,vy:0,sel:-1,show:{},last:0};
addEventListener('keydown',e=>{
  if(e.code!==(KEYS.emote||'KeyZ')||e.repeat||CHAT.open||screen!=='game')return;
  if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'))return;
  const me=myPos();if(!me||!me.al||me.dn)return;
  EMO.open=true;EMO.vx=EMO.vy=0;EMO.sel=-1;
});
addEventListener('keyup',e=>{
  if(e.code!==(KEYS.emote||'KeyZ')||!EMO.open)return;
  EMO.open=false;if(EMO.sel<0)return;
  if(performance.now()-EMO.last<1000)return;EMO.last=performance.now();
  if(NET.isHost)emoHost(NET.myId,EMO.sel);else hostSend({t:'emo',e:EMO.sel});
});
addEventListener('mousemove',e=>{
  if(!EMO.open)return;EMO.vx+=e.movementX||0;EMO.vy+=e.movementY||0;
  const l=Math.hypot(EMO.vx,EMO.vy);if(l>140){EMO.vx*=140/l;EMO.vy*=140/l;}
  EMO.sel=l>28?((Math.round(Math.atan2(EMO.vy,EMO.vx)/(Math.PI/3))+6+2)%6):-1;   // 0 = บน แล้ววนตามเข็ม
});
function drawEmoWheel(){
  if(!EMO.open)return;
  const x=SW/2,y=SH/2,R=110;
  cx.save();cx.fillStyle='rgba(6,8,18,.55)';cx.beginPath();cx.arc(x,y,R+40,0,Math.PI*2);cx.arc(x,y,34,0,Math.PI*2,true);cx.fill('evenodd');
  cx.textAlign='center';cx.textBaseline='middle';
  EMOS.forEach((E,i)=>{const a=-Math.PI/2+i*Math.PI/3,ex=x+Math.cos(a)*R,ey=y+Math.sin(a)*R,on=EMO.sel===i;
    if(on){cx.fillStyle='rgba(232,196,104,.35)';cx.beginPath();cx.arc(ex,ey,34,0,Math.PI*2);cx.fill();}
    cx.font=E[1]==='GG'?'800 24px Kanit,sans-serif':'30px sans-serif';cx.fillStyle=E[1]==='GG'?'#ffe27a':'#fff';cx.fillText(E[1],ex,ey-4);
    cx.font='500 12px Kanit,sans-serif';cx.fillStyle=on?'#ffe9a8':'rgba(255,255,255,.75)';cx.fillText(E[2],ex,ey+22);});
  cx.font='500 12px Kanit,sans-serif';cx.fillStyle='rgba(255,255,255,.7)';cx.fillText('ปล่อย Z',x,y);
  cx.restore();
}
// event {k:'emo',id,e} จากโฮสต์ → ไอคอนบนหัว + ท่าบนตัวละคร
function emoFx(ev){const o=PM3.get(ev.id);EMO.show[ev.id]={e:ev.e|0,t:performance.now()};if(o)o.emo={e:ev.e|0,t:0};}
// ท่าอีโมต (เรียกจาก castPose ใน js/35) — คืน true = กำลังเล่นท่า
function emotePose(o,p,dt){
  const m=o.emo;if(!m)return false;m.t+=dt;const t=m.t;if(t>2.4||p.fl||p.dn){o.emo=null;o.b.rotation.z=0;return false;}
  const w=Math.min(1,t/0.2)*(t>2.1?1-(t-2.1)/0.3:1),R=o.armR.rotation,L=o.armL.rotation,B=o.b.rotation,ln=(a,b)=>lerp(a,b,w);
  switch(EMOS[m.e][0]){
    case 'wave':R.x=ln(R.x,-2.8);R.z=ln(R.z,-0.45+Math.sin(t*12)*0.35);B.z=0.06*w;break;
    case 'dance':{const s=Math.sin(t*6);B.y+=s*0.5*w;o.b.position.y+=Math.abs(Math.sin(t*12))*0.12*w;R.x=ln(R.x,-2.5+s*0.6);R.z=ln(R.z,-0.45);L.x=ln(L.x,-2.5-s*0.6);L.z=ln(L.z,0.45);B.z=s*0.12*w;
      if((o.vsp||0)<0.6){o.legs[0].rotation.x=s*0.35*w;o.legs[1].rotation.x=-s*0.35*w;}break;}
    case 'laugh':{const k=Math.sin(t*25);B.x+=(-0.18+k*0.05)*w;o.b.position.y+=k*0.025*w;R.x=ln(R.x,-0.65);R.z=ln(R.z,0.55);L.x=ln(L.x,-0.65);L.z=ln(L.z,-0.55);B.z=0;break;}
    case 'angry':{const k=Math.sin(t*30)*0.04;B.x+=0.22*w;R.x=ln(R.x,0.25+k);R.z=ln(R.z,-0.4);L.x=ln(L.x,0.25-k);L.z=ln(L.z,0.4);B.z=0;
      if((o.vsp||0)<0.6)o.legs[1].rotation.x=(Math.sin(t*14)>0.3?-0.35:0)*w;break;}
    case 'gg':{const k=Math.sin(Math.min(1,t/1.6)*Math.PI);B.x+=0.65*k*w;R.x=ln(R.x,-1.2);R.z=ln(R.z,0.85);L.x=ln(L.x,0.45);L.z=ln(L.z,0.2);B.z=0;break;}
    case 'thumb':R.x=ln(R.x,-1.95);R.z=ln(R.z,-0.12);L.x=ln(L.x,-0.3);B.x+=Math.sin(t*8)*0.05*w;B.z=0;break;
  }
  return true;
}

// ---------- ดูเพื่อนเล่น: ตายแล้ว ≥2 วิ หรือเข้ามาเป็นคนดู → กล้องตามคนอื่น คลิกซ้าย/ขวา = เปลี่ยนคน ----------
const SPEC={id:null,dead:0,on:false};
function specTarget(P,me,dt){
  if(DCAM.on&&me&&!me.al)return null;   // กำลังเล่นกล้องตอนตาย (js/58)
  if(me&&me.al){SPEC.dead=0;SPEC.on=false;return null;}
  if(me)SPEC.dead+=dt;
  if(me&&SPEC.dead<2){SPEC.on=false;return null;}
  const L=P.filter(p=>p.id!==NET.myId&&p.al&&!p.dn);
  if(!L.length){SPEC.on=false;return null;}
  let t=L.find(p=>p.id===SPEC.id);if(!t){t=L[0];SPEC.id=t.id;}
  SPEC.on=true;return t;
}
function specCycle(d){
  const v=VIEW.cur;if(!v)return;const L=v.P.filter(p=>p.id!==NET.myId&&p.al&&!p.dn);if(!L.length)return;
  const i=L.findIndex(p=>p.id===SPEC.id);SPEC.id=L[((i<0?0:i+d)%L.length+L.length)%L.length].id;
}
addEventListener('mousedown',e=>{if(screen==='game'&&SPEC.on&&locked){if(e.button===0)specCycle(1);else if(e.button===2)specCycle(-1);}});
function drawSpecHint(P,me){
  if(!SPEC.on)return;const t=P.find(p=>p.id===SPEC.id);if(!t)return;
  cx.save();cx.textAlign='center';cx.textBaseline='middle';cx.font='600 16px Kanit,sans-serif';
  const s='👁 กำลังดู '+t.n+(NET.spec?' (คนดู)':''),w=cx.measureText(s).width+34;
  cx.fillStyle='rgba(6,8,18,.6)';cx.fillRect(SW/2-w/2,SH-118,w,30);cx.fillStyle='#ffe9a8';cx.fillText(s,SW/2,SH-103);
  cx.font='500 12px Kanit,sans-serif';cx.fillStyle='rgba(255,255,255,.75)';cx.fillText('คลิกซ้าย / ขวา = เปลี่ยนคน',SW/2,SH-78);cx.restore();
}

// ---------- ป้าย "กำลังต่อใหม่..." (ลูกข่ายหลุดจากโฮสต์ js/10 netLost) ----------
function drawNetBanner(){
  if(!(typeof RC!=='undefined'&&RC.on))return;
  const left=Math.max(0,Math.ceil(30-(performance.now()-RC.t0)/1000));
  cx.save();cx.textAlign='center';cx.textBaseline='middle';cx.font='600 18px Kanit,sans-serif';
  const s='📶 เน็ตหลุด — กำลังต่อกลับเข้าห้อง... '+left+' วิ',w=cx.measureText(s).width+40;
  cx.fillStyle='rgba(60,10,10,.75)';cx.fillRect(SW/2-w/2,90,w,38);cx.fillStyle='#ffd6c8';cx.fillText(s,SW/2,109);cx.restore();
}
