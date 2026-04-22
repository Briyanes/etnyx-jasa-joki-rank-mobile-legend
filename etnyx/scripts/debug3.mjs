import { chromium } from '@playwright/test';
const ROOT = process.cwd();
const b = await chromium.launch({ headless: true });
const p = await b.newPage();
p.on('pageerror', e => console.log('PAGEERROR:', e.message));
p.on('console', m => { if (m.type() === 'error') console.log('[console error]', m.text()); });
await p.goto(`file://${ROOT}/ETNYX-Reels-Post2-TutorialPaket.html`);
await p.waitForLoadState('domcontentloaded');
await p.waitForTimeout(500);
const keys = await p.evaluate(() => {
  return Object.keys(window).filter(k => k.includes('start') || k.includes('anim') || k.includes('tick') || k.includes('play')).join(',');
});
console.log('Matching global keys:', keys);
await b.close();
