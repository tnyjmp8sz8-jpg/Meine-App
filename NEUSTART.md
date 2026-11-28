# Neustart: Track. mit neuem Claude-Konto oder neuem PC

Alles, was Claude zum Weitermachen braucht, steht hier im Repository auf GitHub (`tnyjmp8sz8-jpg/Meine-App`, Zweig `main`): `CLAUDE.md` (Wissen, Regeln, deine Vorlieben), `PROGRESS.md` (Stand, offene Fragen, nächste Schritte), `BEREICHE.md` und `IPHONE.md` (Einzelheiten). Claude hält diese Dateien nach jedem Chat selbst aktuell. Solange dein GitHub-Konto da ist, geht beim Umzug nichts verloren, und eine neue Sitzung weiß alles, was die alte wusste.

## Was wo liegt
- Die App und alles Wissen: GitHub. Die App läuft unter https://tnyjmp8sz8-jpg.github.io/Meine-App/
- Deine Daten (Gym, Gewicht, Finanzen, Notizen, Arbeit): nur auf deinem iPhone in der App. Die iPhone-App legt bei jeder Änderung selbst eine Sicherung ab (Dateien › Auf meinem iPhone › Track., die neuesten 14), dazu „Sicherung speichern“ in den Einstellungen. Nichts davon liegt bei Claude oder auf GitHub.
- Die iPhone-App zum Installieren: GitHub, Release „iphone-test“ (Datei `Track.ipa`), gebaut von GitHub. Installiert wird sie wie bisher mit AltStore und deiner Apple-ID.
- Am Claude-Konto hängen nur zwei Dinge: die Verbindung zu GitHub und die Umgebung „Meine-App“. Geplante Aufgaben oder gespeicherte Schlüssel gibt es für Track. keine.

## Umzug in ein neues Claude-Konto (rund 5 Minuten)
1. Neues Konto anlegen, mit einem Plan, der Claude Code enthält.
2. claude.ai/code öffnen (im Browser oder in der Claude-App am iPhone), GitHub verbinden und der Claude-App bei GitHub den Zugriff auf das Repository „Meine-App“ erlauben.
3. Eine Umgebung anlegen: Name „Meine-App“, Netzwerk „uneingeschränkt“, keine Umgebungsvariablen, kein Einrichtungsskript, Repository „Meine-App“. So war es im alten Konto.
4. Eine neue Sitzung mit dem Repository „Meine-App“ starten. Für dieselbe Qualität: das stärkste Modell (Opus) und die Denkstufe „hoch“ wählen.
5. Erste Nachricht: „Lies CLAUDE.md und PROGRESS.md und mach dort weiter, wo wir aufgehört haben.“

Alte Chats musst du nicht mitnehmen. Hattest du im alten Konto unter den Einstellungen eigene Anweisungen eingetragen, kannst du sie übernehmen; nötig ist es nicht, alles Wichtige steht in `CLAUDE.md`.

## Neuer PC
- Am einfachsten: nichts installieren und weiter im Browser über claude.ai/code arbeiten. Die Sitzung läuft in der Cloud, dort ist alles für die Tests schon da.
- Nur wenn du Claude Code direkt auf dem PC nutzen willst: Git und Node.js installieren, das Repository klonen, im Ordner `npm install playwright` und `npx playwright install chromium` ausführen. Dann laufen die Tests mit `node tests/alle.js`. Der WebKit-Test (`tests/webkit.py`) läuft nur unter Linux, also in der Cloud.
- Einen Mac brauchst du nicht: Die iPhone-App baut GitHub.

## Wenn das GitHub-Konto weg wäre
Dann wären Repository, App-Adresse und die Datei zum Installieren weg, deine Daten nicht (iPhone und Sicherungen). Vorsorge: ab und zu auf GitHub „Code › Download ZIP“ und die Datei in iCloud oder „Dateien“ ablegen.

## Nie
Schlüssel, Passwörter oder Zugangsdaten in den Chat schreiben. Das Repository ist öffentlich: Persönliche Daten (Kontostände, Kalendernamen, Trainingswerte) kommen nicht hinein.
