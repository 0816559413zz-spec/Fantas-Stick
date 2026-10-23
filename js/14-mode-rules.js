// ---------- กติกาของแต่ละโหมด ----------
function hostPick(p,i){
  if(G.ph!=='buff'||p.picked||!p.bo)return;
  const b=BUFFS[p.bo[i]];if(!b)return;
  b.ap(p);p.picked=true;p.taken.push(b.n);
  emit({k:'buff',id:p.id});
}
// ล้างของในสนามที่มีเวลาจำกัด (วง/ฟ้าผ่าหน่วง/คลื่น/พื้นน้ำแข็ง ...) ตอนขึ้นชั้นใหม่ (co-op) / รอบใหม่ (ดวล)
// เดิมค้างนิ่งไว้ช่วงเลือกบัฟ/นับถอยหลัง แล้วกลับมาทำดาเมจต่อทั้งที่ภาพบนจอหายไปแล้ว (ภาพนับเวลาเอง)
function clearField(){Object.assign(G,{proj:[],bombs:[],zones:[],strikes:[],chan:[],waves:[],ices:[],glac:[],erings:[],slines:[],sorbs:[],fpaths:[],tcells:[],sballs:[],sdomes:[]});for(const p of plist())p.iceB=0;}
function modeLogic(dt){
  if(G.banner){G.banner.t-=dt;if(G.banner.t<=0)G.banner=null;}
  const ps=plist();
  if(G.ph==='over'||!ps.length)return;
  switch(G.mode){
    case 'coop':
      if(G.ph==='play'){
        bombTick(dt);
        G.spawnT-=dt;
        if(G.queue.length&&G.spawnT<=0&&G.en.length<16){spawnEnemy(G.queue.shift());G.spawnT=Math.max(0.3,1.1-G.wave*0.04);}
        if(ps.every(p=>p.downed||!p.alive)){endMatch();return;}
        if(!G.queue.length&&!G.en.length){
          G.ph='buff';G.buffT=20;G.proj=[];
          ps.forEach(p=>{
            if(p.downed){p.downed=false;p.hp=Math.round(p.maxHp*0.5);}
            else p.hp=Math.min(p.maxHp,p.hp+p.maxHp*0.3);
            p.bo=shuffle(BUFFS.map((_,i)=>i)).slice(0,3);p.picked=false;p.stun=0;p.burn=0;p.revive=0;p.root=0;
          });
          banner(`ผ่านชั้น ${G.wave}! เลือกพลังเสริม`,3);clearField();
          emit({k:'wave',x:0,y:0});
        }
      }else if(G.ph==='buff'){
        G.buffT-=dt;
        if(G.buffT<=0||ps.every(p=>p.picked)){
          ps.forEach(p=>{if(!p.picked)hostPick(p,Math.floor(Math.random()*3));});
          G.wave++;setupWave();G.ph='count';G.cdT=3;
        }
      }
      break;
    case 'duel':
      if(G.ph==='play'){
        const al=ps.filter(p=>p.alive);
        if(al.length<=1){
          const w=al[0];
          if(w){G.rw[w.id]=(G.rw[w.id]||0)+1;banner(`${w.name} ชนะรอบที่ ${G.round}!`,3);}else banner('เสมอ!',3);
          G.ph='rend';G.rendT=3;G.proj=[];
        }
      }else if(G.ph==='rend'){
        G.rendT-=dt;
        if(G.rendT<=0){
          if(ps.some(p=>(G.rw[p.id]||0)>=2))endMatch();
          else{G.round++;clearField();placeAll();G.ph='count';G.cdT=3;banner(`รอบที่ ${G.round}`,2);}
        }
      }
      break;
    case 'ffa':case 'tdm':
      if(G.ph==='play'){
        G.timer-=dt;
        if(G.mode==='ffa')ffaTick(dt);else potTick(dt);   // แท่นขวดเลือด FFA + ทีม (js/54)
        const done=G.mode==='ffa'?ffaDone():G.timer<=0||G.teamScore.some(s=>s>=15);
        if(done)endMatch();
      }
      break;
    case 'quid':
      if(G.ph==='play'){G.timer-=dt;quidTick(dt);if(G.ph==='play')snitchTick(dt);if(G.ph==='play'&&G.timer<=0)endMatch();}
      break;
    case 'race':if(G.ph==='play')raceTick(dt);break;
    case 'br':if(G.ph==='play')brTick(dt);break;
    case 'imp':
      if(G.ph==='play')impCheck();
      else if(G.ph==='meet')meetTick(dt);
      break;
    case 'train':
      if(G.ph==='play'){
        trainTick(dt);
      }
      break;
  }
}
function endMatch(){
  if(G.ph==='over'||G.endT>0)return;   // กำลังสโลว์ก่อนจบอยู่แล้ว
  const ps=plist();let title='จบเกม',sub='';let win=[],draw=false;   // win = id ผู้ชนะ (ลูกข่ายใช้เลือก VICTORY / DEFEAT)
  const teamIds=t=>ps.filter(p=>p.team===t).map(p=>p.id);
  const byK=[...ps].sort((a,b)=>b.kills-a.kills);
  if(G.mode==='coop'){title='จบการผจญภัยในดันเจียน';sub=`ทีมของคุณไปถึงชั้น ${G.wave}`;}
  else if(G.mode==='train'){title='จบการฝึก';sub='ไปลองฝีมือจริงในโหมดอื่นกันเลย!';}
  else if(G.mode==='quid'){const [a,b]=G.qs;if(a===b)draw=true;else win=teamIds(a>b?0:1);title=a===b?'เสมอ!':`🏆 ${TEAMN[a>b?0:1]} ชนะควิดดิช!`;sub=`${TEAMN[0]} ${a} — ${b} ${TEAMN[1]}`+(G.snitchBy?`  •  ✨ ${G.snitchBy} จับลูกบอลทองได้`:'');}
  else if(G.mode==='race'){const r=raceRank();if(r[0])win=[r[0].id];title=r[0]?`🏆 ${r[0].name} ชนะการแข่ง!`:'จบการแข่ง';sub=r.map((p,i)=>`${i+1}. ${p.name}${p.fin?` (${p.finT.toFixed(1)} วิ)`:''}`).join('   ');}
  else if(G.mode==='br'){const w=ps.find(p=>p.alive);if(w)win=[w.id];title=w?`🏆 ${w.name} รอดเป็นคนสุดท้าย!`:'ไม่มีผู้รอดชีวิต';sub='🌀 แบทเทิลรอยัล';}
  else if(G.mode==='imp'){win=ps.filter(p=>(p.role==='imp')===(G.impWin==='imp')).map(p=>p.id);title=G.impWin==='imp'?'🐍 ฝ่ายโวลเดอมอร์ชนะ! ความมืดครองฮอกวอตส์':'⚡ ฝ่ายนักเรียนฮอกวอตส์ชนะ!';sub='ฝ่ายโวลเดอมอร์คือ: '+ps.filter(p=>p.role==='imp').map(p=>p.name).join(', ');}
  else if(G.mode==='duel'){
    const s=[...ps].sort((a,b)=>(G.rw[b.id]||0)-(G.rw[a.id]||0));
    title=s[0]?`🏆 ${s[0].name} ชนะการดวล!`:'จบเกม';if(s[0])win=[s[0].id];
    sub=ps.map(p=>`${p.name} ${G.rw[p.id]||0}`).join('  —  ');
  }else if(G.mode==='ffa'){if(byK[0])win=[byK[0].id];title=byK[0]?`🏆 ${byK[0].name} ชนะ FFA!`:'จบเกม';sub=byK[0]?`${byK[0].kills} kills`:'';}
  else{
    const [a,b]=G.teamScore;if(a===b)draw=true;else win=teamIds(a>b?0:1);
    title=a===b?'เสมอ!':`🏆 ${TEAMN[a>b?0:1]} ชนะ!`;
    sub=`${TEAMN[0]} ${a} — ${b} ${TEAMN[1]}`;
  }
  G.result={title,sub,mode:G.mode,wave:G.wave,win,draw,
    rows:(G.mode==='race'?raceRank():byK).map(p=>({id:p.id,fr:p.fr||'fr0',tk:Math.round(p.dmgTaken||0),as:p.assists|0,n:p.name+(G.mode==='imp'?(p.role==='imp'?' 🐍':' ⚡'):''),c:p.color,k:p.kills,d:p.deaths,dmg:Math.round(p.dmgDealt),tm:MODES[G.mode].team?p.team:-1}))};
  if(G.mode==='train')matchOver();else G.endT=1.6;   // ห้องฝึก = จบทันที (ไม่มีชนะ/แพ้)
}
function matchOver(){G.endT=0;G.ph='over';G.proj=[];emit({k:'over',x:0,y:0});}
