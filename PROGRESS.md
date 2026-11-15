# Track. – Fortschritt

## Aktueller Stand
- Live ist v43 unter https://tnyjmp8sz8-jpg.github.io/Meine-App/ (Zweig `main`).
- Der Arbeitszweig der Sitzung und `main` sind gleich.
- Der Nutzer hat in dieser Sitzung erlaubt, getestete Änderungen direkt nach `main` zu veröffentlichen. In einer neuen Sitzung neu erfragen.
- Die App aktualisiert sich seit v24 selbst; der Nutzer prüft die Version an der Fußzeile.

## Erledigt
- v20–v29: Umzug ins Repository; dunkler, kompakter Look; Cloud-Code, Google-Schrift und Ton entfernt; Erinnerung an die Sicherung; GitHub Pages; Selbst-Aktualisierung; Versionshinweis; Gym nach Vorbild Alpha Progression („Letztes Mal“, Blatt der Übung mit Graph); iPhone-Fehler bei Datumsfeld, seitlichem Wischen und Fokus-Rahmen behoben.
- v30–v34: wachsende Listen nach Monaten gruppiert; Gym mit Monat/Jahr, Recap mit „Verbesserung“ gesamt und je Übung, „Einheiten“ eingeklappt; Pfeile im Training repariert.
- v35: Bereich heißt „Finanzen“ statt „Haushalt“.
- v36: App heißt „Track.“; interne Kennungen bleiben `takt…`.
- v37: Kopfzeile deckend, damit sie auf dem iPhone beim Scrollen nicht unscharf wird.
- v38: Finanzen mit „Vermögen“ (Konten, monatlicher Stand, Plus/Minus, Graph), Sparzielen, Sparquote und Fixkosten aufs Jahr.
- Danach: `CLAUDE.md` neu aufgebaut und diese Datei angelegt.
- v39: Konten an Buchungen. Ausgaben, Einnahmen und feste Posten bekommen ein Konto; der Kontostand rechnet ab dem eingetragenen Stand von selbst weiter. Dazu Umbuchungen zwischen Konten und „Tag im Monat“ bei festen Posten.
- v40: Konten umbenennen (Name im Blatt „Stand eintragen“ ändern) und mit „+ Konto“ direkt beim Buchen anlegen; Konten ohne Stand erscheinen mit Hinweis. Tests liegen jetzt im Repository unter `tests/`.
- v41: Vergleich in Zeilen mit Wert (Letzter Lauf, Woche, Sparquote) wieder unter dem Wert statt daneben.
- v42: Fehler behoben, gemeldet vom Nutzer: Buchungen veränderten das Vermögen nicht. Zwei Ursachen: Ein Stand aus v38 (ohne Zeitpunkt) im laufenden Monat galt als Stand zum Monatsende; und neue Buchungen standen still auf „Kein Konto“. Jetzt ist das zuletzt benutzte oder das einzige Konto vorbelegt, bei mehreren Konten ohne Vorgeschichte fragt das Blatt nach.
- v43: Zeile „Ohne Konto“ im Bereich Vermögen: zeigt eingeklappt, was ohne Konto gebucht ist und deshalb nicht mitrechnet; ein Tipp auf einen Eintrag öffnet ihn zum Nachtragen.

## Offene Probleme
- Nichts ist auf einem echten iPhone getestet; alle Prüfungen laufen im Test-Browser.
- Negative Kontostände lassen sich speichern, aber auf dem iPhone nicht eintippen (Zahlentastatur ohne Minus).
- Feste Posten, deren Tag im Monat des eingetragenen Stands schon vorbei ist, zählen erst ab dem Folgemonat (gewollt: Sie stecken schon im Stand).
- Buchungen, die der Nutzer vor v42 ohne Konto eingetragen hat, zählen weiter nicht, bis er das Konto nachträgt (seit v43 über die Zeile „Ohne Konto“ im Vermögen).
- Wer bewusst ohne Konto bucht, sieht die Zeile „Ohne Konto“ im Vermögen dauerhaft. Für den Nutzer passt das (er will, dass alles mitrechnet).
- `healBal()` wird nur für Stände aus v38 gebraucht und wirkt nur im Monat des Stands (November 2026). Ab Dezember 2026 kann die Funktion samt ihrer Prüfung entfernt werden.
- Unter dem Symbol auf dem Home-Bildschirm steht noch „Takt“, bis der Nutzer die App neu hinzufügt (vorher Sicherung speichern, danach einlesen, erst dann das alte Symbol löschen).

## Am iPhone noch zu prüfen (Rückmeldung des Nutzers steht aus)
- Datumsfeld bei „Einheit ändern“: passt es, lässt sich nichts mehr seitlich wischen?
- Kasten um „Schließen“ im Kalender: ist er weg?
- Kopfzeile beim Scrollen: bleibt sie scharf (v37)?
- Monatsfeld im Blatt „Stand eintragen“ (v38).
- Konto-Chips und „+ Konto“ im Blatt für Ausgaben und Einnahmen (v39, v40): passen sie bei mehreren Konten?
- Kontoname im Blatt „Stand eintragen“ antippen und ändern (v40).
- Rechnet das Vermögen nach einer Ausgabe oder Einnahme jetzt mit (v42)? Ist im Blatt das Konto schon blau gewählt?
- Zeile „Ohne Konto“ im Vermögen (v43): aufklappen, Buchung antippen, Konto wählen, speichern.

## Durchsicht der ganzen App (nach v43, auf Wunsch des Nutzers: „Apple-like Produkt“)
Urteil: Aussehen nah dran, Bediengefühl noch nicht. Befunde, nach Wirkung geordnet (nur auf Zuruf umsetzen):
1. Zu viel Bedienleiste über dem Inhalt: in Finanzen und Training vier Reihen (Umschalter, Wochenleiste, Monat/Jahr, Pfeile) vor der ersten Zahl. Idee: Wochenleiste nur auf Heute und Routinen, Monat/Jahr und Pfeile in eine Reihe.
2. Blätter lassen sich nicht nach unten wegwischen, obwohl der Griff das verspricht; kein Wischen zwischen Monaten. Im Code gibt es keine Wischgesten.
3. Löschen ohne „Rückgängig“.
4. Graphen sind nicht antippbar (kein Wert an einem Punkt).
5. Erklärtexte stehen dauerhaft da (Gym-Verbesserung, Zusammenhänge, „pro Tag bis Monatsende“): hinter ein kleines „i“.
6. Kleinigkeiten: „KG“, „WDH“ in Großbuchstaben im laufenden Training (`.lt-h span`, gegen die Vorliebe des Nutzers, von mir übersehen); keine eigenen Kategorien; kein Startbild beim Öffnen; alte CSS-Regeln, die weiter unten überschrieben werden, zusammenführen.
7. Daten nur auf dem Gerät, Sicherung von Hand: größtes Risiko.
Nur mit einer echten iPhone-App möglich: Apple Health (Gewicht, Läufe, Trainings automatisch), Mitteilungen ohne Server, Widgets, Timer auf dem Sperrbildschirm, Haptik, iCloud-Sicherung.

## Nächste Schritte
Vom Nutzer noch nicht entschieden (meine Vorschläge, nur auf Zuruf umsetzen):
- Finanzen: in der Zeile „Ohne Konto“ ein Knopf „Alle aufs Girokonto“ (bzw. auf das zuletzt benutzte Konto), damit man nicht jede Buchung einzeln antippen muss.
- Cardio: bei „Letzter Lauf“ im Vergleichstext zusätzlich die Strecke nennen, z. B. „(Heute, 7,0 km)“, weil „Heute“ bei zwei Läufen am selben Tag doppeldeutig ist.
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
