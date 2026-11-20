// Staging only for darkness/ult_preview: caster pose, wand, idle scythe, targets + marks.
// The jaw, tail, smoke and shards are normal fx layers (assets/src/darkness_ult_gen.mjs).
const ST_ULT_HALF=40*Math.PI/180,ST_ULT_RANGE=30;
const ST_ULT_REL=1.0,ST_ULT_TRAVEL=.80,ST_ULT_BITE=ST_ULT_REL+1.02;
const stUltRim=t=>{const x=clamp((t-ST_ULT_REL)/ST_ULT_TRAVEL,0,1);return 1.67+1+29*(1-(1-x)**4);};   // same curve as the fx

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
  const spots=[[-2.5,8,0],[6,14,0],[-11,21,0],[5,27,3.5],[15,11,0]];
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

  instance.ultWandTip=new THREE.Vector3();
  const hidden=new Map();   // staged caster replaces the studio player
  const hide=o=>{if(!o||hidden.has(o))return;hidden.set(o,{mask:o.layers.mask,castShadow:o.castShadow});o.layers.disableAll();o.castShadow=false;};
  function update(){
    const t=instance.t;
    const avatar=PM3.get(NET.myId);avatar?.g.traverse(hide);hide(avatar?.cloth?.mo);hide(avatar?.cloth?.mi);
    const gather=ease(.05,.35,t),recoil=ease(ST_ULT_REL,ST_ULT_REL+.06,t)*(1-ease(1.3,1.95,t));
    caster.g.position.set(0,0,-.55*ease(ST_ULT_REL,ST_ULT_REL+.12,t));
    stDarkPose(caster,{back:.13*gather-.40*recoil,roll:-.06*gather,drop:.10*gather+.06*recoil,arms:0,step:.36*gather});
    caster.armR.rotation.set(-1.47*gather-.85*recoil,0,-.12*gather);
    caster.armL.rotation.set(-1.22*gather*(1-.7*recoil),0,.62*gather*(1-.7*recoil));
    if(caster.rig)rigSync(caster,0);
    caster.g.updateMatrixWorld(true);
    instance.ultWandTip.set(0,-1.52,0);caster.armR.localToWorld(instance.ultWandTip);root.worldToLocal(instance.ultWandTip);

    scythe.pivot.rotation.set(.12*Math.sin(t*1.3),t*.9,.18+.06*Math.sin(t*.8));
    scythe.pivot.position.set(-1.5,.05+.08*Math.sin(t*1.7),-.3-.55*ease(ST_ULT_REL,ST_ULT_REL+.12,t));
    scythe.update(t);

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
