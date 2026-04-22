import path from 'path';
const htmlFile = 'ETNYX-Reels-Post2-TutorialPaket.html'; // root of etnyx/
const iconDir  = 'public/icons-tier';
const rel = path.relative(path.dirname(htmlFile), iconDir);
console.log('Relative path:', rel);
