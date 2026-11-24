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

    // Wochenleiste in jedem Bereich (der Planer hat seit v75 keine: Notizen, Arbeit und Uni hatten nie eine); ein Tipp auf einen Tag öffnet den Kalender dieses Bereichs
    const bereiche = [['heute', null, 'Übersicht'], ['gewicht', null, 'Gewicht'], ['haushalt', '[data-m="sub"][data-v="budget"]', 'Ausgaben'],
      ['training', '.subtabs [data-v="cardio"]', 'Läufe'], ['training', '.subtabs [data-v="kraft"]', 'Gym']];
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
    for (const [name, sub] of [['haushalt', '[data-m="sub"][data-v="budget"]'], ['haushalt', '[data-m="sub"][data-v="verm"]'], ['training', '.subtabs [data-v="cardio"]'], ['training', '.subtabs [data-v="kraft"]']]) {
      await bereich(page, name); await page.click('#v-' + name + ' ' + sub); await page.waitForTimeout(200);
      const v = '#v-' + name, titel = (await text(page, v + ' .subtabs [aria-pressed="true"]')) + b;
      const seg = await lage(v + ' .seg2'), nav = await lage(v + ' .mnav'), t = await lage(v + ' .mnav b'), l = await lage(v + ' .mnav button:first-child'), r = await lage(v + ' .mnav button:last-child');
      P.ok(titel + ': Monat/Jahr steht über den Pfeilen', !!seg && !!nav && seg.unten <= nav.oben, JSON.stringify({ seg, nav }));
      P.ok(titel + ': Titel hat Luft zu beiden Pfeilen', !!t && t.links - l.rechts >= 12 && r.links - t.rechts >= 12, JSON.stringify({ l, t, r }));
    }
    await page.click('#v-training [data-t="mode"][data-v="year"]');
    P.ok('Jahr gewählt' + b, /^\d{4}$/.test(await text(page, '#v-training .mnav b')));
    await page.click('#v-training [data-t="mode"][data-v="month"]');

    // Oben steht der Name des Bereichs (v80), hier „Training“; sein Punkt trägt seit v102 die Kennfarbe des Bereichs (Training grün), der Name selbst nicht. Auf Heute steht „Track.“ mit blauem Punkt.
    const kennfarbe = v => page.evaluate(n => { const t = document.createElement('i'); t.style.color = 'var(' + n + ')'; document.body.appendChild(t); const c = getComputedStyle(t).color; t.remove(); return c; }, v);
    const farben = await page.evaluate(() => ({ punkt: getComputedStyle(document.querySelector('.mark .dot')).color, name: getComputedStyle(document.querySelector('.mark')).color, plus: getComputedStyle(document.querySelector('#add')).color }));
    P.ok('Titel oben: „Training.“, der Punkt in der Kennfarbe des Bereichs (grün)' + b, farben.punkt === await kennfarbe('--good') && farben.name !== farben.punkt && (await text(page, '.mark')) === 'Training.', JSON.stringify(farben) + ' ' + await text(page, '.mark'));
    /* Leiste unten (v92): eine Kapsel, die schwebt (Abstand links, rechts und unten, voll gerundet). Der gewählte Bereich liegt als Kapsel darin und ist nicht blau.
       Ganz nach unten gescrollt steht die Fußzeile über der Leiste, nichts bleibt dahinter verborgen. */
    const leiste = await page.evaluate(() => { const l = document.querySelector('.tabs-in'), r = l.getBoundingClientRect(), c = getComputedStyle(l), t = document.querySelector('.tab[aria-current="page"]'), ct = getComputedStyle(t);
      const sc = document.querySelector('#scroll'); sc.scrollTop = sc.scrollHeight; const fuss = document.querySelector('.ver').getBoundingClientRect();
      /* Die Markierung ist seit v102 eine Linse hinter den Knöpfen (.tabs-in::before), die zum gewählten Bereich gleitet: ihr linker Rand (5 px Rand der Leiste + Verschiebung) liegt auf dem des Knopfs */
      const lin = getComputedStyle(l, '::before'), tx = new DOMMatrixReadOnly(lin.transform).m41;
      return { links: r.left, rechts: innerWidth - r.right, unten: innerHeight - r.bottom, rund: parseFloat(c.borderRadius) >= r.height / 2, fest: getComputedStyle(l.parentElement).position, gewaehlt: lin.backgroundColor, linse: Math.abs(r.left + 5 + tx - t.getBoundingClientRect().left) < 1.5 && Math.abs(parseFloat(lin.width) - t.getBoundingClientRect().width) < 1.5, farbe: ct.color, blau: getComputedStyle(document.querySelector('#add')).color, frei: fuss.bottom <= r.top }; });
    P.ok('Leiste unten schwebt als Kapsel, der gewählte Bereich ist eine Linse darin (liegt genau unter seinem Knopf) und nicht blau, die Fußzeile bleibt erreichbar' + b, leiste.links >= 10 && leiste.rechts >= 10 && leiste.unten >= 6 && leiste.rund && leiste.fest === 'fixed' && leiste.gewaehlt !== 'rgba(0, 0, 0, 0)' && leiste.linse && leiste.farbe !== leiste.blau && leiste.frei, JSON.stringify(leiste));
    /* Glas und Licht (v102): Hinter der Seite liegt ein weiches Licht in der Kennfarbe des Bereichs (body[data-v]); die Kopfzeile zeichnet dasselbe Bild und deckt, was unter ihr durchscrollt
       (schwarzer Grund, unten über eine Maske ausgeblendet). Karten sind durchscheinend (Weiß mit 8,5 % Deckkraft) und tragen statt eines Rands eine feine Kante.
       Die Fußzeile ist eine Zeile: Die Version steht neben dem Satz, nicht darunter. */
    const glas = await page.evaluate(() => { const bo = getComputedStyle(document.body), to = getComputedStyle(document.querySelector('.top')), ka = getComputedStyle(document.querySelector('#v-training .entries')),
      fu = document.querySelector('#foot').getBoundingClientRect(), ve = document.querySelector('.ver').getBoundingClientRect();
      return { v: document.body.dataset.v, licht: /radial-gradient/.test(bo.backgroundImage), gleich: bo.backgroundImage === to.backgroundImage, deckt: to.backgroundColor, maske: /calc\(100% - 18px\)/.test(to.maskImage || to.webkitMaskImage || ''),
        karte: ka.backgroundColor, kante: ka.boxShadow !== 'none', zeile: ve.top - fu.top < 14 && ve.left > fu.left + 40 }; });
    P.ok('Licht hinter der Seite in der Farbe des Bereichs, die Kopfzeile zeichnet dasselbe und deckt; Karten aus Glas mit feiner Kante; Fußzeile in einer Zeile' + b,
      glas.v === 'training' && glas.licht && glas.gleich && glas.deckt === 'rgb(0, 0, 0)' && glas.maske && glas.karte.indexOf('rgba(255, 255, 255, 0.08') === 0 && glas.kante && glas.zeile, JSON.stringify(glas));
    /* Edler statt flach (v102): Der Hauptknopf trägt einen Verlauf mit Licht von oben; Liniengraphen haben unter der Linie dieselbe Linie noch einmal breit und blass (Schein ohne CSS-Filter);
       Balken laufen nach unten aus (Verlauf #g-bar). Geprüft im Cardio-Teil, der Knopf, Liniengraph und im Jahr Balken zeigt. */
    await page.click('#v-training .subtabs [data-v="cardio"]');
    const edel = await page.evaluate(() => { const k = getComputedStyle(document.querySelector('#v-training .primary')), v = document.querySelector('#v-training');
      return { knopf: /linear-gradient/.test(k.backgroundImage) && k.boxShadow !== 'none', schein: v.querySelectorAll('.g-glow').length, linien: v.querySelectorAll('.g-trend').length,
        gleich: [...v.querySelectorAll('.g-glow')].every(g => g.nextElementSibling && g.nextElementSibling.classList.contains('g-trend') && g.getAttribute('d') === g.nextElementSibling.getAttribute('d')) }; });
    await page.click('#v-training [data-t="mode"][data-v="year"]');
    edel.balken = await page.evaluate(() => { const r = document.querySelector('#v-training rect.g-pos'); return r ? getComputedStyle(r).fill : ''; });
    await page.click('#v-training [data-t="mode"][data-v="month"]'); await page.click('#v-training .subtabs [data-v="kraft"]');
    P.ok('Hauptknopf mit Verlauf und Schein, Linie mit Schein darunter, Balken mit Verlauf' + b, edel.knopf && edel.linien >= 1 && edel.schein === edel.linien && edel.gleich && (edel.balken === '' || /g-bar/.test(edel.balken))   /* am Jahresanfang gibt es noch keinen Balken */, JSON.stringify(edel));
    /* Der Punkt im Titel und die Linse folgen dem Bereich: Gewicht lila, Finanzen orange, Heute blau wie das Plus */
    const folgt = [];
    for (const [v, f] of [['gewicht', '--c-weight'], ['haushalt', '--c-money'], ['heute', '--accent']]) { await bereich(page, v);
      folgt.push(await page.evaluate(() => { const l = document.querySelector('.tabs-in'), t = document.querySelector('.tab[aria-current="page"]'); return getComputedStyle(document.querySelector('.mark .dot')).color + ' ' + (Math.abs(l.getBoundingClientRect().left + 5 + new DOMMatrixReadOnly(getComputedStyle(l, '::before').transform).m41 - t.getBoundingClientRect().left) < 1.5); }) === (await kennfarbe(f)) + ' true'); }
    await bereich(page, 'training');
    P.ok('Punkt im Titel und Linse folgen dem Bereich (Gewicht lila, Finanzen orange, Heute blau)' + b, folgt.every(Boolean), folgt.join(' '));
    /* Balken je Monat (v92): im laufenden Jahr trägt nur der laufende Monat die volle Farbe; ein Jahr zurück alle */
    await page.evaluate(() => { document.querySelector('#scroll').scrollTop = 0; }); await page.click('#v-training [data-t="mode"][data-v="year"]');
    const balken = () => page.evaluate(() => [...document.querySelectorAll('#v-training rect.g-pos')].map(e => e.classList.contains('jetzt') ? 'J' : '-').join(''));
    const heuer = await balken(); await page.click('#v-training .mnav [data-m="prev"]'); const davor = await balken(); await page.click('#v-training .mnav [data-m="next"]'); await page.click('#v-training [data-t="mode"][data-v="month"]');
    P.ok('Balken: im laufenden Jahr höchstens einer hervorgehoben (der laufende Monat, wenn er einen Wert hat), im Jahr davor alle' + b, (heuer.match(/J/g) || []).length <= 1 && /^-*J?$/.test(heuer) && !/-/.test(davor), heuer + ' · ' + davor);
    const titel = []; for (const v of ['heute', 'routinen', 'gewicht', 'haushalt', 'training']) { await bereich(page, v); titel.push(await text(page, '.mark')); }
    P.ok('Titel je Bereich: Track., Planer., Gewicht., Finanzen., Training.' + b, titel.join(' ') === 'Track. Planer. Gewicht. Finanzen. Training.', titel.join(' '));
    // Monat/Jahr steht klein in der Reihe der Umschalter, rechts von „Cardio / Gym“ und über der Wochenleiste; die Tippfläche ist mindestens 28 px hoch (wie die übrigen Umschalter)
    const mj = await page.evaluate(() => { const v = document.querySelector('#v-training'), s = v.querySelector('.seg2.mini'), t = v.querySelector('.subtabs'), w = v.querySelector('.wk'), b = s && s.querySelector('button'); if (!s || !t || !w) return null;
      const r = s.getBoundingClientRect(), tr = t.getBoundingClientRect(), nach = getComputedStyle(b, '::after'), h = b.getBoundingClientRect().height - parseFloat(nach.top) - parseFloat(nach.bottom);
      return { imKopf: !!s.closest('.card-head'), rechts: r.left >= tr.right, ueberLeiste: r.bottom <= w.getBoundingClientRect().top + 1, inSeite: r.right <= innerWidth - 15, tipp: Math.round(h) }; });
    P.ok('Training: Monat/Jahr klein rechts neben Cardio/Gym, über der Wochenleiste' + b, !!mj && mj.imKopf && mj.rechts && mj.ueberLeiste && mj.inSeite && mj.tipp >= 28, JSON.stringify(mj));

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
    const lf = { planer: await farbe('routinen'), gewicht: await farbe('gewicht'), finanzen: await farbe('haushalt'), training: await farbe('training'), plus: await leer.page.evaluate(() => getComputedStyle(document.querySelector('#add')).color) };
    P.ok('leere Seiten tragen die Farbe ihres Bereichs' + b, lf.planer === lf.plus && new Set([lf.planer, lf.gewicht, lf.finanzen, lf.training]).size === 4, JSON.stringify(lf));
    await leer.browser.close();
    leer.fehler.forEach(f => P.ok(f + b, false));
  }
  await P.ende();
});
