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

    // Kennfarben: Das Plus der Schnell-Knöpfe auf Heute trägt die Farbe seines Bereichs, dieselbe wie das Symbol in der Übersicht
    await bereich(page, 'heute');
    const kf = await page.evaluate(() => { const f = q => getComputedStyle(document.querySelector(q)).color; const plus = v => f('.quick .chip[data-v="' + v + '"] svg');
      return { notiz: plus('notiz'), gewicht: plus('gewicht'), ausgabe: plus('ausgabe'), icGewicht: f('.ov .ic.gewicht'), icFinanzen: f('.ov .ic.haushalt') }; });
    P.ok('Plus in der Farbe des Bereichs' + b, kf.gewicht === kf.icGewicht && kf.ausgabe === kf.icFinanzen && kf.notiz !== kf.gewicht && kf.notiz !== kf.ausgabe && kf.gewicht !== kf.ausgabe, JSON.stringify(kf));
    // Seit v56 nur noch drei Schnell-Knöpfe (Wunsch des Nutzers): Aufgabe und Lauf sind weg, Ausgabe und Einnahme teilen sich einen
    P.ok('drei Schnell-Knöpfe: Notiz, Gewicht, Ausgabe' + b, (await text(page, '.quick .chip')) === 'Notiz | Gewicht | Ausgabe', await text(page, '.quick .chip'));
    await bereich(page, 'training');

    // Erklärung im Gym: erst nach Tipp auf das „i“ sichtbar. Sie gehört zur Kachel „Verbesserung“, die es nur in einem Monat mit Einheiten gibt:
    // Am 1. und 2. des Monats liegt die jüngste Einheit der Beispieldaten (vor zwei Tagen) im Vormonat.
    if (!(await page.$('#v-training [data-info="k-imp"]'))) await page.click('#v-training .mnav button:first-child');
    P.ok('Erklärung ist zuerst verborgen' + b, !(await page.isVisible('#info-k-imp')));
    await page.click('#v-training [data-info="k-imp"]');
    P.ok('Tipp auf „i“ zeigt sie' + b, await page.isVisible('#info-k-imp'));
    await page.click('#v-training [data-info="k-imp"]');
    P.ok('zweiter Tipp verbirgt sie wieder' + b, !(await page.isVisible('#info-k-imp')));
    await browser.close();
    fehler.forEach(f => P.ok(f + b, false));
    // Leere Seiten: Symbol in der Kennfarbe des Bereichs (Planer blau wie der Plus-Knopf, die anderen jeweils eigen)
    const leer = await oeffnen({ breite });
    const farbe = async v => { await bereich(leer.page, v); await leer.page.waitForTimeout(150); return leer.page.evaluate(q => getComputedStyle(document.querySelector(q + ' .empty .e-ic')).color, '#v-' + v); };
    const lf = { planer: await farbe('routinen'), gewicht: await farbe('gewicht'), finanzen: await farbe('haushalt'), training: await farbe('training'), plus: await leer.page.evaluate(() => getComputedStyle(document.querySelector('#add')).backgroundColor) };
    P.ok('leere Seiten tragen die Farbe ihres Bereichs' + b, lf.planer === lf.plus && new Set([lf.planer, lf.gewicht, lf.finanzen, lf.training]).size === 4, JSON.stringify(lf));
    await leer.browser.close();
    leer.fehler.forEach(f => P.ok(f + b, false));
  }
  await P.ende();
});
