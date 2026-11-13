// =====================================================================
//  Look 🌗 — พรีเซ็ตลุคของฉาก: แสงรอบตัวจากท้องฟ้า (IBL) + ความสว่าง + คอนทราสต์ + ย้อมสีเงา/ไฮไลต์ + โทนสี
//  (เฟส 1 ของแผนกราฟิกสมจริง, notes: graphics-realism-plan)
//  • 1 พรีเซ็ต = ชุดค่า (LOOK.P.<ชื่อ>) • แมพเลือกพรีเซ็ตได้ 3 ทาง (ลำดับความสำคัญ):
//      1) ฟิลด์ "look":"ชื่อ" ในไฟล์แมพ (assets/maps/<id>.json)   2) ตาราง LOOK.map = {รหัสแมพ:'ชื่อ'} ด้านล่าง
//      3) ค่าเริ่มต้นตามท้องฟ้า: ฟ้ากลางคืน → 'night' • ฟ้าเย็น/พระอาทิตย์ตก → 'dusk'
//  • เพิ่มพรีเซ็ตใหม่ = 1 บรรทัด: lookPreset('ชื่อ','night',{env:0.7,con:1.2,...})  (คัดลอกจากพรีเซ็ตเดิมแล้วทับเฉพาะที่ต่าง)
//    แล้วผูกกับแมพด้วย LOOK.map หรือ "look" ในไฟล์แมพ — ค่าทั้งหมดปรับสดได้ใน tune.html / F8 หมวด "🌗 Look" (คีย์ look.<ชื่อ>.<ฟิลด์>) แล้วเซฟลง assets/tune.json
//  • ราคา: แสงฟ้าถ่ายเป็น environment map (PMREM) ครั้งเดียวต่อพรีเซ็ต (~ms) • ปิดทั้งหมด: ?nolook
//  • เรียกจาก setSky (js/27) ทุกครั้งที่สร้างแมพ — lookMap(id,FM) (จาก js/28) บอกก่อนว่าเป็นแมพไหน
// =====================================================================
// ฟิลด์: sky = ท้องฟ้าที่ถ่ายเป็นแสง ('night'|'sunset') • warm = ทิศย้อมสี (false = เงาน้ำเงินเข้ม / true = เงาม่วงน้ำเงิน ไฮไลต์ส้ม)
//   env/tr/tg/tb = ความแรง + สีคูณของแสงฟ้า • hemi/amb = แสงครึ่งทรงกลม/รอบทิศเดิม • exp = ความสว่างภาพ • con = คอนทราสต์ (1 = เดิม)
//   split = ย้อมสีเงา/ไฮไลต์ • tone = 0 ACES (สดคม) / 1 AgX (นุ่มสมจริง สีจางกว่า)
//   dust/dustS/dustK/mist/mistA/mistS/mistH/mistL/mistK/flow = ฝุ่นลอย + หมอกลอยต่ำ (js/75-ambient.js: ปริมาณ/ขนาด/ความสว่าง/ความทึบ/ความสูงชั้นหมอก/ความเร็วตามลม)
//   rays = ลำแสงจากดวงจันทร์/อาทิตย์ (god rays, 0 = ปิด, เปิดเฉพาะกราฟิกสูง/อัตโนมัติที่เครื่องไหว) • haze/hazeK/hazeH = หมอกตามระยะ: ความเข้ม / ความหนา / ที่ต่ำหนากว่าที่สูงแค่ไหน
var LOOK={pm:null,env:{},cur:null,amb:null,off:/[?&]nolook\b/.test(location.search),
  P:{
    night:{sky:'night',warm:false,env:0.9,tr:0.62,tg:0.82,tb:1.35,hemi:0.2,amb:0.1,exp:1.0,con:1.15,split:0.12,tone:0,rays:0.5,haze:0.55,hazeK:1.4,hazeH:0.06,
      dust:0.45,dustS:0.7,dustK:0.9,mist:0.6,mistA:0.09,mistS:1,mistH:2.2,mistL:0.45,mistK:1.2,flow:1},
    dusk:{sky:'sunset',warm:true,env:1.0,tr:1.12,tg:1.0,tb:0.82,hemi:0.3,amb:0.1,exp:1.0,con:1.12,split:0.12,tone:0,rays:0.23,haze:0.55,hazeK:1.4,hazeH:0.06,
      dust:0.5,dustS:0.7,dustK:1.0,mist:0.4,mistA:0.07,mistS:1,mistH:2.0,mistL:0.3,mistK:1.1,flow:1}},
  map:{}};   // map: {รหัสแมพ:'ชื่อพรีเซ็ต'} — ว่าง = ใช้ค่าเริ่มต้นตามท้องฟ้า
function lookPreset(name,from,over){LOOK.P[name]=Object.assign({},LOOK.P[from],over||{});if(typeof lookRegister==='function')lookRegister(name);return LOOK.P[name];}
// แมพนี้ใช้พรีเซ็ตไหน (ถูกเรียกจาก js/28 ก่อน setSky) — เก็บใน globalThis เพราะ setSky รันก่อนไฟล์นี้ตอนโหลดโมดูลครั้งแรก
function lookMap(id,FM){globalThis.__lookMap={id,fm:FM&&FM.look};}
function lookName(day){const w=globalThis.__lookMap||{};return (w.fm&&LOOK.P[w.fm]&&w.fm)||(LOOK.map[w.id]&&LOOK.P[LOOK.map[w.id]]&&LOOK.map[w.id])||(day?'dusk':'night');}
function lookEnvFor(name){
  const P=LOOK.P[name],key=name+'|'+[P.sky,P.env,P.tr,P.tg,P.tb].join(',');
  if(LOOK.env[key])return LOOK.env[key];
  for(const k of Object.keys(LOOK.env))if(k.startsWith(name+'|')){LOOK.env[k].dispose();delete LOOK.env[k];}   // ค่าเก่าของพรีเซ็ตเดียวกัน (ลากสไลเดอร์) ทิ้ง
  if(!LOOK.pm)LOOK.pm=new THREE.PMREMGenerator(gl);
  const s=new THREE.Scene(),k=P.env;
  const mat=new THREE.MeshBasicMaterial({map:P.sky==='noon'?SKY.noon:P.sky==='sunset'?SKY.sunset:SKY.night,side:THREE.BackSide,color:new THREE.Color(k*P.tr,k*P.tg,k*P.tb),fog:false});
  const geo=new THREE.SphereGeometry(50,32,16);s.add(new THREE.Mesh(geo,mat));
  const rt=LOOK.pm.fromScene(s,0,0.1,200);geo.dispose();mat.dispose();
  return LOOK.env[key]=rt;}
function lookApply(day){
  if(!LOOK)return;SKY.day=day;
  if(LOOK.off){scene.environment=null;return;}
  const name=lookName(day),P=LOOK.P[name];LOOK.cur=name;
  scene.environment=lookEnvFor(name).texture;
  if(!LOOK.amb)LOOK.amb=scene.children.find(o=>o.isAmbientLight);
  hemi.intensity=P.hemi;if(LOOK.amb)LOOK.amb.intensity=P.amb;
  gl.toneMappingExposure=P.exp;
  const sp=P.split;GRADEU.uCon.value=P.con;
  if(P.warm){GRADEU.uLo.value.set(1-sp*0.4,1-sp*0.5,1+sp*0.6);GRADEU.uHi.value.set(1+sp*0.7,1+sp*0.15,1-sp*0.7);}   // เงาอมม่วงน้ำเงิน ไฮไลต์อมส้ม
  else{GRADEU.uLo.value.set(1-sp*0.7,1-sp*0.1,1+sp);GRADEU.uHi.value.set(1+sp*0.3,1+sp*0.1,1-sp*0.2);}   // เงาอมน้ำเงินเข้ม
  if(P.lo&&P.hi){GRADEU.uLo.value.set(P.lo[0],P.lo[1],P.lo[2]);GRADEU.uHi.value.set(P.hi[0],P.hi[1],P.hi[2]);}   // ย้อมสีกำหนดเอง (ลุคภาพวาด js/77)
  gl.toneMapping=P.tone?THREE.AgXToneMapping:THREE.ACESFilmicToneMapping;
  GFX.haze=P.haze;GFX.hazeK=P.hazeK;GFX.hazeH=P.hazeH;lookRays();
}
// ลำแสง: เปิดตามระดับกราฟิกเหมือน SSAO (สูง = เปิด / อัตโนมัติ = เปิดจนกว่าเครื่องเริ่มช้า / ประหยัด = ปิด)
function lookRays(){
  if(!LOOK||LOOK.off||!LOOK.cur){AOU.uRay.value=0;return;}
  const soft=QUAL.mode!=='low'&&!(QUAL.mode==='auto'&&QUAL.lvl>=2);
  AOU.uRay.value=soft&&(QUAL.mode==='high'||QUAL.lvl<1)?LOOK.P[LOOK.cur].rays:0;
}
const _lkV=new THREE.Vector3();
// ทุกเฟรม (จาก FXPass): ตำแหน่งดวงจันทร์/อาทิตย์บนจอ + ความจางเมื่ออยู่นอกจอ/หลังกล้อง
function lookRaysFrame(){
  if(!(AOU.uRay.value>0.001)){AOU.uSunVis.value=0;return;}
  const o=SKY.day?SKY.sun:SKY.moon;_lkV.copy(o.position).project(cam);
  const off=Math.max(Math.abs(_lkV.x),Math.abs(_lkV.y));
  AOU.uSunUV.value.set(_lkV.x*0.5+0.5,_lkV.y*0.5+0.5);AOU.uSunVis.value=_lkV.z<1?Math.max(0,Math.min(1,(1.7-off)/0.9)):0;
  AOU.uRayCol.value.copy(moonL.color);
}
function lookRefresh(){if(LOOK.cur)lookApply(!!SKY.day);}
// ---- ลงทะเบียนในเครื่องมือปรับค่า (js/73-tune.js): 1 หมวด "🌗 Look" แยกส่วนตามพรีเซ็ต ----
const LOOK_F={env:['ความแรงแสงฟ้า (IBL)',0,8,0.1],tr:['สีแสงฟ้า แดง',0,2,0.01],tg:['สีแสงฟ้า เขียว',0,2,0.01],tb:['สีแสงฟ้า น้ำเงิน',0,2,0.01],
  hemi:['แสงครึ่งทรงกลมเดิม',0,1.5,0.01],amb:['แสงรอบทิศ',0,1,0.01],exp:['ความสว่างภาพ (exposure)',0.5,2,0.01],con:['คอนทราสต์ (1 = เดิม)',0.8,1.6,0.01],
  rays:['ลำแสงจันทร์/อาทิตย์ (god rays, 0 = ปิด)',0,2,0.01],haze:['หมอกตามระยะ • ความเข้ม',0,1,0.01],hazeK:['หมอกตามระยะ • ความหนา',0,4,0.05],hazeH:['หมอก • ต่ำหนากว่าสูง (ยิ่งมากยิ่งต่างมาก)',0,0.4,0.005],
  dust:['ฝุ่นลอย • ปริมาณ (0–1)',0,1,0.01],dustS:['ฝุ่นลอย • ขนาด ×',0.2,4,0.05],dustK:['ฝุ่นลอย • ความสว่าง',0,3,0.05],
  mist:['หมอกลอยต่ำ • ปริมาณ (0–1)',0,1,0.01],mistA:['หมอกลอยต่ำ • ความทึบ',0,0.3,0.005],mistS:['หมอกลอยต่ำ • ขนาด ×',0.3,3,0.05],mistH:['หมอกลอยต่ำ • ความสูงชั้นหมอก',0.3,8,0.1],mistL:['หมอกลอยต่ำ • ผสมสีแสงหลัก (0 = สีหมอกล้วน)',0,1,0.01],mistK:['หมอกลอยต่ำ • ความสว่าง',0.3,4,0.05],flow:['ฝุ่น/หมอก • ความเร็วลอยตามลม ×',0,4,0.05],
  split:['ย้อมสีเงา/ไฮไลต์',0,0.4,0.01],tone:['โทนสี 0 = ACES สดคม / 1 = AgX นุ่มสมจริง',0,1,1]};
function lookRegister(name){const P=LOOK.P[name],sec='พรีเซ็ต "'+name+'" ('+(P.sky==='sunset'?'ฟ้าเย็น':'ฟ้ากลางคืน')+')';
  for(const f of Object.keys(LOOK_F))tuneNum(['look','🌗 Look (พรีเซ็ตแสง)'],sec,'look.'+name+'.'+f,LOOK_F[f][0],()=>P[f],v=>{P[f]=v;lookRefresh();},{min:LOOK_F[f][1],max:LOOK_F[f][2],step:LOOK_F[f][3]});}
for(const n of Object.keys(LOOK.P))lookRegister(n);
if(SKY.day!==undefined)lookApply(SKY.day);   // setSky ran earlier (map already built at load) → apply now
window.WD&&Object.assign(window.WD,{LOOK,lookPreset});
