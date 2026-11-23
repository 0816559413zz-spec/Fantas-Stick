// Look-dev screenshots on the real GPU: a few maps, player + 2 bots in front, standard camera. Output shots/look_<tag>_<map>.jpg
// Run: python tools/serve.py   then   node tools/headless.js --game --js tools/look-shots.js --w 1600 --h 900 --quiet --timeout 280
// crop = [x,y,w,h] in real canvas pixels + zoom = integer scale → zoomed crop instead of the whole frame
// Options (set window.__look = {tag:'after', maps:['forest',...], w:1280, set:{'look.envNight':1.2}, sheet:1} in a wrapper script, or edit defaults)
//   set = tune keys applied before shooting (WD.tuneSetKey) • sheet:1 = one contact sheet shots/look_<tag>_sheet.jpg (2 columns) instead of single images
// 2026-11-23: starts TDM with 2 lobby bots (coop/hostToLobby flow stayed in the lobby)
const O=window.__look||{},TAG=O.tag||'before',MAPS=O.maps||['forest','castle','meadow','gorge','ruins','lake'],W=O.w||1280,images={};
{let sd=20261107;Math.random=()=>{sd=(sd*1664525+1013904223)>>>0;return sd/4294967296;};}
try{localStorage.setItem('wd_kit2','0');}catch(e){}document.getElementById('btnSolo').click();for(let i=0;i<60&&WD.screen!=='lobby';i++)await HL.sleep(100);
WD.G.mode='tdm';WD.lobbyBotAdd(-1,2,1);WD.lobbyBotAdd(-1,2,1);{let a=0;for(const p of Object.values(WD.G.players))p.lteam=a++<2?0:1;}WD.broadcastLobby();for(const [k,v] of Object.entries(O.set||{}))WD.tuneSetKey(k,v);if(O.pre)new Function('WD',O.pre)(WD);
const cells=[],info=[];
for(let mi=0;mi<MAPS.length;mi++){const map=MAPS[mi];
  {if(mi){WD.hostToLobby();await HL.sleep(300);}WD.G.mode='tdm';WD.G.mapPick=map;WD.hostStart();HL.freeze&&0;for(let i=0;i<80&&WD.screen!=='game';i++)await HL.sleep(100);}
  WD.QUAL.mode='high';WD.QUAL.lvl=0;WD.applyQuality();
  for(let i=0;i<400&&WD.G.ph!=='play';i++)HL.step(1);
  for(let i=0;i<120;i++){HL.step(1);if(i%30===0)await HL.sleep(0);}
  const until=performance.now()+25000;let settled=0;
  while(performance.now()<until&&settled<3){HL.step(2);WD.G.en=[];await HL.sleep(30);settled=!WD.warm.q.length&&!WD.warm.busy?settled+1:0;}
  await HL.sleep(5000);
  const me=HL.me(),a=me.ang||0,c=Math.cos(a),s=Math.sin(a);
  Object.values(WD.G.players).filter(p=>p!==me).forEach((p,i)=>{p.x=me.x+c*170-s*(i?90:-90);p.y=me.y+s*170+c*(i?90:-90);p.ang=a+Math.PI;});
  WD.G.en=[];WD.G.tr&&(WD.G.tr.datk=0);
  for(let i=0;i<90;i++)HL.step(1);
  info.push(map+':'+WD.G.map+':'+WD.screen);
  cells.push({c:HL.snap(W),label:TAG+' • '+map});
}
images['look_'+TAG+'_sheet']=HL.sheet(cells,2,TAG+' '+JSON.stringify(O.set||{}));
return {info,images,errors:[...new Set(HL.errs)].slice(0,5)};
