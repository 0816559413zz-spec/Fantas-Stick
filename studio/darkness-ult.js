// Staging for darkness/ult_preview + ult_pose_preview: caster pose, wand, idle scythe, targets + marks.
// The drop head, tail, teeth, smoke and shards are fx layers (assets/src/darkness_ult_ab_gen.mjs).
const ST_ULT_HALF=40*Math.PI/180,ST_ULT_RANGE=40;
const ST_ULT_REL=1.0,ST_ULT_TRAVEL=1.05,ST_ULT_SNAP=.025;
const stUltRim=(t,travel)=>{const x=clamp((t-ST_ULT_REL)/travel,0,1);return 3.05+(40-.8-3.05)*(1-(1-x)**3)+.8*clamp((t-ST_ULT_REL-travel)/ST_ULT_SNAP,0,1);};   // head front, same curve as the A+B fx

const _ultV1=new THREE.Vector3(),_ultV2=new THREE.Vector3(),_ultV3=new THREE.Vector3(),_ultV4=new THREE.Vector3(),_ultV5=new THREE.Vector3(),_ultV6=new THREE.Vector3(),_ultV7=new THREE.Vector3(),_ultV8=new THREE.Vector3(),_ultV9=new THREE.Vector3(),_ultV10=new THREE.Vector3(),_ultV11=new THREE.Vector3(),_ultV12=new THREE.Vector3();
const _ultQ=new THREE.Quaternion(),_ultQ2=new THREE.Quaternion(),_ultQ3=new THREE.Quaternion(),_ultQ4=new THREE.Quaternion(),_ultDown=new THREE.Vector3(0,-1,0);
const stUltWalkKeys=new Set();
for(const event of ['keydown','keyup'])addEventListener(event,e=>{
  if(event==='keyup')stUltWalkKeys.delete(e.code);
  if(typeof ST==='undefined'||ST.name!=='darkness/ult_v3'||SQ.get('walk')!=='1'||!['KeyW','KeyA','KeyS','KeyD'].includes(e.code)||
    ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.target.isContentEditable)return;
  if(event==='keydown')stUltWalkKeys.add(e.code);
  e.preventDefault();e.stopImmediatePropagation();
},true);
addEventListener('blur',()=>stUltWalkKeys.clear());

FXCODE.studio_darkness_ult=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  anchor.inner.visible=false;
  const ease=stDarkEase,thrustAt=args.thrustAt??ST_ULT_REL;
  const travel=args.travel??ST_ULT_TRAVEL,biteAt=ST_ULT_REL+travel+ST_ULT_SNAP;
  const live=instance.P.ev?.darkness===true;
  const walkMode=live?null:SQ.get('walk'),walkAt=thrustAt+.06+(args.walkCancelAfter??Infinity);
  let walkX=0,walkZ=0,walkYaw=0,walkDistance=0,walkStarted=Infinity,lastTime=0;
  const root=new THREE.Group();root.name='Darkness ult stage';anchor.obj.add(root);
  const look={...getLook(NET.myId),ws:-1,wn:0};
  const caster=live?PM3.get(instance.P.ev.id):stDarkShiftStudent(root,look,'Ult caster',lookTint(look));
  if(!caster)return;
  const wand=new THREE.Group();wand.name='Ult wand';if(!live)caster.armR.add(wand);else root.add(wand);
  wand.visible=!live;
  const wood=new THREE.Mesh(new THREE.CylinderGeometry(.019,.031,.96,8),new THREE.MeshStandardMaterial({color:0x251c27,roughness:.55}));
  wood.position.y=-1.04;wand.add(wood);
  const ferrule=new THREE.Mesh(new THREE.CylinderGeometry(.033,.027,.21,8),new THREE.MeshStandardMaterial({color:0x5b5354,roughness:.3,metalness:.38}));
  ferrule.position.y=-.69;wand.add(ferrule);

  // Four targets inside the 80° cone (one flying), one outside.
  const spots=live||args.noTargets?[]:[[-2.5,9,0],[7,18,0],[-13,27,0],[6,36,3.5],[18,13,0]];
  const targets=spots.map(([x,z,y],i)=>{
    const tl={...look,h:i%3,cl:(i+1)%4,hs:i+1};
    const actor=stDarkShiftStudent(root,tl,'Ult target '+(i+1),lookTint(tl));
    actor.g.position.set(x,y,z);actor.g.rotation.y=Math.atan2(-x,-z);
    const dist=Math.hypot(x,z),inside=Math.abs(Math.atan2(x,z))<=ST_ULT_HALF&&dist<=ST_ULT_RANGE;
    let hit=biteAt;
    for(let t=ST_ULT_REL;t<biteAt;t+=.004)if(stUltRim(t,travel)>=z){hit=t;break;}
    const markAt=Math.max(biteAt,hit+.24);
    return {actor,inside,hit,markAt,mark:inside?stDarkTargetMark(actor.g):null,
      tint:inside?stDarkBodyTint(actor):null};
  });

  // The scythe just floats beside the caster (user 2026-11-20).
  const scythe=live?null:stCreateScythePreview(root,{wrap:'C',manual:true,scale:1.4});
  if(scythe){scythe.pivot.name='Ult idle scythe';if(args.noScythe)scythe.pivot.visible=false;}

  instance.ultWandTip=new THREE.Vector3();instance.ultCaster=caster;
  let shins=null,headBone=null,forearm=null,elbowL=0;
  const walkLegs=[new THREE.Quaternion(),new THREE.Quaternion()];
  let chargeWalk=0;
  const hidden=new Map();   // staged caster replaces the studio player
  const hide=o=>{if(!o||hidden.has(o))return;hidden.set(o,{mask:o.layers.mask,castShadow:o.castShadow});o.layers.disableAll();o.castShadow=false;};
  function update(){
    const t=instance.t;
    const frame=clamp(t-lastTime,0,.05);
    if(t<lastTime){walkX=walkZ=walkYaw=walkDistance=0;walkStarted=Infinity;}
    const dt=clamp(t-Math.max(lastTime,walkAt),0,.05);
    lastTime=t;
    let walking=false;
    if(t>=walkAt&&walkMode==='demo'){
      walkStarted=walkAt;walkDistance=(t-walkAt)*2.2;
      walkZ=-walkDistance;walkYaw=Math.PI;walking=true;
    }else if(t>=walkAt&&walkMode==='1'){
      const x=Number(stUltWalkKeys.has('KeyA'))-Number(stUltWalkKeys.has('KeyD'));
      const z=Number(stUltWalkKeys.has('KeyW'))-Number(stUltWalkKeys.has('KeyS'));
      const magnitude=Math.hypot(x,z);
      if(magnitude){
        walkStarted=Math.min(walkStarted,t);
        walkYaw=Math.atan2(x,z);
        walkX+=x*dt*2.2/magnitude;walkZ+=z*dt*2.2/magnitude;
        walkDistance+=dt*2.2;walking=true;
      }
    }
    const walkBlend=t>=walkStarted?ease(walkStarted,walkStarted+.13,t):0;
    const stride=walking?Math.sin(walkDistance*5.7)*walkBlend:0;
    if(!live){const avatar=PM3.get(NET.myId);avatar?.g.traverse(hide);hide(avatar?.cloth?.mo);hide(avatar?.cloth?.mi);}
    if(live&&t>=walkAt&&caster.darkMoving)walkStarted=Math.min(walkStarted,t);
    if(live&&(caster.darkDown||t>=walkStarted+.13||t>=2.45))return;
    // Pose (user 2026-11-20, ref: kamehameha figure): charge side-on, body turned toward the charging (left) hand so the right shoulder
    // faces the target, deep crouch, LEFT hand charging at the left hip, head bowed looking at it. Then the
    // hand pulls further back (wind-up) and thrusts straight at the target: body bends forward hard, right
    // leg steps out bent, left leg braced straight behind. The jaw bites by itself.
    const P=Object.assign({turnC:1.30,turnW:1.40,turnR:-.35,dropC:.31,dropR:.33,leanC:.22,leanR:.80,
      frontC:.80,frontR:1.9,kneeFC:.95,kneeFR:1.4,backC:.75,backR:1.15,kneeBC:.75,kneeBR:.05,step:.40,
      windAt:.55,elbowC:1.75,elbowW:1.95,elbowAxis:'x',elbowSign:-1},args.tune||{},globalThis.ULT_TUNE||{});
    const L=(c,r,k)=>c+(r-c)*k;
    const gather=ease(.04,.28,t),build=ease(.28,thrustAt,t),wind=ease(P.windAt,thrustAt-.02,t);
    const lunge=ease(thrustAt,thrustAt+.06,t),relax=ease(1.9,2.45,t);
    const impact=ease(thrustAt+.03,thrustAt+.07,t)*(1-ease(thrustAt+.08,thrustAt+.30,t));   // short overshoot on release
    const s=gather*(1-relax)*(1-walkBlend),r=lunge;
    if(live){
      const walkingNow=t<thrustAt&&caster.darkMoving;
      chargeWalk=lerp(chargeWalk,walkingNow?1:0,1-Math.exp(-frame*22));
      for(let i=0;i<2;i++)walkLegs[i].copy(caster.legs[i].quaternion);
    }
    const step=P.step*lunge+.08*impact;
    const rootQ=root.getWorldQuaternion(_ultQ3);   // effect frame: +z = aim
    const aimW=_ultV1.set(0,0,1).applyQuaternion(rootQ);
    const turn=L(L(P.turnC,P.turnW,wind),P.turnR,r)*s;
    if(!live){caster.g.position.set(walkX,0,step+walkZ);caster.g.rotation.y=turn+walkYaw*walkBlend;}
    caster.g.updateMatrixWorld(true);
    caster.b.position.y=-(L(P.dropC+.04*wind,P.dropR,r)+.05*impact)*s;
    const gInv=_ultQ4.copy(caster.g.getWorldQuaternion(_ultQ4)).invert();
    const leanAxis=_ultV2.set(0,1,0).cross(aimW).normalize().applyQuaternion(gInv);
    caster.b.quaternion.setFromAxisAngle(leanAxis,(L(P.leanC,P.leanR,r)+.15*impact)*s);
    if(live)caster.b.rotateY(turn);
    // bend at the hips, not the feet: keep the hip point where the crouch puts it
    const hipY=.86,bent=_ultV8.set(0,hipY,0).applyQuaternion(caster.b.quaternion);
    caster.b.position.set(-bent.x,caster.b.position.y+hipY-bent.y,-bent.z);
    caster.g.updateMatrixWorld(true);
    const bodyInv=_ultQ4.copy(caster.b.getWorldQuaternion(_ultQ4)).invert();
    const worldDown=_ultV6.set(0,-1,0).applyQuaternion(bodyInv);
    const toT=_ultV3.copy(aimW).applyQuaternion(bodyInv);
    toT.addScaledVector(worldDown,-toT.dot(worldDown)).normalize();
    const legTo=(leg,spread)=>leg.quaternion.setFromUnitVectors(_ultDown,_ultV4.copy(worldDown).addScaledVector(toT,spread).normalize());
    legTo(caster.legs[0],L(P.frontC,P.frontR,r)*s);    // right leg toward the target (bent)
    legTo(caster.legs[1],-L(P.backC,P.backR,r)*s);     // left leg behind (braced straight on release)
    if(live&&chargeWalk>.001)for(let i=0;i<2;i++)caster.legs[i].quaternion.slerp(walkLegs[i],chargeWalk);
    caster.legs[0].rotateX(.57*stride);caster.legs[1].rotateX(-.57*stride);
    const pointArm=(arm,dirW,k)=>{
      const local=dirW.applyQuaternion(_ultQ.copy(arm.parent.getWorldQuaternion(_ultQ)).invert()).normalize();
      arm.quaternion.identity().slerp(_ultQ2.setFromUnitVectors(_ultDown,local),k);
    };
    // left hand: elbow bent and pointing back, hand in front of the belly; small slow pull-back; then thrust
    const bodyQ=caster.b.getWorldQuaternion(_ultQ4);
    const upperC=_ultV9.set(-.02,-1,-.40).lerp(_ultV8.set(-.02,-1,-.52),wind).applyQuaternion(bodyQ).normalize();
    upperC.addScaledVector(_ultV8.set(.5,.7,.3).applyQuaternion(rootQ),.02*build*Math.sin(t*57)*(1-r));   // tremble
    const leftR=_ultV11.set(0,-.12,1).applyQuaternion(rootQ).normalize();
    pointArm(caster.armL,upperC.lerp(leftR,r),s);
    elbowL=L(L(P.elbowC,P.elbowW,wind),0,r)*s;
    // right (wand) hand: hangs at the right side while charging, swings back for balance on release
    const rightC=_ultV10.set(-.35,-1,.08).applyQuaternion(bodyQ).normalize();
    const rightR=_ultV12.set(-.30,-.45,-1).applyQuaternion(rootQ).normalize();
    pointArm(caster.armR,rightC.lerp(rightR,r),s);
    caster.armR.rotateX(-.34*stride);caster.armL.rotateX(.34*stride);
    if(caster.rig){for(const k of caster.rig)k.w=1;rigSync(caster,0);}
    if(!shins&&caster.fileModel)shins=['shin_R','shin_L'].map(n=>{const bone=caster.fileModel.getObjectByName(n);return bone?{bone,rest:bone.quaternion.clone()}:null;});
    shins?.forEach((j,i)=>{if(!j)return;j.bone.quaternion.copy(j.rest);j.bone.rotateX((i?L(P.kneeBC,P.kneeBR,r):L(P.kneeFC,P.kneeFR,r))*s);});
    if(!forearm&&caster.fileModel){const fb=caster.fileModel.getObjectByName('forearm_L');if(fb)forearm={bone:fb,rest:fb.quaternion.clone()};}
    if(forearm){forearm.bone.quaternion.copy(forearm.rest);const ax=P.elbowAxis;forearm.bone['rotate'+ax.toUpperCase()](P.elbowSign*elbowL);}
    // head: bowed toward the charging hand, then up at the target on release
    if(!headBone&&caster.fileModel){const hb=caster.fileModel.getObjectByName('head');if(hb)headBone={bone:hb,rest:hb.quaternion.clone()};}
    if(headBone){
      const hb=headBone.bone;hb.quaternion.copy(headBone.rest);hb.updateWorldMatrix(true,false);
      const hp=hb.getWorldPosition(_ultV2);
      const handW=(caster.fileModel?.getObjectByName('hand_L')?.getWorldPosition(_ultV4))||caster.armL.localToWorld(_ultV4.set(0,-.5,0));
      const want=_ultV5.subVectors(handW,hp).normalize().lerp(_ultV6.copy(aimW).setY(-.15).normalize(),r).normalize();
      const fwd=_ultV7.set(0,0,1).applyQuaternion(hb.getWorldQuaternion(_ultQ));
      const turnQ=_ultQ2.identity().slerp(_ultQ4.setFromUnitVectors(fwd,want),.8*s);
      const pq=hb.parent.getWorldQuaternion(_ultQ);
      hb.quaternion.premultiply(_ultQ4.copy(pq).invert().multiply(turnQ).multiply(pq));
    }
    caster.g.updateMatrixWorld(true);
    instance.ultWandTip.set(0,-1.52,0);caster.armR.localToWorld(instance.ultWandTip);root.worldToLocal(instance.ultWandTip);

    if(scythe){scythe.pivot.rotation.set(.12*Math.sin(t*1.3),t*.9,.18+.06*Math.sin(t*.8));
    scythe.pivot.position.set(-1.5+walkX,.05+.08*Math.sin(t*1.7),-.3+step+walkZ);
    if(!args.noScythe)scythe.update(t);
    }

    for(const tg of targets){
      const age=t-tg.hit,impact=tg.inside?ease(0,.06,age)*(1-ease(.12,.5,age)):0;
      stDarkPose(tg.actor,{back:-.42*impact,roll:.18*impact,drop:.14*impact,arms:.5*impact,step:.24*impact});
      if(tg.inside){
        const darkenAt=Math.max(tg.hit+.04,tg.markAt-.32);
        const ink=ease(darkenAt,tg.markAt-.11,t)*(1-ease(tg.markAt-.022,tg.markAt+.19,t));
        tg.tint(ink);
        tg.mark(t-tg.markAt,12);
      }
    }
  }
  // Camera (user 2026-11-20): rises and pulls back near the end of the charge, looks down so the whole creature fits, holds through
  // the flight, then returns after the bite. Preview only: hooks the game camera via WD.camHook.
  const prevHook=window.WD?.camHook,camUp=new THREE.Vector3(),camFwd=new THREE.Vector3(),camT0=new THREE.Vector3(),camT1=new THREE.Vector3(),camA=new THREE.Vector3(),camQ=new THREE.Quaternion();
  if(window.WD&&!live&&!args.noCamLift)WD.camHook=c=>{
    prevHook?.(c);
    if(typeof ST!=='undefined'&&ST.cam!=='game')return;   // only the player camera lifts
    const t=instance.t,l=ease(.72,1.0,t)*(1-ease(biteAt+.2,biteAt+.8,t));   // lifts near the end of the charge
    if(l<=0)return;
    root.getWorldPosition(camA);camFwd.set(0,0,1).applyQuaternion(root.getWorldQuaternion(camQ));camFwd.y=0;camFwd.normalize();
    c.getWorldDirection(camT0).multiplyScalar(20).add(c.position);
    c.position.addScaledVector(camUp.set(0,1,0),11*l).addScaledVector(camFwd,-8*l);
    camT1.copy(camA).addScaledVector(camFwd,20).y+=.5;   // looks down a bit more
    c.lookAt(camT0.lerp(camT1,l));
  };
  instance.updateDarknessUlt=update;
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{instance.updateDarknessUlt=null;if(window.WD&&!live&&!args.noCamLift)WD.camHook=prevHook;for(const [o,{mask,castShadow}] of hidden){o.layers.mask=mask;o.castShadow=castShadow;}disposeTree(root);root.removeFromParent();});
  update();
};
