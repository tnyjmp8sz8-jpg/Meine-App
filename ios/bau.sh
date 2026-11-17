#!/bin/bash
# Baut die iPhone-App und prüft sie im Simulator. Läuft auf einem Mac mit Xcode: bei GitHub (.github/workflows/ios.yml) oder bei Codemagic (codemagic.yaml).
# Ergebnis im Ordner ios/: Track.ipa (unsigniert, zum Installieren mit AltStore), simulator.png, widget.png, pruefung-1…3.json.
# Die IPA entsteht erst, wenn alle Prüfungen bestanden sind.
set -eo pipefail
cd "$(dirname "$0")"
rm -rf web build Payload Track.ipa.neu Track.ipa simulator.png widget.png pruefung-*.json

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
plutil -p Payload/Track.app/Info.plist | grep -E "CFBundleURLSchemes|trackpunkt|NSHealthShare|CFBundleShortVersionString|CFBundleIdentifier|UILaunchScreen"
plutil -p Payload/Track.app/PlugIns/TrackWidget.appex/Info.plist | grep -E "NSExtensionPointIdentifier|CFBundleIdentifier|CFBundleShortVersionString"
zip -qr Track.ipa.neu Payload
ls -la Track.ipa.neu

echo "== Im Simulator prüfen und Bilder machen =="
GERAET=$(xcrun simctl list devices available | grep -m1 -E "iPhone 1[5-9]|iPhone [2-9][0-9]" | grep -oE "[0-9A-F-]{36}")
xcrun simctl list devices available | grep -m3 iPhone
xcrun simctl boot "$GERAET" || true
xcrun simctl bootstatus "$GERAET" -b
xcrun simctl ui "$GERAET" appearance dark
xcrun simctl install "$GERAET" "$SIM"
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
xcrun simctl launch "$GERAET" de.trackapp.track -widgetbild; sleep 6
xcrun simctl io "$GERAET" screenshot widget.png
xcrun simctl terminate "$GERAET" de.trackapp.track; sleep 2
xcrun simctl launch "$GERAET" de.trackapp.track -ohneFragen; sleep 6
xcrun simctl io "$GERAET" screenshot simulator.png
# Speicher übersteht Neustarts · Web-App und Hülle sind verbunden · der Stand liegt für das Widget bereit (8 Tage) · Plan der Mitteilungen stimmt
grep -q '"starts":3' pruefung-3.json
grep -q '"bruecke":true' pruefung-3.json
grep -q '"widgetTage":8' pruefung-3.json
grep -q 'sicherung-0 20.11. 18:00, sicherung-1 23.11. 18:00' pruefung-3.json
grep -q 'ablauf 20.11. 12:00' pruefung-3.json
mv Track.ipa.neu Track.ipa
echo "== Alles bestanden: Track.ipa ist fertig =="
