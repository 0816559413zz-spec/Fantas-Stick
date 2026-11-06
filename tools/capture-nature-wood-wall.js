// Studio Model tab only. Offset the preview to leave the real player visible.
// The Model tab URL finishes loading after Studio.state.ready. Wait for that
// async selection before issuing commands, or its default model can overwrite
// a later shot while /api/shot is being awaited.
const target=new URLSearchParams(location.search).get('model')||'nature_wood_wall_study';
WD.gl.debug.checkShaderErrors=true;
if(new URLSearchParams(location.search).has('mesh')){
 for(let i=0;i<300&&STUDIO.mesh.name()!==target;i++)
  await new Promise(r=>setTimeout(r,100));
 if(STUDIO.mesh.name()!==target)throw new Error('Model tab URL did not finish loading');
}
// Studio.ready can precede the initial effect fetch on a busy machine.
// Explicitly await a valid temporary effect before clearing its layers.
await STUDIO.load('start/hit');
if(!STUDIO.state.fx)throw new Error('Temporary FX failed to load');
await STUDIO.ws('fx');
STUDIO.pause();
// Empty the temporary effect so the model study has no aura/debris overlays.
STUDIO.state.fx.layers=[];
STUDIO.seek(0);
await STUDIO.ws('mesh');
if(!await STUDIO.mesh.open(target))throw new Error('Cannot open wall model');
STUDIO.mesh.view('mat');
STUDIO.tick(3);
window.requestAnimationFrame=()=>0;
const M=STUDIO.mk.m;
const prefix=new URLSearchParams(location.search).get('name')||'nature_wood_wall_r7';
M.wireOn=false;M.wire.visible=false;M.grid.visible=false;
M.obj.position.x=5.8;
M.obj.castShadow=true;M.obj.receiveShadow=false;
const view=(x,y,z,look=[4.6,1.45,0])=>{
 if(STUDIO.mesh.name()!==target)throw new Error('Model changed during capture');
 WD.camHook=c=>{
  const pos=M.root.localToWorld(M.root.position.clone().set(x,y,z));
  const target=M.root.localToWorld(M.root.position.clone().set(...look));
  c.position.copy(pos);c.lookAt(target);
 };
 STUDIO.tick(1);
};
view(5.3,3.3,12.2);
await STUDIO.mesh.shot(prefix+'_front');
view(11.0,4.3,10.0);
await STUDIO.mesh.shot(prefix+'_oblique');
view(8.0,2.4,5.8,[5.8,.4,.3]);
await STUDIO.mesh.shot(prefix+'_roots');
view(8.0,8.0,7.5,[5.3,1.0,-.25]);
await STUDIO.mesh.shot(prefix+'_arc');
view(6.5,4.4,4.7,[5.8,3.2,-.1]);
await STUDIO.mesh.shot(prefix+'_crown');
WD.camHook=null;
return {model:STUDIO.mesh.name(),parts:STUDIO.mesh.data().parts.length,
 tris:STUDIO.mesh.tris(),lint:STUDIO.mesh.lint(),
 note:'Wall r7: low attached foliage motifs and wood thorns at crest/upper boughs; Model only.'};
