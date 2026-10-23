// =====================================================================
//  เลเวล + สถิติ + ของปลดล็อค (ผู้ใช้ 2026-10-22: "more skin wand cloak unlock as lvl" → เลือก 30 เลเวล ปลดทุก 2 เลเวล)
//  เก็บในเครื่อง (localStorage 'wd_prog') • ได้ XP ตอนจบแต่ละตา (ห้องฝึกไม่ได้) • จอสรุปแสดง +XP / เลเวลอัป / ของที่ปลดล็อค
//  หน้าสร้างตัวละคร: ของที่ยังไม่ถึงเลเวล = ล็อก (เทาๆ + เลขเลเวล) • เมนู: ปุ่ม "เลเวล & สถิติ"
//  ⚠ สูตร XP + ค่า XP ต่อเลเวล + รายการของ Claude เลือกเอง
// =====================================================================
// var/function (ไม่ใช่ const): หน้าสร้างตัวละครอาจเปิดตอนโหลด (?nointro / ?join) ก่อนไฟล์นี้รัน — const จะพังทั้งเกม
var LV_MAX=30;
// ช่วงพัฒนาเกม (ผู้ใช้ 2026-10-22 "for now make everyone lvl maxed first so u unlock everything cuz still dev"): ทุกคนเลเวลเต็ม ของปลดล็อคครบ
// XP จริงยังสะสมเก็บไว้ตามปกติ — เปลี่ยนเป็น false ตอนเปิดใช้ระบบเลเวลจริง
var DEV_MAXLV=true;
function lvNeed(L){return 150+30*(L-1);}   // XP ที่ต้องใช้จากเลเวล L ไป L+1
var UNLOCKS=[
  {lv:2,k:'cl',v:8,n:'ผ้าคลุมเขียวมรกต'},{lv:4,k:'wc',v:6,n:'แกนเวท: ขนเทสตรัล'},{lv:6,k:'cl',v:9,n:'ผ้าคลุมแดงเลือดนก'},
  {lv:8,k:'wc',v:7,n:'แกนเวท: ขนนกแสงจันทร์'},{lv:10,k:'cl',v:10,n:'ผ้าคลุมกรมท่าราตรี'},{lv:12,k:'wd',v:8,n:'ไม้: เงาจันทร์'},
  {lv:14,k:'cl',v:11,n:'ผ้าคลุมทองหม่น'},{lv:16,k:'ws',v:4,n:'ทรงด้าม: กระดูก'},{lv:18,k:'cl',v:12,n:'ผ้าคลุมดำสนิท'},
  {lv:20,k:'wc',v:8,n:'แกนเวท: ประกายดาวตก'},{lv:22,k:'cl',v:13,n:'ผ้าคลุมเงินจันทรา'},{lv:24,k:'ws',v:5,n:'ทรงด้าม: เอลเดอร์วอนด์'},
  {lv:26,k:'cl',v:14,n:'ผ้าคลุมทองแชมป์'},{lv:28,k:'ws',v:6,n:'ทรงด้าม: คริสตัล'},{lv:30,k:'cl',v:15,n:'ผ้าคลุมจอมเวทสูงสุด'}];
// ของตกแต่งโปรไฟล์ปลดตามเลเวล (ผู้ใช้ 2026-10-23 รอบ 3: พื้นหลัง / ท่าโพส / กรอบรูป (ใช้ในเกมด้วย) / เอฟเฟกต์รอบตัว) • lv 1 = ของเริ่มต้น
//   ⚠ รายการ ชื่อ เลเวล และของใหญ่ (big = ห้าเหลี่ยมใหญ่สีทองในไทม์ไลน์ รางวัลเลเวล) Claude เลือกเอง
//   t: frame กรอบรูป (c = สีกรอบ) • bg พื้นหลังโปรไฟล์ (img = assets/ui/<img>) • pose ท่าโพส (p = ชื่อท่าใน HPOSE js/61) • aura เอฟเฟกต์รอบตัว (c = สี)
var PROF_ITEMS=[
  {id:'fr0',t:'frame',lv:1,n:'กรอบเริ่มต้น',c:'#9aa3c7'},{id:'bg0',t:'bg',lv:1,n:'ห้องศึกษายามค่ำ',img:'guide/credits.jpg'},{id:'po0',t:'pose',lv:1,n:'ยื่นลูกแก้ว',p:'present'},
  {id:'bg1',t:'bg',lv:3,n:'โถงใหญ่',img:'maps/greathall.jpg'},{id:'fr1',t:'frame',lv:5,n:'กรอบจันทร์เงิน',c:'#dfe6ff'},{id:'po1',t:'pose',lv:7,n:'ฮีโร่',p:'hero'},
  {id:'bg2',t:'bg',lv:9,n:'ป่าต้องห้าม',img:'maps/forest.jpg'},{id:'au1',t:'aura',lv:10,n:'ละอองดาว',c:'#b9a6ff',big:1},{id:'fr2',t:'frame',lv:11,n:'กรอบเวทม่วง',c:'#a995ff'},
  {id:'po2',t:'pose',lv:13,n:'ท่าดวล',p:'duel'},{id:'bg3',t:'bg',lv:15,n:'ซากเมืองทะเลทราย',img:'maps/ruins.jpg'},{id:'fr3',t:'frame',lv:17,n:'กรอบพายุฟ้า',c:'#8fd8ff'},
  {id:'po3',t:'pose',lv:19,n:'สองลูกแก้ว',p:'orb2'},{id:'au2',t:'aura',lv:20,n:'เปลวถ่านวน',c:'#ffab5c',big:1},{id:'bg4',t:'bg',lv:21,n:'ทะเลสาบดำ',img:'maps/lake.jpg'},
  {id:'fr4',t:'frame',lv:23,n:'กรอบถ่านทอง',c:'#ffc46b'},{id:'po4',t:'pose',lv:25,n:'ร่ายเวท',p:'cast'},{id:'bg5',t:'bg',lv:27,n:'ปราสาทยามราตรี',img:'maps/castle.jpg'},
  {id:'fr5',t:'frame',lv:29,n:'กรอบสวรรค์',c:'#ffe9a8'},{id:'au3',t:'aura',lv:30,n:'รัศมีสวรรค์',c:'#ffe9a8',big:1}];
// ของรางวัลทั้งหมดของเลเวล L (ชุดแต่งตัว UNLOCKS + ของโปรไฟล์) • ใช้ในจอสรุป (ของถัดไปปลายแถบ) + ไทม์ไลน์รางวัลเลเวล
function lvRewards(L){return [...UNLOCKS.filter(u=>u.lv===L).map(u=>({t:u.k==='cl'?'cloak':'wand',n:u.n,lv:u.lv,big:u.lv%10===0?1:0})),...PROF_ITEMS.filter(q=>q.lv===L&&L>1)];}
function lvNextReward(L){for(let l=L+1;l<=LV_MAX;l++){const r=lvRewards(l);if(r.length)return {lv:l,r};}return null;}
var PROG=(()=>{const d={xp:0,games:0,wins:0,losses:0,draws:0,kills:0,deaths:0,assists:0,dmg:0,bestK:0,bestD:0,paths:{},modes:{}};try{return Object.assign(d,JSON.parse(store('wd_prog')||'{}'));}catch(e){return d;}})();
function progSave(){try{store('wd_prog',JSON.stringify(PROG));}catch(e){}}
function lvOf(xp){let L=1;while(L<LV_MAX&&xp>=lvNeed(L)){xp-=lvNeed(L);L++;}return {L,cur:xp,need:L<LV_MAX?lvNeed(L):0};}
function progLv(){return lvOf(DEV_MAXLV?Math.max(PROG.xp,xpMax()):PROG.xp);}
function xpMax(){let t=0;for(let L=1;L<LV_MAX;L++)t+=lvNeed(L);return t;}
function lookLock(k,i){if(!UNLOCKS||!PROG||DEV_MAXLV)return 0;const u=UNLOCKS.find(q=>q.k===k&&q.v===i);return u&&lvOf(PROG.xp).L<u.lv?u.lv:0;}
function lookClampLocks(l){for(const u of UNLOCKS)if(l[u.k]===u.v&&lookLock(u.k,u.v))l[u.k]=0;return l;}
// XP ของตานี้: จบเกม 40 + ชนะ 100 / เสมอ 25 + ฆ่า×15 + ช่วย×5 + ดาเมจ/20 (+ co-op ชั้น×15)
function progXP(r,me,kind){if(!me)return 0;let x=40+(kind==='win'?100:kind==='draw'?25:0)+(me.k||0)*15+(me.as||0)*5+Math.round((me.dmg||0)/20);if(r.mode==='coop')x+=(r.wave||0)*15;return x;}
function progAward(r){
  if(!r||r.__aw||r.mode==='train')return null;r.__aw=1;
  const me=(r.rows||[]).find(q=>q.id===NET.myId);if(!me)return null;
  const kind=vicKind(r),before=DEV_MAXLV?progLv():lvOf(PROG.xp),gain=progXP(r,me,kind);
  PROG.xp+=gain;PROG.games++;if(kind==='win')PROG.wins++;else if(kind==='draw')PROG.draws++;else PROG.losses++;
  PROG.kills+=me.k||0;PROG.deaths+=me.d||0;PROG.assists+=me.as||0;PROG.dmg+=me.dmg||0;PROG.bestK=Math.max(PROG.bestK,me.k||0);PROG.bestD=Math.max(PROG.bestD,me.dmg||0);
  const pth=getKit(NET.myId).path;PROG.paths[pth]=(PROG.paths[pth]||0)+1;PROG.modes[r.mode]=(PROG.modes[r.mode]||0)+1;
  progSave();const after=DEV_MAXLV?progLv():lvOf(PROG.xp);
  return {gain,before,after,unl:UNLOCKS.filter(u=>u.lv>before.L&&u.lv<=after.L)};
}
// กล่อง XP ในจอสรุป (เรียกจาก showOver js/26)
function progBox(r){
  const a=progAward(r);if(!a)return '';
  const pct=a.after.need?Math.round(a.after.cur/a.after.need*100):100,up=a.after.L>a.before.L;
  return `<div class="xpBox"><div class="xpTop"><b>Lv ${a.after.L}</b><span>+${a.gain} XP</span>${up?'<em>เลเวลอัป!</em>':''}</div>
    <div class="xpBar"><i style="width:${pct}%"></i></div><div class="xpSub">${a.after.need?`${a.after.cur} / ${a.after.need} XP ถึงเลเวลถัดไป`:'เลเวลสูงสุดแล้ว!'}</div>
    ${a.unl.map(u=>`<div class="xpUnl">🔓 ปลดล็อค: ${u.n}</div>`).join('')}</div>`;
}
// หน้า "เลเวล & สถิติ" (ปุ่มในเมนู)
function progOpen(){
  const v=progLv(),pct=v.need?Math.round(v.cur/v.need*100):100,P=PROG,kd=(P.kills/Math.max(1,P.deaths)).toFixed(2),wr=P.games?Math.round(P.wins/P.games*100):0;
  const fav=Object.entries(P.paths).sort((a,b)=>b[1]-a[1])[0],fp=fav&&PATHS[+fav[0]];
  const st=(l,x)=>`<div class="pgS"><span>${l}</span><b>${x}</b></div>`;
  let el=$('#progOv');if(!el){el=document.createElement('div');el.id='progOv';el.className='overlay';document.body.appendChild(el);el.addEventListener('click',e=>{if(e.target===el||e.target.id==='progX')el.classList.add('hidden');});}
  el.innerHTML=`<div class="card" style="width:min(640px,100%);max-height:90vh;overflow:auto"><h1 style="font-size:34px">เลเวล & สถิติ</h1><div class="orn"></div>
    <div class="xpBox"><div class="xpTop"><b>Lv ${v.L}</b><span>${v.need?`${v.cur} / ${v.need} XP`:'สูงสุด'}</span></div><div class="xpBar"><i style="width:${pct}%"></i></div></div>
    <div class="pgGrid">${st('เล่นแล้ว',P.games+' ตา')}${st('ชนะ',P.wins+' ('+wr+'%)')}${st('ฆ่า / ตาย',P.kills+' / '+P.deaths)}${st('K/D',kd)}${st('ช่วยฆ่า',P.assists)}${st('ดาเมจรวม',P.dmg)}${st('ฆ่ามากสุดในตาเดียว',P.bestK)}${st('ดาเมจสูงสุดในตาเดียว',P.bestD)}${st('สายที่เล่นบ่อย',fp?fp.ic+' '+fp.n:'-')}</div>
    <h3 class="sec" style="margin-top:14px">ของปลดล็อค</h3><div class="pgUnl">${UNLOCKS.map(u=>{const ok=v.L>=u.lv;return `<div class="pgU ${ok?'ok':''}"><span>Lv ${u.lv}</span>${ok?'🔓':'🔒'} ${u.n}</div>`;}).join('')}</div>
    <div class="row"><button class="pri" id="progX">ปิด</button></div></div>`;
  el.classList.remove('hidden');
}
function progChip(){const el=$('#myLvl');if(el)el.textContent='Lv '+progLv().L+(DEV_MAXLV?' (dev)':'');}
(function(){
  const st=document.createElement('style');st.textContent=`
.xpBox{margin:10px auto;max-width:420px;text-align:left}.xpTop{display:flex;align-items:baseline;gap:10px}.xpTop b{font:900 22px "Cinzel Decorative",Cinzel,serif;color:#ffd86b}.xpTop span{font:600 14px Kanit,sans-serif;color:#9fe0a0}.xpTop em{font:700 14px Kanit,sans-serif;font-style:normal;color:#fff4cc;background:rgba(217,180,90,.25);padding:1px 8px;border-radius:6px;animation:inSlam .6s both}
.xpBar{height:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;margin-top:4px}.xpBar i{display:block;height:100%;background:linear-gradient(90deg,#a47a2b,#ffe9a8);animation:xpGrow 1.2s cubic-bezier(.2,.8,.2,1) both}
@keyframes xpGrow{from{width:0}}.xpSub{font:400 12px Kanit,sans-serif;color:rgba(255,255,255,.6);margin-top:3px}.xpUnl{font:600 13px Kanit,sans-serif;color:#7dffb0;margin-top:4px}
.pgGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}.pgS{padding:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);border-radius:8px}.pgS span{display:block;font:400 11px Kanit,sans-serif;color:rgba(255,255,255,.6)}.pgS b{font:600 16px Kanit,sans-serif;color:#fff}
.pgUnl{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}.pgU{font:400 13px Kanit,sans-serif;color:rgba(255,255,255,.45);padding:5px 8px;border:1px solid rgba(255,255,255,.08);border-radius:6px}.pgU span{display:inline-block;min-width:44px;color:#e8c468}.pgU.ok{color:#fff;border-color:rgba(125,255,176,.35)}
.sw.lk{cursor:not-allowed;filter:grayscale(.75) brightness(.55);position:relative}.sw.lk i{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(-45deg);font:700 10px Kanit,sans-serif;font-style:normal;color:#fff;text-shadow:0 1px 2px #000}
.obtn.lk{opacity:.45;cursor:not-allowed}
#myLvl{display:inline-block;margin-left:8px;padding:1px 8px;border:1px solid rgba(243,220,148,.5);border-radius:6px;font:700 12px Kanit,sans-serif;color:#ffd86b;vertical-align:middle}
@media(max-width:560px){.pgGrid{grid-template-columns:repeat(2,1fr)}.pgUnl{grid-template-columns:1fr}}`;document.head.appendChild(st);
  // ปุ่มในเมนู + ป้ายเลเวลข้างหัวข้อ "พ่อมดของคุณ"
  const nav=document.querySelector('.mnav'),g=$('#btnGuide');
  if(nav&&g){const b=document.createElement('button');b.className='mi';b.id='btnProg';b.innerHTML='เลเวล & สถิติ<small>XP / ชนะ-แพ้ / ของปลดล็อค</small>';nav.insertBefore(b,g);b.onclick=()=>{ac();progOpen();};}
  const h=document.querySelector('.mprof h3');if(h&&!$('#myLvl')){const s=document.createElement('span');s.id='myLvl';h.appendChild(s);}
  progChip();
  lookClampLocks(myLook);if(crOpen)crRenderStep1();   // หน้าสร้างตัวละครเปิดก่อนไฟล์นี้โหลด → วาดใหม่ให้เห็นของล็อก
})();
