// Aufgaben und Notizen im Bereich Routinen: Aufgaben anlegen, abhaken, Abschnitte, Ordner, wiederkehrend; Notizen als schnelle Aufnahme (Abhaken löscht), Suche, Rückgängig, Sicherung.
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
  // Den Schnell-Knopf „Aufgabe“ gibt es seit v56 nicht mehr; eine neue Aufgabe aus dem Planer erscheint trotzdem sofort auf Heute
  await bereich(page, 'routinen'); await page.click('#add'); await page.fill('#a-title', 'Schnell notiert'); await chip('#a-due', 'Heute'); await page.click('#a-save'); await kurz();
  await bereich(page, 'heute');
  P.enthaelt('neue Aufgabe für heute steht auf Heute', await text(page, '#v-heute'), ['Aufgaben2 offen', 'Schnell notiert']);

  // --- Notizen: schnelle Aufnahme. Nur ein Textfeld, jede Notiz mit Kreis, Abhaken löscht sie ---
  const roh = () => page.evaluate(() => localStorage.getItem('takt.v1'));
  const hinweis = () => page.evaluate(() => { const t = document.querySelector('#toast'); return t.hidden || !t.getClientRects().length ? '' : t.innerText.replace(/\s+/g, ' ').trim(); });
  const sichtbar = async (...ids) => { for (const id of ids) if (!(await page.isVisible(id))) return false; return true; };
  await bereich(page, 'routinen'); await sub('note');
  P.enthaelt('leerer Zustand', await liste(), ['Noch keine Notiz']);
  await bereich(page, 'heute'); await page.click('#v-heute [data-h="q"][data-v="notiz"]');
  P.ok('„+ Notiz“ auf Heute: nur das Textfeld, der Cursor steht sofort darin', (await page.evaluate(() => document.activeElement.id)) === 'n-text' && !(await page.isVisible('#n-folder-fld')) && !(await page.isVisible('#n-del')) && !(await page.isVisible('#n-task')));
  await page.keyboard.type('Bib-Ausweis verlängern'); await page.keyboard.press('Enter'); await kurz();
  P.ok('Enter legt die Notiz an; das Blatt bleibt offen, leer und bereit für die nächste', (await page.evaluate(() => document.querySelector('#nsheet').open && document.activeElement.id === 'n-text' && document.querySelector('#n-text').value === '')) && (await notizen()).length === 1 && (await notizen())[0].x === 'Bib-Ausweis verlängern', JSON.stringify(await notizen()));
  P.ok('die Notiz steht schon dahinter auf Heute', (await text(page, '#v-heute')).includes('Bib-Ausweis verlängern'));
  await page.keyboard.type('Zweite gleich hinterher'); await page.keyboard.press('Enter'); await kurz();
  P.ok('die nächste Notiz ist eine eigene', (await notizen()).length === 2 && (await notizen()).some(n => n.x === 'Zweite gleich hinterher'));
  await page.keyboard.press('Enter'); await kurz();
  P.ok('Enter im leeren Feld schließt das Blatt', !(await page.evaluate(() => document.querySelector('#nsheet').open)) && (await notizen()).length === 2);
  await page.click('#v-heute .nrow:has-text("Zweite gleich hinterher") .tk'); await kurz();
  P.ok('sie steht auf Heute, mit Kreis zum Abhaken', (await text(page, '#v-heute')).includes('Notizen1') && !!(await page.$('#v-heute .nrow:has-text("Bib-Ausweis verlängern") .tk')));
  await page.click('#v-heute [data-h="q"][data-v="notiz"]'); await page.click('#n-done'); await kurz();
  P.ok('leere Notiz wird nicht angelegt', (await notizen()).length === 1);
  await page.click('#v-heute [data-h="q"][data-v="notiz"]'); await page.keyboard.type('Paket abholen'); await page.evaluate(() => document.querySelector('#nsheet').close()); await kurz();
  P.ok('auch beim bloßen Schließen ist die Notiz gespeichert', (await notizen()).some(n => n.x === 'Paket abholen'));

  // Abhaken löscht, „Rückgängig“ holt zurück
  const vorN = await roh();
  await page.click('#v-heute .nrow:has-text("Paket abholen") .tk'); await kurz();
  P.ok('Abhaken löscht die Notiz', (await notizen()).length === 1 && !(await text(page, '#v-heute')).includes('Paket abholen'));
  P.ok('Hinweis „Gelöscht · Rückgängig“ erscheint', (await hinweis()) === 'Gelöscht Rückgängig', await hinweis());
  await page.click('#toast button'); await kurz();
  P.ok('Rückgängig holt sie zurück', (await roh()) === vorN);

  // Im Bereich: neueste zuerst; vorhandene Notiz ändern, Ordner, „Als Aufgabe“
  await bereich(page, 'routinen');
  const l2 = await liste();
  P.ok('Bereich Notizen: beide, die neueste zuerst', l2.includes('Paket abholen') && l2.indexOf('Paket abholen') < l2.indexOf('Bib-Ausweis verlängern'), l2);
  P.ok('bei wenigen Notizen gibt es kein Suchfeld', !(await page.$('#n-q')));
  await page.click('#n-main [data-n="note"]:has-text("Paket abholen")');
  P.ok('vorhandene Notiz: Ordner, „Als Aufgabe“ und Löschen sind da', await sichtbar('#n-folder-fld', '#n-task', '#n-del'));
  await page.fill('#n-text', 'Paket bei der Post abholen'); await chip('#n-folder', 'Privat'); await page.click('#n-done'); await kurz();
  P.ok('Text und Ordner geändert', (await notizen()).some(n => n.x === 'Paket bei der Post abholen' && n.f === 'priv'));
  P.enthaelt('Zeile nennt Ordner und Tag', await liste(), ['Paket bei der Post abholen Privat · Heute']);
  await page.click('#n-main [data-n="note"]:has-text("Paket bei der Post")'); await page.click('#n-task'); await kurz();
  P.ok('„Als Aufgabe“: Aufgabe für heute im selben Ordner, die Notiz ist weg', (await aufgaben()).some(t => t.t === 'Paket bei der Post abholen' && t.d === tag(0) && t.f === 'priv') && (await notizen()).length === 1);
  await page.click('#n-main [data-n="note"]:has-text("Bib-Ausweis")'); await page.fill('#n-text', '   '); await page.click('#n-done'); await kurz();
  P.ok('geleerte Notiz ist weg', (await notizen()).length === 0);
  await page.click('#add'); await page.keyboard.type('<b>Fett</b>'); await page.keyboard.press('Enter'); await page.click('#n-done'); await kurz();
  P.ok('Plus im Bereich legt eine Notiz an; Sonderzeichen bleiben Text', (await liste()).includes('<b>Fett</b>') && !(await page.$('#n-main b:has-text("Fett")')));

  // Altbestand aus v49/v50: Titel wird erste Zeile, jede offene Zeile zum Abhaken eine eigene Notiz, erledigte Zeilen fallen weg
  await page.evaluate(() => { const o = JSON.parse(localStorage.getItem('takt.v1'));
    o.N.notes.alt = { t: 'Besprechung', x: 'Kapitel 2 kürzen.', f: 'prom', pin: true, c: 5, m: 6, items: [{ t: 'Erledigter Punkt', d: true }, { t: 'Offener Punkt', d: false }] };
    localStorage.setItem('takt.v1', JSON.stringify(o)); });
  await page.reload(); await page.waitForTimeout(300); await bereich(page, 'routinen'); await sub('note');
  const l3 = await liste();
  P.ok('alte Notiz mit Titel und Zeilen wird übernommen', l3.includes('Besprechung Kapitel 2 kürzen.') && l3.includes('Offener Punkt') && !l3.includes('Erledigter Punkt'), l3);
  await page.click('#n-main .nrow:has-text("Offener Punkt") .tk'); await kurz();
  P.ok('danach ist alles im neuen Aufbau gespeichert', (await notizen()).every(n => typeof n.x === 'string' && !('t' in n) && !('items' in n) && !('pin' in n)) && (await notizen()).length === 2, JSON.stringify(await notizen()));

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

  // --- Heute: Notizen stehen ganz oben, vor Routinen und Aufgaben ---
  await bereich(b.page, 'heute');
  const lagen = await b.page.evaluate(() => { const o = {}; document.querySelectorAll('#v-heute .sec').forEach(h => { o[h.firstChild.textContent.trim()] = Math.round(h.getBoundingClientRect().top); }); return o; });
  P.ok('auf Heute stehen die Notizen über Routinen und Aufgaben', lagen.Notizen < lagen.Routinen && lagen.Routinen < lagen.Aufgaben, JSON.stringify(lagen));
  await bereich(b.page, 'routinen');

  // --- Wiederkehrende Aufgaben ---
  const q = b.page, warte = () => q.waitForTimeout(200), wahl = (box, name) => q.click(box + ' .chip:has-text("' + name + '")');
  const alle = async titel => Object.values((await gespeichert(q)).N.tasks).filter(t => t && t.t === titel);
  const anlegen = async (titel, faellig, wdh, datum) => { await q.click('#add'); await q.fill('#a-title', titel); await wahl('#a-due', faellig); if (datum) await q.fill('#a-date', datum); await wahl('#a-rep', wdh); await q.click('#a-save'); await warte(); };
  const haken = async titel => { await q.click('#n-main .trow:has-text("' + titel + '") .tk'); await warte(); };
  await anlegen('Blumen gießen', 'Heute', 'Wöchentlich');
  P.enthaelt('Zeile nennt die Wiederholung', await q.innerText('#n-main .trow:has-text("Blumen gießen")'), ['wöchentlich']);
  await haken('Blumen gießen');
  let w = await alle('Blumen gießen');
  // heute abgehakt → dieselbe Aufgabe in sieben Tagen wieder
  P.ok('wöchentlich: abgehakt bleibt stehen, die nächste ist in 7 Tagen fällig', w.length === 2 && w.some(t => t.done && t.d === tag(0)) && w.some(t => !t.done && t.d === tag(-7) && t.r === 'week'), JSON.stringify(w));
  await q.click('#n-main .trow.done:has-text("Blumen gießen") .tk'); await warte();
  w = await alle('Blumen gießen');
  P.ok('Haken wieder weg: die nächste verschwindet, nichts ist doppelt', w.length === 1 && !w[0].done && w[0].d === tag(0), JSON.stringify(w));
  await anlegen('Tabletten', 'Anderer Tag', 'Täglich', tag(2));
  await haken('Tabletten');
  w = await alle('Tabletten');
  // seit vorgestern liegen geblieben und heute erledigt → als Nächstes morgen, nicht gestern
  P.ok('täglich, liegen geblieben: die nächste ist morgen fällig', w.length === 2 && w.some(t => !t.done && t.d === tag(-1)), JSON.stringify(w));
  await anlegen('Miete prüfen', 'Heute', 'Monatlich');
  await haken('Miete prüfen');
  w = await alle('Miete prüfen');
  // gleicher Tag im nächsten Monat; gibt es ihn dort nicht (z. B. der 31.), der letzte Tag des Monats
  const h = new Date(), ziel = new Date(h.getFullYear(), h.getMonth() + 1, Math.min(h.getDate(), new Date(h.getFullYear(), h.getMonth() + 2, 0).getDate()), 12);
  const zielTag = ziel.getFullYear() + '-' + String(ziel.getMonth() + 1).padStart(2, '0') + '-' + String(ziel.getDate()).padStart(2, '0');
  P.ok('monatlich: die nächste am selben Tag im nächsten Monat (' + zielTag + ')', w.some(t => !t.done && t.d === zielTag), JSON.stringify(w));
  await q.click('#add'); await wahl('#a-due', 'Ohne Datum');
  P.ok('ohne Datum gibt es kein „Wiederholen“', !(await q.isVisible('#a-rep-fld')));
  await q.click('#as-close');

  // --- Suche in den Notizen (das Feld erscheint ab sechs Notizen) ---
  await q.click('#r-subs [data-v="note"]'); await warte();
  const treffer = () => text(q, '#n-list');
  await q.click('#n-q'); await q.keyboard.type('müller');
  P.ok('Suche: nur die passende Notiz', (await treffer()).includes('Vergleich mit Müller 2021') && !(await treffer()).includes('Gliederung'), await treffer());
  P.ok('beim Tippen bleibt der Cursor im Suchfeld', (await q.evaluate(() => document.activeElement.id)) === 'n-q');
  await q.fill('#n-q', 'gibtesnicht');
  P.enthaelt('kein Treffer', await treffer(), ['Keine Notiz gefunden.']);
  await q.fill('#n-q', '');
  P.ok('leeres Suchfeld zeigt wieder alle sieben', (await q.$$eval('#n-list [data-n="note"]', a => a.length)) === 7);
  await q.click('#n-list .nrow:has-text("Druckerpapier") .tk'); await warte();
  P.ok('Abhaken in der Liste löscht die Notiz', (await q.$$eval('#n-list [data-n="note"]', a => a.length)) === 6);
  await b.browser.close();
  await P.ende(null, fehler.concat(b.fehler));
});
