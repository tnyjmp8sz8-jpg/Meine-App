# Zeichnet die App mit WebKit (WebKitGTK, derselbe Kern wie Safari am iPhone) in dreifacher Schärfe als Bild: Was Chromium anders zeichnet als das iPhone, zeigt sich hier.
# Einrichten (einmal je Sitzung): apt-get update && apt-get install -y --no-install-recommends libwebkit2gtk-4.1-0 gir1.2-webkit2-4.1 gir1.2-gtk-3.0 python3-gi-cairo
# Aufruf: GDK_SCALE=3 WEBKIT_DISABLE_COMPOSITING_MODE=1 WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS=1 xvfb-run -a -s "-screen 0 1600x2800x24" /usr/bin/python3.12 tests/webkit.py <bild.png> "<JavaScript nach dem Laden>" [hell]
# Beispieldaten: tests/daten.js (beispiel()). Definiert das JavaScript window.mess, steht dessen Ergebnis als Zeile „MESS …“ in der Ausgabe (z. B. Lage von Flächen zum Ausmessen im Bild).
# Grenze: ohne Grafikkarte kein Milchglas (backdrop-filter), Blätter scheinen deshalb durch. Kanten, Flächen und Schatten stimmen.
import sys, json, os, subprocess
import gi
gi.require_version('Gtk','3.0'); gi.require_version('WebKit2','4.1')
from gi.repository import Gtk, WebKit2, GLib
aus, js = sys.argv[1], sys.argv[2]; hell = len(sys.argv) > 3
ORT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
daten = subprocess.run(['node', '-e', "process.stdout.write(JSON.stringify(require('./tests/daten').beispiel()))"], cwd=ORT, capture_output=True, text=True).stdout
Gtk.Settings.get_default().set_property('gtk-application-prefer-dark-theme', not hell)
win = Gtk.OffscreenWindow(); win.set_default_size(390, 844)
ctx = WebKit2.WebContext.new_ephemeral()
view = WebKit2.WebView.new_with_context(ctx); win.add(view); win.show_all()
s = view.get_settings(); s.set_enable_write_console_messages_to_stdout(True)
schritt = [0]
def knipsen():
    def fertig(v, res):
        surf = v.get_snapshot_finish(res); surf.write_to_png(aus); print('Bild', surf.get_width(), surf.get_height()); Gtk.main_quit()
    view.get_snapshot(WebKit2.SnapshotRegion.VISIBLE, WebKit2.SnapshotOptions.NONE, None, fertig); return False
def geladen(v, ev):
    if ev != WebKit2.LoadEvent.FINISHED: return
    schritt[0] += 1
    if schritt[0] == 1:
        v.evaluate_javascript("localStorage.setItem('takt.v1', JSON.stringify(%s)); location.reload();" % daten, -1, None, None, None, None)
    elif schritt[0] == 2:
        v.evaluate_javascript("" + js + ";document.title=JSON.stringify(typeof mess==='function'?mess():{})", -1, None, None, None, None)
        GLib.timeout_add(1500, lambda: (print('MESS', view.get_title()), knipsen())[1])
view.connect('load-changed', geladen)
view.load_uri('file://' + ORT + '/index.html')
GLib.timeout_add(30000, Gtk.main_quit)
Gtk.main()
