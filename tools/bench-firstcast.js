// วัดอาการกระตุกตอนใช้สกิลครั้งแรก (ต่อสาย) — วางในคอนโซล/ javascript_tool หลังกด btnSolo:
//   eval(await (await fetch('/tools/bench-firstcast.js')).text()); H.go('6.37.38.39.41')  แล้วรอ H.done → H.out
// kit: 0 pyro • 1 frost • 2 storm • 6.37.38.39.41 earth (Auger แทน Dust Burst) — เปิดหน้าใหม่ทุกครั้ง (ไม่งั้นไม่ใช่ 'ครั้งแรก')
// แต่ละบรรทัด: max/avg ms ของ 40–60 เฟรมหลังใช้ + program/geometry/texture ที่เพิ่ม • H.diag(fn) = บอกว่า program ใหม่มาจากวัสดุไหน
window.requestAnimationFrame=()=>0;
window.H={};
H.ctx=WD.gl.getContext();H.px=new Uint8Array(4);H.now=performance.now();
H.frame=()=>{const t=performance.now();WD.hostStep(1/60);H.now+=1000/60;WD.render(1/60,H.now);H.ctx.readPixels(0,0,1,1,H.ctx.RGBA,H.ctx.UNSIGNED_BYTE,H.px);return performance.now()-t;};
H.info=()=>{const i=WD.gl.info;return [i.programs.length,i.memory.geometries,i.memory.textures];};
H.run=(n)=>{let mx=0,sum=0;for(let i=0;i<n;i++){const d=H.frame();mx=Math.max(mx,d);sum+=d;}return {mx:+mx.toFixed(0),avg:+(sum/n).toFixed(0)};};
H.meas=(label,fn,n=40)=>{const a=H.info();fn();const r=H.run(n);const b=H.info();return `${label}: max ${r.mx} avg ${r.avg} prog+${b[0]-a[0]} geo+${b[1]-a[1]} tex+${b[2]-a[2]}`;};
H.me=()=>WD.G.players.me;
H.press=k=>{const p=H.me();p.inp.c=Object.assign({},p.inp.c||{});p.inp.c[k]=(p.inp.c[k]|0)+1;};
H.start=(kit,cdFrames=200)=>{const G=WD.G,me=G.players.me;WD.setKit(me,kit);me.kt=me.kit;WD.broadcastLobby();G.mode='train';WD.hostStart();const out=[];out.push(H.meas('start',()=>{},5));H.run(cdFrames);out.push(H.meas('idle',()=>{},60));out.push('warm: '+(WD.warm?WD.warm.log.join(' / '):'-'));return out;};
H.ready=()=>{const me=H.me();me.cd=Object.fromEntries(Object.keys(me.cd).map(k=>[k,0]));me.inp.gx=me.x+220;me.inp.gy=me.y;me.inp.ax=me.inp.gx;me.inp.ay=me.inp.gy;};
H.hold=(field,frames)=>{const me=H.me();me.inp[field]=true;const r=H.run(frames);me.inp[field]=false;return r;};
H.out=[];
H.steps=[
 ()=>{const me=H.me();H.ready();H.out.push(H.meas('BA',()=>{me.inp.fire=true;H.run(3);me.inp.fire=false;},40));H.run(60);},
 ()=>{const me=H.me();H.ready();H.out.push(H.meas('BAcharged',()=>{me.inp.fire=true;H.run(40);me.inp.fire=false;},60));H.run(200);},
 ()=>{const me=H.me();H.ready();H.out.push(H.meas('shield',()=>{me.inp.sh=true;H.run(30);me.inp.sh=false;},30));H.run(60);},
 ()=>{H.ready();H.out.push(H.meas('dash',()=>H.press('sp'),40));H.run(150);},
 ...[0,1,2,3].map(i=>()=>{const me=H.me();H.ready();H.out.push(H.meas('slot'+i+' '+me.kitIds[i],()=>{WD.castSlot(me,i);},60));H.run(200);}),
 ()=>{const me=H.me();H.ready();me.ult=100;H.out.push(H.meas('ult '+me.ultId,()=>WD.castUlt(me),60));H.run(200);},
 ()=>{const me=H.me();H.ready();me.inp.fire=true;H.out.push(H.meas('ult-click',()=>{H.run(3);me.inp.fire=false;},60));H.run(300);},
];
H.go=(kit)=>{H.out=[];H.done=0;const wait=ms=>new Promise(r=>setTimeout(r,ms));const st=[()=>H.out.push(...H.start(kit)),()=>wait(4000),()=>H.run(3),()=>wait(3000),...H.steps];(async()=>{for(const f of st){try{await f();}catch(e){H.out.push('ERR '+e.message);}await wait(0);}H.done=1;})();};
H.diag=(fn,n=20)=>{const props=WD.gl.properties,before=new Set(WD.gl.info.programs),found=[],times=[];const ctx=WD.gl.getContext(),tl=[];
  const oC=ctx.createTexture.bind(ctx);ctx.createTexture=function(){tl.push(new Error().stack.split('\n').slice(3,9).map(s=>s.trim().slice(3,45)).join(' < '));return oC();};
  fn();for(let f=0;f<n;f++){const t0=performance.now();H.frame();times.push(Math.round(performance.now()-t0));const nw=new Set(WD.gl.info.programs.filter(p=>!before.has(p)));
    for(const sc of [WD.scene,WD.post.fxScene])sc.traverse(o=>{if(!o.material)return;for(const m of [].concat(o.material)){const cp=props.get(m).currentProgram;if(cp&&nw.has(cp)){nw.delete(cp);before.add(cp);let p=o,path=[];while(p&&path.length<5){path.push(p.type+(p.name?':'+p.name:''));p=p.parent;}
      found.push({f,key:cp.cacheKey.slice(0,24),m:m.type,col:m.color&&m.color.getHexString(),map:m.map&&m.map.image&&m.map.image.width,warm:!!m.userData.warm,path:path.join('<')});}}});
    for(const p of nw){found.push({f,unmatched:p.cacheKey.slice(0,40)});before.add(p);}}
  ctx.createTexture=oC;return {times:times.join(' '),found,tex:tl};};
'harness ok';
