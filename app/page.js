"use client";
import { useState, useRef } from "react";
import { flushSync } from "react-dom";
import {
  PALETTE,
  DEFAULTS,
  demoModel,
  readPixels,
  geometry,
  colorsUsed,
  labelFor,
} from "../lib/coloring.js";
import { createColoringPdf } from "../lib/pdf.js";
function PixelGrid({ model, options, original = false }) {
  const g = geometry(model, options),
    cell = 10,
    stroke = Math.min((options.grid / g.cell) * cell, 2);
  return (
    <svg
      role="img"
      aria-label={original ? "Image originale" : "Grille de coloriage"}
      viewBox={`0 0 ${model.width * cell} ${model.height * cell}`}
      style={{ width: "100%", height: "100%" }}
    >
      {model.cells.map((id, i) => {
        if (id === null) return null;
        const x = (i % model.width) * cell,
          y = Math.floor(i / model.width) * cell,
          p = PALETTE[id - 1],
          black = options.outlines && id === 1,
          label = labelFor(id, options);
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
    [drag, setDrag] = useState(false);
  const input = useRef();
  const update = (key, value) => setOptions((o) => ({ ...o, [key]: value }));
  async function load(file) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      if (
        !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
          file.type,
        )
      )
        throw new Error("Choisissez une image PNG, JPEG, WebP ou GIF.");
      if (file.size > 10 * 1024 * 1024)
        throw new Error("Le fichier doit faire moins de 10 Mo.");
      const bitmap = await createImageBitmap(file);
      try {
        if (bitmap.width > 256 || bitmap.height > 256)
          throw new Error(
            "L’image doit faire au maximum 256 × 256 pixels. Utilisez le pixel art à sa résolution native.",
          );
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(bitmap, 0, 0);
        setModel(
          readPixels(
            bitmap.width,
            bitmap.height,
            context.getImageData(0, 0, bitmap.width, bitmap.height).data,
          ),
        );
        setName(file.name.replace(/\.[^.]+$/, ""));
      } finally {
        bitmap.close();
      }
    } catch (e) {
      setError(e.message || "Impossible de lire cette image.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  async function download() {
    setBusy(true);
    setError("");
    try {
      const bytes = await createColoringPdf(model, options),
        url = URL.createObjectURL(
          new Blob([bytes], { type: "application/pdf" }),
        ),
        a = document.createElement("a");
      a.href = url;
      a.download = `${name.replace(/[^\p{L}\p{N}_-]/gu, "-")}-coloriage.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      setError("La création du PDF a échoué. Réessayez.");
    } finally {
      setBusy(false);
    }
  }
  const g = geometry(model, options),
    used = colorsUsed(model, options);
  return (
    <>
      <header>
        <a className="brand" href="/" aria-label="Pixel et Papier">
          <span className="brand-icon">▦</span> pixel{" "}
          <span className="amp">&</span> papier
          <span className="badge">L’ATELIER</span>
        </a>
        <span className="local">
          <i /> Tout reste sur votre appareil
        </span>
      </header>
      <main>
        <div className="intro">
          <div>
            <div className="eyebrow">DES PIXELS AUX CRAYONS</div>
            <h1>
              De petits pixels.
              <br />
              De grandes idées.
            </h1>
            <p>
              Transformez votre pixel art en un coloriage à imprimer.
              <br />
              Un peu de papier, beaucoup de couleurs.
            </p>
          </div>
          <div className="intro-art">
            <span>✦</span>
            <div className="tiny-art">
              <PixelGrid model={demoModel()} options={options} original />
            </div>
            <span className="art-note">À vos crayons !</span>
          </div>
        </div>
        <div className="workspace">
          <aside>
            <section className="card">
              <h2>
                <span className="step">01</span> Votre pixel art
              </h2>
              <button
                className={`upload ${drag ? "drag" : ""}`}
                disabled={busy}
                onClick={() => input.current.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  if (!busy) load(e.dataTransfer.files[0]);
                }}
              >
                <span className="upload-icon">↥</span>
                <strong>Choisir une image</strong>
                <span>ou glissez-la ici</span>
                <small>PNG, JPG, WebP, GIF · 256 × 256 max.</small>
              </button>
              <input
                ref={input}
                hidden
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => load(e.target.files[0])}
              />
              <div className="file">
                <div className="file-thumb">
                  <PixelGrid model={model} options={options} original />
                </div>
                <div>
                  <strong>{name}</strong>
                  <small>
                    {model.width} × {model.height} pixels ·{" "}
                    {PALETTE.filter((p) => model.cells.includes(p.id)).length}{" "}
                    couleurs
                  </small>
                </div>
                <span className="file-check">✓</span>
              </div>
            </section>
            <section className="card settings">
              <h2>
                <span className="step">02</span> À votre façon
              </h2>
              <div className="field">
                <label htmlFor="size">
                  Zone d’impression <output>{options.size} mm</output>
                </label>
                <input
                  id="size"
                  type="range"
                  min="60"
                  max="190"
                  value={options.size}
                  onChange={(e) => update("size", +e.target.value)}
                />
                <div className="range-labels">
                  <span>Petite</span>
                  <span>Grande</span>
                </div>
              </div>
              <div className="field">
                <label htmlFor="grid">
                  Épaisseur de la grille{" "}
                  <output>{options.grid.toFixed(2)} mm</output>
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
                <label>Repères dans les cases</label>
                <div className="segments">
                  {[
                    ["numbers", "123 · Nombres"],
                    ["names", "Abc · Couleurs"],
                    ["none", "Aucun"],
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
                  Clarté des repères <output>{options.gray} %</output>
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
                  <span>Foncés</span>
                  <span>Très clairs</span>
                </div>
              </div>
              <div className="divider" />
              {[
                [
                  "outlines",
                  "Préremplir les pixels noirs",
                  "Conserve les contours noirs de l’image.",
                ],
                [
                  "legend",
                  "Afficher la palette",
                  "Les couleurs et leurs numéros sur la feuille.",
                ],
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
                <strong>Un pixel, une case.</strong>
                <br />
                La résolution d’origine est conservée. Les couleurs sont
                rapprochées de 12 teintes simples.
              </p>
            </div>
          </aside>
          <section className="preview">
            <div className="preview-bar">
              <div>
                <span className="live-dot" /> Aperçu en direct
              </div>
              <div className="view-tabs">
                <button
                  className={tab === "sheet" ? "active" : ""}
                  onClick={() => setTab("sheet")}
                >
                  Coloriage
                </button>
                <button
                  className={tab === "original" ? "active" : ""}
                  onClick={() => setTab("original")}
                >
                  Original
                </button>
              </div>
              <span className="paper-format">A4 · Portrait</span>
            </div>
            <div className="paper-stage">
              <div className="paper">
                <div className="paper-heading">
                  <strong>MON ATELIER PIXEL</strong>
                  <span>
                    {model.width} × {model.height} pixels
                  </span>
                  <h3>À toi de colorier !</h3>
                  <small>Prénom : ................................</small>
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
                    options={options}
                    original={tab === "original"}
                  />
                </div>
                {options.legend && (
                  <div className="legend">
                    <strong>MA PALETTE</strong>
                    <div>
                      {used.map((p) => (
                        <span key={p.id}>
                          <i style={{ background: p.hex }} />
                          {p.id} &nbsp; {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="paper-footer">
                  <span>PIXEL & PAPIER</span>
                  <span>A4 · Imprimer à taille réelle (100 %)</span>
                </div>
              </div>
            </div>
            <div className="preview-bottom">
              <span>
                ↔ &nbsp; Zone carrée de {options.size} × {options.size} mm
              </span>
              <span>{model.width * model.height} pixels d’origine</span>
            </div>
            {g.cell < 3 && (
              <div className="warning">
                Les cases font moins de 3 mm : les repères seront petits à
                l’impression.
              </div>
            )}
          </section>
        </div>
        {error && (
          <div role="alert" className="error">
            {error}
          </div>
        )}
        <div className="export-bar">
          <div>
            <strong>Votre prochain moment créatif est prêt.</strong>
            <p>Une feuille A4, une palette et le plaisir de colorier.</p>
          </div>
          <div className="actions">
            <button
              className="secondary"
              onClick={() => {
                flushSync(() => setTab("sheet"));
                window.print();
              }}
            >
              Imprimer
            </button>
            <button className="primary" disabled={busy} onClick={download}>
              {busy ? "Préparation…" : "↓  Télécharger le PDF"}
            </button>
          </div>
        </div>
        <footer>
          Fait pour les petites mains et les grandes imaginations.
          <span>PIXEL & PAPIER</span>
        </footer>
      </main>
    </>
  );
}
