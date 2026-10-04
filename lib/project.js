// Project file: one plain JSON with the whole app state and the source image.
import {
  isModel,
  isPalette,
  makePalette,
  validateOptions,
} from "./coloring.js";
import { loadJSON, saveJSON, loadFile, saveFile } from "./storage.js";
export const IMPORT_KEY = "pixel-paper-import";
const toDataURL = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
export async function buildProject({ name, options, palette, model, tab }) {
  const file = await loadFile("source");
  return JSON.stringify(
    {
      app: "pixel-paper",
      version: 1,
      name,
      options,
      palette: palette.map(({ name, nameEn, hex }) => ({ name, nameEn, hex })),
      model,
      tab,
      import: loadJSON(IMPORT_KEY),
      image: file instanceof Blob ? await toDataURL(file) : null,
    },
    null,
    2,
  );
}
// Validates the file, restores the image and import settings into browser
// storage, and returns the state the page should adopt.
export async function readProject(text) {
  let p;
  try {
    p = JSON.parse(text);
  } catch {
    throw new Error("invalid");
  }
  if (p?.app !== "pixel-paper" || !Array.isArray(p.palette))
    throw new Error("invalid");
  const palette = makePalette(p.palette);
  if (!isPalette(palette) || !isModel(p.model)) throw new Error("invalid");
  if (typeof p.image === "string") {
    if (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(p.image))
      throw new Error("invalid");
    await saveFile("source", await (await fetch(p.image)).blob());
  }
  if (p.import) saveJSON(IMPORT_KEY, p.import);
  return {
    name: typeof p.name === "string" ? p.name : "",
    options: validateOptions(p.options),
    palette,
    model: p.model,
    tab: p.tab === "original" ? "original" : "sheet",
  };
}
