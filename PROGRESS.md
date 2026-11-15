# Track. – Fortschritt

## Aktueller Stand
- Live ist v39 unter https://tnyjmp8sz8-jpg.github.io/Meine-App/ (Zweig `main`).
- Der Arbeitszweig der Sitzung und `main` sind gleich.
- Der Nutzer hat in dieser Sitzung erlaubt, getestete Änderungen direkt nach `main` zu veröffentlichen. In einer neuen Sitzung neu erfragen.
- Die App aktualisiert sich seit v24 selbst; der Nutzer prüft die Version an der Fußzeile.

## Erledigt
- v20–v25: Umzug ins Repository; dunkler, kompakter Look mit farbigen Akzenten; Cloud-Code, Google-Schrift und Ton entfernt; Erinnerung an die Sicherung; GitHub Pages; Selbst-Aktualisierung; Versionshinweis.
- v26–v29: Gym nach Vorbild Alpha Progression: „Letztes Mal“ im laufenden Training, Tipp darauf öffnet das Blatt der Übung mit Graph; laufendes Training kleiner; Datumsfeld und seitliches Wischen auf dem iPhone behoben; kein Fokus-Rahmen mehr.
- v30–v31: wachsende Listen nach Monaten gruppiert (Gewicht mit Monatsschnitt).
- v32–v34: Gym mit Monat/Jahr wie Cardio; Recap mit „Verbesserung“ gesamt und je Übung; Pfeile im Training repariert (waren seit v20 ohne Wirkung).
- v33: „Einheiten“ im Gym als eingeklappte Zeile wie „Übungen“.
- v35: Bereich heißt „Finanzen“ statt „Haushalt“.
- v36: App heißt „Track.“; interne Kennungen bleiben `takt…`.
- v37: Kopfzeile deckend, damit sie auf dem iPhone beim Scrollen nicht unscharf wird.
- v38: Finanzen mit „Vermögen“ (Konten, monatlicher Stand, Plus/Minus, Graph), Sparzielen, Sparquote und Fixkosten aufs Jahr.
- Danach: `CLAUDE.md` neu aufgebaut und diese Datei angelegt.
- v39: Konten an Buchungen. Ausgaben, Einnahmen und feste Posten bekommen ein Konto; der Kontostand rechnet ab dem eingetragenen Stand von selbst weiter. Dazu Umbuchungen zwischen Konten und „Tag im Monat“ bei festen Posten.

## Offene Probleme
- Nichts ist auf einem echten iPhone getestet; alle Prüfungen laufen im Test-Browser.
- Negative Kontostände lassen sich speichern, aber auf dem iPhone nicht eintippen (Zahlentastatur ohne Minus).
- Konten lassen sich nur im Blatt „Stand eintragen“ anlegen und löschen, nicht umbenennen.
- Feste Posten, deren Tag im Monat des eingetragenen Stands schon vorbei ist, zählen erst ab dem Folgemonat (gewollt: Sie stecken schon im Stand).
- Unter dem Symbol auf dem Home-Bildschirm steht noch „Takt“, bis der Nutzer die App neu hinzufügt (vorher Sicherung speichern, danach einlesen, erst dann das alte Symbol löschen).
- Testskripte liegen nur im Arbeitsordner der Sitzung und gehen mit ihr verloren.

## Am iPhone noch zu prüfen (Rückmeldung des Nutzers steht aus)
- Datumsfeld bei „Einheit ändern“: passt es, lässt sich nichts mehr seitlich wischen?
- Kasten um „Schließen“ im Kalender: ist er weg?
- Kopfzeile beim Scrollen: bleibt sie scharf (v37)?
- Monatsfeld im Blatt „Stand eintragen“ (v38).
- Konto-Chips im Blatt für Ausgaben und Einnahmen (v39): passen sie bei mehreren Konten?

## Nächste Schritte
Vom Nutzer noch nicht entschieden (meine Vorschläge, nur auf Zuruf umsetzen):
- Finanzen: Erinnerung auf Heute ab dem 25., wenn für den Monat noch kein Stand eingetragen ist.
- Finanzen: Umschalter für Schulden (negative Stände).
- Name: den Punkt von „Track.“ in der Kopfzeile in Akzentblau.
- Kopfzeile: Linie darunter erst zeigen, wenn gescrollt wurde.
- Gym: „Stärkste Übung“ und „Schwächste Übung“ im Monats-Recap.
- Gym: Erklärtext unter den Kennzahlen nur auf Tipp zeigen.
- Gym: „Training beenden“ als kleiner Knopf oben im laufenden Training.
- Gym: im laufenden Training anzeigen, ob ein Satz besser oder schlechter war als beim letzten Mal.
- Heute: Verbesserung im Gym in der Zeile „Training“ zeigen.
- Testskripte ins Repository legen, damit neue Sitzungen mit denselben Tests arbeiten.
- Konkurrenz gründlich recherchieren (falls die App für andere gedacht wird).
