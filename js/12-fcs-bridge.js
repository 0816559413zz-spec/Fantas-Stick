// =====================================================================
//  Castle Strike bridge shell destruction (user 2026-11-19 "eggshell"): the bridge = solid core + an outer stone shell
//  cut into ~1.5 m chunks (Voronoi cells, modeled in Blender: assets/src/fcs_bridge_build.py -> map_fcs_bridge glb).
//  Side shell 0.35 m thick on the 4 outer faces (incl. ramps + corner block); rim chunks = the outer 1 m strip of the deck top
//  along each edge. Strong skills only (damageEnv), cover rules: cracks at 66% / 33% hp, then the chunk falls off.
//  Core never breaks. A broken rim chunk cuts the walk floor there (path gets narrower) and drops the parapet unit above it.
//  Chunk layout is computed here from MAPS.fcs.fcs.bridge (same seeds exported to Blender by tools/fcs-bridge-export.js),
//  so host logic never waits for the model. Snapshot field BS. View: fcsShell* in js/28-fcs-build.js.
// =====================================================================
const BSKV={cell:1.5,shell:0.35,rimW:1.0,rimH:1.0,hp:100,crack:[0.66,0.33],arcN:14,cr:0.8,seed:7301};
const BSKN={B:null,F:[],C:[],rb:[],ver:0,str:'',_sv:-1};
// faces (map px): ax 'y' = runs along y at x=c, ax 'x' = runs along x at y=c • n = outward • a0 shell start, corner = corner block end,
// dEnd = deck end / ramp start, a1 = ramp end, r0 = rim start
function bskBuild(id){
  const M=MAPS[id],B=M&&M.fcs&&M.fcs.bridge;BSKN.B=B||null;BSKN.F=[];BSKN.C=[];BSKN.rb=[];BSKN.ver++;BSKN.str='';if(!B)return;
  const {ax,cy,HW,yS,xE,LS,LE}=B,T=BSKV.shell*20,RW=BSKV.rimW*20;
  BSKN.F=[{ax:'y',c:ax-HW,n:-1,a0:cy-HW,corner:cy+HW,dEnd:yS,a1:yS+LS,r0:cy-HW},
          {ax:'y',c:ax+HW,n:1,a0:cy+HW,corner:cy+HW,dEnd:yS,a1:yS+LS,r0:cy+HW},
          {ax:'x',c:cy-HW,n:-1,a0:ax-HW+T,corner:ax+HW,dEnd:xE,a1:xE+LE,r0:ax-HW+RW},
          {ax:'x',c:cy+HW,n:1,a0:ax+HW,corner:ax+HW,dEnd:xE,a1:xE+LE,r0:ax+HW}];
  const R=mulberry(BSKV.seed),S=BSKV.cell,C=BSKN.C,top=B.DH-BSKV.rimH;
  BSKN.F.forEach((f,fi)=>{
    const P=bskOutline(f);f.P=P;
    // side shell seeds: jittered 1.5 m grid inside the outline, top row lined up under the rim
    for(let a=f.a0+S*10;a<f.a1;a+=S*20)for(let z=top-S/2;z>-30;z-=S){
      const ja=a+(R()-0.5)*S*20*0.6,jz=z+(R()-0.5)*S*0.6,az=Math.min(jz,top-0.3),g=bskGround(f,ja);
      if(az<g-0.6)break;
      if(!bskInPoly(P,ja,az))continue;
      C.push({i:C.length,f:fi,a:ja,z:az,rim:0,hp:BSKV.hp,st:0});}
    // rim chunks along the deck edge (straight logic span; Blender cuts the ends at an angle)
    const L=f.dEnd-f.r0,n=Math.max(1,Math.round(L/(S*20))),cut=[f.r0];
    for(let k=1;k<n;k++)cut.push(f.r0+L*k/n+(R()-0.5)*8);cut.push(f.dEnd);
    for(let k=0;k<n;k++)C.push({i:C.length,f:fi,a:(cut[k]+cut[k+1])/2,a0:cut[k],a1:cut[k+1],z:B.DH-BSKV.rimH/2,rim:1,hp:BSKV.hp,st:0});
  });
  for(const c of C){const f=BSKN.F[c.f],d=c.rim?RW/2:T/2;c.px=f.ax==='y'?f.c-f.n*d:c.a;c.py=f.ax==='y'?c.a:f.c-f.n*d;}
  const fl=M.terr&&M.terr.fl&&M.terr.fl.find(q=>q.k==='bridge');if(fl)fl.cut=bskCut;
}
function bskGround(f,a){return f.ax==='y'?terrT(f.c,a):terrT(a,f.c);}
// face outline polygon [[along px, z m]]: bottom left->right (arch openings cut up from the ground), then the top back
function bskOutline(f){
  const B=BSKN.B,DH=B.DH,P=[],N=BSKV.arcN;
  if(f.a0<f.corner){const bc=GY(B.ax,B.cy)-1.2;P.push([f.a0,bc],[f.corner,bc]);}
  for(const s of B.spans){const ns=s.x1===s.x2;if(ns!==(f.ax==='y'))continue;
    const p0=ns?s.y1:s.x1,p1=ns?s.y2:s.x2,L=Math.abs(p1-p0)/20,r=(L-1.6)/2,m=(p0+p1)/2,rp=r*20,mx=(s.x1+s.x2)/2,my=(s.y1+s.y2)/2;
    const base=Math.min(GY(s.x1,s.y1),GY(s.x2,s.y2),GY(mx,my))-1.2,spring=DH-1.3-r;
    P.push([p0,base],[m-rp,base],[m-rp,spring]);
    for(let k=1;k<N;k++){const t=Math.PI-Math.PI*k/N;P.push([m+rp*Math.cos(t),spring+r*Math.sin(t)]);}
    P.push([m+rp,spring],[m+rp,base],[p1,base]);}
  const alongY=f.ax==='y',gEnd=alongY?B.gS:B.gE,bR=Math.min(alongY?GY(B.ax,B.yS):GY(B.xE,B.cy),gEnd)-1.2;
  P.push([f.dEnd,bR],[f.a1+6,bR],[f.a1+6,gEnd-0.05],[f.dEnd,DH],[f.dEnd,DH-BSKV.rimH],[f.a0,DH-BSKV.rimH]);
  return P;
}
function bskInPoly(P,x,y){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const [xi,yi]=P[i],[xj,yj]=P[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c;}return c;}
// walk floor cut: point over a broken rim chunk = no bridge floor there (TERR floor hook, js/05 floorAt)
function bskCut(x,y){
  for(const c of BSKN.rb){const f=BSKN.F[c.f],al=f.ax==='y'?y:x,pe=f.ax==='y'?x:y,d=(f.c-pe)*f.n;
    if(al>=c.a0&&al<=c.a1&&d>-8&&d<BSKV.rimW*20)return true;}
  return false;
}
function bskStage(c){const f=c.hp/BSKV.hp;return c.hp<=0?3:f<BSKV.crack[1]?2:f<BSKV.crack[0]?1:0;}
function bskSetSt(c,st){
  const was=c.st;c.st=st;if(st===was)return;
  if(c.rim){const k=BSKN.rb.indexOf(c);if(st>=3&&k<0)BSKN.rb.push(c);else if(st<3&&k>=0)BSKN.rb.splice(k,1);}
}
function bskHit(c,dmg,ox,oy){
  if(c.st>=3)return;c.hp-=dmg;const st=bskStage(c);if(st<=c.st)return;
  bskSetSt(c,st);BSKN.ver++;const f=BSKN.F[c.f],b=st>=3;
  emit({k:'bsk',i:c.i,st,x:Math.round(c.px+f.n*(f.ax==='y'?8:0)),y:Math.round(c.py+f.n*(f.ax==='x'?8:0)),h:Math.round((c.z-terrT(c.px,c.py))*10)/10,r:b?30:16,hh:b?1.2:0.5,col:'#a49a88'});
  // rim gone: the parapet unit standing on it falls too
  if(b&&c.rim&&typeof BRK!=='undefined'){const B=BSKN.B;for(const g of BRK){if(!g.d||g.d.fp==null||g.st>=3)continue;const u=B.parU[g.d.fp];
    if((f.ax==='y'?u.nx:u.ny)!==f.n||(f.ax==='y'?u.ny:u.nx)!==0)continue;const al=f.ax==='y'?u.y:u.x;if(al>c.a0-6&&al<c.a1+6)hitBrk(g,1e6,ox,oy);}}
}
// damageEnv: 3D distance from the blast to each chunk; side chunks only take blasts from outside their face (core shields), or from the deck
function bskEnv(x,y,rad,dmg,by,el,h){
  const B=BSKN.B;if(!B||!BSKN.C.length||!(dmg>0)||!B.at(x,y,rad+40))return;
  const hz=terrT(x,y)+(h||0),R=rad/20,T=BSKV.shell*20;
  for(const c of BSKN.C){if(c.st>=3)continue;const f=BSKN.F[c.f];
    const d=Math.max(0,Math.hypot((c.px-x)/20,(c.py-y)/20,c.z-hz)-BSKV.cr);if(d>=R)continue;
    if(!c.rim){const pe=f.ax==='y'?x:y;if((pe-f.c)*f.n<-T&&hz<B.DH-0.2)continue;}
    bskHit(c,dmg*(1-0.7*d/R),x,y);}
}
// snapshot: damaged chunks only, 4 chars each = index (3, base36) + stage
function bskSnap(){
  if(BSKN._sv!==BSKN.ver){BSKN._sv=BSKN.ver;let s='';for(const c of BSKN.C)if(c.st)s+=c.i.toString(36).padStart(3,'0')+c.st;BSKN.str=s;}
  return BSKN.str;
}
function bskParse(s){
  s=s||'';if(s===BSKN.str)return;BSKN.str=s;const set=new Map();
  for(let i=0;i+4<=s.length;i+=4)set.set(parseInt(s.substr(i,3),36),+s[i+3]);
  for(const c of BSKN.C){const st=set.get(c.i)||0;if(st!==c.st){bskSetSt(c,st);c.hp=st?BSKV.hp*(st>=3?0:st===2?0.3:0.6):BSKV.hp;}}
  BSKN.ver++;BSKN._sv=BSKN.ver;
}
// repair (Dev tool / round reset): all chunks, or those within rad px of (x,y)
function bskRepair(x,y,rad){let n=0;for(const c of BSKN.C){if(!c.st&&c.hp===BSKV.hp)continue;if(rad!=null&&Math.hypot(c.px-x,c.py-y)>rad)continue;c.hp=BSKV.hp;bskSetSt(c,0);n++;}if(n)BSKN.ver++;return n;}
// Blender export data (tools/fcs-bridge-export.js): world meters. Face plane: ax 'y' -> world X = c, along = world Z; ax 'x' -> world Z = c, along = world X
function bskExport(){
  const B=BSKN.B;if(!B)return null;const wa=(f,a)=>f.ax==='y'?tz(a):tx(a),r3=v=>Math.round(v*1000)/1000;
  return {DH:B.DH,shell:BSKV.shell,rimW:BSKV.rimW,rimH:BSKV.rimH,
    faces:BSKN.F.map(f=>({ax:f.ax,c:r3(f.ax==='y'?tx(f.c):tz(f.c)),n:f.n,P:f.P.map(([a,z])=>[r3(wa(f,a)),r3(z)])})),
    chunks:BSKN.C.map(c=>{const f=BSKN.F[c.f];return c.rim?{i:c.i,f:c.f,rim:1,a0:r3(wa(f,c.a0)),a1:r3(wa(f,c.a1))}:{i:c.i,f:c.f,a:r3(wa(f,c.a)),z:r3(c.z)};})};
}
