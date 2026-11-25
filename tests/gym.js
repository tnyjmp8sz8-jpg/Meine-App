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
  /* Erklärung hinter dem „i“ an „Verbesserung“ in Klartext (v102, seine Frage: „was bedeutet die Jahres- und Monatsverbesserung? zu letztem Jahr und Monat?“):
     im Monat „gegenüber dem letzten Monat davor mit dieser Übung (meist <Vormonat>)“, im laufenden Jahr „dein Stand jetzt gegenüber Ende <Vorjahr>“, in einem früheren Jahr „Ende <Jahr> gegenüber Ende <Jahr − 1>“. */
  const MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'], jahr = +heute.slice(0, 4);
  const erkl = () => page.evaluate(() => (document.querySelector('#info-k-imp') || {}).textContent || '');
  P.enthaelt('Erklärung im Monat nennt den Vergleich', await erkl(), ['dein bester Wert im ' + MON[+heute.slice(5, 7) - 1], 'gegenüber dem letzten Monat davor mit dieser Übung (meist ' + MON[+vm.slice(5) - 1] + ')', 'im Schnitt über 1 Übung']);
  await page.click('#v-training [data-t="mode"][data-v="year"]');
  P.enthaelt('Erklärung im Jahr nennt den Vergleich', await erkl(), ['dein Stand jetzt gegenüber Ende ' + (jahr - 1)]);
  await page.click('#v-training [data-t="mode"][data-v="month"]');
  // Pläne: Bei nur einem Plan ist die Runde nach einer Einheit voll. Heute trainiert (also diese Woche): Der Haken bleibt bis Montag stehen (v93), „1 von 1“.
  P.ok('ein einziger Plan, heute trainiert: Haken bis Montag', (await page.$$('#v-training .rows.one .row.is-done')).length === 1 && (await text(page, '#v-training h2.sec')).includes('1 von 1'), await text(page, '#v-training h2.sec'));
  await page.click('#v-training [data-fold="uebungen"]');
  P.enthaelt('Übungsliste zeigt die Verbesserung im Monat', await text(page, '#v-training [data-k="ex"]'), ['Rudern', '+10,0 %']);
  await page.click('#v-training [data-fold="einheiten"]');
  P.ok('Einheiten klappen auf: eine in diesem Monat', (await page.$$('#v-training [data-k="day"]')).length === 1);
  // Zeile einer Einheit (v100, sein „viel zu viel Text, einfach nur Name des Plans dahin“): Tag, darunter nur der Plan, rechts die Dauer; die Übungen stehen nicht mehr da
  const zeileH = await page.$eval('#v-training [data-k="day"]', b => [(b.querySelector('.l small') || {}).textContent || '', b.textContent.includes('Rudern')].join(' | '));
  P.ok('Zeile einer Einheit: unter dem Tag nur der Name des Plans, keine Übungen', zeileH === 'Torso | false', zeileH);

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
  await q.click('#v-training [data-fold="uebungenAlt"]');   // seit v99 stehen oben nur die Übungen aus den Plänen (Voll, Stufen, Steht), die übrigen hinter „Weitere Übungen“
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
  /* Übungen (v90, v97): „Rudern“ war in den vier Wochen bis zur jüngsten Einheit dran (vor 4 Tagen), „Uralt“ zuletzt vor 60 Tagen → liegt in derselben Liste hinter der letzten Zeile
     „Weitere Übungen“ (bis v96 eine eigene, dritte Klappzeile unter „Einheiten“; seit v99 steht oben, was in einem Plan steht: „Rudern“, und „Uralt“ steht in keinem). Zu sind nur „Übungen“ und „Einheiten“ zu sehen; die Zeilen entstehen erst beim Aufklappen.
     Mit der Liste geht auch ihr älterer Teil wieder zu. Kein Plan trägt mehr ein Play-Zeichen: Jeder Kreis ist ein Ring mit Haken oder Zahl. */
  const kl = async () => [await text(s, '#v-training .folds [data-fold]'), await text(s, '#v-training [data-k="ex"] .l > span')].join(' # ');
  /* „Einheiten“ gibt es nur, wenn im laufenden Monat trainiert wurde: Die Einheiten liegen 9, 6 und 4 Tage zurück, am Monatsanfang also im Vormonat (dann fehlt die Zeile) */
  const nE = [9, 6, 4].filter(n => tag(n).slice(0, 7) === heute.slice(0, 7)).length, eT = nE ? ' | Einheiten ' + nE : '';
  const zuerst = await kl(); await s.click('#v-training [data-fold="uebungen"]'); await s.waitForTimeout(100);
  const offen = await kl(); await s.click('#v-training [data-fold="uebungenAlt"]'); await s.waitForTimeout(100);
  P.ok('zu: nur „Übungen“ und (wenn im laufenden Monat trainiert wurde) „Einheiten“', zuerst === 'Übungen 1' + eT + ' # ', zuerst);
  P.ok('„Übungen“ offen: die der letzten vier Wochen, als letzte Zeile „Weitere Übungen“ vor „Einheiten“', offen === 'Übungen 1 | Weitere Übungen 1' + eT + ' # Rudern', offen);
  P.ok('„Weitere Übungen“ offen: die Übung ohne Plan steht darunter', (await kl()) === 'Übungen 1 | Weitere Übungen 1' + eT + ' # Rudern | Uralt', await kl());
  await s.click('#v-training [data-fold="uebungen"]'); await s.waitForTimeout(100); await s.click('#v-training [data-fold="uebungen"]'); await s.waitForTimeout(100);
  P.ok('„Übungen“ zu und wieder auf: der ältere Teil ist wieder zu', (await kl()) === offen, await kl());
  await s.click('#v-training [data-fold="uebungen"]');
  // Kopfzeile (v97, v102): deckend bis 18 px vor ihrem unteren Rand, erst dort läuft sie aus (seit v102 über eine Maske, weil sie das Licht der Seite mitzeichnet). Bis v96 schien beim Scrollen die Wochenleiste hinter dem Titel durch (sein Bild vom 24.11.).
  P.ok('Kopfzeile deckt den Titel ganz, nur der untere Rand läuft aus', await s.evaluate(() => { const c = getComputedStyle(document.querySelector('.top')); return c.backgroundColor === 'rgb(0, 0, 0)' && /calc\(100% - 18px\)/.test(c.maskImage || c.webkitMaskImage || ''); }));
  P.ok('Pläne ohne Play-Zeichen: Ringe ohne Füllung', await s.evaluate(() => [...document.querySelectorAll('#v-training .rows.one .glyph')].every(g => !g.querySelector('path[d^="M5"]') && getComputedStyle(g).backgroundColor === 'rgba(0, 0, 0, 0)')));
  P.ok('schwarzer Grund; Blätter aus Glas: halb durchsichtig mit Milchglas und rundum gerundet (v94)', await s.evaluate(() => { const c = getComputedStyle(document.querySelector('#xsheet')); return getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)' && /^rgba\(30, 30, 32, 0\.8\)$/.test(c.backgroundColor) && /blur/.test(c.backdropFilter || c.webkitBackdropFilter || '') && parseFloat(c.borderBottomLeftRadius) >= 24; }));
  // Torso B heute trainiert: Der letzte Plan der Reihe war dran → die Runde ist voll. Weil in ihr diese Woche trainiert wurde, bleibt sie mit drei Haken bis Montag stehen (v93)
  await s.click('#v-training [data-k="start"][aria-label^="Torso B"]'); await s.waitForTimeout(250); await s.click('#l-items .chk'); await s.click('#l-save'); await s.waitForTimeout(200); await s.click('#rs-ok');
  P.ok('Runde voll und diese Woche trainiert: drei Haken bis Montag, „3 von 3“', (await plaene()) === 'Torso A:is-done: | Extremitäten:is-done: | Torso B:is-done:' && (await text(s, '#v-training h2.sec')).includes('3 von 3'), await plaene());
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
  await bereich(t, 'training'); await t.click('#v-training [data-fold="einheiten"]'); await t.click('#v-training [data-fold="uebungen"]'); await t.click('#v-training [data-fold="uebungenAlt"]');   // Klimmzüge stehen in keinem Plan: seit v99 hinter „Weitere Übungen“
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

  // --- Plan überspringen und Beginn der neuen Runde (v93) ---
  /* Sein Fall: Torso A und Extremitäten waren letzte Woche dran (vor 9 und 8 Tagen, also sicher vor dem Montag dieser Woche), Torso B ist offen und als Nächstes dran.
     Nur dieser Plan trägt den Knopf zum Überspringen. Übersprungen ist die Runde voll, und weil diese Woche noch nichts trainiert wurde, beginnt sofort die neue:
     nichts erledigt, Torso A ist dran. „Rückgängig“ holt den alten Stand zurück. */
  const K7 = () => ({ ex: { x: { n: 'Rudern' } }, log: {}, meta: {}, live: null,
    plans: { a: { n: 'Torso A', items: [{ id: 'x', sets: 1 }], o: 1 }, e: { n: 'Extremitäten', items: [{ id: 'x', sets: 1 }], o: 2 }, b: { n: 'Torso B', items: [{ id: 'x', sets: 1 }], o: 3 } } });
  const mit = (k, liste) => { liste.forEach(([n, pl]) => { k.log[tag(n)] = { x: [[50, 10]] }; k.meta[tag(n)] = { dur: 600, plan: pl }; }); return k; };
  const o7 = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: mit(K7(), [[9, 'a'], [8, 'e']]) } }), v = o7.page;
  await bereich(v, 'training');
  const reihe = () => v.$$eval('#v-training .rows.one .row', l => l.map(z => z.querySelector('.name').textContent + ':' + z.className.replace('row ', '') + (z.querySelector('[data-k="skip"]') ? ':Knopf' : '')).join(' | '));
  P.ok('letzte Woche zwei von drei: Torso B ist dran und trägt als einziger den Knopf zum Überspringen', (await reihe()) === 'Torso A:is-done | Extremitäten:is-done | Torso B:is-idle:Knopf', await reihe());
  await v.click('#v-training [data-k="skip"]'); await v.waitForTimeout(150);
  P.ok('übersprungen ohne Einheit in dieser Woche: sofort neue Runde, Torso A ist dran', (await reihe()) === 'Torso A:is-idle:Knopf | Extremitäten:is-wait | Torso B:is-wait' && !(await text(v, '#v-training h2.sec')).includes(' von ') && (await text(v, '#toast')).includes('Übersprungen'), await reihe() + ' · ' + await text(v, '#toast'));
  await v.click('#toast button'); await v.waitForTimeout(150);
  P.ok('„Rückgängig“: Torso B ist wieder offen', (await reihe()) === 'Torso A:is-done | Extremitäten:is-done | Torso B:is-idle:Knopf', await reihe());
  await o7.browser.close();
  /* Diese Woche trainiert: Torso A heute. Extremitäten überspringen → Torso B ist dran. Auch Torso B überspringen → die Runde ist voll, bleibt aber bis Montag stehen,
     weil in ihr diese Woche trainiert wurde („1 von 3“, kein Knopf mehr). Gespeichert ist je übersprungenem Plan ein Eintrag unter dem heutigen Tag. */
  const o8 = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: mit(K7(), [[0, 'a']]) } }); const y8 = o8.page;
  await bereich(y8, 'training');
  const reihe8 = () => y8.$$eval('#v-training .rows.one .row', l => l.map(z => z.querySelector('.name').textContent + ':' + z.className.replace('row ', '') + (z.querySelector('[data-k="skip"]') ? ':Knopf' : '')).join(' | '));
  await y8.click('#v-training [data-k="skip"]'); await y8.waitForTimeout(100);
  P.ok('diese Woche trainiert, Extremitäten übersprungen: Torso B ist dran', (await reihe8()) === 'Torso A:is-done | Extremitäten:is-skip | Torso B:is-idle:Knopf' && (await text(y8, '#v-training .is-skip .meta')) === 'übersprungen', await reihe8());
  await y8.click('#v-training [data-k="skip"]'); await y8.waitForTimeout(100);
  const aus8 = (await gespeichert(y8)).K.aus;
  P.ok('auch Torso B übersprungen: Die Runde bleibt bis Montag stehen, „1 von 3“, kein Knopf', (await reihe8()) === 'Torso A:is-done | Extremitäten:is-skip | Torso B:is-skip' && (await text(y8, '#v-training h2.sec')).includes('1 von 3') && JSON.stringify(aus8) === JSON.stringify({ [heute]: { e: 1, b: 1 } }), await reihe8() + ' · ' + JSON.stringify(aus8));
  // In der vollen Runde einen Plan starten und speichern beginnt die nächste: Torso A heute noch einmal → wieder Torso A erledigt, Extremitäten dran… hier genügt: der übersprungene Plan lässt sich trotzdem starten
  await y8.click('#v-training [data-k="start"][aria-label^="Extremitäten"]'); await y8.waitForTimeout(250); await y8.click('#l-items .chk'); await y8.click('#l-save'); await y8.waitForTimeout(200); await y8.click('#rs-ok');
  P.ok('übersprungenen Plan doch trainiert: Der Eintrag „übersprungen“ für ihn ist weg', !(((await gespeichert(y8)).K.aus || {})[heute] || {}).e, JSON.stringify((await gespeichert(y8)).K.aus));
  await o8.browser.close();
  /* Montag danach: Dieselbe volle Runde, aber alles liegt vor dieser Woche (Torso A vor 8 Tagen trainiert, die anderen beiden damals übersprungen) → die neue Runde hat begonnen. */
  const k9 = mit(K7(), [[8, 'a']]); k9.aus = { [tag(8)]: { e: 1, b: 1 } };
  const o9 = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: k9 } }); await bereich(o9.page, 'training');
  const reihe9 = await o9.page.$$eval('#v-training .rows.one .row', l => l.map(z => z.querySelector('.name').textContent + ':' + z.className.replace('row ', '')).join(' | '));
  P.ok('volle Runde aus der Vorwoche: neue Runde, Torso A ist dran', reihe9 === 'Torso A:is-idle | Extremitäten:is-wait | Torso B:is-wait', reihe9);
  await o9.browser.close();
  /* Laufendes Training im Vollbild (v96, sein Wunsch: „ganzer Bildschirm … will Fokus darauf“). Ein Plan mit einer Übung und drei Sätzen, ohne frühere Einheit:
     Das Blatt deckt den ganzen Bildschirm (390 × 844), seit v101 aus Glas (halb durchsichtiges Grau mit Milchglas auf ::backdrop, die Seite dahinter bleibt schwarz und schimmert durch; v98 bis v100 deckend #1C1C1E), ohne Rundung und ohne Milchglas; die Knöpfe zum Beenden stehen unten am Bildschirm.
     „+ Satz“, „− Satz“ und „Übung entfernen“ stehen erst nach einem Tipp auf „…“ da. Schließen lässt das Training weiterlaufen; nach einem Neuladen steht es von selbst wieder im Vollbild da,
     außer die Adresse verlangt eine Schnelleingabe (?neu=notiz). */
  const o10 = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: { ex: { a: { n: 'Rudern' } }, log: {}, meta: {}, live: null, plans: { p: { n: 'Torso', items: [{ id: 'a', sets: 3 }], o: 1 } } } } }), f = o10.page;
  await bereich(f, 'training'); await f.click('#v-training [data-k="start"]'); await f.waitForTimeout(250);
  const voll = () => f.evaluate(() => { const d = document.querySelector('#lsheet'), r = d.getBoundingClientRect(), c = getComputedStyle(d);
    return [d.open, Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height), c.backgroundColor, parseFloat(c.borderTopLeftRadius), /blur/.test(c.backdropFilter || '')].join(' ') + ' # ' + (b => b.backgroundColor + ' ' + /blur/.test(b.backdropFilter || ''))(getComputedStyle(d, '::backdrop')); });
  P.ok('Training starten öffnet das Vollbild: ganzer Bildschirm ohne Rundung; das Glas (halb durchsichtiges Grau mit Milchglas) liegt auf der stehenden Ebene dahinter', (await voll()) === 'true 0 0 390 844 rgba(0, 0, 0, 0) 0 false # rgba(34, 34, 38, 0.64) true', await voll());
  const unten = await f.evaluate(() => Math.round(document.querySelector('#l-del').getBoundingClientRect().bottom));
  P.ok('„Beenden“ und „Verwerfen“ stehen unten am Bildschirm', unten > 844 - 40 && unten <= 844 && await f.isVisible('#l-save'), String(unten));
  P.ok('die Seite dahinter bleibt schwarz; Flächen im Vollbild durchscheinend (Weiß mit 12 % Deckkraft)', (await f.evaluate(() => getComputedStyle(document.body).backgroundColor + ' ' + getComputedStyle(document.querySelector('#l-w')).backgroundColor)) === 'rgb(0, 0, 0) rgba(255, 255, 255, 0.12)');
  const saetzeF = () => f.$$eval('#l-items .lx > .lt > .lt-r', l => l.length);
  P.ok('ohne Tipp auf „…“: keine Zeile mit „+ Satz“', !(await f.$('#l-items [data-la="addset"]')) && (await saetzeF()) === 3);
  await f.click('#l-items [data-la="menu"]');
  P.enthaelt('Tipp auf „…“ zeigt die drei Aktionen', await text(f, '#l-items .lx-akt button'), ['+ Satz', '− Satz', 'Übung entfernen']);
  await f.click('#l-items [data-la="addset"]');
  P.ok('„+ Satz“: vier Sätze, die Aktionen bleiben offen', (await saetzeF()) === 4 && !!(await f.$('#l-items [data-la="rmset"]')));
  await f.click('#l-items [data-la="rmset"]'); await f.click('#l-items [data-la="rm"]');
  P.ok('„− Satz“: wieder drei; „Übung entfernen“ fragt erst nach', (await saetzeF()) === 3 && (await text(f, '#l-items [data-la="rm"]')) === 'Wirklich entfernen?');
  await f.click('#l-items [data-la="menu"]');
  P.ok('zweiter Tipp auf „…“ schließt die Aktionen, die Übung bleibt', !(await f.$('#l-items .lx-akt')) && (await saetzeF()) === 3);
  const breit = await f.evaluate(() => { const d = document.querySelector('#lsheet'); return d.scrollWidth <= d.clientWidth; });
  await f.setViewportSize({ width: 320, height: 568 });
  P.ok('nichts ragt seitlich hinaus (390 und 320 px)', breit && await f.evaluate(() => { const d = document.querySelector('#lsheet'); return d.scrollWidth <= d.clientWidth && d.getBoundingClientRect().width === 320; }));
  await f.setViewportSize({ width: 390, height: 844 });
  await f.click('#ls-close'); await f.waitForTimeout(100);
  P.ok('Schließen: Das Training läuft weiter, die Karte steht im Bereich', !(await f.evaluate(() => document.querySelector('#lsheet').open)) && !!(await gespeichert(f)).K.live && !!(await f.$('#v-training [data-k="live"]')));
  await f.goto(f.url().split('#')[0]); await f.waitForTimeout(300);
  P.ok('App neu geladen, während ein Training läuft: Sie öffnet von selbst im Vollbild auf dem Training', (await voll()) === 'true 0 0 390 844 rgba(0, 0, 0, 0) 0 false # rgba(34, 34, 38, 0.64) true' && await f.isVisible('#l-w'), await voll());
  await f.goto(f.url().split('#')[0].split('?')[0] + '?neu=notiz'); await f.waitForTimeout(300);
  P.ok('mit Schnelleingabe in der Adresse bleibt das Vollbild zu, das Training läuft weiter', !(await f.evaluate(() => document.querySelector('#lsheet').open)) && !!(await gespeichert(f)).K.live);
  await o10.browser.close();
  /* Übungen nach Muskelgruppe (v99, sein Wunsch: „nur die Übungen aktuell aus meinem Plan und unterteilt in Rücken, Brust, Arme, Beine“).
     Plan 1: Bankdrücken, Latzug, Seitheben, Beinpresse. Plan 2: Curls, Rudern mit Brustauflage, Dips, Latzug (steht nur einmal). „Kniebeuge“ steht in keinem Plan.
     Platz in den Plänen: Bankdrücken 0, Latzug 1, Seitheben 2, Beinpresse 3, Curls 4, Rudern 5, Dips 6. Gruppen aus dem Namen: Latzug und Rudern → Rücken („Brustauflage“ macht
     daraus keine Brust), Bankdrücken → Brust, Curls → Arme, Beinpresse → Beine, Seitheben → keine der vier (Sonstige). Dips wären Arme, tragen aber gespeichert „brust“: Das Gespeicherte gilt.
     Also: Rücken: Latzug, Rudern · Brust: Bankdrücken, Dips · Arme: Curls · Beine: Beinpresse · Sonstige: Seitheben; rechts steht 7, dahinter „Weitere Übungen 1“.
     Curls im Blatt auf „Brust“ gestellt: Brust wird Bankdrücken (0), Curls (4), Dips (6), die Überschrift „Arme“ entfällt. Eine unbekannte Gruppe in den Daten („quatsch“) wird beim Laden verworfen. */
  const o11 = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: { log: { [tag(3)]: { a: [[60, 10]] } }, meta: {}, live: null,
    ex: { a: { n: 'Latzug' }, b: { n: 'Bankdrücken' }, c: { n: 'Curls' }, d: { n: 'Beinpresse' }, e: { n: 'Rudern mit Brustauflage' }, f: { n: 'Seitheben' }, g: { n: 'Dips', g: 'brust' }, h: { n: 'Kniebeuge', g: 'quatsch' } },
    plans: { p: { n: 'Eins', o: 1, items: [{ id: 'b', sets: 3 }, { id: 'a', sets: 3 }, { id: 'f', sets: 3 }, { id: 'd', sets: 3 }] }, q: { n: 'Zwei', o: 2, items: [{ id: 'c', sets: 3 }, { id: 'e', sets: 3 }, { id: 'g', sets: 3 }, { id: 'a', sets: 3 }] } } } } }), gp = o11.page;
  await bereich(gp, 'training'); await gp.click('#v-training [data-fold="uebungen"]'); await gp.waitForTimeout(100);
  const gListe = () => gp.evaluate(() => [...document.querySelector('#v-training [data-fold="uebungen"]').closest('ul').children].slice(1).map(li => li.classList.contains('grp') ? '[' + li.textContent + ']' : li.querySelector('[data-fold]') ? li.textContent.trim() : li.querySelector('.l > span').textContent).join(' '));
  P.ok('Übungen: nur die aus den Plänen, in der Reihenfolge der Pläne, unterteilt nach Gruppe; der Rest hinter „Weitere Übungen“', (await gListe()) === '[Rücken] Latzug Rudern mit Brustauflage [Brust] Bankdrücken Dips [Arme] Curls [Beine] Beinpresse [Sonstige] Seitheben Weitere Übungen1' && (await text(gp, '#v-training [data-fold="uebungen"]')) === 'Übungen 7', await gListe());
  await gp.click('#v-training [data-k="ex"]:has-text("Curls")'); await gp.waitForTimeout(150);
  P.ok('Blatt der Übung: Gruppe aus dem Namen vorgewählt (Arme)', (await text(gp, '#x-grp [aria-pressed="true"]')) === 'Arme' && (await text(gp, '#x-grp .chip')) === 'Rücken | Brust | Arme | Beine');
  await gp.click('#x-grp [data-g="brust"]'); await gp.click('#x-save'); await gp.waitForTimeout(150);
  const gex = (await gespeichert(gp)).K.ex;
  P.ok('Gruppe gewählt und gespeichert: Curls stehen unter Brust, „Arme“ entfällt', gex.c.g === 'brust' && (await gListe()) === '[Rücken] Latzug Rudern mit Brustauflage [Brust] Bankdrücken Curls Dips [Beine] Beinpresse [Sonstige] Seitheben Weitere Übungen1', await gListe());
  P.ok('gespeicherte Gruppe bleibt beim Laden, eine unbekannte wird verworfen', gex.g.g === 'brust' && !gex.h.g, JSON.stringify(gex));
  await o11.browser.close();
  /* Pausen-Uhr (v103). Die Uhr der Seite steht auf dem 15. des laufenden Monats, 12 Uhr, und läuft nur, wenn der Test sie vorstellt; die iPhone-Hülle ist nachgestellt und sammelt, was hinausgeht.
     Plan mit einer Übung „Rudern“ und drei Sätzen. Ohne eingestellte Länge heißt die Kapsel „Pause“ und die Pause zählt hoch. Erster Satz abgehakt, 5 s später 1:30 gewählt:
     Es bleiben 90 − 5 = 85 s → die Kapsel zeigt 1:25, oben steht „Pause noch 01:25“, an die iPhone-App geht { art: 'pause', sek: 85, text: 'Rudern · Satz 2' }.
     86 s später ist die Pause vorbei: „Los“, „Pause vorbei“, genau ein Impuls „erfolg“ (auch nach weiteren Sekunden nur einer). Zweiter Satz abgehakt: neue Pause mit sek 90.
     „Aus“ gewählt: K.rest ist weg, sek 0. Wieder 1:00 gewählt und das Training beendet: Die letzte Nachricht streicht die Mitteilung (sek 0), die Länge bleibt gespeichert. */
  const hStub = () => { window.__post = []; window.webkit = { messageHandlers: { track: { postMessage: o => window.__post.push(JSON.parse(JSON.stringify(o))) } } }; };
  const mitte = new Date(+heute.slice(0, 4), +heute.slice(5, 7) - 1, 15, 12);
  const o12 = await oeffnen({ uhr: mitte, skript: hStub, daten: { S: { routines: [], running: null }, LY: {}, K: { ex: { a: { n: 'Rudern' } }, log: {}, meta: {}, live: null, plans: { p: { n: 'Torso', items: [{ id: 'a', sets: 3 }], o: 1 } } } } }), z = o12.page;
  const vor = async ms => { await z.clock.fastForward(ms); await z.waitForTimeout(60); };
  const kapsel = () => z.evaluate(() => document.querySelector('#l-rest-t').textContent + ' | ' + document.querySelector('#lv-rest').textContent.trim() + ' | ' + document.querySelector('#l-rest').className.replace('l-rest', '').replace('gong', '').trim()).then(t => t.trim());
  const pausen = () => z.evaluate(() => window.__post.filter(m => m.art === 'pause').map(m => m.sek + ':' + m.text).join(' # '));
  const waehle = async v => { await z.click('#l-rest'); await z.waitForTimeout(80); await z.click('#z-list [data-zv="' + v + '"]'); await z.waitForTimeout(80); };
  await bereich(z, 'training'); await z.click('#v-training [data-k="start"]'); await z.waitForTimeout(200);
  await zahlWahl(z, '#l-w', '40'); await zahlWahl(z, '#l-r', '10');
  const ohne = await kapsel(); await z.click('#l-items .chk'); await vor(5000);
  P.ok('ohne eingestellte Pause: Kapsel „Pause“, die Pause zählt hoch', ohne === 'Pause |  |' && (await kapsel()) === 'Pause | · Pause 00:05 |', ohne + ' → ' + await kapsel());
  await z.click('#l-rest'); await z.waitForTimeout(80);
  P.ok('Tipp auf die Kapsel: nur die Liste der Längen, keine Tasten; „Aus“ ist gewählt', await z.evaluate(() => document.querySelector('#zsheet').open && document.querySelector('#z-pad').hidden && getComputedStyle(document.querySelector('#z-pad')).display === 'none' && document.querySelector('#z-list [aria-pressed="true"]').textContent === 'Aus' && document.querySelectorAll('#z-list button').length === 13));
  await z.click('#z-list [data-zv="90"]'); await z.waitForTimeout(80);
  P.ok('1:30 gewählt, 5 s nach dem Satz: Kapsel 1:25, oben „Pause noch 01:25“, gespeichert', (await kapsel()) === '1:25 | · Pause noch 01:25 | laeuft' && (await gespeichert(z)).K.rest === 90, await kapsel());
  P.ok('an die iPhone-App: Mitteilung in 85 s mit dem nächsten Satz', (await pausen()).endsWith('85:Rudern · Satz 2'), await pausen());
  const impulse = () => z.evaluate(() => window.__post.filter(m => m.art === 'haptik' && m.w === 'erfolg').length), vorher = await impulse();
  await vor(86000); const los = await kapsel(), einer = (await impulse()) - vorher; await vor(5000);
  P.ok('86 s später: „Los“, „Pause vorbei“, genau ein Impuls', los === 'Los | · Pause vorbei | los' && einer === 1 && (await impulse()) - vorher === 1, los + ' · ' + einer + ' · ' + ((await impulse()) - vorher));
  await z.click('#l-items .chk'); await z.waitForTimeout(80);
  P.ok('zweiter Satz abgehakt: neue Pause, Mitteilung in 90 s für Satz 3', (await kapsel()) === '1:30 | · Pause noch 01:30 | laeuft' && (await pausen()).endsWith('90:Rudern · Satz 3'), (await kapsel()) + ' · ' + await pausen());
  await waehle(0);
  P.ok('„Aus“ gewählt: keine Länge mehr gespeichert, Mitteilung gestrichen, die Pause zählt wieder hoch', (await gespeichert(z)).K.rest === undefined && (await pausen()).endsWith('0:Rudern · Satz 3') && (await kapsel()).startsWith('Pause | · Pause 00:0'), JSON.stringify((await gespeichert(z)).K.rest) + ' · ' + await kapsel());
  await waehle(60); await z.click('#l-save'); await z.waitForTimeout(200); await z.click('#rs-ok');
  P.ok('Training beendet: Mitteilung gestrichen, die Länge bleibt für das nächste Mal', /(^| # )0:$/.test(await pausen()) && (await gespeichert(z)).K.rest === 60, await pausen());
  /* Training von der Apple Watch (v103): Die iPhone-App übergibt es wie einen Lauf über den Eingang. Heute (15., 18 Uhr) 3720 s mit Puls 120, 130, 140 → 62 min, Ø Puls 130.
     Dieselbe Kennung noch einmal mit Puls 140 und 150 bessert nach (145). Ein zweites, kürzeres Training am selben Tag (600 s) verdrängt das erste nicht.
     Im Blatt der Einheit von heute steht „Apple Watch · 62 min · Ø Puls 145“. Meldet die iPhone-App für einen anderen Tag (den 14.) nur ein Training ohne Puls (45 min),
     steht dort „Puls fehlt noch“; ohne Training auf der Uhr gibt es die Zeile nicht. */
  const t18 = new Date(mitte.getFullYear(), mitte.getMonth(), 15, 18).getTime(), tag15 = heute.slice(0, 8) + '15', tag14 = heute.slice(0, 8) + '14', tag13 = heute.slice(0, 8) + '13';
  const ein = (id, gym) => z.evaluate(a => window.TrackHuelle.eingang([{ id: a[0], art: 'gym', t: Date.now(), gym: a[1] }]), [id, gym]);
  await ein('a1', { id: 'g1', t: t18, s: 3720, pu: [120, 130, 140] });
  const erst = JSON.stringify((await gespeichert(z)).K.uhr[tag15]);
  await ein('a2', { id: 'g1', t: t18, s: 3720, pu: [140, 150] }); await ein('a3', { id: 'g2', t: t18 + 5 * 3600000, s: 600, pu: [100] });
  P.ok('Training von der Uhr: 3720 s, Puls 130; nachgeliefert 145; ein kürzeres zweites verdrängt es nicht', erst === '{"s":3720,"hr":130,"h":"g1"}' && JSON.stringify((await gespeichert(z)).K.uhr[tag15]) === '{"s":3720,"hr":145,"h":"g1"}', erst + ' → ' + JSON.stringify((await gespeichert(z)).K.uhr));
  /* Einheiten am 14. und 13. dazulegen (das Training von eben liegt auf dem 15.), dann die Auskunft der iPhone-App für den 14. */
  await z.evaluate(a => { const d = JSON.parse(localStorage.getItem('takt.v1')); d.K.log[a[0]] = { a: [[40, 10]] }; d.K.log[a[1]] = { a: [[40, 10]] }; localStorage.setItem('takt.v1', JSON.stringify(d)); }, [tag14, tag13]);
  await z.reload(); await z.waitForTimeout(300);
  await z.evaluate(a => window.TrackHuelle.info({ app: '1.0', gym: { letzte: [{ von: a, bis: a + 45 * 60000, puls: 0 }] } }), new Date(mitte.getFullYear(), mitte.getMonth(), 14, 17).getTime());
  await bereich(z, 'training'); await z.click('#v-training [data-fold="einheiten"]'); await z.waitForTimeout(100);
  const zeileUhr = async d => { await z.click('#v-training [data-k="day"][data-d="' + d + '"]'); await z.waitForTimeout(150); const t = await z.evaluate(() => { const e = document.querySelector('#k-uhr'); return e.hidden ? '(keine)' : e.textContent; }); await z.click('#ks-close'); await z.waitForTimeout(80); return t; };
  const uhr3 = [await zeileUhr(tag15), await zeileUhr(tag14), await zeileUhr(tag13)].join(' # ');
  P.ok('Blatt der Einheit nennt Dauer und Puls von der Uhr; ohne Puls „fehlt noch“; ohne Training auf der Uhr keine Zeile', uhr3 === 'Apple Watch · 62 min · Ø Puls 145 # Apple Watch · 45 min · Puls fehlt noch # (keine)', uhr3);
  await o12.browser.close();
  await P.ende(null, fehler.concat(w.fehler, g.fehler, r.fehler, e.fehler, b5.fehler, h6.fehler, o7.fehler, o8.fehler, o9.fehler, o10.fehler, o11.fehler, o12.fehler));
});
