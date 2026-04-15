const fs = require('fs');
const md = fs.readFileSync('ETNYX-System-Guide.md', 'utf8');

// Simple markdown to HTML converter
function mdToHtml(text) {
  let html = text;
  // Code blocks first (before other transformations)
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`);
  // Split into lines for processing
  const lines = html.split('\n');
  let result = [];
  let inTable = false;
  let tableHeaderDone = false;
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // Skip if inside pre block
    if (line.includes('<pre>') || line.includes('</pre>')) {
      result.push(line);
      continue;
    }
    // Headers
    if (line.startsWith('#### ')) { if (inList) { result.push('</ul>'); inList = false; } result.push(`<h4>${processInline(line.slice(5))}</h4>`); continue; }
    if (line.startsWith('### ')) { if (inList) { result.push('</ul>'); inList = false; } result.push(`<h3>${processInline(line.slice(4))}</h3>`); continue; }
    if (line.startsWith('## ')) { if (inList) { result.push('</ul>'); inList = false; } result.push(`<h2>${processInline(line.slice(3))}</h2>`); continue; }
    if (line.startsWith('# ')) { if (inList) { result.push('</ul>'); inList = false; } result.push(`<h1>${processInline(line.slice(2))}</h1>`); continue; }
    // HR
    if (line.trim() === '---') { if (inList) { result.push('</ul>'); inList = false; } if (inTable) { result.push('</tbody></table>'); inTable = false; } result.push('<hr>'); continue; }
    // Tables
    if (line.startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) { tableHeaderDone = true; continue; }
      if (!inTable) { result.push('<table>'); inTable = true; tableHeaderDone = false; }
      if (!tableHeaderDone) {
        result.push('<thead><tr>' + cells.map(c => `<th>${processInline(c)}</th>`).join('') + '</tr></thead><tbody>');
      } else {
        result.push('<tr>' + cells.map(c => `<td>${processInline(c)}</td>`).join('') + '</tr>');
      }
      continue;
    } else if (inTable) { result.push('</tbody></table>'); inTable = false; tableHeaderDone = false; }
    // Lists
    if (line.startsWith('- ')) {
      if (!inList) { result.push('<ul>'); inList = true; }
      result.push(`<li>${processInline(line.slice(2))}</li>`);
      continue;
    } else if (inList && line.trim() === '') { result.push('</ul>'); inList = false; }
    // Blockquote
    if (line.startsWith('> ')) { result.push(`<blockquote>${processInline(line.slice(2))}</blockquote>`); continue; }
    // Empty line
    if (line.trim() === '') { result.push(''); continue; }
    // Paragraph
    result.push(`<p>${processInline(line)}</p>`);
  }
  if (inList) result.push('</ul>');
  if (inTable) result.push('</tbody></table>');
  return result.join('\n');
}

function processInline(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    .replace(/❌/g, '&#10060;')
    .replace(/✅/g, '&#9989;');
}

const htmlContent = mdToHtml(md);

const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>ETNYX - Panduan Sistem Operasional</title>
<style>
  @page { margin: 18mm 14mm; size: A4; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif; max-width: 780px; margin: 0 auto; padding: 30px; color: #1a1a1a; line-height: 1.65; font-size: 13px; }
  h1 { color: #0f1419; font-size: 22px; border-bottom: 3px solid #14B8A6; padding-bottom: 8px; margin-top: 36px; }
  h2 { color: #0d9488; font-size: 18px; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; page-break-after: avoid; }
  h3 { color: #374151; font-size: 15px; margin-top: 20px; page-break-after: avoid; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; page-break-inside: avoid; }
  th { background: #0f172a; color: white; padding: 8px 10px; text-align: left; font-weight: 600; }
  td { border: 1px solid #d1d5db; padding: 7px 10px; }
  tr:nth-child(even) { background: #f8fafc; }
  code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-size: 12px; color: #0f172a; }
  pre { background: #1e293b; color: #e2e8f0; padding: 14px; border-radius: 6px; overflow-x: auto; font-size: 12px; page-break-inside: avoid; }
  pre code { background: none; color: inherit; padding: 0; }
  hr { border: none; border-top: 2px solid #14B8A6; margin: 28px 0; }
  li { margin: 3px 0; }
  ul { padding-left: 20px; }
  strong { color: #0f172a; }
  blockquote { border-left: 3px solid #14B8A6; margin: 12px 0; padding: 8px 16px; background: #f0fdfa; color: #134e4a; font-style: italic; }
  a { color: #14B8A6; }
  p { margin: 6px 0; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
${htmlContent}
</body>
</html>`;

fs.writeFileSync('ETNYX-System-Guide.html', fullHtml);
console.log('Created: ETNYX-System-Guide.html');
