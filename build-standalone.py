"""Build d'un fichier UNIQUE et autonome pour la démo Vercel.

nyabungo2.html référence les visuels dans assets/. Si tu ne déposes qu'un seul
fichier sur Vercel, toutes les photos seraient en 404. Ce script produit
deploy/index.html : logo et photos disponibles encodés en base64 dans le HTML,
et références aux visuels absents simplement retirées (aucun 404, aucun asset
manquant dans la console).

    python3 build-standalone.py
"""
import base64, os, re, sys, io
from PIL import Image

REPO = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(REPO)
SRC  = os.path.join(REPO, 'nyabungo2.html')
OUT_DIR = os.path.join(REPO, 'deploy')
OUT  = os.path.join(OUT_DIR, 'index.html')

# taille/qualité des photos embarquées : assez pour un plein écran, léger à charger
PHOTO_W, PHOTO_Q = 900, 72


def data_uri_jpeg(path):
    im = Image.open(path).convert('RGB')
    if im.width > PHOTO_W:
        im = im.resize((PHOTO_W, round(im.height * PHOTO_W / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=PHOTO_Q, optimize=True, progressive=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode('ascii'), len(buf.getvalue())


def data_uri_png(path):
    with open(path, 'rb') as fh:
        return 'data:image/png;base64,' + base64.b64encode(fh.read()).decode('ascii'), os.path.getsize(path)


def main():
    s = open(SRC, encoding='utf-8', newline='').read().replace('\r\n', '\n')
    os.makedirs(OUT_DIR, exist_ok=True)

    # 1. photos : on remplace le chemin par l'URI, ou on retire le champ si absent
    entries = re.findall(r"img:'(assets/[^']+)'", s)
    kept, dropped = 0, []
    for rel in dict.fromkeys(entries):
        full = os.path.join(REPO, rel)
        if os.path.isfile(full):
            uri, size = data_uri_jpeg(full)
            s = s.replace(f"img:'{rel}'", f"img:'{uri}'")
            kept += 1
            print(f'   + {rel:34} {size/1024:6.1f} KB → base64')
        else:
            dropped.append(rel)
    for rel in dropped:
        s = re.sub(r"\s*img:'" + re.escape(rel) + r"',", '', s)
    if dropped:
        print(f'   - {len(dropped)} visuel(s) non fourni(s) : référence retirée, '
              f'illustration vectorielle affichée à la place')

    # 2. logo : il est déjà embarqué en data URI dans <img id="logoImg"> (voir
    #    embed-logo.py). Le build ne fait donc que neutraliser la sonde externe,
    #    pour qu'un fichier unique n'aille pas chercher un assets/ inexistant.
    probe = re.search(r"\s*probe\.src='assets/logo\.png';", s)
    if probe:
        s = s[:probe.start()] + s[probe.end():]
        print('   ~  sonde assets/logo.png retirée (logo déjà embarqué)')
    logo_uri = None
    if re.search(r'<img id="logoImg"[^>]*src="data:image/', s):
        print('   ~  logo d\u00e9j\u00e0 embarqu\u00e9 dans le HTML (embed-logo.py) : rien \u00e0 faire')
    else:
        for name in ('logo.png', 'logo.svg', 'logo.jpg', 'logo.jpeg', 'logo.gif'):
            pth = os.path.join(REPO, 'assets', name)
            if not os.path.isfile(pth):
                continue
            if name.endswith('.png'):
                logo_uri, lsize = data_uri_png(pth)
                note = f'{lsize/1024:.1f} KB'
            else:
                # SVG/JPG/GIF : conversion PNG pour garder un seul format autonome
                im = Image.open(pth).convert('RGBA')
                buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True)
                logo_uri = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')
                note = f'converti en PNG, {len(buf.getvalue())/1024:.1f} KB'
            print(f'   + assets/{name:14} {note} \u2192 base64')
            break
        if logo_uri:
            lst = re.search(r"const files=\[[^\]]*\];", s)
            if lst:
                s = s[:lst.start()] + f"const files=['{logo_uri}'];" + s[lst.end():]
            else:
                print('   ~  pas de cascade \u00e0 r\u00e9\u00e9crire (src pos\u00e9 en dur dans le balisage)')
        else:
            print('   - aucun logo fourni : le monogramme vectoriel embarqu\u00e9 reste affich\u00e9')

    # 2b. touche d'accueil iOS : en fichier unique, on embarque l'icône plutôt que
    #     de laisser un lien qui renverrait un 404 (iOS l'ignore en data URI, sans
    #     conséquence ; Chrome/Android, eux, la lisent).
    link_apple = re.search(r'<link rel="apple-touch-icon"[^>]*href="assets/apple-touch-icon\.png"', s)
    if link_apple:
        apple_path = os.path.join(REPO, 'assets', 'apple-touch-icon.png')
        if os.path.isfile(apple_path):
            auri, asz = data_uri_png(apple_path)
            s = re.sub(r'(<link rel="apple-touch-icon"[^>]*href=")assets/apple-touch-icon\.png(")',
                       lambda m: m.group(1) + auri + m.group(2), s, count=1)
            print(f'   + assets/apple-touch-icon.png {asz/1024:5.1f} KB \u2192 base64')
        else:
            m2 = re.search(r'\r?\n?<link rel="apple-touch-icon"[^>]*>', s)
            s = s[:m2.start()] + s[m2.end():]
            print('   - icône iOS absente : lien retiré (pas de 404 dans le fichier unique)')

    # 3. aucune dépendance à un dossier assets/ ne doit subsister
    resid = re.findall(r"['\"](assets/[^'\"]+)['\"]", s)
    if resid:
        print('!! références externes résiduelles :', set(resid)); sys.exit(1)

    open(OUT, 'w', encoding='utf-8', newline='').write(s.replace('\n', '\r\n'))
    kb = os.path.getsize(OUT) / 1024
    print(f'\n  {os.path.relpath(OUT, REPO)}  —  {kb/1024:.2f} MB  '
          f'({kept} photos + logo embarqués, {len(dropped)} visuel(s) en repli vectoriel)')
    print('  Fichier autonome : aucune dépendance externe sauf les polices (CDN, avec repli système).')


if __name__ == '__main__':
    main()
