# Track. – Fortschritt

## Aktueller Stand
- App-Inhalt (`index.html`): v65 liegt auf dem Arbeitszweig `claude/nifty-hamilton-gyakdi`; live ist noch v64 (Zweig `main`). `node tests/alle.js` (18.11.): alle 705 Prüfungen in 14 Reihen stimmen (Ablauf 16, Aufbau 68, Klappzeilen 152, Gesten 21, Eingaben 17, Löschen 22, Aufgaben und Notizen 74, Finanzen 68, Gym 35, Monat 30, Hülle 160, Apple Watch 24, Speichern 8, Aktualisierung 10).
- iPhone-App: Bei ihm läuft 0.4 („gültig bis 24. November“). Fassung 0.5 ist geschrieben (Schnelleingabe mit Ausgabe/Einnahme und Konto, Sicherung von selbst, Läufe von der Apple Watch über Kurzbefehle), aber noch auf keinem Mac gebaut: Der Bau bei GitHub ist gestartet. Erst wenn er durchläuft (Selbsttest, Bilder), dem Nutzer die neue Installation nennen.
- Reihenfolge beim Veröffentlichen: erst der Bau von 0.5 grün, dann v65 nach `main`. v65 ist mit 0.4 verträglich (ohne `sicherung` und `uhr` in der Auskunft bleibt alles wie in v64).
- Sparsam arbeiten: „bitte kein ultra code mehr nutzen“ (18.11.). Der Nutzer will sein Claude-Abo widerrufen („das Limit reicht nicht“, 17.11.).
- Zweige: `main` und der Arbeitszweig der Sitzung; der alte `claude/app-entwicklung-verschieben-af0kew` steht noch auf v63. Keine offenen Pull Requests oder Issues. Der Bau der iPhone-App bei GitHub startet bei jeder Änderung unter `ios/` auf einem `claude/…`-Zweig (außer mit „[skip ci]“ in der Nachricht) und ersetzt dann das Release.
- Freigabe in der Sitzung vom 17./18.11.: „du hast alle berechtigungen“ und „arbeite solange bis fertig“. Gilt nur für diese Sitzung; in einer neuen Sitzung neu erfragen.
- Umgebung der Sitzung: nur „Default“ (ohne erlaubte Adressen, ohne Schlüssel). `curl` an Codemagic und `node tests/live.js` gehen nicht; Ersatz für die Live-Prüfung: der Lauf „pages build and deployment“ bei GitHub. Der Bau bei GitHub geht ohne Schlüssel.
- Wortwahl gegenüber dem Nutzer: „App“ für den Inhalt, „neue Installation“ für eine neue IPA (nicht „Web-App“ oder „Hülle“).

## Laufender Auftrag (18.11.2026, morgens): Schnelleingabe mit Konten, Sicherung von selbst
Wortlaut (mit Bildschirmfoto der Schnelleingabe „Ausgabe“ am Gerät, also läuft Fassung 0.4 bei ihm): „füge deinen vorschlag mit ein / dazu: wenn ich auf dem widget auf ausgabe klicke kommt das, ich will wählen können zwischen ausgabe und einnahme (standard is ausgabe) und meine hinzugefügten konten auswählen können damit es direkt richtig mit meinem vermögen verrechnet wird / findest du die app übersichtlich genug?“
- „Vorschlag“ = die iPhone-App legt von selbst eine Sicherung in „Dateien“ ab, die Erinnerung entfällt.
- Plan: App-Inhalt v65 (Konten im Stand für die Schnelleingabe; Einnahme und Konto aus der Schnelleingabe übernehmen; Sicherung von selbst an den iPhone-Teil schicken, Zeile „Sicherung“ zeigt den Stand) und iPhone-App 0.5 (Schnelleingabe mit Pillen Ausgabe/Einnahme und Konten; Sicherung je Tag in den Ordner der App, sichtbar in „Dateien“, die letzten 14; wahlweise zusätzlich ein Ordner in iCloud Drive; dazu die offenen Punkte für 0.5). Der Vertrag zwischen beiden Seiten steht im Skript des Arbeitsablaufs der Sitzung und kommt nach dem Bau in `CLAUDE.md`.
- Gebaut (v65 und 0.5): zwei Helfer parallel, fünf Prüfer, Nachbessern; den letzten Helfer habe ich auf Wunsch des Nutzers angehalten (Stand war gesichert, Tests stimmten), den Rest selbst gebaut. Anders als zuerst gedacht: Die Erinnerung an die Sicherung entfällt erst, wenn er einmal einen Ordner in iCloud Drive wählt; Dateien nur im Ordner der App gingen mit der App verloren (Befund von drei Prüfern). Regeln und Vertrag stehen in `CLAUDE.md`.
- Seine Frage nach der Übersicht: beantwortet (im Wesentlichen ja; zwei kleine Stellen genannt, nichts gebaut).
- Nachtrag (18.11.): „nutze ultracode dafür 10 agenten / außerdem: health verknüpfung einbauen für automatische erkennung läufe / finde einen guten automatischen weg am besten wie in echter app“. Dazu läuft ein zweiter Arbeitsablauf nur zum Klären (fünf Recherchen: Signieren mit AltStore, Wege vom Windows-PC, Kurzbefehle, HealthKit wie in echten Apps, andere Quellen; drei Gegenprüfer; zwei Entwürfe). Gebaut wird Health erst, wenn der erste Ablauf mit `ios/` fertig ist; alles kommt in dieselbe Fassung 0.5. Ihm nichts zusagen, was nicht belegt ist.
- Health, Ergebnis der Recherche (18.11., zehn Helfer, drei davon Gegenprüfer; Quellen im Verlauf der Sitzung):
  - Belegt: Apple erlaubt HealthKit auch kostenlosen Konten (Apples Tabelle „Supported capabilities“), aber AltStore Classic (Zweig `classic`, 2.3.1) und SideStore fordern es bei Apple nie an und lassen die Freigabe beim Signieren still weg. Mit seiner Installation gibt es Health direkt also sicher nicht; sein Bildschirmfoto bestätigt es.
  - Sicher „wie in echter App“ geht nur das Entwickler-Konto von Apple (99 US-Dollar im Jahr; ohne Mac über Codemagic und TestFlight, nachgelesen, nie durchgespielt; neue App neben der alten, Umzug über die Sicherung; kein Erneuern alle 7 Tage mehr, dafür alle knapp 90 Tage eine neue Fassung). Seine Entscheidung.
  - Kostenlos, aber unbelegt und nicht empfohlen: Impactor am Windows-Laptop (drei mögliche Ausgänge, kann das Zertifikat von AltStore zurücksetzen, Widget leer, Erneuern am PC); „einmal einschalten, dann wieder AltStore“ kann die App nach dem Erneuern sperren.
  - Kurzbefehle kann keine Trainings aus Health lesen, nur Messwerte („Health-Messungen suchen“, so heißt die Aktion auf Deutsch), und Health ist bei gesperrtem iPhone nicht lesbar. Deshalb der kostenlose Weg in zwei Kurzbefehlen: (1) Auslöser „Apple Watch-Training beginnt/endet“ → Aktion „Lauf merken“ (merkt nur die Uhrzeit, geht gesperrt); (2) Auslöser „Track. wird geöffnet“ → „Lauf-Zeitraum“ → „Health-Messungen suchen“ (Geh- und Laufstrecke, wahlweise Herzfrequenz mit „Statistiken berechnen › Durchschnitt“; nicht „Gruppieren“ beim Puls, das ergäbe eine Summe) → „Lauf eintragen“. Gerechnet wird im App-Inhalt (nachbesserbar ohne neue Installation). An keinem Gerät gelaufen: in drei Stufen mit Bildschirmfoto bestätigen lassen, nichts zusagen.
  - Gebaut am 18.11. (v65, `ios/App/Uhr.swift`): drei Aktionen und die Zeile „Apple Watch“ am Ende von Cardio. Die Anleitung für seine zwei Kurzbefehle steht in `CLAUDE.md` unter „iPhone-App“.
  - Entscheidung (meine, ihm zu erklären): Der Weg über Kurzbefehle kommt in Fassung 0.5, weil er der einzige kostenlose ist und die Aktionen eine neue Installation brauchen. Der Ausbau von HealthKit (Beobachter, Zustellung im Hintergrund) wird erst gebaut, wenn er sich für das Entwickler-Konto entscheidet: Vorher kann ihn niemand prüfen. Eine Zeile „Apple Health · nicht freigegeben“ baue ich nicht (Text ohne Nutzen).
  - Beantwortet (18.11.): „immer zahlen der watch bzw. apple fitness“. Die Strecke der Uhr ist also die richtige Zahl.
  - Offen an ihn: Hat er schon einen Kurzbefehl mit der alten Aktion „Lauf eintragen“ gebaut (ihre Felder ändern sich)? Bildschirmfotos aus Kurzbefehle: Suche „Track“ (stehen unsere Aktionen da?), der Auslöser „Apple Watch-Training“ mit „beginnt/endet“, seine iOS-Fassung.
- Am Gerät bestätigt durch seine Bildschirmfotos (18.11., 09:29, Cardio bis zur Fußzeile): v64 ist angekommen, Fassung 0.4 läuft („iPhone-App 0.4 · gültig bis 24. November“). Health: In seiner Installation fehlt die Freigabe (kein Knopf „Läufe aus Health übernehmen“, kein „Health verbunden“), wie erwartet. Das „i“ bei „Letzter Lauf“ bricht am Gerät zusammen mit der Laufzeit um („45:13 ⓘ“ in der zweiten Zeile), steht also nie allein. Seine Läufe sind Laufband-Läufe (zwei im November).

## Nachtrag (18.11., vormittags): Vermögen von selbst
Wortlaut: „zahle immer mit apple pay das wäre dann über Trade Republic / nenne Girokonzo Trade Republic / automatisch apple pay immer darüber buchen kurz befehl / fixkosten monatlich automatisch vom vermögen abziehen / fix einnahmen automatisch dazubuchdn / flex einnahmen und ausgaben ebenfalls verbuchen sodass ich nie stand neu eingeben muss“.
- Gebaut für 0.5: Aktion „Ausgabe eintragen“ hat das Feld „Konto“ (Name). Damit bucht eine Automation jede Zahlung mit Apple Pay auf „Trade Republic“.
- Schon vorhanden: Feste Posten (Fixkosten und feste Einnahmen) zählen an ihrem Tag beim Konto, wenn sie Konto und Tag tragen; Ausgaben und Einnahmen mit Konto ebenso. Ihm sagen, wo er das einstellt; das Konto benennt er selbst um (Vermögen › Stand eintragen › Name im Feld).
- Mit ihm nach der Installation anlegen (ungeprüft am Gerät, Bildschirmfotos erbitten): Automation „Transaktion/Wallet“ → „Ausgabe eintragen“ (Betrag = Betrag der Zahlung, Notiz = Händler, Konto „Trade Republic“). Kommt der Betrag als Text mit „€“, davor „Zahlen aus Eingabe abrufen“.
- Ehrliche Grenze: Zinsen von Trade Republic, Überweisungen, Erstattungen, Sparpläne und der Wert des Depots kommen nicht von selbst.

## Letzter Auftrag (17./18.11.2026): Oberfläche aufräumen, erledigt in v64
Wortlaut: „meine app muss cleaner aussehen; da ist noch zu viel zu unübersichtlich aber ich mag alle funktionen überleg dir was wie alles enthalten bleibt aber auf den ersten blick übersichtlich bleibt und baue es bis es fertig ist. überprüfe dich selbst ob es passt und passe gegebenenfalls an“.
- Weg: Bilder aller Ansichten; drei gebaute Entwürfe; gewählt „Erst das Wichtigste, der Rest eingeklappt“ (Regeln in `CLAUDE.md` unter Entscheidungen, Klappzeilen, Design-Regeln); danach Klappzeilen vereinheitlicht, Fehler behoben, drei unabhängige Prüfungen (Code, „nichts verloren“, Bilder) und Nachbessern.
- Prüfung „nichts verloren“: 5014 Aktionen in 32 kleinen Datenständen alt gegen neu verglichen; keine fehlt, keine liegt mehr als einen Tipp tiefer.
- Wirkung bei 390 px mit Beispieldaten: Budget 1786 → 1037 px hoch, Budget Jahr 1675 → 901, Cardio 1337 → 1105, Heute 1420 → 1289; die elf losen blauen Link-Zeilen sind weg.
- Seine Rückmeldung am iPhone steht aus. Gebaut ohne Rückfrage; wünscht er eine Liste wieder offen, ist das eine Zeile (Zeilen direkt statt über `foldHTML`).

## Früherer Auftrag (17.11.2026): iPhone-App
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
- v20–v53: Umzug ins Repository; dunkler, kompakter Look; GitHub Pages; Selbst-Aktualisierung; Gym nach Vorbild Alpha Progression; „Track.“, Finanzen mit Vermögen, Sparzielen, Konten; Tests im Repository; Wischgesten, Graphen ablesen, „Rückgängig“, eigene Kategorien; Apple-Feinschliff; Aufgaben und Notizen (schnelle Aufnahme), wiederkehrende Aufgaben; alles eine Stufe kleiner; Notizen auf Heute oben.
- v54: Kacheln ohne Wert werden nicht gezeigt; der Bereich heißt unten „Planer“; nach Enter bleibt das Notiz-Blatt offen für die nächste Notiz.
- v55: Kennfarben der Bereiche auch am Plus der Schnell-Knöpfe und am Symbol der leeren Seiten.
- v56: Entfernt auf Wunsch: Tempo beim Laufband, Schnell-Knöpfe „Aufgabe“, „Lauf“, „Einnahme“; Ausgabe/Einnahme wählt man im Blatt.
- v57–v58: Tages-Check (Schlaf) zur Probe eingebaut und auf Wunsch wieder entfernt.
- v59: Monatsabschluss (Ansicht „Monat“ auf Heute, Hinweis am Monatsanfang); Adresse mit `?neu=…` öffnet gleich das Blatt.
- v60–v61 mit iPhone-App 0.2 und 0.3: Verbindung zwischen App-Inhalt und iPhone-Teil; Mitteilungen; Widgets „Heute“ und „Notizen“ (mit Abhaken); Aktionen für Kurzbefehle (Notiz, Ausgabe, Lauf).
- v62–v63 mit iPhone-App 0.4: Blätter rücken in der iPhone-App über die Tastatur, seit v63 schon beim Öffnen; Schnelleingabe aus dem Widget.
- v64: Aufgeräumte Oberfläche (Verläufe und Stammdaten als Klappzeile mit Anzahl, kleines Plus in der Überschrift, Heute als Kurzform, Erklärungen hinter „i“). Dazu behobene Fehler: nach „Rückgängig“ lief die Uhr einer Routine nicht weiter und das Widget bekam den Stand nicht; Schnell-Knopf „Ausgabe“ bucht immer auf heute; Finanzen gehen bei offener App in den neuen Monat mit; im Blatt „Gewicht“ überschreibt ein Datumswechsel nichts Getipptes; Zielgewicht speichern setzt den Fortschritt nicht mehr zurück; Sparziel-Prozent stimmt (Rundung); Minus bei der Dauer einer Routine geht bis 1; Dauer und Plan einer Gym-Einheit ziehen beim Verschieben mit; monatliche Aufgabe am 31. bleibt beim 31.; „Als Aufgabe“ behält den ganzen Text; Erinnerung an die Sicherung zählt auch Aufgaben und Notizen; Woche auf Heute vergleicht Gym richtig; in der iPhone-App keine Erfolgsmeldung ohne gespeicherte Sicherung; Kategorie mit „&“ aus dem Kurzbefehl; Emoji im Widget-Text; Kennungen aus eingelesenen Sicherungen sicher ausgegeben; toter Code entfernt. Tests laufen jetzt an jedem Tag im Monat (vorher schlugen einige am 1., 2. und ab dem 28. fehl).

## Offene Probleme
- Die Tests laufen im Test-Browser und im Simulator; am echten iPhone prüft nur der Nutzer. Dort bestätigt: Die iPhone-App startet, eine neue Installation ersetzt die alte ohne Datenverlust, neue Versionen des Inhalts kommen von selbst, die Sicherung lässt sich einlesen, die Automation zum Erneuern läuft durch.
- Offen am iPhone: ob das Erneuern nach einigen Tagen von selbst geklappt hat (Zähler in AltStore wieder bei 7); ob „Sicherung speichern“ in der iPhone-App eine Datei ablegt (im Simulator ist das Teilen vorhanden).
- Aus dem Abgleich vom 17.11. bewusst nicht behoben (bräuchten eine Entscheidung oder ein neues Feld):
  - Routinen: Ändert man die Tage einer Routine, rechnen Serie und Kalender auch vergangene Tage mit dem neuen Plan; ein nachträglich hinzugefügter Tag bricht die Serie rückwirkend (bräuchte ein Feld „gilt seit“).
  - Routinen: „Tage in Folge“, „Bestwert“ und „insgesamt“ zählen nur ab dem 1. Januar des Vorjahres.
  - Vermögen: Bekommt ein neues Konto seinen ersten Stand später als die übrigen, zählt der ganze Stand als Plus des Monats (Abhilfe: den Stand auch im Vormonat eintragen).
  - Läufe aus Health oder Kurzbefehl: Ein zweiter echter Lauf am selben Tag mit ähnlicher Strecke kommt nie an.
  - Gym: Eine Einheit nachträglich von Hand anlegen geht nicht; der Code-Zweig dafür in `openK()` ist unerreichbar. Den Nutzer fragen, ob er das braucht, sonst entfernen.
  - Training: Bleibt die App über den Monatswechsel offen, zeigt Training noch den alten Monat (Finanzen gehen seit v64 mit).
  - Eine offene „i“-Erklärung schließt sich, wenn man im Graphen den Zeitraum wechselt (beim Aufklappen einer Zeile bleibt sie seit v64).
  - Monatliche Aufgabe: Löscht man die erledigte Vorgängerin, bleibt nach einem kurzen Monat der frühere Tag.
- iPhone-App, für die nächste Installation (0.5): Widget nach „Notiz hinzufügen“ neu zeichnen; Bilder der Schnelleingabe im GitHub-Bau ablegen; neue Fassung des Inhalts, die bei offenem Blatt ankommt, erst beim nächsten Kaltstart; eigener Weg zum Speichern der Sicherung, falls das Teilen am Gerät nicht geht.
- Der Gesten-Test ist zeitempfindlich: bei einem einzelnen Fehlschlag dort einzeln wiederholen.
- Negative Kontostände lassen sich speichern, aber auf dem iPhone nicht eintippen (Zahlentastatur ohne Minus).
- Feste Posten, deren Tag im Monat des eingetragenen Stands schon vorbei ist, zählen erst ab dem Folgemonat (gewollt: Sie stecken schon im Stand).
- Buchungen, die der Nutzer vor v42 ohne Konto eingetragen hat, zählen nicht, bis er das Konto nachträgt (Zeile „Ohne Konto“ im Vermögen).
- `healBal()` wird nur für Stände aus v38 gebraucht und wirkt nur im November 2026. Ab Dezember 2026 kann die Funktion samt ihrer Prüfung entfernt werden.
- Erledigte Aufgaben: gezeigt werden die letzten 50, ältere bleiben gespeichert.
- Alte CSS-Regeln, die weiter unten überschrieben werden, sind noch nicht zusammengeführt (rein intern; nur mit Bildvergleich vorher/nachher anfassen).

## Am iPhone noch zu prüfen (Rückmeldung des Nutzers steht aus)
- Aufgeräumte Oberfläche (v64): Ist es so übersichtlich genug, oder fehlt ihm eine Liste, die jetzt eingeklappt ist? Trifft man das kleine Plus und „Alle n“ in der Überschrift gut, ohne die erste Zeile darunter zu erwischen? Klappen die Zeilen ohne Ruckeln auf? Steht das „i“ bei „Letzter Lauf“ in der Zeile? Reicht eine Zeile je Notiz auf Heute?
- „Sicherung speichern“ in der iPhone-App (Zeile „Sicherung“ am Ende von Heute): Öffnet sich das Teilen-Menü, liegt danach eine Datei in „Dateien“?
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
- iPhone-App: die Punkte für 0.5 unter „Offene Probleme“; Daten zusätzlich im iPhone-Teil spiegeln, damit sie nicht allein am Speicher der Web-Ansicht hängen (mein Vorschlag vom 18.11.: tägliche Sicherung von selbst in „Dateien“, dann entfiele die Erinnerung).
- Aufgeräumte Oberfläche weiter: Erinnerung „Noch keine Sicherung“ auf Heute unter die Bereiche setzen; im Gewicht die Zielkarte ruhiger; im Vermögen eine Plus-Form für alle Überschriften (Hinweise des Bild-Prüfers, nicht gebaut).
- Laufband: Feld „Steigung“ auch entfernen, falls der Nutzer es nicht braucht (nachgefragt in v56, noch ohne Antwort).
- Schnell-Knopf „Ausgabe“ in „Buchung“ umbenennen, falls er das klarer findet (nachgefragt in v56, noch ohne Antwort).
- Kategorien: eigene Kategorie umbenennen (Name antippen, wie beim Konto).
- Finanzen: Wochenleiste auch im Vermögen; Knopf „Alle aufs Girokonto“ in der Zeile „Ohne Konto“; Erinnerung auf Heute ab dem 25., wenn für den Monat noch kein Stand eingetragen ist; Umschalter für Schulden (negative Stände).
- Cardio: bei „Letzter Lauf“ im Vergleichstext zusätzlich die Strecke nennen, weil „Heute“ bei zwei Läufen am selben Tag doppeldeutig ist.
- Gym: „Stärkste“ und „Schwächste Übung“ im Monats-Recap; „Training beenden“ als kleiner Knopf oben im laufenden Training; im laufenden Training zeigen, ob ein Satz besser oder schlechter war als beim letzten Mal; Verbesserung im Gym in der Zeile „Training“ auf Heute.
- Apple-Look: großer Titel des Bereichs, der beim Scrollen in die Kopfzeile wandert.
- Mit der iPhone-App grundsätzlich möglich geworden (noch nicht gebaut): Erinnerungen mit Uhrzeit (z. B. offene Routinen am Abend), Timer auf dem Sperrbildschirm, Haptik.
- Konkurrenz gründlich recherchieren (falls die App für andere gedacht wird).
