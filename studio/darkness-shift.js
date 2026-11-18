const ST_DARKNESS_QUICK_DASH='darkness/quick_dash_preview';
const ST_DARKNESS_HOLD_DASH='darkness/hold_dash_preview';

function stDarkShiftStudent(root,look,name,tint){
  const actor=makeStudent(look,name);
  actor.g.name=name;
  root.add(actor.g);
  useFileModel(actor,'char_student',tint,look);
  actor.wandG.visible=false;
  actor.tip.visible=false;
  return actor;
}

function stDarkMatter(root,name,bursts,origin,opacity=1){
  const colors=[0x0c0c13,0x22212d,0x393747,0x666172];
  const tones=colors.map(color=>new THREE.Color(color));
  const pieces=bursts.flatMap(({at,span=0,count,spread,lift,height,back=0})=>
    Array.from({length:count},(_,i)=>{
      const angle=i*2.39996,seed=(i*.618034)%1,chip=i%3!==0;
      return {at:at+span*(i+.5)/count,angle,chip,height:height+(seed-.5)*.36,
        life:(chip?.22:.34)+seed*.20,size:(chip?.025:.055)+seed*.055,
        x:Math.cos(angle)*spread*(.34+seed*.66),z:Math.sin(angle)*spread*(.34+seed*.66)-back,
        y:lift*(.34+((i*.313)%1)*.66),tone:i%11===0?3:i%4===0?2:i%4===1?1:0};
    }));
  const material=new THREE.MeshBasicMaterial({toneMapped:false,opacity,transparent:opacity<1,depthWrite:opacity===1});
  const mesh=new THREE.InstancedMesh(new THREE.OctahedronGeometry(1,0),material,pieces.length);
  mesh.setColorAt(0,tones[0]);
  mesh.name=name;mesh.frustumCulled=false;mesh.count=0;
  root.add(mesh);
  const point=new THREE.Vector3(),piece=new THREE.Object3D();
  return t=>{
    let count=0;
    for(const p of pieces){
      const age=t-p.at;
      if(age<0||age>=p.life)continue;
      const progress=age/p.life,drift=1-Math.pow(1-progress,2.2);
      const fade=(.35+.65*stDarkEase(0,.065,progress))*(1-stDarkEase(.37,1,progress));
      origin(p.at,point);
      piece.position.set(point.x+p.x*drift,Math.max(.08,p.height+p.y*drift-.48*progress*progress),
        point.z+p.z*drift);
      piece.rotation.set(p.angle+age*11,age*7,p.angle*.54-age*8);
      piece.scale.set(p.chip?.57:1,p.chip?1.7:.68,p.chip?.64:1).multiplyScalar(p.size*fade);
      piece.updateMatrix();
      mesh.setMatrixAt(count,piece.matrix);mesh.setColorAt(count,tones[p.tone]);count++;
    }
    mesh.count=count;mesh.instanceMatrix.needsUpdate=true;
    mesh.instanceColor.needsUpdate=true;
  };
}

function stDarkShiftShroud(root){
  const material=new THREE.ShaderMaterial({
    uniforms:{time:{value:0},cover:{value:0},strength:{value:0}},
    transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`uniform float time;varying vec3 inkPoint;
      void main(){
        inkPoint=position;
        float turn=atan(position.z,position.x);
        float ripple=sin(turn*7.0-position.y*13.0+time*15.0)*.038;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position+normal*ripple,1.0);
      }`,
    fragmentShader:`uniform float time,cover,strength;varying vec3 inkPoint;
      void main(){
        float angle=atan(inkPoint.z,inkPoint.x),height=inkPoint.y*.37+.5;
        float flow=angle*2.7-height*34.0+time*10.0;
        float edge=height+.13*sin(angle*3.0+time*10.0)+.08*sin(flow);
        float mask=1.0-smoothstep(cover-.17,cover,edge);
        float streak=pow(max(0.0,sin(flow+.38*sin(angle*5.0))),5.0);
        float seam=smoothstep(cover-.30,cover-.17,edge)*mask;
        vec3 ink=mix(vec3(.003,.003,.007),vec3(.061,.055,.082),streak*(.43+.55*seam));
        gl_FragColor=vec4(ink,mask*strength);
        #include <colorspace_fragment>
      }`
  });
  const shell=new THREE.Mesh(new THREE.CapsuleGeometry(.67,1.14,8,40),material);
  shell.name='Shift Dash shadow shroud';shell.renderOrder=9;
  root.add(shell);
  return (t,place,yaw,cover,strength,size,lean=0)=>{
    shell.visible=strength>.02;
    if(!shell.visible)return;
    shell.position.copy(place);shell.position.y=lerp(.98,1.19,size);
    shell.rotation.set(lean,yaw,0,'YXZ');
    shell.scale.set(lerp(.78,1.24,size),lerp(.47,1.04,size),lerp(.78,1.24,size));
    material.uniforms.time.value=t;
    material.uniforms.cover.value=cover;
    material.uniforms.strength.value=strength;
  };
}

function stDarkShiftCloakTrails(root){
  const bands=6,steps=25;
  const positions=new Float32Array(bands*steps*6),shades=new Float32Array(bands*steps*2),indices=[];
  for(let band=0;band<bands;band++){
    for(let i=0;i<steps-1;i++){
      const a=(band*steps+i)*2;
      indices.push(a,a+1,a+2,a+1,a+3,a+2);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('shade',new THREE.BufferAttribute(shades,1).setUsage(THREE.DynamicDrawUsage));
  geometry.setIndex(indices);
  const material=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    vertexShader:`attribute float shade;varying float ink;
      void main(){ink=shade;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying float ink;
      void main(){
        gl_FragColor=vec4(mix(vec3(.058,.050,.074),vec3(.005,.005,.010),ink),ink);
        #include <colorspace_fragment>
      }`
  });
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name='Long Dash cloak trails';mesh.renderOrder=10;mesh.frustumCulled=false;
  root.add(mesh);
  return (t,place,yaw,gather,flow,strength)=>{
    mesh.visible=strength>.02;
    if(!mesh.visible)return;
    mesh.position.copy(place);mesh.rotation.y=yaw;
    for(let band=0;band<bands;band++){
      const side=band%2?1:-1,lane=(band>>1)/2;
      for(let i=0;i<steps;i++){
        const u=i/(steps-1),a=(band*steps+i)*2;
        const curl=(u*3.5+t*8+lane*1.3)*side;
        const x=side*(.38+.25*lane)*(1-.57*flow*u)+Math.sin(curl)*(.13+.29*gather)*u;
        const y=lerp(1.64-.91*u-.22*lane,1.06+Math.cos(curl)*.37*u,flow);
        const z=lerp(-.13-.71*u,.22-2.53*u,flow)-.17*lane;
        const taper=Math.pow(Math.sin(Math.PI*u),.66);
        const half=(.09+.11*(1-lane))*taper*(1-.40*flow)*(1+.21*Math.sin(curl*2));
        const ink=strength*taper*(.78-.15*lane);
        geometry.attributes.position.setXYZ(a,x+half*.48*side,y+half,z);
        geometry.attributes.position.setXYZ(a+1,x-half*.48*side,y-half,z);
        geometry.attributes.shade.setX(a,ink);
        geometry.attributes.shade.setX(a+1,.59*ink);
      }
    }
    geometry.attributes.position.needsUpdate=true;
    geometry.attributes.shade.needsUpdate=true;
  };
}

function stDarkChargeScythe(root,scythe,distanceAt,launch,impact){
  const edge=scythe.getObjectByName('blade-edge'),blade=scythe.getObjectByName('blade-top');
  if(!edge?.isMesh||!blade?.isMesh)return ()=>{};
  edge.material=edge.material.clone();blade.material=blade.material.clone();
  const bladeColor=blade.material.color.clone(),bruise=new THREE.Color(0x494053);
  edge.material.emissive.setHex(0x827298);
  edge.material.emissiveIntensity=0;
  const vertices=edge.geometry.attributes.position;
  edge.geometry.computeBoundingBox();
  const bounds=edge.geometry.boundingBox;
  const contact=Array.from({length:7},(_,i)=>{
    const x=lerp(bounds.min.x,bounds.max.x,.13+i*.125),point=new THREE.Vector3();
    let best=Infinity;
    for(let j=0;j<vertices.count;j++){
      const cost=Math.abs(vertices.getX(j)-x)*5+vertices.getY(j)-bounds.min.y;
      if(cost>=best)continue;
      best=cost;point.fromBufferAttribute(vertices,j);
    }
    return point;
  });
  const count=34;
  const sparks=new THREE.InstancedMesh(new THREE.OctahedronGeometry(1,0),
    new THREE.MeshBasicMaterial({transparent:true,opacity:.93,depthWrite:false,toneMapped:false}),count);
  const shades=[0x34283f,0x513a63,0x79608d,0xa08bb1].map(color=>new THREE.Color(color));
  for(let i=0;i<count;i++)sparks.setColorAt(i,shades[i%shades.length]);
  sparks.name='Quick Dash scythe infusion';sparks.frustumCulled=false;sparks.count=0;sparks.renderOrder=9;
  root.add(sparks);
  const particles=Array.from({length:count},(_,i)=>{
    const seed=i*.618034%1,angle=i*2.39996,born=launch+.012+i/count*.185;
    const radius=1.34+seed*1.44;
    return {born,angle,seed,hit:impact+(seed-.5)*.09,
      origin:new THREE.Vector3(Math.cos(angle)*radius,.68+((i*.37)%1)*2.75,
        distanceAt(born)+Math.sin(angle)*radius)};
  });
  const focus=new THREE.Group();
  root.add(focus);
  const shock=stDarkPressure(focus);
  const point=new THREE.Vector3(),flow=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  const viewPoint=new THREE.Vector3(),rootInverse=new THREE.Matrix4();
  const transform=new THREE.Matrix4(),piece=new THREE.Object3D();
  return t=>{
    const glow=stDarkEase(impact-.018,impact+.056,t);
    const pulse=glow*(.93+.07*Math.sin((t-impact)*26));
    edge.material.emissiveIntensity=.75*pulse;
    blade.material.color.copy(bladeColor).lerp(bruise,pulse*.76);
    const age=t-impact,flash=stDarkEase(-.017,.022,age)*(1-stDarkEase(.028,.19,age));
    let active=0;
    if(t>=launch&&t<=impact+.19){
      edge.updateWorldMatrix(true,false);
      rootInverse.copy(root.matrixWorld).invert();
      transform.multiplyMatrices(rootInverse,edge.matrixWorld);
      focus.position.copy(contact[3]).applyMatrix4(transform);
      cam.getWorldPosition(viewPoint).applyMatrix4(rootInverse).sub(focus.position);
      focus.quaternion.setFromUnitVectors(flow.set(0,0,1),viewPoint.normalize());
      for(let i=0;i<particles.length;i++){
        const {born,angle,seed,hit,origin}=particles[i];
        const u=(t-born)/(hit-born);
        if(u<0||u>=1)continue;
        const pull=u*u*(2-u),arc=Math.sin(Math.PI*u)*(.27+seed*.36);
        point.copy(contact[i%contact.length]).applyMatrix4(transform);
        piece.position.copy(origin).lerp(point,pull);
        piece.position.x-=Math.sin(angle)*arc;
        piece.position.y+=Math.cos(angle)*arc;
        piece.position.z+=Math.cos(angle)*arc*.55;
        piece.quaternion.setFromUnitVectors(up,flow.copy(point).sub(piece.position).normalize());
        const size=(.048+seed*.048)*stDarkEase(0,.20,u)*(1-stDarkEase(.87,1,u));
        piece.scale.set(size,size*(1.4+3.6*pull),size*.62);
        piece.updateMatrix();sparks.setMatrixAt(active++,piece.matrix);
      }
    }
    shock(.34+.80*stDarkEase(0,.17,age),flash*.65,t*9);
    sparks.count=active;sparks.instanceMatrix.needsUpdate=true;
  };
}

function stDarkQuickDash(root,caster,scythe,look){
  const ease=stDarkEase,launch=.22,arrival=.45,impact=.55,range=3.45;
  const distanceAt=t=>range*ease(launch,arrival,t);
  const pointAt=(distance,out)=>out.set(0,0,clamp(distance,0,range));
  const side=new THREE.Vector3(1,0,0);
  const nearTail=stDarkWake(root,distanceAt,(d,out)=>pointAt(d,out).addScaledVector(side,-.17),
    ()=>-.63,launch,arrival,.21,.43);
  const farTail=stDarkWake(root,distanceAt,(d,out)=>pointAt(d,out).addScaledVector(side,.25),
    ()=>-.79,launch+.018,arrival+.018,.12,.37);
  const matter=stDarkMatter(root,'Quick Dash dark matter',[
    {at:launch,span:.046,count:25,spread:.82,lift:.78,height:.27,back:.29},
    {at:launch+.04,span:.18,count:37,spread:.49,lift:.38,height:.77,back:.67},
    {at:arrival-.02,span:.04,count:11,spread:.66,lift:.29,height:.22,back:.21}
  ],(t,out)=>pointAt(distanceAt(t),out),.56);
  const echoes=[.265,.322,.376].map((stamp,i)=>({
    stamp,actor:stDarkShiftStudent(root,look,'Shift Dash afterimage '+(i+1)),
    ink:new THREE.MeshLambertMaterial({color:0x25212c,emissive:0x16121d,transparent:true,depthWrite:false,opacity:0}),
    ready:false
  }));
  const infuse=stDarkChargeScythe(root,scythe,distanceAt,launch,impact);
  for(const echo of echoes)echo.actor.ring.visible=false;

  function pose(actor,t){
    const lean=ease(.15,launch,t)*(1-ease(arrival-.02,.64,t));
    const stride=Math.cos(clamp((t-launch)/(arrival-launch),0,1)*Math.PI*1.38);
    actor.g.position.set(0,.11*lean,distanceAt(t));
    stDarkPose(actor,{back:.50*lean,roll:-.09*lean,drop:.11*lean,arms:.25*lean,step:.78*lean*stride});
    actor.armR.rotation.x+=.50*lean*stride;
    actor.armL.rotation.x-=.57*lean*stride;
    if(actor.rig)rigSync(actor,0);
  }

  return t=>{
    pose(caster,t);
    const lean=ease(.15,launch,t)*(1-ease(arrival-.02,.64,t));
    const empowered=ease(impact-.018,impact+.047,t);
    const snap=empowered*(1-ease(impact+.05,impact+.18,t));
    scythe.position.set(-1.24-.23*snap,.18+.049*Math.sin(t*4)+.18*snap,caster.g.position.z-.47*lean);
    scythe.rotation.set(.19*lean,.12*Math.sin(t*6)-.36*empowered,-.16-.38*lean+.19*snap);
    scythe.scale.setScalar(1.43*(1+.10*empowered+.06*snap));
    nearTail(t);farTail(t);matter(t);infuse(t);
    for(const echo of echoes){
      if(!echo.ready&&echo.actor.fileModel){
        echo.actor.fileModel.traverse(mesh=>{
          if(!mesh.isMesh)return;
          mesh.material=echo.ink;
          mesh.castShadow=false;
          mesh.receiveShadow=false;
        });
        echo.ready=true;
      }
      const age=t-echo.stamp;
      const opacity=.49*ease(.019,.048,age)*(1-ease(.062,.21,age));
      echo.actor.g.visible=echo.ready&&opacity>.02;
      echo.ink.opacity=opacity;
      if(echo.actor.g.visible)pose(echo.actor,echo.stamp);
    }
  };
}

function stDarkHoldDash(root,caster,scythe){
  const ease=stDarkEase,begin=.16,launch=begin+.50,covered=launch+.045,formed=launch+.14,arrival=formed+2;
  const rollStart=launch-.13,acceleration=.22,braking=.34;
  const route=[[0,0],[.06,3.6],[2.65,6.9],[2.1,10],[-1.65,13.3]]
    .map(([x,z])=>new THREE.Vector3(x,0,z));
  // This curve demonstrates steering for the Studio camera.
  const path=new THREE.CatmullRomCurve3(route),length=path.getLength();
  const pointAt=(distance,out)=>path.getPointAt(clamp(distance/length,0,1),out);
  // Keep acceleration independent of the time spent in ball form.
  const duration=arrival-rollStart,travelTime=duration-(acceleration+braking)*.5;
  const speed=length/travelTime;
  const distanceAt=t=>{
    const elapsed=clamp(t-rollStart,0,duration),remaining=duration-elapsed;
    if(elapsed<acceleration)return speed*elapsed*elapsed/(2*acceleration);
    if(remaining<braking)return length-speed*remaining*remaining/(2*braking);
    return speed*(elapsed-acceleration*.5);
  };
  const wake=stDarkWake(root,distanceAt,pointAt,()=>0,launch,arrival,.64);
  const wakeShards=stDarkWakeShards(root,distanceAt,pointAt,()=>0,launch,arrival);
  const ball=stDarkOrbCore();
  ball.name='Shift Dash shadow ball';root.add(ball);
  const weave=stDarkOrbWeave(root,pointAt,()=>0);
  const shroud=stDarkShiftShroud(root);
  const cloakTrails=stDarkShiftCloakTrails(root);
  const splash=stDarkMatter(root,'Long Dash dark splash',[
    {at:arrival-.01,span:.07,count:52,spread:1.68,lift:1.02,height:.62},
    {at:arrival+.025,span:.08,count:23,spread:1.03,lift:1.57,height:1.00},
    {at:arrival+.15,span:.065,count:27,spread:1.48,lift:.41,height:.23}
  ],(_t,out)=>out.copy(route.at(-1)));
  const entry=new THREE.Group(),exit=new THREE.Group();
  entry.position.y=exit.position.y=.06;entry.rotation.x=exit.rotation.x=-Math.PI/2;
  exit.position.add(route.at(-1));root.add(entry,exit);
  const inkIn=stDarkPressure(entry),inkOut=stDarkPressure(exit);
  const splinters=new THREE.Group();
  splinters.name='Long Dash splash ribbons';splinters.position.copy(route.at(-1));root.add(splinters);
  const ribbons=Array.from({length:6},(_,i)=>{
    const jet=new THREE.Group(),angle=i*2.39996,tip=.67+(i%3)*.20;
    jet.rotation.y=angle;jet.position.y=.58+(i%2)*.27;splinters.add(jet);
    const core=stDarkCut(jet,[[.15,-.04],[.46,tip*.08],[1.35,tip]],.12,0x15121e,10);
    const rim=stDarkCut(jet,[[.18,.02],[.54,tip*.18],[1.51,tip*.91]],.032,0x4a435b,11);
    return age=>{
      const elapsed=age-.023-i*.007,flare=ease(0,.13,elapsed);
      jet.scale.set(.5+.75*flare,.47+.54*flare,1);
      jet.rotation.y=angle+flare*.23;
      core(elapsed,.24+(i%3)*.026,.40);
      rim(elapsed-.012,.18+(i%3)*.018,.37);
    };
  });
  const at=new THREE.Vector3(),ahead=new THREE.Vector3(),behind=new THREE.Vector3(),scytheOffset=new THREE.Vector3();
  const up=new THREE.Vector3(0,1,0);
  return t=>{
    const distance=distanceAt(t),age=t-arrival;
    const charge=ease(begin,launch,t),seal=ease(begin+.14,covered,t);
    const morph=ease(rollStart+.035,formed,t);
    const unveil=ease(covered,formed,t);
    const form=morph*(1-ease(0,.065,age));
    pointAt(distance,at);pointAt(distance+.1,ahead);pointAt(distance-.1,behind);ahead.sub(behind);
    const yaw=Math.atan2(ahead.x,ahead.z);
    const brace=t<covered?charge:0;
    const push=ease(rollStart,covered,t)*(1-unveil);
    const spring=ease(.03,.081,age)*(1-ease(.106,.224,age));
    const plant=ease(.129,.238,age)*(1-ease(.25,.52,age));
    caster.g.position.copy(at);caster.g.rotation.y=yaw;
    caster.g.position.y=.36*spring;
    caster.g.visible=t<covered||age>=.045;
    caster.ring.material.opacity=.7*(1-ease(rollStart-.04,covered,t)+ease(.06,.20,age));
    stDarkPose(caster,{back:.25*brace+.31*push-.24*spring+.46*plant,roll:.08*brace+.20*spring-.16*plant,
      drop:.06*brace+.20*plant,arms:.54*brace+.76*spring+.42*plant,step:.18*brace+.34*push+.68*spring+.37*plant});
    if(spring||plant){
      caster.armR.rotation.z-=.48*spring+.17*plant;
      caster.armL.rotation.z+=.80*spring+.18*plant;
      if(caster.rig)rigSync(caster,0);
    }

    const core=ease(.14,.96,form),travel=ease(rollStart,rollStart+acceleration,t)*(1-ease(arrival-.11,arrival,t));
    ball.visible=core>.02;
    ball.position.copy(at).addScaledVector(ahead.normalize(),.10*travel);
    ball.position.y=1.07+.065*Math.sin(t*16)*(1-travel);
    ball.rotation.y=yaw;
    ball.scale.set((.52-.07*travel)*core,.57*core,(.51+.15*travel)*core);
    const threads=lerp(.46,.96,charge)*ease(begin,begin+.24,t)*(1-ease(-.02,.15,age));
    const coil=.62*seal*(1-morph);
    weave(t,at,distance,threads,morph,0,0,coil);
    const cloakFlow=ease(rollStart-.055,formed+.16,t);
    cloakTrails(t,at,yaw,charge,cloakFlow,ease(begin+.07,begin+.25,t)*(1-ease(formed+.03,formed+.37,t)));
    if(age<0)shroud(t,at,yaw,lerp(-.12,1.38,seal),
      ease(begin+.14,begin+.27,t)*(1-unveil),1-.70*unveil,.39*push);
    else {
      const peel=ease(.049,.18,age);
      shroud(t,at,yaw,lerp(1.38,-.1,peel),.92*ease(-.025,.035,age)*(1-peel),ease(0,.053,age));
    }

    const fuse=ease(begin+.27,covered,t),returning=ease(.093,.34,age);
    scythe.visible=t<covered||returning>.03;
    scytheOffset.set(-1.24,.18+.049*Math.sin(t*4)+.32*brace,.02).applyAxisAngle(up,yaw);
    scythe.position.copy(at).addScaledVector(scytheOffset,age<0?1-.67*fuse:.32+.68*returning);
    scythe.rotation.set(-.15*brace,yaw+.21*Math.sin(t*6)-1.65*returning*(1-returning),-.16-.43*brace+.40*plant);
    scythe.scale.setScalar(1.43*(age<0?1-.90*fuse:.22+.78*returning));

    inkIn(1.77-1.04*charge,.59*charge*(1-ease(launch,formed,t)),t*4);
    inkOut(.37+1.37*ease(.04,.31,age),.83*ease(.035,.098,age)*(1-ease(.11,.32,age)),t*6);
    for(const ribbon of ribbons)ribbon(age);
    wake(t);wakeShards(t);splash(t);
  };
}

FXCODE.studio_darkness_shift=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  const scythe=modelInst('dark_scythe');
  if(!anchor?.obj||!scythe)return;
  const root=new THREE.Group();root.name='Darkness Shift preview';anchor.obj.add(root);
  const look={...getLook(NET.myId),ws:-1,wn:0};
  const caster=stDarkShiftStudent(root,look,'Shift Dash caster',lookTint(look));
  scythe.name='Shift Dash scythe';root.add(scythe);
  const update=args.hold?stDarkHoldDash(root,caster,scythe):stDarkQuickDash(root,caster,scythe,look);
  instance.updateDarknessShift=()=>update(instance.t);
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{
    instance.updateDarknessShift=null;disposeTree(root);root.removeFromParent();
  });
  instance.updateDarknessShift();
};
