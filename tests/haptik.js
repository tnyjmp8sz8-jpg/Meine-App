// Haptik und Druck (v81, iPhone-App ab 0.8): Die App schickt der iPhone-Hülle, was passiert ist („haptik“ mit w = wahl, leicht, mittel, erfolg, fehler).
// Dazu: Blätter fahren beim Schließen kurz weg (nur ohne „Bewegung reduzieren“), und jede antippbare Fläche antwortet auf den Finger.
// Die Uhr steht auf dem 15. des laufenden Monats, 12 Uhr: So hängt nichts vom Tag ab, an dem die Reihe läuft.
const { monat, pad, oeffnen, bereich, gespeichert, pruefer, lauf } = require('./lib');

const huelle = () => { window.__post = []; window.webkit = { messageHandlers: { track: { postMessage: o => window.__post.push(JSON.parse(JSON.stringify(o))) } } }; };
const M = monat(0), am = t => M + '-' + pad(t), UHR = new Date(+M.slice(0, 4), +M.slice(5) - 1, 15, 12);
/* Daten: fünf Gewichte (Graph und Einträge), zwei Läufe (damit Cardio den Umschalter Monat/Jahr zeigt), zwei Notizen, ein Plan mit einer Übung */
const daten = () => {
  const W = { goal: 85, goalFrom: 79, entries: {} }; [[3, 80], [6, 79.6], [9, 79.8], [12, 79.2], [14, 79]].forEach(e => { W.entries[am(e[0])] = e[1]; });
  return { S: { routines: [], running: null }, LY: {}, W, MF: {}, MY: {}, T: { runs: { r1: { d: am(5), m: 5000, s: 1500, hr: 150 }, r2: { d: am(10), m: 6000, s: 1860, hr: 152 } } },
    K: { ex: { a: { n: 'Rudern' } }, log: {}, plans: { p: { n: 'Torso', items: [{ id: 'a', sets: 2 }] } }, meta: {}, live: null },
    N: { folders: {}, tasks: {}, notes: { n1: { x: 'Erste Notiz', f: '', c: UHR.getTime() - 5e3, m: UHR.getTime() - 5e3 }, n2: { x: 'Zweite Notiz', f: '', c: UHR.getTime() - 4e3, m: UHR.getTime() - 4e3 } } } };
};

lauf(async () => {
  const P = pruefer('Haptik und Druck');

  // --- Ohne iPhone-Hülle (Browser, Home-Bildschirm): Nichts geht hinaus, nichts bricht ---
  let o = await oeffnen({ daten: daten(), uhr: UHR });
  let { browser, page, fehler } = o;
  await bereich(page, 'gewicht'); await page.click('#v-gewicht [data-fold="eintraege"]'); await page.waitForTimeout(100);
  P.ok('ohne Hülle: Bereich wechseln und Klappzeile gehen wie immer', await page.evaluate(() => !document.querySelector('#v-gewicht').hidden && !window.webkit));
  P.ok('ohne Hülle: kein Fehler', !fehler.length, fehler.join(' · '));
  await browser.close();

  // --- Mit Hülle: Welche Handlung welchen Impuls schickt ---
  o = await oeffnen({ daten: daten(), uhr: UHR, skript: huelle });
  ({ browser, page, fehler } = o);
  const kurz = () => page.waitForTimeout(120);
  /* Alle Impulse seit dem letzten Aufruf, als Liste ihrer Art; danach beginnt die Sammlung neu. Vorher 120 ms warten: Der Impuls nach dem Löschen kommt einen Wimpernschlag später. */
  const hap = async () => { await kurz(); return page.evaluate(() => { const a = window.__post.filter(m => m.art === 'haptik').map(m => m.w); window.__post = []; return a.join(','); }); };
  const soll = async (label, erwartet) => { const ist = await hap(); P.ok(label, ist === erwartet, 'ist: „' + ist + '“, soll: „' + erwartet + '“'); };
  await hap();

  await bereich(page, 'gewicht');
  await soll('Bereich wechseln: „wahl“', 'wahl');
  await bereich(page, 'gewicht');
  await soll('derselbe Bereich noch einmal: nichts', '');
  await page.click('#v-gewicht [data-fold="eintraege"]');
  await soll('Klappzeile: „wahl“', 'wahl');
  // Ein Blatt öffnen und schließen bleibt still (wie in iOS)
  await page.click('#v-gewicht [data-w="edit"]'); await kurz();
  await page.click('#ws-close');
  await soll('Blatt öffnen und mit dem Kreuz schließen: nichts', '');
  // Speichern: 79,4 kg am jüngsten Eintrag
  await page.click('#v-gewicht [data-w="edit"]'); await kurz(); await page.fill('#w-val', '79,4'); await page.click('#w-save');
  await soll('Gewicht gespeichert: „erfolg“', 'erfolg');
  // Eingabe passt nicht: 5 kg liegt unter 20 kg, das Blatt bleibt mit Meldung offen
  await page.click('#v-gewicht [data-w="edit"]'); await kurz(); await page.fill('#w-val', '5'); await page.click('#w-save');
  P.ok('5 kg: Blatt bleibt offen, Meldung steht da', await page.evaluate(() => document.querySelector('#wdlg, dialog[open]').open && !document.querySelector('#w-err').hidden));
  await soll('Eingabe passt nicht: „fehler“', 'fehler');
  // Löschen (im Gewicht ohne Nachfrage, dafür mit „Rückgängig“): ein kräftigerer Impuls
  const vorher = Object.values((await gespeichert(page)).W.entries).filter(v => typeof v === 'number').length;
  await page.click('#w-del');
  await soll('Eintrag gelöscht: „mittel“', 'mittel');
  P.ok('ein Eintrag weniger (5 − 1 = 4)', vorher === 5 && Object.values((await gespeichert(page)).W.entries).filter(v => typeof v === 'number').length === 4);
  await page.click('#toast button');
  await soll('„Rückgängig“: nichts', '');

  // Graph ablesen: Jeder neue Punkt tickt einmal, derselbe Punkt nicht noch einmal
  const g = await page.evaluate(() => { const s = document.querySelector('#v-gewicht svg.scrub'), r = s.getBoundingClientRect(), p = JSON.parse(s.dataset.pts), f = r.width / s.viewBox.baseVal.width;
    return { y: r.top + r.height / 2, x: p.map(q => r.left + q[0] * f) }; });
  await page.mouse.move(g.x[0] + 1, g.y); await page.mouse.down();
  await soll('Finger auf den ersten Punkt: „wahl“', 'wahl');
  await page.mouse.move(g.x[0] + 3, g.y);
  await soll('ein Stück weiter, noch derselbe Punkt: nichts', '');
  await page.mouse.move(g.x[1], g.y);
  await soll('nächster Punkt: „wahl“', 'wahl');
  await page.mouse.up();

  // Monat/Jahr und Pfeile (Training)
  await bereich(page, 'training'); await hap();
  await page.click('#v-training .seg2.mini button[aria-pressed="false"]');
  await soll('Umschalter „Jahr“: „wahl“', 'wahl');
  await page.click('#v-training .seg2.mini button[aria-pressed="true"]');
  await soll('schon gewählte Seite des Umschalters: nichts', '');
  await page.click('#v-training .mnav [data-m="prev"]');
  await soll('Pfeil zum Jahr davor: „wahl“', 'wahl');

  // Notiz abhaken: ein leichter Impuls, nicht zusätzlich der fürs Löschen
  await bereich(page, 'routinen'); await hap();
  await page.click('#v-routinen .tk');
  await soll('Notiz abhaken: nur „leicht“', 'leicht');

  // Gym: Plan starten und Satz abhaken
  await bereich(page, 'training'); await hap();
  await page.click('#v-training [data-t="sub"][data-v="kraft"]');
  await soll('Umschalter „Gym“: „wahl“', 'wahl');
  // Pläne stehen in der Monatsansicht: zurück von „Jahr“ auf „Monat“
  await page.click('#v-training .seg2.mini button[aria-pressed="false"]'); await hap();
  await page.click('#v-training [data-k="start"]');
  await soll('Plan starten: „mittel“', 'mittel');
  await page.click('#l-items .chk');
  await soll('Satz abhaken: „leicht“', 'leicht');
  P.ok('mit Hülle: kein Fehler', !fehler.length, fehler.join(' · '));
  await browser.close();

  // --- Blatt schließen mit Bewegung: Es fährt weg und ist erst danach zu ---
  o = await oeffnen({ daten: daten(), uhr: UHR, skript: huelle, bewegung: true });
  ({ browser, page, fehler } = o);
  const blatt = () => page.evaluate(() => { const d = document.querySelector('#v-gewicht') && [...document.querySelectorAll('dialog')].find(x => x.contains(document.querySelector('#w-val'))); return { offen: d.open, zu: d.classList.contains('zu'), name: getComputedStyle(d).animationName }; });
  await bereich(page, 'gewicht'); await page.waitForTimeout(400);
  await page.click('#v-gewicht [data-fold="eintraege"]'); await page.waitForTimeout(100);
  await page.click('#v-gewicht [data-w="edit"]'); await page.waitForTimeout(350);
  await page.click('#ws-close');
  let b = await blatt();
  P.ok('gleich nach dem Kreuz: noch offen, fährt weg (Klasse „zu“, Bewegung „sheetZu“)', b.offen && b.zu && b.name === 'sheetZu', JSON.stringify(b));
  await page.waitForTimeout(300);
  b = await blatt();
  P.ok('0,3 s später: zu, Klasse wieder weg', !b.offen && !b.zu, JSON.stringify(b));
  // Wieder öffnen geht, auch mitten im Wegfahren bliebe es offen
  await page.click('#v-gewicht [data-w="edit"]'); await page.waitForTimeout(350);
  b = await blatt();
  P.ok('wieder geöffnet: offen ohne „zu“', b.offen && !b.zu, JSON.stringify(b));
  // Speichern: „erfolg“ kommt sofort, obwohl das Blatt noch wegfährt; die Liste dahinter zeigt den neuen Wert sofort
  await page.evaluate(() => { window.__post = []; });
  await page.fill('#w-val', '79,3'); await page.click('#w-save');
  const gleich = await page.evaluate(() => ({ h: window.__post.filter(m => m.art === 'haptik').map(m => m.w).join(','), liste: document.querySelector('#v-gewicht [data-w="edit"]').innerText }));
  P.ok('Speichern: „erfolg“ sofort, der Eintrag dahinter zeigt schon 79,3', gleich.h === 'erfolg' && gleich.liste.includes('79,3'), JSON.stringify(gleich));
  await page.waitForTimeout(300);
  // Löschen: Das Blatt fährt weg, der Hinweis „Gelöscht · Rückgängig“ liegt nicht im wegfahrenden Blatt, sondern auf der Seite
  await page.click('#v-gewicht [data-w="edit"]'); await page.waitForTimeout(350);
  await page.click('#w-del'); await page.waitForTimeout(60);
  const hin = await page.evaluate(() => { const t = document.querySelector('#toast'); return { da: !t.hidden, ort: t.parentElement.tagName }; });
  P.ok('Hinweis nach dem Löschen liegt auf der Seite (nicht im Blatt, das gerade wegfährt)', hin.da && hin.ort === 'BODY', JSON.stringify(hin));
  await page.waitForTimeout(300);
  await page.click('#toast button'); await page.waitForTimeout(100);
  P.ok('„Rückgängig“ holt den Eintrag zurück (wieder 5)', Object.values((await gespeichert(page)).W.entries).filter(v => typeof v === 'number').length === 5);

  // --- Druck: Zeilen dunkeln ab, das Kreuz wird blasser (gedrückt gehalten, im Test mit der Maus) ---
  const zeile = await page.$('#v-gewicht [data-fold="eintraege"]'), kasten = await zeile.boundingBox();
  const farbe = () => page.evaluate(() => getComputedStyle(document.querySelector('#v-gewicht [data-fold="eintraege"]').parentElement).backgroundColor);
  const ruhig = await farbe();
  await page.mouse.move(kasten.x + 40, kasten.y + kasten.height / 2); await page.mouse.down(); await page.waitForTimeout(150);
  const gedrueckt = await farbe();
  await page.mouse.up(); await page.waitForTimeout(250);
  P.ok('Klappzeile gedrückt: Fläche wird dunkler, losgelassen wieder wie vorher', gedrueckt !== ruhig && /rgba?\(/.test(gedrueckt), ruhig + ' → ' + gedrueckt);
  // Notiz: Ein Druck auf den Text dunkelt die ganze Zeile ab, ein Druck auf den Kreis nicht (er antwortet nur selbst)
  await bereich(page, 'routinen'); await page.waitForTimeout(400);
  const nz = () => page.evaluate(() => getComputedStyle(document.querySelector('#v-routinen .nrow')).backgroundColor);
  const mitte = async sel => { const k = await (await page.$(sel)).boundingBox(); return [k.x + k.width / 2, k.y + k.height / 2]; };
  const nRuhig = await nz();
  await page.mouse.move(...await mitte('#v-routinen .nrow .two')); await page.mouse.down(); await page.waitForTimeout(150);
  const nText = await nz();
  await page.mouse.move(5, 5); await page.mouse.up(); await page.waitForTimeout(250);
  await page.mouse.move(...await mitte('#v-routinen .nrow .tk')); await page.mouse.down(); await page.waitForTimeout(150);
  const nKreis = await nz();
  await page.mouse.move(5, 5); await page.mouse.up(); await page.waitForTimeout(250);
  P.ok('Notiz gedrückt: Zeile dunkler; Kreis gedrückt: Zeile bleibt', nText !== nRuhig && nKreis === nRuhig, nRuhig + ' · Text ' + nText + ' · Kreis ' + nKreis);
  // --- Bewegung im Kleinen (v83) ---
  // Notiz abhaken: sofort gelöscht (2 − 1 = 1 Notiz im Speicher) und „Rückgängig“ da; die Zeile zeigt noch den Haken und ist 0,5 s später weg
  const notizen = async () => Object.values((await gespeichert(page)).N.notes).filter(Boolean).length;
  await page.click('#v-routinen .nrow .tk'); await page.waitForTimeout(60);
  const ab = await page.evaluate(() => { const z = document.querySelectorAll('#v-routinen .nrow'), w = document.querySelector('#v-routinen .nrow.weg'), i = w && w.querySelector('.tk i');
    return { zeilen: z.length, weg: !!w, haken: !!i && getComputedStyle(i, '::after').content !== 'none', hinweis: !document.querySelector('#toast').hidden }; });
  P.ok('abgehakt, gleich danach: gelöscht, Zeile steht noch mit Haken da, „Rückgängig“ ist zu sehen', (await notizen()) === 1 && ab.zeilen === 2 && ab.weg && ab.haken && ab.hinweis, JSON.stringify(ab) + ' · ' + await notizen());
  await page.waitForTimeout(500);
  P.ok('0,5 s später: nur noch eine Zeile', await page.evaluate(() => document.querySelectorAll('#v-routinen .nrow').length === 1 && !document.querySelector('.nrow.weg')));
  // Klappzeile: auf = sofort gezeichnet, die Liste wächst über ihre Höhe; zu = erst schrumpfen, dann zeichnen
  await bereich(page, 'gewicht'); await page.waitForTimeout(400);
  const klapp = () => page.evaluate(() => { const b = document.querySelector('#v-gewicht [data-fold="eintraege"]'), u = b.closest('ul'); const n = u.nextElementSibling; return { auf: b.getAttribute('aria-expanded'), zeilen: document.querySelectorAll('#v-gewicht [data-w="edit"]').length, hoehe: u.style.height !== '' || !!(n && n.classList.contains('nach') && n.style.height !== '') }; });
  await page.click('#v-gewicht [data-fold="eintraege"]');
  let k = await klapp();
  P.ok('aufklappen, gleich danach: Zeilen sind da, die Liste fährt noch (feste Höhe)', k.auf === 'true' && k.zeilen > 0 && k.hoehe, JSON.stringify(k));
  await page.waitForTimeout(320); k = await klapp();
  P.ok('0,3 s später: Höhe wieder frei', k.auf === 'true' && k.zeilen > 0 && !k.hoehe, JSON.stringify(k));
  await page.click('#v-gewicht [data-fold="eintraege"]');
  k = await klapp();
  P.ok('zuklappen, gleich danach: Pfeil schon zu, Zeilen noch da, die Liste fährt', k.auf === 'false' && k.zeilen > 0 && k.hoehe, JSON.stringify(k));
  await page.waitForTimeout(320); k = await klapp();
  P.ok('0,3 s später: Zeilen weg, Höhe frei', k.auf === 'false' && k.zeilen === 0 && !k.hoehe, JSON.stringify(k));
  // Balken: Nach dem Wechsel des Bereichs trägt die Ansicht 0,7 s lang „neu“, der Balken der Zielkarte wächst; danach ist die Klasse weg
  await bereich(page, 'heute'); await bereich(page, 'gewicht');
  const bal = () => page.evaluate(() => ({ neu: document.querySelector('#v-gewicht').classList.contains('neu'), name: getComputedStyle(document.querySelector('#v-gewicht .goal .fill')).animationName }));
  let ba = await bal();
  P.ok('Bereich geöffnet: Balken der Zielkarte wächst („wachs“)', ba.neu && ba.name === 'wachs', JSON.stringify(ba));
  await page.waitForTimeout(900); ba = await bal();
  P.ok('0,9 s später: Klasse „neu“ weg, nichts wächst noch einmal', !ba.neu && ba.name === 'none', JSON.stringify(ba));
  // Umschalter Monat/Jahr: Die Markierung ist eine eigene Fläche und startet dort, wo sie vorher stand („Monat“ steht links von „Jahr“: Start links, also ein negativer Versatz)
  await bereich(page, 'training'); await page.waitForTimeout(300);
  await page.click('#v-training .seg2.mini button[aria-pressed="false"]');
  const um = await page.evaluate(() => { const b = document.querySelector('#v-training .seg2.mini button[aria-pressed="true"]'), v = getComputedStyle(b, '::before');
    return { text: b.textContent.trim(), gleit: b.classList.contains('gleit'), von: parseFloat(b.style.getPropertyValue('--von')), name: v.animationName, flaeche: v.backgroundColor, knopf: getComputedStyle(b).backgroundColor }; });
  P.ok('„Jahr“ gewählt: Markierung gleitet von links herüber', um.text === 'Jahr' && um.gleit && um.von < 0 && um.name === 'gleit' && um.flaeche !== 'rgba(0, 0, 0, 0)' && um.knopf === 'rgba(0, 0, 0, 0)', JSON.stringify(um));
  P.ok('mit Bewegung: kein Fehler', !fehler.length, fehler.join(' · '));
  await P.ende(browser, []);
});
