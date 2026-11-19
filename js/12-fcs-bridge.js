// =====================================================================
//  Castle Strike bridge skin damage (user 2026-11-19): skill hits (damageEnv) leave damage on the bridge's stone faces
//  at the hit spot — stage 1 chipped bricks, 2 missing bricks, 3 exposed rubble. Repeat hits on a spot raise its stage.
//  Visual only (no collision change). Host: bskEnv -> BSKN.list, snapshot field BS. Client: bskParse. Visual: bskView (js/28-fcs-build.js).
//  Parapet merlons break separately through BRK (cover destruction rules, brkX in js/02-fcs.js).
// =====================================================================
const BSKN={B:null,F:[],list:[],ver:0,str:'',max:64};
// 4 vertical outer faces of the L (map px). ax:'y' = face runs along y. n = outward side. a0..a1 = along range (incl. ramps)
function bskBuild(id){
  const M=MAPS[id],B=M&&M.fcs&&M.fcs.bridge;BSKN.B=B||null;BSKN.F=[];BSKN.list=[];BSKN.ver++;BSKN.str='';if(!B)return;
  const {ax,cy,HW,yS,xE,LS,LE}=B;
  BSKN.F=[{ax:'y',c:ax-HW,n:-1,a0:cy-HW,a1:yS+LS},{ax:'y',c:ax+HW,n:1,a0:cy+HW,a1:yS+LS},{ax:'x',c:cy-HW,n:-1,a0:ax-HW,a1:xE+LE},{ax:'x',c:cy+HW,n:1,a0:ax+HW,a1:xE+LE}];
}
// face top (world m) at along a: ramp top on ramps, else just under the deck edge
function bskTop(f,a){const B=BSKN.B;if(f.ax==='y'&&a>B.yS)return B.rampTop(B.ax,a);if(f.ax==='x'&&a>B.xE)return B.rampTop(a,B.cy);return B.DH-0.3;}
// inside an arch opening? -> lift onto the arch ring
function bskArch(f,a,z){
  for(const s of BSKN.B.spans){const ns=s.x1===s.x2;if(ns!==(f.ax==='y'))continue;const p0=ns?s.y1:s.x1,p1=ns?s.y2:s.x2,L=Math.abs(p1-p0)/20,r=(L-1.6)/2,m=(p0+p1)/2,d=Math.abs(a-m)/20;
    if(d<r){const spring=BSKN.B.DH-1.3-r,arc=spring+Math.sqrt(r*r-d*d);if(z<arc)return arc+0.35;}}
  return z;
}
function bskEnv(x,y,rad,dmg,by,el,h){
  if(!BSKN.B||!BSKN.F.length)return;const hw=terrT(x,y)+(h||0);let best=null,bd=1e9;
  for(let i=0;i<BSKN.F.length;i++){const f=BSKN.F[i],along=f.ax==='y'?y:x,perp=f.ax==='y'?x:y,a=clamp(along,f.a0,f.a1),d=Math.hypot(perp-f.c,along-a);if(d<bd){bd=d;best={i,a};}}
  if(!best||bd>rad+20)return;
  const f=BSKN.F[best.i],a=best.a,px=f.ax==='y'?f.c:a,py=f.ax==='y'?a:f.c,g=terrT(px,py),top=bskTop(f,a);if(top-g<0.6)return;
  let z=clamp(hw,g+0.4,top);z=Math.min(top,bskArch(f,a,z));
  const s=clamp(rad/20*0.4,0.6,2.2),L=BSKN.list;
  let sp=L.find(q=>q.f===best.i&&Math.abs(q.a-a)/20<(q.s+s)*0.5&&Math.abs(q.z-z)<(q.s+s)*0.5);
  if(sp){sp.st=Math.min(3,sp.st+1);sp.s=Math.min(2.6,Math.max(sp.s,s)+0.2);}
  else{sp={f:best.i,a,z,s,st:1};L.push(sp);if(L.length>BSKN.max)L.shift();}
  BSKN.ver++;
  emit({k:'bsk',x:Math.round(px+f.n*(f.ax==='y'?6:0)),y:Math.round(py+f.n*(f.ax==='x'?6:0)),h:Math.round((z-g)*10)/10,r:Math.round(sp.s*20),hh:Math.round(sp.s*10)/10,st:sp.st,col:'#a49a88'});
}
// snapshot: 8 chars per spot = face(1) along/10 px(3, base36) z*4(2) size*10(1, base36) stage(1)
function bskSnap(){
  if(!BSKN.list.length)return '';
  if(BSKN._sv!==BSKN.ver){BSKN._sv=BSKN.ver;BSKN.str=BSKN.list.map(q=>q.f+Math.round(q.a/10).toString(36).padStart(3,'0')+Math.round(q.z*4).toString(36).padStart(2,'0')+Math.round(q.s*10).toString(36).slice(-1)+q.st).join('');}
  return BSKN.str;
}
function bskParse(s){
  s=s||'';if(s===BSKN.str)return;BSKN.str=s;BSKN.list=[];
  for(let i=0;i+8<=s.length;i+=8){const t=s.substr(i,8);BSKN.list.push({f:+t[0],a:parseInt(t.substr(1,3),36)*10,z:parseInt(t.substr(4,2),36)/4,s:parseInt(t[6],36)/10,st:+t[7]});}
  BSKN.ver++;
}
