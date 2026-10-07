"""Icônes du site : favicon, touche d'accueil, marque de la navbar.

Le logo complet (N H R + rubans + « HÔTEL RESTAURANT ») devient une bouillie
informe à 16-32 px. Ces icônes reprennent donc uniquement le monogramme haut
(N et H), posé sur la plaque crème aux coins arrondis — la plaque est CUITE dans
l'image (fond opaque) parce que Safari/IOS noircissent le canal alpha d'une
touche d'accueil transparente, et que l'onglet d'un navigateur peut être clair
ou sombre.

    python3 build-icons.py            # régénère assets/icon-*.png et ré-injecte
                                      # favicon + marque de navbar dans nyabungo2.html

À refaire après un changement de logo : python3 embed-logo.py --depuis-gif puis
python3 build-icons.py.
"""
import base64, os, re, sys
from PIL import Image, ImageDraw

REPO = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(REPO, 'assets', 'logo.png')
HTML = os.path.join(REPO, 'nyabungo2.html')
TOP = 0.70          # part du logo gardée : le N et le H, sans les rubans ni le texte

CREME = (253, 246, 233)
CREME_2 = (228, 212, 184)


def logo_haut(size):
    """Le monogramme, rogné sur la partie haute puis mis au carré."""
    im = Image.open(LOGO).convert('RGBA')
    im = im.crop((0, 0, im.width, round(im.height * TOP)))
    side = max(im.size)
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    sq.paste(im, ((side - im.width) // 2, (side - im.height) // 2), im)
    return sq


def dalle(size, inset=0.10, radius=None):
    """Plaque crème dégradée, coins arrondis, monogramme centré."""
    r = radius if radius is not None else round(size * 0.22)
    base = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    # dégradé vertical crème -> sable
    grad = Image.new('RGB', (1, size))
    for y in range(size):
        t = y / max(1, size - 1)
        grad.putpixel((0, y), tuple(round(CREME[i] + (CREME_2[i] - CREME[i]) * t) for i in range(3)))
    grad = grad.resize((size, size))
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=255)
    base.paste(grad, (0, 0), mask)
    mono = logo_haut(size)
    w = round(size * (1 - 2 * inset))
    mono = mono.resize((w, w), Image.LANCZOS)
    base.alpha_composite(mono, ((size - w) // 2, round((size - w) * 0.44)))
    return base


def data_uri(im):
    from io import BytesIO
    b = BytesIO(); im.save(b, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode('ascii'), len(b.getvalue())


def main():
    if not os.path.isfile(LOGO):
        sys.exit(f'!! {LOGO} introuvable — faire tourner embed-logo.py --depuis-gif d’abord')
    os.makedirs(os.path.dirname(LOGO), exist_ok=True)

    fav = dalle(64)
    apple = dalle(180, inset=0.12)
    nav = dalle(56)
    fav.save(os.path.join(REPO, 'assets', 'icon-64.png'), 'PNG', optimize=True)
    apple.save(os.path.join(REPO, 'assets', 'apple-touch-icon.png'), 'PNG', optimize=True)
    nav.save(os.path.join(REPO, 'assets', 'icon-navbar.png'), 'PNG', optimize=True)
    if '--images-seules' in sys.argv:
        print('   assets/icon-64.png, apple-touch-icon.png, icon-navbar.png écrits'); return

    fav_uri, fav_n = data_uri(fav)
    nav_uri, nav_n = data_uri(nav)
    print(f'   favicon 64²  : {fav_n/1024:.1f} KB → data URI {len(fav_uri)/1024:.1f} KB')
    print(f'   marque nav   : {nav_n/1024:.1f} KB → data URI {len(nav_uri)/1024:.1f} KB')

    s = open(HTML, encoding='utf-8', newline='').read()
    before = s
    n = lambda x: x.replace('\n', '\r\n')

    # 1. <link rel="icon"> : le vrai logo remplace le monogramme SVG de secours
    fav_link = (f'<link rel="icon" type="image/png" sizes="64x64" href="{fav_uri}">\r\n'
                f'<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">')
    if re.search(r'<link rel="icon"[^>]*>', s):
        s = re.sub(r'<link rel="icon"[^>]*>(\r\n<link rel="apple-touch-icon"[^>]*>)?', n(fav_link), s, count=1)
        print('ok  favicon réel injecté (et old SVG retiré)')
    else:
        s = s.replace('<title>', n(fav_link + '\n<title>'), 1)
        print('ok  favicon ajouté avant le <title>')

    # 2. marque de navbar : petite icône devant le nom, dans l'en-tête collant
    mark = f'<img class="brand-mark" src="{nav_uri}" alt="" aria-hidden="true" width="26" height="26" decoding="async">'
    if 'class="brand-mark"' in s:
        s = re.sub(r'<img class="brand-mark"[^>]*>', mark, s, count=1)
        print('ok  marque de navbar : data URI réactualisé')
    elif '<div class="brand-mini">' in s:
        old = '<div class="brand-mini"><b>NYABUNGO</b><span data-i18n="brandSub">Hotel • Restaurant</span></div>'
        new = ('<div class="brand-mini">' + mark +
               '<div class="bm-txt"><b>NYABUNGO</b><span data-i18n="brandSub">Hotel • Restaurant</span></div></div>')
        if s.count(old) != 1:
            sys.exit('!! markup .brand-mini inattendu — à mettre à jour à la main')
        s = s.replace(old, new)
        print('ok  marque de navbar ajoutée devant le nom')

    if s == before:
        print('   (aucun changement de balisage)')
    open(HTML, 'w', encoding='utf-8', newline='').write(s)
    print(f'\n=== icônes en place — nyabungo2.html {os.path.getsize(HTML)/1024:.0f} KB ===')


if __name__ == '__main__':
    main()
