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
  for(const d of CITYD.b){d.I=d.L&&!CIN.skip.has(d.B.m)?cityInterior(d.B,d.L):null;d.B.top=d.I?d.I.top:0;d.mo=[];
    const ns=d.I?d.I.sec.length:0;d.sb=new Uint8Array(ns);d.shp=new Float32Array(ns).fill(d.L?CDMG.hp[d.B.m]*(d.B.hl?CDMG.hl:1)*CIN.secHp:0);d.ns=0;}
  for(const o of M.obs){
    if(o.k==='cwall'){if(o.h0===undefined)o.h0=o.hgt;o.hgt=o.h0;const d=CITYD.b[o.cb];o.bot=d.I?d.I.top:undefined;d.circ.push(o);}   // ตึกกลวง: วงชนรอบขอบเหลือเฉพาะส่วนทึบด้านบน (bot)
    else if(o.ci!==undefined){if(o.h0===undefined)o.h0=o.hgt;o.hgt=o.h0;CITYD.it[o.ci].c.push(o);}
  }
}
MAPS.city.reset=cityReset;
// ที่ชน/ความทึบตามสถานะ (ทั้งโฮสต์และลูกข่าย — ลูกข่ายใช้ทำนายการเดินของตัวเอง)
function cityApplyBox(d){d.B.cl=d.cl;for(const c of d.circ)c.hgt=d.cl?0:c.h0;}
function cityApplyItem(it){const off=it.st===1;for(const c of it.c)c.hgt=off?0:c.h0;}
function cityHex(br){let s='';for(let i=0;i<br.length;i+=4)s+=((br[i]|0)|(br[i+1]|0)<<1|(br[i+2]|0)<<2|(br[i+3]|0)<<3).toString(16);return s;}
function cityMark(d){d.v++;d.s=d.cl||d.nb||d.ns?(d.cl?'x':'')+cityHex(d.br)+(d.ns?':'+cityHex(d.sb):''):'';cityMounds(d);}   // ':' + ขอบพื้น/หลังคาที่พัง (ตึก 2–4 ชั้น)
// จุดที่โดน → แผ่นไหน: ด้านที่ใกล้สุด, คอลัมน์ตามตำแหน่งบนด้าน, ชั้นตามความสูง
function cityPanelAt(d,x,y,h){
  const B=d.B,L=d.L,e=[Math.abs(y-(B.y+B.d)),Math.abs(y-B.y),Math.abs(x-(B.x+B.w)),Math.abs(x-B.x)],fi=e.indexOf(Math.min(...e)),F=L.F[fi];
  const t=((x-(B.x+B.w/2))*Math.cos(F.a)-(y-(B.y+B.d/2))*Math.sin(F.a))/20,i=clamp(Math.floor(t/(CITY_PW*F.sx)+F.k/2),0,F.k-1),f=clamp(Math.floor(h/(CITY_FL*L.sy)),0,L.n-1);
  return F.s0+i*L.n+f;
}
function cityHitPanel(d,p,dmg,el,ox,oy){
  if(!d.L||d.cl||d.br[p]||(d.I&&d.I.door.has(p)))return;   // ช่องประตูเปิดอยู่แล้ว พังไม่ได้
  el=el||'none';d.hp[p]-=dmg*(el.includes('blast')?1.5:el==='ice'?0.7:1);
  const P=d.L.P[p],h=Math.round((P.z0+P.z1)*5)/10;
  if(d.hp[p]>0){if(G.time-d.ht>0.12){d.ht=G.time;emit({k:'cb',e:'h',i:d.B.i,x:Math.round(P.x),y:Math.round(P.y),h,el});}return;}
  d.br[p]=1;d.nb++;cityMark(d);
  emit({k:'cb',e:'b',i:d.B.i,x:Math.round(P.x),y:Math.round(P.y),h,el,ox:Math.round(ox==null?P.x:ox),oy:Math.round(oy==null?P.y:oy)});
  // ผู้ใช้ 2026-10-29: ตึก 1 ชั้น (เหมือนบ้าน) ถล่มได้ทั้งหลัง — แผ่นชั้นล่างแตก ≥ CDMG.fall • ตึก 2 ชั้นขึ้นไปไม่ถล่ม (ผนัง/ขอบพื้นพังเป็นช่อง + เนินเศษ)
  if(d.L.n===1){let gb=0;for(let k=0;k<d.L.P.length;k++)if(d.br[k])gb++;
    if(gb>=d.L.g*(d.B.hl?CDMG.hlFall:CDMG.fall)){d.cl=1;cityMark(d);cityApplyBox(d);emit({k:'cb',e:'c',i:d.B.i,x:Math.round(d.B.x+d.B.w/2),y:Math.round(d.B.y+d.B.d/2),h:d.B.h});}}
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
    for(let p=0;p<d.L.P.length;p++){if(d.br[p]||(d.I&&d.I.door.has(p)))continue;const P=d.L.P[p],dv=Math.max(0,P.z0-h,h-P.z1),dd=Math.hypot(Math.hypot(P.x-x,P.y-y)/20,dv);
      if(dd<R)cityHitPanel(d,p,dmg*(1-0.7*dd/R),el,x,y);if(d.cl)break;}
    if(d.I&&!d.cl)d.I.sec.forEach((Q,j)=>{if(d.sb[j])return;const S=d.I.slabs[Q.k],dd=Math.hypot(Math.hypot(Q.cx-x,Q.cy-y)/20,S.z-h);if(dd<R)citySecHit(d,j,dmg*(1-0.7*dd/R),el);});}
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
// เนินเศษที่โคนผนังตึกตรงแผ่นที่แตก (d.mo จาก cityMounds) = พื้นสูงขึ้น (เดินปีนได้) — รวมใน bldMoundH
const _sgCM=[];
function cityMoundH(x,y){
  if(!cityOn())return 0;let g=0;
  for(const B of sgNear(sgGrid('r',MAPS.city.boxes,b=>[b.x,b.y,b.x+b.w,b.y+b.d]),x,y,CDMG.pad+60,_sgCM)){const d=CITYD.b[B.i];
    if(B.cl){const ex=Math.max(B.x-x,0,x-(B.x+B.w)),ey=Math.max(B.y-y,0,y-(B.y+B.d)),e=Math.hypot(ex,ey);if(e<CDMG.pad){const v=CDMG.mound*(1-e/CDMG.pad);if(v>g)g=v;}continue;}   // ตึก 1 ชั้นถล่ม = กองซากทั้งหลัง
    for(const m of d.mo){const e=((x-m.x)/m.rx)**2+((y-m.y)/m.ry)**2;if(e<1){const v=m.h*Math.min(1,1.6*(1-e));if(v>g)g=v;}}}
  return g;
}
// เนินต่อคอลัมน์ผนัง (ด้าน+ลำดับแผ่น): แตกกี่ชั้น เนินสูงเท่านั้น (0.45 + 0.28/ชั้น สูงสุด 1.7 ม.) • นอกตึก + ในตึก (ตึกกลวง แผ่นชั้นล่างแตก) — โฮสต์/ลูกข่ายคิดเหมือนกัน
function cityMounds(d){d.mo=[];if(!d.L||!d.nb)return;const L=d.L;
  L.F.forEach((F,fi)=>{const pw=CITY_PW*F.sx*20,hz=fi<2;
    for(let i=0;i<F.k;i++){let n=0;for(let f=0;f<L.n;f++)if(d.br[F.s0+i*L.n+f])n++;if(!n)continue;
      const P=L.P[F.s0+i*L.n],h=Math.min(1.7,0.45+0.28*n),ox=fi===2?1:fi===3?-1:0,oy=fi===0?1:fi===1?-1:0;
      d.mo.push({x:P.x+ox*26,y:P.y+oy*26,rx:hz?pw*0.6:34+n*6,ry:hz?34+n*6:pw*0.6,h});
      if(d.I&&d.br[F.s0+i*L.n])d.mo.push({x:P.x-ox*34,y:P.y-oy*34,rx:hz?pw*0.45:26,ry:hz?26:pw*0.45,h:h*0.6});}});}
// ---------- ข้างในตึก (2026-10-28 ผู้ใช้: เดินเข้าได้ 1–3 ชั้น มีทางขึ้น • ผนังนอกพังอย่างเดียว ตึกไม่ถล่ม) ----------
// I = {nf ชั้นที่เข้าได้, fh สูง/ชั้น (ม.), top (ม.: ต่ำกว่านี้กลวง เหนือนี้ทึบ), x0..y1 ขอบในผนัง (px), door: Set(แผ่นประตู),
//      slabs:[{z, hole:[x0,y0,x1,y1]}] พื้นชั้นบน (รูตรงทางลาด), ramps:[{x0,y0,x1,y1, ax:'x'|'y', dir ±1, z0,z1}] ทางลาดชั้นละอัน สลับฟันปลาเลียบผนังหลัง}
// ประตู = แผ่นกลางชั้นล่างด้านหน้า (L.front) • ใช้ทั้งโฮสต์ (ชน/พื้น/กระสุน) และภาพ (js/28 cityInteriorView) — ผลเหมือนกันทุกเครื่อง
const CIN={ringN:4,band:60,secHp:1.4,nf:3,wt:12,slab:0.3,sw:50,rl:130,pad:24,door:30,dh:2.8,skip:new Set(['garage'])};   // wt = ผนังหนา px • sw/rl = กว้าง/ยาวทางลาด px • door = ครึ่งกว้างช่องประตู px, dh = สูง ม.
function cityInterior(B,L){
  const fh=CITY_FL*L.sy,wt=CIN.wt,x0=B.x+wt,y0=B.y+wt,x1=B.x+B.w-wt,y1=B.y+B.d-wt;
  const back=L.front^1,ax=back<2?'x':'y',len=ax==='x'?x1-x0:y1-y0,inner=ax==='x'?y1-y0:x1-x0;
  let nf=L.n<=CIN.ringN?L.n:Math.min(CIN.nf,L.n);if(nf>1&&(len<CIN.rl+CIN.pad+90||inner<2*CIN.sw+110))nf=1;   // 2–4 ชั้น = เข้าได้ทุกชั้น
  const I={nf,fh,top:nf>=L.n?B.h:nf*fh,x0,y0,x1,y1,door:new Set(),slabs:[],ramps:[],sec:[],secAt:new Map(),ring:L.n>1&&L.n<=CIN.ringN&&nf===L.n};
  const F=L.F[L.front];I.door.add(F.s0+Math.floor(F.k/2)*L.n);
  const vb=back===0?y1:back===1?y0:back===2?x1:x0,vs=back===0||back===2?-1:1,s0=(ax==='x'?x0:y0)+CIN.pad,s1=s0+CIN.rl;
  for(let f=0;f<nf-1;f++){const a=vb+vs*(f%2)*CIN.sw,b=a+vs*CIN.sw,v0=Math.min(a,b),v1=Math.max(a,b);
    I.ramps.push(ax==='x'?{x0:s0,x1:s1,y0:v0,y1:v1,ax,dir:f%2?-1:1,z0:f*fh,z1:(f+1)*fh}:{x0:v0,x1:v1,y0:s0,y1:s1,ax,dir:f%2?-1:1,z0:f*fh,z1:(f+1)*fh});}
  for(let f=1;f<nf;f++){const r=I.ramps[f-1];I.slabs.push({z:f*fh,hole:[r.x0,r.y0,r.x1,r.y1]});}
  // ตึก 2–4 ชั้น (ผู้ใช้ 2026-10-29): หลังคา = แผ่นพื้นแผ่นบนสุด • ขอบนอกของทุกแผ่น (กว้าง CIN.band) แบ่งช่องตามแผ่นผนังด้านนั้น = พังได้ทีละช่อง • ตรงกลาง (core) พังไม่ได้
  if(I.ring){I.slabs.push({z:B.h,hole:null,roof:1});const bd=CIN.band;
    I.slabs.forEach((S,k)=>{S.secs=[];L.F.forEach((F,fi)=>{const pw=CITY_PW*F.sx*20;
      for(let i=0;i<F.k;i++){const P=L.P[F.s0+i*L.n];let r;
        if(fi<2)r=[Math.max(x0,P.x-pw/2),fi===0?y1-bd:y0,Math.min(x1,P.x+pw/2),fi===0?y1:y0+bd];
        else r=[fi===2?x1-bd:x0,Math.max(y0+bd,P.y-pw/2),fi===2?x1:x0+bd,Math.min(y1-bd,P.y+pw/2)];
        if(r[2]-r[0]<4||r[3]-r[1]<4)continue;I.secAt.set((k*4+fi)*1000+i,I.sec.length);S.secs.push(I.sec.length);I.sec.push({k,fi,i,r,cx:(r[0]+r[2])/2,cy:(r[1]+r[3])/2});}});});}
  return I;
}
// แผ่นพื้น S ตรงจุดนี้ยังอยู่ไหม (ไม่ใช่รูทางลาด และช่องขอบตรงนั้นยังไม่พัง)
function cinSlabOn(d,S,x,y){if(cinHole(S.hole,x,y))return false;if(S.secs)for(const j of S.secs){if(!d.sb[j])continue;const r=d.I.sec[j].r;if(x>r[0]&&x<r[2]&&y>r[1]&&y<r[3])return false;}return true;}
// แผ่นผนัง p แตก + ขอบพื้น/หลังคาเหนือแผ่นนั้นพังด้วย = ช่องโล่งทั้งช่อง (ไม่เหลือขอบอิฐ — js/28 cityPools)
function cinOpenPanel(d,p){const I=d.I;if(!I||!I.ring||!d.br[p])return false;const P=d.L.P[p],j=I.secAt.get((P.f*4+P.fi)*1000+P.i);return j!==undefined&&!!d.sb[j];}
function cinSecAt(d,S,x,y){if(S.secs)for(const j of S.secs){const r=d.I.sec[j].r;if(x>r[0]&&x<r[2]&&y>r[1]&&y<r[3])return j;}return -1;}
// ช่องขอบพื้น/หลังคาโดนดาเมจ (เลือดเท่าแผ่นผนัง × CIN.secHp) → พัง = เป็นช่องโล่ง (ตก/ยิงลอดได้) + เหตุการณ์ cb:s (เศษ/ฝุ่น js/28)
function citySecHit(d,j,dmg,el){if(!d.I||d.cl||d.sb[j])return;el=el||'none';d.shp[j]-=dmg*(el.includes('blast')?1.5:el==='ice'?0.7:1);if(d.shp[j]>0)return;
  d.sb[j]=1;d.ns++;cityMark(d);const Q=d.I.sec[j],S=d.I.slabs[Q.k];emit({k:'cb',e:'s',i:d.B.i,j,x:Math.round(Q.cx),y:Math.round(Q.cy),h:Math.round(S.z*10)/10,el});}
const cinIn=(I,x,y,m)=>x>I.x0-m&&x<I.x1+m&&y>I.y0-m&&y<I.y1+m;
const cinHole=(H,x,y)=>H&&x>H[0]&&x<H[2]&&y>H[1]&&y<H[3];
function cinRampH(R,x,y){if(x<R.x0||x>R.x1||y<R.y0||y>R.y1)return -1;const s=R.ax==='x'?x:y,a=R.ax==='x'?R.x0:R.y0,b=R.ax==='x'?R.x1:R.y1,t=R.dir>0?(s-a)/(b-a):(b-s)/(b-a);return R.z0+t*(R.z1-R.z0);}
const _sgCI=[];
const cityBoxGrid=()=>sgGrid('r',MAPS.city.boxes,b=>[b.x,b.y,b.x+b.w,b.y+b.d]);
function cityRoomAt(x,y,m){if(!cityOn())return null;for(const B of sgNear(cityBoxGrid(),x,y,m||0,_sgCI)){const d=CITYD.b[B.i];if(d.I&&!d.cl&&cinIn(d.I,x,y,m||0))return d;}return null;}
// พื้นในตึก (ชั้นบน + ทางลาด) ที่เท้าก้าวขึ้นถึง (ต่ำกว่า z + TSTEP) — ใน groundH
function cityFloorH(x,y,z){const d=cityRoomAt(x,y,0);if(!d)return 0;const I=d.I,a=(z||0)+TSTEP;let g=0;
  for(const S of I.slabs)if(S.z<=a&&S.z>g&&cinSlabOn(d,S,x,y))g=S.z;
  for(const R of I.ramps){const h=cinRampH(R,x,y);if(h>=0&&h<=a&&h>g)g=h;}
  return g;}
// เพดานเหนือเท้าที่ z (ใต้แผ่นพื้นชั้นถัดไป / ใต้ส่วนทึบด้านบน) • Infinity = ไม่อยู่ในตึก
function cityCeilH(x,y,z){const d=cityRoomAt(x,y,0);if(!d)return Infinity;const I=d.I;let c=I.ring?Infinity:I.top-CIN.slab;
  for(const S of I.slabs){const b=S.z-CIN.slab;if(b>z+0.2&&b<c&&cinSlabOn(d,S,x,y))c=b;}
  return c;}
// แผ่นผนังนอกแผ่น p เป็นสี่เหลี่ยม [cx,cy,hx,hy] (px) ตามช่วง u0..u1 ตามแนวผนัง (0 = กลางแผ่น)
function cinWallRect(d,fi,p,u0,u1){const B=d.B,P=d.L.P[p],wt=CIN.wt,c=(u0+u1)/2,hl=(u1-u0)/2;
  return fi<2?[P.x+c,fi===0?B.y+B.d-wt/2:B.y+wt/2,hl,wt/2]:[fi===2?B.x+B.w-wt/2:B.x+wt/2,P.y+c,wt/2,hl];}
// ชนผนังนอกทีละแผ่นทีละชั้น (ช่วงตัว z..z+1.9) — แผ่นแตก = ช่อง • ประตู = เหลือวงกบสองข้าง • ใช้ใน collideWorld
function cityCollideIn(o,r,z){if(!cityOn())return 0;let n=0;
  for(const B of sgNear(cityBoxGrid(),o.x,o.y,r,_sgCI)){const d=CITYD.b[B.i],I=d.I;if(!I||d.cl||z>=I.top)continue;
    const L=d.L,fA=Math.max(0,Math.floor(z/I.fh)),fB=Math.min(I.nf-1,Math.floor((z+1.9)/I.fh));
    for(let fi=0;fi<4;fi++){const F=L.F[fi],pw=CITY_PW*F.sx*20;
      for(let i=0;i<F.k;i++)for(let f=fA;f<=fB;f++){const p=F.s0+i*L.n+f;if(d.br[p])continue;
        const segs=I.door.has(p)&&z<CIN.dh-1.6?[[-pw/2,-CIN.door],[CIN.door,pw/2]]:[[-pw/2,pw/2]];
        for(const [u0,u1] of segs){const q=bldPush(o.x,o.y,cinWallRect(d,fi,p,u0,u1),r);if(q){o.x=q[0];o.y=q[1];n++;}}}}}
  return n;}
// กระสุนในตึกกลวง: ข้ามขอบตึก (ผนังนอก) → ชนแผ่นนั้น (ยังไม่แตก/ไม่ใช่ช่องประตู) • ชนพื้นชั้นบน/ทางลาด/เพดาน • คืน true = กระสุนหยุด
function cityProjIn(pr,dt){if(!cityOn())return false;const x0=pr.x-pr.vx*dt,y0=pr.y-pr.vy*dt,h0=pr.h-pr.vh*dt;
  for(const B of sgNear(cityBoxGrid(),pr.x,pr.y,Math.hypot(pr.x-x0,pr.y-y0)+pr.r,_sgCI)){const d=CITYD.b[B.i],I=d.I;if(!I||d.cl)continue;
    const inB=(x,y)=>x>B.x&&x<B.x+B.w&&y>B.y&&y<B.y+B.d,a=inB(x0,y0),b=inB(pr.x,pr.y);
    if(a!==b){let t=1;for(const [e,k] of [[B.x,'x'],[B.x+B.w,'x'],[B.y,'y'],[B.y+B.d,'y']]){const p0=k==='x'?x0:y0,p1=k==='x'?pr.x:pr.y;if((p0-e)*(p1-e)<0){const tt=(e-p0)/(p1-p0);if(tt<t)t=tt;}}
      const qx=x0+(pr.x-x0)*t,qy=y0+(pr.y-y0)*t,qh=h0+(pr.h-h0)*t;if(qh>=B.h)continue;
      const p=cityPanelAt(d,qx,qy,qh);
      if(qh<I.top){if(d.br[p])continue;
        if(I.door.has(p)){const P=d.L.P[p];if(qh<CIN.dh&&Math.abs(qx-P.x)+Math.abs(qy-P.y)<CIN.door)continue;pr.x=qx;pr.y=qy;pr.h=qh;return true;}}
      pr.x=qx;pr.y=qy;pr.h=qh;cityHitPanel(d,p,pr.dmg||5,projEl(pr),x0,y0);return true;}
    if(b&&cinIn(I,pr.x,pr.y,0)){if(!I.ring&&pr.h>=I.top-CIN.slab)return true;
      for(const S of I.slabs)if(pr.h<S.z&&pr.h>S.z-CIN.slab-0.2&&cinSlabOn(d,S,pr.x,pr.y)){const j=cinSecAt(d,S,pr.x,pr.y);if(j>=0)citySecHit(d,j,pr.dmg||5,projEl(pr));return true;}
      for(const R of I.ramps){const h=cinRampH(R,pr.x,pr.y);if(h>=0&&pr.h<h&&pr.h>h-0.6)return true;}}}
  return false;}
// จุด (x,y ที่สูง h จากพื้น) ทึบไหม — ใช้กับเล็ง/ท่าพุ่ง (ตึกกลวง: ผนังนอกที่ยังไม่แตก ยกเว้นช่องประตู + พื้นชั้นบน + ส่วนทึบด้านบน • กล่องทึบอื่น: ทั้งกล่อง)
const _sgCS=[];
function citySolidAt(x,y,h){if(!cityOn())return false;
  for(const B of sgNear(cityBoxGrid(),x,y,0,_sgCS)){if(x<=B.x||x>=B.x+B.w||y<=B.y||y>=B.y+B.d||h>=B.h||h<0)continue;const d=CITYD.b[B.i],I=d.I;
    if(!I)return !d.cl;if(d.cl)return false;if(!I.ring&&h>=I.top-CIN.slab)return true;
    if(!cinIn(I,x,y,0)){const p=cityPanelAt(d,x,y,h);if(d.br[p])return false;if(I.door.has(p)){const P=d.L.P[p];return !(h<CIN.dh&&Math.abs(x-P.x)+Math.abs(y-P.y)<CIN.door);}return true;}
    for(const S of I.slabs)if(h<S.z&&h>S.z-CIN.slab&&cinSlabOn(d,S,x,y))return true;
    return false;}
  return false;}
// เส้นตรง 3 มิติ (x0,y0,h0) → (x1,y1,h1) ชนตึกเมืองตรงไหน (ก้าวละ 8 px) • คืน {x,y,h,t} หรือ null
function cityRay(x0,y0,h0,x1,y1,h1){if(!cityOn())return null;const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)/8));
  for(let i=1;i<=n;i++){const t=i/n,x=x0+(x1-x0)*t,y=y0+(y1-y0)*t,h=h0+(h1-h0)*t;if(citySolidAt(x,y,h))return {x,y,h,t};}return null;}
// ห้องรอบตัว (ใช้กับกล้อง): ตึกกลวงชั้นที่เท้าอยู่ {x0,y0,x1,y1 px, z0 พื้น, z1 เพดาน (ม.)} หรือ null
function cityRoomBox(x,y,z){const d=cityRoomAt(x,y,0);if(!d||z>=d.I.top)return null;const I=d.I;return {x0:I.x0,y0:I.y0,x1:I.x1,y1:I.y1,z0:cityFloorH(x,y,z),z1:cityCeilH(x,y,z)};}
function citySnapB(){if(!cityOn())return '';let any=false;const s=CITYD.b.map(d=>{if(d.s)any=true;return d.s;});return any?s.join('|'):'';}
function citySnapS(){if(!cityOn())return '';let any=false;const s=CITYD.it.map(it=>{if(it.st)any=true;return it.st;});return any?s.join(''):'';}
// ลูกข่าย: อ่านสถานะจาก snapshot (เหมือน bldParse)
function cityParse(cb,cs){
  if(!CITYD||MAPID!=='city')return;
  const H=(cb||'').split('|');
  CITYD.b.forEach((d,i)=>{const t=H[i]||'';if(t===d.s||!d.L)return;d.s=t;d.cl=t[0]==='x'?1:0;const [hx,sx]=(d.cl?t.slice(1):t).split(':');d.nb=0;d.ns=0;
    for(let p=0;p<d.br.length;p++){const v=parseInt(hx[p>>2]||'0',16);d.br[p]=(v>>(p&3))&1;d.nb+=d.br[p];}
    for(let j=0;j<d.sb.length;j++){const v=parseInt((sx||'')[j>>2]||'0',16);d.sb[j]=(v>>(j&3))&1;d.ns+=d.sb[j];}
    d.v++;cityApplyBox(d);cityMounds(d);});
  cs=cs||'';
  for(const it of CITYD.it){const st=+(cs[it.i]||0);if(st!==it.st){it.st=st;it.v++;cityApplyItem(it);}}
}
