export const PALETTE = [
  ["Noir", "#17191c"],
  ["Blanc", "#ffffff"],
  ["Gris", "#92969c"],
  ["Rouge", "#e54444"],
  ["Orange", "#f59132"],
  ["Jaune", "#f6d64a"],
  ["Vert", "#53a867"],
  ["Bleu", "#478bd1"],
  ["Violet", "#9566bc"],
  ["Rose", "#ed99bb"],
  ["Marron", "#885638"],
  ["Beige", "#dfbd91"],
].map(([name, hex], id) => ({
  id: id + 1,
  name,
  hex,
  rgb: hex.match(/[a-f0-9]{2}/gi).map((x) => parseInt(x, 16)),
}));
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
    ["size", 60, 190],
    ["grid", 0.05, 0.8],
    ["gray", 15, 95],
  ])
    if (!Number.isFinite(o[key]) || o[key] < min || o[key] > max)
      throw new Error(`Valeur incorrecte : ${key}`);
  if (!["numbers", "names", "none"].includes(o.labels))
    throw new Error("Mode de repère incorrect.");
  return o;
}
export function readPixels(width, height, data) {
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
    let best = PALETTE[0],
      distance = Infinity;
    for (const p of PALETTE) {
      const d = color.reduce((sum, v, c) => sum + (v - p.rgb[c]) ** 2, 0);
      if (d < distance) {
        distance = d;
        best = p;
      }
    }
    cells.push(best.id);
  }
  return { width, height, cells };
}
export function colorsUsed(model, o) {
  return PALETTE.filter(
    (p) => model.cells.includes(p.id) && !(o.outlines && p.id === 1),
  );
}
export function geometry(model, options) {
  const o = validateOptions(options),
    cell = o.size / Math.max(model.width, model.height);
  return {
    cell,
    x: (210 - model.width * cell) / 2,
    y: 45 + (o.size - model.height * cell) / 2,
    width: model.width * cell,
    height: model.height * cell,
  };
}
export function labelFor(id, o) {
  return o.labels === "none"
    ? ""
    : o.labels === "names"
      ? PALETTE[id - 1].name
      : String(id);
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
