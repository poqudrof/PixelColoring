import { PDFDocument, PDFName, PDFString, StandardFonts, rgb } from "pdf-lib";
import { SITE_URL } from "./site.js";
import {
  validateOptions,
  geometry,
  colorsUsed,
  labelFor,
  legendKey,
  letterCodes,
  colorName,
  paletteOf,
  outlineId,
} from "./coloring.js";
export async function createColoringPdf(model, options = {}) {
  const o = validateOptions(options),
    en = o.locale === "en",
    g = geometry(model, o),
    codes = letterCodes(model, o),
    palette = paletteOf(model),
    outline = outlineId(palette),
    mm = 72 / 25.4;
  const doc = await PDFDocument.create(),
    page = doc.addPage([210 * mm, 297 * mm]);
  const font = await doc.embedFont(StandardFonts.Helvetica),
    bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const text = (value, x, y, size = 10, color = 0.2, f = font) =>
    page.drawText(value, {
      x: x * mm,
      y: (297 - y) * mm,
      size,
      font: f,
      color: rgb(color, color, color),
    });
  if (!g.compact) {
    text(
      en ? "MY PIXEL WORKSHOP" : "MON ATELIER PIXEL",
      15,
      19,
      10,
      0.28,
      bold,
    );
    text(en ? "Time to color!" : "À toi de colorier !", 15, 31, 20, 0.12, bold);
  }
  text(
    `${model.width} × ${model.height} pixels`,
    160,
    g.compact ? 14 : 20,
    9,
    0.45,
  );
  text(
    en
      ? "Name: ................................"
      : "Prénom : ................................",
    15,
    g.compact ? 14 : 40,
    9,
    0.5,
  );
  for (let y = 0; y < model.height; y++)
    for (let x = 0; x < model.width; x++) {
      const id = model.cells[y * model.width + x];
      if (id === null) continue;
      const px = g.x + x * g.cell,
        py = g.y + y * g.cell,
        black = o.outlines && id === outline;
      if (black)
        page.drawRectangle({
          x: px * mm,
          y: (297 - py - g.cell) * mm,
          width: g.cell * mm,
          height: g.cell * mm,
          color: rgb(0, 0, 0),
        });
      const label = black ? "" : labelFor(id, o, codes, palette);
      if (label) {
        const size = Math.min(
          g.cell * mm * 0.37,
          ((g.cell - o.grid * 2) * mm * 0.82) /
            font.widthOfTextAtSize(label, 1),
        );
        if (size > 0)
          text(
            label,
            px + (g.cell - font.widthOfTextAtSize(label, size) / mm) / 2,
            py + g.cell / 2 + (size / mm) * 0.34,
            size,
            o.gray / 100,
          );
      }
    }
  // Draw each shared edge once, including edges around transparent holes.
  const edges = new Set();
  model.cells.forEach((id, i) => {
    if (id === null) return;
    const x = i % model.width,
      y = Math.floor(i / model.width);
    edges.add(`h,${x},${y}`);
    edges.add(`h,${x},${y + 1}`);
    edges.add(`v,${x},${y}`);
    edges.add(`v,${x + 1},${y}`);
  });
  for (const edge of edges) {
    const [dir, xs, ys] = edge.split(","),
      x = +xs,
      y = +ys;
    page.drawLine({
      start: { x: (g.x + x * g.cell) * mm, y: (297 - g.y - y * g.cell) * mm },
      end: {
        x: (g.x + (x + (dir === "h" ? 1 : 0)) * g.cell) * mm,
        y: (297 - g.y - (y + (dir === "v" ? 1 : 0)) * g.cell) * mm,
      },
      thickness: Math.min(o.grid, g.cell * 0.2) * mm,
      color: rgb(0.3, 0.3, 0.3),
    });
  }
  if (o.legend) {
    text(en ? "MY PALETTE" : "MA PALETTE", 15, g.legendY, 9, 0.3, bold);
    colorsUsed(model, o).forEach((p, i) => {
      const x = 15 + (i % 4) * 47,
        y = g.legendY + 9 + Math.floor(i / 4) * 9;
      page.drawRectangle({
        x: x * mm,
        y: (297 - y) * mm,
        width: 3 * mm,
        height: 3 * mm,
        borderWidth: 0.5,
        borderColor: rgb(0.4, 0.4, 0.4),
        color: rgb(...p.rgb.map((c) => c / 255)),
      });
      text(
        `${legendKey(p, o, codes)}  ${colorName(p, o.locale)}`,
        x + 5,
        y,
        9,
        0.3,
      );
    });
  }
  const footer = `PIXEL & PAPIER · ${SITE_URL.replace(/^https?:\/\//, "")}`;
  text(footer, 15, 287, 8, 0.6);
  page.node.set(
    PDFName.of("Annots"),
    doc.context.obj([
      doc.context.register(
        doc.context.obj({
          Type: "Annot",
          Subtype: "Link",
          Rect: [
            15 * mm,
            10 * mm - 2,
            15 * mm + font.widthOfTextAtSize(footer, 8),
            10 * mm + 8,
          ],
          Border: [0, 0, 0],
          A: { Type: "Action", S: "URI", URI: PDFString.of(SITE_URL) },
        }),
      ),
    ]),
  );
  text(
    en
      ? "A4 · Print at actual size (100%)"
      : "A4 · Imprimer à taille réelle (100 %)",
    125,
    287,
    8,
    0.6,
  );
  return doc.save();
}
