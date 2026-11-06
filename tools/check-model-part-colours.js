// Headless Studio integration: authored wood/leaf colours and unchanged legacy
// mesh geometry/material path. No gameplay or binding writes.
const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
const build=WD.mk.build;
const same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const legacy=[];
for(const name of ['poly_horn','water_moon_pressure_jet']){
 const d=await(await fetch('assets/fx/mesh/'+name+'.mesh.json')).json();
 const a=build(d),b=build({...d,parts:d.parts.map(p=>({...p,col:'#ffffff'}))});
 assert(!a.getAttribute('color'),'legacy model unexpectedly has colours');
 for(const k of ['position','normal','uv','aPiv','aOrd'])
  assert(same(a.getAttribute(k).array,b.getAttribute(k).array),name+' geometry changed: '+k);
 assert(same(a.index.array,b.index.array),name+' indices changed');
 assert(b.getAttribute('color').array.every(v=>v===1),'white authored colour changed');
 legacy.push(name);a.dispose();b.dispose();
}
const mixed=build({parts:[{id:'green',k:'box',col:'#40a030'},
 {id:'white',k:'box',pos:[2,0,0]},{id:'hidden',k:'box',off:true,col:'#ff0000'}]});
const rgb=mixed.getAttribute('color');
assert(rgb.count===mixed.getAttribute('position').count,'colour count mismatch');
assert(rgb.getY(0)>rgb.getX(0)&&rgb.getY(0)>rgb.getZ(0),'green part not green');
assert(rgb.getX(rgb.count-1)===1&&rgb.getY(rgb.count-1)===1,'uncoloured part not white');
mixed.dispose();
const token=build({pal:'nature',parts:[{id:'token',k:'box',col:'$main'}]});
assert(token.getAttribute('color').array.every(Number.isFinite),'palette token has invalid colours');
assert(token.getAttribute('color').getY(0)>token.getAttribute('color').getX(0),'palette token did not resolve');
token.dispose();
if(new URLSearchParams(location.search).has('mesh')){
 for(let i=0;i<300&&STUDIO.mesh.name()!=='nature_wood_wall_study';i++)
  await new Promise(r=>setTimeout(r,100));
 assert(STUDIO.mesh.name()==='nature_wood_wall_study','wall not loaded');
}
await STUDIO.ws('fx');STUDIO.pause();STUDIO.state.fx.layers=[];STUDIO.seek(0);
await STUDIO.ws('mesh');await STUDIO.mesh.open('nature_wood_wall_study');STUDIO.mesh.view('mat');
const M=STUDIO.mk.m;
assert(M.obj.material.vertexColors,'Model preview ignores part colours');
assert(M.obj.material.color.getHex()===0xffffff,'Model preview tints authored colours');
assert(!M.obj.material.flatShading,'Model preview ignores opted-in smooth lighting');
assert(M.obj.material.userData.fxBark,'Model preview ignores opted-in bark material');
const g=M.obj.geometry,lc=STUDIO.mesh.data().parts.filter(p=>p.id.includes('_leaf_')||p.id.endsWith('_tip')).length;
assert(lc>0&&g.getAttribute('color').count===g.getAttribute('position').count,'wall leaf colours absent');
const me=WD.G.players.me;
for(const [name,extra] of [['default',{}],['tint',{col:'#d0ffd0'}],['grown',{grow:1}]]){
 const I=WD.fx.start({v:1,layers:[{id:name,t:'mesh',life:1,shape:'model',model:'nature_wood_wall_study',mat:'solid',...extra}]},
  {x:me.x,y:me.y,a:0},'colour_check');
 WD.fx.update(.02);
 const S=I.L[0],m=S.mats&&S.mats[0];
 assert(m&&m.vertexColors,'runtime ignores authored colours: '+name);
 assert(!m.flatShading,'runtime ignores opted-in smooth lighting: '+name);
 assert(m.userData.fxBark,'runtime ignores opted-in bark material: '+name);
 assert(m.color.getHex()===(extra.col?new WD.THREE.Color(extra.col).getHex():0xffffff),'runtime base colour mismatch');
 assert(S.inner.geometry.getAttribute('color'),'runtime geometry lost colours');
 STUDIO.tick(1);
 WD.fx.kill(I);
}
assert(STUDIO.mesh.lint().filter(x=>x.lv==='err').length===0,'wall lint errors');
await STUDIO.mesh.open('poly_horn');STUDIO.mesh.view('mat');
assert(!STUDIO.mk.m.obj.material.userData.fxBark,'legacy model received bark shader');
assert(STUDIO.mk.m.obj.material.flatShading,'legacy model lost original flat lighting');
STUDIO.tick(1);
await STUDIO.mesh.open('nature_wood_wall_study');STUDIO.mesh.view('mat');
return {legacyGeometryUnchanged:legacy,mixedColours:true,runtime:['default','tint','grown'],
 wall:{leafParts:lc,tris:STUDIO.mesh.tris(),colours:g.getAttribute('color').count}};
