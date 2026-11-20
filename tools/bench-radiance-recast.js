// Run with tools/headless.js --game --js tools/bench-radiance-recast.js.
const path=WD.PATHS.findIndex(p=>p.id==='light');
await HL.solo({kit:String(path),mode:'train'});
HL.cam('q34',{dist:8});
const p=HL.me(),counts=[];
for(let cast=0;cast<5;cast++){
  for(const z of ['lgbolt','lgbolt','lgbolt','lgbolt','lgveilboom','lgsanadd']){
    WD.fxEv({k:'efx',z,id:p.id,x:p.x,y:p.y,h:1,x2:p.x+48,y2:p.y,h2:1});
  }
  HL.step(54,1/30);
  counts.push(WD.gl.info.memory.geometries);
}
if(HL.errs.length)throw Error(HL.errs.join('\n'));
if(counts.slice(2).every((count,i)=>count>counts[i+1])){
  throw Error('Radiance GPU geometry grows after every recast: '+counts.join(', '));
}
return {geometriesAfterCast:counts};
