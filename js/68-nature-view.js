// Snapshot-driven Nature models plus short-lived effects from host combat events.
const NAT_VIEW=new Map(),NAT_MARKS=new Map(),NAT_MOTION=[];
const natV=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const natWorld=(x,y,h)=>natV(tx(x),GY(x,y)+h,tz(y));
const natPhase=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const natSmooth=k=>k*k*(3-2*k);
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
  return {g,plant,heal,buff,glow,mix,color};
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
  const shield=new THREE.Mesh(new THREE.SphereGeometry(1.28,28,18),new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,uniforms:{},
    vertexShader:`varying vec3 n,v; varying float h;
      void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalMatrix*normal;v=-p.xyz;h=position.y;
      gl_Position=projectionMatrix*p;}`,
    fragmentShader:`varying vec3 n,v; varying float h;
      void main(){float rim=pow(1.-max(0.,dot(normalize(n),normalize(v))),2.5);
      vec3 col=mix(vec3(.016,.12,.025),vec3(.31,.77,.14),smoothstep(-.52,1.12,h));
      gl_FragColor=vec4(col,.22+.43*rim);
      #include <colorspace_fragment>
      }`
  }));
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
  const native=getKit(p.id).path===NATUREP;
  if(native&&p.sh&&p.al&&!p.dn){
    if(!o.natShield)o.natShield=natShieldMake(o);
    o.natShield.visible=true;o.shield.visible=false;
    if(Math.random()<.19)burst(p.x,p.y,'#a7ec69',1,38,.42,1.4,{h:p.z+.65,vh:[.8,1.6],sh:4,g:-.3});
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
  if(o.natCoil)o.natCoil.visible=!!p.nt?.[2]&&p.al&&!p.dn;
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
    if(o.g)disposeObj(o.g);if(o.fx)fxKill(o.fx);NAT_VIEW.delete(id);
  }
  natMarks(v,P,me);natLinks(v,P,now);
  for(let i=NAT_MOTION.length-1;i>=0;i--){
    const o=NAT_MOTION[i];o.age+=dt;
    if(o.age>=o.life){if(o.g)disposeObj(o.g);NAT_MOTION.splice(i,1);}
    else o.tick(o.age/o.life,o.age);
  }
}
function natureClear(){
  for(const o of NAT_VIEW.values()){if(o.g)disposeObj(o.g);if(o.fx)fxKill(o.fx);}
  for(const o of NAT_MOTION)if(o.g)disposeObj(o.g);
  for(const g of NAT_MARKS.values())disposeObj(g);
  NAT_VIEW.clear();NAT_MARKS.clear();NAT_MOTION.length=0;
}
window.WD.natureClear=natureClear;

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
    burst(x,y,'#a9dc63',10,110,.42,2.5,{h:h+.08,c2:'#67513b',sh:4,g:5});
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
function natureEvent(ev){
  const {x,y,h}=ev,color='#b9f173';
  switch(ev.z){
    case 'nature_seed':natSeed(ev);break;
    case 'nature_spore_gain':case 'nature_spore_send':natSeed(ev,true);break;
    case 'nature_hook':{
      const student=PM3.get(ev.id);if(student)castStart(student,'vine',1);
      natTrail(natWorld(x,y,h),natWorld(ev.x2,ev.y2,ev.h2),{size:.066,lift:.52,windup:ev.t,life:ev.t+.34,hit:ev.hit,pull:true,
        track:student?()=>student.tip.getWorldPosition(natV()):null});
      if(ev.hit)later(ev.t,()=>{ring(x,y,color,34,.25,h-.8);burst(x,y,color,7,90,.36,2.4,{h,sh:4});});
      snd('whoosh',{x,y,vol:.45});break;
    }
    case 'nature_coil':ring(x,y,ev.ally?'#acf079':'#aa68bf',27,.38,h-.8);break;
    case 'nature_slam':natSlam(ev);break;
    case 'nature_shield_block':
      ring(x,y,'#b5ec68',30,.28,h);burst(x,y,'#e5ed81',13,95,.38,2.1,{h,sh:4,c2:'#6fad40'});break;
    case 'nature_pea_muzzle':natMuzzle(ev);burst(x,y,color,10,150,.25,1.7,{h,sh:2});snd('whoosh',{x,y,vol:.6});break;
    case 'nature_pea_splash':natDome(ev);burst(x,y,color,20,118,.38,2.2,{h,c2:'#60a52d',sh:4,g:3});snd('boom',{x,y,vol:.48});break;
    case 'nature_spore_pop':burst(x,y,color,14,70,.44,2.1,{h,sh:4});smoke(x,y,h,6,'#74a244',.65,4.2,38);break;
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
    case 'nature_ball_land':ring(x,y,'#cda475',41,.25,h+.05);burst(x,y,'#9f7549',15,100,.41,2.8,{h,sh:4,g:7});break;
    case 'nature_ball_pop':burst(x,y,'#9e7047',16,140,.56,3,{h,sh:4,g:7,c2:'#62852d'});break;
    case 'nature_relocate':natTrail(natWorld(x,y,h+.06),natWorld(ev.x2,ev.y2,ev.h2+.06),{color:'#84e64f',lift:.04,life:.56,size:.038,pull:true});break;
    case 'nature_pulse':ring(x,y,color,ev.r,.45,h+.06);break;
    case 'nature_lotus_switch':ring(x,y,ev.mode?color:'#ff9acb',ev.r,.52,groundH(x,y,h)+.06);burst(x,y,color,14,45,.48,2.2,{h,sh:4,g:-1});break;
    case 'nature_plant_hit':burst(x,y,color,6,50,.32,2,{h,sh:4});break;
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
        burst(x,y,color,9,54,.5,2.4,{h:h+.6,sh:4,g:ev.broke?4:-.5});
      }break;
    }
    default:return false;
  }
  return true;
}
