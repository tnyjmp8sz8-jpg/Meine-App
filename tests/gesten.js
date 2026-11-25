// Wischgesten und Graphen: Blatt nach unten wegziehen, zwischen Monaten wischen, Wert im Graphen ablesen.
// Die Berührungen sind echte Touch-Ereignisse des Test-Browsers. Ob es sich auf dem iPhone gut anfühlt, zeigt das nicht.
const { oeffnen, text, bereich, wischen, pruefer, lauf, monat } = require('./lib');
const { beispiel } = require('./daten');

const MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const name = ym => MON[+ym.slice(5) - 1] + ' ' + ym.slice(0, 4);

lauf(async () => {
  const P = pruefer('Gesten'), { browser, ctx, page, fehler } = await oeffnen({ finger: true, bewegung: true, daten: beispiel() });
  const titel = () => text(page, '#v-haushalt .mnav b');
  const offen = sel => page.evaluate(q => document.querySelector(q).open, sel);

  // --- Wechsel des Bereichs (v105, sein „ganz kurzer Mikro-Reset, als würde es neu laden“): nichts blendet ein, weder beim Tipp noch 0,7 s später, wenn die Klasse neu geht.
  //     Gemessen wird Bild für Bild eine Sekunde lang: Der Bereich und sein erstes Teil bleiben die ganze Zeit voll sichtbar. Bis v104 fiel der Bereich nach 0,7 s auf rund 0,4.
  const ruhig = sel => page.evaluate(q => new Promise(fertig => { const v = document.querySelector(q), t0 = performance.now(); let min = 1;
    const lies = () => { min = Math.min(min, +getComputedStyle(v).opacity, +getComputedStyle(v.firstElementChild).opacity); if (performance.now() - t0 < 1000) requestAnimationFrame(lies); else fertig(min); };
    lies(); }), sel);
  await page.click('.tab[data-view="gewicht"]'); const minG = await ruhig('#v-gewicht');
  await page.click('.tab[data-view="routinen"]'); const minP = await ruhig('#v-routinen');
  P.ok('Bereich wechseln: nichts blendet ein, auch nicht 0,7 s später', minG === 1 && minP === 1, minG + ' · ' + minP);

  // --- Zwischen Monaten wischen (Budget) ---
  await bereich(page, 'haushalt'); await page.click('#v-haushalt [data-m="sub"][data-v="budget"]');
  P.ok('Start: laufender Monat', (await titel()) === name(monat(0)));
  await wischen(ctx, page, 300, 500, 80, 505);
  P.ok('nach links im laufenden Monat: bleibt (kein Monat in der Zukunft)', (await titel()) === name(monat(0)));
  await wischen(ctx, page, 80, 500, 300, 505);
  P.ok('nach rechts: Vormonat', (await titel()) === name(monat(1)));
  // Nach dem Schieben des Monats (0,24 s) geht die Klasse go-p wieder: Danach darf nichts ein zweites Mal einblenden (bis v104 tat es das, wie nach dem Wechsel des Bereichs)
  const minM = await ruhig('#v-haushalt');
  P.ok('nach dem Wischen blendet der Bereich nicht ein zweites Mal ein', minM === 1, String(minM));
  await wischen(ctx, page, 300, 500, 80, 505);
  P.ok('nach links: wieder der laufende Monat', (await titel()) === name(monat(0)));
  await wischen(ctx, page, 200, 300, 215, 600);
  P.ok('senkrecht scrollen wechselt den Monat nicht', (await titel()) === name(monat(0)));
  await wischen(ctx, page, 5, 500, 250, 505);
  P.ok('vom linken Rand: wechselt nicht (dort wischt iOS zurück)', (await titel()) === name(monat(0)));
  await page.evaluate(() => { document.querySelector('#scroll').scrollTop = 0; });

  // --- Die große Zahl zählt beim Blättern kurz hoch (Vormonat und laufender Monat haben verschiedene Werte) ---
  const zahl = () => text(page, '#v-haushalt .hero .num');
  const ziel = await zahl();
  await page.click('#v-haushalt .mnav [data-m="prev"]'); await page.waitForTimeout(700); const vor = await zahl();
  await page.click('#v-haushalt .mnav [data-m="next"]'); await page.waitForTimeout(110); const mitten = await zahl();
  await page.waitForTimeout(600);
  P.ok('beim Blättern läuft die Zahl: unterwegs ein Zwischenwert', vor !== ziel && mitten !== ziel && mitten !== vor, JSON.stringify({ vor, mitten, ziel }));
  P.ok('am Ende steht genau der richtige Wert', (await zahl()) === ziel);
  await page.evaluate(() => { document.querySelector('#scroll').scrollTop = 300; }); await page.waitForTimeout(350);
  // Kopfzeile (v94): keine Linie mehr, sie läuft nach unten weich aus (Verlauf statt Fläche) und lässt Tipps auf den Inhalt darunter durch
  P.ok('Kopfzeile läuft weich aus und fängt keine Tipps ab', await page.evaluate(() => { const c = getComputedStyle(document.querySelector('.top')); return /gradient/.test(c.backgroundImage) && c.pointerEvents === 'none' && getComputedStyle(document.querySelector('#add')).pointerEvents === 'auto'; }));
  await page.evaluate(() => { document.querySelector('#scroll').scrollTop = 0; }); await page.waitForTimeout(350);

  // --- Blatt nach unten wegziehen ---
  await page.click('#v-haushalt [data-m="add"]'); await page.waitForTimeout(400);
  const oben = await page.evaluate(() => Math.round(document.querySelector('#msheet').getBoundingClientRect().top));
  await wischen(ctx, page, 195, oben + 30, 197, oben + 70, 400);
  P.ok('kurzer, langsamer Zug: Blatt bleibt offen', await offen('#msheet'));
  P.ok('und steht wieder an seinem Platz', (await page.evaluate(() => Math.round(document.querySelector('#msheet').getBoundingClientRect().top))) === oben);
  await wischen(ctx, page, 195, oben + 30, 197, oben + 330, 200);
  P.ok('langer Zug nach unten: Blatt ist zu', !(await offen('#msheet')));
  await page.click('#v-haushalt [data-m="add"]'); await page.waitForTimeout(400);
  P.ok('Blatt öffnet danach wieder normal', (await offen('#msheet')) && (await page.evaluate(() => Math.round(document.querySelector('#msheet').getBoundingClientRect().top))) === oben);
  await wischen(ctx, page, 195, oben + 300, 197, oben + 100, 200);
  P.ok('Zug nach oben schließt nicht', await offen('#msheet'));
  await page.click('#ms-close');

  // Im gescrollten Blatt scrollt der Zug nach unten, er schließt nicht (Blatt der Übung ist lang)
  await bereich(page, 'training'); await page.click('#v-training .subtabs [data-v="kraft"]'); await page.click('#v-training [data-fold="uebungen"]'); await page.click('#v-training .folds [data-k="ex"]'); await page.waitForTimeout(400);
  await page.evaluate(() => { document.querySelector('#xsheet').scrollTop = 200; });
  await wischen(ctx, page, 195, 300, 197, 640, 200);
  P.ok('gescrolltes Blatt: Zug nach unten schließt nicht', await offen('#xsheet'));
  await page.evaluate(() => document.querySelector('#xsheet').close());

  // --- Graph ablesen (Gewicht) ---
  await bereich(page, 'gewicht'); await page.waitForTimeout(300);
  const g = await page.evaluate(() => { const r = document.querySelector('#v-gewicht svg.scrub').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await page.touchscreen.tap(g.x + g.w * 0.3, g.y + g.h * 0.5); await page.waitForTimeout(150);
  const schild = await page.evaluate(() => (document.querySelector('#v-gewicht .g-scrub text') || {}).textContent || '');
  P.ok('Tipp in den Graphen zeigt Datum, Gewicht und Schnitt', /kg · Schnitt \d/.test(schild), schild);
  const imBild = await page.evaluate(() => { const s = document.querySelector('#v-gewicht svg.scrub').getBoundingClientRect(), r = document.querySelector('#v-gewicht .g-scrub rect').getBoundingClientRect(); return r.left >= s.left - 1 && r.right <= s.right + 1; });
  P.ok('das Schild liegt ganz im Graphen', imBild);
  /* Linie (v91): eine weiche Kurve, die durch jeden echten Wert geht (jedes Kurvenstück endet auf dem nächsten Punkt aus data-pts) und dazwischen nicht überschwingt
     (die Stützpunkte liegen zwischen den beiden Werten). Die Fläche darunter trägt den Verlauf, auf der Linie sitzen keine festen Punkte mehr. */
  const linie = await page.evaluate(() => { const s = document.querySelector('#v-gewicht svg.scrub'), pts = JSON.parse(s.dataset.pts), d = s.querySelector('.g-trend').getAttribute('d'), teile = d.split(' C');
    const seg = teile.slice(1).map(t => t.trim().split(' ').map(Number)), y0 = Number(teile[0].split(' ')[1]);
    const durch = seg.every((a, i) => Math.abs(a[4] - pts[i + 1][0]) < 0.11 && Math.abs(a[5] - pts[i + 1][1]) < 0.11);
    const ruhig = seg.every((a, i) => { const von = i ? seg[i - 1][5] : y0, lo = Math.min(von, a[5]) - 0.11, hi = Math.max(von, a[5]) + 0.11; return a[1] >= lo && a[1] <= hi && a[3] >= lo && a[3] <= hi; });
    return { n: seg.length, pts: pts.length, durch, ruhig, flaeche: getComputedStyle(s.querySelector('.g-area')).fill, punkte: s.querySelectorAll('.g-pos').length }; });
  P.ok('Linie: Kurve durch jeden echten Wert, ohne Überschwingen; Fläche mit Verlauf; keine festen Punkte', linie.n === linie.pts - 1 && linie.durch && linie.ruhig && /g-fade/.test(linie.flaeche) && linie.punkte === 0, JSON.stringify(linie));
  // Zug über den Graphen: Der Marker geht mit und wird dabei nur verschoben (ein Marker aus drei Teilen), das Schild nennt den Wert unter dem Finger
  await wischen(ctx, page, g.x + g.w * 0.2, g.y + g.h * 0.5, g.x + g.w * 0.7, g.y + g.h * 0.5, 300);
  const zug = await page.evaluate(() => { const m = document.querySelectorAll('#v-gewicht .g-scrub'); return { n: m.length, teile: m[0] ? m[0].children.length : 0, text: m[0] ? m[0].querySelector('text').textContent : '' }; });
  P.ok('Zug über den Graphen: ein Marker, der mitgeht', zug.n === 1 && zug.teile === 3 && zug.text !== schild && /Schnitt/.test(zug.text), JSON.stringify(zug) + ' · vorher ' + schild);
  await page.touchscreen.tap(g.x + 3, g.y + g.h * 0.5); await page.waitForTimeout(150);
  P.ok('am linken Rand: Schild bleibt im Bild', await page.evaluate(() => { const s = document.querySelector('#v-gewicht svg.scrub').getBoundingClientRect(), r = document.querySelector('#v-gewicht .g-scrub rect').getBoundingClientRect(); return r.left >= s.left - 1; }));
  await page.touchscreen.tap(195, g.y - 60); await page.waitForTimeout(150);
  P.ok('Tipp daneben blendet es aus', !(await page.$('.g-scrub')));

  // Balken (Finanzen, Jahr) und Linie (Vermögen)
  await bereich(page, 'haushalt'); await page.click('#v-haushalt [data-m="mode"][data-v="year"]'); await page.waitForTimeout(200);
  const balken = await page.evaluate(() => JSON.parse(document.querySelector('#v-haushalt svg.scrub').dataset.pts).map(p => p[2]).join(' | '));
  P.ok('Balken tragen Monat und Betrag', /[A-Z][a-zä]+ · [+−][\d.]+ €/.test(balken), balken);
  await page.click('#v-haushalt [data-m="mode"][data-v="month"]');
  /* Blatt „Plan“ (v126): eine Einheit mit dem Finger am Griff über die andere ziehen. Die Beispieldaten haben zwei Einheiten (Oberkörper, Beine);
     die zweite Zeile wird über die Mitte der ersten gezogen → Reihenfolge getauscht und gespeichert, das Blatt bleibt offen (der Griff zieht es nicht weg). */
  await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await bereich(page, 'training'); await page.waitForTimeout(200);
  const oVor = await page.$$eval('#v-training .rows.one .name', l => l.map(x => x.textContent).join(' | '));
  await page.click('#v-training h2.sec [data-k="ordnen"]'); await page.waitForTimeout(500);
  const og = await page.evaluate(() => { const l = [...document.querySelectorAll('#o-items .prow')], a = l[1].querySelector('.griff').getBoundingClientRect(), z = l[0].getBoundingClientRect(); return { x: a.left + a.width / 2, y: a.top + a.height / 2, zy: z.top + 6 }; });
  await wischen(ctx, page, og.x, og.y, og.x, og.zy, 400);
  const oNach = await page.$$eval('#v-training .rows.one .name', l => l.map(x => x.textContent).join(' | '));
  P.ok('Einheit mit dem Finger am Griff nach oben gezogen: Reihenfolge getauscht, das Blatt „Plan“ bleibt offen', oVor.split(' | ').length === 2 && oNach === oVor.split(' | ').reverse().join(' | ') && await offen('#osheet') && (await page.$$eval('#o-items .prow b', l => l.map(x => x.firstChild.textContent).join(' | '))) === oNach, oVor + ' → ' + oNach);
  await P.ende(browser, fehler);
});
