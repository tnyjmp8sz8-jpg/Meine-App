# Track. – Projektwissen (App-Stand v73)

## Regeln für dieses Dokument (immer befolgen)
Halte diese Datei und `PROGRESS.md` selbstständig aktuell, ohne dass der Nutzer darum bittet:
- Zu Beginn jeder Sitzung und nach jedem Zusammenfassen des Verlaufs: beide Dateien lesen, bevor etwas geändert wird.
- `IPHONE.md` (alles rund um die iPhone-App) und `BEREICHE.md` (Einzelheiten je Bereich der App) sind Nachschlagewerke. Sie werden nur bei Bedarf gelesen und genauso gepflegt. Warum getrennt (18.11.2026, sein „mach das“ auf meinen Vorschlag): Diese Datei wird in jeder Sitzung ganz gelesen und kostet jedes Mal von seinem knappen Limit.
- Nach jedem abgeschlossenen Feature, Bugfix oder Arbeitsschritt: `PROGRESS.md` aktualisieren (Erledigt, Aktueller Stand, Offene Probleme, Nächste Schritte).
- Bei jeder neuen Entscheidung zu Stack, Architektur, Datenmodell, Konventionen, Design oder Vorlieben des Nutzers: diese Datei aktualisieren, mit kurzem Warum.
- Veraltete Infos ersetzen oder löschen, nicht nur anhängen. Die Versionsnummer in der Überschrift und in „Veröffentlichen“ mitziehen.
- Beide Dateien kompakt halten: Stichpunkte, keine Code-Blöcke, keine Logs. In `PROGRESS.md` unter „Erledigt“ nur die letzten rund zehn Versionen, Älteres in einem Satz.
- Regelmäßig sichern (Wunsch des Nutzers): Nach jedem Arbeitsschritt committen und hochladen, auch Zwischenstände dieser beiden Dateien. Nichts bleibt nur im Arbeitsordner liegen. Warum: Die Cloud-Umgebung der Sitzung wird nach einer Pause gelöscht.
- Sagt der Nutzer „zusammenfassen“, „compact“ oder „Pause“: zuerst beide Dateien aktualisieren und hochladen, dann kurz bestätigen.
- Selbst sortieren (sein Wunsch, 22.11.2026: „regelmäßig selbst sortieren“): Nach jedem veröffentlichten Thema die Projektdateien durchgehen, Erledigtes und Doppeltes streichen, Einzelheiten in die Nachschlagewerke schieben. Diese Datei soll klein bleiben.
- Freigaben: Veröffentlichen nach `main` ist dauerhaft erlaubt (siehe „Veröffentlichen“, von ihm am 22.11.2026 ausdrücklich so gewollt). Andere Freigaben gelten nur für die laufende Sitzung und werden hier nicht eingetragen.

## Projekt
- Ziel: eine persönliche All-in-one-App für den Alltag, clean, modern, angenehm, alltagstauglich. Sie soll den Nutzer weiterbringen (Fortschritt sichtbar machen), nicht nur Daten sammeln.
- Zielgruppe: der Nutzer selbst, auf dem iPhone als App auf dem Home-Bildschirm. Weitergabe an andere ist nur eine Idee. Einschätzung dazu: als Geschäft schwierig; stark wären Zusammenhänge zwischen den Bereichen und „privat, ohne Konto, ohne Abo“.
- Name: „Track.“ mit Punkt (früher „Takt“). Oberfläche und Code-Kommentare auf Deutsch.
- Kernfunktionen:
  - Heute: Wochenleiste, Schnell-Knöpfe, Notizen, Routinen des Tages direkt startbar, Aufgaben des Tages, Übersicht der Bereiche als Liste mit farbigem Symbol, Wochenansicht mit Vergleich zur Vorwoche und Zusammenhängen, Monatsansicht mit Vergleich zum Vormonat (Monatsabschluss, v59), Sicherung speichern/einlesen mit Erinnerung.
  - Routinen: tägliche Zeitblöcke mit Timer, Serien, Kalender. Im selben Bereich (Umschalter oben) seit v49: „Aufgaben“ (To-do mit Datum, Ordnern, Wiederholung) und „Notizen“ (schnelle Aufnahme in Sekunden: nur Text, jede mit Kreis, Abhaken löscht). Der Nutzer will damit seine Notizen-App ersetzen, für Uni, Promotion und Alltag, und braucht alles nur auf dem Handy.
  - Gewicht: Einträge, 7-Tage-Schnitt, Graph, Ziel mit Prognose.
  - Finanzen: „Vermögen“ (Konten, monatlicher Stand, Plus/Minus, Sparziele) und „Budget“ (Einnahmen, Fixkosten, flexible Ausgaben, Budgets je Kategorie, Sparquote).
  - Training: „Cardio“ (Läufe, Pace, Effizienz) und „Gym“ (Pläne, laufendes Training, Übungen, Recap für Monat und Jahr).

## Tech-Stack
- Reines HTML, CSS und JavaScript in einer Datei. Kein Build, keine Abhängigkeiten, kein Server, kein Konto.
- PWA: Service Worker (`sw.js`) und Manifest; läuft komplett offline, lädt nichts von fremden Servern.
- Daten nur in `localStorage` auf dem Gerät.
- Auslieferung: GitHub Pages aus dem Zweig `main` des öffentlichen Repositorys, Adresse https://tnyjmp8sz8-jpg.github.io/Meine-App/

## Architektur & wichtige Dateien
- `index.html`: die ganze App. CSS im `<style>`, alle Blätter als `<dialog>`, JavaScript als eine IIFE im `<script>`.
- `sw.js`: cache-first mit Aktualisierung im Hintergrund; der Cache-Name `takt-vN` trägt die Versionsnummer.
- `manifest.webmanifest`, `icon-180/192/512.png`: Installation auf dem Home-Bildschirm. `.nojekyll` für Pages. Das Symbol (steigende blaue Linie mit hellem Punkt auf fast schwarzem Grund mit blauem Schein; seit v70, vom Nutzer nach Vorschaubild aus drei Vorschlägen gewählt: „schwarz mit schein“; die Linie gibt es seit v47) erzeugt `node tests/symbol.js` aus einem SVG im Skript, dazu `ios/App/Assets.xcassets/AppIcon.appiconset/icon-1024.png` für die iPhone-App. Auf dem Home-Bildschirm ändert es sich erst mit einer neuen Installation.
- `start/`: einfarbige Startbilder fürs iPhone (hell und dunkel, je Gerätegröße), erzeugt mit `tests/startbilder.py`; die Zeilen dazu stehen im `<head>`. Bewusst ohne Schriftzug, damit das Startbild nahtlos in die App übergeht. Neue iPhone-Größe: im Skript ergänzen und neu erzeugen.
- `CLAUDE.md` (dieses Wissen), `IPHONE.md` und `BEREICHE.md` (nur bei Bedarf), `PROGRESS.md` (Stand, Offenes, nächste Schritte).
- `tests/`: Tests und Bildschirmfotos (siehe „Testen“ und `tests/LIESMICH.md`). Gehören nicht zur App; der Service Worker speichert sie nicht.
- Abschnitte im Script, markiert mit `/* ---------- Name ---------- */`: helpers, state, persistence, actions, render, sheet, Gewicht, Haushalt (= Finanzen), Finanzen: Vermögen und Sparziele, Training: Cardio, Training: Kraft (= Gym), Kraft: Pläne und laufendes Training, Aufgaben und Notizen, Heute und Woche, Datensicherung, Bereiche, Rückgängig, Graphen ablesen, Feinschliff, Wischgesten, iPhone-Hülle, boot.
- Muster je Bereich: eine `render…`-Funktion schreibt das HTML ihrer `.view` neu; ein Klick-Listener je Bereich wertet `data-…`-Attribute aus (`data-h` Heute, `data-w` Gewicht, `data-m` Finanzen, `data-t` Training, `data-k` Gym, `data-la` laufendes Training, `data-x`/`data-xr` Blatt der Übung). Für alle Bereiche gemeinsam: `data-fold` (Klappzeilen, siehe unten).
- Bereiche und IDs im Code: `heute`, `routinen` (in der Leiste unten „Planer“, seit v54, weil dort auch Aufgaben und Notizen liegen), `gewicht`, `haushalt` (Finanzen), `training`. Im Code heißt Gym „kraft“.
- Wochenleiste in jedem Bereich (Heute, Routinen, Aufgaben, Gewicht, Budget, Cardio, Gym; im Vermögen und bei den Notizen gab es sie nie): Ein Tipp auf einen Tag öffnet den Kalender des Bereichs. In v44 hatte ich sie aus Gewicht, Finanzen und Training entfernt; der Nutzer wollte sie zurück (v46).
- Wochenleiste und Kalender: `weekStripHTML(mode)`, `calMarks(mode)`, `calHTML()`, `calDayHTML()`, `openCal(mode, tag)`; Modi `all`, `rout`, `task`, `weight`, `money`, `cardio`, `gym`.
- Gemeinsame Bausteine: `fig()` Kennzahl-Kachel (ohne Wert, also mit Strich, entsteht keine Kachel; die übrigen teilen sich die Breite, seit v54), `kvRow()` Zeile mit Wert und Vergleich, `navHTML()` Pfeile für Monat/Jahr mit mittigem Titel (Knöpfe tragen `data-m="prev|next"` in `.mnav`), `segMY()` Umschalter Monat/Jahr als eigene Reihe darüber, `INFO(id)` kleines „i“, das den Text `#info-id` zeigt, `scrubAttr()` macht einen Graphen ablesbar, `seriesSVG()` Liniengraph, `kmBarsSVG()` Balken je Monat, `monthsHTML(items, key, info)` Liste nach Monaten (Gewicht), `heroM()`/`kHero()` große Zahl, `emptyHTML(bereich, titel, satz, knöpfe)` leerer Bereich, `openDlg()` Blatt öffnen, `esc()` Text sicher ausgeben.
- Klappzeilen (v64): Verläufe und Stammdaten sind je eine eingeklappte Zeile mit Anzahl. Ob sie offen ist, steht nur in `fo` (Schlüssel → offen) und wird nicht gespeichert. `foldHTML(key, titel, sub, rechts, zeilen, danach)` schreibt `data-fold="key"`; ein einziger Lauscher auf `#scroll` kehrt `aria-expanded` um und ruft `render()` (offene „i“-Erklärungen bleiben dabei stehen). Neue Klappzeile: nur `foldHTML` mit neuem, eindeutigem Schlüssel, kein eigener Merker, kein eigener Lauscher.
  - Schlüssel: `eintraege` (Gewicht; Monate darin `eintraege-JJJJ-MM`), `ausgaben`, `einnahmen`, `fixkosten`, `budgetMonate`, `kategorien`, `umbuchungen`, `ohneKonto`, `vermMonate`, `letzterLauf`, `laeufe`, `cardioMonate`, `uebungen` (Gym Monat und Jahr teilen ihn), `einheiten`, `gymMonate`, `uhr` (Läufe von der Apple Watch, nur in der iPhone-App ab 0.5), `erledigt`, `sicherung`, `arbeit-JJJJ-MM` (Arbeitszeiten je Monat), `uni-kons`, `uni-paro`, `uni-proth` (Termine je Fach). `foldHTML` hat einen siebten Wert `auf`: So startet eine Zeile ohne Merker offen (der laufende Monat der Arbeitszeiten).
  - `foldsShut()` löscht alle Schlüssel, wenn der Bereich wechselt (`show(v, true)`: Leiste unten, Übersicht auf Heute, „Alle n“): Der erste Blick ist immer derselbe. Innerhalb eines Bereichs (Blättern, Blatt, Speichern, Umschalter oben) bleibt Offenes offen.
  - Fallen: Der Lauscher liest `aria-expanded`, nicht `fo`, weil in `monthsHTML()` ohne Merker so viele der jüngsten Monate offen sind, dass die letzten drei Einträge zu sehen sind (sonst läge am Monatsersten der Eintrag von gestern zwei Tipps weiter weg). Wächst ein Inhalt unbegrenzt (Einträge im Gewicht), erst bei offener Zeile bauen: `render()` läuft bei jedem Tipp auf eine Klappzeile und bei jedem Wechsel des Bereichs. Jedes andere Neuzeichnen (z. B. Auswahl im Graphen) schließt eine offene Erklärung noch.
  - Dazu gehören: `secHTML(titel, klein, aktion)` Überschrift, `secAct(attr, text, label)` kleines Plus oder „+ Wort“ rechts in der Überschrift, `addFoldHTML(attr, titel)` Zeile mit Plus für leere Stammdaten (Budgets, Einnahmen, Fixkosten, Sparziele; es gibt keine Überschrift ohne Inhalt), `actRow(attr, text, plus)` letzte Zeile einer offenen Liste, `allAct(was, n)` „Alle n ›“ auf Heute. `.linkbtn` und `.links` gibt es nur noch in Blättern: Für „Hinzufügen“ in einem Bereich `secAct` oder `actRow` nehmen.
- Einzelheiten stehen in `BEREICHE.md`, in Abschnitten: „Bereiche“ (Finanzen, Planer mit Aufgaben, Notizen, Arbeit, Uni, Heute, Kurzbefehl-Adresse, Training: Funktionen, Blätter, Rechenwege), „Entscheidungen je Bereich“, „Datenmodell“, „Testen“. Vor jeder Änderung den passenden Abschnitt lesen (suchen, nicht die ganze Datei); ohne das nichts an einem Bereich bauen.
- Verbindung zur iPhone-App (Abschnitt „iPhone-Hülle“ im Script): `HUELLE` (`window.webkit.messageHandlers.track`) gibt es nur in der iPhone-App, im Browser bleibt alles ohne Wirkung. Hin geht der Stand (`hStand()` über `hSoon()` aus `saveLocal()`: Widget, Konten, Sicherung), zurück ruft die iPhone-App `window.TrackHuelle` (`info`, `eingang`, `laeufe`, `neu`, `gesichert`, `sichern`). Dazu gehören `hEingang()` (Aufträge aus Widget und Kurzbefehlen), `healthRuns()` (Läufe von selbst), die Sicherung von selbst, die Tastatur-Höhe `--kb` und die Klappzeile `uhr`. Der genaue Vertrag steht in `IPHONE.md`: vor jeder Änderung dort lesen.

## iPhone-App (Kern; alles Weitere in `IPHONE.md`)
- Vor jeder Arbeit an `ios/`, am Abschnitt „iPhone-Hülle“, am Bau oder Download, und bevor dem Nutzer etwas zu AltStore, Kurzbefehlen, Widget, Health oder Sicherung gesagt wird: `IPHONE.md` lesen (Aufbau der Swift-Dateien, Vertrag, Bau über Codemagic und GitHub, Selbsttest, sein Weg mit AltStore, Recherchen und Grenzen).
- Wortwahl gegenüber dem Nutzer: „App“ für den Inhalt, „neue Installation“ für eine neue IPA. Er stolperte über „Web-App“ und „Hülle“ (17.11.).
- Der Inhalt bleibt `index.html` und wird nicht in Swift neu geschrieben: Die iPhone-App (Ordner `ios/`, Swift, Widget, Aktionen für Kurzbefehle) zeigt ihn an und holt neue Versionen von selbst von GitHub Pages, sobald die Nummer in der Fußzeile höher ist. Eine neue Installation braucht es nur für Änderungen unter `ios/`.
- Darf sich nie ändern, sonst sind seine Daten oder seine Kurzbefehle weg: die Adresse `trackapp://lokal/index.html` (daran hängt der Speicher), die Kennungen `de.trackapp.track` und `de.trackapp.track.Widget`, die App-Gruppe mit `stand.json` und `eingang.json`, die Namen und Feldnamen der Aktionen (`NotizHinzufuegen`, `AusgabeEintragen`, `LaufMerken`, `LaufZeitraum`, `LaufEintragen`).
- Stand: Bei ihm läuft seit 17.11.2026 die iPhone-App (zuletzt bestätigt: Fassung 0.4). Fassung 0.6 liegt im Release „iphone-test“; welche er installiert hat, steht in `PROGRESS.md`.
- Achtung: Jede Änderung unter `ios/` auf einem `claude/…`-Zweig startet den Bau bei GitHub und ersetzt das Release (außer mit „[skip ci]“ in der Nachricht). Bei GitHub fehlt oft ein freier Mac; dann über Codemagic bauen (`bash ios/cm.sh`, braucht die Umgebung „Meine-App“).
- Download für ihn: immer https://github.com/tnyjmp8sz8-jpg/Meine-App/releases/download/iphone-test/Track.ipa, nie der Link von Codemagic. Installieren: vorher Sicherung speichern, alte `Track.ipa` in „Dateien“ löschen, AltStore „My Apps“ → „+“, bei Nachfrage „Keep App Extensions“.
- Grenzen, die feststehen: Health direkt geht mit seiner Installation (AltStore, kostenlose Apple-ID) nicht, nur mit dem Entwickler-Konto (99 US-Dollar im Jahr); Läufe kommen deshalb über Kurzbefehle. Fertige Kurzbefehle kann ich nicht liefern, nur Schritt für Schritt anleiten. Ein Widget kann keine Tastatur zeigen. Die App läuft nach 7 Tagen ab, seine Automation erneuert sie beim Anstecken des Ladegeräts.
- Lehren aus meinen Fehlern: Erst prüfen, dann zusagen. Bei allem, was am iPhone passiert, die Unsicherheit dazusagen und ein Bildschirmfoto erbitten; sein iOS zeigt Dinge anders als Anleitungen.
- Schlüssel und Passwörter nie in den Chat und nie ins Repository.

## Datenmodell
- Ein Eintrag `takt.v1` in `localStorage`: `{ S, LY, W, MF, MY, T, K, N }` (Routinen, ihr Tagesprotokoll, Gewicht, Finanzen fest, Buchungen je Jahr, Läufe, Gym, Planer). Alle Felder und die weiteren Schlüssel stehen in `BEREICHE.md` unter „Datenmodell“: vor jeder Änderung an gespeicherten Daten dort lesen.
- Datumsschlüssel `YYYY-MM-DD` in Ortszeit, Monate `YYYY-MM`, Geld in Cent.
- Jede Gruppe läuft beim Laden durch eine `norm…`-Funktion: neue Felder dort eintragen, sonst gehen sie beim Laden verloren.
- Ändern nur über `patchW()` bzw. `mfdoc`, `mdoc(jahr)`, `tdoc`, `kdoc`, `ndoc` mit `.patch({…})`; `null` löscht (der Schlüssel kann mit `null` stehen bleiben, `stripNull()` räumt beim Einlesen auf). Routinen: `S` direkt und `setEntry()`. Jede Änderung endet in `saveLocal()`; wer daran vorbei schreibt („Rückgängig“ lädt den gemerkten Stand), ruft selbst `ensureTicker()` und `hSoon()`.
- Der zuletzt offene Bereich wird nicht gespeichert: Er steht nur im Hash der Adresse, ohne Hash öffnet Heute.
- Sicherung: JSON mit `app: 'takt'`. Einlesen ergänzt, gleiche Einträge werden überschrieben. Ausnahmen: Eine vorhandene Routine und ein vorhandenes Zielgewicht bleiben, ein laufendes Training wird nicht eingelesen.

## Entscheidungen (übergreifend; je Bereich in `BEREICHE.md`)
- Eine Datei ohne Build: einfach auszuliefern und für den Nutzer ohne Technik-Wissen tragbar.
- Nur lokale Daten, kein Server: privat und ohne Betrieb. Folge: Die Sicherung ist wichtig, deshalb die Erinnerung nach 7 Tagen (`backupDue()`, seit v45; vorher 14; `backupDay()` liefert den Tag, an dem sie fällig wird, auch für die Mitteilung der iPhone-App; ohne bisherige Sicherung zählt der älteste Eintrag, seit v64 auch Aufgaben und Notizen ab dem Tag des Anlegens). Speichern läuft auf dem iPhone über das Teilen-Menü („In Dateien sichern“). Automatisch sichern kann eine Web-App nicht.
- Alter Cloud-Abgleich und Google-Schrift entfernt (v22): nie aktiv bzw. unnötig, die App soll nichts nachladen.
- Interne Kennungen behalten den alten Namen (`takt.v1`, `takt.backup`, Cache `takt-vN`, `app: 'takt'`): Umbenennen würde die Daten des Nutzers oder alte Sicherungen unbrauchbar machen.
- Selbst-Aktualisierung (v24): Beim Öffnen sucht die App nach einem neuen `sw.js` und lädt einmal neu, sobald er übernimmt, aber nie bei offenem Blatt. Warum: Der Nutzer soll Updates ohne Zutun bekommen und keine Eingabe verlieren.
- Versionshinweis in der Fußzeile: Der Nutzer prüft daran, ob ein Update angekommen ist.
- Kopfzeile deckend, kein `backdrop-filter` (v37): Der Milchglas-Effekt machte auf dem iPhone beim Scrollen den Kopf selbst unscharf.
- Der Fokus ins erste Feld eines Blatts wird beim Öffnen sofort gesetzt, nie verzögert (`fokus(feld)` in allen Blättern, seit v71; `openN()` und `openA()` schon vorher): Das iPhone öffnet die Tastatur nur, wenn der Fokus direkt aus dem Tipp kommt. Am Gerät belegt (18.11., Bildschirmfoto): Mit 60 ms Wartezeit hatte der Betrag im Budget in der iPhone-App den blauen Rand, aber keine Tastatur; bei den Notizen (sofort) ging sie auf. Kein `setTimeout` vor einem Fokus, der eine Tastatur öffnen soll; `tests/eingabe.js` prüft es ohne Warten gleich nach dem Klick.
- Aufgeräumte Oberfläche (v64, Wunsch des Nutzers: „cleaner“, „auf den ersten Blick übersichtlich“, aber alle Funktionen bleiben): Offen steht nur, womit man arbeitet (Notizen, Aufgaben, Routinen, Pläne, Konten, Sparziele, Kategorien mit Budget, Kennzahlen, Graphen). Verläufe und Stammdaten (Einträge, Ausgaben, Einnahmen, Fixkosten, Läufe, Monate im Jahr, Umbuchungen, Erledigt, Übungen, Einheiten, Sicherung) sind je eine Klappzeile mit Anzahl, höchstens einen Tipp weiter weg. „Hinzufügen“ ist ein kleines Plus rechts in der Überschrift oder die letzte Zeile der offenen Liste, keine lose blaue Link-Zeile mehr. Verworfen nach drei gebauten Entwürfen: „nur Abstände und Farben beruhigen“ (zu wenig Wirkung) und „Hauptknöpfe als Pillen, Kacheln als eine Karte“ (fasst Vertrautes an).
- Blätter nur über `openDlg()`: Sonst zeichnet das iPhone einen Fokus-Rahmen um den ersten Knopf.
- Cardio, Gym-Einheiten und Budget zeigen nur den oben gewählten Monat; wachsende Listen ohne Monatswahl (Gewicht) werden nach Monaten gruppiert. Warum: Nichts darf mit der Zeit unübersichtlich werden.

## Code-Konventionen
- HTML wird als String gebaut: Nutzertexte immer durch `esc()`, auch Kennungen aus den Daten (Kategorie, Ordner) in `data-…`-Attributen; sie können aus einer eingelesenen Sicherung stammen.
- Prozent aus Cent rechnen, nicht aus einem Anteil als Kommazahl (0,29 × 100 ergibt 28,999…).
- Im Speicher bleibt Gelöschtes und beim Laden Verworfenes als Schlüssel mit `null` stehen: In Tests und Zählungen nur Werte zählen, nie Schlüssel.
- Falle `hidden`: Eine Klasse mit eigenem `display` (z. B. `display:flex`) schlägt das Attribut `hidden`; dann braucht sie eine Regel `.klasse[hidden]{display:none}` (v69: Die Zeile für den eigenen Takt war dadurch immer zu sehen, ein Test fand es).
- Farben nur über CSS-Variablen in `:root` (hell, dunkel per Systemeinstellung). `data-theme` steht im CSS, wird aber von nichts gesetzt; die dunkle Liste steht deshalb zweimal und muss an beiden Stellen gepflegt werden.
- Neue Größen in den bestehenden CSS-Blöcken ändern, keinen weiteren Überschreib-Block anhängen.
- Kommentare auf Deutsch, nur wo sie eine Absicht oder Falle erklären.
- Wortwahl in der Oberfläche: „Gym“ statt „Kraft“, „Finanzen“ statt „Haushalt“, „Einheit“ für ein Training, „Planer“ für den Bereich mit Routinen, Aufgaben und Notizen.
- Zahlen deutsch formatiert (`toLocaleString('de-DE')`), Euro über `eur()`, `eur0()`, `eurS()`, Kilogramm über `kg()`, `kgn()`.
- Kein toter Code: Unbenutztes entfernen.

## Design-Regeln (verbindlich)
- Modern, clean, Apple-artig. Dunkel: fast schwarzer, leicht bläulicher Grund (`--bg`), Karten eine Stufe heller.
- Apple-Feinschliff (v47): Pfeile für Monat/Jahr ohne Kreis in Akzentblau; aktiver Bereich in der Leiste unten mit gefülltem Symbol (Klassen `.f` Fläche, `.k`/`.d` ausgespart, `.b` kräftigere Linie); Linie unter der Kopfzeile erst beim Scrollen (`.top.scrolled`); Symbole mit rund 1,8 px Strich im Bild; leere Bereiche mittig mit Symbol, Titel, einem Satz, Knopf; die große Zahl zählt beim Blättern 0,3 s vom alten zum neuen Wert (nicht bei „Bewegung reduzieren“).
- Flächen ohne Rand, Trennlinien nur in Listen, Rundungen: Karten 16 px (seit v53, passend zu den kleineren Inhalten; vorher 20), Knöpfe 14 px, Chips als Pillen, Blätter mit Griff oben.
- Kompakt (seit v52 noch eine Stufe kleiner): Fließtext 14 px, Listen 13,5 px, Nebentexte 12 px, Abschnittstitel 15 px, Umschalter der Bereiche und „Track.“ 17 px, große Zahl höchstens 34 px, blauer Hauptknopf 40 px hoch. Maßstab ist die Wochenleiste (11 und 15 px): Sie „passt gut“ und bleibt, ebenso die Leiste unten und die Eingabefelder (16 px, sonst zoomt iOS). Nie die ganze Seite per `zoom` verkleinern: Das träfe auch die Eingabefelder.
- Tippflächen: Neues mindestens 40 px (Klappzeilen 42 px); kleinere Knöpfe bekommen per `::after` eine größere Tippfläche. Bestand darunter, vom Nutzer so gewohnt: Chips 32 px, Umschalter (`.seg`, `.seg2`, `.subtabs`) rund 28 px. Aktionen in der Überschrift (`.sec-a`) haben ihre Tippfläche nach oben gelegt; sie endet knapp 2 px vor der Liste darunter. Nicht nach unten vergrößern, sonst trifft ein Tipp auf die erste Zeile den Knopf.
- Akzentblau für Aktionen, Links und aktive Auswahl; daneben nur in Graphen und Balken, an einer laufenden Routine, als Kennfarbe des Planers und am Punkt von „Track.“ in der Kopfzeile (v48, vom Nutzer nach Vorschaubild gewählt). Grün = erledigt/besser, Rot = schlechter/löschen. Pro Ansicht ein blauer Hauptknopf, Nebenaktionen als `.ghost`.
- Kennfarben der Bereiche (Planer blau, Gewicht lila `--c-weight`, Finanzen orange `--c-money`, Training grün `--good`): am Symbol in der Übersicht auf Heute, am Plus der Schnell-Knöpfe auf Heute und am Symbol der leeren Seiten (`emptyHTML()` gibt `.e-ic` die Klasse des Bereichs; seit v55, vom Nutzer nach Vorschaubild gewählt). Nicht in der Leiste unten und nicht an Überschriften: Dort bliebe Blau nicht mehr „antippbar“, und es würde bunt.
- Systemschrift, große Zahlen mit `var(--round)`. Abschnittstitel fett und normal geschrieben.
- Erklärungen nie dauerhaft, sondern hinter `INFO()`. Ein „i“ am Ende einer Textzeile steht mit dem letzten Wort in einem Stück ohne Umbruch, sonst rutscht es allein in eine zweite Zeile. Bedienreihen (Wochenleiste, Monat/Jahr, Pfeile) bleiben je eine eigene Reihe: nicht zusammenlegen, um Platz zu sparen.
- Nur was nötig ist: keine erklärenden Texte ohne Nutzen, keine Töne, keine ungefragten Einstellungen, lange Listen einklappen.
- Erst das Wichtigste, der Rest eingeklappt (v64): Verläufe und Stammdaten als Klappzeile mit Anzahl (6 px Abstand untereinander, `.folds`), „Hinzufügen“ als kleines Plus in der Überschrift, keine Überschrift ohne Inhalt, in Listen trägt nur die Veränderung Farbe (grün/rot), der Wert davor nicht. Was auf Heute steht, ist eine Kurzform des Bereichs.
- Hell, dunkel und 320 px Breite müssen funktionieren. Nichts darf seitlich wischbar oder abgeschnitten sein.

## iPhone-Besonderheiten (im Test-Browser nicht sichtbar)
- Eingabefelder unter 16 px Schrift lassen iOS hineinzoomen.
- Datumsfelder brauchen `appearance:none` und eine Höchstbreite, sonst ragen sie hinaus.
- Die Zahlentastatur hat kein Minus.
- Die App auf dem Home-Bildschirm hat einen eigenen Speicher; ihr Name wird beim Hinzufügen festgelegt. Löschen des Symbols löscht die Daten: vorher Sicherung speichern.
- Solange ein Blatt offen ist, aktualisiert sich die App nicht.
- Kurzbefehle öffnen https-Adressen in Safari, und Safari hat einen anderen Speicher als die App auf dem Home-Bildschirm: Einträge dort landen nicht in der App. Laut Forenberichten öffnet die Adresse mit `webapp://` statt `https://` die installierte App (ab iOS 16.4, in iOS 26 ausgebaut); ein Bericht sagt, der Zusatz hinter der Adresse gehe dabei verloren. Nicht von Apple dokumentiert und am Gerät des Nutzers noch nicht bestätigt (Stand v59).
- Nach Änderungen an Blättern oder Layout den Nutzer bitten, am iPhone zu prüfen.

## Meine Vorlieben (aus Rückmeldungen des Nutzers)
- Der Look seit v21 ist „genau getroffen“: dunkel, ruhig, wenige farbige Akzente mit Bedeutung.
- Klein wirkt edler: alles kompakt, wie herausgezoomt; eine Ansicht darf dafür lang sein und scrollen. Nach v51 wollte er es noch kleiner („manches ist zu groß noch, noch mehr rauszoomen“), v52 hat große Zahl, Knöpfe, Zeilen und Überschriften verkleinert.
- Viel auf einen Blick: eine Liste statt mehrerer großer Karten; „Übungen“ und „Einheiten“ als eingeklappte Zeile mit Anzahl.
- Überall ein Plus oder Minus zum Zeitraum davor (Monat, Jahr, je Übung), grün oder rot.
- Die Wochenleiste mag er, in jedem Bereich („ich mochte das“, v46). Mein Umbau in v44 (Leiste weg, Kalender als Knopf oben, Pfeile und Monat/Jahr in einer Reihe) kam nicht an: „das November ist eingequetscht“. Zweites Mal dieselbe Lehre: nichts zusammenschieben, was vorher Luft hatte; Vertrautes nicht für „weniger Bedienung“ opfern, sondern vorher mit Bild fragen.
- In Zeilen mit Wert (`kvRow()`: Letzter Lauf, Woche, Sparquote) steht der Vergleich in einer eigenen Zeile unter dem Wert, nicht daneben. Der Nutzer fand das ruhiger; „daneben“ war ein Vorschlag von mir (v26), den er nach dem Ausprobieren zurückgenommen hat. Kompakt heißt für ihn nicht: alles in eine Zeile quetschen.
- Schnell-Knöpfe auf Heute nur für das, was er wirklich schnell einträgt (v56): Notiz, Gewicht, Ausgabe. „Aufgabe“, „Lauf“ und ein eigener Knopf „Einnahme“ flogen auf seinen Wunsch raus, ebenso das Tempo (km/h) beim Laufband. Lehre: lieber wenige Knöpfe und Felder, Seltenes eine Ebene tiefer.
- Kein Tages-Check: Die Zeile „Schlaf“ auf Heute (ein Tipp, 1 bis 5, mit Zusammenhängen in der Woche; v57, zur Probe) wollte er nach einem Tag nicht („nimm das mit Schlaf raus“, v58). Nicht wieder vorschlagen. Lehre: Er will nichts, was er täglich zusätzlich von Hand eintragen muss; ihn interessiert, was die App von selbst erledigen kann („weitere Automatisierungen“).
- Er will eine echte iPhone-App „wie eine fertige perfekte App“: Health, Widget, Mitteilungen, und sie soll von selbst laufen, ohne Erneuerung alle 7 Tage. Er hat einen Windows-11-PC, ein iPhone 12 Pro mit der neuesten iOS-Version, keinen Mac (v59). Stand und Wege stehen in `IPHONE.md`.
- Erfassen muss in Sekunden gehen: ein Tipp, tippen, fertig. Keine Pflichtfelder, keine Auswahl davor (Rückmeldung zu den Notizen, v51).
- Die farbigen Symbole der Bereiche auf Heute findet er „schön und cool“ (v54) und fragte, wo Farbe noch Sinn ergibt. Farbe darf also etwas mehr vorkommen, solange sie eine Bedeutung trägt (Farbe = Bereich). Meinen Vorschlag dazu hat er nach Bildern genau so übernommen (v55).
- Vorschaubilder kommen gut an: Für Änderungen am Aussehen erst ein Bild „jetzt / Vorschlag“ zeigen (im Test-Browser per eingefügtem CSS, ohne die App zu ändern), dann bauen. So sind v48 und v55 entstanden.
- Er bittet ausdrücklich, seine Aussagen zu prüfen („ich gehe nach intuition und lerne mit dir“, 18.11.): Vorschläge von ihm ernst nehmen, aber sagen, was daran stimmt und was ich anders lösen würde, mit Grund und Bild.
- „Cleaner“ (18.11., v64): Ihm war „noch zu viel zu unübersichtlich“, er mag aber alle Funktionen. Lösung siehe Entscheidungen (Klappzeilen). Gebaut ohne Rückfrage, während er schlief; seine Rückmeldung am iPhone steht aus und kann einzelne Zeilen wieder öffnen.
- Finanzen (18.11.): Er zahlt immer mit Apple Pay über Trade Republic und will den Stand „nie neu eingeben“: Zahlungen sollen von selbst gebucht werden (Automation in Kurzbefehle mit Auslöser für Wallet-Zahlungen und der Aktion „Ausgabe eintragen“ mit Konto; am Gerät ungeprüft), feste Posten zählen schon von selbst, wenn sie Konto und Tag tragen. Eine Bankanbindung habe ich ihm abgeraten (fremder Server, Konto, Kosten). Ehrlich bleiben: Zinsen, Überweisungen, Erstattungen und Depotwerte kommen so nicht an; dafür bleibt „Stand eintragen“ als Berichtigung.
- Beim Laufen zählt für ihn die Effizienz mehr als das Tempo (18.11.): Wo nur Platz für einen Vergleich ist, steht die Effizienz.
- Läufe: Er trägt immer die Zahlen der Apple Watch bzw. aus Apple Fitness ein, nie die Anzeige des Laufbands (18.11.). Was von selbst von der Uhr kommt, ist also genau seine Zahl.
- Arbeit und Uni (19.11.): Was für ihn ein eigenes Thema ist, will er als eigenen Teil oben im Umschalter sehen, nicht als Unterpunkt in einem Ordner. Ich hatte es zuerst in die Ordner der Notizen gelegt (seine Worte „Notizen-Bereich für Uni, Arbeit“); bei einem neuen Teil vorher mit Bild fragen, wo er liegen soll.
- Aufgaben will er nicht mehr (20.11.: „merke ich mir so und ist zu viel“); der Ausbau steht in `PROGRESS.md` unter „Gesammelte Wünsche“. Keine Vorschläge mehr zu Aufgaben.
- Ruhig: keine Töne, keine Ränder, keine Großbuchstaben-Labels.
- Im Zweifel die schlichtere Lösung, lieber etwas weglassen.
- Vorbild fürs Gym: Alpha Progression (Screenshots des Nutzers).

## Zusammenarbeit
- Sprache: Deutsch, einfache Worte, kurz. Der Nutzer ist kein Entwickler, arbeitet am iPhone und schickt Screenshots.
- Sparsam arbeiten: Sein Limit ist knapp (er fragte am 19.11. ausdrücklich nach weniger Verbrauch bei gleicher Qualität). Deshalb:
  - Stufe des Modells (sein Wunsch, 22.11.): Er arbeitet in Fable 5.2 auf „mittel“. Zu jedem Auftrag als Erstes in einem Satz ausdrücklich sagen, ob „mittel“ reicht oder ob er vorher auf „hoch“ schalten soll, und am Ende, wann er zurückschalten kann. „Hoch“ nur für: Änderungen am Datenmodell oder an Geld-Rechnungen (Kontostand, Vermögen), alles unter `ios/` und am Vertrag mit der iPhone-App, Fehler, deren Ursache nach dem ersten Nachstellen unklar ist, große Umbauten quer durch viele Abschnitte. „Mittel“ reicht für: Aussehen, Texte, neue Felder und Listen nach bestehendem Muster, Projektdateien, Wünsche merken, Fragen. Nie von mir aus höher arbeiten lassen als nötig.
  - Keine Arbeitsabläufe mit vielen Helfern (Ultracode), außer er verlangt es in der Sitzung selbst („bitte kein ultra code mehr nutzen“, 18.11.).
  - Eine Sitzung je Thema: Ist ein Thema fertig und veröffentlicht, ihm in einem Satz raten, für das nächste eine neue Sitzung zu beginnen (der Verlauf zählt bei jeder Nachricht mit). Alles Wissen steht in diesen Dateien.
  - Wünsche sammeln (sein Wunsch, 20.11.): Sagt er „erstmal nur merken“, den Wunsch nur in `PROGRESS.md` unter „Gesammelte Wünsche“ eintragen und hochladen, nichts bauen. Gebaut wird alles zusammen in einem Zug, sobald er es sagt.
  - Erst fragen, dann bauen, wenn bei einem neuen Teil unklar ist, wo er liegen oder wie er aufgebaut sein soll: eine kurze Frage kostet weniger als ein Umbau (v72 → v73).
  - Dateien nicht ganz lesen: `index.html` hat rund 4800 Zeilen, also suchen und Ausschnitte lesen. `IPHONE.md` nur bei Bedarf.
  - Tests: während der Arbeit nur die betroffene Reihe, alle Reihen einmal vor dem Veröffentlichen; die Ausgabe auf Fehler und Summen kürzen.
  - Nach dem Hochladen einmal rund 45 Sekunden warten (im Hintergrund), dann den Pages-Lauf einmal prüfen, nicht mehrfach abfragen.
  - Bilder nur, wenn etwas neu aussieht.
- Zu jeder Änderung einen eigenen, konkreten Verbesserungsvorschlag mitbringen: nur vorschlagen, nicht ungefragt umsetzen. Offene Vorschläge stehen in `PROGRESS.md`.
- Mitdenken ist ausdrücklich erwünscht („immer weiter so“): Was eine Idee des Nutzers braucht, damit sie im Alltag wirklich stimmt, gleich mitbauen und erklären (Beispiel: Zu Konten an Buchungen gehörten Umbuchungen und der Tag bei festen Posten).
- Nichts umsetzen, wovon man selbst nicht überzeugt ist. Ist ein Wunsch keine gute Idee, das offen sagen und eine bessere Lösung nennen. Eigene Fehler und falsche Vorschläge benennen.
- Antwort nach einer Änderung, kurz gehalten (je Punkt höchstens ein bis zwei Zeilen, was nicht zutrifft, entfällt): was neu ist, was bewusst anders gelöst wurde, wie getestet wurde, was nicht getestet werden konnte, welche Version live ist, ein Vorschlag in einem Satz. Keine Zwischenmeldungen, die nichts Neues sagen.
- Bei Ansichten, die neu aussehen, ein Bild mit Beispieldaten mitschicken.

## Veröffentlichen
- Bei jeder Änderung an `index.html`: Cache-Name in `sw.js` (`takt-v73` → `takt-v74`), `<span class="ver">v73</span>` in der Fußzeile und die Nummer in dieser Datei gemeinsam hochzählen. Die Stelle in der Fußzeile muss Zeichen für Zeichen so bleiben (keine weitere Klasse, kein Leerzeichen): Die iPhone-App erkennt daran eine neuere Fassung (`Web.version()`). Ohne neuen Cache-Namen sehen installierte Geräte die Änderung nicht. Reine Änderungen an den beiden Markdown-Dateien brauchen keine neue Version.
- Entwickelt wird auf dem Arbeitszweig der Sitzung. Was nach `main` geht, landet auf dem Handy des Nutzers. Alles Neue wird ohne Nachfrage direkt nach `main` veröffentlicht, sobald es fertig und getestet ist (sein Wunsch, 22.11.2026: „immer alles neues direkt veröffentlichen“; er kann es jederzeit zurücknehmen). Auch reine Änderungen an den Projektdateien gehen nach `main`: Eine neue Sitzung beginnt dort. Ausnahme bleibt, was er „erstmal nur merken“ nennt.
- Standardzweig bei GitHub ist `main` (seit 19.11.2026): Eine neue Sitzung beginnt dort. Trotzdem zu Beginn jeder Sitzung prüfen, dass der Arbeitsordner auf dem Stand von `main` ist (`git fetch origin main`, Überschrift dieser Datei vergleichen); wenn nicht, zuerst `main` holen und nichts auf dem alten Stand bauen. Warum: Einmal begann eine Sitzung auf einem alten Zweig und meldete v63 statt v73.
- Nach dem Hochladen warten, bis Pages die neue Version ausliefert (das `sw.js` der Adresse zeigt den neuen Cache-Namen), dann dem Nutzer die Version nennen.

## Testen (vor jeder Veröffentlichung)
- Der Gesten-Test ist zeitempfindlich (ein Wisch muss in 0,7 s durch sein): Schlägt in einem vollen Lauf nur dort etwas fehl, zuerst einzeln wiederholen.
- `node tests/alle.js` muss „Alle Tests stimmen“ melden (Reihen in `tests/lib.js`, `REIHEN`; einzelne Reihe: `node tests/<reihe>.js`). Welche Reihe was prüft, Hilfen (`oeffnen()`, `wischen()`, feste Uhr), Bildschirmfotos (`node tests/bilder.js <ordner> [2]`) und Fallen stehen in `BEREICHE.md` unter „Testen“: vor dem Schreiben eines Tests dort lesen.
- Nach dem Hochladen: `node tests/live.js` prüft die veröffentlichte App (Version, identisch mit dem Repository, offline). Das geht nur, wenn die Umgebung der Sitzung die Pages-Adresse erlaubt (in „Default“ nicht). Ersatz: über GitHub prüfen, dass der Lauf „pages build and deployment“ für den Commit auf `main` erfolgreich war (`actions_list`).
- Keine Testreihe darf vom Tag abhängen, an dem sie läuft (v64: mehrere schlugen am 1., 2. oder ab dem 28. fehl, weil „gestern“ im Vormonat lag oder Ansichten nur den laufenden Monat zeigen). Prüfen mit `node tests/am.js JJJJ-MM-TT [reihe …]` für einen 1., 2., 15., 28. und 31.; `oeffnen({ uhr })` stellt die Uhr der Seite (`tests/finanzen.js` läuft so auf dem 15.). Beispieldaten hängen vom Kalendertag ab: Sollwerte aus den Daten rechnen.
- Zu jeder neuen Funktion und jedem behobenen Fehler eine Prüfung in `tests/` ergänzen, mit der Rechnung als Kommentar. Rechenwerte immer von Hand nachrechnen.
- Meldet der Nutzer einen Fehler, zuerst seinen Fall nachstellen (seine Daten sind oft sehr klein: eine Übung, wenige Einheiten, alles im selben Monat). Auch an Daten denken, die mit einer älteren Version eingetragen wurden: Ihnen fehlen neuere Felder (so entstand der Fehler vor v42).
- Was Tests nicht zeigen, steht unter „iPhone-Besonderheiten“.
