// รูปเทียบ 4 แบบต่อท่า ของ VFX ตัวเลือกรอบ 2 → designs/vfx-variants2/<กลุ่ม>-<ท่า>.jpg (ต้องเปิด python tools/serve.py ก่อน)
// ใช้: node tools/vfx-var2-sheets.js [fire-spark earth-punch ...]   (ไม่ใส่ = ทุกท่า ~1.5 นาที/ท่า)
const {execFileSync}=require('child_process'),path=require('path');
const S={ // [กลุ่ม, ท่า, เวลาในรูป, กล้อง, จุด]
 'fire-spark':['0.04,0.14,0.27,0.5','game','self'],'fire-fireball':['0.9,1.25,1.65,1.9','game','self'],'fire-shield':['0.3,1.0,1.25,2.0','side','self'],
 'fire-dash':['0.3,0.66,0.9,2.2','game','self'],'fire-kindle':['0.05,0.4,1.4,2.5','side','self'],'fire-dragonfall':['0.3,1.3,1.5,2.3','game','self'],
 'fire-ringofembers':['0.35,0.6,1.2,2.6','game','self'],'fire-blazeform':['0.05,0.4,1.5,3','side','self'],'fire-ignitionsnap':['0.05,0.22,0.38,0.8','game','self'],
 'fire-colossus':['0.1,0.8,2,3.2','front','self'],
 'earth-punch':['0.1,0.3,0.6,1','game','self'],'earth-chargeslam':['0.8,2.05,2.3,2.9','game','self'],'earth-shield':['0.2,1,1.25,2','front','self'],
 'earth-rampage':['0.3,0.8,1.25,2','game','self'],'earth-stonebreaker':['0.3,0.5,0.8,1.1','game','self'],'earth-mudswamp':['0.3,0.6,1.5,3','game','self'],
 'earth-tectoniccrush':['0.3,1.2,1.65,2.2','game','self'],'earth-dustburst':['0.5,1.15,2,3.5','game','self'],'earth-terraauger':['0.8,1.6,1.85,2.6','game','self'],
 'earth-wrath':['0.5,0.95,1.2,2.5','game','self']};
const want=process.argv.slice(2);
for(const [k,[sheet,cam,at]] of Object.entries(S)){if(want.length&&!want.includes(k))continue;const [g,m]=k.split('-');
  const fx=[1,2,3,4].map(i=>`var2-${g}/${m}_${i}`);
  try{execFileSync('node',[path.join(__dirname,'fx-compare.js'),'../vfx-variants2/'+k,...fx,'--sheet',sheet,'--cam',cam,'--at',at],{stdio:'inherit'});}catch(e){console.log('✗',k,e.message);}}
