// App-Symbol erzeugen: die steigende Linie (Fortschritt) mit hellem Punkt („Track.“) auf fast schwarzem Grund, dahinter ein blauer Schein
// (seit v70, vom Nutzer nach Vorschaubild gewählt: „schwarz mit schein“; vorher ein grauer Verlauf).
// Aufruf: node tests/symbol.js [ordner]   (ohne Ordner werden icon-180/192/512.png im Projekt und das Symbol der iPhone-App überschrieben)
// Das Zeichen bleibt in der Mitte (80 % der Fläche), weil iPhone und Android die Ecken abschneiden.
const { chromium } = require('playwright');
const path = require('path');

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="g" cx="0.62" cy="0.42" r="0.75"><stop offset="0" stop-color="#11203A"/><stop offset="0.55" stop-color="#07090E"/><stop offset="1" stop-color="#000000"/></radialGradient>
    <linearGradient id="l" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#0A6CFF"/><stop offset="1" stop-color="#5CB8FF"/></linearGradient>
    <filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="26"/></filter>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <path d="M122 338 L214 252 L282 304 L372 196" fill="none" stroke="#0A84FF" stroke-width="46" stroke-linecap="round" stroke-linejoin="round" opacity="0.45" filter="url(#f)"/>
  <path d="M122 338 L214 252 L282 304 L372 196" fill="none" stroke="url(#l)" stroke-width="42" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="390" cy="176" r="60" fill="#FFFFFF" opacity="0.28" filter="url(#f)"/>
  <circle cx="390" cy="176" r="38" fill="#FFFFFF"/>
</svg>`;

(async () => {
  const ziel = process.argv[2] || path.resolve(__dirname, '..');
  const browser = await chromium.launch();
  // 1024 ist das Symbol der iPhone-App (ohne runde Ecken, die schneidet iOS selbst)
  for (const n of [180, 192, 512, 1024]) {
    const page = await browser.newPage({ viewport: { width: n, height: n } });
    await page.setContent('<style>html,body{margin:0}svg{display:block;width:100vw;height:100vh}</style>' + SVG);
    await page.screenshot({ path: n === 1024 ? (process.argv[2] ? path.join(ziel, 'icon-1024.png') : path.resolve(__dirname, '../ios/App/Assets.xcassets/AppIcon.appiconset/icon-1024.png')) : path.join(ziel, 'icon-' + n + '.png') });
    await page.close();
  }
  await browser.close();
  console.log('Symbole liegen in ' + ziel);
})();
