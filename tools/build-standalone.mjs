// Builds dist/Runelords.html: the whole game in ONE file. Double-click it to play
// in any browser, no server or install needed.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const result = await build({ entryPoints: ['js/main.js'], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020' });
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = readFileSync('css/style.css', 'utf8');
const icon = `data:image/png;base64,${readFileSync('icons/icon-192.png').toString('base64')}`;
let html = readFileSync('index.html', 'utf8');
html = html
  .replace(/<link rel="manifest"[^>]*>\n?/, '')
  .replace(/<link rel="(icon|apple-touch-icon)" href="[^"]*">/g, `<link rel="$1" href="${icon}">`)
  .replace('<link rel="stylesheet" href="css/style.css">', () => `<style>${css}</style>`)
  .replace('<script type="module" src="js/main.js"></script>', () => `<script>${js}</script>`);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/Runelords.html', html);
console.log(`dist/Runelords.html written (${Math.round(html.length / 1024)} KB)`);
