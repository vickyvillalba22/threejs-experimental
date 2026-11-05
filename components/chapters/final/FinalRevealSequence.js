"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  LEGEND_FRAGMENT_ACCENT_PATHS,
  LEGEND_FRAGMENT_PATHS,
} from "@/components/progress/legendPaths";
import styles from "./FinalRevealSequence.module.css";

const REVEAL_START_DELAY = 350;
const REVEAL_STEP_DELAY = 320;
const COMPLETION_PAUSE = 2600;
const IDENTITY_COPY =
  "Conocido también como el Príncipe Dante o Dante Thiago Alejandro Marrero Santos, es el enigmático Gran Maestro de Caraval y soberano de la Isla de los Sueños. Este antiguo inmortal de especie humana domina el arte de la magia. Poseedor de un poder mágico extraordinario y una presencia tan cautivadora como descarada, teje ilusiones y desafía los límites entre el deseo y la realidad, liderando el espectáculo más deslumbrante y peligroso jamás concebido.";

function Fragment({ index, isRevealed }) {
  return (
    <g
      className={isRevealed ? styles.fragment : styles.guide}
      style={isRevealed ? { animationDelay: `${index * 70}ms` } : undefined}
      aria-hidden="true"
    >
      <path className={styles.facets} d={LEGEND_FRAGMENT_PATHS[index]} />
      <path className={styles.contour} d={LEGEND_FRAGMENT_ACCENT_PATHS[index]} />
    </g>
  );
}

function ProgressStage({ revealedCount }) {
  const isComplete = revealedCount === LEGEND_FRAGMENT_PATHS.length;

  return (
    <section
      className={styles.progressStage}
      aria-live="polite"
      aria-label="Revelación de la identidad de Legend"
    >
      <p className={styles.eyebrow}>ARCHIVO DE CARAVAL · FINAL A</p>
      <h1 className={styles.title}>
        {isComplete ? "La identidad ha sido revelada" : "Reconstruyendo la figura"}
      </h1>
      <svg
        className={styles.figure}
        viewBox="0 0 160 260"
        role="img"
        aria-label={`${revealedCount} de ${LEGEND_FRAGMENT_PATHS.length} fragmentos revelados`}
      >
        {LEGEND_FRAGMENT_PATHS.map((_, index) => (
          <Fragment
            key={index}
            index={index}
            isRevealed={index < revealedCount}
          />
        ))}
      </svg>
      <p className={styles.copy}>
        {isComplete
          ? "Has reunido todos los fragmentos y descubierto la identidad de Legend."
          : `Fragmentos descubiertos: ${revealedCount} / ${LEGEND_FRAGMENT_PATHS.length}`}
      </p>
    </section>
  );
}

function IdentityStage({ onContinue }) {
  const [isContinueVisible, setIsContinueVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsContinueVisible(true), 1050);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className={styles.identityStage} aria-labelledby="legend-reveal-title">
      <div className={styles.imageFrame}>
        <Image
          src="/imgs/legend.jpeg"
          alt="Retrato de Legend"
          fill
          priority
          sizes="(max-width: 640px) 76vw, 340px"
          className={styles.image}
        />
      </div>
      <div className={styles.identityCopy}>
        <p className={styles.eyebrow}>LA IDENTIDAD DE LEGEND</p>
        <h1 id="legend-reveal-title" className={styles.title}>
          Legend
        </h1>
        <p className={styles.paragraph}>{IDENTITY_COPY}</p>
        <button
          type="button"
          className={`${styles.continueButton} ${isContinueVisible ? styles.continueButtonVisible : ""}`}
          onClick={onContinue}
          disabled={!isContinueVisible}
        >
          Continuar
        </button>
      </div>
    </section>
  );
}

export default function FinalRevealSequence({ onContinue }) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [isIdentityVisible, setIsIdentityVisible] = useState(false);

  useEffect(() => {
    const timers = LEGEND_FRAGMENT_PATHS.map((_, index) =>
      window.setTimeout(
        () => setRevealedCount(index + 1),
        REVEAL_START_DELAY + index * REVEAL_STEP_DELAY,
      ),
    );
    const identityTimer = window.setTimeout(
      () => setIsIdentityVisible(true),
      REVEAL_START_DELAY
        + LEGEND_FRAGMENT_PATHS.length * REVEAL_STEP_DELAY
        + COMPLETION_PAUSE,
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(identityTimer);
    };
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={`${styles.stage} ${isIdentityVisible ? styles.stageHidden : ""}`}>
        <ProgressStage revealedCount={revealedCount} />
      </div>
      {isIdentityVisible && (
        <div className={styles.stage}>
          <IdentityStage onContinue={onContinue} />
        </div>
      )}
    </div>
  );
}
