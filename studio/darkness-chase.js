const ST_DARKNESS_CHASE='darkness/chase_preview';

function stChaseScytheOpacity(scythe){
  const materials=new Map();
  return opacity=>{
    if(!materials.size){
      const copy=source=>{
        if(materials.has(source))return materials.get(source);
        const material=source.clone();
        delete material.userData.keep;
        materials.set(source,material);
        return material;
      };
      scythe.pivot.traverse(mesh=>{
        if(!mesh.isMesh||!mesh.material)return;
        mesh.material=Array.isArray(mesh.material)?mesh.material.map(copy):copy(mesh.material);
      });
    }
    for(const [source,material] of materials){
      const translucent=source.transparent||opacity<.999;
      if(material.transparent!==translucent){
        material.transparent=translucent;
        material.needsUpdate=true;
      }
      material.depthWrite=source.depthWrite&&opacity>=.999;
      material.opacity=source.opacity*opacity;
    }
  };
}

function stChaseBall(root,orb,returnPoint,targetZ,launch,arrival,returnBody){
  const ease=stDarkEase;
  const route=new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,0,0),new THREE.Vector3(.08,0,8.2),new THREE.Vector3(.24,0,16.8),
    new THREE.Vector3(.78,0,targetZ-2.5),new THREE.Vector3(2.08,0,targetZ-.88),
    new THREE.Vector3(1.92,0,targetZ+1.20),returnPoint
  ]);
  const samplesPerSegment=40;
  route.arcLengthDivisions=(route.points.length-1)*samplesPerSegment;
  const lengths=route.getLengths(),length=lengths.at(-1),approach=lengths[3*samplesPerSegment];
  const turnLength=length-approach;
  const endSpeed=2*turnLength/(returnBody-arrival);
  const exitSlope=endSpeed*(arrival-launch)/approach;
  const distanceAt=t=>{
    if(t<arrival){
      const u=clamp((t-launch)/(arrival-launch),0,1);
      return approach*u*u*(3-2*u+exitSlope*(u-1));
    }
    const u=clamp((t-arrival)/(returnBody-arrival),0,1);
    return approach+turnLength*u*(2-u);
  };
  const pointAt=(distance,out)=>route.getPointAt(clamp(distance/length,0,1),out);
  const lift=distance=>.24*Math.sin(Math.PI*clamp((distance-approach)/turnLength,0,1));
  const weave=stDarkOrbWeave(root,pointAt,lift);
  const cloak=stDarkShiftCloakTrails(root);
  const wake=stDarkWake(root,distanceAt,pointAt,lift,launch,returnBody,.44,.26);
  const sparks=stDarkWakeShards(root,distanceAt,pointAt,lift,launch+.03,returnBody);
  const place=new THREE.Vector3(),ahead=new THREE.Vector3(),behind=new THREE.Vector3();
  return t=>{
    const distance=distanceAt(t);
    pointAt(distance,place);pointAt(distance+.10,ahead).sub(pointAt(distance-.10,behind));
    const yaw=Math.atan2(ahead.x,ahead.z);
    const compact=ease(.085,launch,t),flight=ease(launch,launch+.12,t)*(1-ease(arrival-.035,arrival+.24,t));
    const returnFade=ease(returnBody-.056,returnBody+.083,t);
    const core=ease(.13,.234,t)*(1-returnFade);
    orb.position.copy(place);orb.position.y=1.10+lift(distance);
    orb.rotation.y=yaw;
    orb.scale.set((.315-.073*flight)*core,(.325-.052*flight)*core,(.36+.18*flight)*core);
    orb.visible=core>.02;
    const gathered=ease(.155,launch+.045,t);
    const strands=.93*ease(.126,launch+.048,t)*(1-ease(returnBody-.03,returnBody+.14,t));
    weave(t,place,distance,strands,gathered,.15*flight,.47,.58*(1-ease(launch,launch+.09,t)));
    cloak(t,place,yaw,compact,ease(.19,launch+.075,t),.76*ease(.075,.135,t)*(1-ease(launch+.035,launch+.20,t)));
    wake(t);sparks(t);
  };
}

FXCODE.studio_darkness_chase=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  anchor.inner.visible=false;
  const root=new THREE.Group();root.name='Darkness marked chase preview';anchor.obj.add(root);
  const look={...getLook(NET.myId),ws:-1,wn:0};
  const caster=stDarkShiftStudent(root,look,'Marked chase caster',lookTint(look));
  const targetLook={...look,h:2,cl:2,hs:2};
  const target=stDarkShiftStudent(root,targetLook,'Marked chase target',lookTint(targetLook));
  const targetZ=22.5,extension=targetZ-7.55,scytheOnly=args.scytheOnly===true;
  target.g.position.z=targetZ;target.g.rotation.y=Math.PI;
  const mark=stDarkTargetMark(target.g),bodyTint=stDarkBodyTint(caster,true);
  const orb=stDarkOrbCore();orb.name='Marked chase orb';root.add(orb);
  const impact=new THREE.Group();impact.name='Marked chase floor impact';root.add(impact);
  impact.position.set(.16,.065,targetZ+.11);impact.rotation.x=-Math.PI/2;
  const pressure=stDarkPressure(impact);
  const shockLayer=new THREE.Group();shockLayer.position.z=.017;impact.add(shockLayer);
  const shock=stDarkPressure(shockLayer);

  const scale=1.40,ease=stDarkEase,launch=.25,arrival=.80,returnBody=1.53;
  const hit1=stScytheHitCut(root,new THREE.Vector3(-.05,.90,targetZ),false);
  const hit2=stScytheHitCut(root,new THREE.Vector3(.05,1.61,targetZ),false);
  const firstHit=.89,firstEnd=.935,firstGone=firstEnd+.060;
  const secondStart=firstGone+.18,secondHit=secondStart+.070;
  const secondEnd=secondStart+.115,secondGone=secondEnd+.065;
  const windStart=secondGone+.12,wandDown=1.91,cutStart=2.035;
  const slashHit=cutStart+.092,land=cutStart+.135;
  const groundFade=land+.13,groundGone=groundFade+.23,spawnAt=groundGone+.038;
  const trailHold=.24,trailFade=.62;
  const slamCut=new THREE.Group();slamCut.name='Marked chase black impact cut';root.add(slamCut);
  slamCut.position.set(.04,0,targetZ);
  const blackCut=stDarkCut(slamCut,[[.35,3.16,.09],[.11,1.40,.15],[-.20,.04,.12]],.12,0x000000,13);
  const splitCut=stDarkCut(slamCut,[[.38,2.81,.12],[.19,1.19,.18],[-.11,.06,.13]],.033,0x000000,14);
  slamCut.traverse(o=>{if(o.isMesh)o.material.depthTest=false;});
  const grit=stDarkMatter(root,'Marked chase ground splinters',[
    {at:land,span:.045,count:36,spread:2.1,lift:1.28,height:.17},
    {at:land+.04,span:.08,count:20,spread:2.43,lift:.31,height:.14}
  ],(_t,out)=>out.set(.16,0,targetZ+.11),.92);
  const describePose=(tip,height)=>{
    const x=new THREE.Vector3(...tip).normalize(),y=new THREE.Vector3(...height);
    y.addScaledVector(x,-x.dot(y)).normalize();
    const z=new THREE.Vector3().crossVectors(x,y);
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z));
  };
  const idle=describePose([.63,.03,-.78],[-.05,1,0]);
  const ready=describePose([.24,-.19,-.95],[.19,.91,.34]);
  const centerLocal=new THREE.Vector3(.69,2.03,0).multiplyScalar(scale);
  const tipOffset=new THREE.Vector3(1.0553,1.6965,0).multiplyScalar(scale).sub(centerLocal);
  const fixTipRoll=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.atan2(2.17-1.6965,1.0553-.04));
  function tipPose(t,p,direction,shaft){
    const q=describePose(direction,shaft).multiply(fixTipRoll);
    return {t,p:new THREE.Vector3(...p).sub(tipOffset.clone().applyQuaternion(q)).toArray(),q};
  }
  // Positions are blade centers. Point the shaft away from the target on the two rising sweeps.
  const keys=[
    {t:0,p:[1.22,3.08,-.62],q:idle},
    {t:.18,p:[1.18,2.70,-1.05],q:ready},
    {t:.28,p:[1.25,2.64,-.87],q:ready},
    {t:.64,p:[1.80,1.95,14.65],q:ready},
    {t:.82,p:[2.77,.67,6.81+extension],q:describePose([-.05,.13,.99],[.99,.10,-.03])},
    {t:.865,p:[1.34,.94,8.89+extension],q:describePose([-.91,.20,.36],[.46,.14,.88])},
    {t:firstEnd,p:[-2.52,1.26,8.39+extension],q:describePose([-.59,.19,-.78],[-.70,.11,.72])},
    {t:firstGone,p:[-3.04,1.36,8.03+extension],q:describePose([-.52,.21,-.82],[-.81,.13,.57])},
    {t:secondStart,p:[-2.95,1.38,7.78+extension],q:describePose([.32,.25,.93],[-.96,.19,.11])},
    {t:secondStart+.038,p:[-1.39,1.64,8.68+extension],q:describePose([.94,.28,.25],[-.37,.15,.90])},
    {t:secondEnd,p:[2.60,2.12,8.29+extension],q:describePose([.72,.27,-.64],[.62,.40,.68])},
    {t:secondGone,p:[3.08,2.28,8.03+extension],q:describePose([.61,.30,-.73],[.68,.37,.64])},
    tipPose(windStart,[1.12,4.62,targetZ+2.30],[-.21,-.18,-.96],[.16,.89,.31]),
    tipPose(1.73,[.85,5.98,targetZ+3.27],[-.16,-.04,-.98],[.22,.94,-.19]),
    tipPose(1.91,[.63,6.77,targetZ+4.05],[-.10,.18,-.98],[.17,.97,.16]),
    tipPose(cutStart,[.48,6.91,targetZ+4.57],[-.06,.34,-.94],[.12,.94,.36]),
    tipPose(cutStart+.043,[.33,5.72,targetZ+2.78],[-.10,-.57,-.81],[.17,.79,-.56]),
    tipPose(slashHit,[.20,2.25,targetZ+.58],[-.07,-.86,-.50],[.17,.52,-.86]),
    tipPose(land,[.16,.09,targetZ+.11],[-.04,-.98,-.18],[.17,.15,-.97])
  ];
  const bladeCurve=new THREE.CatmullRomCurve3(keys.map(({p})=>new THREE.Vector3(...p)));
  const offset=new THREE.Vector3(),sample={pos:new THREE.Vector3(),QB:new THREE.Quaternion(),act:0,shaft:false};
  const scythe=stCreateScythePreview(root,{wrap:'C',manual:true,scale,trailPose:bladeAt,trailWidth:1.62});
  scythe.pivot.name='Marked chase scythe';
  const newScythe=stCreateScythePreview(root,{wrap:'C',manual:true,scale});
  newScythe.pivot.name='Marked chase replacement scythe';
  const fadeBlade=stChaseScytheOpacity(scythe),fadeReplacement=stChaseScytheOpacity(newScythe);
  const wand=new THREE.Group();wand.name='Marked chase wand';caster.armR.add(wand);
  const wood=new THREE.Mesh(new THREE.CylinderGeometry(.019,.031,.96,8),
    new THREE.MeshStandardMaterial({color:0x251c27,roughness:.55}));
  wood.position.y=-1.04;wand.add(wood);
  const ferrule=new THREE.Mesh(new THREE.CylinderGeometry(.033,.027,.21,8),
    new THREE.MeshStandardMaterial({color:0x5b5354,roughness:.3,metalness:.38}));
  ferrule.position.y=-.69;wand.add(ferrule);

  let trailOpacity=1;
  function bladeAt(t){
    const segment=keys.findIndex((_,i)=>i===keys.length-2||t<=keys[i+1].t);
    const a=keys[segment],b=keys[segment+1],u=clamp((t-a.t)/(b.t-a.t),0,1);
    const progress=(segment+u)/(keys.length-1);
    bladeCurve.getPoint(progress,sample.pos);
    sample.pos.y=Math.max(.20,sample.pos.y);
    sample.QB.copy(a.q).slerp(b.q,u);
    const small=ease(.11,.31,t)*(1-ease(secondGone,windStart,t));
    sample.size=1-.34*small;
    sample.pos.sub(offset.copy(centerLocal).multiplyScalar(sample.size).applyQuaternion(sample.QB));
    sample.act=trailOpacity*ease(cutStart,cutStart+.036,t)*(1-ease(land-.018,land+.026,t));
    return sample;
  }

  const returnPoint=new THREE.Vector3(-.26,0,targetZ+1.98);
  const ballFx=scytheOnly?null:stChaseBall(root,orb,returnPoint,targetZ,launch,arrival,returnBody);
  const avatarParts=new Map();
  const hideAvatarPart=object=>{
    if(!object||avatarParts.has(object))return;
    avatarParts.set(object,{mask:object.layers.mask,castShadow:object.castShadow});
    object.layers.disableAll();
    object.castShadow=false;
  };
  if(scytheOnly)orb.visible=false;
  function update(){
    const avatar=ballFx?PM3.get(NET.myId):null;
    avatar?.g.traverse(hideAvatarPart);
    hideAvatarPart(avatar?.cloth?.mo);
    hideAvatarPart(avatar?.cloth?.mi);
    const t=instance.t;
    trailOpacity=1-ease(land+trailHold,land+trailHold+trailFade,t);
    const pose=bladeAt(t);
    scythe.pivot.position.copy(pose.pos);scythe.pivot.quaternion.copy(pose.QB);
    scythe.pivot.scale.setScalar(pose.size);
    // Hold the arc in place after impact, then fade it as a whole.
    scythe.update(t,0,0,Math.min(t,land));
    const first=(1-.69*ease(.08,.255,t))*(1-ease(firstEnd,firstGone,t));
    const second=.31*ease(secondStart,secondStart+.064,t)*(1-ease(secondEnd,secondGone,t));
    const slam=ease(windStart,windStart+.19,t)*(1-ease(groundFade,groundGone,t));
    const oldOpacity=first+second+slam;
    fadeBlade(oldOpacity);scythe.pivot.visible=oldOpacity>.003;
    const spawn=ease(spawnAt,spawnAt+.24,t);
    newScythe.pivot.visible=spawn>.003;
    if(newScythe.pivot.visible){
      newScythe.pivot.position.copy(returnPoint).add(offset.set(1.23,.16,-.08));
      newScythe.pivot.quaternion.copy(idle);
      newScythe.update(t);fadeReplacement(spawn);
    }
    const convert=ease(.08,launch,t);
    ballFx?.(t);
    const entryFade=1-ease(.145,launch+.015,t),returnFade=ease(returnBody-.026,returnBody+.14,t);
    caster.g.visible=!scytheOnly&&(entryFade>.01||returnFade>.01);
    if(t<arrival)caster.g.position.set(0,0,0);
    else caster.g.position.copy(returnPoint);
    caster.g.rotation.y=t<arrival?0:Math.PI;
    bodyTint(t<arrival?convert:1-returnFade,t<arrival?entryFade:returnFade);
    wand.visible=t>=returnBody-.025;
    const raise=ease(returnBody-.035,wandDown-.042,t);
    const lower=ease(wandDown,wandDown+.155,t),recover=ease(land+.060,groundGone+.16,t);
    const overhead=raise*(1-lower),follow=lower*(1-recover);
    stDarkPose(caster,{back:.20*overhead-.34*follow,roll:0,drop:.10*follow,arms:0,step:.15*follow});
    caster.armR.rotation.set(-2.78*overhead-1.04*follow,0,.36*overhead+.26*follow);
    caster.armL.rotation.set(-2.74*overhead-1.14*follow,0,-.40*overhead-.33*follow);
    if(caster.rig)rigSync(caster,0);
    hit1(t-firstHit,1);hit2(t-secondHit,-1);
    mark(.54,8);
    slamCut.lookAt(cam.position);
    blackCut(t-slashHit,.239,.61);splitCut(t-slashHit-.014,.207,.58);
    const contact=t-land;
    pressure(.39+2.12*ease(0,.28,contact),.91*ease(-.01,.034,contact)*(1-ease(.07,.34,contact)),contact*4);
    shock(.29+3.30*ease(0,.31,contact-.054),.52*ease(.033,.083,contact)*(1-ease(.14,.36,contact)),contact*5);
    grit(t);
  }
  instance.updateDarknessChase=update;
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{
    for(const [object,{mask,castShadow}] of avatarParts){
      object.layers.mask=mask;
      object.castShadow=castShadow;
    }
    instance.updateDarknessChase=null;disposeTree(root);root.removeFromParent();
  });
  update();
};
