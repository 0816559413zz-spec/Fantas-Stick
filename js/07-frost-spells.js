// =====================================================================
//  สายน้ำแข็ง — ความเย็น: สะสม 3 ชั้น = แข็ง • ปิดจบด้วยหอกน้ำแข็ง (ยิ่งเย็นยิ่งแรง ถ้าแข็ง = แตก)
// =====================================================================
const FROSTF=defSpell(1,{id:'frostforge',v:{time:6,a1:20,a2:20,a3:40,axeR:160,axeCd:0.5,heal3:15,slamDmg:50,dmg:20,r:100,cd2:0.6,slow:60,slowT:2,env:30},vn:{time:'บัฟนาน (วิ)',a1:'ขวาน • ดาเมจจังหวะ 1',a2:'ขวาน • ดาเมจจังหวะ 2',a3:'ขวาน • ดาเมจจังหวะ 3',axeR:'ขวาน • ระยะ',axeCd:'ขวาน • เว้นฟัน (วิ)',heal3:'ขวาน • ฮีลจังหวะ 3',slamDmg:'ขวาน • ฟาดจากที่สูง ดาเมจ',dmg:'ก้อนน้ำแข็งใหญ่ • ดาเมจ',r:'ก้อนน้ำแข็งใหญ่ • รัศมี',cd2:'ก้อนน้ำแข็งใหญ่ • เว้นยิง (วิ)',slow:'ก้อนน้ำแข็งใหญ่ • สลอว์ (%)',slowT:'ก้อนน้ำแข็งใหญ่ • สลอว์นาน (วิ)',env:'ก้อนน้ำแข็งใหญ่ • ดาเมจใส่บ้าน/ของ'},role:'utility',dual:1,n:'Frostforge',ic:'🪓',cd:18,d:'6 วิ: ประชิด = ดาบกลายเป็นขวานศึกน้ำแข็ง 20/20/40 ระยะ 160 จังหวะ 3 ฮีล 15 • ไกล = ก้อนน้ำแข็งใหญ่ระเบิด (วง ~100) 20 ดาเมจ ช้าลง 60% 2 วิ',fx:'ใช้ได้ทั้ง 2 โหมด สลับโหมดระหว่างบัฟได้ • คูลดาวน์ 12 วิหลังบัฟหมด • ฟาดจากที่สูงด้วยขวาน = 50',
  cast(p,S){p.ffT=S.v.time;emit({k:'efx',z:'forge',x:p.x,y:p.y,h:p.z+1,id:p.id,ml:p.fmode===1?0:1});}});
const GREND=defSpell(1,{id:'glacierrend',v:{charge:1,waveDmg:30,waveLen:600,waveSpd:750,waveSlow:5,waveFan:20,nearWind:0.3,len:700,height:8,time:6.3,dmg:15,freeze:1,knock:220},vn:{charge:'ชาร์จ (วิ)',waveFan:'คลื่นดาบ • อัลติแยกพัด (องศา)',nearWind:'คลื่นดาบ • หน่วงก่อนฟันงัดขึ้น (วิ)',waveDmg:'คลื่นดาบ (ประชิด) • ดาเมจ',waveLen:'คลื่นดาบ • ระยะ',waveSpd:'คลื่นดาบ • ความเร็ว',waveSlow:'คลื่นดาบ • สลอว์ (%)',len:'ภูเขาน้ำแข็ง (ไกล) • ยาว',height:'ภูเขาน้ำแข็ง • สูงสุด',time:'ภูเขาน้ำแข็ง • อยู่นาน (วิ)',dmg:'ภูเขาน้ำแข็ง • ดาเมจ',freeze:'ภูเขาน้ำแข็ง • แช่แข็ง (วิ)',knock:'ภูเขาน้ำแข็ง • แรงกระเด็น'},role:'control',dual:1,n:'Glacier Rend',ic:'🏔️',cd:10,d:'ประชิด: ชาร์จดาบ 1 วิ แล้วส่งคลื่นดาบ 30 ดาเมจ ไกล ~600 ทะลุหลายคน ทิ้งทางน้ำแข็ง • ไกล: ชาร์จ 1 วิ (ชี้มือไปที่เล็ง) แล้วยกมือขึ้น = ภูเขาน้ำแข็งแหลมพุ่งเป็นแนว ~700 สูงถึง ~8 เมตร 6 วิ เดินขึ้นไปได้',fx:'โดนภูเขาน้ำแข็ง = 15 ดาเมจ + แช่แข็ง 1 วิ + กระเด็นเล็กน้อย • อยู่บนที่สูงแล้วฟัน = กระโดดฟาดลงพื้น',
  cast(p,S){
    p.grM=p.fmode===1?1:0;p.grT=p.grM?S.v.charge:S.v.nearWind;emit({k:'efx',z:'grcharge',x:p.x,y:p.y,h:p.z+1,id:p.id,m:p.grM});
  }});
// Glacier Rend โหมดไกล (หลังชาร์จ 1 วิ): ภูเขาน้ำแข็งแหลมพุ่งเป็นแนวตามทิศที่เล็งตอนปล่อย
function frostGlacier(p){
  const V=GREND.v,L=Math.max(45,V.len),a=p.ang,c=Math.cos(a),s=Math.sin(a),grp=new Set();
  for(let d=70;d<=70+L;d+=45){const x=p.x+c*d,y=p.y+s*d;if(x<30||x>MW-30||y<30||y>MH-30)break;(G.glac||(G.glac=[])).push({x,y,r:52,a,H:1+(V.height-1)*(d-70)/L,h:0,age:0,delay:(d-70)/(L*2),t:V.time,team:p.team,owner:p.id,grp});}
  emit({k:'efx',z:'glacier',x:p.x+c*70,y:p.y+s*70,h:0,a:Math.round(a*1000)/1000,len:L,t:V.time,id:p.id});
}
const PERMA=defSpell(1,{id:'permafrost',v:{r:300,time:6,slow:20,selfSpd:0.3},vn:{r:'รัศมีวง',time:'อยู่นาน (วิ)',slow:'ศัตรูในวง • สลอว์ (%)',selfSpd:'เราในวง • เดินเร็วขึ้น (เท่า)'},role:'control',melee:1,n:'Permafrost',ic:'❄️',cd:16,d:'พื้นน้ำแข็งวงใหญ่รอบตัว (รัศมี ~300) 6 วิ: ศัตรูในวงช้าลง 20% ทันที (ซ้อนกับสลอว์ยิงปกติ สูงสุด 60%)',fx:'เราเดินในวงเร็ว +30% (ไม่ซ้อนกับไถลน้ำแข็ง) • ใช้ได้เฉพาะโหมดประชิด',
  cast(p,S){const V=S.v;addIce({x:p.x,y:p.y,r:V.r,t:V.time,team:p.team,owner:p.id,kind:'ring'});emit({k:'efx',z:'perma',x:p.x,y:p.y,h:0.1,r:V.r});}});
const CRYO=defSpell(1,{id:'cryoshell',v:{time:5,heal:3.75},vn:{time:'แช่แข็งตัวเองนาน (วิ)',heal:'ฮีลทุก 0.5 วิ'},role:'utility',melee:1,n:'Cryo Shell',ic:'🧊',cd:28,d:'แช่แข็งตัวเอง 5 วิ: อมตะ ล้างดีบัฟทั้งหมด ฮีล 7.5/วิ (ขยับ/ตี/ร่ายไม่ได้ ยกเว้น Frostbite Aura)',fx:'กดซ้ำเพื่อออกก่อนได้ (ฮีลหยุด) • ใช้ได้เฉพาะโหมดประชิด',
  toggle(p){if(p.cryo>0){p.cryo=0;p.inv=0;emit({k:'efx',z:'cryoend',x:p.x,y:p.y,h:p.z+1,id:p.id});return true;}return false;},
  cast(p,S){
    for(const k of ['stun','slowT','chl','chlT','frz','shk','root','sil','fear','bld','mrk','burn','brn','brnT','xb','psn','psnT','heat','fsl','fslT','fslBigT','fslR','fslP','fslUltT','slip'])p[k]=0;
    p.cryo=S.v.time;p.cryoTk=0.5;p.inv=S.v.time;p.shieldOn=false;p.slideT=0;
    emit({k:'efx',z:'cryo',x:p.x,y:p.y,h:p.z+1,id:p.id});
  }});
const FAURA=defSpell(1,{id:'frostaura',v:{time:5,r:180,dmg:10},vn:{time:'อยู่นาน (วิ)',r:'รัศมี',dmg:'ดาเมจทุก 0.5 วิ'},role:'control',melee:1,n:'Frostbite Aura',ic:'🌨️',cd:15,d:'ออร่าเยือกแข็งรอบตัว 5 วิ (รัศมี ~180): 20 ดาเมจ/วิ (ไม่สลอว์)',fx:'ใช้ได้แม้ตอนแช่แข็งตัวเอง • ใช้ได้เฉพาะโหมดประชิด',
  cast(p,S){p.auraT=S.v.time;p.auraTk=0;emit({k:'efx',z:'aura',x:p.x,y:p.y,h:p.z,id:p.id});}});
const MIRROR=defSpell(1,{id:'mirrorlegion',v:{time:10,xhp:100,dmgMul:2,clone:0.5,heal:15,healAxe:22,dash:600,dashSp:2000,slash:75,slow:80,slowT:3},vn:{time:'อยู่นาน (วิ)',xhp:'HP เสริม',dmgMul:'ดาเมจเรา (เท่า)',clone:'อาวุธลอย • ดาเมจ (เท่าของเรา)',heal:'ฮีลจังหวะ 3 (ดาบ)',healAxe:'ฮีลจังหวะ 3 (ขวาน)',dash:'พุ่งตอนเปิด • ระยะ',dashSp:'พุ่งตอนเปิด • ความเร็ว',slash:'พุ่งตอนเปิด • ดาเมจ',slow:'พุ่งตอนเปิด • สลอว์ (%)',slowT:'พุ่งตอนเปิด • สลอว์นาน (วิ)'},role:'ult',n:'Mirror Legion',ic:'⚔️',cd:0,ult:true,d:'เวทโบราณสายน้ำแข็ง: เสกดาบ/ขวานน้ำแข็งลอยเพิ่ม 2 เล่มข้างตัว (รวม 3 เล่ม) 10 วิ (ฟันตามเราทุกครั้ง เล่มละ 50%) + HP เสริม 100 • ดาเมจเรา ×2 • ฟันจังหวะ 3 ฮีล 15 (ขวาน 22)',fx:'ตอนเปิด: พุ่งไปข้างหน้า ~600 (อมตะ) พร้อมอาวุธลอยทั้ง 3 เล่ม ฟันตลอดทาง 75 ดาเมจ + ช้าลง 80% 3 วิ',
  cast(p,S){
    const V=S.v;p.mirror=V.time;p.xhp=V.xhp;p.fmode=0;
    p.dash=V.dash/V.dashSp;p.dashSp=V.dashSp;p.dashX=Math.cos(p.ang);p.dashY=Math.sin(p.ang);p.inv=Math.max(p.inv,0.36);p.shieldOn=false;p.slideT=0;
    p.ultSlash=new Set();
    emit({k:'efx',z:'mirror',x:p.x,y:p.y,h:p.z,a:Math.round(p.ang*100)/100,id:p.id});
  }});
