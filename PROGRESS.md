# Track. – Fortschritt

## Aktueller Stand
- Live ist v51 unter https://tnyjmp8sz8-jpg.github.io/Meine-App/ (Zweig `main`).
- Der Arbeitszweig der Sitzung und `main` sind gleich.
- Der Nutzer hat in dieser Sitzung erlaubt, getestete Änderungen direkt nach `main` zu veröffentlichen. In einer neuen Sitzung neu erfragen.
- Die App aktualisiert sich seit v24 selbst; der Nutzer prüft die Version an der Fußzeile.

## Erledigt
- v20–v29: Umzug ins Repository; dunkler, kompakter Look; Cloud-Code, Google-Schrift und Ton entfernt; Erinnerung an die Sicherung; GitHub Pages; Selbst-Aktualisierung; Versionshinweis; Gym nach Vorbild Alpha Progression („Letztes Mal“, Blatt der Übung mit Graph); iPhone-Fehler bei Datumsfeld, seitlichem Wischen und Fokus-Rahmen behoben.
- v30–v34: wachsende Listen nach Monaten gruppiert; Gym mit Monat/Jahr, Recap mit „Verbesserung“ gesamt und je Übung, „Einheiten“ eingeklappt; Pfeile im Training repariert.
- v35–v38: Bereich heißt „Finanzen“, App heißt „Track.“, Kopfzeile deckend, Finanzen mit Vermögen, Sparzielen, Sparquote.
- v39: Konten an Buchungen. Ausgaben, Einnahmen und feste Posten bekommen ein Konto; der Kontostand rechnet ab dem eingetragenen Stand von selbst weiter. Dazu Umbuchungen zwischen Konten und „Tag im Monat“ bei festen Posten.
- v40: Konten umbenennen (Name im Blatt „Stand eintragen“ ändern) und mit „+ Konto“ direkt beim Buchen anlegen; Konten ohne Stand erscheinen mit Hinweis. Tests liegen jetzt im Repository unter `tests/`.
- v41: Vergleich in Zeilen mit Wert (Letzter Lauf, Woche, Sparquote) wieder unter dem Wert statt daneben.
- v42: Fehler behoben, gemeldet vom Nutzer: Buchungen veränderten das Vermögen nicht. Zwei Ursachen: Ein Stand aus v38 (ohne Zeitpunkt) im laufenden Monat galt als Stand zum Monatsende; und neue Buchungen standen still auf „Kein Konto“. Jetzt ist das zuletzt benutzte oder das einzige Konto vorbelegt, bei mehreren Konten ohne Vorgeschichte fragt das Blatt nach.
- v51: Notizen auf Wunsch des Nutzers umgebaut zur schnellen Aufnahme: nur Text, jede mit Kreis, Abhaken löscht (mit „Rückgängig“), „+ Notiz“ öffnet nur ein Textfeld, Enter schließt ab; Notizen stehen auch auf Heute. Titel, Zeilen zum Abhaken und Anheften sind entfallen; alte Notizen werden übernommen.
- v50: Wiederkehrende Aufgaben (täglich, wöchentlich, monatlich) und Suche in den Notizen (Titel, Text, Zeilen zum Abhaken).
- v49: Aufgaben und Notizen im Bereich Routinen (Umschalter „Routinen / Aufgaben / Notizen“): Aufgaben mit Datum, Ordnern, Abhaken, Liegengebliebenes rutscht auf heute; Notizen mit Text, Zeilen zum Abhaken, Anheften, speichern von selbst; beides auf Heute, in der Sicherung und mit „Rückgängig“.
- v48: Punkt von „Track.“ in der Kopfzeile in Akzentblau.
- v47: Apple-Feinschliff, alle sieben Punkte: blaue Pfeile ohne Kreis, gefülltes Symbol für den aktiven Bereich, Linie oben erst beim Scrollen, einheitliche Strichstärken, leere Seiten mit Symbol und einem Satz, neues App-Symbol, große Zahl zählt beim Blättern.
- v46: Auf Wunsch des Nutzers zurückgenommen: Wochenleiste wieder in jedem Bereich, Monat/Jahr und Pfeile wieder in zwei Reihen, Kalender-Knopf in der Kopfzeile entfernt.
- v45: Aus der Durchsicht, Punkte 3, 6, 7: „Rückgängig“ nach jedem Löschen; eigene Kategorien („+ Kategorie“ im Blatt); Erinnerung an die Sicherung nach 7 statt 14 Tagen; Startbilder fürs iPhone.
- v44: Aus der Durchsicht, Punkte 1, 2, 4, 5: Zeitraum in einer Reihe und Wochenleiste nur auf Heute und Routinen (Kalender über Knopf in der Kopfzeile); Blätter nach unten wegziehen, zwischen Monaten wischen; Graphen ablesbar; Erklärungen hinter „i“; „kg“/„Wdh“ normal geschrieben.
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
- Blatt am Griff nach unten wegziehen (v44): fühlt es sich richtig an, ruckelt oder federt etwas? Scrollt ein langes Blatt weiter normal?
- Zwischen Monaten wischen (v44) in Finanzen und Training: löst es aus Versehen aus, wenn man nur scrollt?
- Graph antippen und mit dem Finger entlangfahren (v44): erscheint das Schild, scrollt die Seite senkrecht weiter?
- „Rückgängig“ nach dem Löschen (v45): liegt der Hinweis gut über der Leiste unten?
- Aufgaben und Notizen (v49): Schreibt es sich gut im Notiz-Blatt (Tastatur, Zoom, Zeilen zum Abhaken)? Trifft man den Kreis zum Abhaken gut? Passt die Reihe „Routinen / Aufgaben / Notizen“?
- „+ Notiz“ auf Heute (v51): Geht die Tastatur sofort auf? Schließt die Taste „Fertig“ der Tastatur ab? Das ist der Kern der 5 Sekunden und nur am Gerät zu sehen.
- Wiederkehrende Aufgabe abhaken (v50): Erscheint die nächste unter „Demnächst“? Suche in den Notizen: bleibt die Tastatur beim Tippen offen?
- Neues App-Symbol (v47): erscheint erst, wenn die App neu zum Home-Bildschirm hinzugefügt wird (vorher Sicherung speichern, danach einlesen).
- Gefüllte Symbole unten, blaue Pfeile, Linie oben erst beim Scrollen (v47): gefällt es am Gerät?
- Startbild (v45): wirkt wohl erst, wenn die App neu zum Home-Bildschirm hinzugefügt wird (vorher Sicherung speichern). Kein weißer Blitz mehr beim Öffnen?

## Durchsicht der ganzen App (nach v43, Wunsch des Nutzers: „Apple-like Produkt“)
- Punkt 1 („Inhalt zuerst“) hat der Nutzer abgelehnt und ist seit v46 zurückgebaut.
- Umgesetzt in v44 und v45: Wischgesten, Graphen ablesen, Erklärungen hinter „i“, kg/Wdh, Rückgängig, eigene Kategorien, Startbild, Erinnerung nach 7 Tagen.
- Bewusst nicht gemacht: „58,71 € pro Tag bis Monatsende“ bleibt sichtbar (ist eine Zahl, keine Erklärung), nur gekürzt.
- Noch offen: alte CSS-Regeln zusammenführen, die weiter unten überschrieben werden (rein intern, Risiko fürs Aussehen; nur mit Bildvergleich vorher/nachher).
- Nur mit einer echten iPhone-App möglich: Apple Health (Gewicht, Läufe, Trainings automatisch), Mitteilungen ohne Server, Widgets, Timer auf dem Sperrbildschirm, Haptik, automatische iCloud-Sicherung.

## Apple-Look
- Die sieben Punkte der Einschätzung nach v46 sind seit v47 umgesetzt (siehe Erledigt).
- Nicht machbar in der Web-App: Milchglas in der Kopfzeile (machte sie auf dem iPhone unscharf, v37), Haptik.
- Offen als Idee: großer Titel des Bereichs, der beim Scrollen in die Kopfzeile wandert (wie in Apple-Apps); vorher mit Bild fragen.

## Nächste Schritte
Vom Nutzer noch nicht entschieden (meine Vorschläge, nur auf Zuruf umsetzen):
- Aufgaben und Notizen, nächste Schritte (der Nutzer wollte erst alles sehen und sagt dann, was umgebaut wird):
  - Notizen: nach dem Abschließen gleich die nächste eintippen können (Blatt bleibt offen), falls er oft mehrere hintereinander notiert.
  - Suche auch in den Aufgaben; Wiederholung „werktags“ oder „alle zwei Wochen“.
  - Ordner umbenennen; Reihenfolge der Schnell-Knöpfe auf Heute (jetzt: Aufgabe, Notiz vorn).
  - Erledigtes: nur die letzten 50 werden gezeigt, ältere bleiben gespeichert. Später: nach Monaten gruppieren oder aufräumen.
  - Kalender der Aufgaben zeigt nur Vergangenes (Erledigtes), keine künftigen Termine.
  - Erinnerung mit Uhrzeit: gibt es nicht (Mitteilungen kann die Web-App nicht).
  - Tages-Check (Schlaf/Energie 1 bis 5 für die Zusammenhänge).
- Kategorien: eigene Kategorie umbenennen (Name antippen, wie beim Konto).
- Finanzen: Wochenleiste auch im Vermögen zeigen, damit beim Wechsel zu Budget nichts springt.
- Finanzen: in der Zeile „Ohne Konto“ ein Knopf „Alle aufs Girokonto“ (bzw. auf das zuletzt benutzte Konto), damit man nicht jede Buchung einzeln antippen muss.
- Cardio: bei „Letzter Lauf“ im Vergleichstext zusätzlich die Strecke nennen, z. B. „(Heute, 7,0 km)“, weil „Heute“ bei zwei Läufen am selben Tag doppeldeutig ist.
- Finanzen: Erinnerung auf Heute ab dem 25., wenn für den Monat noch kein Stand eingetragen ist.
- Finanzen: Umschalter für Schulden (negative Stände).
- Gym: „Stärkste Übung“ und „Schwächste Übung“ im Monats-Recap.
- Gym: „Training beenden“ als kleiner Knopf oben im laufenden Training.
- Gym: im laufenden Training anzeigen, ob ein Satz besser oder schlechter war als beim letzten Mal.
- Heute: Verbesserung im Gym in der Zeile „Training“ zeigen.
- Konkurrenz gründlich recherchieren (falls die App für andere gedacht wird).
