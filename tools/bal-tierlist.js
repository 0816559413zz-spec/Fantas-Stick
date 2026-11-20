// Tier list data in one headless run (2026-11-20). Writes shots/tier.json only (small) — read that, no screenshots.
//   node tools/headless.js --game --js tools/bal-tierlist.js --timeout 3600 --quiet
// ?q=1 quick smoke run (few rounds) • every visible class (PATHS without off)
const q=new URLSearchParams(location.search),quick=q.has('q');
await HL.solo({kit:'0'});
for(let i=0;i<160;i++){HL.step(1);await HL.sleep(20);if(i>30&&!WD.warm.busy&&!WD.warm.q.length)break;}
const P=WD.PATHS.map((p,i)=>p.off?-1:i).filter(i=>i>=0&&WD.SPELL_LIST.some(s=>s.path===i&&!s.ult));
const ids=P.map(i=>WD.PATHS[i].id),R=(a,b)=>quick?a:b,out={classes:ids,started:Date.now()};
const step=async(name,fn)=>{const t=Date.now();out[name]=fn();out[name+'_s']=Math.round((Date.now()-t)/1000);await HL.sleep(0);};
await step('duel',()=>WD.team(P,1,R(2,16),60,'mono'));
await step('mix2',()=>WD.team(P,2,R(6,160),60,'mix'));
await step('mix6',()=>WD.team(P,6,R(4,90),75,'mix'));
await step('mono2',()=>WD.team(P,2,R(1,4),60,'mono'));
await step('mono6',()=>WD.team(P,6,R(1,2),75,'mono'));
// raw skill numbers straight from game data (no design docs to read)
out.spells={};
for(const i of P){const id=WD.PATHS[i].id;out.spells[id]=WD.SPELL_LIST.filter(s=>s.path===i).map(s=>({id:s.id,n:s.n,ult:s.ult?1:0,cd:s.cd,role:s.role,v:s.v}));}
out.total_s=Math.round((Date.now()-out.started)/1000);
return {files:{'tier.json':JSON.stringify(out)}};
