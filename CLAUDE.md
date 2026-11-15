# Track. – Projektwissen (App-Stand v42)

## Regeln für dieses Dokument (immer befolgen)
Halte diese Datei und `PROGRESS.md` selbstständig aktuell, ohne dass der Nutzer darum bittet:
- Zu Beginn jeder Sitzung und nach jedem Zusammenfassen des Verlaufs: beide Dateien lesen, bevor etwas geändert wird.
- Nach jedem abgeschlossenen Feature, Bugfix oder Arbeitsschritt: `PROGRESS.md` aktualisieren (Erledigt, Aktueller Stand, Offene Probleme, Nächste Schritte).
- Bei jeder neuen Entscheidung zu Stack, Architektur, Datenmodell, Konventionen, Design oder Vorlieben des Nutzers: diese Datei aktualisieren, mit kurzem Warum.
- Veraltete Infos ersetzen oder löschen, nicht nur anhängen. Die Versionsnummer in der Überschrift und in „Veröffentlichen“ mitziehen.
- Beide Dateien kompakt halten: Stichpunkte, keine Code-Blöcke, keine Logs. In `PROGRESS.md` unter „Erledigt“ nur die letzten rund zehn Versionen, Älteres in einem Satz.
- Regelmäßig sichern (Wunsch des Nutzers): Nach jedem Arbeitsschritt committen und hochladen, auch Zwischenstände dieser beiden Dateien. Nichts bleibt nur im Arbeitsordner liegen. Warum: Die Cloud-Umgebung der Sitzung wird nach einer Pause gelöscht.
- Sagt der Nutzer „zusammenfassen“, „compact“ oder „Pause“: zuerst beide Dateien aktualisieren und hochladen, dann kurz bestätigen.
- Keine dauerhaften Freigaben hier eintragen (z. B. „darf immer veröffentlichen“). Freigaben gelten nur für die laufende Sitzung. Warum: Diese Datei steuert künftige Sitzungen, und der Nutzer soll jede Sitzung selbst freigeben.

## Projekt
- Ziel: eine persönliche All-in-one-App für den Alltag, clean, modern, angenehm, alltagstauglich. Sie soll den Nutzer weiterbringen (Fortschritt sichtbar machen), nicht nur Daten sammeln.
- Zielgruppe: der Nutzer selbst, auf dem iPhone als App auf dem Home-Bildschirm. Weitergabe an andere ist nur eine Idee. Einschätzung dazu: als Geschäft schwierig; stark wären Zusammenhänge zwischen den Bereichen und „privat, ohne Konto, ohne Abo“.
- Name: „Track.“ mit Punkt (früher „Takt“). Oberfläche und Code-Kommentare auf Deutsch.
- Kernfunktionen:
  - Heute: Wochenleiste, Schnell-Knöpfe, Routinen des Tages direkt startbar, Übersicht der Bereiche als Liste mit farbigem Symbol, Wochenansicht mit Vergleich zur Vorwoche und Zusammenhängen, Sicherung speichern/einlesen mit Erinnerung.
  - Routinen: tägliche Zeitblöcke mit Timer, Serien, Kalender.
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
- `manifest.webmanifest`, `icon-180/192/512.png`: Installation auf dem Home-Bildschirm. `.nojekyll` für Pages.
- `CLAUDE.md` (dieses Wissen), `PROGRESS.md` (Stand, Offenes, nächste Schritte).
- `tests/`: Tests und Bildschirmfotos (siehe „Testen“ und `tests/LIESMICH.md`). Gehören nicht zur App; der Service Worker speichert sie nicht.
- Abschnitte im Script, markiert mit `/* ---------- Name ---------- */`: helpers, state, persistence, actions, render, sheet, Gewicht, Haushalt (= Finanzen), Finanzen: Vermögen und Sparziele, Training: Cardio, Training: Kraft (= Gym), Kraft: Pläne und laufendes Training, Heute und Woche, Datensicherung, Bereiche, boot.
- Muster je Bereich: eine `render…`-Funktion schreibt das HTML ihrer `.view` neu; ein Klick-Listener je Bereich wertet `data-…`-Attribute aus (`data-h` Heute, `data-w` Gewicht, `data-m` Finanzen, `data-t` Training, `data-k` Gym, `data-la` laufendes Training, `data-x`/`data-xr` Blatt der Übung).
- Bereiche und IDs im Code: `heute`, `routinen`, `gewicht`, `haushalt` (Finanzen), `training`. Im Code heißt Gym „kraft“.
- Wochenleiste und Kalender: `weekStripHTML(mode)`, `calMarks(mode)`, `calHTML()`, `calDayHTML()`, `openCal(mode, tag)`; Modi `all`, `rout`, `weight`, `money`, `cardio`, `gym`.
- Gemeinsame Bausteine: `fig()` Kennzahl-Kachel, `kvRow()` Zeile mit Wert und Vergleich, `navHTML()` Pfeile für Monat/Jahr (Knöpfe tragen `data-m="prev|next"` in `.mnav`), `seriesSVG()` Liniengraph, `kmBarsSVG()` Balken je Monat, `monthsHTML()` + `monToggle()` Listen nach Monaten, `heroM()`/`kHero()` große Zahl, `openDlg()` Blatt öffnen, `esc()` Text sicher ausgeben.
- Finanzen: Umschalter „Vermögen / Budget“ (`finSub()`, Wahl in `fSub`), beide teilen `mMode`, `mYM`, `mYear`.
  - Vermögen: `wealthHTML()`, Blatt `vsheet` mit `openV('bal')` und `openV('goal')`. `accState(konto, monat)` = letzter eingetragener Stand plus Bewegungen seitdem (`accFlow()`), `accAt()` nur der Wert, `wealthAt()` summiert, `wealthDelta(zeitraum)` liefert Plus/Minus; `goalsHTML()` Sparziele mit Datum aus dem Schnitt der letzten drei Monate.
  - Konten an Buchungen: Im Blatt `msheet` gibt es bei Ausgabe, Einnahme und festen Posten Chips für das Konto (Vorbelegung `defAcc()`: zuletzt benutztes Konto, sonst das einzige; bei mehreren ohne Vorgeschichte muss gewählt werden) und „+ Konto“ zum Anlegen direkt beim Buchen (`addAccM()`, gemeinsam mit dem Blatt „Stand eintragen“ über `saveAcc()`; dort lässt sich der Name im Feld auch ändern), bei festen Posten dazu „Tag im Monat“. Umbuchungen zwischen Konten sind Buchungen mit `k: 'tr'` (`openM('tx', null, 'tr')`), sie stehen im Bereich Vermögen und zählen im Budget nicht (`txIn(monat, true)` liefert nur sie).
  - Budget: `monthHTML()`, `yearHTML()`, `mSum()`, `ySum()`, `rateHTML()` Sparquote, Blatt `msheet` mit `openM('tx'|'fixed'|'budget')`.
- Training: gemeinsamer Zeitraum `tMode`, `tYM`, `tYear` für Cardio und Gym.
  - Gym: `kraftHTML()` (Monat), `kYearHTML()`, `kPeriod(zeitraum)` Kennzahlen, `kExFoldHTML()` Übungsliste, `kUnitRow()`.
  - Je Übung: `kScore()` Vergleichswert, `exLevel()`, `exDelta(hist, zeitraum)`, Blatt `xsheet` mit `openX(id, nurAnsehen)`, `paintX()`, `exFigsHTML()`, `exChartHTML()`, `exRecapHTML()` (Zustand `xMode`, `xYM`, `xYear`), `exCard()`.
  - Laufendes Training: Blatt `lsheet`, `paintL()`, `liveTick()`, Zustand `K.live`, Arbeitskopie `Lw`.

## Datenmodell
- Ein Eintrag `takt.v1` in `localStorage`: `{ S, LY, W, MF, MY, T, K }`.
  - `S` Routinen und laufender Timer; `LY` Tagesprotokoll der Routinen je Jahr.
  - `W` Gewicht: `entries` je Datum, `goal`, `goalFrom`.
  - `MF`: `fixed` feste Posten (optional `acc` Konto und `day` Tag im Monat), `budgets`, `roll` (Rest mitnehmen), `acc` Konten, `bal` eingetragene Stände je Monat und Konto in Cent (darf 0 oder negativ sein), `balT` Zeitpunkt des Eintragens in ms (fehlt er, gilt der Stand zum Monatsende), `goals` Sparziele.
  - `MY` Buchungen je Jahr: `d` Datum, `a` Betrag, `k` (`in`, `out`, `tr` = Umbuchung), `c` Kategorie, `n` Notiz, optional `acc` Konto, `to` Zielkonto der Umbuchung, `t` Zeitpunkt des Eintragens in ms.
  - `T` Läufe. `K` Gym: `ex` Übungen, `plans`, `log` je Datum und Übung als Liste von Sätzen [kg, Wdh], `meta` (Dauer, Plan), `live`.
- Weitere Schlüssel: `takt.backup` (Zeitpunkt der letzten Sicherung), `takt.view`.
- Datumsschlüssel `YYYY-MM-DD` in Ortszeit, Monate `YYYY-MM`, Geld in Cent.
- Jede Gruppe läuft beim Laden durch eine `norm…`-Funktion: neue Felder dort eintragen, sonst gehen sie beim Laden verloren.
- Ändern nur über `patchW()` bzw. `mfdoc`, `mdoc(jahr)`, `tdoc`, `kdoc` mit `.patch({…})`; `null` löscht. Jede Änderung endet in `saveLocal()`.
- Sicherung: JSON mit `app: 'takt'`. Einlesen ergänzt, gleiche Einträge werden überschrieben.

## Entscheidungen (mit Begründung)
- Eine Datei ohne Build: einfach auszuliefern und für den Nutzer ohne Technik-Wissen tragbar.
- Nur lokale Daten, kein Server: privat und ohne Betrieb. Folge: Die Sicherung ist wichtig, deshalb die Erinnerung nach 14 Tagen (`backupDue()`).
- Alter Cloud-Abgleich und Google-Schrift entfernt (v22): nie aktiv bzw. unnötig, die App soll nichts nachladen.
- Interne Kennungen behalten den alten Namen (`takt.v1`, `takt.backup`, `takt.view`, Cache `takt-vN`, `app: 'takt'`): Umbenennen würde die Daten des Nutzers oder alte Sicherungen unbrauchbar machen.
- Selbst-Aktualisierung (v24): Beim Öffnen sucht die App nach einem neuen `sw.js` und lädt einmal neu, sobald er übernimmt, aber nie bei offenem Blatt. Warum: Der Nutzer soll Updates ohne Zutun bekommen und keine Eingabe verlieren.
- Versionshinweis in der Fußzeile: Der Nutzer prüft daran, ob ein Update angekommen ist.
- Kopfzeile deckend, kein `backdrop-filter` (v37): Der Milchglas-Effekt machte auf dem iPhone beim Scrollen den Kopf selbst unscharf.
- Blätter nur über `openDlg()`: Sonst zeichnet das iPhone einen Fokus-Rahmen um den ersten Knopf.
- Gym nach Vorbild Alpha Progression: Im laufenden Training stehen unter den Sätzen „Letztes Mal“ und Kennzahlen; ein Tipp auf „Letztes Mal“ öffnet das Blatt der Übung mit Graph und Recap. Einheiten erscheinen dort als Karten mit Satz-Tabelle.
- Vergleichswert im Gym ist das geschätzte Maximum für eine Wiederholung (Gewicht × (1 + Wdh/30)), ohne Gewicht die meisten Wiederholungen. Kein 10RM: Die App rechnete schon immer so, der Nutzer hat es so belassen.
- „Verbesserung“ in Monat und Jahr: bester Stand am Ende gegenüber dem Stand davor (letzter trainierter Monat), im ersten Zeitraum gegenüber der ersten Einheit. Warum: So gibt es schon im ersten Monat eine Zahl. Gesamt = Schnitt über alle Übungen.
- „Letztes Mal“ zählt auch Einheiten vom selben Tag: Der Nutzer testet am selben Tag und sah sonst nichts.
- Cardio, Gym-Einheiten und Budget zeigen nur den oben gewählten Monat; wachsende Listen ohne Monatswahl (Gewicht) werden nach Monaten gruppiert. Warum: Nichts darf mit der Zeit unübersichtlich werden.
- Finanzen: Vermögen, Sparquote und Sparziele stehen vorn, das Haushaltsbuch ist freiwillig. Warum: Das bringt den Nutzer weiter als Ausgaben zählen. Keine Bankanbindung, keine Kurse, keine Anlagetipps (bräuchte Server bzw. gehört nicht in die App).
- Kontostand = letzter eingetragener Stand plus alle Buchungen, Umbuchungen und festen Posten dieses Kontos danach (v39, Wunsch des Nutzers: Stand nur einmal eintragen). Warum so: Die Rechnung stimmt nur, wenn alles gebucht wird; ein neu eingetragener Stand korrigiert deshalb jederzeit alles davor.
  - Was „danach“ heißt: Buchungen mit späterem Datum; am Tag des Stands nur, was später eingetragen wurde (`t` gegen `balT`). Rückdatierte Buchungen waren im Stand schon enthalten und zählen nicht.
  - Feste Posten zählen an ihrem Tag im Monat, wenn dieser nach dem Stand liegt.
  - Das Blatt „Stand eintragen“ zeigt im laufenden Monat den gerechneten Stand und speichert nur geänderte Felder, damit unverändertes Speichern nichts verschiebt.
  - Buchungen ohne Konto verändern kein Konto; Konten ohne Buchungen (z. B. Depot) behalten ihren letzten Stand.
  - „Kein Konto“ wird nie still vorbelegt (v42). Warum: Der Nutzer buchte so, ohne es zu merken, und sein Vermögen änderte sich nicht.
  - `healBal()` (v42) gibt einem Stand des laufenden Monats ohne Zeitpunkt (aus v38) beim Laden einen. Warum: Er galt als Stand zum Monatsende, und keine Buchung des Monats zählte.

## Code-Konventionen
- HTML wird als String gebaut: Nutzertexte immer durch `esc()`.
- Farben nur über CSS-Variablen in `:root` (hell, dunkel per Systemeinstellung und `data-theme`).
- Neue Größen in den bestehenden CSS-Blöcken ändern, keinen weiteren Überschreib-Block anhängen.
- Kommentare auf Deutsch, nur wo sie eine Absicht oder Falle erklären.
- Wortwahl in der Oberfläche: „Gym“ statt „Kraft“, „Finanzen“ statt „Haushalt“, „Einheit“ für ein Training.
- Zahlen deutsch formatiert (`toLocaleString('de-DE')`), Euro über `eur()`, `eur0()`, `eurS()`, Kilogramm über `kg()`, `kgn()`.
- Kein toter Code: Unbenutztes entfernen.

## Design-Regeln (verbindlich)
- Modern, clean, Apple-artig. Dunkel: fast schwarzer, leicht bläulicher Grund (`--bg`), Karten eine Stufe heller.
- Flächen ohne Rand, Trennlinien nur in Listen, Rundungen: Karten 20 px, Knöpfe 14 px, Chips als Pillen, Blätter mit Griff oben.
- Kompakt: Fließtext 15 px, Listen 14 px, Nebentexte 12–13 px, große Zahl höchstens 44 px.
- Tippflächen mindestens 40 px; kleinere Knöpfe bekommen per `::after` eine größere Tippfläche.
- Akzentblau nur für Aktionen, Links und aktive Auswahl. Grün = erledigt/besser, Rot = schlechter/löschen. Pro Ansicht ein blauer Hauptknopf, Nebenaktionen als `.ghost`.
- Kennfarben der Bereiche (Routinen blau, Gewicht lila, Finanzen orange, Training grün) nur am Symbol in der Übersicht auf Heute.
- Systemschrift, große Zahlen mit `var(--round)`. Abschnittstitel fett und normal geschrieben.
- Nur was nötig ist: keine erklärenden Texte ohne Nutzen, keine Töne, keine ungefragten Einstellungen, lange Listen einklappen.
- Hell, dunkel und 320 px Breite müssen funktionieren. Nichts darf seitlich wischbar oder abgeschnitten sein.

## iPhone-Besonderheiten (im Test-Browser nicht sichtbar)
- Eingabefelder unter 16 px Schrift lassen iOS hineinzoomen.
- Datumsfelder brauchen `appearance:none` und eine Höchstbreite, sonst ragen sie hinaus.
- Die Zahlentastatur hat kein Minus.
- Die App auf dem Home-Bildschirm hat einen eigenen Speicher; ihr Name wird beim Hinzufügen festgelegt. Löschen des Symbols löscht die Daten: vorher Sicherung speichern.
- Solange ein Blatt offen ist, aktualisiert sich die App nicht.
- Nach Änderungen an Blättern oder Layout den Nutzer bitten, am iPhone zu prüfen.

## Meine Vorlieben (aus Rückmeldungen des Nutzers)
- Der Look seit v21 ist „genau getroffen“: dunkel, ruhig, wenige farbige Akzente mit Bedeutung.
- Klein wirkt edler: alles kompakt, wie herausgezoomt; eine Ansicht darf dafür lang sein und scrollen.
- Viel auf einen Blick: eine Liste statt mehrerer großer Karten; „Übungen“ und „Einheiten“ als eingeklappte Zeile mit Anzahl.
- Überall ein Plus oder Minus zum Zeitraum davor (Monat, Jahr, je Übung), grün oder rot.
- In Zeilen mit Wert (`kvRow()`: Letzter Lauf, Woche, Sparquote) steht der Vergleich in einer eigenen Zeile unter dem Wert, nicht daneben. Der Nutzer fand das ruhiger; „daneben“ war ein Vorschlag von mir (v26), den er nach dem Ausprobieren zurückgenommen hat. Kompakt heißt für ihn nicht: alles in eine Zeile quetschen.
- Ruhig: keine Töne, keine Ränder, keine Großbuchstaben-Labels.
- Im Zweifel die schlichtere Lösung, lieber etwas weglassen.
- Vorbild fürs Gym: Alpha Progression (Screenshots des Nutzers).

## Zusammenarbeit
- Sprache: Deutsch, einfache Worte, kurz. Der Nutzer ist kein Entwickler, arbeitet am iPhone und schickt Screenshots.
- Zu jeder Änderung einen eigenen, konkreten Verbesserungsvorschlag mitbringen: nur vorschlagen, nicht ungefragt umsetzen. Offene Vorschläge stehen in `PROGRESS.md`.
- Mitdenken ist ausdrücklich erwünscht („immer weiter so“): Was eine Idee des Nutzers braucht, damit sie im Alltag wirklich stimmt, gleich mitbauen und erklären (Beispiel: Zu Konten an Buchungen gehörten Umbuchungen und der Tag bei festen Posten).
- Nichts umsetzen, wovon man selbst nicht überzeugt ist. Ist ein Wunsch keine gute Idee, das offen sagen und eine bessere Lösung nennen. Eigene Fehler und falsche Vorschläge benennen.
- Antwort nach einer Änderung: was neu ist, was bewusst anders gelöst wurde, wie getestet wurde, was nicht getestet werden konnte, welche Version live ist, ein Vorschlag.
- Bei Ansichten, die neu aussehen, ein Bild mit Beispieldaten mitschicken.

## Veröffentlichen
- Bei jeder Änderung an `index.html`: Cache-Name in `sw.js` (`takt-v42` → `takt-v43`), `<span class="ver">v42</span>` in der Fußzeile und die Nummer in dieser Datei gemeinsam hochzählen. Ohne neuen Cache-Namen sehen installierte Geräte die Änderung nicht. Reine Änderungen an den beiden Markdown-Dateien brauchen keine neue Version.
- Entwickelt wird auf dem Arbeitszweig der Sitzung. Was nach `main` geht, landet auf dem Handy des Nutzers. Ob direkt nach `main` veröffentlicht werden darf, in jeder neuen Sitzung einmal beim Nutzer erfragen.
- Nach dem Hochladen warten, bis Pages die neue Version ausliefert (das `sw.js` der Adresse zeigt den neuen Cache-Namen), dann dem Nutzer die Version nennen.

## Testen (vor jeder Veröffentlichung)
- `node tests/alle.js` muss „Alle Tests stimmen“ melden: Ablauf, Finanzen, Gym, Speichern, Aktualisierung. Die Tests bedienen die App mit Playwright (vorinstalliertes Chromium), direkt als Datei geöffnet.
- `node tests/bilder.js <ordner> [2]` macht Bildschirmfotos aller Bereiche und Blätter (dunkel, hell, 390 und 320 px, leer und mit Beispieldaten). Die betroffenen Ansichten ansehen; für den Nutzer mit Schärfe 2.
- Nach dem Hochladen: `node tests/live.js` prüft die veröffentlichte App (Version, identisch mit dem Repository, offline). Das geht, weil die Umgebung „meine-app“ die Pages-Adresse erlaubt.
- Zu jeder neuen Funktion und jedem behobenen Fehler eine Prüfung in `tests/` ergänzen, mit der Rechnung als Kommentar. Rechenwerte immer von Hand nachrechnen.
- Meldet der Nutzer einen Fehler, zuerst seinen Fall nachstellen (seine Daten sind oft sehr klein: eine Übung, wenige Einheiten, alles im selben Monat). Auch an Daten denken, die mit einer älteren Version eingetragen wurden: Ihnen fehlen neuere Felder (so entstand der Fehler vor v42).
- Beispieldaten nicht per Start-Skript mit Merker einspielen: Der Test-Browser vergisst den Merker gelegentlich beim Neuladen und überschreibt dann die Daten. `oeffnen({ daten })` in `tests/lib.js` spielt sie einmal nach dem Laden ein.
- Service Worker und Selbst-Aktualisierung brauchen http: `tests/update.js` liefert die Dateien selbst aus, nur für die Dauer des Tests. Ein dauerhaft laufender lokaler Server wird von der Berechtigungsprüfung abgelehnt.
- Was Tests nicht zeigen, steht unter „iPhone-Besonderheiten“.
