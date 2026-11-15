# Takt – Alltags-Tracker (v20)

Persönliche All-in-One-App als PWA: Routinen mit Timer, Gewicht, Haushalt mit Budgets, Training (Cardio und Gym). Sprache der Oberfläche und der Kommentare: Deutsch.

## Aufbau
- `index.html` – die ganze App in einer Datei: CSS im `<style>`, HTML mit allen Blättern (`<dialog>`), JavaScript in einem `<script>` (IIFE, kein Build, keine Abhängigkeiten).
- `sw.js` – Service Worker, cache-first mit Aktualisierung im Hintergrund. **Bei jeder Änderung an `index.html` den Cache-Namen hochzählen** (`takt-v20` → `takt-v21`), sonst sehen installierte Geräte die Änderung nicht.
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
- Modern, clean, Apple-artig, Soft Dark. Farben nur über die CSS-Variablen in `:root`.
- Flächen ohne Rand, Trennlinien nur in Listen, große Rundungen (Karten 22 px, Knöpfe 14–16 px, Chips als Pillen), Blätter mit Griff oben.
- Akzentblau nur für Aktionen, Links und aktive Auswahl. Grün = Training/erledigt/besser, Rot = schlechter/löschen.
- Systemschrift (San Francisco, sonst Inter), große Zahlen mit `var(--round)`.
- Abschnittstitel fett und normal geschrieben, keine kleinen Großbuchstaben-Labels.
- Nur was nötig ist und etwas bringt: keine erklärenden Überschriften ohne Nutzen, keine Beispiel-Chips, lange Listen einklappen, lieber ein Tipp weniger.
- Keine Töne, keine Countdowns mit Signal, keine Einstellungen, die niemand verlangt hat.
- Wortwahl in der Oberfläche: „Gym“, nicht „Kraft“.
- Hell und dunkel folgen der Systemeinstellung; beide prüfen, ebenso 320 px Breite.
- HTML wird per String gebaut: Nutzertexte immer durch `esc()` schicken.
