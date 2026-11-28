// Speichern: Daten über die Oberfläche anlegen, oft neu laden, Sicherung speichern und in eine leere App einlesen.
const fs = require('fs'), os = require('os'), path = require('path');
const { oeffnen, text, bereich, gespeichert, einstellungen, pruefer, lauf } = require('./lib');

lauf(async () => {
  /* Konten, Stände und ein Sparziel aus der Zeit mit Vermögen (seit v156 ausgebaut): Sie lassen sich nicht mehr anlegen, müssen aber gespeichert bleiben und mit der Sicherung umziehen */
  const ym = new Date().toISOString().slice(0, 7);
  const P = pruefer('Speichern'), { browser, page, fehler } = await oeffnen({ daten: { S: { routines: [] }, LY: {},
    MF: { fixed: {}, acc: { g: { n: 'Giro' }, d: { n: 'Depot' } }, bal: { [ym]: { g: 150000, d: 400000 } }, goals: { z: { n: 'Ziel', amount: 900000, acc: null } } } } });
  await bereich(page, 'haushalt');
  await page.click('#v-haushalt [data-m="add"]'); await page.fill('#m-amt', '12,34'); await page.click('#m-save'); await page.waitForTimeout(150);
  await bereich(page, 'gewicht'); await page.click('#add'); await page.fill('#w-val', '80'); await page.click('#w-save'); await page.waitForTimeout(150);

  const stand = JSON.stringify(await gespeichert(page));
  let anders = 0;
  for (let i = 0; i < 25; i++) { await page.reload(); await page.waitForTimeout(100); if (JSON.stringify(await gespeichert(page)) !== stand) anders++; }
  P.ok('25-mal neu geladen, Daten jedes Mal unverändert', anders === 0, anders + ' Abweichungen');
  await bereich(page, 'haushalt');
  // Budget: nur die Ausgabe von 12,34 € → im Minus, gerundet 12 €
  P.enthaelt('Anzeige nach dem Neuladen: Budget mit der Ausgabe (12 € im Minus)', await text(page, '#v-haushalt .hero h1'), ['12']);

  // Sicherung speichern und in eine leere App einlesen
  // über die Einstellungen hinter dem Zahnrad auf Heute (v106): Die Erinnerung oben mit demselben Knopf gibt es nicht an jedem Tag (hier erst ab dem 8. des Monats)
  await einstellungen(page);
  const laden = page.waitForEvent('download'); await page.click('#esheet .act[data-h="export"]');
  const datei = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'track-')), 'sicherung.json'); const dl = await laden; await dl.saveAs(datei);
  P.ok('Sicherungsdatei heißt track-sicherung-….json', /^track-sicherung-\d{4}-\d\d-\d\d\.json$/.test(dl.suggestedFilename()), dl.suggestedFilename());
  P.ok('Datei trägt die alte Kennung, damit alte Sicherungen lesbar bleiben', JSON.parse(fs.readFileSync(datei, 'utf8')).app === 'takt');
  const B = await oeffnen();
  await B.page.setInputFiles('#bk-file', datei); await B.page.waitForTimeout(400);
  const a = JSON.parse(stand), b = await gespeichert(B.page);
  P.ok('eingelesen: Konten, Stände und Sparziele gleich', JSON.stringify([a.MF.acc, a.MF.bal, a.MF.goals]) === JSON.stringify([b.MF.acc, b.MF.bal, b.MF.goals]));
  P.ok('eingelesen: Buchungen und Gewicht gleich', JSON.stringify([a.MY, a.W.entries]) === JSON.stringify([b.MY, b.W.entries]));
  P.ok('nach dem Einlesen erscheint keine Erinnerung an die Sicherung', !(await B.page.$('.remind')));
  await einstellungen(B.page);
  P.enthaelt('das Einlesen wird in den Einstellungen bestätigt', await text(B.page, '#bk-msg'), ['Sicherung eingelesen']);
  await B.browser.close();
  await P.ende(browser, fehler.concat(B.fehler));
});
