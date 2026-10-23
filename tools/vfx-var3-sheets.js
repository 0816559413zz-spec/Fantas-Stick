// รูปเทียบ 4 แบบต่อท่า ของ VFX ตัวเลือกรอบ 3 (น้ำแข็ง + สายฟ้า) → designs/vfx-variants3/<กลุ่ม>-<ท่า>.jpg (ต้องเปิด python tools/serve.py ก่อน)
// ใช้: node tools/vfx-var3-sheets.js [frost-sword storm-beam ...]   (ไม่ใส่ = ทุกท่า ~1.5 นาที/ท่า)
const {execFileSync}=require('child_process'),path=require('path');
const S={ // [เวลาในรูป, กล้อง, จุด] • ห้องโถงใหญ่ (greathall) — พื้นหินมืด ไม่มีหญ้าบังของบนพื้น (forest หญ้าบัง / test พื้นขาวกลืนสีเรือง)
 'frost-sword':['0.1,0.4,0.72,0.95','side','self'],'frost-icicle':['0.05,0.2,0.36,0.6','game','self'],'frost-shield':['0.3,1.0,1.25,2.0','side','self'],
 'frost-slide':['0.1,0.25,0.5,1.2','side','self'],'frost-frostforge':['0.4,0.9,1.25,1.6','side','self'],'frost-glacierrend':['0.6,1.1,1.5,2.4','game','self'],
 'frost-glacierridge':['0.6,1.2,1.5,2.6','game','self'],'frost-permafrost':['0.1,0.4,1.4,2.8','game','self'],'frost-cryoshell':['0.1,0.4,1.5,2.8','front','self'],
 'frost-frostaura':['0.1,0.5,1.5,2.8','game','self'],'frost-mirrorlegion':['0.1,0.5,1.5,2.8','front','self'],
 'storm-beam':['0.05,0.4,0.9,1.5','game','self'],'storm-tri':['0.05,0.2,0.38,0.6','game','self'],'storm-shield':['0.3,1.0,1.25,2.0','side','self'],
 'storm-dash':['0.05,0.15,0.25,0.6','side','self'],'storm-thunderline':['0.3,0.6,0.75,1.2','game','self'],'storm-speedsiphon':['0.1,0.3,0.7,1.2','game','self'],
 'storm-triplestrike':['0.3,0.63,1.12,1.65','game','self'],'storm-stormorbs':['0.5,1.4,1.6,1.9','side','self'],'storm-railgun':['0.4,0.82,0.95,1.3','game','self'],
 'storm-stormdome':['0.8,1.35,1.6,2.8','game','self'],'storm-godlightning':['0.05,0.3,1.2,2.6','front','self']};
const want=process.argv.slice(2);
for(const [k,[sheet,cam,at]] of Object.entries(S)){if(want.length&&!want.includes(k))continue;const [g,m]=k.split('-');
  const fx=[1,2,3,4].map(i=>`var3-${g}/${m}_${i}`);
  try{execFileSync('node',[path.join(__dirname,'fx-compare.js'),'../vfx-variants3/'+k,...fx,'--sheet',sheet,'--cam',cam,'--at',at,'--map','greathall'],{stdio:'inherit'});}catch(e){console.log('✗',k,e.message);}}
