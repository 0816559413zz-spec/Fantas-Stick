// =====================================================================
//  เครือข่าย (PeerJS / WebRTC)
// =====================================================================
const PREFIX='wizduel-th-v50-';
const NET={peer:null,isHost:false,online:false,myId:'me',conns:new Map(),hostConn:null,code:'',spec:false,rtt:0,
  // token ของแท็บนี้ (อยู่ข้ามการรีเฟรช) — โฮสต์ใช้จำว่า "คนเดิมต่อกลับมา" ตอนเน็ตหลุด
  tok:(()=>{const r=()=>Math.random().toString(36).slice(2,10);try{let t=sessionStorage.getItem('wd_tok');if(!t){t=r();sessionStorage.setItem('wd_tok',t);}return t;}catch(e){return r();}})()};
// ต่อใหม่อัตโนมัติ (ลูกข่าย): หลุดจากโฮสต์ → ลองต่อห้องเดิมทุก 2 วิ นาน 30 วิ (โฮสต์เก็บตัวละครไว้ให้) • เกินแล้วค่อยรีโหลด
const RC={on:false,t0:0,iv:0};
// เซิร์ฟเวอร์ช่วยต่อ (2026-10-25: TURN ฟรีของ PeerJS/openrelay ตายหมด → เน็ตมือถือ/Wi-Fi โรงเรียนต่อตรงไม่ได้ = ค้าง "กำลังเชื่อมต่อ")
// STUN = หาที่อยู่จริงของเครื่อง (ฟรี หลายเจ้ากันล่ม) • TURN = ส่งข้อมูลอ้อมเมื่อต่อตรงไม่ได้ — ใส่ใน TURN_SERVERS เมื่อมีบัญชี (metered.ca / Cloudflare)
const TURN_SERVERS=[];
const ICE=[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302']},{urls:'stun:stun.cloudflare.com:3478'},{urls:'stun:global.stun.twilio.com:3478'},...TURN_SERVERS];
const PEER_OPT={debug:1,config:{iceServers:ICE}};
// TURN แบบขอรหัสผ่านลิงก์ (metered.ca: https://<ชื่อแอป>.metered.live/api/v1/turn/credentials?apiKey=...) — ว่าง = ไม่ใช้
const TURN_URL='https://fantas-stick.metered.live/api/v1/turn/credentials?apiKey=c38e05b067af11e7f3e8299b4c0e66de6975';
// รอรหัส TURN ก่อนสร้าง peer (สูงสุด 4 วิ — ช้า/พัง = ไปต่อแบบไม่มี TURN)
const ICE_READY=!TURN_URL?Promise.resolve():Promise.race([
  fetch(TURN_URL).then(r=>r.json()).then(a=>{if(Array.isArray(a))ICE.push(...a);}).catch(()=>{}),
  new Promise(r=>setTimeout(r,4000))]);
// เข้าห้อง: ต่อไม่ติดใน 12 วิ → ลองใหม่ • ครบ 3 ครั้ง → บอกสาเหตุ (ไม่ค้างเงียบ ๆ อีก)
const JN={t:0,n:0};
// ทดสอบเน็ตช้า: ?lag=150&jit=40 (มิลลิวินาที ไป-กลับ + แกว่งสุ่ม) — หน่วงข้อมูลที่ลูกข่ายรับ/ส่ง ลำดับไม่สลับ (เหมือน WebRTC reliable)
const LAG=(()=>{const q=new URLSearchParams(location.search);return {ms:+q.get('lag')||0,jit:+q.get('jit')||0,tIn:0,tOut:0};})();
function lagDo(out,f){if(!LAG.ms&&!LAG.jit)return f();const n=performance.now(),k=out?'tOut':'tIn';LAG[k]=Math.max(LAG[k],n+LAG.ms/2+Math.random()*LAG.jit);setTimeout(f,LAG[k]-n);}
function hostSend(m){if(LAG.ms||LAG.jit)m=JSON.parse(JSON.stringify(m));lagDo(1,()=>{const c=NET.hostConn;try{if(c&&c.open)c.send(m);}catch(e){}});}
let LOBBY=null;
function genCode(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=c[Math.floor(Math.random()*c.length)];return s;}
function sendAll(m){for(const c of NET.conns.values()){try{if(c.open)c.send(m);}catch(e){}}}
// ส่งสถานะของพังได้แบบ "เฉพาะที่เปลี่ยน" (แมพใหญ่มีของเป็นพันชิ้น ส่งทั้งหมด 30 ครั้ง/วิ ไม่ไหว — designs/city-bot-battle.md ขั้น 2)
// สตริงสถานะ PB (prop ละ 1 ตัว) / BK (ของบังละ 1 ตัว) / BD (บ้านคั่นด้วย '|') แบ่งเป็นช่อง → ส่ง: ไม่มีคีย์ = เหมือนเดิม • {i:ค่า} = เฉพาะช่องที่เปลี่ยน • สตริง = ทั้งหมด
// ทั้งหมดทุก ~2 วิ (เผื่อหลุด/คนเข้าใหม่) + ทันทีที่มีคนต่อเข้ามา (netDeltaReset) • ช่องทาง reliable+เรียงลำดับ ลูกข่ายใช้ทุก snapshot ตามลำดับ
const NETD_KEYS={PB:'',BK:'',BD:'|',CB:'|',CS:''},NETD={last:{},n:0};
function netDeltaReset(){NETD.last={};}
function netDelta(base){
  const o={},full=++NETD.n%60===0;
  for(const k in NETD_KEYS){const cur=base[k]||'',prev=NETD.last[k];
    if(prev===cur&&!full){o[k]=undefined;continue;}
    NETD.last[k]=cur;const sep=NETD_KEYS[k];
    if(full||prev==null){o[k]=cur;continue;}
    const A=prev.split(sep),B=cur.split(sep);if(A.length!==B.length){o[k]=cur;continue;}
    const d={};let n=0;for(let i=0;i<B.length;i++)if(A[i]!==B[i]){d[i]=B[i];n++;}
    o[k]=n*4<B.length?d:cur;}
  return o;
}
// ลูกข่าย: เติมกลับเป็นสตริงเต็มก่อนเข้า onSnap (snapApply/bldParse/brkParse ใช้แบบเดิม)
const NETU={};
function netUndelta(s){
  for(const k in NETD_KEYS){const v=s[k];
    if(v===undefined||v===null){if(NETU[k]!==undefined)s[k]=NETU[k];continue;}
    if(typeof v==='object'){if(NETU[k]===undefined){delete s[k];continue;}const sep=NETD_KEYS[k],L=NETU[k].split(sep);for(const i in v)L[i]=v[i];s[k]=L.join(sep);}
    NETU[k]=s[k];}
}
function setStatus(t){$('#status').textContent=t;const h=document.getElementById('hStatus');if(h)h.textContent=t;}

function hostGame(online){
  ac();
  NET.isHost=true;NET.online=online;
  if(!online){NET.myId='me';initHostLobby();return;}
  if(typeof Peer==='undefined'){setStatus('โหลดระบบออนไลน์ไม่ได้ — ต้องต่ออินเทอร์เน็ตตอนสร้าง/เข้าห้อง');return;}
  setStatus('กำลังสร้างห้อง...');
  ICE_READY.then(()=>hostPeer());
}
function hostPeer(){
  if(!NET.isHost||!NET.online||screen==='lobby')return;   // ระหว่างรอ ถูกเปลี่ยนเป็นเล่นออฟไลน์ไปแล้ว (js/62 fall)
  const code=genCode();
  const peer=new Peer(PREFIX+code,PEER_OPT);
  NET.peer=peer;
  peer.on('open',id=>{NET.myId=id;NET.code=code;setStatus('');initHostLobby();});
  peer.on('connection',conn=>{
    conn.on('data',d=>hostOnData(conn,d));
    conn.on('close',()=>hostDrop(conn.pid||conn.peer,conn));
    conn.on('error',()=>hostDrop(conn.pid||conn.peer,conn));
  });
  peer.on('call',onIncomingCall);
  peer.on('disconnected',()=>{try{peer.reconnect();}catch(e){}});
  peer.on('error',e=>{
    if(e.type==='unavailable-id'&&!G){peer.destroy();hostPeer();}
    else setStatus('ผิดพลาด: '+e.type);
  });
}

function netConnect(peer,code){
  const c=peer.connect(PREFIX+code,{reliable:true,serialization:'json'});
  NET.hostConn=c;
  if(!RC.on)joinWatch(peer,code,c);
  c.on('open',()=>{clearTimeout(JN.t);c.send({t:'hello',name:myName(),look:lookStr(myLook),kit:myKit,tok:NET.tok,fr:myFrame()});setStatus('');});
  c.on('data',d=>lagDo(0,()=>clientOnData(d)));
  c.on('close',()=>{if(NET.hostConn===c&&c.wasOpen)netLost();});
  c.on('error',()=>{if(NET.hostConn===c&&c.wasOpen)netLost();});
  c.on('open',()=>{c.wasOpen=true;});
}
// เฝ้าการเข้าห้อง: ยังไม่ open ใน 12 วิ (หรือ ICE ล้มเหลว) → ต่อใหม่ / ยอมแพ้พร้อมคำแนะนำ
function joinWatch(peer,code,c){
  clearTimeout(JN.t);
  const fail=()=>{
    clearTimeout(JN.t);if(c.open||NET.hostConn!==c||NET.peer!==peer)return;
    try{c.close();}catch(e){}
    if(++JN.n<3){setStatus('ต่อห้อง '+code+' ยังไม่ติด — ลองใหม่ ('+(JN.n+1)+'/3) ...');netConnect(peer,code);return;}
    joinFail('เชื่อมต่อกับห้อง '+code+' ไม่ได้ — เน็ตของคุณหรือของโฮสต์บล็อกการต่อตรง ลองสลับ Wi-Fi ↔ 4G หรือให้อีกคนเป็นคนสร้างห้อง');
  };
  JN.t=setTimeout(fail,12000);
  // ICE ล้ม = รู้ทันทีว่าต่อตรงไม่ได้ ไม่ต้องรอครบ 12 วิ
  const hook=()=>{const pc=c.peerConnection;if(!pc){if(!c.open&&NET.hostConn===c)setTimeout(hook,300);return;}
    pc.addEventListener('iceconnectionstatechange',()=>{if(pc.iceConnectionState==='failed')fail();});};
  hook();
}
// เข้าห้องไม่สำเร็จ: ปิด peer ให้กดเข้าใหม่ได้ (ไม่ทิ้ง peer เก่าค้าง)
function joinFail(msg){
  clearTimeout(JN.t);JN.n=0;
  const pr=NET.peer;NET.peer=null;NET.hostConn=null;try{pr&&pr.destroy();}catch(e){}
  NET.online=false;setStatus(msg);
  if(typeof HUI!=='undefined')HUI.pend=false;
}
function netLost(){
  if(RC.on)return;
  if(screen!=='game'&&screen!=='lobby'){alert('หลุดจากห้อง (โฮสต์ออก หรือการเชื่อมต่อขาด)');location.reload();return;}
  RC.on=true;RC.t0=performance.now();chatAdd('📶 เน็ตหลุด — กำลังต่อกลับ...',1);setStatus('📶 กำลังต่อกลับเข้าห้อง...');
  RC.iv=setInterval(()=>{
    if(!RC.on){clearInterval(RC.iv);return;}
    if(performance.now()-RC.t0>30000){clearInterval(RC.iv);alert('ต่อกลับเข้าห้องไม่ได้ (โฮสต์ออก หรือเน็ตหลุดนานเกิน 30 วิ)');location.reload();return;}
    const pr=NET.peer;
    try{
      if(!pr||pr.destroyed){const np=new Peer(undefined,PEER_OPT);NET.peer=np;np.on('open',()=>netConnect(np,NET.code));np.on('call',onIncomingCall);np.on('error',()=>{});return;}
      if(pr.disconnected){pr.reconnect();return;}
      const c=NET.hostConn;if(!c||!c.open)netConnect(pr,NET.code);
    }catch(e){}
  },2000);
}
function joinGame(code){
  ac();
  code=code.trim().toUpperCase();
  if(code.length!==5){setStatus('รหัสห้องต้องมี 5 ตัว');return;}
  if(typeof Peer==='undefined'){setStatus('โหลดระบบออนไลน์ไม่ได้ — ต้องต่ออินเทอร์เน็ตตอนสร้าง/เข้าห้อง');return;}
  if(NET.peer&&!NET.isHost){const o=NET.peer;NET.peer=null;NET.hostConn=null;try{o.destroy();}catch(e){}}   // กดเข้าซ้ำ → ทิ้ง peer เก่า
  clearTimeout(JN.t);JN.n=0;
  NET.isHost=false;NET.online=true;NET.code=code;
  setStatus('กำลังเชื่อมต่อห้อง '+code+' ...');
  ICE_READY.then(()=>joinPeer(code));
}
function joinPeer(code){
  if(!NET.online||NET.isHost||NET.code!==code)return;   // ระหว่างรอ ผู้เล่นกดออก/เปลี่ยนห้องแล้ว
  const peer=new Peer(undefined,PEER_OPT);
  NET.peer=peer;
  peer.on('open',id=>{if(!NET.myId||!RC.on)NET.myId=id;netConnect(peer,code);});
  peer.on('call',onIncomingCall);
  peer.on('disconnected',()=>{try{peer.reconnect();}catch(e){}});
  peer.on('error',e=>{
    if(NET.peer!==peer||RC.on)return;
    if(e.type==='peer-unavailable')joinFail('ไม่พบห้อง '+code+' — เช็กรหัสอีกครั้ง (หรือโฮสต์ปิดห้อง/เน็ตโฮสต์หลุด)');
    else if(e.type==='network'||e.type==='server-error'||e.type==='socket-error'||e.type==='socket-closed')joinFail('ต่อเซิร์ฟเวอร์ห้องไม่ได้ — เช็กเน็ตแล้วลองอีกครั้ง ('+e.type+')');
    else joinFail('ผิดพลาด: '+e.type);
  });
}

function clientOnData(d){
  if(!d)return;
  switch(d.t){
    case 'welcome':NET.myId=d.id;NET.spec=!!d.spec;if(RC.on){RC.on=false;clearInterval(RC.iv);chatAdd('📶 ต่อกลับเข้าห้องแล้ว',1);}break;
    case 'chat':onChat(d);break;
    case 'reject':alert(d.r);location.reload();break;
    case 'lobby':onLobby(d);break;
    case 'start':VIEW.prev=VIEW.cur=null;sbufReset();setScreen('game');break;
    case 'po':{const r=performance.now()-d.c;NET.rtt=NET.rtt?NET.rtt*0.8+r*0.2:r;break;}   // ปิงไป-กลับ (เฉลี่ยนุ่ม ๆ)
    case 's':if(screen!=='game')setScreen('game');unpackP(d.s);netUndelta(d.s);onSnap(d.s);break;
    case 'priv':onPriv(d.m);break;
  }
}

// ออกจากห้อง/เกม = รีโหลดหน้า (ล้างสถานะทั้งหมด) แล้วไปหน้าการ์ดโหมดเลย ไม่เล่นฉากเปิดซ้ำ (js/62 อ่าน wd_hub)
function leave(){try{sessionStorage.setItem('wd_hub','modes');}catch(e){}try{NET.peer&&NET.peer.destroy();}catch(e){}location.reload();}
// ออกจากห้องตอนยังอยู่ในล็อบบี้ (ยังไม่เริ่มเกม) แบบไม่รีโหลด: ปิดการเชื่อมต่อ + ไมค์ แล้วล้างสถานะห้อง (ผู้ใช้ 2026-10-23: ห้อง → กลับ = หน้าโหมดทันที)
function leaveRoom(){
  if(RC.on){RC.on=false;clearInterval(RC.iv);}
  const pr=NET.peer;NET.peer=null;NET.hostConn=null;   // ล้างก่อน destroy → close ของ conn ไม่เรียก netLost
  for(const o of VOICE.inc.values()){try{o.call.close();}catch(e){}if(o.audio){o.audio.srcObject=null;}}VOICE.inc.clear();
  for(const o of VOICE.out.values()){try{o.call.close();}catch(e){}o.stream.getTracks().forEach(t=>t.stop());}VOICE.out.clear();
  if(VOICE.stream){VOICE.stream.getTracks().forEach(t=>t.stop());VOICE.stream=null;}VOICE.on=false;
  try{pr&&pr.destroy();}catch(e){}
  NET.conns.clear();Object.assign(NET,{isHost:false,online:false,myId:'me',code:'',spec:false,rtt:0});
  G=null;LOBBY=null;setStatus('');
  setScreen('menu');
}
