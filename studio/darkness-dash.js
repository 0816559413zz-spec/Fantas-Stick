// Studio-only choreography and volume study for the approved Darkness dash.
const ST_DARKNESS_DASH='darkness/dash_preview';
const ST_DARKNESS_RADIUS=300/20;
const ST_DARKNESS_MAX_TARGETS=4;
const ST_DARKNESS_MARK_HOLD=.25;
const ST_DARKNESS_MARK_CUT_LIFE=.72;
const ST_DARKNESS_CUT_LIFE=.61;
const stDarkEase=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
const stDarkCutFade=(age,life,start)=>1-stDarkEase(start,1,age/life);

function stDarkTargetMark(parent){
  const mark=new THREE.Group(),stamp=new THREE.Group();
  mark.name='Darkness target mark';
  mark.position.y=1.2;
  stamp.position.z=.49;
  mark.add(stamp);
  parent.add(mark);
  const markWorld=new THREE.Vector3();

  const layer=(parent,points,color,order)=>{
    const shape=new THREE.Shape(points.map(([x,y])=>new THREE.Vector2(x,y)));
    const material=new THREE.MeshBasicMaterial({color,transparent:true,depthWrite:false,toneMapped:false});
    const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),material);
    mesh.renderOrder=order;
    parent.add(mesh);
    return mesh;
  };
  const top=[-.018,.177],right=[.177,.020],bottom=[.012,-.168],left=[-.178,-.010];
  const arms=[
    [top,[.101,.349],[.214,.423],[.177,.362],[.302,.442],[.536,.596],
      [.454,.417],[.361,.310],[.407,.326],[.242,.154],right],
    [right,[.309,-.120],[.453,-.299],[.395,-.277],[.481,-.396],[.584,-.574],
      [.376,-.476],[.259,-.343],[.297,-.352],[.127,-.226],bottom],
    [bottom,[-.153,-.331],[-.250,-.406],[-.226,-.354],[-.526,-.621],
      [-.443,-.432],[-.329,-.276],[-.373,-.296],[-.244,-.138],left],
    [left,[-.305,.172],[-.363,.251],[-.343,.204],[-.487,.376],[-.582,.565],
      [-.371,.469],[-.266,.392],[-.316,.412],[-.152,.248],top]
  ];
  const fill=(parent,points,order)=>{
    const rim=layer(parent,points,0x020205,order);
    const face=layer(parent,points.map(([x,y])=>[x*.77,y*.77]),0xffffff,order+1);
    const vertices=face.geometry.getAttribute('position');
    const colors=new Float32Array(vertices.count*3);
    const charcoal=new THREE.Color(0x3e3e48),black=new THREE.Color(0x0f0f15),color=new THREE.Color();
    for(let i=0;i<vertices.count;i++){
      const x=vertices.getX(i),y=vertices.getY(i);
      color.copy(black).lerp(charcoal,stDarkEase(-.34,.46,y-.19*x)).toArray(colors,i*3);
    }
    face.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    face.material.vertexColors=true;
    return [rim,face];
  };
  const strokes=[0,1].map(i=>{
    const ink=new THREE.Group();
    stamp.add(ink);
    return {ink,layers:fill(ink,[...arms[i],...arms[i+2]],16+i*2)};
  });
  const fused=new THREE.Group();
  fused.name='Darkness fused X';
  stamp.add(fused);
  fill(fused,arms.flatMap(arm=>arm.slice(0,-1)),16);
  const edgeChips=[
    [[.309,.435],[.430,.509],[.362,.441],[.325,.432]],
    [[-.385,-.353],[-.320,-.273],[-.350,-.344]],
    [[.426,-.316],[.463,-.379],[.429,-.350]]
  ].map(points=>layer(fused,points,0xd9d9e1,18));
  return (age,end)=>{
    mark.visible=age>=0&&age<end;
    if(!mark.visible)return;
    mark.lookAt(cam.position);
    const distance=mark.getWorldPosition(markWorld).distanceTo(cam.position);
    stamp.scale.setScalar(lerp(.94,1.09,1-stDarkEase(4,20,distance)));
    const mergeTime=.14;
    fused.visible=age>=mergeTime;
    for(const [i,{ink,layers}] of strokes.entries()){
      const elapsed=age-i*.055;
      ink.visible=elapsed>0&&!fused.visible;
      if(!ink.visible)continue;
      const draw=stDarkEase(0,.085,elapsed),offset=.40*(1-draw);
      ink.position.set(i===0?-offset:offset,-offset,0);
      ink.scale.setScalar(.76+.24*draw);
      for(const mesh of layers)mesh.material.opacity=stDarkEase(0,.014,elapsed);
    }
    if(fused.visible){
      const flash=1-stDarkEase(mergeTime,mergeTime+.11,age);
      for(const chip of edgeChips)chip.material.opacity=.39+.46*flash;
    }
  };
}

// Reveal each cut along its curve, then fade its full silhouette.
function stDarkCut(parent,points,width,color,order=12){
  const count=32;
  const path=new THREE.QuadraticBezierCurve3(...points.map(([x,y,z=0])=>new THREE.Vector3(x,y,z)));
  const geometry=new THREE.BufferGeometry(),position=[],index=[];
  for(let j=0;j<=count;j++){
    const u=j/count,p=path.getPoint(u),d=path.getTangent(u);
    const taper=Math.pow(Math.sin(Math.PI*u),.62)*width;
    position.push(p.x-d.y*taper,p.y+d.x*taper,p.z,p.x+d.y*taper,p.y-d.x*taper,p.z);
    if(j<count){const a=j*2;index.push(a,a+2,a+1,a+1,a+2,a+3);}
  }
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
  geometry.setIndex(index);
  const material=new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,depthWrite:false,toneMapped:false});
  const mesh=new THREE.Mesh(geometry,material);
  mesh.renderOrder=order;
  parent.add(mesh);
  return (age,life,fadeStart=.56)=>{
    const t=age/life;
    mesh.visible=t>0&&t<1;
    if(!mesh.visible)return;
    const tip=Math.ceil(count*stDarkEase(0,Math.min(.042,life*.135),age));
    geometry.setDrawRange(0,tip*6);
    mesh.scale.setScalar(1+.14*(1-stDarkEase(.08,Math.min(.32,fadeStart),t)));
    material.opacity=stDarkCutFade(age,life,fadeStart);
  };
}

function stDarkPressure(parent){
  const material=new THREE.ShaderMaterial({
    uniforms:{strength:{value:0},phase:{value:0}},transparent:true,depthWrite:false,
    side:THREE.DoubleSide,toneMapped:false,
    vertexShader:`varying vec2 vPlane;
      void main(){vPlane=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform float strength; uniform float phase; varying vec2 vPlane;
      void main(){
        float a=atan(vPlane.y,vPlane.x),radius=length(vPlane);
        float ripple=.016*sin(a*9.0+phase*8.0)+.009*sin(a*16.0-phase*13.0);
        float rim=radius-ripple;
        float body=smoothstep(.75,.88,rim)*(1.0-smoothstep(.94,1.02,rim));
        float cut=smoothstep(-.34,.6,sin(a*4.0+phase)+.33*sin(a*11.0-phase));
        float edge=smoothstep(.922,.945,rim)*(1.0-smoothstep(.952,.983,rim))*cut;
        gl_FragColor=vec4(mix(vec3(.012,.013,.020),vec3(.64,.68,.77),edge),
          strength*body*(.52+.43*cut));
        #include <colorspace_fragment>
      }`
  });
  const wave=new THREE.Mesh(new THREE.RingGeometry(.73,1.03,76,5),material);
  wave.renderOrder=11;
  parent.add(wave);
  return (size,strength,phase)=>{
    wave.visible=strength>.01;
    if(!wave.visible)return;
    wave.scale.setScalar(size);
    material.uniforms.strength.value=strength;
    material.uniforms.phase.value=phase;
  };
}

function stDarkMarkedBurst(parent,x,z){
  const group=new THREE.Group(),rings=new THREE.Group();
  group.name='Darkness marked orb impact';
  group.position.set(x,1.13,z);
  group.add(rings);
  parent.add(group);
  const shellMaterial=new THREE.ShaderMaterial({
    uniforms:{age:{value:0},strength:{value:0}},transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`varying vec3 vPoint; varying vec3 vEye; varying vec3 vNormal;
      void main(){
        vPoint=position; vNormal=normalize(normalMatrix*normal);
        vec4 p=modelViewMatrix*vec4(position,1.0); vEye=-p.xyz;
        gl_Position=projectionMatrix*p;
      }`,
    fragmentShader:`uniform float age; uniform float strength;
      varying vec3 vPoint; varying vec3 vEye; varying vec3 vNormal;
      void main(){
        float rim=1.0-clamp(dot(normalize(vNormal),normalize(vEye)),0.0,1.0);
        float ink=sin(vPoint.y*13.0+vPoint.x*7.5-age*13.0)
          +0.55*sin(vPoint.z*20.0-vPoint.y*10.0+age*18.0);
        float stripe=smoothstep(0.24,0.42,rim)*(1.0-smoothstep(0.52,0.71,rim));
        float flare=stripe*smoothstep(-0.65,1.12,ink)*(1.0-smoothstep(0.065,0.255,age));
        float curl=sin(vPoint.x*10.0+vPoint.y*12.0+ink*1.9+age*19.0);
        float eddy=smoothstep(0.67,0.96,curl)*smoothstep(0.1,0.6,rim)
          *(1.0-smoothstep(0.70,0.95,rim))*(1.0-smoothstep(0.04,0.21,age));
        float shadeNoise=smoothstep(-1.35,1.35,ink);
        vec3 inkShade=mix(vec3(0.005,0.005,0.009),vec3(0.041,0.043,0.054),shadeNoise*(1.0-rim));
        vec3 shade=mix(inkShade,vec3(0.66,0.71,0.80),max(flare,eddy*.66));
        float alpha=(0.43+0.45*smoothstep(0.17,0.86,rim)+0.25*max(flare,eddy))*strength;
        gl_FragColor=vec4(shade,alpha);
        #include <colorspace_fragment>
      }`
  });
  const shell=new THREE.Mesh(new THREE.SphereGeometry(1,36,28),shellMaterial);
  shell.name='Darkness marked shell';
  shell.renderOrder=8;
  group.add(shell);
  const makeRing=(color,width)=>{
    const material=new THREE.MeshBasicMaterial({color,transparent:true,depthWrite:false,toneMapped:false});
    const mesh=new THREE.Mesh(new THREE.TorusGeometry(1,width,7,60),material);
    mesh.renderOrder=10;
    rings.add(mesh);
    return mesh;
  };
  const shadow=makeRing(0x09090e,.064),silver=makeRing(0xbfc3cd,.020),shock=stDarkPressure(rings);
  const aftershock=stDarkPressure(rings);
  shadow.rotation.y=.31;
  silver.rotation.y=-.12;
  const curlDark=new THREE.MeshBasicMaterial({color:0x101017,transparent:true,depthWrite:false});
  const curls=Array.from({length:11},(_,i)=>{
    const angle=i*2.39996,side=Math.cos(angle),up=Math.sin(angle);
    const p=new THREE.Mesh(new THREE.SphereGeometry(.17,10,7),curlDark);
    p.rotation.z=angle-.52;
    p.renderOrder=11;
    rings.add(p);
    return {p,side,up};
  });
  const ringOnFloor=new THREE.Mesh(new THREE.TorusGeometry(1,.035,6,48),new THREE.MeshBasicMaterial({
    color:0x15151d,transparent:true,depthWrite:false
  }));
  ringOnFloor.position.y=-1.08;
  ringOnFloor.rotation.x=-Math.PI/2;
  group.add(ringOnFloor);
  const cutPlane=new THREE.Group();
  cutPlane.name='Darkness marked cut';
  cutPlane.position.z=2.45;
  cutPlane.scale.setScalar(.87);
  rings.add(cutPlane);
  const diagonal=[[-2.62,-1.34],[-.40,.24],[2.42,1.84]];
  const cutEdge=stDarkCut(cutPlane,diagonal,.285,0x09090f,13);
  const cutCore=stDarkCut(cutPlane,diagonal,.166,0xfffaff,14);
  const cutDelay=.012,fadeStart=.22;
  return age=>{
    const cutAge=age-cutDelay;
    group.visible=age>=0&&cutAge<ST_DARKNESS_MARK_CUT_LIFE;
    if(!group.visible)return;
    rings.lookAt(cam.position);
    const strike=1-Math.pow(1-clamp(age/.044,0,1),3);
    const fall=stDarkCutFade(cutAge,ST_DARKNESS_MARK_CUT_LIFE,fadeStart);
    const snap=stDarkEase(0,.028,age)*(1-stDarkEase(.038,.135,age));
    const size=.38+1.54*strike+.42*snap+.23*stDarkEase(.085,.37,age);
    shell.scale.set(size*(1+.09*snap),size*(.97-.11*snap),size);
    shellMaterial.uniforms.age.value=age;
    shellMaterial.uniforms.strength.value=fall;
    shadow.scale.setScalar(size*1.018);
    shadow.material.opacity=.82*fall;
    silver.scale.setScalar((.47+1.50*stDarkEase(0,.13,age))*.93);
    silver.material.opacity=.96*(1-stDarkEase(.032,.18,age));
    ringOnFloor.scale.setScalar(.60+4.05*(1-Math.pow(1-clamp(age/.19,0,1),3)));
    ringOnFloor.material.opacity=.92*(1-stDarkEase(.042,.27,age));
    shock(.73+3.02*(1-Math.pow(1-clamp(age/.147,0,1),3)),1-stDarkEase(.039,.206,age),age*9);
    aftershock(1.28+2.04*stDarkEase(.04,.24,age),.57*stDarkEase(.027,.059,age)*(1-stDarkEase(.075,.27,age)),age*7+2);
    cutEdge(cutAge,ST_DARKNESS_MARK_CUT_LIFE,fadeStart);
    cutCore(cutAge,ST_DARKNESS_MARK_CUT_LIFE,fadeStart);
    curlDark.opacity=fall;
    for(const [i,{p,side,up}] of curls.entries()){
      const offset=size*(.89+(i%3)*.07)+age*.48;
      p.position.set(side*offset,up*offset,.035+(i%3)*.035);
      p.rotation.z=Math.atan2(up,side)-.68+age*2.1;
      p.scale.set((1+i%3*.39)*fall,(.46+i%3*.13)*fall,.48*fall);
    }
  };
}

// The floor and the cast radius stay fixed while the torn ribbons flow around them.
function stDarkSlashArea(parent,[x,z],radius){
  const group=new THREE.Group();
  group.name='Darkness cast area';
  group.position.set(x,0,z);
  parent.add(group);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(radius,96),new THREE.ShaderMaterial({
    uniforms:{strength:{value:0}},transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`varying vec2 vPlane; void main(){vPlane=position.xy/${radius.toFixed(2)};
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform float strength; varying vec2 vPlane;
      void main(){
        float r=length(vPlane),a=atan(vPlane.y,vPlane.x);
        float curl=a*5.0-r*13.0+.75*sin(a*3.0+r*7.0);
        float folds=sin(curl)+.31*sin(a*11.0-r*19.0);
        float band=smoothstep(.22,.96,folds)*smoothstep(.13,.52,r);
        float threads=smoothstep(.72,.99,sin(curl*3.0+sin(a*9.0+r*8.0)))*smoothstep(.45,.78,r);
        float grain=.61+.30*band+.09*threads;
        gl_FragColor=vec4(.009,.010,.014,strength*grain*(1.0-smoothstep(.94,1.0,r)));
        #include <colorspace_fragment>
      }`
  }));
  floor.name='Darkness cast area floor';
  floor.position.y=.038;
  floor.rotation.x=-Math.PI/2;
  floor.renderOrder=1;
  group.add(floor);
  const edge=new THREE.BufferGeometry(),uvs=[],faces=[],vertices=[];
  const silhouettes=[
    [.03,.10,.24,.39,.67,.62,.88,.71,1,.44,.23,.02],
    [.04,.13,.32,.63,.91,.73,.61,.56,.66,.31,.16,.02],
    [.03,.08,.20,.38,.47,.80,.65,.93,.65,.37,.23,.02]
  ];
  const lower=[.03,.045,.11,.17,.11,.24,.14,.22,.28,.19,.10,.02];
  // [angle, span, height, radial offset, tilt]. The narrow strokes follow the larger ones.
  const strips=[
    [.20,.98,4.05,-.24,-.97], [1.54,.79,2.65,.07,.62], [2.66,1.02,3.65,-.32,-.69],
    [4.06,.99,4.32,.10,.65], [5.46,.77,3.12,-.18,-.70],
    [-.12,.62,.72,.31,.29], [.93,.34,1.03,-.32,-.28], [1.89,.46,.71,.20,.24],
    [2.33,.72,.92,.44,.24], [3.43,.41,.67,-.34,-.29], [3.72,.65,1.04,.36,.29],
    [4.85,.40,.70,-.38,-.20], [5.13,.52,.82,.36,.28], [5.98,.46,.55,-.35,-.18]
  ];
  for(const [index,[angle,span,height,offset,tilt]] of strips.entries()){
    const upper=silhouettes[index%silhouettes.length],reverse=index%4===1;
    for(let i=0;i<upper.length;i++){
      const u=i/(upper.length-1),j=reverse?upper.length-1-i:i;
      if(i){const a=vertices.length;faces.push(a-2,a,a-1,a-1,a,a+1);}
      for(const [side,profile] of [[0,lower],[1,upper]]){
        vertices.push({angle:angle+(u-.5)*span,radius:radius+offset,lift:profile[j],u,height,tilt,index});
        uvs.push(u,side,index);
      }
    }
  }
  const positions=new THREE.BufferAttribute(new Float32Array(vertices.length*3),3).setUsage(THREE.DynamicDrawUsage);
  edge.setAttribute('position',positions);
  edge.setAttribute('strand',new THREE.Float32BufferAttribute(uvs,3));
  edge.setIndex(faces);
  const border=new THREE.Mesh(edge,new THREE.ShaderMaterial({
    uniforms:{strength:{value:0},age:{value:0}},side:THREE.DoubleSide,transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`attribute vec3 strand;varying vec3 vPanel;void main(){vPanel=strand;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform float strength,age;varying vec3 vPanel;
      void main(){
        float u=vPanel.x,v=vPanel.y,id=vPanel.z;
        float fold=v-.43*u+.073*sin(u*9.+id);
        float charcoal=smoothstep(.25,.29,fold)*(1.-smoothstep(.56,.60,fold));
        float gray=smoothstep(.50,.53,fold)*(1.-smoothstep(.71,.73,fold));
        float torn=smoothstep(.015,.05,v)*(1.-smoothstep(.95,1.,v));
        float notch=abs(v-(.78-u*.63));
        if(u>.30&&u<.52&&notch<.030&&mod(id,3.)<1.)discard;
        vec3 ink=mix(vec3(.002,.002,.004),vec3(.047,.043,.056),charcoal*torn);
        ink=mix(ink,vec3(.127,.115,.138),gray*torn*.83);
        float thread=1.-smoothstep(.006,.014+fwidth(fold)*.65,abs(fold-.544));
        float glint=.36+.64*(.5+.5*sin((u-age*.85)*11.+id));
        thread*=smoothstep(.15,.35,u)*(1.-smoothstep(.74,.94,u))*glint;
        ink=mix(ink,vec3(.36,.32,.38),thread*.44);
        gl_FragColor=vec4(ink,strength*mix(1.,.76,step(4.5,id)));
        #include <colorspace_fragment>
      }`
  }));
  border.name='Darkness torn area border';
  border.renderOrder=2;
  border.frustumCulled=false;
  group.add(border);
  return (age,landingAge)=>{
    group.visible=age>=0&&landingAge<.32;
    if(!group.visible)return;
    const strength=stDarkEase(0,.105,age)*(1-stDarkEase(.045,.32,landingAge));
    const lift=stDarkEase(0,.19,age),release=stDarkEase(0,.28,landingAge);
    for(const [i,point] of vertices.entries()){
      const phase=point.u*7.2-age*10.5+point.index*1.83;
      const crest=.86+.27*Math.sin(phase)+.09*Math.sin(phase*1.8);
      const height=point.height*point.lift;
      const a=point.angle-age*1.28+point.tilt*height*.043+.075*Math.sin(phase-.6)*point.lift*lift;
      const r=point.radius+point.tilt*point.lift+.36*Math.sin(phase+.9)*point.lift*lift+.46*release*point.u;
      positions.setXYZ(i,Math.cos(a)*r,.07+height*crest*(.10+.90*lift)*(1+.13*release),Math.sin(a)*r);
    }
    positions.needsUpdate=true;
    floor.rotation.z=-age*.69;
    floor.material.uniforms.strength.value=.59*strength;
    border.material.uniforms.strength.value=.96*strength;
    border.material.uniforms.age.value=age;
  };
}

function stDarkChainTargets(origin,enemies,radius){
  const distance=([x,z],target)=>(x-target.point[0])**2+(z-target.point[1])**2;
  const remaining=enemies.filter(target=>distance(origin,target)<=radius**2);
  const chain=[];
  let from=origin;
  while(remaining.length&&chain.length<ST_DARKNESS_MAX_TARGETS){
    remaining.sort((a,b)=>Number(b.marked)-Number(a.marked)||distance(from,a)-distance(from,b));
    const next=remaining.shift();
    chain.push(next);
    from=next.point;
  }
  return chain;
}

function stDarkSecondaryBurst(parent,x,z,index){
  const group=new THREE.Group(),direction=index%2?1:-1;
  group.name='Darkness secondary cuts '+index;
  group.position.set(x,1.13,z);
  group.scale.setScalar(.68);
  parent.add(group);
  const middle=[.01,.13,-.09][(index-1)%3];
  const path=[[-1.78*direction,middle+.99,.23],[-.10*direction,middle+.39,.28],
    [1.86*direction,middle-.71,.21]];
  const whiteOuter=stDarkCut(group,path,.255,0x101019,11);
  const white=stDarkCut(group,path,.175,0xf7f8fc);
  return age=>{
    group.visible=age>=0&&age<ST_DARKNESS_CUT_LIFE;
    if(!group.visible)return;
    group.lookAt(cam.position);
    whiteOuter(age,ST_DARKNESS_CUT_LIFE);
    white(age,ST_DARKNESS_CUT_LIFE);
  };
}

function stDarkPose(actor,pose){
  const {back,roll,drop,arms,step}=pose;
  actor.b.position.y=-drop;
  actor.b.rotation.set(back,0,roll);
  actor.armR.rotation.set(-arms*.92,0,-arms*.52);
  actor.armL.rotation.set(-arms*.66,0,arms*.65);
  actor.legs[0].rotation.x=step;
  actor.legs[1].rotation.x=-step*.76;
  if(actor.rig){for(const limb of actor.rig)limb.w=1;rigSync(actor,0);}
}

function stDarkWake(parent,atTime,pointAt,heightAt,from,to,opacity=1,life=.74){
  const bands=7,count=61;
  const geometry=new THREE.BufferGeometry();
  const position=new THREE.BufferAttribute(new Float32Array(bands*count*6),3).setUsage(THREE.DynamicDrawUsage);
  const alpha=new THREE.BufferAttribute(new Float32Array(bands*count*2),1).setUsage(THREE.DynamicDrawUsage);
  const tone=new Float32Array(bands*count*2);
  const faces=[];
  for(let b=0;b<bands;b++)for(let j=0;j<count-1;j++){
    const a=(b*count+j)*2;
    faces.push(a,a+2,a+1,a+1,a+2,a+3);
  }
  geometry.setAttribute('position',position);
  geometry.setAttribute('opacityAlong',alpha);
  for(let b=0;b<bands;b++)tone.fill(b/Math.max(1,bands-1),b*count*2,(b+1)*count*2);
  geometry.setAttribute('bandTone',new THREE.BufferAttribute(tone,1));
  geometry.setIndex(faces);
  const material=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    vertexShader:`attribute float opacityAlong; attribute float bandTone; varying float vOpacity; varying float vTone;
      void main(){vOpacity=opacityAlong;vTone=bandTone;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying float vOpacity; varying float vTone;
      void main(){gl_FragColor=vec4(mix(vec3(.007,.008,.013),vec3(.048,.053,.070),vTone),vOpacity);
        #include <colorspace_fragment>
      }`
  });
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name='Darkness ricochet wake';
  mesh.frustumCulled=false;
  mesh.renderOrder=6;
  parent.add(mesh);
  const p=new THREE.Vector3(),forward=new THREE.Vector3(),back=new THREE.Vector3();
  return t=>{
    mesh.visible=t>from&&t<to+life;
    if(!mesh.visible)return;
    for(let j=0;j<count;j++){
      const age=j/(count-1)*life,born=t-age,d=atTime(born);
      pointAt(d,p);
      pointAt(d+.07,forward).sub(pointAt(d-.07,back));
      const length=Math.hypot(forward.x,forward.z)||1;
      const fade=(1-stDarkEase(.12,life,age))*stDarkEase(from,from+.027,born)
        *(1-stDarkEase(to-.035,to,born))*(1-stDarkEase(to+.51,to+.625,t));
      const trailOpacity=Math.pow(fade,.65);
      for(let b=0;b<bands;b++){
        const spread=(b-3)*(.065+.085*stDarkEase(0,.47,age));
        const angle=born*23+age*8+b*.47;
        const twist=spread*Math.cos(angle);
        const x=p.x+forward.z/length*twist,z=p.z-forward.x/length*twist;
        const y=1.09+heightAt(d)+spread*Math.sin(angle)+(b-3)*.032;
        const width=(b===0?.135:b<3?.071:.035)*(.28+.72*fade);
        const tear=b<3?1:(.42+.58*stDarkEase(-.58,.25,Math.sin(born*91+b*7.6+age*16)));
        const a=(b*count+j)*2;
        position.setXYZ(a,x,y-width,z);
        position.setXYZ(a+1,x,y+width,z);
        const bandOpacity=opacity*trailOpacity*(b===0?.99:b<3?.88:.74)*tear;
        alpha.setX(a,bandOpacity);
        alpha.setX(a+1,bandOpacity);
      }
    }
    position.needsUpdate=true;
    alpha.needsUpdate=true;
  };
}

function stDarkWakeShards(parent,atTime,pointAt,heightAt,from,to){
  const count=56;
  const mesh=new THREE.InstancedMesh(new THREE.OctahedronGeometry(.08,0),
    new THREE.MeshBasicMaterial({color:0x1c1c24,toneMapped:false}),count);
  mesh.name='Darkness trail shards';
  mesh.frustumCulled=false;
  parent.add(mesh);
  const piece=new THREE.Object3D(),point=new THREE.Vector3();
  return t=>{
    let n=0;
    for(let i=0;i<count;i++){
      const born=lerp(from,to,(i+.35)/count),age=t-born;
      const life=.22+(i%5)*.046;
      if(age<0||age>=life)continue;
      const d=atTime(born),angle=i*2.39996;
      pointAt(d,point);
      const drift=age*(.56+(i%6)*.25),fade=1-stDarkEase(life*.26,life,age);
      piece.position.set(point.x+Math.cos(angle)*drift,1.08+heightAt(d)+Math.sin(angle*.72)*drift,
        point.z+Math.sin(angle)*drift);
      piece.rotation.set(angle+age*9,angle*.71,-angle*.4+age*4);
      piece.scale.set(.51,.52+(i%4)*.31,1.25+(i%6)*.33).multiplyScalar(fade);
      piece.updateMatrix();
      mesh.setMatrixAt(n++,piece.matrix);
    }
    mesh.count=n;
    mesh.instanceMatrix.needsUpdate=true;
  };
}

function stDarkOrbCore(material=new THREE.MeshBasicMaterial({color:0x0d0d12})){
  return new THREE.Mesh(new THREE.SphereGeometry(1,32,24),material);
}

function stDarkOrbWeave(parent,pointAt,hopHeight){
  const ease=stDarkEase,tau=Math.PI*2,axis=new THREE.Vector3(),last=new THREE.Vector3();
  const strands=104,steps=37;
  const geometry=new THREE.BufferGeometry();
  const vertex=new THREE.BufferAttribute(new Float32Array(strands*steps*12),3).setUsage(THREE.DynamicDrawUsage);
  const color=new THREE.BufferAttribute(new Float32Array(vertex.array.length),3);
  const faces=[];
  for(let strand=0;strand<strands;strand++){
    const bright=strand>=96;
    const ink=new THREE.Color(bright?'#d6d8df':['#060609','#101015','#18181e','#24242b'][strand%4]);
    for(let j=0;j<steps;j++){
      const index=(strand*steps+j)*4;
      for(let q=0;q<4;q++)color.setXYZ(index+q,ink.r,ink.g,ink.b);
      if(j+1===steps)continue;
      faces.push(index,index+4,index+1,index+1,index+4,index+5,
        index+2,index+6,index+3,index+3,index+6,index+7);
    }
  }
  geometry.setAttribute('position',vertex);
  geometry.setAttribute('color',color);
  geometry.setIndex(faces);
  const fibers=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({
    vertexColors:true,side:THREE.DoubleSide,toneMapped:false
  }));
  fibers.frustumCulled=false;
  parent.add(fibers);
  const samples=Array.from({length:steps},()=>({p:new THREE.Vector3(),right:new THREE.Vector3()}));

  return (t,position,distance,amount,blend,squash,thin,coil)=>{
    fibers.visible=amount>.005;
    if(!fibers.visible)return;
    const trail=lerp(4.65,3.15,thin)*(1-.67*coil),lead=lerp(.6,.20,thin)*(1-.38*coil);
    for(let j=0;j<steps;j++){
      const s=j/(steps-1),sample=samples[j],d=distance+lead-s*trail;
      pointAt(d,sample.p);
      sample.p.y=hopHeight(d);
      pointAt(d+.13,axis).sub(pointAt(d-.13,last));
      axis.y=0;
      if(axis.lengthSq()<.001)axis.set(0,0,1);
      else axis.normalize();
      sample.right.set(axis.z,0,-axis.x);
    }
    for(let i=0;i<strands;i++){
      const bright=i>=96,seed=(i*.618034)%1;
      const outer=i>=66&&!bright;
      const angle=tau*seed+t*(8.1+(i%3)*.31)+coil*.56;
      const spread=bright?.39+.13*seed:outer?.85+.23*seed:.38+.50*seed;
      const end=bright?.59+(i%3)*.06:outer?.74+.25*seed:.55+.34*seed;
      const start=bright?.13:.014+(i%9)*.008;
      const thickness=bright?.017:.023+(i%5)*.005;
      const drift=(t*4.6+seed)%1;
      for(let j=0;j<steps;j++){
        const s=j/(steps-1),sample=samples[j];
        const angleAlong=angle+s*(3.2+1.5*seed)+.23*Math.sin(s*7+i*.4);
        const cap=Math.sqrt(Math.max(0,1-Math.pow(1-clamp(s/.25,0,1),2)));
        const profile=.66*cap*(1-.67*ease(.32,1,s));
        const pulse=.86+.14*Math.cos(tau*(s*1.6-drift));
        const radius=spread*profile*pulse*(1+.27*squash)*lerp(1,.26,thin)*(1+.19*coil);
        const side=Math.cos(angleAlong)*radius,vertical=Math.sin(angleAlong)*radius;
        const wrapAngle=angle+(s*4.7);
        const wrapRadius=(.42+.28*Math.sin(Math.PI*s))*spread;
        const x=lerp(position.x+Math.cos(wrapAngle)*wrapRadius,sample.p.x+sample.right.x*side,blend);
        const y=lerp(.05+2.19*s,1.10+sample.p.y+vertical,blend);
        const z=lerp(position.z+Math.sin(wrapAngle)*wrapRadius,sample.p.z+sample.right.z*side,blend);
        const fade=lerp(ease(.02,.16,s)*(1-ease(.85,.99,s)),
          ease(start,start+.095,s)*(1-ease(end-.15,end,s)),blend);
        const shed=bright?blend*(1-thin):1-thin*(i%3===0?.23:1);
        const width=thickness*amount*fade*shed*(.84+.16*pulse);
        const a=(i*steps+j)*4;
        vertex.setXYZ(a,x,y-width,z);
        vertex.setXYZ(a+1,x,y+width,z);
        vertex.setXYZ(a+2,x-sample.right.x*width,y,z-sample.right.z*width);
        vertex.setXYZ(a+3,x+sample.right.x*width,y,z+sample.right.z*width);
      }
    }
    vertex.needsUpdate=true;
  };
}

FXCODE.studio_darkness_dash=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  anchor.inner.visible=false;
  const root=new THREE.Group();
  root.name='Darkness dash preview';
  anchor.obj.add(root);
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{
    instance.updateDarknessDash=null;
    disposeTree(root);
    root.clear();
    root.removeFromParent();
  });

  const ease=stDarkEase;
  const look=getLook(NET.myId);
  const origin=[0,0];
  const enemies=[
    {id:'first-mark',point:[0,5.55],marked:true},
    {id:'near-unmarked',point:[3.2,2.5],marked:false},
    {id:'back-unmarked',point:[6.55,8.3],marked:false},
    {id:'right-unmarked',point:[9.7,5.6],marked:false},
    {id:'extra-in-range',point:[-6.9,4.2],marked:false},
    {id:'outside',point:[-14.9,5.0],marked:false}
  ];
  const chain=stDarkChainTargets(origin,enemies,ST_DARKNESS_RADIUS);
  const points=[origin,...chain.map(target=>target.point)];
  const [endX,endZ]=points.at(-1),[prevX,prevZ]=points.at(-2);
  const endLength=Math.hypot(endX-prevX,endZ-prevZ);
  points.push([endX+(endX-prevX)*1.25/endLength,endZ+(endZ-prevZ)*1.25/endLength]);
  const times=[.432,.542];
  for(let i=2;i<=chain.length;i++){
    const [x,z]=points[i],[px,pz]=points[i-1];
    const wait=i===2?ST_DARKNESS_MARK_HOLD:.015;
    times.push(times.at(-1)+wait+.135+Math.hypot(x-px,z-pz)*.009);
  }
  times.push(times.at(-1)+.20);
  const hits=times.slice(1,-1);
  const firstDeparture=hits[0]+ST_DARKNESS_MARK_HOLD;
  const landingTime=times.at(-1);
  const path=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z)));
  const divisions=160;
  const travel=[0];
  const positions=path.getPoints(divisions);
  for(let i=1;i<=divisions;i++)travel[i]=travel[i-1]+positions[i].distanceTo(positions[i-1]);
  const position=new THREE.Vector3(),axis=new THREE.Vector3(),normal=new THREE.Vector3(),last=new THREE.Vector3();
  const pointAt=(distance,out)=>{
    if(distance<0)return out.set(0,0,distance);
    let lo=0,hi=divisions;
    while(hi-lo>1){const mid=(lo+hi)>>1;if(travel[mid]<=distance)lo=mid;else hi=mid;}
    return out.copy(positions[lo]).lerp(positions[hi],clamp((distance-travel[lo])/(travel[hi]-travel[lo]),0,1));
  };
  const distanceAt=t=>{
    const step=clamp(t,0,1)*divisions,lo=Math.min(divisions-1,Math.floor(step));
    return lerp(travel[lo],travel[lo+1],step-lo);
  };
  const stops=points.map((_,i)=>distanceAt(i/(points.length-1)));
  const hopHeight=distance=>{
    for(let i=1;i<stops.length-1;i++)if(distance>=stops[i]&&distance<stops[i+1]){
      const u=(distance-stops[i])/(stops[i+1]-stops[i]);
      return Math.sin(Math.PI*u)*(.12+(i%2)*.085);
    }
    return 0;
  };
  const atTime=t=>{
    let i=0;
    while(i<times.length-2&&t>=times[i+1])i++;
    const start=i===1?firstDeparture:times[i]+(i>1?.015:0);
    const phase=clamp((t-start)/(times[i+1]-start),0,1);
    const move=1-Math.pow(1-phase,i===0?1.77:1.9);
    return distanceAt((i+move)/(points.length-1));
  };
  const student=(id,x,z,variant)=>{
    const appearance=variant?{...look,h:variant%4,cl:variant%4,hs:variant}:look;
    const actor=makeStudent(appearance,id);
    actor.g.name=id;
    root.add(actor.g);
    actor.g.position.set(x,0,z);
    actor.g.rotation.y=variant?Math.atan2(-x,-z):0;
    useFileModel(actor,'char_student',lookTint(appearance),appearance);
    return actor;
  };
  const caster=student('darkness-studio-caster',...origin,0);
  const actors=enemies.map(({id,point,marked},i)=>{
    const actor=student('darkness-studio-target-'+id,...point,i+1);
    if(marked)actor.updateDarknessMark=stDarkTargetMark(actor.g);
    return actor;
  });
  const targets=chain.map(target=>actors[enemies.indexOf(target)]);
  const wake=stDarkWake(root,atTime,pointAt,hopHeight,firstDeparture,landingTime);
  const wakeShards=stDarkWakeShards(root,atTime,pointAt,hopHeight,firstDeparture,landingTime);
  const darkMat=new THREE.MeshBasicMaterial({color:0x0d0d12});
  const egg=stDarkOrbCore(darkMat);
  egg.name='Darkness initial dash orb';
  root.add(egg);
  const windup=new THREE.Group();
  windup.position.set(0,1.07,0);
  root.add(windup);
  const launchWave=stDarkPressure(windup);
  const orb=new THREE.Group();
  root.add(orb);
  orb.add(new THREE.Mesh(new THREE.SphereGeometry(.16,20,14),new THREE.MeshBasicMaterial({color:0x09090e})));
  const eyeMat=new THREE.MeshBasicMaterial({color:0xf1f2f4,toneMapped:false});
  for(const x of [-.052,.052]){
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.024,10,8),eyeMat);
    eye.position.set(x,.024,.148);
    orb.add(eye);
  }
  const impacts=hits.map((_,j)=>{
    const [x,z]=points[j+1];
    return chain[j].marked?stDarkMarkedBurst(root,x,z):stDarkSecondaryBurst(root,x,z,j);
  });
  const area=stDarkSlashArea(root,origin,ST_DARKNESS_RADIUS);
  const shove=hits.map((_,j)=>{
    const v=path.getTangent((j+1)/(points.length-1));
    return new THREE.Vector2(v.x,v.z).normalize();
  });
  const chips=hits.map((_,j)=>Array.from({length:j===0?47:7},(_,i)=>{
    const spark=new THREE.Mesh(new THREE.OctahedronGeometry(j===0?.12:.09,0),i%7===0&&j===0?eyeMat:darkMat);
    root.add(spark);
    return spark;
  }));

  const weave=stDarkOrbWeave(root,pointAt,hopHeight);

  let lastTime=-1;
  function update(){
    const t=instance.t;
    for(const [j,target] of targets.entries())target.updateDarknessMark?.(t-.035,hits[j]-.035);
    windup.lookAt(cam.position);
    impacts.forEach((effect,i)=>effect(t-hits[i]));
    area(t, t-landingTime);
    if(t===lastTime)return;
    lastTime=t;
    const distance=atTime(t);
    pointAt(distance,position);
    pointAt(distance+.12,axis).sub(pointAt(distance-.12,last));
    const turn=Math.atan2(axis.x,axis.z);
    const collapse=ease(.105,.30,t),release=ease(landingTime-.015,landingTime+.26,t);
    const thin=ease(hits[0]+.012,hits[0]+.096,t);
    const contact=1-.86*ease(hits[0],hits[0]+.10,t)*(1-ease(firstDeparture-.064,firstDeparture+.026,t));
    const amount=collapse*(1-release)*contact;
    const blend=ease(.272,.335,t)*(1-ease(landingTime-.022,landingTime+.16,t));
    const coil=ease(.31,times[0]-.017,t)*(1-ease(times[0],times[0]+.047,t));
    const charge=ease(.302,times[0],t);
    const launchAge=t-times[0];
    launchWave(launchAge<0?lerp(1.28,.32,charge):.44+1.23*ease(0,.09,launchAge),
      launchAge<0?.70*ease(.304,.343,t):.87*(1-ease(.015,.127,launchAge)),t*18);
    const squash=ease(hits[0]-.028,hits[0],t)*(1-ease(hits[0],hits[0]+.095,t));
    caster.g.visible=t<.307||t>landingTime+.075;
    caster.g.position.copy(position);
    caster.g.rotation.y=turn;
    const landing=ease(landingTime+.062,landingTime+.125,t)*(1-ease(landingTime+.15,landingTime+.37,t));
    stDarkPose(caster,{back:.26*landing,roll:-.13*landing,drop:.19*landing,arms:.4*landing,step:.26*landing});
    orb.visible=t<.30||t>landingTime+.074;
    const petScale=t<.34?1-.82*collapse:.24+.76*release;
    orb.scale.setScalar(petScale);
    orb.position.copy(position).add(normal.set(.47*petScale,1.57+.065*Math.sin(t*6),.10));
    orb.rotation.y=turn;
    egg.visible=blend>.08&&amount>.04&&thin<.985;
    egg.position.copy(position).add(normal.set(0,1.1,0)).addScaledVector(axis.normalize(),.11);
    egg.rotation.y=turn;
    const dissolving=blend*(1-thin);
    egg.scale.set((.44+.19*squash+.07*coil)*dissolving,(.53+.08*squash)*dissolving,
      (.64-.26*squash-.23*coil)*dissolving);
    for(const [j,target] of targets.entries()){
      const age=t-hits[j];
      const heavy=j===0;
      const hit=ease(0,.048,age)*(1-ease(heavy?.14:.084,heavy?.46:.32,age));
      const buckle=ease(.035,.11,age)*(1-ease(.135,heavy?.43:.33,age));
      const [x,z]=points[j+1],push=shove[j],shift=hit*(heavy?.84:.25);
      target.g.position.set(x+push.x*shift,0,z+push.y*shift);
      target.g.rotation.y=Math.atan2(-push.x,-push.y)+(j%2?1:-1)*hit*.28;
      stDarkPose(target,{back:(heavy?-.69:-.38)*hit+.16*buckle,roll:(j%2?1:-1)*hit*.30,
        drop:(heavy?.23:.13)*buckle,arms:(heavy?.94:.66)*hit,step:(heavy?.55:.32)*hit});
      for(const [i,spark] of chips[j].entries()){
        const lifetime=heavy?.24+(i%4)*.034:.13;
        spark.visible=age>=0&&age<lifetime;
        if(!spark.visible)continue;
        const a=i*2.39996+j*.9,speed=heavy?9.5+(i%9)*1.33:4.8;
        const scatter=(1-Math.pow(1-age/lifetime,1.57))*speed*lifetime;
        spark.position.set(x+Math.cos(a)*scatter+push.x*age*2.5,
          1.05+Math.sin(a*.63)*scatter*.69-age*age*3,z+Math.sin(a)*scatter+push.y*age*2.5);
        spark.rotation.set(a+age*9,a*.7,a*.43-age*13);
        const fade=1-ease(lifetime*.34,lifetime,age);
        spark.scale.set(.51+i%3*.12,heavy?1.38+i%5*.29:1.31,.48).multiplyScalar(fade);
      }
    }
    wake(t);
    wakeShards(t);
    weave(t,position,distance,amount,blend,squash,thin,coil);
  }
  instance.updateDarknessDash=update;
  update();
};
