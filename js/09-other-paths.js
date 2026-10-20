// =====================================================================
//  สายธรรมชาติ — พิษ: สะสมพิษ → ปิดจบด้วยหนามระเบิด (ชั้นละ 9 + ฟื้นเลือดเรา) • รากมัดทำให้พิษแรงขึ้น
// =====================================================================
defSpell(3,{id:'poisondart',role:'builder',n:'ลูกดอกพิษ',ic:'🏹',cd:3,d:'ลูกดอกเร็ว ใส่พิษสะสมได้ 3 ชั้น (ชั้นยิ่งสูงยิ่งเจ็บ)',fx:'ใส่เป้าที่ถูกรากมัดอยู่ = พิษ 2 ชั้นทันที',
  cast(p,S){shoot(p,'dart',{sp:S.id,dmg:10});},
  hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');addPoison(t,pr.owner,t.root>0?2:1);}});
defSpell(3,{id:'vinelash',role:'control',n:'เถาวัลย์พันธนาการ',ic:'🌱',cd:7,d:'เถาวัลย์พุ่งไปมัดเป้าหมาย ขยับไม่ได้ 1 วิ (ยังร่ายเวทได้)',fx:'ถ้าเป้ามีพิษ: มัดนานขึ้น (1.4 วิ) และกินพิษ 1 ชั้นเป็นดาเมจ 8',
  cast(p,S){shoot(p,'vine',{sp:S.id,dmg:10});},
  hit(pr,t){
    const n=t.psn|0;damage(t,pr.dmg,pr.owner,'proj');addRoot(t,n>0?1.4:1.0);
    if(n>0){t.psn=n-1;if(t.psn<=0)t.psnT=0;damage(t,8,pr.owner,'pierce');}
    emit({k:'efx',z:'vine',x:t.x,y:t.y,h:0.3});
  }});
defSpell(3,{id:'sporecloud',role:'control',n:'เมฆสปอร์',ic:'☁️',cd:13,d:'เมฆสปอร์พิษวงกว้าง 5 วิ ใส่พิษสะสมและชะลอทุกคนข้างใน',fx:'ให้พิษลอยขึ้นถึง 3 ชั้นโดยไม่ต้องยิง — เตรียมหนามระเบิด',
  cast(p,S){const q=aimPoint(p,480);addZone({x:q.x,y:q.y,r:170,t:5,tick:0.8,owner:p.id,team:p.team,kind:'spore',n:0,hit(t,z){damage(t,2,z.owner,'zone');if((z.n=(z.n|0)+1)%2===0)addPoison(t,z.owner,1);addSlow(t,0.85,0.9);}});}});
defSpell(3,{id:'bloom',role:'utility',n:'ดอกไม้ฟื้นฟู',ic:'🌸',cd:14,d:'สร้างวงดอกไม้ 5 วิ ฟื้นเลือดตัวเองและเพื่อนที่ยืนอยู่ข้างใน + ล้างพิษ',fx:'ยืนนิ่งๆ ได้ประโยชน์สุด',
  cast(p,S){addZone({x:p.x,y:p.y,r:150,t:5,tick:0.8,owner:p.id,team:p.team,kind:'bloom',allyHit(q,z){q.psn=0;q.psnT=0;healT(q,6);}});}});
defSpell(3,{id:'thornburst',role:'finisher',n:'หนามระเบิด',ic:'🌵',cd:9,d:'หนามพุ่งรอบตัว: กินพิษทุกชั้นของศัตรูเป็นดาเมจ (ชั้นละ 11) แล้วฟื้นเลือดเรา 30% ของดาเมจที่ทำ',fx:'พิษ ≥2 ชั้น = รากมัด 0.8 วิ ด้วย',
  cast(p,S){
    emit({k:'efx',z:'thorn',x:p.x,y:p.y,h:p.z+0.8,r:170});let tot=0;
    for(const t of foesIn(p.team,p.x,p.y,170,4))aoeHit(p,t,8,t=>{const n=takePoison(t);if(n>0){const dm=11*n;damage(t,dm,p.id,'pierce');tot+=dm;if(n>=2)addRoot(t,0.8);}});
    if(tot>0)healT(p,tot*0.3);
  }});
defSpell(3,{id:'worldtree',role:'ult',n:'ต้นไม้โลก',ic:'🌲',cd:0,ult:true,d:'เวทโบราณสายธรรมชาติ: รากยักษ์พุ่งมัดศัตรูรอบตัว 1.8 วิ ใส่พิษ 3 ชั้น และฟื้นเรา + เพื่อน',fx:'ทิ้งวงดอกไม้ฟื้นฟู 5 วิ',
  cast(p,S){
    emit({k:'efx',z:'worldtree',x:p.x,y:p.y,h:p.z+0.5,r:300});
    for(const t of foesIn(p.team,p.x,p.y,300,6))aoeHit(p,t,t.isE?30:20,t=>{addRoot(t,1.8);t.psn=3;t.psnT=4;t.psnSrc=p.id;if(!(t.psnTick>0))t.psnTick=0.8;});
    for(const q of plist())if(q.team===p.team&&q.alive&&!q.downed&&Math.hypot(q.x-p.x,q.y-p.y)<300)healT(q,25);
    addZone({x:p.x,y:p.y,r:200,t:5,tick:0.8,owner:p.id,team:p.team,kind:'bloom',allyHit(q,z){q.psn=0;q.psnT=0;healT(q,7);}});
  }});

// =====================================================================
//  สายคำสาป — ตรามรณะ: ตีตรา (ดาเมจ +25%) → คำสาปทุกชนิดแรงขึ้นกับคนมีตรา → ดูดวิญญาณปิดจบ
// =====================================================================
defSpell(4,{id:'hexmark',role:'builder',n:'ตรามรณะ',ic:'🎯',cd:8,d:'ตีตราเป้าหมาย 5 วิ โดนดาเมจ +12% จากทุกคน และรักษาเลือดได้ครึ่งเดียว',fx:'คำสาปอื่นๆ ของสายนี้แรงขึ้นกับคนมีตรา',
  cast(p,S){shoot(p,'hex',{sp:S.id,dmg:8});},
  hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');addMark(t,5);emit({k:'efx',z:'mark',x:t.x,y:t.y,h:cH(t)+1});}});
defSpell(4,{id:'silencecurse',role:'control',n:'คำสาปปิดปาก',ic:'🤐',cd:8,d:'คำสาปพุ่งตรง ทำให้ร่ายคาถาไม่ได้ 1.6 วิ (ยิงปกติและโล่ยังใช้ได้)',fx:'ใส่คนมีตรา = ปิดปาก 2.2 วิ',
  cast(p,S){shoot(p,'hex',{sp:S.id,dmg:10});},
  hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');addSil(t,t.mrk>0?2.2:1.6);emit({k:'efx',z:'silence',x:t.x,y:t.y,h:cH(t)+1});}});
defSpell(4,{id:'blinddust',role:'control',n:'ผงมืดบอด',ic:'🕶️',cd:16,d:'โปรยผงมืดบอด ณ จุดเล็ง เป้าหมายเล็งไม่แม่น 2 วิ',fx:'คนมีตรา: มืดบอด 2.8 วิ และช้าลงด้วย',
  cast(p,S){
    const q=aimPoint(p,520);emit({k:'efx',z:'blind',x:q.x,y:q.y,h:0.8,r:130});
    for(const t of foesIn(p.team,q.x,q.y,130,4))aoeHit(p,t,4,t=>{const mk=t.mrk>0;addBlind(t,mk?2.8:2.0);if(mk)addSlow(t,0.8,1.5);});
  }});
defSpell(4,{id:'terror',role:'control',n:'ความหวาดกลัว',ic:'😱',cd:14,d:'คลื่นความกลัวรอบตัว ศัตรูวิ่งหนี 1.5 วิ (บังคับทิศเดินเท่านั้น)',fx:'คนมีตรา: กลัว 2.2 วิ • ศัตรูที่กลัวยังร่ายเวทได้',
  cast(p,S){
    emit({k:'efx',z:'terror',x:p.x,y:p.y,h:p.z+1,r:210});
    for(const t of foesIn(p.team,p.x,p.y,210,5))aoeHit(p,t,6,t=>addFear(t,t.mrk>0?2.2:1.5,p.x,p.y));
  }});
defSpell(4,{id:'soulsiphon',role:'finisher',n:'ดูดวิญญาณ',ic:'🩸',cd:8,d:'ดูดวิญญาณเป้าหมายตรงหน้า (พิสัย 650): คนมีตรา = ดาเมจ 18 + กินตรา + ปิดปาก 1.2 วิ + ฟื้นเลือดเรา',fx:'ไม่มีตรา = ดาเมจแค่ 10 และไม่ฟื้น — ต้องตีตราก่อน',
  cast(p,S){
    const tg=aimTarget(p,650);if(!tg)return false;
    const mk=tg.mrk>0,dm=mk?18:10;
    damage(tg,dm,p.id,'pierce');
    if(mk){tg.mrk=0;addSil(tg,1.2);healT(p,dm*0.4);}
    emit({k:'efx',z:'siphon',x:p.x,y:p.y,h:p.z+1.2,x2:tg.x,y2:tg.y,h2:cH(tg),m:mk?1:0});
  }});
defSpell(4,{id:'darkness',role:'ult',n:'ความมืดมิด',ic:'🌑',cd:0,ult:true,d:'เวทโบราณสายคำสาป: ตีตราทุกคนในวงกว้าง + ปิดปาก + มืดบอด + ชะลอ',fx:'บอสทนได้ แต่ศัตรูทั่วไปหมดทางสู้ — ตามด้วยดูดวิญญาณ',
  cast(p,S){
    emit({k:'efx',z:'curse',x:p.x,y:p.y,h:p.z+1,r:360});
    for(const t of foesIn(p.team,p.x,p.y,360,6))aoeHit(p,t,20,t=>{addMark(t,6);addSil(t,3);addBlind(t,2.2);addSlow(t,0.55,3);});
  }});

// ---------- สัตว์เวท (minion): AI ฝั่งโฮสต์ ----------
const MIND={
  wolf:{n:'หมาป่าวิญญาณ',hp:24,spd:270,r:16,life:14,max:1},
  sprite:{n:'สไปรท์ไฟ',hp:14,spd:200,r:12,life:12,max:1,fly:true},
  golem:{n:'ยักษ์หิน',hp:75,spd:105,r:30,life:12,max:1},
  wisp:{n:'วิญญาณรักษา',hp:16,spd:230,r:11,life:9,max:1,fly:true}
};
function summonMin(p,type,o){
  const D=MIND[type];o=o||{};
  const mine=G.mins.filter(m=>m.owner===p.id&&m.type===type&&!m.dead);
  if(!o.force&&mine.length>=D.max){mine.sort((a,b)=>a.life-b.life)[0].dead=true;}
  const a=p.ang+rnd(-1,1),m={id:++G.mid,isM:true,type,owner:p.id,team:p.team,x:p.x+Math.cos(a)*70,y:p.y+Math.sin(a)*70,h:D.fly?2.2:0,z:D.fly?2.2:0,r:D.r,hp:D.hp,maxHp:D.hp,spd:D.spd,life:o.life||D.life,cd:1.0+rnd(0,0.3),vx:0,vy:0,stun:0,od:0};
  const q={x:m.x,y:m.y};collideWorld(q,m.r);m.x=q.x;m.y=q.y;
  G.mins.push(m);emit({k:'efx',z:'summon',x:m.x,y:m.y,h:0.6});
  return m;
}
function minTarget(m){
  const own=G.players[m.owner];
  if(own&&own.focusT&&G.time<own.focusUntil&&!own.focusT.dead&&own.focusT.alive!==false&&own.focusT.team!==m.team)return own.focusT;
  let b=null,bd=(m.type==='golem'?520:850)**2;
  for(const t of foesOf(m.team)){const d=(t.x-m.x)**2+(t.y-m.y)**2;if(d<bd){bd=d;b=t;}}
  return b;
}
function minShoot(m,t,type,dmg){
  const pd=PDEF[type],a=Math.atan2(t.y-m.y,t.x-m.x),dd=Math.hypot(t.x-m.x,t.y-m.y)||1,h=(m.h||0)+0.8,vh=(cH(t)+terrT(t.x,t.y)-terrT(m.x,m.y)-h)/(dd/pd.spd);
  G.proj.push({id:++G.pid,type,x:m.x+Math.cos(a)*14,y:m.y+Math.sin(a)*14,h,vh,vx:Math.cos(a)*pd.spd,vy:Math.sin(a)*pd.spd,r:pd.r,dmg,life:pd.life,owner:m.owner,team:m.team,src:'p'});
  emit({k:'cast',t:type,x:m.x,y:m.y,h,a:Math.round(a*100)/100});
}
function updateMins(dt){
  for(const m of G.mins){
    if(m.dead)continue;
    m.life-=dt;if(m.life<=0){m.dead=true;emit({k:'efx',z:'unsummon',x:m.x,y:m.y,h:(m.h||0)+0.6});continue;}
    tickStatus(m,dt);if(m.od>0)m.od-=dt;
    if(m.burn>0){m.burn-=dt;m.bt-=dt;if(m.bt<=0){m.bt=0.5;damage(m,4,m.burnSrc,'burn');if(m.dead)continue;}}
    m.ox=m.x;m.oy=m.y;
    m.x+=m.vx*dt;m.y+=m.vy*dt;const fr=Math.exp(-5*dt);m.vx*=fr;m.vy*=fr;
    m.cd-=dt;
    if(m.stun>0){m.stun-=dt;continue;}
    const own=G.players[m.owner],spd=m.spd*moveMul(m)*(m.root>0?0:1)*(m.od>0?1.3:1),od=m.od>0?0.7:1;
    const mv=(x,y,k)=>{const dx=x-m.x,dy=y-m.y,d=Math.hypot(dx,dy)||1;m.x+=dx/d*spd*dt*(k||1);m.y+=dy/d*spd*dt*(k||1);};
    const follow=()=>{if(own&&Math.hypot(own.x-m.x,own.y-m.y)>150)mv(own.x,own.y);};
    if(m.fear>0){mv(m.fearX,m.fearY,-1);}
    else switch(m.type){
      case 'wolf':{
        const tg=minTarget(m);
        if(tg){const d=Math.hypot(tg.x-m.x,tg.y-m.y);if(d>m.r+(tg.r||PR)+8)mv(tg.x,tg.y);else if(m.cd<=0){m.cd=0.9*od;damage(tg,5,m.owner,'melee');emit({k:'claw',x:tg.x,y:tg.y,h:cH(tg),t:'wolf'});}}
        else follow();break;}
      case 'sprite':{
        const tg=minTarget(m);
        if(tg){const d=Math.hypot(tg.x-m.x,tg.y-m.y);if(d>340)mv(tg.x,tg.y);else if(d<220)mv(tg.x,tg.y,-1);if(d<720&&m.cd<=0){m.cd=1*od;minShoot(m,tg,'ember',4);}}
        else follow();
        m.h=2.2+Math.sin(G.time*3+m.id)*0.4;break;}
      case 'golem':{
        const tg=minTarget(m);
        if(tg){const d=Math.hypot(tg.x-m.x,tg.y-m.y);if(d>m.r+(tg.r||PR)+30)mv(tg.x,tg.y);
          if(d<m.r+(tg.r||PR)+90&&m.cd<=0){m.cd=2.2*od;emit({k:'slam',x:m.x,y:m.y,r:100});for(const t of foesIn(m.team,m.x,m.y,100,3.5)){damage(t,12,m.owner,'aoe');knock(t,m.x,m.y,350);}}}
        else follow();break;}
      case 'wisp':{
        for(const o2 of G.mins)if(o2!==m&&!o2.dead&&o2.owner===m.owner&&Math.hypot(o2.x-m.x,o2.y-m.y)<230)o2.od=Math.max(o2.od,0.4);
        if(own){const d=Math.hypot(own.x-m.x,own.y-m.y);if(d>110)mv(own.x,own.y);
          if(m.cd<=0){m.cd=1.2*od;for(const q of plist())if(q.team===m.team&&q.alive&&!q.downed&&Math.hypot(q.x-m.x,q.y-m.y)<170){healT(q,2.5);emit({k:'efx',z:'wispheal',x:m.x,y:m.y,h:m.h+0.3,x2:q.x,y2:q.y,h2:(q.z||0)+1.2});}}}
        m.h=2+Math.sin(G.time*2.4+m.id)*0.3;break;}
    }
    const q={x:m.x,y:m.y};collideWorld(q,m.r,m.h>1?5:0);m.x=q.x;m.y=q.y;m.z=m.h;
    if(TERR&&!MIND[m.type].fly)terrMove(m,m.ox,m.oy,0,true);
  }
  G.mins=G.mins.filter(m=>!m.dead);
}
function aimTarget(p,range){
  let best=null,bs=1e9;
  for(const t of foesOf(p.team)){
    const dx=t.x-p.x,dy=t.y-p.y,dd=Math.hypot(dx,dy);if(dd>range||dd<1)continue;
    const da=Math.abs(angDiff(Math.atan2(dy,dx),p.ang));if(da<0.4&&da+dd/4000<bs){bs=da+dd/4000;best=t;}
  }
  return best;
}

// =====================================================================
//  สายอัญเชิญ — สัตว์เวท: เรียกกองทัพ → วิญญาณเสริมพลัง → ระเบิดวิญญาณปิดจบ
// =====================================================================
defSpell(5,{id:'spiritwolf',role:'summon',n:'หมาป่าวิญญาณ',ic:'🐺',cd:14,d:'เรียกหมาป่าวิญญาณ 14 วิ วิ่งไล่กัดศัตรู (มีได้ 1 ตัว เรียกซ้ำจะแทนตัวเก่า)',fx:'เลือดน้อยแต่เร็วมาก',
  cast(p,S){summonMin(p,'wolf');}});
defSpell(5,{id:'firesprite',role:'summon',n:'สไปรท์ไฟ',ic:'🧚',cd:16,d:'เรียกสไปรท์ลอยตามเรา ยิงลูกไฟเล็กใส่ศัตรูทุกวินาที 12 วิ (มีได้ 1 ตัว)',fx:'บินได้ อยู่ห่างศัตรู',
  cast(p,S){summonMin(p,'sprite');}});
defSpell(5,{id:'stonegolem',role:'summon',n:'ยักษ์หิน',ic:'🗿',cd:22,d:'เรียกยักษ์หินตัวหนา 12 วิ ทุบพื้นผลักศัตรูและรับดาเมจแทนเรา (มีได้ 1 ตัว)',fx:'ช้า แต่ตายยาก',
  cast(p,S){summonMin(p,'golem');}});
defSpell(5,{id:'wispheal',role:'utility',n:'วิญญาณพิทักษ์',ic:'💚',cd:18,d:'วิญญาณลอยตามเรา 9 วิ ฟื้นเลือดเรากับเพื่อนใกล้ๆ และ "เสริมพลัง" สัตว์เวทที่อยู่ใกล้ (ตีไว เร็วขึ้น)',fx:'ฆ่าง่าย ต้องคอยปกป้อง',
  cast(p,S){summonMin(p,'wisp');}});
defSpell(5,{id:'soulburst',role:'finisher',n:'ระเบิดวิญญาณ',ic:'💀',cd:10,d:'จุดระเบิดสัตว์เวทของเราทุกตัว: แต่ละตัวระเบิดรอบตัว (หมาป่า 14 / สไปรท์ 12 / ยักษ์ 26) แล้วฟื้นเลือดเราตัวละ 4',fx:'ไม่มีสัตว์เวท = ใช้ไม่ได้ (ไม่เสียคูลดาวน์) • วิญญาณพิทักษ์ระเบิดฟื้นเลือดเพื่อนรอบตัว',
  cast(p,S){
    const mine=G.mins.filter(m=>m.owner===p.id&&!m.dead);if(!mine.length)return false;
    for(const m of mine){
      m.dead=true;emit({k:'efx',z:'soulburst',x:m.x,y:m.y,h:(m.h||0)+0.8,r:110});
      if(m.type==='wisp'){for(const q of plist())if(q.team===p.team&&q.alive&&!q.downed&&Math.hypot(q.x-m.x,q.y-m.y)<170)healT(q,10);}
      else{const dm=({wolf:14,sprite:12,golem:26})[m.type]||12;for(const t of foesIn(p.team,m.x,m.y,110,5))aoeHit(p,t,dm,t=>knock(t,m.x,m.y,220));}
      healT(p,4);
    }
  }});
defSpell(5,{id:'legion',role:'ult',n:'กองทัพวิญญาณ',ic:'👻',cd:0,ult:true,d:'เวทโบราณสายอัญเชิญ: เรียกหมาป่า 3 ตัว + สไปรท์ 2 ตัวพร้อมกัน นาน 12 วิ',fx:'ไม่นับรวมโควตาสัตว์เวทปกติ — ตามด้วยระเบิดวิญญาณ',
  cast(p,S){
    for(let i=0;i<3;i++)summonMin(p,'wolf',{force:1,life:12});
    for(let i=0;i<2;i++)summonMin(p,'sprite',{force:1,life:12});
    emit({k:'efx',z:'legion',x:p.x,y:p.y,h:p.z+0.5,r:200});
  }});
// สายฟ้า: ลูกสายฟ้าโดม (ต่อท้ายสุดเพื่อไม่ให้ลำดับ index ของคาถาสายอื่นเลื่อน — kit ที่บันทึกไว้ยังใช้ได้)
defSpell(2,{id:'stormdome',role:'control',n:'ลูกสายฟ้าโดม',ic:'🔵',cd:16,d:'ใช้ 3 stacks: ทะยานขึ้นฟ้า บินปรับได้ (WASD ช้า • Space ขึ้น / C ลง) ชูไม้รวมลูกสายฟ้า 3 วิ — คลิกยิงลงจุดเล็ง (ระยะ 600) แล้วเราร่วงลงทันที',fx:'โดมรัศมี 150 ดูดศัตรูเข้ากลาง 2 วิ (5 ดาเมจ ทุก 0.5 วิ) แล้วระเบิด 50 + Shock (รวม 70) • ระหว่างอัลติ: ถือลูกพุ่งทุบลงแบบ Dragonfall ดูด+ระเบิดทันที 80 • ไม่อมตะ โดนสตันระหว่างบิน = ยกเลิก',
  cast(p,S){
    if(p.sdome||p.dfall)return false;
    if(!stSpend(p,3))return false;
    const g0=groundH(p.x,p.y),q=aimPoint(p,600);
    p.sdome={ph:1,t:0.35,g0,H:g0+6,tx:q.x,ty:q.y,god:p.god>0};
    p.stS=null;p.hover=0;p.vz=0;p.beam=0;
    emit({k:'efx',z:'sdrise',x:p.x,y:p.y,h:p.z,id:p.id});
  }});

// ---------- ร่ายคาถา ----------
function castSlot(p,i){
  const S=SPELLS[p.kitIds[i]];if(!S)return false;
  if(p.aug||p.ramp||(p.wr&&p.wr.ph!=='trans'))return false;   // สายดิน: ชาร์จ Auger / Rampage / อยู่บนฟ้า (Wrath)
  const k=SLOTK[i];
  if(S.toggle&&S.toggle(p))return true;
  if(S.melee&&p.fmode===1)return false;
  if(p.cryo>0&&S.id!=='frostaura')return false;
  if(p.grT>0||p.dfall||p.sdome||p.rail||p.slnT>0)return false;
  if(p.cd[k]>0||p.sil>0)return false;
  if(G.mode==='br'&&!(p.unl&&p.unl[BRMAP[k]]))return false;
  if(S.cast(p,S,i)===false){p.cd[k]=0.5;p.cdMax[k]=0.5;return false;}
  const cd=S.cd*p.buffs.cdr;p.cd[k]=cd;p.cdMax[k]=cd;
  return true;
}
function castUlt(p){if(p.wr){earthDomain(p);return false;}const S=SPELLS[p.ultId];if(!S||p.ult<100||p.sil>0||p.cryo>0)return false;S.cast(p,S);p.ult=0;return true;}
