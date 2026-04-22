/**
 * export-audio-capcut.mjs
 * Export file audio WAV terpisah untuk setiap Reels post.
 * Hasilnya bisa langsung di-import ke CapCut sebagai audio track.
 *
 * Usage:
 *   node scripts/export-audio-capcut.mjs           # semua post
 *   node scripts/export-audio-capcut.mjs --post=4  # satu post
 *
 * Output: ./exports-mp4/AUDIO-Post4-PainPoint.wav  (dll)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { renderPost } from './render-sfx.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'exports-mp4');

// Durasi actual diambil langsung dari file MP4 via ffprobe
function getVideoDurationMs(label) {
  const mp4 = path.join(OUT_DIR, `${label}.mp4`);
  if (!fs.existsSync(mp4)) return null;
  try {
    const out = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${mp4}"`, { encoding: 'utf8' }).trim();
    return Math.round(parseFloat(out) * 1000);
  } catch { return null; }
}

// animStartOffsetMs = (ss_seconds*1000) - prewait_ms = 3000-1000 = 2000ms (sama untuk semua post)
const ANIM_OFFSET_MS = 2000;

const POSTS = [
  { id: 1, file: 'ETNYX-Reels-Post1-IntroBrand.html',      label: 'Post1-IntroBrand' },
  { id: 2, file: 'ETNYX-Reels-Post2-TutorialPaket.html',   label: 'Post2-TutorialPaket' },
  { id: 4, file: 'ETNYX-Reels-Post4-PainPoint.html',       label: 'Post4-PainPoint' },
  { id: 5, file: 'ETNYX-Reels-Post5-TutorialPerStar.html', label: 'Post5-TutorialPerStar' },
  { id: 7, file: 'ETNYX-Reels-Post7-TutorialGendong.html', label: 'Post7-TutorialGendong' },
  { id: 8, file: 'ETNYX-Reels-Post8-PromoSlot.html',       label: 'Post8-PromoSlot' },
];

const arg = process.argv.find(a => a.startsWith('--post='));
const ids = arg ? arg.replace('--post=', '').split(',').map(Number) : null;
const targets = ids ? POSTS.filter(p => ids.includes(p.id)) : POSTS;

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

console.log(`\n🎵 ETNYX Audio Exporter for CapCut`);
console.log(`📁 Output: ${OUT_DIR}`);
console.log(`📋 Posts: ${targets.map(p => p.label).join(', ')}\n`);

for (const post of targets) {
  const htmlPath = path.join(ROOT, post.file);
  if (!fs.existsSync(htmlPath)) {
    console.warn(`⚠️  Skip ${post.file} — file tidak ditemukan`);
    continue;
  }

  const durationMs = getVideoDurationMs(post.label);
  if (!durationMs) {
    console.warn(`⚠️  Skip ${post.label} — file MP4 tidak ditemukan di exports-mp4/`);
    continue;
  }

  const outPath = path.join(OUT_DIR, `AUDIO-${post.label}.wav`);
  console.log(`▶  Rendering audio: ${post.label} (video=${(durationMs/1000).toFixed(1)}s, offset=${ANIM_OFFSET_MS/1000}s)...`);

  const wavBuf = renderPost(htmlPath, durationMs, 0.60, ANIM_OFFSET_MS);
  fs.writeFileSync(outPath, wavBuf);

  const kb = (wavBuf.byteLength / 1024).toFixed(0);
  console.log(`   ✅ AUDIO-${post.label}.wav (${kb} KB)\n`);
}

console.log('🎉 Selesai! File audio siap di-import ke CapCut.');
console.log(`📁 Lokasi: ${OUT_DIR}`);
console.log('');
console.log('Cara pakai di CapCut:');
console.log('  1. Import video MP4 ke timeline');
console.log('  2. Import file AUDIO-PostX-xxx.wav → taruh di track audio');
console.log('  3. Tambahkan musik/lagu sendiri di track audio ke-2');
