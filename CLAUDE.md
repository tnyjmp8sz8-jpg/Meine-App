# Takt – Alltags-Tracker (v21)

Persönliche All-in-One-App als PWA: Routinen mit Timer, Gewicht, Haushalt mit Budgets, Training (Cardio und Gym). Sprache der Oberfläche und der Kommentare: Deutsch.

## Aufbau
- `index.html` – die ganze App in einer Datei: CSS im `<style>`, HTML mit allen Blättern (`<dialog>`), JavaScript in einem `<script>` (IIFE, kein Build, keine Abhängigkeiten).
- `sw.js` – Service Worker, cache-first mit Aktualisierung im Hintergrund. **Bei jeder Änderung an `index.html` den Cache-Namen hochzählen** (`takt-v21` → `takt-v22`), sonst sehen installierte Geräte die Änderung nicht.
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
- Der Abschnitt `persistence (db …)` enthält noch Code für einen Cloud-Abgleich (`window.claude`), der nicht aktiv ist: Beim Start wird `settle('local')` aufgerufen.

## Orientierung im Script
Die Abschnitte sind mit `/* ---------- Name ---------- */` markiert: helpers, state, persistence, actions, render, sheet, Gewicht, Haushalt, Training: Cardio, Training: Kraft (im Code heißt Gym „Kraft“), Kraft: Pläne und laufendes Training, Heute und Woche, Datensicherung, Bereiche, boot.
- Jeder Bereich hat eine `render…`-Funktion, die das HTML seiner `.view` neu schreibt, und einen Klick-Listener mit `data-…`-Attributen.
- Wochenleiste und Kalender: `weekStripHTML(mode)`, `calMarks(mode)`, `calHTML()`, `calDayHTML()`, `openCal(mode, tag)`. Modi: `all`, `rout`, `weight`, `money`, `cardio`, `gym`.
- Laufendes Training: `paintL()`, `liveTick()`, Zustand in `K.live`, Arbeitskopie `Lw`.

## Design-Regeln (verbindlich)
- Modern, clean, Apple-artig. Dunkel: fast schwarzer, leicht bläulicher Grund (`--bg`), Karten eine Stufe heller. Farben nur über die CSS-Variablen in `:root`.
- Flächen ohne Rand, Trennlinien nur in Listen, große Rundungen (Karten 20 px, Knöpfe 14 px, Chips als Pillen), Blätter mit Griff oben.
- Kompakt: Fließtext 15 px, Listen 14 px, Nebentexte 12–13 px, große Zahl höchstens 44 px. Tippflächen mindestens 40 px (kleinere Knöpfe bekommen per `::after` eine größere Tippfläche), Eingabefelder mindestens 16 px Schrift, sonst zoomt iOS beim Antippen hinein.
- Akzentblau nur für Aktionen, Links und aktive Auswahl. Grün = Training/erledigt/besser, Rot = schlechter/löschen.
- Pro Ansicht nur ein blauer Hauptknopf, Nebenaktionen als `.ghost`.
- Kennfarben der Bereiche (Routinen blau, Gewicht lila `--c-weight`, Haushalt orange `--c-money`, Training grün) stehen nur am Symbol in der Übersicht auf Heute, nicht in den Bereichen selbst.
- Systemschrift (San Francisco, sonst Inter), große Zahlen mit `var(--round)`.
- Abschnittstitel fett und normal geschrieben, keine kleinen Großbuchstaben-Labels.
- Nur was nötig ist und etwas bringt: keine erklärenden Überschriften ohne Nutzen, keine Beispiel-Chips, lange Listen einklappen, lieber ein Tipp weniger.
- Keine Töne, keine Countdowns mit Signal, keine Einstellungen, die niemand verlangt hat.
- Wortwahl in der Oberfläche: „Gym“, nicht „Kraft“.
- Hell und dunkel folgen der Systemeinstellung; beide prüfen, ebenso 320 px Breite.
- HTML wird per String gebaut: Nutzertexte immer durch `esc()` schicken.
