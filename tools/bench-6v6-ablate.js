// Runs tools/bench-6v6.js several times with one feature switched off each time → shows where the GPU/CPU time goes.
//   node tools/bench-6v6-ablate.js [name ...]      (needs python tools/serve.py; runs one after another so GPU timings are not disturbed)
const {spawnSync}=require('child_process'),fs=require('fs'),path=require('path'),os=require('os');
const ALL={base:{},nolook:{nolook:1},noshadow:{noshadow:1},noao:{noao:1},nobloom:{nobloom:1},nofx:{nofx:1},res720:{res:[1280,720]},res1440:{res:[2560,1440]}};
const names=process.argv.slice(2).length?process.argv.slice(2):Object.keys(ALL),out={};
for(const n of names){const o=ALL[n];if(!o){console.error('unknown',n);continue;}
  const tmp=path.join(os.tmpdir(),'bench6v6-'+n+'.js');
  fs.writeFileSync(tmp,'window.__o='+JSON.stringify(o)+';const AF=Object.getPrototypeOf(async function(){}).constructor;return await new AF(await (await fetch("tools/bench-6v6.js",{cache:"no-store"})).text())();');
  const r=spawnSync('node',[path.join(__dirname,'headless.js'),'--game','--js',tmp,'--w',String((o.res||[1920,1080])[0]),'--h',String((o.res||[1920,1080])[1]),'--quiet','--timeout','240'],{encoding:'utf8'});
  const m=/(\{[\s\S]*\})\s*\n(page errors.*)?$/.exec((r.stdout||'').trim());let j=null;try{j=JSON.parse(m[1]);}catch(e){}
  if(!j){console.log(n,'FAILED',(r.stdout||'').slice(-300),(r.stderr||'').slice(-200));continue;}
  out[n]={gpu:j.gpuMs.median,gpuP95:j.gpuMs.p95,cpu:j.cpuMs.median,cpuP95:j.cpuMs.p95,calls:j.drawCalls,tris:j.tris,passes:Object.fromEntries(Object.entries(j.passes).map(([k,v])=>[k,v.median]))};
  console.log(n.padEnd(9),'GPU',String(j.gpuMs.median).padStart(6),'p95',String(j.gpuMs.p95).padStart(6),'| CPU',String(j.cpuMs.median).padStart(6),'p95',String(j.cpuMs.p95).padStart(6),'| calls',j.drawCalls,'tris',j.tris,'|',JSON.stringify(out[n].passes));}
fs.writeFileSync(path.join(__dirname,'..','shots','bench-6v6-ablate.json'),JSON.stringify(out,null,1));
