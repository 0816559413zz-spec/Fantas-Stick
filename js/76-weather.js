// ---------- Weather: central system for every map (user 2026-11-26) ----------
// Map "Weather" field (Map Builder Map settings → maps/build/<id>.json weather, or PAINT.maps[id].weather): 'clear:60,rain:40' = weights,
// one pick per map build (wxMap from buildWorld js/28). Rain = look + sound only, no gameplay:
//  • streaks: one instanced quad mesh, GPU moves + wraps drops in a box around the camera (count = Graphics > Particles)
//  • splashes: rings on the terrain in front of the camera (CPU respawns a small pool)
//  • wet ground: js/27 WETU in the FXPass copy shader (darker + puddles + ripples + reflections: Graphics > Reflections)
//    Planar = wxPre renders the scene mirrored about the ground plane under the camera (half res, oblique near plane like three's Reflector)
//  • overcast: stars + moon hidden while it rains • sound: filtered noise layers + random drop ticks (js/18 AC/NB/noiz)
// Dev console: WD.wx('rain'|'clear'|'') ('' = back to the map's pick)
const WX={kind:'clear',force:'',k:0,t:0,rain:null,spl:null,snd:null,mir:null,sky:null,tick:0};
const WX_N=[1500,3200,5500,8000],WX_S=[50,120,220,340];   // streaks / splash pool by Graphics > Particles
function wxParse(s){const o=[];for(const p of String(s||'').split(',')){const [k,w]=p.split(':');if(k&&k.trim())o.push([k.trim(),w==null?1:Math.max(0,+w||0)]);}return o;}
function wxPick(s){const L=wxParse(s),T=L.reduce((a,q)=>a+q[1],0);if(!T)return 'clear';let r=Math.random()*T;for(const [k,w] of L)if((r-=w)<0)return k;return L[L.length-1][0];}
var WX_READY;   // var: buildWorld can run at boot before this file (const WX would be in its TDZ) → keep the pick for later
function wxMap(id,FM){if(!WX_READY){globalThis.__wxPend=[id,FM];return;}WX.kind=WX.force||wxPick(FM&&FM.weather);if(WX.kind==='rain')WX.k=1;}   // already raining when the match starts
WD.WX=WX;WD.WETU=WETU;
WX_READY=true;if(globalThis.__wxPend){wxMap(...globalThis.__wxPend);delete globalThis.__wxPend;}
function wxRainMesh(){
  const n=WX_N[WX_N.length-1],g=new THREE.InstancedBufferGeometry(),a=new Float32Array(n*4);for(let i=0;i<a.length;i++)a[i]=Math.random();
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array([-0.5,0,0,0.5,0,0,0.5,1,0,-0.5,1,0]),3));g.setIndex([0,1,2,0,2,3]);
  g.setAttribute('aP',new THREE.InstancedBufferAttribute(a,4));g.instanceCount=0;
  const U={uT:{value:0},uC:{value:new THREE.Vector3()},uB:{value:new THREE.Vector3(36,22,36)},uG:{value:0},uV:{value:new THREE.Vector3(1.3,-15,0.7)},uL:{value:0.8},uW:{value:0.011},uCol:{value:new THREE.Color('#aebcd4')},uA:{value:0.42}};
  const m=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    vertexShader:'varying float vVZ;attribute vec4 aP;uniform float uT;uniform vec3 uC;uniform vec3 uB;uniform float uG;uniform vec3 uV;uniform float uL;uniform float uW;varying float vA;'+
      'void main(){float sp=0.75+0.5*aP.w;vec3 base=vec3(uC.x-uB.x*0.5,uG-1.0,uC.z-uB.z*0.5);vec3 p=mod(aP.xyz*uB+uV*sp*uT-base,uB)+base;vec3 d=normalize(uV);'+
      'vec3 w=p-d*uL*sp*position.y;float D=length(w-uC);vec3 s=normalize(cross(d,uC-w));float k=max(1.0,D*0.09);w+=s*position.x*uW*k;'+   // wider far away (≥ ~1 px) but fainter
      'vA=(1.0-position.y*0.75)*smoothstep(0.5,2.0,D)*(1.0-smoothstep(uB.x*0.3,uB.x*0.5,D))/k;vec4 mv=viewMatrix*vec4(w,1.0);vVZ=-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader:SOFT_GLSL+'uniform vec3 uCol;uniform float uA;varying float vA;void main(){gl_FragColor=vec4(uCol*uA*vA,1.0);gl_FragColor*=softK(0.15);}'});fxMat(m);
  const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;mesh.renderOrder=6;mesh.userData.keep=true;return {mesh,U,g};
}
function wxSplashMesh(){
  const n=WX_S[WX_S.length-1],g=new THREE.InstancedBufferGeometry(),a=new Float32Array(n*4);for(let i=0;i<n;i++)a[i*4+3]=-99;
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array([-1,0,-1,1,0,-1,1,0,1,-1,0,1]),3));g.setIndex([0,2,1,0,3,2]);
  const at=new THREE.InstancedBufferAttribute(a,4);at.setUsage(THREE.DynamicDrawUsage);g.setAttribute('aS',at);g.instanceCount=0;
  const U={uT:{value:0},uCol:{value:new THREE.Color('#c4d0e6')},uA:{value:0.55}};
  const m=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    vertexShader:'varying float vVZ;attribute vec4 aS;uniform float uT;varying vec2 vP;varying float vAge;void main(){float a=(uT-aS.w)/0.42;vAge=a;float r=0.03+0.19*clamp(a,0.0,1.0);'+
      'vP=position.xz;vec4 mv=viewMatrix*vec4(aS.xyz+vec3(position.x*r,0.025,position.z*r),1.0);vVZ=-mv.z;gl_Position=projectionMatrix*mv;if(a<0.0||a>1.0)gl_Position=vec4(2.0,2.0,2.0,1.0);}',
    fragmentShader:SOFT_GLSL+'uniform vec3 uCol;uniform float uA;varying vec2 vP;varying float vAge;void main(){float d=length(vP);'+
      'float k=(smoothstep(0.6,0.84,d)*(1.0-smoothstep(0.86,1.0,d))*(1.0-vAge)+(1.0-smoothstep(0.0,0.3,d))*max(0.0,1.0-vAge*4.0))*uA;if(k<0.01)discard;gl_FragColor=vec4(uCol*k,1.0);gl_FragColor*=softK(0.05);}'});fxMat(m);
  const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;mesh.renderOrder=6;mesh.userData.keep=true;return {mesh,U,g,a,at};
}
const _wxF=new THREE.Vector3();
function wxSplashTick(n){
  const S=WX.spl,a=S.a,t=WX.t;cam.getWorldDirection(_wxF);const fa=Math.atan2(_wxF.z,_wxF.x);
  for(let i=0;i<n;i++){if(t-a[i*4+3]<0.42+(i%7)*0.03&&t>=a[i*4+3]-0.2)continue;
    const an=fa+(Math.random()-0.5)*2.2,d=1.2+Math.pow(Math.random(),0.8)*15,X=cam.position.x+Math.cos(an)*d,Z=cam.position.z+Math.sin(an)*d;
    a[i*4]=X;a[i*4+1]=TW(X,Z);a[i*4+2]=Z;a[i*4+3]=t+Math.random()*0.35;}
  S.at.needsUpdate=true;S.g.instanceCount=n;S.U.uT.value=t;}
function wxSound(on,dt){
  if(typeof AC==='undefined'||!AC||AC.state!=='running'||!NB||!SFXBUS)return;
  if(on&&!WX.snd){const mk=(ft,f,q,g0)=>{const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();s.buffer=NB;s.loop=true;fl.type=ft;fl.frequency.value=f;fl.Q.value=q;g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(SFXBUS);s.start(0,Math.random()*1.5);return {s,g,g0};};
    WX.snd=[mk('bandpass',2400,0.45,0.16),mk('lowpass',380,0.7,0.1),mk('highpass',6800,0.5,0.04)];}
  if(!WX.snd)return;const t=AC.currentTime;
  for(const L of WX.snd)L.g.gain.setTargetAtTime(on?L.g0*WX.k:0,t,0.5);
  if(!on&&WX.k<0.02){for(const L of WX.snd)L.s.stop(t+2);WX.snd=null;return;}
  if(on&&typeof noiz==='function'&&Math.random()<dt*9*WX.k)noiz(SFXBUS,0.035,0.012+Math.random()*0.02,'bandpass',2500+Math.random()*4500,0,2.5);   // single drops nearby
}
function wxTick(dt){
  const on=screen==='game'&&WX.kind==='rain'&&!!world;
  WX.k+=((on?1:0)-WX.k)*Math.min(1,dt*1.2);WX.t=(WX.t+dt)%600;
  const vis=WX.k>0.01,q=Math.min(3,gq('particles'));
  if(vis&&!WX.rain){WX.rain=wxRainMesh();WX.spl=wxSplashMesh();}
  if(WX.rain){
    if(vis&&WX.rain.mesh.parent!==fxScene){fxScene.add(WX.rain.mesh);fxScene.add(WX.spl.mesh);}   // effect layer: drawn after the painterly filter (it would smooth thin streaks away), soft depth test
    WX.rain.mesh.visible=WX.spl.mesh.visible=vis;
    if(vis){const U=WX.rain.U,c=cam.position;U.uT.value=WX.t;U.uC.value.copy(c);U.uG.value=TW(c.x,c.z);WX.rain.g.instanceCount=Math.round(WX_N[q]*WX.k);wxSplashTick(Math.round(WX_S[q]*WX.k));}
  }
  // overcast: hide stars + moon while raining (restore the sky's own state after)
  if(typeof SKY!=='undefined'&&SKY.stars){if(vis){if(!WX.sky)WX.sky={st:SKY.stars.visible,mo:SKY.moon.visible};SKY.stars.visible=false;SKY.moon.visible=false;}
    else if(WX.sky){SKY.stars.visible=WX.sky.st;SKY.moon.visible=WX.sky.mo;WX.sky=null;}}
  WETU.uWet.value=WX.k;WETU.uRefl.value=gq('refl');WETU.uWT.value=WX.t;
  if(scene.fog)WETU.uSkyC.value.copy(scene.fog.color).multiplyScalar(0.55);
  wxSound(on,dt);
}
// Planar reflection (Graphics > Reflections = Planar): mirror camera about the ground plane under the camera → WETU.tMir (half resolution)
const _wxV=new THREE.Vector3(),_wxT=new THREE.Vector3(),_wxR=new THREE.Matrix4(),_wxP=new THREE.Plane(),_wxN=new THREE.Vector3(0,1,0),_wxQ=new THREE.Vector4(),_wxC=new THREE.Vector4();
function wxPre(){
  WETU.uMirOn.value=0;
  if(!(WETU.uWet.value>0.001&&gq('refl')===3&&SOFTU.uSoftOn.value>0.5&&screen==='game'))return;
  const src=composer.renderTarget1,w=Math.max(1,src.width>>1),h=Math.max(1,src.height>>1);
  if(!WX.mir)WX.mir={rt:new THREE.WebGLRenderTarget(w,h,{type:src.texture.type,colorSpace:src.texture.colorSpace}),cam:new THREE.PerspectiveCamera(),y:null};
  const M=WX.mir,mc=M.cam;if(M.rt.width!==w||M.rt.height!==h)M.rt.setSize(w,h);
  cam.updateMatrixWorld();const cp=cam.position,gy=TW(cp.x,cp.z);M.y=M.y==null||Math.abs(M.y-gy)>2?gy:M.y+(gy-M.y)*0.1;const y0=M.y;
  _wxR.extractRotation(cam.matrixWorld);
  mc.position.set(cp.x,2*y0-cp.y,cp.z);
  _wxT.set(0,0,-1).applyMatrix4(_wxR).add(cp);_wxT.y=2*y0-_wxT.y;
  mc.up.set(0,1,0).applyMatrix4(_wxR).reflect(_wxN);mc.lookAt(_wxT);mc.near=cam.near;mc.far=cam.far;mc.updateMatrixWorld();
  mc.projectionMatrix.copy(cam.projectionMatrix);mc.matrixWorldInverse.copy(mc.matrixWorld).invert();
  // oblique near plane = the water plane (nothing below the ground is drawn into the mirror)
  _wxP.setFromNormalAndCoplanarPoint(_wxN,_wxV.set(cp.x,y0,cp.z)).applyMatrix4(mc.matrixWorldInverse);
  _wxC.set(_wxP.normal.x,_wxP.normal.y,_wxP.normal.z,_wxP.constant);const e=mc.projectionMatrix.elements;
  _wxQ.set((Math.sign(_wxC.x)+e[8])/e[0],(Math.sign(_wxC.y)+e[9])/e[5],-1,(1+e[10])/e[14]);_wxC.multiplyScalar(2/_wxC.dot(_wxQ));
  e[2]=_wxC.x;e[6]=_wxC.y;e[10]=_wxC.z+1-0.003;e[14]=_wxC.w;
  const prev=gl.getRenderTarget(),au=gl.shadowMap.autoUpdate,nu=gl.shadowMap.needsUpdate,hid=[WX.rain&&WX.rain.mesh,WX.spl&&WX.spl.mesh].filter(m=>m&&m.visible);
  gl.shadowMap.autoUpdate=false;gl.shadowMap.needsUpdate=false;hid.forEach(m=>m.visible=false);
  gl.setRenderTarget(M.rt);gl.clear();gl.render(scene,mc);
  gl.setRenderTarget(prev);gl.shadowMap.autoUpdate=au;gl.shadowMap.needsUpdate=nu;hid.forEach(m=>m.visible=true);
  WETU.tMir.value=M.rt.texture;WETU.uMirVP.value.multiplyMatrices(mc.projectionMatrix,mc.matrixWorldInverse);WETU.uMirY.value=y0;WETU.uMirOn.value=1;
}
