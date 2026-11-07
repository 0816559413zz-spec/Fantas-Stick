// =====================================================================
//  Look 🌗 — แสงรอบตัวจากท้องฟ้า (IBL) + ค่าแสงส่วนรวมของฉาก (เฟส 1 ของแผนกราฟิกสมจริง, notes: graphics-realism-plan)
//  แสงรอบตัวเดิม = สีเรียบ (HemisphereLight + AmbientLight) → วัสดุ PBR (แมพ GLB / ตัวละคร / ของโลหะ-น้ำแข็ง) ไม่มีอะไรให้สะท้อน โลหะจึงดำ
//  ตอนนี้: ถ่ายท้องฟ้าไล่สี (SKY.night / SKY.sunset) เป็น environment map ครั้งเดียวต่อฟ้า (PMREM) → scene.environment
//    • ราคา: เสียครั้งเดียวตอนสร้าง (~ms) + วัสดุ Standard อ่านเท็กซ์เจอร์เพิ่มนิดเดียว • Lambert (หญ้า) ไม่ได้ผล
//  ปรับได้ใน tune.html / F8 หมวด "🌗 Look" (คีย์ look.*) • ปิดทั้งหมด: ?nolook
//  เรียกจาก setSky (js/27) ทุกครั้งที่เปลี่ยนฟ้า
// =====================================================================
var LOOK={pm:null,env:{},mode:null,amb:null,off:/[?&]nolook\b/.test(location.search),
  tint:{night:[0.62,0.82,1.35],day:[1.12,1.0,0.82]},   // สีที่คูณเข้าแสงฟ้า (กลางคืนอมน้ำเงิน / เย็นอมส้ม)
  v:{envNight:0.9,envDay:1.0,hemiNight:0.2,hemiDay:0.3,ambNight:0.1,ambDay:0.1,expNight:1.0,expDay:1.0,tone:0,conNight:1.15,conDay:1.12,splitNight:0.12,splitDay:0.12}};
function lookEnvFor(mode){
  const key=mode+'|'+LOOK.v[mode==='day'?'envDay':'envNight'];
  if(LOOK.env[key])return LOOK.env[key];
  for(const k of Object.keys(LOOK.env))if(k.startsWith(mode+'|')){LOOK.env[k].dispose();delete LOOK.env[k];}   // ค่าเก่าของฟ้าเดียวกัน (ลากสไลเดอร์) ทิ้ง
  if(!LOOK.pm)LOOK.pm=new THREE.PMREMGenerator(gl);
  const s=new THREE.Scene(),k=LOOK.v[mode==='day'?'envDay':'envNight'];
  const mat=new THREE.MeshBasicMaterial({map:mode==='day'?SKY.sunset:SKY.night,side:THREE.BackSide,color:new THREE.Color(k*LOOK.tint[mode][0],k*LOOK.tint[mode][1],k*LOOK.tint[mode][2]),fog:false});
  const geo=new THREE.SphereGeometry(50,32,16);s.add(new THREE.Mesh(geo,mat));
  const rt=LOOK.pm.fromScene(s,0,0.1,200);geo.dispose();mat.dispose();
  return LOOK.env[key]=rt;}
function lookApply(day){
  if(!LOOK)return;SKY.day=day;
  if(LOOK.off){scene.environment=null;return;}
  const V=LOOK.v,m=day?'day':'night';LOOK.mode=m;
  scene.environment=lookEnvFor(m).texture;
  if(!LOOK.amb)LOOK.amb=scene.children.find(o=>o.isAmbientLight);
  hemi.intensity=day?V.hemiDay:V.hemiNight;if(LOOK.amb)LOOK.amb.intensity=day?V.ambDay:V.ambNight;
  gl.toneMappingExposure=day?V.expDay:V.expNight;
  const con=day?V.conDay:V.conNight,sp=day?V.splitDay:V.splitNight;GRADEU.uCon.value=con;
  if(day){GRADEU.uLo.value.set(1-sp*0.4,1-sp*0.5,1+sp*0.6);GRADEU.uHi.value.set(1+sp*0.7,1+sp*0.15,1-sp*0.7);}   // เย็น: เงาอมม่วงน้ำเงิน ไฮไลต์อมส้ม
  else{GRADEU.uLo.value.set(1-sp*0.7,1-sp*0.1,1+sp);GRADEU.uHi.value.set(1+sp*0.3,1+sp*0.1,1-sp*0.2);}   // กลางคืน: เงาอมน้ำเงินเข้ม
  gl.toneMapping=V.tone?THREE.AgXToneMapping:THREE.ACESFilmicToneMapping;
}
function lookRefresh(){if(LOOK.mode)lookApply(LOOK.mode==='day');}
// ---- ลงทะเบียนในเครื่องมือปรับค่า (js/73-tune.js) ----
{const G=['look','🌗 Look (แสงทั้งฉาก)'],S1='แสงรอบตัวจากท้องฟ้า (IBL)',S2='แสงรอบ/ความสว่าง',L={
  envNight:['กลางคืน • ความแรงแสงฟ้า',0,8,0.1],envDay:['เย็น/กลางวัน • ความแรงแสงฟ้า',0,8,0.1],
  hemiNight:['กลางคืน • แสงครึ่งทรงกลมเดิม',0,1.5,0.01],hemiDay:['เย็น/กลางวัน • แสงครึ่งทรงกลมเดิม',0,1.5,0.01],
  ambNight:['กลางคืน • แสงรอบทิศ',0,1,0.01],ambDay:['เย็น/กลางวัน • แสงรอบทิศ',0,1,0.01],
  expNight:['กลางคืน • ความสว่างภาพ (exposure)',0.5,2,0.01],expDay:['เย็น/กลางวัน • ความสว่างภาพ (exposure)',0.5,2,0.01]};
  L.conNight=['กลางคืน • คอนทราสต์ (1 = เดิม)',0.8,1.6,0.01];L.conDay=['เย็น/กลางวัน • คอนทราสต์',0.8,1.6,0.01];
  L.splitNight=['กลางคืน • ย้อมสีเงา/ไฮไลต์',0,0.4,0.01];L.splitDay=['เย็น/กลางวัน • ย้อมสีเงา/ไฮไลต์',0,0.4,0.01];
  L.tone=['โทนสี: 0 = ACES (สดคมเหมือนเดิม) / 1 = AgX (นุ่มสมจริง สีจางกว่า)',0,1,1];
  for(const k of Object.keys(L))tuneNum(G,/^env/.test(k)?S1:S2,'look.'+k,L[k][0],()=>LOOK.v[k],v=>{LOOK.v[k]=v;lookRefresh();},{min:L[k][1],max:L[k][2],step:L[k][3]});}
if(SKY.day!==undefined)lookApply(SKY.day);   // setSky ran earlier (map already built at load) → apply now
