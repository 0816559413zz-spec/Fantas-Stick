// Run with headless.js --url "studio.html?fx=water/moon_beam&cam=side&dist=9&look=3&at=self&map=greathall" --js tools/capture-moon-pressure.js
// &still=1 writes one close view; otherwise writes 36 frames for a 30 fps GIF.
await STUDIO.load('water/moon_beam');
STUDIO.pause();
const params = new URLSearchParams(location.search);
const stillOnly = params.has('still');
const name = params.get('name') || 'moon_pressure_close';
await STUDIO.sheet(stillOnly ? [.22] : [.04, .15, .36, .58], name + '_sheet');
window.requestAnimationFrame = () => 0;
STUDIO.seek(.22);
await STUDIO.shot(name);
if (!stillOnly) {
  for (let i = 0; i < 36; i++) {
    STUDIO.seek(i / 30);
    await STUDIO.shot('moon_pressure_f' + String(i).padStart(3, '0'));
  }
}
return {frames: stillOnly ? 0 : 36, fps: 30, metrics: STUDIO.metrics(), lint: STUDIO.lint()};
