// A projective mapping from the unit square to a convex quadrilateral.
export function homography(corners) {
  if (
    corners.length !== 4 ||
    corners.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))
  )
    throw new Error("Quatre coins valides sont nécessaires.");
  const crosses = corners.map((a, i) => {
    const b = corners[(i + 1) % 4],
      c = corners[(i + 2) % 4];
    return (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
  });
  if (crosses.some((c) => c <= 1e-8))
    throw new Error(
      "Les coins doivent former un quadrilatère convexe sans se croiser.",
    );
  const from = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    rows = [];
  corners.forEach(({ x: u, y: v }, i) => {
    const [x, y] = from[i];
    rows.push(
      [x, y, 1, 0, 0, 0, -u * x, -u * y, u],
      [0, 0, 0, x, y, 1, -v * x, -v * y, v],
    );
  });
  for (let c = 0; c < 8; c++) {
    let pivot = c;
    for (let r = c + 1; r < 8; r++)
      if (Math.abs(rows[r][c]) > Math.abs(rows[pivot][c])) pivot = r;
    if (Math.abs(rows[pivot][c]) < 1e-10)
      throw new Error("Le cadrage est trop aplati.");
    [rows[c], rows[pivot]] = [rows[pivot], rows[c]];
    const divisor = rows[c][c];
    for (let j = c; j < 9; j++) rows[c][j] /= divisor;
    for (let r = 0; r < 8; r++)
      if (r !== c) {
        const factor = rows[r][c];
        for (let j = c; j < 9; j++) rows[r][j] -= factor * rows[c][j];
      }
  }
  return [...rows.map((row) => row[8]), 1];
}
export function projectPoint(h, x, y) {
  const w = h[6] * x + h[7] * y + 1;
  return {
    x: (h[0] * x + h[1] * y + h[2]) / w,
    y: (h[3] * x + h[4] * y + h[5]) / w,
  };
}
export function cssHomography(corners, width, height, side = 1000) {
  const h = homography(
    corners.map((p) => ({ x: p.x * width, y: p.y * height })),
  );
  return `matrix3d(${[h[0] / side, h[3] / side, 0, h[6] / side, h[1] / side, h[4] / side, 0, h[7] / side, 0, 0, 1, 0, h[2], h[5], 0, 1].join(",")})`;
}
