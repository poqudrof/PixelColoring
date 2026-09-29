// Public address used for canonical links, the sitemap and social previews.
// A fork hosted elsewhere sets NEXT_PUBLIC_SITE_URL at build time, including
// its subfolder when it also sets NEXT_PUBLIC_BASE_PATH.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://pixel-paper.jeremy-laviole.fr"
).replace(/\/+$/, "");
export const SITE_NAME = "Pixel & Papier";
export const SITE_TITLE =
  "Pixel & Papier — Coloriage magique pixel art à imprimer";
export const SITE_DESCRIPTION =
  "Transforme ton pixel art en coloriage magique numéroté : grille A4, palette de 12 couleurs et PDF gratuit à imprimer. Tout reste sur ton appareil.";
