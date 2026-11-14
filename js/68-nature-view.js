// Snapshot-driven Nature models plus short-lived effects from host combat events.
const NAT_VIEW=new Map(),NAT_MARKS=new Map(),NAT_MOTION=[];
const natV=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const natWorld=(x,y,h)=>natV(tx(x),GY(x,y)+h,tz(y));
const natPhase=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const natSmooth=k=>k*k*(3-2*k);
const natEase=t=>t<0?0:t>1?1:t*t*(3-2*t);   // clamped, like ease() in tools/nature-preview.js
const natOut=k=>1-(1-k)**2;
const natStd=(color,options={})=>new THREE.MeshStandardMaterial({color,roughness:.8,...options});
function natAdd(obj,parent){(parent||scene).add(obj);return obj;}
function natMesh(geometry,material,parent){return natAdd(new THREE.Mesh(geometry,material),parent);}
function natRing(color,inner=.92){
  return new THREE.Mesh(new THREE.RingGeometry(inner,1,48),new THREE.MeshBasicMaterial({
    color,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
}
const natLeaf=new THREE.BufferGeometry();
natLeaf.setAttribute('position',new THREE.Float32BufferAttribute([-.5,0,0,0,.2,0,.5,0,0,0,-.2,0,0,.03,0],3));
natLeaf.setIndex([0,1,4,1,2,4,2,3,4,3,0,4]);natLeaf.computeVertexNormals();natLeaf.userData.keep=true;
const natPlantM={leaf:natStd('#5fb83a',{side:THREE.DoubleSide,emissive:'#1d4a10',emissiveIntensity:.35}),
  leafD:natStd('#2f6e25',{side:THREE.DoubleSide}),pod:natStd('#8bd04e',{emissive:'#2c5a10',emissiveIntensity:.45}),
  podDark:natStd('#3f7a2a'),stem:natStd('#4f9a35',{emissive:'#173d0c',emissiveIntensity:.3}),
  petal:natStd('#ff8cc6',{side:THREE.DoubleSide,emissive:'#7a2050',emissiveIntensity:.35}),
  petalIn:natStd('#ffc0de',{side:THREE.DoubleSide,emissive:'#80405a',emissiveIntensity:.35}),
  core:natStd('#ffd23f',{emissive:'#ffb000',emissiveIntensity:1.1})};
for(const m of Object.values(natPlantM))m.userData.keep=true;
function natGlow(color,size,parent){
  const sprite=new THREE.Sprite(glowMat(color,.95).clone());sprite.scale.setScalar(size);return natAdd(sprite,parent);
}
const natArt=naturePlantArt({T:THREE,M:natPlantM,STD:natStd,add:natAdd,mesh:natMesh,glow:natGlow,
  GLOWG:'#8dff72',GLOWT:'#ffd865',GLOWP:'#ff99cf',leafGeo:natLeaf,V3:natV,ease:natSmooth,phase:natPhase,lerp,clamp});
function natureProjectileModel(type){
  const big=type==='nature_pea';
  const geo=big?new THREE.SphereGeometry(.43,20,14):new THREE.ConeGeometry(.07,.55,7);
  if(big)geo.scale(.88,.88,1.35);else geo.rotateX(Math.PI/2);
  return new THREE.Mesh(geo,natStd(big?'#93ce43':'#a4dd53',{emissive:'#497b1a',emissiveIntensity:.45}));
}
function natSet(o,x,y,h){o.position.set(tx(x),GY(x,y)+h,tz(y));}
function natAnimate(g,life,tick){natAdd(g);NAT_MOTION.push({g,life,tick,age:0});tick(0,0);}
function natTube(curve,size,taper=0){
  const geo=new THREE.TubeGeometry(curve,12,size,6,false),pos=geo.attributes.position;
  if(!taper)return geo;
  const center=natV(),point=natV();
  for(let i=0;i<pos.count;i++){
    const k=Math.floor(i/7)/12;
    curve.getPointAt(k,center);point.fromBufferAttribute(pos,i).lerp(center,k*taper);
    pos.setXYZ(i,point.x,point.y,point.z);
  }
  geo.computeVertexNormals();return geo;
}
function natTrail(a,b,{color='#67ae3e',size=.047,lift=.36,life=.35,pull=false,hit=false,windup=0,track=null,target=null,taper=0}={}){
  const obj=new THREE.Mesh(new THREE.BufferGeometry(),natStd(color,{emissive:color,emissiveIntensity:.25}));
  const fleck=hit?natGlow('#ceff85',.38,obj):null;
  natAnimate(obj,life,(k,age)=>{
    if(track)a.copy(track());
    const tip=target?.();if(tip)b.copy(tip);
    const out=natOut(natPhase(age,0,windup||life*.32));
    const back=pull?1-natSmooth(natPhase(k,.48,1)):1;
    const end=a.clone().lerp(b,out*back);
    const mid=a.clone().lerp(end,.53);mid.y+=lift*Math.sin(Math.PI*Math.min(.5,out*back));
    const curve=new THREE.QuadraticBezierCurve3(a,mid,end);
    obj.visible=out>.01&&back>.01;
    if(obj.visible){
      obj.geometry.dispose();obj.geometry=natTube(curve,size*(.55+.45*back),taper);
      if(fleck)curve.getPoint(Math.sin(Math.PI*clamp(k,0,.5)),fleck.position);
    }
  });
}
function natSeed(ev,spore=false){
  if(ev.z==='nature_seed'&&ev.id!=null&&!ev.thrown){const o=PM3.get(ev.id),t=ev.t||.27,lag=Math.min(.22,t*.55);if(o)later(lag,()=>{const q=simOf(o.armL.localToWorld(natV(0,-.62,0)));natSeed({...ev,thrown:1,x:q.x,y:q.y,h:q.h-GY(q.x,q.y),t:t-lag});});else natSeed({...ev,thrown:1});return;}
  const a=natWorld(ev.x,ev.y,ev.h),b=natWorld(ev.x2,ev.y2,ev.h2),g=new THREE.Group();
  natMesh(new THREE.SphereGeometry(spore?.12:.15,9,7),natStd(spore?'#e8eb67':'#80652c',{
    emissive:spore?'#83aa18':'#466b14',emissiveIntensity:.8}),g);
  natGlow(spore?'#cbf35d':'#a6e951',.65,g);
  natAnimate(g,ev.t||.27,k=>{g.position.lerpVectors(a,b,k);g.position.y+=Math.sin(Math.PI*k)*(spore?.58:.23);g.rotation.x=k*9;});
}

function natLotus(){
  const mix={value:0},plant=natArt.Lotus(1,true,mix);
  const heal=natArt.LotusAura(NAT.lotusRange*S3,'heal'),buff=natArt.LotusAura(NAT.lotusRange*S3,'buff');
  const core=plant.core.material=natPlantM.core.clone();core.userData.keep=false;
  for(const m of [plant.outerPetal,plant.innerPetal])m.userData.keep=false;
  const color=[
    [plant.outerPetal,natPlantM.petal,'#80ef47','#49c420',.72],
    [plant.innerPetal,natPlantM.petalIn,'#b5ff70','#5ce324',.82],
    [core,natPlantM.core,'#daff8c','#9dff37',1.32]
  ].map(([mat,pink,green,light,strength])=>({mat,pink,green:new THREE.Color(green),light:new THREE.Color(light),strength}));
  const g=new THREE.Group();g.add(plant.g,heal.g,buff.g);natAdd(g);
  const glow=natGlow('#a0ff62',1.7,plant.bloom);glow.position.y=.35;
  const wave=new THREE.Group(),waveMat=new THREE.MeshBasicMaterial({color:'#9dffc1',transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});wave.position.y=.075;g.add(wave);
  for(let i=0;i<5;i++){const arc=natMesh(new THREE.RingGeometry(.963,1,24,1,i*Math.PI*2/5,1.02),waveMat,wave);arc.rotation.x=-Math.PI/2;}
  return {g,plant,heal,buff,glow,mix,color,wave,waveMat,lastWave:-1,moteT:0,bloomed:false};
}
function natBall(){
  const g=new THREE.Group(),geo=new THREE.IcosahedronGeometry(.44,2),position=geo.attributes.position;
  const shade=new THREE.Color(),colors=[];
  for(let i=0;i<position.count;i++){
    shade.set(Math.sin(position.getX(i)*28+position.getY(i)*12)>.05?'#8e643d':'#53341c');colors.push(shade.r,shade.g,shade.b);
  }
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  natMesh(geo,natStd('#ffffff',{vertexColors:true}),g);natAdd(g);
  return {g};
}
function natPlantView(s){
  if(s.k==='lotus')return natLotus();
  if(s.k==='ball')return natBall();
  if(s.k==='turret'){
    const plant=natArt.Turret(!!s.wall),eye=plant.eyeParts;
    const pea=natureProjectileModel('nature_pea');plant.head.add(pea);
    return {g:plant.g,plant,eye,pea,wall:s.wall};
  }
  return {fx:null,g:null};
}
function natStartStudy(name,s,stay=false){
  const f=fxData(name);
  if(!FXR.ready||!f)return null;
  for(const l of f.layers)if(l.shape==='model'&&!fxMeshGeo(l.model))return null;
  const isTree=name.includes('tree_'),ts=name==='nature/tree_summon'?NAT.treeGrow0/NAT.treeGrow:1,age=(stay?s.age:0)*ts;   // ต้นไม้งอกเร็วขึ้น (ผู้ใช้ 2026-11-10): เล่นเอฟเฟกต์เร็วตาม
  const scale=isTree?NAT.treeHeight/27:1;
  let data=f;
  if(stay)data={...f,layers:f.layers.filter(l=>l.t==='mesh'||l.t==='code'||age<.8).map(l=>
    l.t==='mesh'||l.t==='code'?{...l,life:Math.max(f.dur,(isTree?(NAT.treeGrow+NAT.treeLife)*ts:8)-age)+.2}:l)};
  else if(name==='nature/tree_break_study')data={...f,layers:f.layers.map(l=>{
    if(l.id!=='heal_dome')return l;
    const k=NAT.treeRange*S3/(26.4*scale);
    return {...l,at:0,scale:Object.fromEntries(Object.entries(l.scale).map(([t,[x,y,z]])=>[t,[x*k,y,z*k]]))};
  })};
  const fx=fxStart(data,{x:s.x,y:s.y,h:s.h,a:s.a,s:scale,ts,p:{healRadius:NAT.treeRange*S3}},name);
  if(fx)fx.t=age;
  return fx;
}
function natWearWall(fx,burn){
  if(!burn?.some(v=>v>0)||!fx)return;
  for(const layer of fx.L){
    const m=layer.inner?.material;
    if(!m||!layer.d.model?.startsWith('nature_wood_wall'))continue;
    if(!m.userData.natBurn){
      const value=natV();m.userData.natBurn=value;
      const prior=m.onBeforeCompile,key=m.customProgramCacheKey();
      m.customProgramCacheKey=()=>key+':nature-scorch';
      m.onBeforeCompile=(shader,renderer)=>{
        prior.call(m,shader,renderer);shader.uniforms.uNatureScorch={value};
        shader.vertexShader='varying float vNatureWallX;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvNatureWallX=position.x;');
        shader.fragmentShader='uniform vec3 uNatureScorch;\nvarying float vNatureWallX;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
          float burn=vNatureWallX<-1.8?uNatureScorch.x:vNatureWallX>1.8?uNatureScorch.z:uNatureScorch.y;
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.21,.17,.14),smoothstep(0.0,.42,burn));`);
      };
      m.needsUpdate=true;
    }
    m.userData.natBurn.set(...burn);
  }
}
function natTreeGlow(fx,damage){
  const m=fx?.L[0]?.inner?.material;
  if(!m?.userData.fxEmission||!fx.updateNatureWeave)return;
  if(!m.userData.natTreePower){
    const power={value:0},prior=m.onBeforeCompile,key=m.customProgramCacheKey();
    m.userData.natTreePower=power;m.customProgramCacheKey=()=>key+':nature-tree-hit';
    m.onBeforeCompile=(shader,renderer)=>{
      prior.call(m,shader,renderer);shader.uniforms.uNaturePower=power;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        float trunkHeight=(position.y-7.3)/4.1;
        vNatureTrunkPower=exp(-trunkHeight*trunkHeight);`);
      shader.vertexShader='varying float vNatureTrunkPower;\n'+shader.vertexShader;
      shader.fragmentShader='uniform float uNaturePower; varying float vNatureTrunkPower;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_begin>',
        'totalEmissiveRadiance *= 1.0 + uNaturePower * (0.32 + vNatureTrunkPower * 1.45);\n#include <lights_fragment_begin>');
    };
    m.needsUpdate=true;
  }
  m.userData.natTreePower.value=damage;
}
function natModelTick(v,s,dt){
  const age=s.age;
  if(s.k==='tree'||s.k==='wall'){
    if(!v.fx)v.fx=natStartStudy(s.k==='tree'?'nature/tree_summon':'nature/wood_wall_growth_study',s,true);
    const mesh=v.fx?.L[0]?.inner;
    if(!mesh){
      if(!v.g){
        const g=new THREE.Group(),mat=natStd('#475631');
        if(s.k==='wall')for(let i=-2;i<=2;i++){
          const post=natMesh(new THREE.BoxGeometry(2.12,NAT.wallHeight,1.05),mat,g);
          post.position.set(i*2.10,NAT.wallHeight/2,-i*i*.19);
        }else natMesh(new THREE.CylinderGeometry(.75,1.65,9.5,10),mat,g).position.y=4.75;
        v.g=natAdd(g);natSet(g,s.x,s.y,s.h);g.rotation.y=Math.PI/2-s.a;
      }
      v.g.scale.y=Math.max(.04,natOut(natPhase(age,0,s.k==='tree'?NAT.treeGrow:.7)));
    }else if(v.g){disposeObj(v.g);v.g=null;}
    if(mesh&&s.k==='tree'&&!v.shadowProxy){   // the woven model has 125k faces: draw it once, let a low-poly stand-in cast the shadow
      mesh.traverse(q=>{if(q.isMesh)q.castShadow=false;});
      const g=v.shadowProxy=new THREE.Group(),m=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false});m.userData.keep=false;
      natMesh(new THREE.CylinderGeometry(.9,1.7,9,10),m,g).position.y=4.5;const c=natMesh(new THREE.IcosahedronGeometry(6.2,1),m,g);c.position.y=11;c.scale.y=.55;g.traverse(q=>{if(q.isMesh)q.castShadow=true;});
      v.proxyG=natAdd(g);natSet(g,s.x,s.y,s.h);
    }
    if(v.proxyG){const k=natOut(natPhase(age,0,NAT.treeGrow));v.proxyG.scale.setScalar(Math.max(.04,k));}
    if(s.k==='tree')natTreeAura(v,s,dt);
    if(v.fx){v.fx.t=age;v.fx.updateNatureWeave?.();}
    if(s.k==='wall')natWearWall(v.fx,s.burn);
    else natTreeGlow(v.fx,1-s.hp/s.maxHp);
    return;
  }
  natSet(v.g,s.x,s.y,s.h);
  if(s.k==='ball'){
    if(age<s.flight){
      const k=natOut(age/s.flight),a=s.origin;
      v.g.position.copy(natWorld(a.x,a.y,a.h)).lerp(natWorld(s.x,s.y,s.h),k);v.g.position.y+=Math.sin(Math.PI*k)*Math.min(4,Math.hypot(s.x-a.x,s.y-a.y)/110);   // lobbed arc down onto the aim pointv.g.rotation.x=age*19;
      v.g.scale.setScalar(lerp(.38,1,k));
    }else{
      if(s.stab-s.flight>.01)v.g.position.y-=.04;
      const wobble=age<s.stab?.105:0;
      v.g.rotation.set(Math.sin(age*74)*wobble,Math.cos(age*61)*wobble,0);
      v.g.scale.setScalar(s.pull===null?1:lerp(1,.60,natSmooth(natPhase(s.pull,.15,.23))));
    }
    return;
  }
  const grow=natOut(natPhase(age,0,.52))*(s.move===null?1:1-natSmooth(natPhase(s.move,0,.31)));
  v.g.rotation.y=Math.PI/2-s.a;
  if(s.k==='turret'){
    v.plant.grow(grow);
    v.buff=lerp(v.buff||0,s.buff?1:0,Math.min(1,dt*10));
    const charge=s.charge===null?0:natSmooth(natPhase(s.charge,0,.4));
    const recoil=Math.exp(-s.shot*(s.big?12:19));
    const kick=s.big?recoil:0,release=s.big?1-natSmooth(natPhase(s.shot,0,.5)):0;
    const strain=Math.max(charge,release),lean=.29*charge-.51*kick;
    v.plant.body.rotation.x=lean;
    const aim=Number.isFinite(s.aim)?s.a-s.aim:0;
    v.aim=(v.aim||0)+angDiff(aim,v.aim||0)*Math.min(1,dt*13);
    v.plant.pose(age,v.aim,recoil,!!s.wall,v.buff,.13*charge*Math.sin(age*19)-kick*.32);
    v.plant.head.rotation.x-=lean*.37;
    v.plant.head.scale.multiply(natV(1+.16*strain,1+.13*strain,1+.09*strain));
    v.plant.nozzle.scale.set(1+2.4*strain,1+.28*strain,1+2.4*strain);
    for(const {eye,smile,side} of v.eye)if(strain>.06){eye.visible=true;smile.visible=false;eye.scale.y=.26+.23*strain;eye.rotation.z=side*.10;}
    v.pea.visible=charge>.31;
    if(v.pea.visible){const k=natSmooth(natPhase(charge,.31,1));v.pea.position.z=lerp(.46,.76,k);v.pea.scale.setScalar(lerp(.25,.53,k));}
    v.plant.tipG.material.opacity=clamp(.48+.4*recoil+.22*Math.exp(-s.turn*7)-strain*.5,0,1);
    return;
  }
  const modeAge=s.modeAge,shift=natSmooth(natPhase(modeAge,.08,.36)),mix=s.mode?shift:1-shift;
  const fold=Math.sin(Math.PI*natPhase(modeAge,0,.42));
  v.plant.set(grow,grow*(1-.3*fold),age);v.mix.value=mix;
  for(const {mat,pink,green,light,strength} of v.color){
    mat.color.copy(pink.color).lerp(green,mix);mat.emissive.copy(pink.emissive).lerp(light,mix);
    mat.emissiveIntensity=lerp(pink.emissiveIntensity,strength,mix);
  }
  v.plant.cg.material.opacity=1-mix;v.glow.material.opacity=mix*.7;
  v.heal.set(1,age,(1-mix)*grow);v.buff.set(1,age,mix*grow);
  {const F=natFx(),{V3,sparks,leaves}=F,R=NAT.lotusRange*S3,base=v.g.position,crown=v.plant.core.getWorldPosition(V3()),START=.62;F.O.y=base.y;
    if(age>=START&&!v.bloomed){v.bloomed=true;sparks(crown,17,2.1,'#fff1b1','#f596ba',{life:1.1,size:1.15,g:-.5});leaves(crown,7,1.6,{col:'#f6a7c7',life:.85,size:1.35});}
    const idx=Math.floor((age-START)/1.37),front=natPhase(age-(START+idx*1.37),0,.91),radius=.28+(R-.28)*front,healing=mix<.5;
    v.wave.visible=healing&&idx>=0&&front<1;v.wave.scale.setScalar(radius);v.wave.rotation.y=idx*.32+age*.18;v.waveMat.opacity=.86*natEase(natPhase(front,0,.12))*(1-natEase(natPhase(front,.66,1)));
    if(v.wave.visible&&idx!==v.lastWave&&radius>2){v.lastWave=idx;v.healedSet=new Set();}
    if(v.wave.visible&&v.healedSet)for(const p of (VIEW.cur?.P||[])){if(p.tm!==s.team||!p.al||p.dn||v.healedSet.has(p.id))continue;const o=PM3.get(p.id);if(!o||o.g.position.distanceTo(base)>radius)continue;v.healedSet.add(p.id);natHealRims(o);}
    v.moteT-=dt;if(age>START&&v.moteT<=0){v.moteT=.033;const a=F.rnd(0,6.283),r=Math.sqrt(F.rnd(0,1))*(R-.6);sparks(base.clone().add(V3(Math.cos(a)*r,.1,Math.sin(a)*r)),2,.55,healing?'#d9ffba':'#fff2a0',healing?'#63dd83':'#e9b439',{g:-.7,life:1.45,size:.92});}}
}

function natMarker(){
  const g=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:'#2dff5e',transparent:true,opacity:1,depthTest:false,depthWrite:false});
  for(const side of [-1,1]){
    const points=Array.from({length:9},(_,i)=>{const u=i/8;return natV(side*(.62+.22*Math.sin(u*Math.PI)),(u-.5)*1.7,0);});
    natMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),16,.06,6,false),mat,g);
    for(let i=1;i<8;i+=2){const thorn=natMesh(new THREE.ConeGeometry(.11,.34,5),mat,g);thorn.position.copy(points[i]);thorn.rotation.z=-side*.9;}
  }
  const halo=natMesh(new THREE.RingGeometry(1.05,1.17,44),new THREE.MeshBasicMaterial({color:'#eaffc8',transparent:true,opacity:.9,depthTest:false,depthWrite:false,side:THREE.DoubleSide}),g);
  g.traverse(o=>{if(o.isMesh)o.renderOrder=30;});g.userData.halo=halo;
  return natAdd(g);
}
function natMarks(v,P,me){
  const seen=new Set();
  if(me?.al&&!me.dn&&!me.fl&&getKit(me.id).path===NATUREP){
    const targets=[...P.filter(q=>q.id!==me.id&&q.al&&!q.dn&&q.tm===me.tm),
      ...(v.NT||[]).filter(o=>o.owner===me.id&&o.hp>0&&o.move===null)];
    for(const q of targets){
      const h=q.k?(q.k==='tree'?8:q.k==='lotus'?3.8:1.1)+(q.h||0):q.z+1.2;
      const range=Math.hypot(q.x-me.x,q.y-me.y,(GY(q.x,q.y)+h-GY(me.x,me.y)-me.z-1.2)*20);
      if(range>NAT.hookRange||Math.abs(angDiff(Math.atan2(q.y-me.y,q.x-me.x),yaw))>.62)continue;
      const id=(q.k?'n:':'p:')+q.id;seen.add(id);
      if(!NAT_MARKS.has(id))NAT_MARKS.set(id,natMarker());
      const g=NAT_MARKS.get(id),body=!q.k&&PM3.get(q.id);
      if(body)g.position.copy(body.g.position).add(natV(0,1.2,0));else natSet(g,q.x,q.y,h);
      const pulse=1+.08*Math.sin(performance.now()*.008);g.scale.setScalar(lerp(1.5,1.15,range/NAT.hookRange)*pulse);g.userData.halo.scale.setScalar(1+.12*Math.sin(performance.now()*.008));g.quaternion.copy(cam.quaternion);
    }
  }
  for(const [id,g] of NAT_MARKS)if(!seen.has(id)){disposeObj(g);NAT_MARKS.delete(id);}
}

function natThorn(from,to,size,material,parent,bend=.2){
  const mid=from.clone().lerp(to,.45);mid.y+=bend;
  const curve=new THREE.QuadraticBezierCurve3(from,mid,to);
  return natMesh(natTube(curve,size,.83),material,parent);
}
const NAT_SHIELD_K=1.07/NAT_SHIELD_HIT;   // vine reaches the floor at 1.07 (strike phase); host hit lands at NAT_SHIELD_HIT s
function natShieldMake(o){
  const g=new THREE.Group();o.g.add(g);
  const hitWave={value:1},hitAxis={value:natV(.42,.16,1).normalize()};
  const shield=new THREE.Mesh(new THREE.SphereGeometry(1.35,32,24),new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.FrontSide,uniforms:{hitWave,hitAxis},
    vertexShader:`varying float h,edge;varying vec3 localNormal;
      void main(){h=position.y/2.7+0.5;localNormal=normal;vec4 mv=modelViewMatrix*vec4(position,1.0);vec3 n=normalize(normalMatrix*normal);edge=pow(1.0-abs(dot(n,normalize(-mv.xyz))),3.0);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform float hitWave;uniform vec3 hitAxis;varying float h,edge;varying vec3 localNormal;
      void main(){float t=clamp(h,0.0,1.0);vec3 low=vec3(.001,.012,.001),mid=vec3(.01,.11,.008),high=vec3(.34,.90,.25);
      vec3 col=mix(mix(low,mid,smoothstep(.20,.72,t)),high,smoothstep(.62,1.0,t));col+=vec3(.14,.30,.09)*edge;
      float d=acos(clamp(dot(normalize(localNormal),hitAxis),-1.0,1.0));float wave=1.0-smoothstep(.025,.11,abs(d-mix(.06,1.64,hitWave)));
      float impact=pow(1.0-hitWave,1.65)*wave;float flash=(1.0-smoothstep(.03,.28,hitWave))*(1.0-smoothstep(.02,.26,d));
      col+=vec3(.69,1.0,.32)*impact+vec3(.95,1.0,.55)*flash;
      gl_FragColor=vec4(col,min(.97,mix(.96,.38,smoothstep(.25,1.0,t))+edge*.15+impact*.34+flash*.27));
      #include <colorspace_fragment>
      }`
  }));
  const motes=Array.from({length:24},(_,i)=>{const m=natMesh(new THREE.OctahedronGeometry(.025+(i%3)*.009),new THREE.MeshBasicMaterial({color:i%2?'#a8f77c':'#e1ffc4',transparent:true,opacity:.7,depthWrite:false}),g);return m;});
  g.userData.nat={hitWave,hitT:-1e9,motes};
  shield.position.y=1.23;g.add(shield);
  const F=natFx(),{V3,Tube,Thorns,thornsAlong,M,T}=F,C=[new T.Color('#e8ffb3'),new T.Color('#688f41'),new T.Color('#b4dc79')],A=new T.Color('#304d20'),B=new T.Color('#507c2c');
  const vines=Array.from({length:9},(_,k)=>{const tube=Tube(30,7,M.bark,g),th=Thorns(40,1.5,g);tube.castShadow=false;th.castShadow=false;return {tube,th,k,strike:null,built:false};});
  const rad=u=>.16*Math.pow(1-u,.72)+.002,H=[.70,.57,.77,.66,.49,.73,.62,.80,.60],Y=1.23,SP=NAT_SHIELD_K;
  const build=(v,st2,angle,reach,climb=1)=>{const pts=[],k=v.k,base=V3(0,Y-1.25,0);for(let i=0;i<30;i++){const u=i/29,theta=Math.PI-(Math.PI*H[k]*u*climb),a=k*Math.PI*2/9+Math.sin(u*3+k)*.09,r=1.36,p=V3(Math.sin(theta)*Math.sin(a)*r,Y+Math.cos(theta)*r,Math.sin(theta)*Math.cos(a)*r);
      if(st2>0&&st2<1.80){const rise=natEase(natPhase(st2-u*.16,0,.58)),fall=natOut(natPhase(st2-u*.11,.79,.94)),back=natEase(natPhase(st2-u*.07,1.18,1.63)),ang=fall*Math.PI/2,arc=V3(0,Math.cos(ang)*4.8*u,Math.sin(ang)*reach*u+(1-fall)*1.45*Math.sin(Math.PI*u));arc.y+=Math.sin(u*Math.PI)*(.85*(1-fall));arc.x+=Math.sin(u*6-st2*9)*Math.sin(u*Math.PI)*.60*(1-fall);arc.z+=Math.sin(u*5-st2*7)*u*.32*(1-fall);arc.applyAxisAngle(V3(0,1,0),angle).add(base);p.lerp(arc,rise*(1-back)*natEase(Math.min(1,u*4)));}
      pts.push(p);}
    v.tube.set(pts,rad,(u,c)=>c.copy(A).lerp(B,u*.35));const list=thornsAlong(pts,rad,2,1.25);v.th.put(list);list.forEach((_,i)=>v.th.setColorAt(i,C[i%3]));if(v.th.instanceColor)v.th.instanceColor.needsUpdate=true;v.built=true;};
  g.userData.nat.vines=vines;
  g.userData.nat.strike=(angle,reach)=>{let best=null,d0=9;for(const v of vines){if(v.strike)continue;let d=Math.abs(angDiff(angle,v.k*Math.PI*2/9));if(d<d0){d0=d;best=v;}}if(best)best.strike={t:0,angle,reach};};
  g.userData.nat.tick=dt=>{const U=g.userData.nat,age=U.age??9;shield.scale.setScalar(Math.max(.02,natOut(natPhase(age,0,.13))));for(const v of vines){const climb=natEase(natPhase(age,.16+v.k*.05,1.02+v.k*.05));v.tube.visible=v.th.visible=climb>.01;if(climb<1&&!v.strike){build(v,0,0,4.6,climb);v.built=false;continue;}if(v.strike){const S=v.strike;S.t+=dt;const st2=S.t<NAT_SHIELD_HIT?S.t*SP:1.07+(S.t-NAT_SHIELD_HIT);if(st2>=1.8){v.strike=null;build(v,0,0,4.6);}else build(v,st2,S.angle,S.reach);}else if(!v.built)build(v,0,0,4.6);}};
  return g;
}
function natureCharacter(o,p,now){
  const native=getKit(p.id).path===NATUREP;
  if(native&&p.sh&&p.al&&!p.dn){
    if(!o.natShield)o.natShield=natShieldMake(o);
    o.natShield.visible=true;o.shield.visible=false;
    {const U=o.natShield.userData.nat,t=now/1000;if(!U.wasOn){U.wasOn=true;U.bornT=now;U.vines.forEach(v=>{v.built=false;v.climb=-1;});}U.age=(now-U.bornT)/1000;U.hitWave.value=clamp((now-U.hitT)/360,0,1);U.tick(Math.min(.05,(now-(U.lastN||now))/1000));U.lastN=now;U.motes.forEach((m,i)=>{const a=i*2.4+t*.4,y=((i*.31+t*.25)%2.4)-1.2,r=Math.sqrt(Math.max(.1,1-y*y/1.9))*1.4;m.position.set(Math.sin(a)*r,y+1.23,Math.cos(a)*r);});}
  }else if(o.natShield){o.natShield.visible=false;o.natShield.userData.nat.wasOn=false;}
  const count=p.nt?.[1]||0;
  if(count&&!o.natSpores){
    o.natSpores=[0,1].map(i=>{
      const g=new THREE.Group();o.g.add(g);
      natMesh(new THREE.IcosahedronGeometry(.112,1),natStd('#e9f58b',{emissive:'#7fbb1f',emissiveIntensity:.85}),g);
      natGlow('#9cf447',.55,g);return g;
    });
  }
  o.natSpores?.forEach((g,i)=>{
    g.visible=i<count&&p.al&&!p.dn;
    g.position.set((i?1:-1)*(.46+.05*Math.sin(now*.005)),1.48+.10*Math.sin(now*.004+i*1.8),-.16);
  });
  if(p.nt?.[2]&&!o.natCoil){
    const curve=new THREE.CatmullRomCurve3(Array.from({length:28},(_,i)=>{
      const t=i/27,a=t*Math.PI*5;return natV(.48*Math.cos(a),.42+t*1.24,.48*Math.sin(a));
    }));
    o.natCoil=natMesh(new THREE.TubeGeometry(curve,36,.041,5,false),natStd('#59953d',{emissive:'#375220',emissiveIntensity:.5}),o.g);
  }
  if(o.natCoil)o.natCoil.visible=false;   // natCoil() draws the approved coil
  if(o.natShield&&!p.al)o.natShield.visible=false;
}

const natOutlineMat=new THREE.MeshBasicMaterial({color:'#88f65d',side:THREE.BackSide,depthWrite:false});
natOutlineMat.userData.keep=true;
natOutlineMat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>',
  '#include <begin_vertex>\ntransformed+=normalize(normal)*.018;');};
function natOutline(o,on){
  if(on&&!o.natOutline){
    const hulls=[];
    (o.fileModel||o.b).traverse(m=>{if(m.isMesh&&!m.userData.natOutline)hulls.push(m);});
    o.natOutline=hulls.map(m=>{
      const c=m.isSkinnedMesh?new THREE.SkinnedMesh(m.geometry,natOutlineMat):new THREE.Mesh(m.geometry,natOutlineMat);
      if(m.isSkinnedMesh)c.bind(m.skeleton,m.bindMatrix);
      c.userData.natOutline=true;c.renderOrder=997;m.parent.add(c);return {m,c};
    });
  }
  for(const {m,c} of o.natOutline||[]){c.visible=on&&m.visible;c.position.copy(m.position);c.quaternion.copy(m.quaternion);c.scale.copy(m.scale);}
}
function natLinks(v,P,now){
  const trees=(v.NT||[]).filter(t=>t.k==='tree'&&t.age>=NAT.treeGrow&&t.hp>0);
  for(const p of P){
    const o=PM3.get(p.id);if(!o)continue;
    const tree=trees.find(t=>t.id===p.nt?.[3]);
    natOutline(o,!!p.nt?.[4]&&p.al&&!p.dn);
    if(tree&&p.al&&!p.dn){
      const F=natFx();if(!o.natLink){const m=F.ADD('#ffffff',{vertexColors:true});o.natLink=F.Tube(18,6,m);o.natLink.castShadow=false;}
      const a=o.g.position.clone().add(natV(0,1.35,0)),b=natWorld(tree.x,tree.y,tree.h+9.5),mid=a.clone().lerp(b,.48);mid.y+=2.3;
      const path=new THREE.QuadraticBezierCurve3(a,mid,b),pts=Array.from({length:18},(_,i)=>path.getPoint(i/17)),t=now*.006;
      o.natLink.visible=true;o.natLink.set(pts,u=>.1+.035*Math.sin(u*14-t*3),(u,c)=>c.set('#9dff5e').multiplyScalar(.75+.45*Math.sin(u*12-t*4)));
      if(Math.random()<.18)burst(p.x,p.y,'#a3fb66',2,24,.48,1.7,{h:p.z+.3,vh:[1.8,3.4],g:-.2,sh:2});
    }else if(o.natLink)o.natLink.visible=false;
  }
}
function syncNature(v,P,me,dt,now){
  const seen=new Set();
  for(const s of v.NT||[]){
    seen.add(s.id);let o=NAT_VIEW.get(s.id);
    if(o&&s.k==='turret'&&o.wall!==s.wall){disposeObj(o.g);o=null;}
    if(!o){o=natPlantView(s);NAT_VIEW.set(s.id,o);}
    natModelTick(o,s,dt);
  }
  for(const [id,o] of NAT_VIEW)if(!seen.has(id)){
    if(o.g)disposeObj(o.g);if(o.proxyG)disposeObj(o.proxyG);natAuraDrop(o);if(o.fx)fxKill(o.fx);NAT_VIEW.delete(id);
  }
  natMarks(v,P,me);natLinks(v,P,now);natHolo(me);
  if(_natFx)_natFx.tick(dt);
  for(let i=NAT_MOTION.length-1;i>=0;i--){
    const o=NAT_MOTION[i];o.age+=dt;
    if(o.age>=o.life){if(o.g)disposeObj(o.g);NAT_MOTION.splice(i,1);}
    else o.tick(o.age/o.life,o.age);
  }
}
function natureClear(){
  natFxClear();natHoloClear();
  for(const o of NAT_VIEW.values()){if(o.g)disposeObj(o.g);if(o.fx)fxKill(o.fx);}
  for(const o of NAT_MOTION)if(o.g)disposeObj(o.g);
  for(const g of NAT_MARKS.values())disposeObj(g);
  NAT_VIEW.clear();NAT_MARKS.clear();NAT_MOTION.length=0;
}
window.WD.natureClear=natureClear;window.WD.natureEvent=natureEvent;window.WD.natFx=natFx;window.WD.windSuckFx=windSuckFx;window.WD.windDome=windDome;

function natDome(ev){
  const g=new THREE.Group(),radius=ev.r*S3;
  natSet(g,ev.x,ev.y,groundH(ev.x,ev.y,ev.h)+.035);
  const shell=natMesh(new THREE.SphereGeometry(1,36,16,0,Math.PI*2,0,Math.PI/2),new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,uniforms:{strength:{value:1},crest:{value:.87}},
    vertexShader:`varying vec3 n,v;varying float h;void main(){vec4 p=modelViewMatrix*vec4(position,1.);
      n=normalMatrix*normal;v=-p.xyz;h=position.y;gl_Position=projectionMatrix*p;}`,
    fragmentShader:`uniform float strength,crest;varying vec3 n,v;varying float h;void main(){
      float rim=pow(1.-max(0.,dot(normalize(n),normalize(v))),2.2);
      float wave=1.-smoothstep(.02,.13,abs(h-crest));
      vec3 c=mix(vec3(.075,.39,.02),vec3(.69,.97,.18),clamp(rim+wave*.65,0.,1.));
      gl_FragColor=vec4(c,strength*(.16+rim*.54+wave*.24));
      #include <colorspace_fragment>
      }`
  }),g);
  const edge=natRing('#83d63f',.95);edge.rotation.x=-Math.PI/2;g.add(edge);
  natAnimate(g,.44,(_,age)=>{
    const grow=natOut(natPhase(age,0,.23)),fade=1-natSmooth(natPhase(age,.09,.44)),r=lerp(.72,radius,grow);
    g.scale.set(r,r*.82,r);edge.material.opacity=.7*fade;
    shell.material.uniforms.strength.value=fade;shell.material.uniforms.crest.value=lerp(.87,.06,grow);
  });
}
function natMuzzle(ev){
  const g=new THREE.Group(),a=natWorld(ev.x,ev.y,ev.h),dir=natV(Math.cos(ev.a),0,Math.sin(ev.a));
  const waves=[natRing('#8edb40',.84),natRing('#c5f889')];g.add(...waves);
  for(const wave of waves)wave.quaternion.setFromUnitVectors(natV(0,0,1),dir);
  natAnimate(g,.28,(_,age)=>waves.forEach((wave,i)=>{
    const t=age-i*.05,k=natPhase(t,0,.23);wave.visible=t>=0&&k<1;
    wave.position.copy(a).addScaledVector(dir,.10+k*(i?.76:1.36));wave.scale.setScalar(.46+natOut(k)*(i?.57:.94));
    wave.material.opacity=(i?.65:.92)*(1-k)**1.15;
  }));
}
function natSlam(ev){
  const a=natWorld(ev.x,ev.y,ev.h+.6),b=natWorld(ev.x2,ev.y2,ev.h2+.04),caster=ev.id!=null?PM3.get(ev.id):null;
  if(caster?.natShield){const q=caster.g.worldToLocal(b.clone());caster.natShield.userData.nat.strike(Math.atan2(q.x,q.z),Math.max(1,Math.hypot(q.x,q.z)));}
  later(NAT_SHIELD_HIT,()=>{
    const {x2:x,y2:y,h2:h}=ev;
    {const F=natFx(),{V3,dirt,leaves,sparks}=F,dd=b.clone().sub(a).setY(0).normalize(),side=V3(dd.z,0,-dd.x);F.O.y=b.y;for(let i=0;i<4;i++){const p=a.clone().lerp(b,.4+i*.2);p.y=b.y+.07;dirt(p,5,2.9,{spread:.42,size:.75});leaves(p,3,1.6,{dir:side.clone().multiplyScalar(i%2?1.65:-1.65),life:.7,size:1.15});sparks(p,3,2.4,'#e9ffa0','#69a83b',{dir:dd,life:.63});}}
    const crack=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:'#514331',transparent:true,depthWrite:false});
    const position=natWorld(x,y,h+.03),nearGround=natWorld(x,y,groundH(x,y,h));
    if(Math.abs(position.y-nearGround.y)>.12)return;
    for(let i=0;i<4;i++){
      const q=position.clone().add(natV(Math.sin(i*2.4)*.54,0,Math.cos(i*2.4)*.54));
      natThorn(position,q,.025,mat,crack,.006);
    }
    natAnimate(crack,2,k=>{mat.opacity=.68*(1-k);});
  });
}
// Dash: tools/nature-preview.js SKS.dash. Same timeline (aim 0-.20, vine .20-.43, tension .43-.73, then pull) with the host's real pull length.
function natHook(ev,student){
  const F=natFx(),{T,V3,M,Tube,Thorns,thornsAlong,TrailRibbon,ADD,glow,GLOWT,leaves,sparks,dirt}=F,ease=natEase,outQ=natOut,phase=natPhase;
  const vine=Tube(30,6,M.bark),th=Thorns(70,.8),speed=TrailRibbon(7,'#6da43d'),hookTrail=TrailRibbon(4,'#a0dd51');
  const tensionLight=Tube(30,5,ADD('#ffffff',{vertexColors:true}));tensionLight.castShadow=false;
  const airMat=ADD('#ffffff',{vertexColors:true}),launchAir=[Tube(15,5,airMat),Tube(15,5,airMat)],rushAir=[Tube(15,5,airMat),Tube(15,5,airMat)],airStrokes=[...launchAir,...rushAir];
  for(const stroke of airStrokes){stroke.castShadow=false;stroke.visible=false;}
  const airBright=new T.Color('#efffe3'),airGreen=new T.Color('#8bd19b'),hookFlash=glow(GLOWT,.55);
  const stemDark=new T.Color('#21381c'),stemTip=new T.Color('#71a648'),sapHead=new T.Color('#edffad'),sapTail=new T.Color('#55de53');
  const parts=[vine,th,speed,hookTrail,tensionLight,...airStrokes,hookFlash],staticEnd=natWorld(ev.x2,ev.y2,ev.h2),HIT=.43,PULL=ev.kind==='foe'?.43+NAT.foeHold:.73;
  const tgt=()=>{const o=ev.tid!=null?PM3.get(ev.tid):null;return o?o.g.localToWorld(V3(0,1.25,.15)):staticEnd.clone();};
  const start=student?student.g.position.clone():natWorld(ev.x,ev.y,ev.h-1.35),d0=start.distanceTo(tgt());
  const pullT=clamp((d0-1.4)*20/(ev.kind==='foe'?NAT.hookPull:NAT.hookSpeed),.18,.9),DONE=PULL+pullT,dur=ev.hit?DONE+.1:HIT+.26;
  let hit=false,land=false,rope=0,frame=0;
  if(student)student.natHookCast={t:0,dur:ev.hit?DONE:HIT+.2,hit:ev.hit,pull:PULL,done:DONE,foe:ev.kind==='foe'&&ev.hit};
  F.clip(dur,(st,dt)=>{
    frame++;if(student?.natHookCast)student.natHookCast.t=st;
    const tip=student?natWandTip(student,V3()):natWorld(ev.x,ev.y,ev.h);if(student&&ev.kind==='foe'&&ev.hit&&student.nwt?.m.parent){const hk=natEase(phase(st,PULL-.04,PULL+.12));if(hk>0)tip.lerp(student.nwt.m.parent.getWorldPosition(V3()),hk);}   // reeling in: the vine is gripped in the fist
    const _t0=0,tg=tgt(),fly=phase(st,.20,HIT);
    const hitAge=st-HIT,pulling=ev.hit&&st>PULL&&st<DONE&&student&&ev.kind!=='foe',pull=phase(st,PULL,DONE);
    for(const stroke of airStrokes)stroke.visible=false;
    if(pulling){
      const from=start,dir=V3().subVectors(tg,from).setY(0).normalize(),wake=student.g.position.clone().add(V3(0,.72,0)),across=V3(dir.z,0,-dir.x),burst=phase(st,PULL,PULL+.19*pullT/.45);
      if(burst<1){
        const spread=.48+1.02*outQ(burst),gain=1-ease(burst);
        launchAir.forEach((stroke,i)=>{const side=i===0?-1:1,pts=[];for(let j=0;j<15;j++){const u=j/14,a=lerp(-.69,.74-i*.19,u),p=from.clone().addScaledVector(across,side*Math.cos(a)*spread).addScaledVector(dir,-.14-burst*.53-.16*u);p.y+=1+Math.sin(a)*spread;pts.push(p);}
          stroke.visible=true;const taper=u=>Math.sin(Math.PI*u)**.8;stroke.set(pts,u=>.088*gain*taper(u),(u,c)=>c.copy(airBright).lerp(airGreen,u).multiplyScalar(1.22*gain*taper(u)));});
      }
      const pace=4*pull*(1-pull);
      rushAir.forEach((stroke,i)=>{const side=i===0?-1:1,pts=[];for(let j=0;j<15;j++){const u=j/14,p=wake.clone().addScaledVector(dir,.42-u*(.76+2.7*pace)).addScaledVector(across,side*(.45+.63*Math.sin(u*Math.PI*.64)));p.y+=.52-u*.28+i*.07;pts.push(p);}
        stroke.visible=pace>.09;const taper=u=>Math.sin(Math.PI*u)**.84;stroke.set(pts,u=>.077*pace*taper(u),(u,c)=>c.copy(airBright).lerp(airGreen,u).multiplyScalar(1.35*pace*taper(u)));});
      if(frame%2===0)leaves(wake,3,1.6,{dir:dir.clone().multiplyScalar(-2.4),life:.64,size:1.3});
      speed.push([wake.clone().add(V3(0,.32,0)),wake]);
    }else speed.push(null);
    if(ev.hit&&st>=DONE-.02&&!land&&student&&ev.kind!=='foe'){land=true;const q=student.g.position.clone();F.O.y=q.y;dirt(q,16,3);leaves(q.clone().add(V3(0,.3,0)),10,3);}
    vine.visible=th.visible=st>.02&&st<(ev.hit?DONE+.08:dur);
    let trailSample=null;tensionLight.visible=hookFlash.visible=false;
    if(vine.visible){
      const k=ease(fly),side=V3(tip.z-tg.z,0,tg.x-tip.x).normalize(),origin=tip.clone().addScaledVector(side,.8*ease(phase(st,0,.18))),control=tip.clone().lerp(tg,.30).addScaledVector(side,Math.min(25,tip.distanceTo(tg)*2.2));
      const end=origin.multiplyScalar((1-k)*(1-k)).addScaledVector(control,2*k*(1-k)).addScaledVector(tg,k*k),loose=1-ease(phase(st,.36,.48)),pts=[];
      if(st>=HIT&&!rope)rope=tip.distanceTo(tg);
      const chord=tip.distanceTo(tg),extra=rope?Math.sqrt(Math.max(0,rope**2-chord**2)):0,slack=(ev.kind==='foe'?0:1)*Math.min(2.8,extra*.35)*ease(phase(st,PULL,PULL+.13)),back=ev.hit?1:1-ease(phase(st,HIT,dur));
      for(let i=0;i<30;i++){const u=i/29*back,p=V3().lerpVectors(tip,end,u),envelope=Math.sin(u*Math.PI);
        if(st<.20){const a=u*Math.PI*2.5-st*5,rr=.25*u;p.addScaledVector(side,Math.sin(a)*rr);p.y+=Math.cos(a)*rr+u*.14;}
        else{const tipBend=Math.exp(-(((u-.80)/.17)**2))*Math.sin(u*5-st*20)*1.9*loose;p.y+=envelope*(.04+.48*loose)-envelope*Math.min(.55,slack*.30)+envelope*.16*Math.sin(u*7-st*25)*loose;
          const tensionWave=hitAge>0&&ev.kind!=='foe'?ease(phase(hitAge,0,.05))*Math.exp(-hitAge*9)*Math.sin(hitAge*32-u*3)*.65:0;p.addScaledVector(side,envelope*(.8*Math.sin(u*5-st*20)*loose+slack+tensionWave)+tipBend*envelope);}
        pts.push(p);}
      const rad=u=>.05*(1-.4*u)+.012;
      vine.set(pts,rad,(u,c)=>c.copy(stemDark).lerp(stemTip,.24+.51*u+.10*Math.sin(u*30)));th.put(thornsAlong(pts,rad,2,.8));
      if(st>.21&&st<HIT)trailSample=[pts[26],end];
      if(ev.hit&&st>=HIT&&st<PULL-.01){const charge=1-phase(st,HIT,.70),lit=u=>ease(1-Math.abs(u-charge)/.27)*(1-ease(phase(st,.66,.72)));tensionLight.visible=true;tensionLight.set(pts,u=>rad(u)+.037*lit(u),(u,c)=>c.copy(sapTail).lerp(sapHead,lit(u)).multiplyScalar(1.6*lit(u)));}
      if(ev.hit&&hitAge>=0&&hitAge<.19){hookFlash.visible=true;hookFlash.position.copy(tg);hookFlash.scale.setScalar(.55+hitAge*3.5);hookFlash.material.opacity=.86*(1-ease(hitAge/.19));}
      if(ev.hit&&st>=HIT&&!hit){hit=true;sparks(tg,18,4.2,'#f2ffac','#6fd449',{life:.72,size:1.45});leaves(tg,9,2.7,{dir:side.clone().multiplyScalar(.9),life:.7,size:1.35});}
    }
    hookTrail.push(trailSample);
  },()=>{for(const o of parts)F.drop(o);if(student){if(!student.natHookCast?.foe)student.natHookCast=null;student.cgd=0;}});
}
// Coil around the hooked target, SKS.dash: helix from legs to chest, 3 s; an ally gets hooked barbs and a heal rim climbing every .5 s; an enemy gets purple thorns with poison sparks.
function natCoil(ev){
  const F=natFx(),{T,V3,M,Tube,Thorns,thornsAlong,ring,glow,GLOWG,sparks,puff}=F,ease=natEase,phase=natPhase,allyOnly=!!ev.ally,o=ev.id!=null?PM3.get(ev.id):null,fixed=natWorld(ev.x,ev.y,ev.h-1.1);
  const coil=Tube(60,allyOnly?7:5,M.bark),cth=Thorns(40,allyOnly?.86:.7,null,allyOnly),coilDark=new T.Color('#3e5a1e'),vineColor=new T.Color(allyOnly?'#8fe060':'#7a4a9a');
  const healRim=allyOnly?ring(.56,.62,'#a6ffad',0):null,healFlare=allyOnly?glow(GLOWG,1.2):null,parts=[coil,cth];if(allyOnly)parts.push(healRim,healFlare);
  const radius=.58,height=1.45,LIFE=allyOnly?3.33:3;let healTick=-1,frame=0;
  F.clip(LIFE,(st)=>{frame++;
    const P=o?o.g.position:fixed,unwind=allyOnly?ease(phase(st,3,3.33)):ease(phase(st,2.7,3)),wrap=phase(st,0,.24)*(1-unwind);coil.visible=cth.visible=wrap>.005;
    const coilPoint=u=>{const a=u*Math.PI*7+.35,r=allyOnly?radius+.045*Math.sin(u*27):radius;return V3(P.x+Math.cos(a)*r,P.y+.15+u*height,P.z+Math.sin(a)*r);};
    if(coil.visible){const pts=[];for(let i=0;i<60;i++)pts.push(coilPoint(i/59*wrap));
      const rad=u=>(allyOnly?.056+.010*Math.sin(u*wrap*34):.035)*(1-unwind*.7);
      coil.set(pts,rad,(u,c)=>c.copy(coilDark).lerp(vineColor,.35+.3*Math.sin(u*20)));
      if(allyOnly){const barbs=[];for(let i=0;i<16;i++){const u=.042+i*.060;if(u>=wrap-.012)break;const p=coilPoint(u),out=p.clone().sub(P).setY(0).normalize(),tangent=coilPoint(u+.006).sub(coilPoint(u-.006)).normalize(),direction=out.clone().addScaledVector(tangent,i%2?.82:-.82).normalize();p.addScaledVector(out,rad(u/wrap)*.62);barbs.push({p,d:direction,s:1.08*(1-unwind*.72)});}cth.put(barbs);}
      else cth.put(thornsAlong(pts,rad,3,.7,1.7));
      if(!allyOnly&&frame%3===0){const a=st*6.2,p=P.clone().add(V3(Math.cos(a)*(radius+.10),F.rnd(.26,height+.10),Math.sin(a)*(radius+.10)));sparks(p,2,.54,'#daabfc','#743a9a',{g:-.8,life:1.25,size:1.55});puff(p,1,'#8554ae',{c2:'#48275c',sp:.56,size:.76,life:.64});}
    }
    if(allyOnly){const tick=Math.floor(st/.5+1e-6)-1,age=st-(tick+1)*.5,pulsing=tick>=0&&tick<6&&age<.36;healRim.visible=healFlare.visible=pulsing;
      if(pulsing){const rise=ease(phase(age,0,.36)),fade=(1-rise)*ease(phase(age,-.025,.07));healRim.position.copy(P).add(V3(0,.10+1.51*rise,0));healRim.scale.setScalar(1+.20*Math.sin(Math.PI*rise));healRim.material.opacity=.88*fade;healFlare.position.copy(P).add(V3(0,.9+.46*rise,0));healFlare.scale.setScalar(.90+.42*rise);healFlare.material.opacity=.68*fade;
        if(tick!==healTick){healTick=tick;sparks(P.clone().add(V3(0,.24,0)),9,1.05,'#f2ffbe','#77d35a',{dir:V3(0,1.65,0),g:-.64,life:1.14,size:1.35});}}}
  },()=>{for(const x of parts)F.drop(x);});
}
// Caster pose for the Dash, SKS.dash: stick flicks out to the side, tug on contact, lean into the pull.
const _nfQ=new THREE.Quaternion(),_nfT=new THREE.Quaternion(),_nfX=new THREE.Vector3(1,0,0);
// Tip of the wand the player actually sees: on the rigged model the wand mesh hangs from the hand bone, so o.tip (code arm) drifts once the elbow bends.
function natWandTip(o,out){if(o.fileModel){if(o.nwt===undefined){o.nwt=null;o.fileModel.traverse(m=>{if(!o.nwt&&m.isMesh&&m.visible&&/^wand_\d+$/.test(m.name)){m.geometry.computeBoundingBox();const b=m.geometry.boundingBox,ext=b.max.clone().sub(b.min),ax=ext.x>ext.y?(ext.x>ext.z?'x':'z'):(ext.y>ext.z?'y':'z'),hand=m.parent?m.parent.getWorldPosition(new THREE.Vector3()):null,lo=b.min.clone(),hi=b.max.clone(),mid=b.min.clone().add(b.max).multiplyScalar(.5);lo.x=hi.x=mid.x;lo.y=hi.y=mid.y;lo.z=hi.z=mid.z;lo[ax]=b.min[ax];hi[ax]=b.max[ax];let tip=hi;if(hand){m.updateWorldMatrix(true,false);const wl=m.localToWorld(lo.clone()),wh=m.localToWorld(hi.clone());tip=wl.distanceTo(hand)>wh.distanceTo(hand)?lo:hi;}o.nwt={m,tip};}});}
  if(o.nwt&&o.nwt.m.visible){o.nwt.m.updateWorldMatrix(true,false);return o.nwt.m.localToWorld(out.copy(o.nwt.tip));}}
  o.g.updateMatrixWorld(true);return o.tip.getWorldPosition(out);}
const HOOK_HIT=.43,natPullQ=new THREE.Quaternion(),natPullE=new THREE.Euler();
const _nwQ=new THREE.Quaternion();
// Elbow and wrist bends for Nature poses. The idle clip does not key these bones, so each bend is set from the bone's rest rotation every frame and put back when the pose ends (bending in place made the arm stick and the wand spin).
function natForearmR(o){if(o.nfa===undefined){const a=o.g.getObjectByName('forearm_R'),b=o.g.getObjectByName('forearm_L'),h=o.g.getObjectByName('hand_R');o.nfa=a&&b?[[a,a.quaternion.clone(),'natFaR',-2.1],[b,b.quaternion.clone(),'natFaL',-1.9],...(h?[[h,h.quaternion.clone(),'natWrist',-.55]]:[])]:null;}
  if(!o.nfa){o.natFaR=o.natFaL=o.natWrist=0;return;}
  for(const B of o.nfa){const [bone,q0,key,ang]=B,w=o[key]||0;o[key]=0;if(w>.002){_nfQ.setFromAxisAngle(_nfX,ang*w);bone.quaternion.copy(q0).multiply(_nfQ);B[4]=1;}else if(B[4]){bone.quaternion.copy(q0);B[4]=0;}}}
// Empowered swing poses and effects.
function natEmpPose(o){const E=o.natEmpC;if(!E)return;E.t+=1/60;const t=E.t,e=natEase,ph=natPhase;if(t>1.05){o.natEmpC=null;o.cgd=0;return;}const R=o.armR.rotation,L=o.armL.rotation;
  if(E.k==='slam'){const up=e(ph(t,0,.24)),down=e(ph(t,.26,.36)),rec=e(ph(t,.55,.95)),w=1-rec,dip=down*(1-rec);
    R.set(lerp(lerp(-.2,-3.05,up),-.85,down),0,lerp(.1,-.15,up));L.set(lerp(lerp(-.1,-2.9,up),-.75,down),0,lerp(-.1,.15,up));R.x=lerp(-.2,R.x,w);L.x=lerp(-.1,L.x,w);o.b.rotation.x+=lerp(-.28*up,.52,down)*w;o.b.position.y-=.24*dip;o.legs[0].rotation.x+=-.5*dip;o.legs[1].rotation.x+=.4*dip;o.natFaR=.6*up*(1-down);}
  else{if(!E.r0)E.r0=[R.x,R.y,R.z,L.x,L.y,L.z];const r0=E.r0,ch=e(ph(t,0,.26)),up=e(ph(t,.3,.46)),rec=e(ph(t,.75,1.05)),w=1-rec;   // charge: crouch, wand low toward the ground ahead • release: swing the wand up as the thorns rise
    R.set(lerp(lerp(r0[0],-.95,ch),-2.6,up)*w+r0[0]*rec,lerp(lerp(r0[1],-.1,ch),0,up)*w+r0[1]*rec,lerp(r0[2],0,Math.max(ch,up))*w+r0[2]*rec);
    L.set(lerp(lerp(r0[3],-.5,ch),-.2,up)*w+r0[3]*rec,0,lerp(lerp(r0[5],-.35,ch),-.25,up)*w+r0[5]*rec);
    o.b.rotation.x+=(.3*ch*(1-up)-.2*up)*w;o.b.position.y-=.16*ch*(1-up)*w;o.legs[0].rotation.x+=-.4*ch*(1-up)*w;o.legs[1].rotation.x+=.34*ch*(1-up)*w;}
}
function natBigSlam(ev){const F=natFx(),{V3,Tube,Thorns,thornsAlong,M,T,dirt,leaves,sparks}=F,o=ev.id!=null?PM3.get(ev.id):null;if(o)o.natEmpC={k:'slam',t:0};
  const ca=Math.cos(ev.a),sa=Math.sin(ev.a),D=ev.d||Math.min(ev.r,200),gx=ev.x+ca*D,gy=ev.y+sa*D,end=natWorld(gx,gy,groundH(gx,gy,ev.h)),vine=Tube(34,8,M.bark),th=Thorns(80,1.7),dark=new T.Color('#2a4519'),lite=new T.Color('#6d9a3c');let hit=false;
  F.clip(.9,t=>{const tip=o?o.tip.getWorldPosition(V3()):natWorld(ev.x,ev.y,ev.h+2),grow=natOut(natPhase(t,0,.2)),fall=natPhase(t,.24,.34),back=natEase(natPhase(t,.55,.9)),top=tip.clone().add(V3(-ca*.6,4.6*grow,-sa*.6)),P=[];
    for(let i=0;i<34;i++){const u=i/33,arc=tip.clone().lerp(top,Math.sin(u*Math.PI*.5)).add(V3(0,Math.sin(u*Math.PI)*.8,0)),hitP=tip.clone().lerp(end,u);hitP.y+=Math.sin(u*Math.PI)*2.2*(1-fall);P.push(arc.lerp(hitP,natEase(fall)).lerp(tip,back));}
    vine.visible=th.visible=grow>.02&&back<.98;if(vine.visible){const rad=u=>(.17*(1-u)+.05)*(1-back*.8);vine.set(P,rad,(u,c)=>c.copy(dark).lerp(lite,u*.4));th.put(thornsAlong(P,rad,2,1.4*(1-back)));}
    if(!hit&&fall>=1){hit=true;F.O.y=end.y;dirt(end,30,5.2,{size:1.5,spread:1.4});leaves(end,18,4);sparks(end,24,4.6,'#eaffa0','#5fa83a',{dir:V3(0,2,0)});natShock(end,'#a8d86a',7,.5);if(ev.id===NET.myId)shake(12);snd('boom',{x:gx,y:gy,vol:.8});}},()=>{F.drop(vine);F.drop(th);});}
// World tree roots: a pulsing ground mark first, then whip-style roots burst up from it.
function natRootWarn(ev){const F=natFx(),{T}=F,P=natWorld(ev.x,ev.y,ev.h),R=ev.r*S3,g=new T.Group();F.add(g);g.position.set(P.x,P.y+.06,P.z);
  const mk=(a,b,c,o)=>{const m=new T.Mesh(new T.RingGeometry(a,b,40),new T.MeshBasicMaterial({color:c,transparent:true,opacity:o,depthWrite:false,side:T.DoubleSide}));m.rotation.x=-Math.PI/2;g.add(m);return m;};
  const rim=mk(.9,1,'#ff2a1a',.95),fill=mk(0,1,'#ff3a2a',.22),inner=mk(.0,.02,'#ff6a4a',.6);
  F.clip(ev.t,t=>{const k=t/ev.t;g.scale.setScalar(R);rim.material.opacity=.55+.4*Math.sin(t*28);inner.scale.setScalar(Math.max(.01,k*50));inner.material.opacity=.35*(1-k*.5);fill.material.opacity=.12+.12*k;},()=>{const i=F.ALL.indexOf(g);if(i>=0)F.ALL.splice(i,1);g.parent&&g.parent.remove(g);g.traverse(q=>{q.geometry&&q.geometry.dispose();q.material&&q.material.dispose();});});}
function natRootUp(ev){const F=natFx(),{V3,T,M,Tube,Thorns,thornsAlong,dirt,leaves,sparks}=F,B=natWorld(ev.x,ev.y,ev.h),R=ev.r*S3*.6,dark=new T.Color('#3a2412'),mid=new T.Color('#5a7a2c'),tipC=new T.Color('#b6ff63'),roots=[];
  for(let i=0;i<6;i++){const a=i/6*6.283+Math.random()*.5,r=R*(.25+Math.random()*.6);roots.push({tube:Tube(12,7,M.bark),th:Thorns(14,1.1,null,true),x:B.x+Math.cos(a)*r,z:B.z+Math.sin(a)*r,a:a+Math.PI+(Math.random()-.5)*.6,H:1.6+Math.random()*1.4,R:.16+Math.random()*.08,tw:Math.random()*6});}
  F.O.y=B.y;dirt(B.clone(),22,4,{spread:1.6});leaves(B.clone().add(V3(0,.4,0)),8,2.6);sparks(B.clone().add(V3(0,.5,0)),14,3,'#eaffa0','#5fa83a');natShock(B,'#a8ff6a',3,.4,.5);
  F.clip(1.1,t=>{const k=natOut(natPhase(t,0,.12))*(1-natEase(natPhase(t,.6,1.05)));for(const q of roots){q.tube.visible=q.th.visible=k>.01;if(!q.tube.visible)continue;const P=[],ax=Math.cos(q.a),az=Math.sin(q.a);for(let i=0;i<12;i++){const u=i/11,h=q.H*u*k,b=q.H*.55*u*u*k,w=Math.sin(u*5+q.tw)*.08*u;P.push(V3(q.x+ax*b-az*w,B.y+h,q.z+az*b+ax*w));}const rad=u=>Math.max(.004,q.R*((1-u)**1.5)*Math.max(.05,k));q.tube.set(P,rad,(u,c)=>c.copy(dark).lerp(mid,Math.min(1,u*1.4)).lerp(tipC,Math.max(0,u-.78)*3));q.th.put(thornsAlong(P,rad,3,.9*k,2.1));}},
    ()=>{for(const q of roots){F.drop(q.tube);F.drop(q.th);}});
  snd('boom',{x:ev.x,y:ev.y,vol:.4});}
function natThornLine(ev){const F=natFx(),{V3,T,M,Tube,Thorns,thornsAlong,dirt,leaves,sparks}=F,o=ev.id!=null?PM3.get(ev.id):null;if(o)o.natEmpC={k:'line',t:0};
  // Whip-style thorns: bark tubes dark at the root, light green toward a bright tip, hooked thorns along them.
  const dark=new T.Color('#19371a'),mid=new T.Color('#4f7f30'),tipC=new T.Color('#b6ff63');
  const spike=(H,R,bend,ang)=>{const tube=Tube(12,7,M.bark),th=Thorns(16,1.05,null,true);tube.castShadow=th.castShadow=true;return {tube,th,H,R,bend,ang};};
  const setSpike=(q,base,k)=>{const P=[],ax=Math.cos(q.ang),az=Math.sin(q.ang),tw=q.tw||0;for(let i=0;i<12;i++){const u=i/11,h=q.H*u*k,b=q.H*Math.tan(q.tilt||.8)*u*k+q.bend*.1*u*u*k,w=Math.sin(u*5+tw)*.07*u;P.push(V3(base.x+ax*b-az*w,base.y+h,base.z+az*b+ax*w));}const rad=u=>Math.max(.004,q.R*((1-u)**1.7)*(1+.16*Math.sin(u*31+tw))*Math.max(.05,k));q.tube.set(P,rad,(u,c)=>c.copy(dark).lerp(mid,Math.min(1,u*1.5)).lerp(tipC,Math.max(0,u-.74)*2.8).multiplyScalar(.82+.22*Math.sin(u*38+tw)));q.th.put(thornsAlong(P,rad,3,.95*k,2.1));};
  const N=16,ca=Math.cos(ev.a),sa=Math.sin(ev.a),line=[];
  for(let i=0;i<N;i++){const d=40+i*(ev.r-40)/(N-1),side=(i%2?1:-1)*(8+Math.random()*14),x=ev.x+ca*d-sa*side,y=ev.y+sa*d+ca*side,base=natWorld(x,y,groundH(x,y,ev.h)),at=.34+i*.018,sz=.75+.5*Math.sin(Math.PI*i/(N-1));
    for(let c=0;c<3;c++){const main=c===0,lean=ev.a+(c===1?.55:c===2?-.55:0)+(Math.random()-.5)*.25,q=spike((main?3+Math.random()*1.2:1.5+Math.random()*.8)*sz,(main?.28:.16)*sz,(main?1.3:1)+(Math.random()-.3)*.3,lean);q.hook=main?.16:.08;q.tw=Math.random()*6;q.base=main?base:base.clone().add(V3(Math.cos(lean)*.22,0,Math.sin(lean)*.22));q.at=at+c*.025;q.done=c>0;q.tube.visible=q.th.visible=false;line.push(q);}}
  F.clip(2.4,t=>{   // หนามค้างนานขึ้นก่อนหาย (ผู้ใช้ 2026-11-15)
    for(const q of line){const a=t-q.at;if(a<0)continue;const k2=natOut(natPhase(a,0,.1))*(1-natEase(natPhase(a,1.5,1.9)));q.tube.visible=q.th.visible=k2>.01;if(q.tube.visible)setSpike(q,q.base,k2);
      if(!q.done){q.done=true;F.O.y=q.base.y;dirt(q.base.clone(),7,3.2,{spread:.5});leaves(q.base.clone().add(V3(0,.5,0)),3,2.2);sparks(q.base.clone().add(V3(0,.6,0)),4,2.6,'#eaffa0','#5fa83a');}}
    if(t>=.34&&t-1/60<.34){snd('boom',{x:ev.x,y:ev.y,vol:.6});if(ev.id===NET.myId)shake(8);}},
    ()=>{for(const q of line){F.drop(q.tube);F.drop(q.th);}});}
function natRest(o,dt){const R=o.natRel;if(!R)return;R.t+=dt;const f=Math.min(1,dt*14);for(const k of o.rig||[]){if(k.c!==o.armR&&k.c!==o.armL)continue;const r=k.c.rotation;r.x=lerp(r.x,k.sx,f);r.y=lerp(r.y,0,f);r.z=lerp(r.z,k.sz,f);}if(!o.rig){o.armR.rotation.set(lerp(o.armR.rotation.x,-.18,f),0,lerp(o.armR.rotation.z,.12,f));o.armL.rotation.set(lerp(o.armL.rotation.x,-.12,f),0,lerp(o.armL.rotation.z,-.12,f));}if(R.t>.4)o.natRel=null;}
// Hooking an enemy, played as one motion (user 2026-11-14):
// 1 wind-up: wand lifts back over the right shoulder • 2 throw: the arm snaps forward and stays aimed at the enemy, wand in line with the vine
// 3 hold: arm locked on the target, body braced a little back • 4 reel: torso twists right, elbow drives back to the right side, forearm folds in, left hand comes up in front for balance
// 5 settle: everything eases back to the stance the character had before the cast
function natHookFoePose(o,C){if(C.t===C.pt)C.t+=1/60;C.pt=C.t;const st=C.t,e=natEase,ph=natPhase,R=o.armR.rotation,L=o.armL.rotation,H=natHookArm;
  if(!C.r0){C.r0=[R.x,R.y,R.z,L.x,L.y,L.z];C.q0=o.armR.quaternion.clone();}const r0=C.r0;
  // 1-2 throw and hold: the approved preview cast (stick flicks out to the side, whips through), then the arm stays aimed straight at the enemy
  const draw=e(ph(st,0,.17)),swing=e(ph(st,.17,.43)),wind=draw*(1-swing),follow=Math.sin(Math.PI*ph(st,.26,.6))*(1-e(ph(st,.43,.6)));
  const yaw=-1.64*wind+.24*follow,lift=.16+.29*wind-.29*follow;
  H.a.set(Math.sin(yaw),lift*(1-swing)+.06*swing,Math.cos(yaw)).normalize();H.cast.setFromUnitVectors(H.down,H.a);
  const reel=e(ph(st,C.pull-.04,C.pull+.12)),back=e(ph(st,C.done+.02,C.done+.34)),on=1-back;
  o.armR.quaternion.copy(C.q0).slerp(H.cast,draw);
  // 3 reel in: torso twists right, elbow drives back to the right side, forearm folds in, left hand comes up in front
  natPullQ.setFromEuler(natPullE.set(-.35,-.95,-1.25,'YXZ'));o.armR.quaternion.slerp(natPullQ,reel);
  // 4 settle back to the stance before the cast
  o.armR.quaternion.slerp(C.q0,back);
  L.set(lerp(lerp(r0[3],-.24-.1*swing,draw),-1.25,reel)*on+r0[3]*back,lerp(.24*wind,.25,reel)*on+r0[4]*back,lerp(lerp(r0[5],-.13-.3*wind,draw),.4,reel)*on+r0[5]*back);
  o.b.rotation.y+=(-.54*wind+.24*follow-.85*reel)*on;o.b.rotation.x+=(-.15*wind-.06*swing*(1-reel)-.22*reel)*on;o.b.rotation.z+=(.14*wind)*on;
  o.natFaR=.95*reel*on;o.natFaL=.8*reel*on;
  if(st>C.done+.36)o.natHookCast=null;}
function natHookPose(o){   // SKS.dash arm: draw back, whip through with the vine, tug on contact, ease out
  const C=o.natHookCast;if(!C)return;
  if(C.foe){natHookFoePose(o,C);return;}const st=C.t,ease=natEase,phase=natPhase,draw=ease(phase(st,0,.17)),swing=ease(phase(st,.17,.43)),letGo=C.hit?ease(phase(st,C.done-.1,C.done+.2)):ease(phase(st,.43,.65));
  const wind=draw*(1-swing),follow=C.foe?0:Math.sin(Math.PI*phase(st,.26,.60)),hitAge=st-.43,snap=hitAge>=0&&!C.foe?.5*Math.sin(26*hitAge)*Math.exp(-9*hitAge):0,launch=C.foe?0:Math.sin(Math.PI*phase(st,C.pull-.03,C.pull+.18)),yaw=-1.64*wind+.24*follow-.22*snap;
  natHookArm.a.set(Math.sin(yaw),.5+.29*wind-.08*follow-.08*snap,Math.cos(yaw)).normalize();natHookArm.idle.setFromEuler(new THREE.Euler(-.17,0,.12,'YXZ'));natHookArm.cast.setFromUnitVectors(natHookArm.down,natHookArm.a);
  o.armR.quaternion.copy(natHookArm.idle).slerp(natHookArm.cast,draw*(1-letGo));o.natWrist=draw*(1-letGo);
  o.b.rotation.x+=-.15*wind+.19*snap+.22*launch;o.b.rotation.y+=-.54*wind+.24*follow-.12*snap;o.b.rotation.z+=.14*wind-.09*snap;o.armL.rotation.set(-.24-.45*launch,.24*wind,-.13-.30*wind);
  if(C.hit&&C.foe&&st>HOOK_HIT){   // enemy hooked: hold the tension leaning sideways, then reel in leaning back and twisting right (user 2026-11-14)
    const sm=ease,ten=sm(phase(st,HOOK_HIT,C.pull))*(1-sm(phase(st,C.pull,C.pull+.3))),k=sm(phase(st,C.pull-.1,C.pull+.06))*(1-sm(phase(st,C.done-.02,C.done+.16)));
    o.b.rotation.z+=-.24*ten;o.b.rotation.y+=-.22*ten;o.b.rotation.x+=-.1*ten;o.armR.rotation.x+=-.35*ten;   // lean away from the pulling arm so the wand stays up on the vine
    natPullQ.setFromEuler(natPullE.set(-.12,-.8,-1.38,'XYZ'));o.armR.quaternion.slerp(natPullQ,k);
    o.b.rotation.y+=-.9*k;o.b.rotation.x+=-.24*k;o.b.rotation.z+=.06*k;
    o.armL.rotation.set(lerp(o.armL.rotation.x,-1.32,k),lerp(o.armL.rotation.y,.15,k),lerp(o.armL.rotation.z,.35,k));
    o.legs[0].rotation.x+=-.14*k;o.legs[1].rotation.x+=.12*k;o.natFaR=Math.max(o.natFaR||0,.95*k);o.natFaL=Math.max(o.natFaL||0,.9*k);return;}
  if(C.hit&&st>C.pull&&st<C.done){const pull=phase(st,C.pull,C.done);o.b.rotation.x+=.48*Math.sin(pull*Math.PI);o.legs[0].rotation.x=-.6*Math.sin(pull*Math.PI);o.legs[1].rotation.x=.5*Math.sin(pull*Math.PI);}
}
const natHookArm={a:new THREE.Vector3(),down:new THREE.Vector3(0,-1,0),idle:new THREE.Quaternion(),cast:new THREE.Quaternion()};
// Particle moments of the approved previews (tools/nature-preview.js), same calls and numbers.
function natShock(p,col,size=6,life=.6,gain=.8){const F=natFx(),r=F.ring(.25,.5,col,.8);r.position.set(p.x,F.O.y+.05,p.z);F.clip(life,t=>{const k=t/life;r.scale.setScalar(1+k*size);r.material.opacity=(1-k)*gain;},()=>F.drop(r));}
function natSprout(p,n=1){const F=natFx(),{V3}=F;F.dirt(p,14*n,3.2);F.leaves(p,10*n,3);F.sparks(p.clone().add(V3(0,.3,0)),16*n,3.5,'#fff7b0','#8ee05a');}
function natHealRims(o){const F=natFx(),{V3,ring,sparks}=F,rims=[ring(.52,.58,'#8dffa9',0),ring(.45,.49,'#d2ffb2',0)];sparks(o.g.position.clone().add(V3(0,.20,0)),6,1.1,'#e1ffc1','#53d67b',{dir:V3(0,1.4,0),g:-.85,life:1.15,size:.9});
  F.clip(.76,t=>{rims.forEach((rim,i)=>{const age=t-i*.09,k=natPhase(age,0,.65);rim.visible=age>=0&&k<1;rim.position.copy(o.g.position).add(V3(0,.08+1.47*natEase(k),0));rim.scale.setScalar(1+.18*Math.sin(k*Math.PI));rim.material.opacity=.78*(1-natEase(k));});},()=>rims.forEach(r=>F.drop(r)));}
function natWhipHit(ev){const F=natFx(),{V3,leaves,sparks,SPK}=F,p=natWorld(ev.x,ev.y,ev.h),dir=V3((Math.random()<.5?-1:1)*2.4,.65,1);leaves(p,6,2.8,{dir,life:.65});sparks(p,9,4.2,'#edff9d','#62d04a',{dir,life:.6,size:1.4});for(let i=0;i<5;i++){const v=V3(F.rnd(-2,2),F.rnd(0,2.6),F.rnd(-1.6,1.6)).add(dir);SPK.add({p:p.clone(),v,life:F.rnd(.15,.28),size:F.rnd(.08,.14),spin:F.rnd(-12,12),g:5,drag:1,col:'#a4e153',c2:'#375e22',sx:3.2,shrink:1});}}
function natBallRange(P){const F=natFx(),{T}=F,R=100*S3,r=F.ring(.965,1,'#e9ff8a',.95),d=new T.Mesh(new T.CircleGeometry(1,48),new T.MeshBasicMaterial({color:'#b8e04a',transparent:true,opacity:.2,depthWrite:false}));d.rotation.x=-Math.PI/2;F.add(d);d.frustumCulled=false;r.position.set(P.x,P.y+.06,P.z);d.position.set(P.x,P.y+.05,P.z);F.clip(.72,t=>{const e=natOut(Math.min(1,t/.1));r.scale.setScalar(R*e);d.scale.setScalar(R*e);const f=1-natEase(natPhase(t,.56,.72));r.material.opacity=.95*f;d.material.opacity=.2*f;},()=>{F.drop(r);F.drop(d);});}
// Calling the ultimate: energy winds up around the caster, then a beam drops the tree onto the chosen spot.
function natSummon(ev){const F=natFx(),{V3,sparks,leaves,dirt,Tube,ADD,T}=F,o=ev.id!=null?PM3.get(ev.id):null,end=natWorld(ev.x2,ev.y2,ev.h2),fb=natWorld(ev.x,ev.y,ev.h),mat=ADD('#ffffff',{vertexColors:true}),beam=Tube(24,6,mat);beam.castShadow=false;beam.visible=false;let hit=false,beat=0;const FIRE=.9,c1=new T.Color('#eaffb0'),c2=new T.Color('#3df06a');
  F.clip(1.55,t=>{const b=o?o.g.position:fb,tip=o?o.tip.getWorldPosition(V3()):b.clone().add(V3(0,2.4,0));
    if(t<FIRE&&t>=beat){beat=t+.035;const k=t/FIRE,a=t*9,r=2.4*(1-k*.75);for(let i=0;i<2;i++){const A=a+i*Math.PI;const p=b.clone().add(V3(Math.cos(A)*r,.2+k*2.4,Math.sin(A)*r));sparks(p,2,.5,'#eaffb0','#3df06a',{g:-1.4,life:1,size:1.5});leaves(p,1,.8,{life:.8,size:1.1});}}
    if(t>=FIRE&&!hit){hit=true;F.O.y=end.y;natShock(end,'#7dff6a',24,.8,.32);natShock(end,'#3df06a',12,.55,.32);dirt(end,46,7,{size:2,spread:4});leaves(end,44,6);sparks(end.clone().add(V3(0,.4,0)),44,6,'#f7ffc0','#5ee64a',{dir:V3(0,2.6,0),life:1,size:1.7});F.O.y=b.y;natShock(b,'#7dff6a',7,.5,.4);shake(0.45);}
    beam.visible=t>=FIRE-.08&&t<FIRE+.42;if(beam.visible){const q=natPhase(t,FIRE-.08,FIRE+.06),f=1-natEase(natPhase(t,FIRE+.18,FIRE+.42)),pts=[];const top=end.clone().add(V3(0,9,0));for(let i=0;i<24;i++){const u=i/23,p=tip.clone().lerp(top,Math.min(1,u*2)).lerp(end,Math.max(0,u*2-1));p.y+=Math.sin(u*Math.PI)*2.2;p.x+=Math.sin(u*16+t*30)*.08;pts.push(p);}beam.set(pts,u=>(.05+.16*(1-Math.abs(u-.5)*2)*q)*f+.012,(u,c)=>c.copy(c1).lerp(c2,u).multiplyScalar(.45*f));}
  },()=>{F.drop(beam);mat.dispose();});}
// Tree aura: range rings, ground motes, and separate root, trunk and crown layers.
// Enemy-owned tree reads red for the other team.
const NAT_TREE_GREEN=['#b4ff7a','#7dff6a','#b6ff7a','#5dff6e','#2fd05c','#d9ffba','#3fe07a','#8bff5a','#c8ffb4','#42e870'],NAT_TREE_RED=['#ff8a6a','#ff5a3a','#ff9a7a','#ff4a3a','#c8281a','#ffc0b0','#e0402a','#ff6a4a','#ffb4a0','#e8402a'];
let _natGlowRed=null;function NAT_GLOW_RED(){if(_natGlowRed)return _natGlowRed;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,210,190,1)');g.addColorStop(.35,'rgba(255,70,40,.5)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);_natGlowRed=new THREE.CanvasTexture(c);return _natGlowRed;}
function natFoe(s){const me=VIEW.cur?.P?.find(q=>q.id===NET.myId);return !!me&&s.team!==undefined&&s.team!==me.tm;}
function natTreeTint(v,foe){if(v.g&&v.gTint!==foe){v.gTint=foe;v.g.traverse(q=>{if(q.isMesh&&q.material?.color)q.material.color.set(foe?'#8a2a20':'#475631');});}if(v.tinted===foe)return;const m=v.fx?.L?.[0]?.inner;if(!m)return;v.tinted=foe;m.traverse(q=>{if(!q.isMesh||!q.material)return;for(const mat of [].concat(q.material)){if(!mat.userData.natBase)mat.userData.natBase={c:mat.color?.clone(),e:mat.emissive?.clone()};const B=mat.userData.natBase;if(foe){mat.color?.set('#4a0606');mat.emissive?.set('#ff1a0a');if('emissiveIntensity' in mat){B.i??=mat.emissiveIntensity;mat.emissiveIntensity=.12;}}else{B.c&&mat.color?.copy(B.c);B.e&&mat.emissive?.copy(B.e);if(B.i!==undefined)mat.emissiveIntensity=B.i;}}});}
function natTreeAura(v,s,dt){const F=natFx(),{T,V3,ring,glow,GLOWG,GLOWT,sparks,leaves}=F,foe=natFoe(s),C=foe?NAT_TREE_RED:NAT_TREE_GREEN,R=NAT.treeRange*S3,B=natWorld(s.x,s.y,s.h),age=s.age;
  if(!v.aura){const mk=(a,b,c,o,y)=>{const r=ring(a,b,c,o);r.position.set(B.x,B.y+y,B.z);return r;};const inner=new T.Group();F.add(inner);inner.position.set(B.x,B.y+.08,B.z);const rune=new T.MeshBasicMaterial({color:C[0],transparent:true,opacity:.55,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});const arcs=[];for(let i=0;i<12;i++){const a=new T.Mesh(new T.RingGeometry(.92,1,18,1,i*Math.PI/6,.34),rune);a.rotation.x=-Math.PI/2;inner.add(a);arcs.push(a);}const rootR=mk(.72,1,C[1],.75,.1),crown=glow(foe?NAT_GLOW_RED():GLOWG,9),crown2=glow(GLOWT,5);crown.position.set(B.x,B.y+NAT.treeHeight*.8,B.z);crown2.position.copy(crown.position);v.aura={rim:mk(.982,1,C[2],.95,.09),rim2:mk(.93,.945,C[3],.55,.09),disc:mk(.02,.98,C[4],.1,.05),inner,rune,arcs,rootR,crown,crown2,parts:[inner],t:0,leaf:0,mote:0};v.aura.parts.push(v.aura.rim,v.aura.rim2,v.aura.disc,rootR,crown,crown2);}
  const A=v.aura,gr=natOut(natPhase(age,0,NAT.treeGrow*.7)),P=1+.04*Math.sin(age*3);A.rim.scale.setScalar(R*gr);A.rim2.scale.setScalar(R*gr*P);A.disc.scale.setScalar(R*gr);A.inner.scale.setScalar(R*.72*gr);A.inner.rotation.y=age*.35;A.rune.opacity=.55*gr*(.7+.3*Math.sin(age*5));A.rootR.scale.setScalar(5.2*gr*(1+.08*Math.sin(age*6)));A.crown.scale.setScalar((9+Math.sin(age*3)*1.4)*gr);A.crown.material.opacity=.7*gr;A.crown2.scale.setScalar((5+Math.sin(age*5))*gr);A.crown2.material.opacity=.55*gr;
  natTreeTint(v,foe);if(gr<.15)return;A.t-=dt;if(A.t<=0){A.t=.03;F.O.y=B.y;
    {const a=F.rnd(0,6.283),r=Math.sqrt(F.rnd(0,1))*R*.96,p=B.clone().add(V3(Math.cos(a)*r,.1,Math.sin(a)*r));sparks(p,2,.5,C[5],C[6],{dir:V3(0,1.5,0),g:-.6,life:1.5,size:1.1});}
    {const a=age*3.2,q=B.clone().add(V3(Math.cos(a)*3,.25,Math.sin(a)*3));sparks(q,2,.7,'#fff1a0',C[7],{dir:V3(0,3,0),g:-1,life:1,size:1.5});}
    {const a=age*2.1,h=((age*2.4)%1)*NAT.treeHeight*.72,rad=2.6-h*.06,q=B.clone().add(V3(Math.cos(a)*rad,h+.5,Math.sin(a)*rad));sparks(q,2,.55,C[8],C[9],{g:-.5,life:1.2,size:1.4});}
    {const a=F.rnd(0,6.283),q=B.clone().add(V3(Math.cos(a)*F.rnd(1,8),NAT.treeHeight*F.rnd(.7,.95),Math.sin(a)*F.rnd(1,8)));sparks(q,1,.3,'#fff8cc','#ffd76a',{dir:V3(0,-1.8,0),g:.5,life:1.8,size:1.4});}
    A.leaf--;if(A.leaf<=0){A.leaf=4;const a=F.rnd(0,6.283),q=B.clone().add(V3(Math.cos(a)*F.rnd(2,12),NAT.treeHeight*F.rnd(.55,.9),Math.sin(a)*F.rnd(2,12)));leaves(q,2,.9,{dir:V3(0,-.9,0),life:2.4,size:1.5});}}
}
function natAuraDrop(v){if(!v.aura)return;const F=natFx();for(const o of v.aura.parts)if(o.isGroup){const i=F.ALL.indexOf(o);if(i>=0)F.ALL.splice(i,1);o.parent&&o.parent.remove(o);o.traverse(q=>{q.geometry&&q.geometry.dispose();});}else F.drop(o);v.aura.rune.dispose();v.aura=null;}
// Placement hologram: cyan, low opacity, follows the host's chosen spot.
const NAT_HOLO={};
function natHoloMake(k){const g=new THREE.Group(),m=new THREE.MeshBasicMaterial({color:'#47f4ff',transparent:true,opacity:.3,depthWrite:false,side:THREE.DoubleSide}),e=new THREE.LineBasicMaterial({color:'#9ffbff',transparent:true,opacity:.75});
  const add=(geo,x,y,z,ry=0)=>{const b=natMesh(geo,m,g);b.position.set(x,y,z);b.rotation.y=ry;const l=new THREE.LineSegments(new THREE.EdgesGeometry(geo),e);l.position.copy(b.position);l.rotation.y=ry;g.add(l);};
  if(k===1){const H=NAT.wallHeight;for(let i=-2;i<=2;i++)add(new THREE.BoxGeometry(2.05,H,1.05),i*2.1,H/2,-i*i*.19,i*.1);}
  else if(k===3){const L=natMesh(new THREE.CylinderGeometry(.9,1.1,.5,12),m,g);L.position.y=.25;for(let i=0;i<6;i++){const a=i/6*Math.PI*2;add(new THREE.ConeGeometry(.45,1.4,4),Math.cos(a)*.8,.7,Math.sin(a)*.8);}const r=natMesh(new THREE.RingGeometry(.97,1,96),m,g);r.rotation.x=-Math.PI/2;r.position.y=.1;r.scale.setScalar(NAT.lotusRange*S3);}   // ดอกบัว: ดอก + วงรัศมีบัฟ
  else{add(new THREE.CylinderGeometry(.9,1.8,10,9),0,5,0);add(new THREE.IcosahedronGeometry(6.4,1),0,14,0);const r=natMesh(new THREE.RingGeometry(.975,1,96),m,g);r.rotation.x=-Math.PI/2;r.position.y=.1;r.scale.setScalar(NAT.treeRange*S3);}
  return natAdd(g);}
function natHolo(me){const A=me?.nt?.[5]&&me.al&&!me.dn?me.nt[5]:0;{const k=A?A[0]:0;if(k&&NAT_HOLO.hint!==k)toast(k===1?'คลิก = วางกำแพง • ค้างซ้าย = หมุน • คลิกขวา = ยกเลิก':k===3?'คลิก = วางดอกบัว • คลิกขวา = ยกเลิก':'คลิก = เรียกต้นไม้ • คลิกขวา = ยกเลิก');NAT_HOLO.hint=k;}
  {const on=A&&A[0]===3;if(on&&!NAT_HOLO.rng){const g=new THREE.Group(),r=natMesh(new THREE.RingGeometry(.985,1,128),new THREE.MeshBasicMaterial({color:'#9ffbff',transparent:true,opacity:.45,depthWrite:false,side:THREE.DoubleSide}),g);r.rotation.x=-Math.PI/2;r.position.y=.08;r.scale.setScalar(NAT.seedRange*S3);NAT_HOLO.rng=natAdd(g);}if(NAT_HOLO.rng){NAT_HOLO.rng.visible=!!on;if(on)natSet(NAT_HOLO.rng,me.x,me.y,me.z||0);}}   // ระยะวางสูงสุดรอบตัว
  for(const k of [1,2,3]){const on=A&&A[0]===k;if(on&&!NAT_HOLO[k])NAT_HOLO[k]=natHoloMake(k);if(!NAT_HOLO[k])continue;NAT_HOLO[k].visible=!!on;if(on){natSet(NAT_HOLO[k],A[1],A[2],A[3]);NAT_HOLO[k].rotation.y=Math.PI/2-A[4];const t=performance.now()*.005;NAT_HOLO[k].traverse(q=>{if(q.material&&q.material.isMeshBasicMaterial)q.material.opacity=.26+.08*Math.sin(t);});}}}
function natHoloClear(){for(const k of [1,2,3,'rng'])if(NAT_HOLO[k]){disposeObj(NAT_HOLO[k]);delete NAT_HOLO[k];}}
const natDirOf=a=>natFx().V3(Math.cos(a||0),0,Math.sin(a||0));
function natMoment(ev){
  const F=natFx(),{V3,leaves,sparks,dirt,puff,chips}=F,x=ev.x,y=ev.y,h=ev.h,P=natWorld(x,y,h),base=natWorld(x,y,groundH(x,y,h));F.O.y=base.y;
  switch(ev.z){
    case 'nature_shield_block':{const n=natDirOf(ev.a),so=ev.id!=null?PM3.get(ev.id):null;if(so?.natShield)so.natShield.userData.nat.hitT=performance.now();sparks(P,15,3.3,'#f5ffb1','#91d84e',{dir:n.clone().multiplyScalar(1.3),life:.75});leaves(P,7,1.9,{dir:n.clone().multiplyScalar(1.6),life:.58,size:1.2});break;}
    case 'nature_pea_shot':{const d=natDirOf(ev.a);sparks(P,10,2.45,'#f8ffbb','#70c638',{dir:d.clone().multiplyScalar(1.55),life:.54,size:1.42});leaves(P,3,1.55,{dir:d,life:.60,size:.95});break;}
    case 'nature_pea_muzzle':sparks(P,14,3.4,'#f1ffbc','#82d843',{life:.64,size:.9,dir:natDirOf(ev.a).multiplyScalar(1.7)});break;
    case 'nature_pea_splash':sparks(P,24,5.2,'#f2ffa1','#70ce3d',{size:1.2,life:.76});leaves(P,9,4,{col:'#99ca49',life:.56});break;
    case 'nature_spore_gain':sparks(P,5,1.25,'#eaffae','#6ae654',{life:.8,size:1.14});break;
    case 'nature_spore_send':sparks(P,6,1.2,'#d6ff89','#65b837',{life:.76,size:1.2});break;
    case 'nature_spore_pop':sparks(P,10,3.2,'#fff3b0','#81d543',{life:.67});puff(P,6,'#7fba46',{c2:'#416a2d',sp:.42,size:.72,spread:.52,life:.75});break;
    case 'nature_ball_land':natBallRange(P);dirt(P,19,3.3,{size:1.05,spread:1.15});chips(P,9,2.9);leaves(P,9,2.4,{life:.70});natShock(P,'#a2cd69',2.5,.38);break;
    case 'nature_ball_pop':chips(P,28,5.4);leaves(P,23,4.8,{dir:V3(0,2.1,0),life:.83,size:1.22});puff(P,7,'#a99470',{sp:1.4,size:.80});natShock(P,'#bde578',4.7,.46);sparks(P,29,4.8,'#eaffac','#66c13d',{dir:V3(0,1.8,0),life:.93,size:1.24});break;
    case 'nature_relocate':{const o=P.clone(),n=natWorld(ev.x2,ev.y2,ev.h2);leaves(o.clone().add(V3(0,.11,0)),9,1.5,{life:.70,size:1.22});sparks(o.clone().add(V3(0,.12,0)),13,1.25,'#baff72','#42dc3c',{life:.85,size:1.22});
      {const mk=F.ring(.5,.72,'#baff72',.95);mk.position.set(n.x,n.y+.07,n.z);const dot=F.ring(.12,.26,'#efffc8',.95);dot.position.set(n.x,n.y+.07,n.z);F.clip(.62,t=>{const k=t/.62,e=natOut(Math.min(1,k/.25));mk.scale.setScalar(e*(1+.12*Math.sin(t*22)));mk.material.opacity=.95*(1-natEase(natPhase(k,.8,1)));dot.material.opacity=mk.material.opacity;},()=>{F.drop(mk);F.drop(dot);});}
      later(.56,()=>{const G2=natFx();G2.O.y=n.y;G2.sparks(n.clone().add(G2.V3(0,.16,0)),29,2.4,'#c1ff67','#39de3c',{dir:G2.V3(0,1.2,0),life:1.1,size:1.42});G2.leaves(n.clone().add(G2.V3(0,.1,0)),16,2.20,{life:.92,size:1.31});natShock(n,'#89ff4b',3.25,.52);});break;}
    case 'nature_pulse':{const o=ev.id!=null?PM3.get(ev.id):null;leaves(base.clone().add(V3(0,.2,0)),6,1.3,{life:.75,size:1.18});let beat=0;F.clip(.78,t=>{if(t<beat)return;beat=t+.05;const p=o?o.tip.getWorldPosition(V3()):P.clone().add(V3(0,2.4,0));sparks(p,3,.9,'#eaffbe','#77db5c',{g:-.7,life:.9,size:1.2});leaves(p,1,.9,{life:.7,size:.95});});break;}
    case 'nature_summon':natSummon(ev);break;
    case 'nature_lotus_switch':{const tint=ev.mode?'#b9f173':'#ff9acb';sparks(P,18,2.5,'#f7ffc7',tint,{g:-.55,life:1.12});natShock(base,tint,15,.53);break;}
    case 'nature_plant_hit':sparks(P,9,2.6,'#f1ffb0','#65a335',{life:.7});leaves(P,4,1.9,{life:.73,size:1.14});break;
    case 'nature_seed':later(ev.t||.27,()=>{const q=natWorld(ev.x2,ev.y2,ev.h2),G2=natFx();G2.O.y=q.y;natSprout(q,1.6);natShock(q,'#b4ff70',6,.6);});break;
    case 'nature_plant_end':{
      if(ev.kind==='tree')break;
      const c=base.clone().add(V3(0,ev.kind==='lotus'?4:1.2,0));
      if(ev.kind==='lotus'){leaves(c,14,2.28,{col:'#ef9ac5',dir:V3(0,.7,0),life:1.07,size:1.55});sparks(c,18,1.63,'#ffddaa','#ee88ba',{dir:V3(0,.83,0),life:1.23,g:-.45,size:1.30});}
      else if(ev.broke){sparks(c,23,4.25,'#f1ffb0','#65a335',{life:.7});leaves(c,13,3.1,{life:.73,size:1.14});chips(c,7,2.2);later(.42,()=>{const G2=natFx();G2.O.y=base.y;G2.leaves(base.clone().add(G2.V3(0,.2,0)),7,1.4,{life:.73,size:.90});G2.sparks(base.clone().add(G2.V3(0,.2,0)),8,1.6,'#b6e568','#547d32',{life:.69,size:.86});});}
      else{const drift=V3(0,.45,0);sparks(c,4,.61,'#e9f3a1','#79c751',{dir:drift,life:1.24,g:-.27});leaves(c,2,.83,{dir:drift,life:.82,size:1.10});sparks(base.clone().add(V3(0,.06,0)),7,.64,'#b4eb77','#69a84e',{life:1});}
      break;}
  }
}
function natureEvent(ev){
  const {x,y,h}=ev,color='#b9f173';
  natMoment(ev);
  switch(ev.z){
    case 'nature_seed':natSeed(ev);break;
    case 'nature_spore_gain':case 'nature_spore_send':natSeed(ev,true);break;
    case 'nature_hook':{
      const student=PM3.get(ev.id);if(student){castStart(student,'vine',1);student.cgd=0;student.gw=0;}   // no guard stance after the Dash (user 2026-11-14)
      natHook(ev,student);
      snd('whoosh',{x,y,vol:.45});break;
    }
    case 'nature_coil':natCoil(ev);break;
    case 'nature_bigslam':natBigSlam(ev);break;
    case 'nature_thornline':natThornLine(ev);break;
    case 'nature_rootwarn':natRootWarn(ev);break;
    case 'nature_rootup':natRootUp(ev);break;
    case 'nature_slam':natSlam(ev);break;
    case 'nature_summon':case 'nature_shield_block':case 'nature_pea_shot':case 'nature_pulse':case 'nature_plant_hit':case 'nature_ball_land':case 'nature_ball_pop':case 'nature_spore_pop':case 'nature_lotus_switch':break;   // natMoment
    case 'nature_pea_muzzle':natMuzzle(ev);snd('whoosh',{x,y,vol:.6});break;
    case 'nature_pea_splash':natDome(ev);snd('boom',{x,y,vol:.48});break;
    case 'nature_ball_spike':{
      const a=natWorld(x,y,h),b=natWorld(ev.x2,ev.y2,ev.h2),d=b.clone().sub(a).normalize();
      const target=()=>{
        const o=(ev.enemy?EM3:PM3).get(ev.target);
        if(!o)return null;
        const pos=o.g.position.clone();pos.y+=1.1;
        return pos.addScaledVector(pos.clone().sub(a).normalize(),.82);
      };
      natTrail(a,b.addScaledVector(d,.82),{color:'#664123',size:.082,lift:.06,life:.42,pull:true,windup:.05,taper:.94,target});break;
    }
    case 'nature_relocate':natTrail(natWorld(x,y,h+.06),natWorld(ev.x2,ev.y2,ev.h2+.06),{color:'#84e64f',lift:.04,life:.56,size:.038,pull:true});break;
    case 'nature_guard':natTrail(natWorld(x,y,h),natWorld(ev.x2,ev.y2,ev.h2),{color:'#a4ff50',lift:2,life:.24,windup:.15,hit:true});break;
    case 'nature_wall_grow':burst(x,y,'#c0a282',14,112,.6,2.3,{h,sh:4,g:6});break;
    case 'nature_wall_burn':{
      const d=(ev.zone-1)*68,xx=x-Math.sin(ev.a)*d,yy=y+Math.cos(ev.a)*d;
      for(let i=0;i<10;i++)later(i*.45,()=>burst(xx,yy,'#ff904a',5,30,.65,3.5,{h:h+.55,vh:[.8,2.1],g:-.3,c2:'#7c3a1a'}));
      break;
    }
    case 'nature_wall_end':{
      const name=ev.broke?'nature/wood_wall_break_study':'nature/wood_wall_expire_study';
      const f=natStartStudy(name,ev);if(f){f.t=ev.broke?.72:0;
        NAT_MOTION.push({g:null,life:3,age:0,tick:()=>{f.updateNatureWeave?.();natWearWall(f,ev.burn);}});
      }break;
    }
    case 'nature_plant_end':{
      if(ev.kind==='tree'){
        const f=natStartStudy(ev.broke?'nature/tree_break_study':'nature/tree_expire_study',ev);
        if(f)NAT_MOTION.push({g:null,life:5,age:0,tick:()=>f.updateNatureWeave?.()});
        if(ev.broke){ring(x,y,color,NAT.treeRange,.66,h+.1);if(!f)natDome({...ev,r:NAT.treeRange});}
      }else{
        const v=ev.kind==='lotus'?natLotus():natPlantView({k:'turret',wall:ev.wall});
        natSet(v.g,x,y,h);v.g.rotation.y=Math.PI/2-ev.a;
        if(ev.kind==='lotus'){
          v.heal.set(1,0,ev.mode?0:1);v.buff.set(1,0,ev.mode?1:0);
          natAnimate(v.g,.85,k=>{v.plant.set(1-k,1-k,k);v.heal.set(1,k,ev.mode?0:1-k);v.buff.set(1,k,ev.mode?1-k:0);});
        }else natAnimate(v.g,.72,k=>{
          v.plant.grow(1-k);v.plant.pose(k,0,ev.broke?1-k:0,!!ev.wall);
          if(ev.broke){v.plant.head.position.y=Math.max(.10,.95+.27*Math.sin(k*Math.PI)-k*k);v.plant.head.rotation.z=k*2.4;}
          if(ev.wall&&ev.broke)v.g.position.y=GY(x,y)+Math.max(groundH(x,y),h-4*k*k);
        });
      }break;
    }
    default:return false;
  }
  return true;
}

// ใต้เป้าเล็ง: ชาร์จกำแพงไม้ 2 อัน เป็นไอคอนท่อนไม้ (แบบ stack สายฟ้า) • อันที่กำลังชาร์จ = ไม้จาง + แถบเติมจากล่าง (ผู้ใช้ 2026-11-10)
const NTHUD={prev:-1,fl:[0,0],t:0};
function drawNatureHud(x,y,A){
  const n=A[6]|0,pr=+A[7]||0,now=performance.now(),dt=Math.min(.1,(now-NTHUD.t)/1000);NTHUD.t=now;
  if(NTHUD.prev>=0&&n>NTHUD.prev)for(let i=NTHUD.prev;i<n&&i<2;i++)NTHUD.fl[i]=.35;NTHUD.prev=n;
  const y0=y+67,gap=26;
  const log=(cx0,cy0,a,fill)=>{const w=18,h=9;
    cx.save();cx.translate(cx0,cy0);cx.rotate(-.35);
    cx.globalAlpha=a;cx.fillStyle='rgba(0,0,0,.55)';cx.beginPath();cx.roundRect(-w/2-1.5,-h/2-1.5,w+3,h+3,5);cx.fill();
    if(fill<1){cx.fillStyle='rgba(120,88,50,.35)';cx.beginPath();cx.roundRect(-w/2,-h/2,w,h,4);cx.fill();}
    cx.save();cx.beginPath();cx.rect(-w/2,-h/2,w*fill,h);cx.clip();
    const g=cx.createLinearGradient(0,-h/2,0,h/2);g.addColorStop(0,'#c99a5c');g.addColorStop(1,'#7a5430');cx.fillStyle=g;cx.beginPath();cx.roundRect(-w/2,-h/2,w,h,4);cx.fill();
    cx.strokeStyle='rgba(60,38,18,.8)';cx.lineWidth=1;cx.beginPath();cx.moveTo(-w/2+3,-1);cx.lineTo(w/2-5,-1);cx.moveTo(-w/2+5,2);cx.lineTo(w/2-7,2);cx.stroke();
    cx.fillStyle='#e8c690';cx.beginPath();cx.ellipse(w/2-2,0,3,h/2-.5,0,0,Math.PI*2);cx.fill();cx.strokeStyle='#8a6034';cx.beginPath();cx.ellipse(w/2-2,0,1.4,2,0,0,Math.PI*2);cx.stroke();
    const leaf=(lx,ly,r)=>{cx.fillStyle='#8ee06a';cx.beginPath();cx.ellipse(lx,ly,r,r*.5,-.6,0,Math.PI*2);cx.fill();};leaf(-3,-h/2-1.5,3);
    cx.restore();cx.restore();};
  for(let i=0;i<2;i++){const px=x+(i-.5)*gap,have=i<n,fill=have?1:i===n?pr:0;
    if(NTHUD.fl[i]>0){NTHUD.fl[i]-=dt;cx.save();cx.globalAlpha=Math.max(0,NTHUD.fl[i]/.35)*.8;cx.fillStyle='#fff';cx.shadowColor='#c8ff9a';cx.shadowBlur=14;cx.beginPath();cx.arc(px,y0,11,0,Math.PI*2);cx.fill();cx.restore();}
    log(px,y0,have?1:.55,fill);}
}

// HP พืชของเรา (ผู้ใช้ 2026-11-10): ลอยเหนือไพ่สกิล ไม่มีกรอบ • ภาพหัวจากโมเดลจริง (ถ่ายครั้งเดียวต่อชนิด) ซ้ายบน • เลข HP ขวาบน
//   แถบ HP ล่างสุดยาวตลอด • เวลาที่เหลือ (ดอกบัว/กำแพง/ต้นไม้ — ป้อมอยู่ถาวรไม่มีเวลา) ลอยออกทางซ้าย กลางระหว่างหัวกับแถบ
const NPH={el:null,key:'',t:0,img:{},R:null};
const NPH_IC={
  turret:'<circle cx="12" cy="10" r="6.2" fill="#fff" stroke="#000" stroke-width="1.4"/><rect x="16.2" y="7.6" width="6" height="3.6" rx="1.8" fill="#fff" stroke="#000" stroke-width="1.2"/>',
  lotus:'<path d="M12 4c2.4 3 2.4 6.4 0 9.4-2.4-3-2.4-6.4 0-9.4zM4.5 8.5c3.4.2 5.6 2.4 6.4 5.6-3.4-.2-5.6-2.4-6.4-5.6zM19.5 8.5c-3.4.2-5.6 2.4-6.4 5.6 3.4-.2 5.6-2.4 6.4-5.6z" fill="#fff" stroke="#000" stroke-width="1.2"/>',
  wall:'<rect x="3" y="9" width="18" height="9" rx="2" fill="#fff" stroke="#000" stroke-width="1.3"/>',
  tree:'<circle cx="12" cy="9" r="6.5" fill="#fff" stroke="#000" stroke-width="1.3"/><rect x="10.6" y="14" width="2.8" height="7" fill="#fff" stroke="#000" stroke-width="1.2"/>'};
// ถ่ายภาพหัวจากโมเดลในฉาก: clone โมเดล → ฉากเล็กพื้นหลังใส มีไฟ → renderer เล็กแยก (alpha) → dataURL • ส่วนบน 45% ของโมเดล = หัว
function natPortraitObj(v,k){if(k==='turret')return v.plant&&v.plant.head||v.g;if(k==='lotus')return v.plant&&v.plant.bloom||v.g;if(v.fx&&v.fx.L){const g=new THREE.Group();for(const L of v.fx.L)if(L.obj&&L.inner&&L.inner.isMesh)g.add(L.obj.clone(true));if(g.children.length)return g;}return null;}   // กำแพง/ต้นไม้: รอโมเดลจริงจาก fx (ไม่ใช้กล่องชั่วคราว)
function natPortrait(k,src){
  try{
    if(!NPH.R){const r=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});r.setPixelRatio(1);r.setSize(128,128);r.setClearColor(0x000000,0);r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.1;NPH.R=r;}
    const S=new THREE.Scene(),c=src.clone(true);c.position.set(0,0,0);c.rotation.set(0,k==='turret'?Math.PI*.35:0,0);   /* ป้อม: หันปากมาทางกล้อง (เฉียงนิด) */c.scale.multiplyScalar(1);c.updateMatrixWorld(true);
    S.add(c);S.add(new THREE.HemisphereLight(0xffffff,0x445533,1.6));const L=new THREE.DirectionalLight(0xffffff,2.2);L.position.set(2,4,3);S.add(L);
    const B=new THREE.Box3();c.traverse(q=>{if(!q.isMesh||q.isSprite||!q.visible)return;const m=Array.isArray(q.material)?q.material[0]:q.material;if(m&&(m.blending===THREE.AdditiveBlending||m.transparent&&m.opacity<.5))return;B.expandByObject(q);});   /* แค่เนื้อโมเดล (ไม่นับแสงเรือง/วงออร่า) */if(B.isEmpty()){NPH.dbg=k+':empty';return null;}const sz=B.getSize(new THREE.Vector3()),hf=k==='tree'?.45:1;
    const top=B.max.y,bot=top-sz.y*hf,cy=(top+bot)/2,cx0=(B.min.x+B.max.x)/2,cz=(B.min.z+B.max.z)/2,R=Math.max(sz.x*.6,sz.z*.6,sz.y*hf*.62);
    const cam=new THREE.PerspectiveCamera(30,1,.01,500),d=R/Math.tan(15*Math.PI/180)*({turret:.5,lotus:.62,wall:.5}[k]||.7);
    cam.position.set(cx0+d*.55,cy+d*.18,cz+d*.83);cam.lookAt(cx0,cy,cz);
    NPH.R.render(S,cam);const url=NPH.R.domElement.toDataURL('image/png');S.remove(c);return url;
  }catch(e){NPH.dbg=k+':'+e.message;return null;}
}
function natPlantHud(me,v){
  if(!NPH.el){const d=document.createElement('div');d.id='h4pl';document.body.appendChild(d);NPH.el=d;}
  const el=NPH.el,list=me&&me.al!==false&&v?(v.NT||[]).filter(o=>o.owner===me.id&&o.hp>0&&NPH_IC[o.k]):[];
  if(!list.length||(H4.el&&H4.el.hidden)){if(el.innerHTML){el.innerHTML='';NPH.key='';}el.hidden=true;return;}
  el.hidden=false;
  for(const o of list)if(!NPH.img[o.k]&&o.age>(o.k==='tree'?NAT.treeGrow+.3:o.k==='wall'?1.2:1)){const V=NAT_VIEW.get(o.id),src=V&&natPortraitObj(V,o.k);if(src){const u=natPortrait(o.k,src);if(u)NPH.img[o.k]=u;}}
  const ord={tree:0,turret:1,lotus:2,wall:3};list.sort((a,b)=>(ord[a.k]-ord[b.k])||(a.id-b.id));
  const key=list.map(o=>o.k+':'+o.id+':'+Math.ceil(o.hp)+':'+Math.ceil(o.left||0)+':'+(NPH.img[o.k]?1:0)).join('|');
  const now=performance.now();if(now-NPH.t>400){NPH.t=now;   // วางตำแหน่งเหนือแถวไพ่
    const cards=H4.q?H4.q.slots.filter(S=>!S.gem).map(S=>S.el.getBoundingClientRect()).filter(r=>r.width>0):[];
    void cards;}   // ตำแหน่งตายตัวซ้ายจอ (css #h4pl)
  if(key===NPH.key)return;NPH.key=key;
  el.innerHTML=list.map(o=>{const hp=Math.ceil(o.hp),low=hp<=o.maxHp*.3,t=o.left!=null&&o.left<9999?Math.ceil(o.left):null;
    const head=NPH.img[o.k]?`<img src="${NPH.img[o.k]}">`:`<svg viewBox="0 0 24 24">${NPH_IC[o.k]}</svg>`;
    return `<div class="r${low?' low':''}">${t!=null?`<span class="tm">${t}</span>`:''}<div class="hd">${head}</div><b>${hp}</b><i style="--p:${Math.round(hp/o.maxHp*100)}%"></i></div>`;}).join('');
}
