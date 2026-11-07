// Look-dev screenshots on the real GPU: a few maps, player + 2 bots in front, standard camera. Output shots/look_<tag>_<map>.jpg
// Run: python tools/serve.py   then   node tools/headless.js --game --js tools/look-shots.js --w 1600 --h 900 --quiet --timeout 280
// crop = [x,y,w,h] in real canvas pixels + zoom = integer scale → zoomed crop instead of the whole frame
// Options (set window.__look = {tag:'after', maps:['forest',...], w:1280, set:{'look.envNight':1.2}, sheet:1} in a wrapper script, or edit defaults)
//   set = tune keys applied before shooting (WD.tuneSetKey) • sheet:1 = one contact sheet shots/look_<tag>_sheet.jpg (2 columns) instead of single images
const O=window.__look||{},TAG=O.tag||'before',MAPS=O.maps||['forest','castle','meadow','hogsmeade','lake','ruins'],W=O.w||1280,images={};
{let sd=O.seed||20261107;Math.random=()=>{sd=(sd*1664525+1013904223)>>>0;return sd/4294967296;};}   // fixed seed → same spawn/camera every run (A/B comparisons)
await HL.solo({kit:'0'});for(const [k,v] of Object.entries(O.set||{}))WD.tuneSetKey(k,v);if(O.pre)new Function('WD',O.pre)(WD);   // pre = JS run in the page before shooting (e.g. 'WD.gl.toneMapping=6')
const cells=[];
for(const map of MAPS){
  WD.hostToLobby();await HL.sleep(150);WD.G.mode='coop';WD.G.mapPick=map;WD.QUAL.mode='high';WD.QUAL.lvl=0;WD.applyQuality();
  const ps=Object.values(WD.G.players);if(ps.length<3){WD.addPlayer('look-1','Lk1',null,null,'6');WD.addPlayer('look-2','Lk2',null,null,'1');}
  WD.hostStart();
  for(let i=0;i<240;i++){HL.step(1);if(i%30===0)await HL.sleep(0);}
  const until=performance.now()+25000;let settled=0;
  while(performance.now()<until&&settled<3){HL.step(2);await HL.sleep(30);settled=!WD.warm.q.length&&!WD.warm.busy?settled+1:0;}
  const me=HL.me(),a=me.ang||0,c=Math.cos(a),s=Math.sin(a);
  Object.values(WD.G.players).filter(p=>p!==me).forEach((p,i)=>{p.x=me.x+c*170-s*(i?90:-90);p.y=me.y+s*170+c*(i?90:-90);p.ang=a+Math.PI;});
  WD.G.en=[];WD.G.tr&&(WD.G.tr.datk=0);
  for(let i=0;i<90;i++)HL.step(1);
  let cv=HL.snap(W);
  if(O.crop){const src=WD.gl.domElement,[cx,cy,cw,ch]=O.crop,z=O.zoom||2,c=document.createElement('canvas');c.width=cw*z;c.height=ch*z;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(src,cx,cy,cw,ch,0,0,cw*z,ch*z);cv=c;}
  if(O.sheet)cells.push({c:cv,label:TAG+' • '+map});else images['look_'+TAG+'_'+map]=cv.toDataURL('image/jpeg',0.9);
}
if(O.sheet)images['look_'+TAG+'_sheet']=HL.sheet(cells,2,TAG+' '+JSON.stringify(O.set||{}));
return {tag:TAG,maps:MAPS,images,errors:[...new Set(HL.errs)].slice(0,5)};
