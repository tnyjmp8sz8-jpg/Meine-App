// Schreibt die Trainings des Nutzers aus Alpha Progression fest in die App (Block <script id="start-gym"> in index.html).
// Aufruf: node tests/historie.js <Workouts.csv>
// Die App selbst wandelt die Datei um (alphaK), genau wie bei „Sicherung einlesen“: Hier wird das Ergebnis nur aus dem Speicher gelesen und in index.html abgelegt.
// Beim ersten Start mit einem neuen Stand (data-stand = Tag der jüngsten Einheit) liest die App den Block einmal ein (startGym) und merkt sich den Stand in takt.start.
// Achtung: Das Repository ist öffentlich. Der Block steht dort mit seinem ausdrücklichen Ja vom 24.11.2026; die CSV selbst gehört nicht ins Repository.
const fs = require('fs'), path = require('path');
const { oeffnen, gespeichert, lauf } = require('./lib');

lauf(async () => {
  const csv = process.argv[2];
  if (!csv) { console.log('Aufruf: node tests/historie.js <Workouts.csv>'); process.exit(1); }
  const { browser, page, fehler } = await oeffnen();
  await page.setInputFiles('#bk-file', csv); await page.waitForTimeout(800);
  const K = (await gespeichert(page)).K || {}, tage = Object.keys(K.log || {}).sort();
  await browser.close();
  if (!tage.length || fehler.length) { console.log('Nichts eingelesen. ' + fehler.join(' · ')); process.exit(1); }
  /* Seit v112 (sein Neuanfang ab Montag, 23.11.2026): Einheiten davor kommen nicht mehr in den Block, und nur Übungen, die in einem Plan oder einer verbleibenden Einheit stehen */
  const AB = '2026-11-23', ab = o => Object.fromEntries(Object.entries(o || {}).filter(e => e[0] >= AB)), log = ab(K.log), bleibt = new Set();
  Object.values(K.plans || {}).forEach(p => p && p.items.forEach(it => bleibt.add(it.id))); Object.values(log).forEach(t => Object.keys(t || {}).forEach(id => bleibt.add(id)));
  const daten = JSON.stringify({ ex: Object.fromEntries(Object.entries(K.ex).filter(e => bleibt.has(e[0]))), log, plans: K.plans, meta: ab(K.meta) }).replace(/</g, '\\u003c');
  const datei = path.join(__dirname, '..', 'index.html'), alt = fs.readFileSync(datei, 'utf8');
  const neu = alt.replace(/<script type="application\/json" id="start-gym" data-stand="[^"]*">[^]*?<\/script>/, () => '<script type="application/json" id="start-gym" data-stand="' + tage[tage.length - 1] + '">' + daten + '</script>');
  if (neu === alt && alt.indexOf(daten) < 0) { console.log('Der Block start-gym fehlt in index.html.'); process.exit(1); }
  fs.writeFileSync(datei, neu);
  console.log(tage.length + ' Einheiten (' + tage[0] + ' bis ' + tage[tage.length - 1] + '), ' + Object.keys(K.ex).length + ' Übungen, ' + Object.keys(K.plans).length + ' Pläne, ' + Math.round(daten.length / 1024) + ' KB in index.html');
});
