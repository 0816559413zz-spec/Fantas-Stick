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
  const firstHit=.89,secondHit=1.05,wandDown=1.91,cutStart=2.035,land=2.245,slashHit=2.186;
  const groundFade=land+.13,groundGone=groundFade+.23,spawnAt=groundGone+.038;
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
    {t:.935,p:[-2.52,1.26,8.39+extension],q:describePose([-.59,.19,-.78],[-.70,.11,.72])},
    {t:.980,p:[-2.95,1.38,7.78+extension],q:describePose([.32,.25,.93],[-.96,.19,.11])},
    {t:1.018,p:[-1.39,1.64,8.68+extension],q:describePose([.94,.28,.25],[-.37,.15,.90])},
    {t:1.095,p:[2.60,2.12,8.29+extension],q:describePose([.72,.27,-.64],[.62,.40,.68])},
    tipPose(1.225,[1.28,5.40,targetZ+2.50],[-.14,.65,-.74],[.15,.91,.24]),
    tipPose(1.39,[.77,7.82,targetZ+3.64],[-.16,-.23,-.96],[.22,.87,-.46]),
    tipPose(1.70,[.57,8.31,targetZ+4.12],[-.08,.02,-.99],[.17,.98,.05]),
    tipPose(cutStart,[.48,8.12,targetZ+4.62],[-.06,.34,-.94],[.12,.94,.36]),
    tipPose(2.135,[.33,5.97,targetZ+2.78],[-.10,-.63,-.77],[.17,.79,-.56]),
    tipPose(slashHit,[.20,2.25,targetZ+.58],[-.07,-.86,-.50],[.17,.52,-.86]),
    tipPose(land,[.16,.09,targetZ+.11],[-.04,-.98,-.18],[.17,.15,-.97])
  ];
  const bladeCurve=new THREE.CatmullRomCurve3(keys.map(({p})=>new THREE.Vector3(...p)));
  const offset=new THREE.Vector3(),sample={pos:new THREE.Vector3(),QB:new THREE.Quaternion(),act:0,shaft:false};
  const scythe=stCreateScythePreview(root,{wrap:'C',manual:true,scale,trailPose:bladeAt});
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

  function bladeAt(t){
    const segment=keys.findIndex((_,i)=>i===keys.length-2||t<=keys[i+1].t);
    const a=keys[segment],b=keys[segment+1],u=clamp((t-a.t)/(b.t-a.t),0,1);
    const progress=(segment+u)/(keys.length-1);
    bladeCurve.getPoint(progress,sample.pos);
    sample.pos.y=Math.max(.20,sample.pos.y);
    sample.QB.copy(a.q).slerp(b.q,u);
    const small=ease(.11,.31,t)*(1-ease(1.08,1.32,t));
    sample.size=1-.21*small;
    sample.pos.sub(offset.copy(centerLocal).multiplyScalar(sample.size).applyQuaternion(sample.QB));
    sample.act=ease(cutStart,cutStart+.036,t)*(1-ease(land-.018,land+.026,t));
    return sample;
  }

  const pathPoint=new THREE.Vector3(),returnPoint=new THREE.Vector3(-.26,0,targetZ+1.98);
  function update(){
    const t=instance.t,pose=bladeAt(t);
    scythe.pivot.position.copy(pose.pos);scythe.pivot.quaternion.copy(pose.QB);
    scythe.pivot.scale.setScalar(pose.size);
    scythe.update(t);
    const ghost=ease(.08,.255,t)*(1-ease(1.095,1.33,t));
    const oldOpacity=(1-.50*ghost)*(1-ease(groundFade,groundGone,t));
    fadeBlade(oldOpacity);scythe.pivot.visible=oldOpacity>.003;
    const spawn=ease(spawnAt,spawnAt+.24,t);
    newScythe.pivot.visible=spawn>.003;
    if(newScythe.pivot.visible){
      newScythe.pivot.position.copy(returnPoint).add(offset.set(1.23,.16,-.08));
      newScythe.pivot.quaternion.copy(idle);
      newScythe.update(t);fadeReplacement(spawn);
    }
    const convert=ease(.08,launch,t),travel=ease(launch,arrival,t);
    const orbit=ease(arrival-.01,returnBody,t),angle=Math.PI*(1-orbit);
    pathPoint.set(1.93*Math.sin(angle),.94+.53*Math.sin(Math.PI*orbit),targetZ+1.98*Math.cos(angle));
    orb.position.set(0,.94,lerp(0,targetZ-1.98,travel)).lerp(pathPoint,ease(arrival-.10,arrival+.11,t));
    const appear=1-ease(returnBody-.065,returnBody+.095,t);
    orb.visible=!scytheOnly&&t>=.09&&appear>.02;orb.scale.setScalar(.265*convert*appear);
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
    instance.updateDarknessChase=null;disposeTree(root);root.removeFromParent();
  });
  update();
};
