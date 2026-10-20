// =====================================================================
//  ฝั่งโฮสต์: สถานะเกมทั้งหมดคำนวณที่นี่ (server-authoritative)
// =====================================================================
let G=null,EVL=[],EVN=[],hostLast=0,tickN=0;
function emit(ev){EVL.push(ev);if(NET.online)EVN.push(ev);}
function feed(text){G.feed.push({text,t:G.time});if(G.feed.length>20)G.feed.shift();}
function banner(text,t=2.5){G.banner={text,t};}
function plist(){return G.order.map(id=>G.players[id]).filter(Boolean);}
function cleanName(n){n=String(n||'').trim().slice(0,16);return n||'พ่อมด';}

function freshStats(){
  return {lst:0,emp:0,dch:3,stS:null,stCd:0,god:0,sdome:null,rail:null,slnT:0,sorb:null,beam:0,hp:200,maxHp:200,alive:true,downed:false,revive:0,respawn:0,vx:0,vy:0,ang:0,z:0,vz:0,fly:false,flyCd:0,root:0,
    cd:{basic:0,q:0,e:0,r:0,f:0,dodge:0},cdMax:{basic:1,q:1,e:1,r:1,f:1,dodge:1},
    shieldOn:false,shieldE:100,shieldT:0,shieldBroken:0,dash:0,dashX:0,dashY:0,inv:0,stun:0,burn:0,bt:0,burnSrc:null,
    ult:0,kills:0,deaths:0,dmgDealt:0,lastHit:null,bo:null,picked:true,taken:[],dfall:null,
    buffs:{dmg:1,cdr:1,spd:1,life:0,shReg:1,ult:1}};
}
function newPlayer(id,name,color,lk){
  return Object.assign({id,name,color,lk,kit:'0',kitIds:[],ultId:'inferno',team:0,lteam:0,x:800,y:500,inp:emptyInput(),last:{}},freshStats());
}
function emptyInput(){return {u:0,d:0,l:0,r:0,ax:0,ay:0,ap:0,fire:0,sh:0,jh:0,ch:0,dh:0,c:{q:0,e:0,r:0,f:0,sp:0,x:0,b:0,v:0,jp:0,g:0}};}
function addPlayer(id,name,color,lk,kit){
  // หน้าตา: ไม่ส่งมา (บอท) = สุ่มจาก id / สีประจำตัวมาจากสีบ้านเสมอ
  lk=lookStr(parseLook(lk||lookStr(randLook(hashStr(id)))));LOOKS[id]=lk;color=houseColor(lk);
  const p=newPlayer(id,name,color,lk);setKit(p,kit);
  const ps=plist(),t0=ps.filter(q=>q.lteam===0).length;
  p.lteam=t0<=ps.length-t0?0:1;
  G.players[id]=p;G.order.push(id);
  return p;
}
function initHostLobby(){
  G={mode:'coop',map:'castle',ph:'lobby',players:{},order:[],proj:[],en:[],feed:[],time:0,pid:0,eid:0,wave:0,round:1,rw:{},teamScore:[0,0],timer:0,banner:null,result:null,queue:[],escale:1,espd:1};
  const me=addPlayer(NET.myId,myName(),myColor,lookStr(myLook),myKit);
  me.inp=INPUT;
  broadcastLobby();
  setScreen('lobby');
}
function lobbyMsg(){return {t:'lobby',ph:G.ph,mode:G.mode,map:G.map,mpk:G.mapPick||'',code:NET.code,online:NET.online,host:NET.myId,players:plist().map(p=>({id:p.id,n:p.name,c:p.color,lk:p.lk,kt:p.kit,tm:p.lteam}))};}
function broadcastLobby(){const m=lobbyMsg();sendAll(m);onLobby(m);}

function hostOnData(conn,d){
  if(!d||!G)return;
  const id=conn.peer;
  if(d.t==='hello'){
    const reject=r=>{try{conn.send({t:'reject',r});}catch(e){}setTimeout(()=>conn.close(),600);};
    if(G.ph!=='lobby')return reject('เกมกำลังเล่นอยู่ รอจบเกมแล้วค่อยเข้าใหม่นะ');
    if(plist().length>=6)return reject('ห้องเต็มแล้ว (สูงสุด 6 คน)');
    NET.conns.set(id,conn);
    const p=addPlayer(id,cleanName(d.name),null,String(d.look||'').slice(0,40),String(d.kit||'').slice(0,24));
    conn.send({t:'welcome',id});
    toast(p.name+' เข้าห้องแล้ว');
    broadcastLobby();
    return;
  }
  const p=G.players[id];if(!p)return;
  if(d.t==='in'&&d.i&&d.i.c)p.inp=d.i;
  else if(d.t==='team'&&G.ph==='lobby'){p.lteam^=1;broadcastLobby();}
  else if(d.t==='kit'&&(G.ph==='lobby'||G.mode==='train')){setKit(p,String(d.k||'').slice(0,24));broadcastLobby();}
  else if(d.t==='tr')trCmd(p,d);
  else if(d.t==='pick')hostPick(p,d.i|0);
  else if(d.t==='vote')hostVote(p,d.v);
}
function hostDrop(id){
  NET.conns.delete(id);
  if(!G||!G.players[id])return;
  const name=G.players[id].name;
  delete G.players[id];G.order=G.order.filter(x=>x!==id);
  toast(name+' ออกจากห้อง');
  if(G.ph!=='lobby'&&G.ph!=='over'){
    feed('🚪 '+name+' ออกจากเกม');
    if(G.mode==='imp')impCheck();
    else if(G.mode!=='coop'&&G.mode!=='train'&&G.mode!=='race'&&plist().length<2)endMatch();
  }
  broadcastLobby();
}

function validate(){
  const ps=plist(),M=MODES[G.mode];
  if(ps.length<M.min)return `โหมดนี้ต้องมีผู้เล่นอย่างน้อย ${M.min} คน`;
  if(ps.length>M.max)return `โหมดนี้เล่นได้สูงสุด ${M.max} คน`;
  if(M.team){
    const a=ps.filter(p=>p.lteam===0).length,b=ps.length-a;
    if(!a||!b)return 'ต้องมีผู้เล่นทั้งสองทีม';
    if(a>3||b>3)return 'แต่ละทีมมีได้สูงสุด 3 คน';
  }
  return '';
}
function hostStart(){
  const err=validate();if(err){toast(err);return;}
  // สุ่มแผนที่ทุกครั้งที่เริ่มเกม (ไม่ซ้ำกับรอบที่แล้วถ้าเป็นไปได้)
  const MD=MODES[G.mode];
  if(MD.map)G.map=MD.map;
  else if(G.mapPick&&MAPS[G.mapPick])G.map=G.mapPick;
  else{let ks=RANDOM_MAPS.filter(k=>k!==G.lastMap&&MAPS[k]&&mapOkFor(k,G.mode));if(!ks.length)ks=['castle'];G.map=ks[Math.floor(Math.random()*ks.length)];}
  G.lastMap=G.map;
  setMapVars(G.map);
  PROPON=!PROP_OFF_MODES.includes(G.mode);BLDON=PROPON;
  Object.assign(G,{ph:'count',cdT:3,time:0,proj:[],en:[],feed:[],pid:0,eid:0,wave:0,round:1,rw:{},teamScore:[0,0],
    timer:(G.mode==='ffa'||G.mode==='tdm')?480:G.mode==='quid'?360:0,result:null,banner:null,queue:[],slines:[],sorbs:[],sballs:[],sdomes:[],impWin:null,snitchBy:null,raceEnd:undefined});
  plist().forEach((p,i)=>{
    Object.assign(p,freshStats());
    p.team=(G.mode==='coop'||G.mode==='train')?0:MD.team?p.lteam:10+i;
  });
  placeAll();
  modeInit();
  if(G.mode==='coop'){G.wave=1;setupWave();}else if(G.mode!=='imp')banner(MD.name,3);
  hostLast=performance.now();
  VIEW.prev=VIEW.cur=null;
  sendAll({t:'start'});
  broadcastLobby();
  setScreen('game');
}
function hostToLobby(){G.ph='lobby';G.proj=[];G.en=[];broadcastLobby();}

function resetBody(p,x,y){
  Object.assign(p,{x,y,z:0,vz:0,fly:false,flyCd:0,root:0,vx:0,vy:0,hp:p.maxHp,alive:true,downed:false,revive:0,stun:0,burn:0,dash:0,inv:0,
    shieldOn:false,shieldE:100,shieldBroken:0,respawn:0});
  for(const k of CDK)p.cd[k]=0;clearStatus(p);p.trail=null;earthReset(p);
  p.ang=Math.atan2(MH/2-y,MW/2-x);
}
function fmap(){const M=MAPS[MAPID];return M&&M.fm;}
function spawnPts(){const f=fmap(),sp=f&&f.spawns.filter(s=>s.t===undefined);if(sp&&sp.length)return sp.map(s=>[s.x,s.y]);return SPAWNF.map(f=>[f[0]*MW,f[1]*MH]);}
// จุดเกิดของทีม t จากไฟล์แผนที่ (ไม่มี = แบ่งจุดเกิดทั่วไปซ้าย/ขวา) — คืน null ถ้าแผนที่ไม่มีจุดเกิดจากไฟล์
function teamPts(t){const f=fmap();if(!f||!f.spawns.length)return null;let a=f.spawns.filter(s=>s.t===t);if(!a.length){a=f.spawns.filter(s=>t?s.x>MW/2:s.x<=MW/2);if(!a.length)a=f.spawns;}return a.map(s=>[s.x,s.y]);}
function placeAll(){
  const ps=plist(),cx0=MW/2,cy0=MH/2;
  const f=fmap();
  if(f&&f.spawns.length&&G.mode!=='train'&&!MODES[G.mode].team){const sp=spawnPts();ps.forEach((p,i)=>resetBody(p,sp[i%sp.length][0],sp[i%sp.length][1]));}
  else if(f&&f.spawns.length&&MODES[G.mode].team){const k=[0,0];ps.forEach(p=>{const a=teamPts(p.team),q=a[k[p.team]++%a.length];resetBody(p,q[0],q[1]);});}
  else if(G.mode==='coop'||G.mode==='train')ps.forEach((p,i)=>{const a=i/ps.length*Math.PI*2+Math.PI;resetBody(p,cx0+Math.cos(a)*160,cy0+Math.sin(a)*160);collideWorld(p,PR);});
  else if(G.mode==='duel')ps.forEach((p,i)=>resetBody(p,MW*(i?0.86:0.14),cy0));
  else if(MODES[G.mode].team){
    const k=[0,0];
    ps.forEach(p=>{const t=p.team;resetBody(p,MW*(t?0.9:0.1),cy0+170*(k[t]++-1));});
  }else{const sp=spawnPts();ps.forEach((p,i)=>resetBody(p,sp[i%6][0],sp[i%6][1]));}
}
function respawn(p){
  let x,y;
  if(MODES[G.mode].team){const a=teamPts(p.team);if(a){const q=a[Math.floor(Math.random()*a.length)];x=q[0];y=q[1];}else{x=MW*(p.team?0.9:0.1);y=MH/2+rnd(-170,170);}}
  else if(G.mode==='race'){const n=G.rings.length,r=G.rings[(p.cp-1+n)%n];resetBody(p,r.x,r.y);p.fly=true;p.z=r.h;p.inv=1;p.ang=Math.atan2(G.rings[p.cp].y-r.y,G.rings[p.cp].x-r.x);emit({k:'revive',x:r.x,y:r.y});return;}
  else if(G.mode==='train'){const pv=G.tr&&G.tr.pvp;if(pv===1){x=MW*(p.team?0.62:0.38);y=MH/2+160;}else if(pv===2){const a=rnd(0,Math.PI*2);x=MW/2+Math.cos(a)*420;y=MH/2+Math.sin(a)*300;}else{x=MW/2;y=MH/2+160;}}
  else{
    let best=-1;
    for(const s of spawnPts()){
      let m=1e9;for(const q of plist())if(q!==p&&q.alive)m=Math.min(m,(q.x-s[0])**2+(q.y-s[1])**2);
      if(m>best){best=m;x=s[0];y=s[1];}
    }
  }
  resetBody(p,x,y);p.inv=1.5;
  if(G.mode==='quid'){p.fly=true;p.z=4;}
  emit({k:'revive',x,y});
}

// ---------- ลูปหลักฝั่งโฮสต์ ----------
function hostTick(dt){
  const g=G;
  g.time+=dt;
  if(g.ph==='count'){g.cdT-=dt;if(g.cdT<=0)g.ph='play';}
  const acting=g.ph==='play';
  for(const p of plist()){if(p.bot)botBrain(p,dt);updatePlayer(p,dt,acting);}
  if(acting){
    updateProjectiles(dt);updateSpells(dt);updateMins(dt);
    if(g.mode==='coop'||g.mode==='train')updateEnemies(dt);
  }
  modeLogic(dt);
}
function angDiff(a,b){let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d;}
// ความสูงจุดกึ่งกลางตัว / ครึ่งความสูง ของผู้เล่นหรือศัตรู
function cH(t){return t.isE?(t.h||0)+EDEF[t.type].ch:t.isM?(t.h||0)+0.9:(t.z||0)+1.1;}
function vR(t){return t.isE?EDEF[t.type].vr:t.isM?1:1.15;}

function updatePlayer(p,dt,acting){
  const inp=p.inp||emptyInput();
  const pr={};
  for(const k of ['q','e','r','f','sp','x','b','v','jp','g']){
    const c=(inp.c&&inp.c[k])|0;
    if(c!==(p.last[k]|0)){pr[k]=true;p.last[k]=c;}
  }
  if(pr.g&&PROPON&&p.alive&&!p.downed&&!p.gh)useProp(p);
  for(const k of CDK)p.cd[k]=Math.max(0,p.cd[k]-dt*(p.ovc>0?1.3:1));
  p.stun=Math.max(0,p.stun-dt);p.inv=Math.max(0,p.inv-dt);tickStatus(p,dt);
  if(p.breath>0)p.breath-=dt;
  if(p.snapT>0&&p.alive&&!p.downed){p.snapT-=dt;if(p.snapT<=0)pyroSnap(p);}
  if(p.colos>0){p.colos-=dt;if(p.colos<=0||!p.alive||p.downed){p.colos=0;emit({k:'efx',z:'colend',x:p.x,y:p.y,h:p.z+2,id:p.id});}}
  if(p.fmCd>0)p.fmCd-=dt;
  if(p.slam3){p.slam3.t-=dt;if(p.slam3.t<=0)frostSlam3(p);}
  if(p.hover>0){p.hover-=dt;if(p.hover<=0||!(p.kindle>0))p.hover=0;}
  if(p.slideT>0)p.slideT-=dt;
  if(p.cryo>0){p.cryo-=dt;p.inv=Math.max(p.inv,0.05);p.cryoTk-=dt;if(p.cryoTk<=0){p.cryoTk=0.5;healT(p,3.75);}if(p.cryo<=0){p.inv=0;emit({k:'efx',z:'cryoend',x:p.x,y:p.y,h:p.z+1,id:p.id});}}
  if(p.blaze>0&&p.alive&&!p.downed){p.blzTk=(p.blzTk||0)-dt;if(p.blzTk<=0){p.blzTk=0.5;p.blzN=(p.blzN|0)+1;for(const t of foesIn(p.team,p.x,p.y,130,p.z+3)){damage(t,9.375,p.id,'burn');if(!p.blzHit)p.blzHit=new Set();if(!p.blzHit.has(t)){p.blzHit.add(t);addBurn(t,1,p.id);}}}}
  if(p.auraT>0&&p.alive&&!p.downed){p.auraT-=dt;p.auraTk-=dt;const tk=p.auraTk<=0;if(tk)p.auraTk=0.5;for(const t of foesIn(p.team,p.x,p.y,180,p.z+3)){if(tk){damage(t,10,p.id,'zone');emit({k:'efx',z:'auhit',x:Math.round(t.x),y:Math.round(t.y),h:cH(t)});}}}
  if(p.mirror>0){p.mirror-=dt;if(p.mirror<=0){p.xhp=0;emit({k:'efx',z:'mirrorend',x:p.x,y:p.y,h:p.z+1,id:p.id});}}
  if(p.grT>0&&p.alive&&p.grM===1){p.grT-=dt;if(p.grT<=0)frostGlacier(p);}
  else if(p.grT>0&&p.alive){p.grT-=dt;if(p.grT<=0){const c=Math.cos(p.ang),s=Math.sin(p.ang);for(const sd of (p.mirror>0?[0,-1,1]:[0])){const ox=p.x+c*30-s*55*sd,oy=p.y+s*30+c*55*sd;(G.waves||(G.waves=[])).push({x:ox,y:oy,dx:c,dy:s,left:600,acc:0,owner:p.id,team:p.team,hit:new Set()});emit({k:'efx',z:'gwave',x:ox,y:oy,h:p.z+1,a:Math.round(p.ang*1000)/1000,len:600,id:p.id,cl:sd?1:0});}}}
  p.flyCd=Math.max(0,p.flyCd-dt);p.root=Math.max(0,p.root-dt);
  if(!p.alive){
    if(['ffa','tdm','quid','race','train'].includes(G.mode)&&acting){p.respawn-=dt;if(p.respawn<=0)respawn(p);}
    return;
  }
  p.boost=Math.max(0,(p.boost||0)-dt);
  // ตกลงพื้นเมื่อไม่ได้บิน
  const gravity=()=>{const gh=groundH(p.x,p.y,p.z);if(p.z>gh||p.vz>0){p.vz-=(p.slam?40:22)*dt;if(p.hover>0&&p.vz<-0.6)p.vz=-0.6;p.z+=p.vz*dt;if(p.z<=gh){if(p.vz<-12)emit({k:'land',x:p.x,y:p.y});p.z=gh;p.vz=0;if(p.slam)frostSlam(p);}}else p.z=gh;};
  if(p.downed){
    p.vx=p.vy=0;p.fly=false;gravity();
    let helper=null;
    for(const q of plist())if(q!==p&&q.alive&&!q.downed&&q.z<2&&Math.hypot(q.x-p.x,q.y-p.y)<75){helper=q;break;}
    if(helper&&acting){
      p.revive+=dt;
      if(p.revive>=2.5){p.downed=false;p.hp=Math.round(p.maxHp*0.4);p.inv=1;p.revive=0;feed(`✨ ${helper.name} ชุบ ${p.name} สำเร็จ`);emit({k:'revive',x:p.x,y:p.y});}
    }else p.revive=Math.max(0,p.revive-dt*0.5);
    return;
  }
  if(p.burn>0){p.burn-=dt;p.bt-=dt;if(p.bt<=0){p.bt=0.5;damage(p,4,p.burnSrc,'burn');if(!p.alive||p.downed)return;}}
  const canAct=acting&&p.stun<=0;
  if(acting&&(inp.ax||inp.ay))p.ang=Math.atan2(inp.ay-p.y,inp.ax-p.x)+(p.bld>0?rnd(-0.22,0.22):0);

  // ไม้กวาด: B ขึ้น/ลง — โดนสตันหรือใยแมงมุมจะตกจากไม้กวาด
  if(pr.b&&canAct&&p.flyCd<=0&&G.mode!=='imp'){
    p.fly=!p.fly;p.flyCd=0.8;
    if(p.fly){p.vz=7;p.shieldOn=false;p.dash=0;emit({k:'mount',x:p.x,y:p.y,h:p.z,id:p.id});}
    else emit({k:'dismount',x:p.x,y:p.y,h:p.z});
  }
  if(p.fly&&(p.stun>0||p.root>0)){p.fly=false;emit({k:'dismount',x:p.x,y:p.y,h:p.z});feed(`🧹 ${p.name} ตกจากไม้กวาด!`);}
  if(p.fly){
    const tv=(inp.jh?8:0)-(inp.ch?8:0);
    p.vz+=(tv-p.vz)*Math.min(1,6*dt);
    p.z=clamp(p.z+p.vz*dt,0.6,24);
  }else if(p.colos>0){p.colH=clamp((p.colH||9)+((inp.jh?1:0)-(inp.ch?1:0))*6*dt,5,15);p.z+=(p.colH-p.z)*Math.min(1,9*dt);p.vz=0;}
  else if(p.dfall)dragonfallTick(p,inp,dt);
  else if(p.sdome)stormDomeTick(p,inp,dt);
  else if(p.wr&&p.wr.ph!=='trans'){}   // Wrath: ลอยบนฟ้า (earthWrathTick คุมความสูง)
  else gravity();

  // โล่
  const wantSh=canAct&&!p.fly&&G.mode!=='imp'&&!(G.ball&&G.ball.holder===p.id)&&inp.sh&&p.shieldBroken<=0&&p.shieldE>5&&p.dash<=0&&!p.dchgOn&&!(p.colos>0)&&!(p.cryo>0)&&!p.dfall&&p.pathIdx!==2&&!p.aug&&!p.ramp&&!(p.wr&&p.wr.ph!=='trans');
  if(wantSh&&!p.shieldOn){p.shieldOn=true;p.shieldT=G.time;p.shBlk=0;p.shPar=0;}
  if(!wantSh)p.shieldOn=false;
  if(p.shieldOn){p.shieldE-=12*dt*((PBASIC[p.pathIdx|0]||{}).shDrain||1);if(p.shieldE<=0)breakShield(p);}
  else{p.shieldBroken=Math.max(0,p.shieldBroken-dt);if(p.shieldBroken<=0)p.shieldE=Math.min(100,p.shieldE+18*p.buffs.shReg*dt);}
  if(p.shWas&&!p.shieldOn){const B=PBASIC[p.pathIdx|0];if(B&&B.shDrop)B.shDrop(p);}
  p.shWas=p.shieldOn;
  if(p.pathIdx===2)stormTick(p,dt);
  if(p.pathIdx===EARTH)earthTick(p,dt);

  // เคลื่อนที่
  const ox0=p.x,oy0=p.y,oz0=p.z,onG0=!p.fly&&p.z<=groundH(p.x,p.y,p.z)+0.05;
  let mx,my;
  if(typeof inp.mx==='number'){mx=inp.mx;my=inp.my;}
  else{mx=(inp.r?1:0)-(inp.l?1:0);my=(inp.d?1:0)-(inp.u?1:0);}
  const ml=Math.hypot(mx,my);if(ml){mx/=ml;my/=ml;}
  if(!canAct||p.root>0||p.dchgOn||p.cryo>0){mx=my=0;}
  else if(p.fear>0){const fa=Math.atan2(p.y-p.fearY,p.x-p.fearX);mx=Math.cos(fa);my=Math.sin(fa);}
  const spd=(p.fly?540*p.buffs.spd:175*p.buffs.spd*(p.shieldOn?0.5:1))*(p.boost>0?1.45:1)*moveMul(p)*(p.wr||p.aug?earthSpd(p):1)*(p.dfall?(p.dfall.ph===2?0.45:0):p.sdome?(p.sdome.ph===2?0.45:0):p.rail?0:(p.kindle>0&&p.hover>0)?0.35:p.breath>0?0.7:(p.snapT>0||p.colos>0||p.grT>0)?0.5:1)*(p.slideT>0?1.8:1+(p.iceB||0));
  if(p.dash>0){
    p.dash-=dt;const ds=p.dashSp||900;p.x+=p.dashX*ds*dt;p.y+=p.dashY*ds*dt;
    if(p.trail){p.trail.acc-=dt;if(p.trail.acc<=0){p.trail.acc=0.045;addZone({x:p.x,y:p.y,r:44,t:2.5,tick:0.5,owner:p.id,team:p.team,kind:'fire',hit(t,z){damage(t,2,z.owner,'zone');ignite(t,z.owner,1);}});}}
    if(p.dash<=0){p.dashSp=0;p.trail=null;}
  }
  else if(p.slideT>0||p.slip>0){
    // ลื่น: ความเร็วค่อยๆ ตามทิศที่กด หยุดทันทีไม่ได้
    const k=Math.min(1,(p.slideT>0?2.2:1.6)*dt);
    p.mvx=(p.mvx||0)+(mx*spd-(p.mvx||0))*k;p.mvy=(p.mvy||0)+(my*spd-(p.mvy||0))*k;
    if(p.slideT>0&&!mx&&!my){p.mvx+=(Math.cos(p.ang)*spd-p.mvx)*k*0.5;p.mvy+=(Math.sin(p.ang)*spd-p.mvy)*k*0.5;}
    p.x+=p.mvx*dt;p.y+=p.mvy*dt;
  }
  else{p.x+=mx*spd*dt;p.y+=my*spd*dt;p.mvx=mx*spd;p.mvy=my*spd;}
  if(p.dash>0&&p.ultSlash)for(const t of foesOf(p.team)){if(p.ultSlash.has(t))continue;if(Math.hypot(t.x-p.x,t.y-p.y)<90+(t.r||PR)){p.ultSlash.add(t);p.noMul=true;aoeHit(p,t,75,t=>{t.fslUltT=3;});p.noMul=false;}}
  if(p.dash<=0)p.ultSlash=null;
  if(p.sdHit)stormDashTick(p);
  if(p.slideT>0&&Math.hypot(p.x-p.slX,p.y-p.slY)>40){const lx=p.slX,ly=p.slY;p.slX=p.x;p.slY=p.y;addIce({x:p.x,y:p.y,r:46,t:4,team:p.team,owner:p.id,kind:'path',lx,ly});}
  p.x+=p.vx*dt;p.y+=p.vy*dt;
  const fr=Math.exp(-6*dt);p.vx*=fr;p.vy*=fr;
  if(!p.gh)collideWorld(p,PR,p.z);else{p.x=clamp(p.x,30,MW-30);p.y=clamp(p.y,30,MH-30);}
  // พื้นสูงต่ำ (เนิน/หน้าผา) + ภูเขาน้ำแข็ง/พื้นชั้นบน: ขั้นต่ำๆ ก้าวขึ้นได้ / สูงเกินไปเป็นกำแพง
  if(!p.fly&&!(p.colos>0)){
    p.z=terrMove(p,ox0,oy0,p.z,onG0);
    const gh=groundH(p.x,p.y,p.z);if(gh>p.z+TSTEP){p.x=ox0;p.y=oy0;p.z=oz0;}else if(gh>p.z){p.z=gh;p.vz=0;if(p.slam)frostSlam(p);}
  }
  if(G.mode==='imp'){if(acting)impActions(p,pr,inp,dt);return;}
  // ควิดดิช: ถือบอลอยู่ = คลิกซ้ายเพื่อโยน (ร่ายเวทไม่ได้)
  if(G.ball&&G.ball.holder===p.id){if(canAct&&inp.fire&&!p.fireHeld)quidThrow(p);p.fireHeld=inp.fire;return;}
  p.fireHeld=inp.fire;
  // ควิดดิชและแข่งไม้กวาด ร่ายเวทบนไม้กวาดได้ / โหมดอื่นร่ายไม่ได้ (เหมือนในเกม)
  if(!canAct)p.dchgOn=false;
  if(!canAct||(p.fly&&G.mode!=='quid'&&G.mode!=='race'))return;

  const cdr=p.buffs.cdr;
  const setCd=(k,v)=>{p.cd[k]=v;p.cdMax[k]=v;};
  if(p.colos>0){colossusTick(p,inp,dt);return;}
  const B=PBASIC[p.pathIdx|0]||PBASIC[0];
  if(pr.v&&p.pathIdx===1&&!(p.fmCd>0)&&!(p.cryo>0)&&!(p.mirror>0)){p.fmode=p.fmode===1?0:1;p.fmCd=1;p.cmbT=0;emit({k:'efx',z:'fswap',x:p.x,y:p.y,h:p.z+1,id:p.id,m:p.fmode});}
  // กระโดด (Space) ทุกสาย
  if(pr.jp&&!(p.cryo>0)&&!(p.mudT>0)&&!(p.wr&&p.wr.ph!=='trans')&&!p.dchgOn&&p.z<=groundH(p.x,p.y,p.z)+0.05&&!(p.colos>0)){p.vz=8;emit({k:'efx',z:'jump',x:p.x,y:p.y,h:p.z,id:p.id});}
  if(p.cryo>0){if(pr.q)castSlot(p,0);if(pr.e)castSlot(p,1);if(pr.r)castSlot(p,2);if(pr.f)castSlot(p,3);return;}
  if(p.dfall||p.sdome||p.shk>0||(p.mudT>0&&!p.ramp)){}else if(B.dash){if(B.dash(p,inp,pr,dt,setCd))return;}
  else if(pr.sp&&p.cd.dodge<=0&&p.z<0.5){
    let dx=mx,dy=my;if(!dx&&!dy){dx=Math.cos(p.ang);dy=Math.sin(p.ang);}
    p.dash=0.18;p.dashX=dx;p.dashY=dy;p.inv=0.24;p.shieldOn=false;setCd('dodge',2.5*cdr);
    emit({k:'dash',x:p.x,y:p.y});
  }
  if(p.shieldOn&&!B.shieldSwing)return;
  if(B.tick)B.tick(p,inp,dt,setCd);
  else if(inp.fire&&p.cd.basic<=0){shoot(p,B.type,{sp:B.id});setCd('basic',0.35);}
  if(p.shieldOn)return;
  if(pr.q)castSlot(p,0);
  if(pr.e)castSlot(p,1);
  if(pr.r)castSlot(p,2);
  if(pr.f)castSlot(p,3);
  if(pr.x)castUlt(p);
}

function hitProp(o,dmg,by){
  const D=PROPDEF[o.k];if(!D||!D.hp||o.st!==0)return;
  o.hp-=dmg;
  if(o.hp<=0){o.st=1;emit({k:'prop',e:'b',i:o.i,x:Math.round(o.x),y:Math.round(o.y),h:D.hgt*0.5});}
  else if(G.time-o.ht>0.12){o.ht=G.time;emit({k:'prop',e:'h',i:o.i,x:Math.round(o.x),y:Math.round(o.y),h:D.hgt*0.6});}
}
// ให้คาถาวงกว้างทำลาย prop ด้วย: เรียก damagePropsIn(x,y,รัศมี,ดาเมจ,id) จากในคาถานั้น
function damagePropsIn(x,y,rad,dmg,by){if(!PROPON)return;for(const o of PROPS)if(o.st===0&&Math.hypot(o.x-x,o.y-y)<rad+o.r)hitProp(o,dmg,by);}
function nearUseProp(x,y){let best=null,bd=1e9;for(const o of PROPS){if(o.st!==0||!PROPDEF[o.k].use)continue;const d=Math.hypot(o.x-x,o.y-y)-o.r;if(d<PR+45&&d<bd){bd=d;best=o;}}return best;}
function useProp(p){
  const o=nearUseProp(p.x,p.y);if(!o)return;
  o.st=2;emit({k:'prop',e:'u',i:o.i,x:Math.round(o.x),y:Math.round(o.y),h:PROPDEF[o.k].hgt,id:p.id});
  const f=PROP_USE[o.k];if(f)f(p,o);
}
