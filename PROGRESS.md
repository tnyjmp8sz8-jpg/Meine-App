# Track. – Fortschritt

## Aktueller Stand
- Live ist v41 unter https://tnyjmp8sz8-jpg.github.io/Meine-App/ (Zweig `main`).
- Der Arbeitszweig der Sitzung und `main` sind gleich.
- Der Nutzer hat in dieser Sitzung erlaubt, getestete Änderungen direkt nach `main` zu veröffentlichen. In einer neuen Sitzung neu erfragen.
- Die App aktualisiert sich seit v24 selbst; der Nutzer prüft die Version an der Fußzeile.

## Erledigt
- v20–v29: Umzug ins Repository; dunkler, kompakter Look; Cloud-Code, Google-Schrift und Ton entfernt; Erinnerung an die Sicherung; GitHub Pages; Selbst-Aktualisierung; Versionshinweis; Gym nach Vorbild Alpha Progression („Letztes Mal“, Blatt der Übung mit Graph); iPhone-Fehler bei Datumsfeld, seitlichem Wischen und Fokus-Rahmen behoben.
- v30–v31: wachsende Listen nach Monaten gruppiert (Gewicht mit Monatsschnitt).
- v32–v34: Gym mit Monat/Jahr wie Cardio; Recap mit „Verbesserung“ gesamt und je Übung; Pfeile im Training repariert (waren seit v20 ohne Wirkung).
- v33: „Einheiten“ im Gym als eingeklappte Zeile wie „Übungen“.
- v35: Bereich heißt „Finanzen“ statt „Haushalt“.
- v36: App heißt „Track.“; interne Kennungen bleiben `takt…`.
- v37: Kopfzeile deckend, damit sie auf dem iPhone beim Scrollen nicht unscharf wird.
- v38: Finanzen mit „Vermögen“ (Konten, monatlicher Stand, Plus/Minus, Graph), Sparzielen, Sparquote und Fixkosten aufs Jahr.
- Danach: `CLAUDE.md` neu aufgebaut und diese Datei angelegt.
- v39: Konten an Buchungen. Ausgaben, Einnahmen und feste Posten bekommen ein Konto; der Kontostand rechnet ab dem eingetragenen Stand von selbst weiter. Dazu Umbuchungen zwischen Konten und „Tag im Monat“ bei festen Posten.
- v40: Konten umbenennen (Name im Blatt „Stand eintragen“ ändern) und mit „+ Konto“ direkt beim Buchen anlegen; Konten ohne Stand erscheinen mit Hinweis. Tests liegen jetzt im Repository unter `tests/`.
- v41: Vergleich in Zeilen mit Wert (Letzter Lauf, Woche, Sparquote) wieder unter dem Wert statt daneben.

## Offene Probleme
- Nichts ist auf einem echten iPhone getestet; alle Prüfungen laufen im Test-Browser.
- Negative Kontostände lassen sich speichern, aber auf dem iPhone nicht eintippen (Zahlentastatur ohne Minus).
- Feste Posten, deren Tag im Monat des eingetragenen Stands schon vorbei ist, zählen erst ab dem Folgemonat (gewollt: Sie stecken schon im Stand).
- Unter dem Symbol auf dem Home-Bildschirm steht noch „Takt“, bis der Nutzer die App neu hinzufügt (vorher Sicherung speichern, danach einlesen, erst dann das alte Symbol löschen).

## Am iPhone noch zu prüfen (Rückmeldung des Nutzers steht aus)
- Datumsfeld bei „Einheit ändern“: passt es, lässt sich nichts mehr seitlich wischen?
- Kasten um „Schließen“ im Kalender: ist er weg?
- Kopfzeile beim Scrollen: bleibt sie scharf (v37)?
- Monatsfeld im Blatt „Stand eintragen“ (v38).
- Konto-Chips und „+ Konto“ im Blatt für Ausgaben und Einnahmen (v39, v40): passen sie bei mehreren Konten?
- Kontoname im Blatt „Stand eintragen“ antippen und ändern (v40).

## Nächste Schritte
Vom Nutzer noch nicht entschieden (meine Vorschläge, nur auf Zuruf umsetzen):
- Finanzen: Erinnerung auf Heute ab dem 25., wenn für den Monat noch kein Stand eingetragen ist.
- Finanzen: Umschalter für Schulden (negative Stände).
- Sicherung: Erinnerung schon nach sieben Tagen, sobald Konten geführt werden.
- Name: den Punkt von „Track.“ in der Kopfzeile in Akzentblau.
- Kopfzeile: Linie darunter erst zeigen, wenn gescrollt wurde.
- Gym: „Stärkste Übung“ und „Schwächste Übung“ im Monats-Recap.
- Gym: Erklärtext unter den Kennzahlen nur auf Tipp zeigen.
- Gym: „Training beenden“ als kleiner Knopf oben im laufenden Training.
- Gym: im laufenden Training anzeigen, ob ein Satz besser oder schlechter war als beim letzten Mal.
- Heute: Verbesserung im Gym in der Zeile „Training“ zeigen.
- Konkurrenz gründlich recherchieren (falls die App für andere gedacht wird).
