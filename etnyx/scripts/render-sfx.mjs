/**
 * render-sfx.mjs
 * Generates a WAV audio track for each Reels post.
 * - Synthesizes all sfx (ding, whoosh, slide, etc.) at correct timestamps
 * - Adds background ambient drone (same as startBG in HTML)
 * - Pure Node.js, zero extra dependencies
 *
 * Usage:
 *   node scripts/render-sfx.mjs --post=5      # single post
 *   node scripts/render-sfx.mjs               # all posts
 *
 * Output: ./exports-mp4/<label>.sfx.wav
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'exports-mp4');

export const SR = 44100; // sample rate

// ─── WAV export ──────────────────────────────────────────────────────────────
export function buildWav(float32, sampleRate = SR) {
  const numSamples = float32.length;
  const buf = Buffer.alloc(44 + numSamples * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + numSamples * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);   // PCM
  buf.writeUInt16LE(1, 22);   // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(numSamples * 2, 40);
  for (let i = 0; i < numSamples; i++) {
    const v = Math.max(-1, Math.min(1, float32[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  return buf;
}

// ─── Mix helper ──────────────────────────────────────────────────────────────
function mixInto(master, src, offsetMs, gain = 1) {
  const startSample = Math.floor(offsetMs * SR / 1000);
  for (let i = 0; i < src.length; i++) {
    const idx = startSample + i;
    if (idx >= 0 && idx < master.length) {
      master[idx] += src[i] * gain;
    }
  }
}

// ─── SFX Synthesizers ────────────────────────────────────────────────────────
// All functions return a Float32Array of PCM samples at SR.
// Math mirrors the Web Audio API oscillator code in the HTML files.

function osc(type, freqFn, durSec, gainFn) {
  const n = Math.ceil(SR * durSec);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const freq = typeof freqFn === 'function' ? freqFn(t) : freqFn;
    const g    = typeof gainFn  === 'function' ? gainFn(t)  : gainFn;
    let wave;
    switch (type) {
      case 'sine':     wave = Math.sin(2 * Math.PI * phase); break;
      case 'triangle': wave = 1 - 4 * Math.abs(((phase % 1) + 1) % 1 - 0.5); break;
      case 'square':   wave = phase % 1 < 0.5 ? 1 : -1; break;
      case 'sawtooth': wave = 2 * (phase % 1) - 1; break;
      default:         wave = Math.sin(2 * Math.PI * phase);
    }
    out[i] = g * wave;
    phase += freq / SR;
  }
  return out;
}

function expRamp(startGain, endGain, durSec) {
  // returns a gain function for use in osc()
  const endG = Math.max(endGain, 1e-6);
  return (t) => startGain * Math.pow(endG / startGain, t / durSec);
}

function expDecay(startGain, tauMs) {
  const tau = tauMs / 1000;
  return (t) => startGain * Math.exp(-t / tau);
}

function noise(durSec, gainFn) {
  const n = Math.ceil(SR * durSec);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const g = typeof gainFn === 'function' ? gainFn(t) : gainFn;
    out[i] = g * (Math.random() * 2 - 1);
  }
  return out;
}

function addArrays(a, b) {
  const len = Math.max(a.length, b.length);
  const out = new Float32Array(len);
  for (let i = 0; i < a.length; i++) out[i] += a[i];
  for (let i = 0; i < b.length; i++) out[i] += b[i];
  return out;
}

// Lowpass filter (simple single-pole IIR)
function lowpass(src, cutoffHz) {
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const alpha = (1 / SR) / (rc + 1 / SR);
  const out = new Float32Array(src.length);
  out[0] = alpha * src[0];
  for (let i = 1; i < src.length; i++) {
    out[i] = out[i - 1] + alpha * (src[i] - out[i - 1]);
  }
  return out;
}

// ─── Individual SFX ──────────────────────────────────────────────────────────
const SFX = {
  // Shared types (Post 2, 5, 7, 8)
  ding: (pitch = 1200) => {
    const dur = 0.35;
    return osc('sine', pitch, dur, expDecay(0.08, 80));
  },
  click: () => {
    const dur = 0.09;
    return osc('sine', 1200, dur, expDecay(0.07, 18));
  },
  whoosh: () => {
    const dur = 0.22;
    // bandpass noise sweep 400→2500Hz, approximated as sine sweep + noise blend
    const dur1 = 0.15;
    const sweep = osc('sine',
      (t) => 400 * Math.pow(2500 / 400, Math.min(t / dur1, 1)),
      dur,
      (t) => 0.06 * Math.exp(-t * 7)
    );
    const n = noise(dur, (t) => 0.05 * (1 - t / dur) * Math.exp(-t * 5));
    return addArrays(sweep, n);
  },
  slide: () => {
    const dur = 0.12;
    return osc('sine',
      (t) => 500 * Math.pow(800 / 500, t / dur),
      dur,
      expRamp(0.05, 0.001, dur)
    );
  },
  toggle: () => {
    const dur = 0.12;
    const part1 = osc('triangle', 600, 0.06, expDecay(0.06, 30));
    const part2 = osc('triangle', 900, 0.06, expDecay(0.06, 30));
    const out = new Float32Array(Math.ceil(SR * dur));
    for (let i = 0; i < part1.length; i++) out[i] += part1[i];
    const off = Math.floor(0.06 * SR);
    for (let i = 0; i < part2.length; i++) { if (off + i < out.length) out[off + i] += part2[i]; }
    return out;
  },
  success: () => {
    // 3-note ascending chord: 800, 1000, 1200Hz
    const dur = 0.5;
    const out = new Float32Array(Math.ceil(SR * dur));
    [[800, 0], [1000, 0.10], [1200, 0.20]].forEach(([freq, delay]) => {
      const note = osc('sine', freq, 0.3, expDecay(0.08, 80));
      const off = Math.floor(delay * SR);
      for (let i = 0; i < note.length; i++) { if (off + i < out.length) out[off + i] += note[i]; }
    });
    return out;
  },
  impact: () => {
    const dur = 0.5;
    return osc('sine',
      (t) => 150 * Math.pow(50 / 150, t / dur),
      dur,
      expDecay(0.18, 120)
    );
  },
  tick: () => {
    const dur = 0.06;
    return osc('triangle', 900, dur, expDecay(0.05, 12));
  },
  pop: () => {
    const dur = 0.09;
    return osc('sine',
      (t) => 300 * Math.pow(600 / 300, t / 0.06),
      dur,
      expDecay(0.06, 22)
    );
  },
  alarm: () => {
    // 800→600→800Hz square, 0.3s
    const dur = 0.35;
    const out = new Float32Array(Math.ceil(SR * dur));
    const freqs = [800, 600, 800];
    freqs.forEach((freq, idx) => {
      const seg = osc('square', freq, 0.1, expDecay(0.07, 100));
      const off = Math.floor(idx * 0.1 * SR);
      for (let i = 0; i < seg.length; i++) { if (off + i < out.length) out[off + i] += seg[i] * 0.5; }
    });
    return out;
  },
  buzz: () => {
    // buzz / error — square wave descending
    const dur = 0.18;
    return osc('square',
      (t) => 300 * Math.pow(120 / 300, t / dur),
      dur,
      expDecay(0.07, 60)
    );
  },
  win: () => SFX.success(),

  urgency: () => {
    const dur = 0.38;
    return osc('sawtooth',
      (t) => 200 + 600 * (t / 0.3),
      dur,
      expDecay(0.06, 100)
    );
  },

  // Post 8
  alarm8: () => {
    const dur = 0.35;
    const out = new Float32Array(Math.ceil(SR * dur));
    [[800, 0], [600, 0.10], [800, 0.20]].forEach(([freq, delay]) => {
      const seg = osc('square', freq, 0.12, expDecay(0.07, 50));
      const off = Math.floor(delay * SR);
      for (let i = 0; i < seg.length; i++) { if (off + i < out.length) out[off + i] += seg[i]; }
    });
    return out;
  },

  // Post 1 named sfx
  sfxwhoosh: () => SFX.whoosh(),
  sfxlogoreveal: () => {
    // A short ascending burst: impact + ding chord
    const dur = 0.5;
    const out = new Float32Array(Math.ceil(SR * dur));
    const imp = SFX.impact();
    for (let i = 0; i < imp.length && i < out.length; i++) out[i] += imp[i] * 0.5;
    [1000, 1200, 1500].forEach((pitch, idx) => {
      const d = SFX.ding(pitch);
      const off = Math.floor(idx * 0.05 * SR);
      for (let i = 0; i < d.length; i++) { if (off + i < out.length) out[off + i] += d[i] * 0.6; }
    });
    return out;
  },
  sfxcardslide: () => SFX.slide(),
  sfxding: (pitch = 1200) => SFX.ding(pitch),
  sfxtick: () => SFX.tick(),
  sfxstarpop: (pitch = 1000) => SFX.pop(),
  sfxctaimpact: () => SFX.impact(),
  sfxalarm: () => SFX.alarm(),
  sfxboom: () => {
    // Deep boom + rumble
    const dur = 0.6;
    return osc('sine',
      (t) => 80 * Math.pow(30 / 80, t / dur),
      dur,
      expDecay(0.22, 150)
    );
  },
  sfxbuzz: () => SFX.buzz(),
  sfxwin: () => SFX.success(),
  sfximpact: () => SFX.impact(),
  sfxclick: () => SFX.click(),
  sfxslide: () => SFX.slide(),
  sfxtoggle: () => SFX.toggle(),
  sfxsuccess: () => SFX.success(),
  sfxtype: () => {
    // Several quick ticks
    const dur = 0.6;
    const out = new Float32Array(Math.ceil(SR * dur));
    const tickCount = 8;
    for (let i = 0; i < tickCount; i++) {
      const t = SFX.tick();
      const off = Math.floor(i * 0.07 * SR);
      for (let j = 0; j < t.length; j++) { if (off + j < out.length) out[off + j] += t[j] * 0.7; }
    }
    return out;
  },
};

function callSfx(type, pitch) {
  const key = type.toLowerCase().replace(/^sfx/, 'sfx');
  // try exact match first, then with sfx prefix stripped
  const fn = SFX[key] || SFX[key.replace(/^sfx/, '')] || SFX.ding;
  return fn(pitch);
}

// ─── Background ambient drone (mirrors startBG in HTML) ──────────────────────
function generateAmbient(durationMs) {
  const totalSamples = Math.ceil(durationMs * SR / 1000);
  const out = new Float32Array(totalSamples);

  // 55Hz sine + slow LFO (2Hz at 0.04 depth)
  const lfoFreq = 2;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SR;
    const lfo = Math.sin(2 * Math.PI * lfoFreq * t) * 0.04;
    const bgGain = 0.08 + lfo;
    out[i] += bgGain * Math.sin(2 * Math.PI * 55 * t);
  }

  // Low-pass filtered noise (cutoff ~200Hz, gain 0.03)
  const noiseRaw = noise(durationMs / 1000, 0.03);
  const noiseFilt = lowpass(noiseRaw, 200);
  for (let i = 0; i < noiseFilt.length && i < out.length; i++) {
    out[i] += noiseFilt[i];
  }

  return out;
}

// ─── SFX timeline parser ──────────────────────────────────────────────────────
// Extracts { timeMs, sfxType, pitch? } from a post's HTML tick() function.
function parseEvents(html) {
  const events = [];

  // Grab the tick function body (handles both compact and multi-line)
  const tickBodyMatch = html.match(/function tick\(\s*\)\s*\{([\s\S]*?)(?=\nfunction |\n\/\/ ─|$)/);
  if (!tickBodyMatch) return events;
  const body = tickBodyMatch[1];

  // Split into if-blocks by finding `if(e>=NNN` or `if(elapsed>=NNN`
  const ifRe = /if\s*\(\s*(?:e|elapsed)\s*>=\s*(\d+)\s*&&[^)]+\)[^{]*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
  let m;
  while ((m = ifRe.exec(body)) !== null) {
    const timeMs = parseInt(m[1]);
    const block = m[2];

    // sfx('type') or sfx("type")
    const sfxRe = /sfx\(['"](\w+)['"]\)/g;
    let sm;
    while ((sm = sfxRe.exec(block)) !== null) {
      events.push({ timeMs, type: sm[1] });
    }

    // Named sfx calls: sfxWhoosh(), sfxBoom(), sfxDing(1200), etc.
    const namedRe = /(sfx[A-Z][A-Za-z]+)\s*\(\s*(\d*)\s*\)/g;
    while ((sm = namedRe.exec(block)) !== null) {
      const pitch = sm[2] ? parseInt(sm[2]) : undefined;
      events.push({ timeMs, type: sm[1].toLowerCase(), pitch });
    }

    // clickAt(...) → click sfx
    if (/clickAt\(/.test(block)) {
      events.push({ timeMs, type: 'click' });
    }

    // setTimeout(() => sfxXxx(pitch), delayMs)
    const stRe = /setTimeout\([^,]*?(?:sfx[A-Z][A-Za-z]+|sfx\(['"][^'"]+['"]\))[^,]*,\s*(\d+)\)/g;
    while ((sm = stRe.exec(block)) !== null) {
      const delay = parseInt(sm[1]);
      // find the sfx inside the setTimeout
      const inner = sm[0];
      const sfxInner = /sfx[A-Z][A-Za-z]+\s*\(\s*(\d*)\s*\)/.exec(inner);
      const sfxShort = /sfx\(['"](\w+)['"]\)/.exec(inner);
      if (sfxInner) {
        const pitch2 = sfxInner[1] ? parseInt(sfxInner[1]) : undefined;
        const fnName = /sfx[A-Z][A-Za-z]+/.exec(inner)[0].toLowerCase();
        events.push({ timeMs: timeMs + delay, type: fnName, pitch: pitch2 });
      } else if (sfxShort) {
        events.push({ timeMs: timeMs + delay, type: sfxShort[1] });
      }
    }
  }

  return events.sort((a, b) => a.timeMs - b.timeMs);
}

// ─── Render one post ──────────────────────────────────────────────────────────
// startOffsetMs: shift events so animation t=startOffsetMs maps to WAV t=0
//   This aligns the WAV with the trimmed video.
//   Formula: startOffsetMs = (ss_seconds * 1000) - prewait_ms
//   Default = 2000 (ss=3.0s, prewait=1000ms, matches all posts)
export function renderPost(htmlPath, durationMs, masterGainValue = 0.60, startOffsetMs = 2000) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const events = parseEvents(html);

  // Shift events: subtract startOffset so they align with video start, skip negatives
  const shiftedEvents = events
    .map(ev => ({ ...ev, timeMs: ev.timeMs - startOffsetMs }))
    .filter(ev => ev.timeMs >= 0);

  console.log(`   🔊 Found ${events.length} sfx events (${shiftedEvents.length} in video after ${startOffsetMs}ms trim offset)`);

  const totalSamples = Math.ceil(durationMs * SR / 1000);
  const master = new Float32Array(totalSamples);

  // Background ambient
  const ambient = generateAmbient(durationMs);
  for (let i = 0; i < ambient.length && i < master.length; i++) {
    master[i] += ambient[i] * masterGainValue * 0.6;
  }

  // SFX events (already shifted to video-local timestamps)
  for (const ev of shiftedEvents) {
    try {
      const samples = callSfx(ev.type, ev.pitch);
      mixInto(master, samples, ev.timeMs, masterGainValue);
    } catch (e) {
      // ignore unknown sfx
    }
  }

  // Peak normalize to -3 dB (0.708 linear) so audio is clearly audible
  let peak = 0;
  for (let i = 0; i < master.length; i++) {
    const abs = Math.abs(master[i]);
    if (abs > peak) peak = abs;
  }
  if (peak > 0) {
    const targetPeak = 0.708; // -3 dB
    const norm = targetPeak / peak;
    for (let i = 0; i < master.length; i++) {
      master[i] *= norm;
    }
  }

  // Hard clip guard
  for (let i = 0; i < master.length; i++) {
    master[i] = Math.max(-1, Math.min(1, master[i]));
  }

  return buildWav(master);
}

// ─── CLI ─────────────────────────────────────────────────────────────────────
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // All posts use ss=3.0 prewait=1000 → animOffset=2000ms (Post4: ss=4.5 prewait=2500 → also 2000ms)
  const POSTS = [
    { id: 1, file: 'ETNYX-Reels-Post1-IntroBrand.html',      duration: 25000, label: 'Post1-IntroBrand' },
    { id: 2, file: 'ETNYX-Reels-Post2-TutorialPaket.html',   duration: 55000, label: 'Post2-TutorialPaket' },
    { id: 4, file: 'ETNYX-Reels-Post4-PainPoint.html',       duration:  7000, label: 'Post4-PainPoint' },
    { id: 5, file: 'ETNYX-Reels-Post5-TutorialPerStar.html', duration: 55000, label: 'Post5-TutorialPerStar' },
    { id: 7, file: 'ETNYX-Reels-Post7-TudorialGendong.html', duration: 55000, label: 'Post7-TutorialGendong' },
    { id: 8, file: 'ETNYX-Reels-Post8-PromoSlot.html',       duration: 25000, label: 'Post8-PromoSlot' },
  ];

  const arg = process.argv.find(a => a.startsWith('--post='));
  const ids = arg ? arg.replace('--post=', '').split(',').map(Number) : null;
  const targets = ids ? POSTS.filter(p => ids.includes(p.id)) : POSTS;

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const post of targets) {
    const htmlPath = path.join(ROOT, post.file);
    if (!fs.existsSync(htmlPath)) {
      console.warn(`⚠️  Skip ${post.file} — file not found`);
      continue;
    }
    console.log(`▶  Rendering sfx: ${post.label} (${post.duration / 1000}s, offset 2s)...`);
    const wavBuf = renderPost(htmlPath, post.duration, 0.60, 2000);
    const outPath = path.join(OUT_DIR, `${post.label}.sfx.wav`);
    fs.writeFileSync(outPath, wavBuf);
    const kb = (wavBuf.byteLength / 1024).toFixed(0);
    console.log(`   ✅ ${post.label}.sfx.wav (${kb} KB)\n`);
  }
  console.log('🎉 SFX render selesai!');
}
