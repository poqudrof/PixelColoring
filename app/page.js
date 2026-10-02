"use client";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import {
  PALETTE,
  DEFAULTS,
  demoModel,
  geometry,
  colorsUsed,
  labelFor,
  legendKey,
  letterCodes,
  colorName,
  validateOptions,
  MAX_SIZE,
  isModel,
} from "../lib/coloring.js";
import { loadJSON, saveJSON } from "../lib/storage.js";
import ImportPanel from "./ImportPanel";
import Projector from "./Projector";
import { createColoringPdf } from "../lib/pdf.js";
import { SITE_URL } from "../lib/site.js";
const SHEET_KEY = "pixel-paper-sheet";
const COPY = {
  fr: {
    private: "Tout reste sur votre appareil",
    badge: "LE COIN CRÉATIF",
    eyebrow: "CRÉE TON COLORIAGE",
    title1: "Choisis ton dessin.",
    title2: "À toi de colorier !",
    intro1:
      "Ajoute ton pixel art et prépare un coloriage magique en quelques clics.",
    intro2: "Tout est prêt pour imprimer, colorier ou projeter.",
    journey: ["Ajoute ton dessin", "Prépare ta feuille", "Imprime ou projette"],
    crayons: "À vos crayons !",
    cases: "cases",
    settings: "Prépare ta feuille",
    printArea: "Zone d’impression",
    small: "Petite",
    large: "Grande",
    gridWidth: "Épaisseur de la grille",
    markers: "Repères dans les cases",
    numbers: "123 · Nombres",
    letters: "A · Lettres",
    colors: "Abc · Couleurs",
    none: "Aucun",
    markerLight: "Clarté des repères",
    dark: "Foncés",
    light: "Très clairs",
    black: "Préremplir les pixels noirs",
    blackHelp: "Conserve les contours noirs de l’image.",
    palette: "Afficher la palette",
    paletteHelp: "Les couleurs et leurs numéros sur la feuille.",
    onePixel: "Chaque carré a sa couleur.",
    tip: "Les couleurs sont regroupées en teintes simples, faciles à retrouver dans la palette.",
    live: "Ta feuille",
    coloring: "Coloriage",
    reconstruction: "Reconstruction",
    workshop: "MON ATELIER PIXEL",
    colorNow: "À toi de colorier !",
    name: "Prénom",
    myPalette: "MA PALETTE",
    actualSize: "A4 · Imprimer à taille réelle (100 %)",
    square: "Dessin de",
    warning:
      "Les cases font moins de 3 mm : les repères seront petits à l’impression.",
    ready: "Ton coloriage est prêt !",
    readyHelp:
      "Tu peux maintenant l’imprimer, télécharger le PDF ou le projeter.",
    projector: "Projeter",
    print: "Imprimer",
    preparing: "Préparation…",
    download: "Télécharger le PDF",
    footer: "Fait pour les petites mains et les grandes imaginations.",
    pdfError: "La création du PDF a échoué. Réessayez.",
    reconstructed: "Pixel art reconstruit",
    gridAlt: "Grille de coloriage",
    demoName: "Petit champignon",
  },
  en: {
    private: "Everything stays on your device",
    badge: "CREATIVE CORNER",
    eyebrow: "MAKE YOUR COLORING PAGE",
    title1: "Pick your picture.",
    title2: "Time to color!",
    intro1:
      "Add your pixel art and make a color-by-number sheet in a few clicks.",
    intro2: "Everything is ready to print, color, or project.",
    journey: ["Add your picture", "Prepare your page", "Print or project"],
    crayons: "Grab your crayons!",
    cases: "cells",
    settings: "Prepare your page",
    printArea: "Print area",
    small: "Small",
    large: "Large",
    gridWidth: "Grid thickness",
    markers: "Cell labels",
    numbers: "123 · Numbers",
    letters: "A · Letters",
    colors: "Abc · Colors",
    none: "None",
    markerLight: "Label lightness",
    dark: "Dark",
    light: "Very light",
    black: "Fill black pixels",
    blackHelp: "Keeps the image’s black outlines.",
    palette: "Show palette",
    paletteHelp: "Colors and their numbers on the page.",
    onePixel: "Every square has a color.",
    tip: "Colors are grouped into simple shades that are easy to find in the palette.",
    live: "Your page",
    coloring: "Coloring page",
    reconstruction: "Reconstruction",
    workshop: "MY PIXEL WORKSHOP",
    colorNow: "Time to color!",
    name: "Name",
    myPalette: "MY PALETTE",
    actualSize: "A4 · Print at actual size (100%)",
    square: "Drawing",
    warning: "Cells are under 3 mm: labels will be small when printed.",
    ready: "Your coloring page is ready!",
    readyHelp: "You can print it, download the PDF, or project it.",
    projector: "Project",
    print: "Print",
    preparing: "Preparing…",
    download: "Download PDF",
    footer: "Made for little hands and big imaginations.",
    pdfError: "PDF creation failed. Please try again.",
    reconstructed: "Reconstructed pixel art",
    gridAlt: "Coloring grid",
    demoName: "Little mushroom",
  },
};
function PixelGrid({ model, options, original = false, copy }) {
  const g = geometry(model, options),
    codes = letterCodes(model, options),
    cell = 10,
    stroke = Math.min((options.grid / g.cell) * cell, 2);
  return (
    <svg
      role="img"
      aria-label={original ? copy.reconstructed : copy.gridAlt}
      viewBox={`0 0 ${model.width * cell} ${model.height * cell}`}
      style={{ width: "100%", height: "100%" }}
    >
      {model.cells.map((id, i) => {
        if (id === null) return null;
        const x = (i % model.width) * cell,
          y = Math.floor(i / model.width) * cell,
          p = PALETTE[id - 1],
          black = options.outlines && id === 1,
          label = labelFor(id, options, codes);
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={cell}
              height={cell}
              fill={original ? p.hex : black ? "#000" : "#fff"}
              stroke={original ? "none" : "#4d4d4d"}
              strokeWidth={stroke}
            />
            {!original && !black && label && (
              <text
                x={x + 5}
                y={y + 5}
                dominantBaseline="central"
                textAnchor="middle"
                fill={`rgb(${options.gray}%,${options.gray}%,${options.gray}%)`}
                fontFamily="Arial"
                fontSize={Math.min(3.7, 8 / Math.max(label.length * 0.58, 1))}
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
export default function Home() {
  const [model, setModel] = useState(demoModel),
    [options, setOptions] = useState(DEFAULTS),
    [name, setName] = useState("Petit champignon"),
    [tab, setTab] = useState("sheet"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [projector, setProjector] = useState(false),
    [locale, setLocale] = useState("fr"),
    [restored, setRestored] = useState(false);
  const copy = COPY[locale];
  useEffect(() => {
    let saved = null;
    try {
      saved = localStorage.getItem("pixel-paper-language");
    } catch {}
    const detected = navigator.languages?.some((language) =>
      language.toLowerCase().startsWith("en"),
    )
      ? "en"
      : "fr";
    setLocale(saved === "en" || saved === "fr" ? saved : detected);
    const sheet = loadJSON(SHEET_KEY);
    if (isModel(sheet?.model)) {
      setModel(sheet.model);
      if (typeof sheet.name === "string") setName(sheet.name);
    }
    try {
      setOptions(validateOptions(sheet?.options));
    } catch {}
    if (sheet?.tab === "original") setTab("original");
    setRestored(true);
  }, []);
  useEffect(() => {
    if (restored) saveJSON(SHEET_KEY, { model, name, options, tab });
  }, [restored, model, name, options, tab]);
  useEffect(() => {
    document.documentElement.lang = locale;
    setName((current) =>
      current === COPY.fr.demoName || current === COPY.en.demoName
        ? COPY[locale].demoName
        : current,
    );
  }, [locale]);
  function changeLocale(next) {
    setLocale(next);
    try {
      localStorage.setItem("pixel-paper-language", next);
    } catch {}
  }
  const update = (key, value) => setOptions((o) => ({ ...o, [key]: value }));
  async function download() {
    setBusy(true);
    setError("");
    try {
      const bytes = await createColoringPdf(model, { ...options, locale }),
        url = URL.createObjectURL(
          new Blob([bytes], { type: "application/pdf" }),
        ),
        a = document.createElement("a");
      a.href = url;
      a.download = `${name.replace(/[^\p{L}\p{N}_-]/gu, "-")}-${locale === "en" ? "coloring-page" : "coloriage"}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      setError(copy.pdfError);
    } finally {
      setBusy(false);
    }
  }
  const g = geometry(model, options),
    used = colorsUsed(model, options),
    codes = letterCodes(model, { ...options, locale });
  return (
    <>
      {projector && (
        <Projector
          model={model}
          locale={locale}
          onClose={() => setProjector(false)}
        />
      )}
      <header>
        <a className="brand" href="./" aria-label="Pixel et Papier">
          <span className="brand-icon">▦</span> pixel{" "}
          <span className="amp">&</span> papier
          <span className="badge">{copy.badge}</span>
        </a>
        <div className="header-tools">
          <span className="local">
            <i /> {copy.private}
          </span>
          <div className="language-switch" aria-label="Language">
            <button
              aria-pressed={locale === "fr"}
              onClick={() => changeLocale("fr")}
            >
              FR
            </button>
            <button
              aria-pressed={locale === "en"}
              onClick={() => changeLocale("en")}
            >
              EN
            </button>
          </div>
        </div>
      </header>
      <main>
        <div className="intro">
          <div>
            <div className="eyebrow">{copy.eyebrow}</div>
            <h1>
              {copy.title1}
              <br />
              {copy.title2}
            </h1>
            <p>
              {copy.intro1}
              <br />
              {copy.intro2}
            </p>
          </div>
          <div className="intro-art">
            <span>✦</span>
            <div className="tiny-art">
              <PixelGrid
                model={demoModel()}
                options={{ ...options, locale }}
                original
                copy={copy}
              />
            </div>
            <span className="art-note">{copy.crayons}</span>
          </div>
        </div>
        <ol className="journey" aria-label={copy.eyebrow}>
          {copy.journey.map((label, index) => (
            <li key={label}>
              <span>{index + 1}</span>
              {label}
            </li>
          ))}
        </ol>
        <div className="workspace">
          <aside>
            <ImportPanel
              locale={locale}
              disabled={busy}
              onError={setError}
              onImport={(nextModel, nextName) => {
                setModel(nextModel);
                setName(nextName);
              }}
            />
            <div className="import-summary">
              {name} · {model.width} × {model.height} {copy.cases}
            </div>
            <section className="card settings">
              <h2>
                <span className="step">2</span> {copy.settings}
              </h2>
              <div className="field">
                <label htmlFor="size">
                  {copy.printArea} <output>{options.size} mm</output>
                </label>
                <input
                  id="size"
                  type="range"
                  min="60"
                  max={MAX_SIZE}
                  value={options.size}
                  onChange={(e) => update("size", +e.target.value)}
                />
                <div className="range-labels">
                  <span>{copy.small}</span>
                  <span>{copy.large}</span>
                </div>
              </div>
              <div className="field">
                <label htmlFor="grid">
                  {copy.gridWidth} <output>{options.grid.toFixed(2)} mm</output>
                </label>
                <input
                  id="grid"
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.01"
                  value={options.grid}
                  onChange={(e) => update("grid", +e.target.value)}
                />
              </div>
              <div className="divider" />
              <div className="field">
                <label>{copy.markers}</label>
                <div className="segments">
                  {[
                    ["numbers", copy.numbers],
                    ["letters", copy.letters],
                    ["names", copy.colors],
                    ["none", copy.none],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      aria-pressed={options.labels === value}
                      className={options.labels === value ? "selected" : ""}
                      onClick={() => update("labels", value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label htmlFor="gray">
                  {copy.markerLight} <output>{options.gray} %</output>
                </label>
                <input
                  id="gray"
                  type="range"
                  min="15"
                  max="95"
                  value={options.gray}
                  disabled={options.labels === "none"}
                  onChange={(e) => update("gray", +e.target.value)}
                />
                <div className="range-labels">
                  <span>{copy.dark}</span>
                  <span>{copy.light}</span>
                </div>
              </div>
              <div className="divider" />
              {[
                ["outlines", copy.black, copy.blackHelp],
                ["legend", copy.palette, copy.paletteHelp],
              ].map(([key, label, help]) => (
                <label className="toggle-row" key={key}>
                  <span>
                    <strong>{label}</strong>
                    <small>{help}</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={options[key]}
                    onChange={(e) => update(key, e.target.checked)}
                  />
                </label>
              ))}
            </section>
            <div className="tip">
              <span>✧</span>
              <p>
                <strong>{copy.onePixel}</strong>
                <br />
                {copy.tip}
              </p>
            </div>
          </aside>
          <section className="preview">
            <div className="preview-bar">
              <div>
                <span className="step preview-step">3</span> {copy.live}
              </div>
              <div className="view-tabs">
                <button
                  className={tab === "sheet" ? "active" : ""}
                  onClick={() => setTab("sheet")}
                >
                  {copy.coloring}
                </button>
                <button
                  className={tab === "original" ? "active" : ""}
                  onClick={() => setTab("original")}
                >
                  {copy.reconstruction}
                </button>
              </div>
              <span className="paper-format">A4 · Portrait</span>
            </div>
            <div className="paper-stage">
              <div className="paper">
                <div className={`paper-heading ${g.compact ? "compact" : ""}`}>
                  {!g.compact && <strong>{copy.workshop}</strong>}
                  <span>
                    {model.width} × {model.height} pixels
                  </span>
                  {!g.compact && <h3>{copy.colorNow}</h3>}
                  <small>{copy.name} : ................................</small>
                </div>
                <div
                  className="sheet-grid"
                  style={{
                    left: `${(g.x / 210) * 100}%`,
                    top: `${(g.y / 297) * 100}%`,
                    width: `${(g.width / 210) * 100}%`,
                    height: `${(g.height / 297) * 100}%`,
                  }}
                >
                  <PixelGrid
                    model={model}
                    options={{ ...options, locale }}
                    original={tab === "original"}
                    copy={copy}
                  />
                </div>
                {options.legend && (
                  <div
                    className="legend"
                    style={{ top: `${((g.legendY - 2.4) / 297) * 100}%` }}
                  >
                    <strong>{copy.myPalette}</strong>
                    <div>
                      {used.map((p) => (
                        <span key={p.id}>
                          <i style={{ background: p.hex }} />
                          {legendKey(
                            p,
                            { ...options, locale },
                            codes,
                          )} &nbsp; {colorName(p, locale)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="paper-footer">
                  <span>
                    PIXEL & PAPIER · {SITE_URL.replace(/^https?:\/\//, "")}
                  </span>
                  <span>{copy.actualSize}</span>
                </div>
              </div>
            </div>
            <div className="preview-bottom">
              <span>
                ↔ &nbsp; {copy.square} {Math.round(g.width)} ×{" "}
                {Math.round(g.height)} mm
              </span>
              <span>
                {model.width * model.height} {copy.cases}
              </span>
            </div>
            {g.cell < 3 && <div className="warning">{copy.warning}</div>}
          </section>
        </div>
        {error && (
          <div role="alert" className="error">
            {error}
          </div>
        )}
        <div className="export-bar">
          <div>
            <strong>{copy.ready}</strong>
            <p>{copy.readyHelp}</p>
          </div>
          <div className="actions">
            <button className="secondary" onClick={() => setProjector(true)}>
              ▦ {copy.projector}
            </button>
            <button
              className="secondary"
              onClick={() => {
                flushSync(() => setTab("sheet"));
                window.print();
              }}
            >
              {copy.print}
            </button>
            <button className="primary" disabled={busy} onClick={download}>
              {busy ? copy.preparing : `↓  ${copy.download}`}
            </button>
          </div>
        </div>
        <footer>
          {copy.footer}
          <span>PIXEL & PAPIER</span>
        </footer>
      </main>
    </>
  );
}
