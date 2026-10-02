import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, PDFName } from "pdf-lib";
import {
  readPixels,
  geometry,
  DEFAULTS,
  colorsUsed,
  demoModel,
  validateOptions,
  labelFor,
  isModel,
  letterCodes,
} from "../lib/coloring.js";
import { createColoringPdf } from "../lib/pdf.js";
test("native resolution, transparent pixels and simple French colors", () => {
  const model = readPixels(
    3,
    1,
    new Uint8Array([250, 210, 50, 255, 10, 10, 10, 255, 200, 0, 0, 0]),
  );
  assert.deepEqual(model, { width: 3, height: 1, cells: [6, 1, null] });
  assert.equal(labelFor(6, { labels: "names" }), "Jaune");
  assert.equal(labelFor(6, { labels: "names", locale: "en" }), "Yellow");
  assert.equal(labelFor(6, { labels: "numbers" }), "6");
  assert.deepEqual(
    colorsUsed(model, { outlines: true }).map((p) => p.id),
    [6],
  );
  assert.deepEqual(
    colorsUsed(model, { outlines: false }).map((p) => p.id),
    [1, 6],
  );
});
test("white cells stay blank and out of the legend", () => {
  const model = { width: 2, height: 1, cells: [2, 4] };
  assert.equal(labelFor(2, { labels: "numbers" }), "");
  assert.equal(labelFor(2, { labels: "names" }), "");
  assert.deepEqual(
    colorsUsed(model, { outlines: true }).map((p) => p.id),
    [4],
  );
});
test("letters use one initial, two when initials clash", () => {
  const model = { width: 6, height: 1, cells: [1, 2, 4, 6, 10, 12] },
    o = { outlines: true, labels: "letters" },
    codes = letterCodes(model, o);
  assert.deepEqual(Object.fromEntries(codes), {
    4: "Ro",
    6: "J",
    10: "Rs",
    12: "B",
  });
  assert.equal(labelFor(4, o, codes), "Ro");
  assert.deepEqual(
    Object.fromEntries(letterCodes(model, { ...o, outlines: false })),
    { 1: "N", 4: "Ro", 6: "J", 10: "Rs", 12: "B" },
  );
});
test("rectangular images retain square pixels within centered square", () => {
  const g = geometry({ width: 32, height: 16 }, DEFAULTS);
  assert.equal(g.width, 170);
  assert.equal(g.height, 85);
  assert.equal(g.x, 20);
  assert.equal(g.y, 87.5);
});
test("large print areas fit the A4 page with a compact heading", () => {
  const tall = geometry({ width: 10, height: 20 }, { ...DEFAULTS, size: 270 });
  assert.equal(tall.compact, true);
  assert.equal(tall.y, 20);
  assert.equal(tall.height, 260);
  const wide = geometry({ width: 20, height: 10 }, { ...DEFAULTS, size: 270 });
  assert.equal(wide.width, 200);
  assert.equal(wide.x, 5);
  const legend = geometry(
    { width: 10, height: 20, cells: Array(200).fill(4) },
    { ...DEFAULTS, size: 270 },
  );
  assert.ok(legend.y + legend.height <= legend.legendY - 7);
});
test("invalid dimensions and options are rejected", () => {
  assert.throws(() => readPixels(257, 1, []));
  assert.throws(() => validateOptions({ size: 300 }));
  assert.throws(() => validateOptions({ gray: NaN }));
  assert.throws(() => validateOptions({ labels: "unknown" }));
});
test("PDF has exactly one A4 page for all label modes and maximum layout", async () => {
  for (const labels of ["names", "numbers", "letters", "none"]) {
    const bytes = await createColoringPdf(demoModel(), {
      size: 270,
      labels,
      outlines: false,
    });
    const pdf = await PDFDocument.load(bytes);
    assert.equal(pdf.getPageCount(), 1);
    const [link] = pdf.getPage(0).node.Annots().asArray(),
      action = pdf.context.lookup(link).lookup(PDFName.of("A"));
    assert.equal(
      action.lookup(PDFName.of("URI")).decodeText(),
      "https://pixel-paper.jeremy-laviole.fr",
    );
    assert.ok(Math.abs(pdf.getPage(0).getWidth() - 595.2756) < 0.01);
    assert.ok(Math.abs(pdf.getPage(0).getHeight() - 841.8898) < 0.01);
  }
});
test("saved models are checked before being restored", () => {
  assert.equal(isModel(demoModel()), true);
  assert.equal(isModel(null), false);
  assert.equal(isModel({ width: 2, height: 1, cells: [1] }), false);
  assert.equal(isModel({ width: 1, height: 1, cells: [13] }), false);
  assert.equal(isModel({ width: 1, height: 1, cells: ["1"] }), false);
});
