// ถ่ายภาพป่าของแมพ fcs (เฟส 1) ในเกมจริง (headless) — ใช้: python tools/serve.py แล้ว
//   node tools/headless.js --game --url "index.html?nosw" --js tools/fcs-forest-shots.js --w 1280 --h 640 --quiet --timeout 280
// ได้ shots/fcsf_<ชื่อ>.jpg + shots/fcsf_sheet.jpg • แก้ SHOTS ได้ [ชื่อ, ช่อง x,y ของกล้อง, สูงจากพื้น(ม.), ช่อง x,y เป้า, สูงเป้า, fov?]
document.getElementById('btnSolo').click();
for(let i=0;i<40&&WD.screen!=='lobby';i++)await HL.sleep(100);
WD.G.mode='siege';
for(let i=0;i<5;i++)WD.lobbyBotAdd(-1,1);
WD.hostStart();
for(let i=0;i<80&&WD.screen!=='game';i++)await HL.sleep(100);
await HL.sleep(300);HL.freeze();
for(let i=0;i<400&&WD.G.ph!=='play';i++)HL.step(1);
const sg=WD.sg&&WD.sg();if(sg&&sg.S)sg.S.prep=0;
HL.step(30);
// รอโมเดลป่า (InstancedMesh จาก gorge.glb) โหลดเสร็จ
let inst=0;for(let i=0;i<300&&!inst;i++){HL.step(2);await HL.sleep(100);WD.scene.traverse(o=>{if(o.userData&&o.userData.ffGroup)inst=o.userData.ffGroup.children.length;});}
HL.step(60);
const C=90,MW=140*C,MH=50*C,tx=cx=>(cx*C-MW/2)/20,tz=cy=>(cy*C-MH/2)/20,gy=(cx,cy)=>WD.terrT(cx*C,cy*C);
const SHOTS=window.__SHOTS||[
  ['01_spawn_view',3.2,41,1.8,10,28,3,60],
  ['02_trail_mid',8,31,1.8,14,20,4,58],
  ['03_toward_core',13,22,2.0,18,12,4,58],
  ['04_core_closeup',15.6,17.2,2.0,18.5,12.5,3,60],
  ['05_slope_rocks',19,31,2.6,9,26,3,62],
  ['06_ferns_low',5.5,27,1.0,13,26,2,64],
  ['07_far_trees',2,9,2.0,24,18,5,64],
  ['08_castle_edge',21,12.5,2.0,30,14,4,62],
  ['09_overview_high',14,52,75,14,18,0,58],
  ['10_gorge_look',9,35,1.7,16,22,9,50],
];
const images={},cells=[];
for(const [name,cx,cy,h,tcx,tcy,th,fov] of SHOTS){
  const ey=gy(cx,cy)+h,ty=gy(tcx,tcy)+th,f=fov||58;
  WD.camHook=cam=>{cam.fov=f;cam.updateProjectionMatrix();cam.position.set(tx(cx),ey,tz(cy));cam.lookAt(tx(tcx),ty,tz(tcy));};
  const fg=WD.scene.fog,f0=fg&&fg.far;if(fg&&name.includes('overview'))fg.far=900;
  HL.step(10);
  images['fcsf_'+name]=HL.snap(1280).toDataURL('image/jpeg',0.9);
  cells.push({c:HL.snap(640),label:name});if(fg)fg.far=f0;
}
images['fcsf_sheet']=HL.sheet(cells,3,'Castle Strike forest');
let tris=0;WD.scene.traverse(o=>{if(o.isMesh&&o.visible){const g=o.geometry;tris+=(g.index?g.index.count:g.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});
return {map:WD.G.map,mode:WD.G.mode,inst,tris:Math.round(tris),errs:HL.errs,info:WD.gl.info.render,images};
