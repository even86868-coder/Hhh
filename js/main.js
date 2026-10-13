import { showTitle } from './ui.js';

showTitle();

// Offline cache for the web/phone version only (not needed in the desktop app or the single-file build).
const isDesktopApp = navigator.userAgent.includes('Electron');
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !isDesktopApp) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
// Prevent double-tap zoom & context menus on the battlefield.
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => { if (e.target.tagName === 'CANVAS') e.preventDefault(); });
