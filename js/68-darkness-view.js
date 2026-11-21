// Broad, tapered ribbons follow the ring. Only the tears interrupt the flowing silhouette.
function nightWaltzStrip(radius,angle,span,height,lean,speed,index,preview,strength=1){
  const profiles=[
    [.03,.14,.29,.40,.79,.70,.64,.59,.94,.40,.18,.02],
    [.02,.15,.31,.69,.91,.75,.62,.48,.58,.28,.11,.02],
    [.02,.08,.16,.34,.51,.49,.81,.92,.53,.32,.19,.03]
  ];
  const top=profiles[index%profiles.length],bottom=[.03,.06,.13,.14,.23,.15,.20,.12,.20,.14,.08,.02];
  const positions=[],uv=[],triangles=[];
  for(let i=0;i<top.length;i++){
    const u=i/(top.length-1),k=index%4===1?top.length-1-i:i;
    for(const [v,profile] of [[0,bottom],[1,top]]){
      const lift=profile[k],a=(u-.5)*span+.20*lean*lift;
      const r=radius+lean*lift+.12*Math.sin(u*6+index);
      positions.push(Math.cos(a)*r,.08+height*lift,Math.sin(a)*r);
      uv.push(u,v);
    }
    if(i){const j=i*2;triangles.push(j-2,j,j-1,j-1,j,j+1);}
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(triangles);
  const material=new THREE.ShaderMaterial({
    uniforms:{age:{value:0},angle:{value:angle},seed:{value:index+1},speed:{value:speed},preview:{value:preview?1:0},strength:{value:strength}},
    side:THREE.DoubleSide,transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`uniform float age,angle,seed,speed,preview,strength;varying vec2 ribbon;
      varying float opacity,tear;
      void main(){
        float t=age-mod(seed,5.)*.025;
        float rise=smoothstep(.05,.36,t);
        tear=smoothstep(.82+preview*.06,1.53+preview*.22,t);
        opacity=rise*(1.-tear)*strength;
        float a=angle+speed*t,cs=cos(a),sn=sin(a);
        vec3 p=position;
        p.y*=.08+.92*rise+.18*tear;
        p.xz*=.94+.06*rise+.055*tear;
        p.xz=mat2(cs,sn,-sn,cs)*p.xz;
        ribbon=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
      }`,
    fragmentShader:`uniform float seed,age,speed,preview;varying vec2 ribbon;varying float opacity,tear;
      void main(){
        float u=ribbon.x,v=ribbon.y;
        if(opacity<.008)discard;
        if(u>.24&&u<.63&&abs(v-(.72-u*.86))<.034)discard;
        float piece=floor(u*26.+v*3.);
        float grain=fract(sin(piece*71.23+seed*31.72)*43758.55);
        float along=speed>0.?u:1.-u;
        float intact=mix(grain+.30*(1.-v),.72*along+.25*grain+.09*(1.-v),preview);
        if(intact<tear*1.15)discard;
        float fold=smoothstep(.45,.63,v*.82-u*.46+.08*sin(u*9.+seed));
        vec3 ink=mix(vec3(.002,.002,.004),vec3(.047,.045,.056),fold*.58+v*.19);
        if(preview>0.){
          // Broad charcoal bands with a bright thread at each leading edge.
          float lanes=v*6.2-u*2.8+.21*sin(u*12.+seed);
          float lane=floor(lanes),crossing=abs(fract(lanes)-.49);
          float aa=max(fwidth(lanes)*.60,.018);
          float band=1.-smoothstep(.18,.18+aa,crossing);
          float thread=1.-smoothstep(.031,.031+aa,abs(fract(lanes)-.34));
          float flow=u-sign(speed)*age*.52;
          float traveling=sin(flow*19.+lane*1.73+seed)*.5+.5;
          float mask=smoothstep(.07,.17,v)*(1.-smoothstep(.86,.99,v));
          mask*=smoothstep(.05,.18,u)*(1.-smoothstep(.82,.98,u));
          ink=mix(ink,vec3(.142,.131,.153),band*(.52+.36*traveling)*mask);
          ink=mix(ink,vec3(.31,.28,.34),thread*(.37+.52*traveling)*mask);
        }
        float seam=1.-smoothstep(.006,.025,abs(v-(.24+.48*u+.021*sin(u*19.-age*13.))));
        float glint=1.-smoothstep(.03,.26,abs(u-fract(age*1.65+seed*.29)));
        seam*=smoothstep(.12,.27,u)*(1.-smoothstep(.70,.85,u))*(.10+.23*glint);
        gl_FragColor=vec4(mix(ink,vec3(.49,.46,.53),seam),opacity);
        #include <colorspace_fragment>
      }`
  });
  const mesh=new THREE.Mesh(geometry,material);
  // The vertex shader sweeps the strip around the fixed cast position.
  mesh.frustumCulled=false;
  return mesh;
}

function nightWaltzBorder(parent,instance,preview=false){
  const root=new THREE.Group();root.name='Night Waltz cast edge';parent.add(root);
  const bands=[
    [7.8,.30,1.14,3.5,-.68], [8.0,1.94,.83,2.25,.45],
    [7.7,3.24,1.14,2.85,-.83], [8.16,4.79,1.19,3.75,.67], [7.9,5.82,.60,1.48,-.26]
  ];
  bands.forEach((band,i)=>root.add(nightWaltzStrip(...band,1.63,i,preview)));
  for(let i=0;i<12;i++){
    const outer=i%2===0;
    const angle=.24+i*.5236+(i%3)*.085;
    root.add(nightWaltzStrip(outer?8.32:7.32,angle,.32+(i%4)*.12,.44+(i%5)*.14,outer?.38:-.31,outer?1.92:-1.44,i+bands.length,preview,preview?.82:1));
  }
  if(preview)bands.forEach(([radius,angle,span,height,lean],i)=>{
    root.add(nightWaltzStrip(radius-.32,angle-span*.38,span*.82,height*.25,lean*.55,1.63,17+i,true,.66));
  });
  for(const strip of root.children){
    const uniforms=strip.material.uniforms;
    const delay=(uniforms.seed.value%5)*.025;
    const first=delay+.05,last=delay+1.53+(preview?.22:0);
    const count=strip.geometry.index.count;
    strip.onBeforeRender=()=>{
      const age=instance.t;
      uniforms.age.value=age;
      strip.geometry.setDrawRange(0,age>first&&age<last?count:0);
    };
  }
  return root;
}

FXCODE.darkness_night_waltz=(_x,_y,_h,args,instance)=>{
  const anchor=instance.L.find(layer=>layer.d.id===args.layer);
  if(!anchor?.obj)return;
  const root=nightWaltzBorder(anchor.obj,instance);
  if(instance.P.ev?.radius)root.scale.setScalar(instance.P.ev.radius*S3/7.9);
  anchor.geo=new THREE.BufferGeometry();
  anchor.geo.addEventListener('dispose',()=>{disposeTree(root);root.removeFromParent();});
};

function stDarkVeilGround(root,radius){
  const material=new THREE.ShaderMaterial({
    uniforms:{age:{value:0},reach:{value:0},opacity:{value:0}},
    transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`varying vec2 groundUV;
      void main(){groundUV=(uv*2.-1.)*1.32;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float age,reach,opacity;
      varying vec2 groundUV;
      float ringWave(float r,float a,float time,float duration,float distance,float phase){
        float p=clamp(time/duration,0.,1.);
        float edge=.035+distance*(1.-pow(1.-p,1.6));
        edge*=1.+.014*sin(a*9.+phase)+.015*cos(a*5.-p*4.);
        float d=r-edge;
        float leading=1.-smoothstep(.010,.034,abs(d));
        float wake=(1.-smoothstep(.015,.11,abs(d+.048)))*.47;
        float tear=.64+.36*smoothstep(-.34,.82,sin(a*17.+phase+p*3.2));
        return max(leading,wake)*tear*smoothstep(0.,.13,p)*(1.-smoothstep(.61,1.,p));
      }
      void main(){
        float r=length(groundUV),a=atan(groundUV.y,groundUV.x);
        float rim=reach*(.95+.019*sin(7.*a-age*2.1)+.013*cos(13.*a+age*1.8));
        float n=r/max(reach,.02);
        float broken=.4+.6*smoothstep(-.3,.65,sin(a*9.+r*18.-age*3.)+.48*sin(a*17.+age));
        float border=(1.-smoothstep(.02,.10,abs(r-rim)))*broken;
        float inside=1.-smoothstep(rim-.085,rim,r);
        float bands=.5+.5*sin(n*29.+a*3.-age*5.+sin(a*5.+age*1.2)*1.5);
        float ink=inside*smoothstep(.24,.76,n)*smoothstep(.41,.96,bands)*broken;
        float wave=ringWave(r,a,age,.54,1.24,0.);
        float echo=.61*ringWave(r,a,age-.085,.49,1.10,1.7);
        float hit=(1.-smoothstep(.025,.22,r))*(1.-smoothstep(.035,.22,age));
        float pulse=max(wave,echo);
        vec3 col=mix(vec3(.009,.008,.013),vec3(.074,.066,.102),.56*ink+.19*pulse);
        float base=max(.19*inside,.79*border);
        gl_FragColor=vec4(col,opacity*max(base,max(pulse*.96,hit*.76)));
        #include <colorspace_fragment>
      }`
  });
  const pool=new THREE.Mesh(new THREE.PlaneGeometry(radius*2.12*1.32,radius*2.12*1.32),material);
  pool.name='Darkness veil ground';pool.position.y=.035;pool.rotation.x=-Math.PI/2;pool.renderOrder=2;
  root.add(pool);
  const wispsMat=new THREE.ShaderMaterial({
    uniforms:{...material.uniforms,radius:{value:radius*1.06}},
    transparent:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide,
    vertexShader:`uniform float age,reach,radius;varying vec2 inkUV;
      void main(){
        inkUV=uv;
        vec3 p=position;
        float a=atan(-p.z,p.x);
        float v=uv.y;
        float rim=.95+.019*sin(7.*a-age*2.1)+.013*cos(13.*a+age*1.8);
        float height=.26+.42*pow(.5+.5*sin(a*10.+age*4.)*cos(a*7.-age*2.),2.);
        p.y=.05+v*height;
        p.xz*=radius*reach*rim+v*(.13*sin(9.*a-age*3.)+.10);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
      }`,
    fragmentShader:`uniform float age,reach,opacity;varying vec2 inkUV;
      void main(){
        float h=inkUV.y,u=inkUV.x*6.283185;
        float wave=sin(u*23.+age*4.1+h*h*2.4)+.53*sin(u*39.-age*2.5-h*2.);
        float wisps=smoothstep(-.30,.95,wave-h*.76);
        float strands=smoothstep(.25,.88,sin(u*73.+h*9.-age*4.7));
        float a=opacity*smoothstep(.46,.90,reach)*wisps*(1.-smoothstep(.36,1.,h));
        gl_FragColor=vec4(mix(vec3(.006,.005,.012),vec3(.054,.044,.078),strands*h),a*.76);
        #include <colorspace_fragment>
      }`
  });
  const wisps=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,144,7,true),wispsMat);
  wisps.name='Darkness veil rising edge';wisps.renderOrder=4;wisps.frustumCulled=false;root.add(wisps);
  return (age,reach,opacity)=>{
    pool.visible=opacity>.005;
    wisps.visible=pool.visible;
    material.uniforms.age.value=age;
    material.uniforms.reach.value=reach;
    material.uniforms.opacity.value=opacity;
  };
}

function darkFxMesh(geometry,color,opacity=1){
  return new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({
    color,transparent:opacity<1,opacity,depthWrite:opacity>=1,
    toneMapped:false,side:THREE.DoubleSide,forceSinglePass:true
  }));
}
const darkShieldHud={alpha:0,held:false,changedAt:null,from:0};
function drawDarknessHud(x,y,state){
  const t=darkViewNow/1000,flow=state[2]>0,radius=Math.min(54,SH*.085);
  if(flow)darkFlowHud??=stDarkFlowHud({timer:false});
  if(darkFlowHud&&t-(darkFlowHud.lastDraw??-Infinity)>=1/30){
    darkFlowHud.draw(t,flow?1:0);
    darkFlowHud.lastDraw=t;
  }

  cx.save();
  if(flow)drawReticleTimer(cx,x,y,radius,state[2]/DARK_V.flow);
  drawDarkShieldMeter(x,y-radius-22,state[4]/DARK_V.shieldTime,t,!!INPUT.sh);

  const dashY=y+radius+19;
  for(let i=0;i<2;i++){
    const charge=i<state[7]?1:i===state[7]?(state[9]||0):0;
    drawDarkHudBar(x+(i-1)*24+2,dashY,20,3,charge);
  }
  cx.restore();
}

function drawDarkHudBar(x,y,width,height,amount){
  cx.fillStyle='rgba(255,255,255,0.26)';
  cx.fillRect(x,y,width,height);
  cx.fillStyle='#fff';
  cx.fillRect(x,y,width*clamp(amount,0,1),height);
}

function drawDarkShieldMeter(x,y,remaining,t,held){
  const hud=darkShieldHud;
  if(hud.held!==held){hud.held=held;hud.changedAt=t;hud.from=hud.alpha;}
  if(hud.changedAt!=null){
    const fade=stDarkEase(0,held?.085:.115,t-hud.changedAt);
    hud.alpha=lerp(hud.from,held?1:0,fade);
  }
  if(hud.alpha<=.005)return;
  const width=Math.min(160,SW*.32);
  cx.save();cx.globalAlpha*=hud.alpha;
  drawDarkHudBar(x-width/2,y,width,5,remaining);
  cx.restore();
}

function darknessMarkView(o,visible,height){
  if(visible&&!o.darkMark){
    const mark=new THREE.Group();
    mark.position.y=height-1.2;o.g.add(mark);
    o.darkMark=stDarkTargetMark(mark);
  }
  const age=o.darkMarkedAt==null?1:(darkViewNow-o.darkMarkedAt)/1000;
  if(o.darkMark)o.darkMark(visible?age-.57:-1,Infinity);
  if(o.darkTint&&!o.darkDashFx?.hold&&!o.darkChaseFx)o.darkTint(stDarkEase(.085,.483,age)*(1-stDarkEase(.548,.76,age))*.96);
}
const darkWaveViews=new Map(),darkActiveViews=new Map();
function darkViewRoot(ev,name){
  const root=new THREE.Group();
  root.name=name;root.position.set(tx(ev.x),GY(ev.x,ev.y)+(ev.h||0),tz(ev.y));
  root.rotation.y=Math.PI/2-(ev.a||0);
  return root;
}
function darkViewTemp(root,life,update,finish){
  function dispose(){
    darkActiveViews.delete(root);
    finish?.();
    disposeTree(root);root.clear();root.removeFromParent();
  }
  fireTemp(root,[],life,(_view,k)=>{
    if(k<1)update(k*life);
    else dispose();
  });
  darkActiveViews.set(root,dispose);
}
function darknessClear(){
  for(let i=FIREV.length-1;i>=0;i--){
    const dispose=darkActiveViews.get(FIREV[i].g);
    if(dispose){dispose();FIREV.splice(i,1);}
  }
  darkWaveViews.clear();
  darkFlowHud?.dispose();darkFlowHud=null;
  darkShieldHud.alpha=0;darkShieldHud.held=false;darkShieldHud.changedAt=null;
}
function darkWorldAt(ev,out){
  return out.set(tx(ev.x),GY(ev.x,ev.y)+(ev.h||0),tz(ev.y));
}
function darkMarkWind(ev,o){
  const root=darkViewRoot(ev,'Darkness Mark Wave');
  const live={scythe:false,launch:false};
  const wave=stDarkMarkWave(root,{live,flow:ev.flow,visualOnly:ev.main===false});
  live.scythe=!!wave.blade;
  const view={root,live,wave,elapsed:0,clock:0};
  if(o)o.darkMarkCast=view;
  const windup=ev.flow?0:DARK_V.markPrep;
  darkViewTemp(root,2.85,t=>{
    view.elapsed=t;
    if(!live.launch&&o){
      o.g.getWorldPosition(root.position);
      o.g.getWorldQuaternion(root.quaternion);
    }
    view.clock=live.launch?wave.release+t-view.launchAt:Math.min(wave.release-.001,t*wave.release/(windup||.001));
    if(live.scythe&&live.launch&&view.clock>=wave.finish){
      wave.update(wave.finish);
      if(o?.darkMarkCast===view)darkShowWeaponReturn(o,wave.blade);
      live.scythe=false;
    }
    wave.update(view.clock);
  },()=>{
    if(o?.darkMarkCast===view){darkSettleWeapon(o,wave.blade);o.darkMarkCast=null;}
    if(view.id)darkWaveViews.delete(view.id);
    wave.dispose();
  });
  return view;
}
function darkMarkLaunch(ev,o){
  const view=ev.main&&o?.darkMarkCast&&!o.darkMarkCast.live.launch?o.darkMarkCast:darkMarkWind({...ev,flow:ev.flow},null);
  const {root,live,wave}=view;
  darkWorldAt(ev,root.position);root.rotation.set(0,Math.PI/2-ev.a,0);
  live.launch=true;live.scythe=ev.main;
  view.id=ev.wave;view.launchAt=view.elapsed;
  view.speed=ev.speed;darkWaveViews.set(ev.wave,view);
  const pitch=ev.pitch||0;
  view.direction=new THREE.Vector3(0,Math.sin(pitch),Math.cos(pitch));
  wave.setFlight(view.direction.clone().multiplyScalar(ev.range*S3).add(new THREE.Vector3(0,1.1,0)),ev.range/ev.speed);
  if(ev.main&&o)o.darkMarkCast=view;
}
function darkMarkContact(ev){
  const target=PM3.get(ev.target)||EM3.get(ev.target);
  if(target){target.darkMarkedAt=darkViewNow||performance.now();target.darkTint??=stDarkBodyTint(target);}
  const view=darkWaveViews.get(ev.wave);
  if(!view)return;
  const world=darkWorldAt(ev,new THREE.Vector3());
  const center=view.root.worldToLocal(world);
  const end=view.direction.clone().multiplyScalar(ev.distance*S3).add(new THREE.Vector3(0,1.1,0));
  view.wave.setFlight(end,Math.max(0,view.clock-view.wave.release),center);
  if(target)view.live.target=out=>{
    target.g.getWorldPosition(out);out.y+=1.1;view.root.worldToLocal(out);
  };
}
let darkViewNow=0,darkFlowHud=null;
function darkIdleWeaponPose(now,position,rotation){
  position.set(1.5,.08+Math.sin(now*.002)*.09,0);
  rotation.set(.25,now*.0015,.16);
}
function darkBAGroundImpact(point,yaw){
  const root=new THREE.Group();root.name='Darkness BA ground impact';root.position.copy(point);
  root.rotation.y=Math.PI/2-yaw;
  const floor=new THREE.Group();floor.rotation.x=-Math.PI/2;root.add(floor);
  const scar=stDarkCut(floor,[[-1.36,-.16],[0,.06],[1.36,.20]],.14,0x09070e,11);
  const rim=stDarkCut(floor,[[-1.12,-.15],[0,.045],[1.10,.17]],.046,0x5b4b69,12);
  const splash=stDarkCut(root,[[-1.16,.055],[-.24,.26],[.49,.15],[1.25,.035]],.15,0x21192c,12);
  const pressure=stDarkPressure(floor);
  const grit=stDarkMatter(root,'BA ground grit',[{at:0,span:.075,count:22,spread:1.25,lift:.87,height:.03}],(_t,out)=>out.set(0,0,0));
  darkViewTemp(root,.55,t=>{
    scar(t,.42,.84);rim(t,.22,.48);splash(t,.22,.71);
    pressure(.14+2.02*stDarkEase(0,.28,t),.56*(1-stDarkEase(.04,.30,t)),t*8);
    grit(t);
  });
}
function darkSettleWeapon(o,blade,duration=.88,liftSpeed=0){
  if(!o?.darkWeapon||!blade?.visible)return;
  const pos=blade.getWorldPosition(new THREE.Vector3()).sub(o.g.getWorldPosition(new THREE.Vector3()));
  const rot=blade.getWorldQuaternion(new THREE.Quaternion());
  o.darkWeaponReturn={
    pos,rot,scale:blade.getWorldScale(new THREE.Vector3()).x,recovery:duration>.4,liftSpeed,
    blendPos:new THREE.Vector3(),blendRot:new THREE.Quaternion(),rest:new THREE.Quaternion(),
    offset:new THREE.Quaternion(),correction:new THREE.Quaternion(),started:false,
    duration,at:darkViewNow||performance.now()
  };
}
function darkBlendWeapon(o,now){
  const back=o.darkWeaponReturn;
  if(!back)return;
  const age=(now-back.at)/1000;
  const travel=stDarkEase(0,back.duration,age);
  if(travel>=1){o.darkWeaponReturn=null;return;}
  const turn=back.recovery?stDarkEase(back.duration*.20,back.duration,age):travel;
  const parent=o.darkWeapon.parent;
  o.g.getWorldPosition(back.blendPos).add(back.pos);
  parent.worldToLocal(back.blendPos);
  o.darkWeapon.position.lerp(back.blendPos,1-travel);
  if(back.recovery)o.darkWeapon.position.y+=.21*Math.sin(Math.PI*travel)+back.liftSpeed*Math.max(0,age)*(1-travel)**5;
  if(back.recovery){
    o.darkWeapon.getWorldQuaternion(back.blendRot);
    if(!back.started){back.rest.copy(back.blendRot);back.started=true;}
    stDarkReturnRotation(o.darkWeapon.quaternion,back.rot,back.rest,back.blendRot,turn,back.offset,back.correction);
    o.darkWeapon.quaternion.premultiply(parent.getWorldQuaternion(back.blendRot).invert());
  }else{
    parent.getWorldQuaternion(back.blendRot).invert().multiply(back.rot);
    o.darkWeapon.quaternion.slerp(back.blendRot,1-turn);
  }
  o.darkWeapon.scale.setScalar(lerp(back.scale,o.darkWeapon.scale.x,travel));
}
function darkShowWeaponReturn(o,blade,duration){
  if(!o?.darkWeapon||o.darkDown||!blade?.visible)return;
  darkSettleWeapon(o,blade,duration);
  // Temporary effects update after character sync. Make the receiving blade visible this frame.
  o.darkWeapon.visible=o.darkSwordRoot.visible=true;
  darkBlendWeapon(o,o.darkWeaponReturn.at);
}
function darkTrailHistory(root,distanceBased=false){
  const points=[{at:0,length:0,position:new THREE.Vector3()}],sample=new THREE.Vector3();
  function interval(t,key){
    let low=0,high=points.length-1;
    while(high-low>1){
      const mid=(high+low)>>1;
      if(points[mid][key]<t)low=mid;else high=mid;
    }
    return [points[low],points[high]];
  }
  function clock(t){
    if(!distanceBased)return Math.max(0,t)*16;
    if(t<=0)return 0;
    if(t>=points.at(-1).at)return points.at(-1).length;
    const [from,to]=interval(t,'at');
    return lerp(from.length,to.length,(t-from.at)/(to.at-from.at));
  }
  function pointAt(d,out){
    if(d<=0)return out.copy(points[0].position).add(sampleOffset.set(0,0,distanceBased?d:0));
    const last=points.at(-1);
    if(d>=last.length)return out.copy(last.position);
    const [from,to]=interval(d,'length');
    return out.copy(from.position).lerp(to.position,(d-from.length)/(to.length-from.length));
  }
  const sampleOffset=new THREE.Vector3();
  return {
    clock,pointAt,heightAt:t=>pointAt(t,sample).y,
    record(t,actor,worldPosition){
      const last=points.at(-1);
      if(t<last.at||(t===last.at&&!worldPosition))return last.position;
      const position=root.worldToLocal(worldPosition??actor.getWorldPosition(new THREE.Vector3()));
      if(t===last.at){last.position.copy(position);return last.position;}
      if(distanceBased&&points.length===1)points[0].position.copy(position);
      const length=distanceBased?last.length+last.position.distanceTo(position):clock(t);
      points.push({at:t,length,position});
      return position;
    }
  };
}
function darkDashView(ev,o,hold,charging){
  if(!o)return;
  if(hold&&!charging&&o.darkDashFx?.hold){
    o.darkDashFx.launchAt=darkViewNow||performance.now();
    return;
  }
  o.darkSwingAt=undefined;
  const root=darkViewRoot(ev,hold?'Long Dash':'Quick Dash');
  const at=darkViewNow||performance.now();
  const travel=hold?2.105:ev.duration;
  const points=[{u:0,p:new THREE.Vector3()}];
  const pointAt=(u,out)=>{
    const last=points.at(-1);
    const i=points.findIndex(point=>point.u>=u);
    if(i<=0)return out.copy(i===0?points[0].p:last.p);
    const a=points[i-1],b=points[i];
    return out.copy(a.p).lerp(b.p,(u-a.u)/(b.u-a.u));
  };
  o.darkTint??=stDarkBodyTint(o,true);
  const live={hold,launchAt:charging?null:at,pointAt,bodyTint:o.darkTint,spent:false};
  const update=hold?stDarkHoldDash(root,o,live):stDarkQuickDash(root,o,getLook(ev.id),live);
  live.blade=update.blade;
  const old=o.darkDashFx;
  if(old){old.cancelled=true;o.b.visible=true;}
  o.darkDashFx=live;
  const local=new THREE.Vector3();
  live.update=now=>{
    if(live.cancelled)return;
    const t=(now-at)/1000;
    const moved=live.launchAt==null?0:(now-live.launchAt)/1000;
    const u=clamp(moved/travel,0,1);
    if(u>points.at(-1).u)points.push({u,p:root.worldToLocal(o.g.getWorldPosition(local)).clone()});
    const clock=hold?(live.launchAt==null?Math.min(.659,t+.16):.66+moved):
      lerp(.22,.54,u)+Math.max(0,moved-travel);
    update(clock);
  };
  darkViewTemp(root,hold?(charging?.5:0)+travel+.81:1.05,()=>{
    if(live.cancelled){root.visible=false;return;}
    if(o.darkDashFx!==live)root.visible=false;
  },()=>{
    if(o.darkDashFx!==live)return;
    if(!live.cancelled&&!live.spent)darkShowWeaponReturn(o,live.blade);
    o.darkDashFx=null;o.b.visible=true;
    if(hold)o.darkTint(0,1);
  });
}
function darknessCharacter(o,p,viewer,now){
  darkViewNow=now;
  const state=p.dk;
  const previous=o.darkLastPosition;
  o.darkMoving=!!previous&&previous.distanceToSquared(o.g.position)>.0009;
  (o.darkLastPosition??=new THREE.Vector3()).copy(o.g.position);
  o.darkDown=!!p.dn;
  if(state?.[0]===1&&viewer&&p.tm!==viewer.tm&&p.id!==viewer.id)o.g.visible=false;
  const faint=!!state?.[0]&&!o.ghost;
  if(faint!==!!o.darkFaint){
    o.darkFaint=faint;
    if(!o.ghost)setGhost(o,faint);
  }
  darknessMarkView(o,state?.[1],1.42);
  if(getKit(p.id).path!==DARKP){
    if(o.darkGear){
      o.darkScythe.liveHandPose(o,0);
      o.darkGear.visible=false;
      if(o.darkDashFx)o.darkDashFx.cancelled=true;
      if(o.darkMarkCast)o.darkMarkCast.live.scythe=false;
      o.darkChaseFx=null;o.b.visible=true;
    }
    return;
  }
  if(!o.darkGear){
    fxLoad('darkness/ult_v3');
    o.darkGear=new THREE.Group();
    o.darkSwordRoot=new THREE.Group();o.darkGear.add(o.darkSwordRoot);
    o.darkBATrail=new THREE.Group();o.darkBATrail.name='Darkness BA world trail';o.darkSwordRoot.add(o.darkBATrail);
    o.darkBAPose={pos:new THREE.Vector3(),q:new THREE.Quaternion(),scratch:new THREE.Quaternion(),lift:new THREE.Vector3(),euler:new THREE.Euler(0,0,0,'YXZ')};
    const worldTip=new THREE.Vector3();
    o.darkGroundBA=(space,tip,pos,contact)=>{
      worldTip.copy(tip);space.localToWorld(worldTip);
      const floor=darkBAFloor(worldTip.x/S3+MW/2,worldTip.z/S3+MH/2,o.darkBAAnchor?.y??o.zs)+.08;
      if(worldTip.y>=floor)return;
      worldTip.y=floor;
      if(contact&&!o.darkBAGroundContact){o.darkBAGroundContact=true;darkBAGroundImpact(worldTip,o.darkBaYaw);}
      pos.add(space.worldToLocal(worldTip).sub(tip));
    };
    const blade=stDarkVeilBlade(1.4);
    const scytheArgs={wrap:'C',manual:true,scale:1.4,side:-1.5,trailPose:blade,trailRoot:o.darkBATrail,mode:'ba',liveBA:true,cutHeight:DARK_BA.height};
    o.darkScythe=stCreateScythePreview(o.darkSwordRoot,scytheArgs);
    o.darkVeilBlade=blade;o.darkScytheArgs=scytheArgs;
    o.darkBuffBlade=stDarkChargedBlade(o.darkScythe.blade);
    o.darkWeapon=o.darkScythe.pivot;
    o.darkFlowBladePosition=new THREE.Vector3();o.darkFlowBladeQ=new THREE.Quaternion();o.darkFlowBladeEuler=new THREE.Euler();
    o.darkDisc=new THREE.Group();
    const shieldRadius=DARK_V.shieldRadius*S3;
    o.darkDiscInk=stDarkShieldInk(o.darkDisc,shieldRadius);
    o.darkDiscFlames=stDarkShieldFlames(o.darkDisc,shieldRadius);
    const shieldEdge=new THREE.Mesh(new THREE.RingGeometry(shieldRadius-.036,shieldRadius,72),new THREE.MeshBasicMaterial({
      color:0xa99ab9,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,toneMapped:false
    }));
    shieldEdge.position.z=.012;
    o.darkDisc.add(shieldEdge);o.darkDiscEdge=shieldEdge;
    o.darkShieldQ=new THREE.Quaternion();o.darkShieldEuler=new THREE.Euler();
    o.darkDisc.position.y=1.4;o.darkGear.add(o.darkDisc);
    o.darkOrb=darkFxMesh(new THREE.SphereGeometry(.72,20,16),0x101017);
    o.darkOrb.position.y=1.1;o.darkGear.add(o.darkOrb);
    o.g.add(o.darkGear);
  }
  o.darkGear.visible=!p.dn;
  o.shield.visible=false;
  const shield=state?.[3]||0;
  if(shield>0){o.darkSwingAt=undefined;o.darkWeaponReturn=null;}
  if(o.darkChaseFx?.recovered)o.darkChaseFx=null;
  const gear=o.darkWeapon,age=(now-(o.darkSwingAt??-1e4))/1000;
  const basic=age>=0&&age<1.55;
  const recovery=ST_DARK_LIVE_BA.idleAfter+ST_DARK_LIVE_BA.returnTime;
  const baseClock=age>=0&&age<recovery?ST_DARK_LIVE_BA.start+age*ST_DARK_LIVE_BA.rate:0;
  gear.visible=(!state?.[5]||state[5]===3||(state[5]===2&&basic))&&!o.darkMarkCast?.wave.blade?.visible&&(!o.darkDashFx||o.darkDashFx.spent)&&!o.darkChaseFx;
  if(o.darkDashFx?.cancelled||p.dn){if(o.darkDashFx)o.darkDashFx.cancelled=true;o.b.visible=true;}
  const waltz=o.darkWaltzCast,waltzAge=waltz?(state?.[12]??(now-waltz.at)/1000):-Infinity;
  const landing=waltz?.cancelAt??waltz?.land??0;
  const waltzHidden=waltzAge>=.307&&waltzAge<landing+.075;
  const waltzTint=stDarkEase(.105,.30,waltzAge)*(1-stDarkEase(landing,landing+.15,waltzAge));
  darkIdleWeaponPose(now,gear.position,gear.rotation);
  const veil=o.darkVeilCast,t=veil?(now-veil.at)/1000:Infinity;
  const planting=t>=0&&t<DARK_VEIL_PULL_CLEAR;
  o.darkScytheArgs.trailPose=planting?o.darkVeilBlade:null;
  o.darkScytheArgs.groundBA=basic&&!planting&&o.darkBaPitch<-.07?o.darkGroundBA:null;
  o.darkBATrail.position.set(0,0,0);
  o.darkBATrail.quaternion.identity();
  o.darkSwordRoot.position.set(0,0,0);
  o.darkSwordRoot.rotation.set(0,0,0);
  if(basic&&!planting){
    const aimWeight=1-stDarkEase(.55,1.10,age);
    const {pos,q,scratch,lift,euler}=o.darkBAPose;
    if(o.darkBAAnchor)pos.copy(o.darkBAAnchor);else o.g.getWorldPosition(pos);
    q.setFromEuler(euler.set(-o.darkBaPitch,Math.PI/2-o.darkBaYaw,0));
    pos.y+=DARK_BA.height;
    pos.sub(lift.set(0,DARK_BA.height,0).applyQuaternion(q));
    o.darkSwordRoot.position.copy(pos);
    o.darkGear.worldToLocal(o.darkSwordRoot.position).multiplyScalar(aimWeight);
    o.darkSwordRoot.quaternion.slerp(o.darkGear.getWorldQuaternion(scratch).invert().multiply(q),aimWeight);
    o.darkSwordRoot.worldToLocal(o.darkBATrail.position.copy(pos));
    o.darkBATrail.quaternion.copy(o.darkSwordRoot.getWorldQuaternion(scratch).invert().multiply(q));
  }
  if(planting){
    const plant=o.darkVeilBlade(t);
    gear.position.copy(plant.pos);
    gear.quaternion.copy(plant.QB);
    o.darkSwordRoot.position.copy(veil.world);
    o.g.worldToLocal(o.darkSwordRoot.position);
    o.darkSwordRoot.rotation.y=angDiff(Math.PI/2-veil.a,o.g.rotation.y);
  }else if(veil&&t>=DARK_VEIL_PULL_CLEAR&&!veil.released){
    veil.released=true;
    if(!basic){
      const exit=o.darkVeilBlade(DARK_VEIL_PULL_CLEAR),source=new THREE.Object3D();
      source.rotation.y=Math.PI/2-veil.a;
      source.position.copy(exit.pos).applyQuaternion(source.quaternion).add(veil.world);
      source.quaternion.multiply(exit.QB);
      darkSettleWeapon(o,source,.88,5.7);
    }
  }
  const flow=state?.[2]>0?stDarkEase(0,.28,DARK_V.flow-state[2])*(1-stDarkEase(0,.25,.25-state[2])):0;
  o.darkScytheArgs.flameSpeed=1+1.8*flow;
  o.darkScytheArgs.empowered=baseClock>0&&o.darkBaEmpowered;
  o.darkScytheArgs.baSide=o.darkBaSide;
  o.darkScytheArgs.trailWidth=basic?1.4:1;
  o.darkScytheArgs.range=(o.darkScytheArgs.empowered?DARK_BA.powerRange:DARK_BA.range)*S3;
  o.darkScytheArgs.arc=DARK_BA.arc*Math.PI/360;
  gear.scale.setScalar(state?.[8]?1.10:1);
  o.darkBuffBlade(now/1000,state?.[8]&&!o.darkDashFx?1:0,0);
  if(gear.visible&&o.g.visible)o.darkScythe.update(now/1000,0,0,planting?t:baseClock);
  const flowStrike=o.darkFlowStrike,flowAge=flowStrike?(now-flowStrike.at)/1000:-Infinity;
  const F=DARK_CHASE_FLOW;
  const flowOrb=stDarkEase(.035,F.wind,flowAge)*(1-stDarkEase(F.exit-.035,F.exit+.11,flowAge));
  const flowReturnAt=F.exit+.07;
  if(flowStrike&&flowAge>=0&&flowAge<flowReturnAt&&!basic&&!planting){
    const ready=stDarkEase(.02,F.wind,flowAge);
    const slash=stDarkEase(F.hit-.052,F.hit+.066,flowAge);
    const turn=angDiff(Math.PI/2-flowStrike.a,o.g.rotation.y)*ready;
    gear.visible=true;
    o.darkSwordRoot.rotation.y=turn;
    gear.position.lerp(o.darkFlowBladePosition.set(lerp(1.44,-1.45,slash),lerp(.36,.97,slash),lerp(-1.18,1.15,slash)),ready);
    gear.quaternion.slerp(o.darkFlowBladeQ.setFromEuler(o.darkFlowBladeEuler.set(
      lerp(-.72,-.32,slash),lerp(-.44,1.50,slash),lerp(.54,-.84,slash))),ready);
    flowStrike.returnFrom??=new THREE.Object3D();
    gear.getWorldPosition(flowStrike.returnFrom.position);
    gear.getWorldQuaternion(flowStrike.returnFrom.quaternion);
    const emerge=stDarkEase(F.exit-.025,F.exit+.055,flowAge)*(1-stDarkEase(F.exit+.12,F.exit+.33,flowAge));
    if(emerge>0)stDarkPose(o,{back:.32*emerge,roll:-.14*emerge,drop:.16*emerge,arms:.38*emerge,step:.32*emerge});
  }else if(flowStrike&&flowAge>=flowReturnAt){
    if(flowStrike.returnFrom&&!basic&&!planting)darkSettleWeapon(o,flowStrike.returnFrom,1.06);
    o.darkFlowStrike=null;
  }
  const poseBA=o.darkGear.visible&&gear.visible&&!planting&&!(state?.[3]>0)&&baseClock>0;
  o.darkScythe.liveHandPose(o,poseBA?baseClock:0,poseBA?o.darkBAFrom:null);
  const disc=o.darkDisc;
  if(shield>0){o.darkShieldAt=now;o.darkShieldSpin=shield;o.darkShieldPitch=state[6]||0;}
  const brake=(now-(o.darkShieldAt??-Infinity))/1000;
  const shieldReturning=!basic&&brake<.60;
  if(shield>0||shieldReturning){
    const pitch=o.darkShieldPitch,rotation=o.darkShieldSpin*(1-stDarkEase(0,.60,brake));
    const grip=stDarkEase(0,.65,o.darkShieldSpin);
    const position=grip*(1-stDarkEase(0,.60,brake));
    const opaque=state?.[4]>0?stDarkEase(.28,.98,rotation):0;
    o.darkSpinAngle=(o.darkSpinAngle||0)+(o.darkRenderAt==null?0:Math.min(.05,(now-o.darkRenderAt)/1000))*37*rotation;
    disc.visible=opaque>.01;
    disc.position.set(0,1.4+Math.sin(pitch)*1.6,Math.cos(pitch)*1.6);
    disc.rotation.set(-pitch,0,0);
    o.darkDiscInk(o.darkSpinAngle,opaque);
    o.darkDiscFlames(now/1000,opaque);
    o.darkDiscEdge.material.opacity=.52*opaque;
    gear.visible=opaque<.97;
    gear.position.lerp(disc.position,grip);
    o.darkShieldQ.setFromEuler(o.darkShieldEuler.set(-pitch,0,-o.darkSpinAngle));
    gear.quaternion.slerp(o.darkShieldQ,grip);
    o.darkShieldFrom??=new THREE.Object3D();
    gear.getWorldPosition(o.darkShieldFrom.position);
    gear.getWorldQuaternion(o.darkShieldFrom.quaternion);
    o.b.rotation.y=LGPOSE.body*position;
    o.armR.rotation.set(LGPOSE.ax*position,0,(LGPOSE.az-pitch)*position);
    o.lgHeadYaw=LGPOSE.head*position;
    if(o.rig)rigSync(o,0);
    lightHeadPose(o);
  }else{
    disc.visible=false;
    if(o.darkShieldFrom){
      if(!basic&&!planting&&gear.visible)darkSettleWeapon(o,o.darkShieldFrom);
      o.darkShieldFrom=null;
    }
  }
  if(gear.visible&&!planting&&shield<=0&&!shieldReturning)darkBlendWeapon(o,now);
  o.darkRenderAt=now;
  o.darkDashFx?.update(now);
  const rolling=state?.[5]===1&&!o.darkDashFx?.hold;
  const ball=rolling||flowOrb>.018;
  o.darkOrb.visible=ball;
  o.darkOrb.scale.setScalar(rolling?1:.74*flowOrb);
  if(waltzTint>0&&!o.darkDashFx){
    o.darkTint??=stDarkBodyTint(o,true);
    o.darkTint(waltzTint,1);
  }else if(flowOrb>0&&!o.darkDashFx){
    o.darkTint??=stDarkBodyTint(o,true);
    o.darkTint(flowOrb,1-flowOrb);
  }
  if(ball||waltzHidden){
    o.b.visible=false;
    if(waltzHidden)gear.visible=false;
  }else if(o.darkOrbWas&&!o.darkDashFx?.hold)o.b.visible=true;
  if(waltz&&waltzAge>=landing+.075&&waltzAge<landing+.37&&!basic){
    const impact=stDarkEase(landing+.062,landing+.125,waltzAge)*(1-stDarkEase(landing+.15,landing+.37,waltzAge));
    stDarkPose(o,{back:.26*impact,roll:-.13*impact,drop:.19*impact,arms:.4*impact,step:.26*impact});
  }
  o.darkSwordRoot.visible=gear.visible;
  o.darkOrbWas=ball||waltzHidden;
  o.darkUltFx?.updateDarknessUlt?.();
  if(flow>0&&!o.darkFlowView){
    const root=new THREE.Group();o.darkGear.add(root);
    const arm=stDarkFlowArm(root),flames=stDarkFlowFlames(root),orbs=stDarkFlowOrbs(root);
    o.darkFlowView={root,arm,flames,orbs,points:Array.from({length:4},()=>new THREE.Vector3()),chest:new THREE.Vector3(),phase:0};
  }
  const effect=o.darkFlowView;
  if(effect){
    effect.root.visible=flow>0;
    if(flow>0){
      const clock=now/1000;
      effect.phase+=effect.last==null?0:clamp(clock-effect.last,0,.05)*(1+1.8*flow);
      effect.last=clock;
      stDarkFlowArmPath(o,effect.points);
      for(const point of effect.points)effect.root.worldToLocal(point);
      effect.arm.update(effect.points,clock,flow);effect.flames(effect.arm.curve,effect.phase,flow);
      effect.chest.copy(o.b.position);effect.chest.y+=1.25;effect.orbs(effect.chest,clock,flow);
    }
  }
}
function darknessEfx(ev){
  const {z,x,y,h=0,a=0}=ev,o=PM3.get(ev.id);
  if(z==='darkwaltzcast'){
    const root=darkViewRoot(ev,'Night Waltz ricochet');
    root.position.y=GY(x,y)+groundH(x,y,h);
    root.updateMatrixWorld(true);
    const probe=new THREE.Vector3();
    const area=stDarkSlashArea(root,[0,0],ev.radius*S3,(sx,sz)=>{
      root.localToWorld(probe.set(sx,0,sz));
      const wx=probe.x/S3+MW/2,wy=probe.z/S3+MH/2;
      return GY(wx,wy)+groundH(wx,wy,h)-root.position.y;
    });
    const at=darkViewNow||performance.now(),view={at,land:ev.land,first:ev.first,marked:ev.marked};
    if(o)o.darkWaltzCast=view;
    const trail=darkTrailHistory(root,true);
    const departure=ev.first+(ev.marked?ST_DARKNESS_MARK_HOLD:.015);
    const wake=stDarkWake(root,trail.clock,trail.pointAt,trail.heightAt,departure,ev.land,.91);
    const flecks=stDarkWakeShards(root,trail.clock,trail.pointAt,trail.heightAt,departure,ev.land);
    const form=stDarkWaltzForm(root,trail.pointAt,trail.heightAt);
    const chargeRoot=new THREE.Group();chargeRoot.position.y=1.1;root.add(chargeRoot);
    const pressure=stDarkPressure(chargeRoot);
    darkViewTemp(root,ev.land+.88,t=>{
      const landing=view.cancelAt??ev.land;
      area(t,t-landing);
      if(view.cancelAt!=null){
        const end=ev.land+.90;
        wake(end);flecks(end);form(end,probe,0,ev.first,departure,landing,ev.marked);pressure(1,0,t);
        return;
      }
      if(!o)return;
      const point=trail.record(Math.min(t,ev.land),o.g);
      wake(t);flecks(t);
      form(t,point,trail.clock(t),ev.first,departure,ev.land,ev.marked);
      chargeRoot.lookAt(cam.position);
      const launch=t-ST_DARKNESS_WALTZ_LAUNCH;
      pressure(launch<0?lerp(1.28,.32,stDarkEase(.302,ST_DARKNESS_WALTZ_LAUNCH,t)):.44+1.23*stDarkEase(0,.09,launch),
        launch<0?.70*stDarkEase(.304,.343,t):.87*(1-stDarkEase(.015,.127,launch)),t*18);
    },()=>{
      if(o?.darkWaltzCast===view){o.darkWaltzCast=null;o.b.visible=true;o.darkTint?.(0,1);}
    });
    return true;
  }
  if(z==='darkwaltzcancel'){
    if(o?.darkWaltzCast)o.darkWaltzCast.cancelAt=(darkViewNow-o.darkWaltzCast.at)/1000;
    return true;
  }
  if(z==='darkwaltzhit'){
    const root=darkViewRoot({...ev,h:Math.max(ev.floor??0,h-1.13)},ev.marked?'Night Waltz marked impact':'Night Waltz ricochet impact');
    const impact=ev.marked?stDarkMarkedBurst(root,0,0):stDarkSecondaryBurst(root,0,0,ev.index??0);
    darkViewTemp(root,ev.marked?ST_DARKNESS_MARK_CUT_LIFE:ST_DARKNESS_CUT_LIFE,t=>impact(t));
    return true;
  }
  if(z==='darkrift'){
    const recipe=fxData('darkness/ult_v3');
    if(recipe){
      const fx=fxStart(recipe,{x,y,h,a,follow:ev.id,ev:{...ev,darkness:true}},'darkness/ult_v3');
      if(o)o.darkUltFx=fx;
    }
    return true;
  }
  if(z==='darkriftrelease'){
    const fx=o?.darkUltFx;
    if(fx){
      fx.o.follow=null;
      Object.assign(fx,{x,y,h,a,fz:h});
      const brace=darkViewRoot(ev,'Maw caster brace');
      brace.position.y=GY(x,y)+groundH(x,y,h)+.07;
      const floor=new THREE.Group();floor.rotation.x=-Math.PI/2;brace.add(floor);
      const ripple=stDarkPressure(floor);
      darkViewTemp(brace,.29,t=>ripple(.32+1.06*stDarkEase(0,.19,t),.57*(1-stDarkEase(.08,.29,t)),t*7));
    }
    return true;
  }
  if(z==='darkriftcancel'){
    if(o?.darkUltFx){fxKill(o.darkUltFx);o.darkUltFx=null;}
    return true;
  }
  if(z==='darkveil'){
    const root=new THREE.Group();
    root.position.set(tx(x),GY(x,y)+h,tz(y));
    root.rotation.y=Math.PI/2-a;
    const update=stDarkVeilGround(root,ev.radius*S3),life=.91+ev.duration+.36;
    const pose=o&&stDarkVeilCaster(root,o);
    const sequence={at:darkViewNow||performance.now(),world:root.position.clone(),a};
    if(o){o.darkVeilCast=sequence;o.darkSwingAt=undefined;}
    const splash=stDarkMatter(root,'Veil ground flecks',[
      {at:.91,span:.10,count:44,spread:1.6,lift:.65,height:.10},
      {at:1.07,span:.20,count:28,spread:2.35,lift:.34,height:.08},
      {at:1.76,span:.07,count:17,spread:.42,lift:.66,height:.07}
    ],(_t,out)=>out.set(0,0,0),.86);
    update(0,0,0);
    darkViewTemp(root,life,clock=>{
      const t=clock-.91,opacity=stDarkEase(0,.10,t)*(1-stDarkEase(ev.duration,ev.duration+.36,t));
      update(t,stDarkEase(0,.37,t),opacity);splash(clock);
      if(o?.darkVeilCast===sequence&&!o.darkDown&&clock<2.32)pose(clock);
    });
    return true;
  }
  if(z==='darkmarkwind'){if(o)o.darkSwingAt=undefined;darkMarkWind(ev,o);return true;}
  if(z==='darkmarkcast'){darkMarkLaunch(ev,o);return true;}
  if(z==='darkmarkhit'){darkMarkContact(ev);return true;}
  if(z==='darkdashcancel'){
    if(o?.darkDashFx){
      darkSettleWeapon(o,o.darkDashFx.blade);o.darkDashFx.cancelled=true;
      o.darkDashFx=null;o.darkTint?.(0,1);o.b.visible=true;
    }
    return true;
  }
  if(z==='darkdashcharge'||z==='darkdashlong'||z==='darkdashquick'){
    darkDashView(ev,o,z!=='darkdashquick',z==='darkdashcharge');
    return true;
  }
  if(z==='darkba'){
    if(o){
      const now=darkViewNow||performance.now();
      const wind=ST_DARK_LIVE_BA.wind/ST_DARK_LIVE_BA.rate;
      const previousAge=(now-(o.darkSwingAt??-Infinity))/1000;
      o.darkBAFrom=previousAge>=0&&previousAge<ST_DARK_LIVE_BA.idleAfter+ST_DARK_LIVE_BA.returnTime
        ?{clock:ST_DARK_LIVE_BA.start+previousAge*ST_DARK_LIVE_BA.rate,side:o.darkBaSide??-1}:null;
      const chase=o.darkChaseFx;
      if(chase){
        darkSettleWeapon(o,chase.blade(),wind);
        chase.root.visible=false;
        o.darkChaseFx=null;
        o.b.visible=true;
        if(!chase.unmarked)o.darkTint?.(0,1);
      }else if(o.darkMarkCast?.wave.blade?.visible){
        const mark=o.darkMarkCast;
        darkSettleWeapon(o,mark.wave.blade,wind);
        mark.live.scythe=mark.wave.blade.visible=false;
      }else darkSettleWeapon(o,o.darkWeapon,wind);
      if(o.darkFlowStrike){
        o.darkFlowStrike=null;
        o.b.visible=true;
        o.darkTint?.(0,1);
      }
      o.darkVeilCast=null;
      o.darkBAAnchor=null;o.darkBAGroundContact=false;
      o.darkSwingAt=now;o.darkBaEmpowered=ev.empowered;o.darkBaPitch=ev.pitch;o.darkBaYaw=ev.a||0;o.darkBaSide=ev.side;
      const dash=o.darkDashFx;
      if(dash&&!dash.spent&&!dash.cancelled){
        darkSettleWeapon(o,dash.blade,wind);
        dash.spent=true;
        if(dash.hold){dash.cancelled=true;o.b.visible=true;o.darkTint?.(0,1);}
      }
    }
    return true;
  }
  if(z==='darkbasweep'){
    if(o&&o.darkSwingAt!=null)(o.darkBAAnchor??=new THREE.Vector3()).set(tx(x),GY(x,y)+h,tz(y));
    return true;
  }
  if(z==='darkbahit'){
    const root=darkViewRoot(ev,'Darkness BA impact');
    const cut=stScytheHitCut(root,new THREE.Vector3(),ev.ghost);
    darkViewTemp(root,.32,t=>cut(t,-(ev.side??(ev.ghost?1:-1))));
    return true;
  }
  if(z==='darkward'){
    if(!o)return true;
    const root=darkViewRoot(ev,'Ward Drain'),zone=new THREE.Group();
    const dest=darkWorldAt({x:ev.x2,y:ev.y2,h:ev.h2},new THREE.Vector3());
    zone.position.copy(root.worldToLocal(dest));root.add(zone);
    const update=stWardDrainEffect(root,zone,{liveCaster:o,radius:ev.radius*S3,duration:ev.duration});
    const wind=ST_WARD_DRAIN_LAND;
    darkViewTemp(root,.42+ev.duration,t=>update(t<.42?t*wind/.42:wind+t-.42));
    return true;
  }
  if(z==='darkwardhit'){
    const target=PM3.get(ev.target);
    if(target){
      const root=new THREE.Group();
      root.name='Ward Drain affected player';
      const duration=ev.duration??4;
      const effect=stWardDrainTarget(root,duration);
      target.darkWardFx=root;
      darkViewTemp(root,duration,t=>{
        target.g.getWorldPosition(root.position);
        root.visible=target.darkWardFx===root&&target.g.visible&&!target.darkDown;
        if(root.visible)effect(t);
      },()=>{
        if(target.darkWardFx===root)target.darkWardFx=null;
      });
    }
    return true;
  }
  if(z==='darkflow')return true;
  if(z==='darkchasecancel'){
    if(o?.darkChaseFx){
      darkSettleWeapon(o,o.darkChaseFx.blade());
      o.darkChaseFx.root.visible=false;o.darkChaseFx=null;
      o.b.visible=true;o.darkTint?.(0,1);
    }
    if(o?.darkFlowStrike){o.darkFlowStrike.root.visible=false;o.darkFlowStrike=null;}
    return true;
  }
  if(z==='darkchaseflow'){
    if(!o)return true;
    o.darkSwingAt=undefined;
    if(o.darkMarkCast){
      o.darkMarkCast.live.scythe=false;
      if(o.darkMarkCast.wave.blade)o.darkMarkCast.wave.blade.visible=false;
    }
    const root=darkViewRoot(ev,'Nightfall Flow dash');
    const view={at:darkViewNow||performance.now(),a,root};
    o.darkFlowStrike=view;
    const trail=darkTrailHistory(root);
    const F=DARK_CHASE_FLOW;
    const wake=stDarkWake(root,trail.clock,trail.pointAt,trail.heightAt,F.wind,F.exit,.48,.38);
    const weave=stDarkOrbWeave(root,trail.pointAt,trail.heightAt);
    darkViewTemp(root,F.exit+.48,t=>{
      if(o.darkFlowStrike!==view&&t<F.exit)return;
      const point=trail.record(Math.min(t,F.exit),o.g),distance=trail.clock(t);
      const ink=stDarkEase(.05,F.wind,t)*(1-stDarkEase(F.exit,F.exit+.15,t));
      weave(t,point,distance,ink*.58,ink,0,.42,0);wake(t);
    });
    return true;
  }
  if(z==='darkchaseflowhit'){
    const root=darkViewRoot(ev,'Nightfall Flow impact');
    const points=[[-1.52,-.62,.02],[-.18,-.03,.06],[1.65,.67,.04]];
    const rim=stDarkCut(root,points,.29,0x09070e,12),core=stDarkCut(root,points,.155,0xeeeaf4,13);
    darkViewTemp(root,.66,t=>{root.lookAt(cam.position);rim(t,.66,.63);core(t,.43,.50);});
    return true;
  }
  if(z==='darkchaseplainland'){
    const sequence=o?.darkChaseFx;
    if(sequence?.unmarked){
      sequence.landed=true;
      sequence.travel.record(sequence.duration,o.g,darkWorldAt(ev,new THREE.Vector3()));
    }
    return true;
  }
  if(z==='darkchaseplain'||z==='darkchasemarked'){
    if(!o)return true;
    const marked=z==='darkchasemarked',root=darkViewRoot(ev,marked?'Nightfall marked':'Nightfall');
    if(marked)o.darkTint??=stDarkBodyTint(o,true);
    const markedFx=marked?stDarkMarkedChase(root,{live:{id:ev.id,caster:o,distance:ev.distance,bodyTint:o.darkTint}}):null;
    const travel=marked?null:darkTrailHistory(root);
    const idleEuler=new THREE.Euler(),idleWorld=new THREE.Quaternion();
    const restPose=(secondsAhead,position,rotation)=>{
      darkIdleWeaponPose(darkViewNow+secondsAhead*1000,position,idleEuler);
      root.worldToLocal(o.g.localToWorld(position));
      idleWorld.setFromEuler(idleEuler).premultiply(o.g.getWorldQuaternion(rotation));
      root.getWorldQuaternion(rotation).invert().multiply(idleWorld);
    };
    const update=markedFx?markedFx.update:stDarkUnmarkedChase(root,{id:ev.id,caster:o,range:ev.range*S3,travel,duration:ev.duration,restPose});
    const sequence={root,unmarked:!marked,travel,duration:ev.duration,blade:markedFx?.blade??(()=>update.blade)},start=root.position.clone(),target=PM3.get(ev.target)||EM3.get(ev.target);
    const targetOrigin=target?.g.position.clone();
    o.darkSwingAt=undefined;
    o.darkChaseFx=sequence;
    darkViewTemp(root,marked?3.43:1.54,t=>{
      root.visible=!o.darkDown&&o.darkChaseFx===sequence&&o.g.visible;
      if(root.visible){
        if(targetOrigin){
          const k=stDarkEase(.25,.8,t);
          root.position.x=start.x+(target.g.position.x-targetOrigin.x)*k;
          root.position.z=start.z+(target.g.position.z-targetOrigin.z)*k;
        }
        if(!marked&&!sequence.landed)travel.record(Math.min(t,ev.duration),o.g);
        const recovered=update(marked?t:t<=ev.duration?t*.235/ev.duration:.235+t-ev.duration);
        if(!marked&&recovered){
          darkShowWeaponReturn(o,sequence.blade(),.12);
          sequence.recovered=true;
          root.visible=false;
        }
      }
    },()=>{
      markedFx?.dispose();
      if(o.darkChaseFx===sequence){
        if(marked)darkShowWeaponReturn(o,sequence.blade());
        o.darkChaseFx=null;o.b.visible=true;
        if(marked)o.darkTint(0,1);
      }
    });
    return true;
  }
  if(z==='darkchasehit'||z==='darkshield'||z==='darkbite')return true;
  return false;
}


function stDarkShieldInk(parent,radius){
  const material=new THREE.ShaderMaterial({
    uniforms:{spin:{value:0},strength:{value:0}},
    transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    vertexShader:`varying vec2 inkUV;
      void main(){inkUV=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float spin,strength; varying vec2 inkUV;
      void main(){
        float r=length(inkUV),a=atan(inkUV.y,inkUV.x);
        float turn=a-spin;
        float rag=sin(turn*7.+r*26.)*.35+sin(turn*19.-r*12.)*.19;
        float bands=r*72.+.23*sin(turn*3.+r*17.)+.12*sin(turn*13.);
        float hair=1.-smoothstep(.095,.285,abs(fract(bands)-.50));
        float cut=smoothstep(-.52,.43,sin(turn*3.+r*8.)+rag);
        float arc=smoothstep(.10,.77,sin(turn*5.-r*10.)+rag);
        float edge=smoothstep(.84,.975,r)*(1.-smoothstep(.987,1.,r));
        float thickness=smoothstep(.22,.67,r)*(1.-smoothstep(.97,1.,r));
        float alpha=thickness*(.16+hair*(.42+.44*cut)+arc*.42)+edge*(.59+.57*cut);
        vec3 ink=mix(vec3(.002,.002,.005),vec3(.12,.11,.16),hair*(.29+.35*edge)*(1.-arc*.65));
        gl_FragColor=vec4(ink,clamp(alpha,0.,.95)*strength);
        #include <colorspace_fragment>
      }`
  });
  const geometry=new THREE.PlaneGeometry(2*radius,2*radius);
  const sheets=[0,1,2].map(i=>{
    const mesh=new THREE.Mesh(geometry,i===0?material:material.clone());
    mesh.name=i===0?'Scythe Shield ink disc':'Scythe Shield inner layer '+i;
    mesh.renderOrder=7+i;
    mesh.position.z=(i-1)*.075;
    mesh.scale.setScalar(1-i*.085);
    parent.add(mesh);
    return mesh;
  });
  return (angle,strength)=>{
    for(const [i,mesh] of sheets.entries()){
      mesh.visible=strength>.01;
      mesh.material.uniforms.spin.value=(i===1?-angle*.82:angle)+i*1.71;
      mesh.material.uniforms.strength.value=strength*(i===0?1:i===1?.38:.29);
    }
  };
}


function stDarkVeilBlade(scale){
  const ease=(a,b,t)=>THREE.MathUtils.smoothstep(t,a,b),plant=.91;
  const up=new THREE.Vector3(0,1,0);
  const tip=new THREE.Vector3(1.0553,1.6965,0).multiplyScalar(scale);
  const idle=new THREE.Quaternion().setFromEuler(new THREE.Euler(.05,-.39,-.06));
  const lean=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-2.16);
  const pointed=new THREE.Quaternion().setFromAxisAngle(up,-1.04).multiply(lean);
  const drawnBack=new THREE.Quaternion().setFromEuler(new THREE.Euler(.25,-.28,-.94));
  const idleTip=tip.clone().applyQuaternion(idle).add(new THREE.Vector3(-1.35,.055,-1.6));
  const tipAt=new THREE.Vector3(),plantedAt=new THREE.Vector3(0,.042,0);
  const drawPoint=new THREE.Vector3(-2.05,2.96,-2.34);
  const drawBack=new THREE.QuadraticBezierCurve3(idleTip,new THREE.Vector3(-1.70,2.65,-2.22),drawPoint);
  const drop=new THREE.CubicBezierCurve3(drawPoint,new THREE.Vector3(-1.87,3.12,-1.61),
    new THREE.Vector3(-.25,.85,-.22),plantedAt);
  const pullAt=plant+.71,pullClear=DARK_VEIL_PULL_CLEAR,pullDone=pullClear+.51;
  const buriedTip=plantedAt.clone().add(new THREE.Vector3(0,-.28,0));
  const releasedTip=new THREE.Vector3(.03,.47,-.04);
  const liftAway=new THREE.CubicBezierCurve3(releasedTip,new THREE.Vector3(.08,1.38,-.14),
    new THREE.Vector3(-.74,3.33,-1.35),idleTip);
  const bladeSample={pos:new THREE.Vector3(),QB:new THREE.Quaternion(),act:0,shaft:false};
  const bladeOffset=new THREE.Vector3();
  return function bladePose(t){
    const draw=ease(.19,.67,t),fall=clamp((t-.76)/(plant-.76),0,1)**1.7;
    if(t<.76)drawBack.getPoint(draw,tipAt);
    else if(t<plant)drop.getPoint(fall,tipAt);
    else if(t<pullAt)tipAt.copy(plantedAt).lerp(buriedTip,ease(plant,plant+.09,t));
    else if(t<pullClear)tipAt.copy(buriedTip).lerp(releasedTip,clamp((t-pullAt)/(pullClear-pullAt),0,1)**1.6);
    else liftAway.getPoint(ease(pullClear,pullDone,t),tipAt);
    const turn=ease(.76,plant-.015,t);
    bladeSample.QB.copy(idle).slerp(drawnBack,draw).slerp(pointed,turn).slerp(idle,ease(pullClear,pullDone,t));
    bladeSample.pos.copy(tipAt).sub(bladeOffset.copy(tip).applyQuaternion(bladeSample.QB));
    bladeSample.act=ease(.765,.805,t)*(1-ease(plant,plant+.06,t));
    return bladeSample;
  };

}

function stWardDrainPool(parent,radius,fade){
  const material=new THREE.ShaderMaterial({
    uniforms:{
      age:{value:0},spread:{value:.145},
      hold:{value:fade-.56},fade:{value:fade},spin:{value:.94}
    },
    transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`varying vec2 field;void main(){field=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float age,spread,hold,fade,spin;varying vec2 field;
    void main(){
      float launch=clamp(age/spread,0.,1.);
      float expansion=1.-pow(1.-launch,2.4);
      float reach=mix(.035,1.,expansion);
      float r=length(field),a=atan(field.y,field.x);
      float edge=reach*(.979+.018*sin(a*13.+age*5.));
      float softness=reach*mix(.080,.028,expansion);
      float alpha=(1.-smoothstep(edge-softness,edge,r))*
        smoothstep(0.,.033,age)*(1.-smoothstep(hold,fade,age));
      float twist=a+age*spin;
      float streak=smoothstep(.18,.96,cos(twist*3.+r*11.+.32*sin(r*22.)));
      float breaks=.48+.52*smoothstep(-.38,.82,sin(twist*5.-r*5.));
      float swirl=streak*breaks*smoothstep(.12,.34,r)*(1.-smoothstep(.76,.98,r));
      swirl*=smoothstep(.09,.23,age);
      float shock=(1.-smoothstep(.024,.095,abs(r-reach*.88)))*
        smoothstep(.004,.029,age)*(1.-smoothstep(.055,.20,age))*(.64+.36*sin(a*11.+r*6.));
      vec3 shade=vec3(.035,.029,.063)*swirl+vec3(.24,.169,.34)*shock;
      gl_FragColor=vec4(shade,alpha);
      #include <colorspace_fragment>
    }`
  });
  const pool=new THREE.Mesh(new THREE.CircleGeometry(radius,80),material);
  pool.name='Ward drain warning';
  pool.position.y=.031;
  pool.rotation.x=-Math.PI/2;
  pool.renderOrder=2;
  parent.add(pool);
  return age=>{
    pool.visible=age>=0&&age<fade;
    material.uniforms.age.value=age;
  };
}
