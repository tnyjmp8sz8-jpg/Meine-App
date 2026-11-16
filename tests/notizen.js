// Aufgaben und Notizen im Bereich Routinen: anlegen, abhaken, Abschnitte, Ordner, Notiz speichert von selbst, Rückgängig, Sicherung.
const { oeffnen, text, bereich, gespeichert, pruefer, lauf, tag, blaetterZu } = require('./lib');
const { beispiel, alsSicherung } = require('./daten');

lauf(async () => {
  const P = pruefer('Aufgaben und Notizen'), { browser, page, fehler } = await oeffnen();
  const sub = v => page.click('#r-subs [data-v="' + v + '"]');
  const kurz = () => page.waitForTimeout(200);
  const chip = (box, name) => page.click(box + ' .chip:has-text("' + name + '")');
  const liste = () => text(page, '#n-main');
  const aufgaben = async () => Object.values((await gespeichert(page)).N.tasks).filter(Boolean);
  const notizen = async () => Object.values((await gespeichert(page)).N.notes).filter(Boolean);
  const neu = async (titel, faellig, ordner, datum) => {
    await page.click('#add'); await page.fill('#a-title', titel);
    if (faellig) await chip('#a-due', faellig);
    if (datum) await page.fill('#a-date', datum);
    if (ordner) await chip('#a-folder', ordner);
    await page.click('#a-save'); await kurz();
  };

  // --- Aufgaben: leer, anlegen, Abschnitte ---
  await bereich(page, 'routinen'); await sub('task');
  P.enthaelt('leerer Zustand', await liste(), ['Noch keine Aufgabe']);
  await page.click('#add'); await page.click('#a-save');
  P.enthaelt('ohne Titel wird nicht gespeichert', await text(page, '#a-err'), ['was zu tun ist']);
  await page.click('#as-close');
  await neu('Kapitel schreiben', null, 'Promotion');          // heute
  await neu('Folien hochladen', 'Morgen', 'Uni');
  await neu('Messreihe auswerten', 'Ohne Datum', 'Promotion');
  await neu('Klausur anmelden', 'Anderer Tag', 'Uni', tag(-10));
  P.enthaelt('eine Aufgabe für heute: 1 offen', await text(page, '#n-main .hero'), ['1 offen', '0 von 1 erledigt']);
  const l1 = await liste();
  P.ok('Abschnitte in der richtigen Reihenfolge', l1.indexOf('Kapitel schreiben') < l1.indexOf('Demnächst') && l1.indexOf('Demnächst') < l1.indexOf('Folien hochladen') && l1.indexOf('Folien hochladen') < l1.indexOf('Klausur anmelden') && l1.indexOf('Klausur anmelden') < l1.indexOf('Ohne Datum') && l1.indexOf('Ohne Datum') < l1.indexOf('Messreihe auswerten'), l1);
  P.enthaelt('morgen heißt „Morgen“, der Ordner steht dabei', l1, ['Folien hochladen Uni Morgen']);

  // --- Abhaken: bleibt heute durchgestrichen stehen, zählt als erledigt; noch ein Tipp öffnet sie wieder ---
  await page.click('#n-main .trow:has-text("Kapitel schreiben") .tk'); await kurz();
  P.enthaelt('abgehakt: 0 offen, 1 von 1 erledigt', await text(page, '#n-main .hero'), ['0 offen', '1 von 1 erledigt']);
  P.ok('steht durchgestrichen weiter da', await page.evaluate(() => !!document.querySelector('#n-main .trow.done') && document.querySelector('#n-main .trow.done').innerText.includes('Kapitel schreiben')));
  P.ok('Wochenleiste zeigt heute einen Punkt', await page.evaluate(() => !!document.querySelector('#n-main .wk .wd.now u.b')));
  await page.click('#n-main .trow:has-text("Kapitel schreiben") .tk'); await kurz();
  P.enthaelt('wieder geöffnet: 1 offen', await text(page, '#n-main .hero'), ['1 offen']);

  // --- Liegengebliebenes rutscht auf heute; früher Erledigtes liegt eingeklappt unter „Erledigt“ ---
  await page.evaluate(d => { const o = JSON.parse(localStorage.getItem('takt.v1'));
    o.N.tasks.alt = { t: 'Von gestern', f: '', d: d.gestern, done: null, c: 1, n: '' };
    o.N.tasks.fertig = { t: 'Vorgestern erledigt', f: '', d: d.vorgestern, done: Date.now() - 2 * 864e5, c: 1, n: '' };
    localStorage.setItem('takt.v1', JSON.stringify(o)); }, { gestern: tag(1), vorgestern: tag(2) });
  await page.reload(); await page.waitForTimeout(300); await bereich(page, 'routinen'); await sub('task');
  P.enthaelt('Aufgabe von gestern steht unter Heute: 2 offen', await text(page, '#n-main .hero'), ['2 offen']);
  P.enthaelt('mit rotem „Gestern“', await text(page, '#n-main .when.late'), ['Gestern']);
  P.ok('Erledigtes ist eingeklappt', (await liste()).includes('Erledigt 1') && !(await liste()).includes('Vorgestern erledigt'));
  await page.click('#n-main [data-n="donefold"]'); await kurz();
  P.enthaelt('aufgeklappt zeigt es die Aufgabe', await liste(), ['Vorgestern erledigt']);

  // --- Ordner: filtern, eigener Ordner beim Anlegen ---
  await page.click('#n-main [data-n="folder"]:has-text("Uni")'); await kurz();
  P.ok('Ordner Uni zeigt nur Uni-Aufgaben', (await liste()).includes('Folien hochladen') && !(await liste()).includes('Kapitel schreiben'));
  await page.click('#add');
  P.ok('neue Aufgabe übernimmt den gewählten Ordner', (await text(page, '#a-folder [aria-pressed="true"]')) === 'Uni');
  await chip('#a-folder', '+ Ordner'); await page.fill('#a-fnew', 'Haushalt'); await page.click('#a-fnew-add');
  P.ok('eigener Ordner ist angelegt und gewählt', (await text(page, '#a-folder [aria-pressed="true"]')) === 'Haushalt');
  await page.fill('#a-title', 'Müll rausbringen'); await page.click('#a-save'); await kurz();
  await page.click('#n-main [data-n="folder"]:has-text("Alle")'); await kurz();
  P.enthaelt('Aufgabe im eigenen Ordner', await liste(), ['Müll rausbringen Haushalt']);

  // --- Ändern, löschen, Rückgängig ---
  await page.click('#n-main [data-n="task"]:has-text("Müll rausbringen")'); await page.fill('#a-title', 'Müll und Papier rausbringen'); await chip('#a-due', 'Ohne Datum'); await page.click('#a-save'); await kurz();
  P.ok('geändert: neuer Titel, kein Datum mehr', (await aufgaben()).some(t => t.t === 'Müll und Papier rausbringen' && t.d === null));
  const vorher = await page.evaluate(() => localStorage.getItem('takt.v1'));
  await page.click('#n-main [data-n="task"]:has-text("Müll und Papier")'); await page.click('#a-del'); await kurz();
  P.ok('gelöscht', !(await liste()).includes('Müll und Papier'));
  await page.click('#toast button'); await kurz();
  P.ok('Rückgängig holt die Aufgabe zurück', (await page.evaluate(() => localStorage.getItem('takt.v1'))) === vorher && (await liste()).includes('Müll und Papier'));

  // --- Heute: Aufgaben des Tages stehen dort und lassen sich abhaken ---
  await bereich(page, 'heute');
  P.enthaelt('Heute zeigt die Aufgaben des Tages', await text(page, '#v-heute'), ['Aufgaben2 offen', 'Kapitel schreiben', 'Von gestern']);
  await page.click('#v-heute .trow:has-text("Von gestern") .tk'); await kurz();
  P.enthaelt('auf Heute abgehakt: 1 offen', await text(page, '#v-heute'), ['Aufgaben1 offen']);
  await page.click('#v-heute [data-h="q"][data-v="aufgabe"]'); await page.fill('#a-title', 'Schnell notiert'); await page.click('#a-save'); await kurz();
  P.enthaelt('Schnell-Knopf legt eine Aufgabe für heute an', await text(page, '#v-heute'), ['Aufgaben2 offen', 'Schnell notiert']);

  // --- Notizen: speichern von selbst, ohne „Speichern“ ---
  await bereich(page, 'routinen'); await sub('note');
  P.enthaelt('leerer Zustand', await liste(), ['Noch keine Notiz']);
  await page.click('#add'); await page.click('#ns-close'); await kurz();
  P.ok('leere Notiz wird nicht angelegt', (await notizen()).length === 0);
  await page.click('#add'); await page.fill('#n-title', 'Besprechung'); await page.fill('#n-text', 'Kapitel 2 kürzen.\nAbbildung 4 neu.'); await page.waitForTimeout(600);
  P.ok('kurz nach dem Tippen ist die Notiz gespeichert', (await notizen()).some(n => n.t === 'Besprechung' && n.x.includes('Abbildung 4')));
  await page.click('#n-item-add'); await page.keyboard.type('Termin ausmachen'); await page.keyboard.press('Enter'); await page.keyboard.type('Folien schicken');
  await page.click('#n-items .nitem:first-child .tk');
  await chip('#n-folder', 'Promotion'); await page.click('#n-pin');
  await page.evaluate(() => document.querySelector('#nsheet').close()); await kurz();   // irgendein Weg zu schließen, hier wie die Zurück-Taste
  const n1 = (await notizen())[0];
  P.ok('Punkte zum Abhaken, Ordner und Anheften sind gespeichert', n1 && n1.items.length === 2 && n1.items[0].d === true && n1.items[1].t === 'Folien schicken' && n1.f === 'prom' && n1.pin === true, JSON.stringify(n1));
  P.enthaelt('Liste: angeheftet, mit Ordner und erster Zeile', await liste(), ['Angeheftet', 'Besprechung Promotion · Kapitel 2 kürzen. Heute']);
  await page.click('#add'); await page.fill('#n-text', 'Nur Text ohne Titel'); await page.click('#n-done'); await kurz();
  P.enthaelt('Notiz ohne Titel heißt nach ihrer ersten Zeile', await liste(), ['Nur Text ohne Titel']);
  // Beim ersten Speichern darf sich im Blatt nichts verschieben: „Fertig“ bleibt, wo es ist (sonst geht ein Tipp daneben)
  await page.click('#add'); const y1 = await page.evaluate(() => Math.round(document.querySelector('#n-done').getBoundingClientRect().top));
  await page.fill('#n-title', 'Lage'); await page.waitForTimeout(600);
  const y2 = await page.evaluate(() => Math.round(document.querySelector('#n-done').getBoundingClientRect().top));
  P.ok('Knöpfe verschieben sich beim ersten Speichern nicht', y1 === y2 && (await notizen()).some(n => n.t === 'Lage'), y1 + ' / ' + y2);
  await page.click('#n-del'); await kurz();

  // „Als Aufgabe“ legt eine Aufgabe für heute an, die Notiz bleibt
  await page.click('#n-main [data-n="note"]:has-text("Besprechung")'); await page.click('#n-task');
  P.ok('Knopf meldet es', (await text(page, '#n-task')) === 'Aufgabe angelegt');
  await page.click('#n-done'); await kurz();
  P.ok('Aufgabe „Besprechung“ für heute im selben Ordner', (await aufgaben()).some(t => t.t === 'Besprechung' && t.d === tag(0) && t.f === 'prom') && (await notizen()).length === 2);

  // Löschen und Rückgängig; geleerte Notiz verschwindet
  const mitNotiz = await page.evaluate(() => localStorage.getItem('takt.v1'));
  await page.click('#n-main [data-n="note"]:has-text("Besprechung")'); await page.click('#n-del'); await kurz();
  P.ok('Notiz gelöscht, Blatt zu', (await notizen()).length === 1 && !(await page.evaluate(() => document.querySelector('#nsheet').open)));
  await page.click('#toast button'); await kurz();
  P.ok('Rückgängig holt sie zurück', (await page.evaluate(() => localStorage.getItem('takt.v1'))) === mitNotiz);
  await page.click('#n-main [data-n="note"]:has-text("Nur Text")'); await page.fill('#n-text', ''); await page.click('#n-done'); await kurz();
  P.ok('geleerte Notiz ist weg', (await notizen()).length === 1);
  await page.click('#n-main [data-n="note"]:has-text("Besprechung")'); await page.fill('#n-title', '<b>Fett</b>'); await page.click('#n-done'); await kurz();
  P.ok('Sonderzeichen im Titel werden als Text gezeigt', (await liste()).includes('<b>Fett</b>') && !(await page.$('#n-main b:has-text("Fett")')));

  // --- Bestand: Neuladen, eigener Ordner bleibt (benutzt), Sicherung enthält alles ---
  const stand = await gespeichert(page);
  await page.reload(); await page.waitForTimeout(300);
  P.ok('nach dem Neuladen unverändert', JSON.stringify((await gespeichert(page)).N) === JSON.stringify(stand.N));
  P.ok('benutzter eigener Ordner bleibt', Object.values(stand.N.folders).filter(Boolean).map(f => f.n).join() === 'Haushalt');
  await browser.close();

  // Sicherung einlesen bringt Aufgaben und Notizen mit; der Kalender zeigt Erledigtes
  const d = beispiel(), b = await oeffnen();
  await b.page.setInputFiles('#bk-file', { name: 'sicherung.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(alsSicherung(d))) });
  await b.page.waitForTimeout(500);
  const nach = (await gespeichert(b.page)).N || { tasks: {}, notes: {} };
  P.ok('Sicherung einlesen bringt Aufgaben und Notizen mit', Object.keys(nach.tasks).length === Object.keys(d.N.tasks).length && Object.keys(nach.notes).length === Object.keys(d.N.notes).length, Object.keys(nach.tasks).length + ' Aufgaben, ' + Object.keys(nach.notes).length + ' Notizen');
  await bereich(b.page, 'routinen'); await b.page.click('#r-subs [data-v="task"]'); await b.page.click('#n-main .wk .wd.now'); await b.page.waitForTimeout(200);
  P.enthaelt('Kalender „Aufgaben“ zeigt, was heute erledigt wurde', (await text(b.page, '#cs-title')) + ' ' + (await text(b.page, '#csheet')), ['Aufgaben', 'Betreuer wegen Termin schreiben']);
  await blaetterZu(b.page);
  await b.browser.close();
  await P.ende(null, fehler.concat(b.fehler));
});
