// Läufe von der Apple Watch über zwei Kurzbefehle (iPhone-App ab 0.5): was der App-Inhalt aus den Werten macht. Die iPhone-App wird nachgestellt.
// Die Uhr der Seite steht auf dem 15. des Monats, 12 Uhr: So hängt nichts vom Tag ab, an dem die Reihe läuft.
const { monat, pad, oeffnen, text, bereich, gespeichert, pruefer, lauf } = require('./lib');

const huelle = () => { window.__post = []; window.webkit = { messageHandlers: { track: { postMessage: o => window.__post.push(JSON.parse(JSON.stringify(o))) } } }; };
const M = monat(0), JM = M.slice(0, 4), am = t => M + '-' + pad(t), um = (t, h, m = 0, s = 0) => new Date(+JM, +M.slice(5) - 1, t, h, m, s).getTime();
const ruf = (page, name, arg) => page.evaluate(([n, a]) => window.TrackHuelle[n](a), [name, arg]);
const kennung = t => 'k' + Math.floor(t / 60000);
/* Vorgeschichte: zwei Laufband-Läufe von Hand (am 3. mit 1,5 % Steigung, am 8. mit 2 %), der letzte Lauf ist also Laufband mit 2 % */
const daten = () => ({ S: { routines: [], running: null }, LY: {}, W: {}, MF: {}, MY: {}, K: {}, N: {},
  T: { hk: {}, runs: { a: { d: am(3), m: 5000, s: 1800, hr: 150, k: 'in', inc: 1.5 }, b: { d: am(8), m: 6000, s: 2100, hr: 152, k: 'in', inc: 2 } } } });

lauf(async () => {
  const p = pruefer('Läufe von der Apple Watch');
  const o = await oeffnen({ daten: daten(), skript: huelle, uhr: new Date(um(15, 12)) }), page = o.page;
  const runs = async () => { const g = await gespeichert(page); return Object.keys(g.T.runs).filter(i => g.T.runs[i]).map(i => Object.assign({ id: i }, g.T.runs[i])); };
  const einer = async h => (await runs()).find(r => r.h === h);
  const auftrag = (id, l) => [{ id, art: 'lauf', t: um(15, 11, 59), lauf: l }];

  /* 1. Lauf am 14. von 18:02:10 bis 18:47:23 = 2713 s. Strecke 5,62 (km): 5,62 / (2713 / 3600) = 7,46 km/h, also km → 5620 m. Puls 151,4 → 151.
        Art fehlt: wie der letzte Lauf (Laufband), mit dessen Steigung 2 %. */
  const von = um(14, 18, 2, 10), bis = um(14, 18, 47, 23), id = kennung(von);
  let ids = await ruf(page, 'eingang', auftrag('u1', { id, t: von, s: (bis - von) / 1000, km: [5.62], pu: [151.4] }));
  let r = await einer(id);
  p.ok('Auftrag wird als übernommen gemeldet', ids.join() === 'u1', ids.join());
  p.ok('Lauf eingetragen: 5620 m, 2713 s, Puls 151, Tag des Beginns', r && r.m === 5620 && r.s === 2713 && r.hr === 151 && r.d === am(14), JSON.stringify(r));
  p.ok('Art wie der letzte Lauf: Laufband mit 2 % Steigung', r && r.k === 'in' && r.inc === 2, JSON.stringify(r));
  p.ok('es sind jetzt drei Läufe', (await runs()).length === 3);

  /* 2. Die Uhr liefert nach: 5,71 km, Puls als Einzelwerte 150 und 153 → Mittel 151,5 → 152. Derselbe Lauf wird nachgebessert, es entsteht kein zweiter. */
  await ruf(page, 'eingang', auftrag('u2', { id, t: von, s: 2713, km: [5.71], pu: [150, 153] }));
  r = await einer(id);
  p.ok('nachgeliefert: derselbe Lauf hat jetzt 5710 m und Puls 152', r && r.m === 5710 && r.hr === 152 && (await runs()).length === 3, JSON.stringify(r));
  /* 3. Kommt später kein Puls mehr mit, bleibt der alte stehen. Zwei Werte je Tag (Lauf über Mitternacht) zählen zusammen: 3,0 + 2,75 = 5,75 km. */
  await ruf(page, 'eingang', auftrag('u3', { id, t: von, s: 2713, km: [3.0, 2.75], pu: [] }));
  r = await einer(id);
  p.ok('ohne Puls nachgeliefert: Strecke 5750 m (zwei Werte), Puls bleibt 152', r && r.m === 5750 && r.hr === 152, JSON.stringify(r));

  /* 4. Von Hand geändert (Anzeige des Laufbands: 6,00 km): Danach bessert nichts mehr nach. */
  await bereich(page, 'training');
  await page.click('#v-training [data-fold="laeufe"]');
  await page.click('#v-training [data-t="edit"][data-id="' + r.id + '"]');
  await page.fill('#t-km', '6,00'); await page.click('#t-save'); await page.waitForTimeout(150);
  let g = await gespeichert(page), hand = g.T.runs[r.id];
  p.ok('von Hand gespeichert: 6000 m, die Kennung ist weg', hand.m === 6000 && !hand.h, JSON.stringify(hand));
  await ruf(page, 'eingang', auftrag('u4', { id, t: von, s: 2713, km: [5.80], pu: [160] }));
  g = await gespeichert(page);
  p.ok('danach nachgeliefert: der Lauf bleibt bei 6000 m und Puls 152, kein neuer Lauf', g.T.runs[r.id].m === 6000 && g.T.runs[r.id].hr === 152 && (await runs()).length === 3, JSON.stringify(g.T.runs[r.id]));

  /* 5. Meter statt km: 4200 in 1500 s wären 10080 km/h, also Meter → 4200 m. Puls als Summe (81234) zählt nicht. Art ausdrücklich „draußen“. */
  const v2 = um(13, 7, 0, 0), id2 = kennung(v2);
  await ruf(page, 'eingang', auftrag('u5', { id: id2, t: v2, s: 1500, km: [4200], pu: [81234], k: 'out' }));
  r = await einer(id2);
  p.ok('Meter erkannt: 4200 m, Summe als Puls verworfen, Art draußen ohne Steigung', r && r.m === 4200 && r.hr === null && r.k === 'out' && r.inc === null, JSON.stringify(r));

  /* 6. Zwei Läufe am selben Tag über den Kurzbefehl mit fast gleicher Strecke (4,2 und 4,3 km): Beide kommen, weil sie aus derselben Quelle stammen. */
  const v3 = um(13, 19, 0, 0), id3 = kennung(v3);
  await ruf(page, 'eingang', auftrag('u6', { id: id3, t: v3, s: 1560, km: [4.3], pu: [149] }));
  p.ok('zweiter Lauf am selben Tag aus derselben Quelle kommt an', !!(await einer(id3)) && (await runs()).length === 5, JSON.stringify(await runs()));

  /* 7. Von Hand eingetragen (am 8.: 6,0 km in 2100 s), die Uhr meldet für denselben Tag 5,1 km in 2130 s:
        Strecke 15 % daneben (mehr als 10 %), Dauer 1,4 % daneben → derselbe Lauf, nicht doppelt. Die Kennung ist gemerkt. */
  const v4 = um(8, 18, 0, 0), id4 = kennung(v4);
  await ruf(page, 'eingang', auftrag('u7', { id: id4, t: v4, s: 2130, km: [5.1], pu: [150] }));
  g = await gespeichert(page);
  p.ok('von Hand eingetragener Lauf mit gleicher Dauer: nicht doppelt, Kennung gemerkt', (await runs()).length === 5 && g.T.hk[id4] === 1, JSON.stringify(g.T.hk));

  /* 8. Ohne Strecke entsteht kein Lauf (zu kurz, leer) */
  const v5 = um(12, 18, 0, 0), id5 = kennung(v5);
  await ruf(page, 'eingang', auftrag('u8', { id: id5, t: v5, s: 1800, km: [], pu: [150] }));
  p.ok('ohne Strecke: kein Lauf', !(await einer(id5)) && (await runs()).length === 5);

  /* 9. Gelöscht kommt nicht wieder, auch nicht über Nachliefern */
  await page.click('#v-training [data-t="edit"][data-id="' + (await einer(id3)).id + '"]');
  await page.click('#t-del'); await page.waitForTimeout(150);
  await ruf(page, 'eingang', auftrag('u9', { id: id3, t: v3, s: 1560, km: [4.4], pu: [149] }));
  p.ok('gelöschter Lauf kommt nicht wieder', !(await einer(id3)) && (await runs()).length === 4);

  /* 10. Klappzeile „Apple Watch“: ohne uhr in info() gibt es sie nicht; mit uhr zeigt sie den letzten erkannten Lauf.
         Erkannt: der Lauf vom 14. (eingetragen: von Hand geändert, gleiche Dauer) und einer am 15. von 9:00 bis 9:40, zu dem keine Strecke kam (2 Versuche). */
  await ruf(page, 'info', { app: '0.5', health: 'fehlt' });
  p.ok('ohne uhr: keine Zeile', await page.locator('#v-training [data-fold="uhr"]').count() === 0);
  const v6 = um(15, 9, 0, 0), b6 = um(15, 9, 40, 0);
  await ruf(page, 'info', { app: '0.5', health: 'fehlt', uhr: { n: 2, offen: 0, letzte: [{ von, bis, lesungen: 3, km: 5.75, puls: 152 }, { von: v6, bis: b6, lesungen: 2, km: 0, puls: 0 }] } });
  p.enthaelt('mit uhr: Zeile „Apple Watch“ nennt den neuesten Lauf und was fehlt', await text(page, '#v-training [data-fold="uhr"]'), ['Apple Watch', 'Strecke fehlt']);
  await page.click('#v-training [data-fold="uhr"]'); await page.waitForTimeout(100);
  const zeilen = await page.evaluate(() => [...document.querySelector('#v-training [data-fold="uhr"]').closest('ul').querySelectorAll('li')].slice(1).map(l => l.innerText.replace(/\s+/g, ' ').trim()));
  p.ok('aufgeklappt: neuester zuerst, der vom 14. gilt als eingetragen', zeilen.length === 2 && zeilen[0].includes('09:00 bis 09:40') && zeilen[0].includes('Strecke fehlt') && zeilen[1].includes('18:02 bis 18:47') && zeilen[1].includes('eingetragen'), JSON.stringify(zeilen));
  /* Tipp auf den Lauf ohne Strecke: Blatt mit Tag und Dauer (40:00), Art wie zuletzt gewählt */
  await page.click('#v-training [data-t="uhr"][data-von]'); await page.waitForTimeout(150);
  const blatt = await page.evaluate(() => ({ auf: document.querySelector('#tsheet').open, d: document.querySelector('#t-date').value, min: document.querySelector('#t-min').value, sec: document.querySelector('#t-sec').value, km: document.querySelector('#t-km').value }));
  p.ok('Tipp darauf: Blatt mit dem 15. und 40:00, Strecke leer', blatt.auf && blatt.d === am(15) && blatt.min === '40' && blatt.sec === '0' && blatt.km === '', JSON.stringify(blatt));
  await page.fill('#t-km', '6,4'); await page.click('#t-save'); await page.waitForTimeout(150);
  p.enthaelt('nach dem Eintragen von Hand gilt der Lauf als eingetragen', await text(page, '#v-training [data-fold="uhr"]'), ['eingetragen']);
  /* Die Uhr liefert doch noch: gleiche Dauer wie der von Hand eingetragene → nicht doppelt */
  await ruf(page, 'eingang', auftrag('u10', { id: kennung(v6), t: v6, s: 2400, km: [5.9], pu: [150] }));
  p.ok('später doch geliefert: nicht doppelt', (await runs()).length === 5, JSON.stringify(await runs()));

  /* 11. Ein Lauf läuft gerade (Beginn gemeldet, Ende steht aus) */
  await ruf(page, 'info', { app: '0.5', health: 'fehlt', uhr: { n: 2, offen: um(15, 11, 30), letzte: [] } });
  p.enthaelt('laufender Lauf: Zeile sagt es', await text(page, '#v-training [data-fold="uhr"]'), ['Lauf läuft seit 11:30']);
  /* Beginn am 14. um 20:00 gemeldet, seitdem nichts (16 Stunden): Das Ende fehlt */
  await ruf(page, 'info', { app: '0.5', health: 'fehlt', uhr: { n: 2, offen: um(14, 20, 0), letzte: [{ von, bis, lesungen: 3, km: 5.75, puls: 152 }] } });
  p.enthaelt('Beginn ohne Ende: Zeile sagt es', await text(page, '#v-training [data-fold="uhr"]'), ['20:00 Uhr', 'Ende fehlt']);
  await ruf(page, 'info', { app: '0.5', health: 'fehlt', uhr: { n: 0, offen: 0, letzte: [] } });
  p.enthaelt('noch nichts erkannt: Zeile sagt es, darunter der Hinweis auf die zwei Kurzbefehle', await text(page, '#v-training'), ['noch kein Lauf erkannt', 'Lauf merken']);

  /* 12. 320 px: nichts ragt hinaus */
  await page.setViewportSize({ width: 320, height: 700 }); await page.waitForTimeout(150);
  await ruf(page, 'info', { app: '0.5', health: 'fehlt', uhr: { n: 2, offen: 0, letzte: [{ von, bis, lesungen: 3, km: 5.75, puls: 152 }, { von: v6, bis: b6, lesungen: 2, km: 0, puls: 0 }] } });
  const breit = await page.evaluate(() => { const s = document.querySelector('#scroll'); return s.scrollWidth <= s.clientWidth && [...document.querySelectorAll('#v-training [data-fold="uhr"], #v-training [data-t="uhr"], #v-training .two')].every(e => e.getBoundingClientRect().right <= innerWidth + 0.5); });
  p.ok('320 px: nichts seitlich wischbar, nichts ragt hinaus', breit);
  await page.screenshot({ path: __dirname + '/../uhr-320.png' });
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(150);
  await page.evaluate(() => { const s = document.querySelector('#scroll'); s.scrollTop = s.scrollHeight; });
  await page.screenshot({ path: __dirname + '/../uhr-390.png' });
  await p.ende(o.browser, o.fehler);
});
