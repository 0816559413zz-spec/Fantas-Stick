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
  const isTree=name.includes('tree_'),age=stay?s.age:0;
  const scale=isTree?NAT.treeHeight/27:1;
  let data=f;
  if(stay)data={...f,layers:f.layers.filter(l=>l.t==='mesh'||l.t==='code'||age<.8).map(l=>
    l.t==='mesh'||l.t==='code'?{...l,life:Math.max(f.dur,(isTree?NAT.treeGrow+NAT.treeLife:8)-age)+.2}:l)};
  else if(name==='nature/tree_break_study')data={...f,layers:f.layers.map(l=>{
    if(l.id!=='heal_dome')return l;
    const k=NAT.treeRange*S3/(26.4*scale);
    return {...l,at:0,scale:Object.fromEntries(Object.entries(l.scale).map(([t,[x,y,z]])=>[t,[x*k,y,z*k]]))};
  })};
  const fx=fxStart(data,{x:s.x,y:s.y,h:s.h,a:s.a,s:scale,p:{healRadius:NAT.treeRange*S3}},name);
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
    if(v.fx){v.fx.t=age;v.fx.updateNatureWeave?.();}
    if(s.k==='wall')natWearWall(v.fx,s.burn);
    else natTreeGlow(v.fx,1-s.hp/s.maxHp);
    return;
  }
  natSet(v.g,s.x,s.y,s.h);
  if(s.k==='ball'){
    if(age<s.flight){
      const k=natOut(age/s.flight),a=s.origin;
      v.g.position.copy(natWorld(a.x,a.y,a.h)).lerp(natWorld(s.x,s.y,s.h),k);v.g.rotation.x=age*19;
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
  const g=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:'#abeb5f',transparent:true,opacity:.82});
  for(const side of [-1,1]){
    const points=Array.from({length:9},(_,i)=>{
      const u=i/8;return natV(side*(.51+.16*Math.sin(u*Math.PI)),(u-.5)*1.28,0);
    });
    natMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),16,.023,5,false),mat,g);
    for(let i=1;i<8;i+=2){
      const thorn=natMesh(new THREE.ConeGeometry(.044,.16,5),mat,g);
      thorn.position.copy(points[i]);thorn.rotation.z=-side*.9;
    }
  }
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
      g.scale.setScalar(lerp(1.18,.40,range/NAT.hookRange));g.quaternion.copy(cam.quaternion);
    }
  }
  for(const [id,g] of NAT_MARKS)if(!seen.has(id)){disposeObj(g);NAT_MARKS.delete(id);}
}

function natThorn(from,to,size,material,parent,bend=.2){
  const mid=from.clone().lerp(to,.45);mid.y+=bend;
  const curve=new THREE.QuadraticBezierCurve3(from,mid,to);
  return natMesh(natTube(curve,size,.83),material,parent);
}
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
  shield.position.y=1.10;shield.scale.set(1,.89,1);g.add(shield);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4,h=[1.82,1.39,1.72,1.93,1.52,1.88,1.29,1.71][i],c=Math.cos(a),s=Math.sin(a);
    const mat=natStd(i%2?'#283f21':'#3d5329');
    natThorn(natV(c*.61,.14,s*.61),natV(c*1.04,h,s*1.04),.105,mat,g,.19);
    for(let j=0;j<3;j++){
      const q=natMesh(new THREE.ConeGeometry(.068-j*.01,.26-j*.03,5),mat,g);
      q.position.set(c*(.91+j*.072),.54+j*.28,s*(.91+j*.072));
      q.quaternion.setFromUnitVectors(natV(0,1,0),natV(c,.68,s).normalize());
    }
  }
  return g;
}
function natureCharacter(o,p,now){
  natHookPose(o);
  const native=getKit(p.id).path===NATUREP;
  if(native&&p.sh&&p.al&&!p.dn){
    if(!o.natShield)o.natShield=natShieldMake(o);
    o.natShield.visible=true;o.shield.visible=false;
    {const U=o.natShield.userData.nat,t=now/1000;U.hitWave.value=clamp((now-U.hitT)/360,0,1);U.motes.forEach((m,i)=>{const a=i*2.4+t*.4,y=((i*.31+t*.25)%2.4)-1.2,r=Math.sqrt(Math.max(.1,1-y*y/1.9))*1.4;m.position.set(Math.sin(a)*r,y+1.1,Math.cos(a)*r);});}
  }else if(o.natShield)o.natShield.visible=false;
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
      if(!o.natLink){
        const geo=new THREE.BufferGeometry();
        geo.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(48),3));
        o.natLink=natAdd(new THREE.Line(geo,new THREE.LineBasicMaterial({color:'#84ed59',transparent:true,opacity:.65,depthWrite:false})));
        o.natLink.frustumCulled=false;
        (o.g.userData.extra||(o.g.userData.extra=[])).push(o.natLink);
      }
      const a=o.g.position.clone().add(natV(0,1.35,0)),b=natWorld(tree.x,tree.y,tree.h+9.5);
      const mid=a.clone().lerp(b,.48);mid.y+=2.3;
      const path=new THREE.QuadraticBezierCurve3(a,mid,b);
      const pos=o.natLink.geometry.attributes.position,pt=natV();
      for(let i=0;i<pos.count;i++){path.getPoint(i/(pos.count-1),pt);pos.setXYZ(i,pt.x,pt.y,pt.z);}
      pos.needsUpdate=true;
      o.natLink.visible=true;o.natLink.material.opacity=.62+.15*Math.sin(now*.005);
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
    if(o.g)disposeObj(o.g);if(o.proxyG)disposeObj(o.proxyG);if(o.fx)fxKill(o.fx);NAT_VIEW.delete(id);
  }
  natMarks(v,P,me);natLinks(v,P,now);
  if(_natFx)_natFx.tick(dt);
  for(let i=NAT_MOTION.length-1;i>=0;i--){
    const o=NAT_MOTION[i];o.age+=dt;
    if(o.age>=o.life){if(o.g)disposeObj(o.g);NAT_MOTION.splice(i,1);}
    else o.tick(o.age/o.life,o.age);
  }
}
function natureClear(){
  natFxClear();
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
  const a=natWorld(ev.x,ev.y,ev.h+.6),b=natWorld(ev.x2,ev.y2,ev.h2+.04),g=new THREE.Group();
  const mat=natStd('#385729',{emissive:'#519731',emissiveIntensity:.32});
  const vine=new THREE.Mesh(new THREE.BufferGeometry(),mat);g.add(vine);
  const barbs=Array.from({length:7},()=>natMesh(new THREE.ConeGeometry(.07,.24,5),mat,g));
  const d=b.clone().sub(a);d.y=0;d.normalize();
  natAnimate(g,.53,(k,age)=>{
    const up=natOut(natPhase(age,0,.16)),down=natPhase(age,.16,.25)**2,back=1-natSmooth(natPhase(age,.29,.53));
    const tip=a.clone().lerp(b,lerp(.16,.35,up)*(1-down)+down);
    tip.y+=Math.min(4.9,a.distanceTo(b)*.83)*up*(1-down);
    const end=a.clone().lerp(tip,back),mid=a.clone().lerp(end,.42).addScaledVector(d,.69*(1-down)*back);
    mid.y+=.38*(1-down)*back;
    const curve=new THREE.CatmullRomCurve3([a.clone().addScaledVector(d,.62),mid,end]);
    vine.geometry.dispose();vine.geometry=new THREE.TubeGeometry(curve,16,.103*back+.006,6,false);
    for(let i=0;i<barbs.length;i++){
      const u=(i+1)/(barbs.length+1),barb=barbs[i],normal=curve.getTangent(u).cross(natV(0,1,0)).normalize();
      if(i%2)normal.negate();
      curve.getPoint(u,barb.position);barb.position.addScaledVector(normal,.1*back);
      barb.quaternion.setFromUnitVectors(natV(0,1,0),normal.add(natV(0,.45,0)).normalize());
      barb.scale.setScalar((1-u*.5)*back);
    }
  });
  later(.23,()=>{
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
  const parts=[vine,th,speed,hookTrail,tensionLight,...airStrokes,hookFlash],staticEnd=natWorld(ev.x2,ev.y2,ev.h2),HIT=.43,PULL=.73;
  const tgt=()=>{const o=ev.tid!=null?PM3.get(ev.tid):null;return o?o.g.localToWorld(V3(0,1.25,.15)):staticEnd.clone();};
  const start=student?student.g.position.clone():natWorld(ev.x,ev.y,ev.h-1.35),d0=start.distanceTo(tgt());
  const pullT=clamp((d0-1.4)*20/NAT.hookSpeed,.18,.9),DONE=PULL+pullT,dur=ev.hit?DONE+.1:HIT+.26;
  let hit=false,land=false,rope=0,frame=0;
  if(student)student.natHookCast={t:0,dur:ev.hit?DONE:HIT+.2,hit:ev.hit,pull:PULL,done:DONE};
  F.clip(dur,(st,dt)=>{
    frame++;if(student?.natHookCast)student.natHookCast.t=st;
    if(student)student.g.updateMatrixWorld(true);
    const tip=student?student.tip.getWorldPosition(V3()):natWorld(ev.x,ev.y,ev.h),tg=tgt(),fly=phase(st,.20,HIT);
    const hitAge=st-HIT,pulling=ev.hit&&st>PULL&&st<DONE&&student,pull=phase(st,PULL,DONE);
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
    if(ev.hit&&st>=DONE-.02&&!land&&student){land=true;const q=student.g.position.clone();F.O.y=q.y;dirt(q,16,3);leaves(q.clone().add(V3(0,.3,0)),10,3);}
    vine.visible=th.visible=st>.02&&st<(ev.hit?DONE+.08:dur);
    let trailSample=null;tensionLight.visible=hookFlash.visible=false;
    if(vine.visible){
      const k=ease(fly),side=V3(tip.z-tg.z,0,tg.x-tip.x).normalize(),origin=tip.clone().addScaledVector(side,.8*ease(phase(st,0,.18))),control=tip.clone().lerp(tg,.30).addScaledVector(side,Math.min(25,tip.distanceTo(tg)*2.2));
      const end=origin.multiplyScalar((1-k)*(1-k)).addScaledVector(control,2*k*(1-k)).addScaledVector(tg,k*k),loose=1-ease(phase(st,.36,.48)),pts=[];
      if(st>=HIT&&!rope)rope=tip.distanceTo(tg);
      const chord=tip.distanceTo(tg),extra=rope?Math.sqrt(Math.max(0,rope**2-chord**2)):0,slack=Math.min(2.8,extra*.35)*ease(phase(st,PULL,PULL+.13)),back=ev.hit?1:1-ease(phase(st,HIT,dur));
      for(let i=0;i<30;i++){const u=i/29*back,p=V3().lerpVectors(tip,end,u),envelope=Math.sin(u*Math.PI);
        if(st<.20){const a=u*Math.PI*2.5-st*5,rr=.25*u;p.addScaledVector(side,Math.sin(a)*rr);p.y+=Math.cos(a)*rr+u*.14;}
        else{const tipBend=Math.exp(-(((u-.80)/.17)**2))*Math.sin(u*5-st*20)*1.9*loose;p.y+=envelope*(.04+.48*loose)-envelope*Math.min(.55,slack*.30)+envelope*.16*Math.sin(u*7-st*25)*loose;
          const tensionWave=hitAge>0?ease(phase(hitAge,0,.05))*Math.exp(-hitAge*9)*Math.sin(hitAge*32-u*3)*.65:0;p.addScaledVector(side,envelope*(.8*Math.sin(u*5-st*20)*loose+slack+tensionWave)+tipBend*envelope);}
        pts.push(p);}
      const rad=u=>.05*(1-.4*u)+.012;
      vine.set(pts,rad,(u,c)=>c.copy(stemDark).lerp(stemTip,.24+.51*u+.10*Math.sin(u*30)));th.put(thornsAlong(pts,rad,2,.8));
      if(st>.21&&st<HIT)trailSample=[pts[26],end];
      if(ev.hit&&st>=HIT&&st<PULL-.01){const charge=1-phase(st,HIT,.70),lit=u=>ease(1-Math.abs(u-charge)/.27)*(1-ease(phase(st,.66,.72)));tensionLight.visible=true;tensionLight.set(pts,u=>rad(u)+.037*lit(u),(u,c)=>c.copy(sapTail).lerp(sapHead,lit(u)).multiplyScalar(1.6*lit(u)));}
      if(ev.hit&&hitAge>=0&&hitAge<.19){hookFlash.visible=true;hookFlash.position.copy(tg);hookFlash.scale.setScalar(.55+hitAge*3.5);hookFlash.material.opacity=.86*(1-ease(hitAge/.19));}
      if(ev.hit&&st>=HIT&&!hit){hit=true;sparks(tg,18,4.2,'#f2ffac','#6fd449',{life:.72,size:1.45});leaves(tg,9,2.7,{dir:side.clone().multiplyScalar(.9),life:.7,size:1.35});}
    }
    hookTrail.push(trailSample);
  },()=>{for(const o of parts)F.drop(o);if(student)student.natHookCast=null;});
}
// Coil around the hooked target, SKS.dash: helix from legs to chest, 3 s; an ally gets hooked barbs and a heal rim climbing every .5 s; an enemy gets purple thorns with poison sparks.
function natCoil(ev){
  const F=natFx(),{T,V3,M,Tube,Thorns,thornsAlong,ring,glow,GLOWG,sparks,puff}=F,ease=natEase,phase=natPhase,allyOnly=!!ev.ally,o=ev.id!=null?PM3.get(ev.id):null,fixed=natWorld(ev.x,ev.y,ev.h-1.1);
  const coil=Tube(60,allyOnly?7:5,M.bark),cth=Thorns(40,allyOnly?.86:.7,null,allyOnly),coilDark=new T.Color('#3e5a1e'),vineColor=new T.Color(allyOnly?'#8fe060':'#7a4a9a');
  const healRim=allyOnly?ring(.56,.62,'#a6ffad',0):null,healFlare=allyOnly?glow(GLOWG,1.2):null,parts=[coil,cth];if(allyOnly)parts.push(healRim,healFlare);
  const radius=.58,height=1.45,LIFE=allyOnly?3.33:3;let healTick=-1,frame=0;
  F.clip(LIFE,(st)=>{frame++;
    const P=o?o.g.position:fixed,unwind=allyOnly?ease(phase(st,3,3.33)):ease(phase(st,2.7,3)),wrap=phase(st,0,.24)*(1-unwind);coil.visible=cth.visible=wrap>.005;
    const coilPoint=u=>{const a=u*Math.PI*7+(allyOnly?.35:st*.6),r=allyOnly?radius+.045*Math.sin(u*27):radius;return V3(P.x+Math.cos(a)*r,P.y+.15+u*height,P.z+Math.sin(a)*r);};
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
function natHookPose(o){
  const C=o.natHookCast;if(!C)return;const st=C.t,ease=natEase,phase=natPhase,sideSwing=Math.sin(Math.PI*ease(phase(st,0,.28))),aim=phase(st,0,.20),hitAge=st-.43,tug=hitAge>0?Math.exp(-hitAge*9)*Math.sin(hitAge*32):0;
  o.armR.rotation.set(-1.2+.3*sideSwing+.32*tug,-1.05*sideSwing,.25*sideSwing);o.armL.rotation.set(-.6*aim,0,-.3);o.b.rotation.y+=-.4*sideSwing+.12*tug;o.b.rotation.x+=-.22*tug;
  if(C.hit&&st>C.pull&&st<C.done){const pull=phase(st,C.pull,C.done);o.b.rotation.x=.55*Math.sin(pull*Math.PI);o.legs[0].rotation.x=-.6;o.legs[1].rotation.x=.5;}
}
// Particle moments of the approved previews (tools/nature-preview.js), same calls and numbers.
function natShock(p,col,size=6,life=.6){const F=natFx(),r=F.ring(.25,.5,col,.8);r.position.set(p.x,F.O.y+.05,p.z);F.clip(life,t=>{const k=t/life;r.scale.setScalar(1+k*size);r.material.opacity=(1-k)*.8;},()=>F.drop(r));}
function natSprout(p,n=1){const F=natFx(),{V3}=F;F.dirt(p,14*n,3.2);F.leaves(p,10*n,3);F.sparks(p.clone().add(V3(0,.3,0)),16*n,3.5,'#fff7b0','#8ee05a');}
function natHealRims(o){const F=natFx(),{V3,ring,sparks}=F,rims=[ring(.52,.58,'#8dffa9',0),ring(.45,.49,'#d2ffb2',0)];sparks(o.g.position.clone().add(V3(0,.20,0)),6,1.1,'#e1ffc1','#53d67b',{dir:V3(0,1.4,0),g:-.85,life:1.15,size:.9});
  F.clip(.76,t=>{rims.forEach((rim,i)=>{const age=t-i*.09,k=natPhase(age,0,.65);rim.visible=age>=0&&k<1;rim.position.copy(o.g.position).add(V3(0,.08+1.47*natEase(k),0));rim.scale.setScalar(1+.18*Math.sin(k*Math.PI));rim.material.opacity=.78*(1-natEase(k));});},()=>rims.forEach(r=>F.drop(r)));}
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
    case 'nature_ball_land':dirt(P,19,3.3,{size:1.05,spread:1.15});chips(P,9,2.9);leaves(P,9,2.4,{life:.70});natShock(P,'#a2cd69',2.5,.38);break;
    case 'nature_ball_pop':chips(P,28,5.4);leaves(P,23,4.8,{dir:V3(0,2.1,0),life:.83,size:1.22});puff(P,7,'#a99470',{sp:1.4,size:.80});natShock(P,'#bde578',4.7,.46);sparks(P,29,4.8,'#eaffac','#66c13d',{dir:V3(0,1.8,0),life:.93,size:1.24});break;
    case 'nature_relocate':{const o=P.clone(),n=natWorld(ev.x2,ev.y2,ev.h2);leaves(o.clone().add(V3(0,.11,0)),9,1.5,{life:.70,size:1.22});sparks(o.clone().add(V3(0,.12,0)),13,1.25,'#baff72','#42dc3c',{life:.85,size:1.22});
      later(.56,()=>{const G2=natFx();G2.O.y=n.y;G2.sparks(n.clone().add(G2.V3(0,.16,0)),29,2.4,'#c1ff67','#39de3c',{dir:G2.V3(0,1.2,0),life:1.1,size:1.42});G2.leaves(n.clone().add(G2.V3(0,.1,0)),16,2.20,{life:.92,size:1.31});natShock(n,'#89ff4b',3.25,.52);});break;}
    case 'nature_pulse':sparks(P.clone().add(V3(0,1.3,0)),12,1.8,'#eaffbe','#77db5c',{life:.72});leaves(base.clone().add(V3(0,.2,0)),6,1.3,{life:.75,size:1.18});break;
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
      const student=PM3.get(ev.id);if(student)castStart(student,'vine',1);
      natHook(ev,student);
      snd('whoosh',{x,y,vol:.45});break;
    }
    case 'nature_coil':natCoil(ev);break;
    case 'nature_slam':natSlam(ev);break;
    case 'nature_shield_block':case 'nature_pea_shot':case 'nature_pulse':case 'nature_plant_hit':case 'nature_ball_land':case 'nature_ball_pop':case 'nature_spore_pop':case 'nature_lotus_switch':break;   // natMoment
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
