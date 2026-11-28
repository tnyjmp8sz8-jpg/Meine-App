// Termine aus dem Kalender des iPhones (v130, iPhone-App ab 1.3): Heute, Wochenleiste, Übersicht, Blatt „Termin“ mit dem Satz-Leser, Speichern, Ändern, Löschen, Einstellungen.
// Die iPhone-App wird nachgestellt (window.webkit.messageHandlers.track sammelt, was die App schickt; TrackHuelle.info und .termine liefern, was der Kalender meldet).
// Die Uhr steht auf Donnerstag, 26.11.2026, 10:00: So hängt nichts vom Tag ab, an dem die Reihe läuft.
const { oeffnen, text, pruefer, lauf, gespeichert, einstSeite } = require('./lib');

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
  p.ok('Heute: in der Überschrift nur das Plus, kein „Alle n“ (seit v138)', !(await page.$('#v-heute [data-h="kal"]')) && !!(await page.$('#v-heute .sec [data-h="q"][data-v="termin"]')));
  p.ok('Der neue Termin ist noch nicht antippbar (Kennung kommt vom Kalender)', await page.evaluate(() => [...document.querySelectorAll('#v-heute [data-h="termin"]')].filter(b => b.disabled).length === 1));
  /* Die iPhone-App meldet den Kalender neu (jetzt ohne den Friseur): Die Liste gilt */
  await an(page);
  h = await heute(page);
  p.ok('Heute: Liste aus dem Kalender, vier Zeilen, nur das Plus in der Überschrift', h.length === 4 && h[3] === 'Kurztrip Do, 3.12. · ganztägig', JSON.stringify(h));
  p.ok('Punkt in der Farbe des Kalenders', await page.evaluate(() => getComputedStyle(document.querySelector('#v-heute [data-h="termin"][data-id="a"] .kf')).backgroundColor === 'rgb(255, 59, 48)'));
  /* Gemerkt für den nächsten Start: nur was bis in 92 Tagen liegt (ohne den 12.3.2027) */
  const merk = await page.evaluate(() => JSON.parse(localStorage.getItem('takt.termine')));
  p.ok('Gemerkt: Zustand und sechs Termine', merk.recht === 'an' && merk.liste.length === 6, JSON.stringify(merk).slice(0, 200));
  p.ok('Nichts davon in der Sicherung der App', !JSON.stringify(await gespeichert(page)).includes('Zahnarzt'));

  /* 6. Wochenleiste und Kalender wie in iOS (v144, seit v146 wie Apple: eine Kapsel mit einem Abschnitt je Termin, ein einzelner Termin mit Uhrzeit ein Punkt, gedämpft in der Farbe des Kalenders).
     Do 26.: Geburtstag ganztägig (grau, #8E8E93), Früh (grün) und Zahnarzt (rot) → Kapsel mit drei Abschnitten in dieser Reihenfolge. Fr 27.: Seminar (blau) → ein Punkt. Der Freitag (Zukunft) öffnet seinen eigenen Tag. */
  const leiste = await page.evaluate(() => [...document.querySelectorAll('#v-heute .wk .wd')].map(w => w.dataset.d + ':' + [...w.querySelectorAll('.mk .pt, .mk .kap > span')].map(u => (u.classList.contains('pt') ? 'pt ' : 'kap ') + /#[0-9A-F]{6}/i.exec(u.getAttribute('style'))[0]).join('+')));
  p.ok('Wochenleiste: Kapsel und Punkt in den Farben der Kalender, kommende Tage mit eigenem Datum', JSON.stringify(leiste) === JSON.stringify(['2026-11-23:', '2026-11-24:', '2026-11-25:', '2026-11-26:kap #8E8E93+kap #34C759+kap #FF3B30', '2026-11-27:pt #0A84FF', '2026-11-28:', '2026-11-29:']), JSON.stringify(leiste));
  await page.click('#v-heute .wk .wd[data-d="2026-11-27"]'); await page.waitForTimeout(80);
  /* Tag: Woche oben, Titel, Seminar 9–11 Uhr als Block (seit v147 36 px je Stunde wie bei Apple, 12 px über 0:00): oben 12 + 9 × 36 + 1 = 337 px, hoch 2 × 36 − 2 = 70 px, in der Farbe seines Kalenders.
     Seit v147 liegen Woche und Tag je dreimal nebeneinander (davor, jetzt, danach): 26., 27., 28.11. und die Wochen ab 16., 23., 30.11.; bedienbar ist nur die mittlere. */
  const tag27 = await page.evaluate(() => { const c = document.querySelector('#csheet'), s = document.querySelector('.tv[data-slot="0"]'), e = s.querySelector('.tl-e[data-id="d"]');
    return [c.classList.contains('tag'), s.querySelector('.tv-t').textContent, document.querySelector('.tw.sel').dataset.d, [...document.querySelectorAll('.tv-wk[data-slot="0"] .tw')].length, e.style.top, e.style.height, e.innerText.replace(/\s+/g, ' '), getComputedStyle(e.querySelector('.kf')).backgroundColor].join(' | '); });
  p.ok('Tipp auf Freitag: Tagesansicht mit Woche und Seminar als Block 9–11 Uhr', tag27 === 'true | Freitag – 27. Nov. 2026 | 2026-11-27 | 7 | 337px | 70px | Seminar 09:00–11:00 | rgb(10, 132, 255)', tag27);
  const drei = () => page.evaluate(() => { const nach = q => [...document.querySelectorAll(q)].sort((x, y) => x.dataset.slot - y.dataset.slot);   // nach Platz, nicht nach Reihenfolge im Dokument
    return nach('#cs-day .tv').map(t => t.dataset.d.slice(5) + '@' + t.dataset.slot + (t.inert ? 'i' : '') + (t.querySelector('#tl') ? '#' : '')).join(' ') + ' | ' +
      nach('#cs-day .tv-wk').map(t => t.dataset.w.slice(5) + '@' + t.dataset.slot + (t.inert ? 'i' : '')).join(' '); });
  p.ok('Tag: davor, jetzt, danach bereit, nur die Mitte bedienbar', (await drei()) === '11-26@-1i 11-27@0# 11-28@1i | 11-16@-1i 11-23@0 11-30@1i', await drei());
  p.ok('Tag: oben links zurück zum Monat („November“)', (await text(page, '#cs-close')) === 'November');
  await page.click('#cs-close'); await page.waitForTimeout(50);
  const monate = await page.evaluate(() => [...document.querySelectorAll('#cs-body .cm')].map(c => c.dataset.ym));
  /* Zwölf Monate zurück (November 2025) bis zwölf voraus (November 2027) = 25 Monate, ohne Zahl je Monat (wie in iOS) */
  p.ok('Monat: 25 Monate von November 2025 bis November 2027', monate.length === 25 && monate[0] === '2025-11' && monate[24] === '2027-11' && !(await page.$('#cs-body .cm p')), monate.length + ' ' + monate[0] + ' … ' + monate[monate.length - 1]);
  const dez = await page.evaluate(() => ['2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05', '2026-12-06'].map(k => { const c = document.querySelector('.cd[data-d="' + k + '"]'); return (c.disabled ? 'zu' : 'auf') + c.querySelectorAll('.mk .kap > span').length; }).join());
  p.ok('Monat: Kurztrip als Kapsel am 3., 4. und 5.12., kommende Tage sind antippbar', dez === 'auf0,auf1,auf1,auf1,auf0', dez);
  p.ok('Monat: Der Monat des gewählten Tags steht im Blick', await page.evaluate(() => { const b = document.querySelector('#cs-body'), m = b.querySelector('.cm[data-ym="2026-11"]'); const r = m.getBoundingClientRect(), q = b.getBoundingClientRect(); return r.top >= q.top - 2 && r.top < q.bottom; }));
  /* Wie Apple (v146): Vollbild, heute ein roter Kreis, der Name des Monats über seinem ersten Tag: 1.11.2026 ist ein Sonntag (Spalte 7, am Rand kurz „Nov“, rot als laufender Monat),
     1.12.2026 ein Dienstag (Spalte 2, „Dezember“); die große Überschrift nennt den Monat oben im Blick und wechselt beim Scrollen (März 2027 mit Jahr). */
  const apple = await page.evaluate(() => { const c = document.querySelector('#csheet'), r = c.getBoundingClientRect(), l11 = document.querySelector('.cm[data-ym="2026-11"] .cm-l'), l12 = document.querySelector('.cm[data-ym="2026-12"] .cm-l');
    return [r.width === innerWidth && r.height === innerHeight, getComputedStyle(document.querySelector('.cd.now b')).backgroundColor, l11.textContent + (l11.classList.contains('jetzt') ? '*' : '') + ' ' + l11.getAttribute('style'), l12.textContent + (l12.classList.contains('jetzt') ? '*' : '') + ' ' + l12.getAttribute('style'), document.querySelector('#cs-mon').textContent, document.querySelector('.cs-wd').textContent].join(' | '); });
  p.ok('Monat wie Apple: Vollbild, heute rot, „Nov“ über dem Sonntag, „Dezember“ über dem Dienstag, Überschrift „November“, Wochentage als Buchstaben', apple === 'true | rgb(255, 69, 58) | Nov* grid-column:7 | Dezember grid-column:2 | November | MDMDFSS', apple);
  await page.evaluate(() => { const b = document.querySelector('#cs-body'); b.scrollTop = b.querySelector('.cm[data-ym="2027-03"]').offsetTop - b.firstElementChild.offsetTop + 30; }); await page.waitForTimeout(120);
  p.ok('… beim Scrollen wechselt die große Überschrift (März 2027)', (await text(page, '#cs-mon')) === 'März 2027', await text(page, '#cs-mon'));
  await page.click('.cd[data-d="2026-12-04"]'); await page.waitForTimeout(50);
  p.enthaelt('Tipp auf den 4.12.: Kurztrip unter „Ganztägig“', await text(page, '.tv[data-slot="0"]'), ['Ganztägig', 'Kurztrip']);
  /* Wischen über die Stunden: Tag danach und davor; über die Woche: Woche danach */
  const wisch = async (sel, dx) => { const r = await page.evaluate(q => { const b = document.querySelector(q).getBoundingClientRect(); return [b.left + b.width / 2, b.top + Math.min(60, b.height / 2)]; }, sel);
    await page.mouse.move(r[0], r[1]); await page.mouse.down(); await page.mouse.move(r[0] + dx, r[1] + 4, { steps: 4 }); await page.mouse.up(); await page.waitForTimeout(40);
    return page.evaluate(() => document.querySelector('.tw.sel').dataset.d); };
  p.ok('Wischen über die Stunden: nach links der 5.12., nach rechts wieder der 4.12.', (await wisch('#tl', -120)) === '2026-12-05' && (await wisch('#tl', 120)) === '2026-12-04');
  p.ok('Nach dem Wischen: wieder davor, jetzt, danach', (await drei()) === '12-03@-1i 12-04@0# 12-05@1i | 11-23@-1i 11-30@0 12-07@1i', await drei());
  p.ok('Wischen über die Woche: eine Woche weiter (11.12.)', (await wisch('.tv-k', -150)) === '2026-12-11');
  p.ok('… und zurück (4.12.)', (await wisch('.tv-k', 150)) === '2026-12-04');
  /* Kurz gezogen (40 px, unter 40 % der Breite) und ohne Schwung losgelassen: alles gleitet zurück, der Tag bleibt */
  { const r = await page.evaluate(() => { const b = document.querySelector('#tl').getBoundingClientRect(); return [b.left + b.width / 2, b.top + 60]; });
    await page.mouse.move(r[0], r[1]); await page.mouse.down(); await page.mouse.move(r[0] - 40, r[1], { steps: 3 }); await page.waitForTimeout(150); await page.mouse.move(r[0] - 41, r[1]); await page.waitForTimeout(150); await page.mouse.up(); await page.waitForTimeout(40);
    const st = await page.evaluate(() => document.querySelector('.tw.sel').dataset.d + ' ' + document.querySelector('.tv[data-slot="0"]').style.transform);
    p.ok('Kurz gezogen, ohne Schwung: bleibt beim 4.12. und steht wieder an seinem Platz', st === '2026-12-04 ', st); }
  await page.click('.tv-wk[data-slot="0"] .tw[data-d="2026-12-03"]');
  p.ok('Tipp auf einen Tag der Woche: dieser Tag', await page.evaluate(() => document.querySelector('.tw.sel').dataset.d === '2026-12-03' && document.querySelector('.tv[data-slot="0"] .tv-t').textContent === 'Donnerstag – 3. Dez. 2026'));
  await page.click('.tv-wk[data-slot="0"] .tw[data-d="2026-12-04"]'); await page.waitForTimeout(30);
  /* Tipp auf eine freie Stelle der Zeitleiste um 14:20 → neuer Termin 14:00–15:00; ein Satz ohne Uhrzeit macht ihn nicht ganztägig (36 px je Stunde, 12 px über 0:00) */
  await page.evaluate(() => { document.querySelector('#tl').scrollTop = 12 + 13 * 36; });
  const yy = await page.evaluate(() => document.querySelector('#tl .tl-in').getBoundingClientRect().top + 12 + (14 * 60 + 20) * 36 / 60);
  await page.mouse.click(200, yy); await page.waitForTimeout(50);
  b = await blatt(page);
  p.ok('Tipp auf 14:20 in der Zeitleiste: neuer Termin am 4.12. von 14:00 bis 15:00', b.offen && b.titel === 'Termin eintragen' && b.tag === '2026-12-04' && b.von === '14:00' && b.bis === '15:00' && !b.ganz, JSON.stringify(b));
  await page.fill('#te-text', 'Friseur');
  b = await blatt(page);
  p.ok('… „Friseur“ ohne Uhrzeit bleibt um 14:00', b.von === '14:00' && !b.ganz, JSON.stringify(b));
  await page.evaluate(() => document.querySelector('#tesheet').close()); await page.waitForTimeout(30);
  /* Suche über Titel und Ort: „mitte“ findet den Zahnarzt (Ort Praxis Mitte) */
  await page.click('#cs-akt [data-c="suche"]'); await page.keyboard.type('mitte'); await page.waitForTimeout(30);
  p.enthaelt('Suche „mitte“: Zahnarzt mit Ort und Zeit', await text(page, '#cs-such'), ['Donnerstag, 26. Nov. 2026', 'Zahnarzt', 'Praxis Mitte', '14:00–15:30']);
  await page.click('#cs-sbar [data-c="sucheZu"]');
  p.ok('Abbrechen: zurück zum Tag', await page.evaluate(() => document.querySelector('#csheet').classList.contains('tag') && !document.querySelector('#csheet').classList.contains('such')));
  /* „+“ oben trägt für den gezeigten Tag ein */
  await page.click('#cs-plus'); await page.waitForTimeout(50);
  b = await blatt(page);
  p.ok('„+“ am 4.12.: Blatt mit diesem Tag', b.offen && b.tag === '2026-12-04' && b.bisTag === '2026-12-04', JSON.stringify(b));
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
  await einstSeite(page, 'kal');
  p.ok('Einstellungen: Schalter „Termine zeigen“ ist an', await page.evaluate(() => document.querySelector('#esheet [data-h="kal"]').getAttribute('aria-checked') === 'true' && document.querySelector('#es-kaln').hidden));
  await page.click('#esheet [data-h="kal"]'); await zu(page); await page.waitForTimeout(50);
  p.ok('Aus: keine Liste, kein Schnell-Knopf, gespeichert als kal 0', !(await heute(page)).length && !(await page.$('#v-heute [data-v="termin"]')) && (await gespeichert(page)).E.kal === 0);
  p.ok('Aus: Wochenleiste ohne Punkte, kommende Tage zeigen wieder auf heute', await page.evaluate(() => !document.querySelector('#v-heute .wk u.t') && document.querySelectorAll('#v-heute .wk .wd[data-d="2026-11-26"]').length === 4));
  await einstSeite(page, 'kal');
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
  await einstSeite(page, 'kal');
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
    p.ok('Kalender auf Heute zeigt keine Arbeitszeit (seit v135 nur Termine aus Apples Kalender)', !(await text(page, '#cs-day')).includes('Arbeit') && (await text(page, '#cs-day')).includes('Keine Termine an diesem Tag.'), await text(page, '#cs-day'));
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
    p.enthaelt('Markt am 28.11.', await text(page, '#cs-day'), ['Markt', 'Ganztägig']);
    await page.click('.tv-wk[data-slot="0"] .tw[data-d="2026-11-29"]'); await page.waitForTimeout(50);
    p.ok('Markt nicht am 29.11.', !(await text(page, '.tv[data-slot="0"]')).includes('Markt'), await text(page, '.tv[data-slot="0"]'));
    await page.click('.tv-wk[data-slot="0"] .tw[data-d="2026-11-26"]'); await page.waitForTimeout(50);
    p.ok('Kein Uni-Termin in der Tagesliste (seit v135 nur Termine)', !(await text(page, '#cs-day')).includes('Füllung'), await text(page, '#cs-day'));
    await zu(page);
    /* Tipp auf die Termine im großen Widget: trackpunkt://neu/kalender → TrackHuelle.neu('kalender') öffnet die Übersicht bei heute */
    await ruf(page, 'neu', 'kalender'); await page.waitForTimeout(80);
    p.ok('neu(„kalender“) öffnet den Kalender beim heutigen Tag', await page.evaluate(() => document.querySelector('#csheet').open && document.querySelector('#csheet').classList.contains('tag') && document.querySelector('.tw.sel').dataset.d === '2026-11-26'));
    /* Tipp auf eine Notiz im Widget (ab 1.5): trackpunkt://neu/notizen öffnet den Planer bei den Notizen, auch wenn dort gerade Arbeit offen war */
    await zu(page); await page.click('.tab[data-view="routinen"]'); await page.click('#r-subs [data-v="work"]'); await page.click('.tab[data-view="heute"]');
    await ruf(page, 'neu', 'notizen'); await page.waitForTimeout(80);
    p.ok('neu(„notizen“) öffnet den Planer bei den Notizen', await page.evaluate(() => !document.querySelector('#v-routinen').hidden && document.querySelector('#r-subs [aria-pressed="true"]').dataset.v === 'note'));
    p.ok('Gemerkt: auch die Kalender', (await page.evaluate(() => JSON.parse(localStorage.getItem('takt.termine')).kals.length)) === 1);
    p.ok('Keine Fehler (Kalender wählen)', !fehler.length, fehler.join());
    await browser.close();
  }
  /* 16. Kalender zum Eintragen (v147, sein Wunsch 28.11.: „Kalender-Kategorien nur [seine drei]“): In den Einstellungen je Kalender ein Schalter; im Blatt und in der
     Schnelleingabe der iPhone-App (Stand: kals, kal, erZ, erG) stehen nur die eingeschalteten; der letzte lässt sich nicht abschalten. Gewählt in der Schnelleingabe (Eingang „kalwahl“):
     beim nächsten Termin vorbelegt. Ein Termin aus einem abgeschalteten Kalender zeigt beim Ändern seinen eigenen trotzdem. */
  {
    const { browser, page, fehler } = await oeffnen({ uhr: JETZT, skript: huelle });
    const KALS = [{ id: 'k1', n: 'Arbeit', f: '#FF3B30' }, { id: 'k2', n: 'Geburtstage', f: '#8E8E93' }, { id: 'k3', n: 'Privat', f: '#FF9F0A', std: 1 }, { id: 'k4', n: 'Uni', f: '#AF52DE' }];
    const L3 = LISTE.map(x => Object.assign({}, x, { ki: x.k === 'Privat' ? 'k3' : x.k === 'Uni' ? 'k4' : 'k2' })).concat([{ id: 'z', s: um(1, 18), e: um(1, 19), t: 'Schicht', w: 1, ki: 'k1', k: 'Arbeit', f: '#FF3B30' }]);
    await ruf(page, 'info', { app: '1.6', kalender: 'an' }); await ruf(page, 'termine', { recht: 'an', liste: L3, kals: KALS }); await page.waitForTimeout(400);
    const stand = () => page.evaluate(() => { const s = window.__post.filter(m => m.art === 'stand').pop(); return s ? [(s.kals || []).map(k => k.n + (k.f ? '' : '?')).join(','), s.kal, s.erZ, 'erG' in s ? s.erG : '-'].join(' | ') : 'kein Stand'; });
    p.ok('Stand: alle vier Kalender, vorbelegt Privat (der von iOS), Erinnerung 60 min, ganztägig keine', (await stand()) === 'Arbeit,Geburtstage,Privat,Uni | k3 | 60 | -', await stand());
    /* Die einmalige Vorwahl (v148) greift nur bei seinen Kalendernamen (Prüfsummen im Code): Hier bleibt alles an, und sie ist nicht als geschehen gemerkt */
    p.ok('Keine Vorwahl bei anderen Namen', await page.evaluate(() => { const e = (JSON.parse(localStorage.getItem('takt.v1') || '{}') || {}).E || {}; return !e.kalVor && !e.kalNein; }));
    await einstSeite(page, 'kal');
    const sch = () => page.evaluate(() => [...document.querySelectorAll('#es-body [data-h="kalNein"]')].map(b => b.textContent + (b.getAttribute('aria-checked') === 'true' ? '+' : '-') + (b.disabled ? '!' : '')).join(' '));
    p.ok('Einstellungen: je Kalender ein Schalter, alle an', (await sch()) === 'Arbeit+ Geburtstage+ Privat+ Uni+', await sch());
    for (const k of ['k1', 'k2', 'k4']) await page.click('#es-body [data-h="kalNein"][data-v="' + k + '"]');
    p.ok('Drei aus: Privat bleibt als letzter gesperrt an', (await sch()) === 'Arbeit- Geburtstage- Privat+! Uni-', await sch());
    await page.evaluate(() => document.querySelector('#es-body [data-h="kalNein"][data-v="k3"]').click());
    p.ok('Gespeichert: drei abgeschaltet', JSON.stringify((await gespeichert(page)).E.kalNein) === '["k1","k2","k4"]', JSON.stringify((await gespeichert(page)).E.kalNein));
    await page.click('#es-body [data-h="kalNein"][data-v="k4"]');
    await zu(page); await page.waitForTimeout(400);
    p.ok('Stand: nur noch Privat und Uni', (await stand()) === 'Privat,Uni | k3 | 60 | -', await stand());
    await page.click('#v-heute [data-v="termin"]');
    const wahl = () => page.evaluate(() => ({ zu: document.querySelector('#te-kalf').hidden, chips: [...document.querySelectorAll('#te-kal .chip')].map(c => c.textContent + (c.getAttribute('aria-pressed') === 'true' ? '*' : '')).join() }));
    p.ok('Blatt: nur Privat und Uni zur Wahl', (await wahl()).chips === 'Privat*,Uni', JSON.stringify(await wahl()));
    await zu(page);
    /* Seit v148 ist ein ausgeschalteter Kalender überall weg: „Schicht“ (Arbeit) steht weder auf Heute noch im Tag, „Geburtstag Mama“ (Geburtstage) auch nicht */
    p.ok('Aus heißt weg: Heute ohne „Geburtstag Mama“', !(await heute(page)).some(z => z.includes('Geburtstag')), JSON.stringify(await heute(page)));
    await page.click('#v-heute .wk .wd[data-d="2026-11-27"]'); await page.waitForTimeout(80);
    p.ok('… und im Tag (27.11.) ohne „Schicht“, „Seminar“ (Uni) bleibt', await page.evaluate(() => !document.querySelector('.tv[data-slot="0"] .tl-e[data-id="z"]') && !!document.querySelector('.tv[data-slot="0"] .tl-e[data-id="d"]')));
    await zu(page);
    await page.waitForTimeout(400);
    p.ok('Stand für das große Widget: kalNein mit den zwei ausgeschalteten (Arbeit, Geburtstage)', await page.evaluate(() => JSON.stringify(window.__post.filter(m => m.art === 'stand').pop().kalNein)) === '["k1","k2"]');
    /* Nur noch ein Kalender an: keine Wahl im Blatt, aber der Auftrag nennt ihn, sonst nähme iOS seinen Kalender für neue Termine */
    await einstSeite(page, 'kal'); await page.click('#es-body [data-h="kalNein"][data-v="k4"]'); await zu(page);
    await page.click('#v-heute [data-v="termin"]');
    p.ok('Nur Privat an: keine Wahl im Blatt', (await wahl()).zu);
    await page.fill('#te-text', 'Kino morgen 20 Uhr'); await leeren(page); await page.click('#te-save'); await page.waitForTimeout(80);
    const m = await post(page, 'termin');
    p.ok('… der Auftrag geht trotzdem an Privat (kal k3)', m.length === 1 && m[0].kal === 'k3', JSON.stringify(m));
    /* Schnelleingabe der iPhone-App hat Uni gewählt: Eingang „kalwahl“ → vorbelegt */
    await einstSeite(page, 'kal'); await page.click('#es-body [data-h="kalNein"][data-v="k4"]'); await zu(page);
    await ruf(page, 'eingang', [{ id: 'e1', art: 'kalwahl', kal: 'k4', t: Date.now() }]); await page.waitForTimeout(50);
    await page.click('#v-heute [data-v="termin"]');
    p.ok('Eingang „kalwahl“ aus der Schnelleingabe: Uni ist vorbelegt', (await wahl()).chips === 'Privat,Uni*' && (await gespeichert(page)).E.kalW === 'k4', JSON.stringify(await wahl()));
    await zu(page);
    p.ok('Keine Fehler (Kalender zum Eintragen)', !fehler.length, fehler.join());
    await browser.close();
  }
  /* 16b. Stundenhöhe (v150, Einstellungen → Kalender): Groß = 48 px je Stunde. Seminar 9–11 Uhr am 27.11.: oben 12 + 9 × 48 + 1 = 445 px, hoch 2 × 48 − 2 = 94 px */
  {
    const { browser, page, fehler } = await oeffnen({ uhr: JETZT, skript: huelle });
    await ruf(page, 'info', { app: '1.7', kalender: 'an' }); await an(page);
    await einstSeite(page, 'kal'); await page.click('#es-body [data-h="kalH"][data-v="48"]'); await zu(page);
    await page.click('#v-heute .wk .wd[data-d="2026-11-27"]'); await page.waitForTimeout(80);
    const blk = await page.evaluate(() => { const e = document.querySelector('.tv[data-slot="0"] .tl-e[data-id="d"]'); return e.style.top + ' ' + e.style.height + ' ' + getComputedStyle(document.querySelector('#tl .tl-in')).height; });
    p.ok('Stundenhöhe Groß: Seminar 445 px oben, 94 px hoch, Zeitleiste 24 × 48 + 24 = 1176 px', blk === '445px 94px 1176px', blk);
    /* Erinnerung bei neuen Terminen (v151): mit Uhrzeit „1 Tag“ (1440), ganztägig „Am Vortag“ (900) → so vorbelegt im Blatt und im Stand für die Schnelleingabe */
    await zu(page); await einstSeite(page, 'kal');
    p.ok('Erinnerung: vorgewählt 1 Std und Keine', (await page.evaluate(() => [...document.querySelectorAll('#es-body [data-h="erZ"][aria-pressed="true"], #es-body [data-h="erG"][aria-pressed="true"]')].map(b => b.textContent).join(','))) === '1 Std,Keine');
    await page.click('#es-body [data-h="erZ"][data-v="1440"]'); await page.click('#es-body [data-h="erG"][data-v="900"]'); await zu(page); await page.waitForTimeout(400);
    const eg = (await gespeichert(page)).E, st = await page.evaluate(() => window.__post.filter(m => m.art === 'stand').pop());
    p.ok('gespeichert (E.erZ 1440, E.erG 900) und im Stand für die iPhone-App', eg.erZ === 1440 && eg.erG === 900 && st.erZ === 1440 && st.erG === 900, JSON.stringify([eg.erZ, eg.erG, st.erZ, st.erG]));
    await page.click('#v-heute [data-v="termin"]');
    p.ok('Neuer Termin ohne Uhrzeit (ganztägig): „Am Vortag“ vorgewählt', (await blatt(page)).er === 'Am Vortag', JSON.stringify(await blatt(page)));
    await page.fill('#te-text', 'Arzt 15 Uhr');
    p.ok('… mit Uhrzeit: „1 Tag“', (await blatt(page)).er === '1 Tag', JSON.stringify(await blatt(page)));
    await zu(page);
    p.ok('Keine Fehler (Stundenhöhe)', !fehler.length, fehler.join());
    await browser.close();
  }
  /* 17. Bewegung wie in Apples Kalender (v147, sein Video): Mit Bewegung liegt beim Wechsel Monat → Tag der Tag über dem Monat (Klasse wandel), die Woche des Tags beginnt auf der Höhe
     ihrer Zeile im Monat und endet in der Leiste; danach ist nur noch der Tag da. Zurück dasselbe rückwärts, danach ist der Tag leer. Blättern: Der Tag folgt dem Finger. */
  {
    const { browser, page, fehler } = await oeffnen({ uhr: JETZT, skript: huelle, bewegung: true });
    await ruf(page, 'info', { app: '1.6', kalender: 'an' }); await an(page);
    await page.click('#v-heute .wk .wd[data-d="2026-11-26"]'); await page.waitForTimeout(700);
    await page.click('#cs-close'); await page.waitForTimeout(700);
    const nur = () => page.evaluate(() => document.getAnimations().filter(a => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition)));
    const halt = t => page.evaluate(t => { const as = document.getAnimations().filter(a => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition)); as.forEach(a => { a.pause(); a.currentTime = t; }); return as.length; }, t);
    const zeile = await page.evaluate(() => { const b = document.querySelector('.cd[data-d="2026-12-04"] b').getBoundingClientRect(); return b.top + b.height / 2; });
    await page.click('.cd[data-d="2026-12-04"]');
    const n = await halt(0);
    const start = await page.evaluate(() => { const c = document.querySelector('#csheet'), b = document.querySelector('.tv-wk[data-slot="0"] .tw[data-d="2026-12-04"] b').getBoundingClientRect();
      return [c.classList.contains('wandel'), c.classList.contains('tag'), getComputedStyle(document.querySelector('.cs-body')).display, Math.round(b.top + b.height / 2), getComputedStyle(document.querySelector('.tv[data-slot="0"]')).opacity].join(' | '); });
    p.ok('Monat → Tag, am Anfang: Tag über dem Monat, die Woche auf der Höhe ihrer Zeile im Monat, der Tag noch unsichtbar', n > 20 && start === 'true | true | block | ' + Math.round(zeile) + ' | 0', n + ' Animationen · ' + start + ' (Zeile ' + Math.round(zeile) + ')');
    await page.evaluate(() => document.getAnimations().forEach(a => a.play())); await page.waitForTimeout(700);
    const ende = await page.evaluate(() => { const c = document.querySelector('#csheet'); return [c.classList.contains('wandel'), c.classList.contains('tag'), getComputedStyle(document.querySelector('.cs-body')).display, document.querySelector('#tl').closest('.tv').dataset.d, document.querySelector('#cs-close').textContent].join(' | '); });
    p.ok('… am Ende: nur der Tag (4.12.), oben „‹ Dezember“', ende === 'false | true | none | 2026-12-04 | Dezember', ende);
    p.ok('… alle Animationen sind abgeräumt', (await page.evaluate(() => document.getAnimations().filter(a => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition) && a.playState !== 'finished').length)) === 0);
    /* Blättern mit dem Finger: Nach 100 px zur Seite steht der Tag 100 px weiter links, der nächste kommt von rechts nach */
    const r = await page.evaluate(() => { const b = document.querySelector('#tl').getBoundingClientRect(); return [b.left + b.width * .7, b.top + 100, b.width]; });
    await page.mouse.move(r[0], r[1]); await page.mouse.down(); await page.mouse.move(r[0] - 20, r[1]); await page.mouse.move(r[0] - 120, r[1], { steps: 5 });
    const mitte = await page.evaluate(() => [...document.querySelectorAll('.tv')].sort((x, y) => x.dataset.slot - y.dataset.slot).map(t => Math.round(t.getBoundingClientRect().left)).join(','));
    p.ok('Beim Ziehen: Tag und Nachbarn folgen dem Finger (100 px)', mitte === [-r[2] - 100, -100, r[2] - 100].join(','), mitte);
    /* Meldet der Kalender währenddessen etwas Neues, bleibt alles unter dem Finger; gezeichnet wird nach dem Loslassen */
    await an(page, LISTE.concat([{ id: 'n', s: um(9, 16), e: um(9, 17), t: 'Neu dazu', w: 1, k: 'Privat', f: '#FF3B30' }]));
    const zt = await page.evaluate(() => document.querySelector('.tv[data-slot="0"]').style.transform);
    p.ok('Neue Termine beim Ziehen: nichts springt (die Seite steht weiter 100 px links)', /- 100px|-100px/.test(zt), zt);
    await page.mouse.up(); await page.waitForTimeout(700);
    p.ok('… nach dem Loslassen steht der neue Termin am 5.12.', (await text(page, '.tv[data-slot="0"]')).includes('Neu dazu'), await text(page, '.tv[data-slot="0"]'));
    p.ok('Losgelassen mit Schwung: der 5.12.', await page.evaluate(() => document.querySelector('.tw.sel').dataset.d === '2026-12-05' && document.querySelector('#tl').closest('.tv').dataset.d === '2026-12-05' && !document.querySelector('.tv[data-slot="0"]').style.transform));
    /* Zurück: am Anfang ist der Monat schon gezeichnet und der Tag liegt darüber, am Ende ist der Tag leer und oben steht wieder der Pfeil */
    await page.click('#cs-close'); await halt(0);
    p.ok('Tag → Monat, am Anfang: Monat da, Tag darüber', await page.evaluate(() => document.querySelector('#csheet').classList.contains('wandel') && !document.querySelector('#csheet').classList.contains('tag') && !!document.querySelector('.cd[data-d="2026-12-05"]') && !!document.querySelector('#cs-day .tv')));
    await page.evaluate(() => document.getAnimations().forEach(a => a.play())); await page.waitForTimeout(700);
    p.ok('… am Ende: nur der Monat, der Tag ist leer', await page.evaluate(() => !document.querySelector('#csheet').classList.contains('wandel') && document.querySelector('#cs-day').innerHTML === '' && document.querySelector('#cs-close').getAttribute('aria-label') === 'Schließen'));
    /* „Heute“ im Monat: Die Liste gleitet zum laufenden Monat (weich, nicht im selben Augenblick) */
    await page.evaluate(() => { const b = document.querySelector('#cs-body'); b.scrollTop = b.querySelector('.cm[data-ym="2027-05"]').offsetTop; });
    await page.click('.cs-heute');
    const y1 = await page.evaluate(() => document.querySelector('#cs-body').scrollTop); await page.waitForTimeout(900);
    const ziel = await page.evaluate(() => { const b = document.querySelector('#cs-body'); return [b.scrollTop, b.querySelector('.cm[data-ym="2026-11"]').offsetTop - b.firstElementChild.offsetTop]; });
    p.ok('„Heute“ im Monat: gleitet zum November', Math.abs(ziel[0] - ziel[1]) < 2 && Math.abs(y1 - ziel[1]) > 50, y1 + ' → ' + ziel.join(' / '));
    p.ok('Keine Fehler (Bewegung)', !fehler.length, fehler.join());
    await browser.close();
  }
  await p.ende();
});
