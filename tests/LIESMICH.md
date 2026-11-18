# Tests

Die Tests bedienen die App wie ein Mensch (Playwright mit Chromium) und vergleichen Anzeige und gespeicherte Daten mit von Hand nachgerechneten Werten. Sie gehören nicht zur App; der Service Worker speichert sie nicht.

- `node tests/alle.js`: alle Tests nacheinander. Vor jeder Veröffentlichung laufen lassen.
- `ablauf.js`: Sicherung einlesen, in jedem Bereich etwas eintragen, Neuladen.
- `aufbau.js`: Wochenleiste in jedem Bereich mit Kalender, Monat/Jahr über den Pfeilen, Erklärungen hinter „i“ (390 und 320 px).
- `klappen.js`: Klappzeilen (zu, auf, zu; Zahl rechts = Zahl der Zeilen; bleibt im Bereich offen, klappt beim Wechsel des Bereichs zu), verlegte Aktionen (Plus in der Überschrift, letzte Zeile der Liste) mit Tippfläche, Kurzfassung auf Heute, Zeile „Sicherung“, Erklärungen hinter „i“, 320 px mit allem aufgeklappt.
- `gesten.js`: Blatt wegziehen, zwischen Monaten wischen, Wert im Graphen ablesen (echte Berührungen).
- `loeschen.js`: „Rückgängig“ nach dem Löschen (Buchung, Konto im offenen Blatt, Training), eigene Kategorien.
- `notizen.js`: Aufgaben (Abschnitte, abhaken, Ordner, Liegengebliebenes) und Notizen (schnelle Aufnahme, Abhaken löscht, „Als Aufgabe“, Suche, Übernahme alter Notizen), wiederkehrende Aufgaben, Heute, Rückgängig, Sicherung, Kalender.
- `finanzen.js`: Konten, gerechneter Kontostand, Umbuchung, feste Posten, Vermögen, Sparziele, Sparquote.
- `gym.js`: Recap für Monat und Jahr, Verbesserung, Blatt der Übung, laufendes Training.
- `speicher.js`: 25-mal Neuladen, Sicherung speichern und einlesen.
- `update.js`: offline starten, Selbst-Aktualisierung, gleiche Versionsnummer in `sw.js` und Fußzeile.
- `node tests/bilder.js <ordner> [2]`: Bildschirmfotos aller Bereiche, der wichtigsten Blätter und einiger aufgeklappter Listen (dunkel, hell, 390 und 320 px) zum Ansehen.
- `node tests/live.js`: prüft die veröffentlichte App nach dem Hochladen.
- `lib.js`: Helfer. `daten.js`: Beispieldaten relativ zum heutigen Tag.

Neue Funktion oder behobener Fehler: eine Prüfung dazuschreiben, mit der Rechnung als Kommentar.

`python3 tests/startbilder.py` erzeugt die Startbilder fürs iPhone in `start/` neu (kein Test).
`node tests/symbol.js` erzeugt das App-Symbol (`icon-180/192/512.png`) neu (kein Test).
