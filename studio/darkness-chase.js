const ST_DARKNESS_CHASE='darkness/chase_preview';
const ST_DARKNESS_UNMARKED_CHASE='darkness/unmarked_chase_preview';

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

function stDarkChaseRoute(returnPoint,targetZ,launch,arrival,returnBody){
  const stretch=targetZ/22.5;
  const route=new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,0,0),new THREE.Vector3(.32,0,8.2*stretch),new THREE.Vector3(2.55,.08,17.2*stretch),
    new THREE.Vector3(3.28,.32,targetZ+.42),new THREE.Vector3(1.82,.69,targetZ+3.08),
    new THREE.Vector3(.28,.96,targetZ+2.68),new THREE.Vector3(2.12,1.36,targetZ+.45),
    new THREE.Vector3(1.68,1.78,targetZ-1.67),new THREE.Vector3(-.10,2.19,targetZ-2.12),
    new THREE.Vector3(-2.02,2.59,targetZ-1.15),new THREE.Vector3(-2.24,3.13,targetZ+.86),
    new THREE.Vector3(-.86,returnPoint.y+.35,targetZ+2.88),returnPoint
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
  return {distanceAt,pointAt};
}
function stChaseBall(root,orb,route,launch,arrival,returnBody,size=1){
  const {distanceAt,pointAt}=route;
  const ease=stDarkEase;
  const heightSample=new THREE.Vector3();
  const lift=distance=>pointAt(distance,heightSample).y;
  const weave=stDarkOrbWeave(root,pointAt,lift);
  const cloak=stDarkShiftCloakTrails(root);
  const wake=stDarkWake(root,distanceAt,pointAt,lift,launch,returnBody,.33,.22);
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
    orb.scale.set((.24-.051*flight)*core,(.25-.042*flight)*core,(.27+.11*flight)*core).multiplyScalar(size);
    orb.visible=core>.02;
    const gathered=ease(.155,launch+.045,t);
    const strands=.93*ease(.126,launch+.048,t)*(1-ease(returnBody-.03,returnBody+.14,t));
    weave(t,place,distance,strands*size,gathered,.15*flight,lerp(.66,.86,1-size),.58*(1-ease(launch,launch+.09,t)));
    cloak(t,place,yaw,compact,ease(.19,launch+.075,t),.76*ease(.075,.135,t)*(1-ease(launch+.035,launch+.20,t)));
    wake(t);sparks(t);
  };
}

FXCODE.studio_darkness_chase=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  anchor.inner.visible=false;
  const root=new THREE.Group();root.name='Darkness marked chase preview';anchor.obj.add(root);
  const effect=stDarkMarkedChase(root,args);
  instance.updateDarknessChase=()=>effect.update(instance.t);
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{instance.updateDarknessChase=null;effect.dispose();disposeTree(root);root.removeFromParent();});
  instance.updateDarknessChase();
};

function stDarkMarkedChase(root,args){
  const live=args.live;
  const look={...getLook(live?.id??NET.myId),ws:-1,wn:0};
  const caster=live?.caster??stDarkShiftStudent(root,look,'Marked chase caster',lookTint(look));
  const targetZ=live?.distance??22.5,extension=targetZ-7.55,scytheOnly=args.scytheOnly===true;
  let mark;
  if(!live){
    const targetLook={...look,h:2,cl:2,hs:2};
    const target=stDarkShiftStudent(root,targetLook,'Marked chase target',lookTint(targetLook));
    target.g.position.z=targetZ;target.g.rotation.y=Math.PI;
    mark=stDarkTargetMark(target.g);
  }
  const bodyTint=live?.bodyTint??stDarkBodyTint(caster,true);
  const orb=stDarkOrbCore();orb.name='Marked chase orb';root.add(orb);
  const impact=new THREE.Group();impact.name='Marked chase floor impact';root.add(impact);
  impact.position.set(.16,.065,targetZ+.11);impact.rotation.x=-Math.PI/2;
  const pressure=stDarkPressure(impact);
  const shockLayer=new THREE.Group();shockLayer.position.z=.017;impact.add(shockLayer);
  const shock=stDarkPressure(shockLayer);

  const scale=1.40,ease=stDarkEase,launch=.25,arrival=.80,returnBody=1.72;
  const hit1=stScytheHitCut(root,new THREE.Vector3(-.05,.90,targetZ),false);
  const hit2=stScytheHitCut(root,new THREE.Vector3(.05,1.61,targetZ),false);
  const firstHit=.89,firstEnd=.935,firstGone=firstEnd+.060;
  const secondStart=firstGone+.18,secondHit=secondStart+.070;
  const secondEnd=secondStart+.115,secondGone=secondEnd+.065;
  const windStart=secondGone+.12,wandDown=1.955,cutStart=2.035;
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
    {t:.64,p:[1.80,1.95,14.65*targetZ/22.5],q:ready},
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
  const returnPoint=new THREE.Vector3(.55,1.8*1.7,targetZ+2.25);
  const route=stDarkChaseRoute(returnPoint,targetZ,launch,arrival,returnBody);
  const carryPoint=new THREE.Vector3();
  const carryAim=new THREE.Vector3(),carryShaft=new THREE.Vector3(),carryNormal=new THREE.Vector3();
  const carryBasis=new THREE.Matrix4(),carryTurn=new THREE.Quaternion();
  const offset=new THREE.Vector3(),sample={pos:new THREE.Vector3(),QB:new THREE.Quaternion(),act:0,shaft:false};
  const scythe=stCreateScythePreview(root,{wrap:'C',manual:true,scale,trailPose:bladeAt,trailWidth:1.23});
  scythe.pivot.name='Marked chase scythe';
  const newScythe=stCreateScythePreview(root,{wrap:'C',manual:true,scale});
  newScythe.pivot.name='Marked chase replacement scythe';
  const fadeBlade=stChaseScytheOpacity(scythe),fadeReplacement=stChaseScytheOpacity(newScythe);
  const wand=new THREE.Group();wand.name='Marked chase wand';
  if(live)root.add(wand);else caster.armR.add(wand);
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
    const carrying=ease(.07,launch,t)*(1-ease(arrival-.10,arrival+.02,t));
    if(carrying>0){
      route.pointAt(route.distanceAt(t),carryPoint);
      carryPoint.x+=2.02;
      carryPoint.y+=.76;
      carryPoint.z-=.82;
      sample.pos.lerp(carryPoint,carrying);
      carryAim.set(-carryPoint.x,0,targetZ-carryPoint.z).normalize();
      carryShaft.set(carryAim.z,.13,-carryAim.x).normalize();
      carryNormal.crossVectors(carryAim,carryShaft);
      carryTurn.setFromRotationMatrix(carryBasis.makeBasis(carryAim,carryShaft,carryNormal)).multiply(fixTipRoll);
      sample.QB.slerp(carryTurn,carrying);
    }
    const small=ease(.11,.31,t)*(1-ease(secondGone,windStart,t));
    sample.size=1-(live?.17:.34)*small;
    sample.pos.sub(offset.copy(centerLocal).multiplyScalar(sample.size).applyQuaternion(sample.QB));
    sample.act=trailOpacity*ease(cutStart,cutStart+.036,t)*(1-ease(land-.018,land+.026,t));
    return sample;
  }

  const facing=Math.atan2(-returnPoint.x,targetZ-returnPoint.z);
  let shins=null;
  const ballFx=scytheOnly?null:stChaseBall(root,orb,route,launch,arrival,returnBody,live?.72:1);
  const avatarParts=new Map();
  const hideAvatarPart=object=>{
    if(!object||avatarParts.has(object))return;
    avatarParts.set(object,{mask:object.layers.mask,castShadow:object.castShadow});
    object.layers.disableAll();
    object.castShadow=false;
  };
  if(scytheOnly)orb.visible=false;
  function update(t){
    const avatar=ballFx&&!live?PM3.get(NET.myId):null;
    avatar?.g.traverse(hideAvatarPart);
    hideAvatarPart(avatar?.cloth?.mo);
    hideAvatarPart(avatar?.cloth?.mi);
    trailOpacity=1-ease(land+trailHold,land+trailHold+trailFade,t);
    const pose=bladeAt(t);
    scythe.pivot.position.copy(pose.pos);scythe.pivot.quaternion.copy(pose.QB);
    scythe.pivot.scale.setScalar(pose.size);
    // Hold the arc in place after impact, then fade it as a whole.
    scythe.update(t,0,0,Math.min(t,land));
    const first=(1-.69*ease(.08,.255,t))*(1-ease(firstEnd,firstGone,t));
    const second=.31*ease(secondStart,secondStart+.064,t)*(1-ease(secondEnd,secondGone,t));
    const slam=ease(windStart,windStart+.19,t)*(1-ease(groundFade,groundGone,t));
    const approach=lerp(1,.86,ease(.08,.255,t));
    const firstLive=approach*(1-ease(firstEnd,firstGone,t));
    const between=.34*ease(firstEnd,firstGone,t)*(1-ease(secondStart-.067,secondStart,t));
    const secondLive=.91*ease(secondStart-.085,secondStart-.005,t)*(1-ease(secondEnd,secondGone,t));
    const oldOpacity=live?clamp(firstLive+between+secondLive+slam,0,1):first+second+slam;
    fadeBlade(oldOpacity);scythe.pivot.visible=oldOpacity>.003;
    const spawn=ease(spawnAt,spawnAt+.24,t);
    const descent=clamp((t-wandDown)/(land-wandDown),0,1);
    const hoverHeight=returnPoint.y*(1-descent**1.65);
    newScythe.pivot.visible=spawn>.003;
    if(newScythe.pivot.visible){
      const settle=ease(spawnAt,spawnAt+.62,t);
      newScythe.pivot.position.copy(returnPoint).add(offset.set(
        lerp(1.78,1.23,settle),hoverHeight+lerp(.52,.16,settle),lerp(.30,-.08,settle)));
      newScythe.pivot.quaternion.copy(ready).slerp(idle,settle);
      newScythe.update(t);fadeReplacement(spawn);
    }
    const convert=ease(.08,launch,t);
    ballFx?.(t);
    const entryFade=1-ease(.145,launch+.015,t),returnFade=ease(returnBody-.026,returnBody+.14,t);
    const bodyVisible=t<DARK_CHASE_T.orbStart||t>=DARK_CHASE_T.orbEnd;
    if(!live){
      caster.g.visible=!scytheOnly&&bodyVisible;
      if(t<arrival)caster.g.position.set(0,0,0);
      else caster.g.position.set(returnPoint.x,hoverHeight,returnPoint.z);
      caster.ring.visible=t<arrival||hoverHeight<.03;
    }else caster.b.visible=bodyVisible;
    bodyTint(t<arrival?convert:1-returnFade,t<arrival?entryFade:returnFade);
    wand.visible=!live&&t>=returnBody-.025;
    const raise=ease(returnBody-.035,wandDown-.042,t);
    const lower=ease(wandDown,wandDown+.112,t),recover=ease(land+.28,land+.68,t);
    const overhead=raise*(1-lower),follow=lower*(1-recover);
    const brace=ease(land-.070,land+.024,t)*(1-recover);
    const lean=-.17*overhead+.23*follow+.22*brace;
    if(!live)caster.g.rotation.y=t<arrival?0:facing-.26*overhead+.15*follow;
    stDarkPose(caster,{back:lean,roll:-.15*overhead+.14*follow,drop:.15*brace,arms:0,step:0});
    caster.b.rotation.y=-.39*overhead+.33*follow;
    caster.armR.rotation.set(-2.83*overhead-.58*follow,-.22*overhead+.31*follow,.47*overhead+.21*follow);
    caster.armL.rotation.set(-2.58*overhead-.87*follow,.13*overhead-.19*follow,-.34*overhead-.58*follow);
    caster.legs[0].rotation.set(.24*overhead+.25*brace-lean,0,-.16*brace);
    caster.legs[1].rotation.set(-.38*overhead-.59*brace-lean,0,.19*brace);
    if(caster.rig)rigSync(caster,0);
    if(!shins&&caster.fileModel){
      shins=['shin_R','shin_L'].map(name=>{
        const bone=caster.fileModel.getObjectByName(name);
        return bone?{bone,rest:bone.quaternion.clone()}:null;
      });
    }
    shins?.forEach((joint,i)=>{
      if(!joint)return;
      joint.bone.quaternion.copy(joint.rest);
      joint.bone.rotateX((i?.57:.26)*overhead+(i?1.04:.66)*brace);
    });
    hit1(t-firstHit,1);hit2(t-secondHit,-1);
    mark?.(.54,8);
    slamCut.lookAt(cam.position);
    blackCut(t-slashHit,.239,.61);splitCut(t-slashHit-.014,.207,.58);
    const contact=t-land;
    pressure(.39+2.12*ease(0,.28,contact),.91*ease(-.01,.034,contact)*(1-ease(.07,.34,contact)),contact*4);
    shock(.29+3.30*ease(0,.31,contact-.054),.52*ease(.033,.083,contact)*(1-ease(.14,.36,contact)),contact*5);
    grit(t);
  }
  return {update,blade:()=>newScythe.pivot.visible?newScythe.pivot:scythe.pivot,dispose(){
    for(const [object,{mask,castShadow}] of avatarParts){
      object.layers.mask=mask;object.castShadow=castShadow;
    }
  }};
}

FXCODE.studio_darkness_unmarked_chase=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  anchor.inner.visible=false;
  const root=new THREE.Group();root.name='Darkness unmarked chase preview';anchor.obj.add(root);
  const update=stDarkUnmarkedChase(root);
  instance.updateDarknessChase=()=>update(instance.t);
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{instance.updateDarknessChase=null;disposeTree(root);root.removeFromParent();});
  instance.updateDarknessChase();
};

function stDarkUnmarkedChase(root,live){
  const look={...getLook(live?.id??NET.myId),ws:-1,wn:0};
  const caster=live?.caster??stDarkShiftStudent(root,look,'Unmarked chase caster',lookTint(look));
  const range=live?.range??6.25;
  const targetZ=range+2.85;
  const targetLook={...look,h:2,cl:2,hs:2};
  const targets=(live?[]:[[-.72,targetZ],[.78,targetZ+.44],[3.25,targetZ+.23]]).map(([x,z],i)=>{
    const actor=stDarkShiftStudent(root,targetLook,'Unmarked chase target '+i,lookTint(targetLook));
    actor.g.rotation.y=Math.PI;
    return {actor,x,z,hit:i<2};
  });
  const ease=stDarkEase,launch=0,stop=.235,swing=stop,hit=.285,finish=.595,recover=1.52,scale=1.40;
  const travel=live?.travel;
  const distanceAt=t=>travel?travel.clock(clamp(t/stop,0,1)*live.duration):range*(1-(1-clamp((t-launch)/(stop-launch),0,1))**2);
  const pathAt=(d,out)=>travel?travel.pointAt(d,out):out.set(0,0,d);
  const wakeHeight=new THREE.Vector3(),wakeOffset=new THREE.Vector3(-.20,0,-.28),lowOffset=new THREE.Vector3(.32,0,-.47);
  const wake=stDarkWake(root,distanceAt,(d,out)=>pathAt(d,out).add(wakeOffset),d=>pathAt(d,wakeHeight).y-.35,launch,stop,.81,.52);
  const lowWake=stDarkWake(root,distanceAt,(d,out)=>pathAt(d,out).add(lowOffset),d=>pathAt(d,wakeHeight).y-.72,launch,stop,.44,.45);
  const echoes=[.031,.081,.146].map((time,i)=>{
    const actor=stDarkShiftStudent(root,look,'Unmarked chase echo '+i);
    const ink=new THREE.MeshBasicMaterial({color:0x121019,toneMapped:false,transparent:true,depthWrite:false});
    actor.ring.visible=false;
    return {time,actor,ink,ready:false};
  });
  const swingHeight=3.35,swingReach=2.92,startAngle=-.325,hitAngle=.361,topAngle=Math.PI+.20;
  const swingForward=new THREE.Vector3(.20,0,.98).normalize();
  const swingCenter=new THREE.Vector3(-1.46,.25+swingHeight*Math.cos(startAngle),range+1.04)
    .addScaledVector(swingForward,-swingReach*Math.sin(startAngle));
  function sweepTip(angle,out){
    out.copy(swingCenter).addScaledVector(swingForward,swingReach*Math.sin(angle));
    out.y-=swingHeight*Math.cos(angle);
  }
  const tip=new THREE.Vector3(1.0553,1.6965,0).multiplyScalar(scale),offset=new THREE.Vector3();
  const tipAngle=Math.atan2(2.17-1.6965,1.0553-.04);
  const tipCorrection=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),tipAngle);
  const aimBlade=(direction,shaft)=>{
    const x=new THREE.Vector3(...direction).normalize(),y=new THREE.Vector3(...shaft);
    y.addScaledVector(x,-x.dot(y)).normalize();
    const z=new THREE.Vector3().crossVectors(x,y);
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z)).multiply(tipCorrection);
  };
  const low=aimBlade([-.12,-.85,.51],[-.41,-.56,-.66]);
  const bladeInPlane=aimBlade(swingForward.toArray(),[0,-1,0]);
  const swingAxis=new THREE.Vector3(-swingForward.z,0,swingForward.x);
  const swingRotation=new THREE.Quaternion();
  const high=new THREE.Quaternion().setFromAxisAngle(swingAxis,topAngle).multiply(bladeInPlane);
  const highOffset=tip.clone().applyQuaternion(high);
  const returnStart=new THREE.Vector3();
  sweepTip(topAngle,returnStart);returnStart.sub(highOffset);
  const restPosition=new THREE.Vector3(1.5,.08,range);
  const restRotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(.25,-.32,.16));
  const returnReference=restRotation.clone(),returnOffset=new THREE.Quaternion(),returnCorrection=new THREE.Quaternion();
  let returning=false;
  const sample={pos:new THREE.Vector3(),QB:new THREE.Quaternion(),act:0,shaft:false};
  const landingOffset=new THREE.Vector3(),approachPoint=new THREE.Vector3();
  function bladeAt(t){
    if(t<swing){
      const drag=ease(stop-.083,swing,t);
      pathAt(distanceAt(t-.028*(1-drag)),approachPoint);
      sample.pos.set(approachPoint.x-1.46,approachPoint.y+.25,approachPoint.z+lerp(-.74,1.04,drag));
      sample.QB.copy(low);
    }else if(t<hit){
      const raise=clamp((t-swing)/(hit-swing),0,1);
      sweepTip(lerp(startAngle,hitAngle,raise),sample.pos);
      swingRotation.setFromAxisAngle(swingAxis,lerp(-.85,hitAngle,raise)).multiply(bladeInPlane);
      sample.QB.copy(low).slerp(swingRotation,ease(0,.28,raise));
    }else if(t<finish){
      const rise=clamp((t-hit)/(finish-hit),0,1);
      const sweep=rise*(1.35+rise*(.30-.65*rise));
      const angle=lerp(hitAngle,topAngle,sweep);
      sweepTip(angle,sample.pos);
      sample.QB.setFromAxisAngle(swingAxis,angle).multiply(bladeInPlane);
    }else{
      const returnTime=clamp((t-finish)/(recover-finish),0,1);
      const settle=returnTime*returnTime*(3-2*returnTime);
      sample.pos.copy(returnStart).add(landingOffset).lerp(restPosition,settle);
      sample.pos.x+=.33*Math.sin(Math.PI*settle)**2;
      stDarkReturnRotation(sample.QB,high,returnReference,restRotation,ease(.19,1,returnTime),returnOffset,returnCorrection);
    }
    if(t<finish){
      if(t>=swing)sample.pos.add(landingOffset);
      sample.pos.sub(offset.copy(tip).applyQuaternion(sample.QB));
    }
    const returnFade=ease(finish+.12,recover,t);
    sample.act=ease(swing,swing+.014,t)*(1-.19*ease(finish,finish+.11,t))*(1-returnFade);
    return sample;
  }
  const scythe=stCreateScythePreview(root,{wrap:'C',manual:true,scale,trailPose:bladeAt,trailWidth:1.42});
  const liftDust=stDarkMatter(root,'Unmarked chase lift debris',[
    {at:hit-.012,span:.042,count:44,spread:1.43,lift:3.27,height:.35},
    {at:hit+.025,span:.098,count:23,spread:1.18,lift:2.50,height:.91}
  ],(_t,out)=>out.copy(landingOffset).addScaledVector(impactForward,targetZ-.38),.84);
  const impactForward=new THREE.Vector3(0,0,1);
  const ground=new THREE.Group();ground.position.set(0,.055,targetZ-.65);ground.rotation.x=-Math.PI/2;root.add(ground);
  const pressure=stDarkPressure(ground);
  const forearms=new WeakMap();
  function bendForearms(actor,right,left){
    if(!actor.fileModel)return;
    if(!forearms.has(actor))forearms.set(actor,['forearm_R','forearm_L'].map(name=>{
      const bone=actor.fileModel.getObjectByName(name);
      return bone?{bone,rest:bone.quaternion.clone()}:null;
    }));
    forearms.get(actor).forEach((joint,i)=>{
      if(!joint)return;
      joint.bone.quaternion.copy(joint.rest);
      joint.bone.rotateX(-(i?left:right));
    });
  }
  function poseCaster(actor,t){
    const drive=ease(launch,launch+.032,t)*(1-ease(stop-.085,stop+.008,t));
    const plant=ease(stop-.094,swing+.018,t)*(1-ease(hit+.013,hit+.30,t));
    const whip=ease(swing,hit+.043,t)*(1-ease(hit+.20,finish+.13,t));
    const ready=ease(hit+.14,finish+.12,t)*(1-ease(recover-.19,recover+.13,t));
    const turn=-.26*drive-.43*plant+.65*whip+.13*ready;
    if(!live||actor!==caster)pathAt(distanceAt(t),actor.g.position);
    stDarkPose(actor,{back:.57*drive+.24*plant-.27*whip+.10*ready,
      roll:-.14*drive-.14*plant+.22*whip,drop:.09*drive+.24*plant-.07*whip,arms:0,step:0});
    actor.b.rotation.y=turn;
    actor.armR.rotation.set(.84*drive+.47*plant-2.23*whip-.49*ready,
      .12*drive+.22*plant-.43*whip,-.23-.26*plant-.38*whip);
    actor.armL.rotation.set(-.33*drive-.56*plant+.29*whip-.29*ready,.12*whip,.27+.62*whip);
    actor.legs[0].rotation.set(.60*drive+.30*plant-.14*whip,0,-.09*plant);
    actor.legs[1].rotation.set(-.85*drive-.77*plant-.19*whip,0,.13*plant);
    if(actor.rig)rigSync(actor,0);
    dpKnees(actor,.36*drive+.56*plant+.17*whip,.86*drive+.98*plant+.42*whip);
    bendForearms(actor,.45*drive+.89*plant+.24*whip+.60*ready,.65*drive+.53*plant+.36*whip+.36*ready);
  }
  const update=t=>{
    if(travel){pathAt(distanceAt(stop),landingOffset);landingOffset.z-=range;}
    if(t<finish)returning=false;
    else if(live?.restPose){
      live.restPose(0,restPosition,restRotation);
      if(!returning)returnReference.copy(restRotation);
      returning=true;
    }
    ground.position.copy(landingOffset).addScaledVector(impactForward,targetZ-.65);ground.position.y+=.055;
    const pose=bladeAt(t);
    scythe.pivot.position.copy(pose.pos);scythe.pivot.quaternion.copy(pose.QB);
    scythe.update(t);
    poseCaster(caster,t);
    for(const echo of echoes){
      if(!echo.ready&&echo.actor.fileModel){
        echo.actor.fileModel.traverse(part=>{
          if(!part.isMesh)return;
          part.material=echo.ink;part.castShadow=false;part.receiveShadow=false;
        });
        echo.ready=true;
      }
      const elapsed=t-echo.time,opacity=.65*ease(0,.026,elapsed)*(1-ease(.065,.235,elapsed));
      echo.actor.g.visible=echo.ready&&opacity>.02;echo.ink.opacity=opacity;
      if(echo.actor.g.visible)poseCaster(echo.actor,echo.time);
    }
    for(const {actor,x,z,hit:affected} of targets){
      const u=affected?clamp((t-hit)/.70,0,1):0;
      const height=4*u*(1-u),recoil=height*(1-.3*u);
      actor.g.position.set(x,2.08*height,z);
      stDarkPose(actor,{back:-.37*recoil,roll:x*.15*recoil,drop:0,arms:.66*recoil,step:.45*recoil});
    }
    const contact=t-hit;
    pressure(.42+1.75*ease(0,.20,contact),.75*ease(-.01,.028,contact)*(1-ease(.065,.24,contact)),contact*6);
    liftDust(t);wake(t);lowWake(t);
    return t>=recover;
  };
  update.blade=scythe.pivot;
  return update;
}
