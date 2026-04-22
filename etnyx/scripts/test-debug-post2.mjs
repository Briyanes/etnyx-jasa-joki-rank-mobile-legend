import { chromium } from '@playwright/test';
const ROOT = process.cwd();
const b = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
const errors = [];
p.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
p.on('console', m => errors.push(`[${m.type()}] ${m.text()}`));
await p.goto(`file://${ROOT}/ETNYX-Reels-Post2-TutorialPaket.html`);
await p.waitForLoadState('domcontentloaded');
await p.waitForTimeout(1000);
const info = await p.evaluate(() => {
  return {
    hasStartAnim: typeof startAnimation === 'function',
    hasAudioCtx: typeof AudioContext !== 'undefined',
    scenesBefore: [...document.querySelectorAll('.scene.active')].map(s=>s.id),
  };
});
console.log('Before startAnimation:', JSON.stringify(info));
const result = await p.evaluate(() => {
  try {
    startAnimation();
    return 'started';
  } catch(e) { return 'ERROR: ' + e.message + '\n' + e.stack; }
});
console.log('Result:', result);
await p.waitForTimeout(3000);
const after = await p.evaluate(() => ({
  scenes: [...document.querySelectorAll('.scene.active')].map(s=>s.id),
  playing: typeof playing !== 'undefined' ? playing : 'undefined',
}));
console.log('After 3s:', JSON.stringify(after));
console.log('Errors:', errors.filter(e=>e.includes('error')||e.includes('Error')||e.includes('PAGEERROR')).join('\n') || 'none');
await b.close();
