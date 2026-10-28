// =====================================================================
//  ระบบคาถาใหม่: สาย (path) × คาถา (spell) + สถานะ (status effects)
//  ผู้เล่นเลือก "สาย" 1 สาย → ได้เวทโบราณ (X) ของสายนั้น + จัดชุดคาถา Q/E/R/F (ใส่ได้เฉพาะคาถาของสายตัวเอง)
//  สตริงชุดคาถา "สาย.q.e.r.f" (ตัวเลข = index ใน SPELL_LIST ห้ามสลับลำดับ เพิ่มต่อท้ายเท่านั้น)
// =====================================================================
// ไอคอนคาถา: จาก game-icons.net (CC BY 3.0, เครดิตใน "คู่มือ" และ icons/CREDITS.md) ไฟล์อยู่ที่ icons/<id>.svg (Service Worker เก็บไว้เล่นออฟไลน์)
// เพิ่มไอคอนใหม่ = วางไฟล์ icons/<id>.svg (สีขาวล้วน) แล้วเพิ่ม id ใน ICONS • ICOALIAS = ใช้ไอคอนเดิมซ้ำ
const ICONS=new Set(['p_wind','b_wind','sh_wind','dsh_wind','aegisgale','windrift','vortexbind','voidspheres','featherwing','eyeofheaven','p_earth','b_earth','sh_earth','dsh_earth','cb_earth','tectoniccrush_sq','stonebreaker','mudswamp','tectoniccrush','dustburst','terraauger','wrath','b_frost','b_frost_m','b_hex','b_nature','b_pyro','b_storm','b_summon','blazeform','blinddust','bloom','colossus','cryoshell','darkness','dragonbreath','dsh_frost','dsh_pyro','dsh_storm','firesprite','frostaura','frostforge','glacierrend','godlightning','hexmark','ignitionsnap','kindle','legion','mirrorlegion','p_frost','p_hex','p_nature','p_pyro','p_storm','p_summon','permafrost','poisondart','railgun','ringofembers','sh_frost','sh_pyro','sh_storm','silencecurse','soulburst','soulsiphon','speedsiphon','spiritwolf','sporecloud','staticfield','stonegolem','stormorbs','terror','thornburst','thunderline','triplestrike','vinelash','wispheal','worldtree']);
const ICOALIAS={dragonfall:'dragonbreath',stormdome:'staticfield'};   // Dragonfall ใช้ไอคอนมังกรเดิม • ลูกสายฟ้าโดมใช้ไอคอนโดมสายฟ้า
const hasIco=id=>ICONS.has(ICOALIAS[id]||id);
// URL เต็ม: ค่านี้ไปอยู่ใน CSS var(--u) ซึ่งเบราว์เซอร์จะอ่าน url() เทียบกับไฟล์ css/game.css ถ้าเป็นที่อยู่แบบสั้น
const ICOBASE=new URL('icons/',location.href).href;
function icoURL(id){id=ICOALIAS[id]||id;return ICONS.has(id)?ICOBASE+id+'.svg':'';}
const ICO={};
function icoTint(id,col,size){
  let o=ICO[id];
  if(!o){o=ICO[id]={img:new Image(),ready:false,t:{}};o.img.onload=()=>{o.ready=true;};o.img.src=icoURL(id);}
  if(!o.ready)return null;
  const k=col+size;if(o.t[k])return o.t[k];
  const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');
  g.drawImage(o.img,0,0,size,size);g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,size,size);
  return o.t[k]=c;
}
function icoHTML(id,col,sz){return `<span class="ico" style="--u:url('${icoURL(id)}');--c:${col};width:${sz}px;height:${sz}px"></span>`;}
const PATHS=[
  {id:'pyro',n:'สายไฟ',ic:'🔥',col:'#ff6a2a',d:'สะสม Burning (สูงสุด 5 ชั้น) แล้วดีดนิ้วระเบิด — ไม่ว่องไว เน้นระเบิดดาเมจ',combo:'ประกายไฟ/ลูกไฟ/Kindle/Dragon\'s Breath/Ring of Embers/โล่ ใส่ Burning (เผา 0.5/วิ/ชั้น) → Ignition Snap ระเบิดทุกคนที่ติดไฟ ชั้นละ 15 • Blazeform +30% ทุกดาเมจ'},
  {id:'frost',n:'สายน้ำแข็ง',ic:'❄️',col:'#8fe0ff',d:'นักดาบน้ำแข็ง สลับประชิด/ไกลด้วย V — ดาเมจหลักจากดาบ ไกลไว้ติดสลอว์ เน้นคลุกวงใน ทนทาน ดาเมจต่อเนื่อง',combo:'ยิงปกติสะสมสลอว์ (สูงสุด 30%) → Permafrost/Frostbite Aura ซ้อนสลอว์ได้ถึง 80% → ฟันคอมโบจังหวะ 3 ฮีลตัวเอง • Frostforge อัปเกรดอาวุธ • Glacier Rend สร้างทางน้ำแข็ง/ภูเขาน้ำแข็งแล้วกระโดดฟาดลงมา'},
  {id:'storm',n:'สายสายฟ้า',ic:'⚡',col:'#ffe27a',d:'นักสู้ว่องไวแบบ Tracer — ลำสายฟ้าระยะประชิด Dash 3 ชาร์จทะลุศัตรู เก็บ Lightning stack (สูงสุด 5) ไปจ่ายสกิล',combo:'Dash ทะลุศัตรู / เส้นสายฟ้า / ระเบิดโล่ = +1 stack (และยิงครั้งถัดไปเป็นสายฟ้าสามเหลี่ยม) → ใช้ stack ร่ายสกิล: ดูดความเร็ว/ออร์บ 1 • ฟาดสามครั้ง/Railgun 2 • ลูกสายฟ้าโดม 3 • Shock = โคลงสั้นๆ ใช้ Dash ไม่ได้'},
  // off:1 = ซ่อนไว้ก่อน (ผู้ใช้ 2026-10-21 "remove nature curse and summon for now") — โค้ดยังอยู่ เอากลับได้โดยลบ off:1
  {id:'nature',off:1,n:'สายธรรมชาติ',ic:'🌿',col:'#6fd57f',d:'วางพิษให้สะสม แล้วระเบิดหนาม — ทนทานและยื้อเกม',combo:'ลูกดอกพิษ/เมฆสปอร์สะสมพิษ 3 ชั้น • เถาวัลย์มัดคนมีพิษนานขึ้น (ลูกดอกใส่ 2 ชั้นทันที) → หนามระเบิดกินพิษเป็นดาเมจและฟื้นเลือดเรา'},
  {id:'hex',off:1,n:'สายคำสาป',ic:'🌑',col:'#b57dff',d:'ตีตราแล้วคำสาปแรงขึ้น — ควบคุมฝูงชนตัวจริง',combo:'ตรามรณะก่อน → ปิดปาก/มืดบอด/หวาดกลัวนานขึ้นกับคนมีตรา → ดูดวิญญาณกินตราเป็นดาเมจ + ฟื้นเลือดเรา'},
  {id:'summon',off:1,n:'สายอัญเชิญ',ic:'🔮',col:'#ff9ad5',d:'เรียกสัตว์เวทมาช่วยสู้ แล้วจุดระเบิดวิญญาณ',combo:'เรียกหมาป่า/สไปรท์/ยักษ์ → วิญญาณพิทักษ์เสริมพลังสัตว์ที่อยู่ใกล้ • ยิงปกติโดนเป้าไหน สัตว์เวทพุ่งใส่เป้านั้น → ระเบิดวิญญาณจุดสัตว์ทั้งหมดเป็นระเบิดและฟื้นเลือด'}
];
const SPELL_LIST=[],SPELLS={};
function defSpell(path,o){o.path=path;o.i=SPELL_LIST.length;SPELL_LIST.push(o);SPELLS[o.id]=o;return o;}
const SLOTK=['q','e','r','f'],BRMAP={q:'fire',e:'stun',r:'push',f:'pull'};
const KITP={};
function parseKit(str){
  if(KITP[str])return KITP[str];
  const a=String(str===undefined||str===null?'':str).split('.').map(Number);
  let path=Number.isInteger(a[0])&&a[0]>=0&&a[0]<PATHS.length?a[0]:0;
  if(!SPELL_LIST.some(x=>x.path===path&&!x.ult)||PATHS[path].off)path=0;
  const ids=[];let off=0;
  const main=SPELL_LIST.filter(x=>x.path===path&&!x.ult).map(x=>x.i);
  for(let k=1;k<=4;k++){
    const i=a[k],S=Number.isInteger(i)&&SPELL_LIST[i];
    if(S&&!S.ult&&!PATHS[S.path].off&&!ids.includes(i)&&S.path===path){if(S.path!==path)off++;ids.push(i);}else ids.push(null);
  }
  for(let k=0;k<4;k++)if(ids[k]===null){const c=main.find(i=>!ids.includes(i));ids[k]=c!==undefined?c:SPELL_LIST.find(x=>!x.ult&&!PATHS[x.path].off&&!ids.includes(x.i)).i;}
  const k={path,ids,ult:SPELL_LIST.find(x=>x.path===path&&x.ult).i};
  k.str=[path,...ids].join('.');
  return KITP[str]=k;
}
function cleanKit(s){return parseKit(parseKit(s).str).str;}
function setKit(p,str){const old=p.pathIdx;p.fmode=0;p.orbs=0;p.orbBlk=0;p.kit=cleanKit(str);const k=parseKit(p.kit);p.pathIdx=k.path;p.kitIds=k.ids.map(i=>SPELL_LIST[i].id);p.ultId=SPELL_LIST[k.ult].id;
  if(old!==undefined&&old!==p.pathIdx&&G&&G.ph!=='lobby')pathReset(p);}
// เปลี่ยนสายกลางเกม (เมนูทดลอง): ล้างท่าค้างของสายเก่า — ไม่งั้นค้างลอยฟ้า (Wrath) / เดินไม่ได้ (Railgun/Auger) / ร่างเทพค้าง
function pathReset(p){clearStatus(p);earthReset(p);windReset(p);Object.assign(p,{stS:null,stCd:0,god:0,xhp:0,sdome:null,rail:null,slnT:0,sorb:null,beam:0,sdHit:null,slam:false,slam3:null,chg:0,dash:0,dashSp:0,trail:null,fpath:null,shieldOn:false});}

// ---------- สถานะ (ใช้ได้ทั้งผู้เล่นและศัตรู) ----------
const isBig=t=>t.isE&&(t.type==='troll'||t.type==='queen'||(EDEF[t.type]&&EDEF[t.type].boss));
// ผลคูณระยะเวลา CC: บอส/ตัวใหญ่ทนทาน • ผู้เล่นโดน CC ซ้ำใน 6 วิ จะสั้นลง (diminishing returns)
function ccScale(t){if(t.isE){const D=EDEF[t.type];return D.boss?0.25:isBig(t)?0.4:1;}return [1,0.6,0.35,0.2][Math.min(3,t.ccN|0)];}
function ccTouch(t){if(!t.isE){t.ccN=(t.ccN|0)+1;t.ccT=6;}}
function addStun(t,d){d*=ccScale(t);if(d<0.05)return;t.stun=Math.max(t.stun||0,d);ccTouch(t);}
function addRoot(t,d){d*=ccScale(t);if(d<0.05||t.rootImm>0)return;t.root=Math.max(t.root||0,d);t.rootImm=d+2;ccTouch(t);}
function addFreeze(t,d){
  if(t.frzImm>0)return;d*=ccScale(t);if(d<0.1)return;
  t.frz=Math.max(t.frz||0,d);t.stun=Math.max(t.stun||0,d);t.chl=0;t.frzImm=d+3;ccTouch(t);
  emit({k:'efx',z:'freeze',x:t.x,y:t.y,h:cH(t)});
}
function addSlow(t,f,d){f=Math.max(f,isBig(t)?0.7:0.3);if(!(t.slowT>0)||f<t.slowF)t.slowF=f;t.slowT=Math.max(t.slowT||0,d);}
function addChill(t,n){
  if(t.frz>0||t.chlImm>0)return;
  t.chl=(t.chl|0)+n;t.chlT=4;
  if(t.chl>=3){addFreeze(t,0.8);t.chl=0;t.chlImm=4;}
}
function ignite(t,src,time){
  if(t.chl>0||t.frz>0){ // ไฟ + เย็น = ละลาย: ดาเมจเพิ่ม ล้างความเย็น/น้ำแข็ง
    t.chl=0;t.chlT=0;if(t.frz>0){t.frz=0;t.stun=Math.min(t.stun||0,0.2);}
    emit({k:'efx',z:'melt',x:t.x,y:t.y,h:cH(t)});damage(t,6,src,'burn');
  }
  t.burn=Math.max(t.burn||0,time||2);if(!(t.bt>0))t.bt=0.5;t.burnSrc=src;
}
// Shock (สายฟ้า, ผู้เล่นออกแบบ): โคลง/กล้องสั่นเบา + ใช้ Dash ไม่ได้ สูงสุด 0.3 วิ • ติดอยู่แล้วไม่ต่อเวลา • ไม่เพิ่มดาเมจ
function shock(t,src,d){if(t.shk>0)return;t.shk=Math.min(0.3,d||0.3);t.shkSrc=src;}
function knock(t,x,y,f){const dx=t.x-x,dy=t.y-y,d=Math.hypot(dx,dy)||1;if(isBig(t))f*=0.25;t.vx+=dx/d*f;t.vy+=dy/d*f;}
function addWard(p,abs,time,thorns){p.ward={abs,t:time,thorns:!!thorns};}
// สลอว์สายน้ำแข็ง (เป็น %): ยิงปกติสะสมสูงสุด 30 (ทางน้ำแข็งนับรวมในนี้) • ก้อนน้ำแข็งใหญ่ 60 • วงน้ำแข็ง +20 • ออร่า +20 • อัลติ 80 • รวมทุกอย่างไม่เกิน 80
function addFrostSlow(t,n){t.fsl=Math.min(30,(t.fslT>0?(t.fsl|0):0)+n);t.fslT=3;}
function frostSlow(t){
  let b=Math.min(30,(t.fslT>0?(t.fsl|0):0)+(t.fslP>0?10:0));
  if(t.fslBigT>0)b=Math.max(b,60);
  let s=b+(t.fslR>0?20:0)+(t.fslA>0?20:0);
  if(t.fslUltT>0)s=80;
  return Math.min(80,s);
}
function moveMul(t){let m=1;const fs=frostSlow(t);if(fs>0)m*=1-fs/100;if(t.chl>0)m*=1-0.1*t.chl;if(t.slowT>0)m*=t.slowF;if(t.haste>0)m*=t.hasteF;if(t.blaze>0)m*=1.25;return Math.max(0.25,m);}
// Burning (สายไฟ): สูงสุด BRN_MAX ชั้น • เผา 0.3/วิ/ชั้น (แค่ดาเมจเสริม) • ไม่โดนเพิ่ม 6 วิ แล้วลดทีละ 1 ชั้นทุก 1 วิ (เนิร์ฟ 2026-10-27: เดิม 2/วิ, 10 วิ)
const BRN_MAX=6;
function addBurn(t,n,src){if(t.dead)return;const was=t.brn|0;t.brn=Math.min(BRN_MAX,was+n);t.brnT=6;t.brnSrc=src;if(!(t.brnTick>0))t.brnTick=0.5;if(t.brn>was)emit({k:'efx',z:'brn',x:t.x,y:t.y,h:cH(t)+0.8,n:t.brn});}
// Extreme Burning (อัลติสายไฟ): เผา 8/วิ นาน 5 วิ (รวม 40)
function addXBurn(t,src){t.xb=5;t.xbTick=0.5;t.xbSrc=src;}
function addPoison(t,src,n){t.psn=Math.min(3,(t.psn|0)+(n||1));t.psnT=4;t.psnSrc=src;if(!(t.psnTick>0))t.psnTick=0.8;}
function addSil(t,d){d*=ccScale(t);if(d<0.1)return;t.sil=Math.max(t.sil||0,d);ccTouch(t);}
function addFear(t,d,x,y){d*=ccScale(t);if(d<0.1)return;t.fear=Math.max(t.fear||0,d);t.fearX=x;t.fearY=y;ccTouch(t);}
function addBlind(t,d){d*=ccScale(t);if(d<0.1)return;t.bld=Math.max(t.bld||0,d);ccTouch(t);}
function addMark(t,d){t.mrk=Math.max(t.mrk||0,d);}
// รักษาเลือด: พิษและตรามรณะลดผลการรักษา
function healT(t,amt){
  amt*=Math.max(0,1-0.15*(t.psn|0))*(t.mrk>0?0.5:1);
  if(amt<0.5||t.hp>=t.maxHp)return;
  const a=Math.min(amt,t.maxHp-t.hp);t.hp+=a;emit({k:'heal',x:t.x,y:t.y,h:(t.z||0)+2.2,n:Math.round(a),id:t.id});
}
function tickStatus(t,dt){
  if(t.brn>0){t.brnTick-=dt;if(t.brnTick<=0){t.brnTick=0.5;damage(t,0.15*t.brn,t.brnSrc,'burn');}t.brnT-=dt;if(t.brnT<=0&&t.brn>0){t.brn--;t.brnT=1;}}
  if(t.xb>0){t.xb-=dt;t.xbTick-=dt;if(t.xbTick<=0){t.xbTick=0.5;damage(t,4,t.xbSrc,'burn');}}
  if(t.blaze>0)t.blaze-=dt;
  if(t.kindleT>0){t.kindleT-=dt;if(t.kindleT<=0)t.kindle=0;}
  if(t.fslT>0){t.fslT-=dt;if(t.fslT<=0)t.fsl=0;}
  for(const k of ['fslBigT','fslR','fslA','fslP','fslUltT','slip','ripT','ffT'])if(t[k]>0)t[k]-=dt;
  if(t.heatT>0){t.heatT-=dt;if(t.heatT<=0)t.heat=0;}
  if(t.wallCd>0)t.wallCd-=dt;if(t.flare>0)t.flare-=dt;if(t.frostA>0)t.frostA-=dt;
  if(t.psnT>0){t.psnT-=dt;t.psnTick-=dt;if(t.psnTick<=0){t.psnTick=0.8;damage(t,2*(t.psn|0),t.psnSrc,'burn');}if(t.psnT<=0)t.psn=0;}
  if(t.fear>0)t.fear-=dt;if(t.bld>0)t.bld-=dt;if(t.mrk>0)t.mrk-=dt;if(t.drCd>0)t.drCd-=dt;
  if(t.dr){t.dr.t-=dt;if(t.dr.t<=0)t.dr=null;}
  if(t.slowT>0)t.slowT-=dt;if(t.shk>0)t.shk-=dt;if(t.frz>0)t.frz-=dt;if(t.sil>0)t.sil-=dt;
  if(t.chlT>0){t.chlT-=dt;if(t.chlT<=0)t.chl=0;}
  if(t.frzImm>0)t.frzImm-=dt;if(t.chlImm>0)t.chlImm-=dt;if(t.rootImm>0)t.rootImm-=dt;
  if(t.ccT>0){t.ccT-=dt;if(t.ccT<=0)t.ccN=0;}
  if(t.haste>0)t.haste-=dt;if(t.ovc>0)t.ovc-=dt;
  if((t.isE||t.isM)&&t.root>0)t.root-=dt;
  if(t.ward){t.ward.t-=dt;if(t.ward.t<=0)t.ward=null;}
}
function clearStatus(t){for(const k of ['slowT','shk','frz','sil','chl','chlT','frzImm','chlImm','rootImm','ccT','ccN','haste','ovc','burn','psn','psnT','fear','bld','mrk','heat','heatT','flare','frostA','wallCd','brn','brnT','xb','blaze','kindle','kindleT','hover','fsl','fslT','fslBigT','fslR','fslA','fslP','fslUltT','slip','ripT','ffT','cryo','auraT','mirror','xhp','slideT','grT','breath','dfall','snapT','colos','dchg','mudT','sbk'])t[k]=0;t.dchgOn=false;t.ward=null;t.dr=null;}
function fxMask(t){return (t.stun>0?1:0)|(t.burn>0?2:0)|((t.chl>0||t.slowT>0||frostSlow(t)>0)?4:0)|(t.frz>0?8:0)|(t.shk>0?16:0)|(t.root>0?32:0)|(t.sil>0?64:0)|(t.ward?128:0)|(t.haste>0?256:0)|(t.ovc>0?512:0)|(t.psn>0?1024:0)|(t.fear>0?2048:0)|(t.bld>0?4096:0)|(t.mrk>0?8192:0)|(t.dr?16384:0)|((t.heat>0||t.brn>0)?32768:0)|((t.flare>0||t.kindle>0)?65536:0)|(t.blaze>0?131072:0)|(t.xb>0?262144:0)|(t.mudT>0?524288:0);}

// ---------- วัตถุในสนามที่คาถาสร้าง: โซน / ฟ้าผ่าหน่วงเวลา / กำแพง / ช่องร่ายต่อเนื่อง ----------
function foesIn(team,x,y,r,hMax){
  const out=[];
  for(const t of foesOf(team))if(Math.hypot(t.x-x,t.y-y)<r+(t.r||PR)&&((t.isE?(t.h||0):(t.z||0))<(hMax||4)))out.push(t);
  return out;
}
// ดาเมจวง: โล่/อมตะบล็อกทั้งดาเมจและสถานะ
// โล่บางสาย (เช่นโล่อัศวินน้ำแข็ง) กันได้เฉพาะด้านหน้า 120°
function shieldFaces(t,x,y){
  if(!t.shieldOn)return false;
  const B=PBASIC[t.pathIdx|0];
  if(B&&B.front&&x!=null)return Math.abs(angDiff(Math.atan2(y-t.y,x-t.x),t.ang))<=Math.PI/3;
  return true;
}
function aoeHit(p,t,dmg,fn){
  const blocked=!t.isE&&(shieldFaces(t,p.x,p.y)||t.inv>0);
  damage(t,dmg,p.id,'aoe');
  if(!blocked&&fn)fn(t);
  return !blocked;
}
function addZone(o){
  const z=Object.assign({id:++G.zid,tt:0.05,tick:0.5},o);z.max=z.t;G.zones.push(z);
  emit({k:'zn',id:z.id,x:z.x,y:z.y,r:z.r,t:z.t,z:z.kind});
  return z;
}
function updateZones(dt){
  for(const z of G.zones){
    z.t-=dt;z.tt-=dt;
    if(z.tt<=0&&z.t>0){
      z.tt=z.tick;
      if(z.hit)for(const t of foesIn(z.team,z.x,z.y,z.r,3.2)){if(!t.isE&&t.inv>0)continue;z.hit(t,z);}
      if(z.allyHit)for(const q of plist())if(q.team===z.team&&q.alive&&!q.downed&&Math.hypot(q.x-z.x,q.y-z.y)<z.r+PR)z.allyHit(q,z);
    }
  }
  G.zones=G.zones.filter(z=>z.t>0);
}
function addStrike(o){G.strikes.push(Object.assign({},o));emit({k:'tele',x:o.x,y:o.y,r:o.r,t:o.t,col:o.col});}
function updateStrikes(dt){for(const s of G.strikes){s.t-=dt;if(s.t<=0){s.done=1;s.fn(s);}}G.strikes=G.strikes.filter(s=>!s.done);}
function addWall(o){const w=Object.assign({id:++G.zid,hgt:7},o);G.walls.push(w);return w;}
function updateWalls(dt){
  for(const w of G.walls)if(w.hp<=0||(w.t-=dt)<=0){w.dead=1;emit({k:'efx',z:'wallbreak',x:w.x,y:w.y,r:w.r});}
  G.walls=G.walls.filter(w=>!w.dead);
}
function updateChan(dt){
  for(const c of G.chan){c.t-=dt;c.tt-=dt;const p=G.players[c.owner];if(!p||!p.alive||p.downed||(c.stun&&p.stun>0)){c.t=0;if(p&&c.stun)p.breath=0;continue;}if(c.tt<=0){c.tt=c.tick;c.fn(c,p);}}
  G.chan=G.chan.filter(c=>c.t>0);
}
function updateSpells(dt){updateStorm(dt);updateEarth(dt);updateWind(dt);updateZones(dt);updateFirePaths(dt);updateStrikes(dt);updateWalls(dt);updateChan(dt);updateERings(dt);updateIces(dt);updateWaves(dt);updateGlaciers(dt);updateBldg(dt);}
// จุดเล็งของคาถาวางพื้น: ถ้ามีศัตรูอยู่ในแนวเล็งให้วางที่ตัวมัน ไม่งั้นวางที่ระยะ 75% ของพิสัย
function aimPoint(p,range){
  // ผู้เล่นจริง: วางตรงจุดที่เป้ากลางจอชี้พื้น (ไม่เกินพิสัย)
  if(p.inp&&!p.bot&&p.inp.gx>=0&&typeof p.inp.ah==='number'){const dx=p.inp.gx-p.x,dy=p.inp.gy-p.y,d=Math.hypot(dx,dy)||1,k=Math.min(1,range/d);return aimWall(p,{x:clamp(p.x+dx*k,40,MW-40),y:clamp(p.y+dy*k,40,MH-40)});}
  let best=null,bs=1e9;
  for(const t of foesOf(p.team)){
    const dx=t.x-p.x,dy=t.y-p.y,dd=Math.hypot(dx,dy);if(dd>range||dd<1)continue;
    const da=Math.abs(angDiff(Math.atan2(dy,dx),p.ang));if(da<0.35&&da+dd/4000<bs){bs=da+dd/4000;best=t;}
  }
  const o=best?{x:best.x,y:best.y}:{x:p.x+Math.cos(p.ang)*range*0.75,y:p.y+Math.sin(p.ang)*range*0.75};
  o.x=clamp(o.x,40,MW-40);o.y=clamp(o.y,40,MH-40);return aimWall(p,o);
}
// จุดวางสกิลอยู่หลังผนังบ้าน/ตึก (เส้นจากอกผู้ใช้ถึงจุดนั้นชนผนัง) → ย้ายมาวางหน้าผนัง — ไม่วางทะลุตึก
function aimWall(p,o){const c=aimClip(p.x,p.y,(p.z||0)+1.2,o,PR+6);return {x:c.x,y:c.y};}

// ---------- ตัวช่วยคอมโบ (ทุกสายใช้หลักเดียวกัน: ตั้งต้น → ต่อยอด → ปิดจบ) ----------
// สายไฟ = ความร้อน (heat 0-3) • สายน้ำแข็ง = ความเย็น (chl) • สายฟ้า = ช็อต (shk) • ธรรมชาติ = พิษ (psn) • คำสาป = ตรา (mrk) • อัญเชิญ = สัตว์เวท
const ROLE_N={builder:'ตั้งต้น',control:'คุมสนาม',finisher:'ปิดจบ',utility:'เสริม',summon:'อัญเชิญ',ult:'เวทโบราณ'};
function takePoison(t){const n=t.psn|0;t.psn=0;t.psnT=0;return n;}

// ---------- ความสามารถพื้นฐาน (คลิกซ้าย) ของแต่ละสาย: สะสมสถานะตั้งต้นให้เองทุกๆ N ครั้งที่ยิงโดน ----------
const PBASIC=[
  {id:'b_pyro',type:'spark',n:'ประกายไฟ / ลูกไฟชาร์จ',d:'คลิก = ยิงประกายไฟ (5 ดาเมจ ทุก 0.3 วิ ระยะ ~400) โดนเป้าเดียวครบ 3 นัด = +1 Burning • กดค้าง = รวบรวมลูกไฟที่ปลายไม้ (ไม่ยิง) ครบ 2 วิ แล้วปล่อย = ลูกไฟ (12 ดาเมจ ระยะ ~900 +1 Burning)',
    shd:'โล่ไฟ: บล็อกปกติ • Parry = ได้ลูกไฟวิญญาณ 2 ลูก (ครั้งเดียวต่อการยกโล่) • บล็อกโดนครบ 3 ครั้ง = ได้ 2 ลูก • สะสมได้สูงสุด 4 ลูก หมุนรอบตัวไม่หายจนกว่าจะใช้ • ลูกไฟ (ชาร์จ/Kindle) โดนศัตรู = ลูกไฟวิญญาณทั้งหมดพุ่งใส่ ลูกละ 4',dsd:'พุ่ง (Shift): กดค้างชาร์จ (สูงสุด 4 วิ ห้ามขยับ ยิ่งชาร์จยิ่งย่อตัวต่ำ) ปล่อย = ระเบิดดันตัวพุ่ง 150-1100 อมตะระหว่างพุ่ง คูลดาวน์ 3 วิ',
    hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');if((t.spkN=(t.spkN|0)+1)>=3){t.spkN=0;addBurn(t,1,pr.owner);}},
    tick:pyroBasic,onParry:pyroParry,onBlock:pyroBlock,dash:pyroDash},
  {id:'b_frost',type:'icicle',n:'ดาบน้ำแข็ง / แท่งน้ำแข็ง',d:'กด V สลับโหมด • ประชิด: ดาบน้ำแข็งคอมโบ 10/10/15 ระยะ ~120 จังหวะ 3 ฮีล 10 เดินได้ระหว่างฟัน • ไกล: แท่งน้ำแข็ง 7 ดาเมจ ทุก 0.3 วิ ระยะ ~700 ช้าลง +10% (สูงสุด 30%) • อยู่สูงกว่า ~4 เมตร + ฟัน = กระโดดฟาดลงพื้น 30',
    shd:'โล่อัศวินน้ำแข็ง: กันเฉพาะด้านหน้า 120° ยกได้นานกว่าปกติ 2 เท่า ฟันดาบระหว่างยกโล่ได้ (ช้าลง) • Parry = ฟันครั้งต่อไปใน 1.5 วิ เป็นจังหวะ 3 ทันที',dsd:'ไถลน้ำแข็ง (Shift) 5 วิ เร็ว +80% (ลื่น หยุดทันทีไม่ได้) ทิ้งทางน้ำแข็ง 4 วิ: ศัตรูเดินทับช้า +10% และลื่น เราเดินทับเร็ว +20% • คูลดาวน์ 6 วิหลังไถลจบ',
    front:true,shDrain:0.5,shieldSwing:true,
    hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');addFrostSlow(t,10);},
    tick:frostBasic,onParry:p=>{p.ripT=1.5;},dash:frostDash},
  {id:'b_storm',type:'pb2',n:'ลำสายฟ้า / สายฟ้าสามเหลี่ยม',d:'กดค้าง = ลำสายฟ้า (แบบ Winston) ระยะ 300 ล็อกทุกคนในกรวยหน้าอัตโนมัติ คนละ 3 ดาเมจ ทุก 0.4 วิ • ได้ Lightning stack ใหม่ = กดยิงครั้งถัดไปฟาดสายฟ้าจากฟ้าเป็นสามเหลี่ยมด้านหน้า (ยาว 250 ปลายกว้าง 120) 20 ดาเมจ + Shock',
    shd:'โล่สายฟ้า: คลิกขวา = ฟ้าผ่าลงตัวเรา เปิดโล่ 3 วิ ดูดซับดาเมจทุกอย่าง เดินได้ปกติ • คลิกขวาอีกครั้ง / ครบ 3 วิ / ดูดเกิน 90 = ระเบิดรัศมี 150 ดาเมจครึ่งหนึ่งของที่ดูด (สูงสุด 30) + Shock • ระเบิดโดน = +1 stack • ไม่ได้ดูดอะไร = ไม่ระเบิด • คูลดาวน์ 10 วิ',dsd:'Dash 3 ชาร์จ (ฟื้นชาร์จละ 3 วิ) พุ่ง 220 ทะลุศัตรู คนละ 10 ดาเมจ • ทะลุโดน = +1 Lightning stack • ติด Shock = Dash ไม่ได้',
    hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');},tick:stormBasic,dash:stormDash},
  {id:'b_nature',type:'pb3',n:'หนามพิษ',d:'ยิงโดนทุกๆ 3 ครั้ง = ใส่พิษ 1 ชั้น',hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');const o=G.players[pr.owner];if(o&&(o.bc=(o.bc|0)+1)%3===0)addPoison(t,pr.owner,1);}},
  {id:'b_hex',type:'pb4',n:'ประกายคำสาป',d:'ยิงโดนทุกๆ 3 ครั้ง = ตีตรา 2 วิ (ถ้ายังไม่มีตรา)',hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');const o=G.players[pr.owner];if(o&&(o.bc=(o.bc|0)+1)%3===0&&!(t.mrk>0))addMark(t,2);}},
  {id:'b_summon',type:'pb5',n:'ลูกวิญญาณ',d:'ยิงโดนเป้าไหน สัตว์เวททุกตัวจะหันไปโจมตีเป้านั้นนาน 4 วิ',hit(pr,t){damage(t,pr.dmg,pr.owner,'proj');const o=G.players[pr.owner];if(o){o.focusT=t;o.focusUntil=G.time+4;}}}
];
PBASIC.forEach(b=>{SPELLS[b.id]=b;});
