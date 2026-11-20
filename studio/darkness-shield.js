const ST_DARKNESS_SHIELD='darkness/shield_preview';
const stDarkShieldAim={x:0,y:0,moveX:0,moveZ:0,keys:new Set()};

function stDarkShieldMove(dt){
  if(ST.name!==ST_DARKNESS_SHIELD||SQ.get('aim')!=='cursor')return;
  const keys=stDarkShieldAim.keys;
  const x=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));
  const z=Number(keys.has('KeyW'))-Number(keys.has('KeyS'));
  const scale=2.1*Math.min(dt,.05)/(Math.hypot(x,z)||1);
  stDarkShieldAim.moveX=clamp(stDarkShieldAim.moveX+x*scale,-1.7,1.7);
  stDarkShieldAim.moveZ=clamp(stDarkShieldAim.moveZ+z*scale,-1.7,1.7);
}
for(const event of ['keydown','keyup'])addEventListener(event,e=>{
  if(ST.name!==ST_DARKNESS_SHIELD||SQ.get('aim')!=='cursor'||!['KeyW','KeyA','KeyS','KeyD'].includes(e.code)||
    ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  if(event==='keydown')stDarkShieldAim.keys.add(e.code);else stDarkShieldAim.keys.delete(e.code);
  e.preventDefault();e.stopImmediatePropagation();
},true);
addEventListener('blur',()=>stDarkShieldAim.keys.clear());

function stDarkShieldInk(parent,radius){
  const material=new THREE.ShaderMaterial({
    uniforms:{spin:{value:0},strength:{value:0}},
    transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    vertexShader:`varying vec2 inkUV;
      void main(){inkUV=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float spin,strength; varying vec2 inkUV;
      void main(){
        float r=length(inkUV),a=atan(inkUV.y,inkUV.x);
        float turn=a-spin;
        float rag=sin(turn*7.+r*26.)*.35+sin(turn*19.-r*12.)*.19;
        float bands=r*72.+.23*sin(turn*3.+r*17.)+.12*sin(turn*13.);
        float hair=1.-smoothstep(.095,.285,abs(fract(bands)-.50));
        float cut=smoothstep(-.52,.43,sin(turn*3.+r*8.)+rag);
        float arc=smoothstep(.10,.77,sin(turn*5.-r*10.)+rag);
        float edge=smoothstep(.84,.975,r)*(1.-smoothstep(.987,1.,r));
        float thickness=smoothstep(.22,.67,r)*(1.-smoothstep(.97,1.,r));
        float alpha=thickness*(.16+hair*(.42+.44*cut)+arc*.42)+edge*(.59+.57*cut);
        vec3 ink=mix(vec3(.002,.002,.005),vec3(.12,.11,.16),hair*(.29+.35*edge)*(1.-arc*.65));
        gl_FragColor=vec4(ink,clamp(alpha,0.,.95)*strength);
        #include <colorspace_fragment>
      }`
  });
  const geometry=new THREE.PlaneGeometry(2*radius,2*radius);
  const sheets=[0,1,2].map(i=>{
    const mesh=new THREE.Mesh(geometry,i===0?material:material.clone());
    mesh.name=i===0?'Scythe Shield ink disc':'Scythe Shield inner layer '+i;
    mesh.renderOrder=7+i;
    mesh.position.z=(i-1)*.075;
    mesh.scale.setScalar(1-i*.085);
    parent.add(mesh);
    return mesh;
  });
  return (angle,strength)=>{
    for(const [i,mesh] of sheets.entries()){
      mesh.visible=strength>.01;
      mesh.material.uniforms.spin.value=(i===1?-angle*.82:angle)+i*1.71;
      mesh.material.uniforms.strength.value=strength*(i===0?1:i===1?.38:.29);
    }
  };
}

function stDarkShieldFlames(parent,radius){
  const columns=193,rows=10,positions=[],colors=[],indices=[];
  for(let i=0;i<columns;i++)for(let j=0;j<rows;j++){
    positions.push(0,0,0);colors.push(0,0,0,0);
    if(i===columns-1||j===rows-1)continue;
    const a=i*rows+j,b=(i+1)*rows+j;
    indices.push(a,b,a+1,b,b+1,a+1);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,4).setUsage(THREE.DynamicDrawUsage));
  geometry.setIndex(indices);
  const sheet=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({
    color:0xffffff,vertexColors:true,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false
  }));
  sheet.name='Scythe Shield dark flame sheet';sheet.frustumCulled=false;sheet.renderOrder=11;parent.add(sheet);
  const droplets=10;
  const escaped=new THREE.InstancedMesh(new THREE.SphereGeometry(1,12,9),
    new THREE.MeshBasicMaterial({color:0x050507,toneMapped:false}),droplets);
  escaped.name='Scythe Shield flying dark flames';escaped.frustumCulled=false;escaped.count=0;parent.add(escaped);
  const piece=new THREE.Object3D(),direction=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  const position=geometry.attributes.position,color=geometry.attributes.color;
  return (t,strength)=>{
    sheet.visible=strength>.02;
    escaped.visible=sheet.visible;
    if(!sheet.visible)return;
    for(let i=0;i<columns;i++){
      const a=i/(columns-1)*Math.PI*2,flow=a-t*.73;
      // Use the scythe spine flame's travelling tongues and rising tear gaps.
      const noise=Math.sin(flow*19-t*5.5)*.5+Math.sin(flow*37+t*3.7)*.3+Math.sin(flow*9-t*2.1)*.2;
      const height=.065+.15*Math.max(0,noise+.29);
      const cycle=t*.9+Math.sin(flow*7)*3.1,phase=cycle-Math.floor(cycle);
      const torn=Math.sin(flow*5+Math.floor(cycle)*2.7)>.35;
      for(let j=0;j<rows;j++){
        const v=j/(rows-1),k=i*rows+j;
        const reach=height*v*(torn?1+phase*.65:1);
        const bend=.12*v*v*Math.sin(t*4+flow*13)+.12*v*v;
        const angle=a+bend,radial=radius*.946+reach*strength;
        const depth=.025+Math.sin(a*5+t*3)*v*.09;
        position.setXYZ(k,Math.cos(angle)*radial,Math.sin(angle)*radial,depth);
        let alpha=Math.pow(1-v,.6)*strength;
        if(torn){
          const gap=phase*.9;
          if(v>gap&&v<gap+.22)alpha=0;
          else if(v<gap)alpha*=Math.min(1,phase*3);
        }
        const shade=.018*Math.pow(v,3);
        color.setXYZW(k,shade,shade*.92,shade*1.12,alpha);
      }
    }
    position.needsUpdate=true;color.needsUpdate=true;
    let count=0;
    for(let i=0;i<droplets;i++){
      const seed=i*.618034%1,cycle=(t/(.74+seed*.43)+seed)%1;
      if(cycle>.39)continue;
      const age=cycle/.39,angle=i*2.39996+(t-cycle*(.74+seed*.43))*.73;
      const r=radius*.978+.07+age*(.19+seed*.12);
      const drift=age*.048*Math.sin(t*5+i);
      piece.position.set(Math.cos(angle)*r-Math.sin(angle)*drift,
        Math.sin(angle)*r+Math.cos(angle)*drift,.035+age*.025);
      direction.set(Math.cos(angle),Math.sin(angle),0);
      piece.quaternion.setFromUnitVectors(up,direction);
      const size=(.035+seed*.021)*Math.sin(Math.PI*age)*strength;
      piece.scale.set(size*.80,size*(1.35+age*.42),size*.77);
      piece.updateMatrix();escaped.setMatrixAt(count++,piece.matrix);
    }
    escaped.count=count;escaped.instanceMatrix.needsUpdate=true;
  };
}

function stDarkShieldImpacts(parent,radius,activeAt){
  return [[.63,-.37,.27],[1.34,.46,.30],[2.20,-.43,-.33]].map(([wait,x,y])=>{
    const hit=activeAt+wait;
    const point=new THREE.Group();
    point.position.set(x*radius,y*radius,.035);parent.add(point);
    const ripple=stDarkPressure(point);
    const shot=new THREE.Mesh(new THREE.SphereGeometry(.09,12,8),
      new THREE.MeshBasicMaterial({color:0xffae65,toneMapped:false}));
    point.add(shot);
    const particles=stDarkMatter(point,'Scythe Shield blocked fragments',
      [{at:hit,span:.03,count:13,spread:.41,lift:.36,height:.16,back:-.35}],(_t,out)=>out.set(0,0,0));
    return t=>{
      const age=t-hit;
      shot.visible=age>=-.26&&age<0;
      shot.position.set(0,0,Math.max(0,-age)*14);
      shot.scale.set(1,1,2.6);
      ripple(.13+.65*stDarkEase(0,.19,age),
        .86*stDarkEase(0,.038,age)*(1-stDarkEase(.052,.21,age)),t*9);
      particles(t);
    };
  });
}

FXCODE.studio_darkness_shield=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj||!MODELS.ready.has('dark_scythe'))return;
  const root=new THREE.Group();root.name='Scythe Shield preview';anchor.obj.add(root);
  const look={...getLook(NET.myId),ws:-1,wn:0};
  const caster=stDarkShiftStudent(root,look,'Scythe Shield caster',lookTint(look));
  const aimPlane=new THREE.Group();aimPlane.name='Scythe Shield aim plane';root.add(aimPlane);
  const rotor=new THREE.Group();rotor.name='Scythe Shield rotor';aimPlane.add(rotor);
  const scythe=stCreateScythePreview(rotor,{wrap:'C',manual:true,scale:1.42,side:0,lift:-1.06*1.42,fwd:0});
  rotor.updateMatrixWorld(true);
  const inverse=rotor.matrixWorld.clone().invert(),sample=new THREE.Vector3();
  let radius=0;
  scythe.model.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const positions=mesh.geometry.attributes.position,relative=inverse.clone().multiply(mesh.matrixWorld);
    for(let i=0;i<positions.count;i++){
      sample.fromBufferAttribute(positions,i).applyMatrix4(relative);
      radius=Math.max(radius,Math.hypot(sample.x,sample.y));
    }
  });
  const ink=stDarkShieldInk(aimPlane,radius);
  const flames=stDarkShieldFlames(aimPlane,radius);
  const ease=stDarkEase,begin=.15,activeAt=1.05,release=activeAt+3;
  const speed=37,windup=activeAt-begin,releaseAngle=speed*(windup*.5+3);
  const finalAngle=Math.ceil((releaseAngle+speed*.85)/(Math.PI*2))*Math.PI*2;
  const braking=2*(finalAngle-releaseAngle)/speed;
  const demoImpacts=SQ.get('aim')==='cursor'?[]:stDarkShieldImpacts(aimPlane,radius,activeAt);
  const forward=new THREE.Vector3(),target=new THREE.Vector3(),idle=new THREE.Vector3();
  const orientation=new THREE.Euler(0,0,0,'YXZ');
  const cursor=SQ.get('aim')==='cursor';
  instance.updateDarknessShield=()=>{
    const t=instance.t,ready=ease(begin,activeAt,t),letGo=ease(release,release+.87,t),pose=ready*(1-letGo);
    const wind=clamp((t-begin)/windup,0,1),brake=clamp((t-release)/braking,0,1);
    const rpm=ease(0,1,wind)*(1-ease(0,1,brake));
    const blend=ease(.16,.87,rpm)*(1-ease(release+.08,release+.66,t));
    const sweep=ease(activeAt+.16,activeAt+1.05,t),sweepBack=ease(activeAt+1.56,activeAt+2.45,t);
    const turn=(cursor?stDarkShieldAim.x*.92:lerp(-.22,.59,sweep)-.93*sweepBack)*pose;
    const pitch=(cursor?stDarkShieldAim.y*.72:lerp(.04,.46,sweep)-.75*sweepBack)*pose;
    const rise=clamp((t-begin)/LTV.baRise,0,1);
    const lift=LTV.baFloat*(rise*rise*rise*(rise*(rise*6-15)+10))*(1-letGo);
    const strafe=cursor?stDarkShieldAim.moveX:.83*sweep-.99*sweepBack;
    const drift=cursor?stDarkShieldAim.moveZ:.33*sweep-.51*sweepBack;
    caster.g.position.set(strafe,lift,drift);
    caster.g.rotation.y=turn;
    stDarkPose(caster,{back:0,roll:0,drop:0,arms:0,step:.13*pose});
    caster.b.rotation.y=LGPOSE.body*pose;
    caster.armR.rotation.set(LGPOSE.ax*pose,0,(LGPOSE.az-pitch)*pose);
    caster.lgHeadYaw=LGPOSE.head*pose;
    caster.b.updateWorldMatrix(true,true);
    if(caster.rig)rigSync(caster,0);
    lightHeadPose(caster);
    forward.set(Math.sin(turn)*Math.cos(pitch),Math.sin(pitch),Math.cos(turn)*Math.cos(pitch));
    target.copy(caster.g.position).add(new THREE.Vector3(0,1.28,0)).addScaledVector(forward,2.43);
    idle.copy(caster.g.position).add(new THREE.Vector3(-1.23,1.52,.09));
    aimPlane.position.copy(idle).lerp(target,pose);
    orientation.set(-pitch,turn,0,'YXZ');
    aimPlane.quaternion.setFromEuler(orientation);
    const spinUp=speed*windup*(wind*wind*wind-.5*Math.pow(wind,4));
    const steady=speed*clamp(t-activeAt,0,3);
    const coast=speed*braking*(brake-Math.pow(brake,3)+.5*Math.pow(brake,4));
    rotor.rotation.z=-(spinUp+steady+coast);
    rotor.visible=blend<.97;
    rotor.scale.setScalar(lerp(.80,1,pose));
    if(rotor.visible)scythe.update(t);
    ink(rotor.rotation.z,blend);
    flames(t,blend);
    for(const impact of demoImpacts)impact(t);
  };
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{
    instance.updateDarknessShield=null;disposeTree(root);root.removeFromParent();
  });
  instance.updateDarknessShield();
};
