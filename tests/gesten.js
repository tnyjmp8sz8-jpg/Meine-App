// Wischgesten und Graphen: Blatt nach unten wegziehen, zwischen Monaten wischen, Wert im Graphen ablesen.
// Die Berührungen sind echte Touch-Ereignisse des Test-Browsers. Ob es sich auf dem iPhone gut anfühlt, zeigt das nicht.
const { oeffnen, text, bereich, wischen, pruefer, lauf, monat } = require('./lib');
const { beispiel } = require('./daten');

const MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const name = ym => MON[+ym.slice(5) - 1] + ' ' + ym.slice(0, 4);

lauf(async () => {
  const P = pruefer('Gesten'), { browser, ctx, page, fehler } = await oeffnen({ finger: true, daten: beispiel() });
  const titel = () => text(page, '#v-haushalt .mnav b');
  const offen = sel => page.evaluate(q => document.querySelector(q).open, sel);

  // --- Zwischen Monaten wischen (Budget) ---
  await bereich(page, 'haushalt'); await page.click('#v-haushalt [data-m="sub"][data-v="budget"]');
  P.ok('Start: laufender Monat', (await titel()) === name(monat(0)));
  await wischen(ctx, page, 300, 500, 80, 505);
  P.ok('nach links im laufenden Monat: bleibt (kein Monat in der Zukunft)', (await titel()) === name(monat(0)));
  await wischen(ctx, page, 80, 500, 300, 505);
  P.ok('nach rechts: Vormonat', (await titel()) === name(monat(1)));
  await wischen(ctx, page, 300, 500, 80, 505);
  P.ok('nach links: wieder der laufende Monat', (await titel()) === name(monat(0)));
  await wischen(ctx, page, 200, 300, 215, 600);
  P.ok('senkrecht scrollen wechselt den Monat nicht', (await titel()) === name(monat(0)));
  await wischen(ctx, page, 5, 500, 250, 505);
  P.ok('vom linken Rand: wechselt nicht (dort wischt iOS zurück)', (await titel()) === name(monat(0)));
  await page.evaluate(() => { document.querySelector('#scroll').scrollTop = 0; });

  // --- Blatt nach unten wegziehen ---
  await page.click('#v-haushalt [data-m="add"]'); await page.waitForTimeout(400);
  const oben = await page.evaluate(() => Math.round(document.querySelector('#msheet').getBoundingClientRect().top));
  await wischen(ctx, page, 195, oben + 30, 197, oben + 70, 400);
  P.ok('kurzer, langsamer Zug: Blatt bleibt offen', await offen('#msheet'));
  P.ok('und steht wieder an seinem Platz', (await page.evaluate(() => Math.round(document.querySelector('#msheet').getBoundingClientRect().top))) === oben);
  await wischen(ctx, page, 195, oben + 30, 197, oben + 330, 200);
  P.ok('langer Zug nach unten: Blatt ist zu', !(await offen('#msheet')));
  await page.click('#v-haushalt [data-m="add"]'); await page.waitForTimeout(400);
  P.ok('Blatt öffnet danach wieder normal', (await offen('#msheet')) && (await page.evaluate(() => Math.round(document.querySelector('#msheet').getBoundingClientRect().top))) === oben);
  await wischen(ctx, page, 195, oben + 300, 197, oben + 100, 200);
  P.ok('Zug nach oben schließt nicht', await offen('#msheet'));
  await page.click('#ms-close');

  // Im gescrollten Blatt scrollt der Zug nach unten, er schließt nicht (Blatt der Übung ist lang)
  await bereich(page, 'training'); await page.click('#v-training .subtabs button:nth-child(2)'); await page.click('#v-training [data-k="exs"]'); await page.click('#v-training [data-k="ex"]'); await page.waitForTimeout(400);
  await page.evaluate(() => { document.querySelector('#xsheet').scrollTop = 200; });
  await wischen(ctx, page, 195, 300, 197, 640, 200);
  P.ok('gescrolltes Blatt: Zug nach unten schließt nicht', await offen('#xsheet'));
  await page.evaluate(() => document.querySelector('#xsheet').close());

  // --- Graph ablesen (Gewicht) ---
  await bereich(page, 'gewicht'); await page.waitForTimeout(300);
  const g = await page.evaluate(() => { const r = document.querySelector('#v-gewicht svg.scrub').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await page.touchscreen.tap(g.x + g.w * 0.3, g.y + g.h * 0.5); await page.waitForTimeout(150);
  const schild = await page.evaluate(() => (document.querySelector('#v-gewicht .g-scrub text') || {}).textContent || '');
  P.ok('Tipp in den Graphen zeigt Datum, Gewicht und Schnitt', /kg · Schnitt \d/.test(schild), schild);
  const imBild = await page.evaluate(() => { const s = document.querySelector('#v-gewicht svg.scrub').getBoundingClientRect(), r = document.querySelector('#v-gewicht .g-scrub rect').getBoundingClientRect(); return r.left >= s.left - 1 && r.right <= s.right + 1; });
  P.ok('das Schild liegt ganz im Graphen', imBild);
  await page.touchscreen.tap(g.x + 3, g.y + g.h * 0.5); await page.waitForTimeout(150);
  P.ok('am linken Rand: Schild bleibt im Bild', await page.evaluate(() => { const s = document.querySelector('#v-gewicht svg.scrub').getBoundingClientRect(), r = document.querySelector('#v-gewicht .g-scrub rect').getBoundingClientRect(); return r.left >= s.left - 1; }));
  await page.touchscreen.tap(195, g.y - 60); await page.waitForTimeout(150);
  P.ok('Tipp daneben blendet es aus', !(await page.$('.g-scrub')));

  // Balken (Finanzen, Jahr) und Linie (Vermögen)
  await bereich(page, 'haushalt'); await page.click('#v-haushalt [data-m="mode"][data-v="year"]'); await page.waitForTimeout(200);
  const balken = await page.evaluate(() => JSON.parse(document.querySelector('#v-haushalt svg.scrub').dataset.pts).map(p => p[2]).join(' | '));
  P.ok('Balken tragen Monat und Betrag', /[A-Z][a-zä]+ · [+−][\d.]+ €/.test(balken), balken);
  await page.click('#v-haushalt [data-m="mode"][data-v="month"]');
  await P.ende(browser, fehler);
});
