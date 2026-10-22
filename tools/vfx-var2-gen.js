// VFX ตัวเลือก รอบ 2 (ผู้ใช้ 2026-10-23: "design new … 4 effect a skill in every skill fire and earth")
// → assets/fx/var2-fire/<ท่า>_<1-4>.fx.json + assets/fx/var2-earth/<ท่า>_<1-4>.fx.json (ยังไม่ผูกกับเกม — ให้ผู้ใช้เลือก)
// ใช้: node tools/vfx-var2-gen.js [ท่า ...]   (ไม่ใส่ = ทุกท่า) • แล้ว node tools/fx-check.js
// กติกาไฟของผู้ใช้ (notes/vfx-notes.md): ห้ามเปลวไฟเล็ก ๆ แบบภาพ flipbook / ห้ามไฟเล็ก ๆ หลายดวงเรียงกัน → ไม่ใช้อนุภาค look:'fire' เลย
//   ไฟก้อนใหญ่/แนวไฟ = firevol (ไฟ 3 มิติจริง) หรือ mesh วัสดุ fire (shader) • อนุภาคที่ใช้ได้ = ประกาย/ถ่าน/ควัน/แสง/โมเดล
// ธีมไฟ 4 แบบ (ไม่ซ้ำ A/B/C ของเพื่อน): 1 ไฟสุริยะ (พลาสมาขาวทอง) • 2 ไฟนรก (แดงเข้ม-ดำ หินออบซิเดียน) • 3 นกไฟฟีนิกซ์ (ปีก/ขนนก) • 4 เหล็กหลอม (ลาวาเหลว ประกายเชื่อม ไอน้ำ)
// ธีมดิน 4 แบบ: 1 หินผลึกม่วง • 2 หินรูนโบราณ (เรืองหยก) • 3 หินหลอมเหลว (หินดำ รอยแตกลาวา) • 4 พายุทราย
// กรอบ: ผู้ร่ายยืนที่ 0 หันไป +z • หน่วยเมตร/วินาที • ขนาดตามเกมจริง (20 px = 1 ม.)
const fs=require('fs'),path=require('path');
const FXD=path.join(__dirname,'..','assets','fx');
let N=0;const nid=s=>s+(++N);
const L=(t,o)=>Object.assign({id:nid(o._n||t),t},(()=>{const q=Object.assign({},o);delete q._n;return q;})());
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const AT={};   // กล้องสำหรับรูปเทียบ (self = ที่ตัวผู้ร่าย, front = มองไปข้างหน้า) → tools/vfx-var2-sheets
const W=(group,name,o)=>{const d=path.join(FXD,group);fs.mkdirSync(d,{recursive:true});
  let end=0;for(const l of o.layers){const at=typeof l.at==='number'?l.at:0,li=typeof l.life==='number'?l.life:1;end=Math.max(end,at+li+(l.t==='emit'&&Array.isArray(l.plife)?l.plife[1]:0));}
  const out=Object.assign({v:1},o,{dur:o.dur||Math.min(12,Math.ceil(end*10+2)/10)});AT[group+'/'+name]=out.at;delete out.at;
  fs.writeFileSync(path.join(d,name+'.fx.json'),JSON.stringify(out,null,1)+'\n');};
// ---------- ชิ้นพื้นฐาน ----------
const flash=(at,p,size,col,life=0.1,o={})=>L('flash',{_n:'flash',at,life,pos:p,col,size,...o});
const halo=(at,p,size,col,life=0.35,o={})=>L('halo',{_n:'halo',at,life,pos:p,col,size,k:o.k||1,...o});
const light=(at,life,p,col,int=1.8,dist=12)=>L('light',{_n:'light',at,life,pos:p,col,int:{'0':int,'1':0},dist});
const shake=(at,s,o={})=>L('screen',{_n:'cam',at,life:o.life||0.25,shake:s,own:true,...o});
const snd=(at,name,vol=0.6)=>L('sound',{_n:'snd',at,life:0.05,name,vol});
const ringG=(at,p,r,col,life=0.45,op=0.5)=>L('ring',{_n:'ring',at,life,att:'ground',pos:p,col,r,op});
const ringV=(at,p,r,col,life=0.25,op=0.7)=>L('ring',{_n:'ringv',at,life,pos:p,col,r,op,vert:true});
const shock=(at,p,size,col='#ffb070',life=0.45,str=1.2)=>L('warp',{_n:'shock',at,life,att:'ground',pos:[p[0],0.2,p[2]],kind:'shock',flat:true,size:{'0':0.5,'1':1,x:size},op:{'0':1,'1':0},str,col,x:true});
const haze=(at,life,p,size,str=0.8)=>L('warp',{_n:'haze',at,life,pos:p,kind:'haze',size,str,op:{'0':0,'0.15':1,'0.8':1,'1':0},x:true});
const bulge=(at,life,p,size,str=0.8,col='#ffd890')=>L('warp',{_n:'bulge',at,life,pos:p,kind:'bulge',size:{'0':0.3,'1':1,x:size},str,op:{'0':1,'1':0},col,x:true});
const decal=(at,life,p,kind,r,o={})=>L('decal',{_n:'decal',at,life,att:'ground',pos:[p[0],0,p[2]],kind,r,...o});
const emit=(at,life,o)=>L('emit',{_n:o.nm||'emit',at,life,...(()=>{const q=Object.assign({},o);delete q.nm;return q;})()});
const mesh=(at,life,o)=>L('mesh',{_n:o.nm||'mesh',at,life,...(()=>{const q=Object.assign({},o);delete q.nm;return q;})()});
const smoke=(at,p,n,col,o={})=>emit(at,0.06,{nm:'smoke',burst:Math.max(2,Math.round(n*0.6)),pos:p,from:'disc',fr:o.fr||1,dir:o.dir||'up',spread:1.1,speed:o.speed||[0.6,1.8],plife:o.plife||[1,1.7],look:'smoke',fb:'tex/smoke_puff',size:(o.size||[10,16]).map(v=>v*0.6),col,c2:o.c2||col,gravity:-0.35,grow:1.1,drag:2,x:true,...(o.att?{att:o.att}:{})});
const sparks=(at,p,n,col,c2,o={})=>emit(at,0.05,{nm:'sparks',burst:n,pos:p,from:o.from||'sphere',fr:o.fr||0.3,dir:o.dir||'out',spread:o.spread||1.2,speed:o.speed||[4,10],up:o.up||[0,0],plife:o.plife||[0.25,0.55],look:o.look||'spark',size:o.size||[1.6,2.6],col,c2,gravity:o.g===undefined?6:o.g,drag:o.drag||2,...(o.att?{att:o.att}:{})});
const debris=(at,p,n,kind,speed,r,o={})=>L('debris',{_n:'debris',at,life:o.life||1.3,att:'ground',pos:[p[0],0.3,p[2]],kind,n,speed,r,size:o.size||1,x:o.x});
const chunks=(at,p,n,model,mmat,col,c2,o={})=>emit(at,0.05,{nm:'chunks',burst:n,pos:p,att:o.att,from:o.from||'sphere',fr:o.fr||0.3,dir:o.dir||'out',spread:o.spread||1.2,speed:o.speed||[3,7],up:o.up||[2,5],plife:o.plife||[0.8,1.4],look:'model',model,mmat,msize:o.msize||[0.12,0.28],bounce:o.bounce===undefined?0.35:o.bounce,mspin:o.mspin||540,gravity:o.g===undefined?11:o.g,drag:o.drag||1,col,c2});
// ลายลาวาเรืองบนพื้น (ภาพลายเส้น noise_veins บนแผ่นราบ — แทนรอยแตกไฟลุกที่เป็นแผ่นไฟเล็ก ๆ)
const veins=(at,life,p,r,col='#ff5a14',col2='#ffb040')=>L('mesh',{_n:'veins',at,life,att:'ground',pos:[p[0],0.045,p[2]],shape:'disc',mat:'tex',tex:'tex/noise_veins',col,col2,rim:1.2,uvTile:[Math.max(1,Math.round(r/2)),Math.max(1,Math.round(r/2))],uvScroll:[0.02,0.01],scale:{'0':0.2,'0.08':r,'1':r,ease:'out'},op:{'0':0,'0.08':0.95,'0.7':0.8,'1':0}});
const fvol=(at,life,p,kind,hx,hz,h,o={})=>L('firevol',{_n:'fvol',at,life,att:'ground',pos:p,kind,hx,hz,h,int:o.int||1,den:o.den||1,...(o.hgt?{hgt:o.hgt}:{}),...(o.dis?{dis:o.dis}:{}),...(o.spd?{spd:o.spd}:{}),...(o.yaw!==undefined?{yaw:o.yaw}:{})});
// โปรเจกไทล์: ตัว (mesh วิ่งจาก p0 ไป p1 ใน T วิ) — คืนชื่อชั้นตัวไว้ให้หาง/อนุภาคตาม
function body(at,T,p0,p1,o){const nm=nid('shot');return {nm,layer:L('mesh',{_n:'x',at,life:T,...o,pos:{'0':p0,'1':p1},fade:0}),fix(){this.layer.id=nm;return this.layer;}};}

// ======================================================================
//  ธีมไฟ
// ======================================================================
const FT={
// ---- 1 ไฟสุริยะ: พลาสมาขาวทอง วงโคโรนา แสงแฟลร์ ห่วงพลาสมา คลื่นร้อน (ไม่มีเปลวไฟ) ----
solar:{name:'ไฟสุริยะ',desc:'พลาสมาขาวทองเหมือนดวงอาทิตย์ — วงโคโรนา แสงแฟลร์ดาว ห่วงพลาสมาโค้ง คลื่นความร้อนบิดอากาศ (ไม่มีเปลวไฟ)',
  C:{core:'#fffbea',hi:'#ffe58a',main:'#ffb83a',deep:'#ff7a1a',lt:'#ffd890'},
  charge(t,d,p,r=1){const C=this.C;return [
    mesh(t,d,{nm:'sun',pos:p,shape:'sphere',mat:'glow',col:C.core,scale:{'0':0.05,'1':0.42*r,ease:'in'}}),halo(t,p,2.4*r,C.main,d,{size0:0.4,k:0.9}),
    mesh(t,d,{nm:'corona',pos:p,shape:'ring',inner:0.86,mat:'energy',col:C.hi,col2:C.deep,bill:true,scale:{'0':0.2,'1':1.3*r,ease:'out'},spin:120,op:{'0':0,'0.3':0.9,'1':1},rim:2}),
    emit(t,d,{nm:'motes',pos:p,rate:50,from:'sphere',fr:1.4*r,dir:'in',speed:[2,4],plife:[0.3,0.4],look:'glow',fb:'tex/star_flare',size:[2,3.4],col:C.core,c2:C.main,gravity:0,drag:0}),
    haze(t,d,p,1.2*r,0.6),light(t,d,p,C.lt,1.4,7)];},
  cast(t,p,s=1){const C=this.C;return [flash(t,p,1.6*s,C.core,0.08),ringV(t,add(p,[0,0,0.3]),0.9*s,C.hi,0.2,0.8),
    emit(t,0.04,{nm:'flare',burst:1,pos:p,from:'point',dir:'out',speed:[0,0.1],plife:[0.22,0.22],look:'glow',fb:'tex/star_flare',size:[14*s,14*s],col:'#ffffff',c2:C.hi,gravity:0})];},
  shot(t,T,p0,p1,s=1){const C=this.C,b=body(t,T,p0,p1,{shape:'sphere',mat:'glow',col:C.core,scale:0.22*s}),nm=b.nm;return [b.fix(),
    L('halo',{_n:'aura',at:t,life:T,col:C.main,size:1.3*s,size0:1.3*s,k:0.9,pos:{'0':p0,'1':p1}}),
    L('trail',{_n:'tail',at:t,life:T,of:nm,col:'#ffffff',col2:C.main,w:0.22*s,tlife:0.16,k:2}),
    emit(t,T,{nm:'glint',rate:40,from:'mesh',of:nm,dir:'random',speed:[0.2,0.8],plife:[0.2,0.35],look:'glow',fb:'tex/star_flare',size:[2,3],col:C.core,c2:C.main,gravity:0})];},
  hit(t,p,r=2,k=1){const C=this.C,g=[p[0],0,p[2]];return [flash(t,add(p,[0,0.3,0]),r*0.9,C.core,0.1),halo(t,add(p,[0,0.3,0]),r*1.6,C.main,0.45),
    mesh(t,0.5,{nm:'corona',att:'ground',pos:add(g,[0,0.1,0]),shape:'model',model:'star_burst',mat:'glow',col:C.hi,scale:{'0':0.2,'1':1,ease:'out',x:r*0.55},op:{'0':1,'1':0}}),
    mesh(t,0.6,{nm:'loopA',pos:add(g,[0,0,0]),shape:'torus',inner:0.9,mat:'energy',col:C.hi,col2:C.deep,rot:[0,0,0],yaw:30,scale:{'0':[0.2,0.2,0.2],'1':[r*0.55,r*0.8,r*0.55],ease:'out'},op:{'0':1,'1':0},rim:2}),
    mesh(t+0.05,0.6,{nm:'loopB',pos:add(g,[0,0,0]),shape:'torus',inner:0.9,mat:'energy',col:C.hi,col2:C.deep,yaw:-60,scale:{'0':[0.2,0.2,0.2],'1':[r*0.5,r*0.7,r*0.5],ease:'out'},op:{'0':1,'1':0},rim:2}),
    ringG(t,add(g,[0,0.08,0]),r*1.6,C.hi,0.4,0.6),shock(t,g,r*2.4,'#ffd890',0.5,1.3),
    emit(t,0.05,{nm:'rays',burst:Math.min(60,16+r*8),pos:add(g,[0,0.3,0]),from:'disc',fr:0.3,dir:'flat',speed:[r*3,r*5],plife:[0.15,0.28],look:'streak',size:[2.4,3.4],col:'#ffffff',c2:C.main,gravity:0,drag:3}),
    emit(t+0.05,0.4,{nm:'heat',rate:30,pos:add(g,[0,0.2,0]),from:'disc',fr:r*0.6,dir:'up',speed:[1,2.5],plife:[0.5,0.9],look:'glow',fb:'tex/star_flare',size:[2,3.6],col:C.core,c2:C.main,gravity:-0.5}),
    haze(t,0.9,add(g,[0,1,0]),r*1.4,0.9),light(t,0.4,add(g,[0,1.5,0]),C.lt,2.2,r*4+6),...(k>0.6?[shake(t,2+r*0.8,{kick:0.25})]:[])];},
  zone(t,d,p,r){const C=this.C,g=[p[0],0,p[2]];return [
    mesh(t,d,{nm:'sunfloor',att:'ground',pos:add(g,[0,0.05,0]),shape:'disc',mat:'energy',col:C.main,col2:C.deep,scale:{'0':0.1,'0.08':1,'1':1,ease:'out',x:r},op:{'0':0.7,'0.85':0.5,'1':0},rim:1.4,scroll:0.6}),
    mesh(t,d,{nm:'rim',att:'ground',pos:add(g,[0,0.07,0]),shape:'ring',inner:0.94,mat:'glow',col:C.hi,scale:{'0':0.1,'0.08':1,'1':1,ease:'out',x:r},op:{'0':1,'0.85':0.8,'1':0},spin:25}),
    emit(t,d,{nm:'motes',rate:Math.min(40,r*6),pos:add(g,[0,0.2,0]),att:'ground',from:'disc',fr:r*0.9,dir:'up',speed:[0.6,1.6],plife:[0.8,1.4],look:'glow',fb:'tex/star_flare',size:[2,3.4],col:C.core,c2:C.main,gravity:-0.3}),
    haze(t,d,add(g,[0,0.8,0]),r*1.6,0.7)];},
  line(t,d,p0,p1,w=1){const C=this.C,len=Math.hypot(p1[0]-p0[0],p1[2]-p0[2]),m=[(p0[0]+p1[0])/2,0,(p0[2]+p1[2])/2],yaw=Math.atan2(p1[0]-p0[0],p1[2]-p0[2])*180/Math.PI;return [
    mesh(t,d,{nm:'stripe',att:'ground',pos:add(m,[0,0.05,0]),shape:'plane',mat:'energy',col:C.main,col2:C.deep,rot:[-90,0,0],yaw,scale:{'0':[w*0.2,len,1],'0.08':[w,len,1],'1':[w*0.6,len,1]},op:{'0':0.9,'0.8':0.6,'1':0},rim:1.2,scroll:2}),
    emit(t,d,{nm:'lift',rate:Math.min(80,len*4),pos:[p0[0],0.2,p0[2]],att:'ground',yaw,from:'line',fh:len,dir:'up',speed:[0.8,2],plife:[0.5,0.9],look:'glow',fb:'tex/star_flare',size:[2,3],col:C.core,c2:C.main,gravity:-0.4}),
    haze(t,d,add(m,[0,0.8,0]),Math.min(6,len*0.4),0.8)];},
  aura(t,d,r=1.4){const C=this.C;return [
    mesh(t,d,{nm:'shell',att:'feet',pos:[0,1,0],shape:'sphere',mat:'energy',col:C.hi,col2:C.deep,scale:{'0':0.5,'0.15':1.3*r/1.4,'1':1.3*r/1.4},op:{'0':0,'0.15':0.45,'0.85':0.45,'1':0},rim:2.2,scroll:1.5}),
    mesh(t,d,{nm:'crown',att:'feet',pos:[0,2.15,-0.25],shape:'model',model:'star_burst',mat:'glow',col:C.hi,rot:[90,0,0],scale:0.45,spin:40,op:{'0':0,'0.15':0.9,'1':0}}),
    mesh(t,d,{nm:'loops',att:'feet',pos:[0,0.05,0],shape:'torus',inner:0.93,mat:'energy',col:C.hi,col2:C.deep,scale:[r*1.1,r*1.1,r*1.1],spin:60,op:{'0':0,'0.15':0.8,'1':0},rim:2}),
    emit(t,d,{nm:'motes',rate:24,att:'feet',pos:[0,1,0],from:'sphere',fr:r*0.7,dir:'up',speed:[0.5,1.5],plife:[0.6,1],look:'glow',fb:'tex/star_flare',size:[2,3.4],col:C.core,c2:C.main,gravity:-0.4}),
    haze(t,d,[0,1.2,0],r*1.4,0.6),light(t,d,[0,1.5,0],C.lt,1.2,8)];},
  column(t,d,p,h,r){const C=this.C,g=[p[0],0,p[2]];return [
    mesh(t,d,{nm:'pillar',att:'ground',pos:g,shape:'cylinder',mat:'energy',col:C.hi,col2:C.deep,scale:{'0':[r*0.3,h,r*0.3],'0.12':[r,h,r],'1':[r*0.2,h,r*0.2],ease:'out'},op:{'0':1,'0.6':0.7,'1':0},rim:2.4,scroll:5}),
    mesh(t,d*0.6,{nm:'core',att:'ground',pos:g,shape:'cylinder',mat:'glow',col:C.core,scale:{'0':[r*0.1,h,r*0.1],'0.15':[r*0.35,h,r*0.35],'1':[0.02,h,0.02]},op:{'0':1,'1':0}}),
    ringG(t,add(g,[0,0.08,0]),r*2.5,C.hi,0.45,0.6),haze(t,d,add(g,[0,1.2,0]),r*2,0.9)];},
  tele(t,d,p,r){const C=this.C;return [mesh(t,d,{nm:'tele',att:'ground',pos:[p[0],0.06,p[2]],shape:'ring',inner:0.9,mat:'glow',col:C.hi,scale:{'0':r*0.2,'0.3':r,'1':r,ease:'out'},op:{'0':0,'0.2':0.8,'1':1},spin:40}),
    decal(t,d,p,'glyph',r*0.9,{col:C.main})];},
  meteor(t,T,p0,p1,s=1){return this.shot(t,T,p0,p1,s*1.8);},
  giant(t,d){const C=this.C;return [
    mesh(t,d,{nm:'sundisc',att:'feet',pos:[0,5.5,-3.5],shape:'sphere',mat:'energy',col:C.hi,col2:C.deep,scale:{'0':0.1,'0.15':1.7,'1':1.8,ease:'out'},op:{'0':0,'0.15':0.9,'0.9':0.9,'1':0},rim:2.4,scroll:1.5}),
    mesh(t,d,{nm:'corona',att:'feet',pos:[0,5.5,-3.5],shape:'model',model:'star_burst',mat:'glow',col:C.main,rot:[90,0,0],scale:{'0':0.2,'0.2':3.4,'1':3.6,ease:'out'},spin:18,op:{'0':0,'0.2':0.55,'0.9':0.55,'1':0}}),
    mesh(t,d,{nm:'ringA',att:'feet',pos:[0,5.5,-3.5],shape:'torus',inner:0.94,mat:'energy',col:C.hi,col2:C.deep,scale:{'0':0.5,'0.2':4.5,'1':4.6},spin:30,op:{'0':0,'0.2':0.8,'1':0},rim:2}),
    mesh(t,d,{nm:'ringB',att:'feet',pos:[0,5.5,-3.5],shape:'torus',inner:0.95,mat:'energy',col:C.main,col2:C.deep,yaw:70,scale:{'0':0.5,'0.25':5.2,'1':5.3},spin:-22,op:{'0':0,'0.25':0.7,'1':0},rim:2}),
    halo(t,[0,5.5,-3.5],9,C.main,d,{size0:2,k:0.5}),haze(t,d,[0,3,-1],10,1),light(t,d,[0,5,-3],C.lt,1.6,30),shake(t,4,{life:0.5})];},
  shellOrb(t,d,i){const C=this.C,a=i*180;return mesh(t,d,{nm:'orb',att:'feet',pos:{'0':[Math.sin(a*Math.PI/180)*1.2,1.4,Math.cos(a*Math.PI/180)*1.2],'0.5':[-Math.sin(a*Math.PI/180)*1.2,1.6,-Math.cos(a*Math.PI/180)*1.2],'1':[Math.sin(a*Math.PI/180)*1.2,1.4,Math.cos(a*Math.PI/180)*1.2]},shape:'sphere',mat:'glow',col:C.core,scale:0.18,loop:true});},
},
// ---- 2 ไฟนรก: แดงเข้ม-ดำ ไฟ 3 มิติต่ำ ควันดำหนา หินออบซิเดียนแหลม รอยแตกลาวา ถ่านแดง ----
infernal:{name:'ไฟนรก',desc:'ไฟนรกแดงเข้ม-ดำ — ลูกไฟแกนดำขอบแดง ควันดำหนัก หินออบซิเดียนแหลมพุ่ง รอยแตกลาวา ถ่านแดงลอย',
  C:{core:'#ff8a5a',hi:'#ff3a14',main:'#c01808',deep:'#2a0402',smoke:'#6a5654',rock:'#1a1214',lt:'#ff4a20'},
  charge(t,d,p,r=1){const C=this.C;return [
    mesh(t,d,{nm:'void',pos:p,shape:'sphere',mat:'solid',col:'#080304',scale:{'0':0.03,'1':0.34*r,ease:'in'}}),
    mesh(t,d,{nm:'rim',pos:p,shape:'sphere',mat:'energy',col:C.hi,col2:C.deep,scale:{'0':0.05,'1':0.48*r,ease:'in'},rim:2.6,scroll:3}),
    emit(t,d,{nm:'souls',pos:p,rate:26,from:'sphere',fr:1.5*r,dir:'in',speed:[1.5,3],plife:[0.35,0.5],look:'streak',size:[1.6,2.4],col:'#ff5a2a',c2:'#3a0604',gravity:0,drag:0}),
    halo(t,p,1.6*r,'#c01808',d,{size0:0.4,k:0.8}),
    emit(t,d,{nm:'embers',pos:p,rate:30,from:'sphere',fr:1.2*r,dir:'in',speed:[2,3.5],plife:[0.3,0.45],look:'ember',size:[1.4,2.2],col:C.core,c2:C.main,gravity:0,drag:0}),
    light(t,d,p,C.lt,1.2,6)];},
  cast(t,p,s=1){const C=this.C;return [flash(t,p,1.1*s,C.core,0.08),smoke(t,p,3,C.smoke,{fr:0.2,dir:'aim',size:[2.5,4],plife:[0.4,0.6]}),sparks(t,p,10*s,C.core,C.main,{dir:'aim',spread:0.5,look:'ember',speed:[3,7]})];},
  shot(t,T,p0,p1,s=1){const C=this.C,b=body(t,T,p0,p1,{shape:'sphere',mat:'fire',mode:'ball',col:C.hi,col2:C.deep,heat:-0.35,disp:0.6,flow:[0,0.3,-1],scale:0.34*s}),nm=b.nm;return [b.fix(),
    mesh(t,T,{nm:'darkcore',pos:{'0':p0,'1':p1},shape:'sphere',mat:'solid',col:'#0a0405',scale:0.14*s,fade:0}),
    L('trail',{_n:'tail',at:t,life:T,of:nm,col:C.main,col2:'#1a0202',w:0.3*s,tlife:0.3,k:1.1}),
    emit(t,T,{nm:'smoke',rate:18,from:'mesh',of:nm,dir:'up',speed:[0.2,0.6],plife:[0.4,0.7],look:'smoke',fb:'tex/smoke_puff',size:[2.5*s,4*s],col:C.smoke,c2:'#4a3432',gravity:-0.3,grow:0.8,x:true}),
    emit(t,T,{nm:'embers',rate:40,from:'mesh',of:nm,dir:'random',speed:[0.5,1.5],plife:[0.4,0.8],look:'ember',size:[1.2,2],col:C.core,c2:C.main,gravity:2})];},
  hit(t,p,r=2,k=1){const C=this.C,g=[p[0],0,p[2]];return [flash(t,add(p,[0,0.3,0]),r*0.6,C.core,0.1),
    fvol(t,1.1,g,'pillar',r*0.35,r*0.35,r*0.9,{int:0.85,den:1.05,hgt:{'0':0.05,'0.1':1,'0.6':0.7,'1':0.2}}),
    mesh(t,1.4,{nm:'obsidian',att:'ground',pos:g,shape:'model',model:'rock_spikes',mat:'solid',col:C.rock,scale:{'0':r*0.35,'1':r*0.35},grow:{'0':0,'0.12':1,'0.75':1,'1':0},stagger:0.6,growBy:'center'}),
    decal(t,2.6,g,'crack',r*1.2,{n:12}),decal(t,2.6,g,'dark',r*0.9,{op:0.7}),veins(t,2.6,g,r*1.1,'#c01808','#ff5a2a'),
    smoke(t+0.04,add(g,[0,0.3,0]),Math.min(28,8+r*4),C.smoke,{fr:r*0.4,size:[12,20],plife:[1.4,2.2],c2:'#2a1c1a'}),
    sparks(t,add(g,[0,0.4,0]),Math.min(50,14+r*8),C.core,C.main,{look:'ember',speed:[r*1.5,r*3],up:[1,4],g:3,plife:[0.6,1.2]}),
    ringG(t,add(g,[0,0.08,0]),r*1.4,C.main,0.5,0.55),shock(t,g,r*2,'#ff5a2a',0.45,1.4),light(t,0.6,add(g,[0,1.2,0]),C.lt,2,r*4+6),...(k>0.6?[shake(t,3+r*0.8)]:[])];},
  zone(t,d,p,r){const C=this.C,g=[p[0],0,p[2]];return [
    fvol(t,d,g,'pillar',r*0.9,r*0.9,0.7,{int:0.7,den:1.05,hgt:{'0':0.05,'0.08':1,'0.85':0.9,'1':0.1}}),
    decal(t,d+0.5,g,'crack',r,{n:14}),decal(t,d+0.5,g,'dark',r*0.8,{op:0.75}),veins(t,d+0.5,g,r,'#c01808','#ff5a2a'),
    emit(t,d,{nm:'smoke',rate:Math.min(16,r*3),pos:add(g,[0,0.4,0]),att:'ground',from:'disc',fr:r*0.8,dir:'up',speed:[0.3,0.9],plife:[1.4,2.2],look:'smoke',fb:'tex/smoke_puff',size:[12,18],col:C.smoke,c2:'#2a1c1a',gravity:-0.3,grow:1,x:true}),
    emit(t,d,{nm:'embers',rate:Math.min(30,r*5),pos:add(g,[0,0.3,0]),att:'ground',from:'disc',fr:r*0.9,dir:'up',speed:[0.6,1.8],plife:[0.8,1.4],look:'ember',size:[1.2,2],col:C.core,c2:C.main,gravity:-0.8})];},
  line(t,d,p0,p1,w=1){const C=this.C,len=Math.hypot(p1[0]-p0[0],p1[2]-p0[2]),m=[(p0[0]+p1[0])/2,0,(p0[2]+p1[2])/2],yaw=Math.atan2(p1[0]-p0[0],p1[2]-p0[2])*180/Math.PI;return [
    fvol(t,d,m,'wall',w*0.45,len/2,1,{int:0.75,den:1.05,yaw,hgt:{'0':0.05,'0.06':1,'0.8':0.8,'1':0.1}}),
    decal(t,d+0.6,add(m,[0,0,-len*0.25]),'crack',Math.max(1.2,len*0.25),{}),decal(t,d+0.6,add(m,[0,0,len*0.25]),'crack',Math.max(1.2,len*0.25),{}),
    emit(t,d,{nm:'smoke',rate:Math.min(20,len),pos:[p0[0],0.5,p0[2]],att:'ground',yaw,from:'line',fh:len,dir:'up',speed:[0.3,0.9],plife:[1.2,2],look:'smoke',fb:'tex/smoke_puff',size:[10,16],col:C.smoke,c2:'#2a1c1a',gravity:-0.3,grow:1,x:true})];},
  aura(t,d,r=1.4){const C=this.C;return [
    mesh(t,d,{nm:'shell',att:'feet',pos:[0,1,0],shape:'sphere',mat:'energy',col:C.main,col2:C.deep,scale:{'0':0.5,'0.12':[1.1,1.35,1.1],'1':[1.1,1.35,1.1]},op:{'0':0,'0.12':0.4,'0.9':0.4,'1':0},rim:2.6,scroll:2}),
    mesh(t,d,{nm:'horns',att:'feet',pos:[0,1.95,0.05],shape:'model',model:'horn_pair',mat:'solid',col:C.rock,scale:{'0':0.2,'0.12':0.8,'1':0.8,ease:'out'},op:{'0':0,'0.12':1,'0.9':1,'1':0}}),
    decal(t,d,[0,0,0],'crack',r*1.6,{n:10}),veins(t,d,[0,0,0],r*1.5,'#c01808','#ff5a2a'),
    emit(t,d,{nm:'smoke',rate:16,att:'feet',pos:[0,0.6,0],from:'disc',fr:r*0.7,dir:'up',speed:[0.4,1],plife:[1,1.6],look:'smoke',fb:'tex/smoke_puff',size:[8,13],col:C.smoke,c2:'#2a1c1a',gravity:-0.4,grow:1,x:true}),
    emit(t,d,{nm:'embers',rate:30,att:'feet',pos:[0,1,0],from:'sphere',fr:r*0.6,dir:'up',speed:[0.6,1.6],plife:[0.6,1.1],look:'ember',size:[1.2,2],col:C.core,c2:C.main,gravity:-1}),light(t,d,[0,1.2,0],C.lt,1.4,7)];},
  column(t,d,p,h,r){const C=this.C,g=[p[0],0,p[2]];return [fvol(t,d,g,'pillar',r*0.6,r*0.6,h,{int:0.9,den:1.05}),
    smoke(t+0.1,add(g,[0,h*0.5,0]),10,C.smoke,{fr:r,size:[14,22],plife:[1.4,2.2],c2:'#2a1c1a'}),decal(t,d+0.6,g,'crack',r*1.6,{})];},
  tele(t,d,p,r){const C=this.C;return [decal(t,d,p,'crack',r,{n:10}),mesh(t,d,{nm:'tele',att:'ground',pos:[p[0],0.06,p[2]],shape:'ring',inner:0.9,mat:'energy',col:C.main,col2:C.deep,scale:{'0':r*0.3,'0.3':r,'1':r},op:{'0':0,'0.3':0.9,'1':1},rim:1.6})];},
  meteor(t,T,p0,p1,s=1){return this.shot(t,T,p0,p1,s*1.8);},
  giant(t,d){const C=this.C;return [
    fvol(t,d,[0,0,-2.5],'pillar',2.2,2.2,9,{int:0.85,den:1.05,hgt:{'0':0.05,'0.12':1,'0.9':1,'1':0}}),
    mesh(t,d,{nm:'horns',att:'feet',pos:[0,8,-2.5],shape:'model',model:'horn_pair',mat:'solid',col:C.rock,scale:{'0':0.5,'0.15':3.4,'1':3.4,ease:'out'},op:{'0':0,'0.15':1,'0.9':1,'1':0}}),
    mesh(t,d,{nm:'eyes',att:'feet',pos:[0,6.6,-1.2],shape:'sphere',mat:'glow',col:'#ffd0a0',scale:{'0':0,'0.2':[0.6,0.18,0.2],'1':[0.6,0.18,0.2]},op:{'0':0,'0.2':1,'0.9':1,'1':0}}),
    decal(t,d,[0,0,-1],'crack',5,{n:12}),veins(t,d,[0,0,-1],6,'#c01808','#ff5a2a'),smoke(t,[0,1,-3],10,C.smoke,{fr:3,size:[14,20],plife:[1.4,2]}),
    sparks(t,[0,1,-2],50,C.core,C.main,{look:'ember',speed:[4,9],up:[2,6],g:2,plife:[0.8,1.4],from:'disc',fr:2}),shock(t,[0,0,-1],16,'#ff5a2a',0.6,1.6),light(t,d,[0,4,-2],C.lt,2.2,28),shake(t,5,{life:0.5})];},
  shellOrb(t,d,i){const C=this.C,a=i*Math.PI;return mesh(t,d,{nm:'orb',att:'feet',loop:true,pos:{'0':[Math.sin(a)*1.1,1.2,Math.cos(a)*1.1],'0.5':[-Math.sin(a)*1.1,1.5,-Math.cos(a)*1.1],'1':[Math.sin(a)*1.1,1.2,Math.cos(a)*1.1]},shape:'sphere',mat:'fire',mode:'ball',col:C.hi,col2:C.deep,heat:-0.3,scale:0.22});},
},
// ---- 3 นกไฟฟีนิกซ์: ปีกไฟ ขนนกไฟ วงเกลียว เส้นโค้งกวาด สีทองส้ม ----
phoenix:{name:'นกไฟฟีนิกซ์',desc:'นกไฟฟีนิกซ์ทองส้ม — ปีกไฟกางออก ขนนกไฟปลิวหมุน รอยกวาดโค้งเหมือนปีกโฉบ วงเกลียวไฟบนพื้น',
  C:{core:'#fff2c8',hi:'#ffd060',main:'#ff8a1a',deep:'#d0381a',lt:'#ffb050'},
  feathers(t,p,n,o={}){const C=this.C;return chunks(t,p,n,'phoenix_feather','glow',C.hi,C.deep,{fr:o.fr||0.4,speed:o.speed||[2,5],up:o.up||[1,3],g:o.g===undefined?-0.6:o.g,drag:2.2,bounce:0,mspin:220,msize:o.msize||[0.5,0.85],plife:o.plife||[0.9,1.5],dir:o.dir||'out',att:o.att});},
  charge(t,d,p,r=1){const C=this.C;return [
    mesh(t,d,{nm:'egg',pos:p,shape:'sphere',mat:'fire',mode:'ball',col:C.hi,col2:C.deep,heat:0.1,scale:{'0':0.05,'1':0.4*r,ease:'in'}}),halo(t,p,2*r,C.main,d,{size0:0.4,k:0.9}),
    mesh(t,d,{nm:'wings',pos:add(p,[0,0,-0.1]),shape:'model',model:'flame_wing',mat:'fire',col:C.hi,col2:C.deep,scale:{'0':0.05,'1':0.75*r,ease:'out'},rot:[0,0,0],op:{'0':0,'0.3':0.9,'1':1}}),
    emit(t,d,{nm:'gather',pos:p,rate:10,from:'sphere',fr:1.4*r,dir:'in',speed:[1.5,2.5],plife:[0.5,0.6],look:'model',model:'phoenix_feather',mmat:'glow',msize:[0.35,0.55],bounce:0,mspin:300,gravity:0,drag:0,col:C.hi,c2:C.main}),
    light(t,d,p,C.lt,1.3,7)];},
  cast(t,p,s=1){const C=this.C;return [flash(t,p,1.3*s,C.core,0.08),L('trail',{_n:'swish',at:t,life:0.1,sweep:true,a0:-60,a1:60,r:0.9*s,r0:0.4*s,tilt:70,col:C.hi,col2:C.deep,w:0.2,tlife:0.18,k:1.6,pos:p}),this.feathers(t,p,Math.round(4*s),{dir:'aim',speed:[3,6]})];},
  shot(t,T,p0,p1,s=1){const C=this.C,b=body(t,T,p0,p1,{shape:'sphere',mat:'fire',mode:'ball',col:C.hi,col2:C.deep,heat:0.15,flow:[0,0.2,-1],disp:0.5,scale:[0.2*s,0.2*s,0.34*s]}),nm=b.nm;return [b.fix(),
    mesh(t,T,{nm:'wings',pos:{'0':add(p0,[0,-0.6*s,0.1]),'1':add(p1,[0,-0.6*s,0.1])},shape:'model',model:'flame_wing',mat:'fire',col:C.hi,col2:C.deep,scale:{'0':0.45*Math.min(s,1.1),'0.5':0.55*Math.min(s,1.1),'1':0.45*Math.min(s,1.1)},rot:[-10,0,0],fade:0}),
    L('trail',{_n:'tail',at:t,life:T,of:nm,col:C.hi,col2:C.deep,w:0.32*s,tlife:0.35,k:1.4}),
    emit(t,T,{nm:'plume',rate:14,from:'mesh',of:nm,dir:'random',speed:[0.3,1],plife:[0.5,0.9],look:'model',model:'phoenix_feather',mmat:'glow',msize:[0.15,0.28],bounce:0,mspin:300,gravity:-0.3,drag:2,col:C.hi,c2:C.deep})];},
  hit(t,p,r=2,k=1){const C=this.C,g=[p[0],0,p[2]];return [flash(t,add(p,[0,0.4,0]),r*0.8,C.core,0.1),
    mesh(t,0.55,{nm:'spread',pos:add(g,[0,0.6,0]),shape:'model',model:'flame_wing',mat:'fire',col:C.hi,col2:C.deep,scale:{'0':0.2,'0.35':r*1.05,'1':r*1.25,ease:'out'},op:{'0':1,'0.5':0.9,'1':0},dis:{'0':0,'0.5':0,'1':0.8}}),
    mesh(t,0.9,{nm:'swirl',att:'ground',pos:add(g,[0,0.05,0]),shape:'model',model:'fire_swirl',mat:'fire',col:C.hi,col2:C.deep,scale:{'0':0.2,'0.3':r*0.55,'1':r*0.65,ease:'out'},spin:220,op:{'0':1,'0.6':0.8,'1':0}}),
    L('trail',{_n:'arc1',at:t,life:0.12,sweep:true,a0:-140,a1:40,r:r*1.1,r0:r*0.6,tilt:0,col:C.hi,col2:C.deep,w:0.3,tlife:0.3,k:1.5,att:'ground',pos:add(g,[0,0.5,0])}),
    L('trail',{_n:'arc2',at:t+0.04,life:0.12,sweep:true,a0:140,a1:-40,r:r*1.1,r0:r*0.6,tilt:0,col:C.hi,col2:C.deep,w:0.3,tlife:0.3,k:1.5,att:'ground',pos:add(g,[0,0.8,0])}),
    this.feathers(t,add(g,[0,0.6,0]),Math.min(24,6+r*4),{speed:[r*1.2,r*2.4],up:[1,3]}),
    fvol(t,0.9,g,'pillar',r*0.25,r*0.25,r*0.9,{int:1.1,den:1,hgt:{'0':0.05,'0.1':1,'0.5':0.6,'1':0}}),
    ringG(t,add(g,[0,0.08,0]),r*1.5,C.hi,0.45,0.5),light(t,0.5,add(g,[0,1.5,0]),C.lt,2,r*4+6),...(k>0.6?[shake(t,2+r*0.7)]:[])];},
  zone(t,d,p,r){const C=this.C,g=[p[0],0,p[2]];return [
    mesh(t,d,{nm:'swirl',att:'ground',pos:add(g,[0,0.05,0]),shape:'model',model:'fire_swirl',mat:'fire',col:C.hi,col2:C.deep,scale:{'0':0.2,'0.1':r*0.8,'1':r*0.8,ease:'out'},spin:60,op:{'0':1,'0.85':0.8,'1':0}}),
    fvol(t,d,g,'pillar',r*0.95,r*0.95,0.9,{int:0.9,hgt:{'0':0.05,'0.08':1,'0.85':0.8,'1':0.1}}),
    emit(t,d,{nm:'plume',rate:Math.min(12,r*2),pos:add(g,[0,0.4,0]),att:'ground',from:'disc',fr:r*0.8,dir:'up',speed:[0.6,1.6],plife:[1,1.6],look:'model',model:'phoenix_feather',mmat:'glow',msize:[0.18,0.3],bounce:0,mspin:200,gravity:-0.5,drag:1.5,col:C.hi,c2:C.deep})];},
  line(t,d,p0,p1,w=1){const C=this.C,len=Math.hypot(p1[0]-p0[0],p1[2]-p0[2]),m=[(p0[0]+p1[0])/2,0,(p0[2]+p1[2])/2],yaw=Math.atan2(p1[0]-p0[0],p1[2]-p0[2])*180/Math.PI;return [
    fvol(t,d,m,'wall',w*0.4,len/2,1.1,{int:1,yaw,hgt:{'0':0.05,'0.06':1,'0.8':0.7,'1':0.1}}),
    emit(t,d,{nm:'plume',rate:Math.min(24,len*1.2),pos:[p0[0],0.5,p0[2]],att:'ground',yaw,from:'line',fh:len,dir:'up',speed:[0.6,1.6],plife:[0.8,1.4],look:'model',model:'phoenix_feather',mmat:'glow',msize:[0.18,0.32],bounce:0,mspin:200,gravity:-0.5,drag:1.5,col:C.hi,c2:C.deep}),
    decal(t,d+0.6,m,'scorch',Math.max(1,len*0.3))];},
  aura(t,d,r=1.4){const C=this.C;return [
    mesh(t,d,{nm:'wings',att:'feet',pos:[0,0.2,-0.2],shape:'model',model:'flame_wing',mat:'fire',col:C.hi,col2:C.deep,scale:{'0':0.2,'0.15':1.25,'1':1.25,ease:'out'},rot:[4,0,0],op:{'0':0,'0.15':1,'0.9':1,'1':0}}),
    mesh(t,d,{nm:'licks',att:'feet',pos:[0,0.05,0],shape:'model',model:'fire_licks',mat:'fire',col:C.hi,col2:C.deep,scale:r*0.85,spin:90,op:{'0':0,'0.15':0.9,'0.9':0.9,'1':0}}),
    emit(t,d,{nm:'plume',rate:10,att:'feet',pos:[0,1.4,-0.4],from:'sphere',fr:0.8,dir:'up',speed:[0.4,1.2],plife:[1,1.5],look:'model',model:'phoenix_feather',mmat:'glow',msize:[0.18,0.3],bounce:0,mspin:200,gravity:-0.4,drag:1.5,col:C.hi,c2:C.deep}),light(t,d,[0,1.5,0],C.lt,1.3,8)];},
  column(t,d,p,h,r){const C=this.C,g=[p[0],0,p[2]];return [fvol(t,d,g,'pillar',r*0.45,r*0.45,h,{int:1.1}),
    mesh(t,d,{nm:'wings',pos:add(g,[0,h*0.7,0]),shape:'model',model:'flame_wing',mat:'fire',col:C.hi,col2:C.deep,scale:{'0':0.3,'0.2':r*1.2,'1':r*1.3},op:{'0':0,'0.2':1,'1':0}}),this.feathers(t,add(g,[0,h*0.6,0]),14,{speed:[2,5]})];},
  tele(t,d,p,r){const C=this.C;return [mesh(t,d,{nm:'tele',att:'ground',pos:[p[0],0.05,p[2]],shape:'model',model:'fire_swirl',mat:'energy',col:C.hi,col2:C.deep,scale:{'0':r*0.2,'0.3':r*0.75,'1':r*0.75},spin:80,op:{'0':0,'0.3':0.7,'1':0.9},rim:1.6}),ringG(t,[p[0],0.08,p[2]],r,C.hi,d,0.4)];},
  meteor(t,T,p0,p1,s=1){return this.shot(t,T,p0,p1,s*2);},
  giant(t,d){const C=this.C;return [
    mesh(t,d,{nm:'wingsG',att:'feet',pos:[0,1.2,-2.2],shape:'model',model:'flame_wing',mat:'fire',col:C.hi,col2:C.deep,scale:{'0':0.3,'0.15':4.6,'1':4.8,ease:'out'},rot:[6,0,0],op:{'0':0,'0.15':1,'0.9':1,'1':0}}),
    mesh(t,d,{nm:'bodyG',att:'feet',pos:[0,4.8,-2.6],shape:'sphere',mat:'fire',mode:'ball',col:C.hi,col2:C.deep,heat:0.1,scale:{'0':0.2,'0.15':[1.3,2.2,1.3],'1':[1.3,2.2,1.3]},op:{'0':0,'0.15':1,'0.9':1,'1':0}}),
    mesh(t,d,{nm:'swirlG',att:'feet',pos:[0,0.05,-2.2],shape:'model',model:'fire_swirl',mat:'energy',col:C.hi,col2:C.deep,scale:{'0':0.5,'0.2':2.6,'1':2.7},spin:40,op:{'0':0,'0.2':0.6,'1':0},rim:1.6}),
    this.feathers(t,[0,4,-2.5],26,{fr:2,speed:[2,5],up:[1,3],msize:[0.4,0.7],plife:[1.2,1.8]}),halo(t,[0,4.5,-2.5],12,C.main,d,{size0:2,k:0.7}),light(t,d,[0,4,-2],C.lt,2.2,26),shake(t,4,{life:0.5})];},
  shellOrb(t,d,i){const C=this.C,a=i*Math.PI;return mesh(t,d,{nm:'orb',att:'feet',loop:true,pos:{'0':[Math.sin(a)*1.15,1.3,Math.cos(a)*1.15],'0.5':[-Math.sin(a)*1.15,1.6,-Math.cos(a)*1.15],'1':[Math.sin(a)*1.15,1.3,Math.cos(a)*1.15]},shape:'model',model:'phoenix_feather',mat:'fire',col:C.hi,col2:C.deep,scale:0.8,spin:200});},
},
// ---- 4 เหล็กหลอม: ลาวาเหลวสาด หยดลาวาเด้ง ประกายเชื่อมเหล็ก ไอน้ำขาว คราบดำเย็นตัว ----
forge:{name:'เหล็กหลอม',desc:'เหล็กหลอมเหลวในเตา — ก้อนลาวาเหลวสาดกระเซ็นแล้วเด้งพื้น ประกายเชื่อมเหล็กพุ่งเป็นสาย ไอน้ำขาว บ่อเหล็กหลอมบนพื้นที่ค่อย ๆ เย็นดำ',
  C:{core:'#fffef0',hi:'#ffe0a0',main:'#ff9a2a',deep:'#a83a10',steam:'#f4f1ee',crust:'#2a2420',lt:'#ffb860'},
  drops(t,p,n,o={}){const C=this.C;return chunks(t,p,n,'rock_chunk','glow',C.main,C.deep,{fr:o.fr||0.3,speed:o.speed||[3,7],up:o.up||[3,6],g:12,bounce:0.25,msize:o.msize||[0.12,0.26],plife:o.plife||[0.8,1.3],dir:o.dir||'out',att:o.att});},
  weld(t,p,n,o={}){const C=this.C;return sparks(t,p,n,'#fffbe0',C.main,{look:'streak',speed:o.speed||[6,14],up:o.up||[1,4],g:9,drag:0.8,plife:[0.3,0.6],size:[1.6,2.6],dir:o.dir||'out',spread:o.spread||1.3,fr:0.15,att:o.att});},
  charge(t,d,p,r=1){const C=this.C;return [
    mesh(t,d,{nm:'ingot',pos:p,shape:'sphere',mat:'fire',mode:'ball',col:C.hi,col2:C.deep,heat:0.4,scale:{'0':0.05,'1':0.4*r,ease:'in'}}),halo(t,p,2*r,C.main,d,{size0:0.4,k:0.9}),
    emit(t,d,{nm:'weldin',pos:p,rate:40,from:'sphere',fr:1.2*r,dir:'in',speed:[3,5],plife:[0.22,0.3],look:'streak',size:[1.4,2],col:'#fffbe0',c2:C.main,gravity:0,drag:0}),
    haze(t,d,p,1*r,0.9),light(t,d,p,C.lt,1.4,6)];},
  cast(t,p,s=1){const C=this.C;return [flash(t,p,1.2*s,C.core,0.08),this.weld(t,p,Math.round(14*s),{dir:'aim',spread:0.5}),smoke(t,p,2,C.steam,{fr:0.2,dir:'aim',size:[2.5,4],plife:[0.4,0.6]})];},
  shot(t,T,p0,p1,s=1){const C=this.C,b=body(t,T,p0,p1,{shape:'sphere',mat:'fire',mode:'ball',col:C.hi,col2:C.deep,heat:0.35,flow:[0,0,-1],disp:0.2,scale:[0.22*s,0.22*s,0.3*s]}),nm=b.nm;return [b.fix(),
    L('trail',{_n:'tail',at:t,life:T,of:nm,col:C.hi,col2:C.deep,w:0.18*s,tlife:0.22,k:1.6}),
    emit(t,T,{nm:'drip',rate:30,from:'mesh',of:nm,dir:'down',speed:[0.5,1.5],plife:[0.5,0.9],look:'model',model:'rock_chunk',mmat:'glow',msize:[0.05,0.1],bounce:0.2,mspin:300,gravity:12,col:C.main,c2:C.deep}),
    emit(t,T,{nm:'steam',rate:10,from:'mesh',of:nm,dir:'up',speed:[0.2,0.6],plife:[0.35,0.6],look:'smoke',fb:'tex/smoke_puff',size:[2*s,3.5*s],col:C.steam,c2:'#d8d4d0',gravity:-0.4,grow:0.8,x:true})];},
  hit(t,p,r=2,k=1){const C=this.C,g=[p[0],0,p[2]];return [flash(t,add(p,[0,0.3,0]),r*0.7,C.core,0.09),
    mesh(t,0.45,{nm:'splash',att:'ground',pos:g,shape:'model',model:'spike_shell',mat:'fire',col:C.hi,col2:C.deep,heat:0.3,scale:{'0':[r*0.2,0.1,r*0.2],'0.3':[r*0.55,r*0.4,r*0.55],'1':[r*0.65,0.05,r*0.65]},op:{'0':1,'1':0}}),
    mesh(t,2.2,{nm:'pool',att:'ground',pos:add(g,[0,0.04,0]),shape:'disc',mat:'energy',col:C.main,col2:C.hi,rim:1.8,scale:{'0':0.2,'0.12':r*0.7,'1':r*0.7,ease:'out'},op:{'0':1,'0.75':0.9,'1':0},scroll:0.4}),
    decal(t,3,g,'dark',r*0.8,{op:0.75}),this.drops(t,add(g,[0,0.3,0]),Math.min(30,8+r*5),{speed:[r*1.2,r*2.6]}),this.weld(t,add(g,[0,0.3,0]),Math.min(60,16+r*8),{speed:[r*2,r*4.5]}),
    smoke(t+0.15,add(g,[0,0.3,0]),Math.min(18,5+r*3),C.steam,{fr:r*0.5,size:[10,16],plife:[1,1.6],c2:'#bdb8b2'}),
    ringG(t,add(g,[0,0.08,0]),r*1.4,C.main,0.4,0.55),shock(t,g,r*2,'#ffc070',0.4,1.2),light(t,0.6,add(g,[0,1.2,0]),C.lt,2,r*4+6),...(k>0.6?[shake(t,2.5+r*0.8,{kick:0.2})]:[])];},
  zone(t,d,p,r){const C=this.C,g=[p[0],0,p[2]];return [
    mesh(t,d,{nm:'pool',att:'ground',pos:add(g,[0,0.04,0]),shape:'disc',mat:'energy',col:C.main,col2:C.hi,rim:1.8,scale:{'0':0.2,'0.08':r,'1':r,ease:'out'},op:{'0':1,'0.85':0.9,'1':0},scroll:0.3}),
    decal(t,d+0.5,g,'dark',r*1.05,{op:0.6}),
    emit(t,d,{nm:'bubbles',rate:Math.min(20,r*4),pos:add(g,[0,0.15,0]),att:'ground',from:'disc',fr:r*0.85,dir:'up',speed:[1.5,3],plife:[0.4,0.7],look:'model',model:'rock_chunk',mmat:'glow',msize:[0.06,0.12],bounce:0,mspin:200,gravity:9,col:C.main,c2:C.deep}),
    emit(t,d,{nm:'steam',rate:Math.min(14,r*2.5),pos:add(g,[0,0.3,0]),att:'ground',from:'disc',fr:r*0.9,dir:'up',speed:[0.4,1],plife:[1.2,1.8],look:'smoke',fb:'tex/smoke_puff',size:[10,16],col:C.steam,c2:'#c8c4c0',gravity:-0.3,grow:1,x:true}),
    haze(t,d,add(g,[0,0.8,0]),r*1.6,0.8)];},
  line(t,d,p0,p1,w=1){const C=this.C,len=Math.hypot(p1[0]-p0[0],p1[2]-p0[2]),m=[(p0[0]+p1[0])/2,0,(p0[2]+p1[2])/2],yaw=Math.atan2(p1[0]-p0[0],p1[2]-p0[2])*180/Math.PI;return [
    mesh(t,d,{nm:'river',att:'ground',pos:add(m,[0,0.04,0]),shape:'plane',mat:'energy',col:C.main,col2:C.hi,rot:[-90,0,0],rim:1.8,yaw,scale:{'0':[w*0.2,len,1],'0.06':[w,len,1],'1':[w,len,1]},op:{'0':1,'0.85':0.9,'1':0},scroll:1}),
    decal(t,d+0.6,add(m,[0,0,-len*0.25]),'dark',Math.max(1,len*0.25),{op:0.6}),decal(t,d+0.6,add(m,[0,0,len*0.25]),'dark',Math.max(1,len*0.25),{op:0.6}),
    emit(t,d,{nm:'steam',rate:Math.min(16,len),pos:[p0[0],0.3,p0[2]],att:'ground',yaw,from:'line',fh:len,dir:'up',speed:[0.4,1],plife:[1,1.6],look:'smoke',fb:'tex/smoke_puff',size:[8,13],col:C.steam,c2:'#c8c4c0',gravity:-0.3,grow:1,x:true}),
    haze(t,d,add(m,[0,0.7,0]),Math.min(6,len*0.4),0.8)];},
  aura(t,d,r=1.4){const C=this.C;return [
    mesh(t,d,{nm:'plates',att:'feet',pos:[0,0.9,0],shape:'model',model:'spike_shell',mat:'fire',col:C.hi,col2:C.deep,heat:{'0':0.4,'0.5':0.1,'1':0.3},scale:{'0':0.3,'0.12':[0.75,1,0.75],'1':[0.75,1,0.75]},op:{'0':0,'0.12':0.55,'0.9':0.55,'1':0}}),
    emit(t,d,{nm:'weld',rate:40,att:'feet',pos:[0,1.2,0],from:'sphere',fr:0.6,dir:'out',speed:[3,7],up:[0,2],plife:[0.25,0.45],look:'streak',size:[1.4,2.2],col:'#fffbe0',c2:C.main,gravity:9,drag:0.8}),
    emit(t,d,{nm:'drip',rate:14,att:'feet',pos:[0,1,0],from:'sphere',fr:0.5,dir:'down',speed:[0.5,1.5],plife:[0.5,0.8],look:'model',model:'rock_chunk',mmat:'glow',msize:[0.05,0.1],bounce:0.2,mspin:300,gravity:12,col:C.main,c2:C.deep}),
    decal(t,d,[0,0,0],'dark',r,{op:0.5}),haze(t,d,[0,1.2,0],r*1.4,0.9),light(t,d,[0,1.2,0],C.lt,1.4,7)];},
  column(t,d,p,h,r){const C=this.C,g=[p[0],0,p[2]];return [
    mesh(t,d,{nm:'geyser',att:'ground',pos:g,shape:'cylinder',mat:'fire',col:C.hi,col2:C.deep,heat:0.3,scale:{'0':[r*0.3,0.1,r*0.3],'0.15':[r*0.5,h,r*0.5],'0.7':[r*0.4,h*0.9,r*0.4],'1':[r*0.1,0.1,r*0.1]},op:{'0':1,'1':0.6}}),
    this.drops(t+0.1,add(g,[0,h*0.8,0]),20,{speed:[2,5],up:[1,4]}),smoke(t+0.2,add(g,[0,h,0]),10,C.steam,{fr:r,size:[12,20]}),haze(t,d,add(g,[0,h*0.5,0]),r*2,1)];},
  tele(t,d,p,r){const C=this.C;return [mesh(t,d,{nm:'tele',att:'ground',pos:[p[0],0.05,p[2]],shape:'ring',inner:0.88,mat:'fire',col:C.hi,col2:C.deep,heat:0.2,scale:{'0':r*0.3,'0.3':r,'1':r},op:{'0':0,'0.3':0.9,'1':1}}),decal(t,d,p,'dark',r*0.9,{op:0.35})];},
  meteor(t,T,p0,p1,s=1){return this.shot(t,T,p0,p1,s*2);},
  giant(t,d){const C=this.C;return [
    mesh(t,d,{nm:'golem',att:'feet',pos:[0,0,-5],shape:'model',model:'spike_shell',mat:'fire',col:C.hi,col2:C.deep,heat:{'0':0.5,'0.5':0.2,'1':0},scale:{'0':0.3,'0.2':[2.6,4.2,2.6],'1':[2.6,4.2,2.6]},op:{'0':0,'0.2':0.95,'0.9':0.95,'1':0}}),
    mesh(t,d,{nm:'pool',att:'ground',pos:[0,0.04,-1.5],shape:'disc',mat:'energy',col:C.main,col2:C.hi,rim:1.8,scale:{'0':0.2,'0.15':6,'1':6},op:{'0':1,'0.9':0.9,'1':0},scroll:0.3}),
    this.drops(t,[0,3,-5],24,{fr:2,speed:[3,6],up:[2,5]}),this.weld(t,[0,3,-5],30,{speed:[6,12]}),smoke(t+0.2,[0,4,-5],10,C.steam,{fr:2.5,size:[14,20],plife:[1.4,2]}),
    haze(t,d,[0,3,-2.5],8,1),light(t,d,[0,3,-2],C.lt,2.2,24),shake(t,4,{life:0.5})];},
  shellOrb(t,d,i){const C=this.C,a=i*Math.PI;return mesh(t,d,{nm:'orb',att:'feet',loop:true,pos:{'0':[Math.sin(a)*1.1,1.3,Math.cos(a)*1.1],'0.5':[-Math.sin(a)*1.1,1.5,-Math.cos(a)*1.1],'1':[Math.sin(a)*1.1,1.3,Math.cos(a)*1.1]},shape:'sphere',mat:'fire',mode:'ball',col:C.hi,col2:C.deep,heat:0.35,scale:0.2});},
},
};
const FORDER=['solar','infernal','phoenix','forge'];

// ======================================================================
//  ธีมดิน
// ======================================================================
const ET={
// ---- 1 หินผลึกม่วง: ผลึกอเมทิสต์แหลม เศษกระจก ประกาย ฝุ่นม่วงอ่อน ----
crystal:{name:'หินผลึก',desc:'หินผลึกอเมทิสต์ — ผลึกม่วงใสแหลมพุ่งจากพื้น เศษผลึกแตกกระเด็น ประกายวิบวับ ฝุ่นม่วงอ่อน',
  C:{core:'#ffffff',hi:'#f0d8ff',main:'#b07aff',deep:'#5a28b0',dust:'#d8c8f0',lt:'#c8a0ff'},
  burst(t,p,r,k=1){const C=this.C,g=[p[0],0,p[2]];return [flash(t,add(g,[0,0.6,0]),r*0.6,C.hi,0.1),
    mesh(t,1.3,{nm:'geode',att:'ground',pos:g,shape:'model',model:'crystal_crown',mat:'energy',col:C.main,col2:C.deep,rim:1.8,scroll:0.25,scale:{'0':[r*0.4,0.05,r*0.4],'0.12':[r*0.45,r*0.5,r*0.45],'0.3':r*0.45,ease:'out'},dis:{'0':0,'0.7':0,'1':1}}),
    chunks(t,add(g,[0,0.5,0]),Math.min(24,6+r*3),'frost_shard','glow',C.main,C.deep,{speed:[r*1.2,r*2.5],up:[2,5],msize:[0.1,0.25]}),
    emit(t,0.05,{nm:'glint',burst:Math.min(30,8+r*4),pos:add(g,[0,0.5,0]),from:'sphere',fr:r*0.4,dir:'out',speed:[1,3],up:[1,2],plife:[0.5,0.9],look:'glow',fb:'tex/star_flare',size:[3,6],col:C.core,c2:C.main,gravity:0.5}),
    smoke(t+0.04,add(g,[0,0.3,0]),Math.min(14,4+r*2),C.dust,{fr:r*0.5,size:[10,16],plife:[0.9,1.4]}),
    ringG(t,add(g,[0,0.08,0]),r*1.3,C.main,0.45,0.5),light(t,0.4,add(g,[0,1.2,0]),C.lt,1.8,r*4+6),...(k>0.6?[shake(t,2+r*0.6)]:[])];},
  form(t,p,s=1){const C=this.C;return [flash(t,p,0.9*s,C.hi,0.1),chunks(t,p,Math.round(8*s),'frost_shard','glow',C.main,C.deep,{dir:'in',speed:[2,3],up:[0,0],g:0,plife:[0.25,0.35],fr:1.2*s,msize:[0.08,0.16],bounce:0}),
    emit(t,0.05,{nm:'glint',burst:Math.round(10*s),pos:p,from:'sphere',fr:0.7*s,dir:'out',speed:[0.5,1.5],plife:[0.4,0.7],look:'glow',fb:'tex/star_flare',size:[3,5],col:C.core,c2:C.main,gravity:0})];},
  zone(t,d,p,r){const C=this.C,g=[p[0],0,p[2]];return [
    mesh(t,d,{nm:'floor',att:'ground',pos:add(g,[0,0.04,0]),shape:'disc',mat:'energy',col:C.deep,col2:C.main,rim:1.2,scroll:0.25,scale:{'0':0.1,'0.1':r,'1':r,ease:'out'},op:{'0':0.45,'0.85':0.35,'1':0}}),
    mesh(t,d,{nm:'rimc',att:'ground',pos:g,shape:'model',model:'frost_rim',mat:'energy',col:C.main,col2:C.deep,rim:1.8,scroll:0.25,scale:[r,1.6,r],grow:{'0':0,'0.08':1,'0.92':1,'1':0},stagger:0.7,growBy:'random'}),
    emit(t,d,{nm:'glint',rate:Math.min(30,r*4),pos:add(g,[0,0.3,0]),att:'ground',from:'disc',fr:r*0.9,dir:'up',speed:[0.3,0.8],plife:[0.6,1],look:'glow',fb:'tex/star_flare',size:[2.5,4],col:C.core,c2:C.main,gravity:-0.2})];},
  wall(t,d,p,len,h,yaw=0){const C=this.C;return [mesh(t,d,{nm:'wall',att:'ground',pos:p,yaw,shape:'model',model:'crystal_crown',mat:'energy',col:C.main,col2:C.deep,rim:1.8,scroll:0.25,scale:{'0':[0.7,0.05,len*0.12],'0.08':[0.75,h*0.9,len*0.12],'1':[0.75,h*0.9,len*0.12]},op:{'0':1,'0.9':1,'1':0}}),
    chunks(t,p,12,'frost_shard','glow',C.main,C.deep,{from:'box',fr:0.6,speed:[2,4],up:[3,5]}),smoke(t,add(p,[0,0.3,0]),6,C.dust,{fr:len*0.3,size:[10,14]})];},
  slab(t,T,p0,p1){const C=this.C;return [mesh(t,T,{nm:'slab',pos:{'0':p0,'1':p1},shape:'model',model:'crystal_cluster',mat:'energy',col:C.main,col2:C.deep,rim:1.8,scroll:0.25,rot:[90,0,0],scale:0.9,spin:0,fade:0}),
    emit(t,T,{nm:'trail',rate:40,pos:{'0':p0,'1':p1},from:'sphere',fr:0.5,dir:'random',speed:[0.3,1],plife:[0.4,0.7],look:'glow',fb:'tex/star_flare',size:[2.5,4],col:C.core,c2:C.main,gravity:0})];},
  aura(t,d){const C=this.C;return [mesh(t,d,{nm:'orbit',att:'feet',pos:[0,1,0],shape:'model',model:'crystal_cluster',mat:'energy',col:C.main,col2:C.deep,rim:1.8,scroll:0.25,scale:0.35,spin:90,op:{'0':0,'0.15':1,'0.9':1,'1':0}})];},
  cloud(t,d,p,r){const C=this.C,g=[p[0],0,p[2]];return [emit(t,0.4,{nm:'cloud',rate:60,pos:add(g,[0,1.2,0]),from:'sphere',fr:r*0.3,dir:'out',speed:[r*0.5,r*1.2],plife:[d*0.7,d],look:'smoke',fb:'tex/smoke_puff',size:[30,46],col:'#e6dcf6',c2:'#c4b4e4',gravity:-0.05,grow:0.6,drag:1.4}),
    emit(t,d*0.8,{nm:'glit',rate:30,pos:add(g,[0,1.2,0]),from:'sphere',fr:r*0.7,dir:'random',speed:[0.2,0.6],plife:[0.8,1.4],look:'glow',fb:'tex/star_flare',size:[2.5,4],col:C.core,c2:C.main,gravity:0})];},
  drill(t,T,p0,p1){const C=this.C;return [mesh(t,T,{nm:'drill',pos:{'0':p0,'1':p1},shape:'cone',mat:'energy',col:C.main,col2:C.deep,rim:1.8,scroll:0.25,rot:[0,0,0],scale:[0.35,1.6,0.35],spin:720,fade:0})];},
  giant(t,d,p){return [...this.burst(t,p,9,1),...this.zone(t+0.2,d,p,14),ringG(t,[p[0],0.1,p[2]],22,'#ffffff',0.7,0.35)];},
},
// ---- 2 หินรูนโบราณ: แท่งหินสลักรูนลอย อักขระเรืองหยก ฝุ่นทอง ----
rune:{name:'หินรูนโบราณ',desc:'หินรูนโบราณ — แท่งหินสลักลอยขึ้นจากพื้น อักขระเวทเรืองสีหยก วงรูนหมุน ฝุ่นทองลอย',
  C:{stone:'#6a6a62',stone2:'#3a3a34',glow:'#5cffb0',glow2:'#1a9a6a',gold:'#e8d27a',dust:'#c8c0a0',lt:'#7affc0'},
  burst(t,p,r,k=1){const C=this.C,g=[p[0],0,p[2]];return [flash(t,add(g,[0,0.6,0]),Math.min(2.5,r*0.3),C.glow,0.1),
    mesh(t,1.2,{nm:'stones',att:'ground',pos:g,shape:'model',model:'rune_stones',mat:'solid',col:C.stone,scale:{'0':[r*0.4,0.05,r*0.4],'0.15':r*0.42,'1':r*0.42,ease:'out'},dis:{'0':0,'0.7':0,'1':1}}),
    mesh(t,1,{nm:'circle',att:'ground',pos:add(g,[0,0.05,0]),shape:'model',model:'rune_swirl',mat:'energy',col:C.glow,col2:C.glow2,scale:{'0':0.2,'0.2':r*0.6,'1':r*0.65,ease:'out'},spin:120,op:{'0':0.7,'0.6':0.5,'1':0},rim:1.4}),
    decal(t,2.2,g,'glyph',r*0.8,{col:C.glow}),
    chunks(t,add(g,[0,0.4,0]),Math.min(20,6+r*2),'rock_chunk','solid',C.stone,C.stone2,{speed:[r*1.2,r*2.2],up:[3,5],msize:[0.12,0.28]}),
    emit(t,0.05,{nm:'motes',burst:Math.min(30,8+r*4),pos:add(g,[0,0.4,0]),from:'disc',fr:r*0.4,dir:'up',speed:[1,3],plife:[0.8,1.3],look:'glow',size:[2,3.4],col:C.gold,c2:C.glow,gravity:-0.5}),
    smoke(t+0.04,add(g,[0,0.3,0]),Math.min(12,4+r*2),C.dust,{fr:r*0.5,size:[10,16]}),
    ringG(t,add(g,[0,0.08,0]),r*1.3,C.glow,0.45,0.5),light(t,0.5,add(g,[0,1.2,0]),C.lt,1.8,r*4+6),...(k>0.6?[shake(t,2+r*0.6)]:[])];},
  form(t,p,s=1){const C=this.C;return [flash(t,p,0.8*s,C.glow,0.1),mesh(t,0.4,{nm:'sigil',pos:p,shape:'model',model:'rune_swirl',mat:'glow',col:C.glow,bill:true,scale:{'0':0.2,'1':1.2*s,ease:'out'},rot:[90,0,0],op:{'0':1,'1':0}}),
    emit(t,0.05,{nm:'motes',burst:Math.round(12*s),pos:p,from:'sphere',fr:0.6*s,dir:'out',speed:[0.6,1.6],plife:[0.5,0.8],look:'glow',size:[2,3],col:C.gold,c2:C.glow,gravity:0})];},
  zone(t,d,p,r){const C=this.C,g=[p[0],0,p[2]];return [
    mesh(t,d,{nm:'circle',att:'ground',pos:add(g,[0,0.05,0]),shape:'model',model:'rune_swirl',mat:'energy',col:C.glow,col2:C.glow2,scale:{'0':0.1,'0.1':r,'1':r,ease:'out'},spin:20,op:{'0':0,'0.1':0.8,'0.85':0.7,'1':0},rim:1.4}),
    decal(t,d,g,'glyph',r*0.95,{col:C.glow}),
    emit(t,d,{nm:'motes',rate:Math.min(30,r*4),pos:add(g,[0,0.2,0]),att:'ground',from:'disc',fr:r*0.9,dir:'up',speed:[0.4,1],plife:[1,1.6],look:'glow',size:[2,3.2],col:C.gold,c2:C.glow,gravity:-0.3})];},
  wall(t,d,p,len,h,yaw=0){const C=this.C;return [mesh(t,d,{nm:'wall',att:'ground',pos:p,yaw:yaw+90,shape:'model',model:'stone_tablet',mat:'solid',col:C.stone,scale:{'0':[len*0.9,0.05,1.2],'0.08':[len*0.9,h*0.7,1.2],'1':[len*0.9,h*0.7,1.2]},op:{'0':1,'0.9':1,'1':0}}),
    decal(t,d,p,'glyph',Math.max(1.2,len*0.35),{col:C.glow}),chunks(t,p,12,'rock_chunk','solid',C.stone,C.stone2,{from:'box',fr:0.6,speed:[2,4],up:[3,5]}),smoke(t,add(p,[0,0.3,0]),6,C.dust,{fr:len*0.3,size:[10,14]})];},
  slab(t,T,p0,p1){const C=this.C;return [mesh(t,T,{nm:'slab',pos:{'0':p0,'1':p1},shape:'model',model:'stone_tablet',mat:'solid',col:C.stone,rot:[0,0,0],scale:1.2,fade:0}),
    emit(t,T,{nm:'glyphs',rate:24,pos:{'0':p0,'1':p1},from:'sphere',fr:0.6,dir:'random',speed:[0.2,0.6],plife:[0.4,0.7],look:'glow',size:[2.5,4],col:C.glow,c2:C.glow2,gravity:0})];},
  aura(t,d){const C=this.C;return [mesh(t,d,{nm:'orbit',att:'feet',pos:[0,0.05,0],shape:'model',model:'rune_swirl',mat:'glow',col:C.glow,scale:1.4,spin:40,op:{'0':0,'0.15':0.8,'0.9':0.8,'1':0}})];},
  cloud(t,d,p,r){const C=this.C,g=[p[0],0,p[2]];return [emit(t,0.4,{nm:'cloud',rate:60,pos:add(g,[0,1.2,0]),from:'sphere',fr:r*0.3,dir:'out',speed:[r*0.5,r*1.2],plife:[d*0.7,d],look:'smoke',fb:'tex/smoke_puff',size:[30,46],col:C.dust,c2:'#8a8670',gravity:-0.05,grow:0.6,drag:1.4}),
    emit(t,d*0.8,{nm:'motes',rate:24,pos:add(g,[0,1.2,0]),from:'sphere',fr:r*0.7,dir:'random',speed:[0.2,0.5],plife:[1,1.6],look:'glow',size:[2,3.2],col:C.gold,c2:C.glow,gravity:0})];},
  drill(t,T,p0,p1){const C=this.C;return [mesh(t,T,{nm:'drill',pos:{'0':p0,'1':p1},shape:'cone',mat:'solid',col:C.stone,scale:[0.35,1.6,0.35],spin:720,fade:0}),
    mesh(t,T,{nm:'band',pos:{'0':p0,'1':p1},shape:'torus',inner:0.85,mat:'glow',col:C.glow,scale:0.45,spin:-400,fade:0})];},
  giant(t,d,p){return [...this.burst(t,p,9,1),...this.zone(t+0.2,d,p,14),ringG(t,[p[0],0.1,p[2]],22,'#ffffff',0.7,0.35)];},
},
// ---- 3 หินหลอมเหลว: หินดำ รอยแตกลาวาส้ม ไอร้อน ก้อนหินร้อนเรือง ----
magma:{name:'หินหลอมเหลว',desc:'หินหลอมเหลว — หินดำแหลมพุ่งพร้อมลาวาส้มในรอยแตก ก้อนหินร้อนเรืองกระเด็น ไอร้อนบิดอากาศ ควันเทาเข้ม',
  C:{rock:'#24201e',rock2:'#3a302a',lava:'#ff6a1a',lava2:'#ffb040',deep:'#7a1a08',smoke:'#5a524c',lt:'#ff7a30'},
  burst(t,p,r,k=1){const C=this.C,g=[p[0],0,p[2]];return [flash(t,add(g,[0,0.5,0]),r*0.5,C.lava2,0.1),
    mesh(t,1.4,{nm:'spikes',att:'ground',pos:g,shape:'model',model:'rock_spikes',mat:'solid',col:C.rock,scale:r*0.4,grow:{'0':0,'0.12':1,'0.8':1,'1':0},stagger:0.6,growBy:'center'}),
    decal(t,2.6,g,'crack',r*1.25,{n:12}),veins(t,2.6,g,r*1.2),
    chunks(t,add(g,[0,0.4,0]),Math.min(20,6+r*2),'rock_chunk','glow',C.lava,C.deep,{speed:[r*1.2,r*2.4],up:[3,6],msize:[0.1,0.24]}),
    chunks(t,add(g,[0,0.4,0]),Math.min(16,4+r*2),'rock_chunk','solid',C.rock2,C.rock,{speed:[r,r*2],up:[2,5],msize:[0.15,0.32]}),
    smoke(t+0.05,add(g,[0,0.3,0]),Math.min(16,5+r*2),C.smoke,{fr:r*0.5,size:[12,18],plife:[1.2,1.8]}),
    haze(t,1.2,add(g,[0,1,0]),r*1.6,1),shock(t,g,r*2,'#ff8a40',0.45,1.3),light(t,0.6,add(g,[0,1,0]),C.lt,2,r*4+6),...(k>0.6?[shake(t,2.5+r*0.7)]:[])];},
  form(t,p,s=1){const C=this.C;return [flash(t,p,0.8*s,C.lava2,0.1),chunks(t,p,Math.round(8*s),'rock_chunk','glow',C.lava,C.deep,{dir:'in',speed:[2,3],up:[0,0],g:0,plife:[0.25,0.35],fr:1.2*s,msize:[0.08,0.16],bounce:0}),haze(t,0.5,p,1.2*s,0.9)];},
  zone(t,d,p,r){const C=this.C,g=[p[0],0,p[2]];return [
    mesh(t,d,{nm:'crust',att:'ground',pos:add(g,[0,0.04,0]),shape:'disc',mat:'energy',col:C.deep,col2:C.lava,scale:{'0':0.1,'0.1':r,'1':r,ease:'out'},op:{'0':0.5,'0.85':0.4,'1':0},rim:1.6,scroll:0.15}),
    emit(t,d,{nm:'glow',rate:Math.min(20,r*3),pos:add(g,[0,0.2,0]),att:'ground',from:'disc',fr:r*0.85,dir:'up',speed:[0.4,1.2],plife:[0.6,1],look:'ember',size:[1.4,2.2],col:C.lava2,c2:C.lava,gravity:-0.6}),
    decal(t,d,g,'crack',r,{n:14}),decal(t,d,g,'dark',r*0.9,{op:0.5}),veins(t,d,g,r),
    emit(t,d,{nm:'smoke',rate:Math.min(12,r*2),pos:add(g,[0,0.3,0]),att:'ground',from:'disc',fr:r*0.8,dir:'up',speed:[0.3,0.8],plife:[1.2,1.8],look:'smoke',fb:'tex/smoke_puff',size:[10,15],col:C.smoke,c2:'#3a3430',gravity:-0.3,grow:1,x:true}),haze(t,d,add(g,[0,0.7,0]),r*1.6,0.8)];},
  wall(t,d,p,len,h,yaw=0){const C=this.C;return [mesh(t,d,{nm:'wall',att:'ground',pos:p,yaw,shape:'model',model:'rock_spikes',mat:'solid',col:C.rock,scale:{'0':[0.6,0.05,len*0.16],'0.08':[0.6,h*0.6,len*0.16],'1':[0.6,h*0.6,len*0.16]},op:{'0':1,'0.9':1,'1':0}}),
    decal(t,d,p,'crack',Math.max(1.2,len*0.35),{}),chunks(t,p,10,'rock_chunk','glow',C.lava,C.deep,{from:'box',fr:0.6,speed:[2,4],up:[3,5]}),smoke(t,add(p,[0,0.3,0]),6,C.smoke,{fr:len*0.3,size:[10,14]})];},
  slab(t,T,p0,p1){const C=this.C;return [mesh(t,T,{nm:'slab',pos:{'0':p0,'1':p1},shape:'model',model:'rock_chunks',mat:'solid',col:C.rock,scale:0.7,spin:200,fade:0}),
    mesh(t,T,{nm:'glow',pos:{'0':p0,'1':p1},shape:'sphere',mat:'fire',mode:'ball',col:C.lava2,col2:C.deep,heat:-0.2,scale:0.5,fade:0}),
    emit(t,T,{nm:'smoke',rate:30,pos:{'0':p0,'1':p1},from:'sphere',fr:0.5,dir:'up',speed:[0.2,0.6],plife:[0.6,1],look:'smoke',fb:'tex/smoke_puff',size:[6,10],col:C.smoke,c2:'#3a3430',gravity:-0.3,grow:1,x:true})];},
  aura(t,d){const C=this.C;return [decal(t,d,[0,0,0],'crack',1.6,{}),veins(t,d,[0,0,0],1.6),haze(t,d,[0,1,0],2,0.8)];},
  cloud(t,d,p,r){const C=this.C,g=[p[0],0,p[2]];return [emit(t,0.4,{nm:'cloud',rate:60,pos:add(g,[0,1.2,0]),from:'sphere',fr:r*0.3,dir:'out',speed:[r*0.5,r*1.2],plife:[d*0.7,d],look:'smoke',fb:'tex/smoke_puff',size:[30,46],col:'#7a7068',c2:'#5a524c',gravity:-0.05,grow:0.6,drag:1.4}),
    emit(t,d*0.6,{nm:'cinders',rate:24,pos:add(g,[0,1.2,0]),from:'sphere',fr:r*0.6,dir:'random',speed:[0.3,0.8],plife:[0.8,1.2],look:'ember',size:[1.2,2],col:C.lava2,c2:C.lava,gravity:0})];},
  drill(t,T,p0,p1){const C=this.C;return [mesh(t,T,{nm:'drill',pos:{'0':p0,'1':p1},shape:'cone',mat:'fire',col:C.lava2,col2:C.deep,heat:0.1,scale:[0.35,1.6,0.35],spin:720,fade:0})];},
  giant(t,d,p){return [...this.burst(t,p,9,1),...this.zone(t+0.2,d,p,14),ringG(t,[p[0],0.1,p[2]],22,'#ffffff',0.7,0.35)];},
},
// ---- 4 พายุทราย: ทรายหมุนวน คลื่นทราย ฝุ่นทองหนา กรวด ----
sand:{name:'พายุทราย',desc:'พายุทราย — ทรายหมุนเป็นเกลียว คลื่นทรายแผ่เป็นวง ฝุ่นทรายสีทองหนาลอยต่ำ กรวดเม็ดเล็กปลิว',
  C:{sand:'#d8b878',sand2:'#a8844c',light:'#f4e2b0',rock:'#8a6a44',lt:'#ffe0a0'},
  burst(t,p,r,k=1){const C=this.C,g=[p[0],0,p[2]];return [flash(t,add(g,[0,0.5,0]),r*0.4,C.light,0.1),
    mesh(t,0.9,{nm:'twister',att:'ground',pos:g,shape:'model',model:'tornado',mat:'tex',tex:'tex/noise_clouds',col:C.sand2,col2:C.sand,rim:1,uvTile:[3,2],uvScroll:[0.8,0.4],scale:{'0':[r*0.2,0.2,r*0.2],'0.25':[r*0.4,r*0.45,r*0.4],'1':[r*0.6,r*0.3,r*0.6],ease:'out'},spin:400,op:{'0':0.7,'0.6':0.5,'1':0}}),
    mesh(t,0.5,{nm:'wave',att:'ground',pos:add(g,[0,0.1,0]),shape:'ring',inner:0.8,mat:'tex',tex:'tex/noise_clouds',col:C.sand2,col2:C.sand,uvTile:[6,1],scale:{'0':0.3,'1':r*1.4,ease:'out'},op:{'0':0.9,'1':0}}),
    emit(t,0.05,{nm:'grit',burst:Math.min(50,14+r*6),pos:add(g,[0,0.3,0]),from:'disc',fr:r*0.3,dir:'flat',speed:[r*2,r*3.5],up:[0.5,2],plife:[0.4,0.8],look:'spark',size:[1.2,1.8],col:C.light,c2:C.sand2,gravity:5,drag:2}),
    chunks(t,add(g,[0,0.3,0]),Math.min(14,4+r*2),'rock_chunk','solid',C.rock,C.sand2,{speed:[r,r*2],up:[2,4],msize:[0.08,0.18]}),
    smoke(t+0.03,add(g,[0,0.3,0]),Math.min(22,6+r*3),C.sand,{fr:r*0.6,dir:'flat',speed:[1.5,3.5],size:[16,26],plife:[1.2,2],c2:C.sand2}),
    light(t,0.3,add(g,[0,1.2,0]),C.lt,1.2,r*3+6),...(k>0.6?[shake(t,2+r*0.6)]:[])];},
  form(t,p,s=1){const C=this.C;return [emit(t,0.3,{nm:'pour',rate:80,pos:p,from:'sphere',fr:0.9*s,dir:'in',speed:[2,3],plife:[0.25,0.35],look:'spark',size:[1.2,1.8],col:C.light,c2:C.sand2,gravity:0,drag:0}),smoke(t,p,4,C.sand,{fr:0.4*s,size:[8,12],plife:[0.6,0.9]})];},
  zone(t,d,p,r){const C=this.C,g=[p[0],0,p[2]];return [
    mesh(t,d,{nm:'vortex',att:'ground',pos:add(g,[0,0.04,0]),shape:'disc',mat:'tex',tex:'tex/vortex_portal',col:C.sand,col2:C.light,scale:{'0':0.1,'0.1':r,'1':r,ease:'out'},spin:-40,op:{'0':0.9,'0.85':0.8,'1':0}}),
    emit(t,d,{nm:'drift',rate:Math.min(20,r*3),pos:add(g,[0,0.3,0]),att:'ground',from:'disc',fr:r*0.9,dir:'tangent',speed:[1,2.5],plife:[1,1.6],look:'smoke',fb:'tex/smoke_puff',size:[10,16],col:C.sand,c2:C.sand2,gravity:-0.05,grow:0.8,x:true}),
    emit(t,d,{nm:'grit',rate:Math.min(40,r*6),pos:add(g,[0,0.2,0]),att:'ground',from:'disc',fr:r*0.9,dir:'tangent',speed:[2,4],plife:[0.4,0.7],look:'spark',size:[1,1.6],col:C.light,c2:C.sand2,gravity:1})];},
  wall(t,d,p,len,h,yaw=0){const C=this.C;return [mesh(t,d,{nm:'wall',att:'ground',pos:p,yaw,shape:'model',model:'tornado',mat:'tex',tex:'tex/noise_clouds',col:C.sand2,col2:C.sand,uvTile:[3,2],uvScroll:[0.6,0.2],scale:{'0':[0.8,0.05,len*0.14],'0.08':[0.8,h*0.4,len*0.14],'1':[0.8,h*0.4,len*0.14]},op:{'0':0.95,'0.9':0.9,'1':0}}),
    smoke(t,add(p,[0,0.3,0]),10,C.sand,{fr:len*0.3,size:[12,18],c2:C.sand2})];},
  slab(t,T,p0,p1){const C=this.C;return [mesh(t,T,{nm:'slab',pos:{'0':p0,'1':p1},shape:'model',model:'rock_chunks',mat:'solid',col:C.rock,scale:0.6,spin:300,fade:0}),
    emit(t,T,{nm:'stream',rate:60,pos:{'0':p0,'1':p1},from:'sphere',fr:0.6,dir:'random',speed:[0.5,1.5],plife:[0.3,0.6],look:'spark',size:[1.2,1.8],col:C.light,c2:C.sand2,gravity:3}),
    emit(t,T,{nm:'dust',rate:20,pos:{'0':p0,'1':p1},from:'sphere',fr:0.5,dir:'random',speed:[0.2,0.6],plife:[0.6,1],look:'smoke',fb:'tex/smoke_puff',size:[8,12],col:C.sand,c2:C.sand2,gravity:-0.1,grow:0.8,x:true})];},
  aura(t,d){const C=this.C;return [mesh(t,d,{nm:'orbit',att:'feet',pos:[0,0.05,0],shape:'model',model:'tornado',mat:'tex',tex:'tex/noise_clouds',col:C.sand2,col2:C.sand,uvTile:[3,2],uvScroll:[0.8,0.3],scale:[0.9,0.9,0.9],spin:300,op:{'0':0,'0.15':0.6,'0.9':0.6,'1':0}})];},
  cloud(t,d,p,r){const C=this.C,g=[p[0],0,p[2]];return [emit(t,0.4,{nm:'cloud',rate:70,pos:add(g,[0,1.2,0]),from:'sphere',fr:r*0.3,dir:'out',speed:[r*0.5,r*1.3],plife:[d*0.7,d],look:'smoke',fb:'tex/smoke_puff',size:[32,50],col:C.sand,c2:C.sand2,gravity:-0.05,grow:0.6,drag:1.3}),
    emit(t,d*0.8,{nm:'grit',rate:40,pos:add(g,[0,1,0]),from:'sphere',fr:r*0.7,dir:'tangent',speed:[2,4],plife:[0.5,0.9],look:'spark',size:[1,1.6],col:C.light,c2:C.sand2,gravity:0.5})];},
  drill(t,T,p0,p1){const C=this.C;return [mesh(t,T,{nm:'drill',pos:{'0':p0,'1':p1},shape:'model',model:'tornado',mat:'tex',tex:'tex/noise_clouds',col:C.sand2,col2:C.sand,uvTile:[3,2],uvScroll:[1.2,0.5],rot:[0,0,0],scale:[0.45,0.7,0.45],spin:700,fade:0})];},
  giant(t,d,p){return [...this.burst(t,p,9,1),...this.zone(t+0.2,d,p,14),ringG(t,[p[0],0.1,p[2]],22,'#ffffff',0.7,0.35)];},
},
};
const EORDER=['crystal','rune','magma','sand'];

// ======================================================================
//  ท่าไฟ (ตามเกม: js/06-pyro.js) — K = ชุดของธีม
// ======================================================================
const WAND=[0.35,1.45,0.6];
const FMOVES={
  spark:['ประกายไฟ (คลิกสั้น 6 ดาเมจ ระยะ ~20 ม.)','front0',K=>[...K.cast(0,WAND,0.9),...K.shot(0.03,0.22,WAND,[0,1.3,12],0.95),...K.hit(0.25,[0,1.3,12],1.4,0.3)]],
  fireball:['ลูกไฟชาร์จ (กดค้าง 1.5 วิ แล้วปล่อย)','self',K=>[...K.charge(0,1.2,WAND,1.5),...K.cast(1.2,WAND,1.5),...K.shot(1.22,0.38,WAND,[0,1.3,16],1.9),...K.hit(1.6,[0,1.2,16],3,1)]],
  shield:['โล่ไฟ (คลิกขวาค้าง) + ลูกไฟวิญญาณวนรอบตัว • parry ที่ 1.2 วิ','self',K=>[...K.aura(0,2.6,1.3),K.shellOrb(0,2.6,0),K.shellOrb(0,2.6,1),...K.cast(1.2,[0,1.2,0.9],1.6),...K.hit(1.2,[0,1.2,1.4],1.4,0.3)]],
  dash:['พุ่งชาร์จ (Dash) — ชาร์จแล้วพุ่งไปข้างหน้า ~10 ม. ทิ้งทางไฟ 3 วิ','self',K=>[...K.charge(0,0.6,[0,0.5,0],2),...K.hit(0.6,[0,0.6,-1],2,0.7),...K.shot(0.6,0.3,[0,1,0],[0,1,10],2.2),...K.line(0.62,3,[0,0,0],[0,0,10],1.8)]],
  kindle:['Kindle — ไฟดันตัวกระโดดขึ้น ลอยตกช้า 3 วิ ลูกไฟใหญ่ 2 ลูกพร้อมยิง','self',K=>[...K.hit(0,[0,0,0],2.2,0.6),...K.aura(0.1,2.8,1.4),...K.charge(0.2,2.6,WAND,1.2)]],
  dragonfall:['Dragonfall — ทะยานขึ้น เล็งวงบนพื้น แล้วดิ่งลงระเบิด (รัศมี 6 ม.)','front',K=>[...K.column(0,0.7,[0,0,0],5,1),...K.tele(0.3,1.15,[0,0,10],6),...K.meteor(1.1,0.3,[-2,12,4],[0,0.5,10],1.2),...K.hit(1.4,[0,0.5,10],6,1),...K.zone(1.5,1.6,[0,0,10],5)]],
  ringofembers:['Ring of Embers — อุกกาบาตลงแล้วเป็นวงกับดัก','front',K=>[...K.tele(0,0.5,[0,0,10],4),...K.meteor(0.2,0.35,[1,14,6],[0,0.4,10],1),...K.hit(0.55,[0,0.4,10],2.6,0.8),
    ...K.line(0.65,2.6,[-4,0,10],[0,0,14],0.9),...K.line(0.65,2.6,[0,0,14],[4,0,10],0.9),...K.line(0.65,2.6,[4,0,10],[0,0,6],0.9),...K.line(0.65,2.6,[0,0,6],[-4,0,10],0.9)]],
  blazeform:['Blazeform — ร่างไฟ 6 วิ (ดาเมจแรงขึ้น)','self',K=>[...K.hit(0,[0,0.2,0],2,0.8),...K.aura(0.05,3.2,1.6)]],
  ignitionsnap:['Ignition Snap — ดีดนิ้ว ศัตรูที่ติดไฟระเบิดทุกคน','front0',K=>[...K.cast(0,WAND,1),...K.hit(0.18,[-3,0.5,8],2.4,0.6),...K.hit(0.26,[2.5,0.5,11],2.4,0.6),...K.hit(0.34,[0,0.5,14],3.2,1)]],
  colossus:['อัลติ Inferno Colossus — ยักษ์ไฟ 10 วิ','self',K=>[...K.hit(0,[0,0,0],3,1),...K.giant(0.1,3.4)]],
};
// ======================================================================
//  ท่าดิน (ตาม designs/earth.md §0) — Stand ตัวจริงเป็นโมเดลในเกม ไฟล์นี้คือเอฟเฟกต์รอบ ๆ
// ======================================================================
const EMOVES={
  punch:['หมัด Stand — Stand โผล่ข้างเป้า ต่อย 1 หมัด แล้วจางหาย (10 ดาเมจ ระยะล็อก 15 ม.)','front0',K=>[...K.form(0,[1.2,1.5,7],1),...K.burst(0.25,[0,0,8.5],0.9,0.3),...K.form(0.6,[1.2,1.5,7],0.6)]],
  chargeslam:['BA ชาร์จ — Stand ใหญ่ยกสองมือ 2 วิ แล้วทุบ (รัศมี 9 ม. 50 ดาเมจ + มึน)','front0',K=>[...K.form(0,[0,3,-1.5],2),...(K.zone?K.zone(0,2,[0,0,9],9).map(l=>Object.assign(l,{life:2})):[]),...K.burst(2,[0,0,9],9,1)]],
  shield:['โล่ Stand — Stand ใหญ่ยืนข้างหลังเอามือบังหน้า (กันรอบตัว 300 HP) • โดนตีที่ 1.2 วิ','self',K=>[...K.form(0,[0,1.6,-0.8],1.4),...K.wall(0.05,2.6,[0,0,1.3],2.4,2.4,90),...K.aura(0.05,2.6),...K.burst(1.2,[0,0,1.6],0.8,0.3)]],
  rampage:['Dash: Stand Rampage — วิ่งชนไปข้างหน้า ~30 ม. แล้วทุบจบ (รัศมี 7.5 ม.)','self',K=>[...K.form(0,[0,1.5,0.5],1.2),...K.slab(0,1.2,[0,1,0],[0,1,30]),...K.burst(0.4,[0,0,10],1.6,0.4),...K.burst(0.8,[0,0,20],1.6,0.4),...K.burst(1.2,[0,0,30],7.5,1)]],
  stonebreaker:['Stonebreaker — งัดแผ่นหินขึ้น Stand ต่อย แผ่นพุ่ง 35 ม. แตกตอนโดน','self',K=>[...K.burst(0,[0,0,2],1.2,0.4),...K.wall(0,0.5,[0,0,2],1.6,1.6,0),...K.form(0.4,[0.6,1.4,0.6],1),...K.burst(0.45,[0,1.2,2],0.8,0.6),...K.slab(0.45,0.55,[0,1.2,2.2],[0,1.2,20]),...K.burst(1,[0,0.6,20],2.2,1)]],
  mudswamp:['Mud Swamp — วงเตือน 0.5 วิ แล้วพื้นกลายเป็นบ่อ (รัศมี 6 ม. 5 วิ)','front',K=>[...K.form(0,[0,0.3,10],0.6),...K.burst(0.5,[0,0,10],2,0.4),...K.zone(0.5,3,[0,0,10],6)]],
  tectoniccrush:['Tectonic Crush — กำแพง 2 ข้างพุ่งจากพื้น (ยาว 15 ม. ห่าง 12 ม.) แล้วบีบปิด BOOM','front',K=>[...K.wall(0,1.8,[-6,0,10],15,4,0),...K.wall(0,1.8,[6,0,10],15,4,0),...K.form(1,[0,3.2,18],1.6),...K.burst(1.6,[0,0,10],6,1),...K.burst(1.66,[0,0,5],3,0.5),...K.burst(1.66,[0,0,15],3,0.5)]],
  dustburst:['Dust Burst — ดึงหินขึ้นระดับหัว Stand บีบ แล้วระเบิดเป็นฝุ่นใหญ่ (รัศมี 17 ม.)','front',K=>[...K.form(0,[0,1.7,10],1.2),...K.slab(0,1.1,[0,1.7,10],[0,1.75,10]),...K.burst(1.1,[0,1.7,10],2,0.8),...K.cloud(1.1,4,[0,0,10],17)]],
  terraauger:['Terra Auger — สว่านหินชาร์จข้างตัว แล้วพุ่งเฉียงลงจุดเล็ง (เต็ม = รัศมี 7.5 ม.)','front',K=>[...K.form(0,[1.4,2.4,0],1),...K.drill(0,1.5,[1.4,2.4,0],[1.4,2.45,0]),...K.drill(1.5,0.3,[1.4,6,1],[0,0.6,12]),...K.burst(1.8,[0,0,12],7.5,1)]],
  wrath:['อัลติ Wrath — เสาหินยักษ์ขว้างลงจากฟ้า ปักพื้น + บ่อโคลนรัศมี 20 ม.','front',K=>[...K.form(0,[0,6,-2],2.4),...K.slab(0.8,0.25,[0,22,-4],[0,1.5,14]),...K.giant(1.05,3.2,[0,0,14]),...K.wall(1.05,3.2,[0,0,14],2.2,7,0),shake(1.05,6,{life:0.5})]],
};

// ---------- เขียนไฟล์ ----------
const only=process.argv.slice(2);let n=0;
for(const [m,[th,at,fn]] of Object.entries(FMOVES)){if(only.length&&!only.includes(m))continue;
  FORDER.forEach((k,i)=>{N=0;const K=FT[k];W('var2-fire',`${m}_${i+1}`,{desc:`แบบ ${i+1} (${K.name}): ${th} — ${K.desc}`,tags:['fire','variant2',k],pal:'fire',at,layers:fn(K)});n++;});}
for(const [m,[th,at,fn]] of Object.entries(EMOVES)){if(only.length&&!only.includes(m))continue;
  EORDER.forEach((k,i)=>{N=0;const K=ET[k];W('var2-earth',`${m}_${i+1}`,{desc:`แบบ ${i+1} (${K.name}): ${th} — ${K.desc}`,tags:['earth','variant2',k],pal:'earth',at,layers:fn(K)});n++;});}
fs.writeFileSync(path.join(__dirname,'vfx-var2-at.json'),JSON.stringify(AT,null,0));console.log('เขียน',n,'ไฟล์');
