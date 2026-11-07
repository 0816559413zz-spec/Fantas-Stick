// The Studio timeline drives the same motion as the approved summon capture.
// Use the GPU for the woven mesh so scrubbing does not copy its vertices.
const ST_NATURE_SUMMON='nature/tree_summon';
const ST_NATURE_TREE_MODEL='nature_ult_tree_branches_v1';

// Shared by Model view, the summon effect, and the review capture. Keep the
// original material available through a zero mix for direct comparisons.
function stNatureTreeWaist(material){
  const mix={value:SQ.has('bodybase')?0:1};
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
