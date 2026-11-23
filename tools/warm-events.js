// Record skill event samples for the entry rehearsal (guides/PRELOAD-STANDARD.md step 4). Needs `python tools/serve.py`.
// Runs the shader-gate bench with ?warmrec on every config (all paths fight, ults refilled), merges the samples
// (max 2 per event kind) into assets/warm-events.json. Re-run after adding or changing skills, then commit the json.
//   node tools/warm-events.js [filter]
const {execFileSync}=require('child_process'),path=require('path'),fs=require('fs');
const CFG=['mode=siege&map=fcs-file&shift=0','mode=siege&map=fcs-file&shift=5','mode=tdm&shift=0','mode=tdm&shift=5'];
const pick=process.argv[2],runs=CFG.filter(c=>!pick||c.includes(pick));
const OUT=path.join(__dirname,'..','assets','warm-events.json'),M=new Map();
for(const c of runs){
  let out='';
  try{out=execFileSync('node',[path.join(__dirname,'headless.js'),'--url','index.html?nosw&warmrec&norehearse#'+c+'&n=2400','--game','--js',path.join(__dirname,'bench-shader-gate.js'),'--timeout','420','--quiet'],{encoding:'utf8',maxBuffer:1<<28});}
  catch(e){out=(e.stdout||'')+(e.stderr||'');}
  const j=out.indexOf('{');let r=null;try{r=JSON.parse(out.slice(j,out.lastIndexOf('}')+1));}catch(e){}
  const F=path.join(__dirname,'..','shots','warm-rec.json');
  if(!r||!fs.existsSync(F)){console.log('✗ '+c+': no result');continue;}
  r.rec=JSON.parse(fs.readFileSync(F,'utf8'));fs.unlinkSync(F);
  for(const ev of r.rec){const k=ev.k+'|'+(ev.z||ev.t||'');const L=M.get(k)||[];if(L.length<2){L.push(ev);M.set(k,L);}}
  console.log('✓ '+c+': '+r.rec.length+' samples');
}
const all=[...M.values()].flat();
fs.writeFileSync(OUT,JSON.stringify(all));
console.log(`assets/warm-events.json: ${M.size} kinds, ${all.length} samples, ${(fs.statSync(OUT).size/1024).toFixed(0)} KB`);
