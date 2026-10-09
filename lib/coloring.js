export const PALETTE = [
  ["Noir", "Black", "#17191c"],
  ["Blanc", "White", "#ffffff"],
  ["Gris", "Gray", "#92969c"],
  ["Rouge", "Red", "#e54444"],
  ["Orange", "Orange", "#f59132"],
  ["Jaune", "Yellow", "#f6d64a"],
  ["Vert", "Green", "#53a867"],
  ["Bleu", "Blue", "#478bd1"],
  ["Violet", "Purple", "#9566bc"],
  ["Rose", "Pink", "#ed99bb"],
  ["Marron", "Brown", "#885638"],
  ["Beige", "Beige", "#dfbd91"],
].map(([name, nameEn, hex], id) => ({
  id: id + 1,
  name,
  nameEn,
  hex,
  rgb: hex.match(/[a-f0-9]{2}/gi).map((x) => parseInt(x, 16)),
}));
// The sheet is printed on white paper: white cells stay blank, unlabeled and
// out of the legend.
export const WHITE = 2;
export const MIN_COLORS = 2;
export const MAX_COLORS = 24;
const HEX = /^#[0-9a-f]{6}$/i;
// Entries are {name, nameEn, hex}; ids are positions, so numbers follow order.
export function makePalette(entries) {
  return entries.map(({ name, nameEn, hex }, i) => ({
    id: i + 1,
    name,
    nameEn: nameEn ?? name,
    hex: hex.toLowerCase(),
    rgb: hex.match(/[a-f0-9]{2}/gi).map((x) => parseInt(x, 16)),
  }));
}
export function isPalette(list) {
  return (
    Array.isArray(list) &&
    list.length >= MIN_COLORS &&
    list.length <= MAX_COLORS &&
    list.every(
      (p, i) =>
        p?.id === i + 1 &&
        typeof p.name === "string" &&
        typeof p.nameEn === "string" &&
        HEX.test(p.hex) &&
        Array.isArray(p.rgb) &&
        p.rgb.length === 3,
    )
  );
}
export const paletteOf = (model) => model?.palette ?? PALETTE;
// Paper-white colors stay blank; the darkest very dark color is the outline.
export const isBlank = (p) => p.rgb.every((v) => v >= 250);
const luma = (p) => p.rgb[0] * 0.299 + p.rgb[1] * 0.587 + p.rgb[2] * 0.114;
export function outlineId(palette) {
  const dark = palette.reduce((a, b) => (luma(b) < luma(a) ? b : a));
  return luma(dark) < 50 ? dark.id : 0;
}
export function nearestColor(palette, color) {
  let best = palette[0],
    distance = Infinity;
  for (const p of palette) {
    const d = color.reduce((sum, v, c) => sum + (v - p.rgb[c]) ** 2, 0);
    if (d < distance) {
      distance = d;
      best = p;
    }
  }
  return best;
}
// Re-express a model in another palette (nearest color per cell).
export function remapModel(model, palette) {
  const old = paletteOf(model);
  return {
    ...model,
    palette,
    cells: model.cells.map((id) =>
      id === null ? null : nearestColor(palette, old[id - 1].rgb).id,
    ),
  };
}
export const MAX_SIZE = 270;
export const DEFAULTS = {
  size: 170,
  grid: 0.18,
  gray: 68,
  labels: "numbers",
  outlines: true,
  legend: true,
};
export function validateOptions(options = {}) {
  const o = { ...DEFAULTS, ...options };
  for (const [key, min, max] of [
    ["size", 60, MAX_SIZE],
    ["grid", 0.05, 0.8],
    ["gray", 15, 95],
  ])
    if (!Number.isFinite(o[key]) || o[key] < min || o[key] > max)
      throw new Error(`Valeur incorrecte : ${key}`);
  if (!["numbers", "letters", "names", "none"].includes(o.labels))
    throw new Error("Mode de repère incorrect.");
  return o;
}
export function isModel(model) {
  return (
    Number.isInteger(model?.width) &&
    Number.isInteger(model.height) &&
    model.width >= 1 &&
    model.height >= 1 &&
    model.width <= 256 &&
    model.height <= 256 &&
    Array.isArray(model.cells) &&
    model.cells.length === model.width * model.height &&
    model.cells.every(
      (id) =>
        id === null ||
        (Number.isInteger(id) && id >= 1 && id <= paletteOf(model).length),
    ) &&
    (model.palette === undefined || isPalette(model.palette))
  );
}
export function readPixels(width, height, data, palette = PALETTE) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > 256 ||
    height > 256
  )
    throw new Error(
      "Utilisez une image de 256 × 256 pixels maximum, sans agrandissement.",
    );
  if (data.length !== width * height * 4)
    throw new Error("Données de pixels invalides.");
  const cells = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 32) {
      cells.push(null);
      continue;
    }
    const alpha = data[i + 3] / 255;
    const color = [0, 1, 2].map((c) => data[i + c] * alpha + 255 * (1 - alpha));
    const best = nearestColor(palette, color);
    cells.push(best.id);
  }
  return palette === PALETTE
    ? { width, height, cells }
    : { width, height, cells, palette };
}
export function colorsUsed(model, o) {
  const palette = paletteOf(model),
    outline = outlineId(palette);
  return palette.filter(
    (p) =>
      model.cells.includes(p.id) &&
      !isBlank(p) &&
      !(o.outlines && p.id === outline),
  );
}
// Number of cells of each palette color, indexed by color id.
export function colorCounts(model) {
  const counts = {};
  for (const id of model.cells)
    if (id !== null) counts[id] = (counts[id] || 0) + 1;
  return counts;
}
// A4 layout in mm. The drawing's longest side is `size`, shrunk to fit
// between 5 mm side margins and above the legend; the heading collapses to
// one line when the drawing would not fit under the full one.
export function geometry(model, options) {
  const o = validateOptions(options),
    colors = model.cells && o.legend ? colorsUsed(model, o).length : 0,
    legendY = colors ? 272 - Math.ceil(colors / 4) * 9 : 297,
    bottom = colors ? legendY - 7 : 280,
    wanted = o.size / Math.max(model.width, model.height),
    compact = 45 + model.height * wanted > bottom,
    top = compact ? 20 : 45,
    cell = Math.min(wanted, 200 / model.width, (bottom - top) / model.height),
    width = model.width * cell,
    height = model.height * cell;
  return {
    cell,
    x: (210 - width) / 2,
    y: top + Math.max(0, (Math.min(o.size, bottom - top) - height) / 2),
    width,
    height,
    compact,
    legendY,
  };
}
// One letter per displayed color, two when initials clash (Rouge/Rose → Ro/Rs).
// A color whose name is empty (being edited) falls back to its number.
export function letterCodes(model, o) {
  const colors = colorsUsed(model, o),
    codes = new Map(),
    initialOf = (p) => colorName(p, o.locale).trim()[0]?.toUpperCase() ?? "";
  for (const p of colors) {
    const name = colorName(p, o.locale).trim(),
      initial = initialOf(p);
    if (!initial) {
      codes.set(p.id, String(p.id));
      continue;
    }
    if (colors.filter((q) => initialOf(q) === initial).length === 1) {
      codes.set(p.id, initial);
      continue;
    }
    const taken = new Set(codes.values()),
      code = [...name.slice(1).toLowerCase()]
        .map((c) => initial + c)
        .find((c) => !taken.has(c));
    codes.set(p.id, code || initial + p.id);
  }
  return codes;
}
export function labelFor(id, o, codes, palette = PALETTE) {
  return o.labels === "none" || isBlank(palette[id - 1])
    ? ""
    : o.labels === "names"
      ? colorName(palette[id - 1], o.locale)
      : o.labels === "letters"
        ? codes?.get(id) || ""
        : String(id);
}
export function legendKey(p, o, codes) {
  return o.labels === "letters" ? codes?.get(p.id) || "" : String(p.id);
}
export function colorName(color, locale = "fr") {
  return locale === "en" ? color.nameEn : color.name;
}
export function demoModel() {
  const rows = [
    "................",
    ".....kkkkkk.....",
    "...kkrrrrrrkk...",
    "..krrrrrrrrrrk..",
    ".krrwwrrrrwwrrk.",
    ".krrwwrrrrwwrrk.",
    "krrrrrrrrrrrrrrk",
    "krrrwwwrrwwwrrrk",
    "krrrwwwrrwwwrrrk",
    ".kkkkkkkkkkkkkk.",
    "....kbbbbbbk....",
    "....kbkbbkbk....",
    "....kbbbbbbk....",
    "....kbbbbbbk....",
    ".....kkkkkk.....",
    "................",
  ];
  const ids = { k: 1, r: 4, w: 2, b: 12 };
  return {
    width: 16,
    height: 16,
    cells: rows
      .join("")
      .split("")
      .map((c) => ids[c] ?? null),
  };
}
