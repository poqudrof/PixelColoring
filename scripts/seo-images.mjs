// Generates the favicon, Apple touch icon and social preview from the demo
// mushroom. Run `npm run seo:images` after changing the demo or the brand.
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { PALETTE, demoModel } from "../lib/coloring.js";

const INK = "#263c35",
  MUTED = "#7f8780",
  GREEN = "#335d4b",
  BORDER = "#e5e8df",
  PAPER = "#fffefb",
  BACKGROUND = "#f8f9f5";
const model = demoModel();
const cells = model.cells
  .map((id, i) => ({ id, x: i % model.width, y: Math.floor(i / model.width) }))
  .filter((c) => c.id !== null);

// One path per color keeps the SVG small and edges crisp.
function pixels(size, fillFor = (id) => PALETTE[id - 1].hex) {
  const paths = new Map();
  for (const { id, x, y } of cells) {
    const fill = fillFor(id);
    paths.set(
      fill,
      `${paths.get(fill) || ""}M${x * size} ${y * size}h${size}v${size}h${-size}z`,
    );
  }
  return [...paths]
    .map(([fill, d]) => `<path fill="${fill}" d="${d}"/>`)
    .join("");
}
function numberedGrid(size) {
  return cells
    .map(({ id, x, y }) => {
      const black = id === 1,
        rect = `<rect x="${x * size}" y="${y * size}" width="${size}" height="${size}" fill="${black ? "#000" : "#fff"}" stroke="#4d4d4d" stroke-width="0.6"/>`;
      return black
        ? rect
        : `${rect}<text x="${(x + 0.5) * size}" y="${(y + 0.5) * size + size * 0.2}" font-size="${size * 0.55}" text-anchor="middle" fill="#9d9d9d">${id}</text>`;
    })
    .join("");
}

const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect width="16" height="16" rx="3" fill="${PAPER}"/>${pixels(1)}</svg>\n`;

const appleIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" shape-rendering="crispEdges"><rect width="180" height="180" fill="${PAPER}"/><g transform="translate(10 10)">${pixels(10)}</g></svg>`;

const used = [...new Set(cells.map((c) => c.id))].sort((a, b) => a - b);
const legend = used
  .map((id, i) => {
    const p = PALETTE[id - 1];
    return `<g transform="translate(${i * 74} 0)"><rect width="16" height="16" rx="3" fill="${p.hex}" stroke="${BORDER}"/><text x="22" y="13" font-size="12" fill="${INK}">${id} ${p.name}</text></g>`;
  })
  .join("");
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" font-family="Arial, Helvetica, sans-serif">
  <rect width="1200" height="630" fill="${BACKGROUND}"/>
  <g transform="translate(80 78)">
    <rect width="52" height="52" rx="10" fill="${PAPER}" stroke="${BORDER}" stroke-width="2"/>
    <g transform="translate(6 6)" shape-rendering="crispEdges">${pixels(2.5)}</g>
    <text x="70" y="37" font-size="32" font-weight="700" letter-spacing="-1" fill="${INK}">pixel <tspan font-family="Georgia, serif" font-style="italic" font-weight="400" fill="#91a18e">&amp;</tspan> papier</text>
  </g>
  <text font-size="58" font-weight="700" letter-spacing="-1.5" fill="${INK}">
    <tspan x="80" y="262">Ton pixel art devient</tspan>
    <tspan x="80" y="334">un coloriage magique</tspan>
    <tspan x="80" y="406" fill="${GREEN}">à imprimer.</tspan>
  </text>
  <text x="80" y="478" font-size="25" fill="${MUTED}">Grille numérotée · 12 couleurs · PDF A4 gratuit</text>
  <g transform="translate(80 520)">
    <circle cx="5" cy="-7" r="5" fill="#719779"/>
    <text x="20" y="0" font-size="20" fill="${MUTED}">Tout reste sur ton appareil</text>
  </g>
  <g transform="translate(790 48)">
    <rect x="6" y="8" width="340" height="481" rx="6" fill="#dfe3d8"/>
    <rect width="340" height="481" rx="6" fill="#fff" stroke="${BORDER}" stroke-width="2"/>
    <text x="310" y="44" text-anchor="end" font-size="11" letter-spacing="2" font-weight="700" fill="${MUTED}">MON ATELIER PIXEL</text>
    <text x="310" y="76" text-anchor="end" font-size="24" font-weight="700" fill="${INK}">À toi de colorier !</text>
    <g transform="translate(26 112)" shape-rendering="crispEdges">${numberedGrid(18)}</g>
    <text x="30" y="432" font-size="10" letter-spacing="2" font-weight="700" fill="${MUTED}">MA PALETTE</text>
    <g transform="translate(30 448)">${legend}</g>
  </g>
  <g transform="translate(680 70) rotate(-7)">
    <rect x="4" y="6" width="150" height="150" rx="10" fill="#dfe3d8"/>
    <rect width="150" height="150" rx="10" fill="#fff" stroke="${BORDER}" stroke-width="2"/>
    <g transform="translate(19 19)" shape-rendering="crispEdges">${pixels(7)}</g>
  </g>
</svg>`;

await writeFile("app/icon.svg", icon);
// favicon.ico wrapping a single 32 px PNG, for clients that ignore the SVG.
const favicon = await sharp(Buffer.from(icon), { density: 144 })
    .png()
    .toBuffer(),
  header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6);
header.writeUInt8(32, 7);
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(favicon.length, 14);
header.writeUInt32LE(header.length, 18);
await writeFile("app/favicon.ico", Buffer.concat([header, favicon]));
await sharp(Buffer.from(appleIcon)).png().toFile("app/apple-icon.png");
await sharp(Buffer.from(og))
  .png({ compressionLevel: 9, palette: true })
  .toFile("app/opengraph-image.png");
console.log(
  "app/icon.svg, app/favicon.ico, app/apple-icon.png, app/opengraph-image.png",
);
