// App-Symbol erzeugen: ein Zeichen auf leichtem Verlauf. Die steigende Linie steht für Fortschritt, der Punkt für „Track.“.
// Aufruf: node tests/symbol.js [ordner]   (ohne Ordner werden icon-180/192/512.png im Projekt überschrieben)
// Das Zeichen bleibt in der Mitte (80 % der Fläche), weil iPhone und Android die Ecken abschneiden.
const { chromium } = require('playwright');
const path = require('path');

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A2E3B"/><stop offset="1" stop-color="#0B0C10"/></linearGradient>
    <linearGradient id="l" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#0A84FF"/><stop offset="1" stop-color="#6CC0FF"/></linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <path d="M122 338 L214 252 L282 304 L372 196" fill="none" stroke="url(#l)" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="390" cy="176" r="40" fill="#F5F6F8"/>
</svg>`;

(async () => {
  const ziel = process.argv[2] || path.resolve(__dirname, '..');
  const browser = await chromium.launch();
  for (const n of [180, 192, 512]) {
    const page = await browser.newPage({ viewport: { width: n, height: n } });
    await page.setContent('<style>html,body{margin:0}svg{display:block;width:100vw;height:100vh}</style>' + SVG);
    await page.screenshot({ path: path.join(ziel, 'icon-' + n + '.png') });
    await page.close();
  }
  await browser.close();
  console.log('Symbole liegen in ' + ziel);
})();
