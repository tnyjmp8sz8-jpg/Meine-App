// Gym: Recap für Monat und Jahr, Verbesserung gesamt und je Übung, laufendes Training mit „Letztes Mal“.
// Kleiner, von Hand nachgerechneter Datensatz: eine Übung, fünf Einheiten im Vormonat, eine heute.
const { oeffnen, text, bereich, gespeichert, pruefer, lauf, tag, monat, nachOben } = require('./lib');

lauf(async () => {
  const P = pruefer('Gym'), vm = monat(1), heute = tag();
  /* Vormonat: 35×10, 37,5×10, 40×8, 40×10, 40×10. Geschätztes Maximum = Gewicht × (1 + Wdh/30):
     erste Einheit 46,67 kg, beste 53,33 kg → +14,3 %. Heute 44×10 = 58,67 kg → +10,0 % gegenüber dem Vormonat. */
  const K = { ex: { a: { n: 'Rudern' } }, log: {}, plans: { p: { n: 'Torso', items: [{ id: 'a', sets: 3 }] } }, meta: {}, live: null };
  [['05', 35, 10], ['10', 37.5, 10], ['15', 40, 8], ['20', 40, 10], ['25', 40, 10]].forEach(([t, kg, w]) => { K.log[vm + '-' + t] = { a: [[kg, w], [kg, w], [kg, w]] }; K.meta[vm + '-' + t] = { dur: 1800, plan: 'p' }; });
  K.log[heute] = { a: [[44, 10], [44, 9], [44, 8]] }; K.meta[heute] = { dur: 2400, plan: 'p' };
  const { browser, page, fehler } = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K } });
  const gym = () => text(page, '#v-training .mnav b, #v-training .hero h1, #v-training .figs .fig');

  await bereich(page, 'training'); await page.click('#v-training .subtabs button:nth-child(2)');
  P.enthaelt('laufender Monat: 1 Einheit, Verbesserung +10,0 %', await gym(), ['1 Einheit', '+10,0 %']);
  P.enthaelt('bewegtes Gewicht 44 × 27 = 1.188 kg, Zeit 0:40 h', await gym(), ['1,2', '0:40 h']);
  await page.click('#v-training [data-k="exs"]');
  P.enthaelt('Übungsliste zeigt die Verbesserung im Monat', await text(page, '#v-training [data-k="ex"]'), ['Rudern', '+10,0 %']);
  await page.click('#v-training [data-k="units"]');
  P.ok('Einheiten klappen auf: eine in diesem Monat', (await page.$$('#v-training [data-k="day"]')).length === 1);

  await nachOben(page); await page.click('#v-training .mnav button:first-child');
  P.enthaelt('Vormonat: 5 Einheiten, +14,3 % (erster Monat: gegenüber der ersten Einheit)', await gym(), ['5 Einheiten', '+14,3 %']);
  P.ok('Einheiten des Vormonats: fünf', (await page.$$('#v-training [data-k="day"]')).length === 5);
  await page.click('#v-training [data-t="mode"][data-v="year"]');
  await page.click('#v-training [data-t="fold"][data-v="kmons"]');
  P.ok('Jahresansicht mit Monaten zum Antippen', (await page.$$('#v-training [data-t="goto"]')).length >= 1);
  await page.click('#v-training [data-t="mode"][data-v="month"]');

  // Blatt der Übung aus der Liste: Recap startet beim gewählten Monat
  await page.click('#v-training [data-k="ex"]'); await page.waitForTimeout(250);
  P.enthaelt('Blatt der Übung: Höchstgewicht 44, bestes Maximum 58,7, 6 Einheiten', await text(page, '#x-stats .fig'), ['44', '58,7', '6']);
  P.enthaelt('Recap der Übung im Vormonat: +14,3 %, 53,3 kg, 5 Einheiten', await text(page, '#x-recap .figs .fig'), ['+14,3 %', '53,3', '5']);
  P.ok('Einheiten des Monats als Karten', (await page.$$('#x-recap .lastx')).length === 5);
  P.ok('aus der Liste geöffnet: Umbenennen und Löschen sichtbar', await page.isVisible('#x-name') && await page.isVisible('#x-del'));
  await page.click('#x-recap .mnav button:last-child');
  P.enthaelt('Recap blättert zum laufenden Monat: +10,0 %', await text(page, '#x-recap .figs .fig'), ['+10,0 %', '58,7']);
  await page.click('#x-recap [data-xr="year"]');
  P.ok('Recap im Jahr zeigt Monate', (await page.$$('#x-recap [data-xr="goto"]')).length >= 1);
  await page.click('#xs-close');

  // Laufendes Training: „Letztes Mal“ zählt auch die Einheit von heute
  await page.click('#v-training .row .go'); await page.waitForTimeout(300);
  P.enthaelt('„Letztes Mal“ zeigt die Einheit von heute', await text(page, '#l-items .lastx .note'), ['Letztes Mal', 'Heute', 'Torso']);
  P.ok('drei Kennzahlen unter „Letztes Mal“', (await page.$$('#l-items .fig')).length === 3);
  P.ok('Fokus liegt auf dem Blatt, nicht auf einem Knopf', await page.evaluate(() => document.activeElement.tagName === 'DIALOG'));
  await page.click('#l-items .lastx'); await page.waitForTimeout(250);
  P.ok('Tipp auf „Letztes Mal“ öffnet die Übung nur zum Ansehen', (await text(page, '#xs-title')) === 'Rudern' && !(await page.isVisible('#x-name')));
  await page.click('#xs-close');
  P.ok('Training bleibt dahinter offen', await page.evaluate(() => document.querySelector('#lsheet').open));
  await page.fill('#l-w', '45'); await page.click('.lt-r .chk'); await page.click('#l-save'); await page.waitForTimeout(200);
  const d = await gespeichert(page);
  P.ok('Training gespeichert: ein Satz mit 45 kg', !d.K.live && d.K.log[heute].a.length === 1 && d.K.log[heute].a[0][0] === 45, JSON.stringify(d.K.log[heute]));
  await P.ende(browser, fehler);
});
