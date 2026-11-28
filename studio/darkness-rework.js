// Darkness rework previews (user 2026-11-27): Death Sentence horizontal slash wave, Nightfall lift (no mark),
// Nightfall pass + slam (marked). The real studio player is posed through CANIM (knees/elbows from the game's
// pose code); the scythe, targets and VFX live in a root frame at the start spot:
// +z = aim, +x = the caster's LEFT, y up, metres. Driven from studio/class-stance.js (args.darkRework).
// timings come from the host (js/09-darkness.js) so the visuals land on the real hits
const DKR={
  mark:{wind:.08,release:DARK_V.markPrep,speed:DARK_MARK.v.speed*S3,range:DARK_MARK.v.range*S3,targetZ:14,width:3.4,bow:1.25,tail:2.6},
  lift:{crouch:DARK_LIFT.stepAt,plant:DARK_LIFT.stepAt+DARK_LIFT.stepT,lift:DARK_LIFT.at,step:DARK_LIFT.step*S3,r:DARK_LIFT.r*S3,peak:4,peakT:.6,stun:DARK_LIFT.stun,tower:4.2},   // r 3 m = 60 px (user 2026-11-28: only right around you)
  marked:{...DARK_NF,targetZ:12},
  flow:{launch:DARK_CHASE_FLOW.wind,hit:DARK_CHASE_FLOW.hit,appear:DARK_CHASE_FLOW.exit,back:2.4}   // Flow: one pass-through slash, land on the far side (no slam)
};
// CANIM keys: [u, armR.x, armR.z, twist(+ = right shoulder leads), lean(+ fwd), armL.x, armL.z, roll, drop, ease]
Object.assign(CANIM,{
  // Death Sentence: coil right with both hands gathered at the right hip (charge, trembling) -> unwind left, both hands flick out level -> hold -> settle
  dk_sentence:{d:1.0,st:0,nc:1,tm:[.09,.32],k:[[.09,-.35,.25,-.6,.14,.35,-1.0,.05,-.08,'s'],[.31,-.38,.28,-.7,.16,.4,-1.05,.06,-.1,'s'],   // round 3: left hand lower + straighter so both hands meet at the right hip
    
    [.39,-1.45,.3,.55,.18,-1.3,1.0,-.04,-.07,'i'],[.53,-1.5,.38,.62,.16,-1.25,1.15,-.05,-.06,'o'],[1,-.5,.15,.1,.04,-.3,.3,0,-.02,'s']],
    j:[[0,.2,.2,.7,-.1,.1,.12,-.12],[.09,.75,.6,.3,-.45,.15,.2,-.2],[.31,.85,.7,.3,-.5,.18,.22,-.22],[.39,.55,.45,.35,-.3,.1,.2,-.2],[.53,.5,.42,.3,-.28,.1,.2,-.2],[1,.2,.2,.6,-.1,.1,.12,-.12]]},
  // Flow Death Sentence: no charge, quick flick of both hands (same release shape)
  dk_sentence_q:{d:.55,st:0,nc:1,k:[[.08,.1,-.1,-.6,.14,-.5,-.95,.05,-.08,'s'],[.2,-1.45,.3,.55,.18,-1.3,1.0,-.04,-.07,'i'],[.4,-1.5,.38,.62,.16,-1.25,1.15,-.05,-.06,'o'],[1,-.5,.15,.1,.04,-.3,.3,0,-.02,'s']]},
  // Nightfall lift: crouch, arms back -> step + plant, deep knees, arms low and out -> torso follows the sweep -> scoop both arms up, lean back -> settle
  dk_lift:{d:1.15,st:0,nc:1,k:[[.07,.45,-.25,-.3,0,.45,.25,0,-.06,'s'],[.17,-.35,-.55,.05,.02,-.35,.55,0,-.09,'i'],[.32,-.5,-1.05,.85,.02,-.45,1.0,-.06,-.08,'s'],
    [.4,-2.75,-.3,.2,-.22,-2.7,.3,0,.02,'o'],[.55,-2.8,-.25,.15,-.2,-2.75,.25,0,.02,'s'],[1,-.6,-.2,0,.05,-.5,.2,0,0,'s']],
    j:[[0,.2,.2,.7,-.1,.1,.12,-.12],[.07,.65,.55,1.0,-.38,-.1,.2,-.2],[.17,.85,.75,.8,-.48,-.2,.26,-.26],[.32,.8,.7,.6,-.45,-.18,.26,-.26],[.4,.2,.25,.4,-.15,.1,.2,-.2],[1,.2,.2,.6,-.1,.1,.12,-.12]]},
  // Nightfall marked slam: both hands raised overhead, arched back -> hang -> slam down, bent over -> hold
  // Flow Nightfall: land on the far side, scythe arm follows through, short crouch -> settle
  dk_flowland:{d:.55,st:0,nc:1,k:[[.12,-1.25,-.7,.7,.22,.35,.55,0,-.14,'o'],[.4,-1.2,-.75,.65,.2,.3,.5,0,-.12,'s'],[1,-.5,-.2,.1,.05,-.3,.3,0,-.02,'s']],
    j:[[0,.4,.4,.6,-.2,.1,.15,-.15],[.12,.9,.8,.6,-.5,-.1,.25,-.25],[.4,.85,.75,.6,-.48,-.1,.25,-.25],[1,.2,.2,.6,-.1,.1,.12,-.12]]},
  dk_slam:{d:.8,st:0,nc:1,tm:[.2,.3],k:[[.18,-3.0,.22,-.15,-.28,-2.95,-.22,0,0,'s'],[.3,-3.05,.25,-.18,-.3,-3.0,-.25,0,0,'s'],
    [.4,-.95,.12,.12,.3,-.9,-.12,0,-.14,'i'],[.6,-.9,.1,.1,.28,-.85,-.1,0,-.14,'s'],[1,-.5,.1,0,.1,-.4,.2,0,-.03,'s']],
    j:[[0,.3,.3,.4,-.2,.1,.15,-.15],[.18,.25,.2,.35,-.1,.2,.15,-.15],[.4,1.1,.95,.5,-.6,-.2,.25,-.25],[.6,1.05,.9,.5,-.55,-.2,.25,-.25],[1,.2,.2,.6,-.1,.1,.12,-.12]]}
});

const DKR_SCALE=1.40,DKR_CENTER=new THREE.Vector3(.69,2.03,0).multiplyScalar(DKR_SCALE);
const DKR_TIP=new THREE.Vector3(1.0553,1.6965,0).multiplyScalar(DKR_SCALE).sub(DKR_CENTER);
const DKR_TIPROLL=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.atan2(2.17-1.6965,1.0553-.04));
function dkrBasis(tip,shaft,out=new THREE.Quaternion()){
  const x=new THREE.Vector3(...tip).normalize(),y=new THREE.Vector3(...shaft);
  y.addScaledVector(x,-x.dot(y)).normalize();
  return out.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,new THREE.Vector3().crossVectors(x,y)));
}
const DKR_IDLE={p:new THREE.Vector3(1.22,3.08,-.62),q:dkrBasis([.63,.03,-.78],[-.05,1,0])};
// level sweep around a centre: phi 0 = in front, -pi/2 = caster's right, +pi/2 = left; blade tip leads the motion
const _dkrR=new THREE.Vector3(),_dkrT=new THREE.Vector3(),_dkrZ=new THREE.Vector3(),_dkrM=new THREE.Matrix4(),_dkrQ=new THREE.Quaternion();
function dkrSweep(center,phi,radius,tilt,dir,pos,q){
  _dkrR.set(Math.sin(phi),0,Math.cos(phi));_dkrT.set(Math.cos(phi),0,-Math.sin(phi)).multiplyScalar(dir);
  _dkrZ.crossVectors(_dkrT,_dkrR);q.setFromRotationMatrix(_dkrM.makeBasis(_dkrT,_dkrR,_dkrZ));
  q.premultiply(_dkrQ.setFromAxisAngle(_dkrR,tilt));
  pos.copy(center).addScaledVector(_dkrR,radius);
}
// many independent ribbons in one mesh (vertex rgba, ink material)
function dkrRibbons(parent,name,count,rows,order,additive){
  const n=count*rows*2,geo=new THREE.BufferGeometry(),idx=[];
  const pos=new THREE.BufferAttribute(new Float32Array(n*3),3).setUsage(THREE.DynamicDrawUsage);
  const col=new THREE.BufferAttribute(new Float32Array(n*4),4).setUsage(THREE.DynamicDrawUsage);
  for(let c=0;c<count;c++)for(let i=0;i<rows-1;i++){const a=(c*rows+i)*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  geo.setAttribute('position',pos);geo.setAttribute('color',col);geo.setIndex(idx);
  const mat=stScyInk();mat.color.setHex(0xffffff);mat.side=THREE.DoubleSide;
  if(additive){mat.blending=THREE.AdditiveBlending;}
  const mesh=new THREE.Mesh(geo,mat);mesh.name=name;mesh.frustumCulled=false;mesh.renderOrder=order;parent.add(mesh);
  return {mesh,count,rows,
    set(c,i,ax,ay,az,bx,by,bz,r,g,b,a){const k=(c*rows+i)*2;pos.setXYZ(k,ax,ay,az);pos.setXYZ(k+1,bx,by,bz);col.setXYZW(k,r,g,b,a);col.setXYZW(k+1,r,g,b,a);},
    hide(c){for(let i=0;i<rows;i++){const k=(c*rows+i)*2;col.setW(k,0);col.setW(k+1,0);}},
    flush(){pos.needsUpdate=true;col.needsUpdate=true;}};
}
let _dkrGlowTex=null;
function dkrDiscTex(){
  if(_dkrGlowTex)return _dkrGlowTex;
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(.55,'rgba(255,255,255,.8)');
  g.addColorStop(.86,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);
  return _dkrGlowTex=new THREE.CanvasTexture(c);
}
// preview-only X mark as a camera-facing sprite (the mesh mark faced the game camera and vanished edge-on / on black cloaks)
let _dkrXTex=null;
function dkrXMark(parent){
  if(!_dkrXTex){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.lineCap='butt';
    const stroke=(w,col)=>{x.strokeStyle=col;x.lineWidth=w;x.beginPath();x.moveTo(40,36);x.lineTo(216,220);x.moveTo(218,38);x.lineTo(38,218);x.stroke();};
    stroke(58,'#e9e6f2');stroke(46,'#050508');stroke(26,'#3a3846');
    _dkrXTex=new THREE.CanvasTexture(c);}
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:_dkrXTex,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));
  sp.position.set(0,1.25,0);sp.scale.setScalar(.95);sp.renderOrder=20;parent.add(sp);return sp;
}
const dkrRnd=n=>{const v=Math.sin(n*127.1+71.4)*43758.5453;return v-Math.floor(v);};

// L (live, in a match): {root, o, distance (m), range (m), pitch} — no dummies, no camera, the host moves the caster
function studioDarkRework(kind,me,home,foe,L){
  const ease=stDarkEase,live=!!L,root=live?L.root:new THREE.Group();if(!live){root.name='Darkness rework preview ('+kind+')';scene.add(root);}
  const look={...getLook(NET.myId),ws:-1,wn:0};
  const dummy=(name,x,z,v)=>{const k=2+(v%2),tl={...look,h:k,cl:k,hs:k},a=stDarkShiftStudent(root,tl,name,lookTint(tl));
    a.g.position.set(x,0,z);a.g.rotation.y=Math.PI;a.home=new THREE.Vector3(x,0,z);return a;};
  const scythe=stCreateScythePreview(root,{wrap:'C',manual:true,scale:DKR_SCALE,trailPose:t=>bladeAt(t),trailWidth:kind==='mark'?.28:1.2});
  scythe.pivot.name='Rework scythe';
  const sample={pos:new THREE.Vector3(),QB:new THREE.Quaternion(),act:0};
  const P=new THREE.Vector3(),Q=new THREE.Quaternion(),Q2=new THREE.Quaternion(),V=new THREE.Vector3(),V2=new THREE.Vector3();
  let casterZ=0,casterY=0,bladeAt=()=>sample,update=()=>{},cleanup=()=>{};
  const fired={},markApi={};
  const trigger=(o,key,at,t)=>{if(t<at-.001){fired[key]=0;return;}if(!fired[key]){fired[key]=1;o.caN=key;o.caT=Math.max(0,t-at);o.cpT=0;}};
  const finish=(pos,q,size=1)=>{sample.pos.copy(pos).sub(V.copy(DKR_CENTER).multiplyScalar(size).applyQuaternion(q));sample.QB.copy(q);return sample;};
  const idleAt=(z,y,pos,q)=>{pos.copy(DKR_IDLE.p);pos.z+=z;pos.y+=y;q.copy(DKR_IDLE.q);};
  const _tipO=new THREE.Vector3();   // own temp: callers pass V2 as pos
  const fromTip=(tip,dir,shaft,pos,q)=>{dkrBasis(dir,shaft,q).multiply(DKR_TIPROLL);_tipO.copy(DKR_TIP).applyQuaternion(q);pos.copy(tip).sub(_tipO);};
  const toRoot=(obj,out)=>{obj.getWorldPosition(out);return root.worldToLocal(out);};
  const handMid=(o,out)=>{const r=stBone(o,'hand_R'),l=stBone(o,'hand_L');if(!r||!l)return out.set(0,1.1,casterZ+.4);
    r.getWorldPosition(out);l.getWorldPosition(V2);out.lerp(V2,.5);return root.worldToLocal(out);};

  if(kind==='mark'){
    // L.quick = Flow cast (no charge, fast flick) • L.flightOnly = the two side waves of the Flow cast (crescent only)
    const quick=!!L?.quick,only=!!L?.flightOnly,S=quick||only?{...DKR.mark,wind:0,release:.07}:DKR.mark,target=live?null:dummy('Death Sentence target',.3,S.targetZ,0),showMark=target&&stDarkTargetMark(target.g),tint=target&&stDarkBodyTint(target);
    const strike=S.release-.03,sweepEnd=S.release+.09,over=sweepEnd+.1,back=over+.42;
    const center=new THREE.Vector3(0,1.0,0);
    bladeAt=t=>{
      const coil=ease(0,S.wind+.06,t),charge=ease(S.wind,strike,t);
      let phi,tilt=.28,radius=3.55;   // round 2 (user): shaft no longer through the body: pivot sits ~.7 m out
      if(t<strike){phi=-2.2-.3*charge+.03*Math.sin(t*70)*charge;center.y=.95+.1*charge;}
      else if(t<sweepEnd){const f=(t-strike)/(sweepEnd-strike);phi=-2.25+3.75*f*f*(1.6-.6*f);tilt=.28-.38*f;center.y=1.3-.12*f;}
      else{const f=ease(sweepEnd,over,t);phi=1.5+.25*f;tilt=-.1;center.y=1.18;}
      dkrSweep(center,phi,radius,tilt,1,P,Q);
      if(coil<1){idleAt(0,0,V2,Q2);P.lerp(V2,1-coil);Q.slerp(Q2,1-coil);}
      const ret=ease(over,back,t);
      if(ret>0){idleAt(0,0,V2,Q2);P.lerp(V2,ret);P.y+=.5*Math.sin(Math.PI*ret);Q.slerp(Q2,ret);}
      finish(P,Q);sample.act=.6*ease(strike+.01,strike+.03,t)*(1-ease(sweepEnd-.02,sweepEnd+.03,t));return sample;
    };
    // charge: ink streaks spiral into the joined hands, a few white sparks late
    const streaks=dkrRibbons(root,'Sentence charge streaks',40,6,10);
    const flight=new THREE.Group();flight.name='Sentence crescent';root.add(flight);
    const ROWS=57;
    const sheet=stMarkWaveSheet(flight,'Sentence crescent tail',ROWS,8,8);
    const lip=stMarkWaveSheet(flight,'Sentence crescent leading edge',ROWS,4,9);
    const shine=stMarkWaveSheet(flight,'Sentence crescent white line',ROWS,2,10);
    const tongues=stMarkWaveSheet(flight,'Sentence crescent flame tongues',ROWS,4,9);
    const trail=dkrRibbons(root,'Sentence travel trail',3,40,7);
    const start=new THREE.Vector3(0,1.2,1.3);let releaseAt=live?1e9:S.release,hitZ=live?S.range:S.targetZ-.55,hitT=S.release+(hitZ-start.z)/S.speed,markAt=hitT+.22;
    markApi.launch=t=>{releaseAt=t;hitT=releaseAt+(hitZ-start.z)/S.speed;};markApi.contact=d=>{hitZ=Math.max(start.z+.5,d-.55);hitT=releaseAt+(hitZ-start.z)/S.speed;};
    const flakes=live?()=>{}:stDarkMatter(root,'Sentence wave flakes',[{at:S.release,span:hitT-S.release,count:70,spread:2.4,lift:.7,height:1.25},
      {at:hitT,span:.06,count:46,spread:2.8,lift:1.3,height:1.2,back:-.4}],(at,out)=>out.set(0,0,Math.min(hitZ,start.z+(at-S.release)*S.speed)));
    const launch=stDarkMatter(root,'Sentence release shards',[{at:S.release-.01,span:.07,count:40,spread:1.6,lift:.9,height:1.25}],(_a,out)=>out.set(0,0,1.0));
    const sparks=new THREE.InstancedMesh(new THREE.OctahedronGeometry(1,0),new THREE.MeshBasicMaterial({color:0xf3f1ff,toneMapped:false}),14);
    sparks.frustumCulled=false;sparks.count=0;root.add(sparks);const leaf=new THREE.Object3D();
    const hand=new THREE.Vector3(),seg=new THREE.Vector3();
    if(only)scythe.pivot.visible=false;
    update=(t,o)=>{
      if(!only)trigger(o,quick?'dk_sentence_q':'dk_sentence',0,t);
      // charge streaks
      if(o)handMid(o,hand);
      const gather=quick||only?0:ease(.04,S.wind+.05,t)*(1-ease(S.release-.02,S.release+.04,t));
      for(let c=0;c<40;c++){
        const ph=dkrRnd(c),born=.06+ph*.26,life=.16+.06*dkrRnd(c+9),u=(t-born)/life;
        if(u<=0||u>=1||gather<=0){streaks.hide(c);continue;}
        const a0=dkrRnd(c+3)*6.283,el=(dkrRnd(c+5)-.5)*1.6,r0=1.0+dkrRnd(c+7)*.9;
        for(let i=0;i<6;i++){
          const s=clamp(u-i*.045,0,1),r=r0*(1-s)**1.35,a=a0+s*2.4;
          seg.set(hand.x+Math.cos(a)*r,hand.y+el*r*.6+Math.sin(a*1.3)*r*.25,hand.z+Math.sin(a)*r);
          const w=.022*(1-i/5)*(1-s*.5);
          const tone=c%7===0?.6:.03;
          streaks.set(c,i,seg.x,seg.y-w,seg.z,seg.x,seg.y+w,seg.z,tone,tone,tone*1.15,gather*(1-i/6)*Math.sin(Math.PI*u)**.5*.95);
        }
      }
      streaks.flush();
      let sc=0;
      for(let i=0;i<14&&o&&!quick&&!only;i++){const born=.2+dkrRnd(i+40)*.18,u=(t-born)/.09;if(u<0||u>1)continue;
        const a=dkrRnd(i+41)*6.283,r=.32*(1-u)+.05;leaf.position.set(hand.x+Math.cos(a)*r,hand.y+(dkrRnd(i+42)-.5)*.3,hand.z+Math.sin(a)*r);
        leaf.rotation.set(a,a*2,0);leaf.scale.set(.012,.05*(1-u)+.01,.012);leaf.updateMatrix();sparks.setMatrixAt(sc++,leaf.matrix);}
      sparks.count=sc;sparks.instanceMatrix.needsUpdate=true;
      // crescent flight
      const fly=t-releaseAt,age=t-hitT,breakUp=clamp(age/.2,0,1),fade=(1-breakUp)**1.1;
      flight.visible=fly>=0&&fade>.003;
      if(flight.visible){
        const dz=Math.min(hitZ,start.z+fly*S.speed)+(age>0?1.2*(1-Math.exp(-age*9)):0);
        const pitch=L?.pitch||0;flight.position.set(0,start.y+(dz-start.z)*Math.sin(pitch),start.z+(dz-start.z)*Math.cos(pitch));flight.rotation.x=-pitch;
        const grow=.45+.55*ease(0,.1,fly),W=S.width*.85*grow,bow=S.bow*grow;
        for(let i=0;i<ROWS;i++){
          const u=i/(ROWS-1),v=2*u-1,taper=(1-v*v)**.6,front=bow*(1-v*v);
          const tear=ease(.2,.8,.5+.5*Math.sin(v*23+t*31))*breakUp;
          const op=fade*(1-tear);
          for(let j=0;j<8;j++){
            const s=j/7,k=i*8+j,flick=.12*Math.sin(t*26-s*8+v*5)*s;
            // solid crescent band (first 40%), then thin wisps trailing from the middle
            // round 2 (user: sharp and slender like the first wave): thin band with needle tips, short thin wisps
            const thick=.36*grow*taper**1.7,band=s<.55,q=band?s/.55:(s-.55)/.45;
            const back=band?q*thick:thick+q*1.1*grow*taper**2.4;
            sheet.positions.setXYZ(k,v*W*(1-.08*s),.05*Math.sin(v*7+t*18)*s+flick+.12*s*s,front-back);
            const tone=band?0:.05*q;
            sheet.colors.setXYZW(k,tone,tone,tone*1.2,op*(band?.97*ease(0,.12,taper):.6*(1-q)**1.3*taper));
          }
          for(let j=0;j<4;j++){
            const s=j/3,k=i*4+j,h=.14*taper**1.5*grow;
            lip.positions.setXYZ(k,v*W,(s*2-1)*h,front+.03-.12*Math.abs(s*2-1));
            lip.colors.setXYZW(k,0,0,0,op*taper*.97);
          }
          for(let j=0;j<2;j++){
            const k=i*2+j,w=.018*taper;
            shine.positions.setXYZ(k,v*W*.94,(j?w:-w)+.01,front+.07);
            shine.colors.setXYZW(k,.93,.93,1,op*ease(.06,.3,taper)*.9);
          }
          const fl=ease(.1,.9,.5+.5*Math.sin(u*19-t*27));
          for(let j=0;j<4;j++){
            const s=j/3,k=i*4+j,lift=.42*fl*taper*s;
            tongues.positions.setXYZ(k,v*W*(1-.05*s),.22*taper+lift,front-.15-.55*s*s);
            tongues.colors.setXYZW(k,0,0,0,op*taper*fl*(1-s)*.8);
          }
        }
        for(const L of [sheet,lip,shine,tongues]){L.positions.needsUpdate=true;L.colors.needsUpdate=true;}
      }
      // faint trail along the lane, fading behind the crescent
      for(let c=0;c<3;c++)for(let i=0;i<40;i++){
        const u=i/39,z=lerp(start.z,hitZ,u),born=releaseAt+(z-start.z)/S.speed,a=t-born;
        const on=a>0?ease(0,.04,a)*(1-ease(.08,.55,a)):0,y=start.y+(c-1)*.55+.05*Math.sin(u*20+c),w=.05+.06*u;
        trail.set(c,i,(c-1)*.9*u,y-w,z-.3,(c-1)*.9*u,y+w,z-.3,0,0,0,on*.42*(c===1?1:.6));
      }
      trail.flush();
      flakes(t);launch(t);
      // target: recoil, absorb, X mark (preview only: in a match the game marks the real target)
      if(!target)return;
      const recoil=ease(hitT,hitT+.05,t)*(1-ease(hitT+.12,hitT+.4,t));
      target.g.position.z=target.home.z+.3*recoil;
      stDarkPose(target,{back:-.3*recoil,roll:.16*recoil,drop:.07*recoil,arms:.45*recoil,step:.25*recoil});
      tint(ease(hitT+.05,markAt-.05,t)*(1-ease(markAt,markAt+.2,t))*.96);
      showMark(t-markAt,8);
    };
  }

  else if(kind==='lift'){
    const S=DKR.lift,plantZ=S.step,center=new THREE.Vector3(0,.5,plantZ);
    const foes=live?[]:[dummy('Lift target A',1.6,plantZ+1.8,0),dummy('Lift target B',2.4,plantZ+.1,1),dummy('Lift target C',.2,plantZ+2.6,2),dummy('Lift target out',2.2,plantZ+6.2,3)];
    const inside=foes.map(f=>Math.hypot(f.home.x,f.home.z-plantZ)<=S.r);
    const g=2*S.peak/(S.peakT*S.peakT),v0=g*S.peakT,flight=2*S.peakT;
    const sweepA=S.plant,sweepB=S.lift-.03,scoopEnd=S.lift+.1,back=scoopEnd+.5;
    bladeAt=t=>{
      const z=casterZ;
      if(t<sweepA){const f=ease(0,S.crouch+.05,t);idleAt(z,0,P,Q);
        dkrSweep(V2.set(0,.6,z),-2.8,2.3,.1,1,V,Q2);P.lerp(V,f);Q.slerp(Q2,f);}
      else if(t<sweepB){const f=(t-sweepA)/(sweepB-sweepA),e=f*f*(3-2*f)*.55+f*.45;
        dkrSweep(V2.set(0,.55-.05*Math.sin(f*Math.PI),z),-2.8+6.283*e+.0,2.6,.15,1,P,Q);}
      else{const f=ease(sweepB,scoopEnd,t);
        dkrSweep(V2.set(0,.55,z),-2.8+6.283,2.6,.15,1,P,Q);
        fromTip(V.set(.2,lerp(.6,2.8,f),z+lerp(3.1,2.2,f)),[0,lerp(.1,.95,f),lerp(1,.3,f)],[0,lerp(.2,.3,f),lerp(-.98,-.95,f)],V2,Q2);
        P.lerp(V2,f);Q.slerp(Q2,f);}
      const ret=ease(scoopEnd+.08,back,t);
      if(ret>0){idleAt(z,0,V2,Q2);P.lerp(V2,ret);Q.slerp(Q2,ret);}
      finish(P,Q);sample.act=ease(sweepA,sweepA+.02,t)*(1-ease(sweepB,sweepB+.05,t));return sample;
    };
    const stepTrail=dkrRibbons(root,'Lift step shadow trail',7,30,7);
    // dash impact (user 2026-11-28): ink kick-up at the launch, speed streaks, splinters on arrival
    const kick=stDarkMatter(root,'Lift dash kick-up',[{at:S.crouch,span:.04,count:46,spread:1.6,lift:1.1,height:.2,back:.8},{at:S.plant-.01,span:.05,count:40,spread:2.2,lift:.8,height:.15}],(at,out)=>out.set(0,0,at<S.plant-.02?0:S.step));
    const streaks=dkrRibbons(root,'Lift dash speed streaks',10,2,8);
    const ground=new THREE.Group();ground.position.set(0,.06,plantZ);ground.rotation.x=-Math.PI/2;root.add(ground);
    const pressure=stDarkPressure(ground),shockL=new THREE.Group();shockL.position.z=.015;ground.add(shockL);const shock=stDarkPressure(shockL);
    const aura=new THREE.Mesh(new THREE.CircleGeometry(1,64),new THREE.MeshBasicMaterial({map:dkrDiscTex(),color:0x05040a,transparent:true,depthWrite:false,toneMapped:false}));
    aura.renderOrder=6;ground.add(aura);
    const rim=dkrRibbons(root,'Lift circle rim',1,97,8);
    const N=48,tower=dkrRibbons(root,'Lift shadow tower lines',N,14,9);
    const dust=stDarkMatter(root,'Lift rising flakes',[{at:S.lift,span:.3,count:30,spread:S.r,lift:2.2,height:.3},
      {at:S.plant,span:.05,count:40,spread:2.4,lift:.9,height:.15}],(_a,out)=>out.set(0,0,plantZ));
    const cuts=foes.map(f=>{const grp=new THREE.Group();root.add(grp);
      return {grp,outer:stDarkCut(grp,[[-.2,-.9,0],[.25,.3,0],[-.05,1.7,0]],.2,0x101019,11),white:stDarkCut(grp,[[-.2,-.9,0],[.25,.3,0],[-.05,1.7,0]],.08,0xf7f8fc,12)};});
    update=(t,o)=>{
      trigger(o,'dk_lift',0,t);
      // step trail (vertical shadow sheet left along the path)
      for(let c=0;c<7;c++)for(let i=0;i<30;i++){
        const u=i/29,z=u*plantZ,born=lerp(S.crouch,S.plant,u),a=t-born,y=.1+c*.3;
        const on=a>0?ease(0,.025,a)*(1-ease(.1,.55,a)):0,w=.34*(1-u*.3);
        const sway=.1*Math.sin(u*9+c*2+t*14);
        stepTrail.set(c,i,sway,y-w*.5,z-.25,sway,y+w*.5+.12*u,z-.25,0,0,0,on*(.85-.08*c)*ease(0,.1,u));
      }
      stepTrail.flush();
      for(let c=0;c<10;c++){const ph=dkrRnd(c+60),born=S.crouch+ph*(S.plant-S.crouch),a=t-born,len=2.5+2*dkrRnd(c+61),x=(dkrRnd(c+62)-.5)*1.6,y=.3+dkrRnd(c+63)*1.6;
        const head=Math.min(plantZ,(born-S.crouch)/(S.plant-S.crouch)*plantZ),on=a>0?ease(0,.02,a)*(1-ease(.05,.25,a)):0;
        streaks.set(c,0,x,y,head-len,x,y,head,0,0,0,0);streaks.set(c,1,x,y+.04,head-len,x,y+.04,head,.05,.05,.06,on*.8);}
      streaks.flush();kick(t);
      // floor impact: dark aura disc + two pressure rings + the circle rim
      const hit=t-S.plant;
      aura.visible=hit>0;aura.scale.setScalar(S.r*(.3+.7*ease(0,.22,hit)));aura.material.opacity=.88*ease(0,.05,hit)*(1-ease(.9,1.6,hit));   // round 2 (user): darker floor area
      pressure(.6+S.r*ease(0,.24,hit),.92*ease(-.01,.03,hit)*(1-ease(.2,.45,hit)),hit*4);
      shock(.4+S.r*1.05*ease(0,.3,hit-.05),.55*ease(.03,.08,hit)*(1-ease(.25,.5,hit)),hit*5);
      for(let i=0;i<97;i++){const a=i/96*6.283,r=S.r*ease(0,.24,hit),w=.05;
        const op=hit>0?.62*ease(.15,.25,hit)*(1-ease(1.0,1.6,hit)):0;
        rim.set(0,i,Math.cos(a)*(r-w),.08,plantZ+Math.sin(a)*(r-w),Math.cos(a)*(r+w),.08,plantZ+Math.sin(a)*(r+w),.02,.02,.03,op);}
      rim.flush();
      // shadow tower: thin lines run up the circle edge like a waterfall going up, fade bottom first
      for(let c=0;c<N;c++){
        const a=(c+.35*dkrRnd(c))/N*6.283,born=S.lift-.02+dkrRnd(c+1)*.12,age=t-born;
        if(age<=0||age>1.4){tower.hide(c);continue;}
        const H=S.tower*(.7+.45*dkrRnd(c+2)),D=.16,rise=Math.max(0,age-D);   // round 2 (user): straight up, short slow emerge, then shoot up fast
        const head=age<D?.45*ease(0,D,age):.45+(H-.45)*(1-Math.exp(-rise*11)),tail=age<D+.12?0:H*(1-Math.exp(-(age-D-.12)*6))*.98;
        const light=c%9===0,w=(light?.035:.06+.05*dkrRnd(c+3)),fade=1-ease(.8,1.4,age);
        const r=S.r*(1-.03*dkrRnd(c+4)),tx0=-Math.sin(a),tz0=Math.cos(a);
        for(let i=0;i<14;i++){
          const s=i/13,y=lerp(tail,head,s),curl=0;
          const rr=r,x=Math.cos(a)*rr+tx0*curl,z=plantZ+Math.sin(a)*rr+tz0*curl;
          const al=(light?.95:.92)*fade*ease(0,.35,s)*(1-ease(.85,1,s))*ease(0,.06,age);
          const tone=light?.55:.02;
          tower.set(c,i,x-tx0*w,y,z-tz0*w,x+tx0*w,y,z+tz0*w,tone,tone,tone*1.15,al);
        }
      }
      tower.flush();dust(t);
      // targets: lifted ~4 m, stunned 1 s, the stun ends before they land (they straighten up in the air)
      foes.forEach((f,i)=>{
        const a=t-S.lift-(i===1?.02:0),up=inside[i]&&a>0;
        const y=up&&a<flight?v0*a-.5*g*a*a:0,limp=up?ease(0,.08,a)*(1-ease(S.stun-.12,S.stun+.05,a)):0;
        const brace=up?ease(S.stun-.05,S.stun+.1,a)*(1-ease(flight+.08,flight+.35,a)):0;
        f.g.position.y=Math.max(0,y);
        stDarkPose(f,{back:-.55*limp+.12*brace,roll:.25*limp*(i%2?1:-1),drop:-.0+.1*brace,arms:.9*limp+.2*brace,step:.5*limp-.2*brace});
        f.g.rotation.x=0;
        const cut=cuts[i];cut.grp.position.set(f.home.x,1.0,f.home.z);cut.grp.lookAt(cam.position);
        if(inside[i]){cut.outer(a,.32,.45);cut.white(a,.32,.45);}else{cut.grp.visible=false;}
      });
    };
  }

  else if(kind==='marked'||kind==='flow'){
    const F=kind==='flow',S=F?{...DKR.marked,...DKR.flow}:{...DKR.marked};if(live)S.targetZ=Math.max(1.5,L.distance);
    const target=live?null:dummy('Nightfall marked target',0,S.targetZ,0);if(target)target.g.rotation.y=Math.PI+.8;   // turned a bit to the side camera so the X mark reads
    const xMark=target&&dkrXMark(target.g);
    // (no body tint on the marked target: it turned the whole dummy black and hid the X)
    const topZ=S.targetZ+S.back;
    const pts=F?[new THREE.Vector3(0,0,0),new THREE.Vector3(.2,0,S.targetZ*.5),new THREE.Vector3(0,0,S.targetZ),new THREE.Vector3(-.15,0,S.targetZ+1.7),new THREE.Vector3(0,0,topZ)]
      :[new THREE.Vector3(0,0,0),new THREE.Vector3(.25,0,S.targetZ*.5),new THREE.Vector3(0,0,S.targetZ),
      new THREE.Vector3(-.35,.25,S.targetZ+2.6),new THREE.Vector3(-.25,1.6,S.targetZ+3.4),new THREE.Vector3(0,S.top-1.1+1.1,topZ)];
    const curve=new THREE.CatmullRomCurve3(pts);const SEG=40;curve.arcLengthDivisions=(pts.length-1)*SEG;
    const lengths=curve.getLengths(),total=lengths.at(-1),atTarget=lengths[2*SEG];
    const route={
      distanceAt:t=>{if(t<S.hit){const u=clamp((t-S.launch)/(S.hit-S.launch),0,1);return atTarget*u*u*(2.2-1.2*u);}
        const u=clamp((t-S.hit)/(S.appear-S.hit),0,1);return atTarget+(total-atTarget)*u*(2-u);},
      pointAt:(d,out)=>curve.getPointAt(clamp(d/total,0,1),out)};
    const orb=stDarkOrbCore();orb.name='Nightfall orb';root.add(orb);
    const ball=stChaseBall(root,orb,route,S.launch,S.hit+.02,S.appear,.85);
    const passCut=new THREE.Group();passCut.position.set(0,1.05,S.targetZ);passCut.rotation.x=-Math.PI/2;root.add(passCut);
    const passPath=[[-2.1,.6,0],[0,-.5,0],[2.1,.6,0]];
    const passOuter=stDarkCut(passCut,passPath,.3,0x101019,11),passWhite=stDarkCut(passCut,passPath,.11,0xf7f8fc,12);
    const lane=dkrRibbons(root,'Nightfall pass line',2,44,8);
    const slamCut=new THREE.Group();slamCut.position.set(0,0,S.targetZ);root.add(slamCut);
    const blackCut=stDarkCut(slamCut,[[.35,3.16,.09],[.11,1.40,.15],[-.20,.04,.12]],.12,0x000000,13);
    const splitCut=stDarkCut(slamCut,[[.38,2.81,.12],[.19,1.19,.18],[-.11,.06,.13]],.033,0x000000,14);
    slamCut.traverse(m=>{if(m.isMesh)m.material.depthTest=false;});
    const impact=new THREE.Group();impact.position.set(0,.065,S.targetZ+.12);impact.rotation.x=-Math.PI/2;root.add(impact);
    const pressure=stDarkPressure(impact),shL=new THREE.Group();shL.position.z=.017;impact.add(shL);const shock=stDarkPressure(shL);
    const grit=stDarkMatter(root,'Nightfall slam splinters',[{at:S.slam,span:.045,count:40,spread:2.2,lift:1.3,height:.17},
      {at:S.slam+.04,span:.08,count:22,spread:2.5,lift:.35,height:.14}],(_a,out)=>out.set(0,0,S.targetZ+.12),.92);
    const newHolder=new THREE.Group();root.add(newHolder);const newScythe=stCreateScythePreview(newHolder,{wrap:'C',manual:true,scale:DKR_SCALE});newScythe.pivot.name='Rework replacement scythe';
    const fadeOld=stChaseScytheOpacity(scythe),fadeNew=stChaseScytheOpacity(newScythe);
    const land=F?S.appear:S.slam+.03;
    bladeAt=t=>{
      if(t<S.hit-.05){const carry=ease(.04,S.launch+.04,t);idleAt(0,0,P,Q);
        route.pointAt(route.distanceAt(t),V2);dkrSweep(V2.set(V2.x,1.15+V2.y,V2.z),-1.5,2.2,.1,1,V,Q2);P.lerp(V,carry);Q.slerp(Q2,carry);}
      else if(t<S.hit+.06){const f=(t-S.hit+.05)/.11;route.pointAt(route.distanceAt(t),V2);
        dkrSweep(V2.set(V2.x,1.15+V2.y,V2.z),-1.5+3.1*f*f*(3-2*f),2.2,.1-.2*f,1,P,Q);}
      else if(F){route.pointAt(route.distanceAt(t),V2);V2.y+=1.15;const f=ease(S.hit+.06,S.appear+.08,t);
        dkrSweep(V2,1.6+.5*f,2.2,-.1,1,P,Q);const ret=ease(S.appear+.1,S.appear+.5,t);if(ret>0){idleAt(topZ,0,V,Q2);P.lerp(V,ret);Q.slerp(Q2,ret);}}
      else{route.pointAt(route.distanceAt(t),V2);V2.y+=1.15;
        const up=ease(S.hit+.06,S.appear,t),raised=ease(S.appear,S.raise,t),slam=clamp((t-S.raise-.06)/(S.slam-S.raise-.06),0,1),e=slam*slam*slam;
        dkrSweep(V2,1.6,2.2,-.1,1,P,Q);
        const cz=topZ,cy=S.top+1.1;
        fromTip(V.set(.4,cy+1.5+.5*raised,cz+.9+.4*raised),[-.15,.25,-.96],[.15,.95,.25],V2,Q2);
        P.lerp(V2,up);Q.slerp(Q2,up);
        if(slam>0){fromTip(V.set(.12,lerp(cy+2.1,.09,e),lerp(cz+1.3,S.targetZ+.11,e)-.9*Math.sin(Math.PI*e)),[-.04,lerp(.25,-.98,e),lerp(-.96,-.18,e)],[.17,lerp(.95,.15,e),lerp(.25,-.97,e)],V2,Q2);   // big arc from above the head down into the target
          P.copy(V2);Q.copy(Q2);}}
      const small=ease(.1,S.launch+.05,t)*(1-ease(S.hit+.1,S.appear,t));
      finish(P,Q,1-.3*small);sample.act=Math.max(ease(S.hit-.05,S.hit-.03,t)*(1-ease(S.hit+.05,S.hit+.09,t)),(F?0:1)*ease(S.slam-.07,S.slam-.05,t)*(1-ease(land-.01,land+.03,t)));
      return sample;
    };
    let bodyTint=null;
    const masks=new Map();   // hide the real avatar with layers (syncPlayers resets .visible every frame)
    const hideAvatar=(o,hide)=>{const each=f=>[o.g,o.cloth?.mo,o.cloth?.mi].forEach(r=>r&&r.traverse(f));
      if(hide)each(m=>{if(!masks.has(m))masks.set(m,m.layers.mask);m.layers.mask=0;});else{for(const [m,k] of masks)m.layers.mask=k;masks.clear();}};
    cleanup=()=>{for(const [m,k] of masks)m.layers.mask=k;masks.clear();};
    update=(t,o)=>{
      if(o&&!bodyTint)bodyTint=o.darkTint??=stDarkBodyTint(o,true);
      trigger(o,F?'dk_flowland':'dk_slam',S.appear,t);
      ball(t);
      const orbOn=t>=S.launch&&t<S.appear;
      if(o){hideAvatar(o,orbOn);   // user 2026-11-28: dark ball the whole way, the body shows only for the overhead slash (live too)if(o.cloth&&t>S.appear-.03&&t<(F?S.appear+.05:land+.06))o.cloth.init=false;   // in the air: keep the cloak at its rest drape (sim would fly it up)   // teleport: restart the cloak so it does not fly up
        bodyTint?.(t<S.appear?ease(.02,S.launch,t):1-ease(S.appear,S.appear+.2,t),1);}   // (strength, opacity)
      scythe.pivot.scale.setScalar(1-.3*ease(.1,S.launch+.05,t)*(1-ease(S.hit+.1,S.appear,t)));
      const old=F?1:1-ease(land+.3,land+.55,t);fadeOld(old);scythe.pivot.visible=old>.003;
      const spawn=F?0:ease(land+.35,land+.6,t);newScythe.pivot.visible=newHolder.visible=spawn>.003;
      if(newScythe.pivot.visible){idleAt(topZ,0,V2,Q2);newScythe.pivot.position.copy(V2).sub(V.copy(DKR_CENTER).applyQuaternion(Q2));
        newScythe.pivot.position.y+=.4*(1-spawn);newScythe.pivot.quaternion.copy(Q2);newScythe.update(t);fadeNew(spawn);}
      const pa=t-S.hit;passOuter(pa,.55,.5);passWhite(pa,.45,.45);
      for(let c=0;c<2;c++)for(let i=0;i<44;i++){
        const u=i/43,z=lerp(1,S.targetZ+2.4,u),born=S.launch+(S.hit-S.launch)*clamp(z/S.targetZ,0,1.2),a=t-born;
        const on=a>0?ease(0,.03,a)*(1-ease(.15,.75,a)):0,y=1.05+(c?.0:.0),w=c?.03:.13;
        lane.set(c,i,-w,y,z,w,y,z,c?.85:0,c?.85:0,c?.9:0,on*(c?.55:.6)*ease(0,.1,u)*(1-ease(.9,1,u)));
      }
      lane.flush();
      slamCut.visible=impact.visible=!F;slamCut.lookAt(root.localToWorld(V.set(-12.5,4.6,7.5)));const sh=F?-9:t-land;
      blackCut(sh+.04,.24,.61);splitCut(sh+.03,.21,.58);
      pressure(.39+2.3*ease(0,.28,sh),.91*ease(-.01,.034,sh)*(1-ease(.07,.34,sh)),sh*4);
      shock(.29+3.4*ease(0,.31,sh-.054),.52*ease(.033,.083,sh)*(1-ease(.14,.36,sh)),sh*5);
      if(!F)grit(t);
      const r1=ease(S.hit,S.hit+.05,t)*(1-ease(S.hit+.1,S.hit+.35,t)),r2=ease(land,land+.05,t)*(1-ease(land+.15,land+.5,t));
      if(target)stDarkPose(target,{back:-.3*r1+.35*r2,roll:.2*r1,drop:.05*r1+.18*r2,arms:.5*r1+.6*r2,step:.3*r1});
      if(xMark)xMark.material.opacity=F?1-ease(S.hit,S.hit+.25,t):1-ease(land+.05,land+.3,t);   // the mark is used up by the slam   // fully formed X from the start (target already marked)
    };
  }

  const stub={studio:1,contacts:[],blade:()=>null,root:{visible:true}};
  const camT=new THREE.Vector3(),camP=new THREE.Vector3();let gearHidden=null;
  const liveTick=t=>{
    const o=L.o;
    if(kind==='lift'&&o)casterZ=root.worldToLocal(o.g.getWorldPosition(V)).z;
    const pose=bladeAt(t);scythe.pivot.position.copy(pose.pos);scythe.pivot.quaternion.copy(pose.QB);
    const charge=kind==='mark'?ease(DKR.mark.wind,DKR.mark.release,t)*(1-ease(DKR.mark.release,DKR.mark.release+.1,t)):0;
    scythe.update(t,.55*charge);update(t,o);
  };
  if(live)return {tick:liveTick,blade:scythe.pivot,launch:t=>markApi.launch?.(t),contact:d=>markApi.contact?.(d),dispose:()=>cleanup()};
  return {
    // marked: fixed side view over the whole route (caster start -> target -> reappear), not following the teleporting caster
    camera(c,T){if(kind!=='marked'&&kind!=='flow')return;root.updateMatrixWorld(true);
      T.copy(root.localToWorld(camT.set(0,1.6,8.5)));c.position.copy(root.localToWorld(camP.set(-12.5,4.6,7.5)));},
    dispose(){cleanup();gearHidden?.traverse(m=>{m.layers.mask=1;});disposeTree(root);root.removeFromParent();const o=PM3.get(me.id);if(o){o.g.visible=true;if(o.darkChaseFx===stub)o.darkChaseFx=null;}},
    pose(t){
      if(foe){foe.x=home.x-4000;foe.y=home.y;}
      if(kind==='lift'){const S=DKR.lift;casterZ=S.step*ease(S.crouch,S.plant,t);}
      else if(kind==='flow'){const S={...DKR.marked,...DKR.flow};casterZ=t<S.appear?0:S.targetZ+S.back;casterY=0;}
      else if(kind==='marked'){const S=DKR.marked;
        if(t<S.appear){casterZ=0;casterY=0;}
        else{casterZ=S.targetZ+S.back;const drop=clamp((t-S.raise-.06)/(S.slam-S.raise-.06),0,1);casterY=t<S.slam+.03?lerp(S.top,0,drop**2.2)+.15*ease(S.appear,S.raise,t)*(1-drop):0;}}
      else casterZ=0;
      me.x=home.x+casterZ*20;me.y=home.y;me.vx=me.vy=0;
      const gz=groundH(me.x,me.y);
      if(kind==='flow'){me.z=gz;me.vz=0;me.ang=0;}
      if(kind==='marked'){me.z=gz+casterY;me.vz=0;const back=t>=DKR.marked.appear;me.inp.ax=me.inp.gx=me.x+(back?-400:400);me.ang=back?Math.PI:0;}   // face the target after reappearing
    },
    draw(t){
      const o=PM3.get(me.id);
      root.position.set(tx(home.x),groundH(home.x,home.y),tz(home.y));root.rotation.set(0,Math.PI/2,0);root.updateMatrixWorld(true);
      if(foe){const f=PM3.get(foe.id);if(f)f.g.visible=false;}
      if(o){o.darkChaseFx=stub;if(o.darkGear){o.darkGear.visible=false;o.darkGear.traverse(m=>{m.layers.mask=0;});gearHidden=o.darkGear;}}   // layers: the view re-shows .visible later in the frame
      const pose=bladeAt(t);scythe.pivot.position.copy(pose.pos);scythe.pivot.quaternion.copy(pose.QB);
      const charge=kind==='mark'?ease(DKR.mark.wind,DKR.mark.release,t)*(1-ease(DKR.mark.release,DKR.mark.release+.1,t)):0;
      scythe.update(t,.55*charge);
      update(t,o);
    }
  };
}

// ---------- live hooks (js/68-darkness-view.js) ----------
function dkrLiveMarkWind(ev,o){   // Death Sentence charge: follow the caster until the wave leaves (Flow: quick flick)
  if(ev.main===false)return false;
  const root=darkViewRoot(ev,'Death Sentence (rework)'),L={root,o,pitch:0,quick:!!ev.flow};
  const fx=studioDarkRework('mark',null,null,null,L);
  const view={root,L,dkr:fx,live:{scythe:true,launch:false},wave:{blade:fx.blade},elapsed:0};
  if(o)o.darkMarkCast=view;
  darkViewTemp(root,2.2,t=>{
    view.elapsed=t;
    if(!view.live.launch&&o){o.g.getWorldPosition(root.position);o.g.getWorldQuaternion(root.quaternion);}
    fx.tick(t);
  },()=>{
    if(o?.darkMarkCast===view){darkSettleWeapon(o,fx.blade);o.darkMarkCast=null;}
    if(view.id)darkWaveViews.delete(view.id);fx.dispose();
  });
  return true;
}
function dkrLiveMarkLaunch(ev,o){
  if(ev.flow&&!ev.main){   // Flow side waves: the same slender horizontal crescent, crescent only
    const root=darkViewRoot(ev,'Death Sentence side wave');root.position.y-=0;root.rotation.set(0,Math.PI/2-ev.a,0);
    const L={root,o,pitch:ev.pitch||0,flightOnly:true},fx=studioDarkRework('mark',null,null,null,L);fx.launch(0);
    const view={root,L,dkr:fx,live:{launch:true},wave:{blade:null},id:ev.wave};darkWaveViews.set(ev.wave,view);
    darkViewTemp(root,1.2,t=>fx.tick(t),()=>{darkWaveViews.delete(ev.wave);fx.dispose();});
    return true;
  }
  const view=o?.darkMarkCast;
  if(!view?.dkr||view.live.launch)return false;
  darkWorldAt(ev,view.root.position);view.root.position.y-=ev.h||0;view.root.rotation.set(0,Math.PI/2-ev.a,0);
  view.L.pitch=ev.pitch||0;view.live.launch=true;view.id=ev.wave;darkWaveViews.set(ev.wave,view);
  view.dkr.launch(view.elapsed);
  return true;
}
function dkrLiveChase(kind,ev,o,distance,life){   // Nightfall lift / marked / Flow
  const root=darkViewRoot(ev,'Nightfall '+kind+' (rework)');
  const fx=studioDarkRework(kind,null,null,null,{root,o,distance});
  const seq={root,unmarked:false,blade:()=>fx.blade,contacts:[]},start=root.position.clone();
  const target=PM3.get(ev.target)||EM3.get(ev.target),targetOrigin=target?.g.position.clone();
  o.darkSwingAt=undefined;o.darkChaseFx=seq;
  darkViewTemp(root,life,t=>{
    root.visible=!o.darkDown&&o.darkChaseFx===seq;
    if(!root.visible)return;
    if(targetOrigin&&kind!=='lift'){const k=stDarkEase(0,DKR.marked.hit,t);   // follow a moving target like the host does
      root.position.x=start.x+(target.g.position.x-targetOrigin.x)*k;root.position.z=start.z+(target.g.position.z-targetOrigin.z)*k;}
    fx.tick(t);
  },()=>{
    fx.dispose();
    if(o.darkChaseFx===seq){darkShowWeaponReturn(o,fx.blade,.12);o.darkChaseFx=null;o.b.visible=true;o.darkTint?.(0,1);}
  });
  return seq;
}
