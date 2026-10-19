// =====================================================================
//  สายน้ำแข็ง — ความเย็น: สะสม 3 ชั้น = แข็ง • ปิดจบด้วยหอกน้ำแข็ง (ยิ่งเย็นยิ่งแรง ถ้าแข็ง = แตก)
// =====================================================================
defSpell(1,{id:'frostforge',role:'utility',dual:1,n:'Frostforge',ic:'🪓',cd:18,d:'6 วิ: ประชิด = ดาบกลายเป็นขวานศึกน้ำแข็ง 20/20/40 ระยะ 160 จังหวะ 3 ฮีล 15 • ไกล = ก้อนน้ำแข็งใหญ่ระเบิด (วง ~100) 20 ดาเมจ ช้าลง 60% 2 วิ',fx:'ใช้ได้ทั้ง 2 โหมด สลับโหมดระหว่างบัฟได้ • คูลดาวน์ 12 วิหลังบัฟหมด • ฟาดจากที่สูงด้วยขวาน = 50',
  cast(p,S){p.ffT=6;emit({k:'efx',z:'forge',x:p.x,y:p.y,h:p.z+1,id:p.id});}});
defSpell(1,{id:'glacierrend',role:'control',dual:1,n:'Glacier Rend',ic:'🏔️',cd:10,d:'ประชิด: ชาร์จดาบ 1 วิ แล้วส่งคลื่นดาบ 30 ดาเมจ ไกล ~600 ทะลุหลายคน ทิ้งทางน้ำแข็ง • ไกล: ชาร์จ 1 วิ (ชี้มือไปที่เล็ง) แล้วยกมือขึ้น = ภูเขาน้ำแข็งแหลมพุ่งเป็นแนว ~700 สูงถึง ~8 เมตร 6 วิ เดินขึ้นไปได้',fx:'โดนภูเขาน้ำแข็ง = 15 ดาเมจ + แช่แข็ง 1 วิ + กระเด็นเล็กน้อย • อยู่บนที่สูงแล้วฟัน = กระโดดฟาดลงพื้น',
  cast(p,S){
    p.grT=1;p.grM=p.fmode===1?1:0;emit({k:'efx',z:'grcharge',x:p.x,y:p.y,h:p.z+1,id:p.id,m:p.grM});
  }});
// Glacier Rend โหมดไกล (หลังชาร์จ 1 วิ): ภูเขาน้ำแข็งแหลมพุ่งเป็นแนวตามทิศที่เล็งตอนปล่อย
function frostGlacier(p){
  const a=p.ang,c=Math.cos(a),s=Math.sin(a),grp=new Set();
  for(let d=70;d<=770;d+=45){const x=p.x+c*d,y=p.y+s*d;if(x<30||x>MW-30||y<30||y>MH-30)break;(G.glac||(G.glac=[])).push({x,y,r:52,a,H:1+7*(d-70)/700,h:0,age:0,delay:(d-70)/1400,t:6.3,team:p.team,owner:p.id,grp});}
  emit({k:'efx',z:'glacier',x:p.x+c*70,y:p.y+s*70,h:0,a:Math.round(a*1000)/1000,len:700,t:6.3,id:p.id});
}
defSpell(1,{id:'permafrost',role:'control',melee:1,n:'Permafrost',ic:'❄️',cd:16,d:'พื้นน้ำแข็งวงใหญ่รอบตัว (รัศมี ~300) 6 วิ: ศัตรูในวงช้าลง 20% ทันที (ซ้อนกับสลอว์ยิงปกติ สูงสุด 60%)',fx:'เราเดินในวงเร็ว +30% (ไม่ซ้อนกับไถลน้ำแข็ง) • ใช้ได้เฉพาะโหมดประชิด',
  cast(p,S){addIce({x:p.x,y:p.y,r:300,t:6,team:p.team,owner:p.id,kind:'ring'});emit({k:'efx',z:'perma',x:p.x,y:p.y,h:0.1,r:300});}});
defSpell(1,{id:'cryoshell',role:'utility',melee:1,n:'Cryo Shell',ic:'🧊',cd:28,d:'แช่แข็งตัวเอง 5 วิ: อมตะ ล้างดีบัฟทั้งหมด ฮีล 7.5/วิ (ขยับ/ตี/ร่ายไม่ได้ ยกเว้น Frostbite Aura)',fx:'กดซ้ำเพื่อออกก่อนได้ (ฮีลหยุด) • ใช้ได้เฉพาะโหมดประชิด',
  toggle(p){if(p.cryo>0){p.cryo=0;p.inv=0;emit({k:'efx',z:'cryoend',x:p.x,y:p.y,h:p.z+1,id:p.id});return true;}return false;},
  cast(p,S){
    for(const k of ['stun','slowT','chl','chlT','frz','shk','root','sil','fear','bld','mrk','burn','brn','brnT','xb','psn','psnT','heat','fsl','fslT','fslBigT','fslR','fslP','fslUltT','slip'])p[k]=0;
    p.cryo=5;p.cryoTk=0.5;p.inv=5;p.shieldOn=false;p.slideT=0;
    emit({k:'efx',z:'cryo',x:p.x,y:p.y,h:p.z+1,id:p.id});
  }});
defSpell(1,{id:'frostaura',role:'control',melee:1,n:'Frostbite Aura',ic:'🌨️',cd:15,d:'ออร่าเยือกแข็งรอบตัว 5 วิ (รัศมี ~180): 20 ดาเมจ/วิ (ไม่สลอว์)',fx:'ใช้ได้แม้ตอนแช่แข็งตัวเอง • ใช้ได้เฉพาะโหมดประชิด',
  cast(p,S){p.auraT=5;p.auraTk=0;emit({k:'efx',z:'aura',x:p.x,y:p.y,h:p.z,id:p.id});}});
defSpell(1,{id:'mirrorlegion',role:'ult',n:'Mirror Legion',ic:'👥',cd:0,ult:true,d:'เวทโบราณสายน้ำแข็ง: ร่างแยกน้ำแข็ง 2 ตัวโผล่ข้างตัว 10 วิ (ฟันตามเราทุกครั้ง ร่างละ 50%) + HP เสริม 100 • ดาเมจเรา ×2 • ฟันจังหวะ 3 ฮีล 15 (ขวาน 22)',fx:'ตอนเปิด: พุ่งไปข้างหน้า ~600 (อมตะ) พร้อมร่างแยก ฟันตลอดทาง 75 ดาเมจ + ช้าลง 80% 3 วิ',
  cast(p,S){
    p.mirror=10;p.xhp=100;p.fmode=0;
    p.dash=600/2000;p.dashSp=2000;p.dashX=Math.cos(p.ang);p.dashY=Math.sin(p.ang);p.inv=Math.max(p.inv,0.36);p.shieldOn=false;p.slideT=0;
    p.ultSlash=new Set();
    emit({k:'efx',z:'mirror',x:p.x,y:p.y,h:p.z,a:Math.round(p.ang*100)/100,id:p.id});
  }});
