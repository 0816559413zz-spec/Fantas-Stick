// ---------- เมืองพังได้ (designs/city-bot-battle.md ขั้น 4) — ข้อมูลที่ทุกเครื่องใช้ร่วม + ฝั่งโฮสต์ ----------
// ตึก (MAPS.city.boxes) = ผิวเป็นแผ่น 4 ม. × 1 ชั้น (cityLayout — ลำดับเดียวกับภาพใน js/28) • แผ่นละเลือด → หมด = แผ่นแตก (เห็นเป็นรู ข้างในยังทึบ)
// แผ่นชั้นล่างแตก ≥ CDMG.fall ของแผ่นชั้นล่างทั้งหมด (ทุกด้านรวมกัน — 0.3 ≈ พังหน้าตึกทั้งแถว) = ตึกถล่มทั้งหลัง → เหลือกองซากเตี้ย (เดินปีนได้ ยิงข้ามได้) • ตึกไฮไลต์ (hl) อึดกว่า
// ของในเมือง (MAPS.city.street) = เลือดต่อชิ้น → หมด: เสา/ตู้ล้ม หรือแตกหาย (ที่ชนหาย) • รถ = ไฟลุก CDMG.burn วิ → ระเบิด (ดาเมจรอบตัว ลามรถคันอื่นได้) → ซากไหม้ (ยังชน)
// เลือด/ระเบิด/เกณฑ์ถล่ม = ค่าตั้งต้น ให้ทีมเกมเพลย์ปรับ • ปิดในโหมดที่ไม่มีของพัง (BLDON — PROP_OFF_MODES)
// snapshot: CB = ตึกคั่น '|' ('' = ปกติ, 'x' นำหน้า = ถล่ม, ต่อด้วยบิตแผ่นแตกเป็นเลขฐาน 16 ทีละ 4 แผ่น) • CS = ของ 1 ตัวต่อชิ้น (0 ปกติ 1 พัง 2 ไฟลุก 3 ซาก)
// เหตุการณ์: {k:'cb',e:'h'|'b'|'c',i,x,y,h,el} (โดน / แผ่นแตก / ถล่ม) • {k:'cs',e:'b'|'f',i,x,y} (พัง / รถไฟลุก) • รถระเบิดใช้ {k:'boom'} เดิม
const CITY_FL=3.5,CITY_PW=4;
const CDMG={hp:{brick:60,shop:60,station:70,office:90,glass:30,metal:50,garage:120},hl:2.5,fall:0.3,hlFall:0.55,
  ihp:{lamp:40,tlight:40,tube:30,bin:15,bench:25,phone:60,postbox:80,busstop:40,bollard:60,planter:50,bush:20,cone:5,barrier:15,pallet:20,car:80,van:100,taxi:80,bus:200},
  topple:new Set(['lamp','tlight','tube','phone','postbox','busstop']),veh:new Set(['car','van','taxi','bus']),burn:3,boom:{r:150,dmg:35,env:60},mound:1.6,pad:40};
let CITYD=null;
const cityOn=()=>CITYD&&MAPID==='city';   // สถานะเมืองค้างจากแมตช์ก่อนได้ — ใช้เฉพาะตอนอยู่แมพ city
// ผิวตึก: F = ด้าน [มุม rotation.y, ระยะออกจากกลาง (ม.), ความยาว (ม.), ระยะถึงขอบย่าน] • P = แผ่น {fi,i,f,x,y (px กลางแผ่นบนผิว),z0,z1 (ม.)} เรียง ด้าน→คอลัมน์→ชั้น
function cityLayout(B,zones){
  const n=Math.max(1,Math.round(B.h/CITY_FL)),sy=B.h/(n*CITY_FL),w=B.w/20,d=B.d/20,cx=B.x+B.w/2,cy=B.y+B.d/2;
  const zn=zones.find(z=>cx>=z.x&&cx<=z.x+z.w&&cy>=z.y&&cy<=z.y+z.d)||{x:B.x-1,y:B.y-1,w:B.w+2,d:B.d+2};
  const F=[[0,d/2,w,zn.y+zn.d-(B.y+B.d)],[Math.PI,d/2,w,B.y-zn.y],[Math.PI/2,w/2,d,zn.x+zn.w-(B.x+B.w)],[-Math.PI/2,w/2,d,B.x-zn.x]];
  const front=F.reduce((a,f,i)=>f[3]<F[a][3]?i:a,0),P=[],FS=[];
  F.forEach(([a,off,L],fi)=>{const k=Math.max(1,Math.round(L/CITY_PW)),sx=L/(k*CITY_PW);FS.push({a,off,L,k,sx,s0:P.length});
    for(let i=0;i<k;i++){const t=(i+0.5-k/2)*CITY_PW*sx,x=cx+(Math.sin(a)*off+Math.cos(a)*t)*20,y=cy+(Math.cos(a)*off-Math.sin(a)*t)*20;
      for(let f=0;f<n;f++)P.push({fi,i,f,x,y,z0:f*CITY_FL*sy,z1:(f+1)*CITY_FL*sy});}});
  return {n,sy,F:FS,P,front,g:P.filter(p=>p.f===0).length};
}
function cityReset(){
  const M=MAPS.city;if(!M)return;
  CITYD={b:M.boxes.map(B=>{B.cl=0;const st=B.m in CDMG.hp,L=st?cityLayout(B,M.zones):null;
      return {B,L,st,hp:L?new Float32Array(L.P.length).fill(CDMG.hp[B.m]*(B.hl?CDMG.hl:1)):null,br:L?new Uint8Array(L.P.length):null,nb:0,cl:0,v:0,s:'',ht:0,circ:[]};}),
    it:M.street.map((q,i)=>({q,i,hp:CDMG.ihp[q.m]||0,st:0,t:0,v:0,c:[]}))};
  for(const o of M.obs){
    if(o.k==='cwall'){if(o.h0===undefined)o.h0=o.hgt;o.hgt=o.h0;CITYD.b[o.cb].circ.push(o);}
    else if(o.ci!==undefined){if(o.h0===undefined)o.h0=o.hgt;o.hgt=o.h0;CITYD.it[o.ci].c.push(o);}
  }
}
MAPS.city.reset=cityReset;
// ที่ชน/ความทึบตามสถานะ (ทั้งโฮสต์และลูกข่าย — ลูกข่ายใช้ทำนายการเดินของตัวเอง)
function cityApplyBox(d){d.B.cl=d.cl;for(const c of d.circ)c.hgt=d.cl?0:c.h0;}
function cityApplyItem(it){const off=it.st===1;for(const c of it.c)c.hgt=off?0:c.h0;}
function cityHex(br){let s='';for(let i=0;i<br.length;i+=4)s+=((br[i]|0)|(br[i+1]|0)<<1|(br[i+2]|0)<<2|(br[i+3]|0)<<3).toString(16);return s;}
function cityMark(d){d.v++;d.s=d.cl||d.nb?(d.cl?'x':'')+cityHex(d.br):'';}
// จุดที่โดน → แผ่นไหน: ด้านที่ใกล้สุด, คอลัมน์ตามตำแหน่งบนด้าน, ชั้นตามความสูง
function cityPanelAt(d,x,y,h){
  const B=d.B,L=d.L,e=[Math.abs(y-(B.y+B.d)),Math.abs(y-B.y),Math.abs(x-(B.x+B.w)),Math.abs(x-B.x)],fi=e.indexOf(Math.min(...e)),F=L.F[fi];
  const t=((x-(B.x+B.w/2))*Math.cos(F.a)-(y-(B.y+B.d/2))*Math.sin(F.a))/20,i=clamp(Math.floor(t/(CITY_PW*F.sx)+F.k/2),0,F.k-1),f=clamp(Math.floor(h/(CITY_FL*L.sy)),0,L.n-1);
  return F.s0+i*L.n+f;
}
function cityHitPanel(d,p,dmg,el,ox,oy){
  if(!d.L||d.cl||d.br[p])return;
  el=el||'none';d.hp[p]-=dmg*(el.includes('blast')?1.5:el==='ice'?0.7:1);
  const P=d.L.P[p],h=Math.round((P.z0+P.z1)*5)/10;
  if(d.hp[p]>0){if(G.time-d.ht>0.12){d.ht=G.time;emit({k:'cb',e:'h',i:d.B.i,x:Math.round(P.x),y:Math.round(P.y),h,el});}return;}
  d.br[p]=1;d.nb++;cityMark(d);
  emit({k:'cb',e:'b',i:d.B.i,x:Math.round(P.x),y:Math.round(P.y),h,el,ox:Math.round(ox==null?P.x:ox),oy:Math.round(oy==null?P.y:oy)});
  let gb=0;for(let k=0;k<d.L.P.length;k++)if(d.L.P[k].f===0&&d.br[k])gb++;
  if(gb>=d.L.g*(d.B.hl?CDMG.hlFall:CDMG.fall)){d.cl=1;cityMark(d);cityApplyBox(d);emit({k:'cb',e:'c',i:d.B.i,x:Math.round(d.B.x+d.B.w/2),y:Math.round(d.B.y+d.B.d/2),h:d.B.h});}
}
function cityHitItem(it,dmg,by){
  if(!it||!it.hp||it.st!==0)return;
  it.hp-=dmg;if(it.hp>0)return;
  const q=it.q;
  if(CDMG.veh.has(q.m)){it.st=2;it.t=CDMG.burn;it.by=by;emit({k:'cs',e:'f',i:it.i,x:q.x,y:q.y});}
  else{it.st=1;emit({k:'cs',e:'b',i:it.i,x:q.x,y:q.y});}
  it.v++;cityApplyItem(it);
}
// กระสุนชนวงกลมที่ชนของเมือง (เรียกจาก updateProjectiles)
function cityHitObs(c,pr){
  if(!BLDON||!cityOn())return;
  if(c.cb!==undefined){const d=CITYD.b[c.cb];if(d&&d.L)cityHitPanel(d,cityPanelAt(d,pr.x,pr.y,pr.h),pr.dmg||5,projEl(pr),pr.x-pr.vx*0.08,pr.y-pr.vy*0.08);}
  else if(c.ci!==undefined)cityHitItem(CITYD.it[c.ci],pr.dmg||5,pr.owner);
}
const _sgCD=[];
// วงระเบิด (เรียกจาก damageEnv): แผ่นตึกในรัศมี 3 มิติ (ขอบวงเหลือ 30%) + ของในเมือง
function cityDamageIn(x,y,rad,dmg,el,h,by){
  if(!BLDON||!cityOn())return;h=h||0;const R=rad/20;
  for(const B of sgNear(sgGrid('r',MAPS.city.boxes,b=>[b.x,b.y,b.x+b.w,b.y+b.d]),x,y,rad,_sgCD)){const d=CITYD.b[B.i];if(!d.L||d.cl)continue;
    for(let p=0;p<d.L.P.length;p++){if(d.br[p])continue;const P=d.L.P[p],dv=Math.max(0,P.z0-h,h-P.z1),dd=Math.hypot(Math.hypot(P.x-x,P.y-y)/20,dv);
      if(dd<R)cityHitPanel(d,p,dmg*(1-0.7*dd/R),el,x,y);if(d.cl)break;}}
  for(const it of CITYD.it){if(it.st!==0||!it.hp)continue;const dd=Math.hypot(it.q.x-x,it.q.y-y);if(dd<rad+20)cityHitItem(it,dmg*(1-0.7*Math.min(1,dd/rad)),by);}
}
// ทุกเฟรม (โฮสต์): รถที่ไฟลุกครบเวลา → ระเบิด
function cityTick(dt){
  if(!BLDON||!cityOn())return;
  for(const it of CITYD.it){if(it.st!==2)continue;it.t-=dt;if(it.t>0)continue;
    it.st=3;it.v++;const q=it.q,B=CDMG.boom;
    emit({k:'boom',x:q.x,y:q.y,h:1});
    for(const t of plist())if(t.alive&&!t.downed&&Math.hypot(t.x-q.x,t.y-q.y)<B.r+PR)damage(t,B.dmg,it.by!=null&&G.players[it.by]?it.by:null,'aoe');
    for(const e of G.en)if(!e.dead&&Math.hypot(e.x-q.x,e.y-q.y)<B.r+(e.r||PR))damage(e,B.dmg,null,'aoe');
    damageEnv(q.x,q.y,B.r,B.env,it.by,'fireblast',1);}
}
// กองซากตึกที่ถล่ม = พื้นสูงขึ้น (เหมือนเนินซากบ้าน) — รวมใน bldMoundH
const _sgCM=[];
function cityMoundH(x,y){
  if(!cityOn())return 0;let g=0;const pd=CDMG.pad;
  for(const B of sgNear(sgGrid('r',MAPS.city.boxes,b=>[b.x,b.y,b.x+b.w,b.y+b.d]),x,y,pd,_sgCM)){if(!B.cl)continue;
    const ex=Math.max(B.x-x,0,x-(B.x+B.w)),ey=Math.max(B.y-y,0,y-(B.y+B.d)),e=Math.hypot(ex,ey);if(e>=pd)continue;
    const v=CDMG.mound*(1-e/pd);if(v>g)g=v;}
  return g;
}
function citySnapB(){if(!cityOn())return '';let any=false;const s=CITYD.b.map(d=>{if(d.s)any=true;return d.s;});return any?s.join('|'):'';}
function citySnapS(){if(!cityOn())return '';let any=false;const s=CITYD.it.map(it=>{if(it.st)any=true;return it.st;});return any?s.join(''):'';}
// ลูกข่าย: อ่านสถานะจาก snapshot (เหมือน bldParse)
function cityParse(cb,cs){
  if(!CITYD||MAPID!=='city')return;
  const H=(cb||'').split('|');
  CITYD.b.forEach((d,i)=>{const t=H[i]||'';if(t===d.s||!d.L)return;d.s=t;d.cl=t[0]==='x'?1:0;const hx=d.cl?t.slice(1):t;d.nb=0;
    for(let p=0;p<d.br.length;p++){const v=parseInt(hx[p>>2]||'0',16);d.br[p]=(v>>(p&3))&1;d.nb+=d.br[p];}
    d.v++;cityApplyBox(d);});
  cs=cs||'';
  for(const it of CITYD.it){const st=+(cs[it.i]||0);if(st!==it.st){it.st=st;it.v++;cityApplyItem(it);}}
}
