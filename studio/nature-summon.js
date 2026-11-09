// The Studio timeline drives the same motion as the approved summon capture.
// Use the GPU for the woven mesh so scrubbing does not copy its vertices.
const ST_NATURE_SUMMON='nature/tree_summon';
const ST_NATURE_TREE_MODEL='nature_ult_tree_branches_v1';
const ST_NATURE_WALL_PREVIEWS=new Set([
  'nature/wood_wall_growth_study','nature/wood_wall_break_study','nature/wood_wall_burn_study',
  'nature/wood_wall_expire_study'
]);
const ST_NATURE_TREE_PREVIEWS=new Set([
  ST_NATURE_SUMMON,
  'nature/tree_break_study',
  'nature/tree_expire_study'
]);

FXCODE.studio_nature_wall_growth=(_x,_y,_h,args,instance)=>{
  const mesh=instance.L.find(layer=>layer.d.id===args.layer)?.inner;
  if(!mesh)return;
  const material=mesh.material;
  const time={value:instance.t};
  const priorCompile=material.onBeforeCompile;
  const key=material.customProgramCacheKey();
  material.customProgramCacheKey=()=>key+':studio-nature-wall-growth';
  material.onBeforeCompile=(shader,renderer)=>{
    priorCompile.call(material,shader,renderer);
    shader.uniforms.uWallGrowthTime=time;
    shader.vertexShader='uniform float uWallGrowthTime;\nvarying float vWallSap;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`$&
      float x=position.x;
      float y=position.y;
      float arc=sqrt(max(0.0,324.0-x*x))-18.0;
      float fromBend=position.z-arc;
      float root=(1.0-smoothstep(0.14,0.48,y))*smoothstep(0.42,0.76,abs(fromBend));
      float along=abs(x)*0.043+0.025*sin(x*2.8);
      float rootAge=uWallGrowthTime-0.03-along;
      float reach=smoothstep(0.0,0.29,rootAge);
      float riseAge=uWallGrowthTime-0.16-along;
      float lift=smoothstep(0.0,0.40,riseAge);
      float flex=sin(13.0*riseAge)*smoothstep(0.0,0.18,riseAge)
        *(1.0-smoothstep(0.24,0.59,riseAge))*smoothstep(0.2,3.0,y);
      transformed.z=mix(position.z,arc+fromBend*reach,root)+0.26*flex;
      transformed.x+=0.22*flex*sin(x*1.5+y);
      transformed.y=mix(mix(-0.40,y,lift),mix(-0.055,y,reach),root)+0.12*flex;
      float front=smoothstep(0.07,0.43,riseAge)*3.6;
      vWallSap=(1.0-smoothstep(0.04,0.37,abs(y-front)))
        *smoothstep(0.03,0.14,riseAge)*(1.0-smoothstep(0.33,0.57,riseAge));
    `);
    shader.fragmentShader='varying float vWallSap;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vWallSap*vec3(0.026,0.16,0.035);');
  };
  material.needsUpdate=true;
  const leafGeo=fxMeshGeo('wind_leaf');
  const leafMaterial=new THREE.MeshStandardMaterial({
    side:THREE.DoubleSide,roughness:0.72,emissive:0x274b13,emissiveIntensity:0.35
  });
  const leafCount=22;
  const leaves=leafGeo&&new THREE.InstancedMesh(leafGeo,leafMaterial,leafCount);
  const pose=new THREE.Object3D();
  const leafColors=[0x8bcc43,0x548d27,0xc0e071,0x639d34].map(color=>new THREE.Color(color));
  if(leaves){
    leaves.frustumCulled=false;
    leaves.count=0;
    mesh.add(leaves);
  }
  // Studio samples this before drawing, including after a direct seek.
  const smooth=t=>THREE.MathUtils.smoothstep(t,0,1);
  instance.updateNatureWeave=()=>{
    const t=time.value=instance.t;
    if(!leaves)return;
    let count=0;
    for(let i=0;i<leafCount;i++){
      const age=t-0.68-(i%5)*0.07;
      const fade=smooth(age/0.26)*(1-smooth((t-1.65-(i%3)*0.12)/0.45));
      if(fade<=0)continue;
      const a=i*2.39996+age*(1.8+(i%4)*0.13);
      const drift=1+0.11*smooth(age);
      pose.position.set(Math.cos(a)*(4.4+(i%4)*0.29)*drift,
        3.15+(i%5)*0.16+0.28*Math.sin(a*2+i)-0.35*smooth(age),
        -0.22+Math.sin(a)*(0.72+(i%4)*0.19)*drift);
      pose.rotation.set(a*1.65+i,a+0.8,i*0.31-age*3);
      pose.scale.setScalar((1.18+(i%4)*0.25)*fade);
      pose.updateMatrix();
      leaves.setMatrixAt(count,pose.matrix);
      leaves.setColorAt(count++,leafColors[i%leafColors.length]);
    }
    leaves.count=count;
    if(count){leaves.instanceMatrix.needsUpdate=true;leaves.instanceColor.needsUpdate=true;}
  };
  material.addEventListener('dispose',()=>{
    delete instance.updateNatureWeave;
    if(leaves){mesh.remove(leaves);leaves.dispose();}
    leafMaterial.dispose();
  });
};

FXCODE.studio_nature_wall_expire=(_x,_y,_h,args,instance)=>{
  const mesh=instance.L.find(layer=>layer.d.id===args.layer)?.inner;
  if(!mesh)return;
  const material=mesh.material,time={value:instance.t};
  const priorCompile=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.customProgramCacheKey=()=>key+':studio-nature-wall-expire';
  material.onBeforeCompile=(shader,renderer)=>{
    priorCompile.call(material,shader,renderer);
    shader.uniforms.uWallExpireTime=time;
    shader.vertexShader='varying vec3 vWallExpireLocal;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvWallExpireLocal=position;');
    shader.fragmentShader='uniform float uWallExpireTime;\nvarying vec3 vWallExpireLocal;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`$&
      vec3 local=vWallExpireLocal;
      vec2 samplePos=local.xy+vec2(local.z*0.83,local.z*0.31);
      float pockets=barkNoise(samplePos*vec2(2.2,2.85));
      float chips=barkNoise(samplePos*vec2(9.8,12.4));
      float grain=barkNoise(samplePos*vec2(22.0,35.0));
      float front=mix(5.25,-1.35,smoothstep(0.43,2.44,uWallExpireTime));
      float remaining=front-local.y-(pockets-0.5)*1.82-(chips-0.5)*0.51-(grain-0.5)*0.13;
      if(remaining<0.0)discard;
      float glowEdge=(1.0-smoothstep(0.028,0.14,remaining))*mix(0.22,1.0,chips);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=glowEdge*vec3(0.25,1.15,0.095);');
  };
  material.needsUpdate=true;
  instance.updateNatureWeave=()=>{time.value=instance.t;};
  material.addEventListener('dispose',()=>{delete instance.updateNatureWeave;});
};

FXCODE.studio_nature_wall_break=(_x,_y,_h,args,instance)=>{
  const time={value:instance.t};
  const beats={value:new THREE.Vector3(args.crack,args.strain,args.breakAt)};
  const pieces=args.pieces.map(id=>instance.L.find(layer=>layer.d.id===id)?.inner);
  // Pivot X, fall direction, fall delay, and separation for each piece.
  const motions=[[-4.1,1,0.12,-0.64],[-0.95,-1,0.02,-0.27],[1.85,1,0.00,0.26],[4.12,-1,0.17,0.62]];
  for(const [index,mesh] of pieces.entries()){
    if(!mesh)continue;
    const material=mesh.material;
    const priorCompile=material.onBeforeCompile;
    const key=material.customProgramCacheKey();
    material.customProgramCacheKey=()=>key+':studio-nature-wall-break';
    material.onBeforeCompile=(shader,renderer)=>{
      priorCompile.call(material,shader,renderer);
      shader.uniforms.uWallTime=time;
      shader.uniforms.uWallBeats=beats;
      shader.uniforms.uWallPiece={value:index};
      shader.uniforms.uWallMotion={value:new THREE.Vector4(...motions[index])};
      const common=`
uniform float uWallTime,uWallPiece;
uniform vec3 uWallBeats;
uniform vec4 uWallMotion;
varying vec2 vWallLocal;
vec3 wallSeams(float y){
  return vec3(-2.57,0.65,3.03)
    +vec3(0.15,-0.05,-0.18)*(y-1.6)
    +vec3(0.22,0.22,0.19)*sin(y*vec3(3.3,3.8,4.4)+vec3(2.1,0.0,1.3))
    +vec3(0.075,0.095,0.085)*sin(y*vec3(11.6,11.0,9.1)+vec3(0.4,0.0,2.7));
}
`;
      shader.vertexShader=common+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`$&
        vWallLocal=position.xy;
        float age=uWallTime-uWallBeats.z;
        float strain=smoothstep(0.0,0.27,uWallTime-uWallBeats.y);
        float crackKick=max(0.0,uWallTime-uWallBeats.x);
        float strainKick=max(0.0,uWallTime-uWallBeats.y);
        float kick=sin(35.0*crackKick)*exp(-12.0*crackKick)*0.10
          +sin(25.0*strainKick)*exp(-8.0*strainKick)*0.18;
        float upper=smoothstep(0.15,3.25,position.y);
        transformed.z-=upper*(kick+strain*(0.18+0.16*sin(position.x*0.60)));
        if(age>=0.0){
          float open=smoothstep(0.0,0.23,age);
          float lag=uWallMotion.z;
          float fall=pow(smoothstep(lag,lag+0.60,age),1.25);
          float tilt=uWallMotion.y*(0.10*open+1.38*fall);
          float arc=sqrt(max(0.0,324.0-position.x*position.x))-18.0;
          float depth=transformed.z-arc;
          float roots=(1.0-smoothstep(0.10,0.42,position.y))*smoothstep(0.62,1.04,abs(depth));
          float softBump=sin(3.14159*smoothstep(lag+0.60,lag+0.78,age))*0.08;
          float landedY=transformed.y*cos(tilt)-depth*sin(tilt)+0.54*abs(sin(tilt));
          float landedZ=arc+transformed.y*sin(tilt)+depth*cos(tilt);
          float yaw=uWallMotion.w*0.22*fall;
          vec2 ground=vec2(position.x-uWallMotion.x,landedZ-arc);
          ground=mat2(cos(yaw),sin(yaw),-sin(yaw),cos(yaw))*ground;
          transformed.x=uWallMotion.x+ground.x+uWallMotion.w*open;
          transformed.z=mix(arc+ground.y,position.z,roots*fall)+uWallMotion.y*0.42*open;
          transformed.y=mix(max(0.015,landedY),position.y,roots*fall)+softBump;
        }
      `);
      shader.fragmentShader=common+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`$&
        vec3 wallOffset=vWallLocal.x-wallSeams(vWallLocal.y);
        if(uWallTime>=uWallBeats.z){
          float piece=dot(step(vec3(0.0),wallOffset),vec3(1.0));
          if(abs(piece-uWallPiece)>0.5)discard;
          float fadeAge=uWallTime-uWallBeats.z-uWallMotion.z-0.64;
          float vanish=smoothstep(0.0,0.29,fadeAge);
          float fromEdge=min(abs(wallOffset.x),min(abs(wallOffset.y),abs(wallOffset.z)));
          float erosion=0.74*clamp(fromEdge/2.55,0.0,1.0)
            +0.24*barkNoise(vWallLocal*vec2(11.0,8.0));
          if(erosion<vanish)discard;
        }
      `);
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`$&
        float wallY=vWallLocal.y;
        float wallChip=smoothstep(0.0,0.19,uWallTime-uWallBeats.x);
        float wallStrain=smoothstep(0.0,0.27,uWallTime-uWallBeats.y);
        float wallSpan=0.58*wallChip+1.52*wallStrain;
        float wallTrunk=1.0-smoothstep(wallSpan,wallSpan+0.15,abs(wallY-1.63));
        float wallBranch=abs(vWallLocal.x-wallSeams(1.97).y
          -(wallY-1.97)*1.48-0.12*sin((wallY-1.97)*14.0));
        float wallFork=smoothstep(1.86,2.01,wallY)*(1.0-smoothstep(2.88,3.13,wallY));
        float wallWidth=0.041+wallStrain*0.074;
        float wallCore=wallTrunk*(1.0-smoothstep(wallWidth*0.68,wallWidth,abs(wallOffset.y)));
        wallCore=max(wallCore,wallStrain*wallFork*(1.0-smoothstep(0.027,0.053,wallBranch)));
        float wallEdge=wallTrunk*(1.0-smoothstep(wallWidth,wallWidth+0.058,abs(wallOffset.y)));
        float sideSpan=wallStrain*1.70;
        float leftSpan=1.0-smoothstep(sideSpan,sideSpan+0.15,abs(wallY-1.38));
        float rightSpan=1.0-smoothstep(sideSpan,sideSpan+0.15,abs(wallY-1.88));
        vec2 sideDist=abs(wallOffset.xz);
        vec2 sideCore=(1.0-smoothstep(vec2(0.044),vec2(0.097),sideDist))*vec2(leftSpan,rightSpan)*wallStrain;
        vec2 sideEdge=(1.0-smoothstep(vec2(0.090),vec2(0.149),sideDist))*vec2(leftSpan,rightSpan)*wallStrain;
        wallCore=max(wallCore,max(sideCore.x,sideCore.y));
        wallEdge=max(wallEdge,max(sideEdge.x,sideEdge.y));
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.51,0.25,0.083),wallChip*wallEdge*0.74);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.045,0.019,0.008),wallChip*wallCore*0.95);
      `);
    };
    material.needsUpdate=true;
    material.addEventListener('dispose',()=>{delete instance.updateNatureWeave;});
  }
  instance.updateNatureWeave=()=>{
    time.value=instance.t;
    for(let i=1;i<pieces.length;i++)if(pieces[i])pieces[i].visible=instance.t>=args.breakAt;
  };
  instance.updateNatureWeave();
};

FXCODE.studio_nature_wall_burn=(_x,_y,_h,args,instance)=>{
  const mesh=instance.L.find(layer=>layer.d.id===args.layer)?.inner;
  if(!mesh)return;
  const material=mesh.material;
  const time={value:instance.t},impact={value:new THREE.Vector3(...args.impact)};
  const priorCompile=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.customProgramCacheKey=()=>key+':studio-nature-wall-burn';
  material.onBeforeCompile=(shader,renderer)=>{
    priorCompile.call(material,shader,renderer);
    shader.uniforms.uWallBurnTime=time;
    shader.uniforms.uWallBurnImpact=impact;
    shader.vertexShader='varying vec3 vWallBurnLocal;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvWallBurnLocal=position;');
    shader.fragmentShader='varying vec3 vWallBurnLocal;\nuniform float uWallBurnTime;\nuniform vec3 uWallBurnImpact;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`$&
      vec3 offset=vWallBurnLocal-uWallBurnImpact;
      float heatAge=max(0.0,uWallBurnTime-0.39);
      float charNoise=barkNoise(vWallBurnLocal.xy*vec2(7.0,3.6));
      float drift=0.25*sin(vWallBurnLocal.y*3.7);
      float distanceFromHit=length(vec3((offset.x+drift)*0.86,offset.y*0.62-0.24,offset.z*0.92));
      float unevenDistance=distanceFromHit+0.20*charNoise;
      float edge=unevenDistance-(0.20+1.54*smoothstep(0.0,3.2,heatAge));
      float ignition=smoothstep(0.0,0.30,heatAge);
      float heated=(1.0-smoothstep(-0.12,0.17,edge))*ignition;
      float charAge=heatAge-unevenDistance*1.65;
      float charred=heated*smoothstep(0.20,2.32,charAge);
      float heat=heated*mix(0.32,1.0,smoothstep(0.40,0.80,charNoise))*(1.0-smoothstep(0.0,2.50,charAge))
        *(1.0-smoothstep(4.35,5.45,heatAge));
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.24,0.069,0.021),heated*0.54);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.013,0.009,0.006)*(0.70+charNoise*0.60),charred*0.97);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(0.82,0.105,0.009)*heat;');
  };
  material.needsUpdate=true;
  instance.updateNatureWeave=()=>{time.value=instance.t;};
  material.addEventListener('dispose',()=>{delete instance.updateNatureWeave;});
};

// Shared by Model view, the summon effect, and the review capture. Keep the
// original material available through a zero mix for direct comparisons.
function stNatureTreeWaist(material){
  const mix={value:new URLSearchParams(location.search).has('bodybase')?0:1};
  const previous=material.onBeforeCompile;
  const key=material.customProgramCacheKey();
  material.userData.natureWaist=mix;
  material.customProgramCacheKey=()=>key+':nature-waist';
  material.onBeforeCompile=(shader,renderer)=>{
    previous.call(material,shader,renderer);
    shader.uniforms.uNatureWaistMix=mix;
    shader.vertexShader='uniform float uNatureWaistMix;\nvarying float vRootTone,vWaistGlow;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace(/vModelEmit=[^;]+;/,`$&
      float waistDistance=(position.y-7.2)/3.65;
      float center=exp(-waistDistance*waistDistance);
      float inner=1.0-0.68*smoothstep(0.70,1.52,length(position.xz));
      float authoredNeon=smoothstep(0.33,0.62,aEmit);
      float roots=smoothstep(0.9,4.1,position.y);
      float waistMask=uNatureWaistMix*center*inner*authoredNeon;
      vRootTone=mix(1.0,0.56+0.44*roots,uNatureWaistMix);
      vWaistGlow=waistMask*clamp(vModelEmit/max(aEmit,0.001),0.0,1.0);
      vModelEmit*=mix(1.0,0.58+0.42*roots,uNatureWaistMix)*(1.0+6.0*waistMask);
    `);
    shader.fragmentShader='varying float vRootTone,vWaistGlow;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\ndiffuseColor.rgb*=vRootTone;');
    shader.fragmentShader=shader.fragmentShader.replace('totalEmissiveRadiance+=diffuseColor.rgb*vModelEmit;',
      'totalEmissiveRadiance+=diffuseColor.rgb*vModelEmit+vec3(0.016,1.65,0.105)*vWaistGlow;');
  };
  material.needsUpdate=true;
}

FXCODE.studio_nature_weave=(_x,_y,_h,args,instance)=>{
  const layer=instance.L.find(layer=>layer.d.id===args.layer);
  const mesh=layer?.inner;
  if(!mesh?.geometry.getAttribute('aEmit')||!mesh.material.userData.fxEmission)return;
  const material=mesh.material;
  const time={value:0};
  const priorCompile=material.onBeforeCompile;
  const programKey=material.customProgramCacheKey();
  material.customProgramCacheKey=()=>programKey+':studio-nature-weave';
  material.onBeforeCompile=(shader,renderer)=>{
    priorCompile.call(material,shader,renderer);
    shader.uniforms.uWeaveTime=time;
    shader.vertexShader=`
uniform float uWeaveTime;
varying float vWeaveArrival;
float weaveSmooth(float v){float t=clamp(v,0.0,1.0);return t*t*(3.0-2.0*t);}
`+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('vModelEmit=aEmit;',`
      float y=position.y;
      float radius=length(position.xz);
      float angle=radius>0.00001?atan(position.z,position.x):0.0;
      float rootSpread=0.055*radius*(1.0-weaveSmooth((y-2.0)/2.0));
      float branchSpread=0.061*radius*weaveSmooth((y-9.0)/4.0);
      vWeaveArrival=0.20+0.167*y+rootSpread+branchSpread
        +0.10*sin(angle*3.0-y*1.05)*weaveSmooth(y/3.0);
      float age=uWeaveTime-vWeaveArrival;
      float twist=0.83*(1.0-weaveSmooth(age/0.58))*weaveSmooth(y/3.0)*(1.0-weaveSmooth((y-12.0)/3.0));
      float cycle=uWeaveTime*1.04719755;
      float height=max(0.0,(y-14.0)/13.0);
      float flex=height*height*min(1.0,radius/7.0);
      float phase=cycle+angle*0.7+y*0.18;
      transformed.x=position.x*cos(twist)-position.z*sin(twist)+flex*0.19*sin(phase);
      transformed.y+=flex*0.11*sin(phase-0.7);
      transformed.z=position.x*sin(twist)+position.z*cos(twist)+flex*0.14*cos(phase-0.4);
      float wave=pow(clamp(0.5+0.5*cos(y*0.65-cycle*2.0-radius*0.19),0.0,1.0),5.0);
      vModelEmit=aEmit*(0.68+wave*0.85)*weaveSmooth(age/0.32);
    `);
    shader.fragmentShader='uniform float uWeaveTime;\nvarying float vWeaveArrival;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',
      '#include <clipping_planes_fragment>\nif(vWeaveArrival>uWeaveTime)discard;');
  };
  if(layer.d.model===ST_NATURE_TREE_MODEL)stNatureTreeWaist(material);
  material.needsUpdate=true;

  const textureCanvas=document.createElement('canvas');
  textureCanvas.width=textureCanvas.height=64;
  const ctx=textureCanvas.getContext('2d');
  const gradient=ctx.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'rgba(130,255,100,1)');
  gradient.addColorStop(.18,'rgba(50,230,65,.65)');
  gradient.addColorStop(1,'rgba(0,180,40,0)');
  ctx.fillStyle=gradient;
  ctx.fillRect(0,0,64,64);
  const texture=new THREE.CanvasTexture(textureCanvas);
  const motes=Array.from({length:18},()=>{
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({
      map:texture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending
    }));
    mesh.add(sprite);
    return sprite;
  });
  const ribbons=Array.from({length:3},()=>{
    const geometry=new THREE.BufferGeometry();
    const points=new THREE.BufferAttribute(new Float32Array(41*6),3);
    geometry.setAttribute('position',points);
    const faces=[];
    for(let i=0;i<80;i+=2)faces.push(i,i+1,i+2,i+1,i+3,i+2);
    geometry.setIndex(faces);
    const ribbon=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({
      color:new THREE.Color('#38fb55').multiplyScalar(2.2),side:THREE.DoubleSide,
      transparent:true,depthWrite:false,blending:THREE.AdditiveBlending
    }));
    ribbon.frustumCulled=false;
    mesh.add(ribbon);
    return ribbon;
  });
  const clamp=v=>Math.max(0,Math.min(1,v));
  const smooth=v=>{const t=clamp(v);return t*t*(3-2*t);};
  const radiusAt=y=>1.13+.72*Math.exp(-y*.40)+.71*smooth((y-9)/5);
  const speed=Number.isFinite(args.speed)&&args.speed>0?args.speed:1.5;
  let lastTime=-1;
  function update(){
    const t=instance.t*speed;
    if(t===lastTime)return;
    lastTime=time.value=t;
    const frontY=clamp((t-.2)/2.46)*14.7;
    const heading=t*5.8;
    const fade=smooth((t-.28)/.28)*(1-smooth((t-2.62)/.35));
    for(const [j,ribbon] of ribbons.entries()){
      ribbon.visible=fade>.001;
      if(!ribbon.visible)continue;
      ribbon.material.opacity=fade*(j===0?.76:.50);
      const points=ribbon.geometry.getAttribute('position');
      for(let k=0;k<=40;k++){
        const tail=k/40,angle=heading+j*Math.PI*2/3-tail*3.55;
        const y=Math.max(.08,frontY-tail*3.15-j*.21),r=radiusAt(y)+.24*tail;
        const width=.26*(1-tail)**1.4;
        points.setXYZ(k*2,Math.cos(angle)*r,y-width,Math.sin(angle)*r);
        points.setXYZ(k*2+1,Math.cos(angle)*r,y+width,Math.sin(angle)*r);
      }
      points.needsUpdate=true;
    }
    for(const [j,mote] of motes.entries()){
      let angle,y,r,size,opacity;
      if(t<3.05&&j<3){
        y=Math.max(.08,frontY-j*.21);angle=heading+j*Math.PI*2/3;r=radiusAt(y);
        size=.84;opacity=fade*.92;
      }else if(t<3.05){
        const age=(t*2.5+j*.171)%1;
        y=Math.max(.1,frontY-age*2.55);angle=heading+(j%3)*Math.PI*2/3-age*2.4;r=1.32+.95*age;
        size=.20+.17*(1-age);opacity=fade*Math.sin(age*Math.PI)*.87;
      }else{
        const age=(t/6+j/18)%1;
        angle=j*2.399;y=17+(j%4)*1.6+age*4;r=6+(j%5)*1.4;
        size=.12+.08*Math.sin(age*Math.PI);
        opacity=Math.sin(age*Math.PI)*.45*smooth((t-3.6)/1.2);
      }
      mote.position.set(Math.cos(angle)*r,y,Math.sin(angle)*r);
      mote.scale.setScalar(size);
      mote.material.opacity=opacity;
    }
  }
  // Update before the renderer sorts transparent children, including at a seek.
  instance.updateNatureWeave=update;
  update();
  material.addEventListener('dispose',()=>{
    delete instance.updateNatureWeave;
    texture.dispose();
    for(const mote of motes){mesh.remove(mote);mote.material.dispose();}
    for(const ribbon of ribbons){mesh.remove(ribbon);ribbon.geometry.dispose();ribbon.material.dispose();}
  });
};

// Ending studies share the approved tree material. Progress is sampled from
// the Studio timeline, so replay and direct seeks show the same movement.
FXCODE.studio_nature_ending=(_x,_y,_h,args,instance)=>{
  const mesh=instance.L.find(layer=>layer.d.id===args.layer)?.inner;
  if(!mesh?.material.userData.fxEmission)return;

  const material=mesh.material;
  stNatureTreeWaist(material);
  const time={value:instance.t};
  const broken={value:args.broken===true?1:0};
  const compile=material.onBeforeCompile;
  const cacheKey=material.customProgramCacheKey();
  material.customProgramCacheKey=()=>cacheKey+':nature-ending';
  material.onBeforeCompile=(shader,renderer)=>{
    compile.call(material,shader,renderer);
    shader.uniforms.uNatureEndTime=time;
    shader.uniforms.uNatureEndBreak=broken;
    shader.vertexShader=`
uniform float uNatureEndTime,uNatureEndBreak;
varying float vNatureLoss,vNatureHit;
varying vec2 vNatureFibre;
`+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      float height=position.y;
      float radius=length(position.xz);
      vec2 outward=position.xz/max(radius,0.001);
      float angle=radius>0.001?atan(position.z,position.x):0.0;
      float stagger=0.5+0.5*sin(angle*5.0+height*0.41);
      float endTime=uNatureEndTime;
      vNatureHit=0.0;
      if(uNatureEndBreak>0.5){
        float waistDistance=(height-7.2)/3.2;
        float waist=exp(-waistDistance*waistDistance);
        float pressure=smoothstep(0.06,0.43,endTime);
        float pressureFade=exp(-6.5*max(0.0,endTime-0.50));
        float swell=pressure*waist*1.34*pressureFade;
        transformed.xz*=1.0+swell;
        float seam=height-(7.2+0.36*sin(3.0*angle)+0.18*sin(8.0*angle));
        float upper=smoothstep(-0.14,0.14,seam);
        // Strain builds into the split. The tip of each bough reacts a beat
        // later than its base while the outer root tips stay planted.
        float tension=pressure*(1.0-smoothstep(0.46,0.54,endTime));
        float crownFlex=upper*smoothstep(7.2,24.5,height);
        float rootFlex=(1.0-upper)*smoothstep(0.1,4.2,height);
        float branchAge=max(0.0,endTime-0.49-0.004*max(0.0,seam)-0.025*stagger);
        float branchKick=sin(20.0*branchAge)*exp(-5.1*branchAge);
        float rootAge=max(0.0,endTime-0.49);
        float rootKick=sin(24.0*rootAge)*exp(-7.0*rootAge);
        float lift=smoothstep(0.50,0.77,endTime)*(1.0-0.38*smoothstep(0.88,1.34,endTime));
        transformed.xz+=upper*lift*vec2(1.28,-0.56);
        transformed.y+=upper*lift*0.98;
        transformed.xz+=crownFlex*(-tension*vec2(1.85,-0.68)+branchKick*vec2(5.4,-1.95));
        transformed.xz+=outward*rootFlex*(-0.28*tension+0.72*rootKick);
        transformed.y+=rootFlex*0.23*rootKick;
        float opening=smoothstep(0.27,0.48,endTime);
        float gap=0.04+0.75*opening;
        float tear=opening*(1.0-smoothstep(gap,gap+0.36,abs(seam)));
        float fromUpperTip=clamp((25.0-height)/17.8,0.0,1.0);
        float fromLowerTip=clamp((7.2-height)/7.2,0.0,1.0);
        float release=0.62+mix(0.81*fromLowerTip,1.00*fromUpperTip,upper)+0.10*stagger;
        float dissolve=smoothstep(release,release+0.42,endTime);
        vNatureLoss=max(tear,dissolve);
        float flashAge=(endTime-0.50)/0.065;
        float edgeAge=(endTime-release-0.14)/0.15;
        float chargeAge=(endTime-mix(0.10,0.40,clamp(height/7.2,0.0,1.0)))/0.065;
        float charge=0.55*(1.0-upper)*exp(-chargeAge*chargeAge);
        vNatureHit=exp(-abs(seam)*1.25)*(0.24*opening*pressureFade
          +exp(-flashAge*flashAge)*1.1)+0.26*exp(-edgeAge*edgeAge)+charge;
      }else{
        float crown=clamp(height/25.0,0.0,1.0);
        float release=0.18+1.44*(1.0-crown)+0.11*stagger;
        vNatureLoss=smoothstep(release,release+0.49,endTime);
        float edgeAge=(endTime-release-0.19)/0.16;
        vNatureHit=0.31*exp(-edgeAge*edgeAge);
      }
      vNatureFibre=uv;
    `);
    shader.fragmentShader=`
varying float vNatureLoss,vNatureHit;
varying vec2 vNatureFibre;
`+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`
      #include <clipping_planes_fragment>
      vec2 strand=floor(vNatureFibre*vec2(112.0,23.0));
      float grain=fract(sin(dot(strand,vec2(12.9898,78.233)))*43758.5453);
      float threshold=0.24+0.72*grain;
      if(vNatureLoss>threshold)discard;
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`
      #include <emissivemap_fragment>
      totalEmissiveRadiance+=vec3(0.1,1.35,0.18)*vNatureHit;
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_begin>',`
      totalEmissiveRadiance*=1.0-0.84*vNatureLoss;
      #include <lights_fragment_begin>
    `);
  };
  material.needsUpdate=true;
  instance.updateNatureWeave=()=>{time.value=instance.t;};
  material.addEventListener('dispose',()=>{delete instance.updateNatureWeave;});
};
