# menu-digital

Le menu de **NYABUNGO Hôtel Restaurant** (Bujumbura), accès en scannant le code QR posé sur les tables.

## Déploiement retenu : option B — le dépôt entier

1. [vercel.com/new](https://vercel.com/new) → importer `vizane156/menu-digital`
2. *Framework Preset* = **Other** · *Build Command* = **vide** · *Output Directory* = **`.`** (la racine)
3. Deployer. `vercel.json` fait le reste :

| Ce que fait `vercel.json` | Pourquoi |
|---|---|
| redirige `/` → `/nyabungo2.html` | le QR code peut pointer vers l'URL racine, sans nom de fichier |
| `/index.html`, `/nyabungo1.html`, `/comparatif.html`, `/deploy/*` → `/nyabungo2.html` | les fichiers de travail (lanceur de démo, ancienne maquette, rapport d'analyse) ne tombent jamais sous les yeux d'un client ; toutes les destinations visent le menu, donc aucune chaîne ni boucle de redirection |
| `Cache-Control: max-age=2592000` sur `/assets/*` | les 16 photos + le logo ne sont téléchargés qu'une fois par client |
| `max-age=0, must-revalidate` sur `/*.html` | tu modifies le menu, le client voit la nouvelle version immédiatement |
| `X-Content-Type-Options` + `Referrer-Policy` | deux réglages de base qui coûtent rien |

## Fichiers

| Fichier | Rôle |
|---|---|
| **`nyabungo2.html`** | **Le menu** (167 Ko). C'est le fichier servi en production. |
| **`assets/`** | 16 photographies de plats (1040×567, ~86 Ko chacune, 1,4 MB au total) + `logo.png` (700×700, 28 Ko, détouré, fond transparent). Doit être déployé **avec** le HTML. |
| `embed-logo.py` | **Le logo, lui, est embarqué en base64 dans `nyabungo2.html`** (38 Ko) : il s'affiche même sans `assets/`, sans réseau et sans JavaScript. Ce script ré-injecte le PNG dans la page quand le logo change (`--depuis-gif` le régénère depuis `LOGO NYABUNGO.gif`). |
| `vercel.json` | Réglages Vercel ci-dessus. |
| `index.html` | Lanceur de démo (aperçu téléphone + consignes). Inutile en production, mais servi : reachable sur `/index.html`. |
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

## Lancer en local

```
python3 serve.py 8080          # (hors dépôt) serveur sans cache : aperçu toujours à jour
python3 -m http.server 8080    # ou le serveur standard
```

Puis `http://localhost:8080/` — ou directement `nyabungo2.html?table=07`
(le numéro de table vient du QR code scanné ; il s'affiche dans le hero et voyage jusqu'à la commande).

## À brancher pour la vraie production

- **Endpoints API simulés** : `api.submitOrder`, `api.getOrderStatus`, `api.createPayment`, `api.getReceipt`.
- **QR codes** : un par table, `https://<domaine>/?table=07` (le chemin `/` suffit grâce à la redirection).
- **Prix** : ils vivent dans le tableau `MENU` en haut du `<script>` — une seule ligne par plat (`id`, `nom`, `prix` en FBu, `img`).
- Photographies : les 16 sont générées. Remplace-les par les vraies photos du restaurant dès que disponibles — mêmes noms de fichiers dans `assets/`, rien d'autre à toucher.

## Technique

Un seul fichier HTML, **aucune dépendance d'exécution** : polices via CDN avec repli système, illustrations en SVG embarqué, panier et préférences en `localStorage`/`sessionStorage`. Conçu **mobile-first** (cibles tactiles ≥ 44 px, `env(safe-area-inset-*)`, `100dvh`, plein écran sur téléphone), avec thème clair/sombre, FR/EN, impression, accessibilité clavier et lecteur d'écran.
