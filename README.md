# Pixel & Papier

Atelier de coloriage pixel art en français, en Next.js et Node.js. Import local, aperçu A4 interactif et PDF vectoriel. Aucune image n’est envoyée à un serveur.

## Démarrer

Node.js 20.9 minimum.

```sh
npm install
npm run dev
```

Ouvrir http://localhost:3000. Pour la production : `npm run build`, puis `npm start`. Le projet peut être déployé sur un hébergeur compatible Next.js.

## Fonctionnement

- PNG, JPEG, WebP ou GIF (première image), jusqu’à 256 × 256 pixels et 10 Mo dans l’interface.
- Un pixel source = une case, sans redimensionnement ni détection automatique des pixels d’une image agrandie. Préférer un PNG à sa résolution native.
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

Les paramètres omis prennent les valeurs de l’interface. `labels` accepte `numbers`, `names` et `none`. Les dimensions originales sont conservées. Le script utilise Sharp pour décoder les images et partage la palette et le générateur PDF avec l’interface.

## Vérification

```sh
npm test
npm run build
```

`lib/coloring.js` : palette, lecture RGBA et géométrie. `lib/pdf.js` : export vectoriel. `app/page.js` : interface et import navigateur. `scripts/coloriage.mjs` : traitement en ligne de commande.
