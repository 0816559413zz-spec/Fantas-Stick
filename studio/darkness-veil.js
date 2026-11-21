const ST_DARKNESS_VEIL='darkness/veil_preview';

FXCODE.studio_darkness_veil=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  anchor.inner.visible=false;
  const root=new THREE.Group();root.name='Darkness veil preview';anchor.obj.add(root);
  const ease=stDarkEase,plant=.91,end=3.03,radius=4.15;
  const allyView=SQ.get('veilView')==='ally';
  const look={...getLook(NET.myId),ws:-1,wn:0};
  const caster=stDarkShiftStudent(root,look,'Veil caster',lookTint(look));
  caster.g.position.set(.78,0,-1.18);caster.g.rotation.y=-.59;
  const allies=[[-1.79,1.14],[2.25,1.67],[2.70,4.09]].map(([x,z],i)=>{
    const appearance={...look,h:i+1,hs:i+1,cl:i+1};
    const actor=stDarkShiftStudent(root,appearance,'Veil ally '+(i+1),lookTint(appearance));
    actor.g.position.set(x,0,z);
    return {actor,tint:stDarkBodyTint(actor,true),distance:Math.hypot(x,z)};
  });
  allies.push({actor:caster,tint:stDarkBodyTint(caster,true),distance:Math.hypot(.78,1.18)});

  const wandMat=new THREE.MeshStandardMaterial({color:0x282232,roughness:.55,transparent:true});
  const wand=new THREE.Mesh(new THREE.CylinderGeometry(.016,.031,.94,8),wandMat);
  wand.name='Veil wand';root.add(wand);
  const poseCaster=stDarkVeilCaster(root,caster,wand);
  const scale=1.38,bladePose=stDarkVeilBlade(scale);
  const pullClear=DARK_VEIL_PULL_CLEAR,pullDone=pullClear+.51;
  const scythe=stCreateScythePreview(root,{wrap:'C',manual:true,scale,trailPose:bladePose});
  scythe.pivot.name='Veil scythe';
  const fadeScythe=stChaseScytheOpacity(scythe);
  const showGround=stDarkVeilGround(root,radius);
  const splash=stDarkMatter(root,'Veil ground flecks',[
    {at:plant,span:.10,count:44,spread:1.6,lift:.65,height:.10,back:0},
    {at:plant+.16,span:.20,count:28,spread:2.35,lift:.34,height:.08,back:0},
    {at:pullClear-.04,span:.07,count:17,spread:.42,lift:.66,height:.07,back:0}
  ],(_t,out)=>out.set(0,0,0),.86);

  instance.updateDarknessVeil=()=>{
    const t=instance.t,age=t-plant;
    poseCaster(t);

    const blade=bladePose(t);
    scythe.pivot.quaternion.copy(blade.QB);
    scythe.pivot.position.copy(blade.pos);
    scythe.update(t);

    const spread=ease(0,.37,age),clear=ease(end,end+.36,t);
    showGround(age,spread,ease(0,.10,age)*(1-clear));
    splash(t);
    let casterCover=0;
    for(const {actor,tint,distance} of allies){
      const reachAt=plant+.32*distance/radius;
      const cover=distance<radius?ease(reachAt,reachAt+.31,t)*(1-clear):0;
      const ink=distance<radius?ease(reachAt-.08,reachAt+.095,t)*(1-clear):0;
      const visibleBody=1-cover*(allyView?.58:1);
      tint(ink,visibleBody);
      actor.g.visible=visibleBody>.005;
      actor.ring.material.opacity=.7*(1-cover);
      if(actor===caster){casterCover=cover;wandMat.opacity=visibleBody;wand.visible=actor.g.visible;}
    }
    const hideWeapon=ease(pullClear,pullDone,t)*casterCover;
    const weaponOpacity=allyView?1:1-hideWeapon;
    fadeScythe(weaponOpacity);
    scythe.pivot.visible=weaponOpacity>.005;
  };
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{
    instance.updateDarknessVeil=null;disposeTree(root);root.removeFromParent();
  });
  instance.updateDarknessVeil();
};

function stDarkVeilCaster(root,caster,wand){
  const ease=stDarkEase,release=.70,plant=.91,pullAt=plant+.71,pullClear=DARK_VEIL_PULL_CLEAR,pullDone=pullClear+.51;
  const hand=new THREE.Vector3(),wandAim=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  const rightDown=new THREE.Vector3(0,-1,0),armAim=new THREE.Vector3(),parentRotation=new THREE.Quaternion();
  const wandRest=new THREE.Vector3(.15,-.94,.21),wandRaised=new THREE.Vector3(-.45,.88,-.17);
  const wandStrike=new THREE.Vector3(-.25,-.88,.42);
  const wandReach=new THREE.Vector3(-.59,-.22,.78),wandPull=new THREE.Vector3(-.58,.75,.13);
  return t=>{
    const raise=ease(.12,.56,t),coil=ease(.32,release,t);
    const whip=clamp((t-release)/(plant-release),0,1);
    const strike=whip**1.55,unwind=ease(plant+.13,plant+.59,t);
    const reach=raise*(1-strike),press=strike*(1-unwind);
    const impact=ease(plant-.03,plant,t)*(1-ease(plant,plant+.14,t));
    const lift=ease(pullAt+.025,pullClear-.012,t);
    const brace=ease(pullAt-.17,pullAt+.015,t)*(1-lift);
    const tug=lift*(1-ease(pullClear+.055,pullDone-.045,t));
    if(wand)caster.g.position.set(.78+.11*reach-.10*brace+.08*tug,0,-1.18-.12*reach+.16*press+.12*brace-.19*tug);
    if(wand)caster.g.rotation.y=-.59-.63*coil*(1-strike)+.16*press-.11*brace+.19*tug;
    stDarkPose(caster,{back:-.22*reach+.43*press+.31*brace-.35*tug,roll:.18*reach-.19*press-.08*brace+.17*tug,
      drop:.04*reach+.27*press+.045*impact+.16*brace+.028*tug,arms:0,step:-.16*reach+.34*press+.19*brace-.22*tug});
    caster.b.rotation.y=-.24*reach+.14*press-.17*brace+.21*tug;
    caster.armL.rotation.set(.42*reach+.38*press+.32*brace+.44*tug,0,.47*reach+.54*press+.28*brace+.66*tug);
    caster.g.updateMatrixWorld(true);
    // Aim through the raised hand, then carry the wand through the same downward swing.
    wandAim.copy(wandRest).lerp(wandRaised,raise).lerp(wandStrike,strike).lerp(wandRest,unwind)
      .lerp(wandReach,brace).lerp(wandPull,tug).normalize();
    armAim.copy(wandAim);
    armAim.y+=.08*press;armAim.z+=.25*press;
    armAim.transformDirection(root.matrixWorld)
      .applyQuaternion(caster.armR.parent.getWorldQuaternion(parentRotation).invert()).normalize();
    caster.armR.quaternion.setFromUnitVectors(rightDown,armAim);
    if(caster.rig)rigSync(caster,0);
    caster.g.updateMatrixWorld(true);
    if(!wand)return;
    const grip=caster.fileModel?.getObjectByName('hand_R');
    if(grip)grip.getWorldPosition(hand);else caster.armR.localToWorld(hand.set(0,-.62,0));
    root.worldToLocal(hand);
    const groundLimit=-clamp((hand.y-.045)/.89,0,1);
    if(wandAim.y<groundLimit){
      const horizontal=Math.sqrt(1-groundLimit*groundLimit)/Math.hypot(wandAim.x,wandAim.z);
      wandAim.set(wandAim.x*horizontal,groundLimit,wandAim.z*horizontal);
    }
    wand.position.copy(hand).addScaledVector(wandAim,.42);
    wand.quaternion.setFromUnitVectors(up,wandAim);

  };
}
