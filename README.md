# menu-digital

Le menu de restaurant en ligne, accès en scannant le code QR.

## Ce qui est déployable

| Fichier | Rôle |
|---|---|
| **`deploy/index.html`** | **Le fichier à mettre sur Vercel.** 100 % autonome : logo et photos encodés en base64 à l'intérieur, aucune dépendance `assets/`. ~1 Mo. |
| `nyabungo2.html` | La source (163 Ko). À servir **avec** le dossier `assets/` si tu déploies le dépôt entier. |
| `assets/*.jpg` | Photographies des plats (10 sur 16 à ce jour, ~90 Ko chacune, 1040×567 optimisées). |
| `assets/logo.png` | Logo du restaurant, détouré et compressé (700×700, 28 Ko, fond transparent). |
| `index.html` | Lanceur de démo local : aperçu téléphone + script de présentation. |
| `comparatif.html` | Rapport d'analyse des deux maquettes de départ. |
| `nyabungo1.html` | Ancienne maquette, conservée en référence — non déployée. |

## Vercel

**Option A — un seul fichier (le plus simple)**
glisser `deploy/index.html` sur *New Project → Deploy from computer*.

**Option B — le dépôt entier (le plus propre)**
importer le repo, *Framework Preset* = `Other`, *Output Directory* = `.`.
HTML léger + images en `loading="lazy"` et mieux mises en cache.

Après avoir ajouté des visuels dans `assets/`, régénérer le fichier autonome :

```
python3 build-standalone.py
```

## Lancer en local

```
python3 serve.py 8080      # serveur sans cache (aperçu toujours à jour)
python3 -m http.server 8080  # ou le serveur standard
```

Puis `http://localhost:8080/` — ou directement `nyabungo2.html?table=07`
(le numéro de table provient du QR code scanné).

## Notes techniques

- Un seul fichier HTML, aucune dépendance d'exécution ; polices via CDN avec repli système
  (la page reste correcte sans réseau), illustrations en SVG embarqué.
- **Chaque visuel a un repli** : si une photo manque ou ne charge pas, l'illustration
  vectorielle du plat prend la place automatiquement — jamais d'image cassée en démo.
- API simulée à remplacer par les vrais endpoints : `api.submitOrder`, `api.getOrderStatus`,
  `api.createPayment`, `api.getReceipt`.
- Thème et langue mémorisés en `localStorage` ; panier, commande et note en `sessionStorage`.
