// Studio study of the shield debuff. Times and distances here stage the preview.
const ST_DARKNESS_WARD_DRAIN='darkness/ward_drain_preview';
const ST_WARD_DRAIN_RADIUS=5.5;
const ST_WARD_DRAIN_POINT=11;
const ST_WARD_DRAIN_LAND=.68;
const ST_WARD_DRAIN_SPREAD=.145;
const ST_WARD_DRAIN_HIT_DELAY=.5;
const ST_WARD_DRAIN_HOLD=1.44;
const ST_WARD_DRAIN_FADE=2;
const ST_WARD_DRAIN_SPIN=.94;
const ST_WARD_DRAIN_TURN=Math.PI*2;

function stWardDrainBadge(parent,duration=1.50){
  const badge=new THREE.Group();
  badge.name='Ward drain shield icon';
  badge.position.set(.12,duration>1.5?2.18:1.53,0);
  parent.add(badge);
  const fill=(points,color,order)=>{
    const shape=new THREE.Shape(points.map(([x,y])=>new THREE.Vector2(x,y)));
    const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({
      color,depthTest:false,depthWrite:false,toneMapped:false,side:THREE.DoubleSide
    }));
    mesh.renderOrder=order;
    badge.add(mesh);
  };
  fill([[-.32,.24],[0,.38],[.33,.24],[.30,-.04],[.23,-.24],[0,-.38],[-.24,-.22],[-.31,-.03]],0x0a0612,21);
  fill([[-.23,.19],[-.025,.29],[-.068,.06],[.03,-.04],[-.043,-.125],[.012,-.28],[-.17,-.18],[-.235,-.035]],0xdad4f0,22);
  fill([[.05,.275],[.24,.184],[.218,-.03],[.161,-.175],[.074,-.242],[.04,-.126],[.13,-.047],[.026,.076]],0x473362,22);
  const worldPos=new THREE.Vector3();
  return age=>{
    badge.visible=age>=0&&age<duration;
    if(!badge.visible)return;
    badge.lookAt(cam.position);
    const readability=duration>1.5?clamp(cam.position.distanceTo(badge.getWorldPosition(worldPos))/12,1,1.90):1;
    badge.scale.setScalar(readability*(.51+.49*stDarkEase(0,.095,age)+.21*(1-stDarkEase(0,.20,age)))*(1-stDarkEase(duration-.20,duration,age)));
  };
}

function stWardDrainTarget(root,duration){
  const badge=stWardDrainBadge(root,duration);
  const floor=new THREE.Group();
  floor.position.y=.076;
  floor.rotation.x=-Math.PI/2;
  root.add(floor);
  const ripple=stDarkPressure(floor);
  const band=new THREE.Mesh(new THREE.RingGeometry(.74,.79,36),new THREE.MeshBasicMaterial({
    color:0x5d397c,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false
  }));
  floor.add(band);
  const fragments=stDarkMatter(root,'Ward drain shield fragments',[
    {at:0,span:.07,count:18,spread:.91,lift:.43,height:1.42}
  ],(_t,out)=>out.set(0,0,0),.85);
  return t=>{
    badge(t);
    ripple(.44+1.11*stDarkEase(0,.32,t),.83*(1-stDarkEase(.09,.43,t)),t*9);
    band.material.opacity=(.49+.12*Math.sin(t*5))*(1-stDarkEase(duration-.34,duration,t));
    fragments(t);
  };
}

FXCODE.studio_darkness_ward_drain=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  const root=new THREE.Group(),zone=new THREE.Group();
  root.name='Darkness ward drain preview';
  zone.position.z=ST_WARD_DRAIN_POINT;
  root.add(zone);
  anchor.obj.add(root);
  const update=stWardDrainEffect(root,zone,{});
  instance.updateWardDrain=()=>update(instance.t);
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{
    instance.updateWardDrain=null;
    disposeTree(root);
    root.removeFromParent();
  });
};

function stWardDrainEffect(root,zone,{liveCaster,radius=ST_WARD_DRAIN_RADIUS,duration=ST_WARD_DRAIN_FADE}={}){
  const live=!!liveCaster,random=live?mkRng(74831):stRng(74831),look=getLook(NET.myId);
  const actor=(name,appearance,x,z)=>{
    const student=makeStudent(appearance,name);
    student.g.name=name;
    student.g.position.set(x,0,z);
    root.add(student.g);
    useFileModel(student,'char_student',lookTint(appearance),appearance);
    student.wandG.visible=false;
    return student;
  };
  const caster=liveCaster||actor('Ward drain caster',look,0,0);
  const targets=(live?[]:[[-2.15,10.35],[2.05,12.17],[6.0,13]]).map(([x,z],i)=>{
    const student=actor('Ward drain target '+(i+1),{...look,h:i,hs:i+1,cl:i},x,z);
    student.g.rotation.y=Math.atan2(-x,-z);
    const inside=Math.hypot(x,z-ST_WARD_DRAIN_POINT)<=ST_WARD_DRAIN_RADIUS;
    return {student,inside,badge:inside?stWardDrainBadge(student.g):null};
  });

  const updatePool=stWardDrainPool(zone,radius,duration);
  const solid=(geometry,color,parent=root)=>{
    const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,toneMapped:false}));
    parent.add(mesh);
    return mesh;
  };
  const orb=solid(new THREE.SphereGeometry(1,20,14),0x09060f);
  orb.name='Ward drain charge orb';
  const tracer=solid(new THREE.CylinderGeometry(.45,1,1,7),0x150b22);
  tracer.name='Ward drain beam';
  const filament=solid(new THREE.CylinderGeometry(.6,1,1,5),0x9273b5,tracer);
  filament.scale.set(.19,1,.19);
  filament.position.x=.54;
  const dustGeometry=new THREE.OctahedronGeometry(1,0);
  const dustMaterial=new THREE.MeshBasicMaterial({color:0x22162e,toneMapped:false});
  const poolParticles=new THREE.InstancedMesh(dustGeometry,dustMaterial,142);
  const chargeParticles=new THREE.InstancedMesh(dustGeometry,dustMaterial,37);
  for(const mesh of [poolParticles,chargeParticles]){
    mesh.count=0;mesh.frustumCulled=false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }
  zone.add(poolParticles);root.add(chargeParticles);
  const particle=new THREE.Object3D();
  const poolDust=Array.from({length:142},(_,i)=>{
    const afterSpread=i>=60;
    return {
      born:afterSpread?.19+(i-60)*.017:i*.0026,
      start:afterSpread?lerp(.36,.68,random()):0,angle:random()*ST_WARD_DRAIN_TURN,
      radius:lerp(.33,1,Math.sqrt(random()))*radius,seed:random()
    };
  });
  const chargeDust=Array.from({length:37},()=>({
    seed:random(),angle:random()*ST_WARD_DRAIN_TURN,height:random()-.44
  }));
  const wrist=new THREE.Vector3(),end=zone.position.clone();end.y+=.055;
  const direction=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);

  return time=>{
    const poolAge=time-ST_WARD_DRAIN_LAND;
    const hitAge=poolAge-ST_WARD_DRAIN_HIT_DELAY,beamAge=poolAge+.045;
    const gather=stDarkEase(.035,.32,time);
    const release=stDarkEase(-.08,.025,beamAge)*(1-stDarkEase(.12,.39,beamAge));
    if(!live||poolAge<.25){
      stDarkPose(caster,{back:.16*gather-.30*release,roll:-.12*gather,drop:.11*gather,arms:.16*gather,step:.25*release});
      caster.armR.rotation.set(-1.54*gather+.38*release,0,-.62*gather+.50*release);
      caster.armL.rotation.set(-.31*gather,0,.46*gather);
      if(caster.rig)rigSync(caster,0);
    }
    wrist.set(0,-.72,.07);
    caster.armR.localToWorld(wrist);
    root.worldToLocal(wrist);
    wrist.y+=.16*(1-release);
    orb.position.copy(wrist);
    orb.visible=time>.07&&beamAge<.057;
    orb.scale.setScalar((.07+.22*stDarkEase(.07,.59,time))*(1-stDarkEase(0,.057,beamAge)));
    let chargeCount=0;
    for(const {seed,angle,height} of chargeDust){
      if(time<=.06+seed*.17||beamAge>=-.007)continue;
      const phase=((time*2.9+seed)%1);
      const distance=.16+1.68*(1-phase)**1.45;
      const spin=angle+phase*2.0+time*1.7;
      particle.position.set(wrist.x+Math.cos(spin)*distance,wrist.y+height*distance,wrist.z+Math.sin(spin)*distance);
      const size=(.032+.071*seed)*Math.sin(Math.PI*phase)*gather;
      particle.scale.set(size*.51,size*.73,size*2.4);
      particle.rotation.set(height,spin+Math.PI*.5,0);particle.updateMatrix();
      chargeParticles.setMatrixAt(chargeCount++,particle.matrix);
    }
    chargeParticles.count=chargeCount;chargeParticles.instanceMatrix.needsUpdate=chargeCount>0;

    tracer.visible=beamAge>=0&&beamAge<.13;
    if(tracer.visible){
      direction.subVectors(end,wrist);
      const length=direction.length(),front=stDarkEase(0,.045,beamAge);
      const back=stDarkEase(.038,.13,beamAge);
      tracer.position.copy(wrist).addScaledVector(direction,(front+back)*.5);
      tracer.quaternion.setFromUnitVectors(up,direction.normalize());
      const width=.15*(1-stDarkEase(.046,.13,beamAge));
      tracer.scale.set(width,length*(front-back),width);
    }

    updatePool(poolAge);
    const disperse=1-stDarkEase(ST_WARD_DRAIN_HOLD,duration,poolAge);
    let poolCount=0;
    for(const {born,start,angle,radius,seed} of poolDust){
      const age=poolAge-born,life=.55+.44*seed;
      if(age<=0||age>=life||poolAge>=duration)continue;
      const phase=age/life;
      const spin=angle+poolAge*ST_WARD_DRAIN_SPIN+phase*.34;
      const expansion=1-(1-clamp(phase/(start===0?.50:.95),0,1))**2;
      const reach=radius*lerp(start,1,expansion);
      const height=.065+(start===0?1.06:0)*Math.sin(Math.PI*phase)+phase*(.74+1.22*seed);
      particle.position.set(Math.cos(spin)*reach,height,Math.sin(spin)*reach);
      const size=(.066+.107*seed)*stDarkEase(0,.13,phase)*(1-stDarkEase(.54,1,phase))*disperse;
      particle.scale.set(size,size*1.65,size*.60);
      particle.rotation.set(phase*5,spin,angle+phase*2);particle.updateMatrix();
      poolParticles.setMatrixAt(poolCount++,particle.matrix);
    }
    poolParticles.count=poolCount;poolParticles.instanceMatrix.needsUpdate=poolCount>0;
    for(const {student,inside,badge} of targets){
      const impact=inside?stDarkEase(0,.08,hitAge)*(1-stDarkEase(.12,.49,hitAge)):0;
      stDarkPose(student,{back:-.42*impact,roll:.20*impact,drop:.16*impact,arms:.53*impact,step:.26*impact});
      badge?.(hitAge);
    }
  };
};
