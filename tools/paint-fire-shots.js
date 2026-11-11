// painterly look-dev shot: one map per run. window.__pt={map,tag,pos,ang}
const O=window.__pt||{},map=O.map||'forest',TAG=O.tag||'base',images={};
{let sd=20261110;Math.random=()=>{sd=(sd*1664525+1013904223)>>>0;return sd/4294967296;};}
try{localStorage.setItem('wd_kit2',(window.__pt&&window.__pt.kit)||'0');}catch(e){}
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

const PX=(O.pos||[1180,820])[0],PY=(O.pos||[1180,820])[1],PA=O.ang===undefined?0.3:O.ang;
const me=HL.me();me.x=PX;me.y=PY;me.ang=PA;HL.aim(PA);
const keep=()=>{park();me.hp=200;me.ult=100;me.cd&&Object.keys(me.cd).forEach(k=>me.cd[k]=0);};
const keys=O.keys||['fire','q','e','r','f','sp','x'];
const press=k=>{if(k==='fire')HL.input({fire:true});else WD.INPUT.c[k]=(WD.INPUT.c[k]||0)+1;};
// warm: fire each once so lazy fx files load
for(const k of keys){press(k);for(let i=0;i<50;i++){keep();HL.step(1);}HL.input({fire:false});}
await HL.sleep(5000);for(let i=0;i<240;i++){keep();HL.step(1);}
HL.cam(O.cam||'q34',{dist:O.dist||7,h:1.6,look:[0,1.4,3]});
for(const k of keys){
  for(let i=0;i<150;i++){keep();HL.step(1);}me.x=PX;me.y=PY;me.ang=PA;HL.aim(PA);for(let i=0;i<20;i++){keep();HL.step(1);}
  let fired=false;
  images['fire_'+TAG+'_'+k]=HL.film(O.times||[0.1,0.3,0.55,0.9,1.4,2.2],t=>{keep();if(!fired){press(k);fired=true;}if(k==='fire'&&t>0.5)HL.input({fire:false});},{w:640,cols:3,title:TAG+' '+k});
  HL.input({fire:false});
}
return {map:WD.G.map,kit:me.kit,images,errors:[...new Set(HL.errs)].slice(0,5)};
