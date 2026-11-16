# Track. – Projektwissen (App-Stand v57)

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
  - Heute: Wochenleiste, Schnell-Knöpfe, Notizen, Tages-Check (Schlaf, zur Probe seit v57), Routinen des Tages direkt startbar, Aufgaben des Tages, Übersicht der Bereiche als Liste mit farbigem Symbol, Wochenansicht mit Vergleich zur Vorwoche und Zusammenhängen, Sicherung speichern/einlesen mit Erinnerung.
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
- `manifest.webmanifest`, `icon-180/192/512.png`: Installation auf dem Home-Bildschirm. `.nojekyll` für Pages. Das Symbol (steigende blaue Linie mit hellem Punkt auf dunklem Verlauf, seit v47) erzeugt `node tests/symbol.js` aus einem SVG im Skript.
- `start/`: einfarbige Startbilder fürs iPhone (hell und dunkel, je Gerätegröße), erzeugt mit `tests/startbilder.py`; die Zeilen dazu stehen im `<head>`. Bewusst ohne Schriftzug, damit das Startbild nahtlos in die App übergeht. Neue iPhone-Größe: im Skript ergänzen und neu erzeugen.
- `CLAUDE.md` (dieses Wissen), `PROGRESS.md` (Stand, Offenes, nächste Schritte).
- `tests/`: Tests und Bildschirmfotos (siehe „Testen“ und `tests/LIESMICH.md`). Gehören nicht zur App; der Service Worker speichert sie nicht.
- Abschnitte im Script, markiert mit `/* ---------- Name ---------- */`: helpers, state, persistence, actions, render, sheet, Gewicht, Haushalt (= Finanzen), Finanzen: Vermögen und Sparziele, Training: Cardio, Training: Kraft (= Gym), Kraft: Pläne und laufendes Training, Aufgaben und Notizen, Heute und Woche, Datensicherung, Bereiche, Rückgängig, Graphen ablesen, Feinschliff, Wischgesten, boot.
- Muster je Bereich: eine `render…`-Funktion schreibt das HTML ihrer `.view` neu; ein Klick-Listener je Bereich wertet `data-…`-Attribute aus (`data-h` Heute, `data-w` Gewicht, `data-m` Finanzen, `data-t` Training, `data-k` Gym, `data-la` laufendes Training, `data-x`/`data-xr` Blatt der Übung).
- Bereiche und IDs im Code: `heute`, `routinen` (in der Leiste unten „Planer“, seit v54, weil dort auch Aufgaben und Notizen liegen), `gewicht`, `haushalt` (Finanzen), `training`. Im Code heißt Gym „kraft“.
- Wochenleiste in jedem Bereich (Heute, Routinen, Gewicht, Budget, Cardio, Gym; im Vermögen gab es sie nie): Ein Tipp auf einen Tag öffnet den Kalender des Bereichs. In v44 hatte ich sie aus Gewicht, Finanzen und Training entfernt; der Nutzer wollte sie zurück (v46).
- Wochenleiste und Kalender: `weekStripHTML(mode)`, `calMarks(mode)`, `calHTML()`, `calDayHTML()`, `openCal(mode, tag)`; Modi `all`, `rout`, `weight`, `money`, `cardio`, `gym`.
- Gemeinsame Bausteine: `fig()` Kennzahl-Kachel (ohne Wert, also mit Strich, entsteht keine Kachel; die übrigen teilen sich die Breite, seit v54), `kvRow()` Zeile mit Wert und Vergleich, `navHTML()` Pfeile für Monat/Jahr mit mittigem Titel (Knöpfe tragen `data-m="prev|next"` in `.mnav`), `segMY()` Umschalter Monat/Jahr als eigene Reihe darüber, `INFO(id)` kleines „i“, das den Text `#info-id` zeigt, `scrubAttr()` macht einen Graphen ablesbar, `seriesSVG()` Liniengraph, `kmBarsSVG()` Balken je Monat, `monthsHTML()` + `monToggle()` Listen nach Monaten, `heroM()`/`kHero()` große Zahl, `emptyHTML(bereich, titel, satz, knöpfe)` leerer Bereich, `openDlg()` Blatt öffnen, `esc()` Text sicher ausgeben.
- Finanzen: Umschalter „Vermögen / Budget“ (`finSub()`, Wahl in `fSub`), beide teilen `mMode`, `mYM`, `mYear`.
  - Vermögen: `wealthHTML()`, Blatt `vsheet` mit `openV('bal')` und `openV('goal')`. `accState(konto, monat)` = letzter eingetragener Stand plus Bewegungen seitdem (`accFlow()`), `accAt()` nur der Wert, `wealthAt()` summiert, `wealthDelta(zeitraum)` liefert Plus/Minus; `goalsHTML()` Sparziele mit Datum aus dem Schnitt der letzten drei Monate.
  - Konten an Buchungen: Im Blatt `msheet` gibt es bei Ausgabe, Einnahme und festen Posten Chips für das Konto (Vorbelegung `defAcc()`: zuletzt benutztes Konto, sonst das einzige; bei mehreren ohne Vorgeschichte muss gewählt werden) und „+ Konto“ zum Anlegen direkt beim Buchen (`addAccM()`, gemeinsam mit dem Blatt „Stand eintragen“ über `saveAcc()`; dort lässt sich der Name im Feld auch ändern), bei festen Posten dazu „Tag im Monat“. Umbuchungen zwischen Konten sind Buchungen mit `k: 'tr'` (`openM('tx', null, 'tr')`), sie stehen im Bereich Vermögen und zählen im Budget nicht (`txIn(monat, true)` liefert nur sie).
  - Zeile „Ohne Konto“ im Vermögen (v43): `noAcc(monat)` liefert Buchungen und fällige feste Posten ohne Konto, die nach einem eingetragenen Stand liegen; eingeklappt (`vNoOpen`), ein Tipp auf einen Eintrag öffnet ihn. Was vor dem Stand liegt, fehlt bewusst: Es steckt schon im Stand. Zeilen über `txRow()` und `fixedRow()`.
  - Ausgabe oder Einnahme wählt man im Blatt selbst (Chips `#m-kind`, seit v56; nicht bei Umbuchung und festen Posten). Es öffnet als Ausgabe, weil das der häufige Fall ist.
  - Budget: `monthHTML()`, `yearHTML()`, `mSum()`, `ySum()`, `rateHTML()` Sparquote, Blatt `msheet` mit `openM('tx'|'fixed'|'budget')`.
- Aufgaben und Notizen (v49): Umschalter `rSub` (`rout`, `task`, `note`) in `#r-subs`; Inhalt in `#n-main` über `tasksHTML()` bzw. `notesHTML()`, die Routinen bleiben in `#main`. Der Plus-Knopf oben richtet sich nach `rSub`.
  - Ordner gelten für beide: feste `FOLDERS` (Uni, Promotion, Privat) plus eigene in `N.folders` (`allFolders()`), Filter `nFolder`, Anlegen im Blatt über „+ Ordner“ (`folderAdd()`); unbenutzte eigene entfernt `cleanFolders()` beim Start.
  - Aufgaben: `taskParts()` teilt in Heute (offen und heute oder früher fällig, dazu heute Abgehaktes), Demnächst, Ohne Datum, Erledigt (eingeklappt, letzte 50). `taskRow()` Zeile mit Kreis, `nAct()` wertet `data-n` aus (auch auf Heute), Blatt `asheet` mit `openA(id, datum)`. Auf Heute: `homeTasksHTML()`; neue Aufgaben legt man im Planer an (den Schnell-Knopf „Aufgabe“ wollte der Nutzer nicht mehr, v56). Kalender-Modus `task` zeigt, was an einem Tag erledigt wurde. Wiederkehrend (v50): `REPEAT`, `nextDue(datum, art)`; das Abhaken in `nAct()` legt die nächste Aufgabe an.
  - Notizen (seit v51 schnelle Aufnahme): eine Liste, neueste zuerst (`notesNew()`); `noteRow()` mit Kreis (`data-n="notedone"` löscht, `data-undo` zeigt „Rückgängig“). Blatt `nsheet` mit `openN(id)`: neu nur das Textfeld; Enter legt die Notiz an und macht das Feld frei für die nächste (`nE.fresh`, seit v54), Enter im leeren Feld oder „Fertig“ schließt; vorhandene dazu Ordner, „Als Aufgabe“ (macht eine Aufgabe für heute und entfernt die Notiz), Löschen. `noteSave()` speichert von selbst. Auf Heute: `homeNotesHTML()` (neueste fünf), ganz oben direkt unter den Schnell-Knöpfen, noch vor Routinen (v53, Wunsch des Nutzers: „muss die direkt sehen als erstes“). Suche: Feld `#n-q` erst ab sechs Notizen, Text in `nQuery`, `noteListHTML()` zeichnet nur `#n-list` neu, damit das Feld beim Tippen den Fokus behält.
- Tages-Check (v57, zur Probe: Der Nutzer weiß noch nicht, ob er ihn behält. Er steckt in einem eigenen Commit „Tages-Check“ und lässt sich mit `git revert` herausnehmen; dann auch `tests/check.js`, den Eintrag in `tests/alle.js` und `DC` in `tests/daten.js` prüfen): Zeile „Schlaf“ auf Heute mit fünf Kreisen (`checkHTML()`, `data-h="sleep"`), ein Tipp speichert 1 bis 5 für heute, derselbe Tipp noch einmal nimmt es zurück. Wochenansicht: Zeile „Schlaf“ mit Schnitt und Vergleich (`weekStats()` liefert `sleep`, `sn`). `sleepInsights()` ergänzt die Zusammenhänge um „Training und Schlaf“ (Schlaf nach Trainingstagen gegen die anderen) und „Schlaf und Routinen“ (erledigte Routinen nach gutem Schlaf gegen die anderen); gerechnet mit Tagen der letzten 12 Wochen, je Seite mindestens 5.
- Training: gemeinsamer Zeitraum `tMode`, `tYM`, `tYear` für Cardio und Gym.
  - Gym: `kraftHTML()` (Monat), `kYearHTML()`, `kPeriod(zeitraum)` Kennzahlen, `kExFoldHTML()` Übungsliste, `kUnitRow()`.
  - Je Übung: `kScore()` Vergleichswert, `exLevel()`, `exDelta(hist, zeitraum)`, Blatt `xsheet` mit `openX(id, nurAnsehen)`, `paintX()`, `exFigsHTML()`, `exChartHTML()`, `exRecapHTML()` (Zustand `xMode`, `xYM`, `xYear`), `exCard()`.
  - Laufendes Training: Blatt `lsheet`, `paintL()`, `liveTick()`, Zustand `K.live`, Arbeitskopie `Lw`.

## Datenmodell
- Ein Eintrag `takt.v1` in `localStorage`: `{ S, LY, W, MF, MY, T, K, N, DC }`.
  - `S` Routinen und laufender Timer; `LY` Tagesprotokoll der Routinen je Jahr.
  - `W` Gewicht: `entries` je Datum, `goal`, `goalFrom`.
  - `MF`: `fixed` feste Posten (optional `acc` Konto und `day` Tag im Monat), `budgets`, `roll` (Rest mitnehmen), `cats` eigene Kategorien (id höchstens 12 Zeichen, wie `c` einer Buchung), `acc` Konten, `bal` eingetragene Stände je Monat und Konto in Cent (darf 0 oder negativ sein), `balT` Zeitpunkt des Eintragens in ms (fehlt er, gilt der Stand zum Monatsende), `goals` Sparziele.
  - `MY` Buchungen je Jahr: `d` Datum, `a` Betrag, `k` (`in`, `out`, `tr` = Umbuchung), `c` Kategorie, `n` Notiz, optional `acc` Konto, `to` Zielkonto der Umbuchung, `t` Zeitpunkt des Eintragens in ms.
  - `N` Aufgaben und Notizen: `folders` eigene Ordner; `tasks` je id: `t` Titel, `f` Ordner, `d` fällig (Datum oder null), `done` Zeitpunkt des Abhakens oder null, `c` angelegt, `n` Notiz, `r` Wiederholung (leer, `day`, `week`, `month`), `nx` id der beim Abhaken angelegten nächsten Aufgabe; `notes` je id: `x` Text, `f` Ordner, `c` angelegt, `m` geändert. Notizen aus v49/v50 (mit `t`, `pin`, `items`) übernimmt `normN()`: Titel wird erste Zeile, jede offene Zeile zum Abhaken eine eigene Notiz.
  - `T` Läufe: `d`, `m` Meter, `s` Sekunden, `hr` Puls, `k` (`out`, `in` = Laufband), `inc` Steigung in Prozent (nur Laufband). Das Laufband-Tempo `spd` gibt es seit v56 nicht mehr; `normT()` rechnet alte Läufe um (Strecke = Tempo × Dauer), damit ihre Zahlen gleich bleiben.
  - `K` Gym: `ex` Übungen, `plans`, `log` je Datum und Übung als Liste von Sätzen [kg, Wdh], `meta` (Dauer, Plan), `live`.
  - `DC` Tages-Check: `sleep` je Datum eine Zahl von 1 bis 5 (`normDC()`, `dcdoc`).
- Weitere Schlüssel: `takt.backup` (Zeitpunkt der letzten Sicherung), `takt.view`.
- Datumsschlüssel `YYYY-MM-DD` in Ortszeit, Monate `YYYY-MM`, Geld in Cent.
- Jede Gruppe läuft beim Laden durch eine `norm…`-Funktion: neue Felder dort eintragen, sonst gehen sie beim Laden verloren.
- Ändern nur über `patchW()` bzw. `mfdoc`, `mdoc(jahr)`, `tdoc`, `kdoc` mit `.patch({…})`; `null` löscht. Jede Änderung endet in `saveLocal()`.
- Sicherung: JSON mit `app: 'takt'`. Einlesen ergänzt, gleiche Einträge werden überschrieben.

## Entscheidungen (mit Begründung)
- Eine Datei ohne Build: einfach auszuliefern und für den Nutzer ohne Technik-Wissen tragbar.
- Nur lokale Daten, kein Server: privat und ohne Betrieb. Folge: Die Sicherung ist wichtig, deshalb die Erinnerung nach 7 Tagen (`backupDue()`, seit v45; vorher 14). Speichern läuft auf dem iPhone über das Teilen-Menü („In Dateien sichern“). Automatisch sichern kann eine Web-App nicht.
- Alter Cloud-Abgleich und Google-Schrift entfernt (v22): nie aktiv bzw. unnötig, die App soll nichts nachladen.
- Interne Kennungen behalten den alten Namen (`takt.v1`, `takt.backup`, `takt.view`, Cache `takt-vN`, `app: 'takt'`): Umbenennen würde die Daten des Nutzers oder alte Sicherungen unbrauchbar machen.
- Selbst-Aktualisierung (v24): Beim Öffnen sucht die App nach einem neuen `sw.js` und lädt einmal neu, sobald er übernimmt, aber nie bei offenem Blatt. Warum: Der Nutzer soll Updates ohne Zutun bekommen und keine Eingabe verlieren.
- Versionshinweis in der Fußzeile: Der Nutzer prüft daran, ob ein Update angekommen ist.
- Kopfzeile deckend, kein `backdrop-filter` (v37): Der Milchglas-Effekt machte auf dem iPhone beim Scrollen den Kopf selbst unscharf.
- Wischgesten (v44, Abschnitt „Wischgesten“): Blatt nach unten wegziehen (nur wenn alles unter dem Finger ganz oben steht; schließt über denselben Weg wie ein Tipp neben das Blatt) und waagerecht zwischen Monaten, Jahren, Wochen wischen (klickt den Pfeil; nicht vom Bildschirmrand, nicht auf Graphen).
- Graphen ablesen (v44, Abschnitt „Graphen ablesen“): Jeder Graph trägt seine Punkte in `data-pts`; Tipp oder Zug zeigt Linie, Punkt und Schild (`scrubShow()`), ein Tipp daneben blendet es aus.
- Rückgängig (v45, Abschnitt „Rückgängig“): ein Weg für alle Löschknöpfe (id endet auf `-del`, oder `data-vdel`, oder `data-undo`). Vor dem Tipp wird der gespeicherte Stand gemerkt; hat sich danach etwas geändert, erscheint unten „Gelöscht · Rückgängig“ (`#toast`, 7 Sekunden). `saveLocal()` ruft `toastOff()`: Jede weitere Änderung nimmt den Hinweis weg, damit Rückgängig nie etwas Neueres überschreibt. Neue Löschknöpfe brauchen nur eine id auf `-del`.
- Eigene Kategorien (v45): `MF.cats`, anlegen im Blatt über „+ Kategorie“ (`addCatM()`), `allCats()` = feste plus eigene. Unbenutzte (keine Buchung, kein Budget) entfernt `cleanCats()` beim Start. Warum: So braucht es keine Verwaltung zum Löschen. Umbenennen gibt es noch nicht.
- Notizen sind eine schnelle Aufnahme (v51, Wunsch des Nutzers: „in 5 Sekunden“): kein Titel, keine Unterpunkte, kein Anheften. „+ Notiz“ öffnet nur ein Textfeld mit Tastatur, Enter schließt ab, jede Notiz hat einen Kreis, Abhaken löscht sie (mit „Rückgängig“, damit ein Fehltipp nichts kostet). Sie stehen auch auf Heute, sonst wäre das schnell Notierte außer Sicht. Mein Entwurf aus v49 (Titel, Text, Zeilen zum Abhaken, Anheften, nach Monaten) war ihm zu schwer.
- Der Fokus ins Textfeld wird beim Öffnen sofort gesetzt, nicht verzögert (`openN()`, `openA()`): Das iPhone öffnet die Tastatur nur, wenn der Fokus direkt aus dem Tipp kommt. Am Gerät noch nicht bestätigt.
- Notizen speichern von selbst (v49): kurz nach jeder Eingabe, beim Verlassen eines Feldes und bei jedem Schließen (`close`-Ereignis des Blatts); kein „Speichern“-Knopf. Warum: Ein Blatt lässt sich wegziehen, dabei darf kein Text verloren gehen. Leere Notizen werden nicht angelegt, geleerte gelöscht. `nE = null` heißt „nichts zu speichern“ (nach dem Löschen), damit das Schließen die Notiz nicht wieder anlegt.
- Im Blatt darf sich beim Speichern nichts verschieben und nichts neu gezeichnet werden, was man gerade antippt (v49): Was im Blatt verborgen ist, bleibt es, solange es offen ist (bei einer neuen Notiz: Ordner, „Als Aufgabe“, Löschen). Ein Test fand, dass sonst der Tipp auf „Fertig“ danebenging.
- Offene Aufgaben mit Datum von gestern oder früher stehen unter „Heute“ mit rotem Datum: Liegengebliebenes rutscht von selbst weiter, ohne dass das Datum umgeschrieben wird.
- Wiederkehrende Aufgaben (v50): Beim Abhaken bleibt die Aufgabe als erledigt stehen und eine neue mit dem nächsten Datum entsteht; nimmt man den Haken wieder weg, verschwindet die neue, solange sie offen ist. Warum nicht einfach das Datum weiterschieben: So bleibt im Kalender und unter „Erledigt“ sichtbar, was wann erledigt wurde. Das nächste Datum liegt immer nach heute (Liegengebliebenes springt nicht in die Vergangenheit); monatlich = gleicher Tag, sonst der letzte des Monats. Ohne Datum gibt es keine Wiederholung.
- Aufgaben und Notizen sind nur Text; längere Texte für die Promotion sind seit v51 nicht mehr das Ziel der Notizen: keine Bilder, keine PDFs (kein Platz in `localStorage`). Dem Nutzer gesagt.
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
- Wortwahl in der Oberfläche: „Gym“ statt „Kraft“, „Finanzen“ statt „Haushalt“, „Einheit“ für ein Training, „Planer“ für den Bereich mit Routinen, Aufgaben und Notizen.
- Zahlen deutsch formatiert (`toLocaleString('de-DE')`), Euro über `eur()`, `eur0()`, `eurS()`, Kilogramm über `kg()`, `kgn()`.
- Kein toter Code: Unbenutztes entfernen.

## Design-Regeln (verbindlich)
- Modern, clean, Apple-artig. Dunkel: fast schwarzer, leicht bläulicher Grund (`--bg`), Karten eine Stufe heller.
- Apple-Feinschliff (v47): Pfeile für Monat/Jahr ohne Kreis in Akzentblau; aktiver Bereich in der Leiste unten mit gefülltem Symbol (Klassen `.f` Fläche, `.k`/`.d` ausgespart, `.b` kräftigere Linie); Linie unter der Kopfzeile erst beim Scrollen (`.top.scrolled`); Symbole mit rund 1,8 px Strich im Bild; leere Bereiche mittig mit Symbol, Titel, einem Satz, Knopf; die große Zahl zählt beim Blättern 0,3 s vom alten zum neuen Wert (nicht bei „Bewegung reduzieren“).
- Flächen ohne Rand, Trennlinien nur in Listen, Rundungen: Karten 16 px (seit v53, passend zu den kleineren Inhalten; vorher 20), Knöpfe 14 px, Chips als Pillen, Blätter mit Griff oben.
- Kompakt (seit v52 noch eine Stufe kleiner): Fließtext 14 px, Listen 13,5 px, Nebentexte 12 px, Abschnittstitel 15 px, Umschalter der Bereiche und „Track.“ 17 px, große Zahl höchstens 34 px, blauer Hauptknopf 40 px hoch. Maßstab ist die Wochenleiste (11 und 15 px): Sie „passt gut“ und bleibt, ebenso die Leiste unten und die Eingabefelder (16 px, sonst zoomt iOS). Nie die ganze Seite per `zoom` verkleinern: Das träfe auch die Eingabefelder.
- Tippflächen mindestens 40 px; kleinere Knöpfe bekommen per `::after` eine größere Tippfläche.
- Akzentblau nur für Aktionen, Links und aktive Auswahl. Einzige Ausnahme: der Punkt von „Track.“ in der Kopfzeile (v48, vom Nutzer nach Vorschaubild gewählt). Grün = erledigt/besser, Rot = schlechter/löschen. Pro Ansicht ein blauer Hauptknopf, Nebenaktionen als `.ghost`.
- Kennfarben der Bereiche (Planer blau, Gewicht lila `--c-weight`, Finanzen orange `--c-money`, Training grün `--good`): am Symbol in der Übersicht auf Heute, am Plus der Schnell-Knöpfe auf Heute und am Symbol der leeren Seiten (`emptyHTML()` gibt `.e-ic` die Klasse des Bereichs; seit v55, vom Nutzer nach Vorschaubild gewählt). Nicht in der Leiste unten und nicht an Überschriften: Dort bliebe Blau nicht mehr „antippbar“, und es würde bunt.
- Systemschrift, große Zahlen mit `var(--round)`. Abschnittstitel fett und normal geschrieben.
- Erklärungen nie dauerhaft, sondern hinter `INFO()`. Bedienreihen (Wochenleiste, Monat/Jahr, Pfeile) bleiben je eine eigene Reihe: nicht zusammenlegen, um Platz zu sparen.
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
- Klein wirkt edler: alles kompakt, wie herausgezoomt; eine Ansicht darf dafür lang sein und scrollen. Nach v51 wollte er es noch kleiner („manches ist zu groß noch, noch mehr rauszoomen“), v52 hat große Zahl, Knöpfe, Zeilen und Überschriften verkleinert.
- Viel auf einen Blick: eine Liste statt mehrerer großer Karten; „Übungen“ und „Einheiten“ als eingeklappte Zeile mit Anzahl.
- Überall ein Plus oder Minus zum Zeitraum davor (Monat, Jahr, je Übung), grün oder rot.
- Die Wochenleiste mag er, in jedem Bereich („ich mochte das“, v46). Mein Umbau in v44 (Leiste weg, Kalender als Knopf oben, Pfeile und Monat/Jahr in einer Reihe) kam nicht an: „das November ist eingequetscht“. Zweites Mal dieselbe Lehre: nichts zusammenschieben, was vorher Luft hatte; Vertrautes nicht für „weniger Bedienung“ opfern, sondern vorher mit Bild fragen.
- In Zeilen mit Wert (`kvRow()`: Letzter Lauf, Woche, Sparquote) steht der Vergleich in einer eigenen Zeile unter dem Wert, nicht daneben. Der Nutzer fand das ruhiger; „daneben“ war ein Vorschlag von mir (v26), den er nach dem Ausprobieren zurückgenommen hat. Kompakt heißt für ihn nicht: alles in eine Zeile quetschen.
- Schnell-Knöpfe auf Heute nur für das, was er wirklich schnell einträgt (v56): Notiz, Gewicht, Ausgabe. „Aufgabe“, „Lauf“ und ein eigener Knopf „Einnahme“ flogen auf seinen Wunsch raus, ebenso das Tempo (km/h) beim Laufband. Lehre: lieber wenige Knöpfe und Felder, Seltenes eine Ebene tiefer.
- Erfassen muss in Sekunden gehen: ein Tipp, tippen, fertig. Keine Pflichtfelder, keine Auswahl davor (Rückmeldung zu den Notizen, v51).
- Die farbigen Symbole der Bereiche auf Heute findet er „schön und cool“ (v54) und fragte, wo Farbe noch Sinn ergibt. Farbe darf also etwas mehr vorkommen, solange sie eine Bedeutung trägt (Farbe = Bereich). Meinen Vorschlag dazu hat er nach Bildern genau so übernommen (v55).
- Vorschaubilder kommen gut an: Für Änderungen am Aussehen erst ein Bild „jetzt / Vorschlag“ zeigen (im Test-Browser per eingefügtem CSS, ohne die App zu ändern), dann bauen. So sind v48 und v55 entstanden.
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
- Bei jeder Änderung an `index.html`: Cache-Name in `sw.js` (`takt-v57` → `takt-v58`), `<span class="ver">v57</span>` in der Fußzeile und die Nummer in dieser Datei gemeinsam hochzählen. Ohne neuen Cache-Namen sehen installierte Geräte die Änderung nicht. Reine Änderungen an den beiden Markdown-Dateien brauchen keine neue Version.
- Entwickelt wird auf dem Arbeitszweig der Sitzung. Was nach `main` geht, landet auf dem Handy des Nutzers. Ob direkt nach `main` veröffentlicht werden darf, in jeder neuen Sitzung einmal beim Nutzer erfragen.
- Nach dem Hochladen warten, bis Pages die neue Version ausliefert (das `sw.js` der Adresse zeigt den neuen Cache-Namen), dann dem Nutzer die Version nennen.

## Testen (vor jeder Veröffentlichung)
- Der Gesten-Test ist zeitempfindlich (ein Wisch muss in 0,7 s durch sein): Schlägt in einem vollen Lauf nur dort etwas fehl, zuerst einzeln wiederholen.
- `node tests/alle.js` muss „Alle Tests stimmen“ melden: Ablauf, Aufbau, Gesten, Löschen und Kategorien, Aufgaben und Notizen, Finanzen, Gym, Tages-Check, Speichern, Aktualisierung. Fingerzüge im Test: `oeffnen({ finger: true })` und `wischen()` aus `tests/lib.js`. Tests laufen mit „Bewegung reduzieren“, damit Zahlen sofort ihren Endwert zeigen; nur `gesten.js` läuft mit Bewegung (`bewegung: true`). Die Tests bedienen die App mit Playwright (vorinstalliertes Chromium), direkt als Datei geöffnet.
- `node tests/bilder.js <ordner> [2]` macht Bildschirmfotos aller Bereiche und Blätter (dunkel, hell, 390 und 320 px, leer und mit Beispieldaten). Die betroffenen Ansichten ansehen; für den Nutzer mit Schärfe 2.
- Nach dem Hochladen: `node tests/live.js` prüft die veröffentlichte App (Version, identisch mit dem Repository, offline). Das geht, weil die Umgebung „meine-app“ die Pages-Adresse erlaubt.
- Zu jeder neuen Funktion und jedem behobenen Fehler eine Prüfung in `tests/` ergänzen, mit der Rechnung als Kommentar. Rechenwerte immer von Hand nachrechnen.
- Meldet der Nutzer einen Fehler, zuerst seinen Fall nachstellen (seine Daten sind oft sehr klein: eine Übung, wenige Einheiten, alles im selben Monat). Auch an Daten denken, die mit einer älteren Version eingetragen wurden: Ihnen fehlen neuere Felder (so entstand der Fehler vor v42).
- Beispieldaten nicht per Start-Skript mit Merker einspielen: Der Test-Browser vergisst den Merker gelegentlich beim Neuladen und überschreibt dann die Daten. `oeffnen({ daten })` in `tests/lib.js` spielt sie einmal nach dem Laden ein.
- Service Worker und Selbst-Aktualisierung brauchen http: `tests/update.js` liefert die Dateien selbst aus, nur für die Dauer des Tests. Ein dauerhaft laufender lokaler Server wird von der Berechtigungsprüfung abgelehnt.
- Was Tests nicht zeigen, steht unter „iPhone-Besonderheiten“.
