// Validate opt-in solid-model emission, legacy materials and actual GPU compile.
// Runtime instances here are temporary test objects; no skill bindings are saved.
const assert=(yes,msg)=>{if(!yes)throw new Error(msg);};
WD.gl.debug.checkShaderErrors=true;
const build=WD.mk.build;
const same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
for(const name of ['poly_horn','nature_wood_wall_v1']){
 const d=await(await fetch('assets/fx/mesh/'+name+'.mesh.json')).json();
 const a=build(d),b=build({...d,parts:d.parts.map(p=>({...p,emit:0,seamNormals:false}))});
 assert(!a.getAttribute('aEmit')&&!b.getAttribute('aEmit'),'legacy emission opt-in: '+name);
 for(const key of Object.keys(a.attributes))
  assert(same(a.getAttribute(key).array,b.getAttribute(key).array),'legacy geometry changed: '+name+'/'+key);
 assert(same(a.index.array,b.index.array),'legacy indices changed');a.dispose();b.dispose();
}
const mixed=build({parts:[{id:'light',k:'box',emit:2,col:'#80ef60'},
 {id:'wood',k:'box',pos:[2,0,0]},
 {id:'off',k:'box',off:true,emit:5},
 {id:'clamped',k:'box',pos:[4,0,0],emit:99}]});
const e=mixed.getAttribute('aEmit');
assert(e&&e.count===mixed.getAttribute('position').count,'emission attribute length');
assert(e.getX(0)===2&&e.array.some(v=>v===0)&&e.getX(e.count-1)===5,'emission fill/clamp');
mixed.dispose();
const off=build({parts:[{id:'box',k:'box',emit:0},{id:'off',k:'box',off:true,emit:2}]});
assert(!off.getAttribute('aEmit'),'hidden emitting part activates material');off.dispose();
// UV seam vertices must shade together without collapsing UVs or positions.
const tube={id:'seam',k:'tube',path:[[0,0,0],[0,1,0],[.4,2,0]],seg:8,sides:8,flat:false};
const raw=build({parts:[tube]}),smooth=build({parts:[{...tube,seamNormals:true}]});
for(const k of ['position','uv','aPiv','aOrd'])
 assert(same(raw.getAttribute(k).array,smooth.getAttribute(k).array),'seam smoothing altered '+k);
assert(same(raw.index.array,smooth.index.array),'seam smoothing altered topology');
const groups=new Map(),p=smooth.getAttribute('position'),n=smooth.getAttribute('normal');
for(let i=0;i<p.count;i++){
 const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(',');
 const prev=groups.get(key);
 if(prev!==undefined)assert(Math.abs(n.getX(i)-n.getX(prev))+Math.abs(n.getY(i)-n.getY(prev))+Math.abs(n.getZ(i)-n.getZ(prev))<1e-5,'UV seam remains hard');
 else groups.set(key,i);
}
assert(groups.size<p.count,'seam fixture has no duplicate positions');raw.dispose();smooth.dispose();
const flat=build({parts:[{...tube,flat:true}]}),flatOpt=build({parts:[{...tube,flat:true,seamNormals:true}]});
assert(same(flat.getAttribute('normal').array,flatOpt.getAttribute('normal').array),'seam option overrides explicit flat');flat.dispose();flatOpt.dispose();

await STUDIO.load('start/hit');
await STUDIO.ws('fx');STUDIO.pause();STUDIO.state.fx.layers=[];STUDIO.seek(0);
await STUDIO.ws('mesh');
const summaries=[];
for(const variant of ['a','b','c']){
 const name='nature_ult_tree_'+variant;
 assert(await STUDIO.mesh.open(name),'cannot open '+name);STUDIO.mesh.view('mat');
 const M=STUDIO.mk.m,g=M.obj.geometry;
 assert(M.obj.material.userData.fxBark&&M.obj.material.userData.fxEmission,'Model material missing');
 assert(g.userData.tris<=30000,'tree exceeds actual triangle budget');
 for(const [key,attr] of Object.entries(g.attributes))
  assert(attr.array.every(Number.isFinite),name+' has nonfinite '+key);
 assert(Math.max(...g.index.array)<g.getAttribute('position').count,'index outside geometry');
 assert(!STUDIO.mesh.lint().some(x=>x.lv==='err'),'recipe lint errors');
 STUDIO.tick(1);
 for(const grow of [undefined,1]){
  const layer={id:'test',t:'mesh',life:1,shape:'model',model:name,mat:'solid'};
  if(grow!==undefined)layer.grow=grow;
  const I=WD.fx.start({v:1,layers:[layer]},{x:WD.G.players.me.x,y:WD.G.players.me.y,a:0},'tree_model_check');
  WD.fx.update(.1);STUDIO.tick(1);
  const s=I.L[0],m=s.mats&&s.mats[0];
  assert(m&&m.userData.fxBark&&m.userData.fxEmission,'runtime material lost patch');
  assert(s.inner.geometry.getAttribute('aEmit'),'runtime/grow lost emission');
  WD.fx.kill(I);
 }
 STUDIO.mesh.view('clay');STUDIO.tick(1);
 assert(!M.obj.material.userData.fxEmission,'clay incorrectly uses emission');
 summaries.push({name,parts:STUDIO.mesh.data().parts.length,tris:g.userData.tris,
  emittingParts:STUDIO.mesh.data().parts.filter(p=>p.emit>0).length});
}
await STUDIO.mesh.open('nature_wood_wall_v1');STUDIO.mesh.view('mat');STUDIO.tick(1);
assert(STUDIO.mk.m.obj.material.userData.fxBark,'wall bark lost');
assert(!STUDIO.mk.m.obj.material.userData.fxEmission,'approved wall acquired emission shader');
assert(STUDIO.mk.m.obj.material.customProgramCacheKey()==='fx-model-bark-v2','wall shader key changed');
await STUDIO.mesh.open('poly_horn');STUDIO.mesh.view('mat');STUDIO.tick(1);
assert(!STUDIO.mk.m.obj.material.userData.fxEmission&&!STUDIO.mk.m.obj.material.userData.fxBark,'legacy shader changed');
assert(STUDIO.mk.m.obj.material.flatShading,'legacy flat shading lost');

// Repeated edits/reopens should replace GPU allocations rather than accumulate.
const memory=[];
for(let i=0;i<7;i++){
 await STUDIO.mesh.open('nature_ult_tree_'+['a','b','c'][i%3]);STUDIO.mesh.view('mat');STUDIO.tick(1);
 memory.push({geometries:WD.gl.info.memory.geometries,textures:WD.gl.info.memory.textures});
}
const tail=memory.slice(2);
assert(Math.max(...tail.map(x=>x.geometries))-Math.min(...tail.map(x=>x.geometries))<=2,'Model geometries accumulate');
return {legacyUnchanged:['poly_horn','nature_wood_wall_v1'],mixedEmission:true,seamNormals:true,
 models:summaries,runtime:['default','grown'],clay:true,reopenMemory:memory};
