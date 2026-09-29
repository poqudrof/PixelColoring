import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { readPixels } from "../lib/coloring.js";
import { createColoringPdf } from "../lib/pdf.js";
const [input, output, ...args] = process.argv.slice(2);
if (!input || !output) {
  console.log(
    "Usage : npm run coloriage -- image.png coloriage.pdf [--size=170] [--grid=0.18] [--gray=68] [--labels=names] [--outlines=false] [--legend=false]",
  );
  process.exit(1);
}
try {
  const options = {};
  for (const arg of args) {
    const match = arg.match(/^--(size|grid|gray|labels|outlines|legend)=(.+)$/);
    if (!match) throw new Error(`Option inconnue : ${arg}`);
    const [, k, v] = match;
    if (["outlines", "legend"].includes(k) && !["true", "false"].includes(v))
      throw new Error(`Booléen invalide : ${arg}`);
    options[k] =
      k === "labels"
        ? v
        : ["outlines", "legend"].includes(k)
          ? v === "true"
          : Number(v);
  }
  const { data, info } = await sharp(input, { limitInputPixels: 65536 })
    .toColourspace("srgb")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const model = readPixels(info.width, info.height, data);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, await createColoringPdf(model, options));
  console.log(`PDF créé : ${output} (${info.width} × ${info.height} cases)`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
