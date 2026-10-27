// =====================================================================
//  สังเวียน (designs/training-zones.md ขั้น 4) — ห้องฝึก โซนใต้ (TEST_Z.arena)
//  ยืนบนแท่นทีม A / B = พร้อม (บอทสังเวียนพร้อมเสมอ) → 2 ฝั่งมีคน + มีคนจริงอย่างน้อย 1 = นับ 3-2-1
//  → ทุกคนเลือดเต็ม เริ่มที่ฝั่งตัวเอง สู้จนอีกฝั่งตายหมด (ไม่เกิดใหม่กลางรอบ) → ประกาศผู้ชนะ 4 วิ → กลับข้างแท่น ยืนแท่นใหม่ = แข่งอีกรอบ
//  G.ar = {ph:'idle'|'count'|'fight'|'end', t, A:[id], B:[id], n} • p.arSide = ฝั่งที่กำลังแข่ง
// =====================================================================
const AR_SIDE=['A','B'],AR_TEAM={A:30,B:31},AR_MAX=2;
function arPads(){const A=TEST_Z.arena;return {A:{x:A.cx-420,y:A.cy,r:120},B:{x:A.cx+420,y:A.cy,r:120},bot:{x:A.cx,y:A.cy+560,r:130}};}
function arOn(p,s){const P=arPads()[s];return Math.hypot(p.x-P.x,p.y-P.y)<P.r;}
function arState(){return G.ar||(G.ar={ph:'idle',t:0,A:[],B:[],n:-1});}
function arBusy(){return !!(G&&G.ar&&G.ar.ph!=='idle');}
// ผู้พร้อมแต่ละฝั่ง (สูงสุด AR_MAX): คนจริงที่ยืนบนแท่น + บอทสังเวียนฝั่งนั้น
function arReady(){
  const R={A:[],B:[]};
  for(const p of plist()){if(!p.alive||p.downed)continue;
    if(p.ai){if(p.ai.side&&p.ai.zone==='arena')R[p.ai.side].push(p);}
    else for(const s of AR_SIDE)if(arOn(p,s))R[s].push(p);}
  for(const s of AR_SIDE)R[s]=R[s].sort((a,b)=>(a.ai?1:0)-(b.ai?1:0)).slice(0,AR_MAX);   // คนจริงได้ที่ก่อนบอท
  return R;
}
const arNames=(S,s)=>S[s].map(id=>G.players[id]).filter(Boolean).map(p=>p.name).join(' + ');
function arenaTick(dt){
  const S=arState();S.t-=dt;
  if(S.ph==='idle'){
    if(S.t>0)return;   // พักหลังจบรอบ
    const R=arReady();
    if(R.A.length&&R.B.length&&R.A.concat(R.B).some(p=>!p.ai)){S.ph='count';S.t=3;S.n=-1;S.A=R.A.map(p=>p.id);S.B=R.B.map(p=>p.id);}
  }else if(S.ph==='count'){
    // คนจริงลงจากแท่น / หลุด = ยกเลิก
    const ok=AR_SIDE.every(s=>S[s].every(id=>{const p=G.players[id];return p&&p.alive&&(p.ai||arOn(p,s));}));
    if(!ok){S.ph='idle';S.t=1;banner('สังเวียน: ยกเลิก — มีคนลงจากแท่น',1.5);return;}
    // ขึ้นแท่นระหว่างนับ = เข้าร่วม (ถ้าฝั่งยังว่าง) แล้วนับใหม่
    const R=arReady();for(const s of AR_SIDE)for(const p of R[s])if(!S[s].includes(p.id)&&S[s].length<AR_MAX&&!S[AR_SIDE[1-AR_SIDE.indexOf(s)]].includes(p.id)){S[s].push(p.id);S.t=3;S.n=-1;}
    const k=Math.ceil(S.t);if(k!==S.n){S.n=k;if(k>0)banner(`⚔️ ${arNames(S,'A')}  VS  ${arNames(S,'B')} — ${k}`,1.1);}
    if(S.t<=0)arStart(S);
  }else if(S.ph==='fight'){
    const A=TEST_Z.arena,alive=s=>S[s].map(id=>G.players[id]).filter(p=>p&&p.alive&&!p.downed);
    for(const s of AR_SIDE)for(const p of alive(s)){const dx=p.x-A.cx,dy=p.y-A.cy,d=Math.hypot(dx,dy);if(d>A.r-50){p.x=A.cx+dx/d*(A.r-50);p.y=A.cy+dy/d*(A.r-50);}}   // ห้ามหนีออกนอกสังเวียน
    const a=alive('A').length,b=alive('B').length;
    if(!a||!b)arEnd(S,a?'A':b?'B':null);
  }else if(S.ph==='end'){if(S.t<=0)arReset(S);}
}
function arStart(S){
  const A=TEST_Z.arena;
  for(const s of AR_SIDE)S[s].forEach((id,i,L)=>{const p=G.players[id];if(!p)return;
    p.arSide=s;p.team=AR_TEAM[s];const dir=s==='A'?-1:1;
    resetBody(p,A.cx+dir*520,A.cy+(i-(L.length-1)/2)*220);p.ang=s==='A'?0:Math.PI;p.inv=0.5;
    emit({k:'revive',x:p.x,y:p.y});});
  S.ph='fight';banner('⚔️ สู้!',1.2);feed(`⚔️ สังเวียน: ${arNames(S,'A')} VS ${arNames(S,'B')}`);
}
function arEnd(S,w){
  S.ph='end';S.t=4;
  const txt=w?`🏆 ทีม ${w} ชนะ! — ${arNames(S,w)}`:'🤝 เสมอ!';
  banner(txt,4);feed(txt);
}
// จบรอบ: ทุกคนฟื้นเลือดเต็มข้างแท่นฝั่งตัวเอง (ไม่ทับแท่น = ต้องเดินขึ้นใหม่ถึงจะแข่งอีกรอบ) • บอทกลับแท่น
function arReset(S){
  const P=arPads();clearOwned(S.A.concat(S.B));   // สนามสะอาดก่อนรอบใหม่
  for(const s of AR_SIDE)for(const id of S[s]){const p=G.players[id];if(!p)continue;delete p.arSide;
    if(p.ai)resetBody(p,p.ai.home.x,p.ai.home.y);else resetBody(p,P[s].x+rnd(-60,60),P[s].y-250);p.inv=1;emit({k:'revive',x:p.x,y:p.y});}
  S.ph='idle';S.t=2;S.A=[];S.B=[];trTeams();
}
// บอทสังเวียน (trBotCmd js/15-bot): ฝั่งละไม่เกิน AR_MAX รวมบอทที่มีอยู่ • เสกได้เฉพาะตอนไม่มีแข่ง
function arAddBots(p,d){
  const s=d.side==='B'?'B':'A',P=arPads()[s];
  if(arBusy()){toast('กำลังแข่งอยู่ — รอจบรอบก่อน');return 0;}
  const have=bots().filter(q=>q.ai.side===s).length,n=Math.min(clamp(d.n|0||1,1,AR_MAX),AR_MAX-have);let k=0;
  for(let i=0;i<n;i++){const q=spawnBot(d.p|0,d.lv|0,P.x+(i?0:0),P.y+(have+i?60:-60),'arena',p.id);if(!q)break;q.ai.side=s;q.ai.team=q.team=AR_TEAM[s];q.ai.home={x:P.x,y:P.y+(have+i?50:-50)};k++;}
  if(!k&&have>=AR_MAX)toast(`ทีม ${s} มีบอทครบ ${AR_MAX} ตัวแล้ว`);
  return k;
}
