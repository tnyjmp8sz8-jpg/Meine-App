// Finanzen: Konten, gerechneter Kontostand, Umbuchung, feste Posten, Vermögen über Monate, Sparziele, Sparquote.
// Jede Zahl ist von Hand nachgerechnet und steht als Erwartung im Test.
const { oeffnen, text, bereich, gespeichert, pruefer, lauf, monat, zahl, nachOben } = require('./lib');

/* Die Uhr der App steht für die ganze Reihe auf dem 15. des laufenden Monats, 12 Uhr, und läuft von dort weiter. So hängt kein Ergebnis vom Tag ab, an dem die Reihe läuft:
   Am 1. läge „gestern“ im Vormonat, und ab dem 28. zählen feste Posten vom 28. schon mit. Was am 28. gilt, prüft Teil 7 mit eigener Uhr.
   Deshalb hier kein tag() aus lib.js (das folgt der Uhr von Node): „heute“ und „gestern“ kommen aus dem Monat. */
const M = monat(0), heute = M + '-15', gestern = M + '-14', um12 = (ym, t) => new Date(+ym.slice(0, 4), +ym.slice(5) - 1, t, 12);
const NAMEN = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'], name = ym => NAMEN[+ym.slice(5) - 1] + ' ' + ym.slice(0, 4);
/* Daten für Teil 3: Stand vor zwei Monaten (gilt zum Monatsende), Miete am 1., Gehalt am 28., eine Ausgabe im Vormonat */
const daten3 = pg => pg.evaluate(([m5, m2, m1]) => {
  const MF = { fixed: { r: { name: 'Miete', amount: 40000, kind: 'fix', every: 1, from: m5, to: null, acc: 'g', day: 1 }, s: { name: 'Gehalt', amount: 100000, kind: 'in', every: 1, from: m5, to: null, acc: 'g', day: 28 } }, acc: { g: { n: 'Girokonto' } }, bal: {}, balT: {}, goals: {} };
  MF.bal[m2] = { g: 50000 };
  const MY = {}; MY[m1.slice(0, 4)] = { tx: { a: { d: m1 + '-10', a: 2500, k: 'out', c: 'essen', n: '', acc: 'g', t: 1 } } };
  localStorage.setItem('takt.v1', JSON.stringify({ S: { routines: [] }, LY: {}, MF, MY }));
}, [monat(5), monat(2), monat(1)]);
/* Daten für Teil 6, der Fall des Nutzers: Stand aus v38 (ohne Zeitpunkt) im laufenden Monat, ein Konto, dazu ohne Konto: eine Ausgabe von 12 nach dem Stand (am Tag d.tag),
   eine von 5 am Tag davor (d.vor), Miete als fester Posten. Die Zeitpunkte kommen von der Uhr der Seite. */
const daten6 = (pg, d) => pg.evaluate(d => {
  const MY = {}, tx = (id, tag, a, n, alter) => { const y = tag.slice(0, 4); MY[y] = MY[y] || { tx: {} }; MY[y].tx[id] = { d: tag, a, k: 'out', c: 'essen', n, t: Date.now() - alter }; };
  tx('alt', d.tag, 1200, 'Alt', 1000); tx('vor', d.vor, 500, 'Davor', 2000);
  localStorage.setItem('takt.v1', JSON.stringify({ S: { routines: [] }, LY: {}, W: {}, T: {}, K: {}, MY,
    MF: { fixed: { m: { name: 'Miete', amount: 40000, kind: 'fix', every: 1, from: d.ym } }, acc: { g: { n: 'Girokonto' } }, bal: { [d.ym]: { g: 100000 } } } }));
}, d);

lauf(async () => {
  const P = pruefer('Finanzen'), { browser, page, fehler } = await oeffnen({ uhr: um12(M, 15) });
  const sub = v => page.click('#v-haushalt [data-m="sub"][data-v="' + v + '"]');
  const konten = async () => { await sub('verm'); return (await text(page, '#v-haushalt .hero h1')) + ' || ' + (await text(page, '#v-haushalt [data-m="bal"].two')); };
  const feld = name => '#vsheet .vrow:has(.vname[value="' + name + '"]) [data-acc]';
  const chip = (box, name) => page.click(box + ' .chip:has-text("' + name + '")');
  const speichern = async knopf => { await page.click(knopf); await page.waitForTimeout(150); };
  const buchen = async (art, betrag, konto, datum) => {
    await sub('budget'); await page.click(art === 'in' ? '#v-haushalt [data-m="income"]' : '#v-haushalt [data-m="add"]'); await page.fill('#m-amt', betrag);
    if (konto) await chip('#m-acc', konto);
    if (datum) await page.fill('#m-date', datum);
    await speichern('#m-save');
  };

  // --- Teil 1: Stand einmal eintragen, danach rechnet die App ---
  await bereich(page, 'haushalt');
  P.ok('leere App startet im Bereich Vermögen', (await text(page, '#v-haushalt .subtabs [aria-pressed="true"]')) === 'Vermögen');
  await page.click('#v-haushalt [data-m="bal"]');
  for (const n of ['Girokonto', 'Bargeld']) { await page.fill('#v-new', n); await page.click('#v-new-add'); }
  await page.fill('#v-new', 'girokonto'); await page.click('#v-new-add');
  P.enthaelt('doppelter Kontoname wird abgelehnt', await text(page, '#v-err'), ['gibt es schon']);
  await page.fill('#v-new', ''); await page.fill(feld('Girokonto'), '1000'); await page.fill(feld('Bargeld'), '50'); await speichern('#v-save');
  P.enthaelt('Stand eingetragen: 1.000 + 50', await konten(), ['1.050', 'Girokonto 1.000', 'Bargeld 50']);

  // Zwei Konten, noch keine Buchung: nichts ist vorbelegt, ohne Wahl wird nicht gespeichert
  await sub('budget'); await page.click('#v-haushalt [data-m="add"]'); await page.fill('#m-amt', '30');
  P.ok('zwei Konten ohne Vorgeschichte: kein Konto vorbelegt', (await text(page, '#m-acc [aria-pressed="true"]')) === '');
  await speichern('#m-save');
  P.enthaelt('ohne Wahl des Kontos wird nicht gespeichert', await text(page, '#m-err'), ['Wähle ein Konto']);
  await page.click('#ms-close');
  await buchen('out', '30', 'Girokonto');
  P.enthaelt('Ausgabe 30 vom Girokonto', await konten(), ['1.020', 'gerechnet seit', '970 €']);
  await buchen('out', '10', 'Kein Konto');
  P.enthaelt('Ausgabe ohne Konto ändert keinen Stand', await konten(), ['1.020', '970 €']);
  await sub('budget'); await page.click('#v-haushalt [data-m="income"]');
  P.ok('zuletzt benutztes Konto ist vorausgewählt', (await text(page, '#m-acc [aria-pressed="true"]')) === 'Girokonto');
  await page.fill('#m-amt', '200'); await speichern('#m-save');
  P.enthaelt('Einnahme 200 aufs Girokonto', await konten(), ['1.220', '1.170 €']);

  await sub('verm'); await page.click('#v-haushalt [data-m="newtr"]');
  P.ok('Umbuchung: kein Umschalter Ausgabe/Einnahme', !(await page.isVisible('#m-kind')));
  await page.fill('#m-amt', '100'); await chip('#m-acc', 'Girokonto'); await chip('#m-to', 'Bargeld'); await speichern('#m-save');
  P.enthaelt('Umbuchung 100 vom Girokonto zum Bargeld', await konten(), ['1.220', '1.070 €', '150 €']);
  await page.click('#v-haushalt [data-fold="umbuchungen"]');   // Umbuchungen aufklappen
  P.enthaelt('Umbuchung steht im Bereich Vermögen', await text(page, '#v-haushalt [data-m="tx"]'), ['Girokonto → Bargeld', '100,00 €']);

  await sub('budget'); await page.click('#v-haushalt [data-m="newfix"]'); await page.fill('#m-name', 'Miete'); await page.fill('#m-amt', '400'); await chip('#m-acc', 'Girokonto');
  P.ok('fester Posten mit Konto fragt nach dem Tag im Monat', await page.isVisible('#m-day'));
  await page.fill('#m-day', '1'); await speichern('#m-save');
  P.enthaelt('Miete am 1. steckt schon im eingetragenen Stand', await konten(), ['1.220', '1.070 €']);
  await buchen('out', '20', 'Girokonto', gestern);
  P.enthaelt('rückdatierte Ausgabe (gestern) ändert den Stand nicht', await konten(), ['1.220', '1.070 €']);

  await sub('verm'); await page.click('#add');
  P.ok('Blatt zeigt den gerechneten Stand', (await page.$$eval('#vsheet [data-acc]', l => l.map(i => i.value).join(' / '))) === '150,00 / 1.070,00');
  await speichern('#v-save');
  P.enthaelt('unverändert speichern verschiebt nichts', await konten(), ['1.220', '1.070 €', '150 €']);
  await page.click('#add'); await page.fill(feld('Bargeld'), '140'); await speichern('#v-save');
  P.enthaelt('Bargeld auf 140 korrigiert', await konten(), ['1.210', 'Bargeld 140 €', '1.070 €']);
  await buchen('out', '5', 'Girokonto');
  P.enthaelt('nach der Korrektur wird weitergerechnet', await konten(), ['1.205', '1.065 €']);

  await sub('budget');
  P.enthaelt('Budget zählt die Umbuchung nicht: 200 ein, 400 fix, 65 flexibel', await text(page, '#v-haushalt .figs .fig'), ['200', '400', '65']);
  await page.click('#v-haushalt [data-fold="ausgaben"]');   // Ausgaben aufklappen
  P.enthaelt('Buchungszeile nennt das Konto', await text(page, '#v-haushalt [data-m="tx"]'), ['Heute · Girokonto']);

  // --- Teil 2: Konto beim Buchen anlegen, umbenennen ---
  /* Das Blatt setzt 60 ms nach dem Öffnen den Fokus ins Betragsfeld. Erst danach geht es weiter: Der Test ist sonst gelegentlich schneller, und der Kontoname
     landet im Betragsfeld (fill() setzt den Fokus und tippt dann; dazwischen darf der Fokus nicht springen). Ein Mensch ist nie so schnell. */
  await page.click('#v-haushalt [data-m="add"]'); await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'm-amt');
  await page.fill('#m-amt', '7'); await page.click('#m-acc [data-a="__new"]'); await page.fill('#m-accnew', 'PayPal'); await page.click('#m-accnew-add');
  P.ok('neues Konto ist angelegt und ausgewählt', (await text(page, '#m-acc [aria-pressed="true"]')) === 'PayPal');
  await speichern('#m-save');
  P.enthaelt('Konto ohne Stand erscheint mit Hinweis', await konten(), ['PayPal noch kein Stand eingetragen', '1.205']);
  await page.click('#add'); await page.fill('#vsheet .vname[value="PayPal"]', 'PayPal privat'); await page.dispatchEvent('#vsheet .vname[value="PayPal"]', 'change'); await page.click('#vs-close');
  P.enthaelt('Konto umbenannt', await konten(), ['PayPal privat']);
  await page.reload(); await page.waitForTimeout(300); await bereich(page, 'haushalt');
  P.enthaelt('nach dem Neuladen unverändert', await konten(), ['1.205', '1.065 €', '140 €', 'PayPal privat']);

  // --- Teil 3: vergangene Monate. Stand vor zwei Monaten (gilt zum Monatsende), Miete am 1., Gehalt am 28., eine Ausgabe im Vormonat ---
  await daten3(page);
  await page.reload(); await page.waitForTimeout(300); await bereich(page, 'haushalt'); await sub('verm');
  // Vormonat 500 − 400 + 1.000 − 25 = 1.075; am 15. kommt nur die Miete dazu: 1.075 − 400 = 675
  const vormonat = 500 - 400 + 1000 - 25, jetzt = vormonat - 400;
  P.enthaelt('laufender Monat am 15.: Miete zählt, Gehalt vom 28. noch nicht (675)', await text(page, '#v-haushalt .hero h1'), [zahl(jetzt)]);
  await page.click('#v-haushalt .mnav button:first-child');
  P.enthaelt('Vormonat: 500 − 400 + 1.000 − 25', await text(page, '#v-haushalt .hero h1'), [zahl(vormonat)]);
  await page.click('#v-haushalt .mnav button:first-child');
  P.enthaelt('Monat des Stands: 500', await text(page, '#v-haushalt .hero h1'), ['500']);

  // --- Teil 4: Vermögen über vier Monate, drei Konten, zwei Sparziele (ohne Buchungen, nur eingetragene Stände) ---
  await page.evaluate(ms => {
    const o = JSON.parse(localStorage.getItem('takt.v1'));
    const MF = { fixed: {}, acc: { d: { n: 'Depot' }, g: { n: 'Girokonto' }, s: { n: 'Sparkonto' } }, bal: {}, balT: {}, goals: { a: { n: 'Notgroschen', amount: 500000, acc: 's' }, b: { n: 'Auto', amount: 2000000, acc: null } } };
    MF.bal[ms[3]] = { d: 500000, g: 120000, s: 200000 }; MF.bal[ms[2]] = { d: 515000, g: 135050, s: 230000 }; MF.bal[ms[1]] = { g: 90000, s: 260000 }; MF.bal[ms[0]] = { d: 590000, g: 148000, s: 300000 };
    localStorage.setItem('takt.v1', JSON.stringify({ S: o.S, LY: {}, MF, MY: {} }));
  }, [monat(0), monat(1), monat(2), monat(3)]);
  await page.reload(); await page.waitForTimeout(300); await bereich(page, 'haushalt'); await sub('verm');
  P.enthaelt('Vermögen 10.380, im Monat +1.730 = +20,0 %', await text(page, '#v-haushalt .hero h1, #v-haushalt .figs .fig'), ['10.380', '+1.730 €', '+20,0 %']);
  P.enthaelt('Konten mit eigenem Plus', await text(page, '#v-haushalt [data-m="bal"].two'), ['Depot 5.900 € +750 €', 'Girokonto 1.480 € +580 €', 'Sparkonto 3.000 € +400 €']);
  P.enthaelt('Sparziele: 51 % von 20.000, 60 % von 5.000', await text(page, '#v-haushalt .row.goal'), ['noch 9.620 €', '51 %', 'noch 2.000 €', '60 %', 'Sparkonto']);
  await page.click('#v-haushalt .mnav button:first-child');
  P.enthaelt('Vormonat: Depot ohne Eintrag behält 5.150, gesamt 8.650, −151', await text(page, '#v-haushalt .hero h1, #v-haushalt .figs .fig, #v-haushalt [data-m="bal"].two'), ['8.650', '−151 €', 'Depot 5.150 € ±0 €']);
  await page.click('#v-haushalt [data-m="mode"][data-v="year"]');
  await page.click('#v-haushalt [data-fold="vermMonate"]');
  P.ok('Jahresansicht zeigt Monate zum Antippen', (await page.$$('#v-haushalt [data-m="goto"]')).length >= 1);

  // --- Sparziele in ganzen Prozent: abgerundet, aber nie eins zu wenig. 0,29 × 100 ist als Kommazahl 28,999…; mit Cent gerechnet (290.000 × 100 / 1.000.000) genau 29 ---
  // A: 2.900 von 10.000 € = 29 %. B: 570 von 1.000 € = 57 %. C: 580 von 1.000 € = 58 %. D (gesamtes Vermögen): 2.900 + 570 + 580 = 4.050 von 10.000 € = 40,5 %, abgerundet 40 %.
  await page.evaluate(m => {
    const MF = { fixed: {}, acc: { a: { n: 'Eins' }, b: { n: 'Zwei' }, c: { n: 'Drei' } }, bal: {}, balT: {},
      goals: { g1: { n: 'A', amount: 1000000, acc: 'a' }, g2: { n: 'B', amount: 100000, acc: 'b' }, g3: { n: 'C', amount: 100000, acc: 'c' }, g4: { n: 'D', amount: 1000000, acc: null } } };
    MF.bal[m] = { a: 290000, b: 57000, c: 58000 };
    localStorage.setItem('takt.v1', JSON.stringify({ S: { routines: [] }, LY: {}, MF, MY: {} }));
  }, M);
  await page.reload(); await page.waitForTimeout(300); await bereich(page, 'haushalt'); await sub('verm');
  const prozent = await page.$$eval('#v-haushalt .row.goal .streak b', l => l.map(b => b.textContent).join());
  P.ok('Sparziele: 29 %, 57 %, 58 % und abgerundet 40 %', prozent === '29,57,58,40', prozent);

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
  P.ok('nur Budget-Daten: startet im Bereich Budget', (await text(page, '#v-haushalt .subtabs [aria-pressed="true"]')) === 'Budget');
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

  // --- Teil 6: Fall des Nutzers. Stand aus v38 (ohne Zeitpunkt) im laufenden Monat, ein Konto, dazu ohne Konto: eine Ausgabe von 12 nach dem Stand, eine von 5 am Tag davor, Miete als fester Posten ---
  await daten6(page, { ym: M, tag: heute, vor: gestern });
  await page.reload(); await page.waitForTimeout(300); await bereich(page, 'haushalt');
  P.ok('Stand ohne Zeitpunkt bekommt beim Laden einen', (((await gespeichert(page)).MF.balT || {})[M] || {}).g > 0);
  await sub('budget'); await page.click('#v-haushalt [data-m="add"]');
  P.ok('einziges Konto ist vorbelegt', (await text(page, '#m-acc [aria-pressed="true"]')) === 'Girokonto');
  await page.fill('#m-amt', '30'); await speichern('#m-save');
  // 1.000 − 30 = 970; die Ausgabe ohne Konto zählt nicht
  P.enthaelt('Ausgabe 30 verändert das Vermögen: 970', await konten(), ['970 €', 'gerechnet seit']);
  // Zeile „Ohne Konto“: die Ausgabe nach dem Stand und die Miete = 2; die Ausgabe vom Vortag steckt schon im Stand und fehlt
  P.enthaelt('Vermögen nennt, was ohne Konto gebucht ist', await text(page, '#v-haushalt [data-fold="ohneKonto"]'), ['Ohne Konto', '2']);
  P.ok('Zeile ist eingeklappt', !(await text(page, '#v-haushalt')).includes('Alt'));
  await page.click('#v-haushalt [data-fold="ohneKonto"]');
  const offen = await text(page, '#v-haushalt .entries:has([data-fold="ohneKonto"])');
  P.ok('aufgeklappt: Ausgabe und Miete, nicht die vom Vortag', offen.includes('Alt') && offen.includes('Miete') && !offen.includes('Davor'), offen);
  await page.click('#v-haushalt [data-m="tx"]:has-text("Alt")'); await chip('#m-acc', 'Girokonto'); await speichern('#m-save');
  // 970 − 12 = 958
  P.enthaelt('Konto bei der alten Ausgabe nachgetragen: 958', await konten(), ['958 €']);
  P.enthaelt('danach steht nur noch die Miete ohne Konto', await text(page, '#v-haushalt .entries:has([data-fold="ohneKonto"])'), ['1', 'Miete']);
  await page.click('#v-haushalt [data-m="fixed"]:has-text("Miete")'); await chip('#m-acc', 'Girokonto'); await page.fill('#m-day', '1'); await speichern('#m-save');
  P.ok('alles hat ein Konto: Zeile ist weg', !(await page.$('#v-haushalt [data-fold="ohneKonto"]')));
  await sub('budget'); await neuFix();
  P.ok('Konto ist auch bei neuen Fixkosten vorbelegt', (await text(page, '#m-acc [aria-pressed="true"]')) === 'Girokonto');
  await page.click('#ms-close');

  // --- Schnell-Knopf „Ausgabe“ auf Heute bucht auf heute, auch wenn in den Finanzen gerade ein anderer Monat gewählt ist ---
  // Im Bereich selbst bleibt es dabei: Wer dort im Vormonat steht und „Ausgabe“ tippt, bekommt dessen letzten Tag vorgeschlagen.
  const vm = monat(1), vmEnde = vm + '-' + new Date(+vm.slice(0, 4), +vm.slice(5), 0).getDate();
  await sub('budget'); await nachOben(page); await page.click('#v-haushalt .mnav button:first-child');
  await page.click('#v-haushalt [data-m="add"]');
  P.ok('im Vormonat: Datum ist dessen letzter Tag (' + vmEnde + ')', (await page.inputValue('#m-date')) === vmEnde, await page.inputValue('#m-date'));
  await page.click('#ms-close');
  await bereich(page, 'heute'); await page.click('#v-heute [data-h="q"][data-v="ausgabe"]');
  P.ok('Schnell-Knopf auf Heute: Datum ist heute', (await page.inputValue('#m-date')) === heute, await page.inputValue('#m-date'));
  await page.click('#ms-close');
  await bereich(page, 'haushalt'); await page.click('#v-haushalt .mnav button:last-child');

  // --- Ein Knopf für Ausgabe und Einnahme (v56): Das Blatt öffnet als Ausgabe, oben schaltet man auf Einnahme um ---
  const txAlle = async () => Object.values((await gespeichert(page)).MY).flatMap(y => Object.values(y.tx)).filter(Boolean);
  await bereich(page, 'heute'); await page.click('#v-heute [data-h="q"][data-v="ausgabe"]');
  P.ok('Blatt öffnet als Ausgabe, mit Kategorie', (await text(page, '#ms-title')) === 'Ausgabe eintragen' && await page.isVisible('#m-cat-fld') && (await page.getAttribute('#m-kind [data-k="out"]', 'aria-pressed')) === 'true');
  await page.click('#m-kind [data-k="in"]');
  P.ok('umgeschaltet auf Einnahme: Titel wechselt, keine Kategorie', (await text(page, '#ms-title')) === 'Einnahme eintragen' && !(await page.isVisible('#m-cat-fld')) && (await page.getAttribute('#m-kind [data-k="in"]', 'aria-pressed')) === 'true');
  await page.fill('#m-amt', '77,70'); await chip('#m-acc', 'Kein Konto'); await speichern('#m-save');
  P.ok('als Einnahme von 77,70 € gespeichert', (await txAlle()).some(t => t.a === 7770 && t.k === 'in'), JSON.stringify((await txAlle()).filter(t => t.a === 7770)));
  await page.click('#v-heute [data-h="q"][data-v="ausgabe"]'); await page.click('#m-kind [data-k="in"]'); await page.click('#m-kind [data-k="out"]'); await page.fill('#m-amt', '8,80'); await chip('#m-acc', 'Kein Konto'); await speichern('#m-save');
  P.ok('hin und zurück geschaltet: Ausgabe von 8,80 € mit Kategorie', (await txAlle()).some(t => t.a === 880 && t.k === 'out' && t.c === 'essen'));
  await bereich(page, 'haushalt'); await sub('budget'); await neuFix();
  P.ok('feste Posten: kein Umschalter', !(await page.isVisible('#m-kind')));
  await page.click('#ms-close');

  P.ok('gespeicherte Daten sind lesbar', !!(await gespeichert(page)).MF);

  // --- Monatswechsel, während die App offen ist (die iPhone-App bleibt tagelang im Speicher): Der gewählte Monat geht mit ---
  // Uhr auf den 1. des nächsten Monats; die App zeichnet neu, wenn sie wieder nach vorn kommt (visibilitychange).
  const M1 = monat(-1), M2 = monat(-2), wach = () => page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  const titel = () => text(page, '#v-haushalt .mnav b');
  await sub('verm');
  P.ok('vor dem Wechsel: ' + name(M), (await titel()) === name(M), await titel());
  await page.clock.setFixedTime(um12(M1, 1)); await wach(); await page.waitForTimeout(150);
  P.ok('am 1. zeigt der Bereich den neuen Monat: ' + name(M1), (await titel()) === name(M1), await titel());
  await page.click('#add');
  P.ok('„Stand eintragen“ gilt für den neuen Monat', (await page.inputValue('#v-month')) === M1, await page.inputValue('#v-month'));
  await page.click('#vs-close');
  await sub('budget'); await page.click('#v-haushalt [data-m="add"]');
  P.ok('neue Ausgabe: Datum ist der 1. des neuen Monats', (await page.inputValue('#m-date')) === M1 + '-01', await page.inputValue('#m-date'));
  await page.click('#ms-close');
  // Wer bewusst einen früheren Monat gewählt hat, bleibt dort
  await sub('verm'); await page.click('#v-haushalt .mnav button:first-child');
  await page.clock.setFixedTime(um12(M2, 1)); await wach(); await page.waitForTimeout(150);
  P.ok('ein gewählter früherer Monat bleibt beim nächsten Wechsel stehen: ' + name(M), (await titel()) === name(M), await titel());
  await browser.close();

  // --- Teil 7: der 28. Feste Posten zählen ab ihrem Tag im Monat; ohne Konto haben sie keinen Tag und gelten als am 28. fällig ---
  const b = await oeffnen({ uhr: um12(M, 28) }), q = b.page;
  await daten3(q); await q.reload(); await q.waitForTimeout(300); await bereich(q, 'haushalt');
  // wie Teil 3, aber am 28. ist auch das Gehalt da: 1.075 − 400 + 1.000 = 1.675
  P.enthaelt('am 28.: Miete und Gehalt zählen (1.675)', await text(q, '#v-haushalt .hero h1'), [zahl(vormonat - 400 + 1000)]);
  await daten6(q, { ym: M, tag: M + '-28', vor: M + '-27' }); await q.reload(); await q.waitForTimeout(300); await bereich(q, 'haushalt');
  // wie Teil 6, aber der Stand trägt jetzt das Datum des 28.: Die Miete ohne Konto gilt als schon enthalten, in der Zeile steht nur die Ausgabe von heute
  P.enthaelt('am 28.: „Ohne Konto“ nennt nur die Ausgabe nach dem Stand', await text(q, '#v-haushalt [data-fold="ohneKonto"]'), ['Ohne Konto', '1']);
  await q.click('#v-haushalt [data-fold="ohneKonto"]');
  const am28 = await text(q, '#v-haushalt .entries:has([data-fold="ohneKonto"])');
  P.ok('am 28. aufgeklappt: die Ausgabe, nicht die Miete, nicht die vom Vortag', am28.includes('Alt') && !am28.includes('Miete') && !am28.includes('Davor'), am28);
  await b.browser.close();
  await P.ende(null, fehler.concat(b.fehler));
});
