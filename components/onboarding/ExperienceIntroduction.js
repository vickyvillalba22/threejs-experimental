"use client";

const DEMO_FRAGMENT_PATHS = [
  "M44 18 L66 18 L78 30 L70 44 L40 44 L32 30 Z",
  "M40 48 L72 48 L78 72 L70 92 L42 92 L34 72 Z",
  "M34 50 L18 62 L8 92 L20 96 L38 72",
  "M72 50 L88 62 L98 92 L86 96 L68 72",
  "M42 92 L34 122 L38 160 L52 160 L56 126",
  "M64 92 L72 122 L68 160 L54 160 L50 126",
  "M42 52 L70 52 M40 62 L72 62 M38 72 L74 72",
  "M48 108 L56 116 L64 108 M56 116 L56 150",
];

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
            {DEMO_FRAGMENT_PATHS.map((path, index) => (
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
