// Speichern: Daten über die Oberfläche anlegen, oft neu laden, Sicherung speichern und in eine leere App einlesen.
const fs = require('fs'), os = require('os'), path = require('path');
const { oeffnen, text, bereich, gespeichert, pruefer, lauf } = require('./lib');

lauf(async () => {
  const P = pruefer('Speichern'), { browser, page, fehler } = await oeffnen();
  await bereich(page, 'haushalt');
  await page.click('#v-haushalt [data-m="sub"][data-v="budget"]'); await page.click('#v-haushalt [data-m="add"]'); await page.fill('#m-amt', '12,34'); await page.click('#m-save'); await page.waitForTimeout(150);
  await page.click('#v-haushalt [data-m="sub"][data-v="verm"]'); await page.click('#v-haushalt [data-m="bal"]');
  for (const n of ['Giro', 'Depot']) { await page.fill('#v-new', n); await page.click('#v-new-add'); }
  const felder = await page.$$('#vsheet [data-acc]'); await felder[0].fill('1500'); await felder[1].fill('4000'); await page.click('#v-save'); await page.waitForTimeout(150);
  await page.click('#v-haushalt [data-m="newgoal"]'); await page.fill('#g-name', 'Ziel'); await page.fill('#g-amt', '9000'); await page.click('#v-save'); await page.waitForTimeout(150);
  await bereich(page, 'gewicht'); await page.click('#add'); await page.fill('#w-val', '80'); await page.click('#w-save'); await page.waitForTimeout(150);

  const stand = JSON.stringify(await gespeichert(page));
  let anders = 0;
  for (let i = 0; i < 25; i++) { await page.reload(); await page.waitForTimeout(100); if (JSON.stringify(await gespeichert(page)) !== stand) anders++; }
  P.ok('25-mal neu geladen, Daten jedes Mal unverändert', anders === 0, anders + ' Abweichungen');
  await bereich(page, 'haushalt');
  P.enthaelt('Anzeige nach dem Neuladen: Vermögen 5.500 €', await text(page, '#v-haushalt .subtabs [aria-pressed="true"], #v-haushalt .hero h1'), ['Vermögen', '5.500']);

  // Sicherung speichern und in eine leere App einlesen
  await bereich(page, 'heute');
  const laden = page.waitForEvent('download'); await page.click('[data-h="export"]');
  const datei = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'track-')), 'sicherung.json'); const dl = await laden; await dl.saveAs(datei);
  P.ok('Sicherungsdatei heißt track-sicherung-….json', /^track-sicherung-\d{4}-\d\d-\d\d\.json$/.test(dl.suggestedFilename()), dl.suggestedFilename());
  P.ok('Datei trägt die alte Kennung, damit alte Sicherungen lesbar bleiben', JSON.parse(fs.readFileSync(datei, 'utf8')).app === 'takt');
  const B = await oeffnen();
  await B.page.setInputFiles('#bk-file', datei); await B.page.waitForTimeout(400);
  const a = JSON.parse(stand), b = await gespeichert(B.page);
  P.ok('eingelesen: Konten, Stände und Sparziele gleich', JSON.stringify([a.MF.acc, a.MF.bal, a.MF.goals]) === JSON.stringify([b.MF.acc, b.MF.bal, b.MF.goals]));
  P.ok('eingelesen: Buchungen und Gewicht gleich', JSON.stringify([a.MY, a.W.entries]) === JSON.stringify([b.MY, b.W.entries]));
  P.enthaelt('das Einlesen wird bestätigt', await text(B.page, '#bk-msg'), ['Sicherung eingelesen']);
  P.ok('nach dem Einlesen erscheint keine Erinnerung an die Sicherung', !(await B.page.$('.remind')));
  await B.browser.close();
  await P.ende(browser, fehler.concat(B.fehler));
});
