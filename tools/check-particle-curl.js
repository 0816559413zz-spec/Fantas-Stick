// Real particle-flow helper: keep the recorded trajectory exactly unchanged,
// while reusing one caller-owned vector for thousands of particles per frame.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const source=fs.readFileSync(require('path').join(__dirname,'../js/30-particles.js'),'utf8');
const body=source.slice(source.indexOf('function curlAt('),source.indexOf('function updateParticles('));
const curl=new Function('CURL',body+';return curlAt;')({q:.03});
const vector=[0,0],outputs=new Set(),hash=crypto.createHash('sha256');
for(let i=0;i<3000;i++){
  const v=curl((i*31)%2101-1000,(i*17)%1901-900,i/60,vector);
  outputs.add(v);hash.update(JSON.stringify(v)+'\n');
}
assert.equal(hash.digest('hex'),'186bcf134254cfdd8d728b2429a6ba51112b4c69e3e97d9b057e6769fdae953f','particle flow changed');
assert.equal(outputs.size,1,'curl creates a new vector for every particle');
assert.equal([...outputs][0],vector,'caller buffer must be reused');
console.log('OK — 3000 unchanged flow vectors, one reused output buffer');
