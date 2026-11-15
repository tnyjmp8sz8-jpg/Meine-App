// Gemeinsame Helfer für die Tests. Die App wird direkt als Datei geöffnet, ohne Server.
const { chromium } = require('playwright');
const path = require('path');

const APP = 'file://' + path.resolve(__dirname, '..', 'index.html');
const pad = n => String(n).padStart(2, '0');
/* Datum als YYYY-MM-DD, n Tage zurück */
const tag = (n = 0) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
/* Monat als YYYY-MM, n Monate zurück */
const monat = (n = 0) => { const d = new Date(), x = new Date(d.getFullYear(), d.getMonth() - n, 1); return x.getFullYear() + '-' + pad(x.getMonth() + 1); };
const zahl = n => Math.round(n).toLocaleString('de-DE');

/* Öffnet die App. o.daten wird einmal nach dem Laden gespeichert und die Seite neu geladen.
   Nicht per Start-Skript mit Merker einspielen: Der Test-Browser vergisst den Merker gelegentlich und überschreibt dann die Daten der App. */
async function oeffnen(o = {}) {
  const browser = await chromium.launch(o.start || {});
  const ctx = await browser.newContext({ viewport: { width: o.breite || 390, height: 844 }, deviceScaleFactor: o.schaerfe || 1, colorScheme: o.hell ? 'light' : 'dark', acceptDownloads: true });
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

module.exports = { APP, tag, monat, zahl, pad, oeffnen, text, bereich, gespeichert, blaetterZu, nachOben, nachUnten, pruefer, lauf };
