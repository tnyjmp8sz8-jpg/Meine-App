// Ablauf über die Oberfläche: Sicherung einlesen, in jedem Bereich etwas eintragen, prüfen was gespeichert ist.
const fs = require('fs'), os = require('os'), path = require('path');
const { oeffnen, bereich, gespeichert, pruefer, lauf, tag } = require('./lib');
const { beispiel, alsSicherung } = require('./daten');

lauf(async () => {
  const P = pruefer('Ablauf'), { browser, page, fehler } = await oeffnen(), heute = tag();
  const txAlle = d => Object.values(d.MY || {}).flatMap(y => Object.values(y.tx)).filter(Boolean);

  await bereich(page, 'routinen'); await page.click('#add'); await page.fill('#f-name', 'Testroutine'); await page.click('#f-save'); await page.waitForTimeout(150);
  P.ok('Routine angelegt', (await gespeichert(page)).S.routines.some(r => r.name === 'Testroutine'));

  const datei = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'track-')), 'sicherung.json');
  fs.writeFileSync(datei, JSON.stringify(alsSicherung(beispiel())));
  await bereich(page, 'heute'); await page.setInputFiles('#bk-file', datei); await page.waitForTimeout(400);
  let d = await gespeichert(page);
  P.ok('Sicherung eingelesen: vier Routinen, Gewicht, Läufe, Gym, Konten', d.S.routines.length === 4 && Object.keys(d.W.entries).length > 50 && Object.keys(d.T.runs).length === 8 && Object.keys(d.K.log).length === 22 && Object.keys(d.MF.acc).length === 3);
  const vorher = txAlle(d).length;

  await bereich(page, 'routinen'); await page.click('#main .row:has-text("Testroutine") .go'); await page.waitForTimeout(1300);
  P.ok('Routine läuft', !!(await gespeichert(page)).S.running);
  await page.click('#main .row:has-text("Testroutine") .go'); await page.waitForTimeout(150);
  d = await gespeichert(page);
  const rid = d.S.routines.find(r => r.name === 'Testroutine').id, e = ((d.LY[heute.slice(0, 4)] || {})[heute] || {})[rid];
  P.ok('Routine pausiert, Zeit gespeichert', !d.S.running && e && e.s >= 1 && e.s <= 4 && e.d === 0, JSON.stringify(e));

  await bereich(page, 'gewicht'); await page.click('#add'); await page.fill('#w-val', '79,9'); await page.click('#w-save'); await page.waitForTimeout(150);
  P.ok('Gewicht 79,9 kg gespeichert', (await gespeichert(page)).W.entries[heute] === 79.9);

  await bereich(page, 'haushalt'); await page.click('#v-haushalt [data-m="sub"][data-v="budget"]');
  await page.click('#v-haushalt [data-m="add"]'); await page.fill('#m-amt', '12,34'); await page.fill('#m-note', 'Testkauf'); await page.click('#m-acc .chip:has-text("Kein Konto")'); await page.click('#m-save'); await page.waitForTimeout(150);
  await page.click('#v-haushalt [data-m="income"]'); await page.fill('#m-amt', '50'); await page.click('#m-acc .chip:has-text("Kein Konto")'); await page.click('#m-save'); await page.waitForTimeout(150);
  d = await gespeichert(page);
  P.ok('Ausgabe 12,34 € gespeichert', txAlle(d).some(t => t.a === 1234 && t.k === 'out' && t.n === 'Testkauf' && t.d === heute));
  P.ok('Einnahme 50 € gespeichert', txAlle(d).some(t => t.a === 5000 && t.k === 'in' && t.d === heute));
  P.ok('genau zwei neue Buchungen', txAlle(d).length === vorher + 2, 'vorher ' + vorher + ', jetzt ' + txAlle(d).length);

  await bereich(page, 'training'); await page.click('#v-training .subtabs button:nth-child(1)'); await page.click('#add');
  await page.fill('#t-km', '5,2'); await page.fill('#t-min', '28'); await page.fill('#t-sec', '30'); await page.click('#t-save'); await page.waitForTimeout(150);
  P.ok('Lauf 5,2 km in 28:30 gespeichert', Object.values((await gespeichert(page)).T.runs).some(r => r && r.m === 5200 && r.s === 1710 && r.d === heute));

  await page.click('#v-training .subtabs button:nth-child(2)'); await page.click('#v-training .row:has-text("Beine") .go'); await page.waitForTimeout(250);
  P.ok('Training läuft', !!(await gespeichert(page)).K.live);
  await page.click('.lt-r .chk'); await page.click('#l-save'); await page.waitForTimeout(200);
  d = await gespeichert(page);
  P.ok('Training gespeichert: ein Satz Kniebeuge, nichts läuft mehr', !d.K.live && d.K.log[heute] && d.K.log[heute].e2 && d.K.log[heute].e2.length === 1, JSON.stringify(d.K.log[heute]));

  const vor = JSON.stringify(await gespeichert(page));
  await page.reload(); await page.waitForTimeout(400);
  P.ok('nach dem Neuladen ist alles unverändert', vor === JSON.stringify(await gespeichert(page)));
  await browser.close();

  // --- Laufband ohne Tempo (v56): Das Feld für km/h ist weg. Läufe aus älteren Versionen, bei denen mit dem Tempo gerechnet wurde, behalten ihre Zahlen. ---
  // Alter Lauf: 30 min bei 10 km/h, laut Uhr 4,8 km. Gerechnet wurde mit 10 / 3,6 × 1800 s = 5000 m, also 5,0 km und Pace 1800 / 5 = 360 s = 6:00.
  const alt = beispiel(); alt.T = { runs: { a1: { d: tag(1), m: 4800, s: 1800, hr: 150, k: 'in', spd: 10, inc: 1.5 } } };
  const b = await oeffnen({ daten: alt });
  await bereich(b.page, 'training'); await b.page.click('#v-training .subtabs button:nth-child(1)'); await b.page.waitForTimeout(150);
  await b.page.click('#v-training [data-fold="laeufe"]');   // Läufe sind eine eingeklappte Zeile
  const seite = await b.page.evaluate(() => document.querySelector('#v-training').innerText.replace(/\s+/g, ' '));
  P.ok('alter Laufband-Lauf: weiter 5,0 km und Pace 6:00, kein km/h mehr', seite.includes('5,0 km in 30:00') && seite.includes('6:00 /km') && !seite.includes('km/h') && seite.includes('1,5 % Steigung'), seite.slice(0, 400));
  await b.page.click('#v-training [data-t="edit"]');
  P.ok('Blatt: Strecke 5,0, Steigung 1,5, kein Feld für das Tempo', (await b.page.inputValue('#t-km')) === '5,0' && (await b.page.inputValue('#t-inc')) === '1,5' && (await b.page.$('#t-spd')) === null && await b.page.isVisible('#t-in-fld'));
  await b.page.click('#t-save'); await b.page.waitForTimeout(150);
  const lauf1 = (await gespeichert(b.page)).T.runs.a1;
  P.ok('gespeichert: 5000 m, ohne Tempo', lauf1.m === 5000 && lauf1.s === 1800 && lauf1.inc === 1.5 && !('spd' in lauf1), JSON.stringify(lauf1));
  await b.page.click('#add'); await b.page.click('#t-kind [data-k="out"]');
  P.ok('Outdoor: keine Steigung', !(await b.page.isVisible('#t-in-fld')));
  await b.browser.close();
  fehler.push(...b.fehler);
  await P.ende(null, fehler);
});
