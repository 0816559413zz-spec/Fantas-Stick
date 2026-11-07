// Clean material-review rig using the actual Studio-built geometry and shader.
// Separate lighting from gameplay; original in-map captures remain available.
WD.gl.debug.checkShaderErrors=true;
await STUDIO.load('start/hit');
await STUDIO.ws('fx');STUDIO.pause();STUDIO.state.fx.layers=[];STUDIO.seek(0);
await STUDIO.ws('mesh');STUDIO.tick(2);window.requestAnimationFrame=()=>0;
const T=WD.THREE,gl=WD.gl;
const rig=new T.Scene();rig.background=new T.Color('#13221b');
rig.add(new T.HemisphereLight('#d8f4dc','#19271c',.8));
const key=new T.DirectionalLight('#d8f4dc',1.8);key.position.set(4,12,8);
key.castShadow=true;key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-10,right:10,top:12,bottom:-10,near:.5,far:35});
key.shadow.bias=-.0003;key.shadow.normalBias=.035;key.shadow.camera.updateProjectionMatrix();rig.add(key);
const fill=new T.DirectionalLight('#9bd5b8',.8);fill.position.set(-6,5,-7);rig.add(fill);
const floor=new T.Mesh(new T.CircleGeometry(25,96),
 new T.MeshStandardMaterial({color:'#293b2b',roughness:.95}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.035;floor.receiveShadow=true;rig.add(floor);
const me=HL.o().g,old={parent:me.parent,pos:me.position.clone(),rot:me.quaternion.clone()};
rig.add(me);me.position.set(-7,0,1);me.rotation.set(0,.18,0);
const cam=new T.PerspectiveCamera(35,gl.domElement.width/gl.domElement.height,.1,100);
const mapping=gl.toneMapping,exposure=gl.toneMappingExposure;
const shadowsEnabled=gl.shadowMap.enabled;
gl.toneMapping=T.ACESFilmicToneMapping;gl.toneMappingExposure=1.0;
const comp=WD.post.composer,passes=comp.passes,passState=passes.map(p=>p.enabled);
const renderPass=passes.find(p=>p.constructor.name==='RenderPass'),bloom=WD.post.bloom;
const postOld={scene:renderPass.scene,camera:renderPass.camera,strength:bloom.strength,
 radius:bloom.radius,threshold:bloom.threshold};
const images={},metrics=[];
const neonOnly=new URLSearchParams(location.search).has('neononly');
try{
 for(const variant of [new URLSearchParams(location.search).has('branches')?'branches_v1':'woven_v1']){
  await STUDIO.mesh.open('nature_ult_tree_'+variant);STUDIO.mesh.view('mat');
  const M=STUDIO.mk.m,tree=new T.Mesh(M.obj.geometry,M.obj.material);
  const g=M.obj.geometry;
  for(const [key,attr] of Object.entries(g.attributes))
   if(!attr.array.every(Number.isFinite))throw new Error('Nonfinite model attribute: '+key);
  const vertexCount=g.getAttribute('position').count;
  if(!g.index.array.every(i=>i>=0&&i<vertexCount))throw new Error('Model index outside vertex range');
  if(!g.getAttribute('aEmit')||!M.obj.material.userData.fxEmission)throw new Error('Missing authored emission');
  if(STUDIO.mesh.lint().some(x=>x.lv==='err'))throw new Error('Model recipe lint error');
  g.computeBoundingBox();
  const scaffold=WD.mk.build(await(await fetch('assets/fx/mesh/nature_ult_tree_scaffold_v1.mesh.json')).json());
  scaffold.computeBoundingBox();
  const original=scaffold.boundingBox.getSize(new T.Vector3()),size=g.boundingBox.getSize(new T.Vector3());
  for(const axis of ['x','y','z'])if(size[axis]>original[axis]*1.06||size[axis]<original[axis]*.88)
   throw new Error('Woven model silhouette drift: '+axis);
  scaffold.dispose();
  tree.castShadow=true;tree.receiveShadow=false;rig.add(tree);
  const params=new URLSearchParams(location.search);
  const summon=params.has('summon');
  if(params.has('protection')){
   // Review-only scene: one ally crosses the sample boundary while an enemy
   // remains inside. The sample radius is for staging the visual.
   gl.shadowMap.enabled=false;tree.castShadow=false;
   floor.material.color.set('#18291f');
   rig.background.set('#10241c');
   const zoneRadius=9;
   const hitReview=params.has('hitreview');
   const neonRoots=params.has('neonroots');
   const waistMix=tree.material.userData.natureWaist;
   const originalMix=waistMix?.value;
   // Keep the older roots-only comparison isolated when explicitly requested.
   if(waistMix&&neonRoots&&!params.has('neonbody'))waistMix.value=0;
   const neonBody=waistMix?.value===1;
   const boundary=new T.Mesh(new T.RingGeometry(zoneRadius-.045,zoneRadius+.045,96),
    new T.MeshBasicMaterial({color:'#399668',transparent:true,opacity:.40,side:T.DoubleSide,depthWrite:false}));
   boundary.rotation.x=-Math.PI/2;
   boundary.position.y=.015;
   rig.add(boundary);
   const cloneAvatar=()=>WD.MODELS.lib?.SU.clone(me)??me.clone(true);
   const actors=[
    {avatar:cloneAvatar(),team:'ally',x:-5.8,z:4.1},
    {avatar:cloneAvatar(),team:'ally',x:3.9,z:6.2,moves:true},
    {avatar:cloneAvatar(),team:'enemy',x:6.3,z:1.5}
   ];
   me.visible=false;
   const outlineMat=new T.MeshStandardMaterial({
    color:0x000000,emissive:'#16ff39',emissiveIntensity:1.45,
    side:T.BackSide,depthWrite:false
   });
   const pixelSize=new T.Vector2(6.4/gl.domElement.width,6.4/gl.domElement.height);
   outlineMat.onBeforeCompile=shader=>{
    shader.uniforms.uOutlinePixel={value:pixelSize};
    shader.vertexShader='uniform vec2 uOutlinePixel;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
     #include <project_vertex>
     vec2 edge=transformedNormal.xy;
     gl_Position.xy+=edge/max(length(edge),0.0001)*uOutlinePixel*gl_Position.w;
    `);
   };
   const outlineMeshes=avatar=>{
    const sources=[];
    avatar.traverse(node=>{
     if(node.isMesh&&node.geometry?.getAttribute('normal')&&!Array.isArray(node.material)
       &&node.material?.visible!==false&&(!node.material?.transparent||node.material.opacity>.85)){
      sources.push(node);
     }
    });
    return sources.map(source=>{
     const shell=source.clone(false);
     shell.position.set(0,0,0);
     shell.quaternion.identity();
     shell.scale.setScalar(1);
     shell.material=outlineMat;
     shell.renderOrder=1;
     shell.castShadow=false;
     source.add(shell);
     return shell;
    });
   };
   const auraCanvas=document.createElement('canvas');
   auraCanvas.width=auraCanvas.height=64;
   const auraContext=auraCanvas.getContext('2d');
   const auraGradient=auraContext.createRadialGradient(32,32,2,32,32,32);
   auraGradient.addColorStop(0,'rgba(28,255,64,0.40)');
   auraGradient.addColorStop(.55,'rgba(25,232,70,0.24)');
   auraGradient.addColorStop(1,'rgba(8,195,50,0)');
   auraContext.fillStyle=auraGradient;
   auraContext.fillRect(0,0,64,64);
   const auraTexture=new T.CanvasTexture(auraCanvas);
   let rootTexture=auraTexture;
   if(neonRoots){
    const coreCanvas=document.createElement('canvas');
    coreCanvas.width=coreCanvas.height=64;
    const ctx=coreCanvas.getContext('2d');
    const falloff=ctx.createRadialGradient(32,32,0,32,32,32);
    falloff.addColorStop(0,'rgba(255,255,255,.92)');
    falloff.addColorStop(.16,'rgba(255,255,255,.80)');
    falloff.addColorStop(.42,'rgba(160,255,181,.34)');
    falloff.addColorStop(1,'rgba(58,255,103,0)');
    ctx.fillStyle=falloff;
    ctx.fillRect(0,0,64,64);
    rootTexture=new T.CanvasTexture(coreCanvas);
   }
   const branchCollar=new T.Vector3();
   const rootMotes=Array.from({length:24},(_,i)=>{
    const angle=i*2.39996;
    const radius=2.6+(i%6)*1.04;
    const target=new T.Vector3(Math.cos(angle)*radius,.45,Math.sin(angle)*radius);
    const sprite=new T.Sprite(new T.SpriteMaterial({
     map:rootTexture,color:new T.Color(neonRoots?'#32ff65':i%4===0?'#cdffad':'#66f875')
      .multiplyScalar(neonRoots?2.65:1.7),
     transparent:true,depthWrite:false,blending:T.AdditiveBlending
    }));
    rig.add(sprite);
    return {target,origin:new T.Vector3(),distance:Infinity,sprite};
   });
   const vertices=g.getAttribute('position');
   let nearest=Infinity;
   for(let i=0;i<vertices.count;i++){
    const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i);
    const distance=x*x+(y-13.4)**2+z*z;
    if(distance<nearest){nearest=distance;branchCollar.set(x,y,z);}
    if(y<0||y>2.6)continue;
    for(const mote of rootMotes){
     const d=(x-mote.target.x)**2+(z-mote.target.z)**2+(y-mote.target.y)**2*.6;
     if(d<mote.distance){mote.distance=d;mote.origin.set(x,y,z);}
    }
   }
   const collarFlash=new T.Sprite(new T.SpriteMaterial({
    map:auraTexture,color:'#baff8c',transparent:true,depthWrite:false,blending:T.AdditiveBlending
   }));
   collarFlash.position.copy(branchCollar).add(new T.Vector3(0,.12,.48));
   rig.add(collarFlash);
   for(const actor of actors){
    rig.add(actor.avatar);
    actor.avatar.position.set(actor.x,0,actor.z);
    actor.avatar.rotation.y=actor.team==='enemy'?-1.8:.1;
    actor.outline=actor.team==='ally'?outlineMeshes(actor.avatar):[];
    if(actor.team==='ally'){
     actor.aura=new T.Sprite(new T.SpriteMaterial({
      map:auraTexture,transparent:true,depthWrite:false,blending:T.AdditiveBlending
     }));
     actor.aura.position.set(0,.85,-.13);
     actor.aura.scale.set(1.95,2.55,1);
     actor.avatar.add(actor.aura);
     actor.sparks=Array.from({length:16},()=>{
      const spark=new T.Sprite(new T.SpriteMaterial({
       map:auraTexture,color:'#a0ff9a',transparent:true,depthWrite:false,
       blending:T.AdditiveBlending
      }));
      actor.aura.parent.add(spark);
      return spark;
     });
     actor.threadMaterial=new T.ShaderMaterial({
      uniforms:{uTime:{value:0},uOffset:{value:actor.moves?.35:0},uHitProgress:{value:-2}},
      transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
      vertexShader:`varying vec2 vThreadUv;
       void main(){vThreadUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`uniform float uTime,uOffset,uHitProgress;varying vec2 vThreadUv;
       void main(){
        float along=vThreadUv.x;
        float flow=pow(0.5+0.5*cos(24.0*(along+uOffset)-uTime*6.4),9.0);
        float hitDistance=(along-uHitProgress)/0.085;
        float hit=exp(-hitDistance*hitDistance);
        float core=(0.29+0.37*flow)*smoothstep(0.0,0.055,along);
        vec3 green=mix(vec3(0.04,0.74,0.18),vec3(0.24,1.0,0.36),flow);
        gl_FragColor=vec4(green+vec3(0.62,2.1,0.43)*hit,min(1.0,core+hit*0.75));
       }`
     });
     actor.thread=new T.Mesh(new T.BufferGeometry(),actor.threadMaterial);
     rig.add(actor.thread);
    }
   }
   const setWide=()=>{cam.position.set(2,18.5,52);cam.lookAt(0,13.2,1);};
   const setDetail=()=>{cam.position.set(1,10.5,24);cam.lookAt(.3,3.7,2.8);};
   const setHitView=()=>{cam.position.set(.9,12.2,34);cam.lookAt(0,7.7,2.2);};
   setWide();
   passes.forEach(p=>p.enabled=['RenderPass','UnrealBloomPass','OutputPass'].includes(p.constructor.name));
   renderPass.scene=rig;renderPass.camera=cam;
   bloom.strength=.24;bloom.radius=.18;bloom.threshold=.8;
   const protectedCounts=new Set();
   const first=Number(params.get('first')??0);
   const last=Math.min(100,first+Number(params.get('count')??100));
   for(let frame=first;frame<last;frame++){
    const t=frame/20;
    const travel=hitReview?(t-.56)/.52:-2;
    const flashAge=t-1.08;
    collarFlash.visible=hitReview&&flashAge>=0&&flashAge<.40;
    if(collarFlash.visible){
     collarFlash.scale.set(3.2+flashAge*5,2.2+flashAge*4,1);
     collarFlash.material.opacity=.95*(1-flashAge/.40)**2;
    }
    for(const [i,mote] of rootMotes.entries()){
     const life=1.25+(i%5)*.17;
     const age=(t/life+i*.417)%1;
     const {origin,sprite}=mote;
     const drift=1-.27*age;
     const curl=.16*age*Math.sin(i*2.399+age*3.1);
     sprite.position.set(origin.x*drift+curl,origin.y+.10+(1.35+(i%4)*.45)*age,
      origin.z*drift-curl);
     sprite.scale.set(.16+(i%3)*.065,.45+(i%4)*.12,1);
     sprite.material.opacity=Math.sin(Math.PI*age)**1.6*(i%4===0?.82:.52);
     sprite.material.rotation=.12*Math.sin(i+age*4);
    }
    let count=0;
    for(const actor of actors){
     if(actor.moves)actor.avatar.position.x=actor.x+3*(.5-.5*Math.cos(t*Math.PI*2/5));
     const p=actor.avatar.position;
     const protectedAlly=actor.team==='ally'&&Math.hypot(p.x,p.z)<=zoneRadius;
     for(const shell of actor.outline)shell.visible=protectedAlly;
     if(!actor.thread)continue;
     actor.aura.visible=protectedAlly;
     const struck=hitReview&&!actor.moves&&travel>=0&&travel<.3;
     actor.aura.material.opacity=.27+.07*Math.sin(t*3.4+(actor.moves?1:0))+(struck?.55*(1-travel/.3):0);
     actor.thread.visible=protectedAlly;
     for(const [i,spark] of actor.sparks.entries()){
      spark.visible=protectedAlly;
      if(!protectedAlly)continue;
      const life=.59+(i%4)*.11;
      const age=(t/life+i*.382)%1;
      const angle=i*2.399+age*.61;
      const radius=.46+.27*(i%3)/2+.17*age;
      spark.position.set(Math.cos(angle)*radius,.12+2.5*age,Math.sin(angle)*radius);
      spark.scale.set(.13+(i%3)*.042,.25+(i%4)*.078,1);
      spark.material.opacity=Math.sin(Math.PI*age)*(.65+(i%3)*.17);
      spark.material.rotation=-Math.cos(angle)*.19;
     }
     if(!protectedAlly)continue;
     count++;
     const attach=new T.Vector3(p.x,2.10,p.z);
     const side=Math.sign(p.x);
     const path=new T.CubicBezierCurve3(attach,
      new T.Vector3(p.x+side*2.5,5.6,p.z*1.04),
      new T.Vector3(p.x*.73,13.7,p.z*.38),branchCollar);
     actor.thread.geometry.dispose();
     actor.thread.geometry=new T.TubeGeometry(path,48,.063,6,false);
     actor.threadMaterial.uniforms.uTime.value=t;
     actor.threadMaterial.uniforms.uHitProgress.value=actor.moves?-2:travel;
    }
    protectedCounts.add(count);
    if(hitReview)setHitView();
    else if(params.has('detailonly'))setDetail();
    rig.updateMatrixWorld(true);comp.render();
    const protectionShot=hitReview?'tree_protection_hit':params.has('detailonly')?'tree_protection_sparks':'tree_protection';
    const shotName=protectionShot+(neonRoots?'_neon':'')+(neonBody?'_body':'');
    images['motion_'+shotName+'_'+String(frame).padStart(3,'0')]=gl.domElement.toDataURL('image/jpeg',.93);
    if(waistMix&&params.has('comparebody')){
     const previousMix=waistMix.value;
     const source=gl.domElement;
     const panelWidth=Math.min(source.width,Math.round(source.height*.78));
     const panelHeight=source.height;
     const sheet=document.createElement('canvas');
     const header=37,gap=8;
     sheet.width=panelWidth*2+gap;sheet.height=panelHeight+header;
     const ctx=sheet.getContext('2d');
     ctx.fillStyle='#101c16';ctx.fillRect(0,0,sheet.width,sheet.height);
     cam.position.set(.4,9.3,27);cam.lookAt(0,6.6,0);
     for(const [index,label] of ['รุ่นฐาน','เร่งนีออนกลางลำต้น'].entries()){
      waistMix.value=index;
      comp.render();
      const x=index*(panelWidth+gap);
      ctx.drawImage(source,(source.width-panelWidth)/2,0,panelWidth,panelHeight,x,header,panelWidth,panelHeight);
      ctx.fillStyle=index?'#79fca0':'#d5e7d9';ctx.font='bold 19px sans-serif';
      ctx.fillText(label,x+13,26);
     }
     waistMix.value=previousMix;
     images.tree_neon_body_comparison=sheet.toDataURL('image/jpeg',.95);
    }
    if(params.has('detail')){
     setDetail();
     comp.render();
     images['tree_protection_detail_'+String(frame).padStart(3,'0')]=gl.domElement.toDataURL('image/jpeg',.93);
     setWide();
    }
   }
   me.visible=true;
   if(waistMix)waistMix.value=originalMix;
   outlineMat.dispose();auraTexture.dispose();
   if(neonRoots)rootTexture.dispose();
   collarFlash.material.dispose();
   rootMotes.forEach(mote=>mote.sprite.material.dispose());
   boundary.geometry.dispose();boundary.material.dispose();
   for(const actor of actors){
    actor.thread?.geometry.dispose();actor.threadMaterial?.dispose();actor.aura?.material.dispose();
    actor.sparks?.forEach(spark=>spark.material.dispose());
    rig.remove(actor.avatar);
   }
   return {images,protectedCounts:[...protectedCounts],enemyOutlined:false};
  }
  if(params.has('motion')||summon){
   // Static model stays untouched; this review deforms a cloned geometry.
   tree.geometry=g.clone();const mg=tree.geometry;
   const pos=mg.getAttribute('position'),emit=mg.getAttribute('aEmit');
   const originalPos=pos.array.slice(),originalEmit=emit.array.slice();
   const clamp=value=>Math.max(0,Math.min(1,value));
   const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
   const revealTime={value:0};
   const arrival=new Float32Array(pos.count);
   if(summon){
    for(let i=0;i<pos.count;i++){
     const x=originalPos[i*3],y=originalPos[i*3+1],z=originalPos[i*3+2];
     const r=Math.hypot(x,z),a=Math.atan2(z,x);
     const rootSpread=.055*r*(1-smooth((y-2)/2));
     const branchSpread=.061*r*smooth((y-9)/4);
     arrival[i]=.20+.167*y+rootSpread+branchSpread+.10*Math.sin(a*3-y*1.05)*smooth(y/3);
    }
    mg.setAttribute('aArrival',new T.BufferAttribute(arrival,1));
    const sourceMat=tree.material;
    tree.material=sourceMat.clone();
    tree.material.customProgramCacheKey=()=>sourceMat.customProgramCacheKey()+'|woven-summon';
    tree.material.onBeforeCompile=(shader,renderer)=>{
     sourceMat.onBeforeCompile(shader,renderer);
     shader.uniforms.uRevealTime=revealTime;
     shader.vertexShader='attribute float aArrival;\nvarying float vArrival;\n'+shader.vertexShader;
     shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvArrival=aArrival;');
     shader.fragmentShader='uniform float uRevealTime;\nvarying float vArrival;\n'+shader.fragmentShader;
     shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',
      '#include <clipping_planes_fragment>\nif(vArrival>uRevealTime) discard;');
    };
   }
   key.castShadow=false;tree.castShadow=false;gl.shadowMap.enabled=false;
   floor.material.color.set('#101d15');
   const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
   const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);
   gradient.addColorStop(0,'rgba(130,255,100,1)');gradient.addColorStop(.18,'rgba(50,230,65,.65)');gradient.addColorStop(1,'rgba(0,180,40,0)');
   ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
   const texture=new T.CanvasTexture(canvas),motes=[];
   for(let j=0;j<18;j++){
    const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
    rig.add(sprite);motes.push(sprite);
   }
   // Each luminous tail wraps behind its moving tip and narrows as it cools.
   const ribbons=[];
   if(summon){
    for(let j=0;j<3;j++){
     const geometry=new T.BufferGeometry();
     geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(41*6),3));
     const faces=[];
     for(let k=0;k<40;k++)faces.push(k*2,k*2+1,k*2+2,k*2+1,k*2+3,k*2+2);
     geometry.setIndex(faces);
     const material=new T.MeshBasicMaterial({color:new T.Color('#38fb55').multiplyScalar(2.2),side:T.DoubleSide,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
     const ribbon=new T.Mesh(geometry,material);ribbon.frustumCulled=false;
     rig.add(ribbon);ribbons.push(ribbon);
    }
   }
   passes.forEach(p=>p.enabled=['RenderPass','UnrealBloomPass','OutputPass'].includes(p.constructor.name));
   renderPass.scene=rig;renderPass.camera=cam;bloom.strength=.4;bloom.radius=.12;bloom.threshold=.8;
   const close=params.has('close');
   cam.position.set(...(close?[25,24,36]:summon?[23,17,48]:[36,19,55]));cam.lookAt(0,close?20:13.7,0);
   const weaveRadius=y=>1.13+.72*Math.exp(-y*.40)+.71*smooth((y-9)/5);
   const firstFrame=Number(params.get('first')??0);
   const endFrame=Math.min(summon?144:120,firstFrame+Number(params.get('count')??144));
   for(let frame=firstFrame;frame<endFrame;frame++){
    const time=frame/20,cycle=time*Math.PI/3;
    revealTime.value=time;
    const frontY=clamp((time-.2)/2.46)*14.7;
    const headAngle=time*5.8;
    const weaveFade=smooth((time-.28)/.28)*(1-smooth((time-2.62)/.35));
    for(const [j,ribbon] of ribbons.entries()){
     ribbon.visible=weaveFade>.001;
     if(!ribbon.visible)continue;
     ribbon.material.opacity=weaveFade*(j===0?.76:.50);
     const ribbonPos=ribbon.geometry.getAttribute('position');
     for(let k=0;k<=40;k++){
      const tail=k/40,angle=headAngle+j*Math.PI*2/3-tail*3.55;
      const y=Math.max(.08,frontY-tail*3.15-j*.21);
      const radius=weaveRadius(y)+.24*tail;
      const width=.26*(1-tail)**1.4;
      ribbonPos.setXYZ(k*2,Math.cos(angle)*radius,y-width,Math.sin(angle)*radius);
      ribbonPos.setXYZ(k*2+1,Math.cos(angle)*radius,y+width,Math.sin(angle)*radius);
     }
     ribbonPos.needsUpdate=true;
    }
    for(let i=0;i<pos.count;i++){
     const x=originalPos[i*3],y=originalPos[i*3+1],z=originalPos[i*3+2];
     const radius=Math.hypot(x,z),height=Math.max(0,(y-14)/13);
     const flex=height*height*Math.min(1,radius/7);
     const phase=cycle+Math.atan2(z,x)*.7+y*.18;
     pos.array[i*3]=x+flex*.19*Math.sin(phase);
     pos.array[i*3+1]=y+flex*.11*Math.sin(phase-.7);
     pos.array[i*3+2]=z+flex*.14*Math.cos(phase-.4);
     const wave=Math.pow(.5+.5*Math.cos(y*.65-cycle*2-radius*.19),5);
     emit.array[i]=originalEmit[i]*(.68+wave*.85);
     if(summon){
      const age=time-arrival[i];
      const turning=(1-smooth(age/.58))*smooth(y/3)*(1-smooth((y-12)/3));
      const angle=turning*.83;
      pos.array[i*3]=x*Math.cos(angle)-z*Math.sin(angle)+flex*.19*Math.sin(phase);
      pos.array[i*3+2]=x*Math.sin(angle)+z*Math.cos(angle)+flex*.14*Math.cos(phase-.4);
      emit.array[i]*=smooth(age/.32);
     }
    }
    pos.needsUpdate=true;emit.needsUpdate=true;
    for(let j=0;j<motes.length;j++){
     const progress=(time/6+j/18)%1,angle=j*2.399;
     const r=6+(j%5)*1.4;
     motes[j].position.set(Math.cos(angle)*r+Math.sin(cycle+j)*.25,17+(j%4)*1.6+progress*4,Math.sin(angle)*r);
     motes[j].material.opacity=Math.sin(progress*Math.PI)*.45;
     motes[j].scale.setScalar(.12+.08*Math.sin(progress*Math.PI));
     if(summon&&time<3.05&&j<3){
      const y=Math.max(.08,frontY-j*.21),angle=headAngle+j*Math.PI*2/3;
      const r=weaveRadius(y);
      motes[j].position.set(Math.cos(angle)*r,y,Math.sin(angle)*r);
      motes[j].material.opacity=weaveFade*.92;
      motes[j].scale.setScalar(.84);
     }else if(summon&&time<3.05){
      const age=(time*2.5+j*.171)%1;
      const turn=headAngle+(j%3)*Math.PI*2/3-age*2.4;
      const y=Math.max(.1,frontY-age*2.55),scatter=1.32+.95*age;
      motes[j].position.set(Math.cos(turn)*scatter,y,Math.sin(turn)*scatter);
      motes[j].material.opacity=weaveFade*Math.sin(age*Math.PI)*.87;
      motes[j].scale.setScalar(.20+.17*(1-age));
     }else if(summon)motes[j].material.opacity*=smooth((time-3.6)/1.2);
    }
    rig.updateMatrixWorld(true);comp.render();
    images['motion_tree_'+(summon?'summon':close?'crown':'alive')+'_'+String(frame).padStart(3,'0')]=gl.domElement.toDataURL('image/jpeg',.92);
   }
   mg.dispose();texture.dispose();
   motes.forEach(mote=>mote.material.dispose());
   ribbons.forEach(ribbon=>{ribbon.geometry.dispose();ribbon.material.dispose();});
   if(summon)tree.material.dispose();
   return {images,note:summon?'7.2-second summon study with a moving weave front, three spiral trails, sparks and idle settle.':'6-second loop, actual model geometry; subtle crown sway, travelling emission and round rising motes.'};
  }
  const views=[['hero',[40,18,52],[0,13.7,0]],['front',[.2,16,64],[0,13.7,0]],
   ['side',[-64,16,.6],[0,13.7,0]],['back',[-40,18,-52],[0,13.7,0]],
   ['roots',[15,8,20],[0,3,0]],['heart',[8,12,12],[0,9,0]],['crown',[25,24,36],[0,21,0]],
   ['junction',[13,16,19],[0,13.5,0]]];
  if(!neonOnly){
   for(const [label,eye,look] of views){
    cam.position.set(...eye);cam.lookAt(...look);rig.updateMatrixWorld(true);
    gl.setRenderTarget(null);gl.render(rig,cam);
    images['nature_tree_'+variant+'_material_'+label]=gl.domElement.toDataURL('image/jpeg',.94);
   }
  }
  // Second set: the same authored model through the game's actual bloom pass.
  // Disable map fog/AO/grading so this still reviews the tree rather than a map.
  passes.forEach(p=>p.enabled=['RenderPass','UnrealBloomPass','OutputPass'].includes(p.constructor.name));
  renderPass.scene=rig;renderPass.camera=cam;
  bloom.strength=.90;bloom.radius=.52;bloom.threshold=.38;
  for(const [label,eye,look] of views.filter(v=>['front','heart','junction','crown'].includes(v[0]))){
   cam.position.set(...eye);cam.lookAt(...look);rig.updateMatrixWorld(true);
   comp.render();
   images['nature_tree_'+variant+'_neon_'+label]=gl.domElement.toDataURL('image/jpeg',.94);
  }
  passes.forEach((p,i)=>p.enabled=passState[i]);
  Object.assign(renderPass,{scene:postOld.scene,camera:postOld.camera});
  Object.assign(bloom,{strength:postOld.strength,radius:postOld.radius,threshold:postOld.threshold});
  metrics.push({name:STUDIO.mesh.name(),triangles:g.userData.tris,vertices:vertexCount,
   size:size.toArray(),materialGroups:STUDIO.mesh.data().parts.length,finiteAttributes:true,
   validIndices:true,emission:true,scaffoldBoundsPreserved:true});
  rig.remove(tree);
 }
}finally{
 passes.forEach((p,i)=>p.enabled=passState[i]);
 Object.assign(renderPass,{scene:postOld.scene,camera:postOld.camera});
 Object.assign(bloom,{strength:postOld.strength,radius:postOld.radius,threshold:postOld.threshold});
 old.parent.add(me);me.position.copy(old.pos);me.quaternion.copy(old.rot);
 gl.toneMapping=mapping;gl.toneMappingExposure=exposure;
 gl.shadowMap.enabled=shadowsEnabled;
 floor.geometry.dispose();floor.material.dispose();key.shadow.map?.dispose();
}
return {images,metrics,note:'Actual Studio mesh. Material views use isolated lighting; neon views add only the game bloom pass.'};
