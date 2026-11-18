// Klappzeilen: Verläufe und Stammdaten sind je eine eingeklappte Zeile mit Anzahl, „Hinzufügen“ sitzt als Plus in der Überschrift
// oder als letzte Zeile der aufgeklappten Liste, Heute zeigt die Kurzfassung. Auf und zu liegt in einem Zustand (fo) mit einem Weg (data-fold).
const { oeffnen, text, bereich, pruefer, lauf, blaetterZu, tag, monat } = require('./lib');
const { beispiel } = require('./daten');

/* Beispieldaten, ergänzt um das, was sonst vom Kalendertag abhinge oder fehlt: ein Lauf und eine Einheit von heute (am Monatsersten gäbe es
   sonst keine Zeile „Läufe“ und „Einheiten“), eine Umbuchung von heute und fünf weitere Aufgaben für heute. */
function daten() {
  const d = beispiel(), y = tag(0).slice(0, 4);
  d.T.runs.heute = { d: tag(0), m: 5000, s: 1500, hr: 150, k: 'out' };
  d.K.log[tag(0)] = { e1: [[70, 8], [70, 7]] }; d.K.meta[tag(0)] = { dur: 1800, plan: 'p1' };
  d.MY[y].tx.um = { d: tag(0), a: 5000, k: 'tr', acc: 'giro', to: 'spar', c: '', n: '', t: Date.now() };
  for (let i = 0; i < 5; i++) d.N.tasks['h' + i] = { t: 'Für heute ' + (i + 1), f: 'uni', d: tag(0), done: null, c: Date.now() - 1000 + i, n: 'mit Notiz', r: '' };
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
  const erste = nach && document.elementFromPoint(cx, Math.ceil(nach.getBoundingClientRect().top));
  return { name: b.textContent.trim() || b.getAttribute('aria-label'), b: rt - l + 1, h: u - o + 1, mitte: trifft(cx, cy),
    unten: nach ? nach.getBoundingClientRect().top - (u + 1) : 99, oben: vor ? o - vor.getBoundingClientRect().bottom : 99, listeFrei: !nach || (!!erste && nach.contains(erste)) };
});
/* Läuft in der Seite. Ragt im sichtbaren Bereich etwas seitlich hinaus?
   scroll, seite: so viel ließe sich seitlich wischen (muss 0 sein). raus: Elemente, die über den Bereich hinausstehen, auch wenn eine Liste sie abschneidet (muss 0 sein);
   die Reihe der Schnell-Knöpfe auf Heute reicht bewusst von Rand zu Rand und zählt nicht. view: Überstand des Bereichs samt unsichtbarer Tippflächen (::after),
   er darf in den Seitenrand (rand) reichen, aber nicht über den Bildschirm hinaus. */
const breiten = () => {
  const s = document.querySelector('#scroll'), v = document.querySelector('.view:not([hidden])'), r = v.getBoundingClientRect();
  const raus = [...v.querySelectorAll('*')].filter(el => { const q = el.getBoundingClientRect(); return q.width > 0 && !el.closest('.quick') && (q.right > r.right + 0.5 || q.left < r.left - 0.5); }).length;
  return { auf: v.querySelectorAll('[data-fold][aria-expanded="true"]').length, zu: v.querySelectorAll('[data-fold][aria-expanded="false"]').length,
    scroll: s.scrollWidth - s.clientWidth, seite: document.documentElement.scrollWidth - innerWidth, view: v.scrollWidth - v.clientWidth, rand: Math.round(r.left), raus };
};
const passtHinein = m => m.scroll <= 0 && m.seite <= 0 && m.raus === 0 && m.view <= m.rand;

lauf(async () => {
  const P = pruefer('Klappzeilen');
  const d = daten(), jahr = tag(0).slice(0, 4), ym = monat(0);
  let { browser, page, fehler } = await oeffnen({ daten: d });
  const kurz = () => page.waitForTimeout(120);
  const z = sel => page.$$eval(sel, l => l.length);
  const sub = async v => { await page.click('#v-haushalt [data-m="sub"][data-v="' + v + '"]'); await kurz(); };
  const zeit = async (wo, v) => { await page.click('#v-' + wo + ' [data-' + (wo === 'haushalt' ? 'm' : 't') + '="mode"][data-v="' + v + '"]'); await kurz(); };
  const tipp = async key => { await page.click('.view:not([hidden]) [data-fold="' + key + '"]'); await page.waitForTimeout(60); };
  /* Stand einer Klappzeile im sichtbaren Bereich: offen?, Angabe rechts, Zahl der Zeilen darunter. Gezählt werden die Zeilen derselben Liste
     ohne die Klappzeile und ohne Aktionszeilen („+ Fixkosten“); steht der Inhalt unter der Liste, zählen dort die Einträge (Gewicht) oder Kategorien. */
  const stand = key => page.evaluate(k => {
    const v = document.querySelector('.view:not([hidden])'), b = v.querySelector('[data-fold="' + k + '"]'); if (!b) return null;
    const ul = b.closest('ul'), nach = ul.nextElementSibling, auf = b.getAttribute('aria-expanded') === 'true';
    const drunter = !nach ? 0 : nach.classList.contains('mons') ? nach.querySelectorAll('[data-w="edit"]').length : nach.classList.contains('card') ? nach.querySelectorAll('.cat').length : 0;
    return { auf, rechts: b.querySelector('.fold').textContent.trim(), zeilen: [...ul.children].slice(1).filter(li => !li.querySelector('.act')).length + drunter,
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
  /* Gezeichnet sind nach dem Start mindestens: Sicherung (Heute), Einträge (Gewicht), Umbuchungen (Vermögen), Läufe (Cardio) */
  const start = await page.$$eval('[data-fold]', l => l.map(b => b.dataset.fold + (b.getAttribute('aria-expanded') === 'true' ? ' offen' : '')));
  P.ok('nach dem Start ist in keinem Bereich etwas aufgeklappt', ['sicherung', 'eintraege', 'umbuchungen', 'laeufe'].every(k => start.includes(k)) && !start.some(k => k.includes('offen')), start.join(', '));

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
  await bereich(page, 'haushalt'); await sub('budget');
  await klappe('Budget „Ausgaben“', 'ausgaben', tx.filter(t => t.k === 'out' && imMonat(t.d)).length);
  await klappe('Budget „Einnahmen“', 'einnahmen', 1 + (imMonat(tag(12)) ? 1 : 0));
  await klappe('Budget „Fixkosten“', 'fixkosten', 3);
  /* Budget im Jahr. Monate: Die festen Posten laufen seit zehn Monaten, also hat jeder Monat des Jahres bis heute Einträge, höchstens aber elf (im November: 11).
     Kategorien: so viele verschiedene, wie die Ausgaben des Jahres tragen (im November: Lebensmittel, Essen gehen, Spaß, Drogerie, Kleidung → 5). */
  await zeit('haushalt', 'year');
  await klappe('Budget im Jahr „Monate“', 'budgetMonate', Math.min(+ym.slice(5), 11));
  await klappe('Budget im Jahr „Flexible Kosten nach Kategorie“', 'kategorien', new Set(tx.filter(t => t.k === 'out' && imJahr(t.d)).map(t => t.c)).size);
  await zeit('haushalt', 'month');

  /* Vermögen: eine Umbuchung von heute. Im Jahr: Stände gibt es seit drei Monaten, seitdem hat jeder Monat einen Wert, also höchstens vier Monate (im November: 4). */
  await sub('verm');
  await klappe('Vermögen „Umbuchungen“', 'umbuchungen', 1);
  await zeit('haushalt', 'year');
  await klappe('Vermögen im Jahr „Monate“', 'vermMonate', Math.min(+ym.slice(5), 4));
  await zeit('haushalt', 'month');

  /* Cardio: die Läufe der Beispieldaten im laufenden Monat (am 18.: vor 1, 4, 8, 12, 17 Tagen) und der von heute → 6. Im Jahr: so viele Monate, wie Läufe haben. */
  const laeufe = Object.values(d.T.runs).map(r => r.d);
  await bereich(page, 'training'); await page.click('#v-training .subtabs button:nth-child(1)'); await kurz();
  await klappe('Cardio „Läufe“', 'laeufe', laeufe.filter(imMonat).length);
  await zeit('training', 'year');
  await klappe('Cardio im Jahr „Monate“', 'cardioMonate', monate(laeufe));
  await zeit('training', 'month');

  /* Gym: vier Übungen (Bankdrücken, Kniebeuge, Klimmzüge, Schulterdrücken); Einheiten des laufenden Monats (am 18.: vor 2, 6, 10, 14 Tagen und heute → 5). */
  const einheiten = Object.keys(d.K.log);
  await page.click('#v-training .subtabs button:nth-child(2)'); await kurz();
  await klappe('Gym „Übungen“', 'uebungen', 4);
  await klappe('Gym „Einheiten“', 'einheiten', einheiten.filter(imMonat).length);
  await zeit('training', 'year');
  await klappe('Gym im Jahr „Monate“', 'gymMonate', monate(einheiten));
  await klappe('Gym im Jahr „Übungen“', 'uebungen', 4);
  await zeit('training', 'month');

  /* Aufgaben: 14 früher erledigte (d0 … d13); die heute abgehakte steht bei Heute, nicht unter „Erledigt“ */
  await bereich(page, 'routinen'); await page.click('#r-subs [data-v="task"]'); await kurz();
  await klappe('Aufgaben „Erledigt“', 'erledigt', 14);
  await page.click('#r-subs [data-v="rout"]');

  // --- Teil 2: Aufgeklapptes bleibt im Bereich offen und klappt beim Wechsel des Bereichs zu ---
  await bereich(page, 'haushalt'); await sub('budget'); await tipp('fixkosten');
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
  await page.click('#v-haushalt [data-m="add"]'); await page.fill('#m-amt', '3'); await page.click('#m-acc .chip:has-text("Kein Konto")'); await page.click('#m-save'); await kurz();
  P.ok('Budget: … und nach dem Speichern einer Ausgabe; die Zeile „Ausgaben“ bleibt zu und zählt eine mehr', await fix() && +(await stand('ausgaben')).rechts === vorher + 1 && !(await stand('ausgaben')).auf, JSON.stringify(await stand('ausgaben')));
  await sub('verm'); await sub('budget');
  P.ok('Budget: … und nach dem Wechsel zu Vermögen und zurück (derselbe Bereich)', await fix());
  await bereich(page, 'gewicht'); await bereich(page, 'haushalt'); await kurz();
  P.ok('Budget: nach dem Wechsel in einen anderen Bereich und zurück ist „Fixkosten“ zu', (await stand('fixkosten')).auf === false && (await z('[data-fold][aria-expanded="true"]')) === 0, JSON.stringify(await stand('fixkosten')));

  await bereich(page, 'training'); await page.click('#v-training .subtabs button:nth-child(2)'); await kurz(); await tipp('uebungen');
  const ueb = async () => { const s = await stand('uebungen'); return !!s && s.auf && s.zeilen === 4; };
  await page.click('#v-training .mnav button:first-child'); await kurz();
  P.ok('Gym: „Übungen“ bleibt beim Blättern zum Vormonat offen', await ueb() && (await text(page, '#v-training .mnav b')).indexOf(MON[+monat(1).slice(5) - 1]) === 0);
  await page.click('#v-training .mnav button:last-child'); await kurz();
  await page.click('#v-training [data-k="ex"]'); await kurz();
  const xAuf = await page.isVisible('#xsheet[open]');
  await page.click('#xs-close'); await kurz();
  P.ok('Gym: … und nach dem Blatt der Übung', xAuf && await ueb());
  await page.click('#v-training .subtabs button:nth-child(1)'); await kurz(); await page.click('#v-training .subtabs button:nth-child(2)'); await kurz();
  P.ok('Gym: … und nach dem Wechsel zu Cardio und zurück (derselbe Bereich)', await ueb());
  await bereich(page, 'heute'); await bereich(page, 'training'); await kurz();
  P.ok('Gym: nach dem Wechsel in einen anderen Bereich und zurück ist „Übungen“ zu', (await stand('uebungen')).auf === false);

  /* Gewicht: Der jüngste Monat ist ohne Merker offen. Klappt man ihn zu und wechselt den Bereich, gilt wieder der erste Blick: Einträge zu, darin der jüngste Monat offen. */
  await bereich(page, 'gewicht'); await tipp('eintraege'); await page.click(juengster); await page.waitForTimeout(40);
  P.ok('Gewicht: jüngster Monat zugeklappt, keiner seiner Einträge zu sehen', (await page.getAttribute(juengster, 'aria-expanded')) === 'false' && (await z(imJuengsten)) === 0);
  await page.click('#v-gewicht [data-w="add"]'); await kurz(); await page.click('#ws-close'); await kurz();
  P.ok('Gewicht: bleibt nach einem Blatt so', (await stand('eintraege')).auf && (await page.getAttribute(juengster, 'aria-expanded')) === 'false');
  await bereich(page, 'training'); await bereich(page, 'gewicht'); await kurz();
  const zu = await stand('eintraege'); await tipp('eintraege');
  P.ok('Gewicht: nach dem Wechsel des Bereichs zu, beim Aufklappen ist der jüngste Monat wieder offen', !zu.auf && (await page.getAttribute(juengster, 'aria-expanded')) === 'true');
  /* Auch der Weg über die Übersicht auf Heute ist ein Wechsel des Bereichs */
  await bereich(page, 'heute'); await tipp('sicherung'); await page.click('#v-heute .ov[data-v="gewicht"]'); await kurz(); await bereich(page, 'heute'); await kurz();
  P.ok('Heute: „Sicherung“ ist nach dem Sprung in einen Bereich und zurück zu', (await stand('sicherung')).auf === false);

  // --- Teil 3: die verlegten Aktionen öffnen das richtige Blatt ---
  const blatt = async (name, sel, dlg, titelSel, titel, kopf) => {
    const h = kopf ? await text(page, '.view:not([hidden]) h2:has(' + sel + ')') : '';
    await page.click('.view:not([hidden]) ' + sel); await page.waitForTimeout(200);
    const offen = await page.isVisible(dlg + '[open]'), t = await text(page, titelSel);
    P.ok(name, offen && t === titel && (!kopf || h.indexOf(kopf) === 0), JSON.stringify({ offen, t, h }));
    await blaetterZu(page); await kurz();
  };
  await bereich(page, 'haushalt'); await sub('budget');
  await blatt('„+ Budget“ steht in der Überschrift „Flexible Kosten“ und öffnet das Blatt „Budget“', '.sec-a[data-m="budget"]', '#msheet', '#ms-title', 'Budget', 'Flexible Kosten');
  await tipp('einnahmen');
  P.ok('„+ Feste Einnahme“ ist die letzte Zeile der aufgeklappten Einnahmen', (await stand('einnahmen')).letzte === 'Feste Einnahme' && (await stand('einnahmen')).aktionen.length === 1, JSON.stringify(await stand('einnahmen')));
  await blatt('… und öffnet das Blatt „Feste Einnahme“', '.act[data-m="newin"]', '#msheet', '#ms-title', 'Feste Einnahme');
  await tipp('fixkosten');
  P.ok('„+ Fixkosten“ ist die letzte Zeile der aufgeklappten Fixkosten', (await stand('fixkosten')).letzte === 'Fixkosten' && (await stand('fixkosten')).aktionen.length === 1, JSON.stringify(await stand('fixkosten')));
  await blatt('… und öffnet das Blatt „Fixkosten“', '.act[data-m="newfix"]', '#msheet', '#ms-title', 'Fixkosten');
  await tipp('einnahmen'); await tipp('fixkosten');
  P.ok('zugeklappt gibt es die Aktionszeilen nicht', (await z('#v-haushalt .act')) === 0);
  await sub('verm');
  await blatt('„+ Umbuchung“ steht in der Überschrift „Konten“ und öffnet das Blatt „Umbuchung“', '.sec-a[data-m="newtr"]', '#msheet', '#ms-title', 'Umbuchung', 'Konten');
  await blatt('das Plus bei „Sparziele“ öffnet das Blatt „Sparziel“', '.sec-a[data-m="newgoal"]', '#vsheet', '#vs-title', 'Sparziel', 'Sparziele');
  await bereich(page, 'training'); await page.click('#v-training .subtabs button:nth-child(2)'); await kurz();
  await blatt('das Plus bei „Pläne“ öffnet das Blatt „Neuer Plan“', '.sec-a[data-k="plan"]', '#psheet', '#ps-title', 'Neuer Plan', 'Pläne');
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
    await bereich(p, 'heute'); await tippTest(p, 'Heute', 'Alle 7, Alle 8', b);
    await bereich(p, 'haushalt'); await p.click('#v-haushalt [data-m="sub"][data-v="verm"]'); await k(); await tippTest(p, 'Vermögen', 'Umbuchung, Sparziel anlegen', b);
    await p.click('#v-haushalt [data-m="sub"][data-v="budget"]'); await k(); await tippTest(p, 'Budget', 'Budget', b);
    await bereich(p, 'training'); await p.click('#v-training .subtabs button:nth-child(2)'); await k(); await tippTest(p, 'Gym', 'Plan anlegen', b);

    if (breite === 320) {
      /* Jede Ansicht einmal mit allem aufgeklappt (min = so viele Klappzeilen müssen dort mindestens offen sein, damit die Prüfung nicht ins Leere läuft) */
      const passt = async (wo, min) => {
        for (let i = 0; i < 60 && await p.$('.view:not([hidden]) [data-fold][aria-expanded="false"]'); i++) await p.click('.view:not([hidden]) [data-fold][aria-expanded="false"]');
        await k(); const m = await p.evaluate(breiten);
        P.ok('320 px, ' + wo + ': alles aufgeklappt, nichts ragt seitlich hinaus', m.auf >= min && m.zu === 0 && passtHinein(m), JSON.stringify(m));
      };
      await bereich(p, 'heute'); await passt('Heute', 1);
      await bereich(p, 'routinen'); await passt('Routinen', 0);
      await p.click('#r-subs [data-v="task"]'); await k(); await passt('Aufgaben', 1);
      await p.click('#r-subs [data-v="note"]'); await k(); await passt('Notizen', 0);
      await bereich(p, 'gewicht'); await passt('Gewicht', 3);
      await bereich(p, 'haushalt'); await p.click('#v-haushalt [data-m="sub"][data-v="verm"]'); await k(); await passt('Vermögen', 1);
      await p.click('#v-haushalt [data-m="mode"][data-v="year"]'); await k(); await passt('Vermögen im Jahr', 1);
      await p.click('#v-haushalt [data-m="sub"][data-v="budget"]'); await k(); await passt('Budget im Jahr', 2);
      await p.click('#v-haushalt [data-m="mode"][data-v="month"]'); await k(); await passt('Budget', 3);
      await bereich(p, 'training'); await p.click('#v-training .subtabs button:nth-child(1)'); await k(); await passt('Cardio', 1);
      await p.click('#v-training [data-t="mode"][data-v="year"]'); await k(); await passt('Cardio im Jahr', 1);
      await p.click('#v-training .subtabs button:nth-child(2)'); await k(); await passt('Gym im Jahr', 2);
      await p.click('#v-training [data-t="mode"][data-v="month"]'); await k(); await passt('Gym', 2);
    }
    await o.browser.close(); o.fehler.forEach(f => P.ok(f + b, false));
  }

  // --- Teil 5: Heute ist die Kurzfassung ---
  ({ browser, page, fehler } = await oeffnen({ daten: d }));
  await bereich(page, 'heute');
  /* Sieben Notizen: Heute zeigt die neuesten fünf, je in einer Zeile (ohne Ordner und Datum darunter) */
  P.ok('Heute: fünf von sieben Notizen, ohne zweite Zeile', (await z('#v-heute .nrow')) === 5 && (await z('#v-heute .nrow .l small')) === 0 && (await text(page, '#v-heute .nrow:first-child')) === 'Gliederung: Einleitung, Stand der Forschung, Methode', await text(page, '#v-heute .nrow'));
  /* Aufgaben für heute: Kapitel 3 (von gestern, liegen geblieben), Folien, Betreuer (heute abgehakt) und die fünf weiteren → 8, davon 7 offen; Heute zeigt die ersten sechs */
  const aufg = '#v-heute .trow:not(.nrow)';
  P.ok('Heute: sechs von acht Aufgaben, ohne zweite Zeile, „7 offen“', (await z(aufg)) === 6 && (await z(aufg + ' .l small')) === 0 && (await text(page, '#v-heute h2:has([data-n="alltasks"])')).indexOf('Aufgaben7 offen') === 0, await text(page, '#v-heute h2'));
  const rot = await page.evaluate(() => {
    const e = document.querySelector('#v-heute .trow .when.late'), probe = document.createElement('i'); probe.style.color = 'var(--danger)'; document.body.appendChild(probe);
    const r = { text: e ? e.textContent : '', farbe: e ? getComputedStyle(e).color : '', soll: getComputedStyle(probe).color, zeile: e ? e.closest('li').textContent : '' };
    document.body.removeChild(probe); return r;
  });
  P.ok('Heute: die liegengebliebene Aufgabe trägt weiter ihr rotes Datum „Gestern“', rot.text === 'Gestern' && rot.farbe === rot.soll && rot.zeile.includes('Kapitel 3'), JSON.stringify(rot));
  P.ok('Heute: Routinen ohne Wochenpunkte', (await z('#v-heute .rows .row')) >= 1 && (await z('#v-heute .week')) === 0);
  P.ok('Heute: „Alle 7“ steht bei den Notizen, „Alle 8“ bei den Aufgaben', (await text(page, '#v-heute h2:has([data-n="allnotes"])')) === 'Notizen Alle 7' && (await text(page, '#v-heute .sec-a[data-n="alltasks"]')) === 'Alle 8', await text(page, '#v-heute h2'));
  await page.click('#v-heute .sec-a[data-n="allnotes"]'); await kurz();
  P.ok('„Alle 7“ führt in den Planer zu den Notizen: alle sieben, dort mit zweiter Zeile', (await page.isVisible('#v-routinen')) && (await text(page, '#r-subs [aria-pressed="true"]')) === 'Notizen' && (await z('#n-main .nrow')) === 7 && (await z('#n-main .nrow .l small')) === 7, await text(page, '#r-subs [aria-pressed="true"]'));
  await bereich(page, 'heute');
  await page.click('#v-heute .sec-a[data-n="alltasks"]'); await kurz();
  P.ok('„Alle 8“ führt in den Planer zu den Aufgaben: alle acht, dort mit zweiter Zeile', (await page.isVisible('#v-routinen')) && (await text(page, '#r-subs [aria-pressed="true"]')) === 'Aufgaben' && (await z('#n-main > ul.entries:first-of-type .trow')) === 8 && (await z('#n-main > ul.entries:first-of-type .l small')) === 8, await text(page, '#r-subs [aria-pressed="true"]'));
  await page.click('#r-subs [data-v="rout"]'); await kurz();
  P.ok('Planer: Routinen mit Wochenpunkten', (await z('#main .row')) === 3 && (await z('#main .row .week')) === 3);

  // --- Teil 6: Sicherung ---
  /* Ohne gespeicherte Sicherung und mit Einträgen, die älter als 7 Tage sind, ist die Sicherung fällig: Der Satz steht in der Erinnerung oben, nicht noch einmal in der Zeile. */
  await bereich(page, 'heute');
  const sich = async () => ({ s: await stand('sicherung'), oben: await text(page, '#v-heute .remind[data-h="export"]'), zeile: await text(page, '#v-heute [data-fold="sicherung"]'), msg: await text(page, '#bk-msg') });
  let s = await sich();
  P.ok('Sicherung: die Zeile ist zu und steht am Ende von Heute', !s.s.auf && s.s.aktionen.length === 0 && await page.evaluate(() => document.querySelector('#v-heute').lastElementChild.contains(document.querySelector('[data-fold="sicherung"]'))), JSON.stringify(s));
  P.ok('Sicherung fällig: der Satz steht nur in der Erinnerung oben', s.oben === 'Noch keine Sicherung gespeichert Jetzt sichern' && s.zeile === 'Sicherung' && s.msg === '', JSON.stringify(s));
  await tipp('sicherung'); s = await sich();
  P.ok('Sicherung: aufgeklappt stehen „Sicherung speichern“ und „Sicherung einlesen“', s.s.auf && s.s.aktionen.join(' | ') === 'Sicherung speichern | Sicherung einlesen', JSON.stringify(s.s));
  const [wahl] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null), page.click('#v-heute .act[data-h="import"]')]);
  P.ok('„Sicherung einlesen“ öffnet die Dateiauswahl', !!wahl);
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), page.click('#v-heute .act[data-h="export"]')]);
  await kurz(); s = await sich();
  P.ok('„Sicherung speichern“ speichert die Datei; die Erinnerung ist weg, die Zeile bleibt offen und nennt die Datei', !!dl && dl.suggestedFilename() === 'track-sicherung-' + tag(0) + '.json' && s.oben === '' && s.s.auf && s.msg === 'Sicherung gespeichert: track-sicherung-' + tag(0) + '.json', JSON.stringify(s));
  await page.reload(); await page.waitForTimeout(300); await bereich(page, 'heute'); s = await sich();
  P.ok('nach dem Neuladen: Zeile zu, darin „Letzte Sicherung: …“, keine Erinnerung', !s.s.auf && s.oben === '' && s.msg.indexOf('Letzte Sicherung: ') === 0 && s.zeile.indexOf('Sicherung Letzte Sicherung: ') === 0, JSON.stringify(s));
  /* Letzte Sicherung vor 8 Tagen: 8 ≥ 7, also fällig. Oben steht „Letzte Sicherung vor 8 Tagen“, die Zeile nennt das Datum dann nicht noch einmal. */
  await page.evaluate(() => { const t = new Date(); t.setHours(12, 0, 0, 0); t.setDate(t.getDate() - 8); localStorage.setItem('takt.backup', String(t.getTime())); });
  await page.reload(); await page.waitForTimeout(300); await bereich(page, 'heute'); s = await sich();
  P.ok('Sicherung 8 Tage alt: Erinnerung oben, die Zeile ohne Satz', s.oben === 'Letzte Sicherung vor 8 Tagen Jetzt sichern' && s.zeile === 'Sicherung' && s.msg === '', JSON.stringify(s));

  // --- Teil 7: Erklärungen erst nach Tipp auf das „i“; Farbe nur an der Veränderung ---
  await bereich(page, 'gewicht');
  P.ok('Gewicht: die Legende ist zuerst verborgen', !(await page.isVisible('#info-w-leg')) && (await z('#v-gewicht [data-info="w-leg"]')) === 1);
  await page.click('#v-gewicht [data-info="w-leg"]');
  P.ok('Gewicht: ein Tipp auf das „i“ zeigt sie', (await page.isVisible('#info-w-leg')) && (await text(page, '#info-w-leg span')) === '7-Tage-Schnitt | einzelne Messung', await text(page, '#info-w-leg span'));
  await page.click('#v-gewicht [data-info="w-leg"]');
  P.ok('Gewicht: ein zweiter Tipp verbirgt sie wieder', !(await page.isVisible('#info-w-leg')));
  await bereich(page, 'training'); await page.click('#v-training .subtabs button:nth-child(1)'); await kurz();
  P.ok('Cardio: der Vergleichssatz in „Letzter Lauf“ ist zuerst verborgen', !(await page.isVisible('#info-t-last')) && (await text(page, '#v-training .last h3')).indexOf('Letzter Lauf') === 0);
  await page.click('#v-training [data-info="t-last"]');
  /* Letzter Lauf ist der von heute, der Outdoor-Lauf davor der von gestern */
  P.ok('Cardio: ein Tipp auf das „i“ zeigt ihn', (await page.isVisible('#info-t-last')) && (await text(page, '#info-t-last')) === 'Vergleich mit dem Outdoor-Lauf davor (Gestern)', await text(page, '#info-t-last'));
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
  /* „Ohne Konto“: Stand im Vormonat (gilt zum Monatsende), heute zwei Ausgaben ohne Konto und eine Umbuchung; dazu Miete ohne Konto, fällig in diesem Monat.
     Ohne Konto zählen: 2 Ausgaben + 1 fester Posten = 3. Die Umbuchung hat Konten und steht unter „Umbuchungen“ (1). */
  const g = leer(), jetzt = Date.now();
  g.MF = { fixed: { f1: { name: 'Miete', amount: 40000, kind: 'fix', every: 1, from: monat(2), to: null } }, budgets: {}, roll: {}, acc: { giro: { n: 'Girokonto' }, bar: { n: 'Bargeld' } }, bal: {}, balT: {}, goals: {} };
  g.MF.bal[monat(1)] = { giro: 100000, bar: 5000 };
  g.MY[jahr] = { tx: { a: { d: tag(0), a: 1200, k: 'out', c: 'essen', n: 'Rewe', t: jetzt }, b: { d: tag(0), a: 800, k: 'out', c: 'aus', n: 'Döner', t: jetzt }, u: { d: tag(0), a: 5000, k: 'tr', acc: 'giro', to: 'bar', c: '', n: '', t: jetzt } } };
  ({ browser, page, fehler } = await oeffnen({ daten: g, breite: 320 }));
  await bereich(page, 'haushalt'); await sub('verm');
  await klappe('Vermögen „Ohne Konto“', 'ohneKonto', 3);
  await klappe('Vermögen „Umbuchungen“ (kleine Daten)', 'umbuchungen', 1);
  P.ok('„Ohne Konto“ sagt auch zugeklappt, was es bedeutet', (await text(page, '#v-haushalt [data-fold="ohneKonto"]')) === 'Ohne Konto zählt nicht zum Vermögen 3', await text(page, '#v-haushalt [data-fold="ohneKonto"]'));
  await tipp('ohneKonto'); await tipp('umbuchungen');
  const og = await page.evaluate(breiten);
  P.ok('320 px, Vermögen mit „Umbuchungen“ und „Ohne Konto“ offen: nichts ragt seitlich hinaus', og.auf === 2 && passtHinein(og), JSON.stringify(og));
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
     Gezählt wird, wie oft die Seite bei einem Tipp auf „Sicherung“ (zeichnet alles neu) eine Zahl formatiert (toLocaleString): mit den 56 Einträgen der Beispieldaten
     und mit 300 älteren dazu. Jede Zeile eines Eintrags formatiert ihr Gewicht zweimal; mit dem Fehler wären es 2 × 300 = 600 Aufrufe mehr. Zugeklappt darf nichts dazukommen. */
  const viele = daten(); for (let i = 100; i < 400; i++) viele.W.entries[tag(i)] = 81;
  const formatiert = async dat => {
    const o = await oeffnen({ daten: dat }); await bereich(o.page, 'heute');
    const n = await o.page.evaluate(() => { const echt = Number.prototype.toLocaleString; let k = 0; Number.prototype.toLocaleString = function (...a) { k++; return echt.apply(this, a); };
      document.querySelector('#v-heute [data-fold="sicherung"]').click(); Number.prototype.toLocaleString = echt; return k; });
    const offen = await o.page.getAttribute('#v-heute [data-fold="sicherung"]', 'aria-expanded'), eintr = await o.page.$eval('#v-gewicht [data-fold="eintraege"] .fold', e => e.textContent.trim());
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
  await P.ende(browser, fehler);
});
