// ตัวช่วยทดสอบ/ดีบัก (เปิดคอนโซลแล้วพิมพ์ WD)
// =====================================================================
//  เครื่องมือทดสอบสมดุล (ใช้ผ่านคอนโซล WD.bal / WD.dmgTest เท่านั้น ผู้เล่นปกติไม่เห็น)
// =====================================================================
// บอทต่อสู้แบบง่ายๆ: เล็งนำเป้า เดินรักษาระยะ+ส่ายไปมา ร่ายคาถาทุกครั้งที่พร้อมและอยู่ในระยะ • tg0 = เป้าที่เลือกมาแล้ว (บอทห้องฝึก aiBot js/15-bot)
function botBrain(p,dt,tg0){
  const inp=p.inp;let foe=tg0||plist().find(q=>q!==p&&q.alive&&!q.downed&&q.team!==p.team);
  if(!foe){let bd=1e12;for(const e of G.en)if(!e.dead){const d=(e.x-p.x)**2+(e.y-p.y)**2;if(d<bd){bd=d;foe=e;}}}
  if(!foe)return;
  let tg=foe;
  if(!tg0){let md=450*450,bm=null;for(const m of G.mins)if(!m.dead&&m.team!==p.team){const dd=(m.x-p.x)**2+(m.y-p.y)**2;if(dd<md){md=dd;bm=m;}}if(bm&&Math.hypot(foe.x-p.x,foe.y-p.y)>240)tg=bm;}
  const dx=tg.x-p.x,dy=tg.y-p.y,d=Math.hypot(dx,dy),t=G.time;
  const fvx=tg._px===undefined?0:(tg.x-tg._px)/Math.max(dt,0.001),fvy=tg._py===undefined?0:(tg.y-tg._py)/Math.max(dt,0.001);tg._px=tg.x;tg._py=tg.y;
  const lead=p.pathIdx===LIGHTP?0.06:d/950;inp.ax=tg.x+fvx*lead;inp.ay=tg.y+fvy*lead;   // Light ลำแสงตรงถึงทันที: ดักนิดเดียว
  const mel=p.pathIdx===1&&p.fmode!==1;
  const P=p.ai&&p.ai.ps,R=P?P.rng:1;   // บอทห้องฝึก: นิสัยสุ่มต่อตัว (botPersona js/15-bot)
  const BR=(p.fmode===1?null:BOT_RANGE[p.pathIdx])||[260,430];   // ระยะที่ชอบยืนต่อสาย (js/15-botplay)
  const ang=Math.atan2(dy,dx),want=mel?(d>95?1:0):d>BR[1]*R?1:d<BR[0]*R?-1:0,st=P?P.sd*Math.sin(t*P.sp+P.ph):Math.sin(t*1.7+p.id.length);
  inp.mx=Math.cos(ang)*want+Math.cos(ang+Math.PI/2)*st*0.8;inp.my=Math.sin(ang)*want+Math.sin(ang+Math.PI/2)*st*0.8;
  inp.fire=mel?(d<150?1:0):p.pathIdx===LIGHTP?((p.lc|0)===0?(d<LTV.baRange-30&&!p.lgTapH?1:0):d<(LTV.baRange-30)?1:(p.lgBeam!==0&&d<LTV.baRange+80?1:0)):d<900?1:0;   // Light: กดค้างในระยะลำ (ปล่อย = ชาร์จใหม่ 1.4 วิ) • ยิงอยู่แล้วเผื่อหลุดระยะนิดหน่อย
  if(botClassPlanFor(p)){if(!p.ai)botClassPlan(p,tg);return;}
  if(p.pathIdx===1&&p.cd.dodge<=0&&d>520)inp.c.sp=(inp.c.sp|0)+1;
  const press=k=>{inp.c[k]=(inp.c[k]|0)+1;};
  const fireNova=p.pathIdx===0&&!p.ai&&botFireCanNova(p);
  if(!fireNova&&!(p.novaT>0||p.snapT>0))p.kitIds.forEach((id,i)=>{
    const S=SPELLS[id],k=SLOTK[i];if(p.cd[k]>0||p.sil>0)return;
    if(S.id==='wispheal'&&p.hp>p.maxHp*0.85)return;
    if(['spiritwolf','firesprite','stonegolem'].includes(S.id)&&G.mins.some(m=>m.owner===p.id&&m.type===({spiritwolf:'wolf',firesprite:'sprite',stonegolem:'golem'})[S.id]))return;
    if(S.id==='soulburst'&&G.mins.filter(m=>m.owner===p.id).length<2)return;
    if(S.id==='soulsiphon'&&!(tg.mrk>0))return;
    if(S.id==='ignitionsnap'){if(!p.ai&&botFireCanSnap(p))press(k);return;}
    if(S.id==='kindle'&&p.kindle>0)return;
    if(S.id==='cryoshell'&&(p.hp>p.maxHp*0.35||p.cryo>0))return;
    if(S.melee&&p.fmode===1)return;
    const w=tg.isE&&!['dragonfall','stonebreaker','voidspheres','aegisgale'].includes(S.id)?undefined:botWant(p,S.id,tg,d);if(w!==undefined){if(w)press(k);return;}   // วิธีเล่นต่อสาย (js/15-botplay)
    if(S.id==='glacialspike'&&!(tg.chl>0||tg.frz>0))return;
    const r=({thunderline:560,speedsiphon:180,triplestrike:560,stormorbs:300,railgun:850,stormdome:560,frostforge:200,glacierrend:420,permafrost:240,cryoshell:9999,frostaura:200,dragonfall:560,ringofembers:360,blazeform:500,emberburst:170,frostnova:170,terror:210,frostarmor:500,overcharge:600,sporecloud:480,blinddust:500,scorchdash:330,arcblink:330,thornburst:170,soulsiphon:650})[S.id]||900;
    const gap=S.id==='scorchdash'||S.id==='arcblink';
    if(gap?d>420&&d<800:d<r)press(k);
  });
  if(fireNova||(p.ultId!=='colossus'&&p.ult>=100&&d<(p.ultId==='mirrorlegion'?550:340)))press('x');
  // บอทสายฟ้า: เข้าประชิด ยิงลำค้าง (ปล่อยแว้บเพื่อฟาดสามเหลี่ยม) Dash ทะลุ เปิดโล่ตอนเลือดน้อย
  if(p.pathIdx===2){const w=d>(p.god>0?150:240)?1:0;inp.mx=Math.cos(ang)*w+Math.cos(ang+Math.PI/2)*st*0.5;inp.my=Math.sin(ang)*w+Math.sin(ang+Math.PI/2)*st*0.5;
    inp.fire=d<(p.god>0?190:320)?(p.emp?(Math.floor(G.time*8)%2):1):0;
    if(!p.ai&&(p.dch||0)>=1&&d<260&&Math.random()<dt*0.8)press('sp');inp.sh=p.hp<p.maxHp*0.5&&!p.stS&&!(p.stCd>0)&&Math.random()<0.05;}
  // บอทสายไฟ: กดค้างลูกไฟเป็นระยะ / ยิงตอนเป็นร่างยักษ์
  if(p.pathIdx===0&&!(p.colos>0)){p.bhold=((p.bhold||0)+dt)%4;const c=p.bhold;inp.fire=d>900?0:c<2.1?1:c<2.2?0:(Math.floor(c/0.17)%2);}
  if(!p.ai)botCombo(p,dt,tg);   // บอทห้องฝึก/ห้องรอ เรียกท้าย aiBot แทน
}
let _obsKeep=null;
function balArena(on){if(on&&!_obsKeep){_obsKeep=OBS;OBS=[];}else if(!on&&_obsKeep){OBS=_obsKeep;_obsKeep=null;}}
// ดวลต้องเป็น 1v1 จริง (แก้ 2026-11-14): ซ่อนผู้เล่น/บอทอื่นในห้อง และให้ทั้งสองฝั่งใช้ botBrain ตัวเดียวกัน
//   (เดิมฝั่ง b เป็นบอทห้องฝึกที่มี p.ai = สมองอีกแบบ + บอทอื่นในห้องยังวิ่งตีอยู่ → ฝั่งที่เกิดตัดสินผล)
let _balStash=null;
function balIsolate(a,b,on){
  if(on&&!_balStash){_balStash={order:G.order.slice(),ab:[a,b].map(q=>({q,ai:q.ai,bot:q.bot}))};G.order=[a.id,b.id];a.ai=null;b.ai=null;}   // เหลือ 2 คนในลูปเกม
  else if(!on&&_balStash){G.order=_balStash.order;for(const s of _balStash.ab){s.q.ai=s.ai;s.q.bot=s.bot;}_balStash=null;}}
function balReset(a,b){balArena(true);balIsolate(a,b,true);
  clearStormWaveMarks();
  const jy=(Math.random()-.5)*MH*.3,jx=(Math.random()-.5)*MW*.08;   // สุ่มจุดเกิดนิดหน่อยทุกรอบ (ไม่งั้นผลซ้ำเดิมตามฝั่ง)
  for(const p of [a,b]){p.maxHp=200;resetBody(p,(p===a?MW*0.14:MW*0.86)+jx,MH/2+(p===a?jy:-jy));p.hp=p.maxHp;p.ult=0;p.team=p===a?0:1;p.bot=true;p._px=undefined;p.ang=p===a?0:Math.PI;}
  G.proj=[];G.zones=[];G.strikes=[];G.walls=[];G.chan=[];G.mins=[];G.nature=[];G.wdb=[];G.wtl=[];G.erings=[];G.ices=[];G.waves=[];G.glac=[];G.eso=[];G.edust=[];G.en=[];G.ph='play';a.focusT=b.focusT=null;G.rw={};G.round=1;G.banner=null;G.result=null;
}
function balDuel(kA,kB,rounds,maxT){
  const ps=plist(),a=ps[0],b=ps[1],res={a:0,b:0,draw:0,tw:0};
  for(let r=0;r<rounds;r++){
    const sw=r%2===1; // สลับฝั่งเกิดทุกรอบ ตัดความได้เปรียบของตำแหน่ง
    setKit(a,sw?kB:kA);setKit(b,sw?kA:kB);balReset(a,b);
    let t=0;
    while(t<(maxT||60)){hostTick(1/60);t+=1/60;{const A=sw?b:a,B=sw?a:b;res.zA=(res.zA||0)+(A.z||0)/60;res.zB=(res.zB||0)+(B.z||0)/60;if((A.z||0)>1.5)res.airA=(res.airA||0)+1/60;if((B.z||0)>1.5)res.airB=(res.airB||0)+1/60;}if(!a.alive||!b.alive)break;}   // สถิติดีบัก: ความสูงเฉลี่ย / เวลาลอย (z>1.5) ต่อฝั่ง kA/kB
    G.ph='play';
    const aw=a.alive&&!b.alive,bw=b.alive&&!a.alive;
    if(aw)(sw?res.b++:res.a++);else if(bw)(sw?res.a++:res.b++);else res.draw++;
    res.tw+=t;
  }
  for(const k of ['zA','zB','airA','airB'])if(res[k]!==undefined)res[k]=+(res[k]/Math.max(1,res.tw)*(k[0]==='z'?1:100)).toFixed(2);
  res.avgT=+(res.tw/rounds).toFixed(1);delete res.tw;return res;
}
// ลีกทุกคู่: kits = {ชื่อ:สตริงชุดคาถา} → อัตราชนะรวมของแต่ละชุด
function balTour(kits,rounds,maxT){
  const names=Object.keys(kits),wins={},games={},pair={};
  names.forEach(n=>{wins[n]=0;games[n]=0;});
  for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){
    const r=balDuel(kits[names[i]],kits[names[j]],rounds,maxT);
    pair[names[i]+' v '+names[j]]=`${r.a}-${r.b}-${r.draw} (${r.avgT}s)`+(r.zA!==undefined?` z ${r.zA}/${r.zB} air% ${r.airA}/${r.airB}`:'');
    wins[names[i]]+=r.a+r.draw/2;wins[names[j]]+=r.b+r.draw/2;games[names[i]]+=rounds;games[names[j]]+=rounds;
  }
  balArena(false);balIsolate(null,null,false);
  const rate={};names.forEach(n=>rate[n]=Math.round(wins[n]/games[n]*100)+'%');
  return {rate,pair};
}
// Team battles for the tier list (2026-11-20): botBrain on every bot, same as balDuel.
// mode 'mono' = every class pair, N same-class bots per side • mode 'mix' = random mixed teams.
// Per class also returns casts/min and damage dealt/min (team share) so we can flag classes the bot cannot play.
function balTeamReset(A,B){
  balArena(true);
  const jy=(Math.random()-.5)*MH*.25;
  for(const p of [...A,...B]){const left=A.includes(p),L=left?A:B,i=L.indexOf(p);
    p.maxHp=200;resetBody(p,(left?MW*.14:MW*.86)+rnd(-30,30),MH/2+(i-(L.length-1)/2)*70+(left?jy:-jy));
    p.hp=p.maxHp;p.ult=0;p.team=left?0:1;p.bot=true;p.ai=null;p._px=undefined;p.ang=left?0:Math.PI;}
  G.proj=[];G.zones=[];G.strikes=[];G.walls=[];G.chan=[];G.mins=[];G.nature=[];G.wdb=[];G.wtl=[];G.erings=[];G.ices=[];G.waves=[];G.glac=[];G.eso=[];G.edust=[];G.en=[];
  G.ph='play';G.rw={};G.round=1;G.banner=null;G.result=null;if(typeof clearStormWaveMarks==='function')clearStormWaveMarks();
}
function balTeam(paths,N,rounds,maxT=60,mode='mix'){
  const keep=G.order.slice(),pool=[];
  for(let i=0;i<N*2;i++){const id='balT'+i;const p=G.players[id]||addPlayer(id,'bal'+i,null,null,'');pool.push(p);}
  G.order=pool.map(p=>p.id);
  const S={};paths.forEach(k=>S[k]={w:0,g:0,casts:0,dmg:0,t:0});const pair={},SL=['basic','q','e','r','f','dodge'];
  const runOne=(kA,kB)=>{const A=pool.slice(0,N),B=pool.slice(N),all=[...A,...B];
    A.forEach((p,i)=>setKit(p,botKit(kA[i])));B.forEach((p,i)=>setKit(p,botKit(kB[i])));balTeamReset(A,B);
    const prev=all.map(p=>SL.map(k=>p.cd[k]||0)),hp=all.map(p=>p.hp),cast=all.map(()=>0),dealtTeam=[0,0];
    let t=0;while(t<maxT){hostTick(1/60);t+=1/60;
      all.forEach((p,j)=>{SL.forEach((k,m)=>{const c=p.cd[k]||0;if(c>prev[j][m]+0.05&&prev[j][m]<0.05)cast[j]++;prev[j][m]=c;});
        const h=p.alive?p.hp:0;if(h<hp[j])dealtTeam[p.team?0:1]+=hp[j]-h;hp[j]=h;});
      if(!A.some(p=>p.alive)||!B.some(p=>p.alive))break;}
    all.forEach((p,j)=>{const k=(j<N?kA:kB)[j%N],st=S[k];st.casts+=cast[j];st.dmg+=dealtTeam[p.team]/N;st.t+=t;});
    const hA=A.reduce((s,p)=>s+(p.alive?p.hp:0),0),hB=B.reduce((s,p)=>s+(p.alive?p.hp:0),0);
    return hA>hB?1:hB>hA?-1:0;};
  const score=(k,r)=>{S[k].g++;S[k].w+=r>0?1:r===0?.5:0;};
  if(mode==='mono'){for(let i=0;i<paths.length;i++)for(let j=i+1;j<paths.length;j++){let a=0,b=0,d=0;
      for(let r=0;r<rounds;r++){const sw=r%2,ka=sw?paths[j]:paths[i],kb=sw?paths[i]:paths[j],res=runOne(Array(N).fill(ka),Array(N).fill(kb));
        score(ka,res);score(kb,-res);const iw=sw?res<0:res>0,jw=sw?res>0:res<0;iw?a++:jw?b++:d++;}
      pair[PATHS[paths[i]].id+'-'+PATHS[paths[j]].id]=a+'/'+b+'/'+d;}}
  else for(let r=0;r<rounds;r++){const pick=()=>Array.from({length:N},()=>paths[Math.floor(Math.random()*paths.length)]);
      const kA=pick(),kB=pick(),res=runOne(kA,kB);kA.forEach(k=>score(k,res));kB.forEach(k=>score(k,-res));}
  for(const p of pool){clearOwned([p.id]);hostRemove(p.id);}G.order=keep;balArena(false);
  const out={};paths.forEach(k=>{const s=S[k];out[PATHS[k].id]={win:s.g?Math.round(s.w/s.g*100):null,n:s.g,cpm:s.t?+(s.casts/s.t*60).toFixed(1):0,dpm:s.t?Math.round(s.dmg/s.t*60):0};});
  return {cls:out,pair};
}
// ดาเมจ/CC ที่แต่ละคาถาทำใส่เป้านิ่งใน 8 วิ (รวมไฟลุก/โซน) เพื่อเทียบพลังตรงๆ
// โหมดดันเจียนคนเดียวด้วยบอท: ดูว่าชุดคาถาไหนไปได้ไกลแค่ไหน (ชั้น / เวลา / จำนวนศัตรูที่ฆ่า) — หลายรอบ เฉลี่ย
function balCoop(kit,maxT,runs){
  const me=plist()[0],res={wave:0,time:0,kills:0,n:runs||1};
  for(let r=0;r<(runs||1);r++){
    G.mode='coop';hostStart();for(let i=0;i<260;i++)hostTick(1/60);
    setKit(me,kit);me.bot=true;me.kills=0;
    let t=0;
    while(t<(maxT||240)){
      if(G.ph==='buff')hostPick(me,Math.floor(Math.random()*3));
      if(G.ph==='over')break;
      hostTick(1/60);t+=1/60;
      if(me.downed||!me.alive)break;
    }
    res.wave+=G.wave;res.time+=t;res.kills+=me.kills;
  }
  res.wave=+(res.wave/res.n).toFixed(1);res.time=Math.round(res.time/res.n);res.kills=+(res.kills/res.n).toFixed(0);return res;
}
function balSpellTest(){
  const ps=plist(),a=ps[0],b=ps[1],out={};
  for(const S of SPELL_LIST){
    setKit(a,String(S.path));balReset(a,b);
    b.hp=b.maxHp=99999;a.hp=a.maxHp=99999;a.bot=false;b.bot=false;
    a.kitIds=[S.ult?a.kitIds[0]:S.id,...a.kitIds.slice(1)];
    b.x=a.x+(S.id==='emberburst'||S.id==='frostnova'||S.ult?110:300);b.y=a.y;a.ang=0;a.inp.ax=b.x;a.inp.ay=b.y;
    a.inp.c.q=a.inp.c.q|0;
    const hp0=b.hp;let stun=0,slow=0,t=0;
    a.ult=100;
    if(S.ult){a.ultId=S.id;}else{a.cd.q=0;}
    const press=S.ult?'x':'q';a.inp.c[press]=(a.inp.c[press]|0)+1;
    for(;t<8;t+=1/60){hostTick(1/60);if(b.stun>0)stun+=1/60;if(b.slowT>0||b.chl>0)slow+=1/60;}
    out[S.id]={dmg:Math.round(hp0-b.hp),stun:+stun.toFixed(2),slowT:+slow.toFixed(2),cd:S.cd,dmgPerCd:S.cd?+((hp0-b.hp)/S.cd).toFixed(1):0};
  }
  return out;
}
window.WD={SKANIM,shieldFaces,SPELL_LIST,tbolt,applyQuality,taaBegin,taaFinish,TAA,coop:balCoop,fakeHello:(id,name,look,kit)=>hostOnData({peer:id,send(){},close(){}},{t:'hello',name,look,kit}),fakeMsg:(id,d)=>hostOnData({peer:id,send(){},close(){}},d),hostOnData:(c,d)=>hostOnData(c,d),hostDrop:(id,c)=>hostDrop(id,c),hostToLobby:()=>hostToLobby(),get NETo(){return NET;},get SPEC(){return SPEC;},get CHAT(){return CHAT;},get EMO(){return EMO;},get SBUFo(){return SBUF;},packP:L=>packP(L),unpackP:s=>unpackP(s),get VIC(){return VIC;},vicFrame:n=>vicLoop(n),get COMBO(){return COMBO;},get FFAV(){return FFAV;},get POD(){return POD;},get PROG(){return PROG;},get MNo(){return MN;},THREE,get STAGEo(){return STAGE;},get stageo(){return stage;},get DCAM(){return DCAM;},lvOf:x=>lvOf(x),balArena,bal:balDuel,tour:balTour,team:balTeam,dmgTest:balSpellTest,hostTick:dt=>hostTick(dt),VFXB,QUAL,vfxAug:(on)=>{VFXAUG_ON=on;},get post(){return {fxPass,gradePass,bloom,SOFTU,GRADEU,AOU,AO_ON,SHD,fxScene,composer};},castSlot:(p,i)=>castSlot(p,i),castUlt:p=>castUlt(p),setKit:(p,k)=>setKit(p,k),SPELLS,SPELL_LIST,PATHS,parseKit,foesOf,emitLog:()=>EVL,damage:(...a)=>damage(...a),get G(){return G;},get screen(){return screen;},get VIEW(){return VIEW;},INPUT,NET,render,choosePick,hostToLobby,hostStart,plist,broadcastLobby,setYaw:v=>{yaw=v;},setPitch:v=>{pitch=v;},cam,composer,PM3,tx,tz,addPlayer,hostVote,get ROLE(){return ROLE;},get MO(){return MO;},get PARTS(){return PARTS.length;},partsArr:()=>PARTS,zv:()=>ZV,get AUDIO(){return {AC:AC&&AC.state,sfx:Object.keys(BUF).length,files:Object.values(BUF).reduce((a,b)=>a+b.length,0),music:MUSF.cur,mt:MUSF.els[MUSF.cur]?+MUSF.els[MUSF.cur].el.currentTime.toFixed(1):null,myT:MY.el?+MY.el.currentTime.toFixed(1):null,failed:MUSF.failed,amb:AMB.cur,wind:!!AMB.windBuf,my:MY.list.length};},PROF,get grass(){return {GRASS,AIR,CLW,SCAR,grassBake,airGust,airMark,grassScar,scarPaint,scarReset};},gl,scene,bloom,moonL,LPOOL,stage};

// ดีบักโหมดบุกปราสาท (คอนโซล): WD.sg().S = สถานะ, .V = ค่าตัวเลข (js/15-siege)
WD.sg=()=>({S:G&&G.sg,V:SGV,B:SGB,F:sgFD(),ph:SGPH,area:AREA,bots:bots()});WD.lobbyBotAdd=(p,l)=>lobbyBotAdd(p,l);
// ---------- Service Worker (sw.js): เก็บไฟล์เกมไว้ในเครื่อง เปิดครั้งต่อไปเร็วขึ้น — แคชผูกกับ PREFIX, ?nosw = ปิดและล้าง ----------
const SWK={reg:null,warmed:false};
async function swSetup(){
  if(!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol))return;
  try{
    if(/[?&]nosw\b/.test(location.search)){
      for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();
      for(const k of await caches.keys())if(k.startsWith('wd-'))await caches.delete(k);
      return;
    }
    SWK.reg=await navigator.serviceWorker.register('sw.js?v='+encodeURIComponent(PREFIX));
    // ไฟล์ที่โหลดไปก่อน SW จะคุมหน้า (ครั้งแรกที่เปิด) — ส่งรายการไปให้ SW เก็บ
    const warm=()=>{const sw=navigator.serviceWorker.controller||SWK.reg.active;if(!sw||SWK.warmed)return;SWK.warmed=true;
      sw.postMessage({t:'warm',urls:[location.href,...performance.getEntriesByType('resource').map(e=>e.name)]});};
    await navigator.serviceWorker.ready;
    setTimeout(warm,8000);
  }catch(e){console.warn('sw',e);}
}
swSetup();
window.WD.SW=SWK;
// ---------- เช็คการ์ดจอตอนเปิดเกม ----------
// หน้าเว็บเลือกการ์ดจอเองไม่ได้ (เบราว์เซอร์/Windows เลือก — เราขอ powerPreference:'high-performance' ไว้แล้ว js/27)
// → ถ้าเบราว์เซอร์ใช้การ์ดออนบอร์ด / ไม่ได้ใช้การ์ดจอเลย ขึ้นป้ายบอกวิธีแก้ (ปิดแล้วไม่ขึ้นอีกสำหรับการ์ดตัวเดิม) • ?nogpucheck = ไม่เช็ค • ?gpucheck=igpu|soft = บังคับขึ้นป้าย (ทดสอบ)
const GPUC={name:'',kind:'gpu'};
function gpuCheck(){
  try{const c=gl.getContext(),e=c.getExtension('WEBGL_debug_renderer_info');GPUC.name=String(e?c.getParameter(e.UNMASKED_RENDERER_WEBGL):c.getParameter(c.RENDERER)||'');}catch(e){return;}
  const n=GPUC.name;
  GPUC.kind=/SwiftShader|Basic Render|llvmpipe|softpipe|Software/i.test(n)?'soft':/Intel.*(UHD|HD|Iris|Graphics)|AMD Radeon\(TM\) Graphics|Radeon\(TM\) (Vega|\d{3}M)|Vega \d+ Graphics|Radeon Graphics/i.test(n)?'igpu':'gpu';
  {const f=/[?&]gpucheck=(soft|igpu)\b/.exec(location.search);if(f)GPUC.kind=f[1];}   // ทดสอบหน้าตาป้าย
  if(GPUC.kind==='gpu'||/[?&](nogpucheck|studio)\b/.test(location.search)||store('wd_gpuok')===n)return;
  const win=/Windows/.test(navigator.userAgent),br=/Edg\//.test(navigator.userAgent)?'Edge':'Chrome';
  const exe=br==='Edge'?'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe':'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const short=n.replace(/^ANGLE \(|\)$/g,'').split(',').slice(0,2).join(',');
  const body=GPUC.kind==='soft'
    ?`<p>เบราว์เซอร์<b>ไม่ได้ใช้การ์ดจอ</b> (วาดภาพด้วย CPU) เกมจะช้ามาก</p><ol><li>เปิด ${br} → Settings → System</li><li>เปิด <b>Use graphics acceleration when available</b></li><li>ปิด ${br} ทุกหน้าต่างแล้วเปิดใหม่</li></ol>`
    :`<p>เกมกำลังใช้<b>การ์ดจอออนบอร์ด</b> — ถ้าเครื่องมี<b>การ์ดจอแยก</b> (NVIDIA / AMD RX) จะลื่นกว่ามาก</p>`+(win?`<ol><li>Windows Settings → System → Display → <b>Graphics</b></li><li>กด <b>Add desktop app</b> แล้วเลือกไฟล์<br><code>${exe}</code></li><li>กดที่ ${br} ในรายการ → เลือก <b>High performance</b></li><li>ปิด ${br} ทุกหน้าต่างแล้วเปิดใหม่</li></ol>`:`<p>ตั้งค่าให้ ${br} ใช้การ์ดจอแยกในการตั้งค่าระบบของเครื่อง แล้วเปิดเบราว์เซอร์ใหม่</p>`)+`<p class="m">ไม่มีการ์ดจอแยก? กด "ไม่ต้องเตือนอีก" ได้เลย</p>`;
  const d=document.createElement('div');d.id='gpuTip';
  d.innerHTML=`<h3>🎮 การ์ดจอ</h3>${body}<p class="m">ตอนนี้: ${short.replace(/[<>&]/g,'')}</p><div class="b"><button data-k="ok">ไม่ต้องเตือนอีก</button><button data-k="x">ปิด</button></div>`;
  d.onclick=ev=>{const k=ev.target.dataset&&ev.target.dataset.k;if(!k)return;if(k==='ok')store('wd_gpuok',n);d.remove();};
  document.body.appendChild(d);
}
setTimeout(gpuCheck,1500);
window.WD.GPU=GPUC;
Object.assign(window.WD,{QUAL,applyQuality,GQ,gq,gqPreset,gqSet,moonL,fxEv:ev=>fx(ev),HVB,PFB,ptexUse,ptexLoad,CURL,PLIT,PSYS,fireVol,bot:botDebug,bots,lobbyBotAdd,lobbyBotFill,BOT_LV,ar:()=>G.ar,hudSight,SIGHT,obs:()=>OBS});
// เทส/วัดผล: เดินลูปโฮสต์ 1 รอบด้วยมือ (hostTick + snapshot + เอฟเฟกต์) — ใช้ตอนหน้าต่างถูกซ่อนแล้ว setInterval ช้า
// prop / โมเดลจากไฟล์ (ดีบัก)
Object.defineProperties(window.WD,{TERR:{get:()=>TERR},MAPID:{get:()=>MAPID},OBS:{get:()=>OBS},PROPS:{get:()=>PROPS},PROPON:{get:()=>PROPON},BRK:{get:()=>BRK},BRKV:{get:()=>BRKV},BLDON:{get:()=>BLDON},HSTOP:{get:()=>HSTOP}});Object.assign(window.WD,{MAPS,RANDOM_MAPS,FMAPS,loadMapData,terrT,groundH,terrSolid,setMapVars,buildWorld,PROPDEF,genProps,MODELS,loadModel,modelManifest,useProp,hitProp,damageEnv,bldRay,aimClip,aimRay3,collideWorld,PM3,EM3,JM3,animTick,playVfx,playFlip,fileFx,zoneFx,VFXL,FLIPL,FLIPS,fx});
Object.defineProperty(window.WD,"PNL",{get:()=>PNL});Object.defineProperty(window.WD,"PNV",{get:()=>PNV});Object.assign(window.WD,{pnlHit,pnlEnv,pnlRay,pnlMoundH,pnlCollide,pnlSnap,pnlParse,damageEnv,collideWorld});Object.defineProperty(window.WD,"CITYD",{get:()=>CITYD});Object.assign(window.WD,{aimPoint,citySolidAt,cityRoomBox,cityFloorH,cityCeilH,cityCollideIn,groundH});   // ดีบัก: ตึกกลวงในเมือง (js/12-city-dmg)
window.WD.hostStep=dt=>{let t=performance.now();hostTick(dt);pf('hostTick',t);t=performance.now();const b=makeSnap(),ev=EVL;EVL=[];EVN=[];pf('snap',t);t=performance.now();onSnap(Object.assign({},b,{ev}));pf('onSnapFx',t);};
window.WD.mkStudent=makeStudent;window.WD.scene=scene;window.WD.parseLook=parseLook;   // ดีบัก: ภาพไม้สำเร็จรูป (ทดสอบ headless)
window.WD.batchStudent=root=>{shareSkinSkeletons(root);batchStudentSkin(root);};   // diagnostic A/B on the same posed model
Object.assign(window.WD,{efsHeat,efsEnv,efsSnap,EFSV,damageEnv,bskSnap,bskExport,bskRepair,BSKV,devDestroy,INPUT});Object.defineProperty(window.WD,"BSKN",{get:()=>BSKN});Object.defineProperty(window.WD,"FCSB",{get:()=>FCSB});Object.defineProperty(window.WD,"FPILE",{get:()=>FPILE});Object.defineProperty(window.WD,'EFS',{get:()=>EFS});   // ไฟรั้ว (js/12-efs.js) สำหรับเทสต์
