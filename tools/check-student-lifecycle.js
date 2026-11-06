// In-game cloth, death/respawn and repeated match disposal for batched skins.
// node tools/headless.js --game --js tools/check-student-lifecycle.js --timeout 180 --quiet
await WD.loadModel('char_student');await HL.solo({kit:'0'});
const reports=[];
for(let cycle=0;cycle<3;cycle++){
  for(let i=0;i<600;i++){HL.step(1);if(WD.G.ph==='play'&&!WD.warm.busy&&!WD.warm.q.length)break;await HL.sleep(15);}
  HL.step(10);const o=HL.o(),p=HL.me();
  if(!o.fileModel||!o.cloth)throw new Error('file model or local cloth missing');
  const batch=o.fileModel.getObjectByName('student_skin_batch');if(!batch)throw new Error('player not batched');
  const skins=new Set();o.fileModel.traverse(m=>{if(m.isSkinnedMesh)skins.add(m.skeleton);});if(skins.size!==1)throw new Error('skeleton not shared');
  WD.G.tr.god=0;WD.G.tr.datk=0;p.inv=0;WD.damage(p,10000,null,'aoe');HL.step(2);
  if(p.alive||!o.rag)throw new Error('death/ragdoll not exercised');
  for(let i=0;i<420&&!p.alive;i++){HL.step(1);if(i%30===0)await HL.sleep(0);}
  p.inv=0;HL.step(10);if(!p.alive||o.rag||!o.cloth.mo.visible)throw new Error('respawn/cloth failed '+JSON.stringify({alive:p.alive,rag:!!o.rag,clothVisible:o.cloth.mo.visible,ph:WD.G.ph,respawn:p.respawn}));
  let disposed=0;batch.geometry.addEventListener('dispose',()=>disposed++);const skeleton=batch.skeleton;
  WD.hostToLobby();HL.step(2);
  if(WD.PM3.size||skeleton.boneTexture||disposed!==1)throw new Error('player resources not released '+JSON.stringify({players:WD.PM3.size,texture:!!skeleton.boneTexture,disposed}));
  reports.push({cycle,cloth:true,respawn:true,mergedGeometryDisposed:disposed,skeletonTextureReleased:true});
  if(cycle<2)WD.hostStart();
}
if(HL.errs.length)throw new Error(JSON.stringify(HL.errs));
return {pass:true,reports};
