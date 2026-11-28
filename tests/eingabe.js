// Eingaben in den Blättern: Gewicht mit geändertem Datum, Zielgewicht unverändert speichern.
const { oeffnen, text, bereich, gespeichert, pruefer, lauf, tag } = require('./lib');

lauf(async () => {
  const P = pruefer('Eingaben in den Blättern');
  /* Gewicht: zwei Einträge, 76,0 kg vor fünf Tagen und 79,0 kg vor drei Tagen. 7-Tage-Schnitt am letzten Eintrag = (76 + 79) / 2 = 77,5 kg.
     Ziel 75 kg, gesetzt bei 80 kg: noch 77,5 − 75 = 2,5 kg, Fortschritt (80 − 77,5) / (80 − 75) = 50 %. */
  const W = { goal: 75, goalFrom: 80, entries: {} }; W.entries[tag(5)] = 76; W.entries[tag(3)] = 79;
  const { browser, page, fehler } = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, W } });
  const kurz = () => page.waitForTimeout(150), wert = sel => page.inputValue(sel);
  const ziel = () => text(page, '#v-gewicht .row.goal'), gw = async () => (await gespeichert(page)).W;

  // --- Zielgewicht: unverändert speichern lässt den Startwert stehen ---
  await bereich(page, 'gewicht');
  P.enthaelt('Ziel 75 kg: noch 2,5 kg, 50 %', await ziel(), ['Ziel 75,0 kg', 'noch 2,5 kg', '50 %']);
  await page.click('#v-gewicht [data-w="goal"]');
  P.ok('Blatt zeigt das Ziel', (await wert('#w-val')) === '75,0');
  await page.click('#w-save'); await kurz();
  P.ok('unverändert gespeichert: Startwert bleibt 80, weiter 50 % (klein in der Zeile, v106)', (await gw()).goalFrom === 80 && (await ziel()).includes('50 %') && await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#v-gewicht .goal .pz')).fontSize) <= 16), JSON.stringify(await gw()) + ' · ' + await ziel());
  // Das Feld zeigt eine Nachkommastelle: Ein Ziel von 74,75 steht als „74,8“ da und gilt beim Speichern als gleich
  await page.evaluate(() => { const o = JSON.parse(localStorage.getItem('takt.v1')); o.W.goal = 74.75; localStorage.setItem('takt.v1', JSON.stringify(o)); });
  await page.reload(); await page.waitForTimeout(300); await bereich(page, 'gewicht');
  await page.click('#v-gewicht [data-w="goal"]');
  P.ok('Ziel 74,75 steht als „74,8“ im Feld', (await wert('#w-val')) === '74,8');
  await page.click('#w-save'); await kurz();
  P.ok('unverändert gespeichert: Ziel 74,75 und Startwert 80 bleiben', (await gw()).goal === 74.75 && (await gw()).goalFrom === 80, JSON.stringify(await gw()));
  // Neues Ziel 74 kg: Der Startwert ist der heutige Schnitt (77,5). Noch 77,5 − 74 = 3,5 kg, Fortschritt 0 %.
  await page.click('#v-gewicht [data-w="goal"]'); await page.fill('#w-val', '74'); await page.click('#w-save'); await kurz();
  P.ok('geändertes Ziel: Startwert ist der heutige Schnitt 77,5', (await gw()).goal === 74 && (await gw()).goalFrom === 77.5, JSON.stringify(await gw()));
  P.ok('Ziel 74 kg: noch 3,5 kg; ohne Fortschritt steht kein „0 %“ da (v80)', (await ziel()).includes('Ziel 74,0 kg') && (await ziel()).includes('noch 3,5 kg') && !(await ziel()).includes('%'), await ziel());

  // --- Gewicht eintragen: Das Datum steht unter dem Gewicht. Wer erst tippt und dann das Datum umstellt, behält seine Zahl. ---
  await page.click('#v-gewicht [data-w="add"]');
  P.ok('Blatt schlägt den letzten Eintrag vor: 79,0', (await wert('#w-val')) === '79,0' && (await text(page, '#ws-title')) === 'Gewicht eintragen');
  await page.fill('#w-val', '78,4'); await page.fill('#w-date', tag(1));
  P.ok('Datum auf gestern gestellt: 78,4 bleibt stehen', (await wert('#w-val')) === '78,4', await wert('#w-val'));
  await page.click('#w-save'); await kurz();
  let e = (await gw()).entries;
  P.ok('gespeichert: 78,4 kg für gestern, heute nichts', e[tag(1)] === 78.4 && e[tag(0)] == null, JSON.stringify(e));
  // Nichts getippt: Das Blatt zeigt wie bisher den Eintrag des gewählten Tages, ohne Eintrag den letzten (jetzt 78,4 von gestern)
  await page.click('#v-gewicht [data-w="add"]'); await page.fill('#w-date', tag(3));
  P.ok('ohne Tippen: Tag mit Eintrag zeigt dessen Wert und „Eintrag ändern“', (await wert('#w-val')) === '79,0' && (await text(page, '#ws-title')) === 'Eintrag ändern' && await page.isVisible('#w-del'));
  await page.fill('#w-date', tag(2));
  P.ok('ohne Tippen: Tag ohne Eintrag zeigt den letzten Eintrag', (await wert('#w-val')) === '78,4' && (await text(page, '#ws-title')) === 'Gewicht eintragen' && !(await page.isVisible('#w-del')));
  // Getippt und dann auf einen Tag mit Eintrag gestellt: Die getippte Zahl bleibt und ersetzt beim Speichern den alten Eintrag (76,0 vor fünf Tagen)
  await page.fill('#w-val', '77,7'); await page.fill('#w-date', tag(5));
  P.ok('getippt, Tag mit Eintrag: 77,7 bleibt, Titel „Eintrag ändern“', (await wert('#w-val')) === '77,7' && (await text(page, '#ws-title')) === 'Eintrag ändern');
  await page.click('#w-save'); await kurz();
  e = (await gw()).entries;
  P.ok('gespeichert: 77,7 kg vor fünf Tagen, der Tag dazwischen bleibt leer', e[tag(5)] === 77.7 && e[tag(2)] == null && e[tag(3)] === 79, JSON.stringify(e));

  // --- Tastatur: Das erste Feld hat den Fokus schon im selben Schritt wie der Tipp ---
  /* Das iPhone öffnet die Tastatur nur, wenn der Fokus direkt aus dem Tipp kommt. Bis v70 kam er 60 ms später: In der iPhone-App hatte das Feld
     dann den blauen Rand, aber keine Tastatur (Bildschirmfoto des Nutzers, 18.11.). Geprüft wird deshalb ohne Warten, gleich nach dem Klick. */
  const sofort = async (knopf, wo) => {
    await page.keyboard.press('Escape'); await kurz();
    if (wo) { await bereich(page, wo); await kurz(); }
    return page.evaluate(sel => {
      const b = [...document.querySelectorAll(sel)].find(x => x.offsetParent);
      if (!b) return 'kein Knopf';
      b.click();
      const a = document.activeElement;
      return a && a.id + (a.closest('dialog[open]') ? '' : ' (nicht im Blatt)');
    }, knopf);
  };
  P.ok('Plus im Planer (Notizen): Textfeld hat sofort den Fokus', (await sofort('#add', 'routinen')) === 'n-text');
  P.ok('Gewicht eintragen: Feld hat sofort den Fokus', (await sofort('#v-gewicht [data-w="add"]', 'gewicht')) === 'w-val');
  await page.keyboard.press('Escape'); await kurz(); await bereich(page, 'haushalt'); await kurz();
  await kurz();
  P.ok('Budget, Knopf „Ausgabe“: Betrag hat sofort den Fokus', (await sofort('#v-haushalt [data-m="add"]')) === 'm-amt');
  // Feld beim Tippen (v95): kein blauer Rahmen mehr, nur eine feine graue Kante; die Einfügemarke ist blau; das Feld ist stark gerundet
  const feld = await page.evaluate(() => { const c = getComputedStyle(document.activeElement); return { umriss: c.outlineStyle, kante: c.boxShadow, rund: parseFloat(c.borderRadius), marke: c.caretColor, blau: getComputedStyle(document.querySelector('#add')).color }; });   // Blau wie das Plus oben (der Punkt im Titel trägt seit v102 die Farbe des Bereichs)
  P.ok('Feld beim Tippen: kein blauer Rahmen, feine graue Kante, blaue Einfügemarke, stark gerundet', feld.umriss === 'none' && feld.kante !== 'none' && !feld.kante.includes(feld.blau.slice(4, -1)) && feld.rund >= 20 && feld.marke === feld.blau, JSON.stringify(feld));
  P.ok('Budget, Knopf „Einnahme“: Betrag hat sofort den Fokus', (await sofort('#v-haushalt [data-m="income"]')) === 'm-amt');
  await page.keyboard.press('Escape'); await kurz(); await bereich(page, 'training'); await page.click('#v-training .subtabs [data-v="cardio"]');   // seit v86 öffnet das Training mit Gym
  P.ok('Lauf eintragen: Strecke hat sofort den Fokus', (await sofort('#v-training [data-t="add"]', 'training')) === 't-km');
  P.ok('Planer, Plus oben: Der Text der neuen Notiz hat sofort den Fokus', (await sofort('#add', 'routinen')) === 'n-text');
  await page.keyboard.press('Escape'); await kurz();

  await P.ende(browser, fehler);
});
