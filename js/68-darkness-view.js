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
        float base=max(.37*inside,.75*border);
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
function drawDarknessHud(x,y,state){
  cx.save();
  cx.lineWidth=3;
  cx.strokeStyle='#8c70a7';
  if(state[2]>0){
    cx.beginPath();cx.arc(x,y,21,-Math.PI/2,-Math.PI/2+Math.PI*2*state[2]/6);cx.stroke();
  }
  if(state[3]>0){
    cx.fillStyle='#352744';cx.fillRect(x+24,y-2,32,4);
    cx.fillStyle='#aa8acb';cx.fillRect(x+24,y-2,32*state[4]/3,4);
  }
  for(let i=0;i<2;i++){
    cx.fillStyle=i<state[7]?'#aa8acb':'#352744';
    cx.beginPath();cx.arc(x-4+i*8,y+27,2.8,0,Math.PI*2);cx.fill();
  }
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
  if(o.darkTint&&!o.darkDashFx?.hold)o.darkTint(stDarkEase(.085,.483,age)*(1-stDarkEase(.548,.76,age))*.96);
}
const darkWaveViews=new Map();
function darkViewRoot(ev,name){
  const root=new THREE.Group();
  root.name=name;root.position.set(tx(ev.x),GY(ev.x,ev.y)+(ev.h||0),tz(ev.y));
  root.rotation.y=Math.PI/2-(ev.a||0);
  return root;
}
function darkViewTemp(root,life,update,finish){
  return fireTemp(root,[],life,(_view,k)=>{
    if(k<1){update(k*life);return;}
    finish?.();
    disposeTree(root);root.clear();
  });
}
function darkWorldAt(ev,out){
  return out.set(tx(ev.x),GY(ev.x,ev.y)+(ev.h||0),tz(ev.y));
}
function darkMarkWind(ev,o){
  const root=darkViewRoot(ev,'Darkness Mark Wave');
  const live={scythe:!ev.flow,launch:false};
  const wave=stDarkMarkWave(root,{live,flow:ev.flow});
  const view={root,live,wave,elapsed:0,clock:0};
  if(o)o.darkMarkCast=view;
  const windup=ev.flow?0:.45;
  darkViewTemp(root,2.85,t=>{
    view.elapsed=t;
    if(!live.launch&&o){
      o.g.getWorldPosition(root.position);
      o.g.getWorldQuaternion(root.quaternion);
    }
    view.clock=live.launch?wave.release+t-view.launchAt:Math.min(wave.release-.001,t*wave.release/(windup||.001));
    wave.update(view.clock);
  },()=>{
    if(o?.darkMarkCast===view)o.darkMarkCast=null;
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
  const world=darkWorldAt(ev,new THREE.Vector3());world.y+=1.1;
  const center=view.root.worldToLocal(world);
  const end=view.direction.clone().multiplyScalar(ev.distance*S3).add(new THREE.Vector3(0,1.1,0));
  view.wave.setFlight(end,Math.max(0,view.clock-view.wave.release),center);
  if(target)view.live.target=out=>{
    target.g.getWorldPosition(out);out.y+=1.1;view.root.worldToLocal(out);
  };
}
let darkViewNow=0;
function darkDashView(ev,o,hold,charging){
  if(!o)return;
  if(hold&&!charging&&o.darkDashFx?.hold){
    o.darkDashFx.launchAt=darkViewNow||performance.now();
    return;
  }
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
  darkViewTemp(root,hold?3.5:1.05,()=>{
    if(live.cancelled){root.visible=false;return;}
    if(o.darkDashFx!==live)root.visible=false;
  },()=>{
    if(o.darkDashFx!==live)return;
    o.darkDashFx=null;o.b.visible=true;
    if(hold)o.darkTint(0,1);
  });
}
function darknessCharacter(o,p,viewer,now){
  darkViewNow=now;
  const state=p.dk;
  if(state?.[0]===1&&viewer&&p.tm!==viewer.tm&&p.id!==viewer.id)o.g.visible=false;
  const faint=!!state?.[0]&&!o.ghost;
  if(faint!==!!o.darkFaint){
    o.darkFaint=faint;
    if(!o.ghost)setGhost(o,faint);
  }
  darknessMarkView(o,state?.[1],1.42);
  if(getKit(p.id).path!==DARKP){if(o.darkGear)o.darkGear.visible=false;return;}
  if(!o.darkGear){
    fxLoad('darkness/ult_v3');
    o.darkGear=new THREE.Group();
    o.darkSwordRoot=new THREE.Group();o.darkGear.add(o.darkSwordRoot);
    const blade=stDarkVeilBlade(1.4);
    const scytheArgs={wrap:'C',manual:true,scale:1.4,side:-1.5,trailPose:blade,mode:'ba',liveBA:true};
    o.darkScythe=stCreateScythePreview(o.darkSwordRoot,scytheArgs);
    o.darkVeilBlade=blade;o.darkScytheArgs=scytheArgs;
    o.darkBuffBlade=stDarkChargedBlade(o.darkScythe.blade);
    const sample={pos:new THREE.Vector3(),QB:new THREE.Quaternion(),act:0,shaft:false};
    const rotation=new THREE.Euler();
    o.darkSwingPose=(t)=>{
      const wind=THREE.MathUtils.smoothstep(t,0,.2),strike=THREE.MathUtils.smoothstep(t,.2,.32);
      const recover=THREE.MathUtils.smoothstep(t,.33,.8),lift=o.darkSwingKind==='up';
      const weight=1-recover;
      const outward=wind*(1-strike);
      const sweep=(1.15*outward-1.9*strike)*weight;
      sample.pos.set(1.5+sweep,.08+weight*(lift?2.35*strike:.64*strike),weight*(-1.5*outward+3.6*strike));
      rotation.set(weight*(lift?-1.65*strike:.4*outward),weight*(-.35-.8*outward+1.46*strike),
        .16+weight*(lift?1.55*outward-.9*strike:1.4*outward+.75*strike));
      sample.QB.setFromEuler(rotation);
      sample.act=o.darkSwingKind==='cutOnly'?0:THREE.MathUtils.smoothstep(t,.19,.23)*(1-THREE.MathUtils.smoothstep(t,.3,.39));
      return sample;
    };
    o.darkWeapon=o.darkScythe.pivot;
    o.darkDisc=new THREE.Group();
    o.darkDiscInk=stDarkShieldInk(o.darkDisc,3.5);
    o.darkDiscFlames=stDarkShieldFlames(o.darkDisc,3.5);
    o.darkDisc.position.y=1.4;o.darkGear.add(o.darkDisc);
    o.darkOrb=darkFxMesh(new THREE.SphereGeometry(.72,20,16),0x101017);
    o.darkOrb.position.y=1.1;o.darkGear.add(o.darkOrb);
    o.darkFlowOrbs=Array.from({length:3},()=>{
      const orb=darkFxMesh(new THREE.SphereGeometry(.16,10,8),0x15111d);
      o.darkGear.add(orb);return orb;
    });
    o.g.add(o.darkGear);
  }
  o.darkGear.visible=!p.dn;
  o.shield.visible=false;
  const gear=o.darkWeapon,age=(now-(o.darkSwingAt??-1e4))/1000;
  const swing=age>=0&&age<.92&&o.darkSwingKind!=='ba';
  const basic=age>=0&&age<1.55&&o.darkSwingKind==='ba';
  const baseClock=basic?2+age*1.48:0;
  gear.visible=(!state?.[5]||swing)&&!o.darkMarkCast?.wave.blade.visible&&(!o.darkDashFx||o.darkDashFx.spent);
  if(o.darkDashFx?.cancelled||p.dn){if(o.darkDashFx)o.darkDashFx.cancelled=true;o.b.visible=true;}
  const waltzAge=(now-(o.darkWaltzAt??-Infinity))/1000;
  if(waltzAge>=0&&waltzAge<1.01)stNightWaltzPose(o,waltzAge);
  gear.position.set(1.5,.08+Math.sin(now*.002)*.09,0);
  gear.rotation.set(.25,now*.0015,.16);
  const veil=o.darkVeilCast,t=veil?(now-veil.at)/1000:Infinity;
  const planting=t>=0&&t<2.55;
  o.darkScytheArgs.trailPose=planting?o.darkVeilBlade:swing?o.darkSwingPose:null;
  o.darkSwordRoot.position.set(0,0,0);
  o.darkSwordRoot.rotation.y=0;
  if(planting){
    const settle=THREE.MathUtils.smoothstep(t,2.09,2.55);
    const plant=o.darkVeilBlade(t);
    gear.position.lerp(plant.pos,1-settle);
    gear.quaternion.slerp(plant.QB,1-settle);
    o.darkSwordRoot.position.copy(veil.world);
    o.g.worldToLocal(o.darkSwordRoot.position).multiplyScalar(1-settle);
    o.darkSwordRoot.rotation.y=angDiff(Math.PI/2-veil.a,o.g.rotation.y)*(1-settle);
  }else if(swing){
    const blade=o.darkSwingPose(age),weight=1-THREE.MathUtils.smoothstep(age,.64,.92);
    gear.position.lerp(blade.pos,weight);gear.quaternion.slerp(blade.QB,weight);
  }
  o.darkScytheArgs.empowered=basic&&o.darkBaEmpowered;
  gear.scale.setScalar(state?.[8]?1.10:1);
  o.darkBuffBlade(now/1000,state?.[8]&&!o.darkDashFx?1:0,0);
  if(gear.visible&&o.g.visible)o.darkScythe.update(now/1000,0,0,planting?t:swing?age:baseClock);
  if(basic){
    o.b.rotation.y=o.darkSwordRoot.userData.baState(baseClock).tw;
    if(o.rig)rigSync(o,0);
  }
  const disc=o.darkDisc,shield=state?.[3]||0;
  if(shield>0){o.darkShieldAt=now;o.darkShieldSpin=shield;}
  const brake=(now-(o.darkShieldAt??-Infinity))/1000;
  if(shield>0||brake<.9){
    const pitch=state?.[6]||0,rotation=Math.max(0,o.darkShieldSpin)*(1-stDarkEase(0,.9,brake));
    const position=stDarkEase(0,.65,shield||1)*(1-stDarkEase(0,.87,brake));
    const opaque=state?.[4]>0?stDarkEase(.28,.98,rotation):0;
    o.darkSpinAngle=(o.darkSpinAngle||0)+(o.darkRenderAt==null?0:Math.min(.05,(now-o.darkRenderAt)/1000))*37*rotation;
    disc.visible=opaque>.01;
    disc.position.set(0,1.4+Math.sin(pitch)*1.6,Math.cos(pitch)*1.6);
    disc.rotation.set(-pitch,0,0);
    o.darkDiscInk(o.darkSpinAngle,opaque);
    o.darkDiscFlames(now/1000,opaque);
    gear.visible=opaque<.97;
    gear.position.lerp(disc.position,position);
    const shieldQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(-pitch,0,-o.darkSpinAngle));
    gear.quaternion.slerp(shieldQ,position);
    o.b.rotation.y=LGPOSE.body*position;
    o.armR.rotation.set(LGPOSE.ax*position,0,(LGPOSE.az-pitch)*position);
    o.lgHeadYaw=LGPOSE.head*position;
    if(o.rig)rigSync(o,0);
    lightHeadPose(o);
  }else disc.visible=false;
  o.darkRenderAt=now;
  o.darkDashFx?.update(now);
  o.darkOrb.visible=!!state?.[5]&&!o.darkDashFx?.hold;
  if(o.darkOrb.visible)o.b.visible=false;
  else if(o.darkOrbWas&&!o.darkDashFx?.hold)o.b.visible=true;
  o.darkOrbWas=o.darkOrb.visible;
  for(const [i,orb] of o.darkFlowOrbs.entries()){
    orb.visible=state?.[2]>0;
    if(orb.visible){const a=now*.004+i*Math.PI*2/3;orb.position.set(Math.cos(a)*1.7,1.1+Math.sin(a*2)*.37,Math.sin(a)*1.7);}
  }
}
function darknessEfx(ev){
  const {z,x,y,h=0,a=0}=ev,o=PM3.get(ev.id);
  if(z==='dark_nightwaltz'){
    const root=darkViewRoot(ev,'Night Waltz'),clock={t:0};
    root.scale.setScalar(ev.radius*S3/ST_WALTZ_AREA);
    stNightWaltzArea(root,clock);nightWaltzBorder(root,clock,true);
    if(o)o.darkWaltzAt=darkViewNow||performance.now();
    darkViewTemp(root,1.9,t=>{clock.t=t;});
    return true;
  }
  if(z==='darkwaltzhit'){
    const root=darkViewRoot(ev,'Night Waltz hit');
    root.position.y+=1.15;
    const marked=ev.marked,span=marked?1.1:.70,points=[[-span,-.36,0],[.10,.25,.03],[span,.32,0]];
    const outer=stDarkCut(root,points,marked?.15:.10,0x111015);
    const core=stDarkCut(root,points,marked?.038:.019,marked?0xd1cbd8:0x857c8d,13);
    darkViewTemp(root,.26,t=>{root.lookAt(cam.position);outer(t,.26);core(t,.18);});
    return true;
  }
  if(z==='darkrift'){
    const recipe=fxData('darkness/ult_v3');
    if(recipe)fxStart({...recipe,layers:recipe.layers.filter(l=>l.t!=='code')},{x,y,h,a},'darkness/ult_v3');
    if(o)castStart(o,'line');
    return true;
  }
  if(z==='darkveil'){
    const root=new THREE.Group();
    root.position.set(tx(x),GY(x,y)+h,tz(y));
    const update=stDarkVeilGround(root,ev.radius*S3),life=.91+ev.duration+.36;
    const materials=[];root.traverse(m=>{if(m.material)materials.push(m.material);});
    update(0,0,0);
    fireTemp(root,materials,life,(_v,k)=>{
      const t=k*life-.91,opacity=t<0?0:1-clamp((t-ev.duration)/.36,0,1);
      update(t,clamp(t/.29,0,1),opacity);
    });
    if(o){o.darkVeilCast={at:darkViewNow||performance.now(),world:root.position.clone(),a};castStart(o,'line');}
    return true;
  }
  if(z==='darkmarkwind'){darkMarkWind(ev,o);return true;}
  if(z==='darkmarkcast'){darkMarkLaunch(ev,o);return true;}
  if(z==='darkmarkhit'){darkMarkContact(ev);return true;}
  if(z==='darkdashcharge'||z==='darkdashlong'||z==='darkdashquick'){
    darkDashView(ev,o,z!=='darkdashquick',z==='darkdashcharge');
    return true;
  }
  if(z==='darkba'){
    if(o){
      o.darkSwingAt=darkViewNow||performance.now();o.darkSwingKind='ba';o.darkBaEmpowered=ev.empowered;
      if(o.darkDashFx&&!o.darkDashFx.hold)o.darkDashFx.spent=true;
    }
    return true;
  }
  if(z==='darkbahit'){
    const root=darkViewRoot(ev,'Darkness BA impact');
    const cut=stScytheHitCut(root,new THREE.Vector3(0,1.15,0),ev.ghost);
    darkViewTemp(root,.32,t=>cut(t,ev.ghost?-1:1));
    return true;
  }
  if(z==='darkward'){
    const root=new THREE.Group(),life=.42+ev.duration;
    root.position.set(tx(ev.x2),GY(ev.x2,ev.y2)+ev.h2,tz(ev.y2));
    const pool=stWardDrainPool(root,ev.radius*S3,ev.duration);
    const from=new THREE.Vector3(tx(x),GY(x,y)+h+1.45,tz(y));
    const beam=darkFxMesh(new THREE.CylinderGeometry(.075,.14,1,10,1,true),0x130d1d,.92);
    const direction=from.clone().sub(root.position);
    beam.position.copy(direction).multiplyScalar(.5);
    beam.scale.y=direction.length();
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
    root.add(beam);beam.visible=false;
    pool(-1);
    fireTemp(root,root.children.map(mesh=>mesh.material),life,(_v,k)=>{
      const age=k*life-.42;
      pool(age);
      beam.visible=age>=-.07&&age<.16;
      beam.material.opacity=.92*(1-THREE.MathUtils.smoothstep(age,0,.16));
    });
    if(o)castStart(o,'line');
    return true;
  }
  if(['darkchaseplain','darkchasehit','darkshield','darkflow','darkchasemarked','darkbite'].includes(z)){
    if(o&&['darkchaseplain','darkchasehit'].includes(z)){
      o.darkSwingAt=darkViewNow||performance.now();
      o.darkSwingKind=z==='darkchaseplain'?'up':z==='darkchasehit'&&!ev.last?'cutOnly':'sweep';
      castStart(o,'line');
    }
    if(z==='darkchasehit')burst(x,y,'#100c18',12,115,.4,2.4,{h:h+1,g:5});
    return true;
  }
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
  const pullAt=plant+.71,pullClear=pullAt+.18,pullDone=pullClear+.51;
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
