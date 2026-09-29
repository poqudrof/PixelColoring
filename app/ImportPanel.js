"use client";
import { useEffect, useRef, useState } from "react";
import { readPixels } from "../lib/coloring.js";
import {
  detectGrid,
  reconstruct,
  cropSource,
  removeBackground,
  validateSource,
} from "../lib/reconstruct.js";
const emptyGrid = {
  columns: 24,
  rows: 24,
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
};
const EN = {
  "Votre pixel art": "Your pixel art",
  "Ajoute ton dessin": "Add your picture",
  "Réglages précis": "Fine-tune",
  "À ouvrir seulement si la détection automatique a besoin d’un coup de pouce.":
    "Open this only if automatic detection needs a little help.",
  "Lecture…": "Reading…",
  "Choisir une image": "Choose an image",
  "Pixel art, grille ou planche de personnages":
    "Pixel art, grid, or character sheet",
  "Coller une image": "Paste an image",
  "Cliquez sur la couleur de fond dans l’image.":
    "Click the background color in the image.",
  "Glissez sur l’image pour sélectionner une vignette ou une partie du dessin.":
    "Drag over the image to select a tile or part of the artwork.",
  "Terminer la sélection agrandie": "Finish enlarged selection",
  "Agrandir pour sélectionner": "Enlarge to select",
  Gauche: "Left",
  Haut: "Top",
  Largeur: "Width",
  Hauteur: "Height",
  "Toute l’image": "Whole image",
  "Détecter les cases": "Detect cells",
  "Lecture de la sélection": "Selection reading",
  "Un pixel = une case": "One pixel = one cell",
  "Image agrandie / quadrillée": "Enlarged / gridded image",
  Colonnes: "Columns",
  Lignes: "Rows",
  "Alignement de la grille": "Grid alignment",
  "Marges en pixels à ignorer à l’intérieur de la sélection.":
    "Pixel margins to ignore inside the selection.",
  Droite: "Right",
  Bas: "Bottom",
  "Supprimer une couleur de fond": "Remove a background color",
  "Retire cette couleur partout dans la sélection.":
    "Removes this color everywhere in the selection.",
  Couleur: "Color",
  "Annuler la pipette": "Cancel eyedropper",
  "Pipette sur l’image": "Eyedropper on image",
  Tolérance: "Tolerance",
  "Appliquer à la feuille": "Apply to page",
  "La détection vise les grilles droites et régulières. Une photo inclinée nécessite un redressement préalable.":
    "Detection targets straight, regular grids. A tilted photo must be straightened first.",
};
export default function ImportPanel({
  onImport,
  onError,
  disabled,
  locale = "fr",
}) {
  const tr = (value) => (locale === "en" ? EN[value] || value : value);
  const msg = (fr, en) => (locale === "en" ? en : fr);
  const input = useRef(),
    anchor = useRef(),
    [source, setSource] = useState(null),
    [image, setImage] = useState(""),
    [filename, setFilename] = useState(""),
    [crop, setCrop] = useState(null),
    [mode, setMode] = useState("grid"),
    [grid, setGrid] = useState(emptyGrid),
    [notice, setNotice] = useState(""),
    [background, setBackground] = useState(false),
    [color, setColor] = useState("#ffffff"),
    [tolerance, setTolerance] = useState(25),
    [picking, setPicking] = useState(false),
    [loading, setLoading] = useState(false),
    [expanded, setExpanded] = useState(false);
  useEffect(() => {
    function handlePaste(event) {
      if (disabled || loading) return;
      const imageItem = Array.from(event.clipboardData?.items || []).find(
        (item) => item.kind === "file" && item.type.startsWith("image/"),
      );
      const file = imageItem?.getAsFile();
      if (!file) return;
      event.preventDefault();
      load(file);
    }
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  });
  async function pasteImage() {
    onError("");
    if (!navigator.clipboard?.read) {
      onError(
        msg(
          "Utilisez ⌘V ou Ctrl+V pour coller une image dans cette fenêtre.",
          "Use ⌘V or Ctrl+V to paste an image into this window.",
        ),
      );
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((type) =>
          ["image/png", "image/jpeg", "image/webp", "image/gif"].includes(type),
        );
        if (type) {
          const blob = await item.getType(type);
          await load(
            new File(
              [blob],
              (locale === "en" ? "pasted-image." : "image-collee.") +
                type.split("/")[1],
              { type },
            ),
          );
          return;
        }
      }
      onError(
        msg(
          "Le presse-papiers ne contient pas d’image. Copiez une image, puis utilisez ⌘V ou Ctrl+V.",
          "The clipboard does not contain an image. Copy one, then use ⌘V or Ctrl+V.",
        ),
      );
    } catch {
      onError(
        msg(
          "L’accès au presse-papiers n’a pas été autorisé. Vous pouvez coller directement avec ⌘V ou Ctrl+V.",
          "Clipboard access was not allowed. You can still paste directly with ⌘V or Ctrl+V.",
        ),
      );
    }
  }
  function convert(
    raw,
    rect,
    kind,
    settings,
    bg = background,
    hex = color,
    tol = tolerance,
  ) {
    let selected = cropSource(raw, rect);
    if (bg) selected = removeBackground(selected, hex, tol);
    return kind === "native"
      ? readPixels(selected.width, selected.height, selected.data)
      : reconstruct(selected, settings);
  }
  function analyze(raw, rect) {
    const selected = cropSource(raw, rect),
      detected = detectGrid(selected);
    if (detected) {
      setGrid(detected);
      setMode("grid");
      setNotice(
        msg(
          `Grille estimée : ${detected.columns} × ${detected.rows} cases. Vérifiez l’aperçu puis ajustez si nécessaire.`,
          `Estimated grid: ${detected.columns} × ${detected.rows} cells. Check the preview and adjust if needed.`,
        ),
      );
      return { kind: "grid", settings: detected };
    }
    const native = selected.width <= 256 && selected.height <= 256;
    setMode(native ? "native" : "grid");
    const fallback = { ...emptyGrid };
    setGrid(fallback);
    setNotice(
      native
        ? msg(
            "Aucune grille régulière détectée. Lecture pixel par pixel ; utilisez « Image agrandie » pour reconstruire des blocs.",
            "No regular grid detected. Reading pixel by pixel; use “Enlarged / gridded image” to reconstruct blocks.",
          )
        : msg(
            "Détection incertaine. Indiquez le nombre de colonnes et de lignes avant d’appliquer.",
            "Detection is uncertain. Enter the number of columns and rows before applying.",
          ),
    );
    return native ? { kind: "native", settings: fallback } : null;
  }
  async function load(file) {
    if (!file) return;
    setLoading(true);
    onError("");
    try {
      if (
        !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
          file.type,
        )
      )
        throw new Error(
          msg(
            "Choisissez une image PNG, JPG, WebP ou GIF.",
            "Choose a PNG, JPG, WebP, or GIF image.",
          ),
        );
      if (file.size > 10 * 1024 * 1024)
        throw new Error(
          msg(
            "Le fichier doit faire moins de 10 Mo.",
            "The file must be under 10 MB.",
          ),
        );
      const bitmap = await createImageBitmap(file);
      try {
        if (
          bitmap.width * bitmap.height > 16_000_000 ||
          bitmap.width > 8192 ||
          bitmap.height > 8192
        )
          throw new Error(
            msg(
              "Image trop grande : 16 millions de pixels et 8192 px par côté maximum.",
              "Image too large: maximum 16 million pixels and 8192 px per side.",
            ),
          );
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(bitmap, 0, 0);
        const raw = {
          width: bitmap.width,
          height: bitmap.height,
          data: ctx.getImageData(0, 0, bitmap.width, bitmap.height).data,
        };
        validateSource(raw);
        const rect = { x: 0, y: 0, width: raw.width, height: raw.height },
          name = file.name.replace(/\.[^.]+$/, "");
        setSource(raw);
        setImage(canvas.toDataURL("image/png"));
        setFilename(name);
        setCrop(rect);
        setBackground(false);
        setPicking(false);
        const result = analyze(raw, rect);
        if (result)
          onImport(
            convert(raw, rect, result.kind, result.settings, false),
            name,
          );
        else
          setNotice(
            msg(
              "Réglez les cases puis cliquez sur « Appliquer à la feuille ». La feuille actuelle reste inchangée.",
              "Adjust the cells, then click “Apply to page”. The current page remains unchanged.",
            ),
          );
      } finally {
        bitmap.close();
      }
    } catch (e) {
      onError(
        e.message ||
          msg("Impossible de lire l’image.", "Unable to read this image."),
      );
    } finally {
      setLoading(false);
      if (input.current) input.current.value = "";
    }
  }
  function point(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(
        source.width - 1,
        Math.max(
          0,
          Math.floor(
            ((event.clientX - bounds.left) / bounds.width) * source.width,
          ),
        ),
      ),
      y: Math.min(
        source.height - 1,
        Math.max(
          0,
          Math.floor(
            ((event.clientY - bounds.top) / bounds.height) * source.height,
          ),
        ),
      ),
    };
  }
  function start(event) {
    event.preventDefault();
    const p = point(event);
    if (picking) {
      const offset = (p.y * source.width + p.x) * 4;
      setColor(
        "#" +
          Array.from(source.data.slice(offset, offset + 3))
            .map((v) => v.toString(16).padStart(2, "0"))
            .join(""),
      );
      setBackground(true);
      setPicking(false);
      return;
    }
    anchor.current = p;
    event.currentTarget.setPointerCapture(event.pointerId);
    setCrop({ ...p, width: 1, height: 1 });
  }
  function move(event) {
    if (!anchor.current) return;
    const p = point(event),
      a = anchor.current;
    setCrop({
      x: Math.min(a.x, p.x),
      y: Math.min(a.y, p.y),
      width: Math.abs(a.x - p.x) + 1,
      height: Math.abs(a.y - p.y) + 1,
    });
  }
  function apply() {
    try {
      onImport(convert(source, crop, mode, grid), filename);
      onError("");
      setNotice(
        msg(
          "Sélection appliquée à la feuille. Les options ci-dessous restent modifiables.",
          "Selection applied to the page. You can keep adjusting the options below.",
        ),
      );
    } catch (e) {
      onError(e.message);
    }
  }
  return (
    <section className="card import-panel">
      <h2>
        <span className="step">1</span> {tr("Ajoute ton dessin")}
      </h2>
      <button
        className="upload"
        disabled={disabled || loading}
        onClick={() => input.current.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!disabled && !loading) load(e.dataTransfer.files[0]);
        }}
      >
        <span className="upload-icon">↥</span>
        <strong>{tr(loading ? "Lecture…" : "Choisir une image")}</strong>
        <span>{tr("Pixel art, grille ou planche de personnages")}</span>
        <small>
          PNG, JPG, WebP, GIF ·{" "}
          {locale === "en" ? "10 MB maximum" : "10 Mo maximum"}
        </small>
      </button>
      <button
        className="paste-image"
        disabled={disabled || loading}
        onClick={pasteImage}
      >
        {tr("Coller une image")} <kbd>⌘V / Ctrl+V</kbd>
      </button>
      <input
        ref={input}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => load(e.target.files[0])}
      />
      {source && (
        <>
          <div className="source-heading">
            <strong>{filename}</strong>
            <small>
              {source.width} × {source.height} px
            </small>
          </div>
          <p className="import-help">
            {picking
              ? tr("Cliquez sur la couleur de fond dans l’image.")
              : tr(
                  "Glissez sur l’image pour sélectionner une vignette ou une partie du dessin.",
                )}
          </p>
          <div
            className={`source-selector ${picking ? "picking" : ""} ${expanded ? "expanded" : ""}`}
            style={
              expanded
                ? {
                    width: `min(90vw, ${(80 * source.width) / source.height}vh)`,
                  }
                : undefined
            }
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={() => {
              anchor.current = null;
            }}
            onPointerCancel={() => {
              anchor.current = null;
            }}
          >
            <img
              src={image}
              alt={msg(
                "Image importée : sélectionnez une zone à convertir",
                "Imported image: select an area to convert",
              )}
              draggable={false}
            />
            <svg
              viewBox={`0 0 ${source.width} ${source.height}`}
              aria-hidden="true"
            >
              <path
                d={`M0 0H${source.width}V${source.height}H0Z M${crop.x} ${crop.y}v${crop.height}h${crop.width}v-${crop.height}Z`}
                fill="rgba(20,35,25,.4)"
                fillRule="evenodd"
              />
              <rect
                x={crop.x}
                y={crop.y}
                width={crop.width}
                height={crop.height}
                fill="none"
                stroke="#e6a42e"
                strokeWidth={source.width / 150}
              />
            </svg>
          </div>
          <button
            className={`expand-source ${expanded ? "close-source" : ""}`}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded
              ? tr("Terminer la sélection agrandie")
              : tr("Agrandir pour sélectionner")}
          </button>
          <details className="advanced-import">
            <summary>{tr("Réglages précis")}</summary>
            <p className="import-help">
              {tr(
                "À ouvrir seulement si la détection automatique a besoin d’un coup de pouce.",
              )}
            </p>
            <div className="crop-fields">
              {[
                ["x", tr("Gauche")],
                ["y", tr("Haut")],
                ["width", tr("Largeur")],
                ["height", tr("Hauteur")],
              ].map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    type="number"
                    min={key === "x" || key === "y" ? 0 : 1}
                    max={
                      key === "x" || key === "width"
                        ? source.width
                        : source.height
                    }
                    value={crop[key]}
                    onChange={(e) =>
                      setCrop({ ...crop, [key]: Number(e.target.value) })
                    }
                  />
                </label>
              ))}
            </div>
            <div className="import-actions">
              <button
                onClick={() =>
                  setCrop({
                    x: 0,
                    y: 0,
                    width: source.width,
                    height: source.height,
                  })
                }
              >
                {tr("Toute l’image")}
              </button>
              <button
                onClick={() => {
                  try {
                    analyze(source, crop);
                    onError("");
                  } catch (e) {
                    onError(e.message);
                  }
                }}
              >
                {tr("Détecter les cases")}
              </button>
            </div>
            <label className="import-mode">
              {tr("Lecture de la sélection")}
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="native">{tr("Un pixel = une case")}</option>
                <option value="grid">
                  {tr("Image agrandie / quadrillée")}
                </option>
              </select>
            </label>
            {mode === "grid" && (
              <>
                <div className="crop-fields two">
                  {[
                    ["columns", tr("Colonnes")],
                    ["rows", tr("Lignes")],
                  ].map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        type="number"
                        min="1"
                        max="256"
                        value={grid[key]}
                        onChange={(e) =>
                          setGrid({ ...grid, [key]: Number(e.target.value) })
                        }
                      />
                    </label>
                  ))}
                </div>
                <details>
                  <summary>{tr("Alignement de la grille")}</summary>
                  <p className="import-help">
                    {tr(
                      "Marges en pixels à ignorer à l’intérieur de la sélection.",
                    )}
                  </p>
                  <div className="crop-fields">
                    {[
                      ["left", tr("Gauche")],
                      ["top", tr("Haut")],
                      ["right", tr("Droite")],
                      ["bottom", tr("Bas")],
                    ].map(([key, label]) => (
                      <label key={key}>
                        {label}
                        <input
                          type="number"
                          min="0"
                          value={grid[key]}
                          onChange={(e) =>
                            setGrid({ ...grid, [key]: Number(e.target.value) })
                          }
                        />
                      </label>
                    ))}
                  </div>
                </details>
              </>
            )}
          </details>
          <label className="toggle-row">
            <span>
              <strong>{tr("Supprimer une couleur de fond")}</strong>
              <small>
                {tr("Retire cette couleur partout dans la sélection.")}
              </small>
            </span>
            <input
              type="checkbox"
              checked={background}
              onChange={(e) => setBackground(e.target.checked)}
            />
          </label>
          {background && (
            <div className="background-controls">
              <label>
                {tr("Couleur")}
                <input
                  aria-label={tr("Supprimer une couleur de fond")}
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </label>
              <button
                aria-pressed={picking}
                onClick={() => setPicking(!picking)}
              >
                {tr(picking ? "Annuler la pipette" : "Pipette sur l’image")}
              </button>
              <label className="tolerance">
                {tr("Tolérance")} <output>{tolerance}</output>
                <input
                  aria-label={tr("Tolérance")}
                  type="range"
                  min="0"
                  max="150"
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                />
              </label>
            </div>
          )}
          <p className="import-notice" role="status">
            {notice}
          </p>
          <button className="apply-import" onClick={apply}>
            {tr("Appliquer à la feuille")}
          </button>
          <small className="import-help">
            {tr(
              "La détection vise les grilles droites et régulières. Une photo inclinée nécessite un redressement préalable.",
            )}
          </small>
        </>
      )}
    </section>
  );
}
