// Ablauf über die Oberfläche: Sicherung einlesen, in jedem Bereich etwas eintragen, prüfen was gespeichert ist.
const fs = require('fs'), os = require('os'), path = require('path');
const { oeffnen, bereich, gespeichert, pruefer, lauf, tag } = require('./lib');
const { beispiel, alsSicherung } = require('./daten');

lauf(async () => {
  const P = pruefer('Ablauf'), { browser, page, fehler } = await oeffnen(), heute = tag();
  const txAlle = d => Object.values(d.MY || {}).flatMap(y => Object.values(y.tx)).filter(Boolean);

  await bereich(page, 'routinen'); await page.click('#add'); await page.keyboard.type('Testnotiz'); await page.click('#n-done'); await page.waitForTimeout(150);
  P.ok('Notiz angelegt', Object.values((await gespeichert(page)).N.notes).some(n => n && n.x === 'Testnotiz'));

  const datei = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'track-')), 'sicherung.json');
  fs.writeFileSync(datei, JSON.stringify(alsSicherung(beispiel())));
  await bereich(page, 'heute'); await page.setInputFiles('#bk-file', datei); await page.waitForTimeout(400);
  let d = await gespeichert(page);
  P.ok('Sicherung eingelesen: Gewicht, Läufe, Gym, Konten; die drei Routinen der Sicherung bleiben gespeichert (gezeigt werden sie seit v75 nicht mehr)', d.S.routines.length === 3 && Object.keys(d.W.entries).length > 50 && Object.keys(d.T.runs).length === 8 && Object.keys(d.K.log).length === 22 && Object.keys(d.MF.acc).length === 3);
  const vorher = txAlle(d).length;

  await bereich(page, 'gewicht'); await page.click('#add'); await page.fill('#w-val', '79,9'); await page.click('#w-save'); await page.waitForTimeout(150);
  P.ok('Gewicht 79,9 kg gespeichert', (await gespeichert(page)).W.entries[heute] === 79.9);

  await bereich(page, 'haushalt'); await page.click('#v-haushalt [data-m="sub"][data-v="budget"]');
  await page.click('#v-haushalt [data-m="add"]'); await page.fill('#m-amt', '12,34'); await page.fill('#m-note', 'Testkauf'); await page.click('#m-acc .chip:has-text("Kein Konto")'); await page.click('#m-save'); await page.waitForTimeout(150);
  await page.click('#v-haushalt [data-m="income"]'); await page.fill('#m-amt', '50'); await page.click('#m-acc .chip:has-text("Kein Konto")'); await page.click('#m-save'); await page.waitForTimeout(150);
  d = await gespeichert(page);
  P.ok('Ausgabe 12,34 € gespeichert', txAlle(d).some(t => t.a === 1234 && t.k === 'out' && t.n === 'Testkauf' && t.d === heute));
  P.ok('Einnahme 50 € gespeichert', txAlle(d).some(t => t.a === 5000 && t.k === 'in' && t.d === heute));
  P.ok('genau zwei neue Buchungen', txAlle(d).length === vorher + 2, 'vorher ' + vorher + ', jetzt ' + txAlle(d).length);

  await bereich(page, 'training'); await page.click('#v-training .subtabs [data-v="cardio"]'); await page.click('#add');
  await page.fill('#t-km', '5,2'); await page.fill('#t-min', '28'); await page.fill('#t-sec', '30'); await page.click('#t-save'); await page.waitForTimeout(150);
  P.ok('Lauf 5,2 km in 28:30 gespeichert', Object.values((await gespeichert(page)).T.runs).some(r => r && r.m === 5200 && r.s === 1710 && r.d === heute));

  await page.click('#v-training .subtabs [data-v="kraft"]'); await page.click('#v-training .row:has-text("Beine") .go'); await page.waitForTimeout(250);
  P.ok('Training läuft', !!(await gespeichert(page)).K.live);
  await page.click('.lt-r .chk'); await page.click('#l-save'); await page.waitForTimeout(200); await page.click('#rs-ok');
  d = await gespeichert(page);
  P.ok('Training gespeichert: ein Satz Kniebeuge, nichts läuft mehr', !d.K.live && d.K.log[heute] && d.K.log[heute].e2 && d.K.log[heute].e2.length === 1, JSON.stringify(d.K.log[heute]));

  const vor = JSON.stringify(await gespeichert(page));
  await page.reload(); await page.waitForTimeout(400);
  P.ok('nach dem Neuladen ist alles unverändert', vor === JSON.stringify(await gespeichert(page)));
  await browser.close();

  // --- Laufband gibt es nicht mehr (v79, sein Wunsch: „laufe nur noch draußen“, „lösche die Daten von indoor“) ---
  // Im Speicher liegen ein Laufband-Lauf (auch einer aus der Zeit mit Tempo, v55) und ein Lauf draußen, beide von heute: Der Laufband-Lauf ist nach dem Start weg, im Speicher wie in der Ansicht.
  const alt = beispiel(); alt.T = { runs: { a1: { d: tag(0), m: 4800, s: 1800, hr: 150, k: 'in', spd: 10, inc: 1.5 }, a2: { d: tag(0), m: 3000, s: 1200, hr: null, k: 'in' }, a3: { d: tag(0), m: 5000, s: 1500, hr: 150, k: 'out' } } };
  const b = await oeffnen({ daten: alt });
  await b.page.reload(); await b.page.waitForTimeout(400);   // oeffnen() spielt die Daten nach dem Laden ein: Erst dieser Start liest sie
  const nachStart = (await gespeichert(b.page)).T.runs, da = Object.keys(nachStart).filter(i => nachStart[i]);
  P.ok('Start: Laufband-Läufe sind aus dem Speicher gelöscht, der Lauf draußen bleibt (ohne Felder für Art und Steigung)', da.join() === 'a3' && !('k' in nachStart.a3) && !('inc' in nachStart.a3) && nachStart.a3.m === 5000, JSON.stringify(nachStart));
  await bereich(b.page, 'training'); await b.page.click('#v-training .subtabs [data-v="cardio"]'); await b.page.waitForTimeout(150);
  const seite = await b.page.evaluate(() => document.querySelector('#v-training').innerText.replace(/\s+/g, ' '));
  P.ok('Cardio: ein Lauf, 5,0 km; kein Filter „Outdoor / Laufband / Alle“, kein Wort „Laufband“', seite.includes('1 Lauf') && seite.includes('5,0') && !(await b.page.$('#v-training [data-t="kind"]')) && !seite.includes('Laufband') && !seite.includes('Outdoor'), seite.slice(0, 300));
  await b.page.click('#add');
  P.ok('Blatt „Lauf eintragen“: keine Wahl der Art, keine Steigung', !(await b.page.$('#t-kind')) && !(await b.page.$('#t-inc')) && await b.page.isVisible('#t-km'));
  await b.page.fill('#t-km', '6'); await b.page.fill('#t-min', '30'); await b.page.click('#t-save'); await b.page.waitForTimeout(150);
  const neuL = Object.values((await gespeichert(b.page)).T.runs).filter(Boolean);
  P.ok('neuer Lauf gespeichert, zwei Läufe', neuL.length === 2 && neuL.some(r => r.m === 6000 && r.s === 1800 && !('k' in r)), JSON.stringify(neuL));
  // Eine alte Sicherung mit Laufband-Läufen einlesen: Sie kommen nicht zurück
  await bereich(b.page, 'heute'); await b.page.setInputFiles('#bk-file', { name: 'alt.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'takt', v: 1, T: { runs: { z1: { d: tag(0), m: 7000, s: 2400, hr: 140, k: 'in' }, z2: { d: tag(0), m: 8000, s: 2700, hr: 141, k: 'out' } } } })) });
  await b.page.waitForTimeout(400);
  const nachSich = (await gespeichert(b.page)).T.runs;
  P.ok('alte Sicherung eingelesen: der Lauf draußen kommt an, der Laufband-Lauf nicht', !nachSich.z1 && !!nachSich.z2 && nachSich.z2.m === 8000, JSON.stringify(nachSich));
  await b.browser.close();
  fehler.push(...b.fehler);
  await P.ende(null, fehler);
});
