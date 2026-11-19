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

function stWardDrainPool(parent){
  const material=new THREE.ShaderMaterial({
    uniforms:{
      age:{value:0},spread:{value:ST_WARD_DRAIN_SPREAD},
      hold:{value:ST_WARD_DRAIN_HOLD},fade:{value:ST_WARD_DRAIN_FADE},spin:{value:ST_WARD_DRAIN_SPIN}
    },
    transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`varying vec2 field;void main(){field=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float age,spread,hold,fade,spin;varying vec2 field;
    void main(){
      float launch=clamp(age/spread,0.,1.);
      float expansion=1.-pow(1.-launch,2.4);
      float reach=mix(.035,1.,expansion);
      float r=length(field),a=atan(field.y,field.x);
      float edge=reach*(.979+.018*sin(a*13.+age*5.));
      float softness=reach*mix(.080,.028,expansion);
      float alpha=(1.-smoothstep(edge-softness,edge,r))*
        smoothstep(0.,.033,age)*(1.-smoothstep(hold,fade,age));
      float twist=a+age*spin;
      float streak=smoothstep(.18,.96,cos(twist*3.+r*11.+.32*sin(r*22.)));
      float breaks=.48+.52*smoothstep(-.38,.82,sin(twist*5.-r*5.));
      float swirl=streak*breaks*smoothstep(.12,.34,r)*(1.-smoothstep(.76,.98,r));
      swirl*=smoothstep(.09,.23,age);
      float shock=(1.-smoothstep(.024,.095,abs(r-reach*.88)))*
        smoothstep(.004,.029,age)*(1.-smoothstep(.055,.20,age))*(.64+.36*sin(a*11.+r*6.));
      vec3 shade=vec3(.035,.029,.063)*swirl+vec3(.24,.169,.34)*shock;
      gl_FragColor=vec4(shade,alpha);
      #include <colorspace_fragment>
    }`
  });
  const pool=new THREE.Mesh(new THREE.CircleGeometry(ST_WARD_DRAIN_RADIUS,80),material);
  pool.name='Ward drain warning';
  pool.position.y=.031;
  pool.rotation.x=-Math.PI/2;
  pool.renderOrder=2;
  parent.add(pool);
  return age=>{
    pool.visible=age>=0&&age<ST_WARD_DRAIN_FADE;
    material.uniforms.age.value=age;
  };
}

function stWardDrainBadge(parent){
  const badge=new THREE.Group();
  badge.name='Ward drain shield icon';
  badge.position.set(.12,1.53,0);
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
  return age=>{
    badge.visible=age>=0&&age<1.50;
    if(!badge.visible)return;
    badge.lookAt(cam.position);
    badge.scale.setScalar(.51+.49*stDarkEase(0,.095,age)+.21*(1-stDarkEase(0,.20,age)));
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
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{
    instance.updateWardDrain=null;
    disposeTree(root);
    root.removeFromParent();
  });

  const random=stRng(74831),look=getLook(NET.myId);
  const actor=(name,appearance,x,z)=>{
    const student=makeStudent(appearance,name);
    student.g.name=name;
    student.g.position.set(x,0,z);
    root.add(student.g);
    useFileModel(student,'char_student',lookTint(appearance),appearance);
    student.wandG.visible=false;
    return student;
  };
  const caster=actor('Ward drain caster',look,0,0);
  const targets=[[-2.15,10.35],[2.05,12.17],[6.0,13]].map(([x,z],i)=>{
    const student=actor('Ward drain target '+(i+1),{...look,h:i,hs:i+1,cl:i},x,z);
    student.g.rotation.y=Math.atan2(-x,-z);
    const inside=Math.hypot(x,z-ST_WARD_DRAIN_POINT)<=ST_WARD_DRAIN_RADIUS;
    return {student,inside,badge:inside?stWardDrainBadge(student.g):null};
  });

  const updatePool=stWardDrainPool(zone);
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
  const ash=solid(new THREE.OctahedronGeometry(1,0),0x22162e);
  const poolDust=Array.from({length:142},(_,i)=>{
    const mesh=ash.clone();
    zone.add(mesh);
    const afterSpread=i>=60;
    return {
      mesh,born:afterSpread?.19+(i-60)*.017:i*.0026,
      start:afterSpread?lerp(.36,.68,random()):0,angle:random()*ST_WARD_DRAIN_TURN,
      radius:lerp(.33,1,Math.sqrt(random()))*ST_WARD_DRAIN_RADIUS,seed:random()
    };
  });
  const chargeDust=Array.from({length:37},()=>({
    mesh:ash.clone(),seed:random(),angle:random()*ST_WARD_DRAIN_TURN,height:random()-.44
  }));
  for(const {mesh} of chargeDust)root.add(mesh);
  ash.visible=false;
  const wrist=new THREE.Vector3(),end=new THREE.Vector3(0,.055,ST_WARD_DRAIN_POINT);
  const direction=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);

  instance.updateWardDrain=()=>{
    const time=instance.t,poolAge=time-ST_WARD_DRAIN_LAND;
    const hitAge=poolAge-ST_WARD_DRAIN_HIT_DELAY,beamAge=poolAge+.045;
    const gather=stDarkEase(.035,.32,time);
    const release=stDarkEase(-.08,.025,beamAge)*(1-stDarkEase(.12,.39,beamAge));
    stDarkPose(caster,{back:.16*gather-.30*release,roll:-.12*gather,drop:.11*gather,arms:.16*gather,step:.25*release});
    caster.armR.rotation.set(-1.54*gather+.38*release,0,-.62*gather+.50*release);
    caster.armL.rotation.set(-.31*gather,0,.46*gather);
    wrist.set(0,-.72,.07);
    caster.armR.localToWorld(wrist);
    root.worldToLocal(wrist);
    wrist.y+=.16*(1-release);
    orb.position.copy(wrist);
    orb.visible=time>.07&&beamAge<.057;
    orb.scale.setScalar((.07+.22*stDarkEase(.07,.59,time))*(1-stDarkEase(0,.057,beamAge)));
    for(const {mesh,seed,angle,height} of chargeDust){
      const phase=((time*2.9+seed)%1);
      const distance=.16+1.68*(1-phase)**1.45;
      const spin=angle+phase*2.0+time*1.7;
      mesh.visible=time>.06+seed*.17&&beamAge<-.007;
      mesh.position.set(wrist.x+Math.cos(spin)*distance,wrist.y+height*distance,wrist.z+Math.sin(spin)*distance);
      const size=(.032+.071*seed)*Math.sin(Math.PI*phase)*gather;
      mesh.scale.set(size*.51,size*.73,size*2.4);
      mesh.rotation.set(height,spin+Math.PI*.5,0);
    }

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
    const disperse=1-stDarkEase(ST_WARD_DRAIN_HOLD,ST_WARD_DRAIN_FADE,poolAge);
    for(const {mesh,born,start,angle,radius,seed} of poolDust){
      const age=poolAge-born,life=.55+.44*seed;
      mesh.visible=age>0&&age<life&&poolAge<ST_WARD_DRAIN_FADE;
      if(!mesh.visible)continue;
      const phase=age/life;
      const spin=angle+poolAge*ST_WARD_DRAIN_SPIN+phase*.34;
      const expansion=1-(1-clamp(phase/(start===0?.50:.95),0,1))**2;
      const reach=radius*lerp(start,1,expansion);
      const height=.065+(start===0?1.06:0)*Math.sin(Math.PI*phase)+phase*(.74+1.22*seed);
      mesh.position.set(Math.cos(spin)*reach,height,Math.sin(spin)*reach);
      const size=(.066+.107*seed)*stDarkEase(0,.13,phase)*(1-stDarkEase(.54,1,phase))*disperse;
      mesh.scale.set(size,size*1.65,size*.60);
      mesh.rotation.set(phase*5,spin,angle+phase*2);
    }
    for(const {student,inside,badge} of targets){
      const impact=inside?stDarkEase(0,.08,hitAge)*(1-stDarkEase(.12,.49,hitAge)):0;
      stDarkPose(student,{back:-.42*impact,roll:.20*impact,drop:.16*impact,arms:.53*impact,step:.26*impact});
      badge?.(hitAge);
    }
  };
};
