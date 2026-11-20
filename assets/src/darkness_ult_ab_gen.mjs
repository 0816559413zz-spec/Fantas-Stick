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
// spike with a real 4-point base sunk into the surface (so it grows out of the skin, not floating)
function rootedSpike(v,f,base4,tip){const n=v.length;v.push(...base4.map(q=>q.map(r3)),tip.map(r3));
  for(const [a,b] of [[0,1],[1,2],[2,3],[3,0]]){f.push([n+a,n+b,n+4]);f.push([n+b,n+a,n+4]);}f.push([n,n+1,n+2,n+3]);f.push([n+3,n+2,n+1,n]);}
function crest(){   // A: torn blades growing out of the visible skull (front of the join), more on the crown
  const v=[],f=[];seed(41);
  const sunk=(z,ph)=>{const p=headPt(z,ph,1),m=yMid(z),c=[0,m+(yTop(z)-m)*.35,z];return [lerp(c[0],p[0],.96),lerp(c[1],p[1],.96),p[2]];};
  for(let i=0;i<44;i++){const z=lerp(-.02,.55,Math.pow(rnd(),.8)),ph=lerp(.75,2.39,rnd()),dz=.025+.03*rnd(),dp=.06+.06*rnd();
    const s0=headPt(z,ph,1),m=yMid(z),out=[s0[0],s0[1]-(m+(yTop(z)-m)*.35),0],ol=Math.hypot(out[0],out[1])||1;
    const len=lerp(.08,.34,rnd())*(1-.45*Math.abs(ph-Math.PI/2))*(1-.4*Math.max(0,z-.35)/.2);
    const tip=[s0[0]+out[0]/ol*len,s0[1]+out[1]/ol*len,s0[2]-len*.9];
    rootedSpike(v,f,[sunk(z-dz,ph-dp),sunk(z-dz,ph+dp),sunk(z+dz,ph+dp),sunk(z+dz,ph-dp)].map(toHinge),toHinge(tip));}
  return {id:'crest',k:'poly',v,f,sub:0};
}
function tailSpikes(){   // dorsal blades and shapes along the body back, rooted in the skin
  const v=[],f=[];seed(97);
  const P2=(u,ph,k=1)=>{const r=tailRad(u,ph)*k;return [Math.cos(ph)*r*.55,Math.sin(ph)*r*.47,-u];};
  for(let i=0;i<70;i++){const u=lerp(.0,.75,Math.pow(rnd(),1.3)),ph=lerp(.55,2.6,rnd()),du=.008+.012*rnd(),dp=.07+.07*rnd();
    const s0=P2(u,ph),r=tailRad(u,ph),len=lerp(.10,.38,rnd())*r*(1-.5*Math.abs(ph-Math.PI/2))*(1-u*.6);
    const out=[Math.cos(ph),Math.sin(ph)];
    const tip=[s0[0]+out[0]*len*.55,s0[1]+out[1]*len*.47*1.6,s0[2]-du*1.5];
    rootedSpike(v,f,[P2(u-du,ph-dp,.97),P2(u-du,ph+dp,.97),P2(u+du,ph+dp,.97),P2(u+du,ph-dp,.97)],tip);}
  return {id:'spikes',k:'poly',v,f,sub:0};
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
const tailR=u=>(TIP+(1-TIP)*Math.pow(1-u,1.25))*(1+.30*Math.sin(Math.PI*Math.min(1,u*1.7)));   // u 0 = head join (same size as the skull) .. swells behind the head .. 1 hand
// rough skin on the body (user: middle -> base was a smooth cone): lumps, folds and ridges, strongest mid-body
const tailRough=(u,ph)=>{const a=.25+.75*Math.sin(Math.PI*Math.min(1,u*1.15));
  return 1+a*(.13*Math.sin(ph*5+u*23)+.09*Math.sin(ph*9-u*41+1.3)+.07*Math.sin(ph*3+u*67+.7)+.05*Math.sin(ph*13+u*15))+.06*a*Math.sin(u*90);};
const tailRad=(u,ph)=>tailR(u)*tailRough(u,ph);
function tail(){
  const SEG=64,NP=48,v=[],f=[];
  for(let i=0;i<=SEG;i++){const u=i/SEG;
    for(let j=0;j<NP;j++){const ph=2*Math.PI*j/NP,r=tailRad(u,ph);v.push([r3(Math.cos(ph)*r*.55),r3(Math.sin(ph)*r*.47),r3(-u)]);
      if(i<SEG){const a=i*NP+j,b=a+NP,a1=i*NP+(j+1)%NP,b1=a1+NP;f.push([a,a1,b1,b]);}}}
  return {id:'tail',k:'poly',v,f,sub:0};
}
function hem(){   // B: torn cloth flaps hanging from the underside and sides, swept back
  const v=[],f=[];seed(61);
  for(let i=0;i<34;i++){const u=lerp(.02,.85,rnd()),ph=lerp(Math.PI*1.15,Math.PI*1.85,rnd()),r=tailRad(u,ph);
    const b=[Math.cos(ph)*r*.55,Math.sin(ph)*r*.47,-u],len=lerp(.10,.30,rnd())*r*1.6,wid=.035+.04*rnd();
    spike(v,f,b.map(r3),[0,0,wid],[b[0]*1.1,b[1]-len,b[2]-wid*2.2].map(r3));}
  return {id:'hem',k:'poly',v,f,sub:0};
}
function cloth(){   // texture: overlapping torn cloth plates on the body, edges peel back
  const v=[],f=[];seed(71);
  for(let i=0;i<70;i++){const u=lerp(.0,.9,rnd()),ph=lerp(.15,Math.PI*2-.15,rnd()),r=tailRad(u,ph)*1.015;
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
function tailStrands(){   // texture on the body top: ink strands running back along the cloak
  const v=[],f=[];seed(91);
  for(let k=0;k<80;k++){const ph=lerp(.12,Math.PI-.12,rnd()),w=.008+.02*rnd(),u0=rnd()*.25,u1=lerp(.55,.95,rnd()),wob=rnd()*6;
    const SEG=18,b=v.length;
    for(let i=0;i<=SEG;i++){const t=i/SEG,u=lerp(u0,u1,t),a=ph+.05*Math.sin(t*6+wob),r=tailRad(u,a)*1.012,ww=w*(1-t*.6);
      const c=[Math.cos(a)*r*.55,Math.sin(a)*r*.47],d=[-Math.sin(a)*.55,Math.cos(a)*.47],l=Math.hypot(...d);
      v.push([r3(c[0]-d[0]/l*ww),r3(c[1]-d[1]/l*ww),r3(-u)],[r3(c[0]+d[0]/l*ww),r3(c[1]+d[1]/l*ww),r3(-u)]);
      if(i<SEG){const q=b+i*2;f.push([q,q+1,q+3,q+2]);f.push([q,q+2,q+3,q+1]);}}}
  return {id:'strands',k:'poly',v,f,sub:0};
}
model('dark_ab_tail_strands','Darkness อัลติ A+B เส้นหมึกบนหลังตัว',[tailStrands()]);
model('dark_ab_tail_spikes','Darkness อัลติ A+B หนามบนหลังตัว',[tailSpikes()]);
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
// Shadow rift (user: not a literal magic circle): an irregular tear in the air. Void = ragged black hole,
// rim = jagged torn edge, tendrils = ink strands curling out and back around the edge.
const riftR=th=>1+.16*Math.sin(th*3+.4)+.10*Math.sin(th*7+1.9)+.06*Math.sin(th*13+.8);   // uneven outline, taller than wide below
function riftVoid(){const v=[[0,0,0]],f=[],N=72;
  for(let i=0;i<N;i++){const th=i/N*Math.PI*2,r=riftR(th)*(i%2?.93:1);v.push([r3(Math.cos(th)*r*.82),r3(Math.sin(th)*r*1.08),0]);}
  for(let i=0;i<N;i++){f.push([0,1+i,1+(i+1)%N]);f.push([0,1+(i+1)%N,1+i]);}
  return {id:'void',k:'poly',v,f,sub:0};}
function riftEdge(){const v=[],f=[];seed(83);
  const tri=(a,b,c)=>{const n=v.length;v.push(...[a,b,c].map(q=>q.map(r3)));f.push([n,n+1,n+2]);f.push([n+2,n+1,n]);};
  const P3=(th,k)=>{const r=riftR(th)*k;return [Math.cos(th)*r*.82,Math.sin(th)*r*1.08,0];};
  for(let i=0;i<54;i++){const th=rnd()*Math.PI*2,w=.03+.05*rnd(),len=.12+.42*rnd()*(rnd()<.2?1.8:1),curl=(rnd()-.5)*.9;   // torn shards, some long
    const tip=P3(th+curl*.25,1+len);tip[2]=-.04*rnd();tri(P3(th-w,.97),P3(th+w,.97),tip);}
  for(let k=0;k<22;k++){const th0=rnd()*Math.PI*2,dir=rnd()<.5?1:-1,L=.5+.7*rnd(),S=12,w0=.035+.03*rnd();   // curling tendrils
    for(let i=0;i<S;i++){const t0=i/S,t1=(i+1)/S;
      const pt=t=>{const th=th0+dir*t*L,k2=1+.05+t*(.35+.25*Math.sin(t*3+k));const p=P3(th,k2);p[2]=-t*.15;return p;};
      const a0=pt(t0),a1=pt(t1),w=w0*(1-t0),n=[-(a1[1]-a0[1]),a1[0]-a0[0]],l=Math.hypot(...n)||1;
      const q=v.length;v.push(...[[a0[0]-n[0]/l*w,a0[1]-n[1]/l*w,a0[2]],[a0[0]+n[0]/l*w,a0[1]+n[1]/l*w,a0[2]],[a1[0]+n[0]/l*w*.8,a1[1]+n[1]/l*w*.8,a1[2]],[a1[0]-n[0]/l*w*.8,a1[1]-n[1]/l*w*.8,a1[2]]].map(p=>p.map(r3)));
      f.push([q,q+1,q+2,q+3]);f.push([q+3,q+2,q+1,q]);}}
  return {id:'edge',k:'poly',v,f,sub:0};}
function riftWall(){
  const v=[],f=[],segments=72;
  const profile=[[.88,.51],[1.13,.30],[1.17,-.12],[.98,-.73],[.70,-.73],[.77,-.20]];
  profile.forEach(([radius,depth],band)=>{
    for(let i=0;i<segments;i++){
      const th=i/segments*Math.PI*2;
      const r=riftR(th)*(radius+.035*Math.sin(17*th+band*.72));
      v.push([r3(Math.cos(th)*r*.82),r3(Math.sin(th)*r*1.08),r3(depth+.1*Math.sin(5*th+band*.41))]);
      const next=(i+1)%segments,back=((band+1)%profile.length)*segments;
      const a=band*segments+i,b=band*segments+next,c=back+next,d=back+i;
      f.push([a,b,c,d],[d,c,b,a]);
    }
  });
  return {id:'wall',k:'poly',v,f,sub:0};
}
model('dark_ab_rift_void','Darkness อัลติ รอยฉีกเงา: หลุมดำทรงไม่สม่ำเสมอ',[riftVoid()]);
model('dark_ab_rift_edge','Darkness อัลติ รอยฉีกเงา: ขอบฉีกและหนวดหมึกม้วน',[riftEdge()]);
model('dark_ab_rift_wall','Darkness อัลติ ผนังประตูเงา',[riftWall()]);
model('dark_ab_ribbon','Darkness อัลติ A+B ริ้วผ้าสะบัด',[ribbon]);

// ---------- timeline ----------
const REL=1.0,LIFE=1.45,TRAVEL=1.05,HOLD=1.05,SHUT=1.075,GONE=1.35;   // bites the moment it slows (no wait), 0.025 s bite
const W=[.31,.85,1.65];            // left hand at full thrust (studio stage)
const HMAX=8.6,RANGE=40,WX=1.4,WXH=1.2,TY=1.15;   // tail front matches the skull's widest section so head and body read as one shape
const P=[W[0],2.7,W[2]+1.4],PR=3.3;   // shadow portal in front of the hand: the creature comes out of it
const OPMAX=.93;                    // mostly opaque: you should not see the other side through it (user)
function state(tr){
  const x=Math.min(1,tr/TRAVEL),out4=1-(1-x)**4,out3=1-(1-x)**3;
  const H=HMAX*(.45+.55*out3)+.25*ease(TRAVEL,HOLD,tr)+.3*ease(HOLD,SHUT,tr)*(1-ease(SHUT,SHUT+.08,tr));
  const front=P[2]+(RANGE-.8-P[2])*out3+.8*Math.min(1,Math.max(0,(tr-TRAVEL)/(SHUT-TRAVEL)));   // still moving as it slows, bites right away
  const hz=front-(Z1-HZ)*H;                        // hinge z
  const hy=Math.max(P[1],.15+.55*H);               // starts at the portal centre, chin above the floor
  const slam=Math.min(1,Math.max(0,(tr-HOLD)/(SHUT-HOLD)))**3;
  const open=tr<HOLD?8+68*out3:76*(1-slam);
  const nod=14*ease(HOLD,SHUT,tr);   // head dips down as it bites and stays down
  return {H,hz,hy,open,nod};
}
const keys=fn=>{const c={};for(let i=0;i<=104;i++){const k=i/104;c[String(r3(k))]=fn(k*LIFE);}return c;};
const pos=keys(tr=>{const q=state(tr);return [W[0],r3(q.hy),r3(q.hz)];});
const scale=keys(tr=>{const H=state(tr).H;return [r3(H*WXH),r3(H),r3(H)];});
const rotUp=keys(tr=>{const q=state(tr);return [r3(q.open*.62-q.nod),0,0];}),rotLow=keys(tr=>{const q=state(tr);return [r3(-q.open*.38-q.nod),0,0];});
const fadeOut=keys(tr=>r3(OPMAX*ease(0,.06,tr)*(1-ease(SHUT+.04,GONE,tr))));
const JOINZ=0;   // body starts at the skull's widest section (head z=0), the back half of the head sits inside it
const neck=tr=>{const q=state(tr);return [W[0],q.hy+((yTop(JOINZ)+yBot(JOINZ))/2-yMid(HZ))*q.H,q.hz+(JOINZ-HZ)*q.H];};
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
    {id:'tail_spikes',t:'mesh',shape:'model',model:'dark_ab_tail_spikes',...BLACK,...base,pos:tailPos,scale:tailScale,rot:tailRot,op:fadeOut},
    {id:'hem',t:'mesh',shape:'model',model:'dark_ab_hem',...BLACK,...base,pos:tailPos,scale:tailScale,rot:tailRot,op:fadeOut},
    {id:'lower',t:'mesh',shape:'model',model:'dark_ab_lower',...BLACK,...base,pos,scale,rot:rotLow,op:fadeOut},
    {id:'teeth_lower',t:'mesh',shape:'model',model:'dark_ab_teeth_lower',...BLACK,...base,pos,scale,rot:rotLow,op:fadeOut},
    {id:'upper',t:'mesh',shape:'model',model:'dark_ab_upper',...BLACK,...base,pos,scale,rot:rotUp,op:fadeOut},
    {id:'teeth_upper',t:'mesh',shape:'model',model:'dark_ab_teeth_upper',...BLACK,...base,pos,scale,rot:rotUp,op:fadeOut},
    {id:'crest',t:'mesh',shape:'model',model:'dark_ab_crest',...BLACK,...base,pos,scale,rot:rotUp,op:fadeOut}];
  if(tex.strands)L.push(
    {id:'strands_body',t:'mesh',shape:'model',model:'dark_ab_tail_strands',mat:'black',col:MIDC,...base,pos:tailPos,scale:tailScale,rot:tailRot,op:fadeOut},
    {id:'strands_upper',t:'mesh',shape:'model',model:'dark_ab_strands_upper',mat:'black',col:MIDC,...base,pos,scale,rot:rotUp,op:fadeOut},
    {id:'strands_lower',t:'mesh',shape:'model',model:'dark_ab_strands_lower',mat:'black',col:MIDC,...base,pos,scale,rot:rotLow,op:fadeOut});
  if(tex.cloth)L.push({id:'cloth',t:'mesh',shape:'model',model:'dark_ab_cloth',mat:'black',col:CLOTHC,...base,pos:tailPos,scale:tailScale,rot:tailRot,op:fadeOut});
  return L;
}
const stage=[{id:'anchor',t:'mesh',shape:'disc',mat:'black',op:0,at:0,life:2.7},{id:'stage',t:'code',fn:'studio_darkness_ult',at:0,life:2.7,args:{layer:'anchor'}}];
const PLIFE=REL+HOLD-.05-.75;   // portal stays open while the monster travels, closes just before the bite (user)
const portalFx=[
  // shadow rift (user: like opening a portal from another dimension; make it better and moving)
  {id:'rift_void',t:'mesh',shape:'model',model:'dark_ab_rift_void',mat:'black',at:.76,life:PLIFE-.02,pos:P,rot:{'0':[0,0,0],'1':[0,0,25]},scale:{'0':[PR*.05,PR*0.9,1],'0.1':[PR*0.7,PR*1,1],'0.16':[PR*1*0.96,PR*1*1.04,1],'0.28':[PR*1*1.05,PR*1*0.97,1],'0.4':[PR*1*0.96,PR*1*1.04,1],'0.52':[PR*1*1.05,PR*1*0.97,1],'0.64':[PR*1*0.96,PR*1*1.04,1],'0.76':[PR*1*1.05,PR*1*0.97,1],'0.88':[PR*1*0.96,PR*1*1.04,1],'1':[PR*.05,PR*0.6,1]},op:{'0':0,'0.05':1,'0.95':1,'1':0}},
  {id:'rift_tunnel1',t:'mesh',shape:'model',model:'dark_ab_rift_edge',mat:'black',col:'#17171e',at:.8,life:PLIFE-.06,pos:[P[0],P[1],P[2]+.25],rot:{'0':[0,0,0],'1':[0,0,140]},scale:{'0':[PR*.05,PR*0.648,1],'0.1':[PR*0.504,PR*0.72,1],'0.16':[PR*0.72*0.96,PR*0.72*1.04,1],'0.28':[PR*0.72*1.05,PR*0.72*0.97,1],'0.4':[PR*0.72*0.96,PR*0.72*1.04,1],'0.52':[PR*0.72*1.05,PR*0.72*0.97,1],'0.64':[PR*0.72*0.96,PR*0.72*1.04,1],'0.76':[PR*0.72*1.05,PR*0.72*0.97,1],'0.88':[PR*0.72*0.96,PR*0.72*1.04,1],'1':[PR*.05,PR*0.432,1]},op:{'0':0,'0.05':1,'0.95':1,'1':0}},
  {id:'rift_tunnel2',t:'mesh',shape:'model',model:'dark_ab_rift_edge',mat:'black',col:'#22222b',at:.82,life:PLIFE-.08,pos:[P[0],P[1],P[2]+.5],rot:{'0':[0,180,0],'1':[0,180,-200]},scale:{'0':[PR*.05,PR*0.432,1],'0.1':[PR*0.33599999999999997,PR*0.48,1],'0.16':[PR*0.48*0.96,PR*0.48*1.04,1],'0.28':[PR*0.48*1.05,PR*0.48*0.97,1],'0.4':[PR*0.48*0.96,PR*0.48*1.04,1],'0.52':[PR*0.48*1.05,PR*0.48*0.97,1],'0.64':[PR*0.48*0.96,PR*0.48*1.04,1],'0.76':[PR*0.48*1.05,PR*0.48*0.97,1],'0.88':[PR*0.48*0.96,PR*0.48*1.04,1],'1':[PR*.05,PR*0.288,1]},op:{'0':0,'0.05':1,'0.95':1,'1':0}},
  {id:'rift_tunnel3',t:'mesh',shape:'model',model:'dark_ab_rift_edge',mat:'black',col:'#30303b',at:.84,life:PLIFE-.1,pos:[P[0],P[1],P[2]+.75],rot:{'0':[0,0,0],'1':[0,0,280]},scale:{'0':[PR*.05,PR*0.25200000000000006,1],'0.1':[PR*0.196,PR*0.28,1],'0.16':[PR*0.28*0.96,PR*0.28*1.04,1],'0.28':[PR*0.28*1.05,PR*0.28*0.97,1],'0.4':[PR*0.28*0.96,PR*0.28*1.04,1],'0.52':[PR*0.28*1.05,PR*0.28*0.97,1],'0.64':[PR*0.28*0.96,PR*0.28*1.04,1],'0.76':[PR*0.28*1.05,PR*0.28*0.97,1],'0.88':[PR*0.28*0.96,PR*0.28*1.04,1],'1':[PR*.05,PR*0.168,1]},op:{'0':0,'0.05':1,'0.95':1,'1':0}},
  {id:'rift_edge',t:'mesh',shape:'model',model:'dark_ab_rift_edge',mat:'black',col:'#0b0b0f',at:.75,life:PLIFE,pos:P,rot:{'0':[0,0,0],'1':[0,0,-70]},scale:{'0':[PR*.05,PR*0.936,1],'0.1':[PR*0.728,PR*1.04,1],'0.16':[PR*1.04*0.96,PR*1.04*1.04,1],'0.28':[PR*1.04*1.05,PR*1.04*0.97,1],'0.4':[PR*1.04*0.96,PR*1.04*1.04,1],'0.52':[PR*1.04*1.05,PR*1.04*0.97,1],'0.64':[PR*1.04*0.96,PR*1.04*1.04,1],'0.76':[PR*1.04*1.05,PR*1.04*0.97,1],'0.88':[PR*1.04*0.96,PR*1.04*1.04,1],'1':[PR*.05,PR*0.624,1]},op:{'0':0,'0.05':1,'0.95':1,'1':0}},
  {id:'rift_edge2',t:'mesh',shape:'model',model:'dark_ab_rift_edge',mat:'black',col:'#16161c',at:.8,life:PLIFE-.05,pos:P,rot:{'0':[0,180,20],'1':[0,180,110]},scale:{'0':[PR*.05,PR*0.864,1],'0.1':[PR*0.6719999999999999,PR*0.96,1],'0.16':[PR*0.96*0.96,PR*0.96*1.04,1],'0.28':[PR*0.96*1.05,PR*0.96*0.97,1],'0.4':[PR*0.96*0.96,PR*0.96*1.04,1],'0.52':[PR*0.96*1.05,PR*0.96*0.97,1],'0.64':[PR*0.96*0.96,PR*0.96*1.04,1],'0.76':[PR*0.96*1.05,PR*0.96*0.97,1],'0.88':[PR*0.96*0.96,PR*0.96*1.04,1],'1':[PR*.05,PR*0.576,1]},op:{'0':0,'0.05':1,'0.95':1,'1':0}},
  {id:'rift_wisps',t:'emit',at:.85,life:PLIFE-.2,burst:0,rate:70,from:'ring',fr:PR*1.05,pos:P,dir:'out',speed:[.8,2.2],plife:[.35,.6],look:'model',model:'dark_ab_wisp',mmat:'solid',msize:[.4,1.1],col:'#030304',c2:'#000000',gravity:0,drag:2.5,bounce:0,mspin:160},
  {id:'rift_warp',t:'warp',kind:'bulge',at:.8,life:PLIFE-.05,pos:P,size:{'0':1,'0.15':PR*2.6,'0.85':PR*2.7,'1':1},str:{'0':0,'0.15':.9,'0.85':.9,'1':0},op:1,glow:0},
  {id:'portal_ink',t:'emit',at:.75,life:PLIFE*.9,burst:0,rate:90,from:'ring',fr:PR*.95,pos:P,dir:'in',speed:[1.5,3.5],plife:[.2,.35],look:'smoke',size:[5,10],grow:-.4,col:'#000000',c2:'#000000',gravity:0,drag:1}];
const charge=[
  {id:'charge_orb',t:'mesh',shape:'sphere',mat:'black',at:.20,life:.82,pos:[.21,.9,-.21],scale:{'0':.03,'0.85':.17,'1':.2,ease:'in'},op:1},
  {id:'charge_ink',t:'emit',at:.20,life:.78,burst:0,rate:{'0':12,'1':40},from:'sphere',fr:.7,pos:[.21,.9,-.21],dir:'in',speed:[1.2,2.2],plife:[.18,.3],look:'smoke',size:[1,2],grow:-.8,col:'#000000',c2:'#000000',gravity:0,drag:1,spin:5}];
const V3_TRAVEL=.775,V3_DUR=2.95;
const v3Time=t=>t<REL+TRAVEL?REL+(t-REL)*V3_TRAVEL/TRAVEL:t-TRAVEL+V3_TRAVEL;
function fasterMonster(layer){
  const at=v3Time(layer.at),life=v3Time(layer.at+layer.life)-at;
  const updated={...layer,at:r3(at),life:r3(life)};
  for(const field of ['pos','rot','scale','op','rate']){
    const value=layer[field];
    if(!value||typeof value!=='object'||Array.isArray(value))continue;
    updated[field]=Object.fromEntries(Object.entries(value).map(([key,frame])=>[
      String(r3((v3Time(layer.at+Number(key)*layer.life)-at)/life)),frame]));
  }
  return updated;
}
const GATE_START=.86,GATE_OPEN=.995,GATE_CLOSE=v3Time(REL+LIFE)+.02,GATE_END=GATE_CLOSE+.29;
function gateKeys(start,stops){
  return Object.fromEntries(stops.map(([t,value])=>[String(r3((t-start)/(GATE_END-start))),value]));
}
function gateMesh(id,model,col,delay,depth,size,turn,tilt=0){
  const at=r3(GATE_START+delay);
  const stops=[[at,.02,.88,.12],[at+.045,.46,.97,.56],[GATE_OPEN,1,1,1],
    [1.29,1.035,.98,1],[1.62,.985,1.015,1],[1.96,1.025,.99,1],[GATE_CLOSE,1,1,1],
    [GATE_CLOSE+.14,.48,.93,.58],[GATE_END,.015,.62,.10]];
  return {id,t:'mesh',shape:'model',model,mat:'black',col,at,life:r3(GATE_END-at),
    pos:[P[0],P[1],P[2]+depth],
    rot:{'0':[0,0,tilt],'1':[0,0,tilt+turn]},
    scale:gateKeys(at,stops.map(([t,x,y,z])=>[t,[r3(PR*size*x),r3(PR*size*y),z]])),
    op:gateKeys(at,[[at,0],[at+.035,1],[GATE_CLOSE+.15,1],[GATE_END,0]])};
}
const v3Gate=[
  gateMesh('rift_void','dark_ab_rift_void','#030306',.012,-.76,.94,12),
  gateMesh('rift_wall','dark_ab_rift_wall','#191920',0,0,1,13),
  gateMesh('rift_tunnel1','dark_ab_rift_edge','#23232b',.025,-.42,.74,108),
  gateMesh('rift_tunnel2','dark_ab_rift_edge','#2b2b33',.034,-.61,.53,-137),
  gateMesh('rift_tunnel3','dark_ab_rift_edge','#32323d',.042,-.69,.32,158),
  gateMesh('rift_edge','dark_ab_rift_edge','#0b0b0f',0,.45,1.06,-56),
  gateMesh('rift_edge2','dark_ab_rift_edge','#14141b',.019,.28,.95,84,20),
  {...portalFx.find(layer=>layer.id==='rift_wisps'),at:.93,life:r3(GATE_CLOSE-.93)},
  {id:'rift_splashes',t:'emit',at:.925,life:r3(GATE_CLOSE-.925),burst:12,
    rate:{'0':18,'0.06':190,'0.13':16,'0.23':145,'0.29':8,'0.39':30,
      '0.46':196,'0.52':12,'0.65':165,'0.70':10,'0.82':28,'0.89':170,'1':0},
    from:'mesh',of:'rift_wall',dir:'random',speed:[3.6,8.2],up:[-.5,1.4],plife:[.20,.53],
    look:'model',model:'dark_ab_shard',mmat:'solid',msize:[.13,.39],col:'#1d1926',c2:'#050407',
    gravity:3.2,drag:2.1,bounce:0,mspin:470},
  {...portalFx.find(layer=>layer.id==='rift_warp'),at:GATE_START,life:r3(GATE_END-GATE_START),
    size:gateKeys(GATE_START,[[GATE_START,1],[GATE_OPEN,PR*2.6],[GATE_CLOSE,PR*2.7],[GATE_END,1]]),
    str:gateKeys(GATE_START,[[GATE_START,0],[GATE_OPEN,.9],[GATE_CLOSE,.9],[GATE_END,0]])},
  {...portalFx.find(layer=>layer.id==='portal_ink'),at:GATE_START,life:r3(GATE_CLOSE-GATE_START)}
];
const biteFx=(smokeFb)=>[
  {id:'bite_shards',t:'emit',at:REL+SHUT,life:.05,burst:80,pos:bite,from:'sphere',fr:4,dir:'out',speed:[6,15],up:2,plife:[.3,.6],look:'model',model:'dark_ab_shard',mmat:'solid',msize:[.4,1.2],col:'#030304',c2:'#000000',gravity:5,drag:1.5,bounce:0,mspin:540},
  {id:'bite_smoke',t:'emit',at:REL+SHUT,life:.05,burst:40,pos:bite,from:'sphere',fr:3.5,dir:'out',speed:[3,8],plife:[.18,.35],look:'smoke',...(smokeFb?{fb:smokeFb}:{}),size:[14,26],grow:1.2,col:'#000000',c2:'#000000',gravity:-.3,drag:3},
  // fade-out: the whole body breaks into many drifting particles while the shape fades
  {id:'fade_head',t:'emit',at:REL+SHUT+.02,life:GONE-SHUT,burst:80,rate:200,from:'mesh',of:'upper',dir:'out',speed:[.6,2.4],up:.8,plife:[.35,.8],look:'model',model:'dark_ab_shard',mmat:'solid',msize:[.15,.5],col:'#030304',c2:'#000000',gravity:-.6,drag:2,bounce:0,mspin:360},
  {id:'fade_jaw',t:'emit',at:REL+SHUT+.02,life:GONE-SHUT,burst:60,rate:120,from:'mesh',of:'lower',dir:'out',speed:[.5,2],plife:[.35,.7],look:'model',model:'dark_ab_shard',mmat:'solid',msize:[.15,.45],col:'#030304',c2:'#000000',gravity:-.4,drag:2,bounce:0,mspin:360},
  {id:'fade_body',t:'emit',at:REL+SHUT+.02,life:GONE-SHUT,burst:80,rate:200,from:'mesh',of:'tail',dir:'out',speed:[.4,1.8],up:.5,plife:[.35,.8],look:'model',model:'dark_ab_shard',mmat:'solid',msize:[.12,.4],col:'#030304',c2:'#000000',gravity:-.5,drag:2,bounce:0,mspin:360},
  {id:'fade_body2',t:'emit',at:REL+SHUT+.05,life:GONE-SHUT,burst:60,rate:150,from:'mesh',of:'hem',dir:'down',speed:[.3,1.4],plife:[.35,.7],look:'model',model:'dark_ab_shard',mmat:'solid',msize:[.12,.35],col:'#030304',c2:'#000000',gravity:-.3,drag:2,bounce:0,mspin:360},
  {id:'fade_dust',t:'emit',at:REL+SHUT+.02,life:GONE-SHUT,burst:0,rate:200,from:'mesh',of:'upper',dir:'out',speed:[.3,1.2],up:.6,plife:[.3,.6],look:'smoke',size:[4,9],grow:.4,col:'#000000',c2:'#000000',gravity:-.6,drag:2}];
const v3Burst={
  fade_head:{msize:[.14,.54],speed:[1.2,4.5]},
  fade_jaw:{burst:77,rate:185,msize:[.13,.45],speed:[1.1,4.0]},
  fade_body:{msize:[.12,.45],speed:[.9,3.9]},
  fade_body2:{burst:78,rate:195,msize:[.11,.37],speed:[.8,3.6]},
  fade_dust:{burst:36,size:[3,8]}
};
const v3Flecks=['upper','tail'].map((of,i)=>({
  id:'fade_flecks_'+of,t:'emit',at:r3(REL+SHUT+.055+i*.06),life:.21,burst:68,rate:160,
  from:'mesh',of,dir:'random',speed:[1.5,5],up:.5,plife:[.33,.68],look:'flake',
  size:[.85,2.4],col:'#130f1b',c2:'#030305',gravity:.6,drag:1.5,spin:8
}));
const write=(name,desc,layers,dur=2.7)=>writeFileSync(`assets/fx/darkness/${name}.fx.json`,JSON.stringify({v:1,desc,tags:['darkness','preview','ult'],pal:'arcane',dur,seed:11,layers},null,1)+'\n');

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
const v3Monster=[...bodyLayers({strands:true}),
  {id:'fog_head',t:'emit',at,life:SHUT,burst:0,rate:grow(75),from:'mesh',of:'upper',dir:'out',speed:[.4,1.4],plife:[.35,.6],look:'smoke',size:[26,44],grow:1,col:'#000000',c2:'#000000',gravity:-.3,drag:2},
  {id:'fog_tail',t:'emit',at,life:SHUT,burst:0,rate:grow(80),from:'mesh',of:'tail',dir:'out',speed:[.3,1],plife:[.4,.7],look:'smoke',size:[20,38],grow:1,col:'#000000',c2:'#000000',gravity:-.2,drag:2},
  {id:'break_tail',t:'emit',at,life:SHUT,burst:0,rate:grow(150),from:'mesh',of:'tail',dir:'out',speed:[.5,2],plife:[.3,.55],look:'model',model:'dark_ab_shard',mmat:'solid',msize:[.3,.9],col:'#030304',c2:'#000000',gravity:.5,drag:2,bounce:0,mspin:300},
  ...biteFx().map(layer=>({...layer,...v3Burst[layer.id]})),...v3Flecks];
write('ult_v3','Darkness อัลติ แบบ 3: ประตูเงาเปิดหลังยื่นมือและปิดหลังสัตว์เงาสลาย',[
  {...stage[0],life:V3_DUR},{...stage[1],life:V3_DUR,args:{...stage[1].args,thrustAt:.73,walkCancelAfter:.9,travel:V3_TRAVEL}},
  ...v3Gate,...charge.map(layer=>({...layer,life:.66})),...v3Monster.map(fasterMonster)],V3_DUR);
console.log('ok bite',r3(REL+SHUT),'H',HMAX,'rim',rimPts.length);
