// Finanzen (seit v156 nur noch das Haushaltsbuch): Sparquote, Fixkosten aufs Jahr, fremde Kennungen, Ausgabe und Einnahme in einem Blatt, Datum beim Eintragen,
// Monatswechsel bei offener App. Vermögen (Konten, Stände, Sparziele, Umbuchungen) ist ausgebaut; Teil 1 prüft, dass es nirgends mehr steht und alte Daten bleiben.
// Jede Zahl ist von Hand nachgerechnet und steht als Erwartung im Test.
const { APP, oeffnen, text, bereich, gespeichert, pruefer, lauf, monat, nachOben } = require('./lib');

/* Die Uhr der App steht für die ganze Reihe auf dem 15. des laufenden Monats, 12 Uhr, und läuft von dort weiter. So hängt kein Ergebnis vom Tag ab, an dem die Reihe läuft.
   Deshalb hier kein tag() aus lib.js (das folgt der Uhr von Node): „heute“ kommt aus dem Monat. */
const M = monat(0), heute = M + '-15', um12 = (ym, t) => new Date(+ym.slice(0, 4), +ym.slice(5) - 1, t, 12);
const NAMEN = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'], name = ym => NAMEN[+ym.slice(5) - 1] + ' ' + ym.slice(0, 4);

lauf(async () => {
  const P = pruefer('Finanzen'), { browser, page, fehler } = await oeffnen({ uhr: um12(M, 15) });
  const chip = (box, name) => page.click(box + ' .chip:has-text("' + name + '")');
  const speichern = async knopf => { await page.click(knopf); await page.waitForTimeout(150); };
  /* Schnell eintragen wie aus dem Widget oder einem Kurzbefehl (seit v131 gibt es auf Heute keinen Knopf „Ausgabe“ mehr): die Adresse mit ?neu=ausgabe öffnet das Blatt */
  const schnell = async () => { await page.goto(APP + '?neu=ausgabe'); await page.waitForTimeout(300); };

  /* --- Teil 1 (v156): Daten aus der Zeit mit Vermögen: zwei Konten mit Stand, ein Sparziel, eine Umbuchung über 100 €, eine Ausgabe „Rewe“ vom Girokonto über 30 € ---
     Erwartet: Finanzen zeigt nichts davon außer der Ausgabe; das Blatt bietet kein Konto an; eine neue Ausgabe hat kein Konto; die alte behält ihres beim Ändern;
     alles Gespeicherte bleibt. Ausgaben im Monat: 30 € (die Umbuchung zählt nicht), nach dem Ändern 31 €, mit der neuen 4,50 € zusammen 35,50 €. */
  await page.evaluate(m => {
    const MY = {}; MY[m.slice(0, 4)] = { tx: { k: { d: m + '-10', a: 3000, k: 'out', c: 'essen', n: 'Rewe', acc: 'g', t: 1 }, u: { d: m + '-11', a: 10000, k: 'tr', c: '', n: '', acc: 'g', to: 's', t: 2 } } };
    const MF = { fixed: {}, acc: { g: { n: 'Girokonto' }, s: { n: 'Sparkonto' } }, bal: { [m]: { g: 100000, s: 50000 } }, goals: { z: { n: 'Urlaub', amount: 200000, acc: null } } };
    localStorage.setItem('takt.v1', JSON.stringify({ S: { routines: [] }, LY: {}, MF, MY }));
  }, M);
  await page.reload(); await page.waitForTimeout(300); await bereich(page, 'haushalt');
  const fin = await text(page, '#v-haushalt');
  P.ok('Finanzen ohne Umschalter und ohne Vermögen, Konten, Sparziel, Umbuchung', !(await page.$('#v-haushalt .subtabs')) && !['Vermögen', 'Girokonto', 'Urlaub', 'Umbuchung'].some(w => fin.includes(w)), fin.slice(0, 300));
  await page.click('#add');
  P.ok('Plus oben öffnet „Ausgabe eintragen“, ohne Feld für ein Konto', (await text(page, '#ms-title')) === 'Ausgabe eintragen' && !(await page.$('#m-acc, #m-to, #m-day, #vsheet')), await text(page, '#ms-title'));
  await page.fill('#m-amt', '4,50'); await speichern('#m-save');
  const tx1 = Object.values((await gespeichert(page)).MY[M.slice(0, 4)].tx).filter(Boolean);
  P.ok('neue Ausgabe ohne Konto gespeichert', tx1.some(t => t.a === 450 && !t.acc), JSON.stringify(tx1));
  if (!(await page.$('#v-haushalt [data-m="tx"][data-id="k"]'))) await page.click('#v-haushalt [data-fold="ausgaben"]');
  await page.click('#v-haushalt [data-m="tx"][data-id="k"]'); await page.fill('#m-amt', '31'); await speichern('#m-save');
  const g2 = await gespeichert(page), k2 = g2.MY[M.slice(0, 4)].tx.k;
  P.ok('alte Ausgabe geändert (31 €): behält ihr Konto', k2.a === 3100 && k2.acc === 'g', JSON.stringify(k2));
  P.ok('Konten, Stände, Sparziel und Umbuchung bleiben gespeichert', g2.MF.acc.g.n === 'Girokonto' && g2.MF.bal[M].g === 100000 && g2.MF.goals.z.n === 'Urlaub' && g2.MY[M.slice(0, 4)].tx.u.k === 'tr', JSON.stringify(g2.MF));
  P.enthaelt('Ausgaben im Monat: 31 + 4,50 = 35,50 € (die Umbuchung zählt nicht)', await text(page, '#v-haushalt'), ['35,50']);
  await bereich(page, 'heute');
  P.ok('Heute: keine Zeile „Vermögen“', !(await text(page, '#v-heute')).includes('Vermögen'));

  /* „+ Fixkosten“: ohne Fixkosten die Zeile selbst, sonst die letzte Zeile der aufgeklappten Liste */
  const neuFix = async () => { if (!(await page.$('#v-haushalt [data-m="newfix"]'))) await page.click('#v-haushalt [data-fold="fixkosten"]'); await page.click('#v-haushalt [data-m="newfix"]'); };
  // --- Teil 5: Sparquote und Fixkosten aufs Jahr ---
  await page.evaluate(([m3, m2, m1]) => {
    const o = JSON.parse(localStorage.getItem('takt.v1'));
    const MF = { fixed: { i: { name: 'Gehalt', amount: 200000, kind: 'in', every: 1, from: m3, to: null }, f: { name: 'Miete', amount: 60000, kind: 'fix', every: 1, from: m3, to: null }, q: { name: 'Versicherung', amount: 9000, kind: 'fix', every: 3, from: m3, to: null } } };
    const MY = {}; const add = (id, ym, a) => { const y = ym.slice(0, 4); MY[y] = MY[y] || { tx: {} }; MY[y].tx[id] = { d: ym + '-05', a, k: 'out', c: 'essen', n: '' }; };
    add('a', m2, 40000); add('b', m1, 20000);
    localStorage.setItem('takt.v1', JSON.stringify({ S: o.S, LY: {}, MF, MY }));
  }, [monat(3), monat(2), monat(1)]);
  await page.reload(); await page.waitForTimeout(300); await bereich(page, 'haushalt');
  P.enthaelt('laufender Monat heißt „Sparquote bisher“, ohne Vergleich', await text(page, '#v-haushalt .kv'), ['Sparquote bisher']);
  P.enthaelt('Fixkosten aufs Jahr: Miete 7.200, Versicherung 360, Summe 7.560', await (async () => { await page.click('#v-haushalt [data-fold="fixkosten"]'); return text(page, '#v-haushalt .fo, #v-haushalt [data-m="fixed"]'); })(), ['7.560 € im Jahr', '7.200 € im Jahr', '360 € im Jahr']);
  await nachOben(page); await page.click('#v-haushalt .mnav button:first-child');
  P.enthaelt('Vormonat: (2.000 − 600 − 200) / 2.000 = 60 %, davor 50 %', await text(page, '#v-haushalt .kv'), ['Sparquote', '60 %', '+10 Prozentpunkte']);
  /* Der Vergleich steht in einer eigenen Zeile unter dem Wert, nicht daneben */
  const lage = await page.evaluate(() => { const k = document.querySelector('#v-haushalt .kv'), w = k.querySelector('b').getBoundingClientRect(), d = k.querySelector('.delta').getBoundingClientRect(); return { darunter: d.top >= w.bottom - 4, rechts: Math.abs(d.right - w.right) < 2 }; });
  P.ok('Vergleich steht unter dem Wert, rechtsbündig', lage.darunter && lage.rechts, JSON.stringify(lage));

  // --- Kennungen aus einer fremden Datei: Eine Kennung mit Anführungszeichen und HTML darf nichts in die Seite einschleusen ---
  // Budget-Schlüssel und Kennung einer eigenen Kategorie (11 Zeichen, erlaubt sind 12) tragen ein Element; es darf nirgends entstehen
  await page.evaluate(d => {
    const kat = 'a"><i id=q>', MY = {}; MY[d.slice(0, 4)] = { tx: { a: { d, a: 1000, k: 'out', c: kat, n: '' } } };
    const MF = { fixed: {}, budgets: { 'x"><b id="inj">E</b><i a="': 5000 }, cats: {} }; MF.cats[kat] = { n: 'Fremd' };
    localStorage.setItem('takt.v1', JSON.stringify({ S: { routines: [] }, LY: {}, MF, MY }));
  }, heute);
  await page.reload(); await page.waitForTimeout(300); await bereich(page, 'haushalt');
  const fremd = () => page.evaluate(() => !!document.querySelector('#inj, #q'));
  P.ok('Budget mit fremden Kennungen: beide Zeilen da, nichts eingeschleust', (await page.$$('#v-haushalt .cat')).length === 2 && !(await fremd()), await text(page, '#v-haushalt .cats'));
  await page.click('#v-haushalt [data-m="add"]'); await page.click('#m-cat [data-c="__more"]');
  P.ok('Blatt mit allen Kategorien: nichts eingeschleust', !(await fremd()));
  await chip('#m-cat', 'Fremd');
  P.ok('die fremde Kategorie lässt sich weiter wählen', (await text(page, '#m-cat [aria-pressed="true"]')) === 'Fremd');
  await page.click('#ms-close');

  // --- Schnell-Knopf „Ausgabe“ auf Heute bucht auf heute, auch wenn in den Finanzen gerade ein anderer Monat gewählt ist ---
  // Im Bereich selbst bleibt es dabei: Wer dort im Vormonat steht und „Ausgabe“ tippt, bekommt dessen letzten Tag vorgeschlagen.
  const vm = monat(1), vmEnde = vm + '-' + new Date(+vm.slice(0, 4), +vm.slice(5), 0).getDate();
  await nachOben(page); await page.click('#v-haushalt .mnav button:first-child');
  await page.click('#v-haushalt [data-m="add"]');
  P.ok('im Vormonat: Datum ist dessen letzter Tag (' + vmEnde + ')', (await page.inputValue('#m-date')) === vmEnde, await page.inputValue('#m-date'));
  await page.click('#ms-close');
  await schnell();
  P.ok('Schnell eintragen (Widget, Kurzbefehl: ?neu=ausgabe): Datum ist heute', (await page.inputValue('#m-date')) === heute, await page.inputValue('#m-date'));
  await page.click('#ms-close');   // nach dem Neuladen über die Adresse steht der laufende Monat schon wieder da

  // --- Ein Knopf für Ausgabe und Einnahme (v56): Das Blatt öffnet als Ausgabe, oben schaltet man auf Einnahme um ---
  const txAlle = async () => Object.values((await gespeichert(page)).MY).flatMap(y => Object.values(y.tx)).filter(Boolean);
  await schnell();
  P.ok('Blatt öffnet als Ausgabe, mit Kategorie', (await text(page, '#ms-title')) === 'Ausgabe eintragen' && await page.isVisible('#m-cat-fld') && (await page.getAttribute('#m-kind [data-k="out"]', 'aria-pressed')) === 'true');
  await page.click('#m-kind [data-k="in"]');
  P.ok('umgeschaltet auf Einnahme: Titel wechselt, keine Kategorie', (await text(page, '#ms-title')) === 'Einnahme eintragen' && !(await page.isVisible('#m-cat-fld')) && (await page.getAttribute('#m-kind [data-k="in"]', 'aria-pressed')) === 'true');
  await page.fill('#m-amt', '77,70'); await speichern('#m-save');
  P.ok('als Einnahme von 77,70 € gespeichert', (await txAlle()).some(t => t.a === 7770 && t.k === 'in'), JSON.stringify((await txAlle()).filter(t => t.a === 7770)));
  await schnell(); await page.click('#m-kind [data-k="in"]'); await page.click('#m-kind [data-k="out"]'); await page.fill('#m-amt', '8,80'); await speichern('#m-save');
  P.ok('hin und zurück geschaltet: Ausgabe von 8,80 € mit Kategorie', (await txAlle()).some(t => t.a === 880 && t.k === 'out' && t.c === 'essen'));
  await bereich(page, 'haushalt'); await neuFix();
  P.ok('feste Posten: kein Umschalter', !(await page.isVisible('#m-kind')));
  await page.click('#ms-close');

  P.ok('gespeicherte Daten sind lesbar', !!(await gespeichert(page)).MF);

  // --- Monatswechsel, während die App offen ist (die iPhone-App bleibt tagelang im Speicher): Der gewählte Monat geht mit ---
  // Uhr auf den 1. des nächsten Monats; die App zeichnet neu, wenn sie wieder nach vorn kommt (visibilitychange).
  const M1 = monat(-1), M2 = monat(-2), wach = () => page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  const titel = () => text(page, '#v-haushalt .mnav b');
  await bereich(page, 'haushalt');
  P.ok('vor dem Wechsel: ' + name(M), (await titel()) === name(M), await titel());
  await page.clock.setFixedTime(um12(M1, 1)); await wach(); await page.waitForTimeout(150);
  P.ok('am 1. zeigt der Bereich den neuen Monat: ' + name(M1), (await titel()) === name(M1), await titel());
  await page.click('#v-haushalt [data-m="add"]');
  P.ok('neue Ausgabe: Datum ist der 1. des neuen Monats', (await page.inputValue('#m-date')) === M1 + '-01', await page.inputValue('#m-date'));
  await page.click('#ms-close');
  // Wer bewusst einen früheren Monat gewählt hat, bleibt dort
  await page.click('#v-haushalt .mnav button:first-child');
  await page.clock.setFixedTime(um12(M2, 1)); await wach(); await page.waitForTimeout(150);
  P.ok('ein gewählter früherer Monat bleibt beim nächsten Wechsel stehen: ' + name(M), (await titel()) === name(M), await titel());
  await browser.close();
  await P.ende(null, fehler);
});
