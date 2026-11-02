// ตรวจกล้องผ่านเกมจริงทีละสาย รวมทุกสกิลที่สลับใส่ช่องได้
// node tools/headless.js --game --url "index.html?nosw&camPath=8" --js tools/check-camera.js --timeout 240 --quiet
// ?camOnly=basic,shield จำกัดชุด • ?camTag=before เปลี่ยนชื่อภาพ • กากบาทแสดงกลางภาพ 3D (ไม่รวมคำใบ้ปลดเมาส์ของ headless)
const Q=new URLSearchParams(location.search),path=Number(Q.get('camPath')||0),T=WD.THREE;
const pathName=WD.PATHS[path].id,only=(Q.get('camOnly')||'').split(',').filter(Boolean),animation=Q.has('anim');
await HL.solo({kit:String(path)});
for(let i=0;i<160;i++){HL.step(1);await HL.sleep(30);if(i>30&&!WD.warm.busy&&!WD.warm.q.length)break;}
await HL.sleep(1000);HL.step(30);
const ray=new T.Raycaster(),cells=[],results=[],failures=[];
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
function inspect(label){
 const me=HL.me(),o=HL.o(),cam=WD.cam,body=o.fileModel||o.g;
 cam.updateMatrixWorld(true);body.updateWorldMatrix(true,true);
 ray.setFromCamera(new T.Vector2(0,0),cam);
 const hits=ray.intersectObject(body,true).filter(h=>visible(h.object)&&[].concat(h.object.material||[]).some(m=>m.visible&&m.opacity>0.5));
 const p=o.g.position.clone().add(new T.Vector3(0,1.5,0)).project(cam);
 const dir=cam.getWorldDirection(new T.Vector3()),finite=[...cam.position.toArray(),...dir.toArray(),p.x,p.y].every(Number.isFinite);
 const r={label,screenX:+((p.x+1)/2).toFixed(3),screenY:+((1-p.y)/2).toFixed(3),selfHits:hits.length,finite,forward:+dir.x.toFixed(3)};
 if(!finite||(!animation&&dir.x<0.5))failures.push({label,reason:'camera invalid or facing away',...r});
 if(hits.length&&!animation)failures.push({label,reason:'own character blocks center ray',...r});
 if(animation){r.pose=[o.armR.rotation.x,o.armR.rotation.z,o.armL.rotation.x,o.armL.rotation.z,o.b.rotation.x,o.b.rotation.y,o.b.rotation.z,o.legs[0].rotation.x,o.legs[1].rotation.x,o.legs[0].rotation.z,o.legs[1].rotation.z].map(v=>+v.toFixed(3));if(!r.pose.every(Number.isFinite))failures.push({label,reason:'invalid character pose'});}
 if(path===6&&!animation){
  // ตรวจของที่อยู่หลังตัวละครตามแนวราบ; หมัด/กระสุนที่ปล่อยไปด้านหน้าเป็นภาพการโจมตี ไม่ใช่ Stand ที่คั่นกล้อง
  const near=ray.intersectObjects(WD.scene.children,true).filter(h=>(h.point.x-o.g.position.x)*ray.ray.direction.x+(h.point.z-o.g.position.z)*ray.ray.direction.z<0&&visible(h.object)&&[].concat(h.object.material||[]).some(m=>m.visible&&m.opacity>0.8));
  r.nearOccluders=near.length;if(near.length)failures.push({label,reason:'opaque mesh blocks Earth center view before character',count:near.length});
 }
 if(o.wWings&&o.wWings.visible){let all=0,drawn=0;o.wWings.traverse(m=>{if(m.isMesh){all++;if(m.layers.test(cam.layers))drawn++;}});r.wingMeshes=drawn;if(all&&!drawn)failures.push({label,reason:'wing attachment hidden after model load'});}
 results.push(r);
 const c=HL.snap(400),cx=c.getContext('2d'),x=c.width/2,y=c.height/2;
 cx.strokeStyle='#fff';cx.lineWidth=2;cx.beginPath();cx.moveTo(x-6,y);cx.lineTo(x+6,y);cx.moveTo(x,y-6);cx.lineTo(x,y+6);cx.stroke();
 cells.push({c,label});
}
async function reset(spell){
 HL.cam(null);
 HL.input({fire:0,sh:0,dh:0,hq:0,u:0,d:0,l:0,r:0,jh:0,ch:0});
 WD.hostToLobby();
 const p=HL.me();p.inp=WD.INPUT;WD.setKit(p,spell&&!spell.ult?path+'.'+spell.i:String(path));p.kt=p.kit;WD.broadcastLobby();
 WD.hostStart();if(WD.G.tr){WD.G.tr.datk=0;WD.G.tr.god=1;}
 for(let i=0;i<85;i++){HL.step(1,0.05);if(i%20===0)await HL.sleep(0);}
 HL.aim(0,0.12);HL.step(24);HL.dummy(220,35);
 p.lst=5;p.ult=100;if(Q.has('camGod'))WD.castUlt(p);if(Q.has('camRanged'))p.fmode=1;
 for(const k in p.cd)p.cd[k]=0;
 const foe=WD.G.en.find(e=>e.dummy)||WD.G.en[0];if(foe){foe.brn=3;foe.brnT=10;}
 if(animation){p.inp={...WD.INPUT,c:{...WD.INPUT.c},ax:p.x+220,ay:p.y,ah:1.2,gx:p.x+220,gy:p.y};HL.cam('q34',{dist:4.7,h:2.1,look:[0,1.25,0]});}
 return p;
}
async function action(name,spell){
 const p=await reset(spell),I=animation?p.inp:WD.INPUT;
 let ok=true;
 if(name==='basic'||name==='charged')I.fire=1;
 else if(name==='shield')I.sh=1;
 else if(name==='dash'||name==='long_dash'){I.dh=1;I.c.sp++;}
 else if(name==='ranged'){p.fmode=1;I.fire=1;}
 else if(name==='enhanced'){p.emp=1;I.fire=1;}
 else if(name==='ult_basic'||name==='ult_enhanced'){WD.castUlt(p);p.cEmp=name==='ult_enhanced'?1:0;I.fire=1;}
 else if(name==='shield_charge'){p.wg=100;I.sh=1;I.fire=1;}
 else if(spell){I.hq=1;ok=spell.ult?WD.castUlt(p):WD.castSlot(p,0);}
 if(ok===false&&!p.aug&&!p.ramp&&!p.ecb){failures.push({label:name,reason:'cast rejected'});return;}
 const shots=name==='dragondeep'?[0.2,2.0,5.1]:name==='abyssalbeam'?(animation?[0.3,1.2,1.8,3.4,5.2]:[0.3,1.8,3.0]):name==='eyeofheaven'&&animation?[0.4,1.0,2.4,3.6]:name==='long_dash'?[1.2,3.8,4.6]:name==='charged'?[0.5,1.9,2.4]:name==='terraauger'?[0.3,2.1,4.8]:[0.2,0.8,1.8];
 let j=0;
 for(let f=0;f<Math.ceil((shots[shots.length-1]+0.05)*60);f++){
  const time=f/60;
  if(name==='basic'&&(path===0||path===6))I.fire=f%24<5?1:0;   // สองสายนี้ยิง/ต่อยตอนปล่อยคลิก; กดค้างอย่างเดียวจะเป็นชาร์จ
  if(name==='dash'&&f===25)I.dh=0;
  if(name==='long_dash'&&f===245)I.dh=0;
  if(name==='charged'&&f===125)I.fire=0;
  if(name==='dragondeep'&&f===160)I.fire=1;
  if(name==='wrath'&&f===85)I.fire=1;
  if(name==='dragonfall'&&f===80)I.fire=1;
  if(name==='stormdome'&&f===80)I.fire=1;
  if(name==='aegisgale'&&f===35)I.fire=1;
  if(name==='terraauger'&&f===280)I.hq=0;
  if(name==='wing_flick'&&f===60)WD.castSlot(p,0);
  HL.step(1);
  if(animation&&name==='abyssalbeam'&&p.wab&&p.wab.ph==='fire'&&HL.o().armR.rotation.x>-0.9)failures.push({label:name,reason:'channel returned to idle before beam ended',time});
  if(j<shots.length&&time>=shots[j]){inspect(name+' '+shots[j].toFixed(1)+'s');j++;}
  if(f%24===0)await HL.sleep(0);
 }
 if(animation&&name==='abyssalbeam'&&Math.abs(HL.o().armR.rotation.x+0.35)>0.3)failures.push({label:name,reason:'channel pose did not recover after beam ended',arm:HL.o().armR.rotation.x});
}
const actions=['basic','shield','dash'];
if(path===0)actions.push('charged','long_dash');
if(path===6)actions.push('charged');
if(path===1)actions.push('ranged');
if(path===2)actions.push('enhanced','ult_basic','ult_enhanced');
if(path===7&&animation)actions.push('wing_flick','shield_charge');
for(const a of actions)if(!only.length||only.includes(a))await action(a,a==='wing_flick'?WD.SPELLS.featherwing:null);
for(const s of WD.SPELL_LIST.filter(s=>s.path===path))if(!only.length||only.includes(s.id))await action(s.id,s);
const errors=[...new Set(HL.errs)];
if((failures.length||errors.length)&&!Q.has('camInspect'))throw new Error('CAMERA_REVIEW '+JSON.stringify({path:pathName,failures,errors}));
const images={[(animation?'animation_':'camera_')+pathName+'_'+(Q.get('camTag')||'review')]:HL.sheet(cells,3,(animation?'Animation / ':'Camera / ')+pathName)};
if(path===6){const preview=[['basic 0.8s','ปกติ'],['shield 0.8s','ยกโล่'],['charged 1.9s','ชาร์จโจมตี'],['wrath 0.8s','อัลติ']].map(([key,label])=>{const s=cells.find(c=>c.label===key);return s?{c:s.c,label}:null;}).filter(Boolean);if(preview.length)images.camera_earth_center_preview=HL.sheet(preview,2,'Earth — กล้องกลางหลังยกสูง');}
return {path:pathName,animation,pass:!failures.length&&!errors.length,results,failures,errors,images};
