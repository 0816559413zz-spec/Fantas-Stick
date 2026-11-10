// painterly look-dev shot: one map per run. window.__pt={map,tag,pos,ang}
const O=window.__pt||{},map=O.map||'forest',TAG=O.tag||'base',images={};
{let sd=20261110;Math.random=()=>{sd=(sd*1664525+1013904223)>>>0;return sd/4294967296;};}
try{localStorage.setItem('wd_kit2','0');}catch(e){}
document.getElementById('btnSolo').click();
for(let i=0;i<40&&WD.screen!=='lobby';i++)await HL.sleep(100);
WD.G.mode='ffa';WD.G.mapPick=map;const bot=WD.lobbyBotAdd(0,1);
try{WD.bf.BF.on=false;}catch(e){}
WD.hostStart();
for(let i=0;i<80&&WD.screen!=='game';i++)await HL.sleep(100);
await HL.sleep(300);HL.freeze();
for(let i=0;i<400&&WD.G.ph!=='play';i++)HL.step(1);
WD.QUAL.mode='high';WD.QUAL.lvl=0;WD.applyQuality();
const park=()=>{for(const p of Object.values(WD.G.players))if(p!==HL.me()){p.x=40;p.y=40;p.hp=p.mhp||200;if(p.ai)p.ai.off=1;}WD.G.proj=[];};
for(let i=0;i<120;i++){park();HL.step(1);if(i%30===0)await HL.sleep(0);}
const until=performance.now()+20000;let settled=0;
while(performance.now()<until&&settled<3){park();HL.step(2);await HL.sleep(30);settled=!WD.warm.q.length&&!WD.warm.busy?settled+1:0;}
const me=HL.me();
const views=O.views||[{n:'a'}];
for(const v of views){
  if(v.pos){me.x=v.pos[0];me.y=v.pos[1];}if(v.ang!==undefined){me.ang=v.ang;HL.aim(v.ang,v.pitch);}
  HL.cam(v.cam||null,v.opt);
  for(let i=0;i<50;i++){park();me.hp=200;if(v.ang!==undefined)HL.aim(v.ang,v.pitch);HL.step(1);}
  images['pt_'+TAG+'_'+map+'_'+v.n]=HL.snap(1280).toDataURL('image/jpeg',0.92);
}
return {map:WD.G.map,MW:WD.MW,MH:WD.MH,me:{x:me.x,y:me.y,ang:me.ang},images,errors:[...new Set(HL.errs)].slice(0,5)};
