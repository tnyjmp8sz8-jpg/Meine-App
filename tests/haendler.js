// Händler, die die App selbst einsortiert (v131; seine Frage vom 26.11.: „beim Bezahlen mit Apple Pay wird Betrag automatisch hinzugefügt, aber Kategorie nicht, z. B. Lebensmittel“).
// Ausgaben kommen wie aus dem Kurzbefehl über TrackHuelle.eingang; geprüft wird die Kategorie, die Wörter im Stand für die iPhone-App und das einmalige Nachsortieren.
const { oeffnen, pruefer, lauf, gespeichert, tag } = require('./lib');

const huelle = () => { window.__post = []; window.webkit = { messageHandlers: { track: { postMessage: o => window.__post.push(JSON.parse(JSON.stringify(o))) } } }; };
const ruf = (page, name, arg) => page.evaluate(([n, a]) => window.TrackHuelle[n](a), [name, arg]);
const kat = async (page, id) => { const d = await gespeichert(page); for (const y in d.MY) { const t = d.MY[y].tx[id]; if (t) return t.c; } return '?'; };
const uuid = n => '0000000' + n + '-AAAA-4BBB-8CCC-DDDDDDDDDDDD';

lauf(async () => {
  const p = pruefer('Händler');
  const jahr = tag(0).slice(0, 4);
  /* Vorher (von einer älteren Fassung): zwei Zahlungen von selbst unter „Sonstiges“ (REWE, Bäcker Schmidt), eine von Hand unter „Sonstiges“ (REWE, Kennung r…),
     und von Hand hat er „Bäcker Schmidt“ inzwischen unter Lebensmittel einsortiert. */
  const MY = {}; MY[jahr] = { tx: {
    [uuid(1)]: { d: tag(3), a: 1250, k: 'out', c: 'sonst', n: 'REWE Markt GmbH', acc: null, to: null, t: 1 },
    [uuid(2)]: { d: tag(3), a: 300, k: 'out', c: 'sonst', n: 'Bäcker Schmidt', acc: null, to: null, t: 2 },
    rhand: { d: tag(2), a: 500, k: 'out', c: 'sonst', n: 'REWE Markt GmbH', acc: null, to: null, t: 3 },
    rbaeck: { d: tag(1), a: 280, k: 'out', c: 'essen', n: 'Bäcker Schmidt', acc: null, to: null, t: 4 } } };
  const daten = { S: { routines: [], running: null }, LY: {}, W: {}, MF: {}, MY, T: {}, K: {}, N: { folders: {}, tasks: {}, notes: {} } };
  const { browser, page, fehler } = await oeffnen({ skript: huelle, daten });
  p.ok('Nachsortiert: REWE von selbst → Lebensmittel (Regel)', (await kat(page, uuid(1))) === 'essen');
  p.ok('Nachsortiert: Bäcker Schmidt von selbst → Lebensmittel (seine eigene Wahl)', (await kat(page, uuid(2))) === 'essen');
  p.ok('Von Hand unter „Sonstiges“ bleibt', (await kat(page, 'rhand')) === 'sonst');
  p.ok('Merker takt.sortiert gesetzt', (await page.evaluate(() => localStorage.getItem('takt.sortiert'))) === '1');

  /* Neue Zahlungen wie aus Apple Pay: Betrag, Händler als Notiz, Kategorie leer */
  const faelle = [
    ['e1', 'REWE Markt GmbH', 'essen'], ['e2', 'LIDL DIENSTL', 'essen'], ['e3', 'dm-drogerie markt', 'drog'], ['e4', 'DM Fil. 1234', 'drog'],
    ['e5', 'Stadtapotheke am Markt', 'gesund'], ['e6', "McDonald's 123", 'aus'], ['e7', 'Uber Eats', 'aus'], ['e8', 'Uber BV', 'mobil'],
    ['e9', 'ARAL Station 5', 'mobil'], ['e10', 'Parallel GmbH', 'sonst'], ['e11', 'Admiral Bar', 'aus'], ['e12', 'Tierarzt Dr. Weber', 'sonst'],
    ['e13', 'Amazon EU', 'sonst'], ['e14', 'Bäcker Schmidt', 'essen'], ['e15', 'FlixBus', 'reise'], ['e16', 'H&M 512', 'shop'], ['e17', 'Landbäckerei Müller', 'essen']
  ];
  await ruf(page, 'eingang', faelle.map((f, i) => ({ id: f[0], art: 'ausgabe', a: 100 + i, n: f[1], kat: '', t: Date.now() - 1000 })));
  for (const f of faelle) { const c = await kat(page, f[0]); p.ok('„' + f[1] + '“ → ' + f[2], c === f[2], 'ist: ' + c); }
  /* Seine Wahl gewinnt: Ein Händler, den er einmal umsortiert hat, folgt ihm, nicht der Regel */
  await page.evaluate(id => { const d = JSON.parse(localStorage.getItem('takt.v1')); for (const y in d.MY) if (d.MY[y].tx[id]) d.MY[y].tx[id].c = 'frei'; localStorage.setItem('takt.v1', JSON.stringify(d)); }, 'e1');
  await page.reload(); await page.waitForTimeout(300);
  await ruf(page, 'eingang', [{ id: 'e20', art: 'ausgabe', a: 999, n: 'rewe markt gmbh', kat: '', t: Date.now() - 500 }]);
  p.ok('Eigene Wahl vor Regel: REWE jetzt unter „Spaß“', (await kat(page, 'e20')) === 'frei');
  p.ok('Nachsortieren läuft nur einmal (e10 bleibt „Sonstiges“, rhand auch)', (await kat(page, 'e10')) === 'sonst' && (await kat(page, 'rhand')) === 'sonst');
  /* Kategorie als Wort im Kurzbefehl geht weiter vor */
  await ruf(page, 'eingang', [{ id: 'e21', art: 'ausgabe', a: 500, n: 'REWE', kat: 'Geschenke', t: Date.now() - 400 }]);
  p.ok('Wort im Feld „Kategorie“ geht vor', (await kat(page, 'e21')) === 'gesch');
  /* Wörter im Stand für die iPhone-App */
  await page.waitForTimeout(400);
  const st = await page.evaluate(() => window.__post.filter(m => m.art === 'stand').pop());
  p.ok('Stand trägt die Wörter (muster) für die iPhone-App', !!st && Array.isArray(st.muster) && st.muster.includes('rewe') && st.muster.includes('*apotheke') && st.muster.length > 100, st && String(st.muster).slice(0, 80));
  p.ok('Keine Fehler', !fehler.length, fehler.join());
  await p.ende(browser);
});
