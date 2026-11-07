// Clean material-review rig using the actual Studio-built geometry and shader.
// Separate lighting from gameplay; original in-map captures remain available.
WD.gl.debug.checkShaderErrors=true;
await STUDIO.load('start/hit');
await STUDIO.ws('fx');STUDIO.pause();STUDIO.state.fx.layers=[];STUDIO.seek(0);
await STUDIO.ws('mesh');STUDIO.tick(2);window.requestAnimationFrame=()=>0;
const T=WD.THREE,gl=WD.gl;
const rig=new T.Scene();rig.background=new T.Color('#13221b');
rig.add(new T.HemisphereLight('#d8f4dc','#19271c',2.0));
const key=new T.DirectionalLight('#fff1d9',3.0);key.position.set(4,12,8);
key.castShadow=true;key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-10,right:10,top:12,bottom:-10,near:.5,far:35});
key.shadow.bias=-.0003;key.shadow.normalBias=.035;key.shadow.camera.updateProjectionMatrix();rig.add(key);
const fill=new T.DirectionalLight('#9bd5b8',1.3);fill.position.set(-6,5,-7);rig.add(fill);
const floor=new T.Mesh(new T.CircleGeometry(25,96),
 new T.MeshStandardMaterial({color:'#293b2b',roughness:.95}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.035;floor.receiveShadow=true;rig.add(floor);
const me=HL.o().g,old={parent:me.parent,pos:me.position.clone(),rot:me.quaternion.clone()};
rig.add(me);me.position.set(-7,0,1);me.rotation.set(0,.18,0);
const cam=new T.PerspectiveCamera(35,gl.domElement.width/gl.domElement.height,.1,100);
const mapping=gl.toneMapping,exposure=gl.toneMappingExposure;
gl.toneMapping=T.ACESFilmicToneMapping;gl.toneMappingExposure=1.0;
const images={},metrics=[];
try{
 for(const variant of ['scaffold']){
  await STUDIO.mesh.open('nature_ult_tree_'+variant);STUDIO.mesh.view('mat');
  const M=STUDIO.mk.m,tree=new T.Mesh(M.obj.geometry,M.obj.material);
  tree.castShadow=true;tree.receiveShadow=false;rig.add(tree);
  const views=[['hero',[40,18,52],[0,13.7,0]],['front',[.2,16,64],[0,13.7,0]],
   ['side',[-64,16,.6],[0,13.7,0]],['back',[-40,18,-52],[0,13.7,0]],
   ['roots',[15,8,20],[0,3,0]],['heart',[8,9,12],[0,7.5,0]]];
  for(const [label,eye,look] of views){
   cam.position.set(...eye);cam.lookAt(...look);rig.updateMatrixWorld(true);
   gl.setRenderTarget(null);gl.render(rig,cam);
   images['nature_tree_'+variant+'_material_'+label]=gl.domElement.toDataURL('image/jpeg',.94);
  }
  metrics.push({name:STUDIO.mesh.name(),triangles:M.obj.geometry.userData.tris});
  rig.remove(tree);
 }
}finally{
 old.parent.add(me);me.position.copy(old.pos);me.quaternion.copy(old.rot);
 gl.toneMapping=mapping;gl.toneMappingExposure=exposure;
 floor.geometry.dispose();floor.material.dispose();key.shadow.map?.dispose();
}
return {images,metrics,note:'Actual Studio meshes; isolated material-review lighting, not gameplay lighting.'};
