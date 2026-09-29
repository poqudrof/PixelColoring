import test from "node:test";
import assert from "node:assert/strict";
import { homography, projectPoint, cssHomography } from "../lib/homography.js";
test("all four corners map exactly through a perspective transform", () => {
  const target = [
      { x: 0.1, y: 0.2 },
      { x: 0.9, y: 0.1 },
      { x: 0.75, y: 0.9 },
      { x: 0.2, y: 0.75 },
    ],
    h = homography(target);
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ].forEach(([x, y], i) => {
    const p = projectPoint(h, x, y);
    assert.ok(Math.abs(p.x - target[i].x) < 1e-9);
    assert.ok(Math.abs(p.y - target[i].y) < 1e-9);
  });
});
test("CSS matrix uses the same mapping for a 1000 px board", () => {
  const corners = [
      { x: 0.1, y: 0.1 },
      { x: 0.9, y: 0.2 },
      { x: 0.8, y: 0.9 },
      { x: 0.2, y: 0.8 },
    ],
    m = cssHomography(corners, 1200, 800).slice(9, -1).split(",").map(Number);
  const x = 1000,
    y = 1000,
    w = m[3] * x + m[7] * y + m[15];
  assert.ok(Math.abs((m[0] * x + m[4] * y + m[12]) / w - 960) < 1e-8);
  assert.ok(Math.abs((m[1] * x + m[5] * y + m[13]) / w - 720) < 1e-8);
});
test("crossed, flattened and invalid corners are rejected", () => {
  assert.throws(() =>
    homography([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ]),
  );
  assert.throws(() =>
    homography([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ]),
  );
  assert.throws(() => homography([]));
});
