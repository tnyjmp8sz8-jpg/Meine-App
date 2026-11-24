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

  await bereich(page, 'training'); await page.click('#v-training .subtabs button:nth-child(2)');
  P.enthaelt('laufender Monat: 1 Einheit, Verbesserung +10,0 %', await gym(), ['1 Einheit', '+10,0 %']);
  P.enthaelt('bewegtes Gewicht 44 × 27 = 1.188 kg, Zeit 0:40 h', await gym(), ['1,2', '0:40 h']);
  // Pläne: Torso war heute dran (K.meta von heute): grüner Haken statt Kreis zum Starten, in der Überschrift „1 von 1 diese Woche“
  P.ok('Plan von dieser Woche trägt den Haken, die Überschrift zählt mit', (await page.$$('#v-training .rows.one .row.is-done')).length === 1 && (await text(page, '#v-training h2.sec')).includes('1 von 1 diese Woche'), await text(page, '#v-training h2.sec'));
  await page.click('#v-training [data-fold="uebungen"]');
  P.enthaelt('Übungsliste zeigt die Verbesserung im Monat', await text(page, '#v-training [data-k="ex"]'), ['Rudern', '+10,0 %']);
  await page.click('#v-training [data-fold="einheiten"]');
  P.ok('Einheiten klappen auf: eine in diesem Monat', (await page.$$('#v-training [data-k="day"]')).length === 1);

  await nachOben(page); await page.click('#v-training .mnav button:first-child');
  P.enthaelt('Vormonat: 5 Einheiten, +14,3 % (erster Monat: gegenüber der ersten Einheit)', await gym(), ['5 Einheiten', '+14,3 %']);
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
  await zahlWahl(page, '#l-w', '45'); await page.click('.lt-r .chk'); await page.click('#l-save'); await page.waitForTimeout(200);
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
  await bereich(q, 'training'); await q.click('#v-training .subtabs button:nth-child(2)'); await q.click('#v-training [data-fold="uebungen"]');
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
  await q.click('#v-training [data-fold="einheiten"]');
  P.enthaelt('Einheit von heute nennt den Rekord', await text(q, '#v-training [data-k="day"][data-d="' + heute + '"]'), ['Probe', '1 Rekord']);
  P.ok('Plan „Probe“ war heute dran: Haken, „1 von 2 diese Woche“', (await q.$$('#v-training .rows.one .row.is-done')).length === 1 && (await text(q, '#v-training h2.sec')).includes('1 von 2 diese Woche'), await text(q, '#v-training h2.sec'));
  P.enthaelt('Körpergewicht im selben Monat: +1,2 kg', await text(q, '#v-training .kw'), ['Körpergewicht', '+1,2 kg']);
  // Blatt der Übung: Die Einheit von heute ist der Rekord, 60 / 53,33 − 1 = +12,5 %
  await q.click('#v-training [data-k="ex"]:has-text("Voll")'); await q.waitForTimeout(150);
  P.enthaelt('Blatt der Übung: „Rekord · +12,5 %“ an der Einheit von heute', await text(q, '#x-recap .lastx .note'), ['Rekord · +12,5 %']);
  await q.click('#xs-close'); await q.reload(); await q.waitForTimeout(300);
  P.ok('nach neuem Laden: Das Ziel 12 steht noch an der Übung', (await gespeichert(q)).K.ex.v.z === 12);
  await g.browser.close();
  await P.ende(null, fehler.concat(w.fehler, g.fehler));
});
