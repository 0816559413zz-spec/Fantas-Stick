// Still views by default; &motion=1 captures 36 frames each for POV and oblique.
await STUDIO.load('water/moon_beam');
STUDIO.pause();
await STUDIO.sheet([.22], 'moon_pressure_circle_warmup');
window.requestAnimationFrame = () => 0;
STUDIO.cam('orbit');
const views = [
  ['moon_pressure_pov', Math.PI + .3, .14, 7],
  ['moon_pressure_oblique', Math.PI + .95, .18, 8],
  ['moon_pressure_circle', Math.PI + .06, .1, 5.8],
];
const results = [];
const motion = new URLSearchParams(location.search).has('motion');
for (const [name,yaw,pitch,dist] of views) {
  if (motion && name === 'moon_pressure_circle') continue;
  Object.assign(STUDIO.state.orb, {yaw,pitch,dist});
  STUDIO.seek(.22);
  await STUDIO.shot(name);
  if (motion) {
    for (let i = 0; i < 36; i++) {
      STUDIO.seek(i / 30);
      await STUDIO.shot(name + '_f' + String(i).padStart(3,'0'));
    }
  }
  results.push({name,metrics:STUDIO.metrics()});
}
return {views:results,framesPerView:motion?36:0, fps:30, lint:STUDIO.lint()};
