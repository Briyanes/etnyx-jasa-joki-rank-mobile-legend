import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PHONE_SCALE = Math.min((1920 * 0.76) / 844, (1080 * 0.80) / 390);

const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(`file://${ROOT}/ETNYX-Reels-Post4-PainPoint.html`);
await p.waitForLoadState('domcontentloaded');
await p.waitForTimeout(500);

// Run same inject as export script
await p.evaluate(({ scale, vw, vh }) => {
  document.body.style.cssText = `
    background: radial-gradient(ellipse at 20% 10%, rgba(45,212,191,0.28) 0%, transparent 42%),
      radial-gradient(ellipse at 80% 90%, rgba(167,139,250,0.22) 0%, transparent 42%),
      radial-gradient(ellipse at 50% 50%, rgba(15,20,25,0.95) 0%, #04070C 100%);
    margin: 0 !important; padding: 0 !important; gap: 0 !important;
    display: flex !important; align-items: center !important; justify-content: center !important;
    width: ${vw}px !important; height: ${vh}px !important;
    min-height: unset !important; overflow: hidden !important;
  `;
  document.documentElement.style.setProperty('--phone-scale', String(scale));
}, { scale: PHONE_SCALE, vw: 1080, vh: 1920 });

const info = await p.evaluate(() => {
  const stage = document.getElementById('stage');
  const phone = document.getElementById('phone');
  const body = document.body;
  const stageR = stage?.getBoundingClientRect();
  const phoneR = phone?.getBoundingClientRect();
  return {
    bodySize: { w: body.offsetWidth, h: body.offsetHeight },
    stageRect: stageR ? { x: stageR.x, y: stageR.y, w: stageR.width, h: stageR.height } : null,
    phoneRect: phoneR ? { x: phoneR.x, y: phoneR.y, w: phoneR.width, h: phoneR.height } : null,
    phoneScale: getComputedStyle(document.documentElement).getPropertyValue('--phone-scale'),
  };
});
console.log(JSON.stringify(info, null, 2));
await b.close();
