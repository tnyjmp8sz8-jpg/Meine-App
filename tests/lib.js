// Gemeinsame Helfer für die Tests. Die App wird direkt als Datei geöffnet, ohne Server.
const { chromium } = require('playwright');
const path = require('path');

const APP = 'file://' + path.resolve(__dirname, '..', 'index.html');
/* Alle Testreihen in der Reihenfolge, in der alle.js (und am.js mit vorgetäuschtem Datum) sie laufen lässt */
const REIHEN = ['ablauf', 'aufbau', 'klappen', 'gesten', 'eingabe', 'loeschen', 'notizen', 'finanzen', 'gym', 'monat', 'huelle', 'uhr', 'speicher', 'update'];
const pad = n => String(n).padStart(2, '0');
/* Datum als YYYY-MM-DD, n Tage zurück */
const tag = (n = 0) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
/* Monat als YYYY-MM, n Monate zurück */
const monat = (n = 0) => { const d = new Date(), x = new Date(d.getFullYear(), d.getMonth() - n, 1); return x.getFullYear() + '-' + pad(x.getMonth() + 1); };
const zahl = n => Math.round(n).toLocaleString('de-DE');

/* Öffnet die App. Ohne o.bewegung läuft sie mit „Bewegung reduzieren“: Dann zählen Zahlen nicht hoch, und Prüfungen lesen sofort den Endwert.
    o.daten wird einmal nach dem Laden gespeichert und die Seite neu geladen.
    o.uhr (ein Date) stellt die Uhr der Seite auf diesen Zeitpunkt; die Zeit läuft von dort normal weiter. Die Uhr von Node bleibt, wie sie ist:
    tag() und monat() rechnen weiter mit dem echten Datum.
    o.zone (z. B. 'Europe/Berlin') stellt die Zeitzone der Seite; ohne Angabe gilt die des Rechners.
   Nicht per Start-Skript mit Merker einspielen: Der Test-Browser vergisst den Merker gelegentlich und überschreibt dann die Daten der App. */
async function oeffnen(o = {}) {
  const browser = await chromium.launch(o.start || {});
  const ctx = await browser.newContext({ viewport: { width: o.breite || 390, height: 844 }, deviceScaleFactor: o.schaerfe || 1, colorScheme: o.hell ? 'light' : 'dark', acceptDownloads: true, hasTouch: !!o.finger, reducedMotion: o.bewegung ? 'no-preference' : 'reduce', timezoneId: o.zone });
  if (o.uhr) await ctx.clock.install({ time: o.uhr });
  if (o.skript) await ctx.addInitScript(o.skript);   // läuft vor jedem Laden der Seite, z. B. um die iPhone-Hülle nachzustellen
  const page = await ctx.newPage(), fehler = [];
  page.on('pageerror', e => fehler.push('Seitenfehler: ' + e.message));
  await page.goto(o.url || APP); await page.waitForTimeout(300);
  if (o.daten) { await page.evaluate(d => localStorage.setItem('takt.v1', JSON.stringify(d)), o.daten); await page.reload(); await page.waitForTimeout(300); }
  return { browser, ctx, page, fehler };
}
const text = (page, sel) => page.evaluate(q => [...document.querySelectorAll(q)].map(e => e.innerText.replace(/\s+/g, ' ').trim()).join(' | '), sel);
const bereich = (page, name) => page.click('.tab[data-view="' + name + '"]');
const gespeichert = page => page.evaluate(() => JSON.parse(localStorage.getItem('takt.v1') || '{}'));
const blaetterZu = page => page.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
const nachOben = page => page.evaluate(() => { document.querySelector('#scroll').scrollTop = 0; });
const nachUnten = page => page.evaluate(() => { const s = document.querySelector('#scroll'); s.scrollTop = s.scrollHeight; });

/* Fingerzug von (x0, y0) nach (x1, y1) in ms Millisekunden, als echte Berührung (braucht oeffnen({ finger: true })) */
async function wischen(ctx, page, x0, y0, x1, y1, ms = 120) {
  const c = await ctx.newCDPSession(page), n = 6;
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
  for (let i = 1; i <= n; i++) { await page.waitForTimeout(ms / n); await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / n, y: y0 + (y1 - y0) * i / n }] }); }
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await c.detach(); await page.waitForTimeout(350);
}
/* Sammelt Prüfungen und beendet den Test mit Fehlercode, wenn eine nicht stimmt */
function pruefer(name) {
  let n = 0, falsch = 0;
  console.log('== ' + name + ' ==');
  return {
    ok(label, bedingung, detail) { n++; if (!bedingung) falsch++; console.log((bedingung ? '  ok      ' : '  FALSCH  ') + label + (detail !== undefined && !bedingung ? '\n            ' + detail : '')); },
    enthaelt(label, ist, soll) { this.ok(label, soll.every(s => ist.includes(s)), 'ist: ' + ist + '\n            soll enthalten: ' + soll.join(' · ')); },
    async ende(browser, fehler) {
      if (browser) await browser.close();
      (fehler || []).forEach(f => console.log('  FALSCH  ' + f));
      const schlecht = falsch + (fehler || []).length;
      console.log(schlecht ? '-- ' + name + ': ' + schlecht + ' von ' + n + ' Prüfungen stimmen nicht' : '-- ' + name + ': alle ' + n + ' Prüfungen stimmen');
      process.exit(schlecht ? 1 : 0);
    }
  };
}
/* Fängt Abbrüche ab (z. B. Knopf nicht gefunden), damit der Test eine lesbare Meldung liefert */
function lauf(fn) { fn().catch(e => { console.log('  ABBRUCH ' + String(e.message).split('\n')[0]); process.exit(1); }); }

module.exports = { APP, REIHEN, tag, monat, zahl, pad, oeffnen, text, bereich, gespeichert, blaetterZu, nachOben, nachUnten, wischen, pruefer, lauf };
