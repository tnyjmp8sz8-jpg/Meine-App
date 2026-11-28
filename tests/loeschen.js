// „Rückgängig“ nach dem Löschen und eigene Kategorien.
const { oeffnen, text, bereich, gespeichert, pruefer, lauf } = require('./lib');
const { beispiel } = require('./daten');

lauf(async () => {
  const P = pruefer('Löschen und Kategorien'), { browser, page, fehler } = await oeffnen({ daten: beispiel() });
  const roh = () => page.evaluate(() => localStorage.getItem('takt.v1'));
  const hinweis = () => page.evaluate(() => { const t = document.querySelector('#toast'); return t.hidden || !t.getClientRects().length ? '' : t.innerText.replace(/\s+/g, ' ').trim(); });
  const kurz = () => page.waitForTimeout(200);

  // --- Rückgängig: Ausgabe löschen und zurückholen ---
  await bereich(page, 'haushalt'); await page.click('#v-haushalt [data-fold="ausgaben"]');   // Ausgaben aufklappen
  const liste = () => text(page, '#v-haushalt [data-m="tx"]');   // die Liste zeigt nur die neuesten Buchungen, deshalb zählt ihr Text, nicht ihre Länge
  const vorher = await roh(), zeilen = await liste();
  await page.click('#v-haushalt [data-m="tx"]'); await page.click('#m-del'); await kurz();
  P.ok('Ausgabe gelöscht: die Liste ist eine andere', (await liste()) !== zeilen && (await roh()) !== vorher);
  P.ok('Hinweis „Gelöscht · Rückgängig“ erscheint', (await hinweis()) === 'Gelöscht Rückgängig', await hinweis());
  await page.click('#toast button'); await kurz();
  P.ok('Rückgängig: Daten sind wieder genau wie vorher', (await roh()) === vorher);
  P.ok('die Liste ist wieder die alte, der Hinweis weg', (await liste()) === zeilen && (await hinweis()) === '');

  // --- Eine weitere Änderung nimmt den Hinweis weg (Rückgängig darf nichts Neueres überschreiben) ---
  await page.click('#v-haushalt [data-m="tx"]'); await page.click('#m-del'); await kurz();
  P.ok('wieder gelöscht: Hinweis da', (await hinweis()) !== '');
  await page.click('#v-haushalt [data-m="add"]'); await page.fill('#m-amt', '5'); await page.click('#m-save'); await kurz();
  P.ok('nach einer neuen Ausgabe ist der Hinweis weg', (await hinweis()) === '');

  // --- Training verwerfen und zurückholen ---
  await bereich(page, 'training'); await page.click('#v-training .subtabs [data-v="kraft"]'); await page.click('#v-training .row .go'); await kurz();
  await page.click('#l-del'); await page.click('#l-del'); await kurz();
  P.ok('Training verworfen: Hinweis nennt es', (await hinweis()) === 'Training verworfen Rückgängig', await hinweis());
  await page.click('#toast button'); await kurz();
  P.ok('Rückgängig: das Training läuft wieder', !!(await gespeichert(page)).K.live && !!(await page.$('#v-training .lv-card-t')));
  await page.click('#v-training [data-k="live"]'); await kurz(); await page.click('#l-del'); await page.click('#l-del'); await page.waitForTimeout(7600);
  P.ok('ohne Tipp verschwindet der Hinweis nach einigen Sekunden', (await hinweis()) === '');

  // --- Eigene Kategorie ---
  await bereich(page, 'haushalt'); await page.click('#v-haushalt [data-m="add"]');
  await page.click('#m-cat [data-c="__more"]'); await page.click('#m-cat [data-c="__new"]');
  await page.fill('#m-catnew', 'Haustier'); await page.click('#m-catnew-add');
  P.ok('neue Kategorie ist angelegt und gewählt', (await text(page, '#m-cat [aria-pressed="true"]')) === 'Haustier');
  await page.fill('#m-amt', '20'); await page.fill('#m-note', 'Futter'); await page.click('#m-save'); await kurz();
  await page.click('#v-haushalt [data-fold="ausgaben"]');   // nach dem Wechsel des Bereichs ist die Liste wieder zu
  P.enthaelt('Buchung trägt die Kategorie', await text(page, '#v-haushalt [data-m="tx"]'), ['Haustier · Futter']);
  P.enthaelt('sie steht bei den flexiblen Kosten', await text(page, '#v-haushalt'), ['Haustier 20,00 €']);
  await page.click('#v-haushalt [data-m="add"]'); await page.click('#m-cat [data-c="__more"]'); await page.click('#m-cat [data-c="__new"]');
  await page.fill('#m-catnew', 'haustier'); await page.click('#m-catnew-add');
  P.enthaelt('doppelter Name wird abgelehnt', await text(page, '#m-err'), ['gibt es schon']);
  await page.fill('#m-catnew', '<i>Kur'); await page.click('#m-catnew-add');
  P.ok('Sonderzeichen im Namen werden als Text gezeigt', (await text(page, '#m-cat [aria-pressed="true"]')) === '<i>Kur');
  await page.click('#ms-close');
  await page.reload(); await page.waitForTimeout(300);
  const cats = async () => Object.values((await gespeichert(page)).MF.cats || {}).filter(Boolean).map(c => c.n).sort().join(',');
  P.ok('nach dem Neuladen: benutzte Kategorie bleibt, unbenutzte ist weg', (await cats()) === 'Haustier', await cats());
  await bereich(page, 'haushalt'); await page.click('#v-haushalt [data-fold="ausgaben"]');
  await page.click('#v-haushalt [data-m="tx"]:has-text("Futter")'); await page.click('#m-del'); await kurz();
  await page.reload(); await page.waitForTimeout(300);
  P.ok('letzte Buchung gelöscht: Kategorie verschwindet von selbst', (await cats()) === '', await cats());
  await P.ende(browser, fehler);
});
