// =====================================================================
//  โหมดพิเศษ: ควิดดิช / แข่งไม้กวาด / แบทเทิลรอยัล / หาลอร์ดโวลเดอมอร์ / ห้องฝึก
// =====================================================================
// ส่งข้อความลับถึงผู้เล่นคนเดียว (เช่น บทบาทในโหมดหาลอร์ดโวลเดอมอร์)
function sendPriv(id,m){
  if(id===NET.myId){onPriv(m);return;}
  const c=NET.conns.get(id);if(c&&c.open)try{c.send({t:'priv',m});}catch(e){}
}
const TASKF=[[.18,.2],[.5,.14],[.82,.2],[.12,.5],[.88,.5],[.18,.8],[.5,.86],[.82,.8],[.36,.38],[.64,.62]];
function taskPts(){const fm=fmap();if(fm&&fm.tasks.length)return fm.tasks.map(q=>({x:q.x,y:q.y}));return TASKF.map(f=>{const o={x:f[0]*MW,y:f[1]*MH};collideWorld(o,34);return o;});}
function raceRings(){
  {const f=fmap();if(f&&f.rings.length>=3)return f.rings.map(r=>({x:r.x,y:r.y,h:r.h}));}
  const n=10,rx=MW*0.36,ry=MH*0.33,R=mulberry(77+MW),out=[];
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2;out.push({x:MW/2+Math.cos(a)*rx*(1+0.12*Math.sin(3*a)),y:MH/2+Math.sin(a)*ry*(1+0.12*Math.cos(2*a)),h:3.5+R()*7});}
  return out;
}
function modeInit(){
  const ps=plist(),m=G.mode;
  Object.assign(G,{ball:null,snitch:null,rings:null,zone:null,items:null,bodies:[],meet:null,bombs:[],zones:[],strikes:[],walls:[],chan:[],mins:[],erings:[],ices:[],waves:[],glac:[],eso:[],edust:[],mid:0,zid:0,fin:0,qs:[0,0],tp:null,taskDone:0,taskTotal:0});
  ps.forEach(p=>{p.gh=false;p.role=null;p.unl=null;p.doing=null;p.lap=0;p.cp=0;p.fin=0;p.boost=0;});
  if(m==='quid'){
    const qa=quidArea();G.ball={x:qa.cx,y:qa.cy,h:6,vx:0,vy:0,vh:0,holder:null,cool:1,thrower:null};
    ps.forEach(p=>{p.fly=true;p.z=4;});
  }else if(m==='race'){
    G.rings=raceRings();G.laps=2;G.raceT=0;
    const r0=G.rings[0];
    ps.forEach((p,i)=>{resetBody(p,r0.x+(i%3-1)*70,r0.y-280-Math.floor(i/3)*90);p.fly=true;p.z=r0.h;p.ang=Math.PI/2;});
  }else if(m==='br'){
    const R0=Math.hypot(MW,MH)*0.6;
    G.zone={cx:MW/2+rnd(-0.12,0.12)*MW,cy:MH/2+rnd(-0.12,0.12)*MH,r:R0,r0:R0,rEnd:170,t:0,grace:25,T:200};
    G.items=[];
    const kinds=['fire','stun','push','pull','fire','stun','hp','hp','sh','ult'];
    for(let i=0;i<48;i++){const o={x:rnd(90,MW-90),y:rnd(90,MH-90)};collideWorld(o,34);G.items.push({id:i+1,x:o.x,y:o.y,k:kinds[i%kinds.length]});}
    ps.forEach((p,i)=>{const a=i/ps.length*Math.PI*2+rnd(0,0.5);resetBody(p,clamp(MW/2+Math.cos(a)*MW*0.38,100,MW-100),clamp(MH/2+Math.sin(a)*MH*0.38,100,MH-100));collideWorld(p,PR);p.unl={};});
  }else if(m==='imp'){
    const sh=shuffle([...ps]),ni=ps.length>=6?2:1;
    G.tp=taskPts();
    sh.forEach((p,i)=>{
      p.role=i<ni?'imp':'crew';p.killCd=15;p.emerg=1;
      p.tasks=shuffle(G.tp.map((_,k)=>k)).slice(0,4);p.tdone=[];
      if(p.role==='crew')G.taskTotal+=4;
    });
    ps.forEach((p,i)=>{
      const a=i/ps.length*Math.PI*2;resetBody(p,MW/2+Math.cos(a)*170,MH/2+Math.sin(a)*170);collideWorld(p,PR);
      p.title=p.role==='imp'?(sh.indexOf(p)===0?'ลอร์ดโวลเดอมอร์':'ผู้เสพความตาย'):'นักเรียนฮอกวอตส์';
      sendPriv(p.id,{t:'role',role:p.role,title:p.title,mates:p.role==='imp'?sh.slice(0,ni).filter(q=>q!==p).map(q=>q.id):[],tasks:p.tasks,tdone:[]});
    });
    banner(`🐍 ลอร์ดโวลเดอมอร์${ni>1?'และผู้เสพความตาย':''}แฝงตัวอยู่ในหมู่พวกเรา — ทำภารกิจ แล้วหาตัวให้เจอ!`,4);
  }else if(m==='train'){
    // Test Place: หุ่นซ้อมเรียงเป็นแถว + 1 ตัวไกลๆ ไว้ฝึกยิงระยะไกล • ค่าตั้ง G.tr คงอยู่ข้ามรอบ
    G.tr=Object.assign({datk:1,mai:1,nocd:0,ult:0,god:0,pvp:0},G.tr||{});G.ar=null;trTeams();
    const cy=MH/2-260;
    for(let i=0;i<5;i++)spawnDummy(MW/2+(i-2)*170,cy);
    spawnDummy(MW/2,MH/2-500);   // ไม่เกินรั้วโซนเทสสกิล (y 2100)
    testDummySpots().forEach(([x,y],i)=>{spawnDummy(x,y);G.en[G.en.length-1].spot=i;});G.spotT=[];   // หุ่นประจำจุดทดสอบ (ลานยิงไกล / วงวัดรัศมี)
    G.tipT=0;G.tipI=0;
  }
}
function spawnDummy(x,y){
  const o={x,y};collideWorld(o,EDEF.dummy.r);
  G.en.push({id:++G.eid,isE:true,type:'dummy',x:o.x,y:o.y,ax:o.x,ay:o.y,h:0,r:EDEF.dummy.r,hp:EDEF.dummy.hp,maxHp:EDEF.dummy.hp,spd:0,cd:rnd(2,4),cd2:99,cd3:99,stun:0,vx:0,vy:0,slam:0,lunge:0,burn:0,bt:0,team:-1,ph:0});
  emit({k:'spawn',x:o.x,y:o.y,t:'dummy'});
}
function trainTick(dt){
  const n=G.en.filter(e=>e.type==='dummy'&&e.spot===undefined).length;
  G.dummyT=(G.dummyT||0)-dt;
  if(n<6&&G.dummyT<=0){G.dummyT=2;spawnDummy(MW/2+rnd(-340,340),MH/2-260+rnd(-60,60));}
  // หุ่นประจำจุดทดสอบ: ตายแล้วฟื้นที่เดิมหลัง 3 วิ
  const ST=G.spotT||(G.spotT=[]);
  testDummySpots().forEach(([x,y],i)=>{if(G.en.some(e=>e.spot===i))return;ST[i]=(ST[i]===undefined?3:ST[i])-dt;if(ST[i]<=0){ST[i]=undefined;spawnDummy(x,y);G.en[G.en.length-1].spot=i;}});
  const T=G.tr||{};
  arenaTick(dt);
  for(const p of humans()){   // ค่าโกง (ไม่มีคูลดาวน์/อัลติเต็ม/อมตะ) ไม่ใช้กับบอท และคนที่กำลังแข่งในสังเวียน
    if(p.arSide)continue;
    if(T.nocd)for(const k of ['q','e','r','f'])p.cd[k]=0;
    if(T.ult)p.ult=100;
    if(T.god&&p.alive)p.hp=p.maxHp;
  }
}
// คำสั่งจากเมนูทดลอง (ใครในห้องก็กดได้): ตั้งค่า / เสกมอนสเตอร์ในโซน / ล้างมอนสเตอร์
const TR_KEYS=['datk','mai','nocd','ult','god'];
// ทีมในห้องฝึก: pvp 0 = ทีมเดียวกันหมด, 1 = แบ่ง 2 ทีม (ผู้เล่นเลือกเอง p.trT), 2 = ตัวใครตัวมัน
function trTeams(){
  const T=G.tr||{};
  plist().forEach((p,i)=>{
    if(p.arSide){p.team=AR_TEAM[p.arSide];return;}   // กำลังแข่งในสังเวียน (js/15-arena)
    if(p.ai){p.team=p.ai.team;return;}   // บอท = ทีมบอท (js/15-bot)
    if(p.trT===undefined)p.trT=i%2;
    p.team=T.pvp===1?p.trT:T.pvp===2?10+i:0;
  });
  if(G.mins)for(const m of G.mins){const o=G.players[m.owner];if(o)m.team=o.team;}
}
function trCmd(p,d){
  if(!G||G.mode!=='train'||G.ph==='over'||G.ph==='lobby')return;
  G.tr=G.tr||{};
  if(d.c==='pvp'){const v=clamp(d.v|0,0,2);if(G.tr.pvp!==v){G.tr.pvp=v;trTeams();feed(['🤝 ทุกคนทีมเดียวกัน','⚔️ แบ่ง 2 ทีม','💥 ตัวใครตัวมัน'][v]);}}
  else if(d.c==='team'){p.trT=d.v?1:0;trTeams();if(G.tr.pvp===1)feed(`${p.name} → ${TEAMN[p.trT]}`);}
  else if(d.c==='set'&&TR_KEYS.includes(d.k)){G.tr[d.k]=d.v?1:0;if(d.k==='ult'&&!d.v)for(const q of plist())q.ult=0;}
  else if(d.c==='spawn'&&typeof d.e==='string'&&Object.prototype.hasOwnProperty.call(EDEF,d.e)){
    const cnt=clamp(d.n|0||1,1,10),z=trZone();
    for(let i=0;i<cnt&&G.en.length<40;i++){
      const a=rnd(0,Math.PI*2),r=rnd(0,z.r*0.55);
      if(d.e==='dummy'){spawnDummy(z.x+Math.cos(a)*r,z.y+Math.sin(a)*r);G.en[G.en.length-1].trz=1;}
      else spawnEnemy(d.e,{x:z.x+Math.cos(a)*r,y:z.y+Math.sin(a)*r});
    }
    feed(`🧪 ${p.name} เสก ${EDEF[d.e].name}${cnt>1?' ×'+cnt:''}`);
  }
  else if(d.c==='bot'||d.c==='botclr')trBotCmd(p,d);
  else if(d.c==='clear'){for(const e of G.en)if(e.type!=='dummy'||e.trz){e.dead=true;}G.en=G.en.filter(e=>!e.dead);feed('🧹 ล้างมอนสเตอร์แล้ว');}
}
function hostEndTraining(){if(G&&G.mode==='train'&&G.ph!=='over')endMatch();}

// ---------- ควิดดิช ----------
function quidThrow(p){
  const b=G.ball,a=p.ang,sp=980;
  Object.assign(b,{holder:null,thrower:p.id,cool:0.45,x:p.x+Math.cos(a)*30,y:p.y+Math.sin(a)*30,h:p.z+1.4,
    vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,vh:Math.tan(clamp((p.inp&&p.inp.ap)||0,-0.9,0.9))*sp/20+1.5});
  emit({k:'throw',x:p.x,y:p.y,h:p.z+1.4});
}
function quidDrop(p){
  const b=G.ball;
  Object.assign(b,{holder:null,cool:0.6,thrower:p.id,vx:rnd(-160,160),vy:rnd(-160,160),vh:3});
  emit({k:'fumble',x:p.x,y:p.y,h:p.z+1.4});feed(`💥 ${p.name} ทำบอลหลุด!`);
}
// สนามควิดดิช = พื้นที่เล่นของโหมด (เมือง: สนามกีฬา) หรือทั้งแผนที่ (สนามควิดดิชเดิม)
function quidArea(){const A=AREA&&!AREA.r?AREA:{x1:0,y1:0,x2:MW,y2:MH};return Object.assign({cx:(A.x1+A.x2)/2,cy:(A.y1+A.y2)/2},A);}
function quidTick(dt){
  const b=G.ball;if(!b)return;
  b.cool=Math.max(0,b.cool-dt);
  if(b.holder){
    const p=G.players[b.holder];
    if(!p||!p.alive)b.holder=null;
    else{b.x=p.x+Math.cos(p.ang)*24;b.y=p.y+Math.sin(p.ang)*24;b.h=p.z+1.3;return;}
  }
  const px=b.x;
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.h+=b.vh*dt;b.vh-=7*dt;
  const dr=Math.exp(-0.6*dt);b.vx*=dr;b.vy*=dr;
  if(b.h<0.45){b.h=0.45;b.vh=Math.abs(b.vh)*0.45;b.vx*=0.85;b.vy*=0.85;}
  const qa=quidArea();
  if(b.x<qa.x1+30||b.x>qa.x2-30){b.vx*=-0.6;b.x=clamp(b.x,qa.x1+30,qa.x2-30);}
  if(b.y<qa.y1+30||b.y>qa.y2-30){b.vy*=-0.6;b.y=clamp(b.y,qa.y1+30,qa.y2-30);}
  // ลอดห่วง = ได้แต้ม (ทีมฟ้ายิงห่วงขวา ทีมแดงยิงห่วงซ้าย)
  for(const o of OBS){
    if(o.k!=='hoop')continue;
    if((px-o.x)*(b.x-o.x)<=0&&px!==b.x&&Math.abs(b.y-o.y)<34&&Math.abs(b.h-o.ring)<1.7){
      const team=o.x>qa.cx?0:1;
      G.qs[team]+=10;
      const sc=G.players[b.thrower];
      feed(`🏟️ ${sc?sc.name:TEAMN[team]} ยิงเข้าห่วง! ${TEAMN[team]} +10`);
      emit({k:'goal',x:o.x,y:o.y,h:o.ring,tm:team});
      Object.assign(b,{x:qa.cx,y:qa.cy,h:7,vx:0,vy:0,vh:0,holder:null,cool:1.5,thrower:null});
      return;
    }
  }
  if(b.cool>0)return;
  for(const p of plist()){
    if(!p.alive||p.downed)continue;
    if(Math.hypot(p.x-b.x,p.y-b.y)<44&&Math.abs(p.z+1.1-b.h)<1.9){
      b.holder=p.id;b.thrower=null;emit({k:'catch',x:p.x,y:p.y,h:p.z+1.4,id:p.id});break;
    }
  }
}
function snitchTick(dt){
  if(!G.snitch){
    if(G.timer<=150){{const qa=quidArea();G.snitch={x:qa.cx,y:qa.cy,h:10,tx:qa.cx,ty:qa.cy,th:8,rt:0};}banner('✨ ลูกบอลทองปรากฏแล้ว! จับได้ +50 และจบเกมทันที',3.5);emit({k:'snitch',x:MW/2,y:MH/2,h:10});}
    return;
  }
  const s=G.snitch;
  s.rt-=dt;if(s.rt<=0){s.rt=rnd(0.6,1.4);{const qa=quidArea();s.tx=rnd(qa.x1+150,qa.x2-150);s.ty=rnd(qa.y1+150,qa.y2-150);}s.th=rnd(2,14);}
  let near=null,nd=1e9;
  for(const p of plist())if(p.alive){const d=Math.hypot(p.x-s.x,p.y-s.y);if(d<nd){nd=d;near=p;}}
  const dx=s.tx-s.x,dy=s.ty-s.y,d=Math.hypot(dx,dy)||1;
  let vx=dx/d*430,vy=dy/d*430;
  if(near&&nd<220){vx+=(s.x-near.x)/Math.max(nd,1)*260;vy+=(s.y-near.y)/Math.max(nd,1)*260;}
  {const qa=quidArea();s.x=clamp(s.x+vx*dt,qa.x1+60,qa.x2-60);s.y=clamp(s.y+vy*dt,qa.y1+60,qa.y2-60);}s.h+=(s.th-s.h)*2*dt;
  for(const p of plist()){
    if(!p.alive)continue;
    if(Math.hypot(p.x-s.x,p.y-s.y)<36&&Math.abs(p.z+1.2-s.h)<1.5){
      G.qs[p.team]+=50;G.snitchBy=p.name;
      feed(`✨ ${p.name} จับลูกบอลทองได้! +50`);emit({k:'snitchc',x:s.x,y:s.y,h:s.h});
      endMatch();return;
    }
  }
}

// ---------- แข่งไม้กวาด ----------
function raceTick(dt){
  G.raceT+=dt;
  const n=G.rings.length;
  for(const p of plist()){
    if(!p.alive||p.fin)continue;
    const r=G.rings[p.cp];
    if(Math.hypot(p.x-r.x,p.y-r.y)<58&&Math.abs(p.z+0.9-r.h)<2.7){
      p.cp++;p.boost=1.3;emit({k:'ringp',x:r.x,y:r.y,h:r.h,id:p.id});
      if(p.cp>=n){
        p.cp=0;p.lap++;
        if(p.lap>=G.laps){
          p.fin=++G.fin;p.finT=G.raceT;
          feed(`🏁 ${p.name} เข้าเส้นชัยอันดับ ${p.fin}! (${p.finT.toFixed(1)} วิ)`);
          emit({k:'finish',x:p.x,y:p.y,h:p.z+1,id:p.id});
          if(p.fin===1){G.raceEnd=45;banner(`🏆 ${p.name} เข้าเส้นชัยเป็นคนแรก! ที่เหลือมีเวลา 45 วิ`,3);}
        }else feed(`🔁 ${p.name} เข้ารอบที่ ${p.lap+1}`);
      }
    }
  }
  if(G.raceEnd!==undefined)G.raceEnd-=dt;
  if(plist().every(p=>p.fin)||(G.raceEnd!==undefined&&G.raceEnd<=0))endMatch();
}
function raceRank(){
  return [...plist()].sort((a,b)=>{
    if(a.fin&&b.fin)return a.fin-b.fin;if(a.fin)return -1;if(b.fin)return 1;
    const pa=(a.lap|0)*100+(a.cp|0),pb=(b.lap|0)*100+(b.cp|0);if(pa!==pb)return pb-pa;
    if(!G.rings)return 0;
    const ra=G.rings[a.cp|0],rb=G.rings[b.cp|0];
    return Math.hypot(a.x-ra.x,a.y-ra.y)-Math.hypot(b.x-rb.x,b.y-rb.y);
  });
}

// ---------- แบทเทิลรอยัล ----------
function brTick(dt){
  const z=G.zone;z.t+=dt;
  const k=clamp((z.t-z.grace)/z.T,0,1);
  z.r=z.r0+(z.rEnd-z.r0)*k;
  if(z.t>z.grace&&!z.warned){z.warned=1;banner('🌀 วงเวทเริ่มหดแล้ว! อยู่ในวงไว้',3);emit({k:'zone',x:z.cx,y:z.cy});}
  for(const p of plist()){
    if(!p.alive)continue;
    if(Math.hypot(p.x-z.cx,p.y-z.cy)>z.r){p.zt=(p.zt||0)-dt;if(p.zt<=0){p.zt=0.5;damage(p,3+5*k,null,'zone');}}
    if(p.z>2.5)continue;
    for(const it of G.items)if(!it.got&&Math.hypot(p.x-it.x,p.y-it.y)<42){it.got=1;brPick(p,it);}
  }
  G.items=G.items.filter(i=>!i.got);
  if(plist().filter(p=>p.alive).length<=1)endMatch();
}
const ITEMN={fire:'🔓 คาถาช่อง Q',stun:'🔓 คาถาช่อง E',push:'🔓 คาถาช่อง R',pull:'🔓 คาถาช่อง F',hp:'❤️ ยาฟื้นเลือด',sh:'🛡️ ยาโล่',ult:'🌟 พลังโบราณ'};
function brPick(p,it){
  const k=it.k;
  if(['fire','stun','push','pull'].includes(k))p.unl[k]=1;
  else if(k==='hp')p.hp=Math.min(p.maxHp,p.hp+40);
  else if(k==='sh'){p.shieldE=100;p.shieldBroken=0;p.ehp=E_SH;p.stdB=0;}
  else if(k==='ult')p.ult=Math.min(100,p.ult+50);
  emit({k:'pick',x:it.x,y:it.y,t:k,id:p.id});
}

// ---------- หาลอร์ดโวลเดอมอร์ ----------
function impActions(p,pr,inp,dt){
  // E = ทำภารกิจ (ยืนใกล้จุดของตัวเอง 2.5 วิ) — ผีก็ทำได้
  if(pr.e&&!p.doing){
    const ti=p.tasks.find(t=>!p.tdone.includes(t)&&Math.hypot(p.x-G.tp[t].x,p.y-G.tp[t].y)<62);
    if(ti!==undefined)p.doing={t:ti,left:2.5};
  }
  if(p.doing){
    const tp=G.tp[p.doing.t];
    if(Math.hypot(p.x-tp.x,p.y-tp.y)>75)p.doing=null;
    else{
      p.doing.left-=dt;
      if(p.doing.left<=0){
        p.tdone.push(p.doing.t);
        if(p.role==='crew')G.taskDone++;
        sendPriv(p.id,{t:'tasks',tdone:p.tdone});
        emit({k:'taskdone',x:tp.x,y:tp.y,id:p.id});
        p.doing=null;impCheck();
      }
    }
  }
  if(p.gh)return;
  p.killCd=Math.max(0,(p.killCd||0)-dt);
  // Q = โวลเดอมอร์ร่ายอวาดา เคดาฟรา (ระยะประชิด)
  if(pr.q&&p.role==='imp'&&p.killCd<=0){
    let v=null,bd=80;
    for(const q of plist())if(q!==p&&!q.gh&&q.role!=='imp'){const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<bd){bd=d;v=q;}}
    if(v){
      v.gh=true;v.doing=null;
      G.bodies.push({id:v.id,x:v.x,y:v.y,c:v.color,n:v.name});
      p.killCd=25;sendPriv(p.id,{t:'kc',v:25});
      emit({k:'kill',x:v.x,y:v.y,id:v.id});
      impCheck();
    }
  }
  // R = รายงานศพ / F = ประชุมฉุกเฉิน (ต้องอยู่กลางแผนที่)
  if(pr.r){const b=G.bodies.find(b=>Math.hypot(b.x-p.x,b.y-p.y)<110);if(b)startMeeting(p,b);}
  if(pr.f&&p.emerg>0&&Math.hypot(p.x-MW/2,p.y-MH/2)<160){p.emerg--;startMeeting(p,null);}
}
function startMeeting(p,body){
  if(G.ph!=='play')return;
  G.ph='meet';G.meet={by:p.name,body:body?body.n:null,t:50,votes:{},res:null};G.bodies=[];
  const al=plist();
  al.forEach((q,i)=>{const a=i/al.length*Math.PI*2;q.x=MW/2+Math.cos(a)*170;q.y=MH/2+Math.sin(a)*170;collideWorld(q,PR);q.doing=null;q.ang=Math.atan2(MH/2-q.y,MW/2-q.x);});
  emit({k:'meeting',x:MW/2,y:MH/2});
}
function hostVote(p,v){
  if(!G||G.ph!=='meet'||!G.meet||G.meet.res||p.gh||G.meet.votes[p.id]!==undefined)return;
  if(v!=='skip'&&!plist().some(q=>q.id===v&&!q.gh))return;   // v มาจากเครือข่าย: ต้องเป็นผู้เล่นจริงในห้อง
  G.meet.votes[p.id]=v;emit({k:'voted',x:0,y:0});
}
function meetTick(dt){
  const m=G.meet;if(!m)return;
  if(m.res){
    m.rt-=dt;
    if(m.rt<=0){G.meet=null;G.ph='play';plist().forEach(p=>{if(p.role==='imp'&&!p.gh){p.killCd=20;sendPriv(p.id,{t:'kc',v:20});}});impCheck();}
    return;
  }
  m.t-=dt;
  const voters=plist().filter(p=>!p.gh);
  if(m.t<=0||voters.every(p=>m.votes[p.id]!==undefined)){
    const cnt={};for(const v of Object.values(m.votes))cnt[v]=(cnt[v]||0)+1;
    let best=null,bc=0,tie=false;
    for(const [k,c] of Object.entries(cnt)){if(c>bc){best=k;bc=c;tie=false;}else if(c===bc)tie=true;}
    if(!best||best==='skip'||tie)m.res='ไม่มีใครถูกโหวตออก';
    else if(!plist().some(x=>x.id===best))m.res='ไม่มีใครถูกโหวตออก (คนที่ถูกโหวตออกจากห้องไปแล้ว)';   // คนโดนโหวตหลุดระหว่างประชุม = เดิมโฮสต์ค้างทั้งเกม
    else{const q=G.players[best];q.gh=true;m.res=`${q.name} ถูกโหวตออก — ${q.role==='imp'?'เป็นฝ่ายโวลเดอมอร์จริง! 🐍':'ไม่ใช่โวลเดอมอร์ ⚡'}`;}
    m.rt=4.5;m.tally=cnt;emit({k:'eject',x:0,y:0});
  }
}
function impCheck(){
  if(G.mode!=='imp'||G.ph==='over')return;
  const ps=plist(),imp=ps.filter(p=>p.role==='imp'&&!p.gh).length,crew=ps.filter(p=>p.role!=='imp'&&!p.gh).length;
  if(imp===0){G.impWin='crew';endMatch();}
  else if(imp>=crew){G.impWin='imp';endMatch();}
  else if(G.taskTotal>0&&G.taskDone>=G.taskTotal){G.impWin='crew';endMatch();}
}

// ---------- ระเบิดที่ตั้งเวลาไว้ (ลูกไฟมังกร / คลื่นไฟ) ----------
function bombTick(dt){
  if(!G.bombs||!G.bombs.length)return;
  for(const b of G.bombs){
    b.t-=dt;
    if(b.t<=0){
      b.done=1;emit({k:'fbomb',x:b.x,y:b.y,r:b.r});damageEnv(b.x,b.y,b.r,b.dmg*2,null,'blast',0);
      for(const p of plist())if(p.alive&&!p.downed&&p.z<b.low&&Math.hypot(p.x-b.x,p.y-b.y)<b.r+PR)damage(p,b.dmg*G.escale,null,'aoe');
    }
  }
  G.bombs=G.bombs.filter(b=>!b.done);
}

// ข้อมูลเฉพาะโหมดใน snapshot
function modeSnap(){
  const M={};
  if(G.mode==='quid'){
    M.qs=G.qs;
    if(G.ball)M.ball={x:r1(G.ball.x),y:r1(G.ball.y),h:r1(G.ball.h),hd:G.ball.holder};
    if(G.snitch)M.sn={x:r1(G.snitch.x),y:r1(G.snitch.y),h:r1(G.snitch.h)};
  }else if(G.mode==='race'&&G.rings){
    M.rings=G.rings.map(r=>[Math.round(r.x),Math.round(r.y),r1(r.h)]);M.laps=G.laps;M.rt=r1(G.raceT);M.re=G.raceEnd!==undefined?Math.ceil(G.raceEnd):-1;
  }else if(G.mode==='br'&&G.zone){
    const z=G.zone;M.zone={cx:Math.round(z.cx),cy:Math.round(z.cy),r:Math.round(z.r),sh:z.t>z.grace,tl:Math.max(0,Math.ceil(z.grace-z.t))};
    M.items=G.items.map(i=>[i.id,Math.round(i.x),Math.round(i.y),i.k]);
    M.al=plist().filter(p=>p.alive).length;
  }else if(G.mode==='train'&&G.tr){
    M.tr=G.tr;
  }else if(G.mode==='imp'){
    M.td=G.taskDone;M.tt=G.taskTotal;
    M.bodies=G.bodies.map(b=>[b.id,Math.round(b.x),Math.round(b.y),b.c]);
    if(G.meet){const m=G.meet;M.meet={by:m.by,body:m.body,t:Math.ceil(Math.max(0,m.t)),voted:Object.keys(m.votes),res:m.res,tally:m.res?m.tally:null};}
  }
  return M;
}

// ---------- สร้าง snapshot ส่งให้ทุกเครื่อง ----------
const r1=v=>Math.round(v*10)/10;
// ลดขนาด snapshot ที่ส่งออกเน็ต: ช่องของผู้เล่นที่เป็นค่าปกติ (false/0/ว่าง) ไม่ต้องส่ง — ลูกข่ายเติมกลับเป็นค่าเดิมเป๊ะ (unpackP) • โฮสต์ใช้ snapshot เต็มเหมือนเดิม
const DEFP={fl:false,rt:false,z:0,aw:0,wv:0,al:true,dn:false,rv:0,sh:false,st:false,ds:false,iv:false,bn:false,u:0,k:0,d:0,rs:0,bo:null,bR:null,pk:false,dmg:0,fm:0,gh:false,hb:false,lap:0,cp:0,fin:0,bs:false,br:0,cg:0,dc:0,bm:0,sn:0,co:0,kd:0,hv:0,df:0,sm:0,ob:0,fr:0,xh:0,fs:0,ul:'',tk:0};
function packP(L){return L.map(p=>{const o={};for(const k in p)if(!(k in DEFP)||p[k]!==DEFP[k])o[k]=p[k];return o;});}
function unpackP(s){if(s&&s.P)for(const p of s.P)for(const k in DEFP)if(!(k in p))p[k]=DEFP[k];}
function makeSnap(){
  return {ph:G.ph,sl:G.endT>0?1:0,ot:G.ot&&G.mode==='ffa'?1:0,PT:ffaSnapPots(),mode:G.mode,mp:G.map,PB:PROPON?PROPS.map(o=>o.st).join(''):'',BD:bldSnap(),BK:brkSnap(),CB:citySnapB(),CS:citySnapS(),tm:Math.max(0,Math.ceil(G.timer)),cd:G.cdT||0,wave:G.wave,round:G.round,rw:G.rw,ts:G.teamScore,
    bt:Math.ceil(G.buffT||0),ban:G.banner?G.banner.text:'',res:G.result,el:G.en.length+G.queue.length,
    feed:G.feed.filter(f=>G.time-f.t<6).slice(-5).map(f=>f.text),
    P:plist().map(p=>({id:p.id,n:p.name,c:p.color,tm:p.team,x:r1(p.x),y:r1(p.y),z:r1(p.z||0),fl:!!p.fly,rt:p.root>0,a:Math.round(p.ang*100)/100,fh:p.fly&&p.flyOn?Math.round(p.fh*100)/100:0,bb:p.fly&&p.flyOn?[Math.round(p.bbv||0),p.bbf|0]:0,
      hp:Math.ceil(p.hp),mh:p.maxHp,aw:p.awayT>0?1:0,wv:p.alive&&!p.downed?p.wSpd|0:0,al:p.alive,dn:p.downed,rv:r1(p.revive),sh:p.shieldOn,se:Math.round(p.shieldE),
      st:p.stun>0,ds:p.dash>0,iv:p.inv>0,bn:p.burn>0,u:Math.floor(p.ult),k:p.kills,d:p.deaths,rs:Math.ceil(p.respawn),
      cd:CDK.map(k=>r1(p.cd[k])),cm:CDK.map(k=>p.cdMax[k]||1),bo:p.bo,bR:p.br,pk:p.picked,bf:p.taken,dmg:Math.round(p.dmgDealt),
      fm:fxMask(p),ea:earthSnapP(p),wn:windSnapP(p),gh:!!p.gh,hb:!!(G.ball&&G.ball.holder===p.id),lap:p.lap|0,cp:p.cp|0,fin:p.fin|0,bs:p.boost>0,br:p.brn|0,cg:p.chg>0.25?Math.round(Math.min(1,(p.chg-0.25)/1.25)*20)/20:0,dc:p.dchgOn?Math.round(p.dchg/4*20)/20+0.01:0,bm:p.breath>0?(p.breath>2?1:2):0,sn:p.snapT>0?1:0,co:p.colos>0?(p.colN|0)+1:0,kd:p.kindle|0,hv:p.hover>0?1:0,df:p.dfall?[p.dfall.ph,Math.round(p.dfall.tx),Math.round(p.dfall.ty),Math.round(Math.max(0,p.dfall.t)*100)/100]:p.sdome?[p.sdome.ph,Math.round(p.sdome.tx),Math.round(p.sdome.ty),Math.round(Math.max(0,p.sdome.t)*100)/100,1]:0,sm:p.pathIdx===2?[p.lst|0,(p.god>0?p.cEmp:p.emp)?1:0,Math.round((p.dch===undefined?3:p.dch)*10)/10,(p.beam?1:0)|(p.stS?2:0)|(p.god>0?4:0)|(p.slnT>0?8:0)|(p.rail?16:0),p.stS?Math.round(p.stS.abs):0,p.sorb?p.sorb.n:0,p.rail?[Math.round(p.rail.a*100)/100,Math.round(p.rail.t*100)/100,p.rail.len,p.rail.max]:0,p.bTg||0]:0,ob:p.orbs|0,fr:p.pathIdx===1?[p.fmode|0,p.swN|0,p.swC|0,(p.slideT>0?1:0)|(p.cryo>0?2:0)|(p.auraT>0?4:0)|(p.ffT>0?8:0)|(p.mirror>0?16:0)|(p.grT>0?32:0)]:0,xh:Math.ceil(p.xhp||0),fs:Math.round(frostSlow(p))||0,ul:p.unl?Object.keys(p.unl).join(','):'',tk:p.doing?r1(p.doing.left):0})),
    M:modeSnap(),
    E:G.en.map(e=>({id:e.id,t:e.type,x:r1(e.x),y:r1(e.y),h:r1(e.h||0),hp:Math.ceil(e.hp),mh:Math.ceil(e.maxHp),sl:e.slam>0,st:e.stun>0,bn:e.burn>0,br:e.brn|0,fm:fxMask(e),lg:e.lunge>0})),
    MN:(G.mins||[]).map(m=>[m.id,m.type,Math.round(m.x),Math.round(m.y),r1(m.h||0),Math.max(1,Math.round(m.hp/m.maxHp*100)),m.owner,m.team,fxMask(m)]),
    WL:(G.walls||[]).map(w=>[w.id,Math.round(w.x),Math.round(w.y),w.r,Math.round(w.hp),Math.round(w.t*10)/10]),
    ...earthSnapW(),...windSnapW(),
    J:G.proj.map(p=>({id:p.id,t:p.type,x:r1(p.x),y:r1(p.y),h:r1(p.h),vx:Math.round(p.vx),vy:Math.round(p.vy),vh:r1(p.vh),rf:p.dmg>(PDEF[p.type].dmg*1.2)?1:0}))
  };
}
// ตัววัดเวลาแต่ละส่วน (เปิดด้วย WD.PROF.on=true แล้วดู WD.PROF.t)
const PROF={on:false,t:{},n:{}};let hostErrN=0;
function pf(k,t0){if(!PROF.on)return;const d=performance.now()-t0;PROF.t[k]=(PROF.t[k]||0)+d;PROF.n[k]=(PROF.n[k]||0)+1;}
function hostLoop(){
  if(!NET.isHost||!G||G.ph==='lobby')return;
  const t=performance.now();
  const dt=Math.min(0.05,(t-hostLast)/1000);hostLast=t;
  try{hostTick(dt);}catch(e){if(hostErrN++%600===0)console.error('hostTick',e);}   // บั๊กหลุดมา 1 จุด = ไม่ให้เกมค้างทั้งห้อง (snapshot ยังส่งต่อ)
  tickN++;pf('hostTick',t);
  const t1=performance.now(),base=makeSnap();
  const evl=EVL;EVL=[];
  onSnap(Object.assign({},base,{ev:evl}));pf('snap',t1);
  if(NET.online&&tickN%2===0){const evn=EVN;EVN=[];sendAll({t:'s',s:Object.assign({},base,{ev:evn,T:Math.round(t),P:packP(base.P)},netDelta(base))});}   // T = เวลาโฮสต์ (ลูกข่ายใช้เรียง/เลื่อนภาพให้นุ่ม)
}
setInterval(()=>{if(!HLW.on)hostLoop();},1000/60);
// โฮสต์สลับไปหน้าต่างอื่น: Chrome ชะลอ setInterval ของแท็บที่ซ่อนเหลือ ~1 ครั้ง/วิ → ทั้งห้องค้าง
// แก้: ตอนเล่นออนไลน์ + แท็บซ่อน ให้นาฬิกาใน Web Worker (ไม่โดนชะลอ) เดินลูปโฮสต์แทน
const HLW={on:false};
try{const w=new Worker(URL.createObjectURL(new Blob(['setInterval(()=>postMessage(0),1000/60)'],{type:'text/javascript'})));
  w.onmessage=()=>{HLW.on=document.hidden&&NET.isHost&&NET.online;if(HLW.on)hostLoop();};}catch(e){}

// ส่งปุ่มที่กดของฝั่งลูกข่ายไปให้โฮสต์
setInterval(()=>{
  if(NET.isHost||!NET.hostConn||!NET.hostConn.open||screen!=='game')return;
  hostSend({t:'in',i:INPUT});
  if(++pingN%33===0)hostSend({t:'pi',c:performance.now()});   // ปิงทุก ~1 วิ
},30);
let pingN=0;
