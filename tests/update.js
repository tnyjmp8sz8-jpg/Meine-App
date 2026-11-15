// Service Worker: offline starten und Selbst-Aktualisierung. Dafür braucht die App http;
// der Test liefert die Dateien selbst aus, nur auf diesem Rechner und nur solange er läuft.
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const { pruefer, lauf } = require('./lib');

const ROOT = path.resolve(__dirname, '..');
const TYPEN = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const DATEIEN = ['index.html', 'sw.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

lauf(async () => {
  const P = pruefer('Aktualisierung');
  /* Zwei Stände: A = jetzige App, B = „neue Version“ mit anderem Cache-Namen und erkennbarem Titel */
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'track-')), A = path.join(tmp, 'a'), B = path.join(tmp, 'b');
  [A, B].forEach(d => { fs.mkdirSync(d); DATEIEN.forEach(f => fs.copyFileSync(path.join(ROOT, f), path.join(d, f))); });
  const sw = fs.readFileSync(path.join(A, 'sw.js'), 'utf8'), alt = (sw.match(/takt-v(\d+)/) || [])[1];
  fs.writeFileSync(path.join(B, 'sw.js'), sw.replace('takt-v' + alt, 'takt-v' + (+alt + 1)));
  fs.writeFileSync(path.join(B, 'index.html'), fs.readFileSync(path.join(B, 'index.html'), 'utf8').replace('<span class="mark">Track.</span>', '<span class="mark">Track. NEU</span>'));
  const fuss = (fs.readFileSync(path.join(A, 'index.html'), 'utf8').match(/class="ver">v(\d+)</) || [])[1];
  P.ok('Versionsnummer in sw.js und in der Fußzeile gleich (v' + alt + ')', !!alt && alt === fuss, 'sw.js v' + alt + ', Fußzeile v' + fuss);

  let ordner = A;
  const srv = http.createServer((q, r) => {
    const f = path.join(ordner, q.url.split('?')[0] === '/' ? 'index.html' : path.basename(q.url.split('?')[0]));
    if (!fs.existsSync(f)) { r.writeHead(404); return r.end('nicht da'); }
    r.writeHead(200, { 'Content-Type': TYPEN[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); r.end(fs.readFileSync(f));
  });
  await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
  const url = 'http://127.0.0.1:' + srv.address().port + '/';
  const browser = await chromium.launch(), ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }), page = await ctx.newPage(), fehler = [];
  page.on('pageerror', e => fehler.push('Seitenfehler: ' + e.message));
  let geladen = 0; page.on('load', () => geladen++);
  const marke = () => page.innerText('.mark'), caches = () => page.evaluate(() => caches.keys());

  await page.goto(url); await page.evaluate(() => navigator.serviceWorker.ready); await page.waitForTimeout(800);
  const drin = await page.evaluate(async () => (await (await caches.open((await caches.keys())[0])).keys()).length);
  P.ok('Service Worker hat alle sechs Dateien gespeichert', drin === 6, drin + ' Dateien');
  await page.reload(); await page.waitForTimeout(400);
  await ctx.setOffline(true); let offline = true; try { await page.reload(); } catch (e) { offline = false; }
  P.ok('ohne Netz startet die App', offline && (await marke()) === 'Track.');
  await ctx.setOffline(false);

  // neue Version erscheint, während ein Blatt offen ist
  ordner = B; geladen = 0;
  await page.click('.tab[data-view="gewicht"]'); await page.click('#add'); await page.fill('#w-val', '81,5');
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); await page.waitForTimeout(2500);
  P.ok('neue Version ist geholt', (await caches()).join() === 'takt-v' + (+alt + 1), (await caches()).join());
  P.ok('bei offenem Blatt wird nicht neu geladen, die Eingabe bleibt', geladen === 0 && (await page.inputValue('#w-val')) === '81,5');
  await page.click('#w-save'); await page.waitForTimeout(2000);
  P.ok('nach dem Schließen lädt die App einmal neu und zeigt die neue Version', geladen === 1 && (await marke()) === 'Track. NEU', 'geladen ' + geladen + ', Titel ' + await marke());
  P.ok('die Eingabe ist gespeichert', (await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('takt.v1')).W.entries))).join() === '81.5');
  geladen = 0; await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); await page.waitForTimeout(1500);
  P.ok('ohne neue Version wird nicht noch einmal geladen', geladen === 0);
  srv.close();
  await P.ende(browser, fehler);
});
