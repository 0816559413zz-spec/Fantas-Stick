const P=WD.PATHS.findIndex(p=>p.id==='darkness');
if(P<0)return {err:'no darkness path',paths:WD.PATHS.map(p=>p.id)};
const SP=WD.SPELL_LIST.filter(s=>s.path===P).map(s=>({id:s.id,n:s.n,ult:!!s.ult,i:s.i}));
await HL.solo({kit:String(P)});
for(let i=0;i<160;i++){HL.step(1);await HL.sleep(30);if(i>30&&!WD.warm.busy&&!WD.warm.q.length)break;}
await HL.sleep(800);
const p=HL.me();const d=HL.dummy(220,0);if(d){d.spd=0;}
const log=[];const G_T=()=>WD.G.time;const hp0=()=>d?Math.round(d.hp):null;
const place=()=>{if(!d)return;d.x=d.ax=p.x+Math.cos(p.ang)*180;d.y=d.ay=p.y+Math.sin(p.ang)*180;d.spd=0;};
const run=async(label,fn,steps=90)=>{place();const h=hp0();let err=null;try{fn();}catch(e){err=String(e).slice(0,120);}let mn=h,drop=0,last=h;for(let i=0;i<steps;i++){if(d){d.x=d.ax;d.y=d.ay;}HL.step(1);if(d){const c=Math.round(d.hp);if(c<last)drop+=last-c;last=c;}if(i%10===0)await HL.sleep(0);}HL.input({fire:0,sh:0});log.push({label,dmg:drop,err,cd:Object.entries(p.cd).filter(([k,v])=>v>0.05).map(([k,v])=>k+':'+v.toFixed(1)).join(' '),dist:d?Math.round(Math.hypot(d.x-p.x,d.y-p.y)):null,mark:!!(d&&p.dark&&p.dark.marks&&p.dark.marks.has(d)),flow:!!(p.dark&&(p.dark.flow>G_T()))});if(d){d.hp=d.maxHp;}};
p.lst=5;
await run('BA',()=>HL.input({fire:1}),40);
await run('ult',()=>{p.ult=100;const r=WD.castUlt(p);log.push({label:'ultcast',r:String(r),u:p.ult});},180);
await run('dash tap',()=>{const c=WD.INPUT.c||(WD.INPUT.c={});c.sp=(c.sp|0)+1;},30);
await run('BA after dash (18?)',()=>HL.input({fire:1}),40);
for(let s of [0,2,1,3]){await run('slot'+s,()=>{for(const k in p.cd)p.cd[k]=0;const ok=WD.castSlot(p,s);if(ok===false)throw new Error('cast rejected');},150);}
await run('BA after (marked?)',()=>HL.input({fire:1}),40);
await run('dash tap',()=>{const c=WD.INPUT.c||(WD.INPUT.c={});c.sp=(c.sp|0)+1;},60);
await run('shield',()=>HL.input({sh:1}),120);
await run('ult',()=>{p.ult=100;WD.castUlt(p);},180);
document.querySelector('#intro')&&(document.querySelector('#intro').style.display='none');
HL.cam('back',{dist:5,h:1.7,look:[0,1.1,2]});HL.step(5);await HL.sleep(500);
return {buffs:p.buffs,P,kit:p.kit,kitIds:p.kitIds,dummyHp:d&&d.maxHp,log,errs:HL.errs.slice(0,5)};
