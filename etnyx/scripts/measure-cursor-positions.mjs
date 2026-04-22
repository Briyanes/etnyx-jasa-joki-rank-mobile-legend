import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const POSTS = [
  {
    num: 5,
    file: 'ETNYX-Reels-Post5-TutorialPerStar.html',
    elements: [
      { id: 'mtPaket',   label: 'S1: PAKET tab' },
      { id: 'mtStar',    label: 'S1: PER STAR tab' },
      { id: 'mtGendong', label: 'S1: GENDONG tab' },
      { id: 'r1',        label: 'S2: r1 (Grand Master)' },
      { id: 'r2',        label: 'S2: r2 (Epic)' },
      { id: 'r3',        label: 'S2: r3 (Legend)' },
      { id: 'qPlus',     label: 'S3: qPlus button' },
      { id: 'tgExp',     label: 'S4: Express toggle' },
      { id: 'po1',       label: 'S5: po1 (Bank)' },
      { id: 'po2',       label: 'S5: po2 (E-Wallet)' },
      { id: 'po3',       label: 'S5: po3 (QRIS)' },
    ],
  },
  {
    num: 7,
    file: 'ETNYX-Reels-Post7-TutorialGendong.html',
    elements: [
      { id: 'mtPaket',   label: 'S1: PAKET tab' },
      { id: 'mtStar',    label: 'S1: PER STAR tab' },
      { id: 'mtGendong', label: 'S1: GENDONG tab' },
      { id: 'r1',        label: 'S2: r1 (Grand Master)' },
      { id: 'r2',        label: 'S2: r2 (Epic)' },
      { id: 'r3',        label: 'S2: r3 (Legend)' },
      { id: 'rl1',       label: 'S3: rl1 (EXP Laner)' },
      { id: 'rl2',       label: 'S3: rl2 (Roamer)' },
      { id: 'rl3',       label: 'S3: rl3 (Mid Laner)' },
      { id: 'sc1',       label: 'S3: sc1 (Pagi)' },
      { id: 'sc4',       label: 'S3: sc4 (Malam)' },
      { id: 'sc7',       label: 'S3: sc7 (Fleksibel)' },
      { id: 'po1',       label: 'S5: po1 (Bank)' },
      { id: 'po2',       label: 'S5: po2 (E-Wallet)' },
      { id: 'po3',       label: 'S5: po3 (QRIS)' },
    ],
  },
];

const browser = await chromium.launch({ headless: true });

for (const post of POSTS) {
  const htmlPath = path.join(ROOT, post.file);
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1080, height: 1920 });
  await page.goto(`file://${htmlPath}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  // Show all scenes + all elements
  await page.evaluate(() => {
    document.querySelectorAll('.scene').forEach(s => s.classList.add('active'));
    document.querySelectorAll('[id]').forEach(el => {
      el.classList.add('show', 'sel', 'on', 'ok', 'go');
    });
  });
  await page.waitForTimeout(300);

  const phoneBox = await page.evaluate(() => {
    const ph = document.querySelector('.phone');
    if (!ph) return null;
    const r = ph.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });

  const scale = phoneBox.w / 390;
  console.log(`\n=== POST ${post.num} (phone at viewport x=${phoneBox.x.toFixed(0)}, y=${phoneBox.y.toFixed(0)}, scale=${scale.toFixed(3)}) ===`);

  for (const { id, label } of post.elements) {
    const center = await page.evaluate((elId) => {
      const el = document.getElementById(elId);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return null;
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
    }, id);

    if (!center) {
      console.log(`  #${id} (${label}): NOT FOUND or hidden`);
      continue;
    }

    const localX = (center.x - phoneBox.x) / scale;
    const localY = (center.y - phoneBox.y) / scale;
    console.log(`  #${id} (${label}): phone-coords center=(${localX.toFixed(0)}, ${localY.toFixed(0)})`);
  }

  await page.close();
}

await browser.close();
