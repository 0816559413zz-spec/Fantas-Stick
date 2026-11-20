const ST_DARKNESS_MARK_WAVE='darkness/mark_wave_preview';
const ST_DARKNESS_FLOW_MARK='darkness/flow_mark_preview';

function stMarkWaveSheet(parent,name,rows,columns,order){
  const geometry=new THREE.BufferGeometry(),indices=[];
  const positions=new THREE.BufferAttribute(new Float32Array(rows*columns*3),3).setUsage(THREE.DynamicDrawUsage);
  const colors=new THREE.BufferAttribute(new Float32Array(rows*columns*4),4).setUsage(THREE.DynamicDrawUsage);
  for(let i=0;i<rows-1;i++)for(let j=0;j<columns-1;j++){
    const a=i*columns+j,b=a+columns;
    indices.push(a,b,a+1,a+1,b,b+1);
  }
  geometry.setAttribute('position',positions);geometry.setAttribute('color',colors);
  geometry.setIndex(indices);
  const material=stScyInk();material.color.setHex(0xffffff);
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name=name;mesh.frustumCulled=false;mesh.renderOrder=order;
  parent.add(mesh);
  return {mesh,positions,colors};
}

FXCODE.studio_darkness_mark_wave=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  anchor.inner.visible=false;
  const root=new THREE.Group();root.name='Darkness mark wave preview';anchor.obj.add(root);
  const effect=stDarkMarkWave(root,args);
  instance.updateMarkWave=()=>effect.update(instance.t);
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{instance.updateMarkWave=null;effect.dispose();disposeTree(root);root.removeFromParent();});
  instance.updateMarkWave();
};

function stDarkMarkWave(root,args){
  const flow=args.flow===true,live=args.live;
  let target,untouched,showMark,showAbsorption;
  if(!flow&&!live){
    const look={...getLook(NET.myId),ws:-1,wn:0};
    stDarkShiftStudent(root,look,'Mark wave caster',lookTint(look));
    const targetLook={...look,h:2,cl:2,hs:2},otherLook={...look,h:3,cl:3,hs:3};
    target=stDarkShiftStudent(root,targetLook,'Mark wave first target',lookTint(targetLook));
    untouched=stDarkShiftStudent(root,otherLook,'Mark wave target behind',lookTint(otherLook));
    // A gently raised aim with a second target in the same lane.
    target.g.position.set(.96,2.75,15.3);target.g.rotation.y=Math.PI;
    untouched.g.position.set(.96,2.90,18.1);untouched.g.rotation.y=Math.PI;
    showMark=stDarkTargetMark(target.g);
    showAbsorption=stDarkBodyTint(target);
  }
  const ease=stDarkEase,chargeStart=flow?0:.36,swingStart=flow?0:chargeStart+.70,swingEnd=swingStart+.235;
  const release=swingStart+.167;
  let hit=release+.31,markAt=hit+.57;
  let contact=!live;
  const dissolveTime=.49;
  const spinStart=swingEnd+.31,spinEnd=spinStart+.46;
  const showWave=!!live||flow||args.showWave===true;
  const trailSample={pos:new THREE.Vector3(),QB:new THREE.Quaternion(),act:0};
  const scythe=stCreateScythePreview(root,{wrap:'C',manual:true,scale:1.44,trailPose:sampleTrail,spinPose:sampleSpin});
  scythe.pivot.name='Mark wave scythe';
  const flight=new THREE.Group();flight.name='Mark wave flying crescent';root.add(flight);
  const wave=stMarkWaveSheet(flight,'Mark wave flame tail',65,8,8);
  const edge=stMarkWaveSheet(flight,'Mark wave leading edge',65,5,9);
  const wind=stMarkWaveSheet(flight,'Mark wave leading wind',65,4,10);
  const waveHeight=3.05,waveBow=1.87;
  const traceRows=52,traceColumns=11,traceLife=1.10;
  const trace=stMarkWaveSheet(root,'Mark wave lingering trail',traceRows,traceColumns,7);
  for(const layer of [edge,wave,wind,trace])layer.mesh.material.color.setHex(0x000000);
  const absorbBands=7,absorbRows=20;
  const intake=flow?null:stMarkWaveSheet(root,'Mark wave flowing into target',absorbRows,absorbBands*3,11);
  const waveStart=new THREE.Vector3();
  const hitPoint=live||flow?new THREE.Vector3(.96,4.43,13.1):target.g.position.clone().add(new THREE.Vector3(0,1.2,0));
  const flightEnd=hitPoint.clone().add(new THREE.Vector3(0,-.042,-.45));
  const targetCenter=hitPoint.clone(),intakeStart=new THREE.Vector3();

  const random=n=>{const v=Math.sin(n*127.1+71.4)*43758.5453;return v-Math.floor(v);};
  const dustMat=new THREE.MeshBasicMaterial({toneMapped:false});
  const dustCount=114,emberCount=54;
  const dust=new THREE.InstancedMesh(new THREE.OctahedronGeometry(1,0),dustMat,dustCount+emberCount);
  dust.name='Mark wave particles';dust.frustumCulled=false;dust.count=0;root.add(dust);
  const tones=[0x0d0a14,0x261a34,0x483757,0x947fa8].map(c=>new THREE.Color(c));
  const black=new THREE.Color(0x000000);
  const dustSeeds=Array.from({length:dustCount+emberCount},(_,i)=>({
    phase:random(i*5),angle:random(i*5+1)*Math.PI*2,height:random(i*5+2)*2-1,
    spread:.5+random(i*5+3),size:.045+.075*random(i*5+4)
  }));
  const point=new THREE.Vector3(),leaf=new THREE.Object3D();
  const pullDirection=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  const bladeCenter=new THREE.Vector3(.70,2.05,0).multiplyScalar(1.44);
  const bladeOffset=new THREE.Vector3(),tracePoint=new THREE.Vector3();
  const spinTurn=new THREE.Quaternion(),shaftCenter=new THREE.Vector3(0,1.1*1.44,0);
  const hitFlash=flow?null:stMarkWaveSheet(root,'Mark wave contact flare',3,5,12);
  const inverted=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(
    new THREE.Vector3(0,0,1),new THREE.Vector3(0,-1,0),new THREE.Vector3(1,0,0)));
  const idleRotation=new THREE.Quaternion().setFromAxisAngle(up,-1.03);
  const pitchAxis=new THREE.Vector3(1,0,0);
  const spinUpright=new THREE.Quaternion().setFromAxisAngle(pitchAxis,-1.14).multiply(inverted);
  const spinPlane=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-Math.PI*.5);
  const inkPlane=spinPlane.clone().multiply(new THREE.Quaternion().setFromAxisAngle(pitchAxis,-Math.PI*.5));
  const inkOffset=new THREE.Vector3(-.39,0,0);
  const idleBladeCenter=new THREE.Vector3(1.44,3.18,-1.20);
  const releasePose=sampleTrail(release);
  waveStart.copy(bladeCenter).applyQuaternion(releasePose.QB).add(releasePose.pos);
  flight.rotation.x=-Math.atan2(flightEnd.y-waveStart.y,flightEnd.z-waveStart.z);
  const flankWaves=flow&&!live?[-.57,.57].map(yaw=>{
    // Share the animated geometry, rotating each copy around the release point.
    const group=new THREE.Group();
    group.rotation.y=yaw;group.position.copy(waveStart).sub(waveStart.clone().applyAxisAngle(up,yaw));
    const crescent=flight.clone(),ribbon=trace.mesh.clone();
    group.add(crescent,ribbon);root.add(group);
    return {group,crescent,ribbon};
  }):[];
  const launchChips=flow?stDarkMatter(root,'Flow mark launch shards',[
    {at:release-.02,span:.11,count:86,spread:3.5,lift:1.65,height:waveStart.y,back:.35}
  ],(_t,out)=>out.copy(waveStart)):null;
  const launchArc=flow?stMarkWaveSheet(root,'Flow mark launch ripple',49,4,11):null;
  const hiddenParts=new Map();
  function hidePart(part){
    if(!part||hiddenParts.has(part))return;
    hiddenParts.set(part,{mask:part.layers.mask,castShadow:part.castShadow});
    part.layers.disableAll();part.castShadow=false;
  }
  if(!showWave){
    target.g.visible=false;untouched.g.visible=false;showMark(-1,8);
    flight.visible=false;trace.mesh.visible=false;intake.mesh.visible=false;hitFlash.mesh.visible=false;
  }

  function setFlight(end,duration,target){
    hit=release+Math.max(.001,duration);markAt=hit+.57;
    flightEnd.copy(end);
    if(target){contact=true;hitPoint.copy(target);}
    flight.rotation.x=-Math.atan2(flightEnd.y-waveStart.y,Math.hypot(flightEnd.x-waveStart.x,flightEnd.z-waveStart.z));
  }

  function poseScythe(t,pos,rotation){
    const prepare=flow?ease(0,.085,t):ease(.015,chargeStart+.07,t);
    const flip=flow?ease(0,.095,t):ease(.075,chargeStart+.03,t);
    const gather=flow?0:ease(chargeStart,swingStart,t);
    const cut=ease(swingStart,swingEnd,t);
    const coast=ease(swingEnd,swingEnd+.35,t),settle=ease(spinEnd,spinEnd+.70,t);
    // Follow the cutting edge around the side, low across the front, then up.
    const arc=lerp(-2.52-.22*gather,1.02,cut)+.10*coast;
    const tilt=lerp(.10+.27*gather,-1.52,cut)-.09*coast;
    const rise=Math.sin(arc);
    const highLift=1.86*Math.max(0,rise)**1.12;
    pos.set(lerp(1.50+.23*gather,.96,cut),2.97+2.14*rise+highLift,-.12+3.35*Math.cos(arc));
    pos.lerp(idleBladeCenter,1-prepare*(1-settle));
    pos.z+=.36*Math.sin(Math.PI*settle)**2;
    pos.y+=.81*Math.sin(Math.PI*prepare)*(1-settle);
    pos.x+=.43*Math.sin(Math.PI*prepare)*(1-settle);
    rotation.setFromAxisAngle(pitchAxis,tilt).multiply(inverted);
    rotation.slerp(idleRotation,1-flip*(1-settle));
    pos.sub(bladeOffset.copy(bladeCenter).applyQuaternion(rotation));
    const align=ease(spinStart-.13,spinStart+.053,t)*(1-settle);
    if(align>0){
      const turn=ease(spinStart,spinEnd,t)*Math.PI*2;
      pos.add(bladeOffset.copy(shaftCenter).applyQuaternion(rotation));
      rotation.slerp(spinUpright,align);
      rotation.premultiply(spinTurn.setFromAxisAngle(pitchAxis,turn));
      pos.sub(bladeOffset.copy(shaftCenter).applyQuaternion(rotation));
    }
  }

  function sampleTrail(t){
    poseScythe(t,trailSample.pos,trailSample.QB);
    trailSample.act=ease(swingStart+.014,swingStart+.064,t)*(1-ease(swingEnd-.04,swingEnd+.056,t));
    return trailSample;
  }

  function sampleSpin(t){
    if(t<=spinStart||t>=spinEnd)return null;
    const pose=sampleTrail(t);
    pose.spinIdx=0;pose.spinU=(t-spinStart)/(spinEnd-spinStart);
    pose.inkOffset=inkOffset;pose.inkStrength=.54;
    pose.inkPlane=inkPlane;pose.spinPlane=spinPlane;
    return pose;
  }

  function wavePosition(t,out){
    const travel=clamp((t-release)/(hit-release),0,1);
    const age=Math.max(0,t-hit);
    out.copy(waveStart).lerp(flightEnd,travel);
    // After contact the remaining crescent coasts through the first target.
    if(contact){out.z+=1.93*(1-Math.exp(-age*8.2));out.y+=.12*(1-Math.exp(-age*4.0));}
    return out;
  }

  function drawFlight(t){
    const travel=clamp((t-release)/(hit-release),0,1),age=Math.max(0,t-hit);
    const breakUp=clamp(age/dissolveTime,0,1);
    const fade=(1-breakUp)**1.04;
    flight.visible=t>=release&&fade>.002;
    if(!flight.visible)return;
    wavePosition(t,flight.position);
    const growth=.81+.19*ease(0,.16,travel);
    const tailLength=4.4*growth*(1-.34*breakUp);
    for(let i=0;i<65;i++){
      const u=i/64,v=2*u-1,taper=(1-v*v)**.66;
      const y=v*waveHeight*growth*(1-.30*breakUp),front=(.49-waveBow*v*v+.075*v)*growth;
      const thickness=.51*taper*growth;
      const drift=.61*Math.sin(u*16-t*21)+.26*Math.sin(u*35+t*12)+.13*Math.sin(u*68-t*29);
      const split=ease(.26,.76,drift);
      const fracture=1-ease(.06,.81,breakUp+drift*.23)*ease(.02,.27,breakUp);
      const opacity=fade*fracture;
      for(let j=0;j<8;j++){
        const s=j/7,k=i*8+j;
        const flick=Math.sin(t*24-s*7)*.20+Math.sin(t*15-s*13)*.075;
        const halfWidth=(1-s)**.70*(.83+.23*Math.sin(Math.PI*s))+.019;
        const thread=Math.max(0,1-v*v)**lerp(.46,1.14,s);
        const torn=ease(.41,1,s)*Math.sin(v*31+t*31+s*20)*.32;
        wave.positions.setXYZ(k,.09*v+.16*flick*s,
          (v*halfWidth+flick*s+.48*s*s)*growth,
          (.49-.26*v*v)*growth-tailLength*s+torn);
        wave.colors.setXYZW(k,0,0,0,fade*thread*(1-s)**.77*(.86+.13*split*s));
      }
      for(let j=0;j<5;j++){
        const s=j*.25,k=i*5+j;
        edge.positions.setXYZ(k,.052*Math.sin(s*Math.PI)*taper,y+s*.029,front-s*thickness+breakUp*.48*drift);
        edge.colors.setXYZW(k,0,0,0,opacity);
      }
      const flame=ease(.02,.82,Math.sin(u*14-t*29)*.69+Math.sin(u*32-t*12)*.31);
      for(let j=0;j<4;j++){
        const s=j/3,k=i*4+j,lift=.25*flame*taper*s;
        wind.positions.setXYZ(k,-.065*taper+.16*lift,y+.21*s+lift,front+.065+lift-.39*s*s);
        wind.colors.setXYZW(k,0,0,0,opacity*taper*flame*(1-s)*.72);
      }
    }
    wave.positions.needsUpdate=true;wave.colors.needsUpdate=true;
    edge.positions.needsUpdate=true;edge.colors.needsUpdate=true;
    wind.positions.needsUpdate=true;wind.colors.needsUpdate=true;
  }

  function drawLingeringTrail(t){
    trace.mesh.visible=t>release+.02&&t<hit+traceLife;
    if(!trace.mesh.visible)return;
    for(let i=0;i<traceRows;i++){
      const travel=i/(traceRows-1),born=lerp(release,hit,travel),age=t-born;
      const envelope=ease(.008,.073,age)*(1-ease(.26,traceLife,age));
      const endpoint=ease(.015,.24,travel)*(1-ease(.96,1,travel));
      tracePoint.copy(waveStart).lerp(flightEnd,travel);
      const curl=.16*Math.sin(travel*12.6-age*7)+.075*Math.sin(travel*28+age*4);
      const y=tracePoint.y+curl+age*.43;
      const width=(.19+.61*travel**.66)*(.67+.33*ease(0,.20,age));
      for(let j=0;j<traceColumns;j++){
        const k=i*traceColumns+j,v=2*j/(traceColumns-1)-1;
        const contour=1-v*v;
        const fray=Math.sin(travel*36+v*11-age*9)*.15*Math.abs(v)**2;
        trace.positions.setXYZ(k,tracePoint.x+.16*v+curl*.20,y+v*width+fray,tracePoint.z-.57);
        trace.colors.setXYZW(k,0,0,0,envelope*endpoint*contour**.79*.62);
      }
    }
    trace.positions.needsUpdate=true;trace.colors.needsUpdate=true;
  }

  function drawIntake(t){
    const age=t-hit;
    intake.mesh.visible=age>0&&age<.63;
    if(!intake.mesh.visible)return;
    for(let band=0;band<absorbBands;band++){
      const level=2*band/(absorbBands-1)-1,seed=band*2.17;
      const born=hit+.016+band*.024;
      const arrive=markAt-.035+Math.sin(seed)*.028;
      wavePosition(born+.054,intakeStart);
      intakeStart.x+=.32*Math.cos(seed);
      intakeStart.y+=level*2.57;
      intakeStart.z+=.62-.95*level*level;
      for(let i=0;i<absorbRows;i++){
        const ageOnStrip=i/(absorbRows-1),sample=t-ageOnStrip*.19;
        const progress=clamp((sample-born)/(arrive-born),0,1);
        const pull=progress**1.32,wrap=Math.sin(Math.PI*pull)*(1-pull)*1.18;
        const x=lerp(intakeStart.x,targetCenter.x,pull)+Math.sin(seed+pull*4.3)*wrap;
        const y=lerp(intakeStart.y,targetCenter.y,pull)+.28*wrap*Math.cos(seed);
        const z=lerp(intakeStart.z,targetCenter.z,pull)+.63*wrap;
        const visible=progress>0&&progress<1;
        const alpha=visible?(1-ageOnStrip)**.65*ease(0,.12,progress)*(1-ease(.87,1,progress)):0;
        const width=(.14-.105*pull)*(.68+.32*Math.sin(Math.PI*ageOnStrip));
        for(let j=0;j<3;j++){
          const k=(i*absorbBands+band)*3+j,side=j-1;
          intake.positions.setXYZ(k,x+side*width*.4,y+side*width,z-side*width*.8);
          const tone=j===1?.025:.099;
          intake.colors.setXYZW(k,tone,tone*.82,tone*1.36,alpha*(j===1?.93:0));
        }
      }
    }
    intake.positions.needsUpdate=true;intake.colors.needsUpdate=true;
  }

  function drawContact(age){
    const surface=hitFlash,center=hitPoint,duration=.16;
    surface.mesh.visible=age>=0&&age<duration;
    if(!surface.mesh.visible)return;
    const strength=1-ease(duration*.16,duration,age),reach=ease(0,duration*.62,age);
    const span=1.30*lerp(.63,1,reach);
    for(let i=0;i<3;i++)for(let j=0;j<5;j++){
      const lane=i-1,u=j*.5-1,k=i*5+j,tip=1-Math.abs(u)*.99;
      surface.positions.setXYZ(k,center.x+.21*u+.27,center.y+u*span,center.z-u*.43+lane*.31*tip*(.72+reach));
      surface.colors.setXYZW(k,lane===0?.96:.35,lane===0?.84:.17,lane===0?1:.57,strength*tip*(lane===0?1:.72));
    }
    surface.positions.needsUpdate=true;surface.colors.needsUpdate=true;
  }

  function drawDust(t){
    let count=0;
    for(let i=0;i<dustCount;i++){
      const p=dustSeeds[i];
      let size=0,angle=p.angle;
      const gathering=t>=chargeStart&&t<swingStart&&i<60;
      if(gathering){
        const entry=chargeStart+p.phase*.53,arrive=entry+.15+p.spread*.06;
        if(t<=entry||t>=arrive)continue;
        const u=clamp((t-entry)/(arrive-entry),0,1),r=(1-u)**1.25*p.spread*1.85;
        point.copy(bladeCenter);point.x+=(p.phase-.5)*1.2;
        point.applyQuaternion(scythe.pivot.quaternion).add(scythe.pivot.position);
        angle+=u*1.78;
        pullDirection.set(Math.cos(angle),p.height,Math.sin(angle));
        point.addScaledVector(pullDirection,r);
        size=p.size*1.14*Math.sin(Math.PI*u)**.55;
      }else if(showWave&&t>=release&&t<hit&&i<96){
        const u=(t-release)/(hit-release),leading=i<32,lag=leading?p.phase*.034:p.phase*.20;
        if(u<=lag)continue;
        const vertical=clamp(p.height*(leading?.92:.33)+Math.sin(angle)*.09,-1,1);
        const growth=.81+.19*ease(0,.16,u);
        const front=(.49-waveBow*vertical*vertical+.075*vertical)*growth;
        point.copy(waveStart).lerp(flightEnd,u-lag);
        point.x+=Math.cos(angle)*(.15+u*.23)*p.spread;
        point.y+=vertical*waveHeight*growth+u*Math.sin(angle)*.29;
        point.z+=front+(leading?.11+p.phase*.27:-.50-p.phase*1.43);
        size=p.size*(leading?1.07:.93)*Math.sin(Math.PI*(u-lag))**.42;
      }else if(showWave&&!flow&&contact&&t>=hit&&t<markAt+.08){
        const born=hit+p.phase*.233,u=clamp((t-born)/(markAt+.02-born),0,1);
        if(!u||u>=1)continue;
        const pull=u**1.38,curve=Math.sin(Math.PI*u)*(1-pull)*p.spread;
        wavePosition(born+.025,point);
        point.x+=Math.cos(angle)*p.spread*.48;
        point.y+=p.height*2.72;point.z+=.40-p.height*p.height*.98;
        point.lerp(targetCenter,pull);
        point.x+=Math.cos(angle+u*2.8)*curve*.91;
        point.y+=Math.sin(angle+u*2.8)*curve*.72;
        pullDirection.subVectors(targetCenter,point).normalize();
        size=p.size*1.37*(1-u*.72)*ease(0,.09,u);
      }
      if(size<=.003)continue;
      leaf.position.copy(point);
      if(gathering||t>=hit)leaf.quaternion.setFromUnitVectors(up,pullDirection.normalize());
      else if(t<hit)leaf.rotation.set(1.06+p.height*.25,.18*Math.cos(angle),p.height*.38);
      const stretch=gathering?3.8:t<hit?4.2:2.45;
      leaf.scale.set(size*.63,size*(i%3===0?stretch:1.16),size*.72);
      leaf.updateMatrix();
      dust.setMatrixAt(count,leaf.matrix);dust.setColorAt(count,gathering?tones[i%13===0?3:i%3]:black);count++;
    }
    if(showWave&&t>release&&t<hit+traceLife)for(let i=dustCount;i<dustSeeds.length;i++){
      const p=dustSeeds[i],travel=.09+.88*p.phase,born=lerp(release,hit,travel);
      const age=t-born,life=traceLife*(.53+.44*p.spread/1.5);
      if(age<=0||age>=life)continue;
      const u=age/life,alpha=ease(0,.13,u)*(1-ease(.42,1,u));
      const size=p.size*.54*alpha;
      point.copy(waveStart).lerp(flightEnd,travel);
      point.x+=Math.cos(p.angle+age*3)*p.spread*.34;
      point.y+=p.height*.97+age*.42;point.z-=age*(.28+.44*p.phase);
      leaf.position.copy(point);leaf.rotation.set(.99+p.height*.3,p.angle,age*4);
      leaf.scale.set(size*.65,size*2.95,size*.78);leaf.updateMatrix();
      dust.setMatrixAt(count,leaf.matrix);dust.setColorAt(count,black);count++;
    }
    dust.count=count;dust.instanceMatrix.needsUpdate=true;
    if(dust.instanceColor)dust.instanceColor.needsUpdate=true;
  }

  function drawLaunchArc(t){
    const age=t-release,spread=ease(0,.23,age);
    const fade=ease(0,.028,age)*(1-ease(.065,.29,age));
    launchArc.mesh.visible=fade>.003;
    if(!launchArc.mesh.visible)return;
    for(let i=0;i<49;i++){
      const u=i/48,a=lerp(-2.72,1.63,u),tip=Math.sin(Math.PI*u)**.64;
      const tear=.09*Math.sin(u*73+t*28)+.045*Math.sin(u*113);
      for(let j=0;j<4;j++){
        const v=j/3,k=4*i+j,r=.24+2.35*spread+v*.34*tip+tear*spread;
        launchArc.positions.setXYZ(k,waveStart.x+Math.cos(a)*r*.75,
          waveStart.y+Math.sin(a)*r,waveStart.z+spread*.62+Math.cos(a)*r*.44);
        launchArc.colors.setXYZW(k,0,0,0,fade*tip*(1-v*v)*.68);
      }
    }
    launchArc.positions.needsUpdate=true;launchArc.colors.needsUpdate=true;
  }

  const update=(t)=>{
    poseScythe(t,scythe.pivot.position,scythe.pivot.quaternion);
    const power=flow?ease(0,.075,t)*(1-ease(release,swingEnd+.14,t)):
      ease(chargeStart,swingStart,t)*(1-ease(swingStart,swingEnd+.11,t));
    scythe.update(t,.30*power);
    if(live){
      scythe.pivot.visible=live.scythe&&t<spinEnd+.70;
      targetCenter.copy(hitPoint);
      live.target?.(targetCenter);
      drawDust(t);
      if(live.launch){drawFlight(t);drawLingeringTrail(t);}
      if(contact&&!flow){drawIntake(t);drawContact(t-hit);}
      if(flow&&live.scythe){launchChips(t);drawLaunchArc(t);}
      return;
    }
    if(flow){
      for(const avatar of PM3.values()){
        avatar.g.traverse(hidePart);hidePart(avatar.cloth?.mo);hidePart(avatar.cloth?.mi);
      }
      for(const enemy of EM3.values())enemy.g?.traverse(hidePart);
      drawDust(t);drawFlight(t);drawLingeringTrail(t);launchChips(t);
      for(const {crescent,ribbon} of flankWaves){
        crescent.position.copy(flight.position);crescent.visible=flight.visible;ribbon.visible=trace.mesh.visible;
      }
      drawLaunchArc(t);
      return;
    }
    const recoil=showWave?ease(hit,hit+.055,t)*(1-ease(hit+.11,hit+.37,t)):0;
    targetCenter.copy(hitPoint);targetCenter.z+=.28*recoil;
    drawDust(t);
    if(!showWave)return;
    drawFlight(t);drawLingeringTrail(t);drawIntake(t);
    drawContact(t-hit);
    target.g.position.z=targetCenter.z;
    stDarkPose(target,{back:-.32*recoil,roll:.18*recoil,drop:.08*recoil,arms:.49*recoil,step:.27*recoil});
    const absorbed=ease(hit+.085,markAt-.087,t)*(1-ease(markAt-.022,markAt+.19,t));
    showAbsorption(absorbed*.96);
    showMark(t-markAt,8);
  };
  const dispose=()=>{
    for(const [part,{mask,castShadow}] of hiddenParts){part.layers.mask=mask;part.castShadow=castShadow;}
    for(const {group} of flankWaves)group.removeFromParent();
  };
  return {update,dispose,setFlight,release,blade:scythe.pivot};
}
