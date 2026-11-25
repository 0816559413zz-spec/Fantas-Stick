// Class stance previews (designs/class-stances.md): drives the real studio player — class kit, idle breathing, a short run —
// so the game's own pose code (readyStance + class branches in js/35-sync.js) is what the GIF shows.
// args: cls, style, run [t0,t1], fmode (Frost start mode 0 sword / 1 wand), acts [{t, a:'fire'|'hold'|'skill'|'ult'|'swap'|'dash', id, d}]
FXCODE.studio_class_stance=(_x,_y,_h,args,instance)=>{
  const me=G&&G.players&&G.players.me,anchor=instance.L.find(l=>l.d.id===(args.layer||'anchor'));
  if(!me||!anchor?.obj)return;
  const path=PATHS.findIndex(p=>p.id===args.cls);if(path<0)return;
  if((me.pathIdx|0)!==path){setKit(me,String(path));me.kt=me.kit;try{WD.broadcastLobby();}catch(e){}}
  STANCE_STYLE[path]=args.style||'a';
  const home=ST.home||(ST.home={x:me.x,y:me.y});resetBody(me,home.x,home.y);me.z=groundH(me.x,me.y);
  if(args.fmode!==undefined)me.fmode=args.fmode;me.fmCd=0;
  for(const k in me.cd)me.cd[k]=0;
  const inp=emptyInput(),run=args.run||[2.4,4.0],acts=(args.acts||[]).map(a=>({...a,done:false}));me.inp=inp;
  const foe=foesOf(me.team).filter(e=>e.alive!==false)[0];
  // driven from every studio sim step (stStep is wrapped below), on studio time ST.t, so seeks/GIF export replay it exactly
  instance.classStanceTick=()=>{
    if(me.inp!==inp)me.inp=inp;const t=ST.t,on=t>=run[0]&&t<run[1];
    inp.ax=inp.gx=me.x+400;inp.ay=inp.gy=me.y;inp.ah=0;inp.mx=on?1:0;inp.my=0;
    if(foe){foe.x=me.x+400;foe.y=me.y;}
    let fire=0;
    for(const a of acts){
      if(a.a==='hold'&&t>=a.t&&t<a.t+(a.d||1))fire=1;
      if(a.a==='fire'&&t>=a.t&&t<a.t+.12)fire=1;
      if(a.done||t<a.t)continue;a.done=true;
      if(a.a==='skill'){for(const k in me.cd)me.cd[k]=0;me.kitIds[0]=a.id;inp.hq=1;try{castSlot(me,0);}catch(e){}inp.hq=0;}
      else if(a.a==='ult'){me.ultId=a.id;me.ult=100;try{castUlt(me);}catch(e){}}
      else if(a.a==='swap'){me.fmode=me.fmode===1?0:1;me.fmCd=me.fswT=FROST_SWAP_T;me.cmbT=0;emit({k:'efx',z:'fswap',x:me.x,y:me.y,h:me.z+1,id:me.id,m:me.fmode});}   // same as the host's V key
      else if(a.a==='dash'){me.cd.dodge=0;inp.c.sp++;}
      else if(a.a==='fire'||a.a==='hold')me.cd.basic=0;
    }
    inp.fire=fire;
    // during a seek / GIF export the studio does not run the game or pose the players: step the host and pose here
    if(FXSTUDIO.seek){try{hostTick(STD);const base=makeSnap(),evl=EVL;EVL=[];onSnap(Object.assign({},base,{ev:evl}));const v=VIEW.cur;if(v)syncPlayers(v.P,v.mode,stVnow,STD);}catch(e){console.warn('stance tick',e);}}
  };
};

// wrap the studio sim step once so code layers can run per step (not only on drawn frames)
if(typeof stStep==='function'&&!stStep.csWrap){const _st=stStep;stStep=function(){_st();ST.I?.classStanceTick?.();};stStep.csWrap=1;}
