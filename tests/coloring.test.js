import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import {
  readPixels,
  geometry,
  DEFAULTS,
  colorsUsed,
  demoModel,
  validateOptions,
  labelFor,
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
test("rectangular images retain square pixels within centered square", () => {
  const g = geometry({ width: 32, height: 16 }, DEFAULTS);
  assert.equal(g.width, 170);
  assert.equal(g.height, 85);
  assert.equal(g.x, 20);
  assert.equal(g.y, 87.5);
});
test("invalid dimensions and options are rejected", () => {
  assert.throws(() => readPixels(257, 1, []));
  assert.throws(() => validateOptions({ size: 200 }));
  assert.throws(() => validateOptions({ gray: NaN }));
  assert.throws(() => validateOptions({ labels: "unknown" }));
});
test("PDF has exactly one A4 page for all label modes and maximum layout", async () => {
  for (const labels of ["names", "numbers", "none"]) {
    const bytes = await createColoringPdf(demoModel(), {
      size: 190,
      labels,
      outlines: false,
    });
    const pdf = await PDFDocument.load(bytes);
    assert.equal(pdf.getPageCount(), 1);
    assert.ok(Math.abs(pdf.getPage(0).getWidth() - 595.2756) < 0.01);
    assert.ok(Math.abs(pdf.getPage(0).getHeight() - 841.8898) < 0.01);
  }
});
