// Grass cost benchmark (guides/OPTIMIZE.md §Q): GPU ms of one scene render with the grass on / fewer blades / off, at full size and in a tiny viewport
// (tiny viewport = almost no pixels → what is left is vertex work + draw setup). Back-to-back renders so the laptop GPU stays at full clock.
// MODE: window.__grassPass=1 → render through the composer's RenderPass into the real HDR render target (what the game does) instead of straight to the canvas.
// Run: python tools/serve.py   then   node tools/headless.js --game --js tools/bench-grass.js --w 1920 --h 1080 --quiet --timeout 200
const MAP=window.__grassMap||'meadow';
await HL.solo({kit:'0'});WD.hostToLobby();WD.G.mode='coop';WD.G.mapPick=MAP;WD.QUAL.mode='high';WD.QUAL.lvl=0;WD.applyQuality();WD.hostStart();
for(let i=0;i<240;i++){HL.step(1);if(i%30===0)await HL.sleep(0);}
const until=performance.now()+25000;let settled=0;
while(performance.now()<until&&settled<3){HL.step(2);await HL.sleep(30);settled=!WD.warm.q.length&&!WD.warm.busy?settled+1:0;}
HL.aim(0,0.12);for(let i=0;i<60;i++)HL.step(1);
let gm=null;WD.scene.traverse(o=>{if(o.isMesh&&o.geometry&&o.geometry.attributes&&o.geometry.attributes.aOff)gm=o;});
if(!gm)throw new Error('NO_GRASS_MESH');
const g2=WD.gl.getContext(),ext=g2.getExtension('EXT_disjoint_timer_query_webgl2'),gl=WD.gl;
const full=gm.geometry.instanceCount,W=gl.domElement.width,H=gl.domElement.height;
gl.shadowMap.autoUpdate=false;gl.shadowMap.needsUpdate=false;
const med=a=>{const s=[...a].sort((x,y)=>x-y);return +s[Math.floor(s.length/2)].toFixed(3);};
// interleaved rounds (config A,B,C,A,B,C…) so GPU clock ramp / thermal drift hits every config equally
const configs=[
  ['no grass',()=>{gm.visible=false;},0],
  ['grass '+full+' blades (High)',()=>{gm.visible=true;gm.geometry.instanceCount=full;},0],
  ['grass '+Math.round(full*0.5),()=>{gm.visible=true;gm.geometry.instanceCount=Math.round(full*0.5);},0],
  ['grass '+Math.round(full*0.25),()=>{gm.visible=true;gm.geometry.instanceCount=Math.round(full*0.25);},0],
  ['no grass, tiny viewport (1/8)',()=>{gm.visible=false;},8],
  ['grass full, tiny viewport (1/8) = mostly vertex cost',()=>{gm.visible=true;gm.geometry.instanceCount=full;},8]];
const REP2=120,ROUNDS=6,acc=configs.map(()=>({gpu:[],cpu:[]}));
for(let round=0;round<ROUNDS+1;round++)for(let c=0;c<configs.length;c++){
  configs[c][1]();const viewDiv=configs[c][2];
  if(viewDiv){gl.setScissorTest(true);gl.setViewport(0,0,Math.round(W/viewDiv),Math.round(H/viewDiv));gl.setScissor(0,0,Math.round(W/viewDiv),Math.round(H/viewDiv));}
  const q=g2.createQuery(),t0=performance.now();g2.beginQuery(ext.TIME_ELAPSED_EXT,q);
  if(window.__grassPass){const cp=WD.composer,rp=cp.passes[0];for(let i=0;i<REP2;i++)rp.render(gl,cp.renderTarget2,cp.renderTarget1,1/60,false);}else for(let i=0;i<REP2;i++)gl.render(WD.scene,WD.cam);
  g2.endQuery(ext.TIME_ELAPSED_EXT);const cpuMs=(performance.now()-t0)/REP2;
  for(let k=0;k<400&&!g2.getQueryParameter(q,g2.QUERY_RESULT_AVAILABLE);k++)await HL.sleep(5);
  if(!g2.getParameter(ext.GPU_DISJOINT_EXT)&&round>0){acc[c].gpu.push(g2.getQueryParameter(q,g2.QUERY_RESULT)/1e6/REP2);acc[c].cpu.push(cpuMs);}
  g2.deleteQuery(q);gl.setScissorTest(false);gl.setViewport(0,0,W,H);}
const rows=configs.map((c,i)=>({label:c[0],gpuMs:med(acc[i].gpu),gpuMin:+Math.min(...acc[i].gpu).toFixed(3),gpuMax:+Math.max(...acc[i].gpu).toFixed(3),cpuSubmitMs:med(acc[i].cpu)}));
gm.visible=true;gm.geometry.instanceCount=full;
return {map:WD.G.map,res:W+'x'+H,blades:full,trianglesPerBlade:5,grassTriangles:full*5,rows,errors:[...new Set(HL.errs)].slice(0,5)};
