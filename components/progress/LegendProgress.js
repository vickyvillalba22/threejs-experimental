"use client";

import { useMemo } from "react";
import { LEGEND_FRAGMENT_COUNT, useProgress } from "@/hooks/useProgress";

// The silhouette is intentionally divided into eight independent wireframe
// fragments. Scene-specific objects decide which status each fragment receives.
const FRAGMENT_PATHS = [
  "M44 18 L66 18 L78 30 L70 44 L40 44 L32 30 Z M44 18 L40 8 L66 8 L66 18",
  "M40 48 L72 48 L78 72 L70 92 L42 92 L34 72 Z",
  "M42 52 L70 52 M40 62 L72 62 M38 72 L74 72 M42 82 L70 82",
  "M34 50 L18 62 L8 92 L20 96 L38 72",
  "M72 50 L88 62 L98 92 L86 96 L68 72",
  "M42 92 L34 122 L38 160 L52 160 L56 126",
  "M64 92 L72 122 L68 160 L54 160 L50 126",
  "M48 56 L56 64 L64 56 M48 108 L56 116 L64 108 M56 116 L56 150",
];

function Wireframe({ status, index }) {
  const isVisible = Boolean(status);

  return (
    <path
      d={FRAGMENT_PATHS[index]}
      className={isVisible ? "legend-progress__fragment" : "legend-progress__guide"}
      style={
        isVisible
          ? {
              animationDelay: `${index * 70}ms`,
              color: status === "incorrect" ? "#e04b58" : "#f2f2f2",
            }
          : undefined
      }
      pathLength="1"
      aria-hidden="true"
    />
  );
}

export default function LegendProgress() {
  const { fragments, ready } = useProgress();
  const fragmentsByIndex = useMemo(
    () => new Map(fragments.map((fragment) => [fragment.index, fragment.status])),
    [fragments],
  );

  if (!ready) return null;

  return (
    <aside className="legend-progress" aria-label="Progreso de la figura de Legend">
      <div className="legend-progress__header">
        <span>FIGURA DE LEGEND</span>
        <span>
          {fragments.length} / {LEGEND_FRAGMENT_COUNT}
        </span>
      </div>
      <svg
        className="legend-progress__figure"
        viewBox="0 0 106 168"
        role="img"
        aria-label={`${fragments.length} de ${LEGEND_FRAGMENT_COUNT} fragmentos revelados`}
      >
        {FRAGMENT_PATHS.map((_, index) => (
          <Wireframe
            key={`guide-${index}`}
            index={index}
            status={fragmentsByIndex.get(index)}
          />
        ))}
      </svg>
      <p className="legend-progress__caption">
        {fragments.length === 0
          ? "La silueta permanece oculta."
          : fragments.length === LEGEND_FRAGMENT_COUNT
            ? "La figura ha sido revelada."
            : "Cada fragmento puede revelar una verdad distinta."}
      </p>
    </aside>
  );
}
