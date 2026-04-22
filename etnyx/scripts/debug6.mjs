import { chromium } from '@playwright/test';
const ROOT = process.cwd();
const b = await chromium.launch({ headless: true });
const p = await b.newPage();
await p.goto(`file://${ROOT}/ETNYX-Reels-Post2-TutorialPaket.html`);
await p.waitForLoadState('domcontentloaded');
const r = await p.evaluate(() => {
  const all = document.querySelectorAll('script');
  return {
    count: all.length,
    info: [...all].map(s=>({ src: s.src, textLen: s.textContent.length }))
  };
});
console.log(JSON.stringify(r, null, 2));
// Also check if any CSP violation
await b.close();
