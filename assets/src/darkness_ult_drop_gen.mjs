// Darkness ult "shadow drop" for VFX Studio (user design 2026-11-20). Run:
//   node assets/src/darkness_ult_drop_gen.mjs
// Writes assets/fx/mesh/dark_drop_*.mesh.json and assets/fx/darkness/ult_preview.fx.json.
// Shape: a teardrop lying on its side, thick tail at the left hand, round head forward. The head
// splits along a low plane (upper part bigger) so the front opens as a mouth with uneven teeth.
// Timing (user): very fast launch -> eases slow -> at range in 0.8 s -> hold, open a bit more ->
// hard fast bite (closes to a full drop) -> shatters.
import {writeFileSync} from 'node:fs';

const r3=n=>Math.round(n*1000)/1000;
const ease=(a,b,v)=>{const t=Math.min(1,Math.max(0,(v-a)/(b-a)));return t*t*(3-2*t);};
let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};

// ---------- head halves ----------
const RZ=1.15,HINGE=-.28,PIVZ=-.30;   // head ellipsoid (radius 1, length 1.15), split plane y, hinge z
function half(upper){
  const LAT=26,LON=40,v=[],uv=[],f=[];
  for(let i=0;i<=LAT;i++){
    const th=Math.PI*i/LAT;                 // 0 = front (+z), PI = back
    for(let j=0;j<=LON;j++){
      const ph=2*Math.PI*j/LON;
      let x=Math.sin(th)*Math.cos(ph),y=Math.sin(th)*Math.sin(ph),z=Math.cos(th)*RZ;
      if(upper)y=Math.max(y,HINGE);else y=Math.min(y,HINGE);   // flat mouth roof / floor
      v.push([r3(x),r3(y-HINGE),r3(z-PIVZ)]);                     // origin = hinge
      uv.push([r3(i/LAT*1.2),r3(j/LON)]);
      if(i<LAT&&j<LON){const a=i*(LON+1)+j,b=a+LON+1;f.push(upper?[a,b,b+1,a+1]:[a,a+1,b+1,b]);}
    }
  }
  return {id:upper?'upper':'lower',k:'poly',v,f,uv,sub:0};
}
// Uneven teeth on the front rim of the cut, pointing into the mouth (double-sided pyramids).
function teeth(upper){
  const v=[],f=[],rimR=Math.sqrt(1-HINGE*HINGE);
  let a=-74+rnd()*6;
  while(a<74){
    const ph=a*Math.PI/180,len=(upper?.16:.11)+(upper?.30:.20)*rnd(),wid=.035+.05*rnd();
    const bx=rimR*Math.sin(ph),bz=RZ*rimR*Math.cos(ph);
    const tx=-Math.cos(ph)*wid,tz=Math.sin(ph)*wid*RZ;   // along the rim
    const inward=.06+.08*rnd(),tip=[bx*(1-inward),(upper?-1:1)*len,(bz*(1-inward))];
    const n=v.length,base=[[bx-tx,0,bz-tz],[bx+tx,0,bz+tz],[bx*.9,0,bz*.9]];
    for(const p of [...base,tip])v.push([r3(p[0]),r3(p[1]),r3(p[2]-PIVZ)]);
    for(const [p,q,r] of [[0,1,3],[1,2,3],[2,0,3],[0,2,1]]){f.push([n+p,n+q,n+r]);f.push([n+p,n+r,n+q]);}
    a+=7+rnd()*14;                                        // uneven spacing
  }
  return {id:'teeth',k:'poly',v,f,sub:0};
}
// Tail: tapered body from the head back (z=0) to the hand (z=-1); radius ~ R*(TIP..1), drop-like curve.
function tail(){
  const SEG=30,LON=28,v=[],uv=[],f=[],TIP=.16;
  for(let i=0;i<=SEG;i++){
    const u=i/SEG,r=TIP+(1-TIP)*Math.pow(1-u,1.7);       // u=0 head, 1 hand
    for(let j=0;j<=LON;j++){
      const ph=2*Math.PI*j/LON;
      v.push([r3(Math.cos(ph)*r),r3(Math.sin(ph)*r*.92),r3(-u)]);
      uv.push([r3(u*3),r3(j/LON)]);
      if(i<SEG&&j<LON){const a=i*(LON+1)+j,b=a+LON+1;f.push([a,a+1,b+1,b]);}
    }
  }
  return {id:'tail',k:'poly',v,f,uv,sub:0};
}
const shard={id:'shard',k:'poly',sub:0,flat:true,v:[[0,.5,0],[.18,0,0],[0,0,.08],[-.18,0,0],[0,0,-.08],[0,-.35,0]],
  f:[[0,2,1],[0,3,2],[0,4,3],[0,1,4],[5,1,2],[5,2,3],[5,3,4],[5,4,1]]};
const model=(name,desc,mat,parts)=>writeFileSync(`assets/fx/mesh/${name}.mesh.json`,JSON.stringify({v:1,desc,mat,pal:'arcane',tags:['darkness','ult'],parts})+'\n');
model('dark_drop_upper','Darkness อัลติ หัวหยดน้ำส่วนบน (ใหญ่กว่า) จุดหมุน = บานพับปาก','energy',[half(true)]);
model('dark_drop_lower','Darkness อัลติ หัวหยดน้ำส่วนล่าง (เล็กกว่า)','energy',[half(false)]);
model('dark_drop_teeth_upper','Darkness อัลติ ฟันบน สูงต่ำ/ห่างไม่เท่ากัน','solid',[teeth(true)]);
model('dark_drop_teeth_lower','Darkness อัลติ ฟันล่าง','solid',[teeth(false)]);
model('dark_drop_tail','Darkness อัลติ หางหยดน้ำ (หัว z=0 → มือ z=-1)','energy',[tail()]);
model('dark_drop_wisp','Darkness อัลติ เงาเส้นยาวหลุดจากตัว','solid',[{id:'wisp',k:'poly',sub:0,flat:true,v:[[0,0,1.2],[.10,0,0],[0,.05,0],[-.10,0,0],[0,-.05,0],[0,0,-.35]],f:[[0,2,1],[0,3,2],[0,4,3],[0,1,4],[5,1,2],[5,2,3],[5,3,4],[5,4,1]]}]);
model('dark_drop_shard','Darkness อัลติ เศษเงาแหลม','solid',[shard]);

// ---------- timeline ----------
const REL=1.0,LIFE=1.3,TRAVEL=.80,HOLD=.95,SHUT=1.02,GONE=1.20;
const W=[.31,.85,1.65];            // left hand at full thrust (studio stage)
const RMAX=3.0,RANGE=30;   // core; the smoke shell adds ~1 m around it            // head ~7 m tall (4 people); front of the head reaches 600 = 30 m
function state(tr){
  const x=Math.min(1,tr/TRAVEL),out4=1-(1-x)**4,out3=1-(1-x)**3;
  const R=1.1+(RMAX-1.1)*out3   /* wide and big from the first frame (user) */+.12*ease(TRAVEL,HOLD,tr)+.15*ease(HOLD,SHUT,tr)*(1-ease(SHUT,SHUT+.08,tr));
  const cz=W[2]+(RANGE-RZ*RMAX-W[2])*out4+.3*ease(TRAVEL,HOLD,tr);
  const cy=W[1]+(.25+RMAX-W[1])*ease(0,.45,tr);
  const slam=Math.min(1,Math.max(0,(tr-HOLD)/(SHUT-HOLD)))**2.4;   // accelerating bite
  const open=tr<HOLD?6+40*out3+18*ease(TRAVEL,HOLD,tr):64*(1-slam);
  return {R,cz,cy,open};
}
const keys=fn=>{const c={};for(let i=0;i<=104;i++){const k=i/104;c[String(r3(k))]=fn(k*LIFE);}return c;};
const hinge=q=>[W[0],r3(q.cy+HINGE*q.R),r3(q.cz+PIVZ*q.R)];
const pos=keys(tr=>hinge(state(tr)));
const WX=2.3;   // much wider than tall (user: 'กว้างกว่านี้มาก'), still a drop from above
const scale=keys(tr=>{const R=state(tr).R;return [r3(R*WX),r3(R),r3(R)];});
const rotUp=keys(tr=>[r3(state(tr).open*.75),0,0]);     // upper lifts more
const rotLow=keys(tr=>[r3(-state(tr).open*.45),0,0]);
const dis=keys(tr=>r3(ease(SHUT+.01,GONE,tr)));
const op=keys(tr=>r3(ease(0,.03,tr)*(1-ease(SHUT+.01,GONE,tr))));
const teethOp=keys(tr=>r3(ease(0,.03,tr)*(1-ease(SHUT,SHUT+.08,tr))));
// tail from the head back to the hand
const tailPos=keys(tr=>{const q=state(tr);return [W[0],r3(q.cy),r3(q.cz-RZ*q.R*.85)];});
const tailLen=tr=>{const q=state(tr);return Math.max(.05,q.cz-RZ*q.R*.85-W[2]);};
const tailScale=keys(tr=>{const q=state(tr),back=1-ease(SHUT,GONE-.03,tr);return [r3(q.R*WX),r3(q.R),r3(tailLen(tr)*back)];});
const tailRot=keys(tr=>{const q=state(tr);return [r3(Math.atan2(q.cy-W[1],tailLen(tr))*180/Math.PI),0,0];});
const center=keys(tr=>{const q=state(tr);return [W[0],r3(q.cy),r3(q.cz)];});
const behind=keys(tr=>{const q=state(tr);return [W[0],r3(q.cy),r3(q.cz-RZ*q.R*1.1)];});   // smoke trails off the back
const smokeRate=keys(tr=>r3(tr<HOLD?30*(1-.5*ease(0,TRAVEL,tr)):tr<SHUT?10:0));
const massRate=(n)=>keys(tr=>{const q=state(tr);return r3(tr<SHUT?n*(.25+.75*q.R/RMAX):0);});   // body smoke grows with the head
const edgeRate=keys(tr=>r3(tr<SHUT?60:0));
const end=state(SHUT),bite=[W[0],r3(end.cy),r3(end.cz)];
const CH=[.21,.9,-.21];             // charging hand in front of the belly

const ink={mat:'black',int:3};   // pure black (the tex ink read grey on bright floors)
const at=REL;
const fx={
  v:1,
  desc:'Darkness — พรีวิวอัลติ สัตว์เงาทรงหยดน้ำ ออกจากมือซ้าย พุ่งเร็วแล้วช้าลง ค้าง อ้าเพิ่ม งับแรงที่ระยะ 600 แล้วแตกสลาย',
  tags:['darkness','preview','ult'],pal:'arcane',dur:2.7,seed:11,
  layers:[
    {id:'anchor',t:'mesh',shape:'disc',mat:'black',op:0,at:0,life:2.7},
    {id:'stage',t:'code',fn:'studio_darkness_ult',at:0,life:2.7,args:{layer:'anchor'}},
    {id:'charge_orb',t:'mesh',shape:'sphere',mat:'black',at:.20,life:.82,pos:CH,scale:{'0':.03,'0.85':.17,'1':.20,ease:'in'},op:1},
    {id:'charge_ink',t:'emit',at:.20,life:.78,burst:0,rate:{'0':12,'1':40},from:'sphere',fr:.7,pos:CH,dir:'in',speed:[1.2,2.2],plife:[.18,.3],look:'smoke',size:[1,2],grow:-.8,col:'#000000',c2:'#000000',gravity:0,drag:1,spin:5},
    {id:'tail',t:'mesh',shape:'model',model:'dark_drop_tail',...ink,at,life:LIFE,pos:tailPos,scale:tailScale,rot:tailRot,op},
    {id:'lower',t:'mesh',shape:'model',model:'dark_drop_lower',...ink,at,life:LIFE,pos,scale,rot:rotLow,op},
    {id:'teeth_lower',t:'mesh',shape:'model',model:'dark_drop_teeth_lower',mat:'black',int:3,at,life:LIFE,pos,scale,rot:rotLow,op:teethOp},
    {id:'upper',t:'mesh',shape:'model',model:'dark_drop_upper',...ink,at,life:LIFE,pos,scale,rot:rotUp,op},
    {id:'teeth_upper',t:'mesh',shape:'model',model:'dark_drop_teeth_upper',mat:'black',int:3,at,life:LIFE,pos,scale,rot:rotUp,op:teethOp},
    {id:'edge_shards',t:'emit',at,life:SHUT,burst:0,rate:edgeRate,pos:behind,from:'sphere',fr:2.2,dir:'random',speed:[.5,2],up:.5,plife:[.15,.3],look:'model',model:'dark_drop_shard',mmat:'solid',msize:[.25,.6],col:'#030304',c2:'#000000',gravity:0,drag:3,bounce:0,mspin:300},
    // smoke shell: the body reads as a big smoky shadow, not a clean drop
    {id:'mass_upper',t:'emit',at,life:SHUT,burst:0,rate:massRate(180),from:'mesh',of:'upper',dir:'out',speed:[.6,2.2],up:.4,plife:[.2,.42],look:'smoke',fb:'tex/smoke_toon',size:[14,28],grow:.7,col:'#000000',c2:'#000000',gravity:-.6,drag:2.5,spin:1.5},
    {id:'mass_lower',t:'emit',at,life:SHUT,burst:0,rate:massRate(110),from:'mesh',of:'lower',dir:'out',speed:[.5,1.8],plife:[.2,.4],look:'smoke',fb:'tex/smoke_toon',size:[12,22],grow:.6,col:'#000000',c2:'#000000',gravity:-.3,drag:2.5,spin:1.5},
    {id:'mass_tail',t:'emit',at,life:SHUT,burst:0,rate:massRate(170),from:'mesh',of:'tail',dir:'out',speed:[.3,1.2],plife:[.18,.36],look:'smoke',fb:'tex/smoke_toon',size:[7,15],grow:.5,col:'#000000',c2:'#000000',gravity:-.4,drag:3,spin:1.2},
    // more shadow: a wide dark patch on the ground under the drop, long wisps peeling off backward, extra smoke
    {id:'ground_shadow',t:'mesh',shape:'disc',mat:'black',at,life:LIFE,pos:keys(tr=>{const q=state(tr);return [W[0],.05,r3(q.cz-RZ*q.R*.6)];}),rot:[90,0,0],scale:keys(tr=>{const q=state(tr);return [r3(q.R*WX*1.15),r3(q.R*2.4),1];}),op:keys(tr=>r3(.42*ease(0,.06,tr)*(1-ease(SHUT,GONE,tr))))},
    {id:'wisps',t:'emit',at,life:SHUT,burst:0,rate:massRate(90),from:'mesh',of:'upper',dir:'out',speed:[1,3],up:.8,plife:[.22,.45],look:'model',model:'dark_drop_wisp',mmat:'solid',msize:[.8,2.0],col:'#020203',c2:'#000000',gravity:-.8,drag:2,bounce:0,mspin:120},
    {id:'mass_upper2',t:'emit',at,life:SHUT,burst:0,rate:massRate(160),from:'mesh',of:'upper',dir:'out',speed:[1.2,3],up:.6,plife:[.25,.5],look:'smoke',fb:'tex/smoke_toon',size:[18,34],grow:.8,col:'#000000',c2:'#000000',gravity:-.8,drag:2.2,spin:1.2},
    {id:'mass_tail2',t:'emit',at,life:SHUT,burst:0,rate:massRate(150),from:'mesh',of:'tail',dir:'out',speed:[.4,1.6],plife:[.22,.42],look:'smoke',fb:'tex/smoke_toon',size:[10,20],grow:.6,col:'#000000',c2:'#000000',gravity:-.5,drag:2.6,spin:1},
    {id:'haze',t:'emit',at,life:SHUT,burst:0,rate:massRate(45),from:'mesh',of:'upper',dir:'out',speed:[.8,2.5],plife:[.22,.4],look:'smoke',size:[22,40],grow:.9,col:'#000000',c2:'#000000',gravity:-.4,drag:2.5},
    {id:'smoke',t:'emit',at,life:SHUT,burst:0,rate:smokeRate,pos:behind,from:'sphere',fr:1.6,dir:'random',speed:[.3,1.2],plife:[.18,.32],look:'smoke',size:[4,8],grow:.8,col:'#000000',c2:'#000000',gravity:-.3,drag:3},
    {id:'bite_shards',t:'emit',at:REL+SHUT,life:.05,burst:70,pos:bite,from:'sphere',fr:3.2,dir:'out',speed:[6,15],up:2,plife:[.3,.6],look:'model',model:'dark_drop_shard',mmat:'solid',msize:[.4,1.1],col:'#030304',c2:'#000000',gravity:5,drag:1.5,bounce:0,mspin:540},
    {id:'bite_smoke',t:'emit',at:REL+SHUT,life:.05,burst:70,pos:bite,from:'sphere',fr:4.5,dir:'out',speed:[3,8],plife:[.18,.35],look:'smoke',fb:'tex/smoke_toon',size:[14,26],grow:1.2,col:'#000000',c2:'#000000',gravity:-.3,drag:3}
  ]
};
writeFileSync('assets/fx/darkness/ult_preview.fx.json',JSON.stringify(fx,null,1)+'\n');
console.log('ok bite',r3(REL+SHUT),'center',bite,'R',RMAX);
