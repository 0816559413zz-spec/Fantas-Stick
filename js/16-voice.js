// =====================================================================
//  ไมค์ (WebRTC audio แบบ mesh: ทุกคนโทรหากันตรงๆ)
// =====================================================================
const VOICE={stream:null,on:false,ptt:true,talking:false,teamOnly:true,out:new Map(),inc:new Map(),muted:new Set()};
function rosterIds(){return LOBBY?LOBBY.players.map(p=>p.id):[];}
async function toggleMic(){
  if(!NET.online){toast('ไมค์ใช้ได้ตอนเล่นออนไลน์เท่านั้น');return;}
  if(VOICE.on){
    for(const o of VOICE.out.values()){try{o.call.close();}catch(e){}o.stream.getTracks().forEach(t=>t.stop());}
    VOICE.out.clear();
    VOICE.stream.getTracks().forEach(t=>t.stop());VOICE.stream=null;VOICE.on=false;
  }else{
    try{
      VOICE.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      VOICE.on=true;voiceSync();
    }catch(e){toast('เปิดไมค์ไม่ได้: '+(e.name||e));}
  }
  updateVoiceUI();
}
function voiceSync(){
  if(!NET.peer)return;
  const ids=rosterIds().filter(id=>id!==NET.myId);
  for(const [id,o] of VOICE.inc)if(!ids.includes(id)){try{o.call.close();}catch(e){}VOICE.inc.delete(id);}
  if(!VOICE.on)return;
  for(const [id,o] of VOICE.out)if(!ids.includes(id)){try{o.call.close();}catch(e){}o.stream.getTracks().forEach(t=>t.stop());VOICE.out.delete(id);}
  for(const id of ids){
    if(VOICE.out.has(id))continue;
    const s=VOICE.stream.clone();
    const call=NET.peer.call(id,s);
    if(!call){s.getTracks().forEach(t=>t.stop());continue;}
    VOICE.out.set(id,{call,stream:s});
    call.on('close',()=>{const o=VOICE.out.get(id);if(o&&o.call===call){o.stream.getTracks().forEach(t=>t.stop());VOICE.out.delete(id);}});
    call.on('error',()=>{});
  }
  applyVoiceGates();
}
function teamOn(v){v=v||VIEW.cur;return !!(v&&(MODES[v.mode]&&MODES[v.mode].team||v.mode==='train'&&v.M&&v.M.tr&&v.M.tr.pvp===1));}
function teamOf(id){const v=VIEW.cur;if(!v)return null;const p=v.P.find(q=>q.id===id);return p?p.tm:null;}
function applyVoiceGates(){
  if(!VOICE.on)return;
  const speak=VOICE.ptt?VOICE.talking:true;
  const v=VIEW.cur,teamMode=VOICE.teamOnly&&screen==='game'&&v&&MODES[v.mode]&&MODES[v.mode].team&&v.ph!=='over';
  const myT=teamOf(NET.myId);
  for(const [id,o] of VOICE.out){
    const ok=speak&&(!teamMode||teamOf(id)===myT);
    o.stream.getAudioTracks().forEach(t=>{if(t.enabled!==ok)t.enabled=ok;});
  }
}
let VAC=null;
function onIncomingCall(call){
  call.answer();
  call.on('stream',rs=>{
    const old=VOICE.inc.get(call.peer);if(old&&old.call!==call){try{old.call.close();}catch(e){}}
    const a=new Audio();a.srcObject=rs;a.autoplay=true;a.muted=VOICE.muted.has(call.peer);a.play().catch(()=>{});
    let an=null,buf=null;
    try{VAC=VAC||new AudioContext();an=VAC.createAnalyser();an.fftSize=256;VAC.createMediaStreamSource(rs).connect(an);buf=new Uint8Array(an.fftSize);}catch(e){}
    VOICE.inc.set(call.peer,{call,audio:a,an,buf,level:0});
    updateVoiceUI();
  });
  call.on('close',()=>{const o=VOICE.inc.get(call.peer);if(o&&o.call===call){VOICE.inc.delete(call.peer);updateVoiceUI();}});
}
function voiceLevels(){
  for(const o of VOICE.inc.values()){
    if(!o.an)continue;
    o.an.getByteTimeDomainData(o.buf);
    let s=0;for(let i=0;i<o.buf.length;i++){const v=(o.buf[i]-128)/128;s+=v*v;}
    o.level=Math.sqrt(s/o.buf.length);
  }
}
function speakingIds(){
  const out=new Set();
  for(const [id,o] of VOICE.inc)if(o.level>0.04&&!VOICE.muted.has(id))out.add(id);
  if(VOICE.on&&(VOICE.ptt?VOICE.talking:true))out.add(NET.myId);
  return out;
}
function updateVoiceUI(){
  const b=$('#micBtn');
  b.textContent=VOICE.on?'🎙️ ไมค์เปิดอยู่ (กดเพื่อปิด)':'เปิดไมค์';
  b.classList.toggle('on',VOICE.on);
  const L=LOBBY;if(!L)return;
  $('#vlist').innerHTML=L.players.filter(p=>p.id!==NET.myId).map(p=>{
    const m=VOICE.muted.has(p.id),has=VOICE.inc.has(p.id);
    return `<div class="vp"><span class="dot" style="background:${p.c}"></span><span style="width:80px;overflow:hidden;white-space:nowrap">${esc(p.n)}</span><span class="lv"><i data-lv="${esc(p.id)}"></i></span><button data-mute="${esc(p.id)}" title="${has?'':'ยังไม่ได้เปิดไมค์'}">${m?'🔇':has?'🔊':'·'}</button></div>`;
  }).join('')||'<div style="color:var(--mute)">ยังไม่มีคนอื่นในห้อง</div>';
}
setInterval(()=>{
  voiceLevels();applyVoiceGates();
  document.querySelectorAll('[data-lv]').forEach(el=>{const o=VOICE.inc.get(el.dataset.lv);el.style.width=o?Math.min(100,o.level*600)+'%':'0';});
},100);
