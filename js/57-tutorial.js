// =====================================================================
//  วิธีเล่นแต่ละสาย (ผู้ใช้ 2026-10-22 "สอนเล่นแต่ละสาย") — ปุ่ม "📖 วิธีเล่นสายนี้" ในหน้าเลือกสาย/คาถา
//  รวม: ภาพรวมสาย • ปุ่มพื้นฐาน (ยิงปกติ/โล่/พุ่ง + V ของ Frost) • คาถาในชุดที่ใส่อยู่ + อัลติ • คอมโบแนะนำ • เคล็ดลับ 3 ข้อ
//  ปุ่ม "▶ ลองในห้องฝึก" = บันทึกชุดแล้วเปิดห้องฝึกคนเดียวทันที (จากเมนูหลัก)
//  ⚠ เคล็ดลับเขียนโดย Claude จากสเปกใน designs/*.md
// =====================================================================
const TUTTIPS={
  pyro:['ยิงซ้ำ ๆ ให้ศัตรูติด Burning ถึง 5 ชั้น แล้วค่อยดีดนิ้ว (Ignition Snap) ระเบิดทีเดียว','กดค้างคลิกซ้าย = ชาร์จลูกไฟใหญ่ ใช้ตอนศัตรูยืนนิ่งหรือติดวงไฟ','สายนี้ไม่ว่องไว — เปิดฉากจากระยะไกล อย่าเข้าไปแลกหมัดตรง ๆ'],
  frost:['กด V สลับประชิด/ไกล: ยิงไกลให้ติดสลอว์ก่อน แล้วสลับเข้าไปฟัน','ฟันประชิดครบ 3 จังหวะ จังหวะสุดท้ายสับพื้นแรงที่สุด','สายนี้ทนทาน — ยืนแลกวงในได้ เลือดน้อยใช้ Cryo Shell ห่อตัว'],
  storm:['Dash มี 3 ชาร์จ พุ่งทะลุศัตรูเพื่อเก็บ Lightning stack','เก็บ stack (สูงสุด 5) ไว้จ่ายสกิลแรง ๆ อย่ารีบใช้หมด','ไม่มีโล่ — ใช้ความเร็วหลบ ตีแล้วถอย อย่ายืนนิ่ง'],
  earth:['คลิกขวาค้าง = Stand ยกโล่ 300 HP กันได้รอบตัว แต่ถ้าแตก Stand จะอ่อนลง 15 วิ','กดค้างคลิกซ้าย = Stand ชาร์จทุบพื้น ดาเมจเป็นวง','Tectonic Crush กด 2 ครั้ง: ครั้งแรกตั้งกำแพง ครั้งที่สองบีบเข้า']};
function tutOpen(path){
  const P=PATHS[path];if(!P)return;
  const k=parseKit(myKit),B=PBASIC[path]||PBASIC[0],ult=SPELL_LIST[k.ult];
  const own=k.path===path?k.ids.map((id,i)=>({S:SPELL_LIST[id],key:keyName(KEYS[SLOTK[i]]||'Key'+'QERF'[i])})):SPELL_LIST.filter(x=>x.path===path&&!x.ult).slice(0,4).map((S,i)=>({S,key:'QERF'[i]}));
  const U=k.path===path?ult:SPELL_LIST.find(x=>x.path===path&&x.ult);
  const row=(key,html)=>`<div class="tutR"><kbd>${key}</kbd><div>${html}</div></div>`;
  let el=$('#tutOv');if(!el){el=document.createElement('div');el.id='tutOv';el.className='overlay';document.body.appendChild(el);
    el.addEventListener('click',e=>{if(e.target===el||e.target.id==='tutX')el.classList.add('hidden');if(e.target.id==='tutTry')tutTry();});}
  el.innerHTML=`<div class="card tutCard" style="--pc:${P.col}"><h1 style="font-size:34px">${P.ic} ${P.n}</h1><div class="orn"></div><p class="sub">${P.d}</p>
    <h3 class="sec">ปุ่มพื้นฐาน</h3>
    ${row('คลิกซ้าย',baseDescHTML(P,B,'b'))}${row('คลิกขวา',baseDescHTML(P,B,'s'))}${row(keyName(KEYS.dash||'ShiftLeft'),baseDescHTML(P,B,'d'))}
    ${P.id==='frost'?row(keyName(KEYS.mode||'KeyV'),'<b>สลับโหมด</b><div class="kdt">ประชิด (ดาบ/ขวานลอยฟันตามไม้) ⇄ ระยะไกล (ยิงน้ำแข็ง ติดสลอว์)</div>'):''}
    <h3 class="sec">คาถาในชุดของคุณ</h3>${own.map(o=>row(o.key,spellDescHTML(o.S))).join('')}
    ${U?`<h3 class="sec">เวทโบราณ (อัลติ)</h3>${row(keyName(KEYS.ult||'KeyX'),spellDescHTML(U))}`:''}
    <h3 class="sec">คอมโบแนะนำ</h3><p class="tutCb">✦ ${P.combo||'-'}</p>
    <h3 class="sec">เคล็ดลับ</h3><ul class="tutTips">${(TUTTIPS[P.id]||[]).map(t=>`<li>${t}</li>`).join('')}</ul>
    <div class="row">${screen==='menu'?'<button class="pri" id="tutTry">▶ ลองในห้องฝึก</button>':''}<button id="tutX">ปิด</button></div></div>`;
  el.classList.remove('hidden');
}
function tutTry(){
  $('#tutOv').classList.add('hidden');
  if(crOpen)closeCreator(true);
  store('wd_name',myName());hostGame(false);
  setTimeout(()=>{if(G&&NET.isHost&&G.ph==='lobby'){G.mode='train';hostStart();}},450);
}
(function(){const st=document.createElement('style');st.textContent=`
#tutOv,#progOv{z-index:8}
.tutCard{width:min(720px,100%);max-height:90vh;overflow:auto;text-align:left}.tutCard h1,.tutCard .sub{text-align:center}
.tutR{display:flex;gap:12px;align-items:flex-start;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.tutR kbd{flex:0 0 74px;text-align:center;font:600 12px Kanit,sans-serif;padding:4px 6px;border:1px solid color-mix(in srgb,var(--pc) 60%,transparent);border-radius:6px;color:#fff;background:rgba(255,255,255,.05)}
.tutR>div{min-width:0}.tutR .kdh{display:flex;gap:10px;align-items:center}.tutR .kdt{font:400 13px Kanit,sans-serif;color:rgba(255,255,255,.85);margin-top:4px}.tutR small{color:rgba(255,255,255,.55)}
.tutCb{font:400 14px Kanit,sans-serif;color:#ffe9a8}.tutTips{margin:4px 0 10px 18px;font:400 14px Kanit,sans-serif;color:#fff}.tutTips li{margin:4px 0}
.tutBtn{margin-top:10px;padding:6px 14px;font:600 13px Kanit,sans-serif;color:#fff;background:rgba(255,255,255,.06);border:1px solid rgba(243,220,148,.5);border-radius:8px;cursor:pointer}.tutBtn:hover{background:rgba(243,220,148,.15)}`;document.head.appendChild(st);})();
