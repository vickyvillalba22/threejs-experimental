"use client";

import { useMemo } from "react";
import { LEGEND_FRAGMENT_COUNT, useProgress } from "@/hooks/useProgress";
import {
  LEGEND_FRAGMENT_ACCENT_PATHS,
  LEGEND_FRAGMENT_PATHS,
} from "@/components/progress/legendPaths";

function Wireframe({ status, index }) {
  const isVisible = Boolean(status);

  return (
    <g
      className={isVisible ? "legend-progress__fragment" : "legend-progress__guide"}
      style={
        isVisible
          ? {
              animationDelay: `${index * 70}ms`,
               color: "#f2f2f2",
            }
          : undefined
      }
      aria-hidden="true"
    >
      <path className="legend-progress__facets" d={LEGEND_FRAGMENT_PATHS[index]} />
      <path className="legend-progress__contour" d={LEGEND_FRAGMENT_ACCENT_PATHS[index]} />
    </g>
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
        viewBox="0 0 160 260"
        role="img"
        aria-label={`${fragments.length} de ${LEGEND_FRAGMENT_COUNT} fragmentos revelados`}
      >
        {LEGEND_FRAGMENT_PATHS.map((_, index) => (
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
