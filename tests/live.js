// Prüft die veröffentlichte App: richtige Version, identisch mit dem Repository, installierbar, ohne Netz startbar, keine fremden Server.
// Aufruf: node tests/live.js [adresse]   Braucht Netz; in der Cloud-Umgebung muss die Pages-Adresse erlaubt sein.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { pruefer, lauf } = require('./lib');

lauf(async () => {
  const url = process.argv[2] || 'https://tnyjmp8sz8-jpg.github.io/Meine-App/', P = pruefer('Veröffentlichte App');
  const ROOT = path.resolve(__dirname, '..'), soll = (fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').match(/takt-v\d+/) || [])[0];
  const px = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
  const browser = await chromium.launch(px ? { proxy: { server: px.protocol + '//' + px.host, username: decodeURIComponent(px.username), password: decodeURIComponent(px.password) } } : {});
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }), page = await ctx.newPage(), fehler = [], fremd = new Set();
  page.on('pageerror', e => fehler.push('Seitenfehler: ' + e.message));
  page.on('request', r => { const h = new URL(r.url()).host; if (h !== new URL(url).host) fremd.add(h); });

  const antwort = await page.goto(url, { waitUntil: 'load' });
  P.ok('Adresse antwortet', antwort.status() === 200, 'Status ' + antwort.status());
  await page.evaluate(() => navigator.serviceWorker.ready); await page.waitForTimeout(1500);
  const cache = (await page.evaluate(() => caches.keys())).join();
  P.ok('ausgeliefert wird ' + soll, cache === soll, 'ausgeliefert: ' + cache + ' (nach dem Hochladen dauert es ein bis zwei Minuten)');
  const html = await page.evaluate(async () => (await fetch(location.href, { cache: 'no-store' })).text());
  P.ok('index.html ist identisch mit dem Repository', html === fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
  const m = await page.evaluate(async () => (await fetch(document.querySelector('link[rel=manifest]').href)).json());
  P.ok('Manifest: Name „Track.“, eigenständige App, zwei Icons', m.name === 'Track.' && m.display === 'standalone' && m.icons.length === 2, JSON.stringify(m).slice(0, 120));
  P.ok('Fußzeile zeigt dieselbe Version', (await page.innerText('.ver')) === soll.replace('takt-', ''));
  await ctx.setOffline(true); let offline = true; try { await page.reload({ waitUntil: 'load' }); } catch (e) { offline = false; }
  P.ok('ohne Netz startet die App', offline && (await page.innerText('.mark')) === 'Track.');
  P.ok('keine Anfragen an fremde Server', fremd.size === 0, [...fremd].join(', '));
  await P.ende(browser, fehler);
});
