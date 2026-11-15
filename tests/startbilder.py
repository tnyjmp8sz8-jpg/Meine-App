# Startbilder für das iPhone (apple-touch-startup-image): einfarbig in der Hintergrundfarbe der App,
# damit beim Öffnen vom Home-Bildschirm kein weißer Blitz erscheint. Bewusst ohne Schriftzug: So geht das
# Startbild nahtlos in die App über.
# Aufruf: python3 tests/startbilder.py   (schreibt die Bilder nach start/ und gibt die Zeilen für den <head> aus)
# iOS nimmt ein Startbild nur, wenn Breite, Höhe und Pixeldichte genau zum Gerät passen. Neue Geräte hier ergänzen.
import os
from PIL import Image

GERAETE = [  # Breite, Höhe in CSS-Pixeln, Pixeldichte
    (375, 667, 2), (414, 736, 3), (375, 812, 3), (414, 896, 2), (414, 896, 3), (390, 844, 3),
    (428, 926, 3), (393, 852, 3), (430, 932, 3), (402, 874, 3), (440, 956, 3), (420, 912, 3),
]
FARBEN = {'dunkel': ('#0E0F13', 'dark'), 'hell': ('#F2F2F7', 'light')}  # wie --bg in index.html

ziel = os.path.join(os.path.dirname(__file__), '..', 'start')
os.makedirs(ziel, exist_ok=True)
for name, (farbe, schema) in FARBEN.items():
    for b, h, d in GERAETE:
        datei = '%s-%dx%d.png' % (name, b * d, h * d)
        bild = Image.new('P', (b * d, h * d), 0)
        bild.putpalette([int(farbe[i:i + 2], 16) for i in (1, 3, 5)])
        bild.save(os.path.join(ziel, datei), optimize=True)
        print('<link rel="apple-touch-startup-image" href="start/%s" media="(device-width: %dpx) and (device-height: %dpx) and (-webkit-device-pixel-ratio: %d) and (orientation: portrait) and (prefers-color-scheme: %s)">' % (datei, b, h, d, schema))
