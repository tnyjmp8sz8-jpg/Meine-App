// Verbindung zur iPhone-Hülle (v60): Stand für Widget und Mitteilung, Läufe aus Health, Auskunft über die App.
// Seit v65 dazu: Konten für die Schnelleingabe (Stand und Auftrag) und die Sicherung von selbst.
// Die Hülle wird nachgestellt: window.webkit.messageHandlers.track sammelt, was die App schickt.
const { tag, monat, pad, oeffnen, text, bereich, gespeichert, pruefer, lauf } = require('./lib');

/* Dazu ein nachgestelltes visualViewport: So lässt sich die Tastatur vortäuschen (Höhe wird kleiner, dann „resize“). */
const huelle = () => { window.__vv = new EventTarget(); window.__vv.height = 844; window.__vv.offsetTop = 0; Object.defineProperty(window, 'visualViewport', { value: window.__vv, configurable: true });
  window.__post = []; window.webkit = { messageHandlers: { track: { postMessage: o => window.__post.push(JSON.parse(JSON.stringify(o))) } } }; };
const post = page => page.evaluate(() => window.__post);
const letzter = async page => (await post(page)).filter(m => m.art === 'stand').pop();
const wi = n => { const d = new Date(); d.setDate(d.getDate() + n); return (d.getDay() + 6) % 7; };
const nur = i => [0, 1, 2, 3, 4, 5, 6].map(x => x === i);
/* Zeitpunkt: 12 Uhr vor n Tagen */
const mittag = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d.getTime(); };

/* Die Teile zur Schnelleingabe mit Konten und zur Sicherung von selbst laufen mit gestellter Uhr: „heute“ ist dort der 15. des laufenden Monats, 12 Uhr.
   So hängt nichts vom Tag ab, an dem die Reihe läuft. Dort kein tag(): Das folgt der Uhr von Node. um(t, h, m) ist ein Zeitpunkt am Tag t des Monats. */
const M = monat(0), JM = M.slice(0, 4), am = t => M + '-' + pad(t), um = (t, h, m = 0) => new Date(+JM, +M.slice(5) - 1, t, h, m).getTime();
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const hhmm = t => pad(new Date(t).getHours()) + ':' + pad(new Date(t).getMinutes());
/* Daten dafür: eine tägliche Routine vom 1. (ohne Sicherung ist die am 15. seit 14 Tagen der älteste Eintrag, die Erinnerung steht also da) und eine Notiz.
   konten: [Kennung, Name, Stand in Cent]; der Stand ist am 15. um 10 Uhr eingetragen, Buchungen danach verändern ihn. tx: Buchungen des Jahres. */
const basis = (konten, tx) => {
  const MF = { acc: {}, bal: {}, balT: {} }, MY = {}; MF.bal[M] = {}; MF.balT[M] = {};
  (konten || []).forEach(k => { MF.acc[k[0]] = { n: k[1] }; if (k[2] != null) { MF.bal[M][k[0]] = k[2]; MF.balT[M][k[0]] = um(15, 10); } });
  if (tx) MY[JM] = { tx };
  return { S: { routines: [{ id: 'r1', name: 'Lesen', minutes: 30, days: Array(7).fill(true), created: am(1) }], running: null }, LY: {}, W: {}, MF, MY, T: {}, K: {},
    N: { folders: {}, tasks: {}, notes: { n1: { x: 'Erste Notiz', f: '', c: um(1, 9), m: um(1, 9) } } } };
};
/* Zwei Konten mit Vorgeschichte: Girokonto 1.000 €, Bargeld 50 €. Zuletzt benutzt ist Bargeld (b, am 15. um 9 Uhr), davor das Girokonto (a, am 14.).
   Nicht als „zuletzt benutzt“ zählen die Umbuchung (u, 9:30 Uhr) und die Buchung auf ein Konto, das es nicht mehr gibt (x, 9:45 Uhr).
   Alle vier liegen vor dem Stand von 10 Uhr und stecken schon in ihm: Vermögen 1.000 + 50 = 1.050 €. */
const zweiKonten = () => basis([['giro', 'Girokonto', 100000], ['bar', 'Bargeld', 5000]], {
  a: { d: am(14), a: 1000, k: 'out', c: 'essen', n: '', acc: 'giro', t: um(14, 9) }, b: { d: am(15), a: 500, k: 'out', c: 'essen', n: '', acc: 'bar', t: um(15, 9) },
  u: { d: am(15), a: 100, k: 'tr', c: '', n: '', acc: 'giro', to: 'bar', t: um(15, 9, 30) }, x: { d: am(15), a: 200, k: 'out', c: 'essen', n: '', acc: 'weg', t: um(15, 9, 45) } });
/* Ruft die Schnittstelle der App auf; fehlt der Weg (ältere Fassung der App), bricht die Reihe nicht ab */
const ruf = (page, name, arg) => page.evaluate(([n, a]) => { const f = window.TrackHuelle && window.TrackHuelle[n]; return f ? f(a) : 'fehlt'; }, [name, arg]);
const sich = page => page.evaluate(() => window.__post.filter(m => m.art === 'sicherung'));
/* Speicher leeren, Daten (und wahlweise den Zeitpunkt der letzten Sicherung) einspielen und neu laden: Die App startet frisch, die gesammelten Nachrichten beginnen von vorn */
const lade = async (page, d, merker) => {
  await page.evaluate(([d, b]) => { localStorage.clear(); if (d) localStorage.setItem('takt.v1', JSON.stringify(d)); if (b) localStorage.setItem('takt.backup', String(b)); }, [d, merker || 0]);
  await page.reload(); await page.waitForTimeout(450);
};
const tipp = async (page, sel) => { if (!(await page.$(sel))) return false; await page.click(sel); await page.waitForTimeout(120); return true; };
const merker = page => page.evaluate(() => localStorage.getItem('takt.backup'));
/* Zeile „Sicherung“ auf Heute: Erinnerung oben, Unterzeile, Aktionen der aufgeklappten Zeile, Wortlaut des Fehlers und Erklärung (leer, solange verborgen) */
const zeile = page => page.evaluate(() => { const t = q => { const e = document.querySelector(q); return e && !e.hidden ? e.innerText.replace(/\s+/g, ' ').trim() : ''; };
  return { oben: t('#v-heute .remind[data-h="export"]'), sub: t('#bk-msg'), akt: [...document.querySelectorAll('#v-heute [data-fold="sicherung"]')].map(b => [...b.closest('ul').querySelectorAll('.act')].map(a => a.innerText.trim()).join(' | ')).join(), fehler: t('#bk-err'), info: t('#info-bk'), i: document.querySelectorAll('#v-heute .entries .info').length }; });
/* Merkt sich das erste Element von Heute; gleich() sagt später, ob Heute seitdem neu gezeichnet wurde */
const marke = page => page.evaluate(() => { window.__m = document.querySelector('#v-heute').firstElementChild; });
const gleich = page => page.evaluate(() => document.querySelector('#v-heute').firstElementChild === window.__m);

/* Schnelleingabe mit Konten (v65, iPhone-App ab 0.5): Der Stand nennt die Konten und die Vorbelegung, ein Auftrag bringt die Art (Ausgabe oder Einnahme) und das Konto mit. */
async function schnelleingabe(p) {
  const o = await oeffnen({ skript: huelle, uhr: new Date(um(15, 12)) }), page = o.page;
  const stand = async d => { await lade(page, d); return (await letzter(page)) || {}; };
  const zeig = st => JSON.stringify([st.konten, st.konto]);

  /* Ein Konto: Es ist vorbelegt, wie im Blatt */
  let st = await stand(basis([['giro', 'Girokonto', 100000]]));
  p.ok('Stand mit einem Konto: es ist vorbelegt', JSON.stringify(st.konten) === '[{"id":"giro","n":"Girokonto"}]' && st.konto === 'giro', zeig(st));
  /* Mehrere Konten, noch nie eines benutzt: nach Namen sortiert (Bargeld, Depot, Girokonto, K…), nichts vorbelegt. Auch ein Konto ohne Stand (Depot) steht in der Liste.
     Der vierte Name hat 29 Buchstaben, ein Emoji und ein x: Die App kürzt Kontonamen beim Laden auf 30 Einheiten, also mitten im Emoji. Im Stand fällt das halbe Zeichen weg
     (mit ihm ließe sich der Stand in der iPhone-App nicht als Datei schreiben): Es bleiben die 29 Buchstaben. */
  st = await stand(basis([['giro', 'Girokonto', 100000], ['bar', 'Bargeld', 5000], ['dep', 'Depot'], ['lang', 'K'.repeat(29) + '😀x']]));
  const kn = st.konten || [];
  p.ok('Stand mit mehreren Konten ohne Vorgeschichte: nach Namen sortiert, nichts vorbelegt', kn.map(k => k.id).join() === 'bar,dep,giro,lang' && kn.slice(0, 3).map(k => k.n).join() === 'Bargeld,Depot,Girokonto' && st.konto === '', zeig(st));
  p.ok('Stand: Kontoname ohne halbes Zeichen', !!kn[3] && kn[3].n === 'K'.repeat(29), zeig(st));
  /* Mehrere Konten mit Vorgeschichte: vorbelegt ist das zuletzt benutzte, hier Bargeld (siehe zweiKonten) */
  st = await stand(zweiKonten());
  p.ok('Stand mit mehreren Konten und Vorgeschichte: das zuletzt benutzte ist vorbelegt', (st.konten || []).map(k => k.id).join() === 'bar,giro' && st.konto === 'bar', zeig(st));

  /* Aufträge aus der Schnelleingabe, einer nach dem anderen (der Zeitpunkt ist jeweils „jetzt“ nach der Uhr der Seite, also nach dem Stand von 10 Uhr). */
  await bereich(page, 'haushalt'); await tipp(page, '#v-haushalt [data-m="sub"][data-v="verm"]');
  const verm = async () => (await text(page, '#v-haushalt .hero h1')) + ' || ' + (await text(page, '#v-haushalt [data-m="bal"].two'));
  /* schickt einen Auftrag und liefert die Buchung, die daraus entstanden ist (die jüngste seit 12 Uhr) */
  const auftrag = async c => { await ruf(page, 'eingang', [c]); await page.waitForTimeout(40); return Object.values((await gespeichert(page)).MY[JM].tx).filter(t => t && t.t >= um(15, 12)).sort((a, b) => a.t - b.t).pop() || {}; };
  const z = t => JSON.stringify(t);
  p.ok('Ausgangslage: Vermögen 1.050 €', (await verm()) === '1.050 € || Bargeld 50 € | Girokonto 1.000 €', await verm());
  /* 1. Unbekannte Kennung (das Konto wurde inzwischen gelöscht): Es gilt die Vorbelegung, also Bargeld. 5 € Ausgabe: Bargeld 50 − 5 = 45, Vermögen 1.050 − 5 = 1.045. */
  let t = await auftrag({ id: 'b1', art: 'ausgabe', a: 500, acc: 'gibtsnicht' }), v = await verm();
  p.ok('Auftrag mit unbekanntem Konto: Vorbelegung (Bargeld), 5 € gehen dort ab', t.a === 500 && t.k === 'out' && t.acc === 'bar' && v === '1.045 € || Bargeld gerechnet seit Heute 45 € | Girokonto 1.000 €', z(t) + ' · ' + v);
  /* 2. Ohne die neuen Felder (Kurzbefehl, iPhone-App bis 0.4): wie bisher eine Ausgabe auf die Vorbelegung, „Sonstiges“. 3 €: Bargeld 45 − 3 = 42, Vermögen 1.042. */
  t = await auftrag({ id: 'b2', art: 'ausgabe', a: 300 }); v = await verm();
  p.ok('Auftrag ohne k und acc: wie bisher Ausgabe auf die Vorbelegung', t.a === 300 && t.k === 'out' && t.c === 'sonst' && t.acc === 'bar' && v === '1.042 € || Bargeld gerechnet seit Heute 42 € | Girokonto 1.000 €', z(t) + ' · ' + v);
  /* 3. Einnahme von 250 € auf das Girokonto: Girokonto 1.000 + 250 = 1.250, Vermögen 1.042 + 250 = 1.292. Eine Einnahme hat keine Kategorie: Das Wort „essen“ wird nicht ausgewertet
     (gespeichert wird wie bei einer Einnahme aus dem Blatt, die App liest das als „sonst“). */
  t = await auftrag({ id: 'b3', art: 'ausgabe', k: 'in', a: 25000, acc: 'giro', n: 'Erstattung', kat: 'essen' }); v = await verm();
  p.ok('Einnahme auf ein Konto: als Einnahme gebucht, ohne Kategorie', t.a === 25000 && t.k === 'in' && t.c === 'sonst' && t.acc === 'giro' && t.n === 'Erstattung' && t.d === am(15), z(t));
  p.ok('Einnahme erhöht den Stand des Kontos und das Vermögen um genau 250 €', v === '1.292 € || Bargeld gerechnet seit Heute 42 € | Girokonto gerechnet seit Heute 1.250 €', v);
  /* 4. Ausgabe von 40 € vom Girokonto, Kategorie aus dem Wort: Girokonto 1.250 − 40 = 1.210, Vermögen 1.292 − 40 = 1.252. Vorbelegt wäre inzwischen das Girokonto selbst;
     dass die Wahl zählt und nicht die Vorbelegung, zeigt Auftrag 6. */
  t = await auftrag({ id: 'b4', art: 'ausgabe', k: 'out', a: 4000, acc: 'giro', kat: 'essen' }); v = await verm();
  p.ok('Ausgabe von einem Konto senkt dessen Stand und das Vermögen um genau 40 €', t.k === 'out' && t.c === 'essen' && t.acc === 'giro' && v === '1.252 € || Bargeld gerechnet seit Heute 42 € | Girokonto gerechnet seit Heute 1.210 €', z(t) + ' · ' + v);
  /* 5. Leeres acc heißt ausdrücklich „Kein Konto“: Die Buchung trägt keines, kein Stand ändert sich (obwohl das Girokonto vorbelegt wäre). */
  t = await auftrag({ id: 'b5', art: 'ausgabe', a: 700, acc: '' }); v = await verm();
  p.ok('Auftrag mit leerem Konto: ohne Konto gebucht, kein Stand ändert sich', t.a === 700 && !t.acc && v === '1.252 € || Bargeld gerechnet seit Heute 42 € | Girokonto gerechnet seit Heute 1.210 €', z(t) + ' · ' + v);
  await page.waitForTimeout(450); st = (await letzter(page)) || {};
  p.ok('Stand danach: vorbelegt ist jetzt das Girokonto (zuletzt benutzt)', st.konto === 'giro', zeig(st));
  /* 6. Gewähltes Konto gegen die Vorbelegung, und ein unbekanntes k gilt als Ausgabe: 1 € vom Bargeld, obwohl das Girokonto vorbelegt wäre. Bargeld 42 − 1 = 41, Vermögen 1.251. */
  t = await auftrag({ id: 'b6', art: 'ausgabe', k: 'quatsch', a: 100, acc: 'bar' }); v = await verm();
  p.ok('gewähltes Konto zählt, nicht die Vorbelegung; unbekanntes k ist eine Ausgabe', t.k === 'out' && t.acc === 'bar' && v === '1.251 € || Bargeld gerechnet seit Heute 41 € | Girokonto gerechnet seit Heute 1.210 €', z(t) + ' · ' + v);
  await o.browser.close();
  return o.fehler;
}

/* Sicherung von selbst (v65, iPhone-App ab 0.5): Die iPhone-App meldet sich in info() mit sicherung; dann schickt die App nach Änderungen den Text der Sicherung. */
async function vonSelbst(p) {
  const fehler = [], D = zweiKonten(), S0 = { t: 0, ordner: '', fehler: '' };
  const aendern = (page, id, x) => ruf(page, 'eingang', [{ id, art: 'notiz', x }]);

  /* --- Ohne Hülle (Browser) ist die Zeile wie in v64: zwei Aktionen, kein „i“, keine Zeile zum Ordner. Die Sicherung ist fällig (Routine vom 1., heute der 15.):
         Der Satz steht in der Erinnerung oben und nicht noch einmal in der Zeile. --- */
  let o = await oeffnen({ daten: D, uhr: new Date(um(15, 12)) }), page = o.page;
  await tipp(page, '#v-heute [data-fold="sicherung"]'); let zl = await zeile(page);
  p.ok('ohne Hülle: Klappzeile „Sicherung“ wie in v64', zl.akt === 'Sicherung speichern | Sicherung einlesen' && zl.i === 0 && zl.sub === '' && zl.oben === 'Noch keine Sicherung gespeichert Jetzt sichern' && await page.evaluate(() => !document.querySelector('#bk-ord, #bk-err, #info-bk, #v-heute .irow')), JSON.stringify(zl));
  fehler.push(...o.fehler); await o.browser.close();

  o = await oeffnen({ skript: huelle, uhr: new Date(um(15, 12)) }); page = o.page;
  /* --- iPhone-App bis 0.4: info() ohne sicherung. Dann geht nie eine Sicherung hinaus, auch nicht nach einer Änderung, nach 25 Sekunden oder auf sichern(); die Zeile bleibt wie in v64. --- */
  await lade(page, D);
  await ruf(page, 'info', { app: '0.4', ablauf: um(22, 9), health: 'fehlt' });
  await aendern(page, 'x1', 'Eine Änderung'); await page.clock.runFor(25000); await ruf(page, 'sichern'); await page.clock.runFor(25000);
  await tipp(page, '#v-heute [data-fold="sicherung"]'); zl = await zeile(page);
  p.ok('iPhone-App 0.4 (info ohne sicherung): nie eine Nachricht „sicherung“', (await sich(page)).length === 0, JSON.stringify((await post(page)).map(m => m.art)));
  p.ok('iPhone-App 0.4: Klappzeile „Sicherung“ wie in v64', zl.akt === 'Sicherung speichern | Sicherung einlesen' && zl.i === 0 && zl.sub === '' && zl.oben === 'Noch keine Sicherung gespeichert Jetzt sichern', JSON.stringify(zl));

  /* --- iPhone-App 0.5, erste Auskunft: Es ist schon etwas offen (eine Änderung vor der Auskunft), also geht die Sicherung sofort hinaus, genau einmal. --- */
  await lade(page, D);
  await aendern(page, 's1', 'Vor der Auskunft'); await page.clock.runFor(25000);
  p.ok('vor der Auskunft der iPhone-App geht nichts hinaus', (await sich(page)).length === 0);
  await ruf(page, 'info', { app: '0.5', ablauf: um(22, 9), health: 'fehlt', sicherung: S0 });
  let s = await sich(page), s0 = s[0] || { name: '', text: '{}' }, b = JSON.parse(s0.text), g = await gespeichert(page);
  p.ok('erste Auskunft mit sicherung: Offenes geht sofort hinaus, genau einmal', s.length === 1, String(s.length));
  p.ok('Sicherung: der Name passt zum Tag', s0.name === 'track-sicherung-' + am(15) + '.json', s0.name);
  p.ok('Sicherung: der Text ist die Sicherung (Kennung, Routinen, alle Gruppen wie gespeichert)', b.app === 'takt' && b.v === 1 && !!b.exported && JSON.stringify(b.routines) === JSON.stringify(g.S.routines) && ['LY', 'W', 'MF', 'MY', 'T', 'K', 'N'].every(k => JSON.stringify(b[k]) === JSON.stringify(g[k]))
    && Object.values((b.N || {}).notes || {}).some(n => n && n.x === 'Vor der Auskunft'), s0.text.slice(0, 160));
  zl = await zeile(page);
  p.ok('noch keine Sicherung gemeldet: Erinnerung steht noch, die Zeile sagt „Wird von selbst gesichert“', zl.oben === 'Noch keine Sicherung gespeichert Jetzt sichern' && zl.sub === 'Wird von selbst gesichert', JSON.stringify(zl));

  /* --- gesichert(): Die iPhone-App meldet die geschriebene Datei. takt.backup wird der gemeldete Zeitpunkt, die Erinnerung verschwindet, die Zeile nennt Tag und Uhrzeit.
         Der neue Stand nennt die nächste Fälligkeit: 15. + 7 Tage = der 22. Es geht keine weitere Sicherung hinaus, auch nicht nach einer Minute (kein Hin und Her). --- */
  const T1 = await page.evaluate(() => Date.now());
  await ruf(page, 'gesichert', { t: T1, ordner: '', fehler: '' }); zl = await zeile(page);
  p.ok('gesichert(): takt.backup ist der gemeldete Zeitpunkt', (await merker(page)) === String(T1), String(await merker(page)));
  p.ok('gesichert(): die Erinnerung verschwindet, die Zeile nennt den Zeitpunkt', zl.oben === '' && zl.sub === 'Von selbst gesichert · heute, ' + hhmm(T1), JSON.stringify(zl));
  await page.waitForTimeout(450); let st = (await letzter(page)) || {};
  p.ok('gesichert(): neuer Stand, die Mitteilung „Sicherung fällig“ rückt auf den 22.', st.sicherung === am(22), st.sicherung);
  await page.clock.runFor(60000);
  p.ok('gesichert() löst keine weitere Sicherung aus', (await sich(page)).length === 1, String((await sich(page)).length));

  /* --- Höchstens eine je 20 Sekunden: drei Änderungen nach 0, 8 und 16 Sekunden. Die Uhr läuft seit der ersten und startet nicht neu:
         nach 16 Sekunden noch nichts, nach 22 Sekunden genau eine, mit allen drei Änderungen. Eine vierte Änderung gleich danach wartet wieder 20 Sekunden:
         nach weiteren 15 Sekunden (37) nichts, nach weiteren 6 (43) die nächste. Danach, ohne Änderung, nichts mehr. --- */
  await aendern(page, 's2', 'Zwei'); await page.clock.runFor(8000); await aendern(page, 's3', 'Drei'); await page.clock.runFor(8000); await aendern(page, 's4', 'Vier');
  p.ok('drei Änderungen in 16 Sekunden: noch keine Sicherung', (await sich(page)).length === 1, String((await sich(page)).length));
  await page.clock.runFor(6000); s = await sich(page);
  p.ok('20 Sekunden nach der ersten Änderung: genau eine Sicherung, mit allen dreien', s.length === 2 && ['Zwei', 'Drei', 'Vier'].every(x => s[1].text.includes('"x":"' + x + '"')), String(s.length));
  await aendern(page, 's5', 'Fünf'); await page.clock.runFor(15000);
  p.ok('eine Änderung gleich danach wartet wieder 20 Sekunden', (await sich(page)).length === 2, String((await sich(page)).length));
  await page.clock.runFor(6000);
  p.ok('… und geht dann hinaus', (await sich(page)).length === 3, String((await sich(page)).length));
  await page.clock.runFor(60000);
  p.ok('ohne weitere Änderung kommt keine Sicherung mehr', (await sich(page)).length === 3, String((await sich(page)).length));

  /* --- sichern(): Die iPhone-App ruft das, wenn sie verlassen wird. Es schickt sofort und nur, wenn etwas offen ist; die Uhr schickt danach nicht noch einmal. --- */
  await ruf(page, 'sichern');
  p.ok('sichern() ohne Offenes schickt nichts', (await sich(page)).length === 3, String((await sich(page)).length));
  await aendern(page, 's6', 'Sechs'); await ruf(page, 'sichern'); s = await sich(page);
  p.ok('sichern() mit Offenem schickt sofort', s.length === 4 && s[3].text.includes('"x":"Sechs"'), String(s.length));
  await ruf(page, 'sichern'); await page.clock.runFor(25000);
  p.ok('danach ist nichts mehr offen: weder ein zweites sichern() noch die Uhr schicken noch einmal', (await sich(page)).length === 4, String((await sich(page)).length));

  /* --- „Rückgängig“ lädt den Stand an saveLocal() vorbei und ist trotzdem eine Änderung. Notiz n1 im Widget abhaken und sichern: Die Sicherung ist ohne sie, nichts ist offen.
         Dann „Rückgängig“ und wieder sichern(): Es geht eine Sicherung hinaus, mit der Notiz. --- */
  await ruf(page, 'eingang', [{ id: 's7', art: 'notizWeg', nid: 'n1' }]); await ruf(page, 'sichern'); s = await sich(page);
  const ohne = s.length === 5 && !JSON.parse(s[4].text).N.notes.n1;
  await tipp(page, '#toast button'); await ruf(page, 'sichern'); s = await sich(page);
  p.ok('„Rückgängig“ merkt die Änderung: die nächste Sicherung enthält die Notiz wieder', ohne && s.length === 6 && (JSON.parse(s[5].text).N.notes.n1 || {}).x === 'Erste Notiz', ohne + ' · ' + s.length);

  /* --- Fehler beim Schreiben: fehler ist gefüllt, t ist die Zeit der letzten gelungenen Sicherung (T1). takt.backup bleibt T1. Die Zeile sagt, dass etwas nicht ging und von wann die letzte Sicherung ist;
         aufgeklappt steht darunter der Wortlaut. Von selbst geht nichts noch einmal hinaus (auch nicht nach einer Minute), offen bleibt es aber: Das nächste sichern() versucht es wieder.
         Heute wird bei alldem nicht neu gezeichnet (keine Erinnerung zu entfernen): Nur die Texte der Zeile ändern sich. --- */
  await tipp(page, '#v-heute [data-fold="sicherung"]'); await marke(page);
  await ruf(page, 'gesichert', { t: T1, ordner: '', fehler: 'Auf dem iPhone ist kein Platz mehr.' }); zl = await zeile(page);
  p.ok('Fehler: takt.backup bleibt, die Zeile sagt, dass etwas nicht ging und von wann die letzte Sicherung ist', (await merker(page)) === String(T1) && zl.sub === 'Beim Sichern ging etwas nicht · letzte Sicherung heute, ' + hhmm(T1) && zl.oben === '', JSON.stringify(zl));
  p.ok('Fehler: aufgeklappt steht der Wortlaut darunter', zl.fehler === 'Auf dem iPhone ist kein Platz mehr.', JSON.stringify(zl));
  await page.clock.runFor(60000);
  p.ok('Fehler: von selbst geht nichts noch einmal hinaus', (await sich(page)).length === 6, String((await sich(page)).length));
  await ruf(page, 'sichern');
  p.ok('Fehler: die Sicherung bleibt offen, das nächste sichern() versucht es wieder', (await sich(page)).length === 7, String((await sich(page)).length));
  const T2 = await page.evaluate(() => Date.now());
  await ruf(page, 'gesichert', { t: T2, ordner: '', fehler: '' }); zl = await zeile(page);
  p.ok('danach gelungen: Wortlaut weg, Zeitpunkt und takt.backup neu', zl.fehler === '' && zl.sub === 'Von selbst gesichert · heute, ' + hhmm(T2) && (await merker(page)) === String(T2), JSON.stringify(zl));
  await ruf(page, 'sichern');
  p.ok('nach der gelungenen Sicherung ist nichts mehr offen', (await sich(page)).length === 7, String((await sich(page)).length));
  /* Ein älterer Zeitpunkt stellt takt.backup nie zurück: Fehler, zuletzt gelungen gestern um 20:56 Uhr → die Zeile nennt gestern, takt.backup bleibt T2. Ohne jede gelungene (t = 0) fehlt „zuletzt“. */
  await ruf(page, 'gesichert', { t: um(14, 20, 56), ordner: '', fehler: 'Kein Platz.' }); zl = await zeile(page);
  p.ok('Fehler mit älterem Zeitpunkt: „letzte Sicherung gestern, 20:56“, takt.backup wird nicht zurückgestellt', zl.sub === 'Beim Sichern ging etwas nicht · letzte Sicherung gestern, 20:56' && (await merker(page)) === String(T2), JSON.stringify(zl) + ' · ' + (await merker(page)));
  await ruf(page, 'gesichert', { t: 0, ordner: '', fehler: 'Kein Platz.' }); zl = await zeile(page);
  p.ok('Fehler ohne jede gelungene Sicherung: nur der Satz', zl.sub === 'Beim Sichern ging etwas nicht', JSON.stringify(zl));
  p.ok('Meldungen der iPhone-App zeichnen Heute nicht neu, sie ändern nur die Texte der Zeile', await gleich(page));

  /* --- Ein Weg für Hand und von selbst: „Sicherung speichern“ (hier über das Teilen) gibt denselben Text wie die Sicherung von selbst, bis auf den Zeitpunkt des Schreibens. --- */
  await aendern(page, 's8', 'Acht'); await ruf(page, 'sichern'); s = await sich(page);
  await page.evaluate(() => { const mm = window.matchMedia.bind(window); window.matchMedia = q => q === '(pointer:coarse)' ? { matches: true } : mm(q);
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', { value: async d => { window.__geteilt = await d.files[0].text(); }, configurable: true }); });
  await tipp(page, '#v-heute .act[data-h="export"]'); await page.waitForTimeout(200);
  const ohneZeit = t => { let x = {}; try { x = JSON.parse(t); } catch (e) {} delete x.exported; return JSON.stringify(x); };
  const hand = await page.evaluate(() => window.__geteilt || '');
  p.ok('von Hand und von selbst: derselbe Text', s.length === 8 && hand.length > 100 && ohneZeit(hand) === ohneZeit(s[7].text), s.length + ' · ' + hand.slice(0, 80));
  /* Nach dem Speichern von Hand nennt die Zeile die Datei. Die nächste Meldung der iPhone-App ist neuer: Dann steht dort wieder, wann von selbst gesichert wurde. */
  zl = await zeile(page); const vonHand = zl.sub;
  await ruf(page, 'gesichert', { t: T2, ordner: '', fehler: '' }); zl = await zeile(page);
  p.ok('nach „Sicherung speichern“ nennt die Zeile die Datei, nach der nächsten Meldung wieder die Sicherung von selbst', vonHand === 'Sicherung gespeichert: track-sicherung-' + am(15) + '.json' && zl.sub === 'Von selbst gesichert · heute, ' + hhmm(T2), vonHand + ' · ' + zl.sub);

  /* --- Erste Auskunft, nichts offen: Maßgeblich ist, ob die letzte Sicherung vor heute 0 Uhr liegt. Eine Millisekunde vor Mitternacht → sie geht sofort hinaus (einmal, auch wenn die
         Auskunft noch einmal kommt). Genau Mitternacht → nichts; erst eine Änderung und 20 Sekunden bringen die nächste. Der gemeldete Zeitpunkt wird takt.backup:
         Die Erinnerung steht dann nicht mehr da (Sicherung von gestern, fällig erst in 6 Tagen). --- */
  await lade(page, D);
  await ruf(page, 'info', { app: '0.5', sicherung: { t: um(15, 0) - 1, ordner: '', fehler: '' } }); await ruf(page, 'info', { app: '0.5', sicherung: { t: um(15, 0) - 1, ordner: '', fehler: '' } });
  zl = await zeile(page);
  p.ok('erste Auskunft, letzte Sicherung von gestern (23:59 Uhr): eine Sicherung geht sofort hinaus, nur einmal', (await sich(page)).length === 1, String((await sich(page)).length));
  p.ok('Auskunft: der gemeldete Zeitpunkt wird takt.backup, die Erinnerung entfällt', (await merker(page)) === String(um(15, 0) - 1) && zl.oben === '' && zl.sub === 'Von selbst gesichert · gestern, 23:59', JSON.stringify(zl));
  await lade(page, D);
  await ruf(page, 'info', { app: '0.5', sicherung: { t: um(15, 0), ordner: '', fehler: '' } }); await ruf(page, 'sichern'); await page.clock.runFor(25000);
  p.ok('erste Auskunft, letzte Sicherung von heute (0:00 Uhr), nichts offen: es geht nichts hinaus', (await sich(page)).length === 0, String((await sich(page)).length));
  await aendern(page, 'm1', 'Später'); await page.clock.runFor(21000);
  p.ok('… erst eine Änderung und 20 Sekunden bringen die nächste', (await sich(page)).length === 1, String((await sich(page)).length));
  /* Älter als gestern steht das Datum da: der 3. des Monats */
  await ruf(page, 'info', { app: '0.5', sicherung: { t: um(3, 7, 5), ordner: '', fehler: '' } }); zl = await zeile(page);
  p.ok('ältere Sicherung: die Zeile nennt das Datum', zl.sub === 'Von selbst gesichert · 3. ' + MONATE[+M.slice(5) - 1] + ' ' + JM, zl.sub);

  /* --- Leere App: Sie sichert nie, sonst überschriebe sie nach einem verlorenen Speicher die gute Datei des Tages. Weder die erste Auskunft noch sichern() noch die Uhr schicken etwas.
         Mit dem ersten Eintrag ändert sich das: 20 Sekunden später geht die Sicherung hinaus. --- */
  await lade(page, null);
  await ruf(page, 'info', { app: '0.5', sicherung: S0 }); await ruf(page, 'sichern'); await page.clock.runFor(25000); zl = await zeile(page);
  p.ok('leere App: es geht nie eine Sicherung hinaus', (await sich(page)).length === 0 && zl.sub === 'Wird von selbst gesichert', (await sich(page)).length + ' · ' + JSON.stringify(zl));
  await lade(page, { S: { routines: [], running: null }, LY: {}, W: {}, MF: {}, MY: {}, T: {}, K: {}, N: {} });
  await ruf(page, 'info', { app: '0.5', sicherung: S0 }); await ruf(page, 'sichern'); await page.clock.runFor(25000);
  p.ok('leere App mit leerem Speicher-Eintrag: ebenso', (await sich(page)).length === 0, String((await sich(page)).length));
  await aendern(page, 'l1', 'Erster Eintrag'); await page.clock.runFor(21000); s = await sich(page);
  p.ok('nach dem ersten Eintrag: 20 Sekunden später geht die Sicherung hinaus', s.length === 1 && s[0].text.includes('"x":"Erster Eintrag"'), String(s.length));
  /* Jede Gruppe für sich zählt als „es gibt Daten“: Mit nur diesem einen Eintrag geht bei der ersten Auskunft (noch keine Sicherung) genau eine hinaus. */
  const leer = () => ({ S: { routines: [], running: null }, LY: {}, W: {}, MF: {}, MY: {}, T: {}, K: {}, N: {} });
  const gruppen = {
    'Routine': d => { d.S.routines.push({ id: 'r1', name: 'Lesen', minutes: 30, days: Array(7).fill(true), created: am(1) }); },
    'Protokoll einer Routine': d => { d.LY[JM] = {}; d.LY[JM][am(2)] = { weg: { s: 600, d: 1 } }; },
    'Gewicht': d => { d.W = { entries: {} }; d.W.entries[am(3)] = 80; },
    'Zielgewicht': d => { d.W = { goal: 75, goalFrom: 80, entries: {} }; },
    'fester Posten': d => { d.MF = { fixed: { f1: { name: 'Miete', amount: 80000, kind: 'fix', every: 1, from: M, to: null } } }; },
    'Budget': d => { d.MF = { budgets: { essen: 30000 } }; },
    'Konto ohne Stand': d => { d.MF = { acc: { giro: { n: 'Girokonto' } } }; },
    'Sparziel': d => { d.MF = { goals: { g1: { n: 'Urlaub', amount: 100000, acc: null } } }; },
    'Buchung': d => { d.MY[JM] = { tx: { a: { d: am(4), a: 1200, k: 'out', c: 'essen', n: '' } } }; },
    'Lauf': d => { d.T = { runs: { a: { d: am(5), m: 5000, s: 1500, hr: null, k: 'out' } } }; },
    'Übung': d => { d.K = { ex: { e1: { n: 'Bankdrücken' } } }; },
    'Plan': d => { d.K = { plans: { p1: { n: 'Oberkörper', items: [] } } }; },
    'Aufgabe': d => { d.N = { tasks: { t1: { t: 'Abgeben', f: '', d: null, done: null, c: um(1, 9) } } }; },
    'Notiz': d => { d.N = { notes: { n1: { x: 'Merken', f: '', c: um(1, 9), m: um(1, 9) } } }; }
  };
  const nicht = [];
  for (const name in gruppen) { const d = leer(); gruppen[name](d); await lade(page, d); await ruf(page, 'info', { app: '0.5', sicherung: S0 }); if ((await sich(page)).length !== 1) nicht.push(name); }
  p.ok('jede Gruppe für sich zählt als Daten (' + Object.keys(gruppen).length + ' Fälle)', !nicht.length, 'keine Sicherung bei: ' + nicht.join(', '));

  /* --- Klappzeile mit Sicherung von selbst. Letzte Sicherung heute um 11 Uhr, nichts offen: keine Erinnerung, es geht nichts hinaus. --- */
  const S11 = { t: um(15, 11), ordner: '', fehler: '' }, ordner = async () => (await post(page)).filter(m => m.art === 'ordner').length;
  await lade(page, D);
  await ruf(page, 'info', { app: '0.5', sicherung: S11 });
  p.ok('Zeile zu: „Sicherung“ mit „Von selbst gesichert · heute, 11:00“', (await text(page, '#v-heute [data-fold="sicherung"]')) === 'Sicherung Von selbst gesichert · heute, 11:00' && (await zeile(page)).oben === '', await text(page, '#v-heute [data-fold="sicherung"]'));
  await tipp(page, '#v-heute [data-fold="sicherung"]'); zl = await zeile(page);
  p.ok('Zeile auf: speichern, einlesen und „Ordner in iCloud wählen“ mit einem „i“; Erklärung und Fehler verborgen', zl.akt === 'Sicherung speichern | Sicherung einlesen | Ordner in iCloud wählen' && zl.i === 1 && zl.info === '' && zl.fehler === '', JSON.stringify(zl));
  await tipp(page, '#v-heute [data-h="ordner"]');
  p.ok('Tipp auf die Zeile zum Ordner schickt „ordner“ (einmal, keine Sicherung)', (await ordner()) === 1 && (await sich(page)).length === 0, (await ordner()) + ' · ' + (await sich(page)).length);
  await tipp(page, '#v-heute [data-info="bk"]'); zl = await zeile(page);
  p.enthaelt('Tipp auf das „i“ zeigt die Erklärung', zl.info, ['bei jeder Änderung von selbst', '„Dateien“ unter „Auf meinem iPhone › Track.“', 'je Tag eine Datei, die neuesten 14 bleiben', 'Wird die App gelöscht', 'Ordner in iCloud Drive', '„Sicherung einlesen“']);
  p.ok('das „i“ wählt keinen Ordner', (await ordner()) === 1, String(await ordner()));
  /* Der Ordner ist gewählt: Die iPhone-App meldet seinen Namen. Die Zeile nennt ihn an Ort und Stelle, die offene Erklärung bleibt stehen, Heute wird nicht neu gezeichnet. */
  await marke(page); await ruf(page, 'gesichert', Object.assign({}, S11, { ordner: 'Track-Sicherung' })); zl = await zeile(page);
  p.ok('Ordner gewählt: die Zeile heißt „Ordner: Track-Sicherung“, die Erklärung bleibt offen, nichts wird neu gezeichnet', zl.akt.endsWith('| Ordner: Track-Sicherung') && zl.info !== '' && await gleich(page), JSON.stringify(zl));
  await tipp(page, '#v-heute [data-h="ordner"]');
  p.ok('ein Tipp auf „Ordner: …“ wählt neu', (await ordner()) === 2, String(await ordner()));
  /* info() kommt bei jedem Zurückkommen in die App: Mit unveränderter sicherung wird Heute nicht neu gezeichnet, mit veränderter schon (die Zeile bleibt dabei offen).
     Ein Ordnername mit Zeichen aus HTML steht als Text da, beim Zeichnen wie beim Nachführen an Ort und Stelle. */
  await ruf(page, 'info', { app: '0.5', sicherung: Object.assign({}, S11, { ordner: 'Track-Sicherung' }) });
  p.ok('info() mit unveränderter sicherung zeichnet Heute nicht neu', await gleich(page));
  const frech = '<b>Fett</b> & "Co"';
  await ruf(page, 'info', { app: '0.5', sicherung: Object.assign({}, S11, { ordner: frech }) }); zl = await zeile(page);
  p.ok('info() mit veränderter sicherung zeichnet Heute neu, die Zeile bleibt offen', !(await gleich(page)) && zl.akt.endsWith('| Ordner: ' + frech), JSON.stringify(zl));
  await ruf(page, 'gesichert', Object.assign({}, S11, { ordner: frech + '!', fehler: '<i>Fehler</i>' })); zl = await zeile(page);
  p.ok('Ordnername und Fehler stehen als Text da, nicht als HTML', zl.akt.endsWith('| Ordner: ' + frech + '!') && zl.fehler === '<i>Fehler</i>' && await page.evaluate(() => !document.querySelector('#bk-ord b, #bk-err i')), JSON.stringify(zl));
  p.ok('es ging bei alldem keine Sicherung hinaus', (await sich(page)).length === 0, String((await sich(page)).length));

  /* --- Blatt offen: Die Meldung zeichnet Heute nicht neu (der Nutzer tippt gerade), sie ändert nur den Text der Zeile. Die Erinnerung verschwindet, sobald das Blatt zugeht. --- */
  await lade(page, D);
  await ruf(page, 'info', { app: '0.5', sicherung: S0 });
  await ruf(page, 'neu', 'notiz'); await page.waitForTimeout(150); await marke(page);
  const T3 = await page.evaluate(() => Date.now());
  await ruf(page, 'gesichert', { t: T3, ordner: '', fehler: '' });
  const offen = await page.evaluate(() => ({ blatt: document.querySelector('#nsheet').open, oben: !!document.querySelector('#v-heute .remind[data-h="export"]'), sub: document.querySelector('#bk-msg').textContent }));
  p.ok('Blatt offen: Heute wird nicht neu gezeichnet, nur der Text der Zeile ändert sich', offen.blatt && offen.oben && offen.sub === 'Von selbst gesichert · heute, ' + hhmm(T3) && await gleich(page), JSON.stringify(offen));
  await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  p.ok('Blatt zu: die Erinnerung ist weg', await page.evaluate(() => !document.querySelector('#nsheet').open && !document.querySelector('#v-heute .remind[data-h="export"]')));
  /* --- Nur der zusätzliche Ordner ging nicht: Die iPhone-App meldet dann den neuen Zeitpunkt (die Datei liegt auf dem iPhone) und trotzdem einen Fehler.
         Die Sicherung zählt: takt.backup ist neu, die Erinnerung verschwindet. Die Zeile weist auf den Fehler hin, aufgeklappt steht der Wortlaut. --- */
  await lade(page, D);
  await ruf(page, 'info', { app: '0.5', sicherung: S0 });
  const T4 = await page.evaluate(() => Date.now()), nurOrdner = 'In „Track-Sicherung“ ließ sich nicht sichern. Auf dem iPhone ist die Sicherung gespeichert.';
  await ruf(page, 'gesichert', { t: T4, ordner: 'Track-Sicherung', fehler: nurOrdner }); await tipp(page, '#v-heute [data-fold="sicherung"]'); zl = await zeile(page);
  p.ok('nur der Ordner ging nicht: die Sicherung zählt, die Zeile weist auf den Fehler hin', (await merker(page)) === String(T4) && zl.oben === '' && zl.sub === 'Beim Sichern ging etwas nicht · letzte Sicherung heute, ' + hhmm(T4) && zl.fehler === nurOrdner && zl.akt.endsWith('| Ordner: Track-Sicherung'), JSON.stringify(zl));
  fehler.push(...o.fehler); await o.browser.close();

  /* --- 320 px, hell: aufgeklappt mit langem Ordnernamen, Fehler und offener Erklärung. Nichts ist seitlich wischbar, nichts ragt hinaus; der lange Name endet mit drei Punkten
         in einer Zeile (sein eigener Kasten #bk-ord ist breiter, wird aber von der Zeile abgeschnitten und zählt deshalb nicht).
         Die Tippfläche des „i“ ist 40 px breit und hoch (14 px Symbol, ringsum 13 px) und reicht nicht in die Zeile darüber. Geprüft wird 19 px um die Mitte:
         in beide Richtungen, dazu drei Ecken; die Ecke unten rechts schneidet die Rundung der Liste ab. --- */
  o = await oeffnen({ skript: huelle, uhr: new Date(um(15, 12)), breite: 320, hell: true }); page = o.page;
  await lade(page, D);
  await ruf(page, 'info', { app: '0.5', sicherung: { t: um(15, 11), ordner: 'Sicherungen von Track auf meinem iCloud Drive für alle Fälle', fehler: 'Der Ordner „Sicherungen von Track“ ist nicht erreichbar.' } });
  await tipp(page, '#v-heute [data-fold="sicherung"]'); await page.evaluate(() => { const sc = document.querySelector('#scroll'); sc.scrollTop = sc.scrollHeight; }); await tipp(page, '#v-heute [data-info="bk"]');
  await page.evaluate(() => { const sc = document.querySelector('#scroll'); sc.scrollTop = sc.scrollHeight; }); await page.waitForTimeout(150);
  const eng = await page.evaluate(() => {
    const sc = document.querySelector('#scroll'), ul = document.querySelector('#v-heute [data-fold="sicherung"]').closest('ul'), i = ul.querySelector('.info'), ord = ul.querySelector('[data-h="ordner"]'), lesen = ul.querySelector('[data-h="import"]');
    if (!i || !ord) return { fehlt: true };
    const r = i.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, bei = (x, y) => { const e = document.elementFromPoint(x, y); return e ? e.closest('button') : null; };
    const raus = [ul, ...ul.querySelectorAll('*'), ...document.querySelectorAll('#bk-err, #info-bk')].filter(e => { const q = e.getBoundingClientRect(); return e.id !== 'bk-ord' && q.width && (q.left < -0.5 || q.right > window.innerWidth + 0.5); }).length;
    const name = document.querySelector('#bk-ord').parentElement;
    return { wischbar: sc.scrollWidth > sc.clientWidth || document.documentElement.scrollWidth > window.innerWidth, raus, hoehe: Math.round(ord.getBoundingClientRect().height), punkte: name.scrollWidth > name.clientWidth,
      ecken: [[0, 0], [-19, 0], [19, 0], [0, -19], [0, 19], [-19, -19], [19, -19], [-19, 19]].every(d => bei(cx + d[0], cy + d[1]) === i), links: bei(cx - 22, cy) === ord, drueber: bei(cx, cy - 22) === lesen,
      texte: [document.querySelector('#bk-err'), document.querySelector('#info-bk')].every(e => !e.hidden && e.getBoundingClientRect().height > 10) };
  });
  p.ok('320 px: nichts seitlich wischbar, nichts ragt hinaus, Fehler und Erklärung sind zu sehen', !eng.fehlt && !eng.wischbar && eng.raus === 0 && eng.texte, JSON.stringify(eng));
  p.ok('320 px: langer Ordnername in einer Zeile mit drei Punkten (Zeile 40 px hoch)', !eng.fehlt && eng.hoehe === 40 && eng.punkte, JSON.stringify(eng));
  p.ok('320 px: Tippfläche des „i“ ist 40 px groß, daneben beginnt die Zeile zum Ordner, darüber „Sicherung einlesen“', !eng.fehlt && eng.ecken && eng.links && eng.drueber, JSON.stringify(eng));
  fehler.push(...o.fehler); await o.browser.close();
  return fehler;
}

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
  /* Kein Konto angelegt: Die Schnelleingabe der iPhone-App bekommt eine leere Liste und keine Vorbelegung */
  p.ok('Stand ohne Konten: leere Liste, keine Vorbelegung', Array.isArray(st.konten) && st.konten.length === 0 && st.konto === '', JSON.stringify([st.konten, st.konto]));

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

  o.fehler.push(...await schnelleingabe(p), ...await vonSelbst(p));
  await p.ende(o.browser, o.fehler);
});
