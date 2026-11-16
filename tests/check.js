// Tages-Check (v57): Schlaf auf Heute mit einem Tipp bewerten (1 bis 5), Schnitt in der Wochenansicht, Zusammenhänge mit Training und Routinen.
const fs = require('fs'), os = require('os'), path = require('path');
const { oeffnen, text, gespeichert, pruefer, lauf, tag } = require('./lib');

/* Zwölf bewertete Tage (i = vor so vielen Tagen), heute noch ohne Bewertung:
   i = 1 bis 6: Schlaf 5, 4, 5, 4, 4, 5 (gut)    · Routine „Lesen“ erledigt an 1 bis 5, also 5 von 6
   i = 7 bis 12: Schlaf 2, 3, 1, 3, 2, 3 (nicht gut) · Routine erledigt an 7 und 8, also 2 von 6
   Läufe vor 2, 3, 4, 5, 6 Tagen: Die Nächte danach sind die Bewertungen von i = 1 bis 5. */
const SCHLAF = [null, 5, 4, 5, 4, 4, 5, 2, 3, 1, 3, 2, 3];
function daten(tage) {
  const d = { S: { routines: [{ id: 'r1', name: 'Lesen', minutes: 30, days: Array(7).fill(true), created: tag(30) }], running: null }, LY: {}, W: { goal: null, goalFrom: null, entries: {} },
    MF: { fixed: {} }, MY: {}, T: { runs: {} }, K: { ex: {}, log: {} }, N: { folders: {}, tasks: {}, notes: {} }, DC: { sleep: {} } };
  for (let i = 1; i <= tage; i++) d.DC.sleep[tag(i)] = SCHLAF[i];
  [1, 2, 3, 4, 5, 7, 8].forEach(i => { const k = tag(i), y = k.slice(0, 4); d.LY[y] = d.LY[y] || {}; d.LY[y][k] = { r1: { s: 1800, d: 1 } }; });
  [2, 3, 4, 5, 6].forEach(i => { d.T.runs['c' + i] = { d: tag(i), m: 5000, s: 1800, hr: null, k: 'out' }; });
  return d;
}

lauf(async () => {
  const P = pruefer('Tages-Check');
  const { browser, page, fehler } = await oeffnen({ daten: daten(12) });
  const kurz = () => page.waitForTimeout(150), heute = tag(0);
  const schlaf = async () => ((await gespeichert(page)).DC || { sleep: {} }).sleep;
  const gedrueckt = () => page.evaluate(() => [...document.querySelectorAll('.chk [aria-pressed="true"]')].map(b => b.textContent).join(','));

  // --- Woche, bevor heute bewertet ist ---
  // Training und Schlaf: nach Trainingstagen (5 + 4 + 5 + 4 + 4) / 5 = 22 / 5 = 4,4 · sonst (5 + 2 + 3 + 1 + 3 + 2 + 3) / 7 = 19 / 7 = 2,71 → 2,7 · 12 Nächte
  // Schlaf und Routinen: nach gutem Schlaf 5 von 6 = 83 % · sonst 2 von 6 = 33 % · 12 Tage
  await page.click('#v-heute [data-h="mode"][data-v="week"]'); await kurz();
  P.enthaelt('Training und Schlaf: 4,4 gegen 2,7 aus 12 Nächten', await text(page, '#v-heute'), ['Training und Schlaf', 'Nach Tagen mit Training: Schlaf 4,4 von 5. Nach den anderen Tagen: 2,7. Grundlage: 12 Nächte.']);
  P.enthaelt('Schlaf und Routinen: 83 % gegen 33 % aus 12 Tagen', await text(page, '#v-heute'), ['Schlaf und Routinen', 'Nach gutem Schlaf (4 oder 5): 83 % der Routinen erledigt. An den anderen Tagen: 33 %. Grundlage: 12 Tage.']);
  await page.click('#v-heute [data-h="mode"][data-v="day"]'); await kurz();

  // --- Heute: eine Zeile, fünf Kreise, ein Tipp ---
  P.ok('Zeile „Schlaf“ mit fünf Kreisen, nichts gewählt', (await text(page, '.chk .l')) === 'Schlaf Noch offen' && (await page.$$('.chk .dots button')).length === 5 && (await gedrueckt()) === '');
  await page.click('.chk [data-v="4"]'); await kurz();
  P.ok('Tipp auf 4: gespeichert, „Gut“, Kreis gewählt', (await schlaf())[heute] === 4 && (await text(page, '.chk .l')) === 'Schlaf Gut' && (await gedrueckt()) === '4');
  await page.click('.chk [data-v="2"]'); await kurz();
  P.ok('Tipp auf 2 ändert die Bewertung', (await schlaf())[heute] === 2 && (await gedrueckt()) === '2');
  await page.click('.chk [data-v="2"]'); await kurz();
  P.ok('zweiter Tipp auf dieselbe Zahl nimmt sie zurück', !(heute in (await schlaf())) && (await gedrueckt()) === '' && (await text(page, '.chk .l')) === 'Schlaf Noch offen');
  await page.click('.chk [data-v="4"]'); await kurz();
  await page.reload(); await page.waitForTimeout(300);
  P.ok('nach dem Neuladen noch da', (await schlaf())[heute] === 4 && (await gedrueckt()) === '4');

  // --- Woche mit der Bewertung von heute ---
  // Diese Woche = Montag bis heute. Heute 4, davor die Werte aus SCHLAF. An einem Montag also nur 4,0 aus 1 Nacht.
  const wt = (new Date().getDay() + 6) % 7, werte = [4]; for (let i = 1; i <= wt; i++) werte.push(SCHLAF[i]);
  const schnitt = (werte.reduce((a, b) => a + b, 0) / werte.length).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  await page.click('#v-heute [data-h="mode"][data-v="week"]'); await kurz();
  P.enthaelt('Woche zeigt den Schnitt: ' + schnitt + ' aus ' + werte.length, await text(page, '#v-heute .kv'), ['Schlaf ' + schnitt + 'von 5 · ' + werte.length + (werte.length === 1 ? ' Nacht' : ' Nächte')]);
  // Heute (4) folgt auf einen Tag ohne Training: sonst (19 + 4) / 8 = 2,875 → 2,9 · 13 Nächte. Die Routinen zählen heute noch nicht: weiter 12 Tage.
  P.enthaelt('heute zählt beim Schlaf mit, bei den Routinen noch nicht', await text(page, '#v-heute'), ['Nach den anderen Tagen: 2,9. Grundlage: 13 Nächte.', 'Grundlage: 12 Tage.']);

  // --- Sicherung: der Tages-Check ist dabei ---
  const [dl] = await Promise.all([page.waitForEvent('download'), (async () => { await page.click('#v-heute [data-h="mode"][data-v="day"]'); await page.click('#v-heute [data-h="export"]'); })()]);
  const datei = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'track-')), 'sicherung.json'); await dl.saveAs(datei);
  const sich = JSON.parse(fs.readFileSync(datei, 'utf8'));
  P.ok('Sicherung enthält 13 Bewertungen', sich.DC && Object.keys(sich.DC.sleep).length === 13 && sich.DC.sleep[heute] === 4);
  await browser.close();

  // --- Wenige Bewertungen: Hinweis statt Vergleich. Sicherung in eine andere App einlesen ergänzt. Ungültiges fällt weg. ---
  const wenig = daten(3); wenig.DC.sleep['2020-01-01'] = 7; wenig.DC.sleep.unsinn = 3;
  const b = await oeffnen({ daten: wenig, breite: 320 });
  P.ok('320 px: Zeile da, nichts ragt seitlich hinaus', await b.page.isVisible('.chk') && await b.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  const kreis = await b.page.evaluate(() => { const r = document.querySelector('.chk [data-v="1"]').getBoundingClientRect(), a = getComputedStyle(document.querySelector('.chk [data-v="1"]'), '::after'); return { b: r.width, tipp: r.height - parseFloat(a.top) - parseFloat(a.bottom) }; });
  P.ok('Kreise 30 px, Tippfläche mindestens 40 px hoch', kreis.b === 30 && kreis.tipp >= 40, JSON.stringify(kreis));
  await b.page.click('#v-heute [data-h="mode"][data-v="week"]'); await b.page.waitForTimeout(150);
  P.enthaelt('drei Bewertungen: Hinweis mit Anzahl, kein Vergleich', await text(b.page, '#v-heute'), ['Bisher bewertet: 3 Tage.']);
  P.ok('kein Vergleich mit Schlaf', !(await text(b.page, '#v-heute')).includes('Training und Schlaf'));
  await b.page.click('#v-heute [data-h="mode"][data-v="day"]');
  await b.page.setInputFiles('#bk-file', datei); await b.page.waitForTimeout(400);
  const nach = ((await gespeichert(b.page)).DC || {}).sleep || {};
  P.ok('eingelesen: 13 Bewertungen, Ungültiges ist weg', Object.keys(nach).length === 13 && nach[heute] === 4 && nach[tag(12)] === 3 && !('unsinn' in nach) && !('2020-01-01' in nach), JSON.stringify(nach));
  await b.browser.close();

  // --- Leere App: Zeile da, in der Woche kein Wort vom Schlaf ---
  const leer = await oeffnen();
  P.ok('leere App: Zeile „Schlaf“ steht auf Heute', await leer.page.isVisible('.chk'));
  await leer.page.click('#v-heute [data-h="mode"][data-v="week"]'); await leer.page.waitForTimeout(150);
  P.ok('ohne Bewertung: kein Hinweis und keine Zeile zum Schlaf', !(await text(leer.page, '#v-heute')).includes('Schlaf'));
  await leer.browser.close();
  fehler.push(...b.fehler, ...leer.fehler);
  await P.ende(null, fehler);
});
