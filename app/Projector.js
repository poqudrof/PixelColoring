"use client";
import { useEffect, useRef, useState } from "react";
import { PALETTE, colorName } from "../lib/coloring.js";
import { homography, cssHomography } from "../lib/homography.js";
const initial = [
  { x: 0.15, y: 0.15 },
  { x: 0.85, y: 0.15 },
  { x: 0.85, y: 0.85 },
  { x: 0.15, y: 0.85 },
];
const EN = {
  Projecteur: "Projector",
  "Noms des couleurs": "Color names",
  Grille: "Grid",
  "Masquer les poignées": "Hide handles",
  "Ajuster les 4 coins": "Adjust 4 corners",
  Réinitialiser: "Reset",
  "Quitter le plein écran": "Exit fullscreen",
  "Plein écran": "Fullscreen",
  Fermer: "Close",
};
export default function Projector({ model, onClose, locale = "fr" }) {
  const tr = (value) => (locale === "en" ? EN[value] || value : value);
  const root = useRef(),
    stage = useRef(),
    initialized = useRef(false),
    [size, setSize] = useState({ width: 1, height: 1 }),
    [corners, setCorners] = useState(initial),
    [adjust, setAdjust] = useState(true),
    [labels, setLabels] = useState(true),
    [grid, setGrid] = useState(true),
    [message, setMessage] = useState(""),
    [fullscreen, setFullscreen] = useState(false);
  function reset(width = size.width, height = size.height) {
    const side = Math.min(width, height) * 0.75,
      left = (width - side) / 2 / width,
      top = (height - side) / 2 / height;
    setCorners([
      { x: left, y: top },
      { x: 1 - left, y: top },
      { x: 1 - left, y: 1 - top },
      { x: left, y: 1 - top },
    ]);
    setMessage("");
  }
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
      if (!initialized.current && width && height) {
        initialized.current = true;
        reset(width, height);
      }
    });
    observer.observe(stage.current);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const changed = () =>
      setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", changed);
    return () => {
      observer.disconnect();
      document.body.style.overflow = old;
      document.removeEventListener("fullscreenchange", changed);
    };
  }, []);
  function updateCorner(index, p) {
    const proposed = corners.map((value, i) => (i === index ? p : value));
    try {
      homography(proposed);
      setCorners(proposed);
      setMessage("");
    } catch {
      setMessage(
        locale === "en"
          ? "Keep the four corners in order without crossing them."
          : "Gardez les quatre coins dans l’ordre, sans les croiser.",
      );
    }
  }
  function move(event, index) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = stage.current.getBoundingClientRect();
    updateCorner(index, {
      x: Math.max(
        0.005,
        Math.min(0.995, (event.clientX - rect.left) / rect.width),
      ),
      y: Math.max(
        0.005,
        Math.min(0.995, (event.clientY - rect.top) / rect.height),
      ),
    });
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === root.current)
        await document.exitFullscreen();
      else if (root.current.requestFullscreen)
        await root.current.requestFullscreen();
      else
        setMessage(
          locale === "en"
            ? "Fullscreen is unavailable in this browser. You can enlarge the window."
            : "Le plein écran n’est pas disponible dans ce navigateur. Vous pouvez agrandir la fenêtre.",
        );
    } catch {
      setMessage(
        locale === "en"
          ? "The browser refused fullscreen. Enlarge the window to project."
          : "Le navigateur a refusé le plein écran. Agrandissez la fenêtre pour projeter.",
      );
    }
  }
  async function close() {
    if (document.fullscreenElement === root.current)
      await document.exitFullscreen();
    onClose();
  }
  const cell = 1000 / Math.max(model.width, model.height),
    left = (1000 - cell * model.width) / 2,
    top = (1000 - cell * model.height) / 2;
  return (
    <div
      className="projector"
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={locale === "en" ? "Projector mode" : "Mode Projecteur"}
    >
      <div className="projector-toolbar">
        <strong>▦ {tr("Projecteur")}</strong>
        <label>
          <input
            type="checkbox"
            checked={labels}
            onChange={(e) => setLabels(e.target.checked)}
          />{" "}
          {tr("Noms des couleurs")}
        </label>
        <label>
          <input
            type="checkbox"
            checked={grid}
            onChange={(e) => setGrid(e.target.checked)}
          />{" "}
          {tr("Grille")}
        </label>
        <button onClick={() => setAdjust(!adjust)}>
          {tr(adjust ? "Masquer les poignées" : "Ajuster les 4 coins")}
        </button>
        {adjust && (
          <button onClick={() => reset()}>{tr("Réinitialiser")}</button>
        )}
        <button onClick={toggleFullscreen}>
          {tr(fullscreen ? "Quitter le plein écran" : "Plein écran")}
        </button>
        <button onClick={close}>{tr("Fermer")}</button>
      </div>
      <div className="projector-stage" ref={stage}>
        <svg
          className="projector-board"
          width="1000"
          height="1000"
          viewBox="0 0 1000 1000"
          role="img"
          aria-label={
            locale === "en"
              ? "Colored grid to project"
              : "Grille colorée à projeter"
          }
          style={{ transform: cssHomography(corners, size.width, size.height) }}
        >
          <rect width="1000" height="1000" fill="white" />
          {model.cells.map((id, i) => {
            const x = left + (i % model.width) * cell,
              y = top + Math.floor(i / model.width) * cell,
              p = id ? PALETTE[id - 1] : null,
              dark =
                p &&
                p.rgb.reduce((s, c, j) => s + c * [0.299, 0.587, 0.114][j], 0) <
                  145;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={cell}
                  height={cell}
                  fill={p ? p.hex : "white"}
                  stroke={grid ? "#636363" : "none"}
                  strokeWidth={cell * 0.025}
                />
                {labels && p && (
                  <text
                    x={x + cell / 2}
                    y={y + cell / 2}
                    dominantBaseline="central"
                    textAnchor="middle"
                    fontFamily="Arial"
                    fontWeight="bold"
                    fontSize={Math.min(
                      cell * 0.25,
                      (cell * 0.82) / (colorName(p, locale).length * 0.62),
                    )}
                    fill={dark ? "white" : "#171717"}
                  >
                    {colorName(p, locale)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {adjust && (
          <>
            <svg
              className="projector-outline"
              aria-hidden="true"
              width="100%"
              height="100%"
            >
              <polygon
                points={corners
                  .map((p) => `${p.x * size.width},${p.y * size.height}`)
                  .join(" ")}
                fill="none"
                stroke="#e6b347"
                strokeWidth="2"
                strokeDasharray="7 5"
              />
            </svg>
            {corners.map((p, i) => (
              <button
                key={i}
                className="projector-corner"
                aria-label={`${locale === "en" ? "Corner" : "Coin"} ${(locale === "en" ? ["top left", "top right", "bottom right", "bottom left"] : ["haut gauche", "haut droit", "bas droit", "bas gauche"])[i]}`}
                style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => move(e, i)}
                onPointerUp={(e) =>
                  e.currentTarget.releasePointerCapture(e.pointerId)
                }
                onKeyDown={(e) => {
                  const vectors = {
                      ArrowLeft: [-1, 0],
                      ArrowRight: [1, 0],
                      ArrowUp: [0, -1],
                      ArrowDown: [0, 1],
                    },
                    v = vectors[e.key];
                  if (v) {
                    e.preventDefault();
                    const step = e.shiftKey ? 0.01 : 0.001;
                    updateCorner(i, {
                      x: Math.max(0.005, Math.min(0.995, p.x + v[0] * step)),
                      y: Math.max(0.005, Math.min(0.995, p.y + v[1] * step)),
                    });
                  }
                }}
              >
                {i + 1}
              </button>
            ))}
          </>
        )}
        {adjust && (
          <p className="projector-help">
            {locale === "en"
              ? "Move the 4 corners to the markers on your surface. Use the arrow keys for fine adjustment."
              : "Déplacez les 4 coins vers les repères de votre support. Les flèches du clavier permettent un réglage fin."}
          </p>
        )}
        {message && (
          <p className="projector-message" role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
