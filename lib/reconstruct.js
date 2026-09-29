import { readPixels } from "./coloring.js";

export const MAX_SOURCE_PIXELS = 16_000_000;
export function validateSource({ width, height, data }) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width * height > MAX_SOURCE_PIXELS ||
    width > 8192 ||
    height > 8192 ||
    data.length !== width * height * 4
  )
    throw new Error(
      "Image trop grande ou invalide : 16 millions de pixels et 8192 px par côté maximum.",
    );
}
// Project transitions onto each axis. Long grid lines and repeated block edges
// remain prominent even when the artwork obscures some of the lines.
function axisGrid(source, horizontal, blocks = false, small = false) {
  const { width, height, data } = source,
    length = horizontal ? width : height,
    cross = horizontal ? height : width;
  if (length < 48) return null;
  const profile = new Float64Array(length),
    stride = Math.max(1, Math.floor(cross / 400));
  for (let p = 1; p < length; p++) {
    let sum = 0,
      n = 0;
    for (let q = 0; q < cross; q += stride) {
      const i = (horizontal ? q * width + p : p * width + q) * 4,
        j = i - (horizontal ? 4 : width * 4);
      let delta = 0;
      for (let c = 0; c < 3; c++) {
        const a = (data[i + c] * data[i + 3]) / 255 + 255 - data[i + 3],
          b = (data[j + c] * data[j + 3]) / 255 + 255 - data[j + 3];
        delta += Math.abs(a - b);
      }
      sum += delta / 3;
      n++;
    }
    profile[p] = sum / n;
  }
  if (blocks) {
    const energy = profile.reduce((sum, v) => sum + v, 0);
    if (energy < 30) return null;
    for (let step = Math.min(64, Math.floor(length / 4)); step >= 2; step--) {
      const bins = new Float64Array(step);
      for (let p = 1; p < length; p++) bins[p % step] += profile[p];
      const maximum = Math.max(...bins),
        phase = bins.indexOf(maximum);
      if (maximum / energy > 0.93) {
        const start = phase,
          end = start + Math.floor((length - start) / step) * step,
          count = Math.round((end - start) / step);
        if (count >= 4 && count <= 256)
          return { start, end, count, step, confidence: maximum / energy };
      }
    }
    return null;
  }
  const sorted = Array.from(profile).sort((a, b) => a - b),
    threshold = Math.max(4, sorted[Math.floor(length * 0.8)] * 0.6);
  const peaks = [];
  for (let p = 1; p < length - 1; p++)
    if (
      profile[p] >= threshold &&
      profile[p] >= profile[p - 1] &&
      profile[p] >= profile[p + 1]
    ) {
      if (peaks.length && p - peaks.at(-1) < (small ? 2 : 4)) {
        if (profile[p] > profile[peaks.at(-1)]) peaks[peaks.length - 1] = p;
      } else peaks.push(p);
    }
  if (peaks.length < 5 || peaks.length > 400) return null;
  const gaps = peaks
    .slice(1)
    .map((p, i) => p - peaks[i])
    .filter((g) => g >= (small ? 2 : 5) && g <= length / 4);
  let step = 0,
    best = 0;
  for (const g of gaps) {
    const neighbors = gaps.filter((v) => Math.abs(v - g) <= 1);
    if (neighbors.length > best) {
      best = neighbors.length;
      step = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
    }
  }
  if (!step || best < 3) return null;
  let fit = [];
  let fittedStep = step;
  for (
    let candidate = Math.max(2, step - 1);
    candidate <= step + 1;
    candidate += 0.025
  )
    for (const start of peaks) {
      const aligned = peaks.filter(
        (p) =>
          Math.abs(
            (p - start) / candidate - Math.round((p - start) / candidate),
          ) *
            candidate <
          Math.max(small ? 0.6 : 1.6, candidate * 0.07),
      );
      if (aligned.length > fit.length) {
        fit = aligned;
        fittedStep = candidate;
      }
    }
  step = fittedStep;
  if (fit.length < 5 || fit.length / peaks.length < 0.65) return null;
  // Linear regression removes accumulated subpixel drift on resized scans.
  const origin = fit[0],
    indices = fit.map((p) => Math.round((p - origin) / step)),
    meanN = indices.reduce((a, b) => a + b) / fit.length,
    meanP = fit.reduce((a, b) => a + b) / fit.length;
  step =
    fit.reduce((s, p, i) => s + (indices[i] - meanN) * (p - meanP), 0) /
    indices.reduce((s, n) => s + (n - meanN) ** 2, 0);
  let start = meanP - meanN * step,
    end = start + indices.at(-1) * step;
  start = Math.max(0, start - Math.floor(start / step) * step);
  end = Math.min(
    length,
    end + Math.floor((length - end + Math.min(2, step * 0.1)) / step) * step,
  );
  const count = Math.round((end - start) / step),
    confidence = fit.length / (count + 1);
  if (count < 4 || count > 256 || confidence < 0.6) return null;
  return { start, end, count, step, confidence: Math.min(1, confidence) };
}
export function detectGrid(source) {
  validateSource(source);
  const bx = axisGrid(source, true, true),
    by = axisGrid(source, false, true);
  const useBlocks = bx && by && Math.abs(bx.step - by.step) < 0.1;
  const x = useBlocks
      ? bx
      : axisGrid(source, true) || axisGrid(source, true, false, true),
    y = useBlocks
      ? by
      : axisGrid(source, false) || axisGrid(source, false, false, true);
  if (!x || !y || Math.abs(x.step - y.step) / Math.max(x.step, y.step) > 0.12)
    return null;
  return {
    columns: x.count,
    rows: y.count,
    left: Math.round(x.start),
    top: Math.round(y.start),
    right: Math.round(source.width - x.end),
    bottom: Math.round(source.height - y.end),
    confidence: Math.min(x.confidence, y.confidence),
  };
}
export function reconstruct(source, settings) {
  validateSource(source);
  const { width, height, data } = source,
    { columns, rows, left = 0, top = 0, right = 0, bottom = 0 } = settings;
  if (
    !Number.isInteger(columns) ||
    !Number.isInteger(rows) ||
    columns < 1 ||
    rows < 1 ||
    columns > 256 ||
    rows > 256
  )
    throw new Error("Choisissez entre 1 et 256 colonnes et lignes.");
  if (
    [left, top, right, bottom].some((v) => !Number.isInteger(v) || v < 0) ||
    left + right >= width ||
    top + bottom >= height
  )
    throw new Error("Les marges de recadrage dépassent l’image.");
  const sx = (width - left - right) / columns,
    sy = (height - top - bottom) / rows;
  if (sx < 1 || sy < 1)
    throw new Error("Il y a plus de cases que de pixels dans la zone choisie.");
  const pixels = new Uint8ClampedArray(columns * rows * 4);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < columns; x++) {
      const channels = [[], [], [], []];
      // Median of the center 50% excludes grid lines, antialiasing and small text.
      const nx = Math.min(9, Math.max(1, Math.floor(sx * 0.5))),
        ny = Math.min(9, Math.max(1, Math.floor(sy * 0.5)));
      for (let j = 0; j < ny; j++)
        for (let i = 0; i < nx; i++) {
          const px = Math.min(
              width - 1,
              Math.floor(left + (x + 0.25 + ((i + 0.5) / nx) * 0.5) * sx),
            ),
            py = Math.min(
              height - 1,
              Math.floor(top + (y + 0.25 + ((j + 0.5) / ny) * 0.5) * sy),
            ),
            offset = (py * width + px) * 4;
          const alpha = data[offset + 3] / 255;
          for (let c = 0; c < 3; c++)
            channels[c].push(data[offset + c] * alpha + 255 * (1 - alpha));
          channels[3].push(data[offset + 3]);
        }
      for (let c = 0; c < 4; c++) {
        channels[c].sort((a, b) => a - b);
        pixels[(y * columns + x) * 4 + c] =
          channels[c][Math.floor(channels[c].length / 2)];
      }
      // RGB was already composited against white.
      if (pixels[(y * columns + x) * 4 + 3] >= 32)
        pixels[(y * columns + x) * 4 + 3] = 255;
    }
  return readPixels(columns, rows, pixels);
}
export function cropSource(source, rect) {
  validateSource(source);
  const { x, y, width, height } = rect;
  if (
    ![x, y, width, height].every(Number.isInteger) ||
    x < 0 ||
    y < 0 ||
    width < 1 ||
    height < 1 ||
    x + width > source.width ||
    y + height > source.height
  )
    throw new Error("Sélection hors de l’image.");
  const data = new Uint8ClampedArray(width * height * 4);
  for (let row = 0; row < height; row++)
    data.set(
      source.data.subarray(
        ((y + row) * source.width + x) * 4,
        ((y + row) * source.width + x + width) * 4,
      ),
      row * width * 4,
    );
  return { width, height, data };
}
export function removeBackground(source, hex, tolerance = 25) {
  validateSource(source);
  if (
    !/^#[0-9a-f]{6}$/i.test(hex) ||
    !Number.isFinite(tolerance) ||
    tolerance < 0 ||
    tolerance > 150
  )
    throw new Error("Couleur de fond ou tolérance invalide.");
  const target = hex.match(/[0-9a-f]{2}/gi).map((v) => parseInt(v, 16)),
    data = new Uint8ClampedArray(source.data);
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255,
      distance = Math.sqrt(
        target.reduce(
          (sum, v, c) =>
            sum + (data[i + c] * alpha + 255 * (1 - alpha) - v) ** 2,
          0,
        ) / 3,
      );
    if (distance <= tolerance) data[i + 3] = 0;
  }
  return { ...source, data };
}
