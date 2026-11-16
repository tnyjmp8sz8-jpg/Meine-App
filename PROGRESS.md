# Track. – Fortschritt

## Aktueller Stand
- Live ist v55 unter https://tnyjmp8sz8-jpg.github.io/Meine-App/ (Zweig `main`).
- Der Arbeitszweig der Sitzung (`claude/app-entwicklung-verschieben-af0kew`) und `main` sind gleich, nichts liegt nur im Arbeitsordner.
- Der Nutzer hat in dieser Sitzung erlaubt, getestete Änderungen direkt nach `main` zu veröffentlichen. In einer neuen Sitzung neu erfragen.
- Die App aktualisiert sich seit v24 selbst; der Nutzer prüft die Version an der Fußzeile.
- `node tests/alle.js`: alle 264 Prüfungen stimmen (Ablauf 12, Aufbau 66, Gesten 21, Löschen und Kategorien 20, Aufgaben und Notizen 61, Finanzen 48, Gym 19, Speichern 8, Aktualisierung 8).
- Keine beauftragte Arbeit offen. Der Nutzer wartet auf nichts; die nächsten Schritte bestimmt er.

## Erledigt
- v20–v43: Umzug ins Repository; dunkler, kompakter Look; GitHub Pages; Selbst-Aktualisierung; Gym nach Vorbild Alpha Progression; Monat/Jahr und Recap im Gym; App heißt „Track.“, Bereich „Finanzen“; Vermögen, Sparziele, Sparquote; Konten an Buchungen, Umbuchungen, Zeile „Ohne Konto“; Tests im Repository; Fehler behoben, dass Buchungen das Vermögen nicht veränderten (v42).
- v44–v45: Blätter nach unten wegziehen, zwischen Monaten wischen, Graphen ablesen, Erklärungen hinter „i“, „Rückgängig“ nach dem Löschen, eigene Kategorien, Erinnerung an die Sicherung nach 7 Tagen, Startbilder.
- v46: Auf Wunsch des Nutzers zurückgenommen: Wochenleiste wieder in jedem Bereich, Monat/Jahr und Pfeile wieder in zwei Reihen.
- v47–v48: Apple-Feinschliff (blaue Pfeile ohne Kreis, gefülltes Symbol für den aktiven Bereich, Linie oben erst beim Scrollen, leere Seiten mit Symbol, neues App-Symbol, große Zahl zählt beim Blättern); Punkt von „Track.“ in Blau.
- v49: Aufgaben und Notizen im Bereich Routinen (Umschalter „Routinen / Aufgaben / Notizen“), Ordner, beides auf Heute, in der Sicherung, mit „Rückgängig“.
- v50: Wiederkehrende Aufgaben (täglich, wöchentlich, monatlich); Suche in den Notizen.
- v51: Notizen umgebaut zur schnellen Aufnahme: nur Text, jede mit Kreis, Abhaken löscht; „+ Notiz“ öffnet nur ein Textfeld. Titel, Zeilen zum Abhaken und Anheften entfallen; alte Notizen werden übernommen.
- v52: Noch kompakter: große Zahl 44 → 34 px, blaue Knöpfe 44 → 40 px, Zeilen, Überschriften, Umschalter, Kacheln, Listen und Abstände je eine Stufe kleiner. Wochenleiste, Leiste unten, Eingabefelder unverändert.
- v53: Notizen auf Heute ganz oben (vor Routinen); Ecken der Karten 16 statt 20 px.
- v54: Kacheln ohne Wert (Strich) werden nicht mehr gezeigt; der Bereich heißt unten „Planer“; nach Enter bleibt das Notiz-Blatt offen für die nächste Notiz.
- v55: Kennfarben der Bereiche auch am Plus der Schnell-Knöpfe auf Heute und am Symbol der leeren Seiten (nach Vorschaubild vom Nutzer gewählt: „genauso umsetzen“).

## Offene Probleme
- Nichts ist auf einem echten iPhone getestet; alle Prüfungen laufen im Test-Browser.
- Der Gesten-Test ist zeitempfindlich: In einem vollen Lauf schlug „nach rechts: Vormonat“ einmal fehl (Wisch dauerte unter Last länger als die erlaubten 0,7 s), danach lief er viermal durch. Bei einem einzelnen Fehlschlag dort: einzeln wiederholen, bevor man einen Fehler in der App sucht.
- Negative Kontostände lassen sich speichern, aber auf dem iPhone nicht eintippen (Zahlentastatur ohne Minus).
- Feste Posten, deren Tag im Monat des eingetragenen Stands schon vorbei ist, zählen erst ab dem Folgemonat (gewollt: Sie stecken schon im Stand).
- Buchungen, die der Nutzer vor v42 ohne Konto eingetragen hat, zählen nicht, bis er das Konto nachträgt (Zeile „Ohne Konto“ im Vermögen).
- `healBal()` wird nur für Stände aus v38 gebraucht und wirkt nur im Monat des Stands (November 2026). Ab Dezember 2026 kann die Funktion samt ihrer Prüfung entfernt werden.
- Unter dem Symbol auf dem Home-Bildschirm steht noch „Takt“ und das alte Symbol, bis der Nutzer die App neu hinzufügt (vorher Sicherung speichern, danach einlesen, erst dann das alte Symbol löschen). Auch Startbild und neues Symbol wirken erst dann.
- Erledigte Aufgaben: gezeigt werden die letzten 50, ältere bleiben gespeichert.
- Alte CSS-Regeln, die weiter unten überschrieben werden, sind noch nicht zusammengeführt (rein intern; nur mit Bildvergleich vorher/nachher anfassen).

## Am iPhone noch zu prüfen (Rückmeldung des Nutzers steht aus)
- „+ Notiz“ auf Heute (v51, v54): Geht die Tastatur sofort auf? Legt die Eingabetaste die Notiz an und bleibt das Feld für die nächste offen? Daran hängen die „5 Sekunden“.
- Größen (v52): Ist alles klein genug, oder ist etwas zu klein zum Lesen oder Treffen? Trifft man den Kreis zum Abhaken gut?
- Farben (v55): Wirkt das farbige Plus in den Schnell-Knöpfen, oder ist es zu klein?
- Blatt am Griff nach unten wegziehen (v44): fühlt es sich richtig an? Scrollt ein langes Blatt weiter normal?
- Zwischen Monaten wischen (v44): löst es aus Versehen aus, wenn man nur scrollt?
- Graph antippen und entlangfahren (v44): erscheint das Schild, scrollt die Seite senkrecht weiter?
- „Rückgängig“ nach dem Löschen (v45): liegt der Hinweis gut über der Leiste unten?
- Wiederkehrende Aufgabe abhaken (v50): erscheint die nächste unter „Demnächst“? Suche in den Notizen: bleibt die Tastatur beim Tippen offen?
- Rechnet das Vermögen nach einer Ausgabe oder Einnahme mit (v42)? Ist im Blatt das Konto schon blau gewählt?
- Ältere Punkte ohne Rückmeldung: Datumsfeld bei „Einheit ändern“, Monatsfeld im Blatt „Stand eintragen“, Konto-Chips bei mehreren Konten, Kontoname ändern, Kopfzeile bleibt beim Scrollen scharf.
- Bestätigt durch Fotos des Nutzers (v51): Kopfzeile, Wochenleiste, blaue Pfeile, gefülltes Symbol unten, blauer Punkt sehen am Gerät aus wie im Test-Browser.

## Nächste Schritte
Der Nutzer entscheidet. Meine offenen Vorschläge (nur auf Zuruf umsetzen; bei Änderungen am Aufbau erst ein Bild zeigen):
- Aufgaben und Notizen: Suche auch in den Aufgaben; Wiederholung „werktags“ oder „alle zwei Wochen“; Ordner umbenennen; Kalender der Aufgaben zeigt nur Erledigtes, keine künftigen Termine.
- Tages-Check (Schlaf oder Energie mit einem Tipp, 1 bis 5), der die „Zusammenhänge“ in der Wochenansicht füttert.
- Kategorien: eigene Kategorie umbenennen (Name antippen, wie beim Konto).
- Finanzen: Wochenleiste auch im Vermögen; Knopf „Alle aufs Girokonto“ in der Zeile „Ohne Konto“; Erinnerung auf Heute ab dem 25., wenn für den Monat noch kein Stand eingetragen ist; Umschalter für Schulden (negative Stände).
- Cardio: bei „Letzter Lauf“ im Vergleichstext zusätzlich die Strecke nennen, weil „Heute“ bei zwei Läufen am selben Tag doppeldeutig ist.
- Gym: „Stärkste“ und „Schwächste Übung“ im Monats-Recap; „Training beenden“ als kleiner Knopf oben im laufenden Training; im laufenden Training zeigen, ob ein Satz besser oder schlechter war als beim letzten Mal; Verbesserung im Gym in der Zeile „Training“ auf Heute.
- Apple-Look: großer Titel des Bereichs, der beim Scrollen in die Kopfzeile wandert.
- Nicht machbar in der Web-App, nur mit einer echten iPhone-App: Apple Health, Mitteilungen und Erinnerungen mit Uhrzeit, Widgets, Timer auf dem Sperrbildschirm, Haptik, automatische iCloud-Sicherung, Milchglas in der Kopfzeile.
- Konkurrenz gründlich recherchieren (falls die App für andere gedacht wird).
