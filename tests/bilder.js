// Bildschirmfotos aller Bereiche und der wichtigsten Blätter, zum Ansehen vor einer Veröffentlichung.
// Aufruf: node tests/bilder.js <ordner> [schaerfe]   (schaerfe 2 für Bilder, die der Nutzer sieht)
// Es entstehen Bilder für dunkel und hell, 390 und 320 px, mit Beispieldaten und leer.
const fs = require('fs');
const { oeffnen, bereich, blaetterZu, nachOben, lauf } = require('./lib');
const { beispiel } = require('./daten');

lauf(async () => {
  const [ordner, schaerfe] = process.argv.slice(2);
  if (!ordner) { console.log('Aufruf: node tests/bilder.js <ordner> [schaerfe]'); process.exit(1); }
  fs.mkdirSync(ordner, { recursive: true });
  const alle = [];
  for (const hell of [false, true]) for (const breite of [390, 320]) for (const voll of [true, false]) {
    if (!voll && (hell || breite === 320)) continue;   // leerer Zustand nur einmal: dunkel, 390
    const { browser, page, fehler } = await oeffnen({ hell, breite, schaerfe: +(schaerfe || 1), daten: voll ? beispiel() : null });
    const vor = (hell ? 'hell' : 'dunkel') + '-' + breite + '-' + (voll ? 'daten' : 'leer') + '-';
    const bild = async n => { await page.waitForTimeout(300); await page.screenshot({ path: ordner + '/' + vor + n + '.png' }); };
    const versuch = async (n, f) => { try { await blaetterZu(page); await f(); await bild(n); } catch (e) { fehler.push(n + ': ' + String(e.message).split('\n')[0]); } };
    for (const v of ['heute', 'routinen', 'gewicht', 'haushalt', 'training']) await versuch(v, async () => { await bereich(page, v); await nachOben(page); });
    if (voll) {
      await versuch('woche', async () => { await bereich(page, 'heute'); await page.click('[data-h="mode"][data-v="week"]'); });
      await versuch('kalender', async () => { await page.click('[data-h="mode"][data-v="day"]'); await page.click('#v-heute .wd.now'); });
      await versuch('budget', async () => { await bereich(page, 'haushalt'); await page.click('#v-haushalt [data-m="sub"][data-v="budget"]'); });
      await versuch('blatt-ausgabe', async () => { await page.click('#v-haushalt [data-m="add"]'); });
      await versuch('blatt-stand', async () => { await page.click('#v-haushalt [data-m="sub"][data-v="verm"]'); await page.click('#add'); });
      await versuch('gym', async () => { await bereich(page, 'training'); await page.click('#v-training .subtabs button:nth-child(2)'); });
      await versuch('gym-jahr', async () => { await page.click('#v-training [data-t="mode"][data-v="year"]'); });
      await versuch('uebung', async () => { await page.click('#v-training [data-t="mode"][data-v="month"]'); await page.click('#v-training [data-k="exs"]'); await page.click('#v-training [data-k="ex"]'); });
      await versuch('training-laeuft', async () => { await page.click('#v-training .row .go'); });
      await versuch('aufgaben', async () => { await bereich(page, 'routinen'); await page.click('#r-subs [data-v="task"]'); await nachOben(page); });
      await versuch('blatt-aufgabe', async () => { await page.click('#add'); });
      await versuch('notizen', async () => { await page.click('#r-subs [data-v="note"]'); await nachOben(page); });
      await versuch('blatt-notiz', async () => { await page.click('#n-main [data-n="note"]:has-text("Besprechung")'); });
      await versuch('routinen-zurueck', async () => { await page.click('#r-subs [data-v="rout"]'); });
      await versuch('blatt-routine', async () => { await bereich(page, 'routinen'); await page.click('#add'); });
      await versuch('blatt-gewicht', async () => { await bereich(page, 'gewicht'); await page.click('#add'); });
    }
    await browser.close();
    alle.push(...fehler.map(f => vor + f));
  }
  console.log(alle.length ? 'Fehler:\n  ' + alle.join('\n  ') : 'Bilder liegen in ' + ordner + ', keine Fehler.');
  process.exit(alle.length ? 1 : 0);
});
