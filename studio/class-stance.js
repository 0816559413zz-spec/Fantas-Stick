// Class stance previews (designs/class-stances.md): drives the real studio player — class kit, idle breathing, a short run —
// so the game's own pose code (readyStance + class branches in js/35-sync.js) is what the GIF shows. args: cls, style, run [t0,t1]
FXCODE.studio_class_stance=(_x,_y,_h,args,instance)=>{
  const me=G&&G.players&&G.players.me,anchor=instance.L.find(l=>l.d.id===(args.layer||'anchor'));
  if(!me||!anchor?.obj)return;
  const path=PATHS.findIndex(p=>p.id===args.cls);if(path<0)return;
  if((me.pathIdx|0)!==path){setKit(me,String(path));me.kt=me.kit;try{WD.broadcastLobby();}catch(e){}}
  STANCE_STYLE[path]=args.style||'a';
  const home=ST.home||(ST.home={x:me.x,y:me.y});resetBody(me,home.x,home.y);me.z=groundH(me.x,me.y);
  const inp=emptyInput(),run=args.run||[2.4,4.0],t0=stVnow;me.inp=inp;
  anchor.obj.onBeforeRender=()=>{
    if(me.inp!==inp)me.inp=inp;const t=(stVnow-t0)/1000,on=t>=run[0]&&t<run[1];
    inp.ax=inp.gx=me.x+400;inp.ay=inp.gy=me.y;inp.ah=0;inp.mx=on?1:0;inp.my=0;
  };
};
