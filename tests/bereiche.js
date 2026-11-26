// Bereiche an und aus (v125): In den Einstellungen wählt er, welche Bereiche es gibt. Gym und Cardio zählen einzeln.
// Geprüft wird: Leiste unten (Knöpfe, Zahl --n, Platz der Linse), Titel, Zahnrad, Start, Heute (Schnell-Knöpfe, Notizen, Übersicht, Punkte der Wochenleiste, Woche),
// Training ohne Umschalter, der letzte Bereich bleibt an, die Daten bleiben, Neuladen, Einlesen einer Sicherung.
// Alle Daten liegen auf heute: So hängt nichts vom Tag ab, an dem der Test läuft.
const { APP, oeffnen, text, bereich, gespeichert, einstellungen, pruefer, lauf, tag } = require('./lib');

const heute = tag(0), jahr = heute.slice(0, 4);
const daten = () => ({ S: { routines: [], running: null }, LY: {}, W: { entries: { [heute]: 80 } },
  MF: { fixed: {} }, MY: { [jahr]: { tx: { t1: { d: heute, a: 1200, k: 'out', c: 'essen', n: '' } } } },
  T: { runs: { a: { d: heute, m: 5000, s: 1800, hr: null, k: 'out' } } },
  K: { ex: { e1: { n: 'Bankdrücken' } }, log: { [heute]: { e1: [[60, 8]] } }, plans: {}, meta: {}, live: null },
  N: { folders: {}, tasks: {}, notes: { n1: { x: 'Milch kaufen', f: '', c: Date.now(), m: Date.now() } }, work: { rate: 1500, e: { a1: { d: heute, a: 600, b: 720, p: 0, r: 1500 } } }, uni: { e: { u1: { d: heute, f: 'kons', p: 400, n: '' } } } } });

lauf(async () => {
  const P = pruefer('Bereiche an und aus');
  const o = await oeffnen({ daten: daten() }), p = o.page;
  /* Stand der Oberfläche: sichtbare Knöpfe der Leiste, --n, Platz der Linse, Titel, Zahnrad und Plus, Leiste da */
  const stand = () => p.evaluate(() => { const l = document.querySelector('.tabs-in'), vis = e => !!e && getComputedStyle(e).display !== 'none' && !e.hidden; return {
    tabs: [...document.querySelectorAll('.tab')].filter(vis).map(b => b.textContent.trim()).join(' '), n: l.style.getPropertyValue('--n'), i: l.style.getPropertyValue('--i'),
    titel: document.querySelector('.mark').textContent, gear: vis(document.querySelector('#gear')), plus: vis(document.querySelector('#add')), leiste: vis(document.querySelector('.tabs')), v: document.body.dataset.v }; });
  const heuteStand = () => p.evaluate(() => ({ quick: [...document.querySelectorAll('#v-heute [data-h="q"]')].map(b => b.dataset.v).join(' '), ovs: [...document.querySelectorAll('#v-heute .ovs .ov .k')].map(b => b.textContent).join(' '),
    notiz: document.querySelector('#v-heute').textContent.includes('Milch kaufen'), punkte: [...document.querySelectorAll('#v-heute .wd.now i u')].map(u => u.className).join('') }));
  const schalter = k => p.click('#esheet [data-h="ber"][data-v="' + k + '"]');
  const zu = async () => { await p.click('#es-close'); await p.waitForTimeout(60); };

  let s = await stand(), h = await heuteStand();
  P.ok('am Anfang: fünf Bereiche in der Leiste, Zahnrad auf Heute, kein Plus', s.tabs === 'Heute Planer Gewicht Finanzen Training' && s.n === '5' && s.i === '0' && s.gear && !s.plus && s.leiste, JSON.stringify(s));
  P.ok('Heute am Anfang: keine Schnell-Knöpfe und keine Notizen (seit v131/v132), fünf Zeilen, Punkte für Wiegen und Training', h.quick === '' && !h.notiz && h.ovs === 'Gewicht Finanzen Training Arbeit Uni' && h.punkte === 'wg', JSON.stringify(h));

  await einstellungen(p);
  const es = () => p.evaluate(() => ({ ber: [...document.querySelectorAll('#es-ber .sch')].map(b => b.textContent.trim() + ':' + (b.getAttribute('aria-checked') === 'true' ? 'an' : 'aus') + (b.disabled ? '!' : '')).join(' '),
    titel: [...document.querySelectorAll('#es-body h2.sec')].map(x => x.textContent).join(' | '), start: [...document.querySelectorAll('#es-body [data-h="start"]')].map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(' '),
    ov: [...document.querySelectorAll('#es-body [data-h="ov"]')].map(b => b.textContent.trim()).join(' ') }));
  let e = await es();
  P.ok('Einstellungen: sechs Schalter, alle an, keiner gesperrt', e.ber === 'Heute:an Planer:an Gewicht:an Finanzen:an Gym:an Cardio:an', e.ber);

  // --- Cardio aus: Training heißt Gym, kein Umschalter ---
  await schalter('cardio');
  e = await es(); s = await stand();
  P.ok('Cardio aus: gespeichert (E.weg.cardio), Leiste hat weiter fünf Knöpfe, der letzte heißt Gym; Start und „Auf Heute zeigen“ nennen Gym',
    (await gespeichert(p)).E.weg.cardio === 1 && s.tabs === 'Heute Planer Gewicht Finanzen Gym' && s.n === '5' && e.start === 'Heute* Planer Gewicht Finanzen Gym' && e.ov === 'Gewicht Finanzen Gym Arbeit Uni', JSON.stringify([s, e]));
  await zu(); h = await heuteStand();
  /* Übersicht: eine Einheit in diesem Monat → „1 Einheit“; der Punkt bleibt grün (Gym heute) */
  P.ok('Heute ohne Cardio: Zeile heißt Gym und zeigt „1 Einheit“, kein „km“', h.ovs === 'Gewicht Finanzen Gym Arbeit Uni' && h.punkte === 'wg' && await p.evaluate(() => { const z = document.querySelector('#v-heute .ov[data-v="training"]'); return z.querySelector('.v').textContent === '1 Einheit' && !z.textContent.includes('km'); }), JSON.stringify(h));
  await bereich(p, 'training'); s = await stand();
  P.ok('Training ohne Cardio: Titel „Gym.“, kein Umschalter Gym/Cardio, der Gym-Teil ist zu sehen', s.titel === 'Gym.' && await p.evaluate(() => !document.querySelector('#v-training .subtabs') && document.querySelector('#v-training').textContent.includes('Bankdrücken') === false && !!document.querySelector('#v-training [data-k]')), JSON.stringify(s));

  // --- Gewicht, Finanzen, Planer aus ---
  await einstellungen(p); await schalter('gewicht'); await schalter('haushalt'); await schalter('routinen');
  e = await es(); s = await stand();
  /* Linse: Heute ist der erste von zwei Knöpfen → Platz 0 */
  P.ok('drei weitere aus: Leiste zeigt Heute und Gym (--n 2), Start bietet nur diese, „Auf Heute zeigen“ nur Gym', s.tabs === 'Heute Gym' && s.n === '2' && s.i === '0' && e.start === 'Heute* Gym' && e.ov === 'Gym' && e.ber === 'Heute:an Planer:aus Gewicht:aus Finanzen:aus Gym:an Cardio:aus', JSON.stringify([s, e]));
  await zu(); h = await heuteStand();
  P.ok('Heute: kein Plus, keine Notiz, nur die Zeile Gym, nur der grüne Punkt', h.quick === '' && !h.notiz && h.ovs === 'Gym' && h.punkte === 'g', JSON.stringify(h));
  await p.click('#v-heute [data-h="mode"][data-v="week"]');
  const woche = await text(p, '#v-heute .kv > span:first-child');
  P.ok('Woche auf Heute: nur die Zeile Gym', woche === 'Gym', woche);
  await p.click('#v-heute [data-h="mode"][data-v="day"]');
  await bereich(p, 'training'); s = await stand();
  P.ok('Gym ist der zweite Knopf: Linse auf Platz 1, kein Zahnrad (das steht auf Heute), Plus da', s.i === '1' && !s.gear && s.plus && s.v === 'training', JSON.stringify(s));

  // --- Heute aus: nur noch Gym, keine Leiste, Zahnrad im Gym ---
  await einstellungen(p); await schalter('heute'); await p.waitForTimeout(60);
  e = await es(); s = await stand();
  P.ok('Heute aus: nur Gym bleibt, sein Schalter ist gesperrt; kein Abschnitt Start, kein „Auf Heute zeigen“', e.ber === 'Heute:aus Planer:aus Gewicht:aus Finanzen:aus Gym:an! Cardio:aus' && e.titel === 'Sicherung | Bereiche | Training', JSON.stringify(e));
  P.ok('dahinter steht jetzt Gym: keine Leiste, Titel „Gym.“, Zahnrad und Plus nebeneinander', !s.leiste && s.v === 'training' && s.titel === 'Gym.' && s.gear && s.plus && await p.evaluate(() => document.body.classList.contains('solo') && !document.querySelector('#v-training').hidden && document.querySelector('#v-heute').hidden), JSON.stringify(s));
  await p.click('#esheet [data-h="ber"][data-v="kraft"]', { force: true }).catch(() => {});
  P.ok('der letzte Bereich lässt sich nicht abschalten', (await gespeichert(p)).E.weg.kraft == null && (await es()).ber.includes('Gym:an!'));
  await zu();
  const box = await p.evaluate(() => { const g = document.querySelector('#gear').getBoundingClientRect(), a = document.querySelector('#add').getBoundingClientRect(); return { abstand: Math.round(a.left - g.right), rechts: Math.round(innerWidth - a.right), gleichHoch: Math.abs(g.top - a.top) < 1 }; });
  P.ok('Zahnrad steht 10 px links vom Plus, das Plus am rechten Rand (16 px)', box.abstand === 10 && box.rechts === 16 && box.gleichHoch, JSON.stringify(box));
  const g1 = await gespeichert(p);
  P.ok('die Daten der abgeschalteten Bereiche bleiben gespeichert', g1.W.entries[heute] === 80 && g1.T.runs.a.m === 5000 && g1.MY[jahr].tx.t1.a === 1200 && g1.N.notes.n1.x === 'Milch kaufen' && Object.keys(g1.E.weg).sort().join() === 'cardio,gewicht,haushalt,heute,routinen', JSON.stringify(g1.E));

  // --- Neuladen: ohne Zusatz und mit dem Zusatz eines abgeschalteten Bereichs ---
  await p.goto(APP); await p.waitForTimeout(400); s = await stand();
  P.ok('nach dem Neuladen öffnet die App mit Gym, ohne Leiste', s.v === 'training' && !s.leiste && s.titel === 'Gym.' && s.gear, JSON.stringify(s));
  await p.goto(APP + '#gewicht'); await p.reload(); await p.waitForTimeout(400); s = await stand();
  P.ok('die Adresse eines abgeschalteten Bereichs (#gewicht) führt zum eingeschalteten', s.v === 'training' && await p.evaluate(() => document.querySelector('#v-gewicht').hidden), JSON.stringify(s));

  // --- wieder einschalten: Cardio allein mit Gym, dann alles ---
  await p.click('#gear'); await p.waitForTimeout(80); await schalter('cardio'); await zu(); s = await stand();
  P.ok('Cardio wieder an: Titel „Training.“, Umschalter Gym/Cardio ist zurück, weiter ohne Leiste (ein Bereich)', s.titel === 'Training.' && !s.leiste && await p.evaluate(() => document.querySelectorAll('#v-training .subtabs button').length === 2), JSON.stringify(s));
  await p.click('#gear'); await p.waitForTimeout(80); await schalter('kraft'); await zu(); s = await stand();
  P.ok('Gym aus, Cardio an: Titel „Cardio.“, kein Umschalter, der Lauf ist zu sehen', s.titel === 'Cardio.' && await p.evaluate(() => !document.querySelector('#v-training .subtabs') && document.querySelector('#v-training').textContent.includes('km')), JSON.stringify(s));
  await p.click('#gear'); await p.waitForTimeout(80);
  P.ok('ohne Gym fehlt der Abschnitt „Training“ (Empfehlung je Satz) in den Einstellungen', (await es()).titel === 'Sicherung | Bereiche', (await es()).titel);
  for (const k of ['heute', 'routinen', 'gewicht', 'haushalt', 'kraft']) await schalter(k);
  e = await es(); s = await stand();
  P.ok('alles wieder an: fünf Bereiche, sechs Schalter an, der Merker ist leer', s.tabs === 'Heute Planer Gewicht Finanzen Training' && s.n === '5' && s.leiste && e.ber === 'Heute:an Planer:an Gewicht:an Finanzen:an Gym:an Cardio:an' && Object.keys((await gespeichert(p)).E.weg).length === 0, JSON.stringify([s, e]));
  /* Man stand in Training (vierter … fünfter Knopf): Die Linse sitzt wieder auf Platz 4 */
  P.ok('die Linse sitzt auf dem Knopf des offenen Bereichs (Training, Platz 4)', s.i === '4' && s.v === 'training', JSON.stringify(s));
  await zu();

  // --- Sicherung einlesen: Bereiche aus der Datei gelten; eine Datei, die alle abschaltet, gilt nicht ---
  await einstellungen(p);
  await p.setInputFiles('#bk-file', { name: 's.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'takt', v: 1, E: { weg: { haushalt: 1, gewicht: 1 } } })) });
  await p.waitForTimeout(200); s = await stand();
  P.ok('eingelesen: Gewicht und Finanzen sind aus der Leiste', s.tabs === 'Heute Planer Training' && s.n === '3', JSON.stringify(s));
  await p.setInputFiles('#bk-file', { name: 's.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'takt', v: 1, E: { weg: { heute: 1, routinen: 1, gewicht: 1, haushalt: 1, kraft: 1, cardio: 1 } } })) });
  await p.waitForTimeout(200); s = await stand();
  P.ok('eine Datei, die alle Bereiche abschaltet, schaltet keinen ab', s.tabs === 'Heute Planer Gewicht Finanzen Training', JSON.stringify(s));

  // --- 320 px: zwei Bereiche, die Kapsel ist schmaler als der Bildschirm und steht mittig ---
  const k = await oeffnen({ breite: 390, daten: Object.assign(daten(), { E: { weg: { routinen: 1, gewicht: 1, haushalt: 1 } } }) });
  const kap = await k.page.evaluate(() => { const r = document.querySelector('.tabs-in').getBoundingClientRect(), l = getComputedStyle(document.querySelector('.tabs-in'), '::before'), t = document.querySelector('.tab').getBoundingClientRect(); return { b: Math.round(r.width), links: Math.round(r.left), rechts: Math.round(innerWidth - r.right), linse: Math.round(parseFloat(l.width)), tab: Math.round(t.width) }; });
  /* Kapsel: 2 × 96 + 10 = 202 px, mittig: (390 − 202) / 2 = 94. Knopf und Linse: (202 − 10 − 2) / 2 = 95 px. */
  P.ok('zwei Bereiche bei 390 px: Kapsel 202 px breit und mittig (94 px), Knopf und Linse 95 px', kap.b === 202 && kap.links === 94 && kap.rechts === 94 && kap.linse === 95 && kap.tab === 95, JSON.stringify(kap));
  await k.browser.close();
  await P.ende(o.browser, o.fehler.concat(k.fehler));
});
