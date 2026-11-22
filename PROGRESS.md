# Track. – Fortschritt

## Aktueller Stand
- App-Inhalt (`index.html`): live ist v75 unter https://tnyjmp8sz8-jpg.github.io/Meine-App/ (Zweig `main`, veröffentlicht am 22.11.2026). `node tests/alle.js` (v75): alle 708 Prüfungen in 15 Reihen stimmen (Ablauf 14, Aufbau 62, Klappzeilen 144, Gesten 21, Eingaben 21, Löschen 20, Notizen 44, Arbeit und Uni 46, Finanzen 68, Gym 35, Monat 30, Hülle 161, Apple Watch 24, Speichern 8, Aktualisierung 10); am 1.12. und 31.12. geprüft: Notizen, Klappzeilen, Monat (am 1.12. auch Hülle).
- v74 und v75 (seine Aufträge vom 22.11.: „mach jetzt aufgaben raus“, „entferne routinen aus der app“): Aufgaben und Routinen sind ausgebaut (Umschalter, Blätter, Timer, Serien, Heute, Woche, Monat, Kalender, Zusammenhänge, „Als Aufgabe“ an der Notiz). Was gespeichert war, bleibt im Speicher und in der Sicherung, wird aber nirgends gezeigt. Der Planer hat drei Teile und öffnet mit den Notizen: Notizen, Arbeit, Uni (von ihm so gewählt: „ja“ auf meinen Vorschlag A; der Bereich heißt weiter „Planer“). Auf Heute zeigt die Wochenleiste nur noch die Punkte fürs Training. Am iPhone noch nicht gesehen.
- v72/v73: „Arbeit“ und „Uni“ als eigene Teile oben im Planer. Meine Annahmen, ihm genannt: ein Stundenlohn je Eintrag (vorbelegt mit dem letzten), Pause in Minuten, Punkte trägt er je Termin selbst ein, Summen über alle Zeit. Offen an ihn: Punkte je Semester getrennt? Soll je Fach? Mehrere Jobs? Am iPhone noch nicht gesehen (Zeitfelder „Von/Bis“ zeigen dort das Rad).
- v71 behebt seinen Fund (Bildschirmfoto 18.11., 23:47: Betrag im Budget mit blauem Rand, keine Tastatur): Der Fokus kam 60 ms nach dem Tipp, jetzt sofort in allen Blättern. Am iPhone noch nicht bestätigt. Auf seinem Foto standen die Konten „Girokonto“ und „PayPal“ (noch nicht in „Trade Republic“ umbenannt).
- iPhone-App: Bei ihm läuft 0.4 („gültig bis 24. November“), soweit bekannt; 0.5 und 0.6 hat er vermutlich nie installiert. Im Release „iphone-test“ liegt seit 22.11. abends Fassung 0.7 (wie 0.6, aber ohne das Widget „Heute“, mit App-Inhalt v75). Gebaut bei GitHub (Lauf 23, beide Macs durchgelaufen, Selbsttest bestanden: v75, `widgetTage` 8, `bruecke`; `Track.ipa` 1.858.578 Bytes), Bilder auf dem Zweig `ios-bild`. Er bat währenddessen „baue die app in codemagic“: nicht gemacht, weil der Bau bei GitHub da schon fertig war (dasselbe Skript, dieselbe Datei); ihm so gesagt. Am iPhone ist von 0.5 bis 0.7 noch nichts geprüft. Hat er das Widget „Heute“ auf dem Home-Bildschirm, bleibt dort nach der Installation eine leere Fläche: von Hand entfernen.
- Kurzbefehle: Er hat bisher nur den zum Erneuern. Am 22.11. bat er noch einmal um die Anleitung für alle, die er braucht, und hat sie in einem Stück bekommen: zuerst Fassung 0.6 installieren (die Aktionen mit Konto und für Läufe gibt es erst ab 0.5), dann Apple Pay → „Ausgabe eintragen“, „Lauf merken“, „Läufe übernehmen“ mit Strecke und Puls; freiwillig „Notiz hinzufügen“ als Symbol. Alles am Gerät ungeprüft: Hakt etwas, Bildschirmfoto der Automation bzw. der aufgeklappten Zeile „Apple Watch“ erbitten.
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
2. Auf Heute eine Zeile für Arbeit und Uni in der Übersicht (Verdienst im Monat, Punkte gesamt): Seit die Routinen weg sind, stehen dort nur Gewicht, Finanzen, Training.
3. Eine Rechenkante beheben (siehe „Offene Probleme“: neues Konto zählt als Plus).
4. Seine Entscheidung: Entwickler-Konto von Apple (99 US-Dollar im Jahr) für echtes Health und kein Erneuern alle 7 Tage.
5. Ein neues Widget „Heute“ mit Zahlen statt Routinen (Gewicht, übrig im Monat, Kilometer): bräuchte neue Felder im Stand und eine neue Installation.
Bewusst nicht: weitere Felder, weitere Graphen, Bankanbindung, tägliche Abfragen.

Ältere Vorschläge:
- Notizen: Ordner umbenennen.
- Automatisierungen: wiederkehrende Ausgaben erkennen und als festen Posten vorschlagen.
- Oberfläche: Erinnerung „Noch keine Sicherung“ unter die Bereiche setzen; Zielkarte im Gewicht ruhiger; im Vermögen eine Plus-Form für alle Überschriften; großer Titel des Bereichs, der beim Scrollen in die Kopfzeile wandert.
- Nachgefragt ohne Antwort (v56): Feld „Steigung“ beim Laufband entfernen; Schnell-Knopf „Ausgabe“ in „Buchung“ umbenennen.
- Kategorien: eigene Kategorie umbenennen (Name antippen, wie beim Konto).
- Finanzen: Wochenleiste auch im Vermögen; Knopf „Alle aufs Girokonto“ in der Zeile „Ohne Konto“; Erinnerung ab dem 25., wenn für den Monat noch kein Stand eingetragen ist; Umschalter für Schulden.
- Cardio: bei „Letzter Lauf“ im Vergleichstext die Strecke nennen (zwei Läufe am selben Tag).
- Gym: „Stärkste“ und „Schwächste Übung“ im Monats-Recap; „Training beenden“ als kleiner Knopf oben; im laufenden Training zeigen, ob ein Satz besser war als beim letzten Mal; Verbesserung in der Zeile „Training“ auf Heute.
- Mit der iPhone-App möglich geworden: Erinnerungen mit Uhrzeit, Timer auf dem Sperrbildschirm, Haptik.
- Konkurrenz gründlich recherchieren (falls die App für andere gedacht wird).

## Erledigt
- v20–v61: Umzug ins Repository; dunkler, kompakter Look; GitHub Pages; Selbst-Aktualisierung; Gym nach Vorbild Alpha Progression; Finanzen mit Vermögen, Sparzielen, Konten; Tests; Wischgesten, Graphen ablesen, „Rückgängig“, eigene Kategorien; Aufgaben und Notizen; Kennfarben; Schnell-Knöpfe gekürzt; Tages-Check (Schlaf) gebaut und wieder entfernt; Monatsabschluss und Kurzbefehl-Adresse; Verbindung zur iPhone-App mit Mitteilungen, Widgets und Aktionen für Kurzbefehle (iPhone-App 0.2 und 0.3).
- v62–v63 mit iPhone-App 0.4: Blätter rücken über die Tastatur; Schnelleingabe aus dem Widget.
- v64: Aufgeräumte Oberfläche (Klappzeilen mit Anzahl, kleines Plus in der Überschrift, Heute als Kurzform), dazu viele behobene Fehler; Tests laufen an jedem Tag im Monat. Gebaut ohne Rückfrage; wünscht er eine Liste wieder offen, ist das eine Zeile (Zeilen direkt statt über `foldHTML`).
- v65 mit iPhone-App 0.5: Schnelleingabe mit Ausgabe/Einnahme und Konto; Sicherung von selbst; Läufe von der Apple Watch über Kurzbefehle (drei Aktionen, Zeile „Apple Watch“); „Ausgabe eintragen“ mit Konto.
- v66: Cardio ruhiger („Letzter Lauf“ als Klappzeile, Vergleich der Effizienz in der Kachel). Die übrigen Bereiche danach durchgesehen und nichts geändert.
- v67: In „Letzter Lauf“ steht rechts die Effizienz statt der Pace; von selbst gebuchte Ausgaben bekommen die Kategorie des Händlers.
- v68–v69: Aufgaben mit eigenem Takt (mit v74 wieder entfallen).
- v70 mit iPhone-App 0.6: neues App-Symbol (schwarz mit blauem Schein).
- v71: Die Tastatur geht in allen Blättern sofort auf (Fokus ohne Wartezeit).
- v72–v73: „Arbeit“ (Arbeitszeiten, Verdienst je Monat als Klappzeile) und „Uni“ (Termine mit Fach und Punkten, Summe je Fach), seit v73 als eigene Teile oben im Planer.
- v74–v75 mit iPhone-App 0.7: Aufgaben und Routinen ausgebaut (Gespeichertes bleibt erhalten), Widget „Heute“ entfernt; Projektdateien sortiert (`BEREICHE.md`).

## Offene Probleme
- Die Tests laufen im Test-Browser und im Simulator; am echten iPhone prüft nur der Nutzer. Dort bestätigt: Die iPhone-App startet, eine neue Installation ersetzt die alte ohne Datenverlust, neue Versionen des Inhalts kommen von selbst, die Sicherung lässt sich einlesen, die Automation zum Erneuern läuft durch, Schnelleingabe aus dem Widget geht (0.4), Health fehlt wie erwartet. Seine Läufe sind Laufband-Läufe.
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
