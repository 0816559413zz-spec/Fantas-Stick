// VFX ตัวเลือก รอบ 3 (ผู้ใช้ 2026-10-23: "give me effect 4 effect a skill of ice and lighting again now each make it different too")
// → assets/fx/var3-frost/<ท่า>_<1-4>.fx.json + assets/fx/var3-storm/<ท่า>_<1-4>.fx.json (ยังไม่ผูกกับเกม — ให้ผู้ใช้เลือก)
// ใช้: node tools/vfx-var3-gen.js [ท่า ...]   (ไม่ใส่ = ทุกท่า) • แล้ว node tools/fx-check.js • รูปเทียบ: node tools/vfx-var3-sheets.js
// ไม่ซ้ำ A/B/C ของเพื่อน (พรีเมียม / อนิเมะ / สมจริง) และไม่ซ้ำของที่อยู่ในเกม — แต่ละแบบเป็น "โลก" ของตัวเอง:
//   น้ำแข็ง: 1 แสงเหนือ (ม่าน aurora ฟ้าเขียว-ม่วง) • 2 น้ำแข็งดำ (ผลึกดำ รอยร้าวฟ้าเรือง หมอกมืด) • 3 พายุหิมะ (หิมะฟุ้ง ลมหมุน เกล็ดหิมะ) • 4 แก้วปริซึม (คริสตัลใส ประกายรุ้ง)
//   สายฟ้า: 1 พลาสมาม่วงเทสลา • 2 สายฟ้าแดงเลือด (ควันดำ) • 3 เทพสายฟ้าทอง (วงรูน หอกสายฟ้า) • 4 พายุเมฆ (เมฆดำ ฝน ฟ้าผ่าจากเมฆ)
// สายฟ้าสีอื่นที่ไม่ใช่เหลือง = ริบบิ้นหยัก (zig) 2 แผ่นไขว้กัน (มองเห็นทุกมุม) • สีเหลือง/ฟ้า = ชั้น bolt ของเกม
// กรอบ: ผู้ร่ายยืนที่ 0 หันไป +z • หน่วยเมตร/วินาที • ขนาดตามเกมจริง (20 px = 1 ม.)
const fs=require('fs'),path=require('path');
const FXD=path.join(__dirname,'..','assets','fx');
let N=0;const nid=s=>s+(++N);
const L=(t,o)=>Object.assign({id:nid(o._n||t),t},(()=>{const q=Object.assign({},o);delete q._n;return q;})());
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const lerp3=(a,b,u)=>[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u];
const r2=v=>Math.round(v*100)/100;
const AT={};
const W=(group,name,o)=>{const d=path.join(FXD,group);fs.mkdirSync(d,{recursive:true});
  let end=0;for(const l of o.layers){const at=typeof l.at==='number'?l.at:0,li=typeof l.life==='number'?l.life:1;end=Math.max(end,at+li+(l.t==='emit'&&Array.isArray(l.plife)?l.plife[1]:0));}
  const out=Object.assign({v:1},o,{dur:o.dur||Math.min(12,Math.ceil(end*10+2)/10)});AT[group+'/'+name]=out.at;delete out.at;
  fs.writeFileSync(path.join(d,name+'.fx.json'),JSON.stringify(out,null,1)+'\n');};
// สุ่มแบบคงที่ (ให้ไฟล์ออกมาเหมือนเดิมทุกครั้งที่รัน)
let SEED=1;const rnd=()=>{SEED=(SEED*16807)%2147483647;return SEED/2147483647;};
// ---------- ชิ้นพื้นฐาน (ชุดเดียวกับ vfx-var2-gen) ----------
const flash=(at,p,size,col,life=0.1,o={})=>L('flash',{_n:'flash',at,life,pos:p,col,size,...o});
const halo=(at,p,size,col,life=0.35,o={})=>L('halo',{_n:'halo',at,life,pos:p,col,size,k:o.k||1,...o});
const light=(at,life,p,col,int=1.8,dist=12)=>L('light',{_n:'light',at,life,pos:p,col,int:{'0':int,'1':0},dist});
const shake=(at,s,o={})=>L('screen',{_n:'cam',at,life:o.life||0.25,shake:s,own:true,...o});
const snd=(at,name,vol=0.6)=>L('sound',{_n:'snd',at,life:0.05,name,vol});
const ringG=(at,p,r,col,life=0.45,op=0.5)=>L('ring',{_n:'ring',at,life,att:'ground',pos:p,col,r,op});
const ringV=(at,p,r,col,life=0.25,op=0.7)=>L('ring',{_n:'ringv',at,life,pos:p,col,r,op,vert:true});
const shock=(at,p,size,col='#ffffff',life=0.45,str=1.2)=>L('warp',{_n:'shock',at,life,att:'ground',pos:[p[0],0.2,p[2]],kind:'shock',flat:true,size:{'0':0.5,'1':1,x:size},op:{'0':1,'1':0},str,col,x:true});
const bulge=(at,life,p,size,str=0.8,col='#ffffff')=>L('warp',{_n:'bulge',at,life,pos:p,kind:'bulge',size:{'0':0.3,'1':1,x:size},str,op:{'0':1,'1':0},col,x:true});
const decal=(at,life,p,kind,r,o={})=>L('decal',{_n:'decal',at,life,att:'ground',pos:[p[0],0,p[2]],kind,r,...o});
const emit=(at,life,o)=>L('emit',{_n:o.nm||'emit',at,life,...(()=>{const q=Object.assign({},o);delete q.nm;return q;})()});
const mesh=(at,life,o)=>L('mesh',{_n:o.nm||'mesh',at,life,...(()=>{const q=Object.assign({},o);delete q.nm;return q;})()});
const smoke=(at,p,n,col,o={})=>emit(at,0.06,{nm:'smoke',burst:Math.max(2,Math.round(n*0.6)),pos:p,from:o.from||'disc',fr:o.fr||1,dir:o.dir||'up',spread:1.1,speed:o.speed||[0.6,1.8],plife:o.plife||[1,1.7],look:'smoke',fb:'tex/smoke_puff',size:(o.size||[10,16]).map(v=>v*0.6),col,c2:o.c2||col,gravity:o.g===undefined?-0.35:o.g,grow:1.1,drag:2,x:true,...(o.att?{att:o.att}:{})});
const sparks=(at,p,n,col,c2,o={})=>emit(at,0.05,{nm:'sparks',burst:n,pos:p,from:o.from||'sphere',fr:o.fr||0.3,dir:o.dir||'out',spread:o.spread||1.2,speed:o.speed||[4,10],up:o.up||[0,0],plife:o.plife||[0.25,0.55],look:o.look||'spark',size:o.size||[1.6,2.6],col,c2,gravity:o.g===undefined?6:o.g,drag:o.drag||2,...(o.fb?{fb:o.fb}:{}),...(o.att?{att:o.att}:{})});
const chunks=(at,p,n,model,mmat,col,c2,o={})=>emit(at,0.05,{nm:'chunks',burst:n,pos:p,att:o.att,from:o.from||'sphere',fr:o.fr||0.3,dir:o.dir||'out',spread:o.spread||1.2,speed:o.speed||[3,7],up:o.up||[2,5],plife:o.plife||[0.8,1.4],look:'model',model,mmat,msize:o.msize||[0.12,0.28],bounce:o.bounce===undefined?0.35:o.bounce,mspin:o.mspin||540,gravity:o.g===undefined?11:o.g,drag:o.drag||1,col,c2});
const debris=(at,p,n,kind,speed,r,o={})=>L('debris',{_n:'debris',at,life:o.life||1.3,att:'ground',pos:[p[0],0.3,p[2]],kind,n,speed,r,size:o.size||1,x:o.x});
const texDisc=(at,life,p,r,tex,col,col2,o={})=>L('mesh',{_n:o.nm||'texdisc',at,life,att:'ground',pos:[p[0],o.y||0.05,p[2]],shape:'disc',mat:'tex',tex,col,col2,rim:o.rim||1,uvTile:o.tile||[Math.max(1,Math.round(r/3)),Math.max(1,Math.round(r/3))],uvScroll:o.scroll||[0.02,0.01],
  scale:{'0':0.2,'0.08':r,'1':r,ease:'out'},op:o.op||{'0':0,'0.08':0.9,'0.75':0.75,'1':0}});
// โปรเจกไทล์: ตัว (mesh วิ่งจาก p0 ไป p1 ใน T วิ) — คืนชื่อชั้นตัวไว้ให้หาง/อนุภาคตาม
function body(at,T,p0,p1,o){const nm=nid('shot');return {nm,layer:L('mesh',{_n:'x',at,life:T,...o,pos:{'0':p0,'1':p1},fade:0}),fix(){this.layer.id=nm;return this.layer;}};}
const yawOf=(p0,p1)=>r2(Math.atan2(p1[0]-p0[0],p1[2]-p0[2])*180/Math.PI);
// สายฟ้าหยักสีใดก็ได้: ริบบิ้น 2 แผ่นไขว้ (แบน + ตั้ง) • แกน = เส้นตรงในกรอบของชั้น (หันด้วย yaw) • op กะพริบ
function zig(at,life,p0,p1,o={}){
  const dx=p1[0]-p0[0],dy=p1[1]-p0[1],dz=p1[2]-p0[2],hl=Math.hypot(dx,dz),len=Math.hypot(dx,dy,dz),vert=hl<0.3*Math.abs(dy);
  const n=o.n||Math.max(5,Math.min(16,Math.round(len*1.4))),amp=o.amp===undefined?Math.min(0.9,0.12+len*0.05):o.amp,pts=[];
  for(let i=0;i<=n;i++){const u=i/n,j=(i===0||i===n)?0:amp*(0.4+rnd()*0.8);
    pts.push(vert?[r2((rnd()-0.5)*2*j),r2(dy*u),r2((rnd()-0.5)*2*j)]:[r2((rnd()-0.5)*2*j),r2(dy*u+(rnd()-0.5)*j),r2(hl*u)]);}
  const yaw=vert?0:yawOf(p0,p1),fl=o.flick===false?{'0':1,'0.6':1,'1':0}:{'0':1,'0.25':0.35,'0.45':1,'0.7':0.25,'1':0},w=o.w||0.16,base={pos:p0,shape:'ribbon',path:pts,yaw,op:fl,fade:0,...(o.att?{att:o.att}:{})};
  const R=vert?[[0,0,0],[0,90,0]]:[[0,0,0],[0,0,90]],out=[];
  for(const rot of R){out.push(mesh(at,life,{nm:'arc',...base,wk:Math.min(2,w*4),mat:'energy',col:o.col,col2:o.col2||o.col,rot,rim:2,scroll:6}));
    out.push(mesh(at,life,{nm:'arcCore',...base,wk:Math.max(0.05,w*1.3),mat:'glow',col:o.core||'#ffffff',rot}));}
  if(o.br){for(let b=0;b<o.br;b++){const k=1+Math.floor(rnd()*(n-1)),p=pts[k],q=vert?[p[0]+(rnd()-0.5)*len*0.4,p[1]+dy*0.15,p[2]+(rnd()-0.5)*len*0.4]:[p[0]+(rnd()-0.5)*len*0.3,p[1]-0.4-rnd()*0.8,p[2]+len*0.12];
    const bp=[[p[0],p[1],p[2]],[r2((p[0]+q[0])/2+(rnd()-0.5)*0.3),r2((p[1]+q[1])/2),r2((p[2]+q[2])/2)],[r2(q[0]),r2(q[1]),r2(q[2])]];
    out.push(mesh(at+0.02,life*0.7,{nm:'branch',...base,path:bp,wk:w*1.4,mat:'energy',col:o.col,col2:o.col2||o.col,rot:R[0],rim:2}));}}
  return out;}

// ======================================================================
//  ธีมน้ำแข็ง (สีตามธีม: core / hi / main / deep + ตัวเลือกสไตล์ S)
// ======================================================================
// ชุดท่าพื้นฐานของน้ำแข็ง — ทุกธีมใช้ร่วม แล้วใส่ "ลายเซ็น" ของตัวเองผ่าน this.sig*/this.S
const FROST_BASE={
  ice(o){const S=this.S;return Object.assign({mat:S.iceMat||'ice',col:S.iceCol||this.C.hi,col2:S.iceCol2||this.C.deep},o);},
  cast(t,p,s=1){const C=this.C;return [flash(t,p,1.4*s,C.core,0.08),ringV(t,add(p,[0,0,0.3]),0.8*s,C.hi,0.2,0.8),...this.sigBurst(t,p,0.5*s,0.4)];},
  charge(t,d,p,r=1){const C=this.C;return [
    mesh(t,d,{nm:'form',pos:p,shape:'model',model:this.S.crystal||'crystal_crown',...this.ice({}),scale:{'0':0.05,'1':0.45*r,ease:'in'},spin:90}),
    halo(t,p,2*r,C.main,d,{size0:0.4,k:0.8}),
    emit(t,d,{nm:'gather',pos:p,rate:40,from:'sphere',fr:1.3*r,dir:'in',speed:[1.8,3.2],plife:[0.3,0.45],look:this.S.mote||'glow',fb:this.S.moteFb,size:[1.8,3],col:C.core,c2:C.main,gravity:0,drag:0}),
    ...this.sigAmb(t,d,p,0.8*r),light(t,d,p,C.main,1.2,6)];},
  shot(t,T,p0,p1,s=1){const C=this.C,b=body(t,T,p0,p1,{shape:'cone',...this.ice({}),rot:[90,0,0],yaw:yawOf(p0,p1),scale:[0.16*s,0.7*s,0.16*s],rim:2}),nm=b.nm;return [b.fix(),
    L('halo',{_n:'aura',at:t,life:T,col:C.main,size:0.9*s,size0:0.9*s,k:0.7,pos:{'0':p0,'1':p1}}),
    L('trail',{_n:'tail',at:t,life:T,of:nm,col:this.S.tail||'#ffffff',col2:C.main,w:0.18*s,tlife:0.18,k:1.8}),
    emit(t,T,{nm:'drift',rate:36,from:'mesh',of:nm,dir:'random',speed:[0.2,0.8],plife:[0.25,0.45],look:this.S.mote||'glow',fb:this.S.moteFb,size:[1.6,2.6],col:C.core,c2:C.main,gravity:this.S.snow?0:0})];},
  hit(t,p,r=2,k=1){const C=this.C,g=[p[0],0,p[2]];return [flash(t,add(p,[0,0.3,0]),r*0.9,C.core,0.1),halo(t,add(p,[0,0.3,0]),r*1.4,C.main,0.45),
    mesh(t,0.6,{nm:'spikes',att:'ground',pos:g,shape:'model',model:this.S.spikes||'frost_spires',...this.ice({}),scale:{'0':0.1,'0.25':r*0.55,'1':r*0.5,ease:'out'},op:{'0':1,'0.7':1,'1':0},grow:{'0':0,'0.3':1}}),
    chunks(t,add(p,[0,0.2,0]),Math.min(24,6+r*4),this.S.shard||'frost_shard',this.S.chunkMat||'ice',C.hi,C.deep,{speed:[2+r,4+r*1.5],msize:[0.1,0.24]}),
    ringG(t,add(g,[0,0.08,0]),r*1.5,C.hi,0.4,0.55),shock(t,g,r*2,'#e8f8ff',0.45,1.1),
    ...this.sigBurst(t,p,r,k),...(k>=0.25?[light(t,0.4,add(g,[0,1.4,0]),C.main,2,r*4+6)]:[]),...(k>0.6?[shake(t,1.5+r*0.6,{kick:0.2})]:[])];},
  slash(t,a0,a1,r,tilt,s=1){const C=this.C;return [
    L('trail',{_n:'cut',at:t,life:0.16,sweep:true,a0,a1,r,r0:r*0.45,tilt,pos:[0,1.15,0.2],col:this.S.tail||'#ffffff',col2:C.main,w:0.5*s,tlife:0.22,k:2.2}),
    L('trail',{_n:'cutG',at:t+0.02,life:0.16,sweep:true,a0,a1,r:r*1.08,r0:r*0.8,tilt,pos:[0,1.15,0.2],col:C.hi,col2:C.deep,w:0.25*s,tlife:0.3,k:1.4}),
    ...this.sigBurst(t+0.08,[Math.sin((a0+a1)/2*Math.PI/180)*r*0.7,1.15,Math.cos((a0+a1)/2*Math.PI/180)*r*0.7+0.2],0.6*s,0.3)];},
  zone(t,d,p,r){const C=this.C,g=[p[0],0,p[2]];return [
    mesh(t,d,{nm:'floor',att:'ground',pos:add(g,[0,0.05,0]),shape:'disc',...this.ice({mat:this.S.floorMat||'ice'}),scale:{'0':0.1,'0.08':1,'1':1,ease:'out',x:r},op:{'0':0.8,'0.85':0.65,'1':0},rim:1.6}),
    mesh(t,d,{nm:'rim',att:'ground',pos:add(g,[0,0.08,0]),shape:'ring',inner:0.95,mat:'glow',col:C.hi,scale:{'0':0.1,'0.08':1,'1':1,ease:'out',x:r},op:{'0':1,'0.85':0.8,'1':0},spin:12}),
    decal(t,d,g,'icecrack',r*0.95,{n:14,col:this.S.crackCol||C.hi}),
    ...this.sigAmb(t,d,g,r)];},
  aura(t,d,r=1.4){const C=this.C;return [
    mesh(t,d,{nm:'ring',att:'feet',pos:[0,0.06,0],shape:'ring',inner:0.9,mat:'glow',col:C.hi,scale:r,spin:40,op:{'0':0,'0.1':0.9,'0.9':0.8,'1':0}}),
    mesh(t,d,{nm:'band',att:'feet',pos:[0,1,0],shape:'torus',inner:0.94,mat:'energy',col:C.hi,col2:C.deep,scale:[r*0.6,r*0.6,r*0.6],spin:-70,op:{'0':0,'0.15':0.7,'1':0},rim:2}),
    emit(t,d,{nm:'rise',rate:Math.min(60,10+r*6),att:'feet',pos:[0,0.2,0],from:'disc',fr:r*0.9,dir:'up',speed:[0.5,1.4],plife:[0.7,1.2],look:this.S.mote||'glow',fb:this.S.moteFb,size:[1.8,3],col:C.core,c2:C.main,gravity:this.S.snow?0:-0.3}),
    ...this.sigAmb(t,d,[0,0,0],r)];},
  line(t,d,p0,p1,w=1){const C=this.C,len=Math.hypot(p1[0]-p0[0],p1[2]-p0[2]),m=[(p0[0]+p1[0])/2,0,(p0[2]+p1[2])/2],yaw=yawOf(p0,p1);return [
    mesh(t,d,{nm:'path',att:'ground',pos:[0,0.12,0],shape:'ribbon',path:[0,0.25,0.5,0.75,1].map(u=>[r2(p0[0]+(p1[0]-p0[0])*u),0,r2(p0[2]+(p1[2]-p0[2])*u)]),wk:Math.min(2,w),...(this.S.floorMat==='solid'?this.ice({}):{mat:'energy',col:C.hi,col2:C.deep}),op:{'0':0,'0.06':0.85,'0.8':0.65,'1':0},rim:1.4,scroll:0.5}),
    mesh(t,d,{nm:'pathCore',att:'ground',pos:[0,0.07,0],shape:'ribbon',path:[0,0.5,1].map(u=>[r2(p0[0]+(p1[0]-p0[0])*u),0,r2(p0[2]+(p1[2]-p0[2])*u)]),wk:Math.max(0.05,Math.min(2,w)*0.18),mat:'glow',col:this.S.crackCol||C.hi,op:{'0':0,'0.06':0.9,'0.7':0.5,'1':0}}),
    emit(t,Math.min(d,0.6),{nm:'chips',rate:Math.min(90,len*5),pos:[p0[0],0.2,p0[2]],att:'ground',yaw,from:'line',fh:Math.min(20,len),dir:'up',speed:[0.6,1.6],plife:[0.4,0.8],look:this.S.mote||'glow',fb:this.S.moteFb,size:[1.8,2.8],col:C.core,c2:C.main,gravity:this.S.snow?0:-0.2})];},
  ridge(t,d,p0,p1,n=7){const out=[];for(let i=0;i<n;i++){const u=(i+0.5)/n,p=lerp3(p0,p1,u),s=0.7+u*1.5;
    out.push(mesh(t+i*0.06,d,{nm:'peak',att:'ground',pos:[p[0]+(rnd()-0.5)*0.6,0,p[2]],shape:'model',model:this.S.ridge||'frost_spires',...this.ice({}),yaw:Math.round(rnd()*360-180),scale:{'0':0.1,'0.12':s,'1':s,ease:'out'},op:{'0':1,'0.85':1,'1':0},grow:{'0':0,'0.15':1}}));
    if(i%2===0)out.push(...this.sigBurst(t+i*0.06,[p[0],0.6,p[2]],0.5+u,0.3));}
  return out;},
  shell(t,d){const C=this.C;return [
    mesh(t,d,{nm:'shell',att:'feet',pos:[0,1.1,0],shape:'sphere',...this.ice({}),scale:{'0':[0.4,0.4,0.4],'0.1':[1.05,1.45,1.05],'1':[1.05,1.45,1.05],ease:'out'},op:{'0':0,'0.1':0.75,'0.92':0.75,'1':0},rim:2.4}),
    mesh(t,d,{nm:'cage',att:'feet',pos:[0,0,0],shape:'model',model:this.S.cage||'spike_shell',...this.ice({}),scale:{'0':0.2,'0.12':1.3,'1':1.3,ease:'out'},op:{'0':0,'0.1':1,'0.92':1,'1':0},grow:{'0':0,'0.15':1}}),
    ...this.sigAmb(t,d,[0,0,0],1.6),...this.sigBurst(t,[0,1,0],1.4,0.5)];},
  blade(t,d,p,model='frost_blade'){const C=this.C,nm=nid('blade');return [
    L('mesh',{_n:'x',id:nm,at:t,life:d,att:'feet',pos:{'0':add(p,[0,-0.6,0]),'0.15':p,'0.5':add(p,[0,0.15,0]),'1':p},shape:'model',model,...this.ice({}),scale:{'0':0.2,'0.15':1.1,'1':1.1,ease:'out'},op:{'0':0,'0.1':1,'0.9':1,'1':0},rim:2.4,grow:{'0':0,'0.2':1}}),
    halo(t,p,1.6,C.main,d,{size0:1.2,k:0.6,att:'feet'}),
    emit(t,d,{nm:'drip',rate:14,att:'feet',pos:p,from:'sphere',fr:0.5,dir:'random',speed:[0.2,0.6],plife:[0.5,0.9],look:this.S.mote||'glow',fb:this.S.moteFb,size:[1.6,2.6],col:C.core,c2:C.main,gravity:this.S.snow?0:-0.2})];},
  shield(t,d,p){const C=this.C;return [
    mesh(t,d,{nm:'wall',pos:p,shape:'model',model:this.S.shieldModel||'crystal_cluster',...this.ice({}),rot:[90,0,0],scale:{'0':0.2,'0.12':1.2,'1':1.2,ease:'out'},op:{'0':0,'0.1':0.95,'0.9':0.95,'1':0},grow:{'0':0,'0.15':1}}),
    mesh(t,d,{nm:'pane',pos:add(p,[0,0,0.1]),shape:'disc',...this.ice({}),rot:[90,0,0],scale:{'0':0.2,'0.12':1.3,'1':1.3,ease:'out'},op:{'0':0,'0.1':0.55,'0.9':0.5,'1':0},rim:2.6}),
    ...this.sigAmb(t,d,[p[0],0,p[2]],1.4)];},
  dash(t,p0,p1){const C=this.C,T=0.28,b=body(t,T,add(p0,[0,1,0]),add(p1,[0,1,0]),{shape:'sphere',mat:'glow',col:C.core,scale:0.25}),nm=b.nm;return [b.fix(),
    L('trail',{_n:'tail',at:t,life:T+0.05,of:nm,col:this.S.tail||'#ffffff',col2:C.main,w:1,tlife:0.35,k:1.8}),
    ...this.line(t,1.6,p0,p1,1.4),...this.sigBurst(t,add(p0,[0,0.8,0]),1,0.4),...this.sigBurst(t+T,add(p1,[0,0.8,0]),1.2,0.5)];},
};
const FT={
// ---- 1 แสงเหนือ: ม่านแสง aurora เขียวฟ้า-ม่วงพลิ้ว ดาวระยิบ น้ำแข็งใสอมฟ้าเขียว ----
aurora:{name:'แสงเหนือ',desc:'ม่านแสงออโรร่าเขียวฟ้า-ม่วงพลิ้วขึ้นจากน้ำแข็ง ดาวระยิบ น้ำแข็งใสอมเขียว — นุ่ม สวย ไม่แข็งกระด้าง',
  C:{core:'#effffa',hi:'#8affdf',main:'#36d8b4',deep:'#7a5cff',pink:'#ff8ad8'},
  S:{iceCol:'#bfffee',iceCol2:'#5a4cff',mote:'glow',moteFb:'tex/star_flare',tail:'#d8fff4',crackCol:'#7affd9',crystal:'crystal_crown'},
  curtain(t,d,p,r,h=3){const C=this.C,H=Math.min(4.5,h),prof=[[1,0],[1.06,0.3],[0.95,0.62],[1.03,1]],op={'0':0,'0.2':0.6,'0.8':0.45,'1':0};return [
    mesh(t,d,{nm:'aurora',att:'ground',pos:[p[0],0,p[2]],shape:'lathe',prof,mat:'tex',tex:'tex/noise_clouds',col:C.hi,col2:C.deep,uvTile:[4,1],uvScroll:[0.03,0.35],scale:{'0':[r*0.7,H*0.2,r*0.7],'0.2':[r,H,r],'1':[r*1.05,H,r*1.05],ease:'out'},spin:14,op}),
    mesh(t+0.08,d,{nm:'auroraB',att:'ground',pos:[p[0],0,p[2]],shape:'lathe',prof,mat:'tex',tex:'tex/noise_clouds',col:C.pink,col2:C.main,uvTile:[3,1],uvScroll:[-0.02,0.28],scale:{'0':[r*0.6,H*0.15,r*0.6],'0.25':[r*0.86,H*0.75,r*0.86],'1':[r*0.9,H*0.75,r*0.9],ease:'out'},spin:-10,op})];},
  sigBurst(t,p,r,k){const C=this.C;return [
    emit(t,0.05,{nm:'stars',burst:Math.round(10+r*8),pos:p,from:'sphere',fr:0.3*r,dir:'out',speed:[1.5*r,3.5*r],plife:[0.5,0.9],look:'glow',fb:'tex/star_flare',size:[2.4,4],col:'#ffffff',c2:k>0.5?C.pink:C.main,gravity:-0.5,drag:3}),
    ...(r>0.9?this.curtain(t,0.9+r*0.15,p,r*0.8,Math.min(4,1.2+r*0.6)):[])];},
  sigAmb(t,d,p,r){return [...this.curtain(t,d,p,Math.max(1.2,r*0.85),Math.min(4.5,1.6+r*0.25)),
    emit(t,d,{nm:'twinkle',rate:Math.min(50,8+r*4),att:'ground',pos:[p[0],0.5,p[2]],from:'disc',fr:r,dir:'up',speed:[0.2,0.8],plife:[0.8,1.4],look:'glow',fb:'tex/star_flare',size:[1.6,3],col:'#ffffff',c2:this.C.hi,gravity:-0.2})];},
},
// ---- 2 น้ำแข็งดำ: ผลึกดำมันวาว รอยร้าวฟ้าเรืองใต้ผิว หมอกมืดเย็น แสงน้อยแต่คม ----
blackice:{name:'น้ำแข็งดำ',desc:'น้ำแข็งดำมันวาวเหมือนหินออบซิเดียน รอยร้าวสีฟ้าเรืองใต้ผิว หมอกมืดเย็นไหลต่ำ ประกายคมน้อยแต่ชัด',
  C:{core:'#e6fbff',hi:'#56d6ff',main:'#1a7ec4',deep:'#04101f'},
  S:{iceMat:'solid',iceCol:'#0d1a2e',iceCol2:'#3fc8ff',mote:'spark',moteFb:'',tail:'#9fe8ff',crackCol:'#4fd0ff',floorMat:'solid',chunkMat:'solid',crystal:'crystal_cluster',spikes:'frost_spires'},
  sigBurst(t,p,r,k){const C=this.C;return [
    emit(t,0.05,{nm:'glint',burst:Math.round(8+r*6),pos:p,from:'sphere',fr:0.2,dir:'out',speed:[3*r,7*r],plife:[0.18,0.35],look:'streak',size:[2,3],col:'#e6fbff',c2:C.hi,gravity:0,drag:4}),
    chunks(t,p,Math.round(3+r*2),'frost_shard','solid','#0d1a2e','#3fc8ff',{speed:[2+r,4+r*1.5],msize:[0.08,0.18]})];},
  sigAmb(t,d,p,r){const C=this.C;return [
    L('mesh',{_n:'veins',at:t,life:d,att:'ground',pos:[p[0],0.06,p[2]],shape:'disc',mat:'tex',tex:'tex/noise_veins',col:C.hi,col2:'#bff4ff',rim:1.4,uvTile:[Math.max(1,Math.round(r/2)),Math.max(1,Math.round(r/2))],uvScroll:[0.01,0.02],scale:{'0':0.2,'0.1':r,'1':r,ease:'out'},op:{'0':0,'0.1':0.85,'0.8':0.7,'1':0}}),
    ...(r>=3?[L('mist',{_n:'mist',at:t,life:d,att:'ground',pos:[p[0],0,p[2]],r:r*0.8,n:Math.min(30,6+Math.round(r*2)),out:0.4})]:[])];},
},
// ---- 3 พายุหิมะ: หิมะฟุ้งขาว ลมหมุนเป็นเกลียว เกล็ดหิมะใหญ่ ผงหิมะระเบิด ----
blizzard:{name:'พายุหิมะ',desc:'พายุหิมะขาว — ผงหิมะระเบิดฟุ้ง ลมหมุนเป็นเกลียว เกล็ดหิมะใหญ่ปลิว เส้นลมพัด เย็นแบบหนาวจริง ไม่เรืองแสง',
  C:{core:'#ffffff',hi:'#eef7ff',main:'#b8d4ec',deep:'#6f8eae'},
  S:{iceCol:'#f4faff',iceCol2:'#9cbad6',mote:'glow',snow:true,tail:'#ffffff',crackCol:'#ffffff',spikes:'frost_spires',crystal:'crystal_crown'},
  sigBurst(t,p,r,k){const C=this.C;return [
    emit(t,0.06,{nm:'powder',burst:Math.round(5+r*3),pos:[p[0],Math.max(0.3,p[1]-0.2),p[2]],from:'sphere',fr:0.3*r+0.2,dir:'out',spread:1.2,speed:[0.8+r*0.4,2+r*0.8],plife:[0.6,1],look:'glow',size:[9,14],grow:0.8,col:'#f4f9ff',c2:'#c9d9ea',gravity:-0.1,drag:2.5,x:true}),   // ผงหิมะสว่าง (ควันธรรมดาออกเทาบนแผนที่มืด)
    emit(t,0.05,{nm:'flakes',burst:Math.round(14+r*10),pos:p,from:'sphere',fr:0.3*r,dir:'out',speed:[1.5*r,3.5*r],plife:[0.6,1.1],look:'flake',size:[1.4,2.4],col:'#ffffff',c2:C.main,gravity:0.8,drag:3.5,spin:6}),
    emit(t,0.05,{nm:'gust',burst:Math.round(8+r*4),pos:p,from:'disc',fr:0.3*r,dir:'flat',speed:[5*r,9*r],plife:[0.2,0.35],look:'streak',size:[2,3],col:'#ffffff',c2:C.main,gravity:0,drag:3})];},
  sigAmb(t,d,p,r){const C=this.C;return [
    mesh(t,d,{nm:'swirl',att:'ground',pos:[p[0],0,p[2]],shape:'model',model:'tornado',mat:'tex',tex:'tex/noise_clouds',col:'#ffffff',col2:C.main,scale:{'0':[0.2,0.2,0.2],'0.12':[Math.min(r,2.4)*0.42,Math.min(0.95,0.45+r*0.06),Math.min(r,2.4)*0.42],'1':[Math.min(r,2.4)*0.45,Math.min(0.95,0.45+r*0.06),Math.min(r,2.4)*0.45]},spin:220,op:{'0':0,'0.12':0.32,'0.85':0.25,'1':0},uvScroll:[0.4,0.6]}),
    emit(t,d,{nm:'snow',rate:Math.min(70,14+r*6),pos:[p[0],0.6,p[2]],from:'disc',fr:r,dir:'random',speed:[0.8,1.8],up:[0.2,0.8],plife:[0.6,1],look:'glow',size:[1,1.8],col:'#ffffff',c2:C.main,gravity:0,drag:2}),
    ...(r>=3?[L('mist',{_n:'mist',at:t,life:d,att:'ground',pos:[p[0],0,p[2]],r:r*0.7,n:Math.min(24,5+Math.round(r*1.5)),out:0.4})]:[])];},   // หมอกเฉพาะวงใหญ่ (หมอกวงเล็กถูกดันไปถึงหน้ากล้องได้ = จอขาว)
},
// ---- 4 แก้วปริซึม: คริสตัลใสเหมือนแก้ว ประกายรุ้งหลายสี เลนส์หักเหแสง แสงดาวกากบาท ----
prism:{name:'แก้วปริซึม',desc:'คริสตัลใสเหมือนแก้วเจียระไน — ประกายรุ้งหลายสีกระจาย เลนส์หักเหอากาศ แสงดาวกากบาทวิบวับ สะอาด คม หรู',
  C:{core:'#ffffff',hi:'#f0f8ff',main:'#b6e6ff',deep:'#7f9cff'},
  S:{iceCol:'#f6fbff',iceCol2:'#c6b4ff',mote:'glow',moteFb:'tex/star_flare',tail:'#ffffff',crackCol:'#e6f6ff',spikes:'frost_spires',crystal:'crystal_cluster',shard:'frost_shard'},
  RB:['#ff8fb1','#ffd36e','#8fffb0','#7fd8ff','#c49bff'],
  sigBurst(t,p,r,k){const out=[];this.RB.forEach((c,i)=>out.push(emit(t+i*0.01,0.05,{nm:'prism',burst:Math.round(3+r*2.5),pos:p,from:'sphere',fr:0.25*r,dir:'out',speed:[2*r,5*r],plife:[0.4,0.8],look:'glow',fb:'tex/star_flare',size:[2.2,3.6],col:'#ffffff',c2:c,gravity:0.3,drag:2.5})));
    out.push(emit(t,0.04,{nm:'glare',burst:1,pos:p,from:'point',speed:[0,0.1],plife:[0.25,0.25],look:'glow',fb:'tex/star_flare',size:[10*Math.min(2,0.6+r*0.4),10*Math.min(2,0.6+r*0.4)],col:'#ffffff',c2:'#dff2ff',gravity:0}));
    if(r>0.9)out.push(bulge(t,0.35,p,r*0.9,0.7,'#ffffff'));return out;},
  sigAmb(t,d,p,r){const out=[mesh(t,d,{nm:'facets',att:'ground',pos:[p[0],0.04,p[2]],shape:'model',model:'crystal_cluster',mat:'ice',col:'#f6fbff',col2:'#c6b4ff',scale:{'0':0.1,'0.12':Math.min(1.6,0.4+r*0.12),'1':Math.min(1.6,0.4+r*0.12)},op:{'0':0,'0.1':0.9,'0.9':0.9,'1':0},grow:{'0':0,'0.2':1}})];
    this.RB.forEach((c,i)=>out.push(emit(t,d,{nm:'rainbow',rate:Math.min(14,2+r),att:'ground',pos:[p[0],0.6,p[2]],from:'disc',fr:r,dir:'up',speed:[0.2,0.7],plife:[0.8,1.3],look:'glow',fb:'tex/star_flare',size:[1.8,2.8],col:'#ffffff',c2:c,gravity:-0.15})));return out;},
},
};
for(const k in FT)Object.setPrototypeOf(FT[k],FROST_BASE);
const FORDER=['aurora','blackice','blizzard','prism'];

// ======================================================================
//  ธีมสายฟ้า
// ======================================================================
const STORM_BASE={
  // สายฟ้าเส้นเดียว p0→p1 (ธีมที่ใช้ชั้น bolt ของเกมจะ override)
  bolt(t,life,p0,p1,o={}){const C=this.C;return zig(t,life,p0,p1,{col:C.main,col2:C.deep,core:C.core,w:o.w||0.14,br:o.br,n:o.n,amp:o.amp,att:o.att});},
  cast(t,p,s=1){const C=this.C;return [flash(t,p,1.3*s,C.core,0.07),ringV(t,add(p,[0,0,0.3]),0.7*s,C.hi,0.18,0.8),...this.bolt(t,0.12,p,add(p,[0.5*s,0.3*s,0.8*s]),{w:0.06,n:4,amp:0.15}),...this.sig(t,p,0.4*s)];},
  charge(t,d,p,r=1){const C=this.C,out=[mesh(t,d,{nm:'core',pos:p,shape:'sphere',mat:'energy',col:C.hi,col2:C.deep,scale:{'0':0.05,'1':0.4*r,ease:'in'},rim:2.6,scroll:3}),
    halo(t,p,2*r,C.main,d,{size0:0.4,k:0.9}),emit(t,d,{nm:'gather',pos:p,rate:40,from:'sphere',fr:1.4*r,dir:'in',speed:[2,3.5],plife:[0.28,0.4],look:'streak',size:[1.8,2.6],col:C.core,c2:C.main,gravity:0,drag:0}),light(t,d,p,C.main,1.4,7)];
    for(let i=0;i<Math.round(d*5);i++){const a=rnd()*Math.PI*2,e=rnd()*1.2-0.6;out.push(...this.bolt(t+i*0.2,0.12,p,add(p,[Math.cos(a)*r*1.1,e*r,Math.sin(a)*r*1.1]),{w:0.05,n:4,amp:0.15}));}
    return out;},
  shot(t,T,p0,p1,s=1){const C=this.C,b=body(t,T,p0,p1,{shape:'sphere',mat:'energy',col:C.hi,col2:C.deep,scale:0.22*s,rim:2.6,scroll:4}),nm=b.nm;return [b.fix(),
    L('halo',{_n:'aura',at:t,life:T,col:C.main,size:1.1*s,size0:1.1*s,k:0.9,pos:{'0':p0,'1':p1}}),
    L('trail',{_n:'tail',at:t,life:T,of:nm,col:'#ffffff',col2:C.main,w:0.16*s,tlife:0.14,k:2}),
    emit(t,T,{nm:'crackle',rate:40,from:'mesh',of:nm,dir:'random',speed:[1,3],plife:[0.08,0.16],look:'streak',size:[1.6,2.4],col:C.core,c2:C.main,gravity:0})];},
  hit(t,p,r=2,k=1){const C=this.C,g=[p[0],0,p[2]],out=[flash(t,add(p,[0,0.3,0]),r*0.9,C.core,0.08),halo(t,add(p,[0,0.3,0]),r*1.5,C.main,0.4),
    ringG(t,add(g,[0,0.08,0]),r*1.4,C.hi,0.35,0.6),shock(t,g,r*2,'#ffffff',0.4,1.1),
    sparks(t,add(p,[0,0.2,0]),Math.round(14+r*8),C.core,C.main,{speed:[3+r*2,7+r*3],look:'streak',g:2}),
    ...(k>=0.25?[light(t,0.3,add(g,[0,1.4,0]),C.main,2.2,r*4+6)]:[]),...(k>0.6?[shake(t,1.6+r*0.7,{kick:0.3})]:[])];
    const n=Math.min(7,3+Math.round(r));for(let i=0;i<n;i++){const a=i/n*Math.PI*2+rnd()*0.4;out.push(...this.bolt(t+rnd()*0.06,0.16,add(p,[0,0.2,0]),add(g,[Math.cos(a)*r*1.1,0.1,Math.sin(a)*r*1.1]),{w:0.07,n:5,amp:0.25}));}
    return [...out,...this.sig(t,p,r)];},
  strike(t,p,h=14,w=0.22){const g=[p[0],0,p[2]];return [...this.bolt(t,0.22,add(g,[0.6,h,-0.4]),add(g,[0,0.1,0]),{w,br:2,n:12,amp:0.9}),...this.bolt(t+0.07,0.16,add(g,[-0.5,h,0.5]),add(g,[0.1,0.1,0.1]),{w:w*0.6,n:10,amp:0.8}),flash(t,add(g,[0,h*0.5,0]),3,this.C.core,0.06)];},
  beam(t,d,p0,p1,w=0.35){const C=this.C,len=Math.hypot(p1[0]-p0[0],p1[1]-p0[1],p1[2]-p0[2]),yaw=yawOf(p0,p1),out=[
    mesh(t,d,{nm:'beam',pos:p0,shape:'beam',mat:'energy',col:C.main,col2:C.deep,yaw,scale:{'0':[w*0.3,w*0.3,len],'0.06':[w*1.2,w*1.2,len],'0.9':[w*1.2,w*1.2,len],'1':[0.02,0.02,len]},rim:2.2,scroll:6}),
    mesh(t,d,{nm:'beamCore',pos:p0,shape:'beam',mat:'glow',col:C.hi,yaw,scale:{'0':[w*0.06,w*0.06,len],'0.06':[w*0.22,w*0.22,len],'0.9':[w*0.22,w*0.22,len],'1':[0.01,0.01,len]}}),
    flash(t,p0,1.2,C.core,d,{size0:0.8}),halo(t,p1,2,C.main,d,{size0:1.6,k:0.8}),
    emit(t,d,{nm:'endSpit',rate:60,pos:p1,from:'point',dir:'out',spread:1.4,speed:[3,8],plife:[0.12,0.25],look:'streak',size:[1.6,2.4],col:C.core,c2:C.main,gravity:3}),light(t,d,lerp3(p0,p1,0.5),C.main,1.8,len)];
    for(let i=0;i<Math.max(2,Math.round(d*8));i++)out.push(...this.bolt(t+i*0.12,0.14,p0,p1,{w:0.1,n:Math.round(4+len*0.6),amp:0.45}));
    return [...out,...this.sig(t,p1,0.6)];},
  line(t,d,p0,p1){const out=[],len=Math.hypot(p1[0]-p0[0],p1[2]-p0[2]),n=Math.max(3,Math.round(len/4.5));
    for(let i=0;i<n;i++){const u=(i+0.5)/n,p=lerp3(p0,p1,u);out.push(...this.strike(t+u*d,p,10+rnd()*4,0.18),ringG(t+u*d,[p[0],0.08,p[2]],1.6,this.C.hi,0.3,0.6));}
    out.push(L('mesh',{_n:'scar',at:t,life:d+1,att:'ground',pos:[0,0.12,0],shape:'ribbon',path:[0,0.25,0.5,0.75,1].map(u=>[r2(p0[0]+(p1[0]-p0[0])*u),0,r2(p0[2]+(p1[2]-p0[2])*u)]),wk:2,mat:'energy',col:this.C.main,col2:this.C.deep,op:{'0':0,'0.1':1,'0.7':0.6,'1':0},rim:1.6,scroll:4}));
    return [...out,...this.sig(t+d,p1,1)];},
  tele(t,d,p,r){const C=this.C;return [mesh(t,d,{nm:'mark',att:'ground',pos:[p[0],0.06,p[2]],shape:'ring',inner:0.88,mat:'glow',col:C.hi,scale:{'0':r*0.2,'0.3':r,'1':r,ease:'out'},op:{'0':0,'0.2':0.9,'1':1},spin:-60}),
    decal(t,d,p,'glyph',r*0.9,{col:C.main})];},
  aura(t,d,r=1.4){const C=this.C,out=[mesh(t,d,{nm:'skin',att:'feet',pos:[0,1,0],shape:'sphere',mat:'energy',col:C.hi,col2:C.deep,scale:{'0':0.5,'0.12':[r*0.75,r,r*0.75],'1':[r*0.75,r,r*0.75]},op:{'0':0,'0.12':0.35,'0.9':0.35,'1':0},rim:2.6,scroll:5}),
    emit(t,d,{nm:'static',rate:30,att:'feet',pos:[0,1,0],from:'sphere',fr:r*0.7,dir:'random',speed:[1,3],plife:[0.08,0.16],look:'streak',size:[1.6,2.4],col:C.core,c2:C.main,gravity:0}),light(t,d,[0,1.4,0],C.main,1.3,8)];
    for(let i=0;i<Math.round(d*4);i++){const a=rnd()*Math.PI*2,b=rnd()*Math.PI*2;out.push(...this.bolt(t+i*0.25,0.14,[Math.cos(a)*r*0.5,0.4+rnd()*1.6,Math.sin(a)*r*0.5],[Math.cos(b)*r*0.6,0.4+rnd()*1.6,Math.sin(b)*r*0.6],{w:0.05,n:5,amp:0.2,att:'feet'}));}
    return [...out,...this.sigAmb(t,d,[0,0,0],r)];},
  zone(t,d,p,r){const C=this.C,g=[p[0],0,p[2]],out=[mesh(t,d,{nm:'field',att:'ground',pos:add(g,[0,0.05,0]),shape:'disc',mat:'energy',col:C.main,col2:C.deep,scale:{'0':0.1,'0.08':r,'1':r,ease:'out'},op:{'0':0.6,'0.85':0.4,'1':0},rim:1.6,scroll:3}),
    mesh(t,d,{nm:'rim',att:'ground',pos:add(g,[0,0.07,0]),shape:'ring',inner:0.95,mat:'glow',col:C.hi,scale:{'0':0.1,'0.08':r,'1':r,ease:'out'},op:{'0':1,'0.85':0.8,'1':0},spin:30})];
    for(let i=0;i<Math.round(d*5);i++){const a=rnd()*Math.PI*2,b=a+0.6+rnd()*0.8,rr=r*(0.4+rnd()*0.55);out.push(...this.bolt(t+i*0.2,0.14,add(g,[Math.cos(a)*rr,0.15,Math.sin(a)*rr]),add(g,[Math.cos(b)*rr,0.15,Math.sin(b)*rr]),{w:0.06,n:5,amp:0.25}));}
    return [...out,...this.sigAmb(t,d,g,r)];},
  orb(t,d,p){const C=this.C,out=[mesh(t,d,{nm:'orb',att:'feet',pos:{'0':p,'0.5':add(p,[0,0.2,0]),'1':p},shape:'sphere',mat:'energy',col:C.hi,col2:C.deep,scale:{'0':0.05,'0.1':0.3,'1':0.3},rim:2.6,scroll:4}),halo(t,p,1.2,C.main,d,{size0:1,k:0.8,att:'feet'})];
    for(let i=0;i<Math.round(d*4);i++){const a=rnd()*Math.PI*2;out.push(...this.bolt(t+i*0.25,0.1,p,add(p,[Math.cos(a)*0.5,rnd()*0.6-0.3,Math.sin(a)*0.5]),{w:0.04,n:3,amp:0.1,att:'feet'}));}
    return out;},
  dome(t,d,p,r){const C=this.C,g=[p[0],0,p[2]];return [mesh(t,d,{nm:'dome',att:'ground',pos:g,shape:'dome',mat:'energy',col:C.hi,col2:C.deep,scale:{'0':0.2,'0.1':r,'1':r*0.9,ease:'out'},op:{'0':0,'0.1':0.5,'0.85':0.4,'1':0},rim:2.6,scroll:3}),
    ...this.zone(t,d,p,r),emit(t,d,{nm:'pull',rate:50,att:'ground',pos:add(g,[0,1,0]),from:'sphere',fr:r,dir:'in',speed:[3,6],plife:[0.3,0.5],look:'streak',size:[1.8,2.6],col:C.core,c2:C.main,gravity:0})];},
  siphon(t,d,pts){const C=this.C,out=[];pts.forEach((q,i)=>{out.push(...this.bolt(t+i*0.05,d*0.6,add(q,[0,1,0]),[0,1.2,0],{w:0.09,n:8,amp:0.4}),...this.hit(t+i*0.05,add(q,[0,0.8,0]),0.7,0.2),
    emit(t+i*0.05,d*0.6,{nm:'drain',rate:40,pos:add(q,[0,1,0]),from:'sphere',fr:0.4,dir:'aim',speed:[6,9],plife:[0.25,0.4],look:'streak',size:[1.8,2.6],col:C.core,c2:C.main,gravity:0,yaw:yawOf(q,[0,0,0])}));});
    return [...out,...this.aura(t+d*0.5,d,1.2)];},
  shield(t,d,p){const C=this.C;return [mesh(t,d,{nm:'wall',pos:p,shape:'model',model:'shield_dome',mat:'energy',col:C.hi,col2:C.deep,scale:{'0':0.2,'0.1':1.3,'1':1.3,ease:'out'},op:{'0':0,'0.1':0.55,'0.9':0.5,'1':0},rim:2.6,scroll:4}),
    ...this.zone(t,d,[p[0],0,p[2]],1.2)];},
  dash(t,p0,p1){const C=this.C,T=0.22,b=body(t,T,add(p0,[0,1,0]),add(p1,[0,1,0]),{shape:'sphere',mat:'glow',col:C.core,scale:0.25}),nm=b.nm;return [b.fix(),
    L('trail',{_n:'tail',at:t,life:T+0.05,of:nm,col:'#ffffff',col2:C.main,w:0.9,tlife:0.3,k:2.2}),
    ...this.bolt(t+0.03,0.25,add(p0,[0,1,0]),add(p1,[0,1,0]),{w:0.1,n:10,amp:0.45}),...this.bolt(t+0.1,0.2,add(p0,[0,0.6,0]),add(p1,[0,0.7,0]),{w:0.06,n:10,amp:0.5}),
    ...this.sig(t,add(p0,[0,1,0]),0.8),...this.hit(t+T,add(p1,[0,0.8,0]),1.4,0.4)];},
  rail(t,warn,p0,p1){const C=this.C,len=Math.hypot(p1[0]-p0[0],p1[1]-p0[1],p1[2]-p0[2]),yaw=yawOf(p0,p1);return [
    mesh(t,warn,{nm:'guide',pos:p0,shape:'beam',mat:'glow',col:C.hi,yaw,scale:{'0':[0.02,0.02,len*0.1],'0.3':[0.05,0.05,len],'1':[0.07,0.07,len]},op:{'0':0.3,'0.9':0.9,'1':1}}),
    ...this.charge(t,warn,p0,0.8),...this.beam(t+warn,0.4,p0,p1,0.7),flash(t+warn,p0,4,C.core,0.1),shake(t+warn,4,{kick:0.4}),...this.sig(t+warn,p1,1.2)];},
};
const ST={
// ---- 1 พลาสมาม่วงเทสลา: ลูกพลาสมา อาร์กม่วง-ชมพูแตกกิ่ง วงเทสลาหมุน ----
tesla:{name:'พลาสมาม่วงเทสลา',desc:'พลาสมาม่วง-ชมพูแบบขดลวดเทสลา — อาร์กไฟฟ้าแตกกิ่งสีม่วง ลูกพลาสมาเรือง วงแหวนเทสลาหมุน',
  C:{core:'#fff0ff',hi:'#e2a6ff',main:'#b04dff',deep:'#3a0a78'},
  sig(t,p,r){const C=this.C;return [mesh(t,0.45,{nm:'coil',pos:p,shape:'torus',inner:0.9,mat:'energy',col:C.hi,col2:C.deep,bill:true,scale:{'0':0.1,'1':0.9*r+0.4,ease:'out'},op:{'0':1,'1':0},rim:2.4,spin:300}),
    mesh(t+0.06,0.4,{nm:'coilB',pos:p,shape:'torus',inner:0.92,mat:'energy',col:'#ff9ef0',col2:C.deep,yaw:60,scale:{'0':0.1,'1':0.7*r+0.3,ease:'out'},op:{'0':1,'1':0},rim:2.4,spin:-260})];},
  sigAmb(t,d,p,r){const C=this.C;return [mesh(t,d,{nm:'tesla',att:'ground',pos:[p[0],0.06,p[2]],shape:'ring',inner:0.8,mat:'tex',tex:'tex/electric_arc',col:C.hi,col2:C.main,scale:{'0':0.2,'0.1':Math.max(1,r),'1':Math.max(1,r)},spin:90,op:{'0':0,'0.1':0.8,'0.9':0.6,'1':0}})];},
},
// ---- 2 สายฟ้าแดงเลือด: สายฟ้าแดงเข้ม ควันดำ ประกายแดง รอยไหม้ดำ ----
crimson:{name:'สายฟ้าแดงเลือด',desc:'สายฟ้าสีแดงเลือดหนักและดุ — ฟ้าผ่าแดงแกนขาว ควันดำพุ่ง ประกายแดงกระเด็น รอยไหม้ดำบนพื้น',
  C:{core:'#fff0ea',hi:'#ff8c8c',main:'#ff1f3a',deep:'#2a0006'},
  sig(t,p,r){return [sparks(t,p,Math.round(8+r*5),'#ffd6cc','#ff1f3a',{speed:[3,8],g:8,look:'spark'}),
    emit(t,0.05,{nm:'slivers',burst:Math.round(6+r*4),pos:p,from:'sphere',fr:0.2,dir:'out',speed:[4*r+2,8*r+3],plife:[0.12,0.22],look:'streak',size:[2.2,3.2],col:'#ffffff',c2:'#ff1f3a',gravity:0,drag:3}),
    halo(t,p,1.4*r+0.6,'#ff1f3a',0.25,{size0:0.4,k:1.1})];},
  sigAmb(t,d,p,r){return [decal(t,d+0.6,p,'dark',Math.max(1,r*0.8),{op:0.6}),
    emit(t,d,{nm:'ash',rate:Math.min(30,6+r*3),att:'ground',pos:[p[0],0.3,p[2]],from:'disc',fr:r,dir:'up',speed:[0.4,1.2],plife:[1,1.6],look:'smoke',fb:'tex/smoke_puff',size:[6,10],col:'#1a0608',c2:'#3a0a10',gravity:-0.3,x:true})];},
},
// ---- 3 เทพสายฟ้าทอง: สายฟ้าทองแกนขาว (ชั้น bolt) วงรูนศักดิ์สิทธิ์ หอกสายฟ้า ดาวทอง ----
divine:{name:'เทพสายฟ้าทอง',desc:'สายฟ้าศักดิ์สิทธิ์สีทอง — วงรูนเวทลอย ฟ้าผ่าทองแกนขาวหนา หอกสายฟ้า ดาวแสงทอง ดูเป็นพลังเทพ',
  C:{core:'#fffdf0',hi:'#ffe9a0',main:'#ffc23a',deep:'#a86a08'},
  bolt(t,life,p0,p1,o={}){const to=[r2(p1[0]-p0[0]),r2(p1[1]-p0[1]),r2(p1[2]-p0[2])];return [L('bolt',{_n:'bolt',at:t,life,pos:p0,to,n:1,jit:o.amp===undefined?0.3:o.amp,w:Math.max(0.05,(o.w||0.14)*1.1),br:o.br||0,blife:Math.min(0.2,life),...(o.att?{att:o.att}:{})})];},
  sig(t,p,r){const C=this.C;return [mesh(t,0.6,{nm:'sigil',pos:p,shape:'disc',mat:'tex',tex:'tex/magic_circle',col:C.hi,col2:C.main,bill:true,scale:{'0':0.2,'0.3':1.2*r+0.5,'1':1.4*r+0.6,ease:'out'},spin:80,op:{'0':0,'0.2':0.9,'1':0}}),
    emit(t,0.05,{nm:'gold',burst:Math.round(8+r*6),pos:p,from:'sphere',fr:0.3*r,dir:'out',speed:[2*r,4*r],plife:[0.4,0.7],look:'glow',fb:'tex/star_flare',size:[2.4,3.6],col:'#ffffff',c2:C.main,gravity:-0.4,drag:3})];},
  sigAmb(t,d,p,r){const C=this.C;return [mesh(t,d,{nm:'circle',att:'ground',pos:[p[0],0.06,p[2]],shape:'disc',mat:'tex',tex:'tex/magic_circle_spin',col:C.hi,col2:C.main,scale:{'0':0.2,'0.12':Math.max(1.2,r*1.05),'1':Math.max(1.2,r*1.05),ease:'out'},spin:25,op:{'0':0,'0.12':0.85,'0.9':0.7,'1':0}}),
    mesh(t,d,{nm:'spear',att:'ground',pos:[p[0],Math.max(2.2,r*0.4)+0.5,p[2]],shape:'model',model:'energy_spear',mat:'glow',col:C.hi,rot:[180,0,0],scale:{'0':0.1,'0.15':Math.min(1.6,0.6+r*0.1),'1':Math.min(1.6,0.6+r*0.1)},op:{'0':0,'0.15':0.8,'0.85':0.7,'1':0},spin:60})];},
},
// ---- 4 พายุเมฆ: เมฆดำหมุนเหนือหัว ฝนสาด ฟ้าผ่าจากเมฆ (ชั้น bolt สีฟ้า) ลมหมุน ----
tempest:{name:'พายุเมฆ',desc:'พายุฝนฟ้าคะนอง — เมฆดำหมุนวนเหนือจุด ฝนสาดเป็นเส้น ฟ้าผ่าลงมาจากเมฆสีขาวฟ้า ลมหมุนพัดฝุ่น',
  C:{core:'#f2f8ff',hi:'#b9dcff',main:'#5aa8ff',deep:'#1c3460'},
  bolt(t,life,p0,p1,o={}){return zig(t,life,p0,p1,{col:'#7fb8ff',col2:'#1c3460',core:'#f2f8ff',w:o.w||0.14,br:o.br,n:o.n,amp:o.amp,att:o.att});},
  cloud(t,d,p,r){return [L('mesh',{_n:'cloud',at:t,life:d,att:'ground',pos:[p[0],Math.min(9,5+r*0.3),p[2]],shape:'disc',mat:'tex',tex:'tex/noise_clouds',col:'#2b3550',col2:'#8fa8d8',rim:0.6,rot:[180,0,0],uvTile:[2,2],uvScroll:[0.06,0.03],scale:{'0':0.3,'0.15':Math.max(3,r*1.3),'1':Math.max(3,r*1.3),ease:'out'},spin:20,op:{'0':0,'0.15':0.9,'0.85':0.85,'1':0}}),
    emit(t,d,{nm:'rain',rate:Math.min(120,30+r*10),att:'ground',pos:[p[0],Math.min(8,4.5+r*0.3),p[2]],from:'disc',fr:Math.max(1.5,r),dir:'down',spread:0.15,speed:[14,18],plife:[0.3,0.4],look:'streak',size:[1.6,2.2],col:'#cfe2ff',c2:'#6f8ec8',gravity:4,drag:0})];},
  sig(t,p,r){return [emit(t,0.05,{nm:'spray',burst:Math.round(10+r*6),pos:p,from:'disc',fr:0.3*r,dir:'flat',speed:[3*r,6*r],plife:[0.25,0.45],look:'streak',size:[1.8,2.6],col:'#e6f0ff',c2:this.C.main,gravity:2,drag:3}),
    smoke(t,[p[0],Math.max(0.2,p[1]-0.4),p[2]],Math.round(3+r*2),'#5a6680',{fr:0.3*r+0.2,size:[10,16],speed:[1,2.4],dir:'out',c2:'#2b3550'})];},
  sigAmb(t,d,p,r){return [...this.cloud(t,d,p,r),mesh(t,d,{nm:'wind',att:'ground',pos:[p[0],0,p[2]],shape:'model',model:'tornado',mat:'tex',tex:'tex/noise_clouds',col:'#cfe2ff',col2:'#5a6680',scale:{'0':[0.2,0.2,0.2],'0.12':[Math.min(r,3)*0.35,0.6,Math.min(r,3)*0.35],'1':[Math.min(r,3)*0.38,0.6,Math.min(r,3)*0.38]},spin:260,op:{'0':0,'0.12':0.25,'0.85':0.2,'1':0},uvScroll:[0.5,0.4]})];},
},
};
for(const k in ST)Object.setPrototypeOf(ST[k],STORM_BASE);
const SORDER=['tesla','crimson','divine','tempest'];

// ======================================================================
//  ท่าน้ำแข็ง (ตามเกม js/07-frost-spells.js + js/04)
// ======================================================================
const WAND=[0.35,1.45,0.6];
const FMOVES={
  sword:['ดาบน้ำแข็ง คอมโบ 3 จังหวะ (ระยะ ~6 ม.)','front0',K=>[...K.slash(0,-75,65,2.6,-18),...K.hit(0.12,[0.6,1,2.6],0.9,0.2),...K.slash(0.32,70,-70,2.6,20),...K.hit(0.44,[-0.6,1,2.6],0.9,0.2),...K.slash(0.66,-30,30,3.2,-80,1.4),...K.hit(0.78,[0,0.4,3],1.8,0.7)]],
  icicle:['แท่งน้ำแข็ง (ยิงไกลโหมด V)','front0',K=>[...K.cast(0,WAND,0.9),...K.shot(0.03,0.3,WAND,[0,1.3,14],1),...K.hit(0.33,[0,1.3,14],1.2,0.3)]],
  shield:['โล่น้ำแข็ง (คลิกขวาค้าง) ยื่นออกหน้าตัวนิดหน่อย • โดนตีที่ 1.2 วิ','self',K=>[...K.shield(0,2.6,[0,1.2,1.3]),...K.hit(1.2,[0,1.2,1.5],1.2,0.3)]],
  slide:['Dash ไถลน้ำแข็ง ~10 ม.','self',K=>[...K.dash(0,[0,0,0],[0,0,10])]],
  frostforge:['Frostforge — ดาบกลายเป็นขวานศึก (ประชิด) + ทุบ / ก้อนน้ำแข็งระเบิด (ไกล วง 5 ม.)','front0',K=>[...K.charge(0,0.6,[0.5,1.3,0.7],1),...K.blade(0.4,1.6,[0.7,1.7,0.6],'frost_axeblade'),...K.slash(1.1,-20,20,3,-85,1.6),...K.hit(1.22,[0,0.3,3],2.5,0.8)]],
  glacierrend:['Glacier Rend — ชาร์จ 1 วิ ส่งคลื่นดาบไกล 30 ม. ทิ้งทางน้ำแข็ง','front',K=>[...K.charge(0,1,[0.5,1.3,0.8],1),...K.slash(1,-60,60,3,0,1.4),...K.shot(1.02,0.7,[0,1,1.5],[0,1,30],2.2),...K.line(1.02,2.6,[0,0,1.5],[0,0,30],2.4),...K.hit(1.72,[0,1,30],2,0.5)]],
  glacierridge:['Glacier Rend โหมดไกล — ภูเขาน้ำแข็งแหลมพุ่งเป็นแนว','front',K=>[...K.charge(0,1,WAND,0.8),...K.cast(1,WAND,1.2),...K.ridge(1.05,2.4,[0,0,3],[0,0,24],8)]],
  permafrost:['Permafrost — พื้นน้ำแข็งวงใหญ่รอบตัว (รัศมี 15 ม.)','front',K=>[...K.hit(0,[0,0.2,0],2.5,0.8),...K.zone(0.05,3,[0,0,0],15)]],
  cryoshell:['Cryo Shell — แช่แข็งตัวเอง 5 วิ (อมตะ)','self',K=>[...K.shell(0,3)]],
  frostaura:['Frostbite Aura — ออร่าเยือกแข็งรอบตัว (รัศมี 9 ม.)','front',K=>[...K.cast(0,[0,1,0],1.4),...K.aura(0,3,9)]],
  mirrorlegion:['อัลติ Mirror Legion — ดาบ/ขวานน้ำแข็งลอยข้างตัว 2 เล่ม','self',K=>[...K.hit(0,[0,0.3,0],3,1),...K.blade(0.15,3,[-1.3,1.6,-0.2],'frost_blade'),...K.blade(0.25,3,[1.3,1.6,-0.2],'frost_axeblade'),...K.aura(0.1,3,2)]],
};
// ======================================================================
//  ท่าสายฟ้า (ตามเกม js/08-storm.js + js/09)
// ======================================================================
const SMOVES={
  beam:['ลำสายฟ้า (กดค้าง ระยะ 15 ม.)','front0',K=>[...K.cast(0,WAND,1),...K.beam(0.02,1.6,WAND,[0,1.2,15],0.3)]],
  tri:['สายฟ้าสามเหลี่ยม (ยิงไกล)','front0',K=>[...K.cast(0,WAND,0.9),...K.shot(0.03,0.28,WAND,[-0.6,1.3,14],0.9),...K.shot(0.06,0.28,WAND,[0.6,1.3,14],0.9),...K.shot(0.09,0.28,WAND,[0,2,14],0.9),...K.hit(0.37,[0,1.4,14],1.4,0.3)]],
  shield:['โล่สายฟ้า (คลิกขวาค้าง) • โดนตีที่ 1.2 วิ','self',K=>[...K.shield(0,2.6,[0,1.2,1]),...K.hit(1.2,[0,1.2,1.4],1.2,0.3)]],
  dash:['Dash ทะลุศัตรู ~8 ม. (3 ชาร์จ)','self',K=>[...K.dash(0,[0,0,0],[0,0,8])]],
  thunderline:['เส้นสายฟ้า — ชูไม้แล้วผ่าเป็นแนวยาว 30 ม.','front',K=>[...K.charge(0,0.5,[0.3,2.2,0.4],0.8),...K.line(0.5,0.35,[0,0,2],[0,0,30])]],
  speedsiphon:['ดูดความเร็ว — ดูดสายฟ้าจากศัตรูรอบตัว (รัศมี 10 ม.)','front',K=>[...K.cast(0,[0,1,0],1.2),...K.siphon(0.05,1,[[-5,0,6],[4,0,7],[0,0,9]]),...K.zone(0,0.5,[0,0,0],10)]],
  triplestrike:['ฟ้าผ่าสามครั้ง — วงเตือน แล้วผ่าจุดเดิม 3 ครั้ง (รัศมี 3.5 ม.)','front',K=>[...K.tele(0,1.7,[0,0,12],3.5),...K.strike(0.6,[0,0,12]),...K.hit(0.62,[0,0.3,12],3.5,0.8),...K.strike(1.1,[0,0,12]),...K.hit(1.12,[0,0.3,12],3.5,0.8),...K.strike(1.6,[0,0,12]),...K.hit(1.62,[0,0.3,12],3.5,1)]],
  stormorbs:['ออร์บสายฟ้าคู่ลอยหลังตัว — Dash โดนแล้วยิงออร์บ','self',K=>[...K.orb(0,2.4,[-0.7,1.9,-0.6]),...K.orb(0,1.5,[0.7,1.9,-0.6]),...K.shot(1.5,0.35,[0.7,1.9,-0.6],[0,1,9],1.2),...K.hit(1.85,[0,1,9],1.4,0.4)]],
  railgun:['Railgun — เส้นนำทาง 0.8 วิ แล้วยิงลำทะลุ 45 ม.','front0',K=>[...K.rail(0,0.8,WAND,[0,1.4,45]),...K.hit(1.25,[0,1.4,20],1.6,0.5)]],
  stormdome:['ลูกสายฟ้าโดม — ทะยานขึ้นรวมพลัง แล้วยิงลงเป็นโดมดูด (รัศมี 7.5 ม.)','front',K=>[...K.charge(0,1.2,[0,4,0.6],1.3),...K.shot(1.2,0.3,[0,4,0.6],[0,0.5,12],1.8),...K.hit(1.5,[0,0.5,12],3,0.9),...K.dome(1.55,2,[0,0,12],7.5)]],
  godlightning:['อัลติ ร่างเทพสายฟ้า 10 วิ','self',K=>[...K.strike(0,[0,0,0],16,0.3),...K.hit(0.05,[0,0.3,0],3,1),...K.aura(0.1,3,1.6)]],
};

// ---------- เขียนไฟล์ ----------
const only=process.argv.slice(2);let n=0;
for(const [m,[th,at,fn]] of Object.entries(FMOVES)){if(only.length&&!only.includes(m)&&!only.includes('frost-'+m))continue;
  FORDER.forEach((k,i)=>{N=0;SEED=1000+i*97+m.length*13;const K=FT[k];W('var3-frost',`${m}_${i+1}`,{desc:`แบบ ${i+1} (${K.name}): ${th} — ${K.desc}`,tags:['ice','variant3',k],pal:'ice',at,layers:fn(K)});n++;});}
for(const [m,[th,at,fn]] of Object.entries(SMOVES)){if(only.length&&!only.includes(m)&&!only.includes('storm-'+m))continue;
  SORDER.forEach((k,i)=>{N=0;SEED=2000+i*97+m.length*13;const K=ST[k];W('var3-storm',`${m}_${i+1}`,{desc:`แบบ ${i+1} (${K.name}): ${th} — ${K.desc}`,tags:['storm','variant3',k],pal:'storm',at,layers:fn(K)});n++;});}
let prev={};try{prev=JSON.parse(fs.readFileSync(path.join(__dirname,'vfx-var3-at.json'),'utf8'));}catch(e){}
fs.writeFileSync(path.join(__dirname,'vfx-var3-at.json'),JSON.stringify(Object.assign(prev,AT),null,0));console.log('เขียน',n,'ไฟล์');
