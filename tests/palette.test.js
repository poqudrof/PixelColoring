import test from "node:test";
import assert from "node:assert/strict";
import {
  readPixels,
  makePalette,
  isModel,
  colorsUsed,
  labelFor,
  letterCodes,
  remapModel,
  demoModel,
} from "../lib/coloring.js";
import { createColoringPdf } from "../lib/pdf.js";
const paper = makePalette([
  { name: "Papier crème", hex: "#fff4d6" },
  { name: "Papier kraft", hex: "#a67c52" },
  { name: "Papier nuit", hex: "#1c2541" },
]);
test("pixels snap to a custom palette and the model carries it", () => {
  const model = readPixels(
    2,
    1,
    new Uint8Array([160, 120, 80, 255, 20, 30, 70, 255]),
    paper,
  );
  assert.deepEqual(model.cells, [2, 3]);
  assert.equal(model.palette, paper);
  assert.ok(isModel(model));
  assert.equal(
    labelFor(2, { labels: "names" }, undefined, paper),
    "Papier kraft",
  );
  assert.deepEqual(
    colorsUsed(model, { outlines: false }).map((p) => p.id),
    [2, 3],
  );
  assert.deepEqual(
    colorsUsed(model, { outlines: true }).map((p) => p.id),
    [2],
  );
});
test("remapModel moves a model to another palette", () => {
  const remapped = remapModel(demoModel(), paper);
  assert.ok(isModel(remapped));
  assert.ok(remapped.cells.every((id) => id === null || id <= 3));
});
test("the PDF is produced with a custom palette", async () => {
  const model = readPixels(1, 1, new Uint8Array([160, 120, 80, 255]), paper);
  assert.ok((await createColoringPdf(model)).length > 500);
});
test("letter codes survive an empty or blank color name", () => {
  const edited = makePalette([
    { name: "", hex: "#fff4d6" },
    { name: "  ", hex: "#a67c52" },
    { name: "Rouge", hex: "#e54444" },
  ]);
  const model = readPixels(
    3,
    1,
    new Uint8Array([255, 244, 214, 255, 166, 124, 82, 255, 229, 68, 68, 255]),
    edited,
  );
  const codes = letterCodes(model, { outlines: false, locale: "fr" });
  assert.equal(codes.get(2), "2");
  assert.equal(codes.get(3), "R");
});
