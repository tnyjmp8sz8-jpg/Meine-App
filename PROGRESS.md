# Track. – Fortschritt

## Aktueller Stand
- App-Inhalt (`index.html`): live ist v73 unter https://tnyjmp8sz8-jpg.github.io/Meine-App/ (Zweig `main`, veröffentlicht am 19.11.2026). `node tests/alle.js` (v73): alle 769 Prüfungen in 15 Reihen stimmen (Ablauf 16, Aufbau 68, Klappzeilen 154, Gesten 21, Eingaben 24, Löschen 22, Aufgaben und Notizen 80, Arbeit und Uni 46, Finanzen 68, Gym 35, Monat 30, Hülle 163, Apple Watch 24, Speichern 8, Aktualisierung 10).
- v72/v73 (sein Auftrag vom 19.11.: Arbeitszeiten mit Verdienst je Monat zum Ein- und Ausklappen; Termine der Zahnmedizin mit Punkten je Fach Kons, Paro, Prothetik): „Arbeit“ und „Uni“ sind zwei eigene Teile oben im Planer neben Routinen, Aufgaben, Notizen (v73; v72 hatte sie im Ordner der Notizen, er schrieb gleich: „allerdings eigenen ganzen bereich wie neben aufgaben notizen und routinen“). Meine Annahmen, ihm genannt: ein Stundenlohn je Eintrag (vorbelegt mit dem letzten), Pause in Minuten, Punkte trägt er je Termin selbst ein, Summen über alle Zeit. Offen an ihn: Punkte je Semester getrennt? Soll je Fach? Mehrere Jobs? Am iPhone noch nicht gesehen (Zeitfelder „Von/Bis“ zeigen dort das Rad; fünf Umschalter in einer Reihe).
- v71 behebt seinen Fund (Bildschirmfoto 18.11., 23:47: Betrag im Budget mit blauem Rand, keine Tastatur): Der Fokus kam 60 ms nach dem Tipp, jetzt sofort in allen Blättern. Am iPhone noch nicht bestätigt. Auf seinem Foto standen die Konten „Girokonto“ und „PayPal“ (noch nicht in „Trade Republic“ umbenannt).
- iPhone-App: Bei ihm läuft 0.4 („gültig bis 24. November“), soweit bekannt. Im Release „iphone-test“ liegt seit 18.11. abends Fassung 0.6 (Schnelleingabe mit Ausgabe/Einnahme und Konto, Sicherung von selbst, Läufe von der Apple Watch über Kurzbefehle, „Ausgabe eintragen“ mit Konto, neues Symbol). Gebaut bei Codemagic (Bau `6afdebc71ae4e76cb30891f0`, Selbsttest bestanden, `Track.ipa` 1.907.012 Bytes, Prüfsumme im Release geprüft). Die Bilder auf dem Zweig `ios-bild` stammen noch vom GitHub-Bau von 0.5. Ihm gemeldet; ob er installiert hat, ist offen. Am iPhone ist von 0.5/0.6 noch nichts geprüft.
- Kurzbefehle: Er hat bisher nur den zum Erneuern („habe nur befehl für auto refresh“, 18.11. abends). Die Anleitung für die drei Automationen (Apple Pay, „Lauf merken“, „Läufe übernehmen“ mit Strecke und Puls) und die drei Einstellungen in der App (Konto in „Trade Republic“ umbenennen, feste Posten mit Konto und Tag, Ordner für die Sicherung in iCloud) hat er in einem Stück bekommen. Rat an ihn: mit Apple Pay anfangen. Hakt etwas: Bildschirmfoto der Automation bzw. der aufgeklappten Zeile „Apple Watch“ erbitten.
- Er testet die App seit 18.11. ausgiebig und meldet sich; Rückmeldung am iPhone steht aus.
- Projektdateien gestrafft (18.11. abends, sein „mach das“): Alles zur iPhone-App steht in `IPHONE.md` und wird nur bei Bedarf gelesen; `CLAUDE.md` trägt davon nur den Kern. Erledigte Aufträge sind hier gestrichen (ihr Wissen steht in den beiden anderen Dateien).
- Sparsam arbeiten (Regeln in `CLAUDE.md` unter „Zusammenarbeit“): Er fragte am 19.11., wie er weniger Limit verbraucht. Geraten: neue Sitzung je Thema, Wünsche sammeln, für Kleines ein kleineres Modell, kurze Antworten. Ein Mac senkt den Verbrauch nicht; er brächte nur der iPhone-App etwas (Health mit kostenloser Apple-ID über Xcode und signierte Kurzbefehle: nachgelesen, nie ausprobiert). Der Nutzer wollte sein Claude-Abo widerrufen („das Limit reicht nicht“, 17.11.).
- Übergabe (19.11.): Auf seinen Wunsch ist alles für eine neue Sitzung vorbereitet. Mein Fehler dabei: Ich hatte nicht geprüft, wo eine neue Sitzung beginnt. Sie begann auf dem Standardzweig `claude/app-entwicklung-verschieben-af0kew` (v63) und meldete ihm einen alten Stand (sein Bildschirmfoto). Behoben: Dieser Zweig steht jetzt auf dem Stand von `main`; ihm geraten, die alte neue Sitzung zu schließen, neu zu beginnen und den Standardzweig bei GitHub auf `main` zu stellen (Regel dazu in `CLAUDE.md` unter „Veröffentlichen“).
- Zweige: `main` ist seit 19.11. der Standardzweig bei GitHub (von ihm umgestellt, geprüft). Die alten Zweige `claude/nifty-hamilton-gyakdi` und `claude/app-entwicklung-verschieben-af0kew` werden nicht mehr gebraucht. Seine neue Sitzung vom 19.11. meldete richtig v73. Keine offenen Pull Requests oder Issues.
- Freigaben gelten nur je Sitzung. In der Sitzung vom 17. bis 19.11. hieß es „du hast alle berechtigungen“; in einer neuen Sitzung neu erfragen, außer er schreibt es gleich dazu.
- Umgebung: „Meine-App“ (persönlich; erlaubt `api.codemagic.io`, Schlüssel für Codemagic hinterlegt). Nur dort lässt sich die iPhone-App über Codemagic bauen; in „Default“ geht alles andere. `node tests/live.js` geht in beiden nicht (Pages-Adresse nicht erlaubt); Ersatz: der Lauf „pages build and deployment“ bei GitHub.

## Gesammelte Wünsche (nur gemerkt, nichts gebaut; auf sein Zeichen alles in einem Zug)
- Aufgaben raus (20.11.: „merke ich mir so und ist zu viel“). Betrifft: Umschalter „Aufgaben“ im Planer, Aufgaben auf Heute samt „Alle n“, Kalender-Modus `task`, Zeile „Aufgaben“ in Woche und Monat, „Als Aufgabe“ im Blatt der Notiz, Blatt `asheet`, Tests, Wochenleiste der Aufgaben. Vor dem Bau klären oder so lösen: vorhandene Aufgaben bleiben gespeichert und in der Sicherung, werden nur nicht mehr gezeigt (nichts geht verloren); prüfen, ob Widget „Heute“ und `hStand()` Aufgaben mitschicken (`IPHONE.md`), das ginge ohne neue Installation nur auf der Seite des Inhalts.
- Gewicht aus Health übernehmen (20.11.). Weg wie bei den Läufen, weil Health direkt mit seiner Installation nicht geht: neue Aktion für Kurzbefehle („Gewicht eintragen“ mit Wert und Tag, über `eingang.json`), er baut eine Automation „Health-Messungen suchen (Gewicht)“ → Aktion. Braucht eine neue Installation (Änderung unter `ios/`, bisher gibt es dort nur `trackpunkt://neu/gewicht`, das das Blatt öffnet) und im Inhalt die Übernahme in `hEingang()`. Zu klären beim Bau: vorhandene Einträge von Hand nie überschreiben; ältere Messungen einmalig nachholen; womit er wiegt (Waage mit App, die in Health schreibt, oder von Hand in Health). Vorher `IPHONE.md` lesen.

## Offene Vorschläge (nichts davon gebaut; nur auf Zuruf)
Auf seine Frage „was würdest du jetzt noch ändern oder hinzufügen mit wirklich mehrwert?“ (18.11.):
1. Zuerst das Gebaute am iPhone zum Laufen bringen (0.6, Kurzbefehle, Ordner für die Sicherung).
2. Routine von selbst abhaken, wenn ein Lauf ankommt oder eine Gym-Einheit beendet wird.
3. Zwei Rechenkanten beheben (siehe „Offene Probleme“: neues Konto zählt als Plus; geänderte Tage einer Routine brechen die Serie).
4. Seine Entscheidung: Entwickler-Konto von Apple (99 US-Dollar im Jahr) für echtes Health und kein Erneuern alle 7 Tage.
5. Routinen mit eigenem Takt („jeden zweiten Tag“), wie seit v69 bei den Aufgaben: vorgeschlagen, Antwort steht aus.
Bewusst nicht: weitere Felder, weitere Graphen, Bankanbindung, tägliche Abfragen.

Ältere Vorschläge:
- Aufgaben und Notizen: Suche auch in den Aufgaben; Wiederholung „werktags“; Ordner umbenennen; Kalender der Aufgaben zeigt keine künftigen Termine.
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
- v20–v59: Umzug ins Repository; dunkler, kompakter Look; GitHub Pages; Selbst-Aktualisierung; Gym nach Vorbild Alpha Progression; Finanzen mit Vermögen, Sparzielen, Konten; Tests; Wischgesten, Graphen ablesen, „Rückgängig“, eigene Kategorien; Aufgaben und Notizen; Kennfarben; Schnell-Knöpfe gekürzt; Tages-Check (Schlaf) gebaut und wieder entfernt; Monatsabschluss und Kurzbefehl-Adresse.
- v60–v61 mit iPhone-App 0.2 und 0.3: Verbindung zwischen App-Inhalt und iPhone-Teil; Mitteilungen; Widgets „Heute“ und „Notizen“ (mit Abhaken); Aktionen für Kurzbefehle.
- v62–v63 mit iPhone-App 0.4: Blätter rücken über die Tastatur; Schnelleingabe aus dem Widget.
- v64: Aufgeräumte Oberfläche (Klappzeilen mit Anzahl, kleines Plus in der Überschrift, Heute als Kurzform), dazu viele behobene Fehler; Tests laufen an jedem Tag im Monat. Gebaut ohne Rückfrage; wünscht er eine Liste wieder offen, ist das eine Zeile (Zeilen direkt statt über `foldHTML`).
- v65 mit iPhone-App 0.5: Schnelleingabe mit Ausgabe/Einnahme und Konto; Sicherung von selbst; Läufe von der Apple Watch über Kurzbefehle (drei Aktionen, Zeile „Apple Watch“); „Ausgabe eintragen“ mit Konto.
- v66: Cardio ruhiger („Letzter Lauf“ als Klappzeile, Vergleich der Effizienz in der Kachel). Die übrigen Bereiche danach durchgesehen und nichts geändert.
- v67: In „Letzter Lauf“ steht rechts die Effizienz statt der Pace; von selbst gebuchte Ausgaben bekommen die Kategorie des Händlers.
- v68–v69: Aufgaben mit eigenem Takt „Alle … Tage/Wochen“, gezählt ab dem Starttag.
- v70 mit iPhone-App 0.6: neues App-Symbol (schwarz mit blauem Schein).
- v71: Die Tastatur geht in allen Blättern sofort auf (Fokus ohne Wartezeit).
- v72–v73: „Arbeit“ (Arbeitszeiten, Verdienst je Monat als Klappzeile) und „Uni“ (Termine mit Fach und Punkten, Summe je Fach), seit v73 als eigene Teile oben im Planer.

## Offene Probleme
- Die Tests laufen im Test-Browser und im Simulator; am echten iPhone prüft nur der Nutzer. Dort bestätigt: Die iPhone-App startet, eine neue Installation ersetzt die alte ohne Datenverlust, neue Versionen des Inhalts kommen von selbst, die Sicherung lässt sich einlesen, die Automation zum Erneuern läuft durch, Schnelleingabe aus dem Widget geht (0.4), Health fehlt wie erwartet. Seine Läufe sind Laufband-Läufe.
- Bewusst nicht behoben (bräuchten eine Entscheidung oder ein neues Feld):
  - Routinen: Geänderte Tage gelten auch rückwirkend; ein nachträglich hinzugefügter Tag bricht die Serie (bräuchte ein Feld „gilt seit“). „Tage in Folge“, „Bestwert“ und „insgesamt“ zählen nur ab dem 1. Januar des Vorjahres.
  - Vermögen: Bekommt ein neues Konto seinen ersten Stand später als die übrigen, zählt der ganze Stand als Plus des Monats (Abhilfe: den Stand auch im Vormonat eintragen).
  - Läufe von selbst: Ein zweiter echter Lauf am selben Tag mit ähnlicher Strecke kommt nie an.
  - Gym: Eine Einheit nachträglich von Hand anlegen geht nicht; der Code-Zweig dafür in `openK()` ist unerreichbar. Ihn fragen, ob er das braucht, sonst entfernen.
  - Training: Bleibt die App über den Monatswechsel offen, zeigt Training noch den alten Monat (Finanzen gehen mit).
  - Eine offene „i“-Erklärung schließt sich, wenn man im Graphen den Zeitraum wechselt.
  - Monatliche Aufgabe: Löscht man die erledigte Vorgängerin, bleibt nach einem kurzen Monat der frühere Tag.
- Negative Kontostände lassen sich speichern, aber auf dem iPhone nicht eintippen (Zahlentastatur ohne Minus).
- Feste Posten, deren Tag im Monat des eingetragenen Stands schon vorbei ist, zählen erst ab dem Folgemonat (gewollt). Buchungen ohne Konto aus der Zeit vor v42 zählen nicht, bis er das Konto nachträgt (Zeile „Ohne Konto“).
- `healBal()` wirkt nur im November 2026: Ab Dezember 2026 samt Prüfung entfernen.
- Erledigte Aufgaben: gezeigt werden die letzten 50, ältere bleiben gespeichert.
- Alte CSS-Regeln, die weiter unten überschrieben werden, sind nicht zusammengeführt (nur mit Bildvergleich anfassen).
- Der Gesten-Test ist zeitempfindlich: bei einem einzelnen Fehlschlag dort einzeln wiederholen.

## Am iPhone noch zu prüfen (Rückmeldung steht aus)
- Fassung 0.6: Installation über AltStore mit „Keep App Extensions“; neues Symbol; Zeile „Sicherung“ und einmal „Ordner in iCloud wählen“; Schnelleingabe „Ausgabe“ mit seinen Konten; legt „Sicherung speichern“ von Hand eine Datei ab?
- Kurzbefehle: feuert „Apple Watch-Training“ bei gesperrtem iPhone; nimmt der Datumsfilter Beginn und Ende; kommen Betrag und Händler aus „Transaktion“ an?
- Erneuern: Steht der Zähler in AltStore nach einigen Tagen von selbst wieder bei 7?
- Oberfläche (v64, v66): übersichtlich genug, oder fehlt eine eingeklappte Liste? Trifft man das kleine Plus und „Alle n“, ohne die erste Zeile zu erwischen? Reicht eine Zeile je Notiz auf Heute?
- Arbeit und Uni (v73): Stehen die fünf Umschalter oben im Planer in einer Reihe, ohne gequetscht zu wirken? Lassen sich „Von“ und „Bis“ gut einstellen (Rad von iOS), ragen die Zeitfelder nicht hinaus? Stimmen seine Zahlen?
- Monatsabschluss (v59): dritter Umschalter „Monat“; Hinweis am Monatsanfang.
- Eingaben: Umschalter Ausgabe/Einnahme im Blatt gut zu sehen (v56)? Geht seit v71 beim Betrag (Budget, Schnell-Knopf), beim Gewicht und beim Lauf die Tastatur sofort auf? Geht sie bei „+ Notiz“ sofort auf, legt Enter die Notiz an und bleibt das Feld offen (v51, v54)?
- Größen und Farben (v52, v55): etwas zu klein zum Lesen oder Treffen? Kreis zum Abhaken? Farbiges Plus in den Schnell-Knöpfen?
- Gesten (v44, v45): Blatt wegziehen, zwischen Monaten wischen (löst es beim Scrollen aus?), Graph ablesen, „Rückgängig“ über der Leiste unten.
- Aufgaben (v50, v69): erscheint nach dem Abhaken die nächste unter „Demnächst“? Bleibt die Tastatur bei der Suche in den Notizen offen?
- Finanzen (v42): Rechnet das Vermögen nach einer Buchung mit, ist das Konto im Blatt schon gewählt?
- Ältere Punkte: Datumsfeld bei „Einheit ändern“, Monatsfeld im Blatt „Stand eintragen“, Konto-Chips bei mehreren Konten, Kontoname ändern.

## Nächste Schritte
- Zu Beginn einer neuen Sitzung: `CLAUDE.md` und diese Datei lesen (das genügt), seinen Wunsch umsetzen, kurz antworten. `IPHONE.md` nur, wenn es um die iPhone-App geht.
- Der Nutzer entscheidet, was als Nächstes kommt. Erwartet wird seine Rückmeldung vom iPhone: v73 (fünf Umschalter im Planer, „Arbeit“, „Uni“), v71 (Tastatur beim Betrag), Fassung 0.6 und die drei Automationen (je mit Bildschirmfoto).
- Offene Fragen an ihn: Punkte je Semester getrennt? Soll je Fach als Ziel? Sollen die Antworten künftig noch kürzer sein?
- Bei Änderungen am Aussehen erst ein Bild „jetzt / Vorschlag“ zeigen.
