import { chromium } from '@playwright/test';
const ROOT = process.cwd();
const b = await chromium.launch({ headless: true });
const p = await b.newPage();
await p.goto(`file://${ROOT}/ETNYX-Reels-Post2-TutorialPaket.html`);
await p.waitForLoadState('networkidle');
const imgs = await p.evaluate(() => {
  return [...document.querySelectorAll('img')].map(i => ({
    src: i.src, complete: i.complete, naturalWidth: i.naturalWidth
  }));
});
console.log('Images:', JSON.stringify(imgs, null, 2));
await b.close();
