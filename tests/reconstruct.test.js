import test from "node:test";
import assert from "node:assert/strict";
import {
  detectGrid,
  reconstruct,
  cropSource,
  removeBackground,
} from "../lib/reconstruct.js";
function fixture(columns = 12, rows = 10, scale = 12, grid = false) {
  const width = columns * scale,
    height = rows * scale,
    data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const base =
          (Math.floor(x / scale) + Math.floor(y / scale)) % 2 === 0
            ? [229, 68, 68, 255]
            : [71, 139, 209, 255],
        color =
          grid && (x % scale === 0 || y % scale === 0)
            ? [100, 100, 100, 255]
            : base;
      data.set(color, (y * width + x) * 4);
    }
  return { width, height, data };
}
test("detects enlarged pixel blocks and reconstructs exact colors", () => {
  const source = fixture(),
    grid = detectGrid(source);
  assert.equal(grid.columns, 12);
  assert.equal(grid.rows, 10);
  const m = reconstruct(source, grid);
  assert.equal(m.cells[0], 4);
  assert.equal(m.cells[1], 8);
  assert.equal(m.cells[12], 8);
});
test("printed grid does not become extra cells or gray color", () => {
  const source = fixture(12, 10, 20, true),
    g = detectGrid(source);
  assert.equal(g.columns, 12);
  assert.equal(g.rows, 10);
  assert.deepEqual(new Set(reconstruct(source, g).cells), new Set([4, 8]));
});
test("crop excludes neighboring sprites before reconstruction", () => {
  const src = fixture(),
    crop = cropSource(src, { x: 24, y: 12, width: 72, height: 60 });
  const m = reconstruct(crop, { columns: 6, rows: 5 });
  assert.equal(m.cells.length, 30);
  assert.equal(m.cells[0], 8);
  assert.throws(() => cropSource(src, { x: 140, y: 0, width: 20, height: 20 }));
});
test("background color and tolerance affect only matching pixels", () => {
  const source = {
    width: 3,
    height: 1,
    data: new Uint8ClampedArray([
      200, 180, 230, 255, 203, 183, 233, 255, 0, 0, 0, 255,
    ]),
  };
  const filtered = removeBackground(source, "#c8b4e6", 4);
  assert.equal(filtered.data[3], 0);
  assert.equal(filtered.data[7], 0);
  assert.equal(filtered.data[11], 255);
  assert.equal(source.data[3], 255);
  assert.deepEqual(reconstruct(filtered, { columns: 3, rows: 1 }).cells, [
    null,
    null,
    1,
  ]);
});
test("median ignores thin grid borders and sparse marks in cells", () => {
  const source = fixture(4, 4, 20, true);
  source.data.set([0, 0, 0, 255], (10 * source.width + 10) * 4);
  assert.equal(reconstruct(source, { columns: 4, rows: 4 }).cells[0], 4);
});
test("rejects invalid dimensions, empty crops and invalid colors", () => {
  const source = fixture();
  assert.throws(() => reconstruct(source, { columns: 0, rows: 10 }));
  assert.throws(() =>
    reconstruct(source, { columns: 12, rows: 10, left: source.width }),
  );
  assert.throws(() => removeBackground(source, "white"));
  assert.throws(() => removeBackground(source, "#ffffff", NaN));
  assert.equal(
    detectGrid({
      width: 64,
      height: 64,
      data: new Uint8ClampedArray(64 * 64 * 4),
    }),
    null,
  );
});
