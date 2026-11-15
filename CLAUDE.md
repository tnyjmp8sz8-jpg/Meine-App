# Takt – Alltags-Tracker (v35)

Persönliche All-in-One-App als PWA: Routinen mit Timer, Gewicht, Finanzen mit Budgets, Training (Cardio und Gym). Sprache der Oberfläche und der Kommentare: Deutsch.

## Aufbau
- `index.html` – die ganze App in einer Datei: CSS im `<style>`, HTML mit allen Blättern (`<dialog>`), JavaScript in einem `<script>` (IIFE, kein Build, keine Abhängigkeiten).
- `sw.js` – Service Worker, cache-first mit Aktualisierung im Hintergrund. **Bei jeder Änderung an `index.html` den Cache-Namen hochzählen** (`takt-v35` → `takt-v36`) **und dieselbe Nummer unten in der Fußzeile eintragen** (`<span class="ver">v35</span>` in `index.html`), sonst sehen installierte Geräte die Änderung nicht. Mit neuem Cache-Namen aktualisiert sich die App selbst: Beim Öffnen sucht sie nach einem neuen `sw.js` und lädt einmal neu, sobald er übernimmt (nicht, solange ein Blatt offen ist).
- `manifest.webmanifest`, `icon-*.png` – Installation auf dem Homescreen.
- Kein Server nötig: statisch ausliefern (z. B. `python3 -m http.server`), der Service Worker braucht http(s) oder localhost.

## Daten
- Alles liegt lokal in `localStorage` unter `takt.v1` als `{ S, LY, W, MF, MY, T, K }`:
  - `S` Routinen und laufender Timer, `LY` Tagesprotokoll der Routinen je Jahr
  - `W` Gewicht (`entries` je Datum, Ziel)
  - `MF` feste Posten, Budgets, `roll` (Rest mitnehmen je Kategorie), `MY` Buchungen je Jahr
  - `T` Läufe, `K` Gym: `ex` Übungen, `plans`, `log` je Datum, `meta`, `live` (laufendes Training)
- Jede Datengruppe läuft beim Laden durch eine `norm…`-Funktion. **Neue Felder dort eintragen, sonst gehen sie beim Laden verloren.**
- Datumsschlüssel sind `YYYY-MM-DD` in Ortszeit, Geldbeträge in Cent.
- Sicherung: „Sicherung speichern/einlesen“ auf Heute (JSON). Einlesen ergänzt die vorhandenen Daten; gleiche Einträge werden überschrieben.
- Es gibt keinen Server und keinen Abgleich: Jede Änderung endet in `saveLocal()`. Die Datengruppen ändert man über `patchW(…)` bzw. `mfdoc`/`mdoc(jahr)`/`tdoc`/`kdoc` mit `.patch({…})` (`null` löscht einen Eintrag).
- Erinnerung auf Heute (`backupDue()`): erscheint, wenn die letzte Sicherung mindestens 14 Tage alt ist. Der Zeitpunkt steht in `localStorage` unter `takt.backup`.
- Die App lädt nichts von fremden Servern nach (keine Schriften, keine Skripte), sie läuft komplett offline.

## Orientierung im Script
Die Abschnitte sind mit `/* ---------- Name ---------- */` markiert: helpers, state, persistence, actions, render, sheet, Gewicht, Haushalt, Training: Cardio, Training: Kraft (im Code heißt Gym „Kraft“), Kraft: Pläne und laufendes Training, Heute und Woche, Datensicherung, Bereiche, boot.
- Jeder Bereich hat eine `render…`-Funktion, die das HTML seiner `.view` neu schreibt, und einen Klick-Listener mit `data-…`-Attributen.
- Wochenleiste und Kalender: `weekStripHTML(mode)`, `calMarks(mode)`, `calHTML()`, `calDayHTML()`, `openCal(mode, tag)`. Modi: `all`, `rout`, `weight`, `money`, `cardio`, `gym`.
- Laufendes Training: `paintL()`, `liveTick()`, Zustand in `K.live`, Arbeitskopie `Lw`.
- Verlauf einer Übung: Im laufenden Training stehen unter den Sätzen die Karte „Letztes Mal“ und die Kennzahlen (`exFigsHTML()`). Ein Tipp auf die Karte öffnet das Blatt der Übung nur zum Ansehen (`openX(id, true)`) mit Graph (`exChartHTML()`) und dem Recap, dessen Einheiten als Karten mit Satz-Tabelle (`exCard()`) erscheinen, so vom Nutzer nach dem Vorbild Alpha Progression gewünscht. Aus der Übungsliste (`openX(id)`) kommen Umbenennen und Löschen dazu.
- Recap im Gym-Bereich (Monat/Jahr wie Cardio, gemeinsamer Zeitraum `tMode`, `tYM`, `tYear`): `kPeriod('YYYY-MM' oder 'YYYY')` liefert Einheiten, bewegtes Gewicht, Zeit und die Verbesserung = Schnitt über alle Übungen. Je Übung rechnet `exDelta(hist, zeitraum)`: bester Stand am Ende gegenüber dem Stand davor, im ersten Monat gegenüber der ersten Einheit. Die Übungsliste (`kExFoldHTML()`) zeigt die Verbesserung im gewählten Zeitraum.
- Recap je Übung im Blatt der Übung (`exRecapHTML()`, Zustand `xMode`, `xYM`, `xYear`): dieselben Knöpfe Monat/Jahr und Pfeile, Verbesserung, bester Stand, Einheiten; im Monat die Einheiten als Karten, im Jahr die Monate.
- Blätter immer mit `openDlg(dialog)` öffnen, nie direkt mit `showModal()`: sonst zeichnet das iPhone einen Fokus-Rahmen um den ersten Knopf.

## Design-Regeln (verbindlich)
- Modern, clean, Apple-artig. Dunkel: fast schwarzer, leicht bläulicher Grund (`--bg`), Karten eine Stufe heller. Farben nur über die CSS-Variablen in `:root`.
- Flächen ohne Rand, Trennlinien nur in Listen, große Rundungen (Karten 20 px, Knöpfe 14 px, Chips als Pillen), Blätter mit Griff oben.
- Kompakt: Fließtext 15 px, Listen 14 px, Nebentexte 12–13 px, große Zahl höchstens 44 px. Tippflächen mindestens 40 px (kleinere Knöpfe bekommen per `::after` eine größere Tippfläche), Eingabefelder mindestens 16 px Schrift, sonst zoomt iOS beim Antippen hinein.
- Akzentblau nur für Aktionen, Links und aktive Auswahl. Grün = Training/erledigt/besser, Rot = schlechter/löschen.
- Pro Ansicht nur ein blauer Hauptknopf, Nebenaktionen als `.ghost`.
- Kennfarben der Bereiche (Routinen blau, Gewicht lila `--c-weight`, Finanzen orange `--c-money`, Training grün) stehen nur am Symbol in der Übersicht auf Heute, nicht in den Bereichen selbst.
- Systemschrift des Geräts (auf Apple-Geräten San Francisco), große Zahlen mit `var(--round)`.
- Abschnittstitel fett und normal geschrieben, keine kleinen Großbuchstaben-Labels.
- Nur was nötig ist und etwas bringt: keine erklärenden Überschriften ohne Nutzen, keine Beispiel-Chips, lange Listen einklappen, lieber ein Tipp weniger.
- Keine Töne, keine Countdowns mit Signal, keine Einstellungen, die niemand verlangt hat.
- Wortwahl in der Oberfläche: „Gym“, nicht „Kraft“; „Finanzen“, nicht „Haushalt“ (im Code heißt der Bereich weiter `haushalt`).
- Hell und dunkel folgen der Systemeinstellung; beide prüfen, ebenso 320 px Breite.
- HTML wird per String gebaut: Nutzertexte immer durch `esc()` schicken.
- Nichts darf seitlich wischbar oder abgeschnitten sein. Datumsfelder brauchen auf dem iPhone `appearance:none` (steht im CSS), sonst werden sie breiter als ihr Platz. Das lässt sich im Test-Browser nicht nachstellen: nach Änderungen an Blättern den Nutzer bitten, am iPhone zu prüfen.

## Zusammenarbeit (vom Nutzer so gewünscht)
- Sprache: Deutsch, einfache Worte, kurz. Der Nutzer ist kein Entwickler und bedient GitHub nur am iPhone.
- Zu jeder Änderung einen eigenen, konkreten Verbesserungsvorschlag mitbringen (nur vorschlagen, nicht ungefragt umsetzen). Richtung: clean, modern, angenehm, alltagstauglich. Stetiger Fortschritt in kleinen Schritten.
- Nichts umsetzen, wovon man selbst nicht überzeugt ist. Ist ein Wunsch des Nutzers keine gute Idee, das offen sagen und eine bessere Lösung nennen.
- Vor jeder Veröffentlichung im Test-Browser prüfen (dunkel, hell, 320 px, Ablauf mit Daten) und die Version hochzählen.
- Auslieferung: Der Zweig `main` wird über GitHub Pages ausgeliefert (https://tnyjmp8sz8-jpg.github.io/Meine-App/). Was nach `main` geht, landet auf dem Handy des Nutzers. Ob direkt veröffentlicht werden darf, in jeder neuen Sitzung beim Nutzer erfragen.
- Nach einer Veröffentlichung sagen, welche Version live ist. Der Nutzer prüft das an der Nummer in der Fußzeile.

## Was dem Nutzer gefällt (aus Rückmeldungen gelernt)
- Der Look von v21 an („genau getroffen“): fast schwarzer, bläulicher Grund, Karten nur eine Stufe heller, wenige farbige Akzente mit Bedeutung.
- Kompakt statt groß: viel auf einen Blick, eine Liste statt mehrerer großer Karten, Heute passt auf einen Bildschirm.
- Farbe als Detail, nicht als Fläche: Bereichs-Symbole, Punkte, ein blauer Hauptknopf.
- Ruhig: keine Töne, keine Ränder um Karten, keine Großbuchstaben-Labels, keine erklärenden Texte ohne Nutzen.
- Im Zweifel die schlichtere Lösung wählen und lieber etwas weglassen.
- Überall ein Plus oder Minus zum Zeitraum davor zeigen (Monat, Jahr, je Übung), grün oder rot. Zahlen ohne Vergleich sagen dem Nutzer wenig.
- Listen, die mit der Zeit wachsen, dürfen nie unübersichtlich werden: zuerst nur die letzten drei zeigen, aufgeklappt nach Monaten gruppieren und jeden Monat einklappbar machen. Dafür gibt es `monthsHTML()` und `monToggle()`; so gebaut sind die Einträge beim Gewicht. Läufe, Gym-Einheiten und Ausgaben zeigen nur den oben gewählten Monat. Im Gym-Bereich sind „Übungen“ und „Einheiten“ je eine eingeklappte Zeile mit Anzahl, die ein Tipp aufklappt; diese Form mag der Nutzer.
- Klein wirkt edler: neue Ansichten von Anfang an kompakt bauen, nie groß. Eine Ansicht darf dafür lang sein und scrollen (z. B. laufendes Training mit Verlauf darunter).
