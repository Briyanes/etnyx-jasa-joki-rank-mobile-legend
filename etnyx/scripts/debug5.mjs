import { chromium } from '@playwright/test';
const ROOT = process.cwd();
const b = await chromium.launch({ headless: true });
const p = await b.newPage();
await p.goto(`file://${ROOT}/ETNYX-Reels-Post2-TutorialPaket.html`);
await p.waitForLoadState('domcontentloaded');
// Force inject the startAnimation function from scratch
const r = await p.evaluate(() => {
  // Extract script tag content and run it again
  const scripts = document.querySelectorAll('script:not([src])');
  const info = [];
  scripts.forEach((s,i) => {
    info.push({ index:i, len: s.textContent.length, first50: s.textContent.substring(0,50) });
  });
  return info;
});
console.log('Scripts:', JSON.stringify(r, null, 2));
await b.close();
