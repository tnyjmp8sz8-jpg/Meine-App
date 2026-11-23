# Track. – Fortschritt

## Aktueller Stand
- App-Inhalt (`index.html`): live ist v80 unter https://tnyjmp8sz8-jpg.github.io/Meine-App/ (Zweig `main`, veröffentlicht am 23.11.2026). `node tests/alle.js` (v80): alle 722 Prüfungen in 15 Reihen stimmen (Ablauf 15, Aufbau 66, Klappzeilen 159, Gesten 21, Eingaben 21, Löschen 20, Notizen 40, Arbeit und Uni 44, Finanzen 68, Gym 35, Monat 30, Hülle 161, Apple Watch 24, Speichern 8, Aktualisierung 10). Mit gestellter Uhr geprüft: 1.12. (Klappzeilen, Aufbau, Arbeit und Uni).
- v80 (23.11. abends; auf seine Frage nach Verbesserungen „für high end app“ erst Vorschaubilder, dann sein „punkte von macht keinen sinn, gibt kein max. termine ist soll 18. rest ist gut. alles anwenden“): Titel des Bereichs oben mit blauem Punkt (Heute bleibt „Track.“), „Monat / Jahr“ klein rechts neben den Umschaltern in Training und Finanzen (eine Bedienreihe weniger), lila Punkt fürs Wiegen in der Wochenleiste auf Heute, Zeilen „Arbeit“ und „Uni“ in der Übersicht auf Heute, Zielkarte im Gewicht ohne „0 %“, Uni mit „n von 18 Terminen“ und Balken, im laufenden Gym-Training grünes Plus am Satz über dem letzten Mal, kurzes Einblenden beim Wechsel des Bereichs. Meine Annahme, ihm genannt: Das Soll von 18 Terminen gilt insgesamt, nicht je Fach. Am iPhone noch nicht gesehen.
- v79 (23.11. abends, sein Auftrag: „laufe nur noch draußen … entferne die Möglichkeit für outdoor indoor und alle … lösche die daten von indoor“; auf meine Nachfrage wählte er „Endgültig löschen“ statt „Nur ausblenden“): Cardio kennt nur noch Läufe draußen. Filter, Wahl der Art und Steigung sind weg; Laufband-Läufe werden beim nächsten Öffnen von seinem iPhone gelöscht und kommen auch aus einer alten Sicherung nicht zurück. Ihm gesagt: Das war der größte Teil seiner Läufe; zurück geht es nur aus einer älteren Sicherungsdatei mit einer älteren Fassung der App. Am iPhone noch nicht gesehen.
- v78 (23.11., er zu Gewicht und Heute: „findest du da alles passend übersichtlich apple niveau?“, nach Bild sein „alles anpassen, so übersichtlich und apple look wie geht“): Gewicht: kein „−0,0 kg“ mehr (`signed()`), Kacheln nur noch „pro Woche“ und „seit …“ (Ziel und Anzahl standen doppelt da), Symbol der Zielkarte und der Sparziele getönt statt voll blau. Heute: Übersicht nur mit Bereichen, in denen etwas eingetragen ist (bei ihm fehlt damit „Finanzen“). Am iPhone noch nicht gesehen.
- v77 (23.11., sein Auftrag: „notizen unter kategorien können weg, notizen bei termin eintrag kann weg, notizen bei arbeit eintragen kann weg“; auf Nachfrage gewählt: „Ordner der Notizen“, nicht das Feld „Notiz“ bei Ausgaben): Die Notizen sind eine einzige Liste ohne Ordner (keine Reihe über der Liste, keine Auswahl im Blatt), unter „Arbeit“ und „Uni“ stehen keine Notizen mehr. Alte Ordner bleiben nur gespeichert. Am iPhone noch nicht gesehen.
- v76 (23.11., er zu Cardio: „irgendwie noch unübersichtlich, weiß nicht warum“; nach Bild „jetzt / Vorschlag“ sein „ja anpassen“): Die Karte mit dem Verlauf erscheint erst ab zwei Läufen, die Zeile „Apple Watch“ nur, solange etwas zu tun ist. Oben (Umschalter, Wochenleiste, Monat/Jahr, Pfeile) bewusst nichts angefasst; ihm angeboten, dazu ein eigenes Bild zu zeigen.
- v74 und v75 (seine Aufträge vom 22.11.: „mach jetzt aufgaben raus“, „entferne routinen aus der app“): Aufgaben und Routinen sind ausgebaut (Umschalter, Blätter, Timer, Serien, Heute, Woche, Monat, Kalender, Zusammenhänge, „Als Aufgabe“ an der Notiz). Was gespeichert war, bleibt im Speicher und in der Sicherung, wird aber nirgends gezeigt. Der Planer hat drei Teile und öffnet mit den Notizen: Notizen, Arbeit, Uni (von ihm so gewählt: „ja“ auf meinen Vorschlag A; der Bereich heißt weiter „Planer“). Auf Heute zeigt die Wochenleiste nur noch die Punkte fürs Training. Am iPhone noch nicht gesehen.
- v72/v73: „Arbeit“ und „Uni“ als eigene Teile oben im Planer. Meine Annahmen, ihm genannt: ein Stundenlohn je Eintrag (vorbelegt mit dem letzten), Pause in Minuten, Punkte trägt er je Termin selbst ein, Summen über alle Zeit. Offen an ihn: Punkte je Semester getrennt? Soll je Fach? Mehrere Jobs? Am iPhone noch nicht gesehen (Zeitfelder „Von/Bis“ zeigen dort das Rad).
- v71 behebt seinen Fund (Bildschirmfoto 18.11., 23:47: Betrag im Budget mit blauem Rand, keine Tastatur): Der Fokus kam 60 ms nach dem Tipp, jetzt sofort in allen Blättern. Am iPhone noch nicht bestätigt. Auf seinem Foto standen die Konten „Girokonto“ und „PayPal“ (noch nicht in „Trade Republic“ umbenannt).
- iPhone-App: Bei ihm läuft 0.4 („gültig bis 24. November“), soweit bekannt; 0.5 und 0.6 hat er vermutlich nie installiert. Im Release „iphone-test“ liegt seit 22.11. abends Fassung 0.7 (wie 0.6, aber ohne das Widget „Heute“, mit App-Inhalt v75). Gebaut bei GitHub (Lauf 23, beide Macs durchgelaufen, Selbsttest bestanden: v75, `widgetTage` 8, `bruecke`; `Track.ipa` 1.858.578 Bytes), Bilder auf dem Zweig `ios-bild`. Er bat währenddessen „baue die app in codemagic“: nicht gemacht, weil der Bau bei GitHub da schon fertig war (dasselbe Skript, dieselbe Datei); ihm so gesagt. Am iPhone ist von 0.5 bis 0.7 noch nichts geprüft. Hat er das Widget „Heute“ auf dem Home-Bildschirm, bleibt dort nach der Installation eine leere Fläche: von Hand entfernen.
- Am Gerät belegt (seine Bildschirmfotos vom 23.11.): Bei ihm läuft iPhone-App 0.6 („gültig bis 25. November“; 0.7 ohne das Widget „Heute“ hat er noch nicht). die App erkennt Läufe der Apple Watch (12:03, „Apple Watch · Heute · eingetragen“ zu einem Outdoor-Lauf mit 4,58 km in 35:01, Puls 143; ob Strecke und Puls von selbst kamen, ist offen), die Sicherung läuft von selbst („Von selbst gesichert · heute, 12:39“, ohne Erinnerung, also ist ein Ordner gewählt). Um 12:40 stand unten noch v75; v76 und v77 kommen beim nächsten Öffnen. Finanzen benutzt er bisher nicht („Tippe, um zu starten“). Sein Ziel beim Gewicht ist Zunehmen (90,0 → 93,0 kg).
- Kurzbefehle: Neben dem zum Erneuern läuft „Lauf merken“ (belegt am 23.11.: Die Zeile „Apple Watch“ erkannte den Lauf des Tages). Ob „Läufe übernehmen“ (Strecke und Puls aus Health) schon angelegt war, ist offen: Ich hatte aus „eingetragen“ zu früh geschlossen, der Lauf sei von selbst gekommen; so heißt es auch bei einem von Hand eingetragenen Lauf gleicher Dauer. Am 23.11. abends bat er „jetzt noch automatisch die Läufe mit Strecke, Pace, Dauer und bpm“ und hat diese Automation am selben Abend fertig angelegt (Bildschirmfoto 18:06: Auslöser „Track. geöffnet“, „Lauf-Zeitraum“, Suche Strecke, Suche Heart Rate, „Lauf eintragen“ mit beiden Ergebnissen). Ob Strecke und Puls ankommen, zeigt sein nächster Lauf (Bildschirmfoto erbeten). Seine Frage dazu: Was passiert bei Laufband und draußen? Antwort: Die Art übernimmt die App vom letzten Lauf (beim Laufband samt Steigung); weicht sie ab, ändert er sie im Lauf von Hand. Vorschlag an ihn (nicht gebaut, braucht „hoch“ und eine neue Installation): „Lauf merken“ bekommt ein Feld „Art“, dann zwei Automationen (Laufen draußen, Laufen drinnen) und die Art stimmt von selbst. Er soll prüfen, dass seine Automation „Lauf merken“ beide Trainingsarten (Laufen und Indoor-Laufen) angehakt hat. Die Automation für Apple Pay hat er am 23.11. um 17:36 angelegt (Bildschirmfotos): Auslöser „Wenn Trade Republic Visa Card angetippt wird“, jede Kategorie, jeder Händler, „Automation“ an, „Benachrichtigen“ aus; Aktion „Ausgabe eintragen“ mit Betrag = „Kurzbefehleingabe“ (ganz, nicht „Betrag“), Notiz leer, Kategorie „Apple Pay“, Konto „Trade Republic“, „Beim Ausführen anzeigen“ an. Ihm gesagt, was zu ändern ist: bei der Eingabe „Betrag“ wählen, Notiz = „Händler“, Kategorie leer lassen (ein unbekanntes Wort schadet nicht, bringt aber nichts: Es gilt die Kategorie des Händlers, sonst „Sonstiges“), und vorher in Finanzen ein Konto anlegen, das genau „Trade Republic“ heißt (er hat noch keines: Sonst zählt die Ausgabe bei keinem Konto). „Beim Ausführen anzeigen“ zum Probieren anlassen (zeigt „… € eingetragen.“), danach aus. Ob Betrag und Händler ankommen, ist am Gerät offen: Bildschirmfoto nach der ersten Zahlung erbeten.
- Er testet die App seit 18.11. ausgiebig und meldet sich; Rückmeldung am iPhone steht aus.
- Sparsam arbeiten: Regeln in `CLAUDE.md` unter „Zusammenarbeit“. Er arbeitet in Fable 5.2 auf Stufe „mittel“ und will jedes Mal ausdrücklich hören, wann „hoch“ nötig ist (22.11.). Er wollte sein Claude-Abo widerrufen („das Limit reicht nicht“, 17.11.).
- Zweige: `main` ist der Standardzweig, eine neue Sitzung beginnt dort (22.11. geprüft: Arbeitsordner auf v73 wie `main`). Keine offenen Pull Requests oder Issues.
- Freigaben: Veröffentlichen nach `main` ist seit 22.11. dauerhaft erlaubt (Regel in `CLAUDE.md`). Projektdateien am 22.11. sortiert: Einzelheiten der Bereiche, Entscheidungen je Bereich, Felder des Datenmodells und Test-Einzelheiten stehen jetzt in `BEREICHE.md` (`CLAUDE.md` von 56.000 auf rund 36.000 Zeichen).
- Umgebung: Am 22.11. gab es nur „Default“ (die eigene Umgebung „Meine-App“ mit Codemagic-Schlüssel war nicht mehr da). Für Codemagic müsste sie neu angelegt und der Schlüssel über das sichere Formular neu eingegeben werden (`IPHONE.md`, „Bau“); GitHub braucht das nicht. `node tests/live.js` geht in „Default“ nicht (Pages-Adresse nicht erlaubt); Ersatz: der Lauf „pages build and deployment“ bei GitHub.

## Gesammelte Wünsche (nur gemerkt, nichts gebaut; auf sein Zeichen alles in einem Zug)
- Zurzeit keiner.

## Offene Vorschläge (nichts davon gebaut; nur auf Zuruf)
Auf seine Frage „was würdest du jetzt noch ändern oder hinzufügen mit wirklich mehrwert?“ (18.11.):
1. Zuerst das Gebaute am iPhone zum Laufen bringen (0.6, Kurzbefehle, Ordner für die Sicherung).
2. (erledigt mit v80: Zeilen für Arbeit und Uni auf Heute)
3. Eine Rechenkante beheben (siehe „Offene Probleme“: neues Konto zählt als Plus).
4. Seine Entscheidung: Entwickler-Konto von Apple (99 US-Dollar im Jahr) für echtes Health und kein Erneuern alle 7 Tage.
5. Ein neues Widget „Heute“ mit Zahlen statt Routinen (Gewicht, übrig im Monat, Kilometer): bräuchte neue Felder im Stand und eine neue Installation.
6. Offen aus seinen Fragen vom 23.11. (alles Übrige ist mit v80 gebaut): Haptik beim Abhaken und Speichern (braucht eine neue Installation); Finanzen erst nach zwei Wochen mit der Apple-Pay-Automation beurteilen und sonst aus der Leiste nehmen; Entwickler-Konto von Apple als größter Schritt zu einer „fertigen“ App.
Bewusst nicht: weitere Felder, weitere Graphen, Bankanbindung, tägliche Abfragen.

Ältere Vorschläge:
- Automatisierungen: wiederkehrende Ausgaben erkennen und als festen Posten vorschlagen.
- Oberfläche: Erinnerung „Noch keine Sicherung“ unter die Bereiche setzen; Zielkarte im Gewicht ruhiger; im Vermögen eine Plus-Form für alle Überschriften; großer Titel des Bereichs, der beim Scrollen in die Kopfzeile wandert.
- Nachgefragt ohne Antwort (v56): Schnell-Knopf „Ausgabe“ in „Buchung“ umbenennen.
- Kategorien: eigene Kategorie umbenennen (Name antippen, wie beim Konto).
- Finanzen: Wochenleiste auch im Vermögen; Knopf „Alle aufs Girokonto“ in der Zeile „Ohne Konto“; Erinnerung ab dem 25., wenn für den Monat noch kein Stand eingetragen ist; Umschalter für Schulden.
- Cardio: bei „Letzter Lauf“ im Vergleichstext die Strecke nennen (zwei Läufe am selben Tag).
- Gym: „Stärkste“ und „Schwächste Übung“ im Monats-Recap; „Training beenden“ als kleiner Knopf oben; im laufenden Training zeigen, ob ein Satz besser war als beim letzten Mal; Verbesserung in der Zeile „Training“ auf Heute.
- Mit der iPhone-App möglich geworden: Erinnerungen mit Uhrzeit, Timer auf dem Sperrbildschirm, Haptik.
- Konkurrenz gründlich recherchieren (falls die App für andere gedacht wird).

## Erledigt
- v20–v65: Umzug ins Repository; dunkler, kompakter Look; GitHub Pages; Selbst-Aktualisierung; Gym nach Vorbild Alpha Progression; Finanzen mit Vermögen, Sparzielen, Konten; Tests; Wischgesten, Graphen ablesen, „Rückgängig“, eigene Kategorien; Aufgaben und Notizen; Kennfarben; Schnell-Knöpfe gekürzt; Tages-Check (Schlaf) gebaut und wieder entfernt; Monatsabschluss und Kurzbefehl-Adresse; Verbindung zur iPhone-App mit Mitteilungen, Widgets und Aktionen für Kurzbefehle (iPhone-App 0.2 und 0.3); Blätter rücken über die Tastatur, Schnelleingabe aus dem Widget (iPhone-App 0.4); aufgeräumte Oberfläche mit Klappzeilen (v64); Schnelleingabe mit Konto, Sicherung von selbst, Läufe von der Apple Watch über Kurzbefehle (v65, iPhone-App 0.5).
- v66: Cardio ruhiger („Letzter Lauf“ als Klappzeile, Vergleich der Effizienz in der Kachel). Die übrigen Bereiche danach durchgesehen und nichts geändert.
- v67: In „Letzter Lauf“ steht rechts die Effizienz statt der Pace; von selbst gebuchte Ausgaben bekommen die Kategorie des Händlers.
- v68–v69: Aufgaben mit eigenem Takt (mit v74 wieder entfallen).
- v70 mit iPhone-App 0.6: neues App-Symbol (schwarz mit blauem Schein).
- v71: Die Tastatur geht in allen Blättern sofort auf (Fokus ohne Wartezeit).
- v72–v73: „Arbeit“ (Arbeitszeiten, Verdienst je Monat als Klappzeile) und „Uni“ (Termine mit Fach und Punkten, Summe je Fach), seit v73 als eigene Teile oben im Planer.
- v74–v75 mit iPhone-App 0.7: Aufgaben und Routinen ausgebaut (Gespeichertes bleibt erhalten), Widget „Heute“ entfernt; Projektdateien sortiert (`BEREICHE.md`).
- v76: Cardio ohne leere Flächen (Verlauf erst ab zwei Läufen, „Apple Watch“ nur bei Bedarf).
- v77: Notizen ohne Ordner, keine Notizen mehr unter „Arbeit“ und „Uni“.
- v78: Gewicht und Heute ohne Doppeltes und ohne leere Zeilen.
- v79: Cardio nur noch draußen, Laufband-Läufe gelöscht.
- v80: Titel je Bereich, Monat/Jahr klein im Kopf, Punkt fürs Wiegen, Arbeit und Uni auf Heute, Soll der Termine, Satz-Vergleich im Gym, Einblenden.

## Offene Probleme
- Die Tests laufen im Test-Browser und im Simulator; am echten iPhone prüft nur der Nutzer. Dort bestätigt: Die iPhone-App startet, eine neue Installation ersetzt die alte ohne Datenverlust, neue Versionen des Inhalts kommen von selbst, die Sicherung lässt sich einlesen, die Automation zum Erneuern läuft durch, Schnelleingabe aus dem Widget geht (0.4), Health fehlt wie erwartet. Seine Läufe waren bis November 2026 Laufband-Läufe (mit v79 gelöscht), seitdem läuft er draußen.
- Bewusst nicht behoben (bräuchten eine Entscheidung oder ein neues Feld):
  - Vermögen: Bekommt ein neues Konto seinen ersten Stand später als die übrigen, zählt der ganze Stand als Plus des Monats (Abhilfe: den Stand auch im Vormonat eintragen).
  - Läufe von selbst: Ein zweiter echter Lauf am selben Tag mit ähnlicher Strecke kommt nie an.
  - Gym: Eine Einheit nachträglich von Hand anlegen geht nicht; der Code-Zweig dafür in `openK()` ist unerreichbar. Ihn fragen, ob er das braucht, sonst entfernen.
  - Training: Bleibt die App über den Monatswechsel offen, zeigt Training noch den alten Monat (Finanzen gehen mit).
  - Eine offene „i“-Erklärung schließt sich, wenn man im Graphen den Zeitraum wechselt.
- Negative Kontostände lassen sich speichern, aber auf dem iPhone nicht eintippen (Zahlentastatur ohne Minus).
- Feste Posten, deren Tag im Monat des eingetragenen Stands schon vorbei ist, zählen erst ab dem Folgemonat (gewollt). Buchungen ohne Konto aus der Zeit vor v42 zählen nicht, bis er das Konto nachträgt (Zeile „Ohne Konto“).
- `healBal()` wirkt nur im November 2026: Ab Dezember 2026 samt Prüfung entfernen.
- Alte CSS-Regeln, die weiter unten überschrieben werden, sind nicht zusammengeführt (nur mit Bildvergleich anfassen).
- Der Gesten-Test ist zeitempfindlich: bei einem einzelnen Fehlschlag dort einzeln wiederholen.

## Am iPhone noch zu prüfen (Rückmeldung steht aus)
- Fassung 0.7: Installation über AltStore mit „Keep App Extensions“; neues Symbol; Widget „Notizen“ da, „Heute“ weg; Zeile „Sicherung“ und einmal „Ordner in iCloud wählen“; Schnelleingabe „Ausgabe“ mit seinen Konten; legt „Sicherung speichern“ von Hand eine Datei ab?
- Kurzbefehle: feuert „Apple Watch-Training“ bei gesperrtem iPhone; nimmt der Datumsfilter Beginn und Ende; kommen Betrag und Händler aus „Transaktion“ an?
- Erneuern: Steht der Zähler in AltStore nach einigen Tagen von selbst wieder bei 7?
- Oberfläche (v64, v66): übersichtlich genug, oder fehlt eine eingeklappte Liste? Trifft man das kleine Plus und „Alle n“, ohne die erste Zeile zu erwischen? Reicht eine Zeile je Notiz auf Heute?
- Planer (v75): Öffnet er mit den Notizen, wirken die drei Umschalter gut? Arbeit und Uni (v73): Lassen sich „Von“ und „Bis“ gut einstellen (Rad von iOS), ragen die Zeitfelder nicht hinaus? Stimmen seine Zahlen?
- Monatsabschluss (v59): dritter Umschalter „Monat“; Hinweis am Monatsanfang.
- Eingaben: Umschalter Ausgabe/Einnahme im Blatt gut zu sehen (v56)? Geht seit v71 beim Betrag (Budget, Schnell-Knopf), beim Gewicht und beim Lauf die Tastatur sofort auf? Geht sie bei „+ Notiz“ sofort auf, legt Enter die Notiz an und bleibt das Feld offen (v51, v54)?
- Größen und Farben (v52, v55): etwas zu klein zum Lesen oder Treffen? Kreis zum Abhaken? Farbiges Plus in den Schnell-Knöpfen?
- Gesten (v44, v45): Blatt wegziehen, zwischen Monaten wischen (löst es beim Scrollen aus?), Graph ablesen, „Rückgängig“ über der Leiste unten.
- Notizen: Bleibt die Tastatur bei der Suche offen?
- Finanzen (v42): Rechnet das Vermögen nach einer Buchung mit, ist das Konto im Blatt schon gewählt?
- Ältere Punkte: Datumsfeld bei „Einheit ändern“, Monatsfeld im Blatt „Stand eintragen“, Konto-Chips bei mehreren Konten, Kontoname ändern.

## Nächste Schritte
- Zu Beginn einer neuen Sitzung: `CLAUDE.md` und diese Datei lesen (das genügt), sagen, ob „mittel“ reicht, seinen Wunsch umsetzen, kurz antworten. `IPHONE.md` und `BEREICHE.md` nur bei Bedarf.
- Der Nutzer entscheidet, was als Nächstes kommt. Erwartet wird seine Rückmeldung vom iPhone: v75 (Heute und Planer ohne Routinen und Aufgaben), v73 („Arbeit“, „Uni“), v71 (Tastatur beim Betrag), die neue Installation und die drei Automationen (je mit Bildschirmfoto).
- Offene Fragen an ihn: Punkte je Semester getrennt? Soll je Fach als Ziel?
- Bei Änderungen am Aussehen erst ein Bild „jetzt / Vorschlag“ zeigen.
