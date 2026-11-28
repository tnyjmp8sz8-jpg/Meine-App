#!/bin/bash
# Baut die iPhone-App und prüft sie im Simulator. Läuft auf einem Mac mit Xcode: bei GitHub (.github/workflows/ios.yml) oder bei Codemagic (codemagic.yaml).
# Ergebnis im Ordner ios/: Track.ipa (unsigniert, zum Installieren mit AltStore), simulator.png, widget.png, schnell-*.png (Notiz, Ausgabe, Termin), pruefung-1…3.json.
# Die IPA entsteht erst, wenn alle Prüfungen bestanden sind.
set -eo pipefail
cd "$(dirname "$0")"
rm -rf web build Payload Track.ipa.neu Track.ipa simulator.png widget.png widget-tag.png schnell-*.png pruefung-*.json

echo "== Web-App in die Hülle legen, Projekt erzeugen =="
mkdir -p web
cp ../index.html ../manifest.webmanifest ../icon-180.png ../icon-192.png ../icon-512.png web/
command -v xcodegen > /dev/null || brew install xcodegen
xcodegen generate
xcodebuild -version

fehler() { grep -E "error|BUILD" -B2 -A6 "$1" | head -150; exit 1; }

echo "== Für den Simulator bauen =="
# Für den Simulator signiert Xcode von selbst „zum lokalen Ausführen“; nur so kommen die Freigaben (App-Gruppe für das Widget) in die App
xcodebuild -project Track.xcodeproj -scheme Track -sdk iphonesimulator -configuration Debug -derivedDataPath build/sim CODE_SIGN_IDENTITY=- build > sim.log 2>&1 || fehler sim.log
tail -3 sim.log
SIM=build/sim/Build/Products/Debug-iphonesimulator/Track.app
test -d "$SIM/PlugIns/TrackWidget.appex"

echo "== Für das iPhone bauen (unsigniert) =="
xcodebuild -project Track.xcodeproj -scheme Track -sdk iphoneos -configuration Release -derivedDataPath build/ios CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" build > ios.log 2>&1 || fehler ios.log
tail -3 ios.log
mkdir Payload && cp -R build/ios/Build/Products/Release-iphoneos/Track.app Payload/
# Freigaben (App-Gruppe, Health) ohne Zertifikat in die App schreiben: AltStore liest sie beim Installieren und richtet die App-Gruppe dafür ein.
# Erst das Widget, dann die App.
codesign --force --sign - --entitlements Info/Widget.entitlements Payload/Track.app/PlugIns/TrackWidget.appex
codesign --force --sign - --entitlements Info/Track.entitlements Payload/Track.app
codesign -d --entitlements - Payload/Track.app 2>&1 | grep -E "application-groups|healthkit|group\."
codesign -d --entitlements - Payload/Track.app/PlugIns/TrackWidget.appex 2>&1 | grep -E "application-groups|group\."
plutil -p Payload/Track.app/Info.plist | grep -E "CFBundleURLSchemes|trackpunkt|NSHealthShare|CFBundleShortVersionString|CFBundleIdentifier|UILaunchScreen|UIFileSharingEnabled|LSSupportsOpeningDocumentsInPlace"
# Beide Schlüssel müssen da sein, sonst erscheint der Ordner mit den Sicherungen nicht in „Dateien“ (Auf meinem iPhone › Track.)
test "$(plutil -p Payload/Track.app/Info.plist | grep -c -E "UIFileSharingEnabled|LSSupportsOpeningDocumentsInPlace")" = 2
# Kalender (1.3): Ohne diesen Text beendet iOS die App, sobald sie nach dem Zugriff fragt
plutil -p Payload/Track.app/Info.plist | grep -q NSCalendarsFullAccessUsageDescription
plutil -p Payload/Track.app/PlugIns/TrackWidget.appex/Info.plist | grep -E "NSExtensionPointIdentifier|CFBundleIdentifier|CFBundleShortVersionString"
# Aktionen für Kurzbefehle (Notiz, Ausgabe, je drei für Läufe und Krafttraining von der Uhr) müssen in der App beschrieben sein, sonst erscheinen sie dort nicht
ls Payload/Track.app/Metadata.appintents
for AKTION in NotizHinzufuegen AusgabeEintragen LaufMerken LaufZeitraum LaufEintragen GymMerken GymZeitraum GymEintragen; do
  grep -q "$AKTION" Payload/Track.app/Metadata.appintents/extract.actionsdata || { echo "Aktion fehlt: $AKTION"; exit 1; }
done
zip -qr Track.ipa.neu Payload
ls -la Track.ipa.neu

echo "== Im Simulator prüfen und Bilder machen =="
GERAET=$(xcrun simctl list devices available | grep -m1 -E "iPhone 1[5-9]|iPhone [2-9][0-9]" | grep -oE "[0-9A-F-]{36}")
xcrun simctl list devices available | grep -m3 iPhone
xcrun simctl boot "$GERAET" || true
xcrun simctl bootstatus "$GERAET" -b
xcrun simctl ui "$GERAET" appearance dark
xcrun simctl install "$GERAET" "$SIM"
# Kalender (1.3): Der Selbsttest legt dort einen Termin an, liest, ändert und löscht ihn. Die Abfrage von iOS kann im Simulator niemand antippen, deshalb vorab erlaubt.
xcrun simctl privacy "$GERAET" grant calendar de.trackapp.track
# Dreimal starten: Der Zähler im Speicher der Web-App muss 1, 2, 3 zeigen, sonst überlebt der Speicher den Neustart nicht.
# Vor dem Beenden geht die App in den Hintergrund (Einstellungen öffnen), wie auf einem echten iPhone.
DATEN=$(xcrun simctl get_app_container "$GERAET" de.trackapp.track data)
for LAUF in 1 2 3; do
  rm -f "$DATEN/Documents/pruefung.json"
  xcrun simctl launch "$GERAET" de.trackapp.track -pruefen
  for I in $(seq 1 30); do [ -f "$DATEN/Documents/pruefung.json" ] && break; sleep 2; done
  echo "PRUEFUNG $LAUF: $(cat "$DATEN/Documents/pruefung.json" 2>/dev/null || echo 'keine Datei')"
  cp "$DATEN/Documents/pruefung.json" "pruefung-$LAUF.json" 2>/dev/null || true
  if [ "$LAUF" = 3 ]; then break; fi
  sleep 4
  xcrun simctl launch "$GERAET" com.apple.Preferences; sleep 4
  xcrun simctl terminate "$GERAET" de.trackapp.track; sleep 2
done
# Inhalt des Widgets (dunkel und hell) als Bild, dann die App selbst
xcrun simctl terminate "$GERAET" de.trackapp.track; sleep 2
xcrun simctl launch "$GERAET" de.trackapp.track -widgetbild; sleep 10   # 1.4: nach 6 s war das Bild auf dem langsamen Mac noch schwarz
xcrun simctl io "$GERAET" screenshot widget.png
# Großes Widget „Notizen & Kalender“ (1.4): dunkel mit Notizen und Terminen, hell ohne Termine
xcrun simctl terminate "$GERAET" de.trackapp.track; sleep 2
xcrun simctl launch "$GERAET" de.trackapp.track -tagbild; sleep 6
xcrun simctl io "$GERAET" screenshot widget-tag.png
xcrun simctl terminate "$GERAET" de.trackapp.track; sleep 2
xcrun simctl launch "$GERAET" de.trackapp.track -ohneFragen; sleep 6
xcrun simctl io "$GERAET" screenshot simulator.png
# Schnelleingabe aus dem Widget (Bilder für Notiz und Ausgabe). Gestartet mit „-schnell …“ statt über die Adresse: Im Simulator fragt die Adresse erst „Open in Track.?“.
# „-schnellkonten“ zeigt bei der Ausgabe drei Beispielkonten (im Simulator gibt es keine eigenen).
xcrun simctl terminate "$GERAET" de.trackapp.track; sleep 2
xcrun simctl launch "$GERAET" de.trackapp.track -ohneFragen -schnell notiz; sleep 5
xcrun simctl io "$GERAET" screenshot schnell-notiz.png
xcrun simctl terminate "$GERAET" de.trackapp.track; sleep 2
xcrun simctl launch "$GERAET" de.trackapp.track -ohneFragen -schnell ausgabe -schnellkonten; sleep 5
xcrun simctl io "$GERAET" screenshot schnell-ausgabe.png
# Dasselbe ohne vorbelegtes Konto („-schnelloffen“: mehrere Konten, noch keines benutzt): Dann steht „Konto wählen“ über der Reihe, und der Haken ist gesperrt.
xcrun simctl terminate "$GERAET" de.trackapp.track; sleep 2
xcrun simctl launch "$GERAET" de.trackapp.track -ohneFragen -schnell ausgabe -schnellkonten -schnelloffen; sleep 5
xcrun simctl io "$GERAET" screenshot schnell-ausgabe-offen.png
# Termin (1.6): ein Satz, darunter was eingetragen wird, und die Kalender (drei Beispielkalender)
xcrun simctl terminate "$GERAET" de.trackapp.track; sleep 2
xcrun simctl launch "$GERAET" de.trackapp.track -ohneFragen -schnell termin -schnellkonten; sleep 5
xcrun simctl io "$GERAET" screenshot schnell-termin.png
# Mit „-schnellprobe“ trägt sie von selbst „Schnell notiert“ ein und geht zurück auf den Home-Bildschirm (Bild danach).
# Die Notiz muss dann im gemeinsamen Ordner für das Widget stehen.
xcrun simctl terminate "$GERAET" de.trackapp.track; sleep 2
xcrun simctl launch "$GERAET" de.trackapp.track -ohneFragen -schnell notiz -schnellprobe; sleep 7
xcrun simctl io "$GERAET" screenshot schnell-danach.png
GRUPPE=$(xcrun simctl get_app_container "$GERAET" de.trackapp.track groups | awk '{print $2}' | head -1)
echo "Gruppe: $GRUPPE"; cat "$GRUPPE/stand.json" | head -c 600; echo
grep -q "Schnell notiert" "$GRUPPE/stand.json"
# Dasselbe für die Ausgabe: Die Probe trägt 4,20 ein, stellt auf Einnahme und wählt das zweite Beispielkonto.
# Den Auftrag legt sie dabei zusätzlich als Datei ab: Er muss k „in“ und acc „b2“ tragen, so erwartet ihn die Web-App.
xcrun simctl terminate "$GERAET" de.trackapp.track || true; sleep 2
rm -f "$DATEN/Documents/schnellprobe.json"
xcrun simctl launch "$GERAET" de.trackapp.track -ohneFragen -schnell ausgabe -schnellkonten -schnellprobe; sleep 7
echo "SCHNELLPROBE: $(cat "$DATEN/Documents/schnellprobe.json" 2>/dev/null || echo 'keine Datei')"
grep -q '"k":"in"' "$DATEN/Documents/schnellprobe.json"
grep -q '"acc":"b2"' "$DATEN/Documents/schnellprobe.json"
# Dasselbe für den Termin (1.6): Die Probe schreibt „Track Schnellprobe morgen 15 Uhr“ und wählt den zweiten Beispielkalender (b2, den es nicht gibt: dann der von iOS).
# Im Kalender muss genau ein Termin „Track Schnellprobe“ stehen, 60 Minuten lang, nicht ganztägig, ohne Fehler (danach löscht die Probe ihn wieder).
xcrun simctl terminate "$GERAET" de.trackapp.track || true; sleep 2
rm -f "$DATEN/Documents/schnellprobe.json"
xcrun simctl launch "$GERAET" de.trackapp.track -ohneFragen -schnell termin -schnellkonten -schnellprobe; sleep 7
echo "TERMINPROBE: $(cat "$DATEN/Documents/schnellprobe.json" 2>/dev/null || echo 'keine Datei')"
grep -q '"t":"Track Schnellprobe"' "$DATEN/Documents/schnellprobe.json"
grep -q '"gefunden":1' "$DATEN/Documents/schnellprobe.json"
grep -q '"minuten":60' "$DATEN/Documents/schnellprobe.json"
grep -q '"fehler":""' "$DATEN/Documents/schnellprobe.json"
grep -q '"kal":"b2"' "$DATEN/Documents/schnellprobe.json"
# Speicher übersteht Neustarts · Web-App und Hülle sind verbunden · der Stand liegt für das Widget bereit (8 Tage) · Plan der Mitteilungen stimmt
grep -q '"starts":3' pruefung-3.json
grep -q '"bruecke":true' pruefung-3.json
grep -q '"widgetTage":8' pruefung-3.json
# Eingang (Widget, Kurzbefehle): drei Notizen vorgemerkt, eine abgehakt → 2 Notizen in der Web-App, nichts bleibt vorgemerkt
grep -q '"notizenZahl":2' pruefung-3.json
grep -q '"eingangRest":0' pruefung-3.json
# Sicherung von selbst: Beim Verlassen nach dem ersten und zweiten Start schickt die Web-App ihre Sicherung, je Tag eine Datei
# (track-automatisch-JJJJ-MM-TT.json). Beim dritten Start liegt genau eine in „Dokumente“, lesbar und mit app „takt“.
# (Läuft der Bau über Mitternacht, wären es zwei: dann neu starten.)
grep -q '"sicherungen":1[,}]' pruefung-3.json
grep -q '"sicherungOk":true' pruefung-3.json
# Läufe von der Apple Watch über Kurzbefehle (Uhr.swift). Rechnung: zwei Läufe erkannt, der erste dauert 2713 s, Kennung k + 1 800 000 000 000 / 60 000.
# Ganzer Weg: Start 1 liefert 0,80 km, Start 2 dieselbe Lesung mit 0,85 km, Start 3 nichts Neues → ein Lauf mit 850 m, 300 s, Puls (140 + 150) / 2 = 145
grep -q '"uhrRechnung":"2|2713|k30000000|true|true"' pruefung-3.json
grep -q '"lauf":"1|850|300|145"' pruefung-3.json
# Krafttraining von der Apple Watch über Kurzbefehle (Gym.swift). Rechnung: ein Training von 3600 s, Kennung g + 1 800 000 000 000 / 60 000, dieselben Werte noch einmal ergeben nichts Neues.
# Ganzer Weg: Start 1 liefert Puls 120 und 130, Start 2 dieselbe Lesung mit 130 und 140, Start 3 nichts Neues → für heute ein Training mit 1800 s, Puls (130 + 140) / 2 = 135
grep -q '"gymRechnung":"1|3600|g30000000|true"' pruefung-3.json
grep -q '"gym":"1|1800|135"' pruefung-3.json
# Frage beim Bezahlen und Widget „Überblick“ (1.2): Der Stand im gemeinsamen Ordner trägt die Kategorien und mindestens eine Zahl
grep -q '"kats":[1-9]' pruefung-3.json
grep -q '"zahlen":[1-4][,}]' pruefung-3.json
# Kalender (1.3): ein Termin angelegt und gefunden, 60 Minuten, Erinnerung 30 Minuten vorher, nach dem Umbenennen einer, nach dem Löschen keiner;
# und die Web-App hat Zustand und Liste bekommen
# Ab 1.4 dazu: die Liste für das große Widget fand den Termin einmal, und es gibt Kalender zur Wahl (k)
grep -q '"kalender":"an|1|60|30|1|0|1|k"' pruefung-3.json
# Händler, die die App selbst einsortiert (1.4): Wörter im Stand, Regel wie in der App
grep -q '"muster":true' pruefung-3.json
grep -q '"kalenderWeb":"an|liste"' pruefung-3.json
# Schnelleingabe „Termin“ (1.6): Tag und Uhrzeit aus dem Satz wie in der App (Rechnung in TerminLesen.swift)
grep -q '"terminLesen":"Zahnarzt|2026-11-29|900|960;Kino|2026-12-04|1215|1275;Klausur|2026-12-03|540|660;Treffen|2027-01-02|540|600;guten Morgen sagen|-|-|-;Urlaub|2026-12-24|-|-"' pruefung-3.json
grep -q 'sicherung-0 20.11. 18:00, sicherung-1 23.11. 18:00' pruefung-3.json
grep -q 'ablauf 20.11. 12:00' pruefung-3.json
mv Track.ipa.neu Track.ipa
echo "== Alles bestanden: Track.ipa ist fertig =="
