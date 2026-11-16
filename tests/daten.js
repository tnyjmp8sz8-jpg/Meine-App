// Beispieldaten für Tests und Bildschirmfotos, relativ zum heutigen Tag. Nicht Teil der App.
const { tag, monat } = require('./lib');

function beispiel() {
  const S = { routines: [
    { id: 'r1', name: 'Lesen', minutes: 30, days: [1, 1, 1, 1, 1, 1, 1].map(Boolean), created: tag(60) },
    { id: 'r2', name: 'Spanisch lernen', minutes: 20, days: [1, 1, 1, 1, 1, 0, 0].map(Boolean), created: tag(60) },
    { id: 'r3', name: 'Dehnen', minutes: 10, days: [1, 0, 1, 0, 1, 0, 1].map(Boolean), created: tag(40) } ], running: null };
  const LY = {};
  for (let i = 0; i < 60; i++) {
    const k = tag(i), y = k.slice(0, 4); LY[y] = LY[y] || {}; LY[y][k] = {};
    if (i > 0 && i % 7 !== 3) LY[y][k].r1 = { s: 1800, d: 1 };
    if (i === 0) LY[y][k].r1 = { s: 700, d: 0 };
    if (i % 3 !== 1) LY[y][k].r2 = { s: 1200, d: 1 };
    if (i % 2 === 0 && i > 0) LY[y][k].r3 = { s: 600, d: 1 };
  }
  const W = { goal: 78, goalFrom: 84.2, entries: {} };
  for (let i = 0; i < 70; i++) if (i % 5 !== 4) W.entries[tag(i)] = Math.round((80.4 + i * 0.055 + Math.sin(i * 1.7) * 0.45) * 10) / 10;

  const von = monat(10);
  const MF = { fixed: {
      f1: { name: 'Gehalt', amount: 185000, kind: 'in', every: 1, from: von, to: null },
      f2: { name: 'Miete', amount: 62000, kind: 'fix', every: 1, from: von, to: null },
      f3: { name: 'Handy', amount: 1999, kind: 'fix', every: 1, from: von, to: null },
      f4: { name: 'Fitnessstudio', amount: 2990, kind: 'fix', every: 1, from: von, to: null } },
    budgets: { essen: 36000, aus: 5000, frei: 8000 }, roll: {},
    acc: { giro: { n: 'Girokonto' }, spar: { n: 'Sparkonto' }, depot: { n: 'Depot' } }, bal: {}, balT: {},
    goals: { g1: { n: 'Notgroschen', amount: 500000, acc: 'spar' }, g2: { n: 'Auto', amount: 2000000, acc: null } } };
  MF.bal[monat(3)] = { depot: 500000, giro: 120000, spar: 200000 };
  MF.bal[monat(2)] = { depot: 515000, giro: 135050, spar: 230000 };
  MF.bal[monat(1)] = { giro: 90000, spar: 260000 };
  MF.bal[monat(0)] = { depot: 590000, giro: 148000, spar: 300000 };

  const MY = {}; let n = 0;
  const tx = (i, a, c, name, k) => { const d = tag(i), y = d.slice(0, 4); MY[y] = MY[y] || { tx: {} }; MY[y].tx['t' + (n++)] = { d, a, k: k || 'out', c, n: name }; };
  tx(0, 2340, 'essen', 'Rewe'); tx(1, 1250, 'aus', 'Döner'); tx(2, 4580, 'essen', 'Edeka'); tx(3, 1999, 'frei', 'Kino'); tx(5, 3120, 'essen', 'Aldi');
  tx(6, 890, 'drog', 'dm'); tx(8, 2700, 'aus', 'Pizza'); tx(9, 5200, 'essen', 'Rewe'); tx(11, 4990, 'shop', 'T-Shirt'); tx(12, 3000, 'sonst', 'Flohmarkt', 'in');
  for (let i = 20; i < 150; i += 4) tx(i, 2000 + (i * 37) % 3000, ['essen', 'aus', 'frei', 'mobil'][i % 4], '');

  const T = { runs: {} };
  [1, 4, 8, 12, 17, 22, 28, 35].forEach((i, j) => { T.runs['c' + j] = { d: tag(i), m: 5000 + j * 300, s: 1620 + j * 110, hr: 152 - j, k: 'out' }; });

  const K = { ex: { e1: { n: 'Bankdrücken' }, e2: { n: 'Kniebeuge' }, e3: { n: 'Klimmzüge' }, e4: { n: 'Schulterdrücken' } }, log: {},
    plans: { p1: { n: 'Oberkörper', items: [{ id: 'e1', sets: 3 }, { id: 'e3', sets: 3 }, { id: 'e4', sets: 3 }] }, p2: { n: 'Beine', items: [{ id: 'e2', sets: 4 }] } }, meta: {}, live: null };
  for (let j = 0; j < 22; j++) {
    const k = tag(2 + j * 4), w = 72.5 - Math.floor(j / 3) * 2.5;
    K.log[k] = j % 2 ? { e2: [[100 - j, 8], [100 - j, 8], [100 - j, 6]], e1: [[w, 7], [w, 6]] } : { e1: [[w, 8 + (j % 3)], [w, 7], [w - 2.5, 6]], e3: [[0, 12 - (j >> 2)], [0, 8], [0, 6]], e4: [[40, 8], [40, 7]] };
    K.meta[k] = { dur: 3300, plan: j % 2 ? 'p2' : 'p1' };
  }
  /* Aufgaben und Notizen: drei für heute (eine abgehakt, eine von gestern liegen geblieben), zwei demnächst, eine ohne Datum, 14 früher erledigte; sieben kurze Notizen */
  const jetzt = Date.now(), vor = n => jetzt - n * 864e5;
  const N = { folders: {}, tasks: {
    t1: { t: 'Kapitel 3 überarbeiten', f: 'prom', d: tag(1), done: null, c: vor(3), n: '' },
    t2: { t: 'Folien für das Seminar hochladen', f: 'uni', d: tag(0), done: null, c: vor(1), n: '' },
    t3: { t: 'Betreuer wegen Termin schreiben', f: 'prom', d: tag(0), done: jetzt, c: vor(2), n: '' },
    t4: { t: 'Literaturliste ergänzen', f: 'prom', d: tag(-3), done: null, c: vor(2), n: 'bis Kapitel 4' },
    t5: { t: 'Zur Klausur anmelden', f: 'uni', d: tag(-7), done: null, c: vor(1), n: '' },
    t6: { t: 'Messreihe 2 auswerten', f: 'prom', d: null, done: null, c: vor(5), n: '' } }, notes: {
    n1: { x: 'Gliederung: Einleitung, Stand der Forschung, Methode', f: 'prom', c: vor(0), m: vor(0) },
    n2: { x: 'Betreuer nach Termin im Januar fragen', f: 'prom', c: vor(1), m: vor(1) },
    n3: { x: 'Vergleich mit Müller 2021 in die Diskussion', f: 'prom', c: vor(2), m: vor(2) },
    n4: { x: 'Wer hat den Schlüssel fürs Labor?', f: 'uni', c: vor(3), m: vor(3) },
    n5: { x: 'Kapitel 2 auf 25 Seiten kürzen', f: 'prom', c: vor(5), m: vor(5) },
    n6: { x: 'Geschenk für Mama: Buch über Gärten', f: 'priv', c: vor(8), m: vor(8) },
    n7: { x: 'Druckerpapier kaufen', f: '', c: vor(12), m: vor(12) } } };
  for (let i = 0; i < 14; i++) N.tasks['d' + i] = { t: 'Erledigte Aufgabe ' + (i + 1), f: i % 2 ? 'uni' : 'prom', d: tag(i + 1), done: vor(i + 1), c: vor(i + 3), n: '' };
  /* Tages-Check: Schlaf der letzten 40 Tage (heute noch offen), nach Trainingstagen etwas besser */
  const DC = { sleep: {} };
  for (let i = 1; i <= 40; i++) DC.sleep[tag(i)] = [4, 3, 5, 4, 2, 4, 3][i % 7];
  return { S, LY, W, MF, MY, T, K, N, DC };
}
/* Dieselben Daten in der Form einer Sicherungsdatei */
const alsSicherung = d => ({ app: 'takt', v: 1, exported: new Date(Date.now() - 5 * 864e5).toISOString(), routines: d.S.routines, LY: d.LY, W: d.W, MF: d.MF, MY: d.MY, T: d.T, K: d.K, N: d.N, DC: d.DC });

module.exports = { beispiel, alsSicherung };
