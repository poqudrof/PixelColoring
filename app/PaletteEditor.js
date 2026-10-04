"use client";
import {
  PALETTE,
  MIN_COLORS,
  MAX_COLORS,
  makePalette,
} from "../lib/coloring.js";
const TEXT = {
  fr: {
    title: "Mes papiers colorés",
    help: "Ajoute les couleurs de tes papiers : le dessin est rapproché de ces teintes.",
    name: "Nom de la couleur",
    pick: "Choisir la couleur",
    remove: "Retirer cette couleur",
    add: "+ Ajouter une couleur",
    reset: "Palette d’origine",
    fallback: (n) => `Couleur ${n}`,
  },
  en: {
    title: "My colored papers",
    help: "Add the colors of your papers: the picture is matched to these shades.",
    name: "Color name",
    pick: "Pick the color",
    remove: "Remove this color",
    add: "+ Add a color",
    reset: "Original palette",
    fallback: (n) => `Color ${n}`,
  },
};
export default function PaletteEditor({ palette, onChange, locale = "fr" }) {
  const t = TEXT[locale] || TEXT.fr,
    key = locale === "en" ? "nameEn" : "name",
    edit = (index, patch) =>
      onChange(
        makePalette(
          palette.map((p, i) => (i === index ? { ...p, ...patch } : p)),
        ),
      );
  return (
    <section className="card palette-editor">
      <h2>{t.title}</h2>
      <p className="palette-help">{t.help}</p>
      <ul>
        {palette.map((p, i) => (
          <li key={p.id}>
            <span className="swatch-number">{p.id}</span>
            <input
              type="color"
              aria-label={`${t.pick} ${p.id}`}
              value={p.hex}
              onChange={(e) => edit(i, { hex: e.target.value })}
            />
            <input
              type="text"
              aria-label={`${t.name} ${p.id}`}
              value={p[key]}
              maxLength={24}
              onChange={(e) => edit(i, { [key]: e.target.value })}
            />
            <button
              aria-label={`${t.remove} ${p.id}`}
              disabled={palette.length <= MIN_COLORS}
              onClick={() =>
                onChange(makePalette(palette.filter((_, j) => j !== i)))
              }
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="palette-actions">
        <button
          disabled={palette.length >= MAX_COLORS}
          onClick={() =>
            onChange(
              makePalette([
                ...palette,
                {
                  name: TEXT.fr.fallback(palette.length + 1),
                  nameEn: TEXT.en.fallback(palette.length + 1),
                  hex: "#cccccc",
                },
              ]),
            )
          }
        >
          {t.add}
        </button>
        <button onClick={() => onChange(PALETTE)}>{t.reset}</button>
      </div>
    </section>
  );
}
