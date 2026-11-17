// Alle Tests nacheinander, vor jeder Veröffentlichung: node tests/alle.js
const { spawnSync } = require('child_process');
const path = require('path');

const tests = ['ablauf', 'aufbau', 'gesten', 'loeschen', 'notizen', 'finanzen', 'gym', 'monat', 'huelle', 'speicher', 'update'], schlecht = [];
for (const t of tests) {
  const r = spawnSync(process.execPath, [path.join(__dirname, t + '.js')], { stdio: 'inherit', timeout: 300000 });
  if (r.status !== 0) schlecht.push(t);
}
console.log(schlecht.length ? '\nNICHT VERÖFFENTLICHEN: ' + schlecht.join(', ') + ' stimmt nicht.' : '\nAlle Tests stimmen.');
process.exit(schlecht.length ? 1 : 0);
