// Monatsabschluss (v59): Ansicht „Monat“ auf Heute mit Vergleich zum Vormonat, Hinweis in den ersten sieben Tagen des Monats.
// Dazu der Kurzbefehl: Die Adresse mit ?neu=ausgabe öffnet die App gleich mit dem Blatt.
// Die Uhr der App wird für den Test gestellt: „heute“ ist der 3. des nächsten Monats (C). B = der Monat davor, A = der davor.
const { APP, oeffnen, text, gespeichert, pruefer, lauf, monat, pad } = require('./lib');

const A = monat(1), B = monat(0), C = monat(-1), NAMEN = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const name = ym => NAMEN[+ym.slice(5) - 1], letzter = ym => new Date(+ym.slice(0, 4), +ym.slice(5), 0).getDate(), am = (ym, t) => ym + '-' + pad(t);
const uhr = (ym, t) => new Date(+ym.slice(0, 4), +ym.slice(5) - 1, t, 12);

function daten() {
  const d = { S: { routines: [{ id: 'r1', name: 'Lesen', minutes: 30, days: Array(7).fill(true), created: am(A, 1) }], running: null }, LY: {},
    W: { goal: 75, goalFrom: 82, entries: {} }, MY: {}, T: { runs: {} }, K: { ex: { e1: { n: 'Bankdrücken' } }, log: {} }, N: { folders: {}, tasks: {}, notes: {} },
    MF: { fixed: { f1: { name: 'Gehalt', amount: 200000, kind: 'in', every: 1, from: A, to: null }, f2: { name: 'Miete', amount: 80000, kind: 'fix', every: 1, from: A, to: null } },
      acc: { giro: { n: 'Girokonto' } }, bal: {}, balT: {} } };
  const erledigt = (ym, t) => { const k = am(ym, t), y = k.slice(0, 4); d.LY[y] = d.LY[y] || {}; d.LY[y][k] = { r1: { s: 1800, d: 1 } }; };
  for (let t = 1; t <= 14; t++) erledigt(A, t);          // A: 14 Tage erledigt
  for (let t = 1; t <= 21; t++) erledigt(B, t);          // B: 21 Tage erledigt
  erledigt(C, 1);                                         // C: 1 von 3 Tagen
  for (let t = 20; t <= 26; t++) { d.W.entries[am(A, t)] = 80; d.W.entries[am(B, t)] = 79; }   // 7-Tage-Schnitt am Monatsende: 80,0 und 79,0
  d.MF.bal[A] = { giro: 100000 }; d.MF.bal[B] = { giro: 150000 };                              // Vermögen 1.000 € → 1.500 €
  let n = 0; const tx = (ym, t, a) => { const k = am(ym, t), y = k.slice(0, 4); d.MY[y] = d.MY[y] || { tx: {} }; d.MY[y].tx['t' + (n++)] = { d: k, a, k: 'out', c: 'essen', n: '' }; };
  tx(A, 5, 50000); tx(B, 2, 10000); tx(B, 15, 20000); tx(C, 1, 4000);                          // flexibel: A 500 €, B 300 € (bis zum 3.: 100 €), C 40 €
  const run = (id, ym, t, m) => { d.T.runs[id] = { d: am(ym, t), m, s: 1800, hr: null, k: 'out' }; };
  run('a', A, 10, 10000); run('b1', B, 2, 5000); run('b2', B, 20, 7500); run('c', C, 1, 6000);   // km: A 10 · B 12,5 (bis zum 3.: 5) · C 6
  [[A, 4], [A, 11], [A, 18], [B, 3], [B, 8], [B, 15], [B, 22]].forEach(x => { d.K.log[am(x[0], x[1])] = { e1: [[60, 8]] }; });   // Gym: A 3, B 4 (bis zum 3.: 1), C 0
  const ms = (ym, t) => uhr(ym, t).getTime();
  d.N.tasks = { x1: { t: 'Eins', f: '', d: null, done: ms(B, 10), c: ms(A, 1), n: '' }, x2: { t: 'Zwei', f: '', d: null, done: ms(B, 11), c: ms(A, 1), n: '' },
    x3: { t: 'Drei', f: '', d: null, done: ms(B, 12), c: ms(A, 1), n: '' }, x4: { t: 'Vier', f: '', d: null, done: ms(A, 9), c: ms(A, 1), n: '' } };   // erledigt: B 3, A 1
  return d;
}

lauf(async () => {
  const P = pruefer('Monat und Kurzbefehl');
  const { browser, page, fehler } = await oeffnen({ daten: daten() });
  const stelle = async (ym, t) => { await page.clock.setFixedTime(uhr(ym, t)); await page.reload(); await page.waitForTimeout(300); };
  const kurz = () => page.waitForTimeout(150), zeilen = () => text(page, '#v-heute .kv'), seite = () => text(page, '#v-heute');
  const merker = () => page.evaluate(() => localStorage.getItem('takt.recap'));
  await stelle(C, 3);

  // --- Hinweis am Monatsanfang ---
  P.ok('am 3. steht auf Heute: „' + name(B) + ' ist abgeschlossen“', (await text(page, '#v-heute [data-h="recap"]')) === name(B) + ' ist abgeschlossen Rückblick', await text(page, '#v-heute .remind'));
  await page.click('#v-heute [data-h="recap"]'); await kurz();
  P.ok('Tipp öffnet die Ansicht „Monat“ mit ' + name(B), (await page.getAttribute('#v-heute [data-h="mode"][data-v="month"]', 'aria-pressed')) === 'true' && (await text(page, '#v-heute .mnav b')) === name(B) + ' ' + B.slice(0, 4) && (await merker()) === B);
  P.enthaelt('abgeschlossener Monat: Vergleich mit dem ganzen Vormonat', await seite(), ['Vergleich mit ' + name(A)]);
  P.ok('kein „bis zum“ beim abgeschlossenen Monat', !(await seite()).includes('bis zum'));

  // --- Zahlen des abgeschlossenen Monats B, verglichen mit A ---
  let z = await zeilen();
  // Routinen gibt es seit v75 nicht mehr: Auch mit einer Routine und ihrem Protokoll im Speicher (21 Tage in B, 14 in A) steht keine Zeile da
  P.ok('keine Zeile „Routinen“, obwohl welche gespeichert sind', !z.includes('Routinen'), z);
  // Aufgaben gibt es seit v74 nicht mehr: Auch mit erledigten Aufgaben im Speicher (3 in diesem Monat, 1 im Vormonat) steht keine Zeile da
  P.ok('keine Zeile „Aufgaben“, obwohl welche gespeichert sind', !z.includes('Aufgaben'), z);
  // Gewicht: Schnitt am Monatsende 79,0 kg, im Vormonat 80,0 → −1,0 kg; Ziel 75, also in die richtige Richtung (grün)
  P.ok('Gewicht: 79,0 kg, −1,0 kg', z.includes('Gewicht 79,0kg im Schnitt −1,0 kg'), z);
  P.ok('Gewicht Richtung Ziel ist grün', await page.evaluate(() => [...document.querySelectorAll('#v-heute .kv')].find(k => k.textContent.startsWith('Gewicht')).querySelector('.delta').classList.contains('up')));
  // Vermögen ist seit v156 ausgebaut: Die gespeicherten Stände (1.000 € → 1.500 €) stehen nicht mehr im Monat
  P.ok('keine Zeile „Vermögen“ (seit v156 ausgebaut)', !z.includes('Vermögen'), z);
  // Sparquote: (2000 − 800 − 300) / 2000 = 45 %, Vormonat (2000 − 800 − 500) / 2000 = 35 % → +10 Prozentpunkte
  P.ok('Sparquote: 45 %, +10 Prozentpunkte', z.includes('Sparquote 45 % +10 Prozentpunkte'), z);
  // Flexible Ausgaben: 100 + 200 = 300 €, Vormonat 500 € → 200 € weniger
  P.ok('Flexible Ausgaben: 300 €, 200 € weniger', z.includes('Flexible Ausgaben 300€ 200 € weniger'), z);
  // Laufen: 5 + 7,5 = 12,5 km in 2 Läufen, Vormonat 10 km → +2,5 km
  P.ok('Laufen: 12,5 km, +2,5 km', z.includes('Laufen 12,5km · 2 Läufe +2,5 km'), z);
  // Gym: 4 Einheiten, Vormonat 3 → +1
  P.ok('Gym: 4 Einheiten, +1', z.includes('Gym 4Einheiten +1'), z);

  // --- Laufender Monat C am 3.: verglichen wird mit B bis zum 3. ---
  await page.click('#v-heute .mnav [data-m="next"]'); await kurz();
  z = await zeilen();
  P.enthaelt('laufender Monat: Vergleich bis zum selben Tag', await seite(), [name(C) + ' ' + C.slice(0, 4), 'Vergleich mit ' + name(B) + ' bis zum 3.']);
  P.ok('laufender Monat: keine Zeile „Routinen“', !z.includes('Routinen'), z);
  // Flexible Ausgaben: 40 €, in B bis zum 3. 100 € → 60 € weniger. Laufen: 6 km, in B bis zum 3. 5 km → +1,0 km. Gym: 0, in B bis zum 3. eine → −1
  P.ok('Flexible Ausgaben: 40 €, 60 € weniger', z.includes('Flexible Ausgaben 40€ 60 € weniger'), z);
  P.ok('Laufen: 6,0 km, +1,0 km', z.includes('Laufen 6,0km · 1 Lauf +1,0 km'), z);
  P.ok('Gym: 0 Einheiten, −1', z.includes('Gym 0Einheiten −1'), z);
  P.ok('laufender Monat: keine Sparquote, keine Aufgaben-Zeile', !z.includes('Sparquote') && !z.includes('Aufgaben'), z);
  P.ok('im laufenden Monat geht es nicht weiter nach vorn', await page.evaluate(() => { const b = document.querySelector('#v-heute .mnav [data-m="next"]'); return b.disabled || b.hidden || getComputedStyle(b).visibility === 'hidden'; }));

  // --- Der Hinweis verschwindet nach dem Ansehen, kommt nur in den ersten sieben Tagen ---
  await page.click('#v-heute [data-h="mode"][data-v="day"]'); await kurz();
  P.ok('nach dem Ansehen ist der Hinweis weg', !(await page.$('#v-heute [data-h="recap"]')));
  await page.evaluate(() => localStorage.removeItem('takt.recap')); await stelle(C, 7);
  P.ok('am 7. steht der Hinweis noch da', !!(await page.$('#v-heute [data-h="recap"]')));
  await stelle(C, 8);
  P.ok('am 8. nicht mehr', !(await page.$('#v-heute [data-h="recap"]')));
  P.ok('die Daten sind unverändert lesbar', Object.keys((await gespeichert(page)).T.runs).length === 4);
  await browser.close();

  // --- Leere App, 320 px ---
  const leer = await oeffnen({ breite: 320 });
  P.ok('leere App: kein Hinweis', !(await leer.page.$('#v-heute [data-h="recap"]')));
  await leer.page.click('#v-heute [data-h="mode"][data-v="month"]'); await leer.page.waitForTimeout(150);
  P.ok('leere App: „Monat“ ohne Einträge, drei Umschalter, nichts ragt hinaus', (await text(leer.page, '#v-heute')).includes('Für diesen Monat gibt es noch keine Einträge.') && (await text(leer.page, '#v-heute .seg2 button')) === 'Heute | Woche | Monat' && await leer.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await leer.browser.close();

  // --- Kurzbefehl: Zusatz in der Adresse öffnet das Blatt und verschwindet danach aus der Adresse ---
  for (const [zusatz, blatt, titel] of [['ausgabe', '#msheet', 'Ausgabe eintragen'], ['notiz', '#nsheet', null], ['gewicht', '#wsheet', null], ['quatsch', null, null]]) {
    const k = await oeffnen({ url: APP + '?neu=' + zusatz });
    const offen = await k.page.evaluate(() => [...document.querySelectorAll('dialog[open]')].map(d => '#' + d.id).join()), rest = await k.page.evaluate(() => location.search);
    P.ok('?neu=' + zusatz + ': ' + (blatt ? 'Blatt ' + blatt + ' offen' : 'kein Blatt, App startet normal'), offen === (blatt || '') && rest === '' && (!titel || (await text(k.page, '#ms-title')) === titel), offen + ' / ' + rest);
    await k.browser.close(); fehler.push(...k.fehler);
  }
  fehler.push(...leer.fehler);
  await P.ende(null, fehler);
});
