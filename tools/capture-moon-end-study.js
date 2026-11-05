const results=[];
const motion=new URLSearchParams(location.search).has('motion');
const only=new URLSearchParams(location.search).get('only');
const suffix=new URLSearchParams(location.search).get('suffix')||'';
for(const [fx,name] of [['moon_end_free_study','moon_end_free'],['moon_end_hit_study','moon_end_hit']]){
  if(only && !fx.includes(only)) continue;
  await STUDIO.load('water/'+fx);
  STUDIO.pause();
  await STUDIO.sheet([.22],name+'_sheet');
  if(motion) window.requestAnimationFrame=()=>0;
  STUDIO.seek(.22);
  await STUDIO.shot(name+suffix);
  if(motion){
    for(let i=0;i<36;i++){
      STUDIO.seek(i/30);
      await STUDIO.shot(name+'_f'+String(i).padStart(3,'0'));
    }
  }
  results.push({name,metrics:STUDIO.metrics(),lint:STUDIO.lint()});
}
return {results,framesPerView:motion?36:0,fps:30};
