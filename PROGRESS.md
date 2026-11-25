# Track. – Fortschritt

## Aktueller Stand
- App-Inhalt (`index.html`): v122 (25.11.2026) unter https://tnyjmp8sz8-jpg.github.io/Meine-App/ (Zweig `main`). `node tests/alle.js` (v122): alle 16 Reihen stimmen (Gym 226, Hülle 169, Klappzeilen 159, Aufbau 78). Mit gestellter Uhr zuletzt geprüft (Gym): 1.1.2027 (v114).
- v122 (25.11., seine Meldung: „ich kann die Uhrzeit immer noch nicht anpassen“): Sein Fall mit seinen echten Plänen nachgestellt (Training über „Training starten“ mit Reserve, „Ändern“ aus dem Rückblick, Dauer 75 min): im Test-Browser und in WebKit gespeichert, kein Fehler. Gefunden und behoben, jeder Punkt führt für sich zu „nichts geändert“: „Speichern“ lag bis zu 1400 px unter dem Feld (jetzt fest am unteren Rand des Blatts, auch über der Tastatur); das Kreuz schloss ohne Hinweis (jetzt erst Hinweis); Tippen hängte an den alten Wert an (jetzt wird ersetzt). Gilt auch für „Plan bearbeiten“. Am Gerät nicht belegt, dass es daran lag: Geht es weiter nicht, eine Bildschirmaufnahme erbitten (Kontrollzentrum, Aufnahme-Knopf) und fragen, was genau passiert.
- v121 (25.11., seine Antwort auf das Bild von v120: „so ist gut, aber nimm Helligkeit etwas raus, ist zu auffällig“): Form, Auslaufen und die zwei Stufen sind damit von ihm bestätigt. Helligkeit der Streifen und des auslaufenden Rests mal 0,65 (leise Stufe mal 0,78): am Rand 93 statt 126 von 255, leise 55 statt 66; in WebKit und Chromium gemessen, oben wie unten gleich.
- v120 (25.11., derselbe Auftrag: „arbeite so lange und überprüfe dich, bis es überall gut und stimmig aussieht“): Die App mit WebKit gezeichnet (WebKitGTK 2.52, derselbe Kern wie Safari; neu: `tests/webkit.py`). Ergebnis: Das Auslaufen an der Ecke zeichnet WebKit wie Chromium. Gefunden und behoben: In WebKit war der Streifen von v119 an Karten oben einen Bildpunkt zu dünn, und eine Schicht oben 4 und unten 2 Bildpunkte dick (WebKit rechnet in 1/64 px und rundet ab); die Versätze sind jetzt dagegen abgesichert. Nachgemessen in WebKit an Leiste, Kachel und Karte, oben wie unten: 126, 95, 68, 38, 34, 32, 29, 27 (Apple 125, 94, 67, 38, 34, 32, 29, 27). Alle Bereiche und Blätter durchsucht: kein volles Licht in vollem Licht, keines in Blättern, kein Rand an einer Fläche mit Kante. Im Bild durchgesehen: alle Bereiche, Woche, Jahr, Kalender, Einstellungen, alle Blätter, laufendes Training, leer, 320 px, hell. Die graue Kante am aktiven Eingabefeld ist 1 px statt 1,5.
- v119 (25.11., sein Bildschirmfoto vom Gym mit v118: „es ist immer noch zu viel, prüfe dein eigenes Bild; bei Apple geht es kaum um die Kante, es läuft schon vorher aus; passe das überall an, es sieht unfertig aus … clean, modern, funktional und schön“): An seinem Bild gemessen: Der gerade Rand stimmt am iPhone genau (126, 95, 68, 38 gegen Apples 125, 94, 67, 38). Falsch war die Ecke: Bei uns blieb der Streifen um die ganze Rundung hell, am Dock fällt er dort sofort ab. Dazu trug jedes Bedienteil dasselbe volle Licht. Jetzt: Der Streifen läuft vor der Ecke aus; volles Licht nur an Leiste, Blättern, Hinweis, runden Knöpfen oben und Karten der Seite; Chips, Umschalter, Nebenknöpfe, Felder, Linsen und alles in Blättern tragen eine leise Stufe (rund halb so hell), in Blättern ohne den auslaufenden Rest. Alle Bereiche und Blätter dunkel und hell im Bild durchgesehen (hell unverändert). Tote Variablen gestrichen, `tests/bilder.js` läuft wieder ohne Fehler. Am iPhone ungeprüft: Bild erbeten.
- v118 (25.11., seine zwei Bilder: Dock von iOS neben der Kachel „Trainingszeit“ der App mit v117: „immer noch nicht gleich … Farbverlauf bei den Glas-Dingern rausnehmen, 1 zu 1 wie bei dem Apple-Bild“): Beide Bilder ausgemessen. Gefunden: (1) Der helle Streifen lag an fast allen Flächen 1 px zu weit innen, weil sie einen durchsichtigen Rand hatten (davor ein Streifen Fläche, in seinem Bild messbar); (2) der Verlauf in den Karten aus v116; (3) der Streifen war in halben Punkten gebaut und am iPhone unscharf; (4) der auslaufende Rest fehlte an einigen Kacheln und lief gerade statt wie bei Apple aus. Jetzt: alle Flächen einfarbig wie das Dock (17 von 255), kein Rand mehr, Streifen in Dritteln eines Punkts, Rest nach Messung. Im Test-Browser an Leiste und Karte 125, 94, 67, 38, 34, 32, 29, 27 wie bei Apple. Folge: Flächen ohne Rand sind 2 px niedriger (Zeilen, Eingabefelder); alle Tests stimmen. Am iPhone ungeprüft: Bild erbeten.
- v117 (25.11., seine Meldung: „wenn ich Trainingszeit ändern will, stürzt es ab, geht nicht“; auf Nachfrage: im Blatt „Einheit ändern“, „Blatt geht zu, nichts geändert“): Im Test-Browser ging es auf allen Wegen (Liste, Kalender, Rückblick; auch mit nachgebildeter iPhone-App). Erklärung, sehr wahrscheinlich, am Gerät nicht belegt: Die Zahlentastatur hat keine Taste zum Schließen; ein Tipp neben das Blatt oder das Wegziehen schloss das Blatt samt Eingabe. Jetzt bleiben „Einheit ändern“ und „Plan bearbeiten“ bei ungespeicherten Änderungen offen und sagen „Noch nicht gespeichert“. Ihn um Rückmeldung bitten, ob es damit geht; wenn nicht, Bildschirmaufnahme erbitten.
- Die Sitzung vom 25.11. hat v106 bis v116 und die iPhone-App 1.2 gebracht (je Version eine Zeile unter „Erledigt“; die Regeln dazu stehen in `CLAUDE.md` und `BEREICHE.md`). Sie war sehr lang: Für das nächste Thema eine neue Sitzung beginnen.
- v116 (25.11., sein Auftrag zu zwei Bildschirmfotos von Dock und Kalender-Widget in iOS 26: „das Glas sieht immer noch nicht gleich aus … bei Bars ist Hintergrund gleiche Farbe, oben und unten heller Streifen gleich hell, an Seite dunkel; beim Widget Streifen gleich, aber Hintergrund mit Verlauf … genauso wie iOS, zur Not google … danach alles vermerken, für nächsten Chat bereit machen“): Seine Bilder ausgemessen und im Test-Browser in dreifacher Schärfe nachgemessen. Leiste jetzt 123, 95, 68, 38 an der Kante gegen Apples 125, 93, 69, 38, Fläche 17 wie bei Apple, an der Seite kein Streifen. Karten tragen den Verlauf des Widgets (oben heller, unten dunkler) und dieselben Streifen. Apples Richtlinien dazu gesucht und gefunden (Zusammenfassung in `CLAUDE.md`, „Design-Regeln“): Sie nennen keine Maße. Hell und dunkel im Bild geprüft. Am iPhone ungeprüft.
- Gym, Stand in Kürze: Empfehlung je Satz (Bereich 8–12 je Übung, erster Satz führt, Gewicht steigt bei 12 für alle Sätze, Abfall von Satz zu Satz wird aus seinen Einheiten gelernt, Reserve 0 bis 4+ nach jedem Satz), Drop- und Supersätze im Plan, Schritt je Übung, Einheit nachträglich ändern (mit Dauer) und am selben Tag weiter trainieren, Übung hinzufügen nach Gruppen. Neuanfang: nur Einheiten ab 23.11.2026 (v112; Kopie der alten auf seinem iPhone in `takt.gymAlt`).
- iPhone-App: Im Release „iphone-test“ liegt 1.2 (gebaut 25.11., Lauf 28 bei GitHub, Selbsttest bestanden): Widget „Überblick“ mit Zahlen, Kategorien beim Bezahlen wieder im Stand (Fehler seit 0.9: `kats` und `haendler` fehlten in `stand.json`), Mitteilung „Pause vorbei“ entfernt. Bei ihm läuft 1.1 oder älter (seine Antwort vom 25.11.; zuletzt im Bild belegt: 0.9, gültig bis 30.11.). Nach der Installation fügt er das Widget „Überblick“ selbst hinzu.
- Apple Pay (offen): Seine Meldung vom 25.11.: Es kommt nach einer Zahlung gar nichts an. Das Merken der Händler gibt es seit v69 (`katVon()`), es setzt voraus, dass die Ausgabe mit dem Händler als Notiz ankommt. Vermutung (unbelegt): Seine Automation übergibt noch die ganze „Kurzbefehleingabe“ als Betrag (Stand seines Bildes vom 23.11.: Betrag = „Kurzbefehleingabe“, Notiz leer, Kategorie „Apple Pay“, Konto „Trade Republic“), dann scheitert die Aktion still. Ihm geraten: 1.2 installieren, die Aktion einmal von Hand testen (Betrag 1, Notiz „Test“), Bildschirmfotos der Automation und des Ergebnisses schicken. Richtig wäre: Betrag = „Betrag“, Notiz = „Händler“, Kategorie leer, Konto wie in der App. Nichts bauen, bis sein Fall belegt ist.
- Entwickler-Konto: Er fragte am 25.11. selbst, was es bringt und ob damit mehrere Apps gehen. Beantwortet (kein Ablauf nach 7 Tagen, Health direkt, beliebig viele Apps, Updates über TestFlight; 99 € im Jahr, neue Installation mit Umzug über die Sicherung). Entscheidung steht aus; nicht drängen.
- Am Gerät belegt: Die App holt neue Versionen von selbst (v108 und v110 in seinen Bildern vom 25.11.); Zahnrad, großer Titel, Licht hinter der Seite, Linse in der Leiste, Empfehlung und Frage nach der Reserve im echten Training. Er benutzt inzwischen auch Finanzen und Arbeit. Die Sicherung läuft von selbst (ein Ordner ist gewählt). Sein Ziel beim Gewicht ist Zunehmen (90,0 → 93,0 kg). Widget „Notizen“ läuft.
- Kurzbefehle bei ihm: Erneuern beim Anstecken (läuft), „Lauf merken“ (belegt 23.11.), „Läufe übernehmen“ (am 23.11. angelegt: Auslöser „Track. geöffnet“, „Lauf-Zeitraum“, Suche Strecke, Suche Heart Rate, „Lauf eintragen“; ob Strecke und Puls ankommen, zeigt sein nächster Lauf), Apple Pay (siehe oben). Für das Krafttraining von der Uhr (seit 1.0) hat er die zwei Schritte noch nicht angelegt (`IPHONE.md`, Vertrag).
- Sparsam arbeiten: Regeln in `CLAUDE.md` unter „Zusammenarbeit“; er nimmt für alles „hoch“.
- Zweige: `main` ist der Standardzweig, eine neue Sitzung beginnt dort. Keine offenen Pull Requests oder Issues. Veröffentlichen nach `main` ist dauerhaft erlaubt.
- Umgebung: „Default“. `node tests/live.js` geht dort nicht (Pages-Adresse nicht erlaubt); Ersatz: der Lauf „pages build and deployment“ bei GitHub (`actions_list`). Für Codemagic müsste eine Umgebung neu angelegt werden (`IPHONE.md`, „Bau“); GitHub braucht das nicht. Die Suche im Netz (WebSearch) geht.

## Gesammelte Wünsche (nur gemerkt, nichts gebaut; auf sein Zeichen alles in einem Zug)
- Zurzeit keiner.

## Offene Vorschläge (nichts davon gebaut; nur auf Zuruf)
Auf seine Frage vom 25.11. („was noch hinzufügen alles?“) vorgeschlagen, die Einstellungen sind mit v110 gebaut, offen sind:
- Aufwärmsätze vor dem ersten Satz vorschlagen; leichtere Woche vorschlagen, wenn mehrere Übungen über Wochen fallen; Wochenrückblick als Mitteilung am Sonntag (iPhone-App).
Auf seine Frage „was würdest du jetzt noch ändern oder hinzufügen mit wirklich mehrwert?“ (18.11.):
1. Zuerst das Gebaute am iPhone zum Laufen bringen (0.6, Kurzbefehle, Ordner für die Sicherung).
2. (erledigt mit v80: Zeilen für Arbeit und Uni auf Heute)
3. Eine Rechenkante beheben (siehe „Offene Probleme“: neues Konto zählt als Plus).
4. Entwickler-Konto von Apple: „erstmal nicht“ (23.11.). Nicht mehr vorschlagen.
Bewusst nicht: weitere Felder, weitere Graphen, Bankanbindung, tägliche Abfragen.

Gym-Teil (sein Maßstab seit 24.11.: bei jeder Funktion, die er möchte, besser als Alpha Progression; die Liste bestimmt er). Mit v85 gebaut: Punkt, Vorgabe, Rekord, „Zahl wählen“, Körpergewicht. Noch offen, nur auf Zuruf:
1. (erledigt mit v103 und iPhone-App 1.0: Dauer und Puls der Einheit von der Apple Watch; offen ist nur, ob er die zwei Schritte in Kurzbefehle anlegt.)
3. Weiter offen: zu v93 „Woche 15 · 2 von 3“ neben „Pläne“.
4. Plan „Bauch“ ergänzen, falls er ihn doch will.
5. Von ihm noch nicht genannt, nicht ungefragt bauen: fertige Übungsliste mit Anleitung, Plan erstellen lassen, Übung tauschen, Aufwärmsätze, Anstrengung je Satz (RIR), Auswertung nach Muskelgruppen.

Ältere Vorschläge:
- Bei 320 px Breite rutscht das „i“ hinter „Verbesserung“ in der ersten Gym-Kachel in eine zweite Zeile (sein iPhone hat 390 px, dort passt es).
- Automatisierungen: wiederkehrende Ausgaben erkennen und als festen Posten vorschlagen.
- Oberfläche: im Vermögen eine Plus-Form für alle Überschriften.
- Nachgefragt ohne Antwort (v56): Schnell-Knopf „Ausgabe“ in „Buchung“ umbenennen.
- Kategorien: eigene Kategorie umbenennen (Name antippen, wie beim Konto).
- Finanzen: Wochenleiste auch im Vermögen; Knopf „Alle aufs Girokonto“ in der Zeile „Ohne Konto“; Erinnerung ab dem 25., wenn für den Monat noch kein Stand eingetragen ist; Umschalter für Schulden.
- Cardio: bei „Letzter Lauf“ im Vergleichstext die Strecke nennen (zwei Läufe am selben Tag).
- Gym: „Training beenden“ als kleiner Knopf oben; im laufenden Training zeigen, ob ein Satz besser war als beim letzten Mal; Verbesserung in der Zeile „Training“ auf Heute.
- Mit der iPhone-App möglich geworden: Erinnerungen mit Uhrzeit.
- Konkurrenz gründlich recherchieren (falls die App für andere gedacht wird).

## Erledigt
- v20–v65: Umzug ins Repository; dunkler, kompakter Look; GitHub Pages; Selbst-Aktualisierung; Gym nach Vorbild Alpha Progression; Finanzen mit Vermögen, Sparzielen, Konten; Tests; Wischgesten, Graphen ablesen, „Rückgängig“, eigene Kategorien; Aufgaben und Notizen; Kennfarben; Schnell-Knöpfe gekürzt; Tages-Check (Schlaf) gebaut und wieder entfernt; Monatsabschluss und Kurzbefehl-Adresse; Verbindung zur iPhone-App mit Mitteilungen, Widgets und Aktionen für Kurzbefehle (iPhone-App 0.2 und 0.3); Blätter rücken über die Tastatur, Schnelleingabe aus dem Widget (iPhone-App 0.4); aufgeräumte Oberfläche mit Klappzeilen (v64); Schnelleingabe mit Konto, Sicherung von selbst, Läufe von der Apple Watch über Kurzbefehle (v65, iPhone-App 0.5).
- v66–v80 mit iPhone-App 0.5 bis 0.7: Cardio ruhiger und nur noch draußen, Händler bestimmt die Kategorie, neues App-Symbol, Tastatur geht sofort auf, „Arbeit“ und „Uni“ im Planer; Aufgaben, Routinen und Ordner ausgebaut; Titel je Bereich.
- v81–v95 mit iPhone-App 0.8 und 0.9: Haptik und Bewegung; Gym nach Alpha Progression (Punkt je Übung, Rekord, „Zahl wählen“, „Sätze besser“, Runde der Pläne, Überspringen); Schwarz mit neutralem Grau; Graphen mit weicher Linie; schwebende Glas-Leiste und Blätter; runde Eingabefelder.
- v96–v105 mit iPhone-App 1.0 und 1.1: Training im Vollbild aus Glas, Übungen nach Gruppen, Glas und Licht in der ganzen App, Gym-Einheit von der Apple Watch, Wechsel des Bereichs ohne Flackern.
- v106–v107: Zahnrad mit Einstellungen, großer Titel, Pausen-Uhr nur als Timer, Pläne sortierbar, größere Tippflächen; Empfehlung je Satz im Training.
- v108–v109: Reserve je Satz fließt in die Empfehlung ein; „Heute dran“ wieder von Heute entfernt.
- v110–v111: Einstellungen für Start-Bereich, Übersicht auf Heute, Frage nach der Reserve; Schritt je Übung.
- v112–v113: Neuanfang im Gym (nur Einheiten ab 23.11.2026); Drop- und Supersätze im Plan einstellbar.
- v114–v115: Steigern nach seinem Muster; Knopf mit Schein rundum; Dropsatz rot im Ring, Supersatz mit Kette; Training nachträglich ändern und weiter trainieren; Übung hinzufügen nach Gruppen.
- v116: Glas und Flächen nach Messung an iOS 26 (Leiste einfarbig mit gleichem Streifen oben und unten, Karten mit Verlauf wie das Widget).
- v117: „Einheit ändern“ und „Plan bearbeiten“ verlieren Ungespeichertes nicht mehr durch einen Tipp neben das Blatt.
- v118: Glas 1 zu 1 wie das Dock: alle Flächen einfarbig, Streifen genau auf der Kante, kein Verlauf mehr in den Karten.
- v119: Licht läuft vor der Ecke aus; Bedienteile und Blätter tragen nur noch eine leise Kante.
- v120: Kanten in WebKit geprüft und gegen dessen Rundung abgesichert; Prüfskript `tests/webkit.py`.
- v121: Helligkeit der Kanten auf sein Wort zurückgenommen.
- v122: „Speichern“ steht in „Einheit ändern“ und „Plan bearbeiten“ fest am unteren Rand; Kreuz warnt bei Ungespeichertem; Dauer wird beim Tippen ersetzt.

## Offene Probleme
- Die Tests laufen im Test-Browser und im Simulator; am echten iPhone prüft nur der Nutzer. Dort bestätigt: Die iPhone-App startet, eine neue Installation ersetzt die alte ohne Datenverlust, neue Versionen des Inhalts kommen von selbst, die Sicherung lässt sich einlesen, die Automation zum Erneuern läuft durch, Schnelleingabe aus dem Widget geht (0.4), Health fehlt wie erwartet. Seine Läufe waren bis November 2026 Laufband-Läufe (mit v79 gelöscht), seitdem läuft er draußen.
- Bewusst nicht behoben (bräuchten eine Entscheidung oder ein neues Feld):
  - Vermögen: Bekommt ein neues Konto seinen ersten Stand später als die übrigen, zählt der ganze Stand als Plus des Monats (Abhilfe: den Stand auch im Vormonat eintragen).
  - Läufe von selbst: Ein zweiter echter Lauf am selben Tag mit ähnlicher Strecke kommt nie an.
  - Gym: Eine Einheit für einen vergangenen Tag ganz neu von Hand anlegen geht nicht (ändern und weiter trainieren geht seit v115); der Code-Zweig dafür in `openK()` ist unerreichbar. Ihn fragen, ob er das braucht, sonst entfernen.
  - Training: Bleibt die App über den Monatswechsel offen, zeigt Training noch den alten Monat (Finanzen gehen mit).
  - Eine offene „i“-Erklärung schließt sich, wenn man im Graphen den Zeitraum wechselt.
- Negative Kontostände lassen sich speichern, aber auf dem iPhone nicht eintippen (Zahlentastatur ohne Minus).
- Feste Posten, deren Tag im Monat des eingetragenen Stands schon vorbei ist, zählen erst ab dem Folgemonat (gewollt). Buchungen ohne Konto aus der Zeit vor v42 zählen nicht, bis er das Konto nachträgt (Zeile „Ohne Konto“).
- `healBal()` wirkt nur im November 2026: Ab Dezember 2026 samt Prüfung entfernen.
- Alte CSS-Regeln, die weiter unten überschrieben werden, sind nicht zusammengeführt (nur mit Bildvergleich anfassen).
- Der Gesten-Test ist zeitempfindlich: bei einem einzelnen Fehlschlag dort einzeln wiederholen.
- Die Reihe „Speichern“ schlug am 24.11. einmal in einem vollen Lauf fehl („25-mal neu geladen“, 1 Abweichung) und danach nicht mehr. Kommt es wieder, die Abweichung ausgeben lassen: Seit v96 öffnet die App beim Laden mit laufendem Training das Vollbild.

## Am iPhone noch zu prüfen (Rückmeldung steht aus)
- v122: Lässt sich die Dauer in „Einheit ändern“ jetzt ändern (Feld antippen, Zahl tippen, „Speichern“ steht direkt darunter am Rand des Blatts)? Wenn nicht: Was genau passiert, am besten als Bildschirmaufnahme.
- v121: Passt die Helligkeit der Kanten jetzt, oder noch weniger? Läuft der Streifen an den Ecken am iPhone aus wie im Bild? Wirken Zeilen und Eingabefelder, die seit v118 2 px niedriger sind, noch richtig?
- v115: „Weiter trainieren“ nach dem Beenden; „Einheit ändern“ mit Dauer; Wahl der Übung nach Gruppen.
- v114: Passen die Empfehlungen jetzt zu seinem Muster (nach 12 kommen 10, Erhöhen bei 12/10/8 für alle Sätze)? Blauer Knopf mit Schein rundum: gut oder wieder zu viel? Rote Zahl im Ring am Dropsatz, Kette am Supersatz.
- v113: Drop- und Supersatz im Plan hinter „…“ einstellen; wechselt die Ansicht im Supersatz richtig hin und her?
- v112: Sind nach dem Öffnen nur noch die Einheiten ab 23.11. da (Bildschirmfoto vom Gym erbeten)?
- v110/v111: Einstellungen (Start-Bereich, Übersicht auf Heute, Reserve-Frage), Schritt je Übung; bleibt die Ansicht nach dem letzten Satz stehen, bis die Frage beantwortet ist?
- v106: Wandert der Titel beim Scrollen ruhig in die Mitte? Lässt sich eine Übung im Plan am Griff ziehen, ohne dass das Blatt mitgeht?
- Fassung 1.2: Fragt iOS nach einer Zahlung mit Apple Pay bei einem neuen Händler nach der Kategorie (auch bei gesperrtem iPhone)? Zeigt das Widget „Überblick“ die richtigen Zahlen? Gym von der Uhr (seit 1.0): feuert „Gym merken“, steht danach „Apple Watch · … min · Ø Puls …“ im Blatt der Einheit?
- Glas und Bewegung allgemein: Deckt die Kopfzeile beim Scrollen sauber? Bleibt das Glas im Vollbild flüssig? Ruckelt etwas auf dem iPhone 12 Pro? Haptik zu viel oder zu wenig?
- Kurzbefehle: feuert „Apple Watch-Training“ bei gesperrtem iPhone; kommen Strecke und Puls beim nächsten Lauf an; kommen Betrag und Händler aus „Transaktion“ an? Steht der Zähler in AltStore nach einigen Tagen von selbst wieder bei 7?
- Ältere Punkte ohne Rückmeldung: Größen und Tippflächen (v52, v64), Gesten (Blatt wegziehen, zwischen Monaten wischen, Graph ablesen), Datums- und Zeitfelder in den Blättern (ragen sie hinaus?), Tastatur geht in allen Blättern sofort auf (v71), Monatsabschluss (v59), Planer mit Arbeit und Uni (v73).

## Nächste Schritte
- Zu Beginn einer neuen Sitzung: `CLAUDE.md` und diese Datei lesen (das genügt), seinen Wunsch umsetzen, kurz antworten. `IPHONE.md` und `BEREICHE.md` nur bei Bedarf.
- Sein angekündigtes nächstes Thema (25.11.: „Danach gehen wir die einzelnen Bereiche und die Subfunktionen der Bereiche zum Optimieren an“): Bereich für Bereich durchgehen. Das Gym ist seitdem stark gewachsen (v107 bis v115); die anderen Bereiche (Heute, Planer, Gewicht, Finanzen, Cardio) sind noch nicht dran gewesen. Mit ihm klären, womit er anfangen will.
- Von ihm stehen aus: Fassung 1.2 installieren (vorher Sicherung über das Zahnrad, alte `Track.ipa` in „Dateien“ löschen, AltStore „My Apps“ → „+“, „Keep App Extensions“; Link in `CLAUDE.md`), die Aktion „Ausgabe eintragen“ von Hand testen und Bildschirmfotos der Apple-Pay-Automation schicken, das Widget „Überblick“ hinzufügen, in Kurzbefehle die zwei Schritte für das Krafttraining anlegen, Bildschirmfotos zu den Punkten oben.
- Offene Fragen an ihn: Punkte je Semester getrennt? Will er die Kategorie bei jeder Zahlung wählen oder nur bei neuen Händlern (so gebaut)? Braucht er, eine Einheit für einen vergangenen Tag ganz neu von Hand anzulegen?
- Bei Änderungen am Aussehen erst ein Bild „jetzt / Vorschlag“ zeigen; beim Glas gilt die Messung an iOS (siehe `CLAUDE.md`), nicht das Gefühl.
