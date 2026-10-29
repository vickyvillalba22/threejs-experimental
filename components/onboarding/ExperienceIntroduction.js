"use client";

import { LEGEND_FRAGMENT_PATHS } from "@/components/progress/legendPaths";

export default function ExperienceIntroduction({ onContinue }) {
  return (
    <section
      className="experience-introduction"
      aria-labelledby="experience-introduction-title"
    >
      <div className="experience-introduction__atmosphere" aria-hidden="true" />

      <div className="experience-introduction__content">
        <p className="experience-introduction__eyebrow">CÓMO FUNCIONA LA EXPERIENCIA</p>
        <h2 id="experience-introduction-title" className="experience-introduction__title">
          Reconstruye la figura de Legend
        </h2>

        <div className="experience-introduction__demo" aria-hidden="true">
          <div className="experience-introduction__object experience-introduction__object--one">✦</div>
          <div className="experience-introduction__object experience-introduction__object--two">◇</div>
          <div className="experience-introduction__object experience-introduction__object--three">✧</div>
          <svg viewBox="0 0 106 168" className="experience-introduction__figure">
            {LEGEND_FRAGMENT_PATHS.map((path, index) => (
              <path
                key={path}
                d={path}
                pathLength="1"
                className="experience-introduction__fragment"
                style={{ animationDelay: `${700 + index * 260}ms` }}
              />
            ))}
          </svg>
        </div>

        <div className="experience-introduction__copy">
          <p>Explora las escenas y encuentra los objetos ocultos.</p>
          <p>Cada objeto correcto hará visible un fragmento de Legend.</p>
          <p>Cuando la figura esté completa, sabrás quién es.</p>
        </div>

        <div className="experience-introduction__actions">
          <button type="button" onClick={onContinue}>
            ABRIR LA INVITACIÓN
          </button>
          <button type="button" className="experience-introduction__skip" onClick={onContinue}>
            SALTAR INTRODUCCIÓN
          </button>
        </div>
      </div>
    </section>
  );
}
