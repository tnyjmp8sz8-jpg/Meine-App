# Track. – Fortschritt

## Aktueller Stand
- App-Inhalt (`index.html`): live ist v63 unter https://tnyjmp8sz8-jpg.github.io/Meine-App/ (Zweig `main`). `node tests/alle.js` (zuletzt am 17.11. abends in neuer Sitzung): alle 349 Prüfungen stimmen (Ablauf 16, Aufbau 68, Gesten 21, Löschen und Kategorien 20, Aufgaben und Notizen 61, Finanzen 54, Gym 19, Monat und Kurzbefehl 30, Verbindung zur iPhone-Hülle 42, Speichern 8, Aktualisierung 10).
- iPhone-App: Auf dem iPhone des Nutzers läuft seit 17.11. Fassung 0.3 (gebaut bei Codemagic, Bau `6afc84f1596122e5a76e1a6e`; Download über das Release „iphone-test“). Am Gerät bestätigt durch sein Bildschirmfoto: Installation mit Widget ging, Daten sind geblieben, Knopf „Notiz“ im Widget öffnet das Blatt, Tastatur geht auf. Sein Befund: Das Blatt lag unter der Tastatur (im Widget-Weg und in der App). Dagegen v62 (Blätter rücken über die Tastatur; wirkt bei ihm, aber das Blatt sprang erst nach der Tastatur hoch) und v63 (Blatt sitzt schon beim Öffnen oben; Rückmeldung steht aus). Er will Eingabe ohne App als Popup: Anleitung für das Kurzbefehl-Symbol gegeben, Rückmeldung steht aus. Noch ohne Rückmeldung: Abhaken im Widget, Aktionen in Kurzbefehle, Mitteilungen, Zeile „gültig bis“ in der Fußzeile, Knopf für Health im Cardio-Bereich.
- Fassung 0.4 (17.11., Bau `6afc917da75d5e3c7cada188` bei Codemagic, Selbsttest bestanden, Bilder angesehen): Schnelleingabe aus dem Widget („Weg B“, von ihm gewählt), Startbild in der Farbe der App. Als Release „iphone-test“ bereitgestellt und ihm genannt; ob er installiert hat, ist offen.
- Der Nutzer will sein Claude-Abo widerrufen („das Limit reicht nicht“, 17.11.): Ihm die Wege genannt (Apple bzw. Support von Anthropic). Sparsam arbeiten: nur das Nötige, keine langen Wartezeiten mit vielen Abfragen.
- Zweige (geprüft am 17.11. abends): `main`, der Arbeitszweig der neuen Sitzung `claude/nifty-hamilton-gyakdi` und der alte `claude/app-entwicklung-verschieben-af0kew` standen beim Start alle auf demselben Stand (v63, iPhone-App 0.4). Keine offenen Pull Requests oder Issues. Der Bau der iPhone-App bei GitHub läuft nur auf `claude/…`-Zweigen und nur bei Änderungen unter `ios/`.
- Freigabe in der Sitzung vom 17.11. abends: „du hast alle berechtigungen“ und „arbeite solange bis fertig“ (er schläft). Gilt nur für diese Sitzung; in einer neuen Sitzung neu erfragen.
- Download der iPhone-App: Im Release „iphone-test“ liegt Fassung 0.4, gebaut bei GitHub (Lauf 16, Mac mit Intel, 17:59 UTC, 556.777 Byte, Selbsttest bestanden). Dieser Bau hat die zuvor von Codemagic bereitgestellte Datei ersetzt; beide stammen aus demselben Stand (`cd04e81`).
- Umgebung der Sitzung vom 17.11. abends: Es gibt nur noch die Umgebung „Default“ (neu angelegt, ohne erlaubte Adressen, ohne Schlüssel); „meine-app“ mit dem Schlüssel für Codemagic ist nicht mehr da. Folgen: `curl` an Codemagic und `node tests/live.js` werden abgelehnt. Ersatz für die Live-Prüfung: der Ablauf „pages build and deployment“ bei GitHub zum Commit auf `main`. Für einen Bau bei Codemagic müsste der Nutzer den Schlüssel neu eingeben; der Bau bei GitHub geht ohne.
- Wortwahl gegenüber dem Nutzer (17.11.): Er will „nur noch die richtige App“ und stolperte über „Web-App“ und „Hülle“. Ihm gegenüber „App“ für den Inhalt und „neue Installation“ für eine neue IPA sagen. Ihm erklärt, warum der Inhalt nicht neu in Swift geschrieben wird (Updates ohne neue Installation, kein sichtbarer Gewinn, nichts am Gerät prüfbar); er hat darauf noch nicht geantwortet.

## Laufender Auftrag (17.11.2026, abends): Oberfläche aufräumen
Wortlaut: „meine app muss cleaner aussehen; da ist noch zu viel zu unübersichtlich aber ich mag alle funktionen überleg dir was wie alles enthalten bleibt aber auf den ersten blick übersichtlich bleibt und baue es bis es fertig ist. überprüfe dich selbst ob es passt und passe gegebenenfalls an“.
- Vorgehen: Bilder aller Ansichten gemacht (am vollsten: Heute, Budget, Cardio); drei unabhängige Entwürfe mit Probebildern; daraus ein Plan; Umbau Bereich für Bereich mit Tests und Bildvergleich vorher/nachher.
- Grenzen aus früheren Rückmeldungen: Wochenleiste bleibt überall, Bedienreihen bleiben eigene Reihen, Notizen auf Heute oben, nichts zusammenquetschen, keine Funktion entfernen.
- Gewählt (18.11. nachts): Entwurf „Erst das Wichtigste, der Rest eingeklappt“. Regel: Arbeitslisten offen (Notizen, Aufgaben, Routinen, Pläne, Konten, Sparziele, Kategorien), Verläufe und Stammdaten als eine Zeile mit Anzahl (Einträge, Ausgaben, Einnahmen, Fixkosten, Läufe, Monate, Umbuchungen); „Hinzufügen“ als kleines Plus rechts in der Überschrift; Heute als Kurzfassung (eine Zeile je Notiz und Aufgabe, Routinen ohne Wochenpunkte, „Sicherung“ als Zeile am Ende); Aufgeklapptes klappt beim Wechsel des Bereichs wieder zu. Die anderen beiden Entwürfe („Ruhe ohne Umbau“, „Vorbild Apple“) brachten weniger oder griffen Vertrautes an (große Knöpfe, Kacheln, Füllung der Routinen).
- Stand: Entwurf liegt auf dem Arbeitszweig in `index.html` (noch v63, nicht veröffentlicht), alle 349 Prüfungen stimmen. Als Nächstes: Klappzeilen im Code vereinheitlichen, eigene Tests dazu, Fehler aus dem Abgleich beheben, Bilder prüfen, dann v64.
- Abgleich Code gegen Projektwissen (17.11. abends, 54 bestätigte Befunde): Liste liegt nur in der Sitzung; was nicht behoben wird, kommt unter „Offene Probleme“.

## Vorheriger Auftrag (17.11.2026): iPhone-App
Wortlaut: „wenn sicherung fällig ist / ich will widget und health verbindung wie in echter app / läufe automatisch eintragen“, „baue alles ein und finde die beste lösung für health“, „jetzt alles starten“. Meine Annahmen (ihm noch zu nennen): Läufe kommen als Lauf-Trainings aus Health; das Widget zeigt den heutigen Tag.

Dazu am 17.11.: „füge jetzt health verbindung erstmal für läufe wie in echter app und die möglichkeit auf widgets / mir wichtig sind vor allem meine notizen die ich direkt sehen kann und vll button für ausgabe tracken ohne dass sich app öffnet / genauso notiz hinzufügen ohne dass sich app öffnet oder abhaken können“. Gebaut in v61 und Fassung 0.3: Widget „Notizen“ mit Abhaken; Aktionen „Notiz hinzufügen“, „Ausgabe eintragen“, „Lauf eintragen“ für Kurzbefehle. Ihm gesagt: Ein Widget kann keine Tastatur zeigen; Eintippen ohne App geht über ein Kurzbefehl-Symbol auf dem Home-Bildschirm. Health direkt geht nur, wenn seine Installation die Freigabe trägt (erwartet: nein); sonst Automation in Kurzbefehle mit „Lauf eintragen“, die wir zusammen anlegen, sobald er zeigt, was „Health-Proben suchen“ bei ihm anbietet.

Gebaut in v60 und Fassung 0.2 (Einzelheiten in `CLAUDE.md`):
- Mitteilung „Sicherung fällig“: am Tag der Fälligkeit um 18 Uhr, danach alle drei Tage, ohne Ton. Dazu ungefragt, aber aus gutem Grund: Mitteilung einen Tag bevor die App abläuft (falls das Erneuern einmal nicht klappt), und in der Fußzeile „iPhone-App 0.2 · gültig bis …“ (daran sieht er, ob das Erneuern läuft). Ihm sagen.
- Widget „Heute“, klein und mittel: Ring mit Routinen erledigt/geplant, offene Aufgaben; mittel dazu bis zu vier Zeilen (Aufgaben, dann neueste Notizen). Das Bild aus dem Simulator ist sein Vorschaubild: zeigen, bevor er installiert.
- Health: Die App liest aus ihrem Profil, ob die Installation die Freigabe für Health trägt. Nur dann erscheint im Cardio-Bereich „Läufe aus Health übernehmen“. Erwartung: Bei AltStore mit kostenloser Apple-ID fehlt die Freigabe, der Knopf erscheint nicht. Dann Ausweg bauen (zweite Runde): Kurzbefehl, der Lauf-Trainings aus Health liest und an die App übergibt (Auslöser „Track. wird geöffnet“ oder „Training endet“), am besten über eine eigene Aktion der App für Kurzbefehle (läuft im Hintergrund); die Adresse `trackpunkt://lauf?km=…&min=…&puls=…` ist schon eingebaut. Vorher von ihm klären lassen (Bildschirmfoto): Bietet „Health-Proben suchen“ in seiner Kurzbefehle-App die Art „Trainings“ an? Die Suche im Netz war dazu widersprüchlich. Und: Womit zeichnet er Läufe auf (Apple Watch, andere Uhr, App)?
- Antworten des Nutzers (17.11.): Läufe zeichnet er mit der Apple Watch auf, sie liegen in Apple Health. Kurzbefehle („Trainings“ in „Health-Proben suchen“) sieht er später nach; Widget besprechen wir später (Entwurfsbild hat er bekommen).
- Bau: Bei GitHub gab es am 17.11. ab etwa 15 Uhr UTC über eine Stunde keinen freien Mac. Auf Wunsch des Nutzers („alles machen für Codemagic“) läuft der Bau jetzt über Codemagic; er hat dort ein Konto angelegt und den Zugangsschlüssel über das sichere Formular gegeben, das Projekt habe ich über die Schnittstelle angelegt. Einzelheiten in `CLAUDE.md` unter „Bau“.
- Risiken, die er kennen muss: Nichts davon ist am Gerät geprüft. Ob AltStore eine IPA mit Widget und Freigaben sauber installiert und dabei die Daten bleiben, zeigt erst der Versuch; vorher Sicherung speichern lassen. Beim Installieren fragt AltStore wohl, ob Erweiterungen bleiben sollen: „Keep App Extensions“ wählen, sonst fehlt das Widget.

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
- v56: Auf Wunsch des Nutzers entfernt: das Tempo (km/h) beim Laufband und die Schnell-Knöpfe „Aufgabe“, „Lauf“, „Einnahme“. Auf Heute bleiben Notiz, Gewicht, Ausgabe; im Blatt schaltet man oben zwischen Ausgabe und Einnahme um. Alte Laufband-Läufe mit Tempo behalten ihre Zahlen.
- v57–v58: Tages-Check (Schlaf bewerten) zur Probe eingebaut und auf Wunsch des Nutzers wieder ganz entfernt. Bewertungen, die er eingetragen hat, fallen beim nächsten Speichern weg.
- v59: Monatsabschluss: Ansicht „Monat“ auf Heute (neben Heute und Woche) mit Vergleich zum Vormonat; in den ersten sieben Tagen des Monats ein Hinweis „… ist abgeschlossen · Rückblick“. Kurzbefehl: Adresse mit `?neu=ausgabe`, `?neu=notiz`, `?neu=gewicht` öffnet die App mit dem Blatt, auch ohne Netz.
- v60–v61 mit iPhone-App 0.2 und 0.3: Verbindung zwischen App-Inhalt und iPhone-Teil; Mitteilungen (Sicherung fällig, App läuft ab); Widgets „Heute“ und „Notizen“ (mit Abhaken); Aktionen für Kurzbefehle (Notiz, Ausgabe, Lauf); Health-Probe; Bau über Codemagic.

## Offene Probleme
- Die Tests laufen im Test-Browser und im Simulator; am echten iPhone prüft nur der Nutzer. Dort bestätigt: Die iPhone-App startet, die Sicherung lässt sich einlesen, die Automation zum Erneuern läuft durch.
- Offen am iPhone: ob das Erneuern nach einigen Tagen von selbst geklappt hat (Zähler in AltStore wieder bei 7); ob eine neue IPA die alte ersetzt, ohne dass Daten verloren gehen; ob die Hülle neue Versionen der Web-App von selbst holt (zeigt sich mit v60).
- Der Gesten-Test ist zeitempfindlich: In einem vollen Lauf schlug „nach rechts: Vormonat“ einmal fehl (Wisch dauerte unter Last länger als die erlaubten 0,7 s), danach lief er viermal durch. Bei einem einzelnen Fehlschlag dort: einzeln wiederholen, bevor man einen Fehler in der App sucht.
- Negative Kontostände lassen sich speichern, aber auf dem iPhone nicht eintippen (Zahlentastatur ohne Minus).
- Feste Posten, deren Tag im Monat des eingetragenen Stands schon vorbei ist, zählen erst ab dem Folgemonat (gewollt: Sie stecken schon im Stand).
- Buchungen, die der Nutzer vor v42 ohne Konto eingetragen hat, zählen nicht, bis er das Konto nachträgt (Zeile „Ohne Konto“ im Vermögen).
- `healBal()` wird nur für Stände aus v38 gebraucht und wirkt nur im Monat des Stands (November 2026). Ab Dezember 2026 kann die Funktion samt ihrer Prüfung entfernt werden.
- Unter dem Symbol auf dem Home-Bildschirm steht noch „Takt“ und das alte Symbol, bis der Nutzer die App neu hinzufügt (vorher Sicherung speichern, danach einlesen, erst dann das alte Symbol löschen). Auch Startbild und neues Symbol wirken erst dann.
- Erledigte Aufgaben: gezeigt werden die letzten 50, ältere bleiben gespeichert.
- Alte CSS-Regeln, die weiter unten überschrieben werden, sind noch nicht zusammengeführt (rein intern; nur mit Bildvergleich vorher/nachher anfassen).

## Am iPhone noch zu prüfen (Rückmeldung des Nutzers steht aus)
- Kurzbefehl für die Web-App (v59, `webapp://…/?neu=ausgabe`): nie rückgemeldet und mit der iPhone-App überholt; dort ginge es später sauber über eine eigene Adresse `track://`. Die Auswertung von `?neu=` in der Web-App kann bleiben, sie stört nicht.
- Monatsabschluss (v59): Passt der dritte Umschalter „Monat“? Erscheint am Monatsanfang der Hinweis?
- Ausgabe/Einnahme (v56): Ist der Umschalter oben im Blatt gut zu sehen? Geht die Tastatur beim Betrag weiter sofort auf?
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
- Automatisierungen (der Nutzer fragte danach, v58; ihm als Liste genannt, noch nichts gewählt): Monatsabschluss und Kurzbefehl sind gebaut (v59). Noch offen: Kategorie und Konto aus der Notiz einer Buchung vorbelegen (mein Favorit); Routine von selbst abhaken, wenn ein Lauf oder ein Gym-Training eingetragen wird; wiederkehrende Ausgaben erkennen und als festen Posten vorschlagen; Sicherung beim Öffnen anbieten, sobald sie fällig ist.
- iPhone-App nach dem laufenden Auftrag: Track warnt selbst zwei Tage vor Ablauf (Datum steht im Profil der App); Kurzbefehle über `track://` (z. B. Ausgabe eintragen); Daten zusätzlich in der Hülle spiegeln, damit sie nicht allein am Speicher der Web-Ansicht hängen.
- Laufband: Feld „Steigung“ auch entfernen, falls der Nutzer es nicht braucht (nachgefragt in v56, noch ohne Antwort).
- Schnell-Knopf „Ausgabe“ in „Buchung“ umbenennen, falls er das klarer findet (nachgefragt in v56, noch ohne Antwort).
- Kategorien: eigene Kategorie umbenennen (Name antippen, wie beim Konto).
- Finanzen: Wochenleiste auch im Vermögen; Knopf „Alle aufs Girokonto“ in der Zeile „Ohne Konto“; Erinnerung auf Heute ab dem 25., wenn für den Monat noch kein Stand eingetragen ist; Umschalter für Schulden (negative Stände).
- Cardio: bei „Letzter Lauf“ im Vergleichstext zusätzlich die Strecke nennen, weil „Heute“ bei zwei Läufen am selben Tag doppeldeutig ist.
- Gym: „Stärkste“ und „Schwächste Übung“ im Monats-Recap; „Training beenden“ als kleiner Knopf oben im laufenden Training; im laufenden Training zeigen, ob ein Satz besser oder schlechter war als beim letzten Mal; Verbesserung im Gym in der Zeile „Training“ auf Heute.
- Apple-Look: großer Titel des Bereichs, der beim Scrollen in die Kopfzeile wandert.
- Mit der iPhone-App grundsätzlich möglich geworden (noch nicht gebaut): Erinnerungen mit Uhrzeit (z. B. offene Routinen am Abend), Timer auf dem Sperrbildschirm, Haptik.
- Konkurrenz gründlich recherchieren (falls die App für andere gedacht wird).
