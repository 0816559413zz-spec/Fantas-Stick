// =====================================================================
//  สภาพธาตุบนฉาก (Element Surfaces) — เฟส 1: ไฟบนรั้วไม้ (designs/element-surfaces.md)
//  รั้ว (MAPS[id].fcs.fences จาก js/02-fcs.js) แบ่งเป็นช่วงละ ~1.8 ม. (ระหว่างเสา — ตรงกับภาพ fcsFences) แต่ละช่วงมี
//  ความร้อน 0–100 + HP • host คำนวณ (efsTick) ส่งสถานะทุกเครื่องผ่าน snapshot EF (efsSnap/efsParse) • ภาพ efsView ใน js/28-fcs-build.js
//  เติมความร้อน: ประกายไฟ BA (spark) / ลูกไฟชาร์จ BA (pfire) โดนรั้ว = efsProj • สกิลไฟ (damageEnv ธาตุ fire/fireblast) = efsEnv
//  ระดับ 1 ไฟเล็ก ดับเองไม่พัง • 2 ไหม้จนพัง ลามช่วงข้าง • 3 ไฟใหญ่ ลามเร็ว • ผลโดนเฉพาะศัตรูของทีมเจ้าของไฟ (ทีมที่เติมล่าสุด)
//  พังแล้วไม่เกิดใหม่จนจบรอบ (สร้างใหม่ตอน setMapVars) — ค่าทั้งหมดผู้ใช้อนุมัติ 2026-11-18
// =====================================================================
const EFSV={sec:1.8,hp:100,heat:{spark:8,ball:20,skill:45},lv:[10,40,75],rad:[0,0.6,1.2,2],brn:[0,1,1,2],dmg:[0,2,6,12],decay:6,spread:[0,0,5,15],burnCd:1,maxZ:1.6};
const EFS={S:[]};
function efsLv(s){const L=EFSV.lv,h=s.heat;return h>=L[2]?3:h>=L[1]?2:h>=L[0]?1:0;}
function efsBuild(id){
  EFS.S=[];const M=MAPS[id],F=M&&M.fcs&&M.fcs.fences;if(!F)return;
  const S=EFS.S,by=[];
  F.forEach(([x1,y1,x2,y2],f)=>{const n=Math.max(1,Math.round(Math.hypot(x2-x1,y2-y1)/20/EFSV.sec));by[f]=[];
    for(let i=0;i<n;i++){const a=i/n,b=(i+1)/n,s={i:S.length,f,x1:x1+(x2-x1)*a,y1:y1+(y2-y1)*a,x2:x1+(x2-x1)*b,y2:y1+(y2-y1)*b,heat:0,hp:EFSV.hp,team:-1,by:null,br:0,cs:[],nb:[],lv:0,dm:0,fed:0};
      s.cx=(s.x1+s.x2)/2;s.cy=(s.y1+s.y2)/2;S.push(s);by[f].push(s);}
    for(let i=1;i<n;i++){by[f][i].nb.push(by[f][i-1]);by[f][i-1].nb.push(by[f][i]);}});
  // ปลายรั้วต่างแนวที่ชนกัน (มุม) = ลามถึงกัน
  for(let f=0;f<by.length;f++)for(let g=f+1;g<by.length;g++)for(const a of [by[f][0],by[f][by[f].length-1]])for(const b of [by[g][0],by[g][by[g].length-1]]){
    const d=Math.min(...[[a.x1,a.y1],[a.x2,a.y2]].flatMap(([p,q])=>[[b.x1,b.y1],[b.x2,b.y2]].map(([u,v])=>Math.hypot(p-u,q-v))));
    if(d<40&&!a.nb.includes(b)){a.nb.push(b);b.nb.push(a);}}
  // วงชนของรั้ว → ช่วงที่มันอยู่ (พังแล้ววงนั้นสูง 0 = เดิน/ยิงผ่าน)
  for(const o of M.obs){if(o.k!=='fcf')continue;const L=by[o.fid];if(!L)continue;const [x1,y1,x2,y2]=F[o.fid],dx=x2-x1,dy=y2-y1;
    const t=clamp(((o.x-x1)*dx+(o.y-y1)*dy)/(dx*dx+dy*dy||1),0,0.9999),s=L[Math.floor(t*L.length)];
    if(o.h0===undefined)o.h0=o.hgt;o.hgt=o.h0;o.efs=s.i;s.cs.push(o);}
}
function efsDist(s,x,y){const dx=s.x2-s.x1,dy=s.y2-s.y1,t=clamp(((x-s.x1)*dx+(y-s.y1)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-s.x1-dx*t,y-s.y1-dy*t);}
function efsHeat(s,amt,by){
  if(s.br||!(amt>0))return;const o=by!=null?G.players[by]:null;
  s.heat=Math.min(100,s.heat+amt);if(o){s.team=o.team;s.by=by;}else if(s.team<0)s.by=null;
}
// ลูกยิงไฟ (BA) ชนวงรั้ว — เรียกจาก updateProjectiles (js/12-buildings.js)
function efsProj(c,pr){
  const s=EFS.S[c.efs];if(!s||projEl(pr)!=='fire')return;
  const H=EFSV.heat,amt=pr.type==='spark'?H.spark:pr.type==='pfire'?H.ball:0;   // ลูกยิงของสกิลไฟจุดผ่าน damageEnv แทน (กันนับซ้ำ)
  efsHeat(s,amt,pr.owner);
}
// สกิลไฟระเบิด/วง — เรียกจาก damageEnv
function efsEnv(x,y,rad,by,el,h){
  if(!EFS.S.length||(el!=='fire'&&el!=='fireblast')||(h||0)>4)return;
  for(const s of EFS.S)if(!s.br&&efsDist(s,x,y)<rad+10)efsHeat(s,EFSV.heat.skill,by);
}
const _efsHit=new Map();
function efsTick(dt){
  const S=EFS.S;if(!S.length)return;const V=EFSV;let any=false;
  for(const s of S)s.fed=0;
  for(const s of S){if(s.br||s.heat<=0)continue;const L=efsLv(s);if(L<2)continue;
    for(const n of s.nb){if(n.br)continue;if(n.heat<V.lv[0]){n.team=s.team;n.by=s.by;}n.heat=Math.min(100,n.heat+V.spread[L]*dt);n.fed=1;}}
  _efsHit.clear();
  for(const s of S){if(s.br||s.heat<=0)continue;any=true;const L=efsLv(s);
    if(L<2&&!s.fed)s.heat=Math.max(0,s.heat-V.decay*dt);   // ไฟเล็ก (ไม่มีช่วงข้างป้อน) ค่อย ๆ ดับ
    if(L<1)continue;
    s.hp-=V.dmg[L]*dt;
    if(s.hp<=0){s.br=1;s.heat=0;s.hp=0;for(const o of s.cs)o.hgt=0;
      emit({k:'efs',t:'b',x:Math.round(s.cx),y:Math.round(s.cy),h:0.6,hh:1.2,r:18,mi:1});continue;}
    const R=V.rad[L]*20,tl=s.team>=0?foesOf(s.team):plist().filter(q=>q.alive&&!q.downed);
    for(const t of tl){if(t.inv>0||((t.isE?(t.h||0):(t.z||0))>V.maxZ))continue;
      if(Math.abs(t.x-s.cx)>R+60||Math.abs(t.y-s.cy)>R+60)continue;
      if(efsDist(s,t.x,t.y)<R+(t.r||PR)*0.6){const b=_efsHit.get(t);if(!b||V.brn[L]>b.n)_efsHit.set(t,{n:V.brn[L],by:s.by});}}
  }
  for(const [t,b] of _efsHit)if(G.time>=(t.efsN||0)){t.efsN=G.time+V.burnCd;addBurn(t,b.n,b.by);}
  EFS.any=any;
}
// snapshot: 1 ตัวอักษรต่อช่วง = 'x' พัง • อื่น ๆ = 48 + ระดับไฟ*5 + แถบความเสียหาย 0–4 (ไหม้ดำ) • ว่าง = ยังไม่มีอะไรเกิด
function efsSnap(){
  const S=EFS.S;if(!S.length||!S.some(s=>s.br||s.heat>0||s.hp<EFSV.hp))return '';
  let o='';for(const s of S)o+=s.br?'x':String.fromCharCode(48+efsLv(s)*5+Math.min(4,Math.floor((EFSV.hp-s.hp)/20)));return o;
}
function efsParse(str){
  const S=EFS.S;if(!S.length)return;str=str||'';
  for(const s of S){const c=str[s.i];
    if(c==='x'){if(!s.br){s.br=1;for(const o of s.cs)o.hgt=0;}s.lv=0;s.dm=4;continue;}
    const v=c?c.charCodeAt(0)-48:0;s.lv=Math.floor(v/5);s.dm=v%5;}
}
// host: สถานะของช่วงที่ภาพใช้ (ลูกข่ายได้จาก efsParse)
function efsHostView(){for(const s of EFS.S){if(s.br){s.lv=0;s.dm=4;continue;}s.lv=efsLv(s);s.dm=Math.min(4,Math.floor((EFSV.hp-s.hp)/20));}}
