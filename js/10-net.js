// =====================================================================
//  เครือข่าย (PeerJS / WebRTC)
// =====================================================================
const PREFIX='wizduel-th-v28-';
const NET={peer:null,isHost:false,online:false,myId:'me',conns:new Map(),hostConn:null,code:''};
let LOBBY=null;
function genCode(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=c[Math.floor(Math.random()*c.length)];return s;}
function sendAll(m){for(const c of NET.conns.values()){try{if(c.open)c.send(m);}catch(e){}}}
function setStatus(t){$('#status').textContent=t;}

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
    conn.on('close',()=>hostDrop(conn.peer));
    conn.on('error',()=>hostDrop(conn.peer));
  });
  peer.on('call',onIncomingCall);
  peer.on('disconnected',()=>{try{peer.reconnect();}catch(e){}});
  peer.on('error',e=>{
    if(e.type==='unavailable-id'&&!G){peer.destroy();hostGame(true);}
    else setStatus('ผิดพลาด: '+e.type);
  });
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
  peer.on('open',id=>{
    NET.myId=id;
    const c=peer.connect(PREFIX+code,{reliable:true,serialization:'json'});
    NET.hostConn=c;
    c.on('open',()=>{c.send({t:'hello',name:myName(),look:lookStr(myLook),kit:myKit});setStatus('');});
    c.on('data',clientOnData);
    c.on('close',()=>{alert('หลุดจากห้อง (โฮสต์ออก หรือการเชื่อมต่อขาด)');location.reload();});
  });
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
    case 'welcome':NET.myId=d.id;break;
    case 'reject':alert(d.r);location.reload();break;
    case 'lobby':onLobby(d);break;
    case 'start':VIEW.prev=VIEW.cur=null;setScreen('game');break;
    case 's':if(screen!=='game')setScreen('game');onSnap(d.s);break;
    case 'priv':onPriv(d.m);break;
  }
}

function leave(){try{NET.peer&&NET.peer.destroy();}catch(e){}location.reload();}
