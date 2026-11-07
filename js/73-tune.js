// =====================================================================
//  แผงปรับค่า 🎚️ (F8 / ปุ่ม "ปรับค่า" ในเมนูพัก และหน้าแรก) — ปรับตัวเลขในเกมสดๆ แล้วเซฟลง assets/tune.json
//  ไฟล์ assets/tune.json = {"v":1,"set":{"คีย์":ค่า,...}} เก็บ "เฉพาะค่าที่ต่างจากค่าในโค้ด" • เกมโหลดไฟล์นี้ทุกครั้งที่เปิดหน้า
//  เพิ่มค่าใหม่ให้ปรับได้: เพิ่มบรรทัด tuneNum(...) ใน tuneBuild() ด้านล่าง (คีย์ต้องไม่ซ้ำและไม่เปลี่ยนชื่อภายหลัง)
//  ใช้ได้กับ: ตัวเลขที่เกมอ่าน "ตอนใช้งาน" (คูลดาวน์/กระสุน/มอนสเตอร์/รอยพื้น/เงา) — ตัวเลขที่ฝังในฟังก์ชันของสกิลยังไม่อยู่ในแผงนี้
//  ค่าเกมเพลย์ (cd/กระสุน/มอนสเตอร์) โฮสต์เป็นคนใช้จริง → ทุกเครื่องควรใช้ tune.json ชุดเดียวกัน (มากับ git)
// =====================================================================
const TUNE={groups:[],items:new Map(),ov:{},tab:0,q:'',loaded:false,file:{}};
function tuneNum(g,sec,key,label,get,set,o){o=o||{};const d=get();
  const mx=o.max!==undefined?o.max:Math.max(d*3,d>0?1:10),mn=o.min!==undefined?o.min:0;
  const st=o.step||(Math.abs(d)<=1?0.01:Math.abs(d)<=10?0.1:Math.abs(d)<=100?1:5);
  const it={key,label,sec,get,set,def:d,min:mn,max:mx,step:st,bool:!!o.bool};
  let G0=TUNE.groups.find(x=>x.id===g[0]);if(!G0){G0={id:g[0],name:g[1],items:[]};TUNE.groups.push(G0);}
  G0.items.push(it);TUNE.items.set(key,it);return it;}
function tuneBuild(){
  // --- กราฟิก / แสงเงา ---
  const GF=['gfx','🌗 แสงเงา'];
  tuneNum(GF,'เงา','gfx.shd.on','เงาตามผู้เล่น (1 = เปิด)',()=>SHD.on?1:0,v=>{SHD.on=!!v;},{bool:true,min:0,max:1,step:1});
  tuneNum(GF,'เงา','gfx.pcss.on','เงานุ่ม PCSS (1 = เปิด • ทำงานเฉพาะกราฟิกสูง)',()=>PCSS.on?1:0,v=>{PCSS.on=!!v;shadowSoft();},{bool:true,min:0,max:1,step:1});
  tuneNum(GF,'เงา','gfx.pcss.size','เงานุ่ม PCSS • ขนาดแสง (ยิ่งมากยิ่งนุ่มไกลจากตัวบัง)',()=>PCSS.size,v=>{PCSS.size=v;shadowSoft();},{min:0.005,max:0.2,step:0.005});
  tuneNum(GF,'ลบขอบหยัก (TAA)','gfx.taa.on','TAA (1 = เปิด • ทำงานเฉพาะกราฟิกสูง แทน FXAA)',()=>TAA.on?1:0,v=>{TAA.on=!!v;},{bool:true,min:0,max:1,step:1});
  tuneNum(GF,'ลบขอบหยัก (TAA)','gfx.taa.alpha','ความไวต่อภาพใหม่ (น้อย = เนียนแต่เกิดเงา)',()=>TAA.alpha,v=>{TAA.alpha=v;},{min:0.03,max:0.5,step:0.01});
  tuneNum(GF,'ลบขอบหยัก (TAA)','gfx.taa.sharp','ความคมชดเชย',()=>TAA.sharp,v=>{TAA.sharp=v;},{min:0,max:1,step:0.01});
  tuneNum(GF,'เงา','gfx.shd.r','พื้นที่เงา (ครึ่งกว้าง) กราฟิกปกติ',()=>SHD.r,v=>{SHD.r=v;},{min:10,max:120,step:1});
  tuneNum(GF,'เงา','gfx.shd.rhigh','พื้นที่เงา กราฟิกสูง',()=>SHD.rHigh,v=>{SHD.rHigh=v;},{min:10,max:160,step:1});
  tuneNum(GF,'เงา','gfx.shd.ahead','ดันเงาไปข้างหน้ากล้อง',()=>SHD.ahead,v=>{SHD.ahead=v;},{min:0,max:1,step:0.05});
  tuneNum(GF,'เงาตามซอกมุม (SSAO)','gfx.ao','ความเข้ม (0 = ปิด)',()=>AO_ON.strength,v=>{AO_ON.strength=v;applyQuality();},{min:0,max:5,step:0.05});
  tuneNum(GF,'เงาตามซอกมุม (SSAO)','gfx.ao.r','รัศมีหาซอก (หน่วย 3D)',()=>AOU.uR.value,v=>{AOU.uR.value=v;},{min:0.2,max:3,step:0.05});
  tuneNum(GF,'เงาตามซอกมุม (SSAO)','gfx.ao.fade0','เริ่มจางที่ระยะ',()=>AOU.uFade.value.x,v=>{AOU.uFade.value.x=v;},{min:5,max:150,step:1});
  tuneNum(GF,'เงาตามซอกมุม (SSAO)','gfx.ao.fade1','หายหมดที่ระยะ',()=>AOU.uFade.value.y,v=>{AOU.uFade.value.y=v;},{min:10,max:250,step:1});
  // --- รอยค้างบนพื้น (bfMark js/44) ---
  const MK=['mark','🕳️ รอยพื้น'],EL={fire:'🔥 ไฟ',storm:'⚡ สายฟ้า',earth:'⛰️ ดิน',ice:'❄️ น้ำแข็ง'};
  for(const el of Object.keys(EL)){
    tuneNum(MK,EL[el],'mark.'+el+'.a',EL[el]+' • ความเข้ม',()=>BF_MKA[el],v=>{BF_MKA[el]=v;},{min:0,max:1,step:0.01});
    tuneNum(MK,EL[el],'mark.'+el+'.r',EL[el]+' • ขนาด (เท่า)',()=>BF_MKR[el],v=>{BF_MKR[el]=v;},{min:0.2,max:3,step:0.05});}
  for(const q of ['high','auto','low'])tuneNum(MK,'จำนวนรอยสูงสุดต่อกราฟิก','mark.cap.'+q,'กราฟิก '+({high:'สูง',auto:'อัตโนมัติ',low:'ประหยัด'})[q],()=>BFM.N[q],v=>{BFM.N[q]=Math.min(BFM.MAX,Math.round(v));},{min:0,max:BFM.MAX,step:5});
  // --- กระสุน (PDEF js/02) ---
  const PJ=['proj','🎯 กระสุน'],PF={spd:['ความเร็ว',{max:3000,step:10}],r:['ขนาดชน',{max:80,step:1}],dmg:['ดาเมจ',{max:200,step:1}],life:['อายุ (วิ)',{max:8,step:0.05}]};
  for(const id of Object.keys(PDEF))for(const f of Object.keys(PF))if(typeof PDEF[id][f]==='number')
    tuneNum(PJ,id,'proj.'+id+'.'+f,id+' • '+PF[f][0],()=>PDEF[id][f],v=>{PDEF[id][f]=v;},PF[f][1]);
  // --- มอนสเตอร์ (EDEF js/02) ---
  const EN=['enemy','👹 มอนสเตอร์'],EF={hp:['เลือด',{max:5000,step:5}],spd:['ความเร็ว',{max:500,step:5}],r:['ขนาดตัว',{max:150,step:1}],dmg:['ดาเมจ',{max:150,step:1}]};
  for(const id of Object.keys(EDEF))for(const f of Object.keys(EF))if(typeof EDEF[id][f]==='number')
    tuneNum(EN,EDEF[id].name||id,'enemy.'+id+'.'+f,(EDEF[id].name||id)+' • '+EF[f][0],()=>EDEF[id][f],v=>{EDEF[id][f]=v;},EF[f][1]);
  // --- คูลดาวน์สกิลทุกอัน (SPELL_LIST js/03) ---
  const SK=['spell','⏱️ คูลดาวน์สกิล'];
  for(const S of SPELL_LIST)if(typeof S.cd==='number'&&S.cd>0){const P=PATHS[S.path];
    tuneNum(SK,(P?P.ic+' '+P.n:'สาย '+S.path),'spell.'+S.id+'.cd',(S.ic||'')+' '+(S.n||S.id)+(S.ult?' (อัลติ)':''),()=>S.cd,v=>{S.cd=v;},{min:0,max:Math.max(60,S.cd*3),step:0.5});}
  // --- ตัวเลขในสกิล (S.v ใน defSpell — ชื่อไทยใน S.vn) • แต่ละสายเป็นหนึ่งกลุ่ม ---
  // ยิงปกติ / โล่ / พุ่ง ของแต่ละสาย (PATHS[i].v — ชื่อไทยใน PATHS[i].vn)
  PATHS.forEach((P,i)=>{if(!P.v)return;const g=['sv'+i,P.ic+' '+P.n+' • ตัวเลขสกิล'];
    for(const k of Object.keys(P.v))if(typeof P.v[k]==='number')
      tuneNum(g,'พื้นฐาน (ยิงปกติ / โล่ / พุ่ง)','path.'+P.id+'.'+k,(P.vn&&P.vn[k])||k,()=>P.v[k],v=>{P.v[k]=v;},(P.vo&&P.vo[k])||{});});
  for(const S of SPELL_LIST)if(S.v){const P=PATHS[S.path],g=['sv'+S.path,(P?P.ic+' '+P.n:'สาย '+S.path)+' • ตัวเลขสกิล'];
    for(const k of Object.keys(S.v))if(typeof S.v[k]==='number')
      tuneNum(g,(S.ic||'')+' '+(S.n||S.id)+(S.ult?' (อัลติ)':''),'spell.'+S.id+'.'+k,(S.vn&&S.vn[k])||k,()=>S.v[k],v=>{S.v[k]=v;},(S.vo&&S.vo[k])||{});}
  // --- ผู้เล่น (PLAY js/02) ---
  const PL=['play','🧙 ผู้เล่น'],PLN={hp:['เลือดสูงสุด',{max:1000,step:5}],walk:['ความเร็วเดิน',{max:600,step:5}],fly:['ความเร็วบิน',{max:1500,step:10}],jump:['แรงกระโดด',{max:25,step:0.5}],shSlow:['ความเร็วตอนถือโล่ (เท่า)',{max:1,step:0.05}],respawn:['เกิดใหม่ (วิ)',{max:20,step:0.5}],respawnFast:['เกิดใหม่ ห้องฝึก/แข่ง (วิ)',{max:20,step:0.5}]};
  for(const k of Object.keys(PLN))tuneNum(PL,'ค่าพื้นฐาน','play.'+k,PLN[k][0],()=>PLAY[k],v=>{PLAY[k]=v;},PLN[k][1]);
  // --- บ้าน / ของพังได้ ---
  const BD=['bld','🏠 บ้าน & ของในแมพ'];
  tuneNum(BD,'บ้าน','bld.house.wall','เลือดชิ้นกำแพง',()=>BLDDEF.house.hp.wall,v=>{BLDDEF.house.hp.wall=v;},{max:500,step:1});
  tuneNum(BD,'บ้าน','bld.house.roof','เลือดชิ้นหลังคา',()=>BLDDEF.house.hp.roof,v=>{BLDDEF.house.hp.roof=v;},{max:500,step:1});
  ['เล็ก','กลาง','ใหญ่'].forEach((n,i)=>tuneNum(BD,'สิ่งก่อสร้างในแมพที่พังได้','bld.brk.hp'+i,'เลือด ขนาด'+n,()=>BRKDEF.hp[i],v=>{BRKDEF.hp[i]=v;},{max:3000,step:10}));
  for(const id of Object.keys(PROPDEF)){const D=PROPDEF[id];
    if(typeof D.hp==='number')tuneNum(BD,'ของในแมพ','prop.'+id+'.hp',D.n+' • เลือด',()=>D.hp,v=>{D.hp=v;},{max:500,step:1});
    if(typeof D.w==='number')tuneNum(BD,'ของในแมพ','prop.'+id+'.w',D.n+' • โอกาสสุ่มลงแมพ',()=>D.w,v=>{D.w=v;},{max:20,step:1});}
}
// ---------- ใช้ / เก็บค่า ----------
function tuneSetVal(it,v,live){v=+v;if(!isFinite(v))return;
  if(it.bool)v=v?1:0;it.set(v);
  if(Math.abs(v-it.def)<1e-9)delete TUNE.ov[it.key];else TUNE.ov[it.key]=+v.toFixed(4);}
function tuneApplyFile(j){
  const s=(j&&j.set)||{};let n=0;
  for(const k of Object.keys(s)){const it=TUNE.items.get(k);if(!it){console.warn('tune.json: ไม่รู้จักคีย์',k);continue;}tuneSetVal(it,s[k]);n++;}
  TUNE.file=Object.assign({},TUNE.ov);TUNE.loaded=true;return n;}
function tuneJson(){const o={};for(const k of Object.keys(TUNE.ov).sort())o[k]=TUNE.ov[k];return JSON.stringify({v:1,set:o},null,1)+'\n';}
tuneBuild();
fetch('assets/tune.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{if(j){tuneApplyFile(j);tuneRefresh();}}).catch(()=>{});
// ---------- หน้าตา ----------
document.body.insertAdjacentHTML('beforeend','<div id="tune" class="hidden"><div class="tuHead"><b>🎚️ ปรับค่า</b><span id="tuCnt"></span><button id="tuX" title="ปิด (F8)">✕</button></div>'+
  '<input id="tuQ" placeholder="ค้นหา เช่น ไฟ, cd, ความเร็ว…" autocomplete="off"><div class="tuTabs" id="tuTabs"></div><div class="tuBody" id="tuBody"></div>'+
  '<div class="tuFoot"><button id="tuSave" class="pri">💾 เซฟลงไฟล์</button><button id="tuDl" title="ดาวน์โหลด tune.json (ใช้เมื่อเปิดเกมจากเว็บ)">⬇</button><button id="tuRst" title="คืนค่าทุกตัวเป็นค่าเดิมในโค้ด">↺ คืนทั้งหมด</button></div>'+
  '<small id="tuMsg">F8 = เปิด/ปิด • คลิกเกม = เล่นต่อ (แผงปิด) • ค่าที่เปลี่ยนมีสีทอง</small></div>');
let tuneOpenF=false;
function tuneFmt(v,st){return st>=1?String(Math.round(v)):String(+(+v).toFixed(st>=0.1?1:2));}
function tuneRow(it){const ch=it.key in TUNE.ov,v=it.get();
  if(it.bool)return `<div class="tuRow tog${ch?' ch':''}" data-k="${it.key}"><span title="${it.key}">${it.label}</span><input type="checkbox" class="tuN" ${v?'checked':''}><button class="tuR" title="คืนค่าเดิม">↺</button></div>`;
  return `<div class="tuRow${ch?' ch':''}" data-k="${it.key}"><span title="${it.key}">${it.label}</span><input type="range" class="tuS" min="${it.min}" max="${Math.max(it.max,v)}" step="${it.step}" value="${v}"><input type="number" class="tuN" step="${it.step}" value="${tuneFmt(v,it.step)}"><button class="tuR" title="คืนค่าเดิม ${tuneFmt(it.def,it.step)}">↺</button></div>`;}
function tuneRefresh(){if(!tuneOpenF)return;
  const q=TUNE.q.trim().toLowerCase();let list;
  $('#tuTabs').innerHTML=TUNE.groups.map((g,i)=>{const c=g.items.filter(it=>it.key in TUNE.ov).length;return `<button data-tab="${i}" class="${!q&&TUNE.tab===i?'on':''}">${g.name}${c?`<i>${c}</i>`:''}</button>`;}).join('');
  if(q)list=TUNE.groups.flatMap(g=>g.items.filter(it=>(it.label+' '+it.key+' '+it.sec).toLowerCase().includes(q)));else list=TUNE.groups[TUNE.tab].items;
  let h='',sec=null,n=0;for(const it of list){if(++n>300){h+='<div class="tuSec">… แสดง 300 รายการแรก — พิมพ์ค้นหาให้แคบลง</div>';break;}
    if(it.sec!==sec){sec=it.sec;h+=`<div class="tuSec">${sec}</div>`;}h+=tuneRow(it);}
  $('#tuBody').innerHTML=h||'<div class="tuSec">ไม่เจอรายการ</div>';
  $('#tuCnt').textContent=Object.keys(TUNE.ov).length?'แก้ '+Object.keys(TUNE.ov).length+' ค่า':'ยังไม่แก้';}
function tuneMsg(t){$('#tuMsg').textContent=t;}
function tuneToggle(on){const want=on===undefined?!tuneOpenF:!!on;if(want===tuneOpenF)return;tuneOpenF=want;
  $('#tune').classList.toggle('hidden',!want);
  if(want){if(document.pointerLockElement)document.exitPointerLock();INPUT.fire=INPUT.sh=0;if(typeof hidePause==='function')hidePause();tuneRefresh();}}
// แก้ค่าทีละแถว (ไม่ render ใหม่ ลากสไลเดอร์ได้ลื่น)
function tuneEdit(e){const row=e.target.closest('.tuRow');if(!row)return;const it=TUNE.items.get(row.dataset.k);if(!it)return;
  if(e.target.classList.contains('tuR')){tuneSetVal(it,it.def);tuneRefresh();return;}
  if(e.type==='click'&&!e.target.classList.contains('tuN')){return;}
  if(!e.target.classList.contains('tuS')&&!e.target.classList.contains('tuN'))return;
  const v=e.target.type==='checkbox'?(e.target.checked?1:0):+e.target.value;if(!isFinite(v))return;
  tuneSetVal(it,v);row.classList.toggle('ch',it.key in TUNE.ov);
  if(e.target.classList.contains('tuS')){const nb=row.querySelector('.tuN');if(nb)nb.value=tuneFmt(v,it.step);}
  else if(e.target.type!=='checkbox'){const sl=row.querySelector('.tuS');if(sl){if(v>+sl.max)sl.max=v;sl.value=v;}}
  $('#tuCnt').textContent=Object.keys(TUNE.ov).length?'แก้ '+Object.keys(TUNE.ov).length+' ค่า':'ยังไม่แก้';}
$('#tuBody').addEventListener('input',tuneEdit);
$('#tuBody').addEventListener('click',e=>{if(e.target.classList.contains('tuR'))tuneEdit(e);});
$('#tuTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;TUNE.tab=+b.dataset.tab;TUNE.q='';$('#tuQ').value='';tuneRefresh();});
$('#tuQ').addEventListener('input',e=>{TUNE.q=e.target.value;tuneRefresh();});
$('#tuX').onclick=()=>tuneToggle(false);
$('#tuRst').onclick=()=>{for(const k of Object.keys(TUNE.ov))tuneSetVal(TUNE.items.get(k),TUNE.items.get(k).def);tuneRefresh();tuneMsg('คืนค่าเดิมทั้งหมดแล้ว (ยังไม่ได้เซฟ — กดเซฟถ้าจะล้างไฟล์ด้วย)');};
$('#tuDl').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([tuneJson()],{type:'application/json'}));a.download='tune.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);tuneMsg('ดาวน์โหลดแล้ว — เอาไปวางทับ assets/tune.json');};
$('#tuSave').onclick=()=>{tuneMsg('กำลังเซฟ…');
  fetch('/api/save?path=assets/tune.json',{method:'POST',body:tuneJson()}).then(r=>r.json()).then(j=>{
    if(j&&j.ok){TUNE.file=Object.assign({},TUNE.ov);tuneMsg('✅ เซฟลง assets/tune.json แล้ว ('+Object.keys(TUNE.ov).length+' ค่า) — บอก Claude ให้ commit+push ได้เลย');}
    else tuneMsg('❌ เซฟไม่ได้: '+((j&&j.err)||'ไม่ทราบสาเหตุ')+' — ลองปุ่ม ⬇');
  }).catch(()=>tuneMsg('❌ เซฟไม่ได้ (ต้องเปิดเกมผ่าน python tools/serve.py) — ใช้ปุ่ม ⬇ ดาวน์โหลดแทน'));};
addEventListener('keydown',e=>{if(e.code==='F8'){e.preventDefault();tuneToggle();}});
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement&&tuneOpenF)tuneToggle(false);});   // คลิกเข้าเกม = ปิดแผง (เมาส์ถูกล็อก)
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('[data-tune-open]')){ac&&ac();tuneToggle(true);}});
// ---------- API สำหรับเครื่องมือแยก tune.html (เปิดเกมใน iframe แล้วเรียกผ่าน WD) ----------
function tuneDump(){return TUNE.groups.map(g=>({id:g.id,name:g.name,items:g.items.map(it=>({key:it.key,label:it.label,sec:it.sec,def:it.def,min:it.min,max:it.max,step:it.step,bool:it.bool,v:it.get(),file:TUNE.file[it.key]}))}));}
function tuneSetKey(k,v){const it=TUNE.items.get(k);if(!it)return false;tuneSetVal(it,v);tuneRefresh();return true;}
window.WD&&Object.assign(window.WD,{TUNE,tuneToggle,tuneDump,tuneSetKey,tuneJson,tuneMarkSaved:()=>{TUNE.file=Object.assign({},TUNE.ov);}});
