// Aufbau der Ansichten: Inhalt steht oben, Zeitraum in einer Reihe, Kalender über die Kopfzeile, Erklärungen nur auf Tipp.
const { oeffnen, text, bereich, pruefer, lauf, blaetterZu } = require('./lib');
const { beispiel } = require('./daten');

lauf(async () => {
  const P = pruefer('Aufbau');
  for (const breite of [390, 320]) {
    const { browser, page, fehler } = await oeffnen({ breite, daten: beispiel() });
    const lage = sel => page.evaluate(q => { const e = document.querySelector(q); if (!e) return null; const r = e.getBoundingClientRect(); return { oben: Math.round(r.top), links: Math.round(r.left), rechts: Math.round(r.right), unten: Math.round(r.bottom) }; }, sel);
    const passt = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    const b = ' (' + breite + ' px)';

    // Finanzen und Training: keine Wochenleiste, Pfeile und Monat/Jahr in einer Reihe, große Zahl im oberen Drittel
    for (const [name, sub] of [['haushalt', '[data-m="sub"][data-v="budget"]'], ['haushalt', '[data-m="sub"][data-v="verm"]'], ['training', '.subtabs button:nth-child(1)'], ['training', '.subtabs button:nth-child(2)']]) {
      await bereich(page, name); await page.click('#v-' + name + ' ' + sub); await page.waitForTimeout(250);
      const v = '#v-' + name, titel = (await text(page, v + ' .subtabs [aria-pressed="true"]')) + b;
      const nav = await lage(v + ' .period .mnav'), seg = await lage(v + ' .period .seg2'), zahl = await lage(v + ' .hero h1');
      P.ok(titel + ': keine Wochenleiste', !(await page.$(v + ' .wk')));
      P.ok(titel + ': Pfeile und Monat/Jahr in einer Reihe', !!nav && !!seg && Math.abs((nav.oben + nav.unten) / 2 - (seg.oben + seg.unten) / 2) < 6 && nav.rechts <= seg.links, JSON.stringify({ nav, seg }));
      P.ok(titel + ': große Zahl im oberen Drittel', !!zahl && zahl.oben < 281, JSON.stringify(zahl));
      P.ok(titel + ': nichts ragt seitlich hinaus', await passt());
    }
    // Jahr wählen und zurück: der Umschalter sitzt jetzt neben den Pfeilen
    await page.click('#v-training [data-t="mode"][data-v="year"]');
    P.ok('Jahr gewählt' + b, /^\d{4}$/.test(await text(page, '#v-training .mnav b')));
    await page.click('#v-training [data-t="mode"][data-v="month"]');

    // Kalender: auf Heute über die Wochenleiste, sonst über den Knopf in der Kopfzeile
    await bereich(page, 'heute');
    P.ok('Heute: Wochenleiste da, kein Kalender-Knopf' + b, !!(await page.$('#v-heute .wk')) && !(await page.isVisible('#calbtn')));
    for (const [name, titel] of [['gewicht', 'Gewicht'], ['haushalt', 'Ausgaben'], ['training', 'Gym']]) {
      await bereich(page, name); await page.click('#calbtn'); await page.waitForTimeout(200);
      P.ok('Kalender-Knopf öffnet „' + titel + '“' + b, (await text(page, '#cs-title')) === titel);
      await blaetterZu(page);
    }

    // Erklärung im Gym: erst nach Tipp auf das „i“ sichtbar
    await bereich(page, 'training');
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
