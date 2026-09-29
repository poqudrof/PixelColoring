# Pixel & Papier

**Français** · [English](README.en.md)

Atelier de coloriage pixel art en français, en Next.js et Node.js. Import local, aperçu A4 interactif et PDF vectoriel. Aucune image n’est envoyée à un serveur.

## Démarrer

Node.js 20.9 minimum.

```sh
npm install
npm run dev
```

Ouvrir http://localhost:3000. `npm run build` crée le site statique dans `out/`, prêt pour GitHub Pages ou un autre hébergeur de fichiers statiques.

## Déploiement GitHub Pages

Chaque push sur `main` teste l’application, produit un export statique et le déploie avec GitHub Actions. Le site public est disponible sur `https://pixel-paper.jeremy-laviole.fr/` ; l’adresse GitHub `https://poqudrof.github.io/PixelColoring/` y redirige. Le domaine personnalisé sert le site depuis sa racine. Un fork déployé dans un sous-dossier peut définir `NEXT_PUBLIC_BASE_PATH` pendant la compilation. Dans les paramètres GitHub du dépôt, **Pages > Source** doit être réglé sur **GitHub Actions**.

## Référencement

Le build génère `robots.txt`, `sitemap.xml`, l’URL canonique, les balises Open Graph et Twitter, les données structurées JSON-LD (`WebApplication`) et les icônes. L’adresse publique vient de `lib/site.js` ; un fork la remplace avec `NEXT_PUBLIC_SITE_URL` (sous-dossier compris). Le favicon, l’icône Apple et l’image de partage 1200 × 630 sont produits à partir du champignon de démonstration par `npm run seo:images`, puis versionnés dans `app/`. Après le déploiement, déclarer `https://pixel-paper.jeremy-laviole.fr/sitemap.xml` dans Google Search Console et Bing Webmaster Tools.

## Fonctionnement

- PNG, JPEG, WebP ou GIF (première image), jusqu’à 16 millions de pixels, 8192 px par côté et 10 Mo dans l’interface. La grille reconstruite reste limitée à 256 × 256 cases.
- Lecture native (un pixel source = une case) ou reconstruction d’images agrandies et quadrillées. Détection automatique des répétitions de blocs et lignes, avec réglages manuels des colonnes, lignes et marges.
- Les couleurs sont rapprochées de 12 teintes françaises par distance RGB : noir, blanc, gris, rouge, orange, jaune, vert, bleu, violet, rose, marron et beige. Les numéros restent stables.
- Les pixels presque transparents sont ignorés ; les pixels semi-transparents sont composités sur blanc. Le fond blanc opaque reste à colorier.
- Préremplissage facultatif des pixels classés noirs, y compris les détails intérieurs. Aucun contour supplémentaire n’est inventé.
- Repères : numéros, noms français ou aucun ; gris réglable de 15 à 95 %.
- Zone carrée de 60 à 190 mm, image centrée avec proportions conservées. Grille de 0,05 à 0,8 mm, plafonnée à 20 % de la case pour les images denses.
- Légende facultative et export sur une page A4. Les noms sont ajustés à la largeur des cases. Un avertissement apparaît sous 3 mm par case.
- L’impression navigateur bascule sur le coloriage. Choisir A4, échelle 100 %, sans en-têtes ni pieds de page du navigateur. Le PDF offre la géométrie d’impression de référence.

## Script Node.js

```sh
npm run coloriage -- mon-image.png output/coloriage.pdf --size=170 --grid=0.2 --gray=75 --labels=names --outlines=true --legend=true
```

Les paramètres omis prennent les valeurs de l’interface. `labels` accepte `numbers`, `names` et `none`. Le mode automatique détecte une grille régulière ; sinon il conserve les pixels natifs pour les petites images. Le script utilise Sharp pour décoder les images et partage la palette et le générateur PDF avec l’interface.

## Vérification

```sh
npm test
npm run build
```

`lib/coloring.js` : palette, lecture RGBA et géométrie. `lib/pdf.js` : export vectoriel. `app/page.js` : interface et import navigateur. `scripts/coloriage.mjs` : traitement en ligne de commande.

## Images quadrillées et planches

1. Importer l’image, puis glisser sur l’original pour isoler le personnage. « Agrandir pour sélectionner » facilite la sélection sur une grande planche. Les champs gauche, haut, largeur et hauteur permettent un recadrage précis.
2. Cliquer sur « Détecter les cases » sur cette sélection. En mode « Image agrandie / quadrillée », corriger les colonnes/lignes et les marges d’alignement si nécessaire. La détection est une estimation : les petites images floues, les agrandissements irréguliers et les grilles inclinées peuvent nécessiter un réglage manuel.
3. Activer la suppression du fond, choisir une couleur avec la pipette sur l’original et ajuster la tolérance. Cette couleur est retirée **partout dans la sélection**, y compris dans le personnage si elle y est présente. La suppression s’effectue avant la simplification de palette.
4. « Appliquer à la feuille » met à jour le coloriage et son export. Les changements de sélection ou de fond ne sont pas appliqués tant que ce bouton n’est pas utilisé.

Les couleurs sont échantillonnées dans la moitié centrale des cases, par médiane, pour ignorer les lignes et de petites annotations. Cela ne restaure pas les couleurs absentes d’une grille vierge et ne constitue pas de reconnaissance de texte.

```sh
npm run coloriage -- planche.png output/selection.pdf --crop=12,144,102,96 --mode=auto --background='#000000' --tolerance=20
npm run coloriage -- grille.png output/grille.pdf --mode=grid --columns=23 --rows=23
```

Les images d’exemple fournies dans la conversation servent à la validation locale et ne sont pas incluses dans le dépôt.

## Mode Projecteur

Le bouton « Projecteur » ouvre le modèle coloré avec les noms français et une grille. Déplacer les quatre poignées pour aligner le dessin sur les coins du support : une homographie transforme toute la grille, textes compris. Les coins ne peuvent pas se croiser. Les flèches permettent un déplacement fin (Maj + flèche : plus rapide).

« Masquer les poignées » termine le réglage. Les noms et la grille peuvent être masqués séparément. Le plein écran dépend du navigateur ; si indisponible, agrandir la fenêtre. Le cadrage est conservé tant que le mode reste ouvert ; « Réinitialiser » retrouve un carré centré. Les options PDF restent indépendantes du cadrage de projection.

## Presse-papiers

Coller une image avec **⌘V / Ctrl+V** n’importe où dans l’atelier, ou utiliser « Coller une image ». Le bouton demande l’accès au presse-papiers au navigateur (HTTPS ou localhost requis). En cas de refus, le raccourci clavier reste disponible. Les collages de texte ne sont pas interceptés. Les images collées utilisent le même traitement local que les fichiers importés.

## Langues

L’interface détecte la langue préférée du navigateur au premier chargement (`en` pour l’anglais, français dans les autres cas). Le sélecteur FR/EN en haut à droite mémorise ensuite le choix localement. Cette langue s’applique à l’interface, aux noms des couleurs du Projecteur et au PDF exporté.
