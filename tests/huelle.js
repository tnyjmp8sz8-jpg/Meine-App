// Verbindung zur iPhone-Hülle (v60): Stand für Widget und Mitteilung, Läufe aus Health, Auskunft über die App.
// Seit v65 dazu: Konten für die Schnelleingabe (Stand und Auftrag) und die Sicherung von selbst.
// Die Hülle wird nachgestellt: window.webkit.messageHandlers.track sammelt, was die App schickt.
const { tag, monat, pad, oeffnen, text, bereich, gespeichert, pruefer, lauf } = require('./lib');

/* Dazu ein nachgestelltes visualViewport: So lässt sich die Tastatur vortäuschen (Höhe wird kleiner, dann „resize“). */
const huelle = () => { window.__vv = new EventTarget(); window.__vv.height = 844; window.__vv.offsetTop = 0; Object.defineProperty(window, 'visualViewport', { value: window.__vv, configurable: true });
  window.__post = []; window.webkit = { messageHandlers: { track: { postMessage: o => window.__post.push(JSON.parse(JSON.stringify(o))) } } }; };
/* Dieselbe Hülle, die sich jede Nachricht „sicherung“ zusätzlich in sessionStorage merkt: So ist nach einem Neuladen der Seite zu sehen, was davor noch hinausging. */
const huelleMerkt = () => { window.__vv = new EventTarget(); window.__vv.height = 844; window.__vv.offsetTop = 0; Object.defineProperty(window, 'visualViewport', { value: window.__vv, configurable: true });
  window.__post = []; window.webkit = { messageHandlers: { track: { postMessage: o => { o = JSON.parse(JSON.stringify(o)); window.__post.push(o);
    if (o.art === 'sicherung') sessionStorage.setItem('t.sich', JSON.stringify(JSON.parse(sessionStorage.getItem('t.sich') || '[]').concat(o.text))); } } } }; };
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
/* Zeile „Sicherung“ auf Heute: Erinnerung oben (oben; art sagt, wohin ihr Tipp führt: export = von Hand sichern, ordner = Ordner wählen), Unterzeile, Aktionen der aufgeklappten Zeile,
   Wortlaut des Fehlers und Erklärung (leer, solange verborgen), Zahl der „i“. rot: ob Unterzeile und Wortlaut in der Farbe für Fehler stehen (--danger). */
const zeile = page => page.evaluate(() => { const t = q => { const e = document.querySelector(q); return e && !e.hidden ? e.innerText.replace(/\s+/g, ' ').trim() : ''; };
  const mass = document.createElement('i'); mass.style.color = 'var(--danger)'; document.body.appendChild(mass); const gefahr = getComputedStyle(mass).color; mass.remove();
  const rot = q => { const e = document.querySelector(q); return !!e && !e.hidden && getComputedStyle(e).color === gefahr; };
  return { oben: t('#bk-due'), art: (document.querySelector('#bk-due') || { dataset: {} }).dataset.h || '', sub: t('#bk-msg'), akt: [...document.querySelectorAll('#v-heute [data-fold="sicherung"]')].map(b => [...b.closest('ul').querySelectorAll('.act')].map(a => a.innerText.trim()).join(' | ')).join(), fehler: t('#bk-err'), info: t('#info-bk'), i: document.querySelectorAll('#v-heute .entries .info').length, rot: { sub: rot('#bk-msg'), fehler: rot('#bk-err') } }; });
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
  /* 7. Der Händler merkt sich die Kategorie (v67): „Rewe“ wird einmal mit dem Wort „essen“ gebucht. Die nächste Zahlung bei „rewe“ ohne Wort (so kommt sie aus Apple Pay) landet von selbst unter „essen“.
     Alle ohne Konto, damit sich kein Stand ändert. */
  t = await auftrag({ id: 'b7', art: 'ausgabe', a: 1200, acc: '', n: 'Rewe', kat: 'essen' });
  const t8 = await auftrag({ id: 'b8', art: 'ausgabe', a: 800, acc: '', n: ' rewe ' });
  p.ok('Händler merkt sich die Kategorie: zweite Zahlung bei „rewe“ ohne Wort landet unter „essen“', t.c === 'essen' && t8.a === 800 && t8.c === 'essen' && t8.n === 'rewe', z(t) + ' · ' + z(t8));
  /* 8. Unbekannter Händler bleibt „Sonstiges“, auch beim zweiten Mal: „Sonstiges“ zählt nicht als einsortiert. Ein Wort geht immer vor (Rewe mit „frei“ → frei), und danach gilt für Rewe „frei“. */
  await auftrag({ id: 'b9', art: 'ausgabe', a: 150, acc: '', n: 'Kiosk' });
  const t10 = await auftrag({ id: 'b10', art: 'ausgabe', a: 160, acc: '', n: 'Kiosk' }), t11 = await auftrag({ id: 'b11', art: 'ausgabe', a: 900, acc: '', n: 'Rewe', kat: 'frei' }), t12 = await auftrag({ id: 'b12', art: 'ausgabe', a: 910, acc: '', n: 'REWE' });
  p.ok('unbekannter Händler bleibt „Sonstiges“; ein Wort geht vor, danach gilt die neue Kategorie', t10.c === 'sonst' && t11.c === 'frei' && t12.c === 'frei', z(t10) + ' · ' + z(t11) + ' · ' + z(t12));
  /* 9. Eine Einnahme vom selben Händler bekommt keine Kategorie */
  const t13 = await auftrag({ id: 'b13', art: 'ausgabe', k: 'in', a: 500, acc: '', n: 'Rewe' });
  p.ok('Einnahme vom selben Händler: keine Kategorie', t13.k === 'in' && t13.c === 'sonst', z(t13));
  /* 10. Nachfrage beim Bezahlen (v82, iPhone-App ab 0.9): Die Ausgabe bei einem neuen Händler ist sofort gebucht (unter „Sonstiges“) und trägt die Kennung des Auftrags.
     Wählt man in der Nachfrage eine Kategorie, kommt sie als Nachtrag 'kat' hinterher und setzt nur die Kategorie dieser Buchung. */
  const bu = async id => ((await gespeichert(page)).MY[JM].tx || {})[id] || {};
  const nach = async c => { await ruf(page, 'eingang', [c]); await page.waitForTimeout(40); };
  await auftrag({ id: 'b14', art: 'ausgabe', a: 450, acc: '', n: 'Bäcker' });
  let b14 = await bu('b14');
  p.ok('neuer Händler: sofort gebucht unter „Sonstiges“, Kennung der Buchung = Kennung des Auftrags', b14.a === 450 && b14.c === 'sonst' && b14.n === 'Bäcker', z(b14));
  await nach({ id: 'b15', art: 'kat', zu: 'b14', kid: 'essen' });
  b14 = await bu('b14');
  p.ok('Nachtrag: dieselbe Buchung steht jetzt unter „essen“, Betrag und Händler bleiben', b14.a === 450 && b14.c === 'essen' && b14.n === 'Bäcker' && b14.acc == null, z(b14));
  // Was nicht passt, ändert nichts: unbekannte Kategorie, unbekannter Auftrag, eine Einnahme (b13)
  await nach({ id: 'b16', art: 'kat', zu: 'b14', kid: 'gibtsnicht' }); await nach({ id: 'b17', art: 'kat', zu: 'fehlt', kid: 'frei' }); await nach({ id: 'b18', art: 'kat', zu: 'b13', kid: 'frei' });
  p.ok('unbekannte Kategorie, unbekannter Auftrag, Einnahme: nichts ändert sich', (await bu('b14')).c === 'essen' && (await bu('b13')).c === 'sonst' && (await bu('b13')).k === 'in', z(await bu('b14')) + ' · ' + z(await bu('b13')));
  const t19 = await auftrag({ id: 'b19', art: 'ausgabe', a: 320, acc: '', n: 'bäcker' });
  p.ok('nächste Zahlung beim selben Händler landet von selbst unter „essen“', t19.a === 320 && t19.c === 'essen', z(t19));
  /* Stand für die Nachfrage. Ausgaben je Kategorie bis hier: essen 8 (a, b, x, b4, b7, b8, b14, b19), frei 2 (b11, b12), sonst 7 (b1, b2, b5, b6, b9, b10, und b13 nicht: Einnahme → 6).
     Reihenfolge: meistbenutzte zuerst (essen, frei), die übrigen wie im Blatt, „Sonstiges“ immer am Ende.
     Einsortierte Händler, jüngster zuerst: bäcker (b19), rewe (b12). „Kiosk“ steht unter „Sonstiges“ und fehlt: Dort wird wieder gefragt. */
  await page.waitForTimeout(450);
  const stn = await letzter(page);
  p.ok('Stand: Kategorien nach Benutzung, „Sonstiges“ zuletzt, Namen im Klartext', (stn.kats || []).map(k => k.id).join() === 'essen,frei,drog,aus,shop,mobil,gesund,uni,reise,gesch,sonst' && stn.kats[0].n === 'Lebensmittel' && stn.kats[10].n === 'Sonstiges', JSON.stringify(stn.kats));
  p.ok('Stand: einsortierte Händler klein geschrieben, jüngster zuerst, ohne „Kiosk“', (stn.haendler || []).join() === 'bäcker,rewe', JSON.stringify(stn.haendler));
  /* 11. Eigene Kategorie: Ihr Name geht als reiner Text hinaus (nicht für HTML umgeschrieben), und der Nachtrag mit ihrer Kennung greift. */
  const eigen = zweiKonten(); eigen.MF.cats = { c1: { n: 'Katze & Hund' } }; eigen.MF.budgets = { c1: 5000 };   // mit Budget, sonst räumt die App eine unbenutzte Kategorie weg
  await lade(page, eigen);
  const ste = await letzter(page);
  p.ok('eigene Kategorie im Stand: „Katze & Hund“ im Klartext, vor „Sonstiges“', (ste.kats || []).some(k => k.id === 'c1' && k.n === 'Katze & Hund') && ste.kats[ste.kats.length - 1].id === 'sonst' && ste.kats[0].id === 'essen', JSON.stringify(ste.kats));
  await nach({ id: 'c1a', art: 'ausgabe', a: 990, acc: '', n: 'Fressnapf' }); await nach({ id: 'c1b', art: 'kat', zu: 'c1a', kid: 'c1' });
  p.ok('Nachtrag mit eigener Kategorie', (await bu('c1a')).c === 'c1' && (await bu('c1a')).a === 990, z(await bu('c1a')));
  await o.browser.close();
  return o.fehler;
}

/* Sicherung von selbst (v65, iPhone-App ab 0.5): Die iPhone-App meldet sich in info() mit sicherung; dann schickt die App nach Änderungen den Text der Sicherung.
   Was die iPhone-App meldet (S): t = letzte Datei in ihrem eigenen Ordner, aussen = letzter Stand im gewählten Ordner, ordner, fehler, nochmal (Datei nicht geschrieben).
   Für die Erinnerung und takt.backup zählt nur aussen: Was nur im Ordner der App liegt, ist mit der App weg. */
async function vonSelbst(p) {
  const fehler = [], D = zweiKonten(), W = 300000;   // W: so lange wartet die App nach der ersten Änderung, bis sie von selbst schickt (fünf Minuten)
  const S = (t, aussen, ordner, fehler, nochmal) => ({ t, aussen: aussen || 0, ordner: ordner || '', fehler: fehler || '', nochmal: !!nochmal }), S0 = S(0);
  const aendern = (page, id, x) => ruf(page, 'eingang', [{ id, art: 'notiz', x }]);
  const NUR = 'Sicherung liegt nur in der App Ordner wählen', FOLD = '#v-heute [data-fold="sicherung"]';

  /* --- Ohne Hülle (Browser) ist die Zeile wie in v64: zwei Aktionen, kein „i“, keine Zeile zum Ordner. Die Sicherung ist fällig (Routine vom 1., heute der 15.):
         Der Satz steht in der Erinnerung oben und nicht noch einmal in der Zeile. --- */
  let o = await oeffnen({ daten: D, uhr: new Date(um(15, 12)) }), page = o.page;
  await tipp(page, FOLD); let zl = await zeile(page);
  p.ok('ohne Hülle: Klappzeile „Sicherung“ wie in v64', zl.akt === 'Sicherung speichern | Sicherung einlesen' && zl.i === 0 && zl.sub === '' && zl.oben === 'Noch keine Sicherung gespeichert Jetzt sichern' && zl.art === 'export' && await page.evaluate(() => !document.querySelector('#bk-ord, #bk-err, #info-bk, #v-heute .irow')), JSON.stringify(zl));
  fehler.push(...o.fehler); await o.browser.close();

  o = await oeffnen({ skript: huelle, uhr: new Date(um(15, 12)) }); page = o.page;
  const ordner = async art => (await post(page)).filter(m => m.art === (art || 'ordner')).length;
  /* --- iPhone-App bis 0.4: info() ohne sicherung. Dann geht nie eine Sicherung hinaus, auch nicht nach einer Änderung, nach gut fünf Minuten oder auf sichern(); die Zeile bleibt wie in v64. --- */
  await lade(page, D);
  await ruf(page, 'info', { app: '0.4', ablauf: um(22, 9), health: 'fehlt' });
  await aendern(page, 'x1', 'Eine Änderung'); await page.clock.runFor(W + 5000); await ruf(page, 'sichern'); await page.clock.runFor(W + 5000);
  await tipp(page, FOLD); zl = await zeile(page);
  p.ok('iPhone-App 0.4 (info ohne sicherung): nie eine Nachricht „sicherung“', (await sich(page)).length === 0, JSON.stringify((await post(page)).map(m => m.art)));
  p.ok('iPhone-App 0.4: Klappzeile „Sicherung“ wie in v64', zl.akt === 'Sicherung speichern | Sicherung einlesen' && zl.i === 0 && zl.sub === '' && zl.oben === 'Noch keine Sicherung gespeichert Jetzt sichern' && zl.art === 'export', JSON.stringify(zl));

  /* --- iPhone-App 0.5, erste Auskunft: Es ist schon etwas offen (eine Änderung vor der Auskunft), also geht die Sicherung sofort hinaus, genau einmal. --- */
  await lade(page, D);
  await aendern(page, 's1', 'Vor der Auskunft'); await page.clock.runFor(W + 5000);
  p.ok('vor der Auskunft der iPhone-App geht nichts hinaus', (await sich(page)).length === 0);
  await ruf(page, 'info', { app: '0.5', ablauf: um(22, 9), health: 'fehlt', sicherung: S0 });
  let s = await sich(page), s0 = s[0] || { name: '', text: '{}' }, b = JSON.parse(s0.text), g = await gespeichert(page);
  p.ok('erste Auskunft mit sicherung: Offenes geht sofort hinaus, genau einmal', s.length === 1, String(s.length));
  p.ok('Sicherung: der Name passt zum Tag', s0.name === 'track-sicherung-' + am(15) + '.json', s0.name);
  p.ok('Sicherung: der Text ist die Sicherung (Kennung, Routinen, alle Gruppen wie gespeichert)', b.app === 'takt' && b.v === 1 && !!b.exported && JSON.stringify(b.routines) === JSON.stringify(g.S.routines) && ['LY', 'W', 'MF', 'MY', 'T', 'K', 'N'].every(k => JSON.stringify(b[k]) === JSON.stringify(g[k]))
    && Object.values((b.N || {}).notes || {}).some(n => n && n.x === 'Vor der Auskunft'), s0.text.slice(0, 160));
  /* Die iPhone-App prüft nur den Anfang und das Ende des Textes (und liest ihn nicht ganz): Jede Sicherung beginnt genau so. */
  p.ok('Sicherung: der Text beginnt mit {"app":"takt", und endet mit }', s0.text.startsWith('{"app":"takt",') && s0.text.endsWith('}'), s0.text.slice(0, 30));
  zl = await zeile(page);
  p.ok('noch keine Sicherung gemeldet, kein Ordner gewählt: die Erinnerung führt zum Ordner, die Zeile sagt „Wird von selbst gesichert“', zl.oben === NUR && zl.art === 'ordner' && zl.sub === 'Wird von selbst gesichert', JSON.stringify(zl));

  /* --- gesichert() ohne gewählten Ordner: Die Datei liegt nur im Ordner der App. Das zählt nicht als Sicherung außerhalb: takt.backup bleibt leer, die Erinnerung bleibt,
         und die Mitteilung „Sicherung fällig“ bleibt beim alten Tag (ältester Eintrag am 1. + 7 Tage = der 8.). Die Zeile nennt trotzdem, wann zuletzt gesichert wurde.
         Es geht keine weitere Sicherung hinaus, auch nicht nach sechs Minuten (kein Hin und Her). --- */
  const T1 = await page.evaluate(() => Date.now());
  await ruf(page, 'gesichert', S(T1)); zl = await zeile(page);
  p.ok('gesichert() ohne Ordner: takt.backup bleibt leer, die Erinnerung bleibt', (await merker(page)) === null && zl.oben === NUR && zl.art === 'ordner', (await merker(page)) + ' · ' + JSON.stringify(zl));
  p.ok('gesichert() ohne Ordner: die Zeile nennt den Zeitpunkt', zl.sub === 'Von selbst gesichert · heute, ' + hhmm(T1) && !zl.rot.sub, JSON.stringify(zl));
  await page.waitForTimeout(450); let st = (await letzter(page)) || {};
  p.ok('gesichert() ohne Ordner: die Mitteilung „Sicherung fällig“ bleibt beim 8.', st.sicherung === am(8), st.sicherung);
  await page.clock.runFor(W + 60000);
  p.ok('gesichert() löst keine weitere Sicherung aus', (await sich(page)).length === 1, String((await sich(page)).length));
  /* Ein Tipp auf die Erinnerung öffnet die Wahl des Ordners (kein Teilen, keine Datei). Die iPhone-App meldet danach den Ordner und die Kopie dort (aussen):
     Erst das zählt. takt.backup ist der Zeitpunkt der Kopie, die Erinnerung verschwindet, und für die Mitteilung gibt es keinen Tag mehr (leer). */
  await tipp(page, '#bk-due');
  p.ok('Tipp auf die Erinnerung bittet um die Wahl eines Ordners', (await ordner()) === 1 && (await sich(page)).length === 1, (await ordner()) + ' · ' + (await sich(page)).length);
  await ruf(page, 'gesichert', S(T1, T1, 'Track-Sicherung')); zl = await zeile(page);
  p.ok('Ordner gewählt, Kopie liegt dort: takt.backup ist ihr Zeitpunkt, die Erinnerung verschwindet', (await merker(page)) === String(T1) && zl.oben === '', (await merker(page)) + ' · ' + JSON.stringify(zl));
  await page.waitForTimeout(450); st = (await letzter(page)) || {};
  p.ok('Ordner gewählt: für die Mitteilung „Sicherung fällig“ gibt es keinen Tag mehr', st.sicherung === '', JSON.stringify(st.sicherung));

  /* --- Höchstens eine je fünf Minuten: drei Änderungen nach 0, 100 und 200 Sekunden. Die Uhr läuft seit der ersten und startet nicht neu:
         nach 200 Sekunden noch nichts, nach 305 Sekunden genau eine, mit allen drei Änderungen. Eine vierte Änderung gleich danach wartet wieder fünf Minuten:
         nach weiteren 290 Sekunden nichts, nach weiteren 15 (305) die nächste. Danach, ohne Änderung, nichts mehr. --- */
  await aendern(page, 's2', 'Zwei'); await page.clock.runFor(100000); await aendern(page, 's3', 'Drei'); await page.clock.runFor(100000); await aendern(page, 's4', 'Vier');
  p.ok('drei Änderungen in 200 Sekunden: noch keine Sicherung', (await sich(page)).length === 1, String((await sich(page)).length));
  await page.clock.runFor(105000); s = await sich(page);
  p.ok('fünf Minuten nach der ersten Änderung: genau eine Sicherung, mit allen dreien', s.length === 2 && ['Zwei', 'Drei', 'Vier'].every(x => s[1].text.includes('"x":"' + x + '"')), String(s.length));
  await aendern(page, 's5', 'Fünf'); await page.clock.runFor(290000);
  p.ok('eine Änderung gleich danach wartet wieder fünf Minuten', (await sich(page)).length === 2, String((await sich(page)).length));
  await page.clock.runFor(15000);
  p.ok('… und geht dann hinaus', (await sich(page)).length === 3, String((await sich(page)).length));
  await page.clock.runFor(2 * W);
  p.ok('ohne weitere Änderung kommt keine Sicherung mehr', (await sich(page)).length === 3, String((await sich(page)).length));

  /* --- sichern(): Die iPhone-App ruft das, wenn sie verlassen wird. Es schickt sofort und nur, wenn etwas offen ist; die Uhr schickt danach nicht noch einmal. --- */
  await ruf(page, 'sichern');
  p.ok('sichern() ohne Offenes schickt nichts', (await sich(page)).length === 3, String((await sich(page)).length));
  await aendern(page, 's6', 'Sechs'); await ruf(page, 'sichern'); s = await sich(page);
  p.ok('sichern() mit Offenem schickt sofort', s.length === 4 && s[3].text.includes('"x":"Sechs"'), String(s.length));
  await ruf(page, 'sichern'); await page.clock.runFor(W + 5000);
  p.ok('danach ist nichts mehr offen: weder ein zweites sichern() noch die Uhr schicken noch einmal', (await sich(page)).length === 4, String((await sich(page)).length));

  /* --- „Rückgängig“ lädt den Stand an saveLocal() vorbei und ist trotzdem eine Änderung. Notiz n1 im Widget abhaken und sichern: Die Sicherung ist ohne sie, nichts ist offen.
         Dann „Rückgängig“ und wieder sichern(): Es geht eine Sicherung hinaus, mit der Notiz. --- */
  await ruf(page, 'eingang', [{ id: 's7', art: 'notizWeg', nid: 'n1' }]); await ruf(page, 'sichern'); s = await sich(page);
  const ohne = s.length === 5 && !JSON.parse(s[4].text).N.notes.n1;
  await tipp(page, '#toast button'); await ruf(page, 'sichern'); s = await sich(page);
  p.ok('„Rückgängig“ merkt die Änderung: die nächste Sicherung enthält die Notiz wieder', ohne && s.length === 6 && (JSON.parse(s[5].text).N.notes.n1 || {}).x === 'Erste Notiz', ohne + ' · ' + s.length);

  /* --- Die Datei wurde nicht geschrieben: fehler ist gefüllt, nochmal ist wahr, t und aussen bleiben beim letzten Gelungenen (T1). takt.backup bleibt T1.
         Die Zeile sagt in Rot, dass es nicht ging und von wann die letzte Sicherung ist; aufgeklappt steht darunter der Wortlaut, auch in Rot.
         Von selbst geht nichts noch einmal hinaus (auch nicht nach sechs Minuten), offen bleibt es aber: Das nächste sichern() versucht es wieder.
         Heute wird bei alldem nicht neu gezeichnet (die Erinnerung ändert sich nicht): Nur die Texte der Zeile ändern sich. --- */
  await tipp(page, FOLD); await marke(page);
  await ruf(page, 'gesichert', S(T1, T1, 'Track-Sicherung', 'Auf dem iPhone ist kein Platz mehr.', true)); zl = await zeile(page);
  p.ok('Fehler: takt.backup bleibt, die Zeile sagt in Rot, dass es nicht ging und von wann die letzte Sicherung ist', (await merker(page)) === String(T1) && zl.sub === 'Sichern ging nicht · zuletzt heute, ' + hhmm(T1) && zl.rot.sub && zl.oben === '', JSON.stringify(zl));
  p.ok('Fehler: aufgeklappt steht der Wortlaut darunter, in Rot', zl.fehler === 'Auf dem iPhone ist kein Platz mehr.' && zl.rot.fehler, JSON.stringify(zl));
  await page.clock.runFor(W + 60000);
  p.ok('Fehler: von selbst geht nichts noch einmal hinaus', (await sich(page)).length === 6, String((await sich(page)).length));
  await ruf(page, 'sichern');
  p.ok('Datei nicht geschrieben: die Sicherung bleibt offen, das nächste sichern() versucht es wieder', (await sich(page)).length === 7, String((await sich(page)).length));
  const T2 = await page.evaluate(() => Date.now());
  await ruf(page, 'gesichert', S(T2, T2, 'Track-Sicherung')); zl = await zeile(page);
  p.ok('danach gelungen: Wortlaut weg, nicht mehr rot, Zeitpunkt und takt.backup neu', zl.fehler === '' && !zl.rot.sub && zl.sub === 'Von selbst gesichert · heute, ' + hhmm(T2) && (await merker(page)) === String(T2), JSON.stringify(zl));
  await ruf(page, 'sichern');
  p.ok('nach der gelungenen Sicherung ist nichts mehr offen', (await sich(page)).length === 7, String((await sich(page)).length));
  /* Nur der gewählte Ordner ging nicht: Die Datei liegt auf dem iPhone (t ist neu), die Kopie fehlt (aussen bleibt T2), nochmal ist falsch.
     takt.backup bleibt T2. Nichts bleibt offen: Weder sichern() noch die Uhr schicken die Sicherung noch einmal (die iPhone-App trägt die Kopie selbst nach).
     Weil die Kopie nicht mehr von selbst läuft, gibt es wieder einen Tag für die Mitteilung: T2 liegt am 15., also der 22. */
  await page.clock.runFor(60000);
  const T3 = await page.evaluate(() => Date.now()), nurOrdner = 'In „Track-Sicherung“ ließ sich nicht sichern. Auf dem iPhone ist die Sicherung gespeichert.';
  await ruf(page, 'gesichert', S(T3, T2, 'Track-Sicherung', nurOrdner)); zl = await zeile(page);
  p.ok('nur der Ordner ging nicht: takt.backup bleibt beim Zeitpunkt der letzten Kopie, die Zeile ist rot, der Wortlaut steht da', (await merker(page)) === String(T2) && zl.sub === 'Sichern ging nicht · zuletzt heute, ' + hhmm(T3) && zl.rot.sub && zl.fehler === nurOrdner && zl.oben === '', (await merker(page)) + ' · ' + JSON.stringify(zl));
  await ruf(page, 'sichern'); await page.clock.runFor(W + 60000);
  p.ok('nur der Ordner ging nicht: nichts bleibt offen, weder sichern() noch die Uhr schicken noch einmal', (await sich(page)).length === 7, String((await sich(page)).length));
  await page.waitForTimeout(450); st = (await letzter(page)) || {};
  p.ok('nur der Ordner ging nicht: die Mitteilung „Sicherung fällig“ ist wieder geplant, für den 22.', st.sicherung === am(22), JSON.stringify(st.sicherung));
  await ruf(page, 'gesichert', S(T3, T3, 'Track-Sicherung')); zl = await zeile(page); await page.waitForTimeout(450); st = (await letzter(page)) || {};
  p.ok('der Ordner geht wieder: takt.backup ist neu, nichts mehr rot, kein Tag mehr für die Mitteilung', (await merker(page)) === String(T3) && !zl.rot.sub && zl.fehler === '' && st.sicherung === '', (await merker(page)) + ' · ' + JSON.stringify(zl) + ' · ' + st.sicherung);
  /* Ein älterer Zeitpunkt stellt takt.backup nie zurück: Fehler, zuletzt gelungen gestern um 20:56 Uhr → die Zeile nennt gestern, takt.backup bleibt T3. Ohne jede gelungene (t = 0) fehlt „zuletzt“. */
  await ruf(page, 'gesichert', S(um(14, 20, 56), um(14, 20, 56), 'Track-Sicherung', 'Kein Platz.', true)); zl = await zeile(page);
  p.ok('Fehler mit älterem Zeitpunkt: „zuletzt gestern, 20:56“, takt.backup wird nicht zurückgestellt', zl.sub === 'Sichern ging nicht · zuletzt gestern, 20:56' && (await merker(page)) === String(T3), JSON.stringify(zl) + ' · ' + (await merker(page)));
  await ruf(page, 'gesichert', S(0, 0, 'Track-Sicherung', 'Kein Platz.', true)); zl = await zeile(page);
  p.ok('Fehler ohne jede gelungene Sicherung: nur der Satz', zl.sub === 'Sichern ging nicht', JSON.stringify(zl));
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
  await ruf(page, 'gesichert', S(T3, T3, 'Track-Sicherung')); zl = await zeile(page);
  p.ok('nach „Sicherung speichern“ nennt die Zeile die Datei, nach der nächsten Meldung wieder die Sicherung von selbst', vonHand === 'Sicherung gespeichert: track-sicherung-' + am(15) + '.json' && zl.sub === 'Von selbst gesichert · heute, ' + hhmm(T3), vonHand + ' · ' + zl.sub);
  /* Andere Sätze bleiben stehen: Nach „Sicherung einlesen“ steht da, was eingelesen wurde (Stand vom 10.). Das Einlesen ist selbst eine Änderung, kurz darauf meldet die iPhone-App
     die nächste Sicherung; der Satz bleibt trotzdem. Erst ein Fehler der iPhone-App geht vor. */
  const datei = JSON.stringify({ app: 'takt', v: 1, exported: new Date(um(10, 8)).toISOString(), routines: [], LY: {}, W: {}, MF: {}, MY: {}, T: {}, K: {}, N: { notes: { z9: { x: 'Aus der Datei', f: '', c: um(2, 9), m: um(2, 9) } } } });
  await page.setInputFiles('#bk-file', { name: 'track-sicherung.json', mimeType: 'application/json', buffer: Buffer.from(datei) }); await page.waitForTimeout(300);
  const gelesen = 'Sicherung eingelesen, Stand 10. ' + MONATE[+M.slice(5) - 1] + ' ' + JM + '. Vorhandene Einträge bleiben erhalten.';
  await ruf(page, 'gesichert', S(T3, T3, 'Track-Sicherung')); zl = await zeile(page);
  p.ok('der Satz nach „Sicherung einlesen“ bleibt stehen, wenn die iPhone-App danach eine Sicherung meldet', zl.sub === gelesen && Object.values((await gespeichert(page)).N.notes).some(n => n && n.x === 'Aus der Datei'), zl.sub);
  await ruf(page, 'gesichert', S(T3, T3, 'Track-Sicherung', 'Kein Platz.', true)); zl = await zeile(page);
  p.ok('… einem Fehler der iPhone-App weicht er', zl.sub === 'Sichern ging nicht · zuletzt heute, ' + hhmm(T3) && zl.rot.sub, JSON.stringify(zl));

  /* --- Erste Auskunft, nichts offen: Maßgeblich ist, ob die letzte Sicherung vor heute 0 Uhr liegt. Eine Millisekunde vor Mitternacht → sie geht sofort hinaus (einmal, auch wenn die
         Auskunft noch einmal kommt). Genau Mitternacht → nichts; erst eine Änderung und fünf Minuten bringen die nächste.
         Liegt die Kopie im gewählten Ordner (aussen), wird ihr Zeitpunkt takt.backup, und es gibt keine Erinnerung. Ohne Ordner bleibt takt.backup leer, und die Erinnerung führt zum Ordner. --- */
  const G = um(15, 0) - 1;
  await lade(page, D);
  await ruf(page, 'info', { app: '0.5', sicherung: S(G, G, 'iCloud') }); await ruf(page, 'info', { app: '0.5', sicherung: S(G, G, 'iCloud') });
  zl = await zeile(page);
  p.ok('erste Auskunft, letzte Sicherung von gestern (23:59 Uhr): eine Sicherung geht sofort hinaus, nur einmal', (await sich(page)).length === 1, String((await sich(page)).length));
  p.ok('Auskunft mit Kopie im Ordner: ihr Zeitpunkt wird takt.backup, keine Erinnerung', (await merker(page)) === String(G) && zl.oben === '' && zl.sub === 'Von selbst gesichert · gestern, 23:59', (await merker(page)) + ' · ' + JSON.stringify(zl));
  await lade(page, D);
  await ruf(page, 'info', { app: '0.5', sicherung: S(G) }); zl = await zeile(page);
  p.ok('Auskunft ohne Ordner: takt.backup bleibt leer, die Erinnerung führt zum Ordner', (await merker(page)) === null && zl.oben === NUR && zl.sub === 'Von selbst gesichert · gestern, 23:59', (await merker(page)) + ' · ' + JSON.stringify(zl));
  await lade(page, D);
  await ruf(page, 'info', { app: '0.5', sicherung: S(um(15, 0)) }); await ruf(page, 'sichern'); await page.clock.runFor(W + 5000);
  p.ok('erste Auskunft, letzte Sicherung von heute (0:00 Uhr), nichts offen: es geht nichts hinaus', (await sich(page)).length === 0, String((await sich(page)).length));
  await aendern(page, 'm1', 'Später'); await page.clock.runFor(W + 1000);
  p.ok('… erst eine Änderung und fünf Minuten bringen die nächste', (await sich(page)).length === 1, String((await sich(page)).length));
  /* Heute schon gesichert (9 Uhr), aber seit dem Laden gab es eine Änderung: Bei der ersten Auskunft geht genau eine Sicherung sofort hinaus, mit der Änderung.
     (Hier löst nicht der Tag aus, sondern das Offene: Die App merkt sich Änderungen auch, solange sie von der iPhone-App noch nichts weiß.) */
  await lade(page, D);
  await aendern(page, 'm2', 'Vor der Auskunft geändert');
  await ruf(page, 'info', { app: '0.5', sicherung: S(um(15, 9)) }); s = await sich(page);
  p.ok('erste Auskunft, heute schon gesichert, aber seit dem Laden geändert: genau eine Sicherung sofort, mit der Änderung', s.length === 1 && s[0].text.includes('"x":"Vor der Auskunft geändert"'), String(s.length));
  /* Älter als gestern steht das Datum da: der 3. des Monats, mit geschützten Leerzeichen, damit es beim Umbruch nicht zerreißt. Die zweite Auskunft am selben Tag löst nichts mehr aus. */
  await ruf(page, 'info', { app: '0.5', sicherung: S(um(3, 7, 5)) }); zl = await zeile(page);
  p.ok('ältere Sicherung: die Zeile nennt das Datum', zl.sub === 'Von selbst gesichert · 3. ' + MONATE[+M.slice(5) - 1] + ' ' + JM, zl.sub);
  p.ok('… mit geschützten Leerzeichen im Datum', (await page.evaluate(() => document.querySelector('#bk-msg').textContent)).endsWith('3. ' + MONATE[+M.slice(5) - 1] + ' ' + JM));
  p.ok('eine weitere Auskunft am selben Tag löst keine Sicherung aus', (await sich(page)).length === 1, String((await sich(page)).length));

  /* --- Leere App: Sie sichert nie, sonst überschriebe sie nach einem verlorenen Speicher die gute Datei des Tages. Weder die erste Auskunft noch sichern() noch die Uhr schicken etwas.
         Mit dem ersten Eintrag ändert sich das: fünf Minuten später geht die Sicherung hinaus. Ohne Einträge gibt es auch keine Erinnerung. --- */
  await lade(page, null);
  await ruf(page, 'info', { app: '0.5', sicherung: S0 }); await ruf(page, 'sichern'); await page.clock.runFor(W + 5000); zl = await zeile(page);
  p.ok('leere App: es geht nie eine Sicherung hinaus, keine Erinnerung', (await sich(page)).length === 0 && zl.sub === 'Wird von selbst gesichert' && zl.oben === '', (await sich(page)).length + ' · ' + JSON.stringify(zl));
  await lade(page, { S: { routines: [], running: null }, LY: {}, W: {}, MF: {}, MY: {}, T: {}, K: {}, N: {} });
  await ruf(page, 'info', { app: '0.5', sicherung: S0 }); await ruf(page, 'sichern'); await page.clock.runFor(W + 5000);
  p.ok('leere App mit leerem Speicher-Eintrag: ebenso', (await sich(page)).length === 0, String((await sich(page)).length));
  await aendern(page, 'l1', 'Erster Eintrag'); await page.clock.runFor(W + 1000); s = await sich(page);
  p.ok('nach dem ersten Eintrag: fünf Minuten später geht die Sicherung hinaus', s.length === 1 && s[0].text.includes('"x":"Erster Eintrag"'), String(s.length));
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

  /* --- Erinnerung und Mitteilung zählen nur, was außerhalb der App liegt. Die iPhone-App sichert täglich in ihren eigenen Ordner (t von heute), kein Ordner ist gewählt.
         Letzte Sicherung von Hand am 9. um 12 Uhr: heute, am 15., sind das 6 Tage → noch keine Erinnerung; die Mitteilung ist für den 16. geplant (9. + 7).
         Letzte Sicherung von Hand am 8.: 7 Tage → die Erinnerung kommt und führt zum Ordner; die Mitteilung ist für den 15. geplant (8. + 7). --- */
  await lade(page, D, um(9, 12));
  await ruf(page, 'info', { app: '0.5', sicherung: S(um(15, 9)) }); await ruf(page, 'gesichert', S(um(15, 11))); await page.waitForTimeout(450); zl = await zeile(page); st = (await letzter(page)) || {};
  p.ok('nur im Ordner der App gesichert, von Hand vor 6 Tagen: keine Erinnerung, Mitteilung für den 16.', zl.oben === '' && st.sicherung === am(16) && (await merker(page)) === String(um(9, 12)), JSON.stringify(zl) + ' · ' + st.sicherung);
  await lade(page, D, um(8, 12));
  await ruf(page, 'info', { app: '0.5', sicherung: S(um(15, 9)) }); await ruf(page, 'gesichert', S(um(15, 11))); await page.waitForTimeout(450); zl = await zeile(page); st = (await letzter(page)) || {};
  p.ok('nur im Ordner der App gesichert, von Hand vor 7 Tagen: die Erinnerung kommt und führt zum Ordner, Mitteilung für den 15.', zl.oben === NUR && zl.art === 'ordner' && st.sicherung === am(15) && (await merker(page)) === String(um(8, 12)), JSON.stringify(zl) + ' · ' + st.sicherung);
  /* Ordner gewählt, alles geht, aber die App wurde 14 Tage nicht geöffnet (letzte Kopie am 1.): keine Erinnerung und kein Tag für die Mitteilung, denn seitdem kann sich nichts
     geändert haben. Die Sicherung des Tages geht sofort hinaus (letzte von vor heute). */
  await lade(page, D, um(1, 12));
  await ruf(page, 'info', { app: '0.5', sicherung: S(um(1, 12), um(1, 12), 'iCloud') }); await page.waitForTimeout(450); zl = await zeile(page); st = (await letzter(page)) || {};
  p.ok('Ordner gewählt, 14 Tage nicht geöffnet: keine Erinnerung, kein Tag für die Mitteilung, die Sicherung des Tages geht hinaus', zl.oben === '' && st.sicherung === '' && (await sich(page)).length === 1, JSON.stringify(zl) + ' · ' + JSON.stringify(st.sicherung));
  /* Ordner gewählt, aber er geht seit 14 Tagen nicht (letzte Kopie am 1., Fehler gemeldet): Die Erinnerung kommt wie bisher und bietet die Sicherung von Hand an;
     die Mitteilung ist seit dem 8. fällig (1. + 7). */
  await lade(page, D, um(1, 12));
  await ruf(page, 'info', { app: '0.5', sicherung: S(um(15, 9), um(1, 12), 'iCloud', 'In „iCloud“ ließ sich nicht sichern. Auf dem iPhone ist die Sicherung gespeichert.') }); await page.waitForTimeout(450); zl = await zeile(page); st = (await letzter(page)) || {};
  p.ok('Ordner geht seit 14 Tagen nicht: Erinnerung mit „Jetzt sichern“, Mitteilung seit dem 8. fällig, die Zeile ist rot', zl.oben === 'Letzte Sicherung vor 14 Tagen Jetzt sichern' && zl.art === 'export' && st.sicherung === am(8) && zl.rot.sub, JSON.stringify(zl) + ' · ' + st.sicherung);
  /* Die iPhone-App meldet die nachgetragene Kopie: Erinnerung weg (Heute wird dafür neu gezeichnet), kein Tag mehr. */
  await ruf(page, 'gesichert', S(um(15, 9), um(15, 9), 'iCloud')); await page.waitForTimeout(450); zl = await zeile(page); st = (await letzter(page)) || {};
  p.ok('Kopie nachgetragen: die Erinnerung verschwindet, kein Tag mehr für die Mitteilung', zl.oben === '' && st.sicherung === '' && !zl.rot.sub && (await merker(page)) === String(um(15, 9)), JSON.stringify(zl) + ' · ' + JSON.stringify(st.sicherung));

  /* --- Klappzeile mit Sicherung von selbst. Von Hand gestern gesichert (also keine Erinnerung), letzte Sicherung von selbst heute um 11 Uhr, nichts offen: es geht nichts hinaus. --- */
  const S11 = S(um(15, 11));
  await lade(page, D, um(14, 12));
  await ruf(page, 'info', { app: '0.5', sicherung: S11 });
  p.ok('Zeile zu: „Sicherung“ mit „Von selbst gesichert · heute, 11:00“', (await text(page, FOLD)) === 'Sicherung Von selbst gesichert · heute, 11:00' && (await zeile(page)).oben === '', await text(page, FOLD));
  await tipp(page, FOLD); zl = await zeile(page);
  p.ok('Zeile auf: speichern, einlesen und „Ordner in iCloud wählen“ mit einem „i“; Erklärung und Fehler verborgen', zl.akt === 'Sicherung speichern | Sicherung einlesen | Ordner in iCloud wählen' && zl.i === 1 && zl.info === '' && zl.fehler === '', JSON.stringify(zl));
  await tipp(page, '#v-heute .act[data-h="ordner"]');
  p.ok('Tipp auf die Zeile zum Ordner schickt „ordner“ (einmal, keine Sicherung)', (await ordner()) === 1 && (await sich(page)).length === 0, (await ordner()) + ' · ' + (await sich(page)).length);
  await tipp(page, '#v-heute [data-info="bk"]'); zl = await zeile(page);
  p.enthaelt('Tipp auf das „i“ zeigt die Erklärung', zl.info, ['bei jeder Änderung von selbst', '„Dateien“ unter „Auf meinem iPhone › Track.“', 'je Tag eine Datei, die neuesten 14 bleiben', 'Wird die App gelöscht', 'Ordner in iCloud Drive', 'die Erinnerung an die Sicherung entfällt', 'bleibt unberührt', '„Sicherung einlesen“']);
  p.ok('das „i“ wählt keinen Ordner', (await ordner()) === 1, String(await ordner()));
  /* Der Ordner ist gewählt: Die iPhone-App meldet seinen Namen. Die Liste bekommt eine Zeile dazu („Ordner nicht mehr benutzen“), dafür wird Heute neu gezeichnet; die Klappzeile bleibt offen. */
  await marke(page); await ruf(page, 'gesichert', S(um(15, 11), um(15, 11), 'Track-Sicherung')); zl = await zeile(page);
  p.ok('Ordner gewählt: die Zeile heißt „Ordner: Track-Sicherung“, darunter „Ordner nicht mehr benutzen“', zl.akt === 'Sicherung speichern | Sicherung einlesen | Ordner: Track-Sicherung | Ordner nicht mehr benutzen' && zl.i === 1 && !(await gleich(page)), JSON.stringify(zl));
  /* Ein anderer Ordner (nur der Name ändert sich): Der Name wird an Ort und Stelle nachgeführt, die offene Erklärung bleibt stehen, Heute wird nicht neu gezeichnet. */
  await tipp(page, '#v-heute [data-info="bk"]'); await marke(page);
  await ruf(page, 'gesichert', S(um(15, 11), um(15, 11), 'Anderer Ordner')); zl = await zeile(page);
  p.ok('anderer Ordner: nur der Name ändert sich, die Erklärung bleibt offen, nichts wird neu gezeichnet', zl.akt === 'Sicherung speichern | Sicherung einlesen | Ordner: Anderer Ordner | Ordner nicht mehr benutzen' && zl.info !== '' && await gleich(page), JSON.stringify(zl));
  await tipp(page, '#v-heute .act[data-h="ordner"]');
  p.ok('ein Tipp auf „Ordner: …“ wählt neu', (await ordner()) === 2 && (await ordner('ordnerWeg')) === 0, (await ordner()) + ' · ' + (await ordner('ordnerWeg')));
  /* info() kommt bei jedem Zurückkommen in die App: Mit unveränderter sicherung wird Heute nicht neu gezeichnet, mit veränderter schon (die Zeile bleibt dabei offen).
     Ordnername und Fehler mit Zeichen aus HTML stehen als Text da: beim Zeichnen (info) wie beim Nachführen an Ort und Stelle (gesichert). */
  await ruf(page, 'info', { app: '0.5', sicherung: S(um(15, 11), um(15, 11), 'Anderer Ordner') });
  p.ok('info() mit unveränderter sicherung zeichnet Heute nicht neu', await gleich(page));
  const frech = '<b>Fett</b> & "Co"', kursiv = '<i>Fehler</i> & <img src=x onerror="window.__xss=1">';
  await ruf(page, 'info', { app: '0.5', sicherung: S(um(15, 11), um(15, 11), frech, kursiv) }); zl = await zeile(page);
  p.ok('info() mit veränderter sicherung zeichnet Heute neu, die Zeile bleibt offen', !(await gleich(page)) && zl.akt.includes('| Ordner: ' + frech + ' |'), JSON.stringify(zl));
  p.ok('beim Zeichnen stehen Ordnername und Fehler als Text da, nicht als HTML', zl.fehler === kursiv && await page.evaluate(() => !document.querySelector('#bk-ord b, #bk-err i, #bk-err img') && !window.__xss), JSON.stringify(zl));
  await ruf(page, 'gesichert', S(um(15, 11), um(15, 11), frech + '!', kursiv + '!')); zl = await zeile(page);
  p.ok('beim Nachführen ebenso', zl.akt.includes('| Ordner: ' + frech + '! |') && zl.fehler === kursiv + '!' && await page.evaluate(() => !document.querySelector('#bk-ord b, #bk-err i, #bk-err img') && !window.__xss), JSON.stringify(zl));
  /* „Ordner nicht mehr benutzen“ schickt „ordnerWeg“. Die iPhone-App meldet danach keinen Ordner mehr: Die Zeile dazu verschwindet, „Ordner in iCloud wählen“ steht wieder da. */
  await tipp(page, '#v-heute .act[data-h="ordnerweg"]');
  p.ok('„Ordner nicht mehr benutzen“ schickt „ordnerWeg“ (einmal)', (await ordner('ordnerWeg')) === 1 && (await ordner()) === 2, (await ordner('ordnerWeg')) + ' · ' + (await ordner()));
  await ruf(page, 'gesichert', S(um(15, 11), um(15, 11))); zl = await zeile(page);
  p.ok('danach: wieder „Ordner in iCloud wählen“, die Zeile zum Abwählen ist weg, nichts mehr rot', zl.akt === 'Sicherung speichern | Sicherung einlesen | Ordner in iCloud wählen' && zl.fehler === '' && !zl.rot.sub, JSON.stringify(zl));
  p.ok('es ging bei alldem keine Sicherung hinaus', (await sich(page)).length === 0, String((await sich(page)).length));
  /* In der Ansicht „Woche“ gibt es die Zeile nicht: Eine Meldung der iPhone-App ändert dort nichts und stört nicht; zurück auf „Heute“ steht der neue Stand da. */
  await tipp(page, '#v-heute [data-h="mode"][data-v="week"]'); await ruf(page, 'gesichert', S(um(15, 11, 30), um(15, 11, 30), 'iCloud')); await ruf(page, 'gesichert', S(um(15, 11, 30), um(15, 11, 30), 'iCloud', 'Kein Platz.', true));
  await tipp(page, '#v-heute [data-h="mode"][data-v="day"]'); zl = await zeile(page);
  p.ok('Meldung in der Ansicht „Woche“: kein Fehler, auf „Heute“ steht danach der neue Stand', zl.sub === 'Sichern ging nicht · zuletzt heute, 11:30' && zl.akt.includes('| Ordner: iCloud |'), JSON.stringify(zl));

  /* --- Blatt offen: Die Meldung zeichnet Heute nicht neu (der Nutzer tippt gerade), sie ändert nur den Text der Zeile. Die Erinnerung verschwindet, sobald das Blatt zugeht;
         dann steht auch die Zeile zum Abwählen des Ordners da. --- */
  await lade(page, D);
  await ruf(page, 'info', { app: '0.5', sicherung: S0 });
  await ruf(page, 'neu', 'notiz'); await page.waitForTimeout(150); await marke(page);
  const T4 = await page.evaluate(() => Date.now());
  await ruf(page, 'gesichert', S(T4, T4, 'iCloud'));
  const offen = await page.evaluate(() => ({ blatt: document.querySelector('#nsheet').open, oben: !!document.querySelector('#bk-due'), sub: document.querySelector('#bk-msg').textContent.replace(/\s+/g, ' ') }));
  p.ok('Blatt offen: Heute wird nicht neu gezeichnet, nur der Text der Zeile ändert sich', offen.blatt && offen.oben && offen.sub === 'Von selbst gesichert · heute, ' + hhmm(T4) && await gleich(page), JSON.stringify(offen));
  await page.keyboard.press('Enter'); await page.waitForTimeout(200); await tipp(page, FOLD); zl = await zeile(page);
  p.ok('Blatt zu: die Erinnerung ist weg, die Liste nennt den Ordner', await page.evaluate(() => !document.querySelector('#nsheet').open) && zl.oben === '' && zl.akt === 'Sicherung speichern | Sicherung einlesen | Ordner: iCloud | Ordner nicht mehr benutzen', JSON.stringify(zl));

  /* --- Halbes Zeichen: Die App kürzt Texte nach Einheiten und teilt dabei gelegentlich ein Emoji (hier: Auftrag aus der Schnelleingabe mit 59 Buchstaben und einem Emoji im Feld
         „Wofür?“, gekürzt auf 60 Einheiten). In der Sicherung steht kein halbes Zeichen: Mit ihm ist die Datei für andere Leser kein gültiges JSON, die iPhone-App lehnte sie ab.
         Die 59 Buchstaben bleiben, ein ganzes Emoji (in einer Notiz) bleibt auch. --- */
  await lade(page, D);
  await ruf(page, 'info', { app: '0.5', sicherung: S(um(15, 9)) });
  await ruf(page, 'eingang', [{ id: 'h1', art: 'ausgabe', a: 500, n: 'K'.repeat(59) + '😀' }, { id: 'h2', art: 'notiz', x: 'Ganz 😀 bleibt' }]); await ruf(page, 'sichern');
  s = await sich(page); const roh = (s[0] || { text: '' }).text, einzeln = (roh.match(/\\ud[89ab][0-9a-f]{2}(?!\\ud[c-f][0-9a-f]{2})/gi) || []).length + (roh.match(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/g) || []).length;
  g = await gespeichert(page);
  p.ok('Ausgangslage: im Speicher steht die Notiz der Buchung mit halbem Zeichen', Object.values(g.MY[JM].tx).some(t => t && t.n === 'K'.repeat(59) + '\ud83d'));
  p.ok('Sicherung: kein halbes Zeichen im Text', s.length === 1 && einzeln === 0, s.length + ' · ' + einzeln);
  let bb = {}; try { bb = JSON.parse(roh); } catch (e) {}
  p.ok('Sicherung: die 59 Buchstaben bleiben, ein ganzes Emoji bleibt', Object.values(((bb.MY || {})[JM] || {}).tx || {}).some(t => t && t.n === 'K'.repeat(59)) && Object.values((bb.N || {}).notes || {}).some(n => n && n.x === 'Ganz 😀 bleibt'), roh.slice(0, 200));
  fehler.push(...o.fehler); await o.browser.close();

  /* --- Neuladen: Lädt die iPhone-App die Seite neu (so zeigt sie eine neue Fassung), ginge der Merker „offen“ verloren. Vorher geht deshalb Offenes hinaus.
         Heute schon gesichert, eine Änderung, 5 Sekunden später Neuladen: Die Sicherung mit der Änderung ist hinausgegangen (die nachgestellte Hülle merkt sie über das Neuladen hinweg).
         Nach dem Neuladen ist nichts mehr offen: Auskunft, sichern() und gut fünf Minuten bringen keine weitere. --- */
  o = await oeffnen({ skript: huelleMerkt, uhr: new Date(um(15, 12)) }); page = o.page;
  const gemerkt = () => page.evaluate(() => JSON.parse(sessionStorage.getItem('t.sich') || '[]'));
  await lade(page, D); await page.evaluate(() => sessionStorage.removeItem('t.sich'));
  await ruf(page, 'info', { app: '0.5', sicherung: S(um(15, 9)) });
  await aendern(page, 'n1', 'Kurz vor dem Neuladen'); await page.clock.runFor(5000);
  p.ok('vor dem Neuladen: die Änderung wartet noch (fünf Minuten sind nicht um)', (await gemerkt()).length === 0, String((await gemerkt()).length));
  await page.reload(); await page.waitForTimeout(450);
  let gm = await gemerkt();
  p.ok('Neuladen: die offene Sicherung geht vorher hinaus, mit der Änderung', gm.length === 1 && gm[0].includes('"x":"Kurz vor dem Neuladen"'), String(gm.length));
  await ruf(page, 'info', { app: '0.5', sicherung: S(um(15, 9)) }); await ruf(page, 'sichern'); await page.clock.runFor(W + 5000);
  p.ok('nach dem Neuladen ist nichts mehr offen', (await gemerkt()).length === 1, String((await gemerkt()).length));
  /* Ohne Offenes schickt das Neuladen nichts. */
  await page.reload(); await page.waitForTimeout(450);
  p.ok('Neuladen ohne Offenes schickt nichts', (await gemerkt()).length === 1, String((await gemerkt()).length));

  /* --- Über Mitternacht: Die App bleibt offen (auf dem iPhone oft tagelang). Heute, am 15., ist schon gesichert, nichts ist offen. Am nächsten Morgen um 8 Uhr kommt der Nutzer zurück,
         die iPhone-App schickt ihre Auskunft: Die letzte Sicherung ist jetzt von gestern, also geht die Sicherung des neuen Tages hinaus, unter dem Namen des 16.
         Eine weitere Auskunft am selben Tag bringt keine zweite. --- */
  await lade(page, D); await page.evaluate(() => sessionStorage.removeItem('t.sich'));
  await ruf(page, 'info', { app: '0.5', sicherung: S(um(15, 9)) });
  p.ok('am 15., heute schon gesichert: es geht nichts hinaus', (await sich(page)).length === 0, String((await sich(page)).length));
  await page.clock.fastForward(20 * 3600000);   // von 12 Uhr auf 8 Uhr am 16. (seit dem Laden sind einige Sekunden vergangen)
  await ruf(page, 'info', { app: '0.5', sicherung: S(um(15, 9)) }); s = await sich(page);
  p.ok('am nächsten Morgen: die erste Auskunft des Tages schickt die Sicherung, unter dem Namen des 16.', s.length === 1 && s[0].name === 'track-sicherung-' + am(16) + '.json', s.length + ' · ' + (s[0] || {}).name);
  await ruf(page, 'info', { app: '0.5', sicherung: S(um(15, 9)) }); await ruf(page, 'sichern');
  p.ok('eine weitere Auskunft am selben Tag bringt keine zweite', (await sich(page)).length === 1, String((await sich(page)).length));
  fehler.push(...o.fehler); await o.browser.close();

  /* --- Der Name der Sicherung folgt dem Tag am Ort des Nutzers, nicht der Weltzeit. In Berlin ist es am 15. kurz nach Mitternacht (14. um 23:30 Uhr Weltzeit,
         also 0:30 oder 1:30 Uhr in Berlin): Die Datei heißt nach dem 15. Mit der Weltzeit hieße sie nach dem 14. und überschriebe die Datei von gestern. --- */
  o = await oeffnen({ skript: huelle, uhr: new Date(Date.UTC(+JM, +M.slice(5) - 1, 14, 23, 30)), zone: 'Europe/Berlin' }); page = o.page;
  await lade(page, D);
  await ruf(page, 'info', { app: '0.5', sicherung: S0 }); s = await sich(page);
  p.ok('Berlin, kurz nach Mitternacht am 15.: die Sicherung heißt nach dem 15.', s.length === 1 && s[0].name === 'track-sicherung-' + am(15) + '.json', s.length + ' · ' + (s[0] || {}).name);
  fehler.push(...o.fehler); await o.browser.close();

  /* --- 320 px, hell: aufgeklappt mit langem Ordnernamen, Fehler und offener Erklärung. Nichts ist seitlich wischbar, nichts ragt hinaus; der lange Name endet mit drei Punkten
         in einer Zeile (sein eigener Kasten #bk-ord ist breiter, wird aber von der Zeile abgeschnitten und zählt deshalb nicht).
         Der Wortlaut des Fehlers nennt einen Ordner mit 66 Zeichen ohne Leerzeichen und Bindestrich: Er bricht um, statt Heute breiter zu machen.
         Die Tippfläche des „i“ ist 40 px breit und hoch (14 px Symbol, ringsum 13 px) und reicht nicht in die Zeilen darüber und darunter. Geprüft wird 19 px um die Mitte,
         in beide Richtungen und in den Ecken. --- */
  const ohneLuecke = 'Sicherungen_von_Track_auf_meinem_iCloud_Drive_fuer_alle_Faelle_2026';
  for (const breite of [320, 390]) {
    o = await oeffnen({ skript: huelle, uhr: new Date(um(15, 12)), breite, hell: breite === 320 }); page = o.page;
    await lade(page, D);
    await ruf(page, 'info', { app: '0.5', sicherung: S(um(3, 20, 56), um(3, 20, 56), 'Sicherungen von Track auf meinem iCloud Drive für alle Fälle', 'In „' + ohneLuecke + '“ ließ sich nicht sichern. Auf dem iPhone ist die Sicherung gespeichert.') });
    const zu = await page.evaluate(() => ({ zeilen: document.querySelector('#bk-msg').getClientRects().length, text: document.querySelector('#bk-msg').textContent }));
    /* Zu, mit Fehler und einem Datum: bei 390 px eine Zeile (bei 320 px zwei, das Datum bleibt beisammen) */
    if (breite === 390) p.ok('390 px: Unterzeile mit Fehler und Datum steht in einer Zeile', zu.zeilen === 1 && zu.text === 'Sichern ging nicht · zuletzt 3. ' + MONATE[+M.slice(5) - 1] + ' ' + JM, JSON.stringify(zu));
    await tipp(page, FOLD); await page.evaluate(() => { const sc = document.querySelector('#scroll'); sc.scrollTop = sc.scrollHeight; }); await tipp(page, '#v-heute [data-info="bk"]');
    await page.evaluate(() => { const sc = document.querySelector('#scroll'); sc.scrollTop = sc.scrollHeight; }); await page.waitForTimeout(150);
    const eng = await page.evaluate(() => {
      const sc = document.querySelector('#scroll'), ul = document.querySelector('#v-heute [data-fold="sicherung"]').closest('ul'), i = ul.querySelector('.info'), ord = ul.querySelector('[data-h="ordner"]'), lesen = ul.querySelector('[data-h="import"]'), weg = ul.querySelector('[data-h="ordnerweg"]');
      if (!i || !ord || !weg) return { fehlt: true };
      const r = i.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, bei = (x, y) => { const e = document.elementFromPoint(x, y); return e ? e.closest('button') : null; };
      const raus = [ul, ...ul.querySelectorAll('*'), ...document.querySelectorAll('#bk-err, #info-bk')].filter(e => { const q = e.getBoundingClientRect(); return e.id !== 'bk-ord' && q.width && (q.left < -0.5 || q.right > window.innerWidth + 0.5); }).length;
      const name = document.querySelector('#bk-ord').parentElement;
      return { wischbar: sc.scrollWidth > sc.clientWidth || document.documentElement.scrollWidth > window.innerWidth, raus, hoehe: Math.round(ord.getBoundingClientRect().height), punkte: name.scrollWidth > name.clientWidth,
        ecken: [[0, 0], [-19, 0], [19, 0], [0, -19], [0, 19], [-19, -19], [19, -19], [-19, 19], [19, 19]].every(d => bei(cx + d[0], cy + d[1]) === i), links: bei(cx - 22, cy) === ord, drueber: bei(cx, cy - 22) === lesen, drunter: bei(cx, cy + 22) === weg,
        texte: [document.querySelector('#bk-err'), document.querySelector('#info-bk')].every(e => !e.hidden && e.getBoundingClientRect().height > 10) };
    });
    p.ok(breite + ' px: nichts seitlich wischbar, nichts ragt hinaus (auch nicht der Ordnername ohne Leerzeichen im Fehler), Fehler und Erklärung sind zu sehen', !eng.fehlt && !eng.wischbar && eng.raus === 0 && eng.texte, JSON.stringify(eng));
    if (breite === 320) {
      p.ok('320 px: langer Ordnername in einer Zeile mit drei Punkten (Zeile 40 px hoch)', !eng.fehlt && eng.hoehe === 40 && eng.punkte, JSON.stringify(eng));
      p.ok('320 px: Tippfläche des „i“ ist 40 px groß; daneben beginnt die Zeile zum Ordner, darüber „Sicherung einlesen“, darunter „Ordner nicht mehr benutzen“', !eng.fehlt && eng.ecken && eng.links && eng.drueber && eng.drunter, JSON.stringify(eng));
    }
    fehler.push(...o.fehler); await o.browser.close();
  }
  return fehler;
}

/* Beispieldaten: zwei tägliche Routinen (eine heute erledigt), eine nur am morgigen Wochentag, alle vor 20 Tagen angelegt.
   Aufgaben aus der Zeit vor v74 (vor 3 Tagen angelegt): eine seit zwei Tagen fällig, eine in drei Tagen, eine ohne Datum, eine erledigte. Sie dürfen nirgends mehr auftauchen.
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
  await bereich(o.page, 'training'); await o.page.click('#v-training .subtabs [data-v="cardio"]');
  p.ok('ohne Hülle: kein Health-Knopf, keine Zeile zur App', await o.page.evaluate(() => !document.querySelector('[data-t="health"]') && document.querySelector('#h-line').hidden));
  p.ok('ohne Hülle: Blätter bleiben, wie sie sind (kein --kb)', await o.page.evaluate(() => document.documentElement.style.getPropertyValue('--kb') === ''));
  p.ok('ohne Hülle: keine Fehler', !o.fehler.length, o.fehler.join(' | '));
  await o.browser.close();

  o = await oeffnen({ daten, skript: huelle });
  const page = o.page; await page.waitForTimeout(500);
  let m = await post(page), st = await letzter(page);
  p.ok('beim Start: „bereit“ und ein Stand', m[0] && m[0].art === 'bereit' && !!st, JSON.stringify(m).slice(0, 200));
  p.ok('Stand für heute und sieben weitere Tage', st.tage.length === 8 && st.tage[0].d === tag(0) && st.tage[7].d === tag(-7), JSON.stringify(st.tage.map(t => t.d)));
  /* Routinen (seit v75) und Aufgaben (seit v74) gibt es nicht mehr. Die Felder rn, rd, an und auf bleiben stehen, weil die iPhone-App bis 0.6 sie beim Lesen erwartet, sind aber leer:
     auch mit drei gespeicherten Routinen, von denen heute eine erledigt ist */
  p.ok('Stand: an allen acht Tagen keine Routine und keine Aufgabe, die Felder sind da', st.tage.every(t => t.rn === 0 && t.rd === 0 && t.an === 0 && Array.isArray(t.auf) && t.auf.length === 0), JSON.stringify(st.tage[0]));
  p.ok('Notizen: neueste zuerst, nur die erste Zeile', st.notizen.join('|') === 'Idee für Kapitel 3|Milch kaufen', st.notizen.join('|'));
  /* ohne Sicherung zählt der älteste Eintrag, auch eine Notiz: hier die Notiz von vor 25 Tagen (älter als die Routinen), also fällig seit 25 − 7 = 18 Tagen */
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
     C ohne Strecke → ungültig. D in der Zukunft → nein. A noch einmal → nein. E als Laufband gemeldet, vor drei Tagen → wird eingetragen wie jeder Lauf (eine Art gibt es seit v79 nicht mehr). */
  const A = { id: 'AAAA1111-22', t: mittag(1), m: 5230.4, s: 1800.2, hr: 151.6, k: 'out' };
  const liste = [A, { id: 'BBBB', t: mittag(2), m: 5300, s: 1600, hr: 140, k: 'out' }, { id: 'CCCC', t: mittag(1), m: 0, s: 900, k: 'out' },
    { id: 'DDDD', t: mittag(-2), m: 4000, s: 1300, k: 'out' }, A, { id: 'EEEE', t: mittag(3), m: 3000, s: 1200, hr: null, k: 'in' }];
  let n = await page.evaluate(l => window.TrackHuelle.laeufe(l), liste), g = await gespeichert(page);
  const runs = () => Object.values(g.T.runs).filter(Boolean);
  p.ok('Health: 2 von 6 werden eingetragen', n === 2 && runs().length === 3, n + ' · ' + JSON.stringify(g.T.runs));
  const a = runs().find(r => r.d === tag(1));
  p.ok('Health: Werte gerundet übernommen', a && a.m === 5230 && a.s === 1800 && a.hr === 152 && !('k' in a), JSON.stringify(a));
  p.ok('Health: ein als Laufband gemeldeter Lauf wird eingetragen, ohne Art', runs().some(r => r.d === tag(3) && !('k' in r) && r.m === 3000));
  p.ok('Health: gemerkt sind A, B, E (nicht Ungültiges, nicht die Zukunft)', Object.keys(g.T.hk).sort().join('|') === 'AAAA1111-22|BBBB|EEEE', Object.keys(g.T.hk).join('|'));
  n = await page.evaluate(l => window.TrackHuelle.laeufe(l), liste);
  p.ok('Health: zweites Mal kommt nichts doppelt', n === 0);

  /* Löschen: Der Lauf aus Health kommt nicht wieder */
  await bereich(page, 'training'); await page.click('#v-training .subtabs [data-v="cardio"]');
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
  p.ok('ohne Tastatur: Blatt schwebt 8 px über dem unteren Rand (v94)', (await unten())[0] === 836, String(await unten()));
  await page.evaluate(() => { window.__vv.height = 844 - 336; window.__vv.dispatchEvent(new Event('resize')); }); await page.waitForTimeout(500);
  let u = await unten();
  p.ok('mit Tastatur: Blatt rückt 8 px über die Tastatur', u[0] === 500 && u[1] <= 441, String(u));
  await page.evaluate(() => { window.__vv.height = 844; window.__vv.dispatchEvent(new Event('resize')); }); await page.waitForTimeout(500);
  p.ok('Tastatur weg: Blatt sitzt wieder unten', (await unten())[0] === 836, String(await unten()));
  await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  /* Beim nächsten Mal ist die Höhe bekannt (336): Das Blatt sitzt sofort oben, noch bevor die Tastatur sich meldet. Bleibt sie aus, fällt es nach gut einer Sekunde zurück. */
  p.ok('Blatt zu: nichts bleibt angehoben', await page.evaluate(() => document.documentElement.style.getPropertyValue('--kb') === '0px' && localStorage.getItem('takt.kb') === '336'));
  await page.evaluate(() => window.TrackHuelle.neu('notiz')); await page.waitForTimeout(450);
  p.ok('zweites Mal: Blatt sitzt sofort über der Tastatur', (await unten())[0] === 500, String(await unten()));
  await page.waitForTimeout(1200);
  p.ok('Tastatur kommt nicht: Blatt fällt zurück', (await unten())[0] === 836, String(await unten()));
  await page.keyboard.press('Enter'); await page.waitForTimeout(200);

  /* Kategorie aus dem Kurzbefehl bei einer eigenen Kategorie mit „&“ im Namen: Der volle Name trifft sie, ebenso ein Anfang, der über das Zeichen reicht.
     „Haus & Hof“ ist kein Anfang von „Haus & Garten“ → Sonstiges. */
  await page.evaluate(l => window.TrackHuelle.eingang(l), [{ id: 'k1', art: 'ausgabe', a: 990, kat: 'Haus & Garten', t: jetzt }, { id: 'k2', art: 'ausgabe', a: 550, kat: 'haus &', t: jetzt }, { id: 'k3', art: 'ausgabe', a: 440, kat: 'Haus & Hof', t: jetzt }]);
  const kat = a => (Object.values(g.MY[jahr].tx).find(t => t && t.a === a) || {}).c; g = await gespeichert(page);
  p.ok('Eingang: Kategorie mit „&“ wird über Namen und Anfang gefunden', kat(990) === 'cgarten1' && kat(550) === 'cgarten1' && kat(440) === 'sonst', [kat(990), kat(550), kat(440)].join());

  /* Texte für das Widget werden nach ganzen Zeichen gekürzt. Notiz: 79 Buchstaben, ein Emoji, ein Buchstabe. 80 Zeichen sind die 79 Buchstaben und das Emoji
     (81 Einheiten in UTF-16); nach Einheiten geschnitten bliebe ein halbes Emoji, mit dem sich der Stand nicht als Datei schreiben lässt.
     Dazu eine Notiz, in der schon ein halbes Zeichen gespeichert ist: Es fällt weg. */
  await page.evaluate(d => { const o = JSON.parse(localStorage.getItem('takt.v1'));
    o.N.notes.em = { x: 'a'.repeat(79) + '😀b', f: '', c: d.c, m: Date.now() };
    o.N.notes.hb = { x: 'Halb\ud83d', f: '', c: d.c, m: Date.now() - 1000 };
    localStorage.setItem('takt.v1', JSON.stringify(o)); }, { c: mittag(3) });
  await page.reload(); await page.waitForTimeout(700); st = await letzter(page);
  p.ok('Stand: Notiz endet nach 80 Zeichen mit dem ganzen Emoji', st.nz[0].x === 'a'.repeat(79) + '😀', st.nz[0].x);
  p.ok('Stand: das halbe Zeichen in der anderen Notiz ist weg', st.nz[1].x === 'Halb', JSON.stringify(st.nz[1]));
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
  await bereich(page, 'training'); await page.click('#v-training .subtabs [data-v="cardio"]');
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
