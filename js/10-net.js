// =====================================================================
//  เครือข่าย (PeerJS / WebRTC)
// =====================================================================
const PREFIX='wizduel-th-v37-';
const NET={peer:null,isHost:false,online:false,myId:'me',conns:new Map(),hostConn:null,code:'',spec:false,rtt:0,
  // token ของแท็บนี้ (อยู่ข้ามการรีเฟรช) — โฮสต์ใช้จำว่า "คนเดิมต่อกลับมา" ตอนเน็ตหลุด
  tok:(()=>{const r=()=>Math.random().toString(36).slice(2,10);try{let t=sessionStorage.getItem('wd_tok');if(!t){t=r();sessionStorage.setItem('wd_tok',t);}return t;}catch(e){return r();}})()};
// ต่อใหม่อัตโนมัติ (ลูกข่าย): หลุดจากโฮสต์ → ลองต่อห้องเดิมทุก 2 วิ นาน 30 วิ (โฮสต์เก็บตัวละครไว้ให้) • เกินแล้วค่อยรีโหลด
const RC={on:false,t0:0,iv:0};
// ทดสอบเน็ตช้า: ?lag=150&jit=40 (มิลลิวินาที ไป-กลับ + แกว่งสุ่ม) — หน่วงข้อมูลที่ลูกข่ายรับ/ส่ง ลำดับไม่สลับ (เหมือน WebRTC reliable)
const LAG=(()=>{const q=new URLSearchParams(location.search);return {ms:+q.get('lag')||0,jit:+q.get('jit')||0,tIn:0,tOut:0};})();
function lagDo(out,f){if(!LAG.ms&&!LAG.jit)return f();const n=performance.now(),k=out?'tOut':'tIn';LAG[k]=Math.max(LAG[k],n+LAG.ms/2+Math.random()*LAG.jit);setTimeout(f,LAG[k]-n);}
function hostSend(m){if(LAG.ms||LAG.jit)m=JSON.parse(JSON.stringify(m));lagDo(1,()=>{const c=NET.hostConn;try{if(c&&c.open)c.send(m);}catch(e){}});}
let LOBBY=null;
function genCode(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=c[Math.floor(Math.random()*c.length)];return s;}
function sendAll(m){for(const c of NET.conns.values()){try{if(c.open)c.send(m);}catch(e){}}}
function setStatus(t){$('#status').textContent=t;const h=document.getElementById('hStatus');if(h)h.textContent=t;}

function hostGame(online){
  ac();
  NET.isHost=true;NET.online=online;
  if(!online){NET.myId='me';initHostLobby();return;}
  if(typeof Peer==='undefined'){setStatus('โหลดระบบออนไลน์ไม่ได้ — ต้องต่ออินเทอร์เน็ตตอนสร้าง/เข้าห้อง');return;}
  const code=genCode();
  setStatus('กำลังสร้างห้อง...');
  const peer=new Peer(PREFIX+code,{debug:1});
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
    if(e.type==='unavailable-id'&&!G){peer.destroy();hostGame(true);}
    else setStatus('ผิดพลาด: '+e.type);
  });
}

function netConnect(peer,code){
  const c=peer.connect(PREFIX+code,{reliable:true,serialization:'json'});
  NET.hostConn=c;
  c.on('open',()=>{c.send({t:'hello',name:myName(),look:lookStr(myLook),kit:myKit,tok:NET.tok});setStatus('');});
  c.on('data',d=>lagDo(0,()=>clientOnData(d)));
  c.on('close',()=>{if(NET.hostConn===c)netLost();});
  c.on('error',()=>{if(NET.hostConn===c)netLost();});
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
      if(!pr||pr.destroyed){const np=new Peer(undefined,{debug:1});NET.peer=np;np.on('open',()=>netConnect(np,NET.code));np.on('call',onIncomingCall);np.on('error',()=>{});return;}
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
  NET.isHost=false;NET.online=true;NET.code=code;
  setStatus('กำลังเชื่อมต่อห้อง '+code+' ...');
  const peer=new Peer(undefined,{debug:1});
  NET.peer=peer;
  peer.on('open',id=>{if(!NET.myId||!RC.on)NET.myId=id;netConnect(peer,code);});
  peer.on('call',onIncomingCall);
  peer.on('disconnected',()=>{try{peer.reconnect();}catch(e){}});
  peer.on('error',e=>{
    if(e.type==='peer-unavailable')setStatus('ไม่พบห้อง '+code+' — เช็กรหัสอีกครั้ง');
    else setStatus('ผิดพลาด: '+e.type);
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
    case 's':if(screen!=='game')setScreen('game');unpackP(d.s);onSnap(d.s);break;
    case 'priv':onPriv(d.m);break;
  }
}

function leave(){try{NET.peer&&NET.peer.destroy();}catch(e){}location.reload();}
