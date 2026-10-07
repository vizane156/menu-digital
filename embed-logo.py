"""Ré-embarque le logo du restaurant dans nyabungo2.html.

Le logo vit en data URI dans la balise <img id="logoImg"> : il s'affiche donc
sans réseau, sans JavaScript et sans le dossier assets/. Ce script refait
l'opération à chaque fois que le logo change.

    python3 embed-logo.py                 # ré-embarque assets/logo.png tel quel
    python3 embed-logo.py --depuis-gif    # régénère le PNG depuis « LOGO NYABUNGO.gif »
                                          # (rognage, mise au carré, 700 px, PNG-8)

À faire aussi si le restaurant fournit un nouveau logo :
  1. remplacer « LOGO NYABUNGO.gif » à la racine par le fichier fourni ;
  2. python3 embed-logo.py --depuis-gif ;
  3. vérifier l'aperçu, puis commit + deploy.
"""
import base64, os, re, sys

REPO = os.path.dirname(os.path.abspath(__file__))
HTML = os.path.join(REPO, 'nyabungo2.html')
PNG = os.path.join(REPO, 'assets', 'logo.png')
GIF = os.path.join(REPO, 'LOGO NYABUNGO.gif')
SIZE = 700


def png_depuis_gif():
    from PIL import Image
    if not os.path.isfile(GIF):
        sys.exit(f'!! {GIF} introuvable')
    im = Image.open(GIF).convert('RGBA')
    bb = im.getchannel('A').getbbox()
    if bb:
        im = im.crop(bb)                                  # rogne les marges transparentes
    w, h = im.size                                        # met au carré (padding symétrique)
    side = max(w, h)
    pad = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    pad.paste(im, ((side - w) // 2, (side - h) // 2), im)
    im = pad.resize((SIZE, SIZE), Image.LANCZOS)
    dither = getattr(Image, 'Dither', Image).FLOYDSTEINBERG   # Pillow >= 9.1
    method = getattr(Image, 'Quantize', Image).FASTOCTREE
    im = im.quantize(colors=255, method=method, dither=dither)
    im.save(PNG, 'PNG', optimize=True)
    print(f'   assets/logo.png régénéré : {SIZE}x{SIZE}, {os.path.getsize(PNG)/1024:.1f} KB')


def main():
    if '--depuis-gif' in sys.argv:
        png_depuis_gif()
    if not os.path.isfile(PNG):
        sys.exit(f'!! {PNG} introuvable — Utilise d\'abord --depuis-gif')

    raw = open(PNG, 'rb').read()
    uri = 'data:image/png;base64,' + base64.b64encode(raw).decode('ascii')
    s = open(HTML, encoding='utf-8', newline='').read()
    before = s

    m = re.search(r'<img id="logoImg"[^>]*>', s)
    if not m:
        sys.exit('!! balise <img id="logoImg"> introuvable dans nyabungo2.html')
    tag = re.sub(r'\s+src="[^"]*"', '', m.group(0))
    tag = tag.replace('<img id="logoImg"', f'<img id="logoImg" src="{uri}"')
    s = s[:m.start()] + tag + s[m.end():]

    # le conteneur doit afficher l'image sans attendre JavaScript
    s = re.sub(r'(<div class=")hero-logo(" id="heroLogo">)', r'\1hero-logo has-img\2', s)

    if s == before:
        print('   déjà à jour : le data URI embarqué est identique au PNG actuel')
        return
    open(HTML, 'w', encoding='utf-8', newline='').write(s)
    print(f'   logo ré-embarqué ({len(raw)/1024:.1f} KB → {len(uri)/1024:.1f} KB de base64)')
    print(f'   nyabungo2.html : {os.path.getsize(HTML)/1024:.0f} KB')
    print('\n=== terminez par : python3 build-standalone.py (si tu veux aussi le fichier unique) ===')


if __name__ == '__main__':
    main()
