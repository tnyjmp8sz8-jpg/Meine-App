# Tests

Die Tests bedienen die App wie ein Mensch (Playwright mit Chromium) und vergleichen Anzeige und gespeicherte Daten mit von Hand nachgerechneten Werten. Sie gehören nicht zur App; der Service Worker speichert sie nicht.

- `node tests/alle.js`: alle Tests nacheinander. Vor jeder Veröffentlichung laufen lassen.
- `ablauf.js`: Sicherung einlesen, in jedem Bereich etwas eintragen, Neuladen.
- `aufbau.js`: Wochenleiste in jedem Bereich mit Kalender, Monat/Jahr über den Pfeilen, Erklärungen hinter „i“ (390 und 320 px).
- `klappen.js`: Klappzeilen (zu, auf, zu; Zahl rechts = Zahl der Zeilen; bleibt im Bereich offen, klappt beim Wechsel des Bereichs zu), verlegte Aktionen (Plus in der Überschrift, letzte Zeile der Liste) mit Tippfläche, Kurzfassung auf Heute, Zeile „Sicherung“, Erklärungen hinter „i“ (bleiben beim Aufklappen stehen, die Zeile springt nicht; das „i“ bei „Letzter Lauf“ rutscht nie allein in eine Zeile), 320 px mit allem aufgeklappt, Gewicht mit wenigen Einträgen im jüngsten Monat (die letzten drei sind nach einem Tipp zu sehen) und die Liste entsteht nur aufgeklappt, Vermögen ohne Sparziel (Zeile mit Plus), Abstand eines Textes unter einer Überschrift.
- `gesten.js`: Blatt wegziehen, zwischen Monaten wischen, Wert im Graphen ablesen (echte Berührungen).
- `eingabe.js`: Eingaben in den Blättern: Gewicht mit geändertem Datum, Zielgewicht unverändert speichern.
- `loeschen.js`: „Rückgängig“ nach dem Löschen (Buchung, Konto im offenen Blatt, Training), eigene Kategorien.
- `notizen.js`: Notizen (schnelle Aufnahme, Abhaken löscht, Ordner, Suche, Übernahme alter Notizen), Heute, Rückgängig, Sicherung; dazu: Von den Aufgaben (seit v74 ausgebaut) und den Routinen (seit v75) ist nichts mehr zu sehen, Gespeichertes bleibt erhalten.
- `arbeit.js`: die Teile „Arbeit“ und „Uni“ im Planer (Umschalter mit drei Teilen, Plus oben; Notizen stehen dort seit v77 nicht mehr): Arbeitszeiten mit Verdienst je Monat (Pause, Schicht über Mitternacht, alter und neuer Lohn), Termine mit Punkten je Fach, Blätter, Löschen mit „Rückgängig“, 320 px, leere App. Läuft mit fester Uhr (15.11.2026).
- `finanzen.js`: Konten, gerechneter Kontostand, Umbuchung, feste Posten, Vermögen, Sparziele, Sparquote, Monatswechsel bei offener App. Die Uhr der Seite steht auf dem 15. des Monats (für den 28. gibt es einen eigenen Teil), damit kein Ergebnis vom Tag abhängt.
- `gym.js`: Recap für Monat und Jahr, Verbesserung, Blatt der Übung, laufendes Training; seit v85 Punkt je Übung (Trend), Vorgabe je Satz, Rekord, „Zahl wählen“, Pläne dieser Woche, Körpergewicht. Seit v87 auch Reihenfolge und Runde der Pläne und Einlesen nach Namen, seit v88 die Übernahme aus Alpha Progression mit einem erfundenen Export.
- `monat.js`: Monatsabschluss auf Heute (Vergleich mit dem Vormonat, Hinweis am Monatsanfang) und der Kurzbefehl `?neu=…`, mit gestellter Uhr.
- `huelle.js`: Verbindung zur iPhone-App, die dafür nachgestellt wird: Stand für Widget und Mitteilung, Läufe aus Health, Eingang aus Widget und Kurzbefehlen, Tastatur, Auskunft. Seit v65: Konten für die Schnelleingabe (Stand in vier Fällen; Auftrag als Ausgabe oder Einnahme mit Konto, Kontostand und Vermögen nachgerechnet) und die Sicherung von selbst: wann sie hinausgeht und wann nie (höchstens eine je fünf Minuten, erste Auskunft jedes Tages, vor dem Neuladen der Seite), was `gesichert()` meldet (für Erinnerung und Mitteilung zählt nur die Kopie im gewählten Ordner; Fehler in Rot; nur bei nicht geschriebener Datei bleibt die Sicherung offen), Klappzeile mit Ordner wählen und abwählen, kein halbes Zeichen in der Datei, Name der Datei nach dem Tag am Ort (Berlin kurz nach Mitternacht), 320 und 390 px. Diese Teile laufen mit gestellter Uhr (der 15. des Monats); Wartezeiten vergehen dort über `page.clock.runFor()`.
- `haptik.js`: welche Handlung der iPhone-App welchen Impuls schickt (und ohne iPhone-App nichts), Blatt fährt beim Schließen weg, Zeilen antworten auf Druck.
- `speicher.js`: 25-mal Neuladen, Sicherung speichern und einlesen.
- `update.js`: offline starten, Selbst-Aktualisierung, gleiche Versionsnummer in `sw.js` und Fußzeile.
- `node tests/bilder.js <ordner> [2]`: Bildschirmfotos aller Bereiche, der wichtigsten Blätter und einiger aufgeklappter Listen (dunkel, hell, 390 und 320 px) zum Ansehen.
- `node tests/live.js`: prüft die veröffentlichte App nach dem Hochladen.
- `node tests/am.js JJJJ-MM-TT [reihe …]`: dieselben Reihen mit vorgetäuschtem Datum (Uhr von Node und Uhr der Seite), auch für Tage vor heute. Zeigt, ob eine Reihe vom Tag abhängt, an dem sie läuft. Nach Änderungen an Tests mit Datum für einen 1., 2., 15., 28. und 31. laufen lassen.
- `lib.js`: Helfer und die Liste der Reihen; `oeffnen({ uhr })` stellt die Uhr der Seite, `oeffnen({ zone })` ihre Zeitzone. `daten.js`: Beispieldaten relativ zum heutigen Tag.

Neue Funktion oder behobener Fehler: eine Prüfung dazuschreiben, mit der Rechnung als Kommentar.

`python3 tests/startbilder.py` erzeugt die Startbilder fürs iPhone in `start/` neu (kein Test).
`node tests/symbol.js` erzeugt das App-Symbol (`icon-180/192/512.png`) neu (kein Test).
