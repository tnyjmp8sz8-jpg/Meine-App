// Notizen im Planer: schnelle Aufnahme (Abhaken löscht), Suche, Rückgängig, Sicherung. Ordner gibt es seit v77 nicht mehr (eine Liste); alte Ordner bleiben nur gespeichert. Aufgaben gibt es seit v74 nicht mehr: Geprüft wird, dass nichts mehr von ihnen zu sehen ist und Gespeichertes erhalten bleibt.
const { oeffnen, text, bereich, gespeichert, pruefer, lauf } = require('./lib');
const { beispiel, alsSicherung } = require('./daten');

lauf(async () => {
  const P = pruefer('Notizen'), { browser, page, fehler } = await oeffnen();
  const sub = v => page.click('#r-subs [data-v="' + v + '"]');
  const kurz = () => page.waitForTimeout(200);
  const liste = () => text(page, '#n-main');
  const aufgaben = async () => Object.values((await gespeichert(page)).N.tasks).filter(Boolean);
  const notizen = async () => Object.values((await gespeichert(page)).N.notes).filter(Boolean);
  // --- Aufgaben (seit v74) und Routinen (seit v75) sind ausgebaut: Der Planer hat drei Teile und öffnet mit den Notizen ---
  await bereich(page, 'routinen');
  P.ok('Planer hat drei Teile, gewählt ist „Notizen“', (await page.$$eval('#r-subs button', l => l.map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join())) === 'Notizen*,Arbeit,Uni');

  // --- Notizen: schnelle Aufnahme. Nur ein Textfeld, jede Notiz mit Kreis, Abhaken löscht sie ---
  const roh = () => page.evaluate(() => localStorage.getItem('takt.v1'));
  const hinweis = () => page.evaluate(() => { const t = document.querySelector('#toast'); return t.hidden || !t.getClientRects().length ? '' : t.innerText.replace(/\s+/g, ' ').trim(); });
  const sichtbar = async (...ids) => { for (const id of ids) if (!(await page.isVisible(id))) return false; return true; };
  await bereich(page, 'routinen'); await sub('note');
  P.enthaelt('leerer Zustand', await liste(), ['Noch keine Notiz']);
  await bereich(page, 'heute'); await page.click('#v-heute [data-h="q"][data-v="notiz"]');
  P.ok('„+ Notiz“ auf Heute: nur das Textfeld, der Cursor steht sofort darin', (await page.evaluate(() => document.activeElement.id)) === 'n-text' && !(await page.$('#n-folder-fld')) && !(await page.isVisible('#n-del')) && !(await page.isVisible('#n-task')));
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

  // Im Bereich: neueste zuerst; vorhandene Notiz ändern. Das Blatt hat nur den Text, „Fertig“ und „Notiz löschen“ (Ordner seit v77 weg, „Als Aufgabe“ seit v74)
  await bereich(page, 'routinen');
  const l2 = await liste();
  P.ok('Bereich Notizen: beide, die neueste zuerst', l2.includes('Paket abholen') && l2.indexOf('Paket abholen') < l2.indexOf('Bib-Ausweis verlängern'), l2);
  P.ok('bei wenigen Notizen gibt es kein Suchfeld und keine Reihe mit Ordnern', !(await page.$('#n-q')) && !(await page.$('#n-main .chips')) && !(await page.$('#n-main [data-n="folder"]')));
  await page.click('#n-main [data-n="note"]:has-text("Paket abholen")');
  P.ok('vorhandene Notiz: Löschen ist da; Ordner und „Als Aufgabe“ gibt es nicht', (await sichtbar('#n-text', '#n-done', '#n-del')) && !(await page.$('#n-folder-fld')) && !(await page.$('#nsheet .chips')) && !(await page.$('#n-task')));
  await page.fill('#n-text', 'Paket bei der Post abholen'); await page.click('#n-done'); await kurz();
  P.ok('Text geändert, weiter zwei Notizen', (await notizen()).length === 2 && (await notizen()).some(n => n.x === 'Paket bei der Post abholen'));
  P.enthaelt('Zeile nennt nur den Tag', await liste(), ['Paket bei der Post abholen Heute']);
  await page.click('#n-main [data-n="note"]:has-text("Bib-Ausweis")'); await page.fill('#n-text', '   '); await page.click('#n-done'); await kurz();
  P.ok('geleerte Notiz ist weg', (await notizen()).length === 1);
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
  P.ok('danach ist alles im neuen Aufbau gespeichert', (await notizen()).every(n => typeof n.x === 'string' && !('t' in n) && !('items' in n) && !('pin' in n)) && (await notizen()).length === 3, JSON.stringify(await notizen()));

  // --- Bestand: Neuladen ändert nichts; der Ordner der alten Notiz (f: 'prom') bleibt gespeichert, auch wenn er nirgends mehr steht ---
  const stand = await gespeichert(page);
  await page.reload(); await page.waitForTimeout(300);
  P.ok('nach dem Neuladen unverändert', JSON.stringify((await gespeichert(page)).N) === JSON.stringify(stand.N));
  P.ok('alter Ordner bleibt an der Notiz gespeichert, zu sehen ist er nicht', Object.values(stand.N.notes).some(n => n && n.x.startsWith('Besprechung') && n.f === 'prom') && !(await liste()).includes('Promotion'), await liste());

  // --- Sicherung mit eigenem Ordner, dessen Kennung Anführungszeichen und HTML trägt: Die Notiz kommt an, nichts wird eingeschleust (Ordner werden nirgends mehr gezeichnet), gespeichert bleibt alles ---
  const fid = '"><b id="inj">';
  await page.setInputFiles('#bk-file', { name: 'fremd.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'takt', v: 1, N: { folders: { [fid]: { n: 'Fremd' } }, tasks: {}, notes: { fremd: { x: 'Notiz im fremden Ordner', f: fid, c: 7, m: 8 } } } })) });
  await page.waitForTimeout(400); await bereich(page, 'routinen'); await sub('note');
  P.ok('Notiz aus der Sicherung steht in der einen Liste, nichts eingeschleust, kein Ordner zu sehen', (await liste()).includes('Notiz im fremden Ordner') && (await liste()).includes('Besprechung') && !(await page.$('#inj')) && !(await liste()).includes('Fremd'), await liste());
  await page.click('#n-main [data-n="note"]:has-text("Notiz im fremden Ordner")'); await page.fill('#n-text', 'Notiz im fremden Ordner, geändert'); await page.click('#n-done'); await kurz();
  const nachF = (await gespeichert(page)).N;
  P.ok('nach dem Ändern trägt die Notiz ihren Ordner weiter, und der Ordner selbst steht noch im Speicher', Object.values(nachF.notes).some(n => n && n.x === 'Notiz im fremden Ordner, geändert' && n.f === fid) && !!nachF.folders[fid] && !(await page.$('#inj')));

  await browser.close();

  // Sicherung einlesen bringt die Notizen mit. Aufgaben aus einer alten Sicherung werden mitgespeichert, aber nirgends gezeigt
  const d = beispiel(), b = await oeffnen();
  await b.page.setInputFiles('#bk-file', { name: 'sicherung.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(alsSicherung(d))) });
  await b.page.waitForTimeout(500);
  const nach = (await gespeichert(b.page)).N || { tasks: {}, notes: {} };
  P.ok('Sicherung einlesen bringt Notizen mit und behält alte Aufgaben im Speicher', Object.keys(nach.tasks).length === Object.keys(d.N.tasks).length && Object.keys(nach.notes).length === Object.keys(d.N.notes).length, Object.keys(nach.tasks).length + ' Aufgaben, ' + Object.keys(nach.notes).length + ' Notizen');
  // --- Heute: Notizen stehen ganz oben; Routinen und Aufgaben stehen dort nicht mehr, auch wenn welche gespeichert sind (die Beispieldaten haben drei Routinen) ---
  await bereich(b.page, 'heute');
  const lagen = await b.page.evaluate(() => { const o = {}; document.querySelectorAll('#v-heute .sec').forEach(h => { o[h.firstChild.textContent.trim()] = Math.round(h.getBoundingClientRect().top); }); return o; });
  P.ok('auf Heute gibt es den Abschnitt „Notizen“, aber weder „Routinen“ noch „Aufgaben“', 'Notizen' in lagen && !('Routinen' in lagen) && !('Aufgaben' in lagen) && !(await b.page.$('#v-heute .rows .row')) && !(await b.page.$('#v-heute [data-n="tog"]')), JSON.stringify(lagen));
  await bereich(b.page, 'routinen');

  const q = b.page, warte = () => q.waitForTimeout(200);

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
  // Nach diesem Speichern stehen die alten Aufgaben noch alle im Speicher (und damit in jeder Sicherung): Es geht nichts verloren.
  P.ok('gespeicherte Aufgaben bleiben beim Speichern erhalten', Object.values((await gespeichert(q)).N.tasks).filter(Boolean).length === Object.values(d.N.tasks).filter(Boolean).length && Object.values(d.N.tasks).filter(Boolean).length > 0);
  // Dasselbe für die Routinen (seit v75 ausgebaut): Die drei Routinen der Beispieldaten und jeder Eintrag ihres Protokolls stehen nach dem Speichern noch da, ein Timer läuft nicht mehr.
  const gs = await gespeichert(q), tage = o => Object.values(o || {}).reduce((n, y) => n + Object.values(y).reduce((m, t) => m + Object.keys(t).length, 0), 0);   // Einträge im Protokoll (Routine × Tag); ein Tag ohne Eintrag zählt nicht
  P.ok('gespeicherte Routinen und ihr Protokoll bleiben beim Speichern erhalten', gs.S.routines.length === 3 && d.S.routines.length === 3 && tage(gs.LY) === tage(d.LY) && tage(d.LY) > 0 && gs.S.running === null, gs.S.routines.length + ' Routinen, ' + tage(gs.LY) + ' von ' + tage(d.LY) + ' Einträgen');
  await bereich(q, 'heute'); await q.click('#v-heute [data-h="mode"][data-v="week"]'); await warte();
  P.ok('Woche auf Heute: keine Zeile „Routinen“, kein Zusammenhang mit Routinen', !(await text(q, '#v-heute')).includes('Routinen'), await text(q, '#v-heute'));
  await q.click('#v-heute [data-h="mode"][data-v="day"]'); await q.click('#v-heute .wk .wd.now'); await warte();
  P.ok('Kalender „Übersicht“: keine Routinen, keine Legende', !(await text(q, '#csheet')).includes('Routinen') && !(await q.$('#cs-leg')), await text(q, '#csheet'));
  await q.evaluate(() => document.querySelector('#csheet').close());
  await b.browser.close();

  // --- Erinnerung an die Sicherung: Ohne Sicherung zählt der älteste Eintrag, auch wenn es nur Notizen gibt (Tag des Anlegens). Aufgaben zählen nicht mehr: Sie sind nicht zu sehen. ---
  const mittag = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d.getTime(); };
  const e = await oeffnen(), erinnerung = () => text(e.page, '#v-heute .remind[data-h="export"]');
  const nur = async N => { await e.page.evaluate(n => localStorage.setItem('takt.v1', JSON.stringify({ S: { routines: [], running: null }, LY: {}, N: n })), N); await e.page.reload(); await e.page.waitForTimeout(300); };
  // eine Notiz von vor 6 Tagen: noch keine 7 Tage alt
  await nur({ folders: {}, tasks: {}, notes: { a: { x: 'Sechs Tage alt', f: '', c: mittag(6), m: mittag(6) } } });
  P.ok('nur eine Notiz, 6 Tage alt: noch keine Erinnerung', (await erinnerung()) === '', await erinnerung());
  // eine Notiz von vor 7 Tagen: fällig
  await nur({ folders: {}, tasks: {}, notes: { a: { x: 'Sieben Tage alt', f: '', c: mittag(7), m: mittag(1) } } });
  P.enthaelt('nur eine Notiz, 7 Tage alt: Erinnerung', await erinnerung(), ['Noch keine Sicherung gespeichert', 'Jetzt sichern']);
  // eine Aufgabe, vor 9 Tagen angelegt und gestern erledigt: keine Erinnerung, die App wirkt leer
  await nur({ folders: {}, notes: {}, tasks: { a: { t: 'Neun Tage alt', f: '', d: null, done: mittag(1), c: mittag(9), n: '' } } });
  P.ok('nur eine alte Aufgabe im Speicher: keine Erinnerung', (await erinnerung()) === '', await erinnerung());
  await e.browser.close();
  await P.ende(null, fehler.concat(b.fehler, e.fehler));
});
