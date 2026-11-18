// Testreihen mit vorgetäuschtem Datum: node tests/am.js 2026-12-01 [reihe …]   (ohne Reihen: alle aus lib.js)
// Zeigt, ob eine Reihe vom Tag abhängt, an dem sie läuft: am Monatsersten liegt „gestern“ im Vormonat, in den ersten Tagen fehlen Einträge des laufenden Monats,
// ab dem 28. zählen feste Posten anders, am 31. hat der Folgemonat den Tag nicht. Die Uhr von Node und die der Seite stehen auf 10 Uhr dieses Tages und laufen weiter.
// Die Datei ist Starter und Vorlade-Skript zugleich: Der Starter ruft jede Reihe mit „node -r tests/am.js“ auf; vorgeladen verstellt sie die Uhr auf TRACK_DATUM.
const path = require('path');

if (require.main === module) {
  const { spawnSync } = require('child_process'), { REIHEN } = require('./lib');
  const [datum, ...wahl] = process.argv.slice(2), schlecht = [];
  if (!/^\d{4}-\d\d-\d\d$/.test(datum || '')) { console.log('Aufruf: node tests/am.js JJJJ-MM-TT [reihe …]'); process.exit(1); }
  for (const t of wahl.length ? wahl : REIHEN) {
    const r = spawnSync(process.execPath, ['-r', __filename, path.join(__dirname, t + '.js')], { stdio: 'inherit', timeout: 300000, env: Object.assign({}, process.env, { TRACK_DATUM: datum }) });
    if (r.status !== 0) schlecht.push(t);
  }
  console.log(schlecht.length ? '\nAm ' + datum + ' stimmt nicht: ' + schlecht.join(', ') + '.' : '\nAm ' + datum + ' stimmen alle Reihen.');
  process.exit(schlecht.length ? 1 : 0);
} else if (process.env.TRACK_DATUM) {
  const Echt = Date, versatz = new Echt(process.env.TRACK_DATUM + 'T10:00:00').getTime() - Echt.now();
  /* new Date() und Date.now() liefern die verschobene Zeit; mit Angaben (new Date(2026, 11, 1)) bleibt alles, wie es ist */
  class Vorgetaeuscht extends Echt { constructor(...a) { if (a.length) super(...a); else super(Echt.now() + versatz); } static now() { return Echt.now() + versatz; } }
  global.Date = Vorgetaeuscht;
  /* Die Seite bekommt dieselbe Zeit, außer die Reihe stellt ihre Uhr selbst (dann leitet sie sie aus dem vorgetäuschten Datum von Node ab) */
  const lib = require('./lib'), oeffnen = lib.oeffnen;
  lib.oeffnen = (o = {}) => oeffnen(Object.assign({}, o, { uhr: o.uhr || new Date() }));
}
