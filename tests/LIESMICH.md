# Tests

Die Tests bedienen die App wie ein Mensch (Playwright mit Chromium) und vergleichen Anzeige und gespeicherte Daten mit von Hand nachgerechneten Werten. Sie gehören nicht zur App; der Service Worker speichert sie nicht.

- `node tests/alle.js`: alle Tests nacheinander. Vor jeder Veröffentlichung laufen lassen.
- `ablauf.js`: Sicherung einlesen, in jedem Bereich etwas eintragen, Neuladen.
- `finanzen.js`: Konten, gerechneter Kontostand, Umbuchung, feste Posten, Vermögen, Sparziele, Sparquote.
- `gym.js`: Recap für Monat und Jahr, Verbesserung, Blatt der Übung, laufendes Training.
- `speicher.js`: 25-mal Neuladen, Sicherung speichern und einlesen.
- `update.js`: offline starten, Selbst-Aktualisierung, gleiche Versionsnummer in `sw.js` und Fußzeile.
- `node tests/bilder.js <ordner> [2]`: Bildschirmfotos aller Bereiche (dunkel, hell, 390 und 320 px) zum Ansehen.
- `node tests/live.js`: prüft die veröffentlichte App nach dem Hochladen.
- `lib.js`: Helfer. `daten.js`: Beispieldaten relativ zum heutigen Tag.

Neue Funktion oder behobener Fehler: eine Prüfung dazuschreiben, mit der Rechnung als Kommentar.
