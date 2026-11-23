// Mid-match shader gate runner (guides/PRELOAD-STANDARD.md §3d). Needs `python tools/serve.py` running.
// Runs tools/bench-shader-gate.js for each config, prints every shader compiled mid-match, exit 1 if any.
//   node tools/shader-gate.js            all configs
//   node tools/shader-gate.js siege      only configs whose hash contains "siege"
const {execFileSync}=require('child_process'),path=require('path');
const CFG=['mode=siege&map=fcs-file&shift=0','mode=siege&map=fcs-file&shift=5','mode=tdm&shift=0','mode=tdm&shift=5'];
const pick=process.argv[2],runs=CFG.filter(c=>!pick||c.includes(pick));let fail=0;
for(const c of runs){
  let out='';
  try{out=execFileSync('node',[path.join(__dirname,'headless.js'),'--url','index.html?nosw#'+c,'--game','--js',path.join(__dirname,'bench-shader-gate.js'),'--timeout','420','--quiet'],{encoding:'utf8',maxBuffer:1<<26});}
  catch(e){out=(e.stdout||'')+(e.stderr||'');}
  const j=out.indexOf('{');let r=null;try{r=JSON.parse(out.slice(j,out.lastIndexOf('}')+1));}catch(e){}
  if(!r){fail++;console.log(`✗ ${c}: no result\n${out.slice(0,1500)}`);continue;}
  if(r.gate!=='PASS')fail++;
  console.log(`${r.gate==='PASS'?'✓':'✗'} ${c} • map ${r.map} • paths ${r.paths.join(',')} • mid-match shaders ${r.shaders} • slow frames ${r.slow.length}${r.slow.length?' (max '+Math.max(...r.slow.map(s=>s.ms))+' ms)':''}${r.armed?'':' • NOT ARMED'}`);
  for(const l of r.list)console.log('   '+l);
  if(r.errs.length)console.log('   errors: '+r.errs.join(' / '));
}
console.log(fail?`GATE FAIL (${fail}/${runs.length})`:`GATE PASS (${runs.length})`);process.exit(fail?1:0);
