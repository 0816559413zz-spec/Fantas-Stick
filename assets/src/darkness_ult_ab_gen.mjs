// Darkness ult "A+B" creature for VFX Studio (user design 2026-11-20): ink skull head (A) on a torn
// cloak body (B). Three versions differ only in surface texture + shadow aura; v1 is the agreed one.
//   node assets/src/darkness_ult_ab_gen.mjs
// Writes assets/fx/mesh/dark_ab_*.mesh.json and assets/fx/darkness/ult_v1|v2|v3.fx.json.
// Timing (user): very fast launch -> eases slow -> at range in 0.8 s -> hold, opens a bit more ->
// hard fast bite -> shatters. Scales evenly (taller as it grows, never flat).
import {writeFileSync} from 'node:fs';

const r3=n=>Math.round(n*1000)/1000;
const ease=(a,b,v)=>{const t=Math.min(1,Math.max(0,(v-a)/(b-a)));return t*t*(3-2*t);};
let S=7;const rnd=()=>{S=(S*16807)%2147483647;return S/2147483647;};const seed=s=>{S=s;};
const lerp=(a,b,t)=>a+(b-a)*t;

// ---------- head profile (units: head height 1; +z forward, hinge at the mouth corner) ----------
const Z0=-.62,Z1=.78,HZ=-.12;                 // neck, snout tip, hinge z
const yTop=z=>{const t=(z-Z0)/(Z1-Z0);return lerp(.44,.58,ease(0,.4,t))-.36*ease(.5,1,t)**1.5;};   // rounder skull, still sloping (user: more round is fine)
const yMid=z=>-.14+.05*ease(HZ,Z1,z);         // mouth line (low: upper part is bigger)
const yBot=z=>{const t=(z-Z0)/(Z1-Z0);return lerp(-.44,-.50,ease(0,.5,t))+.26*ease(.5,1,t)**1.2;};
const halfW=z=>{const t=(z-Z0)/(Z1-Z0);return lerp(.54,.64,ease(0,.4,t))-.30*ease(.5,1,t)**1.6;};   // round section, not flat
// point on the upper (sign 1) or lower (-1) part; phi 0..PI = outer skin, PI..2PI = flat mouth roof/floor
function headPt(z,phi,sign){
  const w=halfW(z),m=yMid(z),e=sign>0?yTop(z):yBot(z);
  if(phi<=Math.PI){const c=Math.cos(phi),s=Math.pow(Math.sin(phi),.75);return [w*c,m+(e-m)*s,z];}
  return [w*Math.cos(phi),m,z];
}
const toHinge=([x,y,z])=>[r3(x),r3(y-yMid(HZ)),r3(z-HZ)];
function jaw(sign){
  const NZ=34,NP=36,v=[],f=[];
  for(let i=0;i<=NZ;i++){const z=lerp(Z0,Z1,i/NZ);
    for(let j=0;j<NP;j++){v.push(toHinge(headPt(z,2*Math.PI*j/NP,sign)));
      if(i<NZ){const a=i*NP+j,b=a+NP,a1=i*NP+(j+1)%NP,b1=a1+NP;f.push(sign>0?[a,a1,b1,b]:[a,b,b1,a1]);}}}
  const back=v.length;v.push(toHinge([0,(yMid(Z0)+(sign>0?yTop(Z0):yBot(Z0)))/2,Z0-.03]));   // cap the neck so the skull is never hollow from behind
  for(let j=0;j<NP;j++){const a=j,a1=(j+1)%NP;f.push([a1,a,back]);f.push([a,a1,back]);}
  const tip=v.length;v.push(toHinge([0,(yMid(Z1)+(sign>0?yTop(Z1):yBot(Z1)))/2,Z1+.03]));
  for(let j=0;j<NP;j++){const a=NZ*NP+j,a1=NZ*NP+(j+1)%NP;f.push(sign>0?[a,a1,tip]:[a,tip,a1]);}
  return {id:sign>0?'upper':'lower',k:'poly',v,f,sub:0};
}
// double-sided pyramid helper
function spike(v,f,base,side,tip){const n=v.length;
  v.push(base.map((c,i)=>r3(c-side[i])),base.map((c,i)=>r3(c+side[i])),[r3(base[0]),r3(base[1]),r3(base[2]-.03)],tip.map(r3));
  for(const [a,b,c] of [[0,1,3],[1,2,3],[2,0,3],[0,2,1]]){f.push([n+a,n+b,n+c]);f.push([n+a,n+c,n+b]);}}
function teeth(sign){   // uneven teeth along the U-shaped rim of the mouth
  const v=[],f=[];seed(sign>0?31:37);
  const rim=t=>{   // t 0..1: left side back -> front tip -> right side back
    const side=t<.5?-1:1,u=t<.5?1-t*2:(t-.5)*2,z=lerp(Z1-.02,HZ+.06,u);return [side*halfW(z)*.96,yMid(z),z];};
  let t=.02;
  while(t<.98){const p=rim(t),len=(sign>0?.10:.07)+(sign>0?.17:.11)*rnd(),wid=.018+.025*rnd();
    const q=rim(Math.min(.999,t+.01)),sd=[(q[0]-p[0]),(q[1]-p[1]),(q[2]-p[2])],l=Math.hypot(...sd)||1;
    spike(v,f,toHinge(p),sd.map(c=>c/l*wid),toHinge([p[0]*.9,p[1]-sign*len,p[2]-.02]));
    t+=.035+rnd()*.06;}
  return {id:'teeth',k:'poly',v,f,sub:0};
}
function crest(){   // A: torn flame tongues along the top of the skull, peeling back and up
  const v=[],f=[];seed(41);
  for(let i=0;i<26;i++){const z=lerp(-.55,.42,rnd()),phi=lerp(.95,2.2,rnd());const b=headPt(z,phi,1);
    const len=lerp(.10,.42,rnd())*(1-.4*Math.abs(phi-Math.PI/2)),wid=.025+.035*rnd();
    const tip=[b[0]*1.15,b[1]+len*.55,b[2]-len];
    spike(v,f,toHinge(b),[0,0,wid],toHinge(tip));}
  return {id:'crest',k:'poly',v,f,sub:0};
}
function headStrands(sign){   // texture: ink strands flowing over the head skin (slightly above it)
  const v=[],f=[];seed(sign>0?51:53);
  const N=sign>0?70:34;
  for(let s=0;s<N;s++){const phi=lerp(.08,Math.PI-.08,rnd()),w=.006+.012*rnd(),zs=lerp(.15,Z1-.04,rnd()),ze=lerp(Z0+.02,-.1,rnd()),wob=rnd()*6;
    const SEG=16,base=v.length;
    for(let i=0;i<=SEG;i++){const u=i/SEG,z=lerp(zs,ze,u),ph=phi+.06*Math.sin(u*5+wob);
      const p=headPt(z,ph,sign),q=headPt(z,ph+.04,sign),k=1.012,ww=w*(1-u*.7);
      const o=[p[0]*k,(p[1]-yMid(z))*k+yMid(z),p[2]],d=[q[0]-p[0],q[1]-p[1]],l=Math.hypot(...d)||1;
      v.push(toHinge([o[0]-d[0]/l*ww,o[1]-d[1]/l*ww,o[2]]),toHinge([o[0]+d[0]/l*ww,o[1]+d[1]/l*ww,o[2]]));
      if(i<SEG){const a=base+i*2;f.push([a,a+1,a+3,a+2]);f.push([a,a+2,a+3,a+1]);}}}
  return {id:'strands',k:'poly',v,f,sub:0};
}
// ---------- body / tail (B cloak), z=0 at the neck -> z=-1 at the hand; scaled [H,H,len] ----------
const TIP=.28;   // wide base at the hand (user: wide at the start, middle and tip)
const tailR=u=>TIP+(1-TIP)*Math.pow(1-u,1.25);          // u 0 neck .. 1 hand
function tail(){
  const SEG=30,NP=30,v=[],f=[];
  for(let i=0;i<=SEG;i++){const u=i/SEG,r=tailR(u);
    for(let j=0;j<NP;j++){const ph=2*Math.PI*j/NP;v.push([r3(Math.cos(ph)*r*.55/.5*.5),r3(Math.sin(ph)*r*.47),r3(-u)]);
      if(i<SEG){const a=i*NP+j,b=a+NP,a1=i*NP+(j+1)%NP,b1=a1+NP;f.push([a,a1,b1,b]);}}}
  return {id:'tail',k:'poly',v,f,sub:0};
}
function hem(){   // B: torn cloth flaps hanging from the underside and sides, swept back
  const v=[],f=[];seed(61);
  for(let i=0;i<34;i++){const u=lerp(.02,.85,rnd()),ph=lerp(Math.PI*1.15,Math.PI*1.85,rnd()),r=tailR(u);
    const b=[Math.cos(ph)*r*.55,Math.sin(ph)*r*.47,-u],len=lerp(.10,.30,rnd())*r*1.6,wid=.035+.04*rnd();
    spike(v,f,b.map(r3),[0,0,wid],[b[0]*1.1,b[1]-len,b[2]-wid*2.2].map(r3));}
  return {id:'hem',k:'poly',v,f,sub:0};
}
function cloth(){   // texture: overlapping torn cloth plates on the body, edges peel back
  const v=[],f=[];seed(71);
  for(let i=0;i<70;i++){const u=lerp(.0,.9,rnd()),ph=lerp(.15,Math.PI*2-.15,rnd()),r=tailR(u)*1.015;
    const p=[Math.cos(ph)*r*.55,Math.sin(ph)*r*.47,-u],len=lerp(.05,.12,rnd()),wid=lerp(.08,.18,rnd())*r;
    const t=[-Math.sin(ph)*wid*.55,Math.cos(ph)*wid*.47,0];   // around the body
    const n=v.length;
    v.push(...[[p[0]-t[0],p[1]-t[1],p[2]],[p[0]+t[0],p[1]+t[1],p[2]],[p[0]+t[0]*.7,p[1]+t[1]*.7,p[2]-len],[p[0]+t[0]*.1,p[1]+t[1]*.1,p[2]-len*1.5],[p[0]-t[0]*.6,p[1]-t[1]*.6,p[2]-len*.9]].map(q=>q.map(r3)));
    f.push([n,n+1,n+2,n+3,n+4]);f.push([n+4,n+3,n+2,n+1,n]);}
  return {id:'cloth',k:'poly',v,f,sub:0};
}
const wisp={id:'wisp',k:'poly',sub:0,flat:true,v:[[0,0,1.4],[.08,0,0],[0,.04,0],[-.08,0,0],[0,-.04,0],[0,0,-.3]],f:[[0,2,1],[0,3,2],[0,4,3],[0,1,4],[5,1,2],[5,2,3],[5,3,4],[5,4,1]]};
const shard={id:'shard',k:'poly',sub:0,flat:true,v:[[0,.5,0],[.18,0,0],[0,0,.08],[-.18,0,0],[0,0,-.08],[0,-.35,0]],f:[[0,2,1],[0,3,2],[0,4,3],[0,1,4],[5,1,2],[5,2,3],[5,3,4],[5,4,1]]};
const ribbon={id:'ribbon',k:'poly',sub:0,v:[[-.12,0,0],[.12,0,0],[.10,.02,-.6],[-.06,-.02,-.6],[.03,0,-1.3]],f:[[0,1,2,3],[3,2,4],[3,2,1,0],[4,2,3]]};
const model=(name,desc,parts)=>writeFileSync(`assets/fx/mesh/${name}.mesh.json`,JSON.stringify({v:1,desc,mat:'solid',pal:'arcane',tags:['darkness','ult'],parts})+'\n');
model('dark_ab_upper','Darkness อัลติ A+B กะโหลกส่วนบน (ใหญ่กว่า หน้าผากลาด) จุดหมุน = มุมปาก',[jaw(1)]);
model('dark_ab_lower','Darkness อัลติ A+B ขากรรไกรล่าง',[jaw(-1)]);
model('dark_ab_teeth_upper','Darkness อัลติ A+B ฟันบน',[teeth(1)]);
model('dark_ab_teeth_lower','Darkness อัลติ A+B ฟันล่าง',[teeth(-1)]);
model('dark_ab_crest','Darkness อัลติ A+B ลิ้นเปลวบนหัว',[crest()]);
model('dark_ab_strands_upper','Darkness อัลติ A+B เส้นหมึกบนหัว',[headStrands(1)]);
model('dark_ab_strands_lower','Darkness อัลติ A+B เส้นหมึกขากรรไกรล่าง',[headStrands(-1)]);
model('dark_ab_tail','Darkness อัลติ A+B ตัวผ้าคลุม (คอ z=0 → มือ z=-1)',[tail()]);
model('dark_ab_hem','Darkness อัลติ A+B ชายผ้าขาดใต้ตัว',[hem()]);
model('dark_ab_cloth','Darkness อัลติ A+B แผ่นผ้าซ้อนบนตัว',[cloth()]);
model('dark_ab_wisp','Darkness อัลติ A+B เส้นเงาหลุด',[wisp]);
model('dark_ab_shard','Darkness อัลติ A+B เศษเงา',[shard]);
function portal(){   // vertical ring in the XY plane: torn ink blades outward, thin rim, four slash marks inside
  const v=[],f=[];seed(81);
  const quad=(a,b,c,d)=>{const n=v.length;v.push(...[a,b,c,d].map(q=>q.map(r3)));f.push([n,n+1,n+2,n+3]);f.push([n+3,n+2,n+1,n]);};
  const tri=(a,b,c)=>{const n=v.length;v.push(...[a,b,c].map(q=>q.map(r3)));f.push([n,n+1,n+2]);f.push([n+2,n+1,n]);};
  for(let i=0;i<48;i++){const a0=i/48*Math.PI*2,a1=(i+1)/48*Math.PI*2;if(rnd()<.12)continue;   // rim band with small gaps
    const r0=.9+.03*rnd(),r1=1.02+.04*rnd();quad([Math.cos(a0)*r0,Math.sin(a0)*r0,0],[Math.cos(a1)*r0,Math.sin(a1)*r0,0],[Math.cos(a1)*r1,Math.sin(a1)*r1,0],[Math.cos(a0)*r1,Math.sin(a0)*r1,0]);}
  for(let i=0;i<30;i++){const a=rnd()*Math.PI*2,w=.05+.06*rnd(),len=.15+.5*rnd(),sw=.25*(rnd()-.5);   // blades swirl outward
    tri([Math.cos(a-w)*1.0,Math.sin(a-w)*1.0,0],[Math.cos(a+w)*1.0,Math.sin(a+w)*1.0,0],[Math.cos(a+sw)*(1+len),Math.sin(a+sw)*(1+len),-.05]);}
  for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4,c=Math.cos(a),s2=Math.sin(a),tx=-s2,ty=c;   // slash marks (Darkness mark motif)
    tri([c*.45+tx*.05,s2*.45+ty*.05,0],[c*.45-tx*.05,s2*.45-ty*.05,0],[c*.86,s2*.86,0]);}
  return {id:'portal',k:'poly',v,f,sub:0};
}
model('dark_ab_portal','Darkness อัลติ วงเวทเงาที่สัตว์พุ่งออกมา (แนวตั้ง ระนาบ XY)',[portal()]);
model('dark_ab_ribbon','Darkness อัลติ A+B ริ้วผ้าสะบัด',[ribbon]);

// ---------- timeline ----------
const REL=1.0,LIFE=1.42,TRAVEL=.95,HOLD=1.01,SHUT=1.04,GONE=1.32;   // keeps moving to the end, almost no hold, very fast bite
const W=[.31,.85,1.65];            // left hand at full thrust (studio stage)
const HMAX=7.2,RANGE=30,WX=1.7,WXH=1.35,TY=1.25;   // head less wide (user: face too wide); body bigger/taller to match
const P=[W[0],2.7,W[2]+1.4],PR=3.3;   // shadow portal in front of the hand: the creature comes out of it
const OPMAX=.93;                    // mostly opaque: you should not see the other side through it (user)
function state(tr){
  const x=Math.min(1,tr/TRAVEL),out4=1-(1-x)**4,out3=1-(1-x)**3;
  const H=HMAX*(.45+.55*out3)+.25*ease(TRAVEL,HOLD,tr)+.3*ease(HOLD,SHUT,tr)*(1-ease(SHUT,SHUT+.08,tr));
  const front=P[2]+(RANGE-1.2-P[2])*out3+1.2*Math.min(1,Math.max(0,(tr-TRAVEL)/(SHUT-TRAVEL)));   // still moving at arrival, keeps drifting into the bite
  const hz=front-(Z1-HZ)*H;                        // hinge z
  const hy=Math.max(P[1],.15+.55*H);               // starts at the portal centre, chin above the floor
  const slam=Math.min(1,Math.max(0,(tr-HOLD)/(SHUT-HOLD)))**3;
  const open=tr<HOLD?8+52*out3+16*ease(TRAVEL-.05,HOLD,tr):76*(1-slam);
  const nod=14*ease(HOLD,SHUT,tr)*(1-ease(SHUT+.06,SHUT+.25,tr));   // head dips down as it bites
  return {H,hz,hy,open,nod};
}
const keys=fn=>{const c={};for(let i=0;i<=104;i++){const k=i/104;c[String(r3(k))]=fn(k*LIFE);}return c;};
const pos=keys(tr=>{const q=state(tr);return [W[0],r3(q.hy),r3(q.hz)];});
const scale=keys(tr=>{const H=state(tr).H;return [r3(H*WXH),r3(H),r3(H)];});
const rotUp=keys(tr=>{const q=state(tr);return [r3(q.open*.62-q.nod),0,0];}),rotLow=keys(tr=>{const q=state(tr);return [r3(-q.open*.38-q.nod),0,0];});
const fadeOut=keys(tr=>r3(OPMAX*ease(0,.06,tr)*(1-ease(SHUT+.04,GONE,tr))));
const neck=tr=>{const q=state(tr);return [W[0],q.hy+(0-yMid(HZ))*q.H*0,q.hz+(Z0-HZ)*q.H*.9];};
const tailLen=tr=>Math.max(.05,neck(tr)[2]-P[2]);
const tailPos=keys(tr=>neck(tr).map(r3));
const tailScale=keys(tr=>{const q=state(tr),back=1-ease(SHUT,GONE-.03,tr);return [r3(q.H*WX),r3(q.H*TY),r3(tailLen(tr)*back)];});
const tailRot=keys(tr=>[r3(Math.atan2(neck(tr)[1]-P[1],tailLen(tr))*180/Math.PI),0,0]);
const headC=keys(tr=>{const q=state(tr);return [W[0],r3(q.hy+.15*q.H),r3(q.hz+.2*q.H)];});
const at=REL,base={at,life:LIFE};
const end=state(SHUT),bite=[W[0],r3(end.hy),r3(end.hz+.3*end.H)];
const grow=n=>keys(tr=>{const q=state(tr);return r3(tr<SHUT?n*(q.H/HMAX):0);});
// rim points on the skull (head units, hinge space) for v1 smoke streams: evenly spaced along the crest line
const rimPts=[...Array(8)].map((_,i)=>{const z=lerp(.45,-.55,i/7);const p=headPt(z,Math.PI/2+(i%2?.35:-.35),1);return toHinge(p);});
const rimKeys=p=>keys(tr=>{const q=state(tr),a=q.open*.62*Math.PI/180,y=p[1]*Math.cos(a)+p[2]*Math.sin(a),z=p[2]*Math.cos(a)-p[1]*Math.sin(a);return [r3(W[0]+p[0]*q.H),r3(q.hy+y*q.H),r3(q.hz+z*q.H)];});

const BLACK={mat:'black'},MIDC='#141419',CLOTHC='#101015';
function bodyLayers(tex){   // shape layers shared by all versions; tex picks the surface pieces
  const L=[
    {id:'tail',t:'mesh',shape:'model',model:'dark_ab_tail',...BLACK,...base,pos:tailPos,scale:tailScale,rot:tailRot,op:fadeOut},
    {id:'hem',t:'mesh',shape:'model',model:'dark_ab_hem',...BLACK,...base,pos:tailPos,scale:tailScale,rot:tailRot,op:fadeOut},
    {id:'lower',t:'mesh',shape:'model',model:'dark_ab_lower',...BLACK,...base,pos,scale,rot:rotLow,op:fadeOut},
    {id:'teeth_lower',t:'mesh',shape:'model',model:'dark_ab_teeth_lower',...BLACK,...base,pos,scale,rot:rotLow,op:fadeOut},
    {id:'upper',t:'mesh',shape:'model',model:'dark_ab_upper',...BLACK,...base,pos,scale,rot:rotUp,op:fadeOut},
    {id:'teeth_upper',t:'mesh',shape:'model',model:'dark_ab_teeth_upper',...BLACK,...base,pos,scale,rot:rotUp,op:fadeOut},
    {id:'crest',t:'mesh',shape:'model',model:'dark_ab_crest',...BLACK,...base,pos,scale,rot:rotUp,op:fadeOut}];
  if(tex.strands)L.push(
    {id:'strands_upper',t:'mesh',shape:'model',model:'dark_ab_strands_upper',mat:'black',col:MIDC,...base,pos,scale,rot:rotUp,op:fadeOut},
    {id:'strands_lower',t:'mesh',shape:'model',model:'dark_ab_strands_lower',mat:'black',col:MIDC,...base,pos,scale,rot:rotLow,op:fadeOut});
  if(tex.cloth)L.push({id:'cloth',t:'mesh',shape:'model',model:'dark_ab_cloth',mat:'black',col:CLOTHC,...base,pos:tailPos,scale:tailScale,rot:tailRot,op:fadeOut});
  return L;
}
const stage=[{id:'anchor',t:'mesh',shape:'disc',mat:'black',op:0,at:0,life:2.7},{id:'stage',t:'code',fn:'studio_darkness_ult',at:0,life:2.7,args:{layer:'anchor'}}];
const portalFx=[
  {id:'portal_disc',t:'mesh',shape:'disc',mat:'black',at:.78,life:.82,pos:P,rot:[90,0,0],scale:{'0':.02,'0.25':PR*.92,'0.75':PR*.95,'1':PR*.3,ease:'out'},op:{'0':0,'0.2':.55,'0.7':.45,'1':0}},
  {id:'portal',t:'mesh',shape:'model',model:'dark_ab_portal',mat:'black',col:'#0c0c10',at:.75,life:.85,pos:P,spin:0,rot:{'0':[0,0,0],'1':[0,0,-160]},scale:{'0':.05,'0.3':PR,'0.7':PR*1.05,'1':PR*.2,ease:'out'},op:{'0':0,'0.15':.9,'0.72':.85,'1':0}},
  {id:'portal_ink',t:'emit',at:.75,life:.35,burst:0,rate:120,from:'ring',fr:PR,pos:P,dir:'in',speed:[2,5],plife:[.15,.3],look:'smoke',size:[6,12],grow:-.4,col:'#000000',c2:'#000000',gravity:0,drag:1}];
const charge=[
  {id:'charge_orb',t:'mesh',shape:'sphere',mat:'black',at:.20,life:.82,pos:[.21,.9,-.21],scale:{'0':.03,'0.85':.17,'1':.2,ease:'in'},op:1},
  {id:'charge_ink',t:'emit',at:.20,life:.78,burst:0,rate:{'0':12,'1':40},from:'sphere',fr:.7,pos:[.21,.9,-.21],dir:'in',speed:[1.2,2.2],plife:[.18,.3],look:'smoke',size:[1,2],grow:-.8,col:'#000000',c2:'#000000',gravity:0,drag:1,spin:5}];
const biteFx=(smokeFb)=>[
  {id:'bite_shards',t:'emit',at:REL+SHUT,life:.05,burst:80,pos:bite,from:'sphere',fr:4,dir:'out',speed:[6,15],up:2,plife:[.3,.6],look:'model',model:'dark_ab_shard',mmat:'solid',msize:[.4,1.2],col:'#030304',c2:'#000000',gravity:5,drag:1.5,bounce:0,mspin:540},
  {id:'bite_smoke',t:'emit',at:REL+SHUT,life:.05,burst:40,pos:bite,from:'sphere',fr:3.5,dir:'out',speed:[3,8],plife:[.18,.35],look:'smoke',...(smokeFb?{fb:smokeFb}:{}),size:[14,26],grow:1.2,col:'#000000',c2:'#000000',gravity:-.3,drag:3},
  // fade-out: the whole body breaks into many drifting particles while the shape fades
  {id:'fade_head',t:'emit',at:REL+SHUT+.02,life:GONE-SHUT,burst:80,rate:200,from:'mesh',of:'upper',dir:'out',speed:[.6,2.4],up:.8,plife:[.35,.8],look:'model',model:'dark_ab_shard',mmat:'solid',msize:[.15,.5],col:'#030304',c2:'#000000',gravity:-.6,drag:2,bounce:0,mspin:360},
  {id:'fade_jaw',t:'emit',at:REL+SHUT+.02,life:GONE-SHUT,burst:60,rate:120,from:'mesh',of:'lower',dir:'out',speed:[.5,2],plife:[.35,.7],look:'model',model:'dark_ab_shard',mmat:'solid',msize:[.15,.45],col:'#030304',c2:'#000000',gravity:-.4,drag:2,bounce:0,mspin:360},
  {id:'fade_body',t:'emit',at:REL+SHUT+.02,life:GONE-SHUT,burst:80,rate:200,from:'mesh',of:'tail',dir:'out',speed:[.4,1.8],up:.5,plife:[.35,.8],look:'model',model:'dark_ab_shard',mmat:'solid',msize:[.12,.4],col:'#030304',c2:'#000000',gravity:-.5,drag:2,bounce:0,mspin:360},
  {id:'fade_body2',t:'emit',at:REL+SHUT+.05,life:GONE-SHUT,burst:60,rate:150,from:'mesh',of:'hem',dir:'down',speed:[.3,1.4],plife:[.35,.7],look:'model',model:'dark_ab_shard',mmat:'solid',msize:[.12,.35],col:'#030304',c2:'#000000',gravity:-.3,drag:2,bounce:0,mspin:360},
  {id:'fade_dust',t:'emit',at:REL+SHUT+.02,life:GONE-SHUT,burst:0,rate:200,from:'mesh',of:'upper',dir:'out',speed:[.3,1.2],up:.6,plife:[.3,.6],look:'smoke',size:[4,9],grow:.4,col:'#000000',c2:'#000000',gravity:-.6,drag:2}];
const write=(name,desc,layers)=>writeFileSync(`assets/fx/darkness/${name}.fx.json`,JSON.stringify({v:1,desc,tags:['darkness','preview','ult'],pal:'arcane',dur:2.7,seed:11,layers},null,1)+'\n');

// v1 (agreed): texture mix (ink strands on the head, cloth plates on the body) + flowing smoke streams
// that leave evenly spaced rim points, trail back, rise a little and curl (no random puffs)
write('ult_v1','Darkness อัลติ แบบ 1 (ที่ตกลง): หัวเส้นหมึก ตัวผ้าซ้อน ออร่าเป็นสายควันไหลจากขอบตัว',[...stage,...portalFx,...charge,...bodyLayers({strands:true,cloth:true}),
  ...rimPts.map((p,i)=>({id:'stream'+i,t:'emit',at,life:SHUT,burst:0,rate:grow(70-i*4),pos:rimKeys(p),from:'point',dir:'up',spread:.25,speed:[.4,1],plife:[.35,.6],look:'smoke',size:[lerp(10,5,i/7),lerp(16,8,i/7)],grow:.9,col:'#000000',c2:'#000000',gravity:-.9,drag:1.5,curl:true})),
  {id:'hem_streams',t:'emit',at,life:SHUT,burst:0,rate:grow(90),from:'mesh',of:'hem',dir:'down',speed:[.2,.7],plife:[.3,.5],look:'smoke',size:[5,9],grow:.6,col:'#000000',c2:'#000000',gravity:-.2,drag:2,curl:true},
  {id:'ribbons',t:'emit',at,life:SHUT,burst:0,rate:grow(40),from:'mesh',of:'tail',dir:'out',speed:[.5,1.5],plife:[.25,.45],look:'model',model:'dark_ab_ribbon',mmat:'solid',msize:[1.2,2.6],col:'#030304',c2:'#000000',gravity:-.3,drag:2,bounce:0,mspin:60},
  ...biteFx()]);
// v2: boiling-smoke skin (toon smoke puffs bubbling from the whole surface) + ink tendrils peeling off
write('ult_v2','Darkness อัลติ แบบ 2: ผิวควันเดือด ออร่าเป็นเส้นเงายาวหลุดออกจากตัว',[...stage,...portalFx,...charge,...bodyLayers({}),
  {id:'boil_upper',t:'emit',at,life:SHUT,burst:0,rate:grow(180),from:'mesh',of:'upper',dir:'out',speed:[.3,1],plife:[.2,.36],look:'smoke',fb:'tex/smoke_toon',size:[14,26],grow:.5,col:'#000000',c2:'#000000',gravity:-.2,drag:3},
  {id:'boil_tail',t:'emit',at,life:SHUT,burst:0,rate:grow(170),from:'mesh',of:'tail',dir:'out',speed:[.3,.9],plife:[.2,.34],look:'smoke',fb:'tex/smoke_toon',size:[10,20],grow:.4,col:'#000000',c2:'#000000',gravity:-.2,drag:3},
  {id:'tendrils',t:'emit',at,life:SHUT,burst:0,rate:grow(120),from:'mesh',of:'upper',dir:'out',speed:[1.5,3.5],up:.6,plife:[.3,.55],look:'model',model:'dark_ab_wisp',mmat:'solid',msize:[1.2,3],col:'#020203',c2:'#000000',gravity:-.6,drag:1.6,bounce:0,mspin:80},
  {id:'tendrils_tail',t:'emit',at,life:SHUT,burst:0,rate:grow(90),from:'mesh',of:'tail',dir:'out',speed:[1,2.5],plife:[.3,.5],look:'model',model:'dark_ab_wisp',mmat:'solid',msize:[.8,2],col:'#020203',c2:'#000000',gravity:-.4,drag:1.8,bounce:0,mspin:80},
  ...biteFx('tex/smoke_toon')]);
// v3: ink strands over everything + heavy dark fog that drags behind; rear body breaks into shards
write('ult_v3','Darkness อัลติ แบบ 3: เส้นหมึกทั้งตัว ออร่าเป็นหมอกดำลากหนา ท้ายตัวแตกเป็นเศษ',[...stage,...portalFx,...charge,...bodyLayers({strands:true}),
  {id:'fog_head',t:'emit',at,life:SHUT,burst:0,rate:grow(75),from:'mesh',of:'upper',dir:'out',speed:[.4,1.4],plife:[.35,.6],look:'smoke',size:[26,44],grow:1,col:'#000000',c2:'#000000',gravity:-.3,drag:2},
  {id:'fog_tail',t:'emit',at,life:SHUT,burst:0,rate:grow(80),from:'mesh',of:'tail',dir:'out',speed:[.3,1],plife:[.4,.7],look:'smoke',size:[20,38],grow:1,col:'#000000',c2:'#000000',gravity:-.2,drag:2},
  {id:'break_tail',t:'emit',at,life:SHUT,burst:0,rate:grow(150),from:'mesh',of:'tail',dir:'out',speed:[.5,2],plife:[.3,.55],look:'model',model:'dark_ab_shard',mmat:'solid',msize:[.3,.9],col:'#030304',c2:'#000000',gravity:.5,drag:2,bounce:0,mspin:300},
  ...biteFx()]);
console.log('ok bite',r3(REL+SHUT),'H',HMAX,'rim',rimPts.length);
