// Macht aus dem Export von Alpha Progression (Workouts.csv, Plaene.csv) eine Datei, die Track. über „Sicherung einlesen“ aufnimmt.
// Aufruf: node tests/alpha.js <Workouts.csv> <Plaene.csv> <ziel.json> ["Name des Plans in Alpha Progression"]
// Die Dateien des Nutzers gehören nicht ins Repository (es ist öffentlich): Eingabe und Ausgabe liegen außerhalb.
//
// Was übernommen wird: jede Übung mit Tabelle „KG; WDH“, je Tag eine Einheit (zwei Trainings am selben Tag werden eine), Dauer, Ziel-Wiederholungen.
// Was nicht: Läufe und Sprints (Tabellen in km oder m), „Sauna“ und „Rest“ (keine Übungen), Dauern über 3 Stunden oder unter einer Minute (Uhr vergessen).
// Namen: „Curls · Langhantel“ heißt „Curls (Langhantel)“, wenn es die Übung mit mehreren Geräten gibt, sonst nur „Beinpresse“.
// Zusatzgewicht bei Körpergewicht („+15“) wird das Gewicht des Satzes, „+0“ ein Satz ohne Gewicht.
// Aus dem genannten Plan (Vorgabe „Torso Ex“) werden die Tage mit Übungen zu Plänen in Track.; zweimal derselbe Name bekommt A und B („Torso A“, „Torso B“).
const fs = require('fs');
const [, , wDatei, pDatei, ziel, planName = 'Torso Ex'] = process.argv;
if (!wDatei || !pDatei || !ziel) { console.log('Aufruf: node tests/alpha.js <Workouts.csv> <Plaene.csv> <ziel.json> ["Plan"]'); process.exit(1); }
const lesen = d => fs.readFileSync(d, 'utf8').replace(/^﻿/, '').split(/\r?\n/).map(l => l.trim());
const felder = l => l.split('";"').map(x => x.replace(/^"|"$/g, ''));
const OHNE = ['Sauna', 'Rest', 'Laufen', 'Sprinten', 'Fahrrad'];

/* Erster Durchgang: Welche Namen gibt es mit mehreren Geräten? */
const kopf = l => { const m = /^"\d+\. (.*?)"?(;|$)/.exec(l); return m ? m[1].replace(/"$/, '').split(' · ') : null; };
const geraete = {};
lesen(wDatei).forEach(l => { const k = kopf(l); if (k) (geraete[k[0]] = geraete[k[0]] || new Set()).add(k[1] || ''); });   // nur was wirklich trainiert wurde: In alten Plänen stehen weitere Geräte
const nameVon = k => geraete[k[0]] && geraete[k[0]].size > 1 && k[1] ? k[0] + ' (' + k[1] + ')' : k[0];

const ex = {}, ids = {};   // Name → Kennung
const idVon = name => { if (!ids[name]) { ids[name] = 'ap' + (Object.keys(ids).length + 1); ex[ids[name]] = { n: name }; } return ids[name]; };

/* Pläne: der Block des genannten Plans, je „Tag n · Name“ ein Plan */
const plans = {}, tagPlan = {};   // „Tag 1“ → Kennung des Plans
{
  const z = lesen(pDatei); let i = z.findIndex(l => felder(l)[0].split(' · ')[0] === planName), tage = [];
  if (i < 0) { console.log('Plan „' + planName + '“ steht nicht in ' + pDatei); process.exit(1); }
  for (i++; i < z.length && z[i]; i++) {
    const t = /^"(Tag \d+) · (.*)"$/.exec(z[i]);
    if (t) { tage.push({ tag: t[1], n: t[2].trim(), items: [] }); continue; }
    const k = kopf(z[i]), f = felder(z[i]), s = /(\d+) S(a|ä)tz/.exec(f[1] || '');
    if (k && s && OHNE.indexOf(k[0]) < 0) tage[tage.length - 1].items.push({ id: idVon(nameVon(k)), sets: Math.min(10, +s[1]) });
  }
  tage = tage.filter(t => t.items.length && !/Sauna/.test(t.n));
  const anzahl = {}; tage.forEach(t => { anzahl[t.n] = (anzahl[t.n] || 0) + 1; });
  const lauf = {};
  tage.forEach((t, o) => {
    const n = anzahl[t.n] > 1 ? t.n + ' ' + 'ABCDEFG'[lauf[t.n] = (lauf[t.n] || 0) + 1, lauf[t.n] - 1] : t.n, id = 'app' + (o + 1);
    plans[id] = { n, items: t.items, o: o + 1 }; tagPlan[t.tag] = id;
  });
}

/* Einheiten */
const log = {}, meta = {}, ziele = {};
let tag = null, plan = null, id = null, zaehlt = false, n = 0, aus = 0;
const dauer = t => { let m = /^(\d+):(\d+) Std\.$/.exec(t); if (m) return (+m[1] * 60 + +m[2]) * 60; m = /^(\d+) Min\.$/.exec(t); if (m) return +m[1] * 60; m = /^(\d+) Std\.$/.exec(t); return m ? +m[1] * 3600 : 0; };
lesen(wDatei).forEach(l => {
  if (!l) return;
  const f = felder(l), d = /^(\d{4}-\d\d-\d\d) /.exec(f[1] || '');
  if (d) {   // Kopf eines Trainings: „Name · Tag n · Woche m · Plan“; Datum; Dauer
    tag = d[1]; n++;
    const teile = f[0].split(' · '), t = teile.find(x => /^Tag \d+$/.test(x));
    plan = teile[teile.length - 1] === planName && t ? tagPlan[t] || null : null;
    const sek = dauer(f[2] || ''), m = meta[tag] = meta[tag] || { dur: 0, plan: null };
    if (sek >= 60 && sek <= 3 * 3600) m.dur += sek;
    if (plan) m.plan = plan;
    return;
  }
  const k = kopf(l);
  if (k) {   // Kopf einer Übung: „1. Name · Gerät · 10 Wdh“
    id = OHNE.indexOf(k[0]) < 0 ? idVon(nameVon(k)) : null; zaehlt = false;
    const z = k.map(x => /^(\d+) Wdh$/.exec(x)).find(Boolean);
    if (id && z && !(id in ziele)) ziele[id] = +z[1];   // die Datei beginnt mit dem jüngsten Training: Das erste Ziel ist das heutige
    return;
  }
  if (l[0] === '#') { zaehlt = l === '#;KG;WDH'; return; }
  const s = /^\d+;\+?(-?[\d.]*);(\d+)$/.exec(l);
  if (!s || !id || !zaehlt) { if (id && zaehlt) aus++; return; }
  const kg = Math.round((parseFloat(s[1]) || 0) * 100) / 100, wdh = +s[2];
  if (!(kg >= 0 && kg <= 1000 && wdh >= 1 && wdh <= 1000)) { aus++; return; }
  const tagLog = log[tag] = log[tag] || {}; (tagLog[id] = tagLog[id] || []).push([kg, wdh]);
});
for (const d in meta) if (!log[d]) delete meta[d];
for (const d in log) for (const x in log[d]) log[d][x] = log[d][x].slice(0, 20);
for (const x in ziele) if (ex[x] && ziele[x] !== 10 && ziele[x] >= 1 && ziele[x] <= 30) ex[x].z = ziele[x];

/* Ohne „exported“: Die Datei ist keine Sicherung des Geräts und soll die Erinnerung an die Sicherung nicht zurückstellen */
fs.writeFileSync(ziel, JSON.stringify({ app: 'takt', v: 1, K: { ex, log, plans, meta } }));
const tageN = Object.keys(log).sort(), saetze = tageN.reduce((a, d) => a + Object.values(log[d]).reduce((b, s) => b + s.length, 0), 0);
console.log(n + ' Trainings gelesen → ' + tageN.length + ' Einheiten (' + tageN[0] + ' bis ' + tageN[tageN.length - 1] + '), ' + Object.keys(ex).length + ' Übungen, ' + saetze + ' Sätze, ' + aus + ' Zeilen ausgelassen');
console.log('Pläne: ' + Object.values(plans).map(p => p.n + ' (' + p.items.length + ')').join(', '));
console.log('Längster Name: ' + Object.values(ex).map(e => e.n).sort((a, b) => b.length - a.length)[0]);
