/**
 * Export ETNYX Reels HTML briefs → MP4
 *
 * Features:
 * - 1080×1920 native Reels resolution
 * - iPhone 15 frame (Dynamic Island, side buttons, home indicator)
 * - ETNYX brand background (dark radial gradient teal + purple)
 * - Auto-start animation — no controls visible
 *
 * Usage:
 *   node scripts/export-reels-to-mp4.mjs                # semua post
 *   node scripts/export-reels-to-mp4.mjs --post=1       # satu post
 *   node scripts/export-reels-to-mp4.mjs --post=1,2,4   # beberapa post
 *
 * Output: folder ./exports-mp4/
 * Requires: npx playwright install chromium
 *           brew install ffmpeg
 */

import { chromium } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { renderPost } from './render-sfx.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'exports-mp4');

// ── Background music (opsional) ───────────────────────────────────────────────
// Taruh file MP3/AAC di salah satu path berikut, atau ubah nilai ini.
// Jika file tidak ada, video tetap di-export dengan sfx saja.
const BG_MUSIC_PATH = [
  path.join(ROOT, 'public/audio/bgmusic.mp3'),
  path.join(ROOT, 'public/audio/bgmusic.aac'),
  path.join(ROOT, 'public/audio/bgmusic.m4a'),
].find(p => fs.existsSync(p)) ?? null;

// Volume level: sfx dan bgmusic (0.0 - 1.0)
const SFX_VOL    = 1.0;
const BGMUSIC_VOL = 0.35; // cukup rendah agar tidak mengalahkan sfx

// Konfigurasi setiap post
// ss = berapa detik di-trim dari awal WebM (default 3.0)
// prewait = ms tunggu sebelum startAnimation dipanggil (default 1000)
const POSTS = [
  { id: 1, file: 'ETNYX-Reels-Post1-IntroBrand.html',      duration: 31000, label: 'Post1-IntroBrand' },
  { id: 2, file: 'ETNYX-Reels-Post2-TutorialPaket.html',   duration: 61000, label: 'Post2-TutorialPaket' },
  { id: 4, file: 'ETNYX-Reels-Post4-PainPoint.html',       duration: 16000, label: 'Post4-PainPoint', ss: 4.5, prewait: 2500 },
  { id: 5, file: 'ETNYX-Reels-Post5-TutorialPerStar.html', duration: 61000, label: 'Post5-TutorialPerStar' },
  { id: 7, file: 'ETNYX-Reels-Post7-TutorialGendong.html', duration: 61000, label: 'Post7-TutorialGendong' },
  { id: 8, file: 'ETNYX-Reels-Post8-PromoSlot.html',       duration: 31000, label: 'Post8-PromoSlot' },
];

// Viewport output: 1080×1920 (standard Reels / TikTok / Shorts)
const VIEWPORT_W = 1080;
const VIEWPORT_H = 1920;

// Scale phone agar mengisi ~76% tinggi viewport, sisanya jadi breathing room
// Phone native: 390×844 → scale = (1920 * 0.76) / 844 ≈ 1.73
// Tapi batasi lebar: max 390 * scale ≤ 1080 * 0.80 → max scale = 2.22
const PHONE_SCALE = Math.min(
  (VIEWPORT_H * 0.76) / 844,  // height constraint — ruang atas/bawah
  (VIEWPORT_W * 0.80) / 390   // width constraint  — ruang kiri/kanan
);

// Parse --post argument
const args = process.argv.slice(2);
const postArg = args.find(a => a.startsWith('--post='));
let selectedIds = null;
if (postArg) {
  selectedIds = postArg.replace('--post=', '').split(',').map(Number);
}
const targetPosts = selectedIds ? POSTS.filter(p => selectedIds.includes(p.id)) : POSTS;

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Cek ffmpeg
try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
} catch {
  console.error('❌ ffmpeg tidak ditemukan. Jalankan: brew install ffmpeg');
  process.exit(1);
}

console.log(`\n🎬 ETNYX Reels Exporter — iPhone 15 + ETNYX BG`);
console.log(`📐 Output: ${VIEWPORT_W}×${VIEWPORT_H}  |  Phone scale: ${PHONE_SCALE.toFixed(2)}x`);
console.log(`📁 Folder: ${OUT_DIR}`);
console.log(`📋 Posts: ${targetPosts.map(p => p.label).join(', ')}`);
console.log(`🔊 Audio: sfx synthesized${BG_MUSIC_PATH ? ` + bgmusic (${path.basename(BG_MUSIC_PATH)})` : ' only (taruh bgmusic.mp3 di public/audio/ untuk musik latar)'}\n`);

const browser = await chromium.launch({ headless: true });

for (const post of targetPosts) {
  const htmlPath = path.join(ROOT, post.file);
  if (!fs.existsSync(htmlPath)) {
    console.warn(`⚠️  Skip ${post.file} — file tidak ditemukan`);
    continue;
  }

  const webmPath = path.join(OUT_DIR, `${post.label}.webm`);
  const mp4Path  = path.join(OUT_DIR, `${post.label}.mp4`);

  // Hapus file lama
  if (fs.existsSync(webmPath)) fs.unlinkSync(webmPath);

  console.log(`▶  ${post.label} (durasi ~${post.duration / 1000}s)...`);

  const context = await browser.newContext({
    viewport: { width: VIEWPORT_W, height: VIEWPORT_H },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: OUT_DIR,
      size: { width: VIEWPORT_W, height: VIEWPORT_H },
    },
  });

  const page = await context.newPage();
  await page.goto(`file://${htmlPath}`);

  // Tunggu DOM ready + fonts/icons load (cepat, tidak perlu networkidle)
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(post.prewait ?? 1000);

  // Inject: background ETNYX + iPhone 15 frame. Controls sudah dihapus dari HTML.
  await page.evaluate(({ scale, vw, vh }) => {
    // ── 1. Body: ETNYX background, full viewport, centered ──────────────────
    document.body.style.cssText = `
      background:
        radial-gradient(ellipse at 20% 10%, rgba(45,212,191,0.28) 0%, transparent 42%),
        radial-gradient(ellipse at 80% 90%, rgba(167,139,250,0.22) 0%, transparent 42%),
        radial-gradient(ellipse at 50% 50%, rgba(15,20,25,0.95) 0%, #04070C 100%);
      margin: 0 !important;
      padding: 0 !important;
      gap: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: ${vw}px !important;
      height: ${vh}px !important;
      min-height: unset !important;
      overflow: hidden !important;
    `;

    // ── 2. Set phone-scale + lock (prevent resize event from resetting) ─────
    document.documentElement.style.setProperty('--phone-scale', String(scale));
    // Override updateStageScale to no-op so resize events don't reset scale
    window.updateStageScale = () => {};

    // ── 3. Sembunyikan sisa elemen UI (audio bars, timer, jaga-jaga) ─────────
    document.querySelectorAll([
      '.controls',
      '.timer-display',
      '.preview-launch',
      '.preview-note',
      '.preview-floating',
      '#previewLaunch',
      '#previewNote',
      '#previewFloating',
    ].join(',')).forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });

    // ── 4. Inject iPhone 15 chrome ke dalam .phone ──────────────────────────
    //    Semua dimensi dalam koordinat native 390×844 (akan di-scale otomatis)
    const phone = document.getElementById('phone') || document.querySelector('.phone');
    if (phone) {
      // Ensure existing injections tidak duplikat
      ['iph-di','iph-hi'].forEach(id => document.getElementById(id)?.remove());

      // Dynamic Island — centered pill, top 12px native
      const di = document.createElement('div');
      di.id = 'iph-di';
      Object.assign(di.style, {
        position: 'absolute',
        top: `${Math.round(12 / scale)}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${Math.round(118 / scale)}px`,
        height: `${Math.round(33 / scale)}px`,
        background: '#000',
        borderRadius: `${Math.round(20 / scale)}px`,
        zIndex: '99999',
        pointerEvents: 'none',
      });
      phone.appendChild(di);

      // Home indicator — centered bar, bottom 8px native
      const hi = document.createElement('div');
      hi.id = 'iph-hi';
      Object.assign(hi.style, {
        position: 'absolute',
        bottom: `${Math.round(8 / scale)}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${Math.round(134 / scale)}px`,
        height: `${Math.round(5 / scale)}px`,
        background: 'rgba(255,255,255,0.4)',
        borderRadius: `${Math.round(3 / scale)}px`,
        zIndex: '99999',
        pointerEvents: 'none',
      });
      phone.appendChild(hi);

      // Glow ETNYX di sekeliling device
      phone.style.boxShadow = [
        '0 0 0 1px rgba(255,255,255,0.06)',
        '0 0 60px rgba(45,212,191,0.18)',
        '0 0 140px rgba(167,139,250,0.10)',
        '0 40px 80px rgba(0,0,0,0.9)',
      ].join(', ');
    }

    // ── 5. Inject side buttons ke .stage (koordinat sudah di-scale, pakai px langsung) ──
    const stage = document.getElementById('stage') || document.querySelector('.stage');
    if (stage) {
      stage.style.position = 'relative';
      ['iph-ss','iph-vu','iph-vd','iph-pw'].forEach(id => document.getElementById(id)?.remove());

      const phoneW = 390 * scale;   // visual phone width
      const phoneH = 844 * scale;   // visual phone height

      const addBtn = (id, side, topPct, heightPx) => {
        const el = document.createElement('div');
        el.id = id;
        const topPx = Math.round(phoneH * topPct);
        Object.assign(el.style, {
          position: 'absolute',
          [side]: '-5px',
          top: `${topPx}px`,
          width: '4px',
          height: `${heightPx}px`,
          background: 'linear-gradient(180deg, #2a2a2a, #111)',
          borderRadius: side === 'left' ? '3px 0 0 3px' : '0 3px 3px 0',
          zIndex: '99999',
          pointerEvents: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.6)',
        });
        stage.appendChild(el);
      };

      addBtn('iph-ss', 'left', 0.195, Math.round(phoneH * 0.040));  // silent switch
      addBtn('iph-vu', 'left', 0.270, Math.round(phoneH * 0.068));  // volume +
      addBtn('iph-vd', 'left', 0.355, Math.round(phoneH * 0.068));  // volume −
      addBtn('iph-pw', 'right', 0.270, Math.round(phoneH * 0.095)); // power
    }
  }, { scale: PHONE_SCALE, vw: VIEWPORT_W, vh: VIEWPORT_H });

  // Mulai animasi setelah inject (ghost elements sudah ada di HTML)
  await page.evaluate(() => {
    // Sembunyikan audioBars (tetap di dalam .phone tapi tidak boleh keliatan)
    const ab = document.getElementById('audioBars');
    if (ab) ab.style.setProperty('display', 'none', 'important');
    // Sembunyikan timerBar juga
    const tb = document.getElementById('timerBar');
    if (tb) tb.style.setProperty('display', 'none', 'important');
    // Jalankan animasi
    if (typeof startAnimation === 'function') startAnimation();
  });

  // Tunggu animasi selesai
  await page.waitForTimeout(post.duration);

  const videoFile = await page.video()?.path();
  await context.close();

  if (videoFile && fs.existsSync(videoFile)) {
    fs.renameSync(videoFile, webmPath);
  }

  if (fs.existsSync(webmPath)) {
    console.log(`   🔄 Converting → ${post.label}.mp4`);
    const trimSs = post.ss ?? 3.0;

    // ── Render sfx WAV ────────────────────────────────────────────────────────
    // animStartOffsetMs: berapa detik animasi yang ter-trim dari awal video
    //   = (ss_seconds * 1000) - prewait_ms
    const animStartOffsetMs = Math.round(trimSs * 1000) - (post.prewait ?? 1000);
    // sfxDurationMs: total WebM = prewait + duration; setelah trim = (prewait + duration) - ss
    // Harus memperhitungkan prewait agar audio cukup panjang menutup seluruh animasi
    const sfxDurationMs = (post.prewait ?? 1000) + post.duration - Math.round(trimSs * 1000);
    const sfxWavPath = path.join(OUT_DIR, `${post.label}.sfx.wav`);
    console.log(`   🔊 Rendering sfx (${(sfxDurationMs / 1000).toFixed(1)}s, offset ${animStartOffsetMs}ms)...`);
    const wavBuf = renderPost(path.join(ROOT, post.file), sfxDurationMs, 0.60, animStartOffsetMs);
    fs.writeFileSync(sfxWavPath, wavBuf);

    // ── Build ffmpeg audio mix ─────────────────────────────────────────────────
    let audioInputs = `"${sfxWavPath}"`;
    let filterComplex = `[1:a]volume=${SFX_VOL}[sfx]`;
    let audioMap = '[sfx]';

    if (BG_MUSIC_PATH) {
      console.log(`   🎵 Mixing bgmusic: ${path.basename(BG_MUSIC_PATH)}`);
      audioInputs += ` -stream_loop -1 -i "${BG_MUSIC_PATH}"`;
      filterComplex = `[1:a]volume=${SFX_VOL}[sfx];[2:a]volume=${BGMUSIC_VOL}[bg];[sfx][bg]amix=inputs=2:duration=first[audio]`;
      audioMap = '[audio]';
    }

    execSync(
      `ffmpeg -y -ss ${trimSs} -i "${webmPath}" -i ${audioInputs} -filter_complex "${filterComplex}" -map 0:v -map "${audioMap}" -vcodec libx264 -acodec aac -crf 18 -pix_fmt yuv420p -shortest "${mp4Path}"`,
      { stdio: 'pipe' }
    );

    // Cleanup temp wav
    fs.unlinkSync(sfxWavPath);
    fs.unlinkSync(webmPath);

    const size = (fs.statSync(mp4Path).size / 1024 / 1024).toFixed(1);
    console.log(`   ✅ Saved: ${post.label}.mp4 (${size} MB)\n`);
  } else {
    console.warn(`   ⚠️  Video tidak ter-record untuk ${post.label}\n`);
  }
}

await browser.close();
console.log('🎉 Selesai! Semua video tersimpan di folder exports-mp4/');
