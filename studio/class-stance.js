// Class stance previews (designs/class-stances.md): drives the real studio player — class kit, idle breathing, a short run —
// so the game's own pose code (readyStance + class branches in js/35-sync.js) is what the GIF shows.
// args: cls, style, run [t0,t1], fmode (Frost start mode 0 sword / 1 wand), acts [{t, a:'fire'|'hold'|'skill'|'ult'|'swap'|'dash', id, d}]
FXCODE.studio_class_stance=(_x,_y,_h,args,instance)=>{
  const me=G&&G.players&&G.players.me,anchor=instance.L.find(l=>l.d.id===(args.layer||'anchor'));
  if(!me||!anchor?.obj)return;
  const path=PATHS.findIndex(p=>p.id===args.cls);if(path<0)return;
  if((me.pathIdx|0)!==path){setKit(me,String(path));me.kt=me.kit;try{WD.broadcastLobby();}catch(e){}}
  STANCE_STYLE[path]=args.style||'a';
  if(args.anim)STORM_ANIM_V=args.anim;
  const home=ST.home||(ST.home={x:me.x,y:me.y});resetBody(me,home.x,home.y);me.z=groundH(me.x,me.y);
  if(args.fmode!==undefined)me.fmode=args.fmode;me.fmCd=0;
  for(const k in me.cd)me.cd[k]=0;
  const inp=emptyInput(),run=args.run||[2.4,4.0],acts=(args.acts||[]).map(a=>({...a,done:false}));me.inp=inp;
  const foe=foesOf(me.team).filter(e=>e.alive!==false)[0];
  const preview=args.thunderLine?studioThunderLine(me,home,foe)
    :args.stormStudy?studioStormStudy(args.stormStudy,me,home,inp,foe,args.impact):null;
  instance.classStanceDispose=preview?.dispose;
  instance.classStanceCamera=preview?.camera;
  // driven from every studio sim step (stStep is wrapped below), on studio time ST.t, so seeks/GIF export replay it exactly
  instance.classStanceTick=()=>{
    if(me.inp!==inp)me.inp=inp;const t=ST.t,on=t>=run[0]&&t<run[1];
    inp.ax=inp.gx=me.x+400;inp.ay=inp.gy=me.y;inp.ah=0;inp.mx=on?1:0;inp.my=0;
    if(foe){foe.x=me.x+400;foe.y=me.y;}
    let fire=0,sh=0;
    for(const a of acts){
      if(a.a==='hold'&&t>=a.t&&t<a.t+(a.d||1))fire=1;
      if(a.a==='fire'&&t>=a.t&&t<a.t+.12)fire=1;
      if(a.a==='shield'&&t>=a.t&&t<a.t+(a.d||1))sh=1;
      if(a.done||t<a.t)continue;a.done=true;
      if(a.a==='skill'){for(const k in me.cd)me.cd[k]=0;me.kitIds[0]=a.id;inp.hq=1;try{castSlot(me,0);}catch(e){}inp.hq=0;}
      else if(a.a==='ult'){me.ultId=a.id;me.ult=100;try{castUlt(me);}catch(e){}}
      else if(a.a==='link'){   // Light: a teammate stands next to us, linked (Radiance ult needs a duo)
        CLOTH_LITE.ON=false;   // preview duo is added mid-run: its low-res cloth started from NaN here (studio only), use the bone cloak
        let al=G.players.stAlly;if(!al){addPlayer('stAlly','Duo','#ffffff',null,String(PATHS.findIndex(q=>q.id==='water')));al=G.players.stAlly;}
        al.team=me.team;resetBody(al,me.x+(a.dx||0),me.y+(a.dy||-70));al.alive=true;al.downed=false;al.hp=al.maxHp;al.bot=false;al.inp=emptyInput();me.lgA=al.id;al.lgFrom=me.id;al.lgN=1;}
      else if(a.a==='hit'){const al=G.players.stAlly;if(al)try{damage(al,a.dmg||40,foe?foe.id:'x','aoe');}catch(e){}}
      else if(a.a==='swap'){me.fmode=me.fmode===1?0:1;me.fmCd=me.fswT=FROST_SWAP_T;me.cmbT=0;emit({k:'efx',z:'fswap',x:me.x,y:me.y,h:me.z+1,id:me.id,m:me.fmode});}   // same as the host's V key
      else if(a.a==='dash'){me.cd.dodge=0;inp.c.sp++;}
      else if(a.a==='set'){me[a.k]=a.v;}   // e.g. Storm stacks {a:'set',k:'lst',v:4}
      else if(a.a==='fire'||a.a==='hold')me.cd.basic=0;
    }
    inp.fire=fire;inp.sh=sh;
    for(const a of acts)if(a.a==='move'&&t>=a.t&&t<a.t+(a.d||1)){inp.mx=a.mx||0;inp.my=a.my||0;}   // walk any direction (WASD), aim stays at the target
    // during a seek / GIF export the studio does not run the game or pose the players: step the host and pose here
    preview?.pose(t);
    if(FXSTUDIO.seek){try{hostTick(STD);const base=makeSnap(),evl=EVL;EVL=[];onSnap(Object.assign({},base,{ev:evl}));const v=VIEW.cur;if(v)syncPlayers(v.P,v.mode,stVnow,STD);}catch(e){console.warn('stance tick',e);}}
    preview?.draw(t);
  };
};

// Three studio-only casts. Time is shared by the pose, the muzzle and the recoil.
function studioThunderLine(me,home,foe){
  const beat=1.5,start=.30,release=.22,length=6.4,travel=.067;
  const versions=[
    {key:'thunder_preview_a',pull:[-.62,.48,0,.12,-.60,-.48,0,-.055],push:[-1.52,.21,0,.22,-1.52,-.21,0,-.065],feet:[-.18,.18,.16,-.16],recoil:.22},
    {key:'thunder_preview_b',pull:[-.12,.71,0,.32,-.16,-.71,0,-.19],push:[-1.24,.16,0,.33,-1.24,-.16,0,-.13],feet:[-.33,.31,.19,-.19],recoil:.32},
    {key:'thunder_preview_c',pull:[-.93,.44,-.36,.10,-.35,-.72,.10,-.04],push:[-1.58,.23,.15,.19,-1.52,-.24,-.04,-.055],feet:[-.29,.33,.13,-.13],recoil:.27},
  ];
  for(const {key,pull,push,feet} of versions){
    CANIM[key]={d:.70,st:0,nc:1,k:[[.19,...pull,'s'],[.31,...push,'i'],[.61,...push,'s'],[1,...pull,'s']]};
    SKFEET[key]=feet;
  }
  const visuals=new THREE.Group(),{TubeSet,GLOWT}=natFx();
  scene.add(visuals);
  const beamMat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0,depthWrite:false,toneMapped:false});
  const gold=new THREE.Color('#ffe91a').multiplyScalar(1.45),blue=new THREE.Color('#39dcff').multiplyScalar(1.25);
  const beam=TubeSet(4,19,5,beamMat,visuals),parts=Array.from({length:4},(_,i)=>beam.part(i));
  beam.receiveShadow=false;
  const hitMat=beamMat.clone();
  const hitCount=8;
  const impact=TubeSet(hitCount*2,7,5,hitMat,visuals);
  const hitParts=Array.from({length:hitCount},(_,i)=>({main:impact.part(i),fork:impact.part(i+hitCount)}));
  const hitPath=Array.from({length:7},()=>new THREE.Vector3()),hitFork=Array.from({length:5},()=>new THREE.Vector3());
  impact.receiveShadow=false;
  const orb=new THREE.Mesh(new THREE.SphereGeometry(1,18,12),new THREE.MeshBasicMaterial({color:new THREE.Color('#fff65b').multiplyScalar(5),toneMapped:false}));
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOWT,color:new THREE.Color('#fff023').multiplyScalar(2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  const hitGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOWT,color:'#ffe22d',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  const flashRing=new THREE.Mesh(new THREE.RingGeometry(.91,1,42),new THREE.MeshBasicMaterial({color:'#ffe021',transparent:true,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  flashRing.rotation.y=Math.PI/2;
  visuals.add(orb,halo,flashRing,hitGlow);
  visuals.visible=false;
  const dispose=()=>{
    visuals.removeFromParent();
    beam.geometry.dispose();beamMat.dispose();impact.geometry.dispose();hitMat.dispose();
    orb.geometry.dispose();orb.material.dispose();halo.material.dispose();
    flashRing.geometry.dispose();flashRing.material.dispose();hitGlow.material.dispose();
  };
  const right=new THREE.Vector3(),left=new THREE.Vector3(),muzzle=new THREE.Vector3();
  const points=Array.from({length:19},()=>new THREE.Vector3());
  const twigs=Array.from({length:3},()=>Array.from({length:5},()=>new THREE.Vector3()));
  let fired=-1;
  function moment(t){
    const variant=Math.min(versions.length-1,Math.floor(t/beat));
    return {variant,age:t-variant*beat-start};
  }
  return {
    dispose,
    pose(t){
      const {variant,age}=moment(t),style=versions[variant],o=PM3.get(me.id);
      if(!o)return;
      if(age>=0&&fired!==variant){o.caN=style.key;o.caT=0;o.cpT=0;fired=variant;}
      const a=Math.max(0,age-release);
      const retreat=style.recoil*1.22*(1-Math.exp(-a*35));
      const reset=1-_cs(clamp((age-.88)/.28,0,1));
      me.x=home.x-retreat*reset*20;
      if(foe){foe.x=home.x+130;foe.y=home.y;}
    },
    draw(t){
      const {age}=moment(t),o=PM3.get(me.id),r=o&&stBone(o,'hand_R'),l=o&&stBone(o,'hand_L');
      visuals.visible=!!(r&&l&&age>.035&&age<.89);
      if(!visuals.visible)return;
      muzzle.copy(r.getWorldPosition(right)).lerp(l.getWorldPosition(left),.5);
      muzzle.x+=.13;
      const a=age-release;
      const charge=clamp(age/release,0,1),fade=1-_cs(clamp((a-.08)/.19,0,1));
      const punch=a>=0?Math.exp(-a*26):0;
      const orbSize=(lerp(.04,.135,charge)+.12*punch)*fade;
      orb.position.copy(muzzle);orb.scale.setScalar(orbSize);
      halo.position.copy(muzzle);halo.scale.setScalar(orbSize*5.5);halo.material.opacity=(.40+.19*punch)*fade;
      flashRing.visible=a>=0&&a<.14;
      if(flashRing.visible){
        flashRing.position.copy(muzzle);flashRing.position.x+=a*1.8;
        flashRing.scale.setScalar(.10+.54*_cs(clamp(a/.12,0,1)));
        flashRing.material.opacity=.86*(1-_cs(clamp(a/.14,0,1)));
      }
      beam.visible=a>=0&&fade>0;
      const hit=a-.067;
      impact.visible=!!foe&&hit>=0&&hit<.595;
      hitGlow.visible=impact.visible&&hit<.15;
      if(impact.visible){
        const center=PM3.get(foe.id)?.g.position;
        const x=center?.x??tx(foe.x),z=center?.z??tz(foe.y),y=(center?.y??GY(foe.x,foe.y))+1.14;
        hitGlow.position.set(x,y,z);hitGlow.scale.setScalar(1.05+hit*3);
        hitGlow.material.opacity=.49*Math.max(0,1-hit/.15);
        hitMat.opacity=1;
        for(let i=0;i<hitParts.length;i++){
          const part=hitParts[i],age=hit-(i%3)*.024;
          if(age<=0){part.main.show(false);part.fork.show(false);continue;}
          const az=i*2.399+.38,tier=i%3-1;
          const growth=1-(1-clamp(age/.13,0,1))**1.7;
          const fade=1-_cs(clamp((age-.17)/.37,0,1)),phase=Math.floor(age*26);
          const colour=(i%3===1?blue:gold).clone().multiplyScalar(1.23*fade);
          for(let j=0;j<hitPath.length;j++){
            const u=j/(hitPath.length-1)*growth,d=.29+(1.20+.52*(i%4)/3)*u;
            const turn=az+.28*Math.sin(j*9.4+i+phase*.67)*u;
            hitPath[j].set(x+Math.cos(turn)*d,y+tier*.39+tier*.43*u+.14*Math.sin(j*7.1+phase)*u,z+Math.sin(turn)*d);
          }
          part.main.set(hitPath,u=>.069*(1-.84*u)*fade,(_,c)=>c.copy(colour));
          const forkRoot=hitPath[3],turn=az+(i%2?1:-1)*.73;
          for(let j=0;j<hitFork.length;j++){
            const u=j/(hitFork.length-1),d=.6*u*growth;
            hitFork[j].set(forkRoot.x+Math.cos(turn)*d,forkRoot.y+(.23*u+.07*Math.sin(j*8+phase))*growth,forkRoot.z+Math.sin(turn)*d);
          }
          part.fork.set(hitFork,u=>.034*(1-u)*fade,(_,c)=>c.copy(colour));
        }
        impact.flush();
      }
      if(a<0)return;
      const reach=length*clamp((a+.013)/travel,0,1),pulse=Math.floor(a*42);
      for(let i=0;i<points.length;i++){
        const u=i/(points.length-1),j=Math.sin(u*Math.PI)*.16;
        points[i].set(muzzle.x+reach*u,muzzle.y+j*Math.sin(i*5.72+pulse*.66),muzzle.z+j*Math.sin(i*7.25-pulse*.91));
      }
      beamMat.opacity=fade;
      parts[0].set(points,u=>.080*(1-.66*u),(_,c)=>c.copy(gold));
      for(let i=0;i<twigs.length;i++){
        const twig=twigs[i],root=points[5+i*4],sign=i%2?1:-1;
        for(let j=0;j<twig.length;j++){
          const u=j/(twig.length-1);
          twig[j].copy(root);
          twig[j].x+=u*(.27+i*.12);
          twig[j].y+=sign*u*(.18+.09*Math.sin(j*2.8+pulse));
          twig[j].z+=u*(.17*Math.sin(j*3.7+i)+.12*sign);
        }
        parts[i+1].set(twig,u=>.023*(1-u),(_,c)=>c.copy(i===1?blue:gold));
      }
      beam.flush();
    }
  };
}

// Storm rework studies run only in Studio. Hits and timers here drive the visuals.
function studioStormStudy(kind,me,home,inp,foe,impactKind='floor'){
  const gold=new THREE.Color('#ffdf24').multiplyScalar(1.5),cyan=new THREE.Color('#44deff').multiplyScalar(1.35);
  const root=new THREE.Group(),{TubeSet,GLOWT}=natFx();
  root.name='Storm study '+kind;
  scene.add(root);
  const electric=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,toneMapped:false});
  const polishStudy=kind==='mark'&&impactKind==='polish';
  const markRadius=300/20,fixedReveal=kind==='mark'&&(impactKind==='reveal'||polishStudy);
  const revealPaths=fixedReveal?studioMarkRevealPaths(markRadius):null;
  const domeStudy=kind==='dome',fullDome=domeStudy&&impactKind!=='floor';
  const boltCount=revealPaths?.reduce((n,branch)=>Math.max(n,branch.slot+1),32)??(fullDome?42:32);
  const tube=TubeSet(boltCount,19,5,electric,root);tube.receiveShadow=false;
  const bolts=Array.from({length:boltCount},(_,i)=>({mesh:tube.part(i),pts:Array.from({length:19},()=>new THREE.Vector3())}));
  const field=new THREE.Group(),shell=new THREE.Mesh(
    new THREE.SphereGeometry(1,48,24,0,Math.PI*2,0,fullDome?Math.PI:Math.PI/2),
    new THREE.MeshBasicMaterial({color:'#ffe12a',transparent:true,side:THREE.DoubleSide,depthWrite:false})
  );
  const rim=new THREE.Mesh(new THREE.RingGeometry(polishStudy?.987:fixedReveal?.991:.929,1,64),new THREE.MeshBasicMaterial({
    color:polishStudy?'#eab918':'#ffd535',transparent:true,side:THREE.DoubleSide,depthWrite:false
  }));
  rim.rotation.x=-Math.PI/2;rim.position.y=.025;
  rim.visible=!domeStudy;
  field.add(shell,rim);root.add(field);
  const shot=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),new THREE.MeshBasicMaterial({color:gold,toneMapped:false}));
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOWT,color:'#ffdd17',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  root.add(shot,glow);
  const groundAura=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({
    map:GLOWT,color:'#ffc72a',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false
  }));
  groundAura.rotation.x=-Math.PI/2;groundAura.visible=false;root.add(groundAura);
  const markTex=kind==='mark'?studioStormMarkTexture():null;
  const mark=markTex?new THREE.Sprite(new THREE.SpriteMaterial({map:markTex,transparent:true,depthTest:false,depthWrite:false,toneMapped:false})):null;
  if(mark){mark.name='Lightning mark';mark.scale.set(.86,.86,1);mark.renderOrder=9;root.add(mark);}
  const center=new THREE.Vector3(),from=new THREE.Vector3(),to=new THREE.Vector3(),hand=new THREE.Vector3();
  const source=new THREE.Vector3(),target=new THREE.Vector3(),muzzlePoint=new THREE.Vector3();
  const ground=(p,v)=>v.set(tx(p.x),GY(p.x,p.y)+groundH(p.x,p.y,p.z),tz(p.y));
  const aimSpot={x:home.x+(impactKind==='sky'?130:113),y:home.y,z:0};
  const impactHeight=impactKind==='wall'?3.7:impactKind==='sky'?9.6:0;
  const pulseRadius=200/20,domeRadius=120/20;
  const shapeMode=fixedReveal?SQ.get('markShape'):null;
  const fixedShape=shapeMode==='1'||shapeMode==='all';
  const branchStudy=kind==='mark'&&(impactKind==='branches'||impactKind==='reveal');
  const branchBeat=1.9,branchRelease=.50;
  if(fullDome&&impactKind==='wall'){
    const block=new THREE.Mesh(new THREE.BoxGeometry(.55,10.5,16),new THREE.MeshStandardMaterial({color:'#706d72',roughness:.93}));
    ground(aimSpot,block.position);block.position.x+=.275;block.position.y+=5.25;root.add(block);
  }
  const allyMarkAt=.73,selfCastAt=4.90,selfMarkAt=5.18,pulseAt=.72,cameraTarget=new THREE.Vector3();
  let ally,cast=-1,dashAt=-1,lastDash=false;
  const oldCloth=CLOTH_LITE.ON;
  if(kind==='mark'){
    CLOTH_LITE.ON=false;
    ally=G.players.stormStudyAlly;
    if(!ally){
      addPlayer('stormStudyAlly','Ally','#6fdbff',me.lk,String(PATHS.findIndex(p=>p.id==='earth')));
      ally=G.players.stormStudyAlly;
    }
    ally.team=me.team;
    resetBody(ally,home.x+65,home.y-22);
    ally.inp=emptyInput();ally.bot=false;ally.kt=ally.kit;
    WD.broadcastLobby();
  }
  // The study roster and effects live through the Studio timeline, independent of the invisible anchor material.
  const dispose=()=>{
    root.removeFromParent();
    root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
    if(markTex)markTex.dispose();
    if(ally){
      if(G?.players[ally.id]===ally){
        delete G.players[ally.id];G.order=G.order.filter(id=>id!==ally.id);
      }
      CLOTH_LITE.ON=oldCloth;
    }
  };
  const hold=[-1.37,.24,.06,.16,-.63,-.31,0,-.06];
  CANIM.storm_study_send={d:.49,nc:1,st:0,k:[
    [.27,-.56,-.33,-.22,.12,-.46,.17,0,-.055,'s'],
    [.48,...hold,'i'],[.69,...hold,'s'],[1,-.7,-.12,0,0,-.28,.35,0,0,'s']
  ]};
  CANIM.storm_study_link={d:.52,nc:1,st:0,k:[
    [.28,-.59,-.38,-.30,.08,-.28,.34,0,-.025,'s'],
    [.49,-1.45,.22,.12,.15,-.55,.44,0,-.035,'i'],
    [.69,-1.50,.17,.14,.15,-.50,.42,0,-.035,'s'],
    [1,-.63,-.25,0,0,-.3,.38,0,0,'s']
  ],j:[[.35,.19,.20,.82,-.12,.17,.18,-.18],[1,.15,.18,.55,-.1,.08,.15,-.15]]};
  CANIM.storm_study_self={d:.57,nc:1,st:0,tm:[.49,.70],k:[
    [.23,-.76,-.65,0,.02,-.76,.65,0,-.025,'s'],
    [.37,-.79,-.67,0,.04,-.79,.67,0,-.04,'s'],
    [.49,-1.27,.60,.02,.25,-1.27,-.60,.02,-.09,'i'],
    [.58,-1.17,.52,-.025,.10,-1.17,-.52,-.025,-.045,'o'],
    [.71,-1.22,.47,0,.12,-1.22,-.47,0,-.045,'s'],
    [1,-.45,-.44,0,0,-.43,.44,0,0,'s']
  ],j:[[.3,.25,.24,1.02,-.20,.08,.14,-.14],[.49,.46,.37,1.43,-.25,.08,.15,-.15],[.68,.21,.22,1.20,-.21,.11,.14,-.14],[1,.14,.14,.60,-.12,.12,.15,-.15]]};
  const fold=[-1.63,1.02,0,.37,-1.63,-1.02,0,-.16],open=[-1.13,-1.27,0,-.34,-1.13,1.27,0,.055];
  CANIM.storm_study_pulse={d:.67,nc:1,st:0,k:[
    [.27,...fold,'s'],[.32,...fold,'s'],[.41,...open,'i'],[.62,...open,'s'],
    [1,-.62,-.28,0,0,-.62,.28,0,0,'s']
  ],j:[
    [.28,1.25,1.25,1.56,-1.18,-1.18,.12,-.12],[.36,.9,.9,1.16,-.77,-.77,.27,-.27],
    [.47,.10,.10,.14,.08,.05,.58,-.58],[.63,.12,.12,.20,.05,.05,.48,-.48],[1,.14,.14,.42,0,0,.10,-.10]
  ]};
  function animate(id){
    const o=PM3.get(me.id);
    if(o){o.caN=id;o.caT=0;o.cpT=0;}
  }
  function muzzle(out){
    const o=PM3.get(me.id);
    if(!o)return out.copy(source).add(new THREE.Vector3(.3,1.25,0));
    const r=stBone(o,'hand_R');
    if(r)return r.getWorldPosition(out).add(hand.set(.15,.025,0));
    return out.copy(o.g.position).add(hand.set(.3,1.25,0));
  }
  function arc(i,time,width,colour,sample,intensity=null){
    const b=bolts[i];
    for(let j=0;j<b.pts.length;j++)sample(b.pts[j],j/(b.pts.length-1),j+Math.floor(time*36)*.57);
    b.mesh.set(b.pts,u=>width*(.36+.64*Math.sin(Math.PI*u)),(u,c)=>{
      c.copy(colour);
      if(intensity)c.multiplyScalar(intensity(u));
    });
  }
  function line(i,a,b,time,width,colour,noise){
    arc(i,time,width,colour,(v,u,k)=>{
      const taper=Math.sin(Math.PI*u)*noise;
      v.lerpVectors(a,b,u);
      v.y+=Math.sin(k*9.3+i)*taper;v.z+=Math.sin(k*5.2+i*2.1)*taper;
    });
  }
  function radial(i,pos,r,time,az,height,width,colour){
    arc(i,time,width,colour,(v,u,k)=>{
      const drift=.095*Math.sin(k*5.8+i)*Math.sin(Math.PI*u);
      const reach=r*(.028+.972*u),a=az+drift;
      v.set(pos.x+Math.cos(a)*reach,pos.y+height*(.12+.88*Math.sin(Math.PI*u*.89))+.14*Math.sin(k*9.1+i)*Math.sin(Math.PI*u),pos.z+Math.sin(a)*reach);
    });
  }
  function dome(pos,r,time,body,edges,inside){
    const scale=Math.max(.05,r);
    field.visible=body>0;
    const height=domeStudy?1:.49;
    field.position.copy(pos);field.scale.set(scale,scale*height,scale);
    shell.material.opacity=body;
    rim.material.opacity=edges*.74;
    if(edges<=0)return;
    electric.opacity=edges;
    for(let i=0;i<10;i++){
      const phase=(i*2.39996+time*.49),band=i%3;
      const width=Math.min(.144,scale*(band===0?.021:.014)),colour=i%3===1?cyan:gold;
      const shellPoint=(v,u,k,side)=>{
        const az=phase+.55*u+.08*Math.sin(k*5.41+i);
        const e=band===0?.07+.34*Math.sin(Math.PI*u):.10+(band===1?1.13:1.40)*u;
        const s=scale*(1+.021*Math.sin(k*13.4+i));
        v.set(pos.x+s*Math.cos(e)*Math.cos(az),pos.y+.035+s*Math.sin(e)*height*side,pos.z+s*Math.cos(e)*Math.sin(az));
      };
      arc(i,time,width,colour,(v,u,k)=>shellPoint(v,u,k,1));
      if(fullDome)arc(32+i,time+.038,width,colour,(v,u,k)=>shellPoint(v,u,k,-1));
    }
    for(let i=0;i<inside;i++){
      const phase=(time*2.8+i*.531)%1,az=i*2.399+Math.floor(time*7+i*.37)*.27;
      const envelope=Math.sin(Math.PI*phase);
      const colour=i%3===1||i%4===0?cyan:gold;
      if(kind!=='dome'){
        radial(10+i,pos,r*(.53+.47*envelope),time,az,.26+(i%4)*.42,.025+.041*envelope,colour);
        continue;
      }
      // Sweep the full shell: the orb feeds floor, shoulder and high dome arcs.
      const pitch=impactKind==='floor'?.10+(i%4)*.32+.13*Math.sin(time*4+i)
        :(.11+(i%4)*.37)*(i%2?1:-1)+.16*Math.sin(time*4+i);
      arc(10+i,time,.049+.086*envelope,colour,(v,u,k)=>{
        const a=az+(.36*u+.105*Math.sin(k*8.84+i))*Math.sin(Math.PI*u);
        const distance=r*Math.cos(pitch)*u;
        const y=lerp(.21,r*Math.sin(pitch),u)+(.18*Math.sin(k*7.48)+.38)*Math.sin(Math.PI*u);
        v.set(pos.x+Math.cos(a)*distance,pos.y+y,pos.z+Math.sin(a)*distance);
      });
    }
  }
  function groundWave(pos,age,r,span,power){
    const front=_cs(clamp(age/.28,0,1));
    const fade=power*(1-_cs(clamp((age-.19)/.27,0,1)));
    if(fade<=0)return;
    const sector=span/8;
    for(let i=0;i<8;i++){
      const az=(i+.5)*sector-span/2,colour=(i%2?cyan:gold).clone().multiplyScalar(fade);
      arc(22+i,age,.084*fade,colour,(v,u,k)=>{
        const a=az+(u-.5)*sector*.82+.04*Math.sin(k*5.3);
        const spread=r*(.13+.87*front);
        const d=spread*(.76+.24*u)+r*.035*Math.sin(k*9.17+i)*Math.sin(Math.PI*u);
        v.set(pos.x+Math.cos(a)*d,pos.y+.045+.12*Math.sin(Math.PI*u)*fade,pos.z+Math.sin(a)*d);
      });
    }
  }
  function projectile(a,b,u,r,time){
    shot.visible=glow.visible=true;
    shot.position.lerpVectors(a,b,u);
    shot.scale.setScalar(r);
    glow.position.copy(shot.position);
    glow.scale.setScalar(r*6);glow.material.opacity=.57;
    from.lerpVectors(a,b,Math.max(0,u-.29));
    line(30,from,shot.position,time,r*.26,gold,r*.62);
  }
  function discharge(pos,age,r){
    const life=1-_cs(clamp((age-.085)/.63,0,1));
    const skin=(1-_cs(clamp((age-.07)/.44,0,1)))*.145;
    dome(pos,r*(.11+.89*_cs(clamp(age/.135,0,1))),age,skin,life,7);
  }
  function movingMarkBranches(pos,burst,style){
    // A keeps most paths low. B alternates low and rising bolts. C splits them sideways while travelling.
    const count=[9,8,7][style],speed=[.71,.64,.76][style],packet=[2.5,2.85,2.65][style];
    const electricBlue=new THREE.Color('#05bfff').multiplyScalar(1.46);
    const flash=1-_cs(clamp(burst/.17,0,1));
    if(flash>0){
      groundAura.visible=true;
      groundAura.position.copy(pos);groundAura.position.y+=.04;
      groundAura.scale.setScalar(1.3+3*(1-flash));
      groundAura.material.opacity=.42*flash;
    }
    for(let i=0;i<count;i++){
      const lag=(i%4)*(.064+style*.006)+.022*Math.sin(i*4.2)**2;
      const age=burst-lag;
      const duration=speed*(.78+.22*Math.sin(i*3.67)**2);
      if(age<=0||age>duration+.19)continue;
      const front=clamp(age/duration,0,1),end=markRadius*(.58+.42*Math.cos(i*8.51)**2);
      const far=end*front,back=Math.max(0,far-packet*(.76+.34*Math.cos(i*3.7)));
      const tail=_cs(clamp(age/.09,0,1))*(1-_cs(clamp((age-duration)/.19,0,1)));
      const theta=i*2.399+style*.62;
      const upper=style===1?i%2===1:i%4===2;
      const bend=(i%2?1:-1)*[.13,.28,.35][style],phase=Math.floor(age*29);
      const color=(i%3===1||style===1&&upper?electricBlue:gold).clone().multiplyScalar(1.32*tail);
      const sample=(v,u,k)=>{
        const z=lerp(back,far,u),p=z/markRadius;
        const noise=(.19+.12*style)*Math.sin(k*8.67+i*6.1+phase*.29)*Math.sin(Math.PI*u);
        const turn=theta+bend*p*p+.12*Math.sin(p*10+i);
        const rise=upper?(style===1?1.9:1.12)*Math.sin(p*Math.PI*.92):.07;
        v.set(pos.x+Math.cos(turn)*z-Math.sin(turn)*noise,
          pos.y+.085+rise+.18*Math.sin(u*7.4+phase*.86)*Math.sin(Math.PI*u),
          pos.z+Math.sin(turn)*z+Math.cos(turn)*noise);
      };
      arc(i,burst,(upper?.215:.176)*tail,color,sample);
      if(front>[.26,.18,.34][style]&&i%[3,2,1][style]===0){
        const root=bolts[i].pts[8];
        for(let fork=0;fork<(style===2?2:1);fork++){
          const turn=theta+bend*front+(fork?-1:1)*(style===2?.78:.56);
          const length=(style===2?1.48:.91)*Math.min(1,(far-back)/packet);
          arc(10+i+10*fork,burst,.106*tail,i%2||fork?color:electricBlue.clone().multiplyScalar(tail),(v,u,k)=>{
            const angle=turn+.22*Math.sin(k*7.6)*Math.sin(Math.PI*u);
            v.set(root.x+Math.cos(angle)*length*u,root.y+(upper?.46:.16)*u+.13*Math.sin(k*7)*Math.sin(Math.PI*u),
              root.z+Math.sin(angle)*length*u);
          });
        }
      }
    }
  }
  function revealMarkBranches(pos,burst){
    if(!fixedShape){
      const opacity=_cs(clamp((burst+.09)/.09,0,1))*(1-_cs(clamp((burst-.34)/.24,0,1)));
      if(opacity>0){
        field.visible=rim.visible=groundAura.visible=true;
        shell.visible=false;
        field.position.copy(pos);field.scale.setScalar(markRadius);
        rim.material.opacity=.92*opacity;
        groundAura.position.copy(pos);groundAura.position.y+=.035;
        groundAura.scale.setScalar(markRadius*(.80+.20*_cs(clamp(burst/.19,0,1))));
        groundAura.material.opacity=.48*opacity;
      }
      if(polishStudy&&burst>=0&&burst<.17){
        const flash=1-_cs(clamp(burst/.17,0,1));
        glow.visible=true;
        glow.position.copy(pos);glow.position.y+=.18;
        glow.scale.setScalar(1.4+3.0*(1-flash));
        glow.material.opacity=.60*flash;
      }
    }
    for(const branch of revealPaths){
      if(shapeMode==='1'&&branch.trunk!==0)continue;
      const head=(burst-branch.at)/branch.travel;
      const tip=_cs(clamp((head-.76)/.24,0,1));
      const visibleLength=lerp(.70,.20,tip);
      const from=fixedShape?0:Math.max(0,head-visibleLength),to=fixedShape?1:Math.min(1,head);
      if(to<=from)continue;
      const brighten=fixedShape?.88:_cs(clamp(head/.14,0,1))*(1-_cs(clamp((head-1)/visibleLength,0,1)));
      const colour=(branch.cyan?cyan:gold).clone().multiplyScalar((fixedShape?1.13:1.49)*brighten);
      arc(branch.slot,burst,branch.width*brighten,colour,(v,u)=>{
        const d=branch.length*lerp(from,to,u);
        let i=1;
        while(i<branch.distances.length-1&&branch.distances[i]<d)i++;
        const a=branch.distances[i-1],b=branch.distances[i];
        v.lerpVectors(branch.points[i-1],branch.points[i],(d-a)/(b-a)).add(pos);
        if(fixedShape)v.y=pos.y+.14;
      },fixedShape?null:u=>.56+.73*_cs(clamp(u/.82,0,1)));
    }
  }
  function anticipateMark(pos,age,t){
    const beat1=.15*Math.exp(-((age-1.0)**2)/.012);
    const beat2=.24*Math.exp(-((age-2.0)**2)/.016);
    const warning=_cs(clamp((age-2.56)/.44,0,1));
    const pulse=beat1+beat2+warning*.17*(1+Math.sin(age*29));
    mark.scale.set(.86+pulse*.49,.86+pulse*.49,1);
    mark.material.opacity=.81+.18*Math.min(1,pulse*4);
    const gather=_cs(clamp((age-2.71)/.29,0,1));
    const footCharge=clamp(beat1+beat2+warning*.88,0,1);
    for(let i=0;i<6;i++){
      const phase=(t*(5+warning*4)+i*.43)%1;
      if(phase>.24+footCharge*.67)continue;
      const az=i*2.399+.22*Math.sin(t*2.2+i);
      const reach=(.48+footCharge*1.08)*(.74+.26*Math.sin(i*5.7)**2)*(1-.44*gather);
      const colour=(i%3===1?cyan:gold).clone().multiplyScalar(.92+footCharge*.34);
      arc(11+i,t,.030+.037*footCharge,colour,(v,u,k)=>{
        const distance=.23+reach*(1-u);
        const a=az+.21*u+Math.sin(k*7.8+i)*.25*Math.sin(Math.PI*u);
        const height=.055+(i%2?.23:.13)*Math.sin(Math.PI*u)+.073*Math.sin(k*5.4)*Math.sin(Math.PI*u);
        v.set(pos.x+Math.cos(a)*distance,pos.y+height,pos.z+Math.sin(a)*distance);
      },u=>.49+.69*u);
    }
    if(warning<=0)return;
    // Give the wearer one last cue, pulling the charge from chest height to the floor.
    for(let i=0;i<3;i++){
      const az=i*2.399+t*3.5;
      arc(8+i,t,.020+.018*warning,i===1?cyan:gold,(v,u,k)=>{
        const d=.27+.44*u*(1-.43*gather);
        const a=az+1.34*u+.085*Math.sin(k*7.32)*Math.sin(Math.PI*u);
        v.set(pos.x+d*Math.cos(a),pos.y+lerp(1.40,.10,u)*lerp(1,.57,gather),pos.z+d*Math.sin(a));
      });
    }
    groundAura.visible=true;groundAura.position.copy(pos);groundAura.position.y+=.036;
    groundAura.scale.setScalar(1.6+1.1*gather);
    groundAura.material.opacity=.48*warning;
  }
  return {
    dispose,
    camera(camera,look,t){
      if(kind!=='pulse'&&kind!=='mark')return;
      if(branchStudy){
        if(fixedShape||shapeMode==='top'){
          ground(ally,cameraTarget);
          look.copy(cameraTarget);
          if(shapeMode==='1')look.add(hand.set(7.15,0,2));
          camera.position.copy(look).add(hand.set(0,shapeMode==='1'?15.9:32,.02));
          return;
        }
        const phase=fixedReveal?t:t%branchBeat;
        const p=_cs(clamp((phase-branchRelease+.12)/.49,0,1));
        ground(ally,cameraTarget);
        const wide=cameraTarget.clone().add(hand.set(3.30,12.95,12.35));
        camera.position.lerp(wide,p);
        look.lerp(cameraTarget,p);
        return;
      }
      const isAlly=kind==='mark'&&t<selfCastAt;
      const markAt=isAlly?allyMarkAt:selfMarkAt;
      const blast=kind==='pulse'?pulseAt:markAt+3;
      const early=kind==='pulse'?.015:polishStudy?.06:.25;
      const k=_cs(clamp((t-blast+early)/(kind==='pulse'?.24:.33),0,1));
      if(k<=0)return;
      ground(isAlly?ally:me,cameraTarget);
      const r=kind==='pulse'?pulseRadius:markRadius;
      const wide=cameraTarget.clone().add(kind==='mark'
        ?hand.set(r*.20,r*(polishStudy?1.12:.89),r*(polishStudy?.91:.85))
        :hand.set(r*.25,r*1.65,r*1.45));
      camera.position.lerp(wide,k);
      look.lerp(cameraTarget,k);
    },
    pose(t){
      const o=PM3.get(me.id);
      if(!o)return;
      if(kind==='dash'){
        if(t>=.42&&cast<0){cast=0;inp.c.sp++;}
        if(me.dash>0&&!lastDash)dashAt=t;
        lastDash=me.dash>0;
        return;
      }
      const shotTime=kind==='mark'&&t>=selfCastAt?selfCastAt:.47;
      if(!branchStudy&&t>=shotTime&&cast!==shotTime){
        cast=shotTime;
        animate(kind==='pulse'?'storm_study_pulse':kind==='mark'
          ?t<selfCastAt?'storm_study_link':'storm_study_self':'storm_study_send');
      }
      if(kind==='pulse'){
        const a=t-.47;
        if(a>0&&a<.39){me.z=groundH(me.x,me.y)+.40*Math.sin(Math.PI*a/.39);me.vz=0;}
      }
      if(kind==='mark'){
        if(G.players[ally.id]!==ally){
          G.players[ally.id]=ally;
          if(!G.order.includes(ally.id))G.order.push(ally.id);
        }
        ally.buffs.spd=t>=allyMarkAt&&t<allyMarkAt+3?1.25:1;
        ally.inp.ax=ally.x+400;ally.inp.ay=ally.y;
      }
      if(kind==='dome'&&foe){foe.x=aimSpot.x+(impactKind==='floor'?58:-64);foe.y=aimSpot.y+55;}
    },
    draw(t){
      for(const b of bolts)b.mesh.show(false);
      field.visible=shot.visible=glow.visible=groundAura.visible=false;if(mark)mark.visible=false;
      electric.opacity=1;
      ground(me,source);
      if(kind==='pulse'){
        const age=t-pulseAt;
        if(age>=0&&age<.715)discharge(source,age,pulseRadius);
      }else if(kind==='dome'){
        const age=t-.70;ground(aimSpot,center);center.y+=impactHeight;
        if(age>=0&&age<.19)projectile(muzzle(muzzlePoint),center,age/.19,.115,t);
        else if(age>=.19&&age<2.67){
          const hit=age-.19,fade=1-_cs(clamp((age-2.37)/.30,0,1));
          const r=domeRadius*(.12+.88*_cs(clamp(hit/.18,0,1)));
          dome(center,r,t,.080*fade,.94*fade,12);
          shot.visible=glow.visible=true;
          shot.position.copy(center).add(hand.set(0,.26+.075*Math.sin(t*14),0));
          shot.scale.setScalar((.39+.052*Math.sin(t*21))*fade);
          glow.position.copy(shot.position);
          glow.scale.setScalar(2.18);glow.material.opacity=.62*fade;
          if(impactKind==='floor'&&hit<.46)groundWave(center,hit,domeRadius,Math.PI,1.1);
        }
      }else if(kind==='mark'){
        if(branchStudy){
          ground(ally,target);
          const style=Math.min(2,Math.floor(t/branchBeat)),burst=(fixedReveal?t:t%branchBeat)-branchRelease;
          if(fixedShape)revealMarkBranches(target,0);
          else if(burst<0){
            mark.visible=true;mark.material.opacity=.95;
            mark.position.copy(target).add(hand.set(.14,1.34,.15));
          }
          if(fixedReveal&&!fixedShape&&burst>=-.09)revealMarkBranches(target,burst);
          else if(!fixedReveal&&burst>=0&&burst<1.18)movingMarkBranches(target,burst,style);
          tube.flush();
          return;
        }
        const isAlly=t<selfCastAt,actor=isAlly?ally:me;
        const start=isAlly?allyMarkAt:selfMarkAt,age=t-start;
        ground(actor,target);
        if(isAlly&&age>=0&&age<.11){
          center.copy(target).add(hand.set(0,1.34,0));
          line(21,muzzle(muzzlePoint),center,t,.037*(1-age/.12),gold,.095);
        }
        if(!isAlly&&age>=0&&age<.12){
          glow.visible=true;glow.position.copy(target).add(hand.set(.22,1.36,0));
          glow.scale.setScalar(.7+.44*age/.12);glow.material.opacity=.57*(1-age/.12);
        }
        if(age>=0&&age<3){
          mark.visible=true;
          mark.position.copy(target).add(hand.set(.14,1.34,.15));
          mark.material.opacity=.91+.09*Math.sin(t*8);
          for(let i=0;i<7;i++){
            const az=i*1.257+t*6.5,reach=i%2?.46:.56;
            const base=.26+i*.19;
            arc(i,t,.025,i%2?cyan:gold,(v,u,k)=>{
              const a=az+u*1.45+.075*Math.sin(k*8.94);
              const r=reach+.06*Math.sin(k*5.1);
              v.set(target.x+Math.cos(a)*r,target.y+base+u*.36,target.z+Math.sin(a)*r);
            });
          }
          if(polishStudy)anticipateMark(target,age,t);
        }
        if(polishStudy&&age>=2.91&&age<3.65)revealMarkBranches(target,age-3);
        else if(!polishStudy&&age>=3&&age<4.02){
          const burst=age-3;
          const flash=1-_cs(clamp(burst/.17,0,1));
          groundAura.visible=flash>0;
          groundAura.position.copy(target);groundAura.position.y+=.046;
          groundAura.scale.setScalar(1.75+(1-flash)*4.25);
          groundAura.material.opacity=.42*flash;
          if(flash>0){
            glow.visible=true;glow.position.copy(target);glow.position.y+=.48;
            glow.scale.setScalar(1+(1-flash)*1.25);glow.material.opacity=.65*flash;
            field.visible=rim.visible=true;shell.visible=false;
            field.position.copy(target);field.scale.setScalar(1.65+(1-flash)*2.85);
            rim.material.opacity=.66*flash;
          }
          for(let i=0;i<24;i++){
            const age=burst-(i%6)*.047;
            if(age<0||age>.71)continue;
            const front=clamp(age/.66,0,1),far=markRadius*front*(.87+.13*Math.sin(i*4.8)**2);
            const near=Math.max(0,far-(1.15+1.35*Math.sin(i*2.7)**2));
            const fade=1-_cs(clamp((age-.50)/.21,0,1));
            const colour=(i%3===0?gold:cyan).clone().multiplyScalar(1.22*fade);
            const az=i*2.399+Math.sin(age*8+i)*.19,high=i%3===1;
            arc(i,burst,(high?.16:.125)*fade,colour,(v,u,k)=>{
              const envelope=Math.sin(Math.PI*u),a=az+envelope*(.19*Math.sin(k*7.1+i)+.10*Math.cos(k*3.4));
              const distance=lerp(near,far,u)+.23*Math.sin(k*6.8+i)*envelope;
              const y=high?1.31+.53*envelope+.18*Math.sin(k*9.6):.075+.20*envelope+.07*Math.sin(k*7.8);
              v.set(target.x+Math.cos(a)*distance,target.y+y,target.z+Math.sin(a)*distance);
            });
          }
        }
      }else if(kind==='dash'&&dashAt>=0){
        const age=t-dashAt;
        if(age<.93){
          center.set(tx(me.sdX??home.x),source.y+.08,tz(me.sdY??home.y));
          target.copy(source);target.y+=.08;
          const echo=age>=.43,life=echo?1-_cs(clamp((age-.50)/.43,0,1)):.42;
          electric.opacity=life;
          line(0,center,target,t,echo?.092:.034,echo?gold:cyan,echo?.28:.10);
          if(echo){
            for(let i=1;i<=5;i++){
              from.copy(center).lerp(target,i/6);to.copy(from).add(hand.set(.1,.46,.44*(i%2?1:-1)));
              line(i,from,to,t,.035,i%3===0?cyan:gold,.16);
            }
          }
        }
      }
      tube.flush();
    }
  };
}

function studioMarkRevealPaths(radius){
  const branches=[],addedAngles=[1.64,4.04,.70,3.09,5.52,2.37,4.76];
  const trunkCount=8+addedAngles.length;
  function path(slot,trunk,anchors,at,travel,width,cyan){
    const points=[anchors[0]],distances=[0],atAnchor=[0];
    for(let i=1;i<anchors.length;i++){
      const a=anchors[i-1],b=anchors[i],len=a.distanceTo(b),count=Math.ceil(len/.51);
      const dx=(b.x-a.x)/Math.max(.001,len),dz=(b.z-a.z)/Math.max(.001,len);
      for(let j=1;j<=count;j++){
        const u=j/count,p=a.clone().lerp(b,u);
        const kink=j===count?0:(j%2?1:-1)*(.15+.16*Math.sin(j*2.7+i*3.9+slot)**2);
        p.x-=dz*kink;p.z+=dx*kink;
        distances.push(distances.at(-1)+p.distanceTo(points.at(-1)));points.push(p);
      }
      atAnchor.push(distances.at(-1));
    }
    const result={slot,trunk,points,at,travel,width,cyan,distances,atAnchor,length:distances.at(-1)};
    branches.push(result);
    return result;
  }
  for(let i=0;i<trunkCount;i++){
    const extra=i>=8,angle=extra?addedAngles[i-8]:i*2.399+.25,upper=i%3===1;
    const distance=radius*(extra?.78+.12*Math.cos(i*4.67)**2:.82+.18*Math.cos(i*3.47)**2);
    const at=(i%5)*.018,travel=.31+.032*Math.sin(i*7.4);
    const points=[0,.09,.24,.37,.50,.64,.79,.90,1].map((u,j)=>{
      const az=angle+Math.sin(j*5.93+i)*u*.29+u*u*.16*(i%2?1:-1);
      const d=.42+(distance-.42)*u;
      const y=upper?.95+.90*Math.sin(u*Math.PI*.85):.09+.32*(1-u);
      return new THREE.Vector3(Math.cos(az)*d,y+(upper?.18:.07)*Math.sin(j*4.1+i),Math.sin(az)*d);
    });
    const main=path(i,i,points,at,travel,extra?.218:.264,i%3===1||i===8);
    for(let fork=0;fork<(extra?1:2);fork++){
      const index=fork===0?3:5,origin=points[index],sign=(i+fork)%2?1:-1;
      const heading=angle+sign*(.68+fork*.27),reach=(fork===0?3.9:3.0)*(1+.10*Math.sin(i*3.6));
      const forkPoints=[0,.27,.53,.77,1].map((u,j)=>{
        const az=heading+.33*Math.sin(j*7.8+i)*u,d=u*reach;
        const point=origin.clone().add(new THREE.Vector3(Math.cos(az)*d,Math.sin(j*5)*u*.30,Math.sin(az)*d));
        const r=Math.hypot(point.x,point.z);
        if(r>radius){point.x*=radius/r;point.z*=radius/r;}
        point.y=Math.max(.09,point.y);
        return point;
      });
      path(trunkCount+i+fork*trunkCount,i,forkPoints,at+travel*main.atAnchor[index]/main.length,.137+fork*.026,.170,(i+fork)%3!==0);
    }
  }
  return branches;
}

function studioStormMarkTexture(){
  const cv=document.createElement('canvas');cv.width=cv.height=128;
  const ctx=cv.getContext('2d');
  ctx.beginPath();
  for(const [x,y] of [[70,11],[35,72],[58,70],[48,119],[96,51],[72,54],[83,16]])ctx.lineTo(x,y);
  ctx.closePath();
  ctx.lineJoin='round';ctx.strokeStyle='#443318';ctx.lineWidth=8;ctx.stroke();
  ctx.fillStyle='#ffe632';ctx.shadowColor='#ffd52b';ctx.shadowBlur=13;ctx.fill();
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}

// wrap the studio sim step once so code layers can run per step (not only on drawn frames)
if(typeof stStep==='function'&&!stStep.csWrap){const _st=stStep;stStep=function(){_st();ST.I?.classStanceTick?.();};stStep.csWrap=1;}
