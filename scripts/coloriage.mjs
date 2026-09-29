import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { readPixels } from "../lib/coloring.js";
import {
  detectGrid,
  reconstruct,
  cropSource,
  removeBackground,
  MAX_SOURCE_PIXELS,
} from "../lib/reconstruct.js";
import { createColoringPdf } from "../lib/pdf.js";
const [input, output, ...args] = process.argv.slice(2);
if (!input || !output) {
  console.log(
    "Usage : npm run coloriage -- image.png sortie.pdf [--mode=auto|native|grid] [--crop=x,y,largeur,hauteur] [--columns=24 --rows=24] [--background=#ffffff --tolerance=25] [--size=170 --grid=0.18 --gray=68 --labels=names --outlines=true --legend=true]",
  );
  process.exit(1);
}
try {
  const options = {},
    importOptions = { mode: "auto", tolerance: 25 };
  for (const arg of args) {
    const match = arg.match(
      /^--(size|grid|gray|labels|outlines|legend|mode|crop|columns|rows|background|tolerance)=(.+)$/,
    );
    if (!match) throw new Error(`Option inconnue : ${arg}`);
    const [, key, value] = match;
    if (["outlines", "legend"].includes(key)) {
      if (!["true", "false"].includes(value))
        throw new Error(`Booléen invalide : ${arg}`);
      options[key] = value === "true";
    } else if (["mode", "crop", "background"].includes(key))
      importOptions[key] = value;
    else if (["columns", "rows", "tolerance"].includes(key))
      importOptions[key] = Number(value);
    else options[key] = key === "labels" ? value : Number(value);
  }
  if (!["auto", "native", "grid"].includes(importOptions.mode))
    throw new Error("Mode inconnu.");
  const { data, info } = await sharp(input, {
    limitInputPixels: MAX_SOURCE_PIXELS,
  })
    .toColourspace("srgb")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let source = { width: info.width, height: info.height, data };
  if (importOptions.crop) {
    const values = importOptions.crop.split(",").map(Number);
    if (values.length !== 4)
      throw new Error("Recadrage attendu : x,y,largeur,hauteur.");
    const [x, y, width, height] = values;
    source = cropSource(source, { x, y, width, height });
  }
  const manual =
    importOptions.columns !== undefined || importOptions.rows !== undefined;
  if (
    manual &&
    (!Number.isInteger(importOptions.columns) ||
      !Number.isInteger(importOptions.rows))
  )
    throw new Error("Indiquez ensemble --columns et --rows.");
  const detected =
    importOptions.mode === "native"
      ? null
      : manual
        ? { columns: importOptions.columns, rows: importOptions.rows }
        : detectGrid(source);
  if (importOptions.mode === "grid" && !detected)
    throw new Error("Grille non détectée : indiquez --columns et --rows.");
  if (importOptions.background)
    source = removeBackground(
      source,
      importOptions.background,
      importOptions.tolerance,
    );
  if (!detected && (source.width > 256 || source.height > 256))
    throw new Error(
      "Sélectionnez une zone avec --crop ou indiquez --columns et --rows.",
    );
  const model = detected
    ? reconstruct(source, detected)
    : readPixels(source.width, source.height, source.data);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, await createColoringPdf(model, options));
  console.log(`PDF créé : ${output} (${model.width} × ${model.height} cases)`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
