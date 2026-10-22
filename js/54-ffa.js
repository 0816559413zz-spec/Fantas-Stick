// =====================================================================
//  FFA ให้มันขึ้น (ผู้ใช้ 2026-10-22 เลือกชุด A + B(เฉพาะขวดเลือด) + C)
//  A ฆ่าแล้วมัน: ฆ่าต่อเนื่อง (Double/Triple…) • ฆ่าติดกันไม่ตาย (อาละวาด…) • ค่าหัวคนนำ (+2 kill) • แก้แค้น (+20 HP) • assist • ปิดฉากคนที่กำลังอาละวาด
//  B ขวดเลือด: จุดเกิดกลางแผนที่ (เลือด 50, เกิดใหม่ 25 วิ) + คนตายดรอปขวดเล็ก (25, อยู่ 15 วิ)
//  C ยุติธรรม: เกิดใหม่อมตะ 2 วิ (js/11 respawn) • จอตอนตายบอกว่าโดนใคร/อะไร/เท่าไหร่ • อันดับ 3 คนแรกมุมจอ • หมดเวลาแต่เสมอ = ต่อเวลา (ใครฆ่าก่อนชนะ, สูงสุด 2 นาที)
//  ส่วนโฮสต์ (ffa*) + ส่วนภาพ (draw/sync) อยู่ไฟล์เดียวกัน • ⚠ ตัวเลขทั้งหมด Claude เลือกเอง (ผู้ใช้เลือกแค่ชุด)
// =====================================================================
const FFA={TARGET:10,BOUNTY_MIN:3,MULTI:4,POT_BIG:50,POT_SMALL:25,POT_RE:25,POT_LIFE:15,PROT:2,OT_MAX:120,REVENGE_HP:20};

// ---------- โฮสต์ ----------
function ffaInit(){
  G.pots=[];G.potId=0;G.ot=0;G.potSpots=ffaPotSpots();
  for(const p of plist()){p.streak=0;p.multi=0;p.lastKillT=-99;p.killedBy=null;p.assists=0;p.dmgBy={};p.recap=[];}
}
// จุดขวดเลือด: กึ่งกลางระหว่างจุดเกิดกับกลางแผนที่ + กลางแผนที่ — ตัดจุดที่อยู่ในกำแพง/สิ่งของ (ลองดันด้วย collideWorld แล้วขยับ = ใช้ไม่ได้)
function ffaPotSpots(){
  const cx=MW/2,cy=MH/2,cand=[[cx,cy]],out=[];
  for(const s of spawnPts())cand.push([lerp(s[0],cx,0.5),lerp(s[1],cy,0.5)]);
  for(const [x,y] of cand){
    const pr={x,y,z:0};try{collideWorld(pr,26,0);}catch(e){}
    if(Math.hypot(pr.x-x,pr.y-y)>2)continue;
    if(out.some(o=>Math.hypot(o.x-x,o.y-y)<320))continue;
    out.push({x,y,has:false,t:0});if(out.length>=5)break;
  }
  return out;
}
function ffaTick(dt){
  if(!G.pots)ffaInit();
  for(const s of G.potSpots)if(!s.has){s.t-=dt;if(s.t<=0){s.has=true;G.pots.push({id:++G.potId,x:s.x,y:s.y,big:1,spot:s});}}
  for(let i=G.pots.length-1;i>=0;i--){const o=G.pots[i];
    if(o.life!==undefined){o.life-=dt;if(o.life<=0){G.pots.splice(i,1);continue;}}
    for(const p of plist()){
      if(!p.alive||p.downed||p.hp>=p.maxHp||Math.hypot(p.x-o.x,p.y-o.y)>45||(p.z||0)>groundH(o.x,o.y,0)+3)continue;
      const n=o.big?FFA.POT_BIG:FFA.POT_SMALL;healT(p,n);emit({k:'pot',x:Math.round(o.x),y:Math.round(o.y),id:p.id,n});
      G.pots.splice(i,1);if(o.spot){o.spot.has=false;o.spot.t=FFA.POT_RE;}break;
    }
  }
}
// ใครตีใคร (assist + จอตอนตาย) — เรียกจาก damage() เฉพาะผู้เล่นโดน
function ffaDmgLog(t,srcId,amt,kind){
  if(!srcId||srcId===t.id)return;
  (t.dmgBy||(t.dmgBy={}))[srcId]=G.time;
  const R=t.recap||(t.recap=[]);R.push({s:srcId,n:amt,k:kind||'hit',t:G.time});
  while(R.length>40||(R.length&&G.time-R[0].t>10))R.shift();
}
function ffaKill(k,t){
  const ps=plist(),now=G.time;let bounty=false,revenge=false,ms=0,st=0;const asst=[];
  if(k){
    const kb=k.kills-1,cnt=p=>p===k?kb:p.kills,top=Math.max(...ps.map(cnt));
    bounty=t.kills===top&&t.kills>=FFA.BOUNTY_MIN&&ps.filter(p=>cnt(p)===top).length===1;   // คนนำคนเดียว (≥3 kill)
    if(bounty){k.kills+=1;feed(`👑 ${k.name} ล่าค่าหัว ${t.name}! (+2)`);}
    revenge=k.killedBy===t.id;if(revenge){k.killedBy=null;healT(k,FFA.REVENGE_HP);feed(`🔥 ${k.name} แก้แค้น ${t.name}!`);}
    k.multi=now-(k.lastKillT===undefined?-99:k.lastKillT)<=FFA.MULTI?(k.multi|0)+1:1;k.lastKillT=now;k.streak=(k.streak|0)+1;ms=k.multi;st=k.streak;
    if(st===5)feed(`⚡ ${k.name} ไม่มีใครหยุดได้!`);
  }
  for(const id in (t.dmgBy||{})){if(k&&id===k.id)continue;const q=G.players[id];if(q&&q!==t&&now-t.dmgBy[id]<=5){q.assists=(q.assists|0)+1;asst.push(id);}}
  const rc={};for(const r of (t.recap||[]))if(now-r.t<=8){const o=rc[r.s]||(rc[r.s]={n:0,h:0,k:{}});o.n+=r.n;o.h++;o.k[r.k]=(o.k[r.k]||0)+r.n;}
  const rcA=Object.entries(rc).sort((a,b)=>b[1].n-a[1].n).slice(0,4).map(([id,o])=>[id,Math.round(o.n),o.h,Object.entries(o.k).sort((a,b)=>b[1]-a[1])[0][0]]);
  const es=t.streak|0;if(k&&es>=3)feed(`🛑 ${k.name} ปิดฉาก ${t.name} (${es} kill ติด)`);
  t.streak=0;t.multi=0;t.killedBy=k?k.id:null;t.dmgBy={};t.recap=[];
  if(G.pots)G.pots.push({id:++G.potId,x:t.x,y:t.y,big:0,life:FFA.POT_LIFE});
  emit({k:'kf',ki:k?k.id:'',vi:t.id,ms,st,bn:bounty?1:0,rv:revenge?1:0,es:es>=3?es:0,as:asst,rc:rcA,kh:k?Math.ceil(k.hp):0,kp:k?k.pathIdx|0:-1});
}
// จบเกม: มีคนถึงเป้า หรือหมดเวลา — หมดเวลาแต่อันดับ 1 เสมอ = ต่อเวลา (ใครฆ่าก่อนชนะ) ไม่เกิน 2 นาที
function ffaDone(){
  const ps=plist();if(ps.some(p=>p.kills>=FFA.TARGET))return true;
  if(G.timer>0)return false;
  const top=Math.max(0,...ps.map(p=>p.kills)),n=ps.filter(p=>p.kills===top).length;
  if(n>1&&ps.length>1&&G.timer>-FFA.OT_MAX){if(!G.ot){G.ot=1;banner('⏱ ต่อเวลา! ใครฆ่าก่อนชนะ',3);}return false;}
  return true;
}
function ffaSnapPots(){return G.mode==='ffa'&&G.pots?G.pots.map(o=>[o.id,Math.round(o.x),Math.round(o.y),o.big?1:0]):undefined;}

// ---------- ภาพ: ขวดเลือด 3 มิติ ----------
const POT3=new Map();
function potMesh(big){
  const g=new THREE.Group(),s=big?1:0.7;
  const glass=new THREE.MeshStandardMaterial({color:'#ff3a4a',emissive:'#a0101c',emissiveIntensity:1.2,roughness:0.15,metalness:0.1,transparent:true,opacity:0.9});
  const body=new THREE.Mesh(new THREE.SphereGeometry(0.42*s,14,10),glass);body.scale.y=1.1;g.add(body);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.12*s,0.16*s,0.32*s,10),new THREE.MeshStandardMaterial({color:'#f6e6d0',roughness:0.3,transparent:true,opacity:0.7}));neck.position.y=0.52*s;g.add(neck);
  const cork=new THREE.Mesh(new THREE.CylinderGeometry(0.13*s,0.11*s,0.14*s,8),new THREE.MeshStandardMaterial({color:'#8a5a2b',roughness:0.9}));cork.position.y=0.74*s;g.add(cork);
  const glow=new THREE.Sprite(glowMat('#ff4a5a',1.4));glow.scale.setScalar(2.2*s);g.add(glow);
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.55*s,0.68*s,24),new THREE.MeshBasicMaterial({color:'#ff7a8a',transparent:true,opacity:0.55,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;g.add(ring);
  g.userData={ring,glow,body,s};return g;
}
function syncPots(v,now){
  const seen=new Set();
  for(const q of (v.PT||[])){
    seen.add(q[0]);let o=POT3.get(q[0]);
    if(!o){o=potMesh(!!q[3]);scene.add(o);POT3.set(q[0],o);}
    const gy=GY(q[1],q[2]),t=now/1000+q[0];
    o.position.set(tx(q[1]),gy+0.9+Math.sin(t*2.2)*0.15,tz(q[2]));o.rotation.y=t*1.2;
    const u=o.userData;u.ring.position.y=-0.85-Math.sin(t*2.2)*0.15;u.ring.material.opacity=0.35+0.25*Math.sin(t*4);
    LREQ.push({x:o.position.x,y:o.position.y,z:o.position.z,col:'#ff4a5a',int:1.2,dist:5});
  }
  for(const [id,o] of POT3)if(!seen.has(id)){scene.remove(o);disposeObj(o);POT3.delete(id);}
}
function potFx(ev){
  burst(ev.x,ev.y,'#ff5a6a',14,90,0.6,2.2,{h:GY(ev.x,ev.y)+1,g:-1});
  if(ev.id===NET.myId){floatText(ev.x,ev.y,'+'+ev.n+' HP','#7dffb0',18,GY(ev.x,ev.y)+2.6);try{snd('buff',{x:ev.x,y:ev.y,vol:0.5});}catch(e){}}
}

// ---------- ภาพ: ป้ายตอนฆ่า / จอตอนตาย / อันดับ / มงกุฎค่าหัว ----------
const FFAV={ban:[],death:null,toast:[]};
const MULTI=['','','DOUBLE KILL','TRIPLE KILL','QUADRA KILL','PENTA KILL'],MULTI_TH=['','','ฆ่า 2 ติด!','ฆ่า 3 ติด!','ฆ่า 4 ติด!','ฆ่า 5 ติด!'];
const STREAK={3:['KILLING SPREE','อาละวาด!','#ffb347'],5:['UNSTOPPABLE','ไม่มีใครหยุดได้!','#ff6a3a'],7:['LEGENDARY','ตำนาน!','#c58aff'],10:['GODLIKE','เทพเจ้าเวทมนตร์!','#ffe27a']};
function pName(id){const v=VIEW.cur,p=v&&v.P.find(q=>q.id===id);return p?p.n:'?';}
function ffaKf(ev){
  const me=NET.myId,n=performance.now();
  if(ev.ki===me){
    const ms=Math.min(5,ev.ms|0);
    FFAV.ban.push({t:n,big:ms>=2?MULTI[ms]:'ELIMINATED',sub:(ms>=2?MULTI_TH[ms]+' • ':'')+'ฆ่า '+pName(ev.vi),col:ms>=2?'#ffd23a':'#ffffff'});
    const S=STREAK[ev.st];if(S)FFAV.ban.push({t:n+700,big:S[0],sub:S[1],col:S[2]});
    if(ev.bn)FFAV.toast.push({t:n,s:'👑 ล่าค่าหัว! +2 kill',c:'#ffd86b'});
    if(ev.rv)FFAV.toast.push({t:n,s:'🔥 แก้แค้นสำเร็จ! +20 HP',c:'#ff8a5a'});
    if(ev.es)FFAV.toast.push({t:n,s:'🛑 ปิดฉาก '+pName(ev.vi)+' ('+ev.es+' kill ติด)',c:'#9fe0ff'});
    try{kfSound(ms);}catch(e){}
  }else if(ev.as&&ev.as.includes(me))FFAV.toast.push({t:n,s:'🤝 ช่วยฆ่า '+pName(ev.vi),c:'#b8d8ff'});
  else if(ev.st>=5&&STREAK[ev.st])FFAV.toast.push({t:n,s:'⚡ '+pName(ev.ki)+' '+STREAK[ev.st][1],c:STREAK[ev.st][2]});
  if(ev.vi===me)FFAV.death={t:n,ki:ev.ki,kn:ev.ki?pName(ev.ki):'',kh:ev.kh,kp:ev.kp,rc:(ev.rc||[]).map(r=>({n:pName(r[0]),d:r[1],h:r[2],k:r[3]}))};
}
// เสียงยืนยันตอนฆ่า: "ติ๊ง" สูงขึ้นตามจำนวนฆ่าติด
function kfSound(ms){const A=AC;if(!A||!SFXBUS)return;const t0=A.currentTime;[0,0.07].forEach((d,i)=>{const o=A.createOscillator(),g=A.createGain();o.type='triangle';o.frequency.value=(880+ms*120)*(i?1.5:1);g.gain.setValueAtTime(0.0001,t0+d);g.gain.exponentialRampToValueAtTime(0.18,t0+d+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t0+d+0.25);o.connect(g);g.connect(SFXBUS);o.start(t0+d);o.stop(t0+d+0.3);});}
const KINDN={hit:'โดนตรง',aoe:'ระเบิด',burn:'ไฟเผา',zone:'วงพื้นที่',melee:'ประชิด'};
function drawFFA(v,P,me,now){
  if(!v||v.mode!=='ffa'||v.ph==='over')return;
  const n=performance.now();cx.save();
  // มงกุฎค่าหัว: คนนำคนเดียว ≥3 kill
  const top=Math.max(0,...P.map(p=>p.k||0)),lead=P.filter(p=>(p.k||0)===top);
  if(top>=FFA.BOUNTY_MIN&&lead.length===1){const L=lead[0];if(L.al){const s=toScreen(L.x,(L.z||0)+3.35,L.y);if(s){
    cx.textAlign='center';cx.textBaseline='middle';cx.font='26px sans-serif';cx.fillText('👑',s[0],s[1]-18+Math.sin(n/300)*2);
    cx.font='700 12px Kanit,sans-serif';cx.fillStyle='#ffd86b';cx.fillText(L.id===NET.myId?'ค่าหัว: คุณ!':'ค่าหัว +2',s[0],s[1]+2);}}}
  // เกิดใหม่อมตะ: ไอคอนโล่บนหัว
  for(const p of P)if(p.al&&p.iv&&p.id!==NET.myId){const s=toScreen(p.x,(p.z||0)+3.1,p.y);if(s){cx.textAlign='center';cx.font='16px sans-serif';cx.globalAlpha=0.6+0.4*Math.sin(n/90);cx.fillText('🛡️',s[0],s[1]-28);cx.globalAlpha=1;}}
  // อันดับ 3 คนแรก (ซ้ายบน)
  const R=[...P].sort((a,b)=>(b.k||0)-(a.k||0)),x=12,y=Math.round(SH*0.2),w=190;
  cx.textBaseline='middle';cx.fillStyle='rgba(6,8,18,.55)';cx.fillRect(x,y,w,22+Math.min(3,R.length)*24+(R.slice(0,3).some(p=>p.id===NET.myId)||!me?0:24));
  cx.fillStyle='rgba(217,180,90,.7)';cx.fillRect(x,y,w,2);cx.textAlign='left';cx.font='600 12px Kanit,sans-serif';cx.fillStyle='#e8c468';cx.fillText('อันดับ  •  เป้า '+FFA.TARGET+' kill',x+8,y+12);
  const row=(p,i,yy)=>{const mine=p.id===NET.myId;if(mine){cx.fillStyle='rgba(243,220,148,.15)';cx.fillRect(x+2,yy-11,w-4,22);}
    cx.font='700 13px Kanit,sans-serif';cx.fillStyle=i===0?'#ffd86b':i===1?'#dfe6f2':i===2?'#e0a070':'#aab';cx.fillText((i+1)+'',x+10,yy);
    cx.fillStyle=p.c||'#fff';cx.fillRect(x+26,yy-4,8,8);cx.font=(mine?'700':'500')+' 13px Kanit,sans-serif';cx.fillStyle=mine?'#fff4cc':'#fff';
    let nm=p.n;while(cx.measureText(nm).width>w-90&&nm.length>2)nm=nm.slice(0,-1);cx.fillText(nm+(nm!==p.n?'…':''),x+40,yy);
    cx.textAlign='right';cx.fillStyle='#fff';cx.fillText(String(p.k||0),x+w-10,yy);cx.textAlign='left';};
  R.slice(0,3).forEach((p,i)=>row(p,i,y+34+i*24));
  if(me&&!R.slice(0,3).some(p=>p.id===NET.myId)){const i=R.findIndex(p=>p.id===NET.myId);if(i>=0)row(R[i],i,y+34+3*24);}
  // ต่อเวลา
  if(v.ot){cx.textAlign='center';cx.font='800 22px Kanit,sans-serif';cx.fillStyle=`rgba(255,120,90,${0.7+0.3*Math.sin(n/160)})`;cx.fillText('⏱ ต่อเวลา! ใครฆ่าก่อนชนะ',SW/2,70);}
  // ป้ายตอนฆ่า (กลางบน)
  FFAV.ban=FFAV.ban.filter(b=>n-b.t<2200);
  const B=FFAV.ban.filter(b=>n>=b.t);const b=B[B.length-1];
  if(b){const a=(n-b.t)/1000,al=Math.min(1,a/0.08)*(a>1.8?1-(a-1.8)/0.4:1),sc=a<0.12?lerp(1.6,1,a/0.12):1,yy=SH*0.25;
    cx.globalAlpha=al;cx.textAlign='center';cx.save();cx.translate(SW/2,yy);cx.transform(1,0,-0.18,1,0,0);cx.scale(sc,sc);
    cx.font='900 34px "Cinzel Decorative",Cinzel,serif';cx.lineWidth=5;cx.strokeStyle='rgba(0,0,0,.75)';cx.strokeText(b.big,0,0);cx.shadowColor=b.col;cx.shadowBlur=18;cx.fillStyle=b.col;cx.fillText(b.big,0,0);cx.restore();
    cx.font='600 15px Kanit,sans-serif';cx.fillStyle='#fff';cx.shadowBlur=0;cx.fillText(b.sub,SW/2,yy+30);cx.globalAlpha=1;}
  // ข้อความเล็ก (ค่าหัว / แก้แค้น / ช่วยฆ่า / ใครกำลังอาละวาด)
  FFAV.toast=FFAV.toast.filter(q=>n-q.t<2600);
  FFAV.toast.forEach((q,i)=>{const a=(n-q.t)/1000;cx.globalAlpha=Math.min(1,a/0.15)*(a>2.2?1-(a-2.2)/0.4:1);cx.textAlign='center';cx.font='600 15px Kanit,sans-serif';cx.fillStyle='rgba(0,0,0,.6)';cx.fillText(q.s,SW/2+1,SH*0.25+58+i*22+1);cx.fillStyle=q.c;cx.fillText(q.s,SW/2,SH*0.25+58+i*22);});
  cx.globalAlpha=1;
  // จอตอนตาย: ใครฆ่า + ดาเมจที่โดน 8 วิสุดท้าย
  const D=FFAV.death;
  if(D&&me&&!me.al&&n-D.t<8000){
    const w2=340,h2=70+D.rc.length*22,x2=SW/2-w2/2,y2=SH*0.56;
    cx.fillStyle='rgba(10,6,14,.78)';cx.fillRect(x2,y2,w2,h2);cx.fillStyle='rgba(255,110,110,.8)';cx.fillRect(x2,y2,w2,2);
    cx.textAlign='left';cx.font='700 15px Kanit,sans-serif';cx.fillStyle='#ff9a9a';
    cx.fillText(D.ki?'💀 ถูก '+D.kn+' ฆ่า':'💀 ตาย',x2+12,y2+16);
    if(D.ki){cx.font='500 12px Kanit,sans-serif';cx.fillStyle='rgba(255,255,255,.75)';cx.fillText((PATHS[D.kp]?PATHS[D.kp].ic+' '+PATHS[D.kp].n:'')+' • เลือดเขาเหลือ '+D.kh,x2+12,y2+38);}
    D.rc.forEach((r,i)=>{const yy=y2+62+i*22;cx.font='500 13px Kanit,sans-serif';cx.fillStyle='#fff';cx.fillText(r.n,x2+12,yy);cx.fillStyle='rgba(255,255,255,.6)';cx.fillText((KINDN[r.k]||r.k)+' × '+r.h,x2+150,yy);cx.textAlign='right';cx.fillStyle='#ff8a8a';cx.fillText(r.d+' ดาเมจ',x2+w2-12,yy);cx.textAlign='left';});
  }else if(me&&me.al)FFAV.death=null;
  cx.restore();
}
