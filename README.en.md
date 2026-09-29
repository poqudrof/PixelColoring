# Pixel & Papier

[Français](README.md) · **English**

A friendly pixel-art coloring workshop built with Next.js and Node.js. Import an image, preview an A4 page, print it, export a vector PDF, or project the colored grid. Image processing stays in the browser.

## Start locally

Node.js 20.9 or newer is required.

```sh
npm install
npm run dev
```

Open http://localhost:3000. `npm run build` creates a static site in `out/`, ready for GitHub Pages or any static host.

## Main features

- Import PNG, JPEG, WebP, or GIF files, drag and drop, or paste an image from the clipboard.
- Read native pixel art or reconstruct enlarged and pre-gridded artwork.
- Crop one character from a sprite sheet and remove a solid background with an eyedropper and tolerance control.
- Map artwork to 12 simple colors with stable numbers and French or English names.
- Adjust the square print area, grid thickness, label style and lightness, black outlines, and color legend.
- Preview, print, or download a one-page A4 coloring sheet.
- Project the colored grid in full screen and drag four corners to align it with a physical surface using a homography.
- Detect English from the browser and switch between French and English from the header.

## GitHub Pages deployment

Every push to `main` tests the app, builds the static export, and deploys it with GitHub Actions. The public site is available at [pixel-paper.jeremy-laviole.fr](https://pixel-paper.jeremy-laviole.fr/) and is served from the custom domain root. A fork hosted below a subfolder can set `NEXT_PUBLIC_BASE_PATH` at build time. The repository must use **GitHub Actions** as its Pages source.

## Search engines

The build emits `robots.txt`, `sitemap.xml`, the canonical URL, Open Graph and Twitter tags, JSON-LD structured data (`WebApplication`) and icons. The public address lives in `lib/site.js`; a fork overrides it with `NEXT_PUBLIC_SITE_URL` (including any subfolder). The favicon, Apple icon and 1200 × 630 share image are generated from the demo mushroom by `npm run seo:images` and committed in `app/`. After deploying, submit `https://pixel-paper.jeremy-laviole.fr/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

## Command-line PDF generation

```sh
npm run coloriage -- my-image.png output/coloring.pdf --size=170 --grid=0.2 --gray=75 --labels=names --outlines=true --legend=true
```

`labels` accepts `numbers`, `names`, and `none`. Automatic mode detects a regular grid and otherwise keeps native pixels for small images. The CLI uses Sharp and shares the same palette and PDF generator as the web app.

## Verify

```sh
npm test
npm run build
```

Core files:

- `lib/coloring.js`: palette, RGBA conversion, and page geometry.
- `lib/pdf.js`: vector PDF export.
- `app/page.js`: browser interface.
- `app/ImportPanel.js`: image import, crop, grid detection, and background removal.
- `app/Projector.js`: projection and four-corner alignment.
- `scripts/coloriage.mjs`: command-line processing.

The reference images shared during development are used for local validation and are not included in this repository.
