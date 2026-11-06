// Full-room workload + actual live mesh/instance costs (not capacity * tris).
window.__benchMap='valley';window.__benchFrames=240;
window.__benchPaths=[0,1,2,6,7,8,0,1,2,6,7];
const budgets=[];window.__benchFrame=()=>{let actual=0,full=0,lowCount=0;for(const G of WD.mk.particles.state.groups.values())if(G.low){const n=G.mesh.geometry.index.count/3;actual+=n*G.mesh.count+G.low.geometry.index.count/3*G.low.count;full+=n*(G.mesh.count+G.low.count);lowCount+=G.low.count;}budgets.push({actual,full,lowCount});};
await eval(await (await fetch('tools/bench-bots.js',{cache:'no-store'})).text());
delete window.__benchFrame;
const models=new Map([...WD.mk.mesh].filter(([,v])=>v.geo).map(([k,v])=>[v.geo,k])),instances=[];
for(const G of WD.mk.particles.state.groups.values())if(G.low)models.set(G.low.geometry,models.get(G.mesh.geometry)+':small');
WD.scene.traverse(m=>{if(!m.isInstancedMesh||!m.count||!m.visible)return;
  const tris=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;
  instances.push({model:models.get(m.geometry)||m.name||'code',tris,active:m.count,totalTris:tris*m.count});});
instances.sort((a,b)=>b.totalTris-a.totalTris);
const players=[];for(const [id,o] of WD.PM3){const skins=new Set();let meshes=0;o.fileModel?.traverse(m=>{if(m.isMesh&&m.visible)meshes++;if(m.isSkinnedMesh)skins.add(m.skeleton);});players.push({id,meshes,skeletons:skins.size,cloth:!!o.cloth});}
const particleBudget=[];for(const G of WD.mk.particles.state.groups.values()){if(!G.low||!G.mesh.count&&!G.low.count)continue;
  const fullTris=G.mesh.geometry.index.count/3,lowTris=G.low.geometry.index.count/3;
  particleBudget.push({fullCount:G.mesh.count,lowCount:G.low.count,actualTriangles:G.mesh.count*fullTris+G.low.count*lowTris,allFullDetailTriangles:(G.mesh.count+G.low.count)*fullTris});}
return {bench:window.__bots,instances:instances.slice(0,12),players,particleBudget,allFrameBudgets:{actual:budgets.reduce((s,r)=>s+r.actual,0),full:budgets.reduce((s,r)=>s+r.full,0),peakLowCount:Math.max(...budgets.map(r=>r.lowCount))},pageErrors:HL.errs};
