// Staging for darkness/ult_preview + ult_pose_preview: caster pose, wand, idle scythe, targets + marks.
// The jaw, tail, smoke and shards are normal fx layers (assets/src/darkness_ult_gen.mjs).
const ST_ULT_HALF=40*Math.PI/180,ST_ULT_RANGE=30;
const ST_ULT_REL=1.0,ST_ULT_TRAVEL=.80,ST_ULT_BITE=ST_ULT_REL+1.02;
const stUltRim=t=>{const x=clamp((t-ST_ULT_REL)/ST_ULT_TRAVEL,0,1);return 1.67+1+29*(1-(1-x)**4);};   // same curve as the fx

const _ultV1=new THREE.Vector3(),_ultV2=new THREE.Vector3(),_ultV3=new THREE.Vector3(),_ultV4=new THREE.Vector3(),_ultV5=new THREE.Vector3();
const _ultQ=new THREE.Quaternion(),_ultQ2=new THREE.Quaternion(),_ultDown=new THREE.Vector3(0,-1,0);

FXCODE.studio_darkness_ult=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  anchor.inner.visible=false;
  const ease=stDarkEase;
  const root=new THREE.Group();root.name='Darkness ult stage';anchor.obj.add(root);
  const look={...getLook(NET.myId),ws:-1,wn:0};
  const caster=stDarkShiftStudent(root,look,'Ult caster',lookTint(look));
  const wand=new THREE.Group();wand.name='Ult wand';caster.armR.add(wand);
  const wood=new THREE.Mesh(new THREE.CylinderGeometry(.019,.031,.96,8),new THREE.MeshStandardMaterial({color:0x251c27,roughness:.55}));
  wood.position.y=-1.04;wand.add(wood);
  const ferrule=new THREE.Mesh(new THREE.CylinderGeometry(.033,.027,.21,8),new THREE.MeshStandardMaterial({color:0x5b5354,roughness:.3,metalness:.38}));
  ferrule.position.y=-.69;wand.add(ferrule);

  // Four targets inside the 80° cone (one flying), one outside.
  const spots=args.noTargets?[]:[[-2.5,8,0],[6,14,0],[-11,21,0],[5,27,3.5],[15,11,0]];
  const targets=spots.map(([x,z,y],i)=>{
    const tl={...look,h:i%3,cl:(i+1)%4,hs:i+1};
    const actor=stDarkShiftStudent(root,tl,'Ult target '+(i+1),lookTint(tl));
    actor.g.position.set(x,y,z);actor.g.rotation.y=Math.atan2(-x,-z);
    const dist=Math.hypot(x,z),inside=Math.abs(Math.atan2(x,z))<=ST_ULT_HALF&&dist<=ST_ULT_RANGE;
    let hit=ST_ULT_BITE;
    for(let t=ST_ULT_REL;t<ST_ULT_BITE;t+=.004)if(stUltRim(t)>=z){hit=t;break;}
    return {actor,inside,hit,mark:inside?stDarkTargetMark(actor.g):null};
  });

  // The scythe just floats beside the caster (user 2026-11-20).
  const scythe=stCreateScythePreview(root,{wrap:'C',manual:true,scale:1.4});
  scythe.pivot.name='Ult idle scythe';
  if(args.noScythe)scythe.pivot.visible=false;

  instance.ultWandTip=new THREE.Vector3();instance.ultCaster=caster;
  let shins=null;
  const hidden=new Map();   // staged caster replaces the studio player
  const hide=o=>{if(!o||hidden.has(o))return;hidden.set(o,{mask:o.layers.mask,castShadow:o.castShadow});o.layers.disableAll();o.castShadow=false;};
  function update(){
    const t=instance.t;
    const avatar=PM3.get(NET.myId);avatar?.g.traverse(hide);hide(avatar?.cloth?.mo);hide(avatar?.cloth?.mi);
    // Pose A (user 2026-11-20): right shoulder toward the target, front leg braced, back leg bent,
    // wand straight forward, left hand on the right wrist. On release: wand kicks up, body slides back.
    const P=Object.assign({turn:.85,lean:.14,spreadF:.95,spreadB:.75,knee:.7,drop:.2,kick:.75,slide:.55},globalThis.ULT_TUNE||{});
    const gather=ease(.04,.30,t),build=ease(.30,ST_ULT_REL,t);
    const kick=ease(ST_ULT_REL,ST_ULT_REL+.05,t),settle=ease(ST_ULT_REL+.12,1.55,t),relax=ease(1.75,2.25,t);
    const recoil=kick*(1-.65*settle)*(1-relax);
    const slide=P.slide*ease(ST_ULT_REL,ST_ULT_REL+.13,t);
    const stance=gather*(1-relax*.85);
    caster.g.position.set(0,0,-slide);
    caster.g.rotation.y=P.turn*stance;
    caster.b.position.y=-(P.drop+.04*build+.05*recoil)*stance;
    caster.b.rotation.set(0,0,(P.lean+.05*build)*stance-.30*recoil);
    caster.g.updateMatrixWorld(true);
    // legs: front foot toward the target, back foot away (directions in body space)
    const toTarget=_ultV1.set(0,0,1).applyQuaternion(_ultQ.copy(caster.b.getWorldQuaternion(_ultQ)).invert());
    toTarget.y=0;toTarget.normalize();
    const legDir=(spread,out)=>out.set(0,-1,0).addScaledVector(toTarget,spread).normalize();
    caster.legs[0].quaternion.setFromUnitVectors(_ultDown,legDir(P.spreadF*stance,_ultV2));
    caster.legs[1].quaternion.setFromUnitVectors(_ultDown,legDir(-(P.spreadB+.12*recoil)*stance,_ultV2));
    // right arm: wand along the aim, kicked upward on release; tiny tremble while charging
    const pitch=P.kick*recoil+.03*build*Math.sin(t*61)*(1-kick);
    const aim=_ultV3.set(0,Math.sin(pitch),Math.cos(pitch));
    const armR0=_ultQ2.setFromUnitVectors(_ultDown,aim.applyQuaternion(_ultQ.copy(caster.armR.parent.getWorldQuaternion(_ultQ)).invert()));
    caster.armR.quaternion.identity().slerp(armR0,gather*(1-relax));
    caster.g.updateMatrixWorld(true);
    // left arm: reach for the right wrist, lets go on release
    const wrist=caster.armR.localToWorld(_ultV4.set(0,-.42,0));
    const shoulder=caster.armL.getWorldPosition(_ultV5);
    const reach=wrist.sub(shoulder).applyQuaternion(_ultQ.copy(caster.armL.parent.getWorldQuaternion(_ultQ)).invert()).normalize();
    caster.armL.quaternion.identity().slerp(_ultQ2.setFromUnitVectors(_ultDown,reach),gather*(1-.75*kick)*(1-relax));
    if(caster.rig){for(const k of caster.rig)k.w=1;rigSync(caster,0);}
    if(!shins&&caster.fileModel)shins=['shin_R','shin_L'].map(n=>{const bone=caster.fileModel.getObjectByName(n);return bone?{bone,rest:bone.quaternion.clone()}:null;});
    shins?.forEach((j,i)=>{if(!j)return;j.bone.quaternion.copy(j.rest);j.bone.rotateX((i?P.knee+.25*recoil:.06)*stance);});
    caster.g.updateMatrixWorld(true);
    instance.ultWandTip.set(0,-1.52,0);caster.armR.localToWorld(instance.ultWandTip);root.worldToLocal(instance.ultWandTip);

    scythe.pivot.rotation.set(.12*Math.sin(t*1.3),t*.9,.18+.06*Math.sin(t*.8));
    scythe.pivot.position.set(-1.5,.05+.08*Math.sin(t*1.7),-.3-slide);
    if(!args.noScythe)scythe.update(t);

    for(const tg of targets){
      const age=t-tg.hit,impact=tg.inside?ease(0,.06,age)*(1-ease(.12,.5,age)):0;
      stDarkPose(tg.actor,{back:-.42*impact,roll:.18*impact,drop:.14*impact,arms:.5*impact,step:.24*impact});
      tg.mark?.(t-ST_ULT_BITE,12);
    }
  }
  instance.updateDarknessUlt=update;
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{instance.updateDarknessUlt=null;for(const [o,{mask,castShadow}] of hidden){o.layers.mask=mask;o.castShadow=castShadow;}disposeTree(root);root.removeFromParent();});
  update();
};
