#!/bin/bash
# Hilfe für Claude: Bau der iPhone-App bei Codemagic starten, abwarten und die Ergebnisse holen.
# Aufruf: bash ios/cm.sh <Zweig> <Zielordner>      (oder: bash ios/cm.sh - <Zielordner> <Bau-Kennung>, um nur abzuwarten)
# Der Zugangsschlüssel liegt als Netzwerk-Geheimnis in der Umgebung; die Kopfzeile unten ist nur ein Platzhalter, den der Proxy ersetzt.
set -u
API=https://api.codemagic.io; KOPF="x-auth-token: proxy-injected"; APP=6afc7ef073cf006a2044f541
ZIEL="$2"; mkdir -p "$ZIEL"
ID="${3:-}"
if [ -z "$ID" ]; then
  ID=$(curl -sS -m 30 -H "Content-Type: application/json" -H "$KOPF" -d "{ \"appId\": \"$APP\", \"workflowId\": \"iphone\", \"branch\": \"$1\" }" -X POST $API/builds | python3 -c "import json,sys; print(json.load(sys.stdin).get('buildId',''))")
fi
[ -n "$ID" ] || { echo "Bau ließ sich nicht starten"; exit 1; }
echo "BAU $ID"
for I in $(seq 1 120); do
  S=$(curl -sS -m 30 -H "$KOPF" "$API/builds/$ID" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('build',d).get('status'))" 2>/dev/null)
  case "$S" in finished|failed|canceled|timeout|skipped) break;; esac
  sleep 20
done
curl -sS -m 30 -H "$KOPF" "$API/builds/$ID" > "$ZIEL/bau.json"
python3 - "$ZIEL" <<'PY'
import json, sys, subprocess, os
ziel = sys.argv[1]; b = json.load(open(ziel + '/bau.json')); b = b.get('build', b)
print('STATUS', b.get('status'), b.get('message') or '')
kopf = ['-H', 'x-auth-token: proxy-injected']
for a in b.get('buildActions', []):
    print(' ', a.get('name'), '|', a.get('status'))
    # Protokoll des Schritts, der nicht durchlief: die letzten 120 Zeilen
    if a.get('status') not in ('success', None, 'skipped') and a.get('logUrl'):
        log = subprocess.run(['curl', '-sS', '-L', '-m', '60'] + kopf + [a['logUrl']], capture_output=True, text=True).stdout
        open(ziel + '/fehler.log', 'w').write(log); print('\n'.join(log.splitlines()[-120:]))
for x in b.get('artefacts', []):
    name = os.path.basename(x.get('name') or 'datei'); print('ARTEFAKT', name, x.get('size'), x.get('url'))
    subprocess.run(['curl', '-sS', '-L', '-m', '180'] + kopf + ['-o', ziel + '/' + name, x['url']])
PY
