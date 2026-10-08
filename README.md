# menu-digital

Le menu de **NYABUNGO Hôtel Restaurant** (Bujumbura), accès en scannant le code QR posé sur les tables.

## Déploiement retenu : option B — le dépôt entier

1. [vercel.com/new](https://vercel.com/new) → importer `vizane156/menu-digital`
2. *Framework Preset* = **Other** · *Build Command* = **vide** · *Output Directory* = **`.`** (la racine)
3. Deployer. `vercel.json` fait le reste :

| Ce que fait `vercel.json` | Pourquoi |
|---|---|
| réécrit `/` en interne vers `/nyabungo2.html` | `.vercelignore` exclut le lanceur `index.html` du déploiement, car un fichier existant prend priorité sur la réécriture ; l'adresse visible reste `/` avec son numéro de table |
| redirige `/nyabungo2.html`, `/index.html`, `/nyabungo1.html`, `/comparatif.html`, `/deploy/*` vers `/` | même en ouvrant l'ancien lien du fichier, le client revient à l'URL propre ; la réécriture sert le menu sans modifier l'adresse |
| `Cache-Control: max-age=2592000` sur `/assets/*` | les 16 photos + le logo ne sont téléchargés qu'une fois par client |
| `max-age=0, must-revalidate` sur `/` et `/*.html` | tu modifies le menu, le client voit la nouvelle version immédiatement |
| `X-Content-Type-Options` + `Referrer-Policy` | deux réglages de base qui coûtent rien |

## Fichiers

| Fichier | Rôle |
|---|---|
| **`nyabungo2.html`** | **Le menu** (~232 Kio). C'est le fichier servi en production à l'URL `/`. |
| **`assets/`** | 16 photographies de plats (1040×567, ~86 Ko chacune, 1,4 MB au total) + `logo.png` (700×700, 28 Ko, détouré, fond transparent). Doit être déployé **avec** le HTML. |
| `embed-logo.py` | **Le logo, lui, est embarqué en base64 dans `nyabungo2.html`** (38 Ko) : il s'affiche même sans `assets/`, sans réseau et sans JavaScript. Ce script ré-injecte le PNG dans la page quand le logo change (`--depuis-gif` le régénère depuis `LOGO NYABUNGO.gif`). |
| `vercel.json` | Réglages Vercel ci-dessus. |
| **`qr-studio.html`**, `qr-studio.js` | Générateur de QR par table, accessible à `/qr-studio.html` après déploiement. |
| `assets/qr-engine.js` | Moteur QR et ZIP embarqué localement (licences dans `assets/qr-engine.LICENSE.txt`) : aucun CDN nécessaire au générateur. |
| `index.html`, `.vercelignore` | Lanceur de démo conservé pour l'usage local, mais exclu du déploiement pour laisser la réécriture de `/` servir le menu ; `/index.html` redirige vers le menu en production. |
| `build-standalone.py` | Fabrique `deploy/index.html`, version **mono-fichier autonome** (photos et logo en base64, 1,4 MB). Repli si tu ne peux déposer qu'un seul fichier. |
| `comparatif.html` | Analyse des deux maquettes de départ. |
| `nyabungo1.html` | Ancienne maquette, conservée en référence — **non déployée**. |
| `LOGO NYABUNGO.gif` | Source du logo (287 Ko, 2171×2117). **Le HTML ne le charge pas** : c'est `assets/logo.png`, rogné et compressé. |

## Robustesse des visuels

Chaque visuel a un **repli garanti** : photo absente, fichier qui ne charge pas (WiFi de salle saturé, upload incomplet) → l'illustration vectorielle du plat réapparaît toute seule (`error` écouté en phase de capture). Aucune image cassée n'est possible pendant le service.

Le logo du hero occupe une plaque crème dégradée dès qu'une image réelle est chargée : le « H » du logo est sombre et disparaîtrait sinon sur le thème nuit. Taille ~celle d'une carte signature (132→230 px selon l'écran, 220–252 px sur desktop).

## Aperçu : ce qui dépend du dossier `assets/`

Le **logo** est dans le fichier : visible partout, y compris ouvert en pièce jointe ou
dans une visionneuse de fichier.
Les **16 photos** restent des fichiers séparés (`assets/*.jpg`), volontairement : c'est
ce qui garde `nyabungo2.html` léger et permet le cache à 30 jours. Donc :

- `http://localhost:8080/nyabungo2.html` (serveur du dépôt) → logo **et** photos ;
- le fichier `nyabungo2.html` isolé, sans `assets/` → logo visible, plats en illustration
  vectorielle (repli prévu, jamais d'image cassée) ;
- Besoin de **tout** dans un seul fichier ? `python3 build-standalone.py` puis
  `deploy/index.html` : logo + 16 photos embarqués, 1,41 MB, aucune dépendance.

## Recherche, catégories, filtres

- **Barre de catégories** (`Tout / Entrées / Plats / Grillades / Boissons / Desserts`) :
  capsule collante sous l'en-tête, **défilable horizontalement** dès qu'il y a plus de
  catégories que de place (les boutons ne se compressent plus). Flèches `←` `→`,
  `Début`/`Fin` au clavier ; l'onglet choisi est ramené dans la fenêtre visible.
- **Filtres** (entonnoir à droite de la recherche) : Signature, Populaire, Végétarien,
  Pimenté, **Petit budget** (calculé sur les prix, seuil `BUDGET_MAX`), plus
  « Tout afficher ». Le panneau s'ouvre **dans le flux de la page**, entre la recherche
  et la grille : pas de surcouche que les cartes pourraient recouvrir, rien à attraper
  au pouce près du bord. Retaper sur la pastille active l'annule ; le bouton garde un
  **point d'état** tant qu'un filtre est appliqué, même panneau refermé.
- Recherche plein texte (nom + description) ; à 0 résultat, un état vide explicite
  s'affiche au lieu d'une grille blanche.

## Icônes et animation du logo

- `assets/icon-64.png` (2,8 Ko) : **favicon**, également **embarqué en data URI** dans le
  `<head>` → l'onglet du navigateur affiche le logo même en fichier unique.
- `assets/icon-navbar.png` : la **marque de 26 px dans la barre haute**, elle aussi embarquée.
- `assets/apple-touch-icon.png` : touche d'accueil iOS, **fond crème opaque** (iOS noircit
  l'alpha d'une icône transparente).
- Toutes trois reprennent le **monogramme haut (N + H)** : le logo complet, avec ses rubans
  et son texte, devient illisible sous 32 px.
- `python3 build-icons.py` les régénère et les ré-injecte (après `embed-logo.py --depuis-gif`).
- Le logo du hero **respire lentement** : 18 s par cycle aller-retour, 4,5 px, 0,9°, plus un
  halo ambré en fondu. L'animation porte sur l'<img>, jamais sur le conteneur (qui garde la
  parallaxe et l'inclinaison d'orientation) ; elle se met **en pause hors écran** et se
  **désactive complètement** si le système demande `prefers-reduced-motion`.

## Lancer en local

```
python3 serve.py 8080          # (hors dépôt) serveur sans cache : aperçu toujours à jour
python3 -m http.server 8080    # ou le serveur standard
```

Sur Vercel, utilise `https://nyabungo-menu.vercel.app/?table=07` : le numéro vient du QR code, s'affiche dans le hero et voyage jusqu'à la commande. `/nyabungo2.html` n'apparaît pas dans l'adresse. En local, `python3 -m http.server` ne lit pas `vercel.json` : ouvre directement `http://localhost:8080/nyabungo2.html?table=07`.

## À brancher pour la vraie production

- **Endpoints API simulés** : `api.submitOrder`, `api.getOrderStatus`, `api.createPayment`, `api.getReceipt`.
- **QR codes** : un par table, par exemple `https://nyabungo-menu.vercel.app/?table=01`, `...?table=02`, etc. La réécriture interne sert le menu sans exposer `/nyabungo2.html` ; le paramètre `table` reste visible et est inclus dans la commande simulée. Pour les serveurs, il faudra transmettre et enregistrer cette valeur côté backend lors du futur branchement.
- **Prix** : ils vivent dans le tableau `MENU` en haut du `<script>` — une seule ligne par plat (`id`, `nom`, `prix` en FBu, `img`).
- Photographies : les 16 sont générées. Remplace-les par les vraies photos du restaurant dès que disponibles — mêmes noms de fichiers dans `assets/`, rien d'autre à toucher.

## Imprimer les QR codes des tables

Après déploiement, ouvrir **`https://nyabungo-menu.vercel.app/qr-studio.html`** (outil séparé, non lié depuis le menu client). Choisir une table ou une série de 01 à 99, puis une des trois palettes contrastées. Les codes pointent vers `https://nyabungo-menu.vercel.app/?table=01`, `...?table=02`, etc. Le monogramme central, extrait du logo du restaurant (`LOGO NYABUNGO.gif` → `assets/logo.png` → `assets/apple-touch-icon.png`), est embarqué dans chaque SVG ; le QR reste autonome après téléchargement.

- **SVG** individuel : qualité vectorielle pour l'imprimeur ; **PNG** individuel : 1920 × 2720 px ; **ZIP** : un SVG par table ; **Imprimer / PDF** : une carte A6 (105 × 148 mm) par page.
- Génération locale dans le navigateur, QR statiques sans redirection tierce. Correction d'erreur **H**, zone de silence de 4 modules, logo limité au centre et modules opaques à fort contraste.
- **Avant toute impression en série**, déployer et vérifier l'URL propre sur Vercel, puis scanner un tirage papier avec plusieurs téléphones. Le parcours de commande est encore une démonstration, pas une commande transmise aux serveurs.

## Technique

Un seul fichier HTML, **aucune dépendance d'exécution** : polices via CDN avec repli système, illustrations en SVG embarqué, panier et préférences en `localStorage`/`sessionStorage`. Conçu **mobile-first** (cibles tactiles ≥ 44 px, `env(safe-area-inset-*)`, `100dvh`, plein écran sur téléphone), avec thème clair/sombre, FR/EN, impression, accessibilité clavier et lecteur d'écran.
