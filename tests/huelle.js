// Verbindung zur iPhone-Hülle (v60): Stand für Widget und Mitteilung, Läufe aus Health, Auskunft über die App.
// Die Hülle wird nachgestellt: window.webkit.messageHandlers.track sammelt, was die App schickt.
const { tag, oeffnen, text, bereich, gespeichert, pruefer, lauf } = require('./lib');

/* Dazu ein nachgestelltes visualViewport: So lässt sich die Tastatur vortäuschen (Höhe wird kleiner, dann „resize“). */
const huelle = () => { window.__vv = new EventTarget(); window.__vv.height = 844; window.__vv.offsetTop = 0; Object.defineProperty(window, 'visualViewport', { value: window.__vv, configurable: true });
  window.__post = []; window.webkit = { messageHandlers: { track: { postMessage: o => window.__post.push(JSON.parse(JSON.stringify(o))) } } }; };
const post = page => page.evaluate(() => window.__post);
const letzter = async page => (await post(page)).filter(m => m.art === 'stand').pop();
const wi = n => { const d = new Date(); d.setDate(d.getDate() + n); return (d.getDay() + 6) % 7; };
const nur = i => [0, 1, 2, 3, 4, 5, 6].map(x => x === i);
/* Zeitpunkt: 12 Uhr vor n Tagen */
const mittag = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d.getTime(); };

/* Beispieldaten: zwei tägliche Routinen (eine heute erledigt), eine nur am morgigen Wochentag, alle vor 20 Tagen angelegt.
   Aufgaben (vor 3 Tagen angelegt): eine seit zwei Tagen fällig, eine in drei Tagen, eine ohne Datum, eine erledigte.
   Zwei Notizen, die ältere vor 25 Tagen angelegt: Sie ist der älteste Eintrag überhaupt. Ein Lauf von Hand vor zwei Tagen (5 km).
   Eine eigene Kategorie „Haus & Garten“ (mit Budget, sonst räumt die App sie beim Start als unbenutzt weg). */
const jahr = tag(0).slice(0, 4), LY = {}; LY[jahr] = {}; LY[jahr][tag(0)] = { r1: { s: 1800, d: 1 } };
const daten = {
  S: { routines: [{ id: 'r1', name: 'Lesen', minutes: 30, days: Array(7).fill(true), created: tag(20) }, { id: 'r2', name: 'Dehnen', minutes: 10, days: Array(7).fill(true), created: tag(20) }, { id: 'r3', name: 'Putzen', minutes: 20, days: nur(wi(1)), created: tag(20) }], running: null },
  LY, W: {}, MF: { cats: { cgarten1: { n: 'Haus & Garten' } }, budgets: { cgarten1: 5000 } }, MY: {}, K: {},
  T: { runs: { a1: { d: tag(2), m: 5000, s: 1500, hr: 150, k: 'out' } } },
  N: { folders: {}, tasks: {
    t1: { t: 'Seminararbeit abgeben', f: '', d: tag(2), done: null, c: mittag(3) + 1 }, t2: { t: 'Zahnarzt anrufen', f: '', d: tag(-3), done: null, c: mittag(3) + 2 },
    t3: { t: 'Irgendwann', f: '', d: null, done: null, c: mittag(3) + 3 }, t4: { t: 'Schon fertig', f: '', d: tag(0), done: Date.now(), c: mittag(3) + 4 } },
    notes: { n1: { x: 'Milch kaufen\nund Brot', f: '', c: mittag(25), m: mittag(2) }, n2: { x: 'Idee für Kapitel 3', f: '', c: mittag(3), m: mittag(1) } } }
};

lauf(async () => {
  const p = pruefer('Verbindung zur iPhone-Hülle');

  /* Im Browser ohne Hülle: nichts davon ist da */
  let o = await oeffnen({ daten });
  p.ok('ohne Hülle: keine Schnittstelle', await o.page.evaluate(() => window.TrackHuelle === undefined));
  await bereich(o.page, 'training');
  p.ok('ohne Hülle: kein Health-Knopf, keine Zeile zur App', await o.page.evaluate(() => !document.querySelector('[data-t="health"]') && document.querySelector('#h-line').hidden));
  p.ok('ohne Hülle: Blätter bleiben, wie sie sind (kein --kb)', await o.page.evaluate(() => document.documentElement.style.getPropertyValue('--kb') === ''));
  p.ok('ohne Hülle: keine Fehler', !o.fehler.length, o.fehler.join(' | '));
  await o.browser.close();

  o = await oeffnen({ daten, skript: huelle });
  const page = o.page; await page.waitForTimeout(500);
  let m = await post(page), st = await letzter(page);
  p.ok('beim Start: „bereit“ und ein Stand', m[0] && m[0].art === 'bereit' && !!st, JSON.stringify(m).slice(0, 200));
  p.ok('Stand für heute und sieben weitere Tage', st.tage.length === 8 && st.tage[0].d === tag(0) && st.tage[7].d === tag(-7), JSON.stringify(st.tage.map(t => t.d)));
  /* heute: 2 Routinen geplant (r3 nur morgen), 1 erledigt; 1 Aufgabe offen (die überfällige) */
  p.ok('heute: 2 Routinen, 1 erledigt, 1 Aufgabe', st.tage[0].rn === 2 && st.tage[0].rd === 1 && st.tage[0].an === 1 && st.tage[0].auf[0] === 'Seminararbeit abgeben', JSON.stringify(st.tage[0]));
  /* morgen: 3 Routinen (r3 kommt dazu), nichts erledigt */
  p.ok('morgen: 3 Routinen, 0 erledigt', st.tage[1].rn === 3 && st.tage[1].rd === 0, JSON.stringify(st.tage[1]));
  /* in drei Tagen ist auch „Zahnarzt“ fällig: 2 Aufgaben, die ältere zuerst; ohne Datum und Erledigtes zählen nie */
  p.ok('in drei Tagen: 2 Aufgaben, ältere zuerst', st.tage[2].an === 1 && st.tage[3].an === 2 && st.tage[3].auf.join('|') === 'Seminararbeit abgeben|Zahnarzt anrufen', JSON.stringify(st.tage[3]));
  p.ok('Notizen: neueste zuerst, nur die erste Zeile', st.notizen.join('|') === 'Idee für Kapitel 3|Milch kaufen', st.notizen.join('|'));
  /* ohne Sicherung zählt der älteste Eintrag, auch eine Notiz oder Aufgabe: hier die Notiz von vor 25 Tagen (älter als die Routinen), also fällig seit 25 − 7 = 18 Tagen */
  p.ok('Sicherung fällig: ältester Eintrag (eine Notiz) plus 7 Tage', st.sicherung === tag(18), st.sicherung);

  /* Sicherung vor 2 Tagen gespeichert: fällig in 5 Tagen. Der neue Stand geht nach dem nächsten Speichern raus. */
  await page.evaluate(() => { localStorage.setItem('takt.backup', String(Date.now() - 2 * 86400000)); window.TrackHuelle.neu('notiz'); });
  await page.waitForTimeout(200);
  p.ok('Kurzbefehl „notiz“ öffnet das Blatt', await page.evaluate(() => document.querySelector('#nsheet').open));
  await page.keyboard.type('Aus dem Kurzbefehl'); await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  st = await letzter(page);
  p.ok('nach dem Speichern: neuer Stand mit der Notiz', st.notizen[0] === 'Aus dem Kurzbefehl', st.notizen.join('|'));
  p.ok('Sicherung vor 2 Tagen: fällig in 5 Tagen', st.sicherung === tag(-5), st.sicherung);

  /* Läufe aus Health:
     A neu (gestern 5,23 km) → wird eingetragen. B am Tag des Laufs von Hand, 5,3 km statt 5,0 (6 % Unterschied) → derselbe Lauf, nicht doppelt.
     C ohne Strecke → ungültig. D in der Zukunft → nein. A noch einmal → nein. E Laufband vor drei Tagen → wird eingetragen. */
  const A = { id: 'AAAA1111-22', t: mittag(1), m: 5230.4, s: 1800.2, hr: 151.6, k: 'out' };
  const liste = [A, { id: 'BBBB', t: mittag(2), m: 5300, s: 1600, hr: 140, k: 'out' }, { id: 'CCCC', t: mittag(1), m: 0, s: 900, k: 'out' },
    { id: 'DDDD', t: mittag(-2), m: 4000, s: 1300, k: 'out' }, A, { id: 'EEEE', t: mittag(3), m: 3000, s: 1200, hr: null, k: 'in' }];
  let n = await page.evaluate(l => window.TrackHuelle.laeufe(l), liste), g = await gespeichert(page);
  const runs = () => Object.values(g.T.runs).filter(Boolean);
  p.ok('Health: 2 von 6 werden eingetragen', n === 2 && runs().length === 3, n + ' · ' + JSON.stringify(g.T.runs));
  const a = runs().find(r => r.d === tag(1));
  p.ok('Health: Werte gerundet übernommen', a && a.m === 5230 && a.s === 1800 && a.hr === 152 && a.k === 'out', JSON.stringify(a));
  p.ok('Health: Laufband bleibt Laufband', runs().some(r => r.d === tag(3) && r.k === 'in' && r.m === 3000));
  p.ok('Health: gemerkt sind A, B, E (nicht Ungültiges, nicht die Zukunft)', Object.keys(g.T.hk).sort().join('|') === 'AAAA1111-22|BBBB|EEEE', Object.keys(g.T.hk).join('|'));
  n = await page.evaluate(l => window.TrackHuelle.laeufe(l), liste);
  p.ok('Health: zweites Mal kommt nichts doppelt', n === 0);

  /* Löschen: Der Lauf aus Health kommt nicht wieder */
  await bereich(page, 'training'); await page.click('[data-t="kind"][data-v="all"]');
  if (!(await page.$('#v-training [data-fold="laeufe"]'))) await page.click('#v-training .mnav button:first-child');   // am Monatsersten liegen alle Läufe im Vormonat
  await page.click('#v-training [data-fold="laeufe"]');   // Läufe aufklappen
  const zeile = page.locator('[data-t="edit"]').first(); await zeile.click(); await page.waitForTimeout(150);
  const geloescht = await page.evaluate(() => document.querySelector('#t-date').value);
  await page.click('#t-del'); await page.waitForTimeout(150);
  n = await page.evaluate(l => window.TrackHuelle.laeufe(l), liste); g = await gespeichert(page);
  p.ok('Health: ein gelöschter Lauf kommt nicht wieder', n === 0 && runs().length === 2 && !runs().some(r => r.d === geloescht && geloescht !== tag(2)), n + ' · ' + geloescht + ' · ' + JSON.stringify(g.T.runs));
  await page.reload(); await page.waitForTimeout(400); g = await gespeichert(page);
  p.ok('Health: Kennungen überstehen das Neuladen', Object.keys(g.T.hk || {}).length === 3);

  /* Stand: Notizen mit Kennung für das Widget */
  st = await letzter(page);
  p.ok('Stand: Notizen mit Kennung (nz), neueste zuerst', st.nz.length === 3 && st.nz[0].x === 'Aus dem Kurzbefehl' && st.nz.some(n => n.id === 'n1' && n.x === 'Milch kaufen') && st.notizen.length === 3, JSON.stringify(st.nz));

  /* Eingang (Widget und Kurzbefehle): eine Notiz, zwei Ausgaben, ein Lauf, eine abgehakte Notiz.
     Ausgabe 1: 12,50 € mit Wort „essen g“ → Kategorie „Essen gehen“ (aus). Ausgabe 2: 3 € ohne Wort → Sonstiges. Kein Konto angelegt → ohne Konto.
     Lauf: vor fünf Tagen 8 km → neu. Abhaken: n2 („Idee für Kapitel 3“) verschwindet, mit „Rückgängig“. */
  const vorher = await gespeichert(page), jetzt = Date.now();
  const befehle = [{ id: 'c1', art: 'notiz', x: '  Vom Home-Bildschirm ', t: jetzt - 60000 }, { id: 'c2', art: 'ausgabe', a: 1250, n: 'Pizza', kat: 'Essen g', t: jetzt - 50000 },
    { id: 'c3', art: 'ausgabe', a: 300, t: jetzt - 40000 }, { id: 'c4', art: 'lauf', lauf: { id: 'k123', t: mittag(5), m: 8000, s: 2700, hr: 148, k: 'out' }, t: jetzt },
    { id: 'c5', art: 'notizWeg', nid: 'n2', t: jetzt }, { id: 'c6', art: 'ausgabe', a: 0, t: jetzt }, { id: 'c7', art: 'notizWeg', nid: 'gibtsnicht', t: jetzt }];
  let ids = await page.evaluate(l => window.TrackHuelle.eingang(l), befehle); g = await gespeichert(page);
  const tx = Object.values(g.MY[jahr].tx).filter(Boolean), notes = Object.values(g.N.notes).filter(Boolean);
  p.ok('Eingang: alle Kennungen kommen zurück', ids.join('|') === 'c1|c2|c3|c4|c5|c6|c7', ids.join('|'));
  p.ok('Eingang: Notiz angelegt, ohne Leerraum', notes.some(n => n.x === 'Vom Home-Bildschirm' && n.c === jetzt - 60000));
  p.ok('Eingang: Ausgabe mit Kategorie aus dem Wort', tx.some(t => t.a === 1250 && t.k === 'out' && t.c === 'aus' && t.n === 'Pizza' && t.d === tag(0) && !t.acc), JSON.stringify(tx));
  p.ok('Eingang: Ausgabe ohne Wort ist „Sonstiges“, Betrag 0 wird nichts', tx.some(t => t.a === 300 && t.c === 'sonst') && tx.length === 2, JSON.stringify(tx));
  p.ok('Eingang: Lauf eingetragen', Object.values(g.T.runs).filter(Boolean).some(r => r.d === tag(5) && r.m === 8000) && g.T.hk.k123 === 1);
  p.ok('Eingang: abgehakte Notiz ist weg', !g.N.notes.n2 && Object.keys(vorher.N.notes).includes('n2'));
  p.enthaelt('Eingang: Hinweis mit „Rückgängig“', await text(page, '#toast'), ['Im Widget abgehakt', 'Rückgängig']);
  await page.waitForTimeout(500); st = await letzter(page);
  p.ok('Stand nach dem Abhaken: ohne die Notiz', !st.nz.some(n => n.id === 'n2') && st.nz.some(n => n.x === 'Vom Home-Bildschirm'), JSON.stringify(st.nz));
  await page.click('#toast button'); await page.waitForTimeout(200); g = await gespeichert(page);
  p.ok('Rückgängig: Notiz ist wieder da, alles andere bleibt', !!g.N.notes.n2 && Object.values(g.N.notes).some(n => n.x === 'Vom Home-Bildschirm') && Object.values(g.MY[jahr].tx).filter(Boolean).length === 2);
  /* „Rückgängig“ geht nicht über saveLocal(): Der Stand für das Widget muss trotzdem hinausgehen, sonst fehlt die Notiz dort weiter */
  await page.waitForTimeout(500); st = await letzter(page);
  p.ok('Rückgängig: neuer Stand mit der Notiz geht an die Hülle', st.nz.some(n => n.id === 'n2' && n.x === 'Idee für Kapitel 3'), JSON.stringify(st.nz));
  ids = await page.evaluate(l => window.TrackHuelle.eingang(l), befehle); g = await gespeichert(page);
  p.ok('Eingang: zweites Mal wird nichts doppelt angewendet', ids.length === 7 && Object.values(g.MY[jahr].tx).filter(Boolean).length === 2 && !!g.N.notes.n2 && Object.values(g.N.notes).filter(n => n && n.x === 'Vom Home-Bildschirm').length === 1);

  /* Tastatur in der iPhone-App: 844 hoch, die Tastatur verdeckt unten 336 → das Blatt endet bei 844 − 336 = 508 und ist höchstens 92 % von 844 − 336 = 440 hoch */
  await page.evaluate(() => window.TrackHuelle.neu('notiz')); await page.waitForTimeout(200);
  const unten = () => page.evaluate(() => { const r = document.querySelector('#nsheet').getBoundingClientRect(); return [Math.round(r.bottom), Math.round(r.height)]; });
  p.ok('ohne Tastatur: Blatt sitzt unten', (await unten())[0] === 844, String(await unten()));
  await page.evaluate(() => { window.__vv.height = 844 - 336; window.__vv.dispatchEvent(new Event('resize')); }); await page.waitForTimeout(500);
  let u = await unten();
  p.ok('mit Tastatur: Blatt rückt über die Tastatur', u[0] === 508 && u[1] <= 441, String(u));
  await page.evaluate(() => { window.__vv.height = 844; window.__vv.dispatchEvent(new Event('resize')); }); await page.waitForTimeout(500);
  p.ok('Tastatur weg: Blatt sitzt wieder unten', (await unten())[0] === 844, String(await unten()));
  await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  /* Beim nächsten Mal ist die Höhe bekannt (336): Das Blatt sitzt sofort oben, noch bevor die Tastatur sich meldet. Bleibt sie aus, fällt es nach gut einer Sekunde zurück. */
  p.ok('Blatt zu: nichts bleibt angehoben', await page.evaluate(() => document.documentElement.style.getPropertyValue('--kb') === '0px' && localStorage.getItem('takt.kb') === '336'));
  await page.evaluate(() => window.TrackHuelle.neu('notiz')); await page.waitForTimeout(450);
  p.ok('zweites Mal: Blatt sitzt sofort über der Tastatur', (await unten())[0] === 508, String(await unten()));
  await page.waitForTimeout(1200);
  p.ok('Tastatur kommt nicht: Blatt fällt zurück', (await unten())[0] === 844, String(await unten()));
  await page.keyboard.press('Enter'); await page.waitForTimeout(200);

  /* Kategorie aus dem Kurzbefehl bei einer eigenen Kategorie mit „&“ im Namen: Der volle Name trifft sie, ebenso ein Anfang, der über das Zeichen reicht.
     „Haus & Hof“ ist kein Anfang von „Haus & Garten“ → Sonstiges. */
  await page.evaluate(l => window.TrackHuelle.eingang(l), [{ id: 'k1', art: 'ausgabe', a: 990, kat: 'Haus & Garten', t: jetzt }, { id: 'k2', art: 'ausgabe', a: 550, kat: 'haus &', t: jetzt }, { id: 'k3', art: 'ausgabe', a: 440, kat: 'Haus & Hof', t: jetzt }]);
  const kat = a => (Object.values(g.MY[jahr].tx).find(t => t && t.a === a) || {}).c; g = await gespeichert(page);
  p.ok('Eingang: Kategorie mit „&“ wird über Namen und Anfang gefunden', kat(990) === 'cgarten1' && kat(550) === 'cgarten1' && kat(440) === 'sonst', [kat(990), kat(550), kat(440)].join());

  /* Texte für das Widget werden nach ganzen Zeichen gekürzt. Notiz und Aufgabe: 79 Buchstaben, ein Emoji, ein Buchstabe. 80 Zeichen sind die 79 Buchstaben und das Emoji
     (81 Einheiten in UTF-16); nach Einheiten geschnitten bliebe ein halbes Emoji, mit dem sich der Stand nicht als Datei schreiben lässt.
     Dazu ein Titel, in dem schon ein halbes Zeichen gespeichert ist: Es fällt weg. Fällig vor 9 und vor 8 Tagen, damit beide heute vorn stehen. */
  await page.evaluate(d => { const o = JSON.parse(localStorage.getItem('takt.v1'));
    o.N.notes.em = { x: 'a'.repeat(79) + '😀b', f: '', c: d.c, m: Date.now() };
    o.N.tasks.em = { t: 'b'.repeat(79) + '😀c', f: '', d: d.t9, done: null, c: d.c, n: '' }; o.N.tasks.hb = { t: 'Halb\ud83d', f: '', d: d.t8, done: null, c: d.c, n: '' };
    localStorage.setItem('takt.v1', JSON.stringify(o)); }, { c: mittag(3), t9: tag(9), t8: tag(8) });
  await page.reload(); await page.waitForTimeout(700); st = await letzter(page);
  p.ok('Stand: Notiz endet nach 80 Zeichen mit dem ganzen Emoji', st.nz[0].x === 'a'.repeat(79) + '😀', st.nz[0].x);
  p.ok('Stand: Titel der Aufgabe ebenso, das halbe Zeichen im anderen Titel ist weg', st.tage[0].auf[0] === 'b'.repeat(79) + '😀' && st.tage[0].auf[1] === 'Halb', JSON.stringify(st.tage[0].auf));
  p.ok('Stand: kein Text mit halbem Zeichen', await page.evaluate(() => { const s = window.__post.filter(m => m.art === 'stand').pop();
    return s.nz.map(n => n.x).concat(s.notizen, ...s.tage.map(t => t.auf)).every(x => { try { encodeURIComponent(x); return true; } catch (e) { return false; } }); }));

  /* Sicherung in der iPhone-App: Dort gibt es nur das Teilen, den Sprung zu einer Datei lehnt die Hülle ab. Entsteht keine Datei, meldet die App keinen Erfolg
     und stellt die Erinnerung nicht zurück (takt.backup bleibt). Ein vom Nutzer abgebrochenes Teilen bleibt eine stille Zeile. */
  let dateien = 0; page.on('download', () => dateien++);
  await bereich(page, 'heute');
  const merker = () => page.evaluate(() => localStorage.getItem('takt.backup')), merker0 = await merker();
  const sichern = async () => { if (!(await page.$('#v-heute .act[data-h="export"]'))) await page.click('#v-heute [data-fold="sicherung"]'); await page.click('#v-heute .act[data-h="export"]'); await page.waitForTimeout(300); return text(page, '#bk-msg'); };
  /* Teilen nachstellen: wie = 'ok' (Datei gesichert) oder der Name des Fehlers, mit dem das Teilen endet */
  const teilen = wie => page.evaluate(w => { if (!window.__mm) { const mm = window.matchMedia.bind(window); window.__mm = 1; window.matchMedia = q => q === '(pointer:coarse)' ? { matches: true } : mm(q); }
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', { value: () => w === 'ok' ? Promise.resolve() : Promise.reject(Object.assign(new Error(w), { name: w })), configurable: true }); }, wie);
  let meldung = await sichern();
  p.ok('Sicherung ohne Teilen: kein Erfolg, Erinnerung bleibt', meldung === 'Die Sicherung konnte nicht gespeichert werden.' && (await merker()) === merker0 && dateien === 0, meldung);
  await teilen('AbortError'); meldung = await sichern();
  p.ok('Teilen abgebrochen: nur die stille Zeile, Erinnerung bleibt', meldung === 'Sicherung abgebrochen.' && (await merker()) === merker0, meldung);
  await teilen('NotAllowedError'); meldung = await sichern();
  p.ok('Teilen scheitert: kein Erfolg, Erinnerung bleibt', meldung === 'Die Sicherung konnte nicht gespeichert werden.' && (await merker()) === merker0 && dateien === 0, meldung);
  await teilen('ok'); meldung = await sichern(); await page.waitForTimeout(500); st = await letzter(page);
  /* geteilt: Erfolg, der Merker ist von jetzt, und die nächste Sicherung ist in 7 Tagen fällig */
  p.ok('Teilen gelungen: Erfolg, Erinnerung zurückgestellt', meldung === 'Sicherung gespeichert: track-sicherung-' + tag(0) + '.json' && Number(await merker()) > Number(merker0) && st.sicherung === tag(-7), meldung + ' · ' + st.sicherung);

  /* Auskunft der Hülle: Zeile in der Fußzeile, Knopf im Cardio-Bereich nur, wenn Health freigegeben ist */
  const ablauf = new Date(2026, 10, 24, 9, 0).getTime();
  await page.evaluate(t => window.TrackHuelle.info({ app: '0.2', ablauf: t, health: 'kann' }), ablauf);
  p.enthaelt('Fußzeile nennt App und Ablauf', await text(page, '#h-line'), ['iPhone-App 0.2', 'gültig bis 24. November']);
  await bereich(page, 'training');
  p.ok('Health freigegeben: Knopf im Cardio-Bereich', await page.locator('[data-t="health"]').count() === 1);
  await page.click('[data-t="health"]');
  p.ok('Tipp auf den Knopf bittet die Hülle um Health', (await post(page)).some(x => x.art === 'health'));
  await page.evaluate(t => window.TrackHuelle.info({ app: '0.2', ablauf: t, health: 'an' }), ablauf);
  p.ok('Health verbunden: Knopf weg, Fußzeile sagt es', await page.locator('[data-t="health"]').count() === 0 && (await text(page, '#h-line')).includes('Health verbunden'));
  await page.evaluate(() => window.TrackHuelle.info({ app: '0.2', health: 'fehlt' }));
  p.ok('Health nicht freigegeben: kein Knopf', await page.locator('[data-t="health"]').count() === 0 && (await text(page, '#h-line')) === 'iPhone-App 0.2');

  await p.ende(o.browser, o.fehler);
});
