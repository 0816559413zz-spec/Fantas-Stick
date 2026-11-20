// Builds the Darkness ult jaw assets for VFX Studio (models + fx timeline). Edit the numbers, then:
//   node assets/src/darkness_ult_gen.mjs
// Writes assets/fx/mesh/dark_jaw_*.mesh.json and assets/fx/darkness/ult_preview.fx.json.
// Timing rule (user): very fast launch -> eases slow -> short hold, opens a bit more -> hard fast bite -> dissolve.
import {writeFileSync} from 'node:fs';

const r3=n=>Math.round(n*1000)/1000;
const ease=(a,b,v)=>{const t=Math.min(1,Math.max(0,(v-a)/(b-a)));return t*t*(3-2*t);};

// ---------- models ----------
function jawPoint(u,v,sign,len){
  const lip=ease(.70,1,u),vv=Math.min(1,v*v);
  const y0=.10+.30*Math.sin(Math.PI*Math.min(u,1)*.85)-.30*lip*lip;
  const y=(y0+.22*(1-vv)*(.3+.7*u))*(sign>0?1:.82);
  return [2.8*v*(.30+.70*Math.pow(u,.8)),sign*y,len*u*(1-.20*vv)];
}
function jawModel(sign,len){
  const U=30,V=21,v=[],uv=[],f=[];
  for(let i=0;i<U;i++)for(let j=0;j<V;j++){
    const u=i/(U-1),w=(j/(V-1)*2-1)*1.15;
    v.push(jawPoint(u,w,sign,len).map(r3));uv.push([r3(u*1.6),r3(j/(V-1))]);
    if(i<U-1&&j<V-1){const a=i*V+j,b=a+V;f.push(sign>0?[a,a+1,b+1,b]:[a,b,b+1,a+1]);}
  }
  return {id:'jaw',k:'poly',v,f,uv,sub:0};
}
// Double-sided pyramid tooth: base on the rim, tip into the mouth.
function addTooth(v,f,base,side,tip){
  const n=v.length;
  v.push(base.map((c,i)=>r3(c-side[i])),base.map((c,i)=>r3(c+side[i])),[r3(base[0]),r3(base[1]),r3(base[2]-.05)],tip.map(r3));
  for(const [a,b,c] of [[0,1,3],[1,2,3],[2,0,3],[0,2,1]]){f.push([n+a,n+b,n+c]);f.push([n+a,n+c,n+b]);}
}
function teethModel(sign,len){
  const v=[],f=[];
  const list=sign>0?[-.92,-.74,-.55,-.38,.38,.55,.74,.92]:[-.95,-.78,-.6,-.42,-.24,-.08,.08,.24,.42,.6,.78,.95];
  list.forEach((w,i)=>{
    const rnd=(i*.618+(sign>0?.13:.47))%1,length=(sign>0?.17:.14)+.14*rnd*(1-.4*Math.abs(w)),width=.05+.03*rnd;
    const base=jawPoint(.955,w,sign,len),nb=jawPoint(.955,w+width,sign,len);
    const side=nb.map((c,k)=>c-base[k]);
    addTooth(v,f,base,side,[base[0]-w*.03,base[1]-sign*length,base[2]-.05*length]);
  });
  const parts=[{id:'teeth',k:'poly',v,f,sub:0}];
  if(sign>0){   // big shadow fang shaped like the scythe blade (curved, tip down)
    const fv=[],ff=[],S=14;
    for(let s=0;s<S;s++){
      const t=s/(S-1),a=-.25+t*1.75;          // arc from the palate forward and down
      const cz=.60+.36*Math.sin(a*.9),cy=.26-.70*t*t-.06*t;
      const width=.16*(1-t)**.8+.004,thick=.035*(1-t)+.004;
      const ny=-Math.sin(a*.9)*.6,nz=-Math.cos(a*.9);   // blade width points backward
      const nl=Math.hypot(ny,nz);
      for(const [wx,ww] of [[-thick,0],[thick,0],[thick,width],[-thick,width]])
        fv.push([r3(wx),r3(cy+ny/nl*ww),r3(cz+nz/nl*ww)]);
      if(s<S-1)for(let k=0;k<4;k++){const a0=s*4+k,a1=s*4+(k+1)%4;ff.push([a0,a1,a1+4,a0+4]);ff.push([a0,a0+4,a1+4,a1]);}
    }
    parts.push({id:'fang',k:'poly',v:fv,f:ff,sub:0});
  }
  return parts;
}
function tailModel(){   // strands from the rear (z=-1) into the throat (z=0); scaled by the fx layer
  const v=[],uv=[],f=[],N=12,P=24;
  for(let s=0;s<N;s++){
    const th=s*2.39996,rr=.55+.45*((s*.618)%1);
    for(let i=0;i<P;i++){
      const t=i/(P-1),r=(.03+.40*Math.pow(t,2.2))*rr,ang=th+t*3.0;
      const cx=Math.cos(ang)*r*1.6,cy=Math.sin(ang)*r*.75+Math.sin(t*7+th)*.02*(1-t),cz=-1+t;
      const w=(.012+.06*t),px=-Math.sin(ang)*w,py=Math.cos(ang)*w*.6;
      v.push([r3(cx-px),r3(cy-py),r3(cz)],[r3(cx+px),r3(cy+py),r3(cz)]);
      uv.push([r3(t*3+s*.37),0],[r3(t*3+s*.37),1]);
      if(i<P-1){const a=(s*P+i)*2;f.push([a,a+2,a+3,a+1]);}
    }
  }
  return {id:'tail',k:'poly',v,f,uv,sub:0};
}
function shardModel(){
  return {id:'shard',k:'poly',sub:0,flat:true,
    v:[[0,.5,0],[.18,0,0],[0,0,.08],[-.18,0,0],[0,0,-.08],[0,-.35,0]],
    f:[[0,2,1],[0,3,2],[0,4,3],[0,1,4],[5,1,2],[5,2,3],[5,3,4],[5,4,1]]};
}
const model=(name,desc,mat,parts)=>writeFileSync(`assets/fx/mesh/${name}.mesh.json`,JSON.stringify({v:1,desc,mat,pal:'arcane',tags:['darkness','ult'],parts})+'\n');
model('dark_jaw_upper','Darkness อัลติ ขากรรไกรบน (บานพับที่จุด 0 ยาว 1 ม. ไปทาง +z)','energy',[jawModel(1,1)]);
model('dark_jaw_lower','Darkness อัลติ ขากรรไกรล่าง','energy',[jawModel(-1,.88)]);
model('dark_jaw_teeth_upper','Darkness อัลติ ฟันบน + เขี้ยวเงาทรงใบเคียว','solid',teethModel(1,1));
model('dark_jaw_teeth_lower','Darkness อัลติ ฟันล่าง','solid',teethModel(-1,.88));
model('dark_jaw_tail','Darkness อัลติ หางเส้นเงา (ท้าย z=-1 → คอ z=0)','energy',[tailModel()]);
model('dark_jaw_shard','Darkness อัลติ เศษเงาแหลม','solid',[shardModel()]);

// ---------- timeline ----------
const REL=1.0,LIFE=1.25,TRAVEL=.80,HOLD=.95,SHUT=1.02,GONE=1.22,TAIL=17;
const W=[-.43,1.07,1.67];   // wand tip at full charge (measured in the studio)
function state(tr){
  const x=Math.min(1,tr/TRAVEL),out4=1-(1-x)**4,out3=1-(1-x)**3;
  const d=1+29*out4+.4*ease(TRAVEL,HOLD,tr);
  const s=.5+7.5*out3+.4*ease(TRAVEL,HOLD,tr)-.3*ease(HOLD,SHUT,tr);
  const slam=Math.min(1,Math.max(0,(tr-HOLD)/(SHUT-HOLD)))**2.2;   // accelerating bite
  const open=tr<HOLD?6+28*out3+12*ease(TRAVEL,HOLD,tr):46+(-3-46)*slam;
  const rad=open*Math.PI/180;
  const hz=Math.max(W[2]+.05,W[2]+d-s*Math.cos(rad)*.95),hy=W[1]+.50*s*ease(0,.12,tr);
  const tail=Math.min(TAIL,hz-W[2])*(1-ease(SHUT,GONE-.04,tr));
  return {d,s,open,hz,hy,tail};
}
const keys=fn=>{const c={};for(let i=0;i<=100;i++){const k=i/100;c[String(k)]=fn(k*LIFE);}return c;};
const pos=keys(tr=>{const q=state(tr);return [W[0],r3(q.hy),r3(q.hz)];});
const scale=keys(tr=>r3(state(tr).s));
const scaleB=keys(tr=>{const q=state(tr).s;return [r3(q*1.05),r3(q*1.10),r3(q*.97)];});   // second ink layer: thicker, darker
const rotUp=keys(tr=>[r3(state(tr).open),0,0]),rotLow=keys(tr=>[r3(-state(tr).open*.62),0,0]);
const dis=keys(tr=>r3(ease(SHUT,GONE,tr)));
const op=keys(tr=>r3(ease(0,.04,tr)));
const teethOp=keys(tr=>r3(ease(0,.04,tr)*(1-ease(SHUT,SHUT+.12,tr))));
const tailScale=keys(tr=>{const q=state(tr);return [r3(q.s*.9),r3(q.s*.9),r3(Math.max(.01,q.tail))];});
const smokeRate=keys(tr=>r3(tr<HOLD?80*(1-.6*ease(0,TRAVEL,tr)):tr<SHUT+.05?30:0));
const end=state(SHUT),mouth=[W[0],r3(end.hy),r3(end.hz+end.s*.55)];

const ink={mat:'tex',tex:'tex/dark_jaw_ink',col:'#ffffff',col2:'#000000',rim:0};
const at=REL;
const fx={
  v:1,
  desc:'Darkness — พรีวิวอัลติ ปากสัตว์เงาดำสนิท พุ่งเร็วแล้วช้าลง ค้าง อ้าเพิ่ม งับแรงที่ระยะ 600 แล้วสลาย',
  tags:['darkness','preview','ult'],pal:'arcane',dur:2.7,seed:11,
  layers:[
    {id:'anchor',t:'mesh',shape:'disc',mat:'black',op:0,at:0,life:2.7},
    {id:'stage',t:'code',fn:'studio_darkness_ult',at:0,life:2.7,args:{layer:'anchor'}},
    {id:'charge_smoke',t:'emit',at:.10,life:.88,burst:0,rate:{'0':10,'0.8':35,'1':45},from:'sphere',fr:1.1,pos:W,dir:'in',speed:[1.5,3],plife:[.2,.35],look:'smoke',size:[1.2,2.4],grow:-.6,col:'#000000',c2:'#000000',gravity:0,drag:1,spin:4},
    {id:'charge_core',t:'mesh',shape:'sphere',mat:'black',at:.12,life:.92,pos:W,scale:{'0':.04,'0.8':.22,'1':.30,ease:'in'},op:1},
    {id:'tail',t:'mesh',shape:'model',model:'dark_jaw_tail',...ink,uvScroll:[2.4,0],at,life:LIFE,pos,scale:tailScale,op,dis},
    {id:'smoke',t:'emit',at,life:SHUT+.05,burst:0,rate:smokeRate,pos,from:'sphere',fr:2.2,dir:'random',speed:[.3,1.6],plife:[.28,.5],look:'smoke',size:[5,10],grow:.8,col:'#000000',c2:'#000000',gravity:-.4,drag:3},
    {id:'jaw_lower',t:'mesh',shape:'model',model:'dark_jaw_lower',...ink,uvScroll:[1.6,0],at,life:LIFE,pos,scale,rot:rotLow,op,dis},
    {id:'teeth_lower',t:'mesh',shape:'model',model:'dark_jaw_teeth_lower',mat:'black',at,life:LIFE,pos,scale,rot:rotLow,op:teethOp},
    {id:'jaw_upper',t:'mesh',shape:'model',model:'dark_jaw_upper',...ink,uvScroll:[1.6,0],at,life:LIFE,pos,scale,rot:rotUp,op,dis},
    {id:'jaw_lower_b',t:'mesh',shape:'model',model:'dark_jaw_lower',...ink,uvScroll:[2.3,0],at,life:LIFE,pos,scale:scaleB,rot:rotLow,op,dis},
    {id:'jaw_upper_b',t:'mesh',shape:'model',model:'dark_jaw_upper',...ink,uvScroll:[2.3,0],at,life:LIFE,pos,scale:scaleB,rot:rotUp,op,dis},
    {id:'teeth_upper',t:'mesh',shape:'model',model:'dark_jaw_teeth_upper',mat:'black',at,life:LIFE,pos,scale,rot:rotUp,op:teethOp},
    {id:'bite_smoke',t:'emit',at:REL+SHUT-.01,life:.05,burst:12,pos:mouth,from:'sphere',fr:6,dir:'out',speed:[3,8],plife:[.15,.28],look:'smoke',size:[6,12],grow:1.4,col:'#000000',c2:'#000000',gravity:-.3,drag:3.5},
    {id:'bite_shards',t:'emit',at:REL+SHUT,life:.05,burst:60,pos:mouth,from:'sphere',fr:5.5,dir:'aim',spread:1.3,speed:[8,18],plife:[.3,.6],look:'model',model:'dark_jaw_shard',mmat:'solid',msize:[.35,1.0],col:'#030304',c2:'#000000',gravity:4,drag:1.5,bounce:0,mspin:540}
  ]
};
writeFileSync('assets/fx/darkness/ult_preview.fx.json',JSON.stringify(fx,null,1)+'\n');
console.log('ok bite at',r3(REL+SHUT),'mouth',mouth);
