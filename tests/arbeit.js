// Arbeit und Uni: zwei eigene Teile des Planers neben den Notizen, mit Arbeitszeiten (Verdienst je Monat) und Terminen der Uni (Punkte je Fach).
const { oeffnen, text, bereich, gespeichert, pruefer, lauf } = require('./lib');

lauf(async () => {
  const P = pruefer('Arbeit und Uni');
  /* Die Uhr steht auf dem 15.11.2026, damit „dieser Monat“ und „Vormonat“ feststehen.
     Arbeit, Lohn 14,50 €/Std:
       November: 14.11. 14:00–20:30 mit 30 min Pause = 390 − 30 = 360 min = 6 Std → 87,00 €
                 10.11. 22:00–02:15 über Mitternacht = 255 min = 4,25 Std → 61,625 → 61,63 €
                 zusammen 10,25 Std an 2 Tagen, 148,63 €
       Oktober:  20.10. 10:00–16:00 = 6 Std, noch mit altem Lohn 13,00 € → 78,00 €
     Uni, Punkte in Hundertsteln: Kons 4 + 2,5 = 6,5 · Paro 3 · Prothetik 0 → gesamt 9,5 bei 3 Terminen */
  const N = { folders: { fx: { n: 'arbeit' } }, tasks: {}, notes: { n1: { x: 'Dienstplan anfragen', f: 'fx', c: 1, m: 1 }, n2: { x: 'Kofferdam üben', f: 'uni', c: 2, m: 2 } },
    work: { rate: 1450, e: { a1: { d: '2026-11-14', a: 840, b: 1230, p: 30, r: 1450 }, a2: { d: '2026-11-10', a: 1320, b: 135, p: 0, r: 1450 }, a3: { d: '2026-10-20', a: 600, b: 960, p: 0, r: 1300 }, kaputt: { d: 'x', a: 1, b: 2, r: 5 } } },
    uni: { e: { u1: { d: '2026-11-12', f: 'kons', p: 400, n: 'Füllung 36' }, u2: { d: '2026-11-05', f: 'kons', p: 250, n: '' }, u3: { d: '2026-11-03', f: 'paro', p: 300, n: 'PZR' }, falsch: { d: '2026-11-03', f: 'chirurgie', p: 100 } } } };
  const { browser, page, fehler } = await oeffnen({ uhr: new Date(2026, 10, 15, 12), daten: { S: { routines: [], running: null }, LY: {}, N } });
  /* Gelöschtes und Verworfenes bleibt im Speicher als Schlüssel mit null stehen: gezählt wird, was einen Wert hat */
  const zahl = o => Object.values(o).filter(Boolean).length;
  const kurz = () => page.waitForTimeout(150), nm = () => text(page, '#n-main'), teil = async v => { await page.click('#r-subs [data-r="sub"][data-v="' + v + '"]'); await kurz(); };
  await bereich(page, 'routinen'); await kurz();

  // --- Umschalter; Notizen ohne Ordner ---
  const subs = await page.evaluate(() => { const b = [...document.querySelectorAll('#r-subs [data-r="sub"]')]; return b.map(x => x.textContent).join(' | ') + ' · Reihen: ' + new Set(b.map(x => Math.round(x.getBoundingClientRect().top))).size + ' · rechts: ' + (b[b.length - 1].getBoundingClientRect().right <= innerWidth - 16); });
  P.ok('Umschalter: Notizen, Arbeit, Uni in einer Reihe (390 px)', subs === 'Notizen | Arbeit | Uni · Reihen: 1 · rechts: true', subs);
  await teil('note');
  // Ordner gibt es seit v77 nicht mehr: keine Reihe, beide Notizen in einer Liste. Was gespeichert war (eigener Ordner „arbeit“, Feld f der Notizen), bleibt unverändert im Speicher.
  const g0 = (await gespeichert(page)).N;
  P.ok('Notizen: keine Ordner-Reihe, beide Notizen in einer Liste, kein Verdienst', !(await page.$('#n-main .chips')) && (await nm()).includes('Dienstplan anfragen') && (await nm()).includes('Kofferdam üben') && !(await nm()).includes('Verdienst'), await nm());
  P.ok('alte Ordner bleiben gespeichert, wie sie waren', !!g0.folders.fx && g0.notes.n1.f === 'fx' && g0.notes.n2.f === 'uni', JSON.stringify([g0.folders, g0.notes]));

  // --- Arbeit ---
  await teil('work');
  P.ok('Arbeit: kein Suchfeld, keine Notizen darunter (seit v77)', !(await page.$('#n-q')) && !(await page.$('#n-main .nrow')) && !(await page.$('#n-main [data-n="newnote"]')) && !(await nm()).includes('Notizen') && !(await nm()).includes('Dienstplan'), await nm());
  P.enthaelt('Arbeit: Verdienst im November 148,63 €, 10,25 Std an 2 Tagen', await text(page, '#n-main .hero'), ['Verdienst im November', '148,63', '10,25 Std an 2 Tagen']);
  const falten = await text(page, '#n-main .folds [data-fold]');
  P.enthaelt('je Monat eine Klappzeile mit Tagen, Stunden und Summe', falten, ['November 2026 2 Tage · 10,25 Std 148,63 €', 'Oktober 2026 1 Tag · 6 Std 78,00 €']);
  const offen = () => page.evaluate(() => [...document.querySelectorAll('#n-main [data-fold]')].map(b => b.dataset.fold + '=' + b.getAttribute('aria-expanded')).join());
  P.ok('der laufende Monat ist offen, der Vormonat zu', (await offen()) === 'arbeit-2026-11=true,arbeit-2026-10=false', await offen());
  P.enthaelt('Zeilen im November: Schicht mit Pause und Schicht über Mitternacht', await nm(), ['14:00–20:30 · 30 min Pause · 6 Std 87,00 €', '22:00–02:15 · 4,25 Std 61,63 €']);
  await page.click('#n-main [data-fold="arbeit-2026-11"]'); await page.click('#n-main [data-fold="arbeit-2026-10"]'); await kurz();
  P.ok('zu- und aufklappen: November zu, Oktober offen', (await offen()) === 'arbeit-2026-11=false,arbeit-2026-10=true', await offen());
  P.enthaelt('Oktober rechnet mit dem Lohn von damals (13,00 €)', await nm(), ['10:00–16:00 · 6 Std 78,00 €']);
  // Das Plus oben rechts öffnet dasselbe Blatt
  await page.click('#add'); await kurz();
  P.ok('Plus oben: Blatt „Arbeitszeit eintragen“', await page.evaluate(() => document.querySelector('#bsheet').open && document.querySelector('#add').getAttribute('aria-label') === 'Arbeitszeit eintragen'));
  await page.keyboard.press('Escape'); await kurz();
  // Neuer Eintrag: Zeiten, Pause und Lohn stehen wie beim jüngsten Eintrag da (14.11.). 12.11. 09:00–13:00 ohne Pause mit 15,00 € = 4 Std → 60,00 €
  await page.click('#n-main [data-n="newwork"]'); await kurz();
  const vor = await page.evaluate(() => ['b-date', 'b-von', 'b-bis', 'b-pause', 'b-rate'].map(i => document.getElementById(i).value).join('|'));
  P.ok('Blatt: heute, Zeiten, Pause und Lohn wie zuletzt', vor === '2026-11-15|14:00|20:30|30|14,50', vor);
  P.ok('Blatt zeigt vorab „6 Std · 87,00 €“', (await text(page, '#b-calc')) === '6 Std · 87,00 €', await text(page, '#b-calc'));
  const roh0 = await page.evaluate(() => localStorage.getItem('takt.v1'));
  await page.fill('#b-bis', '14:00'); await page.click('#b-save'); await kurz();
  P.ok('Beginn gleich Ende: Meldung, nichts gespeichert', (await text(page, '#b-err')) === 'Beginn und Ende sind gleich.' && (await page.evaluate(() => localStorage.getItem('takt.v1'))) === roh0);
  await page.fill('#b-date', '2026-11-12'); await page.fill('#b-von', '09:00'); await page.fill('#b-bis', '13:00'); await page.fill('#b-pause', ''); await page.fill('#b-rate', '15');
  P.ok('Blatt rechnet beim Tippen mit: „4 Std · 60,00 €“', (await text(page, '#b-calc')) === '4 Std · 60,00 €', await text(page, '#b-calc'));
  await page.click('#b-save'); await kurz();
  // 148,63 + 60,00 = 208,63 € · 10,25 + 4 = 14,25 Std an 3 Tagen
  P.enthaelt('gespeichert: 208,63 €, 14,25 Std an 3 Tagen', await text(page, '#n-main .hero'), ['208,63', '14,25 Std an 3 Tagen']);
  const gw = (await gespeichert(page)).N.work;
  // Mit dem ersten Speichern ist auch im Speicher weg, was beim Laden verworfen wurde (die Arbeitszeit „kaputt“, der Termin im Fach „chirurgie“); gezeigt wurde beides nie
  P.ok('unbrauchbare Einträge werden beim Laden verworfen', !gw.e.kaputt && !(await gespeichert(page)).N.uni.e.falsch);
  P.ok('der neue Lohn 15,00 € ist gemerkt, alte Einträge behalten ihren', gw.rate === 1500 && gw.e.a1.r === 1450 && gw.e.a3.r === 1300, JSON.stringify(gw));
  // Löschen mit „Rückgängig“
  await page.click('#n-main [data-fold="arbeit-2026-11"]'); await kurz();
  await page.click('#n-main [data-n="work"][data-id="a2"]'); await kurz(); await page.click('#b-del'); await kurz();
  // ohne die Schicht über Mitternacht: 208,63 − 61,63 = 147,00 €
  P.enthaelt('Eintrag gelöscht: 147,00 €', await text(page, '#n-main .hero'), ['147,00']);
  await page.click('#toast button'); await kurz();
  P.enthaelt('Rückgängig: wieder 208,63 €', await text(page, '#n-main .hero'), ['208,63']);

  // --- Uni ---
  await teil('uni');
  P.enthaelt('Uni: 9,5 Punkte, 3 von 18 Terminen', await text(page, '#n-main .hero'), ['Punkte gesamt', '9,5', '3 von 18 Terminen']);
  // Balken des Solls: 3 von 18 Terminen = 16,7 %
  P.ok('Uni: Balken zeigt 3 von 18 (16,7 %)', (await page.getAttribute('#n-main .soll i', 'style')) === 'width:16.7%', await page.getAttribute('#n-main .soll i', 'style'));
  const kacheln = await text(page, '#n-main .figs .fig');
  P.ok('Kacheln: Kons 6,5 · Paro 3 · Prothetik 0', kacheln === '6,5 Kons | 3 Paro | 0 Prothetik', kacheln);
  const uf = await text(page, '#n-main .folds [data-fold]');
  P.ok('Klappzeilen nur für Fächer mit Terminen, beide zu', uf === 'Kons 2 Termine 6,5 Punkte | Paro 1 Termin 3 Punkte' && !(await nm()).includes('Füllung 36'), uf);
  await page.click('#n-main [data-fold="uni-kons"]'); await kurz();
  P.enthaelt('Kons aufgeklappt: Termin mit Text und einer ohne', await nm(), ['Füllung 36', '4 Pkt.', 'Termin', '2,5 Pkt.']);
  // Neuer Termin: Fach wie beim jüngsten Termin (Kons). Prothetik 7,25 Punkte → gesamt 9,5 + 7,25 = 16,75 bei 4 Terminen
  await page.click('#n-main [data-n="newuni"]'); await kurz();
  P.ok('Blatt: Fach wie zuletzt (Kons), Punkte haben sofort den Fokus', (await page.evaluate(() => document.querySelector('#u-fach [aria-pressed="true"]').textContent + '|' + document.activeElement.id)) === 'Kons|u-pts');
  await page.fill('#u-pts', 'viel'); await page.click('#u-save'); await kurz();
  P.ok('Punkte ohne Zahl: Meldung, nichts gespeichert', !(await page.isHidden('#u-err')) && zahl((await gespeichert(page)).N.uni.e) === 3);
  await page.click('#u-fach [data-f="proth"]'); await page.fill('#u-pts', '7,25'); await page.fill('#u-note', 'Krone 14 <b>'); await page.click('#u-save'); await kurz();
  P.enthaelt('gespeichert: 16,75 Punkte, 4 von 18 Terminen', await text(page, '#n-main .hero'), ['16,75', '4 von 18 Terminen']);
  P.ok('Kachel Prothetik 7,25', (await text(page, '#n-main .figs .fig')) === '6,5 Kons | 3 Paro | 7,25 Prothetik');
  await page.click('#n-main [data-fold="uni-proth"]'); await kurz();
  P.ok('Nutzertext wird als Text gezeigt, nicht als HTML', (await nm()).includes('Krone 14 <b>') && !(await page.$('#n-main .folds b b')));
  const neu = Object.values((await gespeichert(page)).N.uni.e).find(x => x && x.f === 'proth');
  P.ok('Punkte liegen in Hundertsteln im Speicher (725), Tag ist heute', neu.p === 725 && neu.d === '2026-11-15', JSON.stringify(neu));
  // Ändern: aus 4 Punkten werden 5 → Kons 7,5, gesamt 17,75
  await page.click('#n-main [data-n="uni"][data-id="u1"]'); await kurz();
  P.ok('Blatt zum Ändern zeigt 4 Punkte und den Text', (await page.inputValue('#u-pts')) === '4' && (await page.inputValue('#u-note')) === 'Füllung 36');
  await page.fill('#u-pts', '5'); await page.click('#u-save'); await kurz();
  P.enthaelt('geändert: gesamt 17,75', await text(page, '#n-main .hero'), ['17,75']);
  await page.click('#n-main [data-fold="uni-paro"]'); await kurz();
  await page.click('#n-main [data-n="uni"][data-id="u3"]'); await kurz(); await page.click('#u-del'); await kurz();
  // ohne den Paro-Termin: 17,75 − 3 = 14,75 bei 4 Terminen, keine Klappzeile „Paro“ mehr
  P.ok('Termin gelöscht: 14,75 Punkte, Paro 0 und ohne Klappzeile', (await text(page, '#n-main .hero')).includes('14,75') && (await text(page, '#n-main .figs .fig')).includes('0 Paro') && !(await page.$('#n-main [data-fold="uni-paro"]')));

  // --- Uni ohne Notizen darunter, schmale Breite, Sicherung ---
  P.ok('Uni: keine Notizen darunter, auch keine Zeile „Notizen“ mit Plus', !(await page.$('#n-main .nrow')) && !(await page.$('#n-main [data-n="newnote"]')) && !(await nm()).includes('Notizen') && !(await nm()).includes('Kofferdam'), await nm());
  await page.setViewportSize({ width: 320, height: 700 }); await kurz();
  const quer = await page.evaluate(() => { const s = document.querySelector('#scroll'); return s.scrollWidth > s.clientWidth || document.documentElement.scrollWidth > innerWidth || [...document.querySelectorAll('#n-main *')].some(e => e.offsetParent && e.getBoundingClientRect().right > innerWidth + 0.5); });
  P.ok('320 px: nichts steht seitlich hinaus (Uni)', !quer);
  const sub320 = await page.evaluate(() => { const b = [...document.querySelectorAll('#r-subs [data-r="sub"]')]; return b.every(x => x.getBoundingClientRect().right <= innerWidth - 16) && new Set(b.map(x => Math.round(x.getBoundingClientRect().top))).size === 1; });
  // drei Teile (seit v75 ohne „Routinen“): Der letzte endet bei 186 px, der Rand liegt bei 320 − 16 = 304 px
  P.ok('320 px: die drei Umschalter stehen in einer Reihe, nichts ragt hinaus', sub320);
  await teil('work');
  const quer2 = await page.evaluate(() => { const s = document.querySelector('#scroll'); return s.scrollWidth > s.clientWidth || [...document.querySelectorAll('#n-main *')].some(e => e.offsetParent && e.getBoundingClientRect().right > innerWidth + 0.5); });
  P.ok('320 px: nichts steht seitlich hinaus (Arbeit)', !quer2);

  /* Leere App: Notizen zeigen wie bisher nur „Noch keine Notiz“; ein erster Eintrag ohne gemerkten Lohn verlangt ihn */
  const l = await oeffnen({ uhr: new Date(2026, 10, 15, 12) });
  await bereich(l.page, 'routinen'); await l.page.click('[data-r="sub"][data-v="note"]'); await l.page.waitForTimeout(150);
  P.ok('leere App, Notizen: „Noch keine Notiz“', (await text(l.page, '#n-main')).includes('Noch keine Notiz') && !(await l.page.$('#n-main .chips')));
  await l.page.click('#r-subs [data-r="sub"][data-v="work"]'); await l.page.waitForTimeout(150);
  P.enthaelt('leere App, Arbeit: 0,00 € und Hinweis', await text(l.page, '#n-main .hero'), ['0,00', 'Noch keine Arbeitszeit eingetragen']);
  await l.page.click('#n-main [data-n="newwork"]'); await l.page.waitForTimeout(150);
  P.ok('erster Eintrag: Lohn hat sofort den Fokus', (await l.page.evaluate(() => document.activeElement.id)) === 'b-rate');
  await l.page.fill('#b-von', '08:00'); await l.page.fill('#b-bis', '12:00'); await l.page.click('#b-save'); await l.page.waitForTimeout(150);
  P.ok('ohne Lohn: Meldung', (await text(l.page, '#b-err')) === 'Trag deinen Stundenlohn ein.');
  // 08:00–12:00 = 4 Std mit 12,50 € → 50,00 €
  await l.page.fill('#b-rate', '12,5'); await l.page.click('#b-save'); await l.page.waitForTimeout(150);
  P.enthaelt('gespeichert: 50,00 €, 4 Std an 1 Tag', await text(l.page, '#n-main .hero'), ['50,00', '4 Std an 1 Tag']);
  /* Was gespeichert wird (und damit in jeder Sicherung steht) */
  const datei = await l.page.evaluate(() => JSON.parse(localStorage.getItem('takt.v1')).N);
  P.ok('im Speicher: ein Eintrag mit 240 Minuten und 12,50 €, Lohn gemerkt', zahl(datei.work.e) === 1 && Object.values(datei.work.e)[0].b - Object.values(datei.work.e)[0].a === 240 && datei.work.rate === 1250, JSON.stringify(datei.work));
  await l.browser.close();

  /* Einlesen ohne Doppelte (v127): In der App steht der 10.11. von 10:00 bis 14:00 (Kennung x, 15 €). Die Datei bringt denselben Tag mit denselben Zeiten unter anderer Kennung (y, 20 €)
     und einen weiteren Tag (z). Der vorhandene bleibt mit seinem Lohn, y kommt nicht dazu, z schon: zwei Einträge. Ein zweites Einlesen ändert nichts. */
  const g = await oeffnen({ uhr: new Date(2026, 10, 15, 12), daten: { S: { routines: [], running: null }, LY: {}, N: { folders: {}, tasks: {}, notes: {}, work: { rate: 1500, e: { x: { d: '2026-11-10', a: 600, b: 840, p: 0, r: 1500 } } }, uni: { e: {} } } } });
  const dat = { name: 'zeiten.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'takt', v: 1, N: { work: { e: { y: { d: '2026-11-10', a: 600, b: 840, p: 0, r: 2000 }, z: { d: '2026-11-12', a: 600, b: 840, p: 0, r: 2000 } } } } })) };
  for (let i = 0; i < 2; i++) { await g.page.setInputFiles('#bk-file', dat); await g.page.waitForTimeout(200); }
  const we = (await gespeichert(g.page)).N.work.e;
  P.ok('Einlesen: gleicher Tag mit gleichen Zeiten ist derselbe Eintrag (der vorhandene bleibt), der neue Tag kommt dazu, zweimal Einlesen verdoppelt nichts', zahl(we) === 2 && we.x.r === 1500 && !we.y && we.z.r === 2000, JSON.stringify(we));
  await g.browser.close();

  await P.ende(browser, fehler.concat(l.fehler, g.fehler));
});
