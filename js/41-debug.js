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
  const lead=d/950;inp.ax=tg.x+fvx*lead;inp.ay=tg.y+fvy*lead;
  const close=(p.kitIds.includes('thornburst')&&tg.psn>0);
  const mel=p.pathIdx===1&&p.fmode!==1;
  const P=p.ai&&p.ai.ps,R=P?P.rng:1;   // บอทห้องฝึก: นิสัยสุ่มต่อตัว (botPersona js/15-bot)
  const BR=(p.fmode===1?null:BOT_RANGE[p.pathIdx])||[260,430];   // ระยะที่ชอบยืนต่อสาย (js/15-botplay)
  const ang=Math.atan2(dy,dx),want=mel?(d>95?1:0):close?(d>140?1:0):d>BR[1]*R?1:d<BR[0]*R?-1:0,st=P?P.sd*Math.sin(t*P.sp+P.ph):Math.sin(t*1.7+p.id.length);
  inp.mx=Math.cos(ang)*want+Math.cos(ang+Math.PI/2)*st*0.8;inp.my=Math.sin(ang)*want+Math.sin(ang+Math.PI/2)*st*0.8;
  inp.fire=mel?(d<150?1:0):d<900?1:0;
  if(p.pathIdx===1&&p.cd.dodge<=0&&d>520)inp.c.sp=(inp.c.sp|0)+1;
  const press=k=>{inp.c[k]=(inp.c[k]|0)+1;};
  p.kitIds.forEach((id,i)=>{
    const S=SPELLS[id],k=SLOTK[i];if(p.cd[k]>0||p.sil>0)return;
    if(S.id==='bloom'&&p.hp>p.maxHp*0.75)return;
    if(S.id==='wispheal'&&p.hp>p.maxHp*0.85)return;
    if(['spiritwolf','firesprite','stonegolem'].includes(S.id)&&G.mins.some(m=>m.owner===p.id&&m.type===({spiritwolf:'wolf',firesprite:'sprite',stonegolem:'golem'})[S.id]))return;
    if(S.id==='soulburst'&&G.mins.filter(m=>m.owner===p.id).length<2)return;
    if(S.id==='soulsiphon'&&!(tg.mrk>0))return;
    if(S.id==='thornburst'&&!(tg.psn>0))return;
    if(S.id==='ignitionsnap'&&!((tg.brn|0)>=3))return;
    if(S.id==='kindle'&&p.kindle>0)return;
    if(S.id==='cryoshell'&&(p.hp>p.maxHp*0.35||p.cryo>0))return;
    if(S.melee&&p.fmode===1)return;
    const w=tg.isE&&!['dragonfall','stonebreaker','voidspheres','aegisgale'].includes(S.id)?undefined:botWant(p,S.id,tg,d);if(w!==undefined){if(w)press(k);return;}   // วิธีเล่นต่อสาย (js/15-botplay)
    if(S.id==='glacialspike'&&!(tg.chl>0||tg.frz>0))return;
    const r=({thunderline:560,speedsiphon:180,triplestrike:560,stormorbs:300,railgun:850,stormdome:560,frostforge:200,glacierrend:420,permafrost:240,cryoshell:9999,frostaura:200,dragonfall:560,ringofembers:360,blazeform:500,ignitionsnap:480,emberburst:170,frostnova:170,terror:210,frostarmor:500,overcharge:600,sporecloud:480,blinddust:500,scorchdash:330,arcblink:330,thornburst:170,soulsiphon:650})[S.id]||900;
    const gap=S.id==='scorchdash'||S.id==='arcblink';
    if(gap?d>420&&d<800:d<r)press(k);
  });
  if(p.ult>=100&&d<(p.ultId==='colossus'?800:p.ultId==='mirrorlegion'?550:340))press('x');
  // บอทสายฟ้า: เข้าประชิด ยิงลำค้าง (ปล่อยแว้บเพื่อฟาดสามเหลี่ยม) Dash ทะลุ เปิดโล่ตอนเลือดน้อย
  if(p.pathIdx===2){const w=d>(p.god>0?150:240)?1:0;inp.mx=Math.cos(ang)*w+Math.cos(ang+Math.PI/2)*st*0.5;inp.my=Math.sin(ang)*w+Math.sin(ang+Math.PI/2)*st*0.5;
    inp.fire=d<(p.god>0?190:320)?(p.emp?(Math.floor(G.time*8)%2):1):0;
    if((p.dch||0)>=1&&d<260&&Math.random()<dt*(p.ai?2.5:0.8))press('sp');inp.sh=p.hp<p.maxHp*0.5&&!p.stS&&!(p.stCd>0)&&Math.random()<0.05;}
  // บอทสายไฟ: กดค้างลูกไฟเป็นระยะ / ยิงตอนเป็นร่างยักษ์
  if(p.pathIdx===0&&!(p.colos>0)){p.bhold=((p.bhold||0)+dt)%4;const c=p.bhold;inp.fire=d>900?0:c<2.1?1:c<2.2?0:(Math.floor(c/0.17)%2);}
  if(!p.ai)botCombo(p,dt,tg);   // บอทห้องฝึก/ห้องรอ เรียกท้าย aiBot แทน
}
let _obsKeep=null;
function balArena(on){if(on&&!_obsKeep){_obsKeep=OBS;OBS=[];}else if(!on&&_obsKeep){OBS=_obsKeep;_obsKeep=null;}}
function balReset(a,b){balArena(true);
  for(const p of [a,b]){p.maxHp=200;resetBody(p,p===a?MW*0.14:MW*0.86,MH/2);p.hp=p.maxHp;p.ult=0;p.team=p===a?0:1;p.bot=true;p._px=undefined;p.ang=p===a?0:Math.PI;}
  G.proj=[];G.zones=[];G.strikes=[];G.walls=[];G.chan=[];G.mins=[];G.erings=[];G.ices=[];G.waves=[];G.glac=[];G.eso=[];G.edust=[];G.en=[];G.ph='play';a.focusT=b.focusT=null;G.rw={};G.round=1;G.banner=null;G.result=null;
}
function balDuel(kA,kB,rounds,maxT){
  const ps=plist(),a=ps[0],b=ps[1],res={a:0,b:0,draw:0,tw:0};
  for(let r=0;r<rounds;r++){
    const sw=r%2===1; // สลับฝั่งเกิดทุกรอบ ตัดความได้เปรียบของตำแหน่ง
    setKit(a,sw?kB:kA);setKit(b,sw?kA:kB);balReset(a,b);
    let t=0;
    while(t<(maxT||60)){hostTick(1/60);t+=1/60;if(!a.alive||!b.alive)break;}
    G.ph='play';
    const aw=a.alive&&!b.alive,bw=b.alive&&!a.alive;
    if(aw)(sw?res.b++:res.a++);else if(bw)(sw?res.a++:res.b++);else res.draw++;
    res.tw+=t;
  }
  res.avgT=+(res.tw/rounds).toFixed(1);delete res.tw;return res;
}
// ลีกทุกคู่: kits = {ชื่อ:สตริงชุดคาถา} → อัตราชนะรวมของแต่ละชุด
function balTour(kits,rounds,maxT){
  const names=Object.keys(kits),wins={},games={},pair={};
  names.forEach(n=>{wins[n]=0;games[n]=0;});
  for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){
    const r=balDuel(kits[names[i]],kits[names[j]],rounds,maxT);
    pair[names[i]+' v '+names[j]]=`${r.a}-${r.b}-${r.draw} (${r.avgT}s)`;
    wins[names[i]]+=r.a+r.draw/2;wins[names[j]]+=r.b+r.draw/2;games[names[i]]+=rounds;games[names[j]]+=rounds;
  }
  balArena(false);
  const rate={};names.forEach(n=>rate[n]=Math.round(wins[n]/games[n]*100)+'%');
  return {rate,pair};
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
window.WD={coop:balCoop,fakeHello:(id,name,look,kit)=>hostOnData({peer:id,send(){},close(){}},{t:'hello',name,look,kit}),fakeMsg:(id,d)=>hostOnData({peer:id,send(){},close(){}},d),hostOnData:(c,d)=>hostOnData(c,d),hostDrop:(id,c)=>hostDrop(id,c),hostToLobby:()=>hostToLobby(),get NETo(){return NET;},get SPEC(){return SPEC;},get CHAT(){return CHAT;},get EMO(){return EMO;},get SBUFo(){return SBUF;},packP:L=>packP(L),unpackP:s=>unpackP(s),get VIC(){return VIC;},vicFrame:n=>vicLoop(n),get COMBO(){return COMBO;},get FFAV(){return FFAV;},get POD(){return POD;},get PROG(){return PROG;},get MNo(){return MN;},THREE,get STAGEo(){return STAGE;},get stageo(){return stage;},get DCAM(){return DCAM;},lvOf:x=>lvOf(x),balArena,bal:balDuel,tour:balTour,dmgTest:balSpellTest,hostTick:dt=>hostTick(dt),VFXB,QUAL,vfxAug:(on)=>{VFXAUG_ON=on;},get post(){return {fxPass,gradePass,bloom,SOFTU,GRADEU,AOU,AO_ON,SHD,fxScene,composer};},castSlot:(p,i)=>castSlot(p,i),castUlt:p=>castUlt(p),setKit:(p,k)=>setKit(p,k),SPELLS,SPELL_LIST,PATHS,parseKit,foesOf,emitLog:()=>EVL,damage:(...a)=>damage(...a),get G(){return G;},get screen(){return screen;},get VIEW(){return VIEW;},INPUT,NET,render,choosePick,hostToLobby,hostStart,plist,broadcastLobby,setYaw:v=>{yaw=v;},setPitch:v=>{pitch=v;},cam,composer,PM3,tx,tz,addPlayer,hostVote,get ROLE(){return ROLE;},get MO(){return MO;},get PARTS(){return PARTS.length;},partsArr:()=>PARTS,zv:()=>ZV,get AUDIO(){return {AC:AC&&AC.state,sfx:Object.keys(BUF).length,files:Object.values(BUF).reduce((a,b)=>a+b.length,0),music:MUSF.cur,mt:MUSF.els[MUSF.cur]?+MUSF.els[MUSF.cur].el.currentTime.toFixed(1):null,myT:MY.el?+MY.el.currentTime.toFixed(1):null,failed:MUSF.failed,amb:AMB.cur,wind:!!AMB.windBuf,my:MY.list.length};},PROF,get grass(){return {GRASS,AIR,CLW,SCAR,grassBake,airGust,airMark,grassScar,scarPaint,scarReset};},gl,scene,bloom,moonL,LPOOL,stage};

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
Object.assign(window.WD,{fxEv:ev=>fx(ev),HVB,PFB,ptexUse,ptexLoad,CURL,PLIT,PSYS,fireVol,bot:botDebug,bots,ar:()=>G.ar});
// เทส/วัดผล: เดินลูปโฮสต์ 1 รอบด้วยมือ (hostTick + snapshot + เอฟเฟกต์) — ใช้ตอนหน้าต่างถูกซ่อนแล้ว setInterval ช้า
// prop / โมเดลจากไฟล์ (ดีบัก)
Object.defineProperties(window.WD,{TERR:{get:()=>TERR},MAPID:{get:()=>MAPID},OBS:{get:()=>OBS},PROPS:{get:()=>PROPS},PROPON:{get:()=>PROPON},BLDG:{get:()=>BLDG},BRK:{get:()=>BRK},BRKV:{get:()=>BRKV},BLDON:{get:()=>BLDON},HSTOP:{get:()=>HSTOP}});Object.assign(window.WD,{MAPS,RANDOM_MAPS,FMAPS,loadMapData,terrT,groundH,terrSolid,setMapVars,buildWorld,PROPDEF,genProps,MODELS,loadModel,modelManifest,useProp,hitProp,damageEnv,hitBldPiece,breakBldChunk,bldSupport,bldChunk,bldPieceAt,bldRay,aimClip,aimRay3,collideWorld,PM3,EM3,JM3,animTick,playVfx,playFlip,fileFx,zoneFx,VFXL,FLIPL,FLIPS,fx});
Object.defineProperty(window.WD,"CITYD",{get:()=>CITYD});Object.assign(window.WD,{aimPoint,citySolidAt,cityRoomBox,cityFloorH,cityCeilH,cityCollideIn,groundH});   // ดีบัก: ตึกกลวงในเมือง (js/12-city-dmg)
window.WD.hostStep=dt=>{hostTick(dt);const b=makeSnap(),ev=EVL;EVL=[];EVN=[];onSnap(Object.assign({},b,{ev}));};
window.WD.mkStudent=makeStudent;window.WD.scene=scene;window.WD.parseLook=parseLook;   // ดีบัก: ภาพไม้สำเร็จรูป (ทดสอบ headless)
