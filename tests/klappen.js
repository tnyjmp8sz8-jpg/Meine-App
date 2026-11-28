// Klappzeilen: Verläufe und Stammdaten sind je eine eingeklappte Zeile mit Anzahl, „Hinzufügen“ sitzt als Plus in der Überschrift
// oder als letzte Zeile der aufgeklappten Liste, Heute zeigt die Kurzfassung. Auf und zu liegt in einem Zustand (fo) mit einem Weg (data-fold).
const { oeffnen, text, bereich, pruefer, lauf, blaetterZu, zahlWahl, tag, monat } = require('./lib');
const { beispiel } = require('./daten');

/* Beispieldaten, ergänzt um das, was sonst vom Kalendertag abhinge oder fehlt: ein Lauf und eine Einheit von heute (am Monatsersten gäbe es
   sonst keine Zeile „Läufe“ und „Einheiten“) und eine Umbuchung von heute. */
function daten() {
  const d = beispiel(), y = tag(0).slice(0, 4);
  d.T.runs.heute = { d: tag(0), m: 5000, s: 1500, hr: 150, k: 'out' };
  d.K.log[tag(0)] = { e1: [[70, 8], [70, 7]] }; d.K.meta[tag(0)] = { dur: 1800, plan: 'p1' };
  d.MY[y].tx.um = { d: tag(0), a: 5000, k: 'tr', acc: 'giro', to: 'spar', c: '', n: '', t: Date.now() };
  return d;
}
const leer = () => ({ S: { routines: [], running: null }, LY: {}, W: { goal: null, goalFrom: null, entries: {} }, MF: { fixed: {} }, MY: {}, T: { runs: {} }, K: { ex: {}, log: {}, plans: {}, meta: {}, live: null }, N: { folders: {}, tasks: {}, notes: {} } });
const MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

/* Läuft in der Seite. Misst für jede Aktion in einer Überschrift, wie weit ein Tipp von der Mitte des Knopfs aus noch den Knopf trifft
   (elementFromPoint, in ganzen Pixeln), und den Abstand dieser Fläche zur Liste darunter und zu dem, was darüber steht. */
const flaechen = () => [...document.querySelectorAll('.view:not([hidden]) .sec-a')].map(b => {
  b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect(), cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2);
  const trifft = (x, y) => { const e = document.elementFromPoint(x, y); return !!e && (e === b || b.contains(e)); };
  let l = cx, rt = cx, o = cy, u = cy;
  while (trifft(l - 1, cy)) l--;
  while (trifft(rt + 1, cy)) rt++;
  while (trifft(cx, o - 1)) o--;
  while (trifft(cx, u + 1)) u++;
  const h2 = b.closest('h2'), nach = h2.nextElementSibling;
  let vor = h2.previousElementSibling;
  while (vor && !vor.getBoundingClientRect().height) vor = vor.previousElementSibling;   // verborgene Erklärtexte zählen nicht
  /* 6 px unter der Oberkante der Liste: Ganz oben läge der Punkt bei runden Ecken (20 px seit v94) neben der Karte */
  const erste = nach && document.elementFromPoint(cx, Math.ceil(nach.getBoundingClientRect().top) + 6);
  return { name: b.textContent.trim() || b.getAttribute('aria-label'), b: rt - l + 1, h: u - o + 1, mitte: trifft(cx, cy),
    unten: nach ? nach.getBoundingClientRect().top - (u + 1) : 99, oben: vor ? o - vor.getBoundingClientRect().bottom : 99, listeFrei: !nach || (!!erste && nach.contains(erste)) };
});
/* Läuft in der Seite. Ragt im sichtbaren Bereich etwas seitlich hinaus?
   scroll, seite: so viel ließe sich seitlich wischen (muss 0 sein). raus: Elemente, die über den Bereich hinausstehen, auch wenn eine Liste sie abschneidet (muss 0 sein);
   view: Überstand des Bereichs samt unsichtbarer Tippflächen (::after),
   er darf in den Seitenrand (rand) reichen, aber nicht über den Bildschirm hinaus. */
const breiten = () => {
  const s = document.querySelector('#scroll'), v = document.querySelector('.view:not([hidden])'), r = v.getBoundingClientRect();
  const raus = [...v.querySelectorAll('*')].filter(el => { const q = el.getBoundingClientRect(); return q.width > 0 && (q.right > r.right + 0.5 || q.left < r.left - 0.5); }).length;
  /* Teile einer Leiste (v148, „Übungen | Einheiten“) zählen nicht als zu: Dort ist immer nur einer offen */
  return { auf: v.querySelectorAll('[data-fold][aria-expanded="true"]').length, zu: v.querySelectorAll('[data-fold][aria-expanded="false"]:not(.kb-r > [data-fold])').length,
    scroll: s.scrollWidth - s.clientWidth, seite: document.documentElement.scrollWidth - innerWidth, view: v.scrollWidth - v.clientWidth, rand: Math.round(r.left), raus };
};
const passtHinein = m => m.scroll <= 0 && m.seite <= 0 && m.raus === 0 && m.view <= m.rand;

lauf(async () => {
  const P = pruefer('Klappzeilen');
  const d = daten(), jahr = tag(0).slice(0, 4), ym = monat(0);
  let { browser, page, fehler } = await oeffnen({ daten: d });
  const kurz = () => page.waitForTimeout(120);
  const z = sel => page.$$eval(sel, l => l.length);
  const zeit = async (wo, v) => { await page.click('#v-' + wo + ' [data-' + (wo === 'haushalt' ? 'm' : 't') + '="mode"][data-v="' + v + '"]'); await kurz(); };
  const tipp = async key => { await page.click('.view:not([hidden]) [data-fold="' + key + '"]'); await page.waitForTimeout(60); };
  /* Stand einer Klappzeile im sichtbaren Bereich: offen?, Angabe rechts, Zahl der Zeilen darunter. Gezählt werden die Zeilen derselben Liste
     ohne die Klappzeile und ohne Aktionszeilen („+ Fixkosten“); steht der Inhalt unter der Liste, zählen dort die Einträge (Gewicht) oder Kategorien. */
  const stand = key => page.evaluate(k => {
    const v = document.querySelector('.view:not([hidden])'), b = v.querySelector('[data-fold="' + k + '"]'); if (!b) return null;
    const ul = b.closest('ul'), kasten = ul.nextElementSibling, nach = kasten && kasten.classList.contains('nach') ? kasten.firstElementChild : kasten, auf = b.getAttribute('aria-expanded') === 'true';   // seit v83 liegt der Inhalt unter der Liste in einem Kasten (.nach)
    const drunter = !nach ? 0 : nach.classList.contains('mons') ? nach.querySelectorAll('[data-w="edit"]').length : nach.classList.contains('card') ? nach.querySelectorAll('.cat').length : 0;
    return { auf, rechts: b.querySelector('.fold').textContent.trim(), zeilen: [...ul.children].slice(1).filter(li => !li.querySelector('.act') && !li.classList.contains('grp')).length + drunter,   // Überschriften der Gruppen (Übungen im Gym, v99) sind keine Zeilen
      aktionen: [...ul.querySelectorAll('.act')].map(a => a.textContent.trim()), letzte: ul.lastElementChild.textContent.trim() };
  }, key);
  /* Eine Klappzeile: beim ersten Blick zu, ein Tipp klappt auf (Zahl rechts = Zahl der Zeilen, soll = von Hand gerechnet), ein zweiter klappt zu.
     vorZaehlen klappt vor dem Zählen auf, was in der Liste selbst noch zu ist (die Monate im Gewicht). */
  const klappe = async (name, key, soll, vorZaehlen) => {
    const a0 = await stand(key);
    if (!a0) return P.ok(name + ': Klappzeile ist da', false, 'data-fold="' + key + '" fehlt');
    P.ok(name + ': beim ersten Blick zu', !a0.auf && a0.zeilen === 0, JSON.stringify(a0));
    await tipp(key); if (vorZaehlen) await vorZaehlen();
    const a1 = await stand(key);
    P.ok(name + ': ein Tipp klappt auf, Zahl rechts = Zahl der Zeilen = ' + soll, a1.auf && a1.zeilen === soll && a1.rechts === String(soll), JSON.stringify(a1));
    await tipp(key);
    const a2 = await stand(key);
    P.ok(name + ': ein zweiter Tipp klappt zu', !a2.auf && a2.zeilen === 0 && a2.rechts === String(soll), JSON.stringify(a2));
  };
  const imMonat = k => k.slice(0, 7) === ym, imJahr = k => k.slice(0, 4) === jahr;
  const tx = Object.values(d.MY[jahr].tx), monate = l => new Set(l.filter(imJahr).map(k => k.slice(0, 7))).size;

  // --- Teil 1: jede Klappzeile ist zu, geht auf und wieder zu; die Zahl rechts stimmt ---
  /* Gezeichnet sind nach dem Start mindestens: Einträge (Gewicht) und Ausgaben (Finanzen; Vermögen mit „Umbuchungen“ ist seit v156 ausgebaut). Die Sicherung ist seit v106 keine Klappzeile mehr (Einstellungen). */
  const start = await page.$$eval('[data-fold]', l => l.map(b => b.dataset.fold + (b.getAttribute('aria-expanded') === 'true' ? ' offen' : '')));
  P.ok('nach dem Start ist in keinem Bereich etwas aufgeklappt', ['eintraege', 'ausgaben'].every(k => start.includes(k)) && !start.includes('sicherung') && !start.some(k => k.includes('offen')), start.join(', '));

  /* Gewicht: 70 Tage (i = 0 … 69), ohne die 14 Tage mit i % 5 = 4 → 56 Einträge. Aufgeklappt sind so viele der jüngsten Monate offen, dass die letzten drei Einträge zu sehen sind. */
  await bereich(page, 'gewicht');
  const juengster = '#v-gewicht .mons .entries:first-child .mon', imJuengsten = '#v-gewicht .mons .entries:first-child [data-w="edit"]';
  await klappe('Gewicht „Einträge“', 'eintraege', 56, async () => {
    /* Im jüngsten Monat liegen die Tage 0 … (Tag im Monat − 1) zurück, ohne die mit i % 5 = 4 (am 18.: 18 − 3 = 15; am 1.: 1; am 2.: 2).
       Ab drei Einträgen ist nur er offen; am 1. und 2. sind es weniger, dann ist auch der Vormonat offen. */
    const tage = +tag(0).slice(8), inM = tage - Math.floor(tage / 5), offen = inM >= 3 ? 1 : 2;
    const m = await page.$$eval('#v-gewicht .mon', l => l.map(b => b.getAttribute('aria-expanded')));
    P.ok('Gewicht: aufgeklappt ' + (offen === 1 ? 'ist der jüngste Monat offen' : 'sind die zwei jüngsten Monate offen') + ', die älteren sind zu', m.length > offen && m.slice(0, offen).every(x => x === 'true') && m.slice(offen).every(x => x === 'false'), m.join(' '));
    P.ok('Gewicht: der jüngste Monat zeigt, was in ihm eingetragen ist (' + inM + ')', (await z(imJuengsten)) === inM && (await text(page, juengster)).includes('Schnitt aus ' + inM + ' Eintr'), await text(page, juengster));
    await page.click(juengster); await page.waitForTimeout(40);
    P.ok('Gewicht: ein Tipp auf den Monat klappt ihn zu', (await z(imJuengsten)) === 0 && (await page.getAttribute(juengster, 'aria-expanded')) === 'false');
    for (let i = 0; i < 12 && await z('#v-gewicht .mon[aria-expanded="false"]'); i++) { await page.click('#v-gewicht .mon[aria-expanded="false"]'); await page.waitForTimeout(40); }
  });

  /* Budget im laufenden Monat. Ausgaben: die Buchungen der Beispieldaten im laufenden Monat ohne Einnahmen und Umbuchungen (am 18.: vor 0, 1, 2, 3, 5, 6, 8, 9, 11 Tagen → 9).
     Einnahmen: Gehalt (fest) und der Flohmarkt vor 12 Tagen, wenn er im laufenden Monat liegt (am 18.: 2). Fixkosten: Miete, Handy, Fitnessstudio → 3. */
  await bereich(page, 'haushalt');
  await klappe('Budget „Ausgaben“', 'ausgaben', tx.filter(t => t.k === 'out' && imMonat(t.d)).length);
  await klappe('Budget „Einnahmen“', 'einnahmen', 1 + (imMonat(tag(12)) ? 1 : 0));
  await klappe('Budget „Fixkosten“', 'fixkosten', 3);
  /* Budget im Jahr. Monate: Die festen Posten laufen seit zehn Monaten, also hat jeder Monat des Jahres bis heute Einträge, höchstens aber elf (im November: 11).
     Kategorien: so viele verschiedene, wie die Ausgaben des Jahres tragen (im November: Lebensmittel, Essen gehen, Spaß, Drogerie, Kleidung → 5). */
  await zeit('haushalt', 'year');
  await klappe('Budget im Jahr „Monate“', 'budgetMonate', Math.min(+ym.slice(5), 11));
  await klappe('Budget im Jahr „Flexible Kosten nach Kategorie“', 'kategorien', new Set(tx.filter(t => t.k === 'out' && imJahr(t.d)).map(t => t.c)).size);
  await zeit('haushalt', 'month');


  /* Cardio: die Läufe der Beispieldaten im laufenden Monat (am 18.: vor 1, 4, 8, 12, 17 Tagen) und der von heute → 6. Im Jahr: so viele Monate, wie Läufe haben. */
  const laeufe = Object.values(d.T.runs).map(r => r.d);
  await bereich(page, 'training'); await page.click('#v-training .subtabs [data-v="cardio"]'); await kurz();
  await klappe('Cardio „Läufe“', 'laeufe', laeufe.filter(imMonat).length);
  await zeit('training', 'year');
  await klappe('Cardio im Jahr „Monate“', 'cardioMonate', monate(laeufe));
  await zeit('training', 'month');

  /* Gym: vier Übungen (Bankdrücken, Kniebeuge, Klimmzüge, Schulterdrücken); Einheiten des laufenden Monats (am 18.: vor 2, 6, 10, 14 Tagen und heute → 5). */
  const einheiten = Object.keys(d.K.log);
  await page.click('#v-training .subtabs [data-v="kraft"]'); await kurz();
  /* Seit v152 stehen „Übungen“ und „Einheiten“ im Blatt „Plan“, nicht mehr als Klappzeilen im Gym; im Jahr bleibt „Monate“ */
  P.ok('Gym im Monat: keine Klappzeile mehr', !(await page.$('#v-training [data-fold]')));
  await zeit('training', 'year');
  await klappe('Gym im Jahr „Monate“', 'gymMonate', monate(einheiten));
  await zeit('training', 'month');


  // --- Teil 2: Aufgeklapptes bleibt im Bereich offen und klappt beim Wechsel des Bereichs zu ---
  await bereich(page, 'haushalt'); await tipp('fixkosten');
  const fix = async () => { const s = await stand('fixkosten'); return !!s && s.auf && s.zeilen === 3; };
  await page.click('#v-haushalt .mnav button:first-child'); await kurz();
  P.ok('Budget: „Fixkosten“ bleibt beim Blättern zum Vormonat offen', await fix() && (await text(page, '#v-haushalt .mnav b')).indexOf(MON[+monat(1).slice(5) - 1]) === 0, await text(page, '#v-haushalt .mnav b'));
  await page.click('#v-haushalt .mnav button:last-child'); await kurz();
  P.ok('Budget: … und beim Blättern zurück', await fix() && (await text(page, '#v-haushalt .mnav b')).indexOf(MON[+ym.slice(5) - 1]) === 0);
  await page.click('#v-haushalt [data-m="fixed"]'); await kurz();
  const blattAuf = await page.isVisible('#msheet[open]');
  await page.click('#ms-close'); await kurz();
  P.ok('Budget: … und nach dem Öffnen und Schließen eines Blatts', blattAuf && await fix());
  const vorher = +(await stand('ausgaben')).rechts;
  await page.click('#v-haushalt [data-m="add"]'); await page.fill('#m-amt', '3'); await page.click('#m-save'); await kurz();
  P.ok('Budget: … und nach dem Speichern einer Ausgabe; die Zeile „Ausgaben“ bleibt zu und zählt eine mehr', await fix() && +(await stand('ausgaben')).rechts === vorher + 1 && !(await stand('ausgaben')).auf, JSON.stringify(await stand('ausgaben')));
  await bereich(page, 'gewicht'); await bereich(page, 'haushalt'); await kurz();
  P.ok('Budget: nach dem Wechsel in einen anderen Bereich und zurück ist „Fixkosten“ zu', (await stand('fixkosten')).auf === false && (await z('[data-fold][aria-expanded="true"]')) === 0, JSON.stringify(await stand('fixkosten')));


  /* Gewicht: Der jüngste Monat ist ohne Merker offen. Klappt man ihn zu und wechselt den Bereich, gilt wieder der erste Blick: Einträge zu, darin der jüngste Monat offen. */
  await bereich(page, 'gewicht'); await tipp('eintraege'); await page.click(juengster); await page.waitForTimeout(40);
  P.ok('Gewicht: jüngster Monat zugeklappt, keiner seiner Einträge zu sehen', (await page.getAttribute(juengster, 'aria-expanded')) === 'false' && (await z(imJuengsten)) === 0);
  await page.click('#v-gewicht [data-w="add"]'); await kurz(); await page.click('#ws-close'); await kurz();
  P.ok('Gewicht: bleibt nach einem Blatt so', (await stand('eintraege')).auf && (await page.getAttribute(juengster, 'aria-expanded')) === 'false');
  await bereich(page, 'training'); await bereich(page, 'gewicht'); await kurz();
  const zu = await stand('eintraege'); await tipp('eintraege');
  P.ok('Gewicht: nach dem Wechsel des Bereichs zu, beim Aufklappen ist der jüngste Monat wieder offen', !zu.auf && (await page.getAttribute(juengster, 'aria-expanded')) === 'true');
  /* Auch der Weg über die Übersicht auf Heute ist ein Wechsel des Bereichs: Einträge aufklappen, über Heute zurück ins Gewicht, dann ist die Zeile zu */
  await tipp('eintraege'); await bereich(page, 'heute'); await page.click('#v-heute .ov[data-v="gewicht"]'); await kurz();
  P.ok('Gewicht: „Einträge“ ist nach dem Weg über die Übersicht auf Heute zu', (await stand('eintraege')).auf === false);

  // --- Teil 3: die verlegten Aktionen öffnen das richtige Blatt ---
  const blatt = async (name, sel, dlg, titelSel, titel, kopf) => {
    const h = kopf ? await text(page, '.view:not([hidden]) h2:has(' + sel + ')') : '';
    await page.click('.view:not([hidden]) ' + sel); await page.waitForTimeout(200);
    const offen = await page.isVisible(dlg + '[open]'), t = await text(page, titelSel);
    P.ok(name, offen && t === titel && (!kopf || h.indexOf(kopf) === 0), JSON.stringify({ offen, t, h }));
    await blaetterZu(page); await kurz();
  };
  await bereich(page, 'haushalt');
  await blatt('„+ Budget“ steht in der Überschrift „Flexible Kosten“ und öffnet das Blatt „Budget“', '.sec-a[data-m="budget"]', '#msheet', '#ms-title', 'Budget', 'Flexible Kosten');
  await tipp('einnahmen');
  P.ok('„+ Feste Einnahme“ ist die letzte Zeile der aufgeklappten Einnahmen', (await stand('einnahmen')).letzte === 'Feste Einnahme' && (await stand('einnahmen')).aktionen.length === 1, JSON.stringify(await stand('einnahmen')));
  await blatt('… und öffnet das Blatt „Feste Einnahme“', '.act[data-m="newin"]', '#msheet', '#ms-title', 'Feste Einnahme');
  await tipp('fixkosten');
  P.ok('„+ Fixkosten“ ist die letzte Zeile der aufgeklappten Fixkosten', (await stand('fixkosten')).letzte === 'Fixkosten' && (await stand('fixkosten')).aktionen.length === 1, JSON.stringify(await stand('fixkosten')));
  await blatt('… und öffnet das Blatt „Fixkosten“', '.act[data-m="newfix"]', '#msheet', '#ms-title', 'Fixkosten');
  await tipp('einnahmen'); await tipp('fixkosten');
  P.ok('zugeklappt gibt es die Aktionszeilen nicht', (await z('#v-haushalt .act')) === 0);
  await bereich(page, 'training'); await page.click('#v-training .subtabs [data-v="kraft"]'); await kurz();
  await blatt('„Anpassen“ bei „Plan“ öffnet das Blatt „Plan“ (v126)', '.sec-a[data-k="ordnen"]', '#osheet', '#os-title', 'Plan', 'Plan');
  await browser.close(); fehler.forEach(f => P.ok(f, false));

  // --- Teil 4: Tippfläche der Aktionen in der Überschrift, und bei 320 px ragt nichts hinaus ---
  /* Die Fläche muss mindestens 40 × 40 px groß sein, über der Liste darunter enden und unter dem enden, was darüber steht. */
  const tippTest = async (p, wo, namen, b) => {
    const f = await p.evaluate(flaechen), da = f.map(x => x.name).join(', ') === namen;
    P.ok(wo + ': Aktion in der Überschrift (' + namen + '), Tippfläche mindestens 40 × 40 px' + b, da && f.every(x => x.mitte && x.b >= 40 && x.h >= 40), JSON.stringify(f));
    P.ok(wo + ': die Tippfläche endet über der Liste darunter und unter dem, was darüber steht' + b, da && f.every(x => x.unten >= 0 && x.oben >= 0 && x.listeFrei), JSON.stringify(f));
  };
  for (const breite of [390, 320]) {
    const o = await oeffnen({ daten: d, breite }), p = o.page, b = ' (' + breite + ' px)', k = () => p.waitForTimeout(100);
    await bereich(p, 'haushalt'); await k(); await tippTest(p, 'Budget', 'Budget', b);
    await bereich(p, 'training'); await p.click('#v-training .subtabs [data-v="kraft"]'); await k(); await tippTest(p, 'Gym', 'Anpassen', b);

    if (breite === 320) {
      /* Jede Ansicht einmal mit allem aufgeklappt (min = so viele Klappzeilen müssen dort mindestens offen sein, damit die Prüfung nicht ins Leere läuft) */
      const passt = async (wo, min) => {
        const zu = '.view:not([hidden]) [data-fold][aria-expanded="false"]:not(.kb-r > [data-fold])', teile = await p.$$('.view:not([hidden]) .kb-r > [data-fold]');
        for (let t = 0; t < Math.max(1, teile.length); t++) {   // eine Leiste: jeden Teil einmal offen
          const teil = '.view:not([hidden]) .kb-r > [data-fold]:nth-child(' + (t + 1) + ')';
          if (teile.length && await p.$(teil + '[aria-expanded="false"]')) { await p.click(teil); await k(); }
          for (let i = 0; i < 60 && await p.$(zu); i++) await p.click(zu);
          await k(); const m = await p.evaluate(breiten);
          P.ok('320 px, ' + wo + (teile.length ? ' (Teil ' + (t + 1) + ' der Leiste)' : '') + ': alles aufgeklappt, nichts ragt seitlich hinaus', m.auf >= min && m.zu === 0 && passtHinein(m), JSON.stringify(m));
        }
      };
      await bereich(p, 'heute'); await passt('Heute', 0);   // seit v106 ohne Klappzeile (die Sicherung liegt in den Einstellungen)
      await bereich(p, 'routinen'); await passt('Notizen', 0);
      await bereich(p, 'gewicht'); await passt('Gewicht', 3);
      await bereich(p, 'haushalt'); await p.click('#v-haushalt [data-m="mode"][data-v="year"]'); await k(); await passt('Budget im Jahr', 2);
      await p.click('#v-haushalt [data-m="mode"][data-v="month"]'); await k(); await passt('Budget', 3);
      await bereich(p, 'training'); await p.click('#v-training .subtabs [data-v="cardio"]'); await k(); await passt('Cardio', 1);
      await p.click('#v-training [data-t="mode"][data-v="year"]'); await k(); await passt('Cardio im Jahr', 1);
      await p.click('#v-training .subtabs [data-v="kraft"]'); await k(); await passt('Gym im Jahr', 1);   // seit v148 „Monate | Übungen“ in einer Leiste: je Teil eine offene Liste
      await p.click('#v-training [data-t="mode"][data-v="month"]'); await k(); await passt('Gym', 0);   // seit v152 ohne Klappzeile (Übungen und Einheiten im Blatt „Plan“)
    }
    await o.browser.close(); o.fehler.forEach(f => P.ok(f + b, false));
  }

  // --- Teil 5: Heute ist die Kurzfassung ---
  ({ browser, page, fehler } = await oeffnen({ daten: d }));
  await bereich(page, 'heute');
  /* Seit v132 stehen auf Heute keine Notizen mehr (sein Wunsch): Die sieben stehen im Planer, je mit dem Tag darunter */
  P.ok('Heute: keine Notizen, keine Aufgaben aus dem Speicher', (await z('#v-heute .nrow')) === 0 && (await z('#v-heute .trow')) === 0);
  await bereich(page, 'routinen'); await kurz();
  P.ok('Planer: alle sieben Notizen, mit zweiter Zeile', (await z('#n-main .nrow')) === 7 && (await z('#n-main .nrow .l small')) === 7, (await z('#n-main .nrow')) + ' / ' + (await z('#n-main .nrow .l small')));

  // --- Teil 6: Sicherung (seit v106 hinter dem Zahnrad auf Heute, sein Wunsch: „diesen Button Sicherung ausblenden, nur einblenden, wenn lange keine Sicherung“) ---
  /* Ohne gespeicherte Sicherung und mit Einträgen, die älter als 7 Tage sind, ist die Sicherung fällig: Dann steht die Erinnerung oben auf Heute. Sonst steht auf Heute nichts zur Sicherung.
     Im Blatt „Einstellungen“: Stand, „Sicherung speichern“, „Sicherung einlesen“ und unten die Version. */
  await bereich(page, 'heute');
  const sich = async () => ({ oben: await text(page, '#v-heute .remind[data-h="export"]'), offen: await page.evaluate(() => document.querySelector('#esheet').open), msg: await text(page, '#bk-msg'),
    akt: await page.$$eval('#esheet .act', l => l.map(b => b.textContent.trim()).join(' | ')), aufHeute: await page.evaluate(() => !!document.querySelector('#v-heute [data-fold="sicherung"], #v-heute .act')) });
  let s = await sich();
  P.ok('Sicherung fällig: die Erinnerung steht oben auf Heute, sonst nichts zur Sicherung; das Zahnrad steht oben rechts statt des Plus', s.oben === 'Noch keine Sicherung gespeichert Jetzt sichern' && !s.aufHeute && await page.evaluate(() => !document.querySelector('#gear').hidden && document.querySelector('#add').hidden), JSON.stringify(s));
  await page.click('#gear'); await kurz(); s = await sich();
  P.ok('Zahnrad: Einstellungen mit Stand, „Sicherung speichern“, „Sicherung einlesen“ und der Version', s.offen && s.msg === 'Noch keine Sicherung gespeichert.' && s.akt === 'Sicherung speichern | Sicherung einlesen' && /^v\d+$/.test(await text(page, '#esheet .ver:not(#h-line)')), JSON.stringify(s));
  const [wahl] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null), page.click('#esheet .act[data-h="import"]')]);
  P.ok('„Sicherung einlesen“ öffnet die Dateiauswahl', !!wahl);
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), page.click('#esheet .act[data-h="export"]')]);
  await kurz(); s = await sich();
  P.ok('„Sicherung speichern“ speichert die Datei; die Erinnerung ist weg, das Blatt bleibt offen und nennt die Datei', !!dl && dl.suggestedFilename() === 'track-sicherung-' + tag(0) + '.json' && s.oben === '' && s.offen && s.msg === 'Sicherung gespeichert: track-sicherung-' + tag(0) + '.json', JSON.stringify(s));
  await page.reload(); await page.waitForTimeout(300); await bereich(page, 'heute'); s = await sich();
  P.ok('nach dem Neuladen: keine Erinnerung, auf Heute nichts zur Sicherung', s.oben === '' && !s.aufHeute, JSON.stringify(s));
  await page.click('#gear'); await kurz(); s = await sich();
  P.ok('in den Einstellungen steht „Letzte Sicherung: …“', s.msg.indexOf('Letzte Sicherung: ') === 0, JSON.stringify(s));
  await page.click('#es-close'); await kurz();
  /* Letzte Sicherung vor 8 Tagen: 8 ≥ 7, also fällig. Oben steht „Letzte Sicherung vor 8 Tagen“, in den Einstellungen das Datum. */
  await page.evaluate(() => { const t = new Date(); t.setHours(12, 0, 0, 0); t.setDate(t.getDate() - 8); localStorage.setItem('takt.backup', String(t.getTime())); });
  await page.reload(); await page.waitForTimeout(300); await bereich(page, 'heute'); s = await sich();
  P.ok('Sicherung 8 Tage alt: Erinnerung oben', s.oben === 'Letzte Sicherung vor 8 Tagen Jetzt sichern', JSON.stringify(s));

  // --- Teil 7: Erklärungen erst nach Tipp auf das „i“; Farbe nur an der Veränderung ---
  /* Eine offene Erklärung bleibt stehen, wenn man die Klappzeile darunter antippt: Vorher verschwand sie beim Zeichnen, und die angetippte Zeile sprang um ihre Höhe nach oben.
     platz = Lage der Klappzeile auf dem Bildschirm; sie muss vor und nach dem Tipp dieselbe sein. Zuerst wird die Zeile in die Mitte geholt, damit der Tipp selbst nicht scrollt. */
  const infoAuf = id => page.evaluate(i => !document.getElementById('info-' + i).hidden && document.querySelector('.view:not([hidden]) [data-info="' + i + '"]').getAttribute('aria-expanded') === 'true', id);
  const platz = key => page.evaluate(k => Math.round(document.querySelector('.view:not([hidden]) [data-fold="' + k + '"]').getBoundingClientRect().top * 10) / 10, key);
  const bleibt = async (name, id, key) => {
    await page.evaluate(k => document.querySelector('.view:not([hidden]) [data-fold="' + k + '"]').scrollIntoView({ block: 'center' }), key);
    const vor = { auf: await infoAuf(id), y: await platz(key) }; await tipp(key);
    const nach = { auf: await infoAuf(id), y: await platz(key), zeile: (await stand(key)).auf };
    P.ok(name + ': die offene Erklärung bleibt beim Aufklappen stehen, die angetippte Zeile bleibt an ihrem Platz', vor.auf && nach.auf && nach.zeile && nach.y === vor.y, JSON.stringify({ vor, nach }));
  };
  /* Abstand eines Textes unter einer Überschrift: wie bei einer Liste 6 px (Abstand der Spalte 12 px, die Überschrift zieht das Folgende um 6 px heran), darunter die 12 px der Spalte.
     Vorher zog der Text selbst noch einmal 8 px hoch und saß 2 px in der Überschrift. */
  const unterKopf = kopf => page.evaluate(t => { const h = [...document.querySelectorAll('.view:not([hidden]) > h2.sec')].find(x => x.textContent.indexOf(t) === 0), a = h.nextElementSibling, n = a.nextElementSibling, r = e => e.getBoundingClientRect();
    return { was: a.tagName + '.' + a.className, oben: Math.round((r(a).top - r(h).bottom) * 10) / 10, unten: n ? Math.round((r(n).top - r(a).bottom) * 10) / 10 : null }; }, kopf);
  await bereich(page, 'heute'); await page.click('#v-heute [data-h="mode"][data-v="week"]'); await kurz(); await page.click('#v-heute [data-info="ins"]');
  let uk = await unterKopf('Zusammenhänge');
  P.ok('Heute, Woche: die Erklärung unter „Zusammenhänge“ hat 6 px Abstand zur Überschrift und 12 px zur Karte darunter', (await infoAuf('ins')) && uk.was === 'P.note' && uk.oben === 6 && uk.unten === 12, JSON.stringify(uk));
  await page.click('#v-heute [data-h="mode"][data-v="day"]'); await kurz();
  await bereich(page, 'gewicht');
  P.ok('Gewicht: die Legende ist zuerst verborgen', !(await page.isVisible('#info-w-leg')) && (await z('#v-gewicht [data-info="w-leg"]')) === 1);
  await page.click('#v-gewicht [data-info="w-leg"]');
  P.ok('Gewicht: ein Tipp auf das „i“ zeigt sie', (await page.isVisible('#info-w-leg')) && (await text(page, '#info-w-leg span')) === '7-Tage-Schnitt | einzelne Messung', await text(page, '#info-w-leg span'));
  await page.click('#v-gewicht [data-info="w-leg"]');
  P.ok('Gewicht: ein zweiter Tipp verbirgt sie wieder', !(await page.isVisible('#info-w-leg')));
  await page.click('#v-gewicht [data-info="w-leg"]');
  await bleibt('Gewicht „Einträge“', 'w-leg', 'eintraege');
  await page.click(juengster); await page.waitForTimeout(40);
  const nachMonat = (await infoAuf('w-leg')) && (await page.getAttribute(juengster, 'aria-expanded')) === 'false';
  await page.click('#v-gewicht [data-info="w-leg"]');
  P.ok('Gewicht: … auch beim Zuklappen eines Monats; ein Tipp auf das „i“ verbirgt sie dann', nachMonat && !(await page.isVisible('#info-w-leg')) && !(await infoAuf('w-leg')));
  await page.click('#v-gewicht [data-info="w-leg"]');
  await bereich(page, 'training'); await page.click('#v-training .subtabs [data-v="cardio"]'); await kurz();
  /* Cardio „Letzter Lauf“ ist seit v66 eine Klappzeile unter dem Graphen. Zu: Tag, Art, Strecke und Zeit, rechts der Vergleich der Effizienz (v67). Aufgeklappt: Pace, Effizienz, Puls und womit verglichen wird.
     Lauf von heute: 5000 m in 1500 s mit Puls 150 → „5,0 km in 25:00“, 5:00 /km, Effizienz 5000 / (25 × 150) = 1,333. Der Lauf davor ist der von gestern: 5000 m in 1620 s
     mit Puls 152 → 5:24 /km, Effizienz 5000 / (27 × 152) = 1,218. Pace 24 s pro km schneller, Effizienz 1,333 / 1,218 = 1,094 → +9,4 %. */
  const ll = '#v-training [data-fold="letzterLauf"]', llZu = (await text(page, ll)).replace(/\s+/g, ' ');
  P.ok('Cardio „Letzter Lauf“: zuerst zu, mit Tag, Strecke, Zeit und dem Vergleich der Effizienz', (await page.getAttribute(ll, 'aria-expanded')) === 'false' && llZu.includes('Letzter Lauf') && llZu.includes('Heute · 5,0 km in 25:00') && !llZu.includes('Outdoor') && llZu.includes('Effizienz +9,4 %') && !llZu.includes('schneller') && (await z('#v-training .kvs')) === 0, llZu);
  P.ok('Cardio „Letzter Lauf“: der Vergleich ist grün, die Zeile steht unter dem Graphen und über „Läufe“', await page.evaluate(() => {
    const v = document.querySelector('#v-training'), z = v.querySelector('[data-fold="letzterLauf"]'), probe = document.createElement('i'); document.body.appendChild(probe); probe.style.color = 'var(--good)';
    const gut = getComputedStyle(probe).color; probe.remove();
    const y = e => e.getBoundingClientRect().top;
    return getComputedStyle(z.querySelector('.fold .up')).color === gut && y(v.querySelector('.card.chart')) < y(z) && y(z) < y(v.querySelector('[data-fold="laeufe"]')) && !v.querySelector('.card.last');
  }));
  await tipp('letzterLauf');
  const llAuf = (await text(page, '#v-training .kvs')).replace(/\s+/g, ' ');
  P.ok('Cardio „Letzter Lauf“: aufgeklappt stehen Pace, Effizienz und Puls mit Vergleich, darunter womit verglichen wird', ['Pace', '5:00', '24 s pro km schneller', 'Effizienz', 'Puls', 'Vergleich mit dem Lauf davor (Gestern).'].every(t => llAuf.includes(t)) && (await stand('letzterLauf')).auf, llAuf);
  await tipp('letzterLauf');
  await page.click('#v-training .subtabs [data-v="kraft"]'); await kurz(); await page.click('#v-training [data-t="mode"][data-v="year"]'); await kurz(); await page.click('#v-training [data-info="k-imp"]');
  await bleibt('Gym im Jahr „Monate“', 'k-imp', 'gymMonate');   // seit v152 die einzige Klappzeile im Gym
  await page.click('#v-training [data-t="mode"][data-v="month"]'); await kurz();
  /* Der Wechsel des Bereichs stellt den ersten Blick her: Klappzeilen zu, Erklärungen verborgen (die im Gewicht stand noch offen) */
  await bereich(page, 'gewicht'); await kurz();
  P.ok('Gewicht: nach dem Wechsel des Bereichs ist die Erklärung wieder verborgen und „Einträge“ zu', !(await page.isVisible('#info-w-leg')) && (await page.getAttribute('#v-gewicht [data-info="w-leg"]', 'aria-expanded')) === 'false' && !(await stand('eintraege')).auf);
  await bereich(page, 'training'); await page.click('#v-training .subtabs [data-v="cardio"]'); await kurz();
  /* Läufe: Nur die Veränderung trägt Farbe, „Effizienz 1,33“ davor bleibt in der Farbe der Nebentexte.
     Lauf von heute: 5000 m in 1500 s mit Puls 150 → 5000 / (25 × 150) = 1,333 m pro Herzschlag; gestern 5000 m in 1620 s mit Puls 152 → 5000 / (27 × 152) = 1,218.
     1,333 / 1,218 = 1,094 → +9,4 %, besser, also grün. */
  await tipp('laeufe');
  const eff = await page.evaluate(() => {
    const sm = document.querySelector('#v-training [data-t="edit"] .r small'), sp = sm.querySelector('span'), f = el => getComputedStyle(el).color, probe = document.createElement('i'); document.body.appendChild(probe);
    probe.style.color = 'var(--good)'; const gut = f(probe); probe.style.color = 'var(--muted)'; const neben = f(probe); document.body.removeChild(probe);
    return { text: sm.textContent, teil: sp ? sp.textContent : '', fTeil: sp ? f(sp) : '', fRest: f(sm), gut, neben };
  });
  P.ok('Cardio „Läufe“: nur die Veränderung ist grün, der Rest wie die Nebentexte', eff.text === 'Effizienz 1,33 · +9,4 %' && eff.teil === '+9,4 %' && eff.fTeil === eff.gut && eff.fRest === eff.neben && eff.gut !== eff.neben, JSON.stringify(eff));
  await browser.close(); fehler.forEach(f => P.ok(f, false));

  // --- Teil 8: eigene kleine Daten ---
  /* Gym ohne Plan: Der Satz unter „Plan“ sitzt wie eine Liste 6 px unter der Überschrift, die Klappzeilen folgen mit 12 px. */
  const ohnePlan = daten(); ohnePlan.K.plans = {};
  ({ browser, page, fehler } = await oeffnen({ daten: ohnePlan }));
  await bereich(page, 'training'); await page.click('#v-training .subtabs [data-v="kraft"]'); await kurz();
  uk = await unterKopf('Plan');
  P.ok('Gym ohne Plan: der Satz unter „Plan“ hat 6 px Abstand zur Überschrift; darunter nichts mehr (seit v152 keine Klappzeilen)', uk.was === 'P.note' && uk.oben === 6 && uk.unten === null && (await text(page, '#v-training h2.sec + .note')).indexOf('Lege einen Plan an') === 0, JSON.stringify(uk));
  await browser.close(); fehler.forEach(f => P.ok(f, false));

  /* Gewicht bei wenigen Einträgen im jüngsten Monat (Monatsanfang, oder wer einmal die Woche wiegt): heute einer, im Vormonat am 28., 21. und 14., davor einer.
     Offen ist ein Monat, solange in den jüngeren weniger als drei Einträge liegen: laufender Monat (davor 0), Vormonat (davor 1), der Monat davor nicht (davor 1 + 3 = 4).
     Nach einem Tipp auf „Einträge“ stehen also vier Zeilen da, darunter die jüngsten drei (heute, 28., 21.). */
  const w = leer(), wTage = [tag(0), monat(1) + '-28', monat(1) + '-21', monat(1) + '-14'];
  wTage.forEach((k, i) => { w.W.entries[k] = 80 + i * 0.3; }); w.W.entries[monat(2) + '-20'] = 82;
  const gewicht = async dat => {
    const o = await oeffnen({ daten: dat }); await bereich(o.page, 'gewicht'); await o.page.click('#v-gewicht [data-fold="eintraege"]'); await o.page.waitForTimeout(60);
    const r = { monate: await o.page.$$eval('#v-gewicht .mon', l => l.map(b => b.getAttribute('aria-expanded') === 'true' ? 'auf' : 'zu').join(' ')), zeilen: await o.page.$$eval('#v-gewicht [data-w="edit"]', l => l.map(b => b.dataset.k).join(' ')) };
    if (r.zeilen.includes(' ')) { await o.page.click('#v-gewicht [data-w="edit"] >> nth=1'); await o.page.waitForTimeout(150); }
    r.blatt = await o.page.inputValue('#w-date');
    await o.browser.close(); o.fehler.forEach(f => P.ok(f, false));
    return r;
  };
  let gw = await gewicht(w);
  P.ok('Gewicht, heute ein Eintrag und drei im Vormonat: ein Tipp auf „Einträge“ zeigt beide Monate offen, den dritten zu', gw.monate === 'auf auf zu' && gw.zeilen === wTage.join(' '), JSON.stringify(gw));
  P.ok('… und der zweitjüngste Eintrag (28. des Vormonats) ist mit dem nächsten Tipp im Blatt', gw.blatt === wTage[1], gw.blatt);
  /* Ein Eintrag je Monat, fünf Monate: offen sind der laufende (davor 0), der Vormonat (davor 1) und der davor (davor 2); zu sind die zwei ältesten (davor 3 und 4). */
  const w5 = leer(), w5Tage = [tag(0), monat(1) + '-15', monat(2) + '-15', monat(3) + '-15', monat(4) + '-15'];
  w5Tage.forEach((k, i) => { w5.W.entries[k] = 80 + i * 0.5; });
  gw = await gewicht(w5);
  P.ok('Gewicht, ein Eintrag je Monat: die drei jüngsten Monate sind offen, die zwei älteren zu', gw.monate === 'auf auf auf zu zu' && gw.zeilen === w5Tage.slice(0, 3).join(' '), JSON.stringify(gw));

  /* Die Liste der Einträge entsteht nur aufgeklappt, sonst würde jeder Tipp auf eine Klappzeile mit jedem Eintrag langsamer.
     Gezählt wird, wie oft die Seite bei einem Tipp auf „Übungen“ im Gym (zeichnet alles neu) eine Zahl formatiert (toLocaleString): mit den 56 Einträgen der Beispieldaten
     und mit 300 älteren dazu. Jede Zeile eines Eintrags formatiert ihr Gewicht zweimal; mit dem Fehler wären es 2 × 300 = 600 Aufrufe mehr. Zugeklappt kommt nichts dazu; verlangt wird weniger als ein Aufruf je zusätzlichem Eintrag. */
  const viele = daten(); for (let i = 100; i < 400; i++) viele.W.entries[tag(i)] = 81;
  const formatiert = async dat => {
    const o = await oeffnen({ daten: dat }); await bereich(o.page, 'training'); await o.page.click('#v-training [data-t="mode"][data-v="year"]');
    const n = await o.page.evaluate(() => { const echt = Number.prototype.toLocaleString; let k = 0; Number.prototype.toLocaleString = function (...a) { k++; return echt.apply(this, a); };
      document.querySelector('#v-training [data-fold="gymMonate"]').click(); Number.prototype.toLocaleString = echt; return k; });
    const offen = await o.page.getAttribute('#v-training [data-fold="gymMonate"]', 'aria-expanded'), eintr = await o.page.$eval('#v-gewicht [data-fold="eintraege"] .fold', e => e.textContent.trim());
    await o.browser.close(); o.fehler.forEach(f => P.ok(f, false));
    return { n, offen, eintr };
  };
  const f56 = await formatiert(d), f356 = await formatiert(viele);
  P.ok('Gewicht: mit 300 Einträgen mehr formatiert ein Tipp auf eine Klappzeile nicht mehr Zahlen (zugeklappt entsteht die Liste nicht)',
    f56.offen === 'true' && f356.offen === 'true' && f56.eintr === '56' && f356.eintr === '356' && f56.n > 0 && f356.n - f56.n < 300, JSON.stringify({ f56, f356 }));

  /* Leere Stammdaten: nur eine Ausgabe im Vormonat. Im laufenden Monat gibt es dann keine Budgets, keine Einnahmen und keine Fixkosten:
     je eine Zeile mit Plus, die gleich das Blatt zum Anlegen öffnet. Leere Verläufe (Ausgaben) bekommen keine Zeile. */
  const e = leer(), vm = monat(1) + '-10';
  e.MY[vm.slice(0, 4)] = { tx: { a: { d: vm, a: 1000, k: 'out', c: 'essen', n: '' } } };
  ({ browser, page, fehler } = await oeffnen({ daten: e }));
  await bereich(page, 'haushalt'); await kurz();
  const plus = await page.$$eval('#v-haushalt .folds .fo', l => l.map(b => b.textContent.trim() + (b.querySelector('.fold.plus svg') ? ' +' : '') + (b.hasAttribute('aria-expanded') ? ' (Klappzeile)' : '')));
  P.ok('ohne Stammdaten: Zeilen mit Plus für Budgets, Feste Einnahmen, Fixkosten; keine Zeile „Ausgaben“', plus.join(' | ') === 'Budgets + | Feste Einnahmen + | Fixkosten +' && (await z('#v-haushalt [data-fold]')) === 0, plus.join(' | '));
  await blatt('Zeile „Budgets“ öffnet das Blatt „Budget“', '.fo[data-m="budget"]', '#msheet', '#ms-title', 'Budget');
  await blatt('Zeile „Feste Einnahmen“ öffnet das Blatt „Feste Einnahme“', '.fo[data-m="newin"]', '#msheet', '#ms-title', 'Feste Einnahme');
  await blatt('Zeile „Fixkosten“ öffnet das Blatt „Fixkosten“', '.fo[data-m="newfix"]', '#msheet', '#ms-title', 'Fixkosten');
  await browser.close();

  /* Cardio, Kachel „Effizienz“: Das Plus oder Minus zum Vormonat steht klein neben dem Wert (v66, vorher ein loser Satz unter den Kacheln). Uhr der Seite auf dem 15., je ein Lauf am 10. dieses und des letzten Monats.
     Dieser Monat: 5000 m in 1500 s mit Puls 150 → 5000 / (25 × 150) = 1,333. Vormonat 5000 m in 1620 s mit Puls 152 → 5000 / (27 × 152) = 1,218. 1,333 / 1,218 = 1,094 → „+9,4 %“, grün.
     Zweiter Fall, Vormonat 5000 m in 1800 s mit Puls 160 → 5000 / (30 × 160) = 1,042. 1,333 / 1,042 = 1,280 → ab 10 % ohne Nachkommastelle „+28 %“ (sonst wird die Kachel bei 320 px zu eng). */
  for (const [sek, puls, soll] of [[1620, 152, '+9,4 %'], [1800, 160, '+28 %']]) {
    const c = leer(), M = monat(0);
    c.T = { hk: {}, runs: { a: { d: M + '-10', m: 5000, s: 1500, hr: 150, k: 'out' }, b: { d: monat(1) + '-10', m: 5000, s: sek, hr: puls, k: 'out' } } };
    ({ browser, page, fehler } = await oeffnen({ daten: c, breite: 320, uhr: new Date(+M.slice(0, 4), +M.slice(5) - 1, 15, 12) }));
    await bereich(page, 'training'); await page.click('#v-training .subtabs [data-v="cardio"]'); await kurz();
    const kachel = await page.evaluate(() => {
      const v = document.querySelector('#v-training'), f = [...v.querySelectorAll('.fig')].find(e => e.textContent.includes('Effizienz')), d = f.querySelector('b .up, b .down');
      return { text: f.textContent, delta: d ? d.textContent : '', gruen: !!f.querySelector('b .up'), satz: v.textContent.includes('Effizienz im Schnitt'), passt: f.querySelector('b').scrollWidth <= f.clientWidth, seite: document.querySelector('#scroll').scrollWidth <= document.querySelector('#scroll').clientWidth };
    });
    P.ok('Cardio, Kachel „Effizienz“: ' + soll + ' zum Vormonat neben dem Wert, grün, kein loser Satz, passt bei 320 px', kachel.delta === soll && kachel.gruen && kachel.text.includes('1,33') && !kachel.satz && kachel.passt && kachel.seite, JSON.stringify(kachel));
    await browser.close();
  }
  /* Ohne Puls gibt es keine Effizienz: Dann steht rechts in der Zeile „Letzter Lauf“ der Vergleich der Pace. Läufe am 10. (5000 m in 1620 s) und am 12. (5000 m in 1500 s): 24 s pro km schneller. */
  {
    const c = leer(), M = monat(0);
    c.T = { hk: {}, runs: { a: { d: M + '-10', m: 5000, s: 1620, hr: null, k: 'out' }, b: { d: M + '-12', m: 5000, s: 1500, hr: null, k: 'out' } } };
    ({ browser, page, fehler } = await oeffnen({ daten: c, uhr: new Date(+M.slice(0, 4), +M.slice(5) - 1, 15, 12) }));
    await bereich(page, 'training'); await page.click('#v-training .subtabs [data-v="cardio"]'); await kurz();
    const ohne = (await text(page, '#v-training [data-fold="letzterLauf"]')).replace(/\s+/g, ' ');
    P.ok('Cardio „Letzter Lauf“ ohne Puls: rechts steht der Vergleich der Pace', ohne.includes('24 s schneller') && !ohne.includes('Effizienz'), ohne);
  }
  await browser.close();

  // --- Cardio: Die Karte mit dem Verlauf gibt es erst, wenn es einen Graphen gibt (v76; vorher stand bei einem einzigen Lauf eine leere Karte mit zwei Knöpfen da) ---
  const lf = (i, hr) => ({ d: tag(i), m: 5000, s: 1500 + i * 60, hr, k: 'out' }), nurLaeufe = runs => ({ S: { routines: [], running: null }, LY: {}, T: { runs } });
  const karte = async runs => { const o = await oeffnen({ daten: nurLaeufe(runs) }); await bereich(o.page, 'training'); await o.page.click('#v-training .subtabs [data-v="cardio"]');
    const r = await o.page.evaluate(() => { const k = document.querySelector('#v-training .card.chart'), v = document.querySelector('#v-training'); return { karte: !!k, graph: !!(k && k.querySelector('svg')), knoepfe: k ? k.querySelectorAll('[data-t="metric"]').length : 0, satz: v.innerText.includes('Ab zwei Läufen'), letzter: !!v.querySelector('[data-fold="letzterLauf"]'), laeufe: !!v.querySelector('[data-fold="laeufe"]') }; });
    fehler.push(...o.fehler); await o.browser.close(); return r; };
  const einer = await karte({ a: lf(0, 143) });
  P.ok('Cardio, ein Lauf: keine Karte mit dem Verlauf, kein Satz „Ab zwei Läufen“; „Letzter Lauf“ und „Läufe“ stehen da', !einer.karte && !einer.satz && einer.letzter && einer.laeufe, JSON.stringify(einer));
  const zwei = await karte({ a: lf(0, 143), b: lf(3, 150) });
  P.ok('Cardio, zwei Läufe mit Puls: Karte mit Graph und beiden Knöpfen', zwei.karte && zwei.graph && zwei.knoepfe === 2, JSON.stringify(zwei));
  // zwei Läufe ohne Puls: Für die Effizienz gibt es keinen Graphen, für die Pace schon. Die Karte bleibt, damit man auf „Pace“ umschalten kann.
  const ohne = await karte({ a: lf(0, null), b: lf(3, null) });
  P.ok('Cardio, zwei Läufe ohne Puls: Karte bleibt mit dem Hinweis und den Knöpfen (Pace hat einen Graphen)', ohne.karte && !ohne.graph && ohne.knoepfe === 2 && ohne.satz, JSON.stringify(ohne));

  // --- Gewicht und Heute ohne Doppeltes und ohne leere Zeilen (v78, seine Bildschirmfotos vom 23.11.) ---
  // Wie bei ihm: erster Eintrag 90,0 kg, der letzte knapp darunter (89,99 kg), Ziel 93 ab 90. Der Schnitt liegt damit um weniger als 0,05 kg unter dem Anfang:
  // gerundet „0,0“. Davor konnte dort „−0,0 kg“ stehen; ein Vorzeichen vor einer Null gibt es nicht mehr.
  const gwi = await oeffnen({ daten: { S: { routines: [], running: null }, LY: {}, W: { goal: 93, goalFrom: 90, entries: { [tag(66)]: 90, [tag(3)]: 89.99 } } } });
  await bereich(gwi.page, 'gewicht');
  const kacheln = await gwi.page.$$eval('#v-gewicht .figs .fig', l => l.map(f => f.innerText.replace(/\s+/g, ' ').trim()));
  P.ok('Gewicht: Kachel „0,0 kg seit …“ ohne Vorzeichen', kacheln.length === 1 && /^0,0 ?kg seit /.test(kacheln[0]), JSON.stringify(kacheln));
  P.ok('Gewicht: keine Kachel „bis zum Ziel“, das Ziel steht einmal in der Karte darunter', !kacheln.join().includes('Ziel') && (await text(gwi.page, '#v-gewicht .row.goal')).includes('Ziel 93,0 kg') && (await text(gwi.page, '#v-gewicht .row.goal')).includes('noch 3,0 kg'), await text(gwi.page, '#v-gewicht .row.goal'));
  /* Zielkarte ruhiger (v106): kein Symbol mehr, die Prozentzahl klein in einer Zeile („… %“), der Tag kurz; der Fortschritt bleibt die Linie unten */
  const zk = await gwi.page.evaluate(() => { const r = document.querySelector('#v-gewicht .row.goal'), pz = r.querySelector('.pz'); return { symbol: !!r.querySelector('.glyph'), pz: pz ? pz.textContent : '', gross: pz ? parseFloat(getComputedStyle(pz).fontSize) : 0, linie: !!r.querySelector('.fill') }; });
  P.ok('Gewicht: Zielkarte ohne Symbol, Prozent klein in einer Zeile (hier noch 0 %, dann steht keine Zahl), Fortschritt als Linie', !zk.symbol && (zk.pz === '' || /^\d+ %$/.test(zk.pz) && zk.gross <= 16) && zk.linie, JSON.stringify(zk));
  // Heute: Nur Gewicht ist eingetragen → eine Zeile in der Übersicht, keine für Finanzen und Training, kein „Tippe, um …“
  await bereich(gwi.page, 'heute');
  const ov = await gwi.page.$$eval('#v-heute .ov', l => l.map(b => b.dataset.v).join());
  P.ok('Heute: Übersicht zeigt nur Bereiche mit Inhalt (hier Gewicht)', ov === 'gewicht' && !(await text(gwi.page, '#v-heute')).includes('Tippe, um'), ov + ' · ' + await text(gwi.page, '#v-heute .ovs'));
  fehler.push(...gwi.fehler); await gwi.browser.close();
  const le = await oeffnen(); await bereich(le.page, 'heute');
  P.ok('Heute, leere App: keine Übersicht und keine leere Fläche dafür', !(await le.page.$('#v-heute .ovs')) && !(await le.page.$('#v-heute .ov')) && !(await text(le.page, '#v-heute')).includes('Tippe, um'), await text(le.page, '#v-heute'));
  fehler.push(...le.fehler); await le.browser.close();

  // --- v80: Punkt fürs Wiegen in der Wochenleiste auf Heute, Zeilen für Arbeit und Uni, Überblenden, Satz-Vergleich im Gym ---
  // Feste Uhr (Sonntag, 15.11.2026, 12 Uhr), damit „dieser Monat“ und die Woche feststehen. Gewogen am 14. und 15., Lauf am 15.
  // Arbeit im November: 14.11. 14:00–20:30 mit 30 min Pause = 6 Std × 14,50 € = 87,00 €; 10.11. 10:00–16:00 = 6 Std × 14,50 € = 87,00 € → 174,00 €, 12 Std an 2 Tagen.
  // Uni: 4 + 2,5 + 3 = 9,5 Punkte bei 3 Terminen → „3 von 18 Terminen“.
  // Gym, letztes Mal (12.11.): Bankdrücken 70 × 8 und 60 × 7.
  const hd = { S: { routines: [], running: null }, LY: {}, W: { goal: null, goalFrom: null, entries: { '2026-11-14': 80, '2026-11-15': 80.2 } }, T: { runs: { a: { d: '2026-11-15', m: 5000, s: 1500, hr: 150 } } },
    N: { folders: {}, tasks: {}, notes: {}, work: { rate: 1450, e: { a1: { d: '2026-11-14', a: 840, b: 1230, p: 30, r: 1450 }, a2: { d: '2026-11-10', a: 600, b: 960, p: 0, r: 1450 } } },
      uni: { e: { u1: { d: '2026-11-12', f: 'kons', p: 400, n: '' }, u2: { d: '2026-11-05', f: 'kons', p: 250, n: '' }, u3: { d: '2026-11-03', f: 'paro', p: 300, n: '' } } } },
    K: { ex: { e1: { n: 'Bankdrücken' } }, log: { '2026-11-12': { e1: [[70, 8], [60, 7]] } }, plans: { p1: { n: 'Oberkörper', items: [{ id: 'e1', sets: 3 }] } }, meta: {}, live: null } };
  const h8 = await oeffnen({ daten: hd, uhr: new Date(2026, 10, 15, 12) }), q8 = h8.page, w8 = () => q8.waitForTimeout(200);
  await bereich(q8, 'heute');
  const punkte = await q8.evaluate(() => [...document.querySelectorAll('#v-heute .wk .wd')].map(b => [...b.querySelectorAll('u')].map(u => u.className).join('')).join('|'));
  P.ok('Heute, Wochenleiste: keine Punkte für Gym, Wiegen und Laufen (seit v135 nur Termine aus Apples Kalender)', punkte === '||||||', punkte);
  const ov8 = await q8.$$eval('#v-heute .ov', l => l.map(b => b.innerText.replace(/\s+/g, ' ').trim()));
  P.ok('Heute, Übersicht: Gewicht, Training, Arbeit (174,00 €, 12 Std an 2 Tagen im November), Uni (9,5 Punkte, 3 von 18 Terminen)', ov8.length === 4 && ov8[2] === 'Arbeit 174,00 € 12 Std an 2 Tagen im November' && ov8[3] === 'Uni 9,5 Punkte 3 von 18 Terminen', JSON.stringify(ov8));
  await q8.click('#v-heute .ov[data-teil="uni"]'); const neu8 = await q8.evaluate(() => document.querySelector('#v-routinen').classList.contains('neu')); await w8();
  P.ok('Tipp auf „Uni“ öffnet den Planer im Teil Uni; oben steht „Planer.“', (await q8.isVisible('#v-routinen')) && (await text(q8, '#r-subs [aria-pressed="true"]')) === 'Uni' && (await text(q8, '.mark')) === 'Planer.' && (await text(q8, '#n-main .hero')).includes('3 von 18 Terminen'));
  P.ok('nach dem Wechsel trägt die neue Ansicht die Klasse zum Einblenden (neu, 0,7 s lang: ihre Teile steigen nacheinander auf)', neu8);
  await bereich(q8, 'heute'); await q8.click('#v-heute .ov[data-teil="work"]'); await w8();
  P.ok('Tipp auf „Arbeit“ öffnet den Planer im Teil Arbeit', (await text(q8, '#r-subs [aria-pressed="true"]')) === 'Arbeit' && (await text(q8, '#n-main .hero')).includes('174,00'));
  // Gym: Satz 1 mit 72,5 × 8 (letztes Mal 70 × 8) → „+2,5“ am Gewicht. Satz 2 mit 60 × 9 (letztes Mal 60 × 7) → „+2“ an den Wiederholungen. Satz 3 gab es letztes Mal nicht → nichts.
  await bereich(q8, 'training'); await q8.click('#v-training .subtabs [data-v="kraft"]'); await w8(); await q8.click('#v-training [data-k="start"]'); await q8.waitForTimeout(300);
  const satz = async (kg, wdh) => { await zahlWahl(q8, '#l-w', kg); await zahlWahl(q8, '#l-r', wdh); await q8.click('#l-items .chk'); await w8(); };
  await satz('72,5', '8'); await satz('60', '9'); await satz('50', '5');
  const zeilen8 = await q8.$$eval('#l-items .lx > .lt .lt-r', l => l.map(z => [...z.querySelectorAll('.mehr')].map(m => m.parentElement.textContent.replace(/\s+/g, '')).join('/')));
  P.ok('Gym: „+2,5“ am Gewicht von Satz 1, „+2“ an den Wiederholungen von Satz 2, nichts an Satz 3', zeilen8.join('|') === '72,5+2,5|9+2|', JSON.stringify(zeilen8));
  await q8.click('#l-del'); await q8.click('#l-del'); await w8();
  fehler.push(...h8.fehler); await h8.browser.close();
  await P.ende(null, fehler);
});
