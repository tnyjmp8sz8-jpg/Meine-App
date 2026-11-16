// Aufbau der Ansichten: Wochenleiste in jedem Bereich (öffnet den Kalender des Bereichs), Monat/Jahr und Pfeile
// in zwei Reihen (der Nutzer mag nichts Eingequetschtes), Erklärungen nur auf Tipp, nichts ragt seitlich hinaus.
const { oeffnen, text, bereich, pruefer, lauf, blaetterZu } = require('./lib');
const { beispiel } = require('./daten');

lauf(async () => {
  const P = pruefer('Aufbau');
  for (const breite of [390, 320]) {
    const { browser, page, fehler } = await oeffnen({ breite, daten: beispiel() });
    const lage = sel => page.evaluate(q => { const e = document.querySelector(q); if (!e) return null; const r = e.getBoundingClientRect(); return { oben: Math.round(r.top), links: Math.round(r.left), rechts: Math.round(r.right), unten: Math.round(r.bottom) }; }, sel);
    const passt = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    const b = ' (' + breite + ' px)';

    // Wochenleiste in jedem Bereich; ein Tipp auf einen Tag öffnet den Kalender dieses Bereichs
    const bereiche = [['heute', null, 'Übersicht'], ['routinen', null, 'Routinen'], ['gewicht', null, 'Gewicht'], ['haushalt', '[data-m="sub"][data-v="budget"]', 'Ausgaben'],
      ['training', '.subtabs button:nth-child(1)', 'Läufe'], ['training', '.subtabs button:nth-child(2)', 'Gym']];
    for (const [name, sub, titel] of bereiche) {
      await bereich(page, name); if (sub) await page.click('#v-' + name + ' ' + sub); await page.waitForTimeout(200);
      const v = '#v-' + name;
      P.ok(titel + ': Wochenleiste da' + b, await page.isVisible(v + ' .wk'));
      P.ok(titel + ': nichts ragt seitlich hinaus' + b, await passt());
      await page.click(v + ' .wk .wd.now'); await page.waitForTimeout(200);
      P.ok(titel + ': Tipp auf heute öffnet den Kalender' + b, (await text(page, '#cs-title')) === titel, await text(page, '#cs-title'));
      await blaetterZu(page);
    }

    // Zeitraum: Monat/Jahr als eigene Reihe über den Pfeilen; der Titel steht frei zwischen den Pfeilen
    for (const [name, sub] of [['haushalt', '[data-m="sub"][data-v="budget"]'], ['haushalt', '[data-m="sub"][data-v="verm"]'], ['training', '.subtabs button:nth-child(1)'], ['training', '.subtabs button:nth-child(2)']]) {
      await bereich(page, name); await page.click('#v-' + name + ' ' + sub); await page.waitForTimeout(200);
      const v = '#v-' + name, titel = (await text(page, v + ' .subtabs [aria-pressed="true"]')) + b;
      const seg = await lage(v + ' .seg2'), nav = await lage(v + ' .mnav'), t = await lage(v + ' .mnav b'), l = await lage(v + ' .mnav button:first-child'), r = await lage(v + ' .mnav button:last-child');
      P.ok(titel + ': Monat/Jahr steht über den Pfeilen', !!seg && !!nav && seg.unten <= nav.oben, JSON.stringify({ seg, nav }));
      P.ok(titel + ': Titel hat Luft zu beiden Pfeilen', !!t && t.links - l.rechts >= 12 && r.links - t.rechts >= 12, JSON.stringify({ l, t, r }));
    }
    await page.click('#v-training [data-t="mode"][data-v="year"]');
    P.ok('Jahr gewählt' + b, /^\d{4}$/.test(await text(page, '#v-training .mnav b')));
    await page.click('#v-training [data-t="mode"][data-v="month"]');

    // Der Punkt von „Track.“ trägt die Akzentfarbe (dieselbe wie der blaue Plus-Knopf), der Name selbst nicht
    const farben = await page.evaluate(() => ({ punkt: getComputedStyle(document.querySelector('.mark .dot')).color, name: getComputedStyle(document.querySelector('.mark')).color, plus: getComputedStyle(document.querySelector('#add')).backgroundColor }));
    P.ok('Punkt von „Track.“ ist blau' + b, farben.punkt === farben.plus && farben.name !== farben.plus && (await text(page, '.mark')) === 'Track.', JSON.stringify(farben));

    // Erklärung im Gym: erst nach Tipp auf das „i“ sichtbar
    P.ok('Erklärung ist zuerst verborgen' + b, !(await page.isVisible('#info-k-imp')));
    await page.click('#v-training [data-info="k-imp"]');
    P.ok('Tipp auf „i“ zeigt sie' + b, await page.isVisible('#info-k-imp'));
    await page.click('#v-training [data-info="k-imp"]');
    P.ok('zweiter Tipp verbirgt sie wieder' + b, !(await page.isVisible('#info-k-imp')));
    await browser.close();
    fehler.forEach(f => P.ok(f + b, false));
  }
  await P.ende();
});
