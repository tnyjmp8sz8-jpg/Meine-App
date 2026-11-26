// Termine aus dem Kalender des iPhones (v130, iPhone-App ab 1.3): Heute, Wochenleiste, Übersicht, Blatt „Termin“ mit dem Satz-Leser, Speichern, Ändern, Löschen, Einstellungen.
// Die iPhone-App wird nachgestellt (window.webkit.messageHandlers.track sammelt, was die App schickt; TrackHuelle.info und .termine liefern, was der Kalender meldet).
// Die Uhr steht auf Donnerstag, 26.11.2026, 10:00: So hängt nichts vom Tag ab, an dem die Reihe läuft.
const { oeffnen, text, pruefer, lauf, gespeichert } = require('./lib');

const huelle = () => { window.__post = []; window.webkit = { messageHandlers: { track: { postMessage: o => window.__post.push(JSON.parse(JSON.stringify(o))) } } }; };
const JETZT = new Date(2026, 10, 26, 10, 0);
/* Zeitpunkt n Tage nach dem 26.11.2026 um h:m */
const um = (n, h, m = 0, s = 0) => new Date(2026, 10, 26 + n, h, m, s).getTime();
const ruf = (page, name, arg) => page.evaluate(([n, a]) => window.TrackHuelle[n](a), [name, arg]);
const post = (page, art) => page.evaluate(a => window.__post.filter(m => m.art === a), art);
const leeren = page => page.evaluate(() => { window.__post.length = 0; });
/* Heute 14:00–15:30 Zahnarzt (mit Ort, Erinnerung 1 Std), heute ganztägig ein Geburtstag aus einem Kalender ohne Schreibrecht, heute 8–9 Uhr (um 10 schon vorbei),
   morgen 9–11 ein Seminar, das sich wiederholt, 3. bis 5.12. ganztägig ein Kurztrip, am 16.12. (in 20 Tagen) und am 12.3.2027 je ein Termin. */
const LISTE = [
  { id: 'c', s: um(0, 8), e: um(0, 9), t: 'Früh', w: 1, k: 'Privat', f: '#34C759' },
  { id: 'b', s: um(0, 0), e: um(0, 23, 59, 59), t: 'Geburtstag Mama', g: 1, k: 'Geburtstage', f: '#8E8E93' },
  { id: 'a', s: um(0, 14), e: um(0, 15, 30), t: 'Zahnarzt', o: 'Praxis Mitte', w: 1, er: 60, k: 'Privat', f: '#FF3B30' },
  { id: 'd', s: um(1, 9), e: um(1, 11), t: 'Seminar', w: 1, r: 1, k: 'Uni', f: '#0A84FF' },
  { id: 'f', s: um(7, 0), e: um(9, 23, 59, 59), t: 'Kurztrip', g: 1, w: 1, k: 'Privat', f: '#FF3B30' },
  { id: 'g', s: um(20, 12), e: um(20, 13), t: 'Weit weg', w: 1, k: 'Privat', f: '#FF3B30' },
  { id: 'h', s: new Date(2027, 2, 12, 10).getTime(), e: new Date(2027, 2, 12, 11).getTime(), t: 'Abgabe', w: 1, k: 'Uni', f: '#0A84FF' }
];
const an = (page, liste) => ruf(page, 'termine', { recht: 'an', von: um(-365, 0), bis: um(395, 0), liste: liste || LISTE });
const heute = page => page.evaluate(() => [...document.querySelectorAll('#v-heute [data-h="termin"]')].map(b => b.innerText.replace(/\s+/g, ' ').trim()));
const blatt = page => page.evaluate(() => { const v = q => document.querySelector(q); return { offen: v('#tesheet').open, titel: v('#te-title').textContent, text: v('#te-text').value, tag: v('#te-tag').value, bisTag: v('#te-bis-tag').value,
  von: v('#te-von').value, bis: v('#te-bis').value, ganz: v('#te-ganz').getAttribute('aria-checked') === 'true', les: v('#te-les').hidden ? '' : v('#te-les').textContent, err: v('#te-err').hidden ? '' : v('#te-err').textContent,
  info: v('#te-info').hidden ? '' : v('#te-info').textContent, er: [...document.querySelectorAll('#te-er [aria-pressed="true"]')].map(c => c.textContent).join(), chips: [...document.querySelectorAll('#te-er .chip')].map(c => c.textContent).join(),
  zeitZu: v('#te-zeit').hidden, bisZu: v('#te-bisf').hidden, nein: !v('#te-nein').hidden, save: !v('#te-save').hidden, weg: !v('#te-weg').hidden, fest: v('#te-text').disabled }; });
const zu = page => page.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));

lauf(async () => {
  const p = pruefer('Termine');

  /* 1. Im Browser (ohne iPhone-App) gibt es von alledem nichts */
  {
    const { browser, page, fehler } = await oeffnen({ uhr: JETZT });
    p.ok('Browser: kein Plus für Termine', !(await page.$('#v-heute [data-v="termin"]')));
    p.ok('Browser: keine Liste „Termine“', (await heute(page)).length === 0);
    p.ok('Browser: keine Fehler', !fehler.length, fehler.join());
    await browser.close();
  }

  const { browser, page, fehler } = await oeffnen({ uhr: JETZT, skript: huelle });
  /* 2. iPhone-App vor 1.3 (kein „kalender“ in der Auskunft): nichts */
  await ruf(page, 'info', { app: '1.2' });
  p.ok('iPhone-App 1.2: kein Plus für Termine', !(await page.$('#v-heute [data-v="termin"]')));

  /* 3. iPhone-App 1.3, iOS noch nicht gefragt: Knopf da, der Tipp bittet die iPhone-App zu fragen; mit der Erlaubnis öffnet sich das Blatt */
  await ruf(page, 'info', { app: '1.3', kalender: 'fehlt' });
  p.ok('1.3: Plus für Termine steht da', !!(await page.$('#v-heute [data-v="termin"]')));
  p.ok('1.3: keine Schnell-Knöpfe, „Termine“ als Zeile mit Plus (iOS noch nicht gefragt)', !(await page.$('#v-heute .quick')) && (await text(page, '#v-heute .fo[data-v="termin"]')) === 'Termine', await text(page, '#v-heute .fo[data-v="termin"]'));
  await page.click('#v-heute [data-v="termin"]');
  p.ok('Ohne Erlaubnis: Bitte an die iPhone-App, kein Blatt', (await post(page, 'terminAn')).length === 1 && !(await blatt(page)).offen);
  await an(page, []);
  let b = await blatt(page);
  p.ok('Mit der Erlaubnis öffnet sich „Termin eintragen“', b.offen && b.titel === 'Termin eintragen' && !b.nein, JSON.stringify(b));
  p.ok('Neu: heute, ganztägig, Zeitfelder verborgen, Erinnerung „Keine“ (ganztägig)', b.tag === '2026-11-26' && b.ganz && b.zeitZu && !b.bisZu && b.er === 'Keine' && b.chips === 'Keine,Am Tag,Am Vortag', JSON.stringify(b));
  p.ok('Neu: Fokus im Feld', await page.evaluate(() => document.activeElement.id === 'te-text'));

  /* 4. Der Satz-Leser. Heute ist Donnerstag, 26.11.2026. Je Satz: Tag, Von, Bis (leer = ganztägig), Titel (leer = nichts erkannt, die Zeile darunter fehlt). */
  const saetze = [
    ['Zahnarzt morgen 15 Uhr', '2026-11-27', '15:00', '16:00', 'Zahnarzt'],            // morgen = 27.11.; ohne Ende eine Stunde
    ['Lernen Mo 9-11 Uhr', '2026-11-30', '09:00', '11:00', 'Lernen'],                   // der nächste Montag ist der 30.11.
    ['Abgabe 12.3.', '2027-03-12', '', '', 'Abgabe'],                                   // der 12.3.2026 ist vorbei, also 2027; ohne Uhrzeit ganztägig
    ['Kino Freitag 20:15', '2026-11-27', '20:15', '21:15', 'Kino'],
    ['Essen am 3. Dezember um 19', '2026-12-03', '19:00', '20:00', 'Essen'],
    ['Party Sa 22-2 Uhr', '2026-11-28', '22:00', '02:00', 'Party'],                     // Ende am Tag darauf
    ['Meeting 14:00–15:30', '2026-11-26', '14:00', '15:30', 'Meeting'],
    ['Donnerstag Vorlesung', '2026-12-03', '', '', 'Vorlesung'],                        // heute ist Donnerstag: gemeint ist der nächste
    ['übermorgen Sport um 7.30 Uhr', '2026-11-28', '07:30', '08:30', 'Sport'],
    ['Urlaub 24.12.2026', '2026-12-24', '', '', 'Urlaub'],
    ['Training heute 18 Uhr', '2026-11-26', '18:00', '19:00', 'Training'],
    ['am 1. Zahnreinigung', '2026-12-01', '', '', 'Zahnreinigung'],                     // der 1. dieses Monats ist vorbei: Dezember
    ['Spätschicht von 22 bis 6', '2026-11-26', '22:00', '06:00', 'Spätschicht'],
    ['Mittag 12.30 Uhr', '2026-11-26', '12:30', '13:30', 'Mittag'],
    ['Prüfung 5 jan 2027 9:30-11', '2027-01-05', '09:30', '11:00', 'Prüfung'],
    ['2 Pizzen bestellen', '2026-11-26', '', '', ''],                                   // eine nackte Zahl ist keine Uhrzeit
    ['Guten Morgen Yoga', '2026-11-26', '', '', ''],                                    // „guten Morgen“ ist kein Tag
    ['Fr. Müller anrufen', '2026-11-26', '', '', ''],                                   // „Fr.“ mit Punkt ist kein Freitag
    ['Termin 31.2.', '2026-11-26', '', '', ''],                                         // den 31.2. gibt es nicht
    ['Preis 12.3 Euro', '2026-11-26', '', '', ''],
    ['So viel Arbeit', '2026-11-26', '', '', ''],                                       // „So“ ohne „am“ ist kein Sonntag
    ['Lesen 2h', '2026-11-26', '', '', '']
  ];
  for (const s of saetze) {
    await page.fill('#te-text', s[0]);
    b = await blatt(page);
    const soll = s[4] ? 'Wird eingetragen als „' + s[4] + '“' : '';
    p.ok('Satz „' + s[0] + '“', b.tag === s[1] && b.ganz === !s[2] && (!s[2] || (b.von === s[2] && b.bis === s[3])) && b.les === soll, JSON.stringify({ tag: b.tag, von: b.von, bis: b.bis, ganz: b.ganz, les: b.les }));
  }
  /* Nur Tag und Zeit, kein Titel: Speichern meldet es */
  await page.fill('#te-text', 'morgen 15 Uhr'); await page.click('#te-save');
  b = await blatt(page);
  p.ok('Ohne Titel bleibt das Blatt offen und fragt', b.offen && b.err === 'Wie heißt der Termin?' && !(await post(page, 'termin')).length, JSON.stringify(b));
  /* Von Hand gestellt gewinnt: Der Tag bleibt, auch wenn der Satz danach einen anderen nennt; das Ende wandert mit dem Beginn (Dauer 1 Std bleibt) */
  await page.fill('#te-text', 'Zahnarzt morgen 15 Uhr');
  await page.fill('#te-tag', '2026-12-10'); await page.fill('#te-von', '16:30');
  await page.fill('#te-text', 'Zahnarzt übermorgen 15 Uhr');
  b = await blatt(page);
  p.ok('Von Hand gestellt: Tag und Zeit bleiben, Ende wandert mit', b.tag === '2026-12-10' && b.von === '16:30' && b.bis === '17:30' && b.er === '1 Std' && b.chips === 'Keine,15 min,1 Std,1 Tag' && !b.err, JSON.stringify(b));
  await zu(page);

  /* 5. Speichern eines neuen Termins: Auftrag an die iPhone-App, der Termin steht sofort auf Heute */
  await an(page);
  await page.click('#v-heute [data-v="termin"]');
  await page.fill('#te-text', 'Friseur morgen 15 Uhr');
  await leeren(page);
  await page.keyboard.press('Enter'); await page.waitForTimeout(80);
  let m = await post(page, 'termin');
  /* morgen 15:00 bis 16:00, mit Uhrzeit, Erinnerung 60 Minuten vorher (Vorgabe) */
  p.ok('Neu: Auftrag stimmt', m.length === 1 && JSON.stringify(m[0]) === JSON.stringify({ art: 'termin', t: 'Friseur', s: um(1, 15), e: um(1, 16), g: 0, er: 60 }), JSON.stringify(m));
  p.ok('Neu: Blatt ist zu', !(await blatt(page)).offen);
  let h = await heute(page);
  /* Heute um 10:00: Geburtstag (ganztägig), Zahnarzt 14:00, morgen Seminar 9:00, morgen Friseur 15:00; „Früh“ ist vorbei, der Kurztrip (3.12.) wäre die fünfte Zeile */
  p.ok('Heute: vier Zeilen in der richtigen Folge, der neue Termin schon dabei', JSON.stringify(h) === JSON.stringify(['Geburtstag Mama Heute · ganztägig', 'Zahnarzt Heute · Praxis Mitte 14:00', 'Seminar Morgen 09:00', 'Friseur Morgen 15:00']), JSON.stringify(h));
  p.ok('Heute: „Alle 5“ in der Überschrift (mit dem neuen fünf in 14 Tagen)', (await text(page, '#v-heute [data-h="kal"]')) === 'Alle 5', await text(page, '#v-heute [data-h="kal"]'));
  p.ok('Der neue Termin ist noch nicht antippbar (Kennung kommt vom Kalender)', await page.evaluate(() => [...document.querySelectorAll('#v-heute [data-h="termin"]')].filter(b => b.disabled).length === 1));
  /* Die iPhone-App meldet den Kalender neu (jetzt ohne den Friseur): Die Liste gilt */
  await an(page);
  h = await heute(page);
  p.ok('Heute: Liste aus dem Kalender, vier Zeilen, „Kalender“ in der Überschrift', h.length === 4 && h[3] === 'Kurztrip Do, 3.12. · ganztägig' && (await text(page, '#v-heute [data-h="kal"]')) === 'Kalender', JSON.stringify(h));
  p.ok('Punkt in der Farbe des Kalenders', await page.evaluate(() => getComputedStyle(document.querySelector('#v-heute [data-h="termin"][data-id="a"] .kf')).backgroundColor === 'rgb(255, 59, 48)'));
  /* Gemerkt für den nächsten Start: nur was bis in 92 Tagen liegt (ohne den 12.3.2027) */
  const merk = await page.evaluate(() => JSON.parse(localStorage.getItem('takt.termine')));
  p.ok('Gemerkt: Zustand und sechs Termine', merk.recht === 'an' && merk.liste.length === 6, JSON.stringify(merk).slice(0, 200));
  p.ok('Nichts davon in der Sicherung der App', !JSON.stringify(await gespeichert(page)).includes('Zahnarzt'));

  /* 6. Wochenleiste und Übersicht: Do 26. und Fr 27. tragen einen blauen Punkt, der Freitag (Zukunft) öffnet seinen eigenen Tag */
  const leiste = await page.evaluate(() => [...document.querySelectorAll('#v-heute .wk .wd')].map(w => w.dataset.d + ':' + [...w.querySelectorAll('u')].map(u => u.className).join('')));
  p.ok('Wochenleiste: Punkte am 26. und 27., kommende Tage mit eigenem Datum', JSON.stringify(leiste) === JSON.stringify(['2026-11-23:', '2026-11-24:', '2026-11-25:', '2026-11-26:t', '2026-11-27:t', '2026-11-28:', '2026-11-29:']), JSON.stringify(leiste));
  await page.click('#v-heute .wk .wd[data-d="2026-11-27"]'); await page.waitForTimeout(80);
  let tagT = await text(page, '#cs-day');
  p.enthaelt('Übersicht am Freitag: Seminar mit Zeit, „+ Termin“', tagT, ['Freitag, 27. November', 'Seminar', '09:00–11:00', '+ Termin']);
  const monate = await page.evaluate(() => [...document.querySelectorAll('#cs-body .cm')].map(c => c.dataset.ym + ' ' + c.querySelector('p').textContent));
  /* September 2026 bis November 2027 = 15 Monate. November: Früh, Geburtstag, Zahnarzt, Seminar = 4. Dezember: Kurztrip (zählt einmal), Weit weg = 2. März 2027: 1. */
  p.ok('Übersicht: 15 Monate bis November 2027', monate.length === 15 && monate[0].startsWith('2026-09') && monate[14].startsWith('2027-11'), monate.length + ' ' + monate[0] + ' … ' + monate[monate.length - 1]);
  p.ok('Übersicht: Termine je Monat gezählt', monate[2] === '2026-11 4 Termine' && monate[3] === '2026-12 2 Termine' && monate[6] === '2027-03 1 Termin' && monate[4] === '2027-01 Keine Einträge', JSON.stringify(monate.slice(2, 7)));
  const dez = await page.evaluate(() => ['2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05', '2026-12-06'].map(k => { const c = document.querySelector('.cd[data-d="' + k + '"]'); return (c.disabled ? 'zu' : 'auf') + c.querySelectorAll('u.t').length; }).join());
  p.ok('Übersicht: Kurztrip steht am 3., 4. und 5.12., kommende Tage sind antippbar', dez === 'auf0,auf1,auf1,auf1,auf0', dez);
  p.ok('Übersicht: Der gewählte Monat steht im Blick', await page.evaluate(() => { const b = document.querySelector('#cs-body'), m = b.querySelector('.cm[data-ym="2026-11"]'); const r = m.getBoundingClientRect(), q = b.getBoundingClientRect(); return r.top >= q.top - 2 && r.top < q.bottom; }));
  await page.click('.cd[data-d="2026-12-04"]'); await page.waitForTimeout(50);
  p.enthaelt('Übersicht am 4.12.: Kurztrip ganztägig', await text(page, '#cs-day'), ['Kurztrip', 'ganztägig']);
  /* „+ Termin“ in der Übersicht trägt für den gewählten Tag ein */
  await page.click('#cs-day [data-c="add"][data-v="termin"]'); await page.waitForTimeout(50);
  b = await blatt(page);
  p.ok('„+ Termin“ am 4.12.: Blatt mit diesem Tag', b.offen && b.tag === '2026-12-04' && b.bisTag === '2026-12-04', JSON.stringify(b));
  /* Ganztägig über mehrere Tage: Bis-Tag stellen; ganztägig aus: nächste volle Stunde (11:00) und eine Stunde */
  await page.fill('#te-text', 'Skifahren'); await page.fill('#te-bis-tag', '2026-12-06');
  await page.click('#te-er [data-er="-540"]');
  await leeren(page); await page.click('#te-save'); await page.waitForTimeout(80);
  m = await post(page, 'termin');
  /* 4.12. 0:00 bis 6.12. 23:59, ganztägig, „Am Tag“ = 9 Uhr am 4.12. = 540 Minuten nach dem Beginn = −540 */
  p.ok('Ganztägig über drei Tage: Auftrag stimmt', m.length === 1 && JSON.stringify(m[0]) === JSON.stringify({ art: 'termin', t: 'Skifahren', s: um(8, 0), e: um(10, 23, 59), g: 1, er: -540 }), JSON.stringify(m));
  p.ok('Die Wahl der Erinnerung ist gemerkt (ganztägig: Am Tag)', (await gespeichert(page)).E.erG === -540);
  await zu(page); await an(page);

  /* 7. Vorhandenen Termin ändern: Zahnarzt von 14:00 auf 15:00, das Ende wandert mit (15:30 → 16:30); die Erinnerung bleibt unberührt (kein „er“ im Auftrag) */
  await page.click('#v-heute [data-h="termin"][data-id="a"]'); await page.waitForTimeout(50);
  b = await blatt(page);
  p.ok('Ändern: Blatt zeigt den Termin', b.titel === 'Termin ändern' && b.text === 'Zahnarzt' && b.tag === '2026-11-26' && b.von === '14:00' && b.bis === '15:30' && !b.ganz && b.er === '1 Std' && b.info === 'Ort: Praxis Mitte' && b.save && b.weg, JSON.stringify(b));
  await page.fill('#te-text', 'Zahnarzt morgen 9 Uhr');   // beim Ändern liest niemand den Satz: Der Titel ist der Titel
  b = await blatt(page);
  p.ok('Ändern: Der Titel wird nicht gelesen', b.tag === '2026-11-26' && b.von === '14:00' && !b.les, JSON.stringify(b));
  await page.fill('#te-text', 'Zahnarzt'); await page.fill('#te-von', '15:00');
  await leeren(page); await page.click('#te-save'); await page.waitForTimeout(80);
  m = await post(page, 'termin');
  p.ok('Ändern: Auftrag mit Kennung und altem Beginn, ohne „er“', m.length === 1 && JSON.stringify(m[0]) === JSON.stringify({ art: 'termin', t: 'Zahnarzt', s: um(0, 15), e: um(0, 16, 30), g: 0, id: 'a', s0: um(0, 14) }), JSON.stringify(m));
  h = await heute(page);
  p.ok('Ändern: Heute zeigt sofort 15:00', h[1] === 'Zahnarzt Heute · Praxis Mitte 15:00', JSON.stringify(h));
  /* Erinnerung abwählen: „er“ geht als null mit */
  await an(page);
  await page.click('#v-heute [data-h="termin"][data-id="a"]'); await page.waitForTimeout(50);
  await page.click('#te-er [data-er="aus"]');
  await leeren(page); await page.click('#te-save'); await page.waitForTimeout(80);
  m = await post(page, 'termin');
  p.ok('Erinnerung „Keine“: er ist null', m.length === 1 && m[0].er === null && m[0].id === 'a', JSON.stringify(m));
  p.ok('Die Vorgabe für neue Termine ändert sich beim Ändern eines alten nicht', (await gespeichert(page)).E.erZ === undefined);
  await an(page);

  /* 8. Nur ansehen: Geburtstag aus einem Kalender ohne Schreibrecht. Wiederholung: Hinweis. */
  await page.click('#v-heute [data-h="termin"][data-id="b"]'); await page.waitForTimeout(50);
  b = await blatt(page);
  p.ok('Ohne Schreibrecht: nur ansehen', b.titel === 'Termin' && b.fest && !b.save && !b.weg && b.info.includes('„Geburtstage“') && b.ganz && b.bisTag === '2026-11-26', JSON.stringify(b));
  await zu(page);
  await page.click('#v-heute [data-h="termin"][data-id="d"]'); await page.waitForTimeout(50);
  b = await blatt(page);
  p.ok('Wiederholt sich: Hinweis, Erinnerung „Keine“', b.info.includes('Wiederholt sich') && b.er === 'Keine' && b.save, JSON.stringify(b));
  await zu(page);

  /* 9. Löschen mit „Rückgängig“: erst nach 7 Sekunden geht der Auftrag an den Kalender */
  await page.click('#v-heute [data-h="termin"][data-id="a"]'); await page.waitForTimeout(50);
  await leeren(page); await page.click('#te-weg'); await page.waitForTimeout(80);
  h = await heute(page);
  p.ok('Löschen: Termin ist weg, Hinweis steht, noch kein Auftrag', !h.join().includes('Zahnarzt') && (await text(page, '#toast span')) === 'Termin gelöscht' && !(await post(page, 'terminWeg')).length, JSON.stringify(h));
  await an(page);   // der Kalender meldet sich zwischendurch (der Termin steht dort noch): Er bleibt verborgen
  p.ok('Löschen: bleibt verborgen, auch wenn der Kalender sich meldet', !(await heute(page)).join().includes('Zahnarzt'));
  await page.click('#toast button'); await page.waitForTimeout(50);
  p.ok('Rückgängig: Termin wieder da, kein Auftrag', (await heute(page)).join().includes('Zahnarzt') && !(await post(page, 'terminWeg')).length);
  await page.click('#v-heute [data-h="termin"][data-id="a"]'); await page.waitForTimeout(50);
  await page.click('#te-weg'); await page.clock.fastForward(7100); await page.waitForTimeout(50);
  m = await post(page, 'terminWeg');
  p.ok('Nach 7 Sekunden: Auftrag „terminWeg“ mit Kennung und Beginn', m.length === 1 && JSON.stringify(m[0]) === JSON.stringify({ art: 'terminWeg', id: 'a', s0: um(0, 14) }), JSON.stringify(m));
  p.ok('Der Hinweis ist wieder weg', await page.evaluate(() => document.querySelector('#toast').hidden));

  /* 10. Der Kalender lehnt ab: Grund als Hinweis ohne Knopf */
  await ruf(page, 'terminFehler', 'Dieser Kalender lässt sich nicht ändern.');
  p.ok('Fehler vom Kalender steht als Hinweis da', (await text(page, '#toast span')) === 'Termin nicht gespeichert: Dieser Kalender lässt sich nicht ändern.' && await page.evaluate(() => getComputedStyle(document.querySelector('#toast button')).display === 'none'));
  await page.clock.fastForward(6100); await page.waitForTimeout(50);
  p.ok('… und verschwindet von selbst', await page.evaluate(() => document.querySelector('#toast').hidden));

  /* 11. Einstellungen: Abschnitt „Kalender“; aus = alles weg, an = Liste neu anfordern */
  await an(page);
  await page.click('#gear'); await page.waitForTimeout(80);
  p.ok('Einstellungen: Schalter „Termine zeigen“ ist an', await page.evaluate(() => document.querySelector('#esheet [data-h="kal"]').getAttribute('aria-checked') === 'true' && document.querySelector('#es-kaln').hidden));
  await page.click('#esheet [data-h="kal"]'); await zu(page); await page.waitForTimeout(50);
  p.ok('Aus: keine Liste, kein Schnell-Knopf, gespeichert als kal 0', !(await heute(page)).length && !(await page.$('#v-heute [data-v="termin"]')) && (await gespeichert(page)).E.kal === 0);
  p.ok('Aus: Wochenleiste ohne Punkte, kommende Tage zeigen wieder auf heute', await page.evaluate(() => !document.querySelector('#v-heute .wk u.t') && document.querySelectorAll('#v-heute .wk .wd[data-d="2026-11-26"]').length === 4));
  await page.click('#gear'); await page.waitForTimeout(80);
  await leeren(page); await page.click('#esheet [data-h="kal"]'); await zu(page); await page.waitForTimeout(50);
  p.ok('Wieder an: Liste angefordert, Termine zurück', (await post(page, 'termine')).length === 1 && (await heute(page)).length === 4 && (await gespeichert(page)).E.kal === undefined);

  /* 12. iOS hat abgelehnt: keine Liste; der Knopf führt zum Hinweis und in die Einstellungen des iPhones */
  await ruf(page, 'termine', { recht: 'nein' });
  p.ok('Abgelehnt: keine Liste, Knopf bleibt', !(await heute(page)).length && !!(await page.$('#v-heute [data-v="termin"]')));
  await page.click('#v-heute [data-v="termin"]'); await page.waitForTimeout(50);
  b = await blatt(page);
  p.ok('Abgelehnt: Blatt erklärt den Weg', b.offen && b.nein && b.titel === 'Termine', JSON.stringify(b));
  await leeren(page); await page.click('#te-einst'); await page.waitForTimeout(50);
  p.ok('„Einstellungen öffnen“ geht an die iPhone-App', (await post(page, 'einstellungen')).length === 1);
  await page.click('#gear'); await page.waitForTimeout(80);
  p.ok('Einstellungen zeigen die Zeile zum Erlauben', await page.evaluate(() => !document.querySelector('#es-kaln').hidden));
  await zu(page);

  /* 13. Neustart: Der gemerkte Stand gilt sofort, noch bevor die iPhone-App sich meldet */
  await an(page);
  await page.reload(); await page.waitForTimeout(300);
  h = await heute(page);
  p.ok('Nach dem Neustart steht die Liste sofort da', h.length === 4 && h[1].startsWith('Zahnarzt'), JSON.stringify(h));
  /* Die Auskunft sagt: Erlaubnis entzogen → nichts mehr zu sehen, nichts mehr gemerkt */
  await ruf(page, 'info', { app: '1.3', kalender: 'nein' });
  p.ok('Erlaubnis entzogen: Liste weg, auch aus dem Merker', !(await heute(page)).length && (await page.evaluate(() => JSON.parse(localStorage.getItem('takt.termine')).liste.length)) === 0);
  p.ok('Keine Fehler', !fehler.length, fehler.join());
  await browser.close();

  /* 14. Arbeitszeit in der Übersicht des Tages (auch ohne Kalender) und 320 px: nichts steht hinaus */
  {
    const daten = { S: { routines: [], running: null }, LY: {}, W: {}, MF: {}, MY: {}, T: {}, K: {}, N: { folders: {}, tasks: {}, notes: {}, work: { e: { w1: { d: '2026-11-26', a: 840, b: 990, p: 0, r: 2500 } } } } };
    const { browser, page, fehler } = await oeffnen({ uhr: JETZT, skript: huelle, daten, breite: 320 });
    await page.click('#v-heute .wk .wd.now'); await page.waitForTimeout(80);
    p.enthaelt('Übersicht des Tages zeigt die Arbeitszeit (14:00–16:30 = 2,5 Std)', await text(page, '#cs-day'), ['Arbeit', '14:00–16:30', '2,5 Std']);
    await zu(page);
    await ruf(page, 'info', { app: '1.3', kalender: 'an' }); await an(page);
    await page.click('#v-heute [data-h="termin"][data-id="a"]'); await page.waitForTimeout(80);
    const breit = await page.evaluate(() => { const d = document.querySelector('#tesheet'); return [...d.querySelectorAll('*')].filter(e => e.offsetParent && e.getBoundingClientRect().right > d.getBoundingClientRect().right + 0.5).length + (document.querySelector('#scroll').scrollWidth > document.querySelector('#scroll').clientWidth ? 100 : 0); });
    p.ok('320 px: Blatt „Termin“ und Heute stehen nicht hinaus', breit === 0, String(breit));
    p.ok('320 px: keine Fehler', !fehler.length, fehler.join());
    await browser.close();
  }
  /* 15. Kalender wählen (v131): Liste der Kalender aus der iPhone-App (ab 1.4), Vorwahl, Merken, Ändern; ganztägig bis Mitternacht; Uni in der Tagesliste; Widget-Adresse „kalender“ */
  {
    const daten = { S: { routines: [], running: null }, LY: {}, W: {}, MF: {}, MY: {}, T: {}, K: {}, N: { folders: {}, tasks: {}, notes: {}, uni: { e: { u1: { d: '2026-11-26', f: 'kons', p: 150, n: 'Füllung' } } } } };
    const { browser, page, fehler } = await oeffnen({ uhr: JETZT, skript: huelle, daten });
    const KALS = [{ id: 'k1', n: 'Privat', f: '#FF3B30', std: 1 }, { id: 'k2', n: 'Familie', f: '#34C759' }];
    /* Ganztägig vom 28.11. bis 0:00 am 29.11. (so liefern manche Kalender das Ende): steht nur am 28. */
    const L2 = LISTE.map(x => Object.assign({}, x, { ki: x.k === 'Privat' ? 'k1' : x.k === 'Uni' ? 'k3' : 'k9' })).concat([{ id: 'm', s: um(2, 0), e: um(3, 0), t: 'Markt', g: 1, w: 1, ki: 'k2', k: 'Familie', f: '#34C759' }]);
    const an2 = (kals, liste) => ruf(page, 'termine', { recht: 'an', liste: liste || L2, kals });
    await ruf(page, 'info', { app: '1.4', kalender: 'an' }); await an2(KALS);
    const wahl = () => page.evaluate(() => ({ zu: document.querySelector('#te-kalf').hidden, chips: [...document.querySelectorAll('#te-kal .chip')].map(c => c.textContent + (c.getAttribute('aria-pressed') === 'true' ? '*' : '')).join() }));
    await page.click('#v-heute [data-v="termin"]');
    let w = await wahl();
    p.ok('Neu: Kalender zur Wahl, vorgewählt der für neue Termine (Privat)', !w.zu && w.chips === 'Privat*,Familie', JSON.stringify(w));
    await page.fill('#te-text', 'Oma besuchen Sa 15 Uhr'); await page.click('#te-kal [data-kal="k2"]');
    await leeren(page); await page.click('#te-save'); await page.waitForTimeout(80);
    let m = await post(page, 'termin');
    p.ok('Neu im Kalender „Familie“: kal k2 im Auftrag, gemerkt als E.kalW', m.length === 1 && m[0].kal === 'k2' && m[0].s === um(2, 15) && (await gespeichert(page)).E.kalW === 'k2', JSON.stringify(m));
    await page.click('#v-heute .wk .wd[data-d="2026-11-28"]'); await page.waitForTimeout(80);
    p.ok('Der neue Termin trägt sofort die Farbe von „Familie“', await page.evaluate(() => { const b = [...document.querySelectorAll('#cs-day [data-c="termin"]')].find(x => x.innerText.includes('Oma')); return !!b && getComputedStyle(b.querySelector('.kf')).backgroundColor === 'rgb(52, 199, 89)'; }));
    await zu(page);
    await an2(KALS);
    await page.click('#v-heute [data-v="termin"]');
    p.ok('Beim nächsten neuen Termin ist „Familie“ vorgewählt', (await wahl()).chips === 'Privat,Familie*');
    await zu(page);
    /* Ändern: Zahnarzt (Privat) zeigt Privat; ohne Wechsel geht kein kal mit, mit Wechsel schon */
    await page.click('#v-heute [data-h="termin"][data-id="a"]');
    p.ok('Ändern: Kalender des Termins vorgewählt', (await wahl()).chips === 'Privat*,Familie');
    await leeren(page); await page.click('#te-save'); await page.waitForTimeout(80);
    m = await post(page, 'termin');
    p.ok('Ändern ohne Wechsel: kein kal im Auftrag', m.length === 1 && !('kal' in m[0]), JSON.stringify(m));
    await an2(KALS);
    await page.click('#v-heute [data-h="termin"][data-id="a"]'); await page.click('#te-kal [data-kal="k2"]');
    await leeren(page); await page.click('#te-save'); await page.waitForTimeout(80);
    m = await post(page, 'termin');
    p.ok('Ändern mit Wechsel: kal k2, die Vorgabe für neue Termine bleibt', m.length === 1 && m[0].kal === 'k2' && m[0].id === 'a' && (await gespeichert(page)).E.kalW === 'k2', JSON.stringify(m));
    await an2(KALS);
    await page.click('#v-heute [data-h="termin"][data-id="d"]');
    p.ok('Wiederholt sich: keine Wahl des Kalenders', (await wahl()).zu);
    await zu(page);
    await an2([KALS[0]]);
    await page.click('#v-heute [data-v="termin"]');
    p.ok('Nur ein Kalender: keine Wahl', (await wahl()).zu);
    await zu(page);
    /* Ganztägig bis 0:00 des Folgetags: nur am 28.11. */
    await page.click('#v-heute .wk .wd[data-d="2026-11-28"]'); await page.waitForTimeout(80);
    p.enthaelt('Markt am 28.11.', await text(page, '#cs-day'), ['Markt', 'ganztägig']);
    await page.click('.cd[data-d="2026-11-29"]'); await page.waitForTimeout(50);
    p.ok('Markt nicht am 29.11.', !(await text(page, '#cs-day')).includes('Markt'), await text(page, '#cs-day'));
    await page.click('.cd[data-d="2026-11-26"]'); await page.waitForTimeout(50);
    p.enthaelt('Uni-Termin in der Tagesliste (150 Hundertstel = 1,5 Punkte)', await text(page, '#cs-day'), ['Uni', 'Kons · Füllung', '1,5 Punkte']);
    await zu(page);
    /* Tipp auf die Termine im großen Widget: trackpunkt://neu/kalender → TrackHuelle.neu('kalender') öffnet die Übersicht bei heute */
    await ruf(page, 'neu', 'kalender'); await page.waitForTimeout(80);
    p.ok('neu(„kalender“) öffnet die Übersicht', await page.evaluate(() => document.querySelector('#csheet').open && document.querySelector('.cd.sel').dataset.d === '2026-11-26'));
    /* Tipp auf eine Notiz im Widget (ab 1.5): trackpunkt://neu/notizen öffnet den Planer bei den Notizen, auch wenn dort gerade Arbeit offen war */
    await zu(page); await page.click('.tab[data-view="routinen"]'); await page.click('#r-subs [data-v="work"]'); await page.click('.tab[data-view="heute"]');
    await ruf(page, 'neu', 'notizen'); await page.waitForTimeout(80);
    p.ok('neu(„notizen“) öffnet den Planer bei den Notizen', await page.evaluate(() => !document.querySelector('#v-routinen').hidden && document.querySelector('#r-subs [aria-pressed="true"]').dataset.v === 'note'));
    p.ok('Gemerkt: auch die Kalender', (await page.evaluate(() => JSON.parse(localStorage.getItem('takt.termine')).kals.length)) === 1);
    p.ok('Keine Fehler (Kalender wählen)', !fehler.length, fehler.join());
    await browser.close();
  }
  await p.ende();
});
