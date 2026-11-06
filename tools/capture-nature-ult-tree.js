// Actual Model-tab stills. No effect binding, animation or gameplay writes.
const query=new URLSearchParams(location.search);
const variants=query.get('variant')==='all'?['a','b','c']:[query.get('variant')||'a'];
WD.gl.debug.checkShaderErrors=true;
await STUDIO.load('start/hit');
await STUDIO.ws('fx');STUDIO.pause();STUDIO.state.fx.layers=[];STUDIO.seek(0);
await STUDIO.ws('mesh');
const results=[];
for(const variant of variants){
const name='nature_ult_tree_'+variant;
const prefix=query.get('name')||(name+'_review');
if(!await STUDIO.mesh.open(name))throw new Error('Missing tree '+name);
STUDIO.mesh.view('mat');STUDIO.tick(3);
window.requestAnimationFrame=()=>0;
const M=STUDIO.mk.m;
M.wireOn=false;M.wire.visible=false;M.grid.visible=false;M.hi.visible=false;
M.obj.position.x=7.5;M.obj.castShadow=true;M.obj.receiveShadow=false;
const view=(eye,look)=>{
 if(STUDIO.mesh.name()!==name)throw new Error('Capture model changed');
 WD.camHook=c=>{c.position.copy(M.root.localToWorld(M.root.position.clone().set(...eye)));
  c.lookAt(M.root.localToWorld(M.root.position.clone().set(...look)));};
 STUDIO.tick(1);
};
const shots=[];
const shot=async(label,eye,look)=>{view(eye,look);await STUDIO.mesh.shot(prefix+'_'+label);shots.push(label);};
await shot('front',[7.1,5.7,18.8],[5.8,3.9,0]);
await shot('hero',[19.2,7.1,15.8],[6.0,3.5,0]);
if(!query.has('quick')){
 await shot('back',[-5.0,6.9,-16.3],[7.3,3.8,0]);
 await shot('side',[-10.2,5.6,1.3],[7.5,4.0,0]);
 await shot('roots',[13.6,3.3,8.4],[7.5,.9,.2]);
 await shot('heart',[11.6,4.1,5.8],[7.5,3.55,0]);
 await shot('crown',[14.1,9.4,9.0],[7.5,6.5,0]);
 await shot('top',[8.5,19.1,9.8],[7.5,.2,0]);
 STUDIO.mesh.view('clay');
 await shot('clay',[19.2,7.1,15.8],[6.0,3.5,0]);
}
WD.camHook=null;
results.push({model:name,shots,parts:STUDIO.mesh.data().parts.length,tris:STUDIO.mesh.tris(),
 lint:STUDIO.mesh.lint(),emissionAttribute:!!M.obj.geometry.getAttribute('aEmit'),
 note:'Unbound static Model draft. Real player shown for provisional scale.'});
}
return results;
