"use client";

import {
  LEGEND_FRAGMENT_ACCENT_PATHS,
  LEGEND_FRAGMENT_PATHS,
} from "@/components/progress/legendPaths";
import styles from "./ExperienceIntroduction.module.css";

export default function ExperienceIntroduction({ onContinue }) {
  return (
    <section
      className={styles.experienceIntroduction}
      aria-labelledby="experience-introduction-title"
    >
      <div className={styles.atmosphere} aria-hidden="true" />

      <div className={styles.content}>
        <p className={styles.eyebrow}>CÓMO FUNCIONA LA EXPERIENCIA</p>
        <h2 id="experience-introduction-title" className={styles.title}>
          Reconstruye la figura de Legend
        </h2>

        <div className={styles.demo} aria-hidden="true">
          <div className={`${styles.object} ${styles.objectOne}`}>✦</div>
          <div className={`${styles.object} ${styles.objectTwo}`}>◇</div>
          <div className={`${styles.object} ${styles.objectThree}`}>✧</div>
          <svg viewBox="0 0 160 260" className={styles.figure}>
            {LEGEND_FRAGMENT_PATHS.map((path, index) => (
              <g
                key={path}
                className={styles.fragment}
                style={{ animationDelay: `${700 + index * 260}ms` }}
              >
                <path className={styles.facets} d={path} />
                <path className={styles.contour} d={LEGEND_FRAGMENT_ACCENT_PATHS[index]} />
              </g>
            ))}
          </svg>
        </div>

        <div className={styles.copy}>
          <p>Explora las escenas y encuentra los objetos ocultos.</p>
          <p>Cada objeto correcto hará visible un fragmento de Legend.</p>
          <p>Cuando la figura esté completa, obtendrás tu premio.</p>
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={onContinue}>
            Continuar
          </button>
          <button type="button" className={styles.skip} onClick={onContinue}>
            Saltar introducción
          </button>
        </div>
      </div>
    </section>
  );
}
