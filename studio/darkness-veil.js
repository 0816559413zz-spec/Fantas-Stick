const ST_DARKNESS_VEIL='darkness/veil_preview';

function stDarkVeilGround(root,radius){
  const material=new THREE.ShaderMaterial({
    uniforms:{age:{value:0},reach:{value:0},opacity:{value:0}},
    transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`varying vec2 groundUV;
      void main(){groundUV=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float age,reach,opacity;
      varying vec2 groundUV;
      void main(){
        float r=length(groundUV),a=atan(groundUV.y,groundUV.x);
        float rim=reach*(.95+.019*sin(7.*a-age*2.1)+.013*cos(13.*a+age*1.8));
        float n=r/max(reach,.02);
        float broken=.4+.6*smoothstep(-.3,.65,sin(a*9.+r*18.-age*3.)+.48*sin(a*17.+age));
        float border=(1.-smoothstep(.02,.10,abs(r-rim)))*broken;
        float inside=1.-smoothstep(rim-.085,rim,r);
        float bands=.5+.5*sin(n*29.+a*3.-age*5.+sin(a*5.+age*1.2)*1.5);
        float ink=inside*smoothstep(.24,.76,n)*smoothstep(.41,.96,bands)*broken;
        float ripple=(1.-smoothstep(.01,.06,abs(r-reach*.84)))*(1.-smoothstep(.14,.43,age));
        vec3 col=mix(vec3(.009,.008,.013),vec3(.074,.066,.102),.56*ink+.22*ripple);
        gl_FragColor=vec4(col,opacity*max(.37*inside,max(.75*border,.55*ripple)));
        #include <colorspace_fragment>
      }`
  });
  const pool=new THREE.Mesh(new THREE.PlaneGeometry(radius*2.12,radius*2.12),material);
  pool.name='Darkness veil ground';pool.position.y=.035;pool.rotation.x=-Math.PI/2;pool.renderOrder=2;
  root.add(pool);
  return (age,reach,opacity)=>{
    pool.visible=opacity>.005;
    material.uniforms.age.value=age;
    material.uniforms.reach.value=reach;
    material.uniforms.opacity.value=opacity;
  };
}

FXCODE.studio_darkness_veil=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  anchor.inner.visible=false;
  const root=new THREE.Group();root.name='Darkness veil preview';anchor.obj.add(root);
  const ease=stDarkEase,release=.70,plant=.91,end=3.03,radius=3.1;
  const look={...getLook(NET.myId),ws:-1,wn:0};
  const caster=stDarkShiftStudent(root,look,'Veil caster',lookTint(look));
  caster.g.position.set(.78,0,-1.18);caster.g.rotation.y=-.59;
  const allies=[[-1.57,.84],[1.72,1.42],[2.3,3.52]].map(([x,z],i)=>{
    const appearance={...look,h:i+1,hs:i+1,cl:i+1};
    const actor=stDarkShiftStudent(root,appearance,'Veil ally '+(i+1),lookTint(appearance));
    actor.g.position.set(x,0,z);
    return {actor,tint:stDarkBodyTint(actor,true),distance:Math.hypot(x,z)};
  });
  allies.push({actor:caster,tint:stDarkBodyTint(caster,true),distance:Math.hypot(.78,1.18)});

  const wandMat=new THREE.MeshStandardMaterial({color:0x282232,roughness:.55,transparent:true});
  const wand=new THREE.Mesh(new THREE.CylinderGeometry(.016,.031,.94,8),wandMat);
  wand.name='Veil wand';root.add(wand);
  const hand=new THREE.Vector3(),wandAim=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  const rightDown=new THREE.Vector3(0,-1,0),armAim=new THREE.Vector3(),parentRotation=new THREE.Quaternion();
  const wandRest=new THREE.Vector3(.15,-.94,.21),wandRaised=new THREE.Vector3(-.45,.88,-.17);
  const wandStrike=new THREE.Vector3(-.25,-.88,.42);
  const scale=1.38,tip=new THREE.Vector3(1.0553,1.6965,0).multiplyScalar(scale);
  const scythe=stCreateScythePreview(root,{wrap:'C',manual:true,scale});
  scythe.pivot.name='Veil scythe';
  const idle=new THREE.Quaternion().setFromEuler(new THREE.Euler(.05,-.39,-.06));
  const lean=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-2.16);
  const pointed=new THREE.Quaternion().setFromAxisAngle(up,-.65).multiply(lean);
  const drawnBack=new THREE.Quaternion().setFromEuler(new THREE.Euler(.21,-.43,-1.58));
  const idleTip=tip.clone().applyQuaternion(idle).add(new THREE.Vector3(-1.35,.055,-1.6));
  const tipAt=new THREE.Vector3(),plantedAt=new THREE.Vector3(0,.042,0);
  const drawPoint=new THREE.Vector3(-2.05,2.96,-2.34);
  const drawBack=new THREE.QuadraticBezierCurve3(idleTip,new THREE.Vector3(-1.70,2.65,-2.22),drawPoint);
  const drop=new THREE.CubicBezierCurve3(drawPoint,new THREE.Vector3(-1.87,3.12,-1.61),
    new THREE.Vector3(-.25,.85,-.22),plantedAt);
  const exit=new THREE.QuadraticBezierCurve3(plantedAt,new THREE.Vector3(-.76,1.85,-.40),idleTip);

  const showGround=stDarkVeilGround(root,radius);
  const splash=stDarkMatter(root,'Veil ground flecks',[
    {at:plant,span:.10,count:44,spread:1.6,lift:.65,height:.10,back:0},
    {at:plant+.16,span:.20,count:28,spread:2.35,lift:.34,height:.08,back:0}
  ],(_t,out)=>out.set(0,0,0),.86);

  instance.updateDarknessVeil=()=>{
    const t=instance.t,age=t-plant;
    const raise=ease(.12,.56,t),coil=ease(.32,release,t);
    const whip=clamp((t-release)/(plant-release),0,1);
    const strike=whip**1.55,unwind=ease(plant+.13,plant+.59,t);
    const reach=raise*(1-strike),press=strike*(1-unwind);
    const impact=ease(plant-.03,plant,t)*(1-ease(plant,plant+.14,t));
    caster.g.position.set(.78+.11*reach,0,-1.18-.12*reach+.16*press);
    caster.g.rotation.y=-.59-.63*coil*(1-strike)+.16*press;
    stDarkPose(caster,{back:-.22*reach+.43*press,roll:.18*reach-.19*press,
      drop:.04*reach+.27*press+.045*impact,arms:0,step:-.16*reach+.34*press});
    caster.b.rotation.y=-.24*reach+.14*press;
    caster.armL.rotation.set(.42*reach+.38*press,0,.47*reach+.54*press);
    caster.g.updateMatrixWorld(true);
    // Aim through the raised hand, then carry the wand through the same downward swing.
    wandAim.copy(wandRest).lerp(wandRaised,raise).lerp(wandStrike,strike).lerp(wandRest,unwind).normalize();
    armAim.copy(wandAim);
    armAim.y+=.08*press;armAim.z+=.25*press;
    armAim.transformDirection(root.matrixWorld)
      .applyQuaternion(caster.armR.parent.getWorldQuaternion(parentRotation).invert()).normalize();
    caster.armR.quaternion.setFromUnitVectors(rightDown,armAim);
    if(caster.rig)rigSync(caster,0);
    caster.g.updateMatrixWorld(true);
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

    const draw=ease(.19,.67,t),fall=clamp((t-.76)/(plant-.76),0,1)**1.7,withdraw=ease(end,end+.65,t);
    if(t<.76)drawBack.getPoint(draw,tipAt);
    else if(t<end)drop.getPoint(fall,tipAt);
    else exit.getPoint(withdraw,tipAt);
    scythe.pivot.quaternion.copy(idle).slerp(drawnBack,draw).slerp(pointed,fall).slerp(idle,withdraw);
    scythe.pivot.position.copy(tipAt).sub(armAim.copy(tip).applyQuaternion(scythe.pivot.quaternion));
    scythe.update(t);

    const spread=ease(0,.37,age),clear=ease(end,end+.36,t);
    showGround(age,spread,ease(0,.10,age)*(1-clear));
    splash(t);
    for(const {actor,tint,distance} of allies){
      const reachAt=plant+.32*distance/radius;
      const cover=distance<radius?ease(reachAt,reachAt+.31,t)*(1-clear):0;
      const ink=distance<radius?ease(reachAt-.08,reachAt+.095,t)*(1-clear):0;
      tint(ink,1-cover);
      actor.g.visible=cover<.995;
      actor.ring.material.opacity=.7*(1-cover);
      if(actor===caster){wandMat.opacity=1-cover;wand.visible=actor.g.visible;}
    }
  };
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{
    instance.updateDarknessVeil=null;disposeTree(root);root.removeFromParent();
  });
  instance.updateDarknessVeil();
};
