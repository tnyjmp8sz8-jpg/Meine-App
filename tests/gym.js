// Gym: Recap für Monat und Jahr, Verbesserung gesamt und je Übung, laufendes Training mit „Letztes Mal“.
// Kleiner, von Hand nachgerechneter Datensatz: eine Übung, fünf Einheiten im Vormonat, eine heute.
const { oeffnen, text, bereich, gespeichert, pruefer, lauf, tag, monat, nachOben, zahlWahl } = require('./lib');

lauf(async () => {
  const P = pruefer('Gym'), vm = monat(1), heute = tag();
  /* Vormonat: 35×10, 37,5×10, 40×8, 40×10, 40×10. Geschätztes Maximum = Gewicht × (1 + Wdh/30):
     erste Einheit 46,67 kg, beste 53,33 kg → +14,3 %. Heute 44×10 = 58,67 kg → +10,0 % gegenüber dem Vormonat. */
  const K = { ex: { a: { n: 'Rudern' } }, log: {}, plans: { p: { n: 'Torso', items: [{ id: 'a', sets: 3 }] } }, meta: {}, live: null };
  /* Dauer und Plan (K.meta), gebraucht für die Prüfungen zum Verschieben: Die Einheit vom 5. ist von Hand eingetragen (keine Angaben), die vom 15. dauerte 25 Minuten,
     die übrigen 30. Am 27. liegen Angaben ohne Einheit, wie sie der Fehler vor dieser Korrektur hinterließ. */
  [['05', 35, 10], ['10', 37.5, 10], ['15', 40, 8], ['20', 40, 10], ['25', 40, 10]].forEach(([t, kg, w]) => { K.log[vm + '-' + t] = { a: [[kg, w], [kg, w], [kg, w]] }; if (t !== '05') K.meta[vm + '-' + t] = { dur: t === '15' ? 1500 : 1800, plan: 'p' }; });
  K.meta[vm + '-27'] = { dur: 999, plan: 'p' };
  K.log[heute] = { a: [[44, 10], [44, 9], [44, 8]] }; K.meta[heute] = { dur: 2400, plan: 'p' };
  const { browser, page, fehler } = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K } });
  const gym = () => text(page, '#v-training .mnav b, #v-training .hero h1, #v-training .figs .fig');

  await bereich(page, 'training'); await page.click('#v-training .subtabs [data-v="kraft"]');
  P.enthaelt('laufender Monat: 1 Einheit, Verbesserung +10,0 %', await gym(), ['1 Einheit', '+10,0 %']);
  // Sätze besser: heute 44×10, 44×9, 44×8 gegen 40×10 je Satz beim letzten Mal = alle drei mit mehr Gewicht
  P.enthaelt('3 Sätze besser, Zeit 0:40 h', await gym(), ['3 Sätze besser', '0:40 h']);
  P.ok('„bewegt“ gibt es nicht mehr', !(await gym()).includes('bewegt'));
  // Pläne: Bei nur einem Plan ist jede Runde sofort voll, er ist also immer als Nächstes dran (blauer Kreis, kein Haken, keine Zählung)
  P.ok('ein einziger Plan: immer dran, kein Haken', (await page.$$('#v-training .rows.one .row.is-idle')).length === 1 && !(await page.$('#v-training .rows.one .row.is-done')) && !(await text(page, '#v-training h2.sec')).includes(' von '), await text(page, '#v-training h2.sec'));
  await page.click('#v-training [data-fold="uebungen"]');
  P.enthaelt('Übungsliste zeigt die Verbesserung im Monat', await text(page, '#v-training [data-k="ex"]'), ['Rudern', '+10,0 %']);
  await page.click('#v-training [data-fold="einheiten"]');
  P.ok('Einheiten klappen auf: eine in diesem Monat', (await page.$$('#v-training [data-k="day"]')).length === 1);

  await nachOben(page); await page.click('#v-training .mnav button:first-child');
  P.enthaelt('Vormonat: 5 Einheiten, +14,3 % (erster Monat: gegenüber der ersten Einheit)', await gym(), ['5 Einheiten', '+14,3 %']);
  // Sätze besser im Vormonat: 5. erste Einheit (kein Vergleich), 10. mehr Gewicht (3), 15. mehr Gewicht (3), 20. mehr Wiederholungen (3), 25. gleich (0) = 9
  P.enthaelt('Vormonat: 9 Sätze besser', await gym(), ['9 Sätze besser']);
  P.ok('Einheiten des Vormonats: fünf', (await page.$$('#v-training [data-k="day"]')).length === 5);

  // --- Einheit verschieben oder löschen: Dauer und Plan gehen mit ---
  const am = t => vm + '-' + t, zeile = t => text(page, '#v-training [data-k="day"][data-d="' + am(t) + '"]'), meta = async () => (await gespeichert(page)).K.meta;
  const verschieben = async (von, nach) => { await page.click('#v-training [data-k="day"][data-d="' + am(von) + '"]'); await page.fill('#k-date', am(nach)); await page.click('#k-save'); await page.waitForTimeout(200); };
  // Trainingszeit im Vormonat: 30 + 25 + 30 + 30 = 115 min = 1:55 h (die Einheit vom 5. hat keine Dauer)
  P.enthaelt('Trainingszeit im Vormonat: 1:55 h', await gym(), ['1:55 h']);
  await verschieben('25', '26');
  let m = await meta();
  P.ok('verschoben vom 25. auf den 26.: Dauer und Plan stehen am neuen Tag, am alten nichts mehr', !m[am('25')] && !!m[am('26')] && m[am('26')].dur === 1800 && m[am('26')].plan === 'p', JSON.stringify(m));
  P.enthaelt('Zeile am 26. nennt weiter Plan und Dauer', await zeile('26'), ['Torso', '30 min']);
  P.enthaelt('Trainingszeit bleibt 1:55 h', await gym(), ['5 Einheiten', '1:55 h']);
  // Löschen nimmt die Angaben mit: 115 − 30 = 85 min = 1:25 h. „Rückgängig“ holt beides zurück.
  await page.click('#v-training [data-k="day"][data-d="' + am('26') + '"]'); await page.click('#k-del'); await page.waitForTimeout(200);
  m = await meta();
  P.ok('gelöscht: keine Angaben mehr am 26.', !m[am('26')] && !((await gespeichert(page)).K.log[am('26')] || {}).a, JSON.stringify(m));
  P.enthaelt('nach dem Löschen: 4 Einheiten, 1:25 h', await gym(), ['4 Einheiten', '1:25 h']);
  await page.click('#toast button'); await page.waitForTimeout(200);
  P.enthaelt('Rückgängig: wieder 5 Einheiten, 1:55 h', await gym(), ['5 Einheiten', '1:55 h']);
  await page.click('#v-training [data-t="mode"][data-v="year"]');
  await page.click('#v-training [data-fold="gymMonate"]');
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
  await zahlWahl(page, '#l-w', '45'); await page.click('.lt-r .chk'); await page.click('#l-save'); await page.waitForTimeout(200); await page.click('#rs-ok');
  const d = await gespeichert(page);
  P.ok('Training gespeichert: ein Satz mit 45 kg', !d.K.live && d.K.log[heute].a.length === 1 && d.K.log[heute].a[0][0] === 45, JSON.stringify(d.K.log[heute]));

  // --- Verschieben auf besondere Tage (zum Schluss, weil sich dabei die Einheiten des Vormonats ändern; der Bereich zeigt noch den Vormonat) ---
  await nachOben(page);
  if (!(await page.$('#v-training [data-k="day"]'))) await page.click('#v-training [data-fold="einheiten"]');
  // Die Einheit vom 5. hat keine Angaben. Am 27. liegen alte Angaben ohne Einheit: Sie dürfen sich nicht an die verschobene Einheit hängen.
  await verschieben('05', '27');
  m = await meta();
  P.ok('Einheit ohne Angaben auf einen Tag mit alten Angaben: Die alten sind weg', !m[am('27')] && !m[am('05')], JSON.stringify(m));
  P.ok('ihre Zeile zeigt weder Plan noch Dauer', (await zeile('27')).includes('1 Übung') && !(await zeile('27')).includes('Torso'), await zeile('27'));
  // Auf einen Tag, an dem schon eine Einheit steht (15., 25 min): Sie behält ihre eigenen Angaben, die der verschobenen (20., 30 min) entfallen.
  await verschieben('20', '15');
  m = await meta();
  P.ok('auf einen Tag mit Einheit verschoben: deren Angaben bleiben (25 min)', !m[am('20')] && !!m[am('15')] && m[am('15')].dur === 1500, JSON.stringify(m));
  // Trainingszeit jetzt: 10. (30) + 15. (25) + 26. (30) = 85 min = 1:25 h in 4 Einheiten (10., 15., 26., 27.)
  P.enthaelt('danach: 4 Einheiten, 1:25 h', await gym(), ['4 Einheiten', '1:25 h']);
  await browser.close();

  // --- Woche auf Heute: Gym wird erst ab der ersten Einheit gezeigt und verglichen ---
  // Einheiten heute, vor 14 und vor 21 Tagen (die erste überhaupt). Wochen von heute zurück: 1, 0, 1, 1 Einheiten, davor gab es kein Gym.
  const K2 = { ex: { a: { n: 'Rudern' } }, log: {}, plans: {}, meta: {}, live: null };
  [0, 14, 21].forEach(n => { K2.log[tag(n)] = { a: [[40, 10]] }; });
  const w = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: K2 } });
  const woche = async () => (await text(w.page, '#v-heute .kv')) || (await text(w.page, '#v-heute .note'));
  const zurueck = async () => { await w.page.click('#v-heute .mnav [data-m="prev"]'); await w.page.waitForTimeout(150); };
  await w.page.click('#v-heute [data-h="mode"][data-v="week"]'); await w.page.waitForTimeout(150);
  P.ok('diese Woche: 1 Einheit, +1 (die Woche davor hatte keine)', (await woche()) === 'Gym 1Einheit +1', await woche());
  await zurueck();
  P.ok('Woche davor: 0 Einheiten, −1', (await woche()) === 'Gym 0Einheiten −1', await woche());
  await zurueck();
  P.ok('zwei Wochen zurück: 1 Einheit, gleich', (await woche()) === 'Gym 1Einheit gleich', await woche());
  await zurueck();
  P.ok('Woche der ersten Einheit: 1 Einheit, kein Vergleich', (await woche()) === 'Gym 1Einheit', await woche());
  await zurueck();
  P.ok('vor der ersten Einheit: keine Zeile „Gym“', !(await woche()).includes('Gym') && (await woche()).includes('Für diese Woche gibt es noch keine Einträge.'), await woche());
  await w.browser.close();

  // --- Punkt (Trend), Vorgabe, Rekord und „Zahl wählen“ (v85) ---
  /* Sechs Einheiten je Übung, vor 20, 17, 14, 11, 8 und 5 Tagen, je ein Satz mit 10 Wiederholungen. Geschätztes Maximum = kg × (1 + 10/30) = kg × 4/3.
     Verglichen wird der mittlere Wert (Median) der letzten drei Einheiten mit dem der drei davor:
     Steht:  50, 50, 50 | 50, 50, 40 → 66,67 gegen 66,67 = gleich → gelb, obwohl die letzte Einheit 20 % schlechter war (ein Ausreißer zählt nicht).
     Fällt:  60, 60, 60 | 55, 55, 60 → 73,33 gegen 80 = −8,3 % → rot (zwei von drei schlechter).
     Steigt: 40, 40, 40 | 44, 44, 40 → 58,67 gegen 53,33 = +10,0 % → grün.
     Neu:    drei Einheiten → kein Punkt. Voll und Stufen: je eine Einheit → kein Punkt.
     Vorgabe (Ziel 10 Wdh): „Voll“ zuletzt 40×10, 40×10, 40×10 → alle am Ziel, Schritt 2,5 kg: 42,5 kg mit (53,33 / 42,5 − 1) × 30 = 7,6 → 7 Wdh; 1RM 42,5 × (1 + 7/30) = 52,4.
     „Stufen“ zuletzt 55×5, 50×7, 50×6 → je eine Wiederholung mehr: 55×6, 50×8, 50×7. */
  const K3 = { ex: { s: { n: 'Steht' }, f: { n: 'Fällt' }, g: { n: 'Steigt' }, n: { n: 'Neu' }, v: { n: 'Voll' }, u: { n: 'Stufen' } }, log: {},
    plans: { p: { n: 'Probe', items: [{ id: 'v', sets: 3 }, { id: 'u', sets: 3 }] }, q: { n: 'Zweiter', items: [{ id: 's', sets: 1 }] } }, meta: {}, live: null };
  const reihen = { s: [50, 50, 50, 50, 50, 40], f: [60, 60, 60, 55, 55, 60], g: [40, 40, 40, 44, 44, 40] };
  [20, 17, 14, 11, 8, 5].forEach((n, i) => { const d = K3.log[tag(n)] = {}; for (const id in reihen) d[id] = [[reihen[id][i], 10]]; if (i > 2) d.n = [[20, 10]]; });
  K3.log[tag(5)].v = [[40, 10], [40, 10], [40, 10]]; K3.log[tag(5)].u = [[55, 5], [50, 7], [50, 6]];
  // Körpergewicht: am 10. des Vormonats 90,0 kg, heute 91,2 kg (mehr als 6 Tage Abstand, der Schnitt von heute ist also 91,2) → im laufenden Monat +1,2 kg
  const g = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: K3, W: { entries: { [vm + '-10']: 90, [heute]: 91.2 } } } }), q = g.page;
  await bereich(q, 'training'); await q.click('#v-training .subtabs [data-v="kraft"]'); await q.click('#v-training [data-fold="uebungen"]');
  const punkte = await q.$$eval('#v-training [data-k="ex"]', l => l.map(b => b.querySelector('.l > span').textContent + ':' + ((b.querySelector('.td') || {}).className || 'ohne')).sort().join(' '));
  P.ok('Punkte in der Übungsliste: fällt rot, steht gelb (trotz einer schlechten Einheit), steigt grün, unter vier Einheiten keiner', punkte === 'Fällt:td down Neu:ohne Steht:td flat Steigt:td up Stufen:ohne Voll:ohne', punkte);
  const farbe = await q.evaluate(() => { const f = c => getComputedStyle(document.querySelector('#v-training .td' + c)).backgroundColor; return [f('.up'), f('.flat'), f('.down')]; });
  P.ok('drei verschiedene Farben', new Set(farbe).size === 3, farbe.join(' · '));
  const trend = async name => { await q.click('#v-training [data-k="ex"]:has-text("' + name + '")'); await q.waitForTimeout(150); const t = await text(q, '#x-stats .trend'); await q.click('#xs-close'); return t; };
  const tr = [await trend('Steigt'), await trend('Fällt'), await trend('Steht'), await trend('Neu')];
  P.ok('Blatt der Übung nennt den Trend: „Steigt +10,0 %“, „Fällt −8,3 %“, „Steht“, bei drei Einheiten nichts', tr.join('|') === 'Steigt +10,0 %|Fällt −8,3 %|Steht|', tr.join('|'));

  await q.click('#v-training [data-k="start"][aria-label^="Probe"]'); await q.waitForTimeout(300);
  const saetze = () => q.$$eval('#l-items .lx > .lt .lt-r', l => l.map(z => [z.children[1], z.children[2]].map(c => c.firstChild ? c.firstChild.textContent : '').join('×')).join(' '));
  P.ok('Vorgabe, alle Sätze am Ziel: ein Schritt mehr Gewicht mit 7 Wiederholungen', (await saetze()) === '42,5×7 42,5×7 42,5×7', await saetze());
  P.ok('Spalte 1RM: 52,4 je Satz', (await text(q, '#l-items .lx > .lt .rm')) === '52,4 | 52,4 | 52,4', await text(q, '#l-items .lx > .lt .rm'));
  P.ok('keine Eingabefelder mehr bei den Sätzen: Die Tastatur des iPhones bleibt zu', await q.evaluate(() => !document.querySelector('#l-items input, #zsheet input')));
  await q.click('#l-tabs .lx-tab:has-text("Stufen")');
  P.ok('Vorgabe unter dem Ziel: je Satz eine Wiederholung mehr bei gleichem Gewicht', (await saetze()) === '55×6 50×8 50×7', await saetze());
  await q.click('#l-tabs .lx-tab:has-text("Voll")');
  // Ziel 12 statt 10: 40×10 liegt jetzt unter dem Ziel → 40×11. Das Ziel steht an der Übung (K.ex.v.z).
  await zahlWahl(q, '#l-items [data-la="ziel"]', '12');
  P.ok('neues Ziel 12: offene Sätze bekommen die passende Vorgabe (40×11), das Ziel ist gespeichert', (await saetze()) === '40×11 40×11 40×11' && (await gespeichert(q)).K.ex.v.z === 12 && (await text(q, '#l-items [data-la="ziel"]')) === 'Ziel 12 Wdh', await saetze());
  // Zahl wählen: Liste mit den Werten in der Nähe, der jetzige ist markiert; ein Tipp übernimmt. Das neue Gewicht gilt auch für die offenen Sätze danach mit demselben Gewicht.
  await q.click('#l-w');
  const zs = await q.evaluate(() => ({ offen: document.querySelector('#zsheet').open, wahl: (document.querySelector('#z-list [aria-pressed="true"]') || {}).textContent, komma: !document.querySelector('#z-komma').disabled, aus: document.querySelector('#z-out').textContent }));
  P.ok('Tipp aufs Gewicht öffnet „Zahl wählen“: 40 kg markiert, Komma erlaubt', zs.offen && zs.wahl === '40 kg' && zs.komma && zs.aus === '40', JSON.stringify(zs));
  await q.click('#z-list [data-zv="45"]'); await q.waitForTimeout(80);
  P.ok('Tipp auf „45 kg“ übernimmt sofort, auch für die Sätze danach', (await saetze()) === '45×11 45×11 45×11' && !(await q.evaluate(() => document.querySelector('#zsheet').open)), await saetze());
  await q.click('#l-r');
  const ohneKomma = await q.evaluate(() => document.querySelector('#z-komma').disabled);
  await q.click('#z-x'); await q.click('#l-r'); await q.click('#z-ok');
  P.ok('Wiederholungen ohne Komma; „Abbrechen“ und der Haken ohne Eingabe ändern nichts', ohneKomma && (await saetze()) === '45×11 45×11 45×11', await saetze());
  // Tasten: 1, 2, löschen, 0 → „10“
  await q.click('#l-r'); for (const t of ['1', '2', 'x', '0']) await q.click('#z-pad [data-z="' + t + '"]');
  const getippt = await text(q, '#z-out'); await q.click('#z-ok'); await q.waitForTimeout(80);
  P.ok('eigene Tasten: 1, 2, löschen, 0 ergibt 10; nur dieser Satz ändert sich', getippt === '10' && (await saetze()) === '45×10 45×11 45×11', getippt + ' · ' + await saetze());
  // Rekord: 45 × (1 + 10/30) = 60 liegt über dem bisherigen Besten 40 × 4/3 = 53,33
  await q.click('#l-items .chk'); await q.waitForTimeout(80);
  const rek = async () => [await text(q, '#l-items .rek-l'), await text(q, '#l-items .rm.rek')].join('|');
  P.ok('Satz über dem Bestwert: „Neuer Rekord · 1RM 60 kg“, der Wert des Satzes ist grün', (await rek()) === 'Neuer Rekord · 1RM 60 kg|60', await rek());
  await q.click('#l-items .lt-r[data-s="0"]'); await q.click('#l-items .chk'); await q.waitForTimeout(80);
  P.ok('Satz zurückgenommen: kein Rekord mehr', (await rek()) === '|', await rek());
  await q.click('#l-items .chk'); await q.click('#l-save'); await q.waitForTimeout(200);
  // Rückblick: ein Satz gespeichert (45×10), besser als Satz 1 vom letzten Mal (40×10) und ein Rekord; unter einer Minute gibt es keine Kachel „Dauer“
  const rb = [await q.evaluate(() => document.querySelector('#rsheet').open && !document.querySelector('#lsheet').open), await text(q, '#rs-title'), await text(q, '#rs-body .fig'), await text(q, '#rs-body [data-rs]')];
  P.ok('nach dem Speichern: Rückblick mit „1 von 1 Satz besser“, „1 Rekord“ und der Übung', rb[0] === true && rb[1] === 'Probe' && rb[2] === '1von 1 Satz besser | 1 Rekord' && rb[3] === 'Voll 45 kg × 10 1 besser Rekord', JSON.stringify(rb));
  await q.click('#rs-body [data-rs]'); await q.waitForTimeout(150);
  P.ok('Tipp auf die Übung im Rückblick zeigt ihren Verlauf', (await text(q, '#xs-title')) === 'Voll' && !(await q.isVisible('#x-name')));
  await q.click('#xs-close'); await q.click('#rs-ok'); await q.waitForTimeout(100);
  P.ok('„Fertig“ schließt den Rückblick', !(await q.evaluate(() => document.querySelector('#rsheet').open)));
  P.ok('Gym steht vor Cardio und ist gewählt', (await q.$$eval('#v-training .subtabs button', l => l.map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join())) === 'Gym*,Cardio');
  await q.click('#v-training [data-fold="einheiten"]');
  P.enthaelt('Einheit von heute nennt den Rekord', await text(q, '#v-training [data-k="day"][data-d="' + heute + '"]'), ['Probe', '1 Rekord']);
  P.ok('Plan „Probe“ war heute dran: Haken, „1 von 2“, „Zweiter“ ist als Nächstes dran', (await q.$$('#v-training .rows.one .row.is-done')).length === 1 && (await text(q, '#v-training h2.sec')).includes('1 von 2') && (await text(q, '#v-training .rows.one .row.is-idle .name')) === 'Zweiter', await text(q, '#v-training h2.sec'));
  P.enthaelt('Körpergewicht im selben Monat: +1,2 kg', await text(q, '#v-training .kw'), ['Körpergewicht', '+1,2 kg']);
  // Blatt der Übung: Die Einheit von heute ist der Rekord, 60 / 53,33 − 1 = +12,5 %
  await q.click('#v-training [data-k="ex"]:has-text("Voll")'); await q.waitForTimeout(150);
  P.enthaelt('Blatt der Übung: „Rekord · +12,5 %“ an der Einheit von heute', await text(q, '#x-recap .lastx .note'), ['Rekord · +12,5 %']);
  await q.click('#xs-close'); await q.reload(); await q.waitForTimeout(300);
  P.ok('nach neuem Laden: Das Ziel 12 steht noch an der Übung', (await gespeichert(q)).K.ex.v.z === 12);
  await g.browser.close();

  // --- Reihenfolge der Pläne und Runde, Einlesen nach Namen (v87), Übernahme aus Alpha Progression (v88) ---
  /* Drei Pläne mit Platz 1 bis 3 (nach Namen stünde „Extremitäten“ vorn). Einheiten: vor 9 Tagen Torso B, vor 6 Tagen Torso A, vor 4 Tagen Extremitäten.
     Rückwärts gelesen: Extremitäten (Platz 2), Torso A (Platz 1), dann Torso B (Platz 3, steht nicht weiter vorn → gehört zur Runde davor).
     Laufende Runde: Torso A und Extremitäten erledigt, als Nächstes Torso B → „2 von 3“. */
  const K4 = { ex: { x: { n: 'Rudern' }, y: { n: 'Uralt' } }, log: { [tag(60)]: { y: [[30, 10]] } }, meta: {}, live: null,
    plans: { e: { n: 'Extremitäten', items: [{ id: 'x', sets: 1 }], o: 2 }, b: { n: 'Torso B', items: [{ id: 'x', sets: 1 }], o: 3 }, a: { n: 'Torso A', items: [{ id: 'x', sets: 1 }], o: 1 } } };
  [[9, 'b'], [6, 'a'], [4, 'e']].forEach(([n, pl]) => { K4.log[tag(n)] = { x: [[50, 10]] }; K4.meta[tag(n)] = { dur: 600, plan: pl }; });
  const r = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: K4 } }), s = r.page;
  await bereich(s, 'training');
  const plaene = () => s.$$eval('#v-training .rows.one .row', l => l.map(z => z.querySelector('.name').textContent + ':' + z.className.replace('row ', '') + ':' + z.querySelector('.glyph').textContent).join(' | '));
  P.ok('Pläne in ihrer Reihenfolge; Torso A und Extremitäten erledigt, Torso B als Nächstes', (await plaene()) === 'Torso A:is-done: | Extremitäten:is-done: | Torso B:is-idle:3' && (await text(s, '#v-training h2.sec')).includes('2 von 3'), await plaene());
  /* Übungen (v90): „Rudern“ war in den vier Wochen bis zur jüngsten Einheit dran (vor 4 Tagen), „Uralt“ zuletzt vor 60 Tagen → eigene Klappzeile „Ältere Übungen“ ganz unten.
     Ihre Zeilen entstehen erst beim Aufklappen. Kein Plan trägt mehr ein Play-Zeichen: Jeder Kreis ist ein Ring mit Haken oder Zahl. */
  const kl = async () => [await text(s, '#v-training [data-fold="uebungen"]'), await text(s, '#v-training [data-fold="uebungenAlt"]'), await text(s, '#v-training [data-k="ex"] .l > span')].join(' # ');
  const zuerst = await kl(); await s.click('#v-training [data-fold="uebungenAlt"]'); await s.waitForTimeout(100);
  P.ok('Übungen: nur die der letzten vier Wochen, die ältere in „Ältere Übungen“', zuerst === 'Übungen 1 # Ältere Übungen 1 # ' && (await kl()) === 'Übungen 1 # Ältere Übungen 1 # Uralt', zuerst + ' → ' + await kl());
  await s.click('#v-training [data-fold="uebungenAlt"]');
  P.ok('Pläne ohne Play-Zeichen: Ringe ohne Füllung', await s.evaluate(() => [...document.querySelectorAll('#v-training .rows.one .glyph')].every(g => !g.querySelector('path[d^="M5"]') && getComputedStyle(g).backgroundColor === 'rgba(0, 0, 0, 0)')));
  P.ok('schwarzer Grund, Blätter eine Stufe heller', await s.evaluate(() => getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)' && getComputedStyle(document.querySelector('#lsheet')).backgroundColor === 'rgb(28, 28, 30)'));
  // Torso B heute trainiert: Der letzte Plan der Reihe war dran → die Runde ist voll, eine neue beginnt: nichts erledigt, Torso A als Nächstes, die anderen tragen ihren Platz als Zahl
  await s.click('#v-training [data-k="start"][aria-label^="Torso B"]'); await s.waitForTimeout(250); await s.click('#l-items .chk'); await s.click('#l-save'); await s.waitForTimeout(200); await s.click('#rs-ok');
  P.ok('Runde voll: neue Runde, Torso A ist dran, Platz 2 und 3 als Zahl', (await plaene()) === 'Torso A:is-idle:1 | Extremitäten:is-wait:2 | Torso B:is-wait:3' && !(await text(s, '#v-training h2.sec')).includes(' von '), await plaene());
  // Neuer Plan: hängt sich hinten an (Platz 4), obwohl „Arme“ nach Namen vorn stünde. Mit vier Plänen ist die Runde wieder offen: Die drei anderen waren dran, „Arme“ kommt als Nächstes.
  await s.click('#v-training h2.sec [data-k="plan"]'); await s.fill('#p-name', 'Arme'); await s.fill('#p-new', 'Rudern'); await s.click('#p-new-add'); await s.click('#psheet button[type="submit"]'); await s.waitForTimeout(200);
  const neuerPlan = Object.values((await gespeichert(s)).K.plans).find(p => p && p.n === 'Arme');
  P.ok('neuer Plan steht hinten, trägt Platz 4 und ist als Nächstes dran', (await plaene()) === 'Torso A:is-done: | Extremitäten:is-done: | Torso B:is-done: | Arme:is-idle:4' && neuerPlan.o === 4, await plaene());

  /* Einlesen: Die Datei führt „RUDERN“ unter der Kennung q1 und einen Plan „Torso A“ unter pp. Beides gibt es schon (x, a): Die Einheit hängt sich an x, der Plan ersetzt a, nichts steht doppelt da.
     Ein Name mit 50 Zeichen bleibt ganz (bis v86 wurden Namen nach 40 abgeschnitten). */
  const lang = 'Rudern von unten mit Brustauflage mit Neutralgriff';
  const dateiK = { ex: { q1: { n: 'RUDERN' }, q2: { n: lang, z: 8 } }, log: { [tag(2)]: { q1: [[55, 9]], q2: [[30, 8]] } }, plans: { pp: { n: 'Torso A', items: [{ id: 'q1', sets: 2 }, { id: 'q2', sets: 3 }], o: 1 } }, meta: { [tag(2)]: { dur: 1200, plan: 'pp' } } };
  await bereich(s, 'heute'); await s.setInputFiles('#bk-file', { name: 'datei.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'takt', v: 1, K: dateiK })) }); await s.waitForTimeout(300);
  const nach = (await gespeichert(s)).K, namen = Object.values(nach.ex).filter(Boolean).map(e => e.n).sort().join(' | ');
  P.ok('gleicher Name ist dieselbe Übung: keine zweite „Rudern“, die Einheit hängt an der vorhandenen', namen === 'RUDERN | ' + lang + ' | Uralt' && !!nach.log[tag(2)].x && !nach.log[tag(2)].q1 && nach.ex.q2.z === 8, namen + ' · ' + JSON.stringify(nach.log[tag(2)]));
  P.ok('gleicher Name ist derselbe Plan: weiter vier Pläne, „Torso A“ hat jetzt zwei Übungen, die Einheit nennt ihn', Object.values(nach.plans).filter(Boolean).length === 4 && !nach.plans.pp && nach.plans.a.items.map(i => i.id).join() === 'x,q2' && nach.meta[tag(2)].plan === 'a', JSON.stringify(nach.plans.a));
  await r.browser.close();

  /* Übernahme aus Alpha Progression (v88): „Sicherung einlesen“ nimmt die Datei „Workouts“ aus dessen Export, hier ein erfundener.
     Zwei Trainings am selben Tag werden eine Einheit (Dauer 0:30 + 1:00 = 90 min), „+15“ ist Zusatzgewicht 15 kg, „+0“ ein Satz ohne Gewicht, „Curls“ gibt es mit zwei Geräten (das Gerät steht hinter dem Namen),
     Sauna und Laufen fehlen, 24 Std. zählt nicht als Dauer, das Ziel 8 Wdh steht an der Übung. Der Plan des jüngsten Trainings ist „Plan X“: Tag 1 und Tag 3 heißen beide „Torso“
     und werden „Torso A“ (Dips, 2 Sätze) und „Torso B“ (Curls, 1 Satz). Die Datei mit den Plänen wird erkannt und abgewiesen. */
  const csv = ['"Torso · Tag 3 · Woche 2 · Plan X";"2026-03-02 18:00 Uhr";"30 Min."', '"1. Curls · Kurzhanteln · 10 Wdh"', '#;KG;WDH', '1;12.5;10', '',
    '"Torso · Tag 1 · Woche 2 · Plan X";"2026-03-02 10:00 Uhr";"1:00 Std."', '"1. Dips · Körpergewicht · 8 Wdh"', '#;KG;WDH', '1;+15;9', '2;+0;7', '"2. Sauna · Körpergewicht · 10 Wdh"', '#;KG;WDH', '1;+16;50',
    '"3. Laufen · Körpergewicht · 5 cm · 30 Min."', '#;KM;MIN.', '1;5.55;32:44', '', '"Alt · Einzelnes Workout";"2026-02-20 9:00 Uhr";"24 Std."', '"1. Curls · Langhantel · 10 Wdh"', '#;KG;WDH', '1;30;8', ''].join('\n');
  const e = await oeffnen(), wahl = (name, inhalt) => e.page.setInputFiles('#bk-file', { name, mimeType: 'text/csv', buffer: Buffer.from(inhalt) });
  await e.page.click('#v-heute [data-fold="sicherung"]');
  await wahl('Plaene.csv', '"Plan X · 52 Wochen";2026-01-01\n"Tag 1 · Torso"\n"1. Dips · Körpergewicht";"3 Sätze";"8 Wdh"\n'); await e.page.waitForTimeout(200);
  P.ok('Datei mit den Plänen: Hinweis auf die Datei „Workouts“, nichts eingelesen', (await text(e.page, '#bk-msg')).includes('„Workouts“') && !Object.keys(((await gespeichert(e.page)).K || {}).log || {}).length, await text(e.page, '#bk-msg'));
  await wahl('Workouts.csv', csv); await e.page.waitForTimeout(300);
  const aus = (await gespeichert(e.page)).K, an = Object.values(aus.ex).map(x => x.n + (x.z ? ' z' + x.z : '')).sort().join(' | '), dips = Object.keys(aus.ex).find(i => aus.ex[i].n === 'Dips');
  P.ok('Übernahme: Meldung nennt Einheiten und Pläne', (await text(e.page, '#bk-msg')) === '2 Einheiten aus Alpha Progression übernommen, dazu die Pläne Torso A, Torso B. Du findest alles unter Training → Gym.', await text(e.page, '#bk-msg'));
  P.ok('Übernahme: Übungen mit Namen wie selbst eingetippt und Ziel, ohne Sauna und Laufen; Dips mit Körpergewicht, die Einheit trägt ihren Namen', an === 'Curls Kurzhanteln | Curls Langhantel | Dips z8' && aus.ex[dips].bw === 1 && aus.meta['2026-02-20'].n === 'Alt', an + ' · ' + JSON.stringify(aus.meta['2026-02-20']));
  P.ok('Übernahme: ein Tag, eine Einheit mit 90 min; Zusatzgewicht und Satz ohne Gewicht; 24 Std. zählt nicht', Object.keys(aus.log).sort().join() === '2026-02-20,2026-03-02' && aus.meta['2026-03-02'].dur === 5400 && JSON.stringify(aus.log['2026-03-02'][dips]) === '[[15,9],[0,7]]' && aus.meta['2026-02-20'].dur === 0, JSON.stringify(aus.meta));
  P.ok('Übernahme: Pläne „Torso A“ (Platz 1, Dips 2 Sätze) und „Torso B“ (Platz 2, Curls 1 Satz), die Einheit nennt Torso A', Object.values(aus.plans).map(p => p.n + ':' + p.o + ':' + p.items.map(i => aus.ex[i.id].n + ' ' + i.sets).join()).join(' | ') === 'Torso A:1:Dips 2 | Torso B:2:Curls Kurzhanteln 1' && aus.plans[aus.meta['2026-03-02'].plan].n === 'Torso A', JSON.stringify(aus.plans));
  await bereich(e.page, 'training');
  P.enthaelt('beide Pläne stehen im Gym', await text(e.page, '#v-training .rows.one .name'), ['Torso A', 'Torso B']);
  await e.browser.close();

  // --- Übungen mit dem eigenen Körper, Name der Einheit, fest eingebaute Trainings (v89) ---
  /* Körpergewicht 90 kg (ein Eintrag vor 30 Tagen, gilt für alle Tage danach). Dips und Klimmzüge tragen bw: Gerechnet wird mit Körpergewicht plus Zusatzgewicht.
     Dips: vor 10 Tagen +10 kg × 11 → 100 × (1 + 11/30) = 136,67. Heute +15 kg × 11 → 105 × 41/30 = 143,5 → +5,0 % und Rekord (ohne Körpergewicht wären es +50 %).
     Klimmzüge: vor 10 Tagen +10 kg × 9 → 100 × 1,3 = 130. Heute ohne Gewicht × 12 → 90 × 1,4 = 126 → −3,1 % (ohne Körpergewicht gäbe es keinen Vergleich).
     Vorgabe Dips (Ziel 10, heute 11 geschafft; Schritt 5 kg, weil +10 und +15 vorkamen): +20 kg mit (143,5 / 110 − 1) × 30 = 9,1 → 9 Wdh; 1RM 110 × 1,3 = 143.
     Ohne Körpergewicht wären es (15 × 41/30 / 20 − 1) × 30 = 0,75 → 1 Wiederholung.
     Die Einheit von heute hat keinen Plan, aber einen Namen („Pull A“): Er steht in der Liste wie sonst der Plan. */
  const K5 = { ex: { d: { n: 'Dips', bw: 1 }, k: { n: 'Klimmzüge', bw: 1 } }, log: { [tag(10)]: { d: [[10, 11]], k: [[10, 9]] }, [heute]: { d: [[15, 11]], k: [[0, 12]] } },
    plans: { p: { n: 'Körper', items: [{ id: 'd', sets: 1 }], o: 1 } }, meta: { [heute]: { dur: 0, plan: null, n: 'Pull A' } }, live: null };
  const b5 = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: K5, W: { entries: { [tag(30)]: 90 } } } }), t = b5.page;
  await bereich(t, 'training'); await t.click('#v-training [data-fold="einheiten"]'); await t.click('#v-training [data-fold="uebungen"]');
  P.enthaelt('Einheit ohne Plan zeigt ihren Namen', await text(t, '#v-training [data-k="day"][data-d="' + heute + '"]'), ['Pull A', '1 Rekord']);
  const blattVon = async name => { await t.click('#v-training [data-k="ex"]:has-text("' + name + '")'); await t.waitForTimeout(150); const x = [await text(t, '#x-stats .fig'), await text(t, '#x-recap .lastx:first-child .note'), await text(t, '#x-recap .lastx:first-child .lt-r')].join(' # '); await t.click('#xs-close'); return x; };
  const dipsK = await blattVon('Dips'), klimm = await blattVon('Klimmzüge');
  P.ok('Dips mit Körpergewicht: Zusatzgewicht 15 kg, 1RM 143,5, „Rekord · +5,0 %“', dipsK.includes('15kg Zusatzgewicht') && dipsK.includes('143,5kg 1RM geschätzt') && dipsK.includes('Pull A Rekord · +5,0 %') && dipsK.endsWith('1 15 11 143,5'), dipsK);
  P.ok('Klimmzüge: Einheit ohne Gewicht ist mit der mit Zusatzgewicht vergleichbar (−3,1 %, 1RM 126)', klimm.includes('−3,1 %') && klimm.endsWith('1 – 12 126'), klimm);
  await t.click('#v-training [data-k="start"]'); await t.waitForTimeout(300);
  const v5 = await t.$$eval('#l-items .lx > .lt .lt-r', l => l.map(z => [...z.children].slice(1, 4).map(c => c.textContent).join('×')).join(' '));
  P.ok('Vorgabe rechnet mit dem Körpergewicht: +20 kg × 9, 1RM 143', v5 === '20×9×143', v5);
  await t.click('#l-del'); await t.click('#l-del'); await b5.browser.close();

  /* Seine Trainings stehen fest in der App (Block start-gym) und kommen beim ersten Start von selbst: 304 Einheiten, die drei Pläne in seiner Reihenfolge,
     alte Einheiten mit ihrem Namen. Der Merker takt.start trägt den Stand: Was er danach löscht, kommt beim nächsten Start nicht zurück. */
  const h6 = await oeffnen({ historie: true }), u = h6.page, K6 = (await gespeichert(u)).K, stand = await u.evaluate(() => document.querySelector('#start-gym').dataset.stand);
  P.ok('erster Start: 304 Einheiten und 61 Übungen sind da, der Merker trägt den Stand', Object.keys(K6.log).length === 304 && Object.values(K6.ex).filter(Boolean).length === 61 && stand === '2026-11-20' && (await u.evaluate(() => localStorage.getItem('takt.start'))) === stand, Object.keys(K6.log).length + ' · ' + stand);
  P.ok('alte Einheit trägt ihren Namen, Dips und Klimmzüge rechnen mit Körpergewicht, Namen ohne Klammern', K6.meta['2026-07-06'].n === 'Pull A' && Object.values(K6.ex).filter(x => x.bw).map(x => x.n).sort().join() === 'Dips,Klimmzüge eng mit Neutralgriff,Klimmzüge weit mit Obergriff' && !Object.values(K6.ex).some(x => /[()]/.test(x.n)), JSON.stringify(K6.meta['2026-07-06']));
  await bereich(u, 'training');
  P.ok('seine drei Pläne stehen in seiner Reihenfolge im Gym', (await text(u, '#v-training .rows.one .name')) === 'Torso A | Extremitäten | Torso B', await text(u, '#v-training .rows.one .name'));
  await u.evaluate(() => { const d = JSON.parse(localStorage.getItem('takt.v1')); delete d.K.log['2022-05-15']; delete d.K.meta['2022-05-15']; localStorage.setItem('takt.v1', JSON.stringify(d)); });
  await u.reload(); await u.waitForTimeout(300);
  P.ok('zweiter Start: nichts wird noch einmal eingelesen, Gelöschtes bleibt weg', Object.keys((await gespeichert(u)).K.log).length === 303);
  await h6.browser.close();
  await P.ende(null, fehler.concat(w.fehler, g.fehler, r.fehler, e.fehler, b5.fehler, h6.fehler));
});
