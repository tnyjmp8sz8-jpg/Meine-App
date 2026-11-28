// Gym: Recap für Monat und Jahr, Verbesserung gesamt und je Übung, laufendes Training mit „Letztes Mal“.
// Kleiner, von Hand nachgerechneter Datensatz: eine Übung, fünf Einheiten im Vormonat, eine heute.
const { APP, oeffnen, text, bereich, gespeichert, pruefer, lauf, tag, monat, nachOben, zahlWahl, einstellungen, einstSeite, einstZeilen } = require('./lib');
/* Seit v148 liegen „Übungen“ und „Einheiten“ (im Jahr „Monate“ und „Übungen“) in einer Leiste, von der immer nur ein Teil offen ist: Vor dem Tipp auf eine Übung die Liste öffnen */
const uebAuf = async pg => { if (!(await pg.$('#v-training .folds [data-k="ex"]'))) { await pg.click('#v-training [data-fold="uebungen"]'); await pg.waitForTimeout(80); } };

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
  P.enthaelt('Übungsliste zeigt die Verbesserung im Monat', await text(page, '#v-training .folds [data-k="ex"]'), ['Rudern', '+10,0 %']);
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

  // Blatt der Übung aus der Liste: Recap startet beim gewählten Monat. Seit v148 liegen „Monate“ und „Übungen“ im Jahr in einer Leiste: Das Öffnen der Monate hat die Übungen geschlossen
  await uebAuf(page); await page.click('#v-training .folds [data-k="ex"]'); await page.waitForTimeout(250);
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
     Vorgabe (Bereich 6–10 Wdh, an beiden Übungen als z: 10 gesetzt; ohne Angabe gälte seit v107 8–12): „Voll“ zuletzt 40×10, 40×10, 40×10 → alle am Ziel, Schritt 2,5 kg: 42,5 kg mit (53,33 / 42,5 − 1) × 30 = 7,6 → 7 Wdh; 1RM 42,5 × (1 + 7/30) = 52,4.
     „Stufen“ zuletzt 55×5, 50×7, 50×6 → je eine Wiederholung mehr: 55×6, 50×8, 50×7. */
  const K3 = { ex: { s: { n: 'Steht' }, f: { n: 'Fällt' }, g: { n: 'Steigt' }, n: { n: 'Neu' }, v: { n: 'Voll', z: 10 }, u: { n: 'Stufen', z: 10 } }, log: {},
    plans: { p: { n: 'Probe', items: [{ id: 'v', sets: 3 }, { id: 'u', sets: 3 }] }, q: { n: 'Zweiter', items: [{ id: 's', sets: 1 }] } }, meta: {}, live: null };
  const reihen = { s: [50, 50, 50, 50, 50, 40], f: [60, 60, 60, 55, 55, 60], g: [40, 40, 40, 44, 44, 40] };
  [20, 17, 14, 11, 8, 5].forEach((n, i) => { const d = K3.log[tag(n)] = {}; for (const id in reihen) d[id] = [[reihen[id][i], 10]]; if (i > 2) d.n = [[20, 10]]; });
  K3.log[tag(5)].v = [[40, 10], [40, 10], [40, 10]]; K3.log[tag(5)].u = [[55, 5], [50, 7], [50, 6]];
  // Körpergewicht: am 10. des Vormonats 90,0 kg, heute 91,2 kg (mehr als 6 Tage Abstand, der Schnitt von heute ist also 91,2) → im laufenden Monat +1,2 kg
  const g = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: K3, W: { entries: { [vm + '-10']: 90, [heute]: 91.2 } } } }), q = g.page;
  await bereich(q, 'training'); await q.click('#v-training .subtabs [data-v="kraft"]'); await q.click('#v-training [data-fold="uebungen"]');
  await q.click('#v-training [data-fold="uebungenAlt"]');   // seit v99 stehen oben nur die Übungen aus den Plänen (Voll, Stufen, Steht), die übrigen hinter „Weitere Übungen“
  const punkte = await q.$$eval('#v-training .folds [data-k="ex"]', l => l.map(b => b.querySelector('.l > span').textContent + ':' + ((b.querySelector('.td') || {}).className || 'ohne')).sort().join(' '));
  P.ok('Punkte in der Übungsliste: fällt rot, steht gelb (trotz einer schlechten Einheit), steigt grün, unter vier Einheiten keiner', punkte === 'Fällt:td down Neu:ohne Steht:td flat Steigt:td up Stufen:ohne Voll:ohne', punkte);
  const farbe = await q.evaluate(() => { const f = c => getComputedStyle(document.querySelector('#v-training .td' + c)).backgroundColor; return [f('.up'), f('.flat'), f('.down')]; });
  P.ok('drei verschiedene Farben', new Set(farbe).size === 3, farbe.join(' · '));
  const trend = async name => { await q.click('#v-training .folds [data-k="ex"]:has-text("' + name + '")'); await q.waitForTimeout(150); const t = await text(q, '#x-stats .trend'); await q.click('#xs-close'); return t; };
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
  // Bereich 8–12 statt 6–10 (v107: Liste der Bereiche ohne Tasten, der jetzige ist markiert): 40×10 liegt jetzt unter dem oberen Ende → 40×11. Der Bereich steht an der Übung (K.ex.v.zu und z).
  P.ok('der Bereich steht unter dem Namen: „Ziel 6–10 Wdh“', (await text(q, '#l-items [data-la="ziel"]')) === 'Ziel 6–10 Wdh', await text(q, '#l-items [data-la="ziel"]'));
  await q.click('#l-items [data-la="ziel"]'); await q.waitForTimeout(80);
  const bl = await q.evaluate(() => ({ liste: [...document.querySelectorAll('#z-list button')].map(b => b.textContent).join(' | '), wahl: (document.querySelector('#z-list [aria-pressed="true"]') || {}).textContent, tasten: !document.querySelector('#z-pad').hidden && document.querySelector('#z-pad').getBoundingClientRect().height > 0 }));
  P.ok('Bereich wählen: sieben Bereiche, 6–10 markiert, keine Tasten', bl.liste === '3–6 Wdh | 5–8 Wdh | 6–10 Wdh | 8–12 Wdh | 10–15 Wdh | 12–20 Wdh | 15–20 Wdh' && bl.wahl === '6–10 Wdh' && !bl.tasten, JSON.stringify(bl));
  await q.click('#z-list [data-zv="812"]'); await q.waitForTimeout(80);
  const exV = (await gespeichert(q)).K.ex.v;
  P.ok('neuer Bereich 8–12: offene Sätze bekommen die passende Vorgabe (40×11), der Bereich ist gespeichert', (await saetze()) === '40×11 40×11 40×11' && exV.z === 12 && exV.zu === 8 && (await text(q, '#l-items [data-la="ziel"]')) === 'Ziel 8–12 Wdh', await saetze() + ' ' + JSON.stringify(exV));
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
  P.ok('seit v141 keine Zeile „Körpergewicht im …“ unter den Kennzahlen (sein Wort: „zu viel“)', !(await q.$('#v-training .kw')) && !(await text(q, '#v-training')).includes('Körpergewicht'));
  // Blatt der Übung: Die Einheit von heute ist der Rekord, 60 / 53,33 − 1 = +12,5 %
  await uebAuf(q); await q.click('#v-training .folds [data-k="ex"]:has-text("Voll")'); await q.waitForTimeout(150);
  P.enthaelt('Blatt der Übung: „Rekord · +12,5 %“ an der Einheit von heute', await text(q, '#x-recap .lastx .note'), ['Rekord · +12,5 %']);
  await q.click('#xs-close'); await q.reload(); await q.waitForTimeout(300);
  P.ok('nach neuem Laden: Der Bereich 8–12 steht noch an der Übung', (await gespeichert(q)).K.ex.v.z === 12 && (await gespeichert(q)).K.ex.v.zu === 8);
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
  /* Seit v126 steht die Liste fest in seiner Reihenfolge (von v106 bis v125 rückte nach oben, was dran ist), und die Überschrift zählt Einheiten eines Plans */
  P.ok('feste Reihenfolge (v126): Torso A und Extremitäten erledigt, Torso B ist dran und bleibt auf Platz 3; Überschrift „Plan“ mit „2 von 3 Einheiten“', (await plaene()) === 'Torso A:is-done: | Extremitäten:is-done: | Torso B:is-idle:3' && /^Plan\s*2 von 3 Einheiten/.test(await text(s, '#v-training h2.sec')), (await plaene()) + ' · ' + (await text(s, '#v-training h2.sec')));
  /* Übungen (v90, v97): „Rudern“ war in den vier Wochen bis zur jüngsten Einheit dran (vor 4 Tagen), „Uralt“ zuletzt vor 60 Tagen → liegt in derselben Liste hinter der letzten Zeile
     „Weitere Übungen“ (bis v96 eine eigene, dritte Klappzeile unter „Einheiten“; seit v99 steht oben, was in einem Plan steht: „Rudern“, und „Uralt“ steht in keinem). Zu sind nur „Übungen“ und „Einheiten“ zu sehen; die Zeilen entstehen erst beim Aufklappen.
     Mit der Liste geht auch ihr älterer Teil wieder zu. Kein Plan trägt mehr ein Play-Zeichen: Jeder Kreis ist ein Ring mit Haken oder Zahl. */
  const kl = async () => [await text(s, '#v-training .folds [data-fold]'), await text(s, '#v-training .folds [data-k="ex"] .l > span')].join(' # ');
  /* „Einheiten“ gibt es nur, wenn im laufenden Monat trainiert wurde: Die Einheiten liegen 9, 6 und 4 Tage zurück, am Monatsanfang also im Vormonat (dann fehlt die Zeile) */
  const nE = [9, 6, 4].filter(n => tag(n).slice(0, 7) === heute.slice(0, 7)).length, eT = nE ? ' | Einheiten ' + nE : '';
  const zuerst = await kl(); await s.click('#v-training [data-fold="uebungen"]'); await s.waitForTimeout(100);
  const offen = await kl(); await s.click('#v-training [data-fold="uebungenAlt"]'); await s.waitForTimeout(100);
  P.ok('zu: nur „Übungen“ und (wenn im laufenden Monat trainiert wurde) „Einheiten“', zuerst === 'Übungen 1' + eT + ' # ', zuerst);
  P.ok('„Übungen“ offen: die der letzten vier Wochen, als letzte Zeile „Weitere Übungen“ vor „Einheiten“', offen === 'Übungen 1' + eT + ' | Weitere Übungen 1 # Rudern', offen);   // seit v148 stehen „Übungen“ und „Einheiten“ vorn in einer Leiste
  P.ok('„Weitere Übungen“ offen: die Übung ohne Plan steht darunter', (await kl()) === 'Übungen 1' + eT + ' | Weitere Übungen 1 # Rudern | Uralt', await kl());
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
  /* Blatt „Plan“ (v126): „Anpassen“ in der Überschrift öffnet es; es zeigt die Einheiten in ihrer Reihenfolge mit der Zahl ihrer Übungen. „Einheit hinzufügen“ öffnet darüber das Blatt der Einheit. */
  const oListe = () => s.$$eval('#o-items .prow', l => l.map(z => z.querySelector('b').firstChild.textContent + ':' + z.querySelector('small').textContent).join(' | '));
  const platz = async () => Object.values((await gespeichert(s)).K.plans).filter(Boolean).sort((a, b) => a.o - b.o).map(p => p.n + ':' + p.o).join(' ');
  await s.click('#v-training h2.sec [data-k="ordnen"]'); await s.waitForTimeout(100);
  P.ok('„Anpassen“ öffnet das Blatt „Plan“ mit den drei Einheiten in ihrer Reihenfolge', await s.evaluate(() => document.querySelector('#osheet').open && document.querySelector('#os-title').textContent === 'Plan') && (await oListe()) === 'Torso A:1 Übung | Extremitäten:1 Übung | Torso B:1 Übung', await oListe());
  await s.click('#o-add'); await s.waitForTimeout(100);
  P.ok('„Einheit hinzufügen“ öffnet das Blatt „Neue Einheit im Plan“ über dem Blatt „Plan“', (await text(s, '#ps-title')) === 'Neue Einheit im Plan' && await s.evaluate(() => document.querySelector('#osheet').open && document.querySelector('#psheet').open));
  await s.fill('#p-name', 'Arme'); await s.fill('#p-new', 'Rudern'); await s.click('#p-new-add'); await s.click('#psheet button[type="submit"]'); await s.waitForTimeout(200);
  const neuerPlan = Object.values((await gespeichert(s)).K.plans).find(p => p && p.n === 'Arme');
  P.ok('neue Einheit trägt Platz 4, ist als Nächstes dran und steht am Ende (auch im Blatt „Plan“, das offen bleibt)', (await plaene()) === 'Torso A:is-done: | Extremitäten:is-done: | Torso B:is-done: | Arme:is-idle:4' && neuerPlan.o === 4 && (await oListe()).endsWith('| Arme:1 Übung') && await s.evaluate(() => document.querySelector('#osheet').open && !document.querySelector('#psheet').open), (await plaene()) + ' · ' + (await oListe()));
  /* Ziehen am Griff: „Arme“ (Platz 4) über die erste Zeile → Arme 1, Torso A 2, Extremitäten 3, Torso B 4. Gespeichert wird sofort, Name und Übungen bleiben.
     Runde danach: Ereignisse nach Tag (vor 9 Tagen Torso B, vor 6 Torso A, vor 4 Extremitäten, heute Torso B); von hinten gelesen gehören zur Runde, solange der Platz kleiner wird:
     Torso B (4), Extremitäten (3), Torso A (2), dann Torso B (4) nicht mehr. Zuletzt war der letzte Platz dran → voll, heute trainiert → drei Haken bleiben, Arme wartet auf Platz 1. */
  const ziehe = async (von, nach) => { const b = await s.evaluate(([a, z]) => { const l = [...document.querySelectorAll('#o-items .prow')], g = l[a].querySelector('.griff').getBoundingClientRect(), t = l[z].getBoundingClientRect(); return { x: g.left + g.width / 2, y: g.top + g.height / 2, zy: t.top + (z < a ? 4 : t.height - 4) }; }, [von, nach]);
    await s.mouse.move(b.x, b.y); await s.mouse.down(); await s.mouse.move(b.x, (b.y + b.zy) / 2, { steps: 4 }); await s.mouse.move(b.x, b.zy, { steps: 4 }); await s.mouse.up(); await s.waitForTimeout(150); };
  await ziehe(3, 0);
  const armeNach = Object.values((await gespeichert(s)).K.plans).find(p => p && p.n === 'Arme');
  P.ok('Arme an den Anfang gezogen: Plätze 1 bis 4 neu gespeichert, Name und Übungen bleiben, Blatt und Gym zeigen die neue Reihenfolge',
    (await platz()) === 'Arme:1 Torso A:2 Extremitäten:3 Torso B:4' && armeNach.items.length === 1 && (await oListe()) === 'Arme:1 Übung | Torso A:1 Übung | Extremitäten:1 Übung | Torso B:1 Übung' && (await plaene()) === 'Arme:is-wait:1 | Torso A:is-done: | Extremitäten:is-done: | Torso B:is-done:', (await platz()) + ' · ' + (await oListe()) + ' · ' + (await plaene()));
  await ziehe(0, 3);
  P.ok('und wieder ans Ende gezogen: die alte Reihenfolge, Arme ist wieder dran', (await platz()) === 'Torso A:1 Extremitäten:2 Torso B:3 Arme:4' && (await plaene()) === 'Torso A:is-done: | Extremitäten:is-done: | Torso B:is-done: | Arme:is-idle:4', (await platz()) + ' · ' + (await plaene()));
  await s.click('#o-items .o-go[aria-label^="Torso A"]'); await s.waitForTimeout(100);
  P.ok('Tipp auf eine Zeile öffnet die Einheit: „Einheit im Plan“ mit ihrem Namen, löschen heißt „Aus dem Plan löschen“', (await text(s, '#ps-title')) === 'Einheit im Plan' && (await s.inputValue('#p-name')) === 'Torso A' && (await text(s, '#p-del')) === 'Aus dem Plan löschen');
  await s.click('#ps-close'); await s.click('#os-close'); await s.waitForTimeout(100);
  P.ok('beide Blätter sind zu', await s.evaluate(() => !document.querySelector('dialog[open]')));

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
  await einstellungen(e.page);
  await wahl('Plaene.csv', '"Plan X · 52 Wochen";2026-01-01\n"Tag 1 · Torso"\n"1. Dips · Körpergewicht";"3 Sätze";"8 Wdh"\n'); await e.page.waitForTimeout(200);
  P.ok('Datei mit den Plänen: Hinweis auf die Datei „Workouts“, nichts eingelesen', (await text(e.page, '#bk-msg')).includes('„Workouts“') && !Object.keys(((await gespeichert(e.page)).K || {}).log || {}).length, await text(e.page, '#bk-msg'));
  await wahl('Workouts.csv', csv); await e.page.waitForTimeout(300);
  const aus = (await gespeichert(e.page)).K, an = Object.values(aus.ex).map(x => x.n + (x.z ? ' z' + x.z : '')).sort().join(' | '), dips = Object.keys(aus.ex).find(i => aus.ex[i].n === 'Dips');
  P.ok('Übernahme: Meldung nennt Einheiten und Pläne', (await text(e.page, '#bk-msg')) === '2 Einheiten aus Alpha Progression übernommen, dazu die Pläne Torso A, Torso B. Du findest alles unter Training → Gym.', await text(e.page, '#bk-msg'));
  P.ok('Übernahme: Übungen mit Namen wie selbst eingetippt und Ziel, ohne Sauna und Laufen; Dips mit Körpergewicht, die Einheit trägt ihren Namen', an === 'Curls Kurzhanteln | Curls Langhantel | Dips z8' && aus.ex[dips].bw === 1 && aus.meta['2026-02-20'].n === 'Alt', an + ' · ' + JSON.stringify(aus.meta['2026-02-20']));
  P.ok('Übernahme: ein Tag, eine Einheit mit 90 min; Zusatzgewicht und Satz ohne Gewicht; 24 Std. zählt nicht', Object.keys(aus.log).sort().join() === '2026-02-20,2026-03-02' && aus.meta['2026-03-02'].dur === 5400 && JSON.stringify(aus.log['2026-03-02'][dips]) === '[[15,9],[0,7]]' && aus.meta['2026-02-20'].dur === 0, JSON.stringify(aus.meta));
  P.ok('Übernahme: Pläne „Torso A“ (Platz 1, Dips 2 Sätze) und „Torso B“ (Platz 2, Curls 1 Satz), die Einheit nennt Torso A', Object.values(aus.plans).map(p => p.n + ':' + p.o + ':' + p.items.map(i => aus.ex[i.id].n + ' ' + i.sets).join()).join(' | ') === 'Torso A:1:Dips 2 | Torso B:2:Curls Kurzhanteln 1' && aus.plans[aus.meta['2026-03-02'].plan].n === 'Torso A', JSON.stringify(aus.plans));
  await e.page.click('#es-close'); await bereich(e.page, 'training');
  P.enthaelt('beide Pläne stehen im Gym', await text(e.page, '#v-training .rows.one .name'), ['Torso A', 'Torso B']);
  await e.browser.close();

  // --- Übungen mit dem eigenen Körper, Name der Einheit, fest eingebaute Trainings (v89) ---
  /* Körpergewicht 90 kg (ein Eintrag vor 30 Tagen, gilt für alle Tage danach). Dips und Klimmzüge tragen bw: Gerechnet wird mit Körpergewicht plus Zusatzgewicht.
     Dips: vor 10 Tagen +10 kg × 11 → 100 × (1 + 11/30) = 136,67. Heute +15 kg × 11 → 105 × 41/30 = 143,5 → +5,0 % und Rekord (ohne Körpergewicht wären es +50 %).
     Klimmzüge: vor 10 Tagen +10 kg × 9 → 100 × 1,3 = 130. Heute ohne Gewicht × 12 → 90 × 1,4 = 126 → −3,1 % (ohne Körpergewicht gäbe es keinen Vergleich).
     Vorgabe Dips (Bereich 6–10 über z: 10, heute 11 geschafft; Schritt 5 kg, weil +10 und +15 vorkamen): +20 kg mit (143,5 / 110 − 1) × 30 = 9,1 → 9 Wdh; 1RM 110 × 1,3 = 143.
     Ohne Körpergewicht wären es (15 × 41/30 / 20 − 1) × 30 = 0,75 → 1 Wiederholung.
     Die Einheit von heute hat keinen Plan, aber einen Namen („Pull A“): Er steht in der Liste wie sonst der Plan. */
  const K5 = { ex: { d: { n: 'Dips', bw: 1, z: 10 }, k: { n: 'Klimmzüge', bw: 1 } }, log: { [tag(10)]: { d: [[10, 11]], k: [[10, 9]] }, [heute]: { d: [[15, 11]], k: [[0, 12]] } },
    plans: { p: { n: 'Körper', items: [{ id: 'd', sets: 1 }], o: 1 } }, meta: { [heute]: { dur: 0, plan: null, n: 'Pull A' } }, live: null };
  const b5 = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: K5, W: { entries: { [tag(30)]: 90 } } } }), t = b5.page;
  await bereich(t, 'training'); await t.click('#v-training [data-fold="einheiten"]');   // seit v148 in einer Leiste mit „Übungen“: immer nur eines offen
  P.enthaelt('Einheit ohne Plan zeigt ihren Namen', await text(t, '#v-training [data-k="day"][data-d="' + heute + '"]'), ['Pull A', '1 Rekord']);
  await t.click('#v-training [data-fold="uebungen"]'); await t.click('#v-training [data-fold="uebungenAlt"]');   // Klimmzüge stehen in keinem Plan: seit v99 hinter „Weitere Übungen“
  const blattVon = async name => { await t.click('#v-training .folds [data-k="ex"]:has-text("' + name + '")'); await t.waitForTimeout(150); const x = [await text(t, '#x-stats .fig'), await text(t, '#x-recap .lastx:first-child .note'), await text(t, '#x-recap .lastx:first-child .lt-r')].join(' # '); await t.click('#xs-close'); return x; };
  const dipsK = await blattVon('Dips'), klimm = await blattVon('Klimmzüge');
  P.ok('Dips mit Körpergewicht: Zusatzgewicht 15 kg, 1RM 143,5, „Rekord · +5,0 %“', dipsK.includes('15kg Zusatzgewicht') && dipsK.includes('143,5kg 1RM geschätzt') && dipsK.includes('Pull A Rekord · +5,0 %') && dipsK.endsWith('1 15 11 143,5'), dipsK);
  P.ok('Klimmzüge: Einheit ohne Gewicht ist mit der mit Zusatzgewicht vergleichbar (−3,1 %, 1RM 126)', klimm.includes('−3,1 %') && klimm.endsWith('1 – 12 126'), klimm);
  await t.click('#v-training [data-k="start"]'); await t.waitForTimeout(300);
  const v5 = await t.$$eval('#l-items .lx > .lt .lt-r', l => l.map(z => [...z.children].slice(1, 4).map(c => c.textContent).join('×')).join(' '));
  P.ok('Vorgabe rechnet mit dem Körpergewicht: +20 kg × 9, 1RM 143', v5 === '20×9×143', v5);
  await t.click('#l-del'); await t.click('#l-del'); await b5.browser.close();

  /* Seine Pläne stehen fest in der App (Block start-gym) und kommen beim ersten Start von selbst. Seit v112 ohne die alten Einheiten (sein Neuanfang ab Montag, 23.11.2026):
     3 Pläne, ihre 15 Übungen, keine Einheit. Der Merker takt.start trägt den Stand: Was er danach löscht, kommt beim nächsten Start nicht zurück. */
  const h6 = await oeffnen({ historie: true }), u = h6.page, K6 = (await gespeichert(u)).K, stand = await u.evaluate(() => document.querySelector('#start-gym').dataset.stand);
  const merker6 = await u.evaluate(() => [localStorage.getItem('takt.start'), localStorage.getItem('takt.neu'), localStorage.getItem('takt.gymAlt')].join('|'));
  P.ok('erster Start: 3 Pläne und ihre 15 Übungen sind da, keine Einheit; die Merker stehen, eine Kopie gibt es nicht (nichts gelöscht)', Object.keys(K6.log).length === 0 && Object.values(K6.ex).filter(Boolean).length === 15 && Object.values(K6.plans).filter(Boolean).length === 3 && merker6 === '2026-11-20|2026-11-23|', Object.keys(K6.log).length + ' · ' + merker6);
  P.ok('Dips und Klimmzüge rechnen mit Körpergewicht, Namen ohne Klammern', Object.values(K6.ex).filter(x => x.bw).map(x => x.n).sort().join() === 'Dips,Klimmzüge weit mit Obergriff' && !Object.values(K6.ex).some(x => /[()]/.test(x.n)));
  await bereich(u, 'training');
  /* Seine Reihenfolge steht in den Plänen (o); die Zahl im Ring nennt den Platz */
  const reihe6 = Object.values((await gespeichert(u)).K.plans).filter(Boolean).sort((a, b) => a.o - b.o).map(x => x.n).join(' | ');
  const ringe6 = await u.$$eval('#v-training .rows.one .row', l => l.map(r => r.querySelector('.name').textContent + (r.classList.contains('is-done') ? '' : ':' + r.querySelector('.glyph').textContent)).sort().join(' | '));
  P.ok('seine drei Pläne in seiner Reihenfolge (Torso A, Extremitäten, Torso B), die Ringe nennen den Platz', reihe6 === 'Torso A | Extremitäten | Torso B' && ['Extremitäten', 'Torso A', 'Torso B'].every(n => ringe6.includes(n)) && !/Torso A:[^1]|Extremitäten:[^2]|Torso B:[^3]/.test(ringe6), reihe6 + ' · ' + ringe6);
  await u.evaluate(() => { const d = JSON.parse(localStorage.getItem('takt.v1')), id = Object.keys(d.K.plans).find(k => d.K.plans[k].n === 'Torso B'); delete d.K.plans[id]; localStorage.setItem('takt.v1', JSON.stringify(d)); });
  await u.reload(); await u.waitForTimeout(300);
  P.ok('zweiter Start: nichts wird noch einmal eingelesen, ein gelöschter Plan bleibt weg', Object.values((await gespeichert(u)).K.plans).filter(Boolean).length === 2);
  /* Neu beginnen (v112): einmal je Gerät gehen alle Einheiten vor dem 23.11.2026. Hier so nachgestellt, wie es auf seinem iPhone liegt: Einheiten am 20.11. (alt), 23.11. und 24.11.,
     dazu Dauer, Übersprungenes und Werte der Uhr am alten Tag; „Uralt“ kommt nur in der alten Einheit vor, „Bank“ auch am 23.11., „Curls“ steht nur in einem Plan.
     Danach: 2 Einheiten, „Uralt“ ist weg, „Bank“ und „Curls“ bleiben (mit Bereich und Schritt), die Kopie auf dem Gerät trägt, was ging. Ein zweiter Start löscht nichts mehr. */
  await u.evaluate(() => { const d = JSON.parse(localStorage.getItem('takt.v1'));
    d.K = { ex: { u: { n: 'Uralt' }, b: { n: 'Bank', z: 10, st: 5 }, c: { n: 'Curls' } }, log: { '2026-11-20': { u: [[10, 10]], b: [[40, 10]] }, '2026-11-23': { b: [[40, 11]] }, '2026-11-24': { b: [[40, 12]] } },
      plans: { p: { n: 'Arme', items: [{ id: 'c', sets: 3 }] } }, meta: { '2026-11-20': { dur: 600, plan: null }, '2026-11-23': { dur: 700, plan: null } }, aus: { '2026-11-19': { p: 1 } }, uhr: { '2026-11-20': { s: 600, hr: 120 } }, live: null };
    localStorage.setItem('takt.v1', JSON.stringify(d)); localStorage.removeItem('takt.neu'); });
  await u.reload(); await u.waitForTimeout(300);
  const K6n = (await gespeichert(u)).K, alt6 = await u.evaluate(() => JSON.parse(localStorage.getItem('takt.gymAlt') || 'null'));
  P.ok('Neu beginnen: nur die Einheiten ab dem 23.11. bleiben, mit ihrer Dauer; Übersprungenes und Uhr von davor sind weg', Object.keys(K6n.log).join() === '2026-11-23,2026-11-24' && Object.keys(K6n.meta).join() === '2026-11-23' && !Object.keys(K6n.aus).length && !Object.keys(K6n.uhr).length, JSON.stringify(K6n.log));
  P.ok('… die Übung ohne Einheit und ohne Plan ist weg, die anderen bleiben mit Bereich und Schritt', Object.keys(K6n.ex).sort().join() === 'b,c' && K6n.ex.b.z === 10 && K6n.ex.b.st === 5 && K6n.plans.p.n === 'Arme', JSON.stringify(K6n.ex));
  P.ok('… was ging, liegt als Kopie auf dem Gerät (takt.gymAlt)', !!alt6 && JSON.stringify(alt6.log['2026-11-20']) === '{"u":[[10,10]],"b":[[40,10]]}' && alt6.ex.u.n === 'Uralt' && alt6.meta['2026-11-20'].dur === 600 && alt6.uhr['2026-11-20'].s === 600 && alt6.aus['2026-11-19'].p === 1, JSON.stringify(alt6));
  await u.evaluate(() => { const d = JSON.parse(localStorage.getItem('takt.v1')); d.K.log['2026-11-01'] = { b: [[30, 10]] }; localStorage.setItem('takt.v1', JSON.stringify(d)); });
  await u.reload(); await u.waitForTimeout(300);
  P.ok('zweiter Start danach: Es wird nichts mehr gelöscht (eine später eingelesene alte Einheit bleibt)', Object.keys((await gespeichert(u)).K.log).length === 3);
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
  await uebAuf(gp); await gp.click('#v-training .folds [data-k="ex"]:has-text("Curls")'); await gp.waitForTimeout(150);
  P.ok('Blatt der Übung: Gruppe aus dem Namen vorgewählt (Arme)', (await text(gp, '#x-grp [aria-pressed="true"]')) === 'Arme' && (await text(gp, '#x-grp .chip')) === 'Rücken | Brust | Arme | Beine');
  await gp.click('#x-grp [data-g="brust"]'); await gp.click('#x-save'); await gp.waitForTimeout(150);
  const gex = (await gespeichert(gp)).K.ex;
  P.ok('Gruppe gewählt und gespeichert: Curls stehen unter Brust, „Arme“ entfällt', gex.c.g === 'brust' && (await gListe()) === '[Rücken] Latzug Rudern mit Brustauflage [Brust] Bankdrücken Curls Dips [Beine] Beinpresse [Sonstige] Seitheben Weitere Übungen1', await gListe());
  P.ok('gespeicherte Gruppe bleibt beim Laden, eine unbekannte wird verworfen', gex.g.g === 'brust' && !gex.h.g, JSON.stringify(gex));
  await o11.browser.close();
  /* Pausen-Uhr (seit v106 nur ein laufender Timer, sein Wunsch: „nur als laufender Timer ohne Grenze oder Signal“). Die Uhr der Seite steht auf dem 15. des laufenden Monats, 12 Uhr,
     und läuft nur, wenn der Test sie vorstellt; die iPhone-Hülle ist nachgestellt und sammelt, was hinausgeht. Plan mit einer Übung „Rudern“ und drei Sätzen.
     Vor dem ersten Satz steht „Pause“. Erster Satz abgehakt, 5 s später „0:05“, 90 s später „1:35“, nach 10 Minuten „10:35“ (keine Grenze). Zweiter Satz abgehakt: wieder „0:00“.
     Die Kapsel ist kein Knopf, oben neben der Gesamtzeit steht keine Pause (die Angabe steht nur einmal), an die iPhone-App geht nie eine Nachricht „pause“, und es gibt keinen Impuls „erfolg“. */
  const hStub = () => { window.__post = []; window.webkit = { messageHandlers: { track: { postMessage: o => window.__post.push(JSON.parse(JSON.stringify(o))) } } }; };
  const mitte = new Date(+heute.slice(0, 4), +heute.slice(5, 7) - 1, 15, 12);
  const o12 = await oeffnen({ uhr: mitte, skript: hStub, daten: { S: { routines: [], running: null }, LY: {}, K: { ex: { a: { n: 'Rudern' } }, log: {}, meta: {}, live: null, plans: { p: { n: 'Torso', items: [{ id: 'a', sets: 3 }], o: 1 } } } } }), z = o12.page;
  const vor = async ms => { await z.clock.fastForward(ms); await z.waitForTimeout(60); };
  const kapsel = () => z.evaluate(() => document.querySelector('#l-rest-t').textContent + ' | ' + document.querySelector('.ls-t').textContent.replace(/[\d:]/g, '').trim());
  await bereich(z, 'training'); await z.click('#v-training [data-k="start"]'); await z.waitForTimeout(200);
  await zahlWahl(z, '#l-w', '40'); await zahlWahl(z, '#l-r', '10');
  const vor1 = await kapsel(); await z.click('#l-items .chk'); await vor(5000); const fuenf = await kapsel();
  await vor(90000); const p95 = await kapsel(); await vor(540000); const zehn = await kapsel();
  P.ok('Pause zählt nach dem Satz hoch, ohne Grenze: „Pause“, dann 0:05, 1:35, 10:35; oben steht nur die Gesamtzeit', vor1 === 'Pause | ' && fuenf === '0:05 | ' && p95 === '1:35 | ' && zehn === '10:35 | ', [vor1, fuenf, p95, zehn].join(' · '));
  await z.click('#l-items .chk'); await z.waitForTimeout(80);
  P.ok('nächster Satz abgehakt: die Pause beginnt wieder bei 0:00', (await kapsel()) === '0:00 | ', await kapsel());
  const art = await z.evaluate(() => ({ knopf: document.querySelector('#l-rest').tagName, pause: window.__post.filter(m => m.art === 'pause').length, erfolg: window.__post.filter(m => m.art === 'haptik' && m.w === 'erfolg').length }));
  P.ok('kein Knopf, kein Signal: keine Nachricht „pause“ an die iPhone-App, kein Impuls am Ende einer Pause', art.knopf === 'SPAN' && art.pause === 0 && art.erfolg === 0, JSON.stringify(art));
  await z.click('#l-save'); await z.waitForTimeout(200); await z.click('#rs-ok');
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
  /* v106: stärkste und schwächste Übung, Umsortieren im Plan per Ziehen, großer Titel, Zahlen für das Widget, Tippflächen.
     Uhr: 15. des laufenden Monats, 12 Uhr. Pläne: Torso (Rudern, Curls, Platz 1), Beine (Curls, Platz 2). Torso am 10. trainiert → Beine ist dran, heute noch nichts.
     Rudern: Vormonat 40 × 10 (1RM 40 · (1 + 10/30) = 53,33), am 10. 44 × 10 (58,67) → +10,0 %. Curls: 10 × 10 (13,33), dann 10 × 8 (12,67) → −5,0 %. */
  const ym13 = heute.slice(0, 7), mitte13 = new Date(+heute.slice(0, 4), +heute.slice(5, 7) - 1, 15, 12);
  const hStub13 = () => { window.__post = []; window.webkit = { messageHandlers: { track: { postMessage: o => window.__post.push(JSON.parse(JSON.stringify(o))) } } }; };
  const K13 = { ex: { a: { n: 'Rudern' }, b: { n: 'Curls' } }, live: null, log: { [vm + '-10']: { a: [[40, 10]], b: [[10, 10]] }, [ym13 + '-10']: { a: [[44, 10]], b: [[10, 8]] } },
    meta: { [vm + '-10']: { dur: 1800, plan: 'p1' }, [ym13 + '-10']: { dur: 1800, plan: 'p1' } }, plans: { p1: { n: 'Torso', items: [{ id: 'a', sets: 3 }, { id: 'b', sets: 3 }], o: 1 }, p2: { n: 'Beine', items: [{ id: 'b', sets: 3 }], o: 2 } } };
  const o13 = await oeffnen({ uhr: mitte13, skript: hStub13, daten: { S: { routines: [], running: null }, LY: {}, K: K13 } }), wp = o13.page;
  await wp.waitForTimeout(500);
  // v109 (sein Bildschirmfoto vom 25.11.: „ich will auf heute das nicht sehen mit gym“): Auf Heute steht kein Plan mehr, auch wenn einer dran ist
  P.ok('auf Heute steht kein Plan und kein Knopf zum Starten', await wp.evaluate(() => !document.querySelector('#v-heute .dran, #v-heute [data-k="start"]') && !document.querySelector('#v-heute').textContent.includes('Heute dran')));
  const zahlen = await wp.evaluate(() => { const st = window.__post.filter(m => m.art === 'stand').pop(); return st ? st.zahlen.map(z => z.b + ':' + z.t + ':' + z.w + ':' + z.s).join(' | ') : 'kein Stand'; });
  P.ok('Widget „Überblick“: Gym mit dem Plan, der heute dran ist (keine Läufe, kein Gewicht, keine Finanzen → nur diese Kachel)', zahlen === 'training:Gym:Beine:heute dran', zahlen);
  await bereich(wp, 'training');
  P.ok('seit v141 keine Karte „Stärkste / Schwächste Übung“ (sein Wort: „unten zu viel“)', !(await wp.$('#v-training .best')) && !(await text(wp, '#v-training')).includes('Stärkste Übung'));
  await wp.click('#v-training [data-k="plan"][data-id="p1"]'); await wp.waitForTimeout(200);
  const g0 = await wp.$('#p-items .prow:first-child .griff'), b0 = await g0.boundingBox(), b1 = await (await wp.$('#p-items .prow:nth-child(2)')).boundingBox();
  await wp.mouse.move(b0.x + b0.width / 2, b0.y + b0.height / 2); await wp.mouse.down();
  for (let k = 1; k <= 6; k++) await wp.mouse.move(b0.x + b0.width / 2, b0.y + b0.height / 2 + (b1.y + b1.height / 2 + 6 - b0.y - b0.height / 2) * k / 6);
  await wp.mouse.up(); await wp.waitForTimeout(100);
  const nachZug = await text(wp, '#p-items .prow b');
  await wp.click('#p-save'); await wp.waitForTimeout(150);
  P.ok('Übungen im Plan per Ziehen am Griff umsortiert: Curls vor Rudern, gespeichert', nachZug === 'Curls | Rudern' && (await gespeichert(wp)).K.plans.p1.items.map(x => x.id).join() === 'b,a', nachZug);
  /* Großer Titel: bei kleinem Fenster lässt sich scrollen; ab 24 px wird er klein und gleitet in die Mitte (scale .62), oben wieder groß */
  await wp.setViewportSize({ width: 390, height: 420 });
  const titel = async y => { await wp.evaluate(v => { const sc = document.querySelector('#scroll'); sc.scrollTop = v; sc.dispatchEvent(new Event('scroll')); }, y); await wp.waitForTimeout(50);
    return wp.evaluate(() => { const t = document.querySelector('.top'), m = document.querySelector('.mark'), r = m.getBoundingClientRect(), tr = t.getBoundingClientRect();
      return t.classList.contains('klein') + ' ' + new DOMMatrixReadOnly(getComputedStyle(m).transform).a.toFixed(2) + ' ' + (Math.abs(r.left + r.width / 2 - (tr.left + tr.width / 2)) < 2); }); };
  const t100 = await titel(100), t0 = await titel(0);
  P.ok('großer Titel: gescrollt klein (62 %) und mittig in der Kopfzeile, oben wieder groß und links', t100 === 'true 0.62 true' && t0.startsWith('false 1.00'), t100 + ' · ' + t0);
  /* Tippflächen (v106): Umschalter, Teile oben und Chips nehmen den Finger größer an, als sie aussehen */
  const tf = await wp.evaluate(() => { const h = (q, pseudo) => { const e = document.querySelector(q); if (!e) return 0; const a = getComputedStyle(e, pseudo); return e.getBoundingClientRect().height - parseFloat(a.top) - parseFloat(a.bottom); };
    return { seg: Math.round(h('#v-training .seg2:not(.mini) button, #v-heute .seg2 button', '::after')), sub: Math.round(h('#v-training .subtabs button', '::after')) }; });
  P.ok('Tippflächen: Teile oben (Gym/Cardio) mindestens 44 px hoch', tf.sub >= 42, JSON.stringify(tf));
  await o13.browser.close();

  // --- Empfehlung je Satz (v107): Bereich 8–12 ohne Angabe, Vorgabe nach doppelter Progression, Anpassung nach jedem abgehakten Satz, Schalter in den Einstellungen ---
  /* Schritt beim Gewicht ist überall 2,5 kg (kein kleinerer Abstand in den Daten). Vorgabe aus dem letzten Mal (vor 3 Tagen), Bereich 8–12:
     Latzug: 90×12, 90×10, 90×8, 65×6; davor (vor 6 Tagen) 90×11, 90×10, 90×8, 65×6.
       Seit v114 führt der erste Satz den Block mit demselben Gewicht: Er war oben (12) → alle drei auf 92,5 kg, je Satz so viele Wiederholungen, dass sein Maximum bleibt:
       126 → (126 / 92,5 − 1) × 30 = 10,9 → 10; 90 × (1 + 10/30) = 120 → 8,9 → 8; 90 × (1 + 8/30) = 114 → 6,97 → 6.
       65 kg: derselbe Satz zweimal in Folge unter 8 → 62,5 kg; 1RM 65 × (1 + 6/30) = 78 → (78 / 62,5 − 1) × 30 = 7,4 → 7, mindestens 8 → 62,5×8.
     Bank: 40×10, 40×10, 40×10 (nur eine Einheit) → 40×11 je Satz.
     Curls: 20×12, 20×12 → der erste oben: 22,5 kg; 1RM 20 × 1,4 = 28 → (28 / 22,5 − 1) × 30 = 7,3 → 7; der führende Satz mindestens 8 → 22,5×8, der zweite 22,5×7. */
  const K14 = { ex: { l: { n: 'Latzug' }, b: { n: 'Bank' }, c: { n: 'Curls' } }, log: { [tag(6)]: { l: [[90, 11], [90, 10], [90, 8], [65, 6]] }, [tag(3)]: { l: [[90, 12], [90, 10], [90, 8], [65, 6]], b: [[40, 10], [40, 10], [40, 10]], c: [[20, 12], [20, 12]] } },
    plans: { p: { n: 'Probe', items: [{ id: 'l', sets: 4 }, { id: 'b', sets: 3 }, { id: 'c', sets: 2 }], o: 1 } }, meta: {}, live: null };
  const o14 = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: K14 } }), em = o14.page;
  await bereich(em, 'training'); await em.click('#v-training [data-k="start"]'); await em.waitForTimeout(300);
  const reihen14 = () => em.$$eval('#l-items .lx > .lt .lt-r', l => l.map(z => [z.children[1], z.children[2]].map(c => c.firstChild ? c.firstChild.textContent : '').join('×')).join(' '));
  const emp = async () => (await em.$('#l-emp')) ? text(em, '#l-emp') : '';
  P.ok('Bereich ohne Angabe: „Ziel 8–12 Wdh“', (await text(em, '#l-items [data-la="ziel"]')) === 'Ziel 8–12 Wdh', await text(em, '#l-items [data-la="ziel"]'));
  P.ok('Vorgabe Latzug: erster Satz oben → der Block steigt auf 92,5 kg (10, 8, 6); 65 kg lag zweimal unter 8 → 62,5×8', (await reihen14()) === '92,5×10 92,5×8 92,5×6 62,5×8', await reihen14());
  P.ok('Zeile „Empfehlung“ nennt Satz 1 mit Grund', (await emp()) === 'Empfehlung 92,5 kg × 10 · +2,5 kg', await emp());
  /* Satz 1 wie empfohlen (10): Erwartung Satz 2 = 10 − (12 − 10) = 8, Satz 3 = 10 − (12 − 8) = 6: Die Empfehlungen bleiben. */
  await em.click('.lt-r.act .chk'); await em.waitForTimeout(60);
  P.ok('Satz 1 wie empfohlen: Die Empfehlungen danach bleiben', (await reihen14()) === '92,5×10 92,5×8 92,5×6 62,5×8' && (await emp()) === 'Empfehlung 92,5 kg × 8 · +2,5 kg', (await reihen14()) + ' # ' + (await emp()));
  /* Satz 2 nur 7 statt 8 (dahinter): Erwartung Satz 3 = 7 − (10 − 8) = 5, höchstens die alte Empfehlung 6 → 92,5×5. Spätere Sätze dürfen unter 8 liegen; der Satz mit 62,5 kg gehört nicht dazu. */
  await zahlWahl(em, '#l-r', '7'); await em.click('.lt-r.act .chk'); await em.waitForTimeout(60);
  P.ok('Satz 2 hinter der Empfehlung: Satz 3 wird auf 92,5×5 angepasst, der leichtere Satz bleibt', (await reihen14()) === '92,5×10 92,5×7 92,5×5 62,5×8' && (await emp()) === 'Empfehlung 92,5 kg × 5 · nach Satz 2 angepasst', (await reihen14()) + ' # ' + (await emp()));
  const lv14 = (await gespeichert(em)).K.live.items[0].sets[2];
  P.ok('die Empfehlung steht am Satz und ist gespeichert (ew, er, eg)', lv14.ew === '92,5' && lv14.er === '5' && lv14.eg === 'nach Satz 2 angepasst' && lv14.w === '92,5' && lv14.r === '5', JSON.stringify(lv14));
  /* Bank: Vorgabe 40×11 je Satz. Satz 1 nur 6 (unter dem Bereich): 1RM 40 × 1,2 = 48; Ermüdung letztes Mal 0 → 37,5 kg: (48 / 37,5 − 1) × 30 = 8,4 → 8 → 37,5×8 für beide Sätze danach. */
  await em.click('#l-tabs .lx-tab:has-text("Bank")');
  P.ok('Vorgabe Bank: je Satz eine Wiederholung mehr', (await reihen14()) === '40×11 40×11 40×11', await reihen14());
  await zahlWahl(em, '#l-r', '6'); await em.click('.lt-r.act .chk'); await em.waitForTimeout(60);
  P.ok('unter dem Bereich geblieben: weniger Gewicht für die Sätze danach (37,5×8)', (await reihen14()) === '40×6 37,5×8 37,5×8' && (await emp()) === 'Empfehlung 37,5 kg × 8 · weniger Gewicht, zurück in 8–12', (await reihen14()) + ' # ' + (await emp()));
  /* Satz 3 von Hand auf 5 gestellt, dann Satz 2 mit 14 (zwei über dem oberen Ende): 1RM 37,5 × (1 + 14/30) = 55 → 40 kg: (55 / 40 − 1) × 30 = 11,25 → 11.
     Der von Hand geänderte Satz bleibt stehen (37,5×5), die Zeile nennt trotzdem die Empfehlung 40 kg × 11. */
  await em.click('.lt-r[data-s="2"]'); await zahlWahl(em, '#l-r', '5');
  await em.click('.lt-r[data-s="1"]'); await zahlWahl(em, '#l-r', '14'); await em.click('.lt-r.act .chk'); await em.waitForTimeout(60);
  P.ok('deutlich über dem Bereich: Empfehlung mit mehr Gewicht (40 kg × 11); der von Hand geänderte Satz bleibt, wie er ist', (await reihen14()) === '40×6 37,5×14 37,5×5' && (await emp()) === 'Empfehlung 40 kg × 11 · mehr Gewicht, du lagst über 12', (await reihen14()) + ' # ' + (await emp()));
  await em.click('#l-tabs .lx-tab:has-text("Curls")');
  P.ok('Vorgabe Curls, erster Satz oben: ein Schritt mehr Gewicht, der führende Satz mindestens das untere Ende (22,5×8), der zweite 22,5×7', (await reihen14()) === '22,5×8 22,5×7' && (await emp()) === 'Empfehlung 22,5 kg × 8 · +2,5 kg', (await reihen14()) + ' # ' + (await emp()));
  /* Schalter in den Einstellungen: aus → K.emp = 0; ein neu gestartetes Training zeigt die Werte vom letzten Mal, ohne Zeile „Empfehlung“ und ohne Bereich. Wieder an → der Merker ist weg. */
  await em.click('#l-del'); await em.click('#l-del'); await em.waitForTimeout(150);
  await einstSeite(em, 'gym');   // seit v149 liegen die Schalter des Trainings auf der Seite „Gym“
  const sch = () => em.evaluate(() => { const b = document.querySelector('#esheet [data-h="emp"]'); return b.getAttribute('role') + ' ' + b.getAttribute('aria-checked') + ' ' + Math.round(b.getBoundingClientRect().height >= 40); });
  P.ok('Einstellungen: Schalter „Empfehlung je Satz“ steht auf an und ist mindestens 40 px hoch', (await sch()) === 'switch true 1' && (await text(em, '#esheet [data-h="emp"]')) === 'Empfehlung je Satz', await sch());
  await em.click('#esheet [data-h="emp"]');
  P.ok('ausgeschaltet: Schalter aus, gespeichert als K.emp = 0', (await sch()) === 'switch false 1' && (await gespeichert(em)).K.emp === 0, await sch());
  await em.click('#es-close'); await bereich(em, 'training'); await em.click('#v-training [data-k="start"]'); await em.waitForTimeout(300);
  const aus14 = await em.evaluate(() => ({ zeile: !!document.querySelector('#l-emp'), ziel: !!document.querySelector('#l-items [data-la="ziel"]') }));
  P.ok('ohne Empfehlung: die Werte vom letzten Mal, keine Zeile „Empfehlung“, kein Bereich', (await reihen14()) === '90×12 90×10 90×8 65×6' && !aus14.zeile && !aus14.ziel, (await reihen14()) + ' ' + JSON.stringify(aus14));
  await em.click('.lt-r.act .chk'); await em.waitForTimeout(60);
  P.ok('ohne Empfehlung passt sich nach dem Abhaken nichts an', (await reihen14()) === '90×12 90×10 90×8 65×6', await reihen14());
  await em.click('#l-del'); await em.click('#l-del'); await em.waitForTimeout(150);
  await einstSeite(em, 'gym'); await em.click('#esheet [data-h="emp"]');
  P.ok('wieder eingeschaltet: Schalter an, der Merker ist weg', (await sch()) === 'switch true 1' && (await gespeichert(em)).K.emp == null, await sch());
  await o14.browser.close();

  // --- Reserve je Satz (v108): „Wie viele wären noch gegangen?“ nach dem Abhaken; 0 und 1 ändern nichts, ab 2 zählt jede weitere wie eine geschaffte Wiederholung ---
  /* Letztes Mal (vor 3 Tagen), Bereich 8–12, Schritt 2,5 kg:
     Presse: 40×9 mit 3 in Reserve, 40×9, 40×8 → Satz 1 zählt wie 9 + (3 − 1) = 11: Ziel 11 („2 Wdh mehr“), Satz 2 und 3 je eine mehr (10, 9).
     Curls:  20×10 mit 3 in Reserve, 20×11 mit 2 → beide zählen wie 12 → der erste ist oben: 22,5 kg; 1RM 20 × (1 + 12/30) = 28 → (28 / 22,5 − 1) × 30 = 7,3 → 7; der führende mindestens 8 → 22,5×8, der zweite 22,5×7. */
  const K15 = { ex: { p: { n: 'Presse' }, c: { n: 'Curls' } }, log: { [tag(3)]: { p: [[40, 9, 3], [40, 9], [40, 8]], c: [[20, 10, 3], [20, 11, 2]] } },
    plans: { p: { n: 'Probe', items: [{ id: 'p', sets: 3 }, { id: 'c', sets: 2 }], o: 1 } }, meta: {}, live: null };
  const o15 = await oeffnen({ reserve: true, daten: { S: { routines: [], running: null }, LY: {}, K: K15 } }), rs = o15.page;
  P.ok('die Reserve bleibt beim Laden am Satz stehen (drittes Feld)', JSON.stringify((await gespeichert(rs)).K.log[tag(3)].p) === '[[40,9,3],[40,9],[40,8]]', JSON.stringify((await gespeichert(rs)).K.log[tag(3)].p));
  await bereich(rs, 'training'); await rs.click('#v-training [data-k="start"]'); await rs.waitForTimeout(300);
  const reihen15 = () => rs.$$eval('#l-items .lx > .lt .lt-r', l => l.map(z => [z.children[1], z.children[2]].map(c => c.firstChild ? c.firstChild.textContent : '').join('×')).join(' '));
  const emp15 = async () => (await rs.$('#l-emp')) ? text(rs, '#l-emp') : '';
  /* Seit v140 ist die Frage eine Ebene über dem ganzen Training (#l-resv, Milchglas): Kopfzeile mit dem Satz, Frage, fünf runde Knöpfe, „Überspringen“. Ein Tipp wählt und schließt. */
  const frage = () => rs.evaluate(() => { const b = document.querySelector('#l-resv'); return !b ? '' : b.querySelector('.l-resv-k').textContent + ' # ' + b.querySelector('h3').textContent + ' # ' + [...b.querySelectorAll('.rv-b')].map(c => c.textContent).join(' '); });
  P.ok('Vorgabe mit Reserve vom letzten Mal: 40×11 (zwei mehr), 40×10, 40×9', (await reihen15()) === '40×11 40×10 40×9' && (await emp15()) === 'Empfehlung 40 kg × 11 · 2 Wdh mehr, du hattest Reserve', (await reihen15()) + ' # ' + (await emp15()));
  P.ok('vor dem ersten Satz gibt es keine Frage nach der Reserve', (await frage()) === '', await frage());
  /* Satz 1 wie empfohlen (11), ohne Angabe: Ermüdung letztes Mal 9 − 9 = 0 → Satz 2: 11; Satz 3: 11 − (9 − 8) = 10. */
  await rs.click('.lt-r.act .chk'); await rs.waitForTimeout(60);
  P.ok('nach dem Abhaken: Die Frage liegt über dem ganzen Bildschirm, mit dem Satz darüber und fünf Knöpfen; die Sätze darunter sind schon angepasst', (await frage()) === 'Satz 1 · 40 kg × 11 Wdh # RIR # 0 1 2 3' && (await reihen15()) === '40×11 40×11 40×10', (await frage()) + ' # ' + (await reihen15()));
  const deckt = await rs.evaluate(() => { const r = document.querySelector('#l-resv').getBoundingClientRect(), st = getComputedStyle(document.querySelector('#l-resv')); return r.top === 0 && r.left === 0 && r.width === innerWidth && r.height === innerHeight && st.position === 'fixed' && /blur/.test(st.backdropFilter || st.webkitBackdropFilter); });
  P.ok('… sie deckt den ganzen Bildschirm, der Hintergrund ist unscharf', deckt);
  /* RIR 3 (seit v141 das Höchste, sein „mache nie weniger“): Satz 1 zählt wie 11 + 2 = 13 → Satz 2: 13 − 0 = 13, höchstens 12; Satz 3: 13 − (9 − 8) = 12.
     Gerechnet wird vom Stand vor dem Abhaken, nicht auf der ersten Anpassung. */
  await rs.click('#l-resv [data-v="3"]'); await rs.waitForTimeout(60);
  P.ok('RIR 3 gewählt: Die Ebene ist weg, die Sätze danach steigen auf 12', (await frage()) === '' && (await reihen15()) === '40×11 40×12 40×12' && (await emp15()) === 'Empfehlung 40 kg × 12 · mehr, du hattest Reserve' && (await gespeichert(rs)).K.live.items[0].sets[0].x === 3, (await reihen15()) + ' # ' + (await emp15()));
  /* Tipp neben die Knöpfe: schließt ohne Angabe, die Sätze bleiben */
  await rs.click('.lt-r.act .chk'); await rs.waitForTimeout(60);
  P.ok('Satz 2 abgehakt: Frage zu Satz 2 mit seinem Gewicht', (await frage()).startsWith('Satz 2 · 40 kg × 12 Wdh'), await frage());
  await rs.click('#l-resv', { position: { x: 12, y: 12 } }); await rs.waitForTimeout(60);
  P.ok('Tipp daneben: Die Ebene ist weg, ohne Angabe am Satz', (await frage()) === '' && (await gespeichert(rs)).K.live.items[0].sets[1].x == null && (await reihen15()) === '40×11 40×12 40×12', (await reihen15()));
  /* Curls: Vorgabe 22,5×8. Satz 1 nur 7: unter dem Bereich → 20 kg; 1RM 22,5 × (1 + 7/30) = 27,75 → (27,75 / 20 − 1) × 30 = 11,6 → 11.
     Mit 2 in Reserve hätte es für 8 gereicht (7 + 2 = 9): Das Gewicht bleibt; Satz 1 zählt wie 8, Satz 2 steigt von 7 auf 8 (Ermüdung letztes Mal 0). */
  await rs.click('#l-tabs .lx-tab:has-text("Curls")');
  P.ok('andere Übung: keine Frage, Vorgabe 22,5×8, 22,5×7', (await frage()) === '' && (await reihen15()) === '22,5×8 22,5×7', (await frage()) + ' # ' + (await reihen15()));
  await zahlWahl(rs, '#l-r', '7'); await rs.click('.lt-r.act .chk'); await rs.waitForTimeout(60);
  P.ok('unter dem Bereich ohne Angabe: weniger Gewicht (20×11)', (await reihen15()) === '22,5×7 20×11' && (await frage()).startsWith('Satz 1 · '), (await reihen15()) + ' # ' + (await frage()));
  await rs.click('#l-resv [data-v="2"]'); await rs.waitForTimeout(60);
  P.ok('mit 2 in Reserve hätte es gereicht: Das Gewicht bleibt (22,5×8)', (await reihen15()) === '22,5×7 22,5×8' && (await emp15()) === 'Empfehlung 22,5 kg × 8 · mehr, du hattest Reserve', (await reihen15()) + ' # ' + (await emp15()));
  /* Haken zurücknehmen: Die Angabe ist weg; beim neuen Haken kommt die Frage wieder */
  await rs.click('.lt-r[data-s="0"]'); await rs.click('.lt-r.act .chk'); await rs.waitForTimeout(60);
  P.ok('Haken zurückgenommen: keine Frage, die Reserve ist vom Satz weg', (await frage()) === '' && (await gespeichert(rs)).K.live.items[1].sets[0].x == null, await frage());
  await rs.click('.lt-r.act .chk'); await rs.click('#l-resv [data-v="2"]'); await rs.waitForTimeout(60);
  /* Letzter Satz der Übung (v111): Die Ansicht bleibt bei Curls, bis die Frage beantwortet ist; erst dann geht es zur nächsten offenen Übung (Presse), dort ohne Frage. */
  const offen15 = () => rs.evaluate(() => document.querySelector('#l-tabs .lx-tab[aria-pressed="true"]').textContent);
  await rs.click('.lt-r.act .chk'); await rs.waitForTimeout(60);
  P.ok('letzter Satz abgehakt: Die Ansicht bleibt bei der Übung und fragt nach Satz 2', (await offen15()) === 'Curls' && (await frage()).startsWith('Satz 2 · '), (await offen15()) + ' # ' + (await frage()));
  await rs.click('#l-resv [data-v="1"]'); await rs.waitForTimeout(60);
  P.ok('nach der Antwort: weiter zur nächsten offenen Übung, dort keine Frage', (await offen15()) === 'Presse' && (await frage()) === '', (await offen15()) + ' # ' + (await frage()));
  /* Speichern: Nur Sätze mit Angabe tragen das dritte Feld */
  await rs.click('#l-save'); await rs.waitForTimeout(250); await rs.click('#rs-ok');
  const log15 = (await gespeichert(rs)).K.log[heute];
  P.ok('gespeichert: Presse 40×11 mit RIR 3 und 40×12 ohne, Curls 22,5×7 mit RIR 2 und 22,5×8 mit RIR 1', JSON.stringify(log15) === '{"p":[[40,11,3],[40,12]],"c":[[22.5,7,2],[22.5,8,1]]}', JSON.stringify(log15));
  await o15.browser.close();

  // --- Einstellungen (v110): Schritt je Übung, Frage nach der Reserve abschaltbar, Übersicht auf Heute, Start-Bereich ---
  /* Rudern: vor 6 Tagen 45×5, vor 3 Tagen 40×12 dreimal. Geraten wird der Schritt aus den bisherigen Gewichten: 45 − 40 = 5 kg.
     Erster Satz oben (12) → 45 kg; 1RM 40 × 1,4 = 56 → (56 / 45 − 1) × 30 = 7,3 → 7; der führende Satz mindestens 8 → 45×8, die anderen 45×7.
     Mit festem Schritt 2,5 kg: 42,5 kg → (56 / 42,5 − 1) × 30 = 9,5 → 9 → 42,5×9. */
  const K16 = { ex: { r: { n: 'Rudern' } }, log: { [tag(6)]: { r: [[45, 5]] }, [tag(3)]: { r: [[40, 12], [40, 12], [40, 12]] } }, plans: { p: { n: 'Probe', items: [{ id: 'r', sets: 3 }], o: 1 } }, meta: {}, live: null };
  const o16 = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: K16, W: { entries: { [heute]: 80 } } } }), ei = o16.page;
  const reihen16 = () => ei.$$eval('#l-items .lx > .lt .lt-r', l => l.map(z => [z.children[1], z.children[2]].map(c => c.firstChild ? c.firstChild.textContent : '').join('×')).join(' '));
  const sw = h => ei.evaluate(q => { const b = document.querySelector('#esheet ' + q); return b ? b.getAttribute('aria-checked') : 'fehlt'; }, h);
  P.ok('Heute zeigt die Zeile Gewicht', (await text(ei, '#v-heute .ovs')).includes('Gewicht'), await text(ei, '#v-heute .ovs'));
  /* Seit v149 wie iOS: erste Seite mit Zeilen je Thema, „Auf Heute zeigen“ auf „Heute“, Start auf „Bereiche“, das Training auf „Gym“ */
  await einstellungen(ei);
  const es16 = { titel: await einstZeilen(ei) };
  await einstSeite(ei, 'heute'); es16.ov = await ei.evaluate(() => [...document.querySelectorAll('#es-body [data-h="ov"]')].map(b => b.textContent + ':' + b.getAttribute('aria-checked')).join(' | '));
  await einstSeite(ei, 'ber'); es16.start = await ei.evaluate(() => [...document.querySelectorAll('#es-body [data-h="start"]')].map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(' '));
  await einstSeite(ei, 'gym'); es16.res = await ei.evaluate(() => !document.querySelector('#es-res').hidden);
  P.ok('Einstellungen: Seiten Darstellung, Bereiche, Heute, Gym, Planer; alle fünf Zeilen an, Start ist Heute, „Nach der Reserve fragen“ ist da',
    es16.titel === 'Darstellung | Bereiche | Heute | Gym | Planer' && es16.ov === 'Gewicht:true | Finanzen:true | Training:true | Arbeit:true | Uni:true' && es16.start === 'Heute* Planer Gewicht Finanzen Training' && es16.res, JSON.stringify(es16));
  await einstSeite(ei, 'heute');
  await ei.click('#esheet [data-h="ov"][data-v="gewicht"]');
  P.ok('Gewicht abgewählt: Schalter aus, gespeichert (E.aus.gewicht), die Zeile fehlt auf Heute', (await sw('[data-h="ov"][data-v="gewicht"]')) === 'false' && (await gespeichert(ei)).E.aus.gewicht === 1 && await ei.evaluate(() => !(document.querySelector('#v-heute .ovs') || { textContent: '' }).textContent.includes('Gewicht')));
  await ei.click('#esheet [data-h="ov"][data-v="gewicht"]');
  P.ok('wieder angewählt: Die Zeile ist zurück, der Merker ist weg', (await text(ei, '#v-heute .ovs')).includes('Gewicht') && !(await gespeichert(ei)).E.aus.gewicht);
  await einstSeite(ei, 'gym'); await ei.click('#esheet [data-h="emp"]');
  P.ok('Empfehlung aus: „Nach der Reserve fragen“ verschwindet', (await ei.evaluate(() => { const l = document.querySelector('#es-res'); return l.hidden && l.getBoundingClientRect().height === 0; })));
  await ei.click('#esheet [data-h="emp"]');
  await einstSeite(ei, 'ber'); await ei.click('#esheet [data-h="start"][data-v="training"]');
  P.ok('Start-Bereich Training: gewählt und gespeichert (E.start)', (await gespeichert(ei)).E.start === 'training' && await ei.evaluate(() => document.querySelector('#esheet [data-h="start"][data-v="training"]').getAttribute('aria-pressed') === 'true' && document.querySelector('#esheet [data-h="start"][data-v="heute"]').getAttribute('aria-pressed') === 'false'));
  await ei.goto(APP); await ei.waitForTimeout(400);
  P.ok('ohne Zusatz in der Adresse öffnet die App jetzt mit Training', await ei.evaluate(() => document.body.dataset.v === 'training' && !document.querySelector('#v-training').hidden));
  await einstSeite(ei, 'ber'); await ei.click('#esheet [data-h="start"][data-v="heute"]');
  P.ok('zurück auf Heute: Der Merker ist weg', (await gespeichert(ei)).E.start == null);
  await ei.click('#es-close'); await bereich(ei, 'training'); await ei.click('#v-training [data-k="start"]'); await ei.waitForTimeout(300);
  /* Seit v139 mit gelernter Kurve: 45×5, dann 40×12 → k = (40·12 − 45·5) / (45 − 40) = 51, zur 30 gezogen (60 + 51) / 3 = 37.
     40 × (1 + 12/37) = 52,97 → (52,97 / 45 − 1) × 37 = 6,6 → 6; der führende mindestens 8 (bis v138 mit 30: 45×8, 45×7, 45×7). */
  P.ok('Schritt geraten aus den Gewichten (5 kg): erster Satz oben → 45×8, 45×6, 45×6', (await reihen16()) === '45×8 45×6 45×6' && (await text(ei, '#l-items [data-la="schritt"]')) === 'Schritt 5 kg', (await reihen16()) + ' ' + (await text(ei, '#l-items [data-la="schritt"]')));
  await ei.click('#l-items [data-la="schritt"]'); await ei.waitForTimeout(80);
  const sl = await ei.evaluate(() => ({ liste: [...document.querySelectorAll('#z-list button')].map(b => b.textContent).join(' | '), wahl: (document.querySelector('#z-list [aria-pressed="true"]') || {}).textContent }));
  P.ok('Schritt wählen: sieben Schritte, 5 kg markiert', sl.liste === '0,5 kg | 1 kg | 1,25 kg | 2 kg | 2,5 kg | 5 kg | 10 kg' && sl.wahl === '5 kg', JSON.stringify(sl));
  await ei.click('#z-list [data-zv="2.5"]'); await ei.waitForTimeout(80);
  P.ok('fester Schritt 2,5 kg: gespeichert an der Übung (st), die offenen Sätze heißen 42,5×9', (await gespeichert(ei)).K.ex.r.st === 2.5 && (await reihen16()) === '42,5×9 42,5×9 42,5×9' && (await text(ei, '#l-items [data-la="schritt"]')) === 'Schritt 2,5 kg', await reihen16());
  await ei.click('#l-w'); await ei.waitForTimeout(80);
  const wl = await ei.evaluate(() => [...document.querySelectorAll('#z-list button')].slice(0, 3).map(b => b.textContent).join(' | '));
  P.ok('„Zahl wählen“ beim Gewicht zählt in diesem Schritt: 22,5, 25, 27,5 …', wl === '22,5 kg | 25 kg | 27,5 kg', wl);
  await ei.click('#z-x'); await ei.waitForTimeout(80);
  /* Frage nach der Reserve: an → nach dem Abhaken da; in den Einstellungen aus (K.res = 0) → nach dem nächsten Abhaken keine Frage; die Empfehlung bleibt */
  await ei.click('.lt-r.act .chk'); await ei.waitForTimeout(60);
  P.ok('Reserve an: Frage nach dem ersten Satz', !!(await ei.$('#l-resv')));
  await ei.click('#ls-close'); await ei.waitForTimeout(200); await einstSeite(ei, 'gym'); await ei.click('#esheet [data-h="res"]');
  P.ok('„Nach der Reserve fragen“ aus: gespeichert als K.res = 0', (await sw('[data-h="res"]')) === 'false' && (await gespeichert(ei)).K.res === 0);
  await ei.click('#es-close'); await ei.click('#v-heute [data-k="live"]'); await ei.waitForTimeout(300);
  await ei.click('.lt-r.act .chk'); await ei.waitForTimeout(60);
  P.ok('Reserve aus: nach dem Abhaken keine Frage, die Zeile „Empfehlung“ bleibt', !(await ei.$('#l-resv')) && !!(await ei.$('#l-emp')));
  await ei.click('#l-del'); await ei.click('#l-del'); await ei.waitForTimeout(150);
  await o16.browser.close();

  // --- v111, sein Fall aus dem Bild vom 25.11.: 40×12, 40×10, 40×8 (er geht nah an die Grenze, von Satz zu Satz werden es weniger) ---
  /* Bereich 8–12, Schritt 2,5 kg (nur ein Gewicht in den Daten). Seit v114 so, wie er es macht („12 10 8 gemacht und dann erhöht“): Der erste Satz war oben → alle Sätze auf 42,5 kg,
     je Satz so viele Wiederholungen, dass sein Maximum bleibt: 56 → (56 / 42,5 − 1) × 30 = 9,5 → 9; 40 × (1 + 10/30) = 53,33 → 7,6 → 7; 40 × (1 + 8/30) = 50,67 → 5,8 → 5.
     Bis v110 hieß es „40 × 12 halten, bis alle Sätze 12 schaffen“, von v111 bis v113 „42,5×9, 40×11, 40×9“.
     Zweiter Fall „Hinten“: 30×11, 30×12 → der führende Satz bekommt eine mehr (12); der zweite bleibt bei 12 („wie letztes Mal“): Erwartung 12 − 0 (sein Abfall hier: 0), höchstens das obere Ende.
     Dritter Fall „Lernen“: zwei Einheiten 40×11, 40×9, 40×7 (vor 6 Tagen 40×10, 40×8, 40×6): Sein Abfall ist 2 je Satz. Führender Satz 12; danach 12 − 2 = 10 und 12 − 4 = 8,
     jeweils höchstens eine mehr als letztes Mal → 40×12, 40×10, 40×8. (Mit „je Satz eine mehr“ wäre es dasselbe; der Unterschied zeigt sich bei „Halten“:)
     Vierter Fall „Halten“: vor 3 Tagen 40×11, 40×10, 40×8, vor 6 Tagen 40×12, 40×10, 40×8 → Abfall: Unterschiede 2, 2, 1, 2 → 2. Führender Satz 12; Satz 2: 12 − 2 = 10 = wie letztes Mal (nicht 11);
     Satz 3: 12 − 4 = 8 = wie letztes Mal. Das ist sein Satz vom 25.11.: „meistens schaffe ich nach 12 Wdh 10, nicht 11“. */
  const K17 = { ex: { b: { n: 'Brustpresse' }, h: { n: 'Hinten' }, l: { n: 'Lernen' }, t: { n: 'Halten' } }, log: { [tag(6)]: { l: [[40, 10], [40, 8], [40, 6]], t: [[40, 12], [40, 10], [40, 8]] }, [tag(3)]: { b: [[40, 12], [40, 10], [40, 8]], h: [[30, 11], [30, 12]], l: [[40, 11], [40, 9], [40, 7]], t: [[40, 11], [40, 10], [40, 8]] } },
    plans: { p: { n: 'Probe', items: [{ id: 'b', sets: 3 }, { id: 'h', sets: 2 }, { id: 'l', sets: 3 }, { id: 't', sets: 3 }], o: 1 } }, meta: {}, live: null };
  const o17 = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: K17 } }), sf = o17.page;
  await bereich(sf, 'training'); await sf.click('#v-training [data-k="start"]'); await sf.waitForTimeout(300);
  const reihen17 = () => sf.$$eval('#l-items .lx > .lt .lt-r', l => l.map(z => [z.children[1], z.children[2]].map(c => c.firstChild ? c.firstChild.textContent : '').join('×')).join(' '));
  P.ok('12, 10, 8: erhöhen, alle Sätze auf 42,5 kg (9, 7, 5)', (await reihen17()) === '42,5×9 42,5×7 42,5×5' && (await text(sf, '#l-emp')) === 'Empfehlung 42,5 kg × 9 · +2,5 kg', (await reihen17()) + ' # ' + (await text(sf, '#l-emp')));
  await sf.click('#l-tabs .lx-tab:has-text("Hinten")');
  P.ok('nur der hintere Satz oben: Der führende bekommt eine mehr, der hintere bleibt', (await reihen17()) === '30×12 30×12', await reihen17());
  await sf.click('.lt-r[data-s="1"]'); await sf.waitForTimeout(60);
  P.ok('… mit Grund in der Zeile „Empfehlung“', (await text(sf, '#l-emp')) === 'Empfehlung 30 kg × 12 · wie letztes Mal', await text(sf, '#l-emp'));
  await sf.click('#l-tabs .lx-tab:has-text("Lernen")');
  P.ok('gelernter Abfall 2: 11, 9, 7 → 12, 10, 8', (await reihen17()) === '40×12 40×10 40×8', await reihen17());
  await sf.click('#l-tabs .lx-tab:has-text("Halten")');
  P.ok('sein Fall: 11, 10, 8 → 12, 10, 8 (nach 12 kommen 10, nicht 11)', (await reihen17()) === '40×12 40×10 40×8', await reihen17());
  await sf.click('.lt-r[data-s="1"]'); await sf.waitForTimeout(60);
  P.ok('… der zweite Satz heißt „wie letztes Mal“', (await text(sf, '#l-emp')) === 'Empfehlung 40 kg × 10 · wie letztes Mal', await text(sf, '#l-emp'));
  /* Im Training: erster Satz nur 11 statt 12 → Erwartung Satz 2 = 11 − (11 − 10) = 10 (so war es letztes Mal zwischen diesen Sätzen), Satz 3 = 11 − 3 = 8: Es bleibt bei 10 und 8. */
  await sf.click('.lt-r[data-s="0"]'); await zahlWahl(sf, '#l-r', '11'); await sf.click('.lt-r.act .chk'); await sf.waitForTimeout(60);
  P.ok('im Training nur 11 im ersten Satz: Die Sätze danach bleiben bei 10 und 8', (await reihen17()) === '40×11 40×10 40×8', await reihen17());
  await sf.click('#l-del'); await sf.click('#l-del'); await sf.waitForTimeout(150);
  await o17.browser.close();

  // --- v139: Kurve je Übung, aus seinen Einheiten gelernt (exKurve) statt immer Epley mit 30 ---
  /* „Kurve“: vor 12, 9, 6, 3 Tagen 100×12, 105×8, 100×12, 105×12 (Schritt 5 kg aus den Gewichten).
     Wechsel 1: (105·8 − 100·12) / (100 − 105) = (840 − 1200) / −5 = 72; Wechsel 2: (100·12 − 105·8) / (105 − 100) = 360 / 5 = 72; Wechsel 3: (105·12 − 100·12) / −5 = −12 → zählt nicht.
     Median 72, zur 30 gezogen: (2·30 + 2·72) / 4 = 51 → höchstens 50. Letztes Mal 105×12 = oben → 110 kg: 105 × (1 + 12/50) = 130,2 → (130,2 / 110 − 1) × 50 = 9,2 → 9.
     Mit der festen Formel wären es 105 × 1,4 = 147 → (147 / 110 − 1) × 30 = 10,1 → 10. „Fest“: nur ein Gewicht, kein Wechsel → bleibt bei 30: 40×12 → 42,5×9 wie oben. */
  const KKu = { ex: { c: { n: 'Kurve' }, f: { n: 'Fest' } }, log: { [tag(12)]: { c: [[100, 12]] }, [tag(9)]: { c: [[105, 8]] }, [tag(6)]: { c: [[100, 12]] }, [tag(3)]: { c: [[105, 12]], f: [[40, 12]] } },
    plans: { p: { n: 'Probe', items: [{ id: 'c', sets: 1 }, { id: 'f', sets: 1 }], o: 1 } }, meta: {}, live: null };
  const oKu = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: KKu } }), kv = oKu.page;
  await bereich(kv, 'training'); await kv.click('#v-training [data-k="start"]'); await kv.waitForTimeout(300);
  const reihenKu = () => kv.$$eval('#l-items .lx > .lt .lt-r', l => l.map(z => [z.children[1], z.children[2]].map(c => c.firstChild ? c.firstChild.textContent : '').join('×')).join(' '));
  P.ok('gelernte Kurve: nach mehr Gewicht fallen bei ihm die Wdh stärker → 110×9 statt 110×10', (await reihenKu()) === '110×9', await reihenKu());
  await kv.click('#l-tabs .lx-tab:has-text("Fest")');
  P.ok('… ohne Wechsel des Gewichts bleibt die feste Formel: 42,5×9', (await reihenKu()) === '42,5×9', await reihenKu());
  await oKu.browser.close();

  // --- v143: Übergang der Ebene RIR (sein Wort: „der Übergang beim Rein- und Rauskommen ist noch etwas unsmooth“) ---
  /* Die Unschärfe selbst wächst (blur 0 → 24 px in 0,34 s), statt dass die Ebene mit fertiger Unschärfe einblendet; der Inhalt kommt 0,04 s später und setzt sich von 1,06 auf 1.
     Beim Wählen steht darunter sofort das Neue (RIR am Satz, Sätze angepasst); die Ebene blendet 0,26 s aus und ist danach aus dem Aufbau. Sie steht in #l-ov, nicht in #l-items. */
  const KUe = { ex: { c: { n: 'Latzug' } }, log: { [tag(7)]: { c: [[90, 12], [90, 10], [90, 8]] } }, plans: { p: { n: 'Probe', items: [{ id: 'c', sets: 3 }], o: 1 } }, meta: {}, live: null };
  const oUe = await oeffnen({ reserve: true, bewegung: true, daten: { S: { routines: [], running: null }, LY: {}, K: KUe } }), ue = oUe.page;
  await bereich(ue, 'training'); await ue.click('#v-training [data-k="start"]'); await ue.waitForTimeout(600);
  await ue.click('.lt-r.act .chk');
  const halb = await ue.evaluate(() => { const e = document.querySelector('#l-ov > #l-resv'); if (!e) return 'nicht in #l-ov';
    const as = document.getAnimations().filter(a => a.effect.target.closest && a.effect.target.closest('#l-resv')); as.forEach(a => { a.pause(); a.currentTime = 120; });
    const b = parseFloat(/blur\(([\d.]+)px\)/.exec(getComputedStyle(e).backdropFilter)[1]), o = +getComputedStyle(e.querySelector('.l-resv-in')).opacity;
    as.forEach(a => a.finish()); return as.map(a => a.animationName).sort().join(',') + ' · ' + (b > 5 && b < 24) + ' · ' + (o > 0 && o < 1) + ' · ' + !document.querySelector('#l-items #l-resv'); });
  P.ok('rein: Unschärfe und Inhalt wachsen (nach 0,12 s Unschärfe zwischen 5 und 24 px, Inhalt halb da), Ebene in #l-ov', halb === 'glasAn,rvInhalt · true · true · true', halb);
  await ue.click('#l-resv [data-v="2"]');
  const sofort = await ue.evaluate(() => { const e = document.querySelector('#l-resv'); return (e && e.classList.contains('weg')) + ' · ' + JSON.parse(localStorage.getItem('takt.v1')).K.live.items[0].sets[0].x; });
  await ue.waitForTimeout(450);
  P.ok('raus: Die Ebene blendet aus, der RIR steht schon am Satz; nach 0,45 s ist sie weg', sofort === 'true · 2' && !(await ue.$('#l-resv')), sofort);
  await oUe.browser.close();

  // --- v140: Übung im Training überspringen („…“ → „Überspringen“; „Doch machen“ nimmt es zurück) ---
  /* Plan mit A, B, C zu je 2 Sätzen. A überspringen → weiter zu B; A ist im Reiter durchgestrichen und zählt nicht mehr als offen.
     Auf der Karte des laufenden Trainings: Sätze gesamt 2 + 2 = 4 (A zählt nur mit Abgehaktem, also 0). Gespeichert wird nur, was abgehakt ist: B und C, A nicht. */
  const KSk = { ex: { a: { n: 'Aa' }, b: { n: 'Bb' }, c: { n: 'Cc' } }, log: {}, plans: { p: { n: 'Probe', items: [{ id: 'a', sets: 2 }, { id: 'b', sets: 2 }, { id: 'c', sets: 2 }], o: 1 } }, meta: {}, live: null };
  const oSk = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: KSk } }), sk = oSk.page;
  await bereich(sk, 'training'); await sk.click('#v-training [data-k="start"]'); await sk.waitForTimeout(300);
  const reiter = () => sk.$$eval('#l-tabs .lx-tab:not(.addx)', l => l.map(b => b.textContent + (b.classList.contains('sk') ? '~' : '') + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(' '));
  await sk.click('#l-items [data-la="menu"]'); await sk.click('#l-items .lx-akt [data-la="skip"]'); await sk.waitForTimeout(60);
  P.ok('Überspringen: weiter zur nächsten Übung, die übersprungene ist durchgestrichen', (await reiter()) === 'Aa~ Bb* Cc' && (await gespeichert(sk)).K.live.items[0].sk === 1, await reiter());
  await sk.click('#l-tabs .lx-tab:has-text("Aa")');
  P.ok('… in der übersprungenen Übung steht „Übersprungen · Doch machen“', (await text(sk, '#l-items .lx-skz')) === 'Übersprungen · Doch machen');
  await sk.click('#l-items .lx-skz [data-la="skip"]'); await sk.waitForTimeout(60);
  P.ok('„Doch machen“: wieder offen, die Ansicht bleibt bei der Übung', (await reiter()) === 'Aa* Bb Cc' && !(await sk.$('#l-items .lx-skz')) && (await gespeichert(sk)).K.live.items[0].sk == null, await reiter());
  await sk.click('#l-items [data-la="menu"]'); await sk.click('#l-items .lx-akt [data-la="skip"]'); await sk.waitForTimeout(60);
  const satz = async () => { await zahlWahl(sk, '#l-r', '10'); await sk.click('.lt-r.act .chk'); await sk.waitForTimeout(60); };
  await satz(); await satz(); await sk.click('#l-tabs .lx-tab:has-text("Cc")'); await satz();
  const karte = await sk.evaluate(() => [...document.querySelectorAll('.is-run .meta')].map(m => m.textContent).join(' | '));
  P.ok('Karte des laufenden Trainings zählt 4 Sätze, nicht 6 (die übersprungene Übung zählt nicht mit)', /^\d von 4 Sätzen/.test(karte), karte);
  await satz();
  await sk.click('#l-save'); await sk.waitForTimeout(250); await sk.click('#rs-ok');
  const logSk = (await gespeichert(sk)).K.log[heute];
  P.ok('gespeichert: nur B und C, die übersprungene Übung nicht', JSON.stringify(Object.keys(logSk).sort()) === '["b","c"]', JSON.stringify(logSk));
  await oSk.browser.close();

  // --- Drop- und Supersätze (v113): einmal im Plan eingestellt, im Training läuft es von selbst ---
  /* Letztes Mal (vor 3 Tagen), Bereich 8–12, Schritt 2,5 kg. Plan: Latzug 4 Sätze, Bank 2, Curls 2, Rudern 3 (Dropsatz schon in den Daten).
     Latzug 90×10, 90×9, 90×8 → 90×11, 90×10, 90×9; der vierte Satz hat keine eigenen Werte und wird als Dropsatz ein Viertel leichter: 90 × 0,75 = 67,5 kg mit den 9 des Satzes davor.
     Rudern 50×10, 50×9, 35×9: Der Dropsatz hat eigene Werte und steigt wie jeder Satz für sich → 50×11, 50×10, 35×10. */
  const K18 = { ex: { a: { n: 'Latzug' }, b: { n: 'Bank' }, c: { n: 'Curls' }, d: { n: 'Rudern' } }, log: { [tag(3)]: { a: [[90, 10], [90, 9], [90, 8]], b: [[40, 10], [40, 10]], c: [[20, 10], [20, 10]], d: [[50, 10], [50, 9], [35, 9]] } },
    plans: { p: { n: 'Probe', items: [{ id: 'a', sets: 4 }, { id: 'b', sets: 2 }, { id: 'c', sets: 2 }, { id: 'd', sets: 3, dr: 1 }], o: 1 } }, meta: {}, live: null };
  const o18 = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: K18 } }), ds = o18.page;
  await bereich(ds, 'training'); await ds.click('#v-training [data-k="plan"][data-id="p"]'); await ds.waitForTimeout(200);
  const zeilen18 = () => ds.$$eval('#p-items .prow', l => l.map(r => r.querySelector('b').firstChild.textContent + (r.querySelector('b small') ? ' [' + r.querySelector('b small').textContent + ']' : '')).join(' | '));
  const akt18 = () => ds.$$eval('#p-items .p-akt button', l => l.map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(' | '));
  P.ok('Plan-Blatt: Rudern trägt schon „Dropsatz“ unter dem Namen', (await zeilen18()) === 'Latzug | Bank | Curls | Rudern [Dropsatz]', await zeilen18());
  await ds.click('#p-items .prow[data-i="0"] [data-pa="menu"]');
  P.ok('„…“ an der Übung: Dropsatz, Supersatz (mit der nächsten), Entfernen', (await akt18()) === 'Dropsatz | Supersatz | Entfernen', await akt18());
  await ds.click('#p-items [data-pa="dr"]');
  await ds.click('#p-items .prow[data-i="1"] [data-pa="menu"]'); await ds.click('#p-items [data-pa="su"]');
  P.ok('eingestellt: Latzug mit Dropsatz, Bank im Supersatz mit Curls', (await zeilen18()) === 'Latzug [Dropsatz] | Bank [Supersatz mit Curls] | Curls | Rudern [Dropsatz]' && (await akt18()) === 'Dropsatz | Supersatz* | Entfernen', (await zeilen18()) + ' # ' + (await akt18()));
  await ds.click('#p-items .prow[data-i="3"] [data-pa="menu"]');
  P.ok('letzte Übung: kein Supersatz zur Wahl; „Entfernen“ liegt hier', (await akt18()) === 'Dropsatz* | Entfernen', await akt18());
  await ds.click('#p-save'); await ds.waitForTimeout(150);
  const plan18 = JSON.stringify((await gespeichert(ds)).K.plans.p.items);
  P.ok('gespeichert am Plan: dr und su', plan18 === '[{"id":"a","sets":4,"dr":1},{"id":"b","sets":2,"su":1},{"id":"c","sets":2},{"id":"d","sets":3,"dr":1}]', plan18);
  await ds.click('#v-training [data-k="start"]'); await ds.waitForTimeout(300);
  const reihen18 = () => ds.$$eval('#l-items .lx > .lt .lt-r', l => l.map(z => [z.children[1], z.children[2]].map(c => c.firstChild ? c.firstChild.textContent : '').join('×')).join(' '));
  const nummern18 = () => ds.$$eval('#l-items .lx > .lt .lt-r .n', l => l.map(n => n.textContent + (n.querySelector('.dz') ? '°' : '')).join(' '));   // ° = rote Zahl im roten Ring (Dropsatz, v114; bis v113 ein „D“)
  const offen18 = () => ds.evaluate(() => document.querySelector('#l-tabs .lx-tab[aria-pressed="true"]').textContent);
  const frage18 = async () => !!(await ds.$('#l-resv'));
  P.ok('Dropsatz ohne eigene Werte: ein Viertel leichter als der Satz davor (67,5×9), seine Nummer steht rot im Ring', (await reihen18()) === '90×11 90×10 90×9 67,5×9' && (await nummern18()) === '1 2 3 4°', (await reihen18()) + ' # ' + (await nummern18()));
  await ds.click('.lt-r[data-s="3"]');
  P.ok('… mit Grund in der Zeile „Empfehlung“', (await text(ds, '#l-emp')) === 'Empfehlung 67,5 kg × 9 · Dropsatz: ein Viertel leichter, ohne Pause', await text(ds, '#l-emp'));
  await ds.click('.lt-r[data-s="0"]'); await ds.click('.lt-r.act .chk'); await ds.waitForTimeout(60);
  P.ok('normaler Satz: Die Frage nach der Reserve kommt', await frage18());
  /* Satz 2 mit 80 statt 90 kg (das neue Gewicht gilt auch für Satz 3): Der Dropsatz richtet sich nach dem, was gerade bewegt wurde: 80 × 0,75 = 60 kg, mit den 10 von Satz 2; nach Satz 3 (80×9) mit 9. */
  await zahlWahl(ds, '#l-w', '80'); await ds.click('.lt-r.act .chk'); await ds.waitForTimeout(60);
  P.ok('anderes Gewicht im Satz davor: Der Dropsatz zieht mit (60×10)', (await reihen18()) === '90×11 80×10 80×9 60×10', await reihen18());
  await ds.click('.lt-r.act .chk'); await ds.waitForTimeout(60);
  P.ok('… und nach dem dritten Satz 60×9', (await reihen18()) === '90×11 80×10 80×9 60×9', await reihen18());
  await ds.click('.lt-r.act .chk'); await ds.waitForTimeout(60);
  P.ok('Dropsatz abgehakt: keine Frage nach der Reserve, gleich weiter zur nächsten Übung', (await offen18()) === 'Bank' && !(await frage18()), await offen18());
  /* Supersatz Bank + Curls: Nach jedem Satz wechselt die Ansicht zur anderen Übung, ohne Frage; sind beide fertig, geht es zur nächsten offenen Übung (Rudern). */
  const su18 = await ds.evaluate(() => ({ hinweis: (document.querySelector('#l-items .lx-su') || {}).textContent, plus: document.querySelectorAll('#l-tabs .lx-plus .kette').length, nach: (document.querySelector('#l-tabs .lx-plus').previousElementSibling || {}).textContent }));
  P.ok('Supersatz: Hinweis unter dem Namen, eine Kette zwischen den beiden Reitern', su18.hinweis === 'Supersatz mit Curls' && su18.plus === 1 && su18.nach === 'Bank', JSON.stringify(su18));
  const folge = [];
  for (let k = 0; k < 4; k++) { await ds.click('.lt-r.act .chk'); await ds.waitForTimeout(60); folge.push((await offen18()) + ((await frage18()) ? '?' : '')); }
  P.ok('Supersatz: Bank 1 → Curls 1 → Bank 2 → Curls 2 → Rudern, ohne Frage dazwischen', folge.join(' ') === 'Curls Bank Curls Rudern', folge.join(' '));
  P.ok('Dropsatz mit eigenen Werten steigt wie jeder Satz für sich (35×10)', (await reihen18()) === '50×11 50×10 35×10' && (await nummern18()) === '1 2 3°', (await reihen18()) + ' # ' + (await nummern18()));
  await ds.click('#l-save'); await ds.waitForTimeout(250); await ds.click('#rs-ok');
  const log18 = (await gespeichert(ds)).K.log[heute];
  P.ok('gespeichert: Latzug mit vier Sätzen samt Dropsatz, Bank und Curls je zwei', JSON.stringify(log18.a) === '[[90,11],[80,10],[80,9],[60,9]]' && log18.b.length === 2 && log18.c.length === 2 && !log18.d, JSON.stringify(log18));
  await o18.browser.close();

  // --- v115: Übung hinzufügen nach Gruppen, Training nachträglich ändern (mit Dauer), weiter trainieren nach dem Beenden ---
  /* Übungen: Latzug (Rücken), Bankdrücken (Brust), Curls (Arme), Beinpresse (Beine), Seitheben (keine Gruppe → Sonstige). Plan „Probe“: Latzug 3 Sätze, Bankdrücken 2.
     Letztes Mal (vor 3 Tagen): Latzug 90×10, 90×9; Bankdrücken 40×10. */
  const K19 = { ex: { a: { n: 'Latzug' }, b: { n: 'Bankdrücken' }, c: { n: 'Curls' }, d: { n: 'Beinpresse' }, e: { n: 'Seitheben' } }, log: { [tag(3)]: { a: [[90, 10], [90, 9]], b: [[40, 10]] } },
    plans: { p: { n: 'Probe', items: [{ id: 'a', sets: 3 }, { id: 'b', sets: 2 }], o: 1 } }, meta: {}, live: null };
  const o19 = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: K19 } }), nb = o19.page;
  await bereich(nb, 'training'); await nb.click('#v-training [data-k="plan"][data-id="p"]'); await nb.waitForTimeout(200);
  const wahl19 = box => nb.evaluate(q => { const b = document.querySelector(q); return b.hidden ? '' : [...b.querySelectorAll('.pk-g .chip')].map(c => c.textContent + (c.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(' ') + ' # ' + [...b.querySelectorAll(':scope > .chip')].map(c => c.textContent).join(' | '); }, box);
  P.ok('Plan, Übung hinzufügen: Gruppen mit freien Übungen stehen gleich da (Arme, Beine, Sonstige), noch keine Übung', (await wahl19('#p-pick')) === 'Arme Beine Sonstige # ', await wahl19('#p-pick'));
  await nb.click('#p-pick [data-pg="arme"]');
  P.ok('Tipp auf „Arme“: seine Übungen der Gruppe', (await wahl19('#p-pick')) === 'Arme* Beine Sonstige # Curls', await wahl19('#p-pick'));
  await nb.click('#p-pick [data-pa="pick"]');
  P.ok('gewählt: Curls steht im Plan, die Gruppe ohne freie Übung verschwindet', (await text(nb, '#p-items .prow b')) === 'Latzug | Bankdrücken | Curls' && (await wahl19('#p-pick')) === 'Beine Sonstige # ', (await text(nb, '#p-items .prow b')) + ' # ' + (await wahl19('#p-pick')));
  await nb.fill('#p-new', 'sei');
  P.ok('beim Tippen wie bisher: passende Übungen statt der Gruppen', (await wahl19('#p-pick')) === ' # Seitheben', await wahl19('#p-pick'));
  await nb.click('#ps-close'); await nb.waitForTimeout(150); await nb.click('#ps-close'); await nb.waitForTimeout(200);   // der Plan ist geändert (Curls): Seit v122 warnt das erste Kreuz, das zweite verwirft
  await nb.click('#v-training [data-k="start"]'); await nb.waitForTimeout(300);
  await nb.click('#l-tabs .addx');
  P.ok('im Training: dieselbe Wahl nach Gruppen', (await wahl19('#l-pick')) === 'Arme Beine Sonstige # ', await wahl19('#l-pick'));
  await nb.click('#l-tabs .lx-tab:has-text("Latzug")');
  /* Ein Satz (90×11), beenden. Im Rückblick stehen „Ändern“ und „Weiter trainieren“. Weiter: Der Satz ist abgehakt, die zwei fehlenden Sätze stehen offen dahinter (mit seinen Werten),
     Bankdrücken wie geplant (40×11, 40×11); die gespeicherte Einheit bleibt, bis er wieder beendet. */
  const reihen19 = () => nb.$$eval('#l-items .lx > .lt .lt-r', l => l.map(z => [z.children[1], z.children[2]].map(c => c.firstChild ? c.firstChild.textContent : '').join('×') + (z.classList.contains('done') ? '✓' : '')).join(' '));
  await nb.click('.lt-r.act .chk'); await nb.click('#l-save'); await nb.waitForTimeout(250);
  P.ok('Rückblick: „Ändern“ und „Weiter trainieren“ neben „Fertig“', (await text(nb, '#rsheet .rs-akt button')) === 'Ändern | Weiter trainieren', await text(nb, '#rsheet .rs-akt button'));
  await nb.click('#rs-weiter'); await nb.waitForTimeout(350);
  const w19 = await gespeichert(nb), jetzt19 = Date.now();
  P.ok('weiter trainieren: wieder im Vollbild, der Satz ist abgehakt, die fehlenden stehen offen', await nb.evaluate(() => document.querySelector('#lsheet').open) && (await reihen19()) === '90×11✓ 90×11 90×11', await reihen19());
  P.ok('… als fortgesetzt gemerkt (re), mit Plan, die Uhr läuft weiter; die gespeicherte Einheit bleibt solange', w19.K.live.re === 1 && w19.K.live.plan === 'p' && w19.K.live.start <= jetzt19 && JSON.stringify(w19.K.log[heute]) === '{"a":[[90,11]]}' && (await text(nb, '#l-del')) === 'Änderungen verwerfen', JSON.stringify(w19.K.log[heute]) + ' ' + (await text(nb, '#l-del')));
  await nb.click('#l-tabs .lx-tab:has-text("Bankdrücken")');
  P.ok('… die noch nicht trainierte Übung des Plans steht mit ihrer Empfehlung da', (await reihen19()) === '40×11 40×11', await reihen19());
  await nb.click('#l-tabs .lx-tab:has-text("Latzug")'); await nb.click('.lt-r.act .chk'); await nb.click('#l-save'); await nb.waitForTimeout(250);
  P.ok('wieder beendet: Die Einheit trägt jetzt zwei Sätze', JSON.stringify((await gespeichert(nb)).K.log[heute]) === '{"a":[[90,11],[90,11]]}', JSON.stringify((await gespeichert(nb)).K.log[heute]));
  /* Ändern: Blatt „Einheit ändern“ mit Dauer. 45 Minuten → 2700 s, der Plan bleibt an der Einheit; ein Satz auf 9 Wiederholungen. */
  await nb.click('#rs-edit'); await nb.waitForTimeout(300);
  P.ok('„Ändern“ öffnet „Einheit ändern“ mit dem Feld für die Dauer', (await text(nb, '#ks-title')) === 'Einheit ändern' && await nb.evaluate(() => document.querySelector('#ksheet').open && !!document.querySelector('#k-dur')));
  await zahlWahl(nb, '#k-dur', '45'); await nb.fill('#k-r-0-1', '9'); await nb.click('#k-save'); await nb.waitForTimeout(250);
  const e19 = (await gespeichert(nb)).K;
  P.ok('gespeichert: Dauer 45 min (2700 s), der Plan bleibt, der zweite Satz hat 9 Wiederholungen', e19.meta[heute].dur === 2700 && e19.meta[heute].plan === 'p' && JSON.stringify(e19.log[heute]) === '{"a":[[90,11],[90,9]]}', JSON.stringify(e19.meta[heute]) + ' ' + JSON.stringify(e19.log[heute]));
  /* Aus „Einheit ändern“ weiter trainieren und dann verwerfen: Die Einheit bleibt, wie sie war; die Uhr stand bei 45 Minuten. */
  await nb.click('#v-training [data-fold="einheiten"]'); await nb.click('#v-training [data-k="day"][data-d="' + heute + '"]'); await nb.waitForTimeout(250);
  P.ok('Dauer steht im Feld, „Weiter trainieren“ ist da', (await text(nb, '#k-dur')) === '45 min' && await nb.evaluate(() => !document.querySelector('#k-weiter').hidden));
  await nb.click('#k-weiter'); await nb.waitForTimeout(350);
  const st19 = (await gespeichert(nb)).K.live.start;
  P.ok('weiter aus „Einheit ändern“: Die Uhr steht bei rund 45 Minuten', Math.abs(Date.now() - st19 - 2700000) < 5000, String(Date.now() - st19));
  await nb.click('#l-del'); await nb.click('#l-del'); await nb.waitForTimeout(200);
  const v19 = (await gespeichert(nb)).K;
  P.ok('„Änderungen verwerfen“: kein laufendes Training mehr, die Einheit ist unverändert', !v19.live && JSON.stringify(v19.log[heute]) === '{"a":[[90,11],[90,9]]}' && v19.meta[heute].dur === 2700, JSON.stringify(v19.log[heute]));
  /* v117, seine Meldung vom 25.11. („wenn ich Trainingszeit ändern will … Blatt geht zu, nichts geändert“): Die Zahlentastatur des iPhones hat keine Taste zum Schließen;
     wer daneben tippt, um sie loszuwerden, schloss bisher das ganze Blatt samt Eingabe. Jetzt bleibt das Blatt beim ersten Tipp daneben offen (die Tastatur geht zu, weil das Feld
     den Fokus verliert) und sagt „Noch nicht gespeichert“; erst der zweite Tipp verwirft. „Speichern“ übernimmt 80 Minuten = 4800 s. Dasselbe gilt für „Plan bearbeiten“. */
  const daneben = async () => { await nb.mouse.click(195, 6); await nb.waitForTimeout(120); };
  const k19 = () => nb.evaluate(() => ({ offen: document.querySelector('#ksheet').open, feld: document.activeElement && document.activeElement.id, dauer: document.querySelector('#k-dur').textContent, hinweis: document.querySelector('#k-err').hidden ? '' : document.querySelector('#k-err').textContent }));
  await nb.click('#v-training [data-k="day"][data-d="' + heute + '"]'); await nb.waitForTimeout(250);
  await zahlWahl(nb, '#k-dur', '80');
  await daneben(); const a19 = await k19();
  P.ok('Dauer getippt, Tipp neben das Blatt: Das Blatt bleibt offen, das Feld gibt den Fokus ab (Tastatur zu), die Eingabe steht noch da, unten steht „Noch nicht gespeichert“', a19.offen && a19.feld !== 'k-dur' && a19.dauer === '80 min' && a19.hinweis.indexOf('Noch nicht gespeichert') === 0, JSON.stringify(a19));
  await nb.click('#k-save'); await nb.waitForTimeout(250);
  P.ok('„Speichern“ übernimmt die Dauer: 80 min = 4800 s', (await gespeichert(nb)).K.meta[heute].dur === 4800 && !(await nb.evaluate(() => document.querySelector('#ksheet').open)), JSON.stringify((await gespeichert(nb)).K.meta[heute]));
  await nb.click('#v-training [data-k="day"][data-d="' + heute + '"]'); await nb.waitForTimeout(250);
  await daneben();
  P.ok('ohne Änderung schließt ein Tipp daneben das Blatt wie bisher', !(await nb.evaluate(() => document.querySelector('#ksheet').open)));
  await nb.click('#v-training [data-k="day"][data-d="' + heute + '"]'); await nb.waitForTimeout(250);
  await zahlWahl(nb, '#k-dur', '5');
  await daneben(); await daneben();
  P.ok('geändert, zweimal daneben getippt: verworfen, es bleibt bei 4800 s', !(await nb.evaluate(() => document.querySelector('#ksheet').open)) && (await gespeichert(nb)).K.meta[heute].dur === 4800);
  /* Plan bearbeiten: ein Satz mehr, Tipp daneben → bleibt offen mit Hinweis; zweiter Tipp verwirft (Latzug behält 3 Sätze). Ohne Änderung schließt der erste Tipp. */
  await nb.click('#v-training [data-k="plan"][data-id="p"]'); await nb.waitForTimeout(250);
  await nb.click('#p-items .prow[data-i="0"] [data-pa="inc"]'); await daneben();
  const p19 = await nb.evaluate(() => ({ offen: document.querySelector('#psheet').open, hinweis: document.querySelector('#p-err').hidden ? '' : document.querySelector('#p-err').textContent }));
  P.ok('Plan geändert, Tipp daneben: Das Blatt bleibt und sagt „Noch nicht gespeichert“', p19.offen && p19.hinweis.indexOf('Noch nicht gespeichert') === 0, JSON.stringify(p19));
  await daneben();
  P.ok('zweiter Tipp daneben verwirft: Latzug behält 3 Sätze', !(await nb.evaluate(() => document.querySelector('#psheet').open)) && (await gespeichert(nb)).K.plans.p.items[0].sets === 3);
  await nb.click('#v-training [data-k="plan"][data-id="p"]'); await nb.waitForTimeout(250); await daneben();
  P.ok('Plan ohne Änderung: Ein Tipp daneben schließt wie bisher', !(await nb.evaluate(() => document.querySelector('#psheet').open)));
  /* v122, seine zweite Meldung vom 25.11. („ich kann die Uhrzeit immer noch nicht anpassen“). Im Test-Browser ging der Weg weiter; gefunden wurden drei Stolpersteine, die jeder für sich zu „nichts geändert“ führen:
     (1) „Speichern“ lag am Ende des langen Blatts, weit unter dem Feld und mit offener Tastatur außer Sicht. Jetzt steht es fest am unteren Rand des Blatts (.fuss), auch über der Tastatur
         (hier nachgestellt mit --kb: 336 px; das Blatt endet dann 8 px darüber, bei 844 px Höhe also bei 500 px).
     (2) Das Kreuz oben schloss ohne Speichern und ohne Hinweis. Jetzt wie der Tipp daneben: erst der Hinweis (er steht direkt über „Speichern“ und ist zu sehen), der zweite Tipp verwirft.
     (3) Tippen hängte an den alten Wert an (aus 80 und „65“ wurde 8065: „Die Dauer ist eine Zahl in Minuten“).
     v123, seine dritte Meldung („ich kann die Zeit immer noch nicht editieren“): Die Dauer ist kein Feld mit der Tastatur des iPhones mehr, sondern ein Knopf, der „Zahl wählen“ öffnet
     (dasselbe Blatt wie für kg und Wdh im Training: Werte in 5-Minuten-Schritten zum Antippen, eigene Tasten, Haken). Getippt wird dort neu, nichts hängt an: 65 min = 3900 s. */
  const sicht = sel => nb.evaluate(q => { const k = document.querySelector('dialog[open]'), d = k.getBoundingClientRect(), r = document.querySelector(q).getBoundingClientRect(); return { lang: k.scrollHeight > k.clientHeight + 100, oben: k.scrollTop, drin: r.height > 0 && r.top >= d.top && r.bottom <= d.bottom + 0.5, unten: Math.round(r.bottom), blatt: Math.round(d.bottom) }; }, sel);
  await nb.setViewportSize({ width: 390, height: 480 });   // niedriger Bildschirm: Die Einheit der Testdaten (wenige Sätze) ist erst so länger als das Blatt, wie seine echten mit fünf Übungen
  await nb.click('#v-training [data-k="day"][data-d="' + heute + '"]'); await nb.waitForTimeout(250);
  const s1 = await sicht('#k-save'); await nb.setViewportSize({ width: 390, height: 844 }); await nb.waitForTimeout(150);
  P.ok('Einheit ändern: Das Blatt ist länger als der Bildschirm, „Speichern“ ist trotzdem ohne Scrollen im Blatt zu sehen', s1.lang && s1.oben === 0 && s1.drin, JSON.stringify(s1));
  await nb.evaluate(() => document.documentElement.style.setProperty('--kb', '336px')); await nb.waitForTimeout(300);
  await nb.click('#k-dur'); await nb.waitForTimeout(150);
  const z23 = await nb.evaluate(() => ({ z: document.querySelector('#zsheet').open, k: document.querySelector('#ksheet').open, titel: document.querySelector('#zs-title').textContent, wert: document.querySelector('#z-out').textContent,
    gewaehlt: (document.querySelector('#z-list [aria-pressed="true"]') || {}).textContent, liste: [...document.querySelectorAll('#z-list button')].map(b => b.textContent).filter((t, i, a) => i === 0 || i === a.length - 1).join(' bis '), komma: document.querySelector('#z-komma').disabled, tastatur: document.activeElement.tagName }));
  P.ok('Dauer angetippt: „Zahl wählen“ geht über dem Blatt auf (keine Tastatur des iPhones), 80 min ist gewählt, Werte von 20 bis 195 min in 5er-Schritten, kein Komma',
    z23.z && z23.k && z23.titel === 'Dauer in Minuten' && z23.wert === '80' && z23.gewaehlt === '80 min' && z23.liste === '20 min bis 195 min' && z23.komma && z23.tastatur !== 'INPUT', JSON.stringify(z23));
  await nb.keyboard.type('65'); await nb.keyboard.press('Enter'); await nb.waitForTimeout(150);
  const s2 = await sicht('#k-save'), wert = await text(nb, '#k-dur');
  P.ok('getippt wird neu (65, nicht 8065), der Haken übernimmt; „Speichern“ steht im Blatt darüber', wert === '65 min' && s2.drin && s2.unten <= 844 - 336 - 8 + 1, wert + ' ' + JSON.stringify(s2));
  await nb.click('#ks-close'); await nb.waitForTimeout(150); const a22 = await k19(), s3 = await sicht('#k-err');
  P.ok('geändert und das Kreuz getippt: Das Blatt bleibt offen, „Noch nicht gespeichert“ steht sichtbar über „Speichern“', a22.offen && a22.dauer === '65 min' && a22.hinweis.indexOf('Noch nicht gespeichert') === 0 && s3.drin, JSON.stringify([a22, s3]));
  await nb.click('#k-save'); await nb.waitForTimeout(250);
  P.ok('„Speichern“ übernimmt: 65 min = 3900 s', (await gespeichert(nb)).K.meta[heute].dur === 3900 && !(await nb.evaluate(() => document.querySelector('#ksheet').open)), JSON.stringify((await gespeichert(nb)).K.meta[heute]));
  await nb.evaluate(() => document.documentElement.style.setProperty('--kb', '0px'));
  await nb.click('#v-training [data-k="day"][data-d="' + heute + '"]'); await nb.waitForTimeout(250);
  await nb.click('#k-dur'); await nb.click('#z-list [data-zv="5"], #z-list button'); await nb.waitForTimeout(150); await nb.click('#ks-close'); await nb.waitForTimeout(150); await nb.click('#ks-close'); await nb.waitForTimeout(250);
  P.ok('geändert, zweimal das Kreuz: verworfen, es bleibt bei 3900 s; ohne Änderung schließt das Kreuz sofort', !(await nb.evaluate(() => document.querySelector('#ksheet').open)) && (await gespeichert(nb)).K.meta[heute].dur === 3900 &&
    await (async () => { await nb.click('#v-training [data-k="day"][data-d="' + heute + '"]'); await nb.waitForTimeout(250); await nb.click('#ks-close'); await nb.waitForTimeout(250); return !(await nb.evaluate(() => document.querySelector('#ksheet').open)); })());
  await nb.click('#v-training [data-k="plan"][data-id="p"]'); await nb.waitForTimeout(250);
  const s4 = await sicht('#p-save'); await nb.click('#p-items .prow[data-i="0"] [data-pa="inc"]'); await nb.click('#ps-close'); await nb.waitForTimeout(150);
  const p22 = await nb.evaluate(() => ({ offen: document.querySelector('#psheet').open, hinweis: document.querySelector('#p-err').hidden ? '' : document.querySelector('#p-err').textContent }));
  await nb.click('#ps-close'); await nb.waitForTimeout(250);
  P.ok('Plan bearbeiten: „Speichern“ ist im Blatt zu sehen; geändert und Kreuz → Hinweis, zweites Kreuz verwirft (Latzug behält 3 Sätze)', s4.drin && p22.offen && p22.hinweis.indexOf('Noch nicht gespeichert') === 0 && !(await nb.evaluate(() => document.querySelector('#psheet').open)) && (await gespeichert(nb)).K.plans.p.items[0].sets === 3, JSON.stringify([s4, p22]));
  await o19.browser.close();

  /* Statistik ab (v136): K.ab = 25.11.2026. Bankdrücken am 18.11. (100 kg × 12, vor dem Start) und am 25.11. (80 kg × 8).
     Gezählt werden beide Einheiten (Gym im November: 2), der Fortschritt beginnt am 25.11.: Im Blatt der Übung steht nur 80 kg, kein Rekord, keine 100 kg; die Liste der Einheiten zeigt beide Tage.
     Ohne K.ab (Vergleich) zählt der 18.11. mit: Dann ist 100 kg im Blatt zu sehen. */
  const abD = { S: { routines: [], running: null }, LY: {}, W: {}, MF: {}, MY: {}, T: {}, N: { folders: {}, tasks: {}, notes: {} },
    K: { ab: '2026-11-25', ex: { b: { n: 'Bankdrücken' } }, log: { '2026-11-18': { b: [[100, 12]] }, '2026-11-25': { b: [[80, 8]] } }, plans: {}, meta: {}, live: null } };
  const o20 = await oeffnen({ uhr: new Date(2026, 10, 27, 12), daten: abD }), ab = o20.page;
  await bereich(ab, 'training'); await ab.click('#v-training .subtabs [data-v="kraft"]'); await ab.waitForTimeout(200);
  const abHero = await text(ab, '#v-training .hero');
  P.ok('Statistik ab 25.11.: beide Einheiten zählen im November (2)', /2\s*Einheiten/.test(abHero), abHero);
  await ab.click('#v-training [data-fold="uebungen"]'); await ab.waitForTimeout(150);
  await uebAuf(ab); await ab.click('#v-training .folds [data-k="ex"]:has-text("Bankdrücken")'); await ab.waitForTimeout(200);
  const abX = await text(ab, '#xsheet');
  P.ok('Statistik ab 25.11.: im Blatt der Übung nur 80 kg, die 100 kg vom 18.11. zählen nicht', abX.includes('80') && !abX.includes('100'), abX.slice(0, 300));
  P.ok('Statistik ab bleibt nach dem Speichern erhalten', (await gespeichert(ab)).K.ab === '2026-11-25');
  await o20.browser.close();
  const o21 = await oeffnen({ uhr: new Date(2026, 10, 27, 12), daten: Object.assign({}, abD, { K: Object.assign({}, abD.K, { ab: undefined }) }) }), ab2 = o21.page;
  await bereich(ab2, 'training'); await ab2.click('#v-training .subtabs [data-v="kraft"]'); await ab2.waitForTimeout(200);
  await ab2.click('#v-training [data-fold="uebungen"]'); await ab2.waitForTimeout(150);
  await uebAuf(ab2); await ab2.click('#v-training .folds [data-k="ex"]:has-text("Bankdrücken")'); await ab2.waitForTimeout(200);
  P.ok('ohne Statistik-Start zählt der 18.11. mit (100 kg im Blatt)', (await text(ab2, '#xsheet')).includes('100'));
  await o21.browser.close();
  /* v148: Name des ganzen Plans (sein Wort: „Name des Gym-Plans änderbar“) und die Leiste „Übungen | Einheiten“ (immer nur ein Teil offen) */
  const o22 = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, K: { ex: { a: { n: 'Rudern' } }, log: { [tag(0)]: { a: [[60, 10]] } }, plans: { p: { n: 'Torso', items: [{ id: 'a', sets: 3 }], o: 1 } }, meta: {}, live: null } } }), pn = o22.page;
  await bereich(pn, 'training');
  P.ok('Ohne eigenen Namen heißt die Überschrift „Plan“', (await text(pn, '#v-training h2.sec')).startsWith('Plan'));
  await pn.click('#v-training h2.sec [data-k="ordnen"]'); await pn.waitForTimeout(100);
  await pn.fill('#o-name', 'Torso & Beine');
  P.ok('Name des Plans: steht sofort in der Überschrift (als Text) und ist gespeichert', (await text(pn, '#v-training h2.sec')).startsWith('Torso & Beine') && (await gespeichert(pn)).K.pn === 'Torso & Beine');
  await pn.click('#os-close'); await pn.reload(); await pn.waitForTimeout(300); await bereich(pn, 'training');
  P.ok('… und nach neuem Laden noch da', (await text(pn, '#v-training h2.sec')).startsWith('Torso & Beine'));
  await pn.click('#v-training h2.sec [data-k="ordnen"]'); await pn.waitForTimeout(100);
  P.ok('Im Blatt „Plan“ steht der Name im Feld', (await pn.inputValue('#o-name')) === 'Torso & Beine');
  await pn.fill('#o-name', ''); await pn.click('#os-close'); await pn.waitForTimeout(100);
  P.ok('Leer: wieder „Plan“', (await text(pn, '#v-training h2.sec')).startsWith('Plan') && !('pn' in (await gespeichert(pn)).K && (await gespeichert(pn)).K.pn));
  const leiste = () => pn.evaluate(() => [...document.querySelectorAll('#v-training .kb-r [data-fold]')].map(b => b.textContent.trim() + (b.getAttribute('aria-expanded') === 'true' ? '*' : '')).join(' | ') + ' # ' + document.querySelectorAll('#v-training .kbar > li:not(.kb-r)').length);
  P.ok('Leiste: „Übungen 1“ und „Einheiten 1“ nebeneinander, beide zu', (await leiste()) === 'Übungen1 | Einheiten1 # 0', await leiste());
  await pn.click('#v-training [data-fold="uebungen"]');
  P.ok('Tipp auf „Übungen“: deren Liste unter der Leiste (Überschrift „Rücken“ und Rudern)', (await leiste()) === 'Übungen1* | Einheiten1 # 2', await leiste());
  await pn.click('#v-training [data-fold="einheiten"]');
  P.ok('Tipp auf „Einheiten“: „Übungen“ geht zu, die Einheiten stehen darunter', (await leiste()) === 'Übungen1 | Einheiten1* # 1' && !!(await pn.$('#v-training [data-k="day"]')), await leiste());
  await pn.click('#v-training [data-fold="einheiten"]');
  P.ok('Zweiter Tipp: zu', (await leiste()) === 'Übungen1 | Einheiten1 # 0', await leiste());
  await o22.browser.close();
  await P.ende(null, fehler.concat(o22.fehler, o20.fehler, o21.fehler, o17.fehler, o18.fehler, oKu.fehler, oSk.fehler, oUe.fehler, o19.fehler, o14.fehler, o15.fehler, o16.fehler, w.fehler, g.fehler, r.fehler, e.fehler, b5.fehler, h6.fehler, o7.fehler, o8.fehler, o9.fehler, o10.fehler, o11.fehler, o12.fehler, o13.fehler));
});
