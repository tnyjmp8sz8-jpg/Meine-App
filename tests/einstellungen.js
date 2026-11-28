// Einstellungen wie iOS (v149): erste Seite mit Zeilen je Thema, Unterseiten mit „‹ Einstellungen“, und die neuen Wahlmöglichkeiten:
// Akzentfarbe, Haptik, Name des Plans, Kennzahlen im Gym, Reihenfolge der Leiste, neue Notizen oben, Länge der Schicht, Stundenlohn, Ziel der Uni.
// Die Uhr steht auf Donnerstag, 26.11.2026, 18:00: So hängt nichts vom Tag ab, an dem die Reihe läuft.
const { oeffnen, text, bereich, gespeichert, pruefer, lauf, einstSeite, einstZeilen, zahlWahl } = require('./lib');

const huelle = () => { window.__post = []; window.webkit = { messageHandlers: { track: { postMessage: o => window.__post.push(JSON.parse(JSON.stringify(o))) } } }; };
const JETZT = new Date(2026, 10, 26, 18, 0);
const K = { ex: { a: { n: 'Rudern' }, b: { n: 'Bankdrücken' } },
  log: { '2026-11-02': { a: [[60, 10], [60, 9]] }, '2026-11-12': { a: [[62.5, 10], [62.5, 9]], b: [[80, 8]] }, '2026-11-23': { a: [[65, 10], [65, 9], [65, 8]], b: [[82.5, 8]] } },
  meta: { '2026-11-02': { dur: 3000 }, '2026-11-12': { dur: 3600 }, '2026-11-23': { dur: 4200 } }, plans: { p: { n: 'Torso', items: [{ id: 'a', sets: 3 }, { id: 'b', sets: 3 }], o: 1 } }, live: null };
const N = { folders: {}, tasks: {}, notes: { n1: { x: 'Erste', f: '', c: 1, m: 1 }, n2: { x: 'Zweite', f: '', c: 2, m: 2 }, n3: { x: 'Dritte', f: '', c: 3, m: 3 } },
  work: { rate: 2500, e: {} }, uni: { e: { u1: { d: '2026-11-10', f: 'kons', p: 150, n: 'Füllung' } } } };

lauf(async () => {
  const P = pruefer('Einstellungen');
  const o = await oeffnen({ uhr: JETZT, skript: huelle, daten: { S: { routines: [], running: null }, LY: {}, K, N } }), p = o.page;
  await p.evaluate(() => window.TrackHuelle.info({ app: '1.7' }));

  /* 1. Erste Seite: Sicherung und je Thema eine Zeile mit Wert; Unterseite und zurück */
  await einstSeite(p, '');
  P.ok('Erste Seite: Darstellung, Bereiche, Heute, Gym, Cardio, Gewicht, Planer, Widget (ohne Kalender: die iPhone-App kennt ihn nicht)', (await einstZeilen(p)) === 'Darstellung | Bereiche | Heute | Gym | Cardio | Gewicht | Planer | Widget', await einstZeilen(p));
  P.ok('… mit Werten rechts: „Blau“ und „Alle an“', await p.evaluate(() => [...document.querySelectorAll('#es-body [data-h="seite"] b')].map(b => b.textContent).slice(0, 2).join(',')) === 'Blau,Alle an');
  P.ok('… und die Sicherung oben', !!(await p.$('#es-body .act[data-h="export"]')));
  await einstSeite(p, 'darst');
  P.ok('Unterseite „Darstellung“: Titel, „‹ Einstellungen“ sichtbar, die Sicherung ist weg', (await text(p, '#es-title')) === 'Darstellung' && await p.evaluate(() => !document.querySelector('#es-zur').hidden && !document.querySelector('#es-body .act[data-h="export"]')));
  await p.click('#es-zur'); await p.waitForTimeout(40);
  P.ok('„‹ Einstellungen“ führt zurück', (await text(p, '#es-title')) === 'Einstellungen' && await p.evaluate(() => document.querySelector('#es-zur').hidden));

  /* 2. Akzentfarbe: Indigo färbt Knöpfe (--accent), bleibt nach dem Neuladen, Blau nimmt sie zurück */
  const farbe = () => p.evaluate(() => [document.documentElement.dataset.akz || '', getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()].join(' '));
  const blau = await farbe();
  await einstSeite(p, 'darst'); await p.click('#es-body [data-h="akz"][data-v="indigo"]');
  const indigo = await farbe();
  P.ok('Akzentfarbe Indigo: gesetzt und gespeichert, --accent ist eine andere Farbe als Blau', indigo.startsWith('indigo ') && indigo.split(' ')[1] !== blau.split(' ')[1] && (await gespeichert(p)).E.akz === 'indigo', blau + ' → ' + indigo);
  await einstSeite(p, 'darst'); await p.click('#es-body [data-h="akz"][data-v="blau"]');
  P.ok('Blau: wieder wie am Anfang, kein Merker', (await farbe()) === blau && !(await gespeichert(p)).E.akz);

  /* 3. Haptik aus: Ein Tipp auf einen Bereich schickt keinen Impuls mehr an die iPhone-App */
  const impulse = async () => { await p.evaluate(() => { window.__post.length = 0; }); await p.click('.tab[data-view="gewicht"]'); await p.waitForTimeout(80); await p.click('.tab[data-view="heute"]'); await p.waitForTimeout(80); return p.evaluate(() => window.__post.filter(m => m.art === 'haptik').length); };
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  const mit = await impulse();
  await einstSeite(p, 'darst'); await p.click('#es-body [data-h="hapt"]'); await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  const ohne = await impulse();
  P.ok('Haptik: an Impulse beim Wechsel des Bereichs, aus keine (E.hapt 0)', mit > 0 && ohne === 0 && (await gespeichert(p)).E.hapt === 0, mit + ' / ' + ohne);
  await einstSeite(p, 'darst'); await p.click('#es-body [data-h="hapt"]');

  /* 4. Kennzahlen im Gym: Trainingszeit ab, Rekorde dazu. Rekorde im November: am 12. Rudern (62,5 > 60) und Bankdrücken (erste Einheit zählt nicht),
     am 23. Rudern (65) und Bankdrücken (82,5 > 80) → 3. Ø Dauer: (50 + 60 + 70) / 3 = 60 min. Sätze: 2 + 3 + 4 = 9. */
  await einstSeite(p, 'gym');
  const kz = () => p.evaluate(() => [...document.querySelectorAll('#es-body [data-h="kz"]')].map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '') + (b.getAttribute('aria-disabled') === 'true' ? '!' : '')).join(' '));
  P.ok('Kennzahlen: drei gewählt (Verbesserung, Sätze besser, Trainingszeit), die übrigen gesperrt', (await kz()) === 'Verbesserung* Sätze besser* Trainingszeit* Rekorde! Ø Dauer! Pro Woche! Sätze!', await kz());
  await p.click('#es-body [data-h="kz"][data-v="dur"]'); await p.click('#es-body [data-h="kz"][data-v="rek"]');
  P.ok('Trainingszeit ab, Rekorde dazu', (await kz()) === 'Verbesserung* Sätze besser* Trainingszeit! Rekorde* Ø Dauer! Pro Woche! Sätze!' && JSON.stringify((await gespeichert(p)).E.kz) === '["p","bes","rek"]', await kz());
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await bereich(p, 'training');
  const kacheln = () => p.evaluate(() => [...document.querySelectorAll('#v-training .figs .fig')].map(f => [...f.children].map(c => c.textContent.trim()).filter(Boolean).join(' ')).join(' | '));
  P.ok('Gym im November: Kacheln Verbesserung, Sätze besser, 3 Rekorde', /Verbesserung .*\| .*Sätze besser \| 3 Rekorde$/.test(await kacheln()), await kacheln());
  await einstSeite(p, 'gym');
  for (const k of ['p', 'bes', 'rek']) await p.click('#es-body [data-h="kz"][data-v="' + k + '"]');   // die letzte bleibt: mindestens eine
  await p.click('#es-body [data-h="kz"][data-v="avg"]'); await p.click('#es-body [data-h="kz"][data-v="saetze"]');
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  P.ok('Mindestens eine bleibt (Rekorde), dazu Ø Dauer 60 min und 9 Sätze', (await kacheln()) === '3 Rekorde | 60 min Ø Dauer | 9 Sätze', await kacheln());

  /* 5. Name des Plans auf der Seite „Gym“ */
  await einstSeite(p, 'gym'); await p.fill('#es-pn', 'Oberkörper');
  P.ok('Name des Plans aus den Einstellungen: steht über den Einheiten', (await text(p, '#v-training h2.sec')).startsWith('Oberkörper') && (await gespeichert(p)).K.pn === 'Oberkörper');

  /* 6. Reihenfolge der Leiste: Heute am Griff um zwei Plätze nach unten ziehen → Planer, Gewicht, Heute, Finanzen, Training */
  await einstSeite(p, 'ber');
  const g = await p.evaluate(() => { const r = [...document.querySelectorAll('#es-reihe .prow')].map(x => x.getBoundingClientRect()), q = document.querySelector('#es-reihe .prow .griff').getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, d: r[1].top - r[0].top }; });
  await p.mouse.move(g.x, g.y); await p.mouse.down(); await p.mouse.move(g.x, g.y + g.d * 2.2, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(80);
  const tabs = () => p.evaluate(() => [...document.querySelectorAll('.tabs-in .tab')].map(b => b.textContent.trim()).join(' '));
  P.ok('Leiste in neuer Folge, gespeichert (E.reihe)', (await tabs()) === 'Planer Gewicht Heute Finanzen Training' && (await gespeichert(p)).E.reihe.join() === 'routinen,gewicht,heute,haushalt,training', await tabs());
  P.ok('… auch in der Liste der Einstellungen', (await text(p, '#es-reihe')).replace(/\s+/g, ' ').trim() === 'Planer Gewicht Heute Finanzen Training');
  P.ok('… und die Linse sitzt auf dem offenen Bereich (Heute, jetzt Platz 2)', await p.evaluate(() => document.body.dataset.v === 'heute' && document.querySelector('.tabs-in').style.getPropertyValue('--i') === '2'));

  /* 7. Planer: neue Notizen oben, Schicht 3 Stunden (Beginn 15:00 bei jetzt 18:00), Stundenlohn 27,50 €, Ziel der Uni 20 */
  await einstSeite(p, 'planer'); await p.click('#es-body [data-h="nNeu"]');
  await zahlWahl(p, '#es-body [data-h="schicht"]', '3');
  await zahlWahl(p, '#es-body [data-h="lohn"]', '27,5');
  await zahlWahl(p, '#es-body [data-h="uniSoll"]', '20');
  P.ok('Planer-Seite zeigt 3 Std, 27,50 € und 20', /3 Std.*27,50 €.*20/.test((await text(p, '#es-body')).replace(/\s+/g, ' ')), await text(p, '#es-body'));
  const e = (await gespeichert(p));
  P.ok('gespeichert: E.nNeu 1, E.schicht 180, E.uniSoll 20, N.work.rate 2750', e.E.nNeu === 1 && e.E.schicht === 180 && e.E.uniSoll === 20 && e.N.work.rate === 2750, JSON.stringify([e.E, e.N.work.rate]));
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await bereich(p, 'routinen');
  const notizen = () => p.evaluate(() => [...document.querySelectorAll('#n-main [data-n="note"] .ntxt')].map(x => x.textContent.trim()).join(','));
  P.ok('Notizen: die neueste oben', (await notizen()) === 'Dritte,Zweite,Erste', await notizen());
  await p.click('#r-subs [data-r="sub"][data-v="work"]'); await p.waitForTimeout(100); await p.click('#add'); await p.waitForTimeout(100);
  P.ok('Arbeitszeit eintragen: Beginn 15:00, Ende 18:00 (Schicht 3 Stunden)', (await p.inputValue('#b-von')) === '15:00' && (await p.inputValue('#b-bis')) === '18:00', (await p.inputValue('#b-von')) + '–' + (await p.inputValue('#b-bis')));
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await p.click('#r-subs [data-r="sub"][data-v="uni"]'); await p.waitForTimeout(100);
  P.enthaelt('Uni: „1 von 20 Terminen“', await text(p, '#n-main .hero'), ['1 von 20 Terminen']);

  /* 9. v150: Licht hinter der Seite aus (--amb-k 0 %), Reihenfolge der Übersicht auf Heute (Uni ganz nach oben gezogen) */
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  const licht = () => p.evaluate(() => getComputedStyle(document.body).getPropertyValue('--amb-k').trim());
  const an = await licht();
  await einstSeite(p, 'darst'); await p.click('#es-body [data-h="licht"]');
  P.ok('Licht aus: --amb-k 0 %, gespeichert (E.licht 0)', an !== '0%' && (await licht()) === '0%' && (await gespeichert(p)).E.licht === 0, an + ' → ' + await licht());
  await p.click('#es-body [data-h="licht"]');
  P.ok('Licht wieder an', (await licht()) === an && !('licht' in (await gespeichert(p)).E));
  await einstSeite(p, 'heute');
  const ovr = () => p.evaluate(() => [...document.querySelectorAll('#es-ovr .prow')].map(x => x.textContent.trim()).join(' '));
  P.ok('Heute: Reihenfolge der Übersicht wie gewohnt (nur Bereiche, die an sind)', (await ovr()) === 'Gewicht Finanzen Training Arbeit Uni', await ovr());
  const z = await p.evaluate(() => { const r = [...document.querySelectorAll('#es-ovr .prow')].map(x => x.getBoundingClientRect()), q = document.querySelectorAll('#es-ovr .griff')[4].getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, d: r[1].top - r[0].top }; });
  await p.mouse.move(z.x, z.y); await p.mouse.down(); await p.mouse.move(z.x, z.y - z.d * 4.3, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(80);
  P.ok('Uni nach oben gezogen: gespeichert (E.ovReihe) und so in der Liste', (await ovr()) === 'Uni Gewicht Finanzen Training Arbeit' && (await gespeichert(p)).E.ovReihe[0] === 'uni', await ovr());
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  const zeilen = await p.evaluate(() => [...document.querySelectorAll('#v-heute .ovs .ov .k')].map(x => x.textContent).join(' '));
  P.ok('Auf Heute: Uni steht oben (Gewicht ohne Einträge fehlt)', zeilen.startsWith('Uni'), zeilen);
  /* 10. v150: Standardbereich der Wiederholungen 10–15 für Übungen ohne eigenen Bereich (Rudern hat keinen) */
  await einstSeite(p, 'gym'); await p.click('#es-body [data-h="wdh"]'); await p.waitForTimeout(80);
  await p.click('#z-list [data-v="1015"], #z-list button:has-text("10–15")'); await p.waitForTimeout(80);
  P.ok('Standardbereich 10–15: gespeichert (E.wdh 1015) und auf der Seite', (await gespeichert(p)).E.wdh === 1015 && (await text(p, '#es-body')).includes('10–15'), await text(p, '#es-body [data-h="wdh"]'));
  /* 11. v152: Beträge verbergen (Arbeit: Stundenlohn 27,50 € steht als Punkte da), Schnitt im Gewicht über 14 Tage */
  /* v154: Sätze je neuer Übung (fehlt = 3). Mit 4: Eine Übung, die im Plan dazukommt, hat 4 Sätze. */
  await einstSeite(p, 'gym'); await p.click('#es-body [data-h="saetze"]'); await p.click('#z-list [data-zv="4"]'); await p.waitForTimeout(60);
  P.ok('Sätze je neuer Übung 4: gespeichert (E.saetze 4) und auf der Seite', (await gespeichert(p)).E.saetze === 4 && (await text(p, '#es-body [data-h="saetze"]')).includes('4'), await text(p, '#es-body [data-h="saetze"]'));
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  /* Die neue Einheit „Arme“ mit Rudern: gespeichert mit 4 Sätzen */
  await bereich(p, 'training'); await p.click('#v-training .subtabs [data-v="kraft"]'); await p.click('#v-training h2.sec [data-k="ordnen"]'); await p.waitForTimeout(80);
  await p.click('#o-add'); await p.waitForTimeout(80);
  await p.fill('#p-name', 'Arme'); await p.fill('#p-new', 'Rudern'); await p.click('#p-new-add'); await p.click('#p-save'); await p.waitForTimeout(150);
  const arme = Object.values((await gespeichert(p)).K.plans).find(x => x && x.n === 'Arme');
  P.ok('Neue Einheit im Plan: Rudern beginnt mit 4 Sätzen', !!arme && arme.items.length === 1 && arme.items[0].sets === 4, JSON.stringify(arme));
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await einstSeite(p, 'darst'); await p.click('#es-body [data-h="diskret"]');
  await einstSeite(p, 'planer');
  P.ok('Beträge verbergen: Stundenlohn als „••• €“, gespeichert (E.diskret 1)', (await text(p, '#es-body [data-h="lohn"]')).includes('••• €') && (await gespeichert(p)).E.diskret === 1, await text(p, '#es-body [data-h="lohn"]'));
  await einstSeite(p, 'darst'); await p.click('#es-body [data-h="diskret"]'); await einstSeite(p, 'planer');
  P.ok('… wieder an: 27,50 €', (await text(p, '#es-body [data-h="lohn"]')).includes('27,50 €'));
  await o.browser.close();
  /* Schnitt: Wiegen am 12., 19. und 26.11. (80, 82, 84 kg). Über 7 Tage zählt am 26. nur der 26. → 84,0; über 14 Tage der 19. und 26. → 83,0 */
  const o3 = await oeffnen({ uhr: JETZT, daten: { S: { routines: [], running: null }, LY: {}, W: { entries: { '2026-11-12': 80, '2026-11-19': 82, '2026-11-26': 84 } } } }), r = o3.page;
  await bereich(r, 'gewicht');
  const gross = () => r.evaluate(() => document.querySelector('#v-gewicht .w-hero').innerText.replace(/\s+/g, ' '));
  P.ok('Gewicht mit 7-Tage-Schnitt: 84,0', (await gross()).includes('7-Tage-Schnitt') && (await gross()).includes('84,0'), await gross());
  await einstSeite(r, 'gewicht'); await r.click('#es-body [data-h="schnitt"][data-v="14"]'); await r.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await bereich(r, 'gewicht');
  P.ok('Über 14 Tage: 83,0, so beschriftet und gespeichert (E.schnitt 14)', (await gross()).includes('14-Tage-Schnitt') && (await gross()).includes('83,0') && (await gespeichert(r)).E.schnitt === 14, await gross());
  await o3.browser.close();
  /* 8. Beim Start gilt die gespeicherte Akzentfarbe (Pink), die Leiste steht in der gespeicherten Folge und die App öffnet mit dem ersten Bereich darin, wenn Heute aus ist */
  const o2 = await oeffnen({ uhr: JETZT, daten: { S: { routines: [], running: null }, LY: {}, K, N, E: { akz: 'pink', reihe: ['training', 'gewicht'], weg: { heute: 1 } } } }), q = o2.page;
  const start = await q.evaluate(() => [document.documentElement.dataset.akz, [...document.querySelectorAll('.tabs-in .tab:not([hidden])')].map(b => b.textContent.trim()).join(' '), document.body.dataset.v].join(' | '));
  P.ok('Start mit Pink, Leiste Training, Gewicht, Planer, Finanzen; ohne Heute öffnet Training (der erste)', start === 'pink | Training Gewicht Planer Finanzen | training', start);
  /* 12. v152: Statistik im Jahr wählbar (sein Wort: „Möglichkeit geben auf Wechseln der Statistik, z. B. Verbesserung Kurve … gleiches bei Cardio“).
     Gym: alle drei Einheiten im November → Rekorde 3 (siehe 4.); Verbesserung braucht zwei Monate für eine Kurve. Cardio: je ein Lauf im Oktober und November → Pace als Kurve. */
  const o4 = await oeffnen({ uhr: JETZT, daten: { S: { routines: [], running: null }, LY: {}, K, N, T: { runs: { r1: { d: '2026-10-05', m: 5000, s: 1500, hr: 150 }, r2: { d: '2026-11-10', m: 6000, s: 1740, hr: 148 } } } } }), q4 = o4.page;
  await bereich(q4, 'training'); await q4.click('#v-training [data-t="mode"][data-v="year"]'); await q4.waitForTimeout(60);
  const grafik = () => q4.evaluate(() => { const c = document.querySelector('#v-training .card.chart'), m = c.querySelector('.pull-m'); return [c.querySelector('.pull-k').textContent.trim(), m.hidden ? 'zu' : [...m.querySelectorAll('[role="menuitemradio"]')].map(b => b.textContent.trim() + (b.getAttribute('aria-checked') === 'true' ? '*' : '')).join(','), (c.querySelector('svg[role="img"]') || { getAttribute: () => c.querySelector('.note').textContent }).getAttribute('aria-label')].join(' | '); });
  P.ok('Gym im Jahr: Grafik „Einheiten pro Monat“, Menü zu', (await grafik()) === 'Einheiten pro Monat | zu | Einheiten pro Monat', await grafik());
  await q4.click('#v-training .pull-k');
  P.ok('Tipp öffnet das Menü mit fünf Statistiken, die gewählte mit Haken', (await grafik()) === 'Einheiten pro Monat | Einheiten pro Monat*,Trainingszeit pro Monat,Rekorde pro Monat,Sätze besser pro Monat,Verbesserung je Monat | Einheiten pro Monat', await grafik());
  await q4.click('#v-training .pull-m [data-v="rek"]'); await q4.waitForTimeout(60);
  P.ok('Rekorde gewählt: Grafik und Merker (E.kStat)', (await grafik()) === 'Rekorde pro Monat | zu | Rekorde pro Monat' && (await gespeichert(q4)).E.kStat === 'rek', await grafik());
  await q4.click('#v-training .pull-k'); await q4.click('#v-training .pull-m [data-v="p"]'); await q4.waitForTimeout(60);
  P.ok('Verbesserung mit nur einem Monat: der Satz statt einer Kurve', (await grafik()) === 'Verbesserung je Monat | zu | Für eine Kurve braucht es zwei Monate mit Werten.', await grafik());
  await q4.click('#v-training .pull-k'); await q4.click('#v-training .mnav b'); await q4.waitForTimeout(60);
  P.ok('Tipp daneben schließt das Menü', (await grafik()).split(' | ')[1] === 'zu', await grafik());
  await q4.click('#v-training .subtabs [data-v="cardio"]'); await q4.waitForTimeout(60);
  P.ok('Cardio im Jahr: „Kilometer pro Monat“', (await grafik()).startsWith('Kilometer pro Monat | zu'), await grafik());
  await q4.click('#v-training .pull-k'); await q4.click('#v-training .pull-m [data-v="pace"]'); await q4.waitForTimeout(60);
  P.ok('Pace als Kurve über Oktober und November, gemerkt (E.cStat)', (await grafik()) === 'Pace je Monat | zu | Pace je Monat' && (await gespeichert(q4)).E.cStat === 'pace' && !!(await q4.$('#v-training .card.chart .g-trend')), await grafik());
  /* 13. v153: Ziele je Monat, nur da, wenn eingestellt. Cardio: im November ein Lauf mit 6 km, Ziel 20 km → Linie 30 % (6 / 20), „noch 14 km“ (20 − 6);
     im Oktober 5 km → 25 % (5 / 20, Monat vorbei, also der Anteil). Ziel 5 km → „erreicht“. Arbeit: eine Schicht 10:00–14:00 ohne Pause zu 25 € = 4 × 25 = 100 €; Ziel 600 € → „noch 500 €“ (16,7 %). */
  const ziel = sel => q4.evaluate(s => { const l = document.querySelector(s + ' .soll'), t = document.querySelector(s + ' .soll-t'); return l ? [l.firstChild.style.width].concat([...t.children].map(x => x.textContent)).join(' | ') : 'keine'; }, sel);
  await q4.click('#v-training [data-t="mode"][data-v="month"]'); await q4.waitForTimeout(60);
  P.ok('Cardio ohne Ziel: keine Linie', (await ziel('#v-training')) === 'keine', await ziel('#v-training'));
  await einstSeite(q4, 'cardio');
  P.ok('Seite Cardio: „Ziel je Monat“ steht auf „Aus“', (await text(q4, '#es-body [data-h="cZiel"]')).includes('Aus'), await text(q4, '#es-body [data-h="cZiel"]'));
  await zahlWahl(q4, '#es-body [data-h="cZiel"]', '20');
  P.ok('Ziel 20 km: gespeichert (E.cZiel 20), auf der Seite und in der Zeile der ersten Seite', (await gespeichert(q4)).E.cZiel === 20 && (await text(q4, '#es-body [data-h="cZiel"]')).includes('20 km'), await text(q4, '#es-body'));
  await q4.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close())); await bereich(q4, 'training'); await q4.waitForTimeout(40);
  P.ok('Cardio im November: Linie 30 %, „Ziel 20 km | noch 14 km“', (await ziel('#v-training')) === '30% | Ziel 20 km | noch 14 km', await ziel('#v-training'));
  await q4.click('#v-training .mnav [data-m="prev"] >> visible=true'); await q4.waitForTimeout(60);
  P.ok('Oktober (vorbei): Linie 25 %, rechts der Anteil', (await ziel('#v-training')) === '25% | Ziel 20 km | 25 %', await ziel('#v-training'));
  await q4.click('#v-training .mnav [data-m="next"] >> visible=true'); await einstSeite(q4, 'cardio'); await zahlWahl(q4, '#es-body [data-h="cZiel"]', '5');
  await q4.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close())); await bereich(q4, 'training'); await q4.waitForTimeout(40);
  P.ok('Ziel 5 km: volle Linie, „erreicht“ in Grün', (await ziel('#v-training')) === '100% | Ziel 5 km | erreicht' && !!(await q4.$('#v-training .soll-t .up')), await ziel('#v-training'));
  await einstSeite(q4, 'cardio'); await q4.click('#es-body [data-h="cZiel"]'); await q4.click('#z-list [data-zv="0"]'); await q4.waitForTimeout(60);
  await q4.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close())); await bereich(q4, 'training'); await q4.waitForTimeout(40);
  P.ok('„Kein Ziel“ nimmt es zurück: keine Linie, nichts gespeichert', (await ziel('#v-training')) === 'keine' && !('cZiel' in (await gespeichert(q4)).E), await ziel('#v-training'));
  /* v154: Messwert im Graphen „Letzte Läufe“ bleibt gewählt (E.cMet), auch nach dem Neuladen */
  const met = () => q4.evaluate(() => [...document.querySelectorAll('#v-training [data-t="metric"]')].filter(c => c.offsetParent).map(c => c.textContent + (c.getAttribute('aria-pressed') === 'true' ? '*' : '')).join());
  P.ok('Cardio: Effizienz ist vorgewählt', (await met()) === 'Effizienz*,Pace', await met());
  await q4.click('#v-training [data-t="metric"][data-v="pace"] >> visible=true'); await q4.waitForTimeout(60);
  await q4.reload(); await q4.waitForTimeout(150); await bereich(q4, 'training'); await q4.click('#v-training .subtabs [data-v="cardio"]'); await q4.waitForTimeout(60);
  P.ok('Pace gewählt: nach dem Neuladen noch Pace (E.cMet)', (await met()) === 'Effizienz,Pace*' && (await gespeichert(q4)).E.cMet === 'pace', await met());
  await q4.evaluate(() => { const st = JSON.parse(localStorage.getItem('takt.v1')); st.N.work.e = { w1: { d: '2026-11-20', a: 600, b: 840, p: 0, r: 2500 } }; localStorage.setItem('takt.v1', JSON.stringify(st)); });
  await q4.reload(); await q4.waitForTimeout(150);
  await einstSeite(q4, 'planer'); await zahlWahl(q4, '#es-body [data-h="wZiel"]', '600');
  P.ok('Ziel beim Verdienst 600 €: gespeichert in Cent (E.wZiel 60000)', (await gespeichert(q4)).E.wZiel === 60000 && (await text(q4, '#es-body [data-h="wZiel"]')).includes('600 €'), await text(q4, '#es-body [data-h="wZiel"]'));
  await q4.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close())); await bereich(q4, 'training'); await q4.waitForTimeout(40);
  await bereich(q4, 'routinen'); await q4.click('#r-subs [data-r="sub"][data-v="work"]'); await q4.waitForTimeout(60);
  P.ok('Arbeit: Linie 16,7 %, „Ziel 600 € | noch 500 €“', (await ziel('#v-routinen')) === '16.7% | Ziel 600 € | noch 500 €', await ziel('#v-routinen'));
  await o4.browser.close();
  /* 14. v155: Zeilen im Widget „Überblick“ (nur in der iPhone-App). Daten: Plan (Gym), Gewicht, eine Schicht am 20.11. 10:00–14:00 zu 25 € (4 Std × 25 € = 100 €),
     ein Uni-Termin mit 1,5 Punkten; keine Läufe, keine Finanzen. Ohne Wahl: Gym, Gewicht, Laufen, Finanzen → im Stand nur Gym und Gewicht. Höchstens vier an, mindestens eine. */
  const o5 = await oeffnen({ uhr: JETZT, skript: huelle, daten: { S: { routines: [], running: null }, LY: {}, K, W: { entries: { '2026-11-26': 84 } },
    N: Object.assign({}, N, { work: { rate: 2500, e: { w1: { d: '2026-11-20', a: 600, b: 840, p: 0, r: 2500 } } } }) } }), q5 = o5.page;
  await q5.evaluate(() => window.TrackHuelle.info({ app: '1.7' }));
  const wstand = async () => { await q5.waitForTimeout(400); return q5.evaluate(() => { const s = window.__post.filter(m => m.art === 'stand').pop(); return s ? s.zahlen.map(z => z.t + (z.t === 'Arbeit' || z.t === 'Uni' ? ' ' + z.w + ' / ' + z.s : '')).join(', ') : 'kein Stand'; }); };
  P.ok('Widget ohne Wahl: Gym, Gewicht (Laufen und Finanzen ohne Daten)', (await wstand()) === 'Gym, Gewicht', await wstand());
  await einstSeite(q5, 'widget');
  const wsch = () => q5.evaluate(() => [...document.querySelectorAll('#es-body [data-h="wid"]')].map(b => b.textContent + (b.getAttribute('aria-checked') === 'true' ? '+' : '-') + (b.disabled ? '!' : '')).join(' '));
  P.ok('Seite Widget: vier an, Arbeit und Uni gesperrt', (await wsch()) === 'Gym+ Gewicht+ Laufen+ Finanzen+ Arbeit-! Uni-!', await wsch());
  for (const k of ['laufen', 'geld', 'arbeit', 'uni']) await q5.click('#es-body [data-h="wid"][data-v="' + k + '"]');
  P.ok('Laufen und Finanzen aus, Arbeit und Uni an: gespeichert (E.wid)', (await gespeichert(q5)).E.wid.join() === 'gym,gewicht,arbeit,uni', JSON.stringify((await gespeichert(q5)).E.wid));
  P.ok('Stand: Gym, Gewicht, Arbeit 100 € / 4 Std im November, Uni 1,5 Punkte / 1 von 18 Terminen', (await wstand()) === 'Gym, Gewicht, Arbeit 100 € / 4 Std im November, Uni 1,5 Punkte / 1 von 18 Terminen', await wstand());
  const wor = () => q5.evaluate(() => [...document.querySelectorAll('#es-wor .prow')].map(x => x.textContent.trim()).join(' '));
  const wz = await q5.evaluate(() => { const r = [...document.querySelectorAll('#es-wor .prow')].map(x => x.getBoundingClientRect()), q = document.querySelectorAll('#es-wor .griff')[3].getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, d: r[1].top - r[0].top }; });
  await q5.mouse.move(wz.x, wz.y); await q5.mouse.down(); await q5.mouse.move(wz.x, wz.y - wz.d * 3.3, { steps: 10 }); await q5.mouse.up(); await q5.waitForTimeout(80);
  P.ok('Uni nach oben gezogen: Reihenfolge und Stand', (await wor()) === 'Uni Gym Gewicht Arbeit' && (await wstand()).startsWith('Uni 1,5 Punkte'), (await wor()) + ' | ' + await wstand());
  for (const k of ['gym', 'gewicht', 'arbeit']) await q5.click('#es-body [data-h="wid"][data-v="' + k + '"]');
  P.ok('Die letzte Zeile bleibt gesperrt an', (await wsch()).includes('Uni+!'), await wsch());
  await o5.browser.close();
  await P.ende(null, o.fehler.concat(o2.fehler, o3.fehler, o4.fehler, o5.fehler));
  await o2.browser.close();
});
