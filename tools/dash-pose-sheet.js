// ภาพนิ่งท่าพุ่งทุกท่าใน DPOSE (js/72) ด้านข้าง + มุมเฉียง → shots/dash_poses.jpg
//  node tools/headless.js --game --js tools/dash-pose-sheet.js --timeout 200 --quiet   (&poses=run,hero ได้ทาง --url "index.html?nosw&poses=…")
const q=new URLSearchParams(location.search);
await HL.solo({kit:q.get('kit')||'0'});
for(let i=0;i<120;i++){HL.step(1);await HL.sleep(20);if(i>30&&!WD.warm.busy&&!WD.warm.q.length)break;}
HL.aim(0,0.12);HL.step(20);
const names=(q.get('poses')||Object.keys(WD.DPOSE).join(',')).split(','),cells=[];
for(const n of names){WD.DPDBG.pose=n;
  for(const cam of (q.get('cams')||'side,q34').split(',')){HL.cam(cam,{dist:+(q.get('dist')||4.2),h:1.0,look:[0,0.8,0.2]});HL.step(24);cells.push({c:HL.snap(+(q.get('w')||360)),label:n+' ('+cam+')'});}}
WD.DPDBG.pose=null;
return {images:{[q.get('out')||'dash_poses']:HL.sheet(cells,+(q.get('cols')||4),'DPOSE')}};
