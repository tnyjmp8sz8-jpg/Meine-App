// Notizen im Planer: schnelle Aufnahme (Abhaken löscht), Ordner, Suche, Rückgängig, Sicherung. Aufgaben gibt es seit v74 nicht mehr: Geprüft wird, dass nichts mehr von ihnen zu sehen ist und Gespeichertes erhalten bleibt.
const { oeffnen, text, bereich, gespeichert, pruefer, lauf } = require('./lib');
const { beispiel, alsSicherung } = require('./daten');

lauf(async () => {
  const P = pruefer('Notizen'), { browser, page, fehler } = await oeffnen();
  const sub = v => page.click('#r-subs [data-v="' + v + '"]');
  const kurz = () => page.waitForTimeout(200);
  const chip = (box, name) => page.click(box + ' .chip:has-text("' + name + '")');
  const liste = () => text(page, '#n-main');
  const aufgaben = async () => Object.values((await gespeichert(page)).N.tasks).filter(Boolean);
  const notizen = async () => Object.values((await gespeichert(page)).N.notes).filter(Boolean);
  // --- Aufgaben sind seit v74 ausgebaut: kein Umschalter im Planer, vier Teile ---
  await bereich(page, 'routinen');
  P.ok('Planer hat vier Teile, „Aufgaben“ ist nicht dabei', (await page.$$eval('#r-subs button', l => l.map(b => b.textContent).join())) === 'Routinen,Notizen,Arbeit,Uni');

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
  P.ok('vorhandene Notiz: Ordner und Löschen sind da, „Als Aufgabe“ gibt es nicht mehr', (await sichtbar('#n-folder-fld', '#n-del')) && !(await page.$('#n-task')));
  await page.fill('#n-text', 'Paket bei der Post abholen'); await chip('#n-folder', 'Privat'); await page.click('#n-done'); await kurz();
  P.ok('Text und Ordner geändert', (await notizen()).some(n => n.x === 'Paket bei der Post abholen' && n.f === 'priv'));
  P.enthaelt('Zeile nennt Ordner und Tag', await liste(), ['Paket bei der Post abholen Privat · Heute']);
  // eigener Ordner beim Ändern einer Notiz: „+ Ordner“ legt ihn an und wählt ihn
  await page.click('#n-main [data-n="note"]:has-text("Paket bei der Post")'); await chip('#n-folder', '+ Ordner'); await page.fill('#n-fnew', 'Haushalt'); await page.click('#n-fnew-add');
  P.ok('eigener Ordner ist angelegt und gewählt', (await text(page, '#n-folder [aria-pressed="true"]')) === 'Haushalt');
  await page.click('#n-done'); await kurz();
  P.ok('die Notiz liegt im eigenen Ordner', (await notizen()).length === 2 && (await liste()).includes('Paket bei der Post abholen Haushalt'), await liste());
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

  // --- Bestand: Neuladen, eigener Ordner bleibt (benutzt), Sicherung enthält alles ---
  const stand = await gespeichert(page);
  await page.reload(); await page.waitForTimeout(300);
  P.ok('nach dem Neuladen unverändert', JSON.stringify((await gespeichert(page)).N) === JSON.stringify(stand.N));
  P.ok('benutzter eigener Ordner bleibt', Object.values(stand.N.folders).filter(Boolean).map(f => f.n).join() === 'Haushalt');

  // --- Ordner mit fremder Kennung aus einer veränderten Sicherungsdatei: Anführungszeichen und HTML in der Kennung schleusen nichts ein, der Ordner bleibt benutzbar ---
  const fid = '"><b id="inj">';
  await page.setInputFiles('#bk-file', { name: 'fremd.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'takt', v: 1, N: { folders: { [fid]: { n: 'Fremd' } }, tasks: {}, notes: { fremd: { x: 'Notiz im fremden Ordner', f: fid, c: 7, m: 8 } } } })) });
  await page.waitForTimeout(400); await bereich(page, 'routinen'); await sub('note');
  P.ok('Ordner-Leiste: der Ordner ist da, nichts eingeschleust', (await text(page, '#n-main [data-n="folder"]')).includes('Fremd') && !(await page.$('#inj')), await text(page, '#n-main .chips'));
  await page.click('#n-main [data-n="folder"]:has-text("Fremd")'); await kurz();
  P.ok('der fremde Ordner filtert wie jeder andere', (await liste()).includes('Notiz im fremden Ordner') && !(await liste()).includes('Besprechung'), await liste());
  await page.click('#n-main [data-n="note"]:has-text("Notiz im fremden Ordner")');
  P.ok('Blatt: der Ordner ist gewählt, nichts eingeschleust', (await text(page, '#n-folder [aria-pressed="true"]')) === 'Fremd' && !(await page.$('#inj')));
  await chip('#n-folder', 'Privat'); await chip('#n-folder', 'Fremd'); await page.click('#n-done'); await kurz();
  P.ok('umgestellt und zurück: die Notiz liegt wieder im fremden Ordner', (await notizen()).some(n => n.x === 'Notiz im fremden Ordner' && n.f === fid));

  await browser.close();

  // Sicherung einlesen bringt die Notizen mit. Aufgaben aus einer alten Sicherung werden mitgespeichert, aber nirgends gezeigt
  const d = beispiel(), b = await oeffnen();
  await b.page.setInputFiles('#bk-file', { name: 'sicherung.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(alsSicherung(d))) });
  await b.page.waitForTimeout(500);
  const nach = (await gespeichert(b.page)).N || { tasks: {}, notes: {} };
  P.ok('Sicherung einlesen bringt Notizen mit und behält alte Aufgaben im Speicher', Object.keys(nach.tasks).length === Object.keys(d.N.tasks).length && Object.keys(nach.notes).length === Object.keys(d.N.notes).length, Object.keys(nach.tasks).length + ' Aufgaben, ' + Object.keys(nach.notes).length + ' Notizen');
  // --- Heute: Notizen stehen ganz oben, vor den Routinen; Aufgaben stehen dort nicht mehr, auch wenn welche gespeichert sind ---
  await bereich(b.page, 'heute');
  const lagen = await b.page.evaluate(() => { const o = {}; document.querySelectorAll('#v-heute .sec').forEach(h => { o[h.firstChild.textContent.trim()] = Math.round(h.getBoundingClientRect().top); }); return o; });
  P.ok('auf Heute stehen die Notizen über den Routinen, einen Abschnitt „Aufgaben“ gibt es nicht', lagen.Notizen < lagen.Routinen && !('Aufgaben' in lagen) && !(await b.page.$('#v-heute [data-n="tog"]')), JSON.stringify(lagen));
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
